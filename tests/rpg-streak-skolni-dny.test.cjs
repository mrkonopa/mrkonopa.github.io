/* ══════════════════════════════════════════════════════════════════════
   Denní série se počítá po ŠKOLNÍCH dnech, ne kalendářních.

   PROČ. Dřív platilo `count = (last === včera) ? count+1 : 1`. Dítě,
   které hrálo v pátek a o víkendu ne, přišlo v pondělí o celou sérii —
   takže sedmidenní série (20 kr/den) i celoživotní meta `streakMax 100`
   fakticky vyžadovaly hrát i o víkendu. U nástroje, který se používá
   ve škole, je to obráceně, než má být.

   Pravidlo: série pokračuje, pokud mezi minulou návštěvou a dneškem
   NEZŮSTAL ŽÁDNÝ ŠKOLNÍ DEN.

   Test bere funkci `_vynechanySkolniDen` PŘÍMO ZE ZDROJE hry (ne opis),
   takže kdyby ji někdo změnil, testuje se ta změna. A ověřuje, že je
   ve všech SEDMI ročnících stejná — bylo by snadné opravit jen jeden.

   Spusť: node tests/rpg-streak-skolni-dny.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

/* Vytáhni funkci ze hry a udělej z ní volatelnou. */
function vytahni(g) {
  const s = fs.readFileSync(path.join(ROOT, `projects/rpg-mat-${g}.html`), 'utf8');
  const i = s.indexOf('function _vynechanySkolniDen');
  if (i < 0) return null;
  const j = s.indexOf('\n}', i);
  const src = s.slice(i, j + 2);
  return { src, fn: new Function(src + '; return _vynechanySkolniDen;')() };
}

const varianty = [3, 4, 5, 6, 7, 8, 9].map(g => ({ g, ...(vytahni(g) || {}) }));
ok(varianty.every(v => v.fn), 'funkce je ve všech sedmi ročnících',
  varianty.filter(v => !v.fn).map(v => 'g' + v.g).join(', '));

/* Všech sedm musí být DOSLOVA stejných — jinak by se opravil jen jeden. */
const prvni = varianty[0] && varianty[0].src;
ok(varianty.every(v => v.src === prvni), 'všech sedm ročníků má stejné znění',
  varianty.filter(v => v.src !== prvni).map(v => 'g' + v.g).join(', '));

const F = varianty[0].fn;

/* Konkrétní data (2026): po 1., út 2., st 3., čt 4., pá 5., so 6., ne 7., po 8. června */
const PRIPADY = [
  // [od, do, má se série ZLOMIT?, popis]
  ['2026-06-04', '2026-06-05', false, 'čtvrtek → pátek (den po dni)'],
  ['2026-06-05', '2026-06-08', false, 'PÁTEK → PONDĚLÍ (víkend mezi tím) — dřív se lámala'],
  ['2026-06-06', '2026-06-08', false, 'sobota → pondělí (mezi jen neděle)'],
  ['2026-06-07', '2026-06-08', false, 'neděle → pondělí'],
  ['2026-06-01', '2026-06-03', true,  'pondělí → středa (vynecháno úterý)'],
  ['2026-06-05', '2026-06-09', true,  'pátek → úterý (vynecháno pondělí)'],
  ['2026-06-05', '2026-06-15', true,  'pátek → pondělí za týden (celý týden pryč)'],
  ['2026-06-08', '2026-06-08', false, 'stejný den'],
];
for (const [od, doo, cekano, popis] of PRIPADY) {
  ok(F(od, doo) === cekano, `${popis}: ${cekano ? 'láme se' : 'drží'}`,
    `vyšlo ${F(od, doo) ? 'láme se' : 'drží'}`);
}

/* Bez minulé návštěvy a na nesmyslném vstupu se série začíná od začátku,
   ne aby se tiše natáhla. */
ok(F('', '2026-06-08') === true, 'prázdné „naposledy" → série začíná od 1');
ok(F('nesmysl', '2026-06-08') === true, 'neplatné datum → série začíná od 1');

/* Celý školní týden bez víkendů musí dát sérii 5 a víkend ji nepřeruší. */
let count = 0, last = '';
for (const d of ['2026-06-01','2026-06-02','2026-06-03','2026-06-04','2026-06-05','2026-06-08','2026-06-09']) {
  count = F(last, d) ? 1 : count + 1;
  last = d;
}
ok(count === 7, 'pět dní + víkend + dva dny = série 7', 'vyšlo ' + count);

console.log(`\n  Série po školních dnech: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
