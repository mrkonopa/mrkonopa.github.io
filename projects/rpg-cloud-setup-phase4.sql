-- ════════════════════════════════════════════════════════════════
-- RPG Matematika — FÁZE 4: žebříček třídy (leaderboard)
-- Spusť v Supabase: SQL Editor → New query → Run
-- (Spouštět AŽ PO rpg-cloud-setup.sql, phase2 a phase3.)
--
-- Co přidává:
--   • funkci leaderboard(game) — žák uvidí pořadí SPOLUŽÁKŮ (těch, se
--     kterými sdílí aspoň jednu třídu) v daném ročníku.
--   • Vrací jen NEcitlivá pole: zobrazované jméno, level, XP. Žádné
--     e-maily, žádný celý save → soukromí žáků zůstává chráněné.
--   • SECURITY DEFINER obchází RLS jen pro tento úzký, bezpečný dotaz.
-- ════════════════════════════════════════════════════════════════

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
    -- zobraz jméno postavy; když chybí, jméno z Google; jinak „Hráč"
    coalesce(nullif(s.name, ''), nullif(s.full_name, ''), 'Hráč')      as display_name,
    -- POZOR: `data` píše ŽÁK, takže přímý cast (dřív `(data->>'xp')::int`)
    -- SPADNE na nečíselném/přetékajícím xp a shodí žebříček CELÉ třídě.
    -- Castuj jen ryze číselný řetězec a clampni (shodné s fází 19).
    (least(greatest(
       case when (s.data->>'xp') ~ '^[0-9]{1,15}$' then (s.data->>'xp')::bigint else 0 end,
       0), 1000000))::int                                              as xp,
    (least(greatest(
       case when (s.data->>'level') ~ '^[0-9]{1,9}$' then (s.data->>'level')::bigint else 1 end,
       1), 9999))::int                                                 as lvl,
    (s.user_id = auth.uid())                                           as is_me
  from public.saves s
  where s.game = p_game
    and (
      -- sebe sama vidím vždy
      s.user_id = auth.uid()
      -- + každého, s kým sdílím aspoň jednu třídu
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

-- přihlášení žáci (i učitelé) smí funkci volat; RLS uvnitř hlídá rozsah
grant execute on function public.leaderboard(text) to authenticated;

-- ════════════════════════════════════════════════════════════════
-- Hotovo. Žebříček se v každé hře ukáže na mapě po přihlášení,
-- pokud je žák v nějaké třídě se spolužáky. Bez přihlášení/třídy
-- se panel prostě nezobrazí (graceful).
-- ════════════════════════════════════════════════════════════════
