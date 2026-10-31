/* ═════════════════════════════════════════════════════════════════════
   Mazlíčci z obchodu ve hrách 3.–9. ročníku (`rpg-mazlicci.js` + `setPet` v jádru spritů + sponka + obchod + profil).

   Vojtovo upozornění (31. 10. 2026): „dávej pozor na bugy jako mizení tlačítek a nefunkčnost enteru“. Mazlíček sám se
   kreslí jen do plátna arény, takže ovládání nemůže vzít — tenhle test to ale měří, ne předpokládá: s aktivním mazlíčkem
   a SKUTEČNĚ načtenými sprity (testy ovládání je obvykle vypínají) projde boj dotykem i klávesou Enter.

   Ověřuje se (každá z 7 her dostane jiného mazlíčka, takže pokryto je všech 7 druhů):
     A) zapojení: hra po `applyCosmetics` ohlásí mazlíčka v aréně, plovoucí sponka je na mapě vidět a v boji schovaná
        (a po návratu na mapu zase vidět); pixely arény s mazlíčkem ≠ bez něj; při VÝJIMCE v mazlíčkovi se vrátí parťák
        (pixely = bez mazlíčka), stránka nehlásí chybu a boj běží dál
     B) reakce ve skutečném enginu: mazlíček dostane stav klid → útok (zaplesá) → zásah (uhne) → vítězství
     C) OVLÁDÁNÍ s aktivním mazlíčkem: tři úlohy za sebou (iPad na šířku ve všech hrách, telefon v 3. a 9.): ťuknutí na ÚTOK,
        ťuknutí na DÁLE, odpověď i posun klávesou Enter; ÚTOK je před každou odpovědí povolený a DÁLE zasažitelné
        (`elementFromPoint`), žádná chyba na stránce
     D) obchod a profil: každá karta mazlíčka má živé plátno (neprázdné) a „▶ UKÁZKA“, po kliknutí mazlíček vyskočí; profil
        a hub mají pixelového mazlíčka, ne emoji; pod reduced-motion se plátna nehýbou
     E) bez modulu `rpg-mazlicci.js` hra běží po starém: parťák v aréně, sponka v boji vidět, v profilu emoji, žádná chyba
      F) plovoucí mazlíček na mapě kreslí tytéž sprity (RPGMazlicci.frame), při dobré náladě poskakuje
   Sabotáže (6): hra bez zapojení, jádro bez háčku, sponka se v boji neschová, chyba v mazlíčkovi shodí boj, obchod bez ukázky,
   plovoucí mazlíček kreslí původní sprity.
   Spusť: node tests/rpg-mazlicci-hry.test.cjs
   ═════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const LAUNCH = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const HRY = [3, 4, 5, 6, 7, 8, 9];
const KONTROL_MIN = 285;   /* naměřeno 294 (31. 10. 2026; před částí F 263) */
const PETS = ['pet-sova', 'pet-kocka', 'pet-robot', 'pet-drak', 'pet-jednorozec', 'pet-fenix', 'pet-zlaty-drak'];
const PET_HRY = Object.fromEntries(HRY.map((g, i) => [g, PETS[i]]));

function server(prepis) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); }
    let telo = fs.readFileSync(fp), pr = null;
    for (const [k, f] of Object.entries(prepis || {})) if (k === path.basename(fp)) pr = f;
    if (pr) telo = Buffer.from(pr(telo.toString('utf8')));
    r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream' });
    r.end(telo);
  });
  return new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv)));
}
const baseOf = srv => 'http://127.0.0.1:' + srv.address().port;

