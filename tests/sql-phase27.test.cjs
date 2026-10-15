/* ═══════════════════════════════════════════════════════════════════════
   Test FÁZE 27 SQL proti SKUTEČNÉMU PostgreSQL — anonymní počítadlo přijímaček.

   Dvě věci jsou tu citlivé. (1) Zapisuje i NEPŘIHLÁŠENÝ žák, takže funkce nesmí jít zneužít: jen
   povolená jména událostí, žádný růst tabulky nad dny × události, žádný přímý přístup k tabulce.
   (2) Je to ANONYMNÍ počítadlo žáků mladších 15 let — tabulka proto nesmí mít jediný sloupec, do
   kterého by se dala uložit identita (hlídá se její tvar, ne jen to, že to „zatím nikdo nedělá").
   Čtení pro učitele používá bránu s coalesce: NULL role ji nesmí otevřít (fáze 23).

   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ═══════════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');
const P = f => path.join(__dirname, '..', 'projects', f);

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

const why = H.unavailable();
if (why) { console.log('⏭️ SKIP: ' + why); process.exit(0); }

(async () => {
  console.log('\n── Fáze 27: anonymní počítadlo přijímaček ──\n');
  H.start('pgtest27');
  try {
    H.exec(H.AUTH_STUB + 'grant usage on schema public to anon, authenticated;');
    H.file(P('rpg-cloud-setup-phase27.sql'));

    const cols = H.rows("select column_name||':'||data_type from information_schema.columns where table_schema='public' and table_name='pz_usage' order by ordinal_position").map(r => r[0]);
    ok('tabulka má jen den, událost a počet — žádný sloupec pro identitu', cols.join(',') === 'day:date,event:text,n:bigint', cols.join(','));

    // přímý přístup k tabulce je zavřený (RLS bez politik + žádná práva)
    for (const role of ['anon', 'authenticated']) {
      const priv = H.q(`select has_table_privilege('${role}','public.pz_usage','select') or has_table_privilege('${role}','public.pz_usage','insert')
        or has_table_privilege('${role}','public.pz_usage','update') or has_table_privilege('${role}','public.pz_usage','delete')`);
      ok(role + ': k tabulce nemá žádné právo', priv === 'f');
    }
    ok('RLS je zapnuté', H.q("select relrowsecurity from pg_class where oid='public.pz_usage'::regclass") === 't');
    ok('anon přímo nic nepřečte', /permission denied/i.test(H.expectFail('set role anon; select * from public.pz_usage') || ''));
    ok('anon přímo nic nezapíše', /permission denied/i.test(H.expectFail("set role anon; insert into public.pz_usage values (current_date,'vstup',999)") || ''));

    // zápis jako nepřihlášený i přihlášený žák
    H.exec("set role anon; select public.pz_event('test_start'); select public.pz_event('test_start'); select public.pz_event('vstup');");
    H.exec("set role authenticated; select public.pz_event('test_start');");
    const praha = H.q("select (now() at time zone 'Europe/Prague')::date");
    const r1 = H.rows("select day::text, event, n from public.pz_usage order by event");
    ok('anon i přihlášený zapisují: test_start 3×, vstup 1×', r1.length === 2 && r1[0].join() === `${praha},test_start,3` && r1[1].join() === `${praha},vstup,1`, JSON.stringify(r1));
    ok('den se počítá podle pražského času (ne UTC)', r1[0][0] === praha);

    // nesmysl se tiše zahodí a nic nevznikne
    const spatne = ["'neexistuje'", "''", 'null', "'test_start; drop table pz_usage'", "'VSTUP'", "' vstup'", "repeat('x',100000)", "'../../etc'"];   // (nulový znak PostgreSQL odmítne dřív, než se funkce zavolá)
    let vyjimka = null;
    for (const s of spatne) { try { H.exec(`set role anon; select public.pz_event(${s});`); } catch (e) { vyjimka = s + ' → ' + String(e.stderr || e.message).slice(0, 120); } }
    ok('neplatná jména se zahodí bez chyby (' + spatne.length + ' variant)', vyjimka === null, vyjimka || '');
    ok('neplatná jména nevytvořila žádný řádek', H.q('select count(*) from public.pz_usage') === '2');
    ok('tabulka po zasypání nesmysly stále existuje', H.q("select to_regclass('public.pz_usage') is not null") === 't');

    // všech šest povolených událostí
    for (const e of ['vstup', 'test_start', 'test_done', 'procvic', 'diag_done', 'konstrukce_check']) H.exec(`set role anon; select public.pz_event('${e}');`);
    ok('všech 6 povolených událostí se zapíše (řádků ' + H.q('select count(*) from public.pz_usage') + ')', H.q('select count(*) from public.pz_usage') === '6');

    // počítání: 200 volání = +200, tabulka neroste
    H.exec("set role anon; select public.pz_event('procvic') from generate_series(1,200);");
    ok('200 volání přičte 200 a nepřidá řádek', H.q("select n from public.pz_usage where event='procvic'") === '201' && H.q('select count(*) from public.pz_usage') === '6');

    // čtení pro učitele
    ok('anon souhrn nezavolá (právo)', H.q("select has_function_privilege('anon','public.pz_usage_summary(int)','execute')") === 'f');
    ok('veřejnost souhrn nezavolá (právo)', H.q("select has_function_privilege('public','public.pz_usage_summary(int)','execute')") === 'f');
    ok('žák souhrn nepřečte', /forbidden/.test(H.expectFail("set role authenticated; set test.role='student'; select * from public.pz_usage_summary(30)") || ''));
    ok('role bez záznamu (student) souhrn nepřečte', /forbidden/.test(H.expectFail("set role authenticated; set test.role=''; select * from public.pz_usage_summary()") || ''));
    for (const role of ['teacher', 'superadmin']) {
      const s = H.rows(`set role authenticated; set test.role='${role}'; select event, n from public.pz_usage_summary(30) order by event`);
      ok(role + ' souhrn přečte (6 událostí, test_start = 4)', s.length === 6 && s.some(r => r[0] === 'test_start' && r[1] === '4'), JSON.stringify(s));
    }
    // brána s coalesce: NULL role ji nesmí otevřít (`NULL not in (…)` je NULL, ne TRUE)
    H.exec("create or replace function public.my_role() returns text language sql stable as $$ select null::text $$;");
    ok('role NULL souhrn nepřečte (brána se tiše neotevře)', /forbidden/.test(H.expectFail("set role authenticated; select * from public.pz_usage_summary(30)") || ''));
    H.exec("create or replace function public.my_role() returns text language sql stable as $$ select coalesce(nullif(current_setting('test.role', true), ''), 'student') $$;");

    // okno dnů: starý den mimo okno; p_days se ořízne na 1–365; NULL = 30
    H.exec("insert into public.pz_usage values (current_date - 10, 'vstup', 5), (current_date - 400, 'vstup', 7)");
    const cnt = d => H.rows(`set role authenticated; set test.role='teacher'; select count(*) from public.pz_usage_summary(${d}) where n in (5,7)`)[0][0];
    ok('okno 30 dní zahrne den −10 a vynechá den −400', cnt(30) === '1');
    ok('okno 5 dní vynechá den −10', cnt(5) === '0');
    ok('okno 0 a záporné se ořízne na 1 den (nespadne)', cnt(0) === '0' && cnt(-5) === '0');
    ok('okno 100000 se ořízne na 365 dní (den −400 mimo)', cnt(100000) === '1');
    ok('okno NULL = výchozích 30 dní', cnt('null') === '1');

    // znovuspuštění fáze nic nerozbije a nesmaže počty
    const pred = H.q('select sum(n) from public.pz_usage');
    H.file(P('rpg-cloud-setup-phase27.sql'));
    ok('fáze je idempotentní: po opakovaném spuštění počty zůstaly', H.q('select sum(n) from public.pz_usage') === pred);
    ok('po opakovaném spuštění platí stejná práva', H.q("select has_table_privilege('anon','public.pz_usage','insert')") === 'f'
      && H.q("select has_function_privilege('anon','public.pz_event(text)','execute')") === 't');
  } finally { H.stop(); }
  console.log('\n  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { H.stop(); } catch (_) {} process.exit(1); });
