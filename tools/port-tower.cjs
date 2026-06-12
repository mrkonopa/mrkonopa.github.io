// Jednorázový port Věže legend z 9. ročníku do 6./7./8.
const fs = require('fs');
const src = fs.readFileSync('projects/rpg-mat-9.html', 'utf8');

// ── vyřízni HTML blok (s-tower screen) ──
const hStart = src.indexOf('<div id="s-tower" class="screen">');
const hEnd = src.indexOf('<!-- ══════════════ PROFILE ══════════════ -->');
const htmlBlock = src.slice(hStart, hEnd).trimEnd();

// ── vyřízni JS blok (VĚŽ LEGEND … twDrawCanvas) ──
const jStart = src.indexOf('// ══════════════════════════════════════════\n// VĚŽ LEGEND (Fáze 11)');
const jEnd = src.indexOf('// ══════════════════════════════════════════\n// PROFILE');
const jsBlock = src.slice(jStart, jEnd).trimEnd();

if (hStart < 0 || hEnd < 0 || jStart < 0 || jEnd < 0) { console.error('FAIL: markery nenalezeny', {hStart,hEnd,jStart,jEnd}); process.exit(1); }
console.log('HTML blok:', htmlBlock.length, 'znaků; JS blok:', jsBlock.length, 'znaků');

// per-game: barva svítících oken věže (téma) + ročníkový text
const GLOW = { 6: '77,200,255', 7: '232,192,96', 8: '170,136,255' };

function adapt(block, n) {
  let b = block
    .replace(/RPGSprites9/g, 'RPGSprites' + n)
    .replace(/RPG_TASK_EXTRA_9/g, 'RPG_TASK_EXTRA_' + n)
    .replace(/9\. ročníku/g, n + '. ročníku')
    .replace(/25,230,230/g, GLOW[n]);
  return b;
}

// ── drawHeroOn pro sprite soubor ──
const drawHeroOnFn =
`  function drawHeroOn(c2, x, y, scale, frame, flipX) {
    const grid = HERO_IDLE[frame ? 1 : 0];
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        c2.fillStyle = PAL_HERO[ch] || COMMON[ch] || '#f0f';
        const px = flipX ? x + (row.length - 1 - c) * scale : x + c * scale;
        c2.fillRect(px, y + r * scale, scale, scale);
      }
    }
  }
`;

for (const n of [6, 7, 8]) {
  // 1) sprite soubor: drawHeroOn + export
  const sp = 'projects/rpg-sprites-' + n + '.js';
  let s = fs.readFileSync(sp, 'utf8');
  if (!s.includes('function drawHeroOn')) {
    s = s.replace(/(\n\s*return \{ attach, detach, active, spawn, heroAttack, bossAttack, defeat, setProgress, setHeroHp)( \};)/,
      '\n' + drawHeroOnFn + '$1, drawHeroOn$2');
    fs.writeFileSync(sp, s);
    console.log(sp, '← drawHeroOn přidán');
  } else console.log(sp, 'už má drawHeroOn (skip)');

  // 2) HTML hra
  const hp = 'projects/rpg-mat-' + n + '.html';
  let h = fs.readFileSync(hp, 'utf8');
  if (h.includes('id="s-tower"')) { console.log(hp, 'už má věž (skip)'); continue; }

  // 2a) screen blok před s-shop
  const anchor = '<!-- ══════════════ SHOP ══════════════ -->';
  const shopDiv = '<div id="s-shop" class="screen">';
  const towerHtml = adapt(htmlBlock, n) + '\n\n';
  if (h.includes(anchor)) h = h.replace(anchor, anchor + '\n' + towerHtml.trimEnd());
  else h = h.replace(shopDiv, towerHtml + shopDiv);

  // 2b) tlačítko na mapě
  const trainBtn = '  <button class="btn b" style="flex:1" onclick="go(\'train\')">🎯 TRÉNINK — procvičuj libovolné téma bez boje</button>';
  h = h.replace(trainBtn, trainBtn + '\n  <button class="btn" style="flex:none" onclick="go(\'tower\')">🗼 VĚŽ LEGEND</button>');

  // 2c) go() hook
  const trainHook = "if(name==='train')renderTrainPicker();";
  h = h.replace(trainHook, trainHook + "\n if(name==='tower')renderTowerGate();else twAnimStop();");

  // 2d) JS blok před // PROFILE
  const profMarker = '// ══════════════════════════════════════════\n// PROFILE';
  h = h.replace(profMarker, adapt(jsBlock, n) + '\n\n' + profMarker);

  fs.writeFileSync(hp, h);
  console.log(hp, '← věž vložena (screen+button+go+js)');
}
console.log('Hotovo.');
