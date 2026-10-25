/* ══════════════════════════════════════════════════════════════════
   Test nanečisto: úloha 8 „Útvary v trojúhelníkové síti“ (osová a středová souměrnost, odebrání a přesunutí).

   Zdroj: nanečisto 2026, úloha 8 (CZVV): trojúhelníková síť, útvary A, B, C z očíslovaných tmavých trojúhelníků,
   „odeber → osově souměrný“ (8.1) a „přesuň → středově souměrný, najděte všechna řešení“ (8.2).
   U nás jsou obě části o dvou řešeních po 2 b. (pozice 8 zůstává za 4 b.) a body se počítají podle
   počtu správných (viz `prijimacky-hodnotreseni`).

   PROČ TO NENÍ KRUH. Banka počítá přesně v celých číslech nad souřadnicemi mřížky. Test útvar PŘEČTE Z KRESBY
   (polygony s vrcholy v pixelech) a souměrnost počítá skutečnou geometrií (`trojuhelniky-sit.cjs`): osa vede
   těžištěm útvaru a každý trojúhelník se po odrazu všech tří vrcholů trefí přesně na jiný; střed souměrnosti je
   těžiště. Z toho vyjde množina řešení (odebrání: čtverce → trojúhelníky, jejichž odebráním vznikne osa; přesunutí:
   trojúhelníky, které jdou přesunout na jiné prázdné pole tak, aby vznikl střed), dvojice protějšků i směr osy
   z postupu. Každá pojistka je ověřená sabotáží zdroje banky (viz konec).
   Spusť: node tests/prijimacky-trojuhelniky.test.cjs [cesta-k-bance.js]
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const BANKA = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'projects', 'rpg-cermat-9.js');
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
const TITUL = 'Útvary v trojúhelníkové síti';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
const T = require('./trojuhelniky-sit.cjs');

const SMER = { 0: 'vodorovná', 90: 'svislá' };                    // ostatní směry jsou „šikmá“
const smerSlovem = uhel => SMER[uhel] || 'šikmá';

/* Čísla v kroku postupu čte dítě: dvojice jdou podle menšího čísla vzestupně (každá „a ↔ b“ má a < b) a trojúhelníky na ose
   vzestupně — dřív stály v pořadí prvků útvaru („Na ose leží trojúhelníky 6, 3 a 1“). */
function poradiVKroku(krok) {
  const pary = [...krok.matchAll(/(\d+) ↔ (\d+)/g)].map(m => [+m[1], +m[2]]);
  const naOse = /Na ose leží trojúhelníky? ([^.]+)\./.exec(krok), cisla = naOse ? naOse[1].match(/\d+/g).map(Number) : [];
  return pary.every(([p, q], i) => p < q && (!i || pary[i - 1][0] < p)) && cisla.every((c, i) => !i || cisla[i - 1] < c);
}

