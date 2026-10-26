/* ═════════════════════════════════════════════════════════════════
   Minimální velikost písma v RPG hrách (3.–9. ročník) a hubu: nic pod 12 px.

   Vizuální revize 26. 10. 2026: na tabletu 820 px bylo 27 % znaků ze 60 vnitřních obrazovek RPG pod 12 px
   (popisy odznaků 9 px, názvy odznaků a procenta 10 px, popisek „TRÉNINK = procvičování“, tlačítka „← HUB“
   a „💡 NÁPOVĚDA“, ceny a názvy v obchodě, stav mapových uzlů 11 px); přijímačky měly pod 12 px 1–4 %.
   Děti čtou na tabletu — malé písmo není kosmetika. Jedna úprava je 223 deklarací v 7 hrách, hubu,
   `rpg-wallet.js` a `rpg-cloud.js` (kopie v každé hře, proto se hlídá MĚŘENÍM vykresleného textu,
   ne hledáním řetězce ve zdroji: rozměr může vzniknout i z `em`, z media query nebo z JS).

   Měří se skutečně vykreslený text všech obrazovek, kam se žák dostane (sdílený seznam `vnitrni-obrazovky.cjs`:
   mapa, oblast, boj, boj po chybě, trénink, teorie, profil, obchod, věž) na tabletu 820 px i telefonu 390 px,
   protože media query přepisují velikosti jinak (`.attr-nm` vyšel pod 12 px jen na telefonu).
   Vynechané: `sup`/`sub` (prohlížeč je zmenší sám, mocnina „2ⁿ“).
   Sabotáže (přepis odpovědi serveru, soubory se nemění): popis odznaku 9 px v jedné hře a popis odznaku
   v `rpg-wallet.js` 11 px — test je musí najít a jmenovat selektor.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { projdi } = require('./vnitrni-obrazovky.cjs');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const PRAH = 12;
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
      if (pr) { const t = fs.readFileSync(fp, 'utf8'); if (t.includes(pr[0])) s.prepsano++; return p.end(t.split(pr[0]).join(pr[1])); }
      fs.createReadStream(fp).pipe(p);
    });
    s.prepsano = 0;
    s.listen(0, () => res(s));
  });
}

/* běží v prohlížeči: viditelný text a jeho velikost; vrací jen text pod prahem */
function mer(prah) {
  const male = []; let celkem = 0;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const t = n.data.trim(); if (!t) continue;
    const e = n.parentElement; if (!e || e.closest('script,style,svg,noscript,sup,sub')) continue;
    const rc = e.getBoundingClientRect(); if (rc.width < 2 || rc.height < 2) continue;
    let skryty = false;
    for (let x = e; x && x !== document.body; x = x.parentElement) {
      const cs = getComputedStyle(x);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) { skryty = true; break; }
    }
    if (skryty) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize); celkem += t.length;
    if (fs < prah) {
      const sel = (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).join('.') : '') || e.tagName.toLowerCase();
      male.push({ fs, sel, delka: t.length, text: t.slice(0, 24) });
    }
  }
  return { celkem, male };
}

/* všechny obrazovky RPG v jednom rozměru; vrací souhrn a nálezy podle selektoru */
async function zmer(browser, base, volby, filtr) {
  const nalezy = new Map(); let znaku = 0, obr = 0;
  const jmena = new Set();
  const { chyby } = await projdi(browser, base, async (page, jm) => {
    if (!jm.startsWith('RPG')) return;
    const o = await page.evaluate(mer, PRAH);
    obr++; jmena.add(jm.split(' / ')[0]); znaku += o.celkem;
    for (const m of o.male) {
      const k = m.fs + ' px ' + m.sel; const a = nalezy.get(k) || { delka: 0, kde: new Set(), text: m.text };
      a.delka += m.delka; a.kde.add(jm); nalezy.set(k, a);
    }
  }, volby, filtr);
  return { nalezy, znaku, obr, hry: jmena.size, chyby };
}
const popis = n => [...n.entries()].sort((a, b) => b[1].delka - a[1].delka).slice(0, 4).map(([k, a]) => k + ' (' + a.delka + ' zn., „' + a.text + '“, ' + [...a.kde][0] + ')').join(' | ');

(async () => {
  const srv = await server(), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  console.log('\n── Minimální písmo v RPG (nic pod ' + PRAH + ' px) ──\n');
  const ROZMERY = [['tablet 820 px', { viewport: { width: 820, height: 1100 }, isMobile: true, hasTouch: true }], ['telefon 390 px', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]];
  for (const [jm, volby] of ROZMERY) {
    const r = await zmer(browser, base, volby);
    ok(r.chyby.length === 0, jm + ': každá obrazovka se dala otevřít', r.chyby.slice(0, 2).join(' | '));
    ok(r.hry === 7 && r.obr >= 60 && r.znaku >= 30000, jm + ': změřeno ' + r.obr + ' obrazovek sedmi her, ' + r.znaku + ' znaků (podlaha 60 / 30 000; naměřeno 60 / ~42 000)');
    ok(r.nalezy.size === 0, jm + ': žádný text pod ' + PRAH + ' px', r.nalezy.size + ' skupin: ' + popis(r.nalezy));
  }
  /* hub: jeho vlastní obrazovka (karty ročníků, profil, odznaky) */
  {
    const c = await browser.newContext({ viewport: { width: 820, height: 1100 }, isMobile: true, hasTouch: true });
    await c.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    const p = await c.newPage(); await p.goto(base + '/projects/rpg-matematika.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(700);
    const o = await p.evaluate(mer, PRAH); await c.close();
    ok(o.celkem >= 800, 'hub: změřeno ' + o.celkem + ' znaků (podlaha 800)');
    ok(o.male.length === 0, 'hub: žádný text pod ' + PRAH + ' px', o.male.slice(0, 3).map(m => m.fs + ' px ' + m.sel + ' „' + m.text + '“').join(' | '));
  }
  srv.close();

  /* sabotáže: měří se jedna hra (6. ročník, 9 obrazovek), ať test nebrní dlouho */
  const SAB = [
    ['popis odznaku 9 px v 6. ročníku', { 'rpg-mat-6.html': ['.ach-slot .ach-desc{font-family:var(--px);font-weight:400;font-size:12px', '.ach-slot .ach-desc{font-family:var(--px);font-weight:400;font-size:9px'] }, /9 px \.ach-desc/],
    ['popis odznaku v rpg-wallet.js 11 px', { 'rpg-wallet.js': ['.rw-gach-desc{font-size:12px', '.rw-gach-desc{font-size:11px'] }, /11 px \.rw-gach-desc/]
  ];
  for (const [popisS, prepis, vzor] of SAB) {
    const s = await server(prepis), b = 'http://127.0.0.1:' + s.address().port;
    const r = await zmer(browser, b, ROZMERY[0][1], o => o.jm === 'RPG 6');
    const vsechny = [...r.nalezy.keys()].join(' | ');
    ok(s.prepsano > 0, 'sabotáž „' + popisS + '“ se aplikovala (přepis uplatněn ' + s.prepsano + '×)');
    ok(vzor.test(vsechny), 'sabotáž „' + popisS + '“ je chycena (' + (vsechny || 'nic').slice(0, 80) + ')', 'test prošel i nad malým písmem');
    s.close();
  }
  await browser.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
