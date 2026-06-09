/* Audit banky otázek živého souboje (rpg-battle-9.js).
   Determinismus + validita MC napříč tisíci seedy.
   Spusť: node tests/rpg-battle-questions.test.cjs */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(ROOT, 'projects/rpg-battle-9.js'), 'utf8');
const ctx = vm.createContext({ window: {}, console, Math, String, Number, Set, Array });
vm.runInContext(code, ctx);
const B = ctx.window.RPG_BATTLE_9;

let pass = 0, fail = 0;
const ok = (label, cond, d) => { if (cond) { pass++; } else { fail++; console.error('  ✗', label, d ? `[${d}]` : ''); } };

// 1) modul existuje a má API
ok('modul RPG_BATTLE_9 existuje', !!B);
ok('build je funkce', typeof B.build === 'function');
ok('game = RPG_MAT_9', B.game === 'RPG_MAT_9');
ok('topicCount > 8', B.topicCount > 8, B.topicCount);

// 2) determinismus: stejný seed → identický výstup
let detOk = true;
for (let s = 1; s <= 500; s++) {
  const a = JSON.stringify(B.build(s, 10));
  const b = JSON.stringify(B.build(s, 10));
  if (a !== b) { detOk = false; console.error('  ✗ determinismus seed', s); break; }
}
ok('determinismus (500 seedů, 2× build identický)', detOk);

// 3) různé seedy → většinou různé sady (sanity, ne 100%)
let diffCount = 0;
for (let s = 1; s <= 200; s++) {
  if (JSON.stringify(B.build(s, 10)) !== JSON.stringify(B.build(s + 1000, 10))) diffCount++;
}
ok('různé seedy dávají různé sady (>180/200)', diffCount > 180, diffCount);

// 4) validita: napříč 5000 seedů × 12 otázek
let badNaN = 0, badChoices = 0, badCorrect = 0, badAnswer = 0, badDup = 0, badEmpty = 0, total = 0;
for (let s = 1; s <= 5000; s++) {
  const qs = B.build(s, 12);
  if (qs.length !== 12) badEmpty++;
  for (const q of qs) {
    total++;
    if (!Array.isArray(q.choices) || q.choices.length !== 4) { badChoices++; continue; }
    if (new Set(q.choices).size !== 4) badDup++;
    if (q.correct < 0 || q.correct > 3) badCorrect++;
    if (q.choices[q.correct] !== q.answer) badAnswer++;
    for (const c of q.choices) {
      if (c === undefined || c === null || c === '' || /NaN|undefined/.test(String(c))) badNaN++;
    }
    if (!q.text || /NaN|undefined/.test(q.text)) badNaN++;
  }
}
ok(`generováno ${total} otázek, vždy 12/sadu`, badEmpty === 0, `prázdných sad: ${badEmpty}`);
ok('žádné NaN/undefined v textu ani možnostech', badNaN === 0, badNaN);
ok('každá otázka má přesně 4 možnosti', badChoices === 0, badChoices);
ok('žádné duplicitní možnosti', badDup === 0, badDup);
ok('correct index vždy 0..3', badCorrect === 0, badCorrect);
ok('choices[correct] === answer', badAnswer === 0, badAnswer);

// 5) count clamp
ok('count<1 → aspoň 1 otázka', B.build(7, 0).length >= 1);
ok('count>40 → max 40 otázek', B.build(7, 999).length <= 40);

// 6) seed 0 nepadá (fallback na 1)
let z = true; try { B.build(0, 10); } catch (e) { z = false; }
ok('seed 0 bez pádu', z);

console.log(`\n${'═'.repeat(46)}`);
console.log(`  BATTLE QUESTIONS: ${pass} ✅  /  ${fail} ❌  (${total} otázek)`);
console.log('═'.repeat(46));
process.exit(fail === 0 ? 0 : 1);
