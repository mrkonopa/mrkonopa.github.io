/* ═════════════════════════════════════════════════════════════════════
   Témata z obchodu ve hrách 3.–9. ročníku: pozadí stránky (`canvas[data-tema]`) a nános v aréně (`setThemeFx`).

   Čistá část (`rpg-temata`) ověří kresbu; tady se ověří, že pozadí dítěti NEPŘEKÁŽÍ a opravdu je ve hře:
     1. zapojení: po aktivaci tématu je na stránce právě jedno plátno daného tématu, `position:fixed`, `z-index:-1`,
        `pointer-events:none`, přes celé okno, s nakreslenými pixely; v mřížce bodů přes okno nikdy není plátno;
        výchozí téma plátno nemá
     2. ČITELNOST textu nad pozadím (hlavní důvod testu): pro každý viditelný text na obrazovkách mapa / oblast / boj / profil / obchod
        (tablet na šířku i telefon) se složí barva pozadí (průhledné vrstvy rodičů přes pixely pozadí tématu přes ~20 s pohybu;
        z pozadí se bere 95. a 5. percentil jasu v obdélníku textu, takže jedna sněhová vločka text neshodí, ale světlá plocha ano)
        a kontrast musí zůstat ≥ 4,5 : 1 (velké písmo 3 : 1). Hlásí se jen REGRESE od tématu: text, který ve výchozím tématu
        prošel a s tématem ne (vady z dřívějška se tu nepočítají dvakrát)
     3. aréna (snížený pohyb, aby byl snímek pevný): nános se v aréně opravdu kreslí (mění ≥ 0,5 % pixelů), nezakrývá svět
        (průměrná změna kanálu < 40/255, málo pixelů se změnou nad 120) a kreslí se PŘED postavami (i plně krycí nános nechá hrdinu a bosse vidět)
     4. snížený pohyb: plátno stránky se nehýbe a je rovno snímku `STILL` z modulu
     5. obchod, kategorie „Téma“: u každého tématu tlačítko „▶ NÁHLED 4 s“; po kliknutí se téma zapne a po 4 s vrátí AKTIVNÍ
        téma (i kdyby dítě mezitím jiné koupilo) — časování jen 9. ročník (9 s čekání), počet a text tlačítek ve všech sedmi
     6. bez modulu hra běží po starém (jen přebarvení), bez chyb
   Sabotáže: hra bez zapojení, plátno nad hrou, nános bez kreslení v aréně, příliš světlé pozadí, obchod bez náhledu, náhled s pevným návratem.
   Spusť: node tests/rpg-temata-hry.test.cjs
   ═════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const LAUNCH = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };
const TEMATA = ['matrix', 'blood', 'violet', 'space', 'temple', 'vanoce', 'leto'];
const CASY = [0, 700, 1900, 3100, 4200, 5600, 7000, 8300, 9700, 12000, 15000, 21000];

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

/* ── měření ve stránce: kontrast každého textu proti pozadí tématu ── */
const MER = ({ key, casy }) => {
  const parse = c => { const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || ''); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const pomer = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const over = (v, s) => ({ r: v.r * v.a + s.r * (1 - v.a), g: v.g * v.a + s.g * (1 - v.a), b: v.b * v.a + s.b * (1 - v.a), a: 1 });
  const PX = innerWidth < 600 ? 4 : 6, Wl = Math.ceil(innerWidth / PX), Hl = Math.ceil(innerHeight / PX);
  let fr = null;
  if (key) {
    window.__ENV = window.__ENV || {};
    const ck = key + '@' + Wl + 'x' + Hl;
    fr = window.__ENV[ck];
    if (!fr) {
      fr = [];
      const cv = document.createElement('canvas'); cv.width = Wl; cv.height = Hl;
      const c = cv.getContext('2d', { willReadFrequently: true });
      for (const t of casy) { c.globalAlpha = 1; c.fillStyle = '#000'; c.fillRect(0, 0, Wl, Hl); RPGTemata.frame(c, key, t, Wl, Hl); fr.push(c.getImageData(0, 0, Wl, Hl).data); }
      window.__ENV[ck] = fr;
    }
  }
  const bodyBg = parse(getComputedStyle(document.body).backgroundColor) || { r: 0, g: 0, b: 0, a: 1 };
  const sig = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');
  const out = { mereno: 0, plny: 0, nejiste: 0, mimo: 0, prvky: {} };
  for (const el of document.querySelectorAll('body *')) {
    const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!txt) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let pruh = 1, p = el;
    while (p && p !== document.documentElement) { pruh *= parseFloat(getComputedStyle(p).opacity || '1'); p = p.parentElement; }
    if (pruh < 0.15) continue;
    if (el.closest('canvas,svg,script,style')) continue;
    const fg0 = parse(cs.color); if (!fg0) continue;
    const layers = []; let plny = false, obr = false; p = el;
    while (p && p !== document.body) {
      const c2 = getComputedStyle(p);
      if (c2.backgroundImage !== 'none') { obr = true; break; }
      const b = parse(c2.backgroundColor);
      if (b && b.a > 0) { layers.push(b); if (b.a >= 0.99) { plny = true; break; } }
      p = p.parentElement;
    }
    if (obr) { out.nejiste++; continue; }
    const fs = parseFloat(cs.fontSize), velky = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const slozit = pix => { let res = pix; for (let i = layers.length - 1; i >= 0; i--) res = over(layers[i], res); return fg0.a < 1 ? { fg: over(fg0, res), bg: res } : { fg: fg0, bg: res }; };
    const kand = [];
    if (plny || !key) kand.push({ r: bodyBg.r, g: bodyBg.g, b: bodyBg.b, a: 1 });
    else {
      let top = r.top, mimo = false;
      if (r.bottom <= 0 || r.top >= innerHeight) { top = ((r.top % innerHeight) + innerHeight) % innerHeight; mimo = true; }
      const x0 = Math.max(0, Math.floor(r.left / PX)), x1 = Math.min(Wl - 1, Math.ceil((r.left + r.width) / PX));
      const y0 = Math.max(0, Math.floor(top / PX)), y1 = Math.min(Hl - 1, Math.ceil((top + r.height) / PX));
      if (x1 < x0 || y1 < y0) { out.mimo++; continue; }
      if (mimo) out.mimo++;
      const sn = [];
      for (const d of fr) {
        let R = 0, G = 0, B = 0, n = 0;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * Wl + x) * 4; R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; }
        const cc = { r: R / n, g: G / n, b: B / n, a: 1 };
        sn.push([lum(cc), cc]);
      }
      sn.sort((u, v) => u[0] - v[0]);
      const hi = sn[Math.floor(0.75 * (sn.length - 1))], lo = sn[Math.floor(0.25 * (sn.length - 1))];
      kand.push(hi[1], lo[1]);
    }
    let c = Infinity;
    for (const k of kand) { const s = slozit(k); c = Math.min(c, pomer(s.fg, s.bg)); }
    if (plny) out.plny++; else out.mereno++;
    out.prvky[sig(el) + '|' + txt.slice(0, 24)] = { c: +c.toFixed(2), velky, plny };
  }
  return out;
};

