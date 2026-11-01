/* ══════════════════════════════════════════════════════════════════════
   Boj a obchod na velké obrazovce (`projects/rpg-siroke.css` + zvětšení arény v `rpg-sprite-core.js`, 7 her).

   Dřív byl boj na monitoru a dataprojektoru úzký sloupec (680 px = 35 % šířky na 1920, 27 % na 2560) s arénou 638 × 200 px
   a obchod měl dvě karty vedle sebe. Teď:
     - boj od 1400 px šířky a výšky NAD 860 px (na šířku): dva sloupce jako na tabletu, aréna přesně dvakrát větší
       (`--bt-zoom: 2` čte jádro; bitmapa zůstává stejně velká, prohlížeč ji zvětší celočíselně, pixely jsou celé),
     - obchod od 900 px na šířku: karty vedle sebe (`auto-fill`, min. 240 px).
   Tablet na šířku (výška ≤ 860 px), telefon a tablet na výšku zůstávají beze změny.

   Ověřuje se:
     1. ZVĚTŠENÍ (1440×900, 1536×864, 1920×1080, 2560×1440 × 7 her): `--bt-zoom` = 2, plátno je přesně 2× bitmapa (ne 1,5×, ne protažené),
        výška 400 = 2 × 200, šířka bitmapy 340–700 px (rozmístění hrdiny a bosse je navržené pro tuto šířku)
     2. DVA SLOUPCE: aréna vlevo, úloha vpravo (aspoň 420 px), mezi nimi mezera ≥ 16 px, začínají u sebe
     3. nic nepřetéká do šířky ani do výšky (stránka se v boji nerolují), ÚTĚK / ÚTOK / NÁPOVĚDA jsou v okně a nic je nezakrývá (`elementFromPoint`)
     4. SKUTEČNÁ HRA: správná odpověď → ÚTOK (skutečný klik myší) → DÁLE je vidět, jde stisknout a posune úlohu
     5. výkon: bitmapa plátna se nepřepisuje každý snímek (počítá se zápis do `canvas.width`; při zvětšení musí jádro srovnávat
        s `clientWidth / zoom`, jinak se plátno maže 60× za sekundu)
     6. BEZE ZMĚNY: tablet na šířku (1180×820, 1400×860 — hranice výšky), 1399×900 (hranice šířky), 1024×1366 a telefon 390×844 mají rozměry
        boje i obchodu stejné jako se styly BEZ nových pravidel a plátno beze zvětšení (css = bitmapa, 200 px)
     7. OBCHOD: od 900 px na šířku aspoň 3 sloupce karet (od 1366 px aspoň 4), karty se nepřekrývají a nepřetékají
   Sabotáže (8): hranice výšky, zlomkové zvětšení, bez zvětšení, jeden sloupec, jádro bez zvětšení, jádro přepisuje bitmapu každý snímek,
   obchod dva sloupce, obchod bez orientace.
   Spusť: node tests/rpg-siroke-boj.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const LAUNCH = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };
/* Velká okna: 1920×1080 (plný průchod hrou) a 1536×864 (nejnižší okno, kam zvětšení ještě sahá — nesmí se rolovat) ve všech 7 hrách,
   hranice šířky 1440 a velký monitor 2560 jen ve hrách 3 a 9 (po jedné z každého stupně; styl je sdílený). */
const PLAN_VELKE = [[HRY_VSE(), [[1920, 1080, true], [1536, 864, false]]], [[3, 9], [[1440, 900, false], [2560, 1440, false]]]];
/* Beze změny: [hry, rozměry, porovnat i obchod]. Obchod se od 900 px NA ŠÍŘKU mění záměrně, takže se porovnává jen na výšku a na telefonu. */
const PLAN_BEZ_ZMENY = [[HRY_VSE(), [[1180, 820]], false], [[3, 9], [[1400, 860], [1399, 900]], false], [[3, 9], [[1024, 1366], [390, 844]], true]];
function HRY_VSE() { return [3, 4, 5, 6, 7, 8, 9]; }
const CSS = 'rpg-siroke.css', JADRO = 'rpg-sprite-core.js';
const PODLAHA_VELKE = 190, PODLAHA_BEZ = 34;                               // naměřeno (jedno měření plánu je deterministické, plán je pevný)
const ZNACKA = '/* BOJ na velké obrazovce';                                  // od ní dál jsou nová pravidla (boj + obchod)

