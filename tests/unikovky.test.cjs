/* ══════════════════════════════════════════════════════════════════════
   Únikovky — dají se dohrát a mají čistá zadání.

   PROČ tenhle test vznikl. Osm únikovek (80 zámků, 160 úloh) nemělo
   do teď ANI JEDEN test. `CLAUDE.md` uváděl jen ruční kontrolu dvou
   z nich („všech 20 L3 hintů sedí na kódy") — zbylých šest neověřoval
   nikdo. Přitom zámek, jehož uvedený kód neodemkne, je ta nejhorší
   možná vada: dítě počítá správně a hra ho nepustí dál.

   Co se hlídá:

   • KAŽDÝ zámek se dá odemknout svým kódem a hra dojde do finále,
   • ŠPATNÝ kód zámek neodemkne (jinak by test prošel i u hry, která
     pustí dál cokoli),
   • kód je číslo a nemá desetinnou tečku (zadává se do `input[number]`),
   • kód SEDÍ NA VÝSLEDEK, který hra sama uvádí v `successMsg`
     („🔓 Správně! 2⁴ = 16") — viz poznámka níže,
   • POSLEDNÍ NÁPOVĚDA se DOPOČÍTÁ a musí dát kód („💡 60 + 32 + 37 = ?"
     → 129) — nápověda, která vede jinam, je stejně zlá jako špatný kód,
   • každá úloha má neprázdnou nápovědu,
   • v textech není `undefined`, `NaN`, `[object Object]` ani desetinná
     tečka mezi číslicemi.

   ── dvě věci, na kterých se dá pohořet a jsou tu proto napsané ──

   1. Odemčení má **animaci 1900 ms** (`setTimeout(...,1900)` v `chk()`).
      Kratší čekání vypadá jako „správný kód neodemkl" — a protože to
      selže stejně ve všech osmi hrách, svádí to k závěru, že je vada
      v nich. Není: je v měření.
   2. U POSLEDNÍHO zámku `chk()` nevolá `render(cur+1)`, ale `finish()`,
      takže `cur` zůstane stát. „Nezměnilo se" tam znamená úspěch;
      pozná se podle `#finish.active`.
   3. **Průchod SÁM O SOBĚ nedokáže odhalit špatný kód.** Zadává totiž
      `STEPS[i].code`, tedy přesně to, co `chk()` porovnává — je to
      kruh, který projde i u zámku s kódem utrženým od zadání. A právě
      to je ta nejhorší vada: dítě počítá správně a hra ho nepustí dál.
      Druhý, NEZÁVISLÝ zdroj pravdy je `successMsg`, kde hra výsledek
      vypisuje slovy. Naměřeno: **77 z 80 zámků** tam číslo uvádí a u
      všech 77 sedí. Zbylé tři (procenta 1, 2, 10) mají hlášku obecnou
      („1 % = základ ÷ 100.") — ověřeny ručně (700÷100=7 · 30+100=130 ·
      60+32+37=129), stroj u nich rozhodnout nemůže. Proto se nezametají
      pod koberec: test **tiskne pokrytí** a hlídá, aby nekleslo — jinak
      by stačilo hlášky zobecnit a pravidlo by tiše oslepilo.
      Pozn.: fráze „Zámek N otevřen" se z hlášky vyřezává, aby číslo
      zámku falešně nepotvrdilo kód, který se mu rovná. (Ověřeno: bez
      vyřezání vychází stejných 77, takže na ni nikdo nespoléhá.)
      Zkoušel jsem to i přísněji — brát jen číslo hned za „=" — ale
      to je HORŠÍ: potvrzených klesne na 74 a přibude planý poplach
      („n % = 1 % × n" chytne jedničku). Proto volná shoda + jmenný
      seznam výjimek níže; výjimka pojmenovaná a ručně dopočítaná je
      poctivější než pravidlo, které mlčí o pěti zámcích.

   Spusť: node tests/unikovky.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 19057;
const ODEMCENI_MS = 2100;          // animace je 1900, necháváme rezervu

/* Zámky, jejichž `successMsg` výsledek NEUVÁDÍ (je obecná nebo popisuje
   postup). Stroj u nich rozhodnout nemůže, tak jsou tu vypsané jmenovitě
   i s ručním dopočtem — kdyby přibyl další, test spadne a bude ho vidět.
   Ověřeno ručně 26. 8. 2026 proti zadání poslední úlohy zámku: */
