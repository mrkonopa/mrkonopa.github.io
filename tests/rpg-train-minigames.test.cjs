/* ══════════════════════════════════════════════════════════════════════
   Minihry v tréninku běží ve VŠECH ročnících.

   Porovnání ročníků (po nálezu s „egg") ukázalo další nedokončený port:
   spojovačka a řazení fungovaly v 1. stupni V BOJI — modul
   rpg-tasktypes.js načítají všechny hry — ale do tréninku se nenapojily.
   2. stupeň tam měl tři minihry, 1. stupeň ani jednu. Pexeso 1. stupeň
   nepoužíval nikde.

   Test nekontroluje jen to, že funkce existují (to by prošlo i prázdné
   tělo), ale že se minihra opravdu VYKRESLÍ do tréninkového panelu a že
   přitom nespadne. Kdyby se nedala z daného tématu sestavit, hra to má
   říct hláškou — i to je přijatelný výsledek, jen ne tichý prázdný panel.

   Spusť: node tests/rpg-train-minigames.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18998;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GRADES = [3, 4, 5, 6, 7, 8, 9];
const HRY = [['spojovačka', 'trStartMatch'], ['řazení', 'trStartOrder'], ['pexeso', 'trStartPexeso']];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

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
  console.log('\n── Minihry v tréninku ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let mereni = 0;
  try {
    for (const g of GRADES) {
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof startGame === 'function', { timeout: 8000 });

      const r = await page.evaluate(async (hry) => {
        localStorage.clear(); startGame('Testovací žák'); S.tutorialDone = true;
        go('train'); startTrain(AREAS[0].missions[0].id);
        await new Promise(r => setTimeout(r, 300));

        const out = {}, tlacitka = {};
        for (const [jm, fce] of hry) {
          tlacitka[jm] = !!document.querySelector(`[onclick*="${fce}"]`);
          if (typeof window[fce] !== 'function') { out[jm] = 'funkce chybí'; continue; }
          try { window[fce](); } catch (e) { out[jm] = 'výjimka: ' + String(e && e.message || e).slice(0, 50); continue; }
          await new Promise(r => setTimeout(r, 200));
          const prob = document.getElementById('tr-prob');
          const fb = (document.getElementById('tr-fb') || {}).textContent || '';
          out[jm] = (prob && prob.children.length) ? 'ok:' + prob.children.length
                  : (fb.trim() ? 'hláška: ' + fb.trim().slice(0, 40) : 'PRÁZDNÝ PANEL');
        }
        return { out, tlacitka };
      }, HRY);

      mereni++;
      for (const [jm] of HRY) {
        const v = r.out[jm];
        ok(r.tlacitka[jm], `g${g} ${jm}: tlačítko je v tréninku`);
        // Vykreslené prvky nebo srozumitelná hláška. Tichý prázdný panel ne.
        ok(/^ok:\d+$/.test(v) || /^hláška: /.test(v), `g${g} ${jm}: vykreslí se`, v);
      }
      ok(errs.length === 0, `g${g} bez JS chyby`, errs[0] || '');
      await ctx.close();
    }
    // Pojistka proti prázdnému běhu.
    ok(mereni === GRADES.length, `proměřeno všech ${GRADES.length} ročníků (${mereni})`);
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Minihry v tréninku: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
