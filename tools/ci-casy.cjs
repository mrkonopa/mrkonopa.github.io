/* Obnova tests/ci-casy.json z logů dílů brány na CI.
   Použití:  node tools/ci-casy.cjs log-dilu-1.txt log-dilu-2.txt … [--zdroj="Tests, běh N na main abc1234, D. M. RRRR"]
   Log dílu stáhni z Actions (Spustit díl i/n → Download log). Řádky `[ 3/70] ✅ label (118s)` se sečtou
   do jednoho slovníku; ukládají se jen běhy od 2 s, ostatní počítá run-ci.cjs jako `vychozi`.
   Běhy, které v logu chybí (nový test), se nemažou ani nepřidávají — zůstává předchozí záznam. */
'use strict';
const fs = require('fs'), path = require('path');

const ZADANI = path.join(__dirname, '..', 'tests', 'ci-casy.json');

function rozbor(text) {
  const casy = {};
  for (const m of text.matchAll(/\[\s*\d+\/\d+\]\s+✅~?\s+(.+?)\s+\((\d+)s\)/g)) casy[m[1]] = +m[2];
  return casy;
}

if (require.main === module) {
  const soubory = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const zdroj = (process.argv.find(a => a.startsWith('--zdroj=')) || '').slice(8);
  if (!soubory.length) { console.error('Chybí log dílu.'); process.exit(2); }
  const nove = Object.assign({}, ...soubory.map(f => rozbor(fs.readFileSync(f, 'utf8'))));
  if (!Object.keys(nove).length) { console.error('V logu není žádný řádek „[ i/n] ✅ test (Ns)“.'); process.exit(1); }
  const J = JSON.parse(fs.readFileSync(ZADANI, 'utf8'));
  for (const [l, s] of Object.entries(nove)) { if (s >= 2) J.casy[l] = s; else delete J.casy[l]; }
  if (zdroj) J.zdroj = zdroj;
  fs.writeFileSync(ZADANI, JSON.stringify(J, null, 2) + '\n');
  console.log(`Zapsáno ${Object.keys(nove).length} běhů z logu, v souboru je ${Object.keys(J.casy).length} záznamů.`);
}

module.exports = { rozbor };
