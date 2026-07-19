/**
 * CERMAT odpočet v přijímačkách — velká klikací karta d/h/m/s.
 * Spusť: node tests/cermat-countdown.test.cjs
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18492;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = `${BASE}/projects/prijimacky-matematika/index.html`;

function startServer() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
    try { const fp = path.normalize(path.join(ROOT, p)); if (!fp.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end(); return; } const b = fs.readFileSync(fp); res.writeHead(200, { 'Content-Type': mime[p.split('.').pop()] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end('nf'); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}
let pass = 0, fail = 0;
function ok(n, c, d = '') { if (c) { console.log(`  ✅ ${n}`); pass++; } else { console.log(`  ❌ ${n}${d ? ' — ' + d : ''}`); fail++; } }

async function run() {
  console.log('\n══ CERMAT odpočet ══');
  const srv = await startServer();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  const ctx = await browser.newContext();
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());

  // ── 1) budoucí termín (reálný cermat-date.json) → karta viditelná, 4 segmenty, odkaz, tik ──
  try {
    const pg = await ctx.newPage();
    const perr = []; pg.on('pageerror', e => perr.push(e.message));
    await pg.goto(URL, { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => { const c = document.getElementById('cermat-chip'); return c && c.style.display !== 'none'; }, { timeout: 6000 });
    const info = await pg.evaluate(() => {
      const c = document.getElementById('cermat-chip');
      return {
        tag: c.tagName, href: c.getAttribute('href'), target: c.getAttribute('target'),
        centered: getComputedStyle(c.parentElement).justifyContent,
        segs: ['cc-d', 'cc-h', 'cc-m', 'cc-s'].map(id => document.getElementById(id) ? document.getElementById(id).textContent : null),
        bigFont: parseFloat(getComputedStyle(document.querySelector('.cc-seg b')).fontSize),
        labels: [...document.querySelectorAll('.cc-seg i')].map(e => e.textContent.trim().toLowerCase()),
      };
    });
    ok('karta je odkaz <a>', info.tag === 'A');
    ok('odkaz míří na oficiální CERMAT', /cermat\.cz/.test(info.href || ''), info.href);
    ok('otevírá se v novém okně', info.target === '_blank');
    ok('banner je vycentrovaný', info.centered === 'center', info.centered);
    ok('má 4 segmenty (d/h/m/s) s čísly', info.segs.every(v => v !== null && /^\d+$/.test(v)), JSON.stringify(info.segs));
    ok('čísla jsou velkým písmem (≥28px)', info.bigFont >= 28, info.bigFont + 'px');
    ok('popisky: dny/hodiny/minuty/sekundy', info.labels.join(',') === 'dny,hodiny,minuty,sekundy', info.labels.join(','));

    const s1 = await pg.evaluate(() => document.getElementById('cc-s').textContent);
    await pg.waitForTimeout(1200);
    const s2 = await pg.evaluate(() => document.getElementById('cc-s').textContent);
    ok('sekundy tikají (mění se po ~1 s)', s1 !== s2, `${s1} → ${s2}`);
    ok('žádná JS chyba', perr.length === 0, perr.slice(0, 2).join(' | '));
    await pg.close();
  } catch (e) { ok('scénář budoucí termín', false, e.message); }

  // ── 2) termín v minulosti → karta skrytá ──
  try {
    const pg2 = await ctx.newPage();
    await pg2.route('**/cermat-date.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ next: { date: '2000-01-01', label: 'starý' } }) }));
    await pg2.goto(URL, { waitUntil: 'domcontentloaded' });
    await pg2.waitForTimeout(400);
    const hidden = await pg2.evaluate(() => { const c = document.getElementById('cermat-chip'); return c && c.style.display === 'none'; });
    ok('po termínu je karta skrytá', hidden === true);
    await pg2.close();
  } catch (e) { ok('scénář minulý termín', false, e.message); }

  await browser.close(); srv.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
}
run();
