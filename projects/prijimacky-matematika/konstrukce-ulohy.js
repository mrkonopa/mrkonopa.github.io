/* ══════════════════════════════════════════════════════════════════
   KONSTRUKČNÍ ÚLOHY — generátory podle ostrých testů (úlohy 9 a 10)

   V archivu 74 konstrukčních úloh M9 (2015–2026, přehled pokrytí v
   tools/cermat-archiv/konstrukce-m9.json): nejčastěji úhel, trojúhelník,
   „najděte všechna řešení“, souměrnost,
   obdélník a rovnoběžník. Každý typ tady cvičí jednu množinu bodů, na
   které konstrukce stojí: osu úsečky, kružnici,
   rovnoběžky v dané vzdálenosti, osovou souměrnost a rovnoběžník.

   Typy 7–34 jsou CELÉ ÚTVARY jako v ostrém testu — každý podle jiné ostré
   úlohy z archivu M9 2015–2026 a M7 (zdroj je u každého typu): obdélníky,
   čtverce, kosočtverce, lichoběžníky, trojúhelníky s těžnicí, výškou,
   těžištěm nebo průsečíkem výšek, souměrnosti, osa úhlu
   i úlohy se dvěma a třemi řešeními. Z nich se losují úlohy 9 a 10 testu
   nanečisto (`proTest`). Zadání jsou vlastní, ne opsaná z CERMATu, ale ve
   stejné stavbě. Typy 35–40 mají úhel daný ve stupních (30° až 135°) a
   rýsují se úhloměrem z kreslicího okna; v archivu jich je 10 z ~200.

   Úloha = { typ, nazev, text, dane, hledane, reseni[], pomocne[],
             postup[{text, tvary}], napovedy[3], tol }
   `reseni` jsou VŠECHNA řešení (každé = {jméno bodu: souřadnice});
   `pomocne` jsou body, které na papíře vzniknou cestou (střed úsečky,
   paty kolmic) — hodnocení je nepočítá jako body navíc.
   Čísla se losují, takže každý žák dostane jiné zadání.
   ══════════════════════════════════════════════════════════════════ */
/* Specifikace CERMAT 2026/2027 vypouští z konstrukcí tečnu ke kružnici v jejím bodě, kružnici opsanou
   trojúhelníku a Thaletovu kružnici při konstrukci pravoúhlého trojúhelníku. Z banky proto zmizelo devět
   typů: pět celých o tom (thales, dveThalet, thalesQ, opsana, ctverecVepsany) a čtyři, které bez Thaletovy
   kružnice (nebo kružnice procházející třemi body) nejdou (obdelnikStrana, pravouhlyStrana, pravouhlyLichKruz,
   obdelnikOpsanaM); nahradily je typy 81–89. U obdélníku s úhlopříčkou, pravoúhlého rovnoramenného trojúhelníku
   a těžiště se postup přepsal na vlastnosti útvaru (shodné úhlopříčky, úhly 45°). Zůstává jen obdelnikOpsana:
   kružnice opsaná OBDÉLNÍKU je tam daná, trojúhelníku se neopisuje (viz tests/prijimacky-spec-2027.test.cjs). */
