/* prijimacky-dosazitelnost.test.cjs — každá varianta banky testu nanečisto jde i procvičit (čistý Node).

   PROČ. Test nanečisto bere úlohy z banky `rpg-cermat-9.js`, procvičování a diagnostika (úroveň „test“)
   z téže banky, jenže přes MAPOVÁNÍ okruh → pozice (`TOPICS[].slots`). Varianta, která leží na pozici
   mimo `slots` svého okruhu, se v testu objeví, ale procvičit ani změřit v diagnostice nejde — a
   žádný test to neviděl, protože dívat se na úlohu z banky a na výběr z `practiceItem` je dvojí práce.
   Naměřeno 17. 10. 2026: 12 z 90 variant (13 %) bylo NEDOSAŽITELNÝCH, mezi nimi všechny tři úlohy
   o osové souměrnosti na pozici 11, kruhový diagram, mapa i mnohoúhelník.

   Test proto projde SKUTEČNOU banku (všechny pozice mimo konstrukce, které nahrazuje kreslení), z každé
   varianty (podle `title`) zjistí okruh, který jí přisuzuje `topicsForTask`, a ověří dvakrát:
     (1) staticky — pozice varianty je v `slots` nebo `navic` jejího okruhu,
     (2) dynamicky — `practiceItem(okruh, 'test')` tu variantu skutečně vydá (položka nese `title`).
   Seznam variant se nepíše ručně: nová varianta v bance je automaticky pod dohledem.

   Spusť: node tests/prijimacky-dosazitelnost.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const ROOT = path.join(__dirname, '..');            // NIKDY natvrdo /home/user — CI má jinou cestu

global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => n === 1 ? o : (n >= 2 && n <= 4 ? f : m);
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar', 'svgCuboid']
  .forEach(f => global[f] = () => '<svg></svg>');
global.window = {};
require(path.join(ROOT, 'projects/rpg-cermat-9.js'));
require(path.join(ROOT, 'projects/prijimacky-matematika/prijimacky-gen.js'));
require(path.join(ROOT, 'projects/prijimacky-matematika/prijimacky-topics.js'));
const T = global.window.PZ_TOPICS, C = global.window.RPG_CERMAT_9;

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const VZORKU = 1500;       // losů na pozici při sběru variant (nejřidší varianta má podíl ≥ 4 %, zbytek ≥ 8 %)
const POKUSU = 6000;       // losů procvičování na variantu (nejřidší cesta ≥ 0,5 % ⇒ minutí ≈ 10⁻¹³)

/* Všechny varianty banky: { pozice (0-indexovaná), title, okruhy } — okruh úlohy, ne pozice. */
function sebratVarianty() {
  const out = new Map();
  for (let idx = 0; idx < 16; idx++) {
    if (T.konstrukcePozice.indexOf(idx) !== -1) continue;       // úlohy 9 a 10 v testu kreslí konstrukce
    for (let i = 0; i < VZORKU; i++) {
      const t = C.genSlot(idx);
      const k = idx + '|' + (t.title || '?');
      if (!out.has(k)) out.set(k, { pozice: idx, title: t.title || '?', okruhy: new Set() });
      for (const id of T.topicsForTask(t)) out.get(k).okruhy.add(id);
    }
  }
  return [...out.values()];
}

function nedosazitelne(varianty) {
  const spatne = [];
  for (const v of varianty) {
    // (1) staticky: pozice je v seznamu některého z okruhů, které varianta nese
    const kde = [...v.okruhy].filter(id => {
      const o = T.list.find(x => x.id === id);
      return o && (o.slots.indexOf(v.pozice) !== -1 || (o.navic || []).indexOf(v.pozice) !== -1);
    });
    if (!kde.length) { spatne.push((v.pozice + 1) + '. ' + v.title + ' (okruh ' + [...v.okruhy].join('/') + ', staticky)'); continue; }
    // (2) dynamicky: procvičování ji skutečně vydá
    let videno = false;
    for (const id of kde) {
      for (let i = 0; i < POKUSU && !videno; i++) { const it = T.item(id, 'test'); if (it && it.title === v.title) videno = true; }
      if (videno) break;
    }
    if (!videno) spatne.push((v.pozice + 1) + '. ' + v.title + ' (okruh ' + kde.join('/') + ', procvičování ji nevydalo za ' + POKUSU + ' losů)');
  }
  return spatne;
}

console.log('\n── Přijímačky: každá varianta banky jde procvičit ──\n');
const varianty = sebratVarianty();
ok(varianty.length >= 80, 'banka má ' + varianty.length + ' variant mimo konstrukce (podlaha 80; nic nevidět by znamenalo slepý test)');
ok(varianty.every(v => v.okruhy.size >= 1), 'každá varianta nese aspoň jeden okruh');
ok(varianty.some(v => v.title === 'Osová souměrnost útvarů') && varianty.some(v => v.title === 'Útvary ve čtvercové síti'),
  'obě úlohy o osové souměrnosti jsou v bance (jinak by se hlídaly planě)');
const spatne = nedosazitelne(varianty);
ok(!spatne.length, 'každou variantu procvičování i diagnostika (úroveň test) vydají', spatne.join(' | '));

/* Sabotáže: test musí chytit (a) okruh bez `navic` (b) smazané `navic` všude — ověřujeme na živém objektu, obnova vždy. */
function sabotaz(jmeno, fce, ocekavane) {
  const zaloha = T.list.map(o => o.navic);
  let n;
  try { fce(); n = nedosazitelne(varianty); }
  finally { T.list.forEach((o, i) => { if (zaloha[i] === undefined) delete o.navic; else o.navic = zaloha[i]; }); }
  ok(ocekavane.every(e => n.some(x => x.includes(e))), 'sabotáž: ' + jmeno + ' je chycena (' + n.length + ' nálezů)', 'chybí: ' + ocekavane.filter(e => !n.some(x => x.includes(e))).join(', '));
}
sabotaz('geometrie bez navic', () => { T.list.find(o => o.id === 'geometrie').navic = []; },
  ['Osová souměrnost útvarů', 'Pravidelný mnohoúhelník', 'Obdélník ze dvou čtverců']);
sabotaz('žádný okruh nemá navic', () => T.list.forEach(o => { o.navic = []; }),
  ['Osová souměrnost útvarů', 'Turistická mapa', 'Kruhový diagram zahrady', 'Ze které rovnice', 'Roboti a míčky']);
// po sabotážích je stav zase v pořádku (nic se nezapomnělo vrátit)
ok(nedosazitelne(varianty).length === 0, 'po sabotážích je vše zase dosažitelné');

console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
