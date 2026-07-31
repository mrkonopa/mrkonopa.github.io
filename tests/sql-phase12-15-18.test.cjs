/* ══════════════════════════════════════════════════════════════════
   Test FÁZÍ 12 + 15 + 18 SQL proti SKUTEČNÉMU PostgreSQL —
   učitelské nástroje věže, auditní log, validace pozvánek.

   Právě tyhle funkce byly oběťmi NULL díry z fáze 23 (staff brána tvaru
   `if (select my_role()) not in (…) then raise`). Test proto:
     • REPRODUKUJE díru na staré definici my_role() u všech tří fází,
     • dokáže, že ji fáze 23 zavřela,
     • a ověří samotnou funkčnost (mazání rekordu ve věži nechá síň slávy
       na pokoji, audit log je zapisovatelný jen staffem a čitelný jen
       superadminem, pozvánka validuje formát e-mailu).

   Produkční pořadí: 4 → 7 → 9 → 11 → 12 → 15 → 17 → 18 → 23.
   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');

const P = f => path.join(__dirname, '..', 'projects', `rpg-cloud-setup-${f}.sql`);
const S1    = 'aaaaaaaa-0000-0000-0000-000000000001';   // deváťák s rekordem
const S2    = 'aaaaaaaa-0000-0000-0000-000000000002';   // druhý deváťák
const TEACH = 'aaaaaaaa-0000-0000-0000-0000000000fe';   // učitel
const ADMIN = 'aaaaaaaa-0000-0000-0000-0000000000ff';   // superadmin
const C9    = '11111111-1111-1111-1111-111111111111';

let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c) { console.log('  ✅ '+n); pass++; } else { console.log('  ❌ '+n+(d?' — '+d:'')); fail++; } };

const now = new Date();
const SY = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
const SEASON = SY + '/' + String((SY + 1) % 100).padStart(2, '0');

const STUBS = `
create schema if not exists auth;
create table auth.users(id uuid primary key, email text);
insert into auth.users values ('${S1}','zak1@husovaliberec.cz'),('${S2}','zak2@husovaliberec.cz'),
                              ('${TEACH}','ucitel@husovaliberec.cz'),('${ADMIN}','admin@husovaliberec.cz');
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), '')) $$;
create role anon; create role authenticated;
create table public.roles(email text primary key, role text);
insert into public.roles values ('ucitel@husovaliberec.cz','teacher'), ('admin@husovaliberec.cz','superadmin');
create table public.saves(user_id uuid, game text, name text, full_name text, data jsonb);
insert into public.saves values ('${S1}','RPG_MAT_9','Anička',null,'{}'),
                                ('${S2}','RPG_MAT_9',null,'Bořek Dvořák','{}');
create table public.classes(id uuid primary key, name text, section text, cohort_start_year int, archived boolean default false);
insert into public.classes values ('${C9}','9.B','B',${SY - 3},false);
create table public.class_members(class_id uuid, user_id uuid);
insert into public.class_members values ('${C9}','${S1}'), ('${C9}','${S2}');
`;

// PŮVODNÍ (děravá) my_role z fáze 2 — vrací NULL pro žáka mimo allowlist
const OLD_MY_ROLE = `
create or replace function public.my_role() returns text
language sql security definer stable set search_path = public as $$
  select role from public.roles where lower(email) = lower(auth.jwt() ->> 'email') limit 1;
$$;`;

const as = (uid, email, sql) => `set test.uid='${uid}'; set test.email='${email}'; ` + sql;
const asStudent = sql => as(S1,    'zak1@husovaliberec.cz',   sql);
const asTeacher = sql => as(TEACH, 'ucitel@husovaliberec.cz', sql);
const asAdmin   = sql => as(ADMIN, 'admin@husovaliberec.cz',  sql);

(function main(){
  console.log('\n── Fáze 12+15+18 SQL: nástroje věže, audit log, pozvánky ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: '+why+'\n'); process.exit(0); }

  try {
    H.start('pgt121518');
    H.exec(STUBS + OLD_MY_ROLE);   // my_role musí existovat před fázemi (parsuje se hned)
    for (const f of ['phase4','phase7','phase9','phase11','phase12','phase15','phase17','phase18']) {
      let good = true, err = '';
      try { H.file(P(f)); } catch (e) { good = false; err = String(e.stderr||e.message||e).slice(0,180); }
      ok(f+'.sql se spustí bez chyby', good, err);
      if (!good) return;
    }

    // rekordy ve věži + záznam v síni slávy
    H.exec(`insert into public.tower_runs values ('${S1}','RPG_MAT_9','${SEASON}',21,3,now()),
                                                 ('${S2}','RPG_MAT_9','${SEASON}',15,2,now());
            insert into public.tower_hall (game, season, rank, display_name, best_floor, user_id)
              values ('RPG_MAT_9','${SEASON}',1,'Anička',21,'${S1}');`);

    // ── 1) REPRODUKCE NULL díry (ještě bez fáze 23) ──
    ok('DÍRA 12: žák MŮŽE smazat spolužákovi rekord ve věži',
      H.expectFail(asStudent(`select public.tower_delete_run('${S2}','RPG_MAT_9')`))===null);
    ok('a rekord byl SKUTEČNĚ smazán', H.q(`select count(*) from public.tower_runs where user_id='${S2}'`)==='0');
    ok('DÍRA 15: žák MŮŽE psát do auditního logu',
      H.expectFail(asStudent(`select public.log_action('podvrh', null, null, null, '{}'::jsonb)`))===null);
    ok('a záznam v logu vznikl', H.q(`select count(*) from public.audit_log where action='podvrh'`)==='1');
    ok('DÍRA 18: žák MŮŽE číst administrátorský žebříček (i user_id)',
      H.expectFail(asStudent(`select count(*) from public.tower_board_admin('RPG_MAT_9')`))===null);

    // ── 2) fáze 23 to zavře ──
    let fixed = true, e23 = '';
    try { H.file(P('phase23')); } catch (e) { fixed = false; e23 = String(e.stderr||e.message||e).slice(0,150); }
    ok('phase23.sql se spustí bez chyby', fixed, e23);
    if (!fixed) return;
    H.exec(`delete from public.audit_log; insert into public.tower_runs values ('${S2}','RPG_MAT_9','${SEASON}',15,2,now());`);

    ok('ZAVŘENO 12: žák NESMÍ mazat rekordy',
      /forbidden/.test(H.expectFail(asStudent(`select public.tower_delete_run('${S2}','RPG_MAT_9')`))||''));
    ok('a rekord zůstal', H.q(`select count(*) from public.tower_runs where user_id='${S2}'`)==='1');
    ok('ZAVŘENO 15: žák NESMÍ psát do logu',
      /not staff/.test(H.expectFail(asStudent(`select public.log_action('podvrh')`))||''));
    ok('a log zůstal prázdný', H.q(`select count(*) from public.audit_log`)==='0');
    ok('ZAVŘENO 18: žák NESMÍ číst administrátorský žebříček',
      /forbidden/.test(H.expectFail(asStudent(`select count(*) from public.tower_board_admin('RPG_MAT_9')`))||''));

    // ── 3) fáze 12: mazání rekordu ve věži ──
    const board = () => H.rows(asTeacher(`select display_name, best_floor, runs from public.tower_board_admin('RPG_MAT_9')`));
    let b = board();
    ok('učitel vidí administrátorský žebříček s runs', b.length===2 && b[0][2]==='3', JSON.stringify(b));
    ok('řazeno podle patra (21 před 15)', b[0][1]==='21', JSON.stringify(b[0]));
    ok('jméno má fallback na full_name', b.some(r=>r[0]==='Bořek Dvořák'), JSON.stringify(b));
    ok('učitel smaže rekord žáka a dostane počet',
      H.q(asTeacher(`select public.tower_delete_run('${S2}','RPG_MAT_9')`))==='1');
    ok('rekord je fakt smazaný', H.q(`select count(*) from public.tower_runs where user_id='${S2}'`)==='0');
    ok('SÍŇ SLÁVY zůstala nedotčená (trvalý zápis)',
      H.q(`select count(*) from public.tower_hall where user_id='${S1}'`)==='1');
    ok('mazání bez user_id je odmítnuto',
      /missing user/.test(H.expectFail(asTeacher(`select public.tower_delete_run(null,'RPG_MAT_9')`))||''));
    ok('mazání neexistujícího rekordu vrátí 0 (ne chybu)',
      H.q(asTeacher(`select public.tower_delete_run('${S2}','RPG_MAT_9')`))==='0');
    ok('smazání se dotklo jen AKTUÁLNÍ sezóny', (function(){
      H.exec(`insert into public.tower_runs values ('${S2}','RPG_MAT_9','00/01',9,1,now())`);
      H.q(asTeacher(`select public.tower_delete_run('${S2}','RPG_MAT_9')`));
      return H.q(`select count(*) from public.tower_runs where user_id='${S2}' and season='00/01'`)==='1';
    })());

    // ── 4) fáze 15: auditní log ──
    H.q(asTeacher(`select public.log_action('give_xp', '${S1}', 'zak1@husovaliberec.cz', 'RPG_MAT_9', '{"delta":50}'::jsonb)`));
    ok('učitel zapíše akci do logu', H.q(`select count(*) from public.audit_log`)==='1');
    const row = H.rows(`select actor_email, action, target_email, game, detail->>'delta' from public.audit_log`)[0];
    ok('log nese actor_email, akci, cíl, hru i detail',
      row[0]==='ucitel@husovaliberec.cz' && row[1]==='give_xp' && row[3]==='RPG_MAT_9' && row[4]==='50', JSON.stringify(row));
    ok('actor je vždy přihlášený uživatel (nedá se podvrhnout)',
      H.q(`select actor_id from public.audit_log`)===TEACH);
    H.q(asTeacher(`select public.log_action(repeat('X', 100))`));
    ok('název akce je zkrácen na 40 znaků',
      H.q(`select length(action) from public.audit_log order by created_at desc limit 1`)==='40');
    H.q(asTeacher(`select public.log_action('nulls', null, null, null, null)`));
    ok('NULL detail se uloží jako prázdný objekt (nespadne)',
      H.q(`select detail::text from public.audit_log where action='nulls'`)==='{}');
    ok('UČITEL log ČÍST nesmí (jen superadmin)',
      H.q(asTeacher(`select count(*) from public.audit_log_list()`))==='0');
    ok('superadmin log čte', +H.q(asAdmin(`select count(*) from public.audit_log_list()`))>0);
    ok('žák log nečte', H.q(asStudent(`select count(*) from public.audit_log_list()`))==='0');
    ok('limit je clampnutý do 1–500',
      H.q(asAdmin(`select count(*) from public.audit_log_list(999999)`))===H.q(asAdmin(`select count(*) from public.audit_log_list(500)`)));
    ok('filtr podle actora funguje',
      +H.q(asAdmin(`select count(*) from public.audit_log_list(200, null, '${TEACH}')`))>0 &&
      H.q(asAdmin(`select count(*) from public.audit_log_list(200, null, '${S1}')`))==='0');
    ok('RLS: přímé čtení tabulky smí jen superadmin (politika audit_read)',
      H.q(`select count(*) from pg_policies where tablename='audit_log' and policyname='audit_read'`)==='1');

    // ── 5) fáze 18: validace e-mailu u pozvánky ──
    const c2 = H.q(asTeacher(`select (public.create_battle('RPG_MAT_9', 5, 'Uc')).code`));
    const b2 = H.q(`select id from battles where code='${c2}'`);
    for (const bad of ['nesmysl', 'a@b', '@husovaliberec.cz', 'a b@c.cz', 'a@@b.cz', '']) {
      ok('neplatný e-mail „'+bad+'" je odmítnut',
        /invalid email/.test(H.expectFail(asTeacher(`select public.invite_battle_email('${b2}', '${bad}')`))||''));
    }
    H.q(asTeacher(`select public.invite_battle_email('${b2}', '  ZAK1@Husovaliberec.CZ ')`));
    ok('platný e-mail projde a normalizuje se',
      H.q(`select email from battle_invites where battle_id='${b2}'`)==='zak1@husovaliberec.cz');
    ok('žák NESMÍ zvát do cizí bitvy',
      /forbidden/.test(H.expectFail(asStudent(`select public.invite_battle_email('${b2}','zak2@husovaliberec.cz')`))||''));

    // ── 6) granty ──
    for (const [label, sig] of [['tower_delete_run','public.tower_delete_run(uuid,text)'],
                                ['tower_board_admin','public.tower_board_admin(text)'],
                                ['log_action','public.log_action(text,uuid,text,text,jsonb)'],
                                ['audit_log_list','public.audit_log_list(int,timestamptz,uuid,uuid)'],
                                ['invite_battle_email','public.invite_battle_email(uuid,text)']]) {
      ok('anon NEMÁ execute na '+label, H.q(`select has_function_privilege('anon','${sig}','execute')`)==='f');
    }

    // ── 7) idempotence ──
    let again = true, e2 = '';
    for (const f of ['phase12','phase15','phase18']) {
      try { H.file(P(f)); } catch (e) { again = false; e2 = f+': '+String(e.stderr||e.message||e).slice(0,100); }
    }
    ok('fáze 12/15/18 jdou spustit znovu', again, e2);
    ok('a po re-runu je staff brána pořád zavřená',
      /forbidden/.test(H.expectFail(asStudent(`select public.tower_delete_run('${S1}','RPG_MAT_9')`))||''));
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
