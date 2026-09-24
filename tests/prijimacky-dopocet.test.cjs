/* ══════════════════════════════════════════════════════════════════
   Test nanečisto: NEZÁVISLÝ DOPOČET odpovědi ze ZNĚNÍ zadání.

   PROČ. Ostatní kontroly berou správnou odpověď z objektu, který
   vyrobil generátor (`ans`), a hlídají strukturu, čárku, skloňování
   a hloubku postupu. Úloha, jejíž zadání TVRDÍ něco jiného, než co
   generátor spočítal, jimi projde — takhle v RPG půl roku přežila
   „obvod obdélníku", která nesedělo ve 100 % generování, a všechno
   svítilo zeleně. Tady se odpověď počítá znovu z TEXTU, tak jak ho
   čte žák, a vlastní aritmetikou. Číst proměnné generátoru by byl kruh.

   Dvě části:
     A) odpověď — pozice 15 (vzory zadání), 4 (dosazení kořene do
        rovnice) a 3 (porovnání mnohočlenů),
     B) každá ROVNOST v postupech celého testu („240 · 1,25 = 300")
        se vyhodnotí a musí platit. Na rozdíl od `prijimacky-postupy`
        (jen poslední krok, jen v úzkém tvaru) tu jde o všechny kroky.

   Nerozpoznané zadání je CHYBA, ne tichý přeskok: šablony jsou pevné,
   takže nerozpoznání znamená, že se zadání změnilo a kontrola oslepla.

   Spusť: node tests/prijimacky-dopocet.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const ROOT = path.join(__dirname, '..');            // NIKDY natvrdo /home/user — CI má jinou cestu

/* Pojistka proti ZAMRZNUTÍ: jedna úloha smí losovat nejvýš 100 000× (běžně
   jde o desítky až stovky). Generátor, který se zacyklí, by jinak nechal CI
   viset do vypršení limitu — a u žáka zamrazil kartu prohlížeče. Přesně
   to dělala gen14f (viz sekce D). */
let riVolani = 0;
global.ri = (a, b) => {
  if (++riVolani > 100000) throw new Error('generátor se zacyklil: přes 100 000 losování v jedné úloze');
  return Math.floor(Math.random() * (b - a + 1)) + a;
};
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => (n === 1 ? o : (n >= 2 && n <= 4 ? f : m));
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar',
  'svgCuboid', 'svgSloupce', 'svgTezitko'].forEach(f => { global[f] = () => '<svg></svg>'; });
global.window = {};
require(path.join(ROOT, 'projects', 'rpg-cermat-9.js'));
const C0 = global.window.RPG_CERMAT_9;
const C = { slotCount: () => C0.slotCount(), genSlot: i => { riVolani = 0; return C0.genSlot(i); } };

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
const cislo = s => Number(String(s).replace(/\s/g, '').replace(',', '.'));
const blizko = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

console.log('\n── Test nanečisto: nezávislý dopočet ──\n');

/* ═══ A) POZICE 15 — přiřazování ═══════════════════════════════════
   Zlomky slovy tak, jak je píše zadání. Vzory jsou psané podle ZNĚNÍ,
   ne podle kódu generátoru: kdyby generátor tvrdil v textu „o pětinu"
   a počítal s třetinou, dopočet to pozná. */
const ZL = {
  'polovinu': [1, 2], 'třetinu': [1, 3], 'čtvrtinu': [1, 4], 'pětinu': [1, 5], 'šestinu': [1, 6], 'desetinu': [1, 10],
  'dvě třetiny': [2, 3], 'tři čtvrtiny': [3, 4], 'dvě pětiny': [2, 5], 'tři pětiny': [3, 5], 'čtyři pětiny': [4, 5],
  'pět osmin': [5, 8], 'čtyři sedminy': [4, 7]
};
const zl = s => {
  const k = String(s).toLowerCase().replace(/^(?:posledních|poslední)\s+/, '');
  if (!ZL[k]) throw new Error('neznámý zlomek „' + s + '"');
  return ZL[k][0] / ZL[k][1];
};
const POCET = { dva: 2, tři: 3, čtyři: 4, pět: 5 };

