/* ══════════════════════════════════════════════════════════════════════
   Dělení brány na díly (run-ci.cjs --shard) podle naměřených dob.

   PROČ. Round-robin přes seřazený seznam dal na CI díly 12,4 / 15,8 / 20,2 min
   (běh 39299249731, 19. 10. 2026): tři běhy po 120–250 s padly do téhož dílu a
   brána čekala na nejpomalejší. Teď běhy rozděluje `tests/ci-casy.json`
   (nejdelší běh vždy dílu s nejmenší prací). Dělení je chyba, která NIC
   NESHODÍ — jen se čeká déle, nebo hůř, test z dílů vypadne — proto ho hlídá
   test, ne spoléhání na to, že si někdo všimne času.

   CO SE HLÍDÁ.
     1. Díly tvoří ROZKLAD: každý běh je právě v jednom dílu, žádný nechybí
        (ztracený test = tiché vypadnutí z brány), pro 2–6 dílů.
     2. Rozvážení: nejvytíženější díl nepřesáhne 1,1× průměr (round-robin
        dává na týchž datech 1,25×).
     3. Záznam v ci-casy.json bez skutečného běhu = zastaralý (přejmenovaný
        nebo smazaný test), jinak by soubor tiše hnil.
     4. Uvnitř dílu zůstává pořadí seznamu, deep harness je v dílu první.
     5. Rozbor logu z CI (`tools/ci-casy.cjs`) čte řádky `[ i/n] ✅ test (Ns)`.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const J = JSON.parse(fs.readFileSync(path.join(__dirname, 'ci-casy.json'), 'utf8'));
const { rozbor } = require(path.join(ROOT, 'tools', 'ci-casy.cjs'));

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log('  ❌ ' + m)); };
const seznam = args => execFileSync('node', [path.join(__dirname, 'run-ci.cjs'), '--list', '--only=browser', ...args], { encoding: 'utf8', maxBuffer: 1 << 24 })
  .split('\n').filter(l => l.startsWith('  • ')).map(l => l.slice(4));
const cas = l => J.casy[l] ?? J.vychozi;

const vse = seznam([]);
ok(vse.length > 150, `prohlížečových běhů je ${vse.length}, čekám přes 150 — seznam se nenačetl`);

/* 1 + 2 */
for (const n of [2, 3, 4, 5, 6]) {
  const dily = Array.from({ length: n }, (_, i) => seznam([`--shard=${i + 1}/${n}`]));
  const videno = new Map(); let dup = 0;
  dily.forEach((d, i) => d.forEach(l => { if (videno.has(l)) dup++; videno.set(l, i); }));
  ok(dup === 0, `${n} dílů: ${dup} běhů je ve dvou dílech`);
  const chybi = vse.filter(l => !videno.has(l));
  ok(chybi.length === 0, `${n} dílů: chybí ${chybi.length} běhů (${chybi.slice(0, 3).join(', ')})`);
  ok(videno.size === vse.length, `${n} dílů: v dílech je ${videno.size} různých běhů, má jich být ${vse.length}`);
  const zatez = dily.map(d => d.reduce((a, l) => a + cas(l), 0)), prumer = zatez.reduce((a, b) => a + b, 0) / n;
  if (n <= 4) ok(Math.max(...zatez) <= 1.1 * prumer, `${n} dílů: nejvytíženější díl ${Math.max(...zatez)} s je přes 1,1× průměr ${prumer.toFixed(0)} s (${zatez.join(' / ')})`);
  console.log(`  ${n} dílů: ${zatez.map(z => (z / 60).toFixed(1)).join(' / ')} min, ${dily.map(d => d.length).join('/')} běhů`);
}

/* 3 */
const zastarale = Object.keys(J.casy).filter(l => !vse.includes(l));
ok(zastarale.length === 0, `ci-casy.json má záznamy bez běhu: ${zastarale.join(', ')}`);
ok(Number.isFinite(J.vychozi) && J.vychozi > 0, 'vychozi musí být kladné číslo');
ok(Object.values(J.casy).every(s => Number.isFinite(s) && s >= 2), 'záznam v ci-casy.json musí být číslo od 2 s (kratší běhy počítá vychozi)');

/* 4 */
const d4 = [1, 2, 3, 4].map(i => seznam([`--shard=${i}/4`]));
const deep = d4.find(d => d.some(l => l.startsWith('vstudents-deep')));
ok(deep && deep[0].startsWith('vstudents-deep'), 'deep harness není v dílu první');
ok(d4.every(d => d.every((l, i) => i === 0 || vse.indexOf(d[i - 1]) < vse.indexOf(l))), 'uvnitř dílu se změnilo pořadí seznamu');

/* 5 */
const ukazka = [
  '2026-10-19T18:05:41.9848000Z [ 1/70] ✅ vstudents-deep.harness.cjs (118s)  VÝSLEDEK: 113 ✅  /  0 ❌',
  '2026-10-19T18:07:42.0831690Z [14/70] ✅ rpg-adaptive-battle.test.cjs [3] (1s)  Adaptivní boj (g3): 15 ✅  /  0 ❌',
  '2026-10-19T18:09:00.0000000Z [20/70] ✅~ rpg-hack.test.cjs (11s)  HACK TEST: 71 ✅  /  0 ❌',
  '2026-10-19T18:09:01.0000000Z [21/70] ❌ rpg-padlo.test.cjs (7s)  ❌',
].join('\n');
const r = rozbor(ukazka);
ok(r['vstudents-deep.harness.cjs'] === 118 && r['rpg-adaptive-battle.test.cjs [3]'] === 1 && r['rpg-hack.test.cjs'] === 11, 'rozbor logu: špatné časy nebo popisky');
ok(!('rpg-padlo.test.cjs' in r) && Object.keys(r).length === 3, 'rozbor logu: neúspěšný běh se do časů dostal');

console.log(`\nVÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
process.exit(fail ? 1 : 0);
