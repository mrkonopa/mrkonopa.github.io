/* ═══════════════════════════════════════════════════════════════════════════
   Aura v aréně ve skutečných hrách 3.–9. ročníku (Vojtův pokyn 29. 10. 2026: odměny z obchodu mají
   být vidět i v boji, ale nesmí zakrýt postavu; jméno se v aréně nepíše).

   Pro každou hru (boj pod reduced-motion, aby byl snímek deterministický; hrdina má plné zdraví, takže se v aréně
   nelosuje nic, co by dva snímky rozlišilo):
     1. nasazený rám → plátno arény se proti `setAura(null)` liší aspoň o 150 pixelů (aura je vidět)
     2. změněné pixely leží vlevo (hrdina), v pravé třetině plátna (boss) se nezmění ani jeden
     3. aura není jen pruh u země: změněné pixely jsou nad polovinou výšky hrdiny (záře za ním)
     4. ŘAZENÍ: aura, která zamaluje celý obdélník hrdiny, ho NEZAKRYJE — purpurový podíl obdélníku je pod 85 %
        (hrdina se kreslí až po auře); aura nikdy nezakrývá postavu. (Plátno celé se NEzamalovává: parťák se kreslí
        po hrdinovi, takže by pokrytí obdélníku neměřilo hrdinu.)
     5. bez nasazení (rám i barva jména vypnuté) je plátno shodné s `setAura(null)`; po výměně rámu se aura změní
   Sabotáže: bez zapojení ve hře, aura se volá až po hrdinovi, jádro bez `setAura`.
   Spusť: node tests/rpg-aura-hry.test.cjs
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const IDS = ['border-silver', 'border-cyan', 'border-gold', 'border-holo', 'border-wreath', 'border-anchor', 'border-dragon', 'border-dyne', 'border-srdce', 'border-diamond'];

function server(prepis) {
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

/* pixely plátna arény (běží ve stránce) */
const SNIMEK = `() => {
  const cv = document.querySelector('.bt-top canvas'); if (!cv) return null;
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
  return { w: cv.width, h: cv.height, data: Array.from(d.data) };
}`;
const snimek = page => page.evaluate('(' + SNIMEK + ')()');

/* Po změně ve hře se čeká na DVA další snímky vykreslovací smyčky (ne na pevnou prodlevu): za vytížení stroje by se plátno
   za 150 ms nemuselo překreslit a snímek by ukázal starý stav. */
const prekresleno = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));

function rozdil(a, b) {
  const w = a.w, h = a.h; let n = 0, minX = 1e9, maxX = -1, minY = 1e9, maxY = -1, vPraveTretine = 0, vHorniPul = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2] || a.data[i + 3] !== b.data[i + 3]) {
      n++; const p = i / 4, x = p % w, y = (p / w) | 0;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      if (x > w * 0.67) vPraveTretine++;
      if (y < h * 0.5) vHorniPul++;
    }
  }
  return { n, minX, maxX, minY, maxY, vPraveTretine, vHorniPul, w, h };
}

