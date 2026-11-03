/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 29 SQL proti SKUTEČNÉMU PostgreSQL — ročníky živého souboje
   určuje JEN autor (sloupec battles.grades, create_battle_g).

   Dokazujeme:
     • single hra (RPG_MAT_3…9) = ročník je ta hra, p_grades se ignoruje,
     • MIX: vyčištěné, bez duplicit, seřazené 3–9, aspoň 2, jinak 'invalid grades',
     • cizí/prázdné game → grades NULL (klient pak použije banku hráče),
     • CHECK na sloupci (1–7 hodnot, jen 3–9) platí i při přímém zápisu,
     • battle_state nese `grades` autorovi, spoluhráči i pozdě příchozímu,
       cizí člověk ho nevidí; rematch_battle ročníky drží,
     • starší create_battle / create_battle_tm dál fungují (grades NULL),
     • práva: anon a public nikam, authenticated ano; idempotence,
     • 5 sabotáží (zdroj fáze se mění jen v paměti, před každou se funkce
       dropne, protože CREATE OR REPLACE práva zachovává).

   Produkční pořadí: 4 → 7 → 9 → 14 → 23 → 29.
   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const H = require('./sql-harness.cjs');

const P = f => path.join(__dirname, '..', 'projects', f);
const HOST  = 'aaaaaaaa-0000-0000-0000-00000000000a';
const PLAY  = 'aaaaaaaa-0000-0000-0000-00000000000b';
const LATE  = 'aaaaaaaa-0000-0000-0000-00000000000d';   // připojí se za běhu
const OUT   = 'aaaaaaaa-0000-0000-0000-00000000000c';   // cizí, není v souboji

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

const STUBS = `
create schema if not exists auth;
create table auth.users(id uuid primary key, email text);
insert into auth.users values ('${HOST}','host@husovaliberec.cz'),('${PLAY}','hrac@husovaliberec.cz'),
                              ('${LATE}','pozde@husovaliberec.cz'),('${OUT}','cizi@husovaliberec.cz');
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), '')) $$;
create role anon; create role authenticated;
create table public.roles(email text primary key, role text);
create table public.saves(user_id uuid, game text, name text, full_name text, data jsonb);
create table public.class_members(class_id uuid, user_id uuid);
create or replace function public.my_role() returns text
language sql security definer stable set search_path = public as $$
  select coalesce((select role from public.roles where lower(email) = lower(auth.jwt() ->> 'email') limit 1), 'student');
$$;`;

const as = (uid, email, sql) => `set test.uid='${uid}'; set test.email='${email}'; ` + sql;
const asHost  = sql => as(HOST,  'host@husovaliberec.cz',  sql);
const asPlay  = sql => as(PLAY,  'hrac@husovaliberec.cz',  sql);
const asLate  = sql => as(LATE,  'pozde@husovaliberec.cz', sql);
const asOut   = sql => as(OUT,   'cizi@husovaliberec.cz',  sql);
const ANON = `set test.uid=''; set test.email=''; `;

const FILE29 = P('rpg-cloud-setup-phase29.sql');
const SQL29 = fs.readFileSync(FILE29, 'utf8');
const SIG = 'public.create_battle_g(text,int,text,boolean,int[])';

