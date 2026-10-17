/* ══════════════════════════════════════════════════════════════════════
   Snímky přijímaček pro posouzení OČIMA a pro porovnání světlého vzhledu
   před a po zavedení tmavého režimu (dev nástroj, mimo bránu — jmenuje se
   `shot-*`, viz výjimky v brana-uplnost).

   Proč: u vzhledu nestačí měřidla. Kontrast a přetečení se měří strojově, ale
   že je tmavá karta „škaredá" nebo že se světlý vzhled nezměnil o pixel, pozná
   jen snímek. Obsah je DETERMINISTICKÝ (seedovaný Math.random, pevné datum,
   vypnuté animace a přechody), takže dva běhy téhož kódu dají totéž — jinak by
   se rozdíl dvou běhů nedal číst („srovnej základ SÁM SE SEBOU", CLAUDE.md).

   Použití:
     node tests/shot-motiv.cjs out=<složka> [motiv=light|dark] [sirky=1000,360] [jen=doplnky,index] [vyrez=1500 od=0]
     node tests/shot-motiv.cjs porovnej=<složkaA>,<složkaB>
   Porovnání vypíše počet odlišných pixelů po souborech (Pillow).
   ══════════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { execFileSync } = require('child_process');
const arg = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')).filter(a => a.length === 2));

if (arg.porovnej) {
  // Bez závislostí: oba snímky se vykreslí do plátna v Chromiu a porovnají po pixelech.
  const { chromium: ch } = require('playwright');
  (async () => {
    const [A, B] = arg.porovnej.split(',');
    const b = await ch.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
    const page = await b.newPage(); let ruzne = 0;
    const soubory = [...new Set([...fs.readdirSync(A), ...fs.readdirSync(B)])].filter(f => f.endsWith('.png')).sort();
    for (const f of soubory) {
      const pa = path.join(A, f), pb = path.join(B, f);
      if (!fs.existsSync(pa) || !fs.existsSync(pb)) { console.log('CHYBÍ  ' + f); ruzne++; continue; }
      const r = await page.evaluate(async ([x, y]) => {
        const nacti = u => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = u; });
        const [ia, ib] = await Promise.all([nacti(x), nacti(y)]);
        if (ia.width !== ib.width || ia.height !== ib.height) return { rozmer: [ia.width, ia.height, ib.width, ib.height] };
        const data = i => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height).data; };
        const da = data(ia), db = data(ib); let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        for (let k = 0; k < da.length; k += 4) {
          if (da[k] !== db[k] || da[k + 1] !== db[k + 1] || da[k + 2] !== db[k + 2]) {
            n++; const px = (k / 4) % ia.width, py = Math.floor(k / 4 / ia.width);
            if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
          }
        }
        return { n, box: n ? [x0, y0, x1, y1] : null };
      }, ['data:image/png;base64,' + fs.readFileSync(pa).toString('base64'), 'data:image/png;base64,' + fs.readFileSync(pb).toString('base64')]);
      if (r.rozmer) { console.log('ROZMĚR ' + f + ' ' + r.rozmer.join(' ')); ruzne++; }
      else if (r.n) { console.log('RŮZNÉ  ' + f + '  ' + r.n + ' px  ' + r.box.join(',')); ruzne++; }
      else console.log('shodné ' + f);
    }
    await b.close();
    console.log('SOUBORŮ SE ROZDÍLEM: ' + ruzne + ' z ' + soubory.length);
    process.exit(0);
  })();
  return;
}

const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const PZ = require('./pz-pruchody.cjs');
const OUT = path.resolve(arg.out || path.join(process.env.TMPDIR || '/tmp', 'shot-motiv'));
const MOTIV = arg.motiv || 'light';
const SIRKY = (arg.sirky || '1000,360').split(',').map(Number);
fs.mkdirSync(OUT, { recursive: true });

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

/* Data pro index a statistiky: bez nich se vidí jen prázdný stav (sdílené v pz-pruchody.cjs). */
const SEED = PZ['pz-data'].pripravit;

