/*
  DOPLŇKY K ŘEŠENÍM PŘIJÍMAČEK — projects/prijimacky-matematika/doplnky.html

  Stránka nese to, co v ručně psaných řešeních chybí nebo je špatně.
  Test hlídá tři věci:

  1) PÁROVÁNÍ — každý odkaz z index.html míří na existující doplněk
     a každý doplněk je z index.html odkázaný. Nový doplněk bez poznámky
     u řádku (nebo naopak) shodí bránu; jinak by na stránce tiše ležel
     text, ke kterému se nikdo nedostane.

  2) GEOMETRIE — obrázky obou konstrukcí se NEBEROU jako pravda.
     Test vytáhne z SVG souřadnice narýsovaných čtyřúhelníků a ověří
     podmínky ze ZADÁNÍ (pravý úhel, rovnoběžnost, střed strany,
     průsečík úhlopříček). Všechny tyhle vlastnosti se zachovávají při
     posunutí, otočení, převrácení i stejnolehlosti, takže je lze
     kontrolovat rovnou v pixelech SVG — není potřeba invertovat
     zobrazení a nedá se tím nic zamluvit.

  3) OBSAH — u každého doplňku je zadání, postup a výsledek; u konstrukcí
     navíc GeoGebra applet i záložní text pro případ, že se nenačte.
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOP = fs.readFileSync(path.join(ROOT, 'projects/prijimacky-matematika/doplnky.html'), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'projects/prijimacky-matematika/index.html'), 'utf8');

let ok = 0, bad = 0;
const t = (podminka, popis) => {
  if (podminka) { ok++; console.log('  ✅ ' + popis); }
  else { bad++; console.log('  ❌ ' + popis); }
};

// ── 1) párování index ↔ doplňky ────────────────────────────────────────────
const idDoplnku = [...DOP.matchAll(/<article class="fix" id="([a-z0-9-]+)"/g)].map(m => m[1]);
const odkazy = [...IDX.matchAll(/href="\.\/doplnky\.html#([a-z0-9-]+)"/g)].map(m => m[1]);

t(idDoplnku.length >= 6, `doplňků na stránce: ${idDoplnku.length} (čekáno ≥ 6)`);
t(odkazy.length >= 6, `odkazů z rozcestníku: ${odkazy.length} (čekáno ≥ 6)`);
t(IDX.includes('href="./doplnky.html"'), 'v úvodní kartě je odkaz na celou stránku doplňků');

const chybiCil = odkazy.filter(a => !idDoplnku.includes(a));
t(chybiCil.length === 0, `všechny odkazy míří na existující doplněk${chybiCil.length ? ' — chybí: ' + chybiCil.join(', ') : ''}`);
const neodkazane = idDoplnku.filter(i => !odkazy.includes(i));
t(neodkazane.length === 0, `žádný doplněk není osiřelý${neodkazane.length ? ' — neodkázané: ' + neodkazane.join(', ') : ''}`);

// každý doplněk má hlavičku, popis co je špatně a výsledek/seznam
for (const id of idDoplnku) {
  const blok = DOP.slice(DOP.indexOf(`id="${id}"`), DOP.indexOf('</article>', DOP.indexOf(`id="${id}"`)));
  t(/<h2>[^<]{8,}<\/h2>/.test(blok), `${id}: má nadpis`);
  t(blok.includes('class="chip'), `${id}: má štítek s rokem/termínem`);
  t(/class="(co|vysledek|pozn)"/.test(blok), `${id}: říká, co je špatně nebo jak to dopadlo`);
}

// ── 2) geometrie z obrázků ─────────────────────────────────────────────────
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const crs = (a, b) => a[0] * b[1] - a[1] * b[0];
const del = a => Math.hypot(a[0], a[1]);
const stred = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const uhelPravy = (u, v) => Math.abs(dot(u, v)) / (del(u) * del(v)) < 0.01;
const rovnobezne = (u, v) => Math.abs(crs(u, v)) / (del(u) * del(v)) < 0.01;
const stejne = (p, q) => del(sub(p, q)) < 1.5;   // v pixelech SVG

function polygony(figId) {
  const i = DOP.indexOf(`id="${figId}"`);
  const konec = DOP.indexOf('</figure>', i);
  return [...DOP.slice(i, konec).matchAll(/<polygon points="([^"]+)"/g)]
    .map(m => m[1].trim().split(/\s+/).map(p => p.split(',').map(Number)));
}

// M9C 2025, úloha 10 — obdélník ABCD, D na p, S střed CD
{
  const P = polygony('obr-m9c-2025-10');
  t(P.length === 2, `M9C 2025/10: dva narýsované obdélníky (nalezeno ${P.length})`);
  const stredy = [];
  P.forEach((pl, n) => {
    t(pl.length === 4, `M9C 2025/10 · řešení ${n + 1}: čtyřúhelník má 4 vrcholy`);
    const [A, B, C, D] = pl;
    t(uhelPravy(sub(A, D), sub(C, D)), `M9C 2025/10 · řešení ${n + 1}: pravý úhel u D (AD ⊥ DC)`);
    t(uhelPravy(sub(D, A), sub(B, A)), `M9C 2025/10 · řešení ${n + 1}: pravý úhel u A`);
    t(rovnobezne(sub(B, A), sub(C, D)), `M9C 2025/10 · řešení ${n + 1}: AB ∥ DC`);
    t(Math.abs(del(sub(B, A)) - del(sub(C, D))) < 1.5, `M9C 2025/10 · řešení ${n + 1}: |AB| = |DC|`);
    stredy.push(stred(C, D));
  });
  t(stejne(P[0][0], P[1][0]), 'M9C 2025/10: oba obdélníky vycházejí ze SPOLEČNÉHO bodu A');
  t(stejne(stredy[0], stredy[1]), 'M9C 2025/10: střed strany CD je u obou řešení týž bod S');
  t(Math.abs(P[0][3][1] - P[1][3][1]) < 1.5, 'M9C 2025/10: oba body D leží na téže vodorovné přímce p');
  t(!stejne(P[0][3], P[1][3]), 'M9C 2025/10: obě řešení jsou různá (D₁ ≠ D₂)');
}

// nanečisto 2025, úloha 10 — pravoúhlý lichoběžník, P průsečík úhlopříček
{
  const P = polygony('obr-nanecisto-2025-10');
  t(P.length === 2, `nanečisto 2025/10: dva narýsované lichoběžníky (nalezeno ${P.length})`);
  const pruseciky = [];
  P.forEach((pl, n) => {
    t(pl.length === 4, `nanečisto 2025/10 · řešení ${n + 1}: čtyřúhelník má 4 vrcholy`);
    const [A, B, C, D] = pl;
    t(uhelPravy(sub(A, D), sub(C, D)), `nanečisto 2025/10 · řešení ${n + 1}: pravý úhel u D`);
    t(rovnobezne(sub(B, A), sub(C, D)), `nanečisto 2025/10 · řešení ${n + 1}: základny AB ∥ CD`);
    t(!rovnobezne(sub(D, A), sub(C, B)), `nanečisto 2025/10 · řešení ${n + 1}: ramena AD a BC rovnoběžná NEJSOU (je to lichoběžník, ne rovnoběžník)`);
    // průsečík úhlopříček AC a BD
    const u = sub(C, A), v = sub(D, B), w = sub(B, A);
    const s = crs(w, v) / crs(u, v);
    pruseciky.push([A[0] + u[0] * s, A[1] + u[1] * s]);
  });
  t(stejne(P[0][0], P[1][0]), 'nanečisto 2025/10: oba lichoběžníky sdílejí bod A');
  t(stejne(P[0][2], P[1][2]), 'nanečisto 2025/10: oba lichoběžníky sdílejí bod C');
  t(stejne(pruseciky[0], pruseciky[1]), 'nanečisto 2025/10: úhlopříčky se u obou řešení protínají v TÉMŽE bodě P');
  t(!stejne(P[0][3], P[1][3]), 'nanečisto 2025/10: obě řešení jsou různá (D₁ ≠ D₂)');
}

// ── 3) obsah doplňků ───────────────────────────────────────────────────────
for (const id of ['m9c-2025-10', 'nanecisto-2025-10']) {
  const blok = DOP.slice(DOP.indexOf(`id="${id}"`), DOP.indexOf('</article>', DOP.indexOf(`id="${id}"`)));
  const kroky = (blok.match(/<li>/g) || []).length;
  t(kroky >= 5, `${id}: postup konstrukce má ${kroky} kroků (čekáno ≥ 5)`);
  t(blok.includes('Thaletov'), `${id}: rozbor jmenuje Thaletovu kružnici`);
  t(blok.includes('class="zadani"'), `${id}: je uvedené zadání úlohy`);
  t(/dvě řešení/.test(blok), `${id}: je uvedeno, že řešení jsou dvě`);
  t(/ggb-(m9c|nan)-fb/.test(blok), `${id}: má záložní text pro nenačtenou GeoGebru`);
}

// dopočty u číselných doplňků musí sedět s klíčem CERMAT
t(/o = 48 cm/.test(DOP), 'M9B 2024/6.2: doplněný obvod 48 cm (klíč)');
t(/12,5 dne → volba B/.test(DOP), 'M9C 2024/16.3: správná volba B (12,5 dne)');
t(/x = −3 — souhlasí s klíčem/.test(DOP), 'M9B 2023/5.1: opravený výsledek x = −3');
t(DOP.includes('zkouška:'), 'M9B 2023/5.1: je připojená zkouška');

// GeoGebra: applet se skládá příkazy, takže nepotřebuje uložený materiál
t(/deployggb\.js/.test(DOP), 'GeoGebra se načítá z oficiálního CDN');
t((DOP.match(/Thales|Circle\(S_0,\s*[AC]\)/g) || []).length >= 2, 'oba applety staví Thaletovu kružnici příkazem');
t(!/materialId/.test(DOP), 'applety nezávisí na uloženém materiálu na geogebra.org');

// desetinná ČÁRKA. Pravidlo se dívá jen na čísla S JEDNOTKOU — „6.2" je
// číslo úlohy a „1.5" v CSS je řádkování, obojí je v pořádku a hlásit to
// by znamenalo křičet vlka. Jednotka za číslem zároveň znamená, že se
// dokument NEMUSÍ zbavovat značek: souřadnice v SVG, šířky čar ani hodnoty
// v CSS za sebou žádné „cm" ani „dne" nemají. Odpadá tím i stahování značek
// regulárním výrazem, které CodeQL (právem) hlásí jako děravou sanitizaci.
{
  const nalezy = [...DOP.matchAll(/\d+\.\d+\s*(cm|mm|dm|km|%|dne|dní|dnů|Kč|litr\w*)\b/g)].map(m => m[0]);
  t(nalezy.length === 0, `čísla s jednotkou mají desetinnou čárku${nalezy.length ? ' — nalezeno: ' + nalezy.join(', ') : ''}`);
  const scarkou = [...DOP.matchAll(/\d+,\d+\s*(cm|dne|%)/g)].length;
  t(scarkou >= 2, `pravidlo má co kontrolovat: ${scarkou} čísel s jednotkou a čárkou`);
}

console.log(`\nDoplňky k přijímačkám: ${ok} ✅ / ${bad} ❌`);
process.exit(bad ? 1 : 0);
