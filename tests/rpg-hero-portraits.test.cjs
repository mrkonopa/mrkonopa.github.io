/* ══════════════════════════════════════════════════════════════════════
   Portréty hrdinů na kartách hubu (fáze 01a).

   Modul `projects/rpg-hero-portraits.js` skládá postavu ze sdíleného těla,
   pokrývky hlavy podle ročníku a předmětu v ruce. Sedm ročníků tedy není
   sedm kreseb — mění se jen pár řádků a paleta.

   Co se hlídá a proč:

   • KAŽDÝ znak mřížky musí být v paletě. Chybějící znak se vykreslí
     magentou #f0f — to je záměrný signál chyby (stejně jako ve sprite
     enginech her), ne dekorace. Bez téhle kontroly by se překlep v mřížce
     projevil až růžovým čtverečkem na kartě.

   • Sedm ročníků musí mít sedm RŮZNÝCH hlavic. Kdyby se při rozšiřování
     omylem zkopírovala jedna, karty by vypadaly stejně a nikdo by si toho
     nemusel všimnout — mřížky se očima neporovnávají.

   • `paint()` nesmí spadnout na canvasu nula×nula ani na nesmyslech.

   • A hlavně: `paint()` musí SKUTEČNĚ KRESLIT. Počítají se reálná volání
     `fillRect`, ne odvozená konstanta — přesně kvůli tomu, na co doplatil
     `sprite-magenta.audit.cjs`, který hlásil „336 snímků" spočítaných ze
     vzorce a vypsal by je i při nulovém kreslení.

   Spusť: node tests/rpg-hero-portraits.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const path = require('path');

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

global.window = global;
require(path.join(__dirname, '..', 'projects', 'rpg-hero-portraits.js'));
const P = global.window.RPGHeroPortrait;

console.log('\n── Portréty hrdinů ──\n');

/* Minimální náhrada canvasu: zaznamenává, co se doopravdy kreslilo. */
function fakeCanvas(w, h) {
  const zapis = { fillRect: 0, barvy: [], ellipse: 0, clear: 0, smoothing: null };
  const ctx = {
    set imageSmoothingEnabled(v) { zapis.smoothing = v; },
    get imageSmoothingEnabled() { return zapis.smoothing; },
    set fillStyle(v) { zapis._fs = v; },
    get fillStyle() { return zapis._fs; },
    globalAlpha: 1,
    clearRect() { zapis.clear++; },
    fillRect() { zapis.fillRect++; zapis.barvy.push(zapis._fs); },
    beginPath() {}, ellipse() { zapis.ellipse++; }, fill() {},
  };
  return { cv: { width: w, height: h, getContext: () => ctx }, zapis };
}

/* ── 1. modul je celý ────────────────────────────────────────────────── */
ok(!!P, 'modul se načetl (window.RPGHeroPortrait)');
ok(typeof P.paint === 'function' && typeof P.grid === 'function'
   && typeof P.palette === 'function', 'vystavuje grid/palette/paint');
const KLICE = P.keys();
ok(KLICE.length === 7, `sedm ročníků (${KLICE.join(', ')})`);

/* ── 2. žádná magenta: každý znak mřížky je v paletě ─────────────────── */
for (const k of KLICE) {
  const g = P.grid(k), pal = P.palette(k);
  const chybi = P.missingChars(g, pal);
  ok(chybi.length === 0, `${k}: každý znak mřížky je v paletě`, chybi.join(','));
  ok(g.length > 20, `${k}: mřížka má rozumnou výšku (${g.length})`);
  const sirky = [...new Set(g.map(r => r.length))];
  ok(sirky.length === 1, `${k}: všechny řádky stejně široké (${sirky.join('/')})`);
}
{
  // Silueta bosse se kreslí toutéž rutinou, takže musí projít taky.
  const chybi = P.missingChars(P.BOSS, P.palette('g9'));
  ok(chybi.length === 0, 'BOSS: každý znak je v paletě', chybi.join(','));
  const sirky = [...new Set(P.BOSS.map(r => r.length))];
  ok(sirky.length === 1, `BOSS: všechny řádky stejně široké (${sirky.join('/')})`);
}
{
  // Avatar v profilu není vázaný na svět — grid() na neznámý klíč musí
  // vrátit zlatou variantu, ne spadnout.
  const g = P.grid('avatar-neexistuje'), pal = P.palette('avatar-neexistuje');
  ok(g && g.length > 20, 'neznámý klíč vrátí avatarovou mřížku, nespadne');
  ok(P.missingChars(g, pal).length === 0, 'avatar: každý znak je v paletě');
}

