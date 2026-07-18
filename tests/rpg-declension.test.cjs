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

// Předložky/výrazy, které vynucují PEVNÝ pád (genitiv/lokál/dativ) nezávisle na počtu
// → tam neplatí počítací pravidlo 1/2-4/5+, takže tvary přeskočíme (jinak falešné poplachy,
// např. „po dobu 2 hodin" je správný genitiv, ne nominativní „2 hodiny").
const CASE_PREP = new Set(['z', 'ze', 'do', 'od', 'u', 'bez', 'během', 'dobu', 'kolem', 'okolo', 'vedle', 'podél', 'k', 'ke', 'ku', 'po', 'při']);
// projde text, u každého „<číslo> <slovo>" kde slovo je sledovaná forma ověří shodu
function scan(text, where, bad) {
  const re = /([a-záčďéěíňóřšťúůýžA-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+)?\s*(\d+)\s+([a-záčďéěíňóřšťúůýžA-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+)/g; let m;
  while ((m = re.exec(text))) {
    const prev = (m[1] || '').toLowerCase(), n = parseInt(m[2], 10), w = m[3];
    if (CASE_PREP.has(prev)) continue;            // pádová rekce → pevný tvar, nekontroluj
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

// ── 6) ZÁKLADNÍ pool z rpg-mat-N.html (AREAS → mise → tasks()) ──
// AREAS je jen browser-global; extrahujeme ho ze zdroje balanced-bracket scanem
// (respektuje `template` literaly a stringy), vyhodnotíme s mockem globálů a
// pustíme na base úlohy stejný scan skloňování + kontrolu NaN/undefined a MC bezpečnosti.
function extractAreas(html) {
  const start = html.indexOf('const AREAS');
  if (start < 0) return null;
  let k = html.indexOf('[', start);
  if (k < 0) return null;
  const stack = []; let inStr = false, strCh = '', esc = false;
  for (; k < html.length; k++) {
    const c = html[k], top = stack[stack.length - 1];
    if (esc) { esc = false; continue; }
    if (inStr) { if (c === '\\') esc = true; else if (c === strCh) inStr = false; continue; }
    if (top === '`') { if (c === '\\') esc = true; else if (c === '`') stack.pop(); else if (c === '$' && html[k + 1] === '{') { stack.push('E'); k++; } continue; }
    if (c === "'" || c === '"') { inStr = true; strCh = c; continue; }
    if (c === '`') { stack.push('`'); continue; }
    if (c === '[' || c === '{' || c === '(') { stack.push(c); continue; }
    if (c === ')') { if (top === '(') stack.pop(); continue; }
    if (c === '}') { if (top === '{' || top === 'E') stack.pop(); continue; }
    if (c === ']') { if (top === '[') { stack.pop(); if (stack.length === 0) return html.slice(start, k + 1); } continue; }
  }
  return null;
}
global.gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
global.cz = n => String(n).replace('.', ',');
global.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
global.skl = skl;
global.r1 = n => Math.round(n * 10) / 10; global.r2 = n => Math.round(n * 100) / 100;
global.slovy = n => String(n); global.triSides = () => [3, 4, 5];
global.countDiv = n => { let c = 0; for (let i = 1; i <= Math.abs(n); i++) if (n % i === 0) c++; return c; };
const MC_BY_GAME = { 3: ['1-1', '1-2', '3-1', '4-1', '7-1'], 4: ['1-1', '1-2', '3-1', '4-1', '7-1'], 5: ['1-1', '1-2', '3-1', '4-1', '5-1', '7-1'], 6: ['1-1', '2-1', '3-2'], 7: ['1-1', '2-1', '3-1', '4-1', '5-1'], 8: ['1-1', '2-1', '3-1', '4-1', '5-1', '6-1', '7-3'], 9: ['1-1', '2-1', '3-1', '4-1', '5-1', '6-1'] };
const isMcAns = a => { a = String(a); return a === 'ANO' || a === 'NE' || /^-?\d+(?:[.,]\d+)?$/.test(a); };
const mcbad = []; let gen2 = 0;
for (const g of [3, 4, 5, 6, 7, 8, 9]) {
  let html; try { html = fs.readFileSync(path.join(PROJ, 'rpg-mat-' + g + '.html'), 'utf8'); } catch (e) { ok(false, 'rpg-mat-' + g + '.html čtení: ' + e.message); continue; }
  const src = extractAreas(html);
  if (!src) { ok(false, 'rpg-mat-' + g + ': extrakce AREAS selhala'); continue; }
  (src.match(/\bsvg\w+/g) || []).forEach(n => { global[n] = () => '<svg></svg>'; });
  let AREAS; try { AREAS = new Function(src + '\nreturn AREAS;')(); } catch (e) { ok(false, 'rpg-mat-' + g + ': eval AREAS: ' + e.message); continue; }
  const mcSet = new Set(MC_BY_GAME[g] || []);
  let gcount = 0;
  for (let rep = 0; rep < 40; rep++) for (const ar of (AREAS || [])) for (const m of (ar.missions || [])) {
    if (typeof m.tasks !== 'function') continue;
    let list; try { list = m.tasks(); } catch (e) { if (rep === 0) ok(false, 'rpg-mat-' + g + '/' + m.id + ' tasks(): ' + e.message); continue; }
    (list || []).forEach(t => {
      gen2++; gcount++;
      const tx = String(t.text || ''), an = String(t.ans);
      scan(tx, 'base-' + g + '/' + m.id, bad);
      if (/undefined|NaN/.test(tx) || /undefined|NaN/.test(an)) mcbad.push('base-' + g + '/' + m.id + ': NaN/undefined v úloze');
      if ((m.mc || mcSet.has(m.id)) && !isMcAns(t.ans)) mcbad.push('base-' + g + '/' + m.id + ': MC odpověď „' + an + '" (není číslo/ANO/NE)');
    });
  }
  // g3-5 (1. stupeň) mají base tasks:()=>[] prázdné — úlohy jdou 100% z banky; base pool jen g6-9
  if (g >= 6) ok(gcount > 0, 'rpg-mat-' + g + ' base pool vygeneroval úlohy (' + gcount + ')');
  else ok(true, 'rpg-mat-' + g + ' base pool prázdný (úlohy z banky) — OK');
}
const umc = [...new Set(mcbad)];
ok(umc.length === 0, 'base pool: žádné NaN/undefined ani MC-nebezpečné odpovědi (' + umc.length + ' nálezů)');
umc.slice(0, 12).forEach(b => console.log('     · ' + b));

ok(gen + gen2 > 5000, 'vygenerováno dost úloh ke kontrole (banka+battle ' + gen + ' + base ' + gen2 + ')');
const uniq = [...new Set(bad)];
ok(uniq.length === 0, 'žádné špatné skloňování (' + uniq.length + ' nálezů)');
uniq.slice(0, 12).forEach(b => console.log('     · ' + b));

console.log('\n  Skloňování: ' + pass + ' ✅  /  ' + fail + ' ❌  (zkontrolováno ' + (gen + gen2) + ' úloh; z toho base pool ' + gen2 + ')');
process.exit(fail ? 1 : 0);