function zkontroluj(C, N) {
  const chyby = [], st = { n: 0, vyjimek: 0, kose: [0, 0, 0, 0, 0], obaKrajni: 0, smery: { vodorovná: 0, svislá: 0, šikmá: 0 }, velikosti: new Set() };
  const chyba = m => { if (chyby.length < 8 && !chyby.includes(m)) chyby.push(m); };
  let g = 0;
  while (st.n < N && g++ < N * 60) {
    let t; try { t = C.genSlot(7); } catch (e) { st.vyjimek++; chyba('generátor spadl: ' + e.message); continue; }
    if (t.title !== TITUL) continue;
    st.n++;
    if (t.no !== 8 || t.points !== 4 || !t.parts || t.parts.length !== 2 || t.parts.some(p => p.points !== 2)) chyba('tvar úlohy (pozice 8, 4 b., 2 části po 2 b.)');
    const { u, prazdne } = T.ctiTr(t.svg);
    ['A', 'B', 'C'].forEach(p => {
      u[p].sort((a, b) => a.n - b.n);
      const b = u[p]; st.velikosti.add(b.length);
      if (b.length < 8 || b.length > 14) chyba('útvar ' + p + ' má ' + b.length + ' trojúhelníků (8–14)');
      if (b.some((c, i) => c.n !== i + 1)) chyba('čísla trojúhelníků nejsou 1…n');
      if (!T.poradiOk(b)) chyba('čísla nejdou shora dolů a v řadě zleva doprava (útvar ' + p + ')');
      if (new Set(b.map(c => T.klicV(c.pts))).size !== b.length) chyba('dva trojúhelníky na jednom místě');
      if (!T.dotykV(b)) chyba('útvar ' + p + ' se rozpadá na kusy (nedotýká se ani vrcholem)');
      if (b.some(c => c.pts.some(([x, y]) => x < 7 || x > 388 || y < 15 || y > 317))) chyba('trojúhelník mimo plátno');
      // rovnostranný trojúhelník o straně 30
      if (b.some(c => { const d = (i, j) => Math.hypot(c.pts[i][0] - c.pts[j][0], c.pts[i][1] - c.pts[j][1]); return [d(0, 1), d(1, 2), d(0, 2)].some(x => Math.abs(x - 30) > 0.3); })) chyba('trojúhelník není rovnostranný o straně 30');
      if (prazdne[p].length < 30) chyba('síť útvaru ' + p + ' má jen ' + prazdne[p].length + ' prázdných polí');
    });
    // čísla jsou uvnitř svého trojúhelníku
    const txt = [...t.svg.matchAll(/<text data-na-vyplni="#1b6f8f" x="([\d.]+)" y="([\d.]+)"[^>]*>(\d+)<\/text>/g)];
    const vse = ['A', 'B', 'C'].flatMap(p => u[p]);
    if (txt.length !== vse.length) chyba('počet čísel ' + txt.length + ' ≠ počet trojúhelníků ' + vse.length);
    // 1) útvary A a B: osově souměrné odebráním jednoho ze dvou trojúhelníků, sám útvar souměrný není
    const R = { A: T.reseniOdebrani(u.A), B: T.reseniOdebrani(u.B), C: T.reseniPresunuti(u.C, prazdne.C) };
    ['A', 'B'].forEach(p => { if (T.osyTr(u[p]).length) chyba('útvar ' + p + ' je sám osově souměrný'); if (R[p].length !== 2) chyba('útvar ' + p + ' nemá právě dvě řešení odebráním (' + R[p].join(',') + ')'); });
    if (T.stredTr(u.C)) chyba('útvar C je sám středově souměrný');
    if (R.C.length !== 2) chyba('útvar C nemá právě dvě řešení přesunutím (' + R.C.join(',') + ')');
    const mA = /odebráním trojúhelníku (\d+), nebo trojúhelníku (\d+)\./.exec(t.intro || '');
    if (!mA || [+mA[1], +mA[2]].sort((a, b) => a - b).join() !== R.A.slice().sort((a, b) => a - b).join()) chyba('vzor A: v zadání ' + (mA && mA[1] + ', ' + mA[2]) + ', správně ' + R.A.join(','));
    if (!/dvě řešení/.test(t.intro || '') || !/2 body/.test(t.intro || '')) chyba('zadání neříká, že jsou dvě řešení a jak se boduje');
    // 2) části 8.1 (B, odebrání) a 8.2 (C, přesunutí)
    [['B', 0], ['C', 1]].forEach(([p, i]) => {
      const part = t.parts[i], r = R[p].slice().sort((a, b) => a - b), b = u[p];
      if (!Array.isArray(part.reseni) || part.reseni.map(Number).sort((a, b2) => a - b2).join() !== r.join()) chyba('část ' + part.key + ': řešení v bance ' + (part.reseni || []).join(',') + ', správně ' + r.join(','));
      if (part.points !== r.length) chyba('část ' + part.key + ': body ' + part.points + ' ≠ počet řešení ' + r.length);
      if (String(part.ans) !== r.join('; ')) chyba('část ' + part.key + ': zobrazená odpověď „' + part.ans + '“, správně „' + r.join('; ') + '“');
      if (!part.prompt.includes('útvaru ' + p) || !/obě řešení/.test(part.prompt)) chyba('část ' + part.key + ' se neptá na útvar ' + p + ' a na obě řešení');
      if (!(i === 0 ? /odebráním/ : /přesunutím/).test(part.prompt) || !(i === 0 ? /osově/ : /středově/).test(part.prompt)) chyba('část ' + part.key + ': druh úkonu nebo souměrnosti v zadání neodpovídá (odebrání → osově, přesunutí → středově)');
      if (!Array.isArray(part.sol) || part.sol.length < 4) { chyba('postup ' + part.key + ' má méně než 4 kroky'); return; }
      if (!new RegExp('Obě řešení pro útvar ' + p + ': ' + r[0] + ' a ' + r[1] + '\\.').test(part.sol[part.sol.length - 1])) chyba('postup ' + part.key + ' nekončí oběma řešeními');
      r.forEach(n => {
        if (i === 0) {
          const krok = part.sol.find(k => new RegExp('^Po odebrání trojúhelníku ' + n + ' vychází').test(k));
          if (!krok) { chyba('postup 8.1: chybí krok pro řešení ' + n); return; }
          if (!poradiVKroku(krok)) chyba('postup 8.1: dvojice nebo trojúhelníky na ose nejsou vzestupně (' + krok.slice(0, 120) + ')');
          const osy = T.osyTr(T.bez(b, n)), m = /vychází (vodorovná|svislá|šikmá) osa/.exec(krok);
          // dvojice protějšků z kroku musí být dvojicemi podle NĚJAKÉ osy a slovo směru musí patřit téže ose
          const sedi = osy.some(o => T.paryPodle(T.bez(b, n), o.f, -1).pary === T.paryZTextu(krok) && m && smerSlovem(o.uhel) === m[1]);
          if (!sedi) chyba('postup 8.1: dvojice nebo směr osy pro řešení ' + n + ' nesedí na žádnou osu útvaru');
          osy.slice(0, 1).forEach(o => { st.smery[smerSlovem(o.uhel)]++; });
        } else {
          const krok = part.sol.find(k => new RegExp('^Přesuneme-li trojúhelník ' + n + ' na místo protějšku').test(k));
          if (!krok) { chyba('postup 8.2: chybí krok pro řešení ' + n); return; }
          if (!poradiVKroku(krok)) chyba('postup 8.2: dvojice nejsou vzestupně (' + krok.slice(0, 120) + ')');
          const m = /protějšku trojúhelníku (\d+),/.exec(krok), mm = m && +m[1];
          const cile = T.cilePresunuti(b, prazdne.C, n);
          // zbylé dvojice musí být dvojicemi podle středu vzniklého útvaru (bez trojúhelníku mm, jehož protějškem je přesunutý)
          const mmC = b.find(x => x.n === mm);
          const sedi = !!mmC && cile.some(c => {
            const bezMm = c.nb.filter(x => x.n !== mm && x.n !== -1);
            return T.paryPodle(bezMm, c.s.f, -2).pary === T.paryZTextu(krok) && T.blizko(T.teziste(c.s.f, mmC), c.q.t);
          });
          if (!sedi) chyba('postup 8.2: dvojice nebo „na místo protějšku trojúhelníku ' + mm + '“ pro řešení ' + n + ' nesedí na žádný střed');
        }
      });
      // polohy řešení v pořadí: nesmí prozradit odpověď (první a poslední zároveň)
      const n = b.length;
      if (r.includes(1) && r.includes(n)) st.obaKrajni++;
      r.forEach(x => { st.kose[Math.min(4, Math.floor((x - 1) / n * 5))]++; });
    });
  }
  st.chyby = chyby;
  return st;
}

