// CERMAT test flow — Playwright headless, mock Supabase, ověří gate→start→vyplnění→odevzdání→skóre
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 18752;
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
  // blokuj vše externí (Google Fonts, jsdelivr CDN) — jinak domcontentloaded visí
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1:' + PORT) ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/projects/rpg-mat-9.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof RPG_CERMAT_9 !== 'undefined' && typeof go === 'function', { timeout: 8000 });

  // start hry (jméno)
  await page.evaluate(() => { localStorage.clear(); const inp = document.getElementById('ni'); if (inp) inp.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  // otevři CERMAT gate
  await page.evaluate(() => go('cermat'));
  await page.waitForFunction(() => document.querySelector('#s-cermat')?.classList.contains('active'), { timeout: 5000 });
  ok(await page.evaluate(() => document.getElementById('cm-gate').style.display !== 'none'), 'gate se zobrazí');

  // start testu
  await page.evaluate(() => cmStart());
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => CM.on === true), 'test běží (CM.on)');
  ok(await page.evaluate(() => CM.tasks.length === 16), 'test má 16 úloh');
  const taskCards = await page.evaluate(() => document.querySelectorAll('#cm-tasks .cm-task').length);
  ok(taskCards === 16, `16 karet úloh vykresleno (je ${taskCards})`);

  // timer běží
  ok(await page.evaluate(() => CM.timeLeft <= 70 * 60 && CM.timeLeft > 70 * 60 - 5), 'časomíra nastavena na ~70 min');

  // vyplň VŠECHNY úlohy správně (přes CM.tasks — známe správné odpovědi)
  await page.evaluate(() => {
    CM.tasks.forEach(t => {
      if (t.kind === 'tfgrid') {
        t.statements.forEach((s, i) => { const el = document.querySelector(`input[name="cm-tf-${t.no}-${i}"][value="${s.ans}"]`); if (el) el.checked = true; });
      } else if (t.kind === 'mc') {
        const el = document.querySelector(`input[name="cm-mc-${t.no}"][value="${t.ans}"]`); if (el) el.checked = true;
      } else if (t.kind === 'match') {
        t.prompts.forEach((p, i) => { const sel = document.getElementById(`cm-match-${t.no}-${i}`); if (sel) sel.value = t.ans[i]; });
      } else {
        (t.parts || []).forEach((p, i) => { const inp = document.getElementById(`cm-p-${t.no}-${i}`); if (inp) inp.value = String(p.ans); });
      }
    });
  });

  // odevzdej (bypass confirm)
  await page.evaluate(() => { window.confirm = () => true; cmSubmit(false); });
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.getElementById('cm-end').style.display !== 'none'), 'výsledková obrazovka se zobrazí');
  const scoreTxt = await page.evaluate(() => document.getElementById('cm-end-score').textContent);
  ok(/50 \/ 50/.test(scoreTxt), `plný počet bodů za správné odpovědi (je "${scoreTxt}")`);
  ok(await page.evaluate(() => CM.on === false), 'test ukončen (CM.on=false)');
  ok(await page.evaluate(() => S.cermat.attempts.length === 1 && S.cermat.best === 50), 'výsledek uložen do S.cermat, best=50');
  const reviewItems = await page.evaluate(() => document.querySelectorAll('#cm-end-detail .cm-review-item').length);
  ok(reviewItems === 16, `rozbor má 16 řádků (je ${reviewItems})`);
  const openCountCorrect = await page.evaluate(() => document.querySelectorAll('#cm-end-detail details.cm-review-item[open]').length);
  ok(openCountCorrect === 0, `žádná úloha není auto-rozbalená, když je vše správně (je ${openCountCorrect})`);
  const solCountCorrect = await page.evaluate(() => document.querySelectorAll('#cm-end-detail .cm-review-sol').length);
  ok(solCountCorrect === 32, `vyřešený postup (sol) se vykreslí pro všech 32 podúloh (je ${solCountCorrect})`);

  // druhý pokus: vše ŠPATNĚ → 0 bodů, best zůstane 50
  await page.evaluate(() => { go('cermat'); cmStart(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    CM.tasks.forEach(t => {
      if (t.kind === 'tfgrid') t.statements.forEach((s, i) => { const el = document.querySelector(`input[name="cm-tf-${t.no}-${i}"][value="${s.ans === 'A' ? 'N' : 'A'}"]`); if (el) el.checked = true; });
      else if (t.kind === 'mc') { /* nech prázdné */ }
      else if (t.kind === 'match') { /* nech prázdné */ }
      else (t.parts || []).forEach((p, i) => { const inp = document.getElementById(`cm-p-${t.no}-${i}`); if (inp) inp.value = 'XYZ_spatne'; });
    });
    window.confirm = () => true; cmSubmit(false);
  });
  await page.waitForTimeout(200);
  const score2 = await page.evaluate(() => document.getElementById('cm-end-score').textContent);
  ok(/^0 \//.test(score2), `špatné odpovědi = 0 bodů (je "${score2}")`);
  ok(await page.evaluate(() => S.cermat.best === 50), 'best zůstal 50 po horším pokusu');
  const openCountWrong = await page.evaluate(() => document.querySelectorAll('#cm-end-detail details.cm-review-item[open]').length);
  ok(openCountWrong === 16, `všechny úlohy jsou auto-rozbalené, když je vše špatně (je ${openCountWrong})`);

  // XSS: škodlivý vstup v textovém poli odpovědi se v rozboru nesmí vykonat, musí být escapovaný
  await page.evaluate(() => { go('cermat'); cmStart(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const t = CM.tasks.find(t => !t.kind && t.parts && t.parts.length);
    const inp = t ? document.getElementById(`cm-p-${t.no}-0`) : null;
    if (inp) inp.value = '<img src=x onerror="window.__xss=1">';
    window.confirm = () => true; cmSubmit(false);
  });
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => window.__xss !== 1), 'škodlivý vstup v odpovědi se nespustí');
  const givenHtml = await page.evaluate(() => {
    const el = [...document.querySelectorAll('#cm-end-detail .cm-review-given')].find(e => e.textContent.includes('img'));
    return el ? el.innerHTML : null;
  });
  ok(!!givenHtml && givenHtml.includes('&lt;img'), `payload je v review escapovaný (${givenHtml})`);

  // časomíra vypršení → auto-submit
  await page.evaluate(() => { go('cermat'); cmStart(); CM.timeLeft = 1; window.confirm = () => true; });
  await page.waitForTimeout(1400);
  ok(await page.evaluate(() => CM.on === false), 'po vypršení času se test auto-odevzdá');

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  CERMAT test: ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
