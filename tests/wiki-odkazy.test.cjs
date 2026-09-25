/* ══════════════════════════════════════════════════════════════════
   Wiki a návod k cloudu nesmí zastarat potichu.

   Wiki se v září 2026 zkrátila na odkazy, protože opsané návody z 25. 7.
   nevěděly o 1. stupni, přijímačkách ani o polovině záložek konzole
   a tabulka SQL fází v RPG-CLOUD-SETUP.md končila fází 12 (existuje 26).
   Odkaz nezastará, ale může umřít. Proto:
   1. každá cesta do repozitáře zmíněná ve wiki (i s N = 3 … 9) existuje;
   2. každá záložka konzole má řádek v mapě záložek (wiki/Teacher-Console.md);
   3. každý SQL soubor fáze je v tabulce pořadí v projects/RPG-CLOUD-SETUP.md.

   Spusť: node tests/wiki-odkazy.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const cti = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

const WIKI = fs.readdirSync(path.join(ROOT, 'wiki')).filter(f => f.endsWith('.md')).map(f => 'wiki/' + f);
const DOKUMENTY = [...WIKI, 'projects/RPG-CLOUD-SETUP.md'];

console.log('── Cesty ve wiki existují ──');
let cest = 0;
for (const f of DOKUMENTY) {
  const text = cti(f);
  const kandidati = new Set();
  for (const m of text.matchAll(/blob\/main\/([^)\s#]+)/g)) kandidati.add(m[1]);
  for (const m of text.matchAll(/`((?:projects|tests|tools|travels|\.github)\/[^`\s<>*]+\.[a-z]{2,4})`/g)) kandidati.add(m[1]);
  // Holé jméno modulu hry (`rpg-shared.js`, `rpg-mat-N.html`) leží v projects/.
  for (const m of text.matchAll(/`(rpg-[\w-]+\.(?:js|html))`/g)) kandidati.add('projects/' + m[1]);
  const chybi = [];
  for (const c of kandidati) {
    // „rpg-mat-N.html" = všech sedm ročníků, ne soubor s písmenem N
    const varianty = /(^|[-/])N[.-]/.test(c) ? [3, 4, 5, 6, 7, 8, 9].map(n => c.replace(/(^|[-/])N([.-])/, `$1${n}$2`)) : [c];
    for (const v of varianty) { cest++; if (!fs.existsSync(path.join(ROOT, decodeURIComponent(v)))) chybi.push(v); }
  }
  ok(chybi.length === 0, `${f}: ${kandidati.size} cest` + (chybi.length ? ` — CHYBÍ: ${chybi.join(', ')}` : ''));
}
ok(cest >= 40, `zkontrolováno ${cest} cest (pojistka proti prázdnému hledání)`);

console.log('── Mapa záložek konzole ──');
const konzole = cti('projects/rpg-ucitel.html');
const zalozky = [...konzole.matchAll(/data-tab="([a-z0-9-]+)"[^>]*>([^<]+)</g)].map(m => [m[1], m[2].trim()]);
const unik = [...new Map(zalozky).entries()];
const mapa = cti('wiki/Teacher-Console.md');
const chybiZal = unik.filter(([, nazev]) => !mapa.includes('| ' + nazev + ' |'));
ok(unik.length >= 10, `konzole má ${unik.length} záložek`);
ok(chybiZal.length === 0, 'každá záložka má řádek ve wiki' + (chybiZal.length ? ' — CHYBÍ: ' + chybiZal.map(z => z[1]).join(', ') : ''));

console.log('── Tabulka SQL fází ──');
const setup = cti('projects/RPG-CLOUD-SETUP.md');
const faze = fs.readdirSync(path.join(ROOT, 'projects')).filter(f => /^rpg-cloud-setup(-phase\w+)?\.sql$/.test(f));
const chybiFaze = faze.filter(f => !setup.includes('(./' + f + ')'));
ok(faze.length >= 26, `v projects/ je ${faze.length} SQL souborů fází`);
ok(chybiFaze.length === 0, 'všechny jsou v tabulce pořadí' + (chybiFaze.length ? ' — CHYBÍ: ' + chybiFaze.join(', ') : ''));
ok(setup.includes('(../rpg-cloud-setup-security.sql)') && fs.existsSync(path.join(ROOT, 'rpg-cloud-setup-security.sql')),
  'bezpečnostní trigger z kořene repa je v tabulce taky');

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
process.exit(fail ? 1 : 0);
