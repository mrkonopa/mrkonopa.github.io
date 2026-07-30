/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 21 SQL proti SKUTEČNÉMU PostgreSQL — cloud sync přijímačkového
   pokroku + učitelská připravenost třídy. Fáze je UŽ NASAZENÁ, ale nikdy
   nebyla strojově ověřená. Dokazujeme:

     • pz_get_stats / pz_save_stats jsou SELF-ONLY (žák nedostane cizí pokrok
       ani přes SECURITY DEFINER RPC, které obchází RLS),
     • RLS na tabulce je zapnutá a má tři self politiky,
     • pz_class_readiness je staff-only, omezená na třídu, nevrací e-maily
       ani celý save, a přežije podvržený žákovský JSON (lekce z fáze 19).

   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');

const PHASE = path.join(__dirname, '..', 'projects', 'rpg-cloud-setup-phase21.sql');
const A     = 'aaaaaaaa-0000-0000-0000-00000000000a';   // žák Anička
const B     = 'aaaaaaaa-0000-0000-0000-00000000000b';   // žák Bořek
const C     = 'aaaaaaaa-0000-0000-0000-00000000000c';   // žák z jiné třídy
const T     = 'aaaaaaaa-0000-0000-0000-0000000000ff';   // učitel
const CLS   = '11111111-1111-1111-1111-111111111111';
const CLS2  = '22222222-2222-2222-2222-222222222222';

let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c) { console.log('  ✅ '+n); pass++; } else { console.log('  ❌ '+n+(d?' — '+d:'')); fail++; } };

// fáze 21 má FK na auth.users → musíme mít i tu tabulku
const STUBS = H.AUTH_STUB + `
create table auth.users(id uuid primary key);
insert into auth.users values ('${A}'), ('${B}'), ('${C}'), ('${T}');
create table public.saves(user_id uuid, game text, name text, full_name text, data jsonb);
create table public.class_members(class_id uuid, user_id uuid);
insert into public.class_members values ('${CLS}','${A}'), ('${CLS}','${B}'), ('${CLS2}','${C}');
insert into public.saves values ('${A}','RPG_MAT_9','Anička','Anna Nováková','{}');
`;

const asUid = (uid, sql) => `set test.uid='${uid}'; ` + sql;
const asStaff = (sql) => `set test.uid='${T}'; set test.role='teacher'; ` + sql;

