-- ════════════════════════════════════════════════════════════════
-- RPG Matematika — FÁZE 3: třídy + poznámky k žákům
-- Spusť v Supabase: SQL Editor → New query → Run
-- (Spouštět AŽ PO rpg-cloud-setup.sql a rpg-cloud-setup-phase2.sql.)
--
-- Co přidává:
--   • třídy (classes) — reálné školní třídy, klidně napříč ročníky
--   • členství (class_members) — učitel ručně přiřazuje žáky
--   • poznámky (notes) — vzkaz/pochvala k žákovi; vidí ji i sám žák
-- ════════════════════════════════════════════════════════════════

-- ── 1) Třídy ────────────────────────────────────────────────────────────────
create table if not exists public.classes (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,                 -- např. „9.A", „7.B – matematika"
  created_by text        default '',               -- e-mail učitele, který třídu založil
  created_at timestamptz not null default now()
);

-- ── 2) Členství ve třídě (učitel přiřazuje ručně) ───────────────────────────
create table if not exists public.class_members (
  class_id uuid        not null references public.classes(id) on delete cascade,
  user_id  uuid        not null references auth.users(id)     on delete cascade,
  added_by text        default '',
  added_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index if not exists class_members_user_idx on public.class_members(user_id);

-- ── 3) Poznámky k žákovi (vidí učitel i samotný žák) ────────────────────────
create table if not exists public.notes (
  id           uuid        primary key default gen_random_uuid(),
  student_id   uuid        not null references auth.users(id) on delete cascade, -- koho se týká
  author_email text        default '',             -- kdo poznámku napsal
  author_name  text        default '',
  body         text        not null,
  created_at   timestamptz not null default now()
);
create index if not exists notes_student_idx on public.notes(student_id, created_at desc);

-- ── 4) RLS: classes ─────────────────────────────────────────────────────────
alter table public.classes enable row level security;

-- Číst třídy smí celý učitelský sbor.
drop policy if exists "classes_select_staff" on public.classes;
create policy "classes_select_staff" on public.classes
  for select using (public.my_role() in ('teacher','superadmin'));

-- Zakládat / upravovat / mazat třídy smí učitel i superadmin.
drop policy if exists "classes_insert_staff" on public.classes;
create policy "classes_insert_staff" on public.classes
  for insert with check (public.my_role() in ('teacher','superadmin'));

drop policy if exists "classes_update_staff" on public.classes;
create policy "classes_update_staff" on public.classes
  for update using (public.my_role() in ('teacher','superadmin'))
            with check (public.my_role() in ('teacher','superadmin'));

drop policy if exists "classes_delete_staff" on public.classes;
create policy "classes_delete_staff" on public.classes
  for delete using (public.my_role() in ('teacher','superadmin'));

-- ── 5) RLS: class_members ───────────────────────────────────────────────────
alter table public.class_members enable row level security;

-- Sbor vidí všechna členství; žák vidí svoje (kdyby se chtělo zobrazit ve hře).
drop policy if exists "members_select" on public.class_members;
create policy "members_select" on public.class_members
  for select using (
    public.my_role() in ('teacher','superadmin') or auth.uid() = user_id
  );

-- Přiřazovat a odebírat žáky smí sbor.
drop policy if exists "members_insert_staff" on public.class_members;
create policy "members_insert_staff" on public.class_members
  for insert with check (public.my_role() in ('teacher','superadmin'));

drop policy if exists "members_delete_staff" on public.class_members;
create policy "members_delete_staff" on public.class_members
  for delete using (public.my_role() in ('teacher','superadmin'));

-- ── 6) RLS: notes ───────────────────────────────────────────────────────────
alter table public.notes enable row level security;

-- Poznámku vidí celý sbor i sám žák, kterého se týká.
drop policy if exists "notes_select" on public.notes;
create policy "notes_select" on public.notes
  for select using (
    public.my_role() in ('teacher','superadmin') or auth.uid() = student_id
  );

-- Psát poznámky smí sbor (autorem je přihlášený učitel).
drop policy if exists "notes_insert_staff" on public.notes;
create policy "notes_insert_staff" on public.notes
  for insert with check (public.my_role() in ('teacher','superadmin'));

-- Smazat smí autor poznámky nebo superadmin.
drop policy if exists "notes_delete" on public.notes;
create policy "notes_delete" on public.notes
  for delete using (
    public.my_role() = 'superadmin'
    or lower(author_email) = lower(auth.jwt() ->> 'email')
  );

-- Hotovo. Tabulky classes / class_members / notes jsou živé a chráněné RLS.
