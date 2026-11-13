/* ═════════════════════════════════════════════════════════════════════════════
   Infocentrum, etapa 3 — panely Místnost souboje, Kde kdo je, Mapa misí a Čas (stopky, odpočet) v učitelské konzoli
   (`rpg-ucitel.html` + `projects/rpg-infocentrum.js`), Playwright, autor Vojtěch Konopa.

   Čisté výpočty (místnost, kde, mapa, stopky) hlídá Node test `rpg-infocentrum.test.cjs`; tady se kontroluje vykreslená
   stránka: co učitel na plátně skutečně vidí a jak panely ovládá (tlačítky, klávesnicí).

   Ověřuje se:
     1. Místnost: v Týmovém souboji nahoře přes celou šířku nad Týmy; kód, věta o otázce, ukazatel, „odpovědělo X z Y“
        (odpojení se nepočítají), odpočet otázky tiká sám mezi dotazy; čekárna, pauza, konec; obyčejný souboj bez týmů;
        v Samostatné práci se bez „Přidat panel“ neukáže; nepřátelský kód a čísla nic nerozbijí a nevykonají se
     2. Kde kdo je: počty podle obrazovky jen u hrajících, nehrající zvlášť, strop jmen s „+N“, jména jako text
     3. Mapa misí (čitelnost na nejsytějším pozadí: kontrast ≥ 4,5 : 1): 21 buněk s počty, „+n v hodině“ jen u misí splněných po začátku hodiny, základ hodiny se ukládá a čte
        nedůvěřivě, bublina se jmény, jména jako text
     4. Čas: stopky (start, pauza, nula), odpočet (předvolby, vlastní minuty, +1 min, konec), klávesnice, stav přežije
        obnovení stránky, rozbité úložiště dá výchozí stopky, čtečka (role timer, žádná živá oblast v čase)
     5. Přidání panelů tlačítkem „Přidat panel“ v úpravách
     6. Rozvržení: všech osm panelů na 1920 × 1080, v režimu projektoru, na 1366 × 768 a na telefonu 390 px — bez překryvu,
        bez přetečení, bez ořezu v panelech, písmo v nových panelech ≥ 12 px
     7. Odchod ze záložky zastaví i tikání hodin
   Sabotáže (19): viz seznam dole.
   Spusť: node tests/rpg-infocentrum-etapa3.test.cjs
   ═════════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { mock, server, baseOf } = require('./ic-konzole-mock.cjs');
const ROOT = path.join(__dirname, '..');
const LAUNCH = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };
const PODLAHA = 118;                                              // naměřeno

const sy = (() => { const d = new Date(); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; })();
const ted = () => new Date().toISOString(), davno = () => new Date(Date.now() - 3600e3).toISOString();
const done = (...m) => { const o = {}; for (const [mid, n] of m) for (let i = 0; i < n; i++) o[mid + '-' + i] = true; return o; };
const zak = (id, full, hero, data, updated) => ({ user_id: id, game: 'RPG_MAT_8', name: hero, email: id + '@husovaliberec.cz', full_name: full, updated_at: updated, data: Object.assign({ name: hero, xp: 100, level: 3, done: {}, ach: {} }, data) });
const SCENAR = {
  roles: [{ email: 'ucitel@husovaliberec.cz', role: 'teacher' }],
  session: { user: { id: 'u-uc', email: 'ucitel@husovaliberec.cz', user_metadata: { full_name: 'Učitel' } } },
  classes: [{ id: 'c1', name: 'Osmá B', section: 'B', cohort_start_year: sy - 2, archived: false }],
  members: ['z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7', 'z8', 'z9'].map(u => ({ class_id: 'c1', user_id: u })),
  saves: [
    zak('z1', 'Anna Nováková', 'Neo', { done: done(['1-1', 6]), cur: { s: 'boj', m: '1-1' } }, ted()),
    zak('z2', 'Adam Hrubý', 'Trinity', { done: done(['1-1', 6], ['1-2', 6]), cur: { s: 'boj', m: '1-2' } }, ted()),
    zak('z3', 'Barbora Lesná', 'Morpheus', { cur: { s: 'trenink', m: '1-2' } }, ted()),
    zak('z4', 'Čeněk Dvořák', 'Cypher', { cur: { s: 'teorie', m: '2-1' } }, ted()),
    zak('z5', 'Dana Pokorná', 'Switch', { cur: { s: 'mapa' } }, ted()),
    zak('z6', 'Emil Veselý', 'Tank', { cur: { s: 'vez' } }, ted()),
    zak('z7', 'Filip Malý', 'Dozer', { cur: { s: 'souboj' } }, ted()),
    zak('z8', null, '<img src=x onerror=window.__xss=1>', { cur: { s: 'boj', m: '1-1' } }, davno()),   // nehraje, ale s polohou: nesmí se započítat
    zak('z9', 'Gita Nová', 'Oracle', {}, ted()),                                                           // hraje, ale hra neposlala polohu
    zak('z10', 'Cizí Žák', 'Mimo', { done: done(['1-1', 6]), cur: { s: 'boj', m: '1-1' } }, ted()),      // není ve třídě
  ],
};

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

async function otevri(br, base, o) {
  o = o || {};
  const ctx = await br.newContext(Object.assign({ viewport: { width: o.w || 1920, height: o.h || 1080 } }, o.ctx || {}));
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(mock(SCENAR));
  if (o.ls) await ctx.addInitScript(zaklad => { for (const k of Object.keys(zaklad)) if (!sessionStorage.getItem('__seed_' + k)) { sessionStorage.setItem('__seed_' + k, '1'); localStorage.setItem(k, zaklad[k]); } }, o.ls);
  const p = await ctx.newPage(), chyby = [];
  p.setDefaultTimeout(9000);
  p.on('pageerror', e => chyby.push(e.message));
  await p.goto(base + '/projects/rpg-ucitel.html');
  await p.waitForFunction(() => !document.getElementById('console').classList.contains('hidden'), null, { timeout: 15000 });
  await p.click('.tab[data-tab="infocentrum"]');
  await p.waitForFunction(() => document.querySelectorAll('#ic-cards .ic-card').length === 9, null, { timeout: 10000 });
  await zastavDotazy(p);
  return { ctx, p, chyby };
}
/* obnovu postav a souboje řídí test, tikání hodin (odpočet, stopky) běží dál */
const zastavDotazy = p => p.evaluate(() => { clearInterval(IC.timer); IC.timer = null; clearInterval(IC.tymTimer); IC.tymTimer = null; });
const znovu = async p => { await p.reload(); await p.waitForFunction(() => !document.getElementById('console').classList.contains('hidden')); await p.click('.tab[data-tab="infocentrum"]'); await p.waitForFunction(() => document.querySelectorAll('#ic-cards .ic-card').length === 9); await zastavDotazy(p); };
const tik = async p => { await p.waitForFunction(() => !IC.bezi, null, { timeout: 8000 }); await p.evaluate(() => icTik(false)); };
const zmen = (p, uid, fn) => p.evaluate(([u, k]) => { const s = __db.saves.find(x => x.user_id === u); new Function('s', k)(s); s.updated_at = new Date().toISOString(); }, [uid, fn]);
const klice = (mid, n) => Array.from({ length: n }, (_, i) => `s.data.done['${mid}-${i}']=true;`).join('');
const pridej = (p, ...ids) => p.evaluate(a => a.forEach(id => icMr.pridejPanel(id)), ids);

