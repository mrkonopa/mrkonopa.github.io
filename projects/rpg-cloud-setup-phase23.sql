-- ════════════════════════════════════════════════════════════════
-- FÁZE 23 — BEZPEČNOSTNÍ OPRAVA: my_role() nesmí vracet NULL
--
-- CO SE NAŠLO (strojovým ověřením fází proti skutečnému PostgreSQL)
-- --------------------------------------------------------------------
-- Staff-only RPC hlídají přístup takto:
--
--     if (select my_role()) not in ('teacher', 'superadmin') then
--       raise exception 'forbidden';
--     end if;
--
-- Jenže `my_role()` z fáze 2 vracelo hodnotu z tabulky `roles`, a kdo
-- v allowlistu není — tedy KAŽDÝ ŽÁK — dostal NULL. A v SQL platí:
--
--     NULL not in ('teacher','superadmin')  →  NULL   (NE true!)
--     if NULL then …                        →  neprovede se
--
-- ⇒ podmínka se NEsplnila, výjimka se nevyhodila a funkce pokračovala.
-- Každý přihlášený žák (školní účet) tak mohl volat staff-only RPC:
--   • tower_close_season  (fáze 11) — přepsat TRVALOU síň slávy
--   • tower_delete_run    (fáze 12) — smazat spolužákovi rekord ve věži
--   • log_action          (fáze 15) — psát do auditního logu
--   • tower_board_admin   (fáze 18) — čtení administrátorského žebříčku
--   • create_assignment / delete_assignment (fáze 20) — úkoly třídě
--   • cleanup_battles     (fáze 7)  — mazat záznamy bitev
-- (Všechny jsou grantované pro `authenticated`, takže byly dosažitelné.)
--
-- Pozn.: podmínky ve tvaru `where my_role() in (…)` (fáze 21/22) děravé
-- NEBYLY — tam NULL vyfiltruje řádek, takže se chová bezpečně. Problém
-- má jen varianta `if … not in … then raise`.
--
-- OPRAVA
-- --------------------------------------------------------------------
-- Jedna funkce, která zavře všechna volací místa naráz: `my_role()` teď
-- vrací 'student' místo NULL. To odpovídá i modelu na klientovi
-- (rpg-cloud.js fetchRole: `data ? data.role : 'student'`) a dokumentaci
-- (student < teacher < superadmin). Sazby ve `where … in (…)` to nijak
-- neoslabí ('student' tam propadne stejně jako NULL).
--
-- Stejná úprava je zapracovaná i do rpg-cloud-setup-phase2.sql, aby
-- opětovné spuštění fáze 2 díru znovu neotevřelo.
--
-- Spustit v Supabase SQL editoru KDYKOLI (je idempotentní). Doporučeno
-- hned — je to bezpečnostní oprava.
-- ════════════════════════════════════════════════════════════════

create or replace function public.my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  -- NIKDY NULL — viz komentář v hlavičce (NULL not in (…) = NULL).
  select coalesce(
    (select role from public.roles
      where lower(email) = lower(auth.jwt() ->> 'email')
      limit 1),
    'student');
$$;

-- práva ponechána jako ve fázi 2 (interní helper: volají ho SECURITY
-- DEFINER funkce, ne klient přímo)
-- `authenticated` právo ponecháno schválně — volá ji RLS politika na
-- `saves` a bez něj se žákovi nenačte postup (viz fáze 25).
revoke execute on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

-- ════════════════════════════════════════════════════════════════
-- Kontrola po spuštění (jako učitel i jako žák):
--   select public.my_role();        -- nikdy nesmí být prázdné/NULL
-- Žákovi teď staff-only RPC vrátí 'forbidden'.
-- ════════════════════════════════════════════════════════════════
