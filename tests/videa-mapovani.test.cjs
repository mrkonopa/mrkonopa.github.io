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
    /* Návrh musí říct VŠECHNO, co k rozhodnutí potřebuješ: téma strany
       (tučně), díl, číslo strany a kolik je na ní cvičení. Kontrola je
       po částech, ať selhání rovnou pojmenuje, co chybí — dřív to byl
       jeden regulární výraz na starý zápis „s. 12" a při přeformulování
       popisku hlásil vadu nástroje, který je v pořádku. */
    const n0 = await page.evaluate(() => {
      const el = document.querySelector('.navrh');
      if (!el) return null;
      return { tema: (el.querySelector('b') || {}).textContent || '', vse: el.textContent || '' };
    });
    const chybi = !n0 ? ['celý návrh'] : [
      n0.tema.trim().length > 3 ? null : 'téma',
      /(\d\.\s*díl|Geometrie)/.test(n0.vse) ? null : 'díl',
      /strana\s*\d+/.test(n0.vse) ? null : 'strana',
      /\d+\s*(videí|videa|video)/.test(n0.vse) ? null : 'počet videí',
    ].filter(Boolean);
    ok('návrh uvádí téma, díl, stranu i počet videí', chybi.length === 0,
      'chybí: ' + chybi.join(', ') + ' — ' + JSON.stringify((n0 ? n0.vse : '').slice(0, 80)));
    /* ── ČITELNOST ────────────────────────────────────────────────────
       Vojta nahlásil, že „texty nejsou vidět" — a byla to pravda:
       tučný nadpis návrhu měl `color:#fff` na krémovém pozadí. Ze
       zdrojáku se to nepozná (barva se dědí z několika míst), proto se
       měří SKUTEČNÝ poměr jasu na vykreslené stránce. Práh 4,5 je WCAG AA
       pro běžný text; naměřeno je po opravě nejhůř ~4,9, takže rezerva
       je reálná, ne vymyšlená. */
    const kontrast = await page.evaluate(() => {
      const lum = c => {
        const v = (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
        if (v.length < 3) return null;
        const [r, g, b] = v.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const pozadi = el => {
        for (let n = el; n; n = n.parentElement) {
          const c = getComputedStyle(n).backgroundColor;
          if (c && !/rgba\(0,\s*0,\s*0,\s*0\)|transparent/.test(c)) return c;
        }
        return 'rgb(255, 255, 255)';
      };
      const nalezy = []; let mereno = 0, nej = 99;
      document.querySelectorAll('body *').forEach(el => {
        /* jen prvky s VLASTNÍM textem — jinak by se každý obal počítal znovu */
        const vlastni = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (!vlastni) return;
        const st = getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) return;
        const Lf = lum(st.color), Lb = lum(pozadi(el));
        if (Lf == null || Lb == null) return;
        mereno++;
        const p = (Math.max(Lf, Lb) + 0.05) / (Math.min(Lf, Lb) + 0.05);
        if (p < nej) nej = p;
        if (p < 4.5) nalezy.push(el.tagName.toLowerCase() + '[' + st.color + ' na ' + pozadi(el) + ' = '
          + p.toFixed(2) + '] „' + el.textContent.trim().slice(0, 24) + '"');
      });
      return { nalezy, mereno, nej: +nej.toFixed(2) };
    });
    /* pojistka proti běhu naprázdno: kdyby se detail nevykreslil, sken
       by nic nenašel a „0 nálezů" by vypadalo jako úspěch */
    ok('kontrast se měřil na skutečné stránce', kontrast.mereno >= 30, 'změřeno prvků=' + kontrast.mereno);
    ok('všechny texty mají kontrast aspoň 4,5 (nejhorší ' + kontrast.nej + ')',
      kontrast.nalezy.length === 0, kontrast.nalezy.slice(0, 4).join(' | '));

    /* ── NÁVOD ───────────────────────────────────────────────────────
       Druhá půlka téže zpětné vazby: „vůbec nevím, co mám v tom mapování
       dělat". Postup patří do nástroje, ne do chatu. */
    const navod = await page.evaluate(() => {
      const el = document.getElementById('navod'), b = document.getElementById('b-navod');
      return { je: !!el, kroku: el ? el.querySelectorAll('ol li').length : 0,
        videt: !!el && !el.classList.contains('skryty'), btn: b ? b.textContent : '' };
    });
    ok('nástroj nese návod a je hned vidět', navod.je && navod.videt, JSON.stringify(navod));
    ok('návod má očíslované kroky', navod.kroku >= 3, 'kroků=' + navod.kroku);
    /* Kolik misí zůstane bez návrhu, se v návodu POČÍTÁ. Napsané číslo by
       se při každém doladění vážení tiše rozešlo se skutečností — a právě
       takové tvrzení pak čte člověk jako fakt. */
    const bez = await page.evaluate(() => (document.getElementById('bez-navrhu') || {}).textContent || '');
    const mBez = /^(\d+) z (\d+)$/.exec(bez.trim());
    ok('návod uvádí NAMĚŘENÝ počet misí bez návrhu',
      !!mBez && +mBez[2] === 63 && +mBez[1] >= 0 && +mBez[1] < 20, JSON.stringify(bez));
    await page.click('#b-navod');
    await page.waitForFunction(() => document.getElementById('navod').classList.contains('skryty'), { timeout: 4000 });
    ok('návod jde schovat', true);
    /* schování se musí pamatovat — kdo si ho schová, nechce ho vidět zas */
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#seznam .m', { timeout: 8000 });
    const poZnovu = await page.evaluate(() => document.getElementById('navod').classList.contains('skryty'));
    ok('a schovaný zůstane i po zavření okna', poZnovu === true, 'po reloadu skrytý=' + poZnovu);
    await page.click('#b-navod');
    await page.click('#seznam .m[data-i="0"]');
    await page.waitForSelector('.navrh', { timeout: 4000 });

    /* zaškrtávátko musí zůstat zaškrtávátkem — globální `width:100%` pro
       pole ho jednou roztáhlo přes celý řádek a popisek odletěl doprava */
    const cb = await page.evaluate(() => {
      const r = document.getElementById('d-vse').getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    ok('zaškrtávátko není roztažené přes celý řádek', cb.w > 0 && cb.w <= 30, JSON.stringify(cb));

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

    /* ── EXPORT → IMPORT musí vrátit TOTÉŽ ──────────────────────────
       Import dřív dělil řádek přes split(','), s komentářem „exportujeme
       jen hodnoty bez čárek". Jenže DVĚ mise z 63 se jmenují „Násobení
       a dělení 10, 100" (3/7-2 a 5/5-3): export je správně zabalí do
       uvozovek, naivní dělení je rozseká a všechny sloupce za názvem se
       posunou o jedna. Mise se páruje podle sloupců PŘED názvem, takže
       se řádek přijal a uložil cizí díl, stranu i ID — tiše. */
    const kolo = await page.evaluate(() => {
      const zapis = { dil: DILY[0], strana: '7', id: 'ABCDEFGHIJK', cv: '2', pozn: 'zkouška' };
      const scarkou = MISE.filter(m => m.nm.indexOf(',') >= 0).map(m => kl(m));
      if (!scarkou.length) return { chyba: 'žádná mise nemá v názvu čárku — kontrola by běžela naprázdno' };
      scarkou.forEach(k => { STAV[k] = Object.assign({}, zapis); });
      const vyvoz = doCsv();
      scarkou.forEach(k => { delete STAV[k]; });
      const puv = window.prompt;
      window.prompt = () => vyvoz;
      const puvAlert = window.alert; window.alert = () => {};
      document.getElementById('b-import').click();
      window.prompt = puv; window.alert = puvAlert;
      const vysledek = {
        mist: scarkou.length,
        zpet: scarkou.map(k => STAV[k] && [STAV[k].dil, STAV[k].strana, STAV[k].id, STAV[k].cv, STAV[k].pozn].join('|')),
        ceka: [zapis.dil, zapis.strana, zapis.id, zapis.cv, zapis.pozn].join('|'),
      };
      /* ukliď po sobě: následující kontrola počítá s JEDNOU hotovou misí,
         a sdílený stav by ji shodil bez souvislosti s tím, co měří */
      scarkou.forEach(k => { delete STAV[k]; });
      uloz(); renderSeznam(); renderStav();
      return vysledek;
    });
    ok('kontrola má na čem běžet (mise s čárkou v názvu)', !kolo.chyba, kolo.chyba);
    if (!kolo.chyba) {
      ok('export → import vrátí u misí s čárkou v názvu TOTÉŽ (' + kolo.mist + ' misí)',
        kolo.zpet.every(z => z === kolo.ceka), 'čekáno ' + kolo.ceka + ', vrátilo ' + JSON.stringify(kolo.zpet));
    }

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
