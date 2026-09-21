/* ══════════════════════════════════════════════════════════════════════
   Mapy tras v cestovatelských zápiscích.

   PROČ VZNIKL: mapy byly sedm ručně kreslených kopií a rozešly se úplně
   ve všem. Naměřeno před přepisem (vykreslený text přepočtený do jednotek
   viewBoxu, okno 1280 i 380 px):

     italy-2022     2 překryvy popisků, „FERRY GNV" přes 53 px
     spain-france   „La Barranca" MIMO plátno
     romania-2019   překryv jen na 380 px
     baltic-2023    8 popisků ZAKRYTÝCH TRASOU (POLAND, LATVIA, …)

   Ten poslední případ je důvod, proč tenhle test měří dvě různé věci.
   Dosavadní kontroly hlídaly text proti textu — a popisek, přes který
   vede žlutá čára trasy, jim proto celou dobu procházel.

   🔴 POZOR NA MĚŘIDLO: za trasu se smí počítat jen DLOUHÁ lomená čára.
   Legenda má taky `<line>` a `<polyline>`; když se počítaly, hlásilo
   měřidlo jako zakryté i popisky, které jsou nad trasou — falešný
   poplach na vlastním nářadí, ne na produktu.

   Spusť: node tests/travels-mapy.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

/* Seznam zápisků se bere ze sdíleného `stranky.cjs` — ruční kopie seznamu
   se v tomhle repozitáři rozešla čtyřikrát. */
const ZAPISKY = require('./stranky.cjs').STRANKY
  .filter(p => p.id.startsWith('t-')).map(p => p.id.slice(2));

/* Zápisky, které ještě běží na staré vložené mapě. Výjimka musí mířit na
   existující zápisek, jinak test spadne — ať seznam nehnije. */
const STARA_MAPA = {
  'ukraine-2017': 'jen úsečky mezi zastávkami, čeká na GPX záznam',
  'cr-bh-2018': 'jen úsečky mezi zastávkami, čeká na GPX záznam',
  'yugoslavia-2020': 'jen úsečky mezi zastávkami, čeká na GPX záznam',
};

/* Rumunsko NENÍ mapa, ale VÝŠKOVÝ PROFIL hřebenovky (osa 1000–2500 m,
   Negoiu 2535, Moldoveanu 2544, značky dnů) — na geografickou mapu se
   převádět nemá. Kontroly POPISKŮ na něj ale PLATÍ v plné síle: jeho vady
   („Avrig" mimo plátno, překryv jmen s výškami, písmo 2,6 px na mobilu) se
   opravily na místě a nesmí se tiše vrátit. Přeskakují se jen kontroly
   „je to převedená mapa" (sdílený modul, hustota trasy). */
const PROFIL = {
  'romania-2019': 'výškový profil hřebenovky, ne mapa trasy',
};

/* Naměřeno: popisky vycházejí na 9–15 skutečných px podle šířky okna.
   Podlaha 8 px chytá zdrsnělé zmenšení, ne běžné kolísání. */
const PISMO_MIN = 8;

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { c ? pass++ : (fail++, console.log('  ❌ ' + m + (d ? ' — ' + d : ''))); };

function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const f = path.normalize(path.join(ROOT, u));
      if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(0, () => res(s));
  });
}

