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

  // ── Statistika a data (rozšíření) ──
  function median5() {
    const vals = []; while (vals.length < 5) { const v = ri(1, 30); if (!vals.includes(v)) vals.push(v); }
    const s = [...vals].sort((a, b) => a - b);
    return {
      prompt: 'Určete medián (prostřední hodnotu) čísel: ' + vals.join(', ') + '.', type: 'text', ans: String(s[2]),
      sol: 'Seřaď od nejmenšího: ' + s.join(', ') + '. Medián je prostřední (třetí) hodnota: ' + s[2] + '.',
      _check: { kind: 'median', vals: vals.slice() }
    };
  }
  function modus() {
    const m = ri(2, 12), arr = [m, m, m];
    while (arr.length < 6) { const v = ri(2, 12); if (v !== m && arr.filter(x => x === v).length < 2) arr.push(v); }
    for (let i = arr.length - 1; i > 0; i--) { const j = ri(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return {
      prompt: 'Určete modus (nejčastější hodnotu) čísel: ' + arr.join(', ') + '.', type: 'text', ans: String(m),
      sol: 'Spočítej, které číslo se opakuje nejčastěji — je to ' + m + ' (třikrát). Modus = ' + m + '.',
      _check: { kind: 'modus', arr: arr.slice() }
    };
  }
  function rozsah() {
    const vals = []; while (vals.length < 5) { const v = ri(1, 50); if (!vals.includes(v)) vals.push(v); }
    const mx = Math.max(...vals), mn = Math.min(...vals);
    return {
      prompt: 'Určete rozpětí (rozdíl největší a nejmenší hodnoty) čísel: ' + vals.join(', ') + '.', type: 'text', ans: String(mx - mn),
      sol: 'Největší hodnota je ' + mx + ', nejmenší ' + mn + '. Rozpětí = ' + mx + ' − ' + mn + ' = ' + (mx - mn) + '.',
      _check: { kind: 'rozsah', vals: vals.slice() }
    };
  }

  // ── Slovní úlohy (rozšíření) ──
  function pohyb() {
    const v = ri(3, 12) * 5, t = ri(2, 6);
    return {
      prompt: 'Auto jede stálou rychlostí ' + v + ' km/h. Jakou dráhu ujede za ' + t + ' hodiny?', type: 'text', ans: String(v * t),
      sol: 'Dráha = rychlost · čas = ' + v + ' · ' + t + ' = ' + (v * t) + ' km.',
      _check: { kind: 'draha', v, t }
    };
  }
  function cenaDoprava() {
    const a = ri(2, 8), p = ri(20, 90), d = ri(30, 150), total = a * p + d;
    return {
      prompt: 'Objednali jsme ' + a + ' kusy po ' + p + ' Kč a k tomu dopravu ' + d + ' Kč. Kolik Kč zaplatíme celkem?', type: 'text', ans: String(total),
      sol: 'Zboží: ' + a + ' · ' + p + ' = ' + (a * p) + ' Kč. Plus doprava ' + d + ' Kč: ' + (a * p) + ' + ' + d + ' = ' + total + ' Kč.',
      _check: { kind: 'cenaDoprava', a, p, d }
    };
  }
  function zbyvaPenez() {
    const a = ri(2, 5), p = ri(20, 60), spend = a * p, zbyva = ri(30, 300), M = spend + zbyva;
    return {
      prompt: 'Měli jsme ' + M + ' Kč. Koupili jsme ' + a + ' kusy po ' + p + ' Kč. Kolik Kč nám zbylo?', type: 'text', ans: String(zbyva),
      sol: 'Utratili jsme ' + a + ' · ' + p + ' = ' + spend + ' Kč. Zbylo ' + M + ' − ' + spend + ' = ' + zbyva + ' Kč.',
      _check: { kind: 'zbyva', M, a, p }
    };
  }

  // ── Procenta a finanční matematika (rozšíření) ──
  function slevaCena() {
    const X = ri(1, 9) * 100, p = [10, 20, 25, 50][ri(0, 3)], nova = X - X * p / 100;
    return {
      prompt: 'Zboží stálo ' + X + ' Kč. Sleva je ' + p + ' %. Kolik Kč stojí po slevě?', type: 'text', ans: String(nova),
      sol: 'Sleva = ' + p + ' % z ' + X + ' = ' + (X * p / 100) + ' Kč. Nová cena = ' + X + ' − ' + (X * p / 100) + ' = ' + nova + ' Kč.',
      _check: { kind: 'slevaCena', X, p }
    };
  }
  function navyseniCena() {
    const X = ri(1, 9) * 100, p = [10, 20, 25, 50][ri(0, 3)], nova = X + X * p / 100;
    return {
      prompt: 'Zboží stálo ' + X + ' Kč a zdražilo o ' + p + ' %. Kolik Kč stojí nyní?', type: 'text', ans: String(nova),
      sol: 'Navýšení = ' + p + ' % z ' + X + ' = ' + (X * p / 100) + ' Kč. Nová cena = ' + X + ' + ' + (X * p / 100) + ' = ' + nova + ' Kč.',
      _check: { kind: 'navyseniCena', X, p }
    };
  }
  function urok() {
    const jist = ri(1, 9) * 1000, p = [2, 3, 4, 5][ri(0, 3)], u = jist * p / 100;
    return {
      prompt: 'Uložíme ' + jist + ' Kč s ročním úrokem ' + p + ' %. Kolik Kč činí úrok za jeden rok?', type: 'text', ans: String(u),
      sol: 'Úrok za rok = ' + p + ' % z ' + jist + ' = ' + jist + ' · ' + p + ' : 100 = ' + u + ' Kč.',
      _check: { kind: 'urok', jist, p }
    };
  }

  // ── Zlomky (rozšíření) ──
  function smisene() {
    const cele = ri(1, 5), q = ri(2, 8), p = ri(1, q - 1);
    return {
      prompt: 'Kolik zlomků 1/' + q + ' je celkem v ' + cele + ' celcích a ' + p + '/' + q + '?', type: 'text', ans: String(cele * q + p),
      sol: 'V ' + cele + ' celcích je ' + cele + ' · ' + q + ' = ' + (cele * q) + ' zlomků 1/' + q + '. Přičti ' + p + ': ' + (cele * q) + ' + ' + p + ' = ' + (cele * q + p) + '.',
      _check: { kind: 'smisene', cele, q, p }
    };
  }
  function zlomekRozsir() {
    const q = ri(2, 6), p = ri(1, q - 1), k = ri(2, 5), q2 = q * k;
    return {
      prompt: 'Doplňte čitatele: ' + p + '/' + q + ' = ?/' + q2 + '.', type: 'text', ans: String(p * k),
      sol: 'Jmenovatel jsme zvětšili ' + k + '× (z ' + q + ' na ' + q2 + '). Stejně zvětši čitatele: ' + p + ' · ' + k + ' = ' + (p * k) + '.',
      _check: { kind: 'zlomekRozsir', p, q, q2 }
    };
  }
  function castJeCelek() {
    const q = ri(2, 6), jednotka = ri(3, 15), celek = jednotka * q;
    return {
      prompt: 'Zlomek 1/' + q + ' třídy je ' + jednotka + ' žáků. Kolik žáků má celá třída?', type: 'text', ans: String(celek),
      sol: 'Celek = ' + q + ' · (jedna ' + q + '-tina) = ' + q + ' · ' + jednotka + ' = ' + celek + ' žáků.',
      _check: { kind: 'castJeCelek', jednotka, q }
    };
  }

  // ── Mocniny a odmocniny (rozšíření) ──
  function mocnina10() {
    const n = ri(2, 5), v = 10 ** n, sup = ['', '', '²', '³', '⁴', '⁵'][n];
    return {
      prompt: 'Vypočtěte 10' + sup + '.', type: 'text', ans: String(v),
      sol: '10' + sup + ' = 1 a ' + n + ' nul = ' + v + '.',
      _check: { kind: 'mocnina10', n }
    };
  }
  function kvadratSouctu() {
    const a = ri(2, 8), b = ri(2, 8), v = (a + b) ** 2;
    return {
      prompt: 'Vypočtěte (' + a + ' + ' + b + ')².', type: 'text', ans: String(v),
      sol: 'Nejdřív součet v závorce: ' + a + ' + ' + b + ' = ' + (a + b) + '. Pak umocni na druhou: ' + (a + b) + '² = ' + v + '.',
      _check: { kind: 'kvadratSouctu', a, b }
    };
  }
  function odmocninaSoucin() {
    const a = ri(2, 9), b = ri(2, 9);
    return {
      prompt: 'Vypočtěte √(' + (a * a) + ' · ' + (b * b) + ').', type: 'text', ans: String(a * b),
      sol: '√(' + (a * a) + ' · ' + (b * b) + ') = √' + (a * a * b * b) + ' = ' + (a * b) + ', protože ' + (a * b) + '² = ' + (a * a * b * b) + '.',
      _check: { kind: 'odmocninaSoucin', a, b }
    };
  }

  // ── Výrazy s proměnnou (rozšíření) ──
  function dosazeniDve() {
    const a = ri(2, 6), b = ri(2, 6), v = ri(2, 7), w = ri(2, 7);
    return {
      prompt: 'Vypočtěte hodnotu výrazu ' + a + 'x + ' + b + 'y pro x = ' + v + ' a y = ' + w + '.', type: 'text', ans: String(a * v + b * w),
      sol: 'Dosaď: ' + a + '·' + v + ' + ' + b + '·' + w + ' = ' + (a * v) + ' + ' + (b * w) + ' = ' + (a * v + b * w) + '.',
      _check: { kind: 'dosazeniDve', a, b, v, w }
    };
  }
  function vyrazSlovni() {
    const pl = ri(2, 9), mul = ri(2, 5), v = ri(2, 9);
    return {
      prompt: 'Číslo x zvětšíme o ' + pl + ' a součet vynásobíme ' + mul + '. Jaká je hodnota výrazu pro x = ' + v + '?', type: 'text', ans: String(mul * (v + pl)),
      sol: 'Zvětši: ' + v + ' + ' + pl + ' = ' + (v + pl) + '. Vynásob ' + mul + ': ' + mul + ' · ' + (v + pl) + ' = ' + (mul * (v + pl)) + '.',
      _check: { kind: 'vyrazSlovni', pl, mul, v }
    };
  }

  // ── Rovnice (rozšíření) ──
  function rovniceZavorka() {
    const a = ri(2, 6), x = ri(2, 9), b = ri(1, 8), c = a * (x + b);
    return {
      prompt: 'Vyřešte rovnici a napište kořen x: ' + a + '·(x + ' + b + ') = ' + c + '.', type: 'text', ans: String(x),
      sol: 'Vyděl ' + a + ': x + ' + b + ' = ' + c + ' : ' + a + ' = ' + (c / a) + '. Odečti ' + b + ': x = ' + (c / a) + ' − ' + b + ' = ' + x + '.',
      _check: { kind: 'rovniceZavorka', a, b, c }
    };
  }
  function rovniceObeStrany() {
    const x = ri(2, 9), a = ri(3, 7), c = ri(2, a - 1), b = ri(1, 9), d = (a - c) * x + b;
    return {
      prompt: 'Vyřešte rovnici a napište kořen x: ' + a + 'x + ' + b + ' = ' + c + 'x + ' + d + '.', type: 'text', ans: String(x),
      sol: 'Členy s x vlevo, čísla vpravo: ' + a + 'x − ' + c + 'x = ' + d + ' − ' + b + ', tedy ' + (a - c) + 'x = ' + (d - b) + '. Vyděl: x = ' + (d - b) + ' : ' + (a - c) + ' = ' + x + '.',
      _check: { kind: 'rovniceObeStrany', a, b, c, d }
    };
  }

  // ── Poměr a úměrnost (rozšíření) ──
  function pomerDoplnit() {
    const a = ri(2, 6), k = ri(2, 8), b = a * k, c = ri(2, 9);
    return {
      prompt: 'Doplňte chybějící člen úměry: ' + a + ' : ' + b + ' = ' + c + ' : ?', type: 'text', ans: String(c * k),
      sol: 'Z ' + a + ' na ' + b + ' násobíme ' + k + '× (' + b + ' : ' + a + ' = ' + k + '). Stejně ' + c + ' · ' + k + ' = ' + (c * k) + '.',
      _check: { kind: 'pomerDoplnit', a, b, c }
    };
  }

  window.PZ_GEN = {
    'vyrazy-mocniny': [mocnina, odmocnina, mocninaVyraz, mocnina10, kvadratSouctu, odmocninaSoucin],
    'zlomky': [zlomekCelku, zlomekZbytek, zlomekPocet, smisene, zlomekRozsir, castJeCelek],
    'vyrazy-promenna': [dosazeniLin, dosazeniKvadrat, dosazeniZavorka, dosazeniDve, vyrazSlovni],
    'rovnice': [rovniceLin, rovniceZlomek, rovniceSlovni, rovniceZavorka, rovniceObeStrany],
    'procenta': [procCast, procZaklad, procKolik, slevaCena, navyseniCena, urok],
    'slovni': [slovniSoucetRozdil, slovniNakup, pohyb, cenaDoprava, zbyvaPenez],
    'pomer': [deleniVPomeru, primaUmernost, neprimaUmernost, meritko, pomerDoplnit],
    'data': [prumer, prumerPridani, median5, modus, rozsah],
  };
})();
