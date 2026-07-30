/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 19 SQL proti SKUTEČNÉMU PostgreSQL — hardening ze externího
   bezpečnostního review (2026-07). Fáze je UŽ NASAZENÁ v produkci, ale
   nikdy nebyla strojově ověřená; její dvě tvrzení se tady dokazují:

     1) leaderboard() přežije podvržené `xp`/`level` v žákovském save
        (dřív `(data->>'xp')::int` shodil žebříček CELÉ třídě = DoS)
        a ukazuje jen clampnuté hodnoty.
     2) tower_submit() nepřijme absurdní patro (strop 60), takže se do
        trvalé síně slávy nedá zapsat vymyšlený rekord.

   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');

const PHASE = path.join(__dirname, '..', 'projects', 'rpg-cloud-setup-phase19.sql');
const ME    = 'aaaaaaaa-0000-0000-0000-00000000000a';   // já (přihlášený žák)
const MATE  = 'aaaaaaaa-0000-0000-0000-00000000000b';   // spolužák
const ALIEN = 'aaaaaaaa-0000-0000-0000-00000000000c';    // cizí žák (jiná třída)
const CLS   = '11111111-1111-1111-1111-111111111111';
const CLS2  = '22222222-2222-2222-2222-222222222222';

let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c) { console.log('  ✅ '+n); pass++; } else { console.log('  ❌ '+n+(d?' — '+d:'')); fail++; } };

// minimální schéma, na kterém fáze 19 stojí
const STUBS = H.AUTH_STUB + `
create table public.saves(
  user_id uuid, game text, name text, full_name text, data jsonb,
  primary key (user_id, game));
create table public.class_members(class_id uuid, user_id uuid);
create table public.tower_runs(
  user_id uuid, game text, season text, best_floor int, runs int,
  updated_at timestamptz, primary key (user_id, game, season));
-- věž: prázdniny a sezóna (fáze 17) + kontrola ročníku (fáze 11).
-- Ve testu je řídíme přes GUC, ať jde ověřit i backstop o prázdninách.
create or replace function public._tower_open() returns boolean language sql stable as $$
  select coalesce(current_setting('test.tower_open', true), 'on') <> 'off' $$;
create or replace function public._season_label() returns text language sql stable as $$
  select '25/26'::text $$;
create or replace function public.tower_eligible(p_game text) returns boolean language sql stable as $$
  select coalesce(current_setting('test.eligible', true), 'on') <> 'off' $$;
`;

const DATA = `
insert into public.class_members values ('${CLS}','${ME}'), ('${CLS}','${MATE}'), ('${CLS2}','${ALIEN}');
-- spolužák s NORMÁLNÍM save
insert into public.saves values ('${MATE}','RPG_MAT_9','Bořek',null,'{"xp":1200,"level":8}');
-- cizí žák (jiná třída) — nesmí být v mém žebříčku
insert into public.saves values ('${ALIEN}','RPG_MAT_9','Cizí',null,'{"xp":9999,"level":50}');
-- já, jméno jen ve full_name (ověří fallback)
insert into public.saves values ('${ME}','RPG_MAT_9',null,'Já Sám','{"xp":300,"level":3}');
`;

