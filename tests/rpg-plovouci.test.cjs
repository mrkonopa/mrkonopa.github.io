/* ═══════════════════════════════════════════════════════════
   Plovoucí prvky nesmí zakrývat ovládání (hluboká sonda „cesta žáka“, 7. 10. 2026).

   Virtuální telefon a iPad prošly všech 7 her jako přihlášený žák, který má úkoly od učitele,
   vzkazy i mazlíčka — a měřily, jestli jde každý ovladač stisknout. Našly se čtyři věci:
     1) tlačítko „Do věže →“ v nabídce věže bylo MRTVÉ: toast odznaku dostal pointer-events:none
        (aby nechytal dotyk nad DÁLE), jenže nabídka věže je tentýž toast a nese tlačítko,
     2) v tréninku na telefonu (360 px) vyjel OVĚŘIT / DALŠÍ ÚKOL z obrazovky — pole pro odpověď
        je flex:1 bez min-width:0 a drželo si ~270 px,
     3) plovoucí Úkoly a Vzkazy ležely přes spodní řadu voleb v boji a tréninku (na telefonu volby
        C a D) a na konci stránek přes poslední odkaz,
     4) mazlíček ležel přímo pod tlačítkem Úkoly (na užších obrazovkách se zakrývaly navzájem)
        a na telefonu přes volby v boji.
   Test měří GEOMETRII (rámečky ovladačů proti rámečkům plovoucích prvků), ne jen zásah středu —
   odkaz přes celou šířku má střed volný, i když mu tlačítka zakrývají půlku.
   ═══════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ROZMERY = [['telefon', 360, 740], ['iPad na výšku', 768, 1024], ['iPad na šířku', 1024, 768]];
const HRY = [3, 4, 5, 6, 7, 8, 9];

/* Přihlášený žák: session, postava v cloudu i v úložišti, jeden úkol od učitele a jeden vzkaz. */
const MOCK = `(function () {
  const U = { id: 'u1', email: 'zak@husovaliberec.cz', user_metadata: { full_name: 'Zak Test' } };
  const POSTAVA = { name: 'TESTER', xp: 35, level: 1, attrs: { calc: 5, geo: 5, anal: 5, craft: 5 }, done: { '1-1-0': true, '1-1-1': true, '1-1-2': true }, inv: [], teacherUnlocked: [], tutorialDone: true };
  const NOTES = [{ id: 1, author_name: 'Učitel', body: 'Skvělá práce, jen tak dál!', created_at: '2026-10-06T10:00:00Z', read_at: null }];
  const ASG = [{ id: 'a1', game: window.__HRA, mission_id: '2-3', due_date: '2026-10-20', class_name: 'Třída' }];
  function from(table) {
    let single = false;
    const b = { select() { return b; }, eq() { return b; }, is() { return b; }, order() { return b; }, limit() { return b; }, in() { return b; },
      insert() { return b; }, update() { return b; }, delete() { return b; }, upsert() { return Promise.resolve({ data: null, error: null }); },
      maybeSingle() { single = true; return b; }, single() { single = true; return b; },
      then(res, rej) {
        const data = table === 'notes' ? NOTES : (table === 'saves' && single ? { data: POSTAVA } : (single ? null : []));
        return Promise.resolve({ data, error: null }).then(res, rej);
      } };
    return b;
  }
  window.supabase = { createClient: () => ({
    auth: { getSession: async () => ({ data: { session: { user: U, access_token: 't' } } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signInWithOAuth: async () => {}, signOut: async () => ({ error: null }) },
    from, rpc: async fn => ({ data: fn === 'my_assignments' ? ASG : [], error: null })
  }) };
})();`;

/* Měřidlo ve stránce: plovoucí prvky a ovladače, které se s nimi protínají. */
const MERIDLO = `(function () {
  const vid = el => { if (!el) return null; const c = getComputedStyle(el); if (c.display === 'none' || c.visibility === 'hidden') return null; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? r : null; };
  const popis = el => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '')) + ' „' + (el.textContent || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 18) + '“';
  const protne = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 4 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4;
  window.__plovouci = function (jenOvladace) {
    const W = ['rpg-asg-btn', 'rpg-notes-btn', 'rpg-asg-panel', 'rpg-notes-panel', 'rw-sponka'].map(i => document.getElementById(i)).filter(e => vid(e));
    const out = [];
    for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) {
      if (/panel/.test(W[i].id + W[j].id)) continue;                         // otevřený panel je vyskakovací okno
      if (protne(W[i].getBoundingClientRect(), W[j].getBoundingClientRect())) out.push('widget × widget: ' + W[i].id + ' × ' + W[j].id);
    }
    if (jenOvladace === false) return out;
    const ov = [...document.querySelectorAll('button,input,select,textarea,a[href]')].filter(el => vid(el) && !el.disabled && !W.some(w => w.contains(el)) && !el.closest('.ach-toast,#rpg-asg-panel,#rpg-notes-panel'));
    for (const el of ov) { const r = el.getBoundingClientRect();
      for (const w of W) if (!/panel/.test(w.id) && protne(r, w.getBoundingClientRect())) out.push('ovladač ' + popis(el) + ' × ' + w.id); }
    return out;
  };
})();`;

