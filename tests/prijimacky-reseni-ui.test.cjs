/* ══════════════════════════════════════════════════════════════════
   Úlohy „najděte všechna řešení“ v obrazovkách přijímaček: test nanečisto, procvičování, diagnostika.

   Pravidlo bodování (správná − chybná, nejméně 0; body úlohy = počet řešení) hlídá
   `prijimacky-hodnotreseni` nad funkcí; tady se ověřuje, že ho SKUTEČNĚ používají všechny tři
   stránky, a to tak, jak ho vidí žák — zápis „10 a 6“ musí projít (pořadí a spojka nehrají roli),
   jedno ze dvou řešení nesmí být „správně“ ani „špatně“, ale „skoro“ a v testu za 1 b. z 2.

   Každá stránka dostane úlohu s víc řešeními násilím (banka se vylosuje, dokud není ta pravá);
   jinak by se kontrola trefila jen občas. Sabotáže přepisují ODPOVĚĎ serveru (soubory se nemění).
   Spusť: node tests/prijimacky-reseni-ui.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'projects', 'prijimacky-matematika');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise(res => {
    const s = http.createServer((q, p) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
      p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(p);
    });
    s.listen(0, () => res(s));
  });
}

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

/* Jeden průchod všemi třemi stránkami. Vrací seznam nesrovnalostí (prázdný = v pořádku). */
async function projdi(browser, base, prepis) {
  const chyby = [], chyba = m => { if (chyby.length < 8 && !chyby.includes(m)) chyby.push(m); };
  const ctx = await browser.newContext();
  await ctx.route('**/*', async r => {
    const url = r.request().url();
    if (!url.startsWith('http://127.0.0.1')) return r.abort();
    const zmena = prepis && prepis.find(([soubor]) => url.split('?')[0].endsWith('/' + soubor));
    if (!zmena) return r.continue();
    const odp = await r.fetch(); const telo = (await odp.text()).replace(zmena[1], () => zmena[2]);
    return r.fulfill({ response: odp, body: telo });
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => chyba('JS chyba: ' + e.message));
  const hlavni = '/projects/prijimacky-matematika/';

  /* ── A. Test nanečisto: úloha 8 (dvě řešení) a 16 (16.3 dvě řešení) ── */
  await page.goto(base + hlavni + 'test.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.RPG_CERMAT_9 && window.PZ, null, { timeout: 8000 });
  await page.evaluate(() => {
    const G = RPG_CERMAT_9, orig = G.generate;
    G.generate = function () {
      const ts = orig.call(G);
      [[7, 'Útvary ve čtvercové síti'], [15, 'Vybarvování sítě']].forEach(([i, titul]) => { let x = ts[i], g = 0; while (x.title !== titul && g++ < 600) x = G.genSlot(i); ts[i] = x; });
      return ts;
    };
  });
  await page.click('button.pz-btn.primary:has-text("Začít")');
  await page.waitForFunction(() => document.getElementById('cm-play').style.display !== 'none', null, { timeout: 5000 });
  const ui = await page.evaluate(() => {
    const t8 = CM.tasks[7], t16 = CM.tasks[15], vstup = (t, i) => document.getElementById('cm-p-' + t.no + '-' + i);
    return {
      titul: [t8.title, t16.title],
      klavesnice: [vstup(t8, 0).inputMode, vstup(t8, 1).inputMode, vstup(t16, 2).inputMode],
      reseni: [t8.parts[0].reseni, t8.parts[1].reseni, t16.parts[2].reseni]
    };
  });
  if (ui.titul.join() !== 'Útvary ve čtvercové síti,Vybarvování sítě') chyba('test: vynucené úlohy se nevylosovaly (' + ui.titul.join() + ')');
  if (ui.klavesnice.some(k => k !== 'text')) chyba('test: u dvou čísel musí být textová klávesnice (číselná nemá středník ani mezeru): ' + ui.klavesnice.join());
  page.once('dialog', d => d.accept());
  await page.evaluate(() => {
    const t8 = CM.tasks[7], t16 = CM.tasks[15], dej = (t, i, v) => { document.getElementById('cm-p-' + t.no + '-' + i).value = v; };
    dej(t8, 0, t8.parts[0].reseni.slice().reverse().join(' a '));   // obě, obráceně a se spojkou → 2 b.
    dej(t8, 1, t8.parts[1].reseni[0]);                              // jedno ze dvou → 1 b.
    dej(t16, 0, t16.parts[0].ans); dej(t16, 1, t16.parts[1].ans);   // 1 + 1 b.
    dej(t16, 2, t16.parts[2].reseni.join(', ') + ', 99');           // obě a k nim chybné 99 → 1 b.
  });
  await page.click('button.pz-btn.primary:has-text("Odevzdat")');
  await page.waitForFunction(() => document.getElementById('cm-end').style.display !== 'none', null, { timeout: 5000 });
  const rozbor = await page.evaluate(() => [...document.querySelectorAll('#cm-end-detail details.cm-review-item')].map(d => ({
    nadpis: d.querySelector('summary').textContent, telo: d.textContent
  })));
  const radek = no => rozbor.find(r => r.nadpis.startsWith('Úloha ' + no + ' '));
  const r8 = radek(8), r16 = radek(16);
  if (!r8 || !/: 3 \/ 4 b$/.test(r8.nadpis)) chyba('test: úloha 8 (2 b. + 1 b.) má mít 3 / 4 b, je „' + (r8 && r8.nadpis) + '“');
  if (!r16 || !/: 3 \/ 4 b$/.test(r16.nadpis)) chyba('test: úloha 16 (1 + 1 + 1 b.) má mít 3 / 4 b, je „' + (r16 && r16.nadpis) + '“');
  if (r8 && !/Máš 1 z 2 řešení správně, další ještě chybí/.test(r8.telo)) chyba('rozbor 8.2: chybí věta, že je správně jedno ze dvou řešení');
  if (r16 && !/jedno číslo navíc je chybné/.test(r16.telo)) chyba('rozbor 16.3: chybí věta, že je k správným číslům přidané chybné');
  if (r8 && (r8.telo.match(/Tvoje odpověď/g) || []).length !== 1) chyba('rozbor 8: „Tvoje odpověď“ má být jen u části 8.2, ne u 8.1 (obě řešení správně)');

  /* ── B. Procvičování ── */
  await page.goto(base + hlavni + 'procvicovani.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.PZ_TOPICS && window.RPG_CERMAT_9 && window.PZ, null, { timeout: 8000 });
  await page.evaluate(() => {
    const orig = PZ_TOPICS.item;
    PZ_TOPICS.item = function (id) { let it, g = 0; do { it = orig.call(PZ_TOPICS, id, 'test'); } while ((!it || !it.reseni) && g++ < 600); return it; };
  });
  await page.evaluate(() => prStart('geometrie'));
  const it = async () => page.evaluate(() => ({ reseni: PR.item.reseni, ans: PR.item.ans, prompt: PR.item.prompt, mode: document.getElementById('pr-input') && document.getElementById('pr-input').inputMode }));
  const odpovez = async v => { await page.fill('#pr-input', v); await page.press('#pr-input', 'Enter'); await page.waitForFunction(() => PR.answered, null, { timeout: 3000 }); };
  const stav = () => page.evaluate(() => ({ fb: document.getElementById('pr-fb').textContent, cls: document.getElementById('pr-fb').className, ok: PR.ok, total: PR.total }));
  let x = await it();
  if (!x.reseni || x.reseni.length < 2) chyba('procvičování: položka nemá `reseni` (taskToItem ho ztratil)');
  else {
    if (x.mode !== 'text') chyba('procvičování: u dvou čísel textová klávesnice, je „' + x.mode + '“');
    if (!/obě řešení/.test(x.prompt)) chyba('procvičování: zadání neříká „obě řešení“');
    await odpovez(x.reseni[0]);                                       // jedno ze dvou
    let s = await stav();
    if (!/Skoro/.test(s.fb) || !/Správná odpověď: /.test(s.fb) || s.ok !== 0 || s.total !== 1 || !/bad/.test(s.cls)) chyba('procvičování: jedno ze dvou řešení má být „Skoro“, ne správně a ne holé „Špatně“ (' + s.fb.slice(0, 90) + ')');
    await page.click('#pr-next'); x = await it();
    await odpovez(x.reseni.slice().reverse().join(' a '));            // obě, obráceně a se spojkou
    s = await stav();
    if (!/Správně/.test(s.fb) || s.ok !== 1 || s.total !== 2) chyba('procvičování: obě řešení v jiném pořadí se spojkou „a“ mají být správně (' + s.fb.slice(0, 60) + ', ok ' + s.ok + '/' + s.total + ')');
    await page.click('#pr-next'); x = await it();
    await odpovez(x.reseni.join('; ') + '; 99');                        // obě + chybné navíc
    s = await stav();
    if (!/Skoro/.test(s.fb) || !/navíc/.test(s.fb) || s.ok !== 1) chyba('procvičování: obě správná + chybné má být „Skoro, číslo navíc“ (' + s.fb.slice(0, 90) + ')');
    await page.click('#pr-next'); x = await it();
    await odpovez('98; 99');                                             // jen chybná
    s = await stav();
    if (/Skoro/.test(s.fb) || !/Špatně/.test(s.fb)) chyba('procvičování: jen chybná čísla mají být „Špatně“ (' + s.fb.slice(0, 60) + ')');
  }

  /* ── C. Diagnostika: úroveň se počítá z plného zvládnutí (jedno ze dvou řešení = ne) ── */
  await page.goto(base + hlavni + 'diagnostika.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.PZ_TOPICS && window.RPG_CERMAT_9 && window.PZ, null, { timeout: 8000 });
  await page.evaluate(() => {
    const orig = PZ_TOPICS.item;
    PZ_TOPICS.item = function (id, uroven) { if (id !== 'geometrie') return orig.call(PZ_TOPICS, id, uroven); let it, g = 0; do { it = orig.call(PZ_TOPICS, id, 'test'); } while ((!it || !it.reseni) && g++ < 600); return it; };
  });
  await page.click('button.pz-btn.primary:has-text("Začít")');
  await page.waitForFunction(() => document.getElementById('dg-run').style.display !== 'none', null, { timeout: 5000 });
  await page.evaluate(() => { while (DG.k < DG.okruhy.length && DG.okruhy[DG.k].id !== 'geometrie') dgNevim(); });
  const d1 = await page.evaluate(() => ({ k: DG.k, id: DG.okruhy[DG.k] && DG.okruhy[DG.k].id, reseni: DG.it && DG.it.reseni }));
  if (d1.id !== 'geometrie' || !d1.reseni) chyba('diagnostika: geometrie nedostala úlohu s víc řešeními');
  else {
    await page.fill('#dg-input', d1.reseni[0]); await page.press('#dg-input', 'Enter');       // jedno ze dvou → nezvládnuto
    const a = await page.evaluate(k => ({ prvni: DG.vysl[k].prvni }), d1.k);
    if (a.prvni !== false) chyba('diagnostika: jedno ze dvou řešení se počítá jako zvládnuté (prvni=' + a.prvni + ')');
    const d2 = await page.evaluate(() => ({ k: DG.k, reseni: DG.it && DG.it.reseni }));
    if (d2.k !== d1.k || !d2.reseni) chyba('diagnostika: druhá úloha tématu není s víc řešeními');
    else {
      await page.fill('#dg-input', d2.reseni.slice().reverse().join(' a ')); await page.press('#dg-input', 'Enter');   // obě, jinak zapsané → zvládnuto
      const b = await page.evaluate(k => ({ druha: DG.vysl[k].druha }), d1.k);
      if (b.druha !== true) chyba('diagnostika: obě řešení zapsaná „a“ v obráceném pořadí se nepočítají jako správně (druha=' + b.druha + ')');
    }
  }
  await ctx.close();
  return chyby;
}

(async () => {
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC });
  console.log('\n── Úlohy s víc řešeními v testu, procvičování a diagnostice ──\n');
  try {
    const hlavni = await projdi(browser, base, null);
    ok(hlavni.length === 0, 'test, procvičování i diagnostika hodnotí úlohu s víc řešeními podle pravidla CERMAT', hlavni.join(' | '));

    /* Sabotáže: přepíše se odpověď serveru, soubor na disku zůstane. */
    const sab = [
      ['test.html: body za řešení se nepočítají zvlášť', 'test.html',
        'if(p.reseni) earned+=h?Math.min(p.points,h.body):0; else if(ok) earned+=p.points;', 'if(ok) earned+=p.points;'],
      ['test.html: rozbor neříká, co chybí', 'test.html',
        "(it.castecne?' — ◐ '+PZ.esc(PZ.popisCastecne(it.castecne)):'')", "''"],
      ['procvicovani.html: hodnotí se starou kontrolou jednoho výsledku', 'procvicovani.html',
        'const h=PZ.vyhodnot(v, it); correct=h.ok; cast=h.castecne?h:null;', 'correct=PZ.check(v, it.ans); cast=null;'],
      ['procvicovani.html: zpětná vazba nerozliší „skoro“', 'procvicovani.html',
        "const cz0 = cast ? '◐ '+PZ.popisCastecne(cast)+' ' : '';", "const cz0 = '';"],
      ['diagnostika.html: hodnotí se starou kontrolou jednoho výsledku', 'diagnostika.html',
        'dgZapis(PZ.vyhodnot(v,it).ok, v.trim());', 'dgZapis(PZ.check(v,it.ans), v.trim());'],
      ['prijimacky-topics.js: položka ztratí seznam řešení', 'prijimacky-topics.js',
        '...(Array.isArray(p.reseni) ? { reseni: p.reseni.map(String) } : {})', '']
    ];
    for (const [popis, soubor, hledej, nahrad] of sab) {
      const zdroj = fs.readFileSync(path.join(DIR, soubor), 'utf8'), pocet = zdroj.split(hledej).length - 1;
      ok(pocet === 1, 'sabotáž „' + popis + '“ se aplikovala (' + pocet + '× nalezeno)');
      if (pocet !== 1) continue;
      const v = await projdi(browser, base, [[soubor, hledej, nahrad]]);
      ok(v.length > 0, 'sabotáž „' + popis + '“ je chycena (' + (v[0] || '').slice(0, 80) + ')', 'všechny tři stránky prošly i nad rozbitou');
    }
  } finally { await browser.close(); srv.close(); }
  console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
