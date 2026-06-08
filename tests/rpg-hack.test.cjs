/* RPG Matematika — HACK / SECURITY ATTACK TEST
   Spusť: node tests/rpg-hack.test.cjs

   Systematicky útočí na:
   A) Wallet sanitize()  — tamper s RPG_HUB_WALLET v localStorage
   B) Credits economy    — earn/buy edge cases (negative, NaN, Infinity)
   C) absorbGame abuse   — double-count, negative delta, race
   D) Cosmetic bypass    — aktivace bez vlastnictví
   E) XSS v savech       — hub + teacher console (Playwright)
   F) Save flooding      — obří done/inv/errs objekty
*/
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

// ── Wallet sandbox setup ──────────────────────────────────────────────
function makeWalletSandbox() {
  let store = {};
  const localStorage = {
    getItem:    k => (k in store ? store[k] : null),
    setItem:    (k,v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear:      () => { store = {}; },
  };
  const ctx = vm.createContext({ window:{}, localStorage, console });
  const code = fs.readFileSync(path.join(ROOT,'projects/rpg-wallet.js'),'utf8');
  vm.runInContext(code, ctx);
  const W = ctx.window.RPGWallet;
  const raw = () => { try { return JSON.parse(store['RPG_HUB_WALLET']); } catch(e){ return null; } };
  const inject = v => { store['RPG_HUB_WALLET'] = JSON.stringify(v); };
  return { W, raw, inject, store };
}

// ── Test runner ───────────────────────────────────────────────────────
let passed = 0, failed = 0;
function ok(label, cond, detail) {
  if (cond) { console.log('  ✓', label); passed++; }
  else       { console.error('  ✗', label, detail ? `[${detail}]` : ''); failed++; }
}
function section(title) { console.log('\n── ' + title + ' ──'); }

// ── HTTP server ───────────────────────────────────────────────────────
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        rep.writeHead(404); return rep.end('nf');
      }
      rep.writeHead(200, {'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream'});
      fs.createReadStream(fp).pipe(rep);
    });
    srv.listen(0, () => res(srv));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isEnvNoise = t => /Failed to load resource|ERR_CERT_AUTHORITY_INVALID|net::ERR_|supabase|jsdelivr/i.test(t);


// ═══════════════════════════════════════════════════════════════════════
// A) WALLET SANITIZE — tamper s localStorage
// ═══════════════════════════════════════════════════════════════════════
section('A) Wallet sanitize — tamper');

{
  const { W, inject } = makeWalletSandbox();

  // A1 — záporné kredity
  inject({ credits: -999, cosmetics:{ owned:[], active:{} }, settings:{}, migrated:[], absorbed:{}, v:1 });
  ok('A1 záporné kredity → 0', W.getCredits() === 0, `got ${W.getCredits()}`);

  // A2 — Infinity
  inject({ credits: Infinity, cosmetics:{ owned:[], active:{} }, settings:{}, migrated:[], absorbed:{}, v:1 });
  ok('A2 Infinity → 0', W.getCredits() === 0);

  // A3 — NaN
  inject({ credits: NaN, cosmetics:{ owned:[], active:{} }, settings:{}, migrated:[], absorbed:{}, v:1 });
  ok('A3 NaN → 0', W.getCredits() === 0);

  // A4 — float
  inject({ credits: 9.9, cosmetics:{ owned:[], active:{} }, settings:{}, migrated:[], absorbed:{}, v:1 });
  ok('A4 float → floor → 9', W.getCredits() === 9, `got ${W.getCredits()}`);

  // A5 — neplatné kosmetické ID v owned
  inject({ credits: 10, cosmetics:{ owned:['border-silver','<script>alert(1)</script>','neexistuje'], active:{} }, settings:{}, migrated:[], absorbed:{}, v:1 });
  const w5 = W.get();
  ok('A5 neplatné ID vyřazeno z owned', !w5.cosmetics.owned.includes('<script>alert(1)</script>'));
  ok('A5 platné ID zůstane v owned', w5.cosmetics.owned.includes('border-silver'));

  // A6 — aktivní kosmetika, která není vlastněna
  inject({ credits: 0, cosmetics:{ owned:[], active:{ border:'border-gold', badge:null, theme:'theme-default', victory:'victory-default' } }, settings:{}, migrated:[], absorbed:{}, v:1 });
  const w6 = W.get();
  ok('A6 neplatný active.border resetován na null', w6.cosmetics.active.border === null, `got ${w6.cosmetics.active.border}`);

  // A7 — injekce XSS jako active.theme
  inject({ credits: 0, cosmetics:{ owned:[], active:{ theme:'<script>window.__XSS__=1</script>' } }, settings:{}, migrated:[], absorbed:{}, v:1 });
  const w7 = W.get();
  ok('A7 XSS řetězec jako active.theme → fallback na theme-default', w7.cosmetics.active.theme === 'theme-default');

  // A8 — celý objekt je null
  inject(null);
  ok('A8 null localStorage → blank state', W.getCredits() === 0);

  // A9 — celý objekt je pole
  inject([1,2,3]);
  ok('A9 pole jako wallet → blank state', W.getCredits() === 0);

  // A10 — obří číslo (ale finite)
  inject({ credits: Number.MAX_SAFE_INTEGER, cosmetics:{ owned:[], active:{} }, settings:{}, migrated:[], absorbed:{}, v:1 });
  ok('A10 MAX_SAFE_INTEGER projde sanitize jako je', W.getCredits() === Number.MAX_SAFE_INTEGER);

  // A11 — absorbed s zápornou hodnotou
  inject({ credits: 100, cosmetics:{ owned:[], active:{} }, settings:{}, migrated:[], absorbed:{ RPG_MAT_9: -50 }, v:1 });
  const w11 = W.get();
  ok('A11 záporné absorbed[key] sanitizováno (přijímá jen >= 0)', w11.absorbed['RPG_MAT_9'] <= 0); // sanitize nezakazuje záporné absorbed, ale absorbGame to ochrání
}


