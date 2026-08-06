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
    /* Pozor: tohle pravidlo dřív znělo `labels === 'dny,hodiny,minuty,sekundy'`
       a svítilo zeleně nad špatnou češtinou — popisky byly natvrdo v HTML,
       takže odpočet hlásil „249 DNY" a „08 SEKUNDY". Test tu vadu ZAFIXOVAL
       místo aby ji odhalil. Správně se popisek skloňuje podle čísla nad ním,
       takže se kontroluje TVAR, ne konkrétní slovo. Přesné skloňování včetně
       hraničních čísel hlídá tests/prijimacky-countdown.test.cjs. */
    const TVARY = {
      d: ['den', 'dny', 'dní'], h: ['hodina', 'hodiny', 'hodin'],
      m: ['minuta', 'minuty', 'minut'], s: ['sekunda', 'sekundy', 'sekund'],
    };
    const klice = ['d', 'h', 'm', 's'];
    const spatne = info.labels.map((l, i) => TVARY[klice[i]].includes(l) ? null : klice[i] + ': ' + l).filter(Boolean);
    ok('popisky jsou platné české tvary jednotek', info.labels.length === 4 && spatne.length === 0,
      spatne.join(' | ') || info.labels.join(','));

    /* A především: popisek musí sedět k číslu, které nad ním stojí. Právě
       tuhle vazbu původní pravidlo nekontrolovalo vůbec. */
    const pary = await pg.evaluate(() => [...document.querySelectorAll('.cc-seg')]
      .map(s => [parseInt(s.querySelector('b').textContent, 10), s.querySelector('i').textContent.trim().toLowerCase()]));
    const sklOcek = (n, j, dva, pet) => {
      const a = Math.abs(n) % 100; if (a >= 11 && a <= 14) return pet;
      const b = a % 10; return b === 1 ? j : (b >= 2 && b <= 4 ? dva : pet);
    };
    const nesed = pary.map(([n, l], i) => {
      const t = TVARY[klice[i]]; return sklOcek(n, t[0], t[1], t[2]) === l ? null : n + ' ' + l;
    }).filter(Boolean);
    ok('popisek sedí k číslu nad sebou', pary.length === 4 && nesed.length === 0, nesed.join(' | '));

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
