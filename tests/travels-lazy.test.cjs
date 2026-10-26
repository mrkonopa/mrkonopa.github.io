/* ═════════════════════════════════════════════════════════════════
   Zápisky z cest: při otevření stránky se NESMÍ stáhnout celá galerie.

   Naměřeno 26. 10. 2026 (390 px, lokální server, bez proscrollování): Ukrajina 2017 stáhla při otevření
   188 fotek / 58,5 MB a ČR–BH 2018 67 fotek / 19,8 MB, protože fotky byly `background-image` na
   `div.img` — CSS pozadí se líně nenačítá. Ostatních šest zápisků mělo `<img loading="lazy">` a
   stáhlo při otevření 1 fotku (0,2–0,4 MB). Teď mají lazy všechny.

   Hlídá se dvojí:
     • ze zdroje: žádná fotka v galerii není inline `background-image` (jediná smí být titulní `.hero`, `div` nebo `section`)
       a každé `<img>` s fotkou z `images/` mimo titulní má `loading="lazy"`;
     • skutečným načtením v prohlížeči: při otevření nesmí přijít víc než MAX_FOTEK fotek a MAX_MB
       (podlaha z měření: 1 fotka, 0,2–0,4 MB; strop má rezervu na úvodní obrazovku, ne na galerii).
   Sabotáže (přepis odpovědi serveru, soubory se nemění): vypnutí `loading="lazy"` u Ukrajiny a vrácení
   `background-image` u ČR–BH — test musí obě chytit.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
const ZAPISKY = ['ukraine-2017', 'cr-bh-2018', 'romania-2019', 'yugoslavia-2020', 'spain-france-2021', 'italy-2022', 'baltic-2023', 'kosovo-2024'];
const MAX_FOTEK = 6, MAX_MB = 2;      // naměřeno 1 fotka a 0,2–0,4 MB; viz hlavička
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function server(prepis) {
  /* úprava se hledá porovnáním jména, ne čtením `prepis[jméno]` (CodeQL: unvalidated dynamic method call) */
  const upravy = Object.entries(prepis || {});
  return new Promise(res => {
    const s = http.createServer((q, p) => {
      const u = decodeURIComponent(q.url.split('?')[0]);
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
      const jmeno = path.basename(fp); let pr = null; for (const [k, f] of upravy) if (k === jmeno) pr = f;
      if (pr) { const t = fs.readFileSync(fp, 'utf8'), n = pr(t); if (n !== t) s.prepsano++; p.writeHead(200, { 'Content-Type': 'text/html' }); return p.end(n); }
      const st = fs.statSync(fp);
      p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream', 'Content-Length': st.size });
      fs.createReadStream(fp).pipe(p);
    });
    s.prepsano = 0;
    s.listen(0, () => res(s));
  });
}

/* ── ze zdroje ───────────────────────────────────────────────────── */
function zZdroje(html) {
  const v = [];
  /* titulní fotka stránky (.hero) smí být pozadí, jediná */
  const bgMimoHero = (html.match(/<[a-z]+\b[^>]*style="[^"]*background-image\s*:\s*url\([^"]*images\//g) || []).filter(t => !/class="hero"/.test(t)).length;
  if (bgMimoHero) v.push(bgMimoHero + '× fotka jako inline background-image mimo titulní .hero (nenačítá se líně)');
  const imgs = html.match(/<img\b[^>]*>/g) || [];
  const fotky = imgs.filter(t => /src="[^"]*images\//.test(t));
  const bezLazy = fotky.filter(t => !/loading="lazy"/.test(t)).length;
  if (bezLazy > 1) v.push(bezLazy + '× <img> s fotkou bez loading="lazy" (smí být nejvýš jedna titulní)');
  return { v, fotek: fotky.length };
}

(async () => {
  console.log('\n── Zápisky z cest: líné načítání fotek ──\n');
  let celkem = 0;
  for (const z of ZAPISKY) {
    const r = zZdroje(fs.readFileSync(path.join(ROOT, 'travels', z + '.html'), 'utf8'));
    celkem += r.fotek;
    ok(r.v.length === 0 && r.fotek > 50, z + ': ze zdroje ' + r.fotek + ' <img> s fotkou, vše lazy, žádné pozadí mimo titulní', r.v.join(' | ') || 'málo fotek v <img> (' + r.fotek + ')');
  }
  ok(celkem >= 1400, 'dohromady ' + celkem + ' fotek v <img> (podlaha 1 400; naměřeno 1 577, tolik je i souborů v travels/images)');

  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  async function otevri(base, z) {
    const c = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await c.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    const p = await c.newPage(); let img = 0, bytes = 0;
    p.on('response', r => { const u = r.url(); if (u.startsWith(base) && /\/images\/.*\.(jpg|jpeg|png|webp)$/i.test(u)) { img++; bytes += +(r.headers()['content-length'] || 0); } });
    await p.goto(base + '/travels/' + z + '.html', { waitUntil: 'load' }); await p.waitForTimeout(1200);
    await c.close(); return { img, mb: bytes / 1e6 };
  }
  const srv = await server(), base = 'http://127.0.0.1:' + srv.address().port;
  for (const z of ZAPISKY) {
    const o = await otevri(base, z);
    ok(o.img >= 1 && o.img <= MAX_FOTEK && o.mb <= MAX_MB, z + ': při otevření ' + o.img + ' fotek, ' + o.mb.toFixed(1) + ' MB (strop ' + MAX_FOTEK + ' fotek, ' + MAX_MB + ' MB)',
      o.img < 1 ? 'žádná fotka se nenačetla (měřidlo nic nevidí)' : undefined);
  }
  srv.close();

  /* ── sabotáže ─────────────────────────────────────────────────── */
  const SAB = [
    ['Ukrajina bez loading="lazy"', 'ukraine-2017', { 'ukraine-2017.html': t => t.replace(/ loading="lazy"/g, '') }],
    ['ČR–BH s fotkami jako pozadí', 'cr-bh-2018', { 'cr-bh-2018.html': t => t.replace(/<div class="img"><img src="([^"]+)" alt="" loading="lazy" decoding="async"><\/div>/g, (m, u) => `<div class="img" style="background-image:url('${u}');"></div>`) }]
  ];
  for (const [popis, z, prepis] of SAB) {
    const s = await server(prepis), b = 'http://127.0.0.1:' + s.address().port;
    const o = await otevri(b, z);
    ok(s.prepsano > 0, 'sabotáž „' + popis + '“ se aplikovala (přepis uplatněn ' + s.prepsano + '×)');
    ok(o.img > MAX_FOTEK || o.mb > MAX_MB, 'sabotáž „' + popis + '“ je chycena (' + o.img + ' fotek, ' + o.mb.toFixed(1) + ' MB při otevření)', 'test prošel i nad rozbitou stránkou');
    s.close();
  }
  /* totéž pro zdrojovou kontrolu: pozadí v ČR–BH musí zdrojová kontrola poznat */
  const rozbitaZdroj = fs.readFileSync(path.join(ROOT, 'travels', 'cr-bh-2018.html'), 'utf8').replace(/<div class="img"><img src="([^"]+)" alt="" loading="lazy" decoding="async"><\/div>/g, (m, u) => `<div class="img" style="background-image:url('${u}');"></div>`);
  ok(zZdroje(rozbitaZdroj).v.some(x => /background-image/.test(x)), 'zdrojová kontrola pozná fotky vrácené do pozadí');

  await browser.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
