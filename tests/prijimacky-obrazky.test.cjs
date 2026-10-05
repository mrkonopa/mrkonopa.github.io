/**
 * Obrázky u úloh „základu" (procvičování a diagnostika, prijimacky-gen.js).
 *
 * Test nanečisto dostal v září 2026 obrázky tam, kde je mají ostré úlohy.
 * „Základ" měl 0 % — geometrie i tělesa jen jako text. Podle Vojtova pokynu
 * („co se osvědčí na jednom místě, patří všude") dostal obrázky taky, a to
 * ze SDÍLENÝCH kreseb v rpg-svg-9.js, které načítá test, procvičování,
 * diagnostika i 9. ročník RPG — žák tak všude vidí tutéž kresbu.
 *
 * Generátor sahá na kresby přes globalThis (bez nich obrázek prostě nemá),
 * proto se tu načítají SKUTEČNÉ kreslicí funkce, ne náhražky — jinak by
 * test nepoznal, že se kresba přejmenovala a obrázky tiše zmizely.
 *
 * Hlídá:
 *   1) každá geometrická a tělesová úloha, která obrázek má mít, ho má,
 *   2) obrázek je kresba (svg s viewBoxem) a neprozradí výsledek, který
 *      v zadání není (pravidlo z RPG, rpg-obrazky.test.cjs),
 *   3) obdélník se kreslí ve skutečném poměru stran.
 *
 * Spusť: node tests/prijimacky-obrazky.test.cjs
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

// SKUTEČNÉ kresby ze sdíleného modulu (vč. pomocných funkcí, na kterých stojí)
const src = fs.readFileSync(path.join(ROOT, 'projects/rpg-svg-9.js'), 'utf8');
const jmena = [...new Set([...src.matchAll(/function (svg\w+)\s*\(/g)].map(m => m[1]))];
Object.assign(globalThis, new Function(src + '\n;return {' + jmena.join(',') + '};')());
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.window = {};
require(path.join(ROOT, 'projects/prijimacky-matematika/prijimacky-gen.js'));
const GEN = global.window.PZ_GEN;

/* Generátory, které obrázek mít MAJÍ (jméno funkce → kresba). Seznam je
   jmenovitý schválně: nový generátor bez obrázku tu nespadne, ale ztráta
   obrázku u některého z těchto ano. */
const S_OBRAZKEM = {
  obvodObdelnikG: 'svgObdelnik', obsahObdelnikG: 'svgObdelnik', ctverecG: 'svgObdelnik',
  obsahTrojuhelnikG: 'svgTrojVyska', uhelVedlejsi: 'svgVedlejsi', pythagorasG: 'svgRightTri',
  lichobeznik: 'svgTrapezoid', tretiUhel: 'svgTrojUhly',
  objemKvadrT: 'svgCuboid', povrchKvadrT: 'svgCuboid', hranyKvadrT: 'svgCuboid', objemKvadrLitr: 'svgCuboid',
  krychleT: 'svgKrychle', hranol: 'svgHranol3', hranaZObjemu: 'svgKrychle'
};
const POPISEK = /<text[^>]*>([^<]*)<\/text>/g;
const cislo = s => { const t = String(s).replace(/[−–]/g, '-').replace(/\s+/g, '').replace(/(cm|dm|mm|m|°|cm²|cm³)$/, '').replace(',', '.'); return /^-?\d+(\.\d+)?$/.test(t) ? +t : null; };
const vZadani = (h, text) => new RegExp('(^|[^\\d,])' + String(h).replace('.', ',') + '($|[^\\d,])').test(String(text));

const PER = 300, stav = {};
let obrazku = 0;
for (const [okruh, fns] of Object.entries(GEN)) for (const fn of fns) {
  if (!S_OBRAZKEM[fn.name]) continue;
  const s = stav[fn.name] = { okruh, n: 0, svg: 0, spatne: 0, prozradi: 0, priklad: '' };
  for (let i = 0; i < PER; i++) {
    const t = fn();
    if (!t) continue;
    s.n++;
    if (!t.svg) continue;
    s.svg++; obrazku++;
    if (!/^<svg viewBox="[\d. -]+"/.test(t.svg)) { s.spatne++; s.priklad = t.svg.slice(0, 60); }
    const an = cislo(t.ans), lab = [...t.svg.matchAll(POPISEK)].map(m => m[1].trim());
    if (lab.some(l => an !== null && cislo(l) === an) && !vZadani(t.ans, t.prompt)) s.prozradi++;
  }
}

