-- ═══════════════════════════════════════════════════════════════════
-- RPG Matematika — Fáze 14: TÝMOVÝ REŽIM + RYCHLÁ ODVETA živého souboje
-- Spustit po Fázi 7 (živý souboj). Idempotentní.
--
-- Přidává:
--   • týmový režim (2 týmy: 0 = modří, 1 = červení) — hráči se při
--     připojení vyvažují do menšího týmu; battle_state vrací tým u hráče
--     i součty týmů,
--   • rychlou odvetu — reset STEJNÉ místnosti zpět do lobby s novou sadou
--     otázek a vynulovaným skóre (hráči zůstávají i s týmy → klienti, co
--     stále pollují, sami spadnou zpět do čekárny, není třeba nový kód).
--
-- Bezpečnost: stejný model jako Fáze 7 — RLS deny-all, vše přes SECURITY
-- DEFINER funkce, řízení jen host/staff (_battle_can_control).
-- ═══════════════════════════════════════════════════════════════════

-- ── Schéma ───────────────────────────────────────────────────────────
alter table battles        add column if not exists team_mode boolean not null default false;
alter table battle_players add column if not exists team smallint;   -- null = FFA, 0/1 = tým

-- ── Vytvoření místnosti s volbou týmového režimu ─────────────────────
--    (samostatná funkce, aby původní create_battle zůstal beze změny)
create or replace function public.create_battle_tm(
  p_game text, p_qcount int, p_host_name text, p_team_mode boolean)
returns battles language plpgsql security definer set search_path = public as $$
declare b battles;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into battles (code, host_id, host_name, game, q_count, q_seed, team_mode)
  values (_battle_gen_code(), auth.uid(), coalesce(nullif(p_host_name, ''), 'Host'),
          coalesce(nullif(p_game, ''), 'RPG_MAT_9'),
          greatest(3, least(40, coalesce(p_qcount, 10))),
          (floor(random() * 2000000000))::bigint,
          coalesce(p_team_mode, false))
  returning * into b;
  insert into battle_players (battle_id, user_id, display_name, team)
  values (b.id, auth.uid(), coalesce(nullif(p_host_name, ''), 'Host'),
          case when coalesce(p_team_mode, false) then 0 else null end);
  return b;
end; $$;

-- ── Připojení podle kódu (nahrazuje Fázi 7 — přidává vyvážení týmů) ───
create or replace function public.join_battle(p_code text, p_name text)
returns battles language plpgsql security definer set search_path = public as $$
declare b battles; t smallint; c0 int; c1 int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into b from battles
   where upper(code) = upper(trim(p_code)) and status <> 'finished'
   order by created_at desc limit 1;
  if b.id is null then raise exception 'battle not found'; end if;
  -- vyber tým: do menšího (remíza → modří)
  if b.team_mode then
    select count(*) filter (where team = 0), count(*) filter (where team = 1)
      into c0, c1 from battle_players where battle_id = b.id;
    t := case when coalesce(c1,0) < coalesce(c0,0) then 1 else 0 end;
  else
    t := null;
  end if;
  insert into battle_players (battle_id, user_id, display_name, team)
  values (b.id, auth.uid(), coalesce(nullif(p_name, ''), 'Hráč'), t)
  on conflict (battle_id, user_id)
    do update set display_name = excluded.display_name, last_seen = now();
  return b;
end; $$;

-- ── Snapshot stavu (nahrazuje Fázi 7 — přidává team + součty týmů) ────
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
       from (select user_id, display_name, score, correct_count, last_qi, last_seen, team
             from battle_players where battle_id = p_battle
             order by score desc, display_name) p), '[]'::json),
    'teams', case when b.team_mode then (
       select json_build_object(
         '0', coalesce(sum(score) filter (where team = 0), 0),
         '1', coalesce(sum(score) filter (where team = 1), 0))
       from battle_players where battle_id = p_battle) else null end,
    'me', auth.uid()
  );
end; $$;

-- ── Rychlá odveta: reset STEJNÉ místnosti do lobby (host/staff) ───────
create or replace function public.rematch_battle(p_battle uuid)
returns battles language plpgsql security definer set search_path = public as $$
declare b battles;
begin
  if not _battle_can_control(p_battle) then raise exception 'forbidden'; end if;
  update battles
     set status = 'lobby', q_index = -1, q_started_at = null,
         q_seed = (floor(random() * 2000000000))::bigint, updated_at = now()
   where id = p_battle returning * into b;
  -- vynuluj skóre, ponech hráče i jejich týmy
  update battle_players
     set score = 0, correct_count = 0, last_qi = -1, last_seen = now()
   where battle_id = p_battle;
  return b;
end; $$;

-- ── Práva (vzor Fáze 9: anon nikam) ─────────────────────────────────
revoke execute on function public.create_battle_tm(text, int, text, boolean) from public, anon;
revoke execute on function public.rematch_battle(uuid)                       from public, anon;
grant   execute on function public.create_battle_tm(text, int, text, boolean) to authenticated;
grant   execute on function public.rematch_battle(uuid)                       to authenticated;
-- join_battle/battle_state už mají grant z Fáze 7/9 (CREATE OR REPLACE práva zachová)

-- ═══════════════════════════════════════════════════════════════════
-- Hotovo. Klient: create_battle_tm při zapnutém týmovém režimu, jinak
-- původní create_battle. battle_state nově nese team + teams součty.
-- rematch_battle drží stejné battle_id → poll hráčů sám spadne do lobby.
-- ═══════════════════════════════════════════════════════════════════
