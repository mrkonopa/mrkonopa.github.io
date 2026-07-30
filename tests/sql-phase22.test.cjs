/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 22 SQL — pz_class_topics proti SKUTEČNÉMU PostgreSQL.
   Nad dočasným klastrem se vytvoří minimální stuby, spustí se phase22.sql
   a ověří se: správnost agregace, odolnost proti podvrženému žákovskému
   JSONu (lekce z fáze 19 — jeden save nesmí shodit dotaz celé třídě),
   allowlist okruhů (anti-flood), staff gate a odvolaný anon.

   Klastr řeší společný tests/sql-harness.cjs; SKIP (exit 0), když
   v prostředí PostgreSQL server není — test je tím bezpečný i v CI.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');

const PHASE = path.join(__dirname, '..', 'projects', 'rpg-cloud-setup-phase22.sql');
const CLASS = '11111111-1111-1111-1111-111111111111';
const REAL_TOPICS = ['vyrazy-mocniny','zlomky','procenta','pomer','vyrazy-promenna',
                     'rovnice','slovni','geometrie','telesa','data'];

let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c) { console.log('  ✅ '+n); pass++; } else { console.log('  ❌ '+n+(d?' — '+d:'')); fail++; } };

const STUBS = H.AUTH_STUB + `
create table public.prijimacky_stats(user_id uuid primary key, data jsonb, updated_at timestamptz default now());
create table public.class_members(class_id uuid, user_id uuid);
create table public.saves(user_id uuid, full_name text);
`;

// 2 slušní žáci + 3 nepřátelské savy ve stejné třídě
const DATA_SQL = `
insert into public.class_members
 select '${CLASS}'::uuid, ('aaaaaaaa-0000-0000-0000-00000000000'||i)::uuid from generate_series(1,5) i;

insert into public.prijimacky_stats values ('aaaaaaaa-0000-0000-0000-000000000001',
 '{"practice":{"rovnice":{"ok":5,"total":10},"procenta":{"ok":9,"total":10}},
   "test":{"rovnice":{"ok":0,"total":4},"procenta":{"ok":2,"total":4}}}'::jsonb);
insert into public.prijimacky_stats values ('aaaaaaaa-0000-0000-0000-000000000002',
 '{"practice":{"rovnice":{"ok":3,"total":10}},"test":{"rovnice":{"ok":1,"total":4}}}'::jsonb);
-- practice je POLE, test je STRING → naivní jsonb_each() by spadl
insert into public.prijimacky_stats values ('aaaaaaaa-0000-0000-0000-000000000003',
 '{"practice":[1,2,3],"test":"lol"}'::jsonb);
-- nečíselné / přetékající / negativní / vnořené hodnoty → naivní ::int by spadl
insert into public.prijimacky_stats values ('aaaaaaaa-0000-0000-0000-000000000004',
 '{"practice":{"rovnice":{"ok":"abc","total":"99999999999999999999"},
               "zlomky":{"ok":-5,"total":"1e9"},
               "data":{"ok":{"nested":1},"total":[7]}},
   "test":{"rovnice":{"ok":"DROP TABLE saves;","total":"7"}}}'::jsonb);
-- flood: 200 vymyšlených okruhů + extra dlouhý klíč
insert into public.prijimacky_stats
 select 'aaaaaaaa-0000-0000-0000-000000000005',
  jsonb_build_object('practice',
   (select jsonb_object_agg('fake'||i, jsonb_build_object('ok',1,'total',1)) from generate_series(1,200) i)
   || jsonb_build_object(repeat('X',120), jsonb_build_object('ok',1,'total',1)));
`;

const asStaff = (sql) => `set test.role='teacher'; ` + sql;

