/* ══════════════════════════════════════════════════════════════════════
   tests/rpg-sprite-345.test.cjs — mřížky hrdiny na sdíleném jádru
   ──────────────────────────────────────────────────────────────────────
   Čistý Node, bez prohlížeče ⇒ patří do jobu `rychla` (run-ci.cjs si ho
   zařadí sám, protože si nevyžádá 'playwright').

   Testuje NASAZENÉ soubory projects/rpg-sprites-*.js přes jejich vlastní
   export window.RPGSpriteWorldN — tedy skutečnou definici, ne opis.

   Ročníky, které ještě nejsou na jádru (starý IIFE engine, HERO_IDLE,
   24 řádků), se PŘESKOČÍ. Rozlišuje se podle toho, jestli soubor zmiňuje
   RPGSpriteCore: kdo se na jádro hlásí, MUSÍ svět exportovat — jinak je to
   nález, ne přeskočení. Bez toho by po rozbití exportu test tiše prošel
   naprázdno (viz CLAUDE.md: audit, který nic neviděl, není zelený).

   Hlídaná pravidla:
     1. rozměry 20×29, 28 pokreslených řádků u KAŽDÉ pózy, legacyRows 24
     2. žádný znak mimo paletu (v provozu magenta #f0f)
     3. '1' nikdy na siluetě (vnitřní stín na obrysu vypadá jako díra)
     4. žádný osamocený pixel bez ortogonálního souseda
     5. dech: IDLE1 = IDLE0 bez jednoho řádku, chodidla se NEHÝBOU
     6. stripProp: v pózách se zbraní žádný odtržený pixel ve sl. 14–19
     7. kontrast tónu 4 a akcentu A ≥ 3,0 proti aréně #233856
     8. párový rozdíl siluet ≥ 8 % (ročník poznáš podle obrysu, ne barvy)
     9. ally.dy je uvedené a jádro kotví parťáka od země
   ══════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

/* Nikdy natvrdo zadaná cesta — na CI je repo v /home/runner/work/… */
const ROOT = path.join(__dirname, '..');
const GRADES = [3, 4, 5, 6, 7, 8, 9];
const ARENA = '#233856';      // nejsvětlejší bod pod postavou (plátno je ze 64 % průhledné)
const MIN_CONTRAST = 3.0;
const MIN_SIL_DIFF = 8;       // %

let fails = 0;
const bad = m => { fails++; console.log('  ✗ ' + m); };
const ok = m => console.log('  ✓ ' + m);
const skip = m => console.log('  – ' + m);

/* ── načtení světa z nasazeného souboru ──────────────────────────────── */
function loadWorld(g) {
  const file = path.join(ROOT, 'projects', `rpg-sprites-${g}.js`);
  if (!fs.existsSync(file)) return { state: 'missing' };
  const src = fs.readFileSync(file, 'utf8');
  const onCore = src.includes('RPGSpriteCore');

  /* Sprite soubory se věší na `window` už při načtení (resize listener),
     stub proto musí mít addEventListener i matchMedia — jinak výjimka
     spadne do načítání a sada by zůstala prázdná. */
  const win = {
    addEventListener() {}, removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} }),
    devicePixelRatio: 1, requestAnimationFrame: () => 0
  };
  try {
    new Function('window', src)(win);        // RPGSpriteCore chybí ⇒ create() se nespustí
  } catch (e) {
    return { state: onCore ? 'error' : 'legacy', err: e.message };
  }
  const world = win[`RPGSpriteWorld${g}`];
  if (!world) return { state: onCore ? 'noexport' : 'legacy' };
  return { state: 'core', world };
}

/* ── pomůcky ─────────────────────────────────────────────────────────── */
const opaque = (gr, r, c) => !!(gr[r] && gr[r][c] && gr[r][c] !== '.');
const painted = gr => { let e = 0; for (let r = gr.length - 1; r >= 0 && /^\.+$/.test(gr[r]); r--) e++; return gr.length - e; };
const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = h => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255); };
const contrast = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };

function posesOf(hero) {
  const gr = hero.grids, out = [];
  gr.idle.forEach((g, i) => out.push(['idle' + i, g]));
  ['windup', 'slash', 'cast', 'shoot', 'hit'].forEach(k => { if (gr[k]) out.push([k, gr[k]]); });
  return out;
}

/* Skloňování: „1 ročník / 2 ročníky / 5 ročníků". Test, který píše
   „1 ročníků", je pro Vojtu vada obsahu, ne kosmetika. */
