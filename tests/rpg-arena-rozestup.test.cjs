/* ═══════════════════════════════════════════════════════════════════════
   Aréna na tabletu: hrdina, parťák a boss se nesmějí dotýkat (Vojtův lístek 29. 10. 2026:
   „na tabletu jsou hrdina a boss moc blízko a sova zasahuje až do bosse“).

   Změřeno před opravou (iPad na šířku): plátno arény je 359–397 px a postavy se rozmísťovaly
   POMĚREM šířky (hrdina 12 %, boss 58 %), takže viditelná mezera parťák → boss byla 13–38 px
   a pod 264 px byl parťák uvnitř bosse. Ve 3.–5. ročníku k tomu `.wrap` v boji nemělo
   `width:100%`, takže šířka celé bojové obrazovky záležela na obsahu úlohy a plátno skákalo
   mezi 200 a 389 px (u poloviny úloh užší než 340 px). 2. stupeň to nemá, plátno je u všech
   126 úloh stejné.

   Dvě části:
     A) Node, bez prohlížeče: z mřížek VŠECH sedmi světů (viditelné sloupce, ne rámečky mřížek)
        a z `RPGSprites<N>.layoutX` — tedy téže funkce, kterou kreslí engine — spočítá mezery
        pro šířky plátna 240–639 px a pro každé bossovo zbarvení oblasti.
        Pravidla: od 340 px mezera parťák → boss ≥ 40 px (naměřeno 57), od 280 px (telefon)
        ≥ 0 (naměřeno 4), boss s rezervou 13 px od pravého okraje (odhození 7 + třes 5,3),
        hrdina uvnitř plátna, od 540 px platí původní poměry (zlaté otisky se nemění).
     B) Prohlížeč: šířka plátna je u všech 126 úloh stejná (jedna hodnota) a nejméně 340 px,
        ve všech 7 hrách na iPadu 10,2" i Air na šířku.
   Mazlíčci z obchodu (`rpg-mazlicci.js`, 7 druhů, šířka z `size(id).cols`) stojí na pozici parťáka, takže platí totéž pravidlo i pro ně.
   Sabotáže: vypnuté úzké rozložení; mazlíček dvakrát širší; `.wrap` bez `width:100%` ve 3. ročníku.
   Spusť: node tests/rpg-arena-rozestup.test.cjs
   ═══════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), vm = require('vm'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const P = f => path.join(ROOT, 'projects', f);

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

/* ── A) rozložení z mřížek ───────────────────────────────────────────── */
function sloupce(g) {                 // [první, poslední] pokreslený sloupec přes všechny mřížky
  let lo = 1e9, hi = -1;
  for (const r of g) for (let i = 0; i < r.length; i++) if (r[i] !== '.' && r[i] !== ' ') { lo = Math.min(lo, i); hi = Math.max(hi, i); }
  return [lo, hi];
}
const sjednot = gs => gs.map(sloupce).reduce((a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])], [1e9, -1]);

function nactiSvet(g, jadro) {
  const win = { addEventListener() {}, document: {}, RPGSpriteCore: null };
  win.window = win;
  const ctx = Object.assign(win, { console, Math, Date, Object, Array, String, Number, JSON, performance: { now: () => 0 } });
  vm.createContext(ctx);
  vm.runInContext(jadro, ctx);                                       // jádro nastaví window.RPGSpriteCore
  vm.runInContext(fs.readFileSync(P('rpg-sprites-' + g + '.js'), 'utf8'), ctx);
  return { svet: win['RPGSpriteWorld' + g], api: win['RPGSprites' + g] };
}

const MAZ = (() => {                  // mazlíčci z obchodu: `size(id).cols` = šířka mřížky (kreslí se od levého okraje `ax`)
  const root = {}; vm.runInNewContext(fs.readFileSync(P('rpg-mazlicci.js'), 'utf8'), { window: root, globalThis: root, console, Math, performance: { now: () => 0 } });
  return root.RPGMazlicci || null;
})();

