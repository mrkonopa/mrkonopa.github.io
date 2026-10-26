/* ═════════════════════════════════════════════════════════════════
   Most mezi RPG hrami a přijímačkami: dva odkazy, které žáka převedou z jednoho do druhého.

   Vizuální revize 26. 10. 2026 (před opravou): z přijímaček nevedl na RPG ani jeden odkaz a z RPG vedl
   jediný — z mapy 9. ročníku (chip s odpočtem a tlačítko „CERMAT TEST“). Rozcestník RPG (hub) o přijímačkách
   nevěděl vůbec, takže žák 8. ročníku, který se na střední připravuje, se k nim dostal jen z rozcestníku projektů.
   Teď: pruh „Chceš si to procvičit hrou?“ pod čtyřmi kartami úvodní stránky přijímaček a blok „Chystáš se na
   střední?“ v rozcestníku RPG.

   Hlídá se (na 360, 390 a 820 px, s dotykem):
     • oba odkazy existují, jsou vidět (ne `hidden`, ne mimo okno) a nic nepřetéká přes pravý okraj;
     • oba odkazy vedou na stránku, která se SKUTEČNĚ načte (HTTP 200 a očekávaný obsah) — nestačí řetězec v `href`;
     • odkaz je dost velký na prst (≥ 44 px na výšku) a čitelný: text proti SOLIDNÍMU pozadí má kontrast ≥ 4,5 : 1
       (první verze tlačítka v rozcestníku používala proměnnou, která mimo kartu není definovaná, takže měla
       průhledné pozadí a tmavý text na tmavé stránce — neviditelné; průhledné pozadí se proto bere jako vada);
     • zpětná cesta z mapy 9. ročníku k přijímačkám zůstala (chip i tlačítko).
   Sabotáže (přepis odpovědi serveru, soubory se nemění): rozbitá cesta v pruhu úvodní stránky, tlačítko v rozcestníku
   bez pozadí, pruh smazaný úplně.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const ROZMERY = [[360, 740], [390, 844], [820, 1100]];
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function server(prepis) {
  /* úprava se hledá porovnáním jména, ne čtením `prepis[jméno]`: jméno souboru je z adresy a `constructor` by našlo funkci objektu (CodeQL: unvalidated dynamic method call) */
  const upravy = Object.entries(prepis || {});
  return new Promise(res => {
    const s = http.createServer((q, p) => {
      const u = decodeURIComponent(q.url.split('?')[0]);
      let fp = path.normalize(path.join(ROOT, u));
      /* adresa složky dává její index.html, jako GitHub Pages */
      if (fp.startsWith(ROOT + path.sep) && fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
      p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      const jmeno = path.basename(fp); let pr = null; for (const [k, f] of upravy) if (k === jmeno) pr = f;
      if (pr) { const t = fs.readFileSync(fp, 'utf8'), n = pr(t); if (n !== t) s.prepsano++; return p.end(n); }
      fs.createReadStream(fp).pipe(p);
    });
    s.prepsano = 0;
    s.listen(0, () => res(s));
  });
}