const plural = (n, one, few, many) => n + ' ' + (n === 1 ? one : (n >= 2 && n <= 4 ? few : many));
const grades = n => plural(n, 'ročník', 'ročníky', 'ročníků');
const poses = n => plural(n, 'póza', 'pózy', 'póz');
const pairs = n => plural(n, 'pár', 'páry', 'párů');

/* Počítadla — pravidlo, které nikdy nezaštěká, je horší než plané. */
const seen = { poses: 0, pixels: 0, pairs: 0 };
const worlds = {};

console.log('\nNAČTENÍ');
GRADES.forEach(g => {
  const r = loadWorld(g);
  if (r.state === 'core') { worlds[g] = r.world; ok(`g${g}: na jádru`); }
  else if (r.state === 'legacy') skip(`g${g}: starý engine, ještě nemigrovaný — přeskočeno`);
  else if (r.state === 'missing') skip(`g${g}: soubor neexistuje — přeskočeno`);
  else if (r.state === 'noexport') bad(`g${g}: hlásí se na jádro, ale neexportuje window.RPGSpriteWorld${g}`);
  else bad(`g${g}: načtení selhalo — ${r.err}`);
});
const ON_CORE = Object.keys(worlds).map(Number);
assert(ON_CORE.length > 0, 'ani jeden ročník není na jádru — test by proběhl naprázdno');

/* ══ 1–4 · mřížky ══════════════════════════════════════════════════════ */
console.log('\nMŘÍŽKY');
ON_CORE.forEach(g => {
  const H = worlds[g].hero, pal = H.pal;

  if (H.cols !== 20) bad(`g${g}: cols ${H.cols} ≠ 20`);
  if (H.rows !== 29) bad(`g${g}: rows ${H.rows} ≠ 29`);
  if ((H.legacyRows || 0) !== 24) bad(`g${g}: legacyRows ${H.legacyRows} ≠ 24 (kotva drawHeroOn)`);

  posesOf(H).forEach(([nm, gr]) => {
    seen.poses++;
    if (gr.length !== 29) bad(`g${g} ${nm}: ${gr.length} řádků ≠ 29`);
    gr.forEach((row, r) => { if (row.length !== 20) bad(`g${g} ${nm} ř.${r}: ${row.length} znaků ≠ 20`); });
    if (painted(gr) !== 28) bad(`g${g} ${nm}: ${painted(gr)} pokreslených řádků ≠ 28`);

    gr.forEach((row, r) => [...row].forEach((ch, c) => {
      seen.pixels++;
      if (ch === '.') return;
      /* 'O' je rim light — barvu dodává jádro z oblasti, v paletě není. */
      if (ch !== 'O' && !(ch in pal)) bad(`g${g} ${nm} ${r},${c}: znak "${ch}" mimo paletu ⇒ magenta`);
      if (ch === '1' && !(opaque(gr, r - 1, c) && opaque(gr, r + 1, c) && opaque(gr, r, c - 1) && opaque(gr, r, c + 1)))
        bad(`g${g} ${nm}: '1' na siluetě ${r},${c} (vnitřní stín na obrysu)`);
      if (!(opaque(gr, r - 1, c) || opaque(gr, r + 1, c) || opaque(gr, r, c - 1) || opaque(gr, r, c + 1)))
        bad(`g${g} ${nm}: osamocený pixel ${r},${c}`);
    }));
  });
});
ok(`${poses(seen.poses)} · ${grades(ON_CORE.length)} na jádru`);

/* ══ 5 · dech ══════════════════════════════════════════════════════════
   IDLE1 = IDLE0 s jedním vypuštěným řádkem a posunem o pixel níž.
   Vypuštěný řádek se HLEDÁ, nehádá — u každého ročníku je jinde.

   Zdvojený řádek se NEVYŽADUJE: nasazená devítka vypouští řádek 17, který
   zdvojený není, a v provozu je to v pořádku. 1. stupeň zdvojený řádek má,
   protože pak je dech čistý posun bez změny obrysu — test hlásí, co našel,
   ale neshodí to. Podstatné je, že se NEHNOU CHODIDLA: to je ta vada, která
   odlepí kontaktní stín. */
