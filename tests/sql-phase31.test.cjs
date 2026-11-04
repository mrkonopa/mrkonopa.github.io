/* ═══════════════════════════════════════════════════════════════════
   FÁZE 31 (tower_board + look) proti SKUTEČNÉMU PostgreSQL.
   Žebříček Věže dostane čtvrtý sloupec `look jsonb` — ověřený vzhled
   z obchodu (stejný jako look_of, fáze 28). Dokazujeme:
     • vrací se `look`, NE user_id (Věž ukazuje celý ročník; cizí
       identifikátory žáků z jiných tříd do prohlížeče nepatří),
     • look vidí jen sebe, spolužák ze sdílené třídy a učitel; žák z jiné
       třídy téhož ročníku zůstává v žebříčku, ale bez vzhledu (NULL),
     • podvržená peněženka (nekoupená položka, cizí tvar JSON, HTML řetězec)
       vzhled nedá a žebříček nikdy nespadne,
     • pořadí, počet řádků a staré sloupce (display_name, best_floor, is_me)
       se nezměnily — starý klient čte sloupce podle jména,
     • anon funkci zavolat nesmí,
     • fáze je idempotentní (třikrát za sebou),
     • 7 sabotáží (zdroj fáze se mění jen v paměti, funkce se před tím dropne).

   Produkční pořadí: 11 → 17 → 19 → 23 → 28 → 31.
   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ═══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const H = require('./sql-harness.cjs');

const P = n => path.join(__dirname, '..', 'projects', `rpg-cloud-setup-phase${n}.sql`);
const A = 'aaaaaaaa-0000-0000-0000-000000000001';   // Anička — 9. ročník, třída 9.B
const B = 'aaaaaaaa-0000-0000-0000-000000000002';   // Bořek — spolužák (9.B)
const D = 'aaaaaaaa-0000-0000-0000-000000000004';   // Dáša — 9. ročník, ale JINÁ třída (9.C)
const E = 'aaaaaaaa-0000-0000-0000-000000000005';   // Evžen — 9.B, podvržená peněženka
const F = 'aaaaaaaa-0000-0000-0000-000000000006';   // Filip — 9.B, peněženka není objekt
const T = 'aaaaaaaa-0000-0000-0000-0000000000ff';   // učitel
const C9B = '11111111-1111-1111-1111-111111111111';
const C9C = '22222222-2222-2222-2222-222222222222';

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

const now = new Date();
const SY = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;

const wallet = (active, owned) => JSON.stringify({ cosmetics: { active, owned } });
const STUBS = H.AUTH_STUB + `
create schema if not exists auth;
create table auth.users(id uuid primary key);
insert into auth.users values ('${A}'),('${B}'),('${D}'),('${E}'),('${F}'),('${T}');
create table public.saves(user_id uuid, game text, name text, full_name text, data jsonb);
create table public.classes(id uuid primary key, name text, section text, cohort_start_year int, archived boolean default false);
create table public.class_members(class_id uuid, user_id uuid);
create table public.roles(email text primary key, role text);
insert into public.roles values ('ucitel@husovaliberec.cz','teacher');
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), '')) $$;
insert into public.classes values ('${C9B}','9.B','B',${SY - 3},false), ('${C9C}','9.C','C',${SY - 3},false);
insert into public.class_members values ('${C9B}','${A}'),('${C9B}','${B}'),('${C9B}','${E}'),('${C9B}','${F}'),('${C9C}','${D}');
insert into public.saves values
  ('${A}','RPG_MAT_9','Anička',null,'{}'),
  ('${B}','RPG_MAT_9','Bořek',null,'{}'),
  ('${D}','RPG_MAT_9','Dáša',null,'{}'),
  ('${E}','RPG_MAT_9','Evžen',null,'{}'),
  ('${F}','RPG_MAT_9','Filip',null,'{}');
-- peněženky (game = '_wallet')
insert into public.saves values
  ('${A}','_wallet',null,null,'${wallet({ border: 'border-gold', badge: 'badge-purple' }, ['border-gold', 'badge-purple'])}'),
  ('${B}','_wallet',null,null,'${wallet({ title: 'title-lovec', pet: 'pet-sova' }, ['title-lovec', 'pet-sova'])}'),
  ('${D}','_wallet',null,null,'${wallet({ border: 'border-gold', pet: 'pet-sova' }, ['border-gold', 'pet-sova'])}'),
  -- Evžen si do active napsal rám, který nekoupil, a HTML místo titulu
  ('${E}','_wallet',null,null,'${wallet({ border: 'border-legenda', title: '<img src=x onerror=alert(1)>' }, [])}'),
  -- Filipova peněženka má cosmetics jako řetězec
  ('${F}','_wallet',null,null,'{"cosmetics":"x"}');
`;

const asUid = (uid, sql) => `set test.uid='${uid}'; ` + sql;
const asStaff = sql => `set test.uid='${T}'; set test.role='teacher'; set test.email='ucitel@husovaliberec.cz'; ` + sql;
const OPEN = `create or replace function public._tower_open() returns boolean language sql stable as $$ select true $$;`;
const DOTAZ = `select display_name, best_floor, is_me::text, coalesce(look::text,'NULL') from public.tower_board('RPG_MAT_9')`;
const FUNKCE = 'public.tower_board(text)';

/* dotaz jako daný uživatel → [{jm, patro, ja, look}] */
function deska(sql) {
  return H.rows(sql).map(r => ({ jm: r[0], patro: r[1], ja: r[2], look: r[3] === 'NULL' ? null : JSON.parse(r[3]) }));
}

