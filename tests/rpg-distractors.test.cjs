// Fáze 3b — distraktory na miskoncepce. Ověří: MC volby vždy obsahují
// správnou odpověď + 4 distinct; kurátorský t.distractors se objeví mezi
// volbami; distraktor se NIKDY nerovná ans; fallback (bez distractors) drží
// 4 volby. `node ... [9]` (kurátorský obsah zatím jen g9).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '9';
const PORT = 18850 + Number(GRADE);
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
  await page.waitForFunction(() => typeof startGame === 'function' && typeof launchBattle === 'function' && typeof renderMC === 'function', { timeout: 8000 });
  await page.evaluate(() => { localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  // ── 1) broad sweep: všechny MC mise × mnoho generací ──
  const sweep = await page.evaluate((g) => {
    const bank = window['RPG_TASK_EXTRA_' + g] || {};
    // robustně: g6–9 mají <span class="mc-key">A</span>+opt, compact g3–5 dataset.v
    const readOpts = () => [...document.querySelectorAll('#mc-grid .mc-btn')].map(b => {
      if (b.dataset && b.dataset.v != null) return b.dataset.v;
      const key = b.querySelector('.mc-key');
      return key ? b.textContent.slice(key.textContent.length) : b.textContent;
    });
    let renders = 0, badCount = 0, badDup = 0, distrEqAns = 0, curatedSeen = 0, curatedTotal = 0, nan = 0;
    for (const ar of AREAS) for (const m of ar.missions) {
      if (!m.mc) continue;
      for (let rep = 0; rep < 40; rep++) {
        let tasks; try { tasks = m.tasks(); if (typeof bank[m.id] === 'function') tasks = tasks.concat(bank[m.id]()); } catch (e) { continue; }
        tasks.forEach(t => {
          if (typeof isYN === 'function' && isYN(t)) return; // ANO/NE má vlastní řádek
          // distraktory se nikdy nerovnají ans
          if (Array.isArray(t.distractors)) { curatedTotal++; t.distractors.forEach(d => { if (String(d) === String(t.ans)) distrEqAns++; }); }
          renderMC(t);
          const opts = readOpts();
          renders++;
          if (opts.length !== 4) badCount++;
          if (new Set(opts).size !== opts.length) badDup++;
          if (!opts.includes(String(t.ans))) badCount++;
          if (opts.some(o => o === 'NaN' || o === 'undefined')) nan++;
          if (Array.isArray(t.distractors) && t.distractors.length) {
            const seen = t.distractors.some(d => String(d) !== String(t.ans) ? opts.includes(String(d)) : true);
            if (seen) curatedSeen++;
          }
        });
      }
    }
    return { renders, badCount, badDup, distrEqAns, curatedSeen, curatedTotal, nan };
  }, Number(GRADE));
  ok(sweep.renders > 200, `proběhlo dost renderů (${sweep.renders})`);
  ok(sweep.badCount === 0, `každá MC úloha má 4 volby včetně správné (chyb ${sweep.badCount})`);
  ok(sweep.badDup === 0, `žádné duplicitní volby (dup ${sweep.badDup})`);
  ok(sweep.nan === 0, `žádné NaN/undefined volby (${sweep.nan})`);
  ok(sweep.distrEqAns === 0, `kurátorský distraktor se NIKDY nerovná správné odpovědi (kolizí ${sweep.distrEqAns})`);
  // kurátorský obsah zatím jen g9 (pilot); na ostatních ročnících ověřujeme
  // jen bezpečnost infry (honor-line/mcWrong nerozbily MC generování)
  if (sweep.curatedTotal > 0) {
    ok(sweep.curatedSeen > 0, `kurátorský distraktor se objevuje mezi volbami (${sweep.curatedSeen}×)`);
  } else {
    ok(true, 'ročník zatím bez kurátorských distraktorů (ověřena jen bezpečnost infry)');
  }

  // ── 2) fallback: úloha bez distractors dá 4 volby ──
  const fb = await page.evaluate(() => {
    renderMC({ text: 'x', ans: '42' });
    const opts = [...document.querySelectorAll('#mc-grid .mc-btn')].map(b => { if (b.dataset && b.dataset.v != null) return b.dataset.v; const key = b.querySelector('.mc-key'); return key ? b.textContent.slice(key.textContent.length) : b.textContent; });
    return { four: opts.length === 4, hasAns: opts.includes('42'), distinct: new Set(opts).size === 4 };
  });
  ok(fb.four && fb.hasAns && fb.distinct, 'fallback bez distractors dá 4 distinct volby se správnou');

  // ── 3) honor: explicitní distraktor se dostane mezi volby ──
  const honor = await page.evaluate(() => {
    let hit = 0;
    for (let i = 0; i < 20; i++) { renderMC({ text: 'x', ans: '10', distractors: ['20'] }); const opts = [...document.querySelectorAll('#mc-grid .mc-btn')].map(b => { if (b.dataset && b.dataset.v != null) return b.dataset.v; const key = b.querySelector('.mc-key'); return key ? b.textContent.slice(key.textContent.length) : b.textContent; }); if (opts.includes('20') && opts.includes('10')) hit++; }
    return hit;
  });
  ok(honor === 20, `explicitní distraktor je vždy mezi volbami (${honor}/20)`);

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Distraktory (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
