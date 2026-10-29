/* ═══════════════════════════════════════════════════════════════════════
   Pixelové rámy ve hrách: profil, obchod a hub (7 her + hub).

   Čistá část (`rpg-kosmetika`) ověří kresbu; tady se ověří, že se rám SKUTEČNĚ ukáže tam, kde ho dítě hledá:
     1. profil: avatar je v obalu `.kos-av` s plátnem `.kos-frame`, které má nepřehledné pixely; starý stín
        (`av-*`) na avataru není; rozměr plátna odpovídá rámu (18 + 2b × 24 + 2b)
     2. pohyb: dva vzorky plátna po 480 ms se liší; s třídou `reduced-motion` jsou shodné s krokem 0
     3. výměna a vypnutí: jiný rám změní rozměr plátna, vypnutí (`RPGWallet.deactivate`) plátno vyčistí
     4. obchod: v kategorii rámů je nahoře pruh „náhled na tvém hrdinovi“, každá karta rámu má živý náhled,
        „VYZKOUŠET“ přepíše název v pruhu, „ZPĚT“ ho vrátí; v jiné kategorii pruh zmizí
     5. hub: avatar globálního profilu má rám a sdílený obchod má stejné karty
   Sabotáže: stránka bez modulu; stránka bez napojení obchodu.
   Spusť: node tests/rpg-kosmetika-hry.test.cjs
   ═══════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const VLASTNI = ['border-silver', 'border-cyan', 'border-gold', 'border-holo', 'border-wreath', 'border-anchor'];

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

/* nepřehledné pixely plátna rámu + otisk (běží ve stránce) */
const STAV = `(sel) => {
  const cv = document.querySelector(sel); if (!cv) return null;
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0, h = 0;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 0) n++; h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7 + d[i + 3]) >>> 0; }
  return { n, h, w: cv.width, hh: cv.height };
}`;

const RK_PAD = 2; // RPGKosmetika.PAD — hlídá se i přímo níž
const stav = (page, sel) => page.evaluate('(' + STAV + ')(' + JSON.stringify(sel) + ')');

/* Nejmenší odstup (px) mezi hrdinou a vnitřním okrajem rámu: rám nesmí na postavu dosedat ani ji zakrývat (Vojtova výtka 29. 10. 2026). */
const odstup = (page, hostSel, heroSel, id) => page.evaluate(([hs, hero, i]) => {
  const host = document.querySelector(hs); if (!host) return null;
  const a = host.querySelector(hero), f = host.querySelector('canvas.kos-frame'); if (!a || !f) return null;
  const def = RPGKosmetika.FRAMES[i]; if (!def) return null;
  const A = a.getBoundingClientRect(), F = f.getBoundingClientRect(), k = F.width / f.width, b = def.b * k;
  return Math.min(A.left - (F.left + b), A.top - (F.top + b), (F.right - b) - A.right, (F.bottom - b) - A.bottom);
}, [hostSel, heroSel, id]);