/* Každý vzor: [název, regex, výpočet z nalezených skupin]. */
const VZORY15 = [
  ['kolik % (část z celku)', /pracuje (\d+) lidí, z toho (\d+) na home office/, m => 100 * m[2] / m[1]],
  ['kolik % (část z celku)', /várky (\d+) výrobků bylo (\d+) vadných/, m => 100 * m[2] / m[1]],
  ['kolik % (část z celku)', /má (\d+) žáků, (\d+) z nich jezdí/, m => 100 * m[2] / m[1]],
  ['p % z celku', /je (\d+) žáků\. (\d+) % z nich/, m => m[1] * m[2] / 100],
  ['p % z celku', /stál (\d+) Kč\. Sleva je (\d+) %/, m => m[1] * m[2] / 100],
  ['p % z celku', /je (\d+) litrů vody\. Vypustí se (\d+) %/, m => m[1] * m[2] / 100],
  ['základ z procenta', /^(\d+) % nějakého čísla je (\d+)\./, m => 100 * m[2] / m[1]],
  ['dvakrát o p %', /upekla v pondělí (\d+) rohlíků\. V úterý i ve středu upekla vždy o (\d+) %/,
    m => m[1] * (1 + m[2] / 100) ** 2],
  ['o zlomek víc → původní', /ujel (\d+) km, což bylo o (\S+) více, než ujela/, m => m[1] / (1 + zl(m[2]))],
  ['dva stavy (knihovna)', /o (\d+) % méně než předtím\. Potom koupila (\d+) nových knih a měla jich o (\d+) % více/,
    m => (m[2] / (m[3] / 100)) / (1 - m[1] / 100)],
  ['kolik % tvoří zbytek', /nastoupilo (\d+) družstev po (\d+) hráčích.*? Dohromady nastoupilo (\d+) lidí/,
    m => 100 * (m[3] - m[1] * m[2]) / m[3]],
  ['o kolik % víc než loni', / (\d+) členů, což je o (\d+) členů více než loni/, m => 100 * m[2] / (m[1] - m[2])],
  ['zlomek ze zlomku', /utratila na výletě (.+?) svých úspor\. (.+?) z utracené částky/, m => 100 * zl(m[1]) * zl(m[2])],
  ['výstava — dva dny', /dvoudenní výstavě přišlo druhý den o (\S+) (více|méně) návštěvníků než první den/,
    m => { const d = 1 + (m[2] === 'více' ? 1 : -1) * zl(m[1]); return 100 * d / (1 + d); }],
  ['výstava — víc dnů', /výstavě přišel (?:první|prvních) (\S+) (?:dny|dní) každý den stejný počet návštěvníků\. \S+ den přišlo o (\S+) (více|méně)/,
    m => { const n = POCET[m[1]], d = 1 + (m[3] === 'více' ? 1 : -1) * zl(m[2]); return 100 * d / (n + d); }],
  ['o kolik % víc (opačný základ)', /naučných knih o (\S+) méně než románů\. O kolik procent je v knihovně románů více/,
    m => 100 * (1 / (1 - zl(m[1])) - 1)],
  ['dolití do plna', /^(.+?) objemu \S+ jsou zaplněny vodou\. Když dolijeme ještě (\d+) litr/,
    m => m[2] / (1 - zl(m[1]))],
  ['odčerpání', /vyplňuje (\d+) % jejího objemu\. Když z nádrže odčerpáme (\d+) litr\S*, bude voda vyplňovat přesně (\S+) objemu/,
    m => m[2] / (m[1] / 100 - zl(m[3]))],
  ['tři nádoby', /V první vyplňuje voda (\d+) % objemu, ve druhé (\d+) % objemu a ve třetí je (\d+) litr\S* vody\..*vyplnila by v každé (.+?) objemu/,
    m => m[3] / (3 * zl(m[4]) - m[1] / 100 - m[2] / 100)],
  ['sud — dvě spotřeby', /spotřebovalo (\d+) % vody a potom ještě (\d+) % původního množství\. V sudu zůstalo (\d+) litr/,
    m => m[3] / (1 - m[1] / 100 - m[2] / 100)],
  ['zlomek života', /žije (.+?) svého dosavadního života v \S+, kam se přestěhoval\S* ve věku (\d+) (?:let|roky|rok)/,
    m => { const f = zl(m[1]); return m[2] / (1 - f) * f; }],
  ['o p % déle + poměr', /stojí už (\d+) (?:let|roky), tedy o (\d+) % déle než rozhledna\. Stáří altánu a rozhledny je v poměru (\d+) : (\d+)/,
    m => m[1] / (1 + m[2] / 100) * m[3] / m[4]],
  ['sourozenci', /Součet věků (dvojčat|trojčat) a jejich (?:staršího bratra|starší sestry) je (\d+) (?:let|roky)\. Každé z \S+ je o (\d+) % mladší/,
    m => { const c = m[1] === 'dvojčat' ? 2 : 3, q = 1 - m[3] / 100; return m[2] / (1 + c * q) * q; }],
  ['zbytek v přepravce', /vejde přesně (\d+) sklenic marmelády\. Z plné přepravky jsme vyndali (\d+) %/,
    m => m[1] * (100 - m[2]) / 100],
  ['vše k jedné osobě', /zavařili dohromady (\d+) sklenic marmelády\. Adam zavařil o polovinu méně sklenic než Bára\. Cyril i Dana zavařili každý o (\d+) % sklenic méně než Bára\. O kolik sklenic zavařila Dana více než Adam/,
    m => { const q = 1 - m[2] / 100, R = m[1] / (1 + 0.5 + 2 * q); return R * q - R / 2; }],
  ['rozdíl dvou vztahů', /Babička naplnila marmeládou (dvakrát|třikrát) více sklenic než Ema\. Děda naplnil o (\S+) více sklenic než Ema\. Přitom děda naplnil o (\d+) sklenic\S* méně než babička/,
    m => { const k = m[1] === 'dvakrát' ? 2 : 3, d = 1 + zl(m[2]), E = m[3] / (k - d); return E * (1 + k + d); }]
];

/* Volba „C) 45 %" / „D) 27 let" → 45 / 27; krajní („více než…", „jiný…") → null. */
const hodnotaVolby = o => {
  const t = o.slice(3).trim();
  if (/^(více|méně|jiný|jiná|jiné)(?![\p{L}\d])/u.test(t)) return null;   // \b by za „ý/á/é/ě" nezabralo
  const m = t.match(/^(\d[\d\s]*(?:,\d+)?)/);
  return m ? cislo(m[1]) : null;
};

