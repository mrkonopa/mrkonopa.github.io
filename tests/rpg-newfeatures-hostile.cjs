// ZMRD MODE pro nové featury (Fáze 2–5): RPGFindError, RPGKeys, RPGTutorial.
// Útoky ze strany žáka (farm/softlock/spam) i hackera (XSS/prototype pollution).
// `node ... [9]`.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '9';
const PORT = 18810 + Number(GRADE);
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
  await page.waitForFunction(() => typeof startGame === 'function' && typeof RPGFindError !== 'undefined' && typeof RPGTutorial !== 'undefined', { timeout: 8000 });
  await page.evaluate(() => { localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  // ══ ŽÁK: farm kreditů přes „Najdi chybu" (cap musí přežít reopen) ══
  const farm = await page.evaluate(g => {
    const L = window['RPG_LEARN_' + g];
    const answerAllCorrect = () => { const ov = document.getElementById('find-error-overlay'); const cur = ov._cur; const c = [...ov.querySelectorAll('#fe-opts button')].find(b => b.textContent.includes(cur.right.slice(0, 10))); if (c) c.click(); ov.querySelector('#fe-next').click(); };
    const before = RPGWallet.getCredits();
    // 3 sezení × 15 správných = 45 správných; strop je 10/načtení stránky
    for (let s = 0; s < 3; s++) { RPGFindError.open(L); for (let i = 0; i < 15; i++) answerAllCorrect(); document.getElementById('find-error-overlay').querySelector('#fe-close').click(); }
    return RPGWallet.getCredits() - before;
  }, Number(GRADE));
  ok(farm <= 10, `„Najdi chybu": strop kreditů přežije reopen (nafarmeno ${farm}, ≤10)`);

  // ══ HACKER: XSS + prototype pollution přes data teorie ══
  const xss = await page.evaluate(() => {
    window.__x = 0;
    const bad = { 'p-1': { mistakes: [
      { wrong: "<img src=x onerror=window.__x=1>", right: "<svg/onload=window.__x=1>", why: "\"'><script>window.__x=1<\/script>" },
      { wrong: "</div><iframe src=javascript:window.__x=1>", right: "ok2", why: "why2" }
    ] }, '__proto__': { polluted: 1 } };
    RPGFindError.open(bad);
    const ov = document.getElementById('find-error-overlay');
    [...ov.querySelectorAll('#fe-opts button')].forEach(b => b.click());
    const html = ov.querySelector('#fe-reveal').innerHTML;
    return { fired: window.__x, polluted: ({}).polluted === 1, escaped: html.includes('&lt;') && !/<img src=x|<iframe/.test(html) };
  });
  ok(xss.fired === 0, 'XSS přes mistakes se NEspustí');
  ok(!xss.polluted, 'prototype pollution přes __proto__ klíč NEprojde');
  ok(xss.escaped, 'hostilní řetězce escapované v reveal');

  // ══ ŽÁK: spam kláves v boji nezpůsobí dvojí odeslání / crash ══
  await page.evaluate(() => { document.getElementById('find-error-overlay').querySelector('#fe-close').click(); const ar = AREAS[0]; const mc = ar.missions.find(m => m.mc); launchBattle(ar.id, (mc || ar.missions[0]).id); });
  await page.waitForFunction(() => typeof BT !== 'undefined' && BT.curTask, { timeout: 5000 });
  const spam = await page.evaluate(() => {
    // zavři případný tutoriál
    const to = document.getElementById('tutorial-overlay'); if (to && to.style.display === 'flex') { S.tutorialDone = true; to.style.display = 'none'; }
    // najdi MC pozici a spamuj klávesu 1 50×
    for (let i = 0; i < BT.tasks.length; i++) { if (S.done[`${BT.mid}-${i}`]) continue; BT.idx = i; BT._rendered = -1; renderTask(); break; }
    const grid = document.getElementById('mc-grid');
    if (!grid || grid.offsetParent === null) return { skip: true };
    const hpBefore = BT.hp, xpBefore = S.xp;
    for (let k = 0; k < 50; k++) document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    return { skip: false, hpSane: BT.hp <= hpBefore && BT.hp >= 0, xpSane: S.xp - xpBefore <= 12, allDisabled: [...grid.querySelectorAll('.mc-btn')].every(b => b.disabled) };
  });
  ok(spam.skip || (spam.hpSane && spam.xpSane), 'spam klávesy 1 (50×) neurve HP/XP mimo meze');
  ok(spam.skip || spam.allDisabled, 'po první klávese jsou MC volby zamčené (žádné dvojí odeslání)');

  // ══ ŽÁK: guard — psaní číslic do vstupu se nehijackuje ══
  const guard = await page.evaluate(() => {
    // textová mise
    const ar = AREAS[0]; const txtM = ar.missions.find(m => !m.mc); if (!txtM) return { skip: true };
    launchBattle(ar.id, txtM.id);
    const to = document.getElementById('tutorial-overlay'); if (to) to.style.display = 'none';
    for (let i = 0; i < BT.tasks.length; i++) { if (S.done[`${BT.mid}-${i}`]) continue; BT.idx = i; BT._rendered = -1; renderTask(); break; }
    const inp = document.getElementById('bt-ans'); if (!inp || inp.offsetParent === null) return { skip: true };
    inp.disabled = false; inp.focus(); inp.value = '';
    // simuluj psaní '1' '2' (v reálu by je vložil prohlížeč; ověřujeme, že handler nekliká MC)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    const mcGrid = document.getElementById('mc-grid');
    const noHijack = !mcGrid || mcGrid.offsetParent === null || [...mcGrid.querySelectorAll('.mc-btn')].every(b => !b.disabled);
    return { skip: false, noHijack };
  });
  ok(guard.skip || guard.noHijack, 'psaní do vstupu se klávesovým handlerem nehijackne');

  // ══ ŽÁK: tutoriál nejde použít k softlocku (timer se vždy vrátí, Enter spam) ══
  const soft = await page.evaluate(() => {
    localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'NEW'; startGame();
    S.tutorialDone = false; S.done = {};
    const ar = AREAS[0]; launchBattle(ar.id, ar.missions[0].id);
    const shown = document.getElementById('tutorial-overlay').style.display === 'flex';
    for (let k = 0; k < 30; k++) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    return { shown, hidden: document.getElementById('tutorial-overlay').style.display === 'none', timerBack: !!BT.timer, done: !!S.tutorialDone };
  });
  ok(soft.shown, 'tutoriál se novému žákovi zobrazí');
  ok(soft.hidden && soft.timerBack && soft.done, 'spam Enter tutoriál dokončí, časomíra se vrátí (žádný softlock)');

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Nové featury HOSTILE (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
