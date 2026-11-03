/* ══════════════════════════════════════════════════════════════════
   Test: odměny za živý souboj z SERVERU (fáze 30) — klientská část.

   Server (claim_battle_rewards) odměnu spočítá a vydá jednou; hra ji jen použije.
   Dokazujeme:
     A) výsledková obrazovka (rpg-battle-ui.js): vyzvedne se PO zápisu výsledku, ukáže odměnu a
        hodnost, server bez fáze (null) → původní způsob právě jednou, chyba sítě (false) → nic,
        hub bez postavy → poznámka, odveta vyzvedává znovu, podvržená čísla nic nevloží do DOM;
     B) hra (7 ročníků 3.–9.): bojPouzij připíše XP a kredity (strop 180 XP, solo/0 XP nedává
        nic, ani odznaky), odznaky Týmový hráč / Série výher / Stálý bojovník, životní úspěch
        Šampion arény (25 výher), bojOdmena (zámek proti souběhu, nejvýš 1× za minutu mimo
        force), vyzvednutí při vykreslení mapy, panel s hodností v profilu (3.–5. ho vloží);
     C) 8 sabotáží (zdroj se mění jen v odpovědi serveru, soubory na disku ne).

   Spusť: node tests/rpg-boj-odmena.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const SHARED = fs.readFileSync(path.join(ROOT, 'projects/rpg-shared.js'), 'utf8');
const BOJ_UKAZKA = (() => {   // hodnost pro výsledkovou obrazovku (v hubu a v testu bez rpg-shared.js není)
  const i = SHARED.indexOf('const BOJ_HODNOSTI'), j = SHARED.indexOf('function _bojCislo');
  if (i < 0 || j < 0) throw new Error('v rpg-shared.js chybí BOJ_HODNOSTI / bojHodnost');
  return SHARED.slice(i, j);
})();

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isNoise = t => /Failed to load resource|ERR_CERT_AUTHORITY_INVALID|net::ERR_|supabase|jsdelivr/i.test(t);

/* server; `prepis` = [[jméno souboru, funkce(obsah) → nový obsah]] (jen odpověď, na disku se nic nemění) */
function serve(prepis) {
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { rep.writeHead(404); return rep.end('nf'); }
      let telo = fs.readFileSync(fp);
      const jmeno = path.basename(fp);
      for (const [k, f] of (prepis || [])) if (k === jmeno) telo = Buffer.from(f(telo.toString('utf8')), 'utf8');
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      rep.end(telo);
    });
    srv.listen(0, () => res(srv));
  });
}