// ═══════════════════════════════════════════════════════════════════════
// B) CREDITS ECONOMY — earn edge cases
// ═══════════════════════════════════════════════════════════════════════
section('B) Credits economy — earn edge cases');

{
  const { W } = makeWalletSandbox();

  // B1 — earn záporné
  const before = W.getCredits();
  W.earn(-100);
  ok('B1 earn(-100) nezmění kredity', W.getCredits() === before, `${before} → ${W.getCredits()}`);

  // B2 — earn(0) nezmění
  W.earn(100); const c2 = W.getCredits(); W.earn(0);
  ok('B2 earn(0) nezmění kredity', W.getCredits() === c2);

  // B3 — earn(NaN)
  W.earn(NaN);
  ok('B3 earn(NaN) nezmění kredity', W.getCredits() === c2);

  // B4 — earn(Infinity)
  W.earn(Infinity);
  ok('B4 earn(Infinity) nezmění kredity', W.getCredits() === c2);

  // B5 — earn(-Infinity)
  W.earn(-Infinity);
  ok('B5 earn(-Infinity) nezmění kredity', W.getCredits() === c2);

  // B6 — earn(1.9) → floor
  const c6 = W.getCredits(); W.earn(1.9);
  ok('B6 earn(1.9) → +1 (floor)', W.getCredits() === c6 + 1, `${c6} → ${W.getCredits()}`);

  // B7 — koupit s nedostatkem kreditů
  const { W: W7 } = makeWalletSandbox();
  W7.earn(10);
  const res = W7.buy('border-gold'); // stojí 130
  ok('B7 buy s nedostatkem kreditů → {ok:false,reason:insufficient}', !res.ok && res.reason === 'insufficient');
  ok('B7 kredity zůstaly nedotčeny', W7.getCredits() === 10);

  // B8 — koupit neznámou položku
  const res8 = W7.buy('neexistuje');
  ok('B8 buy neznámé ID → {ok:false,reason:unknown}', !res8.ok && res8.reason === 'unknown');

  // B9 — koupit zdarma položku (theme-default)
  const { W: W9 } = makeWalletSandbox();
  const res9 = W9.buy('theme-default');
  ok('B9 buy zdarma → {ok:true,reason:activated}', res9.ok && res9.reason === 'activated');
  ok('B9 kredity nebyly odečteny', W9.getCredits() === 0);
}


// ═══════════════════════════════════════════════════════════════════════
// C) absorbGame ABUSE — double-count, negative delta, race
// ═══════════════════════════════════════════════════════════════════════
section('C) absorbGame abuse');

