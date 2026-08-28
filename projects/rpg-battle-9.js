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
  const ri = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const skl = (n,one,few,many)=>n===1?one:(n>=2&&n<=4?few:many);  // shoda čísla a jména (1 / 2-4 / 5+)   // celé [lo,hi]
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  /* Zápis volby. Dvě věci naráz:
     · zaokrouhlení smaže artefakty plovoucí čárky — distraktory se
       počítaly jako `v + 0.1` / `v - 0.1`, takže z 3,3 vzniklo
       3.1999999999999997 a svítilo to jako volba PŘED CELOU TŘÍDOU;
     · desetinná ČÁRKA, protože zadání ji používá („Vypočítej: 1,8 + 1,5")
       a volby ukazovaly tečku. (5. ročník čárku dělal už dřív, ale
       bez zaokrouhlení — proto byly dvě varianty téhle funkce.)
     Volby se porovnávají INDEXEM (`idx === q.correct` v rpg-battle-ui.js),
     nikdy se neparsují, takže změna zápisu nic nerozbije. Nečíselné
     hodnoty (ANO/NE, zlomky, záložní „x1") jdou beze změny. */
  const S = v => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return String(v);
    return String(Math.round(v * 1e6) / 1e6).replace('.', ',');
  };
  // FRAMING-POOL: uvození drilu (deterministické přes seedovaný r, nemění hodnotu ani distraktory)
  const FR = r => pick(r, ['Vypočítej', 'Spočítej', 'Urči', 'Kolik je']);
  const fr = (r, expr) => { const f = FR(r); return f === 'Kolik je' ? `Kolik je ${expr}?` : `${f}: ${expr}`; };

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
        return { topic: 'mocniny', text: fr(r, `${a}²`), value: v,
                 distractors: [a * 2, v + a, v - a] };
      }
      const b = ri(r, 2, 7), v = b * b * b;
      return { topic: 'mocniny', text: fr(r, `${b}³`), value: v,
               distractors: [b * b, b * 3, v + b] };
    },

    // 4) druhá odmocnina (z úplného čtverce)
    function (r) {
      const a = ri(r, 2, 15), v = a * a;
      return { topic: 'odmocniny', text: fr(r, `√${v}`), value: a,
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
      return { topic: 'operace', text: fr(r, `${a} + ${b} · ${c}`), value: v,
               distractors: [(a + b) * c, a + b + c, v + b] };
    },

    // 7) záporná čísla
    function (r) {
      const a = ri(r, -12, -2), b = ri(r, 2, 12);
      const v = a - b;
      return { topic: 'záporná', text: fr(r, `(${a}) − ${b}`), value: v,
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

    // 13) soustava rovnic — sčítací metoda
    function (r) {
      const y = ri(r, 1, 8), x = y + ri(r, 1, 5);
      const s = x + y, d = x - y;
      return { topic: 'soustava', text: `Soustava rovnic:\nx + y = ${s}\nx − y = ${d}\nKolik je x?`,
               value: x, distractors: [y, s, d] };
    },

    // 14) vyjádření proměnné ze vzorce P = 2(a + b)
    function (r) {
      const a = ri(r, 3, 8), b = ri(r, 3, 8);
      const P = 2 * (a + b);
      return { topic: 'vzorce', text: `P = 2(a + b). P = ${P}, a = ${a}. Kolik je b?`, value: b,
               distractors: [P - a, P / 2, b + a] };
    },

    // 15) funkce — pro jaké x je f(x) = k
    function (r) {
      const a = ri(r, 2, 5), b = ri(r, -6, 6), x = ri(r, -4, 6);
      const k = a * x + b;
      const sign = b >= 0 ? `+ ${b}` : `− ${-b}`;
      return { topic: 'funkce', text: `f(x) = ${a}x ${sign}. Pro jaké x platí f(x) = ${k}?`, value: x,
               distractors: [x + 1, x - 1, k - b] };
    },

    // 16) vědecký zápis → celé číslo
    function (r) {
      const mant = ri(r, 1, 9), exp = pick(r, [3, 4, 5]);
      const v = mant * Math.pow(10, exp);
      return { topic: 'věd. zápis', text: `Zapiš jako celé číslo: ${mant} · 10^${exp}`, value: v,
               distractors: [mant * Math.pow(10, exp - 1), mant * Math.pow(10, exp + 1), mant + exp] };
    },

    // 17) medián pěti čísel
    function (r) {
      const a = ri(r, 1, 6), d = ri(r, 2, 4);
      const sorted = [a, a + d, a + 2 * d, a + 3 * d, a + 4 * d];
      const v = sorted[2];
      const shuffled = [sorted[1], sorted[4], sorted[0], sorted[3], sorted[2]];
      return { topic: 'statistika', text: `Medián souboru: ${shuffled.join(', ')}`, value: v,
               distractors: [sorted[1], sorted[3], sorted[4]] };
    },

    // 18) pravděpodobnost (jednoduchá)
    function (r) {
      const cases = [
        [4, 1, '1/4'], [4, 3, '3/4'], [5, 1, '1/5'], [5, 2, '2/5'],
        [5, 3, '3/5'], [5, 4, '4/5'], [6, 1, '1/6'], [6, 5, '5/6'],
        [10, 1, '1/10'], [10, 3, '3/10'], [10, 7, '7/10'], [10, 9, '9/10'],
      ];
      const [total, fav, ans] = pick(r, cases);
      const wrongs = cases.filter(c => c[2] !== ans);
      return { topic: 'pravděpodobnost', text: `Z ${total} kuliček ${skl(fav,'je','jsou','je')} ${fav} ${skl(fav,'červená','červené','červených')}. P(červená) = ?`,
               value: ans, distractors: [wrongs[0][2], wrongs[Math.floor(wrongs.length / 2)][2], wrongs[wrongs.length - 1][2]] };
    },

    // 19) geometrická posloupnost — 5. člen
    function (r) {
      const start = ri(r, 1, 4), ratio = ri(r, 2, 3);
      const seq = [start, start * ratio, start * ratio * ratio, start * ratio ** 3];
      const v = seq[3] * ratio;
      return { topic: 'posloupnost', text: `Geometrická posloupnost: ${seq.join(', ')}, …\n5. člen?`,
               value: v, distractors: [seq[3] + ratio, v * ratio, seq[3] + seq[3] - seq[2]] };
    },

    // 20) procenta — navýšení (zdražení)
    function (r) {
      const price = ri(r, 2, 15) * 100, p = pick(r, [5, 10, 15, 20, 25]);
      const v = Math.round(price * (100 + p) / 100);
      return { topic: 'procenta', text: `Cena ${price} Kč se zvýší o ${p} %. Nová cena?`,
               value: v, distractors: [Math.round(price * p / 100), price + p, v - Math.round(price * p / 100)] };
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