const OTEVRI = {
  map: () => go('map'),
  area: () => { go('map'); openArea(AREAS[0].id); },
  battle: () => { launchBattle(AREAS[0].id, AREAS[0].missions[1].id); },
  profile: () => go('profile'),
  shop: () => { go('shop'); try { shopCat('theme'); } catch (e) { setShopCat('theme', document.querySelectorAll('.shop-tab')[2]); } }
};
const NASTAV = k => { RPGWallet.activate('theme-' + (k || 'default')); applyCosmetics(); };

const STAV_PLATNA = () => {
  const cv = Array.from(document.querySelectorAll('canvas[data-tema]'));
  const o = { n: cv.length, tema: cv[0] ? cv[0].dataset.tema : null, html: document.documentElement.dataset.theme || '' };
  if (cv[0]) {
    const c = cv[0], cs = getComputedStyle(c), r = c.getBoundingClientRect();
    o.css = cs.position + '/' + cs.zIndex + '/' + cs.pointerEvents;
    o.sirka = r.width; o.vyska = r.height; o.okno = innerWidth + 'x' + innerHeight;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let nenul = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 0) nenul++;
    o.kresleno = nenul / (d.length / 4);
    o.zasah = 0;
    for (let x = 0.03; x < 1; x += 0.1) for (let y = 0.04; y < 1; y += 0.12) { const e = document.elementFromPoint(innerWidth * x, innerHeight * y); if (e === c) o.zasah++; }
  }
  return o;
};

