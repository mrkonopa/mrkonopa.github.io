/* ══════════════════════════════════════════════════════════════════
   RPG Matematika — ŽIVÝ SOUBOJ: banka otázek (7. ročník / Ztracený chrám)
   Deterministická: build(seed, count) → stejný seed = stejné otázky.
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
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a; }

  const GEN = [

    // 1) rovnice ax + b = c
    function (r) {
      const a = ri(r, 2, 9), x = ri(r, -6, 9), b = ri(r, -9, 9);
      const c = a * x + b;
      const sign = b >= 0 ? `+ ${b}` : `− ${-b}`;
      return { topic: 'rovnice', text: `Vyřeš rovnici: ${a}x ${sign} = ${c}`, value: x,
               distractors: [x + 1, x - 1, x + 2] };
    },

    // 2) zlomky — zkrácení (výsledný čitatel)
    function (r) {
      const g = ri(r, 2, 6), a = ri(r, 1, 4), b = ri(r, a + 1, 7);
      return { topic: 'zlomky', text: `Zkrať zlomek: ${a * g}/${b * g}. Napiš výsledný ČITATEL.`,
               value: a, distractors: [b, a * g, b * g] };
    },

    // 3) přímá úměra
    function (r) {
      const unit = ri(r, 3, 9), q1 = ri(r, 2, 5), q2 = q1 * ri(r, 2, 4);
      const v = unit * q2;
      return { topic: 'přímá úměra',
               text: `${q1} ${q1 === 1 ? 'kus' : 'kusy'} stojí ${unit * q1} Kč. Kolik stojí ${q2} kusů?`,
               value: v, distractors: [unit * q1 + q2, v + unit, v - unit] };
    },

    // 4) procenta z čísla
    function (r) {
      const p = pick(r, [10, 20, 25, 50]);
      const base = ri(r, 2, 20) * 20;
      const v = Math.round(base * p / 100);
      return { topic: 'procenta', text: `Kolik je ${p} % z čísla ${base}?`, value: v,
               distractors: [v + base / 20, Math.round(base * p / 1000), v - 5] };
    },

    // 5) obsah trojúhelníku
    function (r) {
      const z = ri(r, 4, 14), v = ri(r, 3, 10) * 2;  // sudá výška → celý výsledek
      const s = z * v / 2;
      return { topic: 'trojúhelník', text: `Trojúhelník: základna ${z} cm, výška ${v} cm. Vypočítej obsah S. (cm²)`,
               value: s, distractors: [z * v, s + z, s - v / 2] };
    },

    // 6) záporná čísla — součet
    function (r) {
      const a = -ri(r, 2, 12), b = ri(r, 2, 12);
      const v = a + b;
      return { topic: 'záporná čísla', text: `Vypočítej: (${a}) + ${b}`, value: v,
               distractors: [Math.abs(a + b), -(a + b), v + 1] };
    },

    // 7) záporná čísla — odčítání
    function (r) {
      const a = ri(r, -10, 5), b = ri(r, 2, 10);
      const v = a - b;
      return { topic: 'záporná čísla', text: `Vypočítej: (${a}) − ${b}`, value: v,
               distractors: [a + b, -(a - b), v + 2] };
    },

    // 8) poměr — nalezení členů
    function (r) {
      const a = ri(r, 2, 6), b = ri(r, 2, 6), total = (a + b) * ri(r, 2, 5);
      const va = Math.round(total * a / (a + b));
      return { topic: 'poměr', text: `Rozděl číslo ${total} v poměru ${a} : ${b}. Jaká je větší část?`,
               value: Math.max(va, total - va),
               distractors: [Math.min(va, total - va), total / 2, total - Math.max(va, total - va) + 1] };
    },

    // 9) zlomky — sčítání (stejný jmenovatel)
    function (r) {
      const d = ri(r, 3, 9), a = ri(r, 1, d - 1), b = ri(r, 1, d - 1 - a < 1 ? 1 : d - 1 - a);
      const sumN = a + b;
      const g2 = gcd(sumN, d);
      const rn = sumN / g2, rd = d / g2;
      const ans = rd === 1 ? S(rn) : `${rn}/${rd}`;
      const wrong1 = `${a + b}/${d + 1}`, wrong2 = `${a + b + 1}/${d}`, wrong3 = `${a * b}/${d}`;
      return { topic: 'zlomky', text: `Vypočítej: ${a}/${d} + ${b}/${d}  (výsledek jako zlomek nebo celé číslo)`,
               value: ans, distractors: [wrong1, wrong2, wrong3] };
    },

    // 10) desetinná čísla × celé číslo
    function (r) {
      const a = Math.round(ri(r, 11, 49)) / 10, b = ri(r, 2, 9);
      const v = Math.round(a * b * 10) / 10;
      return { topic: 'desetinná čísla',
               text: `Vypočítej: ${a.toString().replace('.', ',')} × ${b}`,
               value: v, distractors: [v + 0.1, v + b, v - a] };
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
      bump++; if (bump > 50) { distractors.push(S('x' + distractors.length)); }
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

  const API = { game: 'RPG_MAT_7', topicCount: GEN.length, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else window.RPG_BATTLE_7 = API;
})();
