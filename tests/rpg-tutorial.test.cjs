// Fáze 5 — onboarding mini-tutoriál + dotykové cíle. Ověří: nový žák vidí
// tutoriál při 1. boji (timer pauznutý), veterán ne; přeskočit/dokončit
// nastaví tutorialDone; klávesa Enter posouvá; dotykové CSS ≥44px injektované.
// `node ... [9]`.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '9';
const PORT = 18820 + Number(GRADE);
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
  await page.waitForFunction(() => typeof startGame === 'function' && typeof launchBattle === 'function' && typeof RPGTutorial !== 'undefined', { timeout: 8000 });

  const startFresh = () => page.evaluate(() => { localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); });
  const firstMission = () => page.evaluate(() => { const ar = AREAS[0]; launchBattle(ar.id, ar.missions[0].id); });

  // ── 1) dotykové CSS injektované ──
  const touch = await page.evaluate(() => [...document.querySelectorAll('style')].some(s => /pointer:\s*coarse/.test(s.textContent) && /min-height:\s*44px/.test(s.textContent)));
  ok(touch, 'dotykové cíle ≥44px (pointer:coarse) injektované');

  // ── 2) nový žák → tutoriál se ukáže při 1. boji, timer pauznutý ──
  await startFresh();
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });
  await firstMission();
  await page.waitForFunction(() => { const o = document.getElementById('tutorial-overlay'); return o && o.style.display === 'flex'; }, { timeout: 5000 });
  const t2 = await page.evaluate(() => ({ visible: document.getElementById('tutorial-overlay').style.display === 'flex', timerPaused: typeof BT !== 'undefined' && !BT.timer, steps: RPGTutorial._steps.length, dotDone: !S.tutorialDone }));
  ok(t2.visible, 'nový žák: tutoriál se zobrazí při 1. boji');
  ok(t2.timerPaused, 'časomíra je během tutoriálu pauznutá');
  ok(t2.steps === 5 && t2.dotDone, 'tutoriál má 5 kroků (vč. „Jak odpovídat"), tutorialDone zatím false');

  // ── 3) Enter/klik posouvá kroky, poslední dokončí → tutorialDone + timer běží ──
  const finish = await page.evaluate(() => {
    for (let i = 0; i < 5; i++) document.getElementById('tut-next').click();
    return { hidden: document.getElementById('tutorial-overlay').style.display === 'none', done: !!S.tutorialDone, timerBack: !!BT.timer };
  });
  ok(finish.hidden, 'projitím kroků se tutoriál zavře');
  ok(finish.done, 'dokončení nastaví S.tutorialDone');
  ok(finish.timerBack, 'po tutoriálu se časomíra spustí');

  // ── 4) podruhé už se neukáže (tutorialDone) ──
  const second = await page.evaluate(() => { const ar = AREAS[0]; launchBattle(ar.id, ar.missions[1].id); return document.getElementById('tutorial-overlay').style.display; });
  ok(second === 'none', 'podruhé se tutoriál neukáže (tutorialDone)');

  // ── 5) klávesa Enter posouvá; Esc/Přeskočit dokončí ──
  await startFresh();
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });
  await page.evaluate(() => { S.tutorialDone = false; S.done = {}; });
  await firstMission();
  await page.waitForFunction(() => document.getElementById('tutorial-overlay').style.display === 'flex', { timeout: 5000 });
  const kb = await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    const dots = document.getElementById('tut-dots').textContent;
    return dots.indexOf('●') > 0; // aktivní tečka se posunula z první pozice
  });
  ok(kb, 'klávesa Enter posouvá kroky tutoriálu');
  const skip = await page.evaluate(() => { document.getElementById('tut-skip').click(); return { hidden: document.getElementById('tutorial-overlay').style.display === 'none', done: !!S.tutorialDone }; });
  ok(skip.hidden && skip.done, 'Přeskočit zavře a nastaví tutorialDone');

  // ── 6) veterán (má splněný úkol) → tutoriál se NEukáže, jen se označí ──
  const vet = await page.evaluate(() => {
    localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'VET'; startGame();
    S.tutorialDone = false; S.done = { '1-1-0': true }; saveS();
    const ar = AREAS[0]; launchBattle(ar.id, ar.missions[0].id);
    return { shown: document.getElementById('tutorial-overlay').style.display === 'flex', marked: !!S.tutorialDone };
  });
  ok(!vet.shown, 'veterán (má progres) tutoriál nevidí');
  ok(vet.marked, 'veteránovi se tutorialDone rovnou označí');

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Onboarding tutoriál (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
