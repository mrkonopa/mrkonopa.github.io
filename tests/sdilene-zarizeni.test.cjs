/* ══════════════════════════════════════════════════════════════════════
   Sdílený tablet: postup jednoho žáka nesmí přejít na druhého.

   Vojtův lístek (7. 10. 2026): „Nové přihlášení nemaže průběh? Neaktualizuje
   se průběh … zůstává na začátku. Odhlášením → smažou se lokální data!“
   V rpg-cloud.js byly tři vady, každá sama o sobě v pořádku vypadající:
     1) odhlášení v zařízení nechalo postavy, peněženku i výsledky přijímaček,
        takže další žák viděl „Pokračovat“ s cizí postavou;
     2) při přihlášení vyhrál ten, kdo měl víc splněných úkolů — cizí lokální
        postava, která byla dál, se NAHRÁLA do cloudu nového žáka;
     3) kdo klikl „Pokračovat“ dřív, než dorazil cloud, hrál dál se starým
        stavem v paměti (cloud se zapsal jen do úložiště) a první uložení
        pak cloud PŘEPSALO starým stavem.
   Test hraje skutečné scénáře se stavovým mockem Supabase: databáze
   i přihlášení žijí v Node, takže přežijí přenačtení stránky po odhlášení.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      const u = decodeURIComponent(q.url.split('?')[0]);
      if (u === '/__prazdna') { r.writeHead(200, { 'Content-Type': 'text/html' }); return r.end('<!doctype html><meta charset="utf-8"><title>x</title>'); }
      const f = path.normalize(path.join(ROOT, u));
      if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('nf'); }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(0, () => res(s));
  });
}

const A = { id: 'uA', email: 'adam@husovaliberec.cz', user_metadata: { full_name: 'Adam Prvni' } };
const B = { id: 'uB', email: 'beta@husovaliberec.cz', user_metadata: { full_name: 'Beta Druha' } };
const done = n => { const o = {}; for (let i = 0; i < n; i++) o['1-' + (1 + (i % 3)) + '-' + i] = true; return o; };
const postava = (jmeno, n, xp) => ({ name: jmeno, xp: xp || n * 7, level: 1, attrs: { calc: n, geo: 0, anal: 0, craft: 0 }, done: done(n), inv: [], teacherUnlocked: [] });
const pocet = s => s && s.done ? Object.keys(s.done).length : -1;

/* ── stavový „server“: saves, výsledky přijímaček, přihlášený uživatel ── */
const SRV = { user: null, saves: new Map(), pz: new Map(), zpozdeniSaves: 0, zpozdeniSession: 0, upserty: [] };
function reset() { SRV.user = null; SRV.saves.clear(); SRV.pz.clear(); SRV.zpozdeniSaves = 0; SRV.zpozdeniSession = 0; SRV.upserty = []; }
async function sb(op, arg) {
  if (op === 'session') { if (SRV.zpozdeniSession) await sleep(SRV.zpozdeniSession); return SRV.user; }
  if (op === 'signout') { SRV.user = null; return null; }
  if (op === 'rpc') {
    const uid = SRV.user && SRV.user.id;
    if (arg.name === 'pz_get_stats') return { data: (uid && SRV.pz.get(uid)) || null, error: null };
    if (arg.name === 'pz_save_stats') { if (uid) SRV.pz.set(uid, JSON.parse(JSON.stringify(arg.args.p_data))); return { data: null, error: null }; }
    return { data: [], error: null };
  }
  if (op === 'q') {
    const st = arg;
    if (st.table === 'saves' && st.op === 'select' && st.filters.user_id && st.filters.game) {
      if (SRV.zpozdeniSaves) await sleep(SRV.zpozdeniSaves);
      const rec = SRV.saves.get(st.filters.user_id + '|' + st.filters.game);
      return { data: rec ? { data: JSON.parse(JSON.stringify(rec)) } : null, error: null };
    }
    if (st.table === 'saves' && st.op === 'upsert') {
      const p = st.payload; SRV.upserty.push(p.user_id + '|' + p.game);
      SRV.saves.set(p.user_id + '|' + p.game, JSON.parse(JSON.stringify(p.data)));
      return { data: null, error: null };
    }
    return { data: st.single ? null : [], error: null };
  }
  return null;
}
const MOCK = `
window.supabase = { createClient: function () {
  const auth = {
    getSession: async () => { const u = await window.__sb('session'); return { data: { session: u ? { user: u } : null } }; },
    onAuthStateChange: (f) => { window.__authCb = f; return { data: { subscription: { unsubscribe() {} } } }; },
    signInWithOAuth: async () => ({}),
    signOut: async () => { await window.__sb('signout'); return { error: null }; },
  };
  function q(table) {
    const st = { table, filters: {}, op: 'select', payload: null, single: false };
    const h = {
      select() { return h; }, eq(k, v) { st.filters[k] = v; return h; },
      in() { return h; }, order() { return h; }, limit() { return h; }, gte() { return h; }, lte() { return h; },
      neq() { return h; }, is() { return h; }, ilike() { return h; }, range() { return h; },
      upsert(p) { st.op = 'upsert'; st.payload = p; return h; }, insert(p) { st.op = 'insert'; st.payload = p; return h; },
      update(p) { st.op = 'update'; st.payload = p; return h; }, delete() { st.op = 'delete'; return h; },
      maybeSingle() { st.single = true; return h; }, single() { st.single = true; return h; },
      then(res, rej) { return window.__sb('q', st).then(res, rej); }
    };
    return h;
  }
  return { auth, from: q, rpc: (name, args) => window.__sb('rpc', { name, args: args || {} }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }) };
} };`;

