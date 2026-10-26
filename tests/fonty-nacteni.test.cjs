/* ═════════════════════════════════════════════════════════════════
   Písma se ve stránce OPRAVDU načtou z vlastních souborů (`fonts/*.woff2`) a stránka je používá.

   Doplňuje `fonty-lokalni` (ten hlídá soubory a odkazy v Node). Tady se stránka vykreslí v prohlížeči:
   z vykresleného textu se zjistí, kterou z našich šesti rodin (Lexend, Inter, JetBrains Mono, Roboto Mono,
   VT323, Archivo Black) skutečně používá (první rodina ze zásobníku `font-family` u viditelného textu), a ke
   každé musí existovat načtený `FontFace` (`document.fonts`, stav `loaded`). Bez toho by stránka tiše
   spadla na záložní písmo — a to je přesně to, co dřív testy měřily místo Lexendu.
   Navíc: žádný požadavek na fonts.googleapis.com ani fonts.gstatic.com (jiné cizí adresy, např. přihlášení přes Supabase, tu neřeší).

   Stránky: domovská (JetBrains Mono), 404, rozcestník cestování (Archivo Black, Inter), RPG 9. ročníku
   (Roboto Mono, VT323, Lexend), únikovka, úvodní stránka přijímaček (Lexend).
   Sabotáž (přepis odpovědi serveru): soubory `.woff2` vracejí 404 — test musí pojmenovat rodinu, která se nenačetla.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const RODINY = ['Lexend', 'Inter', 'JetBrains Mono', 'Roboto Mono', 'VT323', 'Archivo Black'];
const STRANKY = [
  ['domovská', '/index.html'], ['404', '/404.html'], ['cestování', '/travels/index.html'],
  ['RPG 9. ročníku', '/projects/rpg-mat-9.html'], ['únikovka', '/projects/unikovka_procenta.html'],
  ['přijímačky', '/projects/prijimacky-matematika/index.html']
];
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function server(nenacitat) {
  return new Promise(res => {
    const s = http.createServer((q, p) => {
      const u = decodeURIComponent(q.url.split('?')[0]);
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
      if (nenacitat && fp.endsWith('.woff2')) { s.zablokovano++; p.writeHead(404); return p.end('nf'); }
      p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(p);
    });
    s.zablokovano = 0;
    s.listen(0, () => res(s));
  });
}

/* běží v prohlížeči: rodiny, které viditelný text používá, a které z nich jsou načtené */
function mer(rodiny) {
  const pouzite = new Set(), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (!n.data.trim()) continue;
    const e = n.parentElement; if (!e || e.closest('script,style,svg,noscript')) continue;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const zas = cs.fontFamily.split(',').map(x => x.trim().replace(/^["']|["']$/g, ''));
    const prvni = zas.find(x => rodiny.includes(x));
    if (prvni) pouzite.add(prvni);
  }
  const nactene = new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/^["']|["']$/g, '')));
  return { pouzite: [...pouzite], nactene: [...nactene] };
}

async function zmer(browser, base, url) {
  const c = await browser.newContext({ viewport: { width: 820, height: 1100 }, isMobile: true, hasTouch: true });
  const cizi = [];
  await c.route('**/*', r => { const u = r.request().url(); if (u.startsWith(base)) return r.continue(); if (/fonts\.(googleapis|gstatic)\.com/.test(u)) cizi.push(u.slice(0, 60)); return r.abort(); });
  const p = await c.newPage(); await p.goto(base + url, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  const o = await p.evaluate(mer, RODINY); o.cizi = cizi; await c.close(); return o;
}
const vady = o => {
  const v = [];
  const chybi = o.pouzite.filter(r => !o.nactene.includes(r));
  if (chybi.length) v.push('nenačteno: ' + chybi.join(', '));
  if (o.cizi.length) v.push('požadavek na Google Fonts: ' + o.cizi.slice(0, 2).join(', '));
  return v.join(' | ');
};

(async () => {
  const srv = await server(false), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  console.log('\n── Písma se načtou z vlastních souborů ──\n');
  const vsechna = new Set();
  for (const [jm, url] of STRANKY) {
    const o = await zmer(browser, base, url); o.pouzite.forEach(r => vsechna.add(r));
    ok(o.pouzite.length > 0 && vady(o) === '', jm + ': používá ' + (o.pouzite.join(', ') || '— nic —') + ', vše načteno z vlastních souborů', vady(o) || 'stránka nepoužívá žádnou naši rodinu (měřidlo nic nevidí)');
  }
  ok(vsechna.size === RODINY.length, 'dohromady stránky používají všech šest rodin (' + [...vsechna].join(', ') + ')', 'chybí: ' + RODINY.filter(r => !vsechna.has(r)).join(', '));
  srv.close();

  /* sabotáž: soubory písem se nedají stáhnout */
  const s2 = await server(true), b2 = 'http://127.0.0.1:' + s2.address().port;
  const o2 = await zmer(browser, b2, '/projects/rpg-mat-9.html');
  const v2 = vady(o2);
  ok(s2.zablokovano > 0, 'sabotáž „soubory .woff2 vracejí 404“ se aplikovala (zablokováno ' + s2.zablokovano + '×)');
  ok(/nenačteno: .*Lexend|nenačteno: .*Roboto Mono|nenačteno: .*VT323/.test(v2), 'sabotáž „soubory .woff2 vracejí 404“ je chycena (' + (v2 || 'nic') + ')', 'test prošel i bez písem');
  s2.close();
  await browser.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