function server(prepis) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); }
    let telo = fs.readFileSync(fp), pr = null;
    for (const [k, f] of Object.entries(prepis || {})) if (k === path.basename(fp)) pr = f;
    if (pr) telo = Buffer.from(pr(telo.toString('utf8')));
    r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream', 'cache-control': 'no-store' });
    r.end(telo);
  });
  return new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv)));
}
const baseOf = srv => 'http://127.0.0.1:' + srv.address().port;

/* Hra v daném okně: pevné losování (stejné úlohy při každém načtení), čisté textové kolo bez minihry, počítadlo zápisů do plátna arény */
async function otevri(br, base, g, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(() => {
    let a = 1234567;
    Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    window.__cvw = 0;
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
    Object.defineProperty(HTMLCanvasElement.prototype, 'width', { configurable: true, get() { return d.get.call(this); }, set(v) { if (this.id === 'bt-arena') window.__cvw++; d.set.call(this, v); } });
  });
  const p = await ctx.newPage();
  const chyby = [];
  p.on('pageerror', e => chyby.push(e.message));
  await p.goto(base + '/projects/rpg-mat-' + g + '.html');
  await p.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 20000 });
  await p.evaluate(() => { document.getElementById('ni').value = 'Vojta'; startGame(); S.tutorialDone = true; go('map'); });
  return { ctx, p, chyby };
}

async function spustBoj(p, ms) {
  await p.evaluate(() => {
    const ar = AREAS[2], mi = ar.missions.find(m => !m.mc) || ar.missions[0];
    launchBattle(ar.id, mi.id);
    const i = BT.tasks.findIndex(t => !isYN(t));
    if (i >= 0) { BT.mini[i] = null; BT.idx = i; renderTask(); }
  });
  await p.waitForTimeout(ms || 1900);                         // vstupní animace boje (700 ms) + dokreslení arény
}

const MER_BOJ = () => {
  const R = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(x => Math.round(x * 10) / 10); };
  const trefa = s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === e || e.contains(t)); };
  const vOkne = s => { const r = R(s); return !!r && r[0] >= 0 && r[1] >= 0 && r[0] + r[2] <= innerWidth + 0.5 && r[1] + r[3] <= innerHeight + 0.5; };
  const cv = document.getElementById('bt-arena');
  return {
    zoom: getComputedStyle(document.getElementById('s-battle')).getPropertyValue('--bt-zoom').trim(),
    cv: R('#bt-arena'), bmp: cv ? [cv.width, cv.height] : null, top: R('#bt-top'), ca: R('#s-battle .bt-col-arena'), ct: R('#s-battle .bt-col-task'),
    prob: R('#bt-prob'), atk: R('#attack-btn'), hint: R('#hint-btn'), esc: R('#s-battle .topnav .btn'),
    sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight,
    aktivni: document.querySelectorAll('.screen.active').length,
    trefy: { atk: trefa('#attack-btn'), hint: trefa('#hint-btn'), esc: trefa('#s-battle .topnav .btn') },
    vOkne: { atk: vOkne('#attack-btn'), hint: vOkne('#hint-btn'), esc: vOkne('#s-battle .topnav .btn') },
  };
};

const MER_OBCHOD = () => {
  go('shop'); renderShop();
  return new Promise(res => setTimeout(() => {
    const k = [...document.querySelectorAll('#s-shop .shop-grid > *')].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(x => Math.round(x * 10) / 10); });
    const g = document.querySelector('#s-shop .shop-grid').getBoundingClientRect();
    res({ karty: k, mrizka: [g.left, g.width].map(x => Math.round(x * 10) / 10), sw: document.documentElement.scrollWidth, iw: innerWidth });
  }, 400));
};
const sloupcu = karty => new Set(karty.map(k => Math.round(k[0]))).size;
const prekryv = karty => { for (let i = 0; i < karty.length; i++) for (let j = i + 1; j < karty.length; j++) { const a = karty[i], b = karty[j]; if (a[0] < b[0] + b[2] - 1 && b[0] < a[0] + a[2] - 1 && a[1] < b[1] + b[3] - 1 && b[1] < a[1] + a[3] - 1) return true; } return false; };