/* stránka s hrou; `pet` se předvyplní do peněženky (vlastněný a aktivní), `rm` zapne snížený pohyb */
async function otevri(br, base, g, o) {
  o = o || {};
  const ctx = await br.newContext({ viewport: { width: o.w || 1180, height: o.h || 820 }, isMobile: !!o.dotyk, hasTouch: !!o.dotyk, reducedMotion: o.rm ? 'reduce' : 'no-preference' });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(({ pet, rm }) => {
    window.__TW_TESTNOW = '2026-05-15T10:00:00';
    if (pet) { try { localStorage.setItem('RPG_HUB_WALLET', JSON.stringify({ credits: 0, cosmetics: { owned: [pet], active: { pet } }, settings: { sponkaEnabled: true, reducedMotion: !!rm } })); } catch (e) {} }
  }, { pet: o.pet || null, rm: !!o.rm });
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  await pg.goto(base + '/projects/' + (o.stranka || 'rpg-mat-' + g + '.html'), { waitUntil: 'load' });
  if (!o.stranka) {
    await pg.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 20000 });
    await pg.evaluate(() => { document.getElementById('ni').value = 'Tester'; startGame(); S.tutorialDone = true; });
  }
  return { ctx, pg, errs };
}
const cekej = async (pg, fn, arg, ms) => { try { await pg.waitForFunction(fn, arg === undefined ? null : arg, { timeout: ms || 4000 }); return true; } catch (e) { return false; } };
const spust = (pg) => pg.evaluate(() => { const a = AREAS[0]; launchBattle(a.id, a.missions[0].id); });
const sponkaVid = (pg, vid) => cekej(pg, v => { const s = document.getElementById('rw-sponka'); return !!s && (s.style.visibility === 'hidden') === !v; }, vid, 5000);

/* ── A) zapojení, schování sponky, pixely a pád mazlíčka ── */
async function castA(br, base, g, f) {
  const P = PET_HRY[g], kde = 'g' + g + ' ' + P;
  const { ctx, pg, errs } = await otevri(br, base, g, { pet: P, rm: true });
  f(await sponkaVid(pg, true), kde + ': sponka je na mapě vidět');
  await spust(pg); await sleep(1500);
  f(await pg.evaluate(() => window.__petVArene === true), kde + ': hra oznámila mazlíčka v aréně (`__petVArene`)');
  f(await sponkaVid(pg, false), kde + ': sponka je v boji schovaná (mazlíček je v aréně)');
  const snap = () => pg.evaluate(() => document.querySelector('#bt-top canvas').toDataURL());
  await pg.evaluate(g => window['RPGSprites' + g].setPet(null), g); await sleep(300); const A = await snap();
  await pg.evaluate(({ g, P }) => window['RPGSprites' + g].setPet(RPGMazlicci.arena(P)), { g, P }); await sleep(300); const B = await snap();
  f(A !== B, kde + ': aréna s mazlíčkem vypadá jinak než bez něj (kreslí se)');
  await pg.evaluate(g => window['RPGSprites' + g].setPet(function () { throw new Error('záměrná chyba mazlíčka'); }), g); await sleep(400);
  const C = await snap(); await sleep(300); const C2 = await snap();
  f(C === A && C2 === A, kde + ': při chybě v mazlíčkovi se vrátí parťák (pixely jako bez mazlíčka)');
  f(await pg.evaluate(() => !!document.querySelector('#s-battle.active')), kde + ': boj po chybě v mazlíčkovi běží dál');
  await pg.evaluate(() => go('map'));
  f(await sponkaVid(pg, true), kde + ': po návratu na mapu je sponka zase vidět');
  f(errs.length === 0, kde + ': bez chyb na stránce (část A)', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ── B) reakce ve skutečném enginu ── */
async function castB(br, base, g, f) {
  const P = PET_HRY[g], kde = 'g' + g + ' ' + P;
  const { ctx, pg, errs } = await otevri(br, base, g, { pet: P });
  await spust(pg); await sleep(1200);
  await pg.evaluate(({ g, P }) => {
    window.__seen = new Set(); const o = RPGMazlicci.arena(P);
    const spy = function (c, e) { window.__seen.add(RPGMazlicci.stav(e.hero, e.boss, e.hpFrac)); return o(c, e); }; spy.shot = o.shot;
    window['RPGSprites' + g].setPet(spy);
  }, { g, P });
  f(await cekej(pg, () => window.__seen.has('idle'), null, 3000), kde + ': stav „klid“');
  await pg.evaluate(g => window['RPGSprites' + g].heroAttack(false, 'slash'), g);
  f(await cekej(pg, () => window.__seen.has('cheer'), null, 3000), kde + ': při útoku hrdiny mazlíček dostane stav „útok“');
  await sleep(1400);
  await pg.evaluate(g => window['RPGSprites' + g].bossAttack(), g);
  f(await cekej(pg, () => window.__seen.has('flinch'), null, 6000), kde + ': při zásahu hrdiny mazlíček dostane stav „zásah“');
  await sleep(900);
  await pg.evaluate(g => window['RPGSprites' + g].defeat(), g);
  f(await cekej(pg, () => window.__seen.has('victory'), null, 3000), kde + ': po poražení bosse mazlíček dostane stav „vítězství“');
  f(errs.length === 0, kde + ': bez chyb na stránce (část B)', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ── C) ovládání s aktivním mazlíčkem: dotyk i Enter ── */
const tap = async (pg, sel) => { const c = await pg.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); await pg.touchscreen.tap(c.x, c.y); };
const pripravBoj = pg => pg.evaluate(() => {
  for (const ar of AREAS) for (const m of ar.missions) {
    if (m.mc) continue;
    launchBattle(ar.id, m.id);
    const t = BT.tasks.filter(x => !isYN(x) && x.text && !x.svg);
    if (t.length < 3) continue;
    BT.tasks = [t[0], t[1], t[2]]; BT.mini = { 0: null, 1: null, 2: null };
    for (let i = 0; i < 6; i++) delete S.done[m.id + '-' + i];
    window.adaptMaybeSwap = function () {};
    BT.idx = 0; renderTask(); return true;
  } return false;
});
const stav = pg => pg.evaluate(() => {
  const n = document.getElementById('next-btn'), a = document.getElementById('attack-btn'), q = n.getBoundingClientRect(), r = a.getBoundingClientRect();
  const hit = (e, b) => !!e && (e === b || b.contains(e));
  const eN = q.width ? document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2) : null;
  const eA = r.width ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
  return { idx: BT.idx, hotovo: Object.keys(S.done).length, utokDis: a.disabled, utokVid: getComputedStyle(a).display !== 'none', daleVid: getComputedStyle(n).display !== 'none', daleZasah: hit(eN, n), utokZasah: hit(eA, a), vstupDis: document.getElementById('bt-ans').disabled, arena: window.__petVArene === true };
});
const vstupHotov = pg => cekej(pg, () => { const i = document.getElementById('bt-ans'), a = document.getElementById('attack-btn'); return !i.disabled && !a.disabled; }, null, 4000);

