/**
 * RPG Matematika — cloud smoke tests
 * Spusť: node tests/rpg-cloud.test.cjs
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const PORT = 18432;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Minimal supabase mock — satisfies configured() check in rpg-cloud.js
const SUPABASE_MOCK = `
window.supabase = {
  createClient: function(url, key) {
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: ()=>{} } } }),
        signInWithOAuth: async () => {},
        signOut: async () => {}
      },
      from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) })
    };
  }
};
`;

// ── Tiny static file server ──────────────────────────────────────────────────
function startServer() {
  const mime = { html:'text/html', js:'application/javascript', css:'text/css',
                  svg:'image/svg+xml', ico:'image/x-icon', json:'application/json' };
  const srv = http.createServer((req, res) => {
    let p = req.url.split('?')[0];
    if (p === '/') p = '/index.html';
    const full = path.join(ROOT, p);
    try {
      const buf = fs.readFileSync(full);
      const ext = p.split('.').pop();
      res.writeHead(200, {'Content-Type': mime[ext] || 'application/octet-stream'});
      res.end(buf);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

// ── Supabase REST ping (HTTPS, no browser needed) ─────────────────────────────
function pingSupabase() {
  const SUPABASE_URL = 'https://ovajoalbyofenjbbyhcy.supabase.co';
  const ANON_KEY = 'sb_publishable_XWQ96Yv5YfvUtJ001hiXsw_HZpxJcAp';
  return new Promise((resolve) => {
    const url = new URL('/rest/v1/', SUPABASE_URL);
    const opts = {
      hostname: url.hostname, path: url.pathname,
      method: 'GET',
      headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY }
    };
    const req = https.request(opts, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body: body.slice(0, 200) }));
    });
    req.setTimeout(8000, () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

// ── Test runner ───────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function ok(name, cond, detail = '') {
  if (cond) { console.log(`  ✅ ${name}`); pass++; }
  else       { console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); fail++; }
}

async function runTests() {
  console.log('\n══════════════════════════════════════════');
  console.log('  RPG Matematika — Cloud Smoke Tests');
  console.log('══════════════════════════════════════════\n');

  // ── 1) Supabase REST ──────────────────────────────────────────────────────
  console.log('[ 1 ] Supabase REST ping');
  const ping = await pingSupabase();
  // 200=healthy, 401/403=auth required (server up), anything else = problem
  const sbUp = !ping.error && [200, 401, 403].includes(ping.status);
  ok('Supabase server dostupný', sbUp, ping.error || `status=${ping.status}`);
  ok('Žádná síťová chyba', !ping.error, ping.error || '');
  console.log(`     HTTP status: ${ping.status ?? 'ERR:' + ping.error}\n`);

  // ── 2) Static server + browser ────────────────────────────────────────────
  const srv = await startServer();
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM
  });

  // Helper: new page with Supabase mock injected before any script runs
  async function newMockedPage() {
    const ctx = await browser.newContext();
    // Block actual CDN so mock is the only supabase
    await ctx.route('**jsdelivr**', r => r.abort());
    await ctx.route('**supabase.co/auth**', r => r.abort());
    const page = await ctx.newPage();
    await page.addInitScript(SUPABASE_MOCK);
    return { ctx, page };
  }

  try {
    // ── 2a) rpg-cloud.js — CONFIG je vyplněný ─────────────────────────────
    console.log('[ 2 ] rpg-cloud.js — CONFIG a configured()');
    const { ctx: c1, page } = await newMockedPage();
    await page.goto(`${BASE}/projects/rpg-matematika.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.RPGCloud !== 'undefined', { timeout: 8000 });

    const cfg = await page.evaluate(() => window.RPGCloud.CONFIG);
    ok('SUPABASE_URL vyplněna', cfg.SUPABASE_URL.startsWith('https://'), cfg.SUPABASE_URL);
    ok('SUPABASE_ANON_KEY vyplněna', cfg.SUPABASE_ANON_KEY.length > 20);
    ok('ALLOWED_DOMAIN = husovaliberec.cz', cfg.ALLOWED_DOMAIN === 'husovaliberec.cz');

    const configured = await page.evaluate(() => window.RPGCloud.configured());
    ok('configured() = true (mock supabase přijat)', configured);
    console.log();

    // ── 2b) Hub — lišta viditelná, login tlačítko ─────────────────────────
    console.log('[ 3 ] Hub — přihlašovací lišta (nepřihlášený stav)');
    await page.waitForFunction(() => {
      const b = document.getElementById('cloud-bar');
      return b && b.style.display !== 'none' && b.style.display !== '';
    }, { timeout: 5000 }).catch(() => {});

    const barVisible = await page.evaluate(() => {
      const b = document.getElementById('cloud-bar');
      return b ? (b.style.display !== 'none' && b.style.display !== '') : false;
    });
    ok('cloud-bar je viditelný', barVisible);

    const btnText = await page.evaluate(() => {
      const b = document.getElementById('cloud-btn');
      return b ? b.textContent.trim() : '';
    });
    ok('Tlačítko "Přihlásit přes Google" zobrazeno', btnText.includes('Přihlásit'), `"${btnText}"`);

    const statusText = await page.evaluate(() => {
      const s = document.getElementById('cloud-status');
      return s ? s.textContent.trim() : '';
    });
    ok('Status text "lokálně"', statusText.includes('lokálně'), `"${statusText}"`);
    console.log();

    // ── 2c) Hub — herní karty ─────────────────────────────────────────────
    console.log('[ 4 ] Hub — herní karty');
    const cardCount = await page.evaluate(() =>
      document.querySelectorAll('.card').length
    );
    ok('4 herní karty zobrazeny', cardCount === 4, `počet: ${cardCount}`);

    const gameNames = await page.evaluate(() =>
      [...document.querySelectorAll('.card .nm')].map(e => e.textContent.trim())
    );
    ok('NULL_BYTE (9. ročník) karta existuje', gameNames.some(n => n.includes('NULL_BYTE')), JSON.stringify(gameNames));
    ok('ZTRACENÝ CHRÁM (7. ročník) karta existuje', gameNames.some(n => n.includes('CHRÁM')), JSON.stringify(gameNames));
    ok('VESMÍRNÁ EXPEDICE (6. ročník) karta existuje', gameNames.some(n => n.includes('EXPEDICE')));
    ok('MATEMATICKÁ AKADEMIE (8. ročník) karta existuje', gameNames.some(n => n.includes('AKADEMIE')));
    await c1.close();
    console.log();

    // ── 2d) Jednotlivé hry — cloud bar + SAVE_KEY ─────────────────────────
    console.log('[ 5 ] Jednotlivé hry — cloud bar');
    const games = [
      { file: 'rpg-mat-6.html', key: 'RPG_MAT_6', name: '6. ročník' },
      { file: 'rpg-mat-7.html', key: 'RPG_MAT_7', name: '7. ročník' },
      { file: 'rpg-mat-8.html', key: 'RPG_MAT_8', name: '8. ročník' },
      { file: 'rpg-mat-9.html', key: 'RPG_MAT_9', name: '9. ročník' },
    ];
    for (const g of games) {
      const { ctx: gc, page: gpage } = await newMockedPage();
      await gpage.goto(`${BASE}/projects/${g.file}`, { waitUntil: 'domcontentloaded' });
      await gpage.waitForFunction(() => typeof window.RPGCloud !== 'undefined', { timeout: 8000 });
      await gpage.waitForFunction(() => {
        const b = document.getElementById('cloud-bar');
        return b && b.style.display !== 'none' && b.style.display !== '';
      }, { timeout: 5000 }).catch(() => {});
      const hasBar = await gpage.evaluate(() => {
        const b = document.getElementById('cloud-bar');
        return b ? (b.style.display !== 'none' && b.style.display !== '') : false;
      });
      ok(`${g.name} (${g.key}) — cloud bar viditelný`, hasBar);
      await gc.close();
    }
    console.log();

    // ── 2e) Graceful degradation — bez CDN lišta skrytá, hub funguje ──────
    console.log('[ 6 ] Graceful degradation (bez Supabase CDN)');
    const ctx3 = await browser.newContext();
    await ctx3.route('**jsdelivr**', r => r.abort());
    await ctx3.route('**supabase**', r => r.abort());
    const pg3 = await ctx3.newPage();
    await pg3.goto(`${BASE}/projects/rpg-matematika.html`, { waitUntil: 'domcontentloaded' });
    await pg3.waitForTimeout(2500);
    const barHidden = await pg3.evaluate(() => {
      const b = document.getElementById('cloud-bar');
      return !b || b.style.display === 'none' || b.style.display === '';
    });
    ok('Bar skrytý bez Supabase CDN (graceful degradation)', barHidden);
    const cardsFallback = await pg3.evaluate(() => document.querySelectorAll('.card').length);
    ok('Hub zobrazuje 4 karty i bez cloudu', cardsFallback === 4, `počet: ${cardsFallback}`);
    await ctx3.close();
    console.log();

    // ── 2f) Simulace přihlášeného uživatele ───────────────────────────────
    console.log('[ 7 ] Simulace přihlášeného uživatele (mock session)');
    const MOCK_WITH_USER = SUPABASE_MOCK.replace(
      'getSession: async () => ({ data: { session: null } })',
      `getSession: async () => ({ data: { session: {
        user: { id: 'test-uid', email: 'testauth@husovaliberec.cz',
                user_metadata: { full_name: 'Test Auth' } }
      } } })`
    );
    const ctx4 = await browser.newContext();
    await ctx4.route('**jsdelivr**', r => r.abort());
    const pg4 = await ctx4.newPage();
    await pg4.addInitScript(MOCK_WITH_USER);
    await pg4.goto(`${BASE}/projects/rpg-matematika.html`, { waitUntil: 'domcontentloaded' });
    await pg4.waitForFunction(() => typeof window.RPGCloud !== 'undefined', { timeout: 8000 });
    await pg4.waitForTimeout(1500);
    const loggedInEmail = await pg4.evaluate(() => {
      const u = window.RPGCloud.currentUser();
      return u ? u.email : null;
    });
    ok('currentUser() vrátí přihlášeného uživatele', loggedInEmail === 'testauth@husovaliberec.cz', loggedInEmail);
    const logoutBtn = await pg4.evaluate(() => {
      const b = document.getElementById('cloud-btn');
      return b ? b.textContent.trim() : '';
    });
    ok('Tlačítko se přepne na "Odhlásit"', logoutBtn.includes('Odhlásit'), `"${logoutBtn}"`);
    const statusCloud = await pg4.evaluate(() => {
      const s = document.getElementById('cloud-status');
      return s ? s.textContent.trim() : '';
    });
    ok('Status text zobrazuje email', statusCloud.includes('husovaliberec.cz'), `"${statusCloud}"`);
    await ctx4.close();
    console.log();

    // ── 2g) Domain check — odmítne neškolní účet ──────────────────────────
    console.log('[ 8 ] Domain check — odmítnutí cizího účtu');
    const MOCK_OUTSIDER = SUPABASE_MOCK.replace(
      'getSession: async () => ({ data: { session: null } })',
      `getSession: async () => ({ data: { session: {
        user: { id: 'ext-uid', email: 'cizi@gmail.com', user_metadata: {} }
      } } })`
    );
    const ctx5 = await browser.newContext();
    await ctx5.route('**jsdelivr**', r => r.abort());
    const pg5 = await ctx5.newPage();
    // Stub signOut so we can track the call
    await pg5.addInitScript(MOCK_OUTSIDER + `
      window.__signOutCalled = false;
    `);
    // Intercept alert
    pg5.on('dialog', async d => { await d.dismiss(); });
    await pg5.goto(`${BASE}/projects/rpg-matematika.html`, { waitUntil: 'domcontentloaded' });
    await pg5.waitForFunction(() => typeof window.RPGCloud !== 'undefined', { timeout: 8000 });
    await pg5.waitForTimeout(1500);
    const outsiderUser = await pg5.evaluate(() => {
      const u = window.RPGCloud.currentUser();
      return u ? u.email : null;
    });
    ok('Cizí účet (@gmail.com) odmítnut — currentUser() = null', outsiderUser === null, outsiderUser);
    await ctx5.close();

  } catch (e) {
    console.error('\nNeočekávaná chyba v testu:', e.message);
    fail++;
  }

  await browser.close();
  srv.close();

  // ── Výsledek ─────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════\n');
  if (fail > 0) process.exit(1);
}

runTests().catch(e => { console.error(e); process.exit(1); });