/* ── 3. sedm ročníků = sedm různých postav ───────────────────────────── */
{
  const hlavy = KLICE.map(k => P.grid(k).slice(0, 3).join('|'));
  ok(new Set(hlavy).size === 7, 'každý ročník má JINOU pokrývku hlavy',
    `různých: ${new Set(hlavy).size} ze 7`);

  const celé = KLICE.map(k => P.grid(k).join('|'));
  ok(new Set(celé).size === 7, 'každý ročník má jinou mřížku celkem');

  const akcenty = KLICE.map(k => P.palette(k).A);
  ok(new Set(akcenty).size === 7, 'každý ročník má jinou akcentovou barvu',
    akcenty.join(' '));
}

/* ── 4. paint() nespadne na nesmyslech ───────────────────────────────── */
{
  let spadlo = null;
  try {
    const { cv } = fakeCanvas(0, 0);
    P.paint(cv, P.grid('g9'), P.palette('g9'));
    P.paint(null, P.grid('g9'), P.palette('g9'));
    P.paint(fakeCanvas(60, 90).cv, [], P.palette('g9'));
    P.paint(fakeCanvas(60, 90).cv, null, P.palette('g9'));
    P.paint({}, P.grid('g9'), P.palette('g9'));
  } catch (e) { spadlo = e.message; }
  ok(!spadlo, 'paint() nespadne na canvasu 0×0, prázdné mřížce ani na null', spadlo || '');
}

/* ── 5. paint() SKUTEČNĚ kreslí (naměřeno, ne odvozeno) ──────────────── */
{
  const { cv, zapis } = fakeCanvas(60, 90);
  P.paint(cv, P.grid('g9'), P.palette('g9'));
  // Mřížka má stovky neprůhledných znaků; kdyby se nevykreslil ani jeden,
  // všechny kontroly výš by prošly a portrét by přesto zůstal prázdný.
  ok(zapis.fillRect > 200, `vykreslí stovky pixelů (${zapis.fillRect})`);
  ok(zapis.smoothing === false, 'vypne vyhlazování (pixel-art se nesmí rozmazat)');
  ok(zapis.clear >= 1, 'před kreslením plochu vyčistí');
  ok(zapis.ellipse === 1, 'nakreslí kontaktní stín pod nohama');
  ok(!zapis.barvy.includes('#f0f'), 'ani jeden pixel není magenta (#f0f)');
}
{
  const { cv, zapis } = fakeCanvas(60, 90);
  P.paint(cv, P.grid('g9'), P.palette('g9'), { shadow: false });
  ok(zapis.ellipse === 0, 'shadow:false stín vypne (avatar v profilu)');
  ok(zapis.fillRect > 200, 'i bez stínu se postava kreslí');
}
{
  const { cv, zapis } = fakeCanvas(60, 90);
  P.paint(cv, P.BOSS, P.palette('g7'), { silhouette: true });
  const barvy = new Set(zapis.barvy);
  ok(zapis.fillRect > 200, `silueta se kreslí (${zapis.fillRect} pixelů)`);
  // Silueta má být plochá: jen tmavý tón světa + obrysové světlo.
  ok(barvy.size === 2, `silueta používá jen dvě barvy (${[...barvy].join(' ')})`);
  ok(barvy.has(P.palette('g7').a) && barvy.has(P.palette('g7').R),
    'silueta = tmavý tón světa + rim');
}

/* ── 6. měřítko je celočíselné ───────────────────────────────────────── */
{
  /* Neceločíselné měřítko rozmaže pixely. Ověřuje se tak, že se sleduje
     rozteč vykreslených dlaždic — musí to být celé číslo. */
  const pozice = [];
  const ctx = {
    imageSmoothingEnabled: true, fillStyle: '',
    clearRect() {}, beginPath() {}, ellipse() {}, fill() {},
    fillRect(x, y, w) { pozice.push(w); },
  };
  const cv = { width: 61, height: 97, getContext: () => ctx };  // schválně nedělitelné
  P.paint(cv, P.grid('g6'), P.palette('g6'));
  const sirky = [...new Set(pozice)];
  ok(sirky.length === 1, `všechny dlaždice mají stejnou velikost (${sirky.join('/')})`);
  ok(Number.isInteger(sirky[0]) && sirky[0] >= 1,
    `měřítko je celé číslo (${sirky[0]})`);
}

console.log(`\n  Portréty hrdinů: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
