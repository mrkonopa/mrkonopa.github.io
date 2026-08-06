/* ══════════════════════════════════════════════════════════════════════
   Odpočet do přijímaček na hubu (projects/prijimacky-matematika/).

   Dvě vady, které našlo až měření skutečných rámečků v prohlížeči:

     1. Popisky pod čísly byly natvrdo v HTML („DNY", „SEKUNDY"), takže
        odpočet hlásil „249 DNY" a „08 SEKUNDY". Česky se to skloňuje
        podle čísla nad tím: 1 den · 2–4 dny · 5+ dní (a 11–14 jde vždy
        do genitivu, i když končí jedničkou).

     2. Pod 480 px měly segmenty `flex:1`, tedy čtyři stejné díly. Dny
        mají ale tři číslice a ostatní jen dvě — tříciferné číslo se do
        svého dílu nevešlo a přetékalo ven.

   Test proto kontroluje obojí naráz: skloňování na hraničních číslech
   a to, že se při tříciferném počtu dní nic neořízne ani nevyleze ze
   svého segmentu — na širokém i úzkém okně.

   Spusť: node tests/prijimacky-countdown.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 19002;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SIRKY = [1100, 480, 380, 320];

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

/* Očekávané tvary. 11–14 je schválně uvnitř — právě tam padá naivní
   „poslední číslice" pravidlo (11 končí jedničkou, ale je jich „jedenáct
   dní", ne „jedenáct den"). */
const SKLONY = [
  [0, 'dní'], [1, 'den'], [2, 'dny'], [4, 'dny'], [5, 'dní'],
  [11, 'dní'], [12, 'dní'], [14, 'dní'], [21, 'den'], [22, 'dny'],
  [25, 'dní'], [101, 'den'], [111, 'dní'], [249, 'dní'],
];

(async () => {
  console.log('\n── Odpočet do přijímaček ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let mereni = 0;
  try {
    /* ── 1. skloňování ────────────────────────────────────────────── */
    {
      const ctx = await browser.newContext({ viewport: { width: 900, height: 800 } });
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}/projects/prijimacky-matematika/index.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__CC_TEST, { timeout: 8000 });

      const spatne = await page.evaluate((vzorky) =>
        vzorky.filter(([n, ocek]) => window.__CC_TEST.skl(n, 'den', 'dny', 'dní') !== ocek)
              .map(([n, ocek]) => n + ' → ' + window.__CC_TEST.skl(n, 'den', 'dny', 'dní') + ' (má být ' + ocek + ')'),
        SKLONY);
      ok(spatne.length === 0, `skloňování dní sedí na ${SKLONY.length} hraničních číslech`, spatne.join(' | '));

      // Popisky se opravdu propíšou do stránky, ne že jen funkce vrací správně.
      const stitky = await page.evaluate(() => {
        window.__CC_TEST.init(new Date(Date.now() + 249 * 864e5 + 16 * 36e5 + 61e3), 'test');
        return [...document.querySelectorAll('.cermat-countdown .cc-seg')]
          .map(s => s.querySelector('b').textContent + ' ' + s.querySelector('i').textContent);
      });
      ok(/^249 dní$/.test(stitky[0]), 'popisek dní se propsal do stránky', stitky.join(' · '));
      ok(stitky.every(x => !/\d+ (dny|hodiny|minuty|sekundy)$/.test(x) || /^(2|3|4|\d*[2-4])\s/.test(x)),
        'žádný popisek nemá tvar „249 dny"', stitky.join(' · '));
      await ctx.close();
    }

    /* ── 2. tříciferné dny se vejdou ──────────────────────────────── */
    for (const w of SIRKY) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}/projects/prijimacky-matematika/index.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__CC_TEST, { timeout: 8000 });
      const r = await page.evaluate(() => {
        // 249 dní = nejdelší reálný stav (odpočet běží necelý rok).
        window.__CC_TEST.init(new Date(Date.now() + 249 * 864e5 + 16 * 36e5 + 61e3), 'test');
        const hod = document.querySelector('.cermat-countdown');
        const hb = hod.getBoundingClientRect();
        const segy = [...hod.querySelectorAll('.cc-seg')];
        const zle = [];
        for (const s of segy) {
          const sb = s.getBoundingClientRect();
          if (s.scrollWidth > s.clientWidth + 1) zle.push(s.textContent.trim() + ' ořez');
          if (sb.right > hb.right + 1 || sb.left < hb.left - 1) zle.push(s.textContent.trim() + ' mimo rámeček');
          for (const ch of s.children) {
            const cb = ch.getBoundingClientRect();
            if (cb.right > sb.right + 1 || cb.left < sb.left - 1) zle.push(ch.textContent.trim() + ' mimo segment');
          }
        }
        return { pocet: segy.length, zle };
      });
      mereni++;
      ok(r.pocet === 4, `@${w} odpočet má 4 segmenty (${r.pocet})`);
      ok(r.zle.length === 0, `@${w} nic se neořízne ani nevyleze ze svého místa`, r.zle.join(' | '));
      await ctx.close();
    }
    // Pojistka proti prázdnému běhu.
    ok(mereni === SIRKY.length, `proměřeny všechny ${SIRKY.length} šířky (${mereni})`);
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Odpočet: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