/* ═══ A) výsledková obrazovka ═══ */
function harness(base) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>:root{--gold:#19e6e6}</style></head><body>
  <script>${BOJ_UKAZKA}</script><script>
    window.__poradi = []; window.__legacy = []; window.__claimN = 0; window.__rec = 0;
    window.RPGWallet = { getReducedMotion: () => true };
    window.RPG_BATTLE_9 = { build: function (seed, count) { var a = []; for (var i = 0; i < count; i++) a.push({ text: 'Otázka ' + (i + 1) + '?', choices: ['A', 'B', 'C', 'D'], correct: 0 }); return a; } };
    window.RPGCloud = {
      currentUser: () => ({ id: 'u-me' }), isStaff: () => false,
      createBattle: () => Promise.resolve({ id: 'b1', code: 'WXYZ' }),
      joinBattle: () => Promise.resolve({ id: 'b1', code: 'WXYZ' }),
      pollBattle: (id, cb) => { window.__cb = cb; return () => {}; },
      submitBattleAnswer: () => {}, advanceBattle: () => {}, setBattleStatus: () => {},
      listActiveBattles: () => Promise.resolve([]),
      recordBattleResult: () => { window.__rec++; window.__poradi.push('rec-start'); return new Promise(r => setTimeout(() => { window.__poradi.push('rec-hotovo'); r(true); }, 120)); },
      rematchBattle: () => Promise.resolve({ id: 'b1', code: 'WXYZ' }),
      claimBattleRewards: () => { /* jen aby existovala; skutečné chování řídí onReward níže */ }
    };
  </script><script src="${base}/projects/rpg-battle-ui.js"></script></body></html>`;
}

/* režim: 'objekt' | 'nula' | 'null' | 'false' | 'starsi' (hra bez onReward) | 'hub' (nic) | 'podvrh' */
async function scenarUI(browser, base, rezim, pocetKol) {
  const nez0 = fail;
  const ctx = await browser.newContext({ viewport: { width: 480, height: 820 } });
  const page = await ctx.newPage();
  const chyby = []; page.on('pageerror', e => chyby.push(e.message));
  await page.setContent(harness(base), { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.RPGBattle !== 'undefined', null, { timeout: 5000 });
  await page.evaluate(r => {
    window.__rezim = r;
    const odp = () => {
      window.__claimN++; window.__poradi.push('claim');
      if (r === 'null') return Promise.resolve(null);
      if (r === 'false') return Promise.resolve(false);
      var rw = { battle_id: 'b1', xp: 110, credits: 25, rank: 1, total: 2, correct: 5, q_count: 5, team: null, team_won: null };
      if (r === 'nula') rw = { battle_id: 'b1', xp: 0, credits: 0, rank: 1, total: 1 };
      if (r === 'podvrh') rw = { battle_id: 'b1', xp: '<img src=x onerror=window.__x=1>', credits: '<b>', rank: 1 };
      var stats = { points: r === 'podvrh' ? '<img src=x onerror=window.__x=2>' : 12902, played: 12, wins: 4 };
      return Promise.resolve({ rewards: [rw], stats: stats });
    };
    const o = { game: 'RPG_MAT_9', name: 'Me', autoAction: 'host', onResult: x => window.__legacy.push(x) };
    if (r === 'hub') delete o.onResult;
    else if (r !== 'starsi') o.onReward = odp;
    RPGBattle.open(o);
  }, rezim);
  await page.evaluate(() => RPGBattle._create(5));
  await page.waitForFunction(() => !!window.__cb, null, { timeout: 4000 });
  const P = (s, c) => ({ user_id: 'u-me', display_name: 'Me', score: s, correct_count: c, last_qi: 4 });
  const O = { user_id: 'u-op', display_name: 'Soupeř', score: 0, correct_count: 0, last_qi: 4 };
  const feed = st => page.evaluate(s => window.__cb(s), st);
  const konec = () => feed({ battle: { status: 'finished', q_seed: 7, q_count: 5, q_index: 5 }, players: [P(1200, 5), O], me: 'u-me' });
  await konec();
  await page.waitForFunction(() => /Konec souboje/.test(document.body.textContent), null, { timeout: 3000 });
  await sleep(450);
  for (let i = 0; i < 3; i++) { await konec(); await sleep(60); }    // opakované „finished“ nevyzvedává znovu
  const st = await page.evaluate(() => ({
    claimN: window.__claimN, legacy: window.__legacy.length, legacy0: window.__legacy[0] || null, poradi: window.__poradi.slice(),
    odm: (document.getElementById('rpgb-odmena') || {}).textContent || '', odmHtml: (document.getElementById('rpgb-odmena') || {}).innerHTML || '',
    x: window.__x || 0
  }));
  const r = rezim;
  if (r === 'objekt') {
    ok('A1 objekt: odměna vyzvednuta právě jednou', st.claimN === 1, 'claimN=' + st.claimN);
    ok('A1 objekt: po zápisu výsledku (rec-start, rec-hotovo, claim)', st.poradi.join(',') === 'rec-start,rec-hotovo,claim', st.poradi.join(','));
    ok('A1 objekt: ukáže „+110 XP · +25 kr“', /\+110 XP · \+25 kr/.test(st.odm), st.odm);
    ok('A1 objekt: ukáže hodnost Veterán a kolik chybí do dalšího stupně', /Veterán/.test(st.odm) && /Elitní bojovník/.test(st.odm) && /7098/.test(st.odm.replace(/\s/g, '')), st.odm);
    ok('A1 objekt: původní způsob se NEpoužije (žádné dvojí vyplacení)', st.legacy === 0, 'legacy=' + st.legacy);
  } else if (r === 'nula') {
    ok('A2 nula: vysvětlí, že odměna není', /odměna není/.test(st.odm) && !/\+0 XP/.test(st.odm), st.odm);
    ok('A2 nula: legacy se nepoužije', st.legacy === 0);
  } else if (r === 'null') {
    ok('A3 server bez fáze (null): původní způsob právě jednou', st.legacy === 1 && st.claimN === 1, 'legacy=' + st.legacy + ' claimN=' + st.claimN);
    ok('A3 null: předá pořadí, správné, skóre a počet otázek', !!st.legacy0 && st.legacy0.rank === 1 && st.legacy0.correct === 5 && st.legacy0.score === 1200 && st.legacy0.q_count === 5, JSON.stringify(st.legacy0));
  } else if (r === 'false') {
    ok('A4 chyba sítě (false): nevyplácí nic po starém ani neukazuje odměnu', st.legacy === 0 && st.odm === '', 'legacy=' + st.legacy + ' odm=' + st.odm);
  } else if (r === 'starsi') {
    ok('A5 starší hra bez onReward: původní způsob právě jednou', st.legacy === 1 && st.claimN === 0, 'legacy=' + st.legacy);
  } else if (r === 'hub') {
    ok('A6 hub bez postavy: poznámka, že se odměna připíše ve hře', /otevřeš některou hru/.test(st.odm) && st.claimN === 0 && st.legacy === 0, st.odm);
  } else if (r === 'podvrh') {
    ok('A7 podvržená čísla ze serveru nevloží do stránky nic (ani <img>)', st.x === 0 && !/<img|<b>/i.test(st.odmHtml) && !/\bNaN\b|undefined/.test(st.odm), st.odmHtml);
  }
  ok('A ' + r + ': žádné JS chyby', chyby.length === 0, chyby.slice(0, 2).join(' | '));
  if (r === 'objekt' && pocetKol) {
    // odveta: stav se vynuluje a druhé kolo vyzvedává znovu
    await page.evaluate(() => RPGBattle._rematch());
    await sleep(100);
    await feed({ battle: { status: 'lobby', code: 'WXYZ', q_seed: 9, q_count: 5, q_index: -1 }, players: [{ user_id: 'u-me', display_name: 'Me' }, { user_id: 'u-op', display_name: 'Soupeř' }], me: 'u-me' });
    await konec();
    await page.waitForFunction(() => window.__claimN >= 2, null, { timeout: 3000 }).catch(() => {});
    await sleep(300);
    const n2 = await page.evaluate(() => ({ claimN: window.__claimN, odm: (document.getElementById('rpgb-odmena') || {}).textContent || '' }));
    ok('A8 odveta: druhé kolo vyzvedne odměnu znovu (a ukáže ji)', n2.claimN === 2 && /\+110 XP/.test(n2.odm), JSON.stringify(n2));
  }
  await ctx.close();
  return fail - nez0;
}

/* ═══ B) hra ═══ */
async function scenarHra(browser, base, g, kratce) {
  const nez0 = fail;
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1000 } });
  const page = await ctx.newPage();
  const chyby = []; page.on('console', m => { if (m.type() === 'error' && !isNoise(m.text())) chyby.push(m.text()); });
  page.on('pageerror', e => { if (!isNoise(e.message)) chyby.push(e.message); });
  const T = 'g' + g + ': ';
  await page.goto(`${base}/projects/rpg-mat-${g}.html`, { waitUntil: 'load' });
  await page.waitForSelector('#ni', { timeout: 8000 });
  await page.fill('#ni', 'TESTER');
  await page.evaluate(() => startGame());
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), null, { timeout: 8000 });
  await page.evaluate(() => { try { if (S.tutorialDone !== true) { S.tutorialDone = true; } } catch (e) {} });

  // odznaky jsou ve hře definované a mají ikonu
  const ach = await page.evaluate(() => ['battleteam', 'battlestreak3', 'battle10'].map(id => { const a = ACH.find(x => x.id === id); return a ? { id, ic: a.ic, ok: typeof RPGIcons === 'undefined' || RPGIcons.has(a.ic), nm: a.nm } : { id, chybi: true }; }));
  ok(T + 'ACH: Týmový hráč, Série výher, Stálý bojovník jsou definované s platnou ikonou', ach.every(a => !a.chybi && a.ok), JSON.stringify(ach));

  // hodnost
  const h = await page.evaluate(() => [0, 1999, 2000, 7999, 8000, 100000, 1e9, -5, NaN, Infinity, '12abc', null].map(b => { const x = bojHodnost(b); return x.nm + ':' + x.pct; }));
  ok(T + 'bojHodnost: hranice 0/1999/2000/…/100000 a nesmysly (NaN, −5, Infinity) nespadnou',
    h[0].startsWith('Nováček') && h[1].startsWith('Nováček:99') && h[2].startsWith('Bojovník:0') && h[4].startsWith('Veterán') && h[5].startsWith('Legenda arény:100') && h[7].startsWith('Nováček') && h[8].startsWith('Nováček') && h[10].startsWith('Nováček'), h.join(' | '));

  // připsání odměny
  const stav = () => page.evaluate(() => ({ xp: S.xp, kr: _walletBal(), ach: Object.keys(S.ach || {}) }));
  const pred = await stav();
  const o1 = await page.evaluate(() => bojPouzij({
    rewards: [{ battle_id: 'a', xp: 110, credits: 25, rank: 1, total: 3, correct: 10, q_count: 10 }],
    stats: { played: 10, wins: 4, team_wins: 1, streak: 3, points: 5000 }
  }));
  const po = await stav();
  ok(T + 'bojPouzij: +110 XP a +25 kr na postavu', o1.xp === 110 && o1.kr === 25 && po.xp - pred.xp === 110 && po.kr - pred.kr === 25, JSON.stringify([o1, pred.xp, po.xp, pred.kr, po.kr]));
  ok(T + 'bojPouzij: odznaky První klání, Bojovník, Bezchybný + Týmový hráč, Série výher, Stálý bojovník',
    ['battle1', 'battlewin', 'battleflawless', 'battleteam', 'battlestreak3', 'battle10'].every(i => po.ach.includes(i)), po.ach.join(','));
  const ulozeno = await page.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), 'RPG_MAT_' + g);
  ok(T + 'bojPouzij: XP je uložené (saveS)', ulozeno.xp === po.xp, ulozeno.xp + ' vs ' + po.xp);

  // solo / nulová odměna nedá nic (ani odznak) — čerstvá postava
  await page.evaluate(() => { S.ach = {}; });
  const o0 = await page.evaluate(() => bojPouzij({ rewards: [{ battle_id: 'b', xp: 0, credits: 0, rank: 1, total: 1, correct: 5, q_count: 5 }], stats: { played: 0, wins: 0, team_wins: 0, streak: 0 } }));
  const ach0 = await page.evaluate(() => Object.keys(S.ach || {}).filter(i => /^battle/.test(i)));
  ok(T + 'nulová odměna (solo, málo odpovědí): žádné XP ani odznak', o0.xp === 0 && o0.kr === 0 && ach0.length === 0, JSON.stringify([o0, ach0]));

  // strop 180 XP a podvržená čísla
  const x0 = (await stav()).xp;
  const oc = await page.evaluate(() => bojPouzij({ rewards: [{ xp: 110, credits: 25, rank: 1 }, { xp: 110, credits: 25, rank: 2 }, { xp: 1e9, credits: 1e9, rank: 1 }, { xp: -50, credits: -9 }, { xp: '<b>x</b>', credits: 'NaN' }, null, 7, 'x'], stats: { played: '<i>', wins: {}, team_wins: [], streak: Infinity } }));
  const x1 = (await stav()).xp;
  ok(T + 'strop 180 XP najednou, záporná/nečíselná/cizí hodnoty se ignorují a nespadnou', oc.xp === 180 && x1 - x0 === 180, JSON.stringify([oc, x0, x1]));
  const sx = await page.evaluate(() => { const r = bojPouzij(null); const r2 = bojPouzij({}); const r3 = bojPouzij({ rewards: 'x', stats: 5 }); return [r, r2 && r2.xp, r3 && r3.xp]; });
  ok(T + 'bojPouzij(null / {} / nesmysl) nespadne', sx[0] === null && sx[1] === 0 && sx[2] === 0, JSON.stringify(sx));

  // životní úspěch Šampion arény (25 výher), jen když ho dosud nemá
  const wa = await page.evaluate(() => { const bez = RPGWallet.owns('title-sampion-areny'); bojPouzij({ rewards: [], stats: { wins: 24 } }); const m24 = RPGWallet.owns('title-sampion-areny'); bojPouzij({ rewards: [], stats: { wins: 25 } }); return [bez, m24, RPGWallet.owns('title-sampion-areny')]; });
  ok(T + '25 výher → titul Šampion arény (24 ještě ne)', wa[0] === false && wa[1] === false && wa[2] === true, JSON.stringify(wa));

  // bojOdmena: server, zámek, zpoždění
  await page.evaluate(() => {
    window.__claims = 0; window.__odp = { rewards: [], stats: { played: 1, wins: 0, team_wins: 0, streak: 0, points: 100 } }; window.__zpozdit = 0;
    RPGCloud.currentUser = () => ({ id: 'u1' });
    RPGCloud.claimBattleRewards = () => { window.__claims++; return new Promise(r => setTimeout(() => r(window.__odp), window.__zpozdit)); };
  });
  const c1 = await page.evaluate(async () => { const r = await bojOdmena(); return [!!r && typeof r === 'object', window.__claims]; });
  ok(T + 'bojOdmena: vyzvedne od serveru', c1[0] === true && c1[1] === 1, JSON.stringify(c1));
  const c2 = await page.evaluate(async () => { const r = await bojOdmena(); return [r, window.__claims]; });
  ok(T + 'bojOdmena: do minuty podruhé nevolá server (false)', c2[0] === false && c2[1] === 1, JSON.stringify(c2));
  const c3 = await page.evaluate(async () => { const r = await bojOdmena({ force: true }); return [!!r && typeof r === 'object', window.__claims]; });
  ok(T + 'bojOdmena({force}) hned po souboji vyzvedne i do minuty', c3[0] === true && c3[1] === 2, JSON.stringify(c3));
  const c4 = await page.evaluate(async () => { window.__zpozdit = 150; const a = bojOdmena({ force: true }), b = bojOdmena({ force: true }); const v = await Promise.all([a, b]); window.__zpozdit = 0; return [v.map(x => x === false ? 'f' : (x && typeof x === 'object' ? 'o' : String(x))).join(','), window.__claims]; });
  ok(T + 'dvě souběžná vyzvednutí: server jednou (zámek)', c4[0] === 'o,f' && c4[1] === 3, JSON.stringify(c4));
  const c5 = await page.evaluate(async () => { window.__odp = null; const r = await bojOdmena({ force: true }); window.__odp = false; const r2 = await bojOdmena({ force: true }); return [r, r2]; });
  ok(T + 'bojOdmena: server bez fáze → null, chyba → false (nikdy nevyplácí sama)', c5[0] === null && c5[1] === false, JSON.stringify(c5));
  const c6 = await page.evaluate(async () => { RPGCloud.currentUser = () => null; const r = await bojOdmena({ force: true }); RPGCloud.currentUser = () => ({ id: 'u1' }); return r; });
  ok(T + 'bojOdmena bez přihlášení → null', c6 === null, String(c6));

  // vykreslení mapy vyzvedne odměny (jednou za minutu), hub a zavřené stránky se tak dohoní
  const m = await page.evaluate(async () => {
    window.__odp = { rewards: [{ battle_id: 'm', xp: 30, credits: 10, rank: 3, total: 4, correct: 6, q_count: 10 }], stats: { played: 3, wins: 0, team_wins: 0, streak: 0, points: 900 } };
    const xp0 = S.xp, c0 = window.__claims;
    _bojCas = 0;
    renderMap(); await new Promise(r => setTimeout(r, 120));
    renderMap(); renderMap(); await new Promise(r => setTimeout(r, 120));
    return [window.__claims - c0, S.xp - xp0];
  });
  ok(T + 'renderMap vyzvedne odměnu jednou (další překreslení do minuty ne) a připíše ji', m[0] === 1 && m[1] === 30, JSON.stringify(m));

  // profil: hodnost, ukazatel, souhrn; 3.–5. ročník panel vloží před NASTAVENÍ
  await page.evaluate(() => { window.__prof = { played: 12, wins: 4, team_wins: 2, points: 12902, best: 14320, correct: 80, wrong: 20, streak: 3 }; RPGCloud.battleProfile = () => Promise.resolve(window.__prof); go('profile'); });
  await page.waitForFunction(() => document.querySelector('#s-profile')?.classList.contains('active'), null, { timeout: 4000 });
  await page.waitForFunction(() => { const p = document.getElementById('pr-battle'); return p && p.style.display !== 'none'; }, null, { timeout: 3000 }).catch(() => {});
  const pr = await page.evaluate(() => { const p = document.getElementById('pr-battle'); return { vis: !!p && p.style.display !== 'none', txt: p ? p.textContent.replace(/\s+/g, ' ') : '', n: document.querySelectorAll('#pr-battle').length, predNast: !!p && !!document.getElementById('pr-rm') && !!(p.compareDocumentPosition(document.getElementById('pr-rm').closest('.panel')) & Node.DOCUMENT_POSITION_FOLLOWING) }; });
  ok(T + 'profil: panel Živé souboje ukáže hodnost Veterán, 12 soubojů, 4 výhry, 80 % správně, sérii',
    pr.vis && /Veterán/.test(pr.txt) && /12 soubojů/.test(pr.txt) && /4 výher/.test(pr.txt) && /80 %/.test(pr.txt) && /série 3/.test(pr.txt) && /Elitní bojovník/.test(pr.txt), pr.txt);
  ok(T + 'profil: panel je jen jednou (opakované vykreslení ho nezdvojí)', await page.evaluate(() => { bojProfil(); bojProfil(); return document.querySelectorAll('#pr-battle').length === 1; }));
  if (g <= 5) ok(T + 'profil (1. stupeň): vložený panel stojí PŘED nastavením', pr.predNast);
  // bez bodů (starší server) zůstane původní souhrn bez hodnosti; bez přihlášení se panel schová
  const stary = await page.evaluate(async () => { RPGCloud.battleProfile = () => Promise.resolve(null); RPGCloud.battleStatsMe = () => Promise.resolve({ played: 5, wins: 2, correct: 20, wrong: 5 }); await bojProfil(); const p = document.getElementById('pr-battle'); return [p.style.display !== 'none', /5 soubojů/.test(p.textContent), /Nováček|hodnost/i.test(p.textContent)]; });
  ok(T + 'profil: bez fáze 30 zůstane dřívější souhrn (bez hodnosti)', stary[0] && stary[1] && !stary[2], JSON.stringify(stary));
  const skryt = await page.evaluate(async () => { RPGCloud.currentUser = () => null; await bojProfil(); return document.getElementById('pr-battle').style.display === 'none'; });
  ok(T + 'profil: bez přihlášení se panel schová', skryt);
  const xss = await page.evaluate(async () => { RPGCloud.currentUser = () => ({ id: 'u' }); RPGCloud.battleProfile = () => Promise.resolve({ played: '<img src=x onerror=window.__y=1>', wins: 3, points: '<b>9</b>', best: '<i>' }); await bojProfil(); return [!!window.__y, document.querySelectorAll('#pr-battle img,#pr-battle b b,#pr-battle i i').length]; });
  ok(T + 'profil: podvržená čísla ze serveru nevloží do stránky značky', xss[0] === false && xss[1] === 0, JSON.stringify(xss));

  ok(T + 'žádné JS chyby', chyby.length === 0, chyby.slice(0, 2).join(' | '));
  await ctx.close();
  return fail - nez0;
}

(async () => {
  console.log('\n── Odměny za živý souboj (klient, fáze 30) ──\n');
  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] });
  const mimoSabotaz = { ui: 0, hra: 0 };
  try {
    console.log('A) výsledková obrazovka');
    const srv = await serve();
    const base = `http://127.0.0.1:${srv.address().port}`;
    for (const r of ['objekt', 'nula', 'null', 'false', 'starsi', 'hub', 'podvrh']) await scenarUI(browser, base, r, r === 'objekt');
    console.log('\nB) hry 3–9');
    const hry = (process.env.HRY || '3,4,5,6,7,8,9').split(',').map(Number);
    for (const g of hry) { console.log('  — ročník ' + g); await scenarHra(browser, base, g); }
    srv.close();

    console.log('\nC) sabotáže (zdroj se mění jen v odpovědi serveru)');
    const SAB = [
      ['bojPouzij počítá i nulové odměny (solo dostane odznak)', 'rpg-shared.js', 'if(x<=0)return;', '', 'hra'],
      ['bez stropu 180 XP', 'rpg-shared.js', 'xp=Math.min(xp,180);', '', 'hra'],
      ['evalAch nezná battleStats', 'rpg-shared.js', "if((bs.team_wins|0)>=1)unlockAch('battleteam');", '', 'hra'],
      ['bojOdmena bez zámku proti souběhu', 'rpg-shared.js', 'if(_bojBezi)return Promise.resolve(false);', '', 'hra'],
      ['bojOdmena bez omezení na jednou za minutu', 'rpg-shared.js', 'if(!o.force&&ted-_bojCas<60000)return Promise.resolve(false);', '', 'hra'],
      ['renderMap nevyzvedává', 'rpg-mat-9.html', "if(typeof bojOdmena==='function')bojOdmena();", '', 'hra'],
      ['chyba sítě se bere jako „server odměny nemá“ (vyplatí po starém)', 'rpg-battle-ui.js', 'if (res === null) { starySpusob(); return; }', 'if (!res) { starySpusob(); return; }', 'ui'],
      ['výsledek se vyzvedává dřív, než se zapíše', 'rpg-battle-ui.js', 'Promise.resolve(B.recP).then(function () { return onReward(); })', 'Promise.resolve(true).then(function () { return onReward(); })', 'ui']
    ];
    for (const [jm, soubor, od, na, druh] of SAB) {
      const zdroj = fs.readFileSync(path.join(ROOT, 'projects', soubor), 'utf8');
      if (!zdroj.includes(od)) { ok('sabotáž se neaplikovala (vzor v ' + soubor + ' chybí): ' + jm, false); continue; }
      const s2 = await serve([[soubor, t => t.replace(od, na)]]);
      const b2 = `http://127.0.0.1:${s2.address().port}`;
      const log = console.log; console.log = () => {};
      const p0 = pass, f0 = fail;
      try {
        if (druh === 'ui') { for (const r of ['objekt', 'null', 'false']) await scenarUI(browser, b2, r, false); }
        else await scenarHra(browser, b2, 9);
      } catch (e) { fail++; }
      const nezdary = fail - f0; pass = p0; fail = f0; console.log = log;
      ok('sabotáž chycena: ' + jm + ' (' + nezdary + ' nezdarů)', nezdary > 0);
      s2.close();
    }
  } catch (e) {
    ok('běh bez výjimky', false, e.stack || e.message);
  } finally { await browser.close(); }
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