/* běží v prohlížeči: rozměry, viditelnost a kontrast odkazu uvnitř kořene `sel` */
function mer(sel) {
  const kor = document.querySelector(sel);
  if (!kor) return { chybi: true };
  const a = kor.tagName === 'A' ? kor : kor.querySelector('a');
  if (!a) return { chybi: true };
  const r = a.getBoundingClientRect(), k = kor.getBoundingClientRect();
  const lum = c => { const v = c.map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
  const rgba = s => (s.match(/[\d.]+/g) || []).map(Number);
  const cs = getComputedStyle(a), txt = rgba(cs.color), bg = rgba(cs.backgroundColor);
  /* pozadí odkazu: vlastní, nebo (u pruhu) pozadí karty; průhledné = vada */
  let pozadi = bg.length === 4 && bg[3] === 0 ? null : bg;
  let zdroj = 'odkaz';
  if (!pozadi || (pozadi.length === 4 && pozadi[3] < 1)) {
    pozadi = null;
    for (let e = a.parentElement; e && e !== document.documentElement; e = e.parentElement) {
      const b = rgba(getComputedStyle(e).backgroundColor);
      if (b.length >= 3 && (b.length === 3 || b[3] === 1)) { pozadi = b; zdroj = e.className || e.tagName; break; }
    }
  }
  const L1 = lum(txt), L2 = pozadi ? lum(pozadi) : null;
  const kontrast = pozadi ? (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05) : 0;
  return { chybi: false, href: a.getAttribute('href'), vyska: Math.round(r.height), sirka: Math.round(r.width),
    videt: r.width > 0 && r.height > 0 && r.right <= innerWidth + 1 && r.left >= -1 && !kor.hidden && getComputedStyle(kor).display !== 'none',
    kontrast: Math.round(kontrast * 100) / 100, zdroj, pretece: document.documentElement.scrollWidth > innerWidth + 1, kHeight: Math.round(k.height) };
}
async function zmer(browser, base, url, sel, w, h) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
  await c.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  const p = await c.newPage(); await p.goto(base + url, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500);
  const o = await p.evaluate(mer, sel);
  if (!o.chybi) {
    /* cíl odkazu se skutečně načte: relativní cesta se řeší proti adrese stránky */
    const cil = new URL(o.href, base + url).href;
    const q = await c.request.get(cil);
    o.stav = q.status(); o.telo = (await q.text()).slice(0, 4000); o.cil = cil;
  }
  await c.close(); return o;
}
const spatne = (o, jmeno, ocekavany) => {
  const v = [];
  if (o.chybi) return [jmeno + ': odkaz chybí'];
  if (!o.videt) v.push('není vidět nebo leží mimo okno');
  if (o.pretece) v.push('stránka přetéká přes pravý okraj');
  if (o.vyska < 44) v.push('výška odkazu ' + o.vyska + ' px (pod 44 px pro prst)');
  if (!(o.kontrast >= 4.5)) v.push('kontrast ' + o.kontrast + ' : 1 proti ' + o.zdroj + ' (pod 4,5)');
  if (o.stav !== 200) v.push('cíl ' + o.cil + ' vrací ' + o.stav);
  else if (!ocekavany.test(o.telo)) v.push('cíl se načetl, ale není to očekávaná stránka');
  return v.map(x => jmeno + ': ' + x);
};

const STRANY = [
  { jm: 'úvodní stránka přijímaček → RPG 9. ročníku', url: '/projects/prijimacky-matematika/index.html', sel: '.hra-pruh', cil: /RPG|NULL_BYTE/i },
  { jm: 'rozcestník RPG → přijímačky', url: '/projects/rpg-matematika.html', sel: '#hub-prijimacky', cil: /P[řr]ij[ií]ma[čc]ky/i }
];

(async () => {
  const srv = await server(), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  console.log('\n── Most mezi RPG a přijímačkami ──\n');
  for (const [w, h] of ROZMERY) {
    const vady = [];
    for (const s of STRANY) { const o = await zmer(browser, base, s.url, s.sel, w, h); vady.push(...spatne(o, s.jm, s.cil)); }
    ok(vady.length === 0, w + ' px: oba odkazy jsou vidět, vedou na živou stránku a jdou stisknout', vady.slice(0, 3).join(' | '));
  }
  /* zpětná cesta z mapy 9. ročníku zůstala */
  const zdroj9 = fs.readFileSync(path.join(ROOT, 'projects/rpg-mat-9.html'), 'utf8');
  ok(/id="map-cermat"[^>]*href="prijimacky-matematika\/"/.test(zdroj9), 'mapa 9. ročníku: chip s odpočtem vede na přijímačky');
  ok(/window\.open\('prijimacky-matematika\/test\.html'/.test(zdroj9), 'mapa 9. ročníku: tlačítko „CERMAT TEST“ vede na test nanečisto');
  srv.close();

  const SAB = [
    ['rozbitá cesta v pruhu úvodní stránky', STRANY[0], { 'index.html': t => t.replace('href="../rpg-mat-9.html"', 'href="rpg-mat-9.html"') }, /vrací 404/],
    ['tlačítko v rozcestníku bez pozadí', STRANY[1], { 'rpg-matematika.html': t => t.replace('background:var(--accent-ui);border-color:var(--accent-ui);color:var(--accent-ink)', 'background:var(--neexistuje);color:var(--accent-ink)') }, /kontrast/],
    ['pruh smazaný úplně', STRANY[0], { 'index.html': t => { const i = t.indexOf('  <a class="hra-pruh"'), j = t.indexOf('</a>', i) + 5; return t.slice(0, i) + t.slice(j); } }, /odkaz chybí/]
  ];
  for (const [popis, strana, prepis, vzor] of SAB) {
    const s = await server(prepis), b = 'http://127.0.0.1:' + s.address().port;
    const o = await zmer(browser, b, strana.url, strana.sel, 390, 844); const v = spatne(o, strana.jm, strana.cil).join(' | ');
    ok(s.prepsano > 0, 'sabotáž „' + popis + '“ se aplikovala (přepis uplatněn ' + s.prepsano + '×)');
    ok(vzor.test(v), 'sabotáž „' + popis + '“ je chycena (' + (v || 'nic').slice(0, 100) + ')', 'test prošel i nad rozbitou stránkou');
    s.close();
  }
  await browser.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