async function proverStranku(br, base, g) {
  const nalezy = []; let kontrol = 0;
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(([ids]) => {
    try { localStorage.setItem('RPG_HUB_WALLET', JSON.stringify({ v: 1, credits: 900, cosmetics: { owned: ['theme-default', 'victory-default'].concat(ids), active: { border: 'border-cyan', badge: null, theme: 'theme-default', victory: 'victory-default' } }, settings: {}, migrated: {}, absorbed: {}, life: {} })); } catch (e) {}
  }, [VLASTNI]);
  const page = await ctx.newPage();
  const chyby = []; page.on('pageerror', e => chyby.push(e.message));
  const c = (cond, text) => { kontrol++; if (!cond) nalezy.push(text); };
  if (g === 'hub') {
    await page.goto(base + '/projects/rpg-matematika.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.renderGlobalProfile === 'function', null, { timeout: 15000 });
    await page.waitForTimeout(500);
    const s = await stav(page, '#gp-av canvas.kos-frame');
    c(s && s.n > 100, 'hub: avatar nemá rám (' + JSON.stringify(s) + ')');
    c(await page.evaluate(() => !document.getElementById('gp-av').className.split(/\s+/).some(x => x.startsWith('av-'))), 'hub: na avataru zůstal starý stín av-*');
    const oh = await odstup(page, '#gp-av', '#gp-av-cv', 'border-cyan');
    c(oh !== null && oh >= 3, 'hub: hrdina je od vnitřního okraje rámu ' + oh + ' px (čekáno ≥ 3)');
    await page.evaluate(() => { toggleShop(); setShopCat('border', document.querySelector('.shop-tab')); });
    await page.waitForTimeout(400);
    const info = await page.evaluate(() => ({
      pruh: !!document.getElementById('kos-try') && !document.getElementById('kos-try').hidden,
      karty: document.querySelectorAll('#shop-grid .sc').length,
      nahledy: document.querySelectorAll('#shop-grid .sc canvas.kos-frame').length
    }));
    c(info.pruh, 'hub: v kategorii rámů chybí pruh náhledu');
    c(info.karty >= 6 && info.nahledy === info.karty, 'hub: ' + info.nahledy + ' náhledů pro ' + info.karty + ' karet rámů');
  } else {
    await page.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 15000 });
    await page.evaluate(() => { const ni = document.getElementById('ni'); if (ni) ni.value = 'T'; startGame(); S.tutorialDone = true; applyCosmetics(); go('profile'); renderProfile(); });
    await page.waitForTimeout(500);
    const obal = await page.evaluate(() => { const a = document.getElementById('pr-avatar'); return { obal: !!(a && a.parentNode && a.parentNode.classList.contains('kos-av')), trida: a ? a.className : null }; });
    c(obal.obal, g + '. ročník: avatar není v obalu .kos-av');
    c(!obal.trida || !/(^|\s)av-/.test(obal.trida), g + '. ročník: na avataru zůstal starý stín (' + obal.trida + ')');
    const s1 = await stav(page, '.kos-av canvas.kos-frame');
    c(s1 && s1.n > 100, g + '. ročník: plátno rámu je prázdné (' + JSON.stringify(s1) + ')');
    c(s1 && s1.w === 18 + 2 * RK_PAD + 2 * 5 && s1.hh === 24 + 2 * RK_PAD + 2 * 5, g + '. ročník: rozměr plátna ' + (s1 && s1.w) + '×' + (s1 && s1.hh) + ' neodpovídá rámu Kyber s vnitřním okrajem (32×38)');
    c(await page.evaluate(() => RPGKosmetika.PAD) === RK_PAD, g + '. ročník: RPGKosmetika.PAD se liší od ' + RK_PAD);
    const og = await odstup(page, '.kos-av:has(#pr-avatar)', '#pr-avatar', 'border-cyan');
    c(og !== null && og >= 5, g + '. ročník: hrdina je od vnitřního okraje rámu ' + og + ' px (čekáno ≥ 5, rám nesmí dosedat na postavu)');
    // pohyb
    await page.waitForTimeout(480);
    const s2 = await stav(page, '.kos-av canvas.kos-frame');
    c(s1 && s2 && s1.h !== s2.h, g + '. ročník: rám se za 480 ms nepohnul');
    // reduced-motion: krok 0, shodné vzorky
    await page.evaluate(() => { document.documentElement.classList.add('reduced-motion'); applyCosmetics(); });
    await page.waitForTimeout(200);
    const r1 = await stav(page, '.kos-av canvas.kos-frame');
    await page.waitForTimeout(500);
    const r2 = await stav(page, '.kos-av canvas.kos-frame');
    c(r1 && r2 && r1.h === r2.h, g + '. ročník: s reduced-motion se rám hýbe');
    await page.evaluate(() => document.documentElement.classList.remove('reduced-motion'));
    // výměna a vypnutí
    await page.evaluate(() => { RPGWallet.activate('border-silver'); applyCosmetics(); });
    await page.waitForTimeout(150);
    const s3 = await stav(page, '.kos-av canvas.kos-frame');
    c(s3 && s3.w === 18 + 2 * RK_PAD + 2 * 4 && s3.n > 100, g + '. ročník: po výměně na stříbrný rám je plátno ' + (s3 && s3.w) + ' px široké (čekáno 30)');
    await page.evaluate(() => { RPGWallet.deactivate('border'); applyCosmetics(); });
    await page.waitForTimeout(150);
    const s4 = await stav(page, '.kos-av canvas.kos-frame');
    c(s4 && s4.n === 0, g + '. ročník: po vypnutí rámu zůstaly na plátně pixely (' + (s4 && s4.n) + ')');
    await page.evaluate(() => { RPGWallet.activate('border-gold'); applyCosmetics(); });
    // obchod
    await page.evaluate(() => { go('shop'); try { shopCat('border'); } catch (e) { setShopCat('border', document.querySelector('.shop-tab')); } });
    await page.waitForTimeout(500);
    const ob = await page.evaluate(() => {
      const st = document.getElementById('kos-try');
      const grid = document.getElementById('shop-grid') || document.getElementById('shop-content');
      const karty = Array.from(grid.children);
      return { pruh: !!st && !st.hidden, karty: karty.length, nahledy: karty.filter(k => k.querySelector('canvas.kos-frame')).length,
               tlacitka: karty.filter(k => k.querySelector('.kos-try-btn')).length };
    });
    const os = await odstup(page, '#kos-try .kos-av', 'canvas:not(.kos-frame)', 'border-gold');
    c(os !== null && os >= 5, g + '. ročník: v pruhu náhledu je hrdina od rámu ' + os + ' px (čekáno ≥ 5)');
    const ok1 = await page.evaluate(() => { const grid = document.getElementById('shop-grid') || document.getElementById('shop-content'); const av = grid.children[1].querySelector('.kos-av'); const a = av.querySelector('canvas:not(.kos-frame)'); const f = av.querySelector('canvas.kos-frame'); const A = a.getBoundingClientRect(), F = f.getBoundingClientRect(); return Math.min(A.left - F.left, A.top - F.top, F.right - A.right, F.bottom - A.bottom); });
    c(ok1 >= 17, g + '. ročník: na kartě v obchodě je hrdina od vnějšku rámu ' + ok1 + ' px (čekáno ≥ 17: vnitřní okraj 6 + nejtenčí rám 12)');
    c(ob.pruh, g + '. ročník: v kategorii rámů chybí pruh náhledu');
    c(ob.karty >= 6 && ob.nahledy === ob.karty && ob.tlacitka === ob.karty, g + '. ročník: ' + ob.nahledy + ' náhledů a ' + ob.tlacitka + ' tlačítek pro ' + ob.karty + ' karet');
    const nazev1 = await page.evaluate(() => document.getElementById('kos-try-name').textContent);
    await page.evaluate(() => { const grid = document.getElementById('shop-grid') || document.getElementById('shop-content'); grid.children[1].querySelector('.kos-try-btn').click(); });
    const nazev2 = await page.evaluate(() => document.getElementById('kos-try-name').textContent);
    const zpet = await page.evaluate(() => !document.getElementById('kos-try-off').hidden);
    c(nazev2 && nazev2 !== nazev1 && zpet, g + '. ročník: „Vyzkoušet“ nezměnilo pruh („' + nazev1 + '“ → „' + nazev2 + '“)');
    await page.evaluate(() => document.getElementById('kos-try-off').click());
    const nazev3 = await page.evaluate(() => document.getElementById('kos-try-name').textContent);
    c(nazev3 === nazev1, g + '. ročník: „Zpět“ nevrátilo původní rám („' + nazev3 + '“ ≠ „' + nazev1 + '“)');
    await page.evaluate(() => { try { shopCat('badge'); } catch (e) { setShopCat('badge', document.querySelectorAll('.shop-tab')[1]); } });
    await page.waitForTimeout(300);
    c(await page.evaluate(() => document.getElementById('kos-try').hidden), g + '. ročník: pruh náhledu zůstal i v jiné kategorii');
  }
  const skut = chyby.filter(e => !/ERR_|CERT_|net::|supabase|jsdelivr/i.test(e));
  c(skut.length === 0, g + ': JS chyby: ' + skut.join(' | '));
  await ctx.close();
  return { nalezy, kontrol };
}