console.log('── Přijímačky, „základ": obrázky ──');
const chybi = Object.keys(S_OBRAZKEM).filter(jm => !stav[jm]);
ok(chybi.length === 0, 'všech ' + Object.keys(S_OBRAZKEM).length + ' generátorů s obrázkem v bance existuje', chybi.join(', '));
const bez = Object.entries(stav).filter(([, s]) => s.svg < s.n).map(([jm, s]) => jm + ' ' + s.svg + '/' + s.n);
ok(bez.length === 0, 'každá jejich úloha má obrázek (' + obrazku + ' obrázků)', bez.join(', '));
const spatne = Object.entries(stav).filter(([, s]) => s.spatne).map(([jm, s]) => jm + ': ' + s.priklad);
ok(spatne.length === 0, 'obrázek je kresba s viewBoxem', spatne.join(' | '));
const prozradi = Object.entries(stav).filter(([, s]) => s.prozradi).map(([jm, s]) => jm + ' ' + s.prozradi + '/' + s.n);
ok(prozradi.length === 0, 'obrázek neprozradí výsledek, který v zadání není', prozradi.join(', '));
const kresba = Object.entries(S_OBRAZKEM).filter(([jm, f]) => !globalThis[f]).map(([jm, f]) => f);
ok(kresba.length === 0, 'všechny kresby existují ve sdíleném rpg-svg-9.js', [...new Set(kresba)].join(', '));

/* Obdélník ve skutečném poměru: šířka : výška nakresleného obdélníku sedí
   na poměr stran ze zadání (dokud nejkratší strana nenarazí na 26 px). */
const pomer = [];
for (let i = 0; i < 400; i++) {
  const t = GEN.geometrie.find(f => f.name === 'obvodObdelnikG')();
  const [a, b] = t.prompt.match(/\d+/g).map(Number);
  const m = t.svg.match(/<rect[^>]*width="([\d.]+)" height="([\d.]+)"/);
  const w = +m[1], h = +m[2];
  if (w > 26.5 && h > 26.5) pomer.push(Math.abs(w / h - a / b) / (a / b));
}
ok(pomer.length > 150 && Math.max(...pomer) < 0.01, 'obdélník se kreslí ve skutečném poměru stran (' + pomer.length +
  ' kreseb, největší odchylka ' + (100 * Math.max(...pomer)).toFixed(2) + ' %)');

/* ── Test nanečisto (rpg-cermat-9.js): obrázek neprozradí výsledek podúlohy ──
   „Čtverce z obdélníků" (pozice 16) popisuje v obrázku stranu 2. čtverce — a 16.1
   se při k = 2 ptala právě na ni (~14 % losů, průchod 5. 10. 2026). Výsledek, který
   je popiskem obrázku a v textu není, se hlásí. Výjimka: zadání říká, že hodnoty
   jsou „vyznačeny v obrázku" (pozice 7 — úhly jsou zadané obrázkem a rovnost
   vrcholových úhlů je smyslem úlohy, ne prozrazení). */
{
  global.gcd = function g(a, b) { return b ? g(b, a % b) : Math.abs(a); };
  global.cz = n => String(n).replace('.', ','); global.skl = (n, o, f, m) => (n === 1 ? o : (n >= 2 && n <= 4 ? f : m));
  require(path.join(ROOT, 'projects/rpg-cermat-9.js'));
  const C = global.window.RPG_CERMAT_9;
  const cislo = a => new RegExp('(^|[^\\d,.])' + String(a).replace(/[.,]/, '[,.]') + '(?![\\d,]|\\.\\d)');
  const nal = new Map(); let casti = 0;
  for (let i = 0; i < 400; i++) for (let sl = 0; sl < 16; sl++) {
    let t; try { t = C.genSlot(sl); } catch (e) { continue; }
    const cs = t.parts && t.parts.length ? t.parts.map(p => ({ ans: p.ans, prompt: p.prompt, svg: p.svg || t.svg, key: p.key })) : [{ ans: t.ans, prompt: t.prompt, svg: t.svg, key: String(sl + 1) }];
    for (const c of cs) {
      if (!c.svg || c.ans == null || !/^-?\d+([.,]\d+)?$/.test(String(c.ans))) continue;
      casti++;
      const zad = [t.intro, c.prompt, t.prompt].filter(Boolean).join(' ');
      if (/vyznačen/.test(zad)) continue;
      const popisky = [...String(c.svg).matchAll(/>([^<>]*)</g)].map(m => m[1].trim()).filter(Boolean);
      const hit = popisky.find(l => cislo(c.ans).test(l));
      if (hit && !cislo(c.ans).test(zad)) nal.set(c.key + ' ' + (t.title || ''), (nal.get(c.key + ' ' + (t.title || '')) || 0) + 1);
    }
  }
  ok(casti > 3000, 'test nanečisto: proměřeno ' + casti + ' číselných podúloh s obrázkem (podlaha 3 000)');
  ok(nal.size === 0, 'test nanečisto: obrázek neprozradí výsledek podúlohy', [...nal].map(([k, n]) => k + ' ' + n + '×').join(', '));
}

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
