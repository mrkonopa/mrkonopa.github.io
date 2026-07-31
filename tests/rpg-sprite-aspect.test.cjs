/**
 * Poměr stran bojové arény — sprity se nesmí roztáhnout (všech 7 ročníků).
 *
 * Nalezená vada: `attach()` volal resize() dřív, než byl hotový layout, takže
 * `cv.clientWidth` bylo 0 a použil se fallback 600. Bitmapa 600 px se pak
 * vykreslila do 324px CSS boxu → sprity stlačené na 54 % šířky, tedy vysoké
 * a hubené. Na desktopu (638 px) to dělalo jen 6 %, proto si toho nikdo
 * nevšiml. Posluchač window.resize nepomohl — okno velikost nemění.
 *
 * Test měří na MOBILNÍM i desktopovém viewportu, že bitmapa canvasu má
 * stejnou šířku jako jeho CSS box (poměr 1:1).
 *
 * Spusť: node tests/rpg-sprite-aspect.test.cjs
 */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18781;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GRADES = [3, 4, 5, 6, 7, 8, 9];
const VIEWPORTS = [
  { label: 'mobil', width: 390, height: 844 },     // iPhone 14
  { label: 'tablet', width: 768, height: 1024 },
  { label: 'desktop', width: 1280, height: 900 },
];

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + n + (d ? ' — ' + d : '')); } };

function serve() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', svg: 'image/svg+xml' };
  const srv = http.createServer((q, p) => {
    let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT)) { p.writeHead(403); return p.end('x'); }
    try { const b = fs.readFileSync(fp); p.writeHead(200, { 'Content-Type': mime[u.split('.').pop()] || 'application/octet-stream' }); p.end(b); }
    catch { p.writeHead(404); p.end('nf'); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

(async () => {
  console.log('\n── Poměr stran bojové arény (3.–9. ročník) ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  const errs = [];
  try {
    for (const g of GRADES) {
      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
        const page = await ctx.newPage();
        page.on('pageerror', e => errs.push(g + '/' + vp.label + ': ' + e.message));
        await page.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => typeof startGame === 'function' && typeof launchBattle === 'function', { timeout: 8000 });
        await page.evaluate(() => { localStorage.clear(); startGame('Test'); S.tutorialDone = true; });
        await page.evaluate(() => { const ar = AREAS.find(a => a.id === 1); launchBattle(1, ar.missions[0].id); });
        await page.waitForTimeout(400);   // nech doběhnout pár snímků smyčky

        const m = await page.evaluate(() => {
          const cv = document.getElementById('bt-arena');
          if (!cv) return null;
          const r = cv.getBoundingClientRect();
          return { bmpW: cv.width, bmpH: cv.height, cssW: Math.round(r.width), cssH: Math.round(r.height) };
        });
        const where = g + '. roč / ' + vp.label + ' ' + vp.width + 'px';
        if (!m) { ok(where, false, 'canvas #bt-arena nenalezen'); await ctx.close(); continue; }

        const sx = m.cssW / m.bmpW, sy = m.cssH / m.bmpH;
        const skew = sx / sy;
        ok(where + ': bitmapa = CSS box', Math.abs(skew - 1) < 0.02,
          `bitmapa ${m.bmpW}×${m.bmpH}, CSS ${m.cssW}×${m.cssH} → zkreslení ${skew.toFixed(3)}`);
        await ctx.close();
      }
    }
    ok('žádné JS chyby', errs.length === 0, errs[0] || '');
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Poměr stran arény: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