async function proverHru(br, base, g) {
  const nalezy = []; let kontrol = 0;
  const c = (cond, text) => { kontrol++; if (!cond) nalezy.push(text); };
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(([ids]) => {
    try { localStorage.setItem('RPG_HUB_WALLET', JSON.stringify({ v: 1, credits: 900, cosmetics: { owned: ['theme-default', 'victory-default', 'badge-cyan', 'badge-gold'].concat(ids), active: { border: 'border-gold', badge: 'badge-cyan', theme: 'theme-default', victory: 'victory-default' } }, settings: {}, migrated: {}, absorbed: {}, life: {} })); } catch (e) {}
  }, [IDS]);
  const page = await ctx.newPage();
  const chyby = []; page.on('pageerror', e => chyby.push(e.message));
  await page.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 15000 });
  await page.evaluate(() => {
    document.getElementById('ni').value = 'Vojta'; startGame(); S.tutorialDone = true;
    document.documentElement.classList.add('reduced-motion');
    const ar = AREAS[0], mi = ar.missions.find(m => !m.mc) || ar.missions[0]; launchBattle(ar.id, mi.id);
  });
  await page.waitForFunction(() => { const c = document.querySelector('.bt-top canvas'); return !!c && c.width > 0; }, null, { timeout: 10000 });
  await prekresleno(page); await page.waitForTimeout(600);
  const SP = 'RPGSprites' + g;
  const maAPI = await page.evaluate(sp => !!(window[sp] && typeof window[sp].setAura === 'function'), SP);
  c(maAPI, g + '. ročník: jádro nemá setAura');
  if (maAPI) {
    const sAurou = await snimek(page);
    await page.evaluate(sp => window[sp].setAura(null), SP);
    await prekresleno(page);
    const bez = await snimek(page);
    const d = rozdil(sAurou, bez);
    c(d.n >= 150, g + '. ročník: aura se liší jen o ' + d.n + ' pixelů (čekáno ≥ 150)');
    c(d.vPraveTretine === 0, g + '. ročník: aura zasáhla pravou třetinu plátna (boss): ' + d.vPraveTretine + ' pixelů');
    c(d.n >= 150 && d.minY < d.h * 0.55, g + '. ročník: záře nesahá nad pas hrdiny (nejvyšší změněný pixel y = ' + d.minY + ' z ' + d.h + ')');
    /* řazení: aura zamalovaná přes celý obdélník hrdiny hrdinu nezakryje — kdyby se kreslila po něm, zůstane obdélník ze 100 % purpurový */
    await page.evaluate(sp => window[sp].setAura((c2, gg) => { window.__hb = { x: gg.x, y: gg.y, w: gg.w, h: gg.h }; c2.fillStyle = '#ff00ff'; c2.fillRect(gg.x, gg.y, gg.w, gg.h); }), SP);
    await prekresleno(page);
    const frac = await page.evaluate(() => {
      const cv = document.querySelector('.bt-top canvas'), b = window.__hb; if (!b) return null;
      const x0 = Math.max(0, Math.round(b.x)), y0 = Math.max(0, Math.round(b.y)), w = Math.min(cv.width - x0, Math.round(b.w)), h = Math.min(cv.height - y0, Math.round(b.h));
      const d = cv.getContext('2d').getImageData(x0, y0, w, h).data; let mg = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] === 255 && d[i + 1] === 0 && d[i + 2] === 255) mg++;
      return { podil: mg / (w * h), mg, plocha: w * h };
    });
    c(frac && frac.podil >= 0.05 && frac.podil <= 0.85, g + '. ročník: purpurového podílu v obdélníku hrdiny je ' + (frac && frac.podil.toFixed(2)) + ' (čekáno 0,05–0,85; nad 0,85 se aura kreslí až po hrdinovi)');
    console.log('     ' + g + '. ročník: podíl purpurové v obdélníku hrdiny ' + (frac && frac.podil.toFixed(2)));
    /* bez nasazení = beze změny; výměna rámu aury změní */
    await page.evaluate(() => { RPGWallet.deactivate('border'); RPGWallet.deactivate('badge'); applyCosmetics(); });
    await prekresleno(page);
    const nic = await snimek(page);
    c(rozdil(nic, bez).n === 0, g + '. ročník: bez nasazení se plátno liší od `setAura(null)` o ' + rozdil(nic, bez).n + ' pixelů');
    await page.evaluate(() => { RPGWallet.activate('border-dragon'); RPGWallet.activate('badge-gold'); applyCosmetics(); });
    await prekresleno(page);
    const dr = await snimek(page);
    await page.evaluate(() => { RPGWallet.activate('border-diamond'); applyCosmetics(); });
    await prekresleno(page);
    const di = await snimek(page);
    c(rozdil(dr, di).n >= 60, g + '. ročník: po výměně rámu se aura nezměnila (' + rozdil(dr, di).n + ' pixelů)');
    c(rozdil(dr, bez).n >= 150, g + '. ročník: zelená aura po výměně není vidět');
  }
  const skut = chyby.filter(e => !/ERR_|CERT_|net::|supabase|jsdelivr/i.test(e));
  c(skut.length === 0, g + ': JS chyby: ' + skut.join(' | '));
  await ctx.close();
  return { nalezy, kontrol };
}

(async () => {
  console.log('── Aura v aréně ve hrách 3–9 ──');
  const srv = await server(); const base = 'http://127.0.0.1:' + srv.address().port;
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let kontrol = 0;
  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const r = await proverHru(br, base, g); kontrol += r.kontrol;
    ok(r.nalezy.length === 0, g + '. ročník: aura v aréně (' + r.kontrol + ' kontrol)', r.nalezy.slice(0, 3).join(' | '));
  }
  ok(kontrol >= 60, 'celkem změřeno dost kontrol: ' + kontrol + ' (naměřeno 63, čekáno ≥ 60)');
  srv.close();

  console.log('── Sabotáže: test musí spadnout ──');
  const sab = async (nazev, g, soubor, f) => {
    const s = await server({ [soubor]: f }); const b = 'http://127.0.0.1:' + s.address().port;
    const orig = fs.readFileSync(path.join(ROOT, 'projects', soubor), 'utf8');
    if (f(orig) === orig) { ok(false, 'sabotáž „' + nazev + '“ se neaplikovala'); s.close(); return; }
    let r; try { r = await proverHru(br, b, g); } catch (e) { r = { nalezy: ['výjimka: ' + e.message.split('\n')[0]] }; }
    ok(r.nalezy.length > 0, 'sabotáž „' + nazev + '“ je chycena (' + r.nalezy.length + ' nálezů)', '');
    s.close();
  };
  await sab('6. ročník bez zapojení aury ve hře', 6, 'rpg-mat-6.html', t => t.replace("spMod.setAura(window.RPGKosmetika&&RPGKosmetika.arenaAura?", "spMod.setAura(false&&RPGKosmetika.arenaAura?"));
  await sab('jádro volá auru až po hrdinovi', 7, 'rpg-sprite-core.js', t => {
    const i = t.indexOf('      if (AURA) {'), j = t.indexOf('      contactShadow(hx + HS.cols * HS.scale / 2, hy + HERO_PAINT');
    if (i < 0 || j < 0) return t;
    const blok = t.slice(i, j);
    const k = t.indexOf('\n', t.indexOf('drawSprite(ctx, heroGrid(), heroPal(), hx, hy, HS.scale, false, h.mode === \'hit\', rim);'));
    return t.slice(0, i) + t.slice(j, k) + '\n' + blok + t.slice(k);
  });
  await sab('9. ročník bez aury v jádru', 9, 'rpg-sprite-core.js', t => t.replace('      if (AURA) {', '      if (false) {'));
  await br.close();

  console.log('\n' + (fail ? '❌' : '✅') + ' Aura ve hrách: ' + pass + ' ✅, ' + fail + ' ❌');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
