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

/* Slovní popis osy z GEOMETRIE (ne z banky): svislá x = c, vodorovná y = c, jinak podle znaménka. Souřadnice buněk jako v kresbě. */
function popisOsyGeom(o) {
  const [a, b, c] = o.os;
  if (Math.abs(b) < 1e-7) { const x = Math.round(c / a * 2) / 2; return Number.isInteger(x) ? 'svislá osa vedoucí středem sloupce č. ' + (x + 1) : 'svislá osa vedoucí mezi sloupci č. ' + (Math.floor(x) + 1) + ' a ' + (Math.floor(x) + 2); }
  if (Math.abs(a) < 1e-7) { const y = Math.round(c / b * 2) / 2; return Number.isInteger(y) ? 'vodorovná osa vedoucí středem řádku č. ' + (y + 1) : 'vodorovná osa vedoucí mezi řádky č. ' + (Math.floor(y) + 1) + ' a ' + (Math.floor(y) + 2); }
  return a * b > 0 ? 'šikmá osa vedoucí přes středy čtverců zleva zdola doprava nahoru' : 'šikmá osa vedoucí přes středy čtverců zleva shora doprava dolů';
}

/* ── Hlavní kontrola nad jednou bankou (původní, nebo sabotovanou) ── */
function zkontroluj(C, N8, N11) {
  const chyby = [], st = {
    utvaru: 0, ukol8: 0, ukol11: 0, vyjimek: 0, rodiny: { sv: 0, vo: 0, d: 0, a: 0 }, p1: 0, p2: 0, p3: 0, dveOsy: 0, obaKrajni: 0,
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

  /* Pozice 8: v každé části DVĚ řešení (M9D 2023 ú. 8). Čtverce, jejichž odebráním útvar zesouměrní,
     se dopočtou skutečnou geometrií z kresby; banka musí uvádět právě tutéž množinu. */
  for (const t of losuj(7, T8, N8)) {
    st.ukol8++;
    if (t.no !== 8 || t.points !== 4 || !t.parts || t.parts.length !== 2 || t.parts.some(p => p.points !== 2)) chyba('pozice 8: tvar úlohy (2 části po 2 b.)');
    const u = kresba(t);
    const R = { A: reseniOdebrani(u.A), B: reseniOdebrani(u.B), C: reseniOdebrani(u.C) };
    ['A', 'B', 'C'].forEach(p => {
      if (osyGeom(pole(u[p])).length) chyba('útvar ' + p + ' je sám souměrný');
      if (R[p].length !== 2) chyba('útvar ' + p + ' nemá právě dvě řešení (' + R[p].join(',') + ')');
    });
    const mA = /odebráním čtverce (\d+), nebo čtverce (\d+)\./.exec(t.intro || '');
    if (!mA || [+mA[1], +mA[2]].sort((a, b) => a - b).join() !== R.A.slice().sort((a, b) => a - b).join()) chyba('vzor A: v zadání ' + (mA && mA[1] + ', ' + mA[2]) + ', správně ' + R.A.join(','));
    if (!/dvě řešení/.test(t.intro || '') || !/2 body/.test(t.intro || '')) chyba('zadání neříká, že jsou dvě řešení a jak se boduje');
    [['B', 0], ['C', 1]].forEach(([p, i]) => {
      const part = t.parts[i], r = R[p].slice().sort((a, b) => a - b);
      if (!Array.isArray(part.reseni) || part.reseni.map(Number).sort((a, b) => a - b).join() !== r.join()) chyba('část ' + part.key + ': řešení v bance ' + (part.reseni || []).join(',') + ', správně ' + r.join(','));
      if (part.points !== r.length) chyba('část ' + part.key + ': body ' + part.points + ' ≠ počet řešení ' + r.length);
      if (String(part.ans) !== r.join('; ')) chyba('část ' + part.key + ': zobrazená odpověď „' + part.ans + '“, správně „' + r.join('; ') + '“');
      if (!part.prompt.includes('útvaru ' + p) || !/obě řešení/.test(part.prompt)) chyba('část ' + part.key + ' se neptá na útvar ' + p + ' a na obě řešení');
      if (!Array.isArray(part.sol) || part.sol.length < 4) chyba('postup ' + part.key + ' má méně než 4 kroky');
      else {
        if (!new RegExp('Obě řešení pro útvar ' + p + ': ' + r[0] + ' a ' + r[1] + '\\.').test(part.sol[part.sol.length - 1])) chyba('postup ' + part.key + ' nekončí oběma řešeními');
        // každé řešení má svůj krok: dvojice čtverců musí sedět na osu útvaru bez toho čtverce
        r.forEach(n => {
          const krok = part.sol.find(k => new RegExp('^Po odebrání čtverce ' + n + ' vychází').test(k));
          if (!krok) { chyba('postup ' + part.key + ': chybí krok pro řešení ' + n); return; }
          const osy = osyGeom(pole(bez(u[p], n)));
          if (!osy.map(o => paryPodleOsy(u[p], o, n)).includes(paryZTextu(krok))) chyba('postup ' + part.key + ': dvojice čtverců pro řešení ' + n + ' nesedí na žádnou osu');
          // slovní popis osy v kroku musí být tou osou, ne jinou (dvojice čtverců pak sedí na osu, o které se nemluví)
          if (!osy.some(o => krok.includes('vychází ' + popisOsyGeom(o)))) chyba('postup ' + part.key + ': popis osy pro řešení ' + n + ' („' + (/vychází ([^.]*) \(?/.exec(krok) || [])[1] + '“) nesedí na osu útvaru');
          osy.slice(0, 1).forEach(o => { if (o.rodina === 'jina') chyba('část ' + part.key + ': osa jiného směru než svislá, vodorovná a pod 45°'); else st.rodiny[o.rodina]++; });
        });
        // dvě řešení = dvě RŮZNÉ osy (jinak by jeden čtverec šlo odebrat dvakrát stejným způsobem)
        const osyDvou = r.map(n => osyGeom(pole(bez(u[p], n)))[0].rodina);
        if (osyDvou[0] === osyDvou[1]) chyba('část ' + part.key + ': obě řešení vedou na osu téhož směru (' + osyDvou[0] + ')');
      }
      // polohy řešení v pořadí: žádné řešení nesmí prozradit odpověď (první a poslední zároveň)
      const n = u[p].length;
      if (r.includes(1) && r.includes(n)) st.obaKrajni++;
      r.forEach(x => { st.kose[Math.min(4, Math.floor((x - 1) / n * 5))]++; });
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

/* ── Úroveň „základ“ (procvičování a diagnostika): jeden útvar, jen svislá nebo vodorovná osa ── */
function zkontrolujZaklad(C, N) {
  const chyby = [], st = { n: 0, yn: 0, A: 0, odeber: 0, kose: [0, 0, 0, 0, 0], vyjimek: 0, velikosti: new Set(), rodiny: { sv: 0, vo: 0, jina: 0 } };
  const chyba = m => { if (chyby.length < 8 && !chyby.includes(m)) chyby.push(m); };
  for (let i = 0; i < N; i++) {
    let z; try { z = C.zakladSoumernost(); } catch (e) { st.vyjimek++; chyba('generátor spadl: ' + e.message); continue; }
    st.n++;
    const u = ctiUtvary(z.svg), b = u.A.slice().sort((p, q) => p.n - q.n);
    if (!b.length) { chyba('útvar nejde přečíst z kresby'); continue; }
    if (u.B.length || u.C.length) chyba('na obrázku základu je víc než jeden útvar');
    st.velikosti.add(b.length);
    if (b.length < 5 || b.length > 9) chyba('útvar základu má ' + b.length + ' čtverců (5–9)');
    if (b.some((c, k) => c.n !== k + 1) || !b.every((c, k) => !k || c.y > b[k - 1].y || (c.y === b[k - 1].y && c.x > b[k - 1].x))) chyba('čísla nejdou 1…n zleva doprava a shora dolů');
    if (b.some(c => c.x < 0 || c.x > 6 || c.y < 0 || c.y > 5)) chyba('čtverec mimo mřížku 7 × 6');
    if (!kraloveSouvisly(b)) chyba('útvar se rozpadá na kusy');
    if (!z.prompt || !z.intro || !z.hint1 || !z.hint2 || !Array.isArray(z.sol) || z.sol.length < 3) chyba('chybí zadání, nápověda nebo třikrokový postup');
    const osy = osyGeom(pole(b));
    if (z.type === 'yn') {
      st.yn++;
      const souměrný = osy.length > 0;
      if (z.ans !== (souměrný ? 'A' : 'N')) chyba('A/N: odpověď ' + z.ans + ', útvar má ' + osy.length + ' os');
      if (souměrný) {
        st.A++;
        if (osy.length !== 1) chyba('souměrný útvar základu má ' + osy.length + ' os (právě jednu)');
        osy.forEach(o => { st.rodiny[o.rodina === 'sv' || o.rodina === 'vo' ? o.rodina : 'jina']++; if (o.rodina !== 'sv' && o.rodina !== 'vo') chyba('A/N: osa základu je šikmá nebo jiná (' + o.rodina + ')'); });
        if (!osy.some(o => paryPodleOsy(b, o, -1) === paryZTextu(z.sol[1]))) chyba('A/N postup: dvojice čtverců nesedí na osu');
        if (!/Správně je A/.test(z.sol[2])) chyba('A/N postup nekončí odpovědí A');
      } else {
        const r = reseniOdebrani(b), m = /Čtverec (\d+) ale protějšek nemá/.exec(z.sol[1]);
        if (r.length !== 1) chyba('nesouměrný útvar základu nemá právě jedno řešení (' + r.join(',') + ')');
        if (!m || +m[1] !== r[0]) chyba('A/N postup: čtverec bez protějšku ' + (m && m[1]) + ', správně ' + r.join(','));
        const mapy = osyGeom(pole(bez(b, r[0]))).map(o => paryPodleOsy(b, o, r[0]));
        if (!mapy.includes(paryZTextu(z.sol[1]))) chyba('A/N postup: dvojice čtverců nesedí na žádnou osu');
        if (!/Správně je N/.test(z.sol[2])) chyba('A/N postup nekončí odpovědí N');
      }
    } else {
      st.odeber++;
      const r = reseniOdebrani(b);
      if (osy.length) chyba('útvar „odeber čtverec“ je sám souměrný');
      if (r.length !== 1) chyba('„odeber čtverec“: řešení není právě jedno (' + r.join(',') + ')');
      if (String(z.ans) !== String(r[0])) chyba('„odeber čtverec“: odpověď ' + z.ans + ', správně ' + r.join(','));
      const os = osyGeom(pole(bez(b, r[0])));
      if (os.length !== 1) chyba('„odeber čtverec“: zbytek má ' + os.length + ' os (právě jednu)');
      os.forEach(o => { st.rodiny[o.rodina === 'sv' || o.rodina === 'vo' ? o.rodina : 'jina']++; if (o.rodina !== 'sv' && o.rodina !== 'vo') chyba('„odeber čtverec“: osa základu je šikmá nebo jiná (' + o.rodina + ')'); });
      if (!os.map(o => paryPodleOsy(b, o, r[0])).includes(paryZTextu(z.sol[1]))) chyba('„odeber čtverec“ postup: dvojice čtverců nesedí na žádnou osu');
      if (!new RegExp('odpověď je ' + z.ans + '\\.').test(z.sol[2])) chyba('„odeber čtverec“ postup nekončí odpovědí');
      st.kose[Math.min(4, Math.floor((r[0] - 1) / b.length * 5))]++;
    }
  }
  st.chyby = chyby;
  return st;
}

/* Poloha čtverce bez protějšku v útvaru B (11.2) v pořadí čísel — samostatná LEVNÁ smyčka (0,6 s na 300 úloh proti ~33 s,
   které stojí úplné ověření postupů), proto jí jde dát vzorek, na kterém je pozorované rozložení spolehlivé.
   Úplné ověření tu stejně nic nepřidá: poloha vychází z generátoru útvaru, ne z postupu. Útvar se čte z KRESBY,
   řešení dopočte nezávislý řešič (jako všude jinde v tomhle testu). */
function polohaOdebraneho(C, N) {
  const kose = [0, 0, 0, 0, 0]; let n = 0, g = 0;
  while (n < N && g++ < N * 60) {
    const t = C.genSlot(10);
    if (t.title !== T11) continue;
    const B = ctiUtvary(t.svg).B, r = reseniOdebrani(B);
    if (r.length === 1) { kose[Math.min(4, Math.floor((r[0] - 1) / B.length * 5))]++; n++; }
  }
  return { n, kose, kraj: n ? (kose[0] + kose[4]) / n : 0, nejmensi: n ? Math.min(...kose) / n : 0 };
}

console.log('\n── Test nanečisto: osová souměrnost ve čtvercové síti ──\n');

/* Rozložení polohy čtverce bez protějšku v 11.2 (součet první a poslední pětiny pořadí). Naměřeno 20 běhů po 2 000 úlohách:
   skutečná banka 44,9–48,8 % (průměr 46,8 %), banka, která ho bere z kandidátů bez vyrovnání pětin, 57,6–61,1 % (59,0 %).
   Strop 53 % leží uprostřed mezi průměry; směrodatná odchylka vzorku 2 000 je 1,1 bodu, takže obě strany jsou 5 odchylek daleko.
   Dřív to hlídala nejmenší pětina při 300 úlohách (práh 14 %): sabotáž chytila jen ve 36 ze 40 běhů a skutečná banka by
   při 800 úlohách občas spadla — nejmenší z pěti čísel s šumem klesá pod své střední. Spodní hranice jedné pětiny (10 %,
   naměřené minimum 15,7 %) hlídá, aby se některá pětina nepoužívala vůbec. */
const N_POLOHA = 2000, HORNI_KRAJ = 0.53, SPODNI_PETINA = 0.10;
/* ── 1. Hlavní kontrola nad skutečnou bankou ───────────────────── */
const C = nactiBanku(ZDROJ);
const N8 = 800, N11 = 800;
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
/* Dvě řešení jsou obrazy téhož čtverce na protilehlých stranách útvaru, takže bývala první a poslední
   (naměřeno 24 % částí, náhodně 2,7 %). Generátor tu dvojici vylučuje a pětiny pořadí vyrovnává.
   Naměřeno 22,6 / 18,9 / 29,2 / 18,9 / 10,4 % (poslední pětina je nejřidší, protože šikmá poloha
   obrazu čtverce končí dřív než poslední řádek). Podlaha 7 % leží pod nejnižší pětinou s rezervou
   3 body a nad sabotáží bez vylučování. */
const kSoucet = S.kose.reduce((a, b) => a + b, 0);
const P = polohaOdebraneho(C, N_POLOHA);
ok(P.n >= N_POLOHA * 0.99 && P.kraj <= HORNI_KRAJ && P.nejmensi >= SPODNI_PETINA,
  'čtverec bez protějšku v útvaru B (11.2) není první nebo poslední častěji, než kolik dává náhoda (krajní pětiny ' + (P.kraj * 100).toFixed(0) + ' %, strop ' + (HORNI_KRAJ * 100).toFixed(0) + ' %; pětiny: ' + P.kose.map(k => (k / P.n * 100).toFixed(0) + ' %').join(' / ') + ')');
ok(S.obaKrajni === 0, 'řešení části 8.1 ani 8.2 nejsou zároveň první a poslední číslo útvaru (' + S.obaKrajni + ' částí)');
ok(Math.min(...S.kose) / kSoucet >= 0.07, 'čísla obou řešení jsou v útvaru na začátku i na konci (pětiny: ' + S.kose.map(k => (k / kSoucet * 100).toFixed(0) + ' %').join(' / ') + ')');

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

/* ── 3b. Úroveň základ: nezávislý řešič nad útvarem přečteným z kresby ─────────── */
{
  const NZ = 1500, Z = zkontrolujZaklad(C, NZ);
  ok(Z.n >= NZ * 0.99 && Z.vyjimek === 0, 'základ: ' + Z.n + ' úloh se vygenerovalo, generátor nespadl (' + Z.yn + ' A/N, ' + Z.odeber + ' „odeber čtverec“)');
  ok(Z.chyby.length === 0, 'základ: útvar, odpověď, jedinost řešení i postup sedí s NEZÁVISLÝM řešičem', Z.chyby.join(' | '));
  const rz = Z.rodiny, sz = rz.sv + rz.vo;
  ok(rz.jina === 0 && sz > 0 && Math.min(rz.sv, rz.vo) / sz >= 0.3, 'základ: osa je jen svislá nebo vodorovná, obě stejně často (sv ' + rz.sv + ', vo ' + rz.vo + ', jiná ' + rz.jina + ')');
  ok(Z.velikosti.size >= 3 && Math.max(...Z.velikosti) <= 9 && Math.min(...Z.velikosti) >= 5, 'základ: útvary jsou menší než v testu (' + [...Z.velikosti].sort((a, b) => a - b).join(', ') + ' čtverců)');
  const podYn = Z.yn / Z.n, podA = Z.A / Z.yn;
  ok(podYn >= 0.4 && podYn <= 0.6, 'základ: A/N a „odeber čtverec“ se střídají zhruba stejně (A/N ' + (podYn * 100).toFixed(0) + ' %)');
  ok(podA >= 0.4 && podA <= 0.6, 'základ: souměrný útvar je zhruba v polovině A/N úloh (' + (podA * 100).toFixed(0) + ' %), odpověď se neodhadne');
  const kz = Z.kose.reduce((a, b) => a + b, 0);
  ok(Math.min(...Z.kose) / kz >= 0.12, 'základ: odebíraný čtverec je na začátku i na konci útvaru (pětiny: ' + Z.kose.map(k => (k / kz * 100).toFixed(0) + ' %').join(' / ') + ')');
}

/* ── 4. Sabotáže: každá pojistka musí něco chytit ──────────────── */
const sabotaze = [
  ['druhé řešení v bance je jiný čtverec', 'reseni: [String(u.X), String(u.X2)]', 'reseni: [String(u.X), String(u.X2 === 1 ? 2 : u.X2 - 1)]'],
  ['body části nejsou počet řešení', "points: 2, prompt: `Určete číslo čtverce, jehož odebráním vznikne z útvaru ${kdo}", "points: 3, prompt: `Určete číslo čtverce, jehož odebráním vznikne z útvaru ${kdo}"],
  ['postup pro druhé řešení ukazuje osu prvního', 'sitPopisOsy(u.osaZb2)}. Protějšky tvoří dvojice čtverců ${d2.pary}', 'sitPopisOsy(u.osaZb)}. Protějšky tvoří dvojice čtverců ${d2.pary}'],
  ['řešič nezná šikmé osy', "    for (let c = x0 - y1; c <= x1 - y0; c++) if (vse({ typ: 'd', c })) osy.push({ typ: 'd', c });\n    for (let c = x0 + y0; c <= x1 + y1; c++) if (vse({ typ: 'a', c })) osy.push({ typ: 'a', c });\n", ''],
  ['generátor nehlídá jedinost řešení u útvaru s jedním řešením', 'if (reseni.length !== 1 || reseni[0] !== X) continue;', 'if (!reseni.includes(X)) continue;'],
  ['řešení části jsou právě první a poslední číslo', "      if (reseni.every(c => poradi(c) === 0 || poradi(c) === F.length - 1)) continue;              // právě první a poslední\n", ''],
  ['čtverce se číslují zdola nahoru', '.sort((p, q) => p[1] - q[1] || p[0] - q[0]);\n    const cisla', '.sort((p, q) => q[1] - p[1] || p[0] - q[0]);\n    const cisla'],
  ['útvar C má jiný počet os, než tvrdí postup', 'const pocetC = p3 ? k : 3 - k, C = utvarSOsami(pocetC);', 'const pocetC = p3 ? k : 3 - k, C = utvarSOsami(pocetC === 1 ? 2 : 1);'],
  ['nepravdivé 11.2 odebírá správný čtverec', 'let N = B.X;\n    if (!p2) {', 'let N = B.X;\n    if (false) {'],
  ['odebíraný čtverec je nejčastěji první nebo poslední', 'const X = pick(vPeti), F = S.concat([X]);', 'const X = pick(kand), F = S.concat([X]);', 'poloha'],
  ['11.1 má obrácenou pravdivost', 'tvrzeni(`Útvar A je osově souměrný.`, p1, p1', 'tvrzeni(`Útvar A je osově souměrný.`, !p1, p1']
];
sabotaze.forEach(([popis, hledej, nahrad, jen]) => {
  const pocet = ZDROJ.split(hledej).length - 1;
  ok(pocet === 1, 'sabotáž „' + popis + '“ se aplikovala (' + pocet + '× nalezeno)');
  if (pocet !== 1) return;
  if (jen === 'poloha') {   // chytá ji jen rozložení polohy čtverce (11.2), ostatní kontroly o ní nic nevědí
    const Ps = polohaOdebraneho(nactiBanku(ZDROJ.replace(hledej, () => nahrad)), N_POLOHA);
    ok(Ps.kraj > HORNI_KRAJ, 'sabotáž „' + popis + '“ je chycena (krajní pětiny ' + (Ps.kraj * 100).toFixed(0) + ' % nad stropem ' + (HORNI_KRAJ * 100).toFixed(0) + ' %)', 'test prošel i nad rozbitou bankou');
    return;
  }
  let vysl;
  try { vysl = zkontroluj(nactiBanku(ZDROJ.replace(hledej, () => nahrad)), 300, 300); }
  catch (e) { vysl = { chyby: ['pád: ' + e.message], ukol8: 0, ukol11: 0, vyjimek: 1, rodiny: { sv: 0, vo: 0, d: 0, a: 0 }, kose: [1, 1, 1, 1, 1], obaKrajni: 0 }; }
  const s = vysl.rodiny, sou = s.sv + s.vo + s.d + s.a;
  const kSou = vysl.kose.reduce((a, b) => a + b, 0), nerovn = kSou > 0 && (Math.min(...vysl.kose) / kSou < 0.07 || vysl.obaKrajni > 0);
  const slabe = sou > 0 && Math.min(s.sv, s.vo, s.d, s.a) / sou < 0.08;
  const chyceno = vysl.chyby.length > 0 || vysl.vyjimek > 0 || slabe || nerovn;
  ok(chyceno, 'sabotáž „' + popis + '“ je chycena (' + (vysl.chyby[0] || (slabe ? 'chybí šikmé osy' : nerovn ? 'odpovědi u okraje útvaru' : vysl.vyjimek ? 'výjimka' : '')).slice(0, 70) + ')', 'test prošel i nad rozbitou bankou');
});

/* ── 5. Sabotáže úrovně základ ──────────────────────────────────── */
[
  ['osa základu smí být i šikmá', "const t = zakl ? pick(['sv', 'vo']) :", "const t = zakl ? pick(['sv', 'vo', 'd', 'a']) :"],
  ['A/N má obrácenou odpověď', "ans: souměrný ? 'A' : 'N',\n        hint1: 'Útvar je souměrný, když každý čtverec", "ans: souměrný ? 'N' : 'A',\n        hint1: 'Útvar je souměrný, když každý čtverec"],
  ['„odeber čtverec“ odpovídá jiný čtverec', "type: 'text', ans: String(u.X),", "type: 'text', ans: String(u.X === 1 ? 2 : u.X - 1),"],
  ['na obrázku základu jsou dva útvary', 'svg: svgUtvary([u]), type: \'yn\'', 'svg: svgUtvary([u, u]), type: \'yn\''],
  ['útvary základu jsou velké jako v testu', 'zakladSoum([o], zakl ? ri(5, 7) : ri(6, 11))', 'zakladSoum([o], zakl ? ri(9, 11) : ri(6, 11))'],
  ['postup A/N ukazuje jiný čtverec bez protějšku', 'Čtverec ${u.X} ale protějšek nemá.`, `Útvar souměrný není.', 'Čtverec ${u.X + 1} ale protějšek nemá.`, `Útvar souměrný není.']
].forEach(([popis, hledej, nahrad]) => {
  const pocet = ZDROJ.split(hledej).length - 1;
  ok(pocet === 1, 'sabotáž základu „' + popis + '“ se aplikovala (' + pocet + '× nalezeno)');
  if (pocet !== 1) return;
  let v;
  try { v = zkontrolujZaklad(nactiBanku(ZDROJ.replace(hledej, () => nahrad)), 400); }
  catch (e) { v = { chyby: ['pád: ' + e.message], vyjimek: 1 }; }
  ok(v.chyby.length > 0 || v.vyjimek > 0, 'sabotáž základu „' + popis + '“ je chycena (' + ((v.chyby[0] || 'výjimka') + '').slice(0, 70) + ')');
});

console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
