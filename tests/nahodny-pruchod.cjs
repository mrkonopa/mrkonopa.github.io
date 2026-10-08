/* ══════════════════════════════════════════════════════════════════════
   Náhodný průchod bojem — hledá SLEPÉ ULIČKY (Vojtův lístek 8. 10. 2026:
   „při hodině s dětmi občas mizelo tlačítko útok/další“; příčina: ÚTOK se po první
   správné odpovědi vypnul a ve 3.–8. ročníku se už nikdy nezapnul).

   Scénářové testy ověřují cesty, které jsme si vymysleli — a volají `submitAnswer()` přímo,
   takže nikdy nezkusí tlačítko, na které dítě ťuká. Tohle je opak: žák (generátor s pevným
   semínkem) dělá cokoli — odpovídá správně i špatně, ťuká dvakrát, mačká Enter, čeká až vyprší čas,
   používá předměty, otáčí tablet, vytahuje klávesnici, odchází z boje a vrací se — a po každém
   druhém kroku, který je „usazený“ (po 2 s virtuálního času, tedy po všech zámcích 0,4 / 0,7 / 1,3 /
   1,5 s), platí tahle pravidla:
     1) existuje aspoň jeden ovladač, kterým jde pokračovat (ÚTOK s odemčeným polem, DÁLE, ANO/NE,
        volba, kus minihry) — viditelný, povolený a (s `geometrie`) NEZAKRYTÝ (elementFromPoint);
     2) v textovém režimu bez DÁLE je ÚTOK vidět a povolený a pole odpovědi taky;
     3) ÚTOK a DÁLE nejsou vidět naráz;
     4) když je vidět DÁLE, čas neběží a srdíčka mu při čekání (65 s) neubývají;
     5) mimo boj neběží časomíra (zpožděné obsluhy po odchodu);
     6) žádná neošetřená výjimka (ReferenceError z rozjetých verzí souborů apod.).
   Čas řídí falešné hodiny (page.clock) a sprity jsou vypnuté (čtyřicetkrát rychlejší), Math.random
   má semínko → každý nález jde přehrát stejným semínkem. Jádro používá brána
   (tests/rpg-nahodny-pruchod.test.cjs, jen logika) i ruční nástroj (tools/nahodny-pruchod-boje.cjs,
   plná geometrie, zakrytí toasty a lištou).
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const ROZMERY = { tel: ['telefon 360×740', 360, 740], ipv: ['iPad na výšku', 768, 1024], ips: ['iPad na šířku', 1024, 768] };
const T0 = new Date('2026-05-15T10:00:00');

// ── ve stránce: popis ovladače a stav boje ──
const VE_STRANCE = `(function () {
  const cs = el => getComputedStyle(el);
  function info(el, rolovat) {
    if (!el) return null;
    const c = cs(el);
    const mer = () => {
      const r = el.getBoundingClientRect();
      const inView = r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
      const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
      const e = document.elementFromPoint(x, y), hit = !!e && (e === el || el.contains(e));
      let cover = null;
      if (!hit) { let q = e, a = []; for (let i = 0; q && i < 3; i++, q = q.parentElement) a.push(q.tagName.toLowerCase() + (q.id ? '#' + q.id : '') + (typeof q.className === 'string' && q.className ? '.' + q.className.split(' ')[0] : '')); cover = a.join(' < '); }
      return { r, inView, hit, cover };
    };
    let m = mer();
    const vis = c.display !== 'none' && c.visibility !== 'hidden' && m.r.width >= 4 && m.r.height >= 4 && parseFloat(c.opacity) > 0.3;
    let rolovalo = false;
    // dítě si ovladač dorolovalo (mimo okno nebo pod přišpendlenou lištou). Zakrytí něčím pevným (toast, překryv) rolování nevyřeší a zůstane nálezem — proto se jen u lišty
    if (vis && rolovat && !el.disabled && (!m.inView || (!m.hit && /bt-akce/.test(m.cover || '')))) { el.scrollIntoView({ block: 'center', inline: 'nearest' }); m = mer(); rolovalo = true; }
    return { vis, en: !el.disabled, hit: vis && m.hit, cover: vis && !m.hit ? m.cover : null, inView: m.inView, rolovalo, x: m.r.left + m.r.width / 2, y: m.r.top + m.r.height / 2, t: (el.textContent || '').trim().slice(0, 16) };
  }
  window.__fz = function (rolovat) {
    const scr = document.querySelector('.screen.active');
    const o = { scr: scr && scr.id, vw: innerWidth, vh: innerHeight };
    if (!scr || scr.id !== 's-battle') { o.timer = typeof BT !== 'undefined' && !!BT.timer; return o; }
    const $ = id => document.getElementById(id);
    o.fail = $('fail-overlay').classList.contains('show');
    o.modal = [...document.querySelectorAll('.modal')].some(m => cs(m).display !== 'none');
    o.hp = BT.hp; o.boss = !!BT.bossDefeated; o.idx = BT.idx; o.n = BT.tasks.length; o.timer = !!BT.timer; o.tl = BT.timeLeft;
    const row = $('bt-input-row'), yn = $('yn-row'), mc = $('mc-grid');
    o.mini = !!document.querySelector('#bt-prob .tto-chip, #bt-prob .ttm-q');
    o.mode = o.mini ? 'mini' : cs(yn).display !== 'none' ? 'yn' : cs(mc).display !== 'none' ? 'mc' : cs(row).display !== 'none' ? 'text' : 'none';
    o.utok = info($('attack-btn'), rolovat && o.mode === 'text'); o.ans = info($('bt-ans'));
    o.dale = info($('next-btn'), rolovat); o.daleVRadku = !!($('next-btn').parentElement && $('next-btn').parentElement.id === 'bt-input-row');
    o.hint = info($('hint-btn'));
    o.yn = [...yn.querySelectorAll('button')].map(b => info(b, rolovat));
    o.mc = [...mc.querySelectorAll('.mc-btn')].map(b => info(b, rolovat));
    o.minis = [...document.querySelectorAll('#bt-prob .tto-chip:not(.done), #bt-prob .ttm-q:not(.done), #bt-prob .ttm-a:not(.done)')].map((b, i) => info(b, rolovat && i === 0));
    o.fb = ($('bt-fb').textContent || '').slice(0, 40);
    return o;
  };
})();`;

const mulberry = s => `(function(){let a=${s}>>>0;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();`;
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const pouz = c => !!(c && c.vis && c.en && c.hit);
// bez geometrie (brána): ovladač stačí vidět a mít povolený — zakrytí a poloha závisí na verzi prohlížeče
const pouzLogika = c => !!(c && c.vis && c.en);
function posudek(o, geometrie) {
  const P = geometrie ? pouz : pouzLogika;
  const p = [];
  if (o.scr !== 's-battle' && o.timer) p.push('časomíra běží mimo boj (' + o.scr + ')');
  if (o.scr !== 's-battle' || o.fail || o.modal) return p;
  const utokPouz = o.mode === 'text' && P(o.utok) && o.ans && o.ans.en;
  const dalePouz = P(o.dale);
  const ostatni = o.yn.some(P) || o.mc.some(P) || o.minis.some(P);
  if (!(utokPouz || dalePouz || ostatni)) {
    const proc = o.mode === 'text' && !o.dale.vis ? (!o.utok.vis ? 'ÚTOK skrytý' : !o.utok.en ? 'ÚTOK vypnutý' : !o.utok.hit ? 'ÚTOK zakrytý' : 'pole vypnuté') : (o.dale.vis && !o.dale.en ? 'DÁLE vypnuté' : o.dale.vis && !o.dale.hit ? 'DÁLE zakryté' : '');
    p.push('SLEPÁ ULIČKA (' + o.mode + (proc ? ', ' + proc : '') + ')');
  }
  if (o.mode === 'text' && !o.dale.vis && !o.boss) {
    if (o.utok.vis && !o.utok.en) p.push('ÚTOK zůstal vypnutý');
    if (o.ans && !o.ans.en) p.push('pole odpovědi zůstalo vypnuté');
  }
  if (o.dale.vis && o.utok.vis) p.push('ÚTOK i DÁLE naráz');
  if (o.dale.vis && o.timer) p.push('DÁLE je vidět, ale čas běží');
  return p;
}

async function jedenBeh(b, base, g, [jmR, w, h], seed, stat, nalezy, cfg) {
  const R = rng(seed * 7919 + g);
  const log = [];
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: cfg.anim ? 'no-preference' : 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return u.startsWith(base) && !/rpg-sprite/.test(u) ? r.continue() : r.abort(); });
  await ctx.addInitScript(mulberry(seed * 31 + g)); await ctx.addInitScript(VE_STRANCE);
  await ctx.addInitScript('window.__TW_TESTNOW="2026-05-15T10:00:00";');
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  pg.on('dialog', d => d.accept().catch(() => {}));
  const hlas = (kde, p, o, extra) => nalezy.push({ hra: g, rozmer: jmR, seed, kde, problemy: p, stav: o, kroky: log.slice(-14), ...extra });
  const klik = async c => { if (c && c.vis && c.x >= 0 && c.y >= 0 && c.x < 5000) { await pg.touchscreen.tap(Math.min(c.x, (await pg.evaluate(() => innerWidth)) - 1), c.y); return true; } return false; };
  const tik = ms => pg.clock.runFor(ms);
  try {
    await pg.clock.install({ time: T0 });
    await pg.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'load' });
    await pg.clock.pauseAt(new Date(T0.getTime() + 60000));
    await pg.fill('#ni', 'TESTER'); await pg.evaluate(t => { startGame(); if (!t) S.tutorialDone = true; }, cfg.tutorial);
    await tik(600);

    const spust = async (vyc) => pg.evaluate(([r, vyc]) => {
      const vse = []; for (const ar of AREAS) for (const m of ar.missions) vse.push([ar.id, m.id, m.tc]);
      const [a, m, tc] = vse[Math.floor(r * vse.length)];
      if (vyc) for (let i = 0; i < tc; i++) delete S.done[m + '-' + i];
      launchBattle(a, m); return a + '/' + m;
    }, [R(), R() < 0.6]);
    log.push('start ' + await spust()); await tik(1800);

    const akce = {
      async spravne() {
        const o = await pg.evaluate(() => window.__fz(true)); if (o.scr !== 's-battle') return 'mimo boj';
        if (o.mode === 'text') { if (!pouz(o.utok) || !o.ans.en) return 'správně: ÚTOK nedostupný'; await pg.fill('#bt-ans', await pg.evaluate(() => String(BT.curTask.ans))); await klik(o.utok); return 'správně (text)'; }
        if (o.mode === 'yn') { const ans = await pg.evaluate(() => String(BT.curTask.ans)); const i = ans === 'ANO' ? 0 : 1; if (!pouz(o.yn[i])) return 'ANO/NE nedostupné'; await klik(o.yn[i]); return 'správně (ANO/NE)'; }
        if (o.mode === 'mc') { const i = await pg.evaluate(() => [...document.querySelectorAll('#mc-grid .mc-btn')].findIndex(b => !b.disabled && checkAns((b.dataset.v != null ? b.dataset.v : b.textContent.replace(/^[A-D]/, '')), BT.curTask.ans))); if (i < 0 || !pouz(o.mc[i])) return 'správná volba nedostupná'; await klik(o.mc[i]); return 'správně (volba)'; }
        if (o.mode === 'mini') { await pg.evaluate(() => {
            const mt = BT.mini && BT.mini[BT.idx]; if (!mt) return;
            if (mt.type === 'order') { const s = [...mt.data].sort((a, b) => mt.desc ? b.v - a.v : a.v - b.v); for (const it of s) { const c = [...document.querySelectorAll('#bt-prob .tto-chip')].find(c => !c.classList.contains('done') && c.textContent === it.label); if (c) c.click(); } }
            else { for (const q of [...document.querySelectorAll('#bt-prob .ttm-q:not(.done)')]) { q.click(); const a = [...document.querySelectorAll('#bt-prob .ttm-a:not(.done)')].find(x => x.textContent === q.dataset.a); if (a) a.click(); } } }); return 'správně (minihra)'; }
        return 'nic';
      },
      async spatne() {
        const o = await pg.evaluate(() => window.__fz(true)); if (o.scr !== 's-battle') return 'mimo boj';
        if (o.mode === 'text') { if (!pouz(o.utok) || !o.ans.en) return 'špatně: ÚTOK nedostupný'; await pg.fill('#bt-ans', '-123456'); await klik(o.utok); return 'špatně (text)'; }
        if (o.mode === 'yn') { const ans = await pg.evaluate(() => String(BT.curTask.ans)); const i = ans === 'ANO' ? 1 : 0; if (!pouz(o.yn[i])) return 'ANO/NE nedostupné'; await klik(o.yn[i]); return 'špatně (ANO/NE)'; }
        if (o.mode === 'mc') { const i = await pg.evaluate(() => [...document.querySelectorAll('#mc-grid .mc-btn')].findIndex(b => !b.disabled && !checkAns((b.dataset.v != null ? b.dataset.v : b.textContent.replace(/^[A-D]/, '')), BT.curTask.ans))); if (i < 0 || !pouz(o.mc[i])) return 'špatná volba nedostupná'; await klik(o.mc[i]); return 'špatně (volba)'; }
        if (o.mode === 'mini') { await pg.evaluate(() => { const c = [...document.querySelectorAll('#bt-prob .tto-chip:not(.done)')]; if (c.length > 1) c[c.length - 1].click(); else { const q = document.querySelector('#bt-prob .ttm-q:not(.done)'), a = [...document.querySelectorAll('#bt-prob .ttm-a:not(.done)')].find(x => q && x.textContent !== q.dataset.a); if (q && a) { q.click(); a.click(); } } }); return 'špatně (minihra)'; }
        return 'nic';
      },
      async dale() { const o = await pg.evaluate(() => window.__fz(true)); return (await klik(o.dale)) ? 'DÁLE' : 'DÁLE není vidět'; },
      async dvojtuk() { const o = await pg.evaluate(() => window.__fz(true)); const c = o.dale && o.dale.vis ? o.dale : o.utok; if (!c || !c.vis) return 'dvojťuk: není kam'; if (o.mode === 'text' && !o.dale.vis) await pg.fill('#bt-ans', await pg.evaluate(() => String(BT.curTask.ans))); await klik(c); await tik(30); await klik(c); return 'dvojťuk na ' + c.t; },
      async napoveda() { const o = await pg.evaluate(() => window.__fz(true)); return (await klik(o.hint)) ? 'nápověda' : 'nápověda není vidět'; },
      async prazdny() { const o = await pg.evaluate(() => window.__fz(true)); if (o.mode !== 'text' || !pouz(o.utok)) return 'prázdný: ne'; await pg.fill('#bt-ans', ''); await klik(o.utok); return 'prázdný ÚTOK'; },
      async enter() { await pg.keyboard.press('Enter'); return 'Enter'; },
      async cekej() { const ms = [500, 3000, 12000, 25000, 45000, 70000][Math.floor(R() * 6)]; await tik(ms); return 'čekání ' + ms / 1000 + ' s'; },
      async predmet() { const t = await pg.evaluate(r => { if (!BT.items) return null; const T = typeof ITEM_TYPES !== 'undefined' ? ITEM_TYPES : ['hp', 'freeze', 'skip']; const typ = T[Math.floor(r * T.length)]; BT.items.push(typ); renderItems(); useItem(typ); return typ; }, R()); return 'předmět ' + t; },
      async otoc() { const v = pg.viewportSize(); await pg.setViewportSize({ width: v.height, height: v.width }); return 'otočení ' + v.height + '×' + v.width; },
      async klavesnice() { const v = pg.viewportSize(); const mala = v.height < 520; await pg.setViewportSize({ width: v.width, height: mala ? Math.round(v.height * 2.2) : Math.round(v.height * 0.45) }); return mala ? 'klávesnice pryč' : 'klávesnice nahoře'; },
      async znovu() { await pg.evaluate(() => { try { exitBattle(); } catch (e) {} }); await tik(300); log.push('  → ' + await spust(R() < 0.5)); return 'odchod z boje a návrat'; },
      async rolovat() { await pg.evaluate(r => { const k = document.querySelector('#s-battle .bt-col-task'); const d = Math.round((r - 0.5) * 500); if (k && k.scrollHeight > k.clientHeight && getComputedStyle(k).overflowY !== 'visible') k.scrollTop += d; else scrollBy(0, d); }, R()); return 'rolování'; },
    };
    const VAHY = [['spravne', 28], ['spatne', 12], ['dale', 18], ['cekej', 9], ['napoveda', 5], ['prazdny', 3], ['enter', 5], ['predmet', 4], ['dvojtuk', 5], ['otoc', 3], ['klavesnice', 3], ['znovu', 2], ['rolovat', 4]];
    const SOUCET = VAHY.reduce((s, x) => s + x[1], 0);
    const vyber = () => { let r = R() * SOUCET; for (const [k, v] of VAHY) { if ((r -= v) < 0) return k; } return 'dale'; };
    const PRODLEVY = [0, 0, 40, 120, 300, 450, 700, 1000, 1400, 1700, 2500];

    for (let k = 0; k < cfg.kroku; k++) {
      const o0 = await pg.evaluate(() => window.__fz(false));
      let jm;
      if (o0.scr !== 's-battle') { await pg.evaluate(() => { try { if (document.querySelector('.modal.show,.modal[style*="flex"]')) closeModal(); } catch (e) {} }); log.push('(mimo boj: ' + o0.scr + ') start ' + await spust(R() < 0.6)); await tik(1800); continue; }
      if (o0.fail) { await pg.evaluate(() => retryMission()); log.push('prohra → znovu'); await tik(1800); continue; }
      if (await pg.evaluate(() => { const t = document.getElementById('tutorial-overlay'); return !!t && getComputedStyle(t).display !== 'none'; })) { const kroku = Math.floor(R() * 6); for (let q = 0; q < kroku; q++) { await pg.keyboard.press('Enter'); } log.push('tutoriál: ' + kroku + '× Enter'); await tik(300); if (await pg.evaluate(() => { const t = document.getElementById('tutorial-overlay'); return !!t && getComputedStyle(t).display !== 'none'; })) { await pg.evaluate(() => document.getElementById('tut-skip').click()); log.push('tutoriál: přeskočit'); } await tik(300); }
      jm = vyber();
      let popis; try { popis = await akce[jm](); } catch (e) { popis = jm + ' selhalo: ' + e.message.split('\n')[0]; }
      log.push(popis);
      { const kl = popis.replace(/\d+(\.\d+)?/g, '#'); stat.akce[kl] = (stat.akce[kl] || 0) + 1; }
      await tik(PRODLEVY[Math.floor(R() * PRODLEVY.length)]);
      stat.kroku++;
      // ── usazený stav: po 2 s se musí dát pokračovat ──
      if (k % 2 === 1) {
        await tik(2200); if (cfg.anim) await new Promise(r => setTimeout(r, 650));
        let o = await pg.evaluate(() => window.__fz(true)), p = posudek(o, cfg.geometrie);
        if (p.length) { await tik(3500); if (cfg.anim) await new Promise(r => setTimeout(r, 650)); o = await pg.evaluate(() => window.__fz(true)); p = posudek(o, cfg.geometrie); }
        stat.usazenych++;
        const cil = o.mode === 'text' && !(o.dale && o.dale.vis) ? o.utok : o.dale && o.dale.vis ? o.dale : null;
        if (cil && cil.rolovalo) stat.nutnoRolovat++;
        if (p.length) { stat.nalezu++; let snimek = null; try { snimek = path.join(cfg.out, `g${g}-${jmR.replace(/\W+/g, '')}-s${seed}-k${k}.png`); await pg.screenshot({ path: snimek, timeout: 4000 }); } catch (e) { snimek = null; } hlas('krok ' + k, p, o, { snimek }); log.push('!! ' + p.join('; ')); break; }
        if (o.dale && o.dale.vis && !o.boss && R() < 0.35) {
          const hp0 = o.hp; await tik(65000); const o2 = await pg.evaluate(() => window.__fz(true));
          if (o2.scr === 's-battle' && o2.hp < hp0) { stat.nalezu++; hlas('krok ' + k, ['srdíčko ubylo, zatímco DÁLE čekalo (' + hp0 + ' → ' + o2.hp + ')'], o2); log.push('!! hp ' + hp0 + '→' + o2.hp); break; }
        }
      }
      if (errs.length) { stat.nalezu++; hlas('krok ' + k, ['výjimka: ' + errs[0]], null); break; }
    }
    if (errs.length && !nalezy.some(n => n.seed === seed && n.hra === g && n.rozmer === jmR)) { stat.nalezu++; hlas('konec', ['výjimka: ' + errs[0]], null); }
  } catch (e) {
    stat.chyb++; nalezy.push({ hra: g, rozmer: jmR, seed, kde: 'harness', problemy: [e.message.split('\n')[0]], kroky: log.slice(-8) });
  }
  await ctx.close();
}


/* opt: { koren, hry:[3..9], rozmery:['tel','ipv','ips'], seedy:[od,do], kroku, anim, tutorial, geometrie, out, tiskni }
   anim = skutečné CSS animace (CSS neřídí falešné hodiny, proto se před měřením čeká i skutečný čas),
   jinak prefers-reduced-motion: animace vypnuté, rychlé a deterministické.
   tutorial = první boj nového žáka (překryv s tutoriálem). geometrie = i zásah a zakrytí (ruční nástroj). */
