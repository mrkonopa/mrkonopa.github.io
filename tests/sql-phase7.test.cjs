/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 7 SQL proti SKUTEČNÉMU PostgreSQL — živý souboj (Kahoot-style).
   Největší neověřená část cloudu: 3 tabulky, 12 funkcí, soutěžní skóre.

   Dokazujeme:
     • celý životní cyklus místnosti (vytvoření, připojení kódem, posun otázek),
     • skórování NELZE farmit: body clampnuté (0–1500), jen ŽIVÁ otázka,
       žádné dvojí skórování téže otázky, nečlen nic nezapíše,
     • řízení bitvy smí jen host nebo staff; stav bitvy vidí jen člen/host/staff,
     • DOSAH FÁZE 23: `_battle_can_control` i `battle_state` používají
       `(select my_role()) in (…)` v OR výrazu — na NULL roli vyjde celé
       `allowed` = NULL, takže `if not allowed` neprojde a brána se tiše
       otevře. Test tu díru reprodukuje na staré definici my_role().
     • cleanup_battles je staff-only, RLS deny-all, anon nikam.

   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');

const P = f => path.join(__dirname, '..', 'projects', f);
const HOST  = 'aaaaaaaa-0000-0000-0000-00000000000a';
const PLAY  = 'aaaaaaaa-0000-0000-0000-00000000000b';   // hráč, který se připojí
const OUT   = 'aaaaaaaa-0000-0000-0000-00000000000c';   // cizí žák, není ve bitvě
const TEACH = 'aaaaaaaa-0000-0000-0000-0000000000ff';

let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c) { console.log('  ✅ '+n); pass++; } else { console.log('  ❌ '+n+(d?' — '+d:'')); fail++; } };

const STUBS = `
create schema if not exists auth;
create table auth.users(id uuid primary key, email text);
insert into auth.users values ('${HOST}','host@husovaliberec.cz'),('${PLAY}','hrac@husovaliberec.cz'),
                              ('${OUT}','cizi@husovaliberec.cz'),('${TEACH}','ucitel@husovaliberec.cz');
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), '')) $$;
create role anon; create role authenticated;
create table public.roles(email text primary key, role text);
insert into public.roles values ('ucitel@husovaliberec.cz','teacher');
-- fáze 4 (leaderboard) je v seznamu, který utahuje fáze 9 → potřebuje tabulky
create table public.saves(user_id uuid, game text, name text, full_name text, data jsonb);
create table public.class_members(class_id uuid, user_id uuid);
`;

// stará (děravá) my_role z fáze 2 — kvůli reprodukci dosahu NULL díry
const OLD_MY_ROLE = `
create or replace function public.my_role() returns text
language sql security definer stable set search_path = public as $$
  select role from public.roles where lower(email) = lower(auth.jwt() ->> 'email') limit 1;
$$;`;

const as = (uid, email, sql) => `set test.uid='${uid}'; set test.email='${email}'; ` + sql;
const asHost  = sql => as(HOST,  'host@husovaliberec.cz',   sql);
const asPlay  = sql => as(PLAY,  'hrac@husovaliberec.cz',   sql);
const asOut   = sql => as(OUT,   'cizi@husovaliberec.cz',   sql);
const asTeach = sql => as(TEACH, 'ucitel@husovaliberec.cz', sql);

