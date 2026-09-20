/* ══════════════════════════════════════════════════════════════════════
   Přepínání fotek ve zvětšeném zobrazení (cestovatelské zápisky).

   Galerie jsou na stránkách zapojené ve TŘECH různých tvarech, jak
   jednotlivé zápisky postupně vznikaly:

     ukraine, cr-bh          `figure.shot > div.img` s background-image
     romania                 `.gallery a[href]`
     italy, yugoslavia, sf   `.gallery-grid img[src]`

   a dvě z nich (italy, yugoslavia) navíc **nemají `openLb` vůbec** —
   otevírají fotku přímo v obsluze kliknutí. První verze sdíleného modulu
   `openLb` přebírala, takže tam tiše nedělala nic: index zůstal -1 a
   první „další" vedlo zpátky na tutéž fotku. Ze zdrojáku to vypadalo
   správně, protože modul se načetl a nespadl.

   Proto se tady NEKONTROLUJE, že je modul na stránce, ale že se
   zobrazená fotka po kliknutí SKUTEČNĚ ZMĚNÍ — a to na každém z těch
   tří tvarů.

   Spusť: node tests/travels-galerie.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

/* Zápisky, které mají fotky. `baltic-2023` tu schválně NENÍ — zatím
   žádné nemá (je v něm jen místo pro ně), takže by se neměl co přepínat.
   Až fotky přibudou, přidej ho sem; prázdný seznam by byl horší než
   jmenovitá výjimka. */
const STRANKY = ['ukraine-2017', 'cr-bh-2018', 'romania-2019', 'italy-2022', 'yugoslavia-2020', 'spain-france-2021'];
const BEZ_FOTEK = ['baltic-2023'];

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

const ZKOUSKA = async () => {
  const spi = ms => new Promise(r => setTimeout(r, ms));
  const prvni = document.querySelector('.gallery .shot .img, .gallery a, .gallery-grid img');
  if (!prvni) return { chyba: 'na stránce není žádná položka galerie' };
  prvni.click(); await spi(150);

  const lb = document.getElementById('lb');
  const img = document.getElementById('lb-img');
  if (!lb || !img) return { chyba: 'stránka nemá prohlížeč fotky (#lb / #lb-img)' };
  if (!lb.classList.contains('open')) return { chyba: 'kliknutí na fotku prohlížeč neotevřelo' };

  const bp = document.getElementById('lb-prev'), bn = document.getElementById('lb-next');
  if (!bp || !bn) return { chyba: 'chybí tlačítka na přepínání' };

  const ram = img.getBoundingClientRect();
  const rn = bn.getBoundingClientRect(), rp = bp.getBoundingClientRect();

  const a0 = img.src;
  bn.click(); await spi(150); const a1 = img.src;
  bn.click(); await spi(150); const a2 = img.src;
  bp.click(); await spi(150); const a3 = img.src;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await spi(150); const a4 = img.src;

  /* dokola: z první fotky doleva se musí dostat na POSLEDNÍ, jinak
     se dá přepínání zaseknout na kraji */
  const pocitadlo = document.getElementById('lb-count');
  const textPredu = pocitadlo ? pocitadlo.textContent : '';
  while (img.src !== a0) { bp.click(); await spi(40); }   // zpět na začátek
  bp.click(); await spi(150);
  const dokola = pocitadlo ? pocitadlo.textContent : '';

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await spi(120);

  return {
    dalsi: a1 !== a0, dalsi2: a2 !== a1, zpet: a3 === a1, klavesa: a4 !== a3,
    // „další" musí být na PRAVÉ polovině fotky, „zpět" na levé
    pravaPulka: rn.left >= ram.left + ram.width / 2 - 2,
    levaPulka: rp.left <= ram.left + 2,
    pocitadlo: textPredu, dokola,
    zavreno: !lb.classList.contains('open'),
    jmenaTlacitek: !!(bp.getAttribute('aria-label') && bn.getAttribute('aria-label')),
  };
};

(async () => {
  console.log('\n── Přepínání fotek v galerii ──\n');
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  let promereno = 0;
  try {
    for (const s of STRANKY) {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      const chyby = [];
      page.on('pageerror', e => chyby.push(e.message));
      await page.goto(`${base}/travels/${s}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(900);
      const r = await page.evaluate(ZKOUSKA);

      if (r.chyba) { ok(false, `${s}: ${r.chyba}`); await ctx.close(); continue; }
      promereno++;
      ok(r.dalsi, `${s}: kliknutí na pravou polovinu přepne na další fotku`);
      ok(r.dalsi2, `${s}: přepíná se dál, ne jen jednou`);
      ok(r.zpet, `${s}: levá polovina vrátí na předchozí`);
      ok(r.klavesa, `${s}: šipka na klávesnici přepíná taky`);
      ok(r.pravaPulka, `${s}: „další" je na PRAVÉ polovině fotky`);
      ok(r.levaPulka, `${s}: „zpět" je na LEVÉ polovině fotky`);
      ok(/^\d+ \/ \d+$/.test(r.pocitadlo), `${s}: ukazuje pořadí fotky`, 'čtu: ' + JSON.stringify(r.pocitadlo));
      // z první doleva → poslední (dokola), ne zaseknutí na kraji
      const celkem = (r.pocitadlo.split('/')[1] || '').trim();
      ok(r.dokola === celkem + ' / ' + celkem, `${s}: z první fotky zpět vede na poslední (dokola)`, r.dokola);
      ok(r.zavreno, `${s}: Escape prohlížeč zavře`);
      ok(r.jmenaTlacitek, `${s}: tlačítka mají přístupné jméno`);
      ok(chyby.length === 0, `${s}: bez JS chyby`, chyby[0] || '');
      await ctx.close();
    }

    /* Zápisek bez fotek se nemá co přepínat — ale musí se aspoň načíst
       bez chyby, jinak by se rozbitý modul schoval za „nic tu není". */
    for (const s of BEZ_FOTEK) {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      const chyby = [];
      page.on('pageerror', e => chyby.push(e.message));
      await page.goto(`${base}/travels/${s}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);
      ok(chyby.length === 0, `${s} (zatím bez fotek): načte se bez JS chyby`, chyby[0] || '');
      await ctx.close();
    }
  } finally { await browser.close(); srv.close(); }

  // pojistka proti „test doběhl a nic neproměřil"
  ok(promereno === STRANKY.length, `proměřeno všech ${STRANKY.length} zápisků s fotkami`, 'proměřeno: ' + promereno);

  console.log(`\n  Galerie: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
