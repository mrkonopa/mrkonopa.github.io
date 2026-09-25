# Přidávání obsahu

Nejspolehlivější vzor je vždy sousední mise v tomtéž souboru, tady je jen mapa. Tvar dat
níže je ověřený proti skutečným souborům (září 2026).

## Úlohy do mise — `projects/rpg-tasks-N.js`

`window.RPG_TASK_EXTRA_N = { '<mise>': () => [úloha, …] }`, úloha je
`{ text, ans, hints: [L1, L2, L3], skill }`. Engine ji zamíchá se základními úlohami mise, takže
každé hraní dostane jiné příklady. U mise s volbami (`mc:true`) smí být odpověď jen číslo nebo ANO/NE.
V zadání desetinná čárka, u diskrétních jednotek zaokrouhlení nahoru, nápovědy tři a žádná prázdná.

## Teorie — `projects/rpg-learn-N.js`

`window.RPG_LEARN_N['<mise>'] = { intro, sections: [{ h, p }], formulas: ['…'], examples: [{ q, s: ['krok', …] }], mistakes, video }`

- **Video:** `video: { id: '<11 znaků YouTube ID>', title: '…' }` nebo `video: null`. 2. stupeň čte
  jen `id`, adresu `url:` umí jen 1. stupeň. 2. stupeň bere videa z kanálu `@matematikajednoduse`,
  1. stupeň z Matýskovy matematiky (mapování: `tools/videa-mapovani.html`).
- **Obrázky v 1. stupni** dodává `projects/rpg-learn-svg.js` (`RPGDia.*`), ne vložené SVG.
- **Escapování se liší podle stupně.** V 1. stupni jde `sections[].p` surově (znak „menší než"
  piš jako `&lt;`) a `formulas` s `examples` projdou escapováním (tam patří holé `<`).
  2. stupeň vykresluje surově i kroky příkladů.

Že každé video pořád existuje, ověřuje každou středu `.github/workflows/videa.yml`.

## Živý souboj — `projects/rpg-battle-N.js`

Otázka `{ text, choices, correct }`, generuje se ze seedu (všichni hráči vidí totéž).
Volby se zaokrouhlují stejně jako odpověď, test je dopočítává (`tests/rpg-battle-questions.test.cjs`).

## Po každé změně

```bash
node tests/run-ci.cjs --only=node       # obsahové audity, skloňování, dopočty
node tests/vstudents-deep.harness.cjs   # virtuální žáci projdou hry
```