(function main(){
  console.log('\n── Fáze 7 SQL: živý souboj proti skutečnému PostgreSQL ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: '+why+'\n'); process.exit(0); }

  try {
    H.start('pgtest7');
    // my_role() musí existovat PŘED fází 7 (SQL funkce se parsují při vytvoření;
    // v produkci ji dodá fáze 2). Sázíme sem PŮVODNÍ (děravou) verzi z fáze 2 —
    // přesně jako v realitě, kde ji utáhla až fáze 23.
    H.exec(STUBS + OLD_MY_ROLE);
    // produkční pořadí: 4 (leaderboard) → 7 (bitvy) → 9 (utažení práv) → 23 (NULL role)
    for (const f of ['rpg-cloud-setup-phase4.sql', 'rpg-cloud-setup-phase7.sql',
                     'rpg-cloud-setup-phase9.sql', 'rpg-cloud-setup-phase23.sql']) {
      let good = true, err = '';
      try { H.file(P(f)); } catch (e) { good = false; err = String(e.stderr||e.message||e).slice(0,180); }
      ok(f.replace('rpg-cloud-setup-','')+' se spustí bez chyby', good, err);
      if (!good) return;
    }

    // ── 1) vytvoření místnosti ──
    ok('nepřihlášený nemůže vytvořit místnost',
      /not authenticated/.test(H.expectFail(`select public.create_battle('RPG_MAT_9', 10, 'Host')`)||''));
    const code = H.q(asHost(`select (public.create_battle('RPG_MAT_9', 10, 'Vojta')).code`));
    ok('host vytvoří místnost a dostane kód', /^[A-Z2-9]{4,8}$/.test(code), code);
    ok('kód neobsahuje matoucí znaky (0/O/1/I)', !/[01OI]/.test(code), code);
    const bid = H.q(`select id from battles where code='${code}'`);
    ok('host je hned zapsán jako hráč', H.q(`select count(*) from battle_players where battle_id='${bid}' and user_id='${HOST}'`)==='1');
    ok('q_count je clampnutý do 3–40',
      H.q(asHost(`select (public.create_battle('RPG_MAT_9', 999, 'X')).q_count`))==='40' &&
      H.q(asHost(`select (public.create_battle('RPG_MAT_9', -5, 'X')).q_count`))==='3');
    ok('q_index začíná na -1 (ještě nezačalo)', H.q(`select q_index from battles where id='${bid}'`)==='-1');

    // ── 2) připojení kódem ──
    ok('připojení špatným kódem selže',
      /battle not found/.test(H.expectFail(asPlay(`select public.join_battle('XXXX','Hráč')`))||''));
    H.q(asPlay(`select public.join_battle('${code.toLowerCase()}  ', 'Anička')`));
    ok('kód je case-insensitive a trimovaný', H.q(`select count(*) from battle_players where battle_id='${bid}' and user_id='${PLAY}'`)==='1');
    H.q(asPlay(`select public.join_battle('${code}', 'Anička2')`));
    ok('opakované připojení nezduplikuje hráče (upsert)',
      H.q(`select count(*) from battle_players where battle_id='${bid}' and user_id='${PLAY}'`)==='1');
    ok('a jen přepíše jméno', H.q(`select display_name from battle_players where battle_id='${bid}' and user_id='${PLAY}'`)==='Anička2');

    // ── 3) řízení bitvy smí jen host / staff ──
    ok('cizí žák NESMÍ posunout otázku (po fázi 23)',
      /forbidden/.test(H.expectFail(asOut(`select public.advance_battle('${bid}', 0)`))||''));
    ok('ani hráč v bitvě (není host) NESMÍ posunout otázku',
      /forbidden/.test(H.expectFail(asPlay(`select public.advance_battle('${bid}', 0)`))||''));
    ok('host posune otázku', H.q(asHost(`select (public.advance_battle('${bid}', 0)).q_index`))==='0');
    ok('posun na otázku rozjede bitvu (status active)', H.q(`select status from battles where id='${bid}'`)==='active');
    ok('učitel smí řídit cizí bitvu', H.q(asTeach(`select (public.advance_battle('${bid}', 0)).q_index`))==='0');
    ok('cizí žák NESMÍ měnit stav',
      /forbidden/.test(H.expectFail(asOut(`select public.set_battle_status('${bid}','paused')`))||''));
    ok('neplatný stav je odmítnut',
      /bad status/.test(H.expectFail(asHost(`select public.set_battle_status('${bid}','nesmysl')`))||''));
    ok('učitel převzetím řízení zapíše controlled_by',
      H.q(asTeach(`select (public.set_battle_status('${bid}','active')).controlled_by`))===TEACH);

    // ── 4) skórování se nedá farmit ──
    const score = () => H.q(`select score from battle_players where battle_id='${bid}' and user_id='${PLAY}'`);
    H.q(asPlay(`select public.submit_battle_answer('${bid}', 0, true, 100)`));
    ok('správná odpověď na živou otázku připíše body', score()==='100', score());
    H.q(asPlay(`select public.submit_battle_answer('${bid}', 0, true, 100)`));
    ok('DVOJÍ odeslání téže otázky NEpřipíše znovu (last_qi)', score()==='100', score());
    H.q(asPlay(`select public.submit_battle_answer('${bid}', 5, true, 100)`));
    ok('odpověď na JINOU otázku než živou se ignoruje', score()==='100', score());
    H.q(asHost(`select public.advance_battle('${bid}', 1)`));
    H.q(asPlay(`select public.submit_battle_answer('${bid}', 1, true, 999999)`));
    ok('body jsou clampnuté na 1500 (proti podvodu)', score()==='1600', score());
    H.q(asHost(`select public.advance_battle('${bid}', 2)`));
    H.q(asPlay(`select public.submit_battle_answer('${bid}', 2, true, -500)`));
    ok('negativní body se clampnou na 0 (skóre nejde snížit)', score()==='1600', score());
    H.q(asHost(`select public.advance_battle('${bid}', 3)`));
    H.q(asPlay(`select public.submit_battle_answer('${bid}', 3, false, 1500)`));
    ok('špatná odpověď body nepřipíše', score()==='1600', score());
    // pozn.: odpoved s clampnutymi 0 body je porad SPRAVNA -> pocita se do
    // correct_count (q0, q1, q2 spravne = 3), jen skore nepridala
    ok('correct_count pocita spravne odpovedi (i tu za 0 bodu)',
      H.q(`select correct_count from battle_players where battle_id='${bid}' and user_id='${PLAY}'`)==='3',
      H.q(`select correct_count from battle_players where battle_id='${bid}' and user_id='${PLAY}'`));
    ok('spatna odpoved correct_count nezvysila (zustalo 3)',
      H.q(`select correct_count from battle_players where battle_id='${bid}' and user_id='${PLAY}'`)==='3');
    H.q(asOut(`select public.submit_battle_answer('${bid}', 3, true, 1500)`));
    ok('nečlen bitvy nic nezapíše (žádný řádek pro něj)',
      H.q(`select count(*) from battle_players where battle_id='${bid}' and user_id='${OUT}'`)==='0');
    H.q(asHost(`select public.set_battle_status('${bid}','paused')`));
    H.q(asHost(`select public.advance_battle('${bid}', 4)`));   // advance zase nastaví active
    H.q(asHost(`select public.set_battle_status('${bid}','paused')`));
    H.q(asPlay(`select public.submit_battle_answer('${bid}', 4, true, 500)`));
    ok('v pauze se body nepřipisují (status musí být active)', score()==='1600', score());
    H.q(asHost(`select public.set_battle_status('${bid}','active')`));
    ok('nepřihlášený odesláním nic nezpůsobí (nespadne)',
      H.expectFail(`select public.submit_battle_answer('${bid}', 4, true, 500)`)===null);

    // ── 5) stav bitvy vidí jen člen / host / staff ──
    ok('člen vidí stav bitvy', /players/.test(H.q(asPlay(`select public.battle_state('${bid}')::text`))));
    ok('host vidí stav bitvy', /battle/.test(H.q(asHost(`select public.battle_state('${bid}')::text`))));
    ok('učitel vidí stav bitvy', /battle/.test(H.q(asTeach(`select public.battle_state('${bid}')::text`))));
    ok('CIZÍ žák stav NEvidí (po fázi 23)',
      /forbidden/.test(H.expectFail(asOut(`select public.battle_state('${bid}')`))||''));
    ok('neexistující bitva vrátí NULL, ne chybu',
      H.q(asHost(`select coalesce(public.battle_state('99999999-9999-9999-9999-999999999999')::text,'<NULL>')`))==='<NULL>');
    ok('stav neprozrazuje e-maily hráčů',
      !/husovaliberec/.test(H.q(asPlay(`select public.battle_state('${bid}')::text`))));

    // ── 6) DOSAH FÁZE 23: NULL role otevírala řízení i čtení cizí bitvy ──
    H.exec(OLD_MY_ROLE);
    const holeCtl = H.expectFail(asOut(`select public.advance_battle('${bid}', 0)`));
    ok('DÍRA (bez fáze 23): cizí žák MŮŽE řídit bitvu — `not NULL` neprojde', holeCtl===null,
      'chyba: '+String(holeCtl).slice(0,70));
    const holeState = H.expectFail(asOut(`select public.battle_state('${bid}')`));
    ok('DÍRA (bez fáze 23): cizí žák MŮŽE číst stav i skóre všech hráčů', holeState===null,
      'chyba: '+String(holeState).slice(0,70));
    H.file(P('rpg-cloud-setup-phase23.sql'));
    ok('po fázi 23 je řízení zavřené',
      /forbidden/.test(H.expectFail(asOut(`select public.advance_battle('${bid}', 0)`))||''));
    ok('po fázi 23 je čtení stavu zavřené',
      /forbidden/.test(H.expectFail(asOut(`select public.battle_state('${bid}')`))||''));

    // ── 7) učitelský přehled bitev ──
    ok('učitel vidí neukončené bitvy', +H.q(asTeach(`select count(*) from public.list_active_battles()`))>0);
    ok('žák přehled bitev NEvidí', H.q(asPlay(`select count(*) from public.list_active_battles()`))==='0');
    H.q(asHost(`select public.set_battle_status('${bid}','finished')`));
    ok('ukončená bitva z přehledu zmizí',
      !H.q(asTeach(`select coalesce(string_agg(code,','),'') from public.list_active_battles()`)).includes(code));
    ok('do ukončené bitvy se nelze připojit',
      /battle not found/.test(H.expectFail(asOut(`select public.join_battle('${code}','X')`))||''));

    // ── 8) pozvánky ──
    const c2 = H.q(asHost(`select (public.create_battle('RPG_MAT_9', 5, 'Vojta')).code`));
    const b2 = H.q(`select id from battles where code='${c2}'`);
    ok('cizí žák NESMÍ zvát do bitvy',
      /forbidden/.test(H.expectFail(asOut(`select public.invite_battle_email('${b2}','x@y.cz')`))||''));
    H.q(asHost(`select public.invite_battle_email('${b2}', '  HRAC@husovaliberec.CZ ')`));
    ok('e-mail se normalizuje (lower + trim)',
      H.q(`select email from battle_invites where battle_id='${b2}'`)==='hrac@husovaliberec.cz');
    H.q(asHost(`select public.invite_battle_email('${b2}', 'hrac@husovaliberec.cz')`));
    ok('dvojí pozvánka nezduplikuje', H.q(`select count(*) from battle_invites where battle_id='${b2}'`)==='1');
    ok('pozvaný svou pozvánku vidí',
      H.rows(asPlay(`select code from public.my_battle_invites()`)).some(r=>r[0]===c2));
    ok('nepozvaný žák pozvánku nevidí', H.q(asOut(`select count(*) from public.my_battle_invites()`))==='0');
    H.q(asHost(`select public.set_battle_status('${b2}','finished')`));
    ok('pozvánka do ukončené bitvy se nenabízí', H.q(asPlay(`select count(*) from public.my_battle_invites()`))==='0');

    // ── 9) úklid starých bitev ──
    ok('žák NESMÍ mazat bitvy',
      /forbidden/.test(H.expectFail(asPlay(`select public.cleanup_battles()`))||''));
    H.exec(`update battles set created_at = now() - interval '13 hours' where id='${bid}'`);
    const del = H.q(asTeach(`select public.cleanup_battles()`));
    ok('učitel smaže bitvy starší 12 h a dostane počet', del==='1', del);
    ok('mladší bitvy zůstaly', +H.q(`select count(*) from battles`)>0);
    ok('smazání bitvy odstranilo i její hráče (cascade)',
      H.q(`select count(*) from battle_players where battle_id='${bid}'`)==='0');

    // ── 10) RLS deny-all + granty ──
    for (const t of ['battles','battle_players','battle_invites']) {
      ok('tabulka '+t+' má RLS zapnutou bez politik (vše jen přes RPC)',
        H.q(`select relrowsecurity from pg_class where relname='${t}'`)==='t' &&
        H.q(`select count(*) from pg_policies where tablename='${t}'`)==='0');
    }
    for (const [label, sig] of [['create_battle','public.create_battle(text,int,text)'],
                                ['join_battle','public.join_battle(text,text)'],
                                ['advance_battle','public.advance_battle(uuid,int)'],
                                ['set_battle_status','public.set_battle_status(uuid,text)'],
                                ['submit_battle_answer','public.submit_battle_answer(uuid,int,boolean,int)'],
                                ['battle_state','public.battle_state(uuid)'],
                                ['list_active_battles','public.list_active_battles()'],
                                ['cleanup_battles','public.cleanup_battles()']]) {
      ok('anon NEMÁ execute na '+label+' (po fázi 9)', H.q(`select has_function_privilege('anon','${sig}','execute')`)==='f');
    }
    // fáze 9 odebírá cleanup_battles i roli authenticated (údržba = dashboard/cron)
    ok('cleanup_battles nemá execute ani authenticated (fáze 9)',
      H.q(`select has_function_privilege('authenticated','public.cleanup_battles()','execute')`)==='f');
    ok('interní pomocníci nejsou volatelní ani pro authenticated',
      H.q(`select has_function_privilege('authenticated','public._battle_can_control(uuid)','execute')`)==='f' &&
      H.q(`select has_function_privilege('authenticated','public._battle_gen_code()','execute')`)==='f');
    // re-run past: opětovné spuštění fáze 7 nesmí utažení z fáze 9 zrušit
    H.file(P('rpg-cloud-setup-phase7.sql'));
    ok('RE-RUN fáze 7 NEvrátí execute na cleanup_battles (past zavřená)',
      H.q(`select has_function_privilege('authenticated','public.cleanup_battles()','execute')`)==='f');

    // ── 11) idempotence ──
    let again = true, e2 = '';
    try { H.file(P('rpg-cloud-setup-phase7.sql')); } catch (e) { again = false; e2 = String(e.stderr||e.message||e).slice(0,120); }
    ok('phase7.sql jde spustit znovu (i bez supabase_realtime publikace)', again, e2);
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
