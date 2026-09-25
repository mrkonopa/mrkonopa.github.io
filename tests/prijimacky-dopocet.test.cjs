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
        rovnice), 3 (porovnání mnohočlenů), 6–9 a 12–14 (geometrie,
        úlohy s volbami) a 1–2 (přesný výpočet výrazu ve zlomcích),
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
  const t = o.slice(3).trim().replace(/^o\s+/, '');                          // „o 37 cm³", „o jiný objem"
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
const cisloAns = a => {                          // „−4/9" i „2,5" → číslo
  const t = String(a).replace('−', '-').replace(',', '.'), z = /^(-?\d+)\/(\d+)$/.exec(t);
  return z ? z[1] / z[2] : Number(t);
};

const nerozp34 = new Set(), spatne34 = [], druhy34 = {};
let videno34 = 0;
function over34(poz, p) {
  videno34++;
  const z = p.prompt, ans = cisloAns(p.ans);
  const pouzij = (druh, fn) => { druhy34[poz + ': ' + druh] = (druhy34[poz + ': ' + druh] || 0) + 1; if (!fn()) spatne34.push(poz + ' ' + druh + ': „' + z.slice(0, 90) + '" → banka ' + p.ans); };
  let m;
  if ((m = z.match(/^Řešte rovnici: (.+) = (.+)$/))) {
    const [, L, R] = m, v = /y/.test(L + R) ? 'y' : 'x', f = jsVyraz(L), g = jsVyraz(R);
    const d = t => { const arg = PROM.map(q => (q === v ? t : 0)); return f(...arg) - g(...arg); };
    /* „nemá řešení" / „nekonečně mnoho řešení": rozdíl stran nesmí na neznámé
       záviset vůbec a jeho hodnota rozhodne — nenulová = žádný kořen, nula = každé číslo. */
    if (/řešení/.test(String(p.ans))) {
      const konst = [-3, 0, 1, 5, 12].every(t => blizko(d(t), d(0)));
      return pouzij('rovnice bez jediného kořene', () => konst && (/nemá/.test(p.ans) ? !blizko(d(0), 0) : blizko(d(0), 0)));
    }
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
  if ((m = z.match(/napište absolutní člen \(číslo bez ([akny x])\): (.+)$/))) {
    return pouzij('absolutní člen', () => blizko(koeficient(m[2], m[1], 0), ans));
  }
  if ((m = z.match(/^Vypočítejte pro ([akny x]) = (−?\d+): (.+) =$/))) {
    return pouzij('dosazení', () => { const hodnota = cisloAns(m[2]); return blizko(jsVyraz(m[3])(...PROM.map(q => (q === m[1] ? hodnota : 0))), ans); });
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
   tři). Každý z deseti druhů zadání (od 2026-09-25 i rovnice bez jediného
   kořene — „nemá řešení" a „nekonečně mnoho" — a dosazení do výrazu) se musí objevit, jinak by se šablona
   mohla v bance změnit a vzor by tiše přestal něco kontrolovat. */
ok(videno34 > 14000, 'pozice 3 a 4: prošlo se ' + videno34 + ' podúloh (podlaha 14 000)', 'naměřeno=' + videno34);
ok(Object.keys(druhy34).length === 10 && Object.values(druhy34).every(n => n >= 100),
  'pozice 3 a 4: všech 10 druhů zadání se v losu objevuje (podlaha 100×)',
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
const tv = (t, k) => t.statements[+k.split('.')[1] - 1].text;
// Popisky výsečí kruhového diagramu v pořadí kreslení: [úhel nebo procento?, jméno] za každou výsečí.
const popiskyVyseci = svg => String(svg).split('<path').slice(1).map(ch => [...ch.matchAll(/>([^<]+)<\/text>/g)].map(m => m[1]));
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
  'Kosočtverec': t => { const [e, f] = cisla(t.intro, /e = (\d+) cm a f = (\d+) cm/); return 4 * Math.hypot(e / 2, f / 2); },
  // ── pozice 5 ──
  'Pozemek': (t, k) => { const [c] = cisla(t.intro, /stranou c = (\d+) m/), S = c * c;
    if (k === '5.1') return (S / 5) / (c / 2);
    const [p] = cisla(t.parts[1].prompt, /představuje (\d+) %/); return S - S / 5 - S * p / 100; },
  'Zahrada': (t, k) => { const [L, W] = cisla(t.intro, /rozměry (\d+) m × (\d+) m/), S = L * W;
    if (k === '5.1') return (S / 4) / cisla(t.parts[0].prompt, /Délka záhonu je (\d+) m/)[0];
    const [p] = cisla(t.parts[1].prompt, /zabírá (\d+) %/); return S - S / 4 - S * p / 100; },
  'Místnost': (t, k) => { const [L, W] = cisla(t.intro, /rozměry (\d+) m × (\d+) m/);
    if (k === '5.1') return L * W;
    const [a, b] = cisla(t.parts[1].prompt, /koberec (\d+) m × (\d+) m/); return L * W - a * b; },
  'Salát podle receptu': (t, k) => { const [R, U, G, g] = cisla(t.intro, /obsahujícího (\d+) g rajčat celkem (\d+) g cukru[\s\S]*každých (\d+) g rajčat pouze (\d+) g/);
    const rec = R / G * g; return k === '5.1' ? rec : (U - rec) / rec * 100; },
  'Dva běžci': (t, k) => { const [DA, TA, DB, tt] = cisla(t.intro, /běžel (\d+)kilometrový okruh[\s\S]*za (\d+) minut[\s\S]*pouze (\d+)kilometrový[\s\S]*po (\d+) minutách/);
    const zbyva = DA - DA * tt / TA, bara = DB - zbyva;                    // stejná zbývající vzdálenost
    return k === '5.1' ? bara : tt * DB / bara; },
  // ── pozice 10 ──
  'Podobné trojúhelníky': t => { const [kk, s] = cisla(t.parts[0].prompt, /k = (\d+)\. Strana menšího trojúhelníku měří (\d+) cm/); return kk * s; },
  'Měřítko mapy': t => { const [kk, d] = cisla(t.parts[0].prompt, /1 : (\d+) je úsečka dlouhá (\d+) cm/); return d * kk / 100; },
  'Měřítko modelu': t => { const [kk, m] = cisla(t.parts[0].prompt, /měřítku 1 : (\d+)\. Na modelu měří budova (\d+) cm/); return m * kk / 100; },
  'Mapa a trasa': t => { const [a, b, D] = cisla(t.parts[0].prompt, /(\d+(?:,\d+)?) cm na turistické mapě je ve skutečnosti (\d+) m\. Trasa je ve skutečnosti dlouhá (\d+(?:,\d+)?) km/);
    return D * 1000 * a / b; },
  'Plocha podle měřítka': t => { const [kk, S] = cisla(t.parts[0].prompt, /1 : ([\d ]+) má pozemek obsah (\d+) cm²/); return S * kk * kk / 10000; },
  'Obsah podobných trojúhelníků': t => { const [o1, o2, S1] = cisla(t.parts[0].prompt, /obvody (\d+) cm a (\d+(?:,\d+)?) cm\. Menší z nich má obsah (\d+) cm²/);
    return S1 * (o2 / o1) ** 2; },
  // ── pozice 16 ── Obrazce se tady STAVÍ (simulace), ne počítají vzorcem, který
  // používá generátor: síť se vybarvuje pole po poli, roboti běží sekundu po sekundě,
  // trojúhelníčky šestiúhelníku se počítají na mřížce.
  'Rámeček': (t, k) => { const [R] = cisla(t.intro, /širokým (\d+) cm/), p = t.parts.find(x => x.key === k).prompt, [w] = cisla(p, /(?:stranu|o straně) (\d+) cm/);
    return k === '16.2' ? (w + 2 * R) ** 2 - w * w : w + 2 * R; },
  'Obraz v rámu': (t, k) => { const [R] = cisla(t.intro, /širokým (\d+) cm/), [L, W] = cisla(t.parts[0].prompt, /rozměry (\d+) cm × (\d+) cm/);
    if (k === '16.1') return L + 2 * R;
    if (k === '16.2') return (L + 2 * R) * (W + 2 * R) - L * W;
    return cisla(t.parts[2].prompt, /kratší stranu (\d+) cm/)[0] + 2 * R; },
  'Chodník kolem bazénu': (t, k) => { const [a, b, w] = cisla(t.intro, /bazén (\d+) m × (\d+) m[\s\S]*širokým (\d+) m/);
    return k === '16.1' ? a + 2 * w : k === '16.2' ? b + 2 * w : (a + 2 * w) * (b + 2 * w) - a * b; },
  'Trojúhelníkové obrazce': (t, k) => {
    const obr = []; let b = 1, s = 0;                                          // [bílé, šedé] po obrazcích
    for (let i = 1; i <= 14; i++) { obr[i] = [b, s]; s += b; b *= 3; }        // každý bílý → 3 bílé + 1 šedý
    const p = t.parts.find(x => x.key === k).prompt;
    if (k === '16.1') return obr[cisla(p, /obsahuje (\d+)\. obrazec/)[0]][0];
    if (k === '16.2') { const [m, G] = cisla(p, /^(\d+)\. obrazec obsahuje (\d+) šedých/);
      if (obr[m][1] !== G) throw new Error(m + '. obrazec má ' + obr[m][1] + ' šedých, zadání tvrdí ' + G);
      return obr[m + 1][1]; }
    const [D] = cisla(p, /liší o ([\d ]+)\./), i = obr.findIndex((o, j) => j > 1 && o && o[1] - obr[j - 1][1] === D);
    if (i < 0) throw new Error('rozdíl ' + D + ' neodpovídá žádné dvojici obrazců');
    return obr[i][0]; },
  'Roboti a míčky': (t, k) => {
    const RAD = { druhé: 2, třetí: 3, čtvrté: 4, páté: 5, šesté: 6 }, POR = { desáté: 10, dvacáté: 20, třicáté: 30 };
    const m = t.intro.match(/v každé (\S+) sekundě (\d+) míč\S* najednou a Pat v každé (\S+) sekundě z nádoby (\d+) míč/);
    const [p, dp, r, dr] = [RAD[m[1]], +m[2], RAD[m[3]], +m[4]];
    const stav = [0], zm = [0];
    for (let s = 1; s <= 400; s++) { zm[s] = 1 + (s % p === 0 ? dp : 0) - (s % r === 0 ? dr : 0); stav[s] = stav[s - 1] + zm[s]; }
    const pr = t.parts.find(x => x.key === k).prompt;
    if (k === '16.1') return stav[cisla(pr, /na konci (\d+)\. sekundy/)[0]];
    if (k === '16.2') { const [X] = cisla(pr, /překročil (\d+)/); return stav.findIndex(v => v > X); }
    const mm = pr.match(/zvětšil celkem o (\d+)\.[\s\S]*právě po (\S+)\./);
    let n = 0; for (let s = 1; s <= 400; s++) if (zm[s] === +mm[1] && ++n === POR[mm[2]]) return stav[s];
    throw new Error('zvětšení o ' + mm[1] + ' nenastalo dost často'); },
  'Vkládané čtverce': (t, k) => {
    const obrazec = n => {                                                     // díly: {barva, obsah}
      const d = []; for (let j = 1; j < n; j++) for (let i = 0; i < 4; i++) d.push({ bila: j % 2 === 1, obsah: 1 / 2 ** (j + 2) });   // čtverec j má 1/2^(j−1), jeho 4 rohy dohromady polovinu
      d.push({ bila: n % 2 === 1, obsah: 1 / 2 ** (n - 1) }); return d; };
    const pr = t.parts.find(x => x.key === k).prompt;
    if (k === '16.1') return obrazec(cisla(pr, /obsahuje (\d+)\. obrazec/)[0]).filter(x => !x.bila).length;
    if (k === '16.2') { const [W] = cisla(pr, /obsahuje (\d+) bílých/); for (let n = 1; n < 300; n++) if (obrazec(n).filter(x => x.bila).length === W) return n; }
    const d = obrazec(cisla(pr, /obsahu (\d+)\. obrazce/)[0]);
    const celk = d.reduce((a, x) => a + x.obsah, 0);
    if (Math.abs(celk - 1) > 1e-12) throw new Error('díly nedávají celý obrazec: ' + celk);
    return d.filter(x => !x.bila).reduce((a, x) => a + x.obsah, 0); },
  'Šestiúhelníkové obrazce': (t, k) => {
    const pocet = n => { let bi = 0, se = 0; const r3 = Math.sqrt(3);          // trojúhelníčky uvnitř šestiúhelníku o straně n
      for (let j = -2 * n; j < 2 * n; j++) for (let i = -3 * n; i <= 3 * n; i++) [[0, 1 / 3, 1 / 3], [1, 2 / 3, 2 / 3]].forEach(([dn, dx, dy]) => {
        const x = i + dx + (j + dy) / 2, y = (j + dy) * r3 / 2;
        if (Math.abs(y) <= n * r3 / 2 && r3 * Math.abs(x) + Math.abs(y) <= r3 * n) { if (dn) se++; else bi++; } });
      return { bi, se }; };
    const pr = t.parts.find(x => x.key === k).prompt;
    if (k === '16.1') { const [n] = cisla(pr, /pás (\d+)\. obrazce/), a = pocet(n), b = pocet(n - 1); return a.bi + a.se - b.bi - b.se; }
    if (k === '16.2') return pocet(cisla(pr, /celý (\d+)\. obrazec/)[0]).se;
    const [G] = cisla(pr, /pásu (\d+) šedých/);
    for (let n = 1; n < 120; n++) if (pocet(n).se - pocet(n - 1).se === G) return n;
    throw new Error('žádný obrazec nemá v pásu ' + G + ' šedých'); },
  'Vybarvování sítě': (t, k) => {
    const pole = new Map([['0,0', 1]]), pridano = [0, 1];                     // pole → pořadí obrazce, kdy přibylo
    for (let n = 2; n <= 40; n++) {
      const nova = [];
      for (const kl of pole.keys()) { const [x, y] = kl.split(',').map(Number);
        for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const c = (x + dx) + ',' + (y + dy);
          if (pole.has(c) || nova.includes(c)) continue;
          const [cx, cy] = [x + dx, y + dy];
          if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ey]) => pole.has((cx + ex) + ',' + (cy + ey)))) nova.push(c); } }
      nova.forEach(c => pole.set(c, n)); pridano[n] = nova.length;
    }
    const barvy = n => { let sv = 0, tm = 0; for (const v of pole.values()) if (v <= n) { if (v % 2) sv++; else tm++; } return { sv, tm }; };
    const pr = t.parts.find(x => x.key === k).prompt;
    if (k === '16.1') return pridano[cisla(pr, /jsme z (\d+)\. obrazce/)[0] + 1];
    if (k === '16.2') { const b = barvy(cisla(pr, /v (\d+)\. obrazci/)[0]); return Math.abs(b.sv - b.tm); }
    const [D] = cisla(pr, /má (\d+) tmavých/);
    for (let n = 2; n <= 40; n += 2) if (barvy(n).tm === D) return barvy(n).sv;
    throw new Error('žádný sudý obrazec nemá ' + D + ' tmavých polí'); },
  'Mirek a Zuzka': (t, k) => {
    const sl = []; for (let m = 1; m <= 1000; m++) { sl.push(m); if (m % 2 === 0) sl.push(m - 1 + m); }
    const pr = t.parts.find(x => x.key === k).prompt;
    if (k === '16.1') { const [a] = cisla(pr, /mezi čísly (\d+) a/); const i = sl.findIndex((v, j) => v === a && sl[j + 2] === a + 1); return sl[i + 1]; }
    if (k === '16.2') { const [P] = cisla(pr, /Jako (\d+)\./), C = sl[P - 1], j = sl.indexOf(C, P); return sl[j - 1]; }
    const [L] = cisla(pr, /prvními (\d+) vyslovenými/), cet = {};
    sl.slice(0, L).forEach(v => { cet[v] = (cet[v] || 0) + 1; });
    return Math.max(...Object.keys(cet).filter(v => cet[v] >= 2).map(Number)); },
  // Počet obdélníčků z OBSAHU pásu (obrazec² − bílý čtverec²) : 6, ne z délky řady jako generátor.
  'Obrazce z obdélníčků': (t, k) => {
    const kusy = (O, w) => (O * O - (O - 2 * w) ** 2) / 6;                    // tmavý pás w = 2, světlý w = 3
    const pr = t.parts.find(x => x.key === k).prompt;
    if (k === '16.1') return kusy(cisla(pr, /tmavého obrazce je (\d+) cm/)[0], 2);
    if (k === '16.2') { const [B] = cisla(pr, /obrazce je (\d+) cm/); return Math.abs(kusy(B, 2) - kusy(B, 3)); }
    const [D] = cisla(pr, /liší o (\d+) cm/);
    for (let tt = 1; tt < 200; tt++) { const s = tt + D; if (kusy(s + 4, 2) === kusy(tt + 6, 3) && Number.isInteger(kusy(s + 4, 2))) return kusy(s + 4, 2); }
    throw new Error('žádná dvojice obrazců se stejným počtem'); },
  // ── pozice 11 (tvrzení A/N): přepočet vrací PRAVDIVOST tvrzení ──
  /* Hodnoty z diagramů se čtou z popisků OBRÁZKU (výseč → její úhel nebo
     procento), protože žák je má jen tam. Výseč bez popisku musí být
     právě jedna a dopočítá se do plného úhlu. */
  'Kvádry': (t, k) => { const d = cisla(t.intro, /hrany délek (\d+) cm, (\d+) cm a (\d+) cm/), s = tv(t, k);
    if (k === '11.1') return cisla(s, /je (\d+) cm\./)[0] === 4 * (d[0] + d[1] + d[2]);
    const [z, na, X] = cisla(s, /délky (\d+) cm prodlouží na (\d+) cm, \S+ kvádru se zvětší o (\d+) cm/), e = d.slice();
    e[d.indexOf(z)] = na;
    const S = ([x, y, w]) => 2 * (x * y + y * w + x * w), V = ([x, y, w]) => x * y * w;
    return k === '11.2' ? S(e) - S(d) === X : V(e) - V(d) === X; },
  'Krychle': (t, k) => { const [a] = cisla(t.intro, /hranu délky (\d+) cm/), s = tv(t, k);
    if (k === '11.1') return cisla(s, /je (\d+) cm\./)[0] === 12 * a;
    if (k === '11.2') return cisla(s, /je (\d+) cm²/)[0] === 6 * a * a;
    const KRAT = { dvakrát: 2, třikrát: 3, čtyřikrát: 4, šestkrát: 6, osmkrát: 8 };
    return KRAT[s.match(/má (\S+) větší objem/)[1]] === (2 * a) ** 3 / a ** 3; },
  'Tělesa': (t, k) => { const [a, b, c] = cisla(t.intro, /hrany délek (\d+) cm, (\d+) cm a (\d+) cm/), s = tv(t, k);
    if (k === '11.1') return cisla(s, /je (\d+) cm³/)[0] === a * b * c;
    if (k === '11.2') return cisla(s, /je (\d+) cm²/)[0] === 2 * (a * b + b * c + a * c);
    const [, n, co] = s.match(/má (\d+) (\S+)\./); return +n === { stěn: 6, hran: 12, vrcholů: 8 }[co]; },
  'Turistická mapa': (t, k) => {
    const [a, b] = cisla(t.intro, /Každ\S+ ([\d,]+) cm na turistické mapě rovinaté oblasti je ve skutečnosti (\d+) m/);
    const [V] = cisla(t.intro, /trasy je přesně ([\d,]+) km, což je trojnásobek/), mNaCm = b / a, s = tv(t, k);
    if (k === '11.1') { const [mm, h] = cisla(s, /měří (\d+) mm, je ve skutečnosti delší než ([\d,]+) km/); return mm / 10 * mNaCm > h * 1000; }
    if (k === '11.2') return blizko((V - V / 3) * 1000 / mNaCm, cisla(s, /o ([\d,]+) cm delší/)[0]);
    return blizko(mNaCm * 100, cisla(s, /je 1 : (\d[\d ]*\d)\./)[0]); },
  'Kruhový diagram zahrady': (t, k) => {
    const uhel = {};
    popiskyVyseci(t.svg).forEach(tx => { uhel[tx[tx.length - 1]] = tx.length > 1 ? parseInt(tx[0], 10) : null; });
    const bez = Object.keys(uhel).filter(n => uhel[n] === null);
    if (bez.length !== 1) throw new Error('výsečí bez popisku je ' + bez.length);
    uhel[bez[0]] = 360 - Object.values(uhel).reduce((x, y) => x + (y || 0), 0);
    const [Am] = cisla(t.intro, /Magnolie zabírají plochu o rozloze (\d+) m²/), m2 = u => u * Am / uhel.magnolie, s = tv(t, k);
    if (k === '11.1') return blizko(m2(uhel['jabloně'] - uhel.magnolie), cisla(s, /o (\d+) m² větší/)[0]);
    if (k === '11.2') return blizko((uhel.levandule + uhel.bazalka) / uhel.hortenzie, cisla(s, /zabírají ([\d,]+)krát/)[0]);
    return m2(uhel['růže']) < cisla(s, /menší než (\d+) m²/)[0]; },
  'Náklad lodi': (t, k) => {
    const pod = {}; popiskyVyseci(t.svg).forEach(tx => { pod[tx[1]] = parseInt(tx[0], 10); });
    const [Xb, Xk] = cisla(t.intro, /veze (\d+) tun banánů a (\d+) tun kávy/), s = tv(t, k);
    if (!blizko(Xb / pod['banány'], Xk / pod['káva'])) throw new Error('tuny banánů a kávy nesedí s diagramem');
    if (pod['rýže'] + pod.cukr + pod['káva'] + pod['banány'] !== 100) throw new Error('diagram nedává 100 %');
    if (k === '11.1') {
      const ZL = { jednu: 1, dvě: 2, tři: 3, čtyři: 4 }, JM = { polovin: 2, třetin: 3, čtvrtin: 4, pětin: 5, desetin: 10, dvacetin: 20 };
      const [, c, j] = s.match(/dohromady (?:(\S+) )?(\S+?)[yu] celkové/);           // „polovinu" bez číslovky
      return blizko((c ? ZL[c] : 1) / JM[j], (pod['káva'] + pod['banány']) / 100); }
    if (k === '11.2') { const [m, n] = cisla(s, /je (\d+) ∶ (\d+)\./); return blizko(m / n, pod['káva'] / pod['rýže']); }
    return blizko(Xk / pod['káva'] * pod['rýže'], cisla(s, /veze ([\d,]+) t rýže/)[0]); },
  'Pravidelný mnohoúhelník': (t, k) => {
    const N = { pětiúhelníku: 5, šestiúhelníku: 6, osmiúhelníku: 8, devítiúhelníku: 9, desetiúhelníku: 10, dvanáctiúhelníku: 12 };
    const n = N[t.intro.match(/pravidelného (\S+) se středem/)[1]], al = 360 / n, be = (180 - al) / 2, ga = 180 - al, s = tv(t, k);
    if (t.svg.match(/<polygon points="([^"]+)"/)[1].trim().split(/\s+/).length !== n) throw new Error('obrázek nemá ' + n + ' vrcholů');
    if (k === '11.1') return blizko(al, cisla(s, /α = ([\d,]+)°/)[0]);
    if (k === '11.2') return be < cisla(s, /β < ([\d,]+)°/)[0];
    const VZ = { 'γ = 2 · β': blizko(ga, 2 * be), 'α + γ = 180°': blizko(al + ga, 180), 'γ = α': blizko(ga, al), 'α + β = 90°': blizko(al + be, 90) };
    if (!(s in VZ)) throw new Error('neznámý vztah „' + s + '"');
    return VZ[s]; },
  // Strana kosočtverce je přepona trojúhelníku s odvěsnami a/2 a b (obrázek: polovina obdélníku rozdělená úhlopříčkou).
  'Obdélník a kosočtverec': (t, k) => { const [a, b] = cisla(t.intro, /stranami délek (\d+) cm a (\d+) cm/), s = tv(t, k);
    const str = Math.hypot(a / 2, b);
    if (k === '11.1') return /je stejný jako obsah/.test(s);
    return blizko(k === '11.2' ? str : a * b / str, cisla(s, /měří ([\d,]+) cm/)[0]); }
};
const POZ69 = [4, 5, 6, 7, 8, 9, 10, 15], POPIS69 = 'pozice 5–11 a 16';
const videno69 = {}, nerozp69 = new Set(), spatne69 = [];
let podul69 = 0;
/* Odpověď může být zlomek („5/16"): porovnává se hodnota a zlomek musí být
   v základním tvaru, jak zadání žádá. */