(function main(){
  console.log('\n── Fáze 19 SQL: leaderboard + tower_submit proti skutečnému PostgreSQL ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: '+why+'\n'); process.exit(0); }

  try {
    H.start('pgtest19');
    H.exec(STUBS);
    let created = true, err = '';
    try { H.file(PHASE); } catch (e) { created = false; err = String(e.stderr||e.message||e).slice(0,200); }
    ok('phase19.sql se spustí bez chyby', created, err);
    if (!created) return;
    H.exec(DATA);

    const asMe = (sql) => `set test.uid='${ME}'; ` + sql;
    // rows() štípe výstup podle „|", takže sloupce vybírej samostatně
    // (ne ručně slepené do jednoho — to by se rozsekalo dvakrát).
    const board = () => H.rows(asMe(
      `select display_name, xp, lvl, is_me from public.leaderboard('RPG_MAT_9')`));

    // ── 1) normální provoz ──
    let b = board();
    ok('žebříček vrací spolužáky i mě', b.length===2, 'řádků: '+b.length);
    ok('cizí žák z jiné třídy NENÍ v žebříčku', !H.q(asMe(`select string_agg(display_name,',') from public.leaderboard('RPG_MAT_9')`)).includes('Cizí'));
    ok('řazeno podle xp (spolužák 1200 před mnou 300)', b[0][0]==='Bořek', JSON.stringify(b[0]));
    ok('jméno má fallback na full_name', b.some(r=>r[0]==='Já Sám'), JSON.stringify(b));
    const mine = b.find(r=>r[0]==='Já Sám') || [];
    ok('is_me označí můj řádek', mine[3]==='t', JSON.stringify(b));
    ok('spolužákův řádek NENÍ is_me', (b.find(r=>r[0]==='Bořek')||[])[3]==='f');

    // ── 2) DoS z externího review: podvržené xp nesmí shodit žebříček ──
    const hostile = [
      [`'{"xp":"lol","level":"x"}'`,            'nečíselné xp/level'],
      [`'{"xp":"99999999999999999999","level":"99999999999"}'`, 'přetečení bigint'],
      [`'{"xp":-500,"level":-3}'`,               'negativní hodnoty'],
      [`'{"xp":{"a":1},"level":[2]}'`,           'objekt/pole místo čísla'],
      [`'{"xp":"1e9","level":"1.5"}'`,           'exponent / desetinné'],
      [`'{"xp":null,"level":null}'`,             'null hodnoty'],
      [`'{}'`,                                   'chybějící klíče'],
      [`'{"xp":" 12 ","level":" 3 "}'`,          'čísla s mezerami'],
      [`'{"xp":"0x10","level":"+5"}'`,           'hex / znaménko'],
    ];
    let survived = 0, sane = true, detail = '';
    for (const [json, label] of hostile) {
      H.exec(`update public.saves set data=${json}::jsonb where user_id='${MATE}'`);
      try {
        const r = H.rows(asMe(`select xp, lvl from public.leaderboard('RPG_MAT_9')`));
        survived++;
        // clamp: xp 0..1 000 000, level 1..9999 — vždy v mezích
        for (const [xpS, lvlS] of r) {
          const xp = Number(xpS), lvl = Number(lvlS);
          if (!(xp>=0 && xp<=1000000 && lvl>=1 && lvl<=9999)) { sane=false; detail=label+': '+xpS+'/'+lvlS; }
        }
      } catch (e) { detail = label+' → '+String(e.stderr||e.message).slice(0,90); }
    }
    ok('podvržené xp/level NESHODÍ žebříček (9 variant) — DoS z review zavřený',
      survived===hostile.length, survived+'/'+hostile.length+' '+detail);
    ok('hodnoty jsou vždy clampnuté (xp 0–1M, level 1–9999)', sane, detail);

    // konkrétní clamp: obří ale platné číslo se ořeže, ne zahodí
    H.exec(`update public.saves set data='{"xp":"999999999","level":"99999"}'::jsonb where user_id='${MATE}'`);
    const clamped = H.rows(asMe(`select xp, lvl from public.leaderboard('RPG_MAT_9') where display_name='Bořek'`))[0].join('/');
    ok('clamp: xp 999 999 999 → 1 000 000 a level 99 999 → 9 999', clamped==='1000000/9999', clamped);
    // nečíselné → bezpečné výchozí (xp 0, level 1), ne NULL
    H.exec(`update public.saves set data='{"xp":"lol"}'::jsonb where user_id='${MATE}'`);
    const dflt = H.rows(asMe(`select xp, lvl from public.leaderboard('RPG_MAT_9') where display_name='Bořek'`))[0].join('/');
    ok('nečíselné → výchozí xp 0 / level 1 (ne NULL)', dflt==='0/1', dflt);

    // ── 3) soukromí: bez přihlášení nevidím nic cizího ──
    ok('nepřihlášený (auth.uid() NULL) nedostane žádné řádky',
      H.q(`select count(*) from public.leaderboard('RPG_MAT_9')`)==='0');
    // soukromí: RPC vrací JEN 5 neškodných sloupců (žádné e-maily, žádný celý save)
    const cols = H.q(`select string_agg(a.attname, ',' order by a.attnum)
      from pg_proc p join unnest(p.proallargtypes, p.proargmodes, p.proargnames)
        with ordinality as a(typ, mode, attname, attnum) on true
      where p.proname='leaderboard' and a.mode='t'`);
    ok('žebříček vrací jen user_id/display_name/xp/lvl/is_me (žádné e-maily ani save)',
      cols==='user_id,display_name,xp,lvl,is_me', cols);

    // ── 4) tower_submit: strop patra ──
    H.exec(`update public.saves set data='{"xp":1200,"level":8}'::jsonb where user_id='${MATE}'`);
    const submit = (floor, pre='') => H.q(`set test.uid='${ME}'; ${pre} select public.tower_submit('RPG_MAT_9', ${floor})`);
    ok('platné patro se zapíše', submit(12)==='12');
    ok('opakování bere maximum (greatest), ne poslední', submit(7)==='12');
    ok('vyšší patro rekord posune', submit(20)==='20');
    ok('patro nad strop 60 je ODMÍTNUTO',
      /invalid floor/.test(H.expectFail(`set test.uid='${ME}'; select public.tower_submit('RPG_MAT_9', 500)`)||''));
    ok('patro 61 (těsně nad stropem) odmítnuto',
      /invalid floor/.test(H.expectFail(`set test.uid='${ME}'; select public.tower_submit('RPG_MAT_9', 61)`)||''));
    ok('patro 60 (na stropu) projde', submit(60)==='60');
    ok('negativní patro odmítnuto',
      /invalid floor/.test(H.expectFail(`set test.uid='${ME}'; select public.tower_submit('RPG_MAT_9', -5)`)||''));
    ok('NULL patro odmítnuto',
      /invalid floor/.test(H.expectFail(`set test.uid='${ME}'; select public.tower_submit('RPG_MAT_9', null)`)||''));
    ok('rekord v tabulce zůstal 60 (absurdní zápis se nikam nedostal)',
      H.q(`select best_floor from public.tower_runs where user_id='${ME}'`)==='60');

    // ── 5) brány věže: přihlášení, prázdniny, ročník ──
    ok('nepřihlášený nemůže odeslat patro',
      /not logged in/.test(H.expectFail(`select public.tower_submit('RPG_MAT_9', 5)`)||''));
    ok('o prázdninách RPC odmítne (backstop fáze 17)',
      /holiday/.test(H.expectFail(`set test.uid='${ME}'; set test.tower_open='off'; select public.tower_submit('RPG_MAT_9', 5)`)||''));
    ok('špatný ročník odmítnut (kontrola kohorty fáze 11)',
      /wrong grade/.test(H.expectFail(`set test.uid='${ME}'; set test.eligible='off'; select public.tower_submit('RPG_MAT_9', 5)`)||''));

    // ── 6) granty a definer ──
    ok('leaderboard je SECURITY DEFINER', H.q(`select prosecdef from pg_proc where proname='leaderboard'`)==='t');
    ok('tower_submit je SECURITY DEFINER', H.q(`select prosecdef from pg_proc where proname='tower_submit'`)==='t');
    ok('anon NEMÁ execute na leaderboard', H.q(`select has_function_privilege('anon','public.leaderboard(text)','execute')`)==='f');
    ok('anon NEMÁ execute na tower_submit', H.q(`select has_function_privilege('anon','public.tower_submit(text,int)','execute')`)==='f');
    ok('authenticated MÁ execute na leaderboard',
      H.q(`select has_function_privilege('authenticated','public.leaderboard(text)','execute')`)==='t');
    ok('authenticated MÁ execute na tower_submit',
      H.q(`select has_function_privilege('authenticated','public.tower_submit(text,int)','execute')`)==='t');

    // ── 7) idempotence ──
    let again = true; try { H.file(PHASE); } catch (e) { again = false; }
    ok('phase19.sql jde spustit znovu (create or replace)', again);
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
