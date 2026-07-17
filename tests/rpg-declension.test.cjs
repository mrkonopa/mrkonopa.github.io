/* Skloňování (shoda čísla a podstatného jména): 1 → sg, 2-4 → nom. pl,
   5+/0 → gen. pl. Hlídá, že vygenerované úlohy z bank i živých soubojů
   nemají špatný tvar u sledovaných skloňovaných jmen. Regresní pojistka
   pro budoucí rozšiřování databank. Čistý Node. Spusť: node tests/rpg-declension.test.cjs */
const fs = require('fs'), path = require('path');
const PROJ = path.join(__dirname, '..', 'projects');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m); } };

// ── 1) unit test helperu skl (1 / 2-4 / 5+) ──
const skl = (n, one, few, many) => n === 1 ? one : (n >= 2 && n <= 4 ? few : many);
ok(skl(1, 'a', 'b', 'c') === 'a', 'skl(1) → tvar pro 1');
ok(skl(2, 'a', 'b', 'c') === 'b' && skl(3, 'a', 'b', 'c') === 'b' && skl(4, 'a', 'b', 'c') === 'b', 'skl(2-4) → tvar pro 2-4');
ok(skl(0, 'a', 'b', 'c') === 'c' && skl(5, 'a', 'b', 'c') === 'c' && skl(11, 'a', 'b', 'c') === 'c' && skl(22, 'a', 'b', 'c') === 'c', 'skl(0/5/11/22) → tvar pro 5+');

// ── 2) helper skl je definovaný ve všech bankách/battle (aby generátory neběžely bez něj) ──
['rpg-tasks-3.js','rpg-tasks-4.js','rpg-tasks-5.js','rpg-tasks-6.js','rpg-tasks-7.js',
 'rpg-battle-3.js','rpg-battle-4.js','rpg-battle-5.js','rpg-battle-6.js','rpg-battle-7.js','rpg-battle-8.js','rpg-battle-9.js'
].forEach(f => { ok(/\bskl\s*[=(]/.test(fs.readFileSync(path.join(PROJ, f), 'utf8')), f + ' definuje helper skl'); });

// ── 3) tabulka správných tvarů sledovaných jmen: [tvar_1, tvar_2-4, tvar_5+] ──
// (jen jména v NOMINATIVU/AKUZATIVU — pádová rekce jako „z 5 kuliček" sem nepatří)
const NOUNS = {
  'sešit':    ['sešit', 'sešity', 'sešitů'],
  'kus':      ['kus', 'kusy', 'kusů'],
  'stůl':     ['stůl', 'stoly', 'stolů'],
  'hodina':   ['hodinu', 'hodiny', 'hodin'],
  'pracovník':['pracovník', 'pracovníci', 'pracovníků'],
  'červená':  ['červená', 'červené', 'červených'],
};
// forma → index třídy (0=1, 1=2-4, 2=5+)
const FORM2CLASS = {};
Object.values(NOUNS).forEach(t => t.forEach((form, i) => { (FORM2CLASS[form] = FORM2CLASS[form] || []).push(i); }));
const classOf = n => n === 1 ? 0 : (n >= 2 && n <= 4 ? 1 : 2);

// projde text, u každého „<číslo> <slovo>" kde slovo je sledovaná forma ověří shodu
function scan(text, where, bad) {
  const re = /(\d+)\s+([a-záčďéěíňóřšťúůýžA-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+)/g; let m;
  while ((m = re.exec(text))) {
    const n = parseInt(m[1], 10), w = m[2];
    if (!FORM2CLASS[w]) continue;                 // neznámé slovo → ignoruj
    if (FORM2CLASS[w].indexOf(classOf(n)) < 0)    // forma nesedí na počet
      bad.push(where + ': „' + n + ' ' + w + '" (špatný tvar pro počet ' + n + ')');
  }
}

// ── 4) generuj banky (tasks) ──
const bad = []; let gen = 0;
for (const g of [3, 4, 5, 6, 7, 8, 9]) {
  const sandbox = { window: {} };
  global.window = sandbox.window; global.skl = skl;   // tasks-8/9 spoléhají na globální skl
  try { new Function(fs.readFileSync(path.join(PROJ, 'rpg-tasks-' + g + '.js'), 'utf8'))(); } catch (e) { ok(false, 'tasks-' + g + ' se načte: ' + e.message); continue; }
  const ex = global.window['RPG_TASK_EXTRA_' + g] || {};
  for (let rep = 0; rep < 60; rep++) for (const mid in ex) {
    if (typeof ex[mid] !== 'function') continue;
    let list; try { list = ex[mid](); } catch (e) { continue; }
    list.forEach(t => { gen++; scan(String(t.text || ''), 'tasks-' + g + '/' + mid, bad); });
  }
}
// ── 5) generuj živé souboje (battle) ──
for (const g of [3, 4, 5, 6, 7, 8, 9]) {
  let api; try { api = require(path.join(PROJ, 'rpg-battle-' + g + '.js')); } catch (e) { continue; }
  if (!api || typeof api.build !== 'function') continue;
  for (let s = 1; s < 250; s++) { let qs; try { qs = api.build(s, 8); } catch (e) { continue; } (qs || []).forEach(q => { gen++; scan(String(q.text || ''), 'battle-' + g, bad); }); }
}

ok(gen > 5000, 'vygenerováno dost úloh ke kontrole (' + gen + ')');
const uniq = [...new Set(bad)];
ok(uniq.length === 0, 'žádné špatné skloňování (' + uniq.length + ' nálezů)');
uniq.slice(0, 12).forEach(b => console.log('     · ' + b));

console.log('\n  Skloňování: ' + pass + ' ✅  /  ' + fail + ' ❌  (zkontrolováno ' + gen + ' úloh)');
process.exit(fail ? 1 : 0);
