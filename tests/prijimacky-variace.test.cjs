/* ══════════════════════════════════════════════════════════════════
   Test nanečisto: KOLIK variant má každá pozice a KOLIK kroků má postup.

   PROČ ZVLÁŠŤ. Stávající kontroly (`prijimacky-cermat-audit`,
   `prijimacky-postupy`) hlídají, že postup EXISTUJE, že v něm není NaN,
   že má desetinnou čárku a že se poslední krok dopočítá na odpověď.
   Žádná z nich se neptá, kolik má pozice variant ani kolik kroků má
   výklad — jednořádkový postup u úlohy za 6 bodů i pozice s jedinou
   variantou jimi projdou.

   A právě to jsou dvě věci, na kterých se tenhle modul vylepšuje:
   deváťák, který si test dá podruhé, má vidět jiné úlohy, a když se
   splete, má se z rozboru DOZVĚDĚT PROČ, ne jen dostat spočítaný
   příklad.

   PODLAHY JSOU NAMĚŘENÉ, ne vymyšlené, a fungují jako RÁČNA: jak se
   která pozice předělá, její podlaha se zvedne. Snižovat se nesmí —
   to by z testu udělalo dekoraci.

   Počet variant se čte ZE ZDROJÁKU (pole SLOTS), ne z losování:
   sampling by u pozice, která mění formulaci zadání, dával pokaždé jiné
   číslo a test by flakoval.

   Spusť: node tests/prijimacky-variace.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BANKA = path.join(ROOT, 'projects', 'rpg-cermat-9.js');

/* Stuby helperů — banka je čte z globálu (stejně jako ostatní testy). */
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => (n === 1 ? o : (n >= 2 && n <= 4 ? f : m));
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar',
 'svgCuboid', 'svgSloupce', 'svgTezitko'].forEach(f => { global[f] = () => '<svg></svg>'; });
global.window = {};
require(BANKA);
const C = global.window.RPG_CERMAT_9;

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

console.log('\n── Test nanečisto: variace a hloubka postupů ──\n');

/* ── 1. počet variant na pozici (deterministicky ze zdrojáku) ─────── */
const src = fs.readFileSync(BANKA, 'utf8');
const mSlots = /const SLOTS = \[([\s\S]*?)\n  \];/.exec(src);
ok(!!mSlots, 'pole SLOTS se ve zdrojáku našlo');
const skupiny = mSlots ? [...mSlots[1].matchAll(/\[([^\[\]]+)\]/g)]
  .map(m => m[1].split(',').map(s => s.trim()).filter(Boolean)) : [];
ok(skupiny.length === 16, 'SLOTS má 16 pozic', 'nalezeno=' + skupiny.length);

/* Naměřeno 2026-09-13. Pozice se zvedá, jakmile se předělá. */
const VARIANT = { 1: 8, 2: 3, 3: 3, 4: 3, 5: 3, 6: 4, 7: 3, 8: 3,
  9: 3, 10: 3, 11: 3, 12: 5, 13: 4, 14: 6, 15: 3, 16: 3 };
const maloVariant = [];
skupiny.forEach((g, i) => {
  const p = i + 1;
  if (g.length < VARIANT[p]) maloVariant.push('pozice ' + p + ': ' + g.length + ' < ' + VARIANT[p]);
});
ok(maloVariant.length === 0,
  'každá pozice má aspoň tolik variant, kolik měla naměřeno (celkem ' +
  skupiny.reduce((s, g) => s + g.length, 0) + ' generátorů)', maloVariant.join(' | '));
/* Pojistka proti překlepu v seznamu: kdyby se generátor přejmenoval,
   regex ho sice napočítá, ale funkce by neexistovala a genSlot by spadl.
   Proto se každý název dohledá i jako definice. */
const chybi = [];
skupiny.flat().forEach(jm => {
  if (!new RegExp('function\\s+' + jm + '\\s*\\(').test(src)) chybi.push(jm);
});
ok(chybi.length === 0, 'každý generátor uvedený v SLOTS je v souboru definovaný', chybi.join(', '));