/* ── velké obrazovky: zvětšení, dva sloupce, ovladače, obchod ── */
async function velke(br, base, plan, f, smyckaBitmapy) {
  let kontrol = 0;
  for (const [hry, vel] of plan) for (const g of hry) for (const [w, h, hra] of vel) {
    const { ctx, p, chyby } = await otevri(br, base, g, w, h);
    await spustBoj(p);
    const m = await p.evaluate(MER_BOJ), jm = 'g' + g + ' ' + w + '×' + h;
    f(m.zoom === '2', jm + ': --bt-zoom je 2', 'je „' + m.zoom + '“'); kontrol++;
    f(!!m.cv && !!m.bmp && Math.abs(m.cv[2] - 2 * m.bmp[0]) <= 2 && m.cv[3] === 400 && m.bmp[1] === 200, jm + ': plátno je přesně 2× bitmapa (výška 400 = 2 × 200)', 'css ' + (m.cv || []).slice(2) + ', bitmapa ' + m.bmp); kontrol++;
    f(!!m.bmp && m.bmp[0] >= 340 && m.bmp[0] <= 700, jm + ': bitmapa arény je 340–700 px široká (pro tuto šířku je navržené rozmístění)', 'je ' + (m.bmp || [])[0]); kontrol++;
    f(!!m.ca && !!m.ct && m.ca[0] + m.ca[2] + 16 <= m.ct[0] + 0.5 && m.ct[2] >= 420 && Math.abs(m.ca[1] - m.ct[1]) <= 30, jm + ': aréna vlevo, úloha vpravo (≥ 420 px), mezera ≥ 16 px, začínají u sebe', 'aréna ' + m.ca + ', úloha ' + m.ct); kontrol++;
    f(m.sw <= m.iw && m.sh <= m.ih + 1, jm + ': boj nepřetéká a nerolují (' + m.sw + '×' + m.sh + ' v ' + m.iw + '×' + m.ih + ')'); kontrol++;
    f(m.aktivni === 1, jm + ': právě jedna aktivní obrazovka', String(m.aktivni)); kontrol++;
    f(m.trefy.atk && m.trefy.hint && m.trefy.esc && m.vOkne.atk && m.vOkne.hint && m.vOkne.esc, jm + ': ÚTĚK, ÚTOK a NÁPOVĚDA jsou v okně a nic je nezakrývá', JSON.stringify(m.trefy) + JSON.stringify(m.vOkne)); kontrol++;

    /* skutečná hra (jen v 1920×1080): správná odpověď → ÚTOK klikem → DÁLE klikem posune úlohu */
    if (hra) {
    const i0 = await p.evaluate(() => BT.idx), odp = await p.evaluate(() => String(BT.tasks[BT.idx].ans));
    await p.fill('#bt-ans', odp);
    let b = await p.locator('#attack-btn').boundingBox();
    await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    const dale = await p.waitForFunction(() => { const n = document.getElementById('next-btn'); return !!n && !!n.offsetParent; }, null, { timeout: 5000 }).then(() => true, () => false);
    f(dale, jm + ': po správné odpovědi a kliknutí na ÚTOK se ukáže DÁLE'); kontrol++;
    if (dale) {
      await p.waitForTimeout(700);                                        // pojistka 400 ms proti dvojitému ťuknutí
      const d = await p.evaluate(() => { const n = document.getElementById('next-btn'), r = n.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { trefa: !!t && (t === n || n.contains(t)), povoleno: !n.disabled, v: r.bottom <= innerHeight + 0.5 && r.top >= 0 }; });
      f(d.trefa && d.povoleno && d.v, jm + ': DÁLE jde stisknout (zásah, povoleno, v okně)', JSON.stringify(d)); kontrol++;
      b = await p.locator('#next-btn').boundingBox();
      await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      const dal = await p.waitForFunction(i => BT.idx > i || !document.getElementById('s-battle').classList.contains('active'), i0, { timeout: 5000 }).then(() => true, () => false);
      f(dal, jm + ': kliknutí na DÁLE posune úlohu'); kontrol++;
    }
    }
    f(chyby.length === 0, jm + ': bez výjimek na stránce', chyby[0]); kontrol++;

    /* výkon: bitmapa se nepřepisuje každý snímek (jen jednou na jedné velikosti) */
    if (smyckaBitmapy && hra) {
      await spustBoj(p);
      const a = await p.evaluate(() => window.__cvw); await p.waitForTimeout(1000); const z = await p.evaluate(() => window.__cvw);
      f(z - a <= 2, jm + ': bitmapa arény se za sekundu přepsala nejvýš 2× (ne každý snímek)', (z - a) + '×'); kontrol++;
    }

    /* obchod */
    const o = await p.evaluate(MER_OBCHOD);
    const sl = sloupcu(o.karty), minSl = w >= 1366 ? 4 : 3;
    f(o.karty.length >= 6 && sl >= minSl && !prekryv(o.karty) && o.sw <= o.iw && Math.min(...o.karty.map(k => k[2])) >= 200, jm + ': obchod má ≥ ' + minSl + ' sloupce karet, karty se nepřekrývají a nepřetékají', sl + ' sloupců, ' + o.karty.length + ' karet, přetečení ' + (o.sw - o.iw)); kontrol++;
    await ctx.close();
  }
  return kontrol;
}

