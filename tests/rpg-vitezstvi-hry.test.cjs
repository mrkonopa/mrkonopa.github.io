/* ═══════════════════════════════════════════════════════════════════════════
   Efekty vítězství ve hrách 3.–9. ročníku (po porážce bosse, v obchodě jako „▶ UKÁZKA“).

   Čistá část (`rpg-vitezstvi`) ověří kresbu; tady se ověří, že se efekt SKUTEČNĚ ukáže a dítěti nepřekáží:
     1. všech 7 efektů: v plátně `canvas[data-vitezstvi]` jsou pixely, nápis má třídu efektu a načasování z `META`, žádný déšť emoji
        (`.gold-drop`), plátno i nápis nechytají dotyk (nic v mřížce bodů přes obrazovku není plátno ani nápis), efekt jiného jména
        vykreslí jiné pixely, nový efekt nahradí předchozí (nikdy víc než jedno plátno a jeden nápis)
     2. celý život: nápis stromu žije i po 1,5 s (dřív ho odstraňoval pevný časovač hry) a pak plátno i nápis zmizí
     3. snížený pohyb (`.reduced-motion`): nápis bez animace a plně viditelný, plátno se nehýbe a do 2 s zmizí
     4. obchod, kategorie „Výhra efekt“: u každé karty tlačítko „▶ UKÁZKA“, které efekt spustí
     5. bez modulu hra běží po starém (déšť emoji), bez chyb
   Sabotáže: hra bez `return` po spuštění efektu, modul bez zpoždění nápisu, plátno chytá dotyk, špatné jméno volání, obchod bez ukázky.
   Spusť: node tests/rpg-vitezstvi-hry.test.cjs
   ═══════════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const IDS = ['victory-default', 'victory-cyber', 'victory-neon', 'victory-coins', 'victory-fireworks', 'victory-bomb', 'victory-tree'];

function server(prepis) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); }
    let telo = fs.readFileSync(fp), pr = null;
    for (const [k, f] of Object.entries(prepis || {})) if (k === path.basename(fp)) pr = f;
    if (pr) telo = Buffer.from(pr(telo.toString('utf8')));
    r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream' });
    r.end(telo);
  });
  return new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv)));
}

/* stav efektu na stránce: plátno, nápis, déšť emoji, pixely, zásah dotyku (běží ve stránce) */
const STAV = () => {
  const cv = Array.from(document.querySelectorAll('canvas[data-vitezstvi]'));
  const ban = Array.from(document.querySelectorAll('.victory-banner'));
  const o = { platen: cv.length, napisu: ban.length, emoji: document.querySelectorAll('.gold-drop').length, id: cv[0] ? cv[0].dataset.vitezstvi : null, pixelu: 0, otisk: 0, zasah: 0, dotyk: null };
  if (cv[0]) {
    const c = cv[0], d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let h = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) { o.pixelu++; h = (h * 31 + i + d[i - 3] + d[i - 2] * 3) >>> 0; }
    o.otisk = h;
    const cs = getComputedStyle(c); o.dotyk = cs.pointerEvents + '/' + cs.position + '/' + cs.zIndex; o.sirka = c.getBoundingClientRect().width; o.okno = innerWidth;
    for (let x = 0.04; x < 1; x += 0.12) for (let y = 0.05; y < 1; y += 0.15) {
      const el = document.elementFromPoint(innerWidth * x, innerHeight * y);
      if (el && (el === c || (el.classList && el.classList.contains('victory-banner')))) o.zasah++;
    }
  }
  if (ban[0]) { const cs = getComputedStyle(ban[0]); o.trida = ban[0].className; o.anim = cs.animationName; o.zpozdeni = cs.animationDelay; o.trvani = cs.animationDuration; o.neprusvitnost = cs.opacity; }
  return o;
};

