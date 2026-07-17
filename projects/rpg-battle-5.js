/* ══════════════════════════════════════════════════════════════════
   RPG Matematika — ŽIVÝ SOUBOJ: banka otázek (5. ročník / Dračí říše)
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
  const cz = v => String(v).replace('.', ',');
  const r1 = n => Math.round(n * 10) / 10;
  const S = v => String(v).replace('.', ',');
  const skl = (n, one, few, many) => { const a = Math.abs(n); return a === 1 ? one : a >= 2 && a <= 4 ? few : many; };
  // FRAMING pool — seedované (nemění value ani distraktory, jen slovní obal drilu).
  const FR = r => pick(r, ['Vypočítej', 'Spočítej', 'Urči', 'Kolik je']);

  const GEN = [

    // 1) sčítání velkých čísel
    function (r) {
      const a = ri(r, 12000, 480000), b = ri(r, 12000, 480000);
      return { topic: 'sčítání', text: `${FR(r)}: ${a} + ${b}`, value: a + b,
               distractors: [a + b + 1000, a + b - 100, a + b + 10] };
    },

    // 2) odčítání velkých čísel
    function (r) {
      const b = ri(r, 20000, 300000), a = b + ri(r, 20000, 400000);
      return { topic: 'odčítání', text: `${FR(r)}: ${a} − ${b}`, value: a - b,
               distractors: [a - b + 1000, a + b, a - b - 100] };
    },

    // 3) písemné násobení × jednociferné
    function (r) {
      const a = ri(r, 113, 879), b = ri(r, 3, 9);
      return { topic: 'násobení', text: `${FR(r)}: ${a} × ${b}`, value: a * b,
               distractors: [a * b + b, a * b - a, (a + 1) * b] };
    },

    // 4) násobení dvojciferným
    function (r) {
      const a = ri(r, 23, 89), b = ri(r, 12, 39);
      return { topic: 'násobení', text: `${FR(r)}: ${a} × ${b}`, value: a * b,
               distractors: [a * b + a, a * b - b, a * (b + 1)] };
    },

    // 5) dělení jednociferným
    function (r) {
      const b = ri(r, 3, 9), q = ri(r, 23, 130);
      return { topic: 'dělení', text: `${FR(r)}: ${b * q} : ${b}`, value: q,
               distractors: [q + 1, q - 1, q + 10] };
    },

    // 6) zaokrouhlování na tisíce
    function (r) {
      const n = ri(r, 12300, 887000);
      const v = Math.round(n / 1000) * 1000;
      return { topic: 'zaokrouhlování', text: `Zaokrouhli na tisíce: ${n} ≈`, value: v,
               distractors: [v + 1000, v - 1000, Math.round(n / 10000) * 10000] };
    },

    // 7) zlomek z čísla
    function (r) {
      const den = pick(r, [2, 3, 4, 5]);
      const whole = den * ri(r, 3, 9);
      const num = ri(r, 1, den - 1);
      return { topic: 'zlomky', text: `Kolik je ${num}/${den} z čísla ${whole}?`, value: (whole / den) * num,
               distractors: [whole / den, whole - (whole / den) * num, (whole / den) * num + den] };
    },

    // 8) sčítání zlomků (stejný jmenovatel) — čitatel
    function (r) {
      const den = pick(r, [5, 6, 7, 8, 9, 10]);
      const a = ri(r, 1, den - 2), b = ri(r, 1, den - 1 - a);
      return { topic: 'zlomky', text: `${a}/${den} + ${b}/${den} = ?/${den}\n(napiš čitatele)`, value: a + b,
               distractors: [a + b + 1, Math.abs(a - b), 2 * den] };
    },

    // 9) desetinné sčítání
    function (r) {
      const a = r1(ri(r, 15, 95) / 10), b = r1(ri(r, 11, 89) / 10);
      const v = r1(a + b);
      return { topic: 'desetinná', text: `${FR(r)}: ${cz(a)} + ${cz(b)}`, value: v,
               distractors: [r1(v + 0.1), r1(v - 0.1), r1(v + 1)] };
    },

    // 10) desetinné odčítání
    function (r) {
      const a = r1(ri(r, 30, 98) / 10), b = r1(ri(r, 11, 28) / 10);
      const v = r1(a - b);
      return { topic: 'desetinná', text: `${FR(r)}: ${cz(a)} − ${cz(b)}`, value: v,
               distractors: [r1(v + 0.1), r1(v - 0.1), r1(v + 1)] };
    },

    // 11) desetinné × 10
    function (r) {
      const a = r1(ri(r, 11, 98) / 10);
      const v = r1(a * 10);
      return { topic: 'desetinná', text: `${FR(r)}: ${cz(a)} × 10`, value: v,
               distractors: [r1(a * 100), r1(a + 10), r1(v + 1)] };
    },

    // 12) dělení 100 → desetinné
    function (r) {
      const a = ri(r, 120, 980);
      const v = Math.round(a) / 100;
      return { topic: 'desetinná', text: `${FR(r)}: ${a} : 100`, value: v,
               distractors: [r1(a / 10), a, Math.round((v + 0.1) * 100) / 100] };
    },

    // 13) obvod obdélníku
    function (r) {
      const a = ri(r, 4, 18), b = ri(r, 3, 15);
      return { topic: 'obvod', text: `Obvod obdélníku ${a} cm a ${b} cm? (cm)`, value: 2 * (a + b),
               distractors: [a + b, a * b, 2 * (a + b) + 2] };
    },

    // 14) obsah obdélníku
    function (r) {
      const a = ri(r, 4, 18), b = ri(r, 3, 14);
      return { topic: 'obsah', text: `Obsah obdélníku ${a} cm × ${b} cm? (cm²)`, value: a * b,
               distractors: [2 * (a + b), a * b + a, (a + 1) * b] };
    },

    // 15) obsah čtverce
    function (r) {
      const a = ri(r, 4, 15);
      return { topic: 'obsah', text: `Obsah čtverce se stranou ${a} cm? (cm²)`, value: a * a,
               distractors: [4 * a, a * a + a, (a + 1) * (a + 1)] };
    },

    // 16) převod km → m
    function (r) {
      const n = ri(r, 2, 9);
      return { topic: 'jednotky', text: `${n} km = ??? m`, value: n * 1000,
               distractors: [n * 100, n * 10000, n * 1000 + 100] };
    },

    // 17) převod t → kg
    function (r) {
      const n = ri(r, 2, 9);
      return { topic: 'jednotky', text: `${n} t = ??? kg`, value: n * 1000,
               distractors: [n * 100, n * 10, n * 1000 + 10] };
    },

    // 18) aritmetický průměr
    function (r) {
      const avg = ri(r, 8, 24), d = ri(r, 1, 4);
      const a = avg - d, b = avg + d, c = avg;
      return { topic: 'průměr', text: `Aritmetický průměr čísel ${a}, ${b}, ${c}?`, value: avg,
               distractors: [avg + 1, avg - 1, a + b + c] };
    },

    // 19) dělení se zbytkem (zbytek)
    function (r) {
      const d = ri(r, 4, 9), q = ri(r, 12, 60), rem = ri(r, 1, d - 1);
      const n = d * q + rem;
      return { topic: 'zbytek', text: `${n} : ${d} — jaký je zbytek?`, value: rem,
               distractors: [rem + 1, d, rem - 1 < 0 ? rem + 2 : rem - 1] };
    },

    // 20) slovní úloha — násobení
    function (r) {
      const a = ri(r, 120, 350), b = ri(r, 4, 8);
      return { topic: 'slovní úloha', text: `Rytíř ujede ${a} km za den. Kolik za ${b} ${skl(b, 'den', 'dny', 'dní')}? (km)`,
               value: a * b, distractors: [a + b, a * b + a, a * (b - 1)] };
    },

    // 21) zaokrouhlení desetinného na celé číslo
    function (r) {
      const whole = ri(r, 2, 49), dec = ri(r, 1, 9), n = r1(whole + dec / 10);
      const v = Math.round(n);
      return { topic: 'desetinná', text: `Zaokrouhli ${cz(n)} na celé číslo`, value: v,
               distractors: [v + 1, v - 1, v + 2] };
    },

    // 22) doplň činitel
    function (r) {
      const a = ri(r, 3, 9), b = ri(r, 4, 12);
      return { topic: 'doplňování', text: `Doplň: ${a} × ? = ${a * b}`, value: b,
               distractors: [b + 1, b - 1, a] };
    },

    // 23) následník velkého čísla
    function (r) {
      const n = ri(r, 10000, 999998);
      return { topic: 'číselná řada', text: `Které číslo je hned za číslem ${n}?`, value: n + 1,
               distractors: [n - 1, n, n + 2] };
    },

    // 24) polovina a dvojnásobek
    function (r) {
      if (r() < 0.5) { const h = ri(r, 12, 480), n = h * 2;
        return { topic: 'polovina', text: `Kolik je polovina z čísla ${n}?`, value: h, distractors: [h + 1, h - 1, n] }; }
      const n = ri(r, 12, 480);
      return { topic: 'dvojnásobek', text: `Kolik je dvojnásobek čísla ${n}?`, value: n * 2, distractors: [n, n * 2 + 1, n + 2] };
    },

    // 25) jednotky — m → cm
    function (r) {
      const n = ri(r, 2, 9);
      return { topic: 'jednotky', text: `${n} m = ??? cm`, value: n * 100,
               distractors: [n * 10, n * 1000, n * 100 + 10] };
    },

    // 26) jednotky — h → min
    function (r) {
      const n = ri(r, 2, 9);
      return { topic: 'jednotky', text: `${n} h = ??? min`, value: n * 60,
               distractors: [n * 6, n * 100, n * 60 + 10] };
    },

    // 27) slovní úloha — kolikrát víc
    function (r) {
      const k = ri(r, 2, 9), small = ri(r, 6, 40), big = small * k;
      return { topic: 'slovní úloha', text: `Drak má ${big} mincí, skřítek ${small}. Kolikrát víc má drak?`,
               value: k, distractors: [k + 1, k - 1, big - small] };
    },

    // 28) aritmetický průměr dvou čísel
    function (r) {
      const avg = ri(r, 10, 50), d = ri(r, 1, 8), a = avg - d, b = avg + d;
      return { topic: 'průměr', text: `Aritmetický průměr čísel ${a} a ${b}?`, value: avg,
               distractors: [avg + 1, avg - 1, a + b] };
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
    const baseNum = Number(String(raw.value));
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

  const API = { game: 'RPG_MAT_5', topicCount: GEN.length, build }; // 28 generators
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else window.RPG_BATTLE_5 = API;
})();