const hodnota = s => { const m = String(s).match(/^(\d+)\/(\d+)$/); return m ? m[1] / m[2] : cislo(s); };
for (const i of POZ69) {
  for (let b = 0; b < 2500; b++) {
    const t = C.genSlot(i), f = V69[t.title];
    if (!f) { nerozp69.add('pozice ' + (i + 1) + ': „' + t.title + '"'); continue; }
    videno69[t.title] = (videno69[t.title] || 0) + 1;
    // Tvrzení A/N se dopočítávají stejně jako podúlohy; přepočet vrací pravdivost.
    (t.statements ? t.statements.map((st, j) => ({ key: t.no + '.' + (j + 1), ans: st.ans, prompt: st.text })) : t.parts).forEach(p => {
      podul69++;
      let ceka;
      try { ceka = f(t, p.key); } catch (e) { nerozp69.add(t.title + ' ' + p.key + ': ' + e.message); return; }
      if (typeof ceka === 'boolean') {
        if (ceka !== (p.ans === 'A')) spatne69.push(t.title + ' ' + p.key + ': banka ' + p.ans + ', ze zadání ' + (ceka ? 'A' : 'N') + ' — „' + p.prompt.slice(0, 70) + '"');
        return;
      }
      const zl = String(p.ans).match(/^(\d+)\/(\d+)$/);
      if (zl && gcd(+zl[1], +zl[2]) !== 1) spatne69.push(t.title + ' ' + p.key + ': zlomek ' + p.ans + ' není v základním tvaru');
      if (!Number.isFinite(ceka) || !blizko(ceka, hodnota(p.ans)))
        spatne69.push(t.title + ' ' + p.key + ': banka ' + p.ans + ', ze zadání ' + ceka + ' — „' + String(t.intro || p.prompt).slice(0, 70) + '"');
    });
  }
}
const var69 = Object.keys(V69).length;
/* Naměřeno ve třech bězích (pozice 6–9): 10 000 úloh = 22 065–22 085 podúloh,
   každá z 25 variant 317–465×. S pozicí 16 (10 variant, 2 500 úloh) přibylo
   7 500 podúloh a každá její varianta padne ~250×; pozice 5 a 10 (11 variant)
   přidaly dalších 7 500 a pozice 11 (8 variant tvrzení A/N) dalších 7 500
   (celkem naměřeno 44 578). Podlahy leží pod tím s rezervou; rozbitý los dá 0. */
