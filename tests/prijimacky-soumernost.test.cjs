/* ══════════════════════════════════════════════════════════════════
   Test nanečisto: osová souměrnost útvarů ve čtvercové síti
   (pozice 8 „Útvary ve čtvercové síti“ a pozice 11 „Osová souměrnost útvarů“).

   PROČ TO NENÍ KRUH. Generátor v bance hledá osy celočíselnými vzorci
   (svislá x → k − x, vodorovná, dvě šikmé). Kdyby test použil totéž, schoval
   by společnou chybu. Proto:
     1. útvar si test PŘEČTE Z KRESBY (čtverce `data-bunka`, `data-x`, `data-y`),
        ne z objektu, který generátor vrátil;
     2. osy dopočte JINOU cestou — skutečnou geometrií: kandidáty jsou všechny
        osy úseček mezi středy dvou čtverců a spojnice středu s těžištěm, každý
        čtverec se zrcadlí včetně čtyř rohů a obraz musí být čtverec rovnoběžný
        s mřížkou přesně na místě jiného čtverce (tolerance 1e-9);
     3. z toho vyjde odpověď (jediný čtverec, jehož odebráním útvar zesouměrní),
        pravdivost tvrzení 11.1–11.3 i dvojice čtverců, které postup vypisuje.

   Řešič a čtení z kresby jsou ve sdíleném `soumernost-site.cjs` (používá ho i
   `prijimacky-dopocet`). Každá pojistka je ověřená sabotáží zdroje banky (viz konec).
   Spusť: node tests/prijimacky-soumernost.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BANKA = path.join(ROOT, 'projects', 'rpg-cermat-9.js');
const JADRO = path.join(ROOT, 'projects', 'prijimacky-matematika', 'prijimacky-core.js');

/* Stuby helperů — banka je čte z globálu (stejně jako ostatní testy). */
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => (n === 1 ? o : (n >= 2 && n <= 4 ? f : m));
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar',
  'svgCuboid', 'svgSloupce', 'svgTezitko'].forEach(f => { global[f] = () => '<svg></svg>'; });

const nactiBanku = src => { const win = {}; new Function('window', src)(win); return win.RPG_CERMAT_9; };
const ZDROJ = fs.readFileSync(BANKA, 'utf8');
const T8 = 'Útvary ve čtvercové síti', T11 = 'Osová souměrnost útvarů';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const { osyGeom, ctiUtvary, bez, pole, kraloveSouvisly, reseniOdebrani, paryPodleOsy, paryZTextu } = require('./soumernost-site.cjs');

