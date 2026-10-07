/* ══════════════════════════════════════════════════════════════════════
   `window.X` u proměnné, která je ve stránce `let`/`const`, je VŽDY undefined.

   Nejvyšší `let`/`const` v klasickém skriptu na window nejsou (na rozdíl od
   `var` a `function`). Naměřeno 7. 10. 2026 háčkem na waitForFunction: šest
   čekání v testech nikdy nesplnilo podmínku (`window.BT`, `window.ROWS`,
   `window.PR`), jen vypršelo — dřív po 30 s, `rpg-explain` 6× za běh — a testy
   prošly, protože se mezitím stav dočkal sám. `rpg-attack-initial` a
   `rpg-boss-lock` kvůli `window.BT` řadicí minihru nikdy neřešily přes čipy.
   V kódu webu totéž: `rpg-cloud.js` četl `window.S` (učitelské odemčení se do
   běžící hry nedostalo nikdy) a `window.AREAS` (panel Úkoly psal „Mise 3-2“).

   Test vezme všechny `let`/`const` nejvyšší úrovně ze stránek a skriptů webu,
   odečte jména, která na window opravdu jsou (`window.X =`, `var`, `function`),
   a v testech i ve webu hledá ČTENÍ `window.X` takových jmen — jen v kódu,
   ne v komentářích a řetězcích (maska ze skeneru waitForFunction).
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const { maska } = require('./waitforfunction-sken.cjs');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

// Výjimky: soubor + jméno + důvod. Výjimka, která už nic nepokrývá, test shodí (seznam nesmí hnít).
const VYJIMKY = [
  { soubor: 'projects/prijimacky-matematika/prijimacky-gen.js', jmeno: 'cz',
    proc: 'záměrná pojistka `window.cz || (vlastní převod)` — v přijímačkách globální cz není a vlastní převod dělá totéž' },
];

function soubory(dir, pripony, vynech) {
  const out = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f), s = fs.statSync(p);
      if (s.isDirectory()) { if (!vynech.test(f)) walk(p); } else if (pripony.test(f)) out.push(p);
    }
  })(dir);
  return out;
}
// kusy kódu: .js celé, z .html vložené skripty (bez src) s posunem kvůli číslům řádků
function kusy(p) {
  const t = fs.readFileSync(p, 'utf8');
  if (!p.endsWith('.html')) return [{ kod: t, od: 0, cely: t }];
  const out = [], re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(t))) out.push({ kod: m[1], od: m.index + m[0].indexOf('>') + 1, cely: t });
  return out;
}

const web = soubory(path.join(ROOT, 'projects'), /\.(html|js)$/, /^(node_modules|pdfs|\.git)$/);
const lexikalni = new Set(), naWindow = new Set();
for (const p of web) for (const { kod } of kusy(p)) {
  for (const m of kod.matchAll(/^(?:let|const)\s+([A-Za-z_$][\w$]*)\s*=/gm)) lexikalni.add(m[1]);
  for (const m of kod.matchAll(/\b(?:window|globalThis)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) naWindow.add(m[1]);
  for (const m of kod.matchAll(/^(?:var\s+|(?:async\s+)?function\s*\*?\s*)([A-Za-z_$][\w$]*)/gm)) naWindow.add(m[1]);
}
const slepe = new Set([...lexikalni].filter(x => !naWindow.has(x)));
ok(lexikalni.size > 150 && slepe.size > 100, `ve webu ${lexikalni.size} jmen let/const nejvyšší úrovně, z toho ${slepe.size} na window není`);

const testy = soubory(path.join(ROOT, 'tests'), /\.(cjs|js)$/, /^(fixtures|node_modules)$/);
let cteni = 0; const nalezy = [], pouzite = new Set();
for (const p of [...testy, ...web]) {
  const rel = path.relative(ROOT, p).split(path.sep).join('/');
  for (const { kod, od, cely } of kusy(p)) {
    const m = maska(kod);
    for (const x of kod.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)(?!\s*=[^=])/g)) {
      if (!m[x.index]) continue;                                   // komentář, řetězec, text šablony
      cteni++;
      if (!slepe.has(x[1])) continue;
      const v = VYJIMKY.find(v => v.soubor === rel && v.jmeno === x[1]);
      if (v) { pouzite.add(v); continue; }
      const radek = cely.slice(0, od + x.index).split('\n').length;
      nalezy.push(`${rel}:${radek} window.${x[1]}`);
    }
  }
}
ok(cteni > 500, `proměřeno ${cteni} čtení window.X v ${testy.length} testech a ${web.length} souborech webu`);
ok(nalezy.length === 0, 'žádné čtení window.X u let/const' + (nalezy.length ? ' — ' + nalezy.length + '×: ' + nalezy.slice(0, 8).join(' | ') +
  ' → čti přímo (`typeof X !== \'undefined\' && X`), window.X je vždy undefined' : ''));
const nepouzite = VYJIMKY.filter(v => !pouzite.has(v));
ok(nepouzite.length === 0, 'každá výjimka ještě něco pokrývá' + (nepouzite.length ? ' — přebytečné: ' + nepouzite.map(v => v.soubor + ' ' + v.jmeno).join(', ') : ''));

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