console.log('\n── Test nanečisto: útvary v trojúhelníkové síti ──\n');
const C = nactiBanku(ZDROJ);
const N = 300;
const t0 = Date.now();
const S = zkontroluj(C, N);
const sek = ((Date.now() - t0) / 1000).toFixed(1);
ok(S.n >= N * 0.98, 'úloha se vygenerovala ' + S.n + '× (' + sek + ' s)', 'čekáno ' + N);
ok(S.vyjimek === 0, 'generátor ani jednou nespadl (zacyklení / vyčerpané pokusy)');
ok(S.chyby.length === 0, 'útvary, řešení, číslování i postupy sedí s NEZÁVISLOU geometrií z kresby', S.chyby.join(' | '));
const smeruCelkem = S.smery.vodorovná + S.smery.svislá + S.smery.šikmá;
ok(smeruCelkem > 0 && Math.min(S.smery.vodorovná, S.smery.svislá, S.smery.šikmá) / smeruCelkem >= 0.08,
  'osy v 8.1 jsou vodorovné, svislé i šikmé (' + S.smery.vodorovná + ' / ' + S.smery.svislá + ' / ' + S.smery.šikmá + ')');
ok(S.velikosti.size >= 3, 'velikosti útvarů se liší (' + [...S.velikosti].sort((a, b) => a - b).join(', ') + ' trojúhelníků)');
const kS = S.kose.reduce((a, b) => a + b, 0);
ok(S.obaKrajni === 0, 'řešení části 8.1 ani 8.2 nejsou zároveň první a poslední číslo útvaru (' + S.obaKrajni + ' částí)');
ok(Math.min(...S.kose) / kS >= 0.07, 'čísla obou řešení jsou v útvaru na začátku i na konci (pětiny: ' + S.kose.map(k => (k / kS * 100).toFixed(0) + ' %').join(' / ') + ')');

