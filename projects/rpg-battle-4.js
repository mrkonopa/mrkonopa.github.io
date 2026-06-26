/* ══════════════════════════════════════════════════════════════════
   RPG Matematika — ŽIVÝ SOUBOJ: banka otázek (4. ročník / Pirátská plavba)
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

  const GEN = [

    // 1) sčítání čtyřciferných čísel
    function (r) {
      const a = ri(r, 1100, 6000), b = ri(r, 1000, 3000);
      return { topic: 'sčítání', text: `Vypočítej: ${a} + ${b}`, value: a + b,
               distractors: [a + b + 10, a + b - 1, a + b + 100] };
    },

    // 2) odčítání čtyřciferných čísel
    function (r) {
      const b = ri(r, 1000, 4000), a = b + ri(r, 500, 4000);
      return { topic: 'odčítání', text: `Vypočítej: ${a} − ${b}`, value: a - b,
               distractors: [a - b + 10, a + b, a - b - 1] };
    },

    // 3) násobilka (3–9)
    function (r) {
      const a = ri(r, 3, 9), b = ri(r, 3, 9);
      return { topic: 'násobilka', text: `Vypočítej: ${a} × ${b}`, value: a * b,
               distractors: [a * b + b, a * b - a, (a + 1) * b] };
    },

    // 4) dělení bez zbytku
    function (r) {
      const b = ri(r, 3, 9), q = ri(r, 3, 12);
      return { topic: 'dělení', text: `Vypočítej: ${b * q} ÷ ${b}`, value: q,
               distractors: [q + 1, q - 1, q + 2] };
    },

    // 5) zaokrouhlování na stovky
    function (r) {
      const n = ri(r, 1230, 8870);
      const v = Math.round(n / 100) * 100;
      return { topic: 'zaokrouhlování', text: `Zaokrouhli na stovky: ${n} ≈`, value: v,
               distractors: [v + 100, v - 100, Math.round(n / 1000) * 1000] };
    },

    // 6) obvod obdélníku
    function (r) {
      const a = ri(r, 4, 16), b = ri(r, 3, 10);
      const v = 2 * (a + b);
      return { topic: 'obvod', text: `Obdélník: a = ${a} cm, b = ${b} cm. Obvod? (cm)`,
               value: v, distractors: [a + b, a * b, v + 2] };
    },

    // 7) obsah obdélníku
    function (r) {
      const a = ri(r, 4, 14), b = ri(r, 3, 9);
      const v = a * b;
      return { topic: 'obsah', text: `Obdélník: a = ${a} cm, b = ${b} cm. Obsah? (cm²)`,
               value: v, distractors: [2 * (a + b), v + a, (a + 1) * b] };
    },

    // 8) závorky — pořadí operací
    function (r) {
      const a = ri(r, 2, 8), b = ri(r, 2, 8), c = ri(r, 2, 8);
      const v = a * (b + c);
      return { topic: 'závorky', text: `Vypočítej: ${a} × (${b} + ${c})`, value: v,
               distractors: [a * b + c, a + b + c, a * b * c] };
    },

    // 9) slovní úloha — cena × počet
    function (r) {
      const cena = ri(r, 3, 19) * 10, ks = ri(r, 2, 6);
      const v = cena * ks;
      return { topic: 'slovní úloha', text: `Jeden poklad stojí ${cena} Kč. Kolik zaplatíš za ${ks} pokladů?`,
               value: v, distractors: [cena + ks, v + cena, v - cena] };
    },

    // 10) jednotky délky (m → cm, km → m)
    function (r) {
      if (r() < 0.5) {
        const m = ri(r, 2, 15);
        return { topic: 'jednotky', text: `${m} m = ??? cm`, value: m * 100,
                 distractors: [m * 10, m * 1000, m * 100 + 10] };
      }
      const km = ri(r, 2, 9);
      return { topic: 'jednotky', text: `${km} km = ??? m`, value: km * 1000,
               distractors: [km * 100, km * 10000, km * 1000 + 10] };
    },

    // 11) zlomek z čísla (1/n)
    function (r) {
      const den = pick(r, [2, 4, 5, 10]);
      const base = ri(r, 2, 10) * den;
      const v = base / den;
      return { topic: 'zlomky', text: `Kolik je 1/${den} z čísla ${base}?`, value: v,
               distractors: [base * den, v + 1, base - v] };
    },

    // 12) průměr tří čísel
    function (r) {
      const avg = ri(r, 4, 12), d1 = ri(r, 1, 3), d2 = ri(r, 1, 3);
      const nums = [avg - d1, avg + d2, avg + d1 - d2];
      return { topic: 'průměr', text: `Průměr čísel ${nums.join(', ')} je…`, value: avg,
               distractors: [avg + 1, avg - 1, nums[0] + nums[1]] };
    },

    // 13) čísla do 1 000 000 — čtení/psaní
    function (r) {
      const a = ri(r, 10000, 200000), b = ri(r, 10000, 200000);
      return { topic: 'velká čísla', text: `Vypočítej: ${a} + ${b}`, value: a + b,
               distractors: [a + b + 1000, a + b - 100, a + b + 10] };
    },

    // 14) slovní úloha — sdílení rovným dílem
    function (r) {
      const b = ri(r, 3, 8), q = ri(r, 4, 15);
      return { topic: 'slovní úloha', text: `${b * q} zlatých mincí si rozdělí rovným dílem ${b} pirátů. Každý dostane…`,
               value: q, distractors: [q + 1, q - 1, b * q - q] };
    },

    // 15) obsah čtverce
    function (r) {
      const a = ri(r, 3, 12);
      return { topic: 'obsah', text: `Čtverec se stranou ${a} cm. Obsah? (cm²)`,
               value: a * a, distractors: [4 * a, a * a + a, (a + 1) * (a + 1)] };
    },

    // 16) rychlost × čas = vzdálenost
    function (r) {
      const speed = pick(r, [20, 30, 40, 50, 60]), t = ri(r, 1, 4);
      const v = speed * t;
      return { topic: 'rychlost', text: `Loď pluje rychlostí ${speed} km/h po dobu ${t} h. Vzdálenost? (km)`,
               value: v, distractors: [speed + t, v + speed, v - t] };
    },

    // 17) jednotky hmotnosti (kg → g)
    function (r) {
      const kg = ri(r, 2, 9);
      return { topic: 'jednotky', text: `${kg} kg = ??? g`, value: kg * 1000,
               distractors: [kg * 100, kg * 10, kg * 1000 + 100] };
    },

    // 18) čas (hodiny a minuty)
    function (r) {
      const h = ri(r, 1, 4), m = ri(r, 10, 55);
      const total = h * 60 + m;
      return { topic: 'čas', text: `Kolik minut je ${h} hodiny a ${m} minut?`, value: total,
               distractors: [total + 10, total - 10, h * 60] };
    },

    // 19) pořadí operací (bez závorek)
    function (r) {
      const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9);
      const v = a + b * c;
      return { topic: 'pořadí operací', text: `Vypočítej: ${a} + ${b} × ${c}`, value: v,
               distractors: [(a + b) * c, a * b + c, v + 1] };
    },

    // 20) porovnávání zlomků (jednoduchých)
    function (r) {
      const opts = [['1/2','1/4',1],['3/4','1/2',1],['1/3','1/4',1],['2/3','1/2',1],['1/2','2/3',2],['1/4','1/3',2]];
      const [fa, fb, which] = pick(r, opts);
      const labels = [fa, fb];
      return { topic: 'zlomky', text: `Které je větší? ${fa}  nebo  ${fb}`, value: labels[which - 1],
               distractors: [labels[2 - which], fa === fb ? '=' : labels[0]] };
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

  const API = { game: 'RPG_MAT_4', topicCount: GEN.length, build }; // 20 generators
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else window.RPG_BATTLE_4 = API;
})();
