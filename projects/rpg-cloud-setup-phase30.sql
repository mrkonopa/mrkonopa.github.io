-- ════════════════════════════════════════════════════════════════
-- RPG Matematika — FÁZE 30: odměny za živý souboj počítá server
-- Spusť v Supabase: SQL Editor → New query → Run.
-- (Spouštět AŽ PO phase13 a phase29. Idempotentní, kdykoli znovu.)
--
-- Dosud odměnu (XP, kredity, odznaky) vypočítala hra sama po zobrazení
-- výsledků (`onResult` v rpg-mat-N.html): z hubu nic, po zavření stránky
-- nic, tým se nepočítal a nic se nedalo omezit. Teď:
--
--   • výsledek hráče (battle_results) nese tým, jeho výsledek, počet
--     zodpovězených otázek a počet otázek souboje,
--   • odměnu počítá _battle_odmena() z pořadí a správných odpovědí, které
--     server zná z battle_players (klient nic nepodvrhne),
--   • claim_battle_rewards() ji vydá JEDNOU (claimed_at) a vrátí statistiky
--     pro odznaky; chybějící výsledek dopočítá z dohraného souboje, takže
--     odměnu dostane i ten, kdo stránku zavřel, nebo hrál z hubu,
--   • battle_profile() vrací souhrn pro profil (body → hodnost, výhry…).
--
-- Pravidla odměny (schválil Vojta 4. 11. 2026, hodnoty z dřívějška zůstávají):
--   XP     1. místo 80, 2. 50, 3. 30, ostatní 20, k tomu 3 za správnou (nejvýš +30)
--   kredity 25 / 15 / 10 / 5
--   tým    vítězný tým +30 XP a +10 kr každému, poražený (i remíza) +10 XP
--   proti farmení: odměna jen když hrají aspoň 2 hráči, souboj má aspoň 5
--     otázek a hráč zodpověděl aspoň polovinu; od 6. odměněného souboje
--     za den (Europe/Prague) se odměna půlí
--   server strop jednoho zápisu savu je +200 XP (rpg-cloud-setup-security.sql),
--   proto claim vydá najednou nejvýš 180 XP; zbytek přijde příště.
--   Do statistik a hodnosti se počítají jen souboje se ≥ 2 hráči, kde hráč
--   zodpověděl aspoň polovinu otázek (starší výsledky bez těchto údajů se
--   počítají, pokud hrálo víc hráčů).
-- Starší výsledky (před touto fází) se označí za vyzvednuté — odměnila je
-- hra přímo — a zpětně se nedopočítávají (souboje před 4. 11. 2026).
-- ════════════════════════════════════════════════════════════════

-- ── 1) sloupce výsledku ──────────────────────────────────────────
alter table public.battle_results add column if not exists q_count    int;
alter table public.battle_results add column if not exists answered   int;
alter table public.battle_results add column if not exists team       smallint;
alter table public.battle_results add column if not exists team_won   boolean;
alter table public.battle_results add column if not exists claimed_at timestamptz;
alter table public.battle_results add column if not exists xp         int;
alter table public.battle_results add column if not exists credits    int;

-- starší výsledky odměnila hra sama; znovu se nevyplácejí
update public.battle_results set claimed_at = now() where claimed_at is null and q_count is null;

-- ── 2) jediné místo, odkud se počítá, od kdy se dopočítávají souboje ──
create or replace function public._battle_rewards_od()
returns timestamptz language sql immutable set search_path = public as $$
  select '2026-11-04 00:00:00+01'::timestamptz;
$$;

