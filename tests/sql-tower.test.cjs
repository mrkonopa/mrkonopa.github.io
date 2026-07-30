/* ══════════════════════════════════════════════════════════════════
   Test VĚŽE LEGEND (fáze 11 + 17 + 19) proti SKUTEČNÉMU PostgreSQL.
   Fáze se aplikují v PRODUKČNÍM POŘADÍ 11 → 17 → 19 → 23, takže se ověřuje
   to, co skutečně běží (17 přidá prázdniny, 19 zpřísní strop patra 500→60,
   23 zavře NULL díru ve staff bráně).

   Věž je nejrizikovější část cloudu: hlídá soutěž a TRVALE zapisuje síň
   slávy. Dokazujeme:
     • školní rok i label sezóny (posun 1. září, žádný cron),
     • ročník se počítá ze kohorty na SERVERU (anti-cheat vstupu),
     • prázdninový backstop (červenec/srpen zavřeno),
     • strop patra 60 → do síně slávy se nedá zapsat vymyšlený rekord,
     • uzavření sezóny je staff-only a idempotentní,
     • interní pomocníci nejsou volatelní zvenčí (vzor fáze 9).

   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');

const P = n => path.join(__dirname, '..', 'projects', `rpg-cloud-setup-phase${n}.sql`);
const S1 = 'aaaaaaaa-0000-0000-0000-000000000001';   // deváťák (kohorta 9. ročníku)
const S2 = 'aaaaaaaa-0000-0000-0000-000000000002';   // druhý deváťák
const S3 = 'aaaaaaaa-0000-0000-0000-000000000003';   // šesťák (jiný ročník)
const T  = 'aaaaaaaa-0000-0000-0000-0000000000ff';   // učitel
const C9 = '11111111-1111-1111-1111-111111111111';
const C6 = '22222222-2222-2222-2222-222222222222';

let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c) { console.log('  ✅ '+n); pass++; } else { console.log('  ❌ '+n+(d?' — '+d:'')); fail++; } };

// Nezávisle spočítaný školní rok (stejná konvence jako gradeOfCohort v konzoli):
// září–prosinec = letošní rok, leden–srpen = loňský.
const now = new Date();
const SY = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
const SEASON = SY + '/' + String((SY + 1) % 100).padStart(2, '0');
const HOLIDAY = [7, 8].includes(now.getMonth() + 1);

const STUBS = H.AUTH_STUB + `
create schema if not exists auth;
create table auth.users(id uuid primary key);
insert into auth.users values ('${S1}'),('${S2}'),('${S3}'),('${T}');
create table public.saves(user_id uuid, game text, name text, full_name text, data jsonb);
create table public.classes(id uuid primary key, name text, section text, cohort_start_year int, archived boolean default false);
create table public.class_members(class_id uuid, user_id uuid);
-- fáze 23 definuje my_role() nad tabulkou roles + auth.jwt(); učitel je v
-- allowlistu, žák ne (přesně jako v praxi) → žákovi vyjde 'student'
create table public.roles(email text primary key, role text);
insert into public.roles values ('ucitel@husovaliberec.cz','teacher');
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), '')) $$;
-- kohorty relativně k DNEŠKU, ať test platí kdykoli:
-- 9. ročník = nastoupil do 6. třídy před 3 školními roky
insert into public.classes values ('${C9}','9.B','B',${SY - 3},false), ('${C6}','6.A','A',${SY},false);
insert into public.class_members values ('${C9}','${S1}'),('${C9}','${S2}'),('${C6}','${S3}');
insert into public.saves values ('${S1}','RPG_MAT_9','Anička',null,'{}'),
                                ('${S2}','RPG_MAT_9',null,'Bořek Dvořák','{}'),
                                ('${S3}','RPG_MAT_6','Cyril',null,'{}');
`;

const asUid = (uid, sql) => `set test.uid='${uid}'; ` + sql;
const asStaff = (sql) => `set test.uid='${T}'; set test.role='teacher'; set test.email='ucitel@husovaliberec.cz'; ` + sql;
// dočasně otevře věž (obchází jen datovou bránu — tu ověřujeme zvlášť výše)
const OPEN = `create or replace function public._tower_open() returns boolean language sql stable as $$ select true $$;`;

(function main(){
  console.log('\n── Věž legend (fáze 11+17+19) proti skutečnému PostgreSQL ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: '+why+'\n'); process.exit(0); }

  try {
    H.start('pgtower');
    H.exec(STUBS);
    for (const n of [11, 17, 19, 23]) {
      let good = true, err = '';
      try { H.file(P(n)); } catch (e) { good = false; err = String(e.stderr||e.message||e).slice(0,180); }
      ok(`phase${n}.sql se spustí bez chyby`, good, err);
      if (!good) return;
    }

    // ── 1) školní rok a sezóna (posun 1. září bez cronu) ──
    ok('_school_year_start() = nezávisle spočítaný školní rok ('+SY+')',
      H.q(`select public._school_year_start()`)===String(SY));
    ok('_season_label() = „'+SEASON+'"', H.q(`select public._season_label()`)===SEASON, H.q(`select public._season_label()`));
    ok('label sezóny má formát RRRR/RR (dvouciferná druhá část)',
      /^\d{4}\/\d{2}$/.test(H.q(`select public._season_label()`)));

    // ── 2) ročník se počítá ze kohorty na SERVERU ──
    ok('deváťák má ročník 9', H.q(`select grade from public._grades_of('${S1}')`)==='9', H.q(`select grade from public._grades_of('${S1}')`));
    ok('šesťák má ročník 6', H.q(`select grade from public._grades_of('${S3}')`)==='6');
    ok('žák bez kohorty nemá žádný ročník',
      H.q(`select count(*) from public._grades_of('${T}')`)==='0');
    ok('deváťák SMÍ do věže 9. ročníku', H.q(asUid(S1, `select public.tower_eligible('RPG_MAT_9')`))==='t');
    ok('deváťák NESMÍ do věže 6. ročníku (anti-cheat vstupu)',
      H.q(asUid(S1, `select public.tower_eligible('RPG_MAT_6')`))==='f');
    ok('šesťák NESMÍ do věže 9. ročníku', H.q(asUid(S3, `select public.tower_eligible('RPG_MAT_9')`))==='f');
    ok('nepřihlášený není eligible', H.q(`select public.tower_eligible('RPG_MAT_9')`)==='f');

    // ── 3) prázdninový backstop (fáze 17) — ověřeno proti DNEŠNÍMU datu ──
    const holidayErr = H.expectFail(asUid(S1, `select public.tower_submit('RPG_MAT_9', 5)`));
    if (HOLIDAY) {
      ok('teď JSOU prázdniny → RPC odmítne zápis („tower on holidays")', /holiday/.test(holidayErr||''), String(holidayErr).slice(0,80));
    } else {
      ok('teď NEJSOU prázdniny → zápis projde', holidayErr===null, String(holidayErr).slice(0,80));
    }
    ok('_tower_open() souhlasí s dnešním měsícem',
      H.q(`select public._tower_open()`)===(HOLIDAY?'f':'t'));

    // dál testujeme mechaniku mimo datovou bránu
    H.exec(OPEN);

    // ── 4) strop patra po fázi 19 (500 → 60) ──
    ok('platné patro se zapíše', H.q(asUid(S1, `select public.tower_submit('RPG_MAT_9', 12)`))==='12');
    ok('opakování bere maximum (greatest)', H.q(asUid(S1, `select public.tower_submit('RPG_MAT_9', 7)`))==='12');
    ok('vyšší patro rekord posune', H.q(asUid(S1, `select public.tower_submit('RPG_MAT_9', 21)`))==='21');
    ok('patro 60 (na stropu) projde', H.q(asUid(S1, `select public.tower_submit('RPG_MAT_9', 60)`))==='60');
    ok('patro 61 odmítnuto (fáze 19 zpřísnila strop z 500)',
      /invalid floor/.test(H.expectFail(asUid(S1, `select public.tower_submit('RPG_MAT_9', 61)`))||''));
    ok('patro 500 (starý strop fáze 11) je dnes ODMÍTNUTO',
      /invalid floor/.test(H.expectFail(asUid(S1, `select public.tower_submit('RPG_MAT_9', 500)`))||''));
    ok('špatný ročník neprojde ani se správným patrem',
      /wrong grade/.test(H.expectFail(asUid(S3, `select public.tower_submit('RPG_MAT_9', 5)`))||''));
    ok('nepřihlášený nemůže zapsat',
      /not logged in/.test(H.expectFail(`select public.tower_submit('RPG_MAT_9', 5)`)||''));
    ok('v tabulce zůstal rekord 60 (absurdní zápis se nikam nedostal)',
      H.q(`select best_floor from public.tower_runs where user_id='${S1}'`)==='60');
    ok('zápis šel do AKTUÁLNÍ sezóny', H.q(`select season from public.tower_runs where user_id='${S1}'`)===SEASON);

    // ── 5) žebříček sezóny ──
    H.q(asUid(S2, `select public.tower_submit('RPG_MAT_9', 30)`));
    let b = H.rows(asUid(S1, `select display_name, best_floor, is_me from public.tower_board('RPG_MAT_9')`));
    ok('žebříček vrací oba lezce', b.length===2, JSON.stringify(b));
    ok('řazeno podle patra (60 před 30)', b[0][1]==='60', JSON.stringify(b[0]));
    ok('jméno má fallback na full_name', b.some(r=>r[0]==='Bořek Dvořák'), JSON.stringify(b));
    ok('is_me označí můj řádek', (b.find(r=>r[0]==='Anička')||[])[2]==='t');
    ok('nepřihlášený žebříček nevidí',
      H.q(`select count(*) from public.tower_board('RPG_MAT_9')`)==='0');
    H.exec(`insert into public.tower_runs values ('${T}','RPG_MAT_9','${SEASON}',0,1,now())`);
    ok('patro 0 se v žebříčku nezobrazuje',
      H.rows(asUid(S1, `select display_name from public.tower_board('RPG_MAT_9')`)).length===2);
    H.exec(`insert into public.tower_runs values ('${T}','RPG_MAT_9','00/01',55,1,now())`);
    ok('cizí (loňská) sezóna se do žebříčku nemíchá',
      H.rows(asUid(S1, `select display_name from public.tower_board('RPG_MAT_9')`)).length===2);
    ok('žebříček vrací jen jméno/patro/is_me (žádné e-maily ani user_id)',
      H.q(`select string_agg(a.attname, ',' order by a.attnum)
           from pg_proc p join unnest(p.proallargtypes, p.proargmodes, p.proargnames)
             with ordinality as a(typ, mode, attname, attnum) on true
           where p.proname='tower_board' and a.mode='t'`)==='display_name,best_floor,is_me');

    // ── 6) uzavření sezóny → trvalá síň slávy ──
    ok('žák NESMÍ uzavřít sezónu',
      /forbidden/.test(H.expectFail(`set test.uid='${S1}'; set test.role='student'; set test.email='zak@husovaliberec.cz'; select public.tower_close_season('RPG_MAT_9')`)||''));
    // žák bez explicitní role = 'student' (fáze 23); dřív NULL → brána se tiše otevřela
    ok('žák BEZ explicitní role taky NESMÍ uzavřít sezónu (fáze 23)',
      /forbidden/.test(H.expectFail(asUid(S1, `select public.tower_close_season('RPG_MAT_9')`))||''));
    const n1 = H.q(asStaff(`select public.tower_close_season('RPG_MAT_9')`));
    ok('učitel uzavře sezónu a zapíše 2 jména', n1==='2', n1);
    let hall = H.rows(asStaff(`select season, rank, display_name, best_floor from public.tower_hall_of_fame('RPG_MAT_9')`));
    ok('síň slávy má 2 záznamy s pořadím 1 a 2', hall.length===2 && hall[0][1]==='1' && hall[1][1]==='2', JSON.stringify(hall));
    ok('1. místo je nejvyšší patro (60)', hall[0][3]==='60', JSON.stringify(hall[0]));
    ok('síň slávy je za správnou sezónu', hall[0][0]===SEASON, hall[0][0]);
    const n2 = H.q(asStaff(`select public.tower_close_season('RPG_MAT_9')`));
    ok('opakované uzavření je idempotentní (nezdvojí záznamy)', n2==='2' &&
      H.rows(asStaff(`select rank from public.tower_hall_of_fame('RPG_MAT_9')`)).length===2);
    ok('nepřihlášený síň slávy nevidí',
      H.q(`select count(*) from public.tower_hall_of_fame('RPG_MAT_9')`)==='0');
    // trvalost: síň slávy nemá FK na uživatele → přežije smazání účtu
    ok('tower_hall NEMÁ FK na uživatele (síň přežije smazání účtu)',
      H.q(`select count(*) from information_schema.table_constraints
           where table_name='tower_hall' and constraint_type='FOREIGN KEY'`)==='0');
    H.exec(`delete from public.class_members where user_id='${S1}'; delete from auth.users where id='${S1}'`);
    ok('po smazání účtu žáka záznam v síni slávy ZŮSTAL',
      H.rows(asStaff(`select display_name from public.tower_hall_of_fame('RPG_MAT_9')`)).length===2);

    // ── 7) práva (vzor fáze 9) ──
    for (const [label, sig] of [['tower_eligible','public.tower_eligible(text)'],
                                ['tower_submit','public.tower_submit(text,int)'],
                                ['tower_board','public.tower_board(text)'],
                                ['tower_hall_of_fame','public.tower_hall_of_fame(text)'],
                                ['tower_close_season','public.tower_close_season(text)']]) {
      ok('anon NEMÁ execute na '+label, H.q(`select has_function_privilege('anon','${sig}','execute')`)==='f');
    }
    for (const [label, sig] of [['_school_year_start','public._school_year_start()'],
                                ['_season_label','public._season_label()'],
                                ['_grades_of','public._grades_of(uuid)'],
                                ['_tower_open','public._tower_open()']]) {
      ok('interní pomocník '+label+' není volatelný ani pro authenticated',
        H.q(`select has_function_privilege('authenticated','${sig}','execute')`)==='f');
    }
    ok('tabulka tower_runs nemá RLS politiky (přístup jen přes RPC)',
      H.q(`select count(*) from pg_policies where tablename='tower_runs'`)==='0');
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
