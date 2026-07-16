-- ════════════════════════════════════════════════════════════════
-- RPG Matematika — FÁZE 19: bezpečnostní hardening (proporční)
-- Spusť v Supabase: SQL Editor → New query → Run.
-- (Spouštět AŽ PO phase4, phase11 a phase17.)
--
-- Reaguje na bezpečnostní review. Řeší DVA reálné (nízkozávažné, ale
-- konkrétní) nálezy u SOUTĚŽNÍCH mechanik, kde server věřil klientovi:
--
--   1) leaderboard(game) — řadil podle xp/level z klientského save.
--      • REÁLNÝ problém: `(data->>'xp')::int` SPADNE, když si žák do
--        save dá nečíselné nebo přetékající `xp` (např. "9e99" nebo
--        "<x>") → chyba castu shodí žebříček CELÉ třídě (availability).
--      • Fix: bezpečný cast (jen ryze číselný řetězec, přes bigint) +
--        clamp na věrohodné meze (xp 0–1 000 000, level 1–9999). Žebříček
--        se už nikdy nerozbije a nezobrazí absurdní čísla.
--      • Zbytek zůstává „honor-based": determinovaný žák si pořád může
--        nastavit vysoké-ale-věrohodné xp. Plná obrana = server-počítané
--        XP z logů (mimo rozsah tohoto nástroje) — viz CLAUDE.md.
--
--   2) tower_submit(game, floor) — patro hlásí klient, server ho jen
--      ořezával na 0–500. Fix: zpřísnit strop na 60 (věž má ~21
--      pojmenovaných pater + náhodné výš; 60 je nad reálným rekordem, ale
--      brání zápisu „patro 500" do TRVALÉ síně slávy). Prázdninový zámek
--      z fáze 17 zůstává.
-- ════════════════════════════════════════════════════════════════

-- ── 1) leaderboard: bezpečný cast + clamp ──────────────────────────
create or replace function public.leaderboard(p_game text)
returns table (
  user_id      uuid,
  display_name text,
  xp           int,
  lvl          int,
  is_me        boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.user_id,
    coalesce(nullif(s.name, ''), nullif(s.full_name, ''), 'Hráč') as display_name,
    -- bezpečně: castuj JEN ryze číselný řetězec (1–15 číslic → vejde se
    -- do bigint), pak clamp 0..1 000 000. Nikdy nespadne, nikdy absurdní.
    (least(greatest(
       case when (s.data->>'xp') ~ '^[0-9]{1,15}$' then (s.data->>'xp')::bigint else 0 end,
       0), 1000000))::int as xp,
    (least(greatest(
       case when (s.data->>'level') ~ '^[0-9]{1,9}$' then (s.data->>'level')::bigint else 1 end,
       1), 9999))::int as lvl,
    (s.user_id = auth.uid()) as is_me
  from public.saves s
  where s.game = p_game
    and (
      s.user_id = auth.uid()
      or exists (
        select 1
        from public.class_members me
        join public.class_members other on other.class_id = me.class_id
        where me.user_id = auth.uid()
          and other.user_id = s.user_id
      )
    )
  order by xp desc, display_name asc
  limit 50;
$$;

revoke all on function public.leaderboard(text) from public, anon;
grant execute on function public.leaderboard(text) to authenticated;

-- ── 2) tower_submit: strop patra 500 → 60 (jinak identická s fází 17) ──
create or replace function public.tower_submit(p_game text, p_floor int)
returns int  -- vrací aktuální best_floor sezóny
language plpgsql security definer set search_path = public as $$
declare v_best int;
begin
  if auth.uid() is null then raise exception 'not logged in'; end if;
  if not _tower_open() then raise exception 'tower on holidays'; end if;
  if not tower_eligible(p_game) then raise exception 'wrong grade'; end if;
  -- strop 60: nad reálným rekordem, ale brání zápisu absurdního patra do
  -- trvalé síně slávy. Kdyby někdo věž reálně přelezl, klidně strop zvedni.
  if p_floor is null or p_floor < 0 or p_floor > 60 then
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

revoke all on function public.tower_submit(text, int) from public, anon;
grant execute on function public.tower_submit(text, int) to authenticated;

-- ════════════════════════════════════════════════════════════════
-- Hotovo. Po spuštění: žebříček přežije podvržené xp (bez pádu) a
-- ukazuje jen clampnuté hodnoty; věž nepřijme patro > 60.
-- ════════════════════════════════════════════════════════════════
