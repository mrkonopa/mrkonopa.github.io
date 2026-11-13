/* ══════════════════════════════════════════════════════════════════════
   Infocentrum hodiny v učitelské konzoli (`rpg-ucitel.html`, záložka INFOCENTRUM) — Playwright, autor Vojtěch Konopa.

   Napodobenina cloudu drží tabulky v paměti (`window.__db`), test mezi načteními mění postavy žáků a ZAVOLÁ obnovu přímo
   (`icTik`), takže se nečeká na 6s časovač.

   Ověřuje se:
     1. načítání: jen členové vybrané třídy a jen vybraná hra, bez počtů chyb (`errs`) i v dotazu; další obnova bere jen změněné řádky
     2. karty: zkrácená jména („Anna N.“), jméno hrdiny jako záloha, žádné HTML ze jména žáka (XSS), žádná slova o chybách na plátně
     3. řazení: kdo v hodině splnil víc úkolů a misí, je nahoře; karta ukazuje přírůstek (+6 úkolů · 1 mise)
     4. události: splněná mise = obyčejný řádek, dokončená oblast = zlatý řádek a mírný efekt na kartě (třída boss)
     5. cíl hodiny: po splnění stupně další stupeň a animace přes obrazovku (STUPEŇ 2; pod „omezit pohyb“ bez konfet)
     6. týmy: z živého souboje v týmovém režimu skóre a jména obou týmů, bez týmového režimu panel zmizí
     7. celá obrazovka a telefon: nic nepřetéká do šířky (1920 × 1080 v režimu projektoru, 390 px)
     8. chyba načtení: stavový štítek zčervená, karty zůstanou; „Nová hodina“ vynuluje přírůstky; po obnovení stránky se hodina a stupeň zachovají
     9. odchod ze záložky zastaví časovač (konzole nesmí v pozadí dál dotazovat server)
   Sabotáže (7): řazení podle abecedy, chyby v dotazu, jména přes innerHTML, obnova bez „jen změněné“, časovač neběží do konce,
   cíl bez animace, týmy bez ohledu na režim.
   Spusť: node tests/rpg-infocentrum-konzole.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
/* Snímky a měření jen z NESABOTOVANÉHO běhu (jinak by je přepsal sabotovaný, KONTROLY #121): po skutečném běhu se `dir` vynuluje. */
const SNIM = { dir: process.env.SNIMEK || null };
const PODLAHA = 73;                                               // naměřeno
const LAUNCH = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const sy = (() => { const d = new Date(); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; })();
const ted = () => new Date().toISOString(), davno = () => new Date(Date.now() - 3600e3).toISOString();
const done = (...m) => { const o = {}; for (const [mid, n] of m) for (let i = 0; i < n; i++) o[mid + '-' + i] = true; return o; };
const zak = (id, full, hero, data, updated) => ({ user_id: id, game: 'RPG_MAT_8', name: hero, email: id + '@husovaliberec.cz', full_name: full, updated_at: updated, data: Object.assign({ name: hero, xp: 100, level: 3, done: {}, ach: {}, errs: { '1-1': 9 } }, data) });
const SCENAR = {
  roles: [{ email: 'ucitel@husovaliberec.cz', role: 'teacher' }],
  session: { user: { id: 'u-uc', email: 'ucitel@husovaliberec.cz', user_metadata: { full_name: 'Učitel' } } },
  classes: [{ id: 'c1', name: 'Osmá B', section: 'B', cohort_start_year: sy - 2, archived: false }],
  members: ['z1', 'z2', 'z3', 'z4', 'z5', 'z6'].map(u => ({ class_id: 'c1', user_id: u })),
  saves: [
    zak('z1', 'Anna Nováková', 'Neo', { level: 5, done: done(['1-1', 6], ['1-2', 3]), ach: { boot: 1 } }, ted()),
    zak('z2', 'Adam Hrubý', 'Trinity', { level: 4, done: done(['1-1', 2]) }, ted()),
    zak('z3', 'Barbora Lesná', 'Morpheus', {}, davno()),
    zak('z4', 'Čeněk Dvořák', 'Cypher', { cur: { s: 'boj', m: '1-1' } }, davno()),     // offline, ale s polohou: nesmí se ukázat
    zak('z5', 'Dana Pokorná', 'Switch', {}, davno()),
    zak('z6', null, '<img src=x onerror=window.__xss=1>', {}, davno()),
    zak('z7', 'Cizí Žák', 'Mimo', { done: done(['1-1', 6]) }, ted()),          // není ve třídě — nesmí se vůbec číst
  ],
};

const { mock, server, baseOf } = require('./ic-konzole-mock.cjs');

