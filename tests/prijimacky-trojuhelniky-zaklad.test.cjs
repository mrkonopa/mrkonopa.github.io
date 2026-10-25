/* ═════════════════════════════════════════════════════════════════
   Úroveň „základ“ (procvičování, diagnostika): osová souměrnost v TROJÚHELNÍKOVÉ síti — jeden útvar, jedno řešení.

   Banka testu nanečisto má trojúhelníkovou síť v úloze 8 (gen8i, dvě řešení po 2 b.); základ ji dřív neměl vůbec,
   jen čtvercovou (soumernostG). Generátor `zakladTrojuhelniky` střídá „je útvar osově souměrný?“ (A/N) a „který
   trojúhelník odebrat?“ nad útvarem o 6–8 trojúhelnících s vodorovnou nebo svislou osou; odpověď i postup počítá
   řešič z gen8i (tr*), takže druhá kopie geometrie nevzniká.

   PROČ TO NENÍ KRUH. Test útvar PŘEČTE Z KRESBY (polygony s vrcholy v pixelech) a souměrnost počítá skutečnou
   euklidovskou geometrií (`trojuhelniky-sit.cjs`: osa vede těžištěm a každý trojúhelník se po odrazu všech tří
   vrcholů trefí na jiný), ne celočíselnými vzorci generátoru. Z toho vyjde pravdivost A/N, množina řešení
   „odeber“, směr osy i dvojice protějšků z postupu.

   POČET TROJÚHELNÍKŮ NESMÍ PROZRADIT ODPOVĚĎ. První verze brala nesouměrný útvar jako souměrný bez jednoho
   trojúhelníku, takže měl vždy o jeden méně: při 5 trojúhelnících bylo správně N ve 100 %, při 8 A ve 100 %
   (a při 6 A v 88 %). Teď mají souměrný i nesouměrný útvar stejný počet a test hlídá podíl A podle počtu.

   Spusť: node tests/prijimacky-trojuhelniky-zaklad.test.cjs
   ═════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const BANKA = path.join(ROOT, 'projects', 'rpg-cermat-9.js');
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => (n === 1 ? o : (n >= 2 && n <= 4 ? f : m));
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar',
  'svgCuboid', 'svgSloupce', 'svgTezitko'].forEach(f => { global[f] = () => '<svg></svg>'; });
const nactiBanku = src => { const win = {}; new Function('window', src)(win); return win.RPG_CERMAT_9; };
const ZDROJ = fs.readFileSync(BANKA, 'utf8');
const T = require('./trojuhelniky-sit.cjs');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const smer = uhel => (uhel === 0 ? 'vod' : uhel === 90 ? 'sv' : 'jina');
const SLOVEM = { vod: 'vodorovná', sv: 'svislá' };

function zkontroluj(C, N) {
  const chyby = [], st = { n: 0, vyjimek: 0, yn: 0, A: 0, odeber: 0, kose: [0, 0, 0, 0, 0], extrem: 0, osy: { vod: 0, sv: 0, jina: 0 },
    velikosti: {}, poVelikosti: {}, uzky: 0 };
  const chyba = m => { if (chyby.length < 8 && !chyby.includes(m)) chyby.push(m); };
  for (let i = 0; i < N; i++) {
    let z; try { z = C.zakladTrojuhelniky(); } catch (e) { st.vyjimek++; chyba('generátor spadl: ' + e.message); continue; }
    st.n++;
    const { u } = T.ctiTr(z.svg), b = u.A.slice().sort((p, q) => p.n - q.n);
    if (!b.length) { chyba('útvar nejde přečíst z kresby'); continue; }
    if (u.B.length || u.C.length) chyba('na obrázku základu je víc než jeden útvar');
    if (!/style="width:100%;max-width:250px"/.test(z.svg) || !/viewBox="0 0 196 /.test(z.svg)) chyba('jediný útvar nemá vlastní (úzký) obrázek');
    else st.uzky++;
    const n = b.length;
    st.velikosti[n] = (st.velikosti[n] || 0) + 1;
    if (n < 6 || n > 8) chyba('útvar základu má ' + n + ' trojúhelníků (6–8)');
    if (b.some((c, k) => c.n !== k + 1)) chyba('čísla trojúhelníků nejsou 1…n');
    if (!T.poradiOk(b)) chyba('čísla nejdou shora dolů a v řadě zleva doprava');
    if (new Set(b.map(c => T.klicV(c.pts))).size !== n) chyba('dva trojúhelníky na jednom místě');
    if (!T.dotykV(b)) chyba('útvar se rozpadá na kusy');
    if (b.some(c => c.pts.some(([x, y]) => x < 7 || x > 189 || y < 15 || y > 155))) chyba('trojúhelník mimo plátno');
    if (b.some(c => { const d = (p, q) => Math.hypot(c.pts[p][0] - c.pts[q][0], c.pts[p][1] - c.pts[q][1]); return [d(0, 1), d(1, 2), d(0, 2)].some(x => Math.abs(x - 30) > 0.3); })) chyba('trojúhelník není rovnostranný o straně 30');
    if (!z.prompt || !z.intro || !z.hint1 || !z.hint2 || !Array.isArray(z.sol) || z.sol.length < 3) chyba('chybí zadání, nápověda nebo třikrokový postup');
    const osy = T.osyTr(b);
    const jenSvVo = os => os.every(o => smer(o.uhel) !== 'jina');
    const naOseZTextu = t => { const m = /Na ose leží trojúhelníky? ([^.]+)\./.exec(t); return m ? (m[1].match(/\d+/g) || []).join(',') : ''; };
    if (z.type === 'yn') {
      st.yn++;
      const sou = osy.length > 0;
      (st.poVelikosti[n] = st.poVelikosti[n] || [0, 0])[sou ? 0 : 1]++;
      if (z.ans !== (sou ? 'A' : 'N')) chyba('A/N: odpověď ' + z.ans + ', útvar má ' + osy.length + ' os');
      if (sou) {
        st.A++;
        if (!jenSvVo(osy)) chyba('A/N: souměrný útvar má šikmou osu (' + osy.map(o => o.uhel).join(',') + '°)');
        osy.forEach(o => { st.osy[smer(o.uhel)]++; });
        const shoda = osy.some(o => { const p = T.paryPodle(b, o.f, -1); return p.pary === T.paryZTextu(z.sol[1]) && p.naOse === naOseZTextu(z.sol[1]) && z.sol[1].includes(SLOVEM[smer(o.uhel)] + ' osa'); });
        if (!shoda) chyba('A/N postup: dvojice protějšků, trojúhelníky na ose a směr osy nesedí na žádnou osu útvaru');
        if (!/Správně je A/.test(z.sol[2])) chyba('A/N postup nekončí odpovědí A');
      } else {
        const r = T.reseniOdebrani(b), m = /Trojúhelník (\d+) ale protějšek nemá/.exec(z.sol[1]);
        if (r.length !== 1) chyba('nesouměrný útvar základu nemá právě jedno řešení (' + r.join(',') + ')');
        else if (!m || +m[1] !== r[0]) chyba('A/N postup: trojúhelník bez protějšku ' + (m && m[1]) + ', správně ' + r.join(','));
        else {
          const os = T.osyTr(T.bez(b, r[0]));
          if (!os.length || !jenSvVo(os)) chyba('A/N: zbytek nemá vodorovnou nebo svislou osu');
          os.forEach(o => { st.osy[smer(o.uhel)]++; });
          if (!os.some(o => { const p = T.paryPodle(b, o.f, r[0]); return p.pary === T.paryZTextu(z.sol[1]) && z.sol[1].includes(SLOVEM[smer(o.uhel)] + ' osa'); })) chyba('A/N postup: dvojice protějšků nebo směr osy nesedí');
        }
        if (!/Správně je N/.test(z.sol[2])) chyba('A/N postup nekončí odpovědí N');
      }
    } else {
      st.odeber++;
      const r = T.reseniOdebrani(b);
      if (osy.length) chyba('útvar „odeber trojúhelník“ je sám souměrný');
      if (r.length !== 1) chyba('„odeber trojúhelník“: řešení není právě jedno (' + r.join(',') + ')');
      else {
        if (String(z.ans) !== String(r[0])) chyba('„odeber trojúhelník“: odpověď ' + z.ans + ', správně ' + r.join(','));
        st.kose[Math.min(4, Math.floor((r[0] - 1) / n * 5))]++;
        if (r[0] === 1 || r[0] === n) st.extrem++;
        const os = T.osyTr(T.bez(b, r[0]));
        if (!os.length || !jenSvVo(os)) chyba('„odeber trojúhelník“: zbytek nemá vodorovnou nebo svislou osu');
        os.forEach(o => { st.osy[smer(o.uhel)]++; });
        if (!os.some(o => { const p = T.paryPodle(b, o.f, r[0]); return p.pary === T.paryZTextu(z.sol[1]) && p.naOse === naOseZTextu(z.sol[1]) && z.sol[1].includes(SLOVEM[smer(o.uhel)] + ' osa'); })) chyba('„odeber trojúhelník“ postup: dvojice protějšků, trojúhelníky na ose nebo směr osy nesedí');
        if (!z.sol[1].includes('bez protějšku je trojúhelník ' + r[0] + '.')) chyba('„odeber trojúhelník“ postup: jediný trojúhelník bez protějšku není ' + r[0]);
        if (!new RegExp('odpověď je ' + z.ans + '\\.').test(z.sol[2])) chyba('„odeber trojúhelník“ postup nekončí odpovědí');
      }
    }
  }
  st.chyby = chyby;
  return st;
}

console.log('\n── Základ: osová souměrnost v trojúhelníkové síti ──\n');
const C = nactiBanku(ZDROJ);
ok(typeof C.zakladTrojuhelniky === 'function', 'banka vystavuje zakladTrojuhelniky');
const N = 1500, Z = zkontroluj(C, N);
ok(Z.n === N && Z.vyjimek === 0, 'vygenerovalo se ' + Z.n + ' úloh, generátor nespadl (' + Z.yn + ' A/N, ' + Z.odeber + ' „odeber trojúhelník“)');
ok(Z.uzky === Z.n, 'jediný útvar má vlastní úzký obrázek (' + Z.uzky + ' z ' + Z.n + ')');
ok(Z.chyby.length === 0, 'útvar, odpověď, jedinost řešení i postup sedí s NEZÁVISLÝM řešičem nad kresbou', Z.chyby.join(' | '));
const so = Z.osy.vod + Z.osy.sv;
ok(Z.osy.jina === 0 && so > 0 && Math.min(Z.osy.vod, Z.osy.sv) / so >= 0.25, 'osa je jen vodorovná nebo svislá, obě stejně často (vodorovná ' + Z.osy.vod + ', svislá ' + Z.osy.sv + ', jiná ' + Z.osy.jina + ')');
const vel = Object.keys(Z.velikosti).map(Number).sort((a, b) => a - b);
ok(vel.join() === '6,7,8' && vel.every(k => Z.velikosti[k] / Z.n >= 0.25), 'útvary mají 6, 7 i 8 trojúhelníků zhruba stejně často (' + vel.map(k => k + ': ' + (100 * Z.velikosti[k] / Z.n).toFixed(0) + ' %').join(', ') + ')');
const podYn = Z.yn / Z.n, podA = Z.A / Z.yn;
ok(podYn >= 0.4 && podYn <= 0.6, 'A/N a „odeber trojúhelník“ se střídají zhruba stejně (A/N ' + (podYn * 100).toFixed(0) + ' %)');
ok(podA >= 0.4 && podA <= 0.6, 'souměrný útvar je zhruba v polovině A/N úloh (' + (podA * 100).toFixed(0) + ' %), odpověď se neodhadne');
const podle = vel.map(k => { const [a, nn] = Z.poVelikosti[k] || [0, 0]; return { k, a, nn, p: a / Math.max(1, a + nn) }; });
ok(podle.every(x => x.a + x.nn >= 100 && x.p >= 0.4 && x.p <= 0.6), 'počet trojúhelníků neprozradí odpověď A/N (podíl A: ' + podle.map(x => x.k + ': ' + (x.p * 100).toFixed(0) + ' %').join(', ') + ')');
const kz = Z.kose.reduce((a, b) => a + b, 0);
ok(kz === Z.odeber && Z.extrem === 0, 'odebíraný trojúhelník není první ani poslední (' + Z.extrem + ' z ' + Z.odeber + ')');
// odpověď není první ani poslední, takže poslední pětina (číslo ≥ 80 % počtu) je nedosažitelná; ostatní čtyři musí být zastoupené
ok(Z.kose[4] === 0 && Math.min(...Z.kose.slice(0, 4)) / kz >= 0.12, 'odebíraný trojúhelník je ze všech čtyř dosažitelných pětin útvaru (pětiny: ' + Z.kose.map(k => (k / kz * 100).toFixed(0) + ' %').join(' / ') + ')');

/* ── Sabotáže: každá pojistka musí něco chytit ──────────────────── */
const sabotaze = [
  ['A/N má obrácenou odpověď', "ans: souměrný ? 'A' : 'N',\n        hint1: 'Útvar je souměrný, když každý trojúhelník", "ans: souměrný ? 'N' : 'A',\n        hint1: 'Útvar je souměrný, když každý trojúhelník"],
  ['„odeber trojúhelník“ odpovídá jiný trojúhelník', "type: 'text', ans: String(cislo),", "type: 'text', ans: String(cislo === 1 ? 2 : cislo - 1),"],
  ['nesouměrný útvar má o trojúhelník víc než souměrný', 'const m = nes ? n - 1 : n, pool = [], os =', 'const m = nes ? n : n - 1, pool = [], os ='],
  ['útvar smí mít i šikmou osu (šestiúhelník ze šesti trojúhelníků)', "if (!osy.length || osy.some(o => o.k !== 0 && o.k !== 3)) continue;\n      if (!nes)", "if (!osy.length) continue;\n      if (!nes)"],
  ['generátor nehlídá jedinost řešení', 'r.length === 1 && trKlic(r[0]) === trKlic(c))(trOdebrani(F))', 'r.some(x => trKlic(x) === trKlic(c)))(trOdebrani(F))'],
  ['postup A/N ukazuje jiný trojúhelník bez protějšku', 'Trojúhelník ${trCislo(u, U.Z)} ale protějšek nemá', 'Trojúhelník ${trCislo(u, U.Z) % n + 1} ale protějšek nemá'],
  ['odebíraný trojúhelník smí být první nebo poslední', 'if (trida) pool.push({ F, jadro, Z, trida });', 'pool.push({ F, jadro, Z, trida: trida || "0" });'],
  ['postup A uvádí jiný směr osy, než má útvar', 'Vychází ${TR_OSA[os.k]} osa souměrnosti. Protějšky tvoří dvojice trojúhelníků ${d.pary}. ${naOseTxt(d)}`, `Každý', 'Vychází ${TR_OSA[os.k === 0 ? 3 : 0]} osa souměrnosti. Protějšky tvoří dvojice trojúhelníků ${d.pary}. ${naOseTxt(d)}`, `Každý'],
  ['útvar je na obrázku dva (síť vedle prázdná)', 'const sam = utvary.length === 1;', 'const sam = false;']
];
sabotaze.forEach(([popis, ...dvojice]) => {
  let zdroj = ZDROJ, pocty = [];
  for (let i = 0; i < dvojice.length; i += 2) {
    const pocet = zdroj.split(dvojice[i]).length - 1;
    pocty.push(pocet);
    if (pocet === 1) zdroj = zdroj.replace(dvojice[i], () => dvojice[i + 1]);
  }
  const aplikovana = pocty.every(p => p === 1) && zdroj !== ZDROJ;
  ok(aplikovana, 'sabotáž „' + popis + '“ se aplikovala (nalezeno ' + pocty.join('+') + '×)');
  if (!aplikovana) return;
  let v;
  try { v = zkontroluj(nactiBanku(zdroj), 400); } catch (e) { v = { chyby: ['pád: ' + e.message], vyjimek: 1, poVelikosti: {}, velikosti: {}, kose: [1, 1, 1, 1, 1], extrem: 0, odeber: 1, osy: { vod: 1, sv: 1, jina: 0 }, uzky: 0, n: 400 }; }
  const pv = Object.keys(v.poVelikosti).map(k => v.poVelikosti[k]).filter(x => x[0] + x[1] >= 20).some(([a, nn]) => a / (a + nn) < 0.3 || a / (a + nn) > 0.7);
  const nerovn = v.odeber > 0 && v.extrem > 0;
  const chyceno = v.chyby.length > 0 || v.vyjimek > 0 || pv || nerovn || v.uzky < v.n;
  ok(chyceno, 'sabotáž „' + popis + '“ je chycena (' + (v.chyby[0] || (pv ? 'počet trojúhelníků prozradí odpověď' : nerovn ? 'odpověď je první nebo poslední' : v.uzky < v.n ? 'obrázek není úzký' : v.vyjimek ? 'výjimka' : '')).slice(0, 80) + ')', 'test prošel i nad rozbitým zdrojem');
});

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
process.exit(fail ? 1 : 0);