ok(Object.keys(videno69).length === var69 && Object.values(videno69).every(n => n >= 150),
  POPIS69 + ': všech ' + var69 + ' variant se v losu objevuje (podlaha 150×)', JSON.stringify(videno69));
ok(podul69 > 41000, POPIS69 + ': dopočítáno ' + podul69 + ' podúloh (podlaha 41 000)', 'naměřeno=' + podul69);
ok(nerozp69.size === 0, POPIS69 + ': každé zadání se dalo přečíst', [...nerozp69].slice(0, 3).join(' | '));
ok(spatne69.length === 0, POPIS69 + ': odpověď banky se shoduje s dopočtem ze zadání',
  [...new Set(spatne69)].slice(0, 3).join(' | '));

/* ═══ A4) POZICE 12–14 — úlohy s výběrem odpovědi ═════════════════════
   Výsledek se spočítá ze ZNĚNÍ a musí být mezi volbami právě jednou, pod
   písmenem, které banka označila za správné. Když v nabídce není, platí
   krajní „jiný…" — i to se ostrým testům stává. Volby musí být seřazené
   (vzestupně, nebo sestupně) jako na ostrém testu. Hodnoty grafů se čtou
   z popisků OBRÁZKU. Neznámý titul je chyba (kontrola by oslepla). */