/* shoda vzhledu bez ohledu na pořadí klíčů (jsonb je řadí podle délky, ne podle zápisu) */
const stejny = (x, y) => !!x && !!y && JSON.stringify(Object.keys(x).sort().map(k => [k, x[k]])) === JSON.stringify(Object.keys(y).sort().map(k => [k, y[k]]));

/* sada kontrol; vrací počet nezdarů (pro sabotáže) */
function kontroly(tiche) {
  let n = 0;
  const c = (jm, cond, d) => { if (!cond) n++; if (!tiche) ok(jm, cond, d); };

  const sloupce = H.q(`select string_agg(a.attname, ',' order by a.attnum)
       from pg_proc p join unnest(p.proallargtypes, p.proargmodes, p.proargnames)
         with ordinality as a(typ, mode, attname, attnum) on true
       where p.proname='tower_board' and a.mode='t'`);
  c('žebříček vrací display_name, best_floor, is_me, look — a žádné user_id', sloupce === 'display_name,best_floor,is_me,look', sloupce);

  const a = deska(asUid(A, DOTAZ));
  c('Anička vidí všech 5 lezců', a.length === 5, JSON.stringify(a.map(r => r.jm)));
  c('pořadí je podle patra (50, 40, 30, 20, 10) — jako před fází 31',
    a.map(r => r.patro).join(',') === '50,40,30,20,10', a.map(r => r.patro).join(','));
  const od = jm => a.find(r => r.jm === jm) || {};
  c('is_me označí jen její řádek', a.filter(r => r.ja === 'true').map(r => r.jm).join() === 'Anička');
  c('vlastní vzhled vidí (rám + barva jména)', stejny(od('Anička').look, { badge: 'badge-purple', border: 'border-gold' }), JSON.stringify(od('Anička').look));
  c('vzhled spolužáka vidí (titul + mazlíček)', stejny(od('Bořek').look, { pet: 'pet-sova', title: 'title-lovec' }), JSON.stringify(od('Bořek').look));
  c('žák z JINÉ třídy je v žebříčku, ale bez vzhledu (NULL)', od('Dáša').patro === '50' && od('Dáša').look === null, JSON.stringify(od('Dáša')));
  c('nekoupená položka a HTML řetězec vzhled nedají (NULL)', od('Evžen').patro === '20' && od('Evžen').look === null, JSON.stringify(od('Evžen')));
  c('peněženka se špatným tvarem JSON žebříček neshodí (řádek je, vzhled NULL)', od('Filip').patro === '10' && od('Filip').look === null, JSON.stringify(od('Filip')));
  c('žádný řádek se nezdvojí (jméno jednou)', new Set(a.map(r => r.jm)).size === a.length);

  const d = deska(asUid(D, DOTAZ));
  c('Dáša vidí svůj vzhled, ale ne vzhled 9.B (jiná třída)',
    stejny((d.find(r => r.jm === 'Dáša') || {}).look, { border: 'border-gold', pet: 'pet-sova' }) &&
    ['Anička', 'Bořek'].every(j => (d.find(r => r.jm === j) || {}).look === null), JSON.stringify(d.map(r => [r.jm, r.look])));

  const t = deska(asStaff(DOTAZ));
  c('učitel vidí vzhled všech (i žáka z jiné třídy), ne podvržený',
    t.filter(r => r.look).map(r => r.jm).sort().join() === 'Anička,Bořek,Dáša', t.filter(r => r.look).map(r => r.jm).sort().join());

  c('nepřihlášený žebříček nevidí', H.q(`select count(*) from public.tower_board('RPG_MAT_9')`) === '0');
  c('starý klient: sloupce podle jména (display_name, best_floor, is_me) dál fungují',
    H.rows(asUid(A, `select display_name, best_floor, is_me from public.tower_board('RPG_MAT_9')`)).length === 5);
  c('anon funkci zavolat nesmí', H.q(`select has_function_privilege('anon','${FUNKCE}','execute')`) === 'f');
  c('authenticated ji zavolat smí', H.q(`select has_function_privilege('authenticated','${FUNKCE}','execute')`) === 't');
  const stav = H.rows(fs.readFileSync(path.join(__dirname, '..', 'tools', 'sql-stav-nasazeni.sql'), 'utf8').replace(/;\s*$/, ''))
    .find(r => /^fáze 31/.test(r[0]));
  c('kontrola nasazení (tools/sql-stav-nasazeni.sql) hlásí fázi 31 jako nasazenou', !!stav && stav[1] === 't', JSON.stringify(stav));
  c('security definer s pevným search_path', H.q(`select prosecdef::text || ' ' || coalesce(array_to_string(proconfig, ','),'') from pg_proc where proname='tower_board'`) === 'true search_path=public');
  return n;
}

