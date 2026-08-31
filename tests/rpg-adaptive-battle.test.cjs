// Tichá adaptivní obtížnost boje (ZPD) — pilot g9.
// Ověří: pool/srcIdx invarianty, přepínání módu (2 chyby → lehčí + delší čas,
// 3 správné → těžší + XP bonus), save-bezpečnost done klíčů, tichost (žádné
// hlášky o obtížnosti), mini pozice bez swapu. `node ... [9]` (default 9).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '9';
const PORT = 18980 + Number(GRADE);
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
  await page.waitForFunction(() => typeof adaptMaybeSwap === 'function' && typeof startGame === 'function', { timeout: 8000 });
  await page.evaluate(() => { localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  // použij NE-MC misi (1-2), ať jde o textové odpovědi
  await page.evaluate(() => { const ar = AREAS[0]; launchBattle(ar.id, ar.missions[1].id); });
  await page.waitForFunction(() => typeof BT !== 'undefined' && BT.curTask, { timeout: 5000 });

  // ── 1) invarianty poolu ──
  const inv = await page.evaluate(() => ({
    poolBigger: BT.pool.length > BT.tasks.length,
    srcLen: BT.srcIdx.length === BT.tasks.length,
    mapped: BT.srcIdx.every((pi, i) => BT.tasks[i] === BT.pool[pi]),
    adapt: JSON.stringify(BT.adapt)
  }));
  ok(inv.poolBigger, 'pool je větší než výběr (banka se přidala)');
  ok(inv.srcLen && inv.mapped, 'srcIdx mapuje pozice na pool (tasks[i]===pool[srcIdx[i]])');
  ok(inv.adapt === '{"errRow":0,"okRow":0,"mode":0}', 'adapt startuje neutrálně');

  // ── 2) 2 chyby → mode -1, delší čas, lehčí úloha ──
  const easier = await page.evaluate(() => {
    adaptOnAnswer(false); adaptOnAnswer(false);
    const mode = BT.adapt.mode;
    // najdi další nesplněnou pozici a re-renderuj
    BT.idx = BT.tasks.findIndex((_, i) => !S.done[`${BT.mid}-${i}`] && i !== BT._rendered);
    if (BT.idx < 0) BT.idx = 0;
    const beforeIdx = BT.srcIdx[BT.idx];
    renderTask();
    const t = BT.curTask;
    /* Základ NENÍ konstanta: `casNaUlohu(t)` přidává čas podle délky
       zadání (+1 s za 6 znaků nad 50). Dokud tu stálo TIME_PER_TASK,
       test procházel jen když padla krátká úloha — v devítce náhodou
       ano, v šestce ne. Byl by tedy nestabilní i tam, kde „prochází". */
    const base = (typeof casNaUlohu === 'function' ? casNaUlohu(t) : TIME_PER_TASK)
      + ((typeof RPGWallet !== 'undefined' && RPGWallet.hasPowerup('pu-time-bonus')) ? 5 : 0);
    const scores = BT.pool.map((_, i) => adaptScore(i)).sort((a, b) => a - b);
    const third = scores[Math.max(0, Math.floor(scores.length / 3) - 1)];
    return { mode, limit: BT.curLimit, expected: Math.round(base * 1.2), isMini: !!BT.mini[BT.idx], newScore: adaptScore(BT.srcIdx[BT.idx]), third, changed: BT.srcIdx[BT.idx] !== beforeIdx };
  });
  ok(easier.mode === -1, '2 chyby v řadě → mode -1');
  ok(easier.isMini || easier.limit === easier.expected, `časomíra ×1,2 (limit ${easier.limit}, čekáno ${easier.expected}${easier.isMini ? ', mini pozice' : ''})`);
  ok(easier.isMini || easier.newScore <= easier.third + 0.34, `podsunutá úloha je z lehčí části poolu (score ${easier.newScore.toFixed(2)})`);

  // ── 3) 3 správné → mode +1 a XP bonus +2 ──
  const harder = await page.evaluate(() => {
    adaptOnAnswer(true); adaptOnAnswer(true); adaptOnAnswer(true);
    return BT.adapt.mode;
  });
  ok(harder === 1, '3 správné v řadě → mode +1');
  // XP bonus: najdi textovou nesplněnou pozici (miniForIdx přiřazuje minihru
  // líně až při renderu → ověř AŽ PO renderTask a případně zkus další pozici)
  const xp = await page.evaluate(() => {
    for (let i = 0; i < BT.tasks.length; i++) {
      if (S.done[`${BT.mid}-${i}`]) continue;
      BT.idx = i; BT._rendered = -1; renderTask();
      if (BT.mini && BT.mini[i]) continue;          // stala se z ní minihra → další
      BT.adapt.okRow = 3; BT.adapt.mode = 1;        // render mohl mód změnit — vrať těžší
      BT.combo = 0; BT.hl = 0;                      // ne-crit, bez nápovědy
      const before = S.xp;
      const inp = document.getElementById('bt-ans');
      inp.disabled = false; inp.value = String(BT.curTask.ans);
      submitAnswer();
      return { delta: S.xp - before, fb: document.getElementById('bt-fb').textContent };
    }
    return null;
  });
  // 2. stupeň: základ 10 + 2; 1. stupeň: základ 7 + 2
  const expDelta = Number(GRADE) <= 5 ? 9 : 12;
  ok(!xp || xp.delta === expDelta, `těžší úloha dává +2 XP (delta ${xp ? xp.delta : 'přeskočeno'}, čekáno ${expDelta})`);

  // ── 4) hystereze: správná po chybách nuluje errRow ──
  const hyst = await page.evaluate(() => { BT.adapt = { errRow: 1, okRow: 0, mode: 0 }; adaptOnAnswer(true); return BT.adapt.errRow === 0 && BT.adapt.mode === 0; });
  ok(hyst, 'správná odpověď nuluje sérii chyb (hystereze)');

  // ── 5) save-bezpečnost: dohrát misi s adaptací → done klíče přesně mid-0..5 ──
  const done = await page.evaluate(() => {
    // GODMODE průchod: odpověz správně všechno zbývající (mini splň přes battleMiniDone)
    for (let i = 0; i < BT.tasks.length; i++) {
      if (S.done[`${BT.mid}-${i}`]) continue;
      BT.idx = i; BT._rendered = -1; renderTask();
      if (BT.mini && BT.mini[i]) { battleMiniDone(); continue; }
      document.getElementById('bt-ans').disabled = false;
      document.getElementById('bt-ans').value = String(BT.curTask.ans);
      submitAnswer();
    }
    const keys = Object.keys(S.done).filter(k => k.startsWith(BT.mid + '-')).sort();
    const expect = BT.tasks.map((_, i) => `${BT.mid}-${i}`).sort();
    return { keys: JSON.stringify(keys), expect: JSON.stringify(expect), boss: BT.bossDefeated };
  });
  ok(done.keys === done.expect, `done klíče přesně mid-0..tc-1 (${done.keys})`);
  ok(done.boss === true, 'mise s adaptací jde dohrát (bossDefeated)');

  // ── 6) tichost: žádné hlášky o obtížnosti ──
  const silent = await page.evaluate(() => !/lehčí|snadnější|jednodušší|těžší|obtížnost/i.test(document.getElementById('bt-fb').textContent));
  ok(silent, 'feedback nikdy nezmíní změnu obtížnosti');

  // ── 7) mini pozice: renderBattleMini se swapu vyhne ──
  const mini = await page.evaluate(() => {
    const ar = AREAS[0]; launchBattle(ar.id, ar.missions[2].id);
    const mIdx = Object.keys(BT.mini).map(Number);
    if (!mIdx.length) return { skip: true };
    const i = mIdx[0]; const before = BT.srcIdx[i];
    BT.adapt.mode = -1; BT.idx = i; renderTask();
    return { skip: false, unchanged: BT.srcIdx[i] === before };
  });
  ok(mini.skip || mini.unchanged, 'mini pozice se při swapu nemění');

  // ── 8) osobní signál: trainErrs zvyšuje adaptScore ──
  const pers = await page.evaluate(() => {
    if (!S.trainErrs) S.trainErrs = {};
    S.trainErrs[BT.mid] = { 0: 4 };
    return adaptScore(0) > 0.9;
  });
  ok(pers, 'index s chybovostí 4 má vysoké adaptScore (osobní signál)');

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Adaptivní boj (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
