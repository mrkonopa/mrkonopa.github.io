/* ══════════════════════════════════════════════════════════════════════
   Obrázek úlohy se ukáže VŠUDE, kde se úloha zobrazuje — v boji,
   v tréninku i ve věži, ve všech sedmi ročnících.

   Nalezeno 1. 10. 2026 porovnáním ročníků: trénink ve 3.–7. ročníku
   vypisoval jen `textContent = t.text`, takže obrázek úlohy tiše zmizel;
   8. a 9. ročník ho kreslily vždy. V 6. ročníku to bylo vidět i na
   zadání — „Úhel na obrázku je menší než 90°. Jaký je to druh úhlu?"
   stálo v tréninku bez obrázku. Boj a věž obrázek měly, takže to žádný
   test nechytil: kontroly obrázků (rpg-obrazky, svg-tasks) se dívají na
   VYGENEROVANOU úlohu, ne na to, co dítě uvidí na obrazovce.

   Test proto vezme skutečnou úlohu s obrázkem z banky daného ročníku,
   vykreslí ji v každém místě a hledá kresbu i text zadání v DOMu.

   Spusť: node tests/rpg-obrazky-zobrazeni.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18996;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GRADES = [3, 4, 5, 6, 7, 8, 9];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function serve() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css' };
  const srv = http.createServer((q, p) => {
    let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT)) { p.writeHead(403); return p.end(); }
    let b = null; try { b = fs.readFileSync(fp); } catch (e) {}
    if (b === null) { p.writeHead(404); return p.end(); }
    p.writeHead(200, { 'Content-Type': mime[u.split('.').pop()] || 'application/octet-stream' });
    p.end(b);
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

(async () => {
  console.log('\n── Obrázek úlohy v boji, tréninku i věži ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  try {
    for (const g of GRADES) {
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(g => typeof startGame === 'function' && !!window['RPG_TASK_EXTRA_' + g], g, { timeout: 8000 });

      const r = await page.evaluate((g) => {
        localStorage.clear(); startGame('Testovací žák'); S.tutorialDone = true;
        const EX = window['RPG_TASK_EXTRA_' + g] || {};
        // první mise, jejíž úlohy (základ + banka) mají obrázek
        let hit = null;
        for (const ar of AREAS) {
          for (const m of ar.missions) {
            for (let k = 0; k < 30 && !hit; k++) {
              const pool = [...(m.tasks() || []), ...(typeof EX[m.id] === 'function' ? EX[m.id]() : [])];
              const t = pool.find(x => x && x.svg);
              if (t) hit = { aid: ar.id, m, t };
            }
            if (hit) break;
          }
          if (hit) break;
        }
        if (!hit) return { chyba: 'v ročníku není žádná úloha s obrázkem' };
        const vidi = id => {
          const el = document.getElementById(id);
          const txt = el && el.querySelector('.prob-txt');
          return { svg: !!(el && el.querySelector('.prob-svg svg')), text: !!txt && txt.textContent === String(hit.t.text) };
        };
        const out = { mise: hit.m.id };
        launchBattle(hit.aid, hit.m.id);
        BT.tasks[BT.idx] = hit.t; if (BT.mini) BT.mini[BT.idx] = null; renderTask();
        out.boj = vidi('bt-prob');
        go('train'); startTrain(hit.m.id); TR.task = hit.t; trRender();
        out.trenink = vidi('tr-prob');
        if (typeof twRenderTask === 'function') { TW.task = hit.t; TW.m = hit.m; twRenderTask(); out.vez = vidi('tw-prob'); }
        return out;
      }, g);

      if (r.chyba) { ok(false, g + '. ročník: ' + r.chyba); await ctx.close(); continue; }
      const mista = [['boj', r.boj], ['trénink', r.trenink]].concat(g >= 6 ? [['věž', r.vez]] : []);
      for (const [kde, v] of mista) {
        ok(v && v.svg, `${g}. ročník, ${kde}: obrázek úlohy je vidět (mise ${r.mise})`);
        ok(v && v.text, `${g}. ročník, ${kde}: zadání stojí pod obrázkem celé`);
      }
      ok(errs.length === 0, `${g}. ročník: žádné JS chyby`, errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  } finally {
    await browser.close(); srv.close();
  }
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
