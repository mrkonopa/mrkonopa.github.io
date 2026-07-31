/* prijimacky-cermat-audit.test.cjs — strukturální audit generátoru RPG_CERMAT_9.
   Čistý Node (bez Playwrightu). 1000 běhů → hlídá invarianty testu nanečisto:
   16 úloh, součet přesně 50 bodů, žádné NaN/undefined v ans/sol, platné MC/
   tfgrid/match odpovědi. Chrání obsahovou hloubku (2 varianty na každou pozici)
   proti regresi. Auto-discovery v tests/run-ci.cjs. */

// Globální stuby (stejně jako tools/verify-cermat.cjs — modul je čte z window/global)
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => n === 1 ? o : (n >= 2 && n <= 4 ? f : m);
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar', 'svgCuboid']
  .forEach(f => global[f] = () => '<svg></svg>');
global.window = {};
require('../projects/rpg-cermat-9.js');
const C = global.window.RPG_CERMAT_9;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m); } };
const bad = new Set();
const RUNS = 1000;
const BADSOL = /undefined|NaN/;

ok(C && typeof C.generate === 'function', 'RPG_CERMAT_9.generate existuje');
ok(C.maxScore === 50, 'maxScore = 50');
ok(C.slotCount() === 16, '16 pozic');

for (let run = 0; run < RUNS; run++) {
  const tasks = C.generate();
  if (tasks.length !== 16) bad.add(`run má ${tasks.length} úloh (čekáno 16)`);
  let sum = 0;
  for (const t of tasks) {
    sum += t.points;
    if (t.kind === 'tfgrid') {
      if (t.statements.length !== t.points) bad.add(`t${t.no} tfgrid: ${t.points} b ≠ ${t.statements.length} tvrzení`);
      for (const s of t.statements) {
        if (!s.text || !/^[AN]$/.test(s.ans)) bad.add(`t${t.no} tfgrid ans ∉ {A,N}`);
        if (!s.sol || BADSOL.test(s.sol)) bad.add(`t${t.no} tfgrid vadné řešení`);
      }
    } else if (t.kind === 'mc') {
      if (!t.prompt) bad.add(`t${t.no} mc bez zadání`);
      if (!Array.isArray(t.options) || t.options.length < 4) bad.add(`t${t.no} mc málo možností`);
      if (!/^[A-E]$/.test(t.ans) || !t.options.some(o => o.startsWith(t.ans + ')'))) bad.add(`t${t.no} mc ans mimo možnosti`);
      if (!t.sol || BADSOL.test(t.sol)) bad.add(`t${t.no} mc vadné řešení`);
    } else if (t.kind === 'match') {
      if (!Array.isArray(t.prompts) || t.prompts.length < 2) bad.add(`t${t.no} match málo zadání`);
      if (!Array.isArray(t.ans) || t.ans.length !== t.prompts.length) bad.add(`t${t.no} match délka ans`);
      for (const a of t.ans) if (!t.options.some(o => o.startsWith(a + ')'))) bad.add(`t${t.no} match ans mimo možnosti`);
      if (!Array.isArray(t.sol) || t.sol.length !== t.prompts.length) bad.add(`t${t.no} match délka sol`);
      else for (const s of t.sol) if (!s || BADSOL.test(s)) bad.add(`t${t.no} match vadné řešení`);
    } else {
      if (!Array.isArray(t.parts)) { bad.add(`t${t.no} bez parts/kind`); continue; }
      let ps = 0;
      for (const p of t.parts) {
        ps += p.points;
        if (!p.prompt || !p.prompt.trim()) bad.add(`t${t.no}${p.key} bez zadání`);
        const a = String(p.ans);
        if (p.ans === undefined || p.ans === null || a === 'NaN' || a === 'undefined' || a === '') bad.add(`t${t.no}${p.key} vadná ans`);
        if (!p.sol || BADSOL.test(p.sol)) bad.add(`t${t.no}${p.key} vadné řešení`);
      }
      if (ps !== t.points) bad.add(`t${t.no} součet podúloh ${ps} ≠ ${t.points}`);
    }
  }
  if (sum !== 50) bad.add(`součet bodů ${sum} ≠ 50`);
}
ok(bad.size === 0, `${RUNS} běhů bez strukturální chyby` + (bad.size ? ' — ' + [...bad].slice(0, 8).join(' | ') : ''));

