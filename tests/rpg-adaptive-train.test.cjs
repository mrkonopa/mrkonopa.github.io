// Adaptivní trénink (g9): ověří, že trWeightedPick zvýhodňuje indexy s chybami
// a že trWrong/trCorrect zapisují/odbourávají S.trainErrs správně.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 18753;
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
  await page.goto(`http://127.0.0.1:${PORT}/projects/rpg-mat-9.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startTrain === 'function' && typeof trWeightedPick === 'function', { timeout: 8000 });

  await page.evaluate(() => { localStorage.clear(); const inp = document.getElementById('ni'); if (inp) inp.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  // vyber první nenáhodnou misi (1-1) a spusť trénink
  await page.evaluate(() => startTrain('1-1'));
  await page.waitForFunction(() => TR.task != null, { timeout: 5000 });

  const poolLen = await page.evaluate(() => trPool().length);
  ok(poolLen >= 4, `pool mise 1-1 má aspoň 4 úlohy (má ${poolLen})`);

  // ── 1) bez chyb: rovnoměrné rozdělení (žádný index přehnaně nedominuje) ──
  const uniformDist = await page.evaluate((n) => {
    const counts = {};
    for (let i = 0; i < n; i++) { const idx = trWeightedPick(trPool()); counts[idx] = (counts[idx] || 0) + 1; }
    return counts;
  }, 2000);
  const uniformVals = Object.values(uniformDist);
  const uniformMax = Math.max(...uniformVals), uniformMin = Math.min(...uniformVals);
  ok(uniformMax / uniformMin < 3, `bez chyb je rozdělení zhruba rovnoměrné (max/min = ${(uniformMax / uniformMin).toFixed(2)})`);

  // ── 2) uměle nastavíme vysokou chybovost indexu 0, ověříme zvýhodnění ──
  const weightedDist = await page.evaluate((n) => {
    if (!S.trainErrs) S.trainErrs = {};
    S.trainErrs['1-1'] = { 0: 4 }; // max boost (capped na 4 v trWeightedPick)
    const counts = {};
    for (let i = 0; i < n; i++) { const idx = trWeightedPick(trPool()); counts[idx] = (counts[idx] || 0) + 1; }
    return counts;
  }, 3000);
  const idx0Share = (weightedDist[0] || 0) / 3000;
  // teoretický podíl = 5/(5+(poolLen-1)) ; práh s rezervou na vzorkovací šum, pořád mnohonásobně nad baseline 1/poolLen
  ok(idx0Share > 0.18, `index s chybovostí 4 se losuje výrazně častěji (podíl ${(idx0Share * 100).toFixed(1)} %, baseline by byl ${(100 / poolLen).toFixed(1)} %)`);

  // ── 3) trWrong() zapíše chybu do S.trainErrs na TR.curIdx ──
  await page.evaluate(() => { S.trainErrs = {}; saveS(); });
  await page.evaluate(() => trDraw());
  const idxBefore = await page.evaluate(() => TR.curIdx);
  await page.evaluate(() => {
    const inp = document.getElementById('tr-ans');
    if (inp && inp.style.display !== 'none' && document.getElementById('tr-input-row').style.display !== 'none') { inp.value = '__spatne__'; trSubmit(); }
    else { document.querySelectorAll('#tr-mc .mc-btn,#tr-yn-row button')[0]?.click(); }
  });
  await page.waitForTimeout(150);
  const recordedErr = await page.evaluate((idx) => (S.trainErrs && S.trainErrs['1-1'] && S.trainErrs['1-1'][idx]) || 0, idxBefore);
  ok(recordedErr >= 1, `chyba na indexu ${idxBefore} se zapsala do S.trainErrs (je ${recordedErr})`);

  // ── 4) trCorrect() sníží zpět S.trainErrs pro daný index ──
  await page.evaluate((idx) => { S.trainErrs['1-1'][idx] = 3; }, idxBefore);
  await page.evaluate((idx) => { TR.curIdx = idx; TR.task = trPool()[idx]; trCorrect(); }, idxBefore);
  const afterDecay = await page.evaluate((idx) => S.trainErrs['1-1'][idx], idxBefore);
  ok(afterDecay === 2, `správná odpověď sníží chybovost o 1 (3→${afterDecay})`);

  // ── 5) speciální režimy (spojovačka apod.) nesmí omylem odečíst chybu z jiného indexu ──
  await page.evaluate(() => { S.trainErrs['1-1'] = { 0: 3 }; TR.curIdx = 0; });
  await page.evaluate(() => { if (typeof trSpecialBegin === 'function') trSpecialBegin(); });
  const curIdxAfterSpecial = await page.evaluate(() => TR.curIdx);
  ok(curIdxAfterSpecial === null, 'trSpecialBegin() resetuje TR.curIdx, aby speciální režimy neovlivnily cizí index');

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Adaptivní trénink: ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
