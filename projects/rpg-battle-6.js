/* ══════════════════════════════════════════════════════════════════
   RPG Matematika — ŽIVÝ SOUBOJ: banka otázek (6. ročník / Vesmírná expedice)
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

    // 1) sčítání tříciferných čísel
    function (r) {
      const a = ri(r, 120, 650), b = ri(r, 120, 350);
      return { topic: 'sčítání', text: `Vypočítej: ${a} + ${b}`, value: a + b,
               distractors: [a + b + 10, a + b - 1, a + b + 1] };
    },

    // 2) odčítání tříciferných čísel
    function (r) {
      const b = ri(r, 100, 400), a = b + ri(r, 50, 400);
      return { topic: 'odčítání', text: `Vypočítej: ${a} − ${b}`, value: a - b,
               distractors: [a - b + 10, a + b, a - b - 1] };
    },

    // 3) násobení
    function (r) {
      const a = ri(r, 12, 39), b = ri(r, 3, 9);
      return { topic: 'násobení', text: `Vypočítej: ${a} × ${b}`, value: a * b,
               distractors: [a * b + b, a * b - a, (a + 1) * b] };
    },

    // 4) dělení (bezzbytkové)
    function (r) {
      const b = ri(r, 3, 9), q = ri(r, 12, 40);
      return { topic: 'dělení', text: `Vypočítej: ${b * q} ÷ ${b}`, value: q,
               distractors: [q + 1, q - 1, q + 2] };
    },

    // 5) zaokrouhlování na desítky
    function (r) {
      const n = ri(r, 123, 887);
      const v = Math.round(n / 10) * 10;
      const alt1 = v + 10, alt2 = v - 10, alt3 = Math.round(n / 100) * 100;
      return { topic: 'zaokrouhlování', text: `Zaokrouhli na desítky: ${n} ≈`, value: v,
               distractors: [alt1, alt2, alt3] };
    },

    // 6) obvod obdélníku
    function (r) {
      const a = ri(r, 3, 14), b = ri(r, 2, 9);
      const v = 2 * (a + b);
      return { topic: 'obvod', text: `Obdélník: a = ${a} cm, b = ${b} cm. Vypočítej obvod. (cm)`,
               value: v, distractors: [a + b, a * b, v + 2] };
    },

    // 7) obsah obdélníku / čtverce
    function (r) {
      if (r() < 0.5) {
        const a = ri(r, 3, 14), b = ri(r, 2, 9);
        const v = a * b;
        return { topic: 'obsah', text: `Obdélník: a = ${a} cm, b = ${b} cm. Vypočítej obsah. (cm²)`,
                 value: v, distractors: [2 * (a + b), v + a, (a + 1) * b] };
      }
      const a = ri(r, 3, 12);
      const v = a * a;
      return { topic: 'obsah', text: `Čtverec se stranou ${a} cm. Vypočítej obsah. (cm²)`,
               value: v, distractors: [4 * a, v + a, (a + 1) * (a + 1)] };
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
      return { topic: 'slovní úloha', text: `Jeden sešit stojí ${cena} Kč. Kolik zaplatíš za ${ks} sešitů?`,
               value: v, distractors: [cena + ks, v + cena, v - cena] };
    },

    // 10) záporná čísla — srovnání (které je větší)
    function (r) {
      const a = -ri(r, 1, 9), b = ri(r, 1, 9);
      return { topic: 'záporná čísla', text: `Které číslo je větší?\n${a}  nebo  ${b}\n(napiš to větší)`,
               value: b, distractors: [a, 0, -b] };
    },

    // 11) desetinná čísla — sčítání
    function (r) {
      const a = Math.round(ri(r, 11, 89)) / 10;
      const b = Math.round(ri(r, 11, 89)) / 10;
      const v = Math.round((a + b) * 10) / 10;
      return { topic: 'desetinná čísla', text: `Vypočítej: ${a.toString().replace('.', ',')} + ${b.toString().replace('.', ',')}`,
               value: v, distractors: [v + 0.1, v - 0.1, v + 1] };
    },

    // 12) souřadnice bodu (součet souřadnic)
    function (r) {
      const x = ri(r, 1, 9), y = ri(r, 1, 9);
      return { topic: 'souřadnice', text: `Bod B má souřadnice [${x}, ${y}]. Kolik je součet obou souřadnic?`,
               value: x + y, distractors: [x * y, x + y + 1, Math.abs(x - y)] };
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

  const API = { game: 'RPG_MAT_6', topicCount: GEN.length, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else window.RPG_BATTLE_6 = API;
})();
