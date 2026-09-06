/* prijimacky-postupy.test.cjs — kvalita POSTUPŮ v testu nanečisto i v procvičování.
   Čistý Node (bez Playwrightu), auto-discovery v tests/run-ci.cjs.

   Zdroje úloh jsou DVA a slévají se do jednoho poolu (prijimacky-topics.js):
     • rpg-cermat-9.js          → test nanečisto I procvičování
     • prijimacky-gen.js        → jen procvičování
   Oba se tady kontrolují, jinak by platilo „auditovala se jen devítka".

   Nejsilnější pravidlo je DOPOČET: poslední krok se vyhodnotí jako aritmetika
   a musí dát ans. Kontrola „postup obsahuje totéž číslo jako ans" by prošla
   i tam, kde je špatně obojí naráz — proto se počítá, ne porovnává. */

const path = require('path');
const ROOT = path.join(__dirname, '..');           // NIKDY natvrdo /home/user — CI má jinou cestu

// ── stuby, které si moduly berou z window/global (stejně jako prijimacky-cermat-audit) ──
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => n === 1 ? o : (n >= 2 && n <= 4 ? f : m);
let svgVolani = 0;
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar', 'svgCuboid']
  .forEach(f => global[f] = () => { svgVolani++; return '<svg></svg>'; });
global.window = {};
require(path.join(ROOT, 'projects/rpg-cermat-9.js'));
require(path.join(ROOT, 'projects/prijimacky-matematika/prijimacky-gen.js'));
const C = global.window.RPG_CERMAT_9;
const GEN = global.window.PZ_GEN;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

// ── solSteps: DOSLOVNÁ kopie pravidla z prijimacky-core.js ──
// (modul je browser IIFE bez exportu; shodu hlídá kontrola na konci souboru)
const solSteps = sol => {
  if (Array.isArray(sol)) return sol.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim());
  if (typeof sol !== 'string' || !sol.trim()) return [];
  return sol.split(/(?<=\.)\s+(?=[A-ZÁ-Ž])/).map(x => x.trim()).filter(Boolean);
};

/* ════════ SBĚR ÚLOH ════════
   Každá „položka" = jedno zadání s vlastní odpovědí a vlastním postupem. */
const polozky = [];   // {zdroj, kde, prompt, ans, sol, maSvg}
const RUNS = 260, PER = 130;

for (let r = 0; r < RUNS; r++) for (const t of C.generate()) {
  const maSvg = !!t.svg;
  if (t.kind === 'tfgrid') (t.statements || []).forEach((s, i) =>
    polozky.push({ zdroj: 'cermat', kde: 't' + t.no + '.' + (i + 1) + ' tfgrid', prompt: s.text, ans: s.ans, sol: s.sol, maSvg }));
  else if (t.kind === 'mc')
    polozky.push({ zdroj: 'cermat', kde: 't' + t.no + ' mc', prompt: t.prompt, ans: t.ans, sol: t.sol, maSvg });
  else if (t.kind === 'match') (t.prompts || []).forEach((p, i) =>
    polozky.push({ zdroj: 'cermat', kde: 't' + t.no + '.' + (i + 1) + ' match', prompt: p, ans: t.ans[i], sol: (t.sol && t.sol[i]) || '', maSvg }));
  else (t.parts || []).forEach(p =>
    polozky.push({ zdroj: 'cermat', kde: 't' + t.no + (p.key || '') + ' open', prompt: p.prompt, ans: p.ans, sol: p.sol, maSvg }));
}
for (const [okruh, fns] of Object.entries(GEN)) for (const fn of fns) for (let i = 0; i < PER; i++) {
  let t; try { t = fn(); } catch (e) { continue; }
  if (t) polozky.push({ zdroj: 'gen', kde: okruh + '/' + fn.name, prompt: t.prompt, ans: t.ans, sol: t.sol, maSvg: !!t.svg });
}

console.log('── Přijímačky: postupy ──');

/* ════════ 1) POKRYTÍ — audit musí vidět, co tvrdí, že vidí ════════
   Naměřeno: 4160 úloh z cermatu + 10 140 z gen. Podlaha s rezervou; rozbité
   načtení banky (tichý catch) by dalo 0 a test spadne nahlas s uvedením zdroje. */
const zCermat = polozky.filter(p => p.zdroj === 'cermat').length;
const zGen = polozky.filter(p => p.zdroj === 'gen').length;
ok(zCermat >= 3800, 'test nanečisto: zkontrolováno ' + zCermat + ' zadání (podlaha 3800)');
ok(zGen >= 9000, 'procvičování: zkontrolováno ' + zGen + ' zadání (podlaha 9000)');
ok(svgVolani > 0, 'nákresy se skutečně volaly (' + svgVolani + '×)');

/* ════════ 2) KAŽDÉ ZADÁNÍ MÁ POSTUP ════════ */
const bezPostupu = polozky.filter(p => solSteps(p.sol).length === 0);
ok(bezPostupu.length === 0, 'každé zadání má postup' +
  (bezPostupu.length ? ' — chybí u ' + bezPostupu.length + ', např. ' + bezPostupu[0].kde : ''));

