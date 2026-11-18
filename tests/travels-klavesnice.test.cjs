/* ══════════════════════════════════════════════════════════════════════
   Fotky v cestovatelských zápiscích: klávesnice a čtečka obrazovky.

   Naměřeno 18. 11. 2026 (skutečný Tab a Enter, 8 zápisků): fotky měly
   obsluhu jen na kliknutí myší. `<img>` ani `div.img` nejdou fokusovat,
   takže 1 451 fotek v sedmi zápiscích (všechny kromě Rumunska, kde je
   obaluje odkaz) nešlo otevřít klávesnicí ani čtečkou a 1 055 fotek ve
   čtyřech zápiscích nemělo žádné jméno. Žádná brána to nehlídala:
   a11y audit měří stránku, ne cestu „Tab → Enter → šipka → Esc".

   Test ovládá stránku tak, jak to dělá člověk bez myši — SKUTEČNÝMI
   klávesami (`page.keyboard`), ne voláním funkce, a hlídá:
     · každá fotka je dostupná klávesnicí a má jméno,
     · Enter (i mezerník) otevře prohlížeč, fokus se přesune dovnitř,
     · šipka přepne fotku, Tab se v dialogu točí a nevyjde ven,
     · Escape zavře prohlížeč a fokus se vrátí na fotku, ze které se šlo,
     · fotky jsou seskupené podle dne (skupina s jménem).
   Rumunsko (odkazy) projde stejnými kontrolami, jen jeho fotky jsou
   `<a>`, ne tlačítka.

   Spusť: node tests/travels-klavesnice.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };

/* Seznam zápisků ze SDÍLENÉHO `stranky.cjs` (ruční kopie by se rozešla). */
const ZAPISKY = require('./stranky.cjs').STRANKY
  .filter(p => p.id.startsWith('t-')).map(p => p.id.slice(2));

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { c ? pass++ : (fail++, console.log('  ❌ ' + m + (d ? ' — ' + d : ''))); };

