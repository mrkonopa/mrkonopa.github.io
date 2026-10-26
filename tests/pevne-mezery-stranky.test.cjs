/* ═════════════════════════════════════════════════════════════════
   Pevná mezera mezi číslem a jednotkou na vzdělávacích stránkách (osm únikovek, Cesta peněz, procenta,
   goniometrie) — `projects/pevne-mezery.js`.

   Přijímačky (`PZ.typo`) a RPG hry (`zapis()`) mají pevnou mezeru u „12 cm“ a „25 %“ od 23. 10. 2026; tyhle stránky
   ne, a text na nich je zadání, které dítě čte na telefonu, kde se „12“ a „cm“ na konci řádku snadno rozdělí.
   Naměřeno 25. 10. 2026 průchodem všech obrazovek (zámky únikovek, scény kapitol, úlohy procent): 349 míst napříč
   11 stránkami (Cesta peněz 119, goniometrie 41, únikovka procenta 64, pythagoras 37, trojúhelníky 35 …).

   Hlídá se TŘI věci:
     • na žádné obrazovce nezůstane „číslo␣jednotka“ s obyčejnou mezerou (mimo SVG, skripty, pole);
     • počet pevných mezer je vysoký (podlaha z měření) — jinak by „0 nálezů“ mohlo znamenat „nic se nevykreslilo“;
     • modul je ve VŠECH 11 stránkách (jedna z osmi chybějící = přesně ten vzorec, který repo už několikrát zažilo),
       a SVG text zůstává beze změny.
   Sabotáže (přepis odpovědi serveru, soubory se nemění): stránka bez modulu; modul bez pozorovatele (opraví jen
   úvodní obrazovku, ne obsah vykreslený později).
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const STRANKY = fs.readdirSync(path.join(ROOT, 'projects'))
  .filter(f => /^(unikovka_[a-z_]+|cesta_penez|procenta_priklady|goniometrie)\.html$/.test(f)).sort();
const RE = { src: '(\\d) (cm|dm|mm|km|kg|dkg|mg|ml|dl|hl|Kč|min|hod|[mglht]|%)(?![\\p{L}\\d])', flags: 'gu' };

function server(prepis) {
  return new Promise(res => {
    const s = http.createServer((q, p) => {
      let u = decodeURIComponent(q.url.split('?')[0]);
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
      p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      const pr = prepis && prepis[path.basename(fp)];
      if (pr) { let t = fs.readFileSync(fp, 'utf8'); if (t.includes(pr[0])) s.prepsano++; return p.end(t.split(pr[0]).join(pr[1])); }
      fs.createReadStream(fp).pipe(p);
    });
    s.prepsano = 0;
    s.listen(0, () => res(s));
  });
}

/* Průchod VŠEMI obrazovkami stránky (v prohlížeči): zámky únikovky + finále, scény kapitol, úlohy procent.
   Vrací počty „obyčejná mezera“ (vada) a „pevná mezera“ (hotovo) a otisky SVG textu. */
async function pruchod([src, flags]) {
  const RX = new RegExp(src, flags), NB = new RegExp(src.replace(') (', ')\u00A0('), flags);
  const out = { obr: 0, vada: [], pevna: 0, tisice: 0, svgVada: 0 };
  const TIS = /(^|[^\d,.])\d{1,3}(?: \d{3})+(?!\d)/g, TIS_NB = /(^|[^\d,.])\d{1,3}(?:\u00A0\d{3})+(?!\d)/g;
  /* pozorovatel běží jako mikroúloha po zápisu do DOM — stejně jako před vykreslením pro oči dítěte; synchronní čtení
     hned po `render()` by ho předběhlo a hlásilo vadu, která tam není */
  const tik = () => new Promise(r => setTimeout(r, 0));
  const sken = async () => {
    await tik();
    out.obr++;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) {
      const sv = n.parentElement && n.parentElement.closest('svg');
      if (n.parentElement && n.parentElement.closest('script,style,textarea')) continue;
      RX.lastIndex = 0; let m;
      if (sv) { while ((m = RX.exec(n.data))) out.svgVada++; continue; }
      while ((m = RX.exec(n.data))) out.vada.push(n.data.slice(Math.max(0, m.index - 10), m.index + 8));
      NB.lastIndex = 0; while (NB.exec(n.data)) out.pevna++;
      while ((m = TIS.exec(n.data))) out.vada.push(n.data.slice(Math.max(0, m.index - 4), m.index + 12));
      TIS_NB.lastIndex = 0; while (TIS_NB.exec(n.data)) out.tisice++;
    }
  };
  const zk = async fn => { try { await fn(); } catch (e) { out.vyjimka = String(e && e.message).slice(0, 80); } };
  await sken();
  if (typeof STEPS !== 'undefined' && typeof render === 'function') {
    await zk(() => { const b = [...document.querySelectorAll('button')].find(x => /Začít|Start|detektiv|Spustit/i.test(x.textContent)); if (b) b.click(); });
    for (let i = 0; i < STEPS.length; i++) await zk(async () => { render(i); document.querySelectorAll('.hint-btn').forEach(x => x.click()); const ch = document.getElementById('ch-btn'); if (ch) { ch.click(); ch.click(); ch.click(); } await sken(); });
    await zk(async () => { finish(); await sken(); });
  } else if (typeof ACTS !== 'undefined' && typeof startAct === 'function') {
    for (const a of ACTS) for (let i = 0; i < a.scenes.length; i++) await zk(async () => {
      startAct(a.id); if (typeof sceneIdx !== 'undefined') sceneIdx = i; else currentSceneIdx = i; renderScene();
      const h = document.getElementById('hint-btn') || document.querySelector('.hint-btn') || document.getElementById('hint-toggle');
      if (h) { h.click(); h.click(); h.click(); } await sken();
    });
  } else if (typeof problems !== 'undefined' && typeof selectDifficulty === 'function') {
    for (const d of ['easy', 'medium', 'hard']) await zk(async () => { selectDifficulty(d); startGame(); for (let i = 0; i < problems.length; i++) { cur = i; hintLevel = 0; renderProblem(); await sken(); } });
  }
  return out;
}

