/* ══════════════════════════════════════════════════════════════════════
   Úvodní obrazovka únikovek — rozestupy karet.

   Osm únikovek je osm KOPIÍ téhož rozvržení a tenhle repozitář na to
   opakovaně doplácí vždycky stejně: **sedm z osmi něco má a jedna ne.**
   Už se to stalo u dotykových ploch (`@media (pointer: coarse)` chyběl
   jen Pythagorovi) a teď u rozestupu: `#intro-content` je pružný sloupec
   s `gap:18px`, jenže Pythagoras ten řádek neměl vůbec, takže se úvodní
   karta a karta s pravidly **dotýkaly**. Vojta to nahlásil z obrazovky.

   Ze zdrojáku by to šlo hlídat taky, ale slabě: pravidlo se dá zapsat
   jinak (margin, padding rodiče) a kontrola „obsahuje řetězec" by pak
   křičela vlka. Proto se měří VYKRESLENÝ rozestup mezi sousedními
   kartami — a navíc se porovnává mezi ročníky, protože osm kopií se má
   chovat stejně.

   Spusť: node tests/unikovky-uvod.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const UNIKOVKY = ['linearni_funkce', 'mocniny', 'procenta', 'pythagoras', 'rovnice', 'statistika', 'telesa', 'trojuhelniky'];

/* Naměřeno na sedmi zdravých únikovkách: 18 px. Podlaha je 8 px, aby
   test nespadl na drobné změně návrhu — vada, kterou má chytit, dává
   0 px (karty na sobě). */
const PODLAHA = 8;

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

const ZMER = () => {
  const host = document.getElementById('intro-content');
  if (!host) return { chyba: 'na stránce není #intro-content' };
  const deti = [...host.children].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  if (deti.length < 3) return { chyba: 'úvodní obrazovka má jen ' + deti.length + ' viditelných bloků' };
  const mezery = [];
  for (let i = 1; i < deti.length; i++) {
    const a = deti[i - 1].getBoundingClientRect(), b = deti[i].getBoundingClientRect();
    mezery.push({
      mezi: (deti[i - 1].className || deti[i - 1].tagName) + ' → ' + (deti[i].className || deti[i].tagName),
      px: Math.round((b.top - (a.top + a.height)) * 10) / 10,
    });
  }
  return { mezery, bloku: deti.length };
};

(async () => {
  console.log('\n── Únikovky: rozestupy na úvodní obrazovce ──\n');
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const nejmensi = {};
  let promereno = 0;
  try {
    for (const u of UNIKOVKY) {
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      await page.goto(`${base}/projects/unikovka_${u}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);
      const r = await page.evaluate(ZMER);
      if (r.chyba) { ok(false, `${u}: ${r.chyba}`); await ctx.close(); continue; }
      promereno++;
      const min = Math.min(...r.mezery.map(m => m.px));
      nejmensi[u] = min;
      const viník = r.mezery.find(m => m.px < PODLAHA);
      ok(min >= PODLAHA, `${u}: karty na úvodu mají rozestup (nejmenší ${min} px)`,
        viník ? `${viník.mezi} = ${viník.px} px` : '');
      await ctx.close();
    }

    /* Osm kopií téhož rozvržení se má chovat stejně. Kdyby se někde
       rozestup „opravil" jinou hodnotou, tohle to ukáže dřív, než si
       toho někdo všimne z obrazovky. */
    const hodnoty = [...new Set(Object.values(nejmensi))];
    ok(hodnoty.length === 1,
      'všech osm únikovek má stejný rozestup (osm kopií téhož rozvržení)',
      JSON.stringify(nejmensi));

    ok(promereno === UNIKOVKY.length, `proměřeno všech ${UNIKOVKY.length} únikovek`, 'proměřeno: ' + promereno);
  } finally { await browser.close(); srv.close(); }

  console.log(`\n  naměřené rozestupy: ${JSON.stringify(nejmensi)}`);
  console.log(`\n  Úvod únikovek: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