(function main() {
  console.log('\n── Fáze 31: vzhled spolužáků v žebříčku Věže (tower_board.look) ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: ' + why + '\n'); process.exit(0); }
  const SQL31 = fs.readFileSync(P(31), 'utf8');

  try {
    H.start('pgphase31');
    H.exec(STUBS);
    for (const n of [11, 17, 19, 23, 28, 31]) {
      let good = true, err = '';
      try { H.file(P(n)); } catch (e) { good = false; err = String(e.stderr || e.message || e).slice(0, 180); }
      ok(`phase${n}.sql se spustí bez chyby`, good, err);
      if (!good) return;
    }
    H.exec(OPEN);
    // lezci: Dáša 50, Anička 40, Bořek 30, Evžen 20, Filip 10
    for (const [u, f] of [[D, 50], [A, 40], [B, 30], [E, 20], [F, 10]]) H.q(asUid(u, `select public.tower_submit('RPG_MAT_9', ${f})`));

    kontroly(false);

    let idem = true;
    try { H.file(P(31)); H.file(P(31)); H.file(P(31)); } catch (e) { idem = false; }
    ok('fáze 31 je idempotentní (třikrát za sebou)', idem);
    ok('po opakování jsou všechny kontroly dál zelené', kontroly(true) === 0);

    console.log('\n── Sabotáže ──');
    const SAB = [
      ['vzhled vidí každý (podmínka je vždy pravdivá)', s => s.replace('when t.user_id = auth.uid()', 'when true or t.user_id = auth.uid()')],
      ['učitel cizí vzhled nevidí', s => s.replace("or (select public.my_role()) in ('teacher', 'superadmin')", 'or false')],
      ['spolužák vzhled nevidí', s => s.replace('and other.user_id = t.user_id', 'and false')],
      ['vzhled bez ověření peněženky (syrový JSON)', s => s.replace("nullif(public._look_z_penezenky(w.data), '{}'::jsonb)", "(w.data -> 'cosmetics' -> 'active')")],
      ['vrací user_id (cizí identifikátory ven)', s => s.replace('is_me boolean, look jsonb)', 'is_me boolean, look jsonb, user_id uuid)').replace('end as look', 'end as look, t.user_id')],
      ['funkci smí volat i anon', s => s.replace('to authenticated;', 'to authenticated, anon;')],
      ['peněženka se hledá u špatné hry', s => s.replace("w.game = '_wallet'", 'w.game = t.game')]
    ];
    for (const [jm, fn] of SAB) {
      const nove = fn(SQL31);
      if (nove === SQL31) { ok('sabotáž se neaplikovala: ' + jm, false); continue; }
      let n = -1;
      try {
        H.exec(`drop function if exists ${FUNKCE};`);
        H.exec(nove);
        n = kontroly(true);
      } catch (e) { n = 1; }
      ok('sabotáž chycena: ' + jm + ' (' + n + ' nezdarů)', n > 0);
    }
    H.exec(`drop function if exists ${FUNKCE};`);
    H.file(P(31));
    ok('po sabotážích je obnovená původní verze (všechny kontroly zelené)', kontroly(true) === 0);
  } catch (e) {
    console.log('  ❌ výjimka testu: ' + String(e.stderr || e.message || e).slice(0, 500) + (e.stack ? '\n' + String(e.stack).split('\n').slice(0, 6).join('\n') : '')); fail++;
  } finally { H.stop(); }

  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: ' + pass + ' ✅  /  ' + fail + ' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
