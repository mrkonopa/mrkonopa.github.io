/* ══════════════════════════════════════════════════════════════════
   Živý souboj: ročníky otázek určuje JEN autor (fáze 29).

   Vadu nahlásil žák Jindra (3. 11. 2026): kdo se do týmového souboje
   připojil s jiným výběrem ročníků, přimíchal do něj své. Příčina: server
   znal jen `game` ('RPG_MAT_8' nebo 'RPG_MAT_MIX'), takže si každý hráč
   postavil otázky ze seedu z VLASTNÍ banky (hub: zaškrtnuté ročníky,
   hra: její ročník). Teď server drží `grades` a klient staví otázky
   výhradně z nich, i pro toho, kdo se připojí za běhu, a po odvetě.

   Test jede se SKUTEČNÝMI bankami (rpg-battle-3..9.js) a očekávanou
   sadu otázek počítá z nich v Node vlastní kopií slučování. Měří:
     • co dostane server při zakládání (hub i hra), vč. špatných vstupů,
     • že připojený hráč (jiná banka, jiný výběr, banka ani není načtená,
       vstup uprostřed souboje, odveta) dostane PŘESNĚ autorovy otázky,
     • starší souboje bez `grades` (před fází 29) a nepřátelské hodnoty,
     • createBattle v rpg-cloud.js (volání, čištění, záložní cesta),
     • hub: připojující ročníky nevybírá.
   Sabotáže (zdroj se mění za běhu přes route, soubory se nemění) ověřují,
   že každá z těchto pojistek skutečně zabírá.
   Spusť: node tests/rpg-battle-grades.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18497;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const UI_SRC = fs.readFileSync(path.join(ROOT, 'projects/rpg-battle-ui.js'), 'utf8');
const CLOUD_SRC = fs.readFileSync(path.join(ROOT, 'projects/rpg-cloud.js'), 'utf8');

const SEED = 1234567, SEED2 = 7654321, COUNT = 5;

/* ── očekávané otázky: nezávislá kopie slučování z rpg-battle-ui.js ── */
const banka = n => require(path.join(ROOT, 'projects', `rpg-battle-${n}.js`));
function mulberry32(a) {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function ocekavane(grades, seed, count) {
  const g = [...new Set(grades)].sort((a, b) => a - b);
  if (g.length === 1) return banka(g[0]).build(seed, count).map(q => q.text);
  let pool = [];
  g.forEach((n, i) => { pool = pool.concat(banka(n).build(seed ^ (i * 0x1F3D7), Math.min(40, count * 4))); });
  const rng = mulberry32(seed);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  return pool.slice(0, Math.min(count, pool.length)).map(q => q.text);
}

function startServer() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json' };
  const srv = http.createServer((req, res) => {
    let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
    const fp = path.normalize(path.join(ROOT, p));
    if (!fp.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end('forbidden'); return; }
    try { const buf = fs.readFileSync(fp); res.writeHead(200, { 'Content-Type': mime[p.split('.').pop()] || 'application/octet-stream' }); res.end(buf); }
    catch { res.writeHead(404); res.end('nf'); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

/* ── stránka s napodobeninou RPGCloud a vybranými bankami ───────────── */
function html(bankGrades, opts) {
  opts = opts || {};
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
    window.RPGWallet = { getReducedMotion: () => true };
    window.__created = null; window.__joined = null;
    window.RPGCloud = {
      currentUser: () => ({ id: 'u-me' }), isStaff: () => false,
      myBattleInvites: () => Promise.resolve([]),
      createBattle: function () { window.__created = [].slice.call(arguments); return Promise.resolve({ id: 'b1', code: 'WXYZ', team_mode: !!arguments[3] }); },
      joinBattle: function (c, n) { window.__joined = [c, n]; return Promise.resolve({ id: 'b1', code: c, team_mode: false }); },
      pollBattle: (id, cb) => { window.__cb = cb; return () => {}; },
      submitBattleAnswer: () => {}, advanceBattle: () => {}, setBattleStatus: () => Promise.resolve(),
      listActiveBattles: () => Promise.resolve([]), recordBattleResult: () => Promise.resolve(true),
      rematchBattle: () => Promise.resolve({ id: 'b1' })
    };
  </script>${bankGrades.map(g => `<script src="${BASE}/projects/rpg-battle-${g}.js"></script>`).join('')}
  <script src="${BASE}/projects/rpg-battle-ui.js"></script></body></html>`;
}

const stav = (extra, qi) => ({
  battle: Object.assign({ status: 'active', game: 'RPG_MAT_MIX', grades: [7, 8], q_seed: SEED, q_count: COUNT, q_index: qi, q_started_at: new Date().toISOString() }, extra || {}),
  players: [{ user_id: 'u-me', display_name: 'Me', score: 0, correct_count: 0, last_qi: -1 }], me: 'u-me'
});

async function ctecka(page, extra, qi) {
  for (let i = 0; i < 40; i++) {
    await page.evaluate(s => window.__cb(s), stav(extra, qi));
    await page.waitForTimeout(100);
    const t = await page.evaluate(qn => {
      const row = document.querySelector('.rpgb-row'), q = document.querySelector('.rpgb-q');
      return row && q && row.textContent.indexOf('OTÁZKA ' + qn + ' /') >= 0 ? q.textContent : null;
    }, qi + 1);
    if (t !== null) return t;
  }
  return null;
}
async function otazky(page, extra, indexy) {
  const out = [];
  for (const qi of indexy) out.push(await ctecka(page, extra, qi));
  return out;
}
async function pripojHrace(page, open) {
  // banky se předávají odkazem UVNITŘ stránky (evaluate by z nich zahodil funkce)
  await page.evaluate(o => {
    if (o.bankN) o.bank = window['RPG_BATTLE_' + o.bankN];
    if (o.bankNs) o.bank = o.bankNs.map(n => window['RPG_BATTLE_' + n]);
    RPGBattle.open(o); RPGBattle._joinCode('WXYZ');
  }, open);
  await page.waitForFunction(() => !!window.__cb, null, { timeout: 4000 });
}
const rovne = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── jedna sada kontrol; vrací počet nezdarů a jejich jména ───────────── */
async function sadaUI(browser, srcUi, popis) {
  const hlasky = [];
  const ok = (n, c, d) => { if (!c) hlasky.push(n + (d ? ' — ' + d : '')); };
  const ctx = await browser.newContext();
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (!u.startsWith(BASE)) return r.abort();
    if (/\/projects\/rpg-battle-ui\.js(\?|$)/.test(u)) return r.fulfill({ status: 200, contentType: 'application/javascript', body: srcUi });
    return r.continue();
  });
  const chyby = [];
  const nova = async (grades) => { const p = await ctx.newPage(); p.on('pageerror', e => chyby.push(e.message)); await p.setContent(html(grades), { waitUntil: 'load' }); await p.waitForFunction(() => typeof window.RPGBattle !== 'undefined', null, { timeout: 5000 }); return p; };
  const skripty = p => p.evaluate(() => [...document.querySelectorAll('script[src]')].map(s => (s.src.match(/rpg-battle-(\d)\.js/) || [])[1]).filter(Boolean).map(Number).sort());
  const IDX = [1, 2, 3, 4];

  // T1: hub zakládá MIX — server dostane vyčištěné, seřazené ročníky (špatné vstupy se zahodí)
  let p = await nova([7, 8, 9]);
  await p.evaluate(() => { RPGBattle.open({ game: 'RPG_MAT_MIX', name: 'H', grades: [9, 7, 7, '8', 'x', 99, -1, 3.5, null], bank: [window.RPG_BATTLE_7, window.RPG_BATTLE_8, window.RPG_BATTLE_9], autoAction: 'host' }); RPGBattle._create(5); });
  await p.waitForFunction(() => !!window.__created, null, { timeout: 3000 });
  const cr = await p.evaluate(() => window.__created);
  ok('T1 hub MIX: hra a počet', cr[0] === 'RPG_MAT_MIX' && cr[1] === 5, JSON.stringify(cr));
  ok('T1 hub MIX: ročníky vyčištěné a seřazené [7,8,9]', rovne(cr[4], [7, 8, 9]), JSON.stringify(cr[4]));
  await p.close();

  // T2: host ve hře 7 — ročník je hra
  p = await nova([7]);
  await p.evaluate(() => { RPGBattle.open({ game: 'RPG_MAT_7', name: 'H', bank: window.RPG_BATTLE_7 }); RPGBattle._host(); RPGBattle._create(10); });
  await p.waitForFunction(() => !!window.__created, null, { timeout: 3000 });
  const cr2 = await p.evaluate(() => window.__created);
  ok('T2 hra 7: ročníky [7]', rovne(cr2[4], [7]), JSON.stringify(cr2));
  await p.close();

  // T3: hráč ve hře 6 (načtená JEN banka 6) se připojí k MIX [9,8] (server je může poslat neseřazené)
  p = await nova([6]);
  await pripojHrace(p, { game: 'RPG_MAT_6', name: 'J', bankN: 6, autoAction: undefined });
  let q = await otazky(p, { grades: [9, 8] }, IDX);
  const exp89 = ocekavane([8, 9], SEED, COUNT);
  ok('T3 hra 6 → souboj 8+9: otázky přesně podle autora', rovne(q, IDX.map(i => exp89[i])), JSON.stringify(q).slice(0, 160));
  ok('T3 chybějící banky 8 a 9 se dotáhly, 7 a 6 jiné ne', rovne(await skripty(p), [6, 8, 9]), JSON.stringify(await skripty(p)));
  ok('T3 všechny čtyři otázky se vykreslily', q.every(t => t !== null));
  await p.close();

  // T4: hub — hráč má zaškrtnuté ročníky 5 a 9 a opravdu je do open() předá; souboj je 7+8 → rozhoduje souboj
  p = await nova([5, 9]);
  await pripojHrace(p, { game: 'RPG_MAT_MIX', name: 'J', grades: [5, 9], bankNs: [5, 9], autoAction: 'join' });
  q = await otazky(p, { grades: [7, 8] }, IDX);
  const exp78 = ocekavane([7, 8], SEED, COUNT), exp59 = ocekavane([5, 9], SEED, COUNT);
  ok('T4 hráč s vlastním výběrem 5+9: otázky z 7+8', rovne(q, IDX.map(i => exp78[i])), JSON.stringify(q).slice(0, 160));
  ok('T4 (kontrola citlivosti) 5+9 by daly jiné otázky', !rovne(IDX.map(i => exp59[i]), IDX.map(i => exp78[i])));
  await p.close();

  // T4b: hub, připojení BEZ výběru ročníků a bez banky — žádná chyba „banka se nenačetla“, otázky podle autora
  p = await nova([]);
  await p.evaluate(() => RPGBattle.open({ game: 'RPG_MAT_MIX', name: 'J', bank: null, grades: [], autoAction: 'join' }));
  ok('T4b připojení bez banky ukáže zadání kódu, ne chybu', await p.evaluate(() => !!document.getElementById('rpgb-codein') && !/nenačetla/.test(document.body.textContent)));
  await p.evaluate(() => RPGBattle._joinCode('WXYZ')); await p.waitForFunction(() => !!window.__cb, null, { timeout: 4000 });
  q = await otazky(p, { grades: [7, 8] }, IDX);
  ok('T4b bez banky: otázky z ročníků souboje', rovne(q, IDX.map(i => exp78[i])), JSON.stringify(q).slice(0, 120));
  await p.close();

  // T5: připojení za běhu (první stav, který hráč vidí, je otázka 3)
  p = await nova([6]);
  await pripojHrace(p, { game: 'RPG_MAT_6', name: 'J', bankN: 6 });
  q = await otazky(p, { grades: [7, 8] }, [3]);
  ok('T5 vstup za běhu: otázka 3 podle autora', q[0] === exp78[3], JSON.stringify(q));
  await p.close();

  // T6: jediný ročník [8] — banka 8 přímo (ne slučovaná), i když je hráč ve hře 6
  p = await nova([6]);
  await pripojHrace(p, { game: 'RPG_MAT_6', name: 'J', bankN: 6 });
  q = await otazky(p, { game: 'RPG_MAT_8', grades: [8] }, IDX);
  const exp8 = ocekavane([8], SEED, COUNT);
  ok('T6 jediný ročník 8: otázky z banky 8', rovne(q, IDX.map(i => exp8[i])), JSON.stringify(q).slice(0, 120));
  await p.close();

  // T7: odveta — nový seed, stejné ročníky
  p = await nova([6]);
  await pripojHrace(p, { game: 'RPG_MAT_6', name: 'J', bankN: 6 });
  await otazky(p, { grades: [8, 9] }, [1]);
  await p.evaluate(s => window.__cb(s), stav({ grades: [8, 9], status: 'lobby', q_seed: SEED2, q_index: -1 }, -1));
  await p.waitForTimeout(150);
  q = await otazky(p, { grades: [8, 9], q_seed: SEED2 }, [1, 2]);
  const exp89b = ocekavane([8, 9], SEED2, COUNT);
  ok('T7 odveta: nový seed, stejné ročníky', rovne(q, [exp89b[1], exp89b[2]]), JSON.stringify(q).slice(0, 120));
  await p.close();

  // T8a: starší souboj bez `grades`, game = RPG_MAT_8 → banka 8, ne banka hráče
  p = await nova([6]);
  await pripojHrace(p, { game: 'RPG_MAT_6', name: 'J', bankN: 6 });
  q = await otazky(p, { game: 'RPG_MAT_8', grades: undefined }, IDX);
  ok('T8a bez grades, game 8: banka 8', rovne(q, IDX.map(i => exp8[i])), JSON.stringify(q).slice(0, 120));
  await p.close();
  // T8b: starší souboj bez `grades`, MIX → banka hráče jako dřív (nic lepšího server neřekl)
  p = await nova([6]);
  await pripojHrace(p, { game: 'RPG_MAT_6', name: 'J', bankN: 6 });
  q = await otazky(p, { game: 'RPG_MAT_MIX', grades: undefined }, IDX);
  const exp6 = ocekavane([6], SEED, COUNT);
  ok('T8b bez grades, MIX: banka hráče jako dřív', rovne(q, IDX.map(i => exp6[i])), JSON.stringify(q).slice(0, 120));
  await p.close();

  // T9: nepřátelské `grades` — nic se nenačte ze špatné adresy, nic se nespustí, použije se game
  const pozadavky = [];
  p = await nova([9]);
  p.on('request', r => pozadavky.push(r.url()));
  await pripojHrace(p, { game: 'RPG_MAT_9', name: 'J', bankN: 9 });
  const zle = ['<img src=x onerror=window.__pwn=1>', 99, -1, 3.5, null, {}, '../../x'];
  q = await otazky(p, { game: 'RPG_MAT_9', grades: zle }, IDX);
  const exp9 = ocekavane([9], SEED, COUNT);
  ok('T9 nepřátelské grades: použije se game (banka 9)', rovne(q, IDX.map(i => exp9[i])), JSON.stringify(q).slice(0, 120));
  q = await otazky(p, { game: 'RPG_MAT_9', grades: '7' }, [1]);
  ok('T9 grades jako řetězec se ignoruje', q[0] === exp9[1], JSON.stringify(q));
  ok('T9 nic nespuštěno a žádný cizí požadavek', (await p.evaluate(() => window.__pwn)) === undefined && !pozadavky.some(u => /onerror|\.\.|img/.test(u)), pozadavky.filter(u => /battle/.test(u)).join(','));
  await p.close();

  ok('žádná chyba JS na stránkách', chyby.length === 0, chyby.slice(0, 2).join(' | '));
  await ctx.close();
  return hlasky;
}

/* ── createBattle v rpg-cloud.js ──────────────────────────────────── */
const MOCK_SB = `
window.__rpc = []; window.__rpcOdp = {};
window.supabase = { createClient: function () {
  const auth = {
    getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'zak@husovaliberec.cz', user_metadata: { full_name: 'Žák' } } } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithOAuth: async () => ({}), signOut: async () => ({ error: null }) };
  function q() { const h = new Proxy({}, { get: (t, k) => k === 'then' ? (res) => Promise.resolve({ data: [], error: null }).then(res) : () => h }); return h; }
  return { auth, from: q, channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    rpc: (name, args) => { window.__rpc.push([name, args]); const o = window.__rpcOdp[name]; return Promise.resolve(o ? o(args) : { data: { id: 'b1', code: 'ABCD' }, error: null }); } };
} };`;

async function sadaCloud(browser, srcCloud) {
  const hlasky = [];
  const ok = (n, c, d) => { if (!c) hlasky.push(n + (d ? ' — ' + d : '')); };
  async function nova() {
    const ctx = await browser.newContext();
    await ctx.route('**/*', r => {
      const u = r.request().url();
      if (!u.startsWith(BASE)) return r.abort();
      if (/\/projects\/rpg-cloud\.js(\?|$)/.test(u)) return r.fulfill({ status: 200, contentType: 'application/javascript', body: srcCloud });
      return r.continue();
    });
    await ctx.addInitScript(MOCK_SB);
    const p = await ctx.newPage();
    await p.goto(BASE + '/__prazdna');
    await p.setContent(`<!doctype html><html><body><div class="wrap"></div><script src="${BASE}/projects/rpg-cloud.js"></script></body></html>`, { waitUntil: 'load' });
    await p.evaluate(() => RPGCloud.attachHub([], function () {}, '.wrap'));   // spustí init() a přihlášení z napodobeniny
    await p.waitForFunction(() => window.RPGCloud && RPGCloud.currentUser && RPGCloud.currentUser(), null, { timeout: 5000 });
    return [ctx, p];
  }
  const volej = (p, args) => p.evaluate(a => RPGCloud.createBattle.apply(null, a), args);
  const rpc = p => p.evaluate(() => window.__rpc.filter(x => /battle/.test(x[0])).map(x => [x[0], x[1]]));

  let [ctx, p] = await nova();
  let r = await volej(p, ['RPG_MAT_MIX', 8, 'Vojta', true, [9, 7]]);
  let c = await rpc(p);
  ok('C1 create_battle_g, tým, p_grades', c.length === 1 && c[0][0] === 'create_battle_g' && c[0][1].p_game === 'RPG_MAT_MIX' && c[0][1].p_team_mode === true && rovne(c[0][1].p_grades, [9, 7]) && r && r.code === 'ABCD', JSON.stringify(c));
  await p.evaluate(() => { window.__rpc.length = 0; });
  await volej(p, ['RPG_MAT_MIX', 8, 'V', false, [7, 'x', 99, 8, 3.5, null]]);
  c = await rpc(p);
  ok('C2 špatné hodnoty se zahodí před odesláním', c.length === 1 && rovne(c[0][1].p_grades, [7, 8]) && c[0][1].p_team_mode === false, JSON.stringify(c));
  await ctx.close();

  [ctx, p] = await nova();
  await p.evaluate(() => { window.__rpcOdp.create_battle_g = () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.create_battle_g(p_game, p_grades) in the schema cache' } }); });
  r = await volej(p, ['RPG_MAT_MIX', 5, 'V', false, [7, 8]]);
  c = await rpc(p);
  ok('C3 fáze 29 chybí: spadne na create_battle', c.length === 2 && c[0][0] === 'create_battle_g' && c[1][0] === 'create_battle' && r && r.code === 'ABCD', JSON.stringify(c));
  await p.evaluate(() => { window.__rpc.length = 0; });
  await volej(p, ['RPG_MAT_MIX', 5, 'V', true, [7, 8]]);
  c = await rpc(p);
  ok('C3b a příště už create_battle_g nezkouší (tým → create_battle_tm)', c.length === 1 && c[0][0] === 'create_battle_tm', JSON.stringify(c));
  await ctx.close();

  [ctx, p] = await nova();
  await p.evaluate(() => { window.__rpcOdp.create_battle_g = () => ({ data: null, error: { code: 'P0001', message: 'invalid grades' } }); });
  r = await volej(p, ['RPG_MAT_MIX', 5, 'V', false, [7, 8]]);
  c = await rpc(p);
  ok('C4 chyba serveru (invalid grades) se vrátí a nezkouší se záložní cesta', c.length === 1 && r && r.error === 'invalid grades', JSON.stringify([c, r]));
  await ctx.close();

  [ctx, p] = await nova();
  await volej(p, ['RPG_MAT_9', 5, 'V', true]);
  await volej(p, ['RPG_MAT_9', 5, 'V', false, []]);
  c = await rpc(p);
  ok('C5 bez ročníků zůstávají původní funkce', c.length === 2 && c[0][0] === 'create_battle_tm' && c[1][0] === 'create_battle', JSON.stringify(c.map(x => x[0])));
  await ctx.close();
  return hlasky;
}

/* ── hub: připojující ročníky nevybírá ───────────────────────────── */
async function sadaHub(browser) {
  const hlasky = [];
  const ok = (n, c, d) => { if (!c) hlasky.push(n + (d ? ' — ' + d : '')); };
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (!u.startsWith(BASE)) return r.abort();
    if (/\/projects\/rpg-battle-ui\.js(\?|$)/.test(u)) return r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* nahrazeno napodobeninou */' });
    return r.continue();
  });
  await ctx.addInitScript(() => { window.__open = null; window.RPGBattle = { open: o => { window.__open = o; } }; });
  const p = await ctx.newPage();
  let dialogy = 0; p.on('dialog', d => { dialogy++; d.dismiss().catch(() => {}); });
  const chyby = []; p.on('pageerror', e => chyby.push(e.message));
  await p.goto(BASE + '/projects/rpg-matematika.html', { waitUntil: 'load' });
  await p.waitForFunction(() => typeof openHubBattle === 'function', null, { timeout: 8000 });
  await p.evaluate(() => { document.querySelectorAll('.hb-grade').forEach(el => { el.checked = ['7', '8', '9'].includes(el.value); }); });
  await p.evaluate(() => openHubBattle('host'));
  let o = await p.evaluate(() => window.__open);
  ok('H1 host z hubu: ročníky 7, 8, 9, MIX', o && o.game === 'RPG_MAT_MIX' && rovne(o.grades, [7, 8, 9]) && o.autoAction === 'host', JSON.stringify(o && { g: o.game, gr: o.grades, a: o.autoAction }));
  await p.evaluate(() => { window.__open = null; });
  await p.evaluate(() => openHubBattle('join'));
  o = await p.evaluate(() => window.__open);
  ok('H2 připojení z hubu: ročníky se nepředávají, banka žádná', o && rovne(o.grades, []) && o.bank === null && o.autoAction === 'join', JSON.stringify(o && { gr: o.grades, b: o.bank, a: o.autoAction }));
  await p.evaluate(() => { window.__open = null; document.querySelectorAll('.hb-grade').forEach(el => { el.checked = false; }); });
  await p.evaluate(() => openHubBattle('join'));
  o = await p.evaluate(() => window.__open);
  ok('H3 připojení bez zaškrtnutého ročníku nevyhodí výzvu', o && o.autoAction === 'join' && dialogy === 0, 'dialogy ' + dialogy);
  await p.evaluate(() => { window.__open = null; });
  await p.evaluate(() => openHubBattle('host'));
  ok('H4 založení bez ročníku se dál odmítne', dialogy === 1 && (await p.evaluate(() => window.__open)) === null, 'dialogy ' + dialogy);
  ok('H5 text v hubu už nevybízí připojující k výběru', await p.evaluate(() => /jen ten, kdo souboj zakládá/.test(document.getElementById('hub-battle').textContent)));
  ok('žádná chyba JS v hubu', chyby.length === 0, chyby.slice(0, 2).join(' | '));
  await ctx.close();
  return hlasky;
}

/* ── sabotáže ─────────────────────────────────────────────────────── */
const SAB_UI = [
  ['otázky z banky hráče místo z ročníků souboje', 'var bk = gr ? bankFor(gr) : BANK;', 'var bk = BANK;'],
  ['chybějící banka se nedotáhne', "if (bankLoad[g] || !(g >= 3 && g <= 9)) return;", 'return;'],
  ['ročníky bez čištění', 'if (!Array.isArray(a)) return null;', 'if (!Array.isArray(a)) return null; return a;'],
  ['ročníky bez řazení', 'out.sort(function (p, q) { return p - q; });', ''],
  ['createRoom neposílá ročníky', 'HTEAM, GRADES).then', 'HTEAM).then'],
  ['bez odvození ročníku z game', 'return m ? [Number(m[1])] : null; }', 'return null; }'],
  ['připojení vyžaduje banku', "opts.autoAction !== 'join' && (!BANK", "(!BANK"]
];
const SAB_CLOUD = [
  ['bez záložní cesty při chybějící fázi 29', 'if (!chybi) return { error: r.error.message || String(r.error) };', 'return { error: r.error.message || String(r.error) };'],
  ['záložní cesta i při chybě serveru', 'if (!chybi) return { error: r.error.message || String(r.error) };', ''],
  ['ročníky bez čištění', '.filter(n => Number.isInteger(n) && n >= 3 && n <= 9)', '.filter(n => true)'],
  ['create_battle_g se zkouší pořád', 'ceFaze29Chybi = true;', 'ceFaze29Chybi = false;']
];

(async () => {
  console.log('\n── Živý souboj: ročníky otázek určuje jen autor ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let pass = 0, fail = 0;
  const ukaz = (n, h) => { if (!h.length) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n); h.forEach(x => console.log('       · ' + x)); fail++; } };
  try {
    ukaz('klient: zakládání, připojení, vstup za běhu, odveta, starší souboje, nepřátelské hodnoty', await sadaUI(browser, UI_SRC));
    ukaz('rpg-cloud.js: createBattle', await sadaCloud(browser, CLOUD_SRC));
    ukaz('hub: připojující ročníky nevybírá', await sadaHub(browser));

    console.log('\n── Sabotáže (zdroj se mění za běhu, soubory ne) ──');
    for (const [jm, od, na] of SAB_UI) {
      const nove = UI_SRC.replace(od, na);
      if (nove === UI_SRC) { console.log('  ❌ sabotáž se neaplikovala: ' + jm); fail++; continue; }
      const h = await sadaUI(browser, nove);
      if (h.length) { console.log('  ✅ chyceno: ' + jm + ' (' + h.length + ' nezdarů, např. ' + h[0].slice(0, 60) + ')'); pass++; }
      else { console.log('  ❌ NEchyceno: ' + jm); fail++; }
    }
    for (const [jm, od, na] of SAB_CLOUD) {
      const nove = CLOUD_SRC.replace(od, na);
      if (nove === CLOUD_SRC) { console.log('  ❌ sabotáž se neaplikovala: ' + jm); fail++; continue; }
      const h = await sadaCloud(browser, nove);
      if (h.length) { console.log('  ✅ chyceno: cloud — ' + jm + ' (' + h.length + ' nezdarů, např. ' + h[0].slice(0, 60) + ')'); pass++; }
      else { console.log('  ❌ NEchyceno: cloud — ' + jm); fail++; }
    }
  } finally { await browser.close(); srv.close(); }
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: ' + pass + ' ✅  /  ' + fail + ' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
