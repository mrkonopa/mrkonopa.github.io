-- ════════════════════════════════════════════════════════════════
-- RPG Matematika — FÁZE 2: učitelská konzole (role + přístupová práva)
-- Spusť v Supabase: SQL Editor → New query → Run
-- (Spouštět AŽ PO rpg-cloud-setup.sql z Fáze 1.)
-- ════════════════════════════════════════════════════════════════

-- ── 1) Tabulka rolí (allowlist podle e-mailu) ───────────────────────────────
-- Učitele přidáváš e-mailem JEŠTĚ než se poprvé přihlásí (nemají zatím user_id).
create table if not exists public.roles (
  email      text        primary key,          -- školní e-mail (@husovaliberec.cz)
  role       text        not null check (role in ('teacher','superadmin')),
  added_by   text        default '',            -- kdo roli přidal
  created_at timestamptz not null default now()
);

-- ⚠️ DOPLŇ SVŮJ ŠKOLNÍ E-MAIL (ten, kterým se přihlašuješ přes Google):
insert into public.roles (email, role, added_by)
values ('vojtech.konopa@husovaliberec.cz', 'superadmin', 'seed')
on conflict (email) do update set role = 'superadmin';

-- ── 2) Pomocná funkce: moje role (SECURITY DEFINER obchází RLS → bez rekurze) ─
create or replace function public.my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  -- NIKDY nevracej NULL. Kdo není v allowlistu, je 'student' — stejně jako
  -- to má klient (fetchRole: data ? data.role : 'student').
  -- POZOR, tohle je bezpečnostně nosné: strážní podmínky mají tvar
  --   if (select my_role()) not in ('teacher','superadmin') then raise …
  -- a `NULL not in (…)` je v SQL NULL (ne TRUE), takže při NULL by se
  -- `if` NEsplnilo a brána by se tiše otevřela každému přihlášenému.
  select coalesce(
    (select role from public.roles
      where lower(email) = lower(auth.jwt() ->> 'email')
      limit 1),
    'student');
$$;

-- ── 3) RLS na tabulce roles ─────────────────────────────────────────────────
alter table public.roles enable row level security;

-- Každý vidí svou roli; superadmin vidí všechny.
drop policy if exists "roles_select" on public.roles;
create policy "roles_select" on public.roles
  for select using (
    lower(email) = lower(auth.jwt() ->> 'email')
    or public.my_role() = 'superadmin'
  );

-- Měnit role smí jen superadmin.
drop policy if exists "roles_insert_admin" on public.roles;
create policy "roles_insert_admin" on public.roles
  for insert with check (public.my_role() = 'superadmin');

drop policy if exists "roles_update_admin" on public.roles;
create policy "roles_update_admin" on public.roles
  for update using (public.my_role() = 'superadmin') with check (public.my_role() = 'superadmin');

drop policy if exists "roles_delete_admin" on public.roles;
create policy "roles_delete_admin" on public.roles
  for delete using (public.my_role() = 'superadmin');

-- ── 4) Rozšíření RLS na tabulce saves ───────────────────────────────────────
-- Učitel i superadmin vidí VŠECHNY postavy (vedle vlastní politiky z Fáze 1).
drop policy if exists "saves_select_staff" on public.saves;
create policy "saves_select_staff" on public.saves
  for select using (public.my_role() in ('teacher','superadmin'));

-- Superadmin smí upravit libovolnou postavu (odměny, posun levelu, oprava).
drop policy if exists "saves_update_admin" on public.saves;
create policy "saves_update_admin" on public.saves
  for update using (public.my_role() = 'superadmin') with check (public.my_role() = 'superadmin');

-- Superadmin smí smazat libovolnou postavu.
drop policy if exists "saves_delete_admin" on public.saves;
create policy "saves_delete_admin" on public.saves
  for delete using (public.my_role() = 'superadmin');

-- Pozn.: učitel (role 'teacher') má jen čtení cizích postav; mazat/měnit
-- smí pouze superadmin. (Když budeš chtít dát učitelům i editaci, přidáš
-- 'teacher' do using/with check výše.)

-- ── 5) Bezpečnost: zablokuj přímé volání my_role() přes REST API ────────────
-- Funkce je potřeba jen pro RLS politiky, ne přes /rest/v1/rpc/my_role.
-- (Řeší Supabase security lint: anon/authenticated_security_definer_function_executable)
revoke execute on function public.my_role() from anon;
-- POZOR: `authenticated` právo volat my_role() MÍT MUSÍ. Volá ji RLS
-- politika saves_select_staff a PostgreSQL vyhodnocuje všechny permisivní
-- politiky (OR), takže i žák čtoucí vlastní řádek ji spustí. Bez práva to
-- skončí „permission denied for function my_role" a žákovi se nenačte
-- postup z cloudu. SECURITY DEFINER mění kontext běhu, ne právo zavolat.
grant execute on function public.my_role() to authenticated;
