/* ══════════════════════════════════════════════════════════════════
   Kontrola odpovědí v přijímačkách (PZ.check) a rovnice bez prozrazení.

   1. ZLOMEK jako správná odpověď se porovnává PŘESNĚ a musí být v základním
      tvaru. Sdílená checkAns má toleranci 0,016 (kvůli hrám), takže uznala
      1/14 místo 1/12 i −1/7 místo −3/20 — naměřeno u 71 % odpovědí podúlohy
      2.1 a 48 % podúlohy 2.2. Ověřuje se nad SKUTEČNOU bankou: každý zlomek
      z banky musí projít sám se sebou, neprojde rozšířený (2p/2q) ani
      nejbližší cizí zlomek, který by tolerance pustila.
   2. „NEMÁ ŘEŠENÍ" / „NEKONEČNĚ MNOHO ŘEŠENÍ" se uzná i v běžných obměnách.
      DESETINNÉ číslo se porovnává taky přesně (0,1 není 0,09), ČAS celý
      (15:40 není 15:22) a „o 147 cm" u otázky „o kolik" projde.
   3. POZICE 4 NIC NEPROZRADÍ: všechny rovnice mají stejný úvod, zadání
      začíná „Řešte …" a klávesnice je textová (číselná by u mobilu řekla,
      že odpověď není „nemá řešení"). Klávesnice se musí dostat i do
      procvičování — přemapování úlohy kopíruje jen známé klíče.

   Spusť: node tests/prijimacky-kontrola.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const el = () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {}, classList: { add() {}, remove() {} } });
global.window = globalThis;
global.document = { head: el(), documentElement: el(), body: el(), addEventListener() {}, getElementById() { return null },
  querySelector() { return null }, querySelectorAll() { return [] }, createElement: el };
global.localStorage = { getItem() { return null }, setItem() {}, removeItem() {} };
for (const f of ['projects/rpg-shared.js', 'projects/rpg-svg-9.js', 'projects/prijimacky-matematika/prijimacky-core.js',
  'projects/rpg-cermat-9.js', 'projects/prijimacky-matematika/prijimacky-gen.js', 'projects/prijimacky-matematika/prijimacky-topics.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f });
}
const { check } = window.PZ, C = window.RPG_CERMAT_9;

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

console.log('── Ruční případy ──');
const PRIPADY = [
  ['1/12', '1/12', true], ['1/14', '1/12', false], ['2/24', '1/12', false], ['0,0833', '1/12', false],
  ['−5/8', '-5/8', true], ['- 5/8', '-5/8', true], ['5/8', '-5/8', false], ['−1/7', '-3/20', false],
  ['nemá řešení', 'nemá řešení', true], ['Rovnice nemá řešení.', 'nemá řešení', true], ['žádné řešení', 'nemá řešení', true],
  ['∅', 'nemá řešení', true], ['nekonečně mnoho', 'nemá řešení', false], ['3', 'nemá řešení', false],
  ['nekonečně mnoho řešení', 'nekonečně mnoho řešení', true], ['Nekonečně mnoho.', 'nekonečně mnoho řešení', true],
  ['každé číslo', 'nekonečně mnoho řešení', true], ['nemá řešení', 'nekonečně mnoho řešení', false],
  // mimo zlomky se nic nezměnilo: jednotka i čárka dál projdou
  ['2,5', '2.5', true], ['−2,5', '-2.5', true], ['12 kg', '12', true], ['7.', '7', true], ['8', '7', false],
  // desetinná odpověď přesně: tolerance by u 0,09 uznala i 0,1
  ['0,09', '0.09', true], ['0,090', '0.09', true], ['0,1', '0.09', false], ['1,5 l', '1.5', true], ['1,51', '1.5', false], ['1,5,3', '1.5', false],
  // „o kolik…": předložka před číslem nevadí, jiné číslo dál neprojde
  ['o 147 cm', '147', true], ['O 147', '147', true], ['o 140 cm', '147', false], ['o 2,5', '2.5', true],
  // čas porovnaný CELÝ (tolerance by z „15:40" vzala jen hodiny)
  ['15:22', '15:22', true], ['15.22', '15:22', true], ['15 h 22 min', '15:22', true], ['15:22 h', '15:22', true],
  ['15:40', '15:22', false], ['15', '15:22', false], ['3:22', '15:22', false], ['15:2', '15:22', false],
];
const spatne = PRIPADY.filter(([u, k, e]) => check(u, k) !== e);
ok(spatne.length === 0, `${PRIPADY.length} ručních případů`, spatne.map(([u, k, e]) => `„${u}" vs ${k} → ${!e}`).join(' | '));

console.log('── Zlomky ze skutečné banky ──');
let zlomku = 0; const vadne = new Set();
for (let i = 0; i < 1500; i++) for (let s = 0; s < 16; s++) {
  const t = C.genSlot(s);
  (t.parts || []).forEach(p => {
    const m = /^(-?)(\d+)\/(\d+)$/.exec(String(p.ans).replace('−', '-'));
    if (!m) return;
    zlomku++;
    const n = +m[2], d = +m[3], zn = m[1];
    if (!check(`${zn ? '−' : ''}${n}/${d}`, p.ans)) vadne.add(`správný ${p.ans} neprošel`);
    if (check(`${zn}${2 * n}/${2 * d}`, p.ans)) vadne.add(`rozšířený ${2 * n}/${2 * d} prošel za ${p.ans}`);
    // nejbližší cizí zlomek se jmenovatelem d+1, který sdílená tolerance pustí
    const k = Math.round(n * (d + 1) / d), cizi = `${zn}${k}/${d + 1}`;
    if (k * d !== n * (d + 1) && check(cizi, p.ans)) vadne.add(`cizí ${cizi} prošel za ${p.ans}`);
  });
}
ok(zlomku > 500, `zlomkových odpovědí v losu: ${zlomku} (pojistka proti prázdnému měření)`);
ok(vadne.size === 0, 'přesně jen správný zlomek v základním tvaru', [...vadne].slice(0, 3).join(' | '));

console.log('── Pozice 4 nic neprozradí ──');
const uvody = new Set(), zadani = new Set(), klav = new Set(); let odpovedi = { nema: 0, nekon: 0, cislo: 0 };
for (let i = 0; i < 2000; i++) {
  const t = C.genSlot(3);
  uvody.add(t.intro);
  t.parts.forEach(p => {
    zadani.add(p.prompt.slice(0, 6)); klav.add(p.klavesnice);
    if (p.ans === 'nemá řešení') odpovedi.nema++; else if (p.ans === 'nekonečně mnoho řešení') odpovedi.nekon++; else odpovedi.cislo++;
  });
}
ok(uvody.size === 1 && /nemá řešení/.test([...uvody][0]), 'všechny varianty mají týž úvod s pokynem k „nemá řešení"', [...uvody].join(' | '));
ok([...zadani].every(z => z.startsWith('Řešte')), 'zadání vždy začíná „Řešte…"', [...zadani].join(' | '));
ok(klav.size === 1 && klav.has('text'), 'klávesnice vždy textová', [...klav].join(','));
ok(odpovedi.nema > 50 && odpovedi.nekon > 5 && odpovedi.cislo > 3000, 'v losu jsou kořeny, „nemá řešení" i „nekonečně mnoho"', JSON.stringify(odpovedi));

console.log('── Klávesnice dojde až do stránek ──');
const zdroj = f => fs.readFileSync(path.join(ROOT, 'projects/prijimacky-matematika', f), 'utf8');
ok(/p\.klavesnice\s*\|\|\s*PZ\.inputMode\(p\.ans\)/.test(zdroj('test.html')), 'test.html bere klávesnici z podúlohy');
ok(['procvicovani.html', 'diagnostika.html'].every(f => /it\.klavesnice\s*\|\|\s*PZ\.inputMode\(it\.ans\)/.test(zdroj(f))),
  'procvičování i diagnostika berou klávesnici z položky');
let zBanky = 0, bezKlav = 0;
for (let i = 0; i < 400; i++) {
  const it = window.PZ_TOPICS.item('rovnice');
  // jen úlohy z testu nanečisto („Řešte rovnici: …"); prijimacky-gen.js má vlastní zadání bez dvojtečky
  if (it && /^Řešte (rovnici:|soustavu rovnic)/.test(it.prompt)) { zBanky++; if (it.klavesnice !== 'text') bezKlav++; }
}
ok(zBanky > 20 && bezKlav === 0, `procvičování rovnic z testu nese klávesnici (${zBanky} položek, bez ní ${bezKlav})`);

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
process.exit(fail ? 1 : 0);
