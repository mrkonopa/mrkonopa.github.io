/* Screenshoty sprite enginu 6/7/8 — boj v různých oblastech + poškozený boss.
   Spusť: node tests/sprite-screenshots.cjs  → /tmp/sprites/*.png */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = '/tmp/sprites';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { rep.writeHead(404); return rep.end('nf'); }
      rep.writeHead(200, {'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream'});
      fs.createReadStream(fp).pipe(rep);
    });
    srv.listen(0, () => res(srv));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC });

  for (const game of [6, 8]) {
    const ctx = await browser.newContext({ viewport: { width: 480, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/projects/rpg-mat-${game}.html`, { waitUntil: 'load' });
    await page.waitForSelector('#ni', { timeout: 8000 });
    await page.fill('#ni', 'Test');
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 8000 });

    for (const aid of [1, 4, 7]) {
      // odemkni oblast + spusť 1. misi
      await page.evaluate((aid) => {
        for (let a = 1; a <= aid; a++) { /* unlock chain */ }
        const ar = AREAS.find(a => a.id === aid);
        launchBattle(aid, ar.missions[0].id);
      }, aid);
      await page.waitForFunction(() => document.querySelector('#s-battle')?.classList.contains('active'), { timeout: 6000 });
      await sleep(900); // doběhne enter animace
      await page.screenshot({ path: `${OUT}/g${game}-a${aid}-fresh.png` });

      // simuluj poškození bosse (75 %)
      await page.evaluate((game) => {
        const E = window['RPGSprites' + game];
        if (E && E.setProgress) E.setProgress(0.78);
      }, game);
      await sleep(700);
      await page.screenshot({ path: `${OUT}/g${game}-a${aid}-damaged.png` });

      // útok hrdiny
      await page.evaluate((game) => {
        const E = window['RPGSprites' + game];
        if (E && E.heroAttack) E.heroAttack();
      }, game);
      await sleep(350);
      await page.screenshot({ path: `${OUT}/g${game}-a${aid}-attack.png` });

      await page.evaluate(() => go('map'));
      await sleep(200);
    }
    await ctx.close();
    console.log(`✓ grade ${game}`);
  }

  await browser.close();
  srv.close();
  console.log('Hotovo → ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
