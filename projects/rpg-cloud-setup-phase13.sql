-- ═══════════════════════════════════════════════════════════════════
-- RPG Matematika — Fáze 13: TRVALÁ HISTORIE ŽIVÝCH SOUBOJŮ
-- Spustit po fázi 7 (živý souboj) a fázi 2 (my_role).
--
-- Proč: `battle_players` se maže s místností (cleanup_battles po 12 h,
-- cascade). Učitel tak nevidí, kolik soubojů žák odehrál ani jeho
-- úspěšnost. Tato fáze přidává TRVALÝ záznam výsledku per žák/souboj,
-- který přežije úklid místností (bez FK na battles → cascade ho nesmaže).
--
-- Bezpečnost (vzor Fáze 7/9): RLS deny-all, vše přes SECURITY DEFINER.
-- Žák si výsledek NEHLÁSÍ čísly (spoof) — funkce si correct/score/rank
-- DOPOČÍTÁ sama z battle_players na serveru. Zápis je idempotentní
-- (unique battle_id+user_id), takže opakované volání nepřičítá dvakrát.
-- ═══════════════════════════════════════════════════════════════════

-- ── Tabulka: jeden řádek = výsledek jednoho žáka v jednom souboji ────
create table if not exists battle_results (
  battle_id   uuid not null,                 -- bez FK → přežije cleanup battles
  user_id     uuid references auth.users not null,
  game        text not null default 'RPG_MAT_9',
  correct     int  not null default 0,
  wrong       int  not null default 0,       -- q_count - correct (timeout = chyba)
  score       int  not null default 0,
  rank        int  not null default 1,        -- 1 = vítěz
  total       int  not null default 1,        -- počet hráčů v souboji
  finished_at timestamptz default now(),
  primary key (battle_id, user_id)
);

create index if not exists bresults_user on battle_results(user_id);
create index if not exists bresults_game on battle_results(game);

alter table battle_results enable row level security;
-- (úmyslně bez permisivních politik → vše přes funkce níže)

-- ── Zápis vlastního výsledku (volá ho hráč na výsledkové obrazovce) ──
--    Server si correct/wrong/score/rank/total dopočítá z battle_players,
--    takže žák nemůže čísla podvrhnout. Idempotentní přes ON CONFLICT.
create or replace function public.record_battle_result(p_battle uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  b battles;
  me_score int; me_correct int; me_qcount int;
  me_rank int; me_total int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into b from battles where id = p_battle;
  if b.id is null then return; end if;                 -- místnost už uklizená
  -- musím být účastník
  select score, correct_count into me_score, me_correct
    from battle_players where battle_id = p_battle and user_id = auth.uid();
  if me_score is null then return; end if;             -- nebyl jsem hráč
  me_qcount := greatest(b.q_count, me_correct);        -- pojistka
  select count(*)::int into me_total
    from battle_players where battle_id = p_battle;
  select 1 + count(*)::int into me_rank
    from battle_players
   where battle_id = p_battle and score > me_score;
  insert into battle_results (battle_id, user_id, game, correct, wrong, score, rank, total)
  values (p_battle, auth.uid(), b.game, me_correct,
          greatest(0, me_qcount - me_correct), me_score, me_rank, me_total)
  on conflict (battle_id, user_id) do nothing;          -- ať se nepřičítá dvakrát
end; $$;

-- ── Učitelský přehled: agregace per žák (volitelně 1 ročník) ─────────
--    Vrací jen user_id + souhrnné metriky (žádné e-maily / per-otázku).
create or replace function public.battle_stats_all(p_game text default null)
returns table (user_id uuid, played int, correct int, wrong int,
               wins int, score int, avg_rank numeric)
language sql security definer set search_path = public stable as $$
  select r.user_id,
         count(*)::int                              as played,
         coalesce(sum(r.correct), 0)::int           as correct,
         coalesce(sum(r.wrong), 0)::int             as wrong,
         count(*) filter (where r.rank = 1)::int    as wins,
         coalesce(sum(r.score), 0)::int             as score,
         round(avg(r.rank), 1)                      as avg_rank
  from battle_results r
  where (select my_role()) in ('teacher', 'superadmin')
    and (p_game is null or r.game = p_game)
  group by r.user_id;
$$;

-- ── Můj vlastní souhrn (žák si smí přečíst jen svoje) ────────────────
create or replace function public.battle_stats_me(p_game text default null)
returns table (played int, correct int, wrong int, wins int,
               score int, avg_rank numeric)
language sql security definer set search_path = public stable as $$
  select count(*)::int,
         coalesce(sum(correct), 0)::int,
         coalesce(sum(wrong), 0)::int,
         count(*) filter (where rank = 1)::int,
         coalesce(sum(score), 0)::int,
         round(avg(rank), 1)
  from battle_results
  where user_id = auth.uid()
    and (p_game is null or game = p_game);
$$;

-- ── Práva (vzor Fáze 9: anon nikam) ─────────────────────────────────
revoke execute on function public.record_battle_result(uuid) from public, anon;
revoke execute on function public.battle_stats_all(text)     from public, anon;
revoke execute on function public.battle_stats_me(text)      from public, anon;
grant   execute on function public.record_battle_result(uuid) to authenticated;
grant   execute on function public.battle_stats_all(text)     to authenticated;
grant   execute on function public.battle_stats_me(text)      to authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- Hotovo. Klient (rpg-battle-ui.js) volá record_battle_result() na konci
-- souboje; učitelská konzole čte battle_stats_all() v záložce SOUBOJE.
-- Bez přihlášení/cloudu se nic neděje (graceful).
-- ═══════════════════════════════════════════════════════════════════
