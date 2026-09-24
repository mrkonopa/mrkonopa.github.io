/* ══════════════════════════════════════════════════════════════════
   Test nanečisto: KOLIK variant má každá pozice a KOLIK kroků má postup.

   PROČ ZVLÁŠŤ. Stávající kontroly (`prijimacky-cermat-audit`,
   `prijimacky-postupy`) hlídají, že postup EXISTUJE, že v něm není NaN,
   že má desetinnou čárku a že se poslední krok dopočítá na odpověď.
   Žádná z nich se neptá, kolik má pozice variant ani kolik kroků má
   výklad — jednořádkový postup u úlohy za 6 bodů i pozice s jedinou
   variantou jimi projdou.

   A právě to jsou dvě věci, na kterých se tenhle modul vylepšuje:
   deváťák, který si test dá podruhé, má vidět jiné úlohy, a když se
   splete, má se z rozboru DOZVĚDĚT PROČ, ne jen dostat spočítaný
   příklad.

   PODLAHY JSOU NAMĚŘENÉ, ne vymyšlené, a fungují jako RÁČNA: jak se
   která pozice předělá, její podlaha se zvedne. Snižovat se nesmí —
   to by z testu udělalo dekoraci.

   Počet variant se čte ZE ZDROJÁKU (pole SLOTS), ne z losování:
   sampling by u pozice, která mění formulaci zadání, dával pokaždé jiné
   číslo a test by flakoval.

   Spusť: node tests/prijimacky-variace.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BANKA = path.join(ROOT, 'projects', 'rpg-cermat-9.js');

/* Stuby helperů — banka je čte z globálu (stejně jako ostatní testy). */
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => (n === 1 ? o : (n >= 2 && n <= 4 ? f : m));
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar',
 'svgCuboid', 'svgSloupce', 'svgTezitko'].forEach(f => { global[f] = () => '<svg></svg>'; });
global.window = {};
require(BANKA);
const C = global.window.RPG_CERMAT_9;

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

console.log('\n── Test nanečisto: variace a hloubka postupů ──\n');

/* ── 1. počet variant na pozici (deterministicky ze zdrojáku) ─────── */
const src = fs.readFileSync(BANKA, 'utf8');
const mSlots = /const SLOTS = \[([\s\S]*?)\n  \];/.exec(src);
ok(!!mSlots, 'pole SLOTS se ve zdrojáku našlo');
const skupiny = mSlots ? [...mSlots[1].matchAll(/\[([^\[\]]+)\]/g)]
  .map(m => m[1].split(',').map(s => s.trim()).filter(Boolean)) : [];
ok(skupiny.length === 16, 'SLOTS má 16 pozic', 'nalezeno=' + skupiny.length);

/* Naměřeno 2026-09-13. Pozice se zvedá, jakmile se předělá
   (2026-09-23: pozice 15 → 8 variant, pět nových sad podle ostrých úloh;
   pozice 3 → 6 a 4 → 5 — vytýkání, rozklad po úpravě, zlomky, soustava;
   2026-09-24: pozice 6 → 7, 7 → 6, 8 → 6 a 9 → 6 podle ostrých úloh 6–8
   a Pythagorovy věty vnořené do úlohy). */
const VARIANT = { 1: 8, 2: 6, 3: 6, 4: 5, 5: 3, 6: 7, 7: 6, 8: 6,
  9: 6, 10: 3, 11: 3, 12: 5, 13: 4, 14: 6, 15: 8, 16: 3 };
const maloVariant = [];
skupiny.forEach((g, i) => {
  const p = i + 1;
  if (g.length < VARIANT[p]) maloVariant.push('pozice ' + p + ': ' + g.length + ' < ' + VARIANT[p]);
});
ok(maloVariant.length === 0,
  'každá pozice má aspoň tolik variant, kolik měla naměřeno (celkem ' +
  skupiny.reduce((s, g) => s + g.length, 0) + ' generátorů)', maloVariant.join(' | '));
/* Pojistka proti překlepu v seznamu: kdyby se generátor přejmenoval,
   regex ho sice napočítá, ale funkce by neexistovala a genSlot by spadl.
   Proto se každý název dohledá i jako definice. */
const chybi = [];
skupiny.flat().forEach(jm => {
  if (!new RegExp('function\\s+' + jm + '\\s*\\(').test(src)) chybi.push(jm);
});
ok(chybi.length === 0, 'každý generátor uvedený v SLOTS je v souboru definovaný', chybi.join(', '));

