/* ═════════════════════════════════════════════════════════════════════
   Trénink, teorie a Věž legend na velké obrazovce (`projects/rpg-siroke.css` + zvětšení věže v `rpg-mat-6..9.html`, 7 her).

   Dřív to byl úzký sloupec 680 px (35 % šířky na 1920): trénink a teorie se dlouze rolovaly, věž měla plátno 674 × 230 bez zvětšení.
   Teď od 900 px na šířku (tablet na šířku i počítač; telefon a tablet na výšku beze změny):
     - TRÉNINK: výběr tématu = oblasti vedle sebe, procvičování = vlevo stav a postup (lepí se), vpravo úloha,
     - TEORIE: dva sloupce jako noviny (nadpis a úvod přes obě),
     - VĚŽ: vlevo věž, vpravo brána / úloha / konec; od 1400 px věž ×2 (`--tw-zoom` čte skript hry, bitmapa zůstává, prohlížeč ji zvětší).

   Ověřuje se (ovladače SKUTEČNÝMI kliky myší, ne voláním funkcí — vadu „tlačítko je, ale nejde stisknout“ jinak nikdo neuvidí):
     1. TRÉNINK – VÝBĚR: oblasti vedle sebe (≥ 2 sloupce, od 1366 px ≥ 3), nepřekrývají se, nepřetékají, `#train-play` je skrytý,
        klik na téma spustí trénink
     2. TRÉNINK – HRA: `#train-play` je mřížka, stav vlevo a úloha vpravo (mezera ≥ 16 px), picker skrytý; odpověď, OVĚŘIT, NÁPOVĚDA
        a po správné odpovědi DALŠÍ ÚKOL se dají trefit a posunou úlohu; minihry (spojovačka, řazení, pexeso) se otevřou
        ve sloupci s úlohou a nepřetékají
     3. TEORIE: dva sloupce, nadpis přes obě, nic nepřetéká ani nevyčnívá ze sloupce (tabulky, vzorce, obrázky), „BOJOVAT NYNÍ“ jde trefit;
        všech 21 misí × 7 her na 1920 × 1080 a na iPadu na šířku
     4. VĚŽ (6.–9. ročník): věž vlevo, obsah vpravo; zvětšení ×2 od 1400 px (plátno = 2 × bitmapa, výška 460), ×1 pod ním; bitmapa ≥ 300 px
        a hrdina na římse NEVYČNÍVÁ z plátna; vstup do věže, špatná odpověď → DÁLE, správná odpověď → vyšší patro, konec výstupu
     5. BEZE ZMĚNY: telefon na výšku i na šířku, tablet na výšku a hranice 899 px mají rozměry stejné jako se styly BEZ nových pravidel
        (hranice 900 px platí už nová)
   Sabotáže (8): bez orientace, mřížka tréninku vždy zobrazená, bez dvou sloupců teorie, nadpis teorie v jednom sloupci, věž ×2 už od 900 px,
   věž bez zvětšení ve skriptu hry, věž bez minimální šířky sloupce, trénink bez sloupců.
   Spusť: node tests/rpg-siroke-obrazovky.test.cjs
   ═════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const LAUNCH = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };
const VSE = [3, 4, 5, 6, 7, 8, 9];
/* [hry, [[šířka, výška, všechny mise teorie]]]. 1920×1080 a iPad na šířku ve všech hrách; ostatní velikosti jen v jedné hře z každého stupně (styl je sdílený). */
const PLAN = [[VSE, [[1920, 1080, true], [1180, 820, true]]], [[3, 9], [[1366, 768, false], [1440, 900, false], [900, 700, false], [2560, 1440, false]]]];
/* beze změny: telefon na výšku a na šířku, tablet na výšku, hranice 899 px (na šířku) */
const BEZ = [[3, 6, 9], [[390, 844], [844, 390], [820, 1180], [1024, 1366], [899, 700]]];
const CSS = 'rpg-siroke.css';
const ZNACKA = '/* TRÉNINK, TEORIE a VĚŽ LEGEND';              // od ní dál jsou nová pravidla (obě media query)
const MESIC = '2026-05-15T10:00:00';                         // věž je o prázdninách zavřená — pevné datum

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