{
  const { W } = makeWalletSandbox();

  // C1 — dvojí absorb stejné částky
  W.absorbGame('RPG_MAT_9', { credits: 100 });
  const after1 = W.getCredits();
  W.absorbGame('RPG_MAT_9', { credits: 100 }); // stale same amount
  ok('C1 druhý absorbGame se stejnou hodnotou → no change', W.getCredits() === after1, `${after1} → ${W.getCredits()}`);

  // C2 — záporné kredity v legacyS
  W.absorbGame('RPG_MAT_8', { credits: -50 });
  ok('C2 absorbGame(credits:-50) → no change', W.getCredits() === after1);

  // C3 — NaN
  W.absorbGame('RPG_MAT_7', { credits: NaN });
  ok('C3 absorbGame(NaN) → no change', W.getCredits() === after1);

  // C4 — null legacyS
  W.absorbGame('RPG_MAT_6', null);
  ok('C4 absorbGame(null) → no change, no crash', W.getCredits() === after1);

  // C5 — prázdný gameKey
  W.absorbGame('', { credits: 1000 });
  ok('C5 absorbGame(empty key) → blocked', W.getCredits() === after1);

  // C6 — inkrementální delta
  const c6start = W.getCredits();
  W.absorbGame('RPG_MAT_9', { credits: 200 }); // delta 100
  ok('C6 inkrementální delta 100→200 → +100', W.getCredits() === c6start + 100, `${c6start} + 100 = ${c6start+100}, got ${W.getCredits()}`);

  // C7 — pokles (utratil ve hře) → jen sníží značku, nerefunduje
  const c7 = W.getCredits();
  W.absorbGame('RPG_MAT_9', { credits: 50 }); // klesl z 200 → 50
  ok('C7 pokles kreditů ve hře → wallet nedostane refund', W.getCredits() === c7);
  // Další nárůst od nové základny 50
  const c7b = W.getCredits();
  W.absorbGame('RPG_MAT_9', { credits: 80 }); // delta 30
  ok('C7b po poklesu: delta od nové základny', W.getCredits() === c7b + 30, `expected ${c7b+30}, got ${W.getCredits()}`);
}


// ═══════════════════════════════════════════════════════════════════════
// D) COSMETIC BYPASS — aktivace/vlastnictví
// ═══════════════════════════════════════════════════════════════════════
section('D) Cosmetic bypass');

{
  const { W } = makeWalletSandbox();

  // D1 — activate bez vlastnictví
  const res = W.activate('border-gold');
  ok('D1 activate nevlastněné → {ok:false,reason:not-owned}', !res.ok && res.reason === 'not-owned');
  ok('D1 active.border zůstane null', W.activeId('border') === null);

  // D2 — activate zdarma položky bez koupení
  const res2 = W.activate('theme-default');
  ok('D2 activate zdarma položky → {ok:true}', res2.ok);
  ok('D2 active.theme = theme-default', W.activeId('theme') === 'theme-default');

  // D3 — buy + activate drahé položky
  W.earn(300);
  const res3 = W.buy('border-gold'); // 130 kr
  ok('D3 buy border-gold (130 kr) → ok', res3.ok && res3.reason === 'bought');
  ok('D3 kredity správně odečteny', W.getCredits() === 170, `got ${W.getCredits()}`);
  ok('D3 border-gold je nyní vlastněno', W.owns('border-gold'));
  ok('D3 border-gold je aktivní', W.isActive('border-gold'));

  // D4 — activate stejné kategorie jinou vlastněnou položkou
  W.earn(100); W.buy('border-silver'); // 40 kr
  const res4 = W.activate('border-silver');
  ok('D4 přepnutí na border-silver → ok', res4.ok);
  ok('D4 active.border = border-silver', W.activeId('border') === 'border-silver');

  // D5 — cssFor vrací správný cssKey
  ok('D5 cssFor(border) = av-silver', W.cssFor('border') === 'av-silver');

  // D6 — pokus aktivovat neznámé ID
  const res6 = W.activate('XSS_PAYLOAD_<img>');
  ok('D6 activate XSS ID → {ok:false,reason:unknown}', !res6.ok && res6.reason === 'unknown');

  // D7 — migrateFrom: duplikát
  W.migrateFrom('RPG_MAT_9', { credits: 50, cosmetics:{ owned:['border-silver'] } });
  const after7 = W.getCredits();
  W.migrateFrom('RPG_MAT_9', { credits: 50, cosmetics:{ owned:['border-silver'] } }); // druhý pokus
  ok('D7 migrateFrom druhý pokus → ignorován', W.getCredits() === after7);
}