function meziStrana(jadroZdroj, nasobekMaz) {
  const nm = nasobekMaz || 1;
  const nalezy = []; let mereni = 0, minMaz = 1e9;
  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const { svet, api } = nactiSvet(g, jadroZdroj);
    if (!svet || !api || typeof api.layoutX !== 'function') { nalezy.push('g' + g + ': svět nebo layoutX chybí'); continue; }
    const HS = svet.hero, AL = svet.ally, BS = svet.bosses;
    const AR = Object.assign({ heroX: 0.12, bossX: 0.58 }, svet.arena || {});
    const adx = (AL.dx != null) ? AL.dx : (HS.cols - 2) * HS.scale + 6;
    const pet = sjednot(AL.grids);
    const heroVse = sjednot(Object.values(HS.grids).flatMap(v => (Array.isArray(v) && typeof v[0] === 'string') ? [v] : v));
    for (const area of Object.keys(BS.grids)) {
      const fr = BS.grids[area], cols = fr[0][0].length, bs = sloupce(fr[0]);
      const bossLevy = x => x + bs[0] * BS.scale, bossPravy = x => x + (sjednot(fr)[1] + 1) * BS.scale;
      for (let W = 240; W < 640; W += 4) {
        const L = api.layoutX(W, cols); mereni++;
        const petPravy = L.heroX + adx + (pet[1] + 1) * AL.scale;
        const mezera = bossLevy(L.bossX) - petPravy;
        /* mazlíček z obchodu stojí na téže pozici (levý okraj = ax), ale je širší/užší než světový parťák; při zásahu
           uhne DOLEVA (pryč od bosse), při obavě kolísá o 1 px — nejvíc doprava je tedy +1 px */
        if (MAZ) for (const id of MAZ.IDS) {
          const pravy = L.heroX + adx + Math.round(MAZ.size(id).cols * nm) * AL.scale + 1; mereni++;
          const mz = bossLevy(L.bossX) - pravy; if (W >= 340) minMaz = Math.min(minMaz, mz);
          if (W >= 340 && mz < 40) nalezy.push(`g${g}/o${area} W${W} ${id}: mazlíček → boss ${mz} px (< 40)`);
          else if (W >= 280 && mz < 0) nalezy.push(`g${g}/o${area} W${W} ${id}: mazlíček zasahuje do bosse (${mz} px)`);
        }
        const zbytek = W - bossPravy(L.bossX);
        const hrdinaLevy = L.heroX + heroVse[0] * HS.scale;
        if (W >= 340 && mezera < 40) nalezy.push(`g${g}/o${area} W${W}: parťák → boss ${mezera} px (< 40)`);
        else if (W >= 280 && mezera < 0) nalezy.push(`g${g}/o${area} W${W}: parťák zasahuje do bosse (${mezera} px)`);
        if (W >= 280 && zbytek < 13) nalezy.push(`g${g}/o${area} W${W}: boss má od pravého okraje jen ${zbytek} px (< 13)`);
        if (W >= 280 && hrdinaLevy < 0) nalezy.push(`g${g}/o${area} W${W}: hrdina vyčnívá doleva (${hrdinaLevy} px)`);
        if (W >= 540) {
          const ocek = [Math.round(W * AR.heroX), Math.round(W * AR.bossX)];
          if (L.heroX !== ocek[0] || L.bossX !== ocek[1]) nalezy.push(`g${g} W${W}: nad 540 px se rozložení změnilo (${L.heroX}/${L.bossX}, čekáno ${ocek})`);
        }
      }
    }
  }
  return { nalezy, mereni, minMaz };
}