async function proverHru(br, base, g, volby) {
  volby = volby || {};
  const efekty = volby.efekty || IDS;
  const nalezy = []; let kontrol = 0;
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(([ids]) => {
    try { localStorage.setItem('RPG_HUB_WALLET', JSON.stringify({ v: 1, credits: 900, cosmetics: { owned: ['theme-default'].concat(ids), active: { border: null, badge: null, theme: 'theme-default', victory: 'victory-default' } }, settings: {}, migrated: {}, absorbed: {}, life: {} })); } catch (e) {}
  }, [IDS]);
  const page = await ctx.newPage();
  const chyby = []; page.on('pageerror', e => chyby.push(e.message));
  const c = (cond, text) => { kontrol++; if (!cond) nalezy.push(g + '. ročník: ' + text); };
  await page.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 15000 });
  await page.evaluate(() => { const ni = document.getElementById('ni'); if (ni) ni.value = 'T'; startGame(); S.tutorialDone = true; launchBattle(AREAS[0].id, AREAS[0].missions[1].id); });
  await page.waitForTimeout(600);
  const META = await page.evaluate(() => window.RPGVitezstvi ? JSON.parse(JSON.stringify(RPGVitezstvi.META)) : null);
  c(!!META, 'modul RPGVitezstvi se nenačetl');
  if (!META) { await ctx.close(); return { nalezy, kontrol }; }

  /* 1. každý efekt po vítězství */
  const otisky = {};
  for (const id of efekty) {
    await page.evaluate(i => { RPGWallet.activate(i); window.__t0 = performance.now(); victoryBurst(); }, id);
    await page.waitForFunction(() => performance.now() - window.__t0 >= 450);
    const s = await page.evaluate(STAV);
    const m = META[id];
    c(s.platen === 1 && s.id === id, id + ': plátno efektu ' + s.platen + '× (id ' + s.id + ')');
    c(s.pixelu > 0, id + ': plátno je po 450 ms prázdné');
    c(s.napisu === 1, id + ': nápisů ' + s.napisu + ' (čekáno 1)');
    c(s.emoji === 0, id + ': ' + s.emoji + ' emoji z dřívějšího deště (čekáno 0)');
    c(/^none\/fixed\/107$/.test(s.dotyk || ''), id + ': plátno nemá pointer-events:none, position:fixed, z-index 107 (' + s.dotyk + ')');
    c(s.zasah === 0, id + ': plátno nebo nápis chytá dotyk v ' + s.zasah + ' bodech obrazovky');
    c(Math.abs(s.sirka - s.okno) < 2, id + ': plátno je široké ' + s.sirka + ' px z ' + s.okno);
    c(s.anim === 'vict' && s.zpozdeni === (m.banner.delay / 1000) + 's' && s.trvani === (m.banner.dur / 1000) + 's', id + ': nápis má animaci ' + s.anim + ' zpoždění ' + s.zpozdeni + ' trvání ' + s.trvani + ' (čekáno ' + m.banner.delay / 1000 + ' s / ' + m.banner.dur / 1000 + ' s)');
    otisky[id] = s.otisk;
    if (id !== 'victory-default') { const cssKey = await page.evaluate(i => RPGWallet.itemById(i).cssKey, id); c(new RegExp('(^| )' + cssKey + '( |$)').test(s.trida || ''), id + ': nápis nemá třídu ' + cssKey + ' (' + s.trida + ')'); }
  }
  if (efekty.length === IDS.length) c(new Set(Object.values(otisky)).size === IDS.length, 'efekty vykreslily stejné pixely: ' + new Set(Object.values(otisky)).size + ' různých ze ' + IDS.length);

  /* 2. celý život stromu (nejdelší efekt) */
  if (!volby.kratce) {
    await page.evaluate(() => { RPGWallet.activate('victory-tree'); window.__t0 = performance.now(); victoryBurst(); });
    await page.waitForFunction(() => performance.now() - window.__t0 >= 1700);
    const stred = await page.evaluate(STAV);
    c(stred.napisu === 1 && stred.platen === 1, 'strom po 1,7 s: nápisů ' + stred.napisu + ', pláten ' + stred.platen + ' (pevný časovač 1,5 s ho nesmí odstranit)');
    const t0 = Date.now();
    await page.waitForFunction(() => !document.querySelector('canvas[data-vitezstvi]') && !document.querySelector('.victory-banner'), null, { timeout: META['victory-tree'].dur + 2000 }).catch(() => {});
    const konec = await page.evaluate(STAV);
    c(konec.platen === 0 && konec.napisu === 0, 'strom: po skončení zůstalo ' + konec.platen + ' pláten a ' + konec.napisu + ' nápisů');

    /* 3. snížený pohyb */
    await page.evaluate(() => { document.documentElement.classList.add('reduced-motion'); RPGWallet.activate('victory-bomb'); victoryBurst(); });
    await page.waitForTimeout(150);
    const a = await page.evaluate(STAV);
    await page.waitForTimeout(600);
    const b = await page.evaluate(STAV);
    c(a.platen === 1 && a.pixelu > 0, 'snížený pohyb: plátno chybí nebo je prázdné');
    c(a.otisk === b.otisk, 'snížený pohyb: plátno se hýbe');
    c(a.anim === 'none' && Number(a.neprusvitnost) === 1, 'snížený pohyb: nápis má animaci „' + a.anim + '“ a průhlednost ' + a.neprusvitnost + ' (čekáno none a 1)');
    await page.waitForFunction(() => !document.querySelector('canvas[data-vitezstvi]') && !document.querySelector('.victory-banner'), null, { timeout: 2500 }).catch(() => {});
    const po = await page.evaluate(STAV);
    c(po.platen === 0 && po.napisu === 0, 'snížený pohyb: po 2 s zůstalo ' + po.platen + ' pláten a ' + po.napisu + ' nápisů');
    await page.evaluate(() => document.documentElement.classList.remove('reduced-motion'));
  }

  /* 4. obchod: ukázka */
  await page.evaluate(() => { go('shop'); try { shopCat('victory'); } catch (e) { setShopCat('victory', document.querySelectorAll('.shop-tab')[3]); } });
  await page.waitForTimeout(400);
  const obchod = await page.evaluate(() => {
    const grid = document.getElementById('shop-grid') || document.getElementById('shop-content');
    const karty = Array.from(grid.children);
    return { karty: karty.length, tlacitek: karty.filter(k => k.querySelector('.kos-uk')).length };
  });
  c(obchod.karty === 7 && obchod.tlacitek === 7, 'obchod: ' + obchod.tlacitek + ' tlačítek ukázky na ' + obchod.karty + ' kartách (čekáno 7 a 7)');
  await page.evaluate(() => { const b = document.querySelector('.kos-uk[aria-label*="Strom vítězství"]'); if (b) b.click(); });
  await page.waitForFunction(() => performance.now() > 0 && !!document.querySelector('canvas[data-vitezstvi]'), null, { timeout: 2000 }).catch(() => {});
  const ukazka = await page.evaluate(STAV);
  c(ukazka.id === 'victory-tree' && ukazka.napisu === 1, 'ukázka stromu z obchodu: efekt „' + ukazka.id + '“, nápisů ' + ukazka.napisu);
  await page.evaluate(() => { const b = document.querySelector('.kos-uk[aria-label*="Výchozí"]'); if (b) b.click(); });
  await page.waitForTimeout(150);
  const druha = await page.evaluate(STAV);
  c(druha.platen === 1 && druha.napisu === 1 && druha.id === 'victory-default', 'druhá ukázka nenahradila první (pláten ' + druha.platen + ', nápisů ' + druha.napisu + ', efekt ' + druha.id + ')');

  const skut = chyby.filter(e => !/ERR_|CERT_|net::|supabase|jsdelivr/i.test(e));
  c(skut.length === 0, 'JS chyby: ' + skut.join(' | '));
  await ctx.close();
  return { nalezy, kontrol };
}

