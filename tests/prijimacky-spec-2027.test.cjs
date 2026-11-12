/* prijimacky-spec-2027.test.cjs — přijímačky odpovídají specifikaci CERMAT pro školní rok 2026/2027 (čistý Node).

   Specifikace požadavků z matematiky (část C1) platí od jarního termínu 2027 a z jednotné přijímací zkoušky
   vypouští:
     a) rozklad dvojčlenu a trojčlenu na součin pomocí vzorců (a + b)², (a − b)², a² − b²
        (umocnění dvojčlenu a rozklad vytýkáním ZŮSTÁVAJÍ),
     b) pravidla pro odmocňování zlomku a součinu (√(a/b) = √a/√b, √(ab) = √a·√b jako postup),
     c) NSN a NSD TŘÍ čísel (dvou čísel zůstává),
     d) konstrukce: tečnu ke kružnici v jejím bodě, kružnici opsanou trojúhelníku, Thaletovu kružnici
        při konstrukci pravoúhlého trojúhelníku,
     e) odhad a výpočet objemu a povrchu válce,
     f) aplikační úlohy s koulí;
   mění: g) soustava dvou rovnic se neřeší „dosazovací/sčítací metodou“ (řeší se kteroukoli), h) přehled vzorců
   na konci testu nese jen druhé mocniny 11–20, π a obvod a obsah kruhu.

   Test projde VYGENEROVANÉ úlohy obou bank (test nanečisto `rpg-cermat-9.js` a úroveň „základ“ `prijimacky-gen.js`,
   včetně nápověd) i všechny konstrukce a hlídá body a–h podle znění. Banky se načítají do izolovaného kontextu (`vm`),
   takže sabotáže (úprava zdroje v paměti, žádný zásah do souborů) ověřují, že test skutečně vidí to, co se generuje.

   SPORNÉ úlohy: u některých úloh není z textu specifikace jisté, jestli pod vypuštěné body spadají (válec bez
   objemu a povrchu, kružnice opsaná jen jako údaj, Thaletova věta jako jeden z kroků konstrukce). Zůstaly a jsou
   JMENOVITĚ vypsané níže i s důvodem; výjimka, která už nic nechytá, test shodí, ať seznam nehnije.

   Spusť: node tests/prijimacky-spec-2027.test.cjs
   ═══════════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');            // NIKDY natvrdo /home/user — CI má jinou cestu
const P = 'projects/prijimacky-matematika/';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
const cti = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* ── Pravidla a–h (znění) ──────────────────────────────────────────────────
   Pravidlo se hledá v JSON zápisu celé úlohy BEZ obrázku (zadání, volby, postup, podúlohy). */