async function otevri(br, base, g, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(tm => {
    window.__TW_TESTNOW = tm;
    let a = 1234567;
    Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }, MESIC);
  const p = await ctx.newPage();
  const chyby = [];
  p.on('pageerror', e => chyby.push(e.message));
  await p.goto(base + '/projects/rpg-mat-' + g + '.html');
  await p.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 20000 });
  await p.evaluate(() => { document.getElementById('ni').value = 'Vojta'; startGame(); S.tutorialDone = true; go('map'); });
  return { ctx, p, chyby };
}

/* zásah středu prvku a to, jestli je v okně (u nízkých oken se před měřením dorolují: dítě rolovat umí) */
async function trefa(p, sel, strict) {
  return p.evaluate(([s, strict]) => {
    const e = document.querySelector(s); if (!e) return { chybi: true };
    if (!strict) e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { chybi: false, zasah: !!t && (t === e || e.contains(t)), vokne: r.left >= -0.5 && r.top >= -0.5 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5, w: r.width, h: r.height };
  }, [sel, !!strict]);
}
async function klik(p, sel) {
  const b = await p.locator(sel).first().boundingBox();
  if (!b) throw new Error('prvek nemá rámeček: ' + sel);
  await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}
const rect = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(x => Math.round(x * 10) / 10); };

/* odpověď SKUTEČNÝM klikem; `pre` = 'tr' (trénink) nebo 'tw' (věž); vrací, co udělala */
async function odpovez(p, pre, spravne) {
  const m = await p.evaluate(([pre, spravne]) => {
    const T = pre === 'tr' ? TR.task : TW.task;
    const vis = id => { const e = document.getElementById(id); return !!e && getComputedStyle(e).display !== 'none'; };
    const norm = s => String(s).replace(/[\s ]/g, '').replace(/−/g, '-');
    const ans = String(T.ans);
    if (vis(pre + '-mc')) {
      const bs = [...document.querySelectorAll('#' + pre + '-mc button')];
      const txt = b => norm([...b.childNodes].filter(n => !(n.nodeType === 1 && n.classList.contains('mc-key'))).map(n => n.textContent).join(''));
      const dobre = norm(czMC(T.ans));
      const idx = bs.findIndex(b => (txt(b) === dobre) === !!spravne);
      return { mod: 'mc', sel: idx >= 0 ? '#' + pre + '-mc button:nth-of-type(' + (idx + 1) + ')' : null };
    }
    if (vis(pre + '-yn-row')) {
      const bs = [...document.querySelectorAll('#' + pre + '-yn-row .btn')];
      const chce = /^ANO/i.test(ans) === !!spravne ? 'ANO' : 'NE';
      const idx = bs.findIndex(b => new RegExp('\\b' + chce + '\\b').test(b.textContent));
      return { mod: 'yn', sel: idx >= 0 ? '#' + pre + '-yn-row .btn:nth-of-type(' + (idx + 1) + ')' : null };
    }
    return { mod: 'text', ans: spravne ? ans : '987654' };
  }, [pre, spravne]);
  if (m.mod === 'text') { await p.fill('#' + pre + '-ans', m.ans); await klik(p, '#' + pre + '-input-row .btn'); }
  else if (m.sel) await klik(p, m.sel);
  else return { mod: m.mod, chyba: 'volba nenalezena' };
  return { mod: m.mod };
}

const SIRKA = () => ({ sw: document.documentElement.scrollWidth, iw: innerWidth });
const sloupcu = r => new Set(r.map(k => Math.round(k[0] / 4))).size;
const prekryv = r => { for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { const a = r[i], b = r[j]; if (a[0] < b[0] + b[2] - 1 && b[0] < a[0] + a[2] - 1 && a[1] < b[1] + b[3] - 1 && b[1] < a[1] + a[3] - 1) return true; } return false; };