async function novyKontext(br, base, g, v) {
  const ctx = await br.newContext(Object.assign({ viewport: { width: 1180, height: 820 }, hasTouch: true }, v || {}));
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(([t]) => {
    try { localStorage.setItem('RPG_HUB_WALLET', JSON.stringify({ v: 1, credits: 9000, cosmetics: { owned: ['theme-default'].concat(t.map(x => 'theme-' + x)), active: { border: null, badge: null, theme: 'theme-default', victory: 'victory-default', skin: null, title: null, pet: null } } })); } catch (e) {}
  }, [TEMATA]);
  const page = await ctx.newPage();
  const chyby = []; page.on('pageerror', e => chyby.push(e.message));
  await page.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 15000 });
  await page.evaluate(() => { const ni = document.getElementById('ni'); if (ni) ni.value = 'T'; startGame(); S.tutorialDone = true; });
  return { ctx, page, chyby };
}

/* ── hlavní průchod jednou hrou ── */
async function proverHru(br, base, g, o) {
  o = Object.assign({ velikosti: [[1180, 820, ['map', 'area', 'battle', 'profile', 'shop']], [390, 844, ['map', 'area', 'battle']]], temata: TEMATA }, o || {});
  const nalezy = []; let kontrol = 0, meren = 0, mimo = 0;
  const c = (cond, text) => { kontrol++; if (!cond) nalezy.push(g + '. ročník: ' + text); };
  const { ctx, page, chyby } = await novyKontext(br, base, g);
  c(await page.evaluate(() => !!window.RPGTemata), 'modul RPGTemata se nenačetl');
  for (const [W, H, obrazovky] of o.velikosti) {
    await page.setViewportSize({ width: W, height: H });
    for (const ob of obrazovky) {
      await page.evaluate(OTEVRI[ob]);
      await page.waitForTimeout(ob === 'battle' ? 700 : 200);
      await page.evaluate(NASTAV, '');
      await page.waitForTimeout(80);
      const m0 = await page.evaluate(MER, { key: '', casy: CASY });
      if (ob === 'map') { const s0 = await page.evaluate(STAV_PLATNA); c(s0.n === 0, W + ': výchozí téma má plátno (' + s0.n + ')'); }
      for (const k of o.temata) {
        await page.evaluate(NASTAV, k);
        await page.waitForTimeout(ob === 'map' ? 260 : 60);
        if (ob === 'map') {
          const s = await page.evaluate(STAV_PLATNA);
          c(s.n === 1 && s.tema === k && s.html === k, W + ' ' + k + ': plátno tématu není právě jedno (n=' + s.n + ', tema=' + s.tema + ', html=' + s.html + ')');
          if (s.n === 1) {
            c(s.css === 'fixed/-1/none', W + ' ' + k + ': plátno má styl ' + s.css + ' (chci fixed/-1/none)');
            c(Math.abs(s.sirka - W) <= 1 && Math.abs(s.vyska - H) <= 1, W + ' ' + k + ': plátno ' + s.sirka + 'x' + s.vyska + ' nekryje okno ' + s.okno);
            c(s.kresleno > 0.9, W + ' ' + k + ': plátno je skoro prázdné (' + (s.kresleno * 100).toFixed(0) + ' % nakresleno)');
            c(s.zasah === 0, W + ' ' + k + ': plátno chytá zásah (' + s.zasah + ' bodů v mřížce)');
          }
        }
        const m = await page.evaluate(MER, { key: k, casy: CASY });
        meren += m.mereno; mimo += m.mimo;
        for (const [kl, e] of Object.entries(m.prvky)) {
          if (e.plny) continue;
          const prah = e.velky ? 3 : 4.5, d = m0.prvky[kl];
          if (e.c < prah && (!d || d.c >= prah)) c(false, W + ' ' + ob + ' ' + k + ': text „' + kl.split('|')[1] + '“ (' + kl.split('|')[0] + ') má kontrast ' + e.c + ' proti ' + (d ? d.c + ' ve výchozím' : 'ničemu (nový prvek)') + ' (práh ' + prah + ')');
          else kontrol++;
        }
      }
      await page.evaluate(NASTAV, '');
    }
  }
  c(chyby.length === 0, 'chyby stránky: ' + chyby.slice(0, 2).join(' | '));
  await ctx.close();
  return { nalezy, kontrol, meren, mimo };
}