const PRAVIDLA = [
  { id: 'a', co: 'rozklad podle vzorce',
    re: /(rozlož\w*|rozklad\w*)[^"]{0,90}(vzorc\w*|vzorec)|(vzorc\w*|vzorec)[^"]{0,90}(rozlož\w*|rozklad\w*)|\(\s*\w\s*[−-]\s*\?\s*\)\s*·\s*\(\s*\w\s*\+\s*\?\s*\)/i },
  { id: 'b', co: 'pravidlo odmocňování součinu nebo zlomku',
    re: /√\s*\([^)]*[·\/][^)]*\)\s*=\s*√[^=]*[·\/]\s*√|odmocnin\w* (ze )?(součinu|zlomku)[^"]{0,80}(rozděl|rozlož|součin odmocnin|podíl odmocnin)|(součin|podíl) odmocnin|odmocni\w* každ\w+ (činitel|zlomek|čitatel)/i },
  { id: 'c', co: 'NSN nebo NSD tří čísel',
    re: /(NSN|NSD|nejmenší společný násobek|největší společný dělitel)\s*(čísel|čísla)?\s*\(?\s*\d+\s*(,|;|a)\s*\d+\s*(,|;|a)\s*\d+/i },
  { id: 'd-tecna', co: 'tečna ke kružnici', re: /(^|[^\p{L}])tečn/iu },        // ne „skutečnosti“ (měřítko mapy)
  { id: 'd-opsana', co: 'kružnice opsaná / vepsaná', re: /kružnic\w* (opsan|vepsan)|opsan\w+ kružnic|vepsan\w+ do kružnic/i },
  { id: 'd-thales', co: 'Thaletova kružnice / věta', re: /thalet/i },
  { id: 'e', co: 'objem nebo povrch válce',
    re: null },          // úloha se slovem válec A (objem|povrch) — viz jeValec níže (porovnává se v celé úloze)
  { id: 'f', co: 'koule', re: /\bkoul\w*|\bkouli\b|sféra|sferick/i },
  { id: 'g', co: 'dosazovací / sčítací metoda', re: /dosazovac|s[čc][íi]tac/i },
];
const jeValec = txt => /v[áa]l(ec|c\w*)\b/i.test(txt) && /objem|povrch/i.test(txt);
const bezSvg = o => JSON.stringify(o, (k, v) => (k === 'svg' || k === 'tvary' ? undefined : v));
function porusenia(txt) {
  const r = [];
  for (const p of PRAVIDLA) if (p.id === 'e' ? jeValec(txt) : p.re.test(txt)) r.push(p.id);
  return r;
}

/* ── SPORNÉ úlohy (zůstaly, čekají na rozhodnutí): název/typ → pravidla, která chytají ────────────────── */
const SPORNE_BANKA = {
  'Sud': ['e'],                                         // ZŮSTÁVÁ: dno zadáno, V = S·h bez π = aplikační úloha o válci (C1 str. 11 ji ponechává; vypuštěn je jen výpočet objemu a povrchu)
  'Přelévání vody': ['e'],                              // ZŮSTÁVÁ: původní úloha CERMATu (M9C/2024 ú. 2), řeší se poměrem podstav, π se nedosazuje = aplikační úloha o válci
  'Kružnice opsaná a osa úhlu': ['d-opsana', 'd-thales'], // trojúhelník vepsaný do kružnice, střed na AB: kružnice opsaná jako údaj, Thaletova věta ve výpočtu úhlu
  'Obdélník v kružnici': ['d-thales'],                  // kružnice opsaná obdélníku jako údaj; v řešení Thaletova věta
  'Body C na přímce': ['d-thales'],                     // kolik bodů C dá pravoúhlý trojúhelník — v řešení Thaletova kružnice
};
const SPORNE_KONSTRUKCE = {
  obdelnikUhl: ['d-thales'],                            // obdélník: vrchol C na Thaletově kružnici nad úhlopříčkou
  obdelnikStrana: ['d-thales'],                         // obdélník: vrchol D na Thaletově kružnici nad AS
  teziste: ['d-thales'],                                // pravoúhlý rovnoramenný trojúhelník: zmínka v postupu
  pravouhlyRovnoramenny: ['d-thales'],                  // pravoúhlý rovnoramenný trojúhelník: C na Thaletově kružnici nad BD
  pravouhlyStrana: ['d-thales'],                        // pravoúhlý trojúhelník: A na Thaletově kružnici nad BC
  pravouhlyLichKruz: ['d-thales'],                      // pravoúhlý lichoběžník na kružnici: Thaletova věta v postupu
  obdelnikOpsana: ['d-opsana'],                         // kružnice opsaná OBDÉLNÍKU (ne trojúhelníku)
  obdelnikOpsanaM: ['d-opsana'],                        // totéž, bod M na ní
};
const ODEBRANE_NAZVY = ['Těžítko', 'Povrch válce', 'Dort ze dvou forem', 'Rozklad podle vzorce'];   // názvy variant testu nanečisto vypuštěných pro 2027
const ODEBRANE_TYPY = ['thales', 'dveThalet', 'thalesQ', 'opsana', 'ctverecVepsany'];             // typy konstrukcí vypuštěných pro 2027

/* ── Načtení zdrojů do izolovaného kontextu (s možností upravit zdroj v paměti = sabotáž) ───────────── */
function kontext() {
  const ctx = {
    window: {}, console,
    ri: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
    gcd: function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); },
    cz: n => String(n).replace('.', ','),
    skl: (n, o, f, m) => n === 1 ? o : (n >= 2 && n <= 4 ? f : m),
  };
  ['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar'].forEach(f => ctx[f] = () => '<svg></svg>');
  ctx.svgCuboid = (a, b, c) => '<svg>' + [a, b, c].map(x => '<text>' + x + '</text>').join('') + '</svg>';   // popisky hran se předávají dál, ať je test vidí
  return vm.createContext(ctx);
}
function uprav(zdroj, uprava, nazev) {
  if (!uprava) return zdroj;
  const novy = uprava(zdroj);
  if (novy === zdroj) throw new Error('sabotáž „' + nazev + '“ se neaplikovala (zdroj se nezměnil)');
  return novy;
}
function nactiBanku(uprava, nazev) {
  let src = uprav(cti('projects/rpg-cermat-9.js'), uprava, nazev);
  const ix = src.lastIndexOf('window.RPG_CERMAT_9 = {');
  if (ix < 0) throw new Error('v rpg-cermat-9.js není window.RPG_CERMAT_9');
  src = src.slice(0, ix) + 'window.RPG_CERMAT_9 = { _SLOTS: SLOTS,' + src.slice(ix + 'window.RPG_CERMAT_9 = {'.length);
  const c = kontext();
  vm.runInContext(src, c, { filename: 'rpg-cermat-9.js' });
  return c.window.RPG_CERMAT_9;
}
function nactiZaklad(uprava, nazev) {
  const c = kontext();
  vm.runInContext(uprav(cti(P + 'prijimacky-gen.js'), uprava, nazev), c, { filename: 'prijimacky-gen.js' });
  return { GEN: c.window.PZ_GEN, ctx: c };
}
function nactiKonstrukce(uprava, nazev) {
  const c = kontext();
  vm.runInContext(cti(P + 'konstrukce-geo.js'), c, { filename: 'konstrukce-geo.js' });
  vm.runInContext(uprav(cti(P + 'konstrukce-ulohy.js'), uprava, nazev), c, { filename: 'konstrukce-ulohy.js' });
  return c.window.PZ_KONSTRUKCE;
}
const ULOH_NA_POZICI = 1200;
function sberBanku(B) {                                    // → { varianty: Map(pozice|název → { pozice, nazev, hits:Set, vzorek }) , pocet, hrubeNazvy }
  const varianty = new Map();
  let pocet = 0;
  for (let i = 0; i < B._SLOTS.length; i++) {
    for (let k = 0; k < ULOH_NA_POZICI; k++) {
      const t = B.genSlot(i);
      pocet++;
      const klic = (i + 1) + '|' + t.title;
      if (!varianty.has(klic)) varianty.set(klic, { pozice: i + 1, nazev: t.title, hits: new Set(), vzorek: bezSvg(t).slice(0, 160) });
      for (const r of porusenia(bezSvg(t))) varianty.get(klic).hits.add(r);
    }
  }
  return { varianty, pocet };
}
function sberZaklad(Z, PZ) {
  const polozky = [];
  let pocet = 0;
  for (const okruh in Z.GEN) for (const gen of Z.GEN[okruh]) {
    const hits = new Set();
    let vz = '';
    for (let k = 0; k < 300; k++) {
      const it = gen();
      pocet++;
      let txt = bezSvg(it);
      if (PZ) try { txt += ' ' + JSON.stringify(PZ.hintsFor(it, okruh)); } catch (e) { /* hlásí se jinde */ }
      for (const r of porusenia(txt)) hits.add(r);
      if (!vz) vz = txt.slice(0, 160);
    }
    polozky.push({ okruh, kind: gen.name, hits, vzorek: vz });
  }
  return { polozky, pocet };
}
function sberKonstrukce(K) {
  const typy = [];
  for (const t of K.TYPY) {
    const hits = new Set();
    for (let k = 0; k < 15; k++) {
      const u = K.GENERATORY[t]();
      if (!u) continue;
      for (const r of porusenia(bezSvg({ nazev: u.nazev, text: u.text, postup: (u.postup || []).map(x => x.text), napovedy: u.napovedy }))) hits.add(r);
    }
    typy.push({ typ: t, hits });
  }
  return typy;
}

