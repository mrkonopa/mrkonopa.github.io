// Fáze 3a — „Najdi chybu" (erroneous examples). Ověří: pool z mistakes;
// overlay se 2 volbami; správná/špatná volba → zvýraznění + reveal (why);
// kredity capnuté; klávesy 1/2; XSS escapování; zavření. `node ... [9]`.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '9';
const PORT = 18900 + Number(GRADE);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m); } };

(async () => {
  const srv = http.createServer((req, res) => {
    const p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
    if (!p.startsWith(ROOT + path.sep)) { res.statusCode = 403; res.end(); return; }
    try { res.end(fs.readFileSync(p)); } catch { res.statusCode = 404; res.end(); }
  }).listen(PORT);
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const br = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined });
  const ctx = await br.newContext();
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1:' + PORT) ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/projects/rpg-mat-${GRADE}.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(g => typeof RPGFindError !== 'undefined' && typeof startGame === 'function' && !!window['RPG_LEARN_' + g], Number(GRADE), { timeout: 8000 });
  await page.evaluate(() => { localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  /* Volba se hledá podle CELÉHO zápisu, ne podle prefixu.
     Dřív test dělal `b.textContent.includes(cur.right.slice(0, 12))`. Jenže
     u „najdi chybu" je chybná varianta schválně skoro totožná se správnou —
     v 9. ročníku má 8 z 63 karet (12,7 %) shodných prvních 12 znaků, a jsou
     to zrovna ty pedagogicky nejlepší („√(c² − b²)" vs „√(c² + b²)").
     Prefix pak sedl na OBĚ tlačítka a `find` vrátilo to první, tedy v půlce
     případů špatné. Test proto zhruba každý pátý běh hlásil vadu produktu,
     který je v pořádku — jednou „správná volba nepřidá kredit", jindy
     „špatná volba nedá hlášku o chybě", podle toho, která karta padla.
     Tlačítko má před textem pořadové číslo (1/2), to se odřízne. */
  await page.evaluate(() => {
    window.__pickBtn = (ov, text) => {
      const want = String(text).trim();
      return [...ov.querySelectorAll('#fe-opts button')]
        .find(b => b.textContent.replace(/^\s*[12]\s*/, '').trim() === want);
    };
  });

  // ── 0) data: správná a chybná varianta se MUSÍ lišit ──
  const dataOk = await page.evaluate(g => {
    const pool = RPGFindError._build(window['RPG_LEARN_' + g]);
    const same = pool.filter(c => String(c.right).trim() === String(c.wrong).trim());
    return { n: pool.length, same: same.length, ukazka: (same[0] || {}).right || '' };
  }, Number(GRADE));
  ok(dataOk.same === 0, `žádná karta nemá shodný správný a chybný zápis (${dataOk.same}× „${dataOk.ukazka}")`);

  // ── 1) pool z mistakes ──
  const poolLen = await page.evaluate(g => RPGFindError._build(window['RPG_LEARN_' + g]).length, Number(GRADE));
  ok(poolLen >= 40, `pool z mistakes má dost karet (${poolLen})`);

  // ── 2) tlačítko otevře overlay se 2 volbami ──
  const opened = await page.evaluate(g => {
    RPGFindError.open(window['RPG_LEARN_' + g]);
    const ov = document.getElementById('find-error-overlay');
    return { vis: ov && ov.style.display === 'flex', opts: ov.querySelectorAll('#fe-opts button').length };
  }, Number(GRADE));
  ok(opened.vis, 'overlay se otevře (display:flex)');
  ok(opened.opts === 2, 'karta má právě 2 volby');

  // ── 3) správná volba → zelené zvýraznění + reveal + kredit ──
  const good = await page.evaluate(() => {
    const before = (typeof RPGWallet !== 'undefined') ? RPGWallet.getCredits() : 0;
    // najdi, která volba je správná: přečti _cur a klikni tu s .right
    const ov = document.getElementById('find-error-overlay');
    const cur = ov._cur;
    const correct = window.__pickBtn(ov, cur.right);
    if (!correct) return { nenalezeno: true, hledano: cur.right };
    correct.click();
    const rev = ov.querySelector('#fe-reveal');
    const grn = getComputedStyle(correct).borderColor;
    return { revealShown: rev.style.display === 'block', hasWhy: rev.textContent.includes(cur.why.slice(0, 10)) || !cur.why, creditUp: ((typeof RPGWallet !== 'undefined') ? RPGWallet.getCredits() : 1) > before, nextShown: ov.querySelector('#fe-next').style.display !== 'none' };
  });
  ok(!good.nenalezeno, `správná volba se v overlayi našla (hledáno „${good.hledano || ''}")`);
  ok(good.revealShown, 'po odpovědi se ukáže reveal');
  ok(good.hasWhy, 'reveal obsahuje vysvětlení (why)');
  ok(good.creditUp, 'správná volba přidá kredit');
  ok(good.nextShown, 'zobrazí se tlačítko DALŠÍ');

  // ── 4) DALŠÍ → nová karta, druhá odpověď špatně → červená + reveal ukáže správné ──
  const bad = await page.evaluate(() => {
    const ov = document.getElementById('find-error-overlay');
    ov.querySelector('#fe-next').click();
    const cur = ov._cur;
    const wrongBtn = window.__pickBtn(ov, cur.wrong);
    if (!wrongBtn) return { nenalezeno: true, hledano: cur.wrong };
    wrongBtn.click();
    const rev = ov.querySelector('#fe-reveal');
    return { fbErr: rev.textContent.includes('Chyba'), showsRight: rev.textContent.includes(String(cur.right).trim()) };
  });
  ok(!bad.nenalezeno, `chybná volba se v overlayi našla (hledáno „${bad.hledano || ''}")`);
  ok(bad.fbErr, 'špatná volba → hláška o chybě');
  ok(bad.showsRight, 'reveal ukáže správný zápis i při chybě');

  // ── 5) kredity capnuté (EARN_CAP=10) ──
  const cap = await page.evaluate(() => {
    const before = RPGWallet.getCredits();
    const ov = document.getElementById('find-error-overlay');
    for (let i = 0; i < 30; i++) {
      ov.querySelector('#fe-next').click();
      const cur = ov._cur;
      const correct = window.__pickBtn(ov, cur.right);
      if (correct) correct.click();
    }
    return RPGWallet.getCredits() - before; // už bylo 1 získáno dřív → cap 10 celkem
  });
  ok(cap <= 10, `kredity za sezení capnuté (přibylo ${cap}, ≤ zbytek do 10)`);

  // ── 6) klávesa 2 vybere druhou volbu ──
  const kb = await page.evaluate(() => {
    const ov = document.getElementById('find-error-overlay');
    ov.querySelector('#fe-next').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
    const btns = [...ov.querySelectorAll('#fe-opts button')];
    return btns.every(b => b.disabled); // po výběru jsou obě disabled
  });
  ok(kb, 'klávesa 2 vybere volbu (obě tlačítka se zamknou)');

  // ── 7) XSS: hostilní mistake se escapuje ──
  const xss = await page.evaluate(() => {
    const L = { 'x-1': { mistakes: [{ wrong: '<img src=x onerror=window.__H=1>', right: '<b>2+2=4</b>', why: '<script>window.__H=1<\/script>' }] } };
    window.__H = 0;
    RPGFindError.open(L);
    const ov = document.getElementById('find-error-overlay');
    [...ov.querySelectorAll('#fe-opts button')].forEach(b => b.click());
    const rev = ov.querySelector('#fe-reveal');
    const raw = rev.innerHTML.includes('&lt;img') || rev.innerHTML.includes('&lt;b&gt;');
    return { noExec: window.__H === 0, escaped: raw };
  });
  ok(xss.noExec, 'XSS payload se NEspustí');
  ok(xss.escaped, 'hostilní řetězce jsou escapované v innerHTML');

  // ── 8) KONEC zavře overlay ──
  const closed = await page.evaluate(() => {
    document.getElementById('find-error-overlay').querySelector('#fe-close').click();
    return document.getElementById('find-error-overlay').style.display === 'none';
  });
  ok(closed, 'KONEC zavře overlay');

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Najdi chybu (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
