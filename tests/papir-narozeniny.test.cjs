/* ══════════════════════════════════════════════════════════════════════
   Papír a Narozeninový paradox — čísla na stránce sedí na výpočet.

   PROČ. Obě stránky jsou odkázané z rozcestníku a neměly ANI JEDEN
   test. Jsou to ukázky, kde je celý obsah JEDNO ČÍSLO — když se
   rozejde s výpočtem, dítě si odnese špatný údaj a nic to nenahlásí.

   Nalezeno takhle: karty v `papir.html` ukazovaly tloušťku papíru pod
   jménem srovnávané věci, takže karta vypadala jako „Vzdálenost
   k Měsíci — 440 000 km". K Měsíci je ale 384 400 km (o 14 % míň)
   a průměr Země je 12 742 km, ne 13 744. Čísla samotná byla správně
   (jsou to tloušťky papíru), špatně bylo, ČEMU se říkala.

   Test je čistě Node — nepotřebuje prohlížeč, běží v „rychlé" části
   brány. Konstanty se čtou přímo ze stránky, takže nejde změnit jednu
   a zapomenout na druhou.

   Spusť: node tests/papir-narozeniny.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

console.log('\n── Papír & Narozeniny ──\n');

/* ═══ PAPÍR ═══ */
const papir = fs.readFileSync(path.join(ROOT, 'projects/papir.html'), 'utf8');

const initM = papir.match(/const INIT_MM\s*=\s*([\d.]+)/);
const maxM = papir.match(/const MAX_FOLDS\s*=\s*(\d+)/);
ok(!!initM && !!maxM, 'papír: INIT_MM a MAX_FOLDS se našly');
const INIT = initM ? parseFloat(initM[1]) : NaN;
const MAX = maxM ? parseInt(maxM[1], 10) : NaN;
ok(INIT === 0.1, `papír: list je 0,1 mm (${INIT})`);

const tloustka = n => INIT * Math.pow(2, n);

/* Rozparsuj tabulku milníků i s pátým sloupcem (skutečná hodnota). */
const blok = papir.slice(papir.indexOf('const MILESTONES'), papir.indexOf('const WOW_MSGS'));
const radky = [...blok.matchAll(/\[\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(null|'[^']*')\s*\]/g)];
ok(radky.length === 11, `papír: 11 milníků (${radky.length})`);

/* Text „440 000 km" → číslo v mm, ať se dá porovnat s výpočtem. */
const naMm = t => {
  const cis = parseFloat(t.replace(/\s| /g, '').replace(',', '.').match(/[\d.]+/)[0]);
  if (/mil\.\s*km/.test(t)) return cis * 1e12;
  if (/km/.test(t)) return cis * 1e6;
  if (/\bm\b/.test(t)) return cis * 1e3;
  if (/cm/.test(t)) return cis * 10;
  return cis;                                   // mm
};

let overeno = 0;
for (const [, nS, , jmeno, popis] of radky) {
  const n = parseInt(nS, 10);
  const uvedeno = naMm(popis), spocteno = tloustka(n);
  const odch = Math.abs(uvedeno - spocteno) / spocteno * 100;
  overeno++;
  /* 4 % pokrývá zaokrouhlení na hezké číslo („430 km" místo 429,5). */
  ok(odch < 4, `papír: „${jmeno}" po ${n} přeloženích sedí na výpočet`,
    `uvedeno ${popis}, vychází ${(spocteno / 1e6).toFixed(1)} km, odchylka ${odch.toFixed(1)} %`);
}
ok(overeno === 11, `papír: proměřeno všech 11 milníků (${overeno})`);
ok(radky.length ? parseInt(radky[radky.length - 1][1], 10) === MAX : false,
  'papír: poslední milník je na MAX_FOLDS');

/* Skutečné hodnoty ve srovnání musí sedět na realitu — právě tenhle
   sloupec vznikl kvůli tomu, že se dřív ukazovala tloušťka papíru
   pod jménem srovnávané věci. */
const SKUTECNOST = {
  'Průměr Země': 12742e6, 'Vzdálenost k Měsíci': 384400e6, 'Za Sluncem': 149.6e12,
  'Oběžná dráha ISS': 420e6, 'Eiffelova věž': 330e3,
};
let srovnano = 0;
for (const [, , , jmeno, , skut] of radky) {
  const cekano = SKUTECNOST[jmeno]; if (!cekano) continue;
  srovnano++;
  const uv = skut === 'null' ? null : skut.replace(/^'|'$/g, '');
  if (!uv) { ok(false, `papír: „${jmeno}" neuvádí skutečnou hodnotu`); continue; }
  const v = naMm(uv), odch = Math.abs(v - cekano) / cekano * 100;
  ok(odch < 3, `papír: skutečná hodnota u „${jmeno}" odpovídá realitě`,
    `uvedeno ${uv}, správně ${(cekano / 1e6).toLocaleString('cs-CZ')} km, odchylka ${odch.toFixed(1)} %`);
}
ok(srovnano === 5, `papír: proměřeno 5 skutečných hodnot (${srovnano})`);

/* ═══ NAROZENINY ═══ */
const nar = fs.readFileSync(path.join(ROOT, 'projects/narozeniny.html'), 'utf8');
const fn = nar.match(/function calcProb\(n\)\s*\{([\s\S]*?)\n\}/);
ok(!!fn, 'narozeniny: calcProb se našla');
if (fn) {
  const calcProb = new Function('n', fn[1]);
  /* Kanonické hodnoty narozeninového paradoxu. Kdyby někdo zaměnil
     365 za 366 nebo otočil `1 - p`, tohle to pozná. */
  const CEKANO = [[10, 11.69], [23, 50.73], [30, 70.63], [50, 97.04], [70, 99.92]];
  for (const [n, pct] of CEKANO) {
    const v = calcProb(n) * 100;
    ok(Math.abs(v - pct) < 0.05, `narozeniny: P(shoda) pro ${n} osob je ${pct} %`, `vyšlo ${v.toFixed(2)} %`);
  }
  ok(calcProb(1) < 1e-9, 'narozeniny: jeden člověk nemá s kým mít shodu');
  ok(calcProb(366) > 0.9999, 'narozeniny: 366 lidí má shodu jistě (Dirichlet)');
}

console.log(`\n  Papír & Narozeniny: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
