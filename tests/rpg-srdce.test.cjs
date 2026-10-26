/* ═════════════════════════════════════════════════════════════════
   Životy v RPG hrách jsou pixelová srdíčka, ne emoji (3.–9. ročník, boj i Věž legend).

   Vizuální revize 26. 10. 2026: hry stojí na pixel-artových spritech a ikonách (`rpg-icons.js`), jenže životy
   v boji — to, na co se dítě dívá celou dobu — byly emoji ❤️, které se na každém systému kreslí jinak
   (iPad jinak než Android) a vedle ostrých pixelů vypadají jako cizí těleso. Věž legend navíc ztracený život
   ukazovala emoji 🖤. Teď je to ikona `heart` z `RPGIcons` (12 × 12, barva z `--red-t`), ztracený život
   je tentýž tvar šedý. Emoji zůstalo jen jako záloha, kdyby se `rpg-icons.js` nenačetl (mezipaměť po nasazení).

   Měří se na vykreslené stránce, ne ve zdroji:
     • boj: v `#player-hp` je právě tolik `.heart`, kolik má boj životů (`BT.maxHp`), každé nese pixelový `<svg>`
       a žádný text s emoji; třída `.heart` zůstává (testy životů a deep harness podle ní počítají);
     • Věž legend (6.–9. ročník): `#tw-lives` má tři `.tw-heart` s `<svg>`, bez emoji ❤️ a 🖤;
     • bez `rpg-icons.js` (síť ho zablokuje) se boj stejně vykreslí a srdíčka jsou emoji — hra se nerozbije;
     • srdíčko je vidět: šířka i výška ≥ 12 px (na tabletu 820 px i telefonu 390 px).
   Sabotáže (přepis odpovědi serveru, soubory se nemění): šablona srdce v 6. ročníku zpět na emoji a Věž
   v `rpg-2stupen.js` zpět na emoji — test je musí najít a jmenovat hru.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { projdi } = require('./vnitrni-obrazovky.cjs');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
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
      if (pr) { const t = fs.readFileSync(fp, 'utf8'); if (t.includes(pr[0])) s.prepsano++; return p.end(t.split(pr[0]).join(pr[1])); }
      fs.createReadStream(fp).pipe(p);
    });
    s.prepsano = 0;
    s.listen(0, () => res(s));
  });
}

/* běží v prohlížeči: stav srdíček v boji */
function merBoj() {
  const el = document.getElementById('player-hp');
  if (!el) return { chybi: true };
  const srdce = [...el.querySelectorAll('.heart')];
  const rc = srdce.map(h => { const s = h.querySelector('svg.px-ic'); const r = (s || h).getBoundingClientRect(); return { svg: !!s, w: r.width, h: r.height }; });
  return {
    chybi: false, pocet: srdce.length, maxHp: typeof BT !== 'undefined' && BT ? BT.maxHp : -1,
    bezSvg: rc.filter(x => !x.svg).length, male: rc.filter(x => x.svg && (x.w < 12 || x.h < 12)).length,
    emoji: /❤|\u{1F5A4}/u.test(el.textContent)
  };
}
/* běží v prohlížeči: životy ve Věži legend */
function merVez() {
  const el = document.getElementById('tw-lives');
  if (!el) return { chybi: true };
  const srdce = [...el.querySelectorAll('.tw-heart')];
  return { chybi: false, pocet: srdce.length, bezSvg: srdce.filter(h => !h.querySelector('svg.px-ic')).length, emoji: /❤|\u{1F5A4}/u.test(el.textContent) };
}

/* všechny obrazovky boje (a Věž) sedmi her v jednom rozměru */
async function zmer(browser, base, volby, filtr) {
  const boje = {}, veze = {};
  const { chyby } = await projdi(browser, base, async (page, jm) => {
    const g = jm.split(' ')[1];
    if (/ \/ boj$/.test(jm)) boje[g] = await page.evaluate(merBoj);
    if (/ \/ věž$/.test(jm)) veze[g] = await page.evaluate(merVez);
  }, volby, filtr);
  return { boje, veze, chyby };
}
const TABLET = { viewport: { width: 820, height: 1100 }, isMobile: true, hasTouch: true };
const TELEFON = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const popis = (o, jm) => Object.entries(o).filter(([, v]) => v.chybi || v.pocet < 1 || v.bezSvg > 0 || v.emoji || v.male > 0)
  .map(([g, v]) => jm + ' ' + g + ': ' + (v.chybi ? 'prvek chybí' : v.pocet + ' srdcí, bez svg ' + v.bezSvg + ', emoji ' + v.emoji + ', malých ' + (v.male | 0))).join(' | ');

