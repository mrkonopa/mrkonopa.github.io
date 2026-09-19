/* ══════════════════════════════════════════════════════════════════════
   JEDINÝ seznam stránek pro plošné audity (přístupnost, mobil,
   přetečení, kontrast).

   Proč to existuje: ten seznam byl ručně udržovaný ve TŘECH kopiích a
   podle CLAUDE.md se ROZEŠEL ČTYŘIKRÁT — pokaždé tak, že v něm chyběl
   celý kus webu (1. stupeň, goniometrie, šest z osmi únikovek, potom
   sedm cestovatelských zápisků pod rozcestníkem). A pokaždé se po
   doplnění hned našly skutečné vady: chybějící `<h1>`, vodorovné
   přetečení, 63 odkazů bez přístupného názvu.

   Čtvrtá kopie (pro kontrast) by ten vzorec jen zopakovala, proto tohle.
   Úplnost hlídá `stranky-uplnost.test.cjs`: každý `.html` v repozitáři
   musí být buď tady, nebo JMENOVITĚ ve výjimkách i s důvodem.

   `id`  — krátký kód; `layout-overflow` podle něj vybírá typ průchodu
   `jmeno` — čitelný popis do hlášek auditů
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const s = (id, jmeno, url) => ({ id, jmeno, url });

const STRANKY = [
  s('home', 'Home', '/index.html'),
  s('404', '404', '/404.html'),
  s('proj', 'Projects index', '/projects/index.html'),

  s('pz-hub', 'Přijímačky', '/projects/prijimacky-matematika/index.html'),
  s('pz-test', 'Přijímačky test', '/projects/prijimacky-matematika/test.html'),
  s('pz-proc', 'Přijímačky procvičování', '/projects/prijimacky-matematika/procvicovani.html'),
  s('pz-diag', 'Přijímačky diagnostika', '/projects/prijimacky-matematika/diagnostika.html'),
  s('pz-stat', 'Přijímačky statistiky', '/projects/prijimacky-matematika/statistiky.html'),
  s('pz-dopl', 'Přijímačky doplňky', '/projects/prijimacky-matematika/doplnky.html'),

  ...['linearni_funkce', 'mocniny', 'procenta', 'pythagoras', 'rovnice', 'statistika', 'telesa', 'trojuhelniky']
    .map(u => s('u-' + u, 'Únikovka ' + u, '/projects/unikovka_' + u + '.html')),

  s('proc', 'Procenta příklady', '/projects/procenta_priklady.html'),
  s('cesta', 'Cesta peněz', '/projects/cesta_penez.html'),
  s('gonio', 'Goniometrie', '/projects/goniometrie.html'),
  s('naroz', 'Narozeniny', '/projects/narozeniny.html'),
  s('papir', 'Papír', '/projects/papir.html'),

  s('hub', 'RPG hub', '/projects/rpg-matematika.html'),
  ...[3, 4, 5, 6, 7, 8, 9].map(g => s('g' + g, 'RPG mat ' + g, '/projects/rpg-mat-' + g + '.html')),
  s('ucitel', 'RPG učitel', '/projects/rpg-ucitel.html'),

  // `ucitel.html` není odkázaná odnikud SCHVÁLNĚ (jsou v ní kódy k
  // únikovkám, Vojta ji dává kolegům adresou). Nelinkovaná ≠ neexistující:
  // z prohlížeče je dostupná úplně stejně, takže do auditů patří.
  s('podminky', 'Podmínky', '/projects/podminky.html'),
  s('soukromi', 'Soukromí', '/projects/soukromi.html'),
  s('ucitel-kody', 'Pro učitele (kódy)', '/projects/ucitel.html'),

  s('travels', 'Travels', '/travels/index.html'),
  ...['ukraine-2017', 'cr-bh-2018', 'romania-2019', 'yugoslavia-2020', 'spain-france-2021', 'italy-2022', 'baltic-2023']
    .map(u => s('t-' + u, 'Travels ' + u, '/travels/' + u + '.html')),
];

/* Soubory, které se ZÁMĚRNĚ neauditují. Důvod je povinný — a neexistující
   výjimka test shodí, aby seznam nehnil (stejný vzor jako `brana-uplnost`). */
const MIMO = [
  ['/googleb60b7ff8648c8780.html', 'ověřovací soubor Google Search Console, žádný obsah'],
  ['/projects/googleb60b7ff8648c8780.html', 'totéž v podsložce'],
  ['/travels/_template.html', 'šablona pro nový zápisek, nenasazuje se'],
  ['/tests/fixtures/cermat-jpz-2027.html', 'testovací fixtura (výřez cizí stránky)'],
  ['/tools/videa-mapovani.html', 'vývojářská pomůcka v tools/, není součástí webu'],
];

/* Všechny .html v repozitáři (bez node_modules a .git), cestou od kořene. */
function vsechnyHtml(dir = ROOT, ven = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) vsechnyHtml(p, ven);
    else if (e.name.endsWith('.html')) ven.push('/' + path.relative(ROOT, p).split(path.sep).join('/'));
  }
  return ven;
}

/* Tvary, které čekají jednotlivé audity. */
const jakoDvojiceId = () => STRANKY.map(p => [p.id, p.url]);        // layout-overflow
const jakoDvojiceJmeno = () => STRANKY.map(p => [p.jmeno, p.url]);  // a11y, mobil, kontrast

module.exports = { ROOT, STRANKY, MIMO, vsechnyHtml, jakoDvojiceId, jakoDvojiceJmeno };
