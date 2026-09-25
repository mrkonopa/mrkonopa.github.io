# RPG Matematika — nastavení cloudu

> **Rychlý přehled:** kompletní seznam SQL souborů a pořadí spouštění najdeš dole v sekci [Všechny fáze — pořadí spouštění](#všechny-fáze--pořadí-spouštění). Sekce níže provedou prvním nastavením (Supabase + Google login + Fáze 1–2).

Přihlášení přes **školní Google účet** (`@husovaliberec.cz`) + ukládání postav do cloudu, takže žák může pokračovat na jakémkoli zařízení.

> **Než to nastavíš:** web funguje normálně i bez cloudu. Dokud nevyplníš klíče v `rpg-cloud.js`, hry ukládají lokálně jako dosud a přihlašovací lišta se skryje. Nastavení je tedy bezpečné dělat kdykoli.

Celkem ~10–15 minut. Potřebuješ jen účet na supabase.com (zdarma) a přístup do Google Workspace admin / Google Cloud Console (máš jako admin domény).

---

## 1) Založ projekt v Supabase
1. Na [supabase.com](https://supabase.com) → **New project**.
2. **Region:** zvol **Frankfurt (eu-central-1)** — data zůstanou v EU.
3. Po vytvoření jdi do **Project Settings → API** a opiš si:
   - **Project URL** (např. `https://abcd1234.supabase.co`)
   - **anon public** key (dlouhý řetězec — je bezpečné dát ho do frontendu)

## 2) Vytvoř tabulku
V Supabase **SQL Editor → New query** vlož obsah souboru [`rpg-cloud-setup.sql`](./rpg-cloud-setup.sql) a klikni **Run**. Vytvoří tabulku `saves` a zabezpečí ji (každý žák vidí jen svou postavu).

## 3) Zapni přihlášení přes Google
### 3a) V Google Cloud Console (jako admin domény)
1. [console.cloud.google.com](https://console.cloud.google.com) → vytvoř/zvol projekt.
2. **APIs & Services → OAuth consent screen**:
   - **User type: Internal** ← tím se přihlášení automaticky omezí jen na `@husovaliberec.cz`. 🎯
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Typ: **Web application**
   - **Authorized redirect URI:** `https://<TVŮJ-PROJEKT>.supabase.co/auth/v1/callback`
     (URL najdeš v Supabase → Authentication → Providers → Google)
   - Ulož a opiš si **Client ID** a **Client Secret**.

### 3b) V Supabase
- **Authentication → Providers → Google** → zapni a vlož **Client ID** + **Client Secret** z kroku 3a.
- **Authentication → URL Configuration → Site URL:** `https://mrkonopa.github.io`
  a do **Redirect URLs** přidej `https://mrkonopa.github.io/projects/*`.

## 4) Vlož klíče do webu
V souboru [`rpg-cloud.js`](./rpg-cloud.js) nahoře vyplň:
```js
SUPABASE_URL: 'https://<TVŮJ-PROJEKT>.supabase.co',
SUPABASE_ANON_KEY: '<anon public key>',
ALLOWED_DOMAIN: 'husovaliberec.cz'
```
Commitni a pushni. Hotovo — na hubu i ve hrách se objeví **🔑 Přihlásit přes Google**.

---

## Jak to pak funguje
- Nepřihlášený žák → hraje lokálně (jako dřív).
- Přihlášený žák → po přihlášení se stáhne jeho postava z cloudu; každé uložení (po vyřešeném úkolu) se automaticky pošle do cloudu.
- Cizí (neškolní) účty modul odmítne.

## Bezpečnost
- Přenos přes HTTPS, data v klidu šifruje Supabase (AES-256).
- Žádná hesla neukládáš — ověřuje Google.
- **Row Level Security** v DB zajišťuje, že žák vidí/mění jen svou postavu.

---

# Fáze 2 — Učitelská konzole

Stránka [`rpg-ucitel.html`](./rpg-ucitel.html): přehled pokroku celé třídy, náhledy her, odměny, mazání a správa učitelů. Přístup hlídají role v DB + Row Level Security.

## 1) Spusť SQL Fáze 2
V Supabase **SQL Editor → New query** vlož obsah [`rpg-cloud-setup-phase2.sql`](./rpg-cloud-setup-phase2.sql) a **Run**.

> ⚠️ **Než spustíš:** v souboru nahoře je řádek `insert into public.roles … 'vojtech.konopa@husovaliberec.cz'`. Zkontroluj, že je tam **přesně ten školní e-mail, kterým se přihlašuješ přes Google**. Pokud máš jiný, uprav ho — jinak se k vlastní konzoli nedostaneš.

Skript vytvoří:
- tabulku **`roles`** (allowlist e-mailů → `teacher` / `superadmin`),
- funkci `my_role()` a politiky, které učiteli dovolí číst všechny postavy a superadminovi je i mazat/upravovat.

## 2) Hotovo
Po přihlášení na [`rpg-ucitel.html`](./rpg-ucitel.html) (nebo přes odkaz **🎓 učitelská konzole** na hubu, který se učitelům objeví sám) uvidíš:
- **Přehled žáků** — tabulka (jméno, hra, level, XP, % pokrok, poslední aktivita), filtr podle hry, hledání, **export CSV**.
- **Detail žáka** — atributy, splněné úkoly, artefakty; superadmin navíc přidá XP nebo postavu smaže.
- **Náhled her** — `?preview=1` (hraješ nanečisto) a `👁 Náhled` u žáka (`?su=…`, jen ke čtení).
- **Správa učitelů** (jen superadmin) — přidej kolegu školním e-mailem + roli; roli získá při prvním přihlášení.

## Role
| Role | Co může |
|---|---|
| **student** (výchozí) | hraje, vidí jen svou postavu |
| **teacher** | + přehled celé třídy, náhledy, export |
| **superadmin** (ty) | + mazání/úpravy postav, odměny, správa učitelů |

---

# Všechny fáze — pořadí spouštění

Postupem času přibyly další funkce, každá má svůj SQL soubor. **Stačí je spustit v číselném pořadí** (jeden po druhém v Supabase **SQL Editor → New query → Run**) — pořadí níže zaručuje, že každá fáze najde, na čem staví.

| # | Soubor | Spustit po | Co přidává |
|---|--------|-----------|-----------|
| 1 | [`rpg-cloud-setup.sql`](./rpg-cloud-setup.sql) | — | tabulka `saves` (postavy žáků) |
| 2 | [`rpg-cloud-setup-phase2.sql`](./rpg-cloud-setup-phase2.sql) | 1 | `roles` + `my_role()` — učitelská práva · ⚠️ **uprav svůj e-mail** (viz výše) |
| 3 | [`rpg-cloud-setup-phase3.sql`](./rpg-cloud-setup-phase3.sql) | 1, 2 | `classes`, `class_members`, `notes` (třídy + poznámky) |
| 4 | [`rpg-cloud-setup-phase4.sql`](./rpg-cloud-setup-phase4.sql) | 1–3 | `leaderboard()` — žebříček spolužáků |
| 5 | [`rpg-cloud-setup-phase5.sql`](./rpg-cloud-setup-phase5.sql) | 3 | ročníkové kohorty u tříd (`cohort_start_year`, `section`) |
| 6 | [`rpg-cloud-setup-phase6.sql`](./rpg-cloud-setup-phase6.sql) | 3 | `explanations` — „Vysvětli postup" |
| 6b | [`rpg-cloud-setup-phase6b.sql`](./rpg-cloud-setup-phase6b.sql) | 6 | `snap_events` — týdenní snímky chybovosti |
| 7 | [`rpg-cloud-setup-phase7.sql`](./rpg-cloud-setup-phase7.sql) | 2 | živý souboj (`battles`, `battle_players`, `battle_invites` + RPC) |
| 8 | [`rpg-cloud-setup-phase8.sql`](./rpg-cloud-setup-phase8.sql) | 3 | stav vzkazů (přečteno / smazáno žákem / hromadný `batch_id`) |
| 9 | [`rpg-cloud-setup-phase9.sql`](./rpg-cloud-setup-phase9.sql) | 7 (po všech RPC) | bezpečnostní utažení — odebere `anon` práva u RPC |
| 10 | [`rpg-cloud-setup-phase10.sql`](./rpg-cloud-setup-phase10.sql) | 9 | `feedback` — anonymní nápady hráčů |
| 11 | [`rpg-cloud-setup-phase11.sql`](./rpg-cloud-setup-phase11.sql) | 1–5 | Věž legend (`tower_runs`, `tower_hall` + RPC) |
| 12 | [`rpg-cloud-setup-phase12.sql`](./rpg-cloud-setup-phase12.sql) | 11, 2 | Věž legend — nástroje pro učitele (žebříček + mazání) |
| 13 | [`rpg-cloud-setup-phase13.sql`](./rpg-cloud-setup-phase13.sql) | 2, 7 | trvalá historie živých soubojů (`battle_results`) |
| 14 | [`rpg-cloud-setup-phase14.sql`](./rpg-cloud-setup-phase14.sql) | 7 | týmový režim a rychlá odveta živého souboje |
| 15 | [`rpg-cloud-setup-phase15.sql`](./rpg-cloud-setup-phase15.sql) | 1–3 | audit log akcí učitelů (záložka AKTIVITA) |
| 16 | [`rpg-cloud-setup-phase16.sql`](./rpg-cloud-setup-phase16.sql) | 3 | archiv tříd, které dohrály 2. stupeň |
| 17 | [`rpg-cloud-setup-phase17.sql`](./rpg-cloud-setup-phase17.sql) | 11 | věž zavřená o letních prázdninách (i na serveru) |
| 18 | [`rpg-cloud-setup-phase18.sql`](./rpg-cloud-setup-phase18.sql) | 11, 12, 17 | bezpečnostní úklid podle Supabase linteru |
| 19 | [`rpg-cloud-setup-phase19.sql`](./rpg-cloud-setup-phase19.sql) | 4, 11, 17 | hardening: bezpečný cast XP v žebříčku, strop patra věže |
| 20 | [`rpg-cloud-setup-phase20.sql`](./rpg-cloud-setup-phase20.sql) | 3 | úkoly s termínem (`assignments`, záložka ÚKOLY) |
| 21 | [`rpg-cloud-setup-phase21.sql`](./rpg-cloud-setup-phase21.sql) | 2, 3 | přijímačky: cloud pokroku + připravenost žáka |
| 22 | [`rpg-cloud-setup-phase22.sql`](./rpg-cloud-setup-phase22.sql) | 21 | přijímačky: diagnostika okruhů pro celou třídu |
| 23 | [`rpg-cloud-setup-phase23.sql`](./rpg-cloud-setup-phase23.sql) | 2, 7, 11, 12 | oprava: `my_role()` nesmí vracet NULL (jinak se otevřou učitelské brány) |
| 24 | [`rpg-cloud-setup-phase24.sql`](./rpg-cloud-setup-phase24.sql) | 20 | oprava: poškozený save žáka neshodí učiteli přehled úkolů |
| 25 | [`rpg-cloud-setup-phase25.sql`](./rpg-cloud-setup-phase25.sql) | 2, 23 | oprava: „permission denied for function my_role" |
| 26 | [`rpg-cloud-setup-phase26.sql`](./rpg-cloud-setup-phase26.sql) | 2, 23 | `staff_emails()` — „Skrýt učitele" funguje i běžnému učiteli |
| S | [`../rpg-cloud-setup-security.sql`](../rpg-cloud-setup-security.sql) | 1 | serverové stropy kreditů a XP (trigger na `saves`), v kořeni repa |

Číselné pořadí je vždy bezpečné (6b po 6, bezpečnostní trigger kdykoli po fázi 1). **Fázi 7 nenechávej bez fáze 9** — teprve devítka odebere novým funkcím právo pro `anon`.

## Spustit se to dá kdykoli znovu (idempotentní)

Všechny soubory jsou napsané tak, že **je můžeš spustit opakovaně bez chyby** — když si nejsi jistý, jestli některá fáze proběhla, prostě ji spusť znovu. Drží se vzorů:
- `create table / index if not exists`, `add column if not exists`
- `create or replace function`
- `drop policy if exists "…"` **před** každým `create policy` (RLS politiky)
- `insert … on conflict … do update` (seed e-mailu v fázi 2)

Žádné `drop table`, takže opakované spuštění **nikdy nesmaže data** žáků.

> **Aktuální stav (projekt `ovajoalbyofenjbbyhcy`):** všechny fáze 1–26 i bezpečnostní trigger jsou nasazené (ověřeno 23. 9. 2026). Znovu ověříš dotazem [`tools/sql-stav-nasazeni.sql`](../tools/sql-stav-nasazeni.sql) — jen čte a u opravených funkcí hledá otisk nové verze. Tabulka výše je referenční pro nový projekt.