/* ═══ Výchozí stav: všechno z neupraveného zdroje ═══════════════════════════════════════════════════ */
const B0 = nactiBanku();
const sb = sberBanku(B0);
const Z0 = nactiZaklad();
// nápovědy základu: modul jádra načteme tak, jak to dělá prijimacky-gen.test.cjs
Z0.ctx.window.PZ_TOPICS = { list: Object.keys(Z0.GEN).map(id => ({ id, name: id })) };
let PZ = null;
try { vm.runInContext(cti(P + 'prijimacky-core.js'), Z0.ctx, { filename: 'prijimacky-core.js' }); PZ = Z0.ctx.window.PZ; } catch (e) { /* hlásí se níže */ }
const sz = sberZaklad(Z0, PZ);
const K0 = nactiKonstrukce();
const sk = sberKonstrukce(K0);

console.log('── Test nanečisto (rpg-cermat-9.js): ' + sb.pocet + ' vygenerovaných úloh, ' + sb.varianty.size + ' variant ──');
ok(sb.pocet >= 16 * ULOH_NA_POZICI, 'prošlo se ' + sb.pocet + ' úloh (16 pozic × ' + ULOH_NA_POZICI + ')');
for (const p of PRAVIDLA) {
  const chyceno = [...sb.varianty.values()].filter(v => v.hits.has(p.id) && !(SPORNE_BANKA[v.nazev] || []).includes(p.id));
  ok(chyceno.length === 0, 'bod ' + p.id + ' (' + p.co + '): žádná varianta testu mimo sporné',
    chyceno.map(v => 'pozice ' + v.pozice + ' „' + v.nazev + '“: ' + v.vzorek).slice(0, 3).join(' | '));
}
const stare = [...sb.varianty.values()].filter(v => ODEBRANE_NAZVY.includes(v.nazev));
ok(stare.length === 0, 'vypuštěné varianty (' + ODEBRANE_NAZVY.join(', ') + ') se nevylosují', stare.map(v => v.nazev).join(', '));
// výjimky musí stále něco chytat (jinak jsou zbytečné a seznam hnije)
for (const [nazev, pravidla] of Object.entries(SPORNE_BANKA)) {
  const v = [...sb.varianty.values()].filter(x => x.nazev === nazev);
  ok(v.length > 0 && pravidla.every(r => v.some(x => x.hits.has(r))), 'sporná varianta „' + nazev + '“ stále existuje a chytá ' + pravidla.join(', '),
    v.length ? 'výjimka už nic nechytá — odstraň ji ze SPORNE_BANKA' : 'varianta se nevylosovala');
}

