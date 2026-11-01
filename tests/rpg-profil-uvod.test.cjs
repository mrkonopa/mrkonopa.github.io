/* ════════════════════════════════════════════════════════
   Profil čerstvé hry a úvod na velké obrazovce (`profilZhust` + `introHrdina` v `rpg-shared.js`, `rpg-siroke.css`, 7 her)

   Změřeno předtím: profil čerstvé hry měl na telefonu 3 373–3 714 px (zamčené odznaky 1 087–1 099 px, prázdný inventář 314–318 px,
   životní úspěchy 716–991 px), úvod na monitoru byl 35 % šířky a končil v 45 % výšky.

   PROFIL (telefon 390 × 844, tablet na šířku 1180 × 820):
     1. Zamčené dlaždice zůstávají v DOM (jiné testy je počítají), jen se schovají; v 6.–9. ročníku (odznaky jsou „???“) se schovají
        všechny a nahradí je řada zámků s větou, ve 3.–5. (odznak ukazuje jméno = cíl) zůstanou celé první 4.
     2. Počet zámků = počet schovaných dlaždic; věta má správné číslo a správné skloňování (1 / 2–4 / 5+).
     3. Získané odznaky a artefakty zůstávají celé; po získání všeho žádná řada; opakované vykreslení nevyrobí druhou řadu.
     4. Artefakty: 6.–9. ročník zhuštěné („Artefakt získáš za každou oblast“), 3.–5. beze změny (mají jména = cíle).
     5. Životní úspěchy: splněné + 3 nejrozpracovanější zamčené, zbytek za tlačítkem (skutečný klik, aria-expanded, stav přežije překreslení).
     6. Výška profilu čerstvé hry pod stropem z měření (2. stupeň ≤ 2 200 px, 1. stupeň ≤ 2 600 px; předtím 3 491 / 3 714).
     7. Nic nepřetéká, věta má ≥ 12 px.
   ÚVOD:
     8. Od 900 px na šířku (1920×1080, 1366×768, 1180×820, 900×700): vlevo název a hrdina, vpravo jméno a tlačítko (nepřekrývají se),
        hrdina je vykreslený a neuříznutý, stránka se neroluje, tlačítko jde trefit i SKUTEČNĚ kliknout a spustí hru; Enter taky.
     9. Hrdina „dýchá“ (2 snímky) a pod `reduced-motion` stojí.
    10. Telefon, tablet na výšku (1024×1366 taky) a 899 px na šířku: rozměry stejné jako se styly BEZ nového bloku, hrdina skrytý.
   Sabotáže (10): profilZhust bez práce, odznaky vždy jako cíle, špatné skloňování, bez odstranění staré řady, bez tlačítka u úspěchů,
   hrdina vždy vidět, název úvodu v pravém sloupci, úvod ve dvou sloupcích i na výšku, hrdina přes okraj plátna, hrdina bez animace.
   Spusť: node tests/rpg-profil-uvod.test.cjs
   ════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const { nactiPisma } = require('./pisma.cjs');
const ROOT = path.join(__dirname, '..');
const LAUNCH = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };
const VSE = (process.env.HRY || '3,4,5,6,7,8,9').split(',').map(Number);
const CAST = process.env.CAST || 'vse';   /* vývoj: profil | uvod | vse; PRESKOC_SAB=1 vynechá sabotáže */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };
const ZNACKA_UVOD = '/* ÚVOD NA VELKÉ OBRAZOVCE';

/* server s možností přepsat obsah souboru podle jména (sabotáže, srovnání bez nového bloku) */
function server(prepis) {
  return http.createServer((q, res) => {
    const fp = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0])));
    if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end(); }
    const jmeno = path.basename(fp);
    let pr = null;
    for (const [k, f] of Object.entries(prepis || {})) if (k === jmeno) pr = f;
    let body = fs.readFileSync(fp);
    if (pr) body = Buffer.from(pr(body.toString('utf8')), 'utf8');
    res.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(body);
  });
}
const listen = s => new Promise(r => s.listen(0, '127.0.0.1', () => r('http://127.0.0.1:' + s.address().port)));

