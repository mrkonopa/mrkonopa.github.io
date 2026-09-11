/* ══════════════════════════════════════════════════════════════════
   Nástroj pro mapování MISE → VIDEO (tools/videa-mapovani.html).

   Hlídá tři věci:
     1) generátor doopravdy načte data (ne prázdný nástroj),
     2) zapsaný HTML se NEROZEŠEL s generátorem — je to vygenerovaný
        soubor v repozitáři, přesně ten tvar, který se v tomhle
        repozitáři už jednou tiše rozjel (portréty vs. aréna),
     3) proklikání opravdu vede k vyplněnému CSV.

   Spusť: node tests/videa-mapovani.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18492;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const HTML = path.join(ROOT, 'tools/videa-mapovani.html');

let pass = 0, fail = 0;
function ok(name, cond, d = '') {
  if (cond) { console.log('  ✅ ' + name); pass++; }
  else { console.log('  ❌ ' + name + (d ? ' — ' + d : '')); fail++; }
}

function startServer() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', csv: 'text/csv' };
  const srv = http.createServer((req, res) => {
    const p = req.url.split('?')[0];
    const fp = path.normalize(path.join(ROOT, p));
    if (!fp.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end('forbidden'); return; }
    try {
      res.writeHead(200, { 'Content-Type': mime[p.split('.').pop()] || 'application/octet-stream' });
      res.end(fs.readFileSync(fp));
    } catch { res.writeHead(404); res.end('nf'); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

async function run() {
  console.log('\n── Nástroj: mapování videí 1. stupně ──\n');

  /* ── 1. generátor běží a něco skutečně načte ───────────────────── */
  const tmp = path.join(os.tmpdir(), 'videa-mapovani-test-' + process.pid + '.html');
  let vystup = '';
  try {
    vystup = execFileSync(process.execPath, [path.join(ROOT, 'tools/videa-mapovani.cjs'), tmp],
      { encoding: 'utf8', cwd: ROOT });
    ok('generátor doběhl', true);
  } catch (e) {
    ok('generátor doběhl', false, String(e.stdout || e.message).slice(0, 200));
  }
  const mVid = /Načteno: (\d+) videí · (\d+) dílů · (\d+) misí/.exec(vystup);
  ok('hlásí NAMĚŘENÉ počty, ne konstantu', !!mVid, JSON.stringify(vystup.slice(0, 80)));
  if (mVid) {
    ok('načetl všech 3 632 videí', +mVid[1] === 3632, 'videí=' + mVid[1]);
    ok('… z 15 dílů', +mVid[2] === 15, 'dílů=' + mVid[2]);
    ok('… a 63 misí (3 ročníky × 21)', +mVid[3] === 63, 'misí=' + mVid[3]);
  }
  ok('žádné video nevypadlo kvůli tvaru názvu', /Bez použitelné strany nebo ID: 0\b/.test(vystup),
    'hlásí: ' + (/Bez použitelné[^\n]*/.exec(vystup) || [''])[0]);
  /* Popisky stran jsou to, co z nástroje dělá nástroj — bez nich se
     v patnácti dílech po 64 stranách nedá nic najít. Kdyby se mapování
     slugů rozešlo, generátor spadne; tohle hlídá i tichý pokles. */
  const mPop = /Popisků stran napojeno: (\d+) · dílů s ročníkem: (\d+)/.exec(vystup);
  ok('hlásí, kolik popisků stran se napojilo', !!mPop, JSON.stringify(vystup.slice(0, 120)));
  if (mPop) {
    ok('napojeno všech 567 popisků', +mPop[1] === 567, 'popisků=' + mPop[1]);
    ok('… a devět dílů má určený ročník', +mPop[2] === 9, 'dílů=' + mPop[2]);
  }

  /* ── 2. zapsaný soubor se nerozešel s generátorem ───────────────── */
  const zapsany = fs.existsSync(HTML) ? fs.readFileSync(HTML, 'utf8') : '';
  const cerstvy = fs.existsSync(tmp) ? fs.readFileSync(tmp, 'utf8') : '';
  ok('tools/videa-mapovani.html je v repozitáři', zapsany.length > 50000, 'délka=' + zapsany.length);
  ok('a je totožný s tím, co generátor vyrobí teď', zapsany === cerstvy,
    'zapsaný ' + zapsany.length + ' B vs. čerstvý ' + cerstvy.length + ' B — spusť `node tools/videa-mapovani.cjs`');
  try { fs.unlinkSync(tmp); } catch (e) {}

  /* ── 3. proklikání ─────────────────────────────────────────────── */
  const srv = await startServer();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  const errors = [];
  let ctx;
  try {
    ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_/i.test(m.text())) errors.push(m.text()); });
    /* stránka si tahá jen písmo z Google Fonts; v sandboxu je blokované
       a bez přerušení drží načtení ~12 s (viz rpg-1stupen-hostile) */
    await ctx.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
    await page.goto(`${BASE}/tools/videa-mapovani.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#seznam .m', { timeout: 8000 });

    const misi = await page.evaluate(() => document.querySelectorAll('#seznam .m').length);
    ok('seznam ukáže všech 63 misí', misi === 63, 'misí=' + misi);

    const stav0 = await page.textContent('#stav');
    ok('na začátku hlásí 0 hotových', /^0 z 63/.test(stav0.trim()), JSON.stringify(stav0));

    /* vyber misi, díl, stranu a cvičení */
    await page.click('#seznam .m[data-i="0"]');
    await page.waitForSelector('#d-dil', { timeout: 4000 });
    /* Nabídka je zúžená na ročník té mise. Patnáct dílů v seznamu byla
       zbytečná práce, když kandidáti pro třeťáka jsou tři (7. díl,
       8. díl, Geometrie pro 3. ročník). */
    const dilu = await page.evaluate(() => document.getElementById('d-dil').options.length - 1);
    ok('nabídka dílů je zúžená na ročník mise', dilu === 3, 'dílů=' + dilu);
    const jmenaDilu = await page.evaluate(() =>
      [...document.getElementById('d-dil').options].slice(1).map(o => o.textContent.split(' (')[0]));
    ok('a jsou to díly pro 3. ročník',
      jmenaDilu.join('|') === '7. díl|8. díl|Geometrie pro 3. ročník', jmenaDilu.join(' | '));

    /* únikové zaškrtávátko musí vrátit všech patnáct */
    await page.click('#d-vse');
    await page.waitForFunction(() => document.getElementById('d-dil').options.length - 1 === 15, { timeout: 4000 });
    ok('zaškrtnutím se ukáže všech 15 dílů', true);
    await page.click('#d-vse');
    await page.waitForFunction(() => document.getElementById('d-dil').options.length - 1 === 3, { timeout: 4000 });

    /* NÁVRHY podle tématu strany */
    const navrhu = await page.evaluate(() => document.querySelectorAll('.navrh').length);
    ok('mise dostane návrhy stran podle tématu', navrhu >= 1, 'návrhů=' + navrhu);
    const navrhText = await page.evaluate(() => (document.querySelector('.navrh') || {}).textContent || '');
    ok('návrh uvádí téma, díl i stranu', /s\.\s*\d+/.test(navrhText) && navrhText.length > 15,
      JSON.stringify(navrhText.slice(0, 60)));
    await page.click('.navrh');
    await page.waitForSelector('.mrizka .s.on', { timeout: 4000 });
    ok('kliknutí na návrh vybere díl i stranu', true);

    await page.selectOption('#d-dil', { index: 1 });
    await page.waitForSelector('.mrizka .s', { timeout: 4000 });
    const stran = await page.evaluate(() => document.querySelectorAll('.mrizka .s').length);
    ok('po výběru dílu se ukáže mřížka stran', stran > 50, 'stran=' + stran);

    /* strana s videem — mřížka ukazuje počet dole, vezmi první */
    await page.click('.mrizka .s');
    await page.waitForSelector('.vid', { timeout: 4000 });
    const vidu = await page.evaluate(() => document.querySelectorAll('.vid').length);
    ok('strana nabídne konkrétní cvičení', vidu >= 1, 'videí=' + vidu);

    await page.click('.vid');
    await page.waitForFunction(() => /^1 z 63/.test(document.getElementById('stav').textContent), { timeout: 4000 });
    ok('výběr cvičení se započítá do postupu', true);

    const oznaceno = await page.evaluate(() => document.querySelectorAll('#seznam .m.hot').length);
    ok('a mise se v seznamu označí jako hotová', oznaceno === 1, 'hot=' + oznaceno);

    /* CSV — vygeneruj přímo z funkce, ať test nesahá na stahování */
    const csv = await page.evaluate(() => doCsv());
    const radky = csv.trim().split('\n');
    ok('CSV má hlavičku a 63 řádků', radky.length === 64, 'řádků=' + radky.length);
    ok('hlavička nese youtube_id', /(^|,)youtube_id(,|$)/.test(radky[0]), radky[0]);
    const prvni = radky[1].split(',');
    ok('vyplněná mise má v CSV skutečné YouTube ID', /^[A-Za-z0-9_-]{11}$/.test(prvni[5]),
      'v poli id je ' + JSON.stringify(prvni[5]));
    ok('nevyplněné mise zůstanou prázdné, ne „undefined"',
      !/undefined|\bnull\b|NaN/.test(csv), 'v CSV je nechtěná hodnota');

    /* stav přežije zavření a otevření (localStorage) */
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#seznam .m', { timeout: 8000 });
    const poReload = await page.textContent('#stav');
    ok('rozdělaná práce přežije zavření okna', /^1 z 63/.test(poReload.trim()), JSON.stringify(poReload));

    ok('žádné chyby JavaScriptu', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    ok('proklikání doběhlo bez výjimky', false, (e.stack || e.message).split('\n').slice(0, 2).join(' // '));
  } finally {
    if (ctx) await ctx.close().catch(() => {});
    await browser.close();
    srv.close();
  }

  console.log(`\n${pass} ✅  ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
}
run();
