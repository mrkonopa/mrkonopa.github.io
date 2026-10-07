/* rpg-explain.test.cjs — pole „Jak jsi na to přišel?“ je z boje PRYČ (všech 7 her).

   Vojtův lístek 7. 10. 2026: „Dát pryč ‚jak jsi na to přišel‘! Vysvětlení to brzdí.“
   Pole se po správné odpovědi vklínilo mezi hlášku a tlačítko DÁLE, na tabletu
   odsouvalo DÁLE níž a ťuknutí do něj otevíralo klávesnici. Test hlídá, že:
     1) pole ani jeho popisek ve hře nejsou (ani skryté),
     2) po správné textové odpovědi se v boji neobjeví žádné textové pole,
     3) DÁLE nic neposílá do cloudu (saveExplanation se nevolá) a boj pokračuje,
     4) konzole dál ukáže STARŠÍ vysvětlení (záložka i API zůstávají). */
const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const BROWSER_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { rep.writeHead(404); return rep.end('nf'); }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(rep);
    });
    srv.listen(0, () => res(srv));
  });
}

// cloud bez přihlášení + špeh na saveExplanation (nesmí se zavolat)
const MOCK_CLOUD = `
window.__explainCalls = 0;
window.RPGCloud = {
  configured: () => false, init: async () => false, currentUser: () => null, onChange: () => {},
  pull: async () => null, push: () => {}, leaderboard: async () => [], renderLeaderboardInto: async () => {},
  pullMyNotes: async () => [],
  saveExplanation: async () => { window.__explainCalls++; return true; },
  listExplanations: async () => [],
};`;

(async () => {
  console.log('\n── Pole „Jak jsi na to přišel?“ je z boje pryč ──\n');
  // statika: hry pole nemají, konzole si nechává starší záznamy
  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const h = fs.readFileSync(path.join(ROOT, 'projects/rpg-mat-' + g + '.html'), 'utf8');
    ok(`g${g}: ve zdroji není pole ani ukládání vysvětlení`, !/bt-explain|Jak jsi na to přišel|saveExplanation/.test(h));
  }
  const konzole = fs.readFileSync(path.join(ROOT, 'projects/rpg-ucitel.html'), 'utf8');
  ok('konzole: záložka VYSVĚTLENÍ zůstává (starší záznamy) a říká, že sběr je vypnutý',
    /data-tab="explain"/.test(konzole) && /listExplanations/.test(konzole) && /vypnut/.test(konzole));

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: BROWSER_PATH, headless: true });
  const errs = [];
  try {
    for (const g of [3, 4, 5, 6, 7, 8, 9]) {
      const page = await browser.newPage();
      page.setDefaultTimeout(10000);
      await page.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
      page.on('pageerror', e => errs.push('g' + g + ': ' + String(e.message).slice(0, 120)));
      await page.addInitScript(MOCK_CLOUD);
      await page.goto(`${base}/projects/rpg-mat-${g}.html`, { waitUntil: 'load' });
      await page.fill('#ni', 'TESTER');
      await page.evaluate(() => { startGame(); S.tutorialDone = true; });
      // první textová mise, čisté textové kolo (bez minihry a ANO/NE)
      const mid = await page.evaluate(() => {
        for (const ar of AREAS) for (const m of ar.missions) if (!m.mc) {
          launchBattle(ar.id, m.id);
          const i = BT.tasks.findIndex(t => !isYN(t) && t.text); if (i < 0) continue;
          if (BT.mini) BT.mini[i] = null; BT.idx = i; renderTask(); return m.id;
        }
        return null;
      });
      await page.waitForFunction(() => !document.getElementById('bt-ans').disabled, null, { timeout: 5000 });
      const pred = await page.evaluate(() => ({ idx: BT.idx, pole: !!document.querySelector('#bt-explain, #bt-explain-txt, #s-battle textarea') }));
      await page.evaluate(() => { document.getElementById('bt-ans').value = String(BT.curTask.ans); submitAnswer(); });
      await page.waitForTimeout(150);
      const po = await page.evaluate(() => ({
        textarea: [...document.querySelectorAll('#s-battle textarea')].filter(t => getComputedStyle(t).display !== 'none').length,
        text: /Jak jsi na to přišel/.test(document.getElementById('s-battle').textContent),
        dale: getComputedStyle(document.getElementById('next-btn')).display !== 'none' || document.getElementById('attack-btn').textContent.includes('DÁLE'),
      }));
      await page.evaluate(() => nextTask());
      await page.waitForTimeout(150);
      const dal = await page.evaluate(i => ({ posun: BT.idx !== i || !document.querySelector('#s-battle.active'), volani: window.__explainCalls }), pred.idx);
      ok(`g${g} (${mid}): po správné odpovědi žádné pole, DÁLE je, další úloha bez odesílání vysvětlení`,
        !pred.pole && po.textarea === 0 && !po.text && po.dale && dal.posun && dal.volani === 0,
        JSON.stringify({ pred: pred.pole, po, dal }));
      await page.close();
    }
  } finally { await browser.close(); server.close(); }
  ok('žádné JS chyby', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