/* sada kontrol; vrací počet nezdarů (pro sabotáže) */
function kontroly(tichy) {
  let nezdary = 0;
  const kk = (n, c, d) => { if (!c) nezdary++; if (!tichy) ok(n, c, d); };
  const grades = (game, arr, tm) => H.q(asHost(`select (public.create_battle_g('${game}', 8, 'Vojta', ${tm ? 'true' : 'false'}, ${arr})).grades`));
  const selhani = (game, arr) => H.expectFail(asHost(`select public.create_battle_g('${game}', 8, 'Vojta', false, ${arr})`)) || '';

  // single hra: ročník je hra
  kk('single RPG_MAT_8: grades = {8}', grades('RPG_MAT_8', 'null') === '{8}');
  kk('single RPG_MAT_3 i RPG_MAT_9 (krajní)', grades('RPG_MAT_3', 'null') === '{3}' && grades('RPG_MAT_9', 'null') === '{9}');
  kk('single: p_grades se ignoruje (autor je ve hře 8, ne 3+4)', grades('RPG_MAT_8', 'array[3,4]') === '{8}');
  // MIX
  kk('MIX: vyčištěné, bez duplicit a seřazené {7,8,9}', grades('RPG_MAT_MIX', 'array[9,7,7,8,99,-1,2]') === '{7,8,9}', grades('RPG_MAT_MIX', 'array[9,7,7,8,99,-1,2]'));
  kk('MIX: všech sedm ročníků', grades('RPG_MAT_MIX', 'array[9,8,7,6,5,4,3]') === '{3,4,5,6,7,8,9}');
  kk('MIX: tým + ročníky', grades('RPG_MAT_MIX', 'array[6,5]', true) === '{5,6}');
  kk('MIX: jediný ročník → invalid grades', /invalid grades/.test(selhani('RPG_MAT_MIX', 'array[8]')));
  kk('MIX: po vyčištění méně než 2 → invalid grades', /invalid grades/.test(selhani('RPG_MAT_MIX', 'array[1,2,99]')));
  kk('MIX: bez ročníků (null) → invalid grades', /invalid grades/.test(selhani('RPG_MAT_MIX', 'null')));
  kk('MIX: dva stejné ročníky → invalid grades', /invalid grades/.test(selhani('RPG_MAT_MIX', 'array[8,8,8]')));
  kk('MIX: 500 hodnot nic neshodí (jen invalid grades)', /invalid grades/.test(selhani('RPG_MAT_MIX', 'array_fill(7, array[500])')));
  // jiné game
  kk('cizí game → grades NULL', grades('FOO', 'array[7,8]') === '');
  kk('prázdné game → výchozí RPG_MAT_9 → {9}', H.q(asHost(`select (public.create_battle_g('', 8, 'V', false, null)).grades`)) === '{9}');
  // vstupy
  kk('nepřihlášený nic nezaloží', /not authenticated/.test(H.expectFail(ANON + `select public.create_battle_g('RPG_MAT_8', 8, 'V', false, null)`) || ''));
  kk('q_count se ořezává na 3–40', H.q(asHost(`select (public.create_battle_g('RPG_MAT_8', 999, 'V', false, null)).q_count`)) === '40'
    && H.q(asHost(`select (public.create_battle_g('RPG_MAT_8', -5, 'V', false, null)).q_count`)) === '3');
  kk('host je hned hráčem (tým 0 jen v týmovém režimu)', H.q(asHost(`select count(*) from battle_players p join battles b on b.id = p.battle_id where b.code = (select code from battles order by created_at desc limit 1) and p.user_id = '${HOST}'`)) === '1');
  // CHECK přímo na sloupci
  kk('CHECK: ročník 2 se do sloupce nedostane', /battles_grades_chk/.test(H.expectFail(`update battles set grades = '{2,8}' where id = (select id from battles limit 1)`) || ''));
  kk('CHECK: 8 hodnot se do sloupce nedostane', /battles_grades_chk/.test(H.expectFail(`update battles set grades = '{3,3,3,3,3,3,3,3}' where id = (select id from battles limit 1)`) || ''));
  kk('CHECK: prázdné pole se nedostane (cardinality 0)', /battles_grades_chk/.test(H.expectFail(`update battles set grades = '{}' where id = (select id from battles limit 1)`) || ''));
  // práva
  const pr = H.q(`select has_function_privilege('anon','${SIG}','execute')::text || ',' || has_function_privilege('public','${SIG}','execute')::text || ',' || has_function_privilege('authenticated','${SIG}','execute')::text`);
  kk('práva: anon ne, public ne, authenticated ano', pr === 'false,false,true', pr);
  return nezdary;
}