(function () {
  'use strict';
  const G = window.PZ_GEO;
  const { CM, W, H, bod, vzdal, stred, jednot, secti, odecti, nasob, skal, pata, osove, stredove } = G;
  const nah = (a, b) => a + Math.random() * (b - a);
  const vyber = a => a[Math.floor(Math.random() * a.length)];
  const OKRAJ = 30;
  const uvnitr = (x, m) => x.x >= (m == null ? OKRAJ : m) && x.x <= W - (m == null ? OKRAJ : m) && x.y >= (m == null ? OKRAJ : m) && x.y <= H - (m == null ? OKRAJ : m);
  const cm = v => String(v).replace('.', ',') + ' cm';
  const smer = phi => bod(Math.cos(phi), Math.sin(phi));
  // přímka zadaná bodem a směrem → {p, q}
  const primka = (x, u) => ({ p: secti(x, nasob(u, -60)), q: secti(x, nasob(u, 60)) });
  const B = (p, popis) => ({ typ: 'bod', p, popis });
  const K = (c, r) => ({ typ: 'kruznice', c, r });
  const P = (l) => ({ typ: 'primka', p: l.p, q: l.q });
  const U = (p, q) => ({ typ: 'usecka', p, q });
  const PL = (p, q) => ({ typ: 'poloprimka', p, q });                     // rameno úhlu z vrcholu p přes q
  const RAD = st => st * Math.PI / 180;
  const otoc = G.otoc;                                                    // kladný úhel = po směru hodinových ručiček (y dolů)
  const strany = m => m.map((x, i) => U(x, m[(i + 1) % m.length]));      // obvod mnohoúhelníku
  /* Různé body aspoň `min` od sebe. Shodné body (sdílený vrchol dvou řešení)
     se nepočítají. Bez odstupu by jedna značka „trefila" dva hledané body
     a hodnocení by nerozlišilo, které řešení žák našel. */
  const rot = v => bod(-v.y, v.x);                                        // otočení o 90°
  const vsechnyUvnitr = body => body.every(x => uvnitr(x));
  const obsah3 = (A, Bb, C) => Math.abs((Bb.x - A.x) * (C.y - A.y) - (C.x - A.x) * (Bb.y - A.y)) / 2;
  const kriz = (O, X, Y) => (X.x - O.x) * (Y.y - O.y) - (X.y - O.y) * (Y.x - O.x);
  const uvnitrTroj = (X, A, Bb, C) => { const a = Math.sign(kriz(A, Bb, X)), b = Math.sign(kriz(Bb, C, X)), c = Math.sign(kriz(C, A, X)); return a === b && b === c; };
  // Konvexní mnohoúhelník v zadaném pořadí vrcholů: všechny otočky na stejnou stranu a zřetelné (aspoň ~9°)
  function konvexni(m) {
    const z = m.map((x, i) => { const y = m[(i + 1) % m.length], w = m[(i + 2) % m.length]; return kriz(y, w, x) / ((vzdal(x, y) * vzdal(y, w)) || 1); });
    return z.every(v => v > 0.15) || z.every(v => v < -0.15);
  }
  // Osa úsečky XY dvěma kružnicemi se stejným poloměrem (0,7·|XY|): průsečíky a tvary do postupu
  function osaUsecky(X, Y) {
    const r = vzdal(X, Y) * 0.7, PQ = G.prusecikyKK(X, r, Y, r);
    return { PQ, tvary: [K(X, r), K(Y, r), P({ p: PQ[0], q: PQ[1] })] };
  }
  function rozestup(body, min) {
    for (let i = 0; i < body.length; i++) for (let j = i + 1; j < body.length; j++) {
      const d = vzdal(body[i], body[j]);
      if (d > 1e-6 && d < min) return false;
    }
    return true;
  }

  // ── 2) Stejná vzdálenost od A a B → osa úsečky AB ∩ přímka p (1 řešení) ──
  function osa() {
    for (let g = 0; g < 400; g++) {
      const A = bod(nah(60, 170), nah(60, 240)), Bb = secti(A, nasob(smer(nah(-0.9, 0.9)), nah(110, 170)));
      const M = stred(A, Bb), uAB = jednot(odecti(Bb, A)), uo = bod(-uAB.y, uAB.x);
      const up = smer(nah(0, Math.PI));
      if (Math.abs(up.x * uo.x + up.y * uo.y) > Math.cos(Math.PI / 6)) continue;      // p svírá s osou aspoň 30°
      const p = primka(bod(nah(80, 320), nah(70, 230)), up);
      const X = G.prusecikPP(M, secti(M, uo), p.p, p.q);
      if (!X || !uvnitr(X) || !uvnitr(A) || !uvnitr(Bb) || vzdal(X, M) < 35 || Math.min(vzdal(X, A), vzdal(X, Bb)) < 45) continue;
      /* Průsečíky P, Q pomocných kružnic leží na ose stejně jako X. Poloměr se volí
         tak, aby od X byly co nejdál — s pevným 0,7·|AB| ležel P nebo Q v polovině
         zadání blíž než 25 jednotek od X a popisky se překrývaly. */
      const tX = vzdal(X, M), r0 = [0.7, 0.85, 1, 0.6].map(k => k * vzdal(A, Bb))
        .sort((a, b) => Math.abs(Math.sqrt(b * b - vzdal(A, Bb) ** 2 / 4) - tX) - Math.abs(Math.sqrt(a * a - vzdal(A, Bb) ** 2 / 4) - tX))[0];
      const PQ = G.prusecikyKK(A, r0, Bb, r0);
      if (!rozestup([A, Bb, X].concat(PQ), 30)) continue;
      return {
        typ: 'osa', nazev: 'Stejná vzdálenost od dvou bodů — osa úsečky',
        text: 'Jsou dány body A, B a přímka p. Sestrojte bod X přímky p, který má od bodů A a B stejnou vzdálenost.',
        dane: { body: { A, B: Bb }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['X'], reseni: [{ X }], pomocne: [M].concat(PQ),
        postup: [
          { text: 'Narýsujte dvě kružnice se středy A a B se stejným poloměrem (větším než polovina |AB|).', tvary: [K(A, r0), K(Bb, r0)] },
          { text: 'Jejich průsečíky určují osu o úsečky AB. Každý bod osy má od A i B stejnou vzdálenost.', tvary: PQ.map((x, i) => B(x, i ? 'Q' : 'P')).concat([P({ p: PQ[0], q: PQ[1] })]) },
          { text: 'Průsečík osy o s přímkou p je hledaný bod X.', tvary: [B(X, 'X')] },
        ],
        napovedy: ['Body, které mají od A a B stejnou vzdálenost, leží všechny na jedné přímce. Na které?',
          'Sestrojte osu úsečky AB (dvě kružnice se stejným poloměrem ze středů A a B) a najděte její průsečík s přímkou p.',
          'Bod X je průsečík osy úsečky AB s přímkou p. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 3) Vzdálenost od bodu → kružnice k(S; r) ∩ přímka p (2 řešení) ──
  function kruznice() {
    for (let g = 0; g < 400; g++) {
      const rcm = vyber([2, 2.5, 3, 3.5]), r = rcm * CM;
      const S = bod(nah(120, 280), nah(100, 200));
      const n = smer(nah(0, Math.PI)), d = r * nah(0.25, 0.7) * vyber([-1, 1]);
      const p = primka(secti(S, nasob(n, d)), bod(-n.y, n.x));
      const X = G.prusecikyPK(p.p, p.q, S, r);
      if (X.length !== 2 || !X.every(x => uvnitr(x)) || vzdal(X[0], X[1]) < 50) continue;
      return {
        typ: 'kruznice', nazev: 'Daná vzdálenost od bodu — kružnice',
        text: 'Je dán bod S a přímka p. Sestrojte všechny body X přímky p, které mají od bodu S vzdálenost ' + cm(rcm) + '. Najděte všechna řešení.',
        dane: { body: { S }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['X'], reseni: [{ X: X[0] }, { X: X[1] }], pomocne: [], polomer: rcm,
        postup: [
          { text: 'Všechny body ve vzdálenosti ' + cm(rcm) + ' od S leží na kružnici k se středem S a poloměrem ' + cm(rcm) + '.', tvary: [K(S, r)] },
          { text: 'Průsečíky kružnice k s přímkou p jsou hledané body X₁ a X₂. Úloha má dvě řešení.', tvary: [B(X[0], 'X₁'), B(X[1], 'X₂')] },
        ],
        napovedy: ['Kde leží všechny body, které mají od bodu S vzdálenost ' + cm(rcm) + '?',
          'Narýsujte kružnici se středem S a poloměrem ' + cm(rcm) + ' a najděte její průsečíky s přímkou p.',
          'Řešení jsou dvě: body X₁ a X₂, kde kružnice protíná přímku p. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 4) Výška trojúhelníku → rovnoběžky s AB ve vzdálenosti v ∩ přímka p (2 řešení) ──
  function vyska() {
    for (let g = 0; g < 400; g++) {
      const vcm = vyber([1.5, 2, 2.5]), v = vcm * CM;
      const A = bod(nah(60, 130), nah(120, 180)), uAB = smer(nah(-0.4, 0.4)), Bb = secti(A, nasob(uAB, nah(120, 170)));
      const n = bod(-uAB.y, uAB.x);
      const up = smer(nah(0, Math.PI));
      if (Math.abs(up.x * uAB.x + up.y * uAB.y) > Math.cos(0.6)) continue;            // p svírá s AB aspoň ~34°
      const p = primka(bod(nah(140, 300), nah(110, 190)), up);
      const K1 = secti(A, nasob(n, v)), K2 = secti(A, nasob(n, -v));
      const C1 = G.prusecikPP(K1, secti(K1, uAB), p.p, p.q), C2 = G.prusecikPP(K2, secti(K2, uAB), p.p, p.q);
      if (!C1 || !C2 || ![A, Bb, C1, C2].every(x => uvnitr(x)) || vzdal(C1, C2) < 50) continue;
      if ([C1, C2].some(c => Math.min(vzdal(c, A), vzdal(c, Bb)) < 40)) continue;
      if (!rozestup([A, Bb, C1, C2, K1, K2], 30)) continue;          // popisky K, L se nesmí krýt s C₁, C₂
      return {
        typ: 'vyska', nazev: 'Výška trojúhelníku — rovnoběžky',
        text: 'Je dána úsečka AB a přímka p. Sestrojte všechny body C přímky p, pro které má výška trojúhelníku ABC na stranu AB délku ' + cm(vcm) + '. Najděte všechna řešení.',
        dane: { body: { A, B: Bb }, primky: [Object.assign({ nazev: 'p' }, p)], usecky: [{ p: A, q: Bb }] },
        hledane: ['C'], reseni: [{ C: C1 }, { C: C2 }], pomocne: [K1, K2], vyska: vcm,
        postup: [
          { text: 'Výška na stranu AB je vzdálenost bodu C od přímky AB. V bodě A narýsujte kolmici k AB a naneste na ni ' + cm(vcm) + ' na obě strany.', tvary: [P({ p: K1, q: K2 }), B(K1, 'K'), B(K2, 'L')] },
          { text: 'Body K a L veďte rovnoběžky s přímkou AB. Všechny body ve vzdálenosti ' + cm(vcm) + ' od AB leží na nich.', tvary: [P({ p: K1, q: secti(K1, uAB) }), P({ p: K2, q: secti(K2, uAB) })] },
          { text: 'Průsečíky rovnoběžek s přímkou p jsou hledané vrcholy C₁ a C₂. Úloha má dvě řešení.', tvary: [B(C1, 'C₁'), B(C2, 'C₂'), U(A, C1), U(Bb, C1), U(A, C2), U(Bb, C2)] },
        ],
        napovedy: ['Výška na stranu AB je vzdálenost bodu C od přímky AB. Kde leží všechny body, které mají od přímky AB tuto vzdálenost?',
          'Sestrojte obě rovnoběžky s AB ve vzdálenosti ' + cm(vcm) + ' (na každou stranu jednu) a najděte jejich průsečíky s přímkou p.',
          'Řešení jsou dvě: body C₁ a C₂, kde rovnoběžky protínají přímku p. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 5) Osová souměrnost trojúhelníku (1 řešení, 3 body) ──
  function soumernost() {
    for (let g = 0; g < 600; g++) {
      const c = bod(nah(170, 230), nah(120, 180)), u = smer(nah(0, Math.PI)), n = bod(-u.y, u.x);
      const o = primka(c, u);
      const vrchol = () => secti(c, secti(nasob(u, nah(-110, 110)), nasob(n, nah(28, 100))));
      const A = vrchol(), Bb = vrchol(), C = vrchol();
      const tri = [A, Bb, C], obr = tri.map(x => osove(x, o.p, o.q));
      if (!tri.concat(obr).every(x => uvnitr(x))) continue;
      const strany = [vzdal(A, Bb), vzdal(Bb, C), vzdal(C, A)];
      const obsah = Math.abs((Bb.x - A.x) * (C.y - A.y) - (C.x - A.x) * (Bb.y - A.y)) / 2;
      if (Math.min(...strany) < 50 || obsah < 1800) continue;
      const paty = tri.map(x => pata(x, o.p, o.q));
      return {
        typ: 'soumernost', nazev: 'Osová souměrnost',
        text: 'Je dán trojúhelník ABC a přímka o. Sestrojte obraz A′B′C′ trojúhelníku ABC v osové souměrnosti s osou o.',
        dane: { body: { A, B: Bb, C }, primky: [Object.assign({ nazev: 'o' }, o)], mnohouhelniky: [['A', 'B', 'C']] },
        hledane: ['A′', 'B′', 'C′'], reseni: [{ 'A′': obr[0], 'B′': obr[1], 'C′': obr[2] }], pomocne: paty,
        postup: [
          { text: 'Z vrcholu A veďte kolmici k ose o. Bod A′ leží na ní za osou ve stejné vzdálenosti jako A (přeneste ji kružítkem).', tvary: [P({ p: A, q: obr[0] }), K(paty[0], vzdal(A, paty[0])), B(obr[0], 'A′')] },
          { text: 'Stejně sestrojte obrazy B′ a C′.', tvary: [P({ p: Bb, q: obr[1] }), P({ p: C, q: obr[2] }), B(obr[1], 'B′'), B(obr[2], 'C′')] },
          { text: 'Spojte A′, B′, C′ — trojúhelník A′B′C′ je obraz trojúhelníku ABC.', tvary: [U(obr[0], obr[1]), U(obr[1], obr[2]), U(obr[2], obr[0])] },
        ],
        napovedy: ['Obraz bodu v osové souměrnosti leží na kolmici k ose, na druhé straně osy a ve stejné vzdálenosti od ní.',
          'Z každého vrcholu veďte kolmici k ose o a přeneste kružítkem vzdálenost vrcholu od osy na druhou stranu.',
          'Obrazy A′, B′ a C′ jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 6) Rovnoběžník — doplnit vrchol D (1 řešení) ──
  function rovnobeznik() {
    for (let g = 0; g < 400; g++) {
      const Bb = bod(nah(80, 200), nah(170, 250));
      const A = secti(Bb, nasob(smer(nah(Math.PI * 0.85, Math.PI * 1.15)), nah(80, 150)));
      const uBA = jednot(odecti(A, Bb)), uhel = nah(Math.PI / 4, Math.PI * 0.75);
      const uBC = bod(Math.cos(Math.atan2(uBA.y, uBA.x) + uhel), Math.sin(Math.atan2(uBA.y, uBA.x) + uhel));
      const C = secti(Bb, nasob(uBC, nah(80, 140)));
      const D = secti(A, odecti(C, Bb));
      if (![A, Bb, C, D].every(x => uvnitr(x))) continue;
      if (Math.min(vzdal(A, Bb), vzdal(Bb, C)) < 70) continue;
      const uAB = odecti(Bb, A), uBCv = odecti(C, Bb);
      return {
        typ: 'rovnobeznik', nazev: 'Rovnoběžník — čtvrtý vrchol',
        text: 'Body A, B, C jsou tři vrcholy rovnoběžníku ABCD. Sestrojte vrchol D a rovnoběžník narýsujte.',
        dane: { body: { A, B: Bb, C }, usecky: [{ p: A, q: Bb }, { p: Bb, q: C }] },
        hledane: ['D'], reseni: [{ D }], pomocne: [],
        postup: [
          { text: 'Bodem C veďte rovnoběžku se stranou AB.', tvary: [P({ p: C, q: secti(C, uAB) })] },
          { text: 'Bodem A veďte rovnoběžku se stranou BC.', tvary: [P({ p: A, q: secti(A, uBCv) })] },
          { text: 'Průsečík obou rovnoběžek je vrchol D. Dorýsujte strany CD a DA.', tvary: [B(D, 'D'), U(C, D), U(D, A)] },
        ],
        napovedy: ['V rovnoběžníku jsou protější strany rovnoběžné — strana CD je rovnoběžná s AB, strana DA s BC.',
          'Veďte bodem C rovnoběžku s AB a bodem A rovnoběžku s BC. Kde se protnou?',
          'Vrchol D je průsečík obou rovnoběžek. V okně ho teď vidíte.'],
      };
    }
    return null;
  }

  // ── 7) Obdélník ze středu: vrchol A, střed S, vrchol D na přímce p (2 řešení) ──
  function obdelnik() {
    for (let g = 0; g < 600; g++) {
      const S = bod(nah(150, 250), nah(115, 185)), A = secti(S, nasob(smer(nah(0, 2 * Math.PI)), nah(70, 115)));
      const C = stredove(A, S), R = vzdal(A, S);
      const n = smer(nah(0, Math.PI)), d = R * nah(0.25, 0.7) * vyber([-1, 1]);
      const p = primka(secti(S, nasob(n, d)), bod(-n.y, n.x));
      const D = G.prusecikyPK(p.p, p.q, S, R);
      if (D.length !== 2) continue;
      const Bv = D.map(x => stredove(x, S));
      const vse = [A, C, S].concat(D, Bv);
      if (!vse.every(x => uvnitr(x)) || !rozestup(vse, 45)) continue;
      return {
        typ: 'obdelnik', nazev: 'Obdélník — vrchol, střed a přímka',
        text: 'Bod A je vrchol a bod S je střed obdélníku ABCD. Vrchol D leží na přímce p. Sestrojte všechny takové obdélníky ABCD. Najděte všechna řešení.',
        dane: { body: { A, S }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'C', 'D'], reseni: [{ B: Bv[0], C, D: D[0] }, { B: Bv[1], C, D: D[1] }], pomocne: [],
        postup: [
          { text: 'Úhlopříčky obdélníku se v bodě S půlí. Vrchol C leží na přímce AS za bodem S a |SC| = |SA|.', tvary: [P({ p: A, q: C }), B(C, 'C')] },
          { text: 'Úhlopříčky obdélníku jsou navíc stejně dlouhé, takže všechny čtyři vrcholy leží na kružnici k se středem S a poloměrem |SA|.', tvary: [K(S, R)] },
          { text: 'Vrchol D leží na kružnici k i na přímce p. Průsečíky jsou D₁ a D₂.', tvary: [B(D[0], 'D₁'), B(D[1], 'D₂')] },
          { text: 'Vrchol B leží na přímce DS na druhé straně od bodu S: k bodu D₁ patří B₁, k bodu D₂ patří B₂.', tvary: [P({ p: D[0], q: S }), P({ p: D[1], q: S }), B(Bv[0], 'B₁'), B(Bv[1], 'B₂')] },
          { text: 'Úloha má dvě řešení: obdélníky AB₁CD₁ a AB₂CD₂.', tvary: strany([A, Bv[0], C, D[0]]).concat(strany([A, Bv[1], C, D[1]])) },
        ],
        napovedy: ['Jaké jsou úhlopříčky obdélníku? Jsou stejně dlouhé a v bodě S se navzájem půlí.',
          'Najděte C na přímce AS (|SC| = |SA|). Všechny vrcholy leží na kružnici se středem S a poloměrem |SA| — vrchol D je její průsečík s přímkou p.',
          'Řešení jsou dvě: body D₁ a D₂ na průsečících kružnice s přímkou p, k nim B₁ a B₂ na druhé straně od S. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 8) Čtverec: střed S, strana AB na přímce p (1 řešení) ──
  function ctverec() {
    for (let g = 0; g < 600; g++) {
      const S = bod(nah(140, 260), nah(110, 190)), u = smer(nah(0, Math.PI)), n = bod(-u.y, u.x);
      const h = nah(32, 52), M = secti(S, nasob(n, h * vyber([-1, 1])));
      const p = primka(M, u);
      const A = secti(M, nasob(u, -h)), Bb = secti(M, nasob(u, h)), C = stredove(A, S), D = stredove(Bb, S);
      if (![A, Bb, C, D, M].every(x => uvnitr(x))) continue;
      return {
        typ: 'ctverec', nazev: 'Čtverec — střed a strana na přímce',
        text: 'Bod S je střed čtverce ABCD. Strana AB leží na přímce p. Sestrojte čtverec ABCD.',
        dane: { body: { S }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['A', 'B', 'C', 'D'], reseni: [{ A, B: Bb, C, D }], pomocne: [M], strana: 2 * h,
        postup: [
          { text: 'Z bodu S veďte kolmici k přímce p. Její pata M je střed strany AB a |SM| je polovina strany čtverce.', tvary: [P({ p: S, q: M }), B(M, 'M')] },
          { text: 'Naneste od bodu M na přímku p vzdálenost |SM| na obě strany (kružnice se středem M a poloměrem |SM|). Dostanete vrcholy A a B.', tvary: [K(M, h), B(A, 'A'), B(Bb, 'B')] },
          { text: 'Úhlopříčky čtverce se v bodě S půlí: vrchol C leží na přímce AS a vrchol D na přímce BS, oba ve vzdálenosti |SA| od S.', tvary: [P({ p: A, q: C }), P({ p: Bb, q: D }), K(S, vzdal(S, A)), B(C, 'C'), B(D, 'D')] },
          { text: 'Dorýsujte čtverec ABCD.', tvary: strany([A, Bb, C, D]) },
        ],
        napovedy: ['Střed čtverce má od každé jeho strany stejnou vzdálenost — polovinu délky strany.',
          'Veďte z S kolmici k přímce p; její pata M je střed strany AB. Vrcholy A a B leží na p ve vzdálenosti |SM| od M, vrcholy C a D najdete na úhlopříčkách přes S.',
          'Vrcholy čtverce jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 9) Kosočtverec: protější vrcholy A, C, vrchol B na přímce p (1 řešení) ──
  function kosoctverec() {
    for (let g = 0; g < 600; g++) {
      const A = bod(nah(50, 180), nah(60, 240)), C = secti(A, nasob(smer(nah(-0.8, 0.8)), nah(110, 180)));
      const S = stred(A, C), uAC = jednot(odecti(C, A)), uo = bod(-uAC.y, uAC.x);
      const up = smer(nah(0, Math.PI));
      if (Math.abs(skal(up, uo)) > Math.cos(Math.PI / 6)) continue;      // p svírá s osou aspoň 30°
      const p = primka(bod(nah(90, 310), nah(70, 230)), up);
      const Bb = G.prusecikPP(S, secti(S, uo), p.p, p.q);
      if (!Bb) continue;
      const e = vzdal(Bb, S);
      if (e < 30 || e > 110) continue;
      const D = stredove(Bb, S);
      if (![A, C, Bb, D].every(x => uvnitr(x))) continue;
      const r0 = vzdal(A, C) * 0.7, PQ = G.prusecikyKK(A, r0, C, r0);
      return {
        typ: 'kosoctverec', nazev: 'Kosočtverec — úhlopříčky',
        text: 'Body A a C jsou protější vrcholy kosočtverce ABCD. Vrchol B leží na přímce p. Sestrojte kosočtverec ABCD.',
        dane: { body: { A, C }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'D'], reseni: [{ B: Bb, D }], pomocne: [S].concat(PQ),
        postup: [
          { text: 'Úhlopříčky kosočtverce jsou na sebe kolmé a navzájem se půlí, takže vrcholy B a D leží na ose o úsečky AC. Sestrojte ji dvěma kružnicemi se stejným poloměrem ze středů A a C; úsečku AC protne v jejím středu S.', tvary: [K(A, r0), K(C, r0), P({ p: PQ[0], q: PQ[1] }), B(S, 'S')] },
          { text: 'Vrchol B je průsečík osy o s přímkou p.', tvary: [B(Bb, 'B')] },
          { text: 'Vrchol D leží na ose o na druhé straně od bodu S a |SD| = |SB| (kružnice se středem S a poloměrem |SB|).', tvary: [K(S, e), B(D, 'D')] },
          { text: 'Dorýsujte kosočtverec ABCD.', tvary: strany([A, Bb, C, D]) },
        ],
        napovedy: ['Jaké jsou úhlopříčky kosočtverce? Jsou na sebe kolmé a navzájem se půlí.',
          'Sestrojte osu úsečky AC. Vrchol B je její průsečík s přímkou p, vrchol D je na ose na druhé straně od středu S, stejně daleko jako B.',
          'Vrcholy B a D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 10) Rovnoramenný lichoběžník: vrchol A, střed M ramene BC, osa o (1 řešení) ──
  function lichobeznik() {
    for (let g = 0; g < 800; g++) {
      const c0 = bod(nah(170, 230), nah(130, 170)), u = smer(nah(0, 2 * Math.PI)), n = bod(-u.y, u.x);
      const a = nah(45, 90), c = nah(25, 75), tA = nah(-80, -20), tC = tA + nah(65, 120);
      if (Math.abs(a - c) < 20) continue;                                   // základny zjevně různé
      const na = (t, s) => secti(c0, secti(nasob(u, t), nasob(n, s)));
      const A = na(tA, -a), Bb = na(tA, a), C = na(tC, c), D = na(tC, -c), M = stred(Bb, C);
      const FA = na(tA, 0), FC = na(tC, 0), o = primka(c0, u);
      if (![A, Bb, C, D, M].every(x => uvnitr(x)) || !rozestup([A, Bb, C, D, M], 40)) continue;
      return {
        typ: 'lichobeznik', nazev: 'Rovnoramenný lichoběžník — osa souměrnosti',
        text: 'Bod A je vrchol a bod M je střed ramene BC rovnoramenného lichoběžníku ABCD se základnami AB a CD. Přímka o je osa souměrnosti lichoběžníku. Sestrojte lichoběžník ABCD.',
        dane: { body: { A, M }, primky: [Object.assign({ nazev: 'o' }, o)] },
        hledane: ['B', 'C', 'D'], reseni: [{ B: Bb, C, D }], pomocne: [FA, FC],
        postup: [
          { text: 'Lichoběžník je souměrný podle osy o, takže vrchol B je obraz vrcholu A. Z bodu A veďte kolmici k ose o a přeneste vzdálenost bodu A od osy na druhou stranu.', tvary: [P({ p: A, q: Bb }), K(FA, a), B(Bb, 'B')] },
          { text: 'Bod M je střed ramene BC: vrchol C leží na přímce BM za bodem M a |MC| = |BM|.', tvary: [P({ p: Bb, q: M }), K(M, vzdal(Bb, M)), B(C, 'C')] },
          { text: 'Vrchol D je obraz vrcholu C v osové souměrnosti s osou o.', tvary: [P({ p: C, q: D }), K(FC, c), B(D, 'D')] },
          { text: 'Dorýsujte lichoběžník ABCD.', tvary: strany([A, Bb, C, D]) },
        ],
        napovedy: ['Rovnoramenný lichoběžník je souměrný podle osy o. Který vrchol je obrazem vrcholu A?',
          'Sestrojte B jako obraz A podle osy o. Vrchol C leží na přímce BM tak, aby M byl střed BC; vrchol D je obraz C.',
          'Vrcholy B, C a D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 11) Trojúhelník s danou těžnicí: A, C, vrchol B na přímce p (2 řešení) ──
  function teznice() {
    for (let g = 0; g < 600; g++) {
      const tcm = vyber([2, 2.5, 3, 3.5]), t = tcm * CM;
      const A = bod(nah(50, 170), nah(60, 240)), C = secti(A, nasob(smer(nah(-1.2, 1.2)), nah(90, 160)));
      const Sb = stred(A, C);
      const n = smer(nah(0, Math.PI)), d = t * nah(0.25, 0.7) * vyber([-1, 1]);
      const p = primka(secti(Sb, nasob(n, d)), bod(-n.y, n.x));
      const X = G.prusecikyPK(p.p, p.q, Sb, t);
      if (X.length !== 2 || ![A, C].concat(X).every(x => uvnitr(x))) continue;
      if (vzdal(X[0], X[1]) < 50 || !rozestup([A, C, Sb].concat(X), 40)) continue;
      if (X.some(x => G.vzdalOdPrimky(x, A, C) < 25)) continue;           // žádný „plochý" trojúhelník
      return {
        typ: 'teznice', nazev: 'Trojúhelník — těžnice',
        text: 'Jsou dány body A, C a přímka p. Sestrojte všechny trojúhelníky ABC, jejichž vrchol B leží na přímce p a těžnice z vrcholu B má délku ' + cm(tcm) + '. Najděte všechna řešení.',
        dane: { body: { A, C }, primky: [Object.assign({ nazev: 'p' }, p)], usecky: [{ p: A, q: C }] },
        hledane: ['B'], reseni: [{ B: X[0] }, { B: X[1] }], pomocne: [Sb], teznice: tcm,
        postup: [
          { text: 'Těžnice z vrcholu B spojuje vrchol B se středem protější strany AC. Najděte střed S úsečky AC.', tvary: [B(Sb, 'S')] },
          { text: 'Vrchol B má od bodu S vzdálenost ' + cm(tcm) + ', leží tedy na kružnici k se středem S a poloměrem ' + cm(tcm) + '.', tvary: [K(Sb, t)] },
          { text: 'Průsečíky kružnice k s přímkou p jsou vrcholy B₁ a B₂.', tvary: [B(X[0], 'B₁'), B(X[1], 'B₂')] },
          { text: 'Úloha má dvě řešení: trojúhelníky AB₁C a AB₂C.', tvary: [U(A, X[0]), U(C, X[0]), U(A, X[1]), U(C, X[1]), U(Sb, X[0]), U(Sb, X[1])] },
        ],
        napovedy: ['Těžnice vede z vrcholu B do středu protější strany AC. Kde leží všechny body, které mají od tohoto středu danou vzdálenost?',
          'Najděte střed S strany AC, narýsujte kružnici se středem S a poloměrem ' + cm(tcm) + ' a hledejte její průsečíky s přímkou p.',
          'Řešení jsou dvě: vrcholy B₁ a B₂ na průsečících kružnice s přímkou p. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 12) Rovnoramenný trojúhelník: základna AB, výška na základnu (2 řešení) ──
  function rovnoramenny() {
    for (let g = 0; g < 600; g++) {
      const vcm = vyber([1.5, 2, 2.5, 3]), v = vcm * CM;
      const A = bod(nah(60, 200), nah(80, 220)), Bb = secti(A, nasob(smer(nah(-1, 1) + vyber([0, Math.PI])), nah(80, 150)));
      const S = stred(A, Bb), uAB = jednot(odecti(Bb, A)), n = bod(-uAB.y, uAB.x);
      const C1 = secti(S, nasob(n, v)), C2 = secti(S, nasob(n, -v));
      if (![A, Bb, C1, C2].every(x => uvnitr(x))) continue;
      const r0 = vzdal(A, Bb) * 0.7, PQ = G.prusecikyKK(A, r0, Bb, r0);
      return {
        typ: 'rovnoramenny', nazev: 'Rovnoramenný trojúhelník — výška',
        text: 'Úsečka AB je základna rovnoramenného trojúhelníku ABC. Výška na základnu má délku ' + cm(vcm) + '. Sestrojte všechny takové trojúhelníky ABC. Najděte všechna řešení.',
        dane: { body: { A, B: Bb }, usecky: [{ p: A, q: Bb }] },
        hledane: ['C'], reseni: [{ C: C1 }, { C: C2 }], pomocne: [S].concat(PQ), vyska: vcm,
        postup: [
          { text: 'Ramena AC a BC jsou shodná, vrchol C má tedy od A i B stejnou vzdálenost a leží na ose o základny AB. Sestrojte ji dvěma kružnicemi se stejným poloměrem ze středů A a B; základnu protne v jejím středu S.', tvary: [K(A, r0), K(Bb, r0), P({ p: PQ[0], q: PQ[1] }), B(S, 'S')] },
          { text: 'Výška na základnu leží na ose o. Naneste od bodu S na osu ' + cm(vcm) + ' na obě strany (kružnice se středem S a poloměrem ' + cm(vcm) + ').', tvary: [K(S, v)] },
          { text: 'Průsečíky kružnice s osou jsou vrcholy C₁ a C₂. Úloha má dvě řešení: trojúhelníky ABC₁ a ABC₂.', tvary: [B(C1, 'C₁'), B(C2, 'C₂'), U(A, C1), U(Bb, C1), U(A, C2), U(Bb, C2)] },
        ],
        napovedy: ['Rovnoramenný trojúhelník má shodná ramena AC a BC. Kde leží všechny body, které mají od A i B stejnou vzdálenost?',
          'Sestrojte osu základny AB a na ni od středu S naneste výšku ' + cm(vcm) + ' — na každou stranu jednou.',
          'Řešení jsou dvě: vrcholy C₁ a C₂ na ose základny. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  /* ════════ Typy 13–34: další ostré úlohy z archivu (M9 2015–2026, M7) ════════
     Každý typ stojí na jiné myšlence, kterou ostré testy používají: středová
     souměrnost, osa úhlu, průsečík výšek, těžiště,
     pravidelný šestiúhelník, „všechna řešení" podle toho,
     které strany jsou základnami nebo čí středy jsou zadané. Zadání jsou
     vlastní, stavba odpovídá ostrým úlohám (zdroj u každého typu). */

  // ── 13) Středová souměrnost trojúhelníku (M9 2017/2 ú. 9, nanečisto 2025 ú. 9) ──
  function stredova() {
    for (let g = 0; g < 800; g++) {
      const S = bod(nah(150, 250), nah(115, 185));
      const t = secti(S, nasob(smer(nah(0, 2 * Math.PI)), nah(60, 95)));        // trojúhelník stranou od S
      const vr = () => secti(t, nasob(smer(nah(0, 2 * Math.PI)), nah(32, 62)));
      const A = vr(), Bb = vr(), C = vr();
      const tri = [A, Bb, C], obr = tri.map(x => stredove(x, S));
      if (!vsechnyUvnitr(tri.concat(obr))) continue;
      if (Math.min(vzdal(A, Bb), vzdal(Bb, C), vzdal(C, A)) < 45 || obsah3(A, Bb, C) < 1500) continue;
      if (uvnitrTroj(S, A, Bb, C) || !rozestup(tri.concat(obr, [S]), 36)) continue;
      return {
        typ: 'stredova', nazev: 'Středová souměrnost',
        text: 'Je dán trojúhelník ABC a bod S. Sestrojte obraz A′B′C′ trojúhelníku ABC ve středové souměrnosti se středem S.',
        dane: { body: { A, B: Bb, C, S }, mnohouhelniky: [['A', 'B', 'C']] },
        hledane: ['A′', 'B′', 'C′'], reseni: [{ 'A′': obr[0], 'B′': obr[1], 'C′': obr[2] }], pomocne: [],
        postup: [
          { text: 'Obraz bodu ve středové souměrnosti leží na přímce, která bod spojuje se středem S, na druhé straně od S a stejně daleko. Veďte přímku AS a za S naneste kružítkem vzdálenost |SA|.', tvary: [P({ p: A, q: S }), K(S, vzdal(S, A)), B(obr[0], 'A′')] },
          { text: 'Stejně sestrojte obrazy B′ a C′.', tvary: [P({ p: Bb, q: S }), P({ p: C, q: S }), K(S, vzdal(S, Bb)), K(S, vzdal(S, C)), B(obr[1], 'B′'), B(obr[2], 'C′')] },
          { text: 'Spojte A′, B′ a C′ — trojúhelník A′B′C′ je shodný s ABC, jen otočený o 180° kolem bodu S.', tvary: strany(obr) },
        ],
        napovedy: ['Ve středové souměrnosti leží bod, jeho obraz a střed S na jedné přímce a S je přesně uprostřed mezi nimi.',
          'Veďte každým vrcholem přímku přes S a za S naneste kružítkem stejnou vzdálenost, jakou má vrchol od S.',
          'Obrazy A′, B′ a C′ jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 14) Osa úhlu: bod P na straně KM, úhly KLP a PLM shodné (M9 2017 ilustrační ú. 9) ──
  function osauhlu() {
    for (let g = 0; g < 800; g++) {
      const L = bod(nah(70, 330), nah(60, 240)), f0 = nah(0, 2 * Math.PI), a = nah(0.3, 0.7) * Math.PI;
      /* Osa úhlu dělí KM v poměru ramen, takže při podobně dlouhých ramenech splývá P se
         středem KM a prošla by i chybná konstrukce „střed úsečky". Jedno rameno je proto
         zřetelně delší a P leží od středu KM dál než mírná tolerance (18 jednotek). */
      const dlouhe = nah(150, 210), kratke = nah(75, 120), prohod = Math.random() < 0.5;
      const r1 = prohod ? kratke : dlouhe, r2 = prohod ? dlouhe : kratke;
      const uK = smer(f0), uM = smer(f0 + a), Kk = secti(L, nasob(uK, r1)), M = secti(L, nasob(uM, r2));
      const u = jednot(secti(uK, uM)), Pp = G.prusecikPP(L, secti(L, u), Kk, M);
      if (!Pp || !vsechnyUvnitr([L, Kk, M])) continue;
      if (Math.min(vzdal(Pp, Kk), vzdal(Pp, M)) < 36 || vzdal(Pp, stred(Kk, M)) < 20) continue;
      const rr = 0.45 * Math.min(r1, r2), X = secti(L, nasob(uK, rr)), Y = secti(L, nasob(uM, rr));
      const Z = G.prusecikyKK(X, rr, Y, rr).sort((p, q) => vzdal(q, L) - vzdal(p, L))[0];
      if (!Z || !rozestup([L, Kk, M, Pp, X, Y, Z], 30)) continue;
      return {
        typ: 'osauhlu', nazev: 'Osa úhlu',
        text: 'Je dán trojúhelník KLM. Na straně KM sestrojte bod P tak, aby úhly KLP a PLM byly shodné.',
        dane: { body: { K: Kk, L, M }, mnohouhelniky: [['K', 'L', 'M']] },
        hledane: ['P'], reseni: [{ P: Pp }], pomocne: [X, Y, Z],
        postup: [
          { text: 'Shodné úhly KLP a PLM znamenají, že polopřímka LP je osa úhlu KLM. Narýsujte kružnici se středem L — ramena LK a LM protne v bodech X a Y.', tvary: [K(L, rr), B(X, 'X'), B(Y, 'Y')] },
          { text: 'Z bodů X a Y narýsujte dvě kružnice se stejným poloměrem. Jejich průsečík Z leží na ose úhlu.', tvary: [K(X, rr), K(Y, rr), B(Z, 'Z')] },
          { text: 'Polopřímka LZ je osa úhlu KLM. Její průsečík se stranou KM je hledaný bod P.', tvary: [P({ p: L, q: Z }), B(Pp, 'P')] },
          { text: 'Úhly KLP a PLM jsou shodné — oba jsou polovinou úhlu KLM.', tvary: [U(L, Pp)] },
        ],
        napovedy: ['Úhly KLP a PLM jsou shodné, když polopřímka LP rozpůlí úhel KLM. Jak se sestrojí osa úhlu?',
          'Kružnicí se středem L vytněte na ramenech body X a Y, z nich stejnými kružnicemi najděte bod Z. Polopřímka LZ protne stranu KM v bodě P.',
          'Bod P je teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 16) Průsečík výšek: A, B a průsečík výšek O → vrchol C (M9 2020 ilustrační ú. 10) ──
  function vysky() {
    for (let g = 0; g < 1500; g++) {
      const A = bod(nah(40, 360), nah(40, 260)), Bb = bod(nah(40, 360), nah(40, 260)), C = bod(nah(40, 360), nah(40, 260));
      const uhel = (X, Y, Z) => Math.acos(Math.max(-1, Math.min(1, skal(jednot(odecti(Y, X)), jednot(odecti(Z, X))))));
      const uhly = [uhel(A, Bb, C), uhel(Bb, C, A), uhel(C, A, Bb)];
      if (uhly.some(x => x < 0.23 * Math.PI || x > 0.44 * Math.PI)) continue;   // ostroúhlý: O uvnitř
      if (Math.min(vzdal(A, Bb), vzdal(Bb, C), vzdal(C, A)) < 110) continue;
      const O = G.prusecikPP(A, secti(A, rot(odecti(C, Bb))), Bb, secti(Bb, rot(odecti(C, A))));
      if (!O || !rozestup([A, Bb, C, O], 36)) continue;
      return {
        typ: 'vysky', nazev: 'Průsečík výšek',
        text: 'Body A a B jsou vrcholy trojúhelníku ABC a bod O je průsečík jeho výšek. Sestrojte vrchol C a trojúhelník narýsujte.',
        dane: { body: { A, B: Bb, O }, usecky: [{ p: A, q: Bb }] },
        hledane: ['C'], reseni: [{ C }], pomocne: [],
        postup: [
          { text: 'Výška z vrcholu B prochází průsečíkem výšek O a je kolmá ke straně AC. Strana AC je tedy kolmá k přímce BO: narýsujte přímku BO a bodem A k ní veďte kolmici.', tvary: [P({ p: Bb, q: O }), P({ p: A, q: secti(A, rot(odecti(O, Bb))) })] },
          { text: 'Stejně je strana BC kolmá k přímce AO: narýsujte přímku AO a bodem B k ní veďte kolmici.', tvary: [P({ p: A, q: O }), P({ p: Bb, q: secti(Bb, rot(odecti(O, A))) })] },
          { text: 'Průsečík obou kolmic je vrchol C. Kontrola: přímka CO je kolmá ke straně AB.', tvary: [B(C, 'C'), U(A, C), U(Bb, C), P({ p: C, q: O })] },
        ],
        napovedy: ['Výška z vrcholu B prochází bodem O a je kolmá k protější straně AC. Co to říká o poloze strany AC vůči přímce BO?',
          'Strana AC je kolmá k přímce BO a strana BC je kolmá k přímce AO. Bodem A veďte kolmici k BO, bodem B kolmici k AO.',
          'Vrchol C je průsečík obou kolmic. V okně ho teď vidíte.'],
      };
    }
    return null;
  }

  // ── 17) Obdélník z úhlopříčky BD, vrchol C na přímce c (M9 2019/1 ú. 10; 2 řešení) ──
  function obdelnikUhl() {
    for (let g = 0; g < 800; g++) {
      const S = bod(nah(150, 250), nah(115, 185)), R = nah(65, 105), uBD = smer(nah(0, Math.PI));
      const Bb = secti(S, nasob(uBD, -R)), D = secti(S, nasob(uBD, R));
      const n = smer(nah(0, Math.PI)), d = R * nah(0.25, 0.7) * vyber([-1, 1]);
      const c = primka(secti(S, nasob(n, d)), rot(n));
      const Cv = G.prusecikyPK(c.p, c.q, S, R);
      if (Cv.length !== 2) continue;
      const Av = Cv.map(x => stredove(x, S));
      const vse = [Bb, D, S].concat(Cv, Av);
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 40)) continue;
      return {
        typ: 'obdelnikUhl', nazev: 'Obdélník — úhlopříčka a vrchol na přímce',
        text: 'Body B a D jsou protější vrcholy obdélníku ABCD. Vrchol C leží na přímce c. Sestrojte všechny takové obdélníky ABCD. Najděte všechna řešení.',
        dane: { body: { B: Bb, D }, primky: [Object.assign({ nazev: 'c' }, c)] },
        hledane: ['A', 'C'], reseni: [{ A: Av[0], C: Cv[0] }, { A: Av[1], C: Cv[1] }], pomocne: [S],
        postup: [
          { text: 'Úhlopříčky obdélníku jsou stejně dlouhé a půlí se, takže vrchol C je od středu S úsečky BD stejně daleko jako B. Najděte střed S úsečky BD a narýsujte kružnici se středem S a poloměrem |SB|.', tvary: [B(S, 'S'), K(S, R)] },
          { text: 'Vrchol C leží na kružnici i na přímce c. Průsečíky jsou C₁ a C₂.', tvary: [B(Cv[0], 'C₁'), B(Cv[1], 'C₂')] },
          { text: 'Úhlopříčky obdélníku se v bodě S půlí: vrchol A leží na přímce CS na druhé straně od S (A₁ k C₁, A₂ k C₂).', tvary: [P({ p: Cv[0], q: S }), P({ p: Cv[1], q: S }), B(Av[0], 'A₁'), B(Av[1], 'A₂')] },
          { text: 'Úloha má dvě řešení: obdélníky A₁BC₁D a A₂BC₂D.', tvary: strany([Av[0], Bb, Cv[0], D]).concat(strany([Av[1], Bb, Cv[1], D])) },
        ],
        napovedy: ['Co platí pro úhlopříčky obdélníku? Jak daleko od jejich společného středu S leží vrchol C?',
          'Narýsujte kružnici se středem S a poloměrem |SB|. Vrchol C je její průsečík s přímkou c, vrchol A leží na přímce CS za středem S.',
          'Řešení jsou dvě: C₁ s A₁ a C₂ s A₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 18) Obdélník: vrcholy A, C a bod M na úhlopříčce BD (M9 2023/1 ú. 9) ──
  function obdelnikM() {
    for (let g = 0; g < 800; g++) {
      const S = bod(nah(150, 250), nah(115, 185)), R = nah(80, 110), fAC = nah(0, Math.PI), a = nah(0.25, 0.75) * Math.PI;
      const A = secti(S, nasob(smer(fAC), -R)), C = secti(S, nasob(smer(fAC), R));
      const uBD = smer(fAC + a), Bb = secti(S, nasob(uBD, -R)), D = secti(S, nasob(uBD, R));
      const M = secti(S, nasob(uBD, R * nah(0.32, 0.55) * vyber([-1, 1])));
      if (!vsechnyUvnitr([A, Bb, C, D, M]) || !rozestup([A, Bb, C, D, M], 36) || vzdal(S, M) < 26) continue;
      return {
        typ: 'obdelnikM', nazev: 'Obdélník — úhlopříčka a bod na druhé',
        text: 'Body A a C jsou protější vrcholy obdélníku ABCD. Bod M leží na úhlopříčce BD. Sestrojte vrcholy B a D a obdélník narýsujte.',
        dane: { body: { A, C, M } },
        hledane: ['B', 'D'], reseni: [{ B: Bb, D }], pomocne: [S],
        postup: [
          { text: 'Úhlopříčky obdélníku se navzájem půlí: najděte střed S úsečky AC.', tvary: [B(S, 'S')] },
          { text: 'Úhlopříčka BD prochází středem S i bodem M — narýsujte přímku SM.', tvary: [P({ p: S, q: M })] },
          { text: 'Úhlopříčky obdélníku jsou stejně dlouhé: B a D leží na kružnici se středem S a poloměrem |SA|. Její průsečíky s přímkou SM jsou vrcholy B a D.', tvary: [K(S, R), B(Bb, 'B'), B(D, 'D')] },
          { text: 'Dorýsujte obdélník ABCD.', tvary: strany([A, Bb, C, D]) },
        ],
        napovedy: ['Jak leží úhlopříčky obdélníku? Jsou stejně dlouhé a navzájem se půlí.',
          'Úhlopříčka BD leží na přímce SM, kde S je střed AC. Vrcholy B a D jsou na ní ve vzdálenosti |SA| od S.',
          'Vrcholy B a D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 19) Rovnoramenný lichoběžník: základna AB a střed S ramene AD (M9 2023/2 ú. 9) ──
  function lichobeznikZakl() {
    for (let g = 0; g < 800; g++) {
      const A = bod(nah(40, 360), nah(40, 260)), zak = nah(140, 200), uAB = smer(nah(0, 2 * Math.PI)), n = rot(uAB);
      const Bb = secti(A, nasob(uAB, zak)), t = nah(25, zak * 0.35), h = nah(70, 115) * vyber([-1, 1]);
      const D = secti(A, secti(nasob(uAB, t), nasob(n, h))), C = secti(Bb, secti(nasob(uAB, -t), nasob(n, h)));
      const S = stred(A, D);
      if (!vsechnyUvnitr([A, Bb, C, D, S]) || !rozestup([A, Bb, C, D, S], 36)) continue;
      const o = osaUsecky(A, Bb);
      return {
        typ: 'lichobeznikZakl', nazev: 'Lichoběžník — základna a střed ramene',
        text: 'Úsečka AB je základna rovnoramenného lichoběžníku ABCD. Bod S je střed ramene AD. Sestrojte vrcholy C a D a lichoběžník narýsujte.',
        dane: { body: { A, B: Bb, S }, usecky: [{ p: A, q: Bb }] },
        hledane: ['C', 'D'], reseni: [{ C, D }], pomocne: [stred(A, Bb)],
        postup: [
          { text: 'Bod S je střed ramene AD: vrchol D leží na přímce AS za bodem S a |SD| = |SA|.', tvary: [P({ p: A, q: S }), K(S, vzdal(S, A)), B(D, 'D')] },
          { text: 'Rovnoramenný lichoběžník je souměrný podle osy o své základny AB. Sestrojte ji.', tvary: o.tvary },
          { text: 'Vrchol C je obraz vrcholu D v osové souměrnosti s osou o: z bodu D veďte kolmici k ose a přeneste vzdálenost na druhou stranu.', tvary: [P({ p: D, q: C }), B(C, 'C')] },
          { text: 'Dorýsujte lichoběžník ABCD.', tvary: strany([A, Bb, C, D]) },
        ],
        napovedy: ['Bod S je střed ramene AD — kde tedy leží vrchol D? A podle které přímky je rovnoramenný lichoběžník souměrný?',
          'Vrchol D najdete na přímce AS (|SD| = |SA|). Vrchol C je obraz D podle osy základny AB.',
          'Vrcholy C a D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 20) Rovnoramenný trojúhelník KLM: vrchol L, osa o, strana KL na přímce p (M9 2017/1 ú. 9) ──
  function rovnoramennyOsa() {
    for (let g = 0; g < 800; g++) {
      const c0 = bod(nah(170, 230), nah(110, 190)), u = smer(nah(0, Math.PI)), n = rot(u);
      const o = primka(c0, u), Kk = secti(c0, nasob(u, nah(-70, 70)));
      const b = nah(0.12, 0.38) * Math.PI, ram = nah(110, 170);
      const dir = secti(nasob(u, vyber([-1, 1]) * Math.cos(b)), nasob(n, vyber([-1, 1]) * Math.sin(b)));
      const L = secti(Kk, nasob(dir, ram)), M = osove(L, o.p, o.q), F = pata(L, o.p, o.q);
      if (!vsechnyUvnitr([Kk, L, M]) || !rozestup([Kk, L, M], 36)) continue;
      const p = primka(L, jednot(odecti(Kk, L)));
      return {
        typ: 'rovnoramennyOsa', nazev: 'Rovnoramenný trojúhelník — osa a strana',
        text: 'Bod L je vrchol rovnoramenného trojúhelníku KLM a přímka o je jeho osa souměrnosti. Strana KL leží na přímce p. Sestrojte vrcholy K a M a trojúhelník narýsujte.',
        dane: { body: { L }, primky: [Object.assign({ nazev: 'o' }, o), Object.assign({ nazev: 'p' }, p)] },
        hledane: ['K', 'M'], reseni: [{ K: Kk, M }], pomocne: [F],
        postup: [
          { text: 'Osa souměrnosti rovnoramenného trojúhelníku prochází jeho hlavním vrcholem. Strana KL leží na přímce p, takže hlavní vrchol K je průsečík přímek p a o.', tvary: [B(Kk, 'K')] },
          { text: 'Vrchol M je obraz vrcholu L v osové souměrnosti s osou o: z bodu L veďte kolmici k ose a přeneste vzdálenost bodu L od osy na druhou stranu.', tvary: [P({ p: L, q: M }), K(F, vzdal(L, F)), B(M, 'M')] },
          { text: 'Dorýsujte trojúhelník KLM — ramena KL a KM jsou shodná.', tvary: strany([Kk, L, M]) },
        ],
        napovedy: ['Kterým vrcholem rovnoramenného trojúhelníku prochází jeho osa souměrnosti? A kde leží obraz vrcholu L?',
          'Vrchol K je průsečík přímek o a p. Vrchol M je obraz bodu L v osové souměrnosti s osou o.',
          'Vrcholy K a M jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 21) Čtverec z úhlopříčky BD (M9 2016/1 ú. 10, M7 2026/2 ú. 8) ──
  function ctverecUhl() {
    for (let g = 0; g < 600; g++) {
      const S = bod(nah(140, 260), nah(110, 190)), w = nasob(smer(nah(0, 2 * Math.PI)), nah(55, 95));
      const Bb = odecti(S, w), D = secti(S, w), A = secti(S, rot(w)), C = odecti(S, rot(w));
      if (!vsechnyUvnitr([A, Bb, C, D])) continue;
      const o = osaUsecky(Bb, D);
      return {
        typ: 'ctverecUhl', nazev: 'Čtverec — úhlopříčka',
        text: 'Body B a D jsou protější vrcholy čtverce ABCD. Sestrojte vrcholy A a C a čtverec narýsujte.',
        dane: { body: { B: Bb, D } },
        hledane: ['A', 'C'], reseni: [{ A, C }], pomocne: [S],
        postup: [
          { text: 'Úhlopříčky čtverce jsou stejně dlouhé, navzájem kolmé a půlí se. Úhlopříčka AC proto leží na ose úsečky BD — sestrojte ji; úsečku BD protne v jejím středu S.', tvary: o.tvary.concat([B(S, 'S')]) },
          { text: 'Vrcholy A a C leží na ose ve vzdálenosti |SB| od středu S (kružnice se středem S a poloměrem |SB|).', tvary: [K(S, vzdal(S, Bb)), B(A, 'A'), B(C, 'C')] },
          { text: 'Dorýsujte čtverec ABCD.', tvary: strany([A, Bb, C, D]) },
        ],
        napovedy: ['Jaké jsou úhlopříčky čtverce? Porovnejte jejich délku, vzájemnou polohu a průsečík.',
          'Úhlopříčka AC leží na ose úsečky BD a je stejně dlouhá jako BD. A a C najdete na ose kružnicí se středem S a poloměrem |SB|.',
          'Vrcholy A a C jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 22) Trojúhelník: výška a těžnice z vrcholu C na přímkách p a q (M9 2025/1 ú. 10) ──
  function vcTc() {
    for (let g = 0; g < 800; g++) {
      const Hp = bod(nah(140, 260), nah(130, 230)), u = smer(nah(-0.6, 0.6)), n = rot(u);
      const C = secti(Hp, nasob(n, -nah(80, 140)));
      const tA = -nah(40, 140), tB = nah(40, 140);
      if (tB - tA < 110 || Math.abs(tA + tB) < 40) continue;          // těžnice zjevně jiná přímka než výška
      const A = secti(Hp, nasob(u, tA)), Bb = secti(Hp, nasob(u, tB)), M = stred(A, Bb);
      if (!vsechnyUvnitr([A, Bb, C, M, Hp]) || !rozestup([A, Bb, C, M, Hp], 36)) continue;
      const p = primka(C, jednot(odecti(Hp, C))), q = primka(C, jednot(odecti(M, C)));
      return {
        typ: 'vcTc', nazev: 'Trojúhelník — výška a těžnice',
        text: 'Body B a C jsou vrcholy trojúhelníku ABC. Na přímce p leží výška z vrcholu C a na přímce q těžnice z vrcholu C. Sestrojte vrchol A a trojúhelník narýsujte.',
        dane: { body: { B: Bb, C }, primky: [Object.assign({ nazev: 'p' }, p), Object.assign({ nazev: 'q' }, q)] },
        hledane: ['A'], reseni: [{ A }], pomocne: [M, Hp],
        postup: [
          { text: 'Výška z vrcholu C je kolmá ke straně AB. Strana AB tedy leží na kolmici k přímce p vedené bodem B.', tvary: [P({ p: Bb, q: secti(Bb, u) })] },
          { text: 'Těžnice z vrcholu C končí ve středu M strany AB: M je průsečík té kolmice s přímkou q.', tvary: [B(M, 'M')] },
          { text: 'Vrchol A leží na přímce BM za bodem M a |MA| = |MB| (kružnice se středem M a poloměrem |MB|).', tvary: [K(M, vzdal(M, Bb)), B(A, 'A')] },
          { text: 'Dorýsujte trojúhelník ABC.', tvary: strany([A, Bb, C]) },
        ],
        napovedy: ['Výška z vrcholu C je kolmá k protější straně AB a těžnice z C vede do středu strany AB. Co z toho plyne pro přímku AB?',
          'Bodem B veďte kolmici k přímce p — na ní leží strana AB. Její průsečík s přímkou q je střed M strany AB; vrchol A je souměrný s B podle M.',
          'Vrchol A je teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 24) Kosočtverec: vrchol A, osa o s vrcholy B, D a |BD| = 2·|AC| (M9 2026/1 ú. 10) ──
  function kosoctverecOsa() {
    for (let g = 0; g < 600; g++) {
      const c0 = bod(nah(160, 240), nah(120, 180)), u = smer(nah(0, Math.PI)), n = rot(u), o = primka(c0, u);
      const S = secti(c0, nasob(u, nah(-40, 40))), e = nah(28, 44), A = secti(S, nasob(n, e * vyber([-1, 1])));
      const C = stredove(A, S), Bb = secti(S, nasob(u, 2 * e)), D = secti(S, nasob(u, -2 * e));
      if (!vsechnyUvnitr([A, Bb, C, D])) continue;
      return {
        typ: 'kosoctverecOsa', nazev: 'Kosočtverec — osa a poměr úhlopříček',
        text: 'Bod A je vrchol kosočtverce ABCD. Přímka o je osou souměrnosti kosočtverce a leží na ní vrcholy B a D. Úhlopříčka BD je dvakrát delší než úhlopříčka AC. Sestrojte vrcholy B, C, D a kosočtverec narýsujte.',
        dane: { body: { A }, primky: [Object.assign({ nazev: 'o' }, o)] },
        hledane: ['B', 'C', 'D'], reseni: [{ B: Bb, C, D }], pomocne: [S],
        postup: [
          { text: 'Úhlopříčky kosočtverce jsou na sebe kolmé a půlí se, takže vrchol C je obraz vrcholu A podle osy o. Kolmice z bodu A k ose ji protne ve středu S kosočtverce a C leží za S ve stejné vzdálenosti.', tvary: [P({ p: A, q: C }), B(S, 'S'), B(C, 'C')] },
          { text: 'Úhlopříčka BD leží na ose o a je dvakrát delší než AC, takže |SB| = |SD| = |AC|. Naneste od S na osu vzdálenost |AC| na obě strany.', tvary: [K(S, 2 * e), B(Bb, 'B'), B(D, 'D')] },
          { text: 'Dorýsujte kosočtverec ABCD.', tvary: strany([A, Bb, C, D]) },
        ],
        napovedy: ['Úhlopříčky kosočtverce jsou na sebe kolmé a navzájem se půlí. Kde leží vrchol C, je-li o osou souměrnosti?',
          'C je obraz A podle osy o a S je průsečík AC s osou. Úhlopříčka BD je dvakrát delší než AC, proto |SB| = |SD| = |AC|.',
          'Vrcholy B, C a D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 25) Rovnoramenný pravoúhlý trojúhelník z vrcholu C a těžiště T (M9 2021 ilustrační ú. 10) ──
  function teziste() {
    for (let g = 0; g < 600; g++) {
      const C = bod(nah(60, 340), nah(50, 250)), u = smer(nah(0, 2 * Math.PI)), h = nah(78, 105);
      const M = secti(C, nasob(u, h)), T = secti(C, nasob(u, h * 2 / 3));
      const A = secti(M, nasob(rot(u), h)), Bb = secti(M, nasob(rot(u), -h));
      if (!vsechnyUvnitr([A, Bb, C, M])) continue;
      return {
        typ: 'teziste', nazev: 'Pravoúhlý trojúhelník — těžiště',
        text: 'Bod C je vrchol rovnoramenného pravoúhlého trojúhelníku ABC s pravým úhlem při vrcholu C. Bod T je těžiště tohoto trojúhelníku. Sestrojte vrcholy A a B a trojúhelník narýsujte.',
        dane: { body: { C, T } },
        hledane: ['A', 'B'], reseni: [{ A, B: Bb }], pomocne: [M, stred(C, T)],
        postup: [
          { text: 'Těžiště leží na těžnici ve dvou třetinách její délky od vrcholu. Těžnice z C proto končí ve středu M přepony AB za bodem T a |TM| je polovina |CT|: najděte střed úsečky CT a tuto polovinu naneste za T.', tvary: [P({ p: C, q: T }), B(M, 'M')] },
          { text: 'V rovnoramenném pravoúhlém trojúhelníku je těžnice na přeponu zároveň výškou. Přepona AB proto leží na kolmici k přímce CM vedené bodem M.', tvary: [P({ p: M, q: secti(M, rot(u)) })] },
          { text: 'Trojúhelníky AMC a BMC jsou pravoúhlé rovnoramenné (úhly 45°), takže |MA| = |MB| = |MC|: naneste od M na kolmici vzdálenost |MC| na obě strany — dostanete vrcholy A a B.', tvary: [K(M, h), B(A, 'A'), B(Bb, 'B')] },
          { text: 'Dorýsujte trojúhelník ABC.', tvary: strany([A, Bb, C]) },
        ],
        napovedy: ['Kde leží těžiště trojúhelníku? Na těžnici, ve dvou třetinách její délky od vrcholu. Kam tedy vede těžnice z vrcholu C?',
          'Prodlužte CT za T o polovinu délky |CT| — tak najdete střed M přepony. Přepona leží na kolmici k CM v bodě M a A, B jsou od M stejně daleko jako C.',
          'Vrcholy A a B jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 27) Rovnoramenný trojúhelník KLM se základnou LM, vrchol M na kružnici k (M9 2024/2 ú. 10; 2 řešení) ──
  function rovnoramennyKruz() {
    for (let g = 0; g < 1500; g++) {
      const Kk = bod(nah(120, 280), nah(100, 200)), rr = nah(85, 130), L = secti(Kk, nasob(smer(nah(0, 2 * Math.PI)), rr));
      const S = secti(Kk, nasob(smer(nah(0, 2 * Math.PI)), nah(80, 150))), r = nah(40, 70);
      if (S.x - r < 10 || S.x + r > W - 10 || S.y - r < 10 || S.y + r > H - 10) continue;   // kružnice k celá v okně
      const Mv = G.prusecikyKK(Kk, rr, S, r);
      if (Mv.length !== 2) continue;
      const vse = [Kk, L, S].concat(Mv);
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      if (Mv.some(m => G.vzdalOdPrimky(m, Kk, L) < 20) || Math.abs(vzdal(S, L) - r) < 20) continue;
      return {
        typ: 'rovnoramennyKruz', nazev: 'Rovnoramenný trojúhelník — vrchol na kružnici',
        text: 'Body K a L jsou vrcholy rovnoramenného trojúhelníku KLM se základnou LM. Vrchol M leží na kružnici k se středem S. Sestrojte všechny takové trojúhelníky KLM. Najděte všechna řešení.',
        dane: { body: { K: Kk, L, S }, kruznice: [{ c: S, r, nazev: 'k' }] },
        hledane: ['M'], reseni: [{ M: Mv[0] }, { M: Mv[1] }], pomocne: [],
        postup: [
          { text: 'Ramena KL a KM jsou shodná, takže vrchol M má od bodu K stejnou vzdálenost jako L: leží na kružnici se středem K a poloměrem |KL|.', tvary: [K(Kk, rr)] },
          { text: 'Vrchol M leží zároveň na kružnici k. Průsečíky obou kružnic jsou M₁ a M₂.', tvary: [B(Mv[0], 'M₁'), B(Mv[1], 'M₂')] },
          { text: 'Úloha má dvě řešení: trojúhelníky KLM₁ a KLM₂.', tvary: strany([Kk, L, Mv[0]]).concat(strany([Kk, L, Mv[1]])) },
        ],
        napovedy: ['Které strany trojúhelníku KLM jsou shodné, když LM je základna? Kde tedy leží všechny body, které se hodí za M?',
          'Narýsujte kružnici se středem K a poloměrem |KL| a najděte její průsečíky s kružnicí k.',
          'Řešení jsou dvě: M₁ a M₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 28) Pravoúhlý lichoběžník: vrcholy A, B, D → vrchol C (M9 2017/1 ú. 10) ──
  function pravouhlyLich() {
    for (let g = 0; g < 800; g++) {
      const A = bod(nah(40, 360), nah(40, 260)), zak = nah(140, 200), u = smer(nah(0, 2 * Math.PI)), n = rot(u);
      const Bb = secti(A, nasob(u, zak)), h = nah(60, 110) * vyber([-1, 1]);
      const s = vyber([nah(30, zak - 60), -nah(30, 60)]);             // úhel DAB zjevně není pravý
      const D = secti(A, secti(nasob(u, s), nasob(n, h))), C = secti(Bb, nasob(n, h));
      if (!vsechnyUvnitr([A, Bb, C, D]) || !rozestup([A, Bb, C, D], 40)) continue;
      return {
        typ: 'pravouhlyLich', nazev: 'Pravoúhlý lichoběžník — čtvrtý vrchol',
        text: 'Body A, B a D jsou vrcholy pravoúhlého lichoběžníku ABCD se základnami AB a CD. Sestrojte vrchol C a lichoběžník narýsujte.',
        dane: { body: { A, B: Bb, D }, usecky: [{ p: A, q: Bb }, { p: A, q: D }] },
        hledane: ['C'], reseni: [{ C }], pomocne: [],
        postup: [
          { text: 'Pravoúhlý lichoběžník má jedno rameno kolmé k základnám. Úhel DAB pravý není, takže kolmé je rameno BC: bodem B veďte kolmici k přímce AB.', tvary: [P({ p: Bb, q: secti(Bb, n) })] },
          { text: 'Základna CD je rovnoběžná se základnou AB: bodem D veďte rovnoběžku s přímkou AB.', tvary: [P({ p: D, q: secti(D, u) })] },
          { text: 'Průsečík kolmice a rovnoběžky je vrchol C. Dorýsujte lichoběžník ABCD.', tvary: [B(C, 'C'), U(Bb, C), U(C, D)] },
        ],
        napovedy: ['Pravoúhlý lichoběžník má jedno rameno kolmé k základnám. Které to je, když úhel u vrcholu A pravý není?',
          'Rameno BC je kolmé k AB a základna CD je rovnoběžná s AB. Veďte bodem B kolmici a bodem D rovnoběžku s přímkou AB.',
          'Vrchol C je teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 29) Trojúhelník PQR: přímka o je osou některé strany (M9 2022/1 ú. 9, M7 2022/1 ú. 8; 2 řešení) ──
  function osaStrany() {
    for (let g = 0; g < 1500; g++) {
      const Pp = bod(nah(80, 320), nah(60, 240)), Q = secti(Pp, nasob(smer(nah(0, 2 * Math.PI)), nah(90, 160)));
      const o = primka(bod(nah(120, 280), nah(90, 210)), smer(nah(0, Math.PI)));
      const R1 = osove(Pp, o.p, o.q), R2 = osove(Q, o.p, o.q);
      if (!vsechnyUvnitr([Pp, Q, R1, R2]) || !rozestup([Pp, Q, R1, R2], 40)) continue;
      if (G.vzdalOdPrimky(R1, Pp, Q) < 25 || G.vzdalOdPrimky(R2, Pp, Q) < 25) continue;   // žádný „plochý" trojúhelník
      const F1 = pata(Pp, o.p, o.q), F2 = pata(Q, o.p, o.q);
      return {
        typ: 'osaStrany', nazev: 'Trojúhelník — osa strany',
        text: 'Body P a Q jsou vrcholy trojúhelníku PQR. Přímka o je osou některé jeho strany. Sestrojte vrchol R a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { P: Pp, Q }, primky: [Object.assign({ nazev: 'o' }, o)] },
        hledane: ['R'], reseni: [{ R: R1 }, { R: R2 }], pomocne: [F1, F2],
        postup: [
          { text: 'Osa strany je kolmá ke straně a prochází jejím středem, takže krajní body strany jsou podle ní souměrné. Je-li o osou strany PR, je R obraz bodu P: kolmice z P k ose a stejná vzdálenost na druhou stranu.', tvary: [P({ p: Pp, q: R1 }), K(F1, vzdal(Pp, F1)), B(R1, 'R₁')] },
          { text: 'Je-li o osou strany QR, je R obraz bodu Q v osové souměrnosti s osou o.', tvary: [P({ p: Q, q: R2 }), K(F2, vzdal(Q, F2)), B(R2, 'R₂')] },
          { text: 'Osou strany PQ přímka o být nemůže — obraz bodu P podle o není bod Q. Úloha má dvě řešení: trojúhelníky PQR₁ a PQR₂.', tvary: strany([Pp, Q, R1]).concat(strany([Pp, Q, R2])) },
        ],
        napovedy: ['Osa strany je kolmá ke straně a prochází jejím středem — krajní body strany jsou podle ní souměrné. Kterou stranou může být úsečka s koncem P nebo Q?',
          'Sestrojte obraz bodu P i obraz bodu Q v osové souměrnosti s osou o. Každý z nich je jedno řešení.',
          'Řešení jsou dvě: R₁ a R₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 30) Pravidelný šestiúhelník ze středu S a vrcholu A (M9 2026/2 ú. 9, nanečisto 2026 ú. 9) ──
  function sestiuhelnik() {
    for (let g = 0; g < 400; g++) {
      const S = bod(nah(150, 250), nah(120, 180)), R = nah(58, 95), f = nah(0, 2 * Math.PI);
      const V = [0, 1, 2, 3, 4, 5].map(i => secti(S, nasob(smer(f + i * Math.PI / 3), R)));
      if (!vsechnyUvnitr(V)) continue;
      const [A, Bb, C, D, E, F] = V;
      return {
        typ: 'sestiuhelnik', nazev: 'Pravidelný šestiúhelník',
        text: 'Bod S je střed pravidelného šestiúhelníku ABCDEF a bod A je jeho vrchol. Sestrojte zbývající vrcholy a šestiúhelník narýsujte.',
        dane: { body: { S, A } },
        hledane: ['B', 'C', 'D', 'E', 'F'], reseni: [{ B: Bb, C, D, E, F }], pomocne: [],
        postup: [
          { text: 'Všechny vrcholy pravidelného šestiúhelníku leží na kružnici se středem S a poloměrem |SA|.', tvary: [K(S, R)] },
          { text: 'Šestiúhelník se skládá ze šesti rovnostranných trojúhelníků, takže jeho strana je stejně dlouhá jako poloměr. Z bodu A naneste na kružnici kružítkem vzdálenost |SA| — dostanete vrchol B, z něj stejně vrchol C.', tvary: [K(A, R), B(Bb, 'B'), K(Bb, R), B(C, 'C')] },
          { text: 'Pokračujte stejně k vrcholům D, E a F.', tvary: [B(D, 'D'), B(E, 'E'), B(F, 'F')] },
          { text: 'Dorýsujte šestiúhelník ABCDEF.', tvary: strany(V) },
        ],
        napovedy: ['Jak dlouhá je strana pravidelného šestiúhelníku ve srovnání se vzdáleností vrcholu od středu? Šestiúhelník se skládá ze šesti rovnostranných trojúhelníků.',
          'Narýsujte kružnici se středem S přes bod A a naneste na ni kružítkem šestkrát vzdálenost |SA|.',
          'Vrcholy B až F jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 31) Trojúhelník z vrcholu C a středů dvou stran S₁, S₂ (M7 2021/2 ú. 9; 3 řešení) ──
  function stredyStran() {
    for (let g = 0; g < 3000; g++) {
      const C = bod(nah(140, 260), nah(110, 190));
      const X = secti(C, nasob(smer(nah(0, 2 * Math.PI)), nah(70, 105))), Y = secti(C, nasob(smer(nah(0, 2 * Math.PI)), nah(70, 105)));
      const S1 = stred(C, X), S2 = stred(C, Y);
      // S₁, S₂ na stranách z C; S₁ na CA a S₂ na AB (A = X); S₂ na CA a S₁ na AB (A = Y)
      const Z2 = secti(C, odecti(Y, X)), Z3 = secti(C, odecti(X, Y));
      const vse = [C, S1, S2, X, Y, Z2, Z3];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      // žádné ze tří řešení nesmí být „plochý" trojúhelník (hlídat jen první nestačilo)
      if (G.vzdalOdPrimky(C, X, Y) < 25 || G.vzdalOdPrimky(C, X, Z2) < 25 || G.vzdalOdPrimky(C, Y, Z3) < 25) continue;
      return {
        typ: 'stredyStran', nazev: 'Trojúhelník — středy dvou stran',
        text: 'Bod C je vrchol trojúhelníku ABC a body S₁, S₂ jsou středy dvou jeho stran. Sestrojte vrcholy A a B a trojúhelník narýsujte. Najděte všechna řešení. Jsou tři.',
        dane: { body: { C, 'S₁': S1, 'S₂': S2 } },
        hledane: ['A', 'B'], reseni: [{ A: X, B: Y }, { A: X, B: Z2 }, { A: Y, B: Z3 }], pomocne: [],
        postup: [
          { text: 'Jsou-li S₁ a S₂ středy obou stran vycházejících z vrcholu C, jsou vrcholy obrazy bodu C ve středových souměrnostech se středy S₁ a S₂: na přímce CS₁ za bodem S₁ a na přímce CS₂ za bodem S₂, vždy ve stejné vzdálenosti.', tvary: [P({ p: C, q: S1 }), P({ p: C, q: S2 }), B(X, 'A₁'), B(Y, 'B₁')] },
          { text: 'Je-li S₁ středem strany CA a S₂ středem protější strany AB: vrchol A je tentýž bod A₁ a vrchol B₂ je obraz bodu A₁ ve středové souměrnosti se středem S₂.', tvary: [P({ p: X, q: S2 }), B(Z2, 'B₂')] },
          { text: 'Je-li naopak S₂ středem strany CA a S₁ středem strany AB: vrcholem A je bod B₁ a vrchol B₃ je jeho obraz podle středu S₁.', tvary: [P({ p: Y, q: S1 }), B(Z3, 'B₃')] },
          { text: 'Úloha má tři řešení: trojúhelníky A₁B₁C, A₁B₂C a B₁B₃C.', tvary: strany([X, Y, C]).concat(strany([X, Z2, C]), strany([Y, Z3, C])) },
        ],
        napovedy: ['Středy dvou stran — ale kterých? Buď obou stran, které vycházejí z vrcholu C, nebo jedné z nich a strany protější. Vyzkoušejte všechny možnosti.',
          'Vrchol na straně s vrcholem C je obraz bodu C ve středové souměrnosti se středem ve středu té strany. Zbývající vrchol je pak obraz nalezeného vrcholu podle druhého středu.',
          'Řešení jsou tři. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 32) Rovnoramenný lichoběžník EFGH ze tří vrcholů (M7 2025/1 ú. 9, M9 2016 ilustrační ú. 9; 2 řešení) ──
  function lichobeznikTri() {
    for (let g = 0; g < 3000; g++) {
      const E = bod(nah(40, 360), nah(40, 260)), F = secti(E, nasob(smer(nah(0, 2 * Math.PI)), nah(120, 180)));
      const G0 = secti(F, nasob(smer(nah(0, 2 * Math.PI)), nah(80, 140)));
      const oEF = osaUsecky(E, F), oFG = osaUsecky(F, G0);
      const H1 = osove(G0, oEF.PQ[0], oEF.PQ[1]), H2 = osove(E, oFG.PQ[0], oFG.PQ[1]);
      if (!vsechnyUvnitr([E, F, G0, H1, H2]) || !rozestup([E, F, G0, H1, H2], 40)) continue;
      // oba lichoběžníky konvexní a žádný z nich obdélník
      if (!konvexni([E, F, G0, H1]) || !konvexni([E, F, G0, H2])) continue;
      if (Math.abs(vzdal(E, F) - vzdal(G0, H1)) < 20 || Math.abs(vzdal(F, G0) - vzdal(H2, E)) < 20) continue;
      return {
        typ: 'lichobeznikTri', nazev: 'Lichoběžník — tři vrcholy',
        text: 'Body E, F a G jsou vrcholy rovnoramenného lichoběžníku EFGH. Sestrojte vrchol H a lichoběžník narýsujte. Najděte všechna řešení.',
        dane: { body: { E, F, G: G0 }, usecky: [{ p: E, q: F }, { p: F, q: G0 }] },
        hledane: ['H'], reseni: [{ H: H1 }, { H: H2 }], pomocne: [stred(E, F), stred(F, G0)],
        postup: [
          { text: 'Rovnoramenný lichoběžník je souměrný podle osy svých základen. Jsou-li základnami EF a GH, je H obraz bodu G podle osy úsečky EF: sestrojte osu EF a k bodu G najděte obraz H₁.', tvary: oEF.tvary.concat([P({ p: G0, q: H1 }), B(H1, 'H₁')]) },
          { text: 'Jsou-li základnami FG a HE, je H obraz bodu E podle osy úsečky FG.', tvary: oFG.tvary.concat([P({ p: E, q: H2 }), B(H2, 'H₂')]) },
          { text: 'Úloha má dvě řešení: lichoběžníky EFGH₁ a EFGH₂.', tvary: strany([E, F, G0, H1]).concat(strany([E, F, G0, H2])) },
        ],
        napovedy: ['Které dvojice stran mohou být základnami, když E, F, G jsou po sobě jdoucí vrcholy? A podle čeho je rovnoramenný lichoběžník souměrný?',
          'Pro základny EF a GH je H obraz bodu G podle osy úsečky EF. Pro základny FG a HE je H obraz bodu E podle osy úsečky FG.',
          'Řešení jsou dvě: H₁ a H₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 33) Obdélník: sousední vrcholy B, C a střed S na přímce p (M7 2025/2 ú. 8) ──
  function obdelnikSp() {
    for (let g = 0; g < 800; g++) {
      const Bb = bod(nah(60, 340), nah(60, 240)), uBC = smer(nah(0, 2 * Math.PI)), bc = nah(80, 140);
      const C = secti(Bb, nasob(uBC, bc)), M = stred(Bb, C), n = rot(uBC);
      const S = secti(M, nasob(n, nah(35, 75) * vyber([-1, 1])));
      const A = stredove(C, S), D = stredove(Bb, S), up = smer(nah(0, Math.PI));
      if (Math.abs(skal(up, n)) > Math.cos(Math.PI / 6)) continue;        // p svírá s osou BC aspoň 30°
      if (!vsechnyUvnitr([A, Bb, C, D, S]) || !rozestup([A, Bb, C, D, S], 36)) continue;
      const p = primka(S, up), o = osaUsecky(Bb, C);
      return {
        typ: 'obdelnikSp', nazev: 'Obdélník — střed na přímce',
        text: 'Body B a C jsou sousední vrcholy obdélníku ABCD. Střed S obdélníku leží na přímce p. Sestrojte střed S a vrcholy A, D a obdélník narýsujte.',
        dane: { body: { B: Bb, C }, primky: [Object.assign({ nazev: 'p' }, p)], usecky: [{ p: Bb, q: C }] },
        hledane: ['S', 'A', 'D'], reseni: [{ S, A, D }], pomocne: [M],
        postup: [
          { text: 'Obdélník je souměrný podle osy strany BC a ta prochází jeho středem S. Sestrojte osu úsečky BC.', tvary: o.tvary },
          { text: 'Střed S leží na ose i na přímce p — je to jejich průsečík.', tvary: [B(S, 'S')] },
          { text: 'Úhlopříčky obdélníku se v bodě S půlí: vrchol A leží na přímce CS za S a |SA| = |SC|, vrchol D na přímce BS a |SD| = |SB|.', tvary: [P({ p: C, q: S }), P({ p: Bb, q: S }), K(S, vzdal(S, C)), B(A, 'A'), B(D, 'D')] },
          { text: 'Dorýsujte obdélník ABCD.', tvary: strany([A, Bb, C, D]) },
        ],
        napovedy: ['Obdélník má dvě osy souměrnosti a obě procházejí jeho středem. Která z nich souvisí se stranou BC?',
          'Střed S je průsečík osy úsečky BC s přímkou p. Vrcholy A a D jsou obrazy bodů C a B ve středové souměrnosti se středem S.',
          'Střed S a vrcholy A, D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 34) Rovnoramenný trojúhelník: střed S základny AB, AB kolmá k p, A na p, C na AQ (M7 2026/2 ú. 9) ──
  function rovnoramennyZakl() {
    for (let g = 0; g < 800; g++) {
      const A = bod(nah(60, 340), nah(60, 240)), u = smer(nah(0, Math.PI)), n = rot(u), pp = primka(A, u);
      const a = nah(38, 70) * vyber([-1, 1]);
      const S = secti(A, nasob(n, a)), Bb = secti(A, nasob(n, 2 * a)), C = secti(S, nasob(u, nah(70, 130) * vyber([-1, 1])));
      const Q = secti(A, nasob(odecti(C, A), vyber([nah(0.35, 0.7), nah(1.25, 1.45)])));
      if (!vsechnyUvnitr([A, Bb, C, S, Q]) || !rozestup([A, Bb, C, S, Q], 36)) continue;
      return {
        typ: 'rovnoramennyZakl', nazev: 'Rovnoramenný trojúhelník — střed základny',
        text: 'Bod S je střed základny AB rovnoramenného trojúhelníku ABC. Základna AB je kolmá k přímce p a vrchol A leží na přímce p. Vrchol C leží na přímce AQ. Sestrojte vrcholy A, B, C a trojúhelník narýsujte.',
        dane: { body: { S, Q }, primky: [Object.assign({ nazev: 'p' }, pp)] },
        hledane: ['A', 'B', 'C'], reseni: [{ A, B: Bb, C }], pomocne: [],
        postup: [
          { text: 'Základna AB je kolmá k přímce p a vrchol A na ní leží, takže A je pata kolmice z bodu S na přímku p.', tvary: [P({ p: S, q: A }), B(A, 'A')] },
          { text: 'Bod S je střed základny: vrchol B leží na přímce AS za bodem S a |SB| = |SA|.', tvary: [K(S, Math.abs(a)), B(Bb, 'B')] },
          { text: 'Hlavní vrchol C leží na ose základny — to je kolmice k AB v bodě S, tedy rovnoběžka s p. Zároveň leží na přímce AQ.', tvary: [P({ p: S, q: secti(S, u) }), P({ p: A, q: Q }), B(C, 'C')] },
          { text: 'Dorýsujte trojúhelník ABC.', tvary: strany([A, Bb, C]) },
        ],
        napovedy: ['Kde leží vrchol A, když je základna AB kolmá k přímce p a A na ní leží? A kde leží hlavní vrchol rovnoramenného trojúhelníku?',
          'A je pata kolmice z bodu S na přímku p a B je souměrný s A podle S. Vrchol C je průsečík osy základny (rovnoběžky s p bodem S) s přímkou AQ.',
          'Vrcholy A, B a C jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  /* ── Úlohy s úhlem daným ve stupních (rýsuje se úhloměrem). Úhel se nanáší
     od ramene, které úloha dává (polopřímka KL, SA, CA…); kde zadání stranu
     neurčuje, patří rameno na OBĚ strany a úloha má dvě řešení. ── */

  // ── 35) Trojúhelník KLM: úhel při K ve stupních a |LK| = |LM| (M9 2019/1 ú. 9; 2 řešení) ──
  function rovnoramennyUhel() {
    for (let g = 0; g < 2000; g++) {
      const st = vyber([30, 35, 40, 45, 50, 55]), a = RAD(st);
      const Kk = bod(nah(40, 360), nah(40, 260)), u = smer(nah(0, 2 * Math.PI)), kl = nah(75, 120);
      const L = secti(Kk, nasob(u, kl)), km = 2 * kl * Math.cos(a);          // základna KM rovnoramenného trojúhelníku
      const M1 = secti(Kk, nasob(otoc(u, a), km)), M2 = secti(Kk, nasob(otoc(u, -a), km));
      if (!vsechnyUvnitr([Kk, L, M1, M2]) || !rozestup([Kk, L, M1, M2], 36)) continue;
      return {
        typ: 'rovnoramennyUhel', nazev: 'Trojúhelník — úhel při vrcholu K',
        text: 'Body K a L jsou vrcholy trojúhelníku KLM. Velikost úhlu LKM je ' + st + '° a platí |LK| = |LM|. Sestrojte vrchol M a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { K: Kk, L }, usecky: [{ p: Kk, q: L }] },
        hledane: ['M'], reseni: [{ M: M1 }, { M: M2 }], pomocne: [],
        postup: [
          { text: 'Přiložte úhloměr středem do bodu K a nulou na polopřímku KL. Naneste úhel ' + st + '° na obě strany — zadání neurčuje, na kterou stranu přímky KL vrchol M patří.', tvary: [PL(Kk, M1), PL(Kk, M2)] },
          { text: 'Protože |LK| = |LM|, leží M na kružnici se středem L a poloměrem |LK|.', tvary: [K(L, kl)] },
          { text: 'Vrchol M je druhý průsečík ramene s kružnicí (prvním je bod K). Úloha má dvě řešení: M₁ a M₂.', tvary: [B(M1, 'M₁'), B(M2, 'M₂')].concat(strany([Kk, L, M1]), strany([Kk, L, M2])) },
        ],
        napovedy: ['Na které čáře leží bod M, když je stejně daleko od L jako bod K? A co určuje úhel při vrcholu K?',
          'Úhloměrem narýsujte z bodu K rameno, které svírá s KL úhel ' + st + '°, a to na obě strany. Pak kružnici se středem L přes bod K — M je průsečík.',
          'Řešení jsou dvě: M₁ a M₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 36) Trojúhelník ABC: přímka o je osou strany AB, úhel při A ve stupních, C na polopřímce BX (M9 2021/A ú. 9) ──
  function uhelOsaStrany() {
    for (let g = 0; g < 3000; g++) {
      const st = vyber([45, 50, 55, 60, 65, 70, 75]), a = RAD(st), s = vyber([-1, 1]);
      const Bb = bod(nah(40, 360), nah(40, 260)), uBA = smer(nah(0, 2 * Math.PI)), ab = nah(80, 130);
      const A = secti(Bb, nasob(uBA, ab)), dAC = otoc(nasob(uBA, -1), s * a);
      // polopřímka BX míří na tutéž stranu přímky AB; úhel ABC tak, aby trojúhelník nebyl plochý
      const dBX = otoc(uBA, -s * RAD(nah(40, 145 - st)));
      const C = G.prusecikPP(A, secti(A, dAC), Bb, secti(Bb, dBX));
      if (!C || skal(odecti(C, A), dAC) <= 0 || skal(odecti(C, Bb), dBX) <= 0) continue;
      const X = secti(Bb, nasob(odecti(C, Bb), vyber([nah(0.45, 0.7), nah(1.3, 1.5)])));
      const M = stred(A, Bb), o = primka(M, rot(uBA));
      if (!vsechnyUvnitr([A, Bb, C, X]) || !rozestup([A, Bb, C, X], 36) || G.vzdalOdPrimky(C, A, Bb) < 25) continue;
      return {
        typ: 'uhelOsaStrany', nazev: 'Trojúhelník — úhel a osa strany',
        text: 'Bod B je vrchol trojúhelníku ABC. Přímka o je osou strany AB. Velikost vnitřního úhlu BAC je ' + st + '° a vrchol C leží na polopřímce BX. Sestrojte vrcholy A, C a trojúhelník narýsujte.',
        dane: { body: { B: Bb, X }, primky: [Object.assign({ nazev: 'o' }, o)], poloprimky: [{ p: Bb, q: X }] },
        hledane: ['A', 'C'], reseni: [{ A, C }], pomocne: [M],
        postup: [
          { text: 'Osa strany AB je k ní kolmá a prochází jejím středem, takže A je obraz bodu B v osové souměrnosti s osou o: kolmice z bodu B k ose a stejná vzdálenost na druhou stranu.', tvary: [P({ p: Bb, q: A }), K(M, ab / 2), B(A, 'A')] },
          { text: 'Přiložte úhloměr středem do A a nulou na polopřímku AB. Naneste úhel ' + st + '° na tu stranu přímky AB, na které leží polopřímka BX.', tvary: [PL(A, C)] },
          { text: 'Vrchol C je průsečík ramene s polopřímkou BX. Dorýsujte trojúhelník ABC.', tvary: [B(C, 'C')].concat(strany([A, Bb, C])) },
        ],
        napovedy: ['Co platí pro body A a B, když je přímka o osou úsečky AB?',
          'A je obraz bodu B podle přímky o. U vrcholu A pak úhloměrem naneste od AB úhel ' + st + '° směrem k polopřímce BX — C je průsečík ramene s BX.',
          'Vrcholy A a C jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 37) Rovnoběžník ABCD: vrchol A, střed S, B na přímce p, úhel ASB ve stupních (M9 2022/D ú. 9, M7 2022/D ú. 8) ──
  function rovnobeznikUhel() {
    for (let g = 0; g < 3000; g++) {
      const st = vyber([60, 70, 80, 100, 110, 120, 130]), a = RAD(st), s = vyber([-1, 1]);
      const S = bod(nah(80, 320), nah(70, 230)), uSA = smer(nah(0, 2 * Math.PI)), sa = nah(45, 80);
      const A = secti(S, nasob(uSA, sa)), dB = otoc(uSA, s * a), dJine = otoc(uSA, -s * a);
      const Bb = secti(S, nasob(dB, nah(45, 90))), up = smer(nah(0, Math.PI));
      if (Math.abs(G.vekt(up, dB)) < 0.5) continue;                          // p svírá s ramenem SB aspoň 30°
      // druhé rameno přímku p neprotne (průsečík přímek leží za vrcholem S) → řešení je jedno
      const X2 = G.prusecikPP(S, secti(S, dJine), Bb, secti(Bb, up));
      if (X2 && skal(odecti(X2, S), dJine) > 0) continue;
      const C = stredove(A, S), D = stredove(Bb, S), p = primka(Bb, up);
      if (!vsechnyUvnitr([A, Bb, C, D, S]) || !rozestup([A, Bb, C, D, S], 36)) continue;
      return {
        typ: 'rovnobeznikUhel', nazev: 'Rovnoběžník — úhel úhlopříček',
        text: 'Bod A je vrchol rovnoběžníku ABCD a bod S je jeho střed. Vrchol B leží na přímce p a úhel ASB má velikost ' + st + '°. Sestrojte vrcholy B, C, D a rovnoběžník narýsujte.',
        dane: { body: { A, S }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'C', 'D'], reseni: [{ B: Bb, C, D }], pomocne: [],
        postup: [
          { text: 'Úhel ASB má vrchol ve středu S. Přiložte úhloměr středem do S a nulou na polopřímku SA a naneste úhel ' + st + '° na obě strany — přímku p protne jen jedno z ramen.', tvary: [PL(S, Bb), PL(S, secti(S, dJine))] },
          { text: 'Vrchol B je průsečík toho ramene s přímkou p.', tvary: [B(Bb, 'B')] },
          { text: 'Úhlopříčky rovnoběžníku se v bodě S půlí: C je obraz bodu A a D obraz bodu B ve středové souměrnosti se středem S.', tvary: [P({ p: A, q: S }), P({ p: Bb, q: S }), K(S, sa), K(S, vzdal(S, Bb)), B(C, 'C'), B(D, 'D')] },
          { text: 'Dorýsujte rovnoběžník ABCD.', tvary: strany([A, Bb, C, D]) },
        ],
        napovedy: ['Úhel ASB má vrchol ve středu S a jeho ramena vedou do vrcholů A a B. Co víte o úhlopříčkách rovnoběžníku?',
          'Úhloměrem naneste u bodu S od polopřímky SA úhel ' + st + '°; B je průsečík ramene s přímkou p. C a D jsou obrazy bodů A a B podle středu S.',
          'Vrcholy B, C a D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 38) Pravoúhlý trojúhelník: pravý úhel při A, B na přímce b, C na přímce c, úhel při C ve stupních (M9 2023/D ú. 10; 2 řešení) ──
  function pravouhlyUhel() {
    for (let g = 0; g < 3000; g++) {
      const st = vyber([30, 35, 40, 45, 50, 55]), a = RAD(st);
      const A = bod(nah(40, 360), nah(40, 260)), u = smer(nah(0, Math.PI)), n = nasob(rot(u), vyber([-1, 1]));
      const ac = nah(55, 95), C = secti(A, nasob(n, ac)), ab = ac * Math.tan(a);
      const B1 = secti(A, nasob(u, ab)), B2 = secti(A, nasob(u, -ab)), uc = smer(nah(0, Math.PI));
      if (Math.abs(G.vekt(uc, n)) < 0.5) continue;                           // c svírá s odvěsnou AC aspoň 30°
      const b = primka(A, u), c = primka(C, uc);
      if (G.vzdalOdPrimky(A, c.p, c.q) < 25) continue;
      if (!vsechnyUvnitr([A, B1, B2, C]) || !rozestup([A, B1, B2, C], 36)) continue;
      return {
        typ: 'pravouhlyUhel', nazev: 'Pravoúhlý trojúhelník — úhel při C',
        text: 'Bod A je vrchol pravoúhlého trojúhelníku ABC s pravým úhlem při vrcholu A. Vrchol B leží na přímce b a vrchol C na přímce c. Velikost vnitřního úhlu při vrcholu C je ' + st + '°. Sestrojte vrcholy B, C a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { A }, primky: [Object.assign({ nazev: 'b' }, b), Object.assign({ nazev: 'c' }, c)] },
        hledane: ['B', 'C'], reseni: [{ B: B1, C }, { B: B2, C }], pomocne: [],
        postup: [
          { text: 'Odvěsna AB leží na přímce b, takže odvěsna AC je k ní kolmá: vrchol C leží na kolmici k přímce b v bodě A. Je to průsečík této kolmice s přímkou c.', tvary: [P({ p: A, q: C }), B(C, 'C')] },
          { text: 'Přiložte úhloměr středem do C a nulou na polopřímku CA. Naneste úhel ' + st + '° na obě strany.', tvary: [PL(C, B1), PL(C, B2)] },
          { text: 'Vrchol B je průsečík ramene s přímkou b. Úloha má dvě řešení: B₁ a B₂.', tvary: [B(B1, 'B₁'), B(B2, 'B₂')].concat(strany([A, B1, C]), strany([A, B2, C])) },
        ],
        napovedy: ['Pravý úhel je při vrcholu A a vrchol B leží na přímce b, která bodem A prochází. Jak tedy vede odvěsna AC?',
          'C je průsečík kolmice k přímce b v bodě A s přímkou c. U vrcholu C pak úhloměrem naneste od CA úhel ' + st + '° na obě strany; B je průsečík ramene s přímkou b.',
          'Řešení jsou dvě: B₁ a B₂ se společným vrcholem C. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 39) Lichoběžník ABCD: |AB| = |AD|, tupý úhel DAB ve stupních, poměr základen (M7 2024/D ú. 9; 2 řešení) ──
  function lichobeznikUhel() {
    for (let g = 0; g < 4000; g++) {
      const st = vyber([110, 115, 120, 125, 130, 135]), a = RAD(st);
      // |AB| : |CD| jen takové, aby šlo |CD| sestrojit kružítkem (polovina, 1,5násobek, dvojnásobek)
      const [m, n, koef] = vyber([[2, 3, '1,5'], [1, 2, '2'], [2, 1, '0,5']]);
      const A = bod(nah(40, 360), nah(40, 260)), uAD = smer(nah(0, 2 * Math.PI)), ad = nah(45, 70);
      const D = secti(A, nasob(uAD, ad));
      const res = [1, -1].map(s => { const Bb = secti(A, nasob(otoc(uAD, s * a), ad)); return { B: Bb, C: secti(D, nasob(odecti(Bb, A), n / m)) }; });
      const vse = [A, D].concat(...res.map(r => [r.B, r.C]));
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || !res.every(r => konvexni([A, r.B, r.C, D]))) continue;
      const [r1, r2] = res;
      return {
        typ: 'lichobeznikUhel', nazev: 'Lichoběžník — tupý úhel',
        text: 'Body A a D jsou vrcholy lichoběžníku ABCD se základnami AB a CD. Platí |AB| = |AD|, velikost vnitřního úhlu DAB je ' + st + '° a |AB| : |CD| = ' + m + ' : ' + n + '. Sestrojte vrcholy B, C a lichoběžník narýsujte. Najděte všechna řešení.',
        dane: { body: { A, D }, usecky: [{ p: A, q: D }] },
        hledane: ['B', 'C'], reseni: res.map(r => ({ B: r.B, C: r.C })), pomocne: [],
        postup: [
          { text: 'Přiložte úhloměr středem do A a nulou na polopřímku AD. Naneste úhel ' + st + '° na obě strany přímky AD.', tvary: [PL(A, r1.B), PL(A, r2.B)] },
          { text: 'Protože |AB| = |AD|, leží B na kružnici se středem A a poloměrem |AD|. Vrchol B je průsečík ramene s kružnicí.', tvary: [K(A, ad), B(r1.B, 'B₁'), B(r2.B, 'B₂')] },
          { text: 'Základna CD je rovnoběžná s AB a z poměru ' + m + ' : ' + n + ' plyne |CD| = ' + koef + ' · |AB|. Bodem D veďte rovnoběžku s AB a naneste na ni |CD| týmž směrem, jakým vede AB od A.', tvary: [P({ p: D, q: r1.C }), P({ p: D, q: r2.C }), B(r1.C, 'C₁'), B(r2.C, 'C₂')] },
          { text: 'Úloha má dvě řešení: lichoběžníky AB₁C₁D a AB₂C₂D.', tvary: strany([A, r1.B, r1.C, D]).concat(strany([A, r2.B, r2.C, D])) },
        ],
        napovedy: ['Kde leží vrchol B, když |AB| = |AD|? A jak vede základna CD vůči základně AB?',
          'Úhloměrem naneste u vrcholu A od AD úhel ' + st + '° na obě strany a kružítkem vzdálenost |AD| — dostanete B. Bodem D veďte rovnoběžku s AB a naneste |CD| = ' + koef + ' · |AB|.',
          'Řešení jsou dvě: B₁, C₁ a B₂, C₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 40) Trojúhelník ABC: strana AC, výška na AC, tupý úhel při C ve stupních, bod M uvnitř (M7 2021/A ú. 9) ──
  function tupyUhelVyska() {
    for (let g = 0; g < 4000; g++) {
      const st = vyber([105, 110, 115, 120, 125, 130]), a = RAD(st), vcm = vyber([2, 2.5, 3, 3.5]), v = vcm * CM;
      const A = bod(nah(40, 360), nah(40, 260)), u = smer(nah(0, 2 * Math.PI)), ac = nah(75, 120), s = vyber([-1, 1]);
      const C = secti(A, nasob(u, ac)), dCB = otoc(nasob(u, -1), s * a);   // rameno CB svírá s CA úhel st
      const Bb = secti(C, nasob(dCB, v / Math.sin(a)));                     // vzdálenost B od přímky AC = výška
      const w = [nah(0.2, 0.5), nah(0.2, 0.5), nah(0.2, 0.5)], sw = w[0] + w[1] + w[2];
      const M = bod((w[0] * A.x + w[1] * Bb.x + w[2] * C.x) / sw, (w[0] * A.y + w[1] * Bb.y + w[2] * C.y) / sw);
      if (Math.min(G.vzdalOdPrimky(M, A, Bb), G.vzdalOdPrimky(M, Bb, C), G.vzdalOdPrimky(M, C, A)) < 10) continue;
      if (!vsechnyUvnitr([A, Bb, C, M]) || !rozestup([A, Bb, C, M], 36)) continue;
      const nM = nasob(rot(u), skal(odecti(M, A), rot(u)) > 0 ? 1 : -1);   // strana přímky AC, na které je M
      return {
        typ: 'tupyUhelVyska', nazev: 'Trojúhelník — tupý úhel a výška',
        text: 'Úsečka AC je strana trojúhelníku ABC a bod M leží uvnitř tohoto trojúhelníku. Výška na stranu AC měří ' + cm(vcm) + ' a velikost vnitřního úhlu při vrcholu C je ' + st + '°. Sestrojte vrchol B a trojúhelník narýsujte.',
        dane: { body: { A, C, M }, usecky: [{ p: A, q: C }] },
        hledane: ['B'], reseni: [{ B: Bb }], pomocne: [],
        postup: [
          { text: 'Výška na stranu AC je vzdálenost vrcholu B od přímky AC. B tedy leží na rovnoběžce s AC ve vzdálenosti ' + cm(vcm) + ', a to na té straně, na které je bod M.', tvary: [P({ p: secti(A, nasob(nM, v)), q: secti(C, nasob(nM, v)) })] },
          { text: 'Přiložte úhloměr středem do C a nulou na polopřímku CA. Naneste úhel ' + st + '° na stranu bodu M.', tvary: [PL(C, Bb)] },
          { text: 'Vrchol B je průsečík ramene s rovnoběžkou. Dorýsujte trojúhelník ABC — bod M leží uvnitř.', tvary: [B(Bb, 'B')].concat(strany([A, Bb, C])) },
        ],
        napovedy: ['Co znamená, že výška na stranu AC měří ' + cm(vcm) + '? Kde všude může vrchol B ležet? A k čemu je bod M?',
          'B leží na rovnoběžce s AC ve vzdálenosti ' + cm(vcm) + ' na straně bodu M. U vrcholu C naneste úhloměrem od CA úhel ' + st + '°; B je průsečík ramene s rovnoběžkou.',
          'Vrchol B je teď vidět v okně.'],
      };
    }
    return null;
  }

  /* ═══ Typy 41–48: dávka 1, ostré úlohy M9 2025 a 2026 (úlohy 9 a 10). Zadání jsou vlastní, stavba stejná:
     víc podmínek najednou (střed + shodná ramena + přímka, kolmice + rozdíl délek, „vzdálenější než“ …),
     často „najděte všechna řešení“. ═══ */

  // ── 41) Rovnoramenný trojúhelník: S je střed ramene AC, střed P ramene BC leží na p (M9 2026/1. náhr. ú. 9; 2 řešení) ──
  function rovnoramennyStred() {
    for (let g = 0; g < 4000; g++) {
      const A = bod(nah(50, 350), nah(50, 250)), ac = nah(100, 170), C = secti(A, nasob(smer(nah(0, 2 * Math.PI)), ac));
      const S = stred(A, C), r = ac / 2, n = smer(nah(0, Math.PI));
      const p = primka(secti(C, nasob(n, r * nah(0.15, 0.7) * vyber([-1, 1]))), rot(n));
      const X = G.prusecikyPK(p.p, p.q, C, r);
      if (X.length !== 2) continue;
      const res = X.map(Pp => ({ C, P: Pp, B: stredove(C, Pp) }));
      const vse = [A, S, C].concat(...res.map(s => [s.P, s.B]));
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || res.some(s => G.vzdalOdPrimky(s.B, A, C) < 30)) continue;
      const [r1, r2] = res;
      return {
        typ: 'rovnoramennyStred', nazev: 'Rovnoramenný trojúhelník — středy ramen',
        text: 'Trojúhelník ABC je rovnoramenný a jeho ramena AC a BC jsou shodná. Bod S je střed ramene AC a střed P ramene BC leží na přímce p. Sestrojte vrchol C, střed P a vrchol B a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { A, S }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['C', 'P', 'B'], reseni: res, pomocne: [],
        postup: [
          { text: 'S je střed úsečky AC, takže C je obraz bodu A ve středové souměrnosti se středem S: na polopřímku AS naneste od S vzdálenost |SA|.', tvary: [P({ p: A, q: S }), B(C, 'C')] },
          { text: 'Ramena jsou shodná, |BC| = |AC|, a P je střed BC, takže |CP| = ½|BC| = ½|AC| = |CS|. Střed P leží na kružnici se středem C a poloměrem |CS|.', tvary: [K(C, r)] },
          { text: 'Zároveň P leží na přímce p. Průsečíky kružnice s přímkou p jsou středy P₁ a P₂.', tvary: [B(r1.P, 'P₁'), B(r2.P, 'P₂')] },
          { text: 'P je střed úsečky BC, takže B je obraz bodu C ve středové souměrnosti podle P. Úloha má dvě řešení: trojúhelníky ABC s vrcholem B₁ a B₂.', tvary: [P({ p: C, q: r1.P }), P({ p: C, q: r2.P }), B(r1.B, 'B₁'), B(r2.B, 'B₂')].concat(strany([A, r1.B, C]), strany([A, r2.B, C])) },
        ],
        napovedy: ['Bod S je střed ramene AC. Jak z bodů A a S najdete vrchol C? A jak dlouhá je úsečka CP, když P je střed ramene BC a obě ramena jsou stejně dlouhá?',
          'C je obraz bodu A podle S. Střed P je od C vzdálený o |CS| (polovina ramene), takže leží na kružnici se středem C a poloměrem |CS| a zároveň na přímce p. B je obraz bodu C podle P.',
          'Řešení jsou dvě: C, P₁, B₁ a C, P₂, B₂ (C je společný). V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 42) Obdélník KLMN: KL na přímce k, U uvnitř strany KN, V střed obdélníku (M9 2026/1. náhr. ú. 10) ──
  function obdelnikKolmice() {
    for (let g = 0; g < 4000; g++) {
      const u = smer(nah(-0.5, 0.5)), nn = nasob(rot(u), vyber([-1, 1]));
      const Kk = bod(nah(50, 220), nah(60, 240)), w = nah(110, 190), h = nah(95, 150), t = nah(0.3, 0.7);
      const L = secti(Kk, nasob(u, w)), N = secti(Kk, nasob(nn, h)), M = secti(L, nasob(nn, h));
      const V = stred(Kk, M), Uu = secti(Kk, nasob(nn, h * t)), k = primka(Kk, u);
      const vse = [Kk, L, M, N, Uu, V];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      return {
        typ: 'obdelnikKolmice', nazev: 'Obdélník — kolmice z bodu na straně',
        text: 'Obdélník KLMN má stranu KL na přímce k. Bod U leží uvnitř strany KN a bod V je průsečík úhlopříček obdélníku. Sestrojte vrcholy K, L, M, N a obdélník narýsujte.',
        dane: { body: { U: Uu, V }, primky: [Object.assign({ nazev: 'k' }, k)] },
        hledane: ['K', 'L', 'M', 'N'], reseni: [{ K: Kk, L, M, N }], pomocne: [],
        postup: [
          { text: 'Strana KN je kolmá ke straně KL, tedy k přímce k, a prochází bodem U. Kolmice z U na přímku k ji protne ve vrcholu K.', tvary: [P({ p: Kk, q: Uu }), B(Kk, 'K')] },
          { text: 'V je střed úhlopříčky KM: vrchol M je obraz bodu K ve středové souměrnosti podle V.', tvary: [P({ p: Kk, q: V }), B(M, 'M')] },
          { text: 'Vrchol N leží na kolmici KU a na rovnoběžce s přímkou k vedené bodem M.', tvary: [P({ p: M, q: secti(M, nasob(u, 50)) }), B(N, 'N')] },
          { text: 'Vrchol L je obraz bodu N podle V (úhlopříčky se půlí ve V). Dorýsujte obdélník.', tvary: [P({ p: N, q: V }), B(L, 'L')].concat(strany([Kk, L, M, N])) },
        ],
        napovedy: ['Co víte o straně KN vzhledem k přímce k? A co o úhlopříčkách obdélníku a bodu V?',
          'K je pata kolmice z bodu U na přímku k. M je obraz bodu K podle V. N leží na přímce KU a na rovnoběžce s k bodem M; L je obraz bodu N podle V.',
          'Vrcholy K, L, M, N jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 43) Trojúhelník: AB ⊥ b, B na b, |BC| = |AB| + d cm, C na c (M9 2026/1. řádný ú. 9; 2 řešení) ──
  function trojuhelnikRozdil() {
    for (let g = 0; g < 6000; g++) {
      const d = vyber([1, 1.5, 2, 2.5]), A = bod(nah(40, 360), nah(40, 260)), nB = smer(nah(0, 2 * Math.PI)), ab = nah(50, 95);
      const Bb = secti(A, nasob(nB, ab)), b = primka(Bb, rot(nB)), r = ab + d * CM;
      const Q = secti(Bb, nasob(smer(nah(0, 2 * Math.PI)), r * nah(0.3, 0.85))), uc = smer(nah(0, Math.PI)), c = primka(Q, uc);
      const X = G.prusecikyPK(c.p, c.q, Bb, r);
      if (X.length !== 2 || Math.abs(G.vekt(rot(nB), uc)) < 0.4) continue;   // c není skoro rovnoběžná s b (aspoň ~24°)
      const vse = [A, Bb, X[0], X[1]];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || X.some(x => G.vzdalOdPrimky(x, A, Bb) < 30)) continue;
      if (G.vzdalOdPrimky(A, c.p, c.q) < 25) continue;
      return {
        typ: 'trojuhelnikRozdil', nazev: 'Trojúhelník — kolmice a rozdíl stran',
        text: 'Strana AB trojúhelníku ABC je kolmá k přímce b a vrchol B leží na přímce b. Strana BC je o ' + cm(d) + ' delší než strana AB a vrchol C leží na přímce c. Sestrojte vrcholy B, C a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { A }, primky: [Object.assign({ nazev: 'b' }, b), Object.assign({ nazev: 'c' }, c)] },
        hledane: ['B', 'C'], reseni: X.map(x => ({ B: Bb, C: x })), pomocne: [],
        postup: [
          { text: 'AB je kolmá k přímce b a B na ní leží: B je pata kolmice z bodu A na přímku b.', tvary: [P({ p: A, q: Bb }), B(Bb, 'B')] },
          { text: '|BC| = |AB| + ' + cm(d) + '. Kružítkem změřte |AB| a přidejte ' + cm(d) + ' (například na prodloužení polopřímky BA za bod A). C leží na kružnici se středem B a tímto poloměrem.', tvary: [K(Bb, r)] },
          { text: 'C leží také na přímce c. Průsečíky kružnice s přímkou c jsou vrcholy C₁ a C₂ — úloha má dvě řešení.', tvary: [B(X[0], 'C₁'), B(X[1], 'C₂')].concat(strany([A, Bb, X[0]]), strany([A, Bb, X[1]])) },
        ],
        napovedy: ['Kde leží vrchol B, když je AB kolmá k přímce b? A na jaké kružnici leží C, když znáte délku |BC|?',
          'B je pata kolmice z A na přímku b. Poloměr kružnice se středem B je |AB| + ' + cm(d) + '; C je její průsečík s přímkou c.',
          'Řešení jsou dvě: C₁ a C₂ se společným vrcholem B. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 44) Pravoúhlý rovnoramenný trojúhelník BCD (pravý úhel při C), C je od přímky p dál než B (M9 2026/2. náhr. ú. 9) ──
  function pravouhlyRovnoramenny() {
    for (let g = 0; g < 6000; g++) {
      const Bb = bod(nah(50, 350), nah(50, 250)), bd = nah(90, 150), D = secti(Bb, nasob(smer(nah(0, 2 * Math.PI)), bd));
      const M = stred(Bb, D), nv = rot(jednot(odecti(D, Bb))), h = bd / 2;
      const C1 = secti(M, nasob(nv, h)), C2 = secti(M, nasob(nv, -h));
      const p = primka(bod(nah(40, 360), nah(40, 260)), smer(nah(0, Math.PI)));
      const dist = x => G.vzdalOdPrimky(x, p.p, p.q), dB = dist(Bb);
      if (dist(D) < 25 || dB < 25) continue;
      const platne = [C1, C2].filter(x => dist(x) > dB), jine = [C1, C2].filter(x => dist(x) <= dB);
      if (platne.length !== 1 || dist(platne[0]) - dB < 20 || dB - dist(jine[0]) < 20) continue;
      const C = platne[0], vse = [Bb, D, C1, C2];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const os = osaUsecky(Bb, D);
      return {
        typ: 'pravouhlyRovnoramenny', nazev: 'Pravoúhlý rovnoramenný trojúhelník',
        text: 'Body B a D jsou vrcholy pravoúhlého rovnoramenného trojúhelníku BCD s pravým úhlem při vrcholu C. Bod C je od přímky p dál než bod B. Sestrojte vrchol C a trojúhelník narýsujte.',
        dane: { body: { B: Bb, D }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['C'], reseni: [{ C }], pomocne: [M],
        postup: [
          { text: 'Trojúhelník je rovnoramenný se základnou (přeponou) BD, takže C leží na ose úsečky BD.', tvary: os.tvary },
          { text: 'Úhly při B a D jsou 45°, takže trojúhelník BMC (M je střed BD) je pravoúhlý rovnoramenný a |MC| = |MB|. Naneste od M na osu vzdálenost |MB| na obě strany — dostanete dva body (stejně daleko od BD na obou stranách).', tvary: [K(M, h), B(C1), B(C2)] },
          { text: 'Zbývá vybrat bod, který je od přímky p dál než bod B (změřte vzdálenosti kolmicemi na p nebo kružítkem). To je vrchol C. Dorýsujte trojúhelník BCD.', tvary: strany([Bb, C, D]) },
        ],
        napovedy: ['Trojúhelník BCD je rovnoramenný s pravým úhlem při C. Kde leží vrchol C vzhledem k úsečce BD? Jak daleko od středu M úsečky BD, když jsou úhly při B a D 45°?',
          'Na ose úsečky BD naneste od středu M vzdálenost |MB| na obě strany. Vyberte ten z obou bodů, který je od přímky p dál než B.',
          'Vrchol C je teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 45) Obdélník ABCD: D, střed S kružnice opsané, A a C na přímce přes U (M9 2026/2. náhr. ú. 10) ──
  function obdelnikOpsana() {
    for (let g = 0; g < 6000; g++) {
      const S = bod(nah(130, 270), nah(110, 190)), R = nah(65, 100), f = nah(0, 2 * Math.PI), a = nah(0.55, 1.25) * vyber([-1, 1]);
      const D = secti(S, nasob(smer(f), R)), Bb = stredove(D, S);
      const A = secti(S, nasob(smer(f + a), R)), C = stredove(A, S);
      const Uu = secti(S, nasob(smer(f + a), R * nah(0.35, 0.6) * vyber([-1, 1])));
      const vse = [D, S, Uu, A, Bb, C];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      return {
        typ: 'obdelnikOpsana', nazev: 'Obdélník — kružnice opsaná',
        text: 'Bod D je vrchol obdélníku ABCD a bod S je střed kružnice, na které leží všechny vrcholy tohoto obdélníku. Vrcholy A a C leží na přímce, která prochází bodem U. Sestrojte vrcholy A, B, C a obdélník narýsujte.',
        dane: { body: { D, S, U: Uu } },
        hledane: ['A', 'B', 'C'], reseni: [{ A, B: Bb, C }], pomocne: [],
        postup: [
          { text: 'Úhlopříčka AC je průměr kružnice opsané, takže prochází středem S. Leží tedy na přímce SU.', tvary: [P({ p: S, q: Uu })] },
          { text: 'Všechny vrcholy leží na kružnici k se středem S, která prochází bodem D.', tvary: [K(S, R)] },
          { text: 'Průsečíky přímky SU s kružnicí k jsou vrcholy A a C.', tvary: [B(A, 'A'), B(C, 'C')] },
          { text: 'Úhlopříčky obdélníku se půlí ve středu S: vrchol B je obraz bodu D podle S. Dorýsujte obdélník.', tvary: [P({ p: D, q: S }), B(Bb, 'B')].concat(strany([A, Bb, C, D])) },
        ],
        napovedy: ['Kde u obdélníku leží střed kružnice opsané? Kudy vede úhlopříčka AC?',
          'Úhlopříčka AC prochází středem S a bodem U. Kružnice se středem S přes bod D protne přímku SU v bodech A a C. B je obraz bodu D podle S.',
          'Vrcholy A, B, C jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 46) Pravidelný šestiúhelník: A, osa strany AB je přímka OP, střed S na polopřímce OP (M9 2026/2. řádný ú. 9) ──
  function sestiuhelnikOsa() {
    for (let g = 0; g < 6000; g++) {
      const R = nah(62, 85), f = nah(0, 2 * Math.PI), sg = vyber([-1, 1]), S = bod(nah(150, 250), nah(110, 190));
      const V = [0, 1, 2, 3, 4, 5].map(i => secti(S, nasob(smer(f + sg * i * Math.PI / 3), R)));
      const [A, Bb, C, D, E, F] = V, M = stred(A, Bb), nv = jednot(odecti(S, M)), hh = R * Math.sqrt(3) / 2;
      const O = secti(M, nasob(nv, nah(-0.2, 0.35) * hh)), Pp = secti(O, nasob(nv, nah(45, 75)));
      const vse = V.concat([O, Pp, S]);
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const S2 = secti(M, nasob(nv, -hh));   // druhý průsečík kružnice s osou (mimo polopřímku OP)
      return {
        typ: 'sestiuhelnikOsa', nazev: 'Pravidelný šestiúhelník — osa strany',
        text: 'Bod A je vrchol pravidelného šestiúhelníku ABCDEF. Přímka OP je osou strany AB a střed S šestiúhelníku leží na polopřímce OP. Sestrojte vrcholy B, C, D, E, F a šestiúhelník narýsujte.',
        dane: { body: { A, O, P: Pp } },
        hledane: ['B', 'C', 'D', 'E', 'F'], reseni: [{ B: Bb, C, D, E, F }], pomocne: [M, S],
        postup: [
          { text: 'Přímka OP je osa strany AB, takže B je obraz bodu A v osové souměrnosti podle přímky OP: spusťte z A kolmici na OP a naneste stejnou vzdálenost na druhou stranu.', tvary: [P({ p: O, q: Pp }), U(A, Bb), B(Bb, 'B')] },
          { text: 'Strana pravidelného šestiúhelníku je stejně dlouhá jako vzdálenost vrcholu od středu: |SA| = |AB|. Kružnice se středem A a poloměrem |AB| protne osu ve dvou bodech; střed S je ten, který leží na polopřímce OP (druhý je na opačné straně od O).', tvary: [K(A, R), B(S, 'S'), B(S2)] },
          { text: 'Kružnice se středem S a poloměrem |SA| prochází všemi vrcholy. Kružítkem z bodu B naneste |AB| na kružnici — dostanete C, pak D, E, F.', tvary: [K(S, R), B(C, 'C'), B(D, 'D'), B(E, 'E'), B(F, 'F')] },
          { text: 'Dorýsujte šestiúhelník ABCDEF.', tvary: strany(V) },
        ],
        napovedy: ['Co znamená, že přímka OP je osa strany AB? A jak dlouhá je strana pravidelného šestiúhelníku ve srovnání se vzdáleností vrcholu od středu S?',
          'B je obraz bodu A podle osy OP. Střed S je na ose ve vzdálenosti |AB| od A (kružnice se středem A a poloměrem |AB|) a na polopřímce OP. Pak z B kružítkem naneste |AB| na kružnici se středem S.',
          'Vrcholy B až F jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 47) Rovnoběžník ABCD: A, D, M; úhlopříčka BD na polopřímce DM, úhlopříčka AC je dlouhá |DM| (M9 2025/2. řádný ú. 10) ──
  function rovnobeznikUhlopricka() {
    for (let g = 0; g < 6000; g++) {
      const D = bod(nah(50, 350), nah(50, 250)), fu = nah(0, 2 * Math.PI), u = smer(fu), e = nah(130, 200), M = secti(D, nasob(u, e));
      const ad = nah(0.28, 0.47) * e, phi = nah(0.6, 2.5) * vyber([-1, 1]), A = secti(D, nasob(smer(fu + phi), ad));
      const bb = G.skal(u, odecti(A, D)), t = bb + Math.sqrt(bb * bb + e * e / 4 - ad * ad);   // |AS| = ½|DM|, S na polopřímce DM
      const S = secti(D, nasob(u, t)), Bb = stredove(D, S), C = stredove(A, S), S2 = secti(D, nasob(u, bb - Math.sqrt(bb * bb + e * e / 4 - ad * ad)));
      const vse = [A, D, M, Bb, C, S];   // S nese popisek v postupu
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || G.vzdalOdPrimky(A, D, M) < 30) continue;
      return {
        typ: 'rovnobeznikUhlopricka', nazev: 'Rovnoběžník — úhlopříčky',
        text: 'Body A a D jsou vrcholy rovnoběžníku ABCD. Na polopřímce DM leží jedna z úhlopříček rovnoběžníku a druhá úhlopříčka je stejně dlouhá jako úsečka DM. Sestrojte vrcholy B, C a rovnoběžník narýsujte.',
        dane: { body: { A, D, M } },
        hledane: ['B', 'C'], reseni: [{ B: Bb, C }], pomocne: [S],
        postup: [
          { text: 'Úhlopříčka, která leží na polopřímce DM, začíná ve vrcholu D, je to tedy úhlopříčka BD. Druhá úhlopříčka AC je stejně dlouhá jako DM.', tvary: [PL(D, M)] },
          { text: 'Úhlopříčky se půlí ve středu S, takže |AS| = ½|DM|. S leží na polopřímce DM a na kružnici se středem A a poloměrem ½|DM| (půlku |DM| získáte na kružítku). Druhý průsečík kružnice leží za bodem D, na polopřímku DM nepatří.', tvary: [K(A, e / 2), B(S, 'S'), B(S2)] },
          { text: 'C je obraz bodu A a B je obraz bodu D ve středové souměrnosti podle S. Dorýsujte rovnoběžník ABCD.', tvary: [P({ p: A, q: S }), B(C, 'C'), B(Bb, 'B')].concat(strany([A, Bb, C, D])) },
        ],
        napovedy: ['Kterou úhlopříčku leží na polopřímce DM? A co víte o polohách středu S a délce poloviny druhé úhlopříčky?',
          'Střed S leží na polopřímce DM a je od A vzdálený o ½|DM|. B je obraz D podle S a C je obraz A podle S.',
          'Vrcholy B a C jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 48) Rovnoramenný trojúhelník ABC: M leží na těžnici t_c uvnitř trojúhelníku, M není těžiště (M9 2025/2. řádný ú. 9; 2 řešení) ──
  function rovnoramennyTc() {
    for (let g = 0; g < 8000; g++) {
      const c = nah(110, 150), A = bod(nah(50, 230), nah(190, 262)), e = smer(nah(-0.4, 0.4)), Bb = secti(A, nasob(e, c)), S = stred(A, Bb);
      const nUp = rot(e).y < 0 ? rot(e) : nasob(rot(e), -1), dir = otoc(nUp, nah(0.35, 1.05) * vyber([-1, 1])), q = G.skal(dir, e);
      const sA = -(c / 2) * q + Math.sqrt((c / 2) * (c / 2) * q * q + 0.75 * c * c), sB = (c / 2) * q + Math.sqrt((c / 2) * (c / 2) * q * q + 0.75 * c * c);
      // M leží na úsečce SC obou řešení (aspoň 36 od C), není u těžiště (|SC|/3 ± 14) ani u středu S těžnice
      const m = nah(36, Math.min(sA, sB) - 36), M = secti(S, nasob(dir, m));
      if ([sA, sB].some(s => s - m < 36 || Math.abs(m - s / 3) < 14)) continue;
      const CA = secti(S, nasob(dir, sA)), CB = secti(S, nasob(dir, sB)), vse = [A, Bb, M, CA, CB];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || [CA, CB].some(x => G.vzdalOdPrimky(x, A, Bb) < 40)) continue;
      return {
        typ: 'rovnoramennyTc', nazev: 'Rovnoramenný trojúhelník — těžnice',
        text: 'Body A a B jsou vrcholy rovnoramenného trojúhelníku ABC. Bod M leží uvnitř tohoto trojúhelníku na těžnici t_c ke straně AB. (Bod M není těžiště trojúhelníku ABC a neleží na ose úsečky AB.) Sestrojte vrchol C a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { A, B: Bb, M } },
        hledane: ['C'], reseni: [{ C: CA }, { C: CB }], pomocne: [S],
        postup: [
          { text: 'Těžnice t_c vede z vrcholu C do středu S strany AB. Najděte S (osa úsečky AB) a narýsujte polopřímku SM — vrchol C leží na ní, za bodem M.', tvary: osaUsecky(A, Bb).tvary.concat([PL(S, M)]) },
          { text: 'M neleží na ose AB, takže trojúhelník nemá základnu AB. Rameno je tedy AB: buď |AC| = |AB|, nebo |BC| = |AB|. C leží na kružnici se středem A a poloměrem |AB|, nebo na kružnici se středem B a týmž poloměrem.', tvary: [K(A, c), K(Bb, c)] },
          { text: 'Průsečíky polopřímky SM s oběma kružnicemi jsou vrcholy C₁ (|AC₁| = |AB|) a C₂ (|BC₂| = |AB|). Bod M leží v obou trojúhelnících uvnitř. Úloha má dvě řešení.', tvary: [B(CA, 'C₁'), B(CB, 'C₂')].concat(strany([A, Bb, CA]), strany([A, Bb, CB])) },
        ],
        napovedy: ['Kudy vede těžnice t_c a kde na ní leží vrchol C? Proč nemůže být základnou strana AB (kam by pak vedla těžnice)?',
          'Najděte střed S strany AB; C leží na polopřímce SM. Rameno je AB: zkuste kružnici se středem A i kružnici se středem B, obě o poloměru |AB|.',
          'Řešení jsou dvě: C₁ a C₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  /* ═══ Typy 49–56: dávka 2, ostré úlohy M9 2023–2025 (úlohy 9 a 10). ═══ */

  // ── 49) Rovnoramenný trojúhelník se základnou AB: BM je výška na rameno AC, M ∈ AC, A na přímce q (M9 2025/1. náhr. ú. 9) ──
  function rovnoramennyVyskaM() {
    for (let g = 0; g < 8000; g++) {
      const A = bod(nah(50, 350), nah(50, 250)), c = nah(100, 160), e = smer(nah(0, 2 * Math.PI)), Bb = secti(A, nasob(e, c));
      const C = secti(stred(A, Bb), nasob(rot(e), c / 2 * nah(1.15, 1.9) * vyber([-1, 1])));   // vrcholový úhel < 90°: pata výšky leží uvnitř ramene
      const M = G.pata(Bb, A, C), uAC = jednot(odecti(C, A)), uq = otoc(uAC, nah(0.45, 2.6) * vyber([-1, 1]));
      if (G.vzdalOdUsecky(M, A, C) > 1e-6 || Math.abs(G.vekt(uq, uAC)) < 0.4) continue;
      const q = primka(A, uq), vse = [A, Bb, C, M];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || G.vzdalOdPrimky(Bb, q.p, q.q) < 25) continue;   // q neprochází bodem B (jinak by splynula s AB)
      return {
        typ: 'rovnoramennyVyskaM', nazev: 'Rovnoramenný trojúhelník — výška na rameno',
        text: 'Trojúhelník ABC je rovnoramenný se základnou AB. Úsečka BM je výška tohoto trojúhelníku na rameno AC, bod M leží na straně AC a vrchol A leží na přímce q. Sestrojte vrcholy A, C a trojúhelník narýsujte.',
        dane: { body: { B: Bb, M }, primky: [Object.assign({ nazev: 'q' }, q)] },
        hledane: ['A', 'C'], reseni: [{ A, C }], pomocne: [],
        postup: [
          { text: 'BM je výška na rameno AC, takže rameno AC je kolmé k BM a prochází bodem M. Narýsujte kolmici k úsečce BM bodem M.', tvary: [P({ p: A, q: C })] },
          { text: 'Vrchol A leží na této kolmici i na přímce q — je to jejich průsečík.', tvary: [B(A, 'A')] },
          { text: 'Základna je AB, takže vrchol C leží na ose úsečky AB. Průsečík osy s kolmicí je vrchol C. Dorýsujte trojúhelník.', tvary: osaUsecky(A, Bb).tvary.concat([B(C, 'C')], strany([A, Bb, C])) },
        ],
        napovedy: ['Co víte o rameni AC vzhledem k úsečce BM, když je BM výška? A kde leží vrchol C, když je základna AB?',
          'Kolmice k BM bodem M obsahuje celé rameno AC. A je její průsečík s přímkou q, C je její průsečík s osou úsečky AB.',
          'Vrcholy A a C jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 50) Rovnoběžník KLMN: L, M, p ∋ M; střed S na p; |LN| = |LM| (M9 2025/2. náhr. ú. 10; 2 řešení) ──
  function rovnobeznikStred() {
    for (let g = 0; g < 8000; g++) {
      const L = bod(nah(40, 360), nah(40, 260)), lm = nah(110, 150), fu = nah(0, 2 * Math.PI), M = secti(L, nasob(smer(fu), lm));
      /* p svírá s ML úhel α a kružnici (L, ½|LM|) protne dvakrát jen pro sin α < ½ (α < 30°). Při malém α leží oba středy
         skoro na úsečce LM (rovnoběžník je plochý), proto α blízko meze: 24°–29° (naměřeno: 1–2 % losů projde oknem a odstupy) */
      const p = primka(M, smer(fu + Math.PI + nah(0.42, 0.5) * vyber([-1, 1])));
      const X = G.prusecikyPK(p.p, p.q, L, lm / 2);
      if (X.length !== 2) continue;
      const res = X.map(S => ({ S, K: stredove(M, S), N: stredove(L, S) }));
      const vse = [L, M].concat(...res.map(s => [s.S, s.K, s.N]));
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || res.some(s => G.vzdalOdPrimky(s.S, L, M) < 20)) continue;
      const [r1, r2] = res;
      return {
        typ: 'rovnobeznikStred', nazev: 'Rovnoběžník — střed na přímce',
        text: 'Body L a M jsou vrcholy rovnoběžníku KLMN a přímka p prochází bodem M. Střed S rovnoběžníku leží na přímce p a úhlopříčka LN je stejně dlouhá jako strana LM. Sestrojte střed S a vrcholy K, N a rovnoběžník narýsujte. Najděte všechna řešení.',
        dane: { body: { L, M }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['S', 'K', 'N'], reseni: res, pomocne: [],
        postup: [
          { text: 'Úhlopříčky se půlí ve středu S, takže |LS| = ½|LN| = ½|LM|. Narýsujte kružnici se středem L a poloměrem ½|LM| (polovinu |LM| odměřte kružítkem).', tvary: [K(L, lm / 2)] },
          { text: 'Střed S leží také na přímce p. Průsečíky kružnice s přímkou p jsou středy S₁ a S₂.', tvary: [B(r1.S, 'S₁'), B(r2.S, 'S₂')] },
          { text: 'Vrcholy N a K jsou obrazy bodů L a M ve středové souměrnosti se středem S. Úloha má dvě řešení: rovnoběžníky KLMN pro S₁ a pro S₂.', tvary: [P({ p: L, q: r1.S }), P({ p: M, q: r1.S }), P({ p: L, q: r2.S }), P({ p: M, q: r2.S }), B(r1.N, 'N₁'), B(r1.K, 'K₁'), B(r2.N, 'N₂'), B(r2.K, 'K₂')].concat(strany([r1.K, L, M, r1.N]), strany([r2.K, L, M, r2.N])) },
        ],
        napovedy: ['Úhlopříčky rovnoběžníku se půlí. Jak daleko je střed S od vrcholu L, když |LN| = |LM|?',
          'S je od L vzdálený o ½|LM| a leží na přímce p — průsečík kružnice se středem L a poloměrem ½|LM| s přímkou p. N je obraz L a K je obraz M podle S.',
          'Řešení jsou dvě: S₁, K₁, N₁ a S₂, K₂, N₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 51) Rovnostranný trojúhelník ABC: A, A′, M; C ∈ AM; obraz A′B′C v osové souměrnosti, společný bod jen C (M9 2025/2. náhr. ú. 9) ──
  function rovnostrannyOsa() {
    for (let g = 0; g < 10000; g++) {
      const C = bod(nah(80, 320), nah(80, 220)), fo = nah(0, Math.PI), o = primka(C, smer(fo)), no = rot(smer(fo));
      const s = nah(90, 140), A = secti(C, nasob(smer(nah(0, 2 * Math.PI)), s)), dA = G.skal(odecti(A, C), no);
      if (Math.abs(dA) < 25) continue;
      const A2 = G.osove(A, o.p, o.q), cand = [1, -1].map(k => secti(A, otoc(odecti(C, A), k * Math.PI / 3)));
      const dB = cand.map(x => G.skal(odecti(x, C), no));
      const iv = cand.findIndex((x, i) => Math.sign(dB[i]) === Math.sign(dA) && Math.abs(dB[i]) >= 15);
      if (iv < 0 || Math.sign(dB[1 - iv]) === Math.sign(dA) || Math.abs(dB[1 - iv]) < 15) continue;   // vyhovuje právě jedno B
      const Bb = cand[iv], k = vyber([nah(0.25, 0.7), nah(1.25, 1.7)]), M = secti(A, nasob(odecti(C, A), k));
      const vse = [A, A2, M, C, Bb];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      return {
        typ: 'rovnostrannyOsa', nazev: 'Rovnostranný trojúhelník — osová souměrnost',
        text: 'Bod A je vrchol rovnostranného trojúhelníku ABC a jeho vrchol C leží na přímce AM. Trojúhelník A′B′C je obraz trojúhelníku ABC v osové souměrnosti s osou o a oba trojúhelníky mají jediný společný bod, a to vrchol C. Sestrojte vrcholy B a C a trojúhelník ABC narýsujte.',
        dane: { body: { A, 'A′': A2, M } },
        hledane: ['B', 'C'], reseni: [{ B: Bb, C }], pomocne: [],
        postup: [
          { text: 'Osa o je osa úsečky AA′ (A′ je obraz bodu A).', tvary: osaUsecky(A, A2).tvary },
          { text: 'Společný bod C leží na ose o (na ose se dotýkají oba obrazy) a na přímce AM. Je to jejich průsečík.', tvary: [P({ p: A, q: M }), B(C, 'C')] },
          { text: 'Trojúhelník je rovnostranný, |AB| = |BC| = |AC|: B je průsečík kružnic se středy A a C o poloměru |AC|. Vyhovuje ten průsečík, který leží na téže straně osy o jako A — jinak by se trojúhelníky překrývaly víc než v bodě C.', tvary: [K(A, s), K(C, s), B(Bb, 'B'), B(cand[1 - iv])].concat(strany([A, Bb, C])) },
        ],
        napovedy: ['Kde leží bod, který mají trojúhelníky ABC a A′B′C společný, vzhledem k ose o? A co víte o ose o a bodech A a A′?',
          'o je osa úsečky AA′; C je průsečík osy s přímkou AM. B najdete kružítkem: |AB| = |BC| = |AC|, a to na straně osy, kde leží A.',
          'Vrcholy B a C jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 52) Obdélník ABCD: B na přímce AE, C na přímce p ∋ E, |BD| = |AE| (M9 2024/1. řádný ú. 10) ──
  function obdelnikAE() {
    for (let g = 0; g < 8000; g++) {
      const A = bod(nah(50, 350), nah(50, 250)), ae = nah(110, 170), u = smer(nah(0, 2 * Math.PI)), E = secti(A, nasob(u, ae));
      const pd = smer(nah(0, Math.PI));
      if (Math.abs(G.vekt(pd, u)) < 0.3) continue;
      const p = primka(E, pd), a = primka(A, u), X = G.prusecikyPK(p.p, p.q, A, ae);
      if (X.length !== 2) continue;
      const C = X.find(x => vzdal(x, E) > 36);   // jeden průsečík je E samo (B = C by nešlo), řešení je ten druhý
      if (!C) continue;
      const Bb = G.pata(C, A, E), D = secti(A, odecti(C, Bb)), vse = [A, E, Bb, C, D];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || vzdal(Bb, C) < 45 || vzdal(A, Bb) < 45) continue;   // ne příliš úzký obdélník
      return {
        typ: 'obdelnikAE', nazev: 'Obdélník — shodná úhlopříčka',
        text: 'Bod A je vrchol obdélníku ABCD a přímka a prochází body A a E. Vrchol B leží na přímce a, vrchol C na přímce p, která prochází bodem E, a úhlopříčka BD je stejně dlouhá jako úsečka AE. Sestrojte vrcholy B, C, D a obdélník narýsujte.',
        dane: { body: { A, E }, primky: [Object.assign({ nazev: 'a' }, a), Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'C', 'D'], reseni: [{ B: Bb, C, D }], pomocne: [],
        postup: [
          { text: 'Úhlopříčky obdélníku jsou shodné: |AC| = |BD| = |AE|. Vrchol C leží na kružnici se středem A a poloměrem |AE|.', tvary: [K(A, ae)] },
          { text: 'C leží také na přímce p. Kružnice protíná p ve dvou bodech: jedním je E (to nevyhovuje, pak by B splynulo s C), druhý je vrchol C.', tvary: [B(C, 'C')] },
          { text: 'Strana BC je kolmá ke straně AB, takže B je pata kolmice z C na přímku a.', tvary: [P({ p: C, q: Bb }), B(Bb, 'B')] },
          { text: 'D leží na rovnoběžkách s BC bodem A a s AB bodem C. Dorýsujte obdélník.', tvary: [P({ p: A, q: D }), P({ p: C, q: D }), B(D, 'D')].concat(strany([A, Bb, C, D])) },
        ],
        napovedy: ['Co víte o úhlopříčkách obdélníku? Na jaké kružnici proto leží vrchol C?',
          'Kružnice se středem A a poloměrem |AE| protne přímku p v bodě E a ještě v jednom bodě — to je C. B je pata kolmice z C na přímku a; D dostanete rovnoběžkami.',
          'Vrcholy B, C, D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 54) Rovnoramenný trojúhelník ABC: základna AB na přímce AP, B a C na kružnici k (M9 2023/1. řádný ú. 10; 4 řešení) ──
  function rovnoramennyKruzP() {
    for (let g = 0; g < 30000; g++) {
      const S = bod(nah(150, 250), nah(110, 190)), r = nah(58, 82), da = r * nah(0.2, 1.9);
      if (Math.abs(da - r) < 25) continue;
      const A = secti(S, nasob(smer(nah(0, 2 * Math.PI)), da)), P1 = secti(A, nasob(smer(nah(0, 2 * Math.PI)), nah(45, 80)));
      const Bs = G.prusecikyPK(A, P1, S, r);
      if (Bs.length !== 2) continue;
      const osy = Bs.map(Bj => { const Mj = stred(A, Bj), uj = rot(jednot(odecti(Bj, A))); return { Mj, uj, C: G.prusecikyPK(Mj, secti(Mj, uj), S, r) }; });
      if (osy.some(o => o.C.length !== 2 || o.C.some(c => vzdal(c, o.Mj) < 25))) continue;
      const res = [], vse = [A, P1, S].concat(Bs);
      osy.forEach((o, j) => o.C.forEach(c => { res.push({ B: Bs[j], C: c }); vse.push(c); }));
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      return {
        typ: 'rovnoramennyKruzP', nazev: 'Rovnoramenný trojúhelník — vrcholy na kružnici',
        text: 'Bod A je vrchol rovnoramenného trojúhelníku ABC, jehož základna AB leží na přímce AP. Vrcholy B a C tohoto trojúhelníku leží na kružnici k se středem S. Sestrojte vrcholy B a C a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { A, P: P1, S }, kruznice: [{ c: S, r, nazev: 'k' }] },
        hledane: ['B', 'C'], reseni: res, pomocne: [],
        postup: [
          { text: 'Vrchol B leží na přímce AP a na kružnici k. Průsečíky přímky AP s kružnicí k jsou B₁ a B₂.', tvary: [P({ p: A, q: P1 }), B(Bs[0], 'B₁'), B(Bs[1], 'B₂')] },
          { text: 'Základna je AB, takže vrchol C leží na ose úsečky AB. Narýsujte osu úsečky AB₁ a osu úsečky AB₂ (kružítkem, každou dvěma kružnicemi).', tvary: osy.map(o => P({ p: o.Mj, q: secti(o.Mj, o.uj) })) },
          { text: 'C leží také na kružnici k. Každá osa ji protíná ve dvou bodech, takže úloha má čtyři řešení: C₁ až C₄.', tvary: res.map((s, i) => B(s.C, 'C' + '₁₂₃₄'[i])).concat(strany([A, res[0].B, res[0].C]), strany([A, res[1].B, res[1].C]), strany([A, res[2].B, res[2].C]), strany([A, res[3].B, res[3].C])) },
        ],
        napovedy: ['Kde leží vrchol B, když je na přímce AP a na kružnici k? A kde je vrchol C, když je základna AB?',
          'B je průsečík přímky AP s kružnicí k (dva body). Pro každé B narýsujte osu úsečky AB; její průsečíky s kružnicí k jsou možné vrcholy C.',
          'Řešení jsou čtyři; společné vrcholy B vidíte jako B₁ a B₂. V okně je teď všechna vidíte.'],
      };
    }
    return null;
  }

  // ── 56) Rovnoramenný trojúhelník ABC se základnou AC: výška z C leží na přímce p ∋ C (M9 2023/1. náhr. ú. 10) ──
  function rovnoramennyVyskaC() {
    for (let g = 0; g < 8000; g++) {
      const A = bod(nah(50, 350), nah(50, 250)), ac = nah(110, 170), fu = nah(0, 2 * Math.PI), C = secti(A, nasob(smer(fu), ac));
      const pd = otoc(smer(fu + Math.PI), nah(0.4, 1.15) * vyber([-1, 1])), nperp = rot(pd);
      const mid = stred(A, C), Bb = G.prusecikPP(A, secti(A, nperp), mid, secti(mid, rot(smer(fu))));
      if (!Bb) continue;
      const vse = [A, C, Bb];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const p = primka(C, pd);
      return {
        typ: 'rovnoramennyVyskaC', nazev: 'Rovnoramenný trojúhelník — výška na přímce p',
        text: 'Úsečka AC je základna rovnoramenného trojúhelníku ABC. Na přímce p, která prochází bodem C, leží jedna z výšek tohoto trojúhelníku. Sestrojte vrchol B a trojúhelník narýsujte.',
        dane: { body: { A, C }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B'], reseni: [{ B: Bb }], pomocne: [],
        postup: [
          { text: 'Přímka p prochází vrcholem C. Výška z vrcholu B vede z B, ne z C, a výška z A neprochází bodem C (trojúhelník by měl dva pravé úhly). Na p tedy leží výška z C, která je kolmá ke straně AB. Strana AB je proto kolmá k p: narýsujte kolmici k p bodem A.', tvary: [P({ p: A, q: secti(A, nperp) })] },
          { text: 'Základna je AC, takže vrchol B leží na ose úsečky AC. Průsečík osy s kolmicí je vrchol B.', tvary: osaUsecky(A, C).tvary.concat([B(Bb, 'B')]) },
          { text: 'Dorýsujte trojúhelník ABC.', tvary: strany([A, Bb, C]) },
        ],
        napovedy: ['Která z výšek trojúhelníku může ležet na přímce p, když p prochází vrcholem C? K čemu je taková výška kolmá?',
          'Na p leží výška z C, takže AB je kolmá k p. Veďte bodem A kolmici k p; B je její průsečík s osou úsečky AC (základna AC).',
          'Vrchol B je teď vidět v okně.'],
      };
    }
    return null;
  }

  /* ═══ Typy 57–64: dávka 3, ostré úlohy M9 2021–2024 (úlohy 9 a 10). ═══ */

  // ── 57) Rovnostranný trojúhelník ABC: C a střed S strany AB (M9 2024/1. řádný ú. 9) ──
  function rovnostrannyStred() {
    for (let g = 0; g < 4000; g++) {
      const S = bod(nah(70, 330), nah(60, 240)), cs = nah(75, 130), uCS = smer(nah(0, 2 * Math.PI)), C = secti(S, nasob(uCS, cs));
      const n = rot(uCS), t = cs / Math.sqrt(3), A = secti(S, nasob(n, t)), Bb = secti(S, nasob(n, -t));
      const vse = [C, S, A, Bb];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      return {
        typ: 'rovnostrannyStred', nazev: 'Rovnostranný trojúhelník — střed strany',
        text: 'Bod C je vrchol rovnostranného trojúhelníku ABC a bod S je střed jeho strany AB. Sestrojte vrcholy A, B a trojúhelník narýsujte.',
        dane: { body: { C, S } },
        hledane: ['A', 'B'], reseni: [{ A, B: Bb }], pomocne: [],
        postup: [
          { text: 'Úsečka CS je výška rovnostranného trojúhelníku, takže strana AB je kolmá k CS v bodě S. Narýsujte kolmici k přímce CS bodem S.', tvary: [P({ p: S, q: secti(S, n) })] },
          { text: 'Při vrcholu C je úhel ACB = 60° a výška ho půlí, takže úhel SCA měří 30°. Úhloměrem naneste při C od polopřímky CS úhel 30° na obě strany.', tvary: [PL(C, A), PL(C, Bb)] },
          { text: 'Ramena úhlu protnou kolmici v hledaných vrcholech A a B. Dorýsujte trojúhelník.', tvary: [B(A, 'A'), B(Bb, 'B')].concat(strany([A, Bb, C])) },
        ],
        napovedy: ['Bod S je střed strany AB. Jak vede úsečka CS vzhledem ke straně AB? A kolik stupňů má úhel SCA?',
          'AB je kolmá k CS v bodě S. Úhloměrem naneste při C od CS úhel 30° na obě strany; A a B jsou průsečíky ramen s kolmicí.',
          'Vrcholy A a B jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 59) Rovnoramenný trojúhelník se základnou AB: C, S střed ramene, jeden vrchol na přímce q (M9 2022/1. řádný ú. 9; 2 řešení) ──
  function rovnoramennyStredQ() {
    for (let g = 0; g < 6000; g++) {
      const Cc = bod(nah(50, 350), nah(50, 250)), cs = nah(50, 85), S = secti(Cc, nasob(smer(nah(0, 2 * Math.PI)), cs)), A = stredove(Cc, S), ca = 2 * cs;
      const q = primka(secti(Cc, nasob(smer(nah(0, 2 * Math.PI)), ca * nah(0.3, 0.85))), smer(nah(0, Math.PI)));
      const X = G.prusecikyPK(q.p, q.q, Cc, ca);
      if (X.length !== 2) continue;
      const vse = [Cc, S, A].concat(X);
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || X.some(x => G.vzdalOdPrimky(x, Cc, A) < 25)) continue;
      return {
        typ: 'rovnoramennyStredQ', nazev: 'Rovnoramenný trojúhelník — střed ramene a přímka',
        text: 'Bod C je vrchol rovnoramenného trojúhelníku ABC se základnou AB. Bod S je střed jednoho z ramen a jeden z vrcholů A, B leží na přímce q. Sestrojte vrcholy A, B a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { C: Cc, S }, primky: [Object.assign({ nazev: 'q' }, q)] },
        hledane: ['A', 'B'], reseni: X.map(x => ({ A, B: x })), pomocne: [],
        postup: [
          { text: 'S je střed ramene, takže jeden ze základnových vrcholů (označme ho A) je obraz bodu C ve středové souměrnosti podle S.', tvary: [P({ p: Cc, q: S }), B(A, 'A')] },
          { text: 'Trojúhelník je rovnoramenný se základnou AB, takže |CB| = |CA|. Druhý vrchol B leží na kružnici se středem C a poloměrem |CA|.', tvary: [K(Cc, ca)] },
          { text: 'Zbývající vrchol leží i na přímce q. Průsečíky kružnice s přímkou q jsou B₁ a B₂ — úloha má dvě řešení.', tvary: [B(X[0], 'B₁'), B(X[1], 'B₂')].concat(strany([A, X[0], Cc]), strany([A, X[1], Cc])) },
        ],
        napovedy: ['Jak najdete z bodů C a S vrchol, který leží na rameni se středem S? Na jaké kružnici leží druhý základnový vrchol?',
          'První vrchol A je obraz C podle S. Druhý je od C stejně daleko jako A (kružnice se středem C přes A) a leží na přímce q.',
          'Řešení jsou dvě: A se společným B₁ a B₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 60) Rovnoramenný trojúhelník: ramena d cm, jeden vrchol na přímce p, osa přes Q (M9 2022/2. náhr. ú. 10; 2 řešení) ──
  function rovnoramennyOsaQ() {
    for (let g = 0; g < 20000; g++) {
      const d = vyber([3, 3.5, 4, 4.5]), r = d * CM, Cc = bod(nah(110, 290), nah(90, 210)), Q = secti(Cc, nasob(smer(nah(0, 2 * Math.PI)), nah(40, 90)));
      const p = primka(secti(Cc, nasob(smer(nah(0, 2 * Math.PI)), r * nah(0.3, 0.8))), smer(nah(0, Math.PI)));
      const X = G.prusecikyPK(p.p, p.q, Cc, r);
      if (X.length !== 2) continue;
      const res = X.map(a => ({ A: a, B: G.osove(a, Cc, Q) })), vse = [Cc, Q].concat(...res.map(s => [s.A, s.B]));
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || X.some(a => G.vzdalOdPrimky(a, Cc, Q) < 25)) continue;
      return {
        typ: 'rovnoramennyOsaQ', nazev: 'Rovnoramenný trojúhelník — ramena a osa přes Q',
        text: 'Bod C je vrchol rovnoramenného trojúhelníku ABC se základnou AB. Ramena mají délku ' + cm(d) + '. Na přímce p leží jeden z vrcholů A, B a osa souměrnosti trojúhelníku prochází bodem Q. Sestrojte vrcholy A, B a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { C: Cc, Q }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['A', 'B'], reseni: res, pomocne: [],
        postup: [
          { text: 'Osa souměrnosti rovnoramenného trojúhelníku vede vrcholem C (proti základně) a bodem Q: je to přímka CQ.', tvary: [P({ p: Cc, q: Q })] },
          { text: 'Ramena CA a CB měří ' + cm(d) + ': vrcholy A a B leží na kružnici se středem C a poloměrem ' + cm(d) + '.', tvary: [K(Cc, r)] },
          { text: 'Jeden z vrcholů leží na p. Průsečíky kružnice s přímkou p jsou A₁ a A₂.', tvary: [B(X[0], 'A₁'), B(X[1], 'A₂')] },
          { text: 'Druhý vrchol je obraz prvního v osové souměrnosti podle osy CQ: B₁ a B₂. Úloha má dvě řešení.', tvary: [B(res[0].B, 'B₁'), B(res[1].B, 'B₂')].concat(strany([res[0].A, res[0].B, Cc]), strany([res[1].A, res[1].B, Cc])) },
        ],
        napovedy: ['Kudy vede osa souměrnosti rovnoramenného trojúhelníku vzhledem k vrcholu C? Na jaké kružnici leží vrcholy A, B?',
          'Osa je přímka CQ. Kružnice se středem C a poloměrem ' + cm(d) + ' protne p v bodě A. B je obraz A podle osy CQ.',
          'Řešení jsou dvě: A₁, B₁ a A₂, B₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 61) Obdélník ABCD: A, X uvnitř strany AB, C na přímce c, B nebo D na rovnoběžné přímce p (M9 2022/1. náhr. ú. 10; 2 řešení) ──
  function obdelnikRovnobezky() {
    for (let g = 0; g < 30000; g++) {
      const A = bod(nah(50, 350), nah(50, 250)), fx = nah(0, 2 * Math.PI), xh = smer(fx), nn = rot(xh), ax = nah(35, 70), X = secti(A, nasob(xh, ax));
      const pd = smer(fx + vyber([-1, 1]) * nah(0.5, 1.1)), w1 = nah(ax + 35, 190), B1 = secti(A, nasob(xh, w1)), p = primka(B1, pd);
      const D2 = G.prusecikPP(A, secti(A, nn), p.p, p.q);
      if (!D2) continue;
      const c = primka(secti(B1, nasob(rot(pd), nah(40, 120) * vyber([-1, 1]))), pd);
      const C1 = G.prusecikPP(B1, secti(B1, nn), c.p, c.q), C2 = G.prusecikPP(D2, secti(D2, xh), c.p, c.q);
      if (!C1 || !C2) continue;
      const D1 = secti(A, odecti(C1, B1)), B2 = secti(A, odecti(C2, D2));
      if (skal(odecti(B2, A), xh) < ax + 35) continue;   // X leží uvnitř AB i ve druhém řešení
      const vse = [A, X, B1, C1, D1, B2, C2, D2];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const res = [{ B: B1, C: C1, D: D1 }, { B: B2, C: C2, D: D2 }];
      return {
        typ: 'obdelnikRovnobezky', nazev: 'Obdélník — dvě rovnoběžky',
        text: 'Bod A je vrchol obdélníku ABCD a bod X leží uvnitř strany AB. Vrchol C leží na přímce c a jeden ze zbývajících vrcholů B, D leží na přímce p, která je s c rovnoběžná. Sestrojte vrcholy B, C, D a obdélník narýsujte. Najděte všechna řešení.',
        dane: { body: { A, X }, primky: [Object.assign({ nazev: 'c' }, c), Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'C', 'D'], reseni: res, pomocne: [],
        postup: [
          { text: 'X leží uvnitř strany AB, takže AB leží na přímce AX. Strana AD je k ní kolmá a prochází bodem A.', tvary: [P({ p: A, q: X }), P({ p: A, q: secti(A, nn) })] },
          { text: 'První možnost: B leží na p. B je průsečík přímky AX s p; C je průsečík kolmice k AB v bodě B s přímkou c; D dostanete rovnoběžkou (D = A + C − B).', tvary: [B(B1, 'B₁'), P({ p: B1, q: C1 }), B(C1, 'C₁'), B(D1, 'D₁')].concat(strany([A, B1, C1, D1])) },
          { text: 'Druhá možnost: D leží na p. D je průsečík kolmice k AB v bodě A s přímkou p; C je průsečík rovnoběžky s AB bodem D s přímkou c; B je na přímce AX. Úloha má dvě řešení.', tvary: [B(D2, 'D₂'), P({ p: D2, q: C2 }), B(C2, 'C₂'), B(B2, 'B₂')].concat(strany([A, B2, C2, D2])) },
        ],
        napovedy: ['Který z vrcholů B, D může ležet na přímce p? Zkuste obě možnosti. Co víte o stranách obdélníku vzhledem k přímce AX?',
          'AB leží na přímce AX, AD je kolmá k AB. Buď B = AX ∩ p a C leží na kolmici v B a na přímce c, nebo D = (kolmice v A) ∩ p a C leží na rovnoběžce s AB bodem D a na c.',
          'Řešení jsou dvě. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 62) Rovnoběžník ABCD: A, C; dvě strany rovnoběžné s p, jedna úhlopříčka kolmá k p (M9 2022/2. řádný ú. 10) ──
  function rovnobeznikRovnobezkaP() {
    for (let g = 0; g < 10000; g++) {
      const A = bod(nah(60, 340), nah(60, 240)), fp = nah(0, Math.PI), pd = smer(fp), C = secti(A, nasob(smer(fp + vyber([-1, 1]) * nah(0.45, 1.1)), nah(110, 190)));
      const S = stred(A, C), Bb = G.prusecikPP(A, secti(A, pd), S, secti(S, rot(pd)));
      if (!Bb) continue;
      const D = stredove(Bb, S), vse = [A, C, S, Bb, D];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const p = primka(bod(nah(40, 360), nah(40, 260)), pd);
      if (vse.some(x => G.vzdalOdPrimky(x, p.p, p.q) < 20)) continue;
      return {
        typ: 'rovnobeznikRovnobezkaP', nazev: 'Rovnoběžník — strany rovnoběžné s p',
        text: 'Body A a C jsou vrcholy rovnoběžníku ABCD. Dvě strany rovnoběžníku jsou rovnoběžné s přímkou p a jedna z jeho úhlopříček je k přímce p kolmá. Sestrojte vrcholy B, D a rovnoběžník narýsujte.',
        dane: { body: { A, C }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'D'], reseni: [{ B: Bb, D }], pomocne: [],
        postup: [
          { text: 'Úhlopříčka AC k přímce p kolmá není, kolmá je tedy úhlopříčka BD. Úhlopříčky se půlí ve středu S úsečky AC, takže BD leží na kolmici k p bodem S.', tvary: [B(S, 'S'), P({ p: S, q: secti(S, rot(pd)) })] },
          { text: 'Strana AB je rovnoběžná s p. Rovnoběžka s p bodem A protne kolmici ve vrcholu B.', tvary: [P({ p: A, q: secti(A, pd) }), B(Bb, 'B')] },
          { text: 'D je obraz bodu B ve středové souměrnosti podle S. Dorýsujte rovnoběžník.', tvary: [B(D, 'D')].concat(strany([A, Bb, C, D])) },
        ],
        napovedy: ['Která z úhlopříček může být kolmá k p, když AC kolmá není? Kde leží střed rovnoběžníku?',
          'S je střed AC. Úhlopříčka BD vede bodem S kolmo k p; B je její průsečík s rovnoběžkou s p vedenou bodem A. D je obraz B podle S.',
          'Vrcholy B a D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 64) Trojúhelník ABC: osy vnitřních úhlů při A a B procházejí bodem L (M9 2021/1. náhr. ú. 10) ──
  function trojuhelnikOsy() {
    for (let g = 0; g < 10000; g++) {
      const A = bod(nah(50, 200), nah(150, 250)), c = nah(110, 180), Bb = secti(A, nasob(smer(nah(-0.4, 0.4)), c)), uAB = jednot(odecti(Bb, A));
      const nUp = rot(uAB).y < 0 ? rot(uAB) : nasob(rot(uAB), -1);
      const C = secti(secti(A, nasob(uAB, c * nah(0.15, 0.85))), nasob(nUp, c * nah(0.5, 1.1)));
      const a = vzdal(Bb, C), b = vzdal(C, A), s = a + b + c;
      const L = bod((a * A.x + b * Bb.x + c * C.x) / s, (a * A.y + b * Bb.y + c * C.y) / s);
      const Ap = G.osove(A, Bb, L), Bp = G.osove(Bb, A, L), vse = [A, Bb, L, C, Ap, Bp];
      const uhly = [[A, Bb, C], [Bb, C, A], [C, A, Bb]].map(([P1, P2, P3]) => Math.acos(G.skal(jednot(odecti(P1, P2)), jednot(odecti(P3, P2)))) * 180 / Math.PI);
      if (uhly.some(x => x < 35 || x > 100) || !vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      return {
        typ: 'trojuhelnikOsy', nazev: 'Trojúhelník — osy úhlů přes bod L',
        text: 'Body A a B jsou vrcholy trojúhelníku ABC. Osy vnitřních úhlů BAC a ABC procházejí bodem L. Sestrojte vrchol C trojúhelníku ABC a trojúhelník narýsujte.',
        dane: { body: { A, B: Bb, L } },
        hledane: ['C'], reseni: [{ C }], pomocne: [],
        postup: [
          { text: 'Přímka AL je osa úhlu BAC, takže polopřímka AC je obrazem polopřímky AB v osové souměrnosti podle přímky AL. Sestrojte obraz B′ bodu B podle přímky AL.', tvary: [P({ p: A, q: L }), B(Bp, 'B′')] },
          { text: 'Stejně přímka BL je osa úhlu ABC. Sestrojte obraz A′ bodu A podle přímky BL: leží na polopřímce BC.', tvary: [P({ p: Bb, q: L }), B(Ap, 'A′')] },
          { text: 'Vrchol C je průsečík přímek AB′ a BA′. Dorýsujte trojúhelník.', tvary: [P({ p: A, q: Bp }), P({ p: Bb, q: Ap }), B(C, 'C')].concat(strany([A, Bb, C])) },
        ],
        napovedy: ['Co dělá osa úhlu s rameny úhlu? Kam se při osové souměrnosti podle osy úhlu zobrazí jedno rameno?',
          'Obraz B′ bodu B podle přímky AL leží na přímce AC, obraz A′ bodu A podle přímky BL leží na přímce BC. C je průsečík přímek AB′ a BA′.',
          'Vrchol C je teď vidět v okně.'],
      };
    }
    return null;
  }

  /* ═══ Typy 65–72: dávka 4, ostré úlohy M9 2016–2022 (úlohy 9 a 10). ═══ */

  // ── 65) Rovnoramenný trojúhelník KLM: LM je strana, ramena = 2 · základna, U uvnitř (M9 2021/2. náhr. ú. 9; 3 řešení) ──
  function rovnoramennyDvojnasobek() {
    for (let g = 0; g < 20000; g++) {
      const d = nah(95, 120), L = bod(nah(60, 340), nah(180, 270)), u = smer(nah(-0.5, 0.5)), M = secti(L, nasob(u, d));
      const nUp = rot(u).y < 0 ? rot(u) : nasob(rot(u), -1);
      // K podle |LK| = rL, |MK| = rM: (a) LM základna, (b) LM rameno s vrcholem L, (c) LM rameno s vrcholem M — všechny nad LM
      const kand = (rL, rM) => { const x = (rL * rL - rM * rM + d * d) / (2 * d); return secti(L, secti(nasob(u, x), nasob(nUp, Math.sqrt(rL * rL - x * x)))); };
      const horni = [kand(2 * d, 2 * d), kand(d, d / 2), kand(d / 2, d)];
      /* U musí ležet uvnitř všech tří horních trojúhelníků, tedy v jejich průniku: trojúhelník (b) a (c) mají výšku 0,484 d a jejich
         průnik sahá nad LM nejvýš do 0,277 d (uprostřed). Dolní tři trojúhelníky U neobsahují, takže řešení jsou právě tři. */
      const ux = nah(0.42, 0.58) * d, yMax = 0.553 * Math.min(ux, d - ux) - 0.08 * d;   // odstup od šikmých stran aspoň ~0,07 d (≥ 6 jednotek)
      if (yMax < 0.15 * d) continue;
      const Uu = secti(L, secti(nasob(u, ux), nasob(nUp, nah(0.1 * d, yMax))));
      const vse = [L, M, Uu].concat(horni);
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const [KA, KB, KC] = horni, dole = [kand(2 * d, 2 * d), kand(d, d / 2), kand(d / 2, d)].map(k => G.osove(k, L, M));
      return {
        typ: 'rovnoramennyDvojnasobek', nazev: 'Rovnoramenný trojúhelník — ramena dvojnásobná',
        text: 'Úsečka LM je strana rovnoramenného trojúhelníku KLM. Každé z obou ramen tohoto trojúhelníku je dvakrát delší než jeho základna. Bod U leží uvnitř trojúhelníku KLM. Sestrojte vrchol K a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { L, M, U: Uu }, usecky: [{ p: L, q: M }] },
        hledane: ['K'], reseni: horni.map(k => ({ K: k })), pomocne: [],
        postup: [
          { text: 'Úsečka LM může být základna, nebo rameno. Zkusíme všechny možnosti a nakonec vybereme ty trojúhelníky, které obsahují bod U.', tvary: [] },
          { text: 'LM je základna: |KL| = |KM| = 2|LM|. K je průsečík kružnic se středy L a M o poloměru 2|LM|. Průsečíky jsou dva, nad LM a pod LM.', tvary: [K(L, 2 * d), K(M, 2 * d), B(KA, 'K₁'), B(dole[0])] },
          { text: 'LM je rameno s vrcholem L: |LK| = |LM| a základna |MK| = ½|LM|. K je průsečík kružnic (L, |LM|) a (M, ½|LM|), opět nad a pod LM.', tvary: [K(L, d), K(M, d / 2), B(KB, 'K₂'), B(dole[1])] },
          { text: 'LM je rameno s vrcholem M: |MK| = |LM| a |LK| = ½|LM|: kružnice (M, |LM|) a (L, ½|LM|). Bod U leží uvnitř jen trojúhelníků nad LM, takže úloha má tři řešení.', tvary: [K(M, d), K(L, d / 2), B(KC, 'K₃'), B(dole[2])].concat(strany([L, M, KA]), strany([L, M, KB]), strany([L, M, KC])) },
        ],
        napovedy: ['Může být LM základna? A může být LM rameno? Jaké strany pak trojúhelník má (b, 2b, 2b)?',
          'Pro každou možnost sestrojte dvě kružnice (poloměry 2|LM|, 2|LM|; nebo |LM| a ½|LM|; nebo ½|LM| a |LM|) a vyberte jen ty trojúhelníky, které obsahují bod U.',
          'Řešení jsou tři: K₁, K₂ a K₃. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 66) Obdélník ABCD: A, střed S, |CD| = |CS| (M9 2021/2. náhr. ú. 10; 2 řešení) ──
  function obdelnikCDCS() {
    for (let g = 0; g < 4000; g++) {
      const S = bod(nah(130, 270), nah(100, 200)), r = nah(55, 80), A = secti(S, nasob(smer(nah(0, 2 * Math.PI)), r)), C = stredove(A, S);
      const Ds = G.prusecikyKK(C, r, S, r);
      if (Ds.length !== 2) continue;
      const res = Ds.map(D => ({ B: stredove(D, S), C, D })), vse = [A, S, C].concat(...res.map(s => [s.B, s.D]));
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const [r1, r2] = res;
      return {
        typ: 'obdelnikCDCS', nazev: 'Obdélník — strana CD rovná CS',
        text: 'Bod A je vrchol obdélníku ABCD a bod S je střed tohoto obdélníku. Strana CD je stejně dlouhá jako úsečka CS, tedy |CD| = |CS|. Sestrojte vrcholy B, C, D a obdélník narýsujte. Najděte všechna řešení.',
        dane: { body: { A, S } },
        hledane: ['B', 'C', 'D'], reseni: res, pomocne: [],
        postup: [
          { text: 'Úhlopříčky se půlí ve středu S: C je obraz bodu A ve středové souměrnosti podle S.', tvary: [P({ p: A, q: S }), B(C, 'C')] },
          { text: 'Platí |SD| = |SC| (poloviny shodných úhlopříček) a |CD| = |CS|, takže trojúhelník CSD je rovnostranný. D je průsečík kružnic (C, |CS|) a (S, |CS|) — dva průsečíky, dvě řešení.', tvary: [K(C, r), K(S, r), B(r1.D, 'D₁'), B(r2.D, 'D₂')] },
          { text: 'B je obraz bodu D podle S. Dorýsujte oba obdélníky.', tvary: [P({ p: r1.D, q: S }), P({ p: r2.D, q: S }), B(r1.B, 'B₁'), B(r2.B, 'B₂')].concat(strany([A, r1.B, C, r1.D]), strany([A, r2.B, C, r2.D])) },
        ],
        napovedy: ['Kde leží C, když znáte střed S a vrchol A? Co víte o trojúhelníku CSD, když |CD| = |CS| a |SD| = |SC|?',
          'C je obraz A podle S. Trojúhelník CSD je rovnostranný, takže D je průsečík kružnic se středy C a S o poloměru |CS|. B je obraz D podle S.',
          'Řešení jsou dvě: B₁, D₁ a B₂, D₂ (C je společný). V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 67) Rovnoramenný pravoúhlý trojúhelník ABC: B na polopřímce AX, C na přímce c, pravý úhel při A, nebo při B (M9 2021/2. řádný ú. 9; 2 řešení) ──
  function pravouhlyRovnoramennyX() {
    for (let g = 0; g < 30000; g++) {
      const A = bod(nah(40, 360), nah(40, 260)), xh = smer(nah(0, 2 * Math.PI)), nn = rot(xh), ax = nah(35, 65), X = secti(A, nasob(xh, ax));
      const t1 = nah(50, 130), t2 = nah(50, 130), C1 = secti(A, nasob(nn, vyber([-1, 1]) * t1)), B2 = secti(A, nasob(xh, t2)), C2 = secti(B2, nasob(nn, vyber([-1, 1]) * t2));
      if (vzdal(C1, C2) < 40) continue;
      const c = primka(C1, jednot(odecti(C2, C1)));
      // úplný výčet řešení: pravý úhel při A (C na kolmici v A), při B (C na přímkách svírajících s AX 45°, B pata kolmice, B na polopřímce)
      const res = [], CA = G.prusecikPP(A, secti(A, nn), c.p, c.q);
      if (!CA) continue;
      res.push({ B: secti(A, nasob(xh, vzdal(A, CA))), C: CA, pri: 'A' });
      for (const sg of [1, -1]) {
        const Cb = G.prusecikPP(A, secti(A, secti(xh, nasob(nn, sg))), c.p, c.q);
        if (Cb && skal(odecti(Cb, A), xh) > 20) res.push({ B: secti(A, nasob(xh, skal(odecti(Cb, A), xh))), C: Cb, pri: 'B' });
      }
      if (res.length !== 2) continue;
      const vse = [A, X].concat(...res.map(s => [s.B, s.C]));
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const [rA, rB] = res;
      return {
        typ: 'pravouhlyRovnoramennyX', nazev: 'Pravoúhlý rovnoramenný — polopřímka a přímka',
        text: 'Bod A je vrchol rovnoramenného pravoúhlého trojúhelníku ABC. Vrchol B leží na polopřímce AX, vrchol C na přímce c a pravý úhel je buď při vrcholu A, nebo při vrcholu B. Sestrojte vrcholy B, C a trojúhelník narýsujte. Najděte všechna řešení.',
        dane: { body: { A, X }, poloprimky: [{ p: A, q: X }], primky: [Object.assign({ nazev: 'c' }, c)] },
        hledane: ['B', 'C'], reseni: res.map(s => ({ B: s.B, C: s.C })), pomocne: [],
        postup: [
          { text: 'Pravý úhel při A: AC je kolmá k AX a |AB| = |AC|. C je průsečík kolmice k AX bodem A s přímkou c; B leží na AX ve vzdálenosti |AC| od A (kružítkem).', tvary: [P({ p: A, q: rA.C }), B(rA.C, 'C₁'), K(A, vzdal(A, rA.C)), B(rA.B, 'B₁')].concat(strany([A, rA.B, rA.C])) },
          { text: 'Pravý úhel při B: |AB| = |BC| a BC ⊥ AB, takže úhel BAC měří 45°. C leží na přímce vedené bodem A pod úhlem 45° k AX (na jednu nebo druhou stranu).', tvary: [P({ p: A, q: secti(A, secti(xh, nn)) }), P({ p: A, q: secti(A, odecti(xh, nn)) })] },
          { text: 'Průsečík jedné z těchto přímek s přímkou c je C₂, druhý průsečík by ležel za bodem A, mimo polopřímku. B₂ je pata kolmice z C₂ na AX. Úloha má dvě řešení.', tvary: [B(rB.C, 'C₂'), P({ p: rB.C, q: rB.B }), B(rB.B, 'B₂')].concat(strany([A, rB.B, rB.C])) },
        ],
        napovedy: ['U kterých vrcholů může být pravý úhel? Co z toho plyne pro polohu bodu C vzhledem k polopřímce AX?',
          'Pravý úhel při A: C leží na kolmici k AX v bodě A. Pravý úhel při B: úhel při A má 45°, C leží na přímce pod úhlem 45° od AX. V obou případech hledejte průsečík s přímkou c.',
          'Řešení jsou dvě: B₁, C₁ a B₂, C₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 68) Rovnoběžník ABCD: A, M uvnitř AB, N uvnitř AD, výška na AB, |BD| = |AD| (M9 2021/2. řádný ú. 10) ──
  function rovnobeznikVyskaBD() {
    for (let g = 0; g < 10000; g++) {
      const hc = vyber([3, 3.5, 4, 4.5]), h = hc * CM, A = bod(nah(50, 250), nah(150, 262)), xh = smer(nah(-0.5, 0.5)), nUp = rot(xh).y < 0 ? rot(xh) : nasob(rot(xh), -1);
      const uu = nah(45, 85), D = secti(A, secti(nasob(xh, uu), nasob(nUp, h))), Bb = secti(A, nasob(xh, 2 * uu)), C = secti(Bb, odecti(D, A));
      const M = secti(A, nasob(xh, 2 * uu * nah(0.25, 0.6))), N = secti(A, nasob(odecti(D, A), nah(0.3, 0.7))), vse = [A, M, N, Bb, C, D];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const nM = nasob(nUp, h), pa = G.pata(D, A, Bb);
      return {
        typ: 'rovnobeznikVyskaBD', nazev: 'Rovnoběžník — výška a |BD| = |AD|',
        text: 'Bod A je vrchol rovnoběžníku ABCD. Bod M leží uvnitř strany AB, bod N uvnitř strany AD a výška na stranu AB měří ' + cm(hc) + '. Vrchol D má od vrcholů A i B stejnou vzdálenost, tedy |BD| = |AD|. Sestrojte vrcholy B, C, D a rovnoběžník narýsujte.',
        dane: { body: { A, M, N } },
        hledane: ['B', 'C', 'D'], reseni: [{ B: Bb, C, D }], pomocne: [],
        postup: [
          { text: 'Strana AB leží na přímce AM a strana AD na přímce AN.', tvary: [P({ p: A, q: M }), P({ p: A, q: N })] },
          { text: 'Výška na AB měří ' + cm(hc) + ': D leží na rovnoběžce s AB ve vzdálenosti ' + cm(hc) + ' (na straně bodu N). Její průsečík s přímkou AN je vrchol D.', tvary: [P({ p: secti(A, nM), q: secti(secti(A, nM), xh) }), B(D, 'D')] },
          { text: '|BD| = |AD|: D leží na ose úsečky AB, takže pata kolmice z D na AB je střed AB. B je obraz bodu A podle paty.', tvary: [P({ p: D, q: pa }), B(Bb, 'B')] },
          { text: 'C leží na rovnoběžkách: s AD bodem B a s AB bodem D. Dorýsujte rovnoběžník.', tvary: [P({ p: Bb, q: C }), P({ p: D, q: C }), B(C, 'C')].concat(strany([A, Bb, C, D])) },
        ],
        napovedy: ['Kde leží vrchol D, když znáte výšku ' + cm(hc) + ' a směr strany AD? A co znamená |BD| = |AD| pro polohu paty výšky?',
          'D je průsečík přímky AN s rovnoběžkou s AB ve vzdálenosti ' + cm(hc) + '. Pata kolmice z D na AB je střed AB, B je obraz A podle paty. C = B + D − A (rovnoběžky).',
          'Vrcholy B, C, D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 69) Čtverec ABCD: A, AB na přímce a, jeden z vrcholů B, C, D na přímce p, celý čtverec v jedné polorovině s hranicí p (M9 2021 ilustr. ú. 9; 3 řešení) ──
  function ctverecPolorovina() {
    for (let g = 0; g < 40000; g++) {
      const A = bod(nah(60, 340), nah(60, 240)), xh = smer(nah(0, 2 * Math.PI)), nn = rot(xh), a = primka(A, xh);
      const p = primka(bod(nah(40, 360), nah(40, 260)), smer(nah(0, Math.PI))), pd = jednot(odecti(p.q, p.p));
      const sd = x => G.vekt(pd, odecti(x, p.p));   // vzdálenost od p se znaménkem
      const kand = [], pridej = (Bb, D, pri) => kand.push({ B: Bb, C: secti(Bb, odecti(D, A)), D, pri });
      const B0 = G.prusecikPP(A, secti(A, xh), p.p, p.q), D0 = G.prusecikPP(A, secti(A, nn), p.p, p.q);
      if (B0) for (const sg of [1, -1]) pridej(B0, secti(A, nasob(nn, sg * vzdal(A, B0))), 'B');
      if (D0) for (const sg of [1, -1]) pridej(secti(A, nasob(xh, sg * vzdal(A, D0))), D0, 'D');
      for (const sg of [1, -1]) {
        const C0 = G.prusecikPP(A, secti(A, secti(xh, nasob(nn, sg))), p.p, p.q);
        if (C0) kand.push({ B: secti(A, nasob(xh, skal(odecti(C0, A), xh))), C: C0, D: secti(A, nasob(nn, skal(odecti(C0, A), nn))), pri: 'C' });
      }
      const dobre = kand.filter(s => {
        const d = [s.B, s.C, s.D].map(sd), jedna = d.every(v => v >= -1e-6) || d.every(v => v <= 1e-6);
        return jedna && vzdal(A, s.B) >= 45 && d.filter(v => Math.abs(v) > 1e-6).every(v => Math.abs(v) >= 12) && Math.abs(sd(A)) >= 12;
      });
      if (dobre.length !== 3) continue;
      const vse = [A].concat(...dobre.map(s => [s.B, s.C, s.D]));
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const idx = '₁₂₃';
      // vrchol společný víc čtvercům se popíše jednou holým jménem (u prvního z nich), ostatní mají jen bod bez popisku
      const popisek = (sq, i, k) => { const sdilen = dobre.some((o, j) => j !== i && vzdal(o[k], sq[k]) < 1); return !sdilen ? k + idx[i] : dobre.some((o, j) => j < i && vzdal(o[k], sq[k]) < 1) ? undefined : k; };
      return {
        typ: 'ctverecPolorovina', nazev: 'Čtverec — vrchol na přímce, jedna polorovina',
        text: 'Bod A je vrchol čtverce ABCD. Na přímce p leží jeden ze zbývajících vrcholů B, C, D tohoto čtverce a strana AB leží na přímce a. Celý čtverec leží v jedné polorovině s hraniční přímkou p. Sestrojte vrcholy B, C, D a čtverec narýsujte. Najděte všechna řešení.',
        dane: { body: { A }, primky: [Object.assign({ nazev: 'a' }, a), Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'C', 'D'], reseni: dobre.map(s => ({ B: s.B, C: s.C, D: s.D })), pomocne: [],
        postup: [
          { text: 'Strana AB leží na přímce a. Na přímce p může ležet vrchol B, nebo D, nebo C. Zkusíme všechny tři možnosti; vyhovují jen čtverce, které leží celé na jedné straně přímky p.', tvary: [] },
        ].concat(dobre.map((s, i) => ({
          text: s.pri === 'B' ? 'B leží na p: B je průsečík přímek a a p, AD je kolmá k a a |AD| = |AB| (kružítkem). Čtverec ' + (i + 1) + '.'
            : s.pri === 'D' ? 'D leží na p: D je průsečík kolmice k a v bodě A s přímkou p, B leží na a ve vzdálenosti |AD| od A. Čtverec ' + (i + 1) + '.'
              : 'C leží na p: úhlopříčka AC svírá s a úhel 45°. C je průsečík p s touto přímkou, B je pata kolmice z C na a, D = A + C − B. Čtverec ' + (i + 1) + '.',
          // vrchol společný dvěma čtvercům (B = a ∩ p) nese holé jméno, jinak by se dva popisky B₁ a B₂ překrývaly
          tvary: ['B', 'C', 'D'].map(k => B(s[k], popisek(s, i, k))).concat(strany([A, s.B, s.C, s.D])),
        }))),
        napovedy: ['Který z vrcholů B, C, D může ležet na přímce p? Zkuste všechny tři možnosti a zkontrolujte, jestli čtverec leží celý na jedné straně p.',
          'B ∈ p: B = a ∩ p. D ∈ p: D = (kolmice k a v A) ∩ p. C ∈ p: C leží na přímce pod úhlem 45° k a z bodu A. Vždy nakonec dokreslete čtverec a ověřte polorovinu.',
          'Řešení jsou tři čtverce. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 70) Rovnoramenný lichoběžník ABCD se základnou AB: B, P, BC na q, úhlopříčky kolmé se průsečíkem P (M9 2021/1. řádný ú. 10) ──
  function lichobeznikKolmeUhl() {
    for (let g = 0; g < 30000; g++) {
      const P1 = bod(nah(100, 300), nah(90, 210)), pb = nah(45, 80), Bb = secti(P1, nasob(smer(nah(0, 2 * Math.PI)), pb)), sg = vyber([-1, 1]);
      const A = secti(P1, otoc(odecti(Bb, P1), sg * Math.PI / 2)), k = vyber([nah(0.55, 0.8), nah(1.3, 1.9)]);
      if (Math.abs(1 - k) * pb * Math.SQRT2 < 20) continue;   // základny se liší aspoň o 20 (jinak skoro obdélník)
      const C = secti(P1, nasob(odecti(P1, A), k)), D = secti(P1, nasob(odecti(P1, Bb), k)), q = primka(Bb, jednot(odecti(C, Bb)));
      // druhý možný vrchol A′ (opačné otočení) nesmí dát lichoběžník: C′ by neležel za bodem P
      const A2 = secti(P1, otoc(odecti(Bb, P1), -sg * Math.PI / 2)), C2 = G.prusecikPP(A2, P1, q.p, q.q);
      if (C2 && skal(odecti(C2, P1), odecti(P1, A2)) > 0) continue;
      const vse = [Bb, P1, A, C, D];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || !konvexni([A, Bb, C, D])) continue;
      return {
        typ: 'lichobeznikKolmeUhl', nazev: 'Rovnoramenný lichoběžník — kolmé úhlopříčky',
        text: 'Bod B je vrchol rovnoramenného lichoběžníku ABCD se základnou AB a rameno BC leží na přímce q. Úhlopříčky AC a BD se protínají v bodě P a jsou na sebe kolmé. Sestrojte vrcholy A, C, D a lichoběžník narýsujte.',
        dane: { body: { B: Bb, P: P1 }, primky: [Object.assign({ nazev: 'q' }, q)] },
        hledane: ['A', 'C', 'D'], reseni: [{ A, C, D }], pomocne: [],
        postup: [
          { text: 'V rovnoramenném lichoběžníku je |PA| = |PB|. Úhlopříčky jsou kolmé, takže trojúhelník ABP je pravoúhlý rovnoramenný. A leží na kolmici k BP v bodě P ve vzdálenosti |PB| od P — dvě možnosti.', tvary: [P({ p: P1, q: secti(P1, rot(odecti(Bb, P1))) }), K(P1, pb), B(A, 'A'), B(A2)] },
          { text: 'Úhlopříčka AC vede přes P. C je průsečík přímky AP s přímkou q. Vyhovuje ta poloha A, pro kterou C leží za bodem P (druhá možnost dává průsečík na opačné straně).', tvary: [P({ p: A, q: P1 }), B(C, 'C')] },
          { text: 'Úhlopříčky se v rovnoramenném lichoběžníku dělí ve stejném poměru: |PD| = |PC|, D leží na přímce BP za bodem P. Dorýsujte lichoběžník.', tvary: [K(P1, vzdal(P1, C)), B(D, 'D')].concat(strany([A, Bb, C, D])) },
        ],
        napovedy: ['Co víte o trojúhelníku ABP, když jsou úhlopříčky kolmé a lichoběžník je rovnoramenný? Jak daleko je A od P?',
          'A leží na kolmici k BP v P a |PA| = |PB|. C je průsečík přímky AP s q (za bodem P). D je na přímce BP ve vzdálenosti |PC| od P.',
          'Vrcholy A, C, D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 71) Rovnoběžník ABCD: A na p, C, |BD| = 2 · |AC|, B nebo D na p (M9 2019 ilustr. ú. 9; 2 řešení) ──
  function rovnobeznikDvojnasobek() {
    for (let g = 0; g < 10000; g++) {
      const S = bod(nah(150, 250), nah(110, 190)), ac = nah(90, 125), A = secti(S, nasob(smer(nah(0, 2 * Math.PI)), ac / 2)), C = stredove(A, S);
      const p = primka(A, smer(nah(0, Math.PI))), X = G.prusecikyPK(p.p, p.q, S, ac);
      if (X.length !== 2) continue;
      const res = X.map(Bb => ({ B: Bb, D: stredove(Bb, S) })), vse = [A, C, S].concat(...res.map(s => [s.B, s.D]));
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || G.vzdalOdPrimky(S, p.p, p.q) < 20) continue;
      const [r1, r2] = res;
      return {
        typ: 'rovnobeznikDvojnasobek', nazev: 'Rovnoběžník — úhlopříčka dvojnásobná',
        text: 'Body A a C jsou vrcholy rovnoběžníku ABCD, jehož úhlopříčka BD je dvakrát delší než úhlopříčka AC. Bod A leží na přímce p a jeden ze zbývajících vrcholů B, D také leží na přímce p. Sestrojte vrcholy B, D a rovnoběžník narýsujte. Najděte všechna řešení.',
        dane: { body: { A, C }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'D'], reseni: res, pomocne: [S],
        postup: [
          { text: 'Úhlopříčky se půlí ve středu S úsečky AC.', tvary: osaUsecky(A, C).tvary.concat([B(S, 'S')]) },
          { text: '|BD| = 2|AC|, tedy |SB| = ½|BD| = |AC|. Vrchol B leží na kružnici se středem S a poloměrem |AC|.', tvary: [K(S, ac)] },
          { text: 'B leží také na p. Průsečíky kružnice s přímkou p jsou B₁ a B₂. D je obraz bodu B podle S. Úloha má dvě řešení.', tvary: [B(r1.B, 'B₁'), B(r2.B, 'B₂'), P({ p: r1.B, q: S }), P({ p: r2.B, q: S }), B(r1.D, 'D₁'), B(r2.D, 'D₂')].concat(strany([A, r1.B, C, r1.D]), strany([A, r2.B, C, r2.D])) },
        ],
        napovedy: ['Kde leží střed rovnoběžníku? Jak daleko od něj je vrchol B, když |BD| = 2|AC|?',
          'S je střed AC. B leží na kružnici (S, |AC|) a na přímce p; D je obraz B podle S.',
          'Řešení jsou dvě: B₁, D₁ a B₂, D₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 72) Lichoběžník ABCD vepsaný do kružnice k, |AC| = |AB|, A a C dané (M9 2016 ilustr. ú. 10) ──
  function lichobeznikKruzAC() {
    for (let g = 0; g < 10000; g++) {
      const S = bod(nah(150, 250), nah(110, 190)), r = nah(70, 95), fa = nah(0, 2 * Math.PI);
      const A = secti(S, nasob(smer(fa), r)), C = secti(S, nasob(smer(fa + vyber([-1, 1]) * nah(2.15, 3.0)), r));   // oblouk AB musí být nad 120°, jinak by AC byla strana, ne úhlopříčka
      const Bb = G.osove(C, S, A), m = stred(A, Bb);
      if (vzdal(m, S) < 5) continue;
      const D = G.osove(C, S, m), vse = [A, C, S, Bb, D];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || !konvexni([A, Bb, C, D]) || Math.abs(vzdal(A, Bb) - vzdal(C, D)) < 15) continue;
      return {
        typ: 'lichobeznikKruzAC', nazev: 'Lichoběžník na kružnici — |AC| = |AB|',
        text: 'Body A a C leží na kružnici k se středem S. Sestrojte lichoběžník ABCD se základnami AB a CD, jehož všechny vrcholy leží na kružnici k a jehož úhlopříčka AC je stejně dlouhá jako základna AB.',
        dane: { body: { A, C, S }, kruznice: [{ c: S, r, nazev: 'k' }] },
        hledane: ['B', 'D'], reseni: [{ B: Bb, D }], pomocne: [],
        postup: [
          { text: '|AB| = |AC|: vrchol B leží na kružnici se středem A a poloměrem |AC|. Leží také na k — kružnice se protínají v bodech C a B.', tvary: [K(A, vzdal(A, C)), B(Bb, 'B')] },
          { text: 'Lichoběžník vepsaný do kružnice je rovnoramenný. Základna CD je rovnoběžná s AB: rovnoběžka s AB bodem C protne kružnici k v druhém bodě D.', tvary: [P({ p: C, q: secti(C, odecti(Bb, A)) }), B(D, 'D')].concat(strany([A, Bb, C, D])) },
        ],
        napovedy: ['Na jaké kružnici leží B, když |AB| = |AC|? A jaká je základna CD vůči AB?',
          'B je druhý průsečík kružnic (A, |AC|) a k. D je druhý průsečík kružnice k s rovnoběžkou s AB bodem C.',
          'Vrcholy B a D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 73) Pravoúhlý lichoběžník ABCD: AB a přímka p ∋ B dané, C ∈ p, |AC| = |AB| (M9 2023/1. náhr. ú. 9; 2 řešení) ──
  // Úhel při B je ostrý (ABC je rovnoramenný se základnou BC), takže pravé úhly jsou při A a D (AB ∥ CD), nebo při C a D (BC ∥ AD).
  function pravouhlyLichAC() {
    for (let g = 0; g < 20000; g++) {
      const A = bod(nah(60, 340), nah(60, 240)), L = nah(100, 135), xh = smer(nah(0, 2 * Math.PI)), Bb = secti(A, nasob(xh, L));
      const C = secti(A, nasob(otoc(xh, RAD(nah(40, 72)) * vyber([-1, 1])), L)), nn = rot(xh), u = jednot(odecti(C, Bb)), p = primka(Bb, u);
      const D1 = secti(A, nasob(nn, skal(odecti(C, A), nn))), D2 = secti(A, nasob(u, skal(odecti(C, A), u)));
      const vse = [A, Bb, C, D1, D2];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || !konvexni([A, Bb, C, D1]) || !konvexni([A, Bb, C, D2])) continue;
      return {
        typ: 'pravouhlyLichAC', nazev: 'Pravoúhlý lichoběžník — |AC| = |AB|',
        text: 'Úsečka AB je strana pravoúhlého lichoběžníku ABCD. Vrchol C leží na přímce p, která prochází bodem B, a úhlopříčka AC je stejně dlouhá jako strana AB. Sestrojte vrcholy C, D a lichoběžník narýsujte. Najděte všechna řešení.',
        dane: { body: { A, B: Bb }, primky: [Object.assign({ nazev: 'p' }, p)], usecky: [{ p: A, q: Bb }] },
        hledane: ['C', 'D'], reseni: [{ C, D: D1 }, { C, D: D2 }], pomocne: [],
        postup: [
          { text: '|AC| = |AB|: C leží na kružnici se středem A a poloměrem |AB|. Kružnice protne přímku p v bodě B a ještě jednou — to je hledaný vrchol C.', tvary: [K(A, L), B(C, 'C')] },
          { text: 'Trojúhelník ABC je rovnoramenný se základnou BC, takže úhel při B je ostrý a pravé úhly jsou jinde. První možnost: základny AB a CD, pravé úhly při A a D. Kolmice k AB bodem A a rovnoběžka s AB bodem C se protnou v bodě D₁.',
            tvary: [P({ p: A, q: secti(A, nn) }), P({ p: C, q: secti(C, xh) }), B(D1, 'D₁')].concat(strany([A, Bb, C, D1])) },
          { text: 'Druhá možnost: základny BC a AD, pravé úhly při C a D. AD je rovnoběžná s p (rovnoběžka bodem A) a CD je kolmá k p (kolmice bodem C); jejich průsečík je D₂.',
            tvary: [P({ p: A, q: secti(A, u) }), P({ p: C, q: secti(C, rot(u)) }), B(D2, 'D₂')].concat(strany([A, Bb, C, D2])) },
        ],
        napovedy: ['Na jaké kružnici leží C, když |AC| = |AB|? Může být pravý úhel při B? A kde tedy mohou být dva pravé úhly lichoběžníku?',
          'C je druhý průsečík kružnice (A, |AB|) s přímkou p. Pak dvě možnosti: základny AB, CD (pravé úhly při A, D) nebo základny BC, AD (pravé úhly při C, D).',
          'Řešení jsou dvě, vrchol C mají společný. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 74) Obdélník KLMN s vrcholy na různoběžkách p, q, bod R uvnitř strany MN (M9 2025/1. řádný ú. 9; osa většího úhlu) ──
  // Úhlopříčky leží na p, q a půlí se v O = p ∩ q, takže |OM| = |ON| a MN je kolmá k ose úhlu MON; R leží v úhlu většího z úhlů p, q.
  function obdelnikDvePrimky() {
    for (let g = 0; g < 20000; g++) {
      const O = bod(nah(150, 250), nah(110, 190)), up = smer(nah(0, 2 * Math.PI)), uq = otoc(up, RAD(nah(100, 138)) * vyber([-1, 1]));
      const s = nah(52, 82), sg = vyber([-1, 1]), Xp = secti(O, nasob(up, sg * s)), Yp = secti(O, nasob(uq, sg * s));
      const R = secti(Xp, nasob(odecti(Yp, Xp), nah(0.3, 0.7))), [Mm, N] = Math.random() < 0.5 ? [Xp, Yp] : [Yp, Xp];
      const Kk = stredove(Mm, O), L = stredove(N, O), vse = [Kk, L, Mm, N, R];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || vzdal(R, O) < 28) continue;
      const os = jednot(secti(up, uq));
      return {
        typ: 'obdelnikDvePrimky', nazev: 'Obdélník — vrcholy na dvou přímkách',
        text: 'V rovině leží různoběžky p, q a bod R. Všechny čtyři vrcholy obdélníku KLMN leží na přímkách p, q a bod R leží uvnitř strany MN. Sestrojte vrcholy K, L, M, N a obdélník narýsujte. Pomůže vám osa většího z úhlů, které přímky p, q svírají.',
        dane: { body: { R }, primky: [Object.assign({ nazev: 'p' }, primka(O, up)), Object.assign({ nazev: 'q' }, primka(O, uq))] },
        hledane: ['K', 'L', 'M', 'N'], reseni: [{ K: Kk, L, M: Mm, N }], pomocne: [O],
        postup: [
          { text: 'Sestrojte osu o většího z úhlů, které přímky p, q svírají (bod R leží v tomto úhlu nebo v úhlu k němu vrcholovém). Průsečík p a q je bod O.', tvary: [P({ p: O, q: secti(O, os) }), B(O, 'O')] },
          { text: 'Úhlopříčky obdélníku jsou shodné a půlí se. Leží na p a q, takže mají střed O a |OM| = |ON|. Trojúhelník OMN je rovnoramenný, a proto je MN kolmá k ose o. Sestrojte kolmici k o bodem R; protne p a q v bodech M, N.',
            tvary: [P({ p: R, q: secti(R, rot(os)) }), B(Mm, 'M'), B(N, 'N')] },
          { text: 'O je střed úhlopříček MK a NL. Vrcholy K, L jsou obrazy M, N ve středové souměrnosti podle O (kružítkem |OK| = |OM|, |OL| = |ON|). Dorýsujte obdélník.', tvary: [B(Kk, 'K'), B(L, 'L')].concat(strany([Kk, L, Mm, N])) },
        ],
        napovedy: ['Kde leží střed obdélníku, jehož vrcholy jsou na dvou různoběžkách? A jak vede strana MN vzhledem k ose většího úhlu přímek p, q?',
          'Střed je O = p ∩ q. Strana MN je kolmá k ose o a prochází bodem R; M, N jsou její průsečíky s p a q. K a L jsou obrazy M a N ve středové souměrnosti podle O.',
          'Vrcholy K, L, M, N jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 75) Čtverec ABCD se stranou AB na přímce a; dva z bodů P, Q, R leží uvnitř různých stran, třetí vně (M9 2023/2. náhr. ú. 9; 2 řešení) ──
  // Dvojici bodů na dvojici stran (DA, BC kolmé k a; CD rovnoběžná s a) určuje čtverec z lineární rovnice; zkouší se všechny dvojice, strany i polorovina.
  function ctverecTriBody() {
    const M = 36, jm = ['P', 'Q', 'R'], idx = '₁₂';
    const naStrane = (q, st, t) => st === 'DA' ? [q.x0, q.e * q.s * t] : st === 'BC' ? [q.x0 + q.s, q.e * q.s * t] : [q.x0 + q.s * t, q.e * q.s];
    for (let g = 0; g < 60000; g++) {
      // body se skládají ze dvou čtverců: P je na kolmé straně většího a na vodorovné straně menšího čtverce, Q na dalším boku většího, R na boku menšího
      const e = vyber([1, -1]), sb = nah(80, 125), xb = nah(-150, 50), Pu = nah(xb + M, xb + sb - M);
      const sa = nah(sb + 40, 150), sv = vyber(['DA', 'BC']), qa = { e, x0: sv === 'DA' ? Pu : Pu - sa, s: sa }, qb = { e, x0: xb, s: sb };
      const sQ = vyber(['DA', 'BC', 'CD'].filter(x => x !== sv)), sR = vyber(['DA', 'BC']);
      const O0 = bod(nah(100, 300), nah(80, 220)), xh = smer(nah(0, 2 * Math.PI)), nn = rot(xh), a = primka(O0, xh);
      const dopl = ([u, n]) => secti(O0, secti(nasob(xh, u), nasob(nn, n)));
      const ord = [0, 1, 2]; for (let i = 2; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
      const pts = [dopl([Pu, e * sb]), dopl(naStrane(qa, sQ, nah(M / sa, 1 - M / sa))), dopl(naStrane(qb, sR, nah(M / sb, 1 - M / sb)))];
      const bodyUlohy = ord.map(i => pts[i]);
      if (!vsechnyUvnitr(bodyUlohy) || !rozestup(bodyUlohy, 36)) continue;
      // úplný výčet čtverců, které úloha připouští
      const uu = bodyUlohy.map(x => skal(odecti(x, O0), xh)), nv = bodyUlohy.map(x => skal(odecti(x, O0), nn)), res = [], videno = new Set();
      for (const ee of [1, -1]) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) for (const dvojice of [['DA', 'BC'], ['DA', 'CD'], ['BC', 'CD']]) {
        let x0, s;
        if (dvojice[1] === 'BC') { x0 = uu[i]; s = uu[j] - uu[i]; } else { s = ee * nv[j]; x0 = dvojice[0] === 'DA' ? uu[i] : uu[i] - s; }
        if (!(s >= 72)) continue;
        const uvnitrStrany = (k, st) => st === 'CD' ? uu[k] > x0 + M && uu[k] < x0 + s - M : ee * nv[k] > M && ee * nv[k] < s - M;
        if (!uvnitrStrany(i, dvojice[0]) || !uvnitrStrany(j, dvojice[1])) continue;
        const k = 3 - i - j;
        if (Math.hypot(Math.max(0, x0 - uu[k], uu[k] - x0 - s), Math.max(0, -ee * nv[k], ee * nv[k] - s)) < M) continue;
        const klic = [ee, x0.toFixed(2), s.toFixed(2)].join();
        if (videno.has(klic)) continue;
        videno.add(klic);
        res.push({ i, j, s1: dvojice[0], s2: dvojice[1], A: dopl([x0, 0]), B: dopl([x0 + s, 0]), C: dopl([x0 + s, ee * s]), D: dopl([x0, ee * s]) });
      }
      if (res.length !== 2) continue;
      const vrcholy = res.map(q => [q.A, q.B, q.C, q.D]), vse = [].concat(...vrcholy);
      let odstup = true;
      for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) { const d = vzdal(vrcholy[0][x], vrcholy[1][y]); if (d > 1e-6 && d < 36) odstup = false; }
      if (!odstup || !vsechnyUvnitr(vse) || bodyUlohy.some(x => vse.some(v => vzdal(x, v) < 36))) continue;
      const popis = q => {
        const X = jm[q.i], Y = jm[q.j];
        if (q.s1 === 'DA' && q.s2 === 'BC') return X + ' leží na straně DA, ' + Y + ' na straně BC. Obě strany jsou kolmé k a: kolmice k a body ' + X + ', ' + Y + ' protnou a v bodech A, B. Strana čtverce je |AB|, vrcholy C, D leží na kolmicích ve vzdálenosti |AB| od a (kružítkem).';
        if (q.s1 === 'DA') return X + ' leží na straně DA (kolmé k a), ' + Y + ' na straně CD (rovnoběžné s a). Kolmice k a bodem ' + X + ' a rovnoběžka s a bodem ' + Y + ' se protnou ve vrcholu D; A je pata kolmice z D na a, B leží na a ve vzdálenosti |AD| od A a C naproti A.';
        return X + ' leží na straně BC (kolmé k a), ' + Y + ' na straně CD (rovnoběžné s a). Kolmice k a bodem ' + X + ' a rovnoběžka s a bodem ' + Y + ' se protnou ve vrcholu C; B je pata kolmice z C na a, A leží na a ve vzdálenosti |BC| od B a D naproti B.';
      };
      const stranaPrimka = (q, st) => st === 'DA' ? P({ p: q.A, q: q.D }) : st === 'BC' ? P({ p: q.B, q: q.C }) : P({ p: q.D, q: q.C });
      return {
        typ: 'ctverecTriBody', nazev: 'Čtverec — tři body u stran',
        text: 'Čtverec ABCD má stranu AB na přímce a. Dva z bodů P, Q, R leží uvnitř dvou různých stran čtverce, třetí bod leží mimo čtverec. Sestrojte vrcholy A, B, C, D a čtverec narýsujte. Najděte všechna řešení.',
        dane: { body: { P: bodyUlohy[0], Q: bodyUlohy[1], R: bodyUlohy[2] }, primky: [Object.assign({ nazev: 'a' }, a)] },
        hledane: ['A', 'B', 'C', 'D'], reseni: res.map(q => ({ A: q.A, B: q.B, C: q.C, D: q.D })), pomocne: [],
        postup: [{ text: 'Dva z bodů P, Q, R leží na stranách čtverce, třetí ne. Zkoušíme dvojice bodů a dvojice stran; strany DA a BC jsou kolmé k a, strana CD je s a rovnoběžná. Vyhovují jen čtverce, kde třetí bod leží vně.', tvary: [] }].concat(res.map((q, n) => ({
          text: 'Čtverec ' + (n + 1) + ': ' + popis(q),
          tvary: [stranaPrimka(q, q.s1), stranaPrimka(q, q.s2)].concat(['A', 'B', 'C', 'D'].map(k => B(q[k], k + idx[n])), strany([q.A, q.B, q.C, q.D])),
        }))),
        napovedy: ['Který pár bodů leží na stranách čtverce? Strana kolmá k a prochází bodem jako kolmice, strana rovnoběžná s a jako rovnoběžka. Vzdálenost takového bodu od a je pak strana čtverce.',
          'Zkoušejte dvojice bodů: kolmice k a bodem a rovnoběžka s a druhým bodem se protnou ve vrcholu čtverce; nebo dvě kolmice k a, jejichž vzdálenost je strana. Zkontrolujte, že třetí bod leží vně.',
          'Řešení jsou dvě. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 76) Kosočtverec ABCD: strany na polopřímkách AX, AY, výška kosočtverce = |AY| (M9 2020 ilustr. ú. 9) ──
  // Strana a splňuje a·sin α = |AY|, takže D leží na polopřímce AY v místě, kde ji protne rovnoběžka s AX ve vzdálenosti |AY|.
  function kosoctverecVyska() {
    for (let g = 0; g < 20000; g++) {
      const A = bod(nah(60, 340), nah(60, 240)), ux = smer(nah(0, 2 * Math.PI)), al = RAD(vyber([nah(28, 45), nah(135, 152)])) * vyber([-1, 1]), uy = otoc(ux, al);
      const hy = nah(45, 62), a = hy / Math.abs(Math.sin(al)), X = secti(A, nasob(ux, nah(70, 130))), Y = secti(A, nasob(uy, hy));
      const Bb = secti(A, nasob(ux, a)), D = secti(A, nasob(uy, a)), C = secti(Bb, odecti(D, A));
      const nn = nasob(rot(ux), Math.sign(skal(uy, rot(ux)))), Pp = secti(A, nasob(nn, hy)), vse = [A, X, Y, Pp, Bb, C, D];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || !konvexni([A, Bb, C, D])) continue;
      return {
        typ: 'kosoctverecVyska', nazev: 'Kosočtverec — výška |AY|',
        text: 'V rovině leží trojúhelník AXY. Bod A je vrchol kosočtverce ABCD, jehož strany AB a AD leží na polopřímkách AX a AY. Výška kosočtverce je stejně dlouhá jako úsečka AY. Sestrojte vrcholy B, C, D a kosočtverec narýsujte.',
        dane: { body: { A, X, Y }, usecky: [{ p: A, q: X }, { p: A, q: Y }, { p: X, q: Y }] },
        hledane: ['B', 'C', 'D'], reseni: [{ B: Bb, C, D }], pomocne: [Pp],
        postup: [
          { text: 'Výška kosočtverce je vzdálenost rovnoběžných stran AB a CD. Na kolmici k AX v bodě A naneste od A vzdálenost |AY| (kružnice se středem A a poloměrem |AY|) na tu stranu, kde leží AY. Dostanete bod P.', tvary: [P({ p: A, q: secti(A, nn) }), K(A, hy), B(Pp, 'P')] },
          { text: 'Rovnoběžka s AX bodem P je přímka, na které leží strana CD. Protne polopřímku AY v bodě D.', tvary: [P({ p: Pp, q: secti(Pp, ux) }), B(D, 'D')] },
          { text: 'Strany kosočtverce jsou shodné: kružnice se středem A a poloměrem |AD| protne polopřímku AX v bodě B. Bod C leží v průsečíku rovnoběžky s AD bodem B a rovnoběžky s AB bodem D. Dorýsujte kosočtverec.',
            tvary: [K(A, a), B(Bb, 'B'), P({ p: Bb, q: secti(Bb, odecti(D, A)) }), P({ p: D, q: secti(D, odecti(Bb, A)) }), B(C, 'C')].concat(strany([A, Bb, C, D])) },
        ],
        napovedy: ['Co znamená výška kosočtverce a jak ji nanést od strany AB? Kde pak leží strana CD?',
          'Na kolmici k AX v A naneste |AY|, bodem veďte rovnoběžku s AX — ta protne AY v D. Pak |AB| = |AD| a C = B + D − A.',
          'Vrcholy B, C, D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 78) Rovnoramenný lichoběžník ABCD vepsaný do k, C a D dané, vzdálenost A, B od CD je r (M9 2017/2. řádný ú. 10) ──
  function lichobeznikKruzCD() {
    for (let g = 0; g < 20000; g++) {
      const S = bod(nah(150, 250), nah(110, 190)), r = nah(70, 92), u = smer(nah(0, 2 * Math.PI)), nn = nasob(rot(u), vyber([-1, 1])), d = nah(0.14, 0.9) * r;
      if (Math.abs(d - r / 2) < 0.1 * r) continue;                                   // d = r/2 by dalo obdélník (obě základny stejné)
      const c = Math.sqrt(r * r - d * d), e = Math.sqrt(2 * r * d - d * d), Mc = secti(S, nasob(nn, -d));
      const C = secti(Mc, nasob(u, -c)), D = secti(Mc, nasob(u, c)), Ap = secti(secti(Mc, nasob(nn, r)), nasob(u, e)), Bp = secti(secti(Mc, nasob(nn, r)), nasob(u, -e));
      const T = secti(C, nasob(nn, r)), vse = [S, C, D, Ap, Bp, T];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36) || !konvexni([Ap, Bp, C, D]) || Math.abs(2 * e - 2 * c) < 25) continue;
      return {
        typ: 'lichobeznikKruzCD', nazev: 'Lichoběžník na kružnici — vzdálenost r',
        text: 'Kružnici k se středem S protíná přímka p v bodech C a D. Body C, D jsou vrcholy rovnoramenného lichoběžníku ABCD, jehož všechny čtyři vrcholy leží na kružnici k. Vzdálenost bodů A, B od přímky CD je rovna poloměru r kružnice k. Sestrojte vrcholy A, B a lichoběžník narýsujte.',
        dane: { body: { S, C, D }, kruznice: [{ c: S, r, nazev: 'k' }], primky: [Object.assign({ nazev: 'p' }, primka(Mc, u))] },
        hledane: ['A', 'B'], reseni: [{ A: Ap, B: Bp }], pomocne: [T],
        postup: [
          { text: 'Body A, B mají od přímky CD vzdálenost r = |SC|. Na kolmici k p v bodě C naneste od C vzdálenost r (kružnice se středem C a poloměrem r) směrem ke středu S. Dostanete bod T.', tvary: [P({ p: C, q: secti(C, nn) }), K(C, r), B(T, 'T')] },
          { text: 'Rovnoběžka s p bodem T je množina bodů ve vzdálenosti r od CD. Protne kružnici k v bodech A, B (A je u D, B u C). Lichoběžník vepsaný do kružnice je rovnoramenný. Dorýsujte ho.',
            tvary: [P({ p: T, q: secti(T, u) }), B(Ap, 'A'), B(Bp, 'B')].concat(strany([Ap, Bp, C, D])) },
        ],
        napovedy: ['Kde leží body, které mají od přímky CD vzdálenost r? A které z nich leží na kružnici k?',
          'Sestrojte rovnoběžku s CD ve vzdálenosti r (na straně středu S) — kolmice v C, kružítkem r, rovnoběžka. Průsečíky s k jsou A, B.',
          'Vrcholy A a B jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 79) Rovnoramenný lichoběžník ABCD: B, D na rovnoběžkách p, q, |∢ABC| = 3·|∢ABD| (M9 2017 ilustr. ú. 10) ──
  // V soustavě s B v počátku, p jako osou x a q ve výšce h: D = (d, h), tan φ = h/d, C = (h/tan 3φ, h), A = (c + d, 0) — z osové souměrnosti.
  function lichobeznikTrojnasobek() {
    for (let g = 0; g < 20000; g++) {
      const Bb = bod(nah(60, 340), nah(60, 240)), u = smer(nah(0, 2 * Math.PI)), nn = nasob(rot(u), vyber([-1, 1]));
      const h = nah(70, 115), fi = RAD(nah(20, 41)), d = h / Math.tan(fi), c = h / Math.tan(3 * fi), a = c + d;
      const poz = (x, y) => secti(Bb, secti(nasob(u, x), nasob(nn, y))), D = poz(d, h), C = poz(c, h), A = poz(a, 0), vse = [Bb, D, A, C];
      if (Math.abs(c) < 20 || !vsechnyUvnitr(vse) || !rozestup(vse, 36) || !konvexni([A, Bb, C, D])) continue;
      const os = osaUsecky(C, D);
      return {
        typ: 'lichobeznikTrojnasobek', nazev: 'Lichoběžník — úhel třikrát větší',
        text: 'V rovině leží rovnoběžné přímky p, q. Přímka p prochází bodem B, přímka q bodem D. Body B, D jsou vrcholy rovnoramenného lichoběžníku ABCD, jehož vrchol A leží na přímce p a vrchol C na přímce q. Úhel ABC je třikrát větší než úhel ABD. Sestrojte vrcholy A, C a lichoběžník narýsujte.',
        dane: { body: { B: Bb, D }, primky: [Object.assign({ nazev: 'p' }, primka(Bb, u)), Object.assign({ nazev: 'q' }, primka(D, u))] },
        hledane: ['A', 'C'], reseni: [{ A, C }], pomocne: os.PQ,
        postup: [
          { text: 'Úhel ABD má jedno rameno na přímce p (na straně bodu D) a druhé BD. Úhel ABC je třikrát větší: od ramene BD naneste dvakrát za sebou stejný úhel ABD (kružítkem, nebo úhloměrem).', tvary: [PL(Bb, secti(Bb, u)), PL(Bb, D)] },
          { text: 'Rameno úhlu ABC protne přímku q v bodě C.', tvary: [PL(Bb, C), B(C, 'C')] },
          { text: 'Lichoběžník je rovnoramenný, takže osa úsečky CD je jeho osou souměrnosti. Bod A je obraz bodu B v této osové souměrnosti (leží na přímce p). Dorýsujte lichoběžník.', tvary: os.tvary.concat([B(A, 'A')], strany([A, Bb, C, D])) },
        ],
        napovedy: ['Jak získat úhel, který je třikrát větší než úhel ABD? Kde pak leží vrchol C?',
          'Úhel ABD nanášejte od BD dvakrát za sebou. Rameno protne q v C. A je souměrný s B podle osy úsečky CD.',
          'Vrcholy A a C jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 80) Čtverec ABCD: A ∈ p ∩ k, AB na p, S uvnitř, právě dva vrcholy na k (M9 2019/2. řádný ú. 10; 3 řešení) ──
  // S = (t, d) vůči A (podél p, kolmo k p): na k leží B při s = 2t, C při s = t + d, D při s = 2d; všechny tři čtverce mají S uvnitř, když 0,5 < t/d < 2 a t ≠ d.
  function ctverecKruzP() {
    const idx = '₁₂₃';
    for (let g = 0; g < 60000; g++) {
      const A = bod(nah(50, 350), nah(50, 250)), u = smer(nah(0, 2 * Math.PI)), nn = nasob(rot(u), vyber([-1, 1])), d = nah(40, 100), t = nah(0.5, 2) * d;
      if (Math.abs(t - d) < 38 || t >= 2 * d - 3 || t <= d / 2 + 3) continue;
      const w = nasob(u, vyber([-1, 1])), S = secti(A, secti(nasob(w, t), nasob(nn, d))), p = primka(A, u);
      const sq = [[2 * t, 'B'], [t + d, 'C'], [2 * d, 'D']].map(([s, kde]) => { const Bb = secti(A, nasob(w, s)); return { kde, s, B: Bb, C: secti(Bb, nasob(nn, s)), D: secti(A, nasob(nn, s)) }; }).sort((x, y) => x.s - y.s);
      const vse = [A, S].concat(...sq.map(q => [q.B, q.C, q.D]));
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const r = Math.hypot(t, d);
      return {
        typ: 'ctverecKruzP', nazev: 'Čtverec — právě dva vrcholy na kružnici',
        text: 'Přímka p protíná kružnici k se středem S v bodě A. Hledáme čtverce ABCD, jejichž strana AB leží na přímce p, střed S leží uvnitř čtverce a na kružnici k leží právě dva vrcholy čtverce (A a ještě jeden). Sestrojte vrcholy B, C, D. Najděte všechna řešení.',
        dane: { body: { A, S }, kruznice: [{ c: S, r, nazev: 'k' }], primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'C', 'D'], reseni: sq.map(q => ({ B: q.B, C: q.C, D: q.D })), pomocne: [],
        postup: [{ text: 'Čtverec leží na straně přímky p, kde je S. Zkusíme, který ze zbývajících vrcholů B, C, D leží na k. Vyhovují jen čtverce, které mají S uvnitř (čtverec totiž musí zasahovat až za průmět S na p).', tvary: [] }].concat(sq.map((q, i) => ({
          text: 'Čtverec ' + (i + 1) + ': ' + (q.kde === 'B' ? 'B leží na k — je to druhý průsečík přímky p s kružnicí k. Čtverec sestrojte nad AB na straně bodu S (kolmice v A a B, kružítkem |AB|).'
            : q.kde === 'C' ? 'C leží na k — úhlopříčka AC svírá s p úhel 45°, C je druhý průsečík této přímky s k. B je pata kolmice z C na p a D leží na kolmici k p v bodě A.'
              : 'D leží na k — je to druhý průsečík kolmice k p v bodě A s kružnicí k. B leží na p ve vzdálenosti |AD| od A (na straně průmětu S) a C = B + D − A.'),
          tvary: [q.kde === 'B' ? P({ p: A, q: q.B }) : q.kde === 'C' ? P({ p: A, q: q.C }) : P({ p: A, q: q.D })].concat(['B', 'C', 'D'].map(k => B(q[k], k + idx[i])), strany([A, q.B, q.C, q.D])),
        }))),
        napovedy: ['Který ze zbývajících vrcholů B, C, D může ležet na k? Zkuste všechny tři možnosti a ověřte, že S leží uvnitř čtverce.',
          'B ∈ k: druhý průsečík p s k. D ∈ k: druhý průsečík kolmice k p v A s k. C ∈ k: druhý průsečík přímky pod úhlem 45° k p z A s k. Pak dokreslete čtverec a zkontrolujte, že na k neleží třetí vrchol.',
          'Řešení jsou tři čtverce. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 81) Rovnoramenný trojúhelník ABC se základnou AB, rameno AC na přímce p ∋ A (M9 2019/2. řádný ú. 9) ──
  function rovnoramennyPrimkaA() {
    for (let g = 0; g < 20000; g++) {
      const A = bod(nah(60, 340), nah(60, 240)), L = nah(110, 190), uAB = smer(nah(0, 2 * Math.PI)), Bb = secti(A, nasob(uAB, L));
      const th = RAD(nah(28, 68)) * vyber([-1, 1]), up = otoc(uAB, th), C = secti(A, nasob(up, L / (2 * Math.cos(th)))), vse = [A, Bb, C];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const o = osaUsecky(A, Bb);
      return {
        typ: 'rovnoramennyPrimkaA', nazev: 'Rovnoramenný trojúhelník — rameno na přímce',
        text: 'Body A, B jsou vrcholy rovnoramenného trojúhelníku ABC se základnou AB. Rameno AC leží na přímce p, která prochází bodem A. Sestrojte vrchol C a trojúhelník narýsujte.',
        dane: { body: { A, B: Bb }, primky: [Object.assign({ nazev: 'p' }, primka(A, up))] },
        hledane: ['C'], reseni: [{ C }], pomocne: o.PQ,
        postup: [
          { text: 'Ramena AC a BC jsou shodná, vrchol C má tedy od A i B stejnou vzdálenost a leží na ose základny AB. Sestrojte ji dvěma kružnicemi se stejným poloměrem.', tvary: o.tvary },
          { text: 'C leží také na přímce p. Je to průsečík osy základny a přímky p. Dorýsujte trojúhelník.', tvary: [B(C, 'C')].concat(strany([A, Bb, C])) },
        ],
        napovedy: ['Kde leží všechny body, které mají od A i B stejnou vzdálenost? A kde leží vrchol C ještě?',
          'Sestrojte osu úsečky AB. Její průsečík s přímkou p je vrchol C.',
          'Vrchol C je teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 82) Rovnoramenný trojúhelník ABC se základnou AB, C na polopřímce BY (M9 2015/1. řádný ú. 10) ──
  function rovnoramennyPoloprimka() {
    for (let g = 0; g < 20000; g++) {
      const A = bod(nah(60, 340), nah(60, 240)), L = nah(110, 190), Bb = secti(A, nasob(smer(nah(0, 2 * Math.PI)), L));
      const th = RAD(nah(28, 68)) * vyber([-1, 1]), uBY = otoc(jednot(odecti(A, Bb)), th), C = secti(Bb, nasob(uBY, L / (2 * Math.cos(th)))), Y = secti(Bb, nasob(uBY, nah(55, 95))), vse = [A, Bb, C, Y];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      const o = osaUsecky(A, Bb);
      return {
        typ: 'rovnoramennyPoloprimka', nazev: 'Rovnoramenný trojúhelník — vrchol na polopřímce',
        text: 'Jsou dány body A, B, Y. Na polopřímce BY najděte vrchol C rovnoramenného trojúhelníku ABC, jehož základnou je úsečka AB. Trojúhelník narýsujte.',
        dane: { body: { A, B: Bb, Y }, poloprimky: [{ p: Bb, q: Y }] },
        hledane: ['C'], reseni: [{ C }], pomocne: o.PQ,
        postup: [
          { text: 'Základna je AB, takže |CA| = |CB| a C leží na ose úsečky AB. Sestrojte ji dvěma kružnicemi se stejným poloměrem.', tvary: o.tvary },
          { text: 'C leží také na polopřímce BY. Je to průsečík osy základny a polopřímky BY. Dorýsujte trojúhelník.', tvary: [B(C, 'C')].concat(strany([A, Bb, C])) },
        ],
        napovedy: ['Který bod rovnoramenného trojúhelníku leží na ose základny? Kde ještě C leží?',
          'Sestrojte osu úsečky AB. Její průsečík s polopřímkou BY je vrchol C.',
          'Vrchol C je teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 83) Rovnoramenný trojúhelník: C dané, základna AB leží na přímce q a má délku n cm (M9 2022/2. řádný ú. 9) ──
  function rovnoramennyZaklQ() {
    for (let g = 0; g < 20000; g++) {
      const lcm = vyber([4, 5, 6]), l = lcm * CM, q0 = bod(nah(100, 300), nah(90, 210)), u = smer(nah(0, 2 * Math.PI)), nn = nasob(rot(u), vyber([-1, 1])), v = nah(60, 110);
      const S = secti(q0, nasob(u, nah(-30, 30))), C = secti(S, nasob(nn, v)), A = secti(S, nasob(u, -l / 2)), Bb = secti(S, nasob(u, l / 2)), vse = [C, S, A, Bb];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      return {
        typ: 'rovnoramennyZaklQ', nazev: 'Rovnoramenný trojúhelník — základna na přímce',
        text: 'Bod C je vrchol rovnoramenného trojúhelníku ABC se základnou AB. Základna AB leží na přímce q a má délku ' + cm(lcm) + '. Sestrojte vrcholy A, B a trojúhelník narýsujte.',
        dane: { body: { C }, primky: [Object.assign({ nazev: 'q' }, primka(S, u))] },
        hledane: ['A', 'B'], reseni: [{ A, B: Bb }], pomocne: [S],
        postup: [
          { text: 'Výška rovnoramenného trojúhelníku na základnu je kolmá k q a prochází bodem C. Sestrojte kolmici z C na přímku q; její patu označte S — je to střed základny.', tvary: [P({ p: C, q: S }), B(S, 'S')] },
          { text: 'Naneste od S na obě strany po ' + cm(lcm / 2) + ' (kružnice se středem S a poloměrem ' + cm(lcm / 2) + '). Průsečíky s q jsou vrcholy A, B. Dorýsujte trojúhelník.', tvary: [K(S, l / 2), B(A, 'A'), B(Bb, 'B')].concat(strany([A, Bb, C])) },
        ],
        napovedy: ['Kde leží střed základny rovnoramenného trojúhelníku vzhledem k bodu C a přímce q?',
          'Pata kolmice z C na q je střed základny. Od ní naneste na obě strany polovinu délky základny.',
          'Vrcholy A a B jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 84) Čtverec ABCD se středem S, vrchol B na přímce p, úhlopříčka AC ∥ p (M9 2015 ilustr. ú. 10) ──
  function ctverecStredP() {
    for (let g = 0; g < 20000; g++) {
      const S = bod(nah(110, 290), nah(90, 210)), rr = nah(48, 85), n0 = smer(nah(0, 2 * Math.PI)), u = rot(n0);
      const Bb = secti(S, nasob(n0, rr)), D = secti(S, nasob(n0, -rr)), A = secti(S, nasob(u, rr)), C = secti(S, nasob(u, -rr)), vse = [S, A, Bb, C, D];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      return {
        typ: 'ctverecStredP', nazev: 'Čtverec — střed S, úhlopříčka ∥ p',
        text: 'Je dána přímka p a bod S. Sestrojte čtverec ABCD se středem S, vrcholem B na přímce p a úhlopříčkou AC rovnoběžnou s přímkou p.',
        dane: { body: { S }, primky: [Object.assign({ nazev: 'p' }, primka(Bb, u))] },
        hledane: ['A', 'B', 'C', 'D'], reseni: [{ A, B: Bb, C, D }], pomocne: [],
        postup: [
          { text: 'Úhlopříčky čtverce jsou na sebe kolmé. AC je rovnoběžná s p, takže úhlopříčka BD je kolmá k p a prochází středem S. B je pata kolmice z S na přímku p.', tvary: [P({ p: S, q: Bb }), B(Bb, 'B')] },
          { text: 'Úhlopříčky jsou shodné a půlí se: D je souměrný s B podle S, |SD| = |SB|.', tvary: [K(S, rr), B(D, 'D')] },
          { text: 'AC leží na rovnoběžce s p bodem S a |SA| = |SC| = |SB|. Kružnice protne rovnoběžku ve vrcholech A, C. Dorýsujte čtverec.', tvary: [P({ p: S, q: secti(S, u) }), B(A, 'A'), B(C, 'C')].concat(strany([A, Bb, C, D])) },
        ],
        napovedy: ['Jak spolu svírají úhel úhlopříčky čtverce? Kudy proto vede úhlopříčka BD, když AC je rovnoběžná s p?',
          'B je pata kolmice z S na p. D je souměrný s B podle S. A, C leží na rovnoběžce s p bodem S ve vzdálenosti |SB| od S.',
          'Vrcholy A, B, C, D jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  /* ── 85) Čtverec ABCD: střed S a přímka p ∥ AC vedená vrcholem B (CZVV ilustrační 2015, ú. 9, 2 b.) ──
     JEDINÁ úloha z archivu, jejímž výsledkem je kromě bodu i PŘÍMKA: `hledanePrimky` hodnotí G.vzdalHledanePrimky
     (stejné tolerance jako u bodů). Dvě stejně dobrá provedení: nástrojem Rovnoběžka, nebo kolmicí k BD v bodě B
     (úhlopříčky čtverce jsou na sebe kolmé). */
  function ctverecStredRovnobezka() {
    for (let g = 0; g < 600; g++) {
      const S = bod(nah(140, 260), nah(110, 190)), w = nasob(smer(nah(0, 2 * Math.PI)), nah(50, 80));
      const A = odecti(S, w), C = secti(S, w), Bb = secti(S, rot(w)), D = odecti(S, rot(w)), vse = [S, A, Bb, C, D];
      const l = { nazev: 'p', p: Bb, q: secti(Bb, w) }, kon = G.oriznoutNaOkno(l.p, l.q, 20);
      // přímka musí mít v okně dost místa, aby šla narýsovat; body od sebe aspoň 36 (jedna značka nesmí trefit dva)
      if (!vsechnyUvnitr(vse) || !kon || vzdal(kon.p, kon.q) < 200 || !rozestup(vse, 36)) continue;
      return {
        typ: 'ctverecStredRovnobezka', nazev: 'Čtverec — střed S, rovnoběžka s AC',
        text: 'Je dán čtverec ABCD. Sestrojte jeho střed S a vrcholem B veďte přímku p rovnoběžnou s úhlopříčkou AC.',
        dane: { body: { A, B: Bb, C, D }, mnohouhelniky: [['A', 'B', 'C', 'D']] },
        hledane: ['S'], reseni: [{ S }], hledanePrimky: [{ nazev: 'p', p: l.p, q: l.q }], pomocne: [],
        postup: [
          { text: 'Střed čtverce je průsečík jeho úhlopříček. Narýsujte úhlopříčky AC a BD; průsečík je střed S.', tvary: [U(A, C), U(Bb, D), B(S, 'S')] },
          { text: 'Přímka p vede bodem B rovnoběžně s AC (nástroj Rovnoběžka). Jde to i kolmicí: úhlopříčky čtverce jsou na sebe kolmé, takže kolmice k BD v bodě B je rovnoběžná s AC.', tvary: [P(l)] },
        ],
        napovedy: ['Kde se čtverci protínají úhlopříčky? Střed je jejich průsečík.',
          'Úhlopříčky AC a BD se protnou ve středu S. Přímka p má stejný směr jako AC a prochází bodem B — rovnoběžka, nebo kolmice k BD v bodě B.',
          'Střed S a přímka p jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  /* ════════ Typy 81–85: doplněné po vypuštění Thaletovy kružnice a kružnice opsané (specifikace 2026/2027) ════════
     Vystačí si s osou úsečky, kružnicí, rovnoběžkami v dané vzdálenosti a kolmicí — nástroji, které
     jsou ve specifikaci výslovně. Pět typů nahrazuje pět vypuštěných (tři na pozici 9, dva na pozici 10). */

  // Osa úsečky XY dvěma kružnicemi o poloměru r0; r0 se volí tak, aby pomocné body P, Q nepadly na jiné body (min. 25)
  function osaProKroky(X, Y, ostatni) {
    const c = vzdal(X, Y);
    for (const k of [0.7, 0.85, 1, 1.2, 0.6]) {
      const r0 = k * c, PQ = G.prusecikyKK(X, r0, Y, r0);
      if (PQ.length === 2 && rozestup([X, Y].concat(ostatni, PQ), 25)) return { r0, PQ };
    }
    return null;
  }

  // ── 81) Rovnoramenný trojúhelník: základna AB a rameno délky r → osa AB ∩ kružnice k(A; r) (2 řešení) ──
  function rovnoramennyRameno() {
    for (let g = 0; g < 400; g++) {
      const rcm = vyber([3, 3.5, 4]), r = rcm * CM;
      const A = bod(nah(60, 150), nah(110, 190)), uAB = smer(nah(-0.5, 0.5)), c = r * nah(0.9, 1.5), Bb = secti(A, nasob(uAB, c));
      const M = stred(A, Bb), n = bod(-uAB.y, uAB.x), h = Math.sqrt(r * r - c * c / 4);
      const C1 = secti(M, nasob(n, h)), C2 = secti(M, nasob(n, -h));
      if (h < 40 || ![A, Bb, C1, C2].every(x => uvnitr(x)) || !rozestup([A, Bb, C1, C2, M], 30)) continue;
      const os = osaProKroky(A, Bb, [C1, C2]);
      if (!os) continue;
      return {
        typ: 'rovnoramennyRameno', nazev: 'Rovnoramenný trojúhelník — rameno dané délky',
        text: 'Jsou dány body A a B. Sestrojte všechny body C, pro které je trojúhelník ABC rovnoramenný se základnou AB a rameny dlouhými ' + cm(rcm) + '. Najděte všechna řešení.',
        dane: { body: { A, B: Bb }, usecky: [{ p: A, q: Bb }] },
        hledane: ['C'], reseni: [{ C: C1 }, { C: C2 }], pomocne: [M].concat(os.PQ), polomer: rcm,
        postup: [
          { text: 'Vrchol C rovnoramenného trojúhelníku se základnou AB je stejně daleko od A i B, leží tedy na ose úsečky AB. Narýsujte ji (dvě kružnice o stejném poloměru ze středů A a B).', tvary: [K(A, os.r0), K(Bb, os.r0), P({ p: os.PQ[0], q: os.PQ[1] })] },
          { text: 'Rameno AC má délku ' + cm(rcm) + ': narýsujte kružnici k se středem A a poloměrem ' + cm(rcm) + '.', tvary: [K(A, r)] },
          { text: 'Průsečíky kružnice k s osou jsou hledané vrcholy C₁ a C₂. Úloha má dvě řešení.', tvary: [B(C1, 'C₁'), B(C2, 'C₂'), U(A, C1), U(Bb, C1), U(A, C2), U(Bb, C2)] },
        ],
        napovedy: ['Vrchol C je stejně daleko od A i B. Na které přímce leží všechny takové body, a jak od A zjistíte vzdálenost ' + cm(rcm) + '?',
          'Sestrojte osu úsečky AB a kružnici se středem A a poloměrem ' + cm(rcm) + '; hledejte jejich průsečíky.',
          'Řešení jsou dvě: body C₁ a C₂, kde kružnice protíná osu. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 82) Osa úsečky AB a kružnice k(S; r) → 2 řešení ──
  function osaKruznice() {
    for (let g = 0; g < 400; g++) {
      const rcm = vyber([2.5, 3, 3.5]), r = rcm * CM;
      const A = bod(nah(50, 130), nah(70, 230)), uAB = smer(nah(-0.9, 0.9)), Bb = secti(A, nasob(uAB, nah(110, 170)));
      const M = stred(A, Bb), n = bod(-(Bb.y - A.y) / vzdal(A, Bb), (Bb.x - A.x) / vzdal(A, Bb)), u = jednot(odecti(Bb, A));
      const dS = r * nah(0.3, 0.75) * vyber([-1, 1]), t = nah(-50, 50);
      const S = secti(secti(M, nasob(n, t)), nasob(u, dS));
      const X = G.prusecikyPK(M, secti(M, n), S, r);
      if (X.length !== 2 || ![A, Bb, S, X[0], X[1]].every(x => uvnitr(x)) || vzdal(X[0], X[1]) < 50) continue;
      if (X.some(x => Math.min(vzdal(x, A), vzdal(x, Bb)) < 40)) continue;
      const os = osaProKroky(A, Bb, X.concat([S]));
      if (!os) continue;
      return {
        typ: 'osaKruznice', nazev: 'Osa úsečky a kružnice',
        text: 'Jsou dány body A, B a S. Sestrojte všechny body X, které mají od bodů A a B stejnou vzdálenost a od bodu S vzdálenost ' + cm(rcm) + '. Najděte všechna řešení.',
        dane: { body: { A, B: Bb, S } },
        hledane: ['X'], reseni: [{ X: X[0] }, { X: X[1] }], pomocne: [M].concat(os.PQ), polomer: rcm,
        postup: [
          { text: 'Body se stejnou vzdáleností od A a B leží na ose úsečky AB. Narýsujte ji (dvě kružnice o stejném poloměru ze středů A a B).', tvary: [K(A, os.r0), K(Bb, os.r0), P({ p: os.PQ[0], q: os.PQ[1] })] },
          { text: 'Body ve vzdálenosti ' + cm(rcm) + ' od S leží na kružnici k se středem S a poloměrem ' + cm(rcm) + '.', tvary: [K(S, r)] },
          { text: 'Průsečíky kružnice k s osou jsou hledané body X₁ a X₂. Úloha má dvě řešení.', tvary: [B(X[0], 'X₁'), B(X[1], 'X₂')] },
        ],
        napovedy: ['Kde leží všechny body se stejnou vzdáleností od A a B, a kde všechny body ve vzdálenosti ' + cm(rcm) + ' od S?',
          'Sestrojte osu úsečky AB a kružnici se středem S a poloměrem ' + cm(rcm) + '; hledejte jejich průsečíky.',
          'Řešení jsou dvě: body X₁ a X₂, kde kružnice protíná osu. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 83) Dvě rovnoběžky s p ve vzdálenosti d a kružnice k(S; r) → 4 řešení ──
  function rovnobezkaKruznice() {
    for (let g = 0; g < 400; g++) {
      const dcm = vyber([1, 1.5]), rcm = vyber([3, 3.5]), d = dcm * CM, r = rcm * CM;
      const S = bod(nah(110, 290), nah(110, 190)), uP = smer(nah(-0.6, 0.6)), nP = bod(-uP.y, uP.x);
      const s = r * nah(0.15, 0.4) * vyber([-1, 1]);                                  // vzdálenost S od přímky p (se znaménkem)
      const F0 = secti(S, nasob(nP, -s)), p = primka(F0, uP);
      const F = secti(F0, nasob(uP, nah(112, 135) * (S.x < W / 2 ? 1 : -1)));  // bod p, ve kterém se vede kolmice: za koncem tětiv, ať K a L nepadnou na X
      const K1 = secti(F, nasob(nP, d)), K2 = secti(F, nasob(nP, -d));
      const X = [].concat(G.prusecikyPK(K1, secti(K1, uP), S, r), G.prusecikyPK(K2, secti(K2, uP), S, r));
      if (X.length !== 4 || !X.every(x => uvnitr(x)) || !uvnitr(S) || !rozestup(X.concat([S, F, K1, K2]), 36)) continue;
      return {
        typ: 'rovnobezkaKruznice', nazev: 'Vzdálenost od přímky a od bodu',
        text: 'Jsou dány přímka p a bod S. Sestrojte všechny body X, které mají od přímky p vzdálenost ' + cm(dcm) + ' a od bodu S vzdálenost ' + cm(rcm) + '. Najděte všechna řešení.',
        dane: { body: { S }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['X'], reseni: X.map(x => ({ X: x })), pomocne: [F, K1, K2], vzdalenost: dcm, polomer: rcm,
        postup: [
          { text: 'V libovolném bodě F přímky p vedte kolmici k p a naneste na ni od p ' + cm(dcm) + ' na obě strany: dostanete body K a L.', tvary: [B(F, 'F'), P({ p: K1, q: K2 }), B(K1, 'K'), B(K2, 'L')] },
          { text: 'Body K a L veďte rovnoběžky s přímkou p. Všechny body ve vzdálenosti ' + cm(dcm) + ' od p leží na nich.', tvary: [P({ p: K1, q: secti(K1, uP) }), P({ p: K2, q: secti(K2, uP) })] },
          { text: 'Body ve vzdálenosti ' + cm(rcm) + ' od S leží na kružnici k se středem S a poloměrem ' + cm(rcm) + '.', tvary: [K(S, r)] },
          { text: 'Kružnice k protíná každou rovnoběžku ve dvou bodech: hledané body X₁ až X₄. Úloha má čtyři řešení.', tvary: X.map((x, i) => B(x, 'X' + '₁₂₃₄'[i])) },
        ],
        napovedy: ['Kde leží všechny body ve vzdálenosti ' + cm(dcm) + ' od přímky p (pozor, jsou to dvě přímky) a kde všechny body ve vzdálenosti ' + cm(rcm) + ' od S?',
          'Sestrojte obě rovnoběžky s p ve vzdálenosti ' + cm(dcm) + ' a kružnici se středem S a poloměrem ' + cm(rcm) + '; hledejte jejich průsečíky.',
          'Řešení jsou čtyři: kružnice protíná každou z rovnoběžek ve dvou bodech. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 84) Kolmice z bodu C na p a body X na ní ve vzdálenosti d od p → 2 řešení ──
  function kolmiceVzdalenost() {
    for (let g = 0; g < 400; g++) {
      const dcm = vyber([1.5, 2, 2.5]), d = dcm * CM;
      const F = bod(nah(120, 280), nah(110, 190)), uP = smer(nah(-0.6, 0.6)), nP = bod(-uP.y, uP.x);
      const hC = nah(55, 100) * vyber([-1, 1]), C = secti(F, nasob(nP, hC)), p = primka(secti(F, nasob(uP, nah(-50, 50))), uP);
      const Pt = G.pata(C, p.p, p.q), X1 = secti(Pt, nasob(nP, d)), X2 = secti(Pt, nasob(nP, -d));
      if (![C, Pt, X1, X2].every(x => uvnitr(x)) || Math.abs(Math.abs(hC) - d) < 40 || !rozestup([C, Pt, X1, X2], 30)) continue;
      return {
        typ: 'kolmiceVzdalenost', nazev: 'Kolmice a vzdálenost od přímky',
        text: 'Je dána přímka p a bod C, který na ní neleží. Sestrojte všechny body X, které leží na kolmici k přímce p vedené bodem C a mají od přímky p vzdálenost ' + cm(dcm) + '. Najděte všechna řešení.',
        dane: { body: { C }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['X'], reseni: [{ X: X1 }, { X: X2 }], pomocne: [Pt], vzdalenost: dcm,
        postup: [
          { text: 'Bodem C veďte kolmici k přímce p; protne ji v bodě F.', tvary: [P({ p: C, q: Pt }), B(Pt, 'F')] },
          { text: 'Narýsujte kružnici se středem F a poloměrem ' + cm(dcm) + '. Body kolmice ve vzdálenosti ' + cm(dcm) + ' od přímky p leží na ní.', tvary: [K(Pt, d)] },
          { text: 'Průsečíky kružnice s kolmicí jsou hledané body X₁ a X₂. Úloha má dvě řešení (na každé straně od p jedno).', tvary: [B(X1, 'X₁'), B(X2, 'X₂')] },
        ],
        napovedy: ['Vzdálenost bodu od přímky se měří po kolmici. Jak z bodu C vést kolmici k p a kam na ni naneseš ' + cm(dcm) + '?',
          'Veďte kolmici bodem C k přímce p, označte patu F a z F odměřte kružítkem ' + cm(dcm) + ' na obě strany.',
          'Řešení jsou dvě: body X₁ a X₂ na kolmici. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 85) Osa úsečky AB a rovnoběžky s p ve vzdálenosti d → 2 řešení ──
  function osaRovnobezka() {
    for (let g = 0; g < 400; g++) {
      const dcm = vyber([1, 1.5, 2]), d = dcm * CM;
      const A = bod(nah(50, 130), nah(70, 230)), uAB = smer(nah(-0.9, 0.9)), Bb = secti(A, nasob(uAB, nah(110, 170)));
      const M = stred(A, Bb), u = jednot(odecti(Bb, A)), n = bod(-u.y, u.x);
      const up = smer(nah(0, Math.PI));
      if (Math.abs(up.x * n.x + up.y * n.y) > Math.cos(0.7)) continue;               // p není (skoro) rovnoběžná s osou
      const p = primka(bod(nah(120, 300), nah(80, 220)), up), np = bod(-up.y, up.x);
      const K1 = secti(p.p, nasob(np, d)), K2 = secti(p.p, nasob(np, -d));
      const X1 = G.prusecikPP(M, secti(M, n), K1, secti(K1, up)), X2 = G.prusecikPP(M, secti(M, n), K2, secti(K2, up));
      if (!X1 || !X2 || ![A, Bb, X1, X2].every(x => uvnitr(x)) || vzdal(X1, X2) < 50) continue;
      if ([X1, X2].some(x => Math.min(vzdal(x, A), vzdal(x, Bb)) < 40)) continue;
      const os = osaProKroky(A, Bb, [X1, X2, K1, K2]);
      if (!os) continue;
      return {
        typ: 'osaRovnobezka', nazev: 'Osa úsečky a rovnoběžky',
        text: 'Jsou dány body A, B a přímka p. Sestrojte všechny body X, které mají od bodů A a B stejnou vzdálenost a od přímky p vzdálenost ' + cm(dcm) + '. Najděte všechna řešení.',
        dane: { body: { A, B: Bb }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['X'], reseni: [{ X: X1 }, { X: X2 }], pomocne: [M, K1, K2].concat(os.PQ), vzdalenost: dcm,
        postup: [
          { text: 'Body se stejnou vzdáleností od A a B leží na ose úsečky AB. Narýsujte ji (dvě kružnice o stejném poloměru ze středů A a B).', tvary: [K(A, os.r0), K(Bb, os.r0), P({ p: os.PQ[0], q: os.PQ[1] })] },
          { text: 'Na kolmici k přímce p naneste ' + cm(dcm) + ' na obě strany od p (body K a L) a bodem K i L veďte rovnoběžku s p.', tvary: [B(K1, 'K'), B(K2, 'L'), P({ p: K1, q: secti(K1, up) }), P({ p: K2, q: secti(K2, up) })] },
          { text: 'Průsečíky osy s oběma rovnoběžkami jsou hledané body X₁ a X₂. Úloha má dvě řešení.', tvary: [B(X1, 'X₁'), B(X2, 'X₂')] },
        ],
        napovedy: ['Kde leží body se stejnou vzdáleností od A a B, a kde body ve vzdálenosti ' + cm(dcm) + ' od přímky p (jsou to dvě přímky)?',
          'Sestrojte osu úsečky AB a obě rovnoběžky s p ve vzdálenosti ' + cm(dcm) + '; hledejte jejich průsečíky.',
          'Řešení jsou dvě: body X₁ a X₂, kde osa protíná rovnoběžky. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  /* ════════ Typy 86–89: za čtyři typy, které ve specifikaci 2026/2027 vyžadovaly Thaletovu kružnici nebo kružnici
     opsanou trojúhelníku (obdelnikStrana, pravouhlyStrana, pravouhlyLichKruz, obdelnikOpsanaM) ════════
     Stejné útvary (obdélník, pravoúhlý trojúhelník, pravoúhlý a rovnoramenný lichoběžník), ale jen s kolmicí,
     rovnoběžkou, osou úsečky a kružnicí o daném poloměru. */

  // ── 86) Obdélník ABCD: strana BC leží na přímce p a má danou délku, AB je kolmá k p → 2 řešení ──
  function obdelnikStranaP() {
    for (let g = 0; g < 600; g++) {
      const ccm = vyber([2, 2.5, 3]), c = ccm * CM;
      const F = bod(nah(120, 280), nah(110, 190)), uP = smer(nah(-0.6, 0.6)), nP = rot(uP);
      const A = secti(F, nasob(nP, nah(60, 100) * vyber([-1, 1]))), p = primka(secti(F, nasob(uP, nah(-50, 50))), uP);
      const Bb = pata(A, p.p, p.q), C1 = secti(Bb, nasob(uP, c)), C2 = secti(Bb, nasob(uP, -c));
      const D1 = secti(A, odecti(C1, Bb)), D2 = secti(A, odecti(C2, Bb));
      if (!vsechnyUvnitr([A, Bb, C1, C2, D1, D2]) || !rozestup([A, Bb, C1, C2, D1, D2], 36)) continue;
      return {
        typ: 'obdelnikStranaP', nazev: 'Obdélník — strana na přímce',
        text: 'Je dána přímka p a bod A, který na ní neleží. Sestrojte všechny obdélníky ABCD, jejichž strana BC leží na přímce p a má délku ' + cm(ccm) + '. Najděte všechna řešení.',
        dane: { body: { A }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'C', 'D'], reseni: [{ B: Bb, C: C1, D: D1 }, { B: Bb, C: C2, D: D2 }], pomocne: [],
        postup: [
          { text: 'Strana AB je kolmá ke straně BC, která leží na p. Bodem A veďte kolmici k přímce p; protne ji v bodě B.', tvary: [P({ p: A, q: Bb }), B(Bb, 'B')] },
          { text: 'Strana BC má délku ' + cm(ccm) + ': narýsujte kružnici se středem B a poloměrem ' + cm(ccm) + '. Protne přímku p v bodech C₁ a C₂.', tvary: [K(Bb, c), B(C1, 'C₁'), B(C2, 'C₂')] },
          { text: 'Vrchol D doplní obdélník: strana AD je rovnoběžná s BC a stejně dlouhá. Úloha má dvě řešení.', tvary: [B(D1, 'D₁'), B(D2, 'D₂')].concat(strany([A, Bb, C1, D1]), strany([A, Bb, C2, D2])) },
        ],
        napovedy: ['Strany obdélníku na sebe navazují v pravém úhlu. Kudy vede strana AB, když strana BC leží na přímce p?',
          'Bodem A veďte kolmici k p (pata je bod B) a od B naneste na p vzdálenost ' + cm(ccm) + ' na obě strany.',
          'Řešení jsou dvě: C leží na p buď na jednu, nebo na druhou stranu od B. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 87) Pravoúhlý trojúhelník ABC s pravým úhlem při C: přepona AB na přímce p, |AC| dané → 2 řešení ──
  function pravouhlyPrepona() {
    for (let g = 0; g < 1500; g++) {
      const dcm = vyber([2.5, 3, 3.5]), d = dcm * CM;
      const F = bod(nah(130, 270), nah(110, 190)), uP = smer(nah(-0.6, 0.6)), nP = rot(uP);
      const C = secti(F, nasob(nP, nah(55, 85) * vyber([-1, 1]))), p = primka(secti(F, nasob(uP, nah(-40, 40))), uP);
      const Pt = pata(C, p.p, p.q), hh = vzdal(C, Pt);
      if (d < hh + 15) continue;
      const s = Math.sqrt(d * d - hh * hh), t = hh * hh / s;                  // |PtA| = s, |PtB| = h²/s (Euklidova věta o výšce)
      const A1 = secti(Pt, nasob(uP, s)), A2 = secti(Pt, nasob(uP, -s)), B1 = secti(Pt, nasob(uP, -t)), B2 = secti(Pt, nasob(uP, t));
      if (s < 40 || !vsechnyUvnitr([C, A1, A2, B1, B2]) || !rozestup([C, A1, A2, B1, B2], 36)) continue;
      return {
        typ: 'pravouhlyPrepona', nazev: 'Pravoúhlý trojúhelník — přepona na přímce',
        text: 'Je dána přímka p a bod C, který na ní neleží. Sestrojte všechny pravoúhlé trojúhelníky ABC s pravým úhlem při vrcholu C, jejichž přepona AB leží na přímce p a odvěsna AC má délku ' + cm(dcm) + '. Najděte všechna řešení.',
        dane: { body: { C }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['A', 'B'], reseni: [{ A: A1, B: B1 }, { A: A2, B: B2 }], pomocne: [],
        postup: [
          { text: 'Vrchol A leží na přímce p a je od bodu C vzdálen ' + cm(dcm) + ': narýsujte kružnici se středem C a poloměrem ' + cm(dcm) + '. Protne přímku p v bodech A₁ a A₂.', tvary: [K(C, d), B(A1, 'A₁'), B(A2, 'A₂')] },
          { text: 'Pravý úhel při C: v bodě C veďte kolmici k přímce CA₁ (a k přímce CA₂). Každá z nich protne přímku p ve vrcholu B (B₁, B₂).', tvary: [P({ p: C, q: B1 }), P({ p: C, q: B2 }), B(B1, 'B₁'), B(B2, 'B₂')] },
          { text: 'Přepona AB leží na přímce p. Úloha má dvě řešení: trojúhelníky A₁B₁C a A₂B₂C.', tvary: strany([A1, B1, C]).concat(strany([A2, B2, C])) },
        ],
        napovedy: ['Kde leží body A, které jsou od C vzdáleny ' + cm(dcm) + ' a zároveň leží na přímce p? A jak najdete vrchol B, víte-li, že úhel ACB je pravý?',
          'Narýsujte kružnici se středem C a poloměrem ' + cm(dcm) + '; její průsečíky s p jsou body A. V bodě C veďte kolmici k CA — protne p v bodě B.',
          'Řešení jsou dvě: A₁B₁C a A₂B₂C. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 88) Pravoúhlý lichoběžník ABCD s pravými úhly při A a D: dány A, D, |AB| a |BC|; vrchol B v polorovině bodu Q → 2 řešení ──
  function pravouhlyLichBC() {
    for (let g = 0; g < 2500; g++) {
      const bcm = vyber([3.5, 4]), ccm = vyber([3.5, 4]), b = bcm * CM, c = ccm * CM;
      const A = bod(nah(60, 300), nah(50, 250)), u = smer(nah(0, 2 * Math.PI)), l = nah(85, 118);
      if (c * c - l * l < 900) continue;                                      // k ≥ 30: obě řešení od sebe aspoň 60
      const D = secti(A, nasob(u, l)), n = rot(u), k = Math.sqrt(c * c - l * l);
      if (b - k < 45) continue;                                               // kratší základna CD aspoň 45
      const Bb = secti(A, nasob(n, b)), C1 = secti(D, nasob(n, b + k)), C2 = secti(D, nasob(n, b - k));
      const Q = secti(secti(A, nasob(u, l / 2)), nasob(n, nah(45, 75)));
      const vse = [A, D, Bb, C1, C2, Q];
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 30)) continue;
      return {
        typ: 'pravouhlyLichBC', nazev: 'Pravoúhlý lichoběžník — rameno BC',
        text: 'Jsou dány body A, D a Q. Sestrojte všechny pravoúhlé lichoběžníky ABCD se základnami AB a CD a s pravými úhly při vrcholech A a D, pro které platí |AB| = ' + cm(bcm) + ', |BC| = ' + cm(ccm) + ' a vrchol B leží v téže polorovině s hraniční přímkou AD jako bod Q. Najděte všechna řešení.',
        dane: { body: { A, D, Q } },
        hledane: ['B', 'C'], reseni: [{ B: Bb, C: C1 }, { B: Bb, C: C2 }], pomocne: [],
        postup: [
          { text: 'Základna AB je kolmá k rameni AD: v bodě A veďte kolmici k přímce AD na stranu bodu Q a naneste na ni ' + cm(bcm) + ' — vrchol B.', tvary: [P({ p: A, q: Bb }), K(A, b), B(Bb, 'B')] },
          { text: 'Základna CD je rovnoběžná s AB: bodem D veďte rovnoběžku s AB (kolmici k AD).', tvary: [P({ p: D, q: secti(D, n) })] },
          { text: 'Rameno BC má délku ' + cm(ccm) + ': narýsujte kružnici se středem B a poloměrem ' + cm(ccm) + '. Protne rovnoběžku v bodech C₁ a C₂.', tvary: [K(Bb, c), B(C1, 'C₁'), B(C2, 'C₂')] },
          { text: 'Úloha má dvě řešení: lichoběžníky ABC₁D a ABC₂D.', tvary: strany([A, Bb, C1, D]).concat(strany([A, Bb, C2, D])) },
        ],
        napovedy: ['Pravé úhly při A a D znamenají, že základny jsou kolmé k rameni AD. Kam z bodu A naneseš základnu AB a kudy vede základna CD?',
          'Kolmici k AD v bodě A veďte na stranu bodu Q, naneste ' + cm(bcm) + ' (bod B) a bodem D veďte rovnoběžku s AB. Vrchol C leží na ní a od B je vzdálen ' + cm(ccm) + '.',
          'Řešení jsou dvě: kružnice se středem B protíná rovnoběžku ve dvou bodech C₁ a C₂. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  // ── 89) Rovnoramenný lichoběžník ABCD: dány A, B, výška a délka základny CD → 2 řešení ──
  function rovnoramennyLichVyska() {
    for (let g = 0; g < 1500; g++) {
      const vcm = vyber([2, 2.5, 3]), ccm = vyber([2, 2.5, 3]), v = vcm * CM, c = ccm * CM;
      const A = bod(nah(60, 150), nah(90, 210)), uAB = smer(nah(-0.6, 0.6)), a = nah(120, 170), Bb = secti(A, nasob(uAB, a));
      if (Math.abs(a - c) < 30) continue;
      const M = stred(A, Bb), n = rot(uAB);
      const E1 = secti(M, nasob(n, v)), E2 = secti(M, nasob(n, -v));
      const C1 = secti(E1, nasob(uAB, c / 2)), D1 = secti(E1, nasob(uAB, -c / 2)), C2 = secti(E2, nasob(uAB, c / 2)), D2 = secti(E2, nasob(uAB, -c / 2));
      if (!vsechnyUvnitr([A, Bb, E1, E2, C1, D1, C2, D2])) continue;
      const os = osaProKroky(A, Bb, [E1, E2, C1, D1, C2, D2]);
      if (!os || !rozestup([A, Bb, C1, D1, C2, D2, E1, E2], 30)) continue;
      return {
        typ: 'rovnoramennyLichVyska', nazev: 'Rovnoramenný lichoběžník — výška a základna',
        text: 'Jsou dány body A a B. Sestrojte všechny rovnoramenné lichoběžníky ABCD se základnami AB a CD, jejichž výška je ' + cm(vcm) + ' a základna CD má délku ' + cm(ccm) + '. Najděte všechna řešení.',
        dane: { body: { A, B: Bb }, usecky: [{ p: A, q: Bb }] },
        hledane: ['C', 'D'], reseni: [{ C: C1, D: D1 }, { C: C2, D: D2 }], pomocne: [M, E1, E2].concat(os.PQ),
        postup: [
          { text: 'Rovnoramenný lichoběžník je souměrný podle osy základny AB. Narýsujte ji (dvě kružnice o stejném poloměru ze středů A a B); střed úsečky AB označte M.', tvary: [K(A, os.r0), K(Bb, os.r0), P({ p: os.PQ[0], q: os.PQ[1] }), B(M, 'M')] },
          { text: 'Základna CD leží na rovnoběžce s AB ve vzdálenosti ' + cm(vcm) + ': od M naneste na osu ' + cm(vcm) + ' na obě strany (body E₁, E₂) a bodem E₁ i E₂ veďte rovnoběžku s AB.', tvary: [K(M, v), B(E1, 'E₁'), B(E2, 'E₂'), P({ p: E1, q: secti(E1, uAB) }), P({ p: E2, q: secti(E2, uAB) })] },
          { text: 'Základna CD je souměrná podle osy: od E₁ (E₂) naneste na rovnoběžku polovinu základny, ' + cm(ccm / 2) + ', na obě strany — dostanete vrcholy C a D. Úloha má dvě řešení.', tvary: [K(E1, c / 2), K(E2, c / 2), B(C1, 'C₁'), B(D1, 'D₁'), B(C2, 'C₂'), B(D2, 'D₂')].concat(strany([A, Bb, C1, D1]), strany([A, Bb, C2, D2])) },
        ],
        napovedy: ['Rovnoramenný lichoběžník je souměrný podle osy základny. Kde leží střed základny CD a v jaké vzdálenosti od AB?',
          'Narýsujte osu AB, na ní od středu M naneste ' + cm(vcm) + ' na obě strany a bodem veďte rovnoběžku s AB. Od osy odměřte na rovnoběžku ' + cm(ccm / 2) + ' na obě strany.',
          'Řešení jsou dvě: lichoběžník nad a pod přímkou AB. V okně je teď vidíte.'],
      };
    }
    return null;
  }

  const GENERATORY = { osa, kruznice, vyska, soumernost, rovnobeznik, obdelnik, ctverec, kosoctverec, lichobeznik, teznice, rovnoramenny,
    stredova, osauhlu, vysky, obdelnikUhl, obdelnikM, lichobeznikZakl, rovnoramennyOsa, ctverecUhl, vcTc,
    kosoctverecOsa, teziste, rovnoramennyKruz, pravouhlyLich, osaStrany, sestiuhelnik, stredyStran, lichobeznikTri, obdelnikSp, rovnoramennyZakl,
    rovnoramennyUhel, uhelOsaStrany, rovnobeznikUhel, pravouhlyUhel, lichobeznikUhel, tupyUhelVyska,
    rovnoramennyStred, obdelnikKolmice, trojuhelnikRozdil, pravouhlyRovnoramenny, obdelnikOpsana, sestiuhelnikOsa, rovnobeznikUhlopricka, rovnoramennyTc,
    rovnoramennyVyskaM, rovnobeznikStred, rovnostrannyOsa, obdelnikAE, rovnoramennyKruzP, rovnoramennyVyskaC,
    rovnostrannyStred, rovnoramennyStredQ, rovnoramennyOsaQ, obdelnikRovnobezky, rovnobeznikRovnobezkaP, trojuhelnikOsy,
    rovnoramennyDvojnasobek, obdelnikCDCS, pravouhlyRovnoramennyX, rovnobeznikVyskaBD, ctverecPolorovina, lichobeznikKolmeUhl, rovnobeznikDvojnasobek, lichobeznikKruzAC,
    pravouhlyLichAC, obdelnikDvePrimky, ctverecTriBody,
    kosoctverecVyska, lichobeznikKruzCD, lichobeznikTrojnasobek, ctverecKruzP, rovnoramennyPrimkaA, rovnoramennyPoloprimka, rovnoramennyZaklQ, ctverecStredP, ctverecStredRovnobezka,
    rovnoramennyRameno, osaKruznice, rovnobezkaKruznice, kolmiceVzdalenost, osaRovnobezka,
    obdelnikStranaP, pravouhlyPrepona, pravouhlyLichBC, rovnoramennyLichVyska };
  const TYPY = Object.keys(GENERATORY);
  /* Úlohy 9 a 10 testu nanečisto. V ostrých testech 2019–2026 jsou obě VŽDY
     konstrukce za 2 nebo 3 body; tříbodové bývají „najděte všechna řešení"
     nebo útvar o víc krocích, dvoubodové útvar s jedním řešením. Úlohy na
     jediný bod (osa, kružnice, rovnoběžník) zůstávají pro procvičování. Sady
     jsou disjunktní, takže test nikdy nedá dvakrát týž typ. Úlohy s úhlem ve
     stupních z M9 jdou na tutéž pozici jako v ostrém testu (2019–2022 ú. 9,
     2023 ú. 10); ty z M7 zůstávají pro procvičování. */
  const PRO_TEST = {
    9: ['obdelnik', 'teznice', 'rovnoramenny', 'vyska', 'lichobeznik', 'vysky', 'obdelnikUhl', 'rovnoramennyOsa',
      'teziste', 'rovnoramennyKruz', 'osaStrany', 'stredyStran', 'lichobeznikTri',
      'rovnoramennyUhel', 'uhelOsaStrany', 'rovnobeznikUhel', 'rovnoramennyStred', 'trojuhelnikRozdil', 'pravouhlyRovnoramenny', 'rovnoramennyTc', 'sestiuhelnikOsa',
      'rovnoramennyVyskaM', 'rovnostrannyOsa', 'rovnoramennyKruzP', 
      'rovnostrannyStred', 'rovnoramennyStredQ',
      'rovnoramennyDvojnasobek', 'pravouhlyRovnoramennyX', 'ctverecPolorovina', 'rovnobeznikDvojnasobek',
      'pravouhlyLichAC', 'obdelnikDvePrimky', 'ctverecTriBody',
      'kosoctverecVyska', 'rovnoramennyPrimkaA', 'rovnoramennyZaklQ',
      'rovnoramennyRameno', 'osaKruznice', 'rovnobezkaKruznice',
      'obdelnikStranaP', 'pravouhlyPrepona', 'pravouhlyLichBC'],
    10: ['ctverec', 'kosoctverec', 'soumernost', 'stredova', 'osauhlu', 'obdelnikM', 'lichobeznikZakl', 'ctverecUhl',
      'vcTc', 'kosoctverecOsa', 'pravouhlyLich', 'sestiuhelnik', 'obdelnikSp', 'rovnoramennyZakl', 'pravouhlyUhel', 'obdelnikKolmice', 'obdelnikOpsana',
      'rovnobeznikUhlopricka', 'rovnobeznikStred', 'obdelnikAE', 'rovnoramennyVyskaC',
      'rovnoramennyOsaQ', 'obdelnikRovnobezky', 'rovnobeznikRovnobezkaP', 'trojuhelnikOsy',
      'obdelnikCDCS', 'rovnobeznikVyskaBD', 'lichobeznikKolmeUhl', 'lichobeznikKruzAC',
      'lichobeznikKruzCD', 'lichobeznikTrojnasobek', 'ctverecKruzP', 'rovnoramennyPoloprimka', 'ctverecStredP', 'ctverecStredRovnobezka',
      'kolmiceVzdalenost', 'osaRovnobezka', 'rovnoramennyLichVyska'],
  };
  function proTest(cislo) {
    const typy = PRO_TEST[cislo];
    if (!typy) return null;
    for (let i = 0; i < 5; i++) {
      const u = GENERATORY[vyber(typy)]();
      if (u) { u.tol = 10; return u; }
    }
    return null;
  }
  // Nová úloha: daný typ, nebo náhodný (jiný než předchozí, ať se typy střídají)
  let posledni = null;
  function nova(typ) {
    const t = typ && GENERATORY[typ] ? typ : vyber(TYPY.filter(x => x !== posledni));
    posledni = t;
    const u = GENERATORY[t]();
    if (u) u.tol = 10;                  // ≈ 3 mm: náčrt od ruky, ne přesné rýsování
    return u;
  }
  window.PZ_KONSTRUKCE = { TYPY, GENERATORY, PRO_TEST, nova, proTest };
})();
