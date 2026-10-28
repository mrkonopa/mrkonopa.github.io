/* ══════════════════════════════════════════════════════════════════
   Typografie přijímaček na STRÁNKÁCH: PZ.typoDom + MutationObserver (prijimacky-core.js).

   Čistá funkce `PZ.typo` má vlastní test (prijimacky-typografie.test.cjs). Tady se měří to, co funkce
   sama neslíbí: že se opravdu pustí na VŠECHNO, co stránka zobrazí (statický text, textContent, innerHTML
   i `PZ.esc`, text přidaný později), že vynechá, co se měnit nesmí (textarea, script, style, svg, hodnotu
   vstupu, `data-bez-typo`), že se nezacyklí a že na skutečných obrazovkách (procvičování, test, diagnostika,
   statistiky, konstrukce) po ní nezbyde ani jedno „-5“ s pomlčkou ani „12 cm“ s obyčejnou mezerou.

   Sabotáž je v testu samém (přepis odpovědi serveru, žádný zásah do souborů): bez `typoStart()` musí stejný
   sken na stejných obrazovkách vady najít — jinak by byl slepý a „0 vad“ by nic neznamenalo.
   Známé omezení (schválně není hlídáno): číslo a jednotka v RŮZNÝCH textových uzlech (`<b>5</b> cm`) se nespojí.
   Spusť: node tests/prijimacky-typografie-dom.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const { ROOT, STRANKY } = require('./stranky.cjs');
const PZ = require('./pz-pruchody.cjs');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const STR = STRANKY.filter(s => /^pz-/.test(s.id));

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const f = path.normalize(path.join(ROOT, u));
      if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(0, () => res(s));
  });
}

async function otevri(browser, base, url, { prepis = {}, viewport = { width: 1000, height: 900 } } = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  for (const [koncovka, fn] of Object.entries(prepis)) {
    await ctx.route('**/' + koncovka, async r => {
      const res = await r.fetch(); const t = await res.text();
      await r.fulfill({ response: res, body: fn(t) });
    });
  }
  const page = await ctx.newPage();
  await page.goto(base + url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  if (url.indexOf('doplnky') < 0) await page.waitForFunction(() => window.PZ, null, { timeout: 8000 });
  await page.waitForTimeout(250);
  return { ctx, page };
}

/* Sken viditelných textových uzlů: kolik jich je, kolik má pevnou mezeru u jednotky / minus, a které ještě mají vadu.
   Vynechává stejné prvky jako typoDom (to je záměr; seznam je tu schválně opsaný, ne převzatý z jádra). */
const SKEN = () => {
  const SKIP = 'script,style,textarea,svg,noscript,[data-bez-typo]';
  const RE_M = /(^|[\s(\[=;:·×<>\/])-(?=\d)/;
  const RE_J = /\d (?:cm|dm|mm|km|kg|dkg|mg|ml|dl|hl|Kč|min|hod|[mglht]|%)(?![\p{L}\d])/u;
  const RE_NB = /\d (?:cm|dm|mm|km|kg|dkg|mg|ml|dl|hl|Kč|min|hod|[mglht]|%)/u;
  const w = document.createTreeWalker(document.body, 4);
  let uzlu = 0, nbJednotka = 0, minus = 0; const vady = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.parentElement && n.parentElement.closest(SKIP)) continue;
    const t = n.nodeValue; uzlu++;
    if (RE_NB.test(t)) nbJednotka++;
    if (t.indexOf('−') >= 0) minus++;
    if (RE_M.test(t) || RE_J.test(t)) vady.push(t.replace(/\s+/g, ' ').trim().slice(0, 80));
  }
  return { uzlu, nbJednotka, minus, vady };
};