/* očekávaná věta (nezávislý zápis skloňování) */
function ocekavanaVeta(n, tajne) {
  const f = (a, b, c) => n === 1 ? a : (n >= 2 && n <= 4 ? b : c);
  const ho = n === 1 ? 'ho' : 'je';
  return tajne
    ? `${n} ${f('skrytý odznak', 'skryté odznaky', 'skrytých odznaků')} – splňuj mise a objevíš ${ho}.`
    : `+${n} ${f('další odznak', 'další odznaky', 'dalších odznaků')} čeká – splňuj mise a odemkneš ${ho}.`;
}

async function otevri(browser, base, g, vp, extra) {
  const ctx = await browser.newContext(Object.assign({}, vp, extra || {}));
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const chyby = [];
  page.on('pageerror', e => chyby.push(e.message.slice(0, 120)));
  await page.goto(`${base}/projects/rpg-mat-${g}.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function' && typeof ACH !== 'undefined', null, { timeout: 8000 });
  await nactiPisma(page);
  await page.waitForTimeout(250);
  return { ctx, page, chyby };
}

/* ───────────── PROFIL ───────────── */
async function profil(browser, base, ok, hry, vpList) {
  for (const g of hry) for (const [jm, vp, strop1, strop2] of vpList) {
    const { ctx, page, chyby } = await otevri(browser, base, g, vp);
    const st2 = g >= 6;
    const zaklad = `${jm} g${g}`;
    await page.evaluate(() => { document.getElementById('ni').value = 'Tonda'; startGame(); S.tutorialDone = true; go('profile'); renderProfile(); });
    await page.waitForTimeout(300);
    const stav = (k, m) => page.evaluate(([k, m]) => {
      S.ach = {}; ACH.slice(0, k).forEach(a => { S.ach[a.id] = '2026-11-01'; });
      if (typeof AREAS !== 'undefined' && AREAS[0] && AREAS[0].art) S.inv = AREAS.slice(0, m).map(a => a.art.id);
      renderProfile();
      const viz = e => e.getClientRects().length > 0;
      const slots = [...document.querySelectorAll('#pr-ach .ach-slot')];
      const zam = slots.filter(e => !e.classList.contains('have'));
      const ra = document.querySelector('#pr-ach ~ .pz-rada');
      const iv = [...document.querySelectorAll('#pr-inv .inv-slot')];
      const ri = document.querySelector('#pr-inv ~ .pz-rada');
      const pop = r => r ? (r.querySelector('.pz-popis') || {}).textContent : null;
      return {
        total: slots.length, haveViz: slots.filter(e => e.classList.contains('have') && viz(e)).length, zam: zam.length, zamViz: zam.filter(viz).length,
        cipA: ra ? ra.querySelectorAll('.pz-cip').length : 0, vetaA: pop(ra), radA: document.querySelectorAll('#pr-ach ~ .pz-rada').length,
        invTot: iv.length, invViz: iv.filter(viz).length, invHaveViz: iv.filter(e => e.classList.contains('have') && viz(e)).length,
        cipI: ri ? ri.querySelectorAll('.pz-cip').length : 0, vetaI: pop(ri), radI: document.querySelectorAll('#pr-inv ~ .pz-rada').length,
        pocetAreas: typeof AREAS !== 'undefined' ? AREAS.length : 0
      };
    }, [k, m]);

    /* čerstvá hra */
    const f = await stav(0, 0);
    ok(f.total === 19 && f.zam === 19, `${zaklad}: v DOM zůstává všech 19 dlaždic odznaků`, JSON.stringify(f));
    ok(f.zamViz === (st2 ? 0 : 4), `${zaklad}: viditelných zamčených odznaků ${st2 ? 0 : 4}`, 'je ' + f.zamViz);
    const schovano = st2 ? 19 : 15;
    ok(f.cipA === schovano, `${zaklad}: řada zámků má ${schovano} políček`, 'je ' + f.cipA);
    ok(f.vetaA === ocekavanaVeta(schovano, st2), `${zaklad}: věta u zámků`, `„${f.vetaA}“ ≠ „${ocekavanaVeta(schovano, st2)}“`);
    if (st2) {
      ok(f.invViz === 0 && f.cipI === f.pocetAreas && f.vetaI === `Artefakt získáš za každou dokončenou oblast (0 / ${f.pocetAreas}).`,
        `${zaklad}: prázdný inventář je řada „?“ s větou`, JSON.stringify([f.invViz, f.cipI, f.vetaI]));
    } else {
      ok(f.invViz === f.invTot && f.radI === 0, `${zaklad}: inventář 1. stupně (jména = cíle) beze změny`, JSON.stringify([f.invViz, f.invTot, f.radI]));
    }
    /* výška čerstvého profilu a přetečení */
    const mer = await page.evaluate(() => {
      const w = document.querySelector('#s-profile .wrap').getBoundingClientRect();
      const r = document.querySelector('#pr-ach ~ .pz-rada');
      if (!r) return { h: Math.round(document.documentElement.scrollHeight), chybi: true };
      const rr = r.getBoundingClientRect();
      const cip = [...r.querySelectorAll('.pz-cip')].map(c => c.getBoundingClientRect());
      return { h: Math.round(document.documentElement.scrollHeight), wrapR: w.right, radaR: rr.right,
        cipVen: cip.filter(c => c.right > rr.right + 1 || c.left < rr.left - 1).length,
        pismo: parseFloat(getComputedStyle(r.querySelector('.pz-popis')).fontSize) };
    });
    const strop = st2 ? strop2 : strop1;
    if (strop) ok(mer.h <= strop, `${zaklad}: výška čerstvého profilu ≤ ${strop} px`, 'je ' + mer.h);
    ok(!mer.chybi, `${zaklad}: řada zámků u odznaků existuje`);
    if (!mer.chybi) {
      ok(mer.cipVen === 0 && mer.radaR <= mer.wrapR + 1, `${zaklad}: řada zámků nepřetéká`, JSON.stringify(mer));
      ok(mer.pismo >= 12, `${zaklad}: věta má aspoň 12 px`, 'je ' + mer.pismo);
    }

    /* postupný pokrok: skloňování a hranice, kdy se řada vůbec ukazuje */
    const PRIP = st2 ? [1, 14, 15, 16, 17, 18, 19] : [12, 13, 16];
    for (const k of PRIP) {
      const s = await stav(k, 0);
      const n = 19 - k;
      const sbal = st2 ? n : Math.max(0, n - 4);
      const radaMa = st2 ? n >= 1 : sbal >= 3;
      ok(s.radA === (radaMa ? 1 : 0), `${zaklad}: ${k} získaných → řada ${radaMa ? 'je' : 'není'}`, 'řad ' + s.radA);
      if (radaMa) {
        ok(s.cipA === sbal && s.vetaA === ocekavanaVeta(sbal, st2), `${zaklad}: ${k} získaných → ${sbal} zámků a správná věta`, `${s.cipA} „${s.vetaA}“`);
        ok(s.haveViz === k, `${zaklad}: ${k} získaných odznaků zůstává celých`, 'viditelných ' + s.haveViz);
      } else {
        ok(s.zamViz === s.zam, `${zaklad}: ${k} získaných → zamčené dlaždice zůstávají celé`, `${s.zamViz}/${s.zam}`);
      }
    }
    /* získáno všechno: žádná řada, nic schované */
    const vse = await page.evaluate(() => {
      S.ach = {}; ACH.forEach(a => { S.ach[a.id] = '2026-11-01'; });
      if (typeof AREAS !== 'undefined' && AREAS[0] && AREAS[0].art) S.inv = AREAS.map(a => a.art.id);
      renderProfile();
      return { rady: document.querySelectorAll('#s-profile .pz-rada').length, skryto: [...document.querySelectorAll('#pr-ach .pz-skryto,#pr-inv .pz-skryto')].length };
    });
    ok(vse.rady === 0 && vse.skryto === 0, `${zaklad}: po získání všeho žádná řada a nic schované`, JSON.stringify(vse));
    /* artefakty 6.–9. ročník: 2 získané */
    if (st2) {
      const a2 = await stav(0, 2);
      ok(a2.invHaveViz === 2 && a2.cipI === a2.pocetAreas - 2 && a2.vetaI === `Artefakt získáš za každou dokončenou oblast (2 / ${a2.pocetAreas}).`,
        `${zaklad}: 2 získané artefakty zůstávají celé, zbytek jsou „?“`, JSON.stringify([a2.invHaveViz, a2.cipI, a2.vetaI]));
    }
    /* opakované vykreslení nevyrobí druhou řadu */
    const op = await page.evaluate(() => { S.ach = {}; renderProfile(); renderProfile(); renderProfile(); return [document.querySelectorAll('#s-profile .pz-rada').length, document.querySelectorAll('#pr-gach .pz-vice').length]; });
    ok(op[0] === (st2 ? 2 : 1) && op[1] === 1, `${zaklad}: třikrát překreslený profil má pořád ${st2 ? 2 : 1} řad a jedno tlačítko úspěchů`, JSON.stringify(op));

    /* životní úspěchy: tlačítko se skutečným klikem */
    const gr = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#pr-gach .rw-gach-row')];
      const viz = e => e.getClientRects().length > 0;
      const zam = rows.filter(r => r.classList.contains('locked'));
      return { celkem: rows.length, viz: rows.filter(viz).length, zam: zam.length, tl: (document.querySelector('#pr-gach .pz-vice') || {}).textContent || null };
    });
    ok(gr.celkem >= 6 && gr.viz === (gr.celkem - gr.zam) + Math.min(3, gr.zam) && gr.tl === `▾ Zobrazit všech ${gr.celkem}`,
      `${zaklad}: životní úspěchy = splněné + 3 nejbližší, tlačítko „Zobrazit všech ${gr.celkem}“`, JSON.stringify(gr));
    const tl = page.locator('#pr-gach .pz-vice');
    if (await tl.count()) {
      await tl.scrollIntoViewIfNeeded();
      await tl.click();
      const o = await page.evaluate(() => ({ viz: [...document.querySelectorAll('#pr-gach .rw-gach-row')].filter(e => e.getClientRects().length > 0).length, ar: document.querySelector('#pr-gach .pz-vice').getAttribute('aria-expanded'), t: document.querySelector('#pr-gach .pz-vice').textContent }));
      ok(o.viz === gr.celkem && o.ar === 'true' && /méně/.test(o.t), `${zaklad}: klik na tlačítko ukáže všechny úspěchy`, JSON.stringify(o));
      const po = await page.evaluate(() => { renderProfile(); return [...document.querySelectorAll('#pr-gach .rw-gach-row')].filter(e => e.getClientRects().length > 0).length; });
      ok(po === gr.celkem, `${zaklad}: otevřený stav přežije překreslení`, 'viditelných ' + po);
      await page.locator('#pr-gach .pz-vice').click();
      const z = await page.evaluate(() => [...document.querySelectorAll('#pr-gach .rw-gach-row')].filter(e => e.getClientRects().length > 0).length);
      ok(z === gr.viz, `${zaklad}: druhý klik je zase sbalí`, 'viditelných ' + z);
    }
    ok(chyby.length === 0, `${zaklad}: bez chyb ve stránce`, chyby.join(' | '));
    await ctx.close();
  }
}

/* ───────────── ÚVOD ───────────── */
async function uvodSiroky(browser, base, ok, hry, vpList, zivo) {
  for (const g of hry) for (const [sirka, vyska] of vpList) {
    const { ctx, page, chyby } = await otevri(browser, base, g, { viewport: { width: sirka, height: vyska } });
    const z = `úvod g${g} ${sirka}×${vyska}`;
    const m = await page.evaluate(() => {
      const r = e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; };
      const cv = document.querySelector('#s-intro .intro-hrdina');
      const panel = document.querySelector('#s-intro .panel');
      const naz = document.querySelector('#s-intro .intro-title');
      const btn = [...document.querySelectorAll('#s-intro .btn')].find(b => b.offsetParent && /▶/.test(b.textContent) && !b.closest('#continue-panel'));
      let px = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
      if (cv && cv.width) {
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 0) { px++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
      let zasah = null;
      if (btn) { const b = btn.getBoundingClientRect(); const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); zasah = !!e && (e === btn || btn.contains(e)); }
      return { cv: cv ? r(cv) : null, viditelny: !!(cv && cv.offsetParent), cvW: cv && cv.width, cvH: cv && cv.height, px, minX, minY, maxX, maxY,
        panel: panel ? r(panel) : null, naz: naz ? r(naz) : null, zasah, sh: document.documentElement.scrollHeight, ih: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth };
    });
    ok(m.viditelny, `${z}: hrdina je vidět`);
    if (m.cv && m.panel && m.naz) {
      ok(m.cv.r + 24 <= m.panel.l && m.naz.r + 24 <= m.panel.l, `${z}: vlevo název a hrdina, vpravo jméno (mezera ≥ 24 px)`, JSON.stringify([m.cv.r, m.naz.r, m.panel.l]));
      ok(m.cv.l >= 0 && m.panel.r <= m.iw && m.sw <= m.iw, `${z}: nic nevyčnívá do stran`, JSON.stringify([m.cv.l, m.panel.r, m.sw, m.iw]));
    }
    ok(m.px >= 2500, `${z}: hrdina je vykreslený (${m.px} px)`, 'px ' + m.px);
    ok(m.minX >= 1 && m.minY >= 1 && m.maxX <= m.cvW - 2 && m.maxY <= m.cvH - 2, `${z}: hrdina není uříznutý o okraj plátna`, JSON.stringify([m.minX, m.minY, m.maxX, m.maxY, m.cvW, m.cvH]));
    ok(m.sh <= m.ih, `${z}: úvod se neroluje (${m.sh} ≤ ${m.ih})`);
    ok(m.zasah === true, `${z}: tlačítko startu jde trefit (elementFromPoint)`);
    /* skutečný klik a Enter */
    await page.fill('#ni', 'Tonda');
    await page.locator('#s-intro .btn.full').first().click();
    const mapa = await page.waitForFunction(() => document.getElementById('s-map') && document.getElementById('s-map').classList.contains('active'), null, { timeout: 4000 }).then(() => true).catch(() => false);
    ok(mapa, `${z}: klik na tlačítko spustí hru (mapa)`);
    if (g === 3 || g === 9) {
      const p2 = await ctx.newPage();
      await p2.goto(`${base}/projects/rpg-mat-${g}.html`, { waitUntil: 'load' });
      await p2.waitForFunction(() => typeof startGame === 'function', null, { timeout: 8000 });
      await p2.fill('#ni', 'Eva'); await p2.press('#ni', 'Enter');
      const e = await p2.waitForFunction(() => document.getElementById('s-map') && document.getElementById('s-map').classList.contains('active'), null, { timeout: 4000 }).then(() => true).catch(() => false);
      ok(e, `${z}: Enter spustí hru`);
    }
    ok(chyby.length === 0, `${z}: bez chyb ve stránce`, chyby.join(' | '));
    await ctx.close();
  }
  if (zivo) {
    for (const g of zivo) {
      /* dýchání: v běžném režimu se plátno mění, pod reduced-motion stojí */
      for (const [rezim, extra, cekej] of [['běžný režim', {}, true], ['reduced-motion', { reducedMotion: 'reduce' }, false]]) {
        const { ctx, page } = await otevri(browser, base, g, { viewport: { width: 1920, height: 1080 } }, extra);
        const h = new Set();
        for (let i = 0; i < 4; i++) { h.add(await page.evaluate(() => document.querySelector('#s-intro .intro-hrdina').toDataURL())); await page.waitForTimeout(400); }
        ok(cekej ? h.size >= 2 : h.size === 1, `úvod g${g}: hrdina ${cekej ? 'dýchá' : 'pod reduced-motion stojí'} (${h.size} různých snímků ze 4)`);
        await ctx.close();
      }
    }
  }
}

async function uvodBezZmeny(browser, base, baseBez, ok, hry, vpList) {
  const meri = page => page.evaluate(() => ({
    deti: [...document.querySelectorAll('#s-intro .wrap > *')].map(e => { const b = e.getBoundingClientRect(); return [e.className, Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; }),
    sh: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth,
    cv: (() => { const c = document.querySelector('#s-intro .intro-hrdina'); return c ? c.offsetParent !== null : 'chybí'; })()
  }));
  for (const g of hry) for (const [sirka, vyska] of vpList) {
    const vp = { viewport: { width: sirka, height: vyska }, hasTouch: sirka < 900 };
    const a = await otevri(browser, base, g, vp), b = await otevri(browser, baseBez, g, vp);
    const ma = await meri(a.page), mb = await meri(b.page);
    ok(ma.cv === false, `úvod g${g} ${sirka}×${vyska}: hrdina je skrytý`, 'cv ' + ma.cv);
    ok(JSON.stringify(ma) === JSON.stringify(mb), `úvod g${g} ${sirka}×${vyska}: rozměry stejné jako bez nového bloku`, JSON.stringify(ma).slice(0, 200) + ' ≠ ' + JSON.stringify(mb).slice(0, 200));
    await a.ctx.close(); await b.ctx.close();
  }
}

/* ───────────── běh ───────────── */
const PROFIL_VP = [['telefon', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 2600, 2200],
                   ['tablet na šířku', { viewport: { width: 1180, height: 820 }, hasTouch: true }, 0, 0]];
const SIROKE = [[1920, 1080], [1366, 768], [1180, 820], [900, 700]];
const UZKE = [[390, 844], [844, 390], [820, 1180], [1024, 1366], [899, 700]];

async function bezi(browser, prepis, volby) {
  let chyb = 0; const hlasky = [];
  const ok = (c, m, d) => { if (!c) { chyb++; hlasky.push(m + (d ? ' — ' + d : '')); } };
  const s = server(prepis), base = await listen(s);
  try {
    if (volby.profil) await profil(browser, base, ok, volby.profil, volby.profilVp || PROFIL_VP);
    if (volby.siroky) await uvodSiroky(browser, base, ok, volby.siroky, volby.sirokeVp || SIROKE, volby.zivo);
    if (volby.uzky) {
      const bez = server({ 'rpg-siroke.css': t => { const i = t.indexOf(ZNACKA_UVOD); if (i < 0) throw new Error('chybí značka úvodu v rpg-siroke.css'); return t.slice(0, i); } });
      const baseBez = await listen(bez);
      try { await uvodBezZmeny(browser, base, baseBez, ok, volby.uzky, volby.uzkeVp || UZKE); } finally { bez.close(); }
    }
  } finally { s.close(); }
  return { chyb, hlasky };
}

(async () => {
  const browser = await chromium.launch(LAUNCH);
  let pass = 0, fail = 0;
  const t0 = Date.now();
  const hlav = await bezi(browser, null, { profil: CAST !== 'uvod' ? VSE : null, siroky: CAST !== 'profil' ? VSE : null, zivo: CAST !== 'profil' ? [3, 6, 9].filter(x => VSE.includes(x)) : null, uzky: CAST !== 'profil' ? [3, 6, 9].filter(x => VSE.includes(x)) : null });
  hlav.hlasky.forEach(h => console.log('  ❌ ' + h));
  fail += hlav.chyb;
  console.log(`\n  Hlavní průchod: ${hlav.chyb} chyb (${Math.round((Date.now() - t0) / 1000)} s)`);
  if (hlav.chyb === 0) pass++;

  /* sabotáže: každá musí něco shodit; po úpravě se ověří, že se text doopravdy změnil */
  const SAB = [
    ['profilZhust bez práce', 'rpg-shared.js', 'const sc=document.getElementById(\'s-profile\');if(!sc)return;', 'const sc=document.getElementById(\'s-profile\');return;', { profil: [3, 9] }],
    ['odznaky vždy jako cíle (i „???“)', 'rpg-shared.js', 'const tajne=zam.length>0&&zam.every(e=>nazev(e,\'.ach-nm\')===\'???\');', 'const tajne=false;', { profil: [9] }],
    ['špatné skloňování', 'rpg-shared.js', 'function pzSklon(n,jedn,dva,pet){return n===1?jedn:(n>=2&&n<=4?dva:pet);}', 'function pzSklon(n,jedn,dva,pet){return pet;}', { profil: [6] }],
    ['bez odstranění staré řady', 'rpg-shared.js', 'sc.querySelectorAll(\'.pz-rada,.pz-vice\').forEach(e=>e.remove());', '', { profil: [9] }],
    ['bez tlačítka u úspěchů', 'rpg-shared.js', 'if(sbal.length>=2){', 'if(sbal.length>=999){', { profil: [3] }],
    ['hrdina vždy vidět', 'rpg-shared.js', '.intro-hrdina{display:none;image-rendering:pixelated}', '.intro-hrdina{display:block;image-rendering:pixelated}', { uzky: [3], uzkeVp: [[390, 844], [820, 1180]] }],
    ['název úvodu v pravém sloupci', 'rpg-siroke.css', '#s-intro .wrap>div:has(.intro-title){grid-column:1;', '#s-intro .wrap>div:has(.intro-title){grid-column:2;', { siroky: [9], sirokeVp: [[1920, 1080]] }],
    ['úvod ve dvou sloupcích i na výšku', 'rpg-siroke.css', '@media (min-width:900px) and (orientation:landscape){\n  #s-intro.active', '@media (min-width:900px){\n  #s-intro.active', { uzky: [3], uzkeVp: [[1024, 1366]] }],
    ['hrdina přes okraj plátna', 'rpg-shared.js', 'sp.drawHeroOn(x,4,cv.height-4-24*SC,SC,f,false)', 'sp.drawHeroOn(x,4,4,SC,f,false)', { siroky: [9], sirokeVp: [[1920, 1080]] }],
    ['hrdina bez animace', 'rpg-shared.js', 'f^=1;kresli(f);', 'f^=0;', { siroky: [], zivo: [9] }]
  ];
  for (const [popis, soubor, stare, nove, volby] of (process.env.PRESKOC_SAB ? [] : SAB)) {
    const text = fs.readFileSync(path.join(ROOT, soubor === 'rpg-siroke.css' ? 'projects/rpg-siroke.css' : 'projects/' + soubor), 'utf8');
    if (!text.includes(stare)) { fail++; console.log(`  ❌ sabotáž „${popis}“: původní text v souboru není (sabotáž by se neaplikovala)`); continue; }
    if (text.replace(stare, nove) === text) { fail++; console.log(`  ❌ sabotáž „${popis}“: text se nezměnil`); continue; }
    const r = await bezi(browser, { [soubor]: t => t.replace(stare, nove) }, volby);
    if (r.chyb > 0) { pass++; console.log(`  ✅ sabotáž „${popis}“ chycena (${r.chyb} kontrol)`); }
    else { fail++; console.log(`  ❌ sabotáž „${popis}“ NEPROŠLA — test ji nechytil`); }
  }
  await browser.close();
  console.log(`\n  Profil a úvod: ${pass} ✅ / ${fail} ❌ (${Math.round((Date.now() - t0) / 1000)} s)\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
