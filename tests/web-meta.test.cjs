/* ═════════════════════════════════════════════════════════════════
   Metadata webu: popis, kanonická adresa, sdílecí karta, sitemap, manifest a ikony „na plochu“.

   Naměřeno 26. 10. 2026 (před opravou): `meta description` mělo 31 z 47 HTML souborů, sdílecí kartu (Open Graph)
   14, kanonickou adresu 0, manifest 0, `apple-touch-icon` 0; `sitemap.xml` neobsahovala 12 z 44 stránek (nejnovější
   zápisek `kosovo-2024`, šest podstránek přijímaček, podmínky a soukromí) a u všech stálo stejné, nepravdivé
   `lastmod` 2026-07-09. Odkazy na hru pošle učitel žákům v aplikaci, takže karta (název, popis, obrázek) je to,
   co dítě uvidí dřív než stránku.

   Hlídá se (čistý Node, jen soubory):
     • každá veřejná stránka (`stranky.cjs` bez `NEVEREJNE`) má popis (20–260 znaků, v celém webu jedinečný),
       kanonickou adresu shodnou s adresou, ze které se obsluhuje, kompletní sdílecí kartu (`og:url` = kanonická,
       obrázek existuje a má 1200 × 630) a odkazy na manifest a `apple-touch-icon`;
     • neveřejné stránky nejsou v sitemapě a nemají kanonickou adresu; zakázané v `robots.txt` nejsou v sitemapě;
     • sitemap = PŘESNĚ množina veřejných stránek, bez duplicit, každá adresa vede na existující soubor;
     • manifest je platný JSON, ikony existují a mají deklarovanou velikost, `start_url` existuje, `display` NENÍ
       `standalone`/`fullscreen` (přihlášení Googlem přesměrovává na jinou doménu a v samostatném okně by dítě
       neměla jak zpátky), `apple-touch-icon` je 180 × 180.
   Sabotáže (v paměti, soubory se nemění): smazaný popis, špatná kanonická adresa, sdílecí karta bez obrázku, chybějící
   stránka v sitemapě, neveřejná stránka v sitemapě, chybějící ikona, `display: standalone`.
   Nová stránka bez popisu nebo mimo sitemapu: `node tools/web-meta.cjs` ji doplní.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const { ROOT, STRANKY, NEVEREJNE } = require('./stranky.cjs');
const ORIGIN = 'https://mrkonopa.github.io';
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
const cti = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const adresa = u => ORIGIN + u.replace(/index\.html$/, '');
const meta = (h, re) => (h.match(re) || [])[1];

function rozmeryPng(f) {
  const b = fs.readFileSync(path.join(ROOT, f));
  if (b.subarray(1, 4).toString('latin1') !== 'PNG') return null;
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
const existuje = f => fs.existsSync(path.join(ROOT, f));

/* ── jedna stránka → seznam výtek ─────────────────────────────────── */
function zkontrolujStranku(url, h) {
  const v = [];
  const popis = meta(h, /<meta[^>]*name="description"[^>]*content="([^"]*)"/);
  if (!popis) v.push('chybí meta description');
  else if (popis.length < 20 || popis.length > 260) v.push('popis má ' + popis.length + ' znaků (20–260)');
  const kan = meta(h, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/);
  if (kan !== adresa(url)) v.push('kanonická adresa „' + kan + '“, má být „' + adresa(url) + '“');
  for (const p of ['type', 'site_name', 'locale', 'url', 'title', 'description', 'image', 'image:width', 'image:height']) {
    if (!new RegExp('property="og:' + p + '"[^>]*content="[^"]+"').test(h)) v.push('chybí og:' + p);
  }
  const ogUrl = meta(h, /property="og:url"[^>]*content="([^"]*)"/);
  if (ogUrl && ogUrl !== kan) v.push('og:url „' + ogUrl + '“ se liší od kanonické');
  const img = meta(h, /property="og:image"[^>]*content="([^"]*)"/);
  if (img) {
    if (!img.startsWith(ORIGIN + '/')) v.push('og:image není absolutní adresa webu');
    else { const f = img.slice(ORIGIN.length + 1); const r = existuje(f) && rozmeryPng(f); if (!r) v.push('og:image ' + f + ' neexistuje nebo není PNG'); else if (r[0] !== 1200 || r[1] !== 630) v.push('og:image má ' + r.join(' × ') + ', má mít 1200 × 630'); }
  }
  if (!/<link[^>]*rel="manifest"[^>]*href="\/manifest\.webmanifest"/.test(h)) v.push('chybí odkaz na manifest');
  if (!/<link[^>]*rel="apple-touch-icon"[^>]*href="\/apple-touch-icon\.png"/.test(h)) v.push('chybí apple-touch-icon');
  return v;
}

