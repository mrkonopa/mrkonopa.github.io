/* ═════════════════════════════════════════════════════════════════════════════
   Infocentrum — pohyblivé panely v učitelské konzoli (`rpg-ucitel.html` + `projects/rpg-infocentrum-mrizka.js`),
   Playwright, autor Vojtěch Konopa. Logiku mřížky (čistě v Node) hlídá `rpg-infocentrum-mrizka.test.cjs`; tady se
   měří SKUTEČNÉ rámečky ve vykreslené stránce a ovládá se tak, jak to dělá učitel: myší, prstem a klávesnicí.

   Ověřuje se:
     1. výchozí rozložení (1920 px): Kdo hraje vlevo (8 ze 12 sloupců), Třída a Děje se vpravo, nic se nepřekrývá a nepřetéká;
        obsah panelů (ID uvnitř) zůstal, rolovací vrstva je pojmenovaná oblast; úchyty jsou zamčené (schované)
     2. „Upravit rozložení“: úchyty se ukážou s pojmenováním, tlačítko Výchozí, aria-pressed; zpět se zamkne
     3. klávesnice: šipky přesouvají, Shift + šipky mění velikost, svislý pohyb vymění sousedy, na kraji zpráva „dál to nejde“,
        čtečka dostane větu, nic se nepřekryje
     4. myš: tažení úchytu přesune panel o buňky, tažení rohu mění velikost, zrušené tažení vrátí původní polohu
     5. dotyk (iPad na šířku, skutečné dotykové události): panel jde přesunout prstem a stránka se přitom nerolu­je
     6. úzké okno (iPad na výšku, telefon): mřížka se vypne, panely jsou pod sebou, tlačítka úprav nejsou, nic nepřetéká
     7. ukládání: rozložení přežije obnovení stránky, platí jen pro svou třídu, „Výchozí“ ho smaže, rozbité úložiště nic nerozbije
     8. Týmy: když se objeví, jsou nahoře přes celou šířku a ostatní ustoupí; když zmizí, ostatní spadnou nahoru
     9. projektor (celá obrazovka): úpravy se vypnou a úchyty zmizí; zpět se úpravy samy nevrátí
    10. velká třída: panel se při 40 žácích rolují, poslední karta je dosažitelná, stránka nepřetéká
    11. odchod ze záložky úpravy zamkne a schovaná záložka panely nesmrští
    12. scénáře: výběr, pamatování po třídách i po obnovení, vlastní scénář (jméno s HTML jako text), duplicitní název, smazání
    13. odebrání a vrácení panelu (tlačítko ✕, Enter, nabídka „Přidat panel“, úložiště, scénáře, „Výchozí rozložení“)
    14. nabídka přepnutí při začátku týmového souboje: nepřepne sama, „Ne, díky“ platí pro souboj, další souboj ji nabídne znovu
   Sabotáže (18): bez mřížky, úchyty vždy vidět, tažení se neukládá, klávesnice odpojená, jeden klíč pro všechny třídy,
   projektor úpravy nevypne, úzké okno s mřížkou, odchod ze záložky nezamkne, schovaný panel zabírá místo, nevykreslený obsah se měří, výška se neřídí obsahem,
   ruční výška se neukládá, klávesnice bez věty pro čtečku.
   Spusť: node tests/rpg-infocentrum-panely.test.cjs
   ═════════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const { mock, server, baseOf } = require('./ic-konzole-mock.cjs');
const LAUNCH = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };
const PODLAHA = 125;                                              // naměřeno

const sy = (() => { const d = new Date(); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; })();
const ted = () => new Date().toISOString();
const zak = (id, hra, i) => ({ user_id: id, game: hra, name: 'Hrdina' + i, email: id + '@husovaliberec.cz', full_name: 'Žák ' + i + ' Příjmení', updated_at: ted(), data: { name: 'Hrdina' + i, xp: 100 + i, level: 3, done: {} } });
function scenar(n) {
  const c1 = Array.from({ length: n }, (_, i) => 'z' + (i + 1));
  return {
    roles: [{ email: 'ucitel@husovaliberec.cz', role: 'teacher' }],
    session: { user: { id: 'u-uc', email: 'ucitel@husovaliberec.cz', user_metadata: { full_name: 'Učitel' } } },
    classes: [{ id: 'c1', name: 'Osmá B', section: 'B', cohort_start_year: sy - 2, archived: false }, { id: 'c2', name: 'Devátá A', section: 'A', cohort_start_year: sy - 3, archived: false }],
    members: c1.map(u => ({ class_id: 'c1', user_id: u })).concat(['y1', 'y2'].map(u => ({ class_id: 'c2', user_id: u }))),
    saves: c1.map((u, i) => zak(u, 'RPG_MAT_8', i)).concat(['y1', 'y2'].map((u, i) => zak(u, 'RPG_MAT_9', 50 + i))),
  };
}

let pass = 0, fail = 0, nalezy = 0, hlasit = true;
const ok = (c, m, d) => { if (c) { if (hlasit) pass++; } else { nalezy++; if (hlasit) { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } } };

async function otevri(br, base, volby, o) {
  o = o || {};
  const ctx = await br.newContext(Object.assign({ viewport: { width: 1920, height: 1500 } }, volby || {}));
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(mock(scenar(o.zaku || 6)));
  if (o.uloziste !== undefined) await ctx.addInitScript(txt => { if (!sessionStorage.getItem('__ls_seed')) { sessionStorage.setItem('__ls_seed', '1'); localStorage.setItem('RPG_INFOCENTRUM_ROZLOZENI', txt); } }, o.uloziste);
  const p = await ctx.newPage(), chyby = [];
  p.setDefaultTimeout(9000);
  p.on('pageerror', e => chyby.push(e.message));
  await p.goto(base + '/projects/rpg-ucitel.html');
  await p.waitForFunction(() => !document.getElementById('console').classList.contains('hidden'), null, { timeout: 15000 });
  await p.click('.tab[data-tab="infocentrum"]');
  await cekejKarty(p, o.zaku || 6);
  await p.evaluate(() => infoStop());                                 // obnovu řídí test, ne časovač
  return { ctx, p, chyby };
}
const cekejKarty = (p, n, cid) => p.waitForFunction(([n2, c]) => document.querySelectorAll('#ic-cards .ic-card').length === n2 && (!c || IC.cid === c), [n, cid || null], { timeout: 10000 });
const panely = p => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#ic-grid [data-ic-panel]')].filter(e => !e.hidden && getComputedStyle(e).display !== 'none').map(e => { const b = e.getBoundingClientRect(); return [e.dataset.icPanel, { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }]; })));
const bunky = p => p.evaluate(() => { const g = document.getElementById('ic-grid'), cs = getComputedStyle(g), mz = parseFloat(cs.columnGap) || 0; const b = g.getBoundingClientRect(); return { sl: (b.width + mz) / 12, ra: (parseFloat(cs.gridAutoRows) || 36) + (parseFloat(cs.rowGap) || 0), l: b.left, t: b.top, w: b.width }; });
const prekryvy = pn => { const k = Object.keys(pn), v = []; for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = pn[k[i]], b = pn[k[j]]; if (a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5) v.push(k[i] + '/' + k[j]); } return v; };
const pretec = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const stred = async (p, sel) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); const b = await l.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
const zapniUpravu = async p => { await p.click('#ic-uprav'); await p.waitForFunction(() => document.getElementById('ic-uprav').getAttribute('aria-pressed') === 'true'); };
const vychoziPol = pn => ({ kdoL: Math.round(pn.kdo.l), kdoW: Math.round(pn.kdo.w) });
const ulozeno = p => p.evaluate(() => localStorage.getItem('RPG_INFOCENTRUM_ROZLOZENI'));
const tahni = async (p, od, doo, kroku) => { await p.mouse.move(od.x, od.y); await p.mouse.down(); for (let i = 1; i <= (kroku || 6); i++) await p.mouse.move(od.x + (doo.x - od.x) * i / (kroku || 6), od.y + (doo.y - od.y) * i / (kroku || 6)); };

const znovu = async (p, n) => { await p.reload(); await p.waitForFunction(() => !document.getElementById('console').classList.contains('hidden')); await p.click('.tab[data-tab="infocentrum"]'); await cekejKarty(p, n || 6); await p.evaluate(() => infoStop()); };
/* souboj v týmovém režimu: stav `status` pod id; `bezici` = id, které server hlásí jako běžící */
const souboj = (p, id, status, bezici) => p.evaluate(([id2, st, bz]) => {
  const t = new Date().toISOString();
  __db.stavyPodleId = Object.assign(__db.stavyPodleId || {}, { [id2]: { battle: { team_mode: true, status: st, q_index: 1 }, teams: { 0: 5, 1: 4 }, players: [
    { team: 0, display_name: 'Anna Nováková', score: 9, correct_count: 1, last_qi: 1, last_seen: t }, { team: 1, display_name: 'Adam Hrubý', score: 8, correct_count: 1, last_qi: 1, last_seen: t }] } });
  __db.bitvy = (bz || []).map(x => ({ id: x, game: 'RPG_MAT_8', status: 'active' }));
}, [id, status, bezici]);
const nabidkaVidet = p => p.evaluate(() => !document.getElementById('ic-nabidka').hidden);
const aktivni = p => p.evaluate(() => icMr.scenare().aktivni);

