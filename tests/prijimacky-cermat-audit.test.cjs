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
// Postup je od PR #241 buď souvislý text, nebo POLE KROKŮ. Prázdné pole je
// truthy, takže původní kontrola `!sol` by ho pustila — proto vlastní helper.
const vadnyPostup = sol => {
  const kroky = Array.isArray(sol) ? sol : (typeof sol === 'string' && sol.trim() ? [sol] : []);
  if (!kroky.length) return true;
  return kroky.some(k => typeof k !== 'string' || !k.trim() || BADSOL.test(k));
};

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
        if (vadnyPostup(s.sol)) bad.add(`t${t.no} tfgrid vadné řešení`);
      }
    } else if (t.kind === 'mc') {
      if (!t.prompt) bad.add(`t${t.no} mc bez zadání`);
      if (!Array.isArray(t.options) || t.options.length < 4) bad.add(`t${t.no} mc málo možností`);
      if (!/^[A-E]$/.test(t.ans) || !t.options.some(o => o.startsWith(t.ans + ')'))) bad.add(`t${t.no} mc ans mimo možnosti`);
      if (vadnyPostup(t.sol)) bad.add(`t${t.no} mc vadné řešení`);
    } else if (t.kind === 'match') {
      if (!Array.isArray(t.prompts) || t.prompts.length < 2) bad.add(`t${t.no} match málo zadání`);
      if (!Array.isArray(t.ans) || t.ans.length !== t.prompts.length) bad.add(`t${t.no} match délka ans`);
      for (const a of t.ans) if (!t.options.some(o => o.startsWith(a + ')'))) bad.add(`t${t.no} match ans mimo možnosti`);
      if (!Array.isArray(t.sol) || t.sol.length !== t.prompts.length) bad.add(`t${t.no} match délka sol`);
      else for (const s of t.sol) if (vadnyPostup(s)) bad.add(`t${t.no} match vadné řešení`);
    } else {
      if (!Array.isArray(t.parts)) { bad.add(`t${t.no} bez parts/kind`); continue; }
      let ps = 0;
      for (const p of t.parts) {
        ps += p.points;
        if (!p.prompt || !p.prompt.trim()) bad.add(`t${t.no}${p.key} bez zadání`);
        const a = String(p.ans);
        if (p.ans === undefined || p.ans === null || a === 'NaN' || a === 'undefined' || a === '') bad.add(`t${t.no}${p.key} vadná ans`);
        if (vadnyPostup(p.sol)) bad.add(`t${t.no}${p.key} vadné řešení`);
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
   Stejná pravidla, jaká hlídá tests/rpg-content-quality.audit.cjs u her: v ČR se
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
  /* 🔴 Konec slova NESMÍ být `\b`: ten v JavaScriptu zná jen písmena A–Z, takže
     za „litrů", „metrů", „žáků" nebo „stupně" (končí ů/ě) hranice nikdy nevznikla
     a 9 ze 13 hlídaných tvarů bylo slepých. Proto „Konev má objem 3 litrů"
     prošlo auditem, dokud si toho nikdo nevšiml při čtení. `(?![\p{L}\d])`
     s příznakem u je hranice slova pro češtinu. */
  const DECL = /\b(?:[5-9]|\d\d+)\s+(?:hodiny|minuty|koruny|metry|centimetry|kilometry|litry|kilogramy|dny|roky|žáci|body|stupně)(?![\p{L}\d])|\b[2-4]\s+(?:hodin|minut|korun|metrů|centimetrů|kilometrů|litrů|kilogramů|dnů|let|žáků|bodů|stupňů|kostek|konví|dílů|kusů)(?![\p{L}\d])/u;
  const dot = new Set(), per = new Set(), dec = new Set();
  for (let i = 0; i < 400; i++) for (let s = 0; s < 16; s++) {
    let t; try { t = C.genSlot(s); } catch (e) { continue; }
    /* Kroky postupu se spojují MEZEROU: `String(pole)` je spojí čárkou a z konce
       jednoho kroku a začátku dalšího („= 17/5" + „221/100 : …") vyrobí „5,221". */
    const kroky = x => [].concat(x || []).flat(2).join(' ');
    const raw = [t.intro, t.prompt, t.sol,
      ...(t.parts || []).map(x => (x.prompt || '') + ' ' + kroky(x.sol)),
      ...(t.statements || []).map(x => (x.text || '') + ' ' + kroky(x.sol)),
      ...(Array.isArray(t.sol) ? t.sol.flat(2) : [])].filter(x => typeof x === 'string').join(' ');
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
      // Přesné číslo: celé, nebo desetinné nejvýš na setiny (−2,5; 0,75) — ne useknutý
      // periodický rozvoj. Rovnice bez jediného kořene má odpověď slovy.
      if (/^(nemá řešení|nekonečně mnoho řešení)$/.test(p.ans)) return;
      const n = Number(String(p.ans).replace(',', '.'));
      if (!Number.isFinite(n) || !Number.isInteger(Math.round(n * 100) / 100 * 100) || Math.abs(n * 100 - Math.round(n * 100)) > 1e-9) bad.add(p.key + ' = ' + p.ans);
    });
  }
  ok(bad.size === 0, 'kořeny rovnic (pozice 4) jsou přesná čísla (celá nebo na setiny) či „nemá řešení“'
    + (bad.size ? ' — ' + [...bad].slice(0, 5).join(' | ') : ''));
}


