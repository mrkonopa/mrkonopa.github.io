/* ══════════════════════════════════════════════════════════════════════════════════════
   Čitelnost písma v obrázcích úloh NA TELEFONU (prijimacky-core.js: svgCitelnost / svgPosun + prijimacky.css).

   Obrázek se na úzké obrazovce zmenší na šířku kontejneru, takže písmo z kresby (12 jednotek) vyšlo na 360 px
   až 7,5 px (čtvercová síť), 8,9 (trojúhelníková), 9,3 (sloupcový graf) — děti čtou čísla v trojúhelnících, ne
   dekoraci. Oprava: obrázek, jehož nejmenší písmo by vyšlo pod 10,5 px, dostane minimální šířku podle písma
   (cíl 11 px) a kontejner se posouvá prstem s nápovědou. Tady se měří VYKRESLENÉ písmo (velikost × skutečné
   měřítko z getScreenCTM, takže vnořená <svg> se započítají), ne zdroj.

   Měří se na úlohách ze SKUTEČNÝCH bank (test: `RPG_CERMAT_9.genSlot` všech pozic, základ: `PZ_TOPICS.item(okruh,
   'zaklad')`), zobrazených skutečným vykreslením procvičování (`prNext`) ve skutečném kontejneru `#pr-svg`, na dvou
   telefonech (360 a 390 px). Sabotáž je v testu samém (přepis odpovědi serveru): bez `svgStart()` v jádře a bez
   pravidla v CSS musí stejné měření najít drobné písmo — jinak by „0 vad“ nic neznamenalo.
   Spusť: node tests/prijimacky-svg-pismo.test.cjs
   ══════════════════════════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };

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

/* Na stránce procvičování: každý nález = { klic, min (nejmenší vykreslené písmo v px), posun (kontejner má třídu),
   nevejde (obrázek skutečně přesahuje kontejner), tip (nápověda se opravdu zobrazuje), pretek (přetéká STRÁNKA) } */
/* `sirka` = šířka telefonu: s isMobile se innerWidth roztáhne na šířku obsahu, takže přetečení proti oknu by nikdy nevyšlo */
const MERENI = async sirka => {
  const dalsiSnimek = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const box = document.getElementById('pr-svg');
  const nalezy = [];
  const mer = async (klic, task) => {
    const it = Object.assign({}, task, { prompt: task.prompt || 'otázka', type: 'text', ans: '1', hints: [] });
    PZ_TOPICS.item = () => it;
    prNext();
    await Promise.resolve();                                   // pozorovatel proběhne dřív než tahle řádka, ale před prvním snímkem
    const pretekHned = document.documentElement.scrollWidth > sirka + 1;
    await dalsiSnimek();
    const svg = box.querySelector('svg');
    if (!svg) return;
    let min = Infinity;
    svg.querySelectorAll('text').forEach(t => {
      if (!t.textContent.trim()) return;
      const fs = parseFloat(getComputedStyle(t).fontSize), m = t.getScreenCTM();
      if (m) min = Math.min(min, fs * Math.hypot(m.a, m.b));
    });
    if (!isFinite(min)) return;
    const pseudo = getComputedStyle(box, '::after');
    nalezy.push({
      klic, min: +min.toFixed(2), posun: box.classList.contains('pz-svg-posun'),
      nevejde: box.scrollWidth > box.clientWidth + 1,
      tip: box.classList.contains('pz-svg-posun') && pseudo.content !== 'none' && /posuň/.test(pseudo.content) && pseudo.display !== 'none',
      pretek: pretekHned || document.documentElement.scrollWidth > sirka + 1,
    });
  };
  const B = window.RPG_CERMAT_9, n = B.slotCount();
  prStart(PZ_TOPICS.list[0].id);
  /* test: z každé pozice vezmi po několika úlohách od každého titulu s obrázkem (generátory jsou náhodné, titul je stabilní) */
  for (let s = 0; s < n; s++) {
    const po = {};
    for (let k = 0; k < 160; k++) {
      let t; try { t = B.genSlot(s); } catch (e) { continue; }
      if (!t || !t.svg) continue;
      (po[t.title || '?'] = po[t.title || '?'] || []).push(t);
    }
    for (const [titul, ulohy] of Object.entries(po)) for (const t of ulohy.slice(0, 3)) await mer('test ' + s + ' · ' + titul, t);
  }
  /* základ: každý okruh */
  for (const okruh of PZ_TOPICS.list) {
    const po = {};
    for (let k = 0; k < 60; k++) {
      let t; try { t = PZ_TOPICS.item(okruh.id, 'zaklad'); } catch (e) { continue; }
      if (!t || !t.svg) continue;
      const kl = okruh.id + ' · ' + (t.varianta || t.title || '?');
      (po[kl] = po[kl] || []).push(t);
    }
    for (const [kl, ulohy] of Object.entries(po)) for (const t of ulohy.slice(0, 2)) await mer('základ ' + kl, t);
  }
  return nalezy;
};

