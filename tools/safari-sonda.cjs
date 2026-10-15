/* Virtuální „Safari“: přijímačky v SKUTEČNÉM enginu WebKit (WebKitGTK) na velikosti iPadu.
   Playwrightův WebKit se z cloudu stáhnout nedá (403), proto se ovládá WebKitWebDriver z balíčků Ubuntu:
     apt-get install -y webkit2gtk-driver xvfb fonts-dejavu-core fonts-liberation
   node tools/safari-sonda.cjs [out=cesta] [vp=ipad-vyska,ipad-sirka]

   CO TO JE: stejné jádro (WebCore + JavaScriptCore, 605.1.15) jako Safari — chytí rozdíly v JS a CSS proti
   Chromiu (nepodporovaná syntaxe, jiné rolování při zaostření pole, jiné měření rozložení).
   CO TO NENÍ: iPadOS. Chybí dotyková klávesnice, hrubé ukazovátko (`pointer: coarse` je v GTK vždy false, takže
   se nespustí cesty „klepnutí otevře okno přes celou obrazovku“ a CSS `@media (pointer: coarse)` platí jen
   v Chromiu), pozastavení stránky při zamčení tabletu a zrušení karty při nedostatku paměti.
   Proto se otevření celé obrazovky konstrukce dělá tlačítkem Zvětšit a tah prstem skutečnými dotykovými
   událostmi WebDriveru (pointerType touch).

   Pomocný server vkládá do každé stránky sběr chyb (window.__err) a vyhazuje externí skripty a písma, aby se
   nečekalo na blokovanou síť. Nástroj ničeho v repozitáři nemění. */
'use strict';
const { spawn } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.join(__dirname, '..');
const arg = (k, d) => { const a = process.argv.slice(2).find(x => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
const OUT = arg('out', path.join(os.tmpdir(), 'safari-sonda'));
fs.mkdirSync(OUT, { recursive: true });
const VP = { 'ipad-vyska': [820, 1180], 'ipad-sirka': [1180, 820] };
const VYBRANE = arg('vp', 'ipad-vyska,ipad-sirka').split(',').filter(v => VP[v]);
const PORT_WD = 4444;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SBER = '<script>window.__err=[];addEventListener("error",function(e){__err.push((e.message||"")+" @"+String(e.filename||"").split("/").pop()+":"+e.lineno)});' +
  'addEventListener("unhandledrejection",function(e){__err.push("promise: "+(e.reason&&e.reason.message||e.reason))});' +
  'var _ce=console.error;console.error=function(){__err.push("console.error: "+[].slice.call(arguments).join(" ").slice(0,160));_ce.apply(console,arguments)};</script>';

function server() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const f = path.normalize(path.join(ROOT, u));
      if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('nf'); }
      let body = fs.readFileSync(f);
      if (f.endsWith('.html')) {
        body = String(body).replace(/<(link|script)\b[^>]*(?:href|src)="https?:[^"]*"[^>]*>(\s*<\/script>)?/gi, '').replace(/<head[^>]*>/i, m => m + SBER);
      }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(body);
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}