const ZMER = () => {
  const svg = document.querySelector('.route-svg-wrap svg');
  if (!svg) return { chyba: 'na stránce není mapa' };
  const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect();
  if (!r.width) return { chyba: 'mapa má nulovou šířku' };
  const k = vb.width / r.width;
  const doVb = b => ({ x: (b.left - r.left) * k + vb.x, y: (b.top - r.top) * k + vb.y, w: b.width * k, h: b.height * k });

  const uzly = [...svg.querySelectorAll('text')].filter(t => (t.textContent || '').trim());
  const texty = uzly.map(t => ({
    t: t.textContent.trim(), ...doVb(t.getBoundingClientRect()),
    px: parseFloat(getComputedStyle(t).fontSize) / k,
  })).filter(x => x.w > 0 && x.h > 0);

  /* jen dlouhá lomená čára = trasa; krátké jsou legenda */
  const trasy = [...svg.querySelectorAll('polyline')]
    .filter(p => (p.getAttribute('points') || '').trim().split(/\s+/).length > 20);
  const body = [];
  trasy.forEach(p => (p.getAttribute('points') || '').trim().split(/\s+/)
    .forEach(q => { const [x, y] = q.split(',').map(Number); if (!isNaN(x)) body.push([x, y]); }));

  const zakryte = texty.filter((t, i) => {
    const el = uzly[i];
    const nad = trasy.every(l => l.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
    return !nad && body.some(([x, y]) => x > t.x && x < t.x + t.w && y > t.y && y < t.y + t.h);
  }).map(t => t.t);

  const prekryv = [];
  for (let i = 0; i < texty.length; i++) for (let j = i + 1; j < texty.length; j++) {
    const a = texty[i], b = texty[j];
    const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (dx > 0.5 && dy > 0.5) prekryv.push(`„${a.t}" × „${b.t}"`);
  }
  const ven = texty.filter(x => x.x < vb.x - 0.5 || x.y < vb.y - 0.5 ||
    x.x + x.w > vb.x + vb.width + 0.5 || x.y + x.h > vb.y + vb.height + 0.5).map(x => x.t);

  return {
    textu: texty.length, prekryv, zakryte, ven,
    nejmensiPismo: Math.round(Math.min(...texty.map(x => x.px)) * 10) / 10,
    bodyTrasy: body.length,
    pomer: Math.round((vb.height / vb.width) * 100) / 100,
  };
};

(async () => {
  console.log('\n── Mapy tras ──\n');
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  let promereno = 0;
  try {
    for (const zla of [...Object.keys(STARA_MAPA), ...Object.keys(PROFIL)]) {
      ok(ZAPISKY.includes(zla), `výjimka „${zla}" míří na existující zápisek`,
        STARA_MAPA[zla] || PROFIL[zla]);
    }

    for (const sirka of [1280, 380]) {
      for (const z of ZAPISKY) {
        const ctx = await browser.newContext({ viewport: { width: sirka, height: 900 } });
        await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
        const page = await ctx.newPage();
        const chyby = [];
        page.on('pageerror', e => chyby.push(e.message));
        await page.goto(`${base}/travels/${z}.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);
        const r = await page.evaluate(ZMER);
        const popis = `${z} @${sirka}`;
        if (r.chyba) { ok(false, `${popis}: ${r.chyba}`); await ctx.close(); continue; }
        promereno++;
        ok(chyby.length === 0, `${popis}: bez JS chyby`, chyby[0] || '');

        if (STARA_MAPA[z]) {
          /* Ještě nepřevedená mapa. Kontroly se na ni NEPOUŠTĚJÍ, jinak by
             brána byla trvale červená kvůli stavu, o kterém víme — ale
             naměřené vady se VYPISUJÍ, ať nezmizí z očí. Jakmile zápisek
             z výjimky zmizí, kontroly na něj dopadnou v plné síle. */
          const vady = [];
          if (r.prekryv.length) vady.push(`překryv ${r.prekryv.length}× (${r.prekryv[0]})`);
          if (r.zakryte.length) vady.push(`zakryto trasou ${r.zakryte.length}× (${r.zakryte.slice(0, 2).join(', ')})`);
          if (r.ven.length) vady.push(`mimo plátno: ${r.ven.join(', ')}`);
          if (r.nejmensiPismo < PISMO_MIN) vady.push(`písmo ${r.nejmensiPismo} px`);
          console.log(`  ℹ️  ${popis} — stará mapa: ${vady.length ? vady.join(' · ') : 'bez nálezu'}`);
          await ctx.close();
          continue;
        }

        ok(r.prekryv.length === 0, `${popis}: žádné dva popisky se nepřekrývají`, r.prekryv.slice(0, 3).join('; '));
        ok(r.zakryte.length === 0, `${popis}: žádný popisek není zakrytý trasou`, r.zakryte.slice(0, 4).join(', '));
        ok(r.ven.length === 0, `${popis}: žádný popisek netrčí mimo plátno`, r.ven.slice(0, 3).join(', '));
        ok(r.nejmensiPismo >= PISMO_MIN, `${popis}: nejmenší písmo ≥ ${PISMO_MIN} px`, `naměřeno ${r.nejmensiPismo}`);

        /* Převedené zápisky navíc: trasa musí být skutečný záznam, ne
           pár úseček mezi body, a poměr stran nesmí být zploštělý.
           Výškový profil tyhle tři kontroly míjí — kreslí se vlastním
           vloženým SVG a jeho „trasa" je stoupání, ne cesta po mapě. */
        if (sirka === 1280 && !PROFIL[z]) {
          ok(r.bodyTrasy > 100, `${z}: trasa je záznam, ne úsečky (${r.bodyTrasy} bodů)`);
          const html = fs.readFileSync(path.join(ROOT, 'travels', z + '.html'), 'utf8');
          ok(!/<div class="route-svg-wrap">\s*<svg/.test(html),
            `${z}: mapa se kreslí modulem, ne vloženým SVG`);
          ok(html.includes('./mapa.js') && html.includes('./mapa.css'),
            `${z}: stránka načítá sdílený vykreslovač i styl`);
        }
        await ctx.close();
      }
    }
    ok(promereno === ZAPISKY.length * 2, `proměřeno všech ${ZAPISKY.length} zápisků na obou šířkách`, 'proměřeno ' + promereno);
  } finally { await browser.close(); srv.close(); }

  console.log(`\n  Mapy tras: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
