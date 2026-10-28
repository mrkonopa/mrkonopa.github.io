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
t(/o = 48(?: |&nbsp;)cm/.test(DOP), 'M9B 2024/6.2: doplněný obvod 48 cm (klíč)');
t(/12,5 dne → volba B/.test(DOP), 'M9C 2024/16.3: správná volba B (12,5 dne)');
t(/x = −3 — souhlasí s klíčem/.test(DOP), 'M9B 2023/5.1: opravený výsledek x = −3');
t(DOP.includes('zkouška:'), 'M9B 2023/5.1: je připojená zkouška');

// Opravy z kontroly 2020–2022 (28. 10. 2026). Správné řešení se dopočítá ze ZADÁNÍ, ne z textu stránky,
// a stránka musí uvádět právě to číslo, které rovnici splňuje (a Vojtovo původní ne).
{
  const L = x => 5 * (0.2 * x + 1), P = x => (8 - 6 * x) / 2;          // M9B 2022, úloha 5.1
  t(Math.abs(L(-0.25) - P(-0.25)) < 1e-12 && Math.abs(L(0.25) - P(0.25)) > 1e-6,
    'M9B 2022/5.1: x = −1/4 splňuje zadanou rovnici, původní x = 1/4 ne');
  t(/x = −1\/4 — souhlasí s klíčem/.test(DOP) && /x \+ 3x\s+= 4 − 5/.test(DOP), 'M9B 2022/5.1: stránka uvádí x = −1/4 a opravený krok 4 − 5');
  const sq = y => (y - 0.5) ** 2, ok = y => y * y - y + 0.25, spatne = y => y * y - y - 0.25;   // M9B 2021, úloha 4.2
  const ys = [-3, -1, 0, 0.5, 2, 7];
  t(ys.every(y => Math.abs(sq(y) - ok(y)) < 1e-12) && ys.some(y => Math.abs(sq(y) - spatne(y)) > 1e-6),
    'M9B 2021/4.2: (y − 1/2)² = y² − y + 1/4, původní y² − y − 1/4 ne');
  t(/y² − y \+ 1\/4 — souhlasí s klíčem/.test(DOP), 'M9B 2021/4.2: stránka uvádí y² − y + 1/4');
  t(/2022 · 1\. řádný \(M9A\), úloha 13/.test(DOP) && /62,8(?: |&nbsp;):(?: |&nbsp;)5 = 12,56/.test(DOP) && /2022 · 1\. řádný \(M9A\), úloha 14/.test(DOP)
    && /2021 · 1\. řádný \(M9A\), úloha 7\.3/.test(DOP), 'drobnosti z kontroly 2020–2022 (M9A 2022/13, 14, M9A 2021/7.3) jsou vypsané');
}

