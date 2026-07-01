/* rpg-tasks-4.js — RPG Matematika 4 — rozšiřující banka úloh
   Pirátská plavba 🏴‍☠️ | Matýskova matematika 4. ročník
   window.RPG_TASK_EXTRA_4 = { '<mid>': ()=>[task,…], … } (21 misí)
*/
(function () {
  'use strict';
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const r1 = n => Math.round(n * 10) / 10;
  const cz = n => String(n).replace('.', ',');
  function skl(n, one, few, many) {
    const a = Math.abs(n);
    return a === 1 ? one : a >= 2 && a <= 4 ? few : many;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 1 — ČÍSLA DO 10 000
  // ══════════════════════════════════════════════════════════════

  // 1-1 Čtení a zápis čísel (MC — číselná)
  function gen_1_1() {
    const tasks = [];
    const RAD = [
      ['jednotek', x => x % 10, 'Jednotky jsou poslední (pravá) cifra.'],
      ['desítek', x => Math.floor(x / 10) % 10, 'Desítky jsou druhá cifra zprava.'],
      ['stovek', x => Math.floor(x / 100) % 10, 'Stovky jsou třetí cifra zprava.'],
      ['tisíců', x => Math.floor(x / 1000) % 10, 'Tisíce jsou první (levá) cifra čtyřciferného čísla.'],
    ];
    for (let i = 0; i < 10; i++) {
      const n = ri(1000, 9999);
      const typ = ri(0, 4);
      if (typ < 4) {
        const [name, fn, hint] = RAD[typ];
        tasks.push({ text: `Kolik ${name} má číslo ${n}?`, ans: fn(n), hints: [hint, `= ${fn(n)}`], skill: 'calc', mc: true });
      } else {
        const tis = Math.floor(n / 1000), sto = Math.floor((n % 1000) / 100), des = Math.floor((n % 100) / 10), jed = n % 10;
        tasks.push({ text: `Číslo má tisíce: ${tis}, stovky: ${sto}, desítky: ${des}, jednotky: ${jed}. Jaké je to číslo?`, ans: n, hints: [`${tis}×1000 + ${sto}×100 + ${des}×10 + ${jed}`, `= ${n}`], skill: 'calc', mc: true });
      }
    }
    return tasks;
  }

  // 1-2 Porovnávání čísel (MC — ANO/NE)
  function gen_1_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const a = ri(1000, 9999), b = ri(1000, 9999);
        const op = ['<', '>'][ri(0, 1)];
        const correct = op === '<' ? a < b : a > b;
        tasks.push({
          text: `Je pravda, že ${a} ${op} ${b}?`,
          ans: correct ? 'ANO' : 'NE',
          hints: [`Porovnej číslici tisíců: ${Math.floor(a / 1000)} a ${Math.floor(b / 1000)}.`, correct ? 'ANO' : 'NE'],
          skill: 'anal', mc: true
        });
      } else {
        let a = ri(1000, 9999), b = ri(1000, 9999);
        while (b === a) b = ri(1000, 9999);
        const bigger = Math.max(a, b);
        tasks.push({
          text: `Které číslo je větší: ${a}, nebo ${b}?`,
          ans: bigger,
          hints: [`Porovnej nejdřív tisíce, pak nižší řády.`, `= ${bigger}`],
          skill: 'anal', mc: true
        });
      }
    }
    return tasks;
  }

  // 1-3 Zaokrouhlování
  function gen_1_3() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 2);
      if (typ === 0) {
        const n = ri(100, 9950);
        const rounded = Math.round(n / 100) * 100;
        tasks.push({
          text: `Zaokrouhli ${n} na stovky.`,
          ans: rounded,
          hints: [`Podívej se na cifru desítek: ${Math.floor((n % 100) / 10)}.`, `= ${rounded}`],
          skill: 'calc'
        });
      } else if (typ === 1) {
        const n = ri(100, 9990);
        const rounded = Math.round(n / 10) * 10;
        tasks.push({
          text: `Zaokrouhli ${n} na desítky.`,
          ans: rounded,
          hints: [`Podívej se na cifru jednotek: ${n % 10}.`, `= ${rounded}`],
          skill: 'calc'
        });
      } else {
        const n = ri(1000, 9500);
        const rounded = Math.round(n / 1000) * 1000;
        tasks.push({
          text: `Zaokrouhli ${n} na tisíce.`,
          ans: rounded,
          hints: [`Podívej se na cifru stovek: ${Math.floor((n % 1000) / 100)}.`, `= ${rounded}`],
          skill: 'calc'
        });
      }
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 2 — SČÍTÁNÍ A ODČÍTÁNÍ DO 10 000
  // ══════════════════════════════════════════════════════════════

  // 2-1 Sčítání (přechod přes stovku/tisíc)
  function gen_2_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      let a = ri(1000, 8000), b = ri(100, 2000);
      if (a + b > 10000) a -= 1000;
      const sum = a + b;
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `${a} + ${b} = ?`, ans: sum, hints: [`Sečti stovky, pak tisíce.`, `= ${sum}`], skill: 'calc' });
      } else if (typ === 1) {
        tasks.push({ text: `${a} + ? = ${sum}`, ans: b, hints: [`Co přičteš k ${a}, abys dostal ${sum}? Spočítej ${sum} − ${a}.`, `= ${b}`], skill: 'calc' });
      } else {
        tasks.push({ text: `Kolik chybí ${a} do ${sum}?`, ans: b, hints: [`Zjistíš to odčítáním: ${sum} − ${a}.`, `= ${b}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // 2-2 Odčítání
  function gen_2_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const b = ri(100, 3000);
      const a = b + ri(100, 6000);
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `${a} − ${b} = ?`, ans: a - b, hints: [`Odečítej odleva po skupinách.`, `= ${a - b}`], skill: 'calc' });
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
        const a = ri(1200, 4800), b = ri(500, 2500);
        return { text: `Pirátská loď naložila ${a} kg zlata a ještě ${b} kg stříbra. Kolik kg nákladu má celkem?`, ans: a + b, h1: 'Sečti obě váhy.', h2: `${a} + ${b} = ${a + b} kg` };
      },
      () => {
        const total = ri(3000, 9000), b = ri(500, total - 500);
        return { text: `Truhla měla ${total} zlatých. Pirát utratil ${b} zlatých. Kolik zlatých zbylo?`, ans: total - b, h1: 'Odečti utracené.', h2: `${total} − ${b} = ${total - b}` };
      },
      () => {
        const a = ri(1000, 5000), b = ri(500, 3000);
        return { text: `Na ostrově je ${a} kokosových palem a ${b} dalších stromů. Kolik stromů celkem?`, ans: a + b, h1: 'Sečti oba počty.', h2: `${a} + ${b} = ${a + b}` };
      }
    ];
    for (let i = 0; i < 10; i++) {
      const t = themes[i % themes.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 3 — NÁSOBENÍ
  // ══════════════════════════════════════════════════════════════

  // 3-1 Násobilka (1–10), MC
  function gen_3_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const a = ri(2, 10), b = ri(2, 10);
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`${a} × ${b}: ${a}-krát přidej ${b}.`, `= ${a * b}`], skill: 'calc', mc: true });
      } else if (typ === 1) {
        tasks.push({ text: `${a} × ? = ${a * b}`, ans: b, hints: [`Jaké číslo dá s ${a} dohromady ${a * b}? Zkus ${a * b} ÷ ${a}.`, `= ${b}`], skill: 'calc', mc: true });
      } else {
        tasks.push({ text: `Kolik je ${a} krát ${b}?`, ans: a * b, hints: [`${a} krát ${b} je totéž co ${a} × ${b}.`, `= ${a * b}`], skill: 'calc', mc: true });
      }
    }
    return tasks;
  }

  // 3-2 Násobení desítkami a stovkami
  function gen_3_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const a = ri(2, 9), b = ri(2, 9) * 10;
        tasks.push({
          text: `${a} × ${b} = ?`,
          ans: a * b,
          hints: [`${a} × ${b} = ${a} × ${b / 10} × 10.`, `= ${a * b}`],
          skill: 'calc'
        });
      } else {
        const a = ri(2, 9), b = ri(2, 9) * 100;
        tasks.push({
          text: `${a} × ${b} = ?`,
          ans: a * b,
          hints: [`${a} × ${b} = ${a} × ${b / 100} × 100.`, `= ${a * b}`],
          skill: 'calc'
        });
      }
    }
    return tasks;
  }

  // 3-3 Násobení s přechodem
  function gen_3_3() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const a = ri(11, 99), b = ri(2, 9);
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`Rozlož: ${Math.floor(a / 10) * 10} × ${b} + ${a % 10} × ${b}.`, `= ${a * b}`], skill: 'calc' });
      } else if (typ === 1) {
        tasks.push({ text: `Kolik je ${b} krát ${a}?`, ans: a * b, hints: [`${b} krát ${a} je ${a} × ${b}. Rozlož ${a} na desítky a jednotky.`, `= ${a * b}`], skill: 'calc' });
      } else {
        tasks.push({ text: `${a} × ? = ${a * b}`, ans: b, hints: [`Hledáš, kolikrát vzít ${a}, abys dostal ${a * b}. Zkus ${a * b} ÷ ${a}.`, `= ${b}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 4 — DĚLENÍ
  // ══════════════════════════════════════════════════════════════

  // 4-1 Dělení bez zbytku (z násobilky), MC
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
      const d = ri(3, 9), q = ri(2, 9), r = ri(1, d - 1);
      const n = d * q + r;
      if (ri(0, 1) === 0) {
        tasks.push({ text: `Rozděl ${n} do skupin po ${d}. Kolik zbyde?`, ans: r, hints: [`${d} × ${q} = ${d * q}. Zbyde ${n} − ${d * q}.`, `zbyde ${r}`], skill: 'calc' });
      } else {
        tasks.push({ text: `Rozděl ${n} do skupin po ${d}. Kolik celých skupin vznikne?`, ans: q, hints: [`${d} × ${q} = ${d * q} se vejde, ${d} × ${q + 1} už ne.`, `= ${q}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // 4-3 Slovní úlohy dělení
  function gen_4_3() {
    const tasks = [];
    const themes = [
      () => {
        const d = ri(3, 8), total = d * ri(4, 12);
        return { text: `${total} zlatých mincí rozdělíme rovně mezi ${d} ${skl(d, 'piráta', 'piráty', 'pirátů')}. Kolik zlatých dostane každý?`, ans: total / d, h1: `Dělíme ${total} : ${d}.`, h2: `= ${total / d}` };
      },
      () => {
        const d = ri(3, 9), n = d * ri(3, 10);
        return { text: `Pirát rozdělil ${n} sušenek do ${d} pytlíků stejně. Kolik sušenek je v každém pytlíku?`, ans: n / d, h1: `${n} : ${d}`, h2: `= ${n / d}` };
      },
      () => {
        const rows = ri(3, 8), cols = ri(3, 8);
        return { text: `${rows * cols} pokladů je uloženo ${rows < 5 ? 've' : 'v'} ${rows} ${skl(rows, 'řadě', 'řadách', 'řadách')} stejně. Kolik je pokladů v každé řadě?`, ans: cols, h1: `${rows * cols} : ${rows}`, h2: `= ${cols}` };
      }
    ];
    for (let i = 0; i < 10; i++) {
      const t = themes[i % themes.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 5 — GEOMETRIE — ROVINNÉ TVARY
  // ══════════════════════════════════════════════════════════════

  // 5-1 Obvod obdélníku a čtverce
  function gen_5_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const a = ri(3, 15), b = ri(3, 15);
        tasks.push({
          text: `Obdélník má délky stran ${a} cm a ${b} cm. Jaký je jeho obvod?`,
          ans: 2 * (a + b),
          hints: [`O = 2 × (a + b) = 2 × (${a} + ${b}).`, `= ${2 * (a + b)} cm`],
          skill: 'geo'
        });
      } else {
        const a = ri(3, 18);
        tasks.push({
          text: `Čtverec má stranu ${a} cm. Jaký je jeho obvod?`,
          ans: 4 * a,
          hints: [`O = 4 × a = 4 × ${a}.`, `= ${4 * a} cm`],
          skill: 'geo'
        });
      }
    }
    return tasks;
  }

  // 5-2 Obsah obdélníku a čtverce
  function gen_5_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const a = ri(3, 15), b = ri(3, 15);
        tasks.push({
          text: `Obdélník má délky stran ${a} cm a ${b} cm. Jaký je jeho obsah?`,
          ans: a * b,
          hints: [`S = a × b = ${a} × ${b}.`, `= ${a * b} cm²`],
          skill: 'geo'
        });
      } else {
        const a = ri(3, 12);
        tasks.push({
          text: `Čtverec má stranu ${a} cm. Jaký je jeho obsah?`,
          ans: a * a,
          hints: [`S = a × a = ${a} × ${a}.`, `= ${a * a} cm²`],
          skill: 'geo'
        });
      }
    }
    return tasks;
  }

  // 5-3 Souřadnice a síť
  function gen_5_3() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const a = ri(2, 10), b = ri(2, 10);
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({
          text: `Kolik čtverečků pokryje obdélník o stranách ${a} a ${b} cm (1 čtvereček = 1 cm²)?`,
          ans: a * b,
          hints: [`Počet čtverečků = ${a} × ${b}.`, `= ${a * b}`],
          skill: 'geo'
        });
      } else if (typ === 1) {
        const perimeter = 2 * (a + b);
        tasks.push({
          text: `Zahrada tvaru obdélníku má strany ${a} m a ${b} m. Kolik metrů plotu potřebujeme na ohrazení?`,
          ans: perimeter,
          hints: [`Plot = obvod = 2 × (${a} + ${b}).`, `= ${perimeter} m`],
          skill: 'geo'
        });
      } else {
        tasks.push({
          text: `Kolik os souměrnosti má čtverec?`,
          ans: 4,
          hints: ['Čtverec má osy souměrnosti: 2 úhlopříčky + 2 středové.', '= 4'],
          skill: 'geo'
        });
      }
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 6 — MÍRY A JEDNOTKY
  // ══════════════════════════════════════════════════════════════

  // 6-1 Délka (km, m, dm, cm, mm)
  function gen_6_1() {
    const tasks = [];
    const conversions = [
      () => { const n = ri(1, 9); return { text: `Kolik cm je ${n} dm? (1 dm = 10 cm)`, ans: n * 10, h1: '1 dm = 10 cm.', h2: `= ${n * 10} cm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik mm je ${n} cm? (1 cm = 10 mm)`, ans: n * 10, h1: '1 cm = 10 mm.', h2: `= ${n * 10} mm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik m je ${n} km? (1 km = 1000 m)`, ans: n * 1000, h1: '1 km = 1000 m.', h2: `= ${n * 1000} m` }; },
      () => { const n = ri(1, 9) * 10; return { text: `Kolik dm je ${n} cm?`, ans: n / 10, h1: 'Děl 10.', h2: `= ${n / 10} dm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik dm je ${n} m? (1 m = 10 dm)`, ans: n * 10, h1: '1 m = 10 dm.', h2: `= ${n * 10} dm` }; },
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
      () => { const n = ri(2, 9) * 1000; return { text: `Kolik kg je ${n} g?`, ans: n / 1000, h1: 'Děl 1000.', h2: `= ${n / 1000} kg` }; },
      () => { const h = ri(1, 5), m = ri(5, 55); return { text: `${h} h ${m} min = kolik minut celkem?`, ans: h * 60 + m, h1: `${h} h = ${h * 60} min.`, h2: `${h * 60} + ${m} = ${h * 60 + m} min` }; },
    ];
    for (let i = 0; i < 10; i++) {
      const t = items[i % items.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 6-3 Peníze a slovní úlohy s mírami
  function gen_6_3() {
    const tasks = [];
    const themes = [
      () => {
        const price = ri(15, 99), count = ri(2, 8);
        return { text: `Každá mapa pirátského ostrova stojí ${price} Kč. Kolik zaplatíme za ${count} ${skl(count, 'mapu', 'mapy', 'map')}?`, ans: price * count, h1: `${price} × ${count}`, h2: `= ${price * count} Kč` };
      },
      () => {
        const total = ri(50, 300), price = ri(10, 50);
        return { text: `Pirát měl ${total} Kč a koupil lano za ${price} Kč. Kolik mu zbylo?`, ans: total - price, h1: `${total} − ${price}`, h2: `= ${total - price} Kč` };
      },
      () => {
        const h = ri(2, 6), m = ri(10, 50);
        return { text: `Pirátská loď plula ${h} h ${m} min. Kolik minut plula celkem?`, ans: h * 60 + m, h1: `${h} h = ${h * 60} min.`, h2: `${h * 60} + ${m} = ${h * 60 + m} min` };
      }
    ];
    for (let i = 0; i < 10; i++) {
      const t = themes[i % themes.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 7 — ČÍSLA DO 1 000 000
  // ══════════════════════════════════════════════════════════════

  // 7-1 Čtení a zápis velkých čísel, MC
  function gen_7_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const tis = ri(10, 999);
      const n = tis * 1000;
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `Jak zapíšeme číslem: ${tis} tisíc?`, ans: n, hints: [`Tisíce: ${tis}, stovky: 0, desítky: 0, jednotky: 0.`, `= ${n}`], skill: 'calc', mc: true });
      } else if (typ === 1) {
        tasks.push({ text: `Kolik tisíců má číslo ${n}?`, ans: tis, hints: [`Oddělíš poslední tři nuly (jednotky tisíců).`, `= ${tis}`], skill: 'calc', mc: true });
      } else {
        const m = ri(2, 9);
        tasks.push({ text: `Kolik je ${m} × 1000?`, ans: m * 1000, hints: [`Násobíš 1000 → přidej tři nuly.`, `= ${m * 1000}`], skill: 'calc', mc: true });
      }
    }
    return tasks;
  }

  // 7-2 Operace s velkými čísly
  function gen_7_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const a = ri(10000, 499000), b = ri(10000, 499000);
        tasks.push({
          text: `${a} + ${b} = ?`,
          ans: a + b,
          hints: [`Sečti stejné řády pod sebou.`, `= ${a + b}`],
          skill: 'calc'
        });
      } else {
        const b = ri(10000, 400000);
        const a = b + ri(10000, 400000);
        tasks.push({
          text: `${a} − ${b} = ?`,
          ans: a - b,
          hints: [`Odečítej po řádech.`, `= ${a - b}`],
          skill: 'calc'
        });
      }
    }
    return tasks;
  }

  // 7-3 Velké číslo — finální duel
  function gen_7_3() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const n = ri(10000, 999000);
      const tis = Math.floor(n / 1000);
      const sto = Math.floor((n % 1000) / 100);
      const typ = ri(0, 3);
      if (typ === 0) {
        tasks.push({
          text: `Zaokrouhli ${n} na tisíce.`,
          ans: Math.round(n / 1000) * 1000,
          hints: [`Stovky: ${sto}. Zaokrouhluješ tisíce.`, `= ${Math.round(n / 1000) * 1000}`],
          skill: 'calc'
        });
      } else if (typ === 1) {
        const a = ri(10000, 500000), b = ri(10000, 500000 - a + 10000);
        tasks.push({ text: `${a} + ${b} = ?`, ans: a + b, hints: [`Sečti po řádech.`, `= ${a + b}`], skill: 'calc' });
      } else if (typ === 2) {
        const b = ri(10000, 300000);
        const a = b + ri(10000, 300000);
        tasks.push({ text: `${a} − ${b} = ?`, ans: a - b, hints: [`Odečítej po řádech.`, `= ${a - b}`], skill: 'calc' });
      } else {
        const a = ri(2, 9), b = ri(100, 999);
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`Rozlož ${b} na stovky, desítky a jednotky a násob každou část.`, `= ${a * b}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  window.RPG_TASK_EXTRA_4 = {
    '1-1': gen_1_1, '1-2': gen_1_2, '1-3': gen_1_3,
    '2-1': gen_2_1, '2-2': gen_2_2, '2-3': gen_2_3,
    '3-1': gen_3_1, '3-2': gen_3_2, '3-3': gen_3_3,
    '4-1': gen_4_1, '4-2': gen_4_2, '4-3': gen_4_3,
    '5-1': gen_5_1, '5-2': gen_5_2, '5-3': gen_5_3,
    '6-1': gen_6_1, '6-2': gen_6_2, '6-3': gen_6_3,
    '7-1': gen_7_1, '7-2': gen_7_2, '7-3': gen_7_3
  };
})();