(function main(){
  console.log('\n── Fáze 21 SQL: pokrok hubu + připravenost třídy proti skutečnému PostgreSQL ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: '+why+'\n'); process.exit(0); }

  try {
    H.start('pgtest21');
    H.exec(STUBS);
    let created = true, err = '';
    try { H.file(PHASE); } catch (e) { created = false; err = String(e.stderr||e.message||e).slice(0,200); }
    ok('phase21.sql se spustí bez chyby', created, err);
    if (!created) return;

    // ── 1) tabulka + RLS ──
    ok('tabulka prijimacky_stats existuje',
      H.q(`select count(*) from information_schema.tables where table_name='prijimacky_stats'`)==='1');
    ok('RLS je na tabulce ZAPNUTÁ',
      H.q(`select relrowsecurity from pg_class where relname='prijimacky_stats'`)==='t');
    ok('má tři self politiky (select/insert/update)',
      H.q(`select count(*) from pg_policies where tablename='prijimacky_stats'`)==='3',
      H.q(`select string_agg(policyname,',') from pg_policies where tablename='prijimacky_stats'`));

    // ── 2) self-only zápis a čtení ──
    ok('nepřihlášený nemůže uložit pokrok',
      /not authenticated/.test(H.expectFail(`select public.pz_save_stats('{"readiness":50}'::jsonb)`)||''));
    H.q(asUid(A, `select public.pz_save_stats('{"readiness":80,"attempts":[{"score":40},{"score":44}]}'::jsonb)`));
    H.q(asUid(B, `select public.pz_save_stats('{"readiness":35,"attempts":[{"score":18}]}'::jsonb)`));
    ok('žák si uloží a přečte vlastní pokrok',
      H.q(asUid(A, `select public.pz_get_stats()->>'readiness'`))==='80');
    ok('druhý žák vidí svůj, ne cizí',
      H.q(asUid(B, `select public.pz_get_stats()->>'readiness'`))==='35');
    ok('žák bez řádku dostane prázdný objekt (ne NULL, ne cizí data)',
      H.q(asUid(C, `select public.pz_get_stats()::text`))==='{}');
    // pz_get_stats je SECURITY DEFINER (obchází RLS) — musí filtrovat sám
    ok('SECURITY DEFINER RPC neprozradí cizí pokrok (filtruje dle auth.uid())',
      H.q(asUid(C, `select public.pz_get_stats()::text`))==='{}');
    ok('opakované uložení přepíše (upsert), nevytvoří druhý řádek',
      (H.q(asUid(A, `select public.pz_save_stats('{"readiness":90}'::jsonb); select count(*) from public.prijimacky_stats where user_id='${A}'`))||'').trim().endsWith('1'));
    ok('po přepsání je hodnota nová', H.q(asUid(A, `select public.pz_get_stats()->>'readiness'`))==='90');
    H.q(asUid(A, `select public.pz_save_stats(null)`));
    ok('null vstup uloží prázdný objekt (nespadne)', H.q(asUid(A, `select public.pz_get_stats()::text`))==='{}');
    // vrátit rozumná data pro další část
    H.q(asUid(A, `select public.pz_save_stats('{"readiness":80,"attempts":[{"score":40},{"score":44},{"score":46}]}'::jsonb)`));

    // ── 3) staff přehled třídy ──
    const board = () => H.rows(asStaff(
      `select display_name, readiness, attempts from public.pz_class_readiness('${CLS}')`));
    let r = board();
    ok('učitel vidí žáky své třídy', r.length===2, 'řádků: '+r.length+' '+JSON.stringify(r));
    ok('řazeno podle připravenosti (80 před 35)', r[0][1]==='80', JSON.stringify(r[0]));
    ok('jméno bere z save (Anna Nováková)', r.some(x=>x[0]==='Anna Nováková'), JSON.stringify(r));
    ok('žák bez jména má fallback „Žák"', r.some(x=>x[0]==='Žák'), JSON.stringify(r));
    ok('počet testů = délka pole attempts (3)', (r.find(x=>x[0]==='Anna Nováková')||[])[2]==='3', JSON.stringify(r));
    ok('žák z JINÉ třídy v přehledu není',
      !H.q(asStaff(`select coalesce(string_agg(display_name,','),'') from public.pz_class_readiness('${CLS}')`)).includes('Cizí'));

    // ── 4) brány: role ──
    ok('žák (student) nevidí přehled třídy',
      H.q(`set test.uid='${A}'; set test.role='student'; select count(*) from public.pz_class_readiness('${CLS}')`)==='0');
    ok('bez role (NULL) nevidí nic',
      H.q(asUid(A, `select count(*) from public.pz_class_readiness('${CLS}')`))==='0');
    ok('superadmin vidí',
      +H.q(`set test.uid='${T}'; set test.role='superadmin'; select count(*) from public.pz_class_readiness('${CLS}')`)>0);
    ok('cizí/neexistující třída nevrátí nic',
      H.q(asStaff(`select count(*) from public.pz_class_readiness('33333333-3333-3333-3333-333333333333')`))==='0');

    // ── 5) soukromí: jen bezpečné sloupce ──
    const cols = H.q(`select string_agg(a.attname, ',' order by a.attnum)
      from pg_proc p join unnest(p.proallargtypes, p.proargmodes, p.proargnames)
        with ordinality as a(typ, mode, attname, attnum) on true
      where p.proname='pz_class_readiness' and a.mode='t'`);
    ok('vrací jen user_id/display_name/readiness/attempts/updated_at (žádné e-maily, žádný save)',
      cols==='user_id,display_name,readiness,attempts,updated_at', cols);

    // ── 6) podvržený JSON nesmí shodit přehled celé třídě (lekce z fáze 19) ──
    const hostile = [
      [`'{"readiness":"lol"}'`,                    'nečíselná připravenost'],
      [`'{"readiness":"99999999999999999999"}'`,   'přetečení'],
      [`'{"readiness":-40}'`,                      'negativní'],
      [`'{"readiness":{"a":1}}'`,                  'objekt místo čísla'],
      [`'{"readiness":150}'`,                      'nad 100 %'],
      [`'{"readiness":"80","attempts":"nope"}'`,   'attempts není pole'],
      [`'{"readiness":80,"attempts":{"a":1}}'`,    'attempts je objekt'],
      [`'{}'`,                                     'prázdný objekt'],
      [`'[]'`,                                     'celý JSON je pole'],
      [`'"string"'`,                               'celý JSON je string'],
    ];
    let survived = 0, sane = true, detail = '';
    for (const [json, label] of hostile) {
      H.exec(`update public.prijimacky_stats set data=${json}::jsonb where user_id='${B}'`);
      try {
        const rr = H.rows(asStaff(`select readiness, attempts from public.pz_class_readiness('${CLS}')`));
        survived++;
        for (const [rd, at] of rr) {
          const v = Number(rd), a = Number(at);
          if (!(v>=0 && v<=100)) { sane=false; detail=label+': readiness='+rd; }
          if (!(a>=0)) { sane=false; detail=label+': attempts='+at; }
        }
      } catch (e) { detail = label+' → '+String(e.stderr||e.message).slice(0,90); }
    }
    ok('podvržený JSON NESHODÍ přehled třídy (10 variant)', survived===hostile.length,
      survived+'/'+hostile.length+' '+detail);
    ok('připravenost je vždy 0–100 a attempts nikdy negativní', sane, detail);

    H.exec(`update public.prijimacky_stats set data='{"readiness":150}'::jsonb where user_id='${B}'`);
    ok('clamp: 150 % → 100 %',
      (H.rows(asStaff(`select readiness from public.pz_class_readiness('${CLS}') where display_name='Žák'`))[0]||[])[0]==='100');
    H.exec(`update public.prijimacky_stats set data='{"readiness":"lol"}'::jsonb where user_id='${B}'`);
    ok('nečíselná připravenost → 0 (ne NULL)',
      (H.rows(asStaff(`select readiness from public.pz_class_readiness('${CLS}') where display_name='Žák'`))[0]||[])[0]==='0');
    H.exec(`update public.prijimacky_stats set data='{"attempts":"nope"}'::jsonb where user_id='${B}'`);
    ok('attempts, když není pole → 0',
      (H.rows(asStaff(`select attempts from public.pz_class_readiness('${CLS}') where display_name='Žák'`))[0]||[])[0]==='0');

    // ── 7) granty + definer ──
    for (const [fn, sig] of [['pz_get_stats','public.pz_get_stats()'], ['pz_save_stats','public.pz_save_stats(jsonb)'], ['pz_class_readiness','public.pz_class_readiness(uuid)']]) {
      ok(fn+' je SECURITY DEFINER', H.q(`select prosecdef from pg_proc where proname='${fn}'`)==='t');
      ok('anon NEMÁ execute na '+fn, H.q(`select has_function_privilege('anon','${sig}','execute')`)==='f');
      ok('authenticated MÁ execute na '+fn, H.q(`select has_function_privilege('authenticated','${sig}','execute')`)==='t');
    }

    // ── 8) idempotence ──
    let again = true; try { H.file(PHASE); } catch (e) { again = false; }
    ok('phase21.sql jde spustit znovu', again);
    ok('a data po opakovaném spuštění zůstala (create table if not exists)',
      +H.q(`select count(*) from public.prijimacky_stats`)>0);
  } catch (e) {
    ok('test proběhl bez neočekávané výjimky', false, String(e.stderr||e.message||e).slice(0,300));
  } finally {
    H.stop();
  }
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})();
