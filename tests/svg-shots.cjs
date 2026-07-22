/* Vizuální kontrola SVG helperů v rpg-mat-9.html.
   Renderuje každý svg* helper s ukázkovými hodnotami do PNG → /tmp/svgshots/*.png
   Spusť: node tests/svg-shots.cjs */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = '/tmp/svgshots';
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

// Ukázkové volání každého helperu (název souboru → JS výraz vracející SVG string)
const CALLS = {
  'angle-40':      "svgAngle(40,{label:'α'})",
  'angle-70':      "svgAngle(70,{label:'β'})",
  'angle-120':     "svgAngle(120,{label:'γ'})",
  'cross-55':      "svgCross(55,{label:'α'})",
  'cuboid':        "svgCuboid('a=5','b=3','c=4')",
  'tri-rovnostr':  "svgTriangle('rovnostr')",
  'tri-rovnoram':  "svgTriangle('rovnoram')",
  'tri-pravo':     "svgTriangle('pravo')",
  'tri-obecny':    "svgTriangle('obecny')",
  'parallelogram': "svgParallelogram(8,5)",
  'trapezoid':     "svgTrapezoid(10,6,4)",
  'linegraph':     "svgLineGraph(1,2)",
  'cylinder':      "svgCylinder(3,8)",
  'cone':          "svgCone(4,9)",
  'sphere':        "svgSphere(6)",
  'similar':       "svgSimilar(2)",
  'rt-3-4':        "svgRightTri(3,4,{la:'a = 3',lb:'b = 4',lc:'c = ?',v:['A','B','C']})",
  'rt-12-5':       "svgRightTri(12,5,{la:'a = 12',lb:'b = 5',lc:'c = 13',v:['A','B','C']})",
  'rt-5-12':       "svgRightTri(5,12,{la:'a = 5',lb:'b = 12',lc:'c = ?',v:['A','B','C']})",
  'rt-8-8':        "svgRightTri(8,8,{la:'8 m',lb:'8 m',lc:'?',v:['A','B','C']})",
  'mirror-L':      "svgMirror('L')",
  'pointsym':      "svgPointSym()",
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC });
  const ctx = await browser.newContext({ viewport: { width: 300, height: 220 } });
  const page = await ctx.newPage();
  // odřízni externí requesty (fonty/CDN) aby load neblokoval
  await ctx.route('**/*', r => {
    const u = r.request().url();
    r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort();
  });
  await page.goto(`${base}/projects/rpg-mat-9.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof svgTriangle === 'function', { timeout: 8000 });

  for (const [name, expr] of Object.entries(CALLS)) {
    const svg = await page.evaluate((e) => {
      try { return eval(e); } catch (err) { return '<b>ERR: ' + err.message + '</b>'; }
    }, expr);
    await page.setContent(`<!doctype html><body style="margin:0;background:#0a0e1a;display:flex;align-items:center;justify-content:center;height:220px"><div style="width:260px">${svg}</div></body>`);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
  }

  await browser.close();
  srv.close();
  console.log('✅ SVG shots →', OUT);
  console.log(Object.keys(CALLS).length, 'helperů vyrenderováno');
})();
