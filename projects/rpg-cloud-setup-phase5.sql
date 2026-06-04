-- ════════════════════════════════════════════════════════════════
-- RPG Matematika — FÁZE 5: ročníkové kohorty u tříd
-- Spusť v Supabase: SQL Editor → New query → Run
-- (Spouštět AŽ PO rpg-cloud-setup-phase3.sql.)
--
-- Co přidává:
--   • cohort_start_year — kalendářní rok, kdy kohorta nastoupila do 6. třídy
--       (= září daného roku). Z něj se POČÍTÁ aktuální ročník podle data,
--       takže se třída po 1. září sama „posune" (6.B → 7.B) bez cron jobu.
--       Příklad: třída v 6. ročníku ve školním roce 25/26 má hodnotu 2025
--       → 26/27 je 7., 27/28 je 8., 28/29 je 9.
--   • section — označení třídy (písmeno/název), např. „B" nebo „matematická".
--       Aktuální název se skládá jako „<ročník>.<section>".
--   Obě hodnoty jsou nepovinné — třídy bez nich fungují dál podle `name`.
-- ════════════════════════════════════════════════════════════════

alter table public.classes
  add column if not exists cohort_start_year int,
  add column if not exists section           text default '';

-- Žádné nové RLS politiky nejsou potřeba — sloupce spadají pod stávající
-- politiky tabulky `classes` (číst smí sbor, upravovat sbor i superadmin).

-- Hotovo. classes má teď cohort_start_year + section.
