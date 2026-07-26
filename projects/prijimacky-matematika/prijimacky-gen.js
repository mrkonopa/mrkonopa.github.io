/* ─────────────────────────────────────────────────────────────────────────
   PŘIJÍMAČKY HUB — doplňkové neutrální generátory (Fáze 3b).
   Rozšiřují variety okruhů, kde má testový generátor málo pozic (poměr a
   úměrnost, statistika). Formální tón jako CERMAT, ČISTÉ celočíselné výsledky
   (konstrukce garantuje dělitelnost), u každé úlohy vyřešený postup.
   Každý generátor vrací položku {prompt, type:'text', ans, sol, _check}.
   `_check` = kontrolní hodnoty pro strojové ověření správnosti (ignoruje UI).
   Vyžaduje globální `ri` (z ../rpg-svg-9.js). ans se počítá ze STEJNÝCH čísel
   jako zadání i řešení → konzistentní z konstrukce.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const cz = window.cz || (n => String(n).replace('.', ','));

  // ── Poměr a úměrnost ──
  function deleniVPomeru() {
    const a = ri(2, 5), b = ri(2, 6), dil = ri(15, 90);
    const total = dil * (a + b), vetsi = Math.max(a, b) * dil;
    return {
      prompt: 'Rozdělte částku ' + total + ' Kč v poměru ' + a + ' : ' + b + '. Určete v Kč větší z obou dílů.',
      type: 'text', ans: String(vetsi),
      sol: 'Součet dílů poměru: ' + a + ' + ' + b + ' = ' + (a + b) + '. Jeden díl = ' + total + ' : ' + (a + b) + ' = ' + dil + ' Kč. Větší díl = ' + Math.max(a, b) + ' · ' + dil + ' = ' + vetsi + ' Kč.',
      _check: { kind: 'deleni', total, a, b, expect: vetsi }
    };
  }
  function primaUmernost() {
    const perU = ri(4, 15), n1 = ri(2, 6), n2 = ri(7, 12), cost1 = perU * n1, cost2 = perU * n2;
    return {
      prompt: n1 + ' stejných výrobků stojí ' + cost1 + ' Kč. Kolik Kč stojí ' + n2 + ' takových výrobků?',
      type: 'text', ans: String(cost2),
      sol: 'Jeden výrobek: ' + cost1 + ' : ' + n1 + ' = ' + perU + ' Kč. ' + n2 + ' výrobků: ' + n2 + ' · ' + perU + ' = ' + cost2 + ' Kč.',
      _check: { kind: 'prima', n1, cost1, n2, expect: cost2 }
    };
  }
  function neprimaUmernost() {
    const w1 = ri(3, 6), d1 = ri(6, 12), total = w1 * d1;
    const cand = [];
    for (let w = 2; w <= 12; w++) if (total % w === 0 && w !== w1) cand.push(w);
    if (!cand.length) return primaUmernost();
    const w2 = cand[ri(0, cand.length - 1)], d2 = total / w2;
    return {
      prompt: w1 + ' dělníků vykope příkop za ' + d1 + ' dní. Za kolik dní vykope stejný příkop ' + w2 + ' dělníků při stejném pracovním tempu?',
      type: 'text', ans: String(d2),
      sol: 'Práce celkem: ' + w1 + ' · ' + d1 + ' = ' + total + ' člověkodní. ' + w2 + ' dělníků: ' + total + ' : ' + w2 + ' = ' + d2 + ' dní.',
      _check: { kind: 'neprima', w1, d1, w2, expect: d2 }
    };
  }
  function meritko() {
    const scale = [500, 1000, 2000, 5000][ri(0, 3)], mapCm = ri(2, 10);
    const realM = mapCm * scale / 100;
    return {
      prompt: 'Na mapě v měřítku 1 : ' + scale + ' je úsečka dlouhá ' + mapCm + ' cm. Jaká je skutečná vzdálenost v metrech?',
      type: 'text', ans: String(realM),
      sol: 'Skutečná délka = ' + mapCm + ' cm · ' + scale + ' = ' + (mapCm * scale) + ' cm = ' + realM + ' m.',
      _check: { kind: 'meritko', mapCm, scale, expect: realM }
    };
  }

  // ── Statistika a data ──
  function prumer() {
    let n = ri(4, 6), vals, sum;
    for (let tries = 0; tries < 60; tries++) { vals = Array.from({ length: n }, () => ri(1, 12)); sum = vals.reduce((a, b) => a + b, 0); if (sum % n === 0) break; }
    const avg = sum / n;
    return {
      prompt: 'Vypočtěte aritmetický průměr čísel ' + vals.join(', ') + '.',
      type: 'text', ans: String(avg),
      sol: 'Průměr = (' + vals.join(' + ') + ') : ' + n + ' = ' + sum + ' : ' + n + ' = ' + avg + '.',
      _check: { kind: 'prumer', vals: vals.slice(), expect: avg }
    };
  }
  function prumerPridani() {
    const n = ri(3, 5), avg = ri(3, 7), sum = n * avg, novy = ri(1, 10);
    const newAvg = (sum + novy) / (n + 1);
    if (!Number.isInteger(newAvg)) { // vynuť čistý výsledek volbou novy
      const target = ri(3, 7); const nv = target * (n + 1) - sum;
      if (nv >= 1 && nv <= 15) return build(n, avg, sum, nv, target);
      return prumer();
    }
    return build(n, avg, sum, novy, newAvg);
    function build(n, avg, sum, nv, na) {
      return {
        prompt: 'Aritmetický průměr ' + n + ' čísel je ' + avg + '. Přidáme číslo ' + nv + '. Jaký je průměr všech ' + (n + 1) + ' čísel?',
        type: 'text', ans: String(na),
        sol: 'Součet původních čísel = ' + n + ' · ' + avg + ' = ' + sum + '. Nový součet = ' + sum + ' + ' + nv + ' = ' + (sum + nv) + '. Nový průměr = ' + (sum + nv) + ' : ' + (n + 1) + ' = ' + na + '.',
        _check: { kind: 'prumerPridani', n, avg, nv, expect: na }
      };
    }
  }

  // ── Číselné výrazy, mocniny a odmocniny ──
  function mocnina() {
    const n = ri(2, 3), a = n === 2 ? ri(4, 15) : ri(2, 6), v = a ** n;
    return {
      prompt: 'Vypočtěte ' + a + (n === 2 ? '²' : '³') + '.', type: 'text', ans: String(v),
      sol: a + (n === 2 ? '² = ' + a + ' · ' + a : '³ = ' + a + ' · ' + a + ' · ' + a) + ' = ' + v + '.',
      _check: { kind: 'mocnina', a, n }
    };
  }
  function odmocnina() {
    const r = ri(4, 20), sq = r * r;
    return {
      prompt: 'Vypočtěte √' + sq + '.', type: 'text', ans: String(r),
      sol: 'Hledáme číslo, jehož druhá mocnina je ' + sq + '. Protože ' + r + '² = ' + sq + ', platí √' + sq + ' = ' + r + '.',
      _check: { kind: 'odmocnina', sq }
    };
  }
  function mocninaVyraz() {
    const a = ri(6, 12), b = ri(2, 5), c = ri(2, 5);
    return {
      prompt: 'Vypočtěte ' + a + '² − ' + b + ' · ' + c + '.', type: 'text', ans: String(a * a - b * c),
      sol: a + '² = ' + a * a + ' a ' + b + ' · ' + c + ' = ' + b * c + '. Rozdíl: ' + a * a + ' − ' + b * c + ' = ' + (a * a - b * c) + '.',
      _check: { kind: 'mocninaVyraz', a, b, c }
    };
  }

  // ── Zlomky a desetinná čísla ──
  function zlomekCelku() {
    const q = ri(2, 8), p = ri(1, q - 1), mult = ri(3, 20), celek = q * mult;
    return {
      prompt: 'Kolik je ' + p + '/' + q + ' z čísla ' + celek + '?', type: 'text', ans: String(p * mult),
      sol: 'Zlomek 1/' + q + ' z ' + celek + ' je ' + celek + ' : ' + q + ' = ' + mult + '. Pak ' + p + '/' + q + ' je ' + p + ' · ' + mult + ' = ' + (p * mult) + '.',
      _check: { kind: 'zlomekCelku', celek, p, q }
    };
  }
  function zlomekZbytek() {
    const q = ri(2, 6), p = ri(1, q - 1), mult = ri(4, 20), celek = q * mult;
    return {
      prompt: 'Ze ' + celek + ' žáků chodí ' + p + '/' + q + ' na kroužek. Kolik žáků na kroužek NEchodí?', type: 'text', ans: String((q - p) * mult),
      sol: 'Zlomek 1/' + q + ' z ' + celek + ' je ' + mult + '. Na kroužek chodí ' + p + '/' + q + ' = ' + (p * mult) + ' žáků, takže nechodí ' + celek + ' − ' + (p * mult) + ' = ' + ((q - p) * mult) + '.',
      _check: { kind: 'zlomekZbytek', celek, p, q }
    };
  }
  function zlomekPocet() {
    const q = ri(2, 6), N = ri(2, 9);
    return {
      prompt: 'Kolik zlomků 1/' + q + ' se vejde do ' + N + ' celků?', type: 'text', ans: String(N * q),
      sol: 'Do jednoho celku se vejde ' + q + ' zlomků 1/' + q + ', do ' + N + ' celků tedy ' + N + ' · ' + q + ' = ' + (N * q) + '.',
      _check: { kind: 'zlomekPocet', N, q }
    };
  }

  // ── Výrazy s proměnnou (dosazení) ──
  function dosazeniLin() {
    const a = ri(2, 9), b = ri(1, 12), v = ri(2, 9);
    return {
      prompt: 'Vypočtěte hodnotu výrazu ' + a + 'x + ' + b + ' pro x = ' + v + '.', type: 'text', ans: String(a * v + b),
      sol: 'Dosaď x = ' + v + ': ' + a + ' · ' + v + ' + ' + b + ' = ' + (a * v) + ' + ' + b + ' = ' + (a * v + b) + '.',
      _check: { kind: 'dosazeniLin', a, b, v }
    };
  }
  function dosazeniKvadrat() {
    const a = ri(2, 8), v = ri(2, 7);
    return {
      prompt: 'Vypočtěte hodnotu výrazu x² + ' + a + 'x pro x = ' + v + '.', type: 'text', ans: String(v * v + a * v),
      sol: 'Dosaď x = ' + v + ': ' + v + '² + ' + a + ' · ' + v + ' = ' + (v * v) + ' + ' + (a * v) + ' = ' + (v * v + a * v) + '.',
      _check: { kind: 'dosazeniKvadrat', a, v }
    };
  }
  function dosazeniZavorka() {
    const a = ri(2, 6), b = ri(1, 8), c = ri(1, 10), v = ri(2, 9);
    return {
      prompt: 'Vypočtěte hodnotu výrazu ' + a + '·(x + ' + b + ') − ' + c + ' pro x = ' + v + '.', type: 'text', ans: String(a * (v + b) - c),
      sol: 'Dosaď x = ' + v + ': ' + a + '·(' + v + ' + ' + b + ') − ' + c + ' = ' + a + '·' + (v + b) + ' − ' + c + ' = ' + (a * (v + b)) + ' − ' + c + ' = ' + (a * (v + b) - c) + '.',
      _check: { kind: 'dosazeniZavorka', a, b, c, v }
    };
  }

  // ── Rovnice ──
  function rovniceLin() {
    const x = ri(2, 9), a = ri(2, 7), b = ri(1, 12), c = a * x + b;
    return {
      prompt: 'Vyřešte rovnici a napište kořen x: ' + a + 'x + ' + b + ' = ' + c + '.', type: 'text', ans: String(x),
      sol: 'Odečti ' + b + ' od obou stran: ' + a + 'x = ' + c + ' − ' + b + ' = ' + (c - b) + '. Vyděl ' + a + ': x = ' + (c - b) + ' : ' + a + ' = ' + x + '.',
      _check: { kind: 'rovniceLin', a, b, c }
    };
  }
  function rovniceZlomek() {
    const a = ri(2, 6), xq = ri(2, 9), x = xq * a, b = ri(1, 8), c = x / a + b;
    return {
      prompt: 'Vyřešte rovnici a napište kořen x: x : ' + a + ' + ' + b + ' = ' + c + '.', type: 'text', ans: String(x),
      sol: 'Odečti ' + b + ': x : ' + a + ' = ' + c + ' − ' + b + ' = ' + (c - b) + '. Vynásob ' + a + ': x = ' + (c - b) + ' · ' + a + ' = ' + x + '.',
      _check: { kind: 'rovniceZlomek', a, b, c }
    };
  }
  function rovniceSlovni() {
    const x = ri(3, 15), a = ri(2, 6), b = ri(2, 20), c = a * x + b;
    return {
      prompt: 'Myslím si číslo. Když ho vynásobím ' + a + ' a k výsledku přičtu ' + b + ', dostanu ' + c + '. Které číslo si myslím?', type: 'text', ans: String(x),
      sol: 'Označ hledané číslo x. Platí ' + a + 'x + ' + b + ' = ' + c + '. Odečti ' + b + ': ' + a + 'x = ' + (c - b) + '. Vyděl ' + a + ': x = ' + x + '.',
      _check: { kind: 'rovniceLin', a, b, c }
    };
  }

  // ── Procenta a finanční matematika ──
  function procCast() {
    const p = ri(1, 19) * 5, celek = [100, 200, 400, 500][ri(0, 3)], cast = p * celek / 100;
    return {
      prompt: 'Kolik je ' + p + ' % z ' + celek + '?', type: 'text', ans: String(cast),
      sol: '1 % z ' + celek + ' je ' + (celek / 100) + '. Pak ' + p + ' % je ' + p + ' · ' + (celek / 100) + ' = ' + cast + '.',
      _check: { kind: 'procCast', p, celek }
    };
  }
  function procZaklad() {
    const p = [10, 20, 25, 50][ri(0, 3)], celek = ri(2, 9) * 100, X = celek * p / 100;
    return {
      prompt: 'Číslo ' + X + ' je ' + p + ' % z nějakého celku. Jak velký je celek?', type: 'text', ans: String(celek),
      sol: 'Když ' + p + ' % odpovídá ' + X + ', pak 1 % je ' + X + ' : ' + p + ' = ' + (X / p) + '. Celek (100 %) = ' + (X / p) + ' · 100 = ' + celek + '.',
      _check: { kind: 'procZaklad', X, p }
    };
  }
  function procKolik() {
    const celek = [100, 200, 400, 500][ri(0, 3)], p = ri(1, 19) * 5, X = p * celek / 100;
    return {
      prompt: 'Kolik procent je ' + X + ' z ' + celek + '?', type: 'text', ans: String(p),
      sol: 'Podíl: ' + X + ' : ' + celek + ' = ' + cz(X / celek) + '. Vynásob 100: ' + cz(X / celek) + ' · 100 = ' + p + ' %.',
      _check: { kind: 'procKolik', X, celek }
    };
  }

  // ── Slovní úlohy ──
  function slovniSoucetRozdil() {
    const vetsi = ri(20, 60), mensi = ri(5, vetsi - 2), S = vetsi + mensi, D = vetsi - mensi;
    return {
      prompt: 'Součet dvou čísel je ' + S + ', jejich rozdíl je ' + D + '. Určete větší z obou čísel.', type: 'text', ans: String(vetsi),
      sol: 'Větší číslo = (součet + rozdíl) : 2 = (' + S + ' + ' + D + ') : 2 = ' + (S + D) + ' : 2 = ' + vetsi + '.',
      _check: { kind: 'soucetRozdil', S, D }
    };
  }
  function slovniNakup() {
    const a = ri(2, 6), p = ri(10, 40), b = ri(2, 5), q = ri(10, 40), total = a * p + b * q;
    return {
      prompt: 'Koupili jsme ' + a + ' kusy po ' + p + ' Kč a ' + b + ' kusy po ' + q + ' Kč. Kolik Kč jsme zaplatili celkem?', type: 'text', ans: String(total),
      sol: a + ' · ' + p + ' = ' + (a * p) + ' Kč a ' + b + ' · ' + q + ' = ' + (b * q) + ' Kč. Celkem ' + (a * p) + ' + ' + (b * q) + ' = ' + total + ' Kč.',
      _check: { kind: 'nakup', a, p, b, q }
    };
  }

  window.PZ_GEN = {
    'vyrazy-mocniny': [mocnina, odmocnina, mocninaVyraz],
    'zlomky': [zlomekCelku, zlomekZbytek, zlomekPocet],
    'vyrazy-promenna': [dosazeniLin, dosazeniKvadrat, dosazeniZavorka],
    'rovnice': [rovniceLin, rovniceZlomek, rovniceSlovni],
    'procenta': [procCast, procZaklad, procKolik],
    'slovni': [slovniSoucetRozdil, slovniNakup],
    'pomer': [deleniVPomeru, primaUmernost, neprimaUmernost, meritko],
    'data': [prumer, prumerPridani],
  };
})();
