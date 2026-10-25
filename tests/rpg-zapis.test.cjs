/* ══════════════════════════════════════════════════════════════════════
   Zápis čísel v RPG tak, jak ho dítě vidí: minus „−“, mocnina horním indexem a pevná mezera u jednotek.

   Banky úloh píšou záporná čísla spojovníkem („(-5) + 3“, „x = -3“) a mocniny
   stříškou („2^5“, „10^n“, „3^(−1)“). Naměřeno 4. 10. 2026: spojovník v zadáních
   6.–9. ročníku 60 / 627 / 615 / 531×, v nápovědách 400 / 731 / 631 / 158×,
   v odpovědích stovky; stříška v 8. a 9. ročníku 30 a 405×. Ve škole se píše
   „−5“ a „2⁵“.

   Oprava je JEDNA, při zobrazení: `zapis()` v rpg-shared.js (a přes ni `czTxt`
   pro nápovědy a `czMC` pro volby a odpovědi). Banky zůstávají, jak jsou —
   `checkAns` spojovník i minus bere stejně. Test proto hlídá tři věci:
     1) `zapis` převádí, co má, a NEsahá na spojovník, který znaménkem není,
     2) po průchodu zobrazením nezbyde v žádné úloze 3.–9. ročníku spojovník
        jako minus ani stříška (zadání, nápovědy, odpověď),
     (4) Číslo + jednotka drží pevnou mezeru („12 cm“, „25 %“) — naměřeno 23. 10. 2026 u 18–42 % zadání
         3.–9. ročníku (26 800 z 88 320 vzorků), jinak se na úzké obrazovce „12“ a „cm“ zlomí na dva řádky.
     3) boj, trénink a věž opravdu zobrazují přes `zapis` — úloha se „-5“
        a „2^3“ se v DOM ukáže jako „−5“ a „2³“ (jinak by 1) a 2) svítily
        zeleně nad hrou, která zápis vůbec nepoužívá).
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

// ── 1) zapis() sám o sobě ────────────────────────────────────────────────
const shared = fs.readFileSync(path.join(ROOT, 'projects/rpg-shared.js'), 'utf8');
const vytahni = jm => { const i = shared.indexOf(jm); if (i < 0) throw new Error('chybí ' + jm); return shared.slice(i, shared.indexOf('\n', i)); };
const { zapis, czTxt, czMC } = new Function(vytahni('function zapis(') + '\n' + vytahni('function czTxt(') + '\n' + vytahni('function czMC(') + '\nreturn { zapis, czTxt, czMC };')();
const PRIPADY = [
  ['Kolik je: (-5) + 3', 'Kolik je: (−5) + 3'], ['x = -3', 'x = −3'], ['-7', '−7'], ['f(-2)', 'f(−2)'],
  ['2^5', '2⁵'], ['Zapiš číslem:\n3^2 · 3^4 =', 'Zapiš číslem:\n3² · 3⁴ ='], ['10^n. Jaké je n?', '10ⁿ. Jaké je n?'],
  ['3^(−1)', '3⁻¹'], ['(-2)^4 =', '(−2)⁴ ='], ['a^0', 'a⁰'],
  // spojovník, který znaménkem NENÍ, zůstává
  ['čísla 1-10', 'čísla 1-10'], ['5 - 10 minut', '5 - 10 minut'], ['pracovní-den', 'pracovní-den'],
  // číslo + jednotka: pevná mezera; slova, která jednotkou nejsou, zůstanou
  ['Délka 12 cm', 'Délka 12\u00A0cm'], ['sleva 25 %', 'sleva 25\u00A0%'], ['rychlost 5 km/h', 'rychlost 5\u00A0km/h'], ['3 m²', '3\u00A0m²'],
  ['500 Kč', '500\u00A0Kč'], ['x = -3 m', 'x = −3\u00A0m'], ['2,5 kg', '2,5\u00A0kg'], ['40 min', '40\u00A0min'], ['7 l', '7\u00A0l'],
  ['3 minuty', '3 minuty'], ['2 s kamarádem', '2 s kamarádem'], ['5 metrů', '5 metrů'], ['4 hodiny', '4 hodiny'], ['3 listy', '3 listy'],
  // tisícové skupiny: pevná mezera uvnitř čísla; čtyřmístné číslo před skupinou a desetinná část ne
  ['12 000 Kč', '12\u00A0000\u00A0Kč'], ['1 000 000', '1\u00A0000\u00A0000'], ['Kolik je 2 × 15 000?', 'Kolik je 2 × 15\u00A0000?'], ['2023 100', '2023 100'], ['0,5 000', '0,5 000'], ['3 a 100', '3 a 100'],
];
const spatne = PRIPADY.filter(([z, c]) => zapis(z) !== c).map(([z, c]) => JSON.stringify(z) + ' → ' + JSON.stringify(zapis(z)) + ' (čekáno ' + JSON.stringify(c) + ')');
ok(spatne.length === 0, 'zapis(): minus, mocniny a spojovník, který znaménkem není (' + PRIPADY.length + ' případů)' + (spatne.length ? ' — ' + spatne.join(' | ') : ''));
ok(czMC('-2.5') === '−2,5' && czTxt('x = -1.5') === 'x = −1,5', 'czMC a czTxt dělají čárku i minus naráz („−2,5“)');

// ── 2) žádná úloha 3.–9. ročníku po zobrazení ────────────────────────────
const MINUS = /(^|[\s(\[=:;,+×·*\/−])-(?=\d)/, STRISKA = /\^/;
const JEDN = '(?:cm|dm|mm|km|kg|dkg|mg|ml|dl|hl|Kč|min|hod|[mglht]|%)';
const JEDN_OBYC = new RegExp('\\d ' + JEDN + '(?![\\p{L}\\d])', 'u'), JEDN_PEVNA = new RegExp('\\d\u00A0' + JEDN + '(?![\\p{L}\\d])', 'gu');
let pevnych = 0, tisicu = 0;
const TIS_OBYC = /(^|[^\d,.])\d{1,3}(?: \d{3})+(?!\d)/, TIS_PEVNA = /(^|[^\d,.])\d{1,3}(?:\u00A0\d{3})+(?!\d)/g;
const zakl = { ri: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a, pick: a => a[Math.floor(Math.random() * a.length)],
  gcd: function g(a, b) { return b ? g(b, a % b) : Math.abs(a); }, cz: n => String(n).replace('.', ','), skl: (n, o, f, m) => (n === 1 ? o : (n >= 2 && n <= 4 ? f : m)),
  shuffleArr: a => a, countDiv: () => 1, r1: x => Math.round(x * 10) / 10, r2: x => Math.round(x * 100) / 100 };
let uloh = 0; const vady = [], vadyJ = [], vadyT = [];
for (const g of [3, 4, 5, 6, 7, 8, 9]) {
  const src = fs.readFileSync(path.join(ROOT, 'projects/rpg-tasks-' + g + '.js'), 'utf8');
  const svgJmena = [...new Set(src.match(/\bsvg[A-Z]\w*/g) || [])];
  const c = Object.assign({ window: {} }, zakl); for (const n of svgJmena) c[n] = () => '<svg></svg>';
  const k = Object.keys(c);
  new Function(...k, src)(...k.map(x => c[x]));
  const EX = c.window['RPG_TASK_EXTRA_' + g] || {};
  // základní šablony misí jsou ve hře (AREAS), ne v bance
  const html = fs.readFileSync(path.join(ROOT, 'projects/rpg-mat-' + g + '.html'), 'utf8');
  const m = html.match(/const AREAS\s*=\s*(\[[\s\S]*?\n\s*\];)/);
  Object.assign(global, zakl); for (const n of new Set(m[1].match(/\bsvg[A-Z]\w*/g) || [])) global[n] = () => '<svg></svg>';
  const AREAS = new Function('return ' + m[1].replace(/;\s*$/, ''))();
  for (const ar of AREAS) for (const mi of ar.missions) EX['z' + mi.id] = () => mi.tasks() || [];
  for (const mid of Object.keys(EX)) for (let i = 0; i < 40; i++) for (const t of EX[mid]() || []) {
    uloh++;
    const casti = [['zadání', zapis(t.text)], ['odpověď', czMC(t.ans)], ...(t.hints || []).map(h => ['nápověda', czTxt(h)])];
    for (const [co, s] of casti) {
      pevnych += (s.match(JEDN_PEVNA) || []).length;
      tisicu += (s.match(TIS_PEVNA) || []).length;
      if (TIS_OBYC.test(s)) { if (vadyT.length < 5) vadyT.push(g + '/' + mid + ' ' + co + ': ' + JSON.stringify(s.slice(0, 60))); else vadyT.length++; }
      if (JEDN_OBYC.test(s)) { if (vadyJ.length < 5) vadyJ.push(g + '/' + mid + ' ' + co + ': ' + JSON.stringify(s.slice(0, 60))); else vadyJ.length++; }
    }
    for (const [co, s] of casti) if (MINUS.test(s) || STRISKA.test(s)) { if (vady.length < 5) vady.push(g + '/' + mid + ' ' + co + ': ' + JSON.stringify(s.slice(0, 60))); else vady.length++; }
  }
}
ok(uloh > 30000, 'proměřeno ' + uloh + ' úloh z bank 3.–9. ročníku (podlaha 30 000)');
ok(vady.length === 0, 'po zobrazení nezbyl spojovník jako minus ani stříška (zadání, odpověď, nápověda)' + (vady.length ? ' — ' + vady.length + '×: ' + vady.slice(0, 5).join(' | ') : ''));
ok(vadyJ.length === 0, 'po zobrazení nezbylo „číslo jednotka“ s obyčejnou mezerou (zadání, odpověď, nápověda)' + (vadyJ.length ? ' — ' + vadyJ.length + '×: ' + vadyJ.slice(0, 5).join(' | ') : ''));
ok(pevnych > 60000, 'pravidlo pevné mezery se v bankách skutečně uplatnilo: ' + pevnych + '× (naměřeno 66 280 shodně ve 3 bězích, podlaha 60 000)');
ok(vadyT.length === 0, 'po zobrazení nezbyla tisícová skupina s obyčejnou mezerou (zadání, odpověď, nápověda)' + (vadyT.length ? ' — ' + vadyT.length + '×: ' + vadyT.slice(0, 5).join(' | ') : ''));
ok(tisicu > 500, 'pravidlo tisícových skupin se v bankách skutečně uplatnilo: ' + tisicu + '× (naměřeno 629–635 ve 3 bězích, podlaha 500)');