/* Stavy: [soubor, stránka, krok v prohlížeči]. Kroky vracejí '' nebo důvod. */
const STAVY = [
  ['index-prazdny', 'index.html', null],
  ['index-data', 'index.html', 'seed'],
  ['test-brana', 'test.html', null],
  ['test-bezi', 'test.html', ['pz-test', 'běžící test']],
  ['test-rozbor', 'test.html', ['pz-test', 'rozbor']],
  ['procvic-vyber', 'procvicovani.html', null],
  ['procvic-uloha', 'procvicovani.html', () => { document.querySelectorAll('button.topic-card')[8].click(); }],
  ['procvic-reseni', 'procvicovani.html', () => { document.querySelectorAll('button.topic-card')[8].click(); grade(false); }],
  ['diag-uvod', 'diagnostika.html', null],
  ['diag-uloha', 'diagnostika.html', ['pz-diag', 'úloha 1']],
  ['diag-konec', 'diagnostika.html', ['pz-diag', 'konec']],
  ['konstrukce', 'konstrukce.html', null],
  ['konstrukce-hotovo', 'konstrukce.html', ['pz-konstr', 'osa']],
  ['statistiky-prazdne', 'statistiky.html', null],
  ['statistiky-data', 'statistiky.html', ['pz-stat', 's daty']],
  ['doplnky', 'doplnky.html', null],
];

(async () => {
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port + '/projects/prijimacky-matematika/';
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  let n = 0; const chyby = [];
  try {
    for (const w of SIRKY) {
      for (const [soubor, stranka, krok] of STAVY.filter(x => !arg.jen || arg.jen.split(',').some(j => x[0].startsWith(j)))) {
        const ctx = await browser.newContext({ viewport: { width: w, height: w > 600 ? 900 : 800 }, reducedMotion: 'reduce', isMobile: w < 600, hasTouch: w < 600 });
        await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
        const page = await ctx.newPage();
        await page.addInitScript(([motiv, seed]) => {
          let a = 123456789;
          Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
          const Orig = Date; const T0 = new Orig('2026-10-18T10:00:00Z').getTime();
          Date.now = () => T0; // pevné „teď": časomíra a data v textech se nehýbou
          if (motiv === 'dark') { try { localStorage.setItem('PZ_MOTIV', 'dark'); } catch (e) { /* bez úložiště zůstane světlý */ } }
          document.addEventListener('DOMContentLoaded', () => {
            const st = document.createElement('style'); st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
            document.head.appendChild(st);
          });
        }, [MOTIV, null]);
        try {
          await page.goto(base + stranka, { waitUntil: 'domcontentloaded', timeout: 25000 });
          if (stranka !== 'doplnky.html') await page.waitForFunction(() => window.PZ, null, { timeout: 8000 });   // doplňky jádro nenačítají
          if (krok === 'seed') { await page.evaluate(SEED); await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.PZ, null, { timeout: 8000 }); }
          else if (Array.isArray(krok)) {
            const P = PZ[krok[0]];
            if (krok[0] === 'pz-stat') await page.evaluate(P.pripravit);
            await page.waitForTimeout(400);
            if (krok[0] !== 'pz-stat') await page.evaluate(P.pripravit);
            const d = await page.evaluate(P.prepnout, krok[1]);
            if (d) throw new Error('průchod: ' + d);
          } else if (typeof krok === 'function') { await page.waitForTimeout(300); await page.evaluate(krok); }
          await page.waitForTimeout(500);
          await page.evaluate(() => window.scrollTo(0, 0));
          const vyrez = arg.vyrez ? { x: 0, y: +(arg.od || 0), width: w, height: +arg.vyrez } : null;       // jen horní část dlouhé stránky
          await page.screenshot({ path: path.join(OUT, soubor + '-' + w + '.png'), fullPage: true, ...(vyrez ? { clip: vyrez } : {}) });
          n++;
        } catch (e) { chyby.push(soubor + ' @' + w + ': ' + String(e.message).slice(0, 90)); }
        await ctx.close();
      }
    }
  } finally { await browser.close(); srv.close(); }
  console.log(`snímků: ${n} → ${OUT} (motiv ${MOTIV})`);
  chyby.forEach(c => console.log('❌ ' + c));
  process.exit(chyby.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
