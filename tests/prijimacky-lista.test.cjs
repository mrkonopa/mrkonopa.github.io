/* ═════════════════════════════════════════════════════════════════
   Přijímačky: jednotná horní lišta všech sedmi stránek a pořadí úvodní stránky.

   Vizuální revize 26. 10. 2026 (před opravou): úvodní stránka a „Doplňky“ měly v liště doslovnou cestu
   „/projects/prijimacky-matematika“ (zbytek terminálového stylu), ostatní pět stránek „mrkonopa.github.io“
   a delší „← Přijímačky z matematiky“. Na telefonu 390 px měla lišta 160 px (index), 165 px (Doplňky)
   a 112 px (ostatní) místo jednoho řádku (64 px), a na úvodní stránce začínaly čtyři hlavní karty
   až na y = 869 px — pod okrajem obrazovky (844 px) — protože před nimi stál dlouhý odstavec o archivu
   PDF s pěti emoji. Ten odstavec vysvětluje řady souborů v ARCHIVU, proto teď stojí těsně nad ním.

   Hlídá se (na 360, 390 a 820 px):
     • všech sedm stránek má lištu ze tří prvků: zpětný odkaz (začíná „←“), „domů“ a přepínač vzhledu;
       žádný text lišty nevypadá jako cesta („/projects/…“);
     • lišta je jeden řádek (≤ 64 px) — na telefonu se dřív lámala na dva až tři;
     • úvodní stránka: první hlavní karta začíná nad okrajem obrazovky a pod kartami jde odpočet,
       pak vysvětlení archivu a pak roky (pořadí podle polohy v dokumentu).
   Sabotáže (přepis odpovědi serveru, soubory se nemění): vrácená cesta v liště úvodní stránky, vysvětlení
   archivu zpět před kartami, dlouhý popisek zpětného odkazu na vnitřní stránce.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const PZ = '/projects/prijimacky-matematika/';
const STRANKY = ['index', 'test', 'procvicovani', 'diagnostika', 'statistiky', 'konstrukce', 'doplnky'];
const ROZMERY = [[360, 740], [390, 844], [820, 1100]];
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function server(prepis) {
  return new Promise(res => {
    const s = http.createServer((q, p) => {
      const u = decodeURIComponent(q.url.split('?')[0]);
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
      p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      const pr = prepis && prepis[path.basename(fp)];
      if (pr) { const t = fs.readFileSync(fp, 'utf8'), n = pr(t); if (n !== t) s.prepsano++; return p.end(n); }
      fs.createReadStream(fp).pipe(p);
    });
    s.prepsano = 0;
    s.listen(0, () => res(s));
  });
}

/* běží v prohlížeči */
function mer() {
  const t = document.querySelector('.top-bar'); const r = t.getBoundingClientRect();
  const prvky = [...t.children].map(x => x.textContent.trim());
  const odkazy = [...t.querySelectorAll('a')].map(a => a.textContent.trim());
  const prepinac = !!t.querySelector('[role=switch]');
  const y = e => e ? Math.round(e.getBoundingClientRect().top + scrollY) : null;
  const karty = [...document.querySelectorAll('.hub-card')];
  const kon = document.querySelector('.cermat-banner'), intro = document.querySelector('.intro-card'), rok = document.querySelector('section.year');
  return { vyska: Math.round(r.height), prvky, odkazy, prepinac, vh: innerHeight,
    prvniKarta: y(karty[0]), poslediKartaDolu: karty.length ? Math.round(karty[karty.length - 1].getBoundingClientRect().bottom + scrollY) : null,
    odpocet: y(kon), intro: y(intro), rok: y(rok) };
}
async function zmer(browser, base, stranka, w, h) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
  await c.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  const p = await c.newPage(); await p.goto(base + PZ + stranka + '.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(600);
  const o = await p.evaluate(mer); await c.close(); return o;
}
const spatne = (o, stranka) => {
  const v = [];
  if (!o.odkazy[0] || !o.odkazy[0].startsWith('←')) v.push('první odkaz nezačíná „←“: ' + o.odkazy[0]);
  if (o.odkazy[1] !== 'domů') v.push('druhý odkaz není „domů“: ' + o.odkazy[1]);
  if (!o.prepinac) v.push('chybí přepínač vzhledu');
  if (o.prvky.some(t => /^\/projects\//.test(t))) v.push('v liště je cesta „' + o.prvky.find(t => /^\/projects\//.test(t)) + '“');
  if (o.prvky.length !== 3) v.push('lišta má ' + o.prvky.length + ' prvků místo 3');
  if (o.vyska > 64) v.push('lišta má ' + o.vyska + ' px (víc než jeden řádek, 64)');
  if (stranka === 'index') {
    if (!(o.prvniKarta < o.vh)) v.push('první karta začíná na y = ' + o.prvniKarta + ' (obrazovka ' + o.vh + ' px)');
    if (!(o.poslediKartaDolu < o.odpocet && o.odpocet < o.intro && o.intro < o.rok)) v.push('pořadí není karty < odpočet < vysvětlení archivu < roky (' + [o.poslediKartaDolu, o.odpocet, o.intro, o.rok].join(' / ') + ')');
  }
  return v;
};

(async () => {
  const srv = await server(), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  console.log('\n── Přijímačky: jednotná horní lišta a pořadí úvodní stránky ──\n');
  for (const [w, h] of ROZMERY) {
    const vady = [];
    for (const s of STRANKY) { const o = await zmer(browser, base, s, w, h); spatne(o, s).forEach(v => vady.push(s + ': ' + v)); }
    ok(vady.length === 0, w + ' px: všech ' + STRANKY.length + ' stránek má stejnou jednořádkovou lištu' + (w < 700 ? ' a úvodní karty jsou nad okrajem' : ' a správné pořadí úvodní stránky'), vady.slice(0, 3).join(' | '));
  }
  srv.close();

  const SAB = [
    ['cesta vrácená do lišty úvodní stránky', 'index', 390, 844, { 'index.html': t => t.replace('<a href="../">← Projekty</a>', '<a href="../">← Projekty</a>\n    <span class="crumb">/projects/prijimacky-matematika</span>') }, /v liště je cesta/],
    ['vysvětlení archivu zpět před kartami', 'index', 390, 844, { 'index.html': t => { const i = t.indexOf('  <div class="intro-card">'), j = t.indexOf('  </div>\n', i) + 9, blok = t.slice(i, j), bez = t.slice(0, i) + t.slice(j), k = bez.indexOf('  <section class="acct-wrap"'); return bez.slice(0, k) + blok + bez.slice(k); } }, /první karta začíná|pořadí není/],
    ['dlouhý popisek zpětného odkazu', 'test', 390, 844, { 'test.html': t => t.replace('← Přijímačky</span>', '← Přijímačky z matematiky a ještě trochu delší</span>') }, /víc než jeden řádek/]
  ];
  for (const [popis, stranka, w, h, prepis, vzor] of SAB) {
    const s = await server(prepis), b = 'http://127.0.0.1:' + s.address().port;
    const o = await zmer(browser, b, stranka, w, h); const v = spatne(o, stranka).join(' | ');
    ok(s.prepsano > 0, 'sabotáž „' + popis + '“ se aplikovala (přepis uplatněn ' + s.prepsano + '×)');
    ok(vzor.test(v), 'sabotáž „' + popis + '“ je chycena (' + (v || 'nic').slice(0, 90) + ')', 'test prošel i nad rozbitou stránkou');
    s.close();
  }
  await browser.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
