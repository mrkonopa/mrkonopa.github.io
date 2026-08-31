-- ══════════════════════════════════════════════════════════════════
-- FÁZE 26 — staff_emails(): ať „Skrýt učitele" funguje i BĚŽNÉMU UČITELI
--
-- Problém z praxe: v učitelské konzoli je v přehledu zaškrtávátko
-- „Skrýt učitele" (učitelské testovací postavy nejsou žáci). Konzole si
-- k tomu tahala seznam e-mailů přes `listRoles()`, jenže:
--   · klient má v listRoles pojistku „jen superadmin", a
--   · RLS `roles_select` (fáze 2) pouští čtení všech řádků jen superadminovi.
-- Běžná učitelka tedy dostala prázdný seznam a filtr neskryl NIKOHO.
-- Nikde to nevyskočilo — chyba spadla do catch a nastavila prázdnou množinu.
--
-- Řešení: samostatná funkce, která vrací POUZE e-maily personálu. Záměrně
-- NEvrací roli ani „kdo koho přidal" — učitelka potřebuje vědět, které účty
-- vynechat z přehledu žáků, ne kdo je superadmin. Tabulka `roles` zůstává
-- pro běžného učitele nadále zavřená.
--
-- Idempotentní: pusť kdykoli po fázi 2 (a 23 kvůli my_role() bez NULL).
-- ══════════════════════════════════════════════════════════════════

create or replace function public.staff_emails()
returns table (email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Brána tvarem z fáze 23: my_role() nikdy nevrací NULL, ale coalesce
  -- tu je schválně, aby řádek zůstal bezpečný i kdyby někdo pustil starou
  -- verzi fáze 2 přes tuhle (`NULL not in (…)` je NULL, tedy „neplatí").
  if coalesce((select public.my_role()), '') not in ('teacher', 'superadmin') then
    raise exception 'forbidden';
  end if;
  return query select lower(r.email)::text from public.roles r order by 1;
end;
$$;

revoke all on function public.staff_emails() from public, anon;
grant execute on function public.staff_emails() to authenticated;