async function castC(br, base, g, jm, w, h, f) {
  const P = PET_HRY[g], kde = 'g' + g + ' ' + P + ' ' + jm;
  const { ctx, pg, errs } = await otevri(br, base, g, { pet: P, dotyk: true, w, h });
  if (!await pripravBoj(pg)) { f(false, kde + ': boj se třemi úlohami se nepodařilo připravit'); await ctx.close(); return; }
  await sleep(900);
  let s = await stav(pg);
  f(s.arena, kde + ': mazlíček je v aréně už při první úloze');
  for (let k = 0; k < 3; k++) {
    f(await vstupHotov(pg), kde + ': úloha ' + (k + 1) + ' — pole a ÚTOK jsou povolené', JSON.stringify(await stav(pg)));
    const pred = await stav(pg);
    f(pred.utokVid && pred.utokZasah, kde + ': úloha ' + (k + 1) + ' — ÚTOK je vidět a nic ho nezakrývá', JSON.stringify(pred));
    await pg.fill('#bt-ans', await pg.evaluate(() => String(BT.curTask.ans)));
    if (k === 1) { await pg.focus('#bt-ans'); await pg.keyboard.press('Enter'); } else await tap(pg, '#attack-btn');
    await sleep(600);   /* DÁLE má pojistku 400 ms proti dvojitému ťuknutí — dítě na něj taky nesáhne dřív */
    s = await stav(pg);
    f(s.hotovo > pred.hotovo && s.daleVid && s.daleZasah, kde + ': úloha ' + (k + 1) + (k === 1 ? ' (Enter)' : ' (ťuknutí)') + ' — odpověď přijata, DÁLE je vidět a jde zasáhnout', JSON.stringify(s));
    if (k < 2) {
      if (k === 1) await pg.keyboard.press('Enter'); else await tap(pg, '#next-btn');
      await sleep(250);
      s = await stav(pg);
      f(s.idx === k + 1, kde + ': úloha ' + (k + 1) + (k === 1 ? ' — Enter posune na další úlohu' : ' — ťuknutí na DÁLE posune na další úlohu'), JSON.stringify(s));
    }
  }
  f(errs.length === 0, kde + ': bez chyb na stránce (část C)', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ── D) obchod, profil, hub ── */
const neprazdne = (pg, sel, i) => pg.evaluate(({ sel, i }) => { const c = document.querySelectorAll(sel)[i]; if (!c) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; return n; }, { sel, i });
const horniRadek = (pg, sel, i) => pg.evaluate(({ sel, i }) => { const c = document.querySelectorAll(sel)[i]; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) return y; return -1; }, { sel, i });
const otevriObchod = pg => pg.evaluate(() => { go('shop'); const t = [...document.querySelectorAll('.shop-tab')].find(b => /Mazl/.test(b.textContent)); if (t) t.click(); return !!t; });

