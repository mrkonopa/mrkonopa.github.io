-- ═══════════════════════════════════════════════════════════════════
-- RPG Matematika — Fáze 7: ŽIVÝ SOUBOJ (Kahoot-style, pilot 9. ročník)
-- Spustit po fázi 2 (nutné: funkce my_role()).
--
-- Model:
--   • Hostit může KDOKOLI (žák i učitel) — vytvoří místnost, dostane KÓD,
--     pozve spolužáky kódem nebo e-mailem.
--   • UČITEL má „god mode": vidí VŠECHNY běžící souboje a může kterýkoli
--     pauznout / spustit / zastavit / ukončit (list_active_battles +
--     _battle_can_control vrací true pro teacher/superadmin).
--
-- Bezpečnost: na tabulkách je RLS BEZ permisivních politik → přímý
-- přístup je zakázán. VŠECHNO jde přes SECURITY DEFINER funkce, které
-- si autorizaci hlídají samy (kdo smí řídit, kdo smí číst). Otázky se
-- negenerují tady — klient je deterministicky vyrobí z q_seed
-- (projects/rpg-battle-9.js), takže všichni hráči dostanou stejnou sadu.
-- ═══════════════════════════════════════════════════════════════════

-- ── Tabulky ──────────────────────────────────────────────────────────
create table if not exists battles (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  host_id       uuid references auth.users not null,
  host_name     text,
  game          text not null default 'RPG_MAT_9',
  status        text not null default 'lobby',   -- lobby|active|paused|finished
  q_index       int  not null default -1,        -- -1 = ještě nezačalo
  q_count       int  not null default 10,
  q_seed        bigint not null,                 -- klient z něj vyrobí otázky
  q_started_at  timestamptz,
  controlled_by uuid,                            -- učitel, co převzal řízení
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists battle_players (
  id            uuid primary key default gen_random_uuid(),
  battle_id     uuid references battles on delete cascade not null,
  user_id       uuid references auth.users not null,
  display_name  text,
  score         int  not null default 0,
  correct_count int  not null default 0,
  last_qi       int  not null default -1,        -- poslední zodpovězená otázka
  joined_at     timestamptz default now(),
  last_seen     timestamptz default now(),
  unique (battle_id, user_id)
);

create table if not exists battle_invites (
  id         bigserial primary key,
  battle_id  uuid references battles on delete cascade not null,
  email      text not null,
  created_at timestamptz default now(),
  unique (battle_id, email)
);

create index if not exists battles_code   on battles(code);
create index if not exists battles_status on battles(status);
create index if not exists bplayers_battle on battle_players(battle_id);
create index if not exists binvites_email  on battle_invites(lower(email));

-- ── RLS: deny-all (žádné permisivní politiky) ────────────────────────
alter table battles        enable row level security;
alter table battle_players enable row level security;
alter table battle_invites enable row level security;
-- (úmyslně bez CREATE POLICY → přímý SELECT/INSERT/UPDATE/DELETE je zakázán;
--  veškerý přístup teče přes SECURITY DEFINER funkce níže)

-- ── Generátor join-kódu (bez matoucích znaků 0/O/1/I) ────────────────
create or replace function public._battle_gen_code()
returns text language plpgsql security definer set search_path = public as $$
declare chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := '';
    for i in 1..4 loop
      c := c || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from battles where code = c and status <> 'finished');
  end loop;
  return c;
end; $$;

-- ── Autorizační helper: smí caller řídit tuto bitvu? (host nebo staff) ─
create or replace function public._battle_can_control(p_battle uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from battles where id = p_battle and host_id = auth.uid())
      or (select my_role()) in ('teacher', 'superadmin');
$$;

