/* ══════════════════════════════════════════════════════════════════
   Typografie přijímaček při zobrazení: PZ.typo (prijimacky-core.js).

   PROČ. Banky i generátory píšou záporná čísla se spojovníkem („Výsledek: -7,45“; naměřeno ~7 % nápověd
   úrovně test) a jednotky za obyčejnou mezerou („12 cm“). Na úzké obrazovce se „12“ a „cm“ rozdělí na dva
   řádky a „-“ se čte jako spojovník. Opravuje se až při ZOBRAZENÍ (banka je i vstupem kontroly odpovědí),
   čistou idempotentní funkcí `PZ.typo`. Tenhle test hlídá FUNKCI a její dopad na skutečný obsah; zapojení
   do stránek (textové uzly, MutationObserver, vynechané prvky) hlídá prijimacky-typografie-dom.test.cjs.

   Tři věci, které hlídá nad skutečným obsahem (banka testu + „základ“ + nápovědy), ne nad vymyšlenými řetězci:
     1. typo mění JEN znak: '-' → '−' a ' ' → pevná mezera, délka i ostatní znaky zůstanou (nic nezmizí, nic nepřibude),
     2. je idempotentní (druhé puštění nic nezmění — jinak by se MutationObserver zacyklil),
     3. nad korpusem skutečně něco dělá (podlaha počtu změn, jinak by pravidlo mohlo tiše oslepnout).
   Spusť: node tests/prijimacky-typografie.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

/* — jádro načtené bez stránky (typoStart se bez `document` sám vypne) — */
const win = {};
new Function('window', fs.readFileSync(path.join(ROOT, 'projects/prijimacky-matematika/prijimacky-core.js'), 'utf8'))(win);
const typo = win.PZ && win.PZ.typo;
ok(typeof typo === 'function', 'PZ.typo je exportované');
if (typeof typo !== 'function') { console.log('\nNelze pokračovat.'); process.exit(1); }
const NB = ' ', MIN = '−';

console.log('\n══ Minus: jen před číslicí a jen za hranicí slova/závorky/operátoru ══');
const MINUS = [
  ['Výsledek: -7,45', 'Výsledek: ' + MIN + '7,45', 'za dvojtečkou a mezerou'],
  ['-5', MIN + '5', 'na začátku řetězce'],
  ['x = -4 : (-2)', 'x = ' + MIN + '4 : (' + MIN + '2)', 'za rovná se a za závorkou'],
  ['a; -3; 4', 'a; ' + MIN + '3; 4', 'za středníkem'],
  ['2 · -3', '2 · ' + MIN + '3', 'za násobením'],
  ['[-1, 5]', '[' + MIN + '1, 5]', 'za hranatou závorkou'],
  ['-5 °C', MIN + '5 °C', 'teplota'],
  ['a/-2', 'a/' + MIN + '2', 'za lomítkem'],
  ['-0,5', MIN + '0,5', 'desetinné záporné číslo']
];
for (const [vstup, cil, proc] of MINUS) ok(typo(vstup) === cil, 'minus: „' + vstup + '“ (' + proc + ')', 'dostal „' + typo(vstup) + '“');

const NEMENIT = [
  ['5-7', 'rozsah bez mezer'],
  ['2023-10-05', 'datum'],
  ['M9A-2023', 'označení testu'],
  ['x - 3', 'odčítání s mezerami'],
  ['5 - 3', 'odčítání s mezerami (čísla)'],
  ['-x', 'minus před písmenem'],
  ['A-1', 'za písmenem'],
  ['pravo-úhlý', 'spojovník ve slově'],
  ['7 – 3', 'pomlčka (jiný znak) zůstane'],
  ['', 'prázdný řetězec']
];
for (const [vstup, proc] of NEMENIT) ok(typo(vstup) === vstup, 'beze změny: „' + vstup + '“ (' + proc + ')', 'dostal „' + typo(vstup) + '“');

