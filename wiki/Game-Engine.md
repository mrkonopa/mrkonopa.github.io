# Game Engine — architektura RPG her

## Save formát

Klíč v localStorage: `RPG_MAT_6`, `RPG_MAT_7`, `RPG_MAT_8`, `RPG_MAT_9`

```javascript
S = {
  name: "Jméno žáka",
  xp: 1250,
  level: 13,          // Math.floor(xp/100) + 1
  attrs: { calc: 45, geo: 30, anal: 25, craft: 10 },
  done: {             // které úkoly jsou splněny
    "1-1-0": true,    // oblast-mise-index
    "1-1-1": true,
    ...
  },
  xpClaimed: {},      // zabrání dvojímu XP za stejný úkol
  creditsClaimed: {},  // zabrání dvojímu bonusu za splnění mise
  inv: ["acckey", "core"],  // artefakty (id oblastí)
  mastery: {
    "1-1": { score: 18, mastered: true },  // 15+ = mistrovství
    ...
  },
  errs: { "1-1": 3, "2-2": 1 },  // počty chyb per mise
  errsSnap: [         // týdenní snímky pro trend (max 12)
    { t: "2025-09-15", errs: {...}, xp: 800 },
    ...
  ],
  ach: {              // odemčené odznaky
    "boot": "2025-09-01",
    "area1": "2025-09-05",
    ...
  },
  stats: { crits: 12, trainCorrect: 67, bestCombo: 8 },
  streak: { count: 5, last: "2025-11-20" },
  settings: { reducedMotion: false },
  teacherUnlocked: ["3-2"],  // mise odemčené učitelem
  tower: { best: 14 },       // nejlepší patro věže (lokální rekord)
  snapsMigrated: true,       // errsSnap přemigrován do SQL
  migrated: [],              // pro peněženku (viz rpg-wallet.js)
  v: 1
}
```

## Oblast a mise

Každá hra má 7 oblastí (`AREAS`), každá oblast 3 mise. Každá mise má:

```javascript
{
  id: '1-1',          // "oblast-mise"
  name: 'Název mise',
  mon: '🤖',          // boss emoji
  mname: 'Jméno bosse',
  mc: true,           // jen MC odpovědi (true/false)
  tc: 6,              // počet úkolů
  tasks: () => [ ... ]  // generátor úloh (randomizovaný)
}
```

**Pravidlo MC misí:** `mc:true` smí mít jen numerické nebo ANO/NE odpovědi — jinak se rozbije generátor distraktorů.

## Bodový systém

| Akce | XP | Kredity |
|------|-----|---------|
| Správná odpověď (poprvé) | 3–10 XP | 5 kr |
| Správná odpověď (crit, <5s zbývá) | 2× XP | 7 kr |
| Splnění mise (jednou) | — | 15 kr |
| Trénink — správně | — | 1–2 kr |
| Mastery (15 správně) | — | 30 kr |
| Denní série | — | 5–20 kr |

**Level:** `Math.floor(xp / 100) + 1`

## Odznaky (ACH)

15 achievementů v poli `ACH`:

| ID | Popis | Podmínka |
|----|-------|----------|
| `boot` | První krok | první splněný úkol |
| `crit` | Rychlostřelec | 10 kritických zásahů |
| `combo5` | Kombo | combo ≥ 5 |
| `flawless` | Bezchybná mise | mise bez nápověd |
| `flash` | Bleskový | odpověď s ≥30s zbývajícími |
| `survivor` | Přeživší | vítězství s 1 HP |
| `area1` | Insider | splnění 1. oblasti |
| `half` | Napůl cesty | splnění 4 oblastí |
| `root` | Root přístup | splnění všech 7 oblastí |
| `lv5` | Level 5 | dosažení levelu 5 |
| `lv10` | Level 10 | dosažení levelu 10 |
| `master1` | Mistr | mistrovství v 1 misi |
| `train50` | Trénér | 50 správných v tréninku |
| `streak3` | Pravidelnost | 3 dny v řadě |
| `streak7` | Závislák | 7 dní v řadě |

Funkce `evalAch(ev)` se volá po každé správné odpovědi, po splnění mise, po startu hry a po skončení živého souboje.

## Peněženka (RPGWallet)

Soubor: `projects/rpg-wallet.js`, localStorage klíč: `RPG_HUB_WALLET`

Globální přes všechny hry a HUB. Obsahuje:
- `credits` — univerzální měna
- `cosmetics.owned[]` — vlastněné kosmetické předměty
- `cosmetics.active{}` — aktivní border/badge/theme/victory
- `settings.reducedMotion` — globální VFX přepínač

**Cloud sync:** sloučení přes `mergeRemote()` — vždy bere `max(credits)`, sjednocuje kosmetiku.

## Rozšiřující banky úloh

Soubory: `projects/rpg-tasks-6/7/8/9.js`

Nastaví `window.RPG_TASK_EXTRA_X = { '<mid>': () => [...] }`. Engine v `launchBattle` sloučí základní pool s bankou a náhodně vybere `tc` úloh → každé hraní dá jiné příklady.

## Mini-úkoly

S 34% pravděpodobností před non-MC úkolem se vloží mini-hra:
- **Seřazování** — přetáhni do správného pořadí
- **Matching** — spoj dvojice

Funkce: `miniForIdx()`, `renderBattleMini()`. Definovány v `RPGTaskTypes` (externí modul).

## VFX přepínač (Reduced Motion)

`S.settings.reducedMotion` → CSS třída `reduced-motion` na `<html>`. Skrývá animace: `.float-txt`, `#hit-vignette`, `.victory-banner`, `.gold-drop`, `.particle`, `.hit-flash`.

Nastavení v profilu žáka (`#pr-rm` checkbox).
