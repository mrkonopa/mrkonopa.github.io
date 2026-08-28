/* ══════════════════════════════════════════════════════════════════
   RPG Matematika — ŽIVÝ SOUBOJ: banka otázek (8. ročník / Matematická akademie)
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
  const skl = (n,one,few,many)=>n===1?one:(n>=2&&n<=4?few:many);  // shoda čísla a jména (1 / 2-4 / 5+)
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const FR = r => pick(r, ['Vypočítej', 'Spočítej', 'Urči', 'Vyčísli']);  // framing-pool (rozmanitost zadání)
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

  const GEN = [

    // 1) záporná čísla — součin
    function (r) {
      const a = ri(r, 2, 9), b = ri(r, 2, 9);
      const f = FR(r);
      if (r() < 0.5) {
        const v = -a * b;
        return { topic: 'záporná čísla', text: `${f}: (−${a}) × ${b}`, value: v,
                 distractors: [a * b, -a - b, v + a] };
      }
      const v = a * b;
      return { topic: 'záporná čísla', text: `${f}: (−${a}) × (−${b})`, value: v,
               distractors: [-v, a + b, v + 1] };
    },

    // 2) procenta — sleva
    function (r) {
      const price = ri(r, 3, 20) * 100, p = pick(r, [10, 20, 25, 50]);
      const v = Math.round(price * (100 - p) / 100);
      return { topic: 'procenta',
               text: `Zboží za ${price} Kč zlevněno o ${p} %. Nová cena?`,
               value: v, distractors: [Math.round(price * p / 100), v - 100, price] };
    },

    // 3) procenta — kolik procent
    function (r) {
      const base = ri(r, 3, 10) * 100, p = pick(r, [10, 20, 25, 50, 75]);
      const v = Math.round(base * p / 100);
      return { topic: 'procenta', text: `Kolika procenty je ${v} z ${base}?`, value: p,
               distractors: [100 - p, p + 10, p - 10] };
    },

    // 4) mocniny (2. a 3.)
    function (r) {
      const f = FR(r);
      if (r() < 0.6) {
        const a = ri(r, 2, 13);
        return { topic: 'mocniny', text: `${f}: ${a}²`, value: a * a,
                 distractors: [a * 2, a * a + a, a * a - a] };
      }
      const b = ri(r, 2, 7);
      return { topic: 'mocniny', text: `${f}: ${b}³`, value: b * b * b,
               distractors: [b * b, b * 3, b * b * b + b] };
    },

    // 5) odmocniny (z úplného čtverce)
    function (r) {
      const a = ri(r, 2, 15);
      return { topic: 'odmocniny', text: `${FR(r)}: √${a * a}`, value: a,
               distractors: [a + 1, a - 1, Math.round(a * a / 2)] };
    },

    // 6) lineární funkce f(x) = ax + b
    function (r) {
      const a = ri(r, 2, 6), b = ri(r, -6, 6), k = ri(r, -4, 6);
      const v = a * k + b;
      const sign = b >= 0 ? `+ ${b}` : `− ${-b}`;
      return { topic: 'funkce', text: `f(x) = ${a}x ${sign}. Kolik je f(${k})?`, value: v,
               distractors: [a + k + b, a * k - b, v + a] };
    },

    // 7) Pythagorova věta — přepona
    function (r) {
      const trips = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
      const [p, q, c] = pick(r, trips);
      return { topic: 'Pythagoras',
               text: `Pravoúhlý trojúhelník: odvěsny ${p} cm a ${q} cm. Jak dlouhá je přepona? (cm)`,
               value: c, distractors: [c + 1, c - 1, p + q] };
    },

    // 8) rovnice s neznámou na obou stranách
    function (r) {
      const x = ri(r, 1, 9), a = ri(r, 2, 5), b = ri(r, 2, 5), c = ri(r, 1, 8);
      // (a+b)x = a*x + c  → b*x = c ... nebezpečné pokud c%b != 0
      // Použij ax + c = bx + d kde a>b
      const d = (a - b) * x + c;
      return { topic: 'rovnice',
               text: `Vyřeš: ${a}x + ${c} = ${b}x + ${d}`, value: x,
               distractors: [x + 1, x - 1, x + 2] };
    },

    // 9) pořadí operací s mocninou
    function (r) {
      const a = ri(r, 2, 6), b = ri(r, 2, 4), c = ri(r, 1, 9);
      const v = c + b * b;
      return { topic: 'operace', text: `Vypočítej: ${c} + ${b}² (pozor: nejdříve mocnina)`, value: v,
               distractors: [(c + b) * (c + b), c + b * 2, c + b + 2] };
    },

    // 10) přímá/nepřímá úměra
    //
    // OBĚ větve byly rozbité a je to vidět naživo před třídou:
    //  · „přímá úměra" se ptala, kolik hodin potrvá STEJNÝ díl většímu
    //    počtu pracovníků, ale odpovídala NEZMĚNĚNÝ čas — nesedělo to
    //    ve 100 % generování („5 pracovníků za 8 hodin → 10 pracovníků"
    //    má být 4, hra čekala 8). Byla to navíc úměra nepřímá, takže
    //    nesedělo ani jméno tématu. Nahrazeno skutečně PŘÍMOU úměrou.
    //  · „nepřímá úměra" zaokrouhlovala přesný výsledek (`Math.round`),
    //    ačkoli se na zaokrouhlení nikde neptá — v 50,4 % generování
    //    žák spočítal třeba 1,67 a takovou volbu vůbec nenašel.
    // Čísla se nově volí tak, aby dělení vyšlo BEZE ZBYTKU.
    function (r) {
      if (r() < 0.5) {
        // PŘÍMÁ úměra: víc hodin = víc kusů.
        const zaHod = ri(r, 3, 12);
        const hod1 = ri(r, 2, 6);
        const hod2 = hod1 * ri(r, 2, 3);
        const v = zaHod * hod2;
        return { topic: 'přímá úměra',
                 text: `Stroj vyrobí za ${hod1} ${skl(hod1,'hodinu','hodiny','hodin')} ${zaHod * hod1} ${skl(zaHod * hod1,'součástku','součástky','součástek')}.\nKolik jich vyrobí za ${hod2} ${skl(hod2,'hodinu','hodiny','hodin')}?`,
                 value: v, distractors: [zaHod * hod1, v + zaHod, v - zaHod] };
      }
      // NEPŘÍMÁ úměra: víc pracovníků = míň hodin.
      // Výsledek volíme jako celé číslo a teprve k němu dopočítáme
      // zadání, takže `workers1 * hours1 / workers2` vyjde přesně.
      const workers1 = ri(r, 2, 5);
      const nasobek = ri(r, 2, 3);
      const workers2 = workers1 * nasobek;
      const v = ri(r, 2, 5);
      const hours1 = v * nasobek;
      return { topic: 'nepřímá úměra',
               text: `${workers1} ${skl(workers1,'pracovník','pracovníci','pracovníků')} ${skl(workers1,'postaví','postaví','postaví')} zeď za ${hours1} ${skl(hours1,'hodinu','hodiny','hodin')}.\nKolik hodin to bude trvat ${workers2} pracovníkům?`,
               value: v, distractors: [hours1, v + 2, v * 2] };
    },

    // 11) obvod kruhu (2πr)
    function (r) {
      const rad = ri(r, 2, 8);
      const v = Math.round(2 * 3.14 * rad * 10) / 10;
      const area = Math.round(3.14 * rad * rad * 10) / 10;
      return { topic: 'kruh', text: `Kruh: poloměr ${rad} cm. Obvod (π ≈ 3,14)? (cm)`, value: v,
               distractors: [area, Math.round(3.14 * rad * 10) / 10, v + rad] };
    },

    // 12) obsah kruhu (πr²)
    function (r) {
      const rad = ri(r, 2, 7);
      const area = Math.round(3.14 * rad * rad * 10) / 10;
      const circ = Math.round(2 * 3.14 * rad * 10) / 10;
      return { topic: 'kruh', text: `Kruh: poloměr ${rad} cm. Obsah (π ≈ 3,14)? (cm²)`, value: area,
               distractors: [circ, Math.round(3.14 * (rad + 1) * (rad + 1) * 10) / 10, area + rad] };
    },

    // 13) Pythagorova věta — odvěsna
    function (r) {
      const trips = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
      const [a, b, c] = pick(r, trips);
      if (r() < 0.5) {
        return { topic: 'Pythagoras', text: `Pravoúhlý trojúhelník: přepona ${c} cm, odvěsna ${a} cm. Druhá odvěsna? (cm)`,
                 value: b, distractors: [c - a, a + b, b + 1] };
      }
      return { topic: 'Pythagoras', text: `Pravoúhlý trojúhelník: přepona ${c} cm, odvěsna ${b} cm. Druhá odvěsna? (cm)`,
               value: a, distractors: [c - b, a + b, a + 1] };
    },

    // 14) rovnice se závorkou 3(x+b)=c
    function (r) {
      const x = ri(r, 1, 8), a = ri(r, 2, 5), b = ri(r, 1, 6);
      const rhs = a * (x + b);
      return { topic: 'rovnice', text: `Vyřeš: ${a}(x + ${b}) = ${rhs}`, value: x,
               distractors: [(rhs / a) | 0, x + a, x * a] };
    },

    // 15) pravidla mocnin — součin (a^m · a^n = a^?)
    function (r) {
      const base = pick(r, [2, 3, 5]), m = ri(r, 2, 5), n = ri(r, 2, 5);
      const v = m + n;
      return { topic: 'mocniny', text: `Zjednodušte: ${base}^${m} · ${base}^${n} = ${base}^?`, value: v,
               distractors: [m * n, v + 1, v - 1] };
    },

    // 16) dosazení do výrazu
    function (r) {
      const a = ri(r, 2, 5), b = ri(r, 1, 6), x = ri(r, 2, 7);
      const v = a * x + b;
      return { topic: 'výrazy', text: `Hodnota výrazu ${a}a + ${b} pro a = ${x}?`, value: v,
               distractors: [a * x - b, a * (x + b), v + a] };
    },

    // 17) objem válce (πr²h)
    function (r) {
      const rad = ri(r, 2, 5), h = ri(r, 3, 8);
      const v = Math.round(3.14 * rad * rad * h * 10) / 10;
      return { topic: 'válec', text: `Válec: poloměr ${rad} cm, výška ${h} cm. Objem (π ≈ 3,14)? (cm³)`,
               value: v, distractors: [Math.round(3.14 * rad * rad * 10) / 10, v + h, Math.round(3.14 * (rad + 1) * (rad + 1) * h * 10) / 10] };
    },

    // 18) povrch kvádru 2(ab+bc+ac)
    function (r) {
      const a = ri(r, 2, 5), b = ri(r, 2, 5), c = ri(r, 2, 5);
      const v = 2 * (a * b + b * c + a * c);
      return { topic: 'povrch', text: `Kvádr: ${a} cm × ${b} cm × ${c} cm. Povrch? (cm²)`,
               value: v, distractors: [a * b * c, 6 * a * b, v + a * b] };
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

  const API = { game: 'RPG_MAT_8', topicCount: GEN.length, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else window.RPG_BATTLE_8 = API;
})();