/* ── 2. hloubka postupů (naměřeno na skutečném generování) ─────────── */
const kroky = sol => {
  if (Array.isArray(sol)) return sol.filter(x => typeof x === 'string' && x.trim()).length;
  if (typeof sol !== 'string' || !sol.trim()) return 0;
  return sol.split(/(?<=\.)\s+(?=[A-ZÁ-Ž])/).filter(Boolean).length;
};
/* 🔴 Tvar `sol` se liší podle druhu úlohy: u `mc` je pole seznamem KROKŮ
   jedné úlohy, u `match` seznamem POSTUPŮ k jednotlivým otázkám, u
   `tfgrid` leží postup uvnitř každého tvrzení. Kdo to smíchá, naměří
   u `mc` samé jednokrokové postupy a ohlásí vadu, která tam není. */
const vyklady = t => {
  const v = [];
  if (t.kind === 'match') (t.sol || []).forEach(s => s && v.push(s));
  else if (t.sol) v.push(t.sol);
  (t.parts || []).forEach(p => p.sol && v.push(p.sol));
  (t.statements || []).forEach(s => s && s.sol && v.push(s.sol));
  return v;
};

/* Naměřeno 2026-09-13 přes 3 000 generování na pozici. Pozice 1 je
   předělaná (pravidlo → dosazení → výsledek), proto 3. Ostatní drží
   svůj dnešní stav, aby nemohly klesnout. */
const KROKU = { 1: 3, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2,
  9: 3, 10: 3, 11: 2, 12: 3, 13: 2, 14: 3, 15: 2, 16: 2 };
const BEHU = 1200;
const melke = [];
let videnoVykladu = 0;
for (let i = 0; i < C.slotCount(); i++) {
  const p = i + 1;
  let nej = Infinity, ukazka = '';
  for (let b = 0; b < BEHU; b++) {
    const t = C.genSlot(i);
    vyklady(t).forEach(s => {
      videnoVykladu++;
      const n = kroky(s);
      if (n < nej) { nej = n; ukazka = (Array.isArray(s) ? s[0] : String(s)).slice(0, 60); }
    });
  }
  if (nej < KROKU[p]) melke.push('pozice ' + p + ': nejkratší postup má ' + nej +
    ' kroků (podlaha ' + KROKU[p] + ') — „' + ukazka + '…"');
}
/* Pojistka proti běhu naprázdno: kdyby se `sol` přejmenovalo nebo se
   banka nenačetla, žádný výklad by se nenašel a „0 nálezů" by vypadalo
   jako úspěch. */
ok(videnoVykladu > 30000, 'změřilo se ' + videnoVykladu + ' postupů (podlaha 30 000)',
  'naměřeno=' + videnoVykladu);
ok(melke.length === 0, 'žádná pozice neklesla pod svou naměřenou hloubku postupu',
  melke.slice(0, 3).join(' | '));

/* ── 3. pozice 1 — vzorek stylu, na který se předělává zbytek ─────── */
const jedna = { celkem: 0, bezPravidla: [], kratke: [] };
for (let b = 0; b < 1500; b++) {
  const t = C.genSlot(0);
  vyklady(t).forEach(s => {
    jedna.celkem++;
    const st = Array.isArray(s) ? s : [s];
    /* První krok má pojmenovat PRAVIDLO, ne rovnou počítat. Poznávací
       znak: sám o sobě neobsahuje výsledek celé úlohy. Kontroluje se
       tedy to, co jde zkontrolovat — že první krok není holá rovnice. */
    if (/^\s*[-\d(√]/.test(String(st[0]))) jedna.bezPravidla.push(String(st[0]).slice(0, 50));
    if (String(st[0]).length < 30) jedna.kratke.push(String(st[0]));
  });
}
ok(jedna.celkem >= 1400, 'pozice 1: změřeno ' + jedna.celkem + ' postupů', 'celkem=' + jedna.celkem);
ok(jedna.bezPravidla.length === 0,
  'pozice 1: první krok vždy pojmenuje pravidlo, nezačíná rovnou počítáním',
  [...new Set(jedna.bezPravidla)].slice(0, 3).join(' | '));
ok(jedna.kratke.length === 0, 'pozice 1: první krok není odbytý (aspoň 30 znaků)',
  [...new Set(jedna.kratke)].slice(0, 3).join(' | '));

console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