/* souboj v `stavBitvy`; `u` doplní/přepíše pole battle, `hraci` nahradí hráče */
const souboj = (p, u, hraci, vsechno) => p.evaluate(([u2, hr, vse]) => {
  const t = Date.now(), iso = ms => new Date(t - ms).toISOString();
  const bat = Object.assign({ code: 'K7M2', team_mode: true, status: 'active', q_index: 3, q_count: 10, q_started_at: iso(5000) }, u2);
  const hraci2 = hr || [
    { team: 0, display_name: 'Anna Nováková', score: 900, correct_count: 5, last_qi: 3, last_seen: iso(0) },
    { team: 0, display_name: 'Tomáš Bílý', score: 1240, correct_count: 7, last_qi: 2, last_seen: iso(0) },
    { team: 0, display_name: 'Petr Starý', score: 300, correct_count: 2, last_qi: 3, last_seen: iso(65000) },       // odpojený (odpověděl, ale 65 s nic)
    { team: 1, display_name: 'Adam Hrubý', score: 2000, correct_count: 9, last_qi: 3, last_seen: iso(1000) },
    { team: 1, display_name: 'Eva Zelená', score: 100, correct_count: 1, last_qi: 1, last_seen: iso(0) }];
  __db.bitvy = [{ id: 'b1', game: 'RPG_MAT_8', status: 'active' }];
  __db.stavBitvy = vse ? vse : { battle: bat, teams: bat.team_mode ? { 0: 2440, 1: 2100 } : null, players: hraci2 };
}, [u, hraci || null, vsechno || null]).then(() => p.evaluate(() => icTymy()));
const panely = p => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#ic-grid [data-ic-panel]')].filter(e => !e.hidden && getComputedStyle(e).display !== 'none').map(e => { const b = e.getBoundingClientRect(); return [e.dataset.icPanel, { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }]; })));
const prekryvy = pn => { const k = Object.keys(pn), v = []; for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = pn[k[i]], b = pn[k[j]]; if (a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5) v.push(k[i] + '/' + k[j]); } return v; };
const txt = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim() : null; }, sel);
const viditelny = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && !e.hidden && e.offsetParent !== null && getComputedStyle(e).display !== 'none'; }, sel);
const cislo = s => { const m = /(\d+)/.exec(s || ''); return m ? Number(m[1]) : NaN; };

