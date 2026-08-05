/* ══════════════════════════════════════════════════════════════════════
   Hloubka zásoby úloh na misi (všech 7 ročníků).

   Trénink je nekonečný a mistrovství se získává za 15 správných odpovědí,
   takže mise s malou zásobou začne žákovi opakovat tytéž příklady.

   Měřením se ukázalo, že banky NEJSOU tenké — ⌀ 1 200–2 000 unikátních
   úloh na misi — ale několik misí propadlo hluboko pod průměr:

       g6 5-1 Osová souměrnost …… 47 úloh
       g8 6-3 Osy a souměrnosti … 91 úloh

   Příčina nebyla velikost banky, ale TYP otázky: „kolik os souměrnosti
   má čtverec?" má konečně mnoho odpovědí, takže se generátor vyčerpá bez
   ohledu na to, kolik variant se dopíše. Řešením byly úlohy se
   souřadnicemi, jejichž zásoba roste s čísly.

   Práh je nastavený hluboko pod průměrem — má chytat propadliny, ne
   rozdíly mezi tématy. 90 opakování stačí: rozdíl mezi desítkami a
   stovkami je vidět dávno předtím, než se zásoba vyčerpá. (S 250
   opakováními běžel test přes 13 minut, což je na bránu moc.)

   Spusť: node tests/rpg-pool-depth.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18777;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OPAKOVANI = 90;
// Práh je zkalibrovaný na 90 opakování a na skutečná data: po opravě má
// nejchudší mise kolem 160 úloh, propadliny měly 47 a 94. Práh 140 tedy
// chytá kolaps typu otázky, ale nekřičí na témata, která jsou přirozeně
// méně variabilní. Vyšší práh by hlásil zdravé mise — a test, který
// křičí vlka, se přestane číst.
const PRAH = 140;
const GRADES = [3, 4, 5, 6, 7, 8, 9];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function serve() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json' };
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
  console.log('\n── Hloubka zásoby úloh (práh ' + PRAH + ') ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  const chude = [];
  let misiCelkem = 0, nejhorsi = null;
  try {
    for (const g of GRADES) {
      const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof startGame === 'function', { timeout: 8000 });
      const r = await page.evaluate((n) => {
        localStorage.clear(); startGame('T'); S.tutorialDone = true;
        const roc = SAVE_KEY.split('_')[2];
        const banka = window['RPG_TASK_EXTRA_' + roc] || {};
        const out = [];
        for (const ar of AREAS) for (const m of ar.missions) {
          const t = new Set();
          for (let i = 0; i < n; i++) {
            let pool = [];
            try { pool = m.tasks() || []; } catch (e) {}
            if (typeof banka[m.id] === 'function') { try { pool = pool.concat(banka[m.id]() || []); } catch (e) {} }
            pool.forEach(x => t.add(String(x.text || '')));
          }
          out.push({ id: m.id, n: t.size });
        }
        return out;
      }, OPAKOVANI);
      ok(errs.length === 0, `g${g} bez JS chyby`, errs[0] || '');
      ok(r.length === 21, `g${g} má 21 misí (${r.length})`);
      misiCelkem += r.length;
      for (const x of r) {
        if (!nejhorsi || x.n < nejhorsi.n) nejhorsi = { g, ...x };
        if (x.n < PRAH) chude.push('g' + g + ' ' + x.id + ' (' + x.n + ')');
      }
      await ctx.close();
    }
    // Pojistka proti prázdnému běhu: kdyby se změnil tvar dat, regulární
    // průchod by nenašel nic a test by tiše prošel naprázdno.
    ok(misiCelkem === GRADES.length * 21, `proměřeno všech ${GRADES.length * 21} misí (${misiCelkem})`);
    ok(chude.length === 0, `žádná mise nemá pod ${PRAH} unikátních úloh`,
      chude.slice(0, 6).join(' | '));
    if (nejhorsi) console.log(`     (nejchudší mise: g${nejhorsi.g} ${nejhorsi.id} — ${nejhorsi.n} úloh)`);
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Hloubka zásoby: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
