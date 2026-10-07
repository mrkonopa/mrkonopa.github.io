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
const SRV = { user: null, saves: new Map(), pz: new Map(), zpozdeniSaves: 0, upserty: [] };
function reset() { SRV.user = null; SRV.saves.clear(); SRV.pz.clear(); SRV.zpozdeniSaves = 0; SRV.upserty = []; }
async function sb(op, arg) {
  if (op === 'session') return SRV.user;
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

const OSOBNI = /^(RPG_MAT_[0-9]|RPG_HUB_WALLET|PZ_(CERMAT_ATTEMPTS|PRACTICE_PROGRESS|DIAG_LAST|TEST_TOPICS))$/;

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
      PZ_CERMAT_ATTEMPTS: [{ date: '2026-10-01', score: 30, max: 50 }], RPG_HUB_STUPEN: '"2"' });
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

  // ── 3) data bez vlastníka + ČERSTVÉ přihlášení: zeptat se, „Zrušit“ smaže ──
  for (const volba of ['dismiss', 'accept']) {
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
      if (volba === 'dismiss') ok('bez vlastníka, Zrušit: Betin cloud zůstal její', vB && vB.name === 'BETA' && pocet(vB) === 3, vB ? vB.name + ':' + pocet(vB) : 'chybí');
      else ok('bez vlastníka, OK: postava se převzala do účtu (žák hrál bez přihlášení)', vB && vB.name === 'ADAM' && pocet(vB) === 20, vB ? vB.name + ':' + pocet(vB) : 'chybí');
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

  const re = errs.filter(e => !/ERR_CERT|net::|jsdelivr|supabase|Failed to fetch/i.test(e));
  ok('žádné JS chyby', re.length === 0, re.slice(0, 3).join(' | '));
  await browser.close(); srv.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