async function castD(br, base, g, f) {
  const P = PET_HRY[g], kde = 'g' + g + ' ' + P;
  {
    const { ctx, pg, errs } = await otevri(br, base, g, { pet: P });
    f(await otevriObchod(pg), kde + ': v obchodě je záložka Mazlíčci');
    await cekej(pg, () => document.querySelectorAll('.kos-pet-cv').length >= 5, null, 4000);
    const n = await pg.evaluate(() => document.querySelectorAll('.kos-pet-cv').length), uk = await pg.evaluate(() => document.querySelectorAll('.kos-pet-uk').length);
    f(n >= 5 && uk === n, kde + ': každá karta mazlíčka má živé plátno a tlačítko „▶ UKÁZKA“', 'pláten ' + n + ', tlačítek ' + uk);
    for (let i = 0; i < n; i++) { const px = await neprazdne(pg, '.kos-pet-cv', i); if (px < 120) { f(false, kde + ': plátno mazlíčka ' + i + ' je prázdné (' + px + ' px)'); break; } }
    await pg.evaluate(() => { document.querySelector('.kos-pet-uk').scrollIntoView({ block: 'center' }); }); await sleep(500);
    const klid = await horniRadek(pg, '.kos-pet-cv', 0);
    await pg.evaluate(() => document.querySelector('.kos-pet-uk').click());
    let nej = 1e9; for (let t = 0; t < 4; t++) { await sleep(110); nej = Math.min(nej, await horniRadek(pg, '.kos-pet-cv', 0)); }
    f(nej <= klid - 6, kde + ': „▶ UKÁZKA“ — mazlíček vyskočí (nejvyšší bod ' + nej + ' proti klidu ' + klid + ')');
    /* profil: pixelový mazlíček, ne emoji */
    await pg.evaluate(() => go('profile')); await sleep(700);
    const prof = await pg.evaluate(() => ({ px: document.querySelectorAll('canvas.rw-pet-px').length, emoji: document.querySelectorAll('span.rw-pet').length }));
    f(prof.px === 1 && prof.emoji === 0, kde + ': profil má pixelového mazlíčka místo emoji', JSON.stringify(prof));
    if (prof.px) f(await neprazdne(pg, 'canvas.rw-pet-px', 0) > 120, kde + ': plátno mazlíčka v profilu není prázdné');
    f(errs.length === 0, kde + ': bez chyb na stránce (část D)', errs.slice(0, 2).join(' | '));
    await ctx.close();
  }
  {   // snížený pohyb: plátna v obchodě se nehýbou
    const { ctx, pg } = await otevri(br, base, g, { pet: P, rm: true });
    await otevriObchod(pg); await cekej(pg, () => document.querySelectorAll('.kos-pet-cv').length >= 5, null, 4000);
    const dv = () => pg.evaluate(() => document.querySelector('.kos-pet-cv').toDataURL());
    const a = await dv(); await sleep(900); const b = await dv();
    f(a === b, kde + ': pod sníženým pohybem se plátno v obchodě nehýbe');
    await ctx.close();
  }
}