const OSOBNI = /^(RPG_MAT_[0-9]|RPG_HUB_WALLET|PZ_(CERMAT_ATTEMPTS|PRACTICE_PROGRESS|DIAG_LAST|TEST_TOPICS|TEST_RUN))$/;

(async () => {
  console.log('\n── Sdílený tablet: přihlášení, odhlášení, cizí postup ──\n');
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC });
  const errs = [];
  let dialogy = [], naDialog = 'dismiss';

  async function zarizeni() {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    await ctx.exposeFunction('__sb', sb);
    await ctx.addInitScript(MOCK);
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
    pg.on('dialog', d => { dialogy.push(d.message()); (naDialog === 'accept' ? d.accept() : d.dismiss()).catch(() => {}); });
    return { ctx, pg };
  }
  // úložiště tabletu nastaví „prázdná“ stránka téhož původu, ať ho init skript nepřepisuje při každém přenačtení
  async function ulozDoTabletu(pg, data) {
    await pg.goto(base + '/__prazdna');
    await pg.evaluate(d => { localStorage.clear(); for (const [k, v] of Object.entries(d)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); }, data);
  }
  const ulozeno = pg => pg.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
  const hra = base + '/projects/rpg-mat-9.html';
  const CERSTVE = '#access_token=x&refresh_token=y&token_type=bearer&type=signup';
  async function cekejNaMapu(pg) {
    await pg.waitForFunction(() => document.querySelector('#s-map') && document.querySelector('#s-map').classList.contains('active'), null, { timeout: 8000 });
  }

  // ── 1) odhlášení: dopošle poslední změnu, pak smaže osobní data ──────────
  try {
    reset(); dialogy = [];
    SRV.user = A; SRV.saves.set('uA|RPG_MAT_9', postava('ADAM', 5));
    const { ctx, pg } = await zarizeni();
    await ulozDoTabletu(pg, { RPG_CLOUD_OWNER: 'uA', RPG_MAT_9: postava('ADAM', 5), RPG_HUB_WALLET: { v: 1, credits: 40 },
      PZ_CERMAT_ATTEMPTS: [{ date: '2026-10-01', score: 30, max: 50 }], RPG_HUB_STUPEN: '"2"',
      PZ_TEST_RUN: { v: 1, konec: Date.now() + 3600000, tasks: [{ no: 1 }], odp: {}, kresby: {} } });   // rozepsaný test nanečisto
    await pg.goto(hra, { waitUntil: 'load' });
    await cekejNaMapu(pg);
    await pg.evaluate(() => { S.xp = 777; saveS(); });            // změna těsně před odhlášením (push čeká 800 ms)
    // doménový žák úvodní obrazovku s lištou nevidí — odhlašuje se z PROFILU (NASTAVENÍ)
    await pg.evaluate(() => go('profile'));
    const tl = await pg.evaluate(() => { const b = document.getElementById('pr-logout'); const t = document.getElementById('pr-cloud-txt');
      return { videt: !!b && b.offsetParent !== null, text: t ? t.textContent : '' }; });
    ok('profil: tlačítko Odhlásit je vidět a říká, kdo je přihlášený', tl.videt && /adam@husovaliberec\.cz/.test(tl.text), JSON.stringify(tl));
    // odhlášení stránku přenačte — čeká se na nové načtení
    await Promise.all([pg.waitForEvent('load', { timeout: 8000 }), pg.click('#pr-logout')]);
    await sleep(600);
    const st = await ulozeno(pg);
    const zbylo = Object.keys(st).filter(k => OSOBNI.test(k));
    ok('odhlášení: poslední změna (xp 777) došla do cloudu dřív, než se data smazala', (SRV.saves.get('uA|RPG_MAT_9') || {}).xp === 777,
      'xp v cloudu ' + (SRV.saves.get('uA|RPG_MAT_9') || {}).xp);
    ok('odhlášení: v tabletu nezbyla postava, peněženka ani výsledky přijímaček', zbylo.length === 0, 'zbylo: ' + zbylo.join(', '));
    ok('odhlášení: vlastník zařízení je pryč', !('RPG_CLOUD_OWNER' in st));
    ok('odhlášení: nastavení zařízení (stupeň v hubu) zůstalo', st.RPG_HUB_STUPEN === '"2"', String(st.RPG_HUB_STUPEN));
    ok('odhlášení: hra je zpátky na úvodu bez „Pokračovat“', await pg.evaluate(() =>
      document.getElementById('s-intro').classList.contains('active') && getComputedStyle(document.getElementById('continue-panel')).display === 'none'));
    ok('odhlášení: v profilu už tlačítko Odhlásit není', await pg.evaluate(() => { const b = document.getElementById('pr-cloud'); return !b || b.style.display === 'none'; }));
    await ctx.close();
  } catch (e) { ok('scénář 1 doběhl', false, e.message.split('\n')[0]); }

  // ── 2) A se neodhlásil, přihlásí se B: Adamova postava do cloudu Bety nesmí ──
  try {
    reset(); dialogy = [];
    SRV.user = B; SRV.saves.set('uB|RPG_MAT_9', postava('BETA', 3));
    const { ctx, pg } = await zarizeni();
    await ulozDoTabletu(pg, { RPG_CLOUD_OWNER: 'uA', RPG_MAT_9: postava('ADAM', 20), RPG_HUB_WALLET: { v: 1, credits: 90 } });
    await pg.goto(hra + CERSTVE, { waitUntil: 'load' });
    await cekejNaMapu(pg);
    await pg.evaluate(() => saveS()); await sleep(1200);
    const vB = SRV.saves.get('uB|RPG_MAT_9');
    const ulozenoB = await ulozeno(pg);
    ok('cizí vlastník: Betě se načetla JEJÍ postava (3 úkoly), ne Adamova (20)', await pg.evaluate(() => S.name + ':' + Object.keys(S.done).length) === 'BETA:3',
      await pg.evaluate(() => S.name + ':' + Object.keys(S.done).length));
    ok('cizí vlastník: Betin cloud zůstal její (BETA, 3 úkoly)', vB && vB.name === 'BETA' && pocet(vB) === 3, vB ? vB.name + ':' + pocet(vB) : 'chybí');
    const kr = (() => { try { return JSON.parse((ulozenoB.RPG_HUB_WALLET) || 'null'); } catch (e) { return null; } })();
    ok('cizí vlastník: Adamova peněženka (90 kr.) v tabletu nezůstala', !kr || (kr.credits | 0) < 90, 'kreditů ' + (kr && kr.credits));
    ok('cizí vlastník: žádný dotaz (data jiného účtu se zahazují bez ptaní)', dialogy.length === 0, dialogy.join(' | '));
    ok('cizí vlastník: tablet teď patří Betě', (await ulozeno(pg)).RPG_CLOUD_OWNER === 'uB');
    await ctx.close();
  } catch (e) { ok('scénář 2 doběhl', false, e.message.split('\n')[0]); }

  // ── 2b) přihlášení jiného účtu v JINÉ KARTĚ (událost SIGNED_IN), zatímco hra běží ──
  try {
    reset(); dialogy = [];
    SRV.user = A; SRV.saves.set('uA|RPG_MAT_9', postava('ADAM', 20)); SRV.saves.set('uB|RPG_MAT_9', postava('BETA', 3));
    const { ctx, pg } = await zarizeni();
    await ulozDoTabletu(pg, { RPG_CLOUD_OWNER: 'uA', RPG_MAT_9: postava('ADAM', 20) });
    await pg.goto(hra, { waitUntil: 'load' });
    await cekejNaMapu(pg);
    SRV.user = B;                                                   // relace v úložišti je teď Betina
    await Promise.all([pg.waitForEvent('load', { timeout: 8000 }), pg.evaluate(u => window.__authCb('SIGNED_IN', { user: u }), B)]);
    await cekejNaMapu(pg);
    await pg.evaluate(() => saveS()); await sleep(1200);
    ok('jiná karta: po přihlášení Bety hra načetla Betinu postavu', await pg.evaluate(() => S.name + ':' + Object.keys(S.done).length) === 'BETA:3',
      await pg.evaluate(() => S.name + ':' + Object.keys(S.done).length));
    ok('jiná karta: Adamova postava do Betina cloudu nedošla', (SRV.saves.get('uB|RPG_MAT_9') || {}).name === 'BETA' && (SRV.saves.get('uA|RPG_MAT_9') || {}).name === 'ADAM');
    await ctx.close();
  } catch (e) { ok('scénář 2b doběhl', false, e.message.split('\n')[0]); }

  // ── 3) data bez vlastníka + ČERSTVÉ přihlášení: zeptat se. BEZPEČNÝ VÝCHOZÍ: OK (Enter) data SMAŽE, ponechat je = vědomé „Zrušit“ ──
  //    (10. 11. 2026: dřív OK znamenalo „ulož do mého účtu“, takže odklepnutý dotaz dal dítěti postavu předchozího žáka)
  for (const volba of ['accept', 'dismiss']) {
    try {
      reset(); dialogy = []; naDialog = volba;
      SRV.user = B; SRV.saves.set('uB|RPG_MAT_9', postava('BETA', 3));
      const { ctx, pg } = await zarizeni();
      await ulozDoTabletu(pg, { RPG_MAT_9: postava('ADAM', 20) });
      await pg.goto(hra + CERSTVE, { waitUntil: 'load' });
      await cekejNaMapu(pg);
      await sleep(1200);
      const vB = SRV.saves.get('uB|RPG_MAT_9');
      ok(`bez vlastníka (${volba === 'accept' ? 'OK' : 'Zrušit'}): dotaz se ukázal a jmenuje postavu ADAM`, dialogy.length === 1 && /ADAM/.test(dialogy[0]), dialogy.join(' | ') || 'žádný dotaz');
      ok('dotaz říká, že OK data SMAŽE (bezpečný výchozí)', /OK = NE[^\n]*smazat/.test(dialogy[0] || '') && /Zrušit = ANO[^\n]*uložit/.test(dialogy[0] || ''), (dialogy[0] || '').split('\n').slice(-2).join(' | '));
      if (volba === 'accept') {
        ok('bez vlastníka, OK (odklepnuto): Betin cloud zůstal její', vB && vB.name === 'BETA' && pocet(vB) === 3, vB ? vB.name + ':' + pocet(vB) : 'chybí');
        ok('bez vlastníka, OK: v tabletu nezbyla Adamova postava', !('RPG_MAT_9' in (await ulozeno(pg))) || JSON.parse((await ulozeno(pg)).RPG_MAT_9).name !== 'ADAM');
      } else ok('bez vlastníka, Zrušit (vědomě „je moje“): postava se převzala do účtu', vB && vB.name === 'ADAM' && pocet(vB) === 20, vB ? vB.name + ':' + pocet(vB) : 'chybí');
      await ctx.close();
    } catch (e) { ok('scénář 3 (' + volba + ') doběhl', false, e.message.split('\n')[0]); }
  }
  naDialog = 'dismiss';

  // ── 4) obnovená relace + data bez vlastníka (tablet z doby před opravou): bez dotazu ──
  try {
    reset(); dialogy = [];
    SRV.user = A; SRV.saves.set('uA|RPG_MAT_9', postava('ADAM', 5));
    const { ctx, pg } = await zarizeni();
    await ulozDoTabletu(pg, { RPG_MAT_9: postava('ADAM', 5) });
    await pg.goto(hra, { waitUntil: 'load' });
    await cekejNaMapu(pg);
    await sleep(300);
    ok('obnovená relace: žádný dotaz', dialogy.length === 0, dialogy.join(' | '));
    ok('obnovená relace: tablet převzal přihlášený účet', (await ulozeno(pg)).RPG_CLOUD_OWNER === 'uA');
    await ctx.close();
  } catch (e) { ok('scénář 4 doběhl', false, e.message.split('\n')[0]); }

  // ── 5) „Pokračovat“ dřív, než dorazí cloud: hra načte cloud a nepřepíše ho ──
  try {
    reset(); dialogy = [];
    SRV.user = A; SRV.saves.set('uA|RPG_MAT_9', postava('ADAM', 10)); SRV.zpozdeniSaves = 1500;
    const { ctx, pg } = await zarizeni();
    await ulozDoTabletu(pg, { RPG_CLOUD_OWNER: 'uA', RPG_MAT_9: postava('ADAM', 2) });
    await pg.goto(hra, { waitUntil: 'load' });
    await pg.evaluate(() => continueGame());                       // žák klikne hned, cloud ještě nedorazil
    const predtim = await pg.evaluate(() => Object.keys(S.done).length);
    const nacteno = await pg.waitForFunction(() => Object.keys(S.done).length === 10, null, { timeout: 6000 }).then(() => true, () => false);
    SRV.zpozdeniSaves = 0;
    await pg.evaluate(() => saveS()); await sleep(1200);
    ok('pozdní cloud: hra hrála se starým stavem (2 úkoly) — scénář opravdu nastal', predtim === 2, 'před příchodem cloudu ' + predtim);
    ok('pozdní cloud: běžící hra převzala postup z cloudu (10 úkolů)', nacteno, 'v paměti ' + await pg.evaluate(() => Object.keys(S.done).length));
    ok('pozdní cloud: první uložení cloud NEpřepsalo starým stavem', pocet(SRV.saves.get('uA|RPG_MAT_9')) === 10, 'v cloudu ' + pocet(SRV.saves.get('uA|RPG_MAT_9')));
    await ctx.close();
  } catch (e) { ok('scénář 5 doběhl', false, e.message.split('\n')[0]); }

  // ── 6) odemčení od učitele během hraní: musí se dostat do hry a vydržet další uložení ──
  try {
    reset(); dialogy = [];
    SRV.user = A; SRV.saves.set('uA|RPG_MAT_9', postava('ADAM', 5));
    const { ctx, pg } = await zarizeni();
    await ulozDoTabletu(pg, { RPG_CLOUD_OWNER: 'uA', RPG_MAT_9: postava('ADAM', 5) });
    await pg.goto(hra, { waitUntil: 'load' });
    await cekejNaMapu(pg);
    const c = SRV.saves.get('uA|RPG_MAT_9'); c.teacherUnlocked = ['4-1']; SRV.saves.set('uA|RPG_MAT_9', c);   // učitel odemkl v konzoli
    await pg.evaluate(() => RPGCloud._tep());                       // jeden úder „heartbeatu“ (jinak co 120 s)
    await sleep(300);
    await pg.evaluate(() => { S.xp += 1; saveS(); }); await sleep(1200);
    ok('odemčení od učitele: dostalo se do běžící hry', await pg.evaluate(() => (S.teacherUnlocked || []).includes('4-1')));
    ok('odemčení od učitele: vydrželo další uložení hry', ((SRV.saves.get('uA|RPG_MAT_9') || {}).teacherUnlocked || []).includes('4-1'),
      JSON.stringify((SRV.saves.get('uA|RPG_MAT_9') || {}).teacherUnlocked));
    await ctx.close();
  } catch (e) { ok('scénář 6 doběhl', false, e.message.split('\n')[0]); }

  // ── 7) přijímačky: cizí výsledky se s cloudem nového žáka neslijí ──────────
  try {
    reset(); dialogy = [];
    SRV.user = B; SRV.pz.set('uB', { attempts: [{ date: '2026-10-02', score: 20, max: 50, t: 2 }], practice: {}, diag: null, test: {} });
    const { ctx, pg } = await zarizeni();
    await ulozDoTabletu(pg, { RPG_CLOUD_OWNER: 'uA', PZ_CERMAT_ATTEMPTS: [1, 2, 3].map(i => ({ date: '2026-09-0' + i, score: 40, max: 50, t: 10 + i })) });
    await pg.goto(base + '/projects/prijimacky-matematika/statistiky.html' + CERSTVE, { waitUntil: 'load' });
    await sleep(1500);
    const pzB = SRV.pz.get('uB');
    ok('přijímačky: v cloudu Bety je jen její 1 pokus (ne 1 + 3 Adamovy)', pzB && Array.isArray(pzB.attempts) && pzB.attempts.length === 1, pzB ? 'pokusů ' + (pzB.attempts || []).length : 'chybí');
    ok('přijímačky: v tabletu jsou teď Betiny výsledky', JSON.parse((await ulozeno(pg)).PZ_CERMAT_ATTEMPTS || '[]').length === 1);
    await ctx.close();
  } catch (e) { ok('scénář 7 doběhl', false, e.message.split('\n')[0]); }

  // ── 8) náhled hry učitelem nic nemaže ani nemění vlastníka ─────────────────
  try {
    reset(); dialogy = [];
    SRV.user = B;
    const { ctx, pg } = await zarizeni();
    await ulozDoTabletu(pg, { RPG_CLOUD_OWNER: 'uA', RPG_MAT_9: postava('ADAM', 20) });
    await pg.goto(hra + '?preview=1' + CERSTVE, { waitUntil: 'load' });
    await sleep(800);
    await pg.goto(base + '/__prazdna');                             // náhled má úložiště hry v sandboxu — skutečný stav až tady
    const st = await ulozeno(pg);
    ok('náhled: vlastník i postava v tabletu zůstaly', st.RPG_CLOUD_OWNER === 'uA' && pocet(JSON.parse(st.RPG_MAT_9 || 'null')) === 20);
    await ctx.close();
  } catch (e) { ok('scénář 8 doběhl', false, e.message.split('\n')[0]); }


  /* ── 9–11) CIZÍ DATA SE NESMÍ UKÁZAT ani na rozcestníku, v přijímačkách a na úvodu hry (10. 11. 2026, Vojtovo hlášení:
        „přihlášením se nepřepsali údaje na tabletu od předchozího uživatele — totální priorita“).
        Měřeno: rozcestník po přihlášení dál ukazoval postavu a kredity předchozího žáka, dokud nedoběhlo stahování sedmi postav
        po jedné (na pomalé síti desítky sekund); přenačtení po zahození dat se dělalo jen u běžící hry. ── */
  const videtelnyText = pg => pg.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  const cizi = t => /ADAM/.test(t) || /4\s?321/.test(t) || /41\s*\/\s*50/.test(t);
  const CIZI_DATA = { RPG_CLOUD_OWNER: 'uA', RPG_MAT_5: postava('ADAM', 6), RPG_HUB_WALLET: { v: 1, credits: 4321 },
    PZ_CERMAT_ATTEMPTS: [{ date: '2026-10-01', score: 41, max: 50 }] };
  for (const [kde, url, zpSession, zpSaves] of [
    ['rozcestník', base + '/projects/rpg-matematika.html', 1500, 2500],
    ['přijímačky', base + '/projects/prijimacky-matematika/index.html', 1500, 0],
    ['úvod hry 5. ročníku', base + '/projects/rpg-mat-5.html', 1500, 0]]) {
    try {
      reset(); SRV.user = B; SRV.zpozdeniSession = zpSession; SRV.zpozdeniSaves = zpSaves;
      const { ctx, pg } = await zarizeni();
      await ulozDoTabletu(pg, CIZI_DATA);
      await pg.goto(url + CERSTVE, { waitUntil: 'domcontentloaded' });
      const vzorky = [];
      for (const ms of [250, 600, 1000]) { await sleep(ms === 250 ? 250 : ms === 600 ? 350 : 400); vzorky.push(await videtelnyText(pg).catch(() => '(stránka se přenačítá)')); }
      ok(`${kde}: dokud se ověřuje účet, se nic z dat předchozího žáka neukazuje`, vzorky.every(t => !cizi(t)), vzorky.map(t => t.slice(0, 60)).join(' | '));
      ok(`${kde}: stránka je do rozhodnutí schovaná`, await pg.evaluate(() => getComputedStyle(document.documentElement).visibility === 'hidden').catch(() => true));
      await sleep(zpSession + 600);
      const pozdeji = [];
      for (let i = 0; i < 4; i++) { pozdeji.push(await videtelnyText(pg).catch(() => '')); await sleep(zpSaves ? 900 : 300); }
      ok(`${kde}: po přihlášení se cizí data nikdy neukážou (ani při pomalém stahování postav)`, pozdeji.every(t => !cizi(t)), pozdeji.map(t => t.slice(0, 60)).join(' | '));
      const st = await ulozeno(pg);
      const A_zbylo = [st.RPG_MAT_5 && JSON.parse(st.RPG_MAT_5).name === 'ADAM', st.RPG_HUB_WALLET && /4321/.test(st.RPG_HUB_WALLET),
        st.PZ_CERMAT_ATTEMPTS && /"score":41/.test(st.PZ_CERMAT_ATTEMPTS)].some(Boolean);
      ok(`${kde}: v tabletu nezbyla postava, kredity ani výsledky předchozího žáka a zařízení patří Betě`, !A_zbylo && st.RPG_CLOUD_OWNER === 'uB', JSON.stringify(Object.keys(st)));
      ok(`${kde}: stránka je po přihlášení odkrytá`, await pg.evaluate(() => getComputedStyle(document.documentElement).visibility !== 'hidden'));
      await ctx.close();
    } catch (e) { ok(`scénář 9 (${kde}) doběhl`, false, e.message.split('\n')[0]); }
  }

  /* ── 12) POMALÁ SÍŤ: getSession nedoběhne do 8 s. Pozdní přihlášení dřív nikdo nezpracoval (posluchač se napojoval až po
        úspěšném getSession), takže stránka zůstala „odhlášená“ s daty předchozího žáka. ── */
  try {
    reset(); SRV.user = B; SRV.zpozdeniSession = 9500;
    const { ctx, pg } = await zarizeni();
    await ulozDoTabletu(pg, CIZI_DATA);
    await pg.goto(base + '/projects/rpg-mat-5.html' + CERSTVE, { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => typeof window.__authCb === 'function', null, { timeout: 12000 }).catch(() => {});
    const napojeno = await pg.evaluate(() => typeof window.__authCb === 'function');
    ok('pomalá síť: po vypršení getSession (8 s) je posluchač přihlášení napojený', napojeno);
    SRV.zpozdeniSession = 0;                                            // po přenačtení už odpovídá rychle
    if (napojeno) {
      await Promise.all([pg.waitForEvent('load', { timeout: 10000 }).catch(() => {}),
        pg.evaluate((u) => window.__authCb('INITIAL_SESSION', { user: u }), B).catch(() => {})]);   // pozdní událost od knihovny
      await sleep(1800);
      const st = await ulozeno(pg);
      ok('pomalá síť: pozdní přihlášení vymění zařízení (cizí postava pryč, vlastník Beta)', st.RPG_CLOUD_OWNER === 'uB' && !(st.RPG_MAT_5 && JSON.parse(st.RPG_MAT_5).name === 'ADAM') && !st.RPG_HUB_WALLET?.includes('4321'),
        JSON.stringify(Object.keys(st)) + ' vlastník ' + st.RPG_CLOUD_OWNER);
      ok('pomalá síť: stránka ukazuje přihlášenou Betu, ne předchozího žáka', !cizi(await videtelnyText(pg)) && await pg.evaluate(() => !!window.RPGCloud.currentUser() && window.RPGCloud.currentUser().id === 'uB'));
    }
    await ctx.close();
  } catch (e) { ok('scénář 12 doběhl', false, e.message.split('\n')[0]); }


  /* ── 13) ODHLÁSIT SE NA MAPĚ KAŽDÉ HRY (10. 11. 2026, Vojta: „chci výraznější tlačítko“). Doménový žák úvod s lištou přeskočí, takže se
        dřív mohl odhlásit jen z profilu → NASTAVENÍ a na sdíleném tabletu zůstával přihlášený předchozí žák. Pruh `#map-cloud` s tlačítkem
        `#map-logout` je na mapě všech 7 her, ukazuje, kdo je přihlášený, má dotykovou plochu ≥ 44 px, na telefonu 360 px nepřetéká a
        odhlášený žák ho nevidí. ── */
  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    for (const [sirka, vyska] of [[1024, 768], [360, 740]]) {
      try {
        reset(); SRV.user = A; SRV.saves.set('uA|RPG_MAT_' + g, postava('ADAM', 5));
        const { ctx, pg } = await zarizeni();
        await pg.setViewportSize({ width: sirka, height: vyska });
        await ulozDoTabletu(pg, { RPG_CLOUD_OWNER: 'uA', ['RPG_MAT_' + g]: postava('ADAM', 5) });
        await pg.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'load' });
        await cekejNaMapu(pg);
        const m = await pg.evaluate(() => {
          const box = document.getElementById('map-cloud'), b = document.getElementById('map-logout'), nav = document.querySelector('#s-map .topnav');
          if (!box || !b) return null;
          const r = box.getBoundingClientRect(), rb = b.getBoundingClientRect(), rn = nav.getBoundingClientRect();
          const el = document.elementFromPoint(rb.left + rb.width / 2, rb.top + rb.height / 2);
          return { videt: box.offsetParent !== null && getComputedStyle(box).display !== 'none', text: box.textContent, vyska: b.offsetHeight,   /* offsetHeight: náběhová animace mapy prvek na chvíli zmenší */
            uvnitr: rb.left >= 0 && rb.right <= innerWidth + 0.5, pod: r.top >= rn.bottom - 1, zasah: el === b || b.contains(el),
            pretece: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        const kde = 'mapa ' + g + '. ročník ' + sirka + ' px';
        ok(kde + ': pruh s odhlášením je vidět a říká, kdo je přihlášený', !!m && m.videt && /Adam Prvni/.test(m.text), JSON.stringify(m && m.text));
        if (m) {
          ok(kde + ': tlačítko Odhlásit se má aspoň 44 px, je uvnitř okna a trefí se na něj', m.vyska >= 44 && m.uvnitr && m.zasah, `výška ${m.vyska}, uvnitř ${m.uvnitr}, zásah ${m.zasah}`);
          ok(kde + ': pruh leží pod horní lištou a stránka nepřetéká do šířky', m.pod && !m.pretece, `pod ${m.pod}, přetéká ${m.pretece}`);
        }
        if (g === 9 && sirka === 1024) {      // skutečné odhlášení tlačítkem z mapy
          await Promise.all([pg.waitForEvent('load', { timeout: 8000 }), pg.click('#map-logout')]);
          await sleep(600);
          const st = await ulozeno(pg);
          ok('mapa: odhlášení tlačítkem smaže data i vlastníka a hra je na úvodu', !('RPG_CLOUD_OWNER' in st) && !Object.keys(st).some(k => OSOBNI.test(k)) &&
            await pg.evaluate(() => document.getElementById('s-intro').classList.contains('active')), JSON.stringify(Object.keys(st)));
        }
        await ctx.close();
      } catch (e) { ok(`scénář 13 (${g}, ${sirka}) doběhl`, false, e.message.split('\n')[0]); }
    }
  }
  try {       // odhlášený žák pruh nevidí
    reset(); SRV.user = null;
    const { ctx, pg } = await zarizeni();
    await ulozDoTabletu(pg, {});
    await pg.goto(base + '/projects/rpg-mat-5.html', { waitUntil: 'load' }); await sleep(1200);
    ok('odhlášený žák: pruh s odhlášením na mapě není vidět', await pg.evaluate(() => { const b = document.getElementById('map-cloud'); return !b || b.offsetParent === null; }));
    await ctx.close();
  } catch (e) { ok('scénář 13 (odhlášený) doběhl', false, e.message.split('\n')[0]); }

  const re = errs.filter(e => !/ERR_CERT|net::|jsdelivr|supabase|Failed to fetch/i.test(e));
  ok('žádné JS chyby', re.length === 0, re.slice(0, 3).join(' | '));
  await browser.close(); srv.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
