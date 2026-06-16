-- Phase 6b: errsSnap → snap_events tabulka
-- Spustit po fázi 6 (explanations). Nezáleží na pořadí vůči fázi 7.

create table if not exists snap_events (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  game         text        not null,
  snapped_at   date        not null,
  errs         jsonb       not null default '{}',
  created_at   timestamptz default now(),
  unique (user_id, game, snapped_at)
);

alter table snap_events enable row level security;

-- žák: vkládá jen své vlastní řádky
drop policy if exists "snap_insert_own" on snap_events;
create policy "snap_insert_own" on snap_events for insert to authenticated
  with check (auth.uid() = user_id);

-- žák: čte jen své vlastní (pro ladění, nepovinné)
drop policy if exists "snap_select_own" on snap_events;
create policy "snap_select_own" on snap_events for select to authenticated
  using (auth.uid() = user_id);

-- učitel/superadmin: čte vše
drop policy if exists "snap_select_staff" on snap_events;
create policy "snap_select_staff" on snap_events for select to authenticated
  using (my_role() in ('teacher', 'superadmin'));

-- superadmin: může smazat záznamy (pro úklid)
drop policy if exists "snap_delete_admin" on snap_events;
create policy "snap_delete_admin" on snap_events for delete to authenticated
  using (my_role() = 'superadmin');

-- index pro rychlé dotazy konzole (game + čas)
create index if not exists snap_events_game_idx on snap_events (game, snapped_at);
create index if not exists snap_events_user_idx on snap_events (user_id, game);