const BEHU15 = 6000;
const nerozp15 = new Set(), spatne15 = [], pouzite15 = {};
let videno15 = 0, krajniSpravna = 0;
for (let b = 0; b < BEHU15; b++) {
  const t = C.genSlot(14);
  if (t.kind !== 'match') { spatne15.push('pozice 15 není přiřazování: ' + t.kind); continue; }
  if (new Set(t.ans).size !== t.ans.length) spatne15.push(t.title + ': dvě otázky mají stejnou odpověď ' + t.ans.join(','));
  t.prompts.forEach((p, i) => {
    videno15++;
    const shody = VZORY15.filter(([, re]) => re.test(p));
    if (shody.length !== 1) { nerozp15.add((shody.length ? shody.length + '× ' : '') + p.slice(0, 80)); return; }
    const [nazev, re, f] = shody[0];
    pouzite15[nazev] = (pouzite15[nazev] || 0) + 1;
    const m = p.match(re).map((x, j) => (j && /^\d+$/.test(x) ? Number(x) : x));
    const cekano = f(m);
    const r = Math.round(cekano);
    if (!blizko(cekano, r)) { spatne15.push(nazev + ': nevyjde celé číslo (' + cekano + ') — „' + p.slice(0, 70) + '"'); return; }
    const hodnoty = t.options.map(hodnotaVolby);
    const pis = t.options.map(o => o[0]);
    const kde = hodnoty.map((v, j) => (v === r ? pis[j] : null)).filter(Boolean);
    if (kde.length > 1) { spatne15.push(nazev + ': výsledek ' + r + ' je mezi volbami ' + kde.length + '× — ' + t.options.join(' | ')); return; }
    if (kde.length === 0) {
      /* Výsledek v nabídce není — pak musí platit krajní volba „více než X"
         (jako M9C/2025 ú. 15.1: 27 hrnků, nabídka končí „více než 25"). */
      const kraj = t.options.map(o => o.slice(3).match(/^více než (\d[\d\s]*(?:,\d+)?)/)).map(m => (m ? cislo(m[1]) : null));
      const j = kraj.findIndex(x => x !== null);
      if (j < 0 || !(r > kraj[j])) { spatne15.push(nazev + ': výsledek ' + r + ' v nabídce není a žádná krajní volba ho nepokrývá — ' + t.options.join(' | ')); return; }
      if (pis[j] !== t.ans[i]) { spatne15.push(nazev + ': spočteno ' + r + ' (krajní volba ' + pis[j] + '), banka tvrdí ' + t.ans[i]); return; }
      krajniSpravna++;
    } else if (kde[0] !== t.ans[i]) spatne15.push(nazev + ': spočteno ' + r + ' (volba ' + kde[0] + '), banka tvrdí ' + t.ans[i] + ' — „' + p.slice(0, 70) + '"');
    /* Postup musí končit tím výsledkem, ke kterému vede — jinak rozbor
       ukazuje jiné číslo, než jaké je správná volba. */
    const posl = t.sol[i][t.sol[i].length - 1];
    if (!new RegExp('(^|[^\\d,])' + String(r) + '(?![\\d,])').test(posl)) spatne15.push(nazev + ': poslední krok nekončí výsledkem ' + r + ' — „' + posl + '"');
  });
}
ok(videno15 === BEHU15 * 3, 'pozice 15: prošlo se ' + videno15 + ' otázek', 'čekáno ' + BEHU15 * 3);
ok(nerozp15.size === 0, 'pozice 15: každé zadání rozpoznal právě jeden vzor (' + Object.keys(pouzite15).length + ' druhů úloh)',
  [...nerozp15].slice(0, 3).join(' | '));
/* Pokrytí: každý vzor se musí aspoň jednou použít, jinak by se šablona
   mohla v bance tiše změnit a vzor by zbyl jako mrtvý. Naměřeno ≥ 300×
   na druh při 6 000 bězích; podlaha 50 chytá vymizení, ne kolísání. */
const nazvy15 = [...new Set(VZORY15.map(v => v[0]))];
const malo15 = nazvy15.filter(n => (pouzite15[n] || 0) < 50);
ok(malo15.length === 0, 'pozice 15: všech ' + nazvy15.length + ' druhů úloh se v losu objevuje (podlaha 50×)',
  malo15.map(n => n + ' ' + (pouzite15[n] || 0) + '×').join(', '));
/* Krajní volba jako SPRÁVNÁ odpověď se musí v losu opravdu objevovat,
   jinak by větev výše nikdy nic nekontrolovala. */
ok(krajniSpravna >= 50, 'pozice 15: „více než…" je správnou odpovědí ' + krajniSpravna + '× (podlaha 50)',
  'naměřeno=' + krajniSpravna);
ok(spatne15.length === 0, 'pozice 15: dopočet ze zadání vede na volbu, kterou banka označila za správnou',
  [...new Set(spatne15)].slice(0, 3).join(' | '));

/* ═══ A2) POZICE 4 a 3 — algebra ze ZNĚNÍ ═══════════════════════════
   Výraz ze zadání se přepíše do JS a vyhodnotí v několika bodech.
   Rovnice: kořen z banky se dosadí a obě strany se musí rovnat (a rovnice
   nesmí platit pro všechna x — to by kořen nebyl jediný). Soustava se
   vyřeší Cramerovým pravidlem z koeficientů, které se z rovnic vyčtou
   dosazením. Výrazy: identita s „?" musí platit po dosazení odpovědi
   do otazníku, koeficient se spočítá z hodnot mnohočlenu. */
