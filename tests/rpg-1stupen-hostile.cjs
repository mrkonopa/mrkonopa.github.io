/* ════════════════════════════════════════════════════════════════════
   "ZMRD MODE" — agresivní adversariální harness pro 1. stupeň (3./4./5.)
   Snaží se hru rozbít: XSS přes jméno i save, tampering typů/rozsahů,
   prototype pollution, zneplatné URL preview, fuzzing konzolových funkcí,
   fuzzing mcDistractors, spam. Hlásí každý nález.
   ════════════════════════════════════════════════════════════════════ */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
function serve() { return new Promise(res => { const s = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html'; const f = path.normalize(path.join(ROOT, u)); if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('nf'); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }); s.listen(0, () => res(s)); }); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

const GAMES = { 3: 'RPG_MAT_3', 4: 'RPG_MAT_4', 5: 'RPG_MAT_5' };
const bugs = [];
const ok = [];
function bug(grade, scenario, detail) { bugs.push(`[g${grade}] ${scenario}: ${detail}`); }
function pass(grade, scenario) { ok.push(`[g${grade}] ${scenario}`); }

const XSS = `<img src=x onerror="window.__xss=(window.__xss||0)+1">`;
const XSS2 = `"><script>window.__xss=1</script>`;

async function newPage(browser, base, grade, initSave) {
  const ctx = await browser.newContext({ viewport: { width: 480, height: 860 } });
  // abort all external requests (CDN/fonts/supabase) so loads are fast and never hang
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  await ctx.addInitScript(({ key, save }) => {
    window.__xss = 0;
    if (save !== null) { try { localStorage.setItem(key, save); } catch (e) {} }
  }, { key: GAMES[grade], save: initSave === undefined ? null : initSave });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e)));
  page.on('dialog', d => { const m = d.message(); if (/<|>|script|onerror|__xss/i.test(m)) errs.push('DIALOG injection: ' + m); d.dismiss().catch(() => {}); });
  page._errs = errs;
  return { ctx, page };
}
function realErrs(errs) {
  // ignore network/cert noise from blocked CDN
  return errs.filter(e => !/ERR_CERT|ERR_FAILED|ERR_ABORTED|net::|jsdelivr|supabase|Failed to load resource|CDN/i.test(e));
}