const ODDILY = {
  /* 1 — Místnost souboje */
  async mistnost(br, base, f) {
    const { ctx, p, chyby } = await otevri(br, base);
    ok(!await viditelny(p, '#ic-mistnost'), 'místnost: bez souboje panel není vidět');
    await p.selectOption('#ic-scenar', 'souboj'); await p.waitForTimeout(150);
    await souboj(p, {});
    const v = { kod: await txt(p, '#ic-kod'), veta: await txt(p, '#ic-motazka'), odp: await txt(p, '#ic-modp'), faze: await txt(p, '#ic-mfaze'), bar: await p.evaluate(() => document.getElementById('ic-mbar').style.width), cas: await txt(p, '#ic-mcas-s'), vid: await viditelny(p, '#ic-mistnost') };
    f(v.vid && v.kod === 'K7M2', 'místnost: v Týmovém souboji je nahoře vidět s kódem místnosti', JSON.stringify(v));
    f(v.veta === 'Otázka 4 z 10' && v.bar === '40%', 'místnost: věta „Otázka 4 z 10“ a ukazatel 40 %', JSON.stringify(v));
    f(/odpovědělo 2 z 4/.test(v.odp) && /5 hráčů v místnosti/.test(v.odp), 'místnost: odpovědělo 2 z 4 přítomných (odpojený Petr se nepočítá), v místnosti je 5 hráčů', v.odp);
    f(v.faze === 'týmový režim', 'místnost: štítek týmového režimu', v.faze);
    const sekundy = cislo(v.cas);
    f(sekundy >= 15 && sekundy <= 21, 'místnost: odpočet otázky ukazuje zbývající sekundy (otázka začala před 5 s z 25)', v.cas);
    const pn = await panely(p), root = await p.evaluate(() => document.getElementById('ic-grid').getBoundingClientRect().width);
    f(pn.mistnost && pn.tymy && pn.kdo && pn.deje && pn.mistnost.b <= pn.tymy.t + 1 && pn.tymy.b <= pn.kdo.t + 1 && pn.tymy.b <= pn.deje.t + 1 && pn.mistnost.t <= Math.min(pn.tymy.t, pn.kdo.t, pn.deje.t) + 1 && pn.mistnost.w / root > 0.97 && prekryvy(pn).length === 0, 'místnost: pruh je úplně nahoře přes celou šířku, pod ním Týmy a pod nimi Kdo hraje a Děje se (souboj začal po prázdné obrazovce), nic se nepřekrývá', JSON.stringify(Object.fromEntries(Object.entries(pn).map(([k, x]) => [k, [Math.round(x.t), Math.round(x.b), Math.round(x.w)]]))));
    const px = await p.evaluate(() => ({ kod: parseFloat(getComputedStyle(document.getElementById('ic-kod')).fontSize), veta: parseFloat(getComputedStyle(document.getElementById('ic-motazka')).fontSize), cas: parseFloat(getComputedStyle(document.getElementById('ic-mcas-s')).fontSize) }));
    f(px.kod >= 64 && px.veta >= 16 && px.cas >= 50, 'místnost: kód je v konzoli velký (≥ 64 px), věta ≥ 16 px, odpočet ≥ 50 px', JSON.stringify(px));
    /* odpočet tiká sám, bez dotazu na server */
    const pred = cislo(await txt(p, '#ic-mcas-s'));
    await p.waitForTimeout(1400);
    const po = cislo(await txt(p, '#ic-mcas-s'));
    f(po < pred && pred - po <= 3, 'místnost: odpočet otázky tiká sám i mezi dotazy na server', pred + ' → ' + po);
    /* čekárna, pauza, konec */
    await souboj(p, { status: 'lobby', q_index: -1, q_started_at: null });
    f(await txt(p, '#ic-motazka') === 'Čeká se na hráče' && !await viditelny(p, '#ic-mcas') && await p.evaluate(() => document.getElementById('ic-mbar').style.width) === '0%', 'místnost: v čekárně „Čeká se na hráče“, bez odpočtu, ukazatel prázdný');
    f(!/odpovědělo/.test(await txt(p, '#ic-modp')), 'místnost: v čekárně se nepíše, kolik odpovědělo');
    await souboj(p, { status: 'paused' });
    f(await txt(p, '#ic-motazka') === 'Pozastaveno · otázka 4 z 10' && !await viditelny(p, '#ic-mcas'), 'místnost: při pauze „Pozastaveno · otázka 4 z 10“ a bez odpočtu', await txt(p, '#ic-motazka'));
    await souboj(p, { status: 'finished', q_index: 9 });
    f(await txt(p, '#ic-motazka') === 'Souboj skončil' && await p.evaluate(() => document.getElementById('ic-mbar').style.width) === '100%' && !await viditelny(p, '#ic-mcas'), 'místnost: po skončení „Souboj skončil“, ukazatel plný, bez odpočtu');
    /* obyčejný souboj bez týmů */
    await souboj(p, { team_mode: false, status: 'active', q_index: 0, q_started_at: new Date(Date.now() - 1000).toISOString() });
    f(!await viditelny(p, '#ic-tymy') && await viditelny(p, '#ic-mistnost') && await txt(p, '#ic-kod') === 'K7M2' && await txt(p, '#ic-mfaze') === 'každý sám', 'místnost: u obyčejného souboje bez týmů se Týmy neukážou, Místnost ano', await txt(p, '#ic-mfaze'));
    f(await txt(p, '#ic-motazka') === 'Otázka 1 z 10', 'místnost: první otázka je „Otázka 1 z 10“', await txt(p, '#ic-motazka'));
    /* nepřátelská data */
    await souboj(p, { code: '<img src=x onerror=window.__xss3=1>' });
    f(await txt(p, '#ic-kod') === '—' && await p.evaluate(() => !window.__xss3 && !document.querySelector('#ic-mistnost img')), 'místnost: kód s HTML se nepřijme (ukáže se „—“) a nic se nevykoná', await txt(p, '#ic-kod'));
    await souboj(p, { code: ' ab3k ' });
    f(await txt(p, '#ic-kod') === 'AB3K', 'místnost: kód psaný malými písmeny s mezerami se opraví na AB3K', await txt(p, '#ic-kod'));
    await souboj(p, { q_count: 'x', q_index: null, q_started_at: 'zítra' }, null, null);
    f(await viditelny(p, '#ic-mistnost') && chyby.length === 0, 'místnost: nesmyslné q_count, q_index a čas nic nerozbijí', chyby.join('|'));
    await souboj(p, { q_count: 1e9, q_index: 4 });
    f(/z 100$/.test(await txt(p, '#ic-motazka')), 'místnost: nesmyslně velký počet otázek se ořízne na 100', await txt(p, '#ic-motazka'));
    await souboj(p, {}, null, { battle: { code: 'ZZZ9', status: 'active', team_mode: false, q_index: 1, q_count: 5 }, teams: null, players: 'nesmysl' });
    f(await txt(p, '#ic-kod') === 'ZZZ9' && await txt(p, '#ic-motazka') === 'Otázka 2 z 5' && chyby.length === 0, 'místnost: hráči jako text místo pole nic nerozbijí', chyby.join('|'));
    await ctx.close();
  },
  /* 1b — v Samostatné práci se Místnost bez přidání neukáže */
  async mistnostHodina(br, base, f) {
    const { ctx, p } = await otevri(br, base);
    await souboj(p, {});
    f(!await viditelny(p, '#ic-mistnost'), 'místnost: v Samostatné práci se ve výchozím stavu neukáže ani při běžícím souboji (panel je odebraný)');
    f(await viditelny(p, '#ic-tymy'), 'místnost: Týmy se v Samostatné práci ukážou jako dřív');
    await pridej(p, 'mistnost'); await p.waitForTimeout(150);
    f(await viditelny(p, '#ic-mistnost') && await txt(p, '#ic-kod') === 'K7M2', 'místnost: po „Přidat panel“ se ukáže i v Samostatné práci');
    const pn = await panely(p);
    f(prekryvy(pn).length === 0, 'místnost: v Samostatné práci se s ostatními nepřekrývá', prekryvy(pn).join());
    await ctx.close();
  },
  /* 2 — Kde kdo je */
  async kde(br, base, f) {
    const { ctx, p } = await otevri(br, base);
    await pridej(p, 'kde'); await p.waitForTimeout(150);
    const dl = () => p.evaluate(() => [...document.querySelectorAll('#ic-kde .ic-kt')].map(e => ({ typ: e.dataset.typ, n: Number(e.querySelector('b').textContent), nazev: e.querySelector('span').textContent, jm: e.querySelector('i') ? e.querySelector('i').textContent : '', nula: e.classList.contains('nula') })));
    let t = await dl();
    const typ = id => t.find(x => x.typ === id);
    f(typ('boj').n === 2 && typ('boj').jm === 'Adam H., Anna N.', 'kde: v boji jsou dva žáci (nehrající s polohou „boj“ se nepočítá), jména česky podle abecedy', JSON.stringify(typ('boj')));
    f(typ('trenink').n === 1 && typ('teorie').n === 1 && typ('mapa').n === 1 && typ('vez').n === 1 && typ('souboj').n === 1, 'kde: po jednom žáku v tréninku, v teorii, na mapě, ve Věži a v živém souboji', JSON.stringify(t.map(x => x.typ + ':' + x.n)));
    f(t.find(x => /místo neznámé/.test(x.nazev)).n === 1 && t.find(x => /nehraje/.test(x.nazev)).n === 1, 'kde: hrající bez polohy a nehrající jsou zvlášť', JSON.stringify(t.map(x => x.nazev + ':' + x.n)));
    f(t.length === 8, 'kde: šest míst + „místo neznámé“ + „nehraje“', String(t.length));
    f(await txt(p, '#ic-kdesum') === '8 z 9 hraje', 'kde: záhlaví „8 z 9 hraje“', await txt(p, '#ic-kdesum'));
    f(t.filter(x => x.n === 0).every(x => x.nula) && t.filter(x => x.n > 0).every(x => !x.nula), 'kde: prázdná místa jsou ztlumená');
    /* strop jmen: 10 žáků v jedné skupině */
    await p.evaluate(() => icKde(Array.from({ length: 10 }, (_, i) => ({ jmeno: 'Jméno' + i + ' P.', on: true, kde: { s: 'trenink', m: '1-1' } }))));
    t = await dl();
    f(typ('trenink').n === 10 && /\+4$/.test(typ('trenink').jm) && typ('trenink').jm.split(',').length === 6, 'kde: u 10 žáků ve skupině je vidět 6 jmen a „+4“', typ('trenink').jm);
    /* nepřátelské jméno */
    await zmen(p, 'z8', "s.data.cur={s:'mapa'};"); await tik(p);
    t = await dl();
    f(await p.evaluate(() => !window.__xss && !document.querySelector('#ic-kde img')) && /<img/.test(typ('mapa').jm), 'kde: jméno hrdiny s HTML je vidět jako text a nevykoná se', typ('mapa').jm);
    await ctx.close();
  },
  /* 3 — Mapa misí */
  async mapa(br, base, f) {
    const { ctx, p } = await otevri(br, base);
    await pridej(p, 'mapa'); await p.waitForTimeout(150);
    const bunky = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#ic-mapa .ic-ma-c')].map(e => [e.querySelector('small').textContent, { n: Number(e.querySelector('b').textContent), plus: e.querySelector('u').textContent, nove: e.classList.contains('nove'), nula: e.classList.contains('nula'), p: e.style.getPropertyValue('--p'), titul: e.title, aria: e.getAttribute('aria-label') }])));
    let b = await bunky();
    f(Object.keys(b).length === 21 && await p.evaluate(() => document.querySelectorAll('#ic-mapa .ic-ma-h').length === 7), 'mapa: 21 buněk (7 oblastí × 3 mise) a 7 záhlaví oblastí');
    f(b['1-1'].n === 2 && b['1-2'].n === 1 && b['2-1'].n === 0, 'mapa: počty splněných misí ve třídě (1-1: Anna a Adam, 1-2: Adam, 2-1: nikdo; žák mimo třídu se nepočítá)', JSON.stringify([b['1-1'].n, b['1-2'].n, b['2-1'].n]));
    f(Object.values(b).every(x => x.plus === '' && !x.nove), 'mapa: na začátku hodiny není nic „v hodině“');
    f(Number(b['1-1'].p) > 0.2 && Number(b['1-1'].p) <= 1 && Number(b['2-1'].p) === 0 && b['2-1'].nula && !b['1-1'].nula, 'mapa: podíl splněných (0 až 1) řídí sytost buňky, prázdná buňka je ztlumená', JSON.stringify([b['1-1'].p, b['2-1'].p]));
    f(/Mise 1-1 „.+“: splnilo 2 z 9/.test(b['1-1'].aria), 'mapa: popis pro čtečku má název mise a „splnilo 2 z 9“', b['1-1'].aria);
    f(await txt(p, '#ic-mapasum') === 'z 9 žáků', 'mapa: záhlaví „z 9 žáků“', await txt(p, '#ic-mapasum'));
    await zmen(p, 'z3', klice('1-1', 6)); await tik(p);
    b = await bunky();
    f(b['1-1'].n === 3 && /^\+1 v hodině$/.test(b['1-1'].plus) && b['1-1'].nove && /Barbora L\./.test(b['1-1'].titul), 'mapa: mise splněná po začátku hodiny je „+1 v hodině“, zvýrazněná a ve bublině je jméno', JSON.stringify(b['1-1']));
    f(b['1-2'].plus === '' && !b['1-2'].nove, 'mapa: ostatní mise zůstanou beze změny');
    f(await p.evaluate(() => { const l = JSON.parse(localStorage.getItem('RPG_INFOCENTRUM')); return !!l.zm && Object.keys(l.zm).length === 9 && l.zm['z1|RPG_MAT_8'].join() === '1-1' && l.zm['z3|RPG_MAT_8'].length === 0; }), 'mapa: základ hodiny po misích se ukládá v zařízení (z3 měla na začátku 0 misí)');
    await p.evaluate(() => icNova()); b = await bunky();
    f(b['1-1'].n === 3 && b['1-1'].plus === '' && !b['1-1'].nove, 'mapa: „Nová hodina“ vynuluje „v hodině“, počty zůstanou', JSON.stringify(b['1-1']));
    /* jména v bublině jako text */
    await zmen(p, 'z8', "s.data.done=" + JSON.stringify(done(['3-1', 6])) + ";"); await tik(p);
    b = await bunky();
    f(await p.evaluate(() => !window.__xss && !document.querySelector('#ic-mapa img')), 'mapa: jméno hrdiny s HTML se nevykoná ani nevykreslí');
    await ctx.close();
    /* uložený základ: nedůvěřivé čtení a použití po obnovení stránky */
    const zaklad = { cid: 'c1', game: 'RPG_MAT_8', start: Date.now() - 120000, zaklad: {}, cil: { stupen: 1, zaklad: 0, krok: 20 },
      zm: JSON.parse('{"z1|RPG_MAT_8":[],"z2|RPG_MAT_8":["1-1","1-2"],"__proto__":["1-1"],"z3|RPG_MAT_8":"nesmysl","x|RPG_MAT_2":["1-1"],"z4|RPG_MAT_8":["9-9","<img>",5,null,"2-1"],"|RPG_MAT_8":[],"ä|RPG_MAT_8":[]}') };
    const o2 = await otevri(br, base, { ls: { RPG_INFOCENTRUM: JSON.stringify(zaklad) } });
    await pridej(o2.p, 'mapa'); await o2.p.waitForTimeout(150);
    b = await o2.p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#ic-mapa .ic-ma-c')].map(e => [e.querySelector('small').textContent, { plus: e.querySelector('u').textContent, titul: e.title }])));
    f(/\+1 v hodině/.test(b['1-1'].plus) && /Anna N\./.test(b['1-1'].titul) && b['1-2'].plus === '', 'mapa: uložený základ hodiny se po obnovení použije (Anna podle něj 1-1 na začátku neměla, Adam ano)', JSON.stringify([b['1-1'], b['1-2']]));
    const klice2 = await o2.p.evaluate(() => Object.keys(IC.zm).sort());
    f(klice2.every(k => /^[A-Za-z0-9_-]{1,64}\|RPG_MAT_[3-9]$/.test(k)) && !klice2.some(k => /^__proto__|RPG_MAT_2/.test(k)) && await o2.p.evaluate(() => IC.zm['z4|RPG_MAT_8'].join() === '2-1' && Array.isArray(IC.zm['z3|RPG_MAT_8'])), 'mapa: nepřátelský uložený základ se očistí (jen platné klíče a mise, žádný __proto__)', klice2.join('|'));
    await o2.ctx.close();
  },
  /* 3b — čitelnost buněk mapy při plně splněné misi (nejsytější pozadí) */
  async mapaKontrast(br, base, f) {
    const { ctx, p } = await otevri(br, base);
    await pridej(p, 'mapa'); await p.waitForTimeout(150);
    for (const u of ['z3', 'z4', 'z5', 'z6', 'z7', 'z8', 'z9']) await zmen(p, u, klice('1-1', 6));
    await tik(p);
    const v = await p.evaluate(() => {
      const c = [...document.querySelectorAll('#ic-mapa .ic-ma-c')].find(e => e.querySelector('small').textContent === '1-1');
      const rgb = t => { const m = /^rgba?\(([^)]+)\)$/.exec(t); if (m) return m[1].split(/[ ,\/]+/).slice(0, 3).map(Number); const q = /^color\(srgb ([^)]+)\)$/.exec(t); return q ? q[1].split(/\s+/).slice(0, 3).map(x => Math.round(parseFloat(x) * 255)) : null; };
      return { bg: rgb(getComputedStyle(c).backgroundColor), raw: getComputedStyle(c).backgroundColor, p: c.style.getPropertyValue('--p'), n: c.querySelector('b').textContent, plus: c.querySelector('u').textContent, mala: rgb(getComputedStyle(c.querySelector('small')).color), cislo: rgb(getComputedStyle(c.querySelector('b')).color), plusB: rgb(getComputedStyle(c.querySelector('u')).color) };
    });
    const L = c => { const g = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * g(c[0]) + 0.7152 * g(c[1]) + 0.0722 * g(c[2]); };
    const kontrast = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    f(v.n === '9' && Number(v.p) === 1 && /^\+7 v hodině$/.test(v.plus) && !!v.bg, 'mapa: když mají misi všichni, je buňka nejsytější (podíl 1) a ukazuje 9 a „+7 v hodině“', JSON.stringify(v));
    if (v.bg) {
      f(kontrast(v.mala, v.bg) >= 4.5, 'mapa: popisek mise na nejsytějším pozadí má kontrast ≥ 4,5 : 1', kontrast(v.mala, v.bg).toFixed(2) + ' ' + v.raw);
      f(kontrast(v.cislo, v.bg) >= 4.5, 'mapa: počet na nejsytějším pozadí má kontrast ≥ 4,5 : 1', kontrast(v.cislo, v.bg).toFixed(2));
      f(kontrast(v.plusB, v.bg) >= 4.5, 'mapa: „+n v hodině“ na nejsytějším pozadí má kontrast ≥ 4,5 : 1', kontrast(v.plusB, v.bg).toFixed(2));
    }
    await ctx.close();
  },
  /* 4 — Čas */
  async cas(br, base, f) {
    const { ctx, p, chyby } = await otevri(br, base);
    await pridej(p, 'stopky'); await p.waitForTimeout(150);
    const st = () => p.evaluate(() => ({ cas: document.getElementById('ic-sp-cas').textContent, lbl: document.getElementById('ic-sp-lbl').textContent, stav: document.getElementById('ic-sp').dataset.stav, start: document.getElementById('ic-sp-start').textContent, startDis: document.getElementById('ic-sp-start').disabled, popis: document.getElementById('ic-sp-popis').textContent, pre: !document.getElementById('ic-sp-pre').hidden, plus: !document.getElementById('ic-sp-plus').hidden, nahoru: document.getElementById('ic-sp-r-nahoru').getAttribute('aria-pressed'), dolu: document.getElementById('ic-sp-r-dolu').getAttribute('aria-pressed') }));
    let s = await st();
    f(s.cas === '0:00' && s.lbl === 'uplynulo' && s.stav === 'stoji' && /Start/.test(s.start) && !s.pre && !s.plus && s.nahoru === 'true' && s.dolu === 'false', 'čas: na začátku stopky 0:00, stojí, předvolby odpočtu schované', JSON.stringify(s));
    await p.click('#ic-sp-start'); await p.waitForTimeout(1250);
    s = await st();
    f(s.stav === 'bezi' && /^0:0[1-2]$/.test(s.cas) && /Pauza/.test(s.start), 'čas: po Start stopky běží (0:01 až 0:02) a tlačítko se změní na Pauza', JSON.stringify(s));
    await p.click('#ic-sp-start'); const a1 = (await st()).cas; await p.waitForTimeout(1200); const a2 = (await st()).cas;
    f(a1 === a2 && (await st()).stav === 'stoji', 'čas: po Pauze čas stojí', a1 + ' / ' + a2);
    await p.click('#ic-sp-start'); await p.waitForTimeout(1100);
    f(cislo((await st()).cas.split(':')[1]) > cislo(a1.split(':')[1]), 'čas: po dalším Start stopky pokračují od zastaveného času', a1 + ' → ' + (await st()).cas);
    await p.click('#ic-sp-nula'); s = await st();
    f(s.cas === '0:00' && s.stav === 'stoji', 'čas: Nula vrátí 0:00 a zastaví', JSON.stringify(s));
    /* odpočet */
    await p.click('#ic-sp-r-dolu'); s = await st();
    f(s.cas === '10:00' && s.lbl === 'zbývá' && s.pre && s.plus && s.dolu === 'true' && s.nahoru === 'false' && s.stav === 'stoji', 'čas: režim Odpočet ukáže 10:00, předvolby a +1 min, ještě nebězí', JSON.stringify(s));
    await p.click('#ic-sp-pre [data-min="5"]'); await p.waitForTimeout(300); s = await st();
    f(s.stav === 'bezi' && /^(4:5\d|5:00)$/.test(s.cas) && s.popis === 'odpočet 5 min', 'čas: předvolba 5 min nastaví a hned spustí odpočet', JSON.stringify(s));
    await p.click('#ic-sp-plus'); s = await st();
    f(/^5:5\d$|^6:00$/.test(s.cas) && s.popis === 'odpočet 6 min', 'čas: +1 min prodlouží odpočet na 6 minut', JSON.stringify(s));
    await p.fill('#ic-sp-min', '3'); await p.click('#ic-sp-spust'); s = await st();
    f(s.popis === 'odpočet 3 min' && /^(2:5\d|3:00)$/.test(s.cas), 'čas: vlastní počet minut (3) spustí odpočet 3 min', JSON.stringify(s));
    const pred = s.popis;
    for (const zle of ['0', '181', '-4', '']) {
      await p.fill('#ic-sp-min', zle); await p.click('#ic-sp-spust');
    }
    s = await st();
    f(s.popis === pred && await p.evaluate(() => document.activeElement.id === 'ic-sp-min'), 'čas: nesmyslné minuty (0, 181, −4, text, prázdné) odpočet nezmění a vrátí pozornost do pole', JSON.stringify(s));
    await p.fill('#ic-sp-min', '2'); await p.press('#ic-sp-min', 'Enter'); s = await st();
    f(s.popis === 'odpočet 2 min', 'čas: Enter v poli minut odpočet spustí', s.popis);
    /* konec odpočtu */
    await p.evaluate(() => { IC.stopky = { rezim: 'dolu', bezi: true, od: Date.now() - 59400, nahrano: 0, cil: 60000 }; });
    await p.waitForTimeout(900); s = await st();
    f(s.stav === 'konec' && s.cas === '0:00' && s.lbl === 'čas vypršel' && s.startDis, 'čas: po uplynutí odpočtu „čas vypršel“, stav konec, Start je vypnutý', JSON.stringify(s));
    const barva = await p.evaluate(() => getComputedStyle(document.getElementById('ic-sp-cas')).color);
    f(barva === 'rgb(255, 93, 127)', 'čas: po konci je čas červený', barva);
    f(await p.evaluate(() => document.getElementById('ic-live').textContent === 'Čas vypršel.'), 'čas: čtečka obrazovky se o konci dozví jednou větou');
    await p.click('#ic-sp-nula'); s = await st();
    f(s.stav === 'stoji' && s.cas === '1:00' && !s.startDis, 'čas: Nula po konci odpočet vrátí na jeho délku (1 min) a znovu povolí Start', JSON.stringify(s));
    /* klávesnice a čtečka */
    await p.click('#ic-sp-r-nahoru'); await p.focus('#ic-sp-start'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    f((await st()).stav === 'bezi', 'čas: tlačítko Start jde ovládat klávesnicí (Enter)');
    await p.keyboard.press('Enter');
    const ct = await p.evaluate(() => ({ role: document.getElementById('ic-sp-cas').getAttribute('role'), live: document.querySelectorAll('#ic-sp [aria-live], #ic-sp [role=status], #ic-sp [role=alert]').length, tl: [...document.querySelectorAll('#ic-sp button')].filter(b => b.offsetParent !== null).map(b => Math.round(b.getBoundingClientRect().height)) }));
    f(ct.role === 'timer' && ct.live === 0, 'čas: čas má roli timer a nemá živou oblast (čtečka by jinak četla každou sekundu)', JSON.stringify(ct));
    f(ct.tl.every(h => h >= 36), 'čas: tlačítka jsou aspoň 36 px vysoká', ct.tl.join());
    /* stav přežije obnovení stránky */
    await p.click('#ic-sp-nula'); await p.click('#ic-sp-r-dolu'); await p.click('#ic-sp-pre [data-min="15"]'); await p.waitForTimeout(1100);
    await znovu(p); await p.waitForTimeout(250);
    s = await st();
    f(s.stav === 'bezi' && s.popis === 'odpočet 15 min' && /^14:5\d$/.test(s.cas), 'čas: běžící odpočet přežije obnovení stránky a počítá se dál podle hodin', JSON.stringify(s));
    await p.click('#ic-sp-start');
    const ul = await p.evaluate(() => JSON.parse(localStorage.getItem('RPG_INFOCENTRUM_STOPKY')));
    f(ul.v === 1 && ul.rezim === 'dolu' && ul.bezi === false && ul.cil === 900000 && ul.nahrano > 0, 'čas: v zařízení je uložen jen stav stopek (verze, režim, běží, cíl, uplynulo)', JSON.stringify(ul));
    f(chyby.length === 0, 'čas: žádná chyba stránky', chyby.join('|'));
    await ctx.close();
    /* nepřátelské úložiště */
    for (const [jm, txt2] of [['rozbitý JSON', '{{{'], ['číslo místo objektu', '5'], ['špatná verze', '{"v":2,"rezim":"dolu","bezi":true,"od":1,"nahrano":0,"cil":60000}'],
      ['text místo čísel', '{"v":1,"rezim":"dolu","bezi":true,"od":"x","nahrano":"y","cil":"z"}'], ['obrovský cíl', '{"v":1,"rezim":"dolu","bezi":false,"od":0,"nahrano":0,"cil":1e99}'],
      ['záporný čas', '{"v":1,"rezim":"nahoru","bezi":true,"od":-5,"nahrano":-9,"cil":60000}'], ['běží z budoucnosti', '{"v":1,"rezim":"nahoru","bezi":true,"od":' + (Date.now() + 9e8) + ',"nahrano":0,"cil":60000}'],
      ['neznámý režim', '{"v":1,"rezim":"__proto__","bezi":false,"od":0,"nahrano":5000,"cil":60000}']]) {
      const o = await otevri(br, base, { ls: { RPG_INFOCENTRUM_STOPKY: txt2 } });
      await pridej(o.p, 'stopky'); await o.p.waitForTimeout(150);
      const v = await o.p.evaluate(() => ({ cas: document.getElementById('ic-sp-cas').textContent, stav: document.getElementById('ic-sp').dataset.stav, nan: /NaN|undefined|Infinity/.test(document.getElementById('ic-sp').textContent) }));
      f(!v.nan && v.cas === (jm === 'neznámý režim' ? '0:05' : '0:00') && v.stav === 'stoji', 'čas: rozbité úložiště „' + jm + '“ dá použitelné stopky bez NaN (stojí, výchozí čas)', JSON.stringify(v));
      f(o.chyby.length === 0, 'čas: rozbité úložiště „' + jm + '“ nevyhodí chybu', o.chyby.join('|'));
      await o.ctx.close();
    }
  },
  /* 5 — přidání panelů přes nabídku */
  async nabidka(br, base, f) {
    const { ctx, p } = await otevri(br, base);
    f(await p.evaluate(() => document.getElementById('ic-pridat').hidden), 'nabídka: mimo úpravy není „Přidat panel“ vidět');
    await p.click('#ic-uprav');
    const moznosti = await p.evaluate(() => [...document.getElementById('ic-pridat').options].map(o => o.value + ':' + o.textContent));
    f(moznosti.join('|') === ':＋ Přidat panel…|mistnost:Místnost souboje|kde:Kde kdo je|mapa:Mapa misí|stopky:Čas', 'nabídka: v úpravách Samostatné práce nabízí čtyři nové panely', moznosti.join('|'));
    f(!await p.evaluate(() => document.getElementById('ic-pridat').hidden), 'nabídka: v úpravách je „Přidat panel“ vidět');
    for (const id of ['kde', 'mapa', 'stopky', 'mistnost']) { await p.selectOption('#ic-pridat', id); await p.waitForTimeout(120); }
    const pn = await panely(p);
    f(['kde', 'mapa', 'stopky'].every(id => pn[id]) && prekryvy(pn).length === 0, 'nabídka: přidané panely jsou vidět a nepřekrývají se', Object.keys(pn).join() + ' ' + prekryvy(pn).join());
    f(await p.evaluate(() => document.getElementById('ic-pridat').hidden), 'nabídka: když už nic nechybí, „Přidat panel“ zmizí');
    f(await p.evaluate(() => document.querySelectorAll('.ic-odeber').length === 8 && [...document.querySelectorAll('.ic-uchyt')].filter(e => e.offsetParent !== null).length === 6), 'nabídka: každý z osmi panelů má tlačítko ✕ a úchyt (šest z nich je vidět: Týmy a Místnost čekají na souboj)');
    await p.click('[data-ic-panel="stopky"] .ic-odeber'); await p.waitForTimeout(120);
    f(!(await panely(p)).stopky && await p.evaluate(() => [...document.getElementById('ic-pridat').options].some(o => o.value === 'stopky')), 'nabídka: ✕ odebere Čas a ten se vrátí do nabídky');
    const ul = await p.evaluate(() => JSON.parse(localStorage.getItem('RPG_INFOCENTRUM_ROZLOZENI')).r['c1|hodina']);
    f(ul.stopky.length === 5 && ul.stopky[4] === 0 && ul.kde.length === 4 && ul.mapa.length === 4, 'nabídka: rozložení se uloží (odebraný panel s pátým prvkem 0)', JSON.stringify(ul));
    await ctx.close();
  },
  /* 6 — rozvržení všech osmi panelů */
  async rozvrzeni(br, base, f) {
    const mer = async (p, jm, opt) => {
      opt = opt || {};
      await souboj(p, {});
      await p.waitForTimeout(250);
      const pn = await panely(p), r = await p.evaluate(() => {
        const root = document.getElementById('ic-root'), nove = ['ic-mistnost', 'ic-kde', 'ic-mapa', 'ic-sp'].map(i => document.getElementById(i).closest('[data-ic-panel]') || document.getElementById(i));
        const mala = [], orez = [];
        for (const pan of document.querySelectorAll('[data-ic-panel="mistnost"],[data-ic-panel="kde"],[data-ic-panel="mapa"],[data-ic-panel="stopky"]')) {
          if (getComputedStyle(pan).display === 'none') continue;
          const w = document.createTreeWalker(pan, NodeFilter.SHOW_TEXT);
          for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const e = n.parentElement; if (e.offsetParent === null) continue; const px = parseFloat(getComputedStyle(e).fontSize); if (px < 12) mala.push(pan.dataset.icPanel + ':' + n.textContent.trim().slice(0, 14) + ':' + px); }
          const v = pan.querySelector('.ic-vnitr'); if (v && v.scrollWidth > v.clientWidth + 1) orez.push(pan.dataset.icPanel + ' do šířky ' + (v.scrollWidth - v.clientWidth));
          for (const e of pan.querySelectorAll('.ic-ma-c b, .ic-kt b, #ic-kod, #ic-sp-cas, #ic-mcas-s')) if (e.offsetParent !== null && e.scrollWidth > e.clientWidth + 1) orez.push(pan.dataset.icPanel + ' ' + (e.id || e.tagName) + ' ' + (e.scrollWidth - e.clientWidth));
        }
        return { mala, orez, sirka: document.documentElement.scrollWidth - innerWidth, koren: root.scrollWidth - root.clientWidth };
      });
      f(Object.keys(pn).length === 8 || (opt.pod && Object.keys(pn).length === 8), jm + ': všech osm panelů je vidět', Object.keys(pn).join());
      if (!opt.pod) f(prekryvy(pn).length === 0, jm + ': panely se nepřekrývají', prekryvy(pn).join());
      f(r.sirka <= 1 && r.koren <= 1, jm + ': stránka nepřetéká do šířky', JSON.stringify([r.sirka, r.koren]));
      f(r.mala.length === 0, jm + ': písmo v nových panelech je aspoň 12 px', r.mala.slice(0, 5).join(' | '));
      f(r.orez.length === 0, jm + ': nic v nových panelech není ořezané do šířky', r.orez.join(' | '));
      return pn;
    };
    {
      const { ctx, p } = await otevri(br, base);
      await pridej(p, 'mistnost', 'kde', 'mapa', 'stopky'); await p.waitForTimeout(150);
      await zmen(p, 'z3', klice('1-1', 6)); await tik(p);
      await mer(p, '1920 × 1080');
      await p.click('#ic-full');
      await p.waitForFunction(() => document.getElementById('ic-root').classList.contains('ic-proj'), null, { timeout: 4000 }).catch(() => {});
      await mer(p, 'projektor');
      const kodPx = await p.evaluate(() => parseFloat(getComputedStyle(document.getElementById('ic-kod')).fontSize));
      f(kodPx >= 100, 'projektor: kód místnosti má aspoň 100 px (čte se z konce třídy)', String(kodPx));
      await ctx.close();
    }
    {
      const { ctx, p } = await otevri(br, base, { w: 1366, h: 768 });
      await pridej(p, 'mistnost', 'kde', 'mapa', 'stopky'); await p.waitForTimeout(150);
      await mer(p, '1366 × 768');
      await ctx.close();
    }
    {
      const { ctx, p } = await otevri(br, base, { w: 390, h: 844, ctx: { isMobile: true, hasTouch: true } });
      await pridej(p, 'mistnost', 'kde', 'mapa', 'stopky'); await p.waitForTimeout(150);
      await mer(p, 'telefon 390 px', { pod: true });
      const mapa = await p.evaluate(() => ({ w: document.getElementById('ic-mapa').getBoundingClientRect().width, b: [...document.querySelectorAll('#ic-mapa .ic-ma-c')].map(e => e.getBoundingClientRect().width) }));
      f(mapa.b.length === 21 && Math.min(...mapa.b) >= 30, 'telefon 390 px: buňky mapy misí jsou aspoň 30 px široké', JSON.stringify([mapa.w, Math.min(...mapa.b)]));
      const tl = await p.evaluate(() => [...document.querySelectorAll('#ic-sp button')].filter(b => b.offsetParent !== null).map(b => Math.round(b.getBoundingClientRect().height)));
      f(tl.every(h => h >= 44), 'telefon 390 px: tlačítka času jsou aspoň 44 px (dotyk)', tl.join());
      await ctx.close();
    }
  },
  /* 7 — odchod ze záložky */
  async odchod(br, base, f) {
    const { ctx, p } = await otevri(br, base);
    f(await p.evaluate(() => IC.hodTimer !== null && IC.hodTimer !== undefined), 'odchod: v záložce tikají hodiny (odpočet, stopky)');
    await p.click('.tab[data-tab="overview"]'); await p.waitForTimeout(200);
    f(await p.evaluate(() => IC.hodTimer === null && IC.timer === null && IC.tymTimer === null), 'odchod: po odchodu ze záložky se zastaví i tikání hodin');
    await ctx.close();
  },
};

