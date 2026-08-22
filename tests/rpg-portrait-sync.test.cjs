/* ══════════════════════════════════════════════════════════════════════
   Portrét na kartě hubu = TÁŽ postava jako v aréně.

   PROČ tenhle test vznikl. Portréty se dřív skládaly ze sdíleného `BODY`
   plus tří řádků pokrývky hlavy, takže všech sedm ročníků mělo na kartách
   stejné tělo a lišila se jen barva. Když pak sprity v aréně dostaly
   vlastní siluetu per ročník (skafandr / průzkumník / mág …), karty se
   s arénou rozešly — a nikde to nespadlo, protože obojí bylo samo o sobě
   v pořádku.

   `rpg-hero-portraits.js` proto nese DOSLOVNOU KOPII arénových mřížek.
   Kopie je vědomá: hub je rozcestník a načítat kvůli portrétům ~146 kB
   sprite modulů by ho zpomalilo. Cenou je riziko, že se rozejde — a to
   hlídá právě tenhle test, znak po znaku.

   Kontroluje se i paleta. Portrét musí kreslit arénovými barvami, jinak
   by měl akcent jiný odstín; 1. stupeň má v `THEMES` accent o stupeň
   tmavší (kartě to sluší), takže bez převzetí arénové palety by postava
   nesouhlasila.

   Spusť: node tests/rpg-portrait-sync.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const ROCNIKY = [3, 4, 5, 6, 7, 8, 9];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

global.window = global;
require(path.join(ROOT, 'projects', 'rpg-hero-portraits.js'));
const P = global.window.RPGHeroPortrait;

/* Zdroj pravdy: mřížka a paleta přímo ze sprite souboru ročníku. */
function zeSpritu(g) {
  const s = fs.readFileSync(path.join(ROOT, 'projects', `rpg-sprites-${g}.js`), 'utf8');
  const i = s.indexOf('const IDLE0'), j = s.indexOf('];', i);
  const grid = (s.slice(i, j).match(/'[^']*'/g) || []).map(x => x.slice(1, -1));
  const k = s.indexOf('const PAL_HERO'), l = s.indexOf('}', k);
  const pal = {};
  for (const m of s.slice(k, l).matchAll(/([A-Za-z0-9]):\s*'(#[0-9a-fA-F]{6})'/g)) pal[m[1]] = m[2];
  return { grid, pal };
}

console.log('\n── Portrét vs. aréna ──\n');

ok(!!P && !!P.HERO_ART, 'modul vystavuje HERO_ART');
let znaku = 0;

for (const g of ROCNIKY) {
  const klic = 'g' + g;
  const zdroj = zeSpritu(g);
  const art = P.HERO_ART[klic];

  ok(!!art, `${klic}: mřížka je v modulu`);
  if (!art) continue;

  ok(art.grid.length === zdroj.grid.length,
    `${klic}: stejný počet řádků (${art.grid.length} vs ${zdroj.grid.length})`);

  const rozdil = [];
  for (let r = 0; r < Math.max(art.grid.length, zdroj.grid.length); r++) {
    if (art.grid[r] !== zdroj.grid[r]) rozdil.push(`řádek ${r}`);
    znaku += (zdroj.grid[r] || '').length;
  }
  ok(rozdil.length === 0, `${klic}: mřížka je znak po znaku shodná s arénou`,
    rozdil.slice(0, 4).join(', '));

  const palRozdil = [];
  for (const ch of Object.keys(zdroj.pal)) {
    if (art.pal[ch] !== zdroj.pal[ch]) palRozdil.push(`${ch}: ${art.pal[ch]} ≠ ${zdroj.pal[ch]}`);
  }
  ok(palRozdil.length === 0, `${klic}: paleta se shoduje s arénou`, palRozdil.slice(0, 3).join(' | '));

  /* Paleta, kterou modul VYDÁ ven, musí pokrýt každý znak mřížky —
     jinak se na kartě objeví magenta. `O` je rim, ten dodává modul. */
  const chybi = P.missingChars(P.grid(klic), P.palette(klic));
  ok(chybi.length === 0, `${klic}: žádný znak mimo paletu`, chybi.join(','));

  /* A hlavně: `grid()` musí vracet ARÉNOVOU mřížku, ne skládanku z BODY. */
  ok(P.grid(klic).join('|') === zdroj.grid.join('|'),
    `${klic}: grid() vrací arénovou mřížku`);
}

/* ── siluety se mezi ročníky musí lišit i na kartách ──────────────────
   Kdyby se HERO_ART omylem naplnil jednou mřížkou pro všechny, testy výš
   by prošly jen tehdy, když by se rozešel i zdroj — tohle to chytí hned. */
{
  const set = new Set(ROCNIKY.map(g => P.grid('g' + g).join('|')));
  ok(set.size === ROCNIKY.length, `sedm ročníků = sedm různých mřížek (${set.size})`);
}

/* Avatar v profilu není vázaný na svět a dál se skládá ze sdíleného těla. */
{
  const av = P.grid('avatar');
  ok(av && av.length > 20, 'avatar má vlastní skládanou mřížku');
  ok(!ROCNIKY.some(g => P.grid('g' + g).join('|') === av.join('|')),
    'avatar není totožný s žádným ročníkem');
}

/* Pojistka proti planému běhu. */
ok(znaku > ROCNIKY.length * 20 * 25, `porovnáno ${znaku} znaků mřížek`);

console.log(`\n  Portrét vs. aréna: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