-- ── 3) uložení výsledku hráče (společné pro hráče i pro dopočet) ──
create or replace function public._battle_save_result(p_battle uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  b battles;
  me_score int; me_correct int; me_last int; me_team smallint;
  me_rank int; me_total int; me_qcount int;
  s_me int; s_other int; won boolean;
begin
  select * into b from battles where id = p_battle;
  if b.id is null then return; end if;                    -- místnost už uklizená
  select score, correct_count, last_qi, team into me_score, me_correct, me_last, me_team
    from battle_players where battle_id = p_battle and user_id = p_user;
  if me_score is null then return; end if;                -- nebyl to hráč
  me_qcount := greatest(b.q_count, me_correct);
  select count(*)::int into me_total from battle_players where battle_id = p_battle;
  select 1 + count(*)::int into me_rank
    from battle_players where battle_id = p_battle and score > me_score;
  won := null;
  if b.team_mode and me_team is not null then
    select coalesce(sum(score) filter (where team = me_team), 0),
           coalesce(sum(score) filter (where team is not null and team <> me_team), 0)
      into s_me, s_other from battle_players where battle_id = p_battle;
    won := case when s_me > s_other then true when s_me < s_other then false else null end;
  end if;
  insert into battle_results
         (battle_id, user_id, game, correct, wrong, score, rank, total, q_count, answered, team, team_won)
  values (p_battle, p_user, b.game, me_correct, greatest(0, me_qcount - me_correct), me_score,
          me_rank, me_total, b.q_count, greatest(0, me_last + 1), me_team, won)
  on conflict (battle_id, user_id) do nothing;            -- ať se nepřičítá dvakrát
end; $$;

-- původní volání z výsledkové obrazovky zůstává (a přibyl tým a počet odpovědí)
create or replace function public.record_battle_result(p_battle uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  perform public._battle_save_result(p_battle, auth.uid());
end; $$;

-- ── 4) výpočet odměny ──────────────────────────────────────────────
create or replace function public._battle_odmena(
  p_rank int, p_correct int, p_total int, p_qcount int, p_answered int,
  p_team smallint, p_team_won boolean, p_nth int)
returns table (xp int, credits int)
language sql immutable set search_path = public as $$
  with z as (
    select
      (case when p_rank = 1 then 80 when p_rank = 2 then 50 when p_rank = 3 then 30 else 20 end
        + least(greatest(coalesce(p_correct, 0), 0) * 3, 30)
        + case when p_team is null then 0 when p_team_won is true then 30 else 10 end) as x,
      (case when p_rank = 1 then 25 when p_rank = 2 then 15 when p_rank = 3 then 10 else 5 end
        + case when p_team is not null and p_team_won is true then 10 else 0 end) as c,
      (coalesce(p_total, 0) >= 2 and coalesce(p_qcount, 0) >= 5
        and coalesce(p_answered, 0) >= ceil(coalesce(p_qcount, 0) / 2.0)) as ok
  )
  select case when not ok then 0 when p_nth > 5 then x / 2 else x end,
         case when not ok then 0 when p_nth > 5 then c / 2 else c end
  from z;
$$;

-- ── 5) souhrn hráče (hodnost se počítá v klientovi z `points`) ────
create or replace function public._battle_stats(p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with v as (
    select * from battle_results
     where user_id = p_user and total >= 2
       and coalesce(answered, 0) >= ceil(coalesce(q_count, 0) / 2.0)
  ),
  n as (select rank, row_number() over (order by finished_at desc, battle_id) as rn from v)
  select jsonb_build_object(
    'played',    (select count(*) from v),
    'wins',      (select count(*) from v where rank = 1),
    'team_wins', (select count(*) from v where team_won is true),
    'points',    (select coalesce(sum(score), 0) from v),
    'best',      (select coalesce(max(score), 0) from v),
    'correct',   (select coalesce(sum(correct), 0) from v),
    'wrong',     (select coalesce(sum(wrong), 0) from v),
    'streak',    coalesce((select min(rn) - 1 from n where rank <> 1), (select count(*) from n))
  );
$$;

-- ── 6) vyzvednutí odměn (jednou za souboj) ─────────────────────────
create or replace function public.claim_battle_rewards()
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  r record; o record;
  nth int; xp_sum int := 0; vyd jsonb := '[]'::jsonb;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  -- a) dohrané souboje (od zavedení fáze), jejichž výsledek se nezapsal (zavřená stránka, hub)
  for r in
    select p.battle_id
      from battle_players p join battles b on b.id = p.battle_id
     where p.user_id = uid and b.status = 'finished' and b.created_at >= public._battle_rewards_od()
       and not exists (select 1 from battle_results x where x.battle_id = p.battle_id and x.user_id = uid)
     order by b.created_at limit 20
  loop
    perform public._battle_save_result(r.battle_id, uid);
  end loop;

  -- b) vydat nevyzvednuté, nejvýš 180 XP najednou (strop jednoho zápisu savu je +200)
  for r in
    select * from battle_results
     where user_id = uid and claimed_at is null
     order by finished_at, battle_id limit 20
  loop
    select count(*)::int + 1 into nth
      from battle_results x
     where x.user_id = uid and x.claimed_at is not null and coalesce(x.xp, 0) > 0
       and (x.finished_at at time zone 'Europe/Prague')::date = (r.finished_at at time zone 'Europe/Prague')::date;
    select * into o from public._battle_odmena(r.rank, r.correct, r.total, r.q_count, r.answered, r.team, r.team_won, nth);
    if xp_sum > 0 and xp_sum + o.xp > 180 then exit; end if;
    update battle_results set claimed_at = now(), xp = o.xp, credits = o.credits
     where battle_id = r.battle_id and user_id = uid;
    xp_sum := xp_sum + o.xp;
    vyd := vyd || jsonb_build_array(jsonb_build_object(
      'battle_id', r.battle_id, 'game', r.game, 'rank', r.rank, 'total', r.total,
      'correct', r.correct, 'wrong', r.wrong, 'score', r.score, 'q_count', r.q_count,
      'team', r.team, 'team_won', r.team_won, 'xp', o.xp, 'credits', o.credits));
  end loop;

  return json_build_object('rewards', vyd, 'stats', public._battle_stats(uid));
end; $$;

-- ── 7) souhrn pro profil (jen vlastní) ───────────────────────────
create or replace function public.battle_profile()
returns json language sql stable security definer set search_path = public as $$
  select public._battle_stats(auth.uid())::json where auth.uid() is not null;
$$;

-- ── 8) práva (vzor fáze 9: anon nikam, pomocné jen zevnitř) ───────
revoke execute on function public._battle_rewards_od()                                         from public, anon, authenticated;
revoke execute on function public._battle_save_result(uuid, uuid)                              from public, anon, authenticated;
revoke execute on function public._battle_odmena(int, int, int, int, int, smallint, boolean, int) from public, anon, authenticated;
revoke execute on function public._battle_stats(uuid)                                          from public, anon, authenticated;
revoke execute on function public.claim_battle_rewards()                                       from public, anon;
revoke execute on function public.battle_profile()                                             from public, anon;
grant  execute on function public.claim_battle_rewards()                                       to authenticated;
grant  execute on function public.battle_profile()                                             to authenticated;
-- record_battle_result si zachová práva z fáze 13/9 (CREATE OR REPLACE je nemění)
