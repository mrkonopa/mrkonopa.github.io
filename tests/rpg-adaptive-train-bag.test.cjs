// Adaptivní trénink (1. stupeň, g3/4/5): ověří "shuffle-bag" adaptivitu —
// položky s vyšší chybovostí jsou v pytlíku zastoupené vícekrát, ale bez
// opakování dokud se pytlík nevyčerpá; trWrong/trCorrect zapisují/odbourávají
// S.trainErrs. Parametrizováno ročníkem: `node ... [3|4|5]` (default 3).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '3';
const PORT = 18760 + Number(GRADE);
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
  console.log(`  (ročník ${GRADE})`);
  await page.goto(`http://127.0.0.1:${PORT}/projects/rpg-mat-${GRADE}.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startTrain === 'function' && typeof trBuildBag === 'function', { timeout: 8000 });

  await page.evaluate(() => { localStorage.clear(); const inp = document.getElementById('ni'); if (inp) inp.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  await page.evaluate(() => startTrain('1-1'));
  await page.waitForFunction(() => TR.task != null, { timeout: 5000 });

  // ── 1) bez chyb: pytlík má poolLen položek přesně jednou (žádné duplikáty) ──
  const uniformCheck = await page.evaluate(() => {
    const ar = AREAS.find(a => a.missions.some(m => m.id === TR.mid));
    const m = ar.missions.find(x => x.id === TR.mid);
    let pool = m.tasks();
    const ex = window[Object.keys(window).find(k => /^RPG_TASK_EXTRA_\d$/.test(k))];
    if (ex && typeof ex[TR.mid] === 'function') pool = pool.concat(ex[TR.mid]());
    const bag = trBuildBag(pool, 'zadna-mise-bez-chyb');
    const idxCounts = {};
    bag.forEach(e => { idxCounts[e.idx] = (idxCounts[e.idx] || 0) + 1; });
    return { poolLen: pool.length, bagLen: bag.length, idxCounts };
  });
  ok(uniformCheck.bagLen === uniformCheck.poolLen, `bez chyb má pytlík přesně poolLen položek (pool=${uniformCheck.poolLen}, bag=${uniformCheck.bagLen})`);
  ok(Object.values(uniformCheck.idxCounts).every(c => c === 1), 'bez chyb je každý index v pytlíku právě jednou');

  // ── 2) s chybovostí 4 na indexu 0 je bag 5× delší pro ten index ──
  const weightedCheck = await page.evaluate(() => {
    const ar = AREAS.find(a => a.missions.some(m => m.id === TR.mid));
    const m = ar.missions.find(x => x.id === TR.mid);
    let pool = m.tasks();
    const ex = window[Object.keys(window).find(k => /^RPG_TASK_EXTRA_\d$/.test(k))];
    if (ex && typeof ex[TR.mid] === 'function') pool = pool.concat(ex[TR.mid]());
    if (!S.trainErrs) S.trainErrs = {};
    S.trainErrs['test-mise'] = { 0: 4 };
    const bag = trBuildBag(pool, 'test-mise');
    const idx0Count = bag.filter(e => e.idx === 0).length;
    return { idx0Count, poolLen: pool.length };
  });
  ok(weightedCheck.idx0Count === 5, `index s chybovostí 4 je v pytlíku 5× (je ${weightedCheck.idx0Count}× z poolu ${weightedCheck.poolLen})`);

  // ── 3) trWrong() zapíše chybu na TR.curIdx, trDraw() dodá platný curIdx ──
  const idxBefore = await page.evaluate(() => TR.curIdx);
  ok(idxBefore != null, `trDraw() nastavil TR.curIdx (je ${idxBefore})`);
  await page.evaluate(() => {
    const inp = document.getElementById('tr-ans');
    if (inp && document.getElementById('tr-input-row').style.display !== 'none') { inp.value = '__spatne__'; trSubmit(); }
    else { const btns = document.querySelectorAll('#tr-mc .mc-btn,#tr-yn-row button'); if (btns[0]) btns[0].click(); }
  });
  await page.waitForTimeout(150);
  const recordedErr = await page.evaluate((idx) => (S.trainErrs && S.trainErrs['1-1'] && S.trainErrs['1-1'][idx]) || 0, idxBefore);
  ok(recordedErr >= 1, `chyba na indexu ${idxBefore} se zapsala do S.trainErrs (je ${recordedErr})`);

  // ── 4) trCorrect() sníží zpět chybovost daného indexu ──
  await page.evaluate((idx) => { S.trainErrs['1-1'][idx] = 3; TR.curIdx = idx; trCorrect(); }, idxBefore);
  const afterDecay = await page.evaluate((idx) => S.trainErrs['1-1'][idx], idxBefore);
  ok(afterDecay === 2, `správná odpověď sníží chybovost o 1 (3→${afterDecay})`);

  // ── 5) pytlík se nikdy nevyprázdní bez náhrady (trDraw funguje opakovaně) ──
  let allOk = true;
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => trDraw());
    const t = await page.evaluate(() => TR.task);
    if (!t) { allOk = false; break; }
  }
  ok(allOk, '30× po sobě trDraw() vrátí platnou úlohu (pytlík se správně doplňuje)');

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Adaptivní trénink — shuffle-bag (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