/* 5. bez modulu hra běží po starém */
async function bezModulu(br, base, g) {
  const nalezy = []; let kontrol = 0;
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 } });
  await ctx.route('**/*', r => { const u = r.request().url(); return u.startsWith(base) && !/rpg-vitezstvi\.js/.test(u) ? r.continue() : r.abort(); });
  const page = await ctx.newPage();
  const chyby = []; page.on('pageerror', e => chyby.push(e.message));
  await page.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 15000 });
  await page.evaluate(() => { const ni = document.getElementById('ni'); if (ni) ni.value = 'T'; startGame(); S.tutorialDone = true; victoryBurst(); });
  await page.waitForTimeout(300);
  const s = await page.evaluate(() => ({ modul: typeof window.RPGVitezstvi, napis: document.querySelectorAll('.victory-banner').length, emoji: document.querySelectorAll('.gold-drop').length }));
  kontrol += 3;
  if (s.modul !== 'undefined') nalezy.push(g + '. ročník: modul se přes zákaz načetl');
  if (s.napis !== 1) nalezy.push(g + '. ročník: bez modulu je nápisů ' + s.napis);
  if (s.emoji < 10) nalezy.push(g + '. ročník: bez modulu je ' + s.emoji + ' emoji (čekáno ≥ 10, záloha po starém)');
  if (chyby.length) nalezy.push(g + '. ročník: bez modulu JS chyby: ' + chyby.join(' | '));
  await ctx.close();
  return { nalezy, kontrol };
}

