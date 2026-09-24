-- ══════════════════════════════════════════════════════════════════════
--  Které SQL fáze jsou v produkci SKUTEČNĚ nasazené?
--
--  Jen čte systémový katalog (pg_proc) — na data žáků nesahá. Spouští se
--  v Supabase SQL editoru, nebo přes konektor Supabase z Claude Code.
--
--  PROČ VZNIKL: CLAUDE.md vedl fáze 17–26 a security.sql měsíce jako
--  „čeká na spuštění", protože do živé databáze nebylo vidět. Ověřeno
--  23. 9. 2026 tímhle dotazem: VŠECHNO BYLO NASAZENÉ. Zastaralý zápis
--  „nesplněno" je stejná past jako zastaralé „hotovo" — posílá další
--  sezení honit něco, co už neexistuje.
--
--  U funkcí, které existovaly UŽ PŘEDTÍM (`leaderboard`, `my_role`), se
--  hledá OTISK opravené verze v těle — holá existence by prošla i se
--  starou děravou definicí. Ostatní funkce přinesla až daná fáze, takže
--  u nich existence stačí. Fáze 25 je o PRÁVU, ne o těle, proto
--  `has_function_privilege`.
-- ══════════════════════════════════════════════════════════════════════
with f as (
  select p.proname, pg_get_functiondef(p.oid) as def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
)
select 'fáze 17 · věž zavřená o prázdninách (_tower_open)' as co,
       exists(select 1 from f where proname = '_tower_open') as nasazeno
union all select 'fáze 19 · bezpečný cast xp v žebříčku (regex)',
       exists(select 1 from f where proname = 'leaderboard' and def like '%[0-9]{1,15}%')
union all select 'fáze 20 · _jsonb_true',
       exists(select 1 from f where proname = '_jsonb_true')
union all select 'fáze 23 · my_role() nevrací NULL (coalesce student)',
       exists(select 1 from f where proname = 'my_role'
                              and def ilike '%coalesce%' and def like '%''student''%')
union all select 'fáze 25 · authenticated smí volat my_role()',
       coalesce((select has_function_privilege('authenticated', p.oid, 'execute')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'my_role' limit 1), false)
union all select 'fáze 26 · staff_emails()',
       exists(select 1 from f where proname = 'staff_emails')
union all select 'security.sql · _save_num v triggeru stropů',
       exists(select 1 from f where proname = '_save_num');