-- ── Vytvoření místnosti (host = libovolný přihlášený) ────────────────
create or replace function public.create_battle(p_game text, p_qcount int, p_host_name text)
returns battles language plpgsql security definer set search_path = public as $$
declare b battles;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into battles (code, host_id, host_name, game, q_count, q_seed)
  values (_battle_gen_code(), auth.uid(), coalesce(nullif(p_host_name, ''), 'Host'),
          coalesce(nullif(p_game, ''), 'RPG_MAT_9'),
          greatest(3, least(40, coalesce(p_qcount, 10))),
          (floor(random() * 2000000000))::bigint)
  returning * into b;
  insert into battle_players (battle_id, user_id, display_name)
  values (b.id, auth.uid(), coalesce(nullif(p_host_name, ''), 'Host'));
  return b;
end; $$;

-- ── Připojení podle kódu ─────────────────────────────────────────────
create or replace function public.join_battle(p_code text, p_name text)
returns battles language plpgsql security definer set search_path = public as $$
declare b battles;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into b from battles
   where upper(code) = upper(trim(p_code)) and status <> 'finished'
   order by created_at desc limit 1;
  if b.id is null then raise exception 'battle not found'; end if;
  insert into battle_players (battle_id, user_id, display_name)
  values (b.id, auth.uid(), coalesce(nullif(p_name, ''), 'Hráč'))
  on conflict (battle_id, user_id)
    do update set display_name = excluded.display_name, last_seen = now();
  return b;
end; $$;

-- ── Posun na další otázku (host/staff) ───────────────────────────────
create or replace function public.advance_battle(p_battle uuid, p_qi int)
returns battles language plpgsql security definer set search_path = public as $$
declare b battles;
begin
  if not _battle_can_control(p_battle) then raise exception 'forbidden'; end if;
  update battles
     set q_index = p_qi, q_started_at = now(), updated_at = now(),
         status  = case when p_qi >= q_count then 'finished' else 'active' end
   where id = p_battle returning * into b;
  return b;
end; $$;

-- ── Změna stavu (lobby/active/paused/finished) — host/staff ──────────
create or replace function public.set_battle_status(p_battle uuid, p_status text)
returns battles language plpgsql security definer set search_path = public as $$
declare b battles;
begin
  if not _battle_can_control(p_battle) then raise exception 'forbidden'; end if;
  if p_status not in ('lobby', 'active', 'paused', 'finished') then
    raise exception 'bad status'; end if;
  update battles
     set status = p_status, updated_at = now(),
         controlled_by = case
           when (select my_role()) in ('teacher', 'superadmin') and host_id <> auth.uid()
           then auth.uid() else controlled_by end
   where id = p_battle returning * into b;
  return b;
end; $$;

-- ── Odeslání odpovědi (jen na aktuální otázku, bez dvojího skórování) ─
create or replace function public.submit_battle_answer(
  p_battle uuid, p_qi int, p_correct boolean, p_points int)
returns void language plpgsql security definer set search_path = public as $$
declare b battles; pts int;
begin
  select * into b from battles where id = p_battle;
  if b.id is null then return; end if;
  if b.status <> 'active' or b.q_index <> p_qi then return; end if;   -- jen živá otázka
  pts := greatest(0, least(1500, coalesce(p_points, 0)));             -- strop proti podvodu
  update battle_players
     set score         = score + case when p_correct then pts else 0 end,
         correct_count = correct_count + case when p_correct then 1 else 0 end,
         last_qi       = p_qi,
         last_seen     = now()
   where battle_id = p_battle and user_id = auth.uid() and last_qi < p_qi;
end; $$;

