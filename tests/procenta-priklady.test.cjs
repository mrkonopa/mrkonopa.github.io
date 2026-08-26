/* ══════════════════════════════════════════════════════════════════════
   Procenta — procvičování: zadání, postup i odpověď česky a bez artefaktů.

   PROČ. `projects/procenta_priklady.html` je odkázaná z rozcestníku a
   z testů ji do teď potkávaly jen kosmetické sondy (mobil, SEO, a11y,
   skloňování) — nic, co by se dívalo na OBSAH úlohy. Byla v ní stejná
   vada jako v `goniometrie.html`: **desetinná TEČKA v české verzi**.
   Postup u „procentové části" ukazuje mezikrok jako JS číslo
   („1 % ze 40 = 40 ÷ 100 = 0.4"). Naměřeno u 34 % lehkých úloh toho
   typu (548 z 1 600 textů), u středních 17 %, u pokročilých 5 %.

   Stránka je dvojjazyčná, takže se hlídají OBA jazyky proti sobě:
   v angličtině je tečka správně a čárka by byla vada.

   ── na co si dát pozor ──

   Tečku NELZE měřit na výstupu generátoru — oprava je až při vykreslení
   (`czNum`), takže by test svítil červeně nad opravenou stránkou.
   Měří se proto DOM, tedy to, co vidí dítě: zadání, všechny tři úrovně
   nápovědy i hláška se správnou odpovědí.

   Spusť: node tests/procenta-priklady.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 19083;
let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const srv = http.createServer((q, p) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const fp = path.normalize(path.join(ROOT, u));
  if (!fp.startsWith(ROOT)) { p.writeHead(403); return p.end(); }
  let b = null; try { b = fs.readFileSync(fp); } catch (e) {}
  if (b === null) { p.writeHead(404); return p.end(); }
  p.writeHead(200, { 'Content-Type': 'text/html' }); p.end(b);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await br.newContext();
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const jsErr = [];
  pg.on('pageerror', e => jsErr.push(e.message));
  await pg.goto(`http://localhost:${PORT}/projects/procenta_priklady.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(500);

  console.log('\n── Procenta — procvičování ──\n');

  /* Generátory jako celek: žádné NaN a odpovědi bez artefaktů plovoucí
     čárky (ty by se do textu dostaly bez ohledu na jazyk). */
  const gen = await pg.evaluate(N => {
    if (typeof ALL_GENERATORS === 'undefined') return { chyba: 'ALL_GENERATORS není globální' };
    const nalezy = []; let n = 0;
    /* Odstranění značek MUSÍ běžet do ustálení, ne jednou.
   Jediný průchod `replace(/<[^>]*>/g,'')` je nekompletní: z
   „<scr<b>ipt>" udělá „<script>", tedy značku, která tam předtím
   nebyla. Tady jde jen o čtení textu z vlastních generátorů, takže
   reálné riziko nehrozí, ale CodeQL to hlásí jako high (pravidlo
   „Incomplete multi-character sanitization") a mít bránu červenou
   kvůli devíti stejným místům nemá cenu. Opakuje se, dokud se
   řetězec mění. */
    const bezZnacek = s => { let p; do { p = s; s = String(s).replace(/<[^>]*>/g, ''); } while (s !== p); return s; };
    for (let it = 0; it < N; it++) for (const diff of ['easy', 'medium', 'hard'])
      for (const [typ, g] of Object.entries(ALL_GENERATORS)) {
        let p; try { p = g(diff); } catch (e) { nalezy.push(`${typ}/${diff}: generátor spadl — ${e.message}`); continue; }
        n++;
        [p.question_cs, p.question_en, ...(p.steps_cs || []), ...(p.steps_en || []), String(p.answer)]
          .forEach(t => { const s = bezZnacek(t);
            if (/undefined|NaN|\[object Object\]/.test(s)) nalezy.push(`${typ}/${diff}: artefakt „${s.slice(0, 40)}"`); });
        if (typeof p.answer !== 'number' || !isFinite(p.answer)) nalezy.push(`${typ}/${diff}: odpověď není číslo (${p.answer})`);
        /* `5.1000000000000005` vzniká sčítáním desetinných čísel.
           Odpověď se zadává do pole, takže takové číslo nikdo netrefí. */
        const des = (String(p.answer).split('.')[1] || '').length;
        if (des > 3) nalezy.push(`${typ}/${diff}: odpověď ${p.answer} má ${des} des. míst — artefakt plovoucí čárky`);
      }
    return { n, nalezy: [...new Set(nalezy)] };
  }, 300);

  if (gen.chyba) ok(false, gen.chyba);
  else {
    ok(gen.nalezy.length === 0, 'generátory: žádné NaN ani artefakty', gen.nalezy.slice(0, 3).join(' | '));
    ok(gen.n > 5000, `vygenerováno dost úloh (${gen.n})`);
  }

  /* DOM: co skutečně vidí dítě — zadání, tři nápovědy, hláška s odpovědí. */
  for (const jazyk of ['cs', 'en']) {
    const r = await pg.evaluate(async ({ N, jazyk }) => {
      setLang(jazyk);
      const nalezy = []; let textu = 0, sDes = 0;
      const posud = (t, kde) => {
        if (!t) return; textu++;
        if (/undefined|NaN|\[object Object\]/.test(t)) nalezy.push(`${kde}: artefakt`);
        const tecka = t.match(/(?<![\d.])\d+\.\d+(?![\d.])/g);
        const carka = t.match(/(?<![\d,])\d+,\d+(?![\d,])/g);
        if (tecka || carka) sDes++;
        if (jazyk === 'cs' && tecka) nalezy.push(`${kde}: desetinná TEČKA „${tecka[0]}"`);
        if (jazyk === 'en' && carka) nalezy.push(`${kde}: desetinná ČÁRKA v anglické verzi „${carka[0]}"`);
      };
      for (const diff of ['easy', 'medium', 'hard']) {
        for (let kolo = 0; kolo < N; kolo++) {
          selectDifficulty(diff); startGame();
          for (let i = 0; i < problems.length; i++) {
            cur = i; hintLevel = 0; renderProblem();
            const q = document.querySelector('.problem-text');
            posud(q ? q.textContent : '', `${diff}/úloha ${i}/zadání`);
            /* Všechny tři úrovně nápovědy — L3 je ta s výsledkem. */
            for (let h = 0; h < 3; h++) {
              advanceHint();
              const b = document.getElementById('hint-box');
              posud(b ? b.textContent : '', `${diff}/úloha ${i}/nápověda ${h + 1}`);
            }
          }
        }
      }
      return { textu, sDes, nalezy: [...new Set(nalezy)] };
    }, { N: 12, jazyk });

    ok(r.nalezy.length === 0, `[${jazyk}] vykreslený text je v pořádku`, r.nalezy.slice(0, 3).join(' | '));
    /* Pojistky proti planému běhu. Kdyby `renderProblem` přestal
       plnit `.problem-text`, nebo kdyby přestala vznikat desetinná
       čísla, pravidlo by nemělo co hlídat a MLČELO by.
       Podlaha je NAMĚŘENÁ, ne odhadnutá — první verze měla 80 podle
       mého odhadu a padala na stránce, která je v pořádku. Čtyři běhy
       daly 60 · 64 · 72 · 76–80 (úlohy se losují, takže to kolísá),
       nejméně tedy 60; podlaha 30 nechává rezervu na polovinu a
       rozbité vykreslení by dalo 0. */
    ok(r.textu > 1000, `[${jazyk}] test vůbec něco přečetl (${r.textu} textů)`);
    ok(r.sDes > 30, `[${jazyk}] test vůbec viděl desetinná čísla (${r.sDes})`);
  }

  const skut = jsErr.filter(e => !/ERR_|CERT_|net::/i.test(e));
  ok(skut.length === 0, 'žádné JS chyby', skut.slice(0, 1).join(''));

  console.log(`\n  Procenta — procvičování: ${pass} ✅ / ${fail} ❌\n`);
  await br.close(); srv.close();
  process.exit(fail ? 1 : 0);
})();
