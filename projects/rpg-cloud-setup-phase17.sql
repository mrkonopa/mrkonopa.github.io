-- ════════════════════════════════════════════════════════════════════
--  Fáze 17 — LETNÍ PRÁZDNINY VĚŽE LEGEND
--  Věž je o letních prázdninách (červenec + srpen) zavřená — nikdo nemůže
--  odesílat nové pokusy. Žebříček i síň slávy zůstávají čitelné.
--
--  • Zavření je AUTOMATICKÉ podle data (žádný cron): server odmítne
--    tower_submit v červenci a srpnu.
--  • Sezóna se sama posune 1. září (viz _season_label / _school_year_start
--    z fáze 11) → od 1. 9. jede čistá „resetnutá" věž nové sezóny.
--  • Archivaci top 10 do síně slávy (tower_close_season) dělá učitel RUČNĚ.
--    Jde i celé léto — sezóna má stále loňský label až do 31. 8.
--  • Síň slávy (tower_hall) zůstává navždy — prázdniny se jí netýkají.
--
--  Nasazení: spustit po fázi 11. Idempotentní (create or replace).
-- ════════════════════════════════════════════════════════════════════

-- Je věž teď otevřená? Zavřeno = červenec (7) a srpen (8).
create or replace function public._tower_open()
returns boolean language sql stable as $$
  select extract(month from now())::int not in (7, 8);
$$;

-- tower_submit s kontrolou prázdnin (jinak identická s fází 11)
create or replace function public.tower_submit(p_game text, p_floor int)
returns int  -- vrací aktuální best_floor sezóny
language plpgsql security definer set search_path = public as $$
declare v_best int;
begin
  if auth.uid() is null then raise exception 'not logged in'; end if;
  if not _tower_open() then raise exception 'tower on holidays'; end if;
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

-- _tower_open je interní helper (volaný uvnitř SECURITY DEFINER funkce),
-- takže ho anon/authenticated nepotřebují volat přímo. Pro jistotu revoke.
revoke all on function public._tower_open() from public, anon, authenticated;

-- create or replace zachovává grants tower_submit z fáze 11 (authenticated).
-- Pro jistotu je zopakujeme:
revoke all on function public.tower_submit(text, int) from public, anon;
grant execute on function public.tower_submit(text, int) to authenticated;
