-- ════════════════════════════════════════════════════════════════════
--  RPG Matematika — FÁZE 11: VĚŽ LEGEND (pilot 9. ročník)
--  ────────────────────────────────────────────────────────────────────
--  Soutěžní výstup věží: žák počítá těžší a těžší příklady, kam došel,
--  tam se umístil v žebříčku. Na konci roku se top 10 zapíše natrvalo
--  do SÍNĚ SLÁVY.
--
--  Vstup jen pro žáky AKTUÁLNÍHO ročníku hry: ročník se POČÍTÁ z
--  cohort_start_year třídy (Fáze 5) — žák musí být členem třídy, jejíž
--  kohorta právě odpovídá ročníku hry (RPG_MAT_9 → 9. třída).
--
--  Model: žádný přímý přístup k tabulkám, vše přes SECURITY DEFINER RPC
--  (vzor Fáze 7+9). Spustit po fázích 1–5.
-- ════════════════════════════════════════════════════════════════════

-- ── 1) Tabulky ───────────────────────────────────────────────────────
create table if not exists public.tower_runs (
  user_id      uuid not null references auth.users (id) on delete cascade,
  game         text not null,            -- 'RPG_MAT_9'
  season       text not null,            -- '2025/26' (školní rok)
  best_floor   int  not null default 0,  -- nejvyšší dosažené patro
  runs         int  not null default 0,  -- počet pokusů (jen statistika)
  updated_at   timestamptz not null default now(),
  primary key (user_id, game, season)
);

create table if not exists public.tower_hall (
  game         text not null,
  season       text not null,
  rank         int  not null,            -- 1..10
  display_name text not null,
  best_floor   int  not null,
  user_id      uuid,                     -- bez FK: záznam přežije smazání účtu
  created_at   timestamptz not null default now(),
  primary key (game, season, rank)
);

alter table public.tower_runs enable row level security;
alter table public.tower_hall enable row level security;
-- žádné RLS politiky = přímý přístup zamčený; vše jde přes RPC níže

-- ── 2) Pomocníci (interní) ───────────────────────────────────────────
-- aktuální školní rok: září–prosinec = letošní rok, leden–srpen = loňský
create or replace function public._school_year_start()
returns int language sql stable as $$
  select case when extract(month from now()) >= 9
              then extract(year from now())::int
              else extract(year from now())::int - 1 end;
$$;

-- '2025/26' z roku 2025
create or replace function public._season_label()
returns text language sql stable as $$
  select _school_year_start()::text || '/' ||
         lpad(((_school_year_start() + 1) % 100)::text, 2, '0');
$$;

-- aktuální ročník(y) žáka podle tříd s vyplněnou kohortou
-- (může být ve více třídách → bereme všechny ročníky, eligibility = některý sedí)
create or replace function public._grades_of(p_uid uuid)
returns table (grade int)
language sql stable security definer set search_path = public as $$
  select distinct 6 + (_school_year_start() - c.cohort_start_year) as grade
  from public.class_members cm
  join public.classes c on c.id = cm.class_id
  where cm.user_id = p_uid
    and c.cohort_start_year is not null;
$$;

-- ── 3) Vstupní kontrola ──────────────────────────────────────────────
-- smí přihlášený do věže dané hry? ('RPG_MAT_9' → potřebuje ročník 9)
create or replace function public.tower_eligible(p_game text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public._grades_of(auth.uid()) g
    where g.grade = nullif(right(p_game, 1), '')::int
  );
$$;

