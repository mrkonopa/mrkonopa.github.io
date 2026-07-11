/* Čitelný vzorek úloh z rozšiřující banky daného ročníku (se skutečnými čísly),
   seskupený podle mise — podklad pro obsahový audit (math + čeština + konzistence).
   Plus obsahové linty (÷, zbytky šablon, NaN/undefined, dvojité mezery, prázdné L2 hinty).
   Použití: node tools/bank-audit-dump.cjs <ročník 3-9> [pocetVzorku=2] > dump.txt  */
const fs = require('fs');
const G = process.argv[2] || '9';
const N = Number(process.argv[3]) || 2;
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, one, few, many) => n === 1 ? one : (n >= 2 && n <= 4 ? few : many);
global.pick = a => a[Math.floor(Math.random() * a.length)];
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar', 'svgCuboid', 'svgAngle', 'svgCircle', 'svgPrism', 'svgGrid', 'svgBox'].forEach(f => global[f] = () => '<svg></svg>');
global.window = {};
new Function(fs.readFileSync(`/home/user/mrkonopa.github.io/projects/rpg-tasks-${G}.js`, 'utf8'))();
const bank = global.window['RPG_TASK_EXTRA_' + G];
if (!bank) { console.log('bank nenalezena'); process.exit(2); }

const lint = [];
function checkStr(where, s) {
  if (s == null) return;
  s = String(s);
  if (s.includes('÷')) lint.push(`${where}: ÷ (má být :) → "${s.slice(0, 70)}"`);
  if (/\$\{/.test(s)) lint.push(`${where}: zbytek šablony → "${s.slice(0, 70)}"`);
  if (/undefined|NaN/.test(s)) lint.push(`${where}: undefined/NaN → "${s.slice(0, 70)}"`);
  if (/ {2,}/.test(s)) lint.push(`${where}: dvojitá mezera → "${s.slice(0, 70)}"`);
}

const L = [`R------ BANKA ROČNÍK ${G} — vzorek úloh (${N}× na misi) ------`];
for (const mid of Object.keys(bank)) {
  L.push(`\n${'═'.repeat(66)}\nMISE ${mid}`);
  const seen = new Set();
  for (let n = 0; n < N; n++) {
    let tasks;
    try { tasks = bank[mid](); } catch (e) { L.push(`  [CHYBA generátoru: ${e.message}]`); break; }
    tasks.forEach((t, i) => {
      if (!t) return;
      const txt = String(t.text || '').replace(/\n/g, ' ⏎ ');
      L.push(`  • ${txt}`);
      L.push(`      ODP: ${t.ans}   [${t.skill || '?'}]`);
      if (t.hints && t.hints.length) L.push(`      HINT: ${t.hints.map(h => `„${h}“`).join('  |  ')}`);
      checkStr(`${mid} text`, t.text);
      checkStr(`${mid} ans`, t.ans);
      (t.hints || []).forEach((h, k) => checkStr(`${mid} hint${k}`, h));
      if (t.hints && t.hints.length > 1 && !String(t.hints[1] || '').trim()) lint.push(`${mid}: prázdný hints[1] u „${txt.slice(0, 50)}“`);
    });
  }
}
console.log(L.join('\n'));
console.log(`\n\n${'═'.repeat(66)}\nAUTOMATICKÉ LINTY (${lint.length}):`);
console.log(lint.length ? [...new Set(lint)].slice(0, 40).join('\n') : '✅ žádný lint nález');