/* ── aréna a snížený pohyb (snímek je pevný) ── */
async function proverArenu(br, base, g, o) {
  o = Object.assign({ temata: TEMATA }, o || {});
  const nalezy = []; let kontrol = 0;
  const c = (cond, text) => { kontrol++; if (!cond) nalezy.push(g + '. ročník (aréna): ' + text); };
  const { ctx, page, chyby } = await novyKontext(br, base, g, { reducedMotion: 'reduce' });
  /* Snímek arény se ukládá a porovnává VE STRÁNCE (1 MB na snímek přes protokol by test zdvojnásobil). Plátno je z 59 % průhledné,
     proto se porovnává složený obraz (plátno přes barvu pozadí arény), ne surová data kanálů. */
  const ARENA = async (k, jmeno) => {
    await page.evaluate(() => go('map'));
    await page.evaluate(NASTAV, k);
    await page.evaluate(OTEVRI.battle);
    await page.waitForFunction(() => { const cv = document.querySelector('#bt-top canvas'); if (!cv || !cv.width) return false; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4 * 20) if (d[i] > 0) n++; return n > d.length / 80 * 0.2; }, null, { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(250);
    return page.evaluate(j => {
      const cv = document.querySelector('#bt-top canvas'); if (!cv) return false;
      const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height;
      const x = o.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#0f1730'; x.fillRect(0, 0, o.width, o.height); x.drawImage(cv, 0, 0);
      (window.__AR = window.__AR || {})[j] = { w: o.width, h: o.height, d: x.getImageData(0, 0, o.width, o.height).data };
      return true;
    }, jmeno || k);
  };
  const rozdil = (a, b) => page.evaluate(([a, b]) => {
    const A = window.__AR[a], B = window.__AR[b]; if (!A || !B || A.w !== B.w || A.h !== B.h) return null;
    let zmen = 0, velka = 0, soucet = 0; const n = A.w * A.h;
    for (let i = 0; i < A.d.length; i += 4) {
      const d0 = Math.abs(A.d[i] - B.d[i]), d1 = Math.abs(A.d[i + 1] - B.d[i + 1]), d2 = Math.abs(A.d[i + 2] - B.d[i + 2]), dif = Math.max(d0, d1, d2);
      if (dif > 0) zmen++; if (dif > 120) velka++; soucet += (d0 + d1 + d2) / 3;
    }
    return { zmen: zmen / n, velka: velka / n, prum: soucet / n };
  }, [a, b]);
  await ARENA('', 'z');                        // zahřívací spuštění
  const ma = await ARENA('', 'z'), mb = await ARENA('', 'z2');
  c(ma && mb, 'plátno arény nenalezeno');
  if (ma && mb) {
    const sum = await rozdil('z', 'z2');       // šum samotné scény (dýchání postav): nános se měří NAD ním
    for (const k of o.temata) {
      const okk = await ARENA(k);
      const r = okk && await rozdil(k, 'z');
      if (!r) { c(false, k + ': plátno arény jiných rozměrů nebo chybí'); continue; }
      if (process.env.TEMATA_DEBUG) console.log('   aréna ' + g + ' ' + k + ': změněno ' + (r.zmen * 100).toFixed(1) + ' % (šum ' + (sum.zmen * 100).toFixed(1) + '), prům. ' + r.prum.toFixed(1) + ' (šum ' + sum.prum.toFixed(1) + '), silných ' + (r.velka * 100).toFixed(1) + ' % (šum ' + (sum.velka * 100).toFixed(1) + ')');
      c(r.zmen - sum.zmen >= 0.2, k + ': nános v aréně nic nemění (' + (r.zmen * 100).toFixed(1) + ' % pixelů, šum ' + (sum.zmen * 100).toFixed(1) + ' %; nános pokrývá celé plátno, čekám aspoň o 20 % víc než šum)');
      c(r.prum - sum.prum < 30, k + ': nános zakrývá svět (průměrná změna kanálu ' + r.prum.toFixed(1) + ' z 255, šum ' + sum.prum.toFixed(1) + ')');
      c(r.velka - sum.velka < 0.06, k + ': nános má příliš mnoho silných pixelů (' + (r.velka * 100).toFixed(1) + ' %, šum ' + (sum.velka * 100).toFixed(1) + ' %)');
    }
    /* nános se kreslí PŘED postavami: i plně krycí nános nechá hrdinu a bosse vidět */
    await page.evaluate(() => { RPGTemata.arenaFx = () => (cx, e) => { cx.globalAlpha = 1; cx.fillStyle = '#ff00ff'; cx.fillRect(0, 0, e.w, e.h); }; });
    await ARENA('matrix', 'mg');
    const mg = await page.evaluate(() => {
      const cv = document.querySelector('#bt-top canvas'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let m = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i + 1] < 20 && d[i + 2] > 240 && d[i + 3] > 240) m++;
      return m / (d.length / 4);
    });
    c(mg > 0.5 && mg < 0.995, 'plně krycí nános zakryl postavy (' + (mg * 100).toFixed(1) + ' % plátna je nános; čekám 50–99,5 %)');
  }
  /* snížený pohyb: plátno stránky se nehýbe a je rovno snímku STILL */
  await page.evaluate(() => go('map'));
  await page.evaluate(NASTAV, 'space'); await page.waitForTimeout(200);
  const hash = () => page.evaluate(() => { const cv = document.querySelector('canvas[data-tema]'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 0; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; });
  const h1 = await hash(); await page.waitForTimeout(500); const h2 = await hash();
  c(h1 === h2, 'pod sníženým pohybem se plátno stránky hýbe');
  const stejne = await page.evaluate(() => {
    const cv = document.querySelector('canvas[data-tema]'); const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height;
    const x = o.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, o.width, o.height); RPGTemata.frame(x, 'space', RPGTemata.STILL, o.width, o.height);
    const a = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, b = x.getImageData(0, 0, o.width, o.height).data;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true;
  });
  c(stejne, 'plátno pod sníženým pohybem není rovno snímku STILL z modulu');
  c(chyby.length === 0, 'chyby stránky: ' + chyby.slice(0, 2).join(' | '));
  await ctx.close();
  return { nalezy, kontrol };
}

