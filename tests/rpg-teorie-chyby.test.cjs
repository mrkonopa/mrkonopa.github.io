/* ═══════════════════════════════════════════════════════
   „Časté chyby“ v teorii se ukážou JEDNOU a za příklady.

   Řádek s blokem chyb stál ve 2. stupni (6.–9. ročník) uvnitř smyčky přes
   příklady, takže se blok opakoval u každého příkladu (2–3×, uprostřed
   výkladu) — od 26. 8. 2026 ve všech čtyřech hrách. Obsahový test teorie
   (`rpg-learn`) čte jen datové moduly, vykreslení nikdy neviděl; vada se
   našla až při měření obrazovky na velkém monitoru.

   Test teorii skutečně vykreslí (`startLearn`) ve všech 7 hrách pro každou
   misi a počítá bloky v DOM. Pojistka proti prázdnému běhu: počet
   vykreslených misí a to, že aspoň polovina má víc než jeden příklad
   (u mise s jediným příkladem by se opakování nepoznalo).

   Spusť: node tests/rpg-teorie-chyby.test.cjs
   ═══════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GRADES = [3, 4, 5, 6, 7, 8, 9];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', woff2: 'font/woff2', svg: 'image/svg+xml', json: 'application/json' };
const srv = http.createServer((q, p) => {
  const fp = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0])));
  if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end(); }
  p.writeHead(200, { 'Content-Type': mime[fp.split('.').pop()] || 'application/octet-stream' });
  p.end(fs.readFileSync(fp));
});

(async () => {
  console.log('\n── Teorie: „Časté chyby“ jednou, za příklady ──\n');
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let misi = 0, sViceNezJeden = 0, sChybami = 0;
  try {
    for (const g of GRADES) {
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      await page.goto(`${base}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof startGame === 'function', null, { timeout: 8000 });
      const r = await page.evaluate((g) => {
        localStorage.clear(); startGame('Testovací žák'); S.tutorialDone = true;
        const modul = window['RPG_LEARN_' + g] || {};
        const vady = []; let misi = 0, vice = 0, schyb = 0;
        for (const a of AREAS) for (const m of a.missions) {
          const L = modul[m.id]; if (!L) continue;
          startLearn(m.id);
          const root = document.getElementById('learn-content');
          const bloky = [...root.querySelectorAll('.learn-mistakes')];
          const pr = [...root.querySelectorAll('.learn-example')];
          const chce = (L.mistakes && L.mistakes.length) ? 1 : 0;
          misi++; if (pr.length > 1) vice++; if (chce) schyb++;
          if (bloky.length !== chce) vady.push(`${m.id}: bloků chyb ${bloky.length}, má být ${chce}`);
          // blok leží ZA posledním příkladem (jako v 1. stupni), ne mezi příklady
          if (bloky.length === 1 && pr.length) {
            const posl = pr[pr.length - 1];
            if (!(posl.compareDocumentPosition(bloky[0]) & Node.DOCUMENT_POSITION_FOLLOWING))
              vady.push(`${m.id}: blok chyb stojí před posledním příkladem`);
          }
          if (pr.length !== (L.examples || []).length) vady.push(`${m.id}: příkladů ${pr.length}, v datech ${(L.examples || []).length}`);
        }
        return { vady, misi, vice, schyb };
      }, g);
      misi += r.misi; sViceNezJeden += r.vice; sChybami += r.schyb;
      ok(r.misi >= 18, `g${g} vykresleno ${r.misi} teorií (čekáno ≥ 18)`);
      ok(r.vady.length === 0, `g${g} blok chyb je v každé teorii právě jednou (a za příklady)`,
        r.vady.slice(0, 4).join(' | ') + (r.vady.length > 4 ? ` … a dalších ${r.vady.length - 4}` : ''));
      await ctx.close();
    }
    ok(sViceNezJeden >= misi / 2, `aspoň polovina teorií má víc než jeden příklad (${sViceNezJeden}/${misi}) — jinak by se opakování nepoznalo`);
    ok(sChybami >= misi / 2, `aspoň polovina teorií má blok chyb (${sChybami}/${misi}) — jinak by test mlčel`);
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Teorie: ${pass} ✅ / ${fail} ❌ (${misi} misí)\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