console.log('\nDECH');
ON_CORE.forEach(g => {
  const H = worlds[g].hero, i0 = H.grids.idle[0], i1 = H.grids.idle[1];
  const blank = '.'.repeat(H.cols);
  let hit = -1;
  for (let d = 1; d < i0.length; d++) {
    const rebuilt = [blank].concat(i0.slice(0, d)).concat(i0.slice(d + 1));
    if (rebuilt.join('|') === i1.join('|')) { hit = d; break; }
  }
  if (hit < 0) bad(`g${g}: IDLE1 nevzniklo vypuštěním jednoho řádku z IDLE0`);
  else ok(`g${g}: dech vypouští řádek ${hit}${i0[hit] === i0[hit - 1] ? ' (zdvojený — čistý posun)' : ' (nezdvojený — obrys se o pixel mění)'}`);
  if (painted(i0) !== painted(i1)) bad(`g${g}: chodidla se hýbou — pokreslených ${painted(i0)} vs ${painted(i1)}`);
});

/* ══ 6 · stripProp ═════════════════════════════════════════════════════
   Pózy se zbraní ruší rekvizitu I předloktí, které ji drží. Staré znění
   pravidla („ve sl. 14–19 nesmí být nic") na 1. stupni FALEŠNĚ padá — tělo
   tam legitimně sahá (lem trojky, manžeta čtyřky). Testuje se proto
   SOUVISLOST: pixel bez levého souseda = odtržený pahýl. */
console.log('\nstripProp');
let stubs = 0;
ON_CORE.forEach(g => {
  const H = worlds[g].hero;
  ['windup', 'slash', 'shoot'].forEach(k => {
    const gr = H.grids[k]; if (!gr) return;
    for (let r = 5; r < gr.length; r++)
      for (let c = 14; c < H.cols; c++)
        if (opaque(gr, r, c) && !opaque(gr, r, c - 1)) { stubs++; bad(`g${g} ${k}: odtržený pixel ${r},${c} (pahýl předloktí)`); }
  });
});
if (!stubs) ok('žádný pahýl rekvizity ani předloktí');

/* ══ 7 · kontrast a skiny ══════════════════════════════════════════════ */
console.log('\nKONTRAST vs ' + ARENA);
ON_CORE.forEach(g => {
  const H = worlds[g].hero;
  [['4', H.pal['4']], ['A', H.pal.A]].forEach(([k, hex]) => {
    const c = contrast(hex, ARENA);
    if (c < MIN_CONTRAST) bad(`g${g} tón ${k} = ${hex}: kontrast ${c.toFixed(2)} < ${MIN_CONTRAST}`);
    else ok(`g${g} ${k} ${hex} → ${c.toFixed(2)}`);
  });
  /* Skiny se prahem NEHODNOTÍ: skin-stealth je koupená kosmetika a záměrně
     nenápadná (tón 4 na 1,48). Kontroluje se jen to, že skin něco mění. */
  const sk = H.skins || {}, ids = Object.keys(sk);
  if (ids.length !== 5) bad(`g${g}: ${ids.length} skinů ≠ 5 (obchod prodává pět ID)`);
  ids.forEach(id => {
    const n = Object.keys(sk[id]).filter(ch => sk[id][ch] !== H.pal[ch]).length;
    if (n < 3) bad(`g${g} ${id}: mění jen ${n} znaky (< 3) ⇒ v obchodu nepoznatelné`);
  });
});

/* ══ 8 · siluety ═══════════════════════════════════════════════════════
   Rekvizita (sl. 16–19) se nepočítá — rozdíl musí nést tělo.

   POZOR na metriku, čísla se nedají srovnávat mezi sebou:
     tady          |A Δ B| / |A ∪ B|   jen tělo (c < 16)   ← Jaccard
     jinde v repu  |A Δ B| / (|A|+|B|) celá mřížka
   Druhá dává systematicky nižší číslo (na měřených párech 52–78 % první).
   Práh 8 % níž patří k TÉTO metrice. Když měníš metriku, přepočítej i práh. */
console.log('\nSILUETY');
if (ON_CORE.length < 2) {
  skip(`na jádru je jen ${grades(ON_CORE.length)} — porovnání siluet nemá s čím`);
} else {
  const silhouette = g => {
    const s = new Set();
    worlds[g].hero.grids.idle[0].forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.' && c < 16) s.add(r + ',' + c); }));
    return s;
  };
  const S = {}; ON_CORE.forEach(g => S[g] = silhouette(g));
  let worst = { d: Infinity, p: '' };
  for (let i = 0; i < ON_CORE.length; i++)
    for (let j = i + 1; j < ON_CORE.length; j++) {
      const a = S[ON_CORE[i]], b = S[ON_CORE[j]];
      let inter = 0; a.forEach(v => { if (b.has(v)) inter++; });
      const uni = a.size + b.size - inter;
      const d = 100 * (uni - inter) / uni;
      seen.pairs++;
      if (d < MIN_SIL_DIFF) bad(`siluety ${ON_CORE[i]}×${ON_CORE[j]}: rozdíl ${d.toFixed(1)} % < ${MIN_SIL_DIFF} %`);
      if (d < worst.d) worst = { d, p: `${ON_CORE[i]}×${ON_CORE[j]}` };
    }
  ok(`${pairs(seen.pairs)}, nejtěsnější ${worst.p} na ${worst.d.toFixed(1)} %`);
  assert(seen.pairs === ON_CORE.length * (ON_CORE.length - 1) / 2, `viděno ${seen.pairs} párů siluet`);
}