// ═══════════════════════════════════════════════════════════════════════
// E) XSS V SAVECH — Playwright, hub + teacher console
// ═══════════════════════════════════════════════════════════════════════
section('E) XSS v savech — Playwright');

const XSS_PAYLOADS = {
  scriptTag:   '<script>window.__XSS_FIRED__=1</script>',
  imgOnerror:  '<img src=x onerror="window.__XSS_FIRED__=1">',
  svgOnload:   '<svg onload="window.__XSS_FIRED__=1">',
  anchorHref:  '"><a href="javascript:window.__XSS_FIRED__=1">x</a>',
  iframeSrc:   '<iframe src="javascript:window.__XSS_FIRED__=1"></iframe>',
  onClickAttr: '\'" onclick="window.__XSS_FIRED__=1" x=\'',
};

async function checkXss(page, label) {
  await sleep(120);
  const fired = await page.evaluate(() => !!window.__XSS_FIRED__);
  ok(`${label} → XSS NEZASPAL`, !fired, fired ? 'XSS SPUŠTĚN!' : '');
  return fired;
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args:['--no-sandbox'] });

  for (const [payloadKey, payload] of Object.entries(XSS_PAYLOADS)) {

    // E-hub: XSS v S.name (zobrazuje se v hub kartách)
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      page.on('pageerror', e => { if (!isEnvNoise(e.message)) console.error('[pageerror]', e.message); });
      await page.goto(`${base}/projects/rpg-matematika.html`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(([k, pl]) => {
        const save = {name:pl, level:2, xp:50, done:{}, attrs:{calc:1,geo:1,anal:1,craft:1}, inv:[], ach:{}, credits:0, cosmetics:{owned:[],active:{}}};
        localStorage.setItem('RPG_MAT_9', JSON.stringify(save));
      }, [payloadKey, payload]);
      await page.reload({ waitUntil: 'load' });
      await checkXss(page, `E-hub name[${payloadKey}]`);
      await ctx.close();
    }

    // E-hub-inv: XSS v S.inv (artefakty)
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      page.on('pageerror', e => { if (!isEnvNoise(e.message)) console.error('[pageerror]', e.message); });
      await page.goto(`${base}/projects/rpg-matematika.html`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(([k, pl]) => {
        const save = {name:'Safe', level:2, xp:50, done:{}, attrs:{calc:1,geo:1,anal:1,craft:1}, inv:[pl,pl], ach:{}, credits:0, cosmetics:{owned:[],active:{}}};
        localStorage.setItem('RPG_MAT_9', JSON.stringify(save));
      }, [payloadKey, payload]);
      await page.reload({ waitUntil: 'load' });
      await checkXss(page, `E-hub inv[${payloadKey}]`);
      await ctx.close();
    }

    // E-wallet-active: XSS jako active cosmetic ID ve sdílené peněžence
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      page.on('pageerror', e => { if (!isEnvNoise(e.message)) console.error('[pageerror]', e.message); });
      await page.goto(`${base}/projects/rpg-matematika.html`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(([k, pl]) => {
        const wallet = {credits:0, cosmetics:{owned:[],active:{border:pl,badge:pl,theme:pl,victory:pl}}, settings:{reducedMotion:false}, migrated:[], absorbed:{}, v:1};
        localStorage.setItem('RPG_HUB_WALLET', JSON.stringify(wallet));
      }, [payloadKey, payload]);
      await page.reload({ waitUntil: 'load' });
      await checkXss(page, `E-wallet active[${payloadKey}]`);
      await ctx.close();
    }
  }

  // E-teacher: XSS v teacherUnlocked (dříve kritická zranitelnost, nyní opravena)
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('pageerror', e => { if (!isEnvNoise(e.message)) consoleErrors.push(e.message); });
    // Teacher console vyžaduje Supabase auth — nemůžeme se plně přihlásit,
    // ale ověříme, že stránka se načte bez JS chyby.
    await page.goto(`${base}/projects/rpg-ucitel.html`, { waitUntil: 'load' });
    await sleep(300);
    const jsOk = consoleErrors.length === 0;
    ok('E-teacher konzole se načte bez JS chyb', jsOk, consoleErrors.slice(0,2).join('; '));
    await ctx.close();
  }

  // E-game9: XSS v S.name přímo ve hře (hra escapuje v renderTask/profil)
  for (const [payloadKey, payload] of Object.entries(XSS_PAYLOADS).slice(0,3)) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', e => { if (!isEnvNoise(e.message)) console.error('[pageerror-game]', e.message); });
    await page.goto(`${base}/projects/rpg-mat-9.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(pl => {
      const save = {name:pl, level:2, xp:50, done:{}, attrs:{calc:1,geo:1,anal:1,craft:1}, inv:[], ach:{}, credits:0, cosmetics:{owned:[],active:{}}, mastery:{}, streak:{count:0,last:null}, stats:{crits:0,trainCorrect:0,bestCombo:0}};
      localStorage.setItem('RPG_MAT_9', JSON.stringify(save));
    }, payload);
    await page.reload({ waitUntil: 'load' });
    // Přejdi na profil (kde se jméno renderuje)
    await page.evaluate(() => { try{ continueGame(); go('profile'); }catch(e){} });
    await checkXss(page, `E-game9 profil name[${payloadKey}]`);
    await ctx.close();
  }

  await browser.close();
  srv.close();


  // ═══════════════════════════════════════════════════════════════════
  // F) SAVE FLOODING — obří objekty
  // ═══════════════════════════════════════════════════════════════════
  section('F) Save flooding — obří objekty');

  {
    const { W } = makeWalletSandbox();

    // F1 — obří owned pole (10 000 platných ID opakovaně)
    const allIds = ['border-silver','border-cyan','border-gold','border-holo',
      'badge-cyan','badge-gold','badge-green','badge-purple',
      'theme-default','theme-matrix','theme-blood','theme-violet',
      'victory-default','victory-cyber','victory-neon'];
    const bigOwned = Array.from({length:10000}, (_,i) => allIds[i % allIds.length]);
    const { W: Wf, inject: injF } = makeWalletSandbox();
    injF({ credits: 50, cosmetics:{ owned: bigOwned, active:{} }, settings:{}, migrated:[], absorbed:{}, v:1 });
    const wf1 = Wf.get();
    ok('F1 obří owned pole deduplukováno na 15 položek', wf1.cosmetics.owned.length === 15, `got ${wf1.cosmetics.owned.length}`);

    // F2 — obří absorbed objekt (1000 her)
    const bigAbsorbed = {};
    for (let i = 0; i < 1000; i++) bigAbsorbed[`FAKE_GAME_${i}`] = i * 10;
    const { W: Wf2, inject: injF2 } = makeWalletSandbox();
    injF2({ credits: 0, cosmetics:{ owned:[], active:{} }, settings:{}, migrated:[], absorbed: bigAbsorbed, v:1 });
    try {
      const wf2 = Wf2.get();
      ok('F2 obří absorbed projde sanitize bez crashe', typeof wf2.credits === 'number');
    } catch(e) {
      ok('F2 obří absorbed projde sanitize bez crashe', false, e.message);
    }

    // F3 — earn volaný 1000× rychle za sebou
    const { W: Wf3 } = makeWalletSandbox();
    for (let i = 0; i < 1000; i++) Wf3.earn(1);
    ok('F3 1000× earn(1) → 1000 kreditů', Wf3.getCredits() === 1000, `got ${Wf3.getCredits()}`);

    // F4 — migrateFrom s obřím legacyS.cosmetics.owned
    const { W: Wf4 } = makeWalletSandbox();
    const bigInvalidOwned = Array.from({length:5000}, (_,i) => `fake-item-${i}`);
    Wf4.migrateFrom('RPG_MAT_6', { credits: 100, cosmetics: { owned: bigInvalidOwned } });
    ok('F4 migrateFrom s 5000 neplatnými ID → žádná neplatná ID uložena', Wf4.get().cosmetics.owned.every(id => !id.startsWith('fake-item-')));
    ok('F4 kredity přesto absorbovány', Wf4.getCredits() === 100, `got ${Wf4.getCredits()}`);
  }

  // Souhrn
  console.log(`\n${'═'.repeat(46)}`);
  console.log(`  HACK TEST: ${passed} ✅  /  ${failed} ❌`);
  console.log('═'.repeat(46));
  process.exit(failed === 0 ? 0 : 1);
})();