/* ── beze změny: rozměry boje a obchodu a plátno bez zvětšení jako bez nových pravidel ── */
async function snimek(br, base, g, w, h, sObchodem) {
  const { ctx, p } = await otevri(br, base, g, w, h);
  await spustBoj(p, 1100);
  const boj = await p.evaluate(MER_BOJ), obchod = sObchodem ? await p.evaluate(MER_OBCHOD) : null;
  await ctx.close();
  return { boj, obchod };
}
async function bezZmeny(br, srvS, srvPrazdny, plan, f) {
  let kontrol = 0;
  for (const [hry, vel, sObchodem] of plan) for (const g of hry) for (const [w, h] of vel) {
    const a = await snimek(br, baseOf(srvS), g, w, h, sObchodem), b = await snimek(br, baseOf(srvPrazdny), g, w, h, sObchodem), jm = 'g' + g + ' ' + w + '×' + h;
    f(JSON.stringify(a.boj) === JSON.stringify(b.boj), jm + ': rozměry boje jsou stejné jako bez nových pravidel', JSON.stringify(a.boj.ca) + ' / ' + JSON.stringify(b.boj.ca) + ' | ' + JSON.stringify(a.boj.cv) + ' / ' + JSON.stringify(b.boj.cv)); kontrol++;
    if (sObchodem) { f(JSON.stringify(a.obchod) === JSON.stringify(b.obchod), jm + ': rozměry obchodu jsou stejné jako bez nových pravidel', sloupcu(a.obchod.karty) + ' vs ' + sloupcu(b.obchod.karty) + ' sloupců'); kontrol++; }
    f(a.boj.zoom === '' && a.boj.cv && Math.abs(a.boj.cv[2] - a.boj.bmp[0]) <= 1 && a.boj.cv[3] === 200, jm + ': plátno bez zvětšení (css = bitmapa, výška 200)', 'zoom „' + a.boj.zoom + '“, css ' + (a.boj.cv || []).slice(2) + ', bitmapa ' + a.boj.bmp); kontrol++;
  }
  return kontrol;
}