/* sabotáže: každá musí shodit aspoň jednu kontrolu v uvedených oddílech */
const SAB = [
  ['kód místnosti bez ověření', 'rpg-infocentrum.js', s => s.replace('kod: RE_KOD.test(kodTxt) ? kodTxt : \'\'', 'kod: kodTxt'), ['mistnost'], /kód s HTML/],
  ['Místnost je v registru až na konci', 'rpg-infocentrum-mrizka.js', s => s.replace("    { id: 'mistnost', nazev: 'Místnost souboje', x: 0, y: 0,  w: 12, h: 5,  minW: 4, minH: 4 },\n", '').replace("{ id: 'stopky',   nazev: 'Čas',              x: 8, y: 29, w: 4,  h: 8,  minW: 3, minH: 6 },", "{ id: 'stopky',   nazev: 'Čas',              x: 8, y: 29, w: 4,  h: 8,  minW: 3, minH: 6 },\n    { id: 'mistnost', nazev: 'Místnost souboje', x: 0, y: 0,  w: 12, h: 5,  minW: 4, minH: 4 },"), ['mistnost'], /úplně nahoře/],
  ['mapa: šedý popisek na zeleném pozadí', 'rpg-ucitel.html', s => s.replace('.ic-ma-c small{display:block;font-size:12px;color:#dfe8f7;', '.ic-ma-c small{display:block;font-size:12px;color:var(--muted);'), ['mapaKontrast'], /popisek mise/],
  ['mapa: sytost až 42 %', 'rpg-ucitel.html', s => s.replace('calc(var(--p)*28%)', 'calc(var(--p)*42%)'), ['mapaKontrast'], /kontrast/],
  ['odpočet otázky netiká mezi dotazy', 'rpg-ucitel.html', s => s.replace('function icHodiny(){icMistCas();icStopkyKresli();}', 'function icHodiny(){icStopkyKresli();}'), ['mistnost'], /tiká sám/],
  ['odpovědělo počítá i odpojené', 'rpg-infocentrum.js', s => s.replace("const zive = hraci.filter(p => pripojen(p, faze === 'finished', nejnovejsi));", 'const zive = hraci;'), ['mistnost'], /odpovědělo 2 z 4/],
  ['Místnost jen pro týmové souboje', 'rpg-infocentrum.js', s => s.replace('if (!faze) return null;', 'if (!faze || !b.team_mode) return null;'), ['mistnost'], /obyčejného souboje/],
  ['Místnost se v čekárně tváří, že běží otázka', 'rpg-infocentrum.js', s => s.replace("if (m.faze === 'lobby') return { veta: 'Čeká se na hráče', podil: 0 };", ''), ['mistnost'], /Čeká se na hráče/],
  ['kde počítá i nehrající', 'rpg-infocentrum.js', s => s.replace('if (!h || !h.on) { nehraje++; continue; }', 'if (!h) { nehraje++; continue; }'), ['kde'], /nehrající s polohou/],
  ['kde jména přes innerHTML', 'rpg-ucitel.html', s => s.replace("i.textContent=jmena.join(', ')+(dalsi?' +'+dalsi:'')", "i.innerHTML=jmena.join(', ')+(dalsi?' +'+dalsi:'')"), ['kde'], /jako text/],
  ['kde bez stropu jmen', 'rpg-infocentrum.js', s => s.replace('s.jmena = s.jmena.slice(0, max); });', '});'), ['kde'], /6 jmen/],
  ['mapa ignoruje základ hodiny', 'rpg-infocentrum.js', s => s.replace('if (b && b.indexOf(mid) < 0) nove.push(s.jmeno);', 'nove.push(s.jmeno);'), ['mapa'], /začátku hodiny není nic|v hodině/],
  ['základ misí se neukládá', 'rpg-ucitel.html', s => s.replace('zaklad:IC.zaklad,zm:IC.zm,cil:IC.cil', 'zaklad:IC.zaklad,cil:IC.cil'), ['mapa'], /ukládá v zařízení|uložený základ/],
  ['uložený základ misí bez kontroly', 'rpg-ucitel.html', s => s.replace('IC.zm=RPGInfo.ocistiZakladMise(ulozeno.zm);', 'IC.zm=ulozeno.zm||{};'), ['mapa'], /očistí|nepřátelský/],
  ['pauza nezastaví čas', 'rpg-infocentrum.js', s => s.replace("else if (akce === 'pauza') zastav();", "else if (akce === 'pauza') { }"), ['cas'], /Pauze/],
  ['stopky se neukládají', 'rpg-ucitel.html', s => s.replace('function icStopkyPis(){try{', 'function icStopkyPis(){return;try{'), ['cas'], /přežije obnovení/],
  ['konec odpočtu beze změny stavu', 'rpg-infocentrum.js', s => s.replace("stav: zbyva === 0 ? 'konec' : s.bezi ? 'bezi' : 'stoji'", "stav: s.bezi ? 'bezi' : 'stoji'"), ['cas'], /čas vypršel/],
  ['rozbité úložiště stopek se přijme', 'rpg-infocentrum.js', s => s.replace('if (nahrano === null || cil === null || cil < 60000) return s;', ''), ['cas'], /rozbité úložiště/],
  ['hodiny běží i mimo záložku', 'rpg-ucitel.html', s => s.replace('if(IC.hodTimer){clearInterval(IC.hodTimer);IC.hodTimer=null;}', ''), ['odchod'], /tikání hodin/],
];

