-- ════════════════════════════════════════════════════════════════════
--  RPG Matematika — FÁZE 16: ARCHIV TŘÍD
--  ────────────────────────────────────────────────────────────────────
--  Když třída „dohraje" 2. stupeň (např. 9.AB po 1. září přejde na ročník
--  10, který neexistuje), nemaže se — ARCHIVUJE se. Žáci i jejich postavy
--  zůstanou, třída jen zmizí z aktivních seznamů, filtrů a hromadných akcí.
--  Kdykoli ji lze obnovit.
--
--  Stačí jeden bool sloupec; přístup ke `classes` už řeší RLS z Fáze 3
--  (učitel/superadmin smí update), takže žádná nová RPC není potřeba.
--  Spustit po fázi 3.
-- ════════════════════════════════════════════════════════════════════

alter table public.classes
  add column if not exists archived boolean not null default false;

-- ════════════════════════════════════════════════════════════════════
--  Hotovo. Konzole archivuje přes RPGCloud.updateClassMeta(id,{archived})
--  a archivované třídy filtruje z aktivních seznamů (activeClasses()).
-- ════════════════════════════════════════════════════════════════════
