/* ggb-overeni.cjs — applety GeoGebry v doplnky.html ověřené na SKUTEČNÉM jádru GeoGebry.

   Proč: tests/prijimacky-doplnky.test.cjs hlídá příkazy a logiku stránky, ale GeoGebru
   samotnou spustit neumí (geogebra.org není ze sandboxu ani z CI dostupná). Že SetColor
   s čísly bere složky 0–1 (a „26,115,200" dá bílou), se dalo zjistit jen takhle.

   Jádro GeoGebry 5.0 je v npm balíku enhanced-geogebra-mcp (48 MB). Stáhne se curlem
   (node https.get nejde přes proxy sandboxu) do tools/ggb-overeni/.cache — do gitu nepatří.
   Požadavky stránky na geogebra.org se přesměrují na místní soubory.

   Spuštění: node tools/ggb-overeni.cjs   → výpis objektů + snímky do tools/ggb-overeni/.cache/
   Hlásí: neviditelné (bílé) tvary, prázdný applet, různé měřítko os, tlačítko „Vrátit"
   které konstrukci neobnoví. Konec kódem 1 při nálezu. */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const CACHE = path.join(__dirname, 'ggb-overeni', '.cache');
const BALIK = 'https://registry.npmjs.org/enhanced-geogebra-mcp/-/enhanced-geogebra-mcp-0.1.0.tgz';
const GGB = path.join(CACHE, 'package', 'geogebra');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm', '.pdf': 'application/pdf' };

if (!fs.existsSync(path.join(GGB, 'deployggb.js'))) {
  fs.mkdirSync(CACHE, { recursive: true });
  console.log('Stahuji jádro GeoGebry (48 MB)…');
  execFileSync('curl', ['-sS', '--fail', '-o', path.join(CACHE, 'pkg.tgz'), BALIK], { stdio: 'inherit' });
  execFileSync('tar', ['xzf', path.join(CACHE, 'pkg.tgz'), '-C', CACHE], { stdio: 'inherit' });
}

(async () => {
  const srv = http.createServer((q, p) => { const fp = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0])));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end(); }
    p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(p); });
  await new Promise(r => srv.listen(0, r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await br.newPage({ viewport: { width: 1000, height: 900 } });
  // deployggb.js z balíku + zachycení API každého appletu a místní kód GeoGebry
  const obal = "\n;(function(){var O=window.GGBApplet;window.__ggb=[];window.GGBApplet=function(p,b){var f=p.appletOnLoad;" +
    "p.appletOnLoad=function(api){window.__ggb.push(api);if(f)f(api);};var a=new O(p,b);" +
    "a.setHTML5Codebase('https://www.geogebra.org/apps/local/web3d/',true);return a;};})();";
  await page.route('**/*', r => { const u = r.request().url(); let m;
    if (u.startsWith(base)) return r.continue();
    if (/geogebra\.org\/apps\/deployggb\.js/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(GGB, 'deployggb.js'), 'utf8') + obal });
    if ((m = u.match(/\/apps\/local\/(.+?)(?:[?#]|$)/))) { const f = path.join(GGB, 'HTML5/5.0', m[1]);
      if (f.startsWith(GGB) && fs.existsSync(f)) return r.fulfill({ path: f, contentType: MIME[path.extname(f)] || 'application/octet-stream' }); }
    return r.abort(); });
  await page.goto(base + '/projects/prijimacky-matematika/doplnky.html', { waitUntil: 'domcontentloaded' });
  const kody = await page.evaluate(() => [...document.querySelectorAll('.ggb-btn')].map(b => b.dataset.ggb));
  let vady = 0;
  for (let i = 0; i < kody.length; i++) {
    const kod = kody[i];
    await page.click(`.ggb-btn[data-ggb="${kod}"]`);
    await page.waitForFunction(n => window.__ggb && window.__ggb.length > n, i, { timeout: 90000 });
    await page.waitForTimeout(1500);
    const stav = () => page.evaluate(n => { const a = window.__ggb[n], vp = JSON.parse(a.getViewProperties(1));
      return { vp, obj: a.getAllObjectNames().map(o => ({ o, typ: a.getObjectType(o), barva: a.getColor(o), vid: a.getVisible(o) })) }; }, i);
    const s = await stav();
    await page.locator('#ggb-' + kod).screenshot({ path: path.join(CACHE, 'ggb-' + kod + '.png') });
    const tvary = s.obj.filter(x => /polygon|quadrilateral|triangle|circle|segment/.test(x.typ));
    const bile = tvary.filter(x => x.vid && /^#F{6}$/i.test(x.barva));
    const mer = Math.abs(s.vp.invXscale - s.vp.invYscale) / s.vp.invXscale;
    console.log(`${kod}: ${s.obj.length} objektů, ${tvary.length} tvarů, měřítko os ${mer < 1e-6 ? 'stejné' : 'RŮZNÉ (' + (mer * 100).toFixed(1) + ' %)'}, nákresna ${s.vp.width}×${s.vp.height}`);
    for (const x of tvary) console.log(`   ${x.o.padEnd(8)} ${x.typ.padEnd(14)} ${x.barva}${x.vid ? '' : ' (skrytý)'}`);
    if (!tvary.length) { vady++; console.log('   ❌ applet nemá žádný tvar'); }
    if (bile.length) { vady++; console.log('   ❌ bílé (neviditelné) tvary: ' + bile.map(x => x.o).join(', ')); }
    if (mer >= 1e-6) { vady++; console.log('   ❌ osy mají různé měřítko — kružnice vyjde jako elipsa'); }
    // posunout volný bod a vrátit tlačítkem
    const volny = s.obj.find(x => x.typ === 'point');
    await page.evaluate(([n, o]) => window.__ggb[n].setCoords(o, 100, 100), [i, volny.o]);
    await page.click(`.ggb-btn[data-ggb="${kod}"]`); await page.waitForTimeout(800);
    const po = await stav();
    const zpet = po.obj.length === s.obj.length && po.obj.every(x => /^#F{6}$/i.test(x.barva) === s.obj.find(y => y.o === x.o).barva.toUpperCase().startsWith('#FFFFFF'));
    const xy = await page.evaluate(([n, o]) => [window.__ggb[n].getXcoord(o), window.__ggb[n].getYcoord(o)], [i, volny.o]);
    if (!zpet || (xy[0] === 100 && xy[1] === 100)) { vady++; console.log(`   ❌ „Vrátit do výchozího stavu" konstrukci neobnovilo (${po.obj.length} objektů, ${volny.o} = ${xy})`); }
    else console.log(`   ✓ „Vrátit do výchozího stavu" obnoví konstrukci (${volny.o} zpět na ${xy.map(v => +v.toFixed(2)).join('; ')})`);
  }
  await br.close(); srv.close();
  console.log(vady ? `\n❌ ${vady} nález(ů)` : `\n✅ ${kody.length} applety v pořádku — snímky v ${path.relative(ROOT, CACHE)}`);
  process.exit(vady ? 1 : 0);
})().catch(e => { console.log('CHYBA', e.message); process.exit(1); });