function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const f = path.normalize(path.join(ROOT, u));
      if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(0, () => res(s));
  });
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  try {
    for (const z of ZAPISKY) {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      const chyby = [];
      page.on('pageerror', e => chyby.push(String(e.message || e).slice(0, 120)));
      await page.goto(base + '/travels/' + z + '.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.getElementById('lb-prev') !== null, null, { timeout: 8000 }).catch(() => {});

      // ── 1) každá fotka je dostupná klávesnicí a má jméno ───────────────
      const stav = await page.evaluate(() => {
        const poz = [...document.querySelectorAll('.gallery .shot .img, .gallery a, .gallery-grid img, .gallery-grid a')]
          .filter(e => !(e.tagName === 'IMG' && e.closest('.shot, a')));
        const jmeno = e => (e.getAttribute('aria-label') || '').trim() || (e.tagName === 'IMG' ? (e.alt || '').trim() : '');
        const skup = [...document.querySelectorAll('.gallery, .gallery-grid')];
        const sNadpisem = skup.filter(g => {
          for (let s = g.previousElementSibling; s; s = s.previousElementSibling) {
            if (s.classList.contains('day-heading')) return true;
            if (s.classList.contains('gallery') || s.classList.contains('gallery-grid')) return false;
          }
          return false;
        });
        return {
          fotek: poz.length,
          fokusovatelnych: poz.filter(e => e.tabIndex >= 0).length,
          tlacitekNeboOdkazu: poz.filter(e => e.tagName === 'A' || e.getAttribute('role') === 'button').length,
          bezJmena: poz.filter(e => !jmeno(e)).length,
          skupin: skup.length, sNadpisem: sNadpisem.length,
          skupinSJmenem: skup.filter(g => g.getAttribute('role') === 'group' && (g.getAttribute('aria-label') || '').trim()).length,
        };
      });
      ok(stav.fotek >= 20, `${z}: na stránce je galerie (${stav.fotek} fotek)`);
      ok(stav.fokusovatelnych === stav.fotek, `${z}: každá fotka jde fokusovat klávesnicí`, `${stav.fokusovatelnych} z ${stav.fotek}`);
      ok(stav.tlacitekNeboOdkazu === stav.fotek, `${z}: každá fotka je tlačítko nebo odkaz (čtečka ji ohlásí jako ovladač)`, `${stav.tlacitekNeboOdkazu} z ${stav.fotek}`);
      ok(stav.bezJmena === 0, `${z}: každá fotka má jméno pro čtečku`, `${stav.bezJmena} bez jména`);
      ok(stav.sNadpisem > 0 && stav.skupinSJmenem === stav.sNadpisem, `${z}: galerie pod nadpisem dne jsou skupina s jménem`, `${stav.skupinSJmenem} z ${stav.sNadpisem}`);

      // ── 2) skutečný Tab a Enter: prohlížeč se otevře, fokus dovnitř ─────
      const idPrvni = await page.evaluate(() => {
        const p = [...document.querySelectorAll('.gallery .shot .img, .gallery a, .gallery-grid img')]
          .find(e => !(e.tagName === 'IMG' && e.closest('.shot, a')));
        p.setAttribute('data-test-prvni', '1');
        return p.tagName;
      });
      // Tab od začátku stránky až na první fotku (stránka má nad galerií jen pár odkazů)
      let dosazeno = false;
      for (let i = 0; i < 80 && !dosazeno; i++) {
        await page.keyboard.press('Tab');
        dosazeno = await page.evaluate(() => !!document.activeElement && document.activeElement.hasAttribute('data-test-prvni'));
      }
      ok(dosazeno, `${z}: Tab dojde na první fotku (${idPrvni}) do 80 stisků`);
      if (!dosazeno) { await ctx.close(); continue; }

      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.getElementById('lb').classList.contains('open'), null, { timeout: 3000 }).catch(() => {});
      const otevreno = await page.evaluate(() => document.getElementById('lb').classList.contains('open'));
      ok(otevreno, `${z}: Enter na fotce otevře prohlížeč`);
      if (!otevreno) { await ctx.close(); continue; }
      await page.waitForTimeout(150);
      const uvnitr = await page.evaluate(() => {
        const lb = document.getElementById('lb'), a = document.activeElement;
        return { dialog: lb.getAttribute('role') === 'dialog' && lb.getAttribute('aria-modal') === 'true' && !!lb.getAttribute('aria-label'),
                 fokusUvnitr: !!a && lb.contains(a) };
      });
      ok(uvnitr.dialog, `${z}: prohlížeč je dialog (role, aria-modal, jméno)`);
      ok(uvnitr.fokusUvnitr, `${z}: po otevření je fokus uvnitř dialogu`);

      // ── 3) šipka přepne fotku, nadpis fotky se čtečce změní ─────────────
      const src0 = await page.evaluate(() => document.getElementById('lb-img').getAttribute('src'));
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(s => document.getElementById('lb-img').getAttribute('src') !== s, src0, { timeout: 3000 }).catch(() => {});
      const src1 = await page.evaluate(() => document.getElementById('lb-img').getAttribute('src'));
      ok(src1 && src1 !== src0, `${z}: šipka vpravo přepne fotku`);
      const alt = await page.evaluate(() => document.getElementById('lb-img').alt);
      ok(alt.trim().length > 3, `${z}: zvětšená fotka má popis pro čtečku`, JSON.stringify(alt));

      // ── 4) Tab se v dialogu točí a nevyjde ven (4× dopředu, 4× zpět) ────
      let venku = false;
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab');
        if (!(await page.evaluate(() => document.getElementById('lb').contains(document.activeElement)))) venku = true;
      }
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Shift+Tab');
        if (!(await page.evaluate(() => document.getElementById('lb').contains(document.activeElement)))) venku = true;
      }
      ok(!venku, `${z}: Tab a Shift+Tab zůstávají v dialogu`);

      // ── 5) Escape zavře a fokus se vrátí na fotku, ze které se šlo ──────
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('lb').classList.contains('open'), null, { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(100);
      const zavreno = await page.evaluate(() => ({
        zavreno: !document.getElementById('lb').classList.contains('open'),
        zpet: !!document.activeElement && document.activeElement.hasAttribute('data-test-prvni'),
      }));
      ok(zavreno.zavreno, `${z}: Escape prohlížeč zavře`);
      ok(zavreno.zpet, `${z}: po zavření je fokus zpátky na první fotce`);

      // ── 6) mezerník otevírá taky (tlačítko se chová jako tlačítko) ──────
      await page.keyboard.press('Space');
      await page.waitForFunction(() => document.getElementById('lb').classList.contains('open'), null, { timeout: 3000 }).catch(() => {});
      ok(await page.evaluate(() => document.getElementById('lb').classList.contains('open')), `${z}: mezerník na fotce otevře prohlížeč`);
      await page.keyboard.press('Escape');

      ok(chyby.length === 0, `${z}: bez JS chyb`, chyby.join(' | '));
      await ctx.close();
    }
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Klávesnice a čtečka v cestách: ${pass} ✅ / ${fail} ❌ (${ZAPISKY.length} zápisků)\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
