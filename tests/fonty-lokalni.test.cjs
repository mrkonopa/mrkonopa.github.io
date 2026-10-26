/* ═════════════════════════════════════════════════════════════════
   Písma webu jsou vlastní (`fonts/`), ne z Google Fonts.

   Vizuální revize 26. 10. 2026: 45 souborů HTML (44 stránek + šablona zápisku) načítalo Lexend, Inter, JetBrains Mono, Roboto Mono, VT323 a Archivo
   Black z fonts.googleapis.com. Důsledky: (1) každý návštěvník včetně žáků posílá cizímu serveru svou IP adresu;
   (2) školní filtr může cizí doménu zablokovat — pak se píše záložním písmem a rozvržení je jiné, než jaké se
   ladilo; (3) automatické testy cizí domény blokují, takže DOSUD měřily záložní písmo, ne Lexend, který vidí dítě
   (první měření se skutečným písmem hned našlo stránku, která na 360 px přetéká: nejdelší z osmi odkazových lišt
   únikovek, `unikovka_linearni_funkce`). Soubory teď leží v `fonts/*.woff2` (podmnožiny latin a latin-ext, ta nese
   české ě š č ř ž ů ď ť ň), `fonts/fonts.css` je dává pod stejnými jmény rodin, jaká stránky už používají.

   Hlídá se (čistý Node, bez prohlížeče):
     • žádná stránka ze sdíleného seznamu (`stranky.cjs`) neodkazuje na fonts.googleapis.com ani fonts.gstatic.com;
     • každá stránka, která nějakou z našich šesti rodin používá (v HTML nebo v místně odkázaném CSS), odkazuje
       právě na jeden `fonts/fonts.css` a cesta k němu se z její adresy SKUTEČNĚ vyřeší na existující soubor
       (404 se může zobrazit z libovolné adresy, proto má cestu od kořene);
     • každý `@font-face` míří na existující soubor, který je opravdu woff2 (hlavička `wOF2`);
     • každá rodina má obě podmnožiny a jejich `unicode-range` dohromady pokrývá všechna česká písmena,
       „ “ – — … × ÷ − ² ³ ° € (jinak by se chybějící znak tiše dokreslil záložním písmem);
     • ke každé rodině leží text licence (SIL OFL) v `fonts/licence/`.
   Sabotáže (v paměti, soubory se nemění): odkaz na fonts.css smazaný z jedné stránky, rozbitá cesta, vrácený
   odkaz na Google, chybějící podmnožina latin-ext, vadný soubor písma.
   Že se písmo ve stránce OPRAVDU načte, měří `fonty-nacteni` v prohlížeči.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const { ROOT, STRANKY } = require('./stranky.cjs');
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const RODINY = ['Lexend', 'Inter', 'JetBrains Mono', 'Roboto Mono', 'VT323', 'Archivo Black'];
const LICENCE = { 'Lexend': 'lexend', 'Inter': 'inter', 'JetBrains Mono': 'jetbrains-mono', 'Roboto Mono': 'roboto-mono', 'VT323': 'vt323', 'Archivo Black': 'archivo-black' };
const FONTS_DIR = path.join(ROOT, 'fonts');
const rodinaRe = n => new RegExp("(^|[^A-Za-z])" + n.replace(' ', '[ +]') + "([^A-Za-z]|$)");

const cti = f => fs.readFileSync(f, 'utf8');
/* místně odkázané styly stránky (např. prijimacky.css, motiv.css) — nesou font-family jako sdílené pravidlo */
function mistniCss(html, url) {
  const out = [];
  for (const m of html.matchAll(/<link[^>]+href="([^"#?]+\.css)(?:\?[^"]*)?"/g)) {
    if (/^https?:|fonts\.css$/.test(m[1])) continue;
    const f = m[1].startsWith('/') ? path.join(ROOT, m[1]) : path.join(ROOT, path.dirname(url), m[1]);
    if (fs.existsSync(f)) out.push(cti(f));
  }
  return out.join('\n');
}
/* kam míří odkaz na fonts.css (z adresy stránky), nebo null */
function odkazyFontsCss(html) { return [...html.matchAll(/<link[^>]+href="([^"]*fonts\/fonts\.css)"/g)].map(m => m[1]); }
function vyresit(href, url) { return href.startsWith('/') ? path.join(ROOT, href) : path.join(ROOT, path.dirname(url), href); }

/* kontrola jedné stránky; vrací seznam výtek */
function zkontrolujStranku(s, html, css) {
  const v = [];
  if (/fonts\.(googleapis|gstatic)\.com/.test(html)) v.push('odkaz na Google Fonts');
  const pouziva = RODINY.filter(r => rodinaRe(r).test(html) || rodinaRe(r).test(css));
  const odk = odkazyFontsCss(html);
  if (pouziva.length && odk.length !== 1) v.push('používá ' + pouziva.join(', ') + ', ale odkazů na fonts.css je ' + odk.length);
  for (const h of odk) {
    const f = vyresit(h, s.url);
    if (path.resolve(f) !== path.join(FONTS_DIR, 'fonts.css')) v.push('cesta ' + h + ' nevede na fonts/fonts.css');
    else if (!fs.existsSync(f)) v.push('soubor ' + h + ' neexistuje');
  }
  return v;
}

console.log('\n── Vlastní písma místo Google Fonts ──\n');
let stranek = 0, sPisma = 0; const vady = [];
for (const s of STRANKY) {
  const f = path.join(ROOT, s.url);
  if (!fs.existsSync(f)) { vady.push(s.url + ': soubor chybí'); continue; }
  const html = cti(f);
  const v = zkontrolujStranku(s, html, mistniCss(html, s.url));
  stranek++; if (odkazyFontsCss(html).length) sPisma++;
  v.forEach(x => vady.push(s.url + ': ' + x));
}
ok(vady.length === 0, stranek + ' stránek: bez Google Fonts a s funkčním odkazem na fonts/fonts.css tam, kde písma používají', vady.slice(0, 4).join(' | '));
ok(stranek >= 40 && sPisma >= 40, 'změřeno ' + stranek + ' stránek, z toho ' + sPisma + ' odkazuje na fonts.css (podlaha 40 / 40; naměřeno 44 / 44)');
ok(odkazyFontsCss(cti(path.join(ROOT, '404.html')))[0] === '/fonts/fonts.css', '404.html má cestu od kořene (zobrazuje se z libovolné adresy)');

/* ── fonts.css ─────────────────────────────────────────────────── */
const CSS = cti(path.join(FONTS_DIR, 'fonts.css'));
function bloky(css) {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => {
    const b = m[1], g = re => (b.match(re) || [])[1];
    return { rodina: (g(/font-family:\s*'([^']+)'/) || ''), src: g(/url\('([^']+)'\)/), range: g(/unicode-range:\s*([^;]+);/) || '' };
  });
}
function pokryva(rangeText, cp) {
  return rangeText.split(',').some(r => { const m = r.trim().match(/^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/i); if (!m) return false; const a = parseInt(m[1], 16), b = m[2] ? parseInt(m[2], 16) : a; return cp >= a && cp <= b; });
}
const CESKE = 'ěščřžýáíéúůďťňóĚŠČŘŽÝÁÍÉÚŮĎŤŇÓ„“–—…×÷−²³°€'.split('').map(c => c.codePointAt(0));
function zkontrolujCss(css, adresar) {
  const v = [], B = bloky(css);
  for (const r of RODINY) {
    const mine = B.filter(b => b.rodina === r);
    if (mine.length !== 2) { v.push(r + ': čekám 2 podmnožiny, je jich ' + mine.length); continue; }
    if (!mine.some(b => /latin-ext/.test(b.src)) || !mine.some(b => /-latin-(?!ext)/.test(b.src))) v.push(r + ': chybí latin nebo latin-ext');
    const spolecne = mine.map(b => b.range).join(',');
    const chybi = CESKE.filter(c => !pokryva(spolecne, c));
    if (chybi.length) v.push(r + ': unicode-range nepokrývá ' + chybi.map(c => String.fromCodePoint(c)).join(''));
  }
  for (const b of B) {
    const f = path.join(adresar, b.src || '');
    if (!b.src || !fs.existsSync(f)) { v.push((b.src || '?') + ' neexistuje'); continue; }
    if (fs.readFileSync(f).subarray(0, 4).toString('latin1') !== 'wOF2') v.push(b.src + ' není woff2');
  }
  return v;
}
const vc = zkontrolujCss(CSS, FONTS_DIR);
ok(vc.length === 0, 'fonts.css: šest rodin × dvě podmnožiny, soubory existují a jsou woff2, rozsahy pokrývají češtinu a typografii', vc.slice(0, 4).join(' | '));
const lic = RODINY.filter(r => !fs.existsSync(path.join(FONTS_DIR, 'licence', LICENCE[r] + '-OFL.txt')) || !/SIL OPEN FONT LICENSE/i.test(cti(path.join(FONTS_DIR, 'licence', LICENCE[r] + '-OFL.txt'))));
ok(lic.length === 0, 'ke každé rodině leží text licence SIL OFL v fonts/licence/', lic.join(', '));
const kB = fs.readdirSync(FONTS_DIR).filter(f => f.endsWith('.woff2')).reduce((a, f) => a + fs.statSync(path.join(FONTS_DIR, f)).size, 0) / 1024;
ok(kB > 300 && kB < 700, 'soubory písem: ' + kB.toFixed(0) + ' kB dohromady (naměřeno 377 kB; podlaha 300, strop 700 — žák stahuje jen potřebné podmnožiny)');

/* ── Sabotáže (v paměti) ────────────────────────────────────────── */
const ukazka = STRANKY.find(s => s.url === '/projects/rpg-mat-9.html') || STRANKY[0];
const htmlUk = cti(path.join(ROOT, ukazka.url)), cssUk = mistniCss(htmlUk, ukazka.url);
const SAB = [
  ['odkaz na fonts.css smazaný ze stránky', () => zkontrolujStranku(ukazka, htmlUk.replace(/<link[^>]+fonts\/fonts\.css"[^>]*>\s*/, ''), cssUk), /odkazů na fonts\.css je 0/],
  ['rozbitá cesta k fonts.css', () => zkontrolujStranku(ukazka, htmlUk.replace(/href="([^"]*)fonts\/fonts\.css"/, 'href="$1fonty/fonts.css"'), cssUk), /fonts\.css/],
  ['vrácený odkaz na Google Fonts', () => zkontrolujStranku(ukazka, htmlUk.replace('</head>', '<link href="https://fonts.googleapis.com/css2?family=Lexend" rel="stylesheet"></head>'), cssUk), /Google Fonts/],
  ['chybí podmnožina latin-ext (Lexend)', () => zkontrolujCss(CSS.replace(/@font-face\s*\{[^}]*lexend-latin-ext[^}]*\}\s*/, ''), FONTS_DIR), /Lexend: čekám 2 podmnožiny/],
  ['rozsah latin-ext nepokrývá ě (Inter)', () => zkontrolujCss(CSS.replace(/(inter-latin-ext-wght-normal\.woff2'\) format\('woff2'\);\s*unicode-range:)[^;]*;/, '$1 U+0000-00FF;'), FONTS_DIR), /Inter: unicode-range nepokrývá/],
  ['soubor písma neexistuje', () => zkontrolujCss(CSS.replace('lexend-latin-wght-normal.woff2', 'lexend-latin-NENI.woff2'), FONTS_DIR), /neexistuje/]
];
SAB.forEach(([popis, fn, vzor]) => {
  const v = fn().join(' | ');
  ok(vzor.test(v), 'sabotáž „' + popis + '“ je chycena (' + (v || 'nic').slice(0, 80) + ')', 'test prošel i nad rozbitou verzí');
});

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
process.exit(fail ? 1 : 0);
