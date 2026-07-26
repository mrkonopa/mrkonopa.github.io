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

console.log(`\n  ${pass} ✅ / ${fail} ❌  (${RUNS} vygenerovaných testů)`);
process.exit(fail ? 1 : 0);