console.log('\n══ Pevná mezera: jen číslo + jednotka ══');
const JEDNOTKY = ['12 cm', '2,5 kg', '25 %', '3 m²', '3 cm³', '5 km/h', '500 Kč', '8 h', '40 min', '7 l', '250 ml', '1 t', '36 dkg', '10 m/s', '4 dm²', '2 hod', '3 mg', '5 hl', '4 mm', '6 dl', '9 km', '1 dkg'];
for (const j of JEDNOTKY) {
  const [c, u] = [j.slice(0, j.indexOf(' ')), j.slice(j.indexOf(' ') + 1)];
  ok(typo(j) === c + NB + u, 'pevná mezera: „' + j + '“', 'dostal „' + typo(j) + '“');
}
ok(typo('Obdélník má 12 cm a 5 cm.') === 'Obdélník má 12' + NB + 'cm a 5' + NB + 'cm.', 'dvě jednotky ve větě');
ok(typo('Cena je 500 Kč, sleva 25 %.') === 'Cena je 500' + NB + 'Kč, sleva 25' + NB + '%.', 'Kč i procento ve větě');

const NEJEDNOTKY = [
  ['3 minuty', 'začátek jiného slova (min…)'],
  ['2 s kamarádem', 'předložka „s“ není jednotka'],
  ['5 metrů', 'slovo, ne jednotka (m…)'],
  ['3 listy', 'slovo (l…)'],
  ['4 hodiny', 'slovo (h…)'],
  ['2 kila', 'slovo (kg není)'],
  ['1 tuzka', 'slovo (t…)'],
  ['12 cmy', 'cizí zakončení'],
  ['Úloha 3 a 4', 'spojka „a“'],
  ['3 gramy', 'slovo (g…)']
];
for (const [vstup, proc] of NEJEDNOTKY) ok(typo(vstup) === vstup, 'beze změny: „' + vstup + '“ (' + proc + ')', 'dostal „' + typo(vstup) + '“');

console.log('\n══ Obecné vlastnosti ══');
ok(typo(null) === '' && typo(undefined) === '', 'null i undefined → prázdný řetězec');
ok(typo(5) === '5' && typo(-5) === MIN + '5', 'číslo (ne řetězec) se převede na text a záporné dostane minus', 'dostal „' + typo(-5) + '“');
for (const s of ['x = -4 cm', '12 cm a -3 m', 'Výsledek: -7,45 Kč', 'a - b = 5 - 3']) ok(typo(typo(s)) === typo(s), 'idempotentní: „' + s + '“');

/* ═══════════ Korpus: skutečný obsah, ne vymyšlené řetězce ═══════════ */
console.log('\n══ Korpus: banka testu + „základ“ + nápovědy ══');
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => n === 1 ? o : (n >= 2 && n <= 4 ? f : m);
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar', 'svgCuboid', 'svgSloupce', 'svgTezitko'].forEach(f => { global[f] = () => '<svg></svg>'; });
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.document = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; }, documentElement: { getAttribute() { return null; } }, createElement() { return { style: {}, setAttribute() {}, appendChild() {} }; } };
global.navigator = { userAgent: 'node' };
for (const f of ['projects/rpg-cermat-9.js', 'projects/prijimacky-matematika/prijimacky-gen.js', 'projects/prijimacky-matematika/prijimacky-topics.js', 'projects/prijimacky-matematika/prijimacky-core.js']) require(path.join(ROOT, f));
const PZ = global.PZ, T = global.PZ_TOPICS;
ok(!!PZ && !!T, 'jádro, témata a banky se načetly');

