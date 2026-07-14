// Hvězdné opakování (spaced repetition mastery) — pilot g9.
// Ověří: due detekci (3/7/21 dní), panel na mapě, oživovací sezení (5 správných
// → hvězda + kredity), anti-farming (1× za den/interval), migraci starých save
// a hostile sanitizaci. Parametrizováno ročníkem: `node ... [9]` (default 9).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '9';
const PORT = 18960 + Number(GRADE);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m); } };
const dAgo = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

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
  await page.waitForFunction(() => typeof reviveState === 'function' && typeof startGame === 'function', { timeout: 8000 });
  await page.evaluate(() => { localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  // ── 1) due detekce a panel ──
  await page.evaluate((d) => { S.mastery['1-1'] = { score: 15, mastered: true, stars: 0, lastOk: d, starHist: [] }; saveS(); renderMap(); }, dAgo(4));
  ok(await page.evaluate(() => dueRevives().some(x => x.mid === '1-1')), 'mastered + lastOk před 4 dny → due');
  ok(await page.evaluate(() => document.getElementById('map-revive').style.display === 'block'), 'panel „Dnes k oživení" se zobrazí');
  await page.evaluate((d) => { S.mastery['1-1'].lastOk = d; saveS(); renderMap(); }, dAgo(2));
  ok(await page.evaluate(() => !dueRevives().length && document.getElementById('map-revive').style.display === 'none'), 'lastOk před 2 dny → NENÍ due, panel skrytý');
  ok(await page.evaluate(() => { S.mastery['1-2'] = { score: 3, mastered: false, stars: 0, lastOk: '', starHist: [] }; return !dueRevives().some(x => x.mid === '1-2'); }), 'nemastered téma nikdy není due');

  // ── 2) klik Oživit → trénink s revive sezením ──
  await page.evaluate((d) => { S.mastery['1-1'].lastOk = d; saveS(); renderMap(); }, dAgo(4));
  await page.evaluate(() => document.querySelector('#map-revive button').click());
  await page.waitForFunction(() => document.querySelector('#s-train')?.classList.contains('active') && TR.task != null, { timeout: 5000 });
  ok(await page.evaluate(() => TR.revive && TR.revive.count === 0 && !TR.revive.earned), 'trénink startuje s revive sezením');
  ok(await page.evaluate(() => document.getElementById('tr-revive-chip').style.display !== 'none'), 'chip „Oživení: 0/5" viditelný');

  // ── 3) 5 správných → hvězda + kredity ──
  const before = await page.evaluate(() => (typeof RPGWallet !== 'undefined') ? RPGWallet.getCredits() : S.credits);
  await page.evaluate(() => { for (let i = 0; i < 5; i++) { TR.task = { ans: '1', skill: null, hints: [] }; TR.curIdx = 0; trCorrect(); } });
  const after = await page.evaluate(() => (typeof RPGWallet !== 'undefined') ? RPGWallet.getCredits() : S.credits);
  ok(await page.evaluate(() => S.mastery['1-1'].stars === 1), '5 správných → 1. hvězda');
  ok(after - before === 10, `+10 kreditů za 1. hvězdu (delta ${after - before})`);
  ok(await page.evaluate(() => S.mastery['1-1'].lastOk === new Date().toISOString().slice(0, 10)), 'lastOk = dnešek');
  ok(await page.evaluate(() => document.getElementById('tr-fb').textContent.includes('⭐')), 'feedback obsahuje ⭐');

  // ── 4) anti-farming: týž den znovu → žádné revive sezení, hvězda drží ──
  await page.evaluate(() => { go('map'); goPractice('1-1'); });
  await page.waitForFunction(() => TR.task != null, { timeout: 5000 });
  ok(await page.evaluate(() => TR.revive === null), 'nový trénink týž den → revive sezení neběží');
  await page.evaluate(() => { for (let i = 0; i < 5; i++) { TR.task = { ans: '1', skill: null, hints: [] }; TR.curIdx = 0; trCorrect(); } });
  ok(await page.evaluate(() => S.mastery['1-1'].stars === 1), 'hvězdy zůstávají 1 (nelze farmit)');

  // ── 5) stupňování 3-7-21 ──
  const steps = await page.evaluate((d8) => {
    const out = {};
    S.mastery['1-1'].stars = 1; S.mastery['1-1'].lastOk = d8;           // 8 dní, potřeba ≥7
    out.due2 = reviveState('1-1').due;
    S.mastery['1-1'].lastOk = d8; S.mastery['1-1'].stars = 2;           // 8 dní, potřeba ≥21
    out.notDue3 = !reviveState('1-1').due;
    return out;
  }, dAgo(8));
  ok(steps.due2, 'stars=1 + 8 dní → due (práh 7)');
  ok(steps.notDue3, 'stars=2 + 8 dní → NENÍ due (práh 21)');
  const third = await page.evaluate((d22) => { S.mastery['1-1'].stars = 2; S.mastery['1-1'].lastOk = d22; return reviveState('1-1').due; }, dAgo(22));
  ok(third, 'stars=2 + 22 dní → due (práh 21)');
  await page.evaluate(() => { S.mastery['1-1'].stars = 3; });
  ok(await page.evaluate(() => !reviveState('1-1').due && !dueRevives().some(x => x.mid === '1-1')), 'stars=3 → nikdy víc due');

  // ── 6) migrace: starý save {score,mastered} bez lastOk ──
  const mig = await page.evaluate(() => {
    S.mastery['2-1'] = { score: 15, mastered: true };
    sanitizeMastery();
    const m = S.mastery['2-1'];
    return { lastOk: m.lastOk, stars: m.stars, today: new Date().toISOString().slice(0, 10) };
  });
  ok(mig.lastOk === mig.today && mig.stars === 0, 'migrace: mastered bez lastOk → lastOk=dnes, stars=0');

  // ── 7) hostile sanitizace ──
  const host = await page.evaluate(() => {
    S.mastery['3-1'] = { score: 15, mastered: true, stars: 99, lastOk: '2999-01-01' };
    S.mastery['3-2'] = { score: 15, mastered: true, stars: -5, lastOk: 'garbage' };
    S.mastery['3-3'] = { score: 3, mastered: false, stars: 2, lastOk: '2020-01-01' };
    S.mastery['4-1'] = 'string';
    sanitizeMastery();
    const t = new Date().toISOString().slice(0, 10);
    return {
      a: S.mastery['3-1'].stars === 3 && S.mastery['3-1'].lastOk === t,
      b: S.mastery['3-2'].stars === 0 && S.mastery['3-2'].lastOk === t,
      c: S.mastery['3-3'].stars === 0 && S.mastery['3-3'].lastOk === '',
      d: typeof S.mastery['4-1'] === 'object' && S.mastery['4-1'].mastered === false,
      notDueFuture: !reviveState('3-1').due
    };
  });
  ok(host.a, 'stars 99 → 3, lastOk 2999 → dnes');
  ok(host.b, 'stars -5 → 0, garbage datum → dnes');
  ok(host.c, 'mastered=false s hvězdami → stars=0');
  ok(host.d, 'mastery „string" → reset na objekt');
  ok(host.notDueFuture, 'clampnuté budoucí datum → dnes NENÍ due');

  // ── 8) max 3 témata v panelu, řazení dle přetažení ──
  const panel = await page.evaluate((d30) => {
    ['5-1', '5-2', '5-3', '6-1', '6-2'].forEach((mid, i) => {
      S.mastery[mid] = { score: 15, mastered: true, stars: 0, lastOk: new Date(Date.now() - (4 + i * 3) * 864e5).toISOString().slice(0, 10), starHist: [] };
    });
    const due = dueRevives();
    return { n: due.length, first: due[0].mid, overSorted: due.every((d, i, a) => i === 0 || a[i - 1].over >= d.over) };
  }, dAgo(30));
  ok(panel.n === 3, `panel max 3 témata (je ${panel.n})`);
  ok(panel.overSorted, 'seřazeno dle přetažení sestupně');

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Hvězdné opakování (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