async function castDhub(br, base, f) {
  const { ctx, pg, errs } = await otevri(br, base, 0, { pet: 'pet-kocka', stranka: 'rpg-matematika.html' });
  await sleep(1500);
  const h = await pg.evaluate(() => ({ px: document.querySelectorAll('canvas.rw-pet-px').length, emoji: document.querySelectorAll('span.rw-pet').length }));
  f(h.px >= 1 && h.emoji === 0, 'hub: profil má pixelového mazlíčka místo emoji', JSON.stringify(h));
  f(errs.length === 0, 'hub: bez chyb na stránce', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ── E) bez modulu ── */
async function castE(br, base, g, f) {
  const P = PET_HRY[g], kde = 'g' + g + ' ' + P + ' bez modulu';
  const { ctx, pg, errs } = await otevri(br, base, g, { pet: P });
  await spust(pg); await sleep(1500);
  f(await pg.evaluate(() => window.__petVArene !== true), kde + ': hra nehlásí mazlíčka v aréně');
  f(await sponkaVid(pg, true), kde + ': sponka je v boji vidět (jako dřív)');
  await pg.evaluate(() => go('profile')); await sleep(600);
  const prof = await pg.evaluate(() => ({ px: document.querySelectorAll('canvas.rw-pet-px').length, emoji: document.querySelectorAll('span.rw-pet').length }));
  f(prof.px === 0 && prof.emoji === 1, kde + ': v profilu zůstalo emoji', JSON.stringify(prof));
  await pg.evaluate(() => go('map')); await sleep(500);
  const pxE = await pg.evaluate(() => { const c = document.getElementById('rw-sponka-canvas'); if (!c) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) k++; return k; });
  f(pxE >= 200, kde + ': plovoucí mazlíček na mapě kreslí původní sprite (' + pxE + ' px)');
  f(errs.length === 0, kde + ': bez chyb na stránce', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ── F) plovoucí mazlíček na mapě a v tréninku kreslí TYTÉŽ sprity jako aréna, obchod a profil ── */
async function castF(br, base, g, f, nalada) {
  const P = PET_HRY[g], kde = 'g' + g + ' ' + P;
  const { ctx, pg, errs } = await otevri(br, base, g, { pet: P });
  f(await sponkaVid(pg, true), kde + ': plovoucí mazlíček je na mapě vidět');
  await pg.evaluate(() => {
    window.__fr = 0; window.__stavy = new Set(); window.__SPONKA_COOLDOWN_MS = 0;
    const o = RPGMazlicci.frame;
    RPGMazlicci.frame = function (c, id, e) { window.__fr++; window.__stavy.add(e.state); return o.apply(this, arguments); };
  });
  await sleep(600);
  const n = await pg.evaluate(() => window.__fr);
  f(n > 5, kde + ': plovoucí mazlíček se kreslí funkcí RPGMazlicci.frame (volání za 0,6 s: ' + n + ')');
  const px = await pg.evaluate(() => { const c = document.getElementById('rw-sponka-canvas'); if (!c) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) k++; return k; });
  f(px >= 200, kde + ': plátno plovoucího mazlíčka není prázdné (' + px + ' px)');
  if (nalada) {   // série dnů ≥ 3 na mapě = nálada „dobrá“ → krátké poskoky; po nich zase klid
    await pg.evaluate(() => { S.streak = { count: 5, last: new Date().toISOString().slice(0, 10) }; });
    const vidiRadost = await cekej(pg, () => window.__stavy.has('victory'), null, 9000);
    f(vidiRadost, kde + ': při dobré náladě poskakuje (stav „victory“); viděné stavy: ' + [...await pg.evaluate(() => [...window.__stavy])].join(', '));
  }
  f(errs.length === 0, kde + ': bez chyb na stránce (část F)', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

async function hlavni() {
  const br = await chromium.launch(LAUNCH);
  const srv = await server();
  const nalezy = []; let kontrol = 0; const f = (c, m, d) => { kontrol++; if (!c) nalezy.push(m + (d ? ' — ' + d : '')); };
  console.log('\n── Mazlíčci ve hrách (7 her) ──\n');
  const t0 = Date.now();
  for (const g of HRY) {
    await castA(br, baseOf(srv), g, f);
    await castB(br, baseOf(srv), g, f);
    await castC(br, baseOf(srv), g, 'iPad na šířku', 1024, 768, f);
    if (g === 3 || g === 9) await castC(br, baseOf(srv), g, 'telefon', 360, 740, f);
    await castD(br, baseOf(srv), g, f);
    await castF(br, baseOf(srv), g, f, g === 3 || g === 9);
  }
  await castDhub(br, baseOf(srv), f);
  srv.close();
  const bez = await server({ 'rpg-mat-3.html': s => s.replace(/<script defer src="\.\/rpg-mazlicci\.js[^>]*><\/script>/, '') });
  await castE(br, baseOf(bez), 3, f); bez.close();
  nalezy.slice(0, 15).forEach(n => console.log('  ⚠ ' + n));
  ok(nalezy.length === 0, 'skutečné hry projdou všemi kontrolami', nalezy.slice(0, 3).join(' | '));
  console.log('  provedeno kontrol: ' + kontrol);
  ok(kontrol >= KONTROL_MIN, 'test opravdu provedl očekávaný počet kontrol (' + kontrol + ' ≥ ' + KONTROL_MIN + ')');
  console.log('  skutečné hry: ' + (nalezy.length ? nalezy.length + ' nálezů' : 'bez nálezu') + ' (' + Math.round((Date.now() - t0) / 1000) + ' s)');

  /* ── sabotáže ── */
  const cti = fn => fs.readFileSync(path.join(ROOT, 'projects', fn), 'utf8');
  async function sabotaz(jm, prepis, g, rx) {
    const [soubor, fn] = Object.entries(prepis)[0];
    const orig = cti(soubor), zm = fn(orig), apl = zm !== orig;
    ok(apl, 'sabotáž „' + jm + '“ se aplikovala');
    if (!apl) return;
    const sv = await server(prepis), n = [], ff = (c, m, d) => { if (!c) n.push(m + (d ? ' — ' + d : '')); };
    try { await castA(br, baseOf(sv), g, ff); if (/obchod/.test(jm)) await castD(br, baseOf(sv), g, ff); if (/plovouc/.test(jm)) await castF(br, baseOf(sv), g, ff, false); } catch (e) { n.push('VÝJIMKA: ' + e.message); }
    sv.close();
    ok(n.length > 0 && n.some(t => rx.test(t)), 'sabotáž „' + jm + '“ je chycena', n.length ? n[0] : 'prošla bez nálezu');
  }
  await sabotaz('hra bez zapojení', { 'rpg-mat-9.html': s => s.replace('window.__petVArene=!!(_ok&&_pid&&RPGMazlicci.has(_pid));', 'window.__petVArene=false;') }, 9, /hra oznámila mazlíčka/);
  await sabotaz('jádro bez háčku', { 'rpg-sprite-core.js': s => s.replace('        if (PET) {\n          try {', '        if (false) {\n          try {') }, 9, /kreslí se/);
  await sabotaz('sponka se v boji neschová', { 'rpg-wallet.js': s => s.replace("window.__petVArene === true) skryt = true;", "window.__petVArene === 'nikdy') skryt = true;") }, 9, /sponka je v boji schovaná/);
  await sabotaz('chyba v mazlíčkovi shodí boj', { 'rpg-sprite-core.js': s => s.replace('} catch (e) { PET = null; ctx.restore(); }', '} catch (e) { throw e; }') }, 3, /vrátí parťák|bez chyb|běží dál/);
  await sabotaz('plovoucí mazlíček kreslí původní sprity', { 'rpg-wallet.js': s => s.replace("&& window.RPGMazlicci.has(pid)) ? window.RPGMazlicci : null;", "&& false) ? window.RPGMazlicci : null;") }, 9, /RPGMazlicci\.frame/);
  await sabotaz('obchod bez ukázky', { 'rpg-kosmetika.js': s => s.replace("b.addEventListener('click', () => { if (h) h.ukazka(); });", "b.addEventListener('click', () => {});") }, 3, /UKÁZKA/);

  await br.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
}
hlavni().catch(e => { console.error(e); process.exit(1); });
