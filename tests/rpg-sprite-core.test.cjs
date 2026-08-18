/* ══════════════════════════════════════════════════════════════════════
   Sdílené jádro spritů + svět 9. ročníku (fáze 02 + 03).

   Devítka je pilot: engine je ve sdíleném rpg-sprite-core.js a soubor
   ročníku je jen popis světa. Testuje se obojí naráz, protože samostatně
   nedávají smysl — jádro bez dat nekreslí a data bez jádra se nespustí.

   Spusť: node tests/rpg-sprite-core.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18894;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function serve() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css' };
  const srv = http.createServer((q, p) => {
    let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT)) { p.writeHead(403); return p.end(); }
    let b = null; try { b = fs.readFileSync(fp); } catch (e) {}
    if (b === null) { p.writeHead(404); return p.end(); }
    p.writeHead(200, { 'Content-Type': mime[u.split('.').pop()] || 'application/octet-stream' });
    p.end(b);
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

/* ── 1. bez jádra se svět nesmí zaregistrovat ani spadnout ──────────── */
{
  const g = {}; g.window = g;
  let spadlo = null;
  try { new Function(fs.readFileSync(path.join(ROOT, 'projects/rpg-sprites-9.js'), 'utf8')).call(g); }
  catch (e) { spadlo = e.message; }
  // (spouštíme v čistém kontextu bez window.RPGSpriteCore)
  const gg = { window: {} };
  const vm = require('vm'); vm.createContext(gg);
  let pad2 = null;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, 'projects/rpg-sprites-9.js'), 'utf8'), gg); }
  catch (e) { pad2 = e.message; }
  ok(!pad2, 'bez jádra soubor ročníku nespadne', pad2 || '');
  ok(gg.window.RPGSprites9 === undefined,
    'bez jádra se RPGSprites9 NEregistruje (hra jede na emoji)', String(gg.window.RPGSprites9));
  ok(!!gg.window.RPGSpriteWorld9, 'svět je i tak vystavený pro testy');
  void spadlo;
}