/* ── Hlavní kontrola nad jednou bankou (původní, nebo sabotovanou) ── */
function zkontroluj(C, N8, N11) {
  const chyby = [], st = {
    utvaru: 0, ukol8: 0, ukol11: 0, vyjimek: 0, rodiny: { sv: 0, vo: 0, d: 0, a: 0 }, p1: 0, p2: 0, p3: 0, dveOsy: 0,
    velikosti: new Set(), kose: [0, 0, 0, 0, 0]
  };
  const chyba = m => { if (chyby.length < 8 && !chyby.includes(m)) chyby.push(m); };
  const losuj = (poz, titul, n) => {
    const v = []; let g = 0;
    while (v.length < n && g++ < n * 60) {
      let t; try { t = C.genSlot(poz); } catch (e) { st.vyjimek++; chyba('generátor spadl: ' + e.message); continue; }
      if (t.title === titul) v.push(t);
    }
    return v;
  };
  const kresba = (t, ocekavane) => {
    const u = ctiUtvary(t.svg);
    ['A', 'B', 'C'].forEach(p => {
      const b = u[p].slice().sort((a, c) => a.n - c.n);
      st.utvaru++;
      if (b.length < 6 || b.length > 13) chyba('útvar ' + p + ' má ' + b.length + ' čtverců (6–13)');
      st.velikosti.add(b.length);
      if (b.some((c, i) => c.n !== i + 1)) chyba('čísla čtverců nejsou 1…n');
      const poradi = b.every((c, i) => !i || c.y > b[i - 1].y || (c.y === b[i - 1].y && c.x > b[i - 1].x));
      if (!poradi) chyba('čísla nejdou zleva doprava a shora dolů');
      if (b.some(c => c.x < 0 || c.x > 6 || c.y < 0 || c.y > 5)) chyba('čtverec mimo mřížku 7 × 6');
      if (b.some(c => c.w !== 18 || c.h !== 18)) chyba('čtverec nemá rozměr 18');
      if (new Set(b.map(c => c.x + ',' + c.y)).size !== b.length) chyba('dva čtverce na jednom místě');
      if (!kraloveSouvisly(b)) chyba('útvar ' + p + ' se rozpadá na kusy');
      u[p] = b;
    });
    // číslo ve čtverci: každý čtverec má svůj popisek se stejným číslem uvnitř svého rámečku
    const txt = [...t.svg.matchAll(/<text data-na-vyplni="#1b6f8f" x="([\d.]+)" y="([\d.]+)"[^>]*>(\d+)<\/text>/g)];
    const vse = ['A', 'B', 'C'].flatMap(p => u[p]);
    if (txt.length !== vse.length) chyba('počet čísel ' + txt.length + ' ≠ počet čtverců ' + vse.length);
    txt.forEach((m, i) => {
      const c = vse[i];
      if (!c || +m[3] !== c.n || +m[1] <= c.px || +m[1] >= c.px + c.w || +m[2] <= c.py || +m[2] >= c.py + c.h) chyba('číslo ' + m[3] + ' neleží uvnitř svého čtverce');
    });
    return u;
  };

  /* Pozice 8 */
  for (const t of losuj(7, T8, N8)) {
    st.ukol8++;
    if (t.no !== 8 || t.points !== 4 || !t.parts || t.parts.length !== 2 || t.parts.some(p => p.points !== 2)) chyba('pozice 8: tvar úlohy (2 části po 2 b.)');
    const u = kresba(t);
    const mA = /odebráním čtverce (\d+)/.exec(t.intro || '');
    const R = { A: reseniOdebrani(u.A), B: reseniOdebrani(u.B), C: reseniOdebrani(u.C) };
    ['A', 'B', 'C'].forEach(p => {
      if (osyGeom(pole(u[p])).length) chyba('útvar ' + p + ' je sám souměrný');
      if (R[p].length !== 1) chyba('útvar ' + p + ' nemá právě jedno řešení (' + R[p].join(',') + ')');
    });
    if (!mA || +mA[1] !== R.A[0]) chyba('vzor A: v zadání ' + (mA && mA[1]) + ', správně ' + R.A.join(','));
    [['B', 0], ['C', 1]].forEach(([p, i]) => {
      const part = t.parts[i];
      if (String(part.ans) !== String(R[p][0])) chyba('část ' + part.key + ': odpověď ' + part.ans + ', správně ' + R[p].join(','));
      if (!/útvaru [BC]/.test(part.prompt) || !part.prompt.includes('útvaru ' + p)) chyba('část ' + part.key + ' se ptá na jiný útvar než ' + p);
      if (!Array.isArray(part.sol) || part.sol.length < 3) chyba('postup ' + part.key + ' má méně než 3 kroky');
      else {
        if (!new RegExp('odpověď je ' + part.ans + '\\.').test(part.sol[part.sol.length - 1])) chyba('postup ' + part.key + ' nekončí odpovědí');
        const osy = osyGeom(pole(bez(u[p], R[p][0])));
        const mapy = osy.map(o => paryPodleOsy(u[p], o, R[p][0]));
        if (!mapy.includes(paryZTextu(part.sol[1]))) chyba('postup ' + part.key + ': dvojice čtverců nesedí na žádnou osu');
        const mX = /čtverec bez protějšku je čtverec (\d+)/.exec(part.sol[1]);
        if (!mX || +mX[1] !== R[p][0]) chyba('postup ' + part.key + ': čtverec bez protějšku není ' + R[p][0]);
        osy.slice(0, 1).forEach(o => { if (o.rodina === 'jina') chyba('část ' + part.key + ': osa jiného směru než svislá, vodorovná a pod 45°'); else st.rodiny[o.rodina]++; });
      }
      st.kose[Math.min(4, Math.floor((R[p][0] - 1) / u[p].length * 5))]++;
    });
  }

  /* Pozice 11 */
  for (const t of losuj(10, T11, N11)) {
    st.ukol11++;
    if (t.no !== 11 || t.kind !== 'tfgrid' || t.points !== 4 || !t.statements || t.statements.length !== 3) chyba('pozice 11: tvar úlohy (tfgrid, 3 tvrzení, 4 b.)');
    const u = kresba(t);
    const [s1, s2, s3] = t.statements;
    // 11.1 o útvaru A
    const pr1 = osyGeom(pole(u.A)).length > 0;
    if (!/Útvar A je osově souměrný/.test(s1.text) || s1.ans !== (pr1 ? 'A' : 'N')) chyba('11.1: odpověď ' + s1.ans + ', správně ' + (pr1 ? 'A' : 'N'));
    if (pr1) st.p1++;
    if (!pr1) {
      const r = reseniOdebrani(u.A), m = /Čtverec (\d+) ale protějšek nemá/.exec(s1.sol[1]);
      if (r.length !== 1 || !m || +m[1] !== r[0]) chyba('11.1 postup: čtverec bez protějšku ' + (m && m[1]) + ', správně ' + r.join(','));
    } else {
      const m = paryZTextu(s1.sol[1]), mapy = osyGeom(pole(u.A)).map(o => paryPodleOsy(u.A, o, -1));
      if (!mapy.includes(m)) chyba('11.1 postup: dvojice čtverců nesedí na žádnou osu');
    }
    // 11.2 o odebrání čtverce z B
    const m2 = /Odebráním čtverce (\d+) z útvaru B/.exec(s2.text), N = m2 && +m2[1];
    const pr2 = !!m2 && osyGeom(pole(bez(u.B, N))).length > 0;
    if (!m2 || s2.ans !== (pr2 ? 'A' : 'N')) chyba('11.2: odpověď ' + s2.ans + ', správně ' + (pr2 ? 'A' : 'N'));
    if (pr2) st.p2++;
    if (m2 && !u.B.some(c => c.n === N)) chyba('11.2: čtverec ' + N + ' v útvaru B není');
    const rB = reseniOdebrani(u.B);
    if (!pr2) {
      const m = /by vznikl odebráním čtverce (\d+), ne čtverce (\d+)/.exec(s2.sol[2]);
      if (!m || rB.length !== 1 || +m[1] !== rB[0] || +m[2] !== N) chyba('11.2 postup: souměrný útvar vznikne odebráním ' + rB.join(',') + ', v textu ' + (m && m[1] + '/' + m[2]));
    } else {
      const osy = osyGeom(pole(bez(u.B, N))).map(o => paryPodleOsy(u.B, o, N));
      if (!osy.includes(paryZTextu(s2.sol[1]))) chyba('11.2 postup: dvojice čtverců nesedí na žádnou osu');
    }
    // 11.3 počet os útvaru C
    const m3 = /právě (jednu|dvě) /.exec(s3.text), k = m3 && (m3[1] === 'jednu' ? 1 : 2);
    const osyC = osyGeom(pole(u.C)), nOs = osyC.length;
    if (osyC.some(o => o.rodina === 'jina')) chyba('útvar C má osu jiného směru než svislou, vodorovnou a pod 45°');
    if (!m3 || s3.ans !== (nOs === k ? 'A' : 'N')) chyba('11.3: odpověď ' + s3.ans + ', útvar C má ' + nOs + ' os(y), tvrzení ' + k);
    if (nOs === 2) st.dveOsy++;
    if (nOs < 1 || nOs > 2) chyba('útvar C má ' + nOs + ' os (1 nebo 2)');
    if (!new RegExp('útvar C jich má ' + nOs + '\\.').test(s3.sol[2])) chyba('11.3 postup: počet os v textu neodpovídá (' + nOs + ')');
    // všechny tři tvrzení mají tříkrokový postup a verdikt shodný s odpovědí
    t.statements.forEach((s, i) => {
      if (!Array.isArray(s.sol) || s.sol.length < 3) chyba('11.' + (i + 1) + ': postup má méně než 3 kroky');
      else if (!s.sol[s.sol.length - 1].includes(s.ans === 'A' ? 'PRAVDIVÉ (A)' : 'NEPRAVDIVÉ (N)')) chyba('11.' + (i + 1) + ': verdikt v postupu neodpovídá odpovědi');
    });
    if (s3.ans === 'A') st.p3++;
  }
  st.chyby = chyby;
  return st;
}