const SLOVA = { čtyřmi: 4, pěti: 5, pětinu: 5, čtvrtinu: 4, šestinu: 6, desetinu: 10, dvacetinu: 20, osminu: 8, pětadvacetinu: 25,
  dvakrát: 2, třikrát: 3 };
const ZLOMKY = { 'sedm osmin': 7 / 8, 'tři čtvrtiny': 3 / 4, 'pět šestin': 5 / 6, 'čtyři pětiny': 4 / 5 };
const odmocnina = x => { const r = Math.round(Math.sqrt(x)); if (r * r !== x) throw new Error(x + ' není čtverec'); return r; };
const hodnotyGrafu = svg => [...String(svg).matchAll(/>([^<]+)<\/text>/g)].map(m => m[1]);
const V1214 = {
  // ── pozice 12 ──
  'Bazén': t => { const [d, s] = cisla(t.intro, /délku (\d+) metrů a šířku (\d+) metrů/), [n, h1] = cisla(t.intro, /dlouhá (\d+) m, je hloubka (\d+) m/),
    [, h2] = cisla(t.intro, /zvětší z (\d+) m na (\d+) m/); return n * s * h1 + (d - n) * s * (h1 + h2) / 2; },
  'Kostky v krabici': t => { const [a, b, c] = cisla(t.intro, /rozměry (\d+) cm × (\d+) cm × (\d+) cm/), [k] = cisla(t.intro, /o hraně (\d+) cm/);
    return Math.floor(a / k) * Math.floor(b / k) * Math.floor(c / k); },
  'Povrch válce': t => { const [k] = cisla(t.intro, /pláště rotačního válce je (\d+)krát/), [r] = cisla(t.intro, /Poloměr podstavy válce je (\d+) cm/);
    return (k + 2) * 3.14 * r * r; },
  'Lomená čára v hale': t => { const [v, d] = cisla(t.intro, /výška je (\d+) m a délka (\d+) m/), [u] = cisla(t.intro, /měří (\d+) m a tvoří úsek AC/);
    const s = odmocnina(u * u - d * d); return 2 * u + 2 * odmocnina(s * s + v * v); },
  'Polepená krychle': t => { const n = SLOVA[t.intro.match(/přelepena (\S+) shodnými/)[1]], [W] = cisla(t.intro, /ploch na povrchu krychle je (\d[\d ]*) cm²/);
    return odmocnina(W * n / (6 * (n - 1))); },                         // bílá je (n − 1)/n každé stěny
  'Dvě krychle': t => { const [D] = cisla(t.intro, /o (\d+) cm² menší/), [H] = cisla(t.intro, /hran malé krychle je (\d+) cm/);
    const a = H / 12, b = odmocnina(a * a + D / 6); return b ** 3 - a ** 3; },
  'Dva hranoly': t => { const [a] = cisla(t.intro, /délky a = (\d+) cm/), [D] = cisla(t.intro, /o (\d+) cm² větší povrch/); return D / 4 / a; },
  'Dort ze dvou forem': t => { const [r1] = cisla(t.intro, /první formy je (\d+) cm a poloměr podstavy druhé formy je o čtvrtinu menší/),
    [h] = cisla(t.intro, /stejná, a to (\d+) cm/), r2 = r1 - r1 / 4; return h * (r1 * r1 + r2 * r2); },     // v násobcích π
  'Trojboký hranol': t => { const [z, S] = cisla(t.intro, /základnu délky (\d+) cm a obsah (\d+) cm²/), v = 2 * S / z;
    if (!(v < z && v < Math.hypot(z / 2, v))) throw new Error('výška podstavy není nejkratší hrana'); return S * v; },
  // ── pozice 13 ──
  'Letní tábory': t => { const [N] = cisla(t.intro, /celkem (\d+) přihlášek/), p1 = 100 / SLOVA[t.intro.match(/míst o (\S+), ve druhém/)[1]],
    [p2] = cisla(t.intro, /ve druhém termínu o (\d+) %/), m = N / (2 + p1 / 100 + p2 / 100); return N - 2 * m; },
  'Cena zboží': t => { const [c, a, b] = cisla(t.intro, /stálo (\d+) Kč\. Nejdřív zdražilo o (\d+) %, potom z nové ceny zlevnilo o (\d+) %/);
    return c * (1 + a / 100) * (1 - b / 100); },
  'Zdražení': t => { const [a, b] = cisla(t.intro, /z (\d+) Kč na (\d+) Kč/); return (b - a) / a * 100; },
  'Úspora v procentech': t => { const [a, b] = cisla(t.intro, /stálo (\d+) Kč, teď ho koupíš za (\d+) Kč/); return (a - b) / a * 100; },
  'Parkoviště': t => { const [Z] = cisla(t.intro, /je (\d+) míst vyhrazeno/), k = SLOVA[t.intro.match(/představovala jednu (\S+) celkové/)[1]],
    [p] = cisla(t.intro, /pouze (\d+) % celkové/); return Z / (p / 100) - Z * k; },
  'Pomlázky': t => { const k = SLOVA[t.intro.match(/První den prodal (\S+) všech/)[1]], [D] = cisla(t.intro, /o (\d+) pomlázek více/);
    return D / (k - 2); },                                                // první den 1 díl z k, druhý zbytek k − 1
  'Kanystr': t => { const [n] = cisla(t.intro, /nalití (\d+) hrnků/), f = ZLOMKY[t.intro.match(/zaplněn[oy] (\S+ \S+) objemu/)[1]],
    [Z] = cisla(t.intro, /chybělo (\d[\d ]*) ml/), chybi = n / f - n - 1; return Z / chybi; },
  'Vlaky na kolejích': t => { const [d] = cisla(t.intro, /má o (\d+) vagon\S* více/), k = SLOVA[t.intro.match(/koleji a (\S+) méně/)[1]],
    [T] = cisla(t.intro, /dohromady mají (\d+) vagonů/), x = (T - d - k * d) / (k + 2); return k * (x + d) - x; },
  'Kytice': t => { const [o] = cisla(t.intro, /je v kytici o (\d+) více/), [a, b, u, w] = cisla(t.intro, /poměru (\d+) ∶ (\d+), počet static ku počtu chryzantém v poměru (\d+) ∶ (\d+)/),
    [cr, cc, cs] = cisla(t.intro, /růže (\d+) Kč, chryzantéma (\d+) Kč, statice (\d+) Kč/);
    const S = o * b / (a - b), R = S + o, Ch = S * w / u; return R * cr + Ch * cc + S * cs; },   // R + C = C + S + o ⇒ R = S + o
  // ── pozice 14 ──
  'Testové známky': t => { const [n] = cisla(t.intro, /psalo (\d+) žáků/), [p] = cisla(t.intro, /byl ([\d,]+)\.$/), res = [];
    for (let j = 0; 2 * j <= n; j++) if (blizko((j + 2 * j + 3 * (n - 2 * j)) / n, p)) res.push(j);
    if (res.length !== 1) throw new Error('řešení ' + res.length); return res[0]; },
  'Průměr měření': t => { const [p] = cisla(t.intro, /průměr (\d+)\./), zn = t.intro.match(/byly ([\d, ]+)\./)[1].split(', ').map(Number);
    return 5 * p - zn.reduce((x, y) => x + y, 0); },
  'Medián': t => { const a = t.prompt.match(/čísel: ([\d, ]+)\./)[1].split(', ').map(Number).sort((x, y) => x - y); return a[(a.length - 1) / 2]; },
  'Modus': t => { const a = t.prompt.match(/čísel: ([\d, ]+)\./)[1].split(', ').map(Number), c = {};
    a.forEach(v => { c[v] = (c[v] || 0) + 1; }); const max = Math.max(...Object.values(c)), m = Object.keys(c).filter(v => c[v] === max);
    if (m.length !== 1) throw new Error('modů je ' + m.length); return +m[0]; },
  'Kroužky': t => { const [N] = cisla(t.prompt, /celkem jich je (\d+)/), zn = hodnotyGrafu(t.svg).filter(x => /^\d+$/.test(x)).map(Number);
    if (zn.length !== 2) throw new Error('v grafu je ' + zn.length + ' známých sloupců'); return N - zn[0] - zn[1]; },
  'Návštěvnost': t => { const tx = hodnotyGrafu(t.svg), hod = {};
    for (let i = 0; i < tx.length; i += 2) hod[tx[i + 1]] = +tx[i];            // za každým sloupcem hodnota, pak měsíc
    const Z6 = { 'květnu': 'květen', 'červnu': 'červen', 'červenci': 'červenec', 'srpnu': 'srpen', 'září': 'září' };
    const [, a, b] = t.prompt.match(/prodalo v (\S+) než v (\S+)\?/); return hod[Z6[a]] - hod[Z6[b]]; },
  // Hodnoty z popisků sloupců (data-kdo, data-druh), druhy v pořadí podle výčtu v zadání.
  'Ptačí hodinka': t => {
    const druhy = t.intro.match(/ptáků \(([^)]+)\)/)[1].split(', '), J = [], B = [];
    for (const m of String(t.svg).matchAll(/data-kdo="([JB])" data-druh="(\d)"[^>]*>([^<]+)</g)) (m[1] === 'J' ? J : B)[+m[2]] = m[3] === '?' ? null : +m[3];
    const P = druhy.indexOf('pěnkava obecná'), SY = druhy.indexOf('sýkora koňadra'), BR = druhy.indexOf('brhlík lesní'), [d] = cisla(t.intro, /pěnkav o (\d+) méně než sýkor/);
    if (J[P] !== null || B[BR] !== null || J.filter(v => v === null).length !== 1 || B.filter(v => v === null).length !== 1)
      throw new Error('v grafu nechybějí právě Jonášovy pěnkavy a Beátiny brhlíky');
    if (B.filter(v => v === 0).length !== 1 || J.some(v => v === 0)) throw new Error('Beáta nemá právě jeden nespatřený druh');
    J[P] = J[SY] + B[SY] - d - B[P];                                   // pěnkav o d méně než sýkor
    const sB = J.reduce((x, y) => x + y, 0) / 1.2;                     // Jonáš o pětinu víc než Beáta
    return sB - B.reduce((x, y) => x + (y || 0), 0); }
};
const nerozp1214 = new Set(), spatne1214 = [], videno1214 = {};
let jinySpravne = 0, mc1214 = 0;
for (const i of [11, 12, 13]) for (let b = 0; b < 2500; b++) {
  const t = C.genSlot(i), f = V1214[t.title];
  if (!f) { nerozp1214.add('pozice ' + (i + 1) + ': „' + t.title + '"'); continue; }
  videno1214[t.title] = (videno1214[t.title] || 0) + 1;
  let ceka;
  try { ceka = f(t); } catch (e) { nerozp1214.add(t.title + ': ' + e.message); continue; }
  mc1214++;
  const hodnoty = t.options.map(hodnotaVolby), pis = t.options.map(o => o[0]), cisl = hodnoty.filter(v => v !== null);
  if (!cisl.every((v, j) => !j || v > cisl[j - 1]) && !cisl.every((v, j) => !j || v < cisl[j - 1]))
    spatne1214.push(t.title + ': volby nejsou seřazené — ' + t.options.join(' | '));
  const kde = hodnoty.map((v, j) => (v !== null && blizko(v, ceka) ? pis[j] : null)).filter(Boolean);
  if (kde.length > 1) spatne1214.push(t.title + ': výsledek ' + ceka + ' je mezi volbami ' + kde.length + '× — ' + t.options.join(' | '));
  else if (kde.length === 1) { if (kde[0] !== t.ans) spatne1214.push(t.title + ': spočteno ' + ceka + ' (volba ' + kde[0] + '), banka tvrdí ' + t.ans + ' — ' + t.options.join(' | ')); }
  else {
    const j = t.options.findIndex(o => /^(o\s+)?jin/.test(o.slice(3).trim()));
    if (j < 0 || pis[j] !== t.ans) spatne1214.push(t.title + ': výsledek ' + ceka + ' v nabídce není a banka neoznačila „jiný…" — ' + t.options.join(' | ') + ' → ' + t.ans);
    else jinySpravne++;
  }
}
/* Naměřeno: 7 500 úloh, každá z 24 variant 270–430×, „jiný…" správně ~600×.
   Podlahy chytají vymizení, ne kolísání. */