/* Obrazovky, na kterých se skenuje: základ každé stránky + průchody z pz-pruchody.cjs. */
async function projdi(browser, base, prepis) {
  const sum = { uzlu: 0, nbJednotka: 0, minus: 0, obrazovek: 0, vady: [], zprava: [] };
  const sken = async (p, kde) => {
    await p.waitForTimeout(120);
    const r = await p.evaluate(SKEN);
    /* doplňky jádro nenačítají: jejich pevné mezery jsou napsané přímo v HTML a typoStart() je nevytváří,
       takže do porovnání „s typoStart() / bez něj“ nepatří (vady se ale počítají i tam) */
    if (!kde.startsWith('pz-dopl')) sum.nbJednotka += r.nbJednotka;
    sum.uzlu += r.uzlu; sum.minus += r.minus; sum.obrazovek++;
    r.vady.forEach(v => sum.vady.push(kde + ': „' + v + '“'));
  };
  for (const s of STR) {
    const { ctx, page } = await otevri(browser, base, s.url, { prepis });
    try {
      await sken(page, s.id + ' · základ');
      if (s.id === 'pz-proc') {
        /* každé téma: úloha → tři nápovědy → po odevzdání řešení (nejvíc textu s čísly a jednotkami) */
        const n = await page.evaluate(() => document.querySelectorAll('button.topic-card').length);
        for (let i = 0; i < n; i++) {
          await page.evaluate(i => { document.querySelectorAll('button.topic-card')[i].click(); prHint(); prHint(); prHint(); }, i);
          await sken(page, s.id + ' · téma ' + i + ' · nápovědy');
          await page.evaluate(() => grade(false));
          await sken(page, s.id + ' · téma ' + i + ' · řešení');
          await page.evaluate(() => { prExit(); });
          await page.waitForTimeout(80);
        }
      }
      for (const [id, kroky] of [['pz-diag', ['úloha 1', 'úloha 2', 'úloha 3', 'konec']], ['pz-stat', ['s daty']], ['pz-test', ['běžící test', 'rozbor']]]) {
        if (s.id !== id) continue;
        const P = PZ[id];
        await page.evaluate(P.pripravit);
        for (const k of kroky) {
          const d = await page.evaluate(P.prepnout, k); if (d) throw new Error('průchod ' + id + ': ' + d);
          await sken(page, id + ' · ' + k);
        }
      }
      if (s.id === 'pz-konstr') {
        const P = PZ['pz-konstr']; await page.evaluate(P.pripravit).catch(() => {});
        const seznam = await page.evaluate(P.seznam);
        for (const k of [seznam[0], seznam[Math.floor(seznam.length / 2)]]) {
          const d = await page.evaluate(P.prepnout, k); if (d) throw new Error('průchod pz-konstr: ' + d);
          await sken(page, 'pz-konstr · ' + k);
        }
      }
    } catch (e) { sum.zprava.push(s.id + ': ' + String(e.message).slice(0, 120)); }
    await ctx.close();
  }
  return sum;
}