(async () => {
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC });

  for (const grade of [3, 4, 5]) {
    const url = `${base}/projects/rpg-mat-${grade}.html`;

    // ───── ATTACK 1: XSS přes jméno ─────
    {
      const { ctx, page } = await newPage(browser, base, grade);
      await page.goto(url, { waitUntil: 'domcontentloaded' }); await sleep(600);
      await page.evaluate((x) => { document.getElementById('ni').value = x; startGame(); }, XSS);
      await sleep(400);
      // projdi profil + oblast + boj
      await page.evaluate(() => { try { go('profile'); } catch (e) {} }); await sleep(200);
      await page.evaluate(() => { try { openArea(AREAS[0].id); } catch (e) {} }); await sleep(200);
      const xss = await page.evaluate(() => window.__xss || 0);
      const nameShown = await page.evaluate(() => { const e = document.getElementById('map-name'); return e ? e.textContent : ''; });
      if (xss > 0) bug(grade, 'XSS-jméno', `payload se spustil (__xss=${xss})`); else pass(grade, 'XSS-jméno neproběhlo');
      const re = realErrs(page._errs); if (re.length) bug(grade, 'XSS-jméno', 'JS chyby: ' + re.slice(0, 2).join(' | '));
      await ctx.close();
    }

    // ───── ATTACK 2: XSS + tampering přes podvržený save ─────
    {
      const hostile = JSON.stringify({
        name: XSS, xp: 'NaN', level: -5, attrs: { calc: XSS, geo: '<b>x', anal: 1e308, craft: null },
        done: { ['1-1-0']: XSS }, inv: [XSS, XSS2, 'gold-leaf'], ach: { boot: XSS }, errs: { '1-1': 'lol' },
        mastery: { '1-1': { score: 'XXX', mastered: 'yes' }, '2-1': { score: -9999, mastered: 1 } },
        streak: { count: 'NaN', last: XSS }, settings: { reducedMotion: 'banana' },
        xpClaimed: { a: 1 }, stats: { bestCombo: XSS }, creditsClaimed: true,
      });
      const { ctx, page } = await newPage(browser, base, grade, hostile);
      await page.goto(url, { waitUntil: 'domcontentloaded' }); await sleep(700);
      // continueGame pokud lze, jinak startGame
      await page.evaluate(() => { try { if (typeof continueGame === 'function') continueGame(); else startGame(); } catch (e) { window.__bootErr = String(e); } });
      await sleep(400);
      for (const nav of ['profile', 'map']) { await page.evaluate((n) => { try { go(n); } catch (e) {} }, nav); await sleep(150); }
      await page.evaluate(() => { try { openArea(AREAS[0].id); } catch (e) {} }); await sleep(150);
      await page.evaluate(() => { try { renderTrainPicker && renderTrainPicker(); } catch (e) {} }); await sleep(150);
      const xss = await page.evaluate(() => window.__xss || 0);
      const bootErr = await page.evaluate(() => window.__bootErr || '');
      if (xss > 0) bug(grade, 'XSS-save', `payload ze save se spustil (__xss=${xss})`); else pass(grade, 'XSS-save neproběhlo');
      // ověř, že profil nezobrazuje "NaN"/"undefined"/payload jako atribut
      const attrTxt = await page.evaluate(() => { const e = document.getElementById('pr-attrs') || document.querySelector('[id*="attr"]'); return e ? e.textContent : ''; });
      if (/NaN|undefined|<img|onerror/i.test(attrTxt)) bug(grade, 'XSS-save', `atributy zobrazují špínu: "${attrTxt.slice(0, 60)}"`);
      const re = realErrs(page._errs); if (re.length) bug(grade, 'XSS-save', 'JS chyby: ' + re.slice(0, 3).join(' | ')); else pass(grade, 'save-tampering bez JS chyb');
      await ctx.close();
    }

    // ───── ATTACK 3: prototype pollution přes save ─────
    {
      const poll = '{"name":"x","__proto__":{"polluted":true},"attrs":{},"done":{},"inv":[]}';
      const { ctx, page } = await newPage(browser, base, grade, poll);
      await page.goto(url, { waitUntil: 'domcontentloaded' }); await sleep(500);
      await page.evaluate(() => { try { (typeof continueGame === 'function' ? continueGame : startGame)(); } catch (e) {} });
      await sleep(300);
      const polluted = await page.evaluate(() => ({}).polluted === true || Object.prototype.polluted === true);
      if (polluted) bug(grade, 'prototype-pollution', 'Object.prototype.polluted === true!'); else pass(grade, 'prototype-pollution odolala');
      await ctx.close();
    }

    // ───── ATTACK 4: zneužití URL preview parametru ─────
    {
      for (const mid of ['<script>window.__xss=1</script>', '1-1;alert(1)', "1-1' onload='x"]) {
        const { ctx, page } = await newPage(browser, base, grade);
        await page.goto(url + '?preview=1&mid=' + encodeURIComponent(mid), { waitUntil: 'domcontentloaded' }); await sleep(500);
        const xss = await page.evaluate(() => window.__xss || 0);
        if (xss > 0) bug(grade, 'preview-param', `mid="${mid}" → XSS (__xss=${xss})`);
        const re = realErrs(page._errs); if (re.length) bug(grade, 'preview-param', `mid="${mid}" → JS chyba: ` + re[0]);
        await ctx.close();
      }
      pass(grade, 'preview-param fuzzing');
    }

    // ───── ATTACK 5: fuzzing konzolových funkcí (zmrd u konzole) ─────
    {
      const { ctx, page } = await newPage(browser, base, grade);
      await page.goto(url, { waitUntil: 'domcontentloaded' }); await sleep(500);
      await page.evaluate(() => { document.getElementById('ni').value = 'ZMRD'; startGame(); }); await sleep(300);
      const result = await page.evaluate(() => {
        const out = [];
        const tryc = (label, fn) => { try { fn(); } catch (e) { out.push(label + ' THREW ' + (e && e.message)); } };
        // hostilní volání interních funkcí
        tryc('launchBattle(junk)', () => launchBattle('<x>', '<script>'));
        tryc('launchBattle(null)', () => launchBattle(null, null));
        tryc('openArea(999)', () => openArea(999));
        tryc('openArea(obj)', () => openArea({}));
        tryc('startLearn(junk)', () => startLearn('<img onerror=1>'));
        tryc('renderMC(junk)', () => renderMC({ ans: { toString() { return '<img src=x onerror="window.__xss=1">'; } } }));
        tryc('renderMC(mc_opts xss)', () => renderMC({ ans: '1', mc_opts: ['<img src=x onerror="window.__xss=1">', 'b', 'c'] }));
        tryc('pickMC(junk)', () => typeof pickMC === 'function' && pickMC(document.createElement('button'), {}, undefined));
        tryc('mcDistractors(xss)', () => mcDistractors('<img src=x onerror=1>'));
        tryc('mcDistractors(huge)', () => mcDistractors(1e309));
        tryc('mcDistractors(obj)', () => mcDistractors({}));
        tryc('useItem(-1)', () => typeof useItem === 'function' && useItem(-1));
        tryc('useItem(999)', () => typeof useItem === 'function' && useItem(999));
        tryc('buyItem(junk)', () => typeof buyItem === 'function' && buyItem('<x>'));
        tryc('goPractice(junk)', () => typeof goPractice === 'function' && goPractice('<x>'));
        tryc('saveS()', () => saveS());
        // ověř mcDistractors invarianty
        let mcBad = '';
        for (const a of ['7', '922000', '-5', '3,5', '0', 'ANO', '', 'NaN', String(1e20)]) {
          const d = mcDistractors(a);
          if (!Array.isArray(d) || d.length !== 3) mcBad += `len(${a})=${d && d.length};`;
          if (new Set(d).size !== 3) mcBad += `dup(${a});`;
          if (d.some(x => String(x) === String(a))) mcBad += `eqAns(${a});`;
          if (d.some(x => /<|>|script|onerror/i.test(String(x)))) mcBad += `xss(${a});`;
        }
        if (mcBad) out.push('mcDistractors invarianty: ' + mcBad);
        return out;
      });
      await sleep(300);
      const xss = await page.evaluate(() => window.__xss || 0);
      // hra pořád žije? zkus vrátit se na mapu a vykreslit
      const alive = await page.evaluate(() => { try { go('map'); renderMap(); return !!document.getElementById('map-grid').children.length; } catch (e) { return 'RENDER THREW ' + e.message; } });
      if (xss > 0) bug(grade, 'console-fuzz', `XSS přes interní funkci (__xss=${xss})`); else pass(grade, 'console-fuzz: žádné XSS');
      if (result.length) bug(grade, 'console-fuzz', result.join(' || '));
      if (alive !== true) bug(grade, 'console-fuzz', 'hra po fuzzingu nevykreslí mapu: ' + alive); else pass(grade, 'console-fuzz: hra přežila');
      const re = realErrs(page._errs).filter(e => !/THREW/.test(e));
      if (re.length) bug(grade, 'console-fuzz', 'nečekané JS chyby: ' + re.slice(0, 3).join(' | '));
      await ctx.close();
    }

    // ───── ATTACK 6: spam kliků v boji (dítě mlátí do tlačítek) ─────
    {
      const { ctx, page } = await newPage(browser, base, grade);
      await page.goto(url, { waitUntil: 'domcontentloaded' }); await sleep(400);
      await page.evaluate(() => { document.getElementById('ni').value = 'SPAM'; startGame(); }); await sleep(200);
      await page.evaluate(() => { const ar = AREAS[0]; launchBattle(ar.id, ar.missions[0].id); }); await sleep(400);
      const state = await page.evaluate(async () => {
        const slp = ms => new Promise(r => setTimeout(r, ms));
        for (let k = 0; k < 40; k++) {
          const mc = document.querySelectorAll('#mc-grid .mc-btn:not(:disabled)');
          if (mc.length) mc[k % mc.length].click();
          const ab = document.getElementById('attack-btn'); if (ab && !ab.disabled) { const inp = document.getElementById('bt-ans'); if (inp) inp.value = '999'; try { submitAnswer(); } catch (e) {} }
          const nb = document.getElementById('next-btn'); if (nb && nb.style.display !== 'none') { try { nextTask(); } catch (e) {} }
          if (k % 7 === 0) await slp(5);
        }
        return { hp: BT.hp, xp: S.xp, credits: (typeof RPGWallet !== 'undefined' ? RPGWallet.getCredits() : 0) };
      });
      let prob = '';
      if (!(state.hp >= 0 && state.hp <= 3)) prob += `hp=${state.hp};`;
      if (!Number.isFinite(state.xp) || state.xp < 0) prob += `xp=${state.xp};`;
      if (!Number.isFinite(state.credits) || state.credits < 0) prob += `credits=${state.credits};`;
      if (prob) bug(grade, 'spam-boj', 'nekonzistentní stav: ' + prob); else pass(grade, 'spam-boj: stav konzistentní');
      const re6 = realErrs(page._errs); if (re6.length) bug(grade, 'spam-boj', 'JS chyby: ' + re6.slice(0, 2).join(' | '));
      await ctx.close();
    }
  }

  await browser.close(); srv.close();

  console.log('\n══════════════ ZMRD MODE — VÝSLEDEK ══════════════');
  console.log(`✔ prošlo: ${ok.length} kontrol`);
  if (bugs.length) {
    console.log(`\n✗ NALEZENO ${bugs.length} PROBLÉMŮ:`);
    bugs.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
    process.exitCode = 1;
  } else {
    console.log('\n🎉 ŽÁDNÝ PROBLÉM — hra odolala všem útokům.');
  }
})();