const PROM = ['a', 'k', 'n', 'x', 'y'];
function jsVyraz(s) {
  let e = s.replace(/−/g, '-').replace(/[·×]/g, '*').replace(/\s:\s/g, '/').replace(/(\d),(\d)/g, '$1.$2')
    .replace(/²/g, '**2').replace(/³/g, '**3').replace(/\s+/g, '');
  e = e.replace(/(\d)([a-z(])/g, '$1*$2').replace(/\)([a-z\d(])/g, ')*$1').replace(/([a-z])\(/g, '$1*(');
  if (!/^[\d+\-*/().akny x]+$/.test(e) || /[a-z]{2}/.test(e)) throw new Error('nečitelný výraz „' + s + '"');
  return Function(...PROM, '"use strict";return (' + e + ');');
}
const BODY = [-2, -1, 0, 1, 2, 3];
function identita(L, R) {                          // platí L ≡ R pro všechny proměnné?
  const f = jsVyraz(L), g = jsVyraz(R);
  return BODY.every(v => BODY.slice(0, 3).every(w => blizko(f(v, v, v, v, w), g(v, v, v, v, w)) &&
    blizko(f(w, v, w, v, w), g(w, v, w, v, w))));
}
function koeficient(vyraz, prom, stupen) {        // koeficient u prom^stupen, jiné proměnné = 3
  const f = jsVyraz(vyraz);
  const h = t => f(...PROM.map(p => (p === prom ? t : 3)));
  const c0 = h(0), c1 = (h(1) - h(-1)) / 2, c2 = (h(1) + h(-1)) / 2 - h(0);
  if (!blizko(h(2), 4 * c2 + 2 * c1 + c0) || !blizko(h(-3), 9 * c2 - 3 * c1 + c0)) throw new Error('není kvadratický: „' + vyraz + '"');
  return [c0, c1, c2][stupen];
}
const cisloAns = a => Number(String(a).replace('−', '-').replace(',', '.'));

const nerozp34 = new Set(), spatne34 = [], druhy34 = {};
let videno34 = 0;
function over34(poz, p) {
  videno34++;
  const z = p.prompt, ans = cisloAns(p.ans);
  const pouzij = (druh, fn) => { druhy34[poz + ': ' + druh] = (druhy34[poz + ': ' + druh] || 0) + 1; if (!fn()) spatne34.push(poz + ' ' + druh + ': „' + z.slice(0, 90) + '" → banka ' + p.ans); };
  let m;
  if ((m = z.match(/napište kořen (x|y): (.+) = (.+)$/))) {
    const [, v, L, R] = m, f = jsVyraz(L), g = jsVyraz(R);
    const d = t => { const arg = PROM.map(q => (q === v ? t : 0)); return f(...arg) - g(...arg); };
    return pouzij('rovnice', () => blizko(d(ans), 0) && !blizko(d(ans + 1), 0));
  }
  if ((m = z.match(/^Řešte soustavu rovnic (.+) = (.+) a (.+) = (.+)\. Napište hodnotu (x|y)\.$/))) {
    const [, L1, R1, L2, R2, v] = m;
    const rov = [[L1, R1], [L2, R2]].map(([L, R]) => { const f = jsVyraz(L), g = jsVyraz(R); return (x, y) => f(0, 0, 0, x, y) - g(0, 0, 0, x, y); });
    const [p1, q1, r1] = [rov[0](1, 0) - rov[0](0, 0), rov[0](0, 1) - rov[0](0, 0), -rov[0](0, 0)];
    const [p2, q2, r2] = [rov[1](1, 0) - rov[1](0, 0), rov[1](0, 1) - rov[1](0, 0), -rov[1](0, 0)];
    const det = p1 * q2 - q1 * p2;
    return pouzij('soustava', () => !blizko(det, 0) && blizko(v === 'x' ? (r1 * q2 - q1 * r2) / det : (p1 * r2 - r1 * p2) / det, ans));
  }
  const dosad = (s, hodnoty) => { let i = 0; return s.replace(/\?/g, () => '(' + hodnoty[Math.min(i++, hodnoty.length - 1)] + ')'); };
  const identitaS = (vyraz, hodnoty) => { const [L, R] = dosad(vyraz, hodnoty).split(' = '); return identita(L, R); };
  if ((m = z.match(/rovnost: (.+?) — napište DRUHÉ/))) {
    const vyraz = m[1];                                  // první „?" neznáme — zkusí se, zda nějaké sedí
    return pouzij('doplň do čtverce', () => { for (let v = -30; v <= 30; v++) if (identitaS(vyraz, [v, ans])) return true; return false; });
  }
  if ((m = z.match(/^Ve výrazu (.+?) napište číslo místo otazníku/)) ||
      (m = z.match(/(?:vzorce|vytknutím) a napište číslo místo otazníku: (.+)$/)) ||
      (m = z.match(/(?:vytknutím|pomocí vzorce|podle vzorce): (.+?)\. Napište číslo místo otazníku\.$/))) {
    return pouzij('identita s ?', () => identitaS(m[1], [ans]));
  }
  if ((m = z.match(/^Upravte výraz (.+?) a rozložte na součin pomocí vzorce\. Napište číslo, které patří místo otazníku v rozkladu (.+?)\.$/))) {
    return pouzij('rozklad (x − ?)²', () => identitaS(m[1] + ' = ' + m[2], [ans]));
  }
  if ((m = z.match(/napište koeficient u ([akny x])(²?): (.+)$/))) {
    return pouzij('koeficient', () => blizko(koeficient(m[3], m[1], m[2] ? 2 : 1), ans));
  }
  if ((m = z.match(/napište absolutní člen \(číslo bez x\): (.+)$/))) {
    return pouzij('absolutní člen', () => blizko(koeficient(m[1], 'x', 0), ans));
  }
  if ((m = z.match(/^Umocněte a výsledek zapište bez závorek: (.+?)\. Napište číslo, které stojí před (a)/))) {
    return pouzij('umocnění', () => blizko(koeficient(m[1], m[2], 1), ans));
  }
  nerozp34.add(poz + ': ' + z.slice(0, 90));
}
for (let b = 0; b < 3000; b++) {
  [[2, 'pozice 3'], [3, 'pozice 4']].forEach(([i, poz]) => {
    (C.genSlot(i).parts || []).forEach(p => {
      try { over34(poz, p); } catch (e) { spatne34.push(poz + ': ' + e.message); }
    });
  });
}
/* Naměřeno 15 600 (pozice 3 má vždy 3 podúlohy, pozice 4 dvě, jen soustava
   tři). Každý z osmi druhů zadání se musí objevit, jinak by se šablona
   mohla v bance změnit a vzor by tiše přestal něco kontrolovat. */
ok(videno34 > 14000, 'pozice 3 a 4: prošlo se ' + videno34 + ' podúloh (podlaha 14 000)', 'naměřeno=' + videno34);
ok(Object.keys(druhy34).length === 8 && Object.values(druhy34).every(n => n >= 100),
  'pozice 3 a 4: všech 8 druhů zadání se v losu objevuje (podlaha 100×)',
  JSON.stringify(druhy34));
ok(nerozp34.size === 0, 'pozice 3 a 4: každé zadání se dalo přečíst (' + Object.keys(druhy34).length + ' druhů)',
  [...nerozp34].slice(0, 3).join(' | '));
ok(spatne34.length === 0, 'pozice 3 a 4: odpověď banky splňuje zadání (kořen, soustava, identita, koeficient)',
  [...new Set(spatne34)].slice(0, 3).join(' | '));

/* ═══ A3) POZICE 6–9 — objem, úhly, obvod, Pythagorova věta ══════════
   Každá varianta má vlastní přepočet ze ZNĚNÍ (úvod + podúloha). U úhlů
   se dané hodnoty čtou z popisků OBRÁZKU — ostré zadání je taky dává jen
   tam, takže žák je čte odtud — a hledané úhly se odvozují z geometrie
   té konfigurace, ne z kódu generátoru. Kde zadání chce zaokrouhlit,
   zaokrouhluje se tady stejně. Neznámý titul je chyba: šablona se změnila
   a kontrola by oslepla. */
const cisla = (s, re) => { const m = String(s).match(re); return m ? m.slice(1).map(x => cislo(x)) : null; };
const stupne = svg => [...String(svg).matchAll(/>(\d+)°</g)].map(m => +m[1]);
const na1 = x => Math.round(x * 10) / 10, naDes = x => Math.round(x / 10) * 10;
const ZLS = { polovinu: 1 / 2, třetinu: 1 / 3, čtvrtinu: 1 / 4, pětinu: 1 / 5, 'dvě pětiny': 2 / 5 };
const V69 = {
  // ── pozice 6 ──
  'Sud': (t, k) => { const [S] = cisla(t.intro, /Dno sudu má obsah (\d+) cm²/), p = t.parts.find(x => x.key === k).prompt;
    if (k === '6.1') { const [mm] = cisla(p, /o (\d+) mm/); return na1(S * mm / 10 / 1000); }
    const [l] = cisla(p, /přibylo v sudu (\d+) l/); return Math.round(l * 1000 / S * 10); },
  'Akvárium': (t, k) => { const [a, b, c] = cisla(t.intro, /dna (\d+) cm × (\d+) cm a výškou (\d+) cm/);
    if (k === '6.1') return a * b * c / 1000;
    const [h] = cisla(t.parts[1].prompt, /do výšky (\d+) cm/); return a * b * h / 1000; },
  'Nádrže': (t, k) => { const p = t.parts.find(x => x.key === k).prompt;
    if (k === '6.1') { const [s, kv] = cisla(p, /pojme (\d+) litrů\. Konev má objem (\d+) litr/); return Math.ceil(s / kv); }
    const [V, r] = cisla(p, /objemu (\d+) litrů se napouští rychlostí (\d+) litr/); return V / r; },
  'Těžítko': (t, k) => { const [R, H, r, h] = cisla(t.intro, /podstavy (\d+) cm a výškou (\d+) cm[\s\S]*podstavy (\d+) cm a výškou (\d+) cm/);
    return k === '6.1' ? naDes(3.14 * R * R * H) : naDes(3.14 * (R * R * H - r * r * h)); },
  'Sud, kbelík a konvička': (t, k) => { const p = t.parts.find(x => x.key === k).prompt;
    if (k === '6.2') { const [N, V] = cisla(p, /na (\d+) krychlí, z nichž každá má objem (\d+) dm³/); return N * V * 1000; }
    const m = p.match(/je (\d+)krát větší než objem kbelíku\. Objem kbelíku je (\d+)krát větší[\s\S]*jsme (.+?) vody odebrali, takže v něm zbylo (\d+) litrů/);
    const f = ZLS[m[3]]; if (f === undefined) throw new Error('zlomek „' + m[3] + '"');
    return (+m[4] / (1 - f)) / (+m[1] * +m[2]); },
  'Přelévání vody': (t, k) => { const [v, d1, d2] = cisla(t.intro, /výšku v = (\d+) cm\. Nádoba A má průměr podstavy (\d+) cm, nádoba B má průměr podstavy (\d+) cm/);
    return k === '6.1' ? v * (d1 / d2) ** 2 : (d2 / d1) ** 2; },
  'Dva sudy': (t, k) => { const m = t.intro.match(/má o (\S+) větší objem než menší sud\. Objem většího sudu je (\d+) litrů/);
    const f = ZLS[m[1]], V = +m[2], men = V / (1 + f); if (f === undefined) throw new Error('zlomek „' + m[1] + '"');
    if (k === '6.1') return men;
    const pct = (V - men) / V * 100; return /desetiny/.test(t.parts[1].prompt) ? na1(pct) : pct; },
  // ── pozice 7 ── (dané úhly z popisků obrázku, hledané z geometrie)
  'Úhly na rovnoběžkách': (t, k) => { const [g] = cisla(t.intro, /velikost (\d+)°/); return k === '7.2' ? 180 - g : g; },
  'Úhly v trojúhelníku': (t, k) => { const [a, b] = cisla(t.intro, /α = (\d+)°[\s\S]*β = (\d+)°/), c = 180 - a - b;
    return k === '7.1' ? c : k === '7.2' ? a + b : Math.max(a, b, c); },
  'Úhly v rovnoramenném trojúhelníku': (t, k) => { const [b] = cisla(t.intro, /každý (\d+)°/);
    return k === '7.1' ? 180 - 2 * b : k === '7.2' ? 180 - b : 2 * b; },
  // α a 30° jsou střídavé; β je střídavý k vedlejšímu úhlu 130°; γ je vedlejší k úhlu
  // pravoúhlého trojúhelníku q, r, t u průsečíku q a t: 180 − (90 − β) = 90 + β.
  'Přímky jedním bodem a kolmice': (t, k) => { const u = stupne(t.svg).sort((x, y) => x - y), be = 180 - u[1];
    if (u.length !== 2) throw new Error('čekal jsem 2 vyznačené úhly, je ' + u.length);
    return k === '7.1' ? u[0] : k === '7.2' ? be : 90 + be; },
  // Trojúhelník X, pata výšky, B: pravý úhel u paty, u X vedlejší k vyznačenému D,
  // takže u B zbývá D − 90 = β/2 = φ. AB je průměr ⇒ úhel u C je pravý (Thalet) ⇒ α = 90 − β.
  'Kružnice opsaná a osa úhlu': (t, k) => { const [D] = stupne(t.svg), fi = D - 90; return k === '7.1' ? fi : 90 - 2 * fi; },
  'Trojúhelník z přímek': (t, k) => { const [E, m, n] = cisla(t.intro, /svírají úhel (\d+)°[\s\S]*v poměru (\d+) : (\d+)/);
    const be = 180 - E, al = E * m / (m + n), ga = E * n / (m + n);
    return k === '7.1' ? be : k === '7.2' ? ga : Math.max(al, be, ga) - Math.min(al, be, ga); },
  // ── pozice 8 ──
  'Záhon': (t, k) => { const m = t.intro.match(/je o (\S+) kratší[\s\S]*celkem (\d+) rostlin[\s\S]*měří (\d+) cm/);
    const f = ZLS[m[1]], N = +m[2], d = +m[3], O = N * d / 100;          // uzavřený obvod: mezer = rostlin
    if (k === '8.1') return O;
    const x = O / (1 + 3 * (1 - f));
    if (k === '8.2') return x * f * 100 / d;
    let min = Infinity;                                                   // r červených + 2 bílé, aspoň 2 úseky
    for (let r = 1; r + 2 <= N / 2; r++) if (N % (r + 2) === 0) min = Math.min(min, r * N / (r + 2));
    return min; },
  'Plot kolem pozemku': (t, k) => { const [a, b, d, n] = cisla(t.intro, /rozměry (\d+) m × (\d+) m[\s\S]*rozestupech (\d+) cm[\s\S]*Celkem je jich (\d+)/);
    if (n !== 2 * (a + b) * 100 / d) throw new Error('úvod tvrdí ' + n + ' sloupků, obvodu odpovídá ' + 2 * (a + b) * 100 / d);
    if (k === '8.1') return 2 * (a + b);
    if (k === '8.2') return (Math.max(a, b) - Math.min(a, b)) * 100 / d;
    const [g] = cisla(t.parts[2].prompt, /po skupinkách po (\d+)/); return n / g; },
  'Oplocení zahrady': (t, k) => { const [a, b] = cisla(t.intro, /rozměry (\d+) m × (\d+) m/), O = 2 * (a + b);
    if (k === '8.1') return O;
    if (k === '8.2') return O * cisla(t.parts[1].prompt, /stojí (\d+) Kč/)[0];
    return O / cisla(t.parts[2].prompt, /po (\d+) metrech/)[0]; },
  'Odstřižené rohy': (t, k) => { const [a, c] = cisla(t.intro, /straně délky (\d+) cm[\s\S]*základna má délku (\d+) cm/), x = (a - c) / 2;
    return k === '8.1' ? x * a : k === '8.2' ? a + c + 2 * Math.hypot(x, a) : (a + c) * a / 2; },
  'Strana trojúhelníku': (t, k) => { const [a, b] = cisla(t.intro, /a = (\d+) cm, b = (\d+) cm/), lo = Math.abs(a - b) + 1, hi = a + b - 1;
    return k === '8.1' ? lo : k === '8.2' ? hi : hi - lo + 1; },
  'Dva pozemky': (t, k) => { const [p, d] = cisla(t.intro, /o (\d+) % kratší[\s\S]*o (\d+) m delší/), q = 1 - p / 100;
    const a = 2 * d / (4 - 2 * (q + 1));                                  // 4a = 2 · (q·a + a + d)
    return k === '8.1' ? a : k === '8.2' ? q * a : Math.abs(a * a - q * a * (a + d)); },
  // ── pozice 9 ──
  'Žebřík u zdi': t => { const [h, d] = cisla(t.intro, /do výšky (\d+) m\. Pata žebříku je od zdi vzdálena (\d+) m/); return Math.hypot(h, d); },
  'Úhlopříčka hřiště': t => { const [a, b] = cisla(t.intro, /rozměry (\d+) m a (\d+) m/); return Math.hypot(a, b); },
  'Drak na provázku': t => { const [c, a] = cisla(t.intro, /dlouhém (\d+) m[\s\S]*vzdáleným (\d+) m/); return Math.sqrt(c * c - a * a); },
  'Rovnoramenný trojúhelník': t => { const [z, O] = cisla(t.intro, /délky (\d+) cm má obvod (\d+) cm/), r = (O - z) / 2;
    return z * Math.sqrt(r * r - z * z / 4) / 2; },
  'Pravoúhlý lichoběžník': t => { const [a, c, v] = cisla(t.intro, /AB = (\d+) cm a CD = (\d+) cm[\s\S]*měří (\d+) cm/);
    return a + c + v + Math.hypot(v, a - c); },
  'Kosočtverec': t => { const [e, f] = cisla(t.intro, /e = (\d+) cm a f = (\d+) cm/); return 4 * Math.hypot(e / 2, f / 2); }
};
const videno69 = {}, nerozp69 = new Set(), spatne69 = [];
let podul69 = 0;
for (const i of [5, 6, 7, 8]) {
  for (let b = 0; b < 2500; b++) {
    const t = C.genSlot(i), f = V69[t.title];
    if (!f) { nerozp69.add('pozice ' + (i + 1) + ': „' + t.title + '"'); continue; }
    videno69[t.title] = (videno69[t.title] || 0) + 1;
    t.parts.forEach(p => {
      podul69++;
      let ceka;
      try { ceka = f(t, p.key); } catch (e) { nerozp69.add(t.title + ' ' + p.key + ': ' + e.message); return; }
      if (!Number.isFinite(ceka) || !blizko(ceka, cislo(p.ans)))
        spatne69.push(t.title + ' ' + p.key + ': banka ' + p.ans + ', ze zadání ' + ceka + ' — „' + String(t.intro || p.prompt).slice(0, 70) + '"');
    });
  }
}
/* Naměřeno ve třech bězích: 10 000 úloh = 22 065–22 085 podúloh, každá z 25
   variant 317–465×. Podlahy leží pod tím s rezervou; rozbitý los dá 0. */
ok(Object.keys(videno69).length === 25 && Object.values(videno69).every(n => n >= 150),
  'pozice 6–9: všech 25 variant se v losu objevuje (podlaha 150×)', JSON.stringify(videno69));
ok(podul69 > 20000, 'pozice 6–9: dopočítáno ' + podul69 + ' podúloh (podlaha 20 000)', 'naměřeno=' + podul69);
ok(nerozp69.size === 0, 'pozice 6–9: každé zadání se dalo přečíst', [...nerozp69].slice(0, 3).join(' | '));
ok(spatne69.length === 0, 'pozice 6–9: odpověď banky se shoduje s dopočtem ze zadání',
  [...new Set(spatne69)].slice(0, 3).join(' | '));

/* ═══ B) ROVNOSTI V POSTUPECH — celý test ═══════════════════════════
   Každé „výraz = výsledek" z čistých čísel se vyhodnotí. Od rovnítka se
   na obě strany bere CELÝ souvislý aritmetický úsek (číslice, · : + −,
   závorky, desetinná čárka mezi číslicemi). Úsek přilepený k proměnné,
   procentu, zlomku nebo mocnině se zahodí: „(2x − 3 + 1) = 34" není
   rovnost čísel „3 + 1 = 34", a první verze kontroly, která vybírala
   úseky regulárním výrazem, přesně takhle hlásila plané poplachy.
   Dvojtečka bez mezery před sebou je za popiskem („Úterý: 240 · 1,25"),
   ne dělení („50 : 2"). */
const ARITZ = /[\d·×:+−()\s,]/;
const PRILEPENO = /[\p{L}\d)²³%/√]/u;            // znak, na který úsek navazuje → není samostatný
function rovnostiVKroku(k) {
  const out = [];
  const pust = j => {
    const ch = k[j];
    if (!ARITZ.test(ch)) return false;
    if (ch === ':' && k[j - 1] !== ' ') return false;
    if (ch === ',' && !(/\d/.test(k[j - 1] || '') && /\d/.test(k[j + 1] || ''))) return false;
    return true;
  };
  for (let i = k.indexOf('='); i >= 0; i = k.indexOf('=', i + 1)) {
    let a = i; while (a > 0 && pust(a - 1)) a--;
    let b = i + 1; while (b < k.length && pust(b)) b++;
    const L = k.slice(a, i).trim(), R = k.slice(i + 1, b).trim();
    const pred = k.slice(0, a).replace(/\s+$/, '').slice(-1);
    const za = k.slice(b).replace(/^\s+/, '').charAt(0);
    if (!/\d/.test(L) || !/\d/.test(R)) continue;
    if (!/[·×:+−]/.test(L.replace(/^−/, ''))) continue;                 // vlevo musí být výpočet
    // Přilepené bez mezery („√81", „3/5", „x2"): úsek je jen kus většího zápisu.
    if (!/\s/.test(k[a] || '') && a > 0 && PRILEPENO.test(k[a - 1])) continue;
    if (!/\s/.test(k[b - 1] || '') && /[\p{L}(²³/%]/u.test(k[b] || '')) continue;   // „= 12x", „= 3²"
    // Začíná-li úsek operátorem, pokračuje výraz, který stojí vlevo od něj:
    // „(2x − 3 + 1) = 34". Unární minus je v pořádku jen po rovnítku, závorce
    // nebo popisku („= −42", „Úterý: −5 + 9").
    if (/^[·×:+]/.test(L) || (/^−/.test(L) && PRILEPENO.test(pred))) continue;
    if (/[·×:+−(]$/.test(L) || /[·×:+−(]$/.test(R)) continue;
    if (/[%/²³]/.test(za)) continue;                                       // „= 45 %", „= 6/25"
    out.push([L, R]);
  }
  return out;
}
function spocti(vyraz) {
  let e = vyraz.replace(/(\d) (?=\d{3}\b)/g, '$1').replace(/[·×]/g, '*').replace(/:/g, '/')
    .replace(/−/g, '-').replace(/,/g, '.').replace(/\s+/g, '');
  const otev = (e.match(/\(/g) || []).length, zav = (e.match(/\)/g) || []).length;
  if (zav > otev) e = '('.repeat(zav - otev) + e; else if (otev > zav) e += ')'.repeat(otev - zav);
  if (!/^[\d+\-*/().]+$/.test(e)) return null;
  try { const v = Function('"use strict";return (' + e + ')')(); return Number.isFinite(v) ? v : null; } catch (err) { return null; }
}
const kroky = t => {
  const v = [];
  const pridej = s => (Array.isArray(s) ? s : [s]).forEach(x => typeof x === 'string' && v.push(x));
  if (t.kind === 'match') (t.sol || []).forEach(pridej); else if (t.sol) pridej(t.sol);
  (t.parts || []).forEach(p => pridej(p.sol));
  (t.statements || []).forEach(s => s && pridej(s.sol));
  return v;
};
let rovnosti = 0;
const nesedi = new Set(), rovnostiNaPozici = {};
for (let i = 0; i < C.slotCount(); i++) {
  for (let b = 0; b < 600; b++) {
    kroky(C.genSlot(i)).forEach(k => {
      for (const [Ls, Rs] of rovnostiVKroku(k)) {
        const l = spocti(Ls), p = spocti(Rs);
        if (l === null || p === null) continue;
        rovnosti++; rovnostiNaPozici[i + 1] = (rovnostiNaPozici[i + 1] || 0) + 1;
        if (!blizko(l, p)) nesedi.add('pozice ' + (i + 1) + ': „' + Ls + ' = ' + Rs + '" (vyjde ' + +l.toFixed(6) + ') v „' + k.slice(0, 70) + '…"');
      }
    });
  }
}
ok(rovnosti > 20000, 'v postupech se vyhodnotilo ' + rovnosti + ' rovností (' + Object.keys(rovnostiNaPozici).length + ' pozic ze 16)',
  'naměřeno=' + rovnosti);
ok(nesedi.size === 0, 'každá rovnost v postupu platí', [...nesedi].slice(0, 3).join(' | '));

/* ═══ C) ZNAMÉNKO MINUS ════════════════════════════════════════════
   Záporné číslo se v textu píše pravým minusem (−), ne spojovníkem.
   `cz()` záporné číslo převede na „-3,5", takže každé místo, kde může
   vyjít záporný mezivýsledek, musí jít přes `zn()`. Naměřeno před
   opravou: pozice 2 (593 různých textů, „(−3) · 6/16 = -18/16" i „-3,5 ·
   -1,5" bez závorky), pozice 8 („Rozdíl: 40 − 50 = -10" — tam byla
   navíc „delší" strana kratší) a pozice 14 (volba „E) -10" u otázky
   „o kolik více"). */
let textu = 0;
const spojovnik = new Set();
for (let i = 0; i < C.slotCount(); i++) {
  for (let b = 0; b < 1000; b++) {
    const t = C.genSlot(i);
    [t.intro, t.prompt, ...(t.prompts || []), ...(t.options || []),
      ...(t.parts || []).map(p => p.prompt), ...(t.statements || []).map(x => x && x.text), ...kroky(t)]
      .filter(x => typeof x === 'string').forEach(z => {
        textu++;
        const m = z.match(/(^|[\s(=:·×+−])-\d/);
        if (m) spojovnik.add('pozice ' + (i + 1) + ': „…' + z.slice(Math.max(0, m.index - 25), m.index + 20) + '…"');
      });
  }
}
ok(textu > 100000, 'prošlo se ' + textu + ' textů (zadání, volby, kroky)', 'naměřeno=' + textu);
ok(spojovnik.size === 0, 'záporná čísla mají pravé minus (−), ne spojovník', [...spojovnik].slice(0, 3).join(' | '));

/* ═══ D) GENERÁTOR NESMÍ ZAMRZNOUT ═════════════════════════════════
   gen14f (pozice 14, „Návštěvnost") hledala druhý měsíc s JINOU výškou
   sloupce tak, že přelosovávala jen měsíc. Když vyšlo všech pět sloupců
   stejně (1 : 38 416), cyklus neskončil. Tady se ta situace vynutí:
   první losování vybere poslední variantu pozice 14, dalších pět dá
   sloupcům stejnou výšku. */
{
  const puvodni = global.ri;
  let n = 0;
  global.ri = (a, b) => {
    if (++n > 100000) throw new Error('zacyklení');
    if (n === 1) return b;                       // pick() → poslední varianta pozice 14
    if (n <= 6) return 7;                        // pět sloupců stejně vysokých (70)
    return Math.floor(Math.random() * (b - a + 1)) + a;
  };
  let t14;
  try { t14 = C0.genSlot(13); } catch (e) { t14 = e; }
  global.ri = puvodni;
  ok(t14 && !(t14 instanceof Error) && t14.title === 'Návštěvnost',
    'pozice 14 nezamrzne, ani když mají všechny sloupce grafu stejnou výšku',
    t14 instanceof Error ? t14.message : 'vylosovala se jiná úloha: ' + (t14 && t14.title) + ' — uprav pořadí losování v testu');
}

console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
