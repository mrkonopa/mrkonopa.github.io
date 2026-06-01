# RPG Matematika — nastavení cloudu (Fáze 1)

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

## Co bude ve Fázi 2
Učitelský přehled: pokrok celé třídy na jednom místě (role `teacher` + politika pro čtení všech řádků, dashboard s filtrem podle hry/žáka a exportem).
