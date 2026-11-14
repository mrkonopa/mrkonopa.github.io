/* ═════════════════════════════════════════════════════════════════════════
   Poslední chybné odpovědi po misích se zapisují ve VŠECH sedmi hrách (14. 11. 2026).

   Důvod: v `saves` byl jen počet chyb. U žáků, kteří se v misi zasekli (6. ročník, mise 1-2 a 2-3,
   dohromady 240 chyb), nešlo zjistit, CO píšou, a další nápověda by byla odhad. `zapisChybnou`
   (rpg-shared.js) proto ukládá zadání, správnou odpověď a žákovu odpověď — nejvýš 3 na misi a 8 misí.

   Hlídá se KAŽDÉ místo, kde se chyba počítá (zapomenuté místo = žák, o kterém nic nevíme):
     A) textová odpověď v boji, B) vypršený čas, C) výběr z možností v boji,
     D) textová odpověď v tréninku, E) výběr z možností v tréninku
   a sám zapisovač: strop 3 na misi / 8 misí, ořez délky, řídicí znaky, odmítnutí cizího klíče
   (`__proto__`), přežití uložení do localStorage a malá velikost.

   Spusť: node tests/rpg-chybne-odpovedi.test.cjs
   ═════════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18994;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GRADES = [3, 4, 5, 6, 7, 8, 9];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function serve() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css' };
  const srv = http.createServer((q, p) => {
    let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT)) { p.writeHead(403); return p.end(); }
    let b = null; try { b = fs.readFileSync(fp); } catch (e) {}
    if (b === null) { p.writeHead(404); return p.end(); }
    p.writeHead(200, { 'Content-Type': mime[u.split('.').pop()] || 'application/octet-stream' });
    p.end(b);
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

(async () => {
  console.log('\n── Chybné odpovědi po misích ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  try {
    for (const g of GRADES) {
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof startGame === 'function' && typeof zapisChybnou === 'function', null, { timeout: 8000 });

      const r = await page.evaluate(() => {
        localStorage.clear(); startGame('Testovací žák'); S.tutorialDone = true;
        const out = {};
        const cisty = () => { S.wrong = {}; };
        const posledni = mid => { const a = (S.wrong || {})[mid]; return a && a[a.length - 1]; };
        // mise s textovou odpovědí a mise s výběrem
        let txt = null, mc = null;
        for (const a of AREAS) for (const m of a.missions) {
          launchBattle(a.id, m.id);
          if (BT.mcMode) { if (!mc) mc = [a.id, m.id]; } else if (!txt) txt = [a.id, m.id];
        }
        out.mise = { txt: txt && txt[1], mc: mc && mc[1] };
        if (!txt || !mc) return { chyba: 'chybí mise: ' + JSON.stringify(out.mise) };

        // A) textová odpověď v boji
        cisty(); launchBattle(txt[0], txt[1]);
        const idx = BT.tasks.findIndex(t => !isYN(t));
        if (BT.mini) BT.mini[idx] = null; BT.idx = idx; renderTask();
        const tA = BT.curTask;
        const inp = document.getElementById('bt-ans'); inp.disabled = false; inp.value = '-12345';
        const ab = document.getElementById('attack-btn'); if (ab) ab.disabled = false;
        submitAnswer();
        out.A = posledni(txt[1]);
        out.A_text = String(tA.text).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, 70);
        out.A_ans = String(tA.ans).slice(0, 14);

        // B) vypršený čas (nová bitva, ať žije)
        cisty(); launchBattle(txt[0], txt[1]);
        { const i2 = BT.tasks.findIndex(t => !isYN(t)); if (BT.mini) BT.mini[i2] = null; BT.idx = i2; renderTask(); }
        onTimeOut();
        out.B = posledni(txt[1]);

        // C) výběr z možností v boji — ťuknutí na špatnou volbu
        cisty(); launchBattle(mc[0], mc[1]);
        { const i3 = BT.tasks.findIndex(t => !isYN(t)); if (BT.mini) BT.mini[i3] = null; BT.idx = i3; renderTask(); }
        const tC = BT.curTask;
        const btns = [...document.querySelectorAll('#mc-grid .mc-btn')];
        const hodnota = b => b.dataset.v != null ? b.dataset.v : b.textContent.replace(/^[A-D]/, '');
        const spatna = btns.find(b => !checkAns(hodnota(b), tC.ans));
        out.C_btns = btns.length;
        if (spatna) { out.C_zvolena = hodnota(spatna); spatna.click(); }
        out.C = posledni(mc[1]);
        out.C_sedi = out.C ? !checkAns(out.C[2], tC.ans) && out.C[2] === out.C_zvolena.slice(0, 14) : false;

        // D) textová odpověď v tréninku
        cisty(); go('train'); startTrain(txt[1]);
        const tin = document.getElementById('tr-ans'); tin.disabled = false; tin.value = '-777';
        trSubmit();
        out.D = posledni(txt[1]);

        // E) výběr z možností v tréninku
        // ANO/NE úloha v tréninku nechá v #tr-mc zastaralé (skryté) volby z předchozí úlohy — ťuknout se smí jen na skutečný výběr
        cisty(); go('train'); startTrain(mc[1]);
        for (let k = 0; k < 40 && isYN(TR.task); k++) { startTrain(mc[1]); }
        const tbtns = [...document.querySelectorAll('#tr-mc .mc-btn')];
        const tspatna = tbtns.find(b => !checkAns(hodnota(b), TR.task.ans));
        if (tspatna) tspatna.click();
        out.E = posledni(mc[1]);
        out.E_btns = tbtns.length;

        // F) zapisovač sám
        cisty();
        for (let i = 0; i < 5; i++) zapisChybnou('1-1', { text: 'úloha ' + i, ans: '7' }, 'x' + i);
        out.F_pocet = S.wrong['1-1'].length; out.F_posl = S.wrong['1-1'][2][0]; out.F_prvni = S.wrong['1-1'][0][0];
        for (let i = 1; i <= 10; i++) zapisChybnou(i + '-2', { text: 't', ans: '1' }, '2');
        out.F_misi = Object.keys(S.wrong).length;
        const pred = Object.keys(S.wrong).join();
        zapisChybnou('__proto__', { text: 'zlo', ans: '1' }, '2'); zapisChybnou('1-1; x', { text: 'zlo', ans: '1' }, '2'); zapisChybnou('', { text: 'a' }, 'b');
        out.F_cizi = Object.keys(S.wrong).join() === pred && ({}).zlo === undefined && !Object.prototype.hasOwnProperty.call(Object.prototype, '0');
        cisty();
        zapisChybnou('3-3', { text: 'a'.repeat(300) + '\n\u0007b', ans: 'c'.repeat(50) }, '<img src=x onerror=1>' + 'd'.repeat(40));
        const e = S.wrong['3-3'][0];
        out.F_orez = e[0].length <= 70 && e[1].length <= 14 && e[2].length <= 14;
        out.F_ridici = !/[\u0000-\u001f]/.test(e.join(''));
        // velikost nejhůř: 8 misí × 3 záznamy v nejdelším tvaru
        cisty();
        for (let m = 1; m <= 8; m++) for (let i = 0; i < 3; i++) zapisChybnou(m + '-1', { text: 'x'.repeat(100), ans: '9'.repeat(30) }, '8'.repeat(30));
        out.F_velikost = JSON.stringify(S.wrong).length;

        // G) přežije uložení
        cisty(); zapisChybnou('2-1', { text: 'uložit', ans: '4' }, '5'); saveS();
        const ulozeno = JSON.parse(localStorage.getItem(SAVE_KEY));
        out.G = !!(ulozeno.wrong && ulozeno.wrong['2-1'] && ulozeno.wrong['2-1'][0][2] === '5');
        return out;
      });

      ok(!r.chyba, `g${g} připravené mise`, r.chyba || '');
      if (r.chyba) { await ctx.close(); continue; }
      ok(r.A && r.A[2] === '-12345' && r.A[0] === r.A_text && r.A[1] === r.A_ans, `g${g} A: textová odpověď v boji se zapsala`, JSON.stringify(r.A));
      ok(r.B && r.B[2] === '⏱', `g${g} B: vypršený čas se zapsal jako ⏱`, JSON.stringify(r.B));
      ok(r.C_btns >= 2 && r.C_sedi, `g${g} C: špatná volba v boji se zapsala`, JSON.stringify([r.C_btns, r.C, r.C_zvolena]));
      ok(r.D && r.D[2] === '-777', `g${g} D: textová odpověď v tréninku se zapsala`, JSON.stringify(r.D));
      ok(r.E_btns >= 2 && r.E && r.E[2] !== '' && r.E[2] != null, `g${g} E: špatná volba v tréninku se zapsala`, JSON.stringify(r.E));
      ok(r.F_pocet === 3 && r.F_prvni === 'úloha 2' && r.F_posl === 'úloha 4', `g${g} F: nejvýš 3 poslední na misi`, `${r.F_pocet} ${r.F_prvni} ${r.F_posl}`);
      ok(r.F_misi === 8, `g${g} F: nejvýš 8 misí`, String(r.F_misi));
      ok(r.F_cizi, `g${g} F: cizí klíč (__proto__, nesmysl) se odmítne`);
      ok(r.F_orez && r.F_ridici, `g${g} F: ořez délek a řídicí znaky`, '');
      ok(r.F_velikost < 3000, `g${g} F: nejhorší velikost ${r.F_velikost} B < 3 000 B`);
      ok(r.G, `g${g} G: záznam přežije uložení do localStorage`);
      ok(errs.length === 0, `g${g} bez JS chyby`, errs[0] || '');
      await ctx.close();
    }
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Chybné odpovědi: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
