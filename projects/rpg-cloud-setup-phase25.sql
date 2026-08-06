-- ══════════════════════════════════════════════════════════════════════
-- RPG Matematika — FÁZE 25: OPRAVA „permission denied for function my_role"
-- Spusť v Supabase SQL editoru. Idempotentní, jde pustit kdykoli.
--
-- ── CO SE DĚLO ───────────────────────────────────────────────────────
-- V logu se objevovalo:
--
--     ERROR 42501: permission denied for function my_role
--     WITH pgrst_source AS (SELECT "public"."saves"."data" …)
--
-- Tabulka `saves` má vedle žákovské politiky i učitelskou
-- `saves_select_staff`, která volá public.my_role(). Fáze 2 a 23 ale
-- funkci ODEBRALY roli `authenticated`:
--
--     revoke execute on function public.my_role() from authenticated;
--
-- PostgreSQL vyhodnocuje VŠECHNY permisivní politiky daného příkazu a
-- spojuje je přes OR. Žák čtoucí vlastní řádek proto spustí i učitelskou
-- politiku, ta zavolá my_role() — a bez práva to skončí chybou. Žákovi
-- se v tu chvíli nenačte postup z cloudu.
--
-- Že se to neprojevovalo pokaždé, je jen tím, že plánovač někdy stihne
-- vyhodnotit levnější politiku dřív a druhou přeskočí. Spolehnout se na
-- to nejde — je to nedeterministické.
--
-- ── PROČ JE GRANT BEZPEČNÝ ───────────────────────────────────────────
-- my_role() nevrací nic citlivého: jen roli volajícího, odvozenou z jeho
-- VLASTNÍHO JWT (auth.jwt() ->> 'email'). Přihlášený uživatel se tak
-- dozví jen to, co o sobě už ví. Cizí role se z ní vytáhnout nedá.
--
-- Revoke z `anon` naopak smysl dává a zůstává: nepřihlášený nemá co číst.
--
-- ── PRAVIDLO DO BUDOUCNA ─────────────────────────────────────────────
-- Funkci, kterou volá RLS politika, NESMÍŠ odebrat roli `authenticated`.
-- SECURITY DEFINER mění kontext běhu, ale právo funkci ZAVOLAT musí mít
-- volající. Utahovat jde `anon`, ne `authenticated`.
-- ══════════════════════════════════════════════════════════════════════

-- ── Vrátit právo volat my_role() přihlášeným ────────────────────────
grant execute on function public.my_role() to authenticated;

-- ── Nepřihlášení zůstávají odříznutí ────────────────────────────────
revoke execute on function public.my_role() from anon;
revoke execute on function public.my_role() from public;

-- ── Kontrola (mělo by vyjít t / f) ──────────────────────────────────
-- select has_function_privilege('authenticated','public.my_role()','execute') as authenticated_smi,
--        has_function_privilege('anon','public.my_role()','execute')          as anon_smi;

-- ── Ostatní funkce volané z RLS politik ─────────────────────────────
-- Kdyby se stejný vzor objevil jinde, projeví se stejnou chybou.
-- Tenhle dotaz vypíše všechny funkce, které se objevují v definicích
-- politik, a u každé řekne, jestli ji `authenticated` smí volat:
--
--   select p.polname, c.relname,
--          has_function_privilege('authenticated','public.my_role()','execute')
--     from pg_policy p join pg_class c on c.oid = p.polrelid
--    where pg_get_expr(p.polqual, p.polrelid) like '%my_role%';