// ── 3) boj, trénink a věž opravdu zobrazují přes zapis() ─────────────────
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
(async () => {
  const srv = http.createServer((q, p) => { const fp = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0])));
    if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end(); }
    p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(p); });
  await new Promise(r => srv.listen(0, r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const ctx = await br.newContext({ viewport: { width: 1024, height: 768 } });
    await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    const page = await ctx.newPage(); const chyby = [];
    page.on('pageerror', e => chyby.push(e.message));
    await page.addInitScript(() => { window.__TW_TESTNOW = '2026-05-15T10:00:00'; });
    await page.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 15000 });
    const r = await page.evaluate(async () => {
      const raf = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      document.getElementById('ni').value = 'Test'; startGame(); S.tutorialDone = true;
      const U = { text: 'Kolik je (-5) + 2^3? Délka je 12 cm a sleva 25 %.', ans: '-3', hints: ['(-5) + 8', 'Výsledek: -3'], skill: 'calc' };
      const out = {};
      const ar = AREAS[1], mi = ar.missions.find(m => !m.mc) || ar.missions[0];
      // obě větve vykreslení: bez obrázku a s obrázkem (každá má vlastní řádek)
      for (const [kde, u] of [['', U], [' s obrázkem', Object.assign({ svg: '<svg viewBox="0 0 10 10"></svg>' }, U)]]) {
        launchBattle(ar.id, mi.id); BT.tasks[BT.idx] = u; if (BT.mini) BT.mini[BT.idx] = null; renderTask(); await raf();
        out['boj' + kde] = document.getElementById('bt-prob').textContent;
        go('train'); startTrain(mi.id); TR.task = u; TR.hl = 0; trRender(); await raf();
        out['trénink' + kde] = document.getElementById('tr-prob').textContent;
        if (!kde) { document.getElementById('tr-ans').value = '987'; trSubmit(); await raf(); out.hlaska = document.getElementById('tr-fb').textContent; }
        if (typeof twStart === 'function') { go('tower'); twStart(); TW.task = u; twRenderTask(); await raf(); out['věž' + kde] = document.getElementById('tw-prob').textContent; TW.on = false; if (typeof twStopTimer === 'function') twStopTimer(); }
      }
      return out;
    });
    const mist = Object.entries(r).filter(([k, v]) => k === 'hlaska' ? !/Správně: −3/.test(v) : !(v.includes('(−5)') && v.includes('2³') && v.includes('12\u00A0cm') && v.includes('25\u00A0%')));
    ok(mist.length === 0, g + '. ročník: boj, trénink' + (r['věž'] !== undefined ? ' a věž' : '') + ' ukazují „(−5) + 2³“, „12\u00A0cm“ a „25\u00A0%“ s pevnou mezerou (bez obrázku i s ním) a hláška po chybě „Správně: −3“' + (mist.length ? ' — ' + mist.map(([k, v]) => k + ': ' + JSON.stringify(v)).join(' | ') : ''));
    ok(chyby.length === 0, g + '. ročník: žádné JS chyby' + (chyby.length ? ' — ' + chyby.slice(0, 2).join(' | ') : ''));
    await ctx.close();
  }
  await br.close(); srv.close();
  console.log('\n══════════════════════════════════════════\n  Zápis v RPG: ' + pass + ' ✅ / ' + fail + ' ❌\n══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
