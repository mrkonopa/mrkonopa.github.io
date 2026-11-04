/* ══════════════════════════════════════════════════════════════════════
   Spolužáci uvidí můj vzhled z obchodu — žebříček třídy (fáze 28, `look_of`, klient v `rpg-cloud.js`).

   Hra po načtení žebříčku zavolá `look_of` pro hráče na řádcích a ke každému řádku přidá: rámeček s iniciálou před jméno,
   barvu jména, titul a mazlíčka za jméno. Test hraje hry 3 (1. stupeň) a 9 (2. stupeň) se stavovým mockem Supabase:
     1. spolužák s plným vzhledem: barva jména, rámeček i mazlíček se skutečně NAKRESLÍ (pixely), titul z katalogu, pořadí prvků v řádku
     2. spolužák bez vzhledu: řádek beze změny; spolužák s nepřátelským vzhledem (HTML, cizí kategorie, neznámé id): nic se nevykoná ani nevykreslí
     3. `look_of` se volá jednou za vykreslení s id hráčů z řádků a podruhé do minuty z paměti
     4. chybí-li fáze 28 (funkce neexistuje): žebříček vypadá jako dřív a nezkouší se znovu hned (5 min)
     5. strop 60 id na volání a odmítnutí id, která nejsou UUID
     6. na telefonu 390 px řádek nepřetéká a titul má aspoň 12 px
   Sabotáže (7): bez vykreslení vzhledu, bez paměti, bez ochranné lhůty po chybě, bez stropu 60, bez ověření UUID,
   rámeček za jménem místo před ním, bez zarovnání jmen.
   Spusť: node tests/rpg-look.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
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

const UID = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const ME = UID(1), MATE = UID(2), HOLY = UID(3), HOSTILNI = UID(4);
const JMENA = { [ME]: 'Já Sám', [MATE]: 'Bořek Silný', [HOLY]: 'Cyril Prostý', [HOSTILNI]: 'Dáša Zlá' };
/* co vrací `look_of` (server už ověřil; klient si ho ověří znovu) */
const LOOKY = {
  [ME]: { border: 'border-cyan' },
  [MATE]: { border: 'border-gold', badge: 'badge-purple', title: 'title-lovec', pet: 'pet-sova' },
  [HOSTILNI]: { border: '<img src=x onerror=window.__xss=1>', badge: 'badge-neexistuje', title: 'border-gold', pet: { a: 1 }, extra: 'x' },
};
const RADKY = [ME, MATE, HOLY, HOSTILNI].map((u, i) => ({ user_id: u, display_name: JMENA[u], xp: 500 - i * 100, lvl: 5 - i, is_me: u === ME }));