async function otevri(br, base, volby) {
  const ctx = await br.newContext(Object.assign({ viewport: { width: 1920, height: 1080 } }, volby || {}));
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(mock(SCENAR));
  const p = await ctx.newPage(), chyby = [];
  p.on('pageerror', e => chyby.push(e.message));
  await p.goto(base + '/projects/rpg-ucitel.html');
  await p.waitForFunction(() => !document.getElementById('console').classList.contains('hidden'), null, { timeout: 15000 });
  await p.click('.tab[data-tab="infocentrum"]');
  await p.waitForFunction(() => document.querySelectorAll('#ic-cards .ic-card').length === 6, null, { timeout: 10000 });
  await p.evaluate(() => infoStop());                                 // obnovu řídí test, ne časovač
  return { ctx, p, chyby };
}
const tik = async p => { await p.waitForFunction(() => !IC.bezi, null, { timeout: 8000 }); await p.evaluate(() => icTik(false)); };
const zmen = (p, uid, fn) => p.evaluate(([u, k]) => { const s = __db.saves.find(x => x.user_id === u); new Function('s', k)(s); s.updated_at = new Date().toISOString(); }, [uid, fn]);
const klice = (mid, n) => Array.from({ length: n }, (_, i) => `s.data.done['${mid}-${i}']=true;`).join('');

