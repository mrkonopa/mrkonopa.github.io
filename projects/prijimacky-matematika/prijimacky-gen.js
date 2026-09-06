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

  // Zlomek v ZÁKLADNÍM tvaru (p < q, nesoudělné). Bez toho vznikaly zadání
  // jako „2/4 z počtu", což u přijímačkového stylu vypadá nedbale.
  function gcd2(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }
  function zlomek(qmin, qmax) {
    for (let i = 0; i < 40; i++) {
      const q = ri(qmin, qmax), p = ri(1, q - 1);
      if (gcd2(p, q) === 1) return { p, q };
    }
    return { p: 1, q: 2 };
  }

  // ── Poměr a úměrnost ──
  function deleniVPomeru() {
    const a = ri(2, 5), b = ri(2, 6), dil = ri(15, 90);
    const total = dil * (a + b), vetsi = Math.max(a, b) * dil;
    return {
      prompt: 'Rozdělte částku ' + total + ' Kč v poměru ' + a + ' : ' + b + '. Určete v Kč větší z obou dílů.',
      type: 'text', ans: String(vetsi),
      sol: [
        'Poměr ' + a + ' : ' + b + ' znamená, že se částka dělí na ' + a + ' + ' + b + ' stejných dílů. Nejdřív tedy zjisti, kolik je jeden díl.',
        'Kolik dílů celkem: ' + a + ' + ' + b + ' = ' + (a + b) + '.',
        'Jeden díl: ' + total + ' : ' + (a + b) + ' = ' + dil + ' Kč.',
        'Větší podíl má ' + Math.max(a, b) + ' dílů: ' + Math.max(a, b) + ' · ' + dil + ' = ' + vetsi + ' Kč.'
      ],
      _check: { kind: 'deleni', total, a, b, expect: vetsi }
    };
  }
  function primaUmernost() {
    const perU = ri(4, 15), n1 = ri(2, 6), n2 = ri(7, 12), cost1 = perU * n1, cost2 = perU * n2;
    return {
      prompt: n1 + ' stejných výrobků stojí ' + cost1 + ' Kč. Kolik Kč stojí ' + n2 + ' takových výrobků?',
      type: 'text', ans: String(cost2),
      sol: [
        'Čím víc kusů, tím vyšší cena — jde o přímou úměrnost. Nejjistější je spočítat cenu JEDNOHO kusu a tou pak násobit.',
        'Jeden výrobek: ' + cost1 + ' : ' + n1 + ' = ' + perU + ' Kč.',
        'Cena ' + n2 + ' výrobků = ' + n2 + ' · ' + perU + ' = ' + cost2 + ' Kč.'
      ],
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
      sol: [
        'Pozor, tady je úměrnost NEPŘÍMÁ: víc dělníků znamená MÉNĚ dní. Práce zůstává stejná, jen se rozdělí mezi víc lidí.',
        'Spočítej celkovou práci v člověkodnech: ' + w1 + ' · ' + d1 + ' = ' + total + '.',
        'Tuhle práci rozděl mezi ' + w2 + ' dělníků: ' + total + ' : ' + w2 + ' = ' + d2 + ' dní.'
      ],
      _check: { kind: 'neprima', w1, d1, w2, expect: d2 }
    };
  }
  function meritko() {
    const scale = [500, 1000, 2000, 5000][ri(0, 3)], mapCm = ri(2, 10);
    const realM = mapCm * scale / 100;
    return {
      prompt: 'Na mapě v měřítku 1 : ' + scale + ' je úsečka dlouhá ' + mapCm + ' cm. Jaká je skutečná vzdálenost v metrech?',
      type: 'text', ans: String(realM),
      sol: [
        'Měřítko 1 : ' + scale + ' znamená, že 1 cm na mapě je ve skutečnosti ' + scale + ' cm. Skutečnost je tedy ' + scale + '× větší — násobí se.',
        'Skutečná délka v centimetrech: ' + mapCm + ' · ' + scale + ' = ' + (mapCm * scale) + ' cm.',
        'Otázka je na metry, takže vyděl stovkou: ' + (mapCm * scale) + ' : 100 = ' + cz(realM) + ' m.'
      ],
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
      sol: [
        'Aritmetický průměr je součet všech hodnot dělený jejich počtem.',
        'Sečti hodnoty: ' + vals.join(' + ') + ' = ' + sum + '.',
        'Vyděl počtem hodnot: ' + sum + ' : ' + n + ' = ' + cz(avg) + '.'
      ],
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
        sol: [
        'Přidáním čísla se změní SOUČET i POČET, takže nový průměr nespočítáš ze starého — musíš přes součet.',
        'Součet původních čísel: ' + n + ' · ' + cz(avg) + ' = ' + sum + '.',
        'Nový součet: ' + sum + ' + ' + nv + ' = ' + (sum + nv) + '. Čísel je teď ' + (n + 1) + '.',
        'Nový průměr = ' + (sum + nv) + ' : ' + (n + 1) + ' = ' + cz(na) + '.'
      ],
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
      sol: [
        'Odmocnina je opačná operace k druhé mocnině: hledáš číslo, které po vynásobení samo sebou dá ' + sq + '.',
        'Zkoušej: ' + r + ' · ' + r + ' = ' + sq + '.',
        'Proto √' + sq + ' = ' + r + '.'
      ],
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
    const { p, q } = zlomek(2, 8), mult = ri(3, 20), celek = q * mult;
    return {
      prompt: 'Kolik je ' + p + '/' + q + ' z čísla ' + celek + '?', type: 'text', ans: String(p * mult),
      sol: [
        'Jmenovatel říká, na kolik dílů se celek dělí; čitatel, kolik dílů bereš. Postupuj v tomhle pořadí.',
        'Jeden díl (1/' + q + ' celku): ' + celek + ' : ' + q + ' = ' + mult + '.',
        'Bereš ' + p + ' takových dílů: ' + p + ' · ' + mult + ' = ' + (p * mult) + '.'
      ],
      _check: { kind: 'zlomekCelku', celek, p, q }
    };
  }
  function zlomekZbytek() {
    const { p, q } = zlomek(2, 6), mult = ri(4, 20), celek = q * mult;
    return {
      prompt: 'Ze ' + celek + ' žáků chodí ' + p + '/' + q + ' na kroužek. Kolik žáků na kroužek NEchodí?', type: 'text', ans: String((q - p) * mult),
      sol: [
        'Otázka míří na ZBYTEK, ne na uvedený zlomek — proto se na konci odečítá. Pozor, tady se dělá nejvíc chyb.',
        'Jeden díl: ' + celek + ' : ' + q + ' = ' + mult + '.',
        'Chodí ' + p + ' dílů: ' + p + ' · ' + mult + ' = ' + (p * mult) + ' žáků.',
        'Nechodí = ' + celek + ' − ' + (p * mult) + ' = ' + ((q - p) * mult) + '.'
      ],
      _check: { kind: 'zlomekZbytek', celek, p, q }
    };
  }
  function zlomekPocet() {
    const q = ri(2, 6), N = ri(2, 9);
    return {
      prompt: 'Kolik zlomků 1/' + q + ' se vejde do ' + N + ' celků?', type: 'text', ans: String(N * q),
      sol: [
        'Do jednoho celku se vejde přesně tolik zlomků 1/' + q + ', kolik je ve jmenovateli — tedy ' + q + '.',
        'Do ' + N + ' celků se jich vejde ' + N + '× víc: ' + N + ' · ' + q + ' = ' + (N * q) + '.'
      ],
      _check: { kind: 'zlomekPocet', N, q }
    };
  }

  // ── Výrazy s proměnnou (dosazení) ──
  function dosazeniLin() {
    const a = ri(2, 9), b = ri(1, 12), v = ri(2, 9);
    return {
      prompt: 'Vypočtěte hodnotu výrazu ' + a + 'x + ' + b + ' pro x = ' + v + '.', type: 'text', ans: String(a * v + b),
      sol: [
        'Dosazení znamená napsat místo písmene číslo. Pak už jde jen o pořadí operací — nejdřív násobení, pak sčítání.',
        'Za x dosaď ' + v + ' a vynásob: ' + a + ' · ' + v + ' = ' + (a * v) + '.',
        'Přičti ' + b + ': ' + (a * v) + ' + ' + b + ' = ' + (a * v + b) + '.'
      ],
      _check: { kind: 'dosazeniLin', a, b, v }
    };
  }
  function dosazeniKvadrat() {
    const a = ri(2, 8), v = ri(2, 7);
    return {
      prompt: 'Vypočtěte hodnotu výrazu x² + ' + a + 'x pro x = ' + v + '.', type: 'text', ans: String(v * v + a * v),
      sol: [
        'Po dosazení se drž pořadí operací: nejdřív mocnina, pak násobení, nakonec sčítání.',
        'Umocni: ' + v + '² = ' + (v * v) + '. Vynásob: ' + a + ' · ' + v + ' = ' + (a * v) + '.',
        'Sečti: ' + (v * v) + ' + ' + (a * v) + ' = ' + (v * v + a * v) + '.'
      ],
      _check: { kind: 'dosazeniKvadrat', a, v }
    };
  }
  function dosazeniZavorka() {
    const a = ri(2, 6), b = ri(1, 8), c = ri(1, 10), v = ri(2, 9);
    return {
      prompt: 'Vypočtěte hodnotu výrazu ' + a + '·(x + ' + b + ') − ' + c + ' pro x = ' + v + '.', type: 'text', ans: String(a * (v + b) - c),
      sol: [
        'Nejdřív se počítá závorka, pak násobení, nakonec odčítání.',
        'Závorka po dosazení x = ' + v + ': ' + v + ' + ' + b + ' = ' + (v + b) + '.',
        'Vynásob: ' + a + ' · ' + (v + b) + ' = ' + (a * (v + b)) + '.',
        'Odečti ' + c + ': ' + (a * (v + b)) + ' − ' + c + ' = ' + (a * (v + b) - c) + '.'
      ],
      _check: { kind: 'dosazeniZavorka', a, b, c, v }
    };
  }

  // ── Rovnice ──
  function rovniceLin() {
    const x = ri(2, 9), a = ri(2, 7), b = ri(1, 12), c = a * x + b;
    return {
      prompt: 'Vyřešte rovnici a napište kořen x: ' + a + 'x + ' + b + ' = ' + c + '.', type: 'text', ans: String(x),
      sol: [
        'Rovnice je váha v rovnováze: co uděláš na jedné straně, musíš udělat i na druhé. Nejdřív se zbav čísla u x, teprve pak čísla PŘED x.',
        'Odečti ' + b + ' od obou stran: ' + a + 'x = ' + c + ' − ' + b + ' = ' + (c - b) + '.',
        'Teď obě strany vyděl ' + a + ': x = ' + (c - b) + ' : ' + a + ' = ' + x + '.'
      ],
      _check: { kind: 'rovniceLin', a, b, c }
    };
  }
  function rovniceZlomek() {
    const a = ri(2, 6), xq = ri(2, 9), x = xq * a, b = ri(1, 8), c = x / a + b;
    return {
      prompt: 'Vyřešte rovnici a napište kořen x: x : ' + a + ' + ' + b + ' = ' + c + '.', type: 'text', ans: String(x),
      sol: [
        'Neznámá je tady DĚLENÁ, takže se na konci bude násobit — opačnou operací než ta, která u x stojí.',
        'Nejdřív odečti ' + b + ' od obou stran: x : ' + a + ' = ' + c + ' − ' + b + ' = ' + (c - b) + '.',
        'Teď obě strany vynásob ' + a + ': x = ' + (c - b) + ' · ' + a + ' = ' + x + '.'
      ],
      _check: { kind: 'rovniceZlomek', a, b, c }
    };
  }
  function rovniceSlovni() {
    const x = ri(3, 15), a = ri(2, 6), b = ri(2, 20), c = a * x + b;
    return {
      prompt: 'Myslím si číslo. Když ho vynásobím ' + a + ' a k výsledku přičtu ' + b + ', dostanu ' + c + '. Které číslo si myslím?', type: 'text', ans: String(x),
      sol: [
        'Slovní úlohu si nejdřív přepiš do rovnice. Označ hledané číslo x a zapiš, co o něm zadání tvrdí.',
        'Rovnice: ' + a + 'x + ' + b + ' = ' + c + '.',
        'Odečti ' + b + ' od obou stran: ' + a + 'x = ' + c + ' − ' + b + ' = ' + (c - b) + '.',
        'Vyděl ' + a + ': x = ' + (c - b) + ' : ' + a + ' = ' + x + '.'
      ],
      _check: { kind: 'rovniceLin', a, b, c }
    };
  }

  // ── Procenta a finanční matematika ──
  function procCast() {
    const p = ri(1, 19) * 5, celek = [100, 200, 400, 500][ri(0, 3)], cast = p * celek / 100;
    return {
      prompt: 'Kolik je ' + p + ' % z ' + celek + '?', type: 'text', ans: String(cast),
      sol: [
        'Procenta jsou setiny celku. Nejjistější cesta vede přes JEDNO procento: spočítej ho a pak ho vynásob.',
        '1 % je setina celku: ' + celek + ' : 100 = ' + cz(celek / 100) + '.',
        p + ' % je ' + p + '× víc: ' + p + ' · ' + cz(celek / 100) + ' = ' + cz(cast) + '.'
      ],
      _check: { kind: 'procCast', p, celek }
    };
  }
  function procZaklad() {
    const p = [10, 20, 25, 50][ri(0, 3)], celek = ri(2, 9) * 100, X = celek * p / 100;
    return {
      prompt: 'Číslo ' + X + ' je ' + p + ' % z nějakého celku. Jak velký je celek?', type: 'text', ans: String(celek),
      sol: [
        'Tady je to obráceně: znáš část a hledáš CELEK. Postup je stejný přes jedno procento, jen se jde opačným směrem.',
        'Když ' + p + ' % odpovídá ' + X + ', pak 1 % je ' + p + '× méně: ' + X + ' : ' + p + ' = ' + cz(X / p) + '.',
        'Celek je 100 %, tedy stonásobek jednoho procenta: ' + cz(X / p) + ' · 100 = ' + celek + '.'
      ],
      _check: { kind: 'procZaklad', X, p }
    };
  }
  function procKolik() {
    const celek = [100, 200, 400, 500][ri(0, 3)], p = ri(1, 19) * 5, X = p * celek / 100;
    return {
      prompt: 'Kolik procent je ' + X + ' z ' + celek + '?', type: 'text', ans: String(p),
      sol: [
        'Ptáme se, jakou ČÁST celku tvoří dané číslo. Nejdřív tu část vyjádři podílem, pak ji převeď na procenta.',
        'Vyděl část celkem: ' + X + ' : ' + celek + ' = ' + cz(X / celek) + '.',
        'Podíl převedeš na procenta vynásobením stem: ' + cz(X / celek) + ' · 100 = ' + p + ' %.'
      ],
      _check: { kind: 'procKolik', X, celek }
    };
  }

  // ── Slovní úlohy ──
  function slovniSoucetRozdil() {
    const vetsi = ri(20, 60), mensi = ri(5, vetsi - 2), S = vetsi + mensi, D = vetsi - mensi;
    return {
      prompt: 'Součet dvou čísel je ' + S + ', jejich rozdíl je ' + D + '. Určete větší z obou čísel.', type: 'text', ans: String(vetsi),
      sol: [
        'Znáš součet i rozdíl dvou čísel. Když je sečteš, menší číslo se vyruší a zbyde dvojnásobek většího.',
        'Sečti součet a rozdíl: ' + S + ' + ' + D + ' = ' + (S + D) + '.',
        'To je dvojnásobek většího čísla, tak vyděl dvěma: ' + (S + D) + ' : 2 = ' + vetsi + '.'
      ],
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

  // ── Statistika a data (rozšíření) ──
  function median5() {
    const vals = []; while (vals.length < 5) { const v = ri(1, 30); if (!vals.includes(v)) vals.push(v); }
    const s = [...vals].sort((a, b) => a - b);
    return {
      prompt: 'Určete medián (prostřední hodnotu) čísel: ' + vals.join(', ') + '.', type: 'text', ans: String(s[2]),
      sol: [
        'Medián je prostřední hodnota — ale až POTOM, co čísla seřadíš. Bez seřazení vyjde nesmysl.',
        'Seřazeno od nejmenšího: ' + s.join(', ') + '.',
        'Hodnot je pět, prostřední je tedy třetí: medián = ' + s[2] + '.'
      ],
      _check: { kind: 'median', vals: vals.slice() }
    };
  }
  function modus() {
    const m = ri(2, 12), arr = [m, m, m];
    while (arr.length < 6) { const v = ri(2, 12); if (v !== m && arr.filter(x => x === v).length < 2) arr.push(v); }
    for (let i = arr.length - 1; i > 0; i--) { const j = ri(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return {
      prompt: 'Určete modus (nejčastější hodnotu) čísel: ' + arr.join(', ') + '.', type: 'text', ans: String(m),
      sol: [
        'Modus je hodnota, která se v souboru vyskytuje NEJČASTĚJI. Nepočítá se, jen se hledá.',
        'Projdi čísla a spočítej výskyty. Nejčastěji se opakuje ' + m + ', a to třikrát.',
        'Modus = ' + m + '.'
      ],
      _check: { kind: 'modus', arr: arr.slice() }
    };
  }
  function rozsah() {
    const vals = []; while (vals.length < 5) { const v = ri(1, 50); if (!vals.includes(v)) vals.push(v); }
    const mx = Math.max(...vals), mn = Math.min(...vals);
    return {
      prompt: 'Určete rozpětí (rozdíl největší a nejmenší hodnoty) čísel: ' + vals.join(', ') + '.', type: 'text', ans: String(mx - mn),
      sol: [
        'Rozpětí (variační rozpětí) říká, jak daleko jsou od sebe krajní hodnoty — největší mínus nejmenší.',
        'Největší je ' + mx + ', nejmenší ' + mn + '.',
        'Rozpětí = ' + mx + ' − ' + mn + ' = ' + (mx - mn) + '.'
      ],
      _check: { kind: 'rozsah', vals: vals.slice() }
    };
  }

  // ── Slovní úlohy (rozšíření) ──
  function pohyb() {
    const v = ri(3, 12) * 5, t = ri(2, 6);
    return {
      prompt: 'Auto jede stálou rychlostí ' + v + ' km/h. Jakou dráhu ujede za ' + t + ' hodiny?', type: 'text', ans: String(v * t),
      sol: [
        'Ujetá dráha je rychlost krát čas. Hlídej si jednotky: rychlost v km/h a čas v hodinách dají kilometry.',
        'Dráha = ' + v + ' · ' + t + ' = ' + (v * t) + ' km.'
      ],
      _check: { kind: 'draha', v, t }
    };
  }
  function cenaDoprava() {
    const a = ri(2, 8), p = ri(20, 90), d = ri(30, 150), total = a * p + d;
    return {
      prompt: 'Objednali jsme ' + a + ' kusy po ' + p + ' Kč a k tomu dopravu ' + d + ' Kč. Kolik Kč zaplatíme celkem?', type: 'text', ans: String(total),
      sol: [
        'Doprava se platí JEDNOU za celou objednávku, ne za každý kus — proto se přičítá až nakonec.',
        'Cena zboží: ' + a + ' · ' + p + ' = ' + (a * p) + ' Kč.',
        'Celkem = ' + (a * p) + ' + ' + d + ' = ' + total + ' Kč.'
      ],
      _check: { kind: 'cenaDoprava', a, p, d }
    };
  }
  function zbyvaPenez() {
    const a = ri(2, 5), p = ri(20, 60), spend = a * p, zbyva = ri(30, 300), M = spend + zbyva;
    return {
      prompt: 'Měli jsme ' + M + ' Kč. Koupili jsme ' + a + ' kusy po ' + p + ' Kč. Kolik Kč nám zbylo?', type: 'text', ans: String(zbyva),
      sol: [
        'Nejdřív spočítej, kolik se utratilo, a teprve to odečti od toho, co bylo na začátku.',
        'Útrata: ' + a + ' · ' + p + ' = ' + spend + ' Kč.',
        'Zbylo = ' + M + ' − ' + spend + ' = ' + zbyva + ' Kč.'
      ],
      _check: { kind: 'zbyva', M, a, p }
    };
  }

  // ── Procenta a finanční matematika (rozšíření) ──
  function slevaCena() {
    const X = ri(1, 9) * 100, p = [10, 20, 25, 50][ri(0, 3)], nova = X - X * p / 100;
    return {
      prompt: 'Zboží stálo ' + X + ' Kč. Sleva je ' + p + ' %. Kolik Kč stojí po slevě?', type: 'text', ans: String(nova),
      sol: [
        'Sleva se počítá z PŮVODNÍ ceny. Spočítej nejdřív, kolik korun sleva dělá, a teprve pak ji odečti.',
        'Sleva ' + p + ' % z ' + X + ' Kč: ' + X + ' · ' + p + ' : 100 = ' + (X * p / 100) + ' Kč.',
        'Nová cena = ' + X + ' − ' + (X * p / 100) + ' = ' + nova + ' Kč.'
      ],
      _check: { kind: 'slevaCena', X, p }
    };
  }
  function navyseniCena() {
    const X = ri(1, 9) * 100, p = [10, 20, 25, 50][ri(0, 3)], nova = X + X * p / 100;
    return {
      prompt: 'Zboží stálo ' + X + ' Kč a zdražilo o ' + p + ' %. Kolik Kč stojí nyní?', type: 'text', ans: String(nova),
      sol: [
        'Zdražení funguje stejně jako sleva, jen se na konci PŘIČÍTÁ. Počítá se také z původní ceny.',
        'Navýšení ' + p + ' % z ' + X + ' Kč: ' + X + ' · ' + p + ' : 100 = ' + (X * p / 100) + ' Kč.',
        'Nová cena = ' + X + ' + ' + (X * p / 100) + ' = ' + nova + ' Kč.'
      ],
      _check: { kind: 'navyseniCena', X, p }
    };
  }
  function urok() {
    const jist = ri(1, 9) * 1000, p = [2, 3, 4, 5][ri(0, 3)], u = jist * p / 100;
    return {
      prompt: 'Uložíme ' + jist + ' Kč s ročním úrokem ' + p + ' %. Kolik Kč činí úrok za jeden rok?', type: 'text', ans: String(u),
      sol: [
        'Roční úrok je prostě procento z uložené částky — počítá se stejně jako každá jiná část celku.',
        'Spočítej ' + p + ' % z ' + jist + ' Kč: ' + jist + ' · ' + p + ' = ' + (jist * p) + '.',
        'Úrok = ' + (jist * p) + ' : 100 = ' + u + ' Kč.'
      ],
      _check: { kind: 'urok', jist, p }
    };
  }

  // ── Zlomky (rozšíření) ──
  function smisene() {
    const cele = ri(1, 5), { p, q } = zlomek(2, 8);
    return {
      prompt: 'Kolik zlomků 1/' + q + ' je celkem v ' + cele + ' celcích a ' + p + '/' + q + '?', type: 'text', ans: String(cele * q + p),
      sol: [
        'Smíšené číslo převedeš na zlomek tak, že celky rozdrobíš na díly a přičteš k nim zbytek.',
        'V ' + cele + ' celcích je ' + cele + ' · ' + q + ' = ' + (cele * q) + ' dílů velikosti 1/' + q + '.',
        'Přičti zbývající díly: ' + (cele * q) + ' + ' + p + ' = ' + (cele * q + p) + '.'
      ],
      _check: { kind: 'smisene', cele, q, p }
    };
  }
  function zlomekRozsir() {
    const { p, q } = zlomek(2, 6), k = ri(2, 5), q2 = q * k;
    return {
      prompt: 'Doplňte čitatele: ' + p + '/' + q + ' = ?/' + q2 + '.', type: 'text', ans: String(p * k),
      sol: [
        'Rozšiřování zlomek NEMĚNÍ, jen ho zapisuje jinak — proto se čitatel i jmenovatel musí násobit STEJNÝM číslem.',
        'Jmenovatel se zvětšil z ' + q + ' na ' + q2 + ', tedy ' + q2 + ' : ' + q + ' = ' + k + '×.',
        'Stejně zvětši čitatele: ' + p + ' · ' + k + ' = ' + (p * k) + '.'
      ],
      _check: { kind: 'zlomekRozsir', p, q, q2 }
    };
  }
  function castJeCelek() {
    const q = ri(2, 6), jednotka = ri(3, 15), celek = jednotka * q;
    return {
      prompt: 'Zlomek 1/' + q + ' třídy je ' + jednotka + ' žáků. Kolik žáků má celá třída?', type: 'text', ans: String(celek),
      sol: [
        'Tady znáš JEDEN díl a hledáš celek — postup je tedy obrácený než obvykle a místo dělení se násobí.',
        'Celek se skládá z ' + q + ' takových dílů: ' + q + ' · ' + jednotka + ' = ' + celek + ' žáků.'
      ],
      _check: { kind: 'castJeCelek', jednotka, q }
    };
  }

  // ── Mocniny a odmocniny (rozšíření) ──
  function mocnina10() {
    const n = ri(2, 5), v = 10 ** n, sup = ['', '', '²', '³', '⁴', '⁵'][n];
    return {
      prompt: 'Vypočtěte 10' + sup + '.', type: 'text', ans: String(v),
      sol: [
        'Mocnina desíti s exponentem ' + n + ' znamená ' + n + ' desítek vynásobených mezi sebou.',
        'Ve výsledku je proto jednička a za ní ' + n + ' nul: 10' + sup + ' = ' + v + '.'
      ],
      _check: { kind: 'mocnina10', n }
    };
  }
  function kvadratSouctu() {
    const a = ri(2, 8), b = ri(2, 8), v = (a + b) ** 2;
    return {
      prompt: 'Vypočtěte (' + a + ' + ' + b + ')².', type: 'text', ans: String(v),
      sol: [
        'Závorka má přednost před mocninou, takže se nejdřív sčítá. Umocnit každé číslo zvlášť by byla chyba.',
        'Součet v závorce: ' + a + ' + ' + b + ' = ' + (a + b) + '.',
        'Teď umocni: ' + (a + b) + '² = ' + (a + b) + ' · ' + (a + b) + ' = ' + v + '.'
      ],
      _check: { kind: 'kvadratSouctu', a, b }
    };
  }
  function odmocninaSoucin() {
    const a = ri(2, 9), b = ri(2, 9);
    return {
      prompt: 'Vypočtěte √(' + (a * a) + ' · ' + (b * b) + ').', type: 'text', ans: String(a * b),
      sol: [
        'Odmocnina součinu se dá rozdělit: √(x · y) = √x · √y. Často je to rychlejší než násobit a odmocňovat až potom.',
        'Odmocni každý činitel zvlášť: √' + (a * a) + ' = ' + a + ' a √' + (b * b) + ' = ' + b + '.',
        'Výsledek = ' + a + ' · ' + b + ' = ' + (a * b) + '.'
      ],
      _check: { kind: 'odmocninaSoucin', a, b }
    };
  }

  // ── Výrazy s proměnnou (rozšíření) ──
  function dosazeniDve() {
    const a = ri(2, 6), b = ri(2, 6), v = ri(2, 7), w = ri(2, 7);
    return {
      prompt: 'Vypočtěte hodnotu výrazu ' + a + 'x + ' + b + 'y pro x = ' + v + ' a y = ' + w + '.', type: 'text', ans: String(a * v + b * w),
      sol: [
        'Dosaď obě proměnné a spočítej každý součin zvlášť — teprve pak sčítej.',
        'První součin: ' + a + ' · ' + v + ' = ' + (a * v) + '. Druhý: ' + b + ' · ' + w + ' = ' + (b * w) + '.',
        'Sečti: ' + (a * v) + ' + ' + (b * w) + ' = ' + (a * v + b * w) + '.'
      ],
      _check: { kind: 'dosazeniDve', a, b, v, w }
    };
  }
  function vyrazSlovni() {
    const pl = ri(2, 9), mul = ri(2, 5), v = ri(2, 9);
    return {
      prompt: 'Číslo x zvětšíme o ' + pl + ' a součet vynásobíme ' + mul + '. Jaká je hodnota výrazu pro x = ' + v + '?', type: 'text', ans: String(mul * (v + pl)),
      sol: [
        'Přečti zadání po krocích v tom pořadí, v jakém je napsané — nejdřív zvětšit, pak vynásobit.',
        'Zvětši o ' + pl + ': ' + v + ' + ' + pl + ' = ' + (v + pl) + '.',
        'Vynásob ' + mul + ': ' + mul + ' · ' + (v + pl) + ' = ' + (mul * (v + pl)) + '.'
      ],
      _check: { kind: 'vyrazSlovni', pl, mul, v }
    };
  }

  // ── Rovnice (rozšíření) ──
  function rovniceZavorka() {
    const a = ri(2, 6), x = ri(2, 9), b = ri(1, 8), c = a * (x + b);
    return {
      prompt: 'Vyřešte rovnici a napište kořen x: ' + a + '·(x + ' + b + ') = ' + c + '.', type: 'text', ans: String(x),
      sol: [
        'Závorka je vynásobená číslem ' + a + '. Buď ji roznásobíš, nebo — jednodušeji — obě strany hned vydělíš tím číslem.',
        'Vyděl obě strany ' + a + ': x + ' + b + ' = ' + c + ' : ' + a + ' = ' + cz(c / a) + '.',
        'Odečti ' + b + ': x = ' + cz(c / a) + ' − ' + b + ' = ' + x + '.'
      ],
      _check: { kind: 'rovniceZavorka', a, b, c }
    };
  }
  function rovniceObeStrany() {
    const x = ri(2, 9), a = ri(3, 7), c = ri(2, a - 1), b = ri(1, 9), d = (a - c) * x + b;
    return {
      prompt: 'Vyřešte rovnici a napište kořen x: ' + a + 'x + ' + b + ' = ' + c + 'x + ' + d + '.', type: 'text', ans: String(x),
      sol: [
        'Neznámá je na OBOU stranách. Posbírej všechny členy s x na jednu stranu a čísla na druhou.',
        'Členy s x vlevo, čísla vpravo: ' + a + 'x − ' + c + 'x = ' + d + ' − ' + b + '.',
        'Sečti, co je stejné: ' + (a - c) + 'x = ' + (d - b) + '.',
        'Vyděl ' + (a - c) + ': x = ' + (d - b) + ' : ' + (a - c) + ' = ' + x + '.'
      ],
      _check: { kind: 'rovniceObeStrany', a, b, c, d }
    };
  }

  // ── Poměr a úměrnost (rozšíření) ──
  function pomerDoplnit() {
    const a = ri(2, 6), k = ri(2, 8), b = a * k, c = ri(2, 9);
    return {
      prompt: 'Doplňte chybějící člen úměry: ' + a + ' : ' + b + ' = ' + c + ' : ?', type: 'text', ans: String(c * k),
      sol: [
        'Aby poměr zůstal stejný, musí se OBĚ čísla zvětšit stejněkrát. Zjisti tedy nejdřív, kolikrát.',
        'Z ' + a + ' na ' + b + ' je to ' + b + ' : ' + a + ' = ' + k + '×.',
        'Stejně vynásob druhé číslo: ' + c + ' · ' + k + ' = ' + (c * k) + '.'
      ],
      _check: { kind: 'pomerDoplnit', a, b, c }
    };
  }

  // ── Geometrie v rovině ──
  function obvodObdelnikG() {
    const a = ri(3, 20), b = ri(3, 20);
    return {
      prompt: 'Obdélník má strany ' + a + ' cm a ' + b + ' cm. Jaký je jeho obvod (v cm)?', type: 'text', ans: String(2 * (a + b)),
      sol: [
        'Obvod je součet všech čtyř stran. Protější strany obdélníku jsou stejné, takže stačí sečíst dvě sousední a výsledek zdvojnásobit: o = 2 · (a + b).',
        'Sečti sousední strany: ' + a + ' + ' + b + ' = ' + (a + b) + ' cm.',
        'Obvod = 2 · ' + (a + b) + ' = ' + (2 * (a + b)) + ' cm.'
      ], _check: { kind: 'obvodObd', a, b }
    };
  }
  function obsahObdelnikG() {
    const a = ri(3, 20), b = ri(3, 20);
    return {
      prompt: 'Obdélník má strany ' + a + ' cm a ' + b + ' cm. Jaký je jeho obsah (v cm²)?', type: 'text', ans: String(a * b),
      sol: [
        'Obsah obdélníku je součin dvou SOUSEDNÍCH stran: S = a · b. (Pozor, ne obvod — ten se sčítá.)',
        'Dosaď strany: S = ' + a + ' · ' + b + '.',
        'Obsah = ' + a + ' · ' + b + ' = ' + (a * b) + ' cm².'
      ], _check: { kind: 'obsahObd', a, b }
    };
  }
  function ctverecG() {
    const a = ri(3, 20);
    return ri(0, 1)
      ? { prompt: 'Čtverec má stranu ' + a + ' cm. Jaký je jeho obsah (v cm²)?', type: 'text', ans: String(a * a), sol: [
          'Čtverec má všechny strany stejně dlouhé, takže obsah je strana krát strana: S = a².',
          'Dosaď stranu: S = ' + a + '².',
          'Obsah = ' + a + ' · ' + a + ' = ' + (a * a) + ' cm².'
        ], _check: { kind: 'obsahCtverec', a } }
      : { prompt: 'Čtverec má stranu ' + a + ' cm. Jaký je jeho obvod (v cm)?', type: 'text', ans: String(4 * a), sol: [
          'Čtverec má čtyři stejně dlouhé strany, takže obvod je čtyřnásobek strany: o = 4 · a.',
          'Obvod = 4 · ' + a + ' = ' + (4 * a) + ' cm.'
        ], _check: { kind: 'obvodCtverec', a } };
  }
  function obsahTrojuhelnikG() {
    const a = ri(2, 12) * 2, v = ri(3, 15);
    return {
      prompt: 'Trojúhelník má stranu ' + a + ' cm a výšku k této straně ' + v + ' cm. Jaký je jeho obsah (v cm²)?', type: 'text', ans: String(a * v / 2),
      sol: [
        'Trojúhelník je přesně POLOVINA rovnoběžníku se stejnou základnou i výškou — proto se na konci dělí dvěma: S = (z · v) : 2.',
        'Nejdřív vynásob základnu výškou: ' + a + ' · ' + v + ' = ' + (a * v) + '.',
        'Obsah = ' + (a * v) + ' : 2 = ' + (a * v / 2) + ' cm².'
      ], _check: { kind: 'obsahTroj', a, v }
    };
  }
  function uhelVedlejsi() {
    const x = ri(20, 160);
    return {
      prompt: 'Vypočítejte velikost vedlejšího úhlu k úhlu ' + x + '°.', type: 'text', ans: String(180 - x),
      sol: [
        'Vedlejší úhly leží vedle sebe u téže přímky a dohromady tvoří úhel přímý, tedy 180°.',
        'Hledaný úhel proto dopočítáš odečtením od 180°.',
        'Vedlejší úhel = 180 − ' + x + ' = ' + (180 - x) + '°.'
      ], _check: { kind: 'uhelVedlejsi', x }
    };
  }
  function pythagorasG() {
    const tr = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]][ri(0, 4)];
    return {
      prompt: 'Pravoúhlý trojúhelník má odvěsny ' + tr[0] + ' cm a ' + tr[1] + ' cm. Jak dlouhá je přepona (v cm)?', type: 'text', ans: String(tr[2]),
      sol: [
        'Přepona leží naproti pravému úhlu a je vždy nejdelší. Platí pro ni Pythagorova věta: c² = a² + b².',
        'Umocni obě odvěsny: ' + tr[0] + '² = ' + (tr[0] * tr[0]) + ' a ' + tr[1] + '² = ' + (tr[1] * tr[1]) + '.',
        'Sečti je: c² = ' + (tr[0] * tr[0]) + ' + ' + (tr[1] * tr[1]) + ' = ' + (tr[0] * tr[0] + tr[1] * tr[1]) + '.',
        'Teď jsi spočítal DRUHOU MOCNINU přepony, ne přeponu — odmocni ji: c = √' + (tr[0] * tr[0] + tr[1] * tr[1]) + ' = ' + tr[2] + ' cm.'
      ], _check: { kind: 'pythag', a: tr[0], b: tr[1] }
    };
  }

  // ── Tělesa (objem a povrch) ──
  function objemKvadrT() {
    const a = ri(2, 10), b = ri(2, 10), c = ri(2, 10);
    return {
      prompt: 'Kvádr má hrany ' + a + ' cm, ' + b + ' cm a ' + c + ' cm. Jaký je jeho objem (v cm³)?', type: 'text', ans: String(a * b * c),
      sol: [
        'Objem říká, kolik se dovnitř VEJDE. U kvádru se násobí všechny tři rozměry: V = a · b · c.',
        'Vynásob první dva rozměry (to je obsah podstavy): ' + a + ' · ' + b + ' = ' + (a * b) + ' cm².',
        'Objem = ' + (a * b) + ' · ' + c + ' = ' + (a * b * c) + ' cm³.'
      ], _check: { kind: 'objemKvadr', a, b, c }
    };
  }
  function povrchKvadrT() {
    const a = ri(2, 10), b = ri(2, 10), c = ri(2, 10);
    return {
      prompt: 'Kvádr má hrany ' + a + ' cm, ' + b + ' cm a ' + c + ' cm. Jaký je jeho povrch (v cm²)?', type: 'text', ans: String(2 * (a * b + b * c + a * c)),
      sol: [
        'Povrch je plocha VŠECH stěn dohromady. Kvádr má 6 stěn, ale vždy dvě a dvě jsou stejné, takže stačí spočítat tři různé a zdvojnásobit: S = 2 · (ab + bc + ac).',
        'Spočítej tři různé stěny: ' + a + '·' + b + ' = ' + (a * b) + ', ' + b + '·' + c + ' = ' + (b * c) + ', ' + a + '·' + c + ' = ' + (a * c) + ' cm².',
        'Sečti je: ' + (a * b) + ' + ' + (b * c) + ' + ' + (a * c) + ' = ' + (a * b + b * c + a * c) + ' cm².',
        'Povrch = 2 · ' + (a * b + b * c + a * c) + ' = ' + (2 * (a * b + b * c + a * c)) + ' cm².'
      ], _check: { kind: 'povrchKvadr', a, b, c }
    };
  }
  function krychleT() {
    const a = ri(2, 12);
    return ri(0, 1)
      ? { prompt: 'Krychle má hranu ' + a + ' cm. Jaký je její objem (v cm³)?', type: 'text', ans: String(a * a * a), sol: [
          'Krychle je kvádr, který má všechny hrany stejné, takže se hrana násobí sama sebou třikrát: V = a³.',
          'Dosaď hranu: V = ' + a + '³ = ' + a + ' · ' + a + ' · ' + a + '.',
          'Objem = ' + (a * a) + ' · ' + a + ' = ' + (a * a * a) + ' cm³.'
        ], _check: { kind: 'objemKrychle', a } }
      : { prompt: 'Krychle má hranu ' + a + ' cm. Jaký je její povrch (v cm²)?', type: 'text', ans: String(6 * a * a), sol: [
          'Krychle má 6 stejných čtvercových stěn, takže povrch je šestinásobek obsahu jedné stěny: S = 6 · a².',
          'Obsah jedné stěny: ' + a + '² = ' + (a * a) + ' cm².',
          'Povrch = 6 · ' + (a * a) + ' = ' + (6 * a * a) + ' cm².'
        ], _check: { kind: 'povrchKrychle', a } };
  }
  function hranyKvadrT() {
    const a = ri(2, 10), b = ri(2, 10), c = ri(2, 10);
    return {
      prompt: 'Kvádr má hrany ' + a + ' cm, ' + b + ' cm a ' + c + ' cm. Jaký je součet délek všech jeho hran (v cm)?', type: 'text', ans: String(4 * (a + b + c)),
      sol: [
        'Kvádr má 12 hran — od každého ze tří rozměrů právě čtyři stejné. Proto se sečtou tři rozměry a výsledek se vynásobí čtyřmi.',
        'Sečti rozměry: ' + a + ' + ' + b + ' + ' + c + ' = ' + (a + b + c) + ' cm.',
        'Součet hran = 4 · ' + (a + b + c) + ' = ' + (4 * (a + b + c)) + ' cm.'
      ], _check: { kind: 'hranyKvadr', a, b, c }
    };
  }
  function objemKvadrLitr() {
    const a = ri(1, 5) * 10, b = ri(1, 5) * 10, c = ri(1, 5) * 10;
    return {
      prompt: 'Nádrž tvaru kvádru má rozměry ' + a + ' cm × ' + b + ' cm × ' + c + ' cm. Kolik litrů vody se do ní vejde? (1 l = 1000 cm³)', type: 'text', ans: String(a * b * c / 1000),
      sol: [
        'Nejdřív spočítej objem v krychlových centimetrech: V = a · b · c.',
        'Vynásob rozměry: ' + a + ' · ' + b + ' · ' + c + ' = ' + (a * b * c) + ' cm³.',
        'Teprve teď převeď na litry. Jeden litr je 1000 cm³, takže se DĚLÍ tisícem.',
        'Objem = ' + (a * b * c) + ' : 1000 = ' + cz(a * b * c / 1000) + ' l.'
      ], _check: { kind: 'objemLitr', a, b, c }
    };
  }

  /* ════════ ROZŠÍŘENÍ BANKY (Fáze 3c) ════════
     Adaptivní procvičování posílá žáka do slabého okruhu opakovaně, takže
     5 generátorů na okruh se rychle „ohraje". Tady je +2 na každý okruh,
     vždy JINÝ typ úvahy (ne přebarvená stejná úloha). Stejná pravidla:
     formální tón, celočíselný výsledek zaručený konstrukcí, vyřešený postup
     a `_check` pro nezávislý přepočet v testu. */

  // ── Výrazy, mocniny a odmocniny ──
  function poradiOperaci() {
    const a = ri(2, 9), b = ri(2, 9), c = ri(2, 9), k = ri(2, 9), sq = k * k;
    const res = a * a + b * c - k;
    return {
      prompt: 'Vypočítejte: ' + a + '² + ' + b + ' · ' + c + ' − √' + sq + '.',
      type: 'text', ans: String(res),
      sol: a + '² = ' + (a * a) + '; ' + b + ' · ' + c + ' = ' + (b * c) + '; √' + sq + ' = ' + k +
           '. Celkem ' + (a * a) + ' + ' + (b * c) + ' − ' + k + ' = ' + res + '.',
      _check: { kind: 'poradiOperaci', a, b, c, sq }
    };
  }
  function rozdilMocnin() {
    const a = ri(6, 15), b = ri(2, a - 1);
    return {
      prompt: 'Vypočítejte hodnotu výrazu ' + a + '² − ' + b + '².',
      type: 'text', ans: String(a * a - b * b),
      sol: a + '² = ' + (a * a) + ', ' + b + '² = ' + (b * b) + '. Rozdíl je ' + (a * a) + ' − ' + (b * b) + ' = ' + (a * a - b * b) + '.',
      _check: { kind: 'rozdilMocnin', a, b }
    };
  }

  // ── Zlomky ──
  function zlomekZCasti() {
    const f1 = zlomek(2, 5), f2 = zlomek(2, 5);
    const q = f1.q, p = f1.p, s = f2.q, r = f2.p, base = ri(2, 10);
    const celek = q * s * base, prvni = celek / q * p, druhy = prvni / s * r;
    return {
      prompt: 'Ve skladu je ' + celek + ' kusů. Zmetky tvoří ' + p + '/' + q + ' z tohoto počtu. Z nich lze opravit ' +
              r + '/' + s + '. Kolik kusů lze opravit?',
      type: 'text', ans: String(druhy),
      sol: [
        'Pozor na to, z ČEHO se druhý zlomek počítá: ne z celku, ale ze zmetků. Odtud plyne pořadí kroků.',
        'Zmetky: ' + celek + ' : ' + q + ' · ' + p + ' = ' + prvni + ' kusů.',
        'Opravitelné se počítají z těchto ' + prvni + ' kusů: ' + prvni + ' : ' + s + ' · ' + r + ' = ' + druhy + ' kusů.'
      ],
      _check: { kind: 'zlomekZCasti', celek, p, q, r, s }
    };
  }
  function zlomekZbytekDvakrat() {
    const f1 = zlomek(2, 5), f2 = zlomek(2, 5);
    const q = f1.q, p = f1.p, s = f2.q, r = f2.p, base = ri(2, 10);
    const celek = q * s * base, po1 = celek - celek / q * p, po2 = po1 - po1 / s * r;
    return {
      prompt: 'V nádrži bylo ' + celek + ' litrů vody. Nejprve odčerpali ' + p + '/' + q +
              ' obsahu, poté ' + r + '/' + s + ' zbytku. Kolik litrů v nádrži zůstalo?',
      type: 'text', ans: String(po2),
      sol: [
        'Druhý odběr se počítá ze ZBYTKU po prvním, ne z původního množství. Proto se musí počítat postupně.',
        'První odběr: ' + celek + ' : ' + q + ' · ' + p + ' = ' + cz(celek / q * p) + ' l, zbývá ' + cz(po1) + ' l.',
        'Druhý odběr z těch ' + cz(po1) + ' l: ' + po1 + ' : ' + s + ' · ' + r + ' = ' + cz(po1 / s * r) + ' l.',
        'Zbývá ' + cz(po1) + ' − ' + cz(po1 / s * r) + ' = ' + cz(po2) + ' l.'
      ],
      _check: { kind: 'zlomekZbytekDvakrat', celek, p, q, r, s }
    };
  }

  // ── Procenta a finanční matematika ──
  function dveSlevy() {
    const opts = [10, 20, 25, 50], p = opts[ri(0, 3)], r = opts[ri(0, 3)], X = ri(1, 5) * 2000;
    const po1 = X * (100 - p) / 100, po2 = po1 * (100 - r) / 100;
    return {
      prompt: 'Zboží za ' + X + ' Kč bylo zlevněno o ' + p + ' %. Následně byla nová cena zlevněna ještě o ' + r +
              ' %. Kolik Kč stojí zboží po obou slevách?',
      type: 'text', ans: String(po2),
      sol: [
        'Druhá sleva se počítá z ceny PO první slevě, ne z původní. Proto se slevy nesčítají a musí se počítat postupně.',
        'Po první slevě zbyde ' + (100 - p) + ' % původní ceny: ' + X + ' · ' + (100 - p) + ' : 100 = ' + cz(po1) + ' Kč.',
        'Z této nové ceny zbyde po druhé slevě ' + (100 - r) + ' %: ' + cz(po1) + ' · ' + (100 - r) + ' : 100 = ' + cz(po2) + ' Kč.',
        'Kdo slevy sečte na ' + (p + r) + ' %, dostane ' + cz(X * (100 - p - r) / 100) + ' Kč — a to je špatně. Správná odpověď je ' + cz(po2) + ' Kč.'
      ],
      _check: { kind: 'dveSlevy', X, p, r }
    };
  }
  function dph() {
    const base = ri(2, 40) * 100, dan = base * 21 / 100;
    return {
      prompt: 'Cena zboží bez DPH je ' + base + ' Kč. Sazba DPH je 21 %. Kolik Kč stojí zboží včetně DPH?',
      type: 'text', ans: String(base + dan),
      sol: [
        'DPH se přičítá k ceně bez daně. Spočítej tedy nejdřív samotnou daň a pak ji připočti.',
        'DPH je 21 % z ' + base + ' Kč: ' + base + ' · 21 = ' + (base * 21) + '.',
        'Daň = ' + (base * 21) + ' : 100 = ' + cz(dan) + ' Kč.',
        'Cena s DPH = ' + base + ' + ' + cz(dan) + ' = ' + cz(base + dan) + ' Kč.'
      ],
      _check: { kind: 'dph', base }
    };
  }

  // ── Poměr a úměrnost ──
  function pomerTri() {
    const a = ri(1, 6), b = ri(1, 6), c = ri(1, 6), dil = ri(10, 60);
    const total = dil * (a + b + c), max = Math.max(a, b, c);
    return {
      prompt: 'Částku ' + total + ' Kč rozdělte v poměru ' + a + ' : ' + b + ' : ' + c +
              '. Kolik Kč připadne na největší díl?',
      type: 'text', ans: String(max * dil),
      sol: [
        'I u tří čísel je postup stejný: sečti všechny díly poměru a zjisti, kolik je jeden díl.',
        'Součet dílů: ' + a + ' + ' + b + ' + ' + c + ' = ' + (a + b + c) + '.',
        'Jeden díl: ' + total + ' : ' + (a + b + c) + ' = ' + dil + ' Kč.',
        'Největší podíl má ' + max + ' dílů: ' + max + ' · ' + dil + ' = ' + (max * dil) + ' Kč.'
      ],
      _check: { kind: 'pomerTri', total, a, b, c }
    };
  }
  function recept() {
    const per = ri(20, 120), n1 = ri(2, 6), n2 = ri(7, 14), X = per * n1, Y = per * n2;
    // 2–4 porce, 5+ porcí (bez skloňování by vyšlo „na 2 porcí")
    const porce = n => (n >= 2 && n <= 4) ? 'porce' : 'porcí';
    return {
      prompt: 'Na ' + n1 + ' ' + porce(n1) + ' je potřeba ' + X + ' g mouky. Na kolik porcí vystačí ' + Y + ' g mouky?',
      type: 'text', ans: String(n2),
      sol: [
        'Cesta vede přes JEDNU porci — spočítej, kolik gramů potřebuje, a pak se zeptej, kolikrát se to vejde do zásoby.',
        'Na jednu porci: ' + X + ' : ' + n1 + ' = ' + per + ' g.',
        'Počet porcí = ' + Y + ' : ' + per + ' = ' + n2 + '.'
      ],
      _check: { kind: 'recept', n1, X, Y }
    };
  }

  // ── Výrazy s proměnnou ──
  function dosazeniZlomek() {
    const c = ri(2, 6), v = ri(2, 12), a = ri(2, 9), t = a * v;
    const b = (c - t % c) % c + c * ri(1, 5), res = (t + b) / c;
    return {
      prompt: 'Určete hodnotu výrazu (' + a + 'x + ' + b + ') : ' + c + ' pro x = ' + v + '.',
      type: 'text', ans: String(res),
      sol: [
        'Zlomková čára je závorka: celý čitatel se musí spočítat dřív, než se dělí.',
        'Čitatel po dosazení x = ' + v + ': ' + a + ' · ' + v + ' + ' + b + ' = ' + t + ' + ' + b + ' = ' + (t + b) + '.',
        'Teprve teď vyděl: ' + (t + b) + ' : ' + c + ' = ' + cz(res) + '.'
      ],
      _check: { kind: 'dosazeniZlomek', a, b, c, v }
    };
  }
  function obvodVyraz() {
    const x = ri(3, 15), k = ri(1, 9);
    return {
      prompt: 'Obdélník má jednu stranu x cm a druhou o ' + k + ' cm delší. Jaký je jeho obvod v cm pro x = ' + x + '?',
      type: 'text', ans: String(4 * x + 2 * k),
      sol: [
        'Nejdřív si z popisu urči obě strany, teprve pak počítej obvod.',
        'Strany jsou ' + x + ' cm a ' + (x + k) + ' cm, jejich součet je ' + (2 * x + k) + ' cm.',
        'Obvod = 2 · ' + (2 * x + k) + ' = ' + (4 * x + 2 * k) + ' cm.'
      ],
      _check: { kind: 'obvodVyraz', x, k }
    };
  }

  // ── Rovnice ──
  function rovniceDvojiZavorka() {
    const x = ri(2, 12), a = ri(3, 9), b = ri(1, 9), t = a * (x + b);
    const div = [];
    for (let c = 2; c <= 9; c++) if (c !== a && t % c === 0 && t / c - x >= 1) div.push(c);
    if (!div.length) return rovnicePodil();
    const c = div[ri(0, div.length - 1)], d = t / c - x;
    return {
      prompt: 'Řešte rovnici ' + a + '(x + ' + b + ') = ' + c + '(x + ' + d + ').',
      type: 'text', ans: String(x),
      sol: [
        'Závorky jsou na obou stranách — nejdřív je roznásob, teprve pak se dá třídit.',
        'Po roznásobení: ' + a + 'x + ' + (a * b) + ' = ' + c + 'x + ' + (c * d) + '.',
        'Členy s x doleva, čísla doprava: ' + (a - c) + 'x = ' + (c * d) + ' − ' + (a * b) + ' = ' + (c * d - a * b) + '.',
        'Vyděl ' + (a - c) + ': x = ' + (c * d - a * b) + ' : ' + (a - c) + ' = ' + x + '.'
      ],
      _check: { kind: 'rovniceDvojiZavorka', a, b, c, d }
    };
  }
  function rovnicePodil() {
    // konstrukce od výsledku: x + b = a·k, takže dělení vždy vyjde celé
    const a = ri(2, 9), k = ri(2, 12), b = ri(1, 12), x = a * k - b;
    return {
      prompt: 'Řešte rovnici (x + ' + b + ') : ' + a + ' = ' + k + '.',
      type: 'text', ans: String(x),
      sol: [
        'Zlomku se zbavíš tak, že OBĚ strany vynásobíš jmenovatelem — pak se počítá bez lomítek.',
        'Vynásob ' + a + ': x + ' + b + ' = ' + a + ' · ' + k + ' = ' + (a * k) + '.',
        'Odečti ' + b + ': x = ' + (a * k) + ' − ' + b + ' = ' + x + '.'
      ],
      _check: { kind: 'rovnicePodil', a, b, k }
    };
  }

  // ── Slovní úlohy ──
  function vek() {
    // věkový rozdíl volíme jako první, ať vyjde realistický rodič (22–34 let)
    const S = ri(6, 14), gap = ri(22, 34), F = S + gap, t = gap - S;
    return {
      prompt: 'Otci je ' + F + ' let, synovi ' + S + ' let. Za kolik let bude otec právě dvakrát starší než syn?',
      type: 'text', ans: String(t),
      sol: [
        'Za t let budou OBA o t let starší — proto t přibude na obou stranách rovnice, ne jen na jedné.',
        'Rovnice: ' + F + ' + t = 2 · (' + S + ' + t).',
        'Roznásob pravou stranu: ' + F + ' + t = ' + (2 * S) + ' + 2t.',
        'Převeď t doprava a čísla doleva: t = ' + F + ' − ' + (2 * S) + ' = ' + t + ' let.'
      ],
      _check: { kind: 'vek', F, S }
    };
  }
  function smes() {
    const a = ri(2, 8), b = ri(2, 8), p = ri(20, 60);
    // ceny se MUSÍ lišit (jinak je „směs" dvou stejných cen nesmyslná úloha)
    let q = ri(20, 60), tries = 0;
    while (tries++ < 80 && (q === p || (a * p + b * q) % (a + b) !== 0)) q = ri(20, 60);
    if (q === p || (a * p + b * q) % (a + b) !== 0) return smesFallback(a, b, p);
    const total = a * p + b * q, kg = a + b;
    return {
      prompt: 'Smícháme ' + a + ' kg zboží po ' + p + ' Kč/kg a ' + b + ' kg zboží po ' + q +
              ' Kč/kg. Kolik Kč stojí 1 kg vzniklé směsi?',
      type: 'text', ans: String(total / kg),
      sol: [
        'Průměrná cena směsi není průměr obou cen — záleží na tom, kolik čeho je. Musí se přes celkovou cenu.',
        'Celková cena: ' + a + ' · ' + p + ' + ' + b + ' · ' + q + ' = ' + (a * p) + ' + ' + (b * q) + ' = ' + total + ' Kč.',
        'Celková hmotnost: ' + a + ' + ' + b + ' = ' + kg + ' kg.',
        'Cena za kilogram = ' + total + ' : ' + kg + ' = ' + cz(total / kg) + ' Kč/kg.'
      ],
      _check: { kind: 'smes', a, p, b, q }
    };
  }
  function smesFallback(a, b, p) {
    // spolehlivá konstrukce s RŮZNÝMI cenami: průměr posuneme o celý krok
    const kg = a + b, per = p + b, total = kg * per, q = (total - a * p) / b;
    return {
      prompt: 'Smícháme ' + a + ' kg zboží po ' + p + ' Kč/kg a ' + b + ' kg zboží po ' + q +
              ' Kč/kg. Kolik Kč stojí 1 kg vzniklé směsi?',
      type: 'text', ans: String(per),
      sol: [
        'Průměrná cena směsi není průměr obou cen — záleží na tom, kolik čeho je. Musí se přes celkovou cenu.',
        'Celková cena: ' + a + ' · ' + p + ' + ' + b + ' · ' + q + ' = ' + (a * p) + ' + ' + (b * q) + ' = ' + total + ' Kč.',
        'Celková hmotnost: ' + a + ' + ' + b + ' = ' + kg + ' kg.',
        'Cena za kilogram = ' + total + ' : ' + kg + ' = ' + cz(per) + ' Kč/kg.'
      ],
      _check: { kind: 'smes', a, p, b, q }
    };
  }

  // ── Geometrie v rovině ──
  function lichobeznik() {
    const a = ri(6, 20), c = ri(2, a - 1);
    let v = ri(2, 12);
    if ((a + c) % 2 !== 0 && v % 2 !== 0) v += 1;
    return {
      prompt: 'Lichoběžník má základny ' + a + ' cm a ' + c + ' cm a výšku ' + v + ' cm. Jaký je jeho obsah v cm²?',
      type: 'text', ans: String((a + c) * v / 2),
      sol: [
        'Lichoběžník má dvě rovnoběžné základny různé délky. Obsah se počítá z jejich PRŮMĚRU krát výška: S = (a + c) · v : 2.',
        'Sečti základny: ' + a + ' + ' + c + ' = ' + (a + c) + ' cm.',
        'Vynásob výškou (dělení dvěma nech až nakonec, vyhneš se počítání s polovinami): ' + (a + c) + ' · ' + v + ' = ' + ((a + c) * v) + '.',
        'Obsah = ' + ((a + c) * v) + ' : 2 = ' + ((a + c) * v / 2) + ' cm².'
      ],
      _check: { kind: 'lichobeznik', a, c, v }
    };
  }
  function tretiUhel() {
    const al = ri(20, 90), be = ri(20, Math.max(20, 150 - al));
    return {
      prompt: 'V trojúhelníku ABC je α = ' + al + '° a β = ' + be + '°. Jaká je velikost úhlu γ ve stupních?',
      type: 'text', ans: String(180 - al - be),
      sol: [
        'Součet vnitřních úhlů je v KAŽDÉM trojúhelníku 180° — nezáleží na tom, jak je velký ani jak vypadá.',
        'Třetí úhel proto dopočítáš tak, že od 180° odečteš oba známé.',
        'Odečti první: 180 − ' + al + ' = ' + (180 - al) + '.',
        'γ = ' + (180 - al) + ' − ' + be + ' = ' + (180 - al - be) + '°.'
      ],
      _check: { kind: 'tretiUhel', al, be }
    };
  }

  // ── Tělesa ──
  function hranol() {
    const a = ri(4, 16), va = ri(2, 12), v = ri(3, 15);
    const vv = (a * va) % 2 === 0 ? va : va + 1, Sp = a * vv / 2;
    return {
      prompt: 'Kolmý hranol má podstavu trojúhelníku se stranou ' + a + ' cm a příslušnou výškou ' + vv +
              ' cm. Výška hranolu je ' + v + ' cm. Jaký je jeho objem v cm³?',
      type: 'text', ans: String(Sp * v),
      sol: [
        'Objem každého kolmého hranolu je obsah podstavy krát výška hranolu. Podstava je tady trojúhelník, takže se u ní dělí dvěma.',
        'Obsah podstavy: (' + a + ' · ' + vv + ') : 2 = ' + (a * vv) + ' : 2 = ' + Sp + ' cm².',
        'Pozor, nezaměň výšku PODSTAVY (' + vv + ' cm) s výškou HRANOLU (' + v + ' cm) — to je nejčastější chyba.',
        'Objem = ' + Sp + ' · ' + v + ' = ' + (Sp * v) + ' cm³.'
      ],
      _check: { kind: 'hranol', a, va: vv, v }
    };
  }
  function hranaZObjemu() {
    const a = ri(2, 9), V = a * a * a;
    return {
      prompt: 'Krychle má objem ' + V + ' cm³. Jaká je délka její hrany v cm?',
      type: 'text', ans: String(a),
      sol: [
        'Tohle je úloha obrácená: znáš objem a hledáš hranu. U krychle platí V = a³, takže hrana je TŘETÍ odmocnina objemu.',
        'Hledej číslo, které po vynásobení samo sebou třikrát dá ' + V + '. Zkoušej: ' + a + ' · ' + a + ' = ' + (a * a) + ', a ' + (a * a) + ' · ' + a + ' = ' + V + '.',
        'Hrana měří ' + a + ' cm.'
      ],
      _check: { kind: 'hranaZObjemu', V }
    };
  }

  // ── Tabulky, data a statistika ──
  function prumerChybejici() {
    const n = 5, avg = ri(10, 60);
    const known = [];
    for (let i = 0; i < n - 1; i++) known.push(ri(Math.max(1, avg - 12), avg + 12));
    const sumKnown = known.reduce((x, y) => x + y, 0), missing = n * avg - sumKnown;
    if (missing < 1) return prumerChybejiciSafe(n, avg);
    return {
      prompt: 'Průměr ' + n + ' čísel je ' + avg + '. Čtyři z nich jsou ' + known.join(', ') +
              '. Jaké je páté číslo?',
      type: 'text', ans: String(missing),
      sol: [
        'Z průměru si dopočítej celkový součet — pak už jen odečteš to, co znáš.',
        'Součet všech pěti: ' + n + ' · ' + cz(avg) + ' = ' + (n * avg) + '.',
        'Součet známých čtyř: ' + sumKnown + '.',
        'Páté číslo = ' + (n * avg) + ' − ' + sumKnown + ' = ' + missing + '.'
      ],
      _check: { kind: 'prumerChybejici', n, avg, known }
    };
  }
  function prumerChybejiciSafe(n, avg) {
    const known = [avg, avg, avg, avg], missing = n * avg - avg * 4;
    return {
      prompt: 'Průměr ' + n + ' čísel je ' + avg + '. Čtyři z nich jsou ' + known.join(', ') + '. Jaké je páté číslo?',
      type: 'text', ans: String(missing),
      sol: [
        'Z průměru si zpětně dopočítej celkový součet, pak od něj odečti to, co znáš.',
        'Součet všech pěti = ' + n + ' · ' + avg + ' = ' + (n * avg) + '.',
        'Známé čtyři dávají ' + (avg * 4) + '.',
        'Páté číslo = ' + (n * avg) + ' − ' + (avg * 4) + ' = ' + missing + '.'
      ],
      _check: { kind: 'prumerChybejici', n, avg, known }
    };
  }
  function soucetZPrumeru() {
    const n = ri(4, 12), avg = ri(5, 40);
    return {
      prompt: 'Průměr ' + n + ' naměřených hodnot je ' + avg + '. Jaký je součet všech těchto hodnot?',
      type: 'text', ans: String(n * avg),
      sol: [
        'Z definice průměru platí: průměr = součet : počet. Když hledáš součet, vztah se otočí a NÁSOBÍ se.',
        'Součet = ' + n + ' · ' + avg + ' = ' + (n * avg) + '.'
      ],
      _check: { kind: 'soucetZPrumeru', n, avg }
    };
  }

  window.PZ_GEN = {
    'vyrazy-mocniny': [mocnina, odmocnina, mocninaVyraz, mocnina10, kvadratSouctu, odmocninaSoucin,
                       poradiOperaci, rozdilMocnin],
    'zlomky': [zlomekCelku, zlomekZbytek, zlomekPocet, smisene, zlomekRozsir, castJeCelek,
               zlomekZCasti, zlomekZbytekDvakrat],
    'vyrazy-promenna': [dosazeniLin, dosazeniKvadrat, dosazeniZavorka, dosazeniDve, vyrazSlovni,
                        dosazeniZlomek, obvodVyraz],
    'rovnice': [rovniceLin, rovniceZlomek, rovniceSlovni, rovniceZavorka, rovniceObeStrany,
                rovniceDvojiZavorka, rovnicePodil],
    'procenta': [procCast, procZaklad, procKolik, slevaCena, navyseniCena, urok,
                 dveSlevy, dph],
    'slovni': [slovniSoucetRozdil, slovniNakup, pohyb, cenaDoprava, zbyvaPenez,
               vek, smes],
    'pomer': [deleniVPomeru, primaUmernost, neprimaUmernost, meritko, pomerDoplnit,
              pomerTri, recept],
    'data': [prumer, prumerPridani, median5, modus, rozsah,
             prumerChybejici, soucetZPrumeru],
    'geometrie': [obvodObdelnikG, obsahObdelnikG, ctverecG, obsahTrojuhelnikG, uhelVedlejsi, pythagorasG,
                  lichobeznik, tretiUhel],
    'telesa': [objemKvadrT, povrchKvadrT, krychleT, hranyKvadrT, objemKvadrLitr,
               hranol, hranaZObjemu],
  };
})();
