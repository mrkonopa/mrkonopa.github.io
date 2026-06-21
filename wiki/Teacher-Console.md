# Učitelská konzole

Soubor: `projects/rpg-ucitel.html`

## Role systém

| Role | Kdo | Co smí |
|------|-----|--------|
| `student` | všichni přihlášení žáci | hrát, ukládat, číst vlastní data |
| `teacher` | učitelé (allowlist v `roles`) | číst vše, náhledy postav, export CSV, diagnostika |
| `superadmin` | Vojta | vše výše + mazání/úpravy postav, odměny, správa učitelů |

Přidání učitele: v konzoli záložka **UČITELÉ** → zadej e-mail, klikni Přidat.

## Záložky konzole

### PŘEHLED
- Tabulka všech žáků s filtrem (ročník, třída, hledání)
- Online indikátor: 🟢 aktivní <3 min, 🟡 aktivní <20 min
- Auto-refresh každých 60 s
- Export CSV

### DETAIL ŽÁKA (klik na řádek)
- Level, XP, splněné úkoly, artefakty, atributy
- Mastery přehled (21 misí s ukazatelem)
- Odemykání misí (`teacherUnlocked`)
- Odměny (superadmin):
  - **⭐ Přidat XP** — zadej ±číslo, level se dopočítá
  - **💰 Přidat kredity** — upraví peněženku žáka (musí mít alespoň 1 přihlášení)
- Poznámky — vzkaz žákovi (vidí ve hře jako widget „📨 Vzkazy")
- Náhledy: 👁 Otevřít postavu žáka / 🎬 Hra nanečisto

### TŘÍDY
- Vytváření tříd s označením (např. „9.A") a rokem kohorty
- Roční posun: třída se po 1. září automaticky posune (6→7→8→9)
- Přiřazení žáků (klidně napříč ročníky)
- Hromadné poznámky celé třídě
- Hromadné akce třídy: +XP / odemčení misí

### DIAGNOSTIKA
- Heatmapa chybovosti (21 misí × žáci)
- Filtr dle třídy
- Trend: 🔺 zhoršení / 🔽 zlepšení (delta posledních 2 snímků)
- Barvy: zelená (⌀0 chyb) → červená (⌀4+ chyb)

### VĚŽ LEGEND
- Žebříček sezóny (kdo je nejvýš)
- Síň slávy (natrvalo)
- Tlačítko „Uzavřít sezónu" — uloží top 10 do síně slávy

### SOUBOJE
- Historie live soubojů (datum, skóre, výsledek)
- Podium nejaktivnějších hráčů (🥇🥈🥉)

### VYSVĚTLENÍ
- Žáci po správné odpovědi mohou popsat postup
- Uloženo do `explanations`, učitel čte zde

### ZPĚTNÁ VAZBA
- Žáci mohou hlásit chyby v úlohách
- Učitel vidí, schvaluje/maže

## Hromadné akce (superadmin)

V záložce PŘEHLED: zaškrtnout více žáků →
- **Bulk +XP** — přidat XP vybraným
- **Bulk unlock** — odemknout konkrétní misi vybraným
- **Bulk smazat** — smazat vybrané postavy (nevratné!)

Křížová ochrana: `bulkUnlock` kontroluje, zda jde mise o ročník kohorty třídy.

## Náhledový režim her

- `?su=<user_id>` — načte postavu žáka, read-only banner, nic se neukládá
- `?preview=1` — hra nanečisto, sandbox localStorage

## Online přítomnost

Heartbeat každých 120 s aktualizuje `updated_at` v `saves`. Konzole zobrazuje:
- 🟢 `updated_at` < 3 minuty
- 🟡 `updated_at` < 20 minut
- (prázdné) jinak