const wd = async (m, p, b) => {
  const r = await fetch('http://127.0.0.1:' + PORT_WD + p, { method: m, headers: { 'content-type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  const j = await r.json(); if (j.value && j.value.error) throw new Error(j.value.error + ': ' + j.value.message); return j.value;
};
const EL = 'element-6066-11e4-a52e-4f735466cecf';

async function otevri(sid, w, h, url) {
  await wd('POST', `/session/${sid}/window/rect`, { width: w, height: h });
  await wd('POST', `/session/${sid}/url`, { url }); await sleep(900);
}
const js = (sid, script, args = []) => wd('POST', `/session/${sid}/execute/sync`, { script, args });
const prvek = async (sid, css) => (await wd('POST', `/session/${sid}/element`, { using: 'css selector', value: css }))[EL];
const klik = async (sid, css) => wd('POST', `/session/${sid}/element/${await prvek(sid, css)}/click`, {});
const snimek = async (sid, nazev) => { const b = await wd('GET', `/session/${sid}/screenshot`); fs.writeFileSync(path.join(OUT, nazev + '.png'), Buffer.from(b, 'base64')); };
// tah prstem: skutečné dotykové události (pointerType touch)
const tahPrstem = (sid, body) => wd('POST', `/session/${sid}/actions`, { actions: [{ type: 'pointer', id: 'prst', parameters: { pointerType: 'touch' }, actions: [
  { type: 'pointerMove', duration: 0, x: Math.round(body[0].x), y: Math.round(body[0].y), origin: 'viewport' }, { type: 'pointerDown', button: 0 },
  ...body.slice(1).map(p => ({ type: 'pointerMove', duration: 40, x: Math.round(p.x), y: Math.round(p.y), origin: 'viewport' })), { type: 'pointerUp', button: 0 }] }] });

let pass = 0, fail = 0; const nalezy = [];
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; nalezy.push(m + (d ? ' — ' + d : '')); console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const STRANKY = ['index', 'test', 'procvicovani', 'diagnostika', 'statistiky', 'konstrukce', 'doplnky'];

(async () => {
  const srv = await server(); const base = 'http://127.0.0.1:' + srv.address().port + '/projects/prijimacky-matematika/';
  const drv = spawn('xvfb-run', ['-a', '-s', '-screen 0 1400x1500x24', 'WebKitWebDriver', '--port=' + PORT_WD], { stdio: 'ignore' });
  let sid = null;
  try {
    for (let i = 0; i < 40; i++) { try { const st = await wd('GET', '/status'); if (st.ready) break; } catch (e) { /* ještě startuje */ } await sleep(500); }
    const s = await wd('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'MiniBrowser', 'webkitgtk:browserOptions': { binary: '/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser', args: ['--automation'] } } } });
    sid = s.sessionId; console.log('WebKit ' + s.capabilities.browserVersion + ' — ' + await js(sid, 'return navigator.userAgent'));

    for (const vp of VYBRANE) {
      const [w, h] = VP[vp]; console.log('\n══ ' + vp + ' (' + w + '×' + h + ') ══');

      // 1) stránky: načtou se bez chyb a nepřetékají
      for (const p of STRANKY) {
        await otevri(sid, w, h, base + p + '.html'); await sleep(400);
        const r = await js(sid, 'return {err:window.__err||["sběr chyb chybí"],sw:document.documentElement.scrollWidth,iw:innerWidth,t:document.title.length}');
        ok(r.err.length === 0 && r.t > 0, p + ': načte se bez chyb v konzoli', r.err.join(' | '));
        ok(r.sw <= r.iw + 1, p + ': nepřetéká vodorovně', 'scrollWidth ' + r.sw + ' > ' + r.iw);
      }

      // 2) test nanečisto: start, odpočet, zaostření pole pod přišpendleným odpočtem, odevzdání
      await otevri(sid, w, h, base + 'test.html');
      await klik(sid, '#cm-gate .pz-btn.primary'); await sleep(600);
      const t0 = await js(sid, 'return document.getElementById("cm-timer-v").textContent'); await sleep(2300);
      const t1 = await js(sid, 'return document.getElementById("cm-timer-v").textContent');
      ok(t0 !== t1 && /^\d+:\d\d$/.test(t1), 'test: odpočet běží (' + t0 + ' → ' + t1 + ')');
      // Šipka zpět (Shift+Tab) z posledního pole přes všechna ostatní: rolování při zaostření dělá prohlížeč sám.
      // (Volání el.focus() ze skriptu stránku v tomhle WebKitu neposune, takže by se měřilo naprázdno.)
      await js(sid, 'window.scrollTo(0,document.documentElement.scrollHeight)');
      const polePosl = await js(sid, 'const i=document.querySelectorAll("#cm-tasks input[type=text]");return i.length-1');
      await js(sid, 'document.querySelectorAll("#cm-tasks input[type=text]")[arguments[0]].focus()', [polePosl]);
      const kryti = [];
      for (let i = 0; i < 16; i++) {
        const akt = (await wd('GET', `/session/${sid}/element/active`))[EL];
        await wd('POST', `/session/${sid}/element/${akt}/value`, { text: '\uE008\uE004\uE000' }); await sleep(120);
        kryti.push(await js(sid, 'const a=document.activeElement,t=document.getElementById("cm-timer").getBoundingClientRect(),r=a.getBoundingClientRect();return a.matches("#cm-tasks input")?Math.round(r.top-t.bottom):null'));
      }
      const meritelne = kryti.filter(x => x !== null);
      ok(meritelne.length >= 4 && meritelne.every(x => x >= 0), 'test: pole zaostřené šipkou zpět nezůstane pod odpočtem (nejmenší odstup ' + Math.min(...meritelne) + ' px z ' + meritelne.length + ' polí)', kryti.join(','));
      const prvni = await prvek(sid, '#cm-tasks input[type=text]');
      await wd('POST', `/session/${sid}/element/${prvni}/value`, { text: '42' });
      ok(await js(sid, 'return document.querySelector("#cm-tasks input[type=text]").value') === '42', 'test: do pole jde psát');
      await snimek(sid, vp + '-test-bezi');
      const kn = await js(sid, 'return document.querySelectorAll("#cm-tasks .cm-kn").length');
      ok(kn === 2, 'test: úlohy 9 a 10 jsou rýsovací okna (' + kn + ')');
      await js(sid, 'cmSubmit(false)'); await sleep(400);
      ok(await js(sid, 'return document.getElementById("cm-end").style.display!=="none" && !CM.on'), 'test: odevzdání ukáže výsledek');
      await snimek(sid, vp + '-test-konec');

      // 3) konstrukce: tah prstem v oknu přes celou obrazovku
      await otevri(sid, w, h, base + 'konstrukce.html');
      await js(sid, 'document.getElementById("kn-typ").selectedIndex=0; knNova();'); await sleep(400);
      await klik(sid, '#kn-okno [data-a="zvetsit"]'); await sleep(500);
      ok(await js(sid, 'return document.body.classList.contains("kn-full-on")'), 'konstrukce: okno se otevře přes celou obrazovku');
      await klik(sid, '#kn-nastroje [data-n="ruka"]');
      const r0 = await js(sid, 'const r=document.getElementById("kn-svg").getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,n:document.getElementById("kn-zak").children.length}');
      ok(r0.w > 300 && r0.h > 200, 'konstrukce: kreslicí plocha má rozumnou velikost (' + Math.round(r0.w) + '×' + Math.round(r0.h) + ')');
      const x0 = r0.x + r0.w * 0.25, y0 = r0.y + r0.h * 0.5, x1 = r0.x + r0.w * 0.75;
      const body = Array.from({ length: 12 }, (_, i) => ({ x: x0 + (x1 - x0) * i / 11, y: y0 + Math.sin(i) * 2 }));
      await tahPrstem(sid, body); await sleep(500);
      const n1 = await js(sid, 'return document.getElementById("kn-zak").children.length');
      ok(n1 === r0.n + 1, 'konstrukce: tah prstem (dotykové události) nakreslí čáru (' + r0.n + ' → ' + n1 + ')');
      await snimek(sid, vp + '-konstrukce-tah');
      const sw = await js(sid, 'return document.documentElement.scrollWidth<=innerWidth+1 && document.getElementById("kn-full").scrollWidth<=innerWidth+1');
      ok(sw, 'konstrukce: celá obrazovka nepřetéká');
    }
  } catch (e) { fail++; nalezy.push('VÝJIMKA: ' + e.message); console.log('  ❌ výjimka: ' + e.message); }
  try { if (sid) await wd('DELETE', '/session/' + sid); } catch (e) { /* už zavřeno */ }
  drv.kill(); srv.close();
  fs.writeFileSync(path.join(OUT, 'souhrn.txt'), `${pass} ✅ / ${fail} ❌\n` + nalezy.join('\n') + '\n');
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌  (snímky: ${OUT})`);
  process.exit(fail ? 1 : 0);
})();