const OKRUHY = ['vyrazy-mocniny', 'zlomky', 'procenta', 'pomer', 'vyrazy-promenna', 'rovnice', 'slovni', 'geometrie', 'telesa', 'data'];
const retezce = [];
let uloh = 0, nahozeno = 0;
for (const uroven of ['test', 'zaklad']) {
  for (const o of OKRUHY) {
    for (let k = 0; k < 160; k++) {
      let it;
      try { it = T.item(o, uroven); } catch (e) { it = null; }
      if (!it) continue;
      uloh++;
      const r = [it.title, it.intro, it.prompt].concat(it.options || [], Array.isArray(it.sol) ? it.sol : [it.sol]);
      try { r.push.apply(r, PZ.hintsFor(it, o)); } catch (e) { nahozeno++; }
      r.forEach(x => { if (typeof x === 'string' && x) retezce.push(x); });
    }
  }
}
ok(uloh > 2000, 'korpus má dost úloh: ' + uloh + ' (podlaha 2000)');
ok(retezce.length > 15000, 'korpus má dost řetězců: ' + retezce.length + ' (podlaha 15000)');
ok(nahozeno === 0, 'hintsFor nikdy nespadl', nahozeno + '× výjimka');

let zmenRetezcu = 0, minusZmen = 0, mezerZmen = 0, nesedi = [], neidem = [];
for (const s of retezce) {
  const t = typo(s);
  if (t !== s) zmenRetezcu++;
  if (t.length !== s.length) { nesedi.push(s); continue; }
  for (let i = 0; i < s.length; i++) {
    if (s[i] === t[i]) continue;
    if (s[i] === '-' && t[i] === MIN) minusZmen++;
    else if (s[i] === ' ' && t[i] === NB) mezerZmen++;
    else { nesedi.push(s); break; }
  }
  if (typo(t) !== t) neidem.push(s);
}
ok(nesedi.length === 0, 'typo mění jen „-“ → „−“ a mezeru → pevnou mezeru (délka i ostatní znaky shodné)', nesedi.length + '× např. „' + (nesedi[0] || '').slice(0, 80) + '“');
ok(neidem.length === 0, 'typo je na celém korpusu idempotentní', neidem.length + '× např. „' + (neidem[0] || '').slice(0, 80) + '“');
console.log('  ℹ️  změněno řetězců: ' + zmenRetezcu + ' z ' + retezce.length + ', minus ' + minusZmen + '×, pevná mezera ' + mezerZmen + '×');
ok(minusZmen > 60, 'pravidlo minus se v korpusu skutečně uplatnilo: ' + minusZmen + '× (naměřeno 99–134 za běh, podlaha 60)');
ok(mezerZmen > 6000, 'pravidlo pevné mezery se v korpusu skutečně uplatnilo: ' + mezerZmen + '× (naměřeno 8 853–9 334 za běh, podlaha 6 000)');

/* po typo nezbývá žádný spojovník před číslicí za hranicí ani „číslo mezera jednotka“ */
const ZBYLE_MINUS = /(^|[\s(\[=;:·×<>\/])-(?=\d)/, ZBYLA_MEZERA = /\d (?:cm|dm|mm|km|kg|dkg|mg|ml|dl|hl|Kč|min|hod|[mglht]|%)(?![\p{L}\d])/u;
let zbyleM = 0, zbylaJ = 0, ukM = '', ukJ = '';
for (const s of retezce) {
  const t = typo(s);
  if (ZBYLE_MINUS.test(t)) { zbyleM++; ukM = ukM || t; }
  if (ZBYLA_MEZERA.test(t)) { zbylaJ++; ukJ = ukJ || t; }
}
ok(zbyleM === 0, 'po typo nezbývá spojovník před číslicí na hranici', zbyleM + '× např. „' + ukM.slice(0, 80) + '“');
ok(zbylaJ === 0, 'po typo nezbývá „číslo mezera jednotka“ s obyčejnou mezerou', zbylaJ + '× např. „' + ukJ.slice(0, 80) + '“');

console.log('\n' + (fail ? '❌' : '✅') + ' Typografie přijímaček: ' + pass + ' ✅, ' + fail + ' ❌');
process.exit(fail ? 1 : 0);
