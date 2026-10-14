/* Hluboká sonda „cesta žáka“ — virtuální telefon a iPad projdou hru jako žák a na každém kroku změří:
     • zásah   — jde každý ovladač stisknout (elementFromPoint ve středu jeho rámečku)?
     • překryv — nepřekrývají se dva ovladače (plovoucí Úkoly/Vzkazy/mazlíček, lišty, toasty)?
     • okraj   — nevyčuhuje ovladač z obrazovky, nepřetéká stránka, nevylézá text z tlačítka?
   Průchody (pruchody=): A = nový žák (úvod, tutoriál, mapa, oblast, teorie, boj všech druhů, výhra, prohra,
   trénink, věž, profil, obchod, Najdi chybu, živý souboj), B = přihlášený žák s úkoly, vzkazy a mazlíčkem,
   H = rozcestník (bez přihlášení i přihlášený), P = stránky přijímaček a rozcestník projektů,
   R = otočení tabletu uprostřed boje, tréninku a věže (výška ↔ šířka, měří se před, po i po návratu).
   Sonda ničeho nemění ani nezapisuje, není v bráně (celá matice trvá ~35 min) — pouští se ručně po větší
   změně rozvržení; trvalou obdobou v bráně je tests/rpg-plovouci.test.cjs (výřez: 7 her × 3 rozměry).
   Výstup: <out>/souhrn.txt (skupiny nálezů + počet stavů a prvků, které měřidlo skutečně vidělo),
   <out>/nalezy.json (vše) a <out>/snimky/*.png (první snímek každé skupiny; dívej se — měřidlo nestačí).
   node tools/sonda-cesta-zaka.cjs [hry=3,9] [vp=telefon,ipad-na-vysku,ipad-na-sirku,ipad-klavesnice,notebook]
                                   [pruchody=A,B,H,P,R] [out=/cesta/k/vystupu]
   Měřidlo bylo ověřeno na kódu před opravami z 7. 10. 2026: nabídka věže („Do věže →“ mrtvé) i řádek
   odpovědi mimo obrazovku vyšly jako nálezy; po opravách ne. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const OUT = (process.argv.find(x => x.startsWith('out=')) || '').slice(4) || path.join(os.tmpdir(), 'sonda-cesta-zaka'), SNIMKY = path.join(OUT, 'snimky');
fs.mkdirSync(SNIMKY, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const arg = k => { const a = process.argv.find(x => x.startsWith(k + '=')); return a ? a.slice(k.length + 1).split(',') : null; };
const HRY = (arg('hry') || ['3', '4', '5', '6', '7', '8', '9']).map(Number);
const VP = [
  { jm: 'telefon', w: 360, h: 740, touch: true },
  { jm: 'ipad-na-vysku', w: 768, h: 1024, touch: true },
  { jm: 'ipad-na-sirku', w: 1024, h: 768, touch: true },
  { jm: 'ipad-klavesnice', w: 1024, h: 420, touch: true },
  { jm: 'notebook', w: 1366, h: 768, touch: false },
].filter(v => !arg('vp') || arg('vp').includes(v.jm));
const PRUCHODY = arg('pruchody') || ['A', 'B', 'H'];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      const u = decodeURIComponent(q.url.split('?')[0]);
      if (u === '/__prazdna') { r.writeHead(200, { 'Content-Type': 'text/html' }); return r.end('<!doctype html><meta charset="utf-8"><title>x</title>'); }
      const f = path.normalize(path.join(ROOT, u));
      if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('nf'); }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    });
    s.listen(0, () => res(s));
  });
}

/* ── přihlášený žák (mock Supabase): session, postava, jeden úkol od učitele a jeden vzkaz ── */
const done = n => { const o = {}; for (let i = 0; i < n; i++) o[(1 + (i / 3 | 0) % 7) + '-' + (1 + i % 3) + '-' + i] = true; return o; };
const postava = (jmeno, n) => ({ name: jmeno, xp: n * 7, level: 1, attrs: { calc: n * 2, geo: n, anal: n, craft: n }, done: done(n), inv: [], teacherUnlocked: [], tutorialDone: true });
const MOCK = `(function () {
  const U = { id: 'u1', email: 'zak@husovaliberec.cz', user_metadata: { full_name: 'Zak Test' } };
  const POSTAVA = ${JSON.stringify(postava('ADAM', 5))};
  const NOTES = [{ id: 1, author_name: 'Učitel', body: 'Skvělá práce, jen tak dál!', created_at: '2026-10-06T10:00:00Z', read_at: null }];
  const ASG = [{ id: 'a1', game: window.__HRA, mission_id: '2-3', due_date: '2026-10-20', class_name: 'Třída' }];
  function from(table) {
    let single = false;
    const b = { select() { return b; }, eq() { return b; }, is() { return b; }, order() { return b; }, limit() { return b; }, in() { return b; },
      insert() { return b; }, update() { return b; }, delete() { return b; }, upsert() { return Promise.resolve({ data: null, error: null }); },
      maybeSingle() { single = true; return b; }, single() { single = true; return b; },
      then(res, rej) { const data = table === 'notes' ? NOTES : (table === 'saves' && single ? { data: POSTAVA } : (single ? null : [])); return Promise.resolve({ data, error: null }).then(res, rej); } };
    return b;
  }
  window.supabase = { createClient: () => ({
    auth: { getSession: async () => ({ data: { session: { user: U, access_token: 't' } } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signInWithOAuth: async () => {}, signOut: async () => ({ error: null }) },
    from, rpc: async fn => ({ data: fn === 'my_assignments' ? ASG : [], error: null })
  }) };
})();`;