/* ── 1+2 TRÉNINK ── */
async function trenink(p, g, w, h, f, strict) {
  const jm = 'g' + g + ' ' + w + '×' + h + ' trénink';
  let k = 0;
  await p.evaluate(() => { go('train'); renderTrainPicker(); });
  await p.waitForTimeout(300);
  const v = await p.evaluate(() => ({
    pan: [...document.querySelectorAll('#train-list > .panel, #train-list > .train-area')].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }),
    hra: (() => { const e = document.getElementById('train-play'); return { skryta: e.offsetParent === null, disp: getComputedStyle(e).display }; })(),
    ...(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }))(),
  }));
  const minSl = w >= 1366 ? 3 : 2;
  f(v.pan.length >= 7, jm + ': výběr má všech 7 oblastí', String(v.pan.length)); k++;
  f(sloupcu(v.pan) >= minSl, jm + ': oblasti vedle sebe (≥ ' + minSl + ' sloupce)', sloupcu(v.pan) + ' sl.'); k++;
  f(!prekryv(v.pan) && v.sw <= v.iw, jm + ': výběr se nepřekrývá a nepřetéká', v.sw + ' v ' + v.iw); k++;
  f(v.hra.skryta && v.hra.disp === 'none', jm + ': při výběru je procvičování SKRYTÉ (mřížka se nesmí vnutit skrytému prvku)', JSON.stringify(v.hra)); k++;
  /* téma = 5. položka (2. oblast, 2. mise); 1. stupeň má obsluhu jako vlastnost prvku, ne atribut, proto se označí podle pořadí */
  await p.evaluate(() => { const v = [...document.querySelectorAll('#train-list .ms-item, #train-list .train-item')]; if (v[4]) v[4].setAttribute('data-cil', '1'); });
  const t = await trefa(p, '#train-list [data-cil]', false);
  f(!t.chybi && t.zasah, jm + ': téma jde trefit', JSON.stringify(t)); k++;
  if (!t.chybi) await klik(p, '#train-list [data-cil]');
  const bezi = await p.waitForFunction(() => document.getElementById('train-play').offsetParent !== null, null, { timeout: 5000 }).then(() => true, () => false);
  f(bezi, jm + ': klik na téma spustí trénink'); k++;
  if (!bezi) return k;
  await p.waitForTimeout(300);
  await p.evaluate(() => window.scrollTo(0, 0));
  const d = await p.evaluate(() => {
    const R = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
    const tp = document.getElementById('train-play');
    return { disp: getComputedStyle(tp).display, pick: document.getElementById('train-picker').offsetParent === null, st: R('#train-play > :first-child'), prob: R('#tr-prob'), sw: document.documentElement.scrollWidth, iw: innerWidth, aktivni: document.querySelectorAll('.screen.active').length };
  });
  f(d.disp === 'grid', jm + ': procvičování je mřížka', d.disp); k++;
  f(d.pick, jm + ': při procvičování je výběr tématu skrytý'); k++;
  f(!!d.st && !!d.prob && d.st[0] + d.st[2] + 16 <= d.prob[0] + 0.5, jm + ': stav vlevo, úloha vpravo (mezera ≥ 16 px)', JSON.stringify(d.st) + ' / ' + JSON.stringify(d.prob)); k++;
  f(d.sw <= d.iw && d.aktivni === 1, jm + ': trénink nepřetéká, právě jedna aktivní obrazovka', d.sw + ' v ' + d.iw + ', aktivních ' + d.aktivni); k++;
  /* ovladače: nápověda, odpověď, DALŠÍ ÚKOL — skutečnými kliky */
  const tH = await trefa(p, '#tr-hint-btn', strict), tK = await trefa(p, '.btn.r[onclick="trEnd()"]', strict);
  f(!tH.chybi && tH.zasah && (!strict || tH.vokne) && !tK.chybi && tK.zasah, jm + ': NÁPOVĚDA a KONEC jdou trefit' + (strict ? ' a jsou v okně' : ''), JSON.stringify([tH, tK])); k++;
  const hintVidet = await p.evaluate(() => getComputedStyle(document.getElementById('tr-hint-btn')).display !== 'none');
  if (hintVidet) {
    await klik(p, '#tr-hint-btn');
    const ukazal = await p.waitForFunction(() => document.getElementById('tr-hint-box').classList.contains('show'), null, { timeout: 3000 }).then(() => true, () => false);
    f(ukazal, jm + ': klik na NÁPOVĚDU ukáže nápovědu'); k++;
  }
  const uloha0 = await p.evaluate(() => TR.task.text);
  const o = await odpovez(p, 'tr', true);
  f(!o.chyba, jm + ': správná odpověď se dá zadat klikem (' + o.mod + ')', o.chyba); k++;
  const dale = await p.waitForFunction(() => { const n = document.getElementById('tr-next-btn'); return !!n && n.offsetParent !== null; }, null, { timeout: 5000 }).then(() => true, () => false);
  f(dale, jm + ': po správné odpovědi se ukáže DALŠÍ ÚKOL'); k++;
  if (dale) {
    await p.waitForTimeout(700);                                     // pojistka 400 ms proti dvojitému ťuknutí
    const tN = await trefa(p, '#tr-next-btn', strict);
    f(tN.zasah && (!strict || tN.vokne), jm + ': DALŠÍ ÚKOL jde trefit' + (strict ? ' a je v okně' : ''), JSON.stringify(tN)); k++;
    await klik(p, '#tr-next-btn');
    const dal = await p.waitForFunction(t0 => TR.task.text !== t0 || document.getElementById('tr-next-btn').style.display === 'none', uloha0, { timeout: 5000 }).then(() => true, () => false);
    f(dal, jm + ': klik na DALŠÍ ÚKOL posune úlohu'); k++;
  }
  /* minihry se otevřou ve sloupci s úlohou */
  for (const [fn, jmeno] of [['trStartMatch', 'spojovačka'], ['trStartOrder', 'řazení'], ['trStartPexeso', 'pexeso']]) {
    const tb = await trefa(p, '#train-play [onclick="' + fn + '()"]', false);
    f(!tb.chybi && tb.zasah, jm + ': tlačítko ' + jmeno + ' jde trefit', JSON.stringify(tb)); k++;
    if (tb.chybi) continue;
    await klik(p, '#train-play [onclick="' + fn + '()"]');
    await p.waitForTimeout(400);
    const mg = await p.evaluate(() => { const e = document.getElementById('tr-prob'), r = e.getBoundingClientRect(); return { deti: e.querySelectorAll('*').length, l: r.left, r: r.right, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
    f(mg.deti > 3 && mg.r <= mg.iw + 0.5 && mg.sw <= mg.iw, jm + ': minihra ' + jmeno + ' se otevřela a nepřetéká', JSON.stringify(mg)); k++;
  }
  return k;
}

/* ── 3 TEORIE ── */
async function teorie(p, g, w, h, vse, f, strict) {
  const jm = 'g' + g + ' ' + w + '×' + h + ' teorie';
  let k = 0;
  const m = await p.evaluate(vse => {
    const mise = []; AREAS.forEach(a => a.missions.forEach(x => mise.push(x.id)));
    const L = window['RPG_LEARN_' + (document.title.match(/\d/) || [0])[0]];
    return vse ? mise : mise.slice(0, 1);
  }, vse);
  const vady = []; let dvaSloupce = 0, sPrvky = 0, celkem = 0;
  for (const id of m) {
    const r = await p.evaluate(id => {
      startLearn(id);
      const lc = document.getElementById('learn-content'), c = lc.getBoundingClientRect();
      const kids = [...lc.children].map(e => ({ cls: e.className, r: e.getBoundingClientRect(), sw: e.scrollWidth, cw: e.clientWidth }));
      const bloky = [...lc.querySelectorAll('.learn-section, .learn-example, .learn-mistakes, .learn-formula')].map(e => e.getBoundingClientRect());
      const vyc = [];
      lc.querySelectorAll('*').forEach(e => { const q = e.getBoundingClientRect(); if (q.width && (q.right > c.right + 2 || q.left < c.left - 2)) vyc.push(e.tagName + '.' + String(e.className).slice(0, 20) + ' ' + Math.round(q.left) + '–' + Math.round(q.right) + ' proti ' + Math.round(c.left) + '–' + Math.round(c.right)); });
      return { sloupcu: getComputedStyle(lc).columnCount, c: [c.left, c.width], titul: kids[0] ? kids[0].r.width : 0, kids: kids.map(x => [x.cls, x.sw > x.cw + 1]), bloky: bloky.map(q => Math.round(q.left)), vyc: vyc.slice(0, 2), sw: document.documentElement.scrollWidth, iw: innerWidth, aktivni: document.querySelectorAll('.screen.active').length };
    }, id);
    celkem++;
    if (r.sloupcu !== '2') vady.push(id + ': ' + r.sloupcu + ' sloupců');
    if (r.titul < r.c[1] * 0.95) vady.push(id + ': nadpis není přes obě sloupce (' + Math.round(r.titul) + ' z ' + Math.round(r.c[1]) + ')');
    if (r.sw > r.iw) vady.push(id + ': stránka přetéká (' + r.sw + ' v ' + r.iw + ')');
    if (r.vyc.length) vady.push(id + ': vyčnívá ze sloupce: ' + r.vyc.join(' ; '));
    if (r.kids.some(x => x[1])) vady.push(id + ': ořez obsahu (scrollWidth > šířka): ' + r.kids.filter(x => x[1]).map(x => x[0]).join(','));
    if (r.aktivni !== 1) vady.push(id + ': aktivních obrazovek ' + r.aktivni);
    if (r.bloky.length >= 3) { sPrvky++; if (new Set(r.bloky.map(x => Math.round(x / 8))).size >= 2) dvaSloupce++; }
  }
  f(celkem >= 1 && vady.length === 0, jm + ': ' + celkem + ' teorií ve dvou sloupcích, nadpis přes obě, nic nepřetéká ani nevyčnívá', vady.slice(0, 3).join(' | ')); k++;
  f(sPrvky === 0 || dvaSloupce >= sPrvky * 0.9, jm + ': bloky výkladu leží skutečně ve dvou sloupcích (' + dvaSloupce + ' z ' + sPrvky + ')', ''); k++;
  const tb = await trefa(p, '#learn-battle-btn', false);
  f(!tb.chybi && tb.zasah, jm + ': BOJOVAT NYNÍ jde trefit', JSON.stringify(tb)); k++;
  return k;
}

/* ── 4 VĚŽ ── */
async function vez(p, g, w, h, f, strict) {
  const jm = 'g' + g + ' ' + w + '×' + h + ' věž';
  let k = 0;
  await p.evaluate(() => { go('tower'); renderTowerGate(); });
  await p.waitForTimeout(700);
  const MER = () => {
    const R = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(x => Math.round(x * 10) / 10); };
    const cv = document.getElementById('tw-canvas');
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, cx = Math.round(W / 2), od = Math.min(W - 1, cx + 72 + 4);
    const jasnych = (x0, sirka) => { const d = ctx.getImageData(x0, 0, Math.max(1, sirka), H).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.max(d[i], d[i + 1], d[i + 2]) > 140) n++; return n; };
    return {
      zoom: getComputedStyle(document.getElementById('s-tower')).getPropertyValue('--tw-zoom').trim(),
      cv: R('#tw-canvas'), bmp: [W, H], panel: R('#s-tower .wrap > .panel:has(> #tw-canvas)'),
      prava: ['#tw-gate', '#tw-play', '#tw-end'].map(s => { const e = document.querySelector(s); return e && e.offsetParent !== null ? R(s) : null; }).find(x => x),
      okraj: jasnych(W - 3, 3), hrdina: jasnych(od, W - od),
      sw: document.documentElement.scrollWidth, iw: innerWidth, aktivni: document.querySelectorAll('.screen.active').length,
    };
  };
  const m = await p.evaluate(MER);
  const zoom = w >= 1400 ? '2' : '';
  f(m.zoom === zoom, jm + ': --tw-zoom je „' + zoom + '“', 'je „' + m.zoom + '“'); k++;
  const z = zoom ? 2 : 1;
  f(!!m.cv && Math.abs(m.cv[2] - z * m.bmp[0]) <= z + 0.5 && Math.abs(m.cv[3] - 230 * z) <= 1 && m.bmp[1] === 230, jm + ': plátno je přesně ' + z + '× bitmapa (výška ' + 230 * z + ')', 'css ' + (m.cv || []).slice(2) + ', bitmapa ' + m.bmp); k++;
  f(m.bmp[0] >= 300, jm + ': bitmapa věže je ≥ 300 px (užší by uřízla hrdinu na římse)', String(m.bmp[0])); k++;
  f(m.hrdina > 20, jm + ': hrdina na římse je vidět (' + m.hrdina + ' jasných pixelů vpravo od věže)'); k++;
  f(m.okraj === 0, jm + ': hrdina nevyčnívá z plátna (poslední 3 sloupce bitmapy nemají jasný pixel)', m.okraj + ' jasných'); k++;
  f(!!m.panel && !!m.prava && m.panel[0] + m.panel[2] + 16 <= m.prava[0] + 0.5, jm + ': věž vlevo, obsah vpravo (mezera ≥ 16 px)', JSON.stringify(m.panel) + ' / ' + JSON.stringify(m.prava)); k++;
  f(m.sw <= m.iw && m.aktivni === 1, jm + ': věž nepřetéká, právě jedna aktivní obrazovka', m.sw + ' v ' + m.iw); k++;
  /* vstup, špatná odpověď → DÁLE, správná → vyšší patro, konec */
  const tv = await trefa(p, '#tw-gate-actions .btn', false);
  f(!tv.chybi && tv.zasah, jm + ': tlačítko vstupu do věže jde trefit', JSON.stringify(tv)); k++;
  if (tv.chybi) return k;
  await klik(p, '#tw-gate-actions .btn');
  const bezi = await p.waitForFunction(() => TW.on && document.getElementById('tw-play').offsetParent !== null, null, { timeout: 5000 }).then(() => true, () => false);
  f(bezi, jm + ': klik na vstup spustí výstup'); k++;
  if (!bezi) return k;
  await p.waitForTimeout(500);
  const o1 = await odpovez(p, 'tw', false);
  f(!o1.chyba, jm + ': špatná odpověď se dá zadat klikem (' + o1.mod + ')', o1.chyba); k++;
  const dale = await p.waitForFunction(() => { const n = document.getElementById('tw-next-btn'); return !!n && n.offsetParent !== null; }, null, { timeout: 5000 }).then(() => true, () => false);
  f(dale, jm + ': po špatné odpovědi se ukáže DÁLE'); k++;
  if (dale) {
    await p.waitForTimeout(700);
    const tN = await trefa(p, '#tw-next-btn', strict);
    f(tN.zasah && (!strict || tN.vokne), jm + ': DÁLE ve věži jde trefit' + (strict ? ' a je v okně' : ''), JSON.stringify(tN)); k++;
    const t0 = await p.evaluate(() => TW.task.text);
    await klik(p, '#tw-next-btn');
    const dal = await p.waitForFunction(t => TW.task.text !== t, t0, { timeout: 5000 }).then(() => true, () => false);
    f(dal, jm + ': klik na DÁLE přinese další úlohu'); k++;
  }
  const patro0 = await p.evaluate(() => TW.floor);
  const o2 = await odpovez(p, 'tw', true);
  f(!o2.chyba, jm + ': správná odpověď se dá zadat klikem (' + o2.mod + ')', o2.chyba); k++;
  const vys = await p.waitForFunction(pt => TW.floor > pt, patro0, { timeout: 5000 }).then(() => true, () => false);
  f(vys, jm + ': správná odpověď zvedne patro'); k++;
  await p.evaluate(() => { twEndRun(); });
  await p.waitForTimeout(500);
  const e = await p.evaluate(() => ({ vid: document.getElementById('tw-end').offsetParent !== null }));
  f(e.vid, jm + ': po skončení výstupu je vidět konec'); k++;
  const tb = await trefa(p, '#tw-end .btn', false);
  f(!tb.chybi && tb.zasah, jm + ': tlačítka na konci výstupu jdou trefit', JSON.stringify(tb)); k++;
  return k;
}

