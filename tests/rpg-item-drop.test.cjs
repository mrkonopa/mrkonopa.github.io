/* ══════════════════════════════════════════════════════════════════════
   Předměty v boji padají ve všech ročnících.

   Nález z porovnání funkcí napříč sedmi hrami: `tryDropItem` je v 1.
   stupni DEFINOVANÁ, ale nikdy se nevolá. Ve 2. stupni má tři volací
   místa (minihra, MC odpověď, textová odpověď), v 3.–5. ročníku nula.

   Celý zbytek systému přitom v 1. stupni je: `ITEM_DROP_CHANCE`,
   `ITEM_DEFS` (lektvar / zmrzlina / přeskoč), lišta předmětů, `useItem`
   i CSS. Jen nic nikdy nespadlo — tedy záchranná síť, kterou 6.–9.
   ročník má, malým dětem nefungovala. Zase to bylo obráceně: pomoc
   nejvíc chybí tomu, kdo ji nejvíc potřebuje.

   Ze zdrojáku by to spolehlivě vidět nebylo — funkce existuje, takže
   „je tam?" projde. Proto se hraje doopravdy: `Math.random` se ukotví
   na 0, takže hod pod ITEM_DROP_CHANCE musí propadnout, a odpovídá se
   skutečnou cestou přes `submitAnswer()`.

   Spusť: node tests/rpg-item-drop.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18992;
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
  console.log('\n── Předměty v boji padají ve všech ročnících ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let mereni = 0;
  try {
    for (const g of GRADES) {
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof startGame === 'function', { timeout: 8000 });

      const r = await page.evaluate(() => {
        localStorage.clear(); startGame('Testovací žák'); S.tutorialDone = true;

        // Mise 1-1 je multiple-choice — tam textový vstup vůbec neexistuje
        // a `submitAnswer()` by tiše nic neudělal. Hledá se první mise,
        // která MC není.
        let mise = null;
        for (const a of AREAS) {
          for (const m of a.missions) {
            launchBattle(a.id, m.id);
            if (!BT.mcMode) { mise = a.id + '/' + m.id; break; }
          }
          if (mise) break;
        }
        if (!mise) return { chyba: 'nenalezena mise s textovou odpovědí' };

        // Čisté textové kolo: ANO/NE i minihra schovávají vstup i tlačítko
        // ÚTOK, takže by se skutečná cesta odpovědi vůbec nespustila.
        const idx = BT.tasks.findIndex(t => !isYN(t));
        if (idx < 0) return { chyba: 'žádná textová úloha' };
        if (BT.mini) BT.mini[idx] = null;
        BT.idx = idx; renderTask();

        const puvodni = Math.random;
        Math.random = () => 0;          // hod jistě pod ITEM_DROP_CHANCE
        let pred = BT.items.length, po = null, chyba = null;
        try {
          const t = BT.tasks[idx];
          const inp = document.getElementById('bt-ans');
          if (!inp) { chyba = 'vstup bt-ans nenalezen'; }
          else {
            inp.disabled = false; inp.value = String(t.ans);
            const ab = document.getElementById('attack-btn'); if (ab) ab.disabled = false;
            submitAnswer();
            po = BT.items.length;
          }
        } catch (e) { chyba = String(e && e.message || e); }
        finally { Math.random = puvodni; }

        return {
          pred, po, chyba, mise,
          sance: typeof ITEM_DROP_CHANCE !== 'undefined' ? ITEM_DROP_CHANCE : null,
          maDefs: typeof ITEM_DEFS !== 'undefined' ? Object.keys(ITEM_DEFS).length : 0,
          odpovezeno: !!(S.xpClaimed && Object.keys(S.xpClaimed).length),
        };
      });

      mereni++;
      ok(!r.chyba, `g${g} odpověď proběhla bez výjimky`, r.chyba || '');
      ok(r.sance > 0, `g${g} systém předmětů je nastavený (šance ${r.sance})`);
      ok(r.maDefs >= 3, `g${g} jsou definované předměty (${r.maDefs})`);
      // Pojistka proti planému běhu: kdyby `submitAnswer()` odpověď vůbec
      // nezpracoval (jiné id vstupu, skrytá minihra), zůstalo by 0 předmětů
      // a test by „našel chybu", která tam není. Tohle to odliší.
      ok(r.odpovezeno, `g${g} odpověď byla opravdu zpracována (mise ${r.mise})`);
      // Jádro: při jisté šanci MUSÍ předmět přibýt. Kdyby se tryDropItem
      // nevolala, zůstane 0 → přesně stav 1. stupně před opravou.
      ok(r.po > r.pred, `g${g} po správné odpovědi předmět spadl`,
        `před ${r.pred} → po ${r.po}`);
      ok(errs.length === 0, `g${g} bez JS chyby`, errs[0] || '');
      await ctx.close();
    }
    ok(mereni === GRADES.length, `proměřeno všech ${GRADES.length} ročníků (${mereni})`);
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Předměty v boji: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