(async () => {
  const srv = await server(), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  console.log('\n── Životy jako pixelová srdíčka ──\n');
  for (const [jm, volby] of [['tablet 820 px', TABLET], ['telefon 390 px', TELEFON]]) {
    const r = await zmer(browser, base, volby);
    ok(r.chyby.length === 0, jm + ': každá obrazovka se dala otevřít', r.chyby.slice(0, 2).join(' | '));
    ok(Object.keys(r.boje).length === 7, jm + ': boj změřen v sedmi hrách (' + Object.keys(r.boje).join(', ') + ')');
    ok(popis(r.boje, 'boj') === '', jm + ': srdíčka v boji jsou pixelový svg, žádné emoji', popis(r.boje, 'boj'));
    ok(Object.values(r.boje).every(v => v.pocet === v.maxHp && v.maxHp > 0), jm + ': počet srdcí = životy boje ' + JSON.stringify(Object.fromEntries(Object.entries(r.boje).map(([g, v]) => [g, v.pocet + '/' + v.maxHp]))));
    ok(Object.keys(r.veze).length === 4, jm + ': Věž změřena ve čtyřech hrách 6.–9. (' + Object.keys(r.veze).join(', ') + ')');
    ok(popis(r.veze, 'věž') === '' && Object.values(r.veze).every(v => v.pocet === 3), jm + ': životy ve Věži jsou tři pixelová srdíčka', popis(r.veze, 'věž'));
  }
  /* bez rpg-icons.js: záloha emoji, hra se nerozbije */
  {
    const c = await browser.newContext(TABLET);
    await c.route('**/*', r => { const u = r.request().url(); return u.startsWith(base) && !/rpg-icons\.js/.test(u) ? r.continue() : r.abort(); });
    const p = await c.newPage(); const chyby = []; p.on('pageerror', e => chyby.push(e.message));
    await p.goto(base + '/projects/rpg-mat-9.html?preview=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500);
    const o = await p.evaluate(() => { BT = { hp: 2, maxHp: 3 }; updatePlayerHp(); const e = document.getElementById('player-hp'); return { n: e.querySelectorAll('.heart').length, ztracene: e.querySelectorAll('.heart.lost').length, emoji: /❤/.test(e.textContent), svg: e.querySelectorAll('svg').length }; });
    ok(o.n === 3 && o.ztracene === 1 && o.emoji && o.svg === 0 && chyby.length === 0, 'bez rpg-icons.js: tři srdíčka, jedno ztracené, jako emoji a bez chyby', JSON.stringify(o) + ' ' + chyby.slice(0, 1).join());
    await c.close();
  }
  srv.close();

  /* sabotáže: měří se jedna hra */
  const SAB = [
    ['šablona srdce v 6. ročníku zpět na emoji', { 'rpg-mat-6.html': ['data-i="${i}">${_srdce}</span>', 'data-i="${i}">❤️</span>'] }, o => popis(o.boje, 'boj'), /boj 6/],
    ['Věž v rpg-2stupen.js zpět na emoji', { 'rpg-2stupen.js': ['if(ic){let h=', 'if(false){let h='] }, o => popis(o.veze, 'věž'), /věž 6/]
  ];
  for (const [popisS, prepis, mer, vzor] of SAB) {
    const s = await server(prepis), b = 'http://127.0.0.1:' + s.address().port;
    const r = await zmer(browser, b, TABLET, o => o.jm === 'RPG 6');
    const v = mer(r);
    ok(s.prepsano > 0, 'sabotáž „' + popisS + '“ se aplikovala (přepis uplatněn ' + s.prepsano + '×)');
    ok(vzor.test(v), 'sabotáž „' + popisS + '“ je chycena (' + (v || 'nic').slice(0, 90) + ')', 'test prošel i nad emoji');
    s.close();
  }
  await browser.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