async function velke(br, base, plan, f, co) {
  let kontrol = 0;
  for (const [hry, vel] of plan) for (const g of hry) for (const [w, h, vse] of vel) {
    const { ctx, p, chyby } = await otevri(br, base, g, w, h);
    const strict = h >= 900, jm = 'g' + g + ' ' + w + '×' + h;
    if (!co || co.includes('trenink')) kontrol += await trenink(p, g, w, h, f, strict);
    if (!co || co.includes('teorie')) kontrol += await teorie(p, g, w, h, vse, f, strict);
    if ((!co || co.includes('vez')) && g >= 6) kontrol += await vez(p, g, w, h, f, strict);
    f(chyby.length === 0, jm + ': bez výjimek na stránce', chyby[0]); kontrol++;
    await ctx.close();
  }
  return kontrol;
}

/* ── 5 BEZE ZMĚNY ── */
async function snimek(br, base, g, w, h) {
  const { ctx, p } = await otevri(br, base, g, w, h);
  const out = await p.evaluate(async () => {
    const R = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(x => Math.round(x * 10) / 10); };
    const o = {};
    go('train'); renderTrainPicker(); await new Promise(r => setTimeout(r, 250));
    o.vyber = [R('#train-list'), ...[...document.querySelectorAll('#train-list > .panel, #train-list > .train-area')].slice(0, 3).map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(x => Math.round(x * 10) / 10); })];
    startTrain(AREAS[1].missions[1].id); await new Promise(r => setTimeout(r, 250));
    o.hra = [R('#train-play > :first-child'), R('#tr-prob'), R('#tr-hint-btn')];
    startLearn(AREAS[0].missions[0].id); await new Promise(r => setTimeout(r, 250));
    o.teorie = [R('#learn-content'), ...[...document.getElementById('learn-content').children].slice(0, 6).map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(x => Math.round(x * 10) / 10); })];
    if (document.getElementById('s-tower')) { go('tower'); renderTowerGate(); await new Promise(r => setTimeout(r, 400)); const cv = document.getElementById('tw-canvas'); o.vez = [R('#s-tower .wrap > .panel:has(> #tw-canvas)'), R('#tw-canvas'), [cv.width, cv.height], R('#tw-gate')]; }
    o.sw = [document.documentElement.scrollWidth, innerWidth];
    return o;
  });
  await ctx.close();
  return out;
}
async function bezZmeny(br, srvS, srvPrazdny, plan, f) {
  let kontrol = 0;
  const [hry, vel] = plan;
  for (const g of hry) for (const [w, h] of vel) {
    const a = await snimek(br, baseOf(srvS), g, w, h), b = await snimek(br, baseOf(srvPrazdny), g, w, h), jm = 'g' + g + ' ' + w + '×' + h;
    for (const kl of ['vyber', 'hra', 'teorie', 'vez']) {
      if (a[kl] === undefined && b[kl] === undefined) continue;
      f(JSON.stringify(a[kl]) === JSON.stringify(b[kl]), jm + ': rozměry (' + kl + ') jsou stejné jako bez nových pravidel', JSON.stringify(a[kl]).slice(0, 110) + ' / ' + JSON.stringify(b[kl]).slice(0, 110)); kontrol++;
    }
    f(a.sw[0] <= a.sw[1] + 1, jm + ': nic nepřetéká', a.sw.join(' v ')); kontrol++;
  }
  return kontrol;
}

