# Cloud Setup — Supabase konfigurace

## Požadavky

- Supabase projekt `ovajoalbyofenjbbyhcy` (již nastaven)
- Google OAuth (`@husovaliberec.cz` povolená doména)
- SQL skripty spouštět v pořadí níže v Supabase SQL editoru

## Pořadí SQL skriptů

Spouštěj vždy **jeden soubor najednou**, zkontroluj výsledek.

| Fáze | Soubor | Co přidává |
|------|--------|-----------|
| 1 | `projects/rpg-cloud-setup.sql` | Tabulka `saves`, RLS, základní Auth |
| 2 | `projects/rpg-cloud-setup-phase2.sql` | Role (`teacher`/`superadmin`), `my_role()`, učitelské RPC |
| 3 | `projects/rpg-cloud-setup-phase3.sql` | Třídy (`classes`, `class_members`), poznámky (`notes`) |
| 4 | `projects/rpg-cloud-setup-phase4.sql` | Žebříček třídy (`leaderboard` RPC) |
| 5 | `projects/rpg-cloud-setup-phase5.sql` | Ročníkové kohorty (`cohort_start_year`, `section`) |
| 6 | `projects/rpg-cloud-setup-phase6.sql` | Vysvětlení postupu (`explanations`) |
| 6b | `projects/rpg-cloud-setup-phase6b.sql` | Snímky chybovosti (`snap_events`) |
| 7 | `projects/rpg-cloud-setup-phase7.sql` | Živý souboj (`battles`, `battle_players`, `battle_invites`) |
| 8 | `projects/rpg-cloud-setup-phase8.sql` | Zpětná vazba (`feedback`) |
| 9 | `projects/rpg-cloud-setup-phase9.sql` | Bezpečnost: revoke anon přístup ke všem tabulkám |
| 10 | `projects/rpg-cloud-setup-phase10.sql` | Online přítomnost, heartbeat |
| 11 | `projects/rpg-cloud-setup-phase11.sql` | Věž legend (`tower_runs`, `tower_hall`, RPC) |
| 12 | `projects/rpg-cloud-setup-phase12.sql` | Admin nástroje věže |
| 13 | `projects/rpg-cloud-setup-phase13.sql` | Trvalá historie soubojů (`battle_results`) |
| 14 | `projects/rpg-cloud-setup-phase14.sql` | Týmový souboj (sloupce `team_mode`, `team`, RPC `rematch_battle`) |
| Security | `rpg-cloud-setup-security.sql` | Trigger: stropy kreditů (+500/save) a XP (+200/save) |

> ⚠️ Fáze 9 je kritická — **revokuje anon přístup**. Spouštěj až po všech předchozích fázích.

## Přidání učitele (superadmin)

Po nasazení Fáze 2 přidej sebe jako superadmin přes Supabase SQL editor:

```sql
INSERT INTO public.roles (email, role, added_by)
VALUES ('vojtech.konopa@husovaliberec.cz', 'superadmin', 'system');
```

Ostatní učitele přidávej v učitelské konzoli (záložka UČITELÉ).

## Konfigurace v kódu

`projects/rpg-cloud.js` řádek 10–14:

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://ovajoalbyofenjbbyhcy.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_...',  // veřejný klíč, OK v kódu
  ALLOWED_DOMAIN: 'husovaliberec.cz'
};
```

Anon klíč je záměrně veřejný — přístup řídí RLS politiky na DB.

## Graceful degradation

Bez cloudu / bez přihlášení hry fungují lokálně přes `localStorage`. Přihlašovací lišta se skryje. Nulové riziko pro offline použití.

## Bezpečnostní trigger (Security fáze)

`fn_validate_save_delta()` — BEFORE UPDATE na `saves`:
- **Kredity** (`_wallet`): max **+500 za jeden save**
- **XP** (`RPG_MAT_*`): max **+200 za jeden save**
- Záporné hodnoty → nuluje
- Bypass pro `teacher`/`superadmin` a přímý DB přístup

Zastaví `RPGWallet.earn(9999)` z DevTools konzole.
