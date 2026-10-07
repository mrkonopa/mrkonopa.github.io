/* ══════════════════════════════════════════════════════════════════════
   page.waitForFunction(fn, arg, options) — volby jsou až TŘETÍ.

   Zápis waitForFunction(fn, {timeout: N}) předá objekt jako ARGUMENT
   funkce a čeká se výchozích 30 s, ne N (Playwright 1.60: 30,0 s proti
   1,0 s s null na místě argumentu). Na zelené cestě to nevadí, ale každé
   selhání se protáhne na 30 s a ve smyčce s .catch(()=>{}) se z něj stane
   TIMEOUT běhu bez důvodu — tak se v rpg-attack-initial schovala skutečná
   vada za „flaky“ (6. 10. 2026). Takových volání bylo 262 z 287.

   Test projde všechny .cjs v tests/ a tools/ sdíleným skenerem
   (waitforfunction-sken.cjs) a spadne na:
     - volby na místě argumentu  → oprava: waitForFunction(fn, null, {…})
     - objekt, kde jsou volby smíchané s jinými klíči
     - volání, které skener nedokáže dočíst (raději nahlas než potichu)
   Skener se nejdřív ověří na umělých případech oběma směry.

   Spusť: node tests/waitforfunction-volby.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const { najdiVolani, maParametry } = require('./waitforfunction-sken.cjs');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

console.log('\n── waitForFunction: volby až na 3. místě ──\n');

// 1) skener na umělých případech — obě strany: vadné najde, správné nechá být
const druhy = s => najdiVolani(s).map(v => v.druh + ':' + v.args.length).join(' ');
const PRIPADY = [
  ['page.waitForFunction(()=>x, {timeout:5000})', 'volby:2', 'volby na místě argumentu'],
  ['page.waitForFunction(() => x, { timeout: 8000, polling: 100 })', 'volby:2', 'timeout i polling'],
  ["page.waitForFunction(()=>x, {'timeout':1})", 'volby:2', 'klíč v uvozovkách'],
  ['page.waitForFunction(()=>x, null, {timeout:5000})', 'ok:3', 'správně: null + volby'],
  ['page.waitForFunction(b=>x>b, 5, {timeout:5000})', 'ok:3', 'správně: argument + volby'],
  ['page.waitForFunction(()=>x)', 'ok:1', 'bez voleb'],
  ['page.waitForFunction(({a})=>a, {a:1})', 'ok:2', 'objekt jako skutečný argument'],
  ['page.waitForFunction(()=>1, {timeout:1, x:2})', 'smisene:2', 'volby smíchané s argumentem'],
  ["page.waitForFunction(()=>')'.length>0, {timeout:1})", 'volby:2', 'závorka v řetězci'],
  ['page.waitForFunction(()=>/[)(]/.test(s), {timeout:1})', 'volby:2', 'závorky v regulárním výrazu'],
  ['page.waitForFunction(()=>a / b > c / d, {timeout:1})', 'volby:2', 'dělení není regulární výraz'],
  ['page.waitForFunction(()=>`a${f({b:1})}c`.length>0, {timeout:1})', 'volby:2', 'šablona s ${} a objektem'],
  ['page.waitForFunction(()=>`a${`n${1}`}c`, {timeout:1})', 'volby:2', 'vnořená šablona'],
  ['/* page.waitForFunction(x, {timeout:1}) */ page.waitForFunction(()=>1)', 'ok:1', 'volání v komentáři se nepočítá'],
  ["const s = 'page.waitForFunction(x, {timeout:1})'; page.waitForFunction(()=>1)", 'ok:1', 'volání v řetězci se nepočítá'],
  ['page.waitForFunction(()=>1, {timeout:1},)', 'nejasne:2', 'neúplné volání se ohlásí'],
];
let dobre = 0;
for (const [src, cekam, co] of PRIPADY) {
  const r = druhy(src);
  if (r === cekam) dobre++; else console.log(`     ${co}: ${r || '(nic)'} místo ${cekam}`);
}
ok(dobre === PRIPADY.length, `skener: ${dobre} z ${PRIPADY.length} umělých případů (vadné najde, správné nechá být)`);
ok(maParametry('()=>1') === false && maParametry('(b)=>b') === true && maParametry('x=>x') === true && maParametry("'1+1'") === null,
  'skener pozná funkci s parametrem (ta se strojově neopravuje)');

// 2) všechna skutečná volání v tests/ a tools/
const soubory = [];
for (const dir of ['tests', 'tools']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) if (/\.c?js$/.test(f)) soubory.push(path.join(dir, f));
}
let videno = 0; const vadne = [];
for (const rel of soubory) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const v of najdiVolani(src)) {
    videno++;
    if (v.druh !== 'ok') vadne.push(`${rel}:${v.radek} (${v.druh === 'volby' ? 'volby na místě argumentu' : v.druh === 'smisene' ? 'volby smíchané s argumentem' : 'volání nejde dočíst'})`);
  }
}
/* Naměřeno 6. 10. 2026: 287 volání v tests/ + 1 v tools/. Podlaha chytá
   zhroucení skeneru (0 nalezených), ne úbytek pár testů. */
ok(videno >= 250, `skener viděl ${videno} volání waitForFunction v ${soubory.length} souborech (podlaha 250)`);
ok(vadne.length === 0, `žádné volby na místě argumentu${vadne.length ? ' — ' + vadne.length + '×: ' + vadne.slice(0, 5).join(', ') + ' — oprava: waitForFunction(fn, null, {…})' : ''}`);

console.log('\n══════════════════════════════════════════');
console.log(`  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
