/* rpg-tasks-5.js — RPG Matematika 5 — rozšiřující banka úloh
   Dračí říše 🐉 | Matematika 5. ročník (velká čísla, písemné ×÷, zlomky, desetinná)
   window.RPG_TASK_EXTRA_5 = { '<mid>': ()=>[task,…], … } (21 misí)
   POZOR: MC mise (1-1,1-2,3-1,4-1,7-1) smí mít jen numerické nebo ANO/NE odpovědi.
*/
(function () {
  'use strict';
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const r1 = n => Math.round(n * 10) / 10;
  const r2 = n => Math.round(n * 100) / 100;
  const cz = n => String(n).replace('.', ',');
  function skl(n, one, few, many) {
    const a = Math.abs(n);
    return a === 1 ? one : a >= 2 && a <= 4 ? few : many;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 1 — VELKÁ ČÍSLA (do/přes milion)
  // ══════════════════════════════════════════════════════════════

  // 1-1 Čtení a zápis velkých čísel (MC — číselná)
  function gen_1_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const tis = ri(12, 980);
        const n = tis * 1000;
        tasks.push({
          text: `Jak zapíšeme číslem: ${tis} tisíc?`,
          ans: n,
          hints: [`Tisíce: ${tis}, pak tři nuly (stovky, desítky, jednotky).`, `= ${n}`],
          skill: 'calc', mc: true
        });
      } else {
        const n = ri(100000, 999999);
        const dtis = Math.floor(n / 10000) % 10;
        tasks.push({
          text: `Jakou cifru má číslo ${n} na místě desetitisíců?`,
          ans: dtis,
          hints: [`Řády zprava: J, D, S, tisíce, desetitisíce (5. cifra zprava).`, `= ${dtis}`],
          skill: 'anal', mc: true
        });
      }
    }
    return tasks;
  }

  // 1-2 Porovnávání velkých čísel (MC — ANO/NE)
  function gen_1_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 1);
      if (typ === 0) {
        const a = ri(10000, 999999), b = ri(10000, 999999);
        const op = ['<', '>'][ri(0, 1)];
        const correct = op === '<' ? a < b : a > b;
        tasks.push({
          text: `Je pravda, že ${a} ${op} ${b}?`,
          ans: correct ? 'ANO' : 'NE',
          hints: [`Porovnej od nejvyššího řádu — kdo má víc statisíců/desetitisíců.`, correct ? 'ANO' : 'NE'],
          skill: 'anal', mc: true
        });
      } else {
        let a = ri(10000, 999999), b = ri(10000, 999999);
        while (b === a) b = ri(10000, 999999);
        const bigger = Math.max(a, b);
        tasks.push({
          text: `Které číslo je větší: ${a}, nebo ${b}?`,
          ans: bigger,
          hints: [`Porovnávej od nejvyššího řádu doleva.`, `= ${bigger}`],
          skill: 'anal', mc: true
        });
      }
    }
    return tasks;
  }

  // 1-3 Zaokrouhlování velkých čísel
  function gen_1_3() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 2);
      if (typ === 0) {
        const n = ri(1200, 998000);
        const v = Math.round(n / 1000) * 1000;
        tasks.push({ text: `Zaokrouhli ${n} na tisíce.`, ans: v, hints: [`Dívej se na cifru stovek: ${Math.floor((n % 1000) / 100)}.`, `= ${v}`], skill: 'calc' });
      } else if (typ === 1) {
        const n = ri(12000, 980000);
        const v = Math.round(n / 10000) * 10000;
        tasks.push({ text: `Zaokrouhli ${n} na desetitisíce.`, ans: v, hints: [`Dívej se na cifru tisíců: ${Math.floor((n % 10000) / 1000)}.`, `= ${v}`], skill: 'calc' });
      } else {
        const n = ri(120000, 950000);
        const v = Math.round(n / 100000) * 100000;
        tasks.push({ text: `Zaokrouhli ${n} na statisíce.`, ans: v, hints: [`Dívej se na cifru desetitisíců: ${Math.floor((n % 100000) / 10000)}.`, `= ${v}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 2 — PÍSEMNÉ NÁSOBENÍ
  // ══════════════════════════════════════════════════════════════

  // 2-1 Násobení víceciferné × jednociferné
  function gen_2_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const a = ri(112, 989), b = ri(3, 9);
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`Násob každou cifru zprava, přenosy přičítej do vyššího řádu.`, `= ${a * b}`], skill: 'calc' });
      } else if (typ === 1) {
        tasks.push({ text: `${a} × ? = ${a * b}`, ans: b, hints: [`Kolikrát vzít ${a}, abys dostal ${a * b}? Spočítej ${a * b} ÷ ${a}.`, `= ${b}`], skill: 'calc' });
      } else {
        tasks.push({ text: `Kolik je ${b} krát ${a}?`, ans: a * b, hints: [`${b} krát ${a} je ${a} × ${b}.`, `= ${a * b}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // 2-2 Násobení dvojciferným
  function gen_2_2() {
    const tasks = [];
    const themes = [
      () => { const a = ri(12, 45), b = ri(12, 40); return { text: `Rytíř posbíral ${a} mincí v každé z ${b} truhel. Kolik mincí má celkem?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b}` }; },
      () => { const a = ri(15, 60), b = ri(12, 30); return { text: `Jedna dračí šupina váží ${a} g. Kolik váží ${b} šupin?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b} g` }; },
    ];
    for (let i = 0; i < 10; i++) {
      const a = ri(23, 98), b = ri(12, 49);
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`${a} × ${b % 10} a ${a} × ${Math.floor(b / 10)}0, pak sečti.`, `= ${a * b}`], skill: 'calc' });
      } else if (typ === 1) {
        tasks.push({ text: `Kolik je ${a} krát ${b}?`, ans: a * b, hints: [`${a} krát ${b} je ${a} × ${b}.`, `= ${a * b}`], skill: 'calc' });
      } else {
        const t = themes[ri(0, themes.length - 1)]();
        tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
      }
    }
    return tasks;
  }

  // 2-3 Slovní úlohy násobení
  function gen_2_3() {
    const tasks = [];
    const themes = [
      () => { const a = ri(120, 480), b = ri(4, 9); return { text: `Drak střeží ${a} zlatých ${b < 5 ? 've' : 'v'} ${b} ${skl(b, 'jeskyni', 'jeskyních', 'jeskyních')}. Kolik zlatých střeží celkem?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b}` }; },
      () => { const a = ri(15, 60), b = ri(12, 30); return { text: `Jedna dračí šupina váží ${a} g. Kolik váží ${b} ${skl(b, 'šupina', 'šupiny', 'šupin')}?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b} g` }; },
      () => { const a = ri(125, 350), b = ri(6, 9); return { text: `Rytíř ujede ${a} km za den. Kolik ujede za ${b} ${skl(b, 'den', 'dny', 'dní')}?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b} km` }; }
    ];
    for (let i = 0; i < 10; i++) { const t = themes[i % themes.length](); tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' }); }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 3 — PÍSEMNÉ DĚLENÍ
  // ══════════════════════════════════════════════════════════════

  // 3-1 Dělení jednociferným, beze zbytku (MC — číselná)
  function gen_3_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const b = ri(3, 9), q = ri(23, 142);
      const n = b * q;
      const typ = ri(0, 2);
      if (typ === 0) {
        tasks.push({ text: `${n} ÷ ${b} = ?`, ans: q, hints: [`Děl postupně zleva: kolikrát se ${b} vejde do prvních cifer.`, `= ${q}`], skill: 'calc', mc: true });
      } else if (typ === 1) {
        tasks.push({ text: `Kolikrát se ${b} vejde do ${n}?`, ans: q, hints: [`To je ${n} ÷ ${b}.`, `= ${q}`], skill: 'calc', mc: true });
      } else {
        tasks.push({ text: `? ÷ ${b} = ${q}`, ans: n, hints: [`Hledáš číslo, které po dělení ${b} dá ${q}. Spočítej ${b} × ${q}.`, `= ${n}`], skill: 'calc', mc: true });
      }
    }
    return tasks;
  }

  // 3-2 Dělení se zbytkem
  function gen_3_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const b = ri(3, 9), q = ri(20, 130), r = ri(1, b - 1);
      const n = b * q + r;
      if (ri(0, 1) === 0) {
        tasks.push({ text: `${n} ÷ ${b} = ? (napiš jen zbytek)`, ans: r, hints: [`Největší násobek ${b}: ${b} × ${q} = ${b * q}. Zbytek = ${n} − ${b * q}.`, `zbytek = ${r}`], skill: 'calc' });
      } else {
        tasks.push({ text: `${n} ÷ ${b} = ? (napiš jen celý podíl, bez zbytku)`, ans: q, hints: [`${b} × ${q} = ${b * q} se ještě vejde, ${b} × ${q + 1} už ne.`, `podíl = ${q}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // 3-3 Slovní úlohy dělení
  function gen_3_3() {
    const tasks = [];
    const themes = [
      () => { const b = ri(4, 8), q = ri(40, 120); return { text: `${b * q} zlatých rozdělíme rovně mezi ${b} ${skl(b, 'rytíře', 'rytíře', 'rytířů')}. Kolik dostane každý?`, ans: q, h1: `${b * q} : ${b}`, h2: `= ${q}` }; },
      () => { const b = ri(3, 7), q = ri(30, 90); return { text: `Drak snese ${b * q} vajec do ${b} ${skl(b, 'hnízda', 'hnízd', 'hnízd')} stejně. Kolik vajec je v jednom hnízdě?`, ans: q, h1: `${b * q} : ${b}`, h2: `= ${q}` }; },
      () => { const per = ri(6, 12), groups = ri(8, 20); return { text: `${per * groups} kusů zlata uložíme po ${per} do truhel. Kolik truhel potřebujeme?`, ans: groups, h1: `${per * groups} : ${per}`, h2: `= ${groups}` }; }
    ];
    for (let i = 0; i < 10; i++) { const t = themes[i % themes.length](); tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' }); }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 4 — ZLOMKY
  // ══════════════════════════════════════════════════════════════

  // 4-1 Zlomek z čísla (MC — číselná)
  function gen_4_1() {
    const tasks = [];
    const DTIN = { 2: 'polovina', 3: 'třetina', 4: 'čtvrtina', 5: 'pětina', 6: 'šestina', 8: 'osmina', 10: 'desetina' };
    for (let i = 0; i < 10; i++) {
      const den = [2, 3, 4, 5, 6, 8, 10][ri(0, 6)];
      const mult = ri(2, 9);
      const whole = den * mult;
      if (ri(0, 1) === 0) {
        const num = ri(1, den - 1);
        tasks.push({ text: `Kolik je ${num}/${den} z čísla ${whole}?`, ans: (whole / den) * num, hints: [`Nejdřív ${whole} ÷ ${den} = ${whole / den}, pak × ${num}.`, `= ${(whole / den) * num}`], skill: 'calc', mc: true });
      } else {
        tasks.push({ text: `Kolik je ${DTIN[den]} z čísla ${whole}?`, ans: whole / den, hints: [`${DTIN[den]} znamená ÷ ${den}: ${whole} ÷ ${den}.`, `= ${whole / den}`], skill: 'calc', mc: true });
      }
    }
    return tasks;
  }

  // 4-2 Sčítání a odčítání zlomků (stejný jmenovatel) — čitatel výsledku
  function gen_4_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const den = [4, 5, 6, 7, 8, 9, 10][ri(0, 6)];
      const a = ri(1, den - 2), b = ri(1, den - 1 - a);
      const plus = ri(0, 1) === 0;
      if (plus) {
        tasks.push({
          text: `${a}/${den} + ${b}/${den} = ?/${den}\n(napiš jen čitatele výsledku)`,
          ans: a + b,
          hints: [`Jmenovatel zůstává ${den}, sečti čitatele: ${a} + ${b}.`, `čitatel = ${a + b}`],
          skill: 'calc'
        });
      } else {
        const big = Math.max(a + b, a), small = Math.min(a, b);
        tasks.push({
          text: `${big}/${den} − ${small}/${den} = ?/${den}\n(napiš jen čitatele výsledku)`,
          ans: big - small,
          hints: [`Jmenovatel zůstává ${den}, odečti čitatele: ${big} − ${small}.`, `čitatel = ${big - small}`],
          skill: 'calc'
        });
      }
    }
    return tasks;
  }

  // 4-3 Slovní úlohy se zlomky
  function gen_4_3() {
    const tasks = [];
    const themes = [
      () => { const den = [2, 3, 4, 5][ri(0, 3)], mult = ri(4, 9), whole = den * mult, num = ri(1, den - 1); return { text: `Ve třídě je ${whole} žáků. ${num}/${den} z nich jsou dívky. Kolik je dívek?`, ans: (whole / den) * num, h1: `${whole} ÷ ${den} × ${num}`, h2: `= ${(whole / den) * num}` }; },
      () => { const den = [4, 5, 6][ri(0, 2)], mult = ri(3, 8), whole = den * mult; return { text: `Drak měl ${whole} mincí. Utratil 1/${den} z nich. Kolik mincí utratil?`, ans: whole / den, h1: `${whole} ÷ ${den}`, h2: `= ${whole / den}` }; },
      () => { const den = [2, 4, 5, 10][ri(0, 3)], mult = ri(4, 9), whole = den * mult, num = ri(1, den - 1); return { text: `Cesta měří ${whole} km. Rytíř ujel ${num}/${den} cesty. Kolik km ujel?`, ans: (whole / den) * num, h1: `${whole} ÷ ${den} × ${num}`, h2: `= ${(whole / den) * num} km` }; }
    ];
    for (let i = 0; i < 10; i++) { const t = themes[i % themes.length](); tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' }); }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 5 — DESETINNÁ ČÍSLA
  // ══════════════════════════════════════════════════════════════

  // 5-1 Porovnávání desetinných čísel (MC — ANO/NE)
  function gen_5_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const a = r2(ri(10, 99) / 10); let b = r2(ri(10, 99) / 10);
      while (b === a) b = r2(ri(10, 99) / 10);
      const op = ['<', '>'][ri(0, 1)];
      const correct = op === '<' ? a < b : a > b;
      tasks.push({
        text: `Je pravda, že ${cz(a)} ${op} ${cz(b)}?`,
        ans: correct ? 'ANO' : 'NE',
        hints: [`Porovnej nejdřív celou část, pak desetiny.`, correct ? 'ANO' : 'NE'],
        skill: 'anal', mc: true
      });
    }
    return tasks;
  }

  // 5-2 Sčítání a odčítání desetinných čísel
  function gen_5_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const a = r1(ri(15, 95) / 10), b = r1(ri(11, 89) / 10);
      const plus = ri(0, 1) === 0;
      if (plus) {
        const v = r1(a + b);
        tasks.push({ text: `${cz(a)} + ${cz(b)} = ?`, ans: v, hints: [`Sčítej pod sebou, desetinnou čárku pod čárku.`, `= ${cz(v)}`], skill: 'calc' });
      } else {
        const big = Math.max(a, b), small = Math.min(a, b);
        const v = r1(big - small);
        tasks.push({ text: `${cz(big)} − ${cz(small)} = ?`, ans: v, hints: [`Odečítej pod sebou, čárku pod čárku.`, `= ${cz(v)}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // 5-3 Násobení a dělení desetinných 10 a 100
  function gen_5_3() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 3);
      if (typ === 0) {
        const a = r1(ri(11, 98) / 10);
        tasks.push({ text: `${cz(a)} × 10 = ?`, ans: r1(a * 10), hints: [`Posuň čárku o jedno místo doprava.`, `= ${cz(r1(a * 10))}`], skill: 'calc' });
      } else if (typ === 1) {
        const a = r2(ri(110, 980) / 100);
        tasks.push({ text: `${cz(a)} × 100 = ?`, ans: r2(a * 100), hints: [`Posuň čárku o dvě místa doprava.`, `= ${cz(r2(a * 100))}`], skill: 'calc' });
      } else if (typ === 2) {
        const a = ri(2, 9) * 10 + ri(0, 9);
        tasks.push({ text: `${a} ÷ 10 = ?`, ans: r1(a / 10), hints: [`Posuň čárku o jedno místo doleva.`, `= ${cz(r1(a / 10))}`], skill: 'calc' });
      } else {
        const a = ri(120, 990);
        tasks.push({ text: `${a} ÷ 100 = ?`, ans: r2(a / 100), hints: [`Posuň čárku o dvě místa doleva.`, `= ${cz(r2(a / 100))}`], skill: 'calc' });
      }
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 6 — GEOMETRIE A JEDNOTKY
  // ══════════════════════════════════════════════════════════════

  // 6-1 Obvod a obsah
  function gen_6_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 3);
      if (typ === 0) {
        const a = ri(4, 18), b = ri(3, 15);
        tasks.push({ text: `Obdélník ${a} cm × ${b} cm. Jaký je obvod? (cm)`, ans: 2 * (a + b), hints: [`O = 2 × (a + b) = 2 × (${a} + ${b}).`, `= ${2 * (a + b)} cm`], skill: 'geo' });
      } else if (typ === 1) {
        const a = ri(4, 18), b = ri(3, 15);
        tasks.push({ text: `Obdélník ${a} cm × ${b} cm. Jaký je obsah? (cm²)`, ans: a * b, hints: [`S = a × b = ${a} × ${b}.`, `= ${a * b} cm²`], skill: 'geo' });
      } else if (typ === 2) {
        const a = ri(3, 15);
        tasks.push({ text: `Čtverec se stranou ${a} cm. Jaký je obsah? (cm²)`, ans: a * a, hints: [`S = a × a = ${a} × ${a}.`, `= ${a * a} cm²`], skill: 'geo' });
      } else {
        const a = ri(3, 15);
        tasks.push({ text: `Čtverec se stranou ${a} cm. Jaký je obvod? (cm)`, ans: 4 * a, hints: [`O = 4 × a = 4 × ${a}.`, `= ${4 * a} cm`], skill: 'geo' });
      }
    }
    return tasks;
  }

  // 6-2 Převody jednotek
  function gen_6_2() {
    const tasks = [];
    const conv = [
      () => { const n = ri(2, 9); return { text: `Kolik m je ${n} km? (1 km = 1000 m)`, ans: n * 1000, h1: '1 km = 1000 m.', h2: `= ${n * 1000} m` }; },
      () => { const n = ri(2, 9); return { text: `Kolik g je ${n} kg?`, ans: n * 1000, h1: '1 kg = 1000 g.', h2: `= ${n * 1000} g` }; },
      () => { const n = ri(2, 9); return { text: `Kolik kg je ${n} t? (1 t = 1000 kg)`, ans: n * 1000, h1: '1 t = 1000 kg.', h2: `= ${n * 1000} kg` }; },
      () => { const n = ri(2, 9); return { text: `Kolik ml je ${n} l? (1 l = 1000 ml)`, ans: n * 1000, h1: '1 l = 1000 ml.', h2: `= ${n * 1000} ml` }; },
      () => { const n = ri(2, 9); return { text: `Kolik cm je ${n} m? (1 m = 100 cm)`, ans: n * 100, h1: '1 m = 100 cm.', h2: `= ${n * 100} cm` }; },
      () => { const n = ri(2, 6); return { text: `Kolik minut je ${n} ${skl(n, 'hodina', 'hodiny', 'hodin')}?`, ans: n * 60, h1: '1 h = 60 min.', h2: `= ${n * 60} min` }; },
    ];
    for (let i = 0; i < 10; i++) { const t = conv[i % conv.length](); tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' }); }
    return tasks;
  }

  // 6-3 Aritmetický průměr
  function gen_6_3() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const cnt = ri(2, 4);
      const avg = ri(8, 30);
      let nums, last;
      do {
        nums = [];
        let sum = 0;
        for (let k = 0; k < cnt - 1; k++) { const d = ri(-3, 3); nums.push(avg + d); sum += avg + d; }
        last = avg * cnt - sum;
      } while (last < 1 || last > avg + 6); // všechna čísla kladná a rozumná
      nums.push(last);
      tasks.push({
        text: `Jaký je aritmetický průměr čísel ${nums.join(', ')}?`,
        ans: avg,
        hints: [`Sečti všechna čísla (${nums.reduce((x, y) => x + y, 0)}) a vyděl počtem (${cnt}).`, `= ${avg}`],
        skill: 'anal'
      });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 7 — SOUBOJ S DRAKEM (finále)
  // ══════════════════════════════════════════════════════════════

  // 7-1 Velká čísla mix (MC — číselná)
  function gen_7_1() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 2);
      if (typ === 0) {
        const a = ri(120000, 480000), b = ri(120000, 480000);
        tasks.push({ text: `${a} + ${b} = ?`, ans: a + b, hints: [`Sčítej po řádech pod sebou.`, `= ${a + b}`], skill: 'calc', mc: true });
      } else if (typ === 1) {
        const b = ri(50000, 300000), a = b + ri(50000, 400000);
        tasks.push({ text: `${a} − ${b} = ?`, ans: a - b, hints: [`Odečítej po řádech.`, `= ${a - b}`], skill: 'calc', mc: true });
      } else {
        const n = ri(120000, 950000);
        const v = Math.round(n / 1000) * 1000;
        tasks.push({ text: `Zaokrouhli ${n} na tisíce.`, ans: v, hints: [`Cifra stovek rozhoduje.`, `= ${v}`], skill: 'calc', mc: true });
      }
    }
    return tasks;
  }

  // 7-2 Operace mix (písemné +−×÷)
  function gen_7_2() {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const typ = ri(0, 3);
      if (typ === 0) {
        const a = ri(115, 870), b = ri(3, 9);
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`Písemné násobení po cifrách.`, `= ${a * b}`], skill: 'calc' });
      } else if (typ === 1) {
        const b = ri(3, 9), q = ri(30, 130);
        tasks.push({ text: `${b * q} ÷ ${b} = ?`, ans: q, hints: [`Písemné dělení zleva.`, `= ${q}`], skill: 'calc' });
      } else if (typ === 2) {
        const a = r1(ri(15, 95) / 10), b = r1(ri(11, 89) / 10);
        tasks.push({ text: `${cz(a)} + ${cz(b)} = ?`, ans: r1(a + b), hints: [`Desetinná čárka pod čárku.`, `= ${cz(r1(a + b))}`], skill: 'calc' });
      } else {
        const den = [2, 4, 5, 10][ri(0, 3)], mult = ri(3, 9), whole = den * mult;
        tasks.push({ text: `Kolik je 1/${den} z ${whole}?`, ans: whole / den, hints: [`${whole} ÷ ${den}.`, `= ${whole / den}`], skill: 'calc' });
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
        const a = ri(112, 980), b = ri(12, 39);
        tasks.push({ text: `${a} × ${b} = ?`, ans: a * b, hints: [`Násobení dvojciferným.`, `= ${a * b}`], skill: 'calc' });
      } else if (typ === 1) {
        const b = ri(3, 9), q = ri(40, 140);
        tasks.push({ text: `${b * q} ÷ ${b} = ?`, ans: q, hints: [`Písemné dělení.`, `= ${q}`], skill: 'calc' });
      } else if (typ === 2) {
        const a = r1(ri(20, 95) / 10), b = r1(ri(11, 89) / 10);
        const big = Math.max(a, b), small = Math.min(a, b);
        tasks.push({ text: `${cz(big)} − ${cz(small)} = ?`, ans: r1(big - small), hints: [`Desetinné odčítání.`, `= ${cz(r1(big - small))}`], skill: 'calc' });
      } else if (typ === 3) {
        const a = ri(4, 16), b = ri(3, 14);
        tasks.push({ text: `Obsah obdélníku ${a} cm × ${b} cm? (cm²)`, ans: a * b, hints: [`S = a × b.`, `= ${a * b} cm²`], skill: 'geo' });
      } else {
        const cnt = 3, avg = ri(6, 24);
        const n1 = avg + ri(-2, 2), n2 = avg + ri(-2, 2), n3 = avg * cnt - n1 - n2;
        tasks.push({ text: `Aritmetický průměr čísel ${n1}, ${n2}, ${n3}?`, ans: avg, hints: [`Součet ÷ 3.`, `= ${avg}`], skill: 'anal' });
      }
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  window.RPG_TASK_EXTRA_5 = {
    '1-1': gen_1_1, '1-2': gen_1_2, '1-3': gen_1_3,
    '2-1': gen_2_1, '2-2': gen_2_2, '2-3': gen_2_3,
    '3-1': gen_3_1, '3-2': gen_3_2, '3-3': gen_3_3,
    '4-1': gen_4_1, '4-2': gen_4_2, '4-3': gen_4_3,
    '5-1': gen_5_1, '5-2': gen_5_2, '5-3': gen_5_3,
    '6-1': gen_6_1, '6-2': gen_6_2, '6-3': gen_6_3,
    '7-1': gen_7_1, '7-2': gen_7_2, '7-3': gen_7_3
  };
})();