(async () => {
  console.log('\n── Plovoucí prvky nezakrývají ovládání (telefon, iPad; úkoly + vzkazy + mazlíček) ──\n');
  const srv = http.createServer((q, r) => {
    // prázdná stránka na stejném původu: do ní se předem uloží postava a vlastník zařízení
    if (q.url.split('?')[0] === '/__prazdna') { r.writeHead(200, { 'Content-Type': 'text/html' }); return r.end('<!doctype html><meta charset="utf-8"><title>x</title>'); }
    const f = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0])));
    if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  });
  await new Promise(r => srv.listen(0, r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ executablePath: EXEC });
  const errs = [];
  let stavu = 0;
  try {
    for (const [jmR, w, h] of ROZMERY) for (const g of HRY) {
      const jm = `g${g} ${jmR}`;
      const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      await ctx.addInitScript('window.__HRA = "RPG_MAT_' + g + '"; window.__TW_TESTNOW = "2026-05-15T10:00:00";');
      await ctx.addInitScript(MOCK);
      await ctx.addInitScript(MERIDLO);
      const pg = await ctx.newPage();
      pg.on('pageerror', e => errs.push(jm + ': ' + e.message.split('\n')[0]));
      pg.on('dialog', d => d.accept().catch(() => {}));
      try {
        await pg.goto(base + '/__prazdna');
        await pg.evaluate(k => { localStorage.clear(); localStorage.setItem('RPG_CLOUD_OWNER', 'u1'); localStorage.setItem(k, JSON.stringify({ name: 'TESTER', xp: 35, level: 1, attrs: { calc: 5, geo: 5, anal: 5, craft: 5 }, done: { '1-1-0': true, '1-1-1': true, '1-1-2': true }, inv: [], teacherUnlocked: [], tutorialDone: true })); }, 'RPG_MAT_' + g);
        await pg.goto(`${base}/projects/rpg-mat-${g}.html`, { waitUntil: 'load' });
        await pg.waitForFunction(() => document.querySelector('#s-map.active') && document.getElementById('rpg-asg-btn') && document.getElementById('rpg-notes-btn'), null, { timeout: 8000 });
        await pg.evaluate(() => { RPGWallet.earn(2000); RPGWallet.buy('pet-sova'); RPGWallet.activate('pet-sova'); });
        await pg.waitForFunction(() => document.getElementById('rw-sponka'), null, { timeout: 4000 });
        const kryti = async (jmeno, hlavne) => {
          await sleep(500);                                                       // pohyb obrazovky + dotaz mazlíčka (5×/s)
          const naDno = await pg.evaluate(() => { scrollTo(0, document.documentElement.scrollHeight); return document.documentElement.scrollHeight > innerHeight + 4; });
          await sleep(350);
          const v = await pg.evaluate(() => window.__plovouci());
          stavu++;
          ok(`${jm}: ${jmeno}${naDno ? ' (odrolováno na konec)' : ''} — nic nekryje ovládání`, v.length === 0, v.slice(0, 3).join(' | '));
          await pg.evaluate(() => scrollTo(0, 0));
        };

        // 1) mapa: plovoucí Úkoly, Vzkazy a mazlíček se navzájem nepřekrývají a ani konec stránky
        await kryti('mapa');

        // 2) boj: textová úloha a výběr ze čtyř
        for (const druh of ['text', 'mc']) {
          const nasel = await pg.evaluate(d => {
            for (const ar of AREAS) for (const m of ar.missions) {
              if (d === 'mc' ? !m.mc : m.mc) continue;
              launchBattle(ar.id, m.id);
              const i = BT.tasks.findIndex(t => !isYN(t) && !t.svg); if (i < 0) continue;
              BT.mini[i] = null; BT.idx = i; renderTask(); return true;
            } return false;
          }, druh);
          if (!nasel) { ok(`${jm}: boj ${druh} — úloha se nenašla`, false); continue; }
          await pg.waitForFunction(() => { const i = document.getElementById('bt-ans'), m = [...document.querySelectorAll('#mc-grid .mc-btn')]; return (i && !i.disabled && i.offsetParent) || m.some(x => !x.disabled); }, null, { timeout: 6000 }).catch(() => {});
          const schovane = await pg.evaluate(() => ['rpg-asg-btn', 'rpg-notes-btn'].every(i => getComputedStyle(document.getElementById(i)).display === 'none'));
          ok(`${jm}: boj ${druh} — Úkoly a Vzkazy jsou schované (uprostřed úlohy je žák nepotřebuje)`, schovane);
          await kryti('boj ' + druh);
        }

        // 3) trénink: pole pro odpověď se smrští, OVĚŘIT i DALŠÍ ÚKOL zůstanou celé na obrazovce
        await pg.evaluate(() => { go('train'); const m = AREAS.flatMap(a => a.missions).find(m => !m.mc); startTrain(m.id);
          for (let i = 0; i < 40; i++) { const r = document.getElementById('tr-input-row'), a = document.getElementById('tr-ans'); if (r && getComputedStyle(r).display !== 'none' && a && !a.disabled && !isYN(TR.task)) break; trNext(); } });
        await sleep(300);
        const vRadku = async () => pg.evaluate(() => [...document.getElementById('tr-input-row').querySelectorAll('button,input')].filter(e => getComputedStyle(e).display !== 'none').map(e => { const r = e.getBoundingClientRect(); return { t: (e.id || e.textContent.trim()).slice(0, 14), l: r.left, p: r.right }; }));
        let radek = await vRadku();
        ok(`${jm}: trénink — řádek s odpovědí se vejde do ${w} px`, radek.every(e => e.l >= -0.5 && e.p <= w + 0.5), radek.map(e => `${e.t} ${Math.round(e.l)}–${Math.round(e.p)}`).join(', '));
        await kryti('trénink');
        await pg.evaluate(() => { document.getElementById('tr-ans').value = String(TR.task.ans); trSubmit(); });
        await sleep(500);
        radek = await vRadku();
        ok(`${jm}: trénink po odpovědi — DALŠÍ ÚKOL je celý na obrazovce`, radek.length >= 2 && radek.every(e => e.l >= -0.5 && e.p <= w + 0.5), radek.map(e => `${e.t} ${Math.round(e.l)}–${Math.round(e.p)}`).join(', '));
        await kryti('trénink po odpovědi');

        // 4) profil: poslední odkaz jde odrolovat nad plovoucí tlačítka
        await pg.evaluate(() => { go('profile'); if (typeof renderProfile === 'function') renderProfile(); });
        await kryti('profil');

        // 5) oblast (výběr mise) a teorie: stránky se rolují, takže poslední ovladač musí jít odrolovat nad plovoucí tlačítka
        await pg.evaluate(() => { go('map'); openArea(AREAS[1].id); });
        await kryti('oblast');
        await pg.evaluate(() => { startLearn(AREAS[0].missions[0].id); });
        await kryti('teorie');

        // 6) nabídka věže (jen 2. stupeň): tlačítko „Do věže →“ chytá ťuknutí a vede do věže
        if (g >= 6) {
          await pg.evaluate(() => { go('map'); suggestTower(); });
          await pg.waitForFunction(() => { const t = document.getElementById('tower-suggest'); return t && t.classList.contains('show'); }, null, { timeout: 3000 }).catch(() => {});
          await sleep(500);
          const tl = await pg.evaluate(() => { const bt = document.querySelector('#tower-suggest button'); if (!bt) return null; const q = bt.getBoundingClientRect(), e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { x: q.left + q.width / 2, y: q.top + q.height / 2, zasah: e === bt || bt.contains(e) }; });
          ok(`${jm}: nabídka věže — „Do věže →“ chytá dotyk`, !!tl && tl.zasah, tl ? '' : 'tlačítko nenalezeno');
          if (tl && tl.zasah) {
            await pg.touchscreen.tap(tl.x, tl.y); await sleep(500);
            ok(`${jm}: nabídka věže — ťuknutí vede do věže`, await pg.evaluate(() => !!document.querySelector('#s-tower.active')));
          }
        }
      } catch (e) { ok(`${jm}: průchod doběhl`, false, e.message.split('\n')[0]); }
      await ctx.close();
    }
  } finally { await b.close(); srv.close(); }
  ok('měřidlo opravdu měřilo (stavů: ' + stavu + ' z ' + ROZMERY.length * HRY.length * 8 + ')', stavu >= ROZMERY.length * HRY.length * 8 - 8, 'stavů ' + stavu);
  ok('žádné JS chyby', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
