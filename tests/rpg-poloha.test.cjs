/* ══════════════════════════════════════════════════════════════════════
   Infocentrum, etapa 2: „kde žák právě je“ — pole `cur` v cloudové kopii postavy.

   Hra (`rpg-cloud.js`) při odeslání postavy do tabulky `saves` přidá do KOPIE pole `cur` = {s: typ obrazovky, m: mise}
   spočítané z viditelné obrazovky; při změně obrazovky pošle postavu znovu (`polohaZmena`, odloženě). Učitelské infocentrum
   ho čte a ukazuje na kartě žáka. Test hraje všech 7 her se stavovým mockem Supabase (databáze žije v Node) a čte, co skutečně
   došlo do `saves`:
     1. mapa → boj v misi → mapa → trénink → trénink v misi → teorie → věž (6.–9.) → živý souboj → profil
     2. každá poloha dojde do cloudu do ~6 s a má přesný tvar ({s} / {s, m}), mise odpovídá té, kterou hráč otevřel
     3. mimo hru (profil) pole `cur` v cloudu není — ani když si žák do uložení napsal vlastní (nepřátelské) `cur`
     4. místní uložení (localStorage) pole `cur` nedostane: odesílá se kopie, ne stav hry
     5. stejná poloha znovu = žádný dotaz navíc (nepřetěžujeme databázi při každém přepnutí karty)
     6. `cur` nenese nic dalšího (žádné počty chyb)
   Sabotáže (4): bez hlídače obrazovek, bez smazání cizího `cur`, kopie je stav hry, bez porovnání s odeslanou polohou.
   Spusť: node tests/rpg-poloha.test.cjs
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

/* ── stavový „server“: saves podle uživatele; počítá odeslání a stažení ── */
const SRV = { saves: new Map(), upserty: new Map(), tahy: new Map() };
const inc = (m, k) => m.set(k, (m.get(k) || 0) + 1);
async function sb(user, op, arg) {
  if (op === 'session') return user;
  if (op === 'signout') return null;
  if (op === 'rpc') return { data: [], error: null };
  if (op === 'q') {
    const st = arg;
    if (st.table === 'saves' && st.op === 'select' && st.filters.user_id && st.filters.game) {
      const k = st.filters.user_id + '|' + st.filters.game;
      inc(SRV.tahy, k);
      const rec = SRV.saves.get(k);
      return { data: rec ? { data: JSON.parse(JSON.stringify(rec)) } : null, error: null };
    }
    if (st.table === 'saves' && st.op === 'upsert') {
      const p = st.payload, k = p.user_id + '|' + p.game;
      inc(SRV.upserty, k);
      SRV.saves.set(k, JSON.parse(JSON.stringify(p.data)));
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
    signOut: async () => ({ error: null }),
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

const postava = (g) => ({ name: 'ZAK' + g, xp: 30, level: 1, attrs: { calc: 1, geo: 0, anal: 0, craft: 0 }, done: { '1-1-0': true, '1-1-1': true }, inv: [], teacherUnlocked: [], tutorialDone: true });

let pass = 0, fail = 0;
const hlasky = [];
const ok = (n, c, d = '') => { if (c) pass++; else { fail++; hlasky.push('  ❌ ' + n + (d ? ' — ' + d : '')); } };

/* Jedna hra: jeden přihlášený žák, vlastní kontext. Vrací nic, výsledky jdou do ok(). */
async function hra(browser, base, g, zdrojCloud) {
  const p = 'g' + g + ': ';
  const user = { id: 'u' + g, email: 'zak' + g + '@husovaliberec.cz', user_metadata: { full_name: 'Žák Číslo' + g } };
  const klic = user.id + '|RPG_MAT_' + g;
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
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
  SRV.saves.set(klic, postava(g));
  await pg.goto(base + '/__prazdna');
  await pg.evaluate(([k, o, uid]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(o)); localStorage.setItem('RPG_CLOUD_OWNER', uid); }, ['RPG_MAT_' + g, postava(g), user.id]);
  await pg.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => document.querySelector('#s-map') && document.querySelector('#s-map').classList.contains('active'), null, { timeout: 10000 }).catch(() => {});

  const cur = () => (SRV.saves.get(klic) || {}).cur;
  const nyni = async () => JSON.stringify(cur() === undefined ? null : cur());
  /* počká, až se v cloudu objeví očekávaná poloha (null = pole nemá být) */
  async function cekej(jm, ocekavano, ms) {
    const cil = JSON.stringify(ocekavano), t0 = Date.now();
    while (Date.now() - t0 < (ms || 6500)) { if ((await nyni()) === cil) { ok(p + jm, true); if (process.env.POLOHA_LADENI) console.log('  [ladění] ' + p + jm + ' za ' + (Date.now() - t0) + ' ms, stažení ' + (SRV.tahy.get(klic) || 0) + ', odeslání ' + (SRV.upserty.get(klic) || 0)); return true; } await sleep(120); }
    ok(p + jm, false, 'v cloudu ' + (await nyni()) + ', čekáno ' + cil);
    return false;
  }
  const info = await pg.evaluate(() => ({ aid: AREAS[0].id, mid: AREAS[0].missions[0].id, mid2: AREAS[0].missions[1].id }));
  ok(p + 'mise mají tvar oblast-mise', /^[1-7]-[1-3]$/.test(info.mid) && /^[1-7]-[1-3]$/.test(info.mid2), JSON.stringify(info));

  // 1) mapa → boj → mapa
  await pg.evaluate(() => go('area')).catch(() => {});
  await pg.evaluate(() => go('map'));
  await cekej('mapa → cur {s: mapa}', { s: 'mapa' });
  await pg.evaluate(([a, m]) => launchBattle(a, m), [info.aid, info.mid]);
  await cekej('boj v misi ' + info.mid, { s: 'boj', m: info.mid });
  await pg.evaluate(() => saveS()); await sleep(1300);
  const mistni = await pg.evaluate(k => { const o = JSON.parse(localStorage.getItem(k) || 'null'); return o && ('cur' in o); }, 'RPG_MAT_' + g);
  ok(p + 'místní uložení pole cur nedostalo (odesílá se kopie)', mistni === false, 'cur v localStorage: ' + mistni);
  ok(p + 'cur nenese nic než s a m', Object.keys(cur() || {}).every(k => k === 's' || k === 'm'), JSON.stringify(cur()));
  await pg.evaluate(() => go('map'));
  await cekej('zpět na mapě', { s: 'mapa' });

  // 2) trénink
  await pg.evaluate(() => go('train'));
  await cekej('výběr tréninku → {s: trenink} bez mise', { s: 'trenink' });
  await pg.evaluate(m => startTrain(m), info.mid2);
  await cekej('trénink mise ' + info.mid2, { s: 'trenink', m: info.mid2 });

  // 3) teorie
  await pg.evaluate(m => startLearn(m), info.mid);
  await cekej('teorie mise ' + info.mid, { s: 'teorie', m: info.mid });

  // 4) věž (jen 6.–9. ročník)
  if (g >= 6) {
    await pg.evaluate(() => go('tower'));
    await cekej('věž legend', { s: 'vez' });
  }

  // 5) živý souboj leží přes mapu
  await pg.evaluate(() => go('map'));
  await cekej('mapa před živým soubojem', { s: 'mapa' });
  await pg.evaluate(k => RPGBattle.open({ name: 'ZAK', game: k }), 'RPG_MAT_' + g);
  await cekej('živý souboj', { s: 'souboj' });
  await pg.evaluate(() => RPGBattle.close());
  await cekej('po zavření souboje zpět na mapě', { s: 'mapa' });

  // 6) stejná poloha znovu → žádný dotaz navíc
  const t0 = SRV.tahy.get(klic) || 0, u0 = SRV.upserty.get(klic) || 0;
  for (let i = 0; i < 3; i++) await pg.evaluate(() => go('map'));
  await sleep(2600);
  ok(p + 'stejná poloha: žádné stažení ani odeslání navíc', (SRV.tahy.get(klic) || 0) === t0 && (SRV.upserty.get(klic) || 0) === u0,
    'stažení ' + t0 + '→' + (SRV.tahy.get(klic) || 0) + ', odeslání ' + u0 + '→' + (SRV.upserty.get(klic) || 0));

  // 7) mimo hru (profil) pole není — ani když si žák napsal vlastní
  await pg.evaluate(() => go('profile'));
  await cekej('profil: pole cur v cloudu není', null);
  await pg.evaluate(() => { S.cur = { s: 'boj', m: '1-1' }; saveS(); });
  await sleep(1800);
  ok(p + 'nepřátelské cur ze stavu hry se do cloudu nedostane', (await nyni()) === 'null', await nyni());
  await pg.evaluate(() => { delete S.cur; saveS(); });

  ok(p + 'bez výjimek na stránce', chyby.length === 0, chyby.join(' | '));
  await ctx.close();
}

async function bez(browser, base, hry, zdroj, jm) {
  const p0 = pass, f0 = fail, h0 = hlasky.length;
  await Promise.all(hry.map(g => hra(browser, base, g, zdroj).catch(e => ok('g' + g + ': scénář doběhl', false, String(e.message).split('\n')[0]))));
  const mal = fail - f0;
  return { mal, vypis: hlasky.splice(h0), pass0: p0, fail0: f0, jm };
}

(async () => {
  console.log('\n── Infocentrum, etapa 2: kde žák právě je (cur v cloudové kopii postavy) ──\n');
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC });
  const ZDROJ = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-cloud.js'), 'utf8');

  // ostrý běh: všech 7 her souběžně
  const t0 = Date.now();
  await Promise.all((process.env.POLOHA_HRY ? process.env.POLOHA_HRY.split(',').map(Number) : [3, 4, 5, 6, 7, 8, 9]).map(g => hra(browser, base, g, null).catch(e => ok('g' + g + ': scénář doběhl', false, String(e.message).split('\n')[0]))));
  hlasky.forEach(h => console.log(h));
  console.log('  (7 her souběžně za ' + Math.round((Date.now() - t0) / 1000) + ' s)');
  const mojePass = pass, mojeFail = fail;

  // sabotáže: každá musí shodit aspoň jednu kontrolu (na jedné hře z každého stupně)
  const SAB = [
    ['bez hlídače obrazovek', s => s.replace('      polohaStrazce();\n', '')],
    ['bez smazání cizího cur', s => s.replace('    delete kopie.cur;', '')],
    ['kopie je stav hry', s => s.replace('const kopie = Object.assign({}, obj);', 'const kopie = obj;')],
    ['bez porovnání s odeslanou polohou', s => s.replace("if (JSON.stringify(poloha()) === odeslanaPoloha) return;", '')],
  ];
  for (const [jm, zmena] of SAB) {
    const nove = zmena(ZDROJ);
    ok('sabotáž „' + jm + '“ se aplikovala', nove !== ZDROJ);
    if (nove === ZDROJ) continue;
    hlasky.length = 0;
    const p0 = pass, f0 = fail;
    await Promise.all([3, 9].map(g => hra(browser, base, g, nove).catch(() => { fail++; })));
    const chyceno = fail > f0;
    if (process.env.POLOHA_LADENI) { console.log('  [ladění] sabotáž „' + jm + '“ shodila:'); hlasky.forEach(h => console.log('    ' + h.trim())); }
    pass = p0; fail = f0; hlasky.length = 0;
    ok('sabotáž „' + jm + '“ je chycena', chyceno);
  }
  hlasky.forEach(h => console.log(h));
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌ (ostrý běh: ${mojePass} ✅ / ${mojeFail} ❌)\n`);
  await browser.close(); srv.close();
  process.exit(fail ? 1 : 0);
})();
