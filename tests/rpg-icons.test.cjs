/* ══════════════════════════════════════════════════════════════════════
   Pojistka na pixelovou sadu ikon (projects/rpg-icons.js).

   Sada má přes 70 ručně kreslených mřížek a odkazuje se na ni sedm her.
   Při jejím stavění jsem opakovaně narazil na vady, které se nijak
   neprojeví — hra se načte, nespadne, jen ikona chybí nebo vypadá jako
   něco jiného:

     • odkaz na jméno, které v sadě není  → RPGIcons.svg() vrátí prázdno
       a na mapě je díra (přesně tak zmizely galaxy/orb, když jsem je
       z sady vyhodil)
     • dvě ikony se stejnou kresbou       → zlomky vyšly jako hodiny,
       calc jako brain; matematicky v pořádku, pro žáka k nerozeznání
     • řádek jiné délky než 12            → mřížka se rozjede

   Čistý Node, běží zlomek sekundy. Auto-discovery v tests/run-ci.cjs.
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const PROJ = path.join(__dirname, '..', 'projects');
global.window = global;
require(path.join(PROJ, 'rpg-icons.js'));
const IC = global.window.RPGIcons;

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

console.log('\n── Pixelová sada ikon ──\n');

ok(IC && typeof IC.svg === 'function', 'RPGIcons.svg existuje');
const jmena = IC.names();
ok(jmena.length >= 60, 'sada má aspoň 60 ikon (' + jmena.length + ')');

/* ── 1. tvar mřížky ─────────────────────────────────────────────────── */
{
  // Tvar se MUSÍ číst ze zdroje, ne z vykresleného SVG. Řádek ze samých
  // teček nevykreslí žádný obdélník, takže přes SVG se delší řádek nemá
  // jak projevit — první verze tohohle testu ho přehlédla.
  const zdroj = fs.readFileSync(path.join(PROJ, 'rpg-icons.js'), 'utf8');
  const spatne = [];
  let videno = 0;
  for (const m of zdroj.matchAll(/^\s{4}([a-z][a-z0-9-]*|'[^']+'):\s*\[([\s\S]*?)\],\s*$/gm)) {
    const jmeno = m[1].replace(/'/g, '');
    const radky = [...m[2].matchAll(/'([.#]*)'/g)].map(r => r[1]);
    videno++;
    if (radky.length !== 12) { spatne.push(jmeno + ': ' + radky.length + ' řádků'); continue; }
    const zle = radky.filter(r => r.length !== 12).length;
    if (zle) spatne.push(jmeno + ': ' + zle + ' řádků jiné délky než 12');
  }
  // Kdyby se změnil zápis sady, regulární výraz by nenašel nic a kontrola
  // by tiše prošla naprázdno — proto se počítá, kolik mřížek se přečetlo.
  ok(videno === jmena.length,
    'ze zdroje se přečetly všechny mřížky (' + videno + ' z ' + jmena.length + ')');
  ok(spatne.length === 0, 'každá ikona je přesně 12 řádků po 12 znacích',
    spatne.slice(0, 4).join(' | '));
  const svgSpatne = jmena.filter(n => !/viewBox="0 0 12 12"/.test(IC.svg(n, 24)));
  ok(svgSpatne.length === 0, 'vykreslené SVG má viewBox 12×12', svgSpatne.join(', '));
}

/* ── 2. každá ikona něco nakreslí ───────────────────────────────────── */
{
  const prazdne = jmena.filter(n => !/<rect/.test(IC.svg(n, 24)));
  ok(prazdne.length === 0, 'žádná ikona není prázdná', prazdne.join(', '));
}

/* ── 3. žádné dvě ikony nevypadají stejně ───────────────────────────── */
{
  const podle = new Map();
  for (const n of jmena) {
    const k = IC.svg(n, 24).replace(/^<svg[^>]*>/, '');
    if (!podle.has(k)) podle.set(k, []);
    podle.get(k).push(n);
  }
  const dvojice = [...podle.values()].filter(v => v.length > 1).map(v => v.join(' = '));
  ok(dvojice.length === 0, 'žádné dvě ikony nemají shodnou kresbu', dvojice.join(' | '));
}

/* ── 4. neznámé jméno vrací prázdno, ne rozbité SVG ─────────────────── */
{
  ok(IC.svg('rozhodne-neexistuje', 24) === '', 'neznámé jméno vrátí prázdný řetězec');
  ok(IC.has('bolt') === true && IC.has('nic-takoveho') === false, 'has() rozlišuje známé a neznámé');
  let spadlo = false;
  try { IC.svg(null); IC.svg(undefined); IC.svg(''); } catch (e) { spadlo = true; }
  ok(!spadlo, 'svg() nespadne na null/undefined/prázdném jménu');
}

/* ── 5. hry se odkazují jen na ikony, které v sadě jsou ─────────────── */
{
  // Tohle je jádro testu: kdyby se ikona přejmenovala nebo vyhodila,
  // hra se načte bez chyby a jen v ní bude díra. Sesbíráme všechna
  // jména, která hry používají v datech (oblasti, artefakty, odznaky,
  // atributy) i ve značkách `data-ic`, a ověříme, že existují.
  const chybi = [], nalezeno = {};
  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const f = path.join(PROJ, 'rpg-mat-' + g + '.html');
    if (!fs.existsSync(f)) { chybi.push('g' + g + ': soubor chybí'); continue; }
    const s = fs.readFileSync(f, 'utf8');
    const uzita = new Set();
    for (const m of s.matchAll(/\bicon:\s*'([a-z][a-z0-9-]*)'/g)) uzita.add(m[1]);
    for (const m of s.matchAll(/\bic:\s*'([a-z][a-z0-9-]*)'/g)) uzita.add(m[1]);
    for (const m of s.matchAll(/data-ic="([a-z][a-z0-9-]*)"/g)) uzita.add(m[1]);
    for (const m of s.matchAll(/RPGIcons\.svg\('([a-z][a-z0-9-]*)'/g)) uzita.add(m[1]);
    nalezeno['g' + g] = uzita.size;
    for (const n of uzita) if (!IC.has(n)) chybi.push('g' + g + ' → ' + n);
  }
  // Pojistka proti prázdnému běhu: kdyby se změnil tvar dat, regulární
  // výrazy by nenašly nic a test by tiše prošel naprázdno.
  const celkem = Object.values(nalezeno).reduce((a, b) => a + b, 0);
  ok(celkem >= 7 * 15, 'nasbírána jména ikon ze všech her (' + celkem + ')',
    JSON.stringify(nalezeno));
  ok(chybi.length === 0, 'hry se odkazují jen na ikony, které v sadě existují',
    chybi.slice(0, 6).join(' | '));
}

/* ── 6. velikost musí být násobkem 12, jinak se pixely rozmažou ─────── */
{
  // 14 px na mřížce 12 nevychází na celý pixel a prohlížeč začne
  // interpolovat — smysl pixel-artu je pryč. Hlídáme to v kódu her.
  const spatne = [];
  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const f = path.join(PROJ, 'rpg-mat-' + g + '.html');
    if (!fs.existsSync(f)) continue;
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/RPGIcons\.svg\([^,)]+,\s*(\d+)\s*\)/g)) {
      const v = +m[1];
      if (v % 12 !== 0) spatne.push('g' + g + ': ' + v + ' px');
    }
  }
  ok(spatne.length === 0, 'velikosti ikon jsou násobkem 12 (celé pixely)',
    [...new Set(spatne)].slice(0, 6).join(' | '));
}

console.log(`\n  Sada ikon: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
