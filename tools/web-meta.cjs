/* ═════════════════════════════════════════════════════════════════
   Doplní do veřejných stránek, co chybí: popis (`meta description`), kanonickou adresu, sdílecí kartu
   (Open Graph), odkazy na `manifest.webmanifest` a `apple-touch-icon.png`; a přegeneruje `sitemap.xml`.

   Idempotentní: přidává jen to, co ve stránce není, a nic nepřepisuje. Seznam stránek je JEDEN, ze
   `tests/stranky.cjs`; co nemá být veřejné (404, učitelské stránky) je v `NEVEREJNE`. Hlídá to
   `tests/web-meta.test.cjs` — nová stránka bez popisu nebo mimo sitemap shodí bránu, a pak stačí
   pustit `node tools/web-meta.cjs`.

   Použití: node tools/web-meta.cjs            (stránky i sitemap)
            node tools/web-meta.cjs --dry      (jen vypíše, co by změnilo)
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const { STRANKY, NEVEREJNE } = require('../tests/stranky.cjs');
const ROOT = path.join(__dirname, '..');
const ORIGIN = 'https://mrkonopa.github.io';
const DRY = process.argv.includes('--dry');

/* popisy stránek, které žádný nemají (zdroj: popisy v projects/index.html a og:description sourozenců) */
const POPIS = {
  '/projects/goniometrie.html': 'Interaktivní průvodce goniometrickými funkcemi — sin, cos, tan, 7 kapitol včetně slovních úloh, 9. třída.',
  '/projects/narozeniny.html': 'Narozeninový paradox — slider, místnost s lidmi, hledání shod a simulace skupin.',
  '/projects/papir.html': 'Přeložení papíru — vizualizace exponenciálního růstu: přeložení po přeložení na Měsíc.',
  '/projects/rpg-mat-3.html': 'Pixelová matematická RPG pro 3. ročník (Kouzelný les): 7 oblastí, 126 úkolů, trénink a souboje.',
  '/projects/rpg-mat-4.html': 'Pixelová matematická RPG pro 4. ročník (Pirátská plavba): 7 oblastí, 126 úkolů, trénink a souboje.',
  '/projects/rpg-mat-5.html': 'Pixelová matematická RPG pro 5. ročník (Dračí říše): 7 oblastí, 126 úkolů, trénink a souboje.'
};

/* priorita a četnost nových položek sitemapy podle skupiny; existující položky svou hodnotu drží */
function vychozi(url) {
  if (/\/travels\//.test(url)) return ['monthly', '0.5'];
  if (/prijimacky-matematika\/./.test(url)) return ['monthly', '0.6'];
  if (/podminky|soukromi/.test(url)) return ['yearly', '0.3'];
  return ['monthly', '0.6'];
}

const verejne = STRANKY.map(s => s.url).filter(u => !NEVEREJNE[u]);
const adresa = u => ORIGIN + u.replace(/index\.html$/, '');
const esc = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

let zmen = 0;
for (const url of verejne) {
  const f = path.join(ROOT, url);
  let h = fs.readFileSync(f, 'utf8'); const puvodni = h;
  const lang = (h.match(/<html[^>]*\blang="(\w+)"/) || [])[1] || 'cs';
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!title) { console.log('! ' + url + ': bez <title>, přeskočeno'); continue; }
  let popis = (h.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) || [])[1]
    || (h.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) || [])[1]
    || (POPIS[url] ? esc(POPIS[url]) : null);
  if (!popis) { console.log('! ' + url + ': bez popisu a bez záznamu v POPIS'); continue; }

  const vloz = [];
  if (!/<meta[^>]*name="description"/.test(h)) vloz.push('<meta name="description" content="' + popis + '">');
  if (!/rel="canonical"/.test(h)) vloz.push('<link rel="canonical" href="' + adresa(url) + '">');
  const og = (p, v) => { if (!new RegExp('property="og:' + p + '"').test(h)) vloz.push('<meta property="og:' + p + '" content="' + v + '">'); };
  og('type', 'website'); og('site_name', 'Vojtěch Konopa'); og('locale', lang === 'cs' ? 'cs_CZ' : 'en_US');
  og('url', adresa(url)); og('title', title.replace(/&(?!#?\w+;)/g, '&amp;')); og('description', popis);
  og('image', ORIGIN + '/og-default.png'); og('image:width', '1200'); og('image:height', '630');
  if (!/rel="manifest"/.test(h)) vloz.push('<link rel="manifest" href="/manifest.webmanifest">');
  if (!/rel="apple-touch-icon"/.test(h)) vloz.push('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');

  if (vloz.length) {
    /* za odkaz na ikonu (mají ho všechny stránky, hlídá `ikony`); jinak za <title> */
    const kotva = h.match(/<link[^>]*rel="icon"[^>]*>/) || h.match(/<title>[^<]*<\/title>/);
    const odsazeni = (h.slice(0, kotva.index).match(/([ \t]*)$/) || ['', ''])[1];
    h = h.slice(0, kotva.index + kotva[0].length) + '\n' + vloz.map(r => odsazeni + r).join('\n') + h.slice(kotva.index + kotva[0].length);
  }
  if (h !== puvodni) { zmen++; console.log('+ ' + url + ' (' + (h.match(/\n/g).length - puvodni.match(/\n/g).length) + ' řádků)'); if (!DRY) fs.writeFileSync(f, h); }
}

/* ── sitemap.xml ───────────────────────────────────────────────────
   Bez <lastmod>: skoro každá úprava je hromadná (písma, ikony, metadata), takže datum poslední změny souboru
   v gitu by u všech stránek říkalo „dnes“ — a nepravdivé datum je horší než žádné. Dřív tu u všech stálo 2026-07-09. */
const staraSm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const stare = {}; for (const m of staraSm.matchAll(/<url><loc>([^<]+)<\/loc>.*?<changefreq>([^<]+)<\/changefreq><priority>([^<]+)<\/priority><\/url>/g)) stare[m[1]] = [m[2], m[3]];
const radky = verejne.map(u => {
  const loc = adresa(u), [cf, pr] = stare[loc] || vychozi(u);
  return '  <url><loc>' + loc + '</loc><changefreq>' + cf + '</changefreq><priority>' + pr + '</priority></url>';
});
/* adresa /projects/ (složka) je v sitemapě od začátku a stránka je projects/index.html — pořadí drží starý soubor */
const poradi = Object.keys(stare); radky.sort((a, b) => { const la = a.match(/<loc>([^<]+)/)[1], lb = b.match(/<loc>([^<]+)/)[1]; const ia = poradi.indexOf(la), ib = poradi.indexOf(lb); return (ia < 0 ? 1e6 : ia) - (ib < 0 ? 1e6 : ib) || la.localeCompare(lb); });
const novaSm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + radky.join('\n') + '\n</urlset>\n';
if (novaSm !== staraSm) { console.log('+ sitemap.xml: ' + radky.length + ' adres (bylo ' + Object.keys(stare).length + ')'); if (!DRY) fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), novaSm); }
console.log((DRY ? '[dry] ' : '') + 'stránek změněno: ' + zmen + ', veřejných celkem: ' + verejne.length);
