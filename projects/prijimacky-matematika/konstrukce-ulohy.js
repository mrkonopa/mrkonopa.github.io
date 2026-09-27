/* ══════════════════════════════════════════════════════════════════
   KONSTRUKČNÍ ÚLOHY — generátory podle ostrých testů (úlohy 9 a 10)

   V archivu 48 konstrukčních úloh M9 (2015–2026): nejčastěji úhel (25×),
   trojúhelník (23×), „najděte všechna řešení" (17×), souměrnost (7×),
   obdélník a rovnoběžník. Každý typ tady cvičí jednu množinu bodů, na
   které konstrukce stojí: Thaletovu kružnici, osu úsečky, kružnici,
   rovnoběžky v dané vzdálenosti, osovou souměrnost a rovnoběžník.

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
  const { CM, W, H, bod, vzdal, stred, jednot, secti, odecti, nasob, pata, osove } = G;
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
      const r0 = vzdal(A, Bb) * 0.7, PQ = G.prusecikyKK(A, r0, Bb, r0);
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

  const GENERATORY = { thales, osa, kruznice, vyska, soumernost, rovnobeznik };
  const TYPY = Object.keys(GENERATORY);
  // Nová úloha: daný typ, nebo náhodný (jiný než předchozí, ať se typy střídají)
  let posledni = null;
  function nova(typ) {
    const t = typ && GENERATORY[typ] ? typ : vyber(TYPY.filter(x => x !== posledni));
    posledni = t;
    const u = GENERATORY[t]();
    if (u) u.tol = 10;                  // ≈ 3 mm: náčrt od ruky, ne přesné rýsování
    return u;
  }
  window.PZ_KONSTRUKCE = { TYPY, GENERATORY, nova };
})();