/* Zámky, kde poslední nápověda ÚMYSLNĚ nekončí kódem, protože počítá
   jen mezikrok. Stroj tu rozhodnout nemůže — je to pedagogicky správně.
   Ověřeno ručně 26. 8. 2026: */
const NAPOVEDA_MEZIKROK = {
  // Kód je ROZDÍL průměrů (9 − 6 = 3), ale nápověda dovede žáka jen
  // k průměru skupiny B (45 ÷ 5 = 9). Odečtení si má udělat sám.
  statistika: [9],
};

const HLASKA_BEZ_VYSLEDKU = {
  procenta: [
    1,   // „Vypočítej 1 % ze 700"      → 700 ÷ 100 = 7    = code '7'
    2,   // „5 % z 600 + 20 % z 500"    → 30 + 100 = 130   = code '130'
    10,  // „a + b + c"                 → 60 + 32 + 37 = 129 = code '129'
  ],
};

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const srv = http.createServer((q, p) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const fp = path.normalize(path.join(ROOT, u));
  if (!fp.startsWith(ROOT)) { p.writeHead(403); return p.end(); }
  let b = null; try { b = fs.readFileSync(fp); } catch (e) {}
  if (b === null) { p.writeHead(404); return p.end(); }
  p.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'application/javascript' : 'text/html' });
  p.end(b);
});