/* ── 2. hloubka postupů (naměřeno na skutečném generování) ─────────── */
const kroky = sol => {
  if (Array.isArray(sol)) return sol.filter(x => typeof x === 'string' && x.trim()).length;
  if (typeof sol !== 'string' || !sol.trim()) return 0;
  return sol.split(/(?<=\.)\s+(?=[A-ZÁ-Ž])/).filter(Boolean).length;
};
/* 🔴 Tvar `sol` se liší podle druhu úlohy: u `mc` je pole seznamem KROKŮ
   jedné úlohy, u `match` seznamem POSTUPŮ k jednotlivým otázkám, u
   `tfgrid` leží postup uvnitř každého tvrzení. Kdo to smíchá, naměří
   u `mc` samé jednokrokové postupy a ohlásí vadu, která tam není. */
const vyklady = t => {
  const v = [];
  if (t.kind === 'match') (t.sol || []).forEach(s => s && v.push(s));
  else if (t.sol) v.push(t.sol);
  (t.parts || []).forEach(p => p.sol && v.push(p.sol));
  (t.statements || []).forEach(s => s && s.sol && v.push(s.sol));
  return v;
};

/* Naměřeno 2026-09-13 přes 3 000 generování na pozici. Pozice 1 je
   předělaná (pravidlo → dosazení → výsledek), proto 3. Ostatní drží
   svůj dnešní stav, aby nemohly klesnout. */
const KROKU = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 3, 7: 3, 8: 3,
  9: 3, 10: 3, 11: 2, 12: 3, 13: 2, 14: 3, 15: 3, 16: 2 };
const BEHU = 1200;
const melke = [];
let videnoVykladu = 0;
for (let i = 0; i < C.slotCount(); i++) {
  const p = i + 1;
  let nej = Infinity, ukazka = '';
  for (let b = 0; b < BEHU; b++) {
    const t = C.genSlot(i);
    vyklady(t).forEach(s => {
      videnoVykladu++;
      const n = kroky(s);
      if (n < nej) { nej = n; ukazka = (Array.isArray(s) ? s[0] : String(s)).slice(0, 60); }
    });
  }
  if (nej < KROKU[p]) melke.push('pozice ' + p + ': nejkratší postup má ' + nej +
    ' kroků (podlaha ' + KROKU[p] + ') — „' + ukazka + '…"');
}
/* Pojistka proti běhu naprázdno: kdyby se `sol` přejmenovalo nebo se
   banka nenačetla, žádný výklad by se nenašel a „0 nálezů" by vypadalo
   jako úspěch. */
ok(videnoVykladu > 30000, 'změřilo se ' + videnoVykladu + ' postupů (podlaha 30 000)',
  'naměřeno=' + videnoVykladu);
ok(melke.length === 0, 'žádná pozice neklesla pod svou naměřenou hloubku postupu',
  melke.slice(0, 3).join(' | '));

/* ── 3. předělané pozice — styl, na který se převádí zbytek ───────
   Tvar postupu je PRAVIDLO → DOSAZENÍ → VÝSLEDEK. Zkontrolovat jde
   ta první část: první krok má něco VYSVĚTLIT, ne rovnou počítat.

   ⚠️ Měří se POČET PÍSMEN, ne to, čím krok začíná. První verze pravidla
   hlásila „začíná číslicí nebo závorkou" a byl to planý poplach: první
   krok u (a+b)² schválně začíná výrazem — „(5 + 5)² NENÍ 5² + 5² —
   druhá mocnina součtu se roznásobuje vzorcem…" — a je to ten
   pedagogicky nejlepší první krok v celé sadě, protože pojmenuje
   klasickou chybu. Naměřeno: první kroky mají 50–103 písmen, kdežto
   holý aritmetický krok („Součin: 3 · 12 = 36.") jich má 6. Podlaha 40
   leží mezi tím s rezervou na obě strany.

   Rozsah 50–103 je PŘEMĚŘENÝ opraveným čítačem (viz níže) — vyšel
   shodně, protože dnešní kroky násobí tečkou `·`, ne `×`. Rozbité
   měřidlo by tedy mlčelo až do prvního kroku, který by `×` použil. */
/* 2026-09-23: pozice 15 má první kroky 76–133 písmen, pozice 3 46–116
   a pozice 4 85–134; nejkratší postup má u všech tří 3 kroky.
   2026-09-24: pozice 6–9 (objem, úhly, obvod, Pythagorova věta) mají první
   kroky 49–180 písmen a nejkratší postup 3 kroky. */
const HOTOVE = [1, 2, 3, 4, 6, 7, 8, 9, 15];
const styl = { celkem: 0, bezVysvetleni: [] };
/* 🔴 NE `[a-zá-žA-ZÁ-Ž]`. Rozsah á–ž je U+00E1–U+017E a obsahuje i ÷
   (U+00F7), rozsah Á–Ž zase × (U+00D7) — čítač písmen by počítal
   znaménka a podlaha by byla měřená rozbitým měřidlem. Nahlásil to
   CodeQL („overly permissive regular expression range") a měl pravdu.
   `\p{L}` je vlastnost Unicode pro písmeno, žádný rozsah. */