console.log('── A) Rozestup hrdina / parťák / boss z mřížek všech sedmi světů ──');
const JADRO = fs.readFileSync(P('rpg-sprite-core.js'), 'utf8');
{
  const { nalezy, mereni, minMaz } = meziStrana(JADRO);
  console.log('  nejmenší mezera mazlíček → boss od šířky plátna 340 px: ' + minMaz + ' px (pravidlo ≥ 40)');
  ok(mereni >= 7 * 7 * 100 * 0.9, 'změřeno dost kombinací: ' + mereni + ' (7 světů × oblasti × 100 šířek)');
  ok(nalezy.length === 0, 'rozestupy platí pro všechny světy, oblasti a šířky plátna', nalezy.slice(0, 3).join(' | '));

  // sabotáž: úzké rozložení vypnuté (NARROW_W = 0) musí test shodit
  const sab = JADRO.replace('const NARROW_W = 540;', 'const NARROW_W = 0;');
  ok(sab !== JADRO, 'sabotáž A se aplikovala (NARROW_W)');
  const s = meziStrana(sab);
  ok(s.nalezy.length > 0, 'sabotáž „úzké rozložení vypnuto“ je chycena (' + s.nalezy.length + ' nálezů)');
  ok(!!MAZ && MAZ.IDS.length === 7, 'modul mazlíčků se načetl (7 druhů)');
  const s3 = meziStrana(JADRO, 2);
  ok(s3.nalezy.some(t => /mazlíček/.test(t)), 'sabotáž „mazlíček dvakrát širší“ je chycena (' + s3.nalezy.filter(t => /mazlíček/.test(t)).length + ' nálezů)');
  const sab2 = JADRO.replace('W * 0.05) };', 'W * 0.0) };');
  ok(sab2 !== JADRO, 'sabotáž A2 se aplikovala (rezerva bosse)');
  const s2 = meziStrana(sab2);
  ok(s2.nalezy.length > 0, 'sabotáž „boss bez rezervy u pravého okraje“ je chycena (' + s2.nalezy.length + ' nálezů)');
}
ok(/function heroPos\(\) \{\s*return \{ x: layoutX\(/.test(JADRO) && /function bossPos\(\)[\s\S]{0,600}x: layoutX\(/.test(JADRO),
   'engine kreslí hrdinu i bosse podle layoutX (jediné místo rozložení)');

/* ── B) stálá šířka plátna v prohlížeči ──────────────────────────────── */
const ZARIZENI = [['iPad 10,2" na šířku', 1080, 810], ['iPad Air na šířku', 1180, 820]];

function server(prepis) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); }
    let telo = fs.readFileSync(fp);
    let pr = null;
    for (const [k, f] of Object.entries(prepis || {})) if (k === path.basename(fp)) pr = f;
    if (pr) telo = Buffer.from(pr(telo.toString('utf8')));
    r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream' });
    r.end(telo);
  });
  return new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv)));
}

async function sirky(br, base, g, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  const page = await ctx.newPage();
  await page.goto(`${base}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 15000 });
  const r = await page.evaluate(async () => {
    const ni = document.getElementById('ni'); if (ni) ni.value = 'T';
    startGame(); S.tutorialDone = true;
    const raf = () => new Promise(res => requestAnimationFrame(() => res()));
    const hist = {}; let n = 0;
    for (const ar of AREAS) for (const m of ar.missions) {
      try { launchBattle(ar.id, m.id); } catch (e) { continue; }
      await raf();
      for (let i = 0; i < (BT.tasks || []).length; i++) {
        try { BT.idx = i; renderTask(); } catch (e) { continue; }
        await raf();
        const cv = document.querySelector('.bt-top canvas'); if (!cv) continue;
        hist[cv.clientWidth] = (hist[cv.clientWidth] || 0) + 1; n++;
      }
      try { go('map'); } catch (e) {}
    }
    return { n, hist };
  });
  await ctx.close();
  return r;
}

(async () => {
  console.log('── B) Šířka plátna je u všech úloh stejná (prohlížeč) ──');
  const srv = await server(); const base = 'http://127.0.0.1:' + srv.address().port;
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let ulohy = 0;
  for (const [jm, w, h] of ZARIZENI) for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const r = await sirky(br, base, g, w, h); ulohy += r.n;
    const ks = Object.keys(r.hist).map(Number);
    ok(r.n >= 100, `${g}. ročník ${jm}: změřeno ${r.n} úloh (naměřeno 126)`);
    ok(ks.length === 1, `${g}. ročník ${jm}: šířka plátna je u všech úloh stejná`, 'hodnoty ' + JSON.stringify(r.hist).slice(0, 160));
    ok(ks.length > 0 && Math.min(...ks) >= 340, `${g}. ročník ${jm}: plátno nejméně 340 px`, 'min ' + Math.min(...ks));
  }
  ok(ulohy >= 14 * 100, 'celkem změřeno dost úloh: ' + ulohy);
  srv.close();

  // sabotáž: 3. ročník bez `width:100%` na `.wrap` v boji → plátno zase skáče
  const srvS = await server({ 'rpg-mat-3.html': t => t.replace('#s-battle .wrap{width:100%;max-width:1180px', '#s-battle .wrap{max-width:1180px') });
  const rs = await sirky(br, 'http://127.0.0.1:' + srvS.address().port, 3, 1080, 810);
  const ksS = Object.keys(rs.hist).map(Number);
  ok(ksS.length > 1 && Math.min(...ksS) < 340, 'sabotáž „.wrap bez width:100%“ je chycena (šířky ' + ksS.length + ', min ' + Math.min(...ksS) + ' px)');
  srvS.close();
  await br.close();

  console.log('\n' + (fail ? '❌' : '✅') + ' Rozestup arény: ' + pass + ' ✅, ' + fail + ' ❌');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
