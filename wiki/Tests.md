# Testy — testovací suite

Složka: `tests/`

Spuštění vyžaduje Node.js + Playwright (`npm install` v kořeni repo).

Chromium pro Playwright: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`

## Spuštění

```bash
# Jeden soubor
node tests/rpg-cloud.test.cjs

# Všechny pure-Node testy (rychle, bez browseru)
for f in tests/rpg-cohort tests/rpg-classes tests/rpg-wallet tests/rpg-snap; do
  node $f.test.cjs; done

# Playwright testy (pomalejší, spouští headless Chromium)
node tests/rpg-teacher.test.cjs
node tests/rpg-ach.test.cjs
node tests/rpg-tower-game.test.cjs

# Hloubkový harness (30 virtuálních žáků)
node tests/vstudents-deep.harness.cjs

# Stres harness (120 žáků)
node tests/vstudents-stress.harness.cjs
```

## Přehled souborů

| Soubor | Typ | Počet testů | Co testuje |
|--------|-----|-------------|-----------|
| `rpg-cloud.test.cjs` | Playwright | 24 | Auth, save/load, cloud sync (Fáze 1) |
| `rpg-teacher.test.cjs` | Playwright | 50 | Učitelská konzole, role, export CSV (Fáze 2) |
| `rpg-classes.test.cjs` | Node mock | 28 | Třídy, členství, poznámky (Fáze 3, cloud) |
| `rpg-classes-console.test.cjs` | Playwright | 11 | Záložka TŘÍDY v konzoli (Fáze 3, UI) |
| `rpg-leaderboard.test.cjs` | Node mock | 9 | Žebříček třídy (Fáze 4) |
| `rpg-cohort.test.cjs` | Node | 16 | Ročníkové kohorty, posun 1.9. (Fáze 5) |
| `rpg-learn.test.cjs` | Playwright | 56 | Teorie, 4 ročníky × 14 misí |
| `rpg-tasks-9.audit.cjs` | Node | 378 000 generací | Banka úloh 9. ročník — NaN/MC bezpečnost |
| `rpg-tasks-integration.test.cjs` | Playwright | 8 | Integrace bank úloh do hry |
| `rpg-diag-console.test.cjs` | Playwright | 9 | Heatmapa diagnostiky v konzoli |
| `rpg-ach.test.cjs` | Playwright | 11 | Odznaky + denní série (9. ročník) |
| `rpg-train.test.cjs` | Playwright | 12 | Trénink + mastery (9. ročník) |
| `rpg-train-6.test.cjs` / `7` / `8` | Playwright | 12 × 3 | Trénink v 6./7./8. ročníku |
| `rpg-recommend.test.cjs` | Playwright | 36 (9×4) | Doporučené procvičování, všechny ročníky |
| `rpg-explain.test.cjs` | Playwright | 10 | Pole „Jak jsi na to přišel?" + cloud save |
| `rpg-snap.test.cjs` | Playwright | 13 | Migrace errsSnap do SQL (Fáze 6b) |
| `rpg-wallet.test.cjs` | Node mock | 27 | Peněženka, anti-cheat, migrace |
| `rpg-shop-hostile.cjs` | Node | 60 žáků × 16 invariantů | Hostile shop stress test |
| `rpg-hack.test.cjs` | Playwright | 71 | XSS payload × 6 kontextů, wallet tamper |
| `rpg-tower.test.cjs` | Node mock | 24 | Věž legend — průběh hry, XP odměna |
| `rpg-tower-game.test.cjs` | Playwright | 108 (27×4) | Věž v prohlížeči, 4 ročníky |
| `rpg-tower-console.test.cjs` | Playwright | 12 | Záložka VĚŽ LEGEND v konzoli |
| `vstudents.harness.cjs` | Playwright | 30 žáků | Boje + teorie + trénink, hlídá JS chyby |
| `vstudents-deep.harness.cjs` | Playwright | —  | HP bar, srdíčka, nápovědy, reduced-motion |
| `vstudents-stress.harness.cjs` | Playwright | 120 žáků | Zátěžový test, 30/hra |
| `sprite-screenshots.cjs` | Playwright | vizuální | Screenshot sprite arény (tmavé palety) |

## Klíčová pravidla

### Mock Supabase klient
Playwright testy injectují mock přes `page.addInitScript()` — CDN je v sandbox prostředí blokované (403). Mock simuluje Auth, `from().upsert/select`, RPC volání.

```javascript
// Vzor v testech
await page.addInitScript(() => {
  window.__SUPABASE_MOCK__ = { /* ... */ };
});
```

### Mini-úkoly v testech
Před spuštěním boje v Playwright testech je nutné zakázat mini-úkoly (seřazování/matching), jinak harness odpoví špatně a hráč zemře:

```javascript
await page.evaluate(() => { window.RPGTaskTypes = null; });
```

### Audit bank úloh
`rpg-tasks-9.audit.cjs` generuje 378 000 úloh (18 000 per misi × 21 misí) a kontroluje:
- žádné `NaN`/`undefined` v odpovědích
- MC mise mají jen numerické nebo ANO/NE volby
- všechny 4 choices různé

Stejný audit běží i pro `rpg-tasks-6/7/8.js`.

### Harness po každé změně her
Po každém zásahu do sprite enginu nebo game logiky spusť:

```bash
node tests/vstudents-deep.harness.cjs
```

Harness prochází scénáře: vyhraný boj, prohraný boj, HP bar, srdíčka, nápovědy, reduced-motion, trénink, zpětná navigace. Opakující se chyby:
- `rm()` guard u přepínání snímků (hrdina/parťák/boss musí být `rm() ? 0 : tick % 2`)
- prázdné L2 hinty v generátorech úloh
- nedefinované znaky palety → magenta `#f0f` pixely
