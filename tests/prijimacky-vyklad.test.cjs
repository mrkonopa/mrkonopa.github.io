/* prijimacky-vyklad.test.cjs — odkazy z rozboru na výklad a video.
   Čistý Node, auto-discovery v tests/run-ci.cjs.

   Hlavní úkol: hlídat KOPII. prijimacky-topics.js nese id videí opsaná
   z rpg-learn-6/7/8/9.js, protože přijímačkové stránky ty moduly nenačítají
   (~240 KB navíc jen kvůli jednomu odkazu). Kopie se může s originálem
   rozejít a nikde by to nespadlo — proto se porovnává znak po znaku.
   Stejný vzor jako rpg-hero-portraits.js. */

const path = require('path');
const ROOT = path.join(__dirname, '..');       // NIKDY natvrdo /home/user — CI má jinou cestu

global.window = {};
require(path.join(ROOT, 'projects/prijimacky-matematika/prijimacky-topics.js'));
const T = global.window.PZ_TOPICS;
const LEARN = {};
for (const g of [6, 7, 8, 9]) { require(path.join(ROOT, 'projects/rpg-learn-' + g + '.js')); LEARN[g] = global.window['RPG_LEARN_' + g]; }

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

console.log('── Přijímačky: odkaz na výklad ──');

ok(typeof T.vykladProSlot === 'function' && typeof T.vykladUrl === 'function' && typeof T.videoUrl === 'function',
  'PZ_TOPICS vystavuje vykladProSlot / vykladUrl / videoUrl');

// ── posbírej všechny nabízené výklady: 16 pozic testu + 10 okruhů ──
const vyklady = [];
for (let i = 0; i < 16; i++) { const v = T.vykladProSlot(i); if (v) vyklady.push({ kde: 'pozice ' + (i + 1), v }); }
for (const t of T.list) { const v = T.vykladProOkruh(t.id); if (v) vyklady.push({ kde: 'okruh ' + t.id, v }); }

// Pojistka proti auditu, který nic neviděl: všech 16 pozic + 10 okruhů.
ok(vyklady.length === 26, 'zkontrolováno ' + vyklady.length + ' odkazů (čekáno 26 = 16 pozic + 10 okruhů)');

// ── 1) mise musí v příslušném ročníku SKUTEČNĚ existovat ──
const chybi = vyklady.filter(x => !(LEARN[x.v.hra] && LEARN[x.v.hra][x.v.mise]));
ok(chybi.length === 0, 'každý odkaz míří na existující misi výkladu' +
  (chybi.length ? ' — chybí ' + chybi.map(x => x.kde + ' → g' + x.v.hra + '/' + x.v.mise).join(', ') : ''));

// ── 2) KOPIE id videa se nesmí rozejít s originálem ──
const rozesle = [];
for (const x of vyklady) {
  const mise = LEARN[x.v.hra] && LEARN[x.v.hra][x.v.mise];
  if (!mise) continue;
  const orig = mise.video && mise.video.id;
  if (x.v.video !== orig) rozesle.push(x.kde + ': kopie „' + x.v.video + '" ≠ originál „' + orig + '" (g' + x.v.hra + '/' + x.v.mise + ')');
}
ok(rozesle.length === 0, 'id videa se shoduje s rpg-learn' + (rozesle.length ? ' — ' + rozesle.join(' | ') : ''));

// ── 3) tvar id (YouTube má 11 znaků) ──
const spatneId = vyklady.filter(x => x.v.video && !/^[A-Za-z0-9_-]{11}$/.test(x.v.video));
ok(spatneId.length === 0, 'všechna id videí mají platný tvar' + (spatneId.length ? ' — ' + spatneId[0].v.video : ''));

// ── 4) adresa výkladu jde PŘES preview, jinak by přepsala žákův postup ──
const bezPreview = vyklady.filter(x => !/[?&]preview=1(&|$)/.test(T.vykladUrl(x.v)));
ok(bezPreview.length === 0, 'každý odkaz na výklad jde přes ?preview=1 (izolované úložiště)' +
  (bezPreview.length ? ' — ' + bezPreview[0].kde : ''));

// ── 5) relativní cesta z /projects/prijimacky-matematika/ musí vést na ../rpg-mat-N.html ──
const spatnaCesta = vyklady.filter(x => !/^\.\.\/rpg-mat-[6789]\.html\?/.test(T.vykladUrl(x.v)));
ok(spatnaCesta.length === 0, 'cesta ke hře je ../rpg-mat-N.html (soubor je v podsložce projects/)' +
  (spatnaCesta.length ? ' — ' + T.vykladUrl(spatnaCesta[0].v) : ''));

// ── 6) obsluha ?learn= musí v rpg-cloud.js existovat a ověřovat tvar (hodnota jde z adresy) ──
const fs = require('fs');
const cloud = fs.readFileSync(path.join(ROOT, 'projects/rpg-cloud.js'), 'utf8');
ok(/params\.get\('learn'\)/.test(cloud), 'rpg-cloud.js čte parametr learn');
ok(/\/\^\[0-9\]-\[0-9\]\$\/\.test\(learnMid\)/.test(cloud), 'tvar mise z adresy se ověřuje regulárním výrazem');
ok(/if \(preview && learnMid/.test(cloud), 'výklad se otevře JEN v preview režimu (jinak by sáhl na žákův save)');

// ── 7) pozice 16 patří geometrii ──
// Dřív nepatřila ŽÁDNÉMU okruhu, takže se neobjevovala v procvičování ani v diagnostice.
// Změřeno: losuje jen Rámeček, Obraz v rámu a Chodník kolem bazénu — obvod a obsah
// obdélníku s lemem. Kdyby ze slots vypadla, tenhle řádek spadne.
const p16 = T.vykladProSlot(15);
ok(T.topicsForSlot(15).indexOf('geometrie') !== -1, 'pozice 16 patří okruhu geometrie');
ok(p16 !== null && /[Oo]bvod a obsah/.test(p16.nazev), 'pozice 16 dostává odkaz na výklad (' + (p16 ? p16.nazev : 'ŽÁDNÝ') + ')');

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