/* ── Číselná konvence v OSTRÉM TESTU (Vojtovo pravidlo) ──
   Pozice 13 dřív počítala `stara * (1 + p/100)`, takže se do zadání dostalo
   „Zboží zdražilo z 700 Kč na 770.0000000000001 Kč". Matematicky správně,
   pro žáka nepoužitelné — a testy struktury to minuly. */
{
  const FLOAT = /\d+[.,]\d{4,}/;
  const nalezy = new Set();
  // Pojistka proti PRÁZDNÉMU běhu: pravidlo tu bylo napsané na neexistující
  // `G.genSlot()`, takže každý průchod spadl do catch a kontrola roky tiše
  // procházela naprázdno. Test, který nikdy nezaštěká, je horší než žádný.
  let videno = 0;
  for (let i = 0; i < 400; i++) for (let s = 0; s < 16; s++) {
    let t; try { t = C.genSlot(s); } catch (e) { continue; }
    videno++;
    const raw = [t.intro, t.prompt, t.sol,
      ...(t.parts || []).map(x => x.prompt + ' ' + x.sol),
      ...(t.statements || []).map(x => x.text + ' ' + x.sol),
      ...(Array.isArray(t.sol) ? t.sol : [])].filter(Boolean).join(' ');
    // SVG atributy (stroke-width="3.5") nejsou text pro žáka → odstranit.
    // Odstraňujeme v CYKLU, dokud se text mění: jeden průchod by u vnořených
    // značek („<<b>>") kus markupu nechal — na to upozornil CodeQL #76.
    let txt = raw, prev;
    do { prev = txt; txt = txt.replace(/<[^<>]*>/g, ''); } while (txt !== prev);
    const m = txt.match(FLOAT);
    if (m) nalezy.add('pozice ' + (s + 1) + ': ' + m[0]);
  }
  ok(videno === 400 * 16, `prošlo se všech ${400 * 16} úloh (nasbíráno ${videno})`);
  ok(nalezy.size === 0, 'žádný artefakt plovoucí čárky v zadání ani řešení'
    + (nalezy.size ? ' — ' + [...nalezy].slice(0, 5).join(' | ') : ''));
}

/* ── Kvalita ČEŠTINY v zadání a postupu ──────────────────────────────────
   Stejná pravidla, jaká hlídá tests/rpg-content-quality.cjs u her: v ČR se
   píše desetinná ČÁRKA, zaokrouhlená hodnota se značí ≈ a počitatelná jména
   se skloňují. Matematika přitom může být v pořádku a drhne až text — proto
   se to musí testovat zvlášť. Kontroluje se jen to, co žák VIDÍ jako větu
   (zadání, intro, postup); holé `ans` zůstává JS číslo a čárku dostane až
   při zobrazení přes PZ.czNum. */
{
  // „16.1" je číslo podúlohy, ne desetinné číslo — jinak by pravidlo křičelo vlka.
  const NUMBERING = /\b(?:1[0-6]|[1-9])\.[1-9]\b/g;
  const DOT = /(?<![\d.,])\d+\.\d+(?![.\d])/;
  const PERIOD = /\d,\d{3,}/;                     // useknutý rozvoj
  const DECL = /\b(?:[5-9]|\d\d+)\s+(?:hodiny|minuty|koruny|metry|centimetry|kilometry|litry|kilogramy|dny|roky|žáci|body|stupně)\b|\b[2-4]\s+(?:hodin|minut|korun|metrů|centimetrů|kilometrů|litrů|kilogramů|dnů|let|žáků|bodů|stupňů)\b/;
  const dot = new Set(), per = new Set(), dec = new Set();
  for (let i = 0; i < 400; i++) for (let s = 0; s < 16; s++) {
    let t; try { t = C.genSlot(s); } catch (e) { continue; }
    const raw = [t.intro, t.prompt, t.sol,
      ...(t.parts || []).map(x => (x.prompt || '') + ' ' + (x.sol || '')),
      ...(t.statements || []).map(x => (x.text || '') + ' ' + (x.sol || '')),
      ...(Array.isArray(t.sol) ? t.sol : [])].filter(x => typeof x === 'string').join(' ');
    let txt = raw, prev;
    do { prev = txt; txt = txt.replace(/<[^<>]*>/g, ''); } while (txt !== prev);
    txt = txt.replace(NUMBERING, '#');
    const kde = 'pozice ' + (s + 1) + ': ';
    let m;
    if ((m = txt.match(DOT))) dot.add(kde + m[0]);
    if ((m = txt.match(PERIOD)) && !/≈/.test(txt)) per.add(kde + m[0]);
    if ((m = txt.match(DECL))) dec.add(kde + m[0]);
  }
  const uk = s => [...s].slice(0, 5).join(' | ');
  ok(dot.size === 0, 'desetinná ČÁRKA místo tečky v textu' + (dot.size ? ' — ' + uk(dot) : ''));
  ok(per.size === 0, 'zaokrouhlená hodnota má ≈, ne useknuté cifry' + (per.size ? ' — ' + uk(per) : ''));
  ok(dec.size === 0, 'skloňování počitatelných jmen' + (dec.size ? ' — ' + uk(dec) : ''));
}

/* ── Kořeny rovnic musí vyjít PŘESNĚ ─────────────────────────────────────
   Dřív se v pozici 4 losovaly obě strany nezávisle, takže kořen býval
   neukončený (91 : 11) a zadání ho tiše zaokrouhlilo na 2 des. místa. Žák,
   který počítal správně a zaokrouhlil jinak, dostal „špatně". */
{
  const bad = new Set();
  for (let i = 0; i < 600; i++) {
    let t; try { t = C.genSlot(3); } catch (e) { continue; }
    (t.parts || []).forEach(p => {
      const n = Number(String(p.ans).replace(',', '.'));
      if (!Number.isFinite(n) || !Number.isInteger(n)) bad.add(p.key + ' = ' + p.ans);
    });
  }
  ok(bad.size === 0, 'kořeny rovnic (pozice 4) jsou celá čísla'
    + (bad.size ? ' — ' + [...bad].slice(0, 5).join(' | ') : ''));
}

console.log(`\n  ${pass} ✅ / ${fail} ❌  (${RUNS} vygenerovaných testů)`);
process.exit(fail ? 1 : 0);
