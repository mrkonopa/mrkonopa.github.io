/* rpg-tasks-3.js — RPG Matematika 3 — rozšiřující banka úloh
   Kouzelný les 🌳 | Matematika 3. ročník (čísla do 1000, násobilka, dělení)
   window.RPG_TASK_EXTRA_3 = { '<mid>': ()=>[task,…], … } (21 misí)
*/
(function () {
  'use strict';
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const cz = n => String(n).replace('.', ',');
  function skl(n, one, few, many) {
    const a = Math.abs(n);
    return a === 1 ? one : a >= 2 && a <= 4 ? few : many;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 1 — ČÍSLA DO 1000
  // ══════════════════════════════════════════════════════════════

  // 1-1 Čtení a zápis čísel do 1000 (MC — číselná)
  function gen_1_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const n = ri(100, 999);
      const sto = Math.floor(n / 100);
      const des = Math.floor((n % 100) / 10);
      const jed = n % 10;
      const typ = ri(0, 3);
      if (typ === 0) {
        tasks.push({
          text: `Kolik jednotek má číslo ${n}?`,
          ans: jed,
          hints: [`Jednotky jsou poslední (pravá) cifra čísla ${n}.`, `= ${jed}`],
          skill: 'calc', mc: true
        });
      } else if (typ === 1) {
        tasks.push({
          text: `Kolik desítek má číslo ${n}?`,
          ans: des,
          hints: [`Desítky jsou prostřední cifra trojciferného čísla.`, `= ${des}`],
          skill: 'calc', mc: true
        });
      } else if (typ === 2) {
        tasks.push({
          text: `Kolik stovek má číslo ${n}?`,
          ans: sto,
          hints: [`Stovky jsou první (levá) cifra trojciferného čísla.`, `= ${sto}`],
          skill: 'calc', mc: true
        });
      } else {
        tasks.push({
          text: `Číslo má stovky: ${sto}, desítky: ${des}, jednotky: ${jed}. Jaké je to číslo?`,
          ans: n,
          hints: [`${sto} × 100 + ${des} × 10 + ${jed}`, `= ${n}`],
          skill: 'calc', mc: true
        });
      }
    }
    return tasks;
  }

  // 1-2 Porovnávání čísel do 1000 (MC — ANO/NE)
  function gen_1_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const a = ri(100, 999), b = ri(100, 999);
        const op = ['<', '>'][ri(0, 1)];
        const correct = op === '<' ? a < b : a > b;
        tasks.push({
          text: `Je pravda, že ${a} ${op} ${b}?`,
          ans: correct ? 'ANO' : 'NE',
          hints: [`Porovnej nejdřív stovky: ${Math.floor(a / 100)} a ${Math.floor(b / 100)}.`, correct ? 'ANO' : 'NE'],
          skill: 'anal', mc: true
        });
      } else {
        let a = ri(100, 999), b = ri(100, 999);
        while (b === a) b = ri(100, 999);
        const bigger = Math.max(a, b);
        tasks.push({
          text: `Které číslo je větší: ${a}, nebo ${b}?`,
          ans: bigger,
          hints: [`Porovnej stovky, pak desítky a jednotky.`, `= ${bigger}`],
          skill: 'anal', mc: true
        });
      }
    }
    return tasks;
  }

  // 1-3 Zaokrouhlování na desítky a stovky
  function gen_1_3() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const n = ri(11, 990);
        const rounded = Math.round(n / 10) * 10;
        tasks.push({
          text: `Zaokrouhli ${n} na desítky.`,
          ans: rounded,
          hints: [`Podívej se na cifru jednotek: ${n % 10}. 0–4 dolů, 5–9 nahoru.`, `= ${rounded}`],
          skill: 'calc'
        });
      } else {
        const n = ri(50, 950);
        const rounded = Math.round(n / 100) * 100;
        tasks.push({
          text: `Zaokrouhli ${n} na stovky.`,
          ans: rounded,
          hints: [`Podívej se na cifru desítek: ${Math.floor((n % 100) / 10)}.`, `= ${rounded}`],
          skill: 'calc'
        });
      }
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 2 — SČÍTÁNÍ A ODČÍTÁNÍ DO 1000
  // ══════════════════════════════════════════════════════════════

  // 2-1 Sčítání do 1000
  function gen_2_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const a = ri(100, 700), b = ri(50, 290);
        tasks.push({
          text: `${a} + ${b} = ?`,
          ans: a + b,
          hints: [`Sečti nejdřív stovky, pak desítky a jednotky.`, `= ${a + b}`],
          skill: 'calc'
        });
      } else {
        const a = ri(20, 70) * 10;
        const b = ri(5, Math.floor((1000 - a) / 10)) * 10;
        tasks.push({
          text: `${a} + ${b} = ?`,
          ans: a + b,
          hints: [`Sčítáš celé desítky — sečti desítky a přidej nulu.`, `= ${a + b}`],
          skill: 'calc'
        });
      }
    }
    return tasks;
  }

  // 2-2 Odčítání do 1000
  function gen_2_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const b = ri(50, 400), a = b + ri(50, 550);
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `${a} − ${b} = ?`, ans: a - b, hints: [`Odečítej po skupinách: nejdřív stovky, pak zbytek.`, `= ${a - b}`], skill: 'calc' });
      } else if (typ === 1) {
        tasks.push({ text: `${a} − ? = ${a - b}`, ans: b, hints: [`Co odečteš od ${a}, abys dostal ${a - b}? Spočítej ${a} − ${a - b}.`, `= ${b}`], skill: 'calc' });
      } else {
        tasks.push({ text: `O kolik je ${a} více než ${b}?`, ans: a - b, hints: [`Rozdíl zjistíš odčítáním: ${a} − ${b}.`, `= ${a - b}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // 2-3 Slovní úlohy sčítání/odčítání
  function gen_2_3() {
    const tasks = [];
    const themes = [
      () => {
        const a = ri(120, 480), b = ri(80, 350);
        return { text: `Skřítek nasbíral ${a} žaludů a víla ${b} žaludů. Kolik žaludů mají dohromady?`, ans: a + b, h1: 'Sečti oba počty.', h2: `${a} + ${b} = ${a + b}` };
      },
      () => {
        const total = ri(400, 900), b = ri(100, total - 100);
        return { text: `Na louce kvetlo ${total} květin. ${b} jich utrhli na věnec. Kolik květin zbylo?`, ans: total - b, h1: 'Odečti utržené.', h2: `${total} − ${b} = ${total - b}` };
      },
      () => {
        const a = ri(100, 400), b = ri(100, 400);
        return { text: `V lese je ${a} smrků a ${b} borovic. Kolik je stromů celkem?`, ans: a + b, h1: 'Sečti oba druhy.', h2: `${a} + ${b} = ${a + b}` };
      }
    ];
    for (let i = 0; i < 10; i++) {
      const t = themes[i % themes.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 3 — NÁSOBILKA
  // ══════════════════════════════════════════════════════════════

  // 3-1 Malá násobilka 1–10 (MC)
  function gen_3_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const a = ri(2, 10), b = ri(2, 10);
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`${a} × ${b}: přičítej ${b} celkem ${a}-krát.`, `= ${a * b}`], skill: 'calc', mc: true });
      } else if (typ === 1) {
        tasks.push({ text: `${a} × ? = ${a * b}`, ans: b, hints: [`Jaké číslo dá s ${a} dohromady ${a * b}? Zkus ${a * b} ÷ ${a}.`, `= ${b}`], skill: 'calc', mc: true });
      } else {
        tasks.push({ text: `Kolik je ${a} krát ${b}?`, ans: a * b, hints: [`${a} krát ${b} je totéž co ${a} × ${b}.`, `= ${a * b}`], skill: 'calc', mc: true });
      }
    }
    return tasks;
  }

  // 3-2 Násobení 10, 100 a desítkami
  function gen_3_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 2);
      if (typ === 0) {
        const a = ri(2, 9);
        tasks.push({ text: `${a} × 10 = ?`, ans: a * 10, hints: [`Násobíš 10 → přidej jednu nulu.`, `= ${a * 10}`], skill: 'calc' });
      } else if (typ === 1) {
        const a = ri(2, 9);
        tasks.push({ text: `${a} × 100 = ?`, ans: a * 100, hints: [`Násobíš 100 → přidej dvě nuly.`, `= ${a * 100}`], skill: 'calc' });
      } else {
        const a = ri(2, 9), b = ri(2, 9) * 10;
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`${a} × ${b / 10} = ${a * (b / 10)}, přidej nulu.`, `= ${a * b}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // 3-3 Slovní úlohy násobení
  function gen_3_3() {
    const tasks = [];
    const themes = [
      () => {
        const a = ri(2, 9), b = ri(3, 9);
        return { text: `Na ${a} ${skl(a, 'větvi', 'větvích', 'větvích')} sedí po ${b} ptácích. Kolik ptáků je celkem?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b}` };
      },
      () => {
        const a = ri(2, 8), b = ri(2, 9);
        return { text: `Veverka má ${a} ${skl(a, 'skrýš', 'skrýše', 'skrýší')} a v každé ${b} ${skl(b, 'oříšek', 'oříšky', 'oříšků')}. Kolik oříšků má celkem?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b}` };
      },
      () => {
        const a = ri(2, 6), b = ri(10, 50);
        return { text: `Jeden košík hub stojí ${b} Kč. Kolik zaplatíš za ${a} ${skl(a, 'košík', 'košíky', 'košíků')}?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b} Kč` };
      }
    ];
    for (let i = 0; i < 10; i++) {
      const t = themes[i % themes.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 4 — DĚLENÍ
  // ══════════════════════════════════════════════════════════════

  // 4-1 Dělení bez zbytku (MC)
  function gen_4_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const b = ri(2, 10), q = ri(2, 10);
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `${b * q} ÷ ${b} = ?`, ans: q, hints: [`Jaké číslo × ${b} = ${b * q}?`, `= ${q}`], skill: 'calc', mc: true });
      } else if (typ === 1) {
        tasks.push({ text: `Kolikrát se ${b} vejde do ${b * q}?`, ans: q, hints: [`To je ${b * q} ÷ ${b}.`, `= ${q}`], skill: 'calc', mc: true });
      } else {
        tasks.push({ text: `? ÷ ${b} = ${q}`, ans: b * q, hints: [`Hledáš číslo, které po dělení ${b} dá ${q}. Spočítej ${b} × ${q}.`, `= ${b * q}`], skill: 'calc', mc: true });
      }
    }
    return tasks;
  }

  // 4-2 Dělení se zbytkem
  function gen_4_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const d = ri(2, 9), q = ri(2, 9), r = ri(1, d - 1);
      const n = d * q + r;
      if (ri(0, 1) === 0) {
        tasks.push({ text: `Rozděl ${n} do skupin po ${d}. Kolik zbyde?`, ans: r, hints: [`Největší násobek: ${d} × ${q} = ${d * q}. Zbyde ${n} − ${d * q}.`, `zbyde ${r}`], skill: 'calc' });
      } else {
        tasks.push({ text: `Rozděl ${n} do skupin po ${d}. Kolik celých skupin vznikne?`, ans: q, hints: [`${d} × ${q} = ${d * q} se ještě vejde, ${d} × ${q + 1} už ne.`, `= ${q}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // 4-3 Slovní úlohy dělení — mix: beze zbytku i se zbytkem (jako 4-1 a 4-2)
  function gen_4_3() {
    const tasks = [];
    const themes = [
      // — beze zbytku (vyjde celek) —
      () => {
        const d = ri(2, 7), total = d * ri(3, 9);
        return { text: `${total} oříšků rozdělíme rovným dílem mezi ${d} ${skl(d, 'veverku', 'veverky', 'veverek')}. Kolik dostane každá?`, ans: total / d, h1: `${total} : ${d}`, h2: `= ${total / d}` };
      },
      () => {
        const d = ri(2, 8), n = d * ri(3, 9);
        return { text: `Skřítek dal ${n} hub do ${d} ${skl(d, 'košíku', 'košíků', 'košíků')} stejně. Kolik hub je v jednom košíku?`, ans: n / d, h1: `${n} : ${d}`, h2: `= ${n / d}` };
      },
      () => {
        const cols = ri(3, 8), rows = ri(2, 6);
        return { text: `${rows * cols} stromků je vysázeno ${rows < 5 ? 've' : 'v'} ${rows} ${skl(rows, 'řadě', 'řadách', 'řadách')} stejně. Kolik stromků je v jedné řadě?`, ans: cols, h1: `${rows * cols} : ${rows}`, h2: `= ${cols}` };
      },
      // — se zbytkem: kolik zbyde —
      () => {
        const d = ri(3, 6), q = ri(3, 8), r = ri(1, d - 1), n = d * q + r;
        return { text: `Jezevec našel ${n} žaludů a rozděluje je rovným dílem mezi ${d} ${skl(d, 'jezevce', 'jezevce', 'jezevců')}. Kolik žaludů mu zbyde?`, ans: r, h1: `${d} × ${q} = ${d * q}, zbyde ${n} − ${d * q}.`, h2: `zbyde ${r}` };
      },
      // — se zbytkem: kolik plných skupin —
      () => {
        const d = ri(3, 6), q = ri(3, 8), r = ri(1, d - 1), n = d * q + r;
        return { text: `Máš ${n} jablek a dáváš je do pytlíků po ${d}. Kolik pytlíků úplně naplníš?`, ans: q, h1: `${d} × ${q} = ${d * q} se vejde, ${d} × ${q + 1} už ne.`, h2: `= ${q}` };
      }
    ];
    for (let i = 0; i < 10; i++) {
      const t = themes[i % themes.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 5 — GEOMETRIE
  // ══════════════════════════════════════════════════════════════

  // 5-1 Obvod trojúhelníku
  function gen_5_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const a = ri(2, 12), b = ri(2, 12), c = ri(2, 12);
        tasks.push({
          text: `Trojúhelník má strany ${a} cm, ${b} cm a ${c} cm. Jaký je jeho obvod?`,
          ans: a + b + c,
          hints: [`Obvod = součet všech tří stran: ${a} + ${b} + ${c}.`, `= ${a + b + c} cm`],
          skill: 'geo'
        });
      } else {
        const a = ri(3, 15);
        tasks.push({
          text: `Rovnostranný trojúhelník má stranu ${a} cm. Jaký je jeho obvod?`,
          ans: 3 * a,
          hints: [`Rovnostranný = tři stejné strany: 3 × ${a}.`, `= ${3 * a} cm`],
          skill: 'geo'
        });
      }
    }
    return tasks;
  }

  // 5-2 Obvod čtverce a obdélníku — jako SOUČET stran (3. roč., bez vzorců)
  function gen_5_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const a = ri(2, 12);
        tasks.push({
          text: `Čtverec má 4 stejné strany po ${a} cm. Jaký je jeho obvod?`,
          ans: 4 * a,
          hints: [`Sečti všechny 4 strany: ${a} + ${a} + ${a} + ${a}.`, `= ${4 * a} cm`],
          skill: 'geo'
        });
      } else {
        const a = ri(3, 12); let b = ri(2, 11); if (b >= a) b = a - 1;  // obdélník: různé strany
        tasks.push({
          text: `Obdélník má dvě strany po ${a} cm a dvě strany po ${b} cm. Jaký je jeho obvod?`,
          ans: 2 * (a + b),
          hints: [`Sečti všechny 4 strany: ${a} + ${b} + ${a} + ${b}.`, `= ${2 * (a + b)} cm`],
          skill: 'geo'
        });
      }
    }
    return tasks;
  }

  // 5-3 Úsečky, lomená čára a poznávání rovinných obrazců (3. ročník)
  function gen_5_3() {
    const SHAPES = [['čtverec', 4], ['obdélník', 4], ['trojúhelník', 3]];
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 3);
      if (typ === 0) {
        const a = ri(2, 9), b = ri(2, 9);
        tasks.push({
          text: `Body A, B, C leží za sebou v jedné řadě. Úsečka AB měří ${a} cm, úsečka BC měří ${b} cm. Jak dlouhá je úsečka AC?`,
          ans: a + b,
          hints: [`Sečti obě části: ${a} + ${b}.`, `= ${a + b} cm`],
          skill: 'geo'
        });
      } else if (typ === 1) {
        const a = ri(3, 9), n = ri(2, 4);
        tasks.push({
          text: `Lomená čára má ${n} stejné úseky po ${a} cm. Jaká je její celková délka?`,
          ans: a * n,
          hints: [`Sečti všechny úseky: ${n} × ${a}.`, `= ${a * n} cm`],
          skill: 'geo'
        });
      } else if (typ === 2) {
        const [nm, sides] = SHAPES[ri(0, SHAPES.length - 1)];
        tasks.push({
          text: `Kolik stran má ${nm}?`,
          ans: sides,
          hints: [`Spočítej strany po obvodu obrazce.`, `= ${sides}`],
          skill: 'geo'
        });
      } else {
        const [nm, corners] = SHAPES[ri(0, SHAPES.length - 1)];
        tasks.push({
          text: `Kolik vrcholů (rohů) má ${nm}?`,
          ans: corners,
          hints: [`Vrchol je roh obrazce — spočítej je.`, `= ${corners}`],
          skill: 'geo'
        });
      }
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 6 — JEDNOTKY A ČAS
  // ══════════════════════════════════════════════════════════════

  // 6-1 Jednotky délky (mm, cm, dm, m)
  function gen_6_1() {
    const tasks = [];
    const conversions = [
      () => { const n = ri(1, 9); return { text: `Kolik cm je ${n} dm? (1 dm = 10 cm)`, ans: n * 10, h1: '1 dm = 10 cm.', h2: `= ${n * 10} cm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik mm je ${n} cm? (1 cm = 10 mm)`, ans: n * 10, h1: '1 cm = 10 mm.', h2: `= ${n * 10} mm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik dm je ${n} m? (1 m = 10 dm)`, ans: n * 10, h1: '1 m = 10 dm.', h2: `= ${n * 10} dm` }; },
      () => { const n = ri(1, 9) * 10; return { text: `Kolik dm je ${n} cm?`, ans: n / 10, h1: 'Děl 10 (10 cm = 1 dm).', h2: `= ${n / 10} dm` }; },
      () => { const n = ri(1, 9) * 10; return { text: `Kolik cm je ${n} mm?`, ans: n / 10, h1: 'Děl 10 (10 mm = 1 cm).', h2: `= ${n / 10} cm` }; },
    ];
    for (let i = 0; i < 10; i++) {
      const t = conversions[i % conversions.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 6-2 Hmotnost a čas
  function gen_6_2() {
    const tasks = [];
    const items = [
      () => { const n = ri(1, 9); return { text: `Kolik g je ${n} kg? (1 kg = 1000 g)`, ans: n * 1000, h1: '1 kg = 1000 g.', h2: `= ${n * 1000} g` }; },
      () => { const n = ri(1, 8); return { text: `Kolik minut je ${n} ${skl(n, 'hodina', 'hodiny', 'hodin')}? (1 h = 60 min)`, ans: n * 60, h1: '1 h = 60 min.', h2: `= ${n * 60} min` }; },
      () => { const n = ri(1, 8); return { text: `Kolik sekund je ${n} ${skl(n, 'minuta', 'minuty', 'minut')}? (1 min = 60 s)`, ans: n * 60, h1: '1 min = 60 s.', h2: `= ${n * 60} s` }; },
      () => { const h = ri(1, 4), m = ri(5, 50); return { text: `${h} h ${m} min = kolik minut celkem?`, ans: h * 60 + m, h1: `${h} h = ${h * 60} min.`, h2: `${h * 60} + ${m} = ${h * 60 + m} min` }; },
      () => { const n = ri(2, 9); return { text: `Kolik hodin má ${n} ${skl(n, 'den', 'dny', 'dní')}? (1 den = 24 h)`, ans: n * 24, h1: '1 den = 24 h.', h2: `= ${n * 24} h` }; },
    ];
    for (let i = 0; i < 10; i++) {
      const t = items[i % items.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 6-3 Peníze
  function gen_6_3() {
    const tasks = [];
    const themes = [
      () => {
        const price = ri(8, 60), count = ri(2, 7);
        return { text: `Jeden perníček stojí ${price} Kč. Kolik zaplatíš za ${count} ${skl(count, 'perníček', 'perníčky', 'perníčků')}?`, ans: price * count, h1: `${price} × ${count}`, h2: `= ${price * count} Kč` };
      },
      () => {
        const total = ri(100, 500), price = ri(20, 90);
        return { text: `Měl jsi ${total} Kč a koupil sis lucernu za ${price} Kč. Kolik ti zbylo?`, ans: total - price, h1: `${total} − ${price}`, h2: `= ${total - price} Kč` };
      },
      () => {
        const a = ri(2, 5), b = ri(2, 5);
        return { text: `Máš ${a} ${skl(a, 'minci', 'mince', 'mincí')} po 10 Kč a ${b} ${skl(b, 'minci', 'mince', 'mincí')} po 5 Kč. Kolik máš celkem korun?`, ans: a * 10 + b * 5, h1: `${a}×10 + ${b}×5 = ${a * 10} + ${b * 5}`, h2: `= ${a * 10 + b * 5} Kč` };
      }
    ];
    for (let i = 0; i < 10; i++) {
      const t = themes[i % themes.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 7 — VELKÉ OPAKOVÁNÍ
  // ══════════════════════════════════════════════════════════════

  // 7-1 Počítání do 1000 (MC)
  function gen_7_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 2);
      if (typ === 0) {
        const a = ri(100, 700), b = ri(50, 250);
        tasks.push({ text: `${a} + ${b} = ?`, ans: a + b, hints: [`Sečti stovky a zbytek.`, `= ${a + b}`], skill: 'calc', mc: true });
      } else if (typ === 1) {
        const b = ri(50, 300), a = b + ri(100, 500);
        tasks.push({ text: `${a} − ${b} = ?`, ans: a - b, hints: [`Odečti po skupinách.`, `= ${a - b}`], skill: 'calc', mc: true });
      } else {
        const a = ri(2, 9), b = ri(2, 9);
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`Z malé násobilky.`, `= ${a * b}`], skill: 'calc', mc: true });
      }
    }
    return tasks;
  }

  // 7-2 Násobení a dělení 10, 100
  function gen_7_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 3);
      if (typ === 0) {
        const a = ri(2, 9);
        tasks.push({ text: `${a} × 100 = ?`, ans: a * 100, hints: [`Přidej dvě nuly.`, `= ${a * 100}`], skill: 'calc' });
      } else if (typ === 1) {
        const a = ri(2, 9) * 100;
        tasks.push({ text: `${a} ÷ 100 = ?`, ans: a / 100, hints: [`Ubereš dvě nuly.`, `= ${a / 100}`], skill: 'calc' });
      } else if (typ === 2) {
        const a = ri(2, 9) * 10;
        tasks.push({ text: `${a} ÷ 10 = ?`, ans: a / 10, hints: [`Ubereš jednu nulu.`, `= ${a / 10}`], skill: 'calc' });
      } else {
        const a = ri(2, 9), b = ri(2, 9) * 10;
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`${a} × ${b / 10}, pak přidej nulu.`, `= ${a * b}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // 7-3 Finální duel — mix všeho
  function gen_7_3() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 4);
      if (typ === 0) {
        const a = ri(2, 10), b = ri(2, 10);
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`Malá násobilka.`, `= ${a * b}`], skill: 'calc' });
      } else if (typ === 1) {
        const b = ri(2, 10), q = ri(2, 10);
        tasks.push({ text: `${b * q} ÷ ${b} = ?`, ans: q, hints: [`${b} × ? = ${b * q}.`, `= ${q}`], skill: 'calc' });
      } else if (typ === 2) {
        const a = ri(150, 700), b = ri(50, 250);
        tasks.push({ text: `${a} + ${b} = ?`, ans: a + b, hints: [`Po řádech.`, `= ${a + b}`], skill: 'calc' });
      } else if (typ === 3) {
        const n = ri(15, 980);
        const rounded = Math.round(n / 10) * 10;
        tasks.push({ text: `Zaokrouhli ${n} na desítky.`, ans: rounded, hints: [`Jednotky: ${n % 10}.`, `= ${rounded}`], skill: 'calc' });
      } else {
        const a = ri(2, 12), b = ri(2, 12), c = ri(2, 12);
        tasks.push({ text: `Obvod trojúhelníku se stranami ${a}, ${b}, ${c} cm?`, ans: a + b + c, hints: [`${a} + ${b} + ${c}.`, `= ${a + b + c} cm`], skill: 'geo' });
      }
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  window.RPG_TASK_EXTRA_3 = {
    '1-1': gen_1_1, '1-2': gen_1_2, '1-3': gen_1_3,
    '2-1': gen_2_1, '2-2': gen_2_2, '2-3': gen_2_3,
    '3-1': gen_3_1, '3-2': gen_3_2, '3-3': gen_3_3,
    '4-1': gen_4_1, '4-2': gen_4_2, '4-3': gen_4_3,
    '5-1': gen_5_1, '5-2': gen_5_2, '5-3': gen_5_3,
    '6-1': gen_6_1, '6-2': gen_6_2, '6-3': gen_6_3,
    '7-1': gen_7_1, '7-2': gen_7_2, '7-3': gen_7_3
  };
})();