-- ── 4) Zápis výsledku ────────────────────────────────────────────────
-- uloží pokus; počítá jen zlepšení best_floor; eligibility hlídá SERVER
create or replace function public.tower_submit(p_game text, p_floor int)
returns int  -- vrací aktuální best_floor sezóny
language plpgsql security definer set search_path = public as $$
declare v_best int;
begin
  if auth.uid() is null then raise exception 'not logged in'; end if;
  if not tower_eligible(p_game) then raise exception 'wrong grade'; end if;
  if p_floor is null or p_floor < 0 or p_floor > 500 then
    raise exception 'invalid floor';
  end if;

  insert into public.tower_runs (user_id, game, season, best_floor, runs, updated_at)
  values (auth.uid(), p_game, _season_label(), p_floor, 1, now())
  on conflict (user_id, game, season) do update
    set best_floor = greatest(tower_runs.best_floor, excluded.best_floor),
        runs       = tower_runs.runs + 1,
        updated_at = now()
  returning best_floor into v_best;
  return v_best;
end $$;

-- ── 5) Žebříček aktuální sezóny ──────────────────────────────────────
-- celý ročník (všichni, kdo letos lezli) — jen jméno postavy + patro
create or replace function public.tower_board(p_game text)
returns table (display_name text, best_floor int, is_me boolean)
language sql stable security definer set search_path = public as $$
  select
    coalesce(nullif(s.name, ''), nullif(s.full_name, ''), 'Hráč') as display_name,
    t.best_floor,
    (t.user_id = auth.uid()) as is_me
  from public.tower_runs t
  left join public.saves s on s.user_id = t.user_id and s.game = t.game
  where t.game = p_game
    and t.season = _season_label()
    and t.best_floor > 0
    and auth.uid() is not null
  order by t.best_floor desc, t.updated_at asc
  limit 30;
$$;

-- ── 6) Síň slávy (čtení) ─────────────────────────────────────────────
create or replace function public.tower_hall_of_fame(p_game text)
returns table (season text, rank int, display_name text, best_floor int)
language sql stable security definer set search_path = public as $$
  select season, rank, display_name, best_floor
  from public.tower_hall
  where game = p_game and auth.uid() is not null
  order by season desc, rank asc;
$$;

-- ── 7) Uzavření sezóny (učitel/superadmin) ───────────────────────────
-- zapíše top 10 aktuální sezóny natrvalo do síně slávy (idempotentní:
-- existující záznamy sezóny nejdřív smaže a zapíše znovu)
create or replace function public.tower_close_season(p_game text)
returns int  -- kolik jmen zapsáno
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if (select my_role()) not in ('teacher', 'superadmin') then
    raise exception 'forbidden';
  end if;
  delete from public.tower_hall
   where game = p_game and season = _season_label();
  insert into public.tower_hall (game, season, rank, display_name, best_floor, user_id)
  select p_game, _season_label(),
         row_number() over (order by t.best_floor desc, t.updated_at asc),
         coalesce(nullif(s.name, ''), nullif(s.full_name, ''), 'Hráč'),
         t.best_floor, t.user_id
  from public.tower_runs t
  left join public.saves s on s.user_id = t.user_id and s.game = t.game
  where t.game = p_game and t.season = _season_label() and t.best_floor > 0
  order by t.best_floor desc, t.updated_at asc
  limit 10;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- ── 8) Práva (vzor Fáze 9: anon nikam, interní pomocníci jen interně) ─
revoke execute on function public._school_year_start() from public, anon, authenticated;
revoke execute on function public._season_label()      from public, anon, authenticated;
revoke execute on function public._grades_of(uuid)     from public, anon, authenticated;

do $$
declare f text;
begin
  foreach f in array array[
    'public.tower_eligible(text)',
    'public.tower_submit(text,int)',
    'public.tower_board(text)',
    'public.tower_hall_of_fame(text)',
    'public.tower_close_season(text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon;', f);
    execute format('grant  execute on function %s to authenticated;',  f);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
--  Hotovo. Žák s přiřazenou třídou (s kohortou odpovídající ročníku hry)
--  může lézt; učitel na konci roku spustí tower_close_season('RPG_MAT_9')
--  (tlačítko v konzoli) a top 10 se zapíše do síně slávy natrvalo.
-- ════════════════════════════════════════════════════════════════════