-- ── Snapshot stavu pro polling (člen/host/staff) ─────────────────────
create or replace function public.battle_state(p_battle uuid)
returns json language plpgsql security definer set search_path = public as $$
declare b battles; allowed boolean;
begin
  select * into b from battles where id = p_battle;
  if b.id is null then return null; end if;
  allowed := b.host_id = auth.uid()
          or (select my_role()) in ('teacher', 'superadmin')
          or exists (select 1 from battle_players where battle_id = p_battle and user_id = auth.uid());
  if not allowed then raise exception 'forbidden'; end if;
  update battle_players set last_seen = now()
   where battle_id = p_battle and user_id = auth.uid();
  return json_build_object(
    'battle',  row_to_json(b),
    'players', coalesce((
       select json_agg(row_to_json(p))
       from (select user_id, display_name, score, correct_count, last_qi, last_seen
             from battle_players where battle_id = p_battle
             order by score desc, display_name) p), '[]'::json),
    'me', auth.uid()
  );
end; $$;

-- ── Učitelský přehled: všechny neukončené bitvy + počty hráčů ────────
create or replace function public.list_active_battles()
returns table (id uuid, code text, host_name text, game text, status text,
               q_index int, q_count int, players int, updated_at timestamptz)
language sql security definer set search_path = public stable as $$
  select b.id, b.code, b.host_name, b.game, b.status, b.q_index, b.q_count,
         (select count(*)::int from battle_players p where p.battle_id = b.id),
         b.updated_at
  from battles b
  where (select my_role()) in ('teacher', 'superadmin')
    and b.status <> 'finished'
  order by b.updated_at desc;
$$;

-- ── Pozvánka e-mailem (host/staff) ───────────────────────────────────
create or replace function public.invite_battle_email(p_battle uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not _battle_can_control(p_battle) then raise exception 'forbidden'; end if;
  insert into battle_invites (battle_id, email) values (p_battle, lower(trim(p_email)))
  on conflict (battle_id, email) do nothing;
end; $$;

-- ── Moje pozvánky (podle e-mailu přihlášeného) ───────────────────────
create or replace function public.my_battle_invites()
returns table (id uuid, code text, host_name text, game text, status text)
language sql security definer set search_path = public stable as $$
  select b.id, b.code, b.host_name, b.game, b.status
  from battles b join battle_invites i on i.battle_id = b.id
  where lower(i.email) = lower((select email from auth.users where id = auth.uid()))
    and b.status <> 'finished'
  order by b.created_at desc;
$$;

-- ── Úklid starých bitev (volitelné; klidně i přes pg_cron) ────────────
create or replace function public.cleanup_battles()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if (select my_role()) not in ('teacher', 'superadmin') then raise exception 'forbidden'; end if;
  with del as (delete from battles where created_at < now() - interval '12 hours' returning 1)
  select count(*) into n from del;
  return n;
end; $$;

-- ── Grants: jen přihlášení smí volat funkce (RLS uvnitř hlídá rozsah) ─
grant execute on function public.create_battle(text, int, text)        to authenticated;
grant execute on function public.join_battle(text, text)               to authenticated;
grant execute on function public.advance_battle(uuid, int)             to authenticated;
grant execute on function public.set_battle_status(uuid, text)         to authenticated;
grant execute on function public.submit_battle_answer(uuid, int, boolean, int) to authenticated;
grant execute on function public.battle_state(uuid)                    to authenticated;
grant execute on function public.list_active_battles()                 to authenticated;
grant execute on function public.invite_battle_email(uuid, text)       to authenticated;
grant execute on function public.my_battle_invites()                   to authenticated;
grant execute on function public.cleanup_battles()                     to authenticated;

-- ── Realtime (volitelné zrychlení; klient stejně i polluje) ──────────
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'battles') then
    alter publication supabase_realtime add table battles;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'battle_players') then
    alter publication supabase_realtime add table battle_players;
  end if;
exception when others then null;  -- když publikace neexistuje, nevadí (klient pollu je)
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- Hotovo. Klient (rpg-cloud.js) volá funkce přes RPC a pollu je
-- battle_state() každých ~1,2 s. Bez přihlášení/cloudu se živý souboj
-- prostě nenabídne (graceful). Otázky: projects/rpg-battle-9.js.
-- ═══════════════════════════════════════════════════════════════════