/* ── obchod: tlačítko náhledu ── */
async function proverObchod(br, base, g, casovani) {
  const nalezy = []; let kontrol = 0;
  const c = (cond, text) => { kontrol++; if (!cond) nalezy.push(g + '. ročník (obchod): ' + text); };
  const { ctx, page, chyby } = await novyKontext(br, base, g);
  await page.evaluate(OTEVRI.shop);
  await page.waitForTimeout(300);
  const tl = await page.evaluate(() => Array.from(document.querySelectorAll('.kos-nahled')).map(b => b.textContent));
  c(tl.length === TEMATA.length, 'tlačítek náhledu je ' + tl.length + ' (čekám ' + TEMATA.length + ')');
  c(tl.every(t => /NÁHLED/.test(t)), 'text tlačítka náhledu: ' + tl[0]);
  if (casovani && tl.length) {
    const stav = () => page.evaluate(() => ({ tema: document.documentElement.dataset.theme || '', plat: (document.querySelector('canvas[data-tema]') || {}).dataset ? document.querySelector('canvas[data-tema]').dataset.tema : null }));
    await page.evaluate(() => { const b = document.querySelectorAll('.kos-nahled'); b[b.length - 1].click(); });
    await page.waitForTimeout(150);
    const s1 = await stav();
    c(!!s1.tema && s1.plat === s1.tema, 'po kliknutí na náhled se téma nezapnulo (' + JSON.stringify(s1) + ')');
    /* dítě mezitím aktivuje jiné téma → po 4 s se nesmí vrátit původní */
    await page.evaluate(() => { RPGWallet.activate('theme-matrix'); applyCosmetics(); });
    await page.waitForTimeout(4300);
    const s2 = await stav();
    c(s2.tema === 'matrix' && s2.plat === 'matrix', 'po náhledu se vrátilo zastaralé téma (' + JSON.stringify(s2) + ', čekám matrix)');
    await page.evaluate(() => { RPGWallet.activate('theme-default'); applyCosmetics(); });
    await page.evaluate(() => document.querySelectorAll('.kos-nahled')[0].click());
    await page.waitForTimeout(4400);
    const s3 = await stav();
    c(s3.tema === '' && s3.plat === null, 'po 4 s se nevrátilo výchozí téma (' + JSON.stringify(s3) + ')');
  }
  c(chyby.length === 0, 'chyby stránky: ' + chyby.slice(0, 2).join(' | '));
  await ctx.close();
  return { nalezy, kontrol };
}

