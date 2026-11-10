/* ═══════════════════════════════════════════════════════════════════════════
   Hub: jméno v globálním profilu se nesmí dotýkat rámu avatara (Vojtův snímek 9. 11. 2026: „jméno je malé a divně
   odsazené, zasahuje do rámu“).

   Rám z obchodu je plátno `.kos-frame`, které vyčnívá z avatara o b × 2 px (nejširší rám b = 6 → 12 px) a k tomu září.
   Mezera mezi avatarem a jménem byla 13 px, takže rám končil 2 px před jménem a nahoře se dotýkal okraje panelu.

   Měří se SKUTEČNÉ rámečky ve vykreslené stránce, pro všech 7 rámů × 3 šířky (1100, 820, 390 px):
     1. jméno začíná aspoň 12 px za pravým okrajem rámu a rám nepřekrývá žádný jeho znak
     2. rám leží celý uvnitř panelu profilu (aspoň 8 px od okraje)
     3. jméno je čitelné: ≥ 22 px a svisle ve výšce avatara (ne pod jeho dolním okrajem)
     4. řádek s jménem a podtitulkem je k avataru vystředěný (rozdíl středů ≤ 24 px)
   Sabotáž: stránka bez nových pravidel (`.gp-av` bez okraje, jméno 18 px) musí spadnout.
   Spusť: node tests/hub-profil-jmeno.test.cjs
   ═══════════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const RAMY = ['border-silver', 'border-cyan', 'border-gold', 'border-holo', 'border-wreath', 'border-anchor', 'border-dragon'];
const SIRKY = [[1100, 700], [820, 900], [390, 800]];

function server(prepis) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); }
    let telo = fs.readFileSync(fp), pr = null;
    for (const [k, f] of Object.entries(prepis || {})) if (k === path.basename(fp)) pr = f;
    if (pr) telo = Buffer.from(pr(telo.toString('utf8')));
    r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream' });
    r.end(telo);
  });
  return new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv)));
}

/* běží ve stránce: rámečky v celých pixelech */
const MERENI = `(() => {
  const box = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
  const nm = document.getElementById('gp-name');
  return { panel: box(document.getElementById('gprofile')), av: box(document.getElementById('gp-av')),
    frame: box(document.querySelector('#gp-av canvas.kos-frame')), name: box(nm), sub: box(document.getElementById('who-where')),
    fs: parseFloat(getComputedStyle(nm).fontSize) };
})()`;

async function mereni(browser, url, ram, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForFunction(() => typeof RPGWallet !== 'undefined' && typeof RPGKosmetika !== 'undefined', null, { timeout: 8000 });
  await page.evaluate((id) => { RPGWallet.earn(99999); RPGWallet.buy(id); RPGWallet.activate(id); }, ram);
  await page.waitForFunction(() => !!document.querySelector('#gp-av canvas.kos-frame'), null, { timeout: 5000 });
  const m = await page.evaluate(MERENI);
  await ctx.close();
  return m;
}

async function behy(prepis, nazev) {
  const srv = await server(prepis);
  const url = 'http://127.0.0.1:' + srv.address().port + '/projects/rpg-matematika.html';
  const browser = await chromium.launch();
  const f0 = fail; let mereno = 0;
  try {
    for (const ram of RAMY) for (const [w, h] of SIRKY) {
      const m = await mereni(browser, url, ram, w, h); mereno++;
      const kde = nazev + ' ' + ram + ' ' + w + ' px';
      if (!m.frame || !m.name || !m.panel || !m.av) { ok(false, kde + ': chybí prvek', JSON.stringify(m)); continue; }
      ok(m.name.l - m.frame.r >= 12, kde + ': jméno je aspoň 12 px za rámem', 'mezera ' + (m.name.l - m.frame.r).toFixed(1) + ' px');
      ok(m.frame.l >= m.panel.l + 8 && m.frame.t >= m.panel.t + 8 && m.frame.b <= m.panel.b - 8,
        kde + ': rám je aspoň 8 px od okraje panelu', 'vlevo ' + (m.frame.l - m.panel.l).toFixed(1) + ', nahoře ' + (m.frame.t - m.panel.t).toFixed(1));
      ok(m.fs >= 22, kde + ': jméno má aspoň 22 px', m.fs + ' px');
      const stredAv = (m.av.t + m.av.b) / 2, stredTxt = (m.name.t + m.sub.b) / 2;
      ok(Math.abs(stredAv - stredTxt) <= 24, kde + ': jméno s podtitulkem je k avataru vystředěné', 'rozdíl ' + Math.abs(stredAv - stredTxt).toFixed(1) + ' px');
    }
  } finally { await browser.close(); srv.close(); }
  return { mereno, nalezy: fail - f0 };
}

(async () => {
  const skutecny = await behy(null, 'skutečné');
  ok(skutecny.mereno === RAMY.length * SIRKY.length, 'změřeno všech ' + RAMY.length * SIRKY.length + ' kombinací', 'změřeno ' + skutecny.mereno);
  const f1 = fail;

  /* sabotáž: bez nových pravidel (stará mezera, malé jméno, zarovnání dolů) musí test najít vadu */
  const zpet = (s) => {
    const o = s.replace(/;margin:12px 14px 12px 12px\}/, '}').replace('font-size:24px;line-height:1.15', 'font-size:18px')
      .replace('.gp-id{display:flex;align-items:center', '.gp-id{display:flex;align-items:flex-end');
    if (o === s) throw new Error('sabotáž se neaplikovala');
    return o;
  };
  const sab = await behy({ 'rpg-matematika.html': zpet }, 'sabotáž');
  const chyceno = fail - f1;
  fail = f1;                       /* nálezy sabotovaného běhu nejsou vada produktu */
  ok(chyceno > 0, 'sabotáž (stará mezera a malé jméno) je chycena', 'nalezeno ' + chyceno + ' vad');
  console.log((fail ? '❌ ' : '✅ ') + 'hub-profil-jmeno: ' + pass + ' ok, ' + fail + ' chyb (sabotáž našla ' + chyceno + ' vad v ' + sab.mereno + ' měřeních)');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
