/* ════════════════════════════════════════════════════════════════════════
   Doba hraní po misích se zapisuje ve VŠECH sedmi hrách (17. 11. 2026).

   Důvod: v `saves` byl jen počet splněných úkolů a chyb, takže se nedalo poznat, jestli žák v misi skončil,
   protože skončila hodina, nebo se zasekl (9. ročník: mise 1-2 začalo 13 z 32 hráčů po 1-1). `S.cas[mise] = {s, n, o, d}`
   (s = součet dob odpovědí v sekundách, n = počet odpovědí, o = počet spuštění boje, d = poslední den RRMMDD)
   zapisují `casSpusteni` / `casOdpoved` v rpg-shared.js; start měření nastavuje `daleZpet`, odpověď v boji zachytí
   `adaptOnAnswer` (jediné místo pro všech 7 her) a v tréninku `trCorrect` / `trWrong`.

   Hlídá se skutečnou cestou (volání jako dítě, FALEŠNÉ HODINY místo čekání):
     A) textová odpověď v boji: špatně, pak správně — doba se měří od předchozí odpovědi, ne od zobrazení úlohy
     B) strop 90 s na odpověď (odložený tablet)   C) vypršený čas   D) výběr z možností v boji (špatně, správně)
     E) textová odpověď v tréninku   F) výběr z možností v tréninku
     G) bez začátku měření se nic nezapíše; cizí klíče (`__proto__`, nesmysl) se odmítnou; strop 30 misí
     H) poškozený záznam v postavě (číslo, řetězec, záporné, NaN, pole) se opraví a hra nespadne
     I) žádný časovač (setTimeout/setInterval) — nemůže se dostat do ovládání
     J) přežije uložení do localStorage a je malé   K) zdroj: všechna místa zapojena v každé hře

   Spusť: node tests/rpg-doba.test.cjs
   ════════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18995;
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
  console.log('\n── Doba hraní po misích ──\n');

  // K) zdroj — každé místo zapojeno (zapomenuté místo = žák, o kterém nevíme)
  const shared = fs.readFileSync(path.join(ROOT, 'projects/rpg-shared.js'), 'utf8');
  ok(/function daleZpet\(daleId\)\{\s*casStart\(\);/.test(shared), 'zdroj: daleZpet nastavuje začátek měření');
  ok(/function adaptOnAnswer\(ok\)\{\s*casOdpoved\(/.test(shared), 'zdroj: adaptOnAnswer zachytí odpověď v boji (všech 7 her)');
  for (const g of GRADES) {
    const h = fs.readFileSync(path.join(ROOT, `projects/rpg-mat-${g}.html`), 'utf8');
    ok(/function launchBattle\(aid,mid\)\{\s*casSpusteni\(mid\);/.test(h), `g${g} zdroj: launchBattle počítá spuštění`);
    ok(/function trCorrect\(\)\{\s*casOdpoved\(TR\.mid\);/.test(h), `g${g} zdroj: trCorrect zachytí odpověď v tréninku`);
    ok(/function trWrong\(given\)\{\s*casOdpoved\(TR\.mid\);/.test(h), `g${g} zdroj: trWrong zachytí odpověď v tréninku`);
  }

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
      await page.waitForFunction(() => typeof startGame === 'function' && typeof casOdpoved === 'function', null, { timeout: 8000 });

      const r = await page.evaluate(() => {
        localStorage.clear(); startGame('Testovací žák'); S.tutorialDone = true;
        const out = {};
        const kopie = mid => { const c = (S.cas || {})[mid]; return c ? { s: c.s, n: c.n, o: c.o, d: c.d } : null; };
        let txt = null, mc = null;
        for (const a of AREAS) for (const m of a.missions) {
          launchBattle(a.id, m.id);
          if (BT.mcMode) { if (!mc) mc = [a.id, m.id]; } else if (!txt) txt = [a.id, m.id];
        }
        if (!txt || !mc) return { chyba: 'chybí mise' };
        out.den = casDen();

        // falešné hodiny (reálné čekání by zdvojnásobilo dobu testu)
        let t = 1e12; const skutecne = Date.now; Date.now = () => t;
        const cisty = () => { S.cas = {}; _casT0 = 0; };
        const textovaUloha = () => {
          const i = BT.tasks.findIndex(x => !isYN(x)); if (BT.mini) BT.mini[i] = null; BT.idx = i; renderTask();
          const inp = document.getElementById('bt-ans'); inp.disabled = false;
          const ab = document.getElementById('attack-btn'); if (ab) ab.disabled = false;
          return inp;
        };
        const hodnota = b => b.dataset.v != null ? b.dataset.v : b.textContent.replace(/^[A-D]/, '');
        const mid = txt[1], midMC = mc[1];

        // A) text v boji: špatně po 12 s, pak správně o 5 s později (měří se od PŘEDCHOZÍ odpovědi)
        cisty(); launchBattle(txt[0], mid); out.A_start = kopie(mid);
        let inp = textovaUloha(); const tA = BT.curTask;
        t += 12000; inp.value = '-12345'; submitAnswer(); out.A1 = kopie(mid);
        t += 5000; inp.disabled = false; inp.value = String(tA.ans); submitAnswer(); out.A2 = kopie(mid);

        // B) strop 90 s (tablet odložen na 10 minut)
        cisty(); launchBattle(txt[0], mid); inp = textovaUloha();
        t += 600000; inp.value = '-12345'; submitAnswer(); out.B = kopie(mid);

        // C) vypršený čas
        cisty(); launchBattle(txt[0], mid); textovaUloha();
        t += 40000; onTimeOut(); out.C = kopie(mid);

        // D) výběr z možností v boji: špatná volba po 7 s, správná o 3 s později
        cisty(); launchBattle(mc[0], midMC);
        { const i = BT.tasks.findIndex(x => !isYN(x)); if (BT.mini) BT.mini[i] = null; BT.idx = i; renderTask(); }
        const tD = BT.curTask, btns = [...document.querySelectorAll('#mc-grid .mc-btn')];
        const spatna = btns.find(b => !checkAns(hodnota(b), tD.ans)), spravna = btns.find(b => checkAns(hodnota(b), tD.ans));
        out.D_btns = btns.length;
        t += 7000; if (spatna) spatna.click(); out.D1 = kopie(midMC);
        t += 3000; if (spravna) spravna.click(); out.D2 = kopie(midMC);

        // E) text v tréninku: špatně po 9 s, správně o 4 s později
        cisty(); go('train'); startTrain(mid);
        const tin = document.getElementById('tr-ans'); const tT = TR.task;
        t += 9000; tin.disabled = false; tin.value = '-777'; trSubmit(); out.E1 = kopie(mid);
        t += 4000; tin.disabled = false; tin.value = String(tT.ans); trSubmit(); out.E2 = kopie(mid);

        // F) výběr z možností v tréninku (ANO/NE nechá v #tr-mc staré skryté volby, proto jen skutečný výběr)
        cisty(); go('train'); startTrain(midMC);
        for (let k = 0; k < 40 && isYN(TR.task); k++) startTrain(midMC);
        _casT0 = t;
        const tb = [...document.querySelectorAll('#tr-mc .mc-btn')], tsp = tb.find(b => !checkAns(hodnota(b), TR.task.ans));
        out.F_btns = tb.length;
        t += 6000; if (tsp) tsp.click(); out.F = kopie(midMC);

        // G) bez začátku měření se nic nezapíše; cizí klíče; strop 30 misí
        cisty(); casOdpoved('1-1'); out.G_bez = JSON.stringify(S.cas);
        _casT0 = t; t += 1000;
        for (const k of ['__proto__', 'constructor', '1-1;x', '', null, undefined, 5, '10-1', '0-1']) { _casT0 = t - 1000; casOdpoved(k); casSpusteni(k); }
        out.G_cizi = Object.keys(S.cas).length === 0 && ({}).s === undefined && !Object.prototype.hasOwnProperty.call(Object.prototype, 's');
        cisty();
        for (let a = 1; a <= 9; a++) for (let m = 1; m <= 4; m++) casSpusteni(a + '-' + m);
        out.G_misi = Object.keys(S.cas).length;

        // H) poškozený záznam v postavě
        cisty(); S.cas = { '1-1': 5, '1-2': { s: 'x', n: -4, o: NaN, d: null }, '1-3': [1, 2] };
        casSpusteni('1-1'); casSpusteni('1-2'); casSpusteni('1-3');
        out.H = ['1-1', '1-2', '1-3'].map(k => { const c = S.cas[k]; return c && c.s === 0 && c.n === 0 && c.o === 1 && c.d === casDen(); });
        S.cas = [1, 2, 3]; casSpusteni('2-1'); out.H_pole = !Array.isArray(S.cas) && !!S.cas['2-1'] && S.cas['2-1'].o === 1;
        S.cas = { '1-1': { s: 9e9, n: 9e9, o: 9e9, d: 1 } }; casSpusteni('1-1');
        out.H_strop = S.cas['1-1'].s <= 1e6 && S.cas['1-1'].n <= 1e5 && S.cas['1-1'].o <= 1e5 + 1;

        // I) žádný časovač
        { let casovacu = 0; const st = window.setTimeout, si = window.setInterval;
          window.setTimeout = function () { casovacu++; return st.apply(this, arguments); };
          window.setInterval = function () { casovacu++; return si.apply(this, arguments); };
          cisty(); _casT0 = t - 500; casOdpoved('1-1'); casSpusteni('1-1'); casStart();
          window.setTimeout = st; window.setInterval = si; out.I = casovacu; }

        // J) přežije uložení; velikost 21 misí s realistickými čísly
        cisty(); _casT0 = t - 4000; casOdpoved('1-2');
        const ulozeno = JSON.parse(localStorage.getItem(SAVE_KEY));
        out.J = !!(ulozeno.cas && ulozeno.cas['1-2'] && ulozeno.cas['1-2'].n === 1 && ulozeno.cas['1-2'].s === 4);
        cisty();
        for (let a = 1; a <= 7; a++) for (let m = 1; m <= 3; m++) S.cas[a + '-' + m] = { s: 1234.5, n: 120, o: 9, d: 261117 };
        out.J_velikost = JSON.stringify(S.cas).length;

        Date.now = skutecne;
        return out;
      });

      ok(!r.chyba, `g${g} připravené mise`, r.chyba || '');
      if (r.chyba) { await ctx.close(); continue; }
      const blizko = (x, y) => Math.abs(x - y) < 0.06;
      ok(r.A_start && r.A_start.o === 1 && r.A_start.n === 0 && r.A_start.d === r.den, `g${g} A: spuštění boje se započítá a nastaví den`, JSON.stringify(r.A_start));
      ok(r.A1 && r.A1.n === 1 && blizko(r.A1.s, 12), `g${g} A: špatná textová odpověď po 12 s → n 1, s 12`, JSON.stringify(r.A1));
      ok(r.A2 && r.A2.n === 2 && blizko(r.A2.s, 17), `g${g} A: správná o 5 s později se měří od předchozí odpovědi → s 17`, JSON.stringify(r.A2));
      ok(r.B && r.B.n === 1 && blizko(r.B.s, 90), `g${g} B: odpověď po 10 minutách se počítá nejvýš 90 s`, JSON.stringify(r.B));
      ok(r.C && r.C.n === 1 && blizko(r.C.s, 40), `g${g} C: vypršený čas po 40 s se započítá`, JSON.stringify(r.C));
      ok(r.D_btns >= 2 && r.D1 && r.D1.n === 1 && blizko(r.D1.s, 7), `g${g} D: špatná volba v boji po 7 s`, JSON.stringify([r.D_btns, r.D1]));
      ok(r.D2 && r.D2.n === 2 && blizko(r.D2.s, 10), `g${g} D: správná volba o 3 s později → s 10`, JSON.stringify(r.D2));
      ok(r.E1 && r.E1.n === 1 && blizko(r.E1.s, 9), `g${g} E: špatná odpověď v tréninku po 9 s`, JSON.stringify(r.E1));
      ok(r.E2 && r.E2.n === 2 && blizko(r.E2.s, 13), `g${g} E: správná v tréninku o 4 s později → s 13`, JSON.stringify(r.E2));
      ok(r.F_btns >= 2 && r.F && r.F.n === 1 && blizko(r.F.s, 6), `g${g} F: špatná volba v tréninku po 6 s`, JSON.stringify([r.F_btns, r.F]));
      ok(r.G_bez === '{}', `g${g} G: bez začátku měření se nic nezapíše`, r.G_bez);
      ok(r.G_cizi, `g${g} G: cizí klíče (__proto__, nesmysl) se odmítnou`);
      ok(r.G_misi === 30, `g${g} G: nejvýš 30 misí`, String(r.G_misi));
      ok(r.H && r.H.every(Boolean), `g${g} H: poškozený záznam (číslo, řetězec, záporné, NaN, pole) se opraví`, JSON.stringify(r.H));
      ok(r.H_pole && r.H_strop, `g${g} H: místo pole vznikne objekt a čísla mají strop`);
      ok(r.I === 0, `g${g} I: žádný časovač (${r.I})`);
      ok(r.J, `g${g} J: záznam přežije uložení do localStorage`);
      ok(r.J_velikost < 1000, `g${g} J: 21 misí s realistickými čísly = ${r.J_velikost} B < 1 000 B`);
      ok(errs.length === 0, `g${g} bez JS chyby`, errs[0] || '');
      await ctx.close();
    }
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Doba hraní po misích: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
