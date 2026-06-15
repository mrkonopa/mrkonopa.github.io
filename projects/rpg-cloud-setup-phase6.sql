-- ═══════════════════════════════════════════════════════════════
-- RPG Matematika — Fáze 6: Vysvětlení postupu (Snorkl styl)
-- Pilot: jen 9. ročník (RPG_MAT_9)
-- Spustit po fázi 3 (nutné: tabulka class_members existuje)
-- ═══════════════════════════════════════════════════════════════

create table if not exists explanations (
  id          bigserial primary key,
  user_id     uuid references auth.users not null,
  display_name text,               -- jméno z Google profilu
  game        text not null,       -- 'RPG_MAT_9'
  mid         text not null,       -- '1-1', '3-2' atd.
  task_idx    int,                 -- index úkolu v misi
  task_text   text,                -- znění otázky (max 500 zn.)
  answer      text,                -- správná odpověď
  explanation text not null,       -- co žák napsal (max 1000 zn.)
  created_at  timestamptz default now()
);

-- indexy pro rychlé filtrování
create index if not exists explanations_user_game on explanations(user_id, game);
create index if not exists explanations_game_mid  on explanations(game, mid);
create index if not exists explanations_created   on explanations(created_at desc);

-- RLS
alter table explanations enable row level security;

-- žák může vkládat vlastní záznamy
drop policy if exists "expl_insert_own" on explanations;
create policy "expl_insert_own" on explanations
  for insert with check (auth.uid() = user_id);

-- žák může číst vlastní záznamy
drop policy if exists "expl_read_own" on explanations;
create policy "expl_read_own" on explanations
  for select using (auth.uid() = user_id);

-- učitel/superadmin čte vše (my_role() je SECURITY DEFINER z fáze 2)
drop policy if exists "expl_read_staff" on explanations;
create policy "expl_read_staff" on explanations
  for select using (
    (select my_role()) in ('teacher', 'superadmin')
  );

-- učitel/superadmin může mazat záznamy
drop policy if exists "expl_delete_staff" on explanations;
create policy "expl_delete_staff" on explanations
  for delete using (
    (select my_role()) in ('teacher', 'superadmin')
  );