console.log('\n── Test nanečisto: osová souměrnost ve čtvercové síti ──\n');

/* ── 1. Hlavní kontrola nad skutečnou bankou ───────────────────── */
const C = nactiBanku(ZDROJ);
const N8 = 1200, N11 = 1200;
const t0 = Date.now();
const S = zkontroluj(C, N8, N11);
const sek = ((Date.now() - t0) / 1000).toFixed(1);
ok(S.ukol8 >= N8 * 0.95 && S.ukol11 >= N11 * 0.95, 'úlohy 8 a 11 se vygenerovaly (' + S.ukol8 + ' + ' + S.ukol11 + ', ' + S.utvaru + ' útvarů, ' + sek + ' s)',
  'čekáno ' + N8 + ' + ' + N11);
ok(S.vyjimek === 0, 'generátor ani jednou nespadl (zacyklení / vyčerpané pokusy)');
ok(S.chyby.length === 0, 'všechny útvary, odpovědi, pravdivosti a postupy sedí s NEZÁVISLÝM řešičem', S.chyby.join(' | '));

/* ── 2. Rozložení: útvary a odpovědi se nedají odhadnout ────────── */
const pod = (k, n) => k / n;
const r8 = S.rodiny, soucet8 = r8.sv + r8.vo + r8.d + r8.a;
ok(Math.min(r8.sv, r8.vo, r8.d, r8.a) / soucet8 >= 0.08,
  'osy v úloze 8 jsou svislé, vodorovné i obě šikmé (sv ' + r8.sv + ', vo ' + r8.vo + ', šikmé ' + r8.d + ' + ' + r8.a + ')');
