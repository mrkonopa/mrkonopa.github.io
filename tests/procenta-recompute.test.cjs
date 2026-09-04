/* ══════════════════════════════════════════════════════════════════════
   Procenta — DOPOČÍTÁNÍ ODPOVĚDI ZE ZADÁNÍ.

   PROČ. `procenta-priklady.test.cjs` hlídá zápis čísel (čárka, ≈), ale
   NIKDO neověřoval, že deklarovaná odpověď skutečně odpovídá tomu, co
   zadání tvrdí. To je přesně díra, kterou u her odhalila mise 8/7-2:
   matematika byla konzistentní sama se sebou, jen neodpovídala zadání,
   a všechny ostatní audity to pustily.

   Test proto NEČTE `answer` jako pravdu. Vezme vygenerovaný TEXT zadání,
   vytáhne z něj čísla a dopočítá výsledek podle toho, co se v otázce ptá
   — tedy druhý, nezávislý zdroj pravdy.

   Nerozpoznané tvary se POČÍTAJÍ a tisknou; kdyby vzor přestal sedět,
   projeví se to poklesem pokrytí, ne tichem.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 19011;
let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

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
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/projects/procenta_priklady.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof genPart === 'function', { timeout: 8000 });

  const r = await page.evaluate(() => {
    const GEN = { part: genPart, base: genBase, percent: genPercent, increase: genIncrease,
                  decrease: genDecrease, compound: genCompound, comparison: genComparison, ratio: genRatio };
    /* Text ze značek vytahuje SKUTEČNÝ parser, ne regulární výraz.
       `replace(/<[^>]*>/g,'')` je podle CodeQL „Incomplete multi-character
       sanitization" (high) — a věcně by v matematice sežral „menší než":
       ze zápisu „a < b > c" by zbylo „a  c". Tenhle test si tím prošel:
       CodeQL ho na PR #234 označil hned, jak jsem ho přidal. */
    const cist = s => new DOMParser().parseFromString(String(s), 'text/html')
                        .body.textContent.replace(/\u00a0/g, ' ');
    const cislo = s => parseFloat(String(s).replace(/\s/g, '').replace(',', '.'));
    const blizko = (a, b) => Math.abs(a - b) < Math.max(0.01, Math.abs(b) * 1e-6);

    const stat = {}; const nalezy = []; let nerozpoznano = 0, celkem = 0;
    for (const [jm, fn] of Object.entries(GEN)) {
      stat[jm] = { n: 0, over: 0 };
      for (const diff of ['easy', 'medium', 'hard']) {
        for (let i = 0; i < 250; i++) {
          let u; try { u = fn(diff); } catch (e) { nalezy.push({ jm, chyba: e.message }); continue; }
          celkem++; stat[jm].n++;
          const q = cist(u.question_cs);
          const c = (q.match(/-?[\d ]+(?:[.,]\d+)?/g) || []).map(cislo).filter(Number.isFinite);
          let ceka = null;
          if (jm === 'part'     && c.length >= 2) ceka = c[0] * c[1] / 100;               // „X % z Y"
          else if (jm === 'percent'  && c.length >= 2) ceka = c[0] / c[1] * 100;          // „kolik % je X z Y"
          else if (jm === 'base'     && c.length >= 2) ceka = c[1] * 100 / c[0];          // „X % je Y, kolik je základ"
          else if (jm === 'increase' && c.length >= 2) ceka = c[0] * (1 + c[1] / 100);
          else if (jm === 'decrease' && c.length >= 2) ceka = c[0] * (1 - c[1] / 100);
          /* složený: základ → sleva → navýšení (v tomto pořadí, ne naráz) */
          else if (jm === 'compound' && c.length >= 3) ceka = c[0] * (1 - c[1] / 100) * (1 + c[2] / 100);
          /* porovnání: „X je o P % větší/menší než Y; X = …, kolik je Y?" — hledá se ZÁKLAD */
          else if (jm === 'comparison' && c.length >= 2) {
            const vetsi = /větší/.test(q);
            const pct = c[0], X = c[1];
            ceka = vetsi ? X / (1 + pct / 100) : X / (1 - pct / 100);
          }
          /* poměr: „je P % A a ZBYTEK B; B je Y kusů, kolik je celkem?"
             — zbytek tvoří (100 − P) % celku, takže celek = Y / (1 − P/100) */
          else if (jm === 'ratio' && c.length >= 2) ceka = c[1] / (1 - c[0] / 100);
          if (ceka === null) { nerozpoznano++; continue; }
          stat[jm].over++;
          if (!blizko(u.answer, ceka))
            nalezy.push({ jm, diff, q, deklarovano: u.answer, dopocteno: Math.round(ceka * 1e6) / 1e6 });
        }
      }
    }
    return { stat, nalezy: nalezy.slice(0, 10), pocetNalezu: nalezy.length, nerozpoznano, celkem };
  });

  console.log(`\n  vygenerováno ${r.celkem} úloh, dopočítáno ${r.celkem - r.nerozpoznano}, nerozpoznaný tvar ${r.nerozpoznano}`);
  Object.entries(r.stat).forEach(([k, v]) => console.log(`    ${k.padEnd(12)} ${String(v.n).padStart(4)} úloh, ověřeno ${v.over}`));
  if (r.nalezy.length) { console.log('\n  NÁLEZY:'); r.nalezy.forEach(n => console.log('   ', JSON.stringify(n))); }

  ok(r.celkem > 5000, `vygenerováno dost úloh (${r.celkem})`);
  ok((r.celkem - r.nerozpoznano) > 3000, `dopočítáno dost úloh (${r.celkem - r.nerozpoznano}) — kdyby vzor přestal sedět, spadne to sem`);
  ok(r.pocetNalezu === 0, `deklarovaná odpověď odpovídá zadání (nesedí ${r.pocetNalezu}×)`);
  ok(errs.length === 0, `žádné JS chyby`, errs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Procenta — dopočet: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
