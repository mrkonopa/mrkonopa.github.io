/* ══════════════════════════════════════════════════════════════════════
   Řada akcí pod mapou (všech 7 ročníků).

   Původně to byl flex, kde TRÉNINK měl `flex:1` a ostatní `flex:none`.
   Dokud se popisky vešly, vypadalo to dobře; jakmile přibyla VĚŽ LEGEND
   a CERMAT TEST, nejdelší tlačítko přeteklo z rámečku ven a text se
   zlomil na čtyři řádky. Na screenshotu to Vojta viděl dřív než já —
   layout se v žádném testu nekontroloval.

   Tenhle test měří skutečné rámečky v prohlížeči: žádné tlačítko nesmí
   přesahovat svou mřížku ani mít ořezaný obsah, a to na širokém i úzkém
   okně. Chytí i to, kdyby někdo přidal další tlačítko s dlouhým názvem.

   Druhá kontrola: OBCHOD na mapě být nemá — obchod je sdílený a patří
   na HUB (a do profilu). Duplicitní vstup na mapě jen zabíral místo.

   Spusť: node tests/rpg-map-actions.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18993;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GRADES = [3, 4, 5, 6, 7, 8, 9];
const SIRKY = [1100, 820, 380];   // desktop · tablet · mobil

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
  console.log('\n── Řada akcí pod mapou ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let mereni = 0;
  try {
    for (const g of GRADES) {
      for (const w of SIRKY) {
        const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
        await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
        const page = await ctx.newPage();
        await page.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => typeof startGame === 'function', { timeout: 8000 });
        const r = await page.evaluate(() => {
          localStorage.clear(); startGame('Testovací žák'); S.tutorialDone = true;
          if (typeof renderMap === 'function') renderMap();
          const row = document.querySelector('#s-map .map-actions');
          if (!row) return { chyba: 'na mapě není .map-actions' };
          const rb = row.getBoundingClientRect();
          const btns = [...row.querySelectorAll('.btn')];
          const preteka = btns.filter(b => {
            const bb = b.getBoundingClientRect();
            return bb.right > rb.right + 1 || bb.left < rb.left - 1 ||
                   b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1;
          }).map(b => b.textContent.trim());
          return {
            pocet: btns.length,
            preteka,
            popisky: btns.map(b => b.textContent.trim()),
            obchodNaMape: btns.some(b => /OBCHOD/i.test(b.textContent)),
          };
        });
        mereni++;
        if (r.chyba) { ok(false, `g${g}@${w} má řadu akcí`, r.chyba); await ctx.close(); continue; }
        ok(r.pocet >= 3, `g${g}@${w} má aspoň 3 akce (${r.pocet})`);
        ok(r.preteka.length === 0, `g${g}@${w} žádné tlačítko nepřetéká`, r.preteka.join(' | '));
        ok(!r.obchodNaMape, `g${g}@${w} OBCHOD na mapě není (patří na HUB)`, r.popisky.join(' | '));
        await ctx.close();
      }
    }
    // Pojistka proti prázdnému běhu: kdyby se selektor rozešel s HTML,
    // smyčka by nic neproměřila a test by tiše prošel naprázdno.
    ok(mereni === GRADES.length * SIRKY.length,
      `proměřeno všech ${GRADES.length * SIRKY.length} kombinací ročník × šířka (${mereni})`);
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Řada akcí: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
