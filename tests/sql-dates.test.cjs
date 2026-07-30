/* ══════════════════════════════════════════════════════════════════
   Test DATOVÉ LOGIKY cloudu proti SKUTEČNÉMU PostgreSQL —
   posun školního roku a sezóny 1. září a prázdninový zámek věže.

   Tohle je jediná část, která se „přepne sama" bez cronu, takže se chyba
   projeví až v den D (1. 9. nebo 1. 7.) — a to je pozdě. Přitom na tom visí,
   KDO se dostane do věže (ročník se počítá z kohorty).

   Jak se testují hraniční data, když funkce používají now():
   tělo NASAZENÉ funkce se vytáhne z pg_proc.prosrc a `now()` se v něm
   nahradí parametrem → vznikne dvojník, který počítá TOTÉŽ, ale pro libovolné
   datum. Testuje se tedy skutečná definice, ne její opis. Kdyby se definice
   změnila (zmizí `now()`), test to pozná a spadne.

   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');

const P = f => path.join(__dirname, '..', 'projects', `rpg-cloud-setup-${f}.sql`);
const S9 = 'aaaaaaaa-0000-0000-0000-000000000001';
const C9 = '11111111-1111-1111-1111-111111111111';

let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c) { console.log('  ✅ '+n); pass++; } else { console.log('  ❌ '+n+(d?' — '+d:'')); fail++; } };

const STUBS = `
create schema if not exists auth;
create table auth.users(id uuid primary key, email text);
insert into auth.users values ('${S9}','zak@husovaliberec.cz');
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), '')) $$;
create role anon; create role authenticated;
create table public.roles(email text primary key, role text);
create table public.saves(user_id uuid, game text, name text, full_name text, data jsonb);
create table public.classes(id uuid primary key, name text, section text, cohort_start_year int, archived boolean default false);
create table public.class_members(class_id uuid, user_id uuid);
create or replace function public.my_role() returns text language sql stable as $$ select 'student'::text $$;
`;

// tělo nasazené funkce → parametrizovaný dvojník (now() nahrazeno za `ts`)
function twin(fnName, twinName, extraReplace) {
  const src = H.q(`select prosrc from pg_proc where proname='${fnName}'`);
  if (!/now\(\)/.test(src)) return { okSrc: false, src };
  let body = src.split('now()').join('ts');
  if (extraReplace) for (const [a, b] of extraReplace) body = body.split(a).join(b);
  H.exec(`create or replace function public.${twinName}(ts timestamptz)
          returns ${fnName === '_tower_open' ? 'boolean' : (fnName === '_season_label' ? 'text' : 'int')}
          language sql immutable set search_path = public as $TW$ ${body} $TW$;`);
  return { okSrc: true, src };
}
const at = (twinName, date) => H.q(`select public.${twinName}('${date}'::timestamptz)`);

(function main(){
  console.log('\n── Datová logika: posun 1. září, prázdniny věže ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: '+why+'\n'); process.exit(0); }

  try {
    H.start('pgdates');
    H.exec(STUBS);
    for (const f of ['phase11','phase17']) {
      let good = true, err = '';
      try { H.file(P(f)); } catch (e) { good = false; err = String(e.stderr||e.message||e).slice(0,180); }
      ok(f+'.sql se spustí bez chyby', good, err);
      if (!good) return;
    }

    // ── 1) dvojníci odvození z NASAZENÝCH definic ──
    const t1 = twin('_school_year_start', '_t_sy');
    ok('_school_year_start() používá now() (jinak je test zastaralý)', t1.okSrc, t1.src);
    const t2 = twin('_tower_open', '_t_open');
    ok('_tower_open() používá now()', t2.okSrc, t2.src);
    // _season_label volá _school_year_start() → v dvojníkovi ho nahradíme dvojníkem
    const src3 = H.q(`select prosrc from pg_proc where proname='_season_label'`);
    ok('_season_label() staví na _school_year_start()', /_school_year_start\(\)/.test(src3), src3);
    H.exec(`create or replace function public._t_season(ts timestamptz) returns text
            language sql immutable set search_path = public as $TW$ ${
              src3.split('_school_year_start()').join('_t_sy(ts)')} $TW$;`);
    if (!t1.okSrc || !t2.okSrc) return;

    // ── 2) školní rok se láme 1. ZÁŘÍ ──
    ok('31. 8. 2026 → školní rok ještě 2025', at('_t_sy', '2026-08-31 23:59:59')==='2025');
    ok('1. 9. 2026 → školní rok už 2026 (POSUN)', at('_t_sy', '2026-09-01 00:00:00')==='2026');
    ok('31. 12. 2026 → pořád 2026', at('_t_sy', '2026-12-31')==='2026');
    ok('1. 1. 2027 → pořád 2026 (leden je druhá půlka šk. roku)', at('_t_sy', '2027-01-01')==='2026');
    ok('30. 6. 2027 → pořád 2026', at('_t_sy', '2027-06-30')==='2026');
    ok('1. 9. 2027 → 2027', at('_t_sy', '2027-09-01')==='2027');

    // ── 3) label sezóny ──
    ok('31. 8. 2026 → sezóna „2025/26"', at('_t_season', '2026-08-31')==='2025/26');
    ok('1. 9. 2026 → sezóna „2026/27" (posune se sama)', at('_t_season', '2026-09-01')==='2026/27');
    ok('přelom století: 1. 9. 2099 → „2099/00" (dvouciferné s nulou)',
      at('_t_season', '2099-09-01')==='2099/00', at('_t_season', '2099-09-01'));
    ok('label má vždy tvar RRRR/RR', ['2026-09-01','2027-01-15','2030-08-31','2099-09-01']
      .every(d => /^\d{4}\/\d{2}$/.test(at('_t_season', d))));

    // ── 4) prázdninový zámek věže ──
    ok('30. 6. → věž OTEVŘENÁ', at('_t_open', '2026-06-30')==='t');
    ok('1. 7. → věž ZAVŘENÁ (prázdniny)', at('_t_open', '2026-07-01')==='f');
    ok('15. 8. → pořád zavřená', at('_t_open', '2026-08-15')==='f');
    ok('31. 8. → poslední zavřený den', at('_t_open', '2026-08-31 23:59:59')==='f');
    ok('1. 9. → věž zase OTEVŘENÁ', at('_t_open', '2026-09-01 00:00:00')==='t');
    ok('leden → otevřená', at('_t_open', '2027-01-10')==='t');
    ok('zámek platí každý rok stejně', ['2027','2028','2030'].every(y =>
      at('_t_open', y+'-07-15')==='f' && at('_t_open', y+'-09-15')==='t'));

    // ── 5) ročník kohorty se posune spolu se školním rokem ──
    // (stejný vzorec jako _grades_of: 6 + (školní_rok - cohort_start_year))
    const gradeAt = (cohort, date) => H.q(`select 6 + (public._t_sy('${date}'::timestamptz) - ${cohort})`);
    ok('kohorta 2023: 31. 8. 2026 je 8. ročník', gradeAt(2023, '2026-08-31')==='8');
    ok('kohorta 2023: 1. 9. 2026 je 9. ročník (POSUN BEZ CRONU)', gradeAt(2023, '2026-09-01')==='9');
    ok('kohorta 2023: 1. 9. 2027 už 10 = ze školy pryč', gradeAt(2023, '2027-09-01')==='10');
    ok('kohorta 2026: 1. 9. 2026 nastupuje do 6.', gradeAt(2026, '2026-09-01')==='6');
    ok('kohorta 2026 projde 6→7→8→9 ve správných letech',
      gradeAt(2026,'2027-09-01')==='7' && gradeAt(2026,'2028-09-01')==='8' && gradeAt(2026,'2029-09-01')==='9');

    // ── 6) dopad na věž: eligibilita se posune sama ──
    // dnešní stav ověřen v sql-tower; tady dokládáme, že se ročník mění dnem
    H.exec(`insert into public.classes values ('${C9}','9.B','B',2023,false);
            insert into public.class_members values ('${C9}','${S9}');`);
    const realGrade = H.q(`select grade from public._grades_of('${S9}')`);
    const expect = String(6 + Number(H.q(`select public._school_year_start()`)) - 2023);
    ok('_grades_of() dnes souhlasí s dvojníkem (vzorec sedí)', realGrade===expect, realGrade+' vs '+expect);
    ok('žák kohorty 2023 je letos v ročníku '+realGrade+' → do věže smí jen ta hra',
      H.q(`set test.uid='${S9}'; select public.tower_eligible('RPG_MAT_'||${realGrade})`)===(Number(realGrade)<=9?'t':'f'));

    // ── 7) sezóna zápisu odpovídá labelu ──
    ok('_season_label() dnes = dvojník pro dnešek',
      H.q(`select public._season_label()`)===H.q(`select public._t_season(now())`));
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