async function spust(opt) {
  const cfg = { kroku: 70, anim: false, tutorial: false, geometrie: true, tiskni: true, hry: [3, 4, 5, 6, 7, 8, 9], rozmery: ['tel', 'ipv', 'ips'], seedy: [1, 6], ...opt };
  cfg.out = path.resolve(cfg.out || path.join(__dirname, '..', 'tmp-fuzz'));
  const ROOT = path.resolve(cfg.koren || path.join(__dirname, '..'));
  fs.mkdirSync(cfg.out, { recursive: true });
  const srv = http.createServer((q, r) => {
    const f = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0])));
    if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  });
  await new Promise(r => srv.listen(0, r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ executablePath: EXEC });
  const nalezy = [], radky = [], zaHru = {};
  try {
    for (const g of cfg.hry) for (const kr of cfg.rozmery) {
      const roz = ROZMERY[kr];
      const stat = { kroku: 0, usazenych: 0, nutnoRolovat: 0, nalezu: 0, chyb: 0, akce: {} };
      for (let s = cfg.seedy[0]; s <= cfg.seedy[1]; s++) await jedenBeh(b, base, g, roz, s, stat, nalezy, cfg);
      const z = zaHru[g] = zaHru[g] || { kroku: 0, usazenych: 0, akce: {} };
      z.kroku += stat.kroku; z.usazenych += stat.usazenych; for (const [k, v] of Object.entries(stat.akce)) z.akce[k] = (z.akce[k] || 0) + v;
      const r = `g${g} ${roz[0].padEnd(15)} kroků ${String(stat.kroku).padStart(5)}  usazených ${String(stat.usazenych).padStart(4)}  nutno rolovat ${String(stat.nutnoRolovat).padStart(3)}  NÁLEZŮ ${stat.nalezu}${stat.chyb ? '  (harness chyb ' + stat.chyb + ')' : ''}`;
      if (cfg.tiskni) console.log(r); radky.push(r);
    }
  } finally { await b.close(); srv.close(); }
  fs.writeFileSync(path.join(cfg.out, 'nalezy.json'), JSON.stringify(nalezy, null, 1));
  fs.writeFileSync(path.join(cfg.out, 'souhrn.txt'), radky.join('\n') + '\n');
  return { nalezy, radky, zaHru, out: cfg.out };
}
module.exports = { spust, ROZMERY };
