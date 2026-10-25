/* ═════════════════════════════════════════════════════════════════
   Cesta peněz — přepnutí jazyka na každé obrazovce hry.

   Nález z náhodného průchodu (`tools/prijimacky-nahodny-pruchod.cjs` nad ostatními vzdělávacími stránkami): po dohrání
   kapitoly stojí na obrazovce „Kapitola hotová!“ a `sceneIdx` je rovno počtu scén. Ťuknutí na vlajku (CZ/EN) volalo
   `renderScene()`, ta sáhla na `scenes[sceneIdx]` = undefined → „Cannot read properties of undefined (reading 'build')“.
   Výjimka přerušila `setLang`, takže se obrazovka nepřeložila — dítě, které si na konci kapitoly přepne jazyk
   (a opisuje si tam kód pro další kapitolu), dostalo mrtvou vlajku. Scénářové testy to neviděly, protože jazyk
   přepínají na úvodní obrazovce a uprostřed scény.

   Test projde VŠECHNY obrazovky: každou scénu každé kapitoly, obrazovku „Kapitola hotová“ a výsledek, a na každé z nich
   přepne jazyk tam i zpět. Žádná výjimka, a na „Kapitola hotová“ se text opravdu přeloží.
   Sabotáž: server vrátí stránku se starým řádkem (bez opravy) — test to musí najít.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');                    // NIKDY natvrdo /home/user — CI má jinou cestu
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const OPRAVA = "if (sceneIdx >= activeAct.scenes.length) showActComplete(); else renderScene();";
const STARE = "renderScene();";

function server(prepis) {
  return new Promise(res => {
    const s = http.createServer((q, p) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
      p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      if (prepis && path.basename(fp) === 'cesta_penez.html') { const t = fs.readFileSync(fp, 'utf8'); s.prepsano += t.includes(prepis[0]) ? 1 : 0; return p.end(t.replace(prepis[0], () => prepis[1])); }
      fs.createReadStream(fp).pipe(p);
    });
    s.prepsano = 0;
    s.listen(0, () => res(s));
  });
}

async function projdi(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 380, height: 800 }, isMobile: true, hasTouch: true });
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page = await ctx.newPage(), chyby = [];
  page.on('pageerror', e => chyby.push(String(e.message).slice(0, 100)));
  await page.goto(base + '/projects/cesta_penez.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startAct === 'function' && typeof setLang === 'function' && typeof ACTS !== 'undefined', null, { timeout: 15000 });
  const r = await page.evaluate(() => {
    const out = { obrazovek: 0, prelozeno: 0, hotovoPrelozeno: 0, hotovo: 0, vyjimky: [] };
    const zkus = (popis, fn) => { try { fn(); } catch (e) { out.vyjimky.push(popis + ': ' + String(e && e.message).slice(0, 80)); } };
    ACTS.forEach(a => {
      zkus('jazyk cs před kapitolou ' + a.id, () => setLang('cs'));
      zkus('start ' + a.id, () => startAct(a.id));
      a.scenes.forEach((s, i) => {
        sceneIdx = i;
        zkus('scéna ' + a.id + '.' + (i + 1), () => { renderScene(); out.obrazovek++; setLang('en'); setLang('cs'); });
      });
      // obrazovka po dohrání kapitoly (u osmé je to výsledek na vlastní obrazovce)
      zkus('hotovo ' + a.id, () => { sceneIdx = a.scenes.length; finishAct(); out.obrazovek++; });
      const cs = document.getElementById('scene-container').textContent;
      zkus('přepnutí na hotové ' + a.id, () => { setLang('en'); });
      const en = document.getElementById('scene-container').textContent;
      if (a.id !== 8) { out.hotovo++; if (/hotová/.test(cs) && /done!/.test(en)) out.hotovoPrelozeno++; }
      zkus('přepnutí zpět ' + a.id, () => setLang('cs'));
    });
    return out;
  });
  await ctx.close();
  return { r, chyby };
}

(async () => {
  const srv = await server(), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  console.log('\n── Cesta peněz: přepnutí jazyka na každé obrazovce ──\n');
  const { r, chyby } = await projdi(browser, base);
  ok(r.obrazovek >= 55, 'projito ' + r.obrazovek + ' obrazovek (scény všech kapitol + „Kapitola hotová“; podlaha 55)');
  ok(r.vyjimky.length === 0 && chyby.length === 0, 'přepnutí jazyka nikde nevyhodí výjimku', r.vyjimky.concat(chyby).slice(0, 3).join(' | '));
  ok(r.hotovo === 7 && r.hotovoPrelozeno === 7, 'obrazovka „Kapitola hotová“ se po přepnutí opravdu přeloží (' + r.hotovoPrelozeno + ' ze ' + r.hotovo + ')');
  srv.close();

  /* sabotáž: stránka se starým řádkem (bez opravy) — průchod ji musí odhalit */
  const sab = await server([OPRAVA, STARE]), b2 = 'http://127.0.0.1:' + sab.address().port;
  const v = await projdi(browser, b2);
  ok(sab.prepsano > 0, 'sabotáž „bez opravy v setLang“ se aplikovala (přepis uplatněn ' + sab.prepsano + '×)');
  ok(v.r.vyjimky.length > 0 || v.chyby.length > 0, 'sabotáž „bez opravy v setLang“ je chycena (' + (v.r.vyjimky[0] || v.chyby[0] || 'nic') + ')', 'test prošel i nad starým kódem');
  sab.close();
  await browser.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
