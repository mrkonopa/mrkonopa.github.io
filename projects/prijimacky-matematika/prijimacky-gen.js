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

  window.PZ_GEN = {
    'pomer': [deleniVPomeru, primaUmernost, neprimaUmernost, meritko],
    'data': [prumer, prumerPridani],
  };
})();