const pismen = s => (String(s).match(/\p{L}/gu) || []).length;
HOTOVE.forEach(p => {
  for (let b = 0; b < 1500; b++) {
    vyklady(C.genSlot(p - 1)).forEach(s => {
      styl.celkem++;
      const st = Array.isArray(s) ? s : [s];
      if (pismen(st[0]) < 40) styl.bezVysvetleni.push('pozice ' + p + ': „' + String(st[0]).slice(0, 60) + '"');
    });
  }
});
ok(styl.celkem >= 4000, 'předělané pozice (' + HOTOVE.join(', ') + '): změřeno ' +
  styl.celkem + ' postupů', 'celkem=' + styl.celkem);
ok(styl.bezVysvetleni.length === 0,
  'první krok vysvětluje pravidlo, nepočítá (aspoň 40 písmen; naměřeno 46–180)',
  [...new Set(styl.bezVysvetleni)].slice(0, 3).join(' | '));

/* ── 4. zlomek tvaru n/n v zadání ─────────────────────────────────
   „2 : 7/7" nebo „(4/4 + 2/5) : 5" není matematicky špatně, ale dělení
   jedničkou nezkouší nic a v ostrém zadání by takový zlomek nikdo
   nenapsal — žák to čte jako překlep. Vzniká tím, že se čitatel a
   jmenovatel losují z PŘEKRÝVAJÍCÍCH SE rozsahů; v pozici 2 se to
   takhle objevilo ve třech generátorech nezávisle na sobě.
   Naměřeno po opravě: 0 z 64 000 zadání napříč všemi 16 pozicemi. */
const nn = {};
let videnoZadani = 0;
for (let i = 0; i < C.slotCount(); i++) {
  for (let b = 0; b < 800; b++) {
    const t = C.genSlot(i);
    [t.prompt || '', ...(t.parts || []).map(p => p.prompt),
      ...(t.statements || []).map(s => s && s.text), ...(t.prompts || [])]
      .filter(Boolean).forEach(z => {
        videnoZadani++;
        const re = /(\d+)\/(\d+)/g; let m;
        while ((m = re.exec(z))) if (m[1] === m[2]) { (nn[i + 1] = nn[i + 1] || new Set()).add(z.slice(0, 70)); break; }
      });
  }
}
ok(videnoZadani > 20000, 'prošlo se ' + videnoZadani + ' zadání (podlaha 20 000)',
  'naměřeno=' + videnoZadani);
ok(Object.keys(nn).length === 0, 'v zadání není zlomek tvaru n/n (dělení jedničkou)',
  Object.keys(nn).map(p => 'pozice ' + p + ': ' + [...nn[p]][0]).slice(0, 3).join(' | '));

/* ── 5. zlomek dělený SÁM SEBOU ────────────────────────────────────
   Týž druh prázdnoty jako n/n, jen o krok dál: „6/4 : 6/4" je vždycky 1.
   V pozici 2 (gen2c) se čitatel dělence i dělitele losoval nezávisle ze
   stejného rozsahu, takže to vycházelo v 17 % generování té varianty
   (565 ze 40 000 podúloh pozice 2). Porovnává se HODNOTA (a·d = b·c),
   ne zápis — „2/4 : 1/2" je tatáž prázdnota. Po opravě 0. */
const samoDeleni = {};
let videnoDeleni = 0;
for (let i = 0; i < C.slotCount(); i++) {
  for (let b = 0; b < 800; b++) {
    const t = C.genSlot(i);
    [t.prompt || '', ...(t.parts || []).map(p => p.prompt),
      ...(t.statements || []).map(s => s && s.text), ...(t.prompts || [])]
      .filter(Boolean).forEach(z => {
        const re = /(\d+)\/(\d+)\s*:\s*(\d+)\/(\d+)/g; let m;
        while ((m = re.exec(z))) {
          videnoDeleni++;
          if (m[1] * m[4] === m[2] * m[3]) { (samoDeleni[i + 1] = samoDeleni[i + 1] || new Set()).add(z.slice(0, 70)); break; }
        }
      });
  }
}
/* Pojistka: pravidlo musí dělení zlomků vůbec VIDĚT, jinak by „0 nálezů"
   nic neznamenalo. Naměřeno v šesti bězích 115–149 výskytů na 12 800
   zadání (dělení zlomkem je jen v několika variantách pozice 2); podlaha
   60 leží pod minimem s rezervou, rozbité měřidlo dá 0. */
ok(videnoDeleni > 60, 'dělení zlomkem se v zadáních vyskytlo ' + videnoDeleni + '× (podlaha 60)',
  'naměřeno=' + videnoDeleni);
ok(Object.keys(samoDeleni).length === 0, 'v zadání se zlomek nedělí sám sebou (výsledek by byl vždy 1)',
  Object.keys(samoDeleni).map(p => 'pozice ' + p + ': ' + [...samoDeleni[p]][0]).slice(0, 3).join(' | '));

console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