const HRY = fs.readdirSync(path.join(ROOT, 'projects'))
  .filter(f => /^unikovka_.*\.html$/.test(f)).sort();

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  console.log('\n── Únikovky ──\n');
  ok(HRY.length === 8, `nalezeno 8 únikovek (${HRY.length})`, HRY.join(', '));

  /* Osm her je na sobě nezávislých, takže běží SOUČASNĚ v osmi
     kontextech. Sériově by test trval ~4 min (80 zámků × 2,55 s
     čekání na animaci), takhle ~40 s. Vyhodnocení je až potom a
     v pevném pořadí, aby byl výpis stabilní. */
  const vysledky = await Promise.all(HRY.map(async h => {
    const jm = h.replace('unikovka_', '').replace('.html', '');
    const ctx = await br.newContext({ viewport: { width: 1100, height: 900 } });
    await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(`http://localhost:${PORT}/projects/${h}`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(700);

    /* ── statická část: kódy, nápovědy, artefakty ── */
    const st = await pg.evaluate(() => {
      if (typeof STEPS === 'undefined') return { chyba: 'STEPS není dostupné' };
      const n = []; let uloh = 0; const xref = [], hint = [];
      STEPS.forEach((z, i) => {
        const kde = `zámek ${z.id || i + 1}`;
        const kod = z.code == null ? '' : String(z.code).trim();
        if (!kod) n.push(`${kde}: chybí kód`);
        else {
          if (!/^-?\d+([,.]\d+)?$/.test(kod)) n.push(`${kde}: kód „${kod}" není číslo`);
          if (/\./.test(kod)) n.push(`${kde}: kód „${kod}" má desetinnou tečku`);
        }
        const tasks = Array.isArray(z.tasks) ? z.tasks : [];
        if (!tasks.length) n.push(`${kde}: nemá žádné úlohy`);
        tasks.forEach((t, k) => {
          uloh++;
          if (t.hint !== undefined && !String(t.hint).trim()) n.push(`${kde}/úloha ${k + 1}: prázdná nápověda`);
        });
        /* kód × výsledek uvedený v successMsg (nezávislý zdroj) */
        const sm = String(z.successMsg || '').replace(/<[^>]*>/g, '')
          .replace(/Zámek\s*\d+/gi, '').replace(/Lock\s*\d+/gi, '');
        const cisla = (sm.match(/-?\d+(?:[,.]\d+)?/g) || []).map(x => x.replace(',', '.'));
        /* Aritmetika POSLEDNÍ nápovědy musí dát kód.
           Pozor na dvě pasti, obě mě stály falešné poplachy:
           tečka na konci předchozí VĚTY se plete s desetinnou
           („= 25. 25 × 5 = ?" vyjde 126,25 místo 125), a minus je
           často U+2212 („−"), ne ASCII. Věta se proto uřízne DŘÍV,
           než se smažou mezery. */
        let vypocet = null;
        const posl = tasks.length ? String(tasks[tasks.length - 1].hint || '').replace(/<[^>]*>/g, '') : '';
        const useky = posl.split('=');
        if (useky.length >= 2) {
          let e = useky[useky.length - 2].split(/\.\s+/).pop()
            .replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/[−–—]/g, '-')
            .replace(/,(\d)/g, '.$1').replace(/\s/g, '')
            .replace(/^[^0-9(+-]*/, '').replace(/^\.+/, '');
          if (/^[\d+\-*/().]+$/.test(e) && /[+\-*/]/.test(e)) {
            try { const v = Function('"use strict";return(' + e + ')')(); if (isFinite(v)) vypocet = v; } catch (err) {}
          }
        }

        const id = z.id || i + 1;
        xref.push(cisla.includes(kod.replace(',', '.'))
          ? { id, kde, stav: 'sedi' }
          : { id, kde, kod, stav: 'neuvadi', sm: sm.trim().slice(0, 70) });
        hint.push({ id, kde, kod, vypocet, text: posl.trim().slice(0, 60) });

        const texty = [z.title, z.tag, z.body].filter(x => typeof x === 'string');
        tasks.forEach(t => ['body', 'hint', 'title'].forEach(kk => { if (typeof t[kk] === 'string') texty.push(t[kk]); }));
        texty.forEach(t => {
          const bez = t.replace(/<[^>]*>/g, '');
          if (/undefined|NaN|\[object Object\]/.test(bez)) n.push(`${kde}: artefakt — ${bez.slice(0, 50)}`);
          const tk = bez.match(/(?<![\d.])\d+\.\d+(?![\d.])/g);
          if (tk) n.push(`${kde}: desetinná tečka „${tk[0]}"`);
        });
      });
      return { pocet: STEPS.length, uloh, nalezy: [...new Set(n)], xref, hint };
    });

    if (st.chyba) { await ctx.close(); return { jm, st }; }

    /* ── průchod: každý kód musí odemknout, špatný nesmí ── */
    const hra = await pg.evaluate(async ms => {
      const log = []; let odemceno = 0;
      const start = [...document.querySelectorAll('button')].find(b => /Začít|Start|detektiv|Spustit/i.test(b.textContent));
      if (start) start.click();
      await new Promise(r => setTimeout(r, 250));
      for (let i = 0; i < STEPS.length; i++) {
        const ocek = String(STEPS[i].code);
        const inp = document.getElementById('ci');
        if (!inp) { log.push(`zámek ${i + 1}: vstupní pole nenalezeno`); break; }
        const pred = cur;
        /* Špatný kód se NESMÍ poznat podle `cur` — ten se mění až po
           1900 ms animace, takže bychom se dívali dřív, než se cokoli
           stane, a pravidlo by nikdy neštěklo (ověřeno sabotáží
           `if (true)`: test spadl, ale na úplně jiné hlášce). Signál,
           který sedne OKAMŽITĚ, je `#ua.show` — nastavuje ho `chk()`
           synchronně ve všech osmi hrách. */
        const ua = document.getElementById('ua');
        if (ua) ua.classList.remove('show');
        inp.value = String(Number(ocek) + 7);          // špatný kód
        chk();
        if (ua && ua.classList.contains('show')) { log.push(`zámek ${i + 1}: ŠPATNÝ kód odemkl`); break; }
        if (cur !== pred) { log.push(`zámek ${i + 1}: ŠPATNÝ kód odemkl`); break; }
        const inp2 = document.getElementById('ci');
        if (inp2) { inp2.value = ocek; chk(); }
        await new Promise(r => setTimeout(r, ms));
        const posledni = i === STEPS.length - 1;
        const hotovo = posledni ? !!document.querySelector('#finish.active') : cur !== pred;
        if (!hotovo) { log.push(`zámek ${i + 1}: SPRÁVNÝ kód „${ocek}" NEODEMKL`); break; }
        odemceno++;
      }
      return { odemceno, celkem: STEPS.length, log, finale: !!document.querySelector('#finish.active') };
    }, ODEMCENI_MS);

    const skut = errs.filter(e => !/ERR_|CERT_|net::/i.test(e));
    await ctx.close();
    return { jm, st, hra, skut };
  }));

  let zamku = 0, uloh = 0, xrefSedi = 0, xrefNeuvedeno = 0, hintSedi = 0, hintBezVyrazu = 0;
  for (const v of vysledky) {
    const { jm, st, hra, skut } = v;
    if (st.chyba) { ok(false, `${jm}: ${st.chyba}`); continue; }
    zamku += st.pocet; uloh += st.uloh;
    ok(st.pocet === 10, `${jm}: 10 zámků (${st.pocet})`);
    ok(st.nalezy.length === 0, `${jm}: zadání bez závad`, st.nalezy.slice(0, 3).join(' | '));
    ok(hra.odemceno === hra.celkem, `${jm}: všech ${hra.celkem} zámků jde odemknout svým kódem`,
      `odemčeno ${hra.odemceno}` + (hra.log.length ? ' · ' + hra.log[0] : ''));
    ok(hra.finale, `${jm}: hra dojde do finále`);
    ok(!hra.log.some(x => /ŠPATNÝ kód odemkl/.test(x)), `${jm}: špatný kód zámek neodemkne`);
    ok(skut.length === 0, `${jm}: žádné JS chyby`, skut.slice(0, 1).join(''));

    const povolene = HLASKA_BEZ_VYSLEDKU[jm] || [];
    const spatne = st.xref.filter(x => x.stav !== 'sedi' && !povolene.includes(x.id));
    xrefSedi += st.xref.filter(x => x.stav === 'sedi').length;
    xrefNeuvedeno += st.xref.filter(x => x.stav !== 'sedi' && povolene.includes(x.id)).length;
    ok(spatne.length === 0, `${jm}: kód sedí na výsledek uvedený v hlášce`,
      spatne.map(x => `${x.kde} (kód ${x.kod}) → „${x.sm}"`).slice(0, 2).join(' | '));
    const mezikrok = NAPOVEDA_MEZIKROK[jm] || [];
    const hintSpatne = st.hint.filter(x => x.vypocet !== null && !mezikrok.includes(x.id)
      && Math.abs(x.vypocet - parseFloat(String(x.kod).replace(',', '.'))) > 1e-9);
    hintSedi += st.hint.filter(x => x.vypocet !== null && !mezikrok.includes(x.id)
      && Math.abs(x.vypocet - parseFloat(String(x.kod).replace(',', '.'))) <= 1e-9).length;
    hintBezVyrazu += st.hint.filter(x => x.vypocet === null).length;
    ok(hintSpatne.length === 0, `${jm}: poslední nápověda vede na kód`,
      hintSpatne.map(x => `${x.kde}: „${x.text}" → ${x.vypocet}, kód ${x.kod}`).slice(0, 2).join(' | '));

    /* Výjimka, která přestala být potřeba, se musí uklidit — jinak by
       tiše kryla zámek, který by se pokazil později. */
    const zbytecne = povolene.filter(id => st.xref.some(x => x.id === id && x.stav === 'sedi'));
    ok(zbytecne.length === 0, `${jm}: seznam výjimek neobsahuje nic navíc`,
      'zámky ' + zbytecne.join(', ') + ' už výsledek uvádějí — vyškrtni je');
  }

  /* Pojistka proti planému běhu. */
  ok(zamku === 80, `zkontrolováno 80 zámků (${zamku})`);
  ok(uloh >= 150, `zkontrolováno ${uloh} úloh`);

  /* Pokrytí křížové kontroly. Naměřeno 77 potvrzených / 3 neuvedené.
     Podlaha 70 nechává rezervu 7 zámků; kdyby někdo hlášky zobecnil,
     pravidlo by oslepilo a tohle to ohlásí místo tichého průchodu. */
  console.log(`\n  Kód × hláška: potvrzeno strojově ${xrefSedi}/${zamku}, ` +
    `${xrefNeuvedeno} ověřeno ručně (viz HLASKA_BEZ_VYSLEDKU).`);
  console.log(`  Kód × nápověda: dopočítáno ${hintSedi}/${zamku}, ` +
    `${hintBezVyrazu} nápověd bez uzavřeného výrazu (nelze soudit).`);
  /* Naměřeno 44 dopočítaných. Podlaha 30 nechá rozumnou rezervu a
     rozbité čtení nápověd by dalo 0. */
  ok(hintSedi >= 30, `aritmetika nápověd pokrývá aspoň 30 zámků (${hintSedi})`);
  ok(xrefSedi >= 70, `křížová kontrola pokrývá aspoň 70 zámků (${xrefSedi})`);

  console.log(`\n  Únikovky: ${pass} ✅ / ${fail} ❌\n`);
  await br.close(); srv.close();
  process.exit(fail ? 1 : 0);
})();
