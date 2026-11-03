/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 30 SQL proti SKUTEČNÉMU PostgreSQL — odměny za živý souboj
   počítá server (claim_battle_rewards, _battle_odmena, battle_profile).

   Dokazujeme:
     • výše odměny podle pravidel (pořadí, správné, tým, remíza),
     • proti farmení: solo, krátký souboj, polovina otázek, denní strop,
     • odměna se vydá JEDNOU a nejvýš 180 XP najednou (strop savu je +200),
     • výsledek chybějící po zavřené stránce se dopočítá (a souboj před
       zavedením fáze se NEdopočítá, starší výsledky se nevyplatí znovu),
     • statistiky: hráči, výhry, týmové výhry, série, body, jen započítané souboje,
     • práva: anon a public nikam, pomocné funkce zavřené, cizí řádky nikdy,
     • 7 sabotáží (zdroj fáze se mění jen v paměti, funkce se před tím dropnou).

   Produkční pořadí: 4 → 7 → 9 → 13 → 14 → 23 → 29 → 30.
   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const H = require('./sql-harness.cjs');

const P = f => path.join(__dirname, '..', 'projects', f);
const HOST = 'aaaaaaaa-0000-0000-0000-00000000000a';
const U = n => 'aaaaaaaa-0000-0000-0000-0000000000' + String(n).padStart(2, '0');   // U(1)…U(9)
const OUT = U(20);

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