async function hlavni() {
  const t0 = Date.now();
  const br = await chromium.launch(LAUNCH);
  const srv = await server();
  const bezNovych = s => s.slice(0, s.indexOf(ZNACKA));
  const prazdny = await server({ [CSS]: bezNovych });
  const nalezy = [];
  const f = (c, m, d) => { if (!c) nalezy.push(m + (d ? ' — ' + d : '')); };

  console.log('\n── Trénink, teorie a věž na velké obrazovce (7 her) ──\n');
  const css0 = fs.readFileSync(path.join(ROOT, 'projects', CSS), 'utf8');
  ok(css0.indexOf(ZNACKA) > 0, 'nová pravidla začínají značkou, kterou test odřezává');
  const k1 = await velke(br, baseOf(srv), PLAN, f);
  const k2 = await bezZmeny(br, srv, prazdny, BEZ, f);
  nalezy.slice(0, 40).forEach(n => console.log('  ⚠ ' + n));
  ok(nalezy.length === 0, 'skutečná hra projde všemi kontrolami', nalezy.slice(0, 4).join(' | '));
  ok(k1 >= 770 && k2 >= 68, 'proběhl očekávaný počet měření (naměřeno 776 + 70)', k1 + ' + ' + k2);
  console.log('  skutečná hra: ' + (nalezy.length ? nalezy.length + ' nálezů' : 'bez nálezu') + ' (' + (k1 + k2) + ' kontrol, ' + Math.round((Date.now() - t0) / 1000) + ' s)');
  srv.close(); prazdny.close();

  /* ── sabotáže ── */
  const hry0 = {}; for (const g of [9]) hry0[g] = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-mat-' + g + '.html'), 'utf8');
  async function sabotaz(jm, soubor, zmena, rx, co, plan) {
    const orig = soubor === CSS ? css0 : hry0[9];
    const zm = zmena(orig), zmeneno = zm !== orig;
    ok(zmeneno, 'sabotáž „' + jm + '“ se aplikovala');
    if (!zmeneno) return;
    const sS = await server({ [soubor]: zmena }), sP = await server({ [CSS]: bezNovych });
    const n = [], ff = (c, m, d) => { if (!c) n.push(m + (d ? ' — ' + d : '')); };
    if (co === 'bez zmeny') await bezZmeny(br, sS, sP, [[9], [[899, 700], [1024, 1366]]], ff);
    else await velke(br, baseOf(sS), plan || [[[9], [[1920, 1080, false]]]], ff, co);
    ok(n.length > 0 && n.some(t => rx.test(t)), 'sabotáž „' + jm + '“ je chycena', n.length ? n[0] : 'prošla bez nálezu');
    sS.close(); sP.close();
  }
  const MQ = '@media (min-width:900px) and (orientation:landscape){\n  #s-train .wrap';
  await sabotaz('nová pravidla bez orientace', CSS, s => s.replace(MQ, '@media (min-width:900px){\n  #s-train .wrap'), /rozměry \(.*\) jsou stejné/, 'bez zmeny');
  await sabotaz('mřížka tréninku vždy zobrazená', CSS, s => s.replace('#train-play[style*="block"]{', '#train-play{'), /je procvičování SKRYTÉ/, ['trenink']);
  await sabotaz('teorie v jednom sloupci', CSS, s => s.replace('#learn-content{column-count:2;', '#learn-content{'), /teorií ve dvou sloupcích|skutečně ve dvou sloupcích/, ['teorie']);
  await sabotaz('nadpis teorie v jednom sloupci', CSS, s => s.replace('#learn-content>.panel,#learn-content>.learn-intro{column-span:all}', ''), /nadpis není přes obě sloupce/, ['teorie']);
  await sabotaz('věž ×2 už od 900 px', CSS, s => s.replace('#s-tower .wrap>.topnav{grid-column:1/-1}', '#s-tower{--tw-zoom:2}\n  #s-tower .wrap>.topnav{grid-column:1/-1}'), /bitmapa věže je ≥ 300|hrdina nevyčnívá|--tw-zoom je/, ['vez'], [[[9], [[1180, 820, false]]]]);
  await sabotaz('věž bez zvětšení ve skriptu hry', 'rpg-mat-9.html', s => s.replace("parseFloat(getComputedStyle(cv).getPropertyValue('--tw-zoom'))>=2)?2:1;", "parseFloat(getComputedStyle(cv).getPropertyValue('--tw-zoom'))>=2)?1:1;"), /plátno je přesně 2× bitmapa/, ['vez']);
  await sabotaz('věž bez minimální šířky sloupce', CSS, s => s.replace('grid-template-columns:minmax(610px,1fr) minmax(0,1.2fr)', 'grid-template-columns:minmax(300px,1fr) minmax(0,1.2fr)'), /bitmapa věže je ≥ 300|hrdina nevyčnívá/, ['vez'], [[[9], [[1440, 900, false]]]]);
  await sabotaz('trénink bez sloupců', CSS, s => s.replace('grid-template-columns:minmax(300px,.75fr) minmax(0,1.5fr);column-gap:24px;', ''), /stav vlevo, úloha vpravo/, ['trenink']);

  await br.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌ (${Math.round((Date.now() - t0) / 1000)} s)\n`);
  process.exit(fail ? 1 : 0);
}
hlavni().catch(e => { console.error(e); process.exit(1); });
