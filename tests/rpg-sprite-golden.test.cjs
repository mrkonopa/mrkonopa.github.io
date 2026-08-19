/* ══════════════════════════════════════════════════════════════════════
   Otisky bojové scény (golden hash) — hlídají „nulovou vizuální změnu“
   při přenosu ročníků na sdílené jádro `rpg-sprite-core.js`.

   PROČ tenhle test vznikl. Při přenosu 6. ročníku prošly screenshoty pod
   reduced-motion jako naprosto shodné — a přesto v portu CHYBĚL iontový
   pohon parťákovy sondy (dva blikající čtverečky). Nešlo to poznat,
   protože pod reduced-motion se pohyblivá vrstva vůbec nekreslí. Kontrola
   jen jednoho režimu tedy dokáže mlčet o skutečné ztrátě obsahu.
   Druhá vada ze stejného přenosu: `paintAnim` odkazoval na proměnné,
   které v jeho rozsahu neexistovaly — pod reduced-motion se nikdy nespustil,
   takže ani ta se ze screenshotů nedala vidět.

   Proto se měří OBA režimy:
     • klid   — reduced-motion, pohyblivá vrstva vypnutá
     • pohyb  — zmrazený čas (pevná značka do requestAnimationFrame,
                pevné performance.now, seedovaný Math.random), takže
                animovaná scéna vyjde při každém běhu na chlup stejně

   Otisk se bere z `canvas.toDataURL()`, ne ze screenshotu stránky —
   screenshot skládá poloprůhledné plátno přes CSS pozadí a Skia u toho
   kolísá o ±2 v kanálu, což by test rozhoupalo. Čtení plátna je přesné.

   Spusť:  node tests/rpg-sprite-golden.test.cjs           (kontrola)
           node tests/rpg-sprite-golden.test.cjs --update   (přepis otisků)
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const GOLD = path.join(__dirname, 'fixtures', 'sprite-golden.json');
const PORT = 18917;
const GRADES = process.argv.filter(a => /^\d$/.test(a)).map(Number);
const ROCNIKY = GRADES.length ? GRADES : [3, 4, 5, 6, 7, 8, 9];
const OBLASTI = [1, 4, 7];
const UPDATE = process.argv.includes('--update');

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const srv = http.createServer((q, p) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const fp = path.normalize(path.join(ROOT, u));
  if (!fp.startsWith(ROOT)) { p.writeHead(403); return p.end(); }
  let b = null; try { b = fs.readFileSync(fp); } catch (e) {}
  if (b === null) { p.writeHead(404); return p.end(); }
  p.writeHead(200); p.end(b);
});

/* Zmrazení času a náhody. Bez toho se animovaná vrstva nedá porovnat
   a zůstala by neměřená — přesně tam se schovaly obě nalezené vady. */
const ZMRAZ = () => {
  const q = [];
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.__step = (n, t) => { for (let i = 0; i < n; i++) q.splice(0).forEach(f => { try { f(t); } catch (e) { window.__rafErr = String(e); } }); };
  performance.now = () => 5000; Date.now = () => 1700000000000;
  let s0 = 123456789; Math.random = () => { s0 = (s0 * 1664525 + 1013904223) >>> 0; return s0 / 4294967296; };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await br.newContext({ viewport: { width: 480, height: 800 } });
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());

  let zlate = {};
  try { zlate = JSON.parse(fs.readFileSync(GOLD, 'utf8')); } catch (e) {}
  const nove = UPDATE ? Object.assign({}, zlate) : null;

  console.log('\n── Otisky bojové scény ──\n');

  for (const g of ROCNIKY) {
    for (const rezim of ['klid', 'pohyb']) {
      const pg = await ctx.newPage();
      const chyby = [];
      pg.on('pageerror', e => chyby.push(e.message));
      await pg.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await pg.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
      await pg.evaluate(([anim, zmrazSrc]) => {
        localStorage.clear(); startGame('T'); S.tutorialDone = true;
        if (anim) (new Function(zmrazSrc))();
        else document.documentElement.classList.add('reduced-motion');
      }, [rezim === 'pohyb', '(' + ZMRAZ.toString() + ')()']);
      await pg.waitForTimeout(200);

      for (const aid of OBLASTI) {
        await pg.evaluate(a => { const ar = AREAS.find(x => x.id === a); launchBattle(a, ar.missions[0].id); }, aid);
        if (rezim === 'pohyb') await pg.evaluate(() => window.__step(40, 5000));
        else await pg.waitForTimeout(1200);
        const url = await pg.evaluate(() => {
          const cv = document.querySelector('#bt-top canvas');
          return cv ? cv.toDataURL() : null;
        });
        const klic = `g${g}.${rezim}.a${aid}`;
        if (!url) { ok(false, klic + ': plátno arény nenalezeno'); }
        else {
          const h = crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
          if (UPDATE) { nove[klic] = h; console.log('  · ' + klic + ' = ' + h); }
          else if (!zlate[klic]) ok(false, klic + ': otisk chybí (spusť s --update)');
          else ok(zlate[klic] === h, klic + ': scéna se nezměnila', `${zlate[klic]} → ${h}`);
        }
        await pg.evaluate(() => { try { exitBattle(); } catch (e) {} });
        await pg.waitForTimeout(120);
      }
      const rafErr = await pg.evaluate(() => window.__rafErr || null);
      ok(!rafErr, `g${g}/${rezim}: smyčka snímků nespadla`, rafErr || '');
      const skut = chyby.filter(e => !/ERR_|CERT_|net::|supabase|jsdelivr/i.test(e));
      ok(skut.length === 0, `g${g}/${rezim}: žádné JS chyby`, skut.join(' | '));
      await pg.close();
    }
  }

  if (UPDATE) {
    fs.mkdirSync(path.dirname(GOLD), { recursive: true });
    fs.writeFileSync(GOLD, JSON.stringify(nove, null, 2) + '\n');
    console.log('\n  Otisky zapsány do ' + path.relative(ROOT, GOLD) + '\n');
  } else {
    console.log(`\n  Otisky bojové scény: ${pass} ✅ / ${fail} ❌\n`);
  }
  await br.close(); srv.close();
  process.exit(!UPDATE && fail ? 1 : 0);
})();
