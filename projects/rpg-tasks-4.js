/* rpg-tasks-4.js — RPG Matematika 4 — rozšiřující banka úloh
   Pirátská plavba 🏴‍☠️ | Matýskova matematika 4. ročník
   window.RPG_TASK_EXTRA_4 = { '<mid>': ()=>[task,…], … } (21 misí)
*/
(function () {
  'use strict';
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const r1 = n => Math.round(n * 10) / 10;
  const cz = n => String(n).replace('.', ',');
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
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
    const T = [
      () => { const n = ri(1000, 9999); const [name, fn, hint] = RAD[0]; return { text: `Kolik ${name} má číslo ${n}?`, ans: fn(n), h1: hint, h2: `= ${fn(n)}` }; },
      () => { const n = ri(1000, 9999); const [name, fn, hint] = RAD[1]; return { text: `Kolik ${name} má číslo ${n}?`, ans: fn(n), h1: hint, h2: `= ${fn(n)}` }; },
      () => { const n = ri(1000, 9999); const [name, fn, hint] = RAD[2]; return { text: `Kolik ${name} má číslo ${n}?`, ans: fn(n), h1: hint, h2: `= ${fn(n)}` }; },
      () => { const n = ri(1000, 9999); const [name, fn, hint] = RAD[3]; return { text: `Kolik ${name} má číslo ${n}?`, ans: fn(n), h1: hint, h2: `= ${fn(n)}` }; },
      () => { const n = ri(1000, 9999); const tis = Math.floor(n / 1000), sto = Math.floor((n % 1000) / 100), des = Math.floor((n % 100) / 10), jed = n % 10; return { text: `Číslo má ${tis} ${skl(tis, 'tisíc', 'tisíce', 'tisíců')}, ${sto} ${skl(sto, 'stovku', 'stovky', 'stovek')}, ${des} ${skl(des, 'desítku', 'desítky', 'desítek')} a ${jed} ${skl(jed, 'jednotku', 'jednotky', 'jednotek')}. Jaké je to číslo?`, ans: n, h1: `${tis} × 1000 + ${sto} × 100 + ${des} × 10 + ${jed}`, h2: `= ${n}` }; },
      () => { const n = ri(1001, 9998); return { text: `Jaké číslo je o 1 větší než ${n}?`, ans: n + 1, h1: `Přičti jedničku.`, h2: `= ${n + 1}` }; },
      () => { const n = ri(1001, 9998); return { text: `Jaké číslo je o 1 menší než ${n}?`, ans: n - 1, h1: `Odečti jedničku.`, h2: `= ${n - 1}` }; },
      () => { const n = ri(1000, 9999); const tis = Math.floor(n / 1000), sto = Math.floor((n % 1000) / 100); return { text: `Doplň rozklad: ${n} = ${tis * 1000} + ${sto * 100} + ? + ${n % 10}`, ans: Math.floor((n % 100) / 10) * 10, h1: `Chybí řád desítek.`, h2: `= ${Math.floor((n % 100) / 10) * 10}` }; },
      () => { const n = ri(1000, 9999); const even = n % 2 === 0; return { text: `Je číslo ${n} sudé?`, ans: even ? 'ANO' : 'NE', h1: `Rozhoduje poslední cifra.`, h2: even ? 'ANO' : 'NE' }; },
      () => { const n = ri(1010, 9980); const next = Math.ceil((n + 1) / 100) * 100; return { text: `Jaká celá stovka následuje hned po čísle ${n}?`, ans: next, h1: `Nejbližší vyšší číslo končící dvěma nulami.`, h2: `= ${next}` }; },
      () => { const a = ri(2, 9), b = ri(2, 9); const n = a * 1000 + b; return { text: `Kapitán zapsal do lodního deníku číslo: ${a} ${skl(a, 'tisíc', 'tisíce', 'tisíců')} a ${b} ${skl(b, 'jednotka', 'jednotky', 'jednotek')}. Jaké číslo to je?`, ans: n, h1: `Pozor — stovky a desítky jsou nula: ${a}0 0${b}.`, h2: `= ${n}` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true });
    }
    return tasks;
  }

  // 1-2 Porovnávání čísel (MC — ANO/NE i číselná)
  function gen_1_2() {
    const dva = () => { let a = ri(1000, 9999), b = ri(1000, 9999); while (b === a) b = ri(1000, 9999); return [a, b]; };
    const tri = () => { const s = new Set(); while (s.size < 3) s.add(ri(1000, 9999)); return [...s]; };
    const tasks = [];
    const T = [
      () => { const [a, b] = dva(); const op = pick(['<', '>']); const ok = op === '<' ? a < b : a > b; return { text: `Je pravda, že ${a} ${op} ${b}?`, ans: ok ? 'ANO' : 'NE', h1: `Porovnej číslici tisíců: ${Math.floor(a / 1000)} a ${Math.floor(b / 1000)}.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const [a, b] = dva(); return { text: `Které číslo je větší: ${a}, nebo ${b}?`, ans: Math.max(a, b), h1: `Porovnej nejdřív tisíce, pak nižší řády.`, h2: `= ${Math.max(a, b)}` }; },
      () => { const [a, b] = dva(); return { text: `Které číslo je menší: ${a}, nebo ${b}?`, ans: Math.min(a, b), h1: `Menší je to s menšími tisíci.`, h2: `= ${Math.min(a, b)}` }; },
      () => { const [a, b, c] = tri(); return { text: `Které z čísel ${a}, ${b}, ${c} je největší?`, ans: Math.max(a, b, c), h1: `Porovnej tisíce, při shodě stovky.`, h2: `= ${Math.max(a, b, c)}` }; },
      () => { const [a, b, c] = tri(); return { text: `Které z čísel ${a}, ${b}, ${c} je nejmenší?`, ans: Math.min(a, b, c), h1: `Hledej nejmenší tisíce.`, h2: `= ${Math.min(a, b, c)}` }; },
      () => { const stejna = ri(0, 1) === 0; const a = ri(1000, 9999); const b = stejna ? a : a + ri(1, 90) * (ri(0, 1) ? 1 : -1); return { text: `Platí ${a} = ${b}?`, ans: a === b ? 'ANO' : 'NE', h1: `Porovnej všechny číslice.`, h2: a === b ? 'ANO' : 'NE' }; },
      () => { const lo = ri(1000, 7000), hi = lo + ri(300, 1500); const inside = ri(0, 1) === 0; const x = inside ? ri(lo + 1, hi - 1) : (ri(0, 1) ? ri(1000, lo - 1) : ri(hi + 1, 9999)); const ok = x > lo && x < hi; return { text: `Leží číslo ${x} mezi čísly ${lo} a ${hi}?`, ans: ok ? 'ANO' : 'NE', h1: `Musí být větší než ${lo} a menší než ${hi}.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const [a, b] = dva(); const blizsi = Math.abs(a - 5000) < Math.abs(b - 5000) ? a : b; return { text: `Které číslo je blíž k číslu 5000: ${a}, nebo ${b}?`, ans: blizsi, h1: `Porovnej vzdálenosti od 5000.`, h2: `= ${blizsi}` }; },
      () => { const b = ri(1000, 8000), a = b + ri(100, 1500); return { text: `O kolik je ${a} větší než ${b}?`, ans: a - b, h1: `Rozdíl: ${a} − ${b}.`, h2: `= ${a - b}` }; },
      () => { const [a, b] = dva(); const ok = a > b; return { text: `Kapitánova truhla má ${a} dublonů, bocmanova ${b}. Má kapitán víc?`, ans: ok ? 'ANO' : 'NE', h1: `Porovnej obě čísla.`, h2: ok ? 'ANO' : 'NE' }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'anal', mc: true });
    }
    return tasks;
  }

  // 1-3 Zaokrouhlování
  function gen_1_3() {
    const tasks = [];
    const T = [
      () => { const n = ri(100, 9950); const r = Math.round(n / 100) * 100; return { text: `Zaokrouhli ${n} na stovky.`, ans: r, h1: `Podívej se na cifru desítek: ${Math.floor((n % 100) / 10)}. 0–4 dolů, 5–9 nahoru.`, h2: `= ${r}` }; },
      () => { const n = ri(100, 9990); const r = Math.round(n / 10) * 10; return { text: `Zaokrouhli ${n} na desítky.`, ans: r, h1: `Podívej se na cifru jednotek: ${n % 10}.`, h2: `= ${r}` }; },
      () => { const n = ri(1000, 9500); const r = Math.round(n / 1000) * 1000; return { text: `Zaokrouhli ${n} na tisíce.`, ans: r, h1: `Podívej se na cifru stovek: ${Math.floor((n % 1000) / 100)}.`, h2: `= ${r}` }; },
      () => { const n = ri(1100, 9800); const r = Math.round(n / 1000) * 1000; return { text: `Který celý tisíc je nejblíž číslu ${n}?`, ans: r, h1: `Zaokrouhli ${n} na tisíce.`, h2: `= ${r}` }; },
      () => { const n = ri(1000, 9900); const spravne = Math.round(n / 100) * 100; const tvrdi = ri(0, 1) ? spravne : spravne + pick([-100, 100]); const ok = tvrdi === spravne; return { text: `Bocman tvrdí: „${n} zaokrouhleno na stovky je ${tvrdi}." Má pravdu?`, ans: ok ? 'ANO' : 'NE', h1: `Rozhoduje cifra desítek: ${Math.floor((n % 100) / 10)}.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const r = ri(2, 98) * 100; return { text: `Jaké NEJVĚTŠÍ číslo se zaokrouhlí na stovky na ${r}?`, ans: r + 49, h1: `Poslední, co ještě jde dolů, má desítky 4 a jednotky 9.`, h2: `= ${r + 49}` }; },
      () => { const r = ri(2, 98) * 100; return { text: `Jaké NEJMENŠÍ číslo se zaokrouhlí na stovky na ${r}?`, ans: r - 50, h1: `Od padesátky se zaokrouhluje nahoru.`, h2: `= ${r - 50}` }; },
      () => { const n = ri(1050, 9950); const r = Math.round(n / 100) * 100; return { text: `Loď má v podpalubí ${n} kg zásob. Kolik je to zhruba — po zaokrouhlení na stovky?`, ans: r, h1: `Zaokrouhli na stovky.`, h2: `= ${r} kg` }; },
      () => { const n = ri(1005, 9985); const dolni = Math.floor(n / 1000) * 1000; return { text: `Mezi kterými dvěma celými tisíci leží číslo ${n}? Napiš ten MENŠÍ.`, ans: dolni, h1: `Škrtni stovky, desítky a jednotky.`, h2: `= ${dolni}` }; },
      () => { const n = ri(100, 9990); const nahoru = Math.floor((n % 100) / 10) >= 5; return { text: `Zaokrouhlí se číslo ${n} na stovky NAHORU?`, ans: nahoru ? 'ANO' : 'NE', h1: `Nahoru jde 5–9 na místě desítek. Tady je ${Math.floor((n % 100) / 10)}.`, h2: nahoru ? 'ANO' : 'NE' }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 2 — SČÍTÁNÍ A ODČÍTÁNÍ DO 10 000
  // ══════════════════════════════════════════════════════════════

  // 2-1 Sčítání (přechod přes stovku/tisíc)
  function gen_2_1() {
    const pair = () => { let a = ri(1000, 8000), b = ri(100, 2000); if (a + b > 10000) a -= 1000; return [a, b]; };
    const tasks = [];
    const T = [
      () => { const [a, b] = pair(); return { text: `${a} + ${b} = ?`, ans: a + b, h1: `Sčítej po řádech: tisíce, stovky, desítky, jednotky.`, h2: `= ${a + b}` }; },
      () => { const [a, b] = pair(); return { text: `${a} + ? = ${a + b}`, ans: b, h1: `Co přičteš k ${a}, abys dostal ${a + b}? Spočítej ${a + b} − ${a}.`, h2: `= ${b}` }; },
      () => { const [a, b] = pair(); return { text: `? + ${b} = ${a + b}`, ans: a, h1: `Hledaný sčítanec: ${a + b} − ${b}.`, h2: `= ${a}` }; },
      () => { const [a, b] = pair(); return { text: `Kolik chybí číslu ${a} do ${a + b}?`, ans: b, h1: `Zjistíš to odčítáním: ${a + b} − ${a}.`, h2: `= ${b}` }; },
      () => { const a = ri(1200, 9000); return { text: `Kolik chybí číslu ${a} do 10 000?`, ans: 10000 - a, h1: `Doplň do celého tisíce, pak tisíce do deseti tisíc.`, h2: `= ${10000 - a}` }; },
      () => { const [a, b] = pair(); return { text: `Jaké číslo je o ${b} větší než ${a}?`, ans: a + b, h1: `„O větší" = přičti: ${a} + ${b}.`, h2: `= ${a + b}` }; },
      () => { const [a, b] = pair(); return { text: `Zvětši číslo ${a} o ${b}.`, ans: a + b, h1: `Zvětšit o = přičíst.`, h2: `= ${a + b}` }; },
      () => { const a = ri(1000, 4000), b = ri(1000, 3000), c = ri(500, 2500); return { text: `${a} + ${b} + ${c} = ?`, ans: a + b + c, h1: `Sečti nejdřív dvě čísla, pak přičti třetí.`, h2: `= ${a + b + c}` }; },
      () => { const [a, b] = pair(); const ok = ri(0, 1) === 0; const tvrz = ok ? a + b : a + b + pick([-100, 100, -1000, 1000]); const spravne = tvrz === a + b; return { text: `Je pravda, že ${a} + ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Přepočítej po řádech.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const b = ri(2, 9) * 100; const a = ri(1000, 9000 - b); return { text: `Lodní jeřáb přidá na palubu vždy ${b} kg. Na palubě je ${a} kg. Kolik kg tam bude po přidání?`, ans: a + b, h1: `${a} + ${b}`, h2: `= ${a + b} kg` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 2-2 Odčítání
  function gen_2_2() {
    const pair = () => { const b = ri(100, 3000); return [b + ri(100, 6000), b]; };
    const tasks = [];
    const T = [
      () => { const [a, b] = pair(); return { text: `${a} − ${b} = ?`, ans: a - b, h1: `Odečítej po řádech, pozor na přechody.`, h2: `= ${a - b}` }; },
      () => { const [a, b] = pair(); return { text: `${a} − ? = ${a - b}`, ans: b, h1: `Co odečteš od ${a}, abys dostal ${a - b}? Spočítej ${a} − ${a - b}.`, h2: `= ${b}` }; },
      () => { const b = ri(100, 3000), d = ri(500, 5000); return { text: `? − ${b} = ${d}`, ans: b + d, h1: `Hledané číslo je o ${b} větší než výsledek: ${d} + ${b}.`, h2: `= ${b + d}` }; },
      () => { const [a, b] = pair(); return { text: `O kolik je ${a} více než ${b}?`, ans: a - b, h1: `Rozdíl: ${a} − ${b}.`, h2: `= ${a - b}` }; },
      () => { const [a, b] = pair(); return { text: `O kolik je ${b} méně než ${a}?`, ans: a - b, h1: `Stejný rozdíl: ${a} − ${b}.`, h2: `= ${a - b}` }; },
      () => { const a = ri(3000, 9900), b = ri(200, 2500); return { text: `Zmenši číslo ${a} o ${b}.`, ans: a - b, h1: `Zmenšit o = odečíst.`, h2: `= ${a - b}` }; },
      () => { const a = ri(5000, 9900), b = ri(500, 2000), c = ri(500, 2000); return { text: `${a} − ${b} − ${c} = ?`, ans: a - b - c, h1: `Odečti postupně: nejdřív ${b}, pak ${c}.`, h2: `= ${a - b - c}` }; },
      () => { const [a, b] = pair(); const ok = ri(0, 1) === 0; const tvrz = ok ? a - b : a - b + pick([-100, 100, -1000, 1000]); const spravne = tvrz === a - b; return { text: `Je pravda, že ${a} − ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Zkouška sčítáním: ${tvrz} + ${b}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(1200, 9800); const cil = Math.ceil(a / 1000) * 1000 === a ? a + 1000 : Math.ceil(a / 1000) * 1000; return { text: `Kolik chybí od čísla ${a} do nejbližšího vyššího celého tisíce?`, ans: cil - a, h1: `Nejbližší vyšší tisíc je ${cil}.`, h2: `= ${cil - a}` }; },
      () => { const s = new Set(); while (s.size < 3) s.add(ri(1000, 9000)); const arr = [...s]; const max = Math.max(...arr), min = Math.min(...arr); return { text: `Z čísel ${arr[0]}, ${arr[1]}, ${arr[2]} odečti nejmenší od největšího.`, ans: max - min, h1: `Největší: ${max}, nejmenší: ${min}.`, h2: `${max} − ${min} = ${max - min}` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 2-3 Slovní úlohy sčítání/odčítání
  function gen_2_3() {
    const tasks = [];
    const T = [
      () => { const a = ri(1200, 4800), b = ri(500, 2500); return { text: `Pirátská loď naložila ${a} kg zlata a ještě ${b} kg stříbra. Kolik kilogramů nákladu veze celkem?`, ans: a + b, h1: 'Sečti obě hmotnosti.', h2: `${a} + ${b} = ${a + b} kg` }; },
      () => { const total = ri(3000, 9000), b = ri(500, total - 500); return { text: `V truhle bylo ${total} dublonů. Pirát utratil ${b} dublonů v přístavu. Kolik dublonů v truhle zbylo?`, ans: total - b, h1: 'Odečti utracené.', h2: `${total} − ${b} = ${total - b}` }; },
      () => { const a = ri(1000, 5000), b = ri(500, 3000); return { text: `Na ostrově roste ${a} kokosových palem a ${b} banánovníků. Kolik je to stromů celkem?`, ans: a + b, h1: 'Sečti oba počty.', h2: `${a} + ${b} = ${a + b}` }; },
      () => { const b = ri(1000, 4000), a = b + ri(500, 3000); return { text: `Kapitán má ${a} perel, první důstojník ${b}. O kolik perel má kapitán víc?`, ans: a - b, h1: 'Rozdíl = odečti menší od většího.', h2: `${a} − ${b} = ${a - b}` }; },
      () => { const cesta = ri(4000, 9000), upluto = ri(1500, cesta - 1000); return { text: `K ostrovu pokladů je to ${cesta} námořních mil. Loď už uplula ${upluto} mil. Kolik mil zbývá?`, ans: cesta - upluto, h1: 'Odečti uplutou vzdálenost.', h2: `${cesta} − ${upluto} = ${cesta - upluto}` }; },
      () => { const bylo = ri(2000, 6000), pribylo = ri(500, 2500), ubylo = ri(300, 1400); return { text: `Ve skladišti bylo ${bylo} sudů rumu. Připluli obchodníci a přivezli ${pribylo} sudů, pak jich ${ubylo} posádka vypila. Kolik sudů je ve skladišti teď?`, ans: bylo + pribylo - ubylo, h1: `Nejdřív přičti: ${bylo} + ${pribylo} = ${bylo + pribylo}. Pak odečti.`, h2: `${bylo + pribylo} − ${ubylo} = ${bylo + pribylo - ubylo}` }; },
      () => { const a = ri(1500, 5000), navic = ri(300, 1800); return { text: `Černovous ukořistil ${a} zlaťáků. Rudovous o ${navic} víc. Kolik zlaťáků ukořistil Rudovous?`, ans: a + navic, h1: `„O ${navic} víc" = přičti.`, h2: `${a} + ${navic} = ${a + navic}` }; },
      () => { const mapa = ri(2000, 8000), nalezeno = ri(500, mapa - 500); return { text: `Podle mapy je v jeskyni ${mapa} mincí. Posádka jich zatím vykopala ${nalezeno}. Kolik mincí ještě zbývá najít?`, ans: mapa - nalezeno, h1: 'Odečti nalezené.', h2: `${mapa} − ${nalezeno} = ${mapa - nalezeno}` }; },
      () => { const a = ri(1000, 4000), b = ri(1000, 4000), c = ri(500, 1900); return { text: `Tři truhly ukrývají ${a}, ${b} a ${c} zlaťáků. Kolik zlaťáků je ve všech třech dohromady?`, ans: a + b + c, h1: 'Sečti všechny tři truhly.', h2: `${a} + ${b} + ${c} = ${a + b + c}` }; },
      () => { const delka = ri(3000, 9000), kus = ri(500, 2000); return { text: `Kotevní lano měřilo ${delka} cm. Při bouři se ${kus} cm utrhlo. Jak dlouhé lano zůstalo?`, ans: delka - kus, h1: 'Odečti utržený kus.', h2: `${delka} − ${kus} = ${delka - kus} cm` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
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
    const T = [
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `${a} × ${b} = ?`, ans: a * b, h1: `${a} × ${b}: přičítej ${b} celkem ${a}krát.`, h2: `= ${a * b}` }; },
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `${a} × ? = ${a * b}`, ans: b, h1: `Jaké číslo dá s ${a} dohromady ${a * b}? Zkus ${a * b} : ${a}.`, h2: `= ${b}` }; },
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `? × ${b} = ${a * b}`, ans: a, h1: `Kolikrát vzít ${b}, aby vyšlo ${a * b}?`, h2: `= ${a}` }; },
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `Kolik je ${a}krát ${b}?`, ans: a * b, h1: `${a}krát ${b} = ${a} × ${b}.`, h2: `= ${a * b}` }; },
      () => { const a = ri(2, 10), b = ri(2, 10); const ok = ri(0, 1) === 0; const tvrz = ok ? a * b : a * b + pick([-a, a, -b, b]); const spravne = tvrz === a * b; return { text: `Platí ${a} × ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Projdi řadu násobků.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(2, 9), k = ri(2, 8); return { text: `V řadě násobků čísla ${a} následuje po čísle ${a * k} které číslo?`, ans: a * (k + 1), h1: `Přičti ${a}.`, h2: `= ${a * (k + 1)}` }; },
      () => { const n = ri(2, 9); return { text: `Kolik děl má ${n} ${skl(n, 'loď', 'lodě', 'lodí')}, když každá nese 6 děl?`, ans: n * 6, h1: `${n} × 6`, h2: `= ${n * 6}` }; },
      () => { const a = ri(6, 45); return { text: `Jaký je dvojnásobek čísla ${a}?`, ans: a * 2, h1: `2 × ${a}`, h2: `= ${a * 2}` }; },
      () => { const a = ri(4, 30); return { text: `Jaký je trojnásobek čísla ${a}?`, ans: a * 3, h1: `3 × ${a}`, h2: `= ${a * 3}` }; },
      () => { const a = ri(2, 5), b = ri(2, 5), c = ri(2, 4); return { text: `${a} × ${b} × ${c} = ?`, ans: a * b * c, h1: `Nejdřív ${a} × ${b} = ${a * b}, pak × ${c}.`, h2: `= ${a * b * c}` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true });
    }
    return tasks;
  }

  // 3-2 Násobení desítkami a stovkami
  function gen_3_2() {
    const tasks = [];
    const T = [
      () => { const a = ri(2, 9), b = ri(2, 9) * 10; return { text: `${a} × ${b} = ?`, ans: a * b, h1: `${a} × ${b / 10} = ${a * (b / 10)}, přidej nulu.`, h2: `= ${a * b}` }; },
      () => { const a = ri(2, 9), b = ri(2, 9) * 100; return { text: `${a} × ${b} = ?`, ans: a * b, h1: `${a} × ${b / 100} = ${a * (b / 100)}, přidej dvě nuly.`, h2: `= ${a * b}` }; },
      () => { const a = ri(2, 9); return { text: `${a} × 1000 = ?`, ans: a * 1000, h1: `Násobíš tisícem → přidej tři nuly.`, h2: `= ${a * 1000}` }; },
      () => { const a = ri(3, 99); return { text: `Jaký je desetinásobek čísla ${a}?`, ans: a * 10, h1: `${a} × 10`, h2: `= ${a * 10}` }; },
      () => { const a = ri(3, 60); return { text: `Jaký je stonásobek čísla ${a}?`, ans: a * 100, h1: `${a} × 100`, h2: `= ${a * 100}` }; },
      () => { const a = ri(2, 9); return { text: `Kolik je ${a} ${skl(a, 'stovka', 'stovky', 'stovek')}?`, ans: a * 100, h1: `${a} × 100`, h2: `= ${a * 100}` }; },
      () => { const a = ri(2, 9), b = ri(2, 9); return { text: `Doplň: ${a} × ? = ${a * b * 10}`, ans: b * 10, h1: `${a} × ${b} = ${a * b}, takže potřebuješ desetinásobek: ${b}0.`, h2: `= ${b * 10}` }; },
      () => { const n = ri(2, 8); return { text: `Každý pirátský soudek ukrývá 100 mincí. Kolik mincí je v ${n} ${skl(n, 'soudku', 'soudcích', 'soudcích')}?`, ans: n * 100, h1: `${n} × 100`, h2: `= ${n * 100}` }; },
      () => { const a = ri(2, 9), b = ri(2, 9) * 10; const ok = ri(0, 1) === 0; const tvrz = ok ? a * b : a * b * 10; const spravne = tvrz === a * b; return { text: `Platí ${a} × ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Spočítej ${a} × ${b / 10} a přidej jednu nulu.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(20, 90) * 10; return { text: `Kouzelný kompas všechno zdesetinásobí. Co ukáže, když do něj vložíš číslo ${a / 10}?`, ans: a, h1: `${a / 10} × 10`, h2: `= ${a}` }; },
      () => { const b = ri(2, 9), n = ri(2, 9); return { text: `Děla vypálila ${n} salv po ${b * 10} koulích. Kolik koulí vyletělo celkem?`, ans: n * b * 10, h1: `${n} × ${b * 10}: spočítej ${n} × ${b} a přidej nulu.`, h2: `= ${n * b * 10}` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 3-3 Násobení s přechodem (dvojciferné × jednociferné)
  function gen_3_3() {
    const tasks = [];
    const T = [
      () => { const a = ri(11, 99), b = ri(2, 9); return { text: `${a} × ${b} = ?`, ans: a * b, h1: `Rozlož: ${Math.floor(a / 10) * 10} × ${b} + ${a % 10} × ${b}.`, h2: `= ${a * b}` }; },
      () => { const a = ri(11, 99), b = ri(2, 9); return { text: `Kolik je ${b}krát ${a}?`, ans: a * b, h1: `${b}krát ${a} = ${a} × ${b}. Rozlož ${a} na desítky a jednotky.`, h2: `= ${a * b}` }; },
      () => { const a = ri(11, 99), b = ri(2, 9); return { text: `${a} × ? = ${a * b}`, ans: b, h1: `Kolikrát vzít ${a}, aby vyšlo ${a * b}? Zkus ${a * b} : ${a}.`, h2: `= ${b}` }; },
      () => { const a = ri(12, 60); return { text: `Jaký je čtyřnásobek čísla ${a}?`, ans: a * 4, h1: `4 × ${a}: rozlož na desítky a jednotky.`, h2: `= ${a * 4}` }; },
      () => { const a = ri(11, 99), b = ri(2, 9); const ok = ri(0, 1) === 0; const tvrz = ok ? a * b : a * b + pick([-10, 10, -b, b]); const spravne = tvrz === a * b; return { text: `Je pravda, že ${a} × ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Přepočítej rozkladem.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const n = ri(11, 40), b = ri(3, 8); return { text: `Na palubě je ${n} beden po ${b} kg. Kolik kg beden loď veze?`, ans: n * b, h1: `${n} × ${b}`, h2: `= ${n * b} kg` }; },
      () => { const n = ri(12, 50), c = ri(3, 9); return { text: `Jedna vlajka stojí ${n} zlatých. Kolik stojí ${c} ${skl(c, 'vlajka', 'vlajky', 'vlajek')}?`, ans: n * c, h1: `${n} × ${c}`, h2: `= ${n * c} zlatých` }; },
      () => { const posadka = ri(12, 45), lodi = ri(3, 8); return { text: `Ve flotile je ${lodi} ${skl(lodi, 'loď', 'lodě', 'lodí')} a na každé slouží ${posadka} námořníků. Kolik námořníků má flotila?`, ans: posadka * lodi, h1: `${lodi} × ${posadka}`, h2: `= ${posadka * lodi}` }; },
      () => { const a = ri(11, 30), b = ri(2, 5), c = ri(2, 4); return { text: `${a} × ${b} × ${c} = ?`, ans: a * b * c, h1: `Postupně: ${a} × ${b} = ${a * b}, pak × ${c}.`, h2: `= ${a * b * c}` }; },
      () => { const tydny = ri(11, 30); return { text: `Plavba trvá ${tydny} týdnů. Kolik je to dní?`, ans: tydny * 7, h1: `${tydny} × 7`, h2: `= ${tydny * 7} dní` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 4 — DĚLENÍ
  // ══════════════════════════════════════════════════════════════

  // 4-1 Dělení bez zbytku (z násobilky), MC
  function gen_4_1() {
    const tasks = [];
    const T = [
      () => { const b = ri(2, 10), q = ri(2, 10); return { text: `${b * q} : ${b} = ?`, ans: q, h1: `Jaké číslo × ${b} = ${b * q}?`, h2: `= ${q}` }; },
      () => { const b = ri(2, 10), q = ri(2, 10); return { text: `Kolikrát se ${b} vejde do ${b * q}?`, ans: q, h1: `To je ${b * q} : ${b}.`, h2: `= ${q}` }; },
      () => { const b = ri(2, 10), q = ri(2, 10); return { text: `? : ${b} = ${q}`, ans: b * q, h1: `Hledané číslo: ${b} × ${q}.`, h2: `= ${b * q}` }; },
      () => { const b = ri(2, 9), q = ri(2, 9); return { text: `${b * q} : ? = ${q}`, ans: b, h1: `Čím dělit ${b * q}, aby vyšlo ${q}? Zkus ${b * q} : ${q}.`, h2: `= ${b}` }; },
      () => { const q = ri(6, 50); return { text: `Jaká je polovina čísla ${q * 2}?`, ans: q, h1: `${q * 2} : 2`, h2: `= ${q}` }; },
      () => { const q = ri(4, 30); return { text: `Jaká je čtvrtina čísla ${q * 4}?`, ans: q, h1: `${q * 4} : 4`, h2: `= ${q}` }; },
      () => { const b = ri(2, 9), q = ri(2, 9); const ok = ri(0, 1) === 0; const tvrz = ok ? q : q + pick([-1, 1, 2]); const spravne = tvrz === q; return { text: `Platí ${b * q} : ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Zkouška: ${b} × ${tvrz} = ${b * tvrz}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const k = ri(2, 9), a = ri(2, 9); return { text: `Kolikrát je číslo ${a} menší než ${a * k}?`, ans: k, h1: `${a * k} : ${a}`, h2: `= ${k}` }; },
      () => { const d = ri(2, 8), q = ri(3, 10); return { text: `${d * q} papoušků se rozletělo rovným dílem na ${d} ${skl(d, 'stěžeň', 'stěžně', 'stěžňů')}. Kolik jich sedí na jednom?`, ans: q, h1: `${d * q} : ${d}`, h2: `= ${q}` }; },
      () => { const q = ri(30, 90) * 10; return { text: `${q} : 10 = ?`, ans: q / 10, h1: `Dělíš deseti → uber nulu.`, h2: `= ${q / 10}` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true });
    }
    return tasks;
  }

  // 4-2 Dělení se zbytkem
  function gen_4_2() {
    const nz = () => { const d = ri(3, 9), q = ri(2, 9), r = ri(1, d - 1); return { d, q, r, n: d * q + r }; };
    const tasks = [];
    const T = [
      () => { const { d, q, r, n } = nz(); return { text: `Rozděl ${n} do skupin po ${d}. Kolik zbyde?`, ans: r, h1: `${d} × ${q} = ${d * q}. Zbyde ${n} − ${d * q}.`, h2: `zbyde ${r}` }; },
      () => { const { d, q, n } = nz(); return { text: `Rozděl ${n} do skupin po ${d}. Kolik celých skupin vznikne?`, ans: q, h1: `${d} × ${q} = ${d * q} se vejde, ${d} × ${q + 1} už ne.`, h2: `= ${q}` }; },
      () => { const { d, q, r, n } = nz(); return { text: `Jaký zbytek má dělení ${n} : ${d}?`, ans: r, h1: `${d} × ${q} = ${d * q}, zbytek ${n} − ${d * q}.`, h2: `zbytek ${r}` }; },
      () => { const q = ri(2, 8), r = ri(1, 6), n = q * 7 + r; return { text: `Plavba trvá ${n} dní. Kolik je to CELÝCH týdnů?`, ans: q, h1: `Kolikrát se 7 vejde do ${n}?`, h2: `= ${q}` }; },
      () => { const q = ri(2, 8), r = ri(1, 6), n = q * 7 + r; return { text: `${n} dní je ${q} ${skl(q, 'týden', 'týdny', 'týdnů')} a kolik dní navíc?`, ans: r, h1: `${q} × 7 = ${q * 7}, zbývá ${n} − ${q * 7}.`, h2: `= ${r}` }; },
      () => { const { d, q, n } = nz(); return { text: `Do záchranného člunu se vejde ${d} pirátů. Kolik člunů ÚPLNĚ zaplní ${n} pirátů?`, ans: q, h1: `${d} × ${q} = ${d * q} se vejde, víc ne.`, h2: `= ${q}` }; },
      () => { const d = ri(3, 9), n = ri(20, 80); const deli = n % d === 0; return { text: `Dá se ${n} rozdělit číslem ${d} beze zbytku?`, ans: deli ? 'ANO' : 'NE', h1: `Je ${n} v řadě násobků čísla ${d}?`, h2: deli ? 'ANO' : 'NE' }; },
      () => { const { d, q, n } = nz(); return { text: `Jaký je největší násobek čísla ${d} menší než ${n}?`, ans: d * q, h1: `Projdi násobky ${d} a najdi poslední pod ${n}.`, h2: `= ${d * q}` }; },
      () => { const { d, r, n } = nz(); return { text: `Kuchař skládá ${n} sucharů do beden po ${d}. Kolik sucharů mu CHYBÍ do další plné bedny?`, ans: d - r, h1: `Zbyde ${r}, do plné bedny chybí ${d} − ${r}.`, h2: `= ${d - r}` }; },
      () => { const { d, q, r, n } = nz(); return { text: `Doplň: ${n} = ${d} × ? + ${r}`, ans: q, h1: `Kolikrát se ${d} vejde do ${n - r}?`, h2: `= ${q}` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 4-3 Slovní úlohy dělení
  function gen_4_3() {
    const tasks = [];
    const T = [
      () => { const d = ri(3, 8), total = d * ri(4, 12); return { text: `${total} zlatých mincí rozdělíme rovným dílem mezi ${d} ${skl(d, 'piráta', 'piráty', 'pirátů')}. Kolik mincí dostane každý?`, ans: total / d, h1: `${total} : ${d}`, h2: `= ${total / d}` }; },
      () => { const d = ri(3, 9), n = d * ri(3, 10); return { text: `Kuchař rozdělil ${n} sušenek do ${d} pytlíků stejně. Kolik sušenek je v každém pytlíku?`, ans: n / d, h1: `${n} : ${d}`, h2: `= ${n / d}` }; },
      () => { const rows = ri(3, 8), cols = ri(3, 8); return { text: `${rows * cols} truhel je v podpalubí uloženo ${rows < 5 ? 've' : 'v'} ${rows} ${skl(rows, 'řadě', 'řadách', 'řadách')} stejně. Kolik truhel je v každé řadě?`, ans: cols, h1: `${rows * cols} : ${rows}`, h2: `= ${cols}` }; },
      () => { const d = ri(2, 6), q = ri(4, 12); return { text: `Lano dlouhé ${d * q} m rozřežeme na kusy po ${d} m. Kolik kusů dostaneme?`, ans: q, h1: `${d * q} : ${d}`, h2: `= ${q}` }; },
      () => { const cena = ri(4, 9), penize = cena * ri(4, 12); return { text: `Jedna zlatá rybka stojí ${cena} dublonů. Kolik rybek koupíš za ${penize} dublonů?`, ans: penize / cena, h1: `${penize} : ${cena}`, h2: `= ${penize / cena}` }; },
      () => { const d = ri(3, 8), q = ri(3, 10); return { text: `${d * q} děl je rozmístěno rovným dílem na ${d} ${skl(d, 'palubu', 'paluby', 'palub')}. Kolik děl je na jedné palubě?`, ans: q, h1: `${d * q} : ${d}`, h2: `= ${q}` }; },
      () => { const d = ri(3, 6), q = ri(3, 9), r = ri(1, d - 1), n = d * q + r; return { text: `Papoušek rozdává ${n} oříšků do misek po ${d}. Kolik oříšků mu zbyde?`, ans: r, h1: `${d} × ${q} = ${d * q}, zbyde ${n} − ${d * q}.`, h2: `zbyde ${r}` }; },
      () => { const d = ri(3, 6), q = ri(3, 9), r = ri(1, d - 1), n = d * q + r; return { text: `Do jedné sítě se vejde ${d} ryb. Kolik sítí úplně naplníš s ${n} rybami?`, ans: q, h1: `${d} × ${q} = ${d * q} se vejde.`, h2: `= ${q}` }; },
      () => { const d = ri(2, 5), q = ri(4, 12); return { text: `Hlídka trvá ${d} ${skl(d, 'hodinu', 'hodiny', 'hodin')}. Kolik hlídek se vystřídá za ${d * q} hodin?`, ans: q, h1: `${d * q} : ${d}`, h2: `= ${q}` }; },
      () => { const d = ri(4, 9), total = d * ri(10, 25); return { text: `${total} kg zásob se rozdělí rovným dílem do ${d} beden. Kolik kg bude v jedné bedně?`, ans: total / d, h1: `${total} : ${d}`, h2: `= ${total / d} kg` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 5 — GEOMETRIE — ROVINNÉ TVARY
  // ══════════════════════════════════════════════════════════════

  // 5-1 Obvod obdélníku a čtverce
  function gen_5_1() {
    const obd = () => { const a = ri(3, 15); let b = ri(3, 14); if (b === a) b++; return [a, b]; };
    const tasks = [];
    const T = [
      () => { const [a, b] = obd(); return { text: `Obdélník má strany ${a} cm a ${b} cm. Jaký je jeho obvod?`, ans: 2 * (a + b), h1: `O = 2 × (a + b) = 2 × (${a} + ${b}).`, h2: `= ${2 * (a + b)} cm` }; },
      () => { const a = ri(3, 18); return { text: `Čtverec má stranu ${a} cm. Jaký je jeho obvod?`, ans: 4 * a, h1: `O = 4 × a = 4 × ${a}.`, h2: `= ${4 * a} cm` }; },
      () => { const o = ri(4, 18) * 4; return { text: `Čtverec má obvod ${o} cm. Jak dlouhá je jeho strana?`, ans: o / 4, h1: `Strana = obvod : 4 = ${o} : 4.`, h2: `= ${o / 4} cm` }; },
      () => { const [a, b] = obd(); const o = 2 * (a + b); return { text: `Obdélník má obvod ${o} cm a jednu stranu ${a} cm. Jak dlouhá je druhá strana?`, ans: b, h1: `Polovina obvodu je ${o / 2} — to je a + b. Druhá strana: ${o / 2} − ${a}.`, h2: `= ${b} cm` }; },
      () => { const [a, b] = obd(); return { text: `Ostrovní ohrada pro kozy má tvar obdélníku ${a} m × ${b} m. Kolik metrů plotu piráti potřebují?`, ans: 2 * (a + b), h1: `Plot = obvod = 2 × (${a} + ${b}).`, h2: `= ${2 * (a + b)} m` }; },
      () => { const a = ri(3, 12); return { text: `Čtvercová plachta má stranu ${a} m. Kolik metrů lemovky je potřeba na její okraj kolem dokola?`, ans: 4 * a, h1: `Okraj = obvod čtverce.`, h2: `= ${4 * a} m` }; },
      () => { const a = ri(4, 15); const o = 4 * a; const ok = ri(0, 1) === 0; const tvrz = ok ? o : o + pick([-4, 4, -a, a]); const spravne = tvrz === o; return { text: `Je pravda, že čtverec se stranou ${a} cm má obvod ${tvrz} cm?`, ans: spravne ? 'ANO' : 'NE', h1: `O = 4 × ${a}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(4, 12), [c, d] = obd(); const oC = 4 * a, oO = 2 * (c + d); return { text: `Čtverec má stranu ${a} cm, obdélník strany ${c} cm a ${d} cm. O kolik cm se liší jejich obvody?`, ans: Math.abs(oC - oO), h1: `Obvody: ${oC} cm a ${oO} cm.`, h2: `= ${Math.abs(oC - oO)} cm` }; },
      () => { const a = ri(2, 8); return { text: `Jedna strana obdélníku měří ${a} cm, druhá je dvakrát delší. Jaký je obvod?`, ans: 2 * (a + 2 * a), h1: `Druhá strana: ${2 * a} cm. O = 2 × (${a} + ${2 * a}).`, h2: `= ${2 * (a + 2 * a)} cm` }; },
      () => { const [a, b] = obd(); return { text: `Krab obejde obdélníkovou palubu ${a} m × ${b} m přesně jednou dokola. Kolik metrů ujde?`, ans: 2 * (a + b), h1: `Cesta dokola = obvod.`, h2: `= ${2 * (a + b)} m` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'geo' });
    }
    return tasks;
  }

  // 5-2 Obsah obdélníku a čtverce
  function gen_5_2() {
    const obd = () => { const a = ri(3, 15); let b = ri(3, 14); if (b === a) b++; return [a, b]; };
    const tasks = [];
    const T = [
      () => { const [a, b] = obd(); return { text: `Obdélník má strany ${a} cm a ${b} cm. Jaký je jeho obsah?`, ans: a * b, h1: `S = a × b = ${a} × ${b}.`, h2: `= ${a * b} cm²` }; },
      () => { const a = ri(3, 12); return { text: `Čtverec má stranu ${a} cm. Jaký je jeho obsah?`, ans: a * a, h1: `S = a × a = ${a} × ${a}.`, h2: `= ${a * a} cm²` }; },
      () => { const a = ri(3, 12), S = a * ri(3, 12); return { text: `Obdélník má obsah ${S} cm² a jednu stranu ${a} cm. Jak dlouhá je druhá strana?`, ans: S / a, h1: `Druhá strana = obsah : strana = ${S} : ${a}.`, h2: `= ${S / a} cm` }; },
      () => { const [a, b] = obd(); return { text: `Kolik čtverečků o straně 1 cm pokryje obdélník ${a} cm × ${b} cm?`, ans: a * b, h1: `Počet čtverečků = obsah = ${a} × ${b}.`, h2: `= ${a * b}` }; },
      () => { const [a, b] = obd(); return { text: `Pirátská mapa má tvar obdélníku ${a} dm × ${b} dm. Jaký je její obsah?`, ans: a * b, h1: `S = ${a} × ${b}.`, h2: `= ${a * b} dm²` }; },
      () => { const a = ri(3, 10); return { text: `Čtvercové okno kajuty má stranu ${a} dm. Kolik dm² skla je potřeba?`, ans: a * a, h1: `Sklo = obsah čtverce.`, h2: `= ${a * a} dm²` }; },
      () => { const a = ri(3, 10); const S = a * a; const ok = ri(0, 1) === 0; const tvrz = ok ? S : 4 * a; const spravne = tvrz === S; return { text: `Je pravda, že čtverec se stranou ${a} cm má OBSAH ${tvrz} cm²?`, ans: spravne ? 'ANO' : 'NE', h1: `Pozor, obsah není obvod: S = ${a} × ${a}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const [a, b] = obd(); const [c, d] = obd(); const S1 = a * b, S2 = c * d; return { text: `První palubní deska měří ${a} × ${b} cm, druhá ${c} × ${d} cm. O kolik cm² je větší ta s větším obsahem?`, ans: Math.abs(S1 - S2), h1: `Obsahy: ${S1} cm² a ${S2} cm².`, h2: `= ${Math.abs(S1 - S2)} cm²` }; },
      () => { const a = ri(2, 7); return { text: `Strana čtverce měří ${a} cm. Jaký obsah má obdélník se stranami ${a} cm a ${2 * a} cm — dvakrát delší druhou stranou?`, ans: a * 2 * a, h1: `S = ${a} × ${2 * a}.`, h2: `= ${a * 2 * a} cm²` }; },
      () => { const [a, b] = obd(); return { text: `Záhon na ostrově má tvar obdélníku ${a} m × ${b} m. Kolik m² plochy piráti osázeli?`, ans: a * b, h1: `Plocha = obsah = ${a} × ${b}.`, h2: `= ${a * b} m²` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'geo' });
    }
    return tasks;
  }

  // 5-3 Čtvercová síť, osy souměrnosti, tělesa kolem nás
  function gen_5_3() {
    const OSY = [['čtverec', 4], ['obdélník (ne čtverec)', 2], ['rovnostranný trojúhelník', 3]];
    const tasks = [];
    const T = [
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `Kolik čtverečků pokryje obdélník ${a} × ${b} ve čtvercové síti?`, ans: a * b, h1: `${a} řad po ${b} čtverečcích.`, h2: `= ${a * b}` }; },
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `Zahrada tvaru obdélníku má strany ${a} m a ${b} m. Kolik metrů plotu je potřeba na ohrazení?`, ans: 2 * (a + b), h1: `Plot = obvod = 2 × (${a} + ${b}).`, h2: `= ${2 * (a + b)} m` }; },
      () => { const [nm, n] = OSY[ri(0, 2)]; return { text: `Kolik os souměrnosti má ${nm}?`, ans: n, h1: `Osa souměrnosti přeloží obrazec přesně na sebe.`, h2: `= ${n}` }; },
      () => { const a = ri(2, 6); return { text: `Ve čtvercové síti je čtverec ${a} × ${a}. Kolik čtverečků zabírá?`, ans: a * a, h1: `${a} × ${a}`, h2: `= ${a * a}` }; },
      () => { const a = ri(3, 8), b = ri(2, a - 1); return { text: `Obrazec ve čtvercové síti se skládá z obdélníku ${a} × ${b} a jednoho čtverečku navíc. Kolik čtverečků má celkem?`, ans: a * b + 1, h1: `${a} × ${b} = ${a * b}, přičti 1.`, h2: `= ${a * b + 1}` }; },
      () => { const ok = ri(0, 1) === 0; return ok ? { text: `Má kruh nekonečně mnoho os souměrnosti?`, ans: 'ANO', h1: `Každá přímka středem je osou.`, h2: 'ANO' } : { text: `Má obdélník (který není čtverec) 4 osy souměrnosti?`, ans: 'NE', h1: `Úhlopříčky obdélníku osami nejsou — má jen 2.`, h2: 'NE' }; },
      () => { const a = ri(1, 4) * 2, b = ri(2, 9); return { text: `Lodní vlajka je v síti široká ${a} ${skl(a, 'čtvereček', 'čtverečky', 'čtverečků')} a vysoká ${b}. Polovinu vlajky zabírá lebka. Kolik čtverečků zabírá lebka?`, ans: a * b / 2, h1: `Celkem ${a * b} čtverečků, polovina je ${a * b} : 2.`, h2: `= ${a * b / 2}` }; },
      () => { const n = pick([['krychle', 6], ['kvádr', 6]]); return { text: `Kolik stěn má ${n[0]}?`, ans: n[1], h1: `Spočítej: nahoře, dole a čtyři kolem.`, h2: `= ${n[1]}` }; },
      () => { return { text: `Kolik vrcholů má krychle?`, ans: 8, h1: `Čtyři nahoře a čtyři dole.`, h2: `= 8` }; },
      () => { const a = ri(3, 9); return { text: `Písmeno T poskládané z ${a} čtverečků vodorovně a ${a} svisle (prostřední se počítá jen jednou). Kolik čtverečků je potřeba?`, ans: 2 * a - 1, h1: `${a} + ${a} − 1 (prostřední jen jednou).`, h2: `= ${2 * a - 1}` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'geo' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 6 — MÍRY A JEDNOTKY
  // ══════════════════════════════════════════════════════════════

  // 6-1 Délka (km, m, dm, cm, mm)
  function gen_6_1() {
    const tasks = [];
    const T = [
      () => { const n = ri(1, 9); return { text: `Kolik cm je ${n} dm? (1 dm = 10 cm)`, ans: n * 10, h1: '1 dm = 10 cm — násob deseti.', h2: `= ${n * 10} cm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik mm je ${n} cm? (1 cm = 10 mm)`, ans: n * 10, h1: '1 cm = 10 mm.', h2: `= ${n * 10} mm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik m je ${n} km? (1 km = 1000 m)`, ans: n * 1000, h1: '1 km = 1000 m.', h2: `= ${n * 1000} m` }; },
      () => { const n = ri(1, 9) * 10; return { text: `Kolik dm je ${n} cm?`, ans: n / 10, h1: 'Děl deseti (10 cm = 1 dm).', h2: `= ${n / 10} dm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik dm je ${n} m? (1 m = 10 dm)`, ans: n * 10, h1: '1 m = 10 dm.', h2: `= ${n * 10} dm` }; },
      () => { const n = ri(2, 9) * 1000; return { text: `Kolik km je ${n} m?`, ans: n / 1000, h1: 'Děl tisícem (1000 m = 1 km).', h2: `= ${n / 1000} km` }; },
      () => { const n = ri(1, 9); return { text: `Kolik cm je ${n} m? (1 m = 100 cm)`, ans: n * 100, h1: '1 m = 100 cm.', h2: `= ${n * 100} cm` }; },
      () => { const km = ri(1, 5), m = ri(100, 900); return { text: `K majáku to je ${km} km a ${m} m. Kolik je to celkem metrů?`, ans: km * 1000 + m, h1: `${km} km = ${km * 1000} m, přičti ${m} m.`, h2: `= ${km * 1000 + m} m` }; },
      () => { const m = ri(2, 9), cm = ri(10, 90); return { text: `Kotevní řetěz měří ${m} m ${cm} cm. Kolik je to centimetrů?`, ans: m * 100 + cm, h1: `${m} m = ${m * 100} cm.`, h2: `= ${m * 100 + cm} cm` }; },
      () => { const a = ri(2, 9); const ok = ri(0, 1) === 0; const tvrz = ok ? a * 1000 : a * 100; const spravne = tvrz === a * 1000; return { text: `Platí ${a} km = ${tvrz} m?`, ans: spravne ? 'ANO' : 'NE', h1: `1 km = 1000 m.`, h2: spravne ? 'ANO' : 'NE' }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 6-2 Hmotnost a čas
  function gen_6_2() {
    const tasks = [];
    const T = [
      () => { const n = ri(1, 9); return { text: `Kolik g je ${n} kg? (1 kg = 1000 g)`, ans: n * 1000, h1: '1 kg = 1000 g.', h2: `= ${n * 1000} g` }; },
      () => { const n = ri(1, 8); return { text: `Kolik minut je ${n} ${skl(n, 'hodina', 'hodiny', 'hodin')}? (1 h = 60 min)`, ans: n * 60, h1: '1 h = 60 min.', h2: `= ${n * 60} min` }; },
      () => { const n = ri(1, 8); return { text: `Kolik sekund je ${n} ${skl(n, 'minuta', 'minuty', 'minut')}? (1 min = 60 s)`, ans: n * 60, h1: '1 min = 60 s.', h2: `= ${n * 60} s` }; },
      () => { const n = ri(2, 9) * 1000; return { text: `Kolik kg je ${n} g?`, ans: n / 1000, h1: 'Děl tisícem.', h2: `= ${n / 1000} kg` }; },
      () => { const h = ri(1, 5), m = ri(5, 55); return { text: `${h} h ${m} min = kolik minut celkem?`, ans: h * 60 + m, h1: `${h} h = ${h * 60} min, přičti ${m}.`, h2: `= ${h * 60 + m} min` }; },
      () => { const n = ri(1, 5); return { text: `Kolik kg je ${n} ${skl(n, 'tuna', 'tuny', 'tun')}? (1 t = 1000 kg)`, ans: n * 1000, h1: '1 t = 1000 kg.', h2: `= ${n * 1000} kg` }; },
      () => { const druh = pick([['půl hodiny', 30], ['čtvrt hodiny', 15], ['tři čtvrtě hodiny', 45]]); return { text: `Kolik minut je ${druh[0]}?`, ans: druh[1], h1: `Hodina má 60 minut.`, h2: `= ${druh[1]} min` }; },
      () => { const min = ri(70, 250); return { text: `Hlídka trvala ${min} minut. Kolik je to CELÝCH hodin?`, ans: Math.floor(min / 60), h1: `Kolikrát se 60 vejde do ${min}?`, h2: `= ${Math.floor(min / 60)}` }; },
      () => { const n = ri(2, 9); return { text: `Kolik hodin je ${n} ${skl(n, 'den', 'dny', 'dní')} plavby? (1 den = 24 h)`, ans: n * 24, h1: '1 den = 24 h.', h2: `= ${n * 24} h` }; },
      () => { const g = ri(1100, 2900); const ok = g > 2000; return { text: `Papoušek Ferda váží ${g} g. Váží víc než 2 kg?`, ans: ok ? 'ANO' : 'NE', h1: `2 kg = 2000 g — porovnej.`, h2: ok ? 'ANO' : 'NE' }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 6-3 Peníze a slovní úlohy s mírami
  function gen_6_3() {
    const tasks = [];
    const T = [
      () => { const price = ri(15, 99), count = ri(2, 8); return { text: `Mapa pirátského ostrova stojí ${price} Kč. Kolik zaplatíš za ${count} ${skl(count, 'mapu', 'mapy', 'map')}?`, ans: price * count, h1: `${price} × ${count}`, h2: `= ${price * count} Kč` }; },
      () => { const total = ri(150, 800), price = ri(30, 120); return { text: `Pirát měl ${total} Kč a koupil lano za ${price} Kč. Kolik korun mu zbylo?`, ans: total - price, h1: `${total} − ${price}`, h2: `= ${total - price} Kč` }; },
      () => { const h = ri(2, 6), m = ri(10, 50); return { text: `Loď plula ${h} h ${m} min. Kolik minut plula celkem?`, ans: h * 60 + m, h1: `${h} h = ${h * 60} min.`, h2: `= ${h * 60 + m} min` }; },
      () => { const cena = ri(120, 480); return { text: `Kompas stojí ${cena} Kč a platíš pětistovkou. Kolik ti prodavač vrátí?`, ans: 500 - cena, h1: `500 − ${cena}`, h2: `= ${500 - cena} Kč` }; },
      () => { const a = ri(40, 200), b = ri(40, 200); return { text: `Dalekohled stojí ${a} Kč a lodní zvon ${b} Kč. Kolik zaplatíš za obojí?`, ans: a + b, h1: `${a} + ${b}`, h2: `= ${a + b} Kč` }; },
      () => { const cena = ri(300, 900), ma = cena - ri(50, 250); return { text: `Nová plachta stojí ${cena} Kč. Posádka má ${ma} Kč. Kolik korun jí chybí?`, ans: cena - ma, h1: `${cena} − ${ma}`, h2: `= ${cena - ma} Kč` }; },
      () => { const cena = ri(4, 12) * 10; return { text: `Sud rumu za ${cena} zlatých je dnes za polovinu. Kolik stojí dnes?`, ans: cena / 2, h1: `${cena} : 2`, h2: `= ${cena / 2} zlatých` }; },
      () => { const kusy = ri(2, 6), cena = ri(20, 80); const utrata = kusy * cena; return { text: `Koupíš ${kusy} ${skl(kusy, 'svitek', 'svitky', 'svitků')} po ${cena} Kč a platíš pětistovkou. Kolik dostaneš zpět?`, ans: 500 - utrata, h1: `Útrata: ${kusy} × ${cena} = ${utrata} Kč.`, h2: `= ${500 - utrata} Kč` }; },
      () => { const ma = ri(100, 600), cena = ri(80, 650); const ok = ma >= cena; return { text: `Máš ${ma} Kč. Stačí ti to na papouška za ${cena} Kč?`, ans: ok ? 'ANO' : 'NE', h1: `Porovnej.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const tydny = ri(3, 8), castka = ri(20, 90); return { text: `Plavčík si každý týden ušetří ${castka} Kč ze žoldu. Kolik našetří za ${tydny} ${skl(tydny, 'týden', 'týdny', 'týdnů')}?`, ans: tydny * castka, h1: `${tydny} × ${castka}`, h2: `= ${tydny * castka} Kč` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
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
    const T = [
      () => { const tis = ri(10, 999); return { text: `Jak zapíšeme číslem: ${tis} tisíc?`, ans: tis * 1000, h1: `Za počet tisíců připiš tři nuly.`, h2: `= ${tis * 1000}` }; },
      () => { const tis = ri(10, 999); return { text: `Kolik tisíců má číslo ${tis * 1000}?`, ans: tis, h1: `Odděl poslední tři nuly.`, h2: `= ${tis}` }; },
      () => { const m = ri(2, 9); return { text: `Kolik je ${m} × 1000?`, ans: m * 1000, h1: `Přidej tři nuly.`, h2: `= ${m * 1000}` }; },
      () => { const n = ri(10000, 999999); return { text: `Jaké číslo je o 1 větší než ${n}?`, ans: n + 1, h1: `Přičti jedničku.`, h2: `= ${n + 1}` }; },
      () => { const st = ri(1, 9), tis = ri(10, 99); const n = st * 100000 + tis * 1000; return { text: `Kolik statisíců má číslo ${n}?`, ans: st, h1: `Statisíce jsou šestá cifra zprava.`, h2: `= ${st}` }; },
      () => { let a = ri(10000, 999999), b = ri(10000, 999999); while (a === b) b = ri(10000, 999999); return { text: `Které číslo je větší: ${a}, nebo ${b}?`, ans: Math.max(a, b), h1: `Delší zápis vyhrává; při stejné délce porovnej zleva.`, h2: `= ${Math.max(a, b)}` }; },
      () => { const n = ri(10, 99); return { text: `Zapiš číslem: ${n} tisíc a 500.`, ans: n * 1000 + 500, h1: `${n} tisíc = ${n * 1000}, přičti 500.`, h2: `= ${n * 1000 + 500}` }; },
      () => { const pul = pick([['půl milionu', 500000], ['čtvrt milionu', 250000]]); return { text: `Kolik je ${pul[0]}? (1 milion = 1 000 000)`, ans: pul[1], h1: `Rozděl milion na poloviny/čtvrtiny.`, h2: `= ${pul[1]}` }; },
      () => { const n = ri(100, 999) * 1000; const ok = ri(0, 1) === 0; const tvrz = ok ? n : n / 10; const spravne = tvrz === n; return { text: `Pirátský účetní tvrdí: ${n / 1000} tisíc = ${tvrz}. Má pravdu?`, ans: spravne ? 'ANO' : 'NE', h1: `Tisíce = tři nuly na konci.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const n = ri(11, 98) * 1000 + ri(1, 999); const dolni = Math.floor(n / 1000) * 1000; return { text: `Mezi kterými celými tisíci leží ${n}? Napiš ten MENŠÍ.`, ans: dolni, h1: `Škrtni stovky, desítky, jednotky.`, h2: `= ${dolni}` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true });
    }
    return tasks;
  }

  // 7-2 Operace s velkými čísly
  function gen_7_2() {
    const tasks = [];
    const T = [
      () => { const a = ri(10000, 499000), b = ri(10000, 499000); return { text: `${a} + ${b} = ?`, ans: a + b, h1: `Sečti stejné řády pod sebou.`, h2: `= ${a + b}` }; },
      () => { const b = ri(10000, 400000); const a = b + ri(10000, 400000); return { text: `${a} − ${b} = ?`, ans: a - b, h1: `Odečítej po řádech.`, h2: `= ${a - b}` }; },
      () => { const a = ri(10, 400) * 1000, b = ri(10, 400) * 1000; return { text: `${a / 1000} tisíc + ${b / 1000} tisíc = kolik tisíc?`, ans: (a + b) / 1000, h1: `Počítej jen s tisíci: ${a / 1000} + ${b / 1000}.`, h2: `= ${(a + b) / 1000}` }; },
      () => { const b = ri(10000, 300000), c = b + ri(10000, 300000); return { text: `? − ${b} = ${c - b}`, ans: c, h1: `Hledané číslo: ${c - b} + ${b}.`, h2: `= ${c}` }; },
      () => { const a = ri(10000, 400000), b = ri(10000, 300000); return { text: `Jaké číslo je o ${b} větší než ${a}?`, ans: a + b, h1: `Přičti: ${a} + ${b}.`, h2: `= ${a + b}` }; },
      () => { const a = ri(2, 9); return { text: `${a} × 10 000 = ?`, ans: a * 10000, h1: `Přidej čtyři nuly.`, h2: `= ${a * 10000}` }; },
      () => { const a = ri(2, 9) * 100000; return { text: `${a} : 1000 = ?`, ans: a / 1000, h1: `Uber tři nuly.`, h2: `= ${a / 1000}` }; },
      () => { const mesta = ri(120, 480) * 1000, ves = ri(10, 90) * 1000; return { text: `Přístavní město má ${mesta} obyvatel, rybářská vesnice ${ves}. O kolik víc lidí žije ve městě?`, ans: mesta - ves, h1: `${mesta} − ${ves}`, h2: `= ${mesta - ves}` }; },
      () => { const a = ri(100000, 500000), b = ri(100000, 400000); const ok = ri(0, 1) === 0; const tvrz = ok ? a + b : a + b + pick([-10000, 10000]); const spravne = tvrz === a + b; return { text: `Je pravda, že ${a} + ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Zkontroluj řád desetitisíců.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const s = new Set(); while (s.size < 3) s.add(ri(100, 900) * 1000); const arr = [...s]; return { text: `Z čísel ${arr[0]}, ${arr[1]}, ${arr[2]} vyber největší.`, ans: Math.max(...arr), h1: `Porovnej statisíce.`, h2: `= ${Math.max(...arr)}` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 7-3 Velké číslo — finální duel
  function gen_7_3() {
    const tasks = [];
    const T = [
      () => { const n = ri(10000, 999000); const r = Math.round(n / 1000) * 1000; return { text: `Zaokrouhli ${n} na tisíce.`, ans: r, h1: `Rozhodují stovky: ${Math.floor((n % 1000) / 100)}.`, h2: `= ${r}` }; },
      () => { const a = ri(10000, 490000), b = ri(10000, 490000); return { text: `${a} + ${b} = ?`, ans: a + b, h1: `Sečti po řádech.`, h2: `= ${a + b}` }; },
      () => { const b = ri(10000, 300000); const a = b + ri(10000, 300000); return { text: `${a} − ${b} = ?`, ans: a - b, h1: `Odečítej po řádech.`, h2: `= ${a - b}` }; },
      () => { const a = ri(2, 9), b = ri(100, 999); return { text: `${a} × ${b} = ?`, ans: a * b, h1: `Rozlož ${b} na stovky, desítky a jednotky.`, h2: `= ${a * b}` }; },
      () => { const d = ri(3, 9), q = ri(3, 9), r = ri(1, d - 1); const n = d * q + r; return { text: `Jaký zbytek má ${n} : ${d}?`, ans: r, h1: `${d} × ${q} = ${d * q}.`, h2: `zbytek ${r}` }; },
      () => { const a = ri(3, 15); let b = ri(3, 14); if (b === a) b++; return { text: `Obdélník ${a} cm × ${b} cm — jaký má obvod?`, ans: 2 * (a + b), h1: `O = 2 × (${a} + ${b})`, h2: `= ${2 * (a + b)} cm` }; },
      () => { const a = ri(3, 12); return { text: `Čtverec se stranou ${a} cm — jaký má obsah?`, ans: a * a, h1: `S = ${a} × ${a}`, h2: `= ${a * a} cm²` }; },
      () => { const n = ri(2, 9); return { text: `Kolik m je ${n} km?`, ans: n * 1000, h1: `1 km = 1000 m.`, h2: `= ${n * 1000} m` }; },
      () => { const tis = ri(10, 999); return { text: `Zapiš číslem: ${tis} tisíc.`, ans: tis * 1000, h1: `Připiš tři nuly.`, h2: `= ${tis * 1000}` }; },
      () => { const a = ri(11, 60), b = ri(3, 9); return { text: `${a} × ${b} = ?`, ans: a * b, h1: `Rozlož: ${Math.floor(a / 10) * 10} × ${b} + ${a % 10} × ${b}.`, h2: `= ${a * b}` }; },
      () => { const cena = ri(150, 450); return { text: `Zaplatíš pětistovkou nákup za ${cena} Kč. Kolik ti vrátí?`, ans: 500 - cena, h1: `500 − ${cena}`, h2: `= ${500 - cena} Kč` }; },
      () => { const q = ri(6, 50); return { text: `Jaká je polovina čísla ${q * 2}?`, ans: q, h1: `${q * 2} : 2`, h2: `= ${q}` }; },
    ];
    for (let i = 0; i < 12; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
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
