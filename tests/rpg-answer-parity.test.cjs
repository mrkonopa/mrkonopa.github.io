/* ══════════════════════════════════════════════════════════════════════
   Odpovědi se ve všech ročnících hodnotí STEJNĚ.

   Vzniklo z nálezu v 1. stupni: g3/4/5 měly vedle sdíleného modulu ještě
   vlastní kopie `checkAns`, `isYN`, `answerYN` a `trAnswerYN`, psané jako
   „fallback, kdyby se rpg-shared.js nenačetl".

   Fungovalo to opačně, než se čekalo. Modul se načítá s `defer`, takže
   běžel VŽDY ten sdílený a lokální verze byly mrtvé — včetně lokální
   `answerYN`, která nesla CELOU druhou kopii bodování boje (kombo, XP,
   kredity, poškození). Stačila by změna pořadí skriptů a devítiletým
   dětem by se začaly počítat body jinak.

   A ta záloha se chovala jinak než originál. Kdyby se aktivovala,
   označila by za špatně:

       „1 500"    (běžný český zápis tisíců — dítě ho u velkých čísel
                   napíše skoro jistě)
       „1/2"      (zlomek místo desetinného čísla)
       „0,33"     (periodický rozvoj zaokrouhlený na 2 des. místa)
       „1 234,5"  (mezera i čárka)
       „−5"       (unicode minus)

   A udělala by to POTICHU: hra běží dál, dítě jen dostane „špatně".
   Záloha, která se chová jinak než originál, je horší než žádná —
   2. stupeň žádnou nemá a při chybějícím modulu spadne nahlas.

   Test proto hlídá dvě věci: že žádná hra sdílené funkce nepřepisuje,
   a hlavně že všech sedm ročníků dá na stejný vstup stejný výsledek.

   Spusť: node tests/rpg-answer-parity.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18997;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GRADES = [3, 4, 5, 6, 7, 8, 9];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

/* Vstupy, které dítě reálně napíše. Očekávaný výsledek je „uznat" —
   všechno to jsou správné odpovědi zapsané jinak, než je uloženo. */
const VSTUPY = [
  ['1 500', '1500', true, 'velké číslo s mezerou (český zápis tisíců)'],
  ['1500', '1500', true, 'velké číslo bez mezery'],
  ['0,5', '0.5', true, 'desetinná čárka'],
  ['1/2', '0.5', true, 'zlomek místo desetinného čísla'],
  ['0,33', '0.3333333333', true, 'periodický rozvoj zaokrouhlený na 2 des. místa'],
  [' 12 ', '12', true, 'mezery okolo'],
  ['ano', 'ANO', true, 'ANO/NE malými písmeny'],
  ['−5', '-5', true, 'unicode minus (U+2212)'],
  ['1 234,5', '1234.5', true, 'mezera i čárka'],
  // A co uznat NESMÍ — jinak by test prošel i pro funkci vracející vždy true.
  ['13', '12', false, 'jiné číslo se NEuzná'],
  ['ne', 'ANO', false, 'opačná odpověď se NEuzná'],
  ['', '12', false, 'prázdná odpověď se NEuzná'],
];

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

console.log('\n── Hodnocení odpovědí je ve všech ročnících stejné ──\n');

/* ── 1. ze zdrojáku: hra nesmí přepisovat, co vlastní sdílený modul ──── */
{
  const shared = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-shared.js'), 'utf8');
  const vlastni = [...shared.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(m => m[1]);
  ok(vlastni.length >= 4, `rpg-shared.js definuje funkce (${vlastni.join(', ')})`);

  const kolize = [];
  for (const g of GRADES) {
    const s = fs.readFileSync(path.join(ROOT, 'projects', `rpg-mat-${g}.html`), 'utf8');
    const vHre = [...s.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(m => m[1]);
    vHre.filter(f => vlastni.includes(f)).forEach(f => kolize.push(`g${g}: ${f}`));
  }
  ok(kolize.length === 0,
    'žádná hra nepřepisuje funkci ze sdíleného modulu', kolize.join(' | '));
}

(async () => {
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  const podpisy = {}, vysledky = {};
  try {
    for (const g of GRADES) {
      const ctx = await browser.newContext();
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof checkAns === 'function', { timeout: 8000 });

      const r = await page.evaluate((vstupy) => ({
        podpis: checkAns.toString().replace(/\s+/g, ' ').trim(),
        vys: vstupy.map(([a, b]) => checkAns(a, b) === true),
      }), VSTUPY);

      podpisy[g] = r.podpis;
      vysledky[g] = r.vys;

      const zle = VSTUPY.map(([a, b, oc, pop], i) => r.vys[i] === oc ? null
        : `„${a}" vs „${b}" → ${r.vys[i] ? 'uznáno' : 'neuznáno'} (${pop})`).filter(Boolean);
      ok(zle.length === 0, `g${g} hodnotí všech ${VSTUPY.length} vstupů správně`, zle.join(' | '));
      await ctx.close();
    }

    /* ── 2. všechny ročníky mají TU SAMOU funkci ─────────────────────── */
    const ruzne = [...new Set(Object.values(podpisy))];
    ok(ruzne.length === 1,
      `všech ${GRADES.length} ročníků má identickou checkAns`,
      ruzne.length > 1 ? `nalezeno ${ruzne.length} různých variant` : '');

    /* ── 3. a shodují se i ve výsledcích (kdyby podpis oklamal) ──────── */
    const vzor = JSON.stringify(vysledky[GRADES[0]]);
    const nesouhlas = GRADES.filter(g => JSON.stringify(vysledky[g]) !== vzor);
    ok(nesouhlas.length === 0,
      'všechny ročníky dají na stejný vstup stejný výsledek',
      nesouhlas.map(g => 'g' + g).join(', '));

    ok(Object.keys(podpisy).length === GRADES.length,
      `proměřeno všech ${GRADES.length} ročníků (${Object.keys(podpisy).length})`);
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Hodnocení odpovědí: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