/* ── měřidlo (běží ve stránce) ── */
const MERIDLO = () => {
  window.__mer = function () {
    const vw = innerWidth, vh = innerHeight, out = [];
    const cs = el => getComputedStyle(el);
    const popis = el => {
      if (!el || el.nodeType !== 1) return 'nic';
      let s = el.tagName.toLowerCase();
      if (el.id) s += '#' + el.id; else if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
      const t = (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 26);
      return t ? s + ' „' + t + '“' : s;
    };
    const skryty = el => { for (let p = el; p && p.nodeType === 1; p = p.parentElement) { const c = cs(p); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < 0.05) return true; } return false; };
    const vid = el => {
      const r = el.getBoundingClientRect();
      let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
      for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const c = cs(p), q = p.getBoundingClientRect();
        if (c.overflowX !== 'visible') { x1 = Math.max(x1, q.left); x2 = Math.min(x2, q.right); }
        if (c.overflowY !== 'visible') { y1 = Math.max(y1, q.top); y2 = Math.min(y2, q.bottom); }
        if (c.position === 'fixed') break;
      }
      return { r, x1: Math.max(x1, 0), y1: Math.max(y1, 0), x2: Math.min(x2, vw), y2: Math.min(y2, vh) };
    };
    const koren = el => { for (let p = el; p && p.nodeType === 1; p = p.parentElement) { const c = cs(p).position; if (c === 'fixed' || c === 'sticky') return p; } return null; };
    const celoobrazovkovy = k => { if (!k) return false; const q = k.getBoundingClientRect(); return q.width >= vw * 0.9 && q.height >= vh * 0.9; };
    // modální okno (překryv „PORAŽEN“, výhra, tutoriál…): fixed/absolute a víc než půl obrazovky
    const modal = h => { for (let p = h; p && p !== document.body && p !== document.documentElement; p = p.parentElement) { const c = cs(p).position; if (c !== 'fixed' && c !== 'absolute') continue; if (p.classList.contains('screen')) continue; const q = p.getBoundingClientRect(); if (q.width * q.height >= vw * vh * 0.5) return true; } return false; };
    const zasah = (el, v) => {
      let cx = (v.x1 + v.x2) / 2, cy = (v.y1 + v.y2) / 2;
      const rs = el.getClientRects();
      if (rs.length > 1) { const q = rs[0]; const x1 = Math.max(q.left, v.x1), x2 = Math.min(q.right, v.x2), y1 = Math.max(q.top, v.y1), y2 = Math.min(q.bottom, v.y2); if (x2 - x1 >= 2 && y2 - y1 >= 2) { cx = (x1 + x2) / 2; cy = (y1 + y2) / 2; } }
      const h = document.elementFromPoint(cx, cy);
      return { h, ok: !!h && (h === el || el.contains(h) || (h.tagName === 'LABEL' && h.control === el)) };
    };
    const SEL = 'button, a[href], input:not([type=hidden]), select, textarea, [onclick], [role=button], .mc-btn, canvas[style*="pointer"]';
    const prvky = [...document.querySelectorAll(SEL)].filter(el => !skryty(el));
    const vToastu = el => !!el.closest('.ach-toast');
    const akt = [];
    let videno = 0;
    for (const el of prvky) {
      const v = vid(el);
      if (v.r.width < 2 || v.r.height < 2) continue;
      if (v.r.right > vw + 1 || v.r.left < -1) {
        let posuvny = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const c = cs(p); if ((c.overflowX === 'auto' || c.overflowX === 'scroll' || c.overflowX === 'hidden') && p.scrollWidth > p.clientWidth + 1) { posuvny = true; break; } }
        if (!posuvny) out.push({ typ: 'mimo obrazovku', prvek: popis(el), detail: Math.round(v.r.left) + '–' + Math.round(v.r.right) + ' z ' + vw });
      }
      if (v.x2 - v.x1 < 4 || v.y2 - v.y1 < 4) continue;
      videno++;
      if (el.disabled) continue;
      const z = zasah(el, v);
      const h = z.h, k = h ? koren(h) : null;
      if (!z.ok && ((k && !k.contains(el) && celoobrazovkovy(k)) || modal(h) || (h && h.closest('#rpg-asg-panel,#rpg-notes-panel')))) continue;   // modální okno a otevřený panel Úkoly/Vzkazy kryjí schválně
      akt.push({ el, v, fixed: !!koren(el) });
      if (z.ok) continue;
      if (h && h.contains(el)) { out.push({ typ: 'propadne rodiči', prvek: popis(el), kryje: popis(h) }); continue; }
      out.push({ typ: 'zakryté', prvek: popis(el), kryje: popis(h), widget: k ? popis(k) : '', _el: el });
    }
    for (let i = 0; i < akt.length; i++) for (let j = i + 1; j < akt.length; j++) {
      const a = akt[i], b = akt[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (vToastu(a.el) || vToastu(b.el)) continue;
      const ix = Math.min(a.v.x2, b.v.x2) - Math.max(a.v.x1, b.v.x1), iy = Math.min(a.v.y2, b.v.y2) - Math.max(a.v.y1, b.v.y1);
      if (ix <= 2 || iy <= 2) continue;
      const pl = ix * iy, mensi = Math.min((a.v.x2 - a.v.x1) * (a.v.y2 - a.v.y1), (b.v.x2 - b.v.x1) * (b.v.y2 - b.v.y1));
      if (pl < 16 || pl < mensi * 0.1) continue;
      const f = { typ: 'překryv', prvek: popis(a.el), kryje: popis(b.el), detail: Math.round(ix) + '×' + Math.round(iy) + ' px' };
      if (a.fixed !== b.fixed) f._par = [a.fixed ? b.el : a.el, a.fixed ? a.el : b.el];
      out.push(f);
    }
    for (const el of prvky) {
      if (!el.matches('button, .btn, .mc-btn') || skryty(el)) continue;
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const rg = document.createRange(); rg.selectNodeContents(el); const t = rg.getBoundingClientRect();
      if (t.width > 0 && (t.right > r.right + 1.5 || t.left < r.left - 1.5 || t.bottom > r.bottom + 1.5 || t.top < r.top - 1.5))
        out.push({ typ: 'text mimo tlačítko', prvek: popis(el), detail: `text ${Math.round(t.left)}–${Math.round(t.right)}×${Math.round(t.top)}–${Math.round(t.bottom)}, tlačítko ${Math.round(r.left)}–${Math.round(r.right)}×${Math.round(r.top)}–${Math.round(r.bottom)}` });
      else if (cs(el).overflowX === 'hidden' && el.scrollWidth > el.clientWidth + 1) out.push({ typ: 'text uříznutý', prvek: popis(el), detail: el.scrollWidth + ' > ' + el.clientWidth });
    }
    if (document.documentElement.scrollWidth > vw + 1) out.push({ typ: 'stránka přetéká', prvek: 'html', detail: document.documentElement.scrollWidth + ' > ' + vw });
    const scr = [...document.querySelectorAll('.screen')].filter(s => cs(s).display !== 'none');
    if (document.querySelector('.screen') && scr.length !== 1) out.push({ typ: 'viditelných obrazovek', prvek: scr.map(s => s.id).join(',') || '0', detail: String(scr.length) });
    // zakryté: dá se prvek odkrýt posunem?
    const sx = scrollX, sy = scrollY;
    for (const f of out) if (f._el) {
      try { f._el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
      const v = vid(f._el);
      f.posunem = v.x2 - v.x1 >= 4 && v.y2 - v.y1 >= 4 && zasah(f._el, v).ok;
      delete f._el;
    }
    for (const f of out) if (f._par) {
      const [obsah, plovouci] = f._par;
      try { obsah.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
      const a = obsah.getBoundingClientRect(), b = plovouci.getBoundingClientRect();
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      f.posunem = !(ix > 2 && iy > 2);
      delete f._par;
    }
    scrollTo(sx, sy);
    return { out, videno };
  };
  // odpověď v boji (správná / špatná), podle ZOBRAZENÉHO tvaru volby
  window.__odpovez = function (spravne) {
    const t = BT.curTask; if (!t) return 'bez úlohy';
    if (BT.mini && BT.mini[BT.idx]) return 'minihra';
    if (isYN(t)) { const a = String(t.ans).toUpperCase(); answerYN(spravne ? a : (a === 'ANO' ? 'NE' : 'ANO')); return 'yn'; }
    if (BT.mcMode) {
      const btns = [...document.querySelectorAll('#mc-grid .mc-btn')], cil = czMC(t.ans);
      const zob = b => b.dataset.v != null ? b.dataset.v : (() => { const c = b.cloneNode(true); c.querySelectorAll('.mc-key').forEach(k => k.remove()); return c.textContent.trim(); })();
      const b = spravne ? btns.find(x => zob(x) === cil) : btns.find(x => zob(x) !== cil);
      if (!b) return 'volba nenalezena'; b.click(); return 'mc';
    }
    const inp = document.getElementById('bt-ans'); inp.value = spravne ? String(t.ans) : '987654'; submitAnswer(); return 'text';
  };
  // boj s úlohou daného druhu
  window.__boj = function (druh) {
    for (const ar of AREAS) for (const m of ar.missions) {
      if (druh === 'mc' ? !m.mc : (druh === 'yn' ? false : m.mc)) continue;
      launchBattle(ar.id, m.id);
      let i = -1;
      if (druh === 'yn') i = BT.tasks.findIndex(t => isYN(t));
      else if (druh === 'mini') { for (let j = 0; j < BT.tasks.length && i < 0; j++) { if (isYN(BT.tasks[j])) continue; BT.idx = j; renderTask(); if (BT.mini[j]) i = j; } if (i >= 0) return m.id + '#' + i + ' (minihra)'; continue; }
      else if (druh === 'svg') i = BT.tasks.findIndex(t => !isYN(t) && t.svg);
      else if (druh === 'mc') i = BT.tasks.findIndex(t => !isYN(t));
      else i = BT.tasks.findIndex(t => !isYN(t) && !t.svg);
      if (i < 0) continue;
      if (druh !== 'mini' && BT.mini) BT.mini[i] = null;
      BT.idx = i; renderTask(); return m.id + '#' + i;
    }
    return null;
  };
};

const pripraveno = p => p.waitForFunction(() => {
  if (typeof BT === 'undefined' || !BT || !BT.curTask) return false;
  const t = BT.curTask;
  if (BT.mini && BT.mini[BT.idx]) return true;
  if (isYN(t)) return [...document.querySelectorAll('[id$="yn-row"] button')].some(b => !b.disabled && b.offsetParent);
  if (BT.mcMode) return [...document.querySelectorAll('#mc-grid .mc-btn')].some(b => !b.disabled);
  const i = document.getElementById('bt-ans'); return i && !i.disabled;
}, null, { timeout: 6000 }).catch(() => {});

/* ── kroky průchodů ── */
const ev = (fn, a) => p => p.evaluate(fn, a);
function krokyA(g) {
  const K = [
    ['úvod (nový žák)', async () => {}],
    ['tutoriál (první boj)', async p => { await p.fill('#ni', 'Tester'); await p.evaluate(() => { startGame(); const ar = AREAS[0]; launchBattle(ar.id, (ar.missions.find(m => !m.mc) || ar.missions[0]).id); }); await sleep(900); }],
    ['mapa', async p => { await p.evaluate(() => { const s = document.getElementById('tut-skip'); if (s && s.offsetParent) s.click(); S.tutorialDone = true; go('map'); if (typeof renderMap === 'function') renderMap(); }); await sleep(400); }],
    ['oblast', ev(() => openArea(AREAS[1].id))],
    ['teorie', ev(() => startLearn(AREAS[0].missions[0].id))],
    ['boj: textová úloha', async p => { await p.evaluate(() => __boj('text')); await pripraveno(p); }],
    ['boj: tři nápovědy', async p => { await p.evaluate(() => { for (let i = 0; i < 3; i++) { const b = document.getElementById('hint-btn'); if (b && !b.disabled) showHint(); } }); await sleep(300); }],
    ['boj: po správné odpovědi', async p => { await p.evaluate(() => __odpovez(true)); await sleep(650); }],
    ['boj: další úloha (po DÁLE)', async p => { await p.evaluate(() => nextTask()); await pripraveno(p); }],
    ['boj: po chybě', async p => { await p.evaluate(() => { if (BT.mini) BT.mini[BT.idx] = null; renderTask(); }); await pripraveno(p); await p.evaluate(() => __odpovez(false)); await sleep(650); }],
    ['boj: úloha s obrázkem po správné', async p => { if (!await p.evaluate(() => __boj('svg'))) return 'není'; await pripraveno(p); await p.evaluate(() => __odpovez(true)); await sleep(650); }],
    ['boj: výběr ze 4 (zadání)', async p => { if (!await p.evaluate(() => __boj('mc'))) return 'není'; await pripraveno(p); }],
    ['boj: výběr ze 4 po správné', async p => { await p.evaluate(() => __odpovez(true)); await sleep(650); }],
    ['boj: ANO/NE (zadání)', async p => { if (!await p.evaluate(() => __boj('yn'))) return 'není'; await pripraveno(p); }],
    ['boj: ANO/NE po odpovědi', async p => { await p.evaluate(() => __odpovez(true)); await sleep(650); }],
    ['boj: minihra', async p => { if (!await p.evaluate(() => __boj('mini'))) return 'není'; await sleep(1000); }],
    ['výhra', async p => {
      await p.evaluate(() => { const ar = AREAS[0], m = ar.missions.find(x => !x.mc) || ar.missions[0]; launchBattle(ar.id, m.id); BT.tasks.forEach((t, i) => { if (BT.mini[i] === undefined) BT.mini[i] = null; }); renderTask(); });
      for (let k = 0; k < 24; k++) {
        if (await p.evaluate(() => !!document.querySelector('.victory-banner'))) break;
        await pripraveno(p);
        await p.evaluate(() => __odpovez(true)); await sleep(450);
        if (await p.evaluate(() => { const n = document.getElementById('next-btn'); return !!n && getComputedStyle(n).display !== 'none'; })) { await sleep(420); await p.evaluate(() => nextTask()); await sleep(300); }
      }
      await sleep(700);
    }],
    ['prohra', async p => {
      await p.evaluate(() => { document.querySelectorAll('.victory-banner').forEach(e => e.remove()); const lu = document.getElementById('levelup'); if (lu) lu.classList.remove('show'); const ar = AREAS[1], m = ar.missions.find(x => !x.mc) || ar.missions[0]; launchBattle(ar.id, m.id); BT.tasks.forEach((t, i) => { if (BT.mini[i] === undefined) BT.mini[i] = null; }); renderTask(); });
      for (let k = 0; k < 24; k++) {
        if (await p.evaluate(() => { const f = document.getElementById('fail-overlay'); return !!f && f.classList.contains('show'); })) break;
        await pripraveno(p);
        await p.evaluate(() => __odpovez(false)); await sleep(500);
        if (await p.evaluate(() => { const n = document.getElementById('next-btn'); return !!n && getComputedStyle(n).display !== 'none'; })) { await sleep(420); await p.evaluate(() => nextTask()); await sleep(300); }
      }
      await sleep(900);
    }],
    ['trénink: výběr tématu', ev(() => { const f = document.getElementById('fail-overlay'); if (f) f.classList.remove('show'); go('train'); if (typeof renderTrainPicker === 'function') renderTrainPicker(); })],
    ['trénink: úloha', async p => { await p.evaluate(() => { const m = AREAS.flatMap(a => a.missions).find(m => !m.mc); startTrain(m.id); for (let i = 0; i < 40; i++) { const r = document.getElementById('tr-input-row'), a = document.getElementById('tr-ans'); if (r && getComputedStyle(r).display !== 'none' && a && !a.disabled && !isYN(TR.task)) break; trNext(); } }); await sleep(400); }],
    ['trénink: po správné', async p => { await p.evaluate(() => { document.getElementById('tr-ans').value = String(TR.task.ans); trSubmit(); }); await sleep(600); }],
    ['trénink: po chybě', async p => { await p.evaluate(() => { for (let i = 0; i < 40; i++) { trNext(); const r = document.getElementById('tr-input-row'), a = document.getElementById('tr-ans'); if (r && getComputedStyle(r).display !== 'none' && a && !a.disabled && !isYN(TR.task)) break; } document.getElementById('tr-ans').value = '987654'; trSubmit(); }); await sleep(600); }],
    ['trénink: výběr ze 4', async p => { await p.evaluate(() => { const m = AREAS.flatMap(a => a.missions).find(m => m.mc); if (m) startTrain(m.id); }); await sleep(400); }],
  ];
  if (g >= 6) K.push(
    ['věž: nabídka (toast)', async p => { await p.evaluate(() => { go('map'); suggestTower(); }); await sleep(800); }],
    ['věž: brána', ev(() => { const t = document.getElementById('tower-suggest'); if (t) t.remove(); go('tower'); renderTowerGate(); })],
    ['věž: úloha', async p => { await p.evaluate(() => { twStart(); for (let i = 0; i < 40; i++) { const r = document.getElementById('tw-input-row'), a = document.getElementById('tw-ans'); if (r && getComputedStyle(r).display !== 'none' && a && !a.disabled && !isYN(TW.task)) break; twDrawTask(); } }); await sleep(500); }],
    ['věž: po chybě', async p => { await p.evaluate(() => { document.getElementById('tw-ans').value = '987654'; twSubmit(); }); await sleep(600); }],
    ['věž: konec výstupu', async p => { await p.evaluate(() => { twGiveUp(); }); await sleep(600); }],
  );
  K.push(
    ['profil', ev(() => { go('profile'); if (typeof renderProfile === 'function') renderProfile(); })],
    ['obchod', ev(() => { go('shop'); if (typeof renderShop === 'function') renderShop(); })],
    ['najdi chybu', ev(g => { go('map'); RPGFindError.open(window['RPG_LEARN_' + g]); }, g)],
    ['živý souboj', ev(() => { const o = document.getElementById('find-error-overlay'); if (o) o.style.display = 'none'; openBattle(); })],
  );
  return K;
}
/* Průchod R: otočení tabletu UPROSTŘED úlohy (výška ↔ šířka). Výchozí rozměr dá `vp=`, otočí se na
   prohozené rozměry; měří se před otočením, po něm i po návratu — rozvržení se po `resize` musí srovnat. */
function krokyR(g, vp) {
  const otoc = (p, w, h) => p.setViewportSize({ width: w, height: h }).then(() => sleep(500));
  const K = [
    ['otočení: boj před', async p => { await p.fill('#ni', 'Tester'); await p.evaluate(() => { startGame(); S.tutorialDone = true; __boj('text'); }); await pripraveno(p); }],
    ['otočení: boj po otočení', p => otoc(p, vp.h, vp.w)],
    ['otočení: boj po návratu', p => otoc(p, vp.w, vp.h)],
    ['otočení: boj po odpovědi a otočení', async p => { await p.evaluate(() => __odpovez(true)); await sleep(600); await otoc(p, vp.h, vp.w); }],
    ['otočení: boj po odpovědi, návrat', p => otoc(p, vp.w, vp.h)],
    ['otočení: trénink před', async p => { await p.evaluate(() => { go('train'); const m = AREAS.flatMap(a => a.missions).find(m => !m.mc); startTrain(m.id);
      for (let i = 0; i < 40; i++) { const r = document.getElementById('tr-input-row'), a = document.getElementById('tr-ans'); if (r && getComputedStyle(r).display !== 'none' && a && !a.disabled && !isYN(TR.task)) break; trNext(); } }); await sleep(400); }],
    ['otočení: trénink po otočení', p => otoc(p, vp.h, vp.w)],
    ['otočení: trénink po odpovědi', async p => { await p.evaluate(() => { document.getElementById('tr-ans').value = String(TR.task.ans); trSubmit(); }); await sleep(500); }],
    ['otočení: trénink po návratu', p => otoc(p, vp.w, vp.h)],
  ];
  if (g >= 6) K.push(
    ['otočení: věž před', async p => { await p.evaluate(() => { go('tower'); twStart(); for (let i = 0; i < 40; i++) { const r = document.getElementById('tw-input-row'), a = document.getElementById('tw-ans'); if (r && getComputedStyle(r).display !== 'none' && a && !a.disabled && !isYN(TW.task)) break; twDrawTask(); } }); await sleep(500); }],
    ['otočení: věž po otočení', p => otoc(p, vp.h, vp.w)],
    ['otočení: věž po návratu', p => otoc(p, vp.w, vp.h)],
  );
  return K;
}
function krokyB(g) {
  return [
    ['mapa (přihlášený, úkoly, vzkazy, mazlíček)', async p => { await p.evaluate(() => { RPGWallet.earn(2000); RPGWallet.buy('pet-sova'); RPGWallet.activate('pet-sova'); }); await sleep(900); }],
    ['mapa: otevřené úkoly', async p => { await p.evaluate(() => { const b = document.getElementById('rpg-asg-btn'); if (b) b.click(); }); await sleep(300); }],
    ['mapa: otevřené vzkazy', async p => { await p.evaluate(() => { const b = document.getElementById('rpg-asg-btn'); if (b) b.click(); const n = document.getElementById('rpg-notes-btn'); if (n) n.click(); }); await sleep(300); }],
    ['mapa: bublina mazlíčka', async p => { await p.evaluate(() => { const n = document.getElementById('rpg-notes-btn'); if (n) n.click(); const c = document.getElementById('rw-sponka-canvas'); if (c) c.click(); }); await sleep(400); }],
    ['oblast', ev(() => { go('map'); openArea(AREAS[1].id); })],
    ['teorie', ev(() => startLearn(AREAS[0].missions[0].id))],
    ['boj: textová úloha', async p => { await p.evaluate(() => __boj('text')); await pripraveno(p); }],
    ['boj: tři nápovědy', async p => { await p.evaluate(() => { for (let i = 0; i < 3; i++) { const b = document.getElementById('hint-btn'); if (b && !b.disabled) showHint(); } }); await sleep(300); }],
    ['boj: po správné odpovědi', async p => { await p.evaluate(() => __odpovez(true)); await sleep(650); }],
    ['boj: výběr ze 4', async p => { if (!await p.evaluate(() => __boj('mc'))) return 'není'; await pripraveno(p); }],
    ['boj: bublina mazlíčka', async p => { await p.evaluate(() => { const c = document.getElementById('rw-sponka-canvas'); if (c) c.click(); }); await sleep(300); }],
    ['trénink: úloha', async p => { await p.evaluate(() => { go('train'); const m = AREAS.flatMap(a => a.missions).find(m => !m.mc); startTrain(m.id); for (let i = 0; i < 40; i++) { const r = document.getElementById('tr-input-row'), a = document.getElementById('tr-ans'); if (r && getComputedStyle(r).display !== 'none' && a && !a.disabled && !isYN(TR.task)) break; trNext(); } }); await sleep(400); }],
    ['trénink: po správné', async p => { await p.evaluate(() => { document.getElementById('tr-ans').value = String(TR.task.ans); trSubmit(); }); await sleep(600); }],
    ['profil (s odhlášením)', ev(() => { go('profile'); if (typeof renderProfile === 'function') renderProfile(); })],
    ['obchod', ev(() => { go('shop'); if (typeof renderShop === 'function') renderShop(); })],
  ];
}

(async () => {
  const srv = await serve();
  const BASE = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const vysl = [], stavy = [], chyby = [];
  let snimek = 0; const videneSkupiny = new Set();

  async function mer(pg, ctx) {
    const nalezy = new Map(); let videno = 0;
    const pridej = (r, pos) => { videno = Math.max(videno, r.videno); for (const f of r.out) { const k = f.typ + '|' + f.prvek + '|' + (f.kryje || ''); if (!nalezy.has(k)) nalezy.set(k, Object.assign(f, { pos })); } };
    pridej(await pg.evaluate(() => __mer()), 'hned');
    const H = await pg.evaluate(() => [document.documentElement.scrollHeight, innerHeight]);
    if (H[0] > H[1] + 10) {
      for (let i = 1; i <= 6; i++) {
        const y = Math.min(i * H[1] * 0.8, H[0] - H[1]);
        await pg.evaluate(y => scrollTo(0, y), y); await sleep(120);
        pridej(await pg.evaluate(() => __mer()), 'posun ' + Math.round(y));
        if (y >= H[0] - H[1]) break;
      }
      await pg.evaluate(() => scrollTo(0, 0));
    }
    stavy.push(Object.assign({ videno, nalezu: nalezy.size }, ctx));
    for (const f of nalezy.values()) {
      const z = Object.assign({}, ctx, f);
      const sk = ctx.stav + '|' + f.typ + '|' + f.prvek + '|' + (f.kryje || '');
      if (!videneSkupiny.has(sk) && snimek < 150 && f.typ !== 'propadne rodiči') {
        videneSkupiny.add(sk);
        z.snimek = String(++snimek).padStart(3, '0') + '.png';
        if (f.pos !== 'hned') { /* snímek až po návratu nahoru je jiný stav — fotit v té poloze */ }
        await pg.screenshot({ path: path.join(SNIMKY, z.snimek) }).catch(() => { z.snimek = null; });
      }
      vysl.push(z);
    }
  }

  async function relace(vp, url, pruchod, kroky, pripravit, hra) {
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.touch, hasTouch: vp.touch, deviceScaleFactor: 1 });
    await ctx.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
    await ctx.addInitScript(MERIDLO);
    if (pruchod === 'B' || pruchod === 'H+') { await ctx.addInitScript('window.__HRA = "RPG_MAT_' + (Number(hra) || 9) + '";'); await ctx.addInitScript(MOCK); }
    const pg = await ctx.newPage();
    pg.on('dialog', d => d.accept().catch(() => {}));
    pg.on('pageerror', e => chyby.push({ hra, vp: vp.jm, pruchod, chyba: e.message.split('\n')[0] }));
    if (pripravit) await pripravit(pg);
    await pg.goto(BASE + url, { waitUntil: 'load' });
    await sleep(500);
    if (pruchod === 'B') await pg.waitForFunction(() => document.querySelector('#s-map.active'), null, { timeout: 8000 }).catch(() => {});
    for (const [stav, fn] of kroky) {
      let r;
      try { r = await fn(pg); } catch (e) { chyby.push({ hra, vp: vp.jm, pruchod, stav, chyba: 'KROK: ' + e.message.split('\n')[0] }); continue; }
      if (r === 'není') continue;
      await sleep(450);
      try { await mer(pg, { hra, vp: vp.jm, pruchod, stav }); } catch (e) { chyby.push({ hra, vp: vp.jm, pruchod, stav, chyba: 'MĚŘENÍ: ' + e.message.split('\n')[0] }); }
    }
    await ctx.close();
  }

  const t0 = Date.now();
  for (const vp of VP) {
    for (const g of HRY) {
      if (PRUCHODY.includes('A')) await relace(vp, `/projects/rpg-mat-${g}.html`, 'A', krokyA(g), async pg => {
        await pg.goto(BASE + '/__prazdna'); await pg.evaluate(() => localStorage.clear());
      }, g);
      if (PRUCHODY.includes('R')) await relace(vp, `/projects/rpg-mat-${g}.html`, 'R', krokyR(g, vp), async pg => {
        await pg.goto(BASE + '/__prazdna'); await pg.evaluate(() => localStorage.clear());
      }, g);
      if (PRUCHODY.includes('B')) {
        await relace(vp, `/projects/rpg-mat-${g}.html`, 'B', krokyB(g), async pg => {
          await pg.goto(BASE + '/__prazdna');
          await pg.evaluate(d => { localStorage.clear(); for (const [k, v] of Object.entries(d)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); }, { RPG_CLOUD_OWNER: 'u1', ['RPG_MAT_' + g]: postava('ADAM', 5) });
        }, g);
      }
      console.log(`${vp.jm} g${g} hotovo · ${((Date.now() - t0) / 60000).toFixed(1)} min · nálezů ${vysl.length} · chyb ${chyby.length}`);
    }
    if (PRUCHODY.includes('H')) {
      const H = [
        ['rozcestník 2. stupeň', ev(() => { if (typeof setStupen === 'function') setStupen(2); })],
        ['rozcestník 1. stupeň', ev(() => { if (typeof setStupen === 'function') setStupen(1); })],
        ['rozcestník obchod', ev(() => { if (typeof toggleShop === 'function') toggleShop(); })],
      ];
      await relace(vp, '/projects/rpg-matematika.html', 'H', H, async pg => { await pg.goto(BASE + '/__prazdna'); await pg.evaluate(() => localStorage.clear()); }, 'hub');
      await relace(vp, '/projects/rpg-matematika.html', 'H+', H, async pg => {
        await pg.goto(BASE + '/__prazdna');
        await pg.evaluate(d => { localStorage.clear(); for (const [k, v] of Object.entries(d)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); }, { RPG_CLOUD_OWNER: 'u1', RPG_MAT_9: postava('ADAM', 5), RPG_MAT_3: postava('ADAM', 2) });
      }, 'hub');
    }
  }
  if (PRUCHODY.includes('P')) {
    const { OBRAZOVKY } = require(path.join(ROOT, 'tests/vnitrni-obrazovky.cjs'));
    const P = OBRAZOVKY.filter(o => !/rpg-mat-/.test(o.url));
    P.push({ url: '/projects/prijimacky-matematika/index.html', jm: 'přijímačky rozcestník', kroky: [] }, { url: '/projects/index.html', jm: 'projekty', kroky: [] });
    for (const vp of VP) for (const o of P) {
      const kroky = [[o.jm + ': úvod', async () => {}]].concat(o.kroky.map(([jm, kod]) => [o.jm + ': ' + jm, p => p.evaluate(k => { new Function(k)(); }, kod)]));
      await relace(vp, o.url, 'P', kroky, async pg => { await pg.goto(BASE + '/__prazdna'); await pg.evaluate(() => localStorage.clear()); }, 'přijímačky');
    }
    console.log('přijímačky hotovo');
  }
  fs.writeFileSync(path.join(OUT, 'nalezy.json'), JSON.stringify({ vysl, stavy, chyby }, null, 1));
  // souhrn: skupiny podle (stav, typ, prvek, kryje) → kde všude
  const sk = new Map();
  for (const f of vysl) {
    if ((f.typ === 'zakryté' || f.typ === 'překryv') && f.posunem === true) continue;   // jde odsunout zpod plovoucího prvku
    const k = [f.typ, f.stav, f.prvek, f.kryje || '', f.detail && f.typ !== 'překryv' ? '' : ''].join(' ¦ ');
    if (!sk.has(k)) sk.set(k, { f, kde: [] });
    sk.get(k).kde.push(f.hra + '/' + f.vp + (f.posunem === false ? ' (nejde odkrýt)' : '') + (f.detail ? ' [' + f.detail + ']' : ''));
  }
  const radky = [...sk.entries()].sort((a, b) => a[0].localeCompare(b[0], 'cs'));
  let txt = `stavů změřeno ${stavy.length}, prvků vidělo měřidlo celkem ${stavy.reduce((s, x) => s + x.videno, 0)}, nálezů ${vysl.length}, skupin ${radky.length}, chyb ${chyby.length}\n`;
  const bezPrvku = stavy.filter(s => s.videno === 0); if (bezPrvku.length) txt += 'STAVY BEZ JEDINÉHO PRVKU: ' + bezPrvku.map(s => s.hra + '/' + s.vp + '/' + s.stav).join('; ') + '\n';
  for (const [k, { f, kde }] of radky) txt += `\n${k}\n   ${kde.length}× ${kde.slice(0, 12).join(', ')}${kde.length > 12 ? ' …' : ''}${f.snimek ? '\n   snímek ' + f.snimek : ''}`;
  txt += '\n\nCHYBY:\n' + [...new Set(chyby.map(c => [c.hra, c.pruchod, c.stav || '', c.chyba].join(' ¦ ')))].join('\n');
  fs.writeFileSync(path.join(OUT, 'souhrn.txt'), txt);
  console.log('HOTOVO ' + ((Date.now() - t0) / 60000).toFixed(1) + ' min');
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