/* ════════ 3) ŽÁDNÉ ARTEFAKTY ════════ */
const SPATNE = /undefined|NaN|\[object Object\]/;
const artefakt = polozky.filter(p => solSteps(p.sol).some(k => SPATNE.test(k)));
ok(artefakt.length === 0, 'žádné undefined / NaN / [object Object] v krocích' +
  (artefakt.length ? ' — ' + artefakt.length + '×, např. ' + artefakt[0].kde : ''));

/* ════════ 4) DESETINNÁ ČÁRKA ════════
   Pozor: „16.1" je ODKAZ na jinou úlohu, ne desetinné číslo — a czNum by ho
   rozbil na „16,1". Odkazy se proto odečítají, jinak by pravidlo křičelo vlka. */
const bezOdkazu = s => s.replace(/(^|[\s(])\d{1,2}\.\d(?=[\s:)]|$)/g, '$1X');
const tecka = polozky.filter(p => solSteps(p.sol).some(k => /\d\.\d/.test(bezOdkazu(k))));
ok(tecka.length === 0, 'v krocích je desetinná čárka, ne tečka' +
  (tecka.length ? ' — ' + tecka.length + '×, např. ' + tecka[0].kde + ': ' + solSteps(tecka[0].sol).find(k => /\d\.\d/.test(bezOdkazu(k))) : ''));

/* ════════ 5) DOPOČET POSLEDNÍHO KROKU ════════
   ÚZKÁ varianta (ověřená v tomto repu): popisek smí být jen před PRVNÍM '=',
   za ním čistá aritmetika. Volná varianta dává plané poplachy, protože kroky
   běžně popisují MEZIkrok. Kdo tohle rozvolní, dostane test, co křičí vlka. */
const ARIT = /^[0-9+\-−·×*:/().,\s²³]+$/;
function vyhodnot(vyraz) {
  let e = vyraz.replace(/−/g, '-').replace(/[·×]/g, '*').replace(/\s+/g, '')
    .replace(/(\d),(\d)/g, '$1.$2').replace(/:/g, '/')
    .replace(/(\d+)²/g, '($1**2)').replace(/(\d+)³/g, '($1**3)');
  if (!/^[0-9+\-*/().**]+$/.test(e)) return null;
  try { const v = Function('"use strict";return (' + e + ')')(); return Number.isFinite(v) ? v : null; }
  catch (err) { return null; }
}
let dopocteno = 0, nesedi = [];
for (const p of polozky) {
  const kroky = solSteps(p.sol); if (!kroky.length) continue;
  const posl = kroky[kroky.length - 1];
  const i = posl.indexOf('=');           // popisek jen PŘED prvním '='
  if (i < 0) continue;
  // PROCENTA přeskoč: „25 : 100 = 25/100 = 25 %“ není dělení na desetinné číslo,
  // ale ZLOMEK přepsaný na procenta — matematicky totéž, aritmeticky ne (0,25 ≠ 25).
  // Bez téhle výjimky pravidlo hlásilo 68 planých poplachů nad správnou úlohou.
  if (/%/.test(posl)) continue;
  const zbytek = posl.slice(i + 1).replace(/\.$/, '').trim();
  const casti = zbytek.split('=').map(x => x.trim()).filter(Boolean);
  if (!casti.length) continue;
  // PRVNÍ výsledek za levou stranou, ne poslední: řetěz '9 · 200 = 1800 cm = 18 m'
  // pokračuje PŘEVODEM JEDNOTEK, takže poslední člen se s levou stranou rovnat nemá.
  if (casti.length < 2) continue;
  const m = casti[1].match(/^(-?[\d\s]+(?:,\d+)?)\s*[^\d]*$/);
  if (!m) continue;
  const vysl = Number(m[1].replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(vysl)) continue;
  const levaStrana = casti[0];
  if (!levaStrana || !ARIT.test(levaStrana)) continue;
  const spocteno = vyhodnot(levaStrana);
  if (spocteno === null) continue;
  dopocteno++;
  if (Math.abs(spocteno - vysl) > 0.005) nesedi.push(p.kde + ': „' + posl + '" → ' + levaStrana + ' = ' + spocteno + ', napsáno ' + vysl);
}
ok(dopocteno >= 1500, 'dopočítáno ' + dopocteno + ' posledních kroků (podlaha 1500 — pod ní pravidlo nic nekontroluje)');
ok(nesedi.length === 0, 'poslední krok se dopočítá na to, co tvrdí' +
  (nesedi.length ? ' — ' + nesedi.length + ' nesedí, např. ' + nesedi[0] : ''));

/* ════════ 6) SHODA solSteps S PRODUKTEM ════════
   Kopie pravidla nahoře se nesmí rozejít se zdrojem — dvě verze téhož se
   rozejdou a nikde to nespadne (tenhle repozitál na to už doplatil). */
const fs = require('fs');
const core = fs.readFileSync(path.join(ROOT, 'projects/prijimacky-matematika/prijimacky-core.js'), 'utf8');
ok(/const solSteps = sol => \{/.test(core), 'prijimacky-core.js má solSteps');
ok(core.includes("sol.split(/(?<=\\.)\\s+(?=[A-ZÁ-Ž])/)"), 'dělič v produktu je shodný s děličem v testu');
ok(/window\.PZ = \{[^}]*solSteps/.test(core), 'solSteps je exportován v PZ');

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌   (zadání: ' + polozky.length + ')');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
