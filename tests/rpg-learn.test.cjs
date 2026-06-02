/* ══════════════════════════════════════════════════════════════════
   Test: learning content (Teorie) pro ročníky 6/7/8/9
   Ověřuje moduly rpg-learn-N.js + zapojení s-learn v rpg-mat-N.html
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const PROJ = path.join(__dirname, '..', 'projects');
let pass = 0, fail = 0;
function ok(cond, msg){ if(cond){pass++; console.log('  ✅ '+msg);} else {fail++; console.log('  ❌ '+msg);} }

const GRADES = [6, 7, 8, 9];

for (const g of GRADES) {
  console.log(`\n── ${g}. ročník ──`);

  // 1) modul rpg-learn-N.js
  const modPath = path.join(PROJ, `rpg-learn-${g}.js`);
  ok(fs.existsSync(modPath), `rpg-learn-${g}.js existuje`);
  const sandbox = { window: {} };
  const code = fs.readFileSync(modPath, 'utf8');
  new Function('window', code)(sandbox.window);
  const L = sandbox.window[`RPG_LEARN_${g}`];
  ok(L && typeof L === 'object', `window.RPG_LEARN_${g} je objekt`);
  const keys = Object.keys(L || {});
  ok(keys.length === 21, `obsahuje 21 misí (má ${keys.length})`);

  // každá mise má intro a aspoň jednu sekci; video je null nebo {id,title}
  let structOK = true, videoOK = true, vids = 0;
  for (const k of keys) {
    const e = L[k];
    if (!e.intro || !Array.isArray(e.sections) || e.sections.length === 0) structOK = false;
    if (e.video !== null) {
      if (!e.video || typeof e.video.id !== 'string' || typeof e.video.title !== 'string') videoOK = false;
      else vids++;
    }
  }
  ok(structOK, 'každá mise má intro + alespoň jednu sekci');
  ok(videoOK, 'video je všude buď null, nebo {id,title}');
  console.log(`     (misí s videem: ${vids})`);

  // mise odpovídají vzoru oblast-mise 1-1 … 7-3
  const expected = [];
  for (let a = 1; a <= 7; a++) for (let m = 1; m <= 3; m++) expected.push(`${a}-${m}`);
  ok(expected.every(id => keys.includes(id)), 'klíče misí odpovídají 1-1 … 7-3');

  // 2) zapojení v rpg-mat-N.html
  const htmlPath = path.join(PROJ, `rpg-mat-${g}.html`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  ok(html.includes('id="s-learn"'), 'HTML má obrazovku s-learn');
  ok(html.includes('function startLearn'), 'HTML má funkci startLearn');
  ok(html.includes('function renderLearn'), 'HTML má funkci renderLearn');
  ok(html.includes('function launchLearnBattle'), 'HTML má funkci launchLearnBattle');
  ok(html.includes(`window.RPG_LEARN_${g}`), `renderLearn čte RPG_LEARN_${g}`);
  ok(html.includes(`./rpg-learn-${g}.js`), `HTML načítá rpg-learn-${g}.js`);
  ok(html.includes("if(active.id==='s-learn'){launchLearnBattle();}"), 's-learn má klávesovou zkratku');
  ok(html.includes('startLearn('), 'tlačítko Teorie volá startLearn');
}

console.log('\n══════════════════════════════════════════');
console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