// Opravy z kontroly 2023–2025 (28. 10. 2026): jedno číslo přepsané do odpovědi a osm konstrukcí od ruky, u nichž hledaný
// bod vycházel víc než půl centimetru vedle. Obrázek se NEBERE jako pravda: souřadnice se vytáhnou z SVG a podmínky
// ze ZADÁNÍ (vzdálenosti, rovnoběžnost, poloha bodů) se ověří znovu. Zadané body nesou data-bod, přímky data-primka,
// kružnice data-kruznice, takže test nepotřebuje znát, jak obrázek vznikl.
{
  const T = 35100, J = T + 16000;
  t(T + J === 86200 && J - T === 16000 && 35200 + (35200 + 16000) !== 86200, 'M9C 2024/1: Třebíč má 35 100 (splňuje zadání), 35 200 ne');
  t(/35(?: |&nbsp;)100 obyvatel — souhlasí s klíčem/.test(DOP), 'M9C 2024/1: stránka uvádí 35 100');
  t(600000 / 20000 === 30 && 200000 / 20000 === 10 && 30 - 10 === 20, 'M9A 2023/11.2: 200 000 cm : 20 000 = 10 cm, rozdíl 20 cm');
  t(/2023 · 1\. řádný \(M9A\), úloha 11\.2/.test(DOP) && /2023 · 2\. řádný \(M9B\), úloha 16</.test(DOP)
    && /2025 · 1\. řádný \(M9A\), úloha 13/.test(DOP) && /2025 · 2\. náhradní \(M9D\), úloha 8\.2/.test(DOP), 'drobnosti z kontroly 2023–2025 jsou vypsané');
  t(8 * 8 === 64 && 13 + 13 + 12 + 2 === 40 && 13 + 13 + 12 + 5 !== 40, 'M9B 2023/16 a M9D 2025/8.2: opravené mezikroky (64; 13 + 13 + 12 + 2 = 40)');

  const fg = fid => { const i = DOP.indexOf(`id="${fid}"`); return i < 0 ? '' : DOP.slice(i, DOP.indexOf('</figure>', i)); };
  const bd = (fid, n) => { const m = fg(fid).match(new RegExp(`<circle data-bod="${n}" cx="([\\d.]+)" cy="([\\d.]+)"`)); return m ? [+m[1], +m[2]] : null; };
  const primka = (fid, n) => { const m = fg(fid).match(new RegExp(`<line data-primka="${n}" x1="([\\d.]+)" y1="([\\d.]+)" x2="([\\d.]+)" y2="([\\d.]+)"`)); return m ? [[+m[1], +m[2]], [+m[3], +m[4]]] : null; };
  const kruz = (fid, n) => { const m = fg(fid).match(new RegExp(`<circle data-kruznice="${n}" cx="([\\d.]+)" cy="([\\d.]+)" r="([\\d.]+)"`)); return m ? { s: [+m[1], +m[2]], r: +m[3] } : null; };
  const vzdPrimky = (P, a, b) => Math.abs(crs(sub(b, a), sub(P, a))) / del(sub(b, a));
  const shodne = (a, b, tol = 1.5) => Math.abs(a - b) < tol;
  const rovnobeznik = (A, B, C, D) => rovnobezne(sub(B, A), sub(C, D)) && rovnobezne(sub(D, A), sub(C, B)) && shodne(del(sub(B, A)), del(sub(C, D)));
  const uvnitrUsecky = (X, a, b) => vzdPrimky(X, a, b) < 1.5 && dot(sub(X, a), sub(b, a)) > 0 && dot(sub(X, b), sub(a, b)) > 0;

  // M9B 2025, ú. 9 — rovnoramenný ABC, M na těžnici t_c (M není těžiště)
  {
    const F = 'obr-m9b-2025-9', P = polygony(F);
    const [A, B, M, S] = ['A', 'B', 'M', 'S'].map(n => bd(F, n));
    t(P.length === 2 && [A, B, M, S].every(Boolean), 'M9B 2025/9: dvě řešení a zadané body A, B, M v obrázku');
    if (P.length === 2 && A && M && S) {
      t(shodne(del(sub(P[0][2], A)), del(sub(B, A))), 'M9B 2025/9 · C₁: |AC₁| = |AB|');
      t(shodne(del(sub(P[1][2], B)), del(sub(B, A))), 'M9B 2025/9 · C₂: |BC₂| = |AB|');
      t(stejne(S, stred(A, B)), 'M9B 2025/9: S je střed AB (těžnice vede středem strany)');
      P.forEach((pl, n) => {
        const C = pl[2], k = dot(sub(M, S), sub(C, S)) / dot(sub(C, S), sub(C, S));
        t(rovnobezne(sub(C, S), sub(M, S)), `M9B 2025/9 · řešení ${n + 1}: C leží na přímce SM`);
        t(k > 0.05 && k < 0.95, `M9B 2025/9 · řešení ${n + 1}: M leží uvnitř těžnice SC`);
        t(Math.abs(k - 1 / 3) > 0.05, `M9B 2025/9 · řešení ${n + 1}: M není těžiště`);
      });
      t(!uhelPravy(sub(M, S), sub(B, A)), 'M9B 2025/9: těžnice SM není kolmá k AB, takže řešení |CA| = |CB| neexistuje');
      t(!stejne(P[0][2], P[1][2]), 'M9B 2025/9: obě řešení jsou různá');
    }
  }

  // M9B 2025, ú. 10 — rovnoběžník ABCD, úhlopříčka BD na polopřímce DM, |AC| = |DM|
  {
    const F = 'obr-m9b-2025-10', P = polygony(F);
    const [D, A, M, S] = ['D', 'A', 'M', 'S'].map(n => bd(F, n));
    t(P.length === 1 && P[0].length === 4 && [D, A, M, S].every(Boolean), 'M9B 2025/10: jeden rovnoběžník a zadané body A, D, M');
    if (P.length === 1 && A && D && M && S) {
      const [A_, B, C, D_] = P[0];
      t(stejne(A_, A) && stejne(D_, D), 'M9B 2025/10: vrcholy A, D jsou zadané body');
      t(rovnobeznik(A_, B, C, D_), 'M9B 2025/10: ABCD je rovnoběžník');
      t(rovnobezne(sub(B, D), sub(M, D)) && dot(sub(B, D), sub(M, D)) > 0, 'M9B 2025/10: úhlopříčka BD leží na polopřímce DM');
      t(shodne(del(sub(C, A_)), del(sub(M, D))), 'M9B 2025/10: |AC| = |DM|');
      t(stejne(S, stred(A_, C)) && stejne(S, stred(B, D_)), 'M9B 2025/10: S je střed obou úhlopříček');
      // jedinost řešení: kružnice (A; |DM|/2) protíná přímku DM v bodech s parametry s1 > 0 > s2 od D
      const l = del(sub(M, D)), e = [(M[0] - D[0]) / l, (M[1] - D[1]) / l], w = sub(D, A), r = l / 2;
      const b = 2 * dot(w, e), c = dot(w, w) - r * r, disc = b * b - 4 * c;
      t(disc > 0 && (-b + Math.sqrt(disc)) / 2 > 0 && (-b - Math.sqrt(disc)) / 2 < 0, 'M9B 2025/10: právě jeden průsečík leží na polopřímce DM (řešení je jediné)');
    }
  }

  // M9D 2025, ú. 10 — rovnoběžník KLMN, S na p, |LM| = |LN|
  {
    const F = 'obr-m9d-2025-10', P = polygony(F), p = primka(F, 'p');
    const L = bd(F, 'L'), M = bd(F, 'M');
    t(P.length === 2 && p && L && M, 'M9D 2025/10: dvě řešení, přímka p a zadané body L, M');
    if (P.length === 2 && p && L && M) {
      t(vzdPrimky(M, p[0], p[1]) < 1.5, 'M9D 2025/10: přímka p prochází bodem M');
      P.forEach((pl, n) => {
        const [K, L_, M_, N] = pl, S = stred(L_, N), pre = `M9D 2025/10 · řešení ${n + 1}`;
        t(stejne(L_, L) && stejne(M_, M), `${pre}: L, M jsou zadané body`);
        t(rovnobeznik(K, L_, M_, N), `${pre}: KLMN je rovnoběžník`);
        t(shodne(del(sub(M_, L_)), del(sub(N, L_))), `${pre}: |LM| = |LN|`);
        t(vzdPrimky(S, p[0], p[1]) < 1.5, `${pre}: střed S leží na přímce p`);
        t(stejne(S, stred(K, M_)), `${pre}: S je i středem úhlopříčky KM`);
      });
      t(!stejne(P[0][0], P[1][0]) && !stejne(P[0][3], P[1][3]), 'M9D 2025/10: obě řešení jsou různá');
    }
  }

  // nanečisto 2025, ú. 9 — středová souměrnost se středem S
  {
    const F = 'obr-nanecisto-2025-9', P = polygony(F);
    t(P.length === 2 && P[0].length === 3 && P[1].length === 3, 'nanečisto 2025/9: trojúhelník ABC a jeho obraz A′B′C′');
    if (P.length === 2) {
      const [A, B, C] = P[0], [Ap, Bp, Cp] = P[1], S = bd(F, 'S');
      t(uvnitrUsecky(Ap, B, C), 'nanečisto 2025/9: bod A′ leží na straně BC');
      t(stejne(stred(A, Ap), stred(B, Bp)) && stejne(stred(B, Bp), stred(C, Cp)), 'nanečisto 2025/9: středy úseček AA′, BB′, CC′ splývají');
      t(S && stejne(S, stred(A, Ap)), 'nanečisto 2025/9: tím společným středem je S');
      t(!stejne(Bp, B) && !stejne(Cp, C), 'nanečisto 2025/9: obraz není shodný s původním trojúhelníkem');
    }
  }

  // M9B 2024, ú. 10 — rovnoramenný KLM se základnou LM a vrcholem M na kružnici k
  {
    const F = 'obr-m9b-2024-10', P = polygony(F), k = kruz(F, 'k'), K = bd(F, 'K'), L = bd(F, 'L');
    t(P.length === 2 && k && K && L, 'M9B 2024/10: dvě řešení, kružnice k a zadané body K, L');
    if (P.length === 2 && k && K && L) {
      P.forEach((pl, n) => {
        const [K_, L_, M] = pl, pre = `M9B 2024/10 · řešení ${n + 1}`;
        t(stejne(K_, K) && stejne(L_, L), `${pre}: K, L jsou zadané body`);
        t(shodne(del(sub(M, K)), del(sub(L, K))), `${pre}: ramena |KM| = |KL|`);
        t(shodne(del(sub(M, k.s)), k.r), `${pre}: M leží na kružnici k`);
      });
      t(!stejne(P[0][2], P[1][2]), 'M9B 2024/10: obě řešení jsou různá');
    }
  }

  // M9A 2022, ú. 9 — rovnoramenný ABC (základna AB), S střed ramene, jeden z vrcholů A, B na q
  {
    const F = 'obr-m9a-2022-9', P = polygony(F), q = primka(F, 'q');
    const C = bd(F, 'C'), S = bd(F, 'S'), X = bd(F, 'X');
    t(P.length === 2 && q && C && S && X, 'M9A 2022/9: dvě řešení, přímka q a zadané body C, S');
    if (P.length === 2 && q && C && S && X) {
      t(stejne(S, stred(C, X)), 'M9A 2022/9: S je střed ramene CX');
      t(vzdPrimky(X, q[0], q[1]) > 5, 'M9A 2022/9: pevný vrchol X na q neleží (na q leží druhý vrchol)');
      P.forEach((pl, n) => {
        const Y = n === 0 ? pl[1] : pl[2], pre = `M9A 2022/9 · řešení ${n + 1}`;
        t(shodne(del(sub(Y, C)), del(sub(X, C))), `${pre}: ramena |CY| = |CX|`);
        t(vzdPrimky(Y, q[0], q[1]) < 1.5, `${pre}: vrchol Y leží na přímce q`);
      });
      t(!stejne(P[0][1], P[1][2]), 'M9A 2022/9: obě řešení jsou různá');
    }
  }

  // M9B 2021, ú. 10 — rovnoběžník ABCD, |BD| = |AD|, výška na AB je 5 cm
  {
    const F = 'obr-m9b-2021-10', P = polygony(F), pxcm = +((fg(F).match(/data-pxcm="([\d.]+)"/) || [])[1]);
    const M = bd(F, 'M'), N = bd(F, 'N');
    t(P.length === 1 && P[0].length === 4 && M && N && pxcm > 0, 'M9B 2021/10: jeden rovnoběžník, zadané body M, N a měřítko v cm');
    if (P.length === 1 && M && N && pxcm > 0) {
      const [A, B, C, D] = P[0];
      t(rovnobeznik(A, B, C, D), 'M9B 2021/10: ABCD je rovnoběžník');
      t(shodne(del(sub(B, D)), del(sub(A, D))), 'M9B 2021/10: |BD| = |AD|');
      t(shodne(vzdPrimky(D, A, B) / pxcm, 5, 0.05), 'M9B 2021/10: výška na stranu AB měří 5 cm');
      t(uvnitrUsecky(M, A, B) && uvnitrUsecky(N, A, D), 'M9B 2021/10: M leží uvnitř strany AB a N uvnitř strany AD');
    }
  }

  // M9C 2021, ú. 10 — L je střed vepsané kružnice trojúhelníku ABC
  {
    const F = 'obr-m9c-2021-10', P = polygony(F), L = bd(F, 'L');
    t(P.length === 1 && P[0].length === 3 && L, 'M9C 2021/10: jeden trojúhelník a zadaný bod L');
    if (P.length === 1 && L) {
      const [A, B, C] = P[0], uhel = (V, X, Y) => Math.acos(dot(sub(X, V), sub(Y, V)) / (del(sub(X, V)) * del(sub(Y, V))));
      t(shodne(vzdPrimky(L, A, B), vzdPrimky(L, B, C)) && shodne(vzdPrimky(L, B, C), vzdPrimky(L, C, A)), 'M9C 2021/10: L je od všech tří stran stejně daleko');
      t(Math.abs(uhel(A, B, L) - uhel(A, L, C)) < 0.01 && Math.abs(uhel(B, A, L) - uhel(B, L, C)) < 0.01, 'M9C 2021/10: AL půlí úhel BAC a BL půlí úhel ABC');
      const s = [crs(sub(B, A), sub(L, A)), crs(sub(C, B), sub(L, B)), crs(sub(A, C), sub(L, C))];
      t(s.every(v => v > 0) || s.every(v => v < 0), 'M9C 2021/10: L leží uvnitř trojúhelníku');
    }
  }

  // obsah nových doplňků
  for (const id of ['m9b-2025-9', 'm9b-2025-10', 'm9d-2025-10', 'nanecisto-2025-9', 'm9b-2024-10', 'm9a-2022-9', 'm9b-2021-10', 'm9c-2021-10']) {
    const i = DOP.indexOf(`id="${id}"`), blok = i < 0 ? '' : DOP.slice(i, DOP.indexOf('</article>', i));
    t((blok.match(/<li>/g) || []).length >= 4, `${id}: postup konstrukce má aspoň 4 kroky`);
    t(blok.includes('class="zadani"') && blok.includes('<h3 class="krok">Rozbor</h3>'), `${id}: je uvedené zadání i rozbor`);
    t(/<svg viewBox="0 0 \d+ \d+"/.test(blok) && /<figcaption>/.test(blok), `${id}: má obrázek s popiskem`);
    t(/<p class="co">[^]*?(?:mm|cm|%|°)[^]*?<\/p>/.test(blok), `${id}: říká, o kolik se ruční konstrukce lišila`);
    t(/Úloha má (?:jedno|dvě) řešení\./.test(blok), `${id}: uvádí počet řešení`);
  }
}