const uzivatele = [HOST, U(1), U(2), U(3), U(4), U(5), U(6), OUT];
const STUBS = `
create schema if not exists auth;
create table auth.users(id uuid primary key, email text);
insert into auth.users values ${uzivatele.map((u, i) => `('${u}','u${i}@husovaliberec.cz')`).join(',')};
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

const jako = (uid, sql) => `set test.uid='${uid}'; set test.email='x@husovaliberec.cz'; ` + sql;
const ANON = `set test.uid=''; set test.email=''; `;

const FILE30 = P('rpg-cloud-setup-phase30.sql');
const SQL30 = fs.readFileSync(FILE30, 'utf8');
const FUNKCE = 'public.claim_battle_rewards()';

let citac = 0;
/* souboj rovnou v hotovém stavu (jako admin); hráč = {u, score, ok, last, team} */
function souboj({ created = '2026-11-10 12:00+01', status = 'finished', q = 10, tym = false, hraci }) {
  citac++;
  const id = `bbbbbbbb-0000-0000-0000-${String(citac).padStart(12, '0')}`;
  let s = `insert into battles (id, code, host_id, host_name, status, q_count, q_seed, team_mode, created_at)
           values ('${id}', 'T${String(citac).padStart(3, '0')}', '${HOST}', 'Host', '${status}', ${q}, 1, ${tym}, '${created}');`;
  for (const h of hraci) {
    s += `insert into battle_players (battle_id, user_id, display_name, score, correct_count, last_qi, team)
          values ('${id}', '${h.u}', 'H', ${h.score}, ${h.ok}, ${h.last === undefined ? q - 1 : h.last}, ${h.team === undefined ? 'null' : h.team});`;
  }
  H.exec(s);
  return id;
}
const vycisti = () => H.exec('delete from battle_results; delete from battle_players; delete from battles;');
const claim = u => JSON.parse(H.q(jako(u, 'select public.claim_battle_rewards()::text')));
const odmena = (...a) => H.q(`select xp || '/' || credits from public._battle_odmena(${a.join(',')})`);   // (rank, correct, total, q, answered, team, team_won, nth)

/* sada kontrol; vrací počet nezdarů (pro sabotáže) */
function kontroly(tichy) {
  let nez = 0;
  const kk = (n, c, d) => { if (!c) nez++; if (!tichy) ok(n, c, d); };
  const T = 'null::smallint', T0 = '0::smallint';

  // ── výše odměny ──
  kk('1. místo, 10 správných → 110 XP a 25 kr', odmena(1, 10, 3, 10, 10, T, 'null', 1) === '110/25', odmena(1, 10, 3, 10, 10, T, 'null', 1));
  kk('2. místo, 4 správné → 62 XP a 15 kr', odmena(2, 4, 3, 10, 10, T, 'null', 1) === '62/15');
  kk('3. místo, 0 správných → 30 XP a 10 kr', odmena(3, 0, 3, 10, 10, T, 'null', 1) === '30/10');
  kk('4. místo → 20 XP a 5 kr', odmena(4, 0, 6, 10, 10, T, 'null', 1) === '20/5');
  kk('bonus za správné je nejvýš +30 XP', odmena(1, 40, 3, 40, 40, T, 'null', 1) === '110/25');
  kk('vítězný tým: +30 XP a +10 kr', odmena(1, 10, 4, 10, 10, T0, 'true', 1) === '140/35', odmena(1, 10, 4, 10, 10, T0, 'true', 1));
  kk('poražený tým: +10 XP, kredity bez bonusu', odmena(2, 5, 4, 10, 10, T0, 'false', 1) === '75/15', odmena(2, 5, 4, 10, 10, T0, 'false', 1));
  kk('remíza týmů: jako poražený (+10 XP)', odmena(3, 0, 4, 10, 10, T0, 'null', 1) === '40/10');
  // ── proti farmení ──
  kk('solo souboj nedá nic', odmena(1, 10, 1, 10, 10, T, 'null', 1) === '0/0');
  kk('souboj do 4 otázek nedá nic', odmena(1, 4, 3, 4, 4, T, 'null', 1) === '0/0');
  kk('2 z 5 odpovězených nedá nic, 3 z 5 už ano', odmena(1, 2, 3, 5, 2, T, 'null', 1) === '0/0' && odmena(1, 2, 3, 5, 3, T, 'null', 1) !== '0/0');
  kk('od 6. odměněného souboje za den se odměna půlí', odmena(1, 10, 3, 10, 10, T, 'null', 6) === '55/12' && odmena(1, 10, 3, 10, 10, T, 'null', 5) === '110/25');

  // ── vydání, jednorázovost, statistiky ──
  vycisti();
  const a = souboj({ hraci: [{ u: U(1), score: 9000, ok: 10 }, { u: U(2), score: 5000, ok: 6 }, { u: U(3), score: 100, ok: 1 }] });
  let r = claim(U(1));
  kk('claim vydá odměnu vítěze (110 XP, 25 kr) a souhrn', r.rewards.length === 1 && r.rewards[0].xp === 110 && r.rewards[0].credits === 25 && r.rewards[0].rank === 1
    && r.stats.played === 1 && r.stats.wins === 1 && r.stats.points === 9000 && r.stats.streak === 1, JSON.stringify(r));
  r = claim(U(1));
  kk('podruhé nevydá nic (jednou za souboj), souhrn zůstává', r.rewards.length === 0 && r.stats.played === 1);
  kk('hráč 2. místa dostane 62 XP, claim je jen jeho', claim(U(2)).rewards[0].xp === 50 + 18 && claim(U(2)).rewards.length === 0);
  kk('cizí člověk nedostane nic a statistiky má nulové', (() => { const x = claim(OUT); return x.rewards.length === 0 && x.stats.played === 0 && x.stats.streak === 0; })());

  // ── dopočet výsledku po zavřené stránce, souboj před zavedením fáze se nedopočítá ──
  vycisti();
  souboj({ hraci: [{ u: U(1), score: 9000, ok: 10 }, { u: U(2), score: 100, ok: 1 }] });
  souboj({ created: '2026-10-01 12:00+02', hraci: [{ u: U(1), score: 9000, ok: 10 }, { u: U(2), score: 100, ok: 1 }] });
  r = claim(U(1));
  kk('bez zapsaného výsledku se odměna dopočítá z dohraného souboje', r.rewards.length === 1 && r.rewards[0].xp === 110, JSON.stringify(r.rewards));
  kk('souboj před zavedením fáze (1. 10.) se nedopočítá', H.q(`select count(*) from battle_results`) === '1');
  kk('rozehraný souboj se nedopočítá', (() => { vycisti(); souboj({ status: 'active', hraci: [{ u: U(1), score: 9000, ok: 10 }, { u: U(2), score: 100, ok: 1 }] }); return claim(U(1)).rewards.length === 0; })());

  // ── starší výsledek (bez q_count) se nevyplácí znovu ──
  vycisti();
  const stary = souboj({ created: '2026-10-01 12:00+02', hraci: [{ u: U(1), score: 9000, ok: 10 }, { u: U(2), score: 100, ok: 1 }] });
  H.exec(`insert into battle_results (battle_id, user_id, game, correct, wrong, score, rank, total) values ('${stary}', '${U(1)}', 'RPG_MAT_9', 10, 0, 9000, 1, 2);
          update battle_results set claimed_at = now() where claimed_at is null and q_count is null;`);
  r = claim(U(1));
  kk('starší výsledek je vyzvednutý, ale do statistik se počítá', r.rewards.length === 0 && r.stats.played === 1 && r.stats.wins === 1);

  // ── strop 180 XP najednou ──
  vycisti();
  for (let i = 0; i < 3; i++) souboj({ hraci: [{ u: U(1), score: 9000 - i, ok: 10 }, { u: U(2), score: 100, ok: 1 }] });
  const dily = [claim(U(1)).rewards.length, claim(U(1)).rewards.length, claim(U(1)).rewards.length, claim(U(1)).rewards.length];
  kk('každý claim vydá nejvýš 180 XP (110 + 110 se nevejde): 1, 1, 1, 0', dily.join(',') === '1,1,1,0', dily.join(','));

  // ── denní strop: 7 soubojů za den, od 6. půlka ──
  vycisti();
  for (let i = 0; i < 7; i++) souboj({ hraci: [{ u: U(1), score: 9000, ok: 10 }, { u: U(2), score: 100, ok: 1 }] });
  const xps = []; for (let i = 0; i < 9; i++) { for (const w of claim(U(1)).rewards) xps.push(w.xp); }
  kk('7 soubojů za den: 5× plná odměna, pak 55, 55', xps.join(',') === '110,110,110,110,110,55,55', xps.join(','));

  // ── tým ──
  vycisti();
  souboj({ tym: true, hraci: [{ u: U(1), score: 9000, ok: 10, team: 0 }, { u: U(2), score: 8000, ok: 8, team: 0 }, { u: U(3), score: 500, ok: 2, team: 1 }, { u: U(4), score: 400, ok: 1, team: 1 }] });
  const vit = claim(U(1)), por = claim(U(3));
  kk('tým: vítěz +30 XP a +10 kr, team_won true', vit.rewards[0].team_won === true && vit.rewards[0].xp === 140 && vit.rewards[0].credits === 35, JSON.stringify(vit.rewards));
  kk('tým: poražený +10 XP, team_won false', por.rewards[0].team_won === false && por.rewards[0].xp === 30 + 6 + 10 && por.rewards[0].credits === 10, JSON.stringify(por.rewards));
  kk('statistiky: týmové výhry', vit.stats.team_wins === 1 && por.stats.team_wins === 0);
  vycisti();
  souboj({ tym: true, hraci: [{ u: U(1), score: 1000, ok: 5, team: 0 }, { u: U(2), score: 1000, ok: 5, team: 1 }] });
  kk('remíza týmů: team_won je NULL', claim(U(1)).rewards[0].team_won === null);

  // ── série výher a započítávané souboje ──
  vycisti();
  const poradi = [1, 1, 2, 1, 1]; // od nejstaršího; poslední dvě výhry
  poradi.forEach((p, i) => {
    const id = souboj({ created: `2026-11-1${i} 12:00+01`, hraci: [{ u: U(1), score: p === 1 ? 9000 : 100, ok: 5 }, { u: U(2), score: p === 1 ? 100 : 9000, ok: 5 }] });
    H.exec(`insert into battle_results (battle_id, user_id, game, correct, wrong, score, rank, total, q_count, answered, claimed_at, finished_at)
            values ('${id}', '${U(1)}', 'RPG_MAT_9', 5, 5, ${p === 1 ? 9000 : 100}, ${p}, 2, 10, 10, now(), '2026-11-1${i} 13:00+01');`);
  });
  const st = claim(U(1)).stats;
  kk('série = výhry po sobě od nejnovějšího (2), výhry 4 z 5', st.streak === 2 && st.wins === 4 && st.played === 5, JSON.stringify(st));
  H.exec(`insert into battle_results (battle_id, user_id, game, correct, wrong, score, rank, total, q_count, answered, claimed_at, finished_at)
          values ('bbbbbbbb-0000-0000-0000-999999999991', '${U(1)}', 'RPG_MAT_9', 2, 8, 9999, 1, 1, 10, 10, now(), '2026-11-19 13:00+01'),
                 ('bbbbbbbb-0000-0000-0000-999999999992', '${U(1)}', 'RPG_MAT_9', 1, 9, 9999, 1, 3, 10, 2, now(), '2026-11-20 13:00+01');`);
  const st2 = JSON.parse(H.q(jako(U(1), 'select public.battle_profile()::text')));
  kk('solo souboj a souboj s méně než polovinou odpovědí se nepočítá (ani do série a bodů)', st2.played === 5 && st2.streak === 2 && st2.points === 9000 * 4 + 100, JSON.stringify(st2));
  kk('battle_profile vrací jen vlastní souhrn', JSON.parse(H.q(jako(U(5), 'select public.battle_profile()::text'))).played === 0);

  // ── práva a vstupy ──
  const pr = f => H.q(`select has_function_privilege('anon','${f}','execute')::text || ',' || has_function_privilege('public','${f}','execute')::text || ',' || has_function_privilege('authenticated','${f}','execute')::text`);
  kk('claim_battle_rewards: anon ne, public ne, authenticated ano', pr('public.claim_battle_rewards()') === 'false,false,true');
  kk('battle_profile: anon ne, public ne, authenticated ano', pr('public.battle_profile()') === 'false,false,true');
  kk('pomocné funkce nikdo z klientů nezavolá', ['public._battle_save_result(uuid,uuid)', 'public._battle_stats(uuid)', 'public._battle_rewards_od()',
    'public._battle_odmena(int,int,int,int,int,smallint,boolean,int)'].every(f => pr(f) === 'false,false,false'));
  kk('nepřihlášený: claim i record_battle_result spadnou', /not authenticated/.test(H.expectFail(ANON + 'select public.claim_battle_rewards()') || '')
    && /not authenticated/.test(H.expectFail(ANON + `select public.record_battle_result('${'bbbbbbbb-0000-0000-0000-000000000001'}')`) || ''));
  vycisti();
  const rb = souboj({ tym: true, hraci: [{ u: U(1), score: 700, ok: 7, team: 1 }, { u: U(2), score: 300, ok: 3, team: 0 }] });
  H.q(jako(U(1), `select public.record_battle_result('${rb}')`));
  H.q(jako(OUT, `select public.record_battle_result('${rb}')`));
  kk('record_battle_result zapíše tým, odpovězené a počet otázek jen účastníkovi', H.q(`select count(*) from battle_results`) === '1'
    && H.q(`select team::text || ',' || team_won::text || ',' || answered::text || ',' || q_count::text from battle_results`) === '1,true,10,10');
  return nez;
}

(function main() {
  console.log('\n── Fáze 30 SQL: odměny za živý souboj ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: ' + why + '\n'); process.exit(0); }

  try {
    H.start('pgtest30');
    H.exec(STUBS);
    const fazeAz13 = ['rpg-cloud-setup-phase4.sql', 'rpg-cloud-setup-phase7.sql', 'rpg-cloud-setup-phase9.sql',
                      'rpg-cloud-setup-phase13.sql', 'rpg-cloud-setup-phase14.sql', 'rpg-cloud-setup-phase23.sql', 'rpg-cloud-setup-phase29.sql'];
    for (const f of fazeAz13) {
      let good = true, err = '';
      try { H.file(P(f)); } catch (e) { good = false; err = String(e.stderr || e.message || e).slice(0, 200); }
      ok(f.replace('rpg-cloud-setup-', '') + ' se spustí bez chyby', good, err);
      if (!good) return;
    }
    // starší výsledek ještě před fází 30
    H.exec(`insert into battles (id, code, host_id, host_name, status, q_count, q_seed, created_at)
            values ('bbbbbbbb-0000-0000-0000-0000000000aa', 'OLD1', '${HOST}', 'H', 'finished', 10, 1, '2026-09-01');
            insert into battle_results (battle_id, user_id, game, correct, wrong, score, rank, total)
            values ('bbbbbbbb-0000-0000-0000-0000000000aa', '${U(1)}', 'RPG_MAT_9', 8, 2, 7000, 1, 3);`);
    let good = true; try { H.file(FILE30); } catch (e) { good = false; console.log(String(e.stderr || e.message).slice(0, 300)); }
    ok('phase30.sql se spustí bez chyby', good);
    if (!good) return;
    let idem = true; try { H.file(FILE30); H.file(FILE30); } catch (e) { idem = false; }
    ok('fáze 30 je idempotentní (třikrát za sebou)', idem);
    ok('starší výsledek je po zavedení fáze označen za vyzvednutý', H.q(`select (claimed_at is not null)::text from battle_results where battle_id = 'bbbbbbbb-0000-0000-0000-0000000000aa'`) === 'true');
    H.exec('delete from battle_results; delete from battle_players; delete from battles;');

    kontroly(false);

    console.log('\n── Sabotáže ──');
    const SAB = [
      ['odměna se vydá víckrát (bez claimed_at is null)', "where user_id = uid and claimed_at is null", "where user_id = uid"],
      ['bez denního stropu', 'when p_nth > 5 then x / 2', 'when p_nth > 5000 then x / 2'],
      ['bez stropu 180 XP', 'if xp_sum > 0 and xp_sum + o.xp > 180 then exit; end if;', ''],
      ['solo souboj se odměňuje', '(coalesce(p_total, 0) >= 2 and', '(coalesce(p_total, 0) >= 1 and'],
      ['bez týmového bonusu', "case when p_team is null then 0 when p_team_won is true then 30 else 10 end", '0'],
      ['dopočet i souboje před zavedením fáze', "and b.created_at >= public._battle_rewards_od()", ''],
      ['claim volatelný i pro anon', 'grant  execute on function public.claim_battle_rewards()                                       to authenticated;',
        'grant  execute on function public.claim_battle_rewards()                                       to authenticated, anon;']
    ];
    for (const [jm, od, na] of SAB) {
      const nove = SQL30.replace(od, na);
      if (nove === SQL30) { ok('sabotáž se neaplikovala: ' + jm, false); continue; }
      let n = -1;
      try {
        H.exec(`drop function if exists ${FUNKCE};`);
        H.exec(nove);
        n = kontroly(true);
      } catch (e) { n = 1; }
      ok('sabotáž chycena: ' + jm + ' (' + n + ' nezdarů)', n > 0);
    }
    H.exec(`drop function if exists ${FUNKCE};`);
    H.file(FILE30);
    ok('po sabotážích je obnovená původní verze (všechny kontroly zelené)', kontroly(true) === 0);
  } catch (e) {
    console.log('  ❌ výjimka testu: ' + String(e.stderr || e.message || e).slice(0, 500)); fail++;
  } finally { H.stop(); }

  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: ' + pass + ' ✅  /  ' + fail + ' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