ok(Object.keys(V1214).every(n => (videno1214[n] || 0) >= 150), 'pozice 12–14: všech ' + Object.keys(V1214).length + ' variant se v losu objevuje (podlaha 150×)',
  JSON.stringify(videno1214));
ok(mc1214 === 7500, 'pozice 12–14: dopočítáno ' + mc1214 + ' úloh s volbami (čeká se 7 500)');
ok(jinySpravne >= 300, 'pozice 12–14: „jiný…" je správnou volbou ' + jinySpravne + '× (podlaha 300)', 'naměřeno=' + jinySpravne);
ok(nerozp1214.size === 0, 'pozice 12–14: každé zadání se dalo přečíst', [...nerozp1214].slice(0, 3).join(' | '));
ok(spatne1214.length === 0, 'pozice 12–14: výsledek ze zadání je právě jednou mezi seřazenými volbami, pod správným písmenem',
  [...new Set(spatne1214)].slice(0, 3).join(' | '));

/* ═══ A5) POZICE 1 a 2 — číselné výrazy a krátké slovní úlohy ══════════
   Výraz ze zadání („(2 + 1/4) : (2 · 1/4 − 5) =") se spočítá PŘESNĚ ve
   zlomcích vlastním parserem. „a/b" se čte jako jedno číslo — v ostrém
   testu je to zlomková čára, ne dělení, takže „1 : 3/4" je 4/3. Slovní
   úlohy pozice 1 mají pevné šablony a každá má svůj vzor podle ZNĚNÍ. */