async function spust(br, base, jmena) {
  const nalezy = [];
  for (const j of jmena) {
    const f = (c, m, d) => { if (!c) nalezy.push(m + (d ? ' — ' + d : '')); };
    try { await ODDILY[j](br, base, f); } catch (e) { nalezy.push('oddíl ' + j + ' spadl: ' + String(e.message).split('\n')[0]); }
  }
  return nalezy;
}

(async () => {
  const br = await chromium.launch(LAUNCH);
  const srv = await server();
  console.log('\n── Infocentrum, etapa 3: Místnost, Kde kdo je, Mapa misí, Čas ──\n');
  /* skutečný běh: výsledky oddílů se počítají do pass/fail přes globální ok (f = ok) */
  for (const j of Object.keys(ODDILY)) {
    try { await ODDILY[j](br, baseOf(srv), ok); } catch (e) { ok(false, 'oddíl ' + j + ' spadl', String(e.message).split('\n')[0]); }
  }
  console.log('  skutečná konzole: ' + (fail ? fail + ' nálezů' : 'bez nálezu') + ' (' + (pass + fail) + ' kontrol)');
  ok(pass + fail >= PODLAHA, 'proběhl očekávaný počet kontrol (aspoň ' + PODLAHA + ')', String(pass + fail));
  srv.close();

  /* sabotáže */
  const zdroj = {}; for (const s of ['rpg-ucitel.html', 'rpg-infocentrum.js', 'rpg-infocentrum-mrizka.js']) zdroj[s] = fs.readFileSync(path.join(ROOT, 'projects', s), 'utf8');
  for (const [jm, soubor, zmena, oddily, rx] of SAB) {
    const nove = zmena(zdroj[soubor]);
    ok(nove !== zdroj[soubor], 'sabotáž „' + jm + '“ se aplikovala');
    if (nove === zdroj[soubor]) continue;
    const s = await server({ [soubor]: zmena });
    const nalezy = await spust(br, baseOf(s), oddily);
    ok(nalezy.some(n => rx.test(n)), 'sabotáž „' + jm + '“ je chycena', nalezy[0] || 'prošla bez nálezu');
    s.close();
  }
  await br.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})();
