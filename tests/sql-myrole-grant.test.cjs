/* ══════════════════════════════════════════════════════════════════════
   Reprodukce a oprava produkční chyby:

       ERROR 42501: permission denied for function my_role
       WITH pgrst_source AS (SELECT "public"."saves"."data" …)

   Co se dělo: tabulka `saves` má vedle žákovské politiky i učitelskou
   `saves_select_staff`, která volá public.my_role(). Fáze 2 i 23 ale
   funkci ODEBRALY roli `authenticated`.

   PostgreSQL vyhodnocuje VŠECHNY permisivní politiky pro daný příkaz a
   spojuje je přes OR. Žák čtoucí vlastní řádek proto spustí i učitelskou
   politiku → volání my_role() → permission denied. Že se to neprojevilo
   hned, je jen tím, že plánovač někdy stihne vyhodnotit levnější politiku
   dřív; spolehnout se na to nejde.

   Revoke z `anon` smysl dává (nepřihlášený nemá co volat), revoke
   z `authenticated` rozbíjí RLS. Funkce přitom nic citlivého nevrací —
   jen roli volajícího, odvozenou z jeho vlastního JWT.

   Test nejdřív chybu REPRODUKUJE, pak dokazuje, že ji oprava zavírá.

   Spusť: node tests/sql-myrole-grant.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

// H.q vrací celý přepis včetně BEGIN/COMMIT a výstupu set_config —
// z transakce nás zajímá jen poslední datový řádek.
const hodnota = (sql) => {
  const radky = H.q(sql).split('\n').map(x => x.trim())
    .filter(x => x && x !== 'BEGIN' && x !== 'COMMIT' && x !== 'SET' && !x.includes('@'));
  return radky.length ? radky[radky.length - 1] : '';
};

const why = H.unavailable();
if (why) { console.log('\n  ⏭️  přeskočeno: ' + why + '\n'); process.exit(0); }

const OPRAVA = path.join(__dirname, '..', 'projects', 'rpg-cloud-setup-phase25.sql');

const STUB = `
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), '')) $$;
create role anon;
create role authenticated;
grant usage on schema public to anon, authenticated;

create table public.roles (email text primary key, role text not null);
create table public.saves (
  user_id uuid not null, game text not null, data jsonb not null default '{}'::jsonb,
  primary key (user_id, game));
grant select, insert, update, delete on public.saves to authenticated;

-- my_role() ve tvaru z fáze 23 (coalesce ⇒ nikdy NULL)
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.roles where email = lower(auth.jwt() ->> 'email') limit 1), 'student')
$$;

alter table public.saves enable row level security;
create policy "saves_own" on public.saves for select using (auth.uid() = user_id);
create policy "saves_select_staff" on public.saves
  for select using (public.my_role() in ('teacher','superadmin'));

insert into public.roles values ('ucitel@husovaliberec.cz','teacher');
insert into public.saves(user_id, game, data)
  values ('11111111-1111-1111-1111-111111111111','RPG_MAT_9','{"xp":100}'::jsonb);
`;

const JAKO_ZAK = `
  set local role authenticated;
  select set_config('test.uid','11111111-1111-1111-1111-111111111111',true),
         set_config('test.email','zak@husovaliberec.cz',true);
`;

console.log('\n── permission denied for function my_role ──\n');
H.start('pgtestmr');
try {
  H.exec(STUB);

  /* ── 1. STAV PŘED OPRAVOU: žák si nepřečte vlastní save ──────────── */
  H.exec('revoke execute on function public.my_role() from public, anon, authenticated;');
  const chyba = H.expectFail(`begin; ${JAKO_ZAK}
    select data from public.saves
      where user_id = '11111111-1111-1111-1111-111111111111' and game = 'RPG_MAT_9'; commit;`);
  ok(!!chyba && /permission denied for function my_role/i.test(chyba),
    'REPRODUKCE: žák nepřečte vlastní save (permission denied for function my_role)',
    chyba ? chyba.split('\n')[0].slice(0, 90) : 'chyba nenastala!');

  /* ── 2. OPRAVA ───────────────────────────────────────────────────── */
  H.file(OPRAVA);
  ok(H.q("select has_function_privilege('authenticated','public.my_role()','execute')") === 't',
    'authenticated smí volat my_role()');
  ok(H.q("select has_function_privilege('anon','public.my_role()','execute')") === 'f',
    'anon volat NESMÍ (nepřihlášený nemá co číst)');

  /* ── 3. ŽÁK SI PŘEČTE SVŮJ SAVE ──────────────────────────────────── */
  const zak = hodnota(`begin; ${JAKO_ZAK}
    select data ->> 'xp' from public.saves
      where user_id = '11111111-1111-1111-1111-111111111111' and game = 'RPG_MAT_9'; commit;`);
  ok(zak === '100', 'žák si přečte vlastní save', 'vrátilo: ' + zak);

  /* ── 4. SOUKROMÍ ZŮSTÁVÁ: cizí save žák nevidí ───────────────────── */
  H.exec(`insert into public.saves(user_id, game, data)
    values ('22222222-2222-2222-2222-222222222222','RPG_MAT_9','{"xp":999}'::jsonb);`);
  const cizi = hodnota(`begin; ${JAKO_ZAK}
    select count(*) from public.saves
      where user_id = '22222222-2222-2222-2222-222222222222'; commit;`);
  ok(cizi === '0', 'žák NEVIDÍ cizí save', 'vrátilo: ' + cizi);

  /* ── 5. UČITEL VIDÍ VŠECHNY ──────────────────────────────────────── */
  const ucitel = hodnota(`begin;
    set local role authenticated;
    select set_config('test.uid','33333333-3333-3333-3333-333333333333',true),
           set_config('test.email','ucitel@husovaliberec.cz',true);
    select count(*) from public.saves; commit;`);
  ok(ucitel === '2', 'učitel vidí všechny savy', 'vrátilo: ' + ucitel);

  /* ── 6. ZÁPIS ŽÁKA FUNGUJE ───────────────────────────────────────── */
  let zapis = true;
  try {
    H.q(`begin; ${JAKO_ZAK}
      update public.saves set data = '{"xp":150}'::jsonb
        where user_id = '11111111-1111-1111-1111-111111111111' and game = 'RPG_MAT_9'; commit;`);
  } catch (e) { zapis = false; }
  ok(zapis, 'žák si uloží postup');

  /* ── 7. IDEMPOTENCE ──────────────────────────────────────────────── */
  let znovu = true;
  try { H.file(OPRAVA); } catch (e) { znovu = false; }
  ok(znovu, 'opravu jde spustit opakovaně');
  ok(H.q("select has_function_privilege('authenticated','public.my_role()','execute')") === 't',
    'po druhém spuštění právo drží');
} finally {
  H.stop();
}

console.log(`\n  my_role grant: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
