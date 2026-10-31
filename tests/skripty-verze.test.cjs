/* ══════════════════════════════════════════════════════════════════════
   HTML a sdílený skript se po nasazení nesmí rozejít v mezipaměti prohlížeče.

   GitHub Pages posílá soubory s `max-age=600`, takže ještě deset minut po nasazení může prohlížeč
   složit NOVOU stránku se STARÝM `rpg-shared.js` (nebo naopak). Hry volají jeho funkce při ťuknutí
   (`ukazDale`, `daleZpet`, `poCase` …): chybějící funkce = ReferenceError uprostřed odpovědi, tedy
   vypnuté ÚTOK a žádné DÁLE — přesně ten „mizející“ ovladač z hodiny s dětmi (8. 10. 2026).
   Odkaz proto nese verzi (`rpg-shared.js?v=…`), kterou je potřeba ZVEDNOUT při každé změně souboru,
   a všech sedm her musí nést tutéž. Kdo sdílený skript změní a verzi nezvedne, nasazení rozjede
   mezipaměť; tenhle test hlídá aspoň to, že verze nechybí a nerozcházejí se mezi hrami.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

console.log('\n── Verze sdíleného skriptu ve hrách ──\n');
const verze = {};
for (const g of [3, 4, 5, 6, 7, 8, 9]) {
  const html = fs.readFileSync(path.join(ROOT, 'projects', `rpg-mat-${g}.html`), 'utf8');
  const m = [...html.matchAll(/<script[^>]*\bsrc="\.\/rpg-shared\.js(\?v=([A-Za-z0-9._-]+))?"/g)];
  ok(`g${g}: načítá rpg-shared.js právě jednou`, m.length === 1, 'nalezeno ' + m.length);
  verze[g] = m[0] && m[0][2];
  ok(`g${g}: odkaz na rpg-shared.js nese verzi (?v=…)`, !!verze[g]);
}
const jedinecne = new Set(Object.values(verze));
ok('všech sedm her nese tutéž verzi (' + [...jedinecne].join(', ') + ')', jedinecne.size === 1);
/* Stejné pravidlo pro moduly kosmetiky: peněženka, rámy, mazlíčci, témata a efekty vítězství jsou ve všech sedmi hrách
   (peněženka i v hubu) a každý odkaz nese verzi. Bez ní by po nasazení mohla deset minut běžet nová stránka se starým modulem
   (např. nová hra, která hlásí mazlíčka v aréně, se starou peněženkou, jež sponku v boji neschová). */
console.log('\n── Verze modulů kosmetiky ──\n');
const MODULY = ['rpg-wallet.js', 'rpg-kosmetika.js', 'rpg-mazlicci.js', 'rpg-temata.js', 'rpg-vitezstvi.js'];
const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const mod of MODULY) {
  const v = {};
  const stranky = [3, 4, 5, 6, 7, 8, 9].map(g => ['g' + g, `rpg-mat-${g}.html`]);
  if (mod === 'rpg-wallet.js') stranky.push(['hub', 'rpg-matematika.html']);
  for (const [jm, soubor] of stranky) {
    const html = fs.readFileSync(path.join(ROOT, 'projects', soubor), 'utf8');
    const m = [...html.matchAll(new RegExp('<script[^>]*\\bsrc="\\./' + esc(mod) + '(\\?v=([A-Za-z0-9._-]+))?"', 'g'))];
    ok(`${jm}: ${mod} je načtený právě jednou a nese verzi`, m.length === 1 && !!m[0][2], 'nalezeno ' + m.length + (m[0] ? ', verze ' + m[0][2] : ''));
    v[jm] = m[0] && m[0][2];
  }
  const jed = new Set(Object.values(v));
  ok(`${mod}: všude tatáž verze (${[...jed].join(', ')})`, jed.size === 1);
}
console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
