/* ═════════════════════════════════════════════════════════════════
   Úvodní stránka přijímaček: popisky a odkazy nesou vektorové ikony, ne emoji.

   Vizuální revize 26. 10. 2026: karty hlavní nabídky už měly vlastní vektorové ikony (hub-card), ale zbytek
   stránky — štítky souborů v archivu (zadání, řešení, klíč, záznamový arch: 49 míst), legenda nad archivem,
   odpočet (⏳, 📅) a tlačítko Doplňky — byl psaný emoji, které se na každém systému kreslí jinak a vedle
   ostatních ikon vypadají cize. Teď je to sada čtyř až sedmi vložených SVG (`.pz-ik`, tah `currentColor`,
   takže barvu i tmavý vzhled řídí text, u kterého stojí).

   Hlídá se na vykreslené stránce:
     • v ZOBRAZENÉM textu úvodní stránky není žádné emoji (`\p{Emoji_Presentation}` nebo piktogram s `U+FE0F`) —
       ✓, ✗ a © jsou obyčejné znaky písma, ne emoji, a zůstávají;
     • ikon je aspoň 50 (naměřeno 52), každá je `aria-hidden`, viditelná a velká aspoň 12 px;
     • totéž v tmavém vzhledu (ikona nesmí zmizet ani změnit rozměr).
   Sabotáže (přepis odpovědi serveru, soubory se nemění): emoji vrácené do řádku archivu, do legendy a do odpočtu.
   Záměrně se NEmění emoji v dynamických hláškách (🎉 po testu, 🔥 série, 💡 nápověda, 📈 trend) — jsou to
   vykřičníky radosti a stav, ne navigace; měří je jejich vlastní testy a výměna by sahala do každé stránky zvlášť.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const URL_INDEX = '/projects/prijimacky-matematika/index.html';
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
      p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      const jmeno = path.basename(fp); let pr = null;
      for (const [k, f] of upravy) if (k === jmeno) pr = f;
      if (pr) { const t = fs.readFileSync(fp, 'utf8'), n = t.split(pr[0]).join(pr[1]); if (n !== t) s.prepsano++; return p.end(n); }
      fs.createReadStream(fp).pipe(p);
    });
    s.prepsano = 0;
    s.listen(0, () => res(s));
  });
}

/* běží v prohlížeči: emoji v zobrazeném textu a stav ikon */
function mer() {
  const emoji = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const e = n.parentElement; if (!e || e.closest('script,style,svg,noscript')) continue;
    const m = n.data.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}️/gu);
    if (m) emoji.push(m.join('') + ' v „' + n.data.trim().slice(0, 30) + '“');
  }
  const ik = [...document.querySelectorAll('svg.pz-ik')].map(s => { const r = s.getBoundingClientRect(); return { skryta: s.getAttribute('aria-hidden') !== 'true', w: r.width, h: r.height }; });
  return { emoji, pocet: ik.length, bezAria: ik.filter(x => x.skryta).length, male: ik.filter(x => x.w < 12 || x.h < 12).length };
}
async function zmer(browser, base, tmavy) {
  const c = await browser.newContext({ viewport: { width: 820, height: 1100 }, isMobile: true, hasTouch: true });
  await c.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  if (tmavy) await c.addInitScript(() => { try { localStorage.setItem('PZ_MOTIV', 'dark'); } catch (e) { /* bez úložiště */ } });
  const p = await c.newPage(); await p.goto(base + URL_INDEX, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(600);
  const o = await p.evaluate(mer); o.motiv = await p.evaluate(() => document.documentElement.getAttribute('data-motiv'));
  await c.close(); return o;
}
const vady = o => {
  const v = [];
  if (o.emoji.length) v.push(o.emoji.length + '× emoji: ' + o.emoji.slice(0, 3).join('; '));
  if (o.pocet < 50) v.push('ikon jen ' + o.pocet + ' (podlaha 50)');
  if (o.bezAria) v.push(o.bezAria + ' ikon bez aria-hidden');
  if (o.male) v.push(o.male + ' ikon menších než 12 px');
  return v.join(' | ');
};

(async () => {
  const srv = await server(), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  console.log('\n── Úvodní stránka přijímaček: ikony místo emoji ──\n');
  for (const tmavy of [false, true]) {
    const o = await zmer(browser, base, tmavy);
    ok(o.motiv === (tmavy ? 'dark' : 'light'), (tmavy ? 'tmavý' : 'světlý') + ' vzhled je zapnutý (data-motiv = ' + o.motiv + ')');
    ok(vady(o) === '', (tmavy ? 'tmavý' : 'světlý') + ' vzhled: ' + o.pocet + ' ikon, žádné emoji v textu, ikony skryté čtečce a ≥ 12 px', vady(o));
  }
  srv.close();

  const SAB = [
    ['emoji vrácené do řádku archivu', { 'index.html': ['<span class="ico"><svg class="pz-ik"', '<span class="ico">\u{1F4C4}</span><svg class="pz-ik"'] }, /emoji/],
    ['emoji vrácené do legendy (Klíč)', { 'index.html': ['<b><svg class="pz-ik"', '<b>✅<svg class="pz-ik"'] }, /emoji/],
    ['emoji v odpočtu', { 'index.html': ['<span class="cc-head">', '<span class="cc-head">⏳ '] }, /emoji/],
    ['ikona bez aria-hidden', { 'index.html': ['<svg class="pz-ik" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"', '<svg class="pz-ik" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'] }, /bez aria-hidden/]
  ];
  for (const [popis, prepis, vzor] of SAB) {
    const s = await server(prepis), b = 'http://127.0.0.1:' + s.address().port;
    const v = vady(await zmer(browser, b, false));
    ok(s.prepsano > 0, 'sabotáž „' + popis + '“ se aplikovala (přepis uplatněn ' + s.prepsano + '×)');
    ok(vzor.test(v), 'sabotáž „' + popis + '“ je chycena (' + (v || 'nic').slice(0, 90) + ')', 'test prošel i nad rozbitou stránkou');
    s.close();
  }
  await browser.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