const qz = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(Math.abs(n), d) || 1; return [n / g, d / g]; };
const qSec = (a, b) => qz(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const qNas = (a, b) => qz(a[0] * b[0], a[1] * b[1]);
const qDel = (a, b) => (b && b[0] !== 0 ? qz(a[0] * b[1], a[1] * b[0]) : null);
const qNeg = a => a && [-a[0], a[1]];
function qCislo(s) {                                   // „−1,25", „3/4", „7" → [čitatel, jmenovatel]
  const m = /^([-−]?)(\d+)(?:,(\d+))?(?:\/(\d+))?$/.exec(String(s).trim().replace('.', ','));
  if (!m) return null;
  let r = m[3] ? qz(Number(m[2] + m[3]), 10 ** m[3].length) : qz(Number(m[2]));
  if (m[4]) r = qz(r[0], r[1] * Number(m[4]));
  return m[1] ? qNeg(r) : r;
}
function qVyraz(text) {
  const tok = text.match(/\d+(?:,\d+)?(?:\/\d+)?|[()·:+−√²]/g);
  if (!tok || tok.join('') !== text.replace(/\s+/g, '')) return null;     // neznámý znak ⇒ nerozpoznáno
  let i = 0;
  const zaklad = () => {
    if (tok[i] === '(') { i++; const v = vyraz(); if (tok[i] !== ')') return null; i++; return v; }
    const v = tok[i] ? qCislo(tok[i]) : null; if (v) i++; return v;
  };
  const mocnina = v => { if (v && tok[i] === '²') { i++; return qNas(v, v); } return v; };
  const cinitel = () => {
    if (tok[i] === '−') { i++; return qNeg(cinitel()); }
    if (tok[i] === '√') {
      i++; const w = zaklad(); if (!w || w[0] < 0) return null;
      const a = Math.round(Math.sqrt(w[0])), b = Math.round(Math.sqrt(w[1]));
      return a * a === w[0] && b * b === w[1] ? mocnina(qz(a, b)) : null;
    }
    return mocnina(zaklad());
  };
  const clen = () => {
    let v = cinitel();
    while (v && (tok[i] === '·' || tok[i] === ':')) { const op = tok[i++], w = cinitel(); v = w && (op === '·' ? qNas(v, w) : qDel(v, w)); }
    return v;
  };
  const vyraz = () => {
    let v = clen();
    while (v && (tok[i] === '+' || tok[i] === '−')) { const op = tok[i++], w = clen(); v = w && qSec(v, op === '+' ? w : qNeg(w)); }
    return v;
  };
  const v = vyraz();
  return v && i === tok.length ? v : null;
}
const Q = n => qz(n);
const ZL7 = { polovinou: 2, třetinou: 3, čtvrtinou: 4, pětinou: 5 };
const FILM = { '1 hodinu': 60, 'hodinu a půl': 90, '2 hodiny': 120, '2 a půl hodiny': 150 };
const SE_DETMI = { 'se dvěma': 2, 'se třemi': 3, 'se čtyřmi': 4 };
const cas = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
const VZORY12 = [
  ['výraz', /^Vypočítejte[^:]*: (.+) =$/, m => qVyraz(m[1])],
  ['kolikrát: součet a odmocnina', /^Vypočítejte, kolikrát je součet čísel (\d+) a (\d+) větší než druhá odmocnina ze součinu čísel \1 a \2\.$/,
    m => qDel(Q(+m[1] + +m[2]), qVyraz(`√(${m[1]} · ${m[2]})`))],
  ['součin a součet', /^Vypočítejte, o kolik je součin čísel (\d+) a (\d+) větší než jejich součet\.$/, m => Q(m[1] * m[2] - m[1] - m[2])],
  ['obsah v jednotkách', /^Vypočítejte, o kolik cm² je plocha o obsahu (\d+(?:,\d+)?) m² větší než plocha o obsahu (\d+) cm²\.$/,
    m => qSec(qNas(qCislo(m[1]), Q(10000)), Q(-m[2]))],
  ['hmotnost v jednotkách', /^Určete, kolikrát více je (\d+) kg než (\d+(?:,\d+)?) g\.$/, m => qDel(Q(m[1] * 1000), qCislo(m[2]))],
  ['součet a rozdíl', /^V knihovně je dohromady (\d+) knih\. Beletrie je o (\d+) knih více než naučné literatury\. Kolik je naučných knih\?$/,
    m => qz(m[1] - m[2], 2)],
  ['kroky', /^Trasa je dlouhá (\d+(?:,\d+)?) km\. Jeden turista má krok dlouhý (\d+) cm, druhý (\d+) cm\. O kolik kroků udělá druhý turista na celé trase více než první\?$/,
    m => { const T = qNas(qCislo(m[1]), Q(100000)); return qSec(qDel(T, Q(+m[3])), qNeg(qDel(T, Q(+m[2])))); }],
  ['jízda s pauzou', /^Řidič strávil jízdou v autě přesně (\d+) hodin[y]?, než dojel do cíle\. Jízdu zahájil ráno ve? (\d+):(\d\d) a přerušil ji jen jednou, když si udělal pauzu na oběd: z auta vystoupil ve? (\d+):(\d\d) a vrátil se za (\d+) minut\. Pak pokračoval v jízdě až do cíle\. Určete, kdy řidič dorazil do cíle\. Výsledek zapište ve tvaru hodiny:minuty\.$/,
    m => { const start = m[2] * 60 + +m[3], ven = m[4] * 60 + +m[5];
      // pauza musí přijít během jízdy, jinak si zadání odporuje
      return ven > start && ven - start < m[1] * 60 ? cas(start + m[1] * 60 + +m[6]) : 'pauza mimo jízdu'; }],
  ['stuha', /^Dárkovou stuhu dlouhou (\d+) m jsme dvěma střihy rozdělili na tři díly\. Nejprve jsme odstřihli (.+?) stuhy na první dárek, potom jsme odstřihli (.+?) zbytku stuhy na druhý dárek a poslední díl jsme použili na třetí dárek\. Vypočítejte, kolik cm stuhy jsme použili na (druhý|třetí) dárek\.$/,
    m => { const a = ZL[m[2]], b = ZL[m[3]]; if (!a || !b) return null;
      const zbytek = qNas(Q(m[1] * 100), qz(a[1] - a[0], a[1])), druhy = qNas(zbytek, qz(b[0], b[1]));
      return m[4] === 'druhý' ? druhy : qSec(zbytek, qNeg(druhy)); }],
  ['poměr a rozdíl', /^Hmotnosti dvou závaží jsou v poměru (\d+) : (\d+) a liší se o (\d+) g\. Vypočítejte v gramech hmotnost (lehčího|těžšího) závaží\.$/,
    m => { const p = +m[1], r = +m[2], dil = qz(+m[3], Math.abs(r - p)); return qNas(dil, Q(m[4] === 'lehčího' ? Math.min(p, r) : Math.max(p, r))); }],
  ['uplynulá a zbývající doba', /^Celý film trvá (.+?)\. Doba, která ještě zbývá do konce filmu, je (\S+) doby, která již uplynula od začátku filmu\. Vypočítejte, kolik minut zbývá do konce filmu\.$/,
    m => (FILM[m[1]] && ZL7[m[2]] ? qz(FILM[m[1]], ZL7[m[2]] + 1) : null)],
  ['vstupenky', /^Dětská vstupenka do muzea stojí (.+?) ceny vstupenky pro dospělého\. Jeden dospělý (se \S+) dětmi zaplatil za vstupenky (\d+) korun\. Vypočítejte v korunách cenu jedné (dětské vstupenky|vstupenky pro dospělého)\.$/,
    m => { const f = ZL[m[1]], n = SE_DETMI[m[2]]; if (!f || !n) return null;
      const dosp = qDel(Q(+m[3]), qSec(Q(1), qNas(Q(n), qz(f[0], f[1])))); return m[4] === 'dětské vstupenky' ? qNas(dosp, qz(f[0], f[1])) : dosp; }],
  ['opakovaná změna: hod', /^Při tréninku hodu oštěpem měřil první hod (\d+) m\. Každý další hod byl o (\S+) delší než hod předchozí\. Vypočítejte, o kolik cm byl třetí hod delší než první\.$/,
    m => { const f = ZL[m[2]]; if (!f || f[0] !== 1) return null; const k = qz(f[1] + 1, f[1]), c1 = Q(m[1] * 100);
      return qSec(qNas(c1, qNas(k, k)), qNeg(c1)); }],
  ['opakovaná změna: odskok', /^Míček po prvním dopadu vyskočil do výšky (\d+) cm\. Každý další odskok byl o (\S+) nižší než odskok předchozí\. Vypočítejte, o kolik cm byl třetí odskok nižší než první\.$/,
    m => { const f = ZL[m[2]]; if (!f || f[0] !== 1) return null; const k = qz(f[1] - 1, f[1]), c1 = Q(+m[1]);
      return qSec(c1, qNeg(qNas(c1, qNas(k, k)))); }]
];
const BEHU12 = 6000, videno12 = {}, nerozp12 = new Set(), spatne12 = [];
let podul12 = 0;
for (const slot of [0, 1]) for (let b = 0; b < BEHU12; b++) {
  const t = C.genSlot(slot);
  t.parts.forEach(p => {
    const text = ((t.intro ? t.intro + ' ' : '') + p.prompt).trim();
    const shody = VZORY12.map(([nazev, re, f]) => { const m = re.exec(text); return m && [nazev, f(m)]; }).filter(Boolean);
    if (shody.length !== 1 || shody[0][1] == null) { nerozp12.add('pozice ' + (slot + 1) + ': ' + text.slice(0, 90)); return; }
    const [nazev, v] = shody[0];
    podul12++; videno12[nazev] = (videno12[nazev] || 0) + 1;
    const sedi = typeof v === 'string' ? v === String(p.ans) : (() => { const a = qCislo(p.ans); return !!a && a[0] === v[0] && a[1] === v[1]; })();
    if (!sedi) spatne12.push('pozice ' + (slot + 1) + ' (' + nazev + '): „' + text.slice(-70) + '" → banka ' + p.ans + ', ze zadání ' + (typeof v === 'string' ? v : v[1] === 1 ? v[0] : v.join('/')));
  });
}
ok(Object.keys(videno12).length === VZORY12.length && Object.values(videno12).every(n => n >= 100),
  'pozice 1 a 2: všech ' + VZORY12.length + ' druhů zadání se v losu objevuje (podlaha 100×)', JSON.stringify(videno12));
ok(podul12 > 17000, 'pozice 1 a 2: dopočítáno ' + podul12 + ' podúloh (podlaha 17 000)', 'naměřeno=' + podul12);
ok(nerozp12.size === 0, 'pozice 1 a 2: každé zadání rozpoznal právě jeden vzor', [...nerozp12].slice(0, 3).join(' | '));
ok(spatne12.length === 0, 'pozice 1 a 2: odpověď banky se shoduje s přesným dopočtem ze zadání', [...new Set(spatne12)].slice(0, 3).join(' | '));

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
   první losování vybere předposlední variantu pozice 14 (gen14f; za ní
   je Ptačí hodinka), dalších pět dá
   sloupcům stejnou výšku. */
{
  const puvodni = global.ri;
  let n = 0;
  global.ri = (a, b) => {
    if (++n > 100000) throw new Error('zacyklení');
    if (n === 1) return b - 1;                   // pick() → předposlední varianta pozice 14 (gen14f)
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