const pr = [pod(S.p1, S.ukol11), pod(S.p2, S.ukol11), pod(S.p3, S.ukol11)];
ok(pr.every(p => p >= 0.4 && p <= 0.6), 'pravdivých tvrzení je zhruba polovina u 11.1, 11.2 i 11.3 (' + pr.map(p => (p * 100).toFixed(0) + ' %').join(', ') + ')');
ok(pod(S.dveOsy, S.ukol11) >= 0.4 && pod(S.dveOsy, S.ukol11) <= 0.6, 'útvar C má dvě osy zhruba v polovině úloh (' + (pod(S.dveOsy, S.ukol11) * 100).toFixed(0) + ' %)');
ok(S.velikosti.size >= 6, 'velikosti útvarů se liší (' + [...S.velikosti].sort((a, b) => a - b).join(', ') + ' čtverců)');
const kSoucet = S.kose.reduce((a, b) => a + b, 0);
ok(Math.min(...S.kose) / kSoucet >= 0.14, 'odebíraný čtverec je v útvaru na začátku i na konci (pětiny: ' + S.kose.map(k => (k / kSoucet * 100).toFixed(0) + ' %').join(' / ') + ')');

/* ── 3. Světlý motiv a kontrast čísla na tmavém čtverci ────────── */
{
  const core = fs.readFileSync(JADRO, 'utf8');
  const i = core.indexOf('const SVG_MAP'), blok = core.slice(i, core.indexOf('];', i));
  const MAP = [...blok.matchAll(/\['(#[0-9a-f]{3,6})',\s*'(#[0-9a-f]{3,6})'\]/g)].map(m => [m[1], m[2]]);
  const prevod = c => { const m = MAP.find(([a]) => a === c); return m ? m[1] : null; };
  const lum = h => {
    const v = [1, 3, 5].map(k => parseInt(h.substr(k, 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const kontrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  let t; do { t = C.genSlot(7); } while (t.title !== T8);
  const barvy = [...new Set([...t.svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,6})"/g)].map(m => m[1]))];
  const bezPravidla = barvy.filter(c => prevod(c) === null);
  ok(bezPravidla.length === 0, 'každá barva kresby má pravidlo pro světlý motiv (' + barvy.join(', ') + ')', bezPravidla.join(', '));
  const tmavy = kontrast('#f4f9ff', '#1b6f8f'), svetly = kontrast(prevod('#f4f9ff') || '#000000', prevod('#1b6f8f') || '#ffffff');
  ok(tmavy >= 4.5 && svetly >= 4.5, 'číslo na čtverci má kontrast ≥ 4,5 : 1 v obou motivech (hra ' + tmavy.toFixed(1) + ', přijímačky ' + svetly.toFixed(1) + ')');
}

/* ── 4. Sabotáže: každá pojistka musí něco chytit ──────────────── */
const sabotaze = [
  ['odpověď 8.1 je jiný čtverec než ten, který se odebírá', 'ans: String(B.X), sol: sol(B', 'ans: String(B.X === 1 ? 2 : B.X - 1), sol: sol(B'],
  ['řešič nezná šikmé osy', "    for (let c = x0 - y1; c <= x1 - y0; c++) if (vse({ typ: 'd', c })) osy.push({ typ: 'd', c });\n    for (let c = x0 + y0; c <= x1 + y1; c++) if (vse({ typ: 'a', c })) osy.push({ typ: 'a', c });\n", ''],
  ['generátor nehlídá jedinost řešení', 'if (reseni.length !== 1 || reseni[0] !== X) continue;', 'if (!reseni.includes(X)) continue;'],
  ['čtverce se číslují zdola nahoru', '.sort((p, q) => p[1] - q[1] || p[0] - q[0]);\n    const cisla', '.sort((p, q) => q[1] - p[1] || p[0] - q[0]);\n    const cisla'],
  ['útvar C má jiný počet os, než tvrdí postup', 'const pocetC = p3 ? k : 3 - k, C = utvarSOsami(pocetC);', 'const pocetC = p3 ? k : 3 - k, C = utvarSOsami(pocetC === 1 ? 2 : 1);'],
  ['nepravdivé 11.2 odebírá správný čtverec', 'let N = B.X;\n    if (!p2) {', 'let N = B.X;\n    if (false) {'],
  ['odebíraný čtverec je nejčastěji první nebo poslední', 'const X = pick(vPeti), F = S.concat([X]);', 'const X = pick(kand), F = S.concat([X]);'],
  ['11.1 má obrácenou pravdivost', 'tvrzeni(`Útvar A je osově souměrný.`, p1, p1', 'tvrzeni(`Útvar A je osově souměrný.`, !p1, p1']
];
sabotaze.forEach(([popis, hledej, nahrad]) => {
  const pocet = ZDROJ.split(hledej).length - 1;
  ok(pocet === 1, 'sabotáž „' + popis + '“ se aplikovala (' + pocet + '× nalezeno)');
  if (pocet !== 1) return;
  let vysl;
  try { vysl = zkontroluj(nactiBanku(ZDROJ.replace(hledej, () => nahrad)), 800, 800); }
  catch (e) { vysl = { chyby: ['pád: ' + e.message], ukol8: 0, ukol11: 0, vyjimek: 1, rodiny: { sv: 0, vo: 0, d: 0, a: 0 }, kose: [1, 1, 1, 1, 1] }; }
  const s = vysl.rodiny, sou = s.sv + s.vo + s.d + s.a;
  const kSou = vysl.kose.reduce((a, b) => a + b, 0), nerovn = kSou > 0 && Math.min(...vysl.kose) / kSou < 0.14;
  const slabe = sou > 0 && Math.min(s.sv, s.vo, s.d, s.a) / sou < 0.08;
  const chyceno = vysl.chyby.length > 0 || vysl.vyjimek > 0 || slabe || nerovn;
  ok(chyceno, 'sabotáž „' + popis + '“ je chycena (' + (vysl.chyby[0] || (slabe ? 'chybí šikmé osy' : nerovn ? 'odpovědi u okraje útvaru' : vysl.vyjimek ? 'výjimka' : '')).slice(0, 70) + ')', 'test prošel i nad rozbitou bankou');
});

console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
