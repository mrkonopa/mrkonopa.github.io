-- ════════════════════════════════════════════════════════════════════
--  RPG Matematika — FÁZE 20: ÚKOLY S TERMÍNEM
--  ────────────────────────────────────────────────────────────────────
--  Učitel zadá třídě „procvič misi X do pátku". Žák to uvidí ve hře
--  (plovoucí widget), konzole sleduje, kdo misi zvládl (mastery).
--
--  Model: žádný přímý přístup k tabulce, vše přes SECURITY DEFINER RPC
--  (vzor Fáze 11). Cíl úkolu = třída (class_members). Spustit po fázi 3
--  (třídy) a fázi 11 (pomocník my_role, saves join).
-- ════════════════════════════════════════════════════════════════════

-- ── 1) Tabulka ───────────────────────────────────────────────────────
create table if not exists public.assignments (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes (id) on delete cascade,
  game        text not null,            -- 'RPG_MAT_9'
  mission_id  text not null,            -- '2-3'
  due_date    date,                     -- termín (může být null = bez termínu)
  created_by  text,                     -- e-mail učitele
  created_at  timestamptz not null default now()
);
create index if not exists assignments_class_idx on public.assignments (class_id);

alter table public.assignments enable row level security;
-- žádné RLS politiky = přímý přístup zamčený; vše jde přes RPC níže

-- ── 2) Vytvoření úkolu (učitel/superadmin) ───────────────────────────
create or replace function public.create_assignment(
  p_class_id uuid, p_game text, p_mission_id text, p_due_date date)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not logged in'; end if;
  if (select my_role()) not in ('teacher', 'superadmin') then
    raise exception 'forbidden';
  end if;
  if p_class_id is null or coalesce(p_game, '') = '' or coalesce(p_mission_id, '') = '' then
    raise exception 'invalid input';
  end if;
  insert into public.assignments (class_id, game, mission_id, due_date, created_by)
  values (p_class_id, p_game, p_mission_id, p_due_date,
          (select email from auth.users where id = auth.uid()))
  returning id into v_id;
  return v_id;
end $$;

-- ── 3) Seznam úkolů (učitel) — s názvem třídy ────────────────────────
create or replace function public.list_assignments()
returns table (id uuid, class_id uuid, class_name text, game text,
               mission_id text, due_date date, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, a.class_id, c.name, a.game, a.mission_id, a.due_date, a.created_at
  from public.assignments a
  join public.classes c on c.id = a.class_id
  where (select my_role()) in ('teacher', 'superadmin')
  order by a.due_date asc nulls last, a.created_at desc;
$$;

-- ── 4) Smazání úkolu (učitel) ────────────────────────────────────────
create or replace function public.delete_assignment(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select my_role()) not in ('teacher', 'superadmin') then
    raise exception 'forbidden';
  end if;
  delete from public.assignments where id = p_id;
end $$;

-- ── 5) Splnění úkolu (učitel) — kdo z třídy má misi zvládnutou ───────
-- „splněno" = mastery.mistrovství dané mise v save postavy žáka (Fáze 1).
create or replace function public.assignment_progress(p_id uuid)
returns table (display_name text, mastered boolean)
language sql stable security definer set search_path = public as $$
  select
    coalesce(nullif(s.name, ''), nullif(s.full_name, ''), 'Hráč') as display_name,
    coalesce((s.data -> 'mastery' -> a.mission_id ->> 'mastered')::boolean, false) as mastered
  from public.assignments a
  join public.class_members cm on cm.class_id = a.class_id
  left join public.saves s on s.user_id = cm.user_id and s.game = a.game
  where a.id = p_id
    and (select my_role()) in ('teacher', 'superadmin')
  order by mastered desc, display_name asc;
$$;

-- ── 6) Moje úkoly (žák) — úkoly tříd, kde je členem ──────────────────
create or replace function public.my_assignments()
returns table (id uuid, game text, mission_id text, due_date date, class_name text)
language sql stable security definer set search_path = public as $$
  select a.id, a.game, a.mission_id, a.due_date, c.name
  from public.assignments a
  join public.class_members cm on cm.class_id = a.class_id
  join public.classes c on c.id = a.class_id
  where cm.user_id = auth.uid()
    and auth.uid() is not null
  order by a.due_date asc nulls last;
$$;

-- ── 7) Práva (vzor Fáze 9/11: anon nikam) ────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'public.create_assignment(uuid,text,text,date)',
    'public.list_assignments()',
    'public.delete_assignment(uuid)',
    'public.assignment_progress(uuid)',
    'public.my_assignments()'
  ]
  loop
    execute format('revoke execute on function %s from public, anon;', f);
    execute format('grant  execute on function %s to authenticated;',  f);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
--  Hotovo. Učitel v konzoli (záložka ÚKOLY) zadá třídě misi + termín;
--  žák to uvidí ve hře (widget „📋 Úkoly od učitele") a může rovnou
--  procvičovat. Splnění = mistrovství mise (mastery).
-- ════════════════════════════════════════════════════════════════════
