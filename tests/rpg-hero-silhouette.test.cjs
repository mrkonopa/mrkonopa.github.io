/* ══════════════════════════════════════════════════════════════════════
   Siluety hrdinů se mezi ročníky musí LIŠIT.

   PROČ tenhle test vznikl. Návrh spritů 6.–8. ročníku sdílel jedno tělo
   a měnil jen hlavu, rekvizitu a barvu. Technicky elegantní, jenže
   výsledek Vojta popsal takhle:

       „Postava hrdiny vypadá podle nového designu všude stejně.
        Do teď měla v každé třídě vlastního ducha."

   Měl pravdu a nešlo to poznat z žádného testu — mřížky procházely
   rozměry, paletou i kontrastem. Rozdíl mezi ročníky je hodnota sama
   o sobě a nic ji do téhle chvíle nehlídalo.

   Měří se OBSAZENÉ SOUŘADNICE, ne znaky: rozdíl musí být v obrysu,
   ne v barvě. Dva ročníky s totožným tělem a jinou paletou tady
   propadnou, přesně jak mají.

   Práh 8 % NENÍ přání, je odvozený z měření. Návrh původně navrhoval
   15 %, jenže naměřené hodnoty jsou:

       g6–g7 12,1 %   g6–g8 16,4 %   g6–g9 11,8 %
       g7–g8 17,7 %   g7–g9 12,9 %   g8–g9 19,5 %

   Tři dvojice ze šesti by na 15 % spadly na kresbě, která je v pořádku —
   siluety.png i živá aréna ukazují tři jasně odlišné postavy. Metrika je
   totiž slabá proxy: většinu pixelů tvoří nohy a trup, a ty si člověk
   jako člověk zůstane podobný. Nejtěsnější dvojice je g6–g9 (11,8 %),
   takže práh 8 % má rezervu 3,8 procentního bodu. Rozdíl mezi ročníky
   je v hlavě, ramenou a lemu, ne v tom, že by se lišila kostra.

   Zvedat práh, dokud neprojde, by z testu udělalo dekoraci; snižovat ho
   pod hodnotu, kterou by měla kopie, taky. Kopie těla vyjde kolem 0–3 %
   a test na ní spadne — ověřeno sabotáží.

   Spusť: node tests/rpg-hero-silhouette.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const ROCNIKY = [6, 7, 8, 9];
const PRAH = 8;    // procenta odlišných obsazených pixelů

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

/* Mřížka IDLE0 se čte ze zdrojáku. Načíst modul nejde — potřeboval by
   DOM i jádro; a pro tvar siluety je zdroják dostačující a rychlý. */
function idle0(g) {
  const s = fs.readFileSync(path.join(ROOT, 'projects', `rpg-sprites-${g}.js`), 'utf8');
  const i = s.indexOf('const IDLE0');
  if (i < 0) return null;
  const j = s.indexOf('];', i);
  return (s.slice(i, j).match(/'([^']*)'/g) || []).map(x => x.slice(1, -1));
}

/* Množina obsazených souřadnic — tedy silueta, bez ohledu na barvu. */
function silueta(grid) {
  const out = new Set();
  grid.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] !== '.') out.add(r + ',' + c); });
  return out;
}

function odlisnost(a, b) {
  let rozdil = 0;
  for (const p of a) if (!b.has(p)) rozdil++;
  for (const p of b) if (!a.has(p)) rozdil++;
  return 100 * rozdil / (a.size + b.size);
}

console.log('\n── Siluety hrdinů ──\n');

const S = {};
for (const g of ROCNIKY) {
  const grid = idle0(g);
  ok(!!grid && grid.length > 20, `g${g}: mřížka IDLE0 se načetla (${grid ? grid.length : 0} řádků)`);
  if (grid) S[g] = silueta(grid);
}

/* Kdyby se `idle0` rozbil a vrátil prázdno, všechny dvojice by vyšly
   jako „shodné“ nebo by se dělilo nulou. Tohle to zachytí nahlas. */
for (const g of ROCNIKY) ok(S[g] && S[g].size > 150, `g${g}: silueta má dost pixelů k posouzení (${S[g] ? S[g].size : 0})`);

for (let i = 0; i < ROCNIKY.length; i++)
  for (let j = i + 1; j < ROCNIKY.length; j++) {
    const a = ROCNIKY[i], b = ROCNIKY[j];
    if (!S[a] || !S[b]) continue;
    const d = odlisnost(S[a], S[b]);
    ok(d >= PRAH, `g${a} vs g${b}: siluety se liší aspoň v ${PRAH} %`, `naměřeno ${d.toFixed(1)} %`);
    if (d >= PRAH) console.log(`  · g${a} vs g${b}: ${d.toFixed(1)} % odlišných pixelů`);
  }

console.log(`\n  Siluety hrdinů: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
