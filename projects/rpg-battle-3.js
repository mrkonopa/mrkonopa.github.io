/* ══════════════════════════════════════════════════════════════════
   RPG Matematika — ŽIVÝ SOUBOJ: banka otázek (3. ročník / Kouzelný les)
   Deterministická: build(seed, count) → stejný seed = stejné otázky.
   Každá: { id, topic, text, choices:[4], correct:0..3, answer }
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const ri = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const S = v => String(v);
  const skl = (n, one, few, many) => { const a = Math.abs(n); return a === 1 ? one : a >= 2 && a <= 4 ? few : many; };

  const GEN = [

    // 1) malá násobilka
    function (r) {
      const a = ri(r, 2, 10), b = ri(r, 2, 10);
      return { topic: 'násobilka', text: `Vypočítej: ${a} × ${b}`, value: a * b,
               distractors: [a * b + b, a * b - a, (a + 1) * b] };
    },

    // 2) dělení bez zbytku
    function (r) {
      const b = ri(r, 2, 10), q = ri(r, 2, 10);
      return { topic: 'dělení', text: `Vypočítej: ${b * q} ÷ ${b}`, value: q,
               distractors: [q + 1, q - 1, q + 2] };
    },

    // 3) sčítání do 1000
    function (r) {
      const a = ri(r, 120, 600), b = ri(r, 80, 350);
      return { topic: 'sčítání', text: `Vypočítej: ${a} + ${b}`, value: a + b,
               distractors: [a + b + 10, a + b - 1, a + b + 100] };
    },

    // 4) odčítání do 1000
    function (r) {
      const b = ri(r, 80, 350), a = b + ri(r, 60, 450);
      return { topic: 'odčítání', text: `Vypočítej: ${a} − ${b}`, value: a - b,
               distractors: [a - b + 10, a + b, a - b - 1] };
    },

    // 5) zaokrouhlování na desítky
    function (r) {
      const n = ri(r, 23, 887);
      const v = Math.round(n / 10) * 10;
      return { topic: 'zaokrouhlování', text: `Zaokrouhli na desítky: ${n} ≈`, value: v,
               distractors: [v + 10, v - 10, Math.round(n / 100) * 100] };
    },

    // 6) zaokrouhlování na stovky
    function (r) {
      const n = ri(r, 130, 870);
      const v = Math.round(n / 100) * 100;
      return { topic: 'zaokrouhlování', text: `Zaokrouhli na stovky: ${n} ≈`, value: v,
               distractors: [v + 100, v - 100, Math.round(n / 10) * 10] };
    },

    // 7) násobení 10
    function (r) {
      const a = ri(r, 2, 9);
      return { topic: 'násobení 10', text: `Vypočítej: ${a} × 10`, value: a * 10,
               distractors: [a * 100, a + 10, a * 10 + 1] };
    },

    // 8) násobení 100
    function (r) {
      const a = ri(r, 2, 9);
      return { topic: 'násobení 100', text: `Vypočítej: ${a} × 100`, value: a * 100,
               distractors: [a * 10, a * 1000, a * 100 + 10] };
    },

    // 9) dělení 10
    function (r) {
      const a = ri(r, 2, 9) * 10;
      return { topic: 'dělení 10', text: `Vypočítej: ${a} ÷ 10`, value: a / 10,
               distractors: [a / 10 + 1, a, a / 10 - 1] };
    },

    // 10) obvod trojúhelníku
    function (r) {
      const a = ri(r, 2, 12), b = ri(r, 2, 12), c = ri(r, 2, 12);
      return { topic: 'obvod', text: `Obvod trojúhelníku se stranami ${a}, ${b}, ${c} cm? (cm)`,
               value: a + b + c, distractors: [a + b + c + 1, a * b, a + b + c - 2] };
    },

    // 11) obvod čtverce
    function (r) {
      const a = ri(r, 2, 15);
      return { topic: 'obvod', text: `Obvod čtverce se stranou ${a} cm? (cm)`, value: 4 * a,
               distractors: [a * a, 2 * a, 4 * a + 2] };
    },

    // 12) obvod obdélníku
    function (r) {
      const a = ri(r, 2, 12), b = ri(r, 2, 9);
      return { topic: 'obvod', text: `Obvod obdélníku ${a} cm a ${b} cm? (cm)`, value: 2 * (a + b),
               distractors: [a + b, a * b, 2 * (a + b) + 2] };
    },

    // 13) jednotky délky (dm → cm)
    function (r) {
      const n = ri(r, 2, 9);
      return { topic: 'jednotky', text: `${n} dm = ??? cm`, value: n * 10,
               distractors: [n, n * 100, n * 10 + 1] };
    },

    // 14) jednotky délky (cm → mm)
    function (r) {
      const n = ri(r, 2, 9);
      return { topic: 'jednotky', text: `${n} cm = ??? mm`, value: n * 10,
               distractors: [n, n * 100, n + 10] };
    },

    // 15) jednotky hmotnosti (kg → g)
    function (r) {
      const n = ri(r, 2, 8);
      return { topic: 'jednotky', text: `${n} kg = ??? g`, value: n * 1000,
               distractors: [n * 100, n * 10, n * 1000 + 100] };
    },

    // 16) čas (h → min)
    function (r) {
      const n = ri(r, 2, 6);
      return { topic: 'čas', text: `${n} h = ??? min`, value: n * 60,
               distractors: [n * 6, n * 100, n * 60 + 10] };
    },

    // 17) dělení se zbytkem (jen zbytek)
    function (r) {
      const d = ri(r, 3, 8), q = ri(r, 2, 7), rem = ri(r, 1, d - 1);
      const n = d * q + rem;
      return { topic: 'zbytek', text: `${n} ÷ ${d} — jaký je zbytek?`, value: rem,
               distractors: [rem + 1, rem - 1 < 0 ? rem + 2 : rem - 1, d] };
    },

    // 18) slovní úloha — násobení
    function (r) {
      const a = ri(r, 2, 8), b = ri(r, 2, 9);
      return { topic: 'slovní úloha', text: `Na ${a} větvích sedí po ${b} ptácích. Kolik ptáků celkem?`,
               value: a * b, distractors: [a + b, a * b + a, a * b - b] };
    },

    // 19) slovní úloha — peníze
    function (r) {
      const price = ri(r, 8, 40), ks = ri(r, 2, 6);
      return { topic: 'peníze', text: `Perníček stojí ${price} Kč. Kolik za ${ks} kusů? (Kč)`,
               value: price * ks, distractors: [price + ks, price * ks + price, price * ks - ks] };
    },

    // 20) porovnávání (které je větší)
    function (r) {
      const a = ri(r, 100, 999), b = ri(r, 100, 999);
      const bigger = Math.max(a, b), smaller = Math.min(a, b);
      const v = a === b ? a + 1 : bigger;
      return { topic: 'porovnávání', text: `Které číslo je větší?\n${a}  nebo  ${b}\n(napiš to větší)`,
               value: v, distractors: [smaller, smaller - 10, bigger + 100] };
    },

    // 21) násobení desítkami
    function (r) {
      const a = ri(r, 2, 9), b = ri(r, 2, 9);
      return { topic: 'násobení', text: `Vypočítej: ${a} × ${b * 10}`, value: a * b * 10,
               distractors: [a * b, a * b * 100, a * b * 10 + a] };
    },

    // 22) dělení 100
    function (r) {
      const a = ri(r, 2, 9);
      return { topic: 'dělení 100', text: `Vypočítej: ${a * 100} ÷ 100`, value: a,
               distractors: [a * 10, a + 1, a - 1] };
    },

    // 23) následník čísla
    function (r) {
      const n = ri(r, 100, 998);
      return { topic: 'číselná řada', text: `Které číslo je hned za číslem ${n}?`, value: n + 1,
               distractors: [n - 1, n, n + 2] };
    },

    // 24) polovina čísla
    function (r) {
      const half = ri(r, 6, 60), n = half * 2;
      return { topic: 'polovina', text: `Kolik je polovina z čísla ${n}?`, value: half,
               distractors: [half + 1, half - 1, n] };
    },

    // 25) dvojnásobek čísla
    function (r) {
      const n = ri(r, 5, 80);
      return { topic: 'dvojnásobek', text: `Kolik je dvojnásobek čísla ${n}?`, value: n * 2,
               distractors: [n, n * 2 + 1, n + 2] };
    },

    // 26) doplň chybějící sčítanec
    function (r) {
      const a = ri(r, 100, 500), v = ri(r, 20, 200);
      return { topic: 'doplňování', text: `Doplň chybějící číslo: ${a} + ? = ${a + v}`, value: v,
               distractors: [v + 10, v - 10, a] };
    },

    // 27) slovní úloha — dělení rovně
    function (r) {
      const d = ri(r, 2, 8), q = ri(r, 2, 9), n = d * q;
      return { topic: 'slovní úloha', text: `${n} oříšků rozdělíme rovně mezi ${d} ${skl(d, 'veverku', 'veverky', 'veverek')}. Kolik dostane každá?`,
               value: q, distractors: [q + 1, q - 1, n] };
    },

    // 28) slovní úloha — o kolik víc
    function (r) {
      const b = ri(r, 30, 200), a = b + ri(r, 10, 150);
      return { topic: 'slovní úloha', text: `Skřítek nasbíral ${a} žaludů, víla ${b}. O kolik víc má skřítek?`,
               value: a - b, distractors: [a + b, a - b + 10, a - b - 1] };
    },

  ];

  function assemble(r, raw, id) {
    const correct = S(raw.value);
    const seen = new Set([correct]);
    const distractors = [];
    for (const d of raw.distractors) {
      const s = S(d);
      if (seen.has(s) || s === 'NaN' || s === 'undefined' || s === '') continue;
      seen.add(s); distractors.push(s);
    }
    let bump = 1;
    const baseNum = Number(raw.value);
    while (distractors.length < 3) {
      const cand = Number.isFinite(baseNum) ? S(baseNum + bump) : S('?' + bump);
      if (!seen.has(cand)) { seen.add(cand); distractors.push(cand); }
      bump++;
      if (bump > 50) { distractors.push(S('x' + distractors.length)); }
    }
    const choices = [correct, distractors[0], distractors[1], distractors[2]];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return { id, topic: raw.topic, text: raw.text, choices,
             correct: choices.indexOf(correct), answer: correct };
  }

  function build(seed, count) {
    seed = (seed >>> 0) || 1;
    count = Math.max(1, Math.min(40, count | 0 || 10));
    const r = rng(seed);
    const out = [];
    let guard = 0;
    while (out.length < count && guard < count * 20) {
      guard++;
      const gen = GEN[Math.floor(r() * GEN.length)];
      const raw = gen(r);
      const q = assemble(r, raw, out.length + 1);
      if (q.correct < 0 || q.choices.length !== 4) continue;
      if (new Set(q.choices).size !== 4) continue;
      out.push(q);
    }
    return out;
  }

  const API = { game: 'RPG_MAT_3', topicCount: GEN.length, build }; // 28 generators
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else window.RPG_BATTLE_3 = API;
})();
