/* ════════════════════════════════════════════════════════════════════
   RPG Matematika — ŽIVÝ SOUBOJ: banka otázek (9. ročník / NULL_BYTE)

   SAMOSTATNÁ soutěžní sada (oddělená od učiva i tréninku). Rychlé MC
   otázky (4 možnosti) v kyberpunk duchu, laděné na Kahoot-style tempo.

   Deterministická: build(seed, count) vrátí pro STEJNÝ seed STEJNÝ
   uspořádaný seznam otázek → všichni hráči v jedné místnosti dostanou
   identické otázky ve stejném pořadí (host pošle jen seed přes cloud).

   Každá otázka: { id, topic, text, choices:[4×string], correct:0..3, answer:string }
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── deterministický PRNG (mulberry32) ──
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const ri = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));   // celé [lo,hi]
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const S = v => String(v);

  // ── generátory: každý vrací {topic, text, value, distractors:[3]} ──
  // value i distractors jsou čísla nebo řetězce; assemble() z nich složí MC.
  const GEN = [

    // 1) lineární rovnice ax + b = c
    function (r) {
      const a = ri(r, 2, 9), x = ri(r, -6, 9), b = ri(r, -9, 9);
      const c = a * x + b;
      const sign = b >= 0 ? '+ ' + b : '- ' + (-b);
      return { topic: 'rovnice', text: `Vyřeš: ${a}x ${sign} = ${c}`, value: x,
               distractors: [x + 1, x - 1, x + 2] };
    },

    // 2) procenta z čísla
    function (r) {
      const p = pick(r, [5, 10, 15, 20, 25, 40, 50, 75]);
      const base = ri(r, 2, 20) * 20;          // násobek 20 → hezké výsledky
      const v = Math.round(base * p / 100);
      return { topic: 'procenta', text: `Kolik je ${p} % z ${base}?`, value: v,
               distractors: [v + base / 20, Math.round(base * p / 1000), v - 5] };
    },

    // 3) druhá / třetí mocnina
    function (r) {
      const a = ri(r, 2, 13);
      if (r() < 0.5) {
        const v = a * a;
        return { topic: 'mocniny', text: `Vypočítej ${a}²`, value: v,
                 distractors: [a * 2, v + a, v - a] };
      }
      const b = ri(r, 2, 7), v = b * b * b;
      return { topic: 'mocniny', text: `Vypočítej ${b}³`, value: v,
               distractors: [b * b, b * 3, v + b] };
    },

    // 4) druhá odmocnina (z úplného čtverce)
    function (r) {
      const a = ri(r, 2, 15), v = a * a;
      return { topic: 'odmocniny', text: `Vypočítej √${v}`, value: a,
               distractors: [a + 1, a - 1, Math.round(v / 2)] };
    },

    // 5) Pythagoras — přepona z celočíselné trojice
    function (r) {
      const trips = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]];
      const [p, q, c] = pick(r, trips);
      return { topic: 'pythagoras', text: `Pravoúhlý trojúhelník má odvěsny ${p} a ${q}. Jak dlouhá je přepona?`,
               value: c, distractors: [c + 1, c - 1, p + q] };
    },

    // 6) pořadí operací
    function (r) {
      const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9);
      const v = a + b * c;
      return { topic: 'operace', text: `Vypočítej: ${a} + ${b} · ${c}`, value: v,
               distractors: [(a + b) * c, a + b + c, v + b] };
    },

    // 7) záporná čísla
    function (r) {
      const a = ri(r, -12, -2), b = ri(r, 2, 12);
      const v = a - b;
      return { topic: 'záporná', text: `Vypočítej: (${a}) − ${b}`, value: v,
               distractors: [a + b, -(a - b), v + 2] };
    },

    // 8) hodnota lineární funkce
    function (r) {
      const a = ri(r, 2, 6), b = ri(r, -6, 6), k = ri(r, -4, 6);
      const v = a * k + b;
      const sign = b >= 0 ? '+ ' + b : '− ' + (-b);
      return { topic: 'funkce', text: `f(x) = ${a}x ${sign}. Kolik je f(${k})?`, value: v,
               distractors: [a + k + b, a * k - b, v + a] };
    },

    // 9) přímá úměrnost
    function (r) {
      const unit = ri(r, 2, 9), q1 = ri(r, 2, 6), q2 = q1 * ri(r, 2, 4);
      const v = unit * q2;
      return { topic: 'úměra', text: `${q1} ks stojí ${unit * q1} Kč. Kolik stojí ${q2} ks?`,
               value: v, distractors: [unit * q1 + q2, v + unit, v - unit] };
    },

    // 10) sleva (procenta v praxi)
    function (r) {
      const price = ri(r, 3, 20) * 100, p = pick(r, [10, 20, 25, 50]);
      const v = Math.round(price * (100 - p) / 100);
      return { topic: 'sleva', text: `Zboží za ${price} Kč se zlevní o ${p} %. Nová cena?`,
               value: v, distractors: [Math.round(price * p / 100), v - 100, price] };
    },

    // 11) aritmetická posloupnost — další člen
    function (r) {
      const start = ri(r, -5, 8), d = ri(r, 2, 7);
      const seq = [start, start + d, start + 2 * d, start + 3 * d];
      const v = start + 4 * d;
      return { topic: 'posloupnost', text: `Jaké číslo následuje: ${seq.join(', ')}, …?`,
               value: v, distractors: [v + d, v - d, start + 5 * d] };
    },

    // 12) zlomek → desetinné číslo (hezké)
    function (r) {
      const opts = [[1, 2, '0,5'], [1, 4, '0,25'], [3, 4, '0,75'], [1, 5, '0,2'],
                    [2, 5, '0,4'], [1, 10, '0,1'], [3, 10, '0,3'], [1, 8, '0,125']];
      const [num, den, dec] = pick(r, opts);
      const wrong = opts.filter(o => o[2] !== dec).map(o => o[2]);
      return { topic: 'zlomky', text: `Zapiš zlomek ${num}/${den} jako desetinné číslo`,
               value: dec, distractors: [wrong[0], wrong[1], wrong[2]] };
    },

  ];

  // ── složení jedné MC otázky (deterministické) ──
  function assemble(r, raw, id) {
    const correct = S(raw.value);
    // unikátní distraktory ≠ správná odpověď
    const seen = new Set([correct]);
    const distractors = [];
    for (const d of raw.distractors) {
      let s = S(d);
      if (seen.has(s) || s === 'NaN' || s === 'undefined' || s === '') continue;
      seen.add(s); distractors.push(s);
    }
    // doplň, kdyby kolize vyhodily moc možností (číselné okolí)
    let bump = 1;
    const baseNum = Number(raw.value);
    while (distractors.length < 3) {
      const cand = Number.isFinite(baseNum) ? S(baseNum + bump) : S('?' + bump);
      if (!seen.has(cand)) { seen.add(cand); distractors.push(cand); }
      bump++;
      if (bump > 50) { distractors.push(S('x' + distractors.length)); }   // pojistka
    }
    // poskládej 4 možnosti a deterministicky zamíchej
    const choices = [correct, distractors[0], distractors[1], distractors[2]];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return { id, topic: raw.topic, text: raw.text, choices,
             correct: choices.indexOf(correct), answer: correct };
  }

  // ── veřejné API ──
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
      // přeskoč otázku, kde se nepovedlo udělat platné 4 možnosti
      if (q.correct < 0 || q.choices.length !== 4) continue;
      if (new Set(q.choices).size !== 4) continue;
      out.push(q);
    }
    return out;
  }

  const API = { game: 'RPG_MAT_9', topicCount: GEN.length, build };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  } else {
    window.RPG_BATTLE_9 = API;
  }
})();