const SRV = { rpc: [], rezim: 'ok' };            // rezim: 'ok' | 'bez-faze-28'
async function sb(user, op, arg) {
  if (op === 'session') return user;
  if (op === 'signout') return null;
  if (op === 'rpc') {
    SRV.rpc.push({ name: arg.name, args: arg.args });
    if (arg.name === 'leaderboard') return { data: RADKY, error: null };
    if (arg.name === 'look_of') {
      if (SRV.rezim === 'bez-faze-28') return { data: null, error: { message: 'Could not find the function public.look_of' } };
      const ids = (arg.args && arg.args.p_ids) || [];
      return { data: ids.filter(i => LOOKY[i]).map(i => ({ user_id: i, look: LOOKY[i] })), error: null };
    }
    return { data: [], error: null };
  }
  if (op === 'q') {
    const st = arg;
    if (st.table === 'saves' && st.op === 'select' && st.filters.user_id && st.filters.game) return { data: null, error: null };
    return { data: st.single ? null : [], error: null };
  }
  return null;
}
const MOCK = `
window.supabase = { createClient: function () {
  const auth = {
    getSession: async () => { const u = await window.__sb('session'); return { data: { session: u ? { user: u } : null } }; },
    onAuthStateChange: (f) => { window.__authCb = f; return { data: { subscription: { unsubscribe() {} } } }; },
    signInWithOAuth: async () => ({}), signOut: async () => ({ error: null }),
  };
  function q(table) {
    const st = { table, filters: {}, op: 'select', payload: null, single: false };
    const h = {
      select() { return h; }, eq(k, v) { st.filters[k] = v; return h; },
      in() { return h; }, order() { return h; }, limit() { return h; }, gte() { return h; }, lte() { return h; },
      gt() { return h; }, neq() { return h; }, is() { return h; }, ilike() { return h; }, range() { return h; },
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

const postava = g => ({ name: 'JA' + g, xp: 30, level: 1, attrs: { calc: 1, geo: 0, anal: 0, craft: 0 }, done: { '1-1-0': true }, inv: [], teacherUnlocked: [], tutorialDone: true });

let pass = 0, fail = 0;
const hlasky = [];
const ok = (n, c, d = '') => { if (c) pass++; else { fail++; hlasky.push('  ❌ ' + n + (d ? ' — ' + d : '')); } };

async function hra(browser, base, g, zdrojCloud, sirka) {
  const p = 'g' + g + ': ';
  const user = { id: ME, email: 'ja@husovaliberec.cz', user_metadata: { full_name: 'Já Sám' } };
  const ctx = await browser.newContext({ viewport: { width: sirka || 1024, height: 768 } });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (!u.startsWith(base)) return r.abort();
    if (zdrojCloud && /\/projects\/rpg-cloud\.js(\?|$)/.test(u)) return r.fulfill({ status: 200, contentType: 'text/javascript', body: zdrojCloud });
    return r.continue();
  });
  await ctx.exposeFunction('__sb', (op, arg) => sb(user, op, arg));
  await ctx.addInitScript(MOCK);
  const pg = await ctx.newPage();
  const chyby = [];
  pg.on('pageerror', e => chyby.push(String(e.message).slice(0, 140)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  await pg.goto(base + '/__prazdna');
  await pg.evaluate(([k, o, uid]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(o)); localStorage.setItem('RPG_CLOUD_OWNER', uid); }, ['RPG_MAT_' + g, postava(g), ME]);
  await pg.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => document.querySelector('#s-map') && document.querySelector('#s-map').classList.contains('active'), null, { timeout: 10000 }).catch(() => {});
  await pg.waitForFunction(() => document.querySelectorAll('#map-leaderboard [data-uid]').length >= 4, null, { timeout: 8000 }).catch(() => {});
  await sleep(400);
  return { ctx, pg, chyby, p };
}

const radek = (pg, uid) => pg.evaluate(u => {
  const r = document.querySelector('#map-leaderboard [data-uid="' + u + '"]');
  if (!r) return null;
  const jm = r.querySelector('.lb-nm');
  const kids = Array.from(r.children).map(e => e.className || e.tagName);
  const barvy = c => { if (!c) return 0; const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i] > 40) n++; return n; };
  const av = r.querySelector('.lk-av canvas'), pet = r.querySelector('canvas.lk-pet'), tit = r.querySelector('.lk-title');
  return {
    trida: jm ? jm.className : '', text: jm ? jm.textContent : '', kids,
    av: !!av, avPix: barvy(av), pet: !!pet, petPix: barvy(pet), titul: tit ? tit.textContent : null,
    titulPx: tit ? parseFloat(getComputedStyle(tit).fontSize) : 0, jmSirka: jm ? jm.getBoundingClientRect().width : 0, jmX: jm ? Math.round(jm.getBoundingClientRect().left) : -1, jmCelkem: jm ? jm.scrollWidth : 0,
    imgs: r.querySelectorAll('img').length, sirka: r.scrollWidth, okno: r.clientWidth,
    poradi: { av: kids.findIndex(k => /lk-av/.test(k)), jm: kids.findIndex(k => /lb-nm|lk-col/.test(k)), pet: kids.findIndex(k => /lk-pet/.test(k)) }, titulPodJmenem: !!(tit && jm && tit.parentNode === jm.parentNode && jm.nextElementSibling === tit && tit.getBoundingClientRect().top >= jm.getBoundingClientRect().bottom - 2),
  };
}, uid);

async function scenarOk(browser, base, g, zdroj) {
  SRV.rpc = []; SRV.rezim = 'ok';
  const { ctx, pg, chyby, p } = await hra(browser, base, g, zdroj);
  const look1 = SRV.rpc.filter(c => c.name === 'look_of');
  ok(p + 'look_of se zavolalo jednou s id hráčů z řádků', look1.length === 1 && [ME, MATE, HOLY, HOSTILNI].every(u => (look1[0].args.p_ids || []).includes(u)), JSON.stringify(look1.map(c => c.args)));
  const m = await radek(pg, MATE);
  ok(p + 'spolužák: barva jména z katalogu (nm-purple)', m && /\bnm-purple\b/.test(m.trida), m && m.trida);
  ok(p + 'spolužák: rámeček je nakreslený (pixely)', m && m.av && m.avPix > 20, m && ('pixelů ' + m.avPix));
  ok(p + 'spolužák: mazlíček je nakreslený (pixely)', m && m.pet && m.petPix > 20, m && ('pixelů ' + m.petPix));
  ok(p + 'spolužák: titul z katalogu', m && m.titul === 'Lovec příkladů', m && m.titul);
  ok(p + 'spolužák: pořadí v řádku rámeček → jméno (se titulem pod ním) → mazlíček', m && m.poradi.av >= 0 && m.poradi.av < m.poradi.jm && m.poradi.jm < m.poradi.pet && m.titulPodJmenem, m && JSON.stringify([m.poradi, m.titulPodJmenem]));
  ok(p + 'titul má aspoň 12 px', m && m.titulPx >= 12, m && String(m.titulPx));
  ok(p + 'jméno spolužáka s plným vzhledem se vejde celé (šířka ≥ obsah)', m && m.jmSirka >= m.jmCelkem - 1, m && (m.jmSirka + ' < ' + m.jmCelkem));
  const h = await radek(pg, HOLY);
  ok(p + 'spolužák bez vzhledu: žádný rámeček, mazlíček ani titul, jen prázdné místo pro zarovnání', h && !h.av && !h.pet && h.titul === null && !/\bnm-/.test(h.trida) && h.kids.length === 5 && h.kids.includes('lk-av lk-prazdny'), h && JSON.stringify(h.kids));
  const z = await radek(pg, HOSTILNI);
  const xss = await pg.evaluate(() => window.__xss);
  ok(p + 'nepřátelský vzhled: nic se nevykoná ani nevykreslí', z && !z.av && !z.pet && z.titul === null && z.imgs === 0 && xss === undefined && !/\bnm-/.test(z.trida), z && JSON.stringify([z.kids, z.imgs, xss]));
  ok(p + 'jména všech řádků začínají na téže svislici', m && h && z && Math.abs(m.jmX - h.jmX) <= 1 && Math.abs(z.jmX - h.jmX) <= 1, [m && m.jmX, h && h.jmX, z && z.jmX].join(' / '));
  const ja = await radek(pg, ME);
  ok(p + 'já: rámeček z mého vzhledu', ja && ja.av && ja.avPix > 20, ja && String(ja.avPix));
  // druhé vykreslení do minuty = z paměti
  await pg.evaluate(k => RPGCloud.renderLeaderboardInto('map-leaderboard', k), 'RPG_MAT_' + g);
  await sleep(500);
  ok(p + 'druhé vykreslení do minuty nevolá look_of znovu', SRV.rpc.filter(c => c.name === 'look_of').length === 1, String(SRV.rpc.filter(c => c.name === 'look_of').length));
  const m2 = await radek(pg, MATE);
  ok(p + 'z paměti se vzhled vykreslí stejně', m2 && m2.av && m2.pet && m2.titul === 'Lovec příkladů');
  // strop 60 a UUID
  SRV.rpc = [];
  await pg.evaluate(() => RPGCloud.lookOf(Array.from({ length: 70 }, (_, i) => '10000000-0000-4000-8000-' + String(i).padStart(12, '0'))));
  const velke = SRV.rpc.filter(c => c.name === 'look_of');
  ok(p + 'strop: na jedno volání nejvýš 60 id', velke.length >= 1 && velke.every(c => c.args.p_ids.length <= 60), JSON.stringify(velke.map(c => c.args.p_ids.length)));
  SRV.rpc = [];
  await pg.evaluate(() => RPGCloud.lookOf(['x', '<b>onerror</b>', 5, null, {}, '../etc']));
  ok(p + 'id, která nejsou UUID, se na server neposílají', SRV.rpc.filter(c => c.name === 'look_of').length === 0, JSON.stringify(SRV.rpc));
  if (process.env.LOOK_SNIMEK && !zdroj) await pg.locator('#map-leaderboard').screenshot({ path: path.join(process.env.LOOK_SNIMEK, 'zebricek-g' + g + '.png') });
  ok(p + 'bez výjimek na stránce', chyby.length === 0, chyby.join(' | '));
  await ctx.close();
}

async function scenarBezFaze(browser, base, g, zdroj) {
  SRV.rpc = []; SRV.rezim = 'bez-faze-28';
  const { ctx, pg, chyby, p } = await hra(browser, base, g, zdroj);
  const m = await radek(pg, MATE), pocetPrvni = SRV.rpc.filter(c => c.name === 'look_of').length;
  ok(p + 'bez fáze 28: žebříček má všechny čtyři řádky se jmény', m && m.text === 'Bořek Silný', m && m.text);
  ok(p + 'bez fáze 28: žádný vzhled, řádek jako dřív', m && !m.av && !m.pet && m.titul === null && m.kids.length === 4, m && JSON.stringify(m.kids));
  await pg.evaluate(k => RPGCloud.renderLeaderboardInto('map-leaderboard', k), 'RPG_MAT_' + g);
  await pg.evaluate(k => RPGCloud.renderLeaderboardInto('map-leaderboard', k), 'RPG_MAT_' + g);
  await sleep(500);
  ok(p + 'bez fáze 28: po chybě se 5 min nezkouší znovu', pocetPrvni === 1 && SRV.rpc.filter(c => c.name === 'look_of').length === 1, pocetPrvni + ' → ' + SRV.rpc.filter(c => c.name === 'look_of').length);
  ok(p + 'bez fáze 28: bez výjimek na stránce', chyby.length === 0, chyby.join(' | '));
  await ctx.close();
}

async function scenarTelefon(browser, base, g, zdroj) {
  SRV.rpc = []; SRV.rezim = 'ok';
  const { ctx, pg, p } = await hra(browser, base, g, zdroj, 390);
  const m = await radek(pg, MATE);
  ok(p + 'telefon 390 px: řádek s plným vzhledem nepřetéká', m && m.sirka <= m.okno + 1, m && (m.sirka + ' > ' + m.okno));
  ok(p + 'telefon 390 px: vzhled je vidět', m && m.av && m.pet && m.titul, m && JSON.stringify(m.kids));
  ok(p + 'telefon 390 px: jméno spolužáka s plným vzhledem se vejde celé', m && m.jmSirka >= m.jmCelkem - 1 && m.jmSirka >= 70, m && (m.jmSirka + ' vs ' + m.jmCelkem));
  const hol = await radek(pg, HOLY);
  ok(p + 'telefon 390 px: řádek bez vzhledu má jméno celé', hol && hol.jmSirka >= hol.jmCelkem - 1, hol && (hol.jmSirka + ' < ' + hol.jmCelkem));
  if (process.env.LOOK_SNIMEK && !zdroj) await pg.locator('#map-leaderboard').screenshot({ path: path.join(process.env.LOOK_SNIMEK, 'zebricek-telefon.png') });
  await ctx.close();
}

(async () => {
  console.log('\n── Vzhled spolužáků v žebříčku třídy (look_of) ──\n');
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC });
  const ZDROJ = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-cloud.js'), 'utf8');
  const bez = e => String(e.message).split('\n')[0];

  for (const g of [3, 9]) {
    await scenarOk(browser, base, g, null).catch(e => ok('g' + g + ': scénář doběhl', false, bez(e)));
    await scenarBezFaze(browser, base, g, null).catch(e => ok('g' + g + ': scénář bez fáze doběhl', false, bez(e)));
  }
  await scenarTelefon(browser, base, 9, null).catch(e => ok('g9: telefon doběhl', false, bez(e)));
  hlasky.forEach(h => console.log(h));
  const mojePass = pass, mojeFail = fail;

  /* sabotáže: každá musí shodit aspoň jednu kontrolu */
  const SAB = [
    ['bez vykreslení vzhledu', s => s.replace('if (jm) lookDekoruj(radek, jm, getLook(radek));', ''), 'ok'],
    ['bez paměti', s => s.replace('if (c && ted - c.t < 60000)', 'if (false)'), 'ok'],
    ['bez ochranné lhůty po chybě', s => s.replace('lookChybaDo = ted + 300000;', 'lookChybaDo = 0;'), 'bez-faze'],
    ['bez stropu 60', s => s.replace('const ptam = chybi.slice(0, 60);', 'const ptam = chybi;'), 'ok'],
    ['bez ověření UUID', s => s.replace("!/^[0-9a-f-]{36}$/i.test(id)", 'false'), 'ok'],
    ['rámeček za jménem', s => s.replace('radek.insertBefore(av, jmenoEl);', 'radek.insertBefore(av, jmenoEl.nextSibling);'), 'ok'],
    ['bez zarovnání jmen', s => s.replace("if (!koren.querySelector('.lk-av')) return;", 'return;'), 'ok'],
  ];
  for (const [jm, zmena, kam] of SAB) {
    const nove = zmena(ZDROJ);
    ok('sabotáž „' + jm + '“ se aplikovala', nove !== ZDROJ);
    if (nove === ZDROJ) continue;
    hlasky.length = 0;
    const p0 = pass, f0 = fail;
    try { await (kam === 'bez-faze' ? scenarBezFaze : scenarOk)(browser, base, 9, nove); } catch (e) { fail++; }
    const chyceno = fail > f0;
    if (process.env.LOOK_LADENI) { console.log('  [ladění] sabotáž „' + jm + '“ shodila:'); hlasky.forEach(h => console.log('    ' + h.trim())); }
    pass = p0; fail = f0; hlasky.length = 0;
    ok('sabotáž „' + jm + '“ je chycena', chyceno);
  }
  hlasky.forEach(h => console.log(h));
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌ (ostrý běh: ${mojePass} ✅ / ${mojeFail} ❌)\n`);
  await browser.close(); srv.close();
  process.exit(fail ? 1 : 0);
})();