console.log('── Počty variant se po vypuštění nesnížily (doplněny náhrady) ──');
const PUVODNI = [11, 6, 6, 5, 8, 8, 6, 8, 5, 5, 9, 8, 13, 6, 7, 11];            // změřeno před úpravou (docs/specifikace-2027/mereni-pred.md)
const pocty = B0._SLOTS.map(v => v.length);
ok(pocty.length === 16 && pocty.every((n, i) => n >= PUVODNI[i]), 'každá z 16 pozic má aspoň původní počet variant: ' + pocty.join(', '),
  'původně ' + PUVODNI.join(', '));
ok(pocty.reduce((a, b) => a + b, 0) >= 122, 'celkem ' + pocty.reduce((a, b) => a + b, 0) + ' variant (původně 122)');

console.log('── Obrázky nových variant neukazují odvozený údaj (čísla v popiscích ⊆ čísla ze zadání) ──');
{
  // Povrch hranolu popisoval na obrázku výšku, kterou zadání (plášť = k × podstava) neuvádí a řešení nepotřebuje:
  // žák ji přečetl z obrázku a krok úlohy obešel (nalezeno při prohlídce na iPadu 12. 11. 2026).
  const NOVE = [[5, 'Těžítko s dutinou'], [11, 'Dort z hranolových forem'], [12, 'Povrch hranolu']];
  const cisla = s => (String(s).match(/\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(',', '.'));
  const odvozene = Bk => {
    const videno = {}, spatne = new Set();
    for (const [i, titul] of NOVE) for (let k = 0; k < 400; k++) {
      const t = Bk.genSlot(i); if (t.title !== titul) continue;
      videno[titul] = (videno[titul] || 0) + 1;
      const zadani = new Set(cisla([t.intro, t.prompt, ...(t.parts || []).map(p => p.prompt)].join(' ')));
      if ([...String(t.svg || '').matchAll(/<text>([^<]*)<\/text>/g)].flatMap(m => cisla(m[1])).some(n => !zadani.has(n))) spatne.add(titul);
    }
    return { videno, spatne: [...spatne] };
  };
  const o = odvozene(B0);
  ok(NOVE.every(([, t]) => (o.videno[t] || 0) >= 10), 'kontrola viděla všechny tři nové varianty aspoň 10× (' + JSON.stringify(o.videno) + ')');
  ok(o.spatne.length === 0, 'obrázek žádné nové varianty neukazuje číslo, které není v zadání', o.spatne.join(', '));
  let chyceno = false;
  try { chyceno = odvozene(nactiBanku(s => s.replace("svgCuboid(a + ' cm', 'v', a + ' cm', 1)", "svgCuboid(a + ' cm', v + ' cm', a + ' cm', 1)"), 'výška hranolu v obrázku')).spatne.includes('Povrch hranolu'); } catch (e) { /* neaplikováno */ }
  ok(chyceno, 'sabotáž: obrázek Povrchu hranolu popíše výšku → kontrola ji najde');
}

console.log('── Rozklad na součin jen vytýkáním (pozice 3) ──');
{
  const casti = [];
  for (let k = 0; k < 900; k++) for (const t of [B0.genSlot(2)]) for (const p of (t.parts || [])) casti.push(p);
  const vytk = casti.filter(p => /vytknutím/.test(p.prompt));
  // Naměřeno 300 běhů po 900 losech: průměr 600,0, sd 22,8, nejméně 536. Podlaha = průměr − 5 sd (dřívějších 600 padalo v polovině běhů).
  ok(vytk.length >= 485, 'pozice 3: podúlohy s rozkladem vytknutím se losují (' + vytk.length + ' z ' + casti.length + ', podlaha 485)');
  ok(casti.filter(p => /rozlož\w* na součin/i.test(p.prompt) && !/vytknutím/.test(p.prompt)).length === 0, 'pozice 3: každý „rozklad na součin“ je vytknutím');
  const soust = [];
  for (let k = 0; k < 900; k++) for (const p of (B0.genSlot(3).parts || [])) if (/soustav/.test(p.prompt)) soust.push(p);
  ok(soust.length > 100 && soust.every(p => /kteroukoli metodou/.test((Array.isArray(p.sol) ? p.sol : [p.sol]).join(' ')) || /y = /.test((Array.isArray(p.sol) ? p.sol : [p.sol]).join(' '))),
    'pozice 4: soustava (' + soust.length + '×) v řešení ukazuje jednu metodu s dodatkem „kteroukoli“ (podúloha pro y navazuje na x)');
}

console.log('── Úroveň „základ“ (prijimacky-gen.js): ' + sz.pocet + ' úloh vč. nápověd, ' + sz.polozky.length + ' generátorů ──');
ok(sz.pocet >= 76 * 300 && sz.polozky.length >= 76, 'prošlo se ' + sz.pocet + ' úloh ze ' + sz.polozky.length + ' generátorů (podlaha 76 × 300)');
ok(PZ && typeof PZ.hintsFor === 'function', 'nápovědy základu (PZ.hintsFor) se načetly a jsou součástí kontroly');
for (const p of PRAVIDLA) {
  const chyceno = sz.polozky.filter(v => v.hits.has(p.id));
  ok(chyceno.length === 0, 'bod ' + p.id + ' (' + p.co + '): žádný generátor základu', chyceno.map(v => v.okruh + '/' + v.kind + ': ' + v.vzorek).slice(0, 3).join(' | '));
}
ok(!sz.polozky.some(v => v.kind === 'odmocninaSoucin'), 'generátor odmocninaSoucin je pryč');
ok(sz.polozky.some(v => v.kind === 'odmocninaDesetinna'), 'náhrada odmocninaDesetinna (odmocnina setin a stovek) je v okruhu výrazů');
{
  const pocetOkruhu = {}; for (const v of sz.polozky) pocetOkruhu[v.okruh] = (pocetOkruhu[v.okruh] || 0) + 1;
  const PUV = { 'vyrazy-mocniny': 8, zlomky: 8, 'vyrazy-promenna': 7, rovnice: 7, procenta: 8, slovni: 7, pomer: 7, data: 7, geometrie: 10, telesa: 7 };
  ok(Object.entries(PUV).every(([k, n]) => (pocetOkruhu[k] || 0) >= n), 'každý okruh základu má aspoň původní počet generátorů: ' + JSON.stringify(pocetOkruhu));
}

console.log('── Konstrukce (konstrukce-ulohy.js): ' + sk.length + ' typů ──');
for (const p of PRAVIDLA.filter(x => x.id.startsWith('d') || ['f', 'g'].includes(x.id))) {
  const chyceno = sk.filter(t => t.hits.has(p.id) && !(SPORNE_KONSTRUKCE[t.typ] || []).includes(p.id));
  ok(chyceno.length === 0, 'bod ' + p.id + ' (' + p.co + '): žádná konstrukce mimo sporné', chyceno.map(t => t.typ).join(', '));
}
ok(ODEBRANE_TYPY.every(t => !K0.TYPY.includes(t) && !K0.PRO_TEST[9].includes(t) && !K0.PRO_TEST[10].includes(t) && !K0.GENERATORY[t]),
  'vypuštěné typy (' + ODEBRANE_TYPY.join(', ') + ') nejsou v TYPY, GENERATORY ani v sadách testu');
for (const [typ, pravidla] of Object.entries(SPORNE_KONSTRUKCE)) {
  const t = sk.find(x => x.typ === typ);
  ok(t && pravidla.every(r => t.hits.has(r)), 'sporný typ „' + typ + '“ stále existuje a chytá ' + pravidla.join(', '), t ? 'výjimka už nic nechytá — odstraň ji ze SPORNE_KONSTRUKCE' : 'typ neexistuje');
}
ok(K0.PRO_TEST[9].length >= 42 && K0.PRO_TEST[10].length >= 38, 'sady testu mají aspoň původní počet typů: pozice 9 → ' + K0.PRO_TEST[9].length + ' (původně 42), pozice 10 → ' + K0.PRO_TEST[10].length + ' (původně 38)');
ok(K0.TYPY.length >= 85, 'konstrukcí je ' + K0.TYPY.length + ' (původně 85)');

console.log('── Stránky přijímaček: žádný přehled s rozkladem na součin ──');
const STRANKY = ['test.html', 'procvicovani.html', 'diagnostika.html', 'statistiky.html', 'konstrukce.html'];
{
  const chyby = STRANKY.filter(f => /Rozklad na součin|rozklad na součin/.test(cti(P + f)));
  ok(chyby.length === 0, 'stránky testu, procvičování, diagnostiky, statistik a konstrukcí neobsahují blok „Rozklad na součin“', chyby.join(', '));
  const html = cti(P + 'konstrukce.html');
  ok(ODEBRANE_TYPY.every(t => !html.includes('value="' + t + '"')), 've výběru typu konstrukce nejsou vypuštěné typy');
  const opts = [...html.matchAll(/<option value="([^"]+)"/g)].map(m => m[1]).filter(Boolean);
  ok(opts.every(o => K0.TYPY.includes(o)) && K0.TYPY.every(t => opts.includes(t)), 'výběr typu konstrukce = TYPY (' + opts.length + ' položek)');
}

console.log('── Úvodní stránka a dokumentace ──');
{
  const idx = cti(P + 'index.html');
  ok(/Od roku 2027 platí nová specifikace/.test(idx) && /Thaletova kružnice/.test(idx) && /rozklad podle vzorců/.test(idx),
    'úvodní stránka nese poznámku o nové specifikaci a o tom, co ve starších testech už nebude');
  ok(/docs\/specifikace-2027/.test(idx), 'poznámka odkazuje na docs/specifikace-2027/');
  ok(fs.existsSync(path.join(ROOT, 'docs/specifikace-2027/README.md')) && fs.existsSync(path.join(ROOT, 'docs/specifikace-2027/mereni-pred.md')),
    'docs/specifikace-2027/ má README.md a mereni-pred.md');
  const pdfs = fs.readdirSync(path.join(ROOT, 'docs/specifikace-2027')).filter(f => /\.pdf$/i.test(f));
  const POVINNA_PDF = ['SPECIFIKACE-POZADAVKU_MAT_2026-2027_v-revizich-zmen.pdf', 'Specifikace-ve-vazbe-na-nova-RVP-ZV_2026-2027-shrnuti-zmen.pdf'];
  ok(POVINNA_PDF.every(n => pdfs.includes(n) && fs.readFileSync(path.join(ROOT, 'docs/specifikace-2027', n)).subarray(0, 5).toString() === '%PDF-'),
    'oba PDF specifikace od CERMATu jsou v docs/specifikace-2027/ (zdroj pravdy pro body a–h)', 'chybí: ' + POVINNA_PDF.filter(n => !pdfs.includes(n)).join(', '));
}

/* ═══ SABOTÁŽE ═════════════════════════════════════════════════════════════════════════════════════
   Každá vrací zdroj do stavu, který specifikace vypouští (nebo vloží vypuštěné znění). Test musí podle
   znění najít porušení; nezměněný zdroj se tu vůbec nepočítá (uprav() spadne, když se sabotáž neaplikuje). */
console.log('── Sabotáže: vrácená vypuštěná úloha test shodí ──');
const nalezeno = (sber, pravidlo) => sber.some(v => v.hits.has(pravidlo));
const SAB_BANKA = [
  ['rozklad podle vzorce (pozice 3.3)', 'a', s => s.replace("cast33Vytkni('3.3')", "{ key: '3.3', points: 2, prompt: 'Upravte výraz x·(x − 6) + 3² a rozložte na součin pomocí vzorce. Napište číslo, které patří místo otazníku v rozkladu (x − ?)².', ans: '3', sol: ['Rozlož podle vzorce (a − b)².'] }")],
  ['NSN tří čísel (Dlaždice)', 'c', s => s.replace('Nejmenší společný násobek čísel ${a} a ${b} je ${s}', 'Nejmenší společný násobek čísel ${a}, ${b} a 30 je ${s}')],
  ['„dosazovací metodou“ v řešení soustavy', 'g', s => s.replace('Soustavu dvou rovnic lze řešit kteroukoli metodou; ukážeme jednu:', 'Soustavu vyřešíš dosazovací metodou:')],
  ['„sčítací metoda“ v řešení soustavy', 'g', s => s.replace('Soustavu dvou rovnic lze řešit kteroukoli metodou; ukážeme jednu: x se zbavíš', 'Sčítací metoda: x se zbavíš')],
  ['objem válce (těžítko jako válec)', 'e', s => s.replace('pravidelného čtyřbokého hranolu s podstavnou hranou ${A} cm a výškou ${H} cm. Uvnitř těžítka', 'rotačního válce s podstavnou hranou ${A} cm a výškou ${H} cm. Uvnitř těžítka')],
  ['povrch válce (hranol s povrchem → válec)', 'e', s => s.replace('Obsah pláště pravidelného čtyřbokého hranolu je ${k}krát', 'Obsah pláště rotačního válce je ${k}krát').replace('Jaký je povrch hranolu?', 'Jaký je povrch válce?')],
  ['koule (dutina ve tvaru koule)', 'f', s => s.replace('vzduchová dutina ve tvaru krychle', 'vzduchová dutina ve tvaru koule')],
  ['pravidlo odmocňování součinu v bance', 'b', s => s.replace('Odmocnit jde až jedno číslo — nejdřív tedy spočítej, co je pod odmocninou.', 'Odmocnina součinu se dá rozdělit: √(x · y) = √x · √y.')],
  ['tečna v bance', 'd-tecna', s => s.replace('Skleněné těžítko má tvar', 'Přímka je tečnou kružnice. Skleněné těžítko má tvar')],
];
for (const [nazev, pravidlo, fn] of SAB_BANKA) {
  let chyceno = false, pozn = '';
  try { chyceno = nalezeno([...sberBanku(nactiBanku(fn, nazev)).varianty.values()].filter(v => !(SPORNE_BANKA[v.nazev] || []).includes(pravidlo)), pravidlo); } catch (e) { pozn = e.message; }
  ok(chyceno, 'sabotáž banky: ' + nazev + ' → test ji najde (bod ' + pravidlo + ')', pozn);
}
const SAB_ZAKLAD = [
  ['odmocňování součinu jako postup (základ)', 'b', s => s.replace("'Hledáš číslo, které po vynásobení samo sebou dá ' + cz(rad) + '. U desetinných čísel", "'Odmocnina součinu se dá rozdělit: √(x · y) = √x · √y. U desetinných čísel")],
  ['koule v základu', 'f', s => s.replace("prompt: 'Vypočtěte √' + cz(rad) + '.'", "prompt: 'Koule má obsah ' + cz(rad) + '. Vypočtěte √' + cz(rad) + '.'")],
  ['objem válce v základu', 'e', s => s.replace("prompt: 'Vypočtěte √' + cz(rad) + '.'", "prompt: 'Objem válce je ' + cz(rad) + ' cm³. Vypočtěte √' + cz(rad) + '.'")],
  ['NSD tří čísel v základu', 'c', s => s.replace("prompt: 'Vypočtěte √' + cz(rad) + '.'", "prompt: 'Určete největší společný dělitel čísel 12, 18 a 30 a vypočtěte √' + cz(rad) + '.'")],
];
for (const [nazev, pravidlo, fn] of SAB_ZAKLAD) {
  let chyceno = false, pozn = '';
  try { chyceno = nalezeno(sberZaklad(nactiZaklad(fn, nazev), null).polozky, pravidlo); } catch (e) { pozn = e.message; }
  ok(chyceno, 'sabotáž základu: ' + nazev + ' → test ji najde (bod ' + pravidlo + ')', pozn);
}
const SAB_KONSTR = [
  ['Thaletova kružnice v názvu konstrukce', 'd-thales', s => s.replace("nazev: 'Osa úsečky a kružnice'", "nazev: 'Pravý úhel — Thaletova kružnice'")],
  ['kružnice opsaná trojúhelníku v zadání', 'd-opsana', s => s.replace("text: 'Jsou dány body A a B. Sestrojte všechny body C, pro které je trojúhelník ABC rovnoramenný", "text: 'Je dán trojúhelník ABC. Sestrojte kružnici opsanou trojúhelníku ABC. Sestrojte všechny body C, pro které je trojúhelník ABC rovnoramenný")],
  ['tečna v konstrukci', 'd-tecna', s => s.replace("nazev: 'Kolmice a vzdálenost od přímky'", "nazev: 'Tečna ke kružnici v jejím bodě'")],
];
for (const [nazev, pravidlo, fn] of SAB_KONSTR) {
  let chyceno = false, pozn = '';
  try { chyceno = sberKonstrukce(nactiKonstrukce(fn, nazev)).some(t => t.hits.has(pravidlo) && !(SPORNE_KONSTRUKCE[t.typ] || []).includes(pravidlo)); } catch (e) { pozn = e.message; }
  ok(chyceno, 'sabotáž konstrukcí: ' + nazev + ' → test ji najde (bod ' + pravidlo + ')', pozn);
}
{
  // vrácený vypuštěný typ konstrukce a blok „Rozklad na součin“ na stránce
  let chyceno1 = false;
  try {
    const K = nactiKonstrukce(s => s.replace('const GENERATORY = { osa,', 'const GENERATORY = { thales: osa, osa,'), 'vrácený typ thales');
    chyceno1 = ODEBRANE_TYPY.some(t => K.GENERATORY[t]);
  } catch (e) { /* neaplikováno */ }
  ok(chyceno1, 'sabotáž konstrukcí: vrácený typ „thales“ v GENERATORY → kontrola vypuštěných typů ho vidí');
  const html = cti(P + 'konstrukce.html').replace('<optgroup label="Trojúhelníky">', '<optgroup label="Trojúhelníky">\n<option value="opsana">Kružnice opsaná</option>');
  ok(cti(P + 'konstrukce.html') !== html && ODEBRANE_TYPY.some(t => html.includes('value="' + t + '"')), 'sabotáž stránky: vrácená položka „Kružnice opsaná“ ve výběru typu → kontrola ji vidí');
  const test = cti(P + 'test.html') + '\n<h3>Rozklad na součin</h3>';
  ok(/Rozklad na součin/.test(test) && !/Rozklad na součin/.test(cti(P + 'test.html')), 'sabotáž stránky: blok „Rozklad na součin“ v test.html → kontrola ho vidí');
}
{
  // porušení z příkladů ze specifikace přímo na pravidlech (znění, které žák nesmí vidět)
  const PRIKLADY = [
    ['a', 'Upravte a rozložte na součin užitím vzorce: k² − 36 = (k − ?)·(k + ?).'],
    ['b', 'Vypočtěte √(9/16) a použijte pravidlo √(a/b) = √a / √b.'.replace('√(a/b) = √a / √b', '√(a·b) = √a · √b')],
    ['c', 'Určete NSN(12, 18, 30).'],
    ['c', 'Určete největší společný dělitel čísel 24, 36 a 60.'],
    ['d-tecna', 'Sestrojte tečnu ke kružnici k v jejím bodě T.'],
    ['d-opsana', 'Sestrojte kružnici opsanou trojúhelníku ABC.'],
    ['d-thales', 'Sestrojte Thaletovu kružnici nad průměrem AB.'],
    ['e', 'Vypočtěte objem válce s poloměrem podstavy 3 cm a výškou 10 cm.'],
    ['e', 'Jaký je povrch válce?'],
    ['f', 'Koule má poloměr 3 cm. Jaký je její objem?'],
    ['g', 'Řešte soustavu rovnic dosazovací metodou.'],
    ['g', 'Řešte soustavu rovnic sčítací metodou.'],
  ];
  const nechycene = PRIKLADY.filter(([id, t]) => !porusenia(JSON.stringify(t)).includes(id));
  ok(nechycene.length === 0, 'pravidla a–g poznají znění vypouštěných úloh přímo (' + PRIKLADY.length + ' příkladů)', nechycene.map(x => x[1]).join(' | '));
  const NEMA = ['Umocněte a výsledek zapište bez závorek: (3a − 8)².', 'Upravte a rozložte na součin vytknutím: 3·(x² − 3x) + 5x = x·(3x − ?).',
    'Vypočtěte √0,49.', 'Nejmenší společný násobek čísel 20 a 15 je 60.', 'Řešte soustavu rovnic 2x + y = 5 a x − y = 1.', 'Válcová nádoba má výšku 10 cm.'];
  const planne = NEMA.filter(t => porusenia(JSON.stringify(t)).length);
  ok(planne.length === 0, 'pravidla nehlásí to, co ve specifikaci ZŮSTÁVÁ (umocnění dvojčlenu, vytýkání, √ setin, NSN dvou čísel, soustava, válec bez objemu)', planne.join(' | '));
}

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