/* ══ 9 · kotva parťáka ═══════════════════════════════════════════════
   `ally.dy` = px od ZEMĚ k nejnižšímu pokreslenému řádku parťáka.

   Testuje se CHOVÁNÍ, ne zápis. Starší verze tohohle testu hledala v jádře
   regulár `AL.dy != null … HERO_PAINT … paintedRows(` — to je špatně: totéž
   se dá spočítat i jako `(AR.h - AR.groundPad) - AL.dy`, tedy od podlahy
   arény, a taková větev by fungovala správně, ale test by ji nahlásil jako
   vadu. Proto se jádro spřáhne se stubem DOM, vykreslí se jeden snímek a
   měří se, KDE parťák skutečně přistane. Parťák má v testu vlastní barvu,
   kterou nikdo jiný nepoužívá, takže jeho pixely jdou ze záznamu fillRect
   vybrat bez ohledu na to, jak je jádro spočítalo. */
console.log('\nPARŤÁK — kotva (chování jádra)');

function measureAlly(opts) {
  const rects = [];
  const mkCtx = () => {
    const c = {
      fillStyle: '#000', strokeStyle: '#000', globalAlpha: 1, lineWidth: 1, font: '',
      imageSmoothingEnabled: false,
      fillRect(x, y, w, h) { rects.push({ s: String(c.fillStyle).toLowerCase(), y: y, h: h }); },
      clearRect() {}, strokeRect() {}, drawImage() {}, fillText() {},
      save() {}, restore() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
      arc() {}, fill() {}, stroke() {}, translate() {}, scale() {}, rotate() {}, clip() {},
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} })
    };
    return c;
  };
  const mkCanvas = () => ({
    style: { cssText: '' }, id: '', width: 0, height: 0, clientWidth: 600,
    isConnected: false, parentNode: null, getContext: mkCtx
  });
  /* reduced-motion = true ⇒ žádný bob ani jet, snímek je deterministický */
  const doc = {
    documentElement: { classList: { contains: () => true } },
    createElement: () => mkCanvas(), getElementById: () => null
  };
  const win = {
    document: doc, performance: { now: () => 0 },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    addEventListener() {}, removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} })
  };
  const coreSrc = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-sprite-core.js'), 'utf8');
  new Function('window', 'document', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame', coreSrc)
    (win, doc, win.performance, win.requestAnimationFrame, win.cancelAnimationFrame);

  const ALLY_COL = '#010203';                    // barva, kterou nemá nikdo jiný
  const heroRows = [];
  for (let r = 0; r < opts.heroPainted; r++) heroRows.push('HHHH');
  while (heroRows.length < 29) heroRows.push('....');
  const allyRows = [];
  for (let r = 0; r < opts.allyPainted; r++) allyRows.push('PPPP');

  const ally = { scale: 4, pal: { P: ALLY_COL }, grids: [allyRows] };
  if (opts.dy != null) ally.dy = opts.dy;

  const api = win.RPGSpriteCore.create({
    id: 99, arena: { h: 200, groundPad: 14, heroX: 0.12, bossX: 0.58 },
    hero: { cols: 4, rows: 29, legacyRows: 24, scale: 5, pal: { H: '#0a0b0c' }, skins: {}, grids: { idle: [heroRows, heroRows] } },
    ally: ally,
    bosses: { scale: 5, pals: { 1: {} }, common: {}, grids: { 1: [['....'], ['....']] } },
    areas: { 1: { neon: '#ffffff' } },
    backdrop: function () {}, look: { rim: false, shadow: false }
  });
  const topEl = {
    querySelectorAll: () => [], querySelector: () => null,
    appendChild(c) { c.parentNode = topEl; c.isConnected = true; },
    insertBefore(c) { c.parentNode = topEl; c.isConnected = true; }
  };
  api.attach(topEl);

  const mine = rects.filter(r => r.s === ALLY_COL);
  if (!mine.length) return null;
  const GROUND = 200 - 14;
  return {
    n: mine.length,
    aboveGround: GROUND - Math.max.apply(null, mine.map(r => r.y + r.h)),
    topAbove: GROUND - Math.min.apply(null, mine.map(r => r.y))
  };
}