(function main(){
  console.log('\n── Fáze 22 SQL: pz_class_topics proti skutečnému PostgreSQL ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: '+why+'\n'); process.exit(0); }

  try {
    H.start('pgtest22');
    H.exec(STUBS);
    ok('minimální stuby vytvořeny', true);

    // ── 1) samotný soubor fáze musí projít bez chyby ──
    let created = true, err = '';
    try { H.file(PHASE); } catch (e) { created = false; err = String(e.stderr||e.message||e).slice(0,200); }
    ok('phase22.sql se spustí bez chyby (syntaxe i závislosti)', created, err);
    if (!created) return;

    ok('_pz_num() existuje', H.q(`select count(*) from pg_proc where proname='_pz_num'`)==='1');
    ok('pz_class_topics() existuje', H.q(`select count(*) from pg_proc where proname='pz_class_topics'`)==='1');
    ok('funkce je SECURITY DEFINER', H.q(`select prosecdef from pg_proc where proname='pz_class_topics'`)==='t');

    // ── 2) bezpečný cast sám ──
    ok('_pz_num: text → 0', H.q(`select public._pz_num('abc')`)==='0');
    ok('_pz_num: přetečení → 0', H.q(`select public._pz_num('99999999999999999999')`)==='0');
    ok('_pz_num: záporné → 0', H.q(`select public._pz_num('-5')`)==='0');
    ok('_pz_num: NULL → 0', H.q(`select public._pz_num(null)`)==='0');
    ok('_pz_num: clamp na 1 000 000', H.q(`select public._pz_num('999999999')`)==='1000000');
    ok('_pz_num: normální číslo projde', H.q(`select public._pz_num('42')`)==='42');

    // ── 3) agregace s nepřátelskými savy v třídě ──
    H.exec(DATA_SQL);
    let rows = null, crashed = '';
    try {
      rows = H.rows(asStaff(`select topic, students, prac_ok, prac_total, test_ok, test_total
                             from public.pz_class_topics('${CLASS}')`));
    } catch (e) { crashed = String(e.stderr||e.message||e).slice(0,200); }
    ok('podvržený JSON NESHODÍ dotaz celé třídě (lekce z fáze 19)', !!rows, crashed);
    if (!rows) return;

    const byTopic = {};
    rows.forEach(([t,s,po,pt,to,tt])=>{ byTopic[t]={students:+s,prac_ok:+po,prac_total:+pt,test_ok:+to,test_total:+tt}; });

    // rovnice: prac 5+3+0("abc") / 10+10+0(20místné) ; test 0+1+0(SQL string) / 4+4+7
    const rv = byTopic['rovnice'];
    ok('rovnice: procvičování 8/20 (nečíselné a přetékající → 0)', rv && rv.prac_ok===8 && rv.prac_total===20, JSON.stringify(rv));
    ok('rovnice: test 1/15', rv && rv.test_ok===1 && rv.test_total===15, JSON.stringify(rv));
    ok('rovnice: 3 žáci s daty', rv && rv.students===3, JSON.stringify(rv));
    ok('SQL injection v hodnotě zůstala datem (tabulka saves žije)',
      H.q(`select count(*) from information_schema.tables where table_name='saves'`)==='1');

    // ── 4) allowlist okruhů (anti-flood) ──
    const topics = rows.map(r=>r[0]);
    ok('vymyšlené okruhy (200× fake) se NEVRÁTÍ', !topics.some(t=>/^fake/.test(t)), topics.slice(0,3).join(','));
    ok('extra dlouhý klíč se NEVRÁTÍ', !topics.some(t=>/^X{20}/.test(t)));
    ok('vráceny jen skutečné okruhy', topics.every(t=>REAL_TOPICS.includes(t)), topics.join(','));
    ok('nejslabší okruh první (rovnice 26 % před procenta 79 %)', topics[0]==='rovnice', topics.join(','));

    // ── 5) brány: role a třída ──
    ok('žák (student) nevidí nic', H.q(`set test.role='student'; select count(*) from public.pz_class_topics('${CLASS}')`)==='0');
    ok('žák bez explicitní role nevidí nic', H.q(`select count(*) from public.pz_class_topics('${CLASS}')`)==='0');
    ok('superadmin vidí', +H.q(`set test.role='superadmin'; select count(*) from public.pz_class_topics('${CLASS}')`)>0);
    ok('cizí třída nevrátí nic', H.q(asStaff(`select count(*) from public.pz_class_topics('22222222-2222-2222-2222-222222222222')`))==='0');

    // ── 6) granty (anon odvolaný jako od fáze 9) ──
    ok('anon NEMÁ execute', H.q(`select has_function_privilege('anon','public.pz_class_topics(uuid)','execute')`)==='f');
    ok('authenticated MÁ execute', H.q(`select has_function_privilege('authenticated','public.pz_class_topics(uuid)','execute')`)==='t');
    ok('anon NEMÁ execute ani na _pz_num', H.q(`select has_function_privilege('anon','public._pz_num(text)','execute')`)==='f');

    // ── 7) idempotence — spustit fázi dvakrát musí jít (create or replace) ──
    let again = true; try { H.file(PHASE); } catch (e) { again = false; }
    ok('phase22.sql je idempotentní (jde spustit znovu)', again);

    // ── 8) prázdná třída (žádní členové) → prázdno, ne chyba ──
    ok('třída bez žáků → 0 řádků bez chyby',
      H.q(asStaff(`select count(*) from public.pz_class_topics('33333333-3333-3333-3333-333333333333')`))==='0');
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
