/* ══════════════════════════════════════════════════════════════════
   KONSTRUKČNÍ ÚLOHY — generátory podle ostrých testů (úlohy 9 a 10)

   V archivu 48 konstrukčních úloh M9 (2015–2026): nejčastěji úhel (25×),
   trojúhelník (23×), „najděte všechna řešení" (17×), souměrnost (7×),
   obdélník a rovnoběžník. Každý typ tady cvičí jednu množinu bodů, na
   které konstrukce stojí: Thaletovu kružnici, osu úsečky, kružnici,
   rovnoběžky v dané vzdálenosti, osovou souměrnost a rovnoběžník.

   Typy 7–12 jsou CELÉ ÚTVARY jako v ostrém testu (obdélník ze středu,
   čtverec, kosočtverec, lichoběžník podle osy, trojúhelník s těžnicí,
   rovnoramenný trojúhelník) — z nich a z trojúhelníků s pravým úhlem
   a s výškou se losují úlohy 9 a 10 testu nanečisto (`proTest`).
   Zadání jsou vlastní, ne opsaná z CERMATu, ale ve stejné stavbě.

   Úloha = { typ, nazev, text, dane, hledane, reseni[], pomocne[],
             postup[{text, tvary}], napovedy[3], tol }
   `reseni` jsou VŠECHNA řešení (každé = {jméno bodu: souřadnice});
   `pomocne` jsou body, které na papíře vzniknou cestou (střed úsečky,
   paty kolmic) — hodnocení je nepočítá jako body navíc.
   Čísla se losují, takže každý žák dostane jiné zadání.
   ══════════════════════════════════════════════════════════════════ */
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
  const strany = m => m.map((x, i) => U(x, m[(i + 1) % m.length]));      // obvod mnohoúhelníku
  /* Různé body aspoň `min` od sebe. Shodné body (sdílený vrchol dvou řešení)
     se nepočítají. Bez odstupu by jedna značka „trefila" dva hledané body
     a hodnocení by nerozlišilo, které řešení žák našel. */
  function rozestup(body, min) {
    for (let i = 0; i < body.length; i++) for (let j = i + 1; j < body.length; j++) {
      const d = vzdal(body[i], body[j]);
      if (d > 1e-6 && d < min) return false;
    }
    return true;
  }

  // ── 1) Pravý úhel při C → Thaletova kružnice nad AB ∩ přímka p (2 řešení) ──
  function thales() {
    for (let g = 0; g < 400; g++) {
      const A = bod(nah(50, 130), nah(110, 190)), Bb = bod(A.x + nah(140, 200), A.y + nah(-35, 35));
      const S = stred(A, Bb), r = vzdal(A, Bb) / 2;
      const n = smer(nah(0, Math.PI)), d = r * nah(0.25, 0.7) * vyber([-1, 1]);
      const p = primka(secti(S, nasob(n, d)), bod(-n.y, n.x));
      const X = G.prusecikyPK(p.p, p.q, S, r);
      if (X.length !== 2 || !X.every(x => uvnitr(x)) || !uvnitr(A) || !uvnitr(Bb)) continue;
      if (vzdal(X[0], X[1]) < 55 || X.some(x => Math.min(vzdal(x, A), vzdal(x, Bb)) < 40)) continue;
      return {
        typ: 'thales', nazev: 'Pravý úhel — Thaletova kružnice',
        text: 'Jsou dány body A, B a přímka p. Sestrojte všechny body C přímky p, pro které je trojúhelník ABC pravoúhlý s pravým úhlem při vrcholu C. Najděte všechna řešení.',
        dane: { body: { A, B: Bb }, primky: [Object.assign({ nazev: 'p' }, p)], usecky: [{ p: A, q: Bb }] },
        hledane: ['C'], reseni: [{ C: X[0] }, { C: X[1] }], pomocne: [S],
        postup: [
          { text: 'Najděte střed S úsečky AB.', tvary: [B(S, 'S')] },
          { text: 'Narýsujte Thaletovu kružnici k se středem S a poloměrem |SA|. Z každého jejího bodu je úsečka AB vidět pod pravým úhlem.', tvary: [K(S, r)] },
          { text: 'Průsečíky kružnice k s přímkou p jsou hledané vrcholy C₁ a C₂.', tvary: [B(X[0], 'C₁'), B(X[1], 'C₂')] },
          { text: 'Úloha má dvě řešení: trojúhelníky ABC₁ a ABC₂.', tvary: [U(A, X[0]), U(Bb, X[0]), U(A, X[1]), U(Bb, X[1])] },
        ],
        napovedy: ['Pravý úhel při vrcholu C: kde leží všechny body, ze kterých je úsečka AB vidět pod pravým úhlem?',
          'Sestrojte Thaletovu kružnici nad průměrem AB (střed je uprostřed AB) a hledejte její průsečíky s přímkou p.',
          'Řešení jsou dvě: body C₁ a C₂, kde Thaletova kružnice protíná přímku p. V okně je teď vidíte.'],
      };
    }
    return null;
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

  const GENERATORY = { thales, osa, kruznice, vyska, soumernost, rovnobeznik, obdelnik, ctverec, kosoctverec, lichobeznik, teznice, rovnoramenny };
  const TYPY = Object.keys(GENERATORY);
  /* Úlohy 9 a 10 testu nanečisto. V ostrých testech 2019–2026 jsou obě VŽDY
     konstrukce za 2 nebo 3 body; tříbodové bývají „najděte všechna řešení"
     nebo útvar o víc krocích, dvoubodové útvar s jedním řešením. Úlohy na
     jediný bod (osa, kružnice, rovnoběžník) zůstávají pro procvičování. Sady
     jsou disjunktní, takže test nikdy nedá dvakrát týž typ. */
  const PRO_TEST = { 9: ['obdelnik', 'teznice', 'rovnoramenny', 'thales', 'vyska', 'lichobeznik'], 10: ['ctverec', 'kosoctverec', 'soumernost'] };
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
