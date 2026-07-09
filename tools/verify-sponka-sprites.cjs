global.window = {};
global.document = undefined;
global.localStorage = undefined;
require('/home/user/mrkonopa.github.io/projects/rpg-wallet.js');
const src = require('fs').readFileSync('/home/user/mrkonopa.github.io/projects/rpg-wallet.js', 'utf8');
const m = src.match(/const SPONKA_SPR = (\{[\s\S]*?\n  \};)/);
if (!m) { console.log('❌ SPONKA_SPR not found'); process.exit(1); }
const SPONKA_SPR = eval('(' + m[1].slice(0, -1) + ')');
let bad = [];
Object.entries(SPONKA_SPR).forEach(([id, spr]) => {
  const w = spr.grid[0].length;
  spr.grid.forEach((row, i) => { if (row.length !== w) bad.push(`${id} row${i} width ${row.length} != ${w}`); });
  const used = new Set(spr.grid.join('').split('').filter(c => c !== '.'));
  used.forEach(ch => { if (!(ch in spr.pal)) bad.push(`${id} char '${ch}' not in palette (would render magenta #f0f)`); });
});
console.log(bad.length ? '❌ ' + bad.join('\n❌ ') : `✅ ${Object.keys(SPONKA_SPR).length} pet sprites OK: consistent row width, full palette coverage`);
process.exit(bad.length ? 1 : 0);