(async () => {
  console.log('\n── Jádro spritů + svět 9. ročníku ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  const ctx = await browser.newContext({ viewport: { width: 480, height: 800 } });
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${PORT}/projects/rpg-mat-9.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof RPGSprites9 !== 'undefined' && typeof startGame === 'function', { timeout: 10000 });

  /* ── 2. mřížky: rozměry a žádná magenta ──────────────────────────── */
  const mr = await page.evaluate(() => {
    const W = RPGSpriteWorld9, out = { hero: [], boss: [], ally: [], magenta: [] };
    const zkontroluj = (grid, pal, kde, cols, rows) => {
      const sirky = [...new Set(grid.map(r => r.length))];
      if (sirky.length !== 1 || sirky[0] !== cols) out[kde === 'ally' ? 'ally' : kde].push(`${kde}: šířky ${sirky.join('/')} ≠ ${cols}`);
      if (grid.length !== rows) out[kde === 'ally' ? 'ally' : kde].push(`${kde}: ${grid.length} řádků ≠ ${rows}`);
      grid.forEach(r => { for (const ch of r) if (ch !== '.' && ch !== 'O' && !(ch in pal)) out.magenta.push(kde + ':' + ch); });
    };
    const H = W.hero;
    [['idle0', H.grids.idle[0]], ['idle1', H.grids.idle[1]], ['windup', H.grids.windup],
     ['slash', H.grids.slash], ['cast', H.grids.cast], ['shoot', H.grids.shoot], ['hit', H.grids.hit]]
      .forEach(([nm, g]) => zkontroluj(g, H.pal, 'hero', H.cols, H.rows));
    Object.keys(W.bosses.grids).forEach(a => W.bosses.grids[a].forEach(g =>
      zkontroluj(g, Object.assign({}, W.bosses.common, W.bosses.pals[a]), 'boss', 18, 24)));
    W.ally.grids.forEach(g => zkontroluj(g, W.ally.pal, 'ally', 14, 14));
    return { hero: [...new Set(out.hero)], boss: [...new Set(out.boss)], ally: [...new Set(out.ally)], magenta: [...new Set(out.magenta)] };
  });
  ok(mr.magenta.length === 0, 'žádný znak mimo paletu (konec magenta #f0f)', mr.magenta.join(','));
  ok(mr.hero.length === 0, 'hrdina: 20 sloupců × 29 řádků ve všech pózách', mr.hero.join(' | '));
  ok(mr.boss.length === 0, 'bossové: 18 × 24 (mřížky se ve fázi 03 nemění)', mr.boss.join(' | '));
  ok(mr.ally.length === 0, 'parťák: 14 × 14', mr.ally.join(' | '));

  /* ── 3. kontrast proti pozadí arény ──────────────────────────────── */
  const kon = await page.evaluate(() => {
    const C = RPGSpriteCore, W = RPGSpriteWorld9, BG = '#05161c';
    const pal = W.hero.pal, g = W.hero.grids.idle[0];
    const pruhledny = (r, c) => !g[r] || !g[r][c] || g[r][c] === '.';
    let siluetaOK = 0, siluetaCelkem = 0, jednicekNaSiluete = 0;
    for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r].length; c++) {
      const ch = g[r][c]; if (ch === '.') continue;
      const hrana = pruhledny(r - 1, c) || pruhledny(r + 1, c) || pruhledny(r, c - 1) || pruhledny(r, c + 1);
      if (!hrana) continue;
      siluetaCelkem++;
      if (ch === '1') jednicekNaSiluete++;
      /* Silueta podle README: rim se POČÍTÁ (jádro ho dává na osvětlenou
         hranu automaticky). Pozor, tohle pravidlo samo o sobě moc
         nerozlišuje — ověřeno sabotáží: se započítaným rimem projde
         i sprite, kterému ztmavíš celý ramp, protože rim má vysoký
         kontrast z definice. Skutečnou pojistkou je kontrola palety níž. */
      const osvetlena = pruhledny(r - 1, c) || pruhledny(r, c - 1);
      const rim = C.rimColor(W.areas[1].neon);
      const barva = (ch === 'O' || (ch === 'K' && osvetlena)) ? rim : pal[ch];
      if (barva && C.contrast(barva, BG) >= 3.0) siluetaOK++;
    }
    const rimy = Object.keys(W.areas).map(a => ({
      a, k: +C.contrast(C.rimColor(W.areas[a].neon), BG).toFixed(2) }));
    return {
      podil: Math.round(100 * siluetaOK / siluetaCelkem), siluetaCelkem, jednicekNaSiluete,
      zaklad: +C.contrast(pal['3'], BG).toFixed(2),
      svetlo: +C.contrast(pal['4'], BG).toFixed(2),
      akcent: +C.contrast(pal['A'], BG).toFixed(2),
      rimy, nejhorsiRim: Math.min(...rimy.map(x => x.k))
    };
  });
  ok(kon.siluetaCelkem > 60, `silueta má dost pixelů k posouzení (${kon.siluetaCelkem})`);
  ok(kon.podil >= 55, `≥ 55 % siluety má kontrast ≥ 3,0 (${kon.podil} %)`);
  ok(kon.zaklad >= 2.0, `základní tón těla „3" má kontrast ≥ 2,0 (${kon.zaklad})`);
  /* Tahle dvojice je ta pojistka, která opravdu drží: chytí ztmavení rampu
     bez ohledu na tvar siluety. Prahy jsou z tabulky v README. */
  ok(kon.svetlo >= 3.0, `světlý tón „4" má kontrast ≥ 3,0 (${kon.svetlo})`);
  ok(kon.akcent >= 3.0, `akcent „A" má kontrast ≥ 3,0 (${kon.akcent})`);
  ok(kon.jednicekNaSiluete === 0,
    'nejtmavší tón „1" NENÍ na siluetě (je to jen vnitřní stín)', String(kon.jednicekNaSiluete));
  ok(kon.nejhorsiRim >= 3.0, `rim light má ve všech 7 oblastech kontrast ≥ 3,0 (nejhorší ${kon.nejhorsiRim})`);

  /* ── 4. skiny z obchodu se musí projevit ─────────────────────────── */
  const sk = await page.evaluate(() => {
    const W = RPGSpriteWorld9, zaklad = W.hero.pal;
    const out = { ids: RPGSprites9.skins(), zmeny: {} };
    out.ids.forEach(id => {
      const s = W.hero.skins[id] || {};
      out.zmeny[id] = Object.keys(s).filter(k => s[k] !== zaklad[k]).length;
    });
    return out;
  });
  ok(sk.ids.length === 5, `obchod nabízí 5 skinů (${sk.ids.length})`);
  const slabe = Object.entries(sk.zmeny).filter(([, n]) => n < 3).map(([k, n]) => `${k}:${n}`);
  ok(slabe.length === 0, 'každý skin mění aspoň 3 znaky palety', slabe.join(', '));

  /* ── 5. drawHeroOn: spodní hrana zůstává, kam ji Věž legend čeká ─── */
  const dh = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 200; cv.height = 200;
    const g = cv.getContext('2d');
    RPGSprites9.drawHeroOn(g, 20, 100, 3, 0, false);
    const d = g.getImageData(0, 0, 200, 200).data;
    let nejnizsi = -1;
    for (let y = 199; y >= 0 && nejnizsi < 0; y--)
      for (let x = 0; x < 200; x++) if (d[(y * 200 + x) * 4 + 3] > 0) { nejnizsi = y; break; }
    const H = RPGSprites9.heroSize();
    const pocetPokreslenych = grid => { let e = 0; for (let r = grid.length - 1; r >= 0 && /^\.+$/.test(grid[r]); r--) e++; return grid.length - e; };
    const W = RPGSpriteWorld9;
    return { nejnizsi, ocekavano: 100 + 24 * 3 - 1, painted: H.painted, legacy: H.legacyRows,
             idle0: pocetPokreslenych(W.hero.grids.idle[0]), idle1: pocetPokreslenych(W.hero.grids.idle[1]) };
  });
  ok(Math.abs(dh.nejnizsi - dh.ocekavano) <= 1,
    `drawHeroOn kreslí stejnou spodní hranu jako starý sprite (${dh.nejnizsi} vs ${dh.ocekavano})`);
  ok(dh.idle0 === dh.idle1,
    `oba klidové snímky mají stejně pokreslených řádků (${dh.idle0} / ${dh.idle1}) — jinak hrdina poskakuje`);

  /* ── 6. strop částic ─────────────────────────────────────────────── */
  const fx = await page.evaluate(async () => {
    localStorage.clear(); startGame('TEST'); S.tutorialDone = true;
    const ar = AREAS.find(a => a.id === 1); launchBattle(1, ar.missions[0].id);
    await new Promise(r => setTimeout(r, 300));
    let max = 0;
    for (let i = 0; i < 200; i++) { try { RPGSprites9.heroAttack(true); } catch (e) {} max = Math.max(max, RPGSprites9.fxCount()); }
    return { max, cap: RPGSpriteCore.FX_CAP };
  });
  ok(fx.max <= fx.cap, `200 útoků nepřetáhne strop částic (${fx.max} ≤ ${fx.cap})`);

  /* ── 7. veřejné API ──────────────────────────────────────────────── */
  const api = await page.evaluate(() => {
    const chce = ['attach','detach','active','spawn','heroAttack','bossAttack','defeat',
      'setProgress','setHeroHp','drawHeroOn','setSkin','skins','heroSize','fxCount','world','version'];
    return chce.filter(k => !(k in RPGSprites9) || (k !== 'version' && typeof RPGSprites9[k] !== 'function'));
  });
  ok(api.length === 0, 'veřejné API má všech 16 položek', api.join(', '));

  /* ── 8. reduced motion: scéna se nesmí hnout ─────────────────────── */
  /* Pozor na pořadí: předchozí kontrola vypálí 200 útoků a jejich částice
     ještě dobíhají. Kdyby se měřilo hned, hlásil by test pohyb, který
     s reduced-motion nesouvisí. Proto čerstvý boj se zapnutým přepínačem. */
  const rmv = await page.evaluate(async () => {
    document.documentElement.classList.add('reduced-motion');
    try { exitBattle(); } catch (e) {}
    await new Promise(r => setTimeout(r, 400));
    const ar = AREAS.find(a => a.id === 1); launchBattle(1, ar.missions[0].id);
    await new Promise(r => setTimeout(r, 1200));
    const cv = document.querySelector('#s-battle canvas');
    if (!cv) return { chyba: 'plátno arény nenalezeno' };
    const g = cv.getContext('2d');
    const a = g.getImageData(0, 0, cv.width, cv.height).data;
    await new Promise(r => setTimeout(r, 2000));
    const b = g.getImageData(0, 0, cv.width, cv.height).data;
    let odlisnych = 0;
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2]) odlisnych++;
    return { odlisnych, pixelu: a.length / 4 };
  });
  ok(!rmv.chyba, 'plátno arény je k dispozici', rmv.chyba || '');
  ok(rmv.odlisnych === 0,
    `s reduced-motion se scéna po 2 s nezmění ani o pixel (${rmv.odlisnych} z ${rmv.pixelu})`);

  const realne = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr|net::/i.test(e));
  ok(realne.length === 0, 'žádné JS chyby', realne.slice(0, 2).join(' | '));

  await browser.close(); srv.close();
  console.log(`\n  Jádro spritů: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