(function main() {
  console.log('\n── Fáze 29 SQL: ročníky živého souboje určuje autor ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: ' + why + '\n'); process.exit(0); }

  try {
    H.start('pgtest29');
    H.exec(STUBS);
    for (const f of ['rpg-cloud-setup-phase4.sql', 'rpg-cloud-setup-phase7.sql', 'rpg-cloud-setup-phase9.sql',
                     'rpg-cloud-setup-phase14.sql', 'rpg-cloud-setup-phase23.sql', 'rpg-cloud-setup-phase29.sql']) {
      let good = true, err = '';
      try { H.file(P(f)); } catch (e) { good = false; err = String(e.stderr || e.message || e).slice(0, 200); }
      ok(f.replace('rpg-cloud-setup-', '') + ' se spustí bez chyby', good, err);
      if (!good) return;
    }
    let idem = true; try { H.file(FILE29); H.file(FILE29); } catch (e) { idem = false; }
    ok('fáze 29 je idempotentní (třikrát za sebou)', idem);
    ok('sloupec grades je smallint[]', H.q(`select format_type(atttypid, atttypmod) from pg_attribute where attrelid = 'public.battles'::regclass and attname = 'grades'`) === 'smallint[]');

    kontroly(false);

    // ── battle_state, pozdní příchod, odveta ──
    const id = H.q(asHost(`select (public.create_battle_g('RPG_MAT_MIX', 8, 'Vojta', true, array[9,7,8])).id`));
    const code = H.q(`select code from battles where id = '${id}'`);
    H.q(asPlay(`select (public.join_battle('${code}', 'Hráč')).id`));
    const gr = u => H.q(u(`select (public.battle_state('${id}')::jsonb) -> 'battle' -> 'grades'`));
    ok('battle_state: autor vidí ročníky [7,8,9]', gr(asHost) === '[7, 8, 9]', gr(asHost));
    ok('battle_state: spoluhráč vidí totéž', gr(asPlay) === '[7, 8, 9]');
    H.q(asHost(`select public.set_battle_status('${id}', 'active')`));
    H.q(asLate(`select (public.join_battle('${code}', 'Pozdě')).id`));
    ok('pozdní příchod za běhu vidí stejné ročníky', gr(asLate) === '[7, 8, 9]', gr(asLate));
    ok('cizí člověk stav souboje nevidí (forbidden)', /forbidden/.test(H.expectFail(asOut(`select public.battle_state('${id}')`)) || ''));
    const seed0 = H.q(`select q_seed from battles where id = '${id}'`);
    H.q(asHost(`select (public.rematch_battle('${id}')).id`));
    ok('odveta: nový seed, stejné ročníky', H.q(`select q_seed from battles where id = '${id}'`) !== seed0 && gr(asPlay) === '[7, 8, 9]');

    // ── starší funkce dál fungují ──
    ok('původní create_battle dál funguje (grades NULL)', H.q(asHost(`select (public.create_battle('RPG_MAT_9', 8, 'V')).grades is null`)) === 't');
    ok('původní create_battle_tm dál funguje (grades NULL)', H.q(asHost(`select (public.create_battle_tm('RPG_MAT_9', 8, 'V', true)).grades is null`)) === 't');

    // ── sabotáže ──
    console.log('\n── Sabotáže ──');
    const SAB = [
      ['MIX bez odstranění duplicit', 'select distinct x::smallint as x', 'select x::smallint as x'],
      ['MIX bez filtru 3–9', 'where x between 3 and 9', 'where true'],
      ['single hra poslechne p_grades', 'gr := array[substr(g, 9)::smallint];', 'gr := coalesce(p_grades::smallint[], array[substr(g, 9)::smallint]);'],
      ['MIX bere i jediný ročník', 'cardinality(gr) < 2', 'cardinality(gr) < 1'],
      ['bez kontroly přihlášení', "if auth.uid() is null then raise exception 'not authenticated'; end if;", ''],
      ['funkce volatelná pro anon a public', 'from public, anon;\ngrant  execute on function public.create_battle_g', ';\ngrant  execute on function public.create_battle_g']
    ];
    for (const [jm, od, na] of SAB) {
      const nove = SQL29.replace(od, na);
      if (nove === SQL29) { ok('sabotáž se neaplikovala: ' + jm, false); continue; }
      let n = -1;
      try {
        H.exec(`drop function if exists ${SIG};`);
        H.exec(nove);
        n = kontroly(true);
      } catch (e) { n = 1; }   // sabotovaná verze spadla už při spuštění = chyceno
      ok('sabotáž chycena: ' + jm + ' (' + n + ' nezdarů)', n > 0);
    }
    // obnova originálu a závěrečná kontrola
    H.exec(`drop function if exists ${SIG};`);
    H.file(FILE29);
    ok('po sabotážích je obnovená původní funkce (všechny kontroly zelené)', kontroly(true) === 0);
  } catch (e) {
    console.log('  ❌ výjimka testu: ' + String(e.stderr || e.message || e).slice(0, 400)); fail++;
  } finally { H.stop(); }

  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: ' + pass + ' ✅  /  ' + fail + ' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