async function hlavni() {
  const br = await chromium.launch(LAUNCH);
  const srv = await server();
  const bezNovych = s => s.slice(0, s.indexOf(ZNACKA));
  const prazdny = await server({ [CSS]: bezNovych });
  const nalezy = [];
  const f = (c, m, d) => { if (!c) nalezy.push(m + (d ? ' — ' + d : '')); };

  console.log('\n── Boj a obchod na velké obrazovce (7 her) ──\n');
  const css0 = fs.readFileSync(path.join(ROOT, 'projects', CSS), 'utf8');
  ok(css0.indexOf(ZNACKA) > 0, 'nová pravidla začínají značkou, kterou test odřezává');
  const k1 = await velke(br, baseOf(srv), PLAN_VELKE, f, true);
  const k2 = await bezZmeny(br, srv, prazdny, PLAN_BEZ_ZMENY, f);
  nalezy.slice(0, 12).forEach(n => console.log('  ⚠ ' + n));
  ok(nalezy.length === 0, 'skutečná hra projde všemi kontrolami', nalezy.slice(0, 4).join(' | '));
  ok(k1 === PODLAHA_VELKE && k2 === PODLAHA_BEZ, 'proběhl očekávaný počet měření', k1 + ' + ' + k2);
  console.log('  skutečná hra: ' + (nalezy.length ? nalezy.length + ' nálezů' : 'bez nálezu') + ' (' + (k1 + k2) + ' kontrol)');
  srv.close(); prazdny.close();

  /* ── sabotáže ── */
  const jadro0 = fs.readFileSync(path.join(ROOT, 'projects', JADRO), 'utf8');
  async function sabotaz(jm, soubor, zmena, rx, co) {
    const orig = soubor === CSS ? css0 : jadro0;
    const nove = zmena(orig), zmeneno = nove !== orig;
    ok(zmeneno, 'sabotáž „' + jm + '“ se aplikovala');
    if (!zmeneno) return;
    const sS = await server({ [soubor]: zmena }), sP = await server({ [CSS]: bezNovych });
    const n = [], ff = (c, m, d) => { if (!c) n.push(m + (d ? ' — ' + d : '')); };
    if (co === 'bez zmeny') await bezZmeny(br, sS, sP, [[[9], [[1400, 860]], false], [[9], [[1024, 1366]], true]], ff);
    else await velke(br, baseOf(sS), [[[9], [[1920, 1080, true]]]], ff, co === 'vykon');
    ok(n.length > 0 && n.some(t => rx.test(t)), 'sabotáž „' + jm + '“ je chycena', n.length ? n[0] : 'prošla bez nálezu');
    sS.close(); sP.close();
  }
  await sabotaz('hranice výšky 861 px pryč', CSS, s => s.replace('(min-width:1400px) and (min-height:861px) and (orientation:landscape)', '(min-width:1400px) and (orientation:landscape)'), /rozměry boje jsou stejné/, 'bez zmeny');
  await sabotaz('zlomkové zvětšení 1,5', CSS, s => s.replace('--bt-zoom:2', '--bt-zoom:1.5'), /--bt-zoom je 2|přesně 2×/);
  await sabotaz('bez zvětšení', CSS, s => s.replace('#s-battle{--bt-zoom:2}', ''), /--bt-zoom je 2|přesně 2×/);
  await sabotaz('jeden sloupec', CSS, s => s.replace('#s-battle .bt-cols{display:grid;', '#s-battle .bt-cols{'), /aréna vlevo, úloha vpravo/);
  await sabotaz('jádro bez zvětšení', JADRO, s => s.replace('return z >= 2 ? 2 : 1;', 'return 1;'), /přesně 2×/);
  await sabotaz('jádro přepisuje bitmapu každý snímek', JADRO, s => s.replace('cv.width !== Math.round(cv.clientWidth / zoom())', 'cv.width !== cv.clientWidth'), /bitmapa arény se za sekundu/, 'vykon');
  await sabotaz('obchod dva sloupce', CSS, s => s.replace('repeat(auto-fill,minmax(240px,1fr))', 'repeat(2,1fr)'), /obchod má/);
  await sabotaz('obchod bez orientace', CSS, s => s.replace('@media (min-width:900px) and (orientation:landscape){\n  #s-shop', '@media (min-width:900px){\n  #s-shop'), /rozměry obchodu jsou stejné/, 'bez zmeny');

  await br.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
}
hlavni().catch(e => { console.error(e); process.exit(1); });