{
  /* 1) s `dy` kotva NESMÍ záviset na výšce hrdiny */
  const heights = [24, 28, 32];
  const got = heights.map(hp => measureAlly({ heroPainted: hp, allyPainted: 14, dy: 34 }));
  if (got.some(r => !r)) bad('kotva: parťák se vůbec nevykreslil — měření šlo naprázdno');
  else {
    const uniq = Array.from(new Set(got.map(r => r.aboveGround)));
    if (uniq.length !== 1) bad('kotva: spodek parťáka se s výškou hrdiny hýbe — ' + heights.map((h, i) => h + 'ř→' + got[i].aboveGround + 'px').join(', '));
    else if (uniq[0] !== 34) bad('kotva: dy 34 dává spodek ' + uniq[0] + ' px nad zemí, čekáno 34');
    else ok('dy 34 drží spodek 34 px nad zemí pro hrdinu ' + heights.join('/') + ' řádků');
  }

  /* 2) dy se měří ke SPODKU kresby, ne k horní hraně mřížky:
     vyšší parťák při témž dy musí růst NAHORU. */
  const a14 = measureAlly({ heroPainted: 28, allyPainted: 14, dy: 34 });
  const a16 = measureAlly({ heroPainted: 28, allyPainted: 16, dy: 34 });
  if (a14 && a16) {
    if (a16.aboveGround !== a14.aboveGround) bad('kotva: dy se neměří ke spodku kresby (14ř ' + a14.aboveGround + ' px vs 16ř ' + a16.aboveGround + ' px)');
    else if (a16.topAbove <= a14.topAbove) bad('kotva: vyšší parťák neroste nahoru');
    else ok('vyšší parťák roste nahoru (temeno ' + a14.topAbove + ' → ' + a16.topAbove + ' px)');
  }

  /* 3) záložní větev bez dy MUSÍ zůstat po starém (od temene hrdiny) —
     fáze 02 na ní stojí. Kdyby ji někdo „opravil", tiše se posunou otisky
     nemigrovaných světů. */
  const l24 = measureAlly({ heroPainted: 24, allyPainted: 14 });
  const l28 = measureAlly({ heroPainted: 28, allyPainted: 14 });
  if (l24 && l28) {
    if (l24.aboveGround === l28.aboveGround) bad('záložní větev (bez dy) kotví od země — fáze 02 čeká kotvu od temene');
    else ok('záložní větev bez dy zůstává od temene (' + l24.aboveGround + ' → ' + l28.aboveGround + ' px)');
  }
}

/* Světy mají `dy` uvádět. Samo číslo provazuje s geometrií bod 1 výše. */
ON_CORE.forEach(g => {
  const AL = worlds[g].ally;
  if (!AL) return skip(`g${g}: bez parťáka`);
  if (AL.dy == null) return bad(`g${g}: ally.dy chybí ⇒ kotva od temene, posune se s hrdinou`);
  if (AL.dy < 0) bad(`g${g}: ally.dy ${AL.dy} < 0 ⇒ parťák pod zemí`);
  if (!AL.jet) bad(`g${g}: ally.jet chybí (pod reduced-motion to není poznat)`);
  else ok(`g${g}: ally.dy ${AL.dy}, jet na ${AL.jet.at.length} bodech`);
});

/* ══ pojistka proti planému běhu ═══════════════════════════════════════ */
console.log('\nPOKRYTÍ');
assert(seen.poses >= ON_CORE.length * 7, `viděno ${seen.poses} póz, čekáno ≥ ${ON_CORE.length * 7}`);
assert(seen.pixels >= ON_CORE.length * 7 * 20 * 29, `viděno ${seen.pixels} pixelů — audit šel naprázdno`);
ok(`${grades(ON_CORE.length)} na jádru (${ON_CORE.join(', ')}) · ${poses(seen.poses)} · ${seen.pixels} pixelů · ${pairs(seen.pairs)}`);

console.log(fails ? `\n✗ ${fails} nálezů\n` : '\n✓ vše prošlo\n');
process.exit(fails ? 1 : 0);
