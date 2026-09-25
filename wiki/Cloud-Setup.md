# Cloud Setup

Supabase projekt `ovajoalbyofenjbbyhcy`, přihlášení Googlem jen pro `@husovaliberec.cz`.
Bez cloudu hry běží dál lokálně (`localStorage`), přihlašovací lišta se jen skryje.

- **Založení projektu, Google přihlášení a pořadí všech SQL fází (1–26 + bezpečnostní trigger):**
  [projects/RPG-CLOUD-SETUP.md](https://github.com/mrkonopa/mrkonopa.github.io/blob/main/projects/RPG-CLOUD-SETUP.md).
  Všechny fáze jsou idempotentní a číselné pořadí je vždy bezpečné.
- **Co je nasazené v produkci:** [tools/sql-stav-nasazeni.sql](https://github.com/mrkonopa/mrkonopa.github.io/blob/main/tools/sql-stav-nasazeni.sql)
  (jen čte). Stav k 23. 9. 2026: nasazené všechno.
- **Konfigurace v kódu:** `CONFIG` na začátku `projects/rpg-cloud.js`. Veřejný (publishable)
  klíč v kódu být smí, přístup řídí RLS a brány uvnitř funkcí.
- **Testy SQL naostro:** `tests/sql-*.test.cjs` spouští fáze nad dočasným PostgreSQL 16
  (`tests/sql-harness.cjs`), v produkčním pořadí.
- **Doporučení Supabase (`get_advisors`):** tři hlášené kategorie jsou záměr (tabulky jen přes RPC,
  API funkce `SECURITY DEFINER`, vypnutá kontrola uniklých hesel, protože se hesla nepoužívají).
  Proč, to je v CLAUDE.md, sekce Bezpečnost.
