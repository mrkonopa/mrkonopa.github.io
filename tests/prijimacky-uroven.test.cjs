/* prijimacky-uroven.test.cjs — úrovně úloh a body okruhů (čistý Node).
   Diagnostika dává na téma dvě úlohy: první z úrovně testu, druhou podle
   výsledku z testu, nebo ze základu. Když by `practiceItem(okruh, uroven)`
   vrátil úlohu z jiné úrovně, diagnostika by tiše měřila něco jiného, než
   tvrdí. Plán „kde získáš nejvíc bodů" zase stojí na `bodyVTestu()`: součet
   přes okruhy MUSÍ dát plný počet bodů testu — kdyby nějaká úloha okruh
   neměla, její body by z plánu tiše zmizely. */
const path = require('path');
const ROOT = path.join(__dirname, '..');           // NIKDY natvrdo /home/user — CI má jinou cestu

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
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };
console.log('── Přijímačky: úrovně úloh a body okruhů ──');

// 1) úroveň drží: 40 losů na okruh a úroveň, žádná prázdná, žádná z cizí úrovně
const N = 40;
let videno = 0, prazdne = 0, cizi = [];
for (const o of T.list) for (const u of ['zaklad', 'test']) for (let i = 0; i < N; i++) {
  const it = T.item(o.id, u); videno++;
  if (!it || !it.prompt) { prazdne++; continue; }
  if (it.uroven !== u && cizi.length < 3) cizi.push(o.id + '/' + u + '→' + it.uroven);
}
ok(videno === T.list.length * 2 * N, 'vylosováno ' + videno + ' úloh (' + T.list.length + ' okruhů × 2 úrovně × ' + N + ')');
ok(prazdne === 0, 'žádná prázdná úloha (' + prazdne + ')');
ok(cizi.length === 0, 'každá úloha je z požadované úrovně' + (cizi.length ? ' — ' + cizi.join(', ') : ''));

// 2) bez úrovně se míchají obě (dosavadní chování procvičování)
const mix = new Set();
for (let i = 0; i < 200; i++) { const it = T.item('geometrie'); if (it) mix.add(it.uroven); }
ok(mix.has('zaklad') && mix.has('test'), 'bez úrovně se losuje z obou zdrojů (' + [...mix].join(', ') + ')');

// 3) okruh bez zdroje dané úrovně nespadne — vezme se druhý
const zaloha = global.window.PZ_GEN.data;
global.window.PZ_GEN.data = [];
const nahr = T.item('data', 'zaklad');
global.window.PZ_GEN.data = zaloha;
ok(nahr && nahr.prompt && nahr.uroven === 'test', 'okruh bez základu dá úlohu z testu místo prázdna');

// 4) body okruhů: součet = plný počet bodů testu, geometrie nese nejvíc
const b = T.bodyVTestu();
const soucet = Object.values(b).reduce((s, v) => s + v, 0);
ok(Math.abs(soucet - C.maxScore) < 1e-9, 'součet bodů přes okruhy = ' + C.maxScore + ' (' + soucet.toFixed(6) + ')');
ok(T.list.every(o => typeof b[o.id] === 'number'), 'každý okruh má svou hodnotu');
const poradi = Object.entries(b).sort((x, y) => y[1] - x[1]);
// práh 1,3×: váhy se losují. Od konstrukcí v úlohách 9 a 10 (5 b. mimo okruhy) je naměřené
// minimum na 300 bězích 1,51× (dřív 2,06×, kdy se úlohy 9 a 10 počítaly geometrii); práh 1,5×
// by tedy občas spadl nad správným kódem
ok(poradi[0][0] === 'geometrie' && poradi[0][1] > 1.3 * poradi[1][1], 'geometrie nese nejvíc (' + poradi.slice(0, 3).map(([k, v]) => k + ' ' + v.toFixed(1)).join(', ') + ')');
ok(T.bodyVTestu() === b, 'výsledek se počítá jen jednou za načtení');
// úlohy 9 a 10 jsou v testu nanečisto konstrukce: jejich body nesmí zvednout geometrii
ok(Math.abs(b.konstrukce - 5) < 1e-9 && T.konstrukcePozice.join() === '8,9', 'konstrukce (úlohy 9 a 10) nesou 5 b. mimo okruhy (' + b.konstrukce + ')');
ok(T.topicsForTask({ no: 9, okruh: 'konstrukce' }).length === 0, 'úloha s okruhem „konstrukce" nepatří žádnému okruhu procvičování');

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