/* ── VĚRNOST OSTRÉMU TESTU: válec a sloupcový graf ──────────────────────
   Banka je simulace CERMATu, takže musí obsahovat i typy úloh, které ostrý
   test SKUTEČNĚ dává. Změřeno na 15 zadáních z archivu (projects/prijimacky-
   matematika/pdfs): rotační válec je v 5 z nich (33 %), sloupcový graf / diagram
   v 8 z nich (53 %). Do PR #241 banka válec zastupovala jedinou úlohou (sud)
   a graf NEMĚLA VŮBEC — tenhle blok hlídá, aby se to nevrátilo.
   Kontroluje se PŘÍTOMNOST VARIANT (deterministické), ne jen podíl v losu:
   podíl mezi běhy kolísá o 10 bodů, takže samotná podlaha by byla vratká.
   Pozn.: kužel, koule, jehlan ani graf lineární funkce v archivu NEJSOU
   (0 z 15), proto se po nich nic nepožaduje. ── */
const varianty = (poz, kolik) => {
  const s = new Set();
  for (let i = 0; i < kolik; i++) s.add(C.genSlot(poz - 1).title);
  return s;
};
const v6 = varianty(6, 3000), v11 = varianty(11, 3000), v12 = varianty(12, 3000), v14 = varianty(14, 3000);
ok(v6.has('Těžítko'), 'pozice 6 nabízí válec ve válci („Těžítko“) — [' + [...v6].join(', ') + ']');
ok(v12.has('Povrch válce'), 'pozice 12 nabízí povrch válce — [' + [...v12].join(', ') + ']');
ok(v14.has('Kroužky') && v14.has('Návštěvnost') && v14.has('Ptačí hodinka'), 'pozice 14 nabízí TŘI úlohy se sloupcovým grafem — [' + [...v14].join(', ') + ']');
ok(v11.has('Kruhový diagram zahrady') && v11.has('Náklad lodi'), 'pozice 11 nabízí DVĚ úlohy s kruhovým diagramem — [' + [...v11].join(', ') + ']');

// Podíl v celém testu — volná podlaha, jen aby se poznalo úplné vymizení.
// Naměřeno na 10× 400 testech: válec 51–59 %, graf 52–61 % (ostré testy: 33 % a 53 %).
// Podlaha grafu 48 % leží pod minimem (3,6 σ při 400 testech) a nad stavem bez
// diagramů v pozici 11 (43 %); jejich přítomnost navíc hlídá kontrola výše.
/* 2026-09-24: ÚLOHY SE TŘÍDÍ PODLE ZNĚNÍ, ne podle ručního seznamu titulů.
   Ruční seznam znal jen tři staré válce; nové (přelévání, dort) nepočítal,
   podíl „klesl" na 33–36 % proti podlaze 35 % a test padal náhodně. Zadání
   se slovem válec / graf / diagram najde přesně 5 + 5 variant (ověřeno
   výpisem titulů), takže nová varianta se započte sama. */
const znení = t => [t.intro, t.prompt].concat((t.parts || []).map(p => p.prompt), (t.statements || []).map(x => x.text), t.prompts || []).join(' ');
const jeValec = t => /válc|válec/i.test(znení(t)), jeGraf = t => /graf|diagram/i.test(znení(t));
let sValcem = 0, sGrafem = 0;
const BEHU = 400;
for (let i = 0; i < BEHU; i++) {
  const t = C.generate();
  if (t.some(jeValec)) sValcem++;
  if (t.some(jeGraf)) sGrafem++;
}
const pV = 100 * sValcem / BEHU, pG = 100 * sGrafem / BEHU;
ok(pV >= 35, 'válcová úloha je v ' + pV.toFixed(1) + ' % testů (podlaha 35 %, naměřeno 51–59)');
ok(pG >= 48, 'úloha s grafem nebo diagramem je v ' + pG.toFixed(1) + ' % testů (podlaha 48 %, naměřeno 52–61)');

console.log(`\n  ${pass} ✅ / ${fail} ❌  (${RUNS} vygenerovaných testů)`);
process.exit(fail ? 1 : 0);