// GeoGebra: applet se skládá příkazy, takže nepotřebuje uložený materiál
t(/deployggb\.js/.test(DOP), 'GeoGebra se načítá z oficiálního CDN');
t((DOP.match(/Thales|Circle\(S_0,\s*[AC]\)/g) || []).length >= 2, 'oba applety staví Thaletovu kružnici příkazem');
t(!/materialId/.test(DOP), 'applety nezávisí na uloženém materiálu na geogebra.org');

// GeoGebra se NESMÍ načítat sama od sebe. Applet vkládá do stránky vlastní
// ovládací prvky bez přístupného jména, takže s ním audit přístupnosti spadne
// — a co hůř, spadne jen tam, kde je geogebra.org dostupná. Přesně tenhle
// rozdíl shodil CI, zatímco v sandboxu (kde je doména blokovaná) audit
// procházel. Výsledek auditu nesmí záviset na dostupnosti cizího serveru.
{
  // Jediný skript se `src` je vlastní motiv.js (přepínač vzhledu, běží synchronně v <head>). Cokoli jiného — zvlášť z cizího serveru — shodí test.
  const skripty = [...DOP.matchAll(/<script[^>]+\bsrc=["']([^"']+)["']/gi)].map(m => m[1]);
  t(skripty.every(u => u === 'motiv.js'), 'stránka při otevření nestahuje žádný cizí skript (jen vlastní motiv.js)' + (skripty.some(u => u !== 'motiv.js') ? ' — našel: ' + skripty.join(', ') : ''));
  // POZOR: počítej skutečné NAČTENÍ, ne zmínky. Název souboru je i v komentáři
  // a v chybové hlášce a hlásit je znamená chybu v měřidle, ne na stránce.
  const nacteni = [...DOP.matchAll(/\.src\s*=\s*'https:\/\/www\.geogebra\.org\/apps\/deployggb\.js'/g)];
  t(nacteni.length === 1, `deployggb.js se načítá z jediného místa (nalezeno ${nacteni.length})`);
  const iKnihovna = DOP.indexOf('function knihovna');
  t(iKnihovna > 0 && nacteni.length === 1 && nacteni[0].index > iKnihovna,
    'deployggb.js se stahuje až uvnitř knihovna(), kterou volá obsluha kliknutí');
  t(/addEventListener\('click'/.test(DOP), 'applet spouští kliknutí, ne načtení stránky');
  for (const kod of ['m9c', 'nan']) {
    t(new RegExp(`class="ggb-btn" data-ggb="${kod}"`).test(DOP), `${kod}: má tlačítko ke spuštění appletu`);
  }
  t(/<button[^>]*class="ggb-btn"[^>]*>\s*[^<\s][^<]*</.test(DOP), 'tlačítko má text, tedy přístupné jméno');
}

// GeoGebra applety musí ukázat TOTÉŽ co obrázek: oba čtyřúhelníky a Thaletovu kružnici.
// Vojta nahlásil, že body v appletu nejsou spojené do tvarů. Ověřeno na jádru GeoGebry
// (offline balík z npm): SetColor s čísly bere složky 0–1, takže „26,115,200" dalo bílou
// (#FFFFFF) — mnohoúhelníky, jejich strany i kružnice byly na bílé nákresně neviditelné.
// Navíc ZoomIn s pevným oknem dával ose x a y jiné měřítko (kružnice jako elipsa) a ⟳
// GeoGebry smazal celou konstrukci (26 objektů → 0). Applet tu nejde spustit (geogebra.org
// není v CI k dispozici), proto se hlídají příkazy a funkce postav() se pustí nad záznamníkem.
{
  const blok = DOP.slice(DOP.indexOf('var APPLETY = {') + 'var APPLETY = '.length, DOP.indexOf('var nacitaSe'));
  const APPLETY = new Function('return ' + blok.trim().replace(/;\s*$/, ''))();
  const kody = Object.keys(APPLETY);
  t(kody.length === 2, `applety: ${kody.join(', ')}`);
  const clanky = DOP.split('<article').slice(1);
  for (const kod of kody) {
    const cfg = APPLETY[kod], p = cfg.prikazy.join('\n');
    const barvy = cfg.prikazy.filter(c => /^SetColor\(/.test(c));
    const spatne = barvy.filter(c => !/^SetColor\(\w+,\s*"#[0-9A-Fa-f]{6}"\)$/.test(c));
    t(barvy.length >= 3 && spatne.length === 0, `${kod}: barvy hexem — GeoGebra bere čísla jen 0–1 (${barvy.length} SetColor${spatne.length ? ', špatně: ' + spatne.join(' ') : ''})`);
    t(!/ZoomIn\(/.test(p) && Array.isArray(cfg.okno) && cfg.okno.length === 4 && cfg.okno[0] < cfg.okno[2] && cfg.okno[1] < cfg.okno[3],
      `${kod}: okno konstrukce je v cfg.okno, ne v ZoomIn (ten dá osám různé měřítko)`);
    // tvary z popisku obrázku („AB₁C₁D₁") musí být v appletu jako Polygon se stejnými vrcholy
    const cl = clanky.find(c => c.includes(`id="ggb-${kod}"`)) || '';
    const popis = (cl.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [, ''])[1];
    const tvary = [...popis.matchAll(/<b[^>]*>([A-Z₀-₉]+)<\/b>/g)].map(m => [...m[1].matchAll(/[A-Z][₀-₉]*/g)]
      .map(v => v[0].replace(/[₀-₉]/g, d => '_' + '₀₁₂₃₄₅₆₇₈₉'.indexOf(d))));
    const poly = [...p.matchAll(/Polygon\(([^)]*)\)/g)].map(m => m[1].split(',').map(s => s.trim()));
    const stejne = (a, b) => a.length === b.length && [...Array(a.length).keys()].some(o => [b, [...b].reverse()].some(c => a.every((v, i) => v === c[(i + o) % c.length])));
    const chybi = tvary.filter(tv => !poly.some(pl => stejne(tv, pl)));
    t(tvary.length === 2 && chybi.length === 0, `${kod}: oba tvary z obrázku (${tvary.map(v => v.join('')).join(', ')}) jsou v appletu jako mnohoúhelník${chybi.length ? ' — chybí ' + chybi.map(v => v.join('')).join(', ') : ''}`);
    t(/Thaletov/.test(popis) && /=Circle\(/.test(p), `${kod}: Thaletova kružnice z obrázku je i v appletu`);
  }
  t(/showResetIcon:\s*false/.test(DOP) && /if \(API\[kod\]\) return postav\(API\[kod\], cfg\);/.test(DOP),
    'místo ⟳ GeoGebry (maže konstrukci) postaví tlačítko konstrukci znovu');
  t(/appName:\s*'classic',\s*perspective:\s*'G'/.test(DOP), 'applet je jen nákresna (bez panelu algebry přes třetinu šířky)');

  // postav() nad záznamníkem: celá konstrukce znovu, stejné měřítko os, popisky bodů
  const i0 = DOP.indexOf('function postav(api, cfg) {');
  let i = DOP.indexOf('{', i0), hl = 0;
  for (; i < DOP.length; i++) { if (DOP[i] === '{') hl++; else if (DOP[i] === '}' && --hl === 0) break; }
  const postav = i0 > 0 ? new Function(DOP.slice(i0, i + 1) + '\nreturn postav;')() : null;
  t(!!postav, 'funkce postav() je ve stránce');
  if (postav) for (const kod of kody) {
    const cfg = APPLETY[kod], log = [], W = 818, H = 428;
    const typy = { A: 'point', B_1: 'point', k: 'circle', lich1: 'quadrilateral' };
    const api = { newConstruction: () => log.push('nova'), evalCommand: c => { log.push(c); return true; },
      setAxesVisible: (x, y) => log.push('osy ' + x + y), setGridVisible: g => log.push('mrizka ' + g),
      getAllObjectNames: () => Object.keys(typy), getObjectType: n => typy[n], setLabelVisible: (n, v) => log.push('popisek ' + n + ' ' + v),
      getViewProperties: () => JSON.stringify({ width: W, height: H }), setCoordSystem: (...a) => log.push(a) };
    postav(api, cfg); postav(api, cfg);
    const sys = log.filter(x => Array.isArray(x));
    const [x0, x1, y0, y1] = sys[0] || [0, 0, 0, 0], o = cfg.okno;
    t(log[0] === 'nova' && log.filter(x => x === 'nova').length === 2 && cfg.prikazy.every(c => log.filter(x => x === c).length === 2),
      `${kod}: druhé postavení (tlačítko) projde celou konstrukci znovu od prázdné nákresny`);
    t(sys.length === 2 && Math.abs((x1 - x0) / W - (y1 - y0) / H) < 1e-9 && x0 <= o[0] && x1 >= o[2] && y0 <= o[1] && y1 >= o[3],
      `${kod}: osy mají stejné měřítko a celé okno konstrukce je vidět`);
    t(log.includes('popisek A true') && log.includes('popisek B_1 true') && !log.some(x => /popisek (k|lich1)/.test(x)) && log.includes('osy falsefalse') && log.includes('mrizka false'),
      `${kod}: popisky jen u bodů, bez os a mřížky`);
  }
}

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
