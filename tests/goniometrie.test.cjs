/* ══════════════════════════════════════════════════════════════════════
   Goniometrie — zadání sedí na vlastní postup a text je česky.

   PROČ. `projects/goniometrie.html` (77 kB, 7 kapitol) je odkázaná
   z rozcestníku projektů, ale neměla ANI JEDEN test. Dvě vady, které
   se v ní proto usadily, jsou obě vidět žákovi:

   1. **Desetinná TEČKA v české verzi.** Zadání i nápovědy se skládají
      z JS čísel (`r1(2.4/Math.sin(...))`), takže se do textu dostane
      tečka. Naměřeno ve dvanácti scénách; v kapitole 5 dokonce přímo
      v ZADÁNÍ u ⅔ generování. Stránka je dvojjazyčná — v angličtině je
      tečka správně, takže se hlídají OBA jazyky proti sobě.
   2. **Nápověda tvrdila jiný výsledek, než z jejího vlastního postupu
      vyjde.** Kapitola 2, úloha 4 zadávala ZAOKROUHLENOU odvěsnu, ale
      odpovědí bylo původní nezaokrouhlené `c`. Při α = 30°, c = 15 se
      ptala na „c = 7 / sin 30°" (tedy 14) a odpovídala 15. Naměřeno
      u 8 z 28 kombinací (29 %).

   ── na co jsem cestou narazil ──

   • Kontrola „L3 nápověda uvádí totéž číslo jako `ans`" je SLABÁ a vadu
     č. 2 by NEODHALILA: nápověda 15 uváděla a `ans` bylo taky 15 —
     špatně bylo obojí naráz. Proto se tu nápovědě POČÍTÁ: z tvaru
     „c = 7 / sin 30° ≈ 15" se vezme levá strana, vyhodnotí a porovná
     s tím, co za „≈" stojí. Teprve tohle je nezávislý soud.
   • Desetinnou tečku nelze měřit na výstupu `build()` — oprava je až
     při vykreslení (`czNum`), takže by test svítil červeně nad
     opravenou stránkou. Měří se proto DOM, tedy to, co vidí dítě.

   Spusť: node tests/goniometrie.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 19075;
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

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await br.newContext();
  await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const jsErr = [];
  pg.on('pageerror', e => jsErr.push(e.message));
  await pg.goto(`http://localhost:${PORT}/projects/goniometrie.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(600);

  console.log('\n── Goniometrie ──\n');

  /* ═══ 1) Nápověda musí sedět na SVŮJ VLASTNÍ postup ═══ */
  const arit = await pg.evaluate(N => {
    if (typeof ACTS === 'undefined') return { chyba: 'ACTS není globální' };
    const rad = d => d * Math.PI / 180;
    const F = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
    const AF = { arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan };
    const nalezy = []; let overeno = 0, neposouzeno = 0;

    /* Vyhodnotí levou stranu zápisu „… ≈ V". Vrátí null, když tvar nezná
       — takové případy se počítají zvlášť, aby nemohly tiše zmizet. */
    const spocti = s => {
      let m;
      if ((m = s.match(/(-?[\d.]+)\s*[·*]\s*(sin|cos|tan)\s*(-?[\d.]+)\s*°/)))
        return F[m[2]](rad(+m[3])) * +m[1];
      if ((m = s.match(/(-?[\d.]+)\s*\/\s*(sin|cos|tan)\s*(-?[\d.]+)\s*°/)))
        return +m[1] / F[m[2]](rad(+m[3]));
      if ((m = s.match(/(arcsin|arccos|arctan)\(\s*(-?[\d.]+)\s*\/\s*(-?[\d.]+)\s*\)/)))
        return AF[m[1]](+m[2] / +m[3]) * 180 / Math.PI;
      if ((m = s.match(/(arcsin|arccos|arctan)\(\s*(-?[\d.]+)\s*\)/)))
        return AF[m[1]](+m[2]) * 180 / Math.PI;
      return null;
    };

    for (let it = 0; it < N; it++) for (const act of ACTS) {
      let c = null; try { c = act.setup ? act.setup() : null; } catch (e) { nalezy.push(`kap.${act.id}: setup spadl — ${e.message}`); continue; }
      (act.scenes || []).forEach((sc, si) => {
        let d = null; try { d = sc.build ? sc.build(c) : null; } catch (e) { nalezy.push(`kap.${act.id}/scéna ${si}: build spadl — ${e.message}`); return; }
        if (!d || !Array.isArray(d.hints)) return;
        d.hints.forEach(h => {
          const t = String(h).replace(/<[^>]*>/g, '');
          if (!t.includes('≈')) return;
          const [lev, prav] = t.split('≈');
          const v = parseFloat(String(prav).match(/-?[\d.]+/) || 'x');
          if (!isFinite(v)) return;
          const vyp = spocti(lev);
          if (vyp === null) { neposouzeno++; return; }
          overeno++;
          /* Tolerance: nápověda je zaokrouhlená na celé (úhly, cm) nebo
             na 1 des. místo (m), takže rozdíl smí být nejvýš 0,5. */
          if (Math.abs(vyp - v) > 0.5)
            nalezy.push(`kap.${act.id}/scéna ${si}: „${t.trim().slice(0, 60)}" → vychází ${vyp.toFixed(2)}, tvrdí ${v}`);
        });
      });
    }
    return { nalezy: [...new Set(nalezy)], overeno, neposouzeno };
  }, 300);

  if (arit.chyba) { ok(false, arit.chyba); }
  else {
    ok(arit.nalezy.length === 0, 'nápovědy sedí na svůj vlastní postup',
      arit.nalezy.slice(0, 3).join(' | '));
    /* Pojistka proti planému běhu: kdyby se tvary nápověd změnily,
       `spocti` by vracel null a pravidlo by oslepilo.
       NAMĚŘENO (ne odhadnuto — první verze měla podlahu 4000 podle
       mého odhadu a spadla na vlastní stránce, která je v pořádku):
       3 300 vyhodnocených zápisů na 300 generování, tedy 11 na jedno.
       Zbylých 2 700 jsou tvary bez výpočtu na levé straně („c ≈ 3,5 m")
       — devět scén v kapitolách 4–6, kde L3 jen vypíše výsledek
       a postup nese L2. U těch není co ověřovat, proto se počítají
       zvlášť a nemíchají se mezi ověřené. */
    console.log(`  Aritmetika nápověd: vyhodnoceno ${arit.overeno}, tvar neznám u ${arit.neposouzeno}.`);
    ok(arit.overeno > 2500, `vyhodnoceno dost zápisů (${arit.overeno})`);
  }

  /* ═══ 2) DOM: česky čárka, anglicky tečka, nikde artefakty ═══ */
  for (const jazyk of ['cs', 'en']) {
    const r = await pg.evaluate(({ N, jazyk }) => {
      setLang(jazyk);
      const nalezy = []; let obr = 0, sDes = 0;
      for (let it = 0; it < N; it++) for (const act of ACTS) {
        startAct(act.id);
        for (let i = 0; i < act.scenes.length; i++) {
          currentSceneIdx = i; renderScene(); obr++;
          const q = document.querySelector('.problem-q');
          const hs = [...document.querySelectorAll('.hint-box')];
          [q ? q.textContent : ''].concat(hs.map(h => h.textContent)).forEach((t, k) => {
            if (!t) return;
            const kde = `kap.${act.id}/scéna ${i}${k ? '/nápověda ' + k : '/zadání'}`;
            if (/undefined|NaN|\[object Object\]/.test(t)) nalezy.push(`${kde}: artefakt v textu`);
            const tecka = t.match(/(?<![\d.])\d+\.\d+(?![\d.])/g);
            const carka = t.match(/(?<![\d,])\d+,\d+(?![\d,])/g);
            if (tecka || carka) sDes++;
            if (jazyk === 'cs' && tecka) nalezy.push(`${kde}: desetinná TEČKA „${tecka[0]}"`);
            if (jazyk === 'en' && carka) nalezy.push(`${kde}: desetinná ČÁRKA v anglické verzi „${carka[0]}"`);
          });
        }
      }
      return { obr, sDes, nalezy: [...new Set(nalezy)] };
    }, { N: 40, jazyk });

    ok(r.nalezy.length === 0, `[${jazyk}] vykreslený text je v pořádku`, r.nalezy.slice(0, 3).join(' | '));
    /* Kdyby přestala vznikat desetinná čísla, pravidlo by nemělo co
       hlídat a mlčelo by. Naměřeno ~1 100 textů s desetinným číslem
       na 40 generování. */
    ok(r.sDes > 300, `[${jazyk}] test vůbec viděl desetinná čísla (${r.sDes})`);
    ok(r.obr > 1000, `[${jazyk}] vykresleno dost obrazovek (${r.obr})`);
  }

  const skut = jsErr.filter(e => !/ERR_|CERT_|net::/i.test(e));
  ok(skut.length === 0, 'žádné JS chyby', skut.slice(0, 1).join(''));

  console.log(`\n  Goniometrie: ${pass} ✅ / ${fail} ❌\n`);
  await br.close(); srv.close();
  process.exit(fail ? 1 : 0);
})();
