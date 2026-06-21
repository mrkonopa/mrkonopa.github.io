# Přidávání obsahu

## Nové úlohy do existující mise

### Rozšiřující banka (`rpg-tasks-X.js`)

Soubory: `projects/rpg-tasks-6/7/8/9.js`

Každý soubor nastaví `window.RPG_TASK_EXTRA_X = { '<mid>': () => [...] }`.

```javascript
window.RPG_TASK_EXTRA_9['5-2'] = () => [
  {
    txt: 'Vypočítej obvod čtverce se stranou 7 cm.',
    ans: '28',
    hints: [
      'Čtverec má 4 stejné strany.',
      'Obvod = 4 × strana',
      'Výsledek: 28 cm'
    ]
  },
  // ...dalsi ulohy
];
```

**Pravidla:**
- `txt` — zadání (HTML povoleno pro `<b>`, `<i>`, zlomky)
- `ans` — správná odpověď jako string (přesná shoda po `.trim()`)
- `hints[0]` — L1 nasměrování, `hints[1]` — L2 vzorec, `hints[2]` — L3 výsledek
- Žádný hint nesmí být prázdný string
- Engine sloučí základní pool mise + banku a náhodně vybere `m.tc` úloh

**MC mise** (`mc:true`): `1-1, 2-1, 3-1, 4-1, 5-1, 6-1, 7-1` — smí mít jen numerické odpovědi nebo ANO/NE. Bez textu v odpovědích, jinak se rozbije generátor distraktorů.

Po přidání spusť audit:
```bash
node tests/rpg-tasks-9.audit.cjs
```

### Základní pool mise (přímo v HTML)

V příslušné `rpg-mat-X.html` najdi pole `AREAS` a misi podle `id`:

```javascript
{ id: '5-2', name: '...', mc: false, tc: 6,
  tasks: () => [
    { txt: '...', ans: '28', hints: ['...','...','...'] },
    // ...
  ]
}
```

Přidej úlohy do `tasks()`. Nezapomeň aktualizovat `tc` (počet úkolů = kolik se losuje).

---

## Nová teorie (`rpg-learn-X.js`)

Soubory: `projects/rpg-learn-6/7/8/9.js`

```javascript
window.RPG_LEARN_9['5-2'] = {
  intro: 'Obvod je součet délek všech stran.',
  sections: [
    { title: 'Čtverec', body: 'Obvod = 4 × a' },
    { title: 'Obdélník', body: 'Obvod = 2 × (a + b)' }
  ],
  formulas: [
    { label: 'Čtverec', formula: 'o = 4a' },
    { label: 'Obdélník', formula: 'o = 2(a + b)' }
  ],
  examples: [
    { problem: 'Čtverec a = 5 cm → o = ?', solution: 'o = 4 × 5 = 20 cm' }
  ],
  video: 'https://youtu.be/...'   // nebo null
};
```

**Pole `video`:** videa z kanálu `@matematikajednoduse` (Lucie Straková). Pokud kanál nemá ekvivalentní video, použij `null`.

**Font:** sekce `s-learn` používá `--read` (Lexend) pro čitelnost — nadpisy/vzorce jsou pixelové, tělo textu je čitelné.

---

## Nové otázky do živého souboje (`rpg-battle-X.js`)

Soubory: `projects/rpg-battle-6/7/8/9.js`

```javascript
window.RPG_BATTLE_9 = {
  build: function(seed, count) {
    // deterministický generátor — seed zajistí stejné otázky pro všechny hráče
    const rng = seededRng(seed);  // interní helper
    const pool = [
      {
        text: 'Kolik je 15 % z 200?',
        choices: ['30', '40', '20', '50'],
        correct: 0  // index správné odpovědi (0-3)
      },
      // ...
    ];
    return shuffle(pool, rng).slice(0, count);
  }
};
```

**Pravidla:**
- Všechny 4 `choices` musí být různé
- `correct` je index správné odpovědi v `choices`
- `text` — otázka (krátce, vejde se na obrazovku telefonu)
- `build(seed, count)` musí být deterministická — stejný seed = stejné otázky pro všechny hráče ve stejnou dobu

---

## Nová hra (nový ročník)

Každá hra je single-file HTML v `projects/rpg-mat-X.html`. Nový ročník vyžaduje:

1. **Zkopírovat** nejbližší existující hru jako základ
2. **Nahradit `AREAS`** — 7 oblastí × 3 mise, každá mise 6 úkolů
3. **Vytvořit** `rpg-tasks-X.js`, `rpg-learn-X.js`, `rpg-battle-X.js`
4. **Nastavit téma** — název, emoji, CSS barvy, sprite palety
5. **Přidat** do `projects/rpg-matematika.html` (HUB)
6. **SQL:** není potřeba, tabulka `saves` je generická (game = `RPG_MAT_X`)

---

## Nová mise v existující oblasti

V `AREAS[oblast-1].missions` přidej misi:

```javascript
{
  id: '3-4',          // "oblast-misi" — NOVÉ id (dosud 3-1, 3-2, 3-3)
  name: 'Název mise',
  mon: '🧮',
  mname: 'Jméno bosse',
  mc: false,          // true = jen MC (numerické/ANO-NE odpovědi!)
  tc: 6,              // počet úkolů
  tasks: () => [...]  // generátor
}
```

**Pozor:** `id` musí být unikátní napříč celou hrou. Mastery, `S.done`, `S.errs` vše indexují přes tento string.

---

## Přidání videa k teorii

1. Najdi video na kanálu `@matematikajednoduse` (YouTube)
2. V `rpg-learn-X.js` nastav `video: 'https://youtu.be/ID'`
3. Systém ho zobrazí jako embed v sekci teorie

Pokud video pro dané téma neexistuje: `video: null` — tlačítko se nezobrazí.

---

## Checklist po přidání obsahu

```bash
# 1. Audit bank úloh (NaN, MC bezpečnost)
node tests/rpg-tasks-9.audit.cjs

# 2. Hloubkový harness (sprite engine, HP, nápovědy)
node tests/vstudents-deep.harness.cjs

# 3. Teorie test
node tests/rpg-learn.test.cjs

# 4. Prázdné hinty
grep -c ',`\`\`\]' projects/rpg-mat-9.html   # musí být 0
```