async function zmer(browser, base, sirka, vyska, prepis) {
  const ctx = await browser.newContext({ viewport: { width: sirka, height: vyska }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  for (const [koncovka, fn] of Object.entries(prepis || {})) {
    await ctx.route('**/' + koncovka, async r => {
      const res = await r.fetch(); const t = await res.text();
      await r.fulfill({ response: res, body: fn(t) });
    });
  }
  const page = await ctx.newPage();
  const chyby = []; page.on('pageerror', e => chyby.push(String(e.message).slice(0, 120)));
  await page.goto(base + 'projects/prijimacky-matematika/procvicovani.html', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForFunction(() => window.PZ && window.PZ_TOPICS && window.RPG_CERMAT_9, null, { timeout: 10000 });
  await page.waitForTimeout(250);
  const nalezy = await page.evaluate(MERENI, sirka);
  await ctx.close();
  return { nalezy, chyby };
}

const souhrn = nalezy => {
  const kl = {}; nalezy.forEach(n => { const o = kl[n.klic] = kl[n.klic] || { min: Infinity, posun: 0, nevejde: 0, bezPosunu: 0, tip: 0, n: 0 }; o.min = Math.min(o.min, n.min); o.n++; if (n.posun) o.posun++; if (n.nevejde) o.nevejde++; if (n.nevejde && !n.posun) o.bezPosunu++; if (n.tip) o.tip++; });
  return kl;
};

(async () => {
  const server = await serve(); const base = 'http://localhost:' + server.address().port + '/';
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  try {
    for (const [sirka, vyska] of [[360, 740], [390, 844]]) {
      console.log('· telefon ' + sirka + ' px');
      const { nalezy, chyby } = await zmer(browser, base, sirka, vyska);
      const kl = souhrn(nalezy), nazvy = Object.keys(kl);
      const nejmensi = nalezy.reduce((a, b) => b.min < a.min ? b : a, nalezy[0]);
      ok(chyby.length === 0, 'žádná chyba stránky při měření', chyby.slice(0, 2).join(' | '));
      ok(nalezy.length > 120, 'změřeno dost obrázků: ' + nalezy.length + ' (naměřeno 161, podlaha 120)');
      ok(nazvy.length > 40, 'změřeno dost různých úloh s obrázkem: ' + nazvy.length + ' (podlaha 40)');
      ok(nejmensi.min >= 10.4, 'nejmenší vykreslené písmo ≥ 10,4 px: ' + nejmensi.min + ' px (' + nejmensi.klic + ')');
      ok(nalezy.every(n => !n.pretek), 'žádný obrázek nezpůsobí vodorovné přetečení STRÁNKY (ani před prvním snímkem)', nalezy.filter(n => n.pretek).slice(0, 3).map(n => n.klic).join(' | '));
      const bez = nalezy.filter(n => n.nevejde && !n.posun);
      ok(bez.length === 0, 'obrázek, který se nevejde, má kontejner s posunem (.pz-svg-posun)', bez.slice(0, 3).map(n => n.klic).join(' | '));
      const zbytecne = nalezy.filter(n => n.posun && !n.nevejde);
      ok(zbytecne.length === 0, 'posun se nenabízí tam, kde se obrázek vejde', zbytecne.slice(0, 3).map(n => n.klic).join(' | '));
      const bezTipu = nalezy.filter(n => n.posun && !n.tip);
      ok(bezTipu.length === 0, 'posouvaný obrázek má viditelnou nápovědu „posuň prstem“', bezTipu.slice(0, 3).map(n => n.klic).join(' | '));
      const posouvane = nazvy.filter(k => kl[k].posun > 0);
      ok(posouvane.length >= 5, 'posouvá se aspoň 5 různých úloh: ' + posouvane.length + ' (naměřeno 6, podlaha 5): ' + posouvane.map(k => k.replace(/^test \d+ · /, '')).slice(0, 8).join(', '));
      console.log('  ℹ️  obrázků ' + nalezy.length + ', úloh ' + nazvy.length + ', nejmenší písmo ' + nejmensi.min + ' px');
    }

    /* Sabotáž přepisem odpovědi serveru: soubory se nemění. Bez skriptu i bez pravidla musí měření drobné písmo najít. */
    console.log('· sabotáž: bez svgStart() měření drobné písmo najde');
    const sab1 = await zmer(browser, base, 360, 740, { 'prijimacky-core.js': t => { if (t.split('\n  svgStart();\n').length !== 2) throw new Error('volání svgStart(); se v jádře nenašlo právě jednou'); return t.replace('\n  svgStart();\n', '\n'); } });
    const drobne1 = Object.entries(souhrn(sab1.nalezy)).filter(([, o]) => o.min < 10.4).length;
    ok(drobne1 >= 5, 'bez svgStart() je drobné písmo (< 10,4 px) u ' + drobne1 + ' úloh (naměřeno 6, podlaha 5)');
    console.log('· sabotáž: bez pravidla v CSS měření drobné písmo najde');
    const sab2 = await zmer(browser, base, 360, 740, { 'prijimacky.css': t => { const re = /@media \(max-width:560px\) \{ svg\[data-pz-sirka\] \{ min-width:var\(--pz-sirka\); \} \}/; if (!re.test(t)) throw new Error('pravidlo min-width se v CSS nenašlo'); return t.replace(re, ''); } });
    const drobne2 = Object.entries(souhrn(sab2.nalezy)).filter(([, o]) => o.min < 10.4).length;
    ok(drobne2 >= 5, 'bez pravidla v CSS je drobné písmo (< 10,4 px) u ' + drobne2 + ' úloh (naměřeno 6, podlaha 5)');
  } finally { await browser.close(); server.close(); }
  console.log('\n' + (fail ? '❌' : '✅') + ' Písmo v obrázcích na telefonu: ' + pass + ' ✅, ' + fail + ' ❌');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