/* ── sitemap + robots ─────────────────────────────────────────────── */
function zkontrolujSitemap(xml, robots, verejne, neverejne) {
  const v = [];
  const loc = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const cekane = verejne.map(adresa);
  const dup = loc.filter((x, i) => loc.indexOf(x) !== i);
  if (dup.length) v.push('duplicitní adresy: ' + dup.join(', '));
  const chybi = cekane.filter(x => !loc.includes(x)), navic = loc.filter(x => !cekane.includes(x));
  if (chybi.length) v.push('v sitemapě chybí ' + chybi.length + ': ' + chybi.slice(0, 3).map(x => x.slice(ORIGIN.length)).join(', ') + (chybi.length > 3 ? '…' : ''));
  if (navic.length) v.push('v sitemapě je navíc ' + navic.length + ': ' + navic.slice(0, 3).map(x => x.slice(ORIGIN.length)).join(', '));
  for (const u of neverejne) if (loc.includes(adresa(u))) v.push('neveřejná stránka v sitemapě: ' + u);
  for (const m of robots.matchAll(/^Disallow:\s*(\S+)/gm)) { const x = ORIGIN + m[1]; if (loc.includes(x)) v.push('zakázaná v robots.txt, ale v sitemapě: ' + m[1]); }
  if (!robots.includes('Sitemap: ' + ORIGIN + '/sitemap.xml')) v.push('robots.txt neodkazuje na sitemap.xml');
  return v;
}

