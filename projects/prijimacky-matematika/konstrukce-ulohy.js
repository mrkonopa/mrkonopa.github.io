/* ══════════════════════════════════════════════════════════════════
   KONSTRUKČNÍ ÚLOHY — generátory podle ostrých testů (úlohy 9 a 10)

   V archivu 48 konstrukčních úloh M9 (2015–2026): nejčastěji úhel (25×),
   trojúhelník (23×), „najděte všechna řešení" (17×), souměrnost (7×),
   obdélník a rovnoběžník. Každý typ tady cvičí jednu množinu bodů, na
   které konstrukce stojí: Thaletovu kružnici, osu úsečky, kružnici,
   rovnoběžky v dané vzdálenosti, osovou souměrnost a rovnoběžník.

   Typy 7–34 jsou CELÉ ÚTVARY jako v ostrém testu — každý podle jiné ostré
   úlohy z archivu M9 2015–2026 a M7 (zdroj je u každého typu): obdélníky,
   čtverce, kosočtverce, lichoběžníky, trojúhelníky s těžnicí, výškou,
   těžištěm nebo průsečíkem výšek, souměrnosti, osa úhlu, kružnice opsaná
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

  /* ════════ Typy 13–34: další ostré úlohy z archivu (M9 2015–2026, M7) ════════
     Každý typ stojí na jiné myšlence, kterou ostré testy používají: středová
     souměrnost, osa úhlu, kružnice opsaná, průsečík výšek, těžiště, dvě
     Thaletovy kružnice, pravidelný šestiúhelník, „všechna řešení" podle toho,
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

  // ── 15) Kružnice opsaná trojúhelníku (M9 2019 ilustrační ú. 10, M7 2019 ilustrační ú. 9) ──
  function opsana() {
    for (let g = 0; g < 800; g++) {
      const S = bod(nah(150, 250), nah(125, 175)), R = nah(70, 112), f = nah(0, 2 * Math.PI);
      const a1 = nah(0.42, 0.92) * Math.PI, a2 = nah(0.42, 0.92) * Math.PI, a3 = 2 * Math.PI - a1 - a2;
      if (a3 < 0.42 * Math.PI || a3 > 0.92 * Math.PI) continue;          // oblouky pod 180°: ostroúhlý, S uvnitř
      const A = secti(S, nasob(smer(f), R)), Bb = secti(S, nasob(smer(f + a1), R)), C = secti(S, nasob(smer(f + a1 + a2), R));
      if (!vsechnyUvnitr([A, Bb, C])) continue;
      const oAB = osaUsecky(A, Bb), oBC = osaUsecky(Bb, C);
      return {
        typ: 'opsana', nazev: 'Kružnice opsaná trojúhelníku',
        text: 'Je dán trojúhelník ABC. Sestrojte střed S kružnice opsané trojúhelníku ABC a kružnici narýsujte.',
        dane: { body: { A, B: Bb, C }, mnohouhelniky: [['A', 'B', 'C']] },
        hledane: ['S'], reseni: [{ S }], pomocne: [stred(A, Bb), stred(Bb, C), stred(C, A)],
        postup: [
          { text: 'Střed kružnice opsané má od všech tří vrcholů stejnou vzdálenost. Body stejně vzdálené od A a B leží na ose strany AB — sestrojte ji.', tvary: oAB.tvary },
          { text: 'Body stejně vzdálené od B a C leží na ose strany BC — sestrojte i tu.', tvary: oBC.tvary },
          { text: 'Průsečík os je střed S. Kružnice se středem S a poloměrem |SA| prochází všemi třemi vrcholy.', tvary: [B(S, 'S'), K(S, R)] },
        ],
        napovedy: ['Střed kružnice opsané má od A, B i C stejnou vzdálenost. Na které přímce leží všechny body, které jsou stejně daleko od A a od B?',
          'Sestrojte osy dvou stran, třeba AB a BC. Jejich průsečík je střed S; kružnice se středem S přes A prochází i B a C.',
          'Střed S je teď vidět v okně.'],
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
          { text: 'Úhel BCD obdélníku je pravý, takže vrchol C leží na Thaletově kružnici nad úhlopříčkou BD. Najděte střed S úsečky BD a narýsujte kružnici se středem S a poloměrem |SB|.', tvary: [B(S, 'S'), K(S, R)] },
          { text: 'Vrchol C leží na kružnici i na přímce c. Průsečíky jsou C₁ a C₂.', tvary: [B(Cv[0], 'C₁'), B(Cv[1], 'C₂')] },
          { text: 'Úhlopříčky obdélníku se v bodě S půlí: vrchol A leží na přímce CS na druhé straně od S (A₁ k C₁, A₂ k C₂).', tvary: [P({ p: Cv[0], q: S }), P({ p: Cv[1], q: S }), B(Av[0], 'A₁'), B(Av[1], 'A₂')] },
          { text: 'Úloha má dvě řešení: obdélníky A₁BC₁D a A₂BC₂D.', tvary: strany([Av[0], Bb, Cv[0], D]).concat(strany([Av[1], Bb, Cv[1], D])) },
        ],
        napovedy: ['Jaký úhel svírají v obdélníku strany CB a CD? Kde leží všechny body, ze kterých je úsečka BD vidět pod tímto úhlem?',
          'Narýsujte Thaletovu kružnici nad BD. Vrchol C je její průsečík s přímkou c, vrchol A leží na přímce CS za středem S.',
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

  // ── 23) Obdélník: vrchol A, střed S strany CD, vrchol D na přímce p (M9 2025/1 ú. 10; 2 řešení) ──
  function obdelnikStrana() {
    for (let g = 0; g < 1500; g++) {
      const A = bod(nah(60, 340), nah(50, 250)), S = secti(A, nasob(smer(nah(0, 2 * Math.PI)), nah(115, 175)));
      const T = stred(A, S), R = vzdal(A, S) / 2;
      const n = smer(nah(0, Math.PI)), d = R * nah(0.2, 0.65) * vyber([-1, 1]);
      const p = primka(secti(T, nasob(n, d)), rot(n));
      const Dv = G.prusecikyPK(p.p, p.q, T, R);
      if (Dv.length !== 2) continue;
      const Cv = Dv.map(x => stredove(x, S)), Bv = Dv.map((x, i) => secti(A, odecti(Cv[i], x)));
      const vse = [A, S, T].concat(Dv, Cv, Bv);
      if (!vsechnyUvnitr(vse) || !rozestup(vse, 36)) continue;
      return {
        typ: 'obdelnikStrana', nazev: 'Obdélník — vrchol a střed strany',
        text: 'Bod A je vrchol obdélníku ABCD a bod S je střed jeho strany CD. Vrchol D leží na přímce p. Sestrojte všechny takové obdélníky ABCD. Najděte všechna řešení.',
        dane: { body: { A, S }, primky: [Object.assign({ nazev: 'p' }, p)] },
        hledane: ['B', 'C', 'D'], reseni: [0, 1].map(i => ({ B: Bv[i], C: Cv[i], D: Dv[i] })), pomocne: [T],
        postup: [
          { text: 'Strana DA je kolmá ke straně DC a bod S na ní leží, takže úhel ADS je pravý. Vrchol D leží na Thaletově kružnici nad úsečkou AS: najděte střed T úsečky AS a narýsujte kružnici se středem T a poloměrem |TA|.', tvary: [B(T, 'T'), K(T, R)] },
          { text: 'Vrchol D leží na kružnici i na přímce p. Průsečíky jsou D₁ a D₂.', tvary: [B(Dv[0], 'D₁'), B(Dv[1], 'D₂')] },
          { text: 'Bod S je střed strany CD: vrchol C leží na přímce DS za bodem S a |SC| = |SD|.', tvary: [P({ p: Dv[0], q: S }), P({ p: Dv[1], q: S }), B(Cv[0], 'C₁'), B(Cv[1], 'C₂')] },
          { text: 'Vrchol B doplní obdélník: strana BC je rovnoběžná s AD a strana AB s DC. Úloha má dvě řešení.', tvary: [B(Bv[0], 'B₁'), B(Bv[1], 'B₂')].concat(strany([A, Bv[0], Cv[0], Dv[0]]), strany([A, Bv[1], Cv[1], Dv[1]])) },
        ],
        napovedy: ['Úhel ADC obdélníku je pravý a bod S leží na straně CD. Pod jakým úhlem je z vrcholu D vidět úsečka AS?',
          'Vrchol D leží na Thaletově kružnici nad AS a na přímce p. Vrchol C je souměrný s D podle S a vrchol B doplní obdélník.',
          'Řešení jsou dvě. V okně je teď vidíte.'],
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
          { text: 'Střed přepony má od všech vrcholů stejnou vzdálenost (Thaletova kružnice): naneste od M na kolmici vzdálenost |MC| na obě strany — dostanete vrcholy A a B.', tvary: [K(M, h), B(A, 'A'), B(Bb, 'B')] },
          { text: 'Dorýsujte trojúhelník ABC.', tvary: strany([A, Bb, C]) },
        ],
        napovedy: ['Kde leží těžiště trojúhelníku? Na těžnici, ve dvou třetinách její délky od vrcholu. Kam tedy vede těžnice z vrcholu C?',
          'Prodlužte CT za T o polovinu délky |CT| — tak najdete střed M přepony. Přepona leží na kolmici k CM v bodě M a A, B jsou od M stejně daleko jako C.',
          'Vrcholy A a B jsou teď vidět v okně.'],
      };
    }
    return null;
  }

  // ── 26) Vrchol C na dvou Thaletových kružnicích: úhly ACB i BCD pravé (M9 2026/2 ú. 10) ──
  function dveThalet() {
    for (let g = 0; g < 1500; g++) {
      const A = bod(nah(40, 160), nah(40, 260)), D = secti(A, nasob(smer(nah(-0.7, 0.7)), nah(190, 260)));
      const uAD = jednot(odecti(D, A)), C = secti(A, nasob(uAD, nah(0.3, 0.7) * vzdal(A, D)));
      const Bb = secti(C, nasob(rot(uAD), nah(65, 120) * vyber([-1, 1])));
      const S1 = stred(A, Bb), S2 = stred(Bb, D);
      if (!vsechnyUvnitr([A, Bb, C, D]) || !rozestup([A, Bb, C, D, S1, S2], 30)) continue;
      return {
        typ: 'dveThalet', nazev: 'Dva pravoúhlé trojúhelníky',
        text: 'Body A a B jsou vrcholy pravoúhlého trojúhelníku ABC s pravým úhlem při vrcholu C. Body B a D jsou vrcholy pravoúhlého trojúhelníku BCD s pravým úhlem při vrcholu C. Sestrojte vrchol C a oba trojúhelníky narýsujte.',
        dane: { body: { A, B: Bb, D } },
        hledane: ['C'], reseni: [{ C }], pomocne: [S1, S2],
        postup: [
          { text: 'Úhel ACB je pravý, takže vrchol C leží na Thaletově kružnici nad úsečkou AB (střed S₁ úsečky AB, poloměr |S₁A|).', tvary: [B(S1, 'S₁'), K(S1, vzdal(A, Bb) / 2)] },
          { text: 'Úhel BCD je také pravý, takže C leží i na Thaletově kružnici nad úsečkou BD (střed S₂ úsečky BD).', tvary: [B(S2, 'S₂'), K(S2, vzdal(Bb, D) / 2)] },
          { text: 'Kružnice se protínají v bodě B a v hledaném vrcholu C. (Bod C je zároveň pata kolmice z bodu B na přímku AD.)', tvary: [B(C, 'C'), U(A, Bb), U(A, C), U(Bb, C), U(C, D), U(Bb, D)] },
        ],
        napovedy: ['Kde leží všechny body, ze kterých je úsečka AB vidět pod pravým úhlem? A úsečka BD?',
          'Narýsujte Thaletovy kružnice nad AB i nad BD. Vrchol C je jejich druhý průsečík — prvním je bod B.',
          'Vrchol C je teď vidět v okně.'],
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

  const GENERATORY = { thales, osa, kruznice, vyska, soumernost, rovnobeznik, obdelnik, ctverec, kosoctverec, lichobeznik, teznice, rovnoramenny,
    stredova, osauhlu, opsana, vysky, obdelnikUhl, obdelnikM, lichobeznikZakl, rovnoramennyOsa, ctverecUhl, vcTc, obdelnikStrana,
    kosoctverecOsa, teziste, dveThalet, rovnoramennyKruz, pravouhlyLich, osaStrany, sestiuhelnik, stredyStran, lichobeznikTri, obdelnikSp, rovnoramennyZakl,
    rovnoramennyUhel, uhelOsaStrany, rovnobeznikUhel, pravouhlyUhel, lichobeznikUhel, tupyUhelVyska };
  const TYPY = Object.keys(GENERATORY);
  /* Úlohy 9 a 10 testu nanečisto. V ostrých testech 2019–2026 jsou obě VŽDY
     konstrukce za 2 nebo 3 body; tříbodové bývají „najděte všechna řešení"
     nebo útvar o víc krocích, dvoubodové útvar s jedním řešením. Úlohy na
     jediný bod (osa, kružnice, rovnoběžník) zůstávají pro procvičování. Sady
     jsou disjunktní, takže test nikdy nedá dvakrát týž typ. Úlohy s úhlem ve
     stupních z M9 jdou na tutéž pozici jako v ostrém testu (2019–2022 ú. 9,
     2023 ú. 10); ty z M7 zůstávají pro procvičování. */
  const PRO_TEST = {
    9: ['obdelnik', 'teznice', 'rovnoramenny', 'thales', 'vyska', 'lichobeznik', 'vysky', 'obdelnikUhl', 'rovnoramennyOsa',
      'obdelnikStrana', 'teziste', 'dveThalet', 'rovnoramennyKruz', 'osaStrany', 'stredyStran', 'lichobeznikTri',
      'rovnoramennyUhel', 'uhelOsaStrany', 'rovnobeznikUhel'],
    10: ['ctverec', 'kosoctverec', 'soumernost', 'stredova', 'osauhlu', 'opsana', 'obdelnikM', 'lichobeznikZakl', 'ctverecUhl',
      'vcTc', 'kosoctverecOsa', 'pravouhlyLich', 'sestiuhelnik', 'obdelnikSp', 'rovnoramennyZakl', 'pravouhlyUhel'],
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
