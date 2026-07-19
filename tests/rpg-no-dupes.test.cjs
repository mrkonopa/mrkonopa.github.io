/**
 * Žádné duplicitní úlohy za sebou (boj / trénink / věž) — regrese k nálezu,
 * kdy losování odlišovalo úlohy podle INDEXU v poolu, ne podle TEXTU, a fixní/
 * nízko-entropní šablony (v base i bance) daly dvě stejné otázky za sebou.
 * Spusť: node tests/rpg-no-dupes.test.cjs
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18477;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GAMES = ['3', '4', '5', '6', '7', '8', '9'];

function startServer() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', svg: 'image/svg+xml', json: 'application/json' };
  const srv = http.createServer((req, res) => {
    let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
    try { const fp = path.normalize(path.join(ROOT, p)); if (!fp.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end('forbidden'); return; } const b = fs.readFileSync(fp); res.writeHead(200, { 'Content-Type': mime[p.split('.').pop()] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end('nf'); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}
let pass = 0, fail = 0;
function ok(n, c, d = '') { if (c) { console.log(`  ✅ ${n}`); pass++; } else { console.log(`  ❌ ${n}${d ? ' — ' + d : ''}`); fail++; } }

async function testGame(ctx, g) {
  console.log(`\n━━ rpg-mat-${g} ━━`);
  const pg = await ctx.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message));
  try {
    await pg.goto(`${BASE}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => typeof AREAS !== 'undefined' && typeof startGame === 'function' && typeof launchBattle === 'function', { timeout: 8000 });
    // nová postava + vysoká chybovost (stresuje váhy pytlíku/výběru → nutí opakování)
    await pg.evaluate(() => { document.getElementById('ni').value = 'TEST'; startGame(); S.tutorialDone = true; });

    // ── BOJ: všechny mise, žádné dva SOUSEDNÍ ani duplicitní texty v tažení ──
    const battle = await pg.evaluate(() => {
      const res = { adj: [], within: [], n: 0 };
      for (const ar of AREAS) for (const m of ar.missions) {
        S.trainErrs = { [m.id]: { 0: 9, 1: 9, 2: 9 } }; // vysoké váhy (netýká se boje, ale ať je stav realistický)
        for (let rep = 0; rep < 40; rep++) {
          launchBattle(ar.id, m.id);
          const tx = (BT.tasks || []).map(t => String(t && t.text));
          res.n++;
          for (let i = 1; i < tx.length; i++) if (tx[i] === tx[i - 1]) res.adj.push(m.id + ':„' + tx[i].slice(0, 30) + '"');
          const seen = {}; for (const t of tx) { if (seen[t]) res.within.push(m.id + ':„' + t.slice(0, 30) + '"'); seen[t] = 1; }
        }
      }
      return res;
    });
    ok('BOJ: žádné dva SOUSEDNÍ stejné texty', battle.adj.length === 0, [...new Set(battle.adj)].slice(0, 4).join(' | ') + ' (' + battle.adj.length + '×/' + battle.n + ' tažení)');
    ok('BOJ: žádné duplicitní texty v rámci tažení', battle.within.length === 0, [...new Set(battle.within)].slice(0, 4).join(' | ') + ' (' + battle.within.length + '×)');

    // ── TRÉNINK: podmnožina misí, 50 tažení, žádné dva SOUSEDNÍ stejné ──
    const midset = await pg.evaluate(() => AREAS.flatMap(a => a.missions.map(m => m.id)));
    const trMids = midset.filter((_, i) => i % 3 === 0).slice(0, 5); // ~5 misí napříč oblastmi
    const trainAdj = await pg.evaluate((mids) => {
      const bad = [];
      for (const mid of mids) {
        S.trainErrs = { [mid]: { 0: 9, 1: 9, 2: 9, 3: 9 } }; // vysoké váhy → maximální tlak na opakování
        startTrain(mid);
        let prev = null;
        for (let i = 0; i < 50; i++) {
          trDraw();
          const t = TR.task ? String(TR.task.text) : null;
          if (t !== null && t === prev) bad.push(mid + ':„' + t.slice(0, 30) + '"');
          prev = t;
        }
      }
      return bad;
    }, trMids);
    ok('TRÉNINK: žádné dva SOUSEDNÍ stejné texty (50 tažení × ' + trMids.length + ' misí)', trainAdj.length === 0, [...new Set(trainAdj)].slice(0, 4).join(' | ') + ' (' + trainAdj.length + '×)');

    // ── VĚŽ (g6-9): žádné dva SOUSEDNÍ stejné texty ──
    if (Number(g) >= 6) {
      const towerAdj = await pg.evaluate(() => {
        if (typeof twMissionFor !== 'function' || typeof twDrawTask !== 'function') return { skip: true };
        // sandbox: obejdi eligibilitu, jen krmíme twDrawTask a čteme TW.task
        if (typeof TW === 'undefined') window.TW = {};
        TW.on = true; TW.floor = 1; TW._lastText = undefined;
        const bad = []; let prev = null;
        for (let i = 0; i < 60; i++) {
          TW.floor = 1 + (i % 20);
          try { twDrawTask(); } catch (e) { return { err: e.message }; }
          const t = TW.task ? String(TW.task.text) : null;
          if (t !== null && t === prev) bad.push('patro' + TW.floor + ':„' + t.slice(0, 26) + '"');
          prev = t;
        }
        return { bad };
      });
      if (towerAdj.skip) ok('VĚŽ: přítomna', false, 'twDrawTask chybí');
      else if (towerAdj.err) ok('VĚŽ: běh bez výjimky', false, towerAdj.err);
      else ok('VĚŽ: žádné dva SOUSEDNÍ stejné texty (60 pater)', towerAdj.bad.length === 0, [...new Set(towerAdj.bad)].slice(0, 4).join(' | ') + ' (' + towerAdj.bad.length + '×)');
    }

    ok('žádná JS chyba na stránce', perr.length === 0, perr.slice(0, 3).join(' | '));
  } catch (e) {
    ok('běh bez výjimky', false, e.message);
  } finally { await pg.close(); }
}

async function run() {
  console.log('\n══════════════════════════════════════════');
  console.log('  Žádné duplicitní úlohy za sebou — 7 ročníků');
  console.log('══════════════════════════════════════════');
  const srv = await startServer();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  const ctx = await browser.newContext();
  await ctx.route('**jsdelivr**', r => r.abort());
  for (const g of GAMES) await testGame(ctx, g);
  await browser.close();
  srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
}
run();