(async () => {
  console.log('── Rámy avatara ve hrách (profil, obchod, hub) ──');
  const srv = await server(); const base = 'http://127.0.0.1:' + srv.address().port;
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let kontrol = 0;
  for (const g of [3, 4, 5, 6, 7, 8, 9, 'hub']) {
    const r = await proverStranku(br, base, g); kontrol += r.kontrol;
    ok(r.nalezy.length === 0, (g === 'hub' ? 'hub' : g + '. ročník') + ': rám v profilu a obchodu (' + r.kontrol + ' kontrol)', r.nalezy.slice(0, 3).join(' | '));
  }
  ok(kontrol >= 100, 'celkem změřeno dost kontrol: ' + kontrol + ' (naměřeno viz výpis)');
  srv.close();

  console.log('── Sabotáže: test musí spadnout ──');
  const sab = async (nazev, g, soubor, f) => {
    const s = await server({ [soubor]: f }); const b = 'http://127.0.0.1:' + s.address().port;
    const orig = fs.readFileSync(path.join(ROOT, 'projects', soubor), 'utf8');
    if (f(orig) === orig) { ok(false, 'sabotáž „' + nazev + '“ se neaplikovala'); s.close(); return; }
    let r; try { r = await proverStranku(br, b, g); } catch (e) { r = { nalezy: ['výjimka: ' + e.message.split('\n')[0]] }; }
    ok(r.nalezy.length > 0, 'sabotáž „' + nazev + '“ je chycena (' + r.nalezy.length + ' nálezů)', '');
    s.close();
  };
  await sab('6. ročník bez modulu', 6, 'rpg-mat-6.html', t => t.replace('<script defer src="./rpg-kosmetika.js?v=20261030"></script>\n', ''));
  await sab('7. ročník bez vnitřního okraje kolem hrdiny', 7, 'rpg-kosmetika.js', t => t.replace('const PAD = 2;', 'const PAD = 0;'));
  await sab('3. ročník bez napojení obchodu', 3, 'rpg-mat-3.html', t => t.replace('if(window.RPGKosmetika&&RPGKosmetika.shopRendered){', 'if(false){'));
  await sab('hub bez napojení avatara', 'hub', 'rpg-matematika.html', t => t.replace('if(window.RPGKosmetika&&RPGKosmetika.applyAvatar) RPGKosmetika.applyAvatar(', 'if(false) RPGKosmetika.applyAvatar('));
  await br.close();

  console.log('\n' + (fail ? '❌' : '✅') + ' Rámy ve hrách: ' + pass + ' ✅, ' + fail + ' ❌');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