/* ── Světlý motiv: každá barva kresby má pravidlo (jinak by na bílé zůstala tmavá a splynula) ── */
{
  const core = fs.readFileSync(JADRO, 'utf8');
  const i = core.indexOf('const SVG_MAP'), blok = core.slice(i, core.indexOf('];', i));
  const MAP = [...blok.matchAll(/\['(#[0-9a-f]{3,6})',\s*'(#[0-9a-f]{3,6})'\]/g)].map(m => [m[1], m[2]]);
  let t; do { t = C.genSlot(7); } while (t.title !== TITUL);
  const barvy = [...new Set([...t.svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,6})"/g)].map(m => m[1]))];
  const bez = barvy.filter(c => !MAP.some(([a]) => a === c));
  ok(bez.length === 0, 'každá barva kresby má pravidlo pro světlý motiv (' + barvy.join(', ') + ')', bez.join(', '));
}

/* ── Sabotáže: každá pojistka musí něco chytit ── */
const sabotaze = [
  ['dvojice a trojúhelníky na ose v postupu nejsou seřazené', "pary: pary.sort((p, q) => p[0] - q[0]).map(([n, m]) => `${n} ↔ ${m}`).join(', '), naOse: naOse.sort((p, q) => p - q) };", "pary: pary.map(([n, m]) => `${n} ↔ ${m}`).join(', '), naOse };"],
  ['druhé řešení části 8.1 v bance je jiný trojúhelník', "reseni: rB.map(String), sol: osaTxt", "reseni: rB.map((x, i) => String(i ? (x === 1 ? 2 : x - 1) : x)), sol: osaTxt"],
  ['řešič zná jen dvě zrcadla (vodorovné a svislé)', 'const TR_ODRAZ = [0, 1, 2, 3, 4, 5].map(', 'const TR_ODRAZ = [0, 3, 0, 3, 0, 3].map('],
  ['čísla trojúhelníků jdou od dolní řady', 'const radek = c => c.j, sloupec', 'const radek = c => -c.j, sloupec'],
  ['části 8.2 se přesouvá, ne odebírá (řešení se počítá jako odebrání)', 'const reseni = trPresunuti(F), trida', 'const reseni = trOdebrani(F), trida'],
  ['řešení části jsou právě první a poslední číslo', "if (cs.every(x => x === 1 || x === n)) return null;", ''],
  ['body části nejsou počet řešení', "{ key: '8.2', points: 2, prompt: `Určete číslo trojúhelníku, jehož přesunutím", "{ key: '8.2', points: 3, prompt: `Určete číslo trojúhelníku, jehož přesunutím"],
  ['postup 8.2 odkazuje na jiného protějška', 'na místo protějšku trojúhelníku ${trCislo(u, m)}', 'na místo protějšku trojúhelníku ${trCislo(u, m) + 1}'],
  ['postup 8.1 popisuje osu jako svislou, i když není', "const TR_OSA = ['vodorovná', 'šikmá', 'šikmá', 'svislá', 'šikmá', 'šikmá'];", "const TR_OSA = ['svislá', 'šikmá', 'šikmá', 'svislá', 'šikmá', 'šikmá'];"],
  ['útvar je souvislý jen přes hranu místo vrcholu — rozpad na kusy', 'if (F.length < 8 || F.length > 14 || !trSouvisly(F) || trOsy(F).length) continue;', 'if (F.length < 8 || F.length > 14 || trOsy(F).length) continue;']
];
sabotaze.forEach(([popis, hledej, nahrad]) => {
  const pocet = ZDROJ.split(hledej).length - 1;
  ok(pocet === 1, 'sabotáž „' + popis + '“ se aplikovala (' + pocet + '× nalezeno)');
  if (pocet !== 1) return;
  let v;
  try { v = zkontroluj(nactiBanku(ZDROJ.replace(hledej, () => nahrad)), 120); }
  catch (e) { v = { chyby: ['pád: ' + e.message], vyjimek: 1, obaKrajni: 0, kose: [1, 1, 1, 1, 1], n: 0 }; }
  const ks = v.kose.reduce((a, b) => a + b, 0), nerovn = ks > 0 && (Math.min(...v.kose) / ks < 0.07 || v.obaKrajni > 0);
  ok(v.chyby.length > 0 || v.vyjimek > 0 || nerovn, 'sabotáž „' + popis + '“ je chycena (' + ((v.chyby[0] || (nerovn ? 'řešení u okraje útvaru' : '')) + '').slice(0, 80) + ')', 'test prošel i nad rozbitou bankou');
});

console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
