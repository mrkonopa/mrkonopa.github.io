-- ════════════════════════════════════════════════════════════════
-- RPG Matematika — databáze pro cloudové ukládání postav (FÁZE 1)
-- Spusť jednou v Supabase: Dashboard → SQL Editor → New query → Run
-- ════════════════════════════════════════════════════════════════

-- Tabulka uložených postav: jeden řádek na (žák, hra).
create table if not exists public.saves (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  game       text        not null,                    -- 'RPG_MAT_6' … 'RPG_MAT_9'
  data       jsonb       not null default '{}'::jsonb, -- celý stav postavy
  name       text        default '',                  -- jméno postavy (pro přehled)
  email      text        default '',                  -- školní e-mail žáka
  full_name  text        default '',                  -- jméno z Google účtu
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);

-- Zapni Row Level Security — bez politik nikdo nic nevidí.
alter table public.saves enable row level security;

-- Žák smí číst, vkládat i měnit POUZE své vlastní postavy.
drop policy if exists "saves_select_own" on public.saves;
create policy "saves_select_own" on public.saves
  for select using (auth.uid() = user_id);

drop policy if exists "saves_insert_own" on public.saves;
create policy "saves_insert_own" on public.saves
  for insert with check (auth.uid() = user_id);

drop policy if exists "saves_update_own" on public.saves;
create policy "saves_update_own" on public.saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- (FÁZE 2 — učitelský přehled celé třídy — doplníme později:
--  role 'teacher' v tabulce profiles + politika pro čtení všech řádků.)