(async () => {
  console.log('── Efekty vítězství ve hrách ──');
  const srv = await server(); const base = 'http://127.0.0.1:' + srv.address().port;
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let kontrol = 0;
  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const r = await proverHru(br, base, g); kontrol += r.kontrol;
    ok(r.nalezy.length === 0, g + '. ročník: efekty vítězství (' + r.kontrol + ' kontrol)', r.nalezy.slice(0, 3).join(' | '));
    const z = await bezModulu(br, base, g); kontrol += z.kontrol;
    ok(z.nalezy.length === 0, g + '. ročník: záloha bez modulu', z.nalezy.slice(0, 2).join(' | '));
  }
  console.log('  změřeno kontrol: ' + kontrol);
  ok(kontrol >= 400, 'celkem změřeno dost kontrol: ' + kontrol + ' (naměřeno viz výpis, podlaha 400)');
  srv.close();

  console.log('── Sabotáže: test musí spadnout ──');
  const sab = async (nazev, g, soubor, f, efekty) => {
    const s = await server({ [soubor]: f }); const b = 'http://127.0.0.1:' + s.address().port;
    const orig = fs.readFileSync(path.join(ROOT, 'projects', soubor), 'utf8');
    if (f(orig) === orig) { ok(false, 'sabotáž „' + nazev + '“ se neaplikovala'); s.close(); return; }
    let r; try { r = await proverHru(br, b, g, { kratce: true, efekty }); } catch (e) { r = { nalezy: ['výjimka: ' + e.message.split('\n')[0]] }; }
    ok(r.nalezy.length > 0, 'sabotáž „' + nazev + '“ je chycena (' + r.nalezy.length + ' nálezů)');
    s.close();
  };
  await sab('6. ročník: po spuštění efektu hra pokračuje starým kódem', 6, 'rpg-mat-6.html', t => t.replace("{banner:b}))return;", "{banner:b}));"), ['victory-default']);
  await sab('modul ignoruje zpoždění nápisu', 9, 'rpg-vitezstvi.js', t => t.replace("ms ease-out ' + M.banner.delay + 'ms both'", "ms ease-out 0ms both'"), ['victory-bomb']);
  await sab('plátno chytá dotyk', 9, 'rpg-vitezstvi.js', t => t.replace('pointer-events:none;image-rendering', 'image-rendering'), ['victory-neon']);
  await sab('7. ročník volá neexistující funkci modulu', 7, 'rpg-mat-7.html', t => t.replace('RPGVitezstvi.play(', 'RPGVitezstvi.hraj('), ['victory-cyber']);
  await sab('3. ročník: v obchodě chybí ukázka', 3, 'rpg-kosmetika.js', t => t.replace("if (cat === 'victory') {", "if (false) {"), ['victory-default']);
  await br.close();

  console.log('\n' + (fail ? '❌' : '✅') + ' Efekty vítězství ve hrách: ' + pass + ' ✅, ' + fail + ' ❌');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
