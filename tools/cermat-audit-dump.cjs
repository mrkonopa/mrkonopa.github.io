/* Vygeneruje čitelný vzorek CERMAT úloh (se skutečnými čísly) seskupený podle
   pozice v testu — podklad pro obsahový audit (math + čeština + konzistence).
   Zároveň provede obsahové linty (÷, dvojité mezery, zbytky šablon, NaN/undefined).
   Použití: node tools/cermat-audit-dump.cjs [pocetGeneraci] > dump.txt  */
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, one, few, many) => n === 1 ? one : (n >= 2 && n <= 4 ? few : many);
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar', 'svgCuboid'].forEach(f => global[f] = () => '<svg/>');
global.window = {};
require('/home/user/mrkonopa.github.io/projects/rpg-cermat-9.js');
const C = global.window.RPG_CERMAT_9;

const N = Number(process.argv[2]) || 6;
const lint = [];
function checkStr(where, s) {
  if (s == null) return;
  s = String(s);
  if (s.includes('÷')) lint.push(`${where}: obsahuje ÷ (má být :) → "${s.slice(0, 70)}"`);
  if (/\$\{/.test(s)) lint.push(`${where}: zbytek šablony \${ → "${s.slice(0, 70)}"`);
  if (/undefined|NaN/.test(s)) lint.push(`${where}: undefined/NaN → "${s.slice(0, 70)}"`);
  if (/ {2,}/.test(s)) lint.push(`${where}: dvojitá mezera → "${s.slice(0, 70)}"`);
  if (/[a-zA-Z]\?{2,}/.test(s)) lint.push(`${where}: podezřelé ?? → "${s.slice(0, 70)}"`);
}

// posbírej N generací, seskup podle pozice (no)
const byPos = {};
for (let g = 0; g < N; g++) {
  const tasks = C.generate();
  tasks.forEach(t => { (byPos[t.no] = byPos[t.no] || []).push(t); });
}

const L = [];
for (let no = 1; no <= 16; no++) {
  const inst = byPos[no] || [];
  L.push(`\n${'═'.repeat(70)}\nPOZICE ${no}  (${inst.length} ukázek, ${inst[0] ? inst[0].points + ' b' : '?'})  „${inst[0] ? inst[0].title : '?'}“`);
  inst.forEach((t, i) => {
    L.push(`\n── ukázka ${no}.${i + 1} ─────────────────────────────────`);
    if (t.intro) { L.push(`INTRO: ${t.intro}`); checkStr(`t${no} intro`, t.intro); }
    if (t.svg) L.push(`[SVG přítomno]`);
    if (t.kind === 'tfgrid') {
      t.statements.forEach((s, j) => {
        L.push(`  TVRZENÍ ${no}.${j + 1} [${s.ans}]: ${s.text}`);
        L.push(`     SOL: ${s.sol}`);
        checkStr(`t${no}.${j + 1} text`, s.text); checkStr(`t${no}.${j + 1} sol`, s.sol);
      });
    } else if (t.kind === 'mc') {
      L.push(`  MC: ${t.prompt}`);
      t.options.forEach(o => L.push(`     ${o}`));
      L.push(`  SPRÁVNĚ: ${t.ans}`);
      L.push(`  SOL: ${t.sol}`);
      checkStr(`t${no} prompt`, t.prompt); checkStr(`t${no} sol`, t.sol);
      t.options.forEach((o, k) => checkStr(`t${no} opt${k}`, o));
    } else if (t.kind === 'match') {
      t.prompts.forEach((p, j) => { L.push(`  PŘIŘAĎ ${no}.${j + 1} → [${t.ans[j]}]: ${p}`); checkStr(`t${no}.${j + 1} prompt`, p); });
      L.push(`  MOŽNOSTI: ${t.options.join('  ')}`);
      (t.sol || []).forEach((s, j) => { L.push(`  SOL ${no}.${j + 1}: ${s}`); checkStr(`t${no}.${j + 1} sol`, s); });
    } else {
      (t.parts || []).forEach(p => {
        L.push(`  ${p.key || '·'} (${p.points} b): ${p.prompt}`);
        L.push(`     ODPOVĚĎ: ${p.ans}`);
        L.push(`     SOL: ${p.sol}`);
        checkStr(`t${no}${p.key} prompt`, p.prompt); checkStr(`t${no}${p.key} sol`, p.sol);
      });
    }
  });
}

console.log(L.join('\n'));
console.log(`\n\n${'═'.repeat(70)}\nAUTOMATICKÉ LINTY (${lint.length}):`);
console.log(lint.length ? [...new Set(lint)].join('\n') : '✅ žádný lint nález (÷, ${, undefined/NaN, dvojité mezery)');