/* ── manifest ─────────────────────────────────────────────────────── */
function zkontrolujManifest(txt, existujeSoubor, rozmery) {
  const v = []; let m;
  try { m = JSON.parse(txt); } catch (e) { return ['manifest není platný JSON']; }
  for (const k of ['name', 'short_name', 'start_url', 'scope', 'icons', 'display']) if (!m[k]) v.push('v manifestu chybí „' + k + '“');
  if (/^(standalone|fullscreen|minimal-ui)$/.test(m.display)) v.push('display „' + m.display + '“: přihlášení Googlem by v samostatném okně nemělo cestu zpět (nech „browser“)');
  if (m.start_url) { const f = m.start_url.replace(/^\//, ''); if (!existujeSoubor(/(^|\/)$/.test(f) ? f + 'index.html' : f)) v.push('start_url ' + m.start_url + ' nevede na existující stránku'); }
  for (const i of m.icons || []) {
    const f = String(i.src || '').replace(/^\//, '');
    if (!existujeSoubor(f)) { v.push('ikona ' + i.src + ' neexistuje'); continue; }
    const r = rozmery(f), [w, h] = String(i.sizes || '').split('x').map(Number);
    if (!r || r[0] !== w || r[1] !== h) v.push('ikona ' + i.src + ' má ' + (r ? r.join('x') : '?') + ', manifest tvrdí ' + i.sizes);
  }
  if (!(m.icons || []).some(i => /192/.test(i.sizes)) || !(m.icons || []).some(i => /512/.test(i.sizes))) v.push('chybí ikona 192 nebo 512');
  return v;
}

console.log('\n── Metadata webu ──\n');
const verejne = STRANKY.map(s => s.url).filter(u => !NEVEREJNE[u]), neverejne = Object.keys(NEVEREJNE);
const vady = []; const popisy = new Map();
for (const u of verejne) {
  const h = cti(u); const v = zkontrolujStranku(u, h); v.forEach(x => vady.push(u + ': ' + x));
  const p = meta(h, /<meta[^>]*name="description"[^>]*content="([^"]*)"/); if (p) { if (popisy.has(p)) vady.push(u + ': popis shodný s ' + popisy.get(p)); else popisy.set(p, u); }
}
ok(vady.length === 0, verejne.length + ' veřejných stránek má popis, kanonickou adresu, sdílecí kartu, manifest a ikonu', vady.slice(0, 4).join(' | '));
ok(verejne.length >= 41, 'změřeno ' + verejne.length + ' veřejných stránek (podlaha 41; naměřeno 41)');
const nev = neverejne.filter(u => /rel="canonical"/.test(cti(u)));
ok(nev.length === 0, 'neveřejné stránky (' + neverejne.length + ') nemají kanonickou adresu', nev.join(', '));

const xml = cti('sitemap.xml'), robots = cti('robots.txt');
const vs = zkontrolujSitemap(xml, robots, verejne, neverejne);
ok(vs.length === 0, 'sitemap.xml = přesně veřejné stránky (' + (xml.match(/<loc>/g) || []).length + ' adres), bez duplicit, bez zakázaných', vs.join(' | '));
ok(!/<lastmod>/.test(xml), 'sitemap nemá <lastmod> (hromadné úpravy by u všech stránek lhaly „dnes“; viz tools/web-meta.cjs)');
ok(/Disallow:\s*\/projects\/rpg-ucitel\.html/.test(robots), 'robots.txt zakazuje učitelskou konzoli (sitemap ji tím pádem nesmí nést)');

const mf = cti('manifest.webmanifest');
const vm = zkontrolujManifest(mf, existuje, rozmeryPng);
ok(vm.length === 0, 'manifest.webmanifest: platný JSON, ikony existují a mají deklarovanou velikost, display „browser“', vm.join(' | '));
const at = rozmeryPng('apple-touch-icon.png');
ok(at && at[0] === 180 && at[1] === 180, 'apple-touch-icon.png má 180 × 180 (' + (at ? at.join(' × ') : 'chybí') + ')');

/* ── sabotáže ─────────────────────────────────────────────────────── */
const uk = '/projects/rpg-mat-9.html', hk = cti(uk);
const SAB = [
  ['smazaný popis', () => zkontrolujStranku(uk, hk.replace(/<meta name="description"[^>]*>\s*/, '')), /chybí meta description/],
  ['špatná kanonická adresa', () => zkontrolujStranku(uk, hk.replace(/(rel="canonical" href=")[^"]*/, '$1https://mrkonopa.github.io/jinde.html')), /kanonická adresa/],
  ['sdílecí karta bez obrázku', () => zkontrolujStranku(uk, hk.replace(/<meta property="og:image" [^>]*>\s*/, '')), /chybí og:image/],
  ['og:url jiné než kanonická', () => zkontrolujStranku(uk, hk.replace(/(property="og:url" content=")[^"]*/, '$1https://mrkonopa.github.io/x.html')), /og:url/],
  ['chybí odkaz na manifest', () => zkontrolujStranku(uk, hk.replace(/<link rel="manifest"[^>]*>\s*/, '')), /manifest/],
  ['sitemap bez jedné stránky', () => zkontrolujSitemap(xml.replace(/<url><loc>[^<]*kosovo-2024[^\n]*\n/, ''), robots, verejne, neverejne), /chybí 1/],
  ['učitelská konzole v sitemapě', () => zkontrolujSitemap(xml.replace('</urlset>', '  <url><loc>' + ORIGIN + '/projects/rpg-ucitel.html</loc></url>\n</urlset>'), robots, verejne, neverejne), /neveřejná stránka|zakázaná/],
  ['duplicitní adresa v sitemapě', () => zkontrolujSitemap(xml.replace('</urlset>', '  <url><loc>' + ORIGIN + '/</loc></url>\n</urlset>'), robots, verejne, neverejne), /duplicitní/],
  ['manifest bez ikony 512', () => zkontrolujManifest(mf.replace(/"\/icon-512\.png"/g, '"/neni.png"'), existuje, rozmeryPng), /neexistuje/],
  ['manifest display standalone', () => zkontrolujManifest(mf.replace('"browser"', '"standalone"'), existuje, rozmeryPng), /display/]
];
for (const [popis, fn, vzor] of SAB) {
  const v = fn().join(' | ');
  ok(vzor.test(v), 'sabotáž „' + popis + '“ je chycena (' + (v || 'nic').slice(0, 90) + ')', 'test prošel i nad rozbitým vstupem');
}

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
process.exit(fail ? 1 : 0);