const ODDILY = {
  /* 1 + 2 — načítání a karty */
  async data(p, f) {
    const log = await p.evaluate(() => __db.log.filter(l => l.table === 'saves' && /xp:data->xp/.test(l.sel)));
    f(log.length >= 1, 'infocentrum si vyžádalo postavy přes lehký dotaz', String(log.length));
    const l0 = log[0] || { f: [], sel: '' };
    const ids = (l0.f.find(x => x[0] === 'in') || [0, 0, []])[2];
    f(ids.slice().sort().join() === 'z1,z2,z3,z4,z5,z6', 'čtou se jen členové třídy (ne žák mimo třídu)', ids.join());
    f(JSON.stringify(l0.f.find(x => x[0] === 'eq')) === '["eq","game","RPG_MAT_8"]', 'čte se jen vybraná hra (8. ročník podle kohorty třídy)', JSON.stringify(l0.f));
    f(!/errs|chyb/i.test(l0.sel), 'dotaz nežádá počty chyb', l0.sel);
    f(!l0.f.some(x => x[0] === 'gt'), 'první načtení bere všechno');
    await zmen(p, 'z2', klice('1-1', 6)); await tik(p);
    const l1 = await p.evaluate(() => __db.log.filter(l => l.table === 'saves' && /xp:data->xp/.test(l.sel)).pop());
    f(l1.f.some(x => x[0] === 'gt' && x[1] === 'updated_at'), 'další obnova bere jen změněné řádky (updated_at >)', JSON.stringify(l1.f));
    const jm = await p.evaluate(() => [...document.querySelectorAll('#ic-cards .ic-nm')].map(e => e.textContent).sort());
    f(jm.includes('Anna N.') && jm.includes('Čeněk D.') && jm.includes('Adam H.'), 'jména na kartách jsou zkrácená („Anna N.“)', jm.join('|'));
    f(!jm.some(x => /Nováková|Hrubý|Dvořák/.test(x)), 'celé příjmení se na plátně neukazuje');
    const main = await p.evaluate(() => document.querySelector('#ic-root .ic-main').textContent);
    f(!/chyb|errs/i.test(main), 'na plátně nejsou slova o chybách');
  },
  async xss(p, f) {
    const v = await p.evaluate(() => ({ img: document.querySelectorAll('#ic-cards img, #ic-feed img').length, x: window.__xss, text: [...document.querySelectorAll('#ic-cards .ic-nm')].map(e => e.textContent).join('|') }));
    f(v.img === 0 && v.x === undefined, 'jméno hrdiny s HTML se nevykoná ani nevykreslí', JSON.stringify(v));
    f(v.text.includes('<img '), 'jméno s HTML je vidět jako text', v.text);
  },
  /* 3 — řazení */
  async poradi(p, f) {
    await zmen(p, 'z4', klice('1-1', 6)); await zmen(p, 'z5', klice('1-1', 2)); await tik(p);
    const por = await p.evaluate(() => IC.poradi.join());
    f(por.startsWith('z4,z5,'), 'nahoře je ten, kdo v hodině splnil nejvíc úkolů (6, pak 2)', por);
    f(por === 'z4,z5,z6,z2,z1,z3', 'zbylí s nulou jdou abecedně česky („<img O.“, Adam, Anna, Barbora)', por);
    const t = await p.evaluate(() => document.querySelector('#ic-cards [data-k="z4"] .ic-gain b').textContent.replace(/ /g, ' '));
    f(/\+6 úkolů · 1 mise/.test(t), 'karta ukazuje přírůstek „+6 úkolů · 1 mise“', t);
    const prvni = await p.evaluate(() => document.querySelector('#ic-cards [data-k="z4"]').style.order);
    f(prvni === '0', 'karta prvního má pořadí 0 (CSS order)', prvni);
  },
  /* 4 — události */
  async oblast(p, f) {
    await zmen(p, 'z3', klice('1-1', 6) + klice('1-2', 6) + klice('1-3', 6)); await tik(p);
    const v = await p.evaluate(() => ({ ev: [...document.querySelectorAll('#ic-feed .ic-ev')].map(e => e.className + '|' + e.textContent.replace(/ /g, ' ')), boss: document.querySelector('#ic-cards [data-k="z3"]').classList.contains('boss') }));
    f(v.ev.some(x => /^ic-ev oblast\|.*Barbora L\. — dokončena oblast 1!/.test(x)), 'dokončená oblast = zlatý řádek v přehledu', v.ev.join(' ; '));
    f(!v.ev.some(x => /Barbora L\. — mise/.test(x)), 'dokončená oblast nahradí události jejích misí');
    f(v.boss, 'karta má při dokončené oblasti mírný zlatý efekt (třída boss)');
    await zmen(p, 'z5', klice('2-1', 6)); await tik(p);
    const m = await p.evaluate(() => [...document.querySelectorAll('#ic-feed .ic-ev')].map(e => e.textContent.replace(/ /g, ' ')));
    f(m.some(x => /Dana P\. — mise 2-1 .*splněna/.test(x)), 'splněná mise je obyčejný řádek s názvem mise', m.join(' ; '));
    f(!m.some(x => /(dokonči|splni|získa)l/i.test(x)), 'věty bez slovesa v minulém čase (rod ze jména neznáme)');
  },
  /* 5 — cíl */
  async cil(p, f) {
    await zmen(p, 'z1', klice('2-1', 6) + klice('2-2', 6) + klice('2-3', 6) + klice('3-1', 6) + klice('3-2', 6)); await tik(p);
    const v = await p.evaluate(() => ({ on: document.getElementById('ic-lv').classList.contains('on'), h: document.getElementById('ic-lvh').textContent, st: IC.cil.stupen, px: document.querySelectorAll('#ic-lv .ic-px').length }));
    f(v.on && v.h === 'STUPEŇ 2' && v.st === 2, 'po splnění cíle se přehraje animace „STUPEŇ 2“', JSON.stringify(v));
    f(v.px > 0, 'animace má konfety (bez omezení pohybu)', String(v.px));
  },
  async cilBezPohybu(p, f) {
    await zmen(p, 'z1', klice('2-1', 6) + klice('2-2', 6) + klice('2-3', 6) + klice('3-1', 6) + klice('3-2', 6)); await tik(p);
    const v = await p.evaluate(() => ({ on: document.getElementById('ic-lv').classList.contains('on'), px: document.querySelectorAll('#ic-lv .ic-px').length }));
    f(v.on && v.px === 0, 'pod „omezit pohyb“ je animace bez konfet', JSON.stringify(v));
  },
  /* 6 — týmy: velký panel nad kartami, u hráče skóre, správné a stav odpovědi */
  async tymy(p, f) {
    const teď = Date.now(), iso = ms => new Date(teď - ms).toISOString();
    await p.evaluate(([t0, t1, t2]) => {
      __db.bitvy = [{ id: 'b1', game: 'RPG_MAT_8', status: 'active' }];
      __db.stavBitvy = { battle: { team_mode: true, status: 'active', q_index: 3 }, teams: { 0: 5120, 1: 4380 }, players: [
        { team: 0, display_name: 'Anna Nováková', score: 900, correct_count: 5, last_qi: 2, last_seen: t0 },
        { team: 0, display_name: 'Tomáš Bílý', score: 1240, correct_count: 7, last_qi: 3, last_seen: t0 },
        { team: 0, display_name: 'Petr Starý', score: 300, correct_count: 2, last_qi: 1, last_seen: t2 },
        { team: 1, display_name: 'Adam Hrubý', score: 2000, correct_count: 9, last_qi: 3, last_seen: t1 },
        { team: null, display_name: 'Host', score: 5, correct_count: 0, last_qi: 3, last_seen: t0 }] };
    }, [iso(0), iso(2000), iso(65000)]);
    await p.evaluate(() => icTymy());
    const v = await p.evaluate(() => {
      const radky = id => [...document.querySelectorAll('#' + id + ' .ic-tr')].map(r => ({ cls: r.className.replace('ic-tr', '').trim(), txt: r.textContent.replace(/\s+/g, ' ').trim(), jm: r.querySelector('.ic-tj').textContent }));
      return { hid: document.getElementById('ic-tymy').hidden, a: document.getElementById('ic-t1').textContent, b: document.getElementById('ic-t2').textContent, m: radky('ic-tn1'), c: radky('ic-tn2'), h1: document.getElementById('ic-tp1').textContent, h2: document.getElementById('ic-tp2').textContent };
    });
    f(!v.hid && v.a === '5120' && v.b === '4380', 'týmy: panel se ukáže se skóre obou týmů', JSON.stringify([v.hid, v.a, v.b]));
    f(v.m.map(r => r.jm).join() === 'Tomáš B.,Anna N.,Petr S.' && v.c.map(r => r.jm).join() === 'Adam H.', 'týmy: hráči řazeni podle skóre v týmu (ne abecedně), host bez týmu nikam nepatří', JSON.stringify([v.m.map(r => r.jm), v.c.map(r => r.jm)]));
    f(/1\s?240/.test(v.m[0].txt.replace(/\u00a0/g, ' ')) && /7\s?✓/.test(v.m[0].txt), 'týmy: u hráče je skóre a počet správných', v.m[0].txt);
    f(v.m[0].cls === 'odp' && v.m[1].cls === 'mysli' && v.c[0].cls === 'odp', 'týmy: kdo už odpověděl na tuto otázku (last_qi = q_index) a kdo ještě přemýšlí', JSON.stringify([v.m.map(r => r.cls), v.c.map(r => r.cls)]));
    f(v.m[2].cls === 'off', 'týmy: hráč, který se neozval 65 s před ostatními, je odpojený', JSON.stringify(v.m.map(r => r.cls)));
    f(v.h1 === 'odpovědělo 1 / 2' && v.h2 === 'odpovědělo 1 / 1', 'týmy: v záhlaví týmu kolik z přítomných odpovědělo (odpojení se nepočítají)', v.h1 + ' | ' + v.h2);
    /* čekárna: nikdo „nepřemýšlí“ ani „neodpověděl“ */
    await p.evaluate(() => { __db.stavBitvy.battle.status = 'lobby'; __db.stavBitvy.battle.q_index = -1; __db.stavBitvy.players.forEach(x => { x.last_qi = -1; }); });
    await p.evaluate(() => icTymy());
    const w = await p.evaluate(() => ({ cls: [...document.querySelectorAll('#ic-tn1 .ic-tr, #ic-tn2 .ic-tr')].map(r => r.className.replace('ic-tr', '').trim()), h: document.getElementById('ic-tp1').textContent }));
    f(w.cls.filter(c => c !== 'off').every(c => c === 'ceka') && w.h === '', 'týmy: v čekárně se nikdo netváří, že odpovídá', JSON.stringify(w));
    /* skončený souboj zůstane vidět, ale hledá se nový; nový ukáže své hráče */
    await p.evaluate(() => {
      const fin = JSON.parse(JSON.stringify(__db.stavBitvy)); fin.battle.status = 'finished';
      const nov = JSON.parse(JSON.stringify(__db.stavBitvy)); nov.battle.status = 'active'; nov.battle.q_index = 0; nov.players = [{ team: 0, display_name: 'Nová Hráčka', score: 10, correct_count: 1, last_qi: 0, last_seen: new Date().toISOString() }];
      __db.stavyPodleId = { b1: fin, b2: nov }; __db.bitvy = []; IC.bojId = 'b1';
    });
    await p.evaluate(() => icTymy());
    f(await p.evaluate(() => !document.getElementById('ic-tymy').hidden && document.querySelectorAll('#ic-tn1 .ic-tr').length === 3 && IC.bojFaze === 'finished'), 'týmy: skončený souboj zůstane na plátně, dokud neběží jiný');
    await p.evaluate(() => { __db.bitvy = [{ id: 'b2', game: 'RPG_MAT_8', status: 'active' }]; });
    await p.evaluate(() => icTymy());
    const n = await p.evaluate(() => ({ id: IC.bojId, jm: [...document.querySelectorAll('#ic-tn1 .ic-tj')].map(e => e.textContent) }));
    f(n.id === 'b2' && n.jm.join() === 'Nová H.', 'týmy: po skončení souboje se najde nový běžící (dřív zůstal viset starý)', JSON.stringify(n));
    await p.evaluate(() => { __db.stavyPodleId = null; __db.stavBitvy = { battle: { team_mode: false }, teams: null, players: [] }; });
    await p.evaluate(() => icTymy());
    f(await p.evaluate(() => document.getElementById('ic-tymy').hidden), 'bez týmového režimu panel týmů zmizí');
  },
  /* 6b — týmy: velký panel na projektoru i na telefonu, nepřátelská jména, strop řádků */
  async tymyVelke(p, f) {
    await p.evaluate(() => {
      const hraci = [];
      for (let i = 0; i < 15; i++) hraci.push({ team: 0, display_name: 'Žák Modrý' + i + ' Dlouhéjménopříjmení', score: 1000 + i, correct_count: i, last_qi: i % 2 ? 3 : 2, last_seen: new Date().toISOString() });
      for (let i = 0; i < 15; i++) hraci.push({ team: 1, display_name: i ? 'Žák Červený' + i + ' Příjmení' : '<img src=x onerror=window.__xss2=1> Zlý', score: 900 + i, correct_count: i, last_qi: 3, last_seen: new Date().toISOString() });
      __db.bitvy = [{ id: 'b1', game: 'RPG_MAT_8', status: 'active' }];
      __db.stavBitvy = { battle: { team_mode: true, status: 'active', q_index: 3 }, teams: { 0: 15000, 1: 13500 }, players: hraci };
    });
    await p.evaluate(() => icTymy());
    const mer = () => p.evaluate(() => {
      const pn = document.getElementById('ic-tymy'), root = document.getElementById('ic-root'), pr = pn.getBoundingClientRect(), rr = root.getBoundingClientRect();
      const karta = document.querySelector('#ic-cards .ic-card'), jm = document.querySelector('#ic-tn1 .ic-tj');
      return { sirka: pr.width / rr.width, nad: !karta || pr.bottom <= karta.getBoundingClientRect().top + 1, pismo: parseFloat(getComputedStyle(jm).fontSize), pretec: root.scrollWidth - root.clientWidth, doc: document.documentElement.scrollWidth - innerWidth, pravy: Math.round(pr.right), iw: innerWidth, vyska: Math.round(pr.height), rol: Math.max(0, pn.querySelector('.ic-vnitr').scrollHeight - pn.querySelector('.ic-vnitr').clientHeight), sloupcu: new Set([...document.querySelectorAll('#ic-tn1 .ic-tr')].map(r => Math.round(r.getBoundingClientRect().left))).size, sirkaTk: Math.round(document.querySelector('#ic-tn1').getBoundingClientRect().width), radek: Math.round(document.querySelector('#ic-tn1 .ic-tr').getBoundingClientRect().height), lis: [...document.querySelectorAll('#ic-tymy .ic-tj')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length };
    });
    const a = await mer();
    f(a.sirka > 0.95 && a.nad, 'velký panel týmů: přes celou šířku a nad kartami žáků', JSON.stringify(a));
    f(a.pismo >= 18, 'velký panel týmů: jména hráčů mají čitelné písmo (dřív 13 px)', String(a.pismo));
    f(a.pretec <= 1 && a.doc <= 1 && a.lis === 0, 'velký panel týmů: 30 hráčů s dlouhými jmény nepřetéká do šířky (1920 × 1080)', JSON.stringify(a));
    f(a.vyska <= 600, 'velký panel týmů: výchozí panel nezabere víc než ~půl obrazovky (1080 px)', JSON.stringify(a));
    f(a.rol <= 1, 'velký panel týmů: 30 hráčů se do výchozího panelu vejde bez rolování', JSON.stringify(a));
    f(await p.evaluate(() => !window.__xss2 && !document.querySelector('#ic-tymy img') && [...document.querySelectorAll('#ic-tn2 .ic-tj')].some(e => e.textContent.startsWith('<img'))), 'velký panel týmů: nepřátelské jméno se ukáže jako text a nevykoná se');
    if (SNIM.dir) await p.screenshot({ path: path.join(SNIM.dir, 'tymy-konzole.png') });
    await p.click('#ic-full');
    await p.waitForFunction(() => document.getElementById('ic-root').classList.contains('ic-proj'), null, { timeout: 4000 }).catch(() => {});
    const pr = await mer();
    if (SNIM.dir) await p.screenshot({ path: path.join(SNIM.dir, 'tymy-projektor.png') });
    if (SNIM.dir) console.log('  [měření] konzole ' + JSON.stringify(a) + '\n  [měření] projektor ' + JSON.stringify(pr));
    f(pr.pretec <= 1 && pr.doc <= 1 && pr.pismo >= 18 && pr.vyska <= 600 && pr.rol <= 1, 'velký panel týmů: v režimu projektoru bez přetečení, bez rolování a s velkým písmem', JSON.stringify(pr));
    await p.evaluate(() => { if (document.fullscreenElement) return document.exitFullscreen(); document.getElementById('ic-root').classList.remove('ic-proj'); });
    await p.waitForFunction(() => !document.getElementById('ic-root').classList.contains('ic-proj'), null, { timeout: 4000 }).catch(() => {});
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);
    const t = await mer();
    if (SNIM.dir) await p.screenshot({ path: path.join(SNIM.dir, 'tymy-telefon.png') });
    f(t.pretec <= 1 && t.doc <= 1 && t.lis === 0 && t.pravy <= t.iw + 1, 'velký panel týmů: na telefonu 390 px nic nepřesahuje okno', JSON.stringify(t));
    await p.setViewportSize({ width: 1920, height: 1080 });
    /* strop: stav s tisíci „hráči“ nezaplaví plátno */
    await p.evaluate(() => { const h = []; for (let i = 0; i < 500; i++) h.push({ team: 0, display_name: 'Hráč ' + i, score: i, correct_count: 0, last_qi: 0, last_seen: new Date().toISOString() }); __db.stavBitvy.players = h; });
    await p.evaluate(() => icTymy());
    const r = await p.evaluate(() => document.querySelectorAll('#ic-tn1 .ic-tr').length);
    f(r === 40, 'velký panel týmů: nejvýš 40 řádků na tým', String(r));
  },
  /* 7 — rozvržení */
  async rozvrzeni(p, f) {
    await p.click('#ic-full');
    await p.waitForFunction(() => document.getElementById('ic-root').classList.contains('ic-proj'), null, { timeout: 4000 }).catch(() => {});
    const v = await p.evaluate(() => ({ proj: document.getElementById('ic-root').classList.contains('ic-proj'), sw: document.documentElement.scrollWidth, iw: innerWidth, ovl: getComputedStyle(document.getElementById('ic-ovl')).display, r: document.getElementById('ic-root').scrollWidth - document.getElementById('ic-root').clientWidth }));
    f(v.proj && v.ovl === 'none', 'režim projektoru schová ovládání', JSON.stringify(v));
    f(v.sw <= v.iw && v.r <= 1, 'celá obrazovka 1920 × 1080 nepřetéká do šířky', JSON.stringify(v));
    await p.evaluate(() => { if (document.fullscreenElement) return document.exitFullscreen(); document.getElementById('ic-root').classList.remove('ic-proj'); });
    await p.waitForFunction(() => !document.getElementById('ic-root').classList.contains('ic-proj'), null, { timeout: 4000 }).catch(() => {});
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);
    const t = await p.evaluate(() => { const r = document.getElementById('ic-root').getBoundingClientRect(); const pre = [...document.querySelectorAll('#t-infocentrum .ic-card, #t-infocentrum .ic-panel')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length; return { pre, right: Math.round(r.right), iw: innerWidth }; });
    f(t.pre === 0, 'na telefonu 390 px nic z infocentra nepřesahuje okno', JSON.stringify(t));
    await p.setViewportSize({ width: 1920, height: 1080 });
  },
  /* 8 — chyba, nová hodina, obnova stránky */
  async chyba(p, f) {
    await p.evaluate(() => { __db.selze = true; });
    await tik(p);
    const v = await p.evaluate(() => ({ zle: document.getElementById('ic-stav').classList.contains('zle'), karet: document.querySelectorAll('#ic-cards .ic-card').length }));
    f(v.zle && v.karet === 6, 'při chybě načtení štítek zčervená a karty zůstanou', JSON.stringify(v));
    await p.evaluate(() => { __db.selze = false; });
    await tik(p);
    f(!(await p.evaluate(() => document.getElementById('ic-stav').classList.contains('zle'))), 'po obnovení spojení štítek zase zezelená');
  },
  async nova(p, f) {
    await zmen(p, 'z4', klice('1-1', 6)); await tik(p);
    f((await p.evaluate(() => document.querySelector('#ic-cards [data-k="z4"] .ic-gain b').textContent)).startsWith('+'), 'před novou hodinou má žák přírůstek');
    await p.click('#ic-nova');
    const v = await p.evaluate(() => ({ b: document.querySelector('#ic-cards [data-k="z4"] .ic-gain b').textContent, feed: document.querySelectorAll('#ic-feed .ic-ev').length, gv: document.getElementById('ic-gv').textContent }));
    f(v.b === '—' && v.feed === 0 && v.gv === '0', '„Nová hodina“ vynuluje přírůstky, události i cíl', JSON.stringify(v));
  },
  async obnova(p, f) {
    await zmen(p, 'z1', klice('2-1', 6) + klice('2-2', 6) + klice('2-3', 6) + klice('3-1', 6) + klice('3-2', 6)); await tik(p);
    const pred = await p.evaluate(() => ({ start: IC.start, st: IC.cil.stupen }));
    await p.reload();
    await p.waitForFunction(() => !document.getElementById('console').classList.contains('hidden'), null, { timeout: 15000 });
    await p.click('.tab[data-tab="infocentrum"]');
    await p.waitForFunction(() => document.querySelectorAll('#ic-cards .ic-card').length === 6, null, { timeout: 10000 });
    await p.evaluate(() => infoStop());
    const po = await p.evaluate(() => ({ start: IC.start, st: IC.cil.stupen }));
    f(po.start === pred.start && po.st === pred.st && pred.st === 2, 'po obnovení stránky se zachová začátek hodiny i stupeň', JSON.stringify([pred, po]));
  },
  /* 10 — kde žák právě je (`cur`): jen u hrajících, jen ověřený tvar, nic nevykonat */
  async kde(p, f) {
    const l0 = await p.evaluate(() => __db.log.filter(l => l.table === 'saves' && /xp:data->xp/.test(l.sel))[0]);
    f(l0 && /cur:data->cur/.test(l0.sel) && !/errs|chyb/i.test(l0.sel), 'dotaz žádá pole cur a pořád ne počty chyb', l0 && l0.sel);
    await zmen(p, 'z1', "s.data.cur={s:'boj',m:'2-1'};");
    await zmen(p, 'z2', "s.data.cur={s:'<img src=x onerror=window.__xss=1>',m:'<b>'};");
    await tik(p);
    const v = await p.evaluate(() => { const c = u => document.querySelector('#ic-cards [data-k="' + u + '"] .ic-last'); return {
      z1: c('z1').textContent, z1t: c('z1').title, z2: c('z2').textContent, z2t: c('z2').title, z4: c('z4').textContent,
      img: document.querySelectorAll('#ic-cards img').length, x: window.__xss, cards: document.getElementById('ic-cards').textContent }; });
    f(v.z1 === 'boj 2-1 · LV 5', 'hrající žák: karta ukáže, kde je („boj 2-1 · LV 5“)', v.z1);
    f(/^Boj v misi 2-1/.test(v.z1t), 'tooltip má celou větu s misí', v.z1t);
    f(/^LV 4 · před /.test(v.z2) && v.z2t === '', 'nepřátelské cur se zahodí (zbyde „LV · před …“, bez tooltipu)', v.z2 + ' | ' + v.z2t);
    f(v.img === 0 && v.x === undefined, 'cur s HTML se nevykoná ani nevykreslí', JSON.stringify([v.img, v.x]));
    f(v.z4 === 'právě nehraje', 'nehrající žák polohu nemá (stará poloha neplatí)', v.z4);
    f(!/chyb|errs/i.test(v.cards), 'na kartách žádná slova o chybách');
  },
  /* 9 — časovač */
  async stop(p, f) {
    await p.evaluate(() => icZacni());
    f(await p.evaluate(() => IC.timer !== null), 'časovač po otevření záložky běží');
    await p.click('.tab[data-tab="overview"]');
    f(await p.evaluate(() => IC.timer === null), 'po odchodu ze záložky se časovač zastaví');
  },
};