const ODDILY = {
  /* 1 — výchozí rozložení */
  async vychozi(br, base) {
    const { ctx, p, chyby } = await otevri(br, base);
    const pn = await panely(p), b = await bunky(p);
    ok(Object.keys(pn).sort().join() === 'deje,kdo,trida', 'výchozí: viditelné jsou Kdo hraje, Třída dohromady, Děje se (Týmy bez souboje schované)', Object.keys(pn).join());
    ok(prekryvy(pn).length === 0, 'výchozí: panely se nepřekrývají', prekryvy(pn).join());
    ok(Math.abs(pn.kdo.t - b.t) < 2 && Math.abs(pn.trida.t - b.t) < 2, 'výchozí: bez Týmů začínají panely hned nahoře (skrytý panel nezabírá místo)', JSON.stringify([pn.kdo.t, b.t]));
    const orez = await p.evaluate(() => [...document.querySelectorAll('#ic-grid [data-ic-panel]')].filter(e => !e.hidden).map(e => { const v = e.querySelector('.ic-vnitr'); return e.dataset.icPanel + ':' + (v.scrollHeight - v.clientHeight); }).filter(t => +t.split(':')[1] > 1));
    ok(orez.length === 0, 'výchozí: výška panelů se řídí obsahem, nic není ořezané ani se nerolu­je', orez.join());
    const grid = await p.evaluate(() => { const g = document.getElementById('ic-grid'); return { d: getComputedStyle(g).display, mr: g.classList.contains('ic-mr') }; });
    ok(grid.d === 'grid' && grid.mr, 'výchozí: na široké obrazovce je panelová mřížka', JSON.stringify(grid));
    ok(Math.abs(pn.kdo.w - (8 * b.sl - (b.sl * 12 - b.w) / 11)) < 3 || Math.abs(pn.kdo.w / b.w - 8 / 12) < 0.03, 'výchozí: Kdo hraje má 8 z 12 sloupců', Math.round(pn.kdo.w) + ' z ' + Math.round(b.w));
    ok(Math.abs(pn.kdo.t - pn.trida.t) < 1 && pn.trida.l > pn.kdo.r && Math.abs(pn.trida.r - (b.l + b.w)) < 2, 'výchozí: Třída dohromady je vpravo ve výšce Kdo hraje', JSON.stringify([pn.kdo.t, pn.trida.t]));
    ok(pn.deje.t >= pn.trida.b && Math.abs(pn.deje.l - pn.trida.l) < 1, 'výchozí: Děje se je pod Třídou dohromady', JSON.stringify([pn.trida.b, pn.deje.t]));
    ok(await pretec(p) <= 1, 'výchozí: stránka nepřetéká do šířky', String(await pretec(p)));
    const obsah = await p.evaluate(() => ({ kdo: !!document.querySelector('[data-ic-panel=kdo] #ic-cards'), trida: !!document.querySelector('[data-ic-panel=trida] #ic-gv'), deje: !!document.querySelector('[data-ic-panel=deje] #ic-feed'), tymy: !!document.querySelector('[data-ic-panel=tymy] #ic-tn1'),
      oblasti: [...document.querySelectorAll('.ic-vnitr')].map(e => e.getAttribute('role') + ':' + e.getAttribute('aria-label') + ':' + e.tabIndex).join('|') }));
    ok(obsah.kdo && obsah.trida && obsah.deje && obsah.tymy, 'výchozí: prvky uvnitř panelů zůstaly na svých místech', JSON.stringify(obsah));
    ok(obsah.oblasti === 'region:Týmy:0|region:Kdo hraje:0|region:Třída dohromady:0|region:Děje se:0', 'výchozí: obsah je v pojmenované rolovací oblasti dosažitelné klávesnicí', obsah.oblasti);
    const zam = await p.evaluate(() => ({ uchyty: [...document.querySelectorAll('.ic-uchyt')].filter(e => e.offsetParent !== null).length, vych: document.getElementById('ic-vychozi').offsetParent !== null, pressed: document.getElementById('ic-uprav').getAttribute('aria-pressed'), text: document.getElementById('ic-uprav').textContent }));
    ok(zam.uchyty === 0 && !zam.vych && zam.pressed === 'false' && /Upravit/.test(zam.text), 'zamčeno: úchyty ani „Výchozí“ nejsou vidět, tlačítko nabízí úpravu', JSON.stringify(zam));
    ok(chyby.length === 0, 'výchozí: žádná chyba JS', chyby.join(' | '));
    await ctx.close();
  },
  /* 2 — režim úprav */
  async uprava(br, base) {
    const { ctx, p } = await otevri(br, base);
    await zapniUpravu(p);
    const v = await p.evaluate(() => ({ uchyty: [...document.querySelectorAll('.ic-uchyt')].filter(e => e.offsetParent !== null).map(e => e.getAttribute('aria-label')), vych: document.getElementById('ic-vychozi').offsetParent !== null, text: document.getElementById('ic-uprav').textContent, cls: document.getElementById('ic-grid').classList.contains('ic-uprava'),
      velikost: Math.min(...[...document.querySelectorAll('.ic-uchyt')].filter(e => e.offsetParent !== null).map(e => Math.min(e.offsetWidth, e.offsetHeight))), rohy: [...document.querySelectorAll('.ic-roh')].filter(e => e.offsetParent !== null).length }));
    ok(v.uchyty.length === 3 && v.uchyty.every(t => /^Panel .+: šipky přesouvají, Shift a šipky mění velikost$/.test(t)), 'úpravy: tři viditelné úchyty (Týmy jsou schované) s pojmenováním pro čtečku', JSON.stringify(v.uchyty));
    ok(v.vych && v.cls && /Hotovo/.test(v.text) && v.rohy === 3, 'úpravy: je vidět „Výchozí rozložení“, rohy pro velikost a tlačítko nabízí zamknutí', JSON.stringify(v));
    ok(v.velikost >= 34, 'úpravy: úchyt je aspoň 34 px (jinak se prstem netrefí)', String(v.velikost));
    await p.click('#ic-uprav');
    const z = await p.evaluate(() => ({ uchyty: [...document.querySelectorAll('.ic-uchyt')].filter(e => e.offsetParent !== null).length, pressed: document.getElementById('ic-uprav').getAttribute('aria-pressed') }));
    ok(z.uchyty === 0 && z.pressed === 'false', 'zamknutí: úchyty zmizí', JSON.stringify(z));
    await ctx.close();
  },
  /* 3 — klávesnice */
  async klavesnice(br, base) {
    const { ctx, p, chyby } = await otevri(br, base);
    await zapniUpravu(p);
    const pred = await panely(p), b = await bunky(p);
    await p.focus('[data-ic-panel=trida] .ic-uchyt');
    await p.keyboard.press('ArrowLeft');
    const po = await panely(p);
    ok(Math.abs((pred.trida.l - po.trida.l) - b.sl) < 3, 'klávesnice: šipka vlevo posune Třídu o jeden sloupec', (pred.trida.l - po.trida.l).toFixed(1) + ' px, sloupec ' + b.sl.toFixed(1));
    ok(prekryvy(po).length === 0, 'klávesnice: po posunu se nic nepřekrývá', prekryvy(po).join());
    await p.waitForFunction(() => /Třída dohromady: sloupec \d+ z 12, řádek \d+, šířka \d+, výška \d+/.test(document.getElementById('ic-live').textContent), null, { timeout: 3000 }).catch(() => {});
    const veta = await p.evaluate(() => document.getElementById('ic-live').textContent);
    ok(/Třída dohromady: sloupec 8 z 12/.test(veta), 'klávesnice: čtečka dostane větu s novým sloupcem', veta);
    ok(await p.evaluate(() => document.activeElement.classList.contains('ic-uchyt')), 'klávesnice: fokus zůstane na úchytu po posunu');
    await p.keyboard.press('ArrowDown');
    const dole = await panely(p);
    ok(dole.deje.t < dole.trida.t || dole.trida.t > pred.trida.t, 'klávesnice: šipka dolů přeskočí souseda (Třída a Děje se si vymění místo)', JSON.stringify([dole.trida.t, dole.deje.t]));
    ok(prekryvy(dole).length === 0, 'klávesnice: po výměně se nic nepřekrývá', prekryvy(dole).join());
    await p.focus('[data-ic-panel=kdo] .ic-uchyt');
    const sirPred = (await panely(p)).kdo.w;
    await p.keyboard.press('Shift+ArrowRight');
    const sirPo = (await panely(p)).kdo.w;
    ok(Math.abs((sirPo - sirPred) - b.sl) < 3, 'klávesnice: Shift + šipka vpravo zvětší Kdo hraje o jeden sloupec', (sirPo - sirPred).toFixed(1) + ' px');
    for (let i = 0; i < 12; i++) await p.keyboard.press('Shift+ArrowLeft');
    await p.waitForTimeout(80);
    const nej = await panely(p);
    ok(Math.abs(nej.kdo.w - (4 * b.sl - (b.sl * 12 - b.w) / 11)) < 4 || Math.round(nej.kdo.w / b.sl) <= 4, 'klávesnice: zmenšování se zastaví na nejmenší šířce (4 sloupce)', Math.round(nej.kdo.w) + ' px');
    await p.waitForFunction(() => /dál to nejde/.test(document.getElementById('ic-live').textContent), null, { timeout: 3000 }).catch(() => {});
    ok(/dál to nejde/.test(await p.evaluate(() => document.getElementById('ic-live').textContent)), 'klávesnice: na hranici čtečka dostane „dál to nejde“');
    ok(prekryvy(nej).length === 0 && await pretec(p) <= 1, 'klávesnice: po zmenšení bez překryvu a bez přetečení');
    ok(chyby.length === 0, 'klávesnice: žádná chyba JS', chyby.join(' | '));
    await ctx.close();
  },
  /* 4 — myš */
  async mys(br, base) {
    const { ctx, p } = await otevri(br, base);
    await zapniUpravu(p);
    const pred = await panely(p), b = await bunky(p);
    const od = await stred(p, '[data-ic-panel=trida] .ic-uchyt');
    await tahni(p, od, { x: od.x - 2 * b.sl, y: od.y });
    await p.mouse.up();
    const po = await panely(p);
    ok(Math.abs((pred.trida.l - po.trida.l) - 2 * b.sl) < 4, 'myš: tažení úchytu o dva sloupce posune Třídu o dva sloupce', (pred.trida.l - po.trida.l).toFixed(1) + ' px, čekáno ' + (2 * b.sl).toFixed(1));
    ok(prekryvy(po).length === 0, 'myš: po přetažení se nic nepřekrývá', prekryvy(po).join());
    const roh = await stred(p, '[data-ic-panel=kdo] .ic-roh');
    const sirPred = po.kdo.w;
    await tahni(p, roh, { x: roh.x + b.sl, y: roh.y });
    await p.mouse.up();
    const sirPo = (await panely(p)).kdo.w;
    ok(Math.abs((sirPo - sirPred) - b.sl) < 4, 'myš: tažení rohu zvětší Kdo hraje o jeden sloupec', (sirPo - sirPred).toFixed(1) + ' px');
    /* zrušené tažení (pointercancel) vrátí původní polohu */
    const pred2 = await panely(p);
    const od2 = await stred(p, '[data-ic-panel=deje] .ic-uchyt');
    await tahni(p, od2, { x: od2.x - 3 * b.sl, y: od2.y });
    const uprostred = await panely(p);
    await p.evaluate(() => document.querySelector('[data-ic-panel=deje] .ic-uchyt').dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })));
    const poZruseni = await panely(p);
    await p.mouse.up();
    ok(Math.abs(uprostred.deje.l - pred2.deje.l) > b.sl, 'myš: během tažení panel opravdu jede za myší', (uprostred.deje.l - pred2.deje.l).toFixed(1));
    ok(Math.abs(poZruseni.deje.l - pred2.deje.l) < 2 && Math.abs(poZruseni.deje.t - pred2.deje.t) < 2, 'myš: zrušené tažení vrátí původní polohu', JSON.stringify([poZruseni.deje.l - pred2.deje.l, poZruseni.deje.t - pred2.deje.t]));
    await ctx.close();
  },
  /* 5 — dotyk (iPad na šířku) */
  async dotyk(br, base) {
    const { ctx, p } = await otevri(br, base, { viewport: { width: 1180, height: 1600 }, hasTouch: true, isMobile: true });
    await zapniUpravu(p);
    const b = await bunky(p), pred = await panely(p);
    const velikost = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.ic-uchyt')].filter(e => e.offsetParent !== null).map(e => Math.min(e.offsetWidth, e.offsetHeight))));
    ok(velikost >= 44, 'dotyk: úchyt je na dotykové obrazovce aspoň 44 px', String(velikost));
    const od = await stred(p, '[data-ic-panel=trida] .ic-uchyt');
    const cdp = await ctx.newCDPSession(p);
    const dotek = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const scrollPred = await p.evaluate(() => scrollY);
    await dotek('touchStart', od.x, od.y);
    for (let i = 1; i <= 8; i++) await dotek('touchMove', od.x - (2 * b.sl) * i / 8, od.y + 30 * i / 8);
    await dotek('touchEnd');
    await p.waitForTimeout(150);
    const po = await panely(p), scrollPo = await p.evaluate(() => scrollY);
    ok(Math.abs((pred.trida.l - po.trida.l) - 2 * b.sl) < 5, 'dotyk: tažení prstem posune Třídu o dva sloupce', (pred.trida.l - po.trida.l).toFixed(1) + ' px, čekáno ' + (2 * b.sl).toFixed(1));
    ok(Math.abs(scrollPo - scrollPred) < 2, 'dotyk: stránka se při tažení panelu nerolu­je', String(scrollPo - scrollPred));
    ok(prekryvy(po).length === 0 && await pretec(p) <= 1, 'dotyk: bez překryvu a bez přetečení');
    await ctx.close();
  },
  /* 6 — úzká okna */
  async uzke(br, base) {
    for (const [nazev, vp] of [['iPad na výšku 820 px', { width: 820, height: 1180 }], ['telefon 390 px', { width: 390, height: 844 }]]) {
      const { ctx, p } = await otevri(br, base, { viewport: vp, hasTouch: true, isMobile: true });
      const v = await p.evaluate(() => ({ mr: document.getElementById('ic-grid').classList.contains('ic-mr'), d: getComputedStyle(document.getElementById('ic-grid')).display, uprav: document.getElementById('ic-uprav').offsetParent !== null, vych: document.getElementById('ic-vychozi').offsetParent !== null }));
      ok(!v.mr && v.d === 'flex' && !v.uprav && !v.vych, nazev + ': mřížka vypnutá, panely pod sebou, tlačítka úprav nejsou', JSON.stringify(v));
      const pn = await panely(p), k = Object.keys(pn).sort((a, c) => pn[a].t - pn[c].t);
      ok(k.join() === 'kdo,trida,deje' && prekryvy(pn).length === 0 && k.every(id => Math.abs(pn[id].l - pn.kdo.l) < 1), nazev + ': panely jsou pod sebou ve výchozím pořadí', k.join());
      ok(await pretec(p) <= 1 && k.every(id => pn[id].r <= vp.width + 1), nazev + ': nic nepřetéká do šířky', String(await pretec(p)));
      await ctx.close();
    }
  },
  /* 7 — ukládání */
  async uloziste(br, base) {
    let { ctx, p } = await otevri(br, base);
    await zapniUpravu(p);
    const b = await bunky(p), pred = await panely(p);
    const od = await stred(p, '[data-ic-panel=trida] .ic-uchyt');
    await tahni(p, od, { x: od.x - 2 * b.sl, y: od.y }); await p.mouse.up();
    const uloz = await ulozeno(p);
    ok(!!uloz && !!JSON.parse(uloz).r['c1|hodina'], 'úložiště: po tažení je rozložení uložené pod klíčem „třída|hodina“', String(uloz).slice(0, 120));
    const hotove = await panely(p);
    await p.reload(); await p.waitForFunction(() => !document.getElementById('console').classList.contains('hidden'));
    await p.click('.tab[data-tab="infocentrum"]'); await cekejKarty(p, 6); await p.evaluate(() => infoStop());
    const po = await panely(p);
    ok(Math.abs(po.trida.l - hotove.trida.l) < 2 && Math.abs(po.kdo.w - hotove.kdo.w) < 2, 'úložiště: rozložení přežije obnovení stránky', JSON.stringify([po.trida.l - hotove.trida.l, po.kdo.w - hotove.kdo.w]));
    await p.selectOption('#ic-class', 'c2'); await cekejKarty(p, 2, 'c2');
    const jina = await panely(p);
    ok(Math.abs(jina.trida.l - pred.trida.l) < 2, 'úložiště: jiná třída má výchozí rozložení', (jina.trida.l - pred.trida.l).toFixed(1));
    await p.selectOption('#ic-class', 'c1'); await cekejKarty(p, 6, 'c1');
    const zpet = await panely(p);
    ok(Math.abs(zpet.trida.l - hotove.trida.l) < 2, 'úložiště: po návratu na původní třídu se její rozložení vrátí', (zpet.trida.l - hotove.trida.l).toFixed(1));
    await zapniUpravu(p);
    await p.click('#ic-vychozi');
    const vych = await panely(p);
    ok(Math.abs(vych.trida.l - pred.trida.l) < 2 && Math.abs(vych.kdo.w - pred.kdo.w) < 2, 'úložiště: „Výchozí rozložení“ vrátí původní polohu', (vych.trida.l - pred.trida.l).toFixed(1));
    const txt = await ulozeno(p);
    ok(!txt || !JSON.parse(txt).r['c1|hodina'], 'úložiště: „Výchozí rozložení“ smaže uložené rozložení třídy', String(txt).slice(0, 100));
    await ctx.close();
    /* rozbité a nepřátelské úložiště */
    const NEPRATELSKE = ['nejde o JSON', '{"v":1,"r":{"c1|hodina":{"kdo":[1e99,-5,"x",null],"trida":[0,0,99,99],"deje":"x","tymy":[0,0,2,2]}}}', '{"v":1,"r":{"c1|hodina":{"__proto__":[0,0,1,1],"kdo":[-3,-3,-3,-3]}}}', '[]'];
    for (const txt2 of NEPRATELSKE) {
      const o = await otevri(br, base, null, { uloziste: txt2 });
      const pn = await panely(o.p);
      ok(o.chyby.length === 0 && Object.keys(pn).length === 3 && prekryvy(pn).length === 0 && await pretec(o.p) <= 1, 'úložiště: rozbitý obsah (' + txt2.slice(0, 28) + '…) nic nerozbije', o.chyby.join(' | ') + ' ' + prekryvy(pn).join());
      const ve = await o.p.evaluate(() => { const r = document.getElementById('ic-grid').getBoundingClientRect(); return [...document.querySelectorAll('#ic-grid [data-ic-panel]')].every(e => e.hidden || (e.getBoundingClientRect().right <= r.right + 1 && e.getBoundingClientRect().left >= r.left - 1)); });
      ok(ve, 'úložiště: panely po rozbitém obsahu zůstanou v mřížce (' + txt2.slice(0, 28) + '…)');
      await o.ctx.close();
    }
  },
  /* 8 — Týmy */
  async tymy(br, base) {
    const { ctx, p } = await otevri(br, base);
    const bez = await panely(p);
    await p.evaluate(() => {
      const t = new Date().toISOString();
      __db.bitvy = [{ id: 'b1', game: 'RPG_MAT_8', status: 'active' }];
      __db.stavBitvy = { battle: { team_mode: true, status: 'active', q_index: 3 }, teams: { 0: 5, 1: 4 }, players: [
        { team: 0, display_name: 'Anna Nováková', score: 900, correct_count: 5, last_qi: 2, last_seen: t }, { team: 1, display_name: 'Adam Hrubý', score: 2000, correct_count: 9, last_qi: 3, last_seen: t }] };
    });
    await p.evaluate(() => icTymy());
    await p.waitForFunction(() => !document.getElementById('ic-tymy').hidden);
    await p.waitForTimeout(80);
    const s = await panely(p), b = await bunky(p);
    ok(Object.keys(s).length === 4 && prekryvy(s).length === 0, 'Týmy: čtyři panely bez překryvu', prekryvy(s).join());
    ok(s.tymy.t < s.kdo.t && Math.abs(s.tymy.w - b.w) < 2 && Math.abs(s.tymy.t - b.t) < 2, 'Týmy: jsou nahoře přes celou šířku', JSON.stringify([s.tymy.t, s.tymy.w, b.w, b.t]));
    ok(s.kdo.t >= s.tymy.b && s.trida.t >= s.tymy.b, 'Týmy: ostatní panely ustoupily pod ně', JSON.stringify([s.tymy.b, s.kdo.t]));
    await p.evaluate(() => { __db.bitvy = []; __db.stavBitvy = { battle: { team_mode: false }, teams: null, players: [] }; IC.bojId = null; });
    await p.evaluate(() => icTymy());
    await p.waitForFunction(() => document.getElementById('ic-tymy').hidden);
    await p.waitForTimeout(80);
    const po = await panely(p);
    ok(Math.abs(po.kdo.t - bez.kdo.t) < 2 && Math.abs(po.trida.t - bez.trida.t) < 2 && Math.abs(po.deje.t - bez.deje.t) < 2, 'Týmy: po zmizení panelu ostatní spadnou zpět nahoru', JSON.stringify([po.kdo.t - bez.kdo.t, po.deje.t - bez.deje.t]));
    await ctx.close();
  },
  /* 9 — projektor */
  async projektor(br, base) {
    const { ctx, p } = await otevri(br, base, { viewport: { width: 1920, height: 1080 } });
    await zapniUpravu(p);
    /* režim projektoru zapnutý jinak než tlačítkem (třída na kořeni): úchyty musí zmizet i tak, vypnutí úprav nesmí záviset na tlačítku */
    await p.evaluate(() => document.getElementById('ic-root').classList.add('ic-proj'));
    await p.waitForTimeout(150);
    const jinak = await p.evaluate(() => [...document.querySelectorAll('.ic-uchyt, .ic-roh')].filter(e => e.offsetParent !== null).length);
    ok(jinak === 0, 'projektor: úchyty zmizí i při zapnutí režimu mimo tlačítko', String(jinak));
    await p.evaluate(() => document.getElementById('ic-root').classList.remove('ic-proj'));
    await p.waitForTimeout(150);
    const zpetJinak = await p.evaluate(() => [...document.querySelectorAll('.ic-uchyt')].filter(e => e.offsetParent !== null).length);
    ok(zpetJinak === 3, 'projektor: po zrušení režimu mimo tlačítko se úchyty vrátí, úpravy byly stále zapnuté', String(zpetJinak));
    await p.click('#ic-full');
    await p.waitForFunction(() => document.getElementById('ic-root').classList.contains('ic-proj'), null, { timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(150);
    const v = await p.evaluate(() => ({ proj: document.getElementById('ic-root').classList.contains('ic-proj'), uchyty: [...document.querySelectorAll('.ic-uchyt, .ic-roh')].filter(e => e.offsetParent !== null).length, tlac: document.getElementById('ic-uprav').getAttribute('aria-pressed'), cls: document.getElementById('ic-grid').classList.contains('ic-uprava') }));
    ok(v.proj && v.uchyty === 0 && v.tlac === 'false' && !v.cls, 'projektor: po vstupu na celou obrazovku se úpravy vypnou a úchyty zmizí', JSON.stringify(v));
    const pn = await panely(p);
    ok(prekryvy(pn).length === 0 && await pretec(p) <= 1, 'projektor: panely bez překryvu a bez přetečení (1920 × 1080)', prekryvy(pn).join());
    await p.evaluate(() => { if (document.fullscreenElement) return document.exitFullscreen(); document.getElementById('ic-root').classList.remove('ic-proj'); });
    await p.waitForFunction(() => !document.getElementById('ic-root').classList.contains('ic-proj'), null, { timeout: 4000 }).catch(() => {});
    await p.waitForTimeout(150);
    const zpet = await p.evaluate(() => ({ uchyty: [...document.querySelectorAll('.ic-uchyt')].filter(e => e.offsetParent !== null).length, tlac: document.getElementById('ic-uprav').getAttribute('aria-pressed') }));
    ok(zpet.uchyty === 0 && zpet.tlac === 'false', 'projektor: po návratu se úpravy samy nezapnou', JSON.stringify(zpet));
    await ctx.close();
  },
  /* 10 — velká třída: výška podle obsahu, ruční připnutí výšky, návrat k výchozímu */
  async rolovani(br, base) {
    const { ctx, p } = await otevri(br, base, { viewport: { width: 1920, height: 1500 } }, { zaku: 40 });
    const stav = () => p.evaluate(() => { const vn = document.querySelector('[data-ic-panel=kdo] .ic-vnitr'), ob = vn.firstElementChild; const karty = vn.querySelectorAll('.ic-card'); const rr = vn.getBoundingClientRect();
      const kp = karty[karty.length - 1].getBoundingClientRect(); return { karet: karty.length, panel: Math.round(vn.parentElement.getBoundingClientRect().height), obsah: ob.offsetHeight, rol: vn.scrollHeight - vn.clientHeight, poslVidi: kp.bottom <= rr.bottom + 1 && kp.top >= rr.top - 1 }; });
    const a = await stav();
    ok(a.karet === 40 && a.rol <= 1 && a.poslVidi, 'velká třída: panel vyroste podle obsahu, všech 40 karet je vidět bez rolování', JSON.stringify(a));
    ok(a.panel >= a.obsah && a.panel - a.obsah < 60, 'velká třída: výška panelu sedí na obsah (nejvýš jeden řádek mřížky navíc)', JSON.stringify(a));
    ok(a.panel > 17 * 36 + 16 * 12, 'velká třída: panel je vyšší než výchozích 17 řádků', String(a.panel));
    ok(await pretec(p) <= 1, 'velká třída: stránka nepřetéká do šířky');
    await p.selectOption('#ic-class', 'c2'); await cekejKarty(p, 2, 'c2'); await p.waitForTimeout(150);
    const mala = (await panely(p)).kdo.h;
    ok(mala < a.panel / 2, 'velká třída: s dvěma žáky panel zase zmenší', Math.round(mala) + ' proti ' + a.panel);
    await p.selectOption('#ic-class', 'c1'); await cekejKarty(p, 40, 'c1'); await p.waitForTimeout(150);
    const zpet = await stav();
    ok(Math.abs(zpet.panel - a.panel) < 2 && zpet.rol <= 1, 'velká třída: po návratu na velkou třídu panel zase vyroste', JSON.stringify(zpet));
    /* ruční zmenšení výšky panel připne: drží výšku a obsah se v něm roluje */
    await zapniUpravu(p);
    await p.focus('[data-ic-panel=kdo] .ic-uchyt');
    for (let i = 0; i < 12; i++) await p.keyboard.press('Shift+ArrowUp');
    await p.waitForTimeout(150);
    const pripnuto = await stav();
    ok(pripnuto.panel < a.panel - 300 && pripnuto.rol > 100, 'připnutí: po Shift + šipce nahoru je panel nižší a obsah se v něm roluje', JSON.stringify(pripnuto));
    const dosazitelna = await p.evaluate(() => { const vn = document.querySelector('[data-ic-panel=kdo] .ic-vnitr'); vn.scrollTop = vn.scrollHeight; const k = vn.querySelectorAll('.ic-card'), kp = k[k.length - 1].getBoundingClientRect(), rr = vn.getBoundingClientRect(); return kp.bottom <= rr.bottom + 1 && kp.top >= rr.top - 1; });
    ok(dosazitelna, 'připnutí: poslední karta je po rolování dosažitelná');
    const uloz = JSON.parse(await ulozeno(p)).r['c1|hodina'];
    ok(uloz.kdo[3] > 0 && uloz.trida[3] === 0, 'připnutí: do úložiště jde výška jen u připnutého panelu (ostatní 0 = podle obsahu)', JSON.stringify(uloz));
    await p.evaluate(() => [...document.querySelectorAll('#ic-cards .ic-card')].slice(2).forEach(e => { e.style.display = 'none'; }));
    await p.waitForTimeout(200);
    const dvaZaci = (await panely(p)).kdo.h;
    ok(Math.abs(dvaZaci - pripnuto.panel) < 3, 'připnutí: připnutá výška se s menším obsahem nemění', Math.round(dvaZaci) + ' proti ' + pripnuto.panel);
    await p.evaluate(() => [...document.querySelectorAll('#ic-cards .ic-card')].forEach(e => { e.style.display = ''; }));
    await p.click('#ic-vychozi'); await p.waitForTimeout(200);
    const vych = await stav();
    ok(vych.rol <= 1 && Math.abs(vych.panel - a.panel) < 2, '„Výchozí rozložení“ vrátí výšku podle obsahu', JSON.stringify(vych));
    await ctx.close();
  },
  /* 12 — scénáře: výběr, pamatování po třídách, vlastní scénář, smazání */
  async scenare(br, base) {
    const { ctx, p, chyby } = await otevri(br, base);
    const moznosti = () => p.evaluate(() => ({ op: [...document.querySelectorAll('#ic-scenar option')].map(o => o.textContent), v: document.getElementById('ic-scenar').value }));
    let s = await moznosti();
    ok(s.op.join('|') === 'Samostatná práce|Týmový souboj' && s.v === 'hodina', 'scénáře: v nabídce Samostatná práce a Týmový souboj, výchozí je Samostatná práce', JSON.stringify(s));
    const vych = await panely(p);
    await p.selectOption('#ic-scenar', 'souboj'); await p.waitForTimeout(200);
    const sb = await panely(p);
    ok(!sb.trida && !!sb.kdo && !!sb.deje && prekryvy(sb).length === 0, 'scénáře: Týmový souboj schová Třídu dohromady a nic se nepřekrývá', Object.keys(sb).join() + ' ' + prekryvy(sb).join());
    ok(Math.abs(sb.deje.t - sb.kdo.t) < 2 && sb.deje.l > sb.kdo.r, 'scénáře: v Týmovém souboji stojí Děje se vedle Kdo hraje', JSON.stringify([sb.kdo.t, sb.deje.t]));
    ok(JSON.parse(await ulozeno(p)).a.c1 === 'souboj', 'scénáře: aktivní scénář třídy se uloží');
    await znovu(p);
    ok(await aktivni(p) === 'souboj' && !(await panely(p)).trida, 'scénáře: po obnovení stránky zůstane Týmový souboj', await aktivni(p));
    await p.selectOption('#ic-class', 'c2'); await cekejKarty(p, 2, 'c2'); await p.waitForTimeout(150);
    ok(await aktivni(p) === 'hodina' && !!(await panely(p)).trida, 'scénáře: jiná třída má vlastní aktivní scénář (Samostatná práce)', await aktivni(p));
    await p.selectOption('#ic-class', 'c1'); await cekejKarty(p, 6, 'c1'); await p.waitForTimeout(150);
    ok(await aktivni(p) === 'souboj', 'scénáře: po návratu na původní třídu se vrátí její scénář');
    await p.selectOption('#ic-scenar', 'hodina'); await p.waitForTimeout(150);
    const zpet = await panely(p);
    ok(Math.abs(zpet.trida.l - vych.trida.l) < 2 && Math.abs(zpet.kdo.w - vych.kdo.w) < 2, 'scénáře: zpět na Samostatnou práci se vrátí její rozložení', (zpet.trida.l - vych.trida.l).toFixed(1));
    await zapniUpravu(p);
    ok(await p.evaluate(() => document.getElementById('ic-smazat-sc').offsetParent === null) && await p.evaluate(() => document.getElementById('ic-ulozit-sc').offsetParent !== null), 'scénáře: u vestavěného scénáře je „Smazat“ schované, „Uložit jako scénář“ vidět');
    await p.focus('[data-ic-panel=trida] .ic-uchyt'); await p.keyboard.press('ArrowLeft');
    const upraveno = await panely(p);
    const jmeno = '<img src=x onerror=__xss=1>';
    p.once('dialog', d => d.accept(jmeno));
    await p.click('#ic-ulozit-sc'); await p.waitForTimeout(200);
    s = await moznosti();
    ok(s.op.length === 3 && s.op[2] === jmeno && s.v !== 'hodina' && s.v !== 'souboj', 'scénáře: nový scénář je v nabídce, vybraný, jeho jméno je jen text (bez HTML)', JSON.stringify(s));
    ok(await p.evaluate(() => window.__xss === undefined && !document.querySelector('#ic-scenar img')), 'scénáře: jméno scénáře s HTML se nevykoná');
    const idVlastni = s.v;
    ok(await p.evaluate(() => document.getElementById('ic-smazat-sc').offsetParent !== null), 'scénáře: u vlastního scénáře je „Smazat“ vidět');
    ok(Math.abs((await panely(p)).trida.l - upraveno.trida.l) < 2, 'scénáře: nový scénář začíná rozložením, které bylo zobrazené', ((await panely(p)).trida.l - upraveno.trida.l).toFixed(1));
    await znovu(p);
    ok(await aktivni(p) === idVlastni && Math.abs((await panely(p)).trida.l - upraveno.trida.l) < 2, 'scénáře: rozložení nového scénáře je uložené hned při vytvoření (přežije obnovení)', await aktivni(p) + ' ' + ((await panely(p)).trida.l - upraveno.trida.l).toFixed(1));
    await zapniUpravu(p);
    await p.focus('[data-ic-panel=trida] .ic-uchyt'); await p.keyboard.press('ArrowLeft');
    const vlastniRozlozeni = await panely(p);
    ok(vlastniRozlozeni.trida.l < upraveno.trida.l - 5, 'scénáře: úprava ve vlastním scénáři posune panel dál', (vlastniRozlozeni.trida.l - upraveno.trida.l).toFixed(1));
    await p.selectOption('#ic-scenar', 'hodina'); await p.waitForTimeout(150);
    ok(Math.abs((await panely(p)).trida.l - upraveno.trida.l) < 2, 'scénáře: úprava vlastního scénáře nezměnila Samostatnou práci', ((await panely(p)).trida.l - upraveno.trida.l).toFixed(1));
    await p.selectOption('#ic-scenar', idVlastni); await p.waitForTimeout(150);
    ok(Math.abs((await panely(p)).trida.l - vlastniRozlozeni.trida.l) < 2, 'scénáře: vlastní scénář si drží svou úpravu', ((await panely(p)).trida.l - vlastniRozlozeni.trida.l).toFixed(1));
    await znovu(p);
    s = await moznosti();
    ok(s.op.length === 3 && s.v === idVlastni, 'scénáře: vlastní scénář i jeho výběr přežijí obnovení stránky', JSON.stringify(s));
    await zapniUpravu(p);
    p.once('dialog', d => d.accept(jmeno.toUpperCase()));
    await p.click('#ic-ulozit-sc'); await p.waitForTimeout(200);
    ok((await moznosti()).op.length === 3 && /už existuje/.test(await p.evaluate(() => document.getElementById('toast').textContent)), 'scénáře: stejný název (jinou velikostí písmen) se odmítne s hláškou');
    p.once('dialog', d => d.dismiss());
    await p.click('#ic-ulozit-sc'); await p.waitForTimeout(100);
    ok((await moznosti()).op.length === 3, 'scénáře: zrušené zadání názvu nic nevytvoří');
    p.once('dialog', d => d.accept());
    await p.click('#ic-smazat-sc'); await p.waitForTimeout(200);
    s = await moznosti();
    const ul = JSON.parse(await ulozeno(p));
    ok(s.op.length === 2 && s.v === 'hodina' && !Object.keys(ul.r).some(k => k.endsWith('|' + idVlastni)), 'scénáře: smazání vlastního scénáře ho odstraní z nabídky i z úložiště a vrátí Samostatnou práci', JSON.stringify([s, Object.keys(ul.r)]));
    ok(chyby.length === 0, 'scénáře: žádná chyba JS', chyby.join(' | '));
    await ctx.close();
  },
  /* 13 — odebrání a vrácení panelu */
  async odebrani(br, base) {
    const { ctx, p, chyby } = await otevri(br, base);
    await zapniUpravu(p);
    const tl = await p.evaluate(() => [...document.querySelectorAll('.ic-odeber')].filter(e => e.offsetParent !== null).map(e => e.getAttribute('aria-label')));
    ok(tl.length === 3 && tl.every(t => /^Odebrat panel .+ z rozložení$/.test(t)), 'odebrání: u každého viditelného panelu je tlačítko ✕ s pojmenováním pro čtečku', JSON.stringify(tl));
    ok(await p.evaluate(() => document.getElementById('ic-pridat').offsetParent === null), 'odebrání: dokud nic není odebrané, nabídka „Přidat panel“ není');
    const pred = await panely(p);
    await p.focus('[data-ic-panel=deje] .ic-odeber'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    const po = await panely(p);
    ok(!po.deje && prekryvy(po).length === 0 && Math.abs((po.trida.t - po.kdo.t) - (pred.trida.t - pred.kdo.t)) < 2, 'odebrání: Enter na ✕ panel odebere, ostatní zůstanou bez překryvu a na místě', Object.keys(po).join());
    const nab = await p.evaluate(() => [...document.querySelectorAll('#ic-pridat option')].map(o => o.textContent));
    ok(nab.join('|') === '＋ Přidat panel…|Děje se', 'odebrání: odebraný panel je v nabídce „Přidat panel“', nab.join('|'));
    const uloz = JSON.parse(await ulozeno(p)).r['c1|hodina'];
    ok(uloz.deje.length === 5 && uloz.deje[4] === 0 && uloz.kdo.length === 4, 'odebrání: do úložiště jde jen odebraný panel s příznakem', JSON.stringify(uloz));
    await znovu(p);
    ok(!(await panely(p)).deje, 'odebrání: odebraný panel zůstane odebraný i po obnovení stránky');
    await zapniUpravu(p);
    await p.selectOption('#ic-pridat', 'deje'); await p.waitForTimeout(250);
    const zpet = await panely(p);
    ok(!!zpet.deje && prekryvy(zpet).length === 0 && Math.abs(zpet.deje.l - pred.deje.l) < 2, 'odebrání: vrácený panel stojí zase na svém místě, bez překryvu', JSON.stringify([zpet.deje && zpet.deje.l, pred.deje.l]));
    ok(await p.evaluate(() => document.getElementById('ic-pridat').offsetParent === null), 'odebrání: po vrácení všech panelů nabídka „Přidat panel“ zmizí');
    await p.selectOption('#ic-scenar', 'souboj'); await p.waitForTimeout(200);
    ok(!(await panely(p)).trida && await p.evaluate(() => [...document.querySelectorAll('#ic-pridat option')].some(o => o.textContent === 'Třída dohromady')), 'odebrání: v Týmovém souboji je Třída dohromady odebraná a jde přidat');
    await p.selectOption('#ic-pridat', 'trida'); await p.waitForTimeout(200);
    ok(!!(await panely(p)).trida, 'odebrání: Třídu jde do Týmového souboje přidat');
    await p.selectOption('#ic-scenar', 'hodina'); await p.waitForTimeout(150);
    await p.selectOption('#ic-scenar', 'souboj'); await p.waitForTimeout(200);
    ok(!!(await panely(p)).trida, 'odebrání: přidaný panel v Týmovém souboji zůstane po přepnutí tam a zpět');
    await p.click('#ic-vychozi'); await p.waitForTimeout(200);
    ok(!(await panely(p)).trida, '„Výchozí rozložení“ vrátí výchozí množinu panelů Týmového souboje');
    ok(chyby.length === 0, 'odebrání: žádná chyba JS', chyby.join(' | '));
    await ctx.close();
  },
  /* 14 — nabídka přepnutí při začátku týmového souboje */
  async nabidka(br, base) {
    const { ctx, p } = await otevri(br, base);
    ok(!await nabidkaVidet(p), 'nabídka: bez souboje není');
    await souboj(p, 'b1', 'active', ['b1']); await p.evaluate(() => icTymy()); await p.waitForTimeout(100);
    ok(await nabidkaVidet(p) && /Týmový souboj/.test(await p.evaluate(() => document.getElementById('ic-nabidka').textContent)), 'nabídka: při začátku týmového souboje se přepnutí nabídne');
    ok(await aktivni(p) === 'hodina', 'nabídka: scénář se sám NEPŘEPNE, jen se nabídne', await aktivni(p));
    await p.click('#ic-nab-ne'); await p.evaluate(() => icTymy());
    ok(!await nabidkaVidet(p), 'nabídka: „Ne, díky“ platí pro tento souboj (po další obnově se neukáže)');
    ok(await aktivni(p) === 'hodina', 'nabídka: po „Ne, díky“ zůstane Samostatná práce');
    await souboj(p, 'b1', 'finished', ['b2']); await souboj(p, 'b2', 'active', ['b2']); await p.evaluate(() => icTymy());
    ok(await p.evaluate(() => IC.bojId) === 'b2' && await nabidkaVidet(p), 'nabídka: další souboj ji nabídne znovu', await p.evaluate(() => IC.bojId));
    await p.click('#ic-nab-ano'); await p.waitForTimeout(200);
    ok(await aktivni(p) === 'souboj' && !await nabidkaVidet(p) && !(await panely(p)).trida, 'nabídka: „Přepnout“ přepne na Týmový souboj a nabídka zmizí', await aktivni(p));
    await souboj(p, 'b2', 'finished', ['b3']); await souboj(p, 'b3', 'active', ['b3']); await p.evaluate(() => icTymy());
    ok(!await nabidkaVidet(p), 'nabídka: v Týmovém souboji se nenabízí');
    await p.selectOption('#ic-scenar', 'hodina'); await p.waitForTimeout(150);
    ok(await nabidkaVidet(p), 'nabídka: po ručním návratu na Samostatnou práci během souboje se nabídne znovu');
    await souboj(p, 'b3', 'finished', []); await p.evaluate(() => icTymy());
    ok(!await nabidkaVidet(p), 'nabídka: po skončení souboje zmizí');
    await p.evaluate(() => { __db.stavyPodleId = { b4: { battle: { team_mode: false, status: 'active' }, teams: null, players: [] } }; __db.bitvy = [{ id: 'b4', game: 'RPG_MAT_8', status: 'active' }]; IC.bojId = null; });
    await p.evaluate(() => icTymy());
    ok(!await nabidkaVidet(p), 'nabídka: souboj bez týmového režimu ji nevyvolá');
    await ctx.close();
  },
  /* 11 — odchod ze záložky */
  async zalozka(br, base) {
    const { ctx, p } = await otevri(br, base);
    await zapniUpravu(p);
    const vysky = () => p.evaluate(() => icMr.rozlozeni().map(q => q.id + ':' + q.h).join());
    const pred = await vysky();
    await p.click('.tab[data-tab="overview"]');
    await p.waitForTimeout(250);
    const schovane = await vysky();
    ok(schovane === pred, 'záložka: schovaná záložka panely nesmrští (nevykreslený obsah se neměří)', pred + ' → ' + schovane);
    await p.click('.tab[data-tab="infocentrum"]');
    await p.waitForTimeout(150);
    const v = await p.evaluate(() => ({ tlac: document.getElementById('ic-uprav').getAttribute('aria-pressed'), uchyty: [...document.querySelectorAll('.ic-uchyt')].filter(e => e.offsetParent !== null).length }));
    ok(v.tlac === 'false' && v.uchyty === 0, 'záložka: po odchodu a návratu jsou úpravy zamčené', JSON.stringify(v));
    await ctx.close();
  },
};

async function beh(prepis, oddily) {
  const srv = await server(prepis), br = await chromium.launch(LAUNCH), base = baseOf(srv);
  const f0 = nalezy;
  try { for (const o of oddily) { try { await ODDILY[o](br, base); } catch (e) { nalezy++; if (hlasit) { fail++; console.log('  ❌ oddíl „' + o + '“ spadl — ' + String(e.message).split('\n')[0]); } } } }
  finally { await br.close(); srv.close(); }
  return nalezy - f0;
}

(async () => {
  console.log('\n── Infocentrum: pohyblivé panely ──\n');
  await beh(null, Object.keys(ODDILY));
  console.log('  skutečné panely: ' + (fail ? fail + ' nálezů' : 'bez nálezu') + ' (' + pass + ' kontrol)');
  ok(pass === PODLAHA, 'proběhl očekávaný počet kontrol', String(pass));
  const zivy = fail;

  const UCITEL = 'rpg-ucitel.html', MR = 'rpg-infocentrum-mrizka.js';
  const SAB = [
    ['bez panelové mřížky', UCITEL, s => s.replace('.ic-main.ic-mr{--ic-r:36px;--ic-g:12px;display:grid;', '.ic-main.ic-mr{--ic-r:36px;--ic-g:12px;display:block;'), ['vychozi']],
    ['úchyty jsou vidět i zamčené', MR, s => s.replace('const ukaz = jeUprava();', 'const ukaz = true;'), ['vychozi']],
    ['tažení se neukládá', MR, s => s.replace('const t = uklid(); uloz(); zprava(popis(rozlozeni.find(p => p.id === t.id)));', 'const t = uklid(); zprava(popis(rozlozeni.find(p => p.id === t.id)));'), ['uloziste']],
    ['klávesnice odpojená', MR, s => s.replace("uchyt.addEventListener('keydown', e => klavesnice(e, m.id));", ''), ['klavesnice']],
    ['jedno rozložení pro všechny třídy', MR, s => s.replace("const klicUloziste = (cid, scenar) => String(cid || '') + '|' + String(scenar || 'hodina');", "const klicUloziste = (cid, scenar) => 'x|' + String(scenar || 'hodina');"), ['uloziste']],
    ['projektor úpravy nevypne', MR, s => s.replace("return uprava && siroke() && !koren.closest('.ic-proj');", 'return uprava && siroke();'), ['projektor']],
    ['úzké okno s mřížkou', MR, s => s.replace("win.matchMedia('(min-width: 900px)').matches", "win.matchMedia('(min-width: 100px)').matches"), ['uzke']],
    ['odchod ze záložky nezamkne', UCITEL, s => s.replace("if(tab!=='infocentrum'){infoStop();icUprava(false);}", "if(tab!=='infocentrum'){infoStop();}"), ['zalozka']],
    ['schovaný panel zabírá místo', MR, s => s.replace("ID.filter(id => prvky[id] && !prvky[id].el.hidden && !vypnuty(id))", "ID.filter(id => prvky[id] && !vypnuty(id))"), ['vychozi', 'tymy']],
    ['nevykreslený obsah se měří jako prázdný', MR, s => s.replace(" && o.obsah.offsetHeight > 0) radky[id]", ") radky[id]"), ['zalozka']],
    ['scénář se nepamatuje', MR, s => s.replace("scenar = id; zapis(nastavAktivni(text(), cid, id));", "scenar = id;"), ['scenare']],
    ['odebrání panelu se neukládá', MR, s => s.replace("uplatni(kompaktuj(odeber(rozlozeni, id), viditelne())); uloz(); zmena();", "uplatni(kompaktuj(odeber(rozlozeni, id), viditelne())); zmena();"), ['odebrani']],
    ['nabídka přepne sama', UCITEL, s => s.replace("icMr.scenare().aktivni!=='souboj'&&IC.nabidkaBoj!==IC.bojId);", "icMr.scenare().aktivni!=='souboj'&&IC.nabidkaBoj!==IC.bojId);if(!box.hidden)icMr.prepniScenar('souboj');"), ['nabidka']],
    ['„Ne, díky“ platí jen na chvíli', UCITEL, s => s.replace("icEl('ic-nab-ne').onclick=()=>{IC.nabidkaBoj=IC.bojId;icNabidka();};", "icEl('ic-nab-ne').onclick=()=>{icNabidka();};"), ['nabidka']],
    ['vlastní scénář s cizím rozložením', MR, s => s.replace("zapis(ulozDoTextu(nastavAktivni(r.text, cid, id), klic, rozlozeni));", "zapis(nastavAktivni(r.text, cid, id));"), ['scenare']],
    ['výška se neřídí obsahem', MR, s => s.replace("rozlozeni = prizpusob(rozlozeni, radky);", ""), ['rolovani']],
    ['ruční výška se neukládá jako připnutá', MR, s => s.replace("const a = [p.x, p.y, p.w, p.a === false ? p.h : 0];", "const a = [p.x, p.y, p.w, 0];"), ['rolovani']],
    ['klávesnice bez věty pro čtečku', MR, s => s.replace('uplatni(nove); uloz(); zprava(popis(nove.find(p => p.id === id)));', 'uplatni(nove); uloz();'), ['klavesnice']],
  ];
  const fs = require('fs'), path = require('path');
  let chyceno = 0;
  hlasit = false;
  for (const [nazev, soubor, zmena, oddily] of SAB) {
    const cesta = path.join(__dirname, '..', 'projects', soubor), orig = fs.readFileSync(cesta, 'utf8'), nove = zmena(orig);
    if (nove === orig) { hlasit = true; ok(false, 'sabotáž „' + nazev + '“ se neaplikovala'); hlasit = false; continue; }
    const n = await beh({ [soubor]: () => nove }, oddily);
    if (n > 0) chyceno++;
    hlasit = true; ok(n > 0, 'sabotáž „' + nazev + '“ je chycena', 'nalezeno ' + n); hlasit = false;
  }
  hlasit = true;
  console.log('\n  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌   (sabotáže: ' + chyceno + ' z ' + SAB.length + ' chyceno)');
  process.exit(fail || zivy ? 1 : 0);
})().catch(e => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