async function meri(browser, base, f) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const pg = await ctx.newPage(), chyby = [];
  pg.on('pageerror', e => chyby.push(String(e.message).slice(0, 80)));
  await pg.goto(base + '/projects/' + f, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15000 });
  const o = await pg.evaluate(pruchod, [RE.src, RE.flags]);
  const modul = await pg.evaluate(() => typeof window.PevneMezery === 'object' && typeof window.PevneMezery.dom === 'function');
  await ctx.close();
  return { o, chyby, modul };
}

(async () => {
  const srv = await server(), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  console.log('\n── Pevná mezera číslo–jednotka na vzdělávacích stránkách ──\n');
  ok(STRANKY.length >= 11, 'nalezeno ' + STRANKY.length + ' stránek (osm únikovek + Cesta peněz + procenta + goniometrie; podlaha 11)');
  let pevna = 0, obr = 0, tisice = 0;
  for (const f of STRANKY) {
    const { o, chyby, modul } = await meri(browser, base, f);
    pevna += o.pevna; obr += o.obr; tisice += o.tisice;
    ok(modul, f + ': modul pevne-mezery.js je načtený');
    ok(o.vada.length === 0 && !o.vyjimka && chyby.length === 0, f + ': ' + o.obr + ' obrazovek, ' + o.pevna + ' pevných mezer (u jednotek), ' + o.tisice + ' v tisících, žádná obyčejná', o.vada.slice(0, 3).map(x => '„' + x + '“').concat(chyby, o.vyjimka || []).join(' | '));
  }
  ok(obr >= 200, 'prošlo se ' + obr + ' obrazovek (podlaha 200)');
  ok(pevna >= 300, 'pevných mezer celkem ' + pevna + ' (podlaha 300; naměřeno 349 míst)');
  ok(tisice >= 100, 'tisícových skupin s pevnou mezerou celkem ' + tisice + ' (podlaha 100; naměřeno 113, z toho 25 míst opravuje modul, zbytek má pevnou mezeru z toLocaleString)');

  /* SVG text se nemění: otisk obyčejných mezer v SVG před i po — modul do SVG nesahá */
  const ctx = await browser.newContext(); const pg = await ctx.newPage();
  await pg.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  await pg.goto(base + '/projects/unikovka_pythagoras.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => window.PevneMezery, null, { timeout: 10000 });
  const svg = await pg.evaluate(() => {
    const d = document.createElement('div'); d.innerHTML = '<svg><text>12 cm</text></svg><p>12 cm a <span>25 %</span> a 12 000 Kč</p><textarea>5 kg</textarea>';
    document.body.appendChild(d);
    return new Promise(r => setTimeout(() => r({ svg: d.querySelector('svg text').textContent, p: d.querySelector('p').textContent, ta: d.querySelector('textarea').value }), 50));
  });
  ok(svg.svg === '12 cm', 'text uvnitř SVG zůstává beze změny');
  ok(svg.p === '12\u00A0cm a 25\u00A0% a 12\u00A0000\u00A0Kč', 'později přidaný obsah (pozorovatel) dostane pevnou mezeru u jednotek i v tisících');
  ok(svg.ta === '5 kg', 'pole textarea se nemění');
  await ctx.close();
  srv.close();

  /* sabotáže: musí se uplatnit a průchod je musí najít */
  const SAB = [
    ['stránka bez modulu', 'unikovka_telesa.html', ['<script src="pevne-mezery.js', '<script data-x="1" src="pevne-mezery-NENI.js']],
    ['modul bez pozorovatele', 'pevne-mezery.js', ['.observe(document.body', '.observe(document.createElement("i")'], 'cesta_penez.html'],
    ['modul bez tisícových skupin', 'pevne-mezery.js', ['.replace(RE_TISICE,', '.replace(/ŽÁDNÁ_SHODA_/,'], 'cesta_penez.html']
  ];
  for (const [popis, soubor, prepis, stranka] of SAB) {
    const s = await server({ [soubor]: prepis }), b = 'http://127.0.0.1:' + s.address().port;
    const f = stranka || soubor;
    const { o } = await meri(browser, b, f);
    ok(s.prepsano > 0, 'sabotáž „' + popis + '“ se aplikovala (přepis uplatněn ' + s.prepsano + '×)');
    ok(o.vada.length > 0, 'sabotáž „' + popis + '“ je chycena (' + o.vada.length + ' obyčejných mezer na ' + f + ')', 'průchod prošel i nad rozbitou stránkou');
    s.close();
  }
  await browser.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