(async () => {
  console.log('\n── Přijímačky: typografie na stránkách ──\n');
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  try {
    /* 1. Zapojení: jádro je na všech 7 stránkách, typoDom je exportované */
    console.log('· jádro na stránkách');
    for (const s of STR.filter(x => x.id !== 'pz-dopl')) {   // doplňky jádro nenačítají (jediný skript je motiv.js); jejich text je statický, má &nbsp; přímo v HTML a hlídá ho sken níže
      const { ctx, page } = await otevri(browser, base, s.url);
      const r = await page.evaluate(() => ({ typo: typeof PZ.typo, dom: typeof PZ.typoDom, t: PZ.typo ? PZ.typo('x = -3 cm') : '' }));
      ok(r.typo === 'function' && r.dom === 'function' && r.t === 'x = −3 cm', s.id + ': PZ.typo a PZ.typoDom jsou k dispozici a fungují', JSON.stringify(r));
      await ctx.close();
    }

    /* 2. Syntetické uzly: co se mění a co ne */
    console.log('· co se mění a co ne');
    {
      const { ctx, page } = await otevri(browser, base, '/projects/prijimacky-matematika/procvicovani.html');
      await page.evaluate(() => {
        const d = document.createElement('div'); d.id = 'tx';
        d.innerHTML = '<p id="t1">Výsledek: -5, délka 12 cm.</p><textarea id="t2">-5 a 12 cm</textarea>' +
          '<svg width="10" height="10"><text id="t3" y="8">-5 a 12 cm</text></svg><div data-bez-typo><p id="t4">-5 a 12 cm</p></div>' +
          '<style id="t5">.x{content:"-5 a 12 cm"}</style><input id="t6" value="-5 a 12 cm"><p id="t7">2023-10-05, A-1, 5-7, x - 3</p>';
        document.body.appendChild(d);
      });
      await page.waitForTimeout(80);
      const r = await page.evaluate(() => {
        const t = id => document.getElementById(id);
        return { t1: t('t1').textContent, t2: t('t2').value, t3: t('t3').textContent, t4: t('t4').textContent, t5: t('t5').textContent, t6: t('t6').value, t7: t('t7').textContent };
      });
      ok(r.t1 === 'Výsledek: −5, délka 12 cm.', 'vložený odstavec se opraví (minus i pevná mezera)', JSON.stringify(r.t1));
      ok(r.t2 === '-5 a 12 cm', 'textarea zůstane beze změny', JSON.stringify(r.t2));
      ok(r.t3 === '-5 a 12 cm', 'text v <svg> zůstane beze změny', JSON.stringify(r.t3));
      ok(r.t4 === '-5 a 12 cm', 'prvek s data-bez-typo zůstane beze změny', JSON.stringify(r.t4));
      ok(r.t5 === '.x{content:"-5 a 12 cm"}', '<style> zůstane beze změny', JSON.stringify(r.t5));
      ok(r.t6 === '-5 a 12 cm', 'hodnota <input> (co žák píše) zůstane beze změny', JSON.stringify(r.t6));
      ok(r.t7 === '2023-10-05, A-1, 5-7, x - 3', 'datum, A-1, rozsah a odčítání se nemění', JSON.stringify(r.t7));

      /* pozdější změny: nodeValue, textContent, innerHTML, přidaný uzel */
      await page.evaluate(() => {
        const p = document.getElementById('t1');
        p.firstChild.nodeValue = 'Teď -9 m a 3 kg';
      });
      await page.waitForTimeout(60);
      ok(await page.evaluate(() => document.getElementById('t1').textContent) === 'Teď −9 m a 3 kg', 'změna nodeValue existujícího uzlu se opraví');
      await page.evaluate(() => { document.getElementById('t1').textContent = 'Zase -3 kg a 25 %'; });
      await page.waitForTimeout(60);
      ok(await page.evaluate(() => document.getElementById('t1').textContent) === 'Zase −3 kg a 25 %', 'přepsání textContent se opraví');
      await page.evaluate(() => { document.getElementById('t1').innerHTML = '<b>Pozor:</b> x = -4 : (-2), 500 Kč'; });
      await page.waitForTimeout(60);
      ok(await page.evaluate(() => document.getElementById('t1').textContent) === 'Pozor: x = −4 : (−2), 500 Kč', 'přepsání innerHTML se opraví');
      await page.evaluate(() => { document.getElementById('t1').appendChild(document.createTextNode(' a -7 °C')); });
      await page.waitForTimeout(60);
      ok((await page.evaluate(() => document.getElementById('t1').textContent)).endsWith(' a −7 °C'), 'přidaný textový uzel se opraví');

      /* přes skutečnou cestu procvičování: nápověda jde přes PZ.esc → innerHTML */
      await page.evaluate(() => { document.querySelectorAll('button.topic-card')[0].click(); PR.hints = ['Zkus -3 cm', 'Dej x = -4 : (-2)', 'Výsledek: -7,45 Kč']; prHint(); prHint(); prHint(); });
      await page.waitForTimeout(80);
      const nap = await page.evaluate(() => document.getElementById('pr-hints').textContent);
      ok(nap.includes('−3 cm') && nap.includes('x = −4 : (−2)') && nap.includes('−7,45 Kč'), 'nápověda vykreslená přes PZ.esc/innerHTML je opravená', JSON.stringify(nap));

      /* nezacyklí se: po změně se mutace uklidní a počet záznamů je malý */
      const mut = await page.evaluate(() => new Promise(res => {
        const cil = document.getElementById('t1'); let n = 0;
        const o = new MutationObserver(z => { n += z.length; }); o.observe(cil, { childList: true, subtree: true, characterData: true });
        cil.textContent = 'a -1 cm, -2 kg, -3 m, 4 l, 5 %';
        setTimeout(() => { const a = n; setTimeout(() => { o.disconnect(); res({ a, b: n }); }, 300); }, 300);
      }));
      ok(mut.a <= 8 && mut.a === mut.b, 'oprava se nezacyklí: ' + mut.a + ' záznamů mutace a po dalších 300 ms stále ' + mut.b + ' (≤ 8 a beze změny)');
      await ctx.close();
    }

    /* 3. Skutečné obrazovky: po typo nezbyde žádná vada */
    console.log('· skutečné obrazovky');
    const s = await projdi(browser, base, {});
    s.zprava.forEach(z => console.log('  ⚠️  ' + z));
    ok(s.zprava.length === 0, 'všechny průchody obrazovkami proběhly', s.zprava.join(' | '));
    ok(s.obrazovek >= 30, 'změřeno dost obrazovek: ' + s.obrazovek + ' (naměřeno 36, podlaha 30)');
    ok(s.uzlu > 3000, 'změřeno dost textových uzlů: ' + s.uzlu + ' (podlaha 3000)');
    ok(s.nbJednotka > 60, 'pevná mezera u jednotky se na obrazovkách skutečně objevila: ' + s.nbJednotka + '× (naměřeno 125 bez doplňků, podlaha 60)');
    ok(s.vady.length === 0, 'na žádné obrazovce nezbývá „-5“ s pomlčkou ani „12 cm“ s obyčejnou mezerou', s.vady.length + '× např. ' + s.vady.slice(0, 3).join(' | '));
    console.log('  ℹ️  obrazovek ' + s.obrazovek + ', textových uzlů ' + s.uzlu + ', pevná mezera u jednotky ' + s.nbJednotka + '×, minus ' + s.minus + '×');

    /* 4. Sabotáž přepisem odpovědi: bez typoStart() musí stejný sken vady najít, jinak je slepý */
    console.log('· sabotáž: bez typoStart() sken vady najde');
    const bez = await projdi(browser, base, { 'prijimacky-core.js': t => { if (t.split('\n  typoStart();\n').length !== 2) throw new Error('volání typoStart(); se v jádře nenašlo právě jednou'); return t.replace(/\n  typoStart\(\);\n/, '\n'); } });
    ok(bez.vady.length > 80, 'bez typoStart() sken najde vady: ' + bez.vady.length + '× (naměřeno 127–187, podlaha 80)');
    ok(bez.nbJednotka === 0 || bez.nbJednotka < s.nbJednotka / 5, 'bez typoStart() pevná mezera téměř nevzniká: ' + bez.nbJednotka + '× proti ' + s.nbJednotka + '×');
  } finally { await browser.close(); srv.close(); }
  console.log('\n' + (fail ? '❌' : '✅') + ' Typografie na stránkách: ' + pass + ' ✅, ' + fail + ' ❌');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