async function spust(br, base, oddily) {
  const nalezy = [], f = (c, m, d) => { if (!c) nalezy.push(m + (d ? ' — ' + d : '')); };
  let kontrol = 0;
  const f2 = (c, m, d) => { kontrol++; f(c, m, d); };
  for (const jm of oddily) {
    const { ctx, p, chyby } = await otevri(br, base, jm === 'cilBezPohybu' ? { reducedMotion: 'reduce' } : null);
    await ODDILY[jm](p, f2);
    f2(chyby.length === 0, jm + ': bez výjimek na stránce', chyby[0]);
    await ctx.close();
  }
  return { nalezy, kontrol };
}

async function hlavni() {
  const br = await chromium.launch(LAUNCH);
  const srv = await server();
  console.log('\n── Infocentrum hodiny v konzoli ──\n');
  const VSE = ['data', 'xss', 'poradi', 'oblast', 'cil', 'cilBezPohybu', 'tymy', 'tymyVelke', 'rozvrzeni', 'chyba', 'nova', 'obnova', 'kde', 'stop'];
  const r = await spust(br, baseOf(srv), VSE);
  SNIM.dir = null;
  r.nalezy.slice(0, 12).forEach(n => console.log('  ⚠ ' + n));
  ok(r.nalezy.length === 0, 'skutečná konzole projde všemi kontrolami', r.nalezy.slice(0, 4).join(' | '));
  ok(r.kontrol === PODLAHA, 'proběhl očekávaný počet kontrol', String(r.kontrol));
  console.log('  skutečná konzole: ' + (r.nalezy.length ? r.nalezy.length + ' nálezů' : 'bez nálezu') + ' (' + r.kontrol + ' kontrol)');
  srv.close();

  /* ── sabotáže ── */
  const ucitel0 = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-ucitel.html'), 'utf8');
  const cloud0 = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-cloud.js'), 'utf8');
  async function sabotaz(jm, soubor, zmena, oddily, rx) {
    const orig = soubor === 'rpg-ucitel.html' ? ucitel0 : soubor === 'rpg-cloud.js' ? cloud0 : fs.readFileSync(path.join(ROOT, 'projects', soubor), 'utf8'), nove = zmena(orig);
    ok(nove !== orig, 'sabotáž „' + jm + '“ se aplikovala');
    if (nove === orig) return;
    const s = await server({ [soubor]: zmena });
    const v = await spust(br, baseOf(s), oddily);
    ok(v.nalezy.some(n => rx.test(n)), 'sabotáž „' + jm + '“ je chycena', v.nalezy[0] || 'prošla bez nálezu');
    s.close();
  }
  await sabotaz('řazení podle abecedy', 'rpg-ucitel.html', s => s.replace('serazeni=RPGInfo.seradit(hraci)', 'serazeni=hraci.slice().sort((a,b)=>a.jmeno.localeCompare(b.jmeno,"cs"))'), ['poradi'], /nahoře je ten|pořadí 0/);
  await sabotaz('chyby v dotazu', 'rpg-cloud.js', s => s.replace(",cur:data->cur')", ",cur:data->cur,errs:data->errs')"), ['data'], /nežádá počty chyb/);
  await sabotaz('dotaz bez pole cur', 'rpg-cloud.js', s => s.replace(",hero:data->name,cur:data->cur')", ",hero:data->name')"), ['kde'], /žádá pole cur|ukáže, kde je/);
  await sabotaz('poloha se nezobrazí', 'rpg-ucitel.html', s => s.replace("kd&&kd.kratce?kd.kratce+' · LV '+h.level:", ''), ['kde'], /ukáže, kde je/);
  await sabotaz('poloha i u nehrajících', 'rpg-ucitel.html', s => s.replace("lastEl.textContent=!h.on?'právě nehraje':", "lastEl.textContent="), ['kde'], /nehrající žák/);
  // „cur jako HTML“ sabotáž není: text karty se skládá jen z pevných slov a čísla úrovně (ověřený typ i mise), takže jde o ekvivalentní mutant — ověření tvaru hlídá Node test.
  await sabotaz('jména přes innerHTML', 'rpg-ucitel.html', s => s.replace("el.querySelector('.ic-nm').textContent=h.jmeno;", "el.querySelector('.ic-nm').innerHTML=h.jmeno;"), ['xss'], /nevykoná|jako text/);
  await sabotaz('obnova bez „jen změněné“', 'rpg-ucitel.html', s => s.replace("prvni?'':IC.cursor", "''"), ['data'], /jen změněné řádky/);
  await sabotaz('časovač neběží do konce', 'rpg-ucitel.html', s => s.replace("if(tab!=='infocentrum'){infoStop();icUprava(false);}", ''), ['stop'], /časovač/);
  await sabotaz('cíl bez animace', 'rpg-ucitel.html', s => s.replace('if(p.postoupila)icOslava(IC.cil.stupen);', ''), ['cil'], /animace/);
  await sabotaz('týmy bez ohledu na režim', 'rpg-ucitel.html', s => s.replace("sek.hidden=!t;if(!t)return;", "sek.hidden=false;if(!t)return;"), ['tymy'], /panel týmů zmizí/);
  await sabotaz('stav odpovědi se nepozná', 'rpg-infocentrum.js', s => s.replace("Number(p.last_qi) === qi", "false"), ['tymy'], /kdo už odpověděl/);
  await sabotaz('odpojení se neurčuje', 'rpg-infocentrum.js', s => s.replace("nejnovejsi - viden <= BOJ_ODPOJEN_MS", "true"), ['tymy'], /odpojený/);
  await sabotaz('hráči podle abecedy místo skóre', 'rpg-infocentrum.js', s => s.replace("b.skore - a.skore || CS.compare(a.jmeno, b.jmeno)", "CS.compare(a.jmeno, b.jmeno)"), ['tymy'], /řazeni podle skóre/);
  await sabotaz('bez stropu řádků', 'rpg-infocentrum.js', s => s.replace(".slice(0, BOJ_MAX_HRACU)", ""), ['tymyVelke'], /nejvýš 40/);
  await sabotaz('jméno hráče přes innerHTML', 'rpg-ucitel.html', s => s.replace("j.textContent=h.jmeno;", "j.innerHTML=h.jmeno;"), ['tymyVelke'], /nevykoná/);
  await sabotaz('malé písmo jmen v týmech', 'rpg-ucitel.html', s => s.replace("font-size:clamp(14px,1vw,20px);min-width:0}", "font-size:12px;min-width:0}"), ['tymyVelke'], /čitelné písmo/);
  await sabotaz('starý souboj zůstane viset', 'rpg-ucitel.html', s => s.replace("if(!m||m.faze==='finished'){", "if(!m){"), ['tymy'], /najde nový běžící/);

  await br.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
}
hlavni().catch(e => { console.error(e); process.exit(1); });
