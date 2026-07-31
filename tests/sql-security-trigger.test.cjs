/* ══════════════════════════════════════════════════════════════════════
   Strojové ověření `rpg-cloud-setup-security.sql` nad SKUTEČNÝM PostgreSQL.

   Tenhle soubor stojí mimo číslovanou řadu fází, takže se na něj při
   ověřování fází zapomnělo — a přitom je to jediné místo, kde server sahá
   na žákovská data v BEFORE UPDATE triggeru. Revize v něm našla přesně tu
   vadu, před kterou varuje CLAUDE.md: `(data ->> 'xp')::bigint` na hodnotě,
   kterou píše klient. Na "1.5", "abc" nebo objektu cast VYHODÍ CHYBU a
   protože je to BEFORE UPDATE, žákovi se od té chvíle neuloží NIC.

   Test nejdřív díru REPRODUKUJE na staré definici a teprve pak dokazuje,
   že ji nová verze zavírá.

   Spusť: node tests/sql-security-trigger.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const why = H.unavailable();
if (why) { console.log('\n  ⏭️  přeskočeno: ' + why + '\n'); process.exit(0); }

const SQL_FILE = path.join(__dirname, '..', 'rpg-cloud-setup-security.sql');

// Minimální stuby: to, co v Supabase existuje a v čistém PG ne.
const STUBS = H.AUTH_STUB + `
-- auth.jwt() čte trigger kvůli e-mailu → GUC, ať jde přepínat "kdo se ptá"
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), ''))
$$;
create table public.roles (email text primary key, role text not null);
create table public.saves (
  user_id uuid not null, game text not null, data jsonb not null default '{}'::jsonb,
  primary key (user_id, game));
insert into public.roles values ('ucitel@husovaliberec.cz', 'teacher');

create or replace function jako(p_email text) returns void language sql as $$
  select set_config('test.uid', '11111111-1111-1111-1111-111111111111', false),
         set_config('test.email', p_email, false); select null::void $$;
`;

// PŮVODNÍ (děravá) podoba obou větví — pro důkaz, že test vadu vidí.
const STARA_VERZE = `
create or replace function fn_validate_save_delta()
returns trigger language plpgsql security invoker set search_path = public as $$
declare v_role text := 'student'; old_val bigint; new_val bigint; capped bigint;
begin
  if auth.uid() is null then return new; end if;
  begin
    select coalesce(role,'student') into v_role from public.roles
      where email = lower(auth.jwt() ->> 'email') limit 1;
  exception when others then v_role := 'student'; end;
  if v_role in ('teacher','superadmin') then return new; end if;
  if new.game = '_wallet' and new.data ? 'credits' and old.data ? 'credits' then
    old_val := coalesce((old.data ->> 'credits')::bigint, 0);
    new_val := coalesce((new.data ->> 'credits')::bigint, 0);
    if new_val < 0 then new.data := jsonb_set(new.data,'{credits}','0');
    elsif new_val - old_val > 500 then new.data := jsonb_set(new.data,'{credits}', to_jsonb(old_val+500)); end if;
  end if;
  if new.game like 'RPG_MAT_%' and new.data ? 'xp' and old.data ? 'xp' then
    old_val := coalesce((old.data ->> 'xp')::bigint, 0);
    new_val := coalesce((new.data ->> 'xp')::bigint, 0);
    if new_val < 0 then new.data := jsonb_set(new.data,'{xp}','0');
    elsif new_val - old_val > 200 then capped := old_val + 200;
      new.data := jsonb_set(new.data,'{xp}', to_jsonb(capped)); end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_validate_save_delta on public.saves;
create trigger trg_validate_save_delta before update on public.saves
  for each row execute function fn_validate_save_delta();
`;

const U = "'11111111-1111-1111-1111-111111111111'::uuid";
const reset = (game, data) => H.exec(
  `delete from public.saves where game = '${game}';
   insert into public.saves(user_id, game, data) values (${U}, '${game}', '${data}'::jsonb);`);
const upd = (game, data) =>
  H.q(`select jako('zak@husovaliberec.cz');
       update public.saves set data = '${data}'::jsonb where game = '${game}';`);
const val = (game, key) =>
  H.q(`select data ->> '${key}' from public.saves where game = '${game}'`);

console.log('\n── rpg-cloud-setup-security.sql nad skutečným PostgreSQL ──\n');
H.start('pgtestsec');
try {
  H.exec(STUBS);

  /* ── 1. STARÁ verze: podvržená hodnota shodí žákovi ukládání ──────── */
  H.exec(STARA_VERZE);
  reset('_wallet', '{"credits": 100}');
  ok(H.expectFail(`select jako('zak@husovaliberec.cz');
       update public.saves set data = '{"credits": "abc"}'::jsonb where game = '_wallet';`),
    'STARÁ verze: nečíselné kredity shodí UPDATE (reprodukce vady)');
  reset('_wallet', '{"credits": 100}');
  ok(H.expectFail(`select jako('zak@husovaliberec.cz');
       update public.saves set data = '{"credits": 1.5}'::jsonb where game = '_wallet';`),
    'STARÁ verze: desetinné kredity shodí UPDATE');
  reset('RPG_MAT_9', '{"xp": 50}');
  ok(H.expectFail(`select jako('zak@husovaliberec.cz');
       update public.saves set data = '{"xp": {"a":1}}'::jsonb where game = 'RPG_MAT_9';`),
    'STARÁ verze: objekt místo XP shodí UPDATE');
  reset('_wallet', '{"stary_klic": 1}');
  H.q(`select jako('zak@husovaliberec.cz');
       update public.saves set data = '{"credits": 999999}'::jsonb where game = '_wallet';`);
  ok(val('_wallet', 'credits') === '999999',
    'STARÁ verze: chybějící klíč ve starém savu vypnul strop úplně (reprodukce)');

  /* ── 2. NOVÁ verze: soubor se vůbec musí dát spustit ──────────────── */
  H.file(SQL_FILE);
  ok(H.q("select 1 from pg_proc where proname = '_save_num'") === '1', '_save_num() vznikla');
  ok(H.q("select 1 from pg_trigger where tgname = 'trg_validate_save_delta'") === '1', 'trigger je na místě');

  /* ── 3. _save_num() nikdy nespadne ────────────────────────────────── */
  const cases = [
    [`'{"x": 42}'`, '42', 'celé číslo'],
    [`'{"x": "42"}'`, '42', 'číslo jako řetězec'],
    [`'{"x": 1.9}'`, '1', 'desetinné se usekne dolů'],
    [`'{"x": "abc"}'`, '0', 'text → 0'],
    [`'{"x": -5}'`, '0', 'záporné → 0'],
    [`'{"x": {"a":1}}'`, '0', 'objekt → 0'],
    [`'{"x": [1,2]}'`, '0', 'pole → 0'],
    [`'{"x": null}'`, '0', 'null → 0'],
    [`'{"y": 1}'`, '0', 'chybějící klíč → 0'],
    [`'[1,2,3]'`, '0', 'JSON není objekt → 0'],
    [`'{"x": 99999999999999999999}'`, '0', 'přetečení → 0'],
    [`null`, '0', 'NULL jsonb → 0'],
  ];
  let vsechny = true;
  for (const [j, want, popis] of cases) {
    let got;
    try { got = H.q(`select public._save_num(${j}::jsonb, 'x')`); }
    catch (e) { got = 'SPADLO'; }
    if (got !== want) { vsechny = false; ok(false, '_save_num ' + popis, 'čekáno ' + want + ', vyšlo ' + got); }
  }
  if (vsechny) { pass++; console.log('  ✅ _save_num(): všech ' + cases.length + ' vstupů bez pádu'); }

  /* ── 4. NOVÁ verze: tytéž útoky už ukládání neshodí ───────────────── */
  reset('_wallet', '{"credits": 100}');
  ok(upd('_wallet', '{"credits": "abc"}') !== null && val('_wallet', 'credits') === '0',
    'nečíselné kredity: uloží se a srovnají na 0', 'vyšlo ' + val('_wallet', 'credits'));
  reset('_wallet', '{"credits": 100}');
  upd('_wallet', '{"credits": 1.5}');
  ok(val('_wallet', 'credits') === '1', 'desetinné kredity se useknou na 1', 'vyšlo ' + val('_wallet', 'credits'));
  reset('_wallet', '{"credits": 100}');
  upd('_wallet', '{"credits": -50}');
  ok(val('_wallet', 'credits') === '0', 'záporné kredity → 0', 'vyšlo ' + val('_wallet', 'credits'));
  reset('RPG_MAT_9', '{"xp": 50, "level": 1}');
  upd('RPG_MAT_9', '{"xp": {"a":1}, "level": 99}');
  ok(val('RPG_MAT_9', 'xp') === '0' && val('RPG_MAT_9', 'level') === '1',
    'objekt místo XP → 0 a úroveň zpět na 1', 'xp=' + val('RPG_MAT_9', 'xp') + ' lvl=' + val('RPG_MAT_9', 'level'));

  /* ── 5. Stropy pořád drží ─────────────────────────────────────────── */
  reset('_wallet', '{"credits": 100}');
  upd('_wallet', '{"credits": 100000}');
  ok(val('_wallet', 'credits') === '600', 'strop kreditů: +500 za save', 'vyšlo ' + val('_wallet', 'credits'));
  reset('_wallet', '{"credits": 100}');
  upd('_wallet', '{"credits": 400}');
  ok(val('_wallet', 'credits') === '400', 'poctivý přírůstek do 500 projde', 'vyšlo ' + val('_wallet', 'credits'));
  reset('RPG_MAT_9', '{"xp": 500, "level": 6}');
  upd('RPG_MAT_9', '{"xp": 99999, "level": 999}');
  ok(val('RPG_MAT_9', 'xp') === '700' && val('RPG_MAT_9', 'level') === '8',
    'strop XP: +200 a úroveň se dopočítá', 'xp=' + val('RPG_MAT_9', 'xp') + ' lvl=' + val('RPG_MAT_9', 'level'));

  /* ── 6. Díra „chybějící klíč ve starém savu" je zavřená ───────────── */
  reset('_wallet', '{"stary_klic": 1}');
  upd('_wallet', '{"credits": 999999}');
  ok(val('_wallet', 'credits') === '500', 'chybějící klíč ve starém savu už strop nevypne',
    'vyšlo ' + val('_wallet', 'credits'));
  reset('RPG_MAT_9', '{"level": 1}');
  upd('RPG_MAT_9', '{"xp": 999999}');
  ok(val('RPG_MAT_9', 'xp') === '200', 'totéž pro XP', 'vyšlo ' + val('RPG_MAT_9', 'xp'));

  /* ── 7. Bypassy zůstávají ─────────────────────────────────────────── */
  reset('_wallet', '{"credits": 100}');
  H.q(`select jako('ucitel@husovaliberec.cz');
       update public.saves set data = '{"credits": 100000}'::jsonb where game = '_wallet';`);
  ok(val('_wallet', 'credits') === '100000', 'učitel má bypass', 'vyšlo ' + val('_wallet', 'credits'));
  reset('_wallet', '{"credits": 100}');
  H.q(`select set_config('test.uid','',false), set_config('test.email','',false);
       update public.saves set data = '{"credits": 100000}'::jsonb where game = '_wallet';`);
  ok(val('_wallet', 'credits') === '100000', 'přímý přístup do DB (bez JWT) má bypass',
    'vyšlo ' + val('_wallet', 'credits'));
  reset('_wallet', '{"credits": 100}');
  H.q(`select jako('nikdo@husovaliberec.cz');
       update public.saves set data = '{"credits": 100000}'::jsonb where game = '_wallet';`);
  ok(val('_wallet', 'credits') === '600', 'kdo není v allowlistu, bypass NEMÁ',
    'vyšlo ' + val('_wallet', 'credits'));

  /* ── 8. Jiné hry/klíče trigger nechá být ──────────────────────────── */
  reset('_wallet', '{"cosmetics": {"owned": ["a"]}, "credits": 10}');
  upd('_wallet', '{"cosmetics": {"owned": ["a","b","c"]}, "credits": 10}');
  ok(H.q(`select jsonb_array_length(data -> 'cosmetics' -> 'owned') from public.saves where game='_wallet'`) === '3',
    'kosmetika se needituje (jen kredity a XP)');

  /* ── 9. Idempotence ───────────────────────────────────────────────── */
  let znovu = true;
  try { H.file(SQL_FILE); } catch (e) { znovu = false; }
  ok(znovu, 'soubor jde spustit dvakrát po sobě (idempotentní)');
  reset('_wallet', '{"credits": 100}');
  upd('_wallet', '{"credits": 100000}');
  ok(val('_wallet', 'credits') === '600', 'po druhém spuštění strop pořád drží');
} finally {
  H.stop();
}

console.log(`\n  Bezpečnostní trigger: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