/* ── bez modulu ── */
async function proverBezModulu(br, base, g) {
  const nalezy = []; let kontrol = 0;
  const c = (cond, text) => { kontrol++; if (!cond) nalezy.push(g + '. ročník (bez modulu): ' + text); };
  const { ctx, page, chyby } = await novyKontext(br, base, g);
  await page.evaluate(NASTAV, 'matrix');
  await page.waitForTimeout(150);
  const s = await page.evaluate(() => ({ html: document.documentElement.dataset.theme, platen: document.querySelectorAll('canvas[data-tema]').length }));
  c(s.html === 'matrix' && s.platen === 0, 'bez modulu: téma ' + s.html + ', pláten ' + s.platen);
  await page.evaluate(OTEVRI.battle); await page.waitForTimeout(400);
  c(chyby.length === 0, 'chyby stránky bez modulu: ' + chyby.slice(0, 2).join(' | '));
  await ctx.close();
  return { nalezy, kontrol };
}

(async () => {
  const br = await chromium.launch(LAUNCH);
  const t0 = Date.now();
  const srv = await server();
  const base = 'http://127.0.0.1:' + srv.address().port;
  console.log('\n── Témata RPG ve hrách ──\n');
  let celkem = 0, meren = 0, mimo = 0;
  for (const g of (process.env.HRY || '3,4,5,6,7,8,9').split(',').map(Number)) {
    const tg = Date.now(); const cas = [];
    const r = await proverHru(br, base, g); celkem += r.kontrol; meren += r.meren; mimo += r.mimo; cas.push(Date.now() - tg);
    r.nalezy.forEach(n => ok(false, n)); pass += r.kontrol - r.nalezy.length;
    const a = await proverArenu(br, base, g, { temata: g === 9 ? TEMATA : ['matrix', 'temple'] }); celkem += a.kontrol; cas.push(Date.now() - tg);
    a.nalezy.forEach(n => ok(false, n)); pass += a.kontrol - a.nalezy.length;
    const ob = await proverObchod(br, base, g, g === 9); celkem += ob.kontrol; cas.push(Date.now() - tg);
    ob.nalezy.forEach(n => ok(false, n)); pass += ob.kontrol - ob.nalezy.length;
    const sb = await server({ ['rpg-mat-' + g + '.html']: t => t.replace('<script defer src="./rpg-temata.js?v=20261031"></script>\n', '') });
    const bm = await proverBezModulu(br, 'http://127.0.0.1:' + sb.address().port, g); sb.close();
    celkem += bm.kontrol; bm.nalezy.forEach(n => ok(false, n)); pass += bm.kontrol - bm.nalezy.length;
    console.log('  g' + g + ': ' + (r.kontrol + a.kontrol + ob.kontrol + bm.kontrol) + ' kontrol, ' + (r.nalezy.length + a.nalezy.length + ob.nalezy.length + bm.nalezy.length) + ' nálezů (' + r.meren + ' textů; čas kontrast ' + (cas[0] / 1000).toFixed(0) + ' s, aréna ' + ((cas[1] - cas[0]) / 1000).toFixed(0) + ' s, obchod ' + ((cas[2] - cas[1]) / 1000).toFixed(0) + ' s, bez modulu ' + ((Date.now() - tg - cas[2]) / 1000).toFixed(0) + ' s)');
  }
  srv.close();
  console.log('  textů s pozadím tématu změřeno: ' + meren + ' (z toho mimo okno přepočteno: ' + mimo + '), čas ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  if (process.env.HRY) { await br.close(); console.log('\n  (vývojový běh HRY=' + process.env.HRY + ', bez sabotáží) ' + pass + ' ✅ / ' + fail + ' ❌\n'); process.exit(fail ? 1 : 0); }
  ok(meren > 1200, 'měřidlo kontrastu skoro nic neměřilo (' + meren + ' textů, čekám přes 1200)');
  ok(celkem >= 1900, 'počet kontrol je podezřele nízký (' + celkem + ')');

  /* ── sabotáže: každá musí být ověřeně aplikovaná a musí ji chytit právě odpovídající kontrola ── */
  async function sab(jmeno, g, soubor, zmena, hledane, volby) {
    const orig = fs.readFileSync(path.join(ROOT, 'projects', soubor), 'utf8');
    if (zmena(orig) === orig) { ok(false, 'sabotáž „' + jmeno + '“ se neaplikovala'); return; }
    const s = await server({ [soubor]: zmena });
    const b = 'http://127.0.0.1:' + s.address().port;
    let n = [];
    for (const f of (volby && volby.kdo) || ['hra']) {
      const r = f === 'hra' ? await proverHru(br, b, g, volby && volby.hra)
        : f === 'arena' ? await proverArenu(br, b, g, volby && volby.arena)
        : await proverObchod(br, b, g, true);
      n = n.concat(r.nalezy);
    }
    s.close();
    ok(n.length > 0 && n.some(t => hledane.test(t)), 'sabotáž „' + jmeno + '“ je chycena', n.length ? n[0] : 'prošla bez nálezu');
  }
  const jedna = { velikosti: [[1180, 820, ['map', 'area']]], temata: ['leto', 'matrix'] };
  await sab('6. ročník bez zapojení v applyCosmetics', 6, 'rpg-mat-6.html', t => t.replace('RPGTemata.apply(_tk);', ''), /plátno tématu není právě jedno|modul/, { hra: jedna });
  await sab('plátno nad hrou a chytá dotyk', 9, 'rpg-temata.js', t => t.replace('z-index:-1;pointer-events:none', 'z-index:5;pointer-events:auto'), /styl|zásah/, { hra: jedna });
  await sab('nános v aréně se nekreslí', 5, 'rpg-sprite-core.js', t => t.replace('if (THEMEFX) {', 'if (THEMEFX && false) {'), /nic nemění/, { kdo: ['arena'], arena: { temata: ['matrix'] } });
  await sab('nános zakrývá svět', 8, 'rpg-temata.js', t => t.replace("R(c, 0, 0, W, hz, '#00ff66', 0.05); R(c, 0, hz, W, H - hz, '#00ff66', 0.09);", "R(c, 0, 0, W, hz, '#00ff66', 1); R(c, 0, hz, W, H - hz, '#00ff66', 1);"), /zakrývá|silných/, { kdo: ['arena'], arena: { temata: ['matrix'] } });
  await sab('příliš světlé pozadí Letních vln', 9, 'rpg-temata.js', t => t.replace("bands(c, W, H, '#03121c', '#04202f', 16);", "bands(c, W, H, '#a8d8ff', '#ffffff', 16);"), /kontrast/, { hra: { velikosti: [[1180, 820, ['map', 'area']]], temata: ['leto'] } });
  await sab('obchod bez náhledu', 3, 'rpg-kosmetika.js', t => t.replace("if (cat === 'theme') {", "if (cat === 'themeX') {"), /tlačítek náhledu/, { kdo: ['obchod'] });
  await sab('náhled s pevným návratem', 9, 'rpg-kosmetika.js', t => t.replace('T.nahled(item.cssKey, aktivniTema, 4000)', 'T.nahled(item.cssKey, aktivniTema(), 4000)'), /zastaralé téma/, { kdo: ['obchod'] });

  await br.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌ (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
  process.exit(fail ? 1 : 0);
})();
