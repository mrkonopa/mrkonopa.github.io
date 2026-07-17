/* rpg-tasks-3.js — RPG Matematika 3 — rozšiřující banka úloh
   Kouzelný les 🌳 | Matematika 3. ročník (čísla do 1000, násobilka, dělení)
   window.RPG_TASK_EXTRA_3 = { '<mid>': ()=>[task,…], … } (21 misí)
*/
(function () {
  'use strict';
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const cz = n => String(n).replace('.', ',');
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function skl(n, one, few, many) {
    const a = Math.abs(n);
    return a === 1 ? one : a >= 2 && a <= 4 ? few : many;
  }
  // FRAMING-POOL: uvození drilovací úlohy „= ?" (nemění odpověď). Např. FR()+': '+a+' × '+b+' = ?'
  const FR = () => pick(['Vypočítej', 'Spočítej', 'Urči', 'Kolik je']);
  // tři strany PLATNÉHO trojúhelníku (trojúhelníková nerovnost: každá strana < součet zbylých)
  function triSides(mn, mx) {
    let a = ri(mn, mx), b = ri(mn, mx); if (a > b) { const t = a; a = b; b = t; }
    const c = ri(b - a + 1, a + b - 1);
    return [a, b, c];
  }
  // číslo 100–999 slovy (pro úlohy „zapiš číslem")
  const _J = ['', 'jedna', 'dva', 'tři', 'čtyři', 'pět', 'šest', 'sedm', 'osm', 'devět'];
  const _S = ['', 'sto', 'dvě stě', 'tři sta', 'čtyři sta', 'pět set', 'šest set', 'sedm set', 'osm set', 'devět set'];
  const _D = ['', 'deset', 'dvacet', 'třicet', 'čtyřicet', 'padesát', 'šedesát', 'sedmdesát', 'osmdesát', 'devadesát'];
  const _T = ['deset', 'jedenáct', 'dvanáct', 'třináct', 'čtrnáct', 'patnáct', 'šestnáct', 'sedmnáct', 'osmnáct', 'devatenáct'];
  function slovy(n) {
    const s = Math.floor(n / 100), z = n % 100, d = Math.floor(z / 10), j = z % 10;
    let out = _S[s];
    if (z === 0) return out;
    if (d === 1) return (out + ' ' + _T[j]).trim();
    const zbytek = d === 0 ? _J[j] : _D[d] + (j ? ' ' + _J[j] : '');
    return (out + ' ' + zbytek).trim();
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 1 — ČÍSLA DO 1000
  // ══════════════════════════════════════════════════════════════

  // 1-1 Čtení a zápis čísel do 1000 (MC — číselná)
  function gen_1_1() {
    const tasks = [];
    const T = [
      () => { const n = ri(100, 999); return { text: `Kolik jednotek má číslo ${n}?`, ans: n % 10, h1: `Jednotky jsou poslední (pravá) cifra čísla ${n}.`, h2: `= ${n % 10}`, distractors: (Math.floor(n / 100) !== n % 10 ? [String(Math.floor(n / 100))] : []) }; }, // miskoncepce: čte první (levou) cifru místo poslední
      () => { const n = ri(100, 999); return { text: `Kolik desítek má číslo ${n}?`, ans: Math.floor((n % 100) / 10), h1: `Desítky jsou prostřední cifra trojciferného čísla.`, h2: `= ${Math.floor((n % 100) / 10)}`, distractors: (n % 10 !== Math.floor((n % 100) / 10) ? [String(n % 10)] : []) }; }, // miskoncepce: čte jednotky (poslední cifru)
      () => { const n = ri(100, 999); return { text: `Kolik stovek má číslo ${n}?`, ans: Math.floor(n / 100), h1: `Stovky jsou první (levá) cifra trojciferného čísla.`, h2: `= ${Math.floor(n / 100)}`, distractors: (n % 10 !== Math.floor(n / 100) ? [String(n % 10)] : []) }; }, // miskoncepce: čte jednotky místo stovek
      () => { const s = ri(1, 9), d = ri(0, 9), j = ri(0, 9); const n = s * 100 + d * 10 + j; return { text: `Číslo má ${s} ${skl(s, 'stovku', 'stovky', 'stovek')}, ${d} ${skl(d, 'desítku', 'desítky', 'desítek')} a ${j} ${skl(j, 'jednotku', 'jednotky', 'jednotek')}. Jaké je to číslo?`, ans: n, h1: `${s} × 100 + ${d} × 10 + ${j}`, h2: `= ${n}` }; },
      () => { const n = ri(101, 998); return { text: `Jaké číslo je o 1 větší než ${n}?`, ans: n + 1, h1: `Přičti jedničku.`, h2: `= ${n + 1}`, distractors: [String(n - 1)] }; }, // miskoncepce: záměna „větší" za „menší"
      () => { const n = ri(101, 998); return { text: `Jaké číslo je o 1 menší než ${n}?`, ans: n - 1, h1: `Odečti jedničku.`, h2: `= ${n - 1}`, distractors: [String(n + 1)] }; }, // miskoncepce: záměna „menší" za „větší"
      () => { const n = ri(101, 997); return { text: `Jaké číslo leží na číselné ose přesně mezi čísly ${n} a ${n + 2}?`, ans: n + 1, h1: `Hledáš souseda obou čísel.`, h2: `= ${n + 1}` }; },
      () => { const n = ri(100, 999); return { text: `Zapiš číslem: „${slovy(n)}".`, ans: n, h1: `Poskládej stovky, desítky a jednotky za sebe.`, h2: `= ${n}` }; },
      () => { const n = ri(100, 999); const s = Math.floor(n / 100), d = Math.floor((n % 100) / 10); return { text: `Doplň rozklad: ${n} = ${s * 100} + ${d * 10} + ?`, ans: n % 10, h1: `Kolik zbývá do ${n} po stovkách a desítkách?`, h2: `= ${n % 10}` }; },
      () => { const n = ri(100, 999); const even = n % 2 === 0; return { text: `Je číslo ${n} sudé?`, ans: even ? 'ANO' : 'NE', h1: `Rozhoduje poslední cifra: 0, 2, 4, 6, 8 = sudé.`, h2: even ? 'ANO' : 'NE' }; },
      () => { const n = ri(101, 989); const next = Math.ceil((n + 1) / 10) * 10; return { text: `Jaká celá desítka následuje hned po čísle ${n}?`, ans: next, h1: `Hledáš nejbližší vyšší číslo končící nulou.`, h2: `= ${next}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true, distractors: t.distractors });
    }
    return tasks;
  }

  // 1-2 Porovnávání čísel do 1000 (MC — ANO/NE i číselná)
  function gen_1_2() {
    const dva = () => { let a = ri(100, 999), b = ri(100, 999); while (b === a) b = ri(100, 999); return [a, b]; };
    const tri = () => { const s = new Set(); while (s.size < 3) s.add(ri(100, 999)); return [...s]; };
    const tasks = [];
    const T = [
      () => { const [a, b] = dva(); const op = pick(['<', '>']); const ok = op === '<' ? a < b : a > b; return { text: `Je pravda, že ${a} ${op} ${b}?`, ans: ok ? 'ANO' : 'NE', h1: `Porovnej nejdřív stovky: ${Math.floor(a / 100)} a ${Math.floor(b / 100)}.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const stejna = ri(0, 1) === 0; const a = ri(100, 999); const b = stejna ? a : a + ri(1, 30) * (ri(0, 1) ? 1 : -1); return { text: `Platí ${a} = ${b}?`, ans: a === b ? 'ANO' : 'NE', h1: `Rovná se jen úplně stejné číslo.`, h2: a === b ? 'ANO' : 'NE' }; },
      () => { const [a, b] = dva(); return { text: `Které číslo je větší: ${a}, nebo ${b}?`, ans: Math.max(a, b), h1: `Porovnej stovky, pak desítky a jednotky.`, h2: `= ${Math.max(a, b)}`, distractors: [String(Math.min(a, b))] }; }, // miskoncepce: vybere menší místo většího
      () => { const [a, b] = dva(); return { text: `Které číslo je menší: ${a}, nebo ${b}?`, ans: Math.min(a, b), h1: `Menší je to, které je na číselné ose víc vlevo.`, h2: `= ${Math.min(a, b)}`, distractors: [String(Math.max(a, b))] }; }, // miskoncepce: vybere větší místo menšího
      () => { const [a, b, c] = tri(); return { text: `Které z čísel ${a}, ${b}, ${c} je největší?`, ans: Math.max(a, b, c), h1: `Porovnej po dvojicích, začni stovkami.`, h2: `= ${Math.max(a, b, c)}`, distractors: [String(Math.min(a, b, c))] }; }, // miskoncepce: vybere nejmenší místo největšího
      () => { const [a, b, c] = tri(); return { text: `Které z čísel ${a}, ${b}, ${c} je nejmenší?`, ans: Math.min(a, b, c), h1: `Hledej nejmenší stovky.`, h2: `= ${Math.min(a, b, c)}`, distractors: [String(Math.max(a, b, c))] }; }, // miskoncepce: vybere největší místo nejmenšího
      () => { const lo = ri(100, 700), hi = lo + ri(50, 200); const inside = ri(0, 1) === 0; const x = inside ? ri(lo + 1, hi - 1) : (ri(0, 1) ? ri(100, lo - 1) : ri(hi + 1, 999)); const ok = x > lo && x < hi; return { text: `Leží číslo ${x} mezi čísly ${lo} a ${hi}?`, ans: ok ? 'ANO' : 'NE', h1: `Musí být větší než ${lo} a zároveň menší než ${hi}.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const [a, b] = dva(); const blizsi = Math.abs(a - 500) < Math.abs(b - 500) ? a : b; const dalsi = blizsi === a ? b : a; return { text: `Které číslo je blíž k číslu 500: ${a}, nebo ${b}?`, ans: blizsi, h1: `Porovnej, o kolik se každé liší od 500.`, h2: `= ${blizsi}`, distractors: (dalsi !== blizsi ? [String(dalsi)] : []) }; }, // miskoncepce: vybere to vzdálenější od 500
      () => { const b = ri(100, 800), a = b + ri(10, 150); return { text: `O kolik je ${a} větší než ${b}?`, ans: a - b, h1: `Rozdíl zjistíš odčítáním: ${a} − ${b}.`, h2: `= ${a - b}`, distractors: [String(a + b)] }; }, // miskoncepce: sečte místo odečtení
      () => { const n = ri(100, 999); const ok = n >= 500; return { text: `Je číslo ${n} aspoň 500?`, ans: ok ? 'ANO' : 'NE', h1: `„Aspoň 500" znamená 500 nebo víc.`, h2: ok ? 'ANO' : 'NE' }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'anal', mc: true, distractors: t.distractors });
    }
    return tasks;
  }

  // 1-3 Zaokrouhlování na desítky a stovky
  function gen_1_3() {
    const tasks = [];
    const T = [
      () => { const n = ri(11, 990); const r = Math.round(n / 10) * 10; return { text: `Zaokrouhli ${n} na desítky.`, ans: r, h1: `Podívej se na cifru jednotek: ${n % 10}. 0–4 dolů, 5–9 nahoru.`, h2: `= ${r}` }; },
      () => { const n = ri(50, 950); const r = Math.round(n / 100) * 100; return { text: `Zaokrouhli ${n} na stovky.`, ans: r, h1: `Podívej se na cifru desítek: ${Math.floor((n % 100) / 10)}. 0–4 dolů, 5–9 nahoru.`, h2: `= ${r}` }; },
      () => { const n = ri(110, 980); const r = Math.round(n / 100) * 100; return { text: `Která celá stovka je nejblíž číslu ${n}?`, ans: r, h1: `Zaokrouhli ${n} na stovky.`, h2: `= ${r}` }; },
      () => { const n = ri(11, 990); const spravne = Math.round(n / 10) * 10; const tvrdi = ri(0, 1) ? spravne : spravne + pick([-10, 10]); const ok = tvrdi === spravne; return { text: `Skřítek tvrdí: „${n} zaokrouhleno na desítky je ${tvrdi}." Má pravdu?`, ans: ok ? 'ANO' : 'NE', h1: `Zaokrouhli si ${n} sám: rozhoduje cifra jednotek ${n % 10}.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const r = ri(2, 98) * 10; return { text: `Jaké NEJVĚTŠÍ číslo se zaokrouhlí na desítky na ${r}?`, ans: r + 4, h1: `Nahoru se zaokrouhluje od pětky — takže poslední, co jde dolů, končí čtyřkou.`, h2: `= ${r + 4}` }; },
      () => { const r = ri(2, 98) * 10; return { text: `Jaké NEJMENŠÍ číslo se zaokrouhlí na desítky na ${r}?`, ans: r - 5, h1: `Od pětky se zaokrouhluje nahoru — i ${r - 5} už patří k ${r}.`, h2: `= ${r - 5}` }; },
      () => { const n = ri(15, 95) * 10 + ri(1, 9); const r = Math.round(n / 10) * 10; return { text: `Malina stojí ${n} Kč. Kolik je to po zaokrouhlení na celé desetikoruny?`, ans: r, h1: `Zaokrouhli ${n} na desítky.`, h2: `= ${r} Kč` }; },
      () => { const n = ri(110, 980); const r = Math.round(n / 100) * 100; return { text: `Ke studánce je to ${n} kroků. Kolik je to zhruba — po zaokrouhlení na stovky?`, ans: r, h1: `Rozhoduje cifra desítek: ${Math.floor((n % 100) / 10)}.`, h2: `= ${r} kroků` }; },
      () => { const n = ri(105, 985); const dolni = Math.floor(n / 100) * 100; return { text: `Mezi kterými dvěma celými stovkami leží číslo ${n}? Napiš tu MENŠÍ.`, ans: dolni, h1: `Škrtni desítky a jednotky — zbudou celé stovky pod číslem.`, h2: `= ${dolni}` }; },
      () => { const n = ri(11, 990); const nahoru = n % 10 >= 5; return { text: `Zaokrouhlí se číslo ${n} na desítky NAHORU?`, ans: nahoru ? 'ANO' : 'NE', h1: `Nahoru jde 5, 6, 7, 8, 9 na místě jednotek. Tady je ${n % 10}.`, h2: nahoru ? 'ANO' : 'NE' }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 2 — SČÍTÁNÍ A ODČÍTÁNÍ DO 1000
  // ══════════════════════════════════════════════════════════════

  // 2-1 Sčítání do 1000
  function gen_2_1() {
    const tasks = [];
    const T = [
      () => { const a = ri(100, 700), b = ri(50, 290); return { text: `${FR()}: ${a} + ${b} = ?`, ans: a + b, h1: `Sečti nejdřív stovky, pak desítky a jednotky.`, h2: `= ${a + b}` }; },
      () => { const b = ri(100, 500), c = b + ri(100, 450); return { text: `Doplň: ? + ${b} = ${c}`, ans: c - b, h1: `Hledaný sčítanec zjistíš odčítáním: ${c} − ${b}.`, h2: `= ${c - b}` }; },
      () => { const a = ri(100, 500), c = a + ri(100, 450); return { text: `Doplň: ${a} + ? = ${c}`, ans: c - a, h1: `Kolik chybí od ${a} do ${c}? Spočítej ${c} − ${a}.`, h2: `= ${c - a}` }; },
      () => { const a = ri(150, 950); return { text: `Kolik chybí číslu ${a} do 1000?`, ans: 1000 - a, h1: `Doplň nejdřív do celé stovky, pak stovky do tisíce.`, h2: `= ${1000 - a}` }; },
      () => { const a = ri(100, 800), b = ri(20, 190); return { text: `Jaké číslo je o ${b} větší než ${a}?`, ans: a + b, h1: `„O ${b} větší" znamená přičíst: ${a} + ${b}.`, h2: `= ${a + b}` }; },
      () => { const a = ri(100, 700), b = ri(30, 250); return { text: `Zvětši číslo ${a} o ${b}.`, ans: a + b, h1: `Zvětšit o = přičíst.`, h2: `= ${a + b}` }; },
      () => { const a = ri(100, 400), b = ri(100, 300), c = ri(50, 250); return { text: `${FR()}: ${a} + ${b} + ${c} = ?`, ans: a + b + c, h1: `Sečti nejdřív dvě čísla, pak přičti třetí.`, h2: `= ${a + b + c}` }; },
      () => { const a = ri(150, 800), b = ri(30, 190); const ok = ri(0, 1) === 0; const tvrz = ok ? a + b : a + b + pick([-10, 10, -100, 100]); const spravne = tvrz === a + b; return { text: `Je pravda, že ${a} + ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Spočítej si součet sám a porovnej.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const b = ri(2, 9) * 10; const a = ri(100, 900 - b); return { text: `Kouzelný stroj ke každému číslu přičítá ${b}. Co vypadne, když do něj vložíš ${a}?`, ans: a + b, h1: `${a} + ${b}`, h2: `= ${a + b}` }; },
      () => { const s = new Set(); while (s.size < 3) s.add(ri(100, 480)); const [x, y, z] = [...s]; const max = Math.max(x, y, z), min = Math.min(x, y, z); return { text: `Z čísel ${x}, ${y}, ${z} sečti největší a nejmenší.`, ans: max + min, h1: `Největší je ${max}, nejmenší ${min}.`, h2: `${max} + ${min} = ${max + min}` }; },
      () => { const a = ri(20, 70) * 10, b = ri(5, Math.floor((1000 - a * 1) / 10) - a / 10 > 0 ? Math.floor((1000 - a) / 10) : 5) * 10; return { text: `${FR()}: ${a} + ${b} = ?`, ans: a + b, h1: `Sčítáš celé desítky — sečti desítky a přidej nulu.`, h2: `= ${a + b}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 2-2 Odčítání do 1000
  function gen_2_2() {
    const tasks = [];
    const T = [
      () => { const b = ri(50, 400), a = b + ri(50, 550); return { text: `${FR()}: ${a} − ${b} = ?`, ans: a - b, h1: `Odečítej po skupinách: nejdřív stovky, pak zbytek.`, h2: `= ${a - b}` }; },
      () => { const b = ri(50, 400), a = b + ri(50, 550); return { text: `${a} − ? = ${a - b}`, ans: b, h1: `Co odečteš od ${a}, abys dostal ${a - b}? Spočítej ${a} − ${a - b}.`, h2: `= ${b}` }; },
      () => { const b = ri(50, 400), d = ri(50, 500); return { text: `? − ${b} = ${d}`, ans: b + d, h1: `Hledané číslo je o ${b} větší než výsledek: ${d} + ${b}.`, h2: `= ${b + d}` }; },
      () => { const b = ri(50, 400), a = b + ri(50, 550); return { text: `O kolik je ${a} více než ${b}?`, ans: a - b, h1: `Rozdíl zjistíš odčítáním: ${a} − ${b}.`, h2: `= ${a - b}` }; },
      () => { const b = ri(50, 400), a = b + ri(50, 550); return { text: `O kolik je ${b} méně než ${a}?`, ans: a - b, h1: `Ptáme se na stejný rozdíl: ${a} − ${b}.`, h2: `= ${a - b}` }; },
      () => { const a = ri(300, 990), b = ri(50, 250); return { text: `Zmenši číslo ${a} o ${b}.`, ans: a - b, h1: `Zmenšit o = odečíst.`, h2: `= ${a - b}` }; },
      () => { const a = ri(120, 980); const cil = Math.ceil(a / 100) * 100 === a ? a + 100 : Math.ceil(a / 100) * 100; return { text: `Kolik chybí od čísla ${a} do nejbližší vyšší celé stovky?`, ans: cil - a, h1: `Nejbližší vyšší stovka je ${cil}.`, h2: `= ${cil - a}` }; },
      () => { const a = ri(500, 990), b = ri(50, 200), c = ri(50, 200); return { text: `${FR()}: ${a} − ${b} − ${c} = ?`, ans: a - b - c, h1: `Odečti postupně: nejdřív ${b}, pak ${c}.`, h2: `= ${a - b - c}` }; },
      () => { const b = ri(100, 400), a = b + ri(100, 500); const ok = ri(0, 1) === 0; const tvrz = ok ? a - b : a - b + pick([-10, 10, -100, 100]); const spravne = tvrz === a - b; return { text: `Je pravda, že ${a} − ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Spočítej rozdíl a porovnej.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const b = ri(2, 9) * 10; const a = ri(b + 100, 990); return { text: `Kouzelný stroj od každého čísla odečítá ${b}. Co vypadne, když do něj vložíš ${a}?`, ans: a - b, h1: `${a} − ${b}`, h2: `= ${a - b}` }; },
      () => { const s = new Set(); while (s.size < 3) s.add(ri(100, 900)); const arr = [...s]; const max = Math.max(...arr), min = Math.min(...arr); return { text: `Z čísel ${arr[0]}, ${arr[1]}, ${arr[2]} odečti nejmenší od největšího.`, ans: max - min, h1: `Největší je ${max}, nejmenší ${min}.`, h2: `${max} − ${min} = ${max - min}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 2-3 Slovní úlohy sčítání/odčítání
  function gen_2_3() {
    const tasks = [];
    const T = [
      () => { const a = ri(120, 480), b = ri(80, 350); return { text: `Skřítek nasbíral ${a} žaludů a víla ${b} žaludů. Kolik žaludů mají dohromady?`, ans: a + b, h1: 'Sečti oba počty.', h2: `${a} + ${b} = ${a + b}` }; },
      () => { const total = ri(400, 900), b = ri(100, total - 100); return { text: `Na louce kvetlo ${total} květin. ${b} jich lesní víly utrhly na věnec. Kolik květin zbylo?`, ans: total - b, h1: 'Odečti utržené květiny.', h2: `${total} − ${b} = ${total - b}` }; },
      () => { const a = ri(100, 400), b = ri(100, 400); return { text: `V lese roste ${a} smrků a ${b} borovic. Kolik je to stromů celkem?`, ans: a + b, h1: 'Sečti oba druhy stromů.', h2: `${a} + ${b} = ${a + b}` }; },
      () => { const b = ri(100, 400), a = b + ri(50, 300); return { text: `Ježek má ${a} ostnů na zádech a ${b} na bocích. O kolik víc ostnů má na zádech?`, ans: a - b, h1: 'Ptáme se na rozdíl: odečti menší počet od většího.', h2: `${a} − ${b} = ${a - b}` }; },
      () => { const kniha = ri(200, 500), precteno = ri(80, kniha - 50); return { text: `Kouzelná kniha má ${kniha} stran. Skřítek už přečetl ${precteno} stran. Kolik stran mu zbývá?`, ans: kniha - precteno, h1: 'Odečti přečtené strany od všech.', h2: `${kniha} − ${precteno} = ${kniha - precteno}` }; },
      () => { const bylo = ri(150, 500), prislo = ri(50, 250), odeslo = ri(30, 140); return { text: `Na mýtině bylo ${bylo} světlušek. Pak jich ${prislo} přiletělo a ${odeslo} odletělo. Kolik světlušek je na mýtině teď?`, ans: bylo + prislo - odeslo, h1: `Nejdřív přičti: ${bylo} + ${prislo} = ${bylo + prislo}. Pak odečti odletěné.`, h2: `${bylo + prislo} − ${odeslo} = ${bylo + prislo - odeslo}` }; },
      () => { const cesta = ri(400, 900), uslo = ri(150, cesta - 100); return { text: `Ke kouzelnému dubu je to ${cesta} kroků. Trpaslík už ušel ${uslo} kroků. Kolik kroků mu ještě zbývá?`, ans: cesta - uslo, h1: 'Odečti, co už ušel.', h2: `${cesta} − ${uslo} = ${cesta - uslo}` }; },
      () => { const a = ri(100, 450), navic = ri(50, 250); return { text: `Medvěd snědl ${a} borůvek. Medvědice o ${navic} víc. Kolik borůvek snědla medvědice?`, ans: a + navic, h1: `„O ${navic} víc" znamená přičíst.`, h2: `${a} + ${navic} = ${a + navic}` }; },
      () => { const mel = ri(300, 800), dal = ri(100, 250); return { text: `Dřevorubec nasekal ${mel} polen. ${dal} polen odvezl do vesnice. Kolik polen mu zůstalo v lese?`, ans: mel - dal, h1: 'Odečti odvezená polena.', h2: `${mel} − ${dal} = ${mel - dal}` }; },
      () => { const a = ri(120, 400), b = ri(120, 400), c = ri(50, 190); return { text: `Veverka má ve třech skrýších ${a}, ${b} a ${c} oříšků. Kolik oříšků má celkem?`, ans: a + b + c, h1: 'Sečti všechny tři skrýše.', h2: `${a} + ${b} + ${c} = ${a + b + c}` }; },
      () => { const navlekla = ri(200, 600), ztratila = ri(50, 180); return { text: `Víla navlékla na náhrdelník ${navlekla} korálků z rosy, ale ${ztratila} se jich skutálelo. Kolik korálků na náhrdelníku zůstalo?`, ans: navlekla - ztratila, h1: 'Odečti ztracené korálky.', h2: `${navlekla} − ${ztratila} = ${navlekla - ztratila}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
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
    const T = [
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `${FR()}: ${a} × ${b} = ?`, ans: a * b, h1: `${a} × ${b}: přičítej ${b} celkem ${a}krát.`, h2: `= ${a * b}`, distractors: (a + b !== a * b ? [String(a + b)] : []) }; }, // miskoncepce: sečte místo vynásobení
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `${a} × ? = ${a * b}`, ans: b, h1: `Jaké číslo dá s ${a} dohromady ${a * b}? Zkus ${a * b} : ${a}.`, h2: `= ${b}` }; },
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `? × ${b} = ${a * b}`, ans: a, h1: `Kolikrát musíš vzít ${b}, abys dostal ${a * b}?`, h2: `= ${a}` }; },
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `Kolik je ${a}krát ${b}?`, ans: a * b, h1: `${a}krát ${b} je totéž co ${a} × ${b}.`, h2: `= ${a * b}`, distractors: (a + b !== a * b ? [String(a + b)] : []) }; }, // miskoncepce: sečte místo vynásobení
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `Kolikrát je třeba vzít číslo ${b}, aby vyšlo ${a * b}?`, ans: a, h1: `Hledáš ${a * b} : ${b}.`, h2: `= ${a}` }; },
      () => { const a = ri(2, 10), b = ri(2, 10); const ok = ri(0, 1) === 0; const tvrz = ok ? a * b : a * b + pick([-b, b, -a, a]); const spravne = tvrz === a * b; return { text: `Platí ${a} × ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Vybav si řadu násobků čísla ${Math.min(a, b)}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(2, 9), k = ri(2, 8); return { text: `V řadě násobků čísla ${a} je číslo ${a * k}. Které číslo v řadě následuje hned po něm?`, ans: a * (k + 1), h1: `Další násobek = přičti ${a}.`, h2: `= ${a * (k + 1)}` }; },
      () => { const n = ri(2, 9); return { text: `Kolik nohou ${n < 5 ? 'mají' : 'má'} ${n} ${skl(n, 'pavouk', 'pavouci', 'pavouků')}? (Pavouk má 8 nohou.)`, ans: n * 8, h1: `${n} × 8`, h2: `= ${n * 8}`, distractors: (n + 8 !== n * 8 ? [String(n + 8)] : []) }; }, // miskoncepce: přičte 8 místo násobení
      () => { const a = ri(6, 45); return { text: `Jaký je dvojnásobek čísla ${a}?`, ans: a * 2, h1: `Dvojnásobek = 2 × ${a}.`, h2: `= ${a * 2}`, distractors: (a + 2 !== a * 2 ? [String(a + 2)] : []) }; }, // miskoncepce: přičte 2 místo × 2
      () => { const a = ri(4, 30); return { text: `Jaký je trojnásobek čísla ${a}?`, ans: a * 3, h1: `Trojnásobek = 3 × ${a}.`, h2: `= ${a * 3}`, distractors: (a + 3 !== a * 3 ? [String(a + 3)] : []) }; }, // miskoncepce: přičte 3 místo × 3
      () => { const a = ri(2, 5), b = ri(2, 5), c = ri(2, 4); return { text: `${FR()}: ${a} × ${b} × ${c} = ?`, ans: a * b * c, h1: `Vynásob nejdřív ${a} × ${b} = ${a * b}, pak × ${c}.`, h2: `= ${a * b * c}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true, distractors: t.distractors });
    }
    return tasks;
  }

  // 3-2 Násobení 10, 100 a desítkami
  function gen_3_2() {
    const tasks = [];
    const T = [
      () => { const a = ri(2, 9); return { text: `${a} × 10 = ?`, ans: a * 10, h1: `Násobíš deseti → přidej jednu nulu.`, h2: `= ${a * 10}` }; },
      () => { const a = ri(2, 9); return { text: `${a} × 100 = ?`, ans: a * 100, h1: `Násobíš stem → přidej dvě nuly.`, h2: `= ${a * 100}` }; },
      () => { const a = ri(2, 9), b = ri(2, 9) * 10; return { text: `${a} × ${b} = ?`, ans: a * b, h1: `Spočítej ${a} × ${b / 10} = ${a * (b / 10)} a přidej nulu.`, h2: `= ${a * b}` }; },
      () => { const a = ri(3, 90); return { text: `Jaký je desetinásobek čísla ${a}?`, ans: a * 10, h1: `Desetinásobek = ${a} × 10.`, h2: `= ${a * 10}` }; },
      () => { const a = ri(2, 9); return { text: `Jaký je stonásobek čísla ${a}?`, ans: a * 100, h1: `Stonásobek = ${a} × 100.`, h2: `= ${a * 100}` }; },
      () => { const a = ri(2, 9); return { text: `Kolik je ${a} ${skl(a, 'desítka', 'desítky', 'desítek')}?`, ans: a * 10, h1: `${a} ${skl(a, 'desítka', 'desítky', 'desítek')} = ${a} × 10.`, h2: `= ${a * 10}` }; },
      () => { const a = ri(2, 9); return { text: `Zapiš číslem: ${a} ${skl(a, 'stovka', 'stovky', 'stovek')}.`, ans: a * 100, h1: `${a} ${skl(a, 'stovka', 'stovky', 'stovek')} = ${a} × 100.`, h2: `= ${a * 100}` }; },
      () => { const a = ri(3, 9); return { text: `Skřítek má ${a} ${skl(a, 'měšec', 'měšce', 'měšců')} a v každém přesně 10 zlaťáků. Kolik zlaťáků má celkem?`, ans: a * 10, h1: `${a} × 10`, h2: `= ${a * 10} zlaťáků` }; },
      () => { const a = ri(2, 9); const ok = ri(0, 1) === 0; const tvrz = ok ? a * 10 : a * 100; const spravne = tvrz === a * 10; return { text: `Je pravda, že ${a} × 10 = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Při násobení deseti přibude jen JEDNA nula.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(2, 9); return { text: `Doplň: ${a} × ? = ${a * 100}`, ans: 100, h1: `Kolika musíš vynásobit ${a}, aby přibyly dvě nuly?`, h2: `= 100` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 3-3 Slovní úlohy násobení
  function gen_3_3() {
    const tasks = [];
    const T = [
      () => { const a = ri(2, 9), b = ri(3, 9); return { text: `Na ${a} ${skl(a, 'větvi', 'větvích', 'větvích')} sedí po ${b} ptácích. Kolik ptáků je celkem?`, ans: a * b, h1: `${a} ${skl(a, 'větev', 'větve', 'větví')} po ${b} ptácích = ${a} × ${b}.`, h2: `= ${a * b}` }; },
      () => { const a = ri(2, 8), b = ri(2, 9); return { text: `Veverka má ${a} ${skl(a, 'skrýš', 'skrýše', 'skrýší')} a v každé ${b} ${skl(b, 'oříšek', 'oříšky', 'oříšků')}. Kolik oříšků má celkem?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b}` }; },
      () => { const a = ri(2, 6), b = ri(10, 50); return { text: `Jeden košík lesních jahod stojí ${b} Kč. Kolik zaplatíš za ${a} ${skl(a, 'košík', 'košíky', 'košíků')}?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b} Kč` }; },
      () => { const r = ri(2, 6), s = ri(3, 9); return { text: `Trpaslíci vysadili ${r} ${skl(r, 'řadu', 'řady', 'řad')} stromků, v každé řadě ${s} ${skl(s, 'stromek', 'stromky', 'stromků')}. Kolik stromků vysadili?`, ans: r * s, h1: `${r} × ${s}`, h2: `= ${r * s}` }; },
      () => { const r = ri(2, 5), s = ri(4, 8); return { text: `Na plechu je ${r} ${skl(r, 'řada', 'řady', 'řad')} perníčků po ${s} ${skl(s, 'kusu', 'kusech', 'kusech')}. Kolik perníčků se peče?`, ans: r * s, h1: `${r} × ${s}`, h2: `= ${r * s}` }; },
      () => { const n = ri(3, 9); return { text: `Kolik nohou ${n < 5 ? 'mají' : 'má'} ${n} ${skl(n, 'žába', 'žáby', 'žab')}? (Žába má 4 nohy.)`, ans: n * 4, h1: `${n} × 4`, h2: `= ${n * 4}` }; },
      () => { const t = ri(2, 8); return { text: `Skřítek spí v pařezu už ${t} ${skl(t, 'týden', 'týdny', 'týdnů')}. Kolik je to dní? (Týden má 7 dní.)`, ans: t * 7, h1: `${t} × 7`, h2: `= ${t * 7} dní` }; },
      () => { const n = ri(3, 9); return { text: `Víla našla ${n} ${skl(n, 'trojlístek', 'trojlístky', 'trojlístků')}. Kolik lístků mají dohromady?`, ans: n * 3, h1: `Každý trojlístek má 3 lístky: ${n} × 3.`, h2: `= ${n * 3}` }; },
      () => { const n = ri(2, 8), b = ri(4, 9); return { text: `V každém z ${n} ${skl(n, 'sáčku', 'sáčků', 'sáčků')} je ${b} ${skl(b, 'bonbon', 'bonbony', 'bonbonů')} z lesního medu. Kolik bonbonů je ve všech sáčcích?`, ans: n * b, h1: `${n} × ${b}`, h2: `= ${n * b}` }; },
      () => { const d = ri(2, 9), n = ri(2, 9); return { text: `Světluška rozsvítí každou noc ${d} ${skl(d, 'lucerničku', 'lucerničky', 'lucerniček')}. Kolik lucerniček rozsvítí za ${n} ${skl(n, 'noc', 'noci', 'nocí')}?`, ans: d * n, h1: `${d} × ${n}`, h2: `= ${d * n}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
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
    const T = [
      () => { const b = ri(2, 10), q = ri(2, 10); return { text: `${b * q} : ${b} = ?`, ans: q, h1: `Jaké číslo × ${b} = ${b * q}?`, h2: `= ${q}`, distractors: (b !== q ? [String(b)] : []) }; }, // miskoncepce: odpoví dělitelem místo podílem
      () => { const b = ri(2, 10), q = ri(2, 10); return { text: `Kolikrát se ${b} vejde do ${b * q}?`, ans: q, h1: `To je ${b * q} : ${b}.`, h2: `= ${q}` }; },
      () => { const b = ri(2, 10), q = ri(2, 10); return { text: `? : ${b} = ${q}`, ans: b * q, h1: `Hledáš číslo, které po dělení ${b} dá ${q}. Spočítej ${b} × ${q}.`, h2: `= ${b * q}` }; },
      () => { const b = ri(2, 9), q = ri(2, 9); return { text: `${b * q} : ? = ${q}`, ans: b, h1: `Čím musíš dělit ${b * q}, aby vyšlo ${q}? Zkus ${b * q} : ${q}.`, h2: `= ${b}` }; },
      () => { const q = ri(3, 40); return { text: `Jaká je polovina čísla ${q * 2}?`, ans: q, h1: `Polovina = děleno dvěma: ${q * 2} : 2.`, h2: `= ${q}` }; },
      () => { const q = ri(3, 25); return { text: `Jaká je třetina čísla ${q * 3}?`, ans: q, h1: `Třetina = děleno třemi: ${q * 3} : 3.`, h2: `= ${q}` }; },
      () => { const q = ri(3, 20); return { text: `Jaká je čtvrtina čísla ${q * 4}?`, ans: q, h1: `Čtvrtina = děleno čtyřmi: ${q * 4} : 4.`, h2: `= ${q}` }; },
      () => { const b = ri(2, 9), q = ri(2, 9); const ok = ri(0, 1) === 0; const tvrz = ok ? q : q + pick([-1, 1, 2]); const spravne = tvrz === q; return { text: `Platí ${b * q} : ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Zkouška násobením: ${b} × ${tvrz} = ${b * tvrz}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const k = ri(2, 9), a = ri(2, 9); return { text: `Kolikrát je číslo ${a} menší než číslo ${a * k}?`, ans: k, h1: `Vydělte: ${a * k} : ${a}.`, h2: `= ${k}` }; },
      () => { const d = ri(2, 8), q = ri(2, 9); return { text: `${d * q} lesních plodů rozdělíme spravedlivě na ${d} ${skl(d, 'hromádku', 'hromádky', 'hromádek')}. Po kolika plodech?`, ans: q, h1: `${d * q} : ${d}`, h2: `= ${q}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true, distractors: t.distractors });
    }
    return tasks;
  }

  // 4-2 Dělení se zbytkem
  function gen_4_2() {
    const nz = () => { const d = ri(2, 9), q = ri(2, 9), r = ri(1, d - 1); return { d, q, r, n: d * q + r }; };
    const tasks = [];
    const T = [
      () => { const { d, q, r, n } = nz(); return { text: `Rozděl ${n} do skupin po ${d}. Kolik zbyde?`, ans: r, h1: `Největší násobek: ${d} × ${q} = ${d * q}. Zbyde ${n} − ${d * q}.`, h2: `zbyde ${r}` }; },
      () => { const { d, q, n } = nz(); return { text: `Rozděl ${n} do skupin po ${d}. Kolik celých skupin vznikne?`, ans: q, h1: `${d} × ${q} = ${d * q} se ještě vejde, ${d} × ${q + 1} už ne.`, h2: `= ${q}` }; },
      () => { const { d, q, r, n } = nz(); return { text: `Jaký zbytek má dělení ${n} : ${d}?`, ans: r, h1: `${d} × ${q} = ${d * q}, zbytek je ${n} − ${d * q}.`, h2: `zbytek ${r}` }; },
      () => { const q = ri(2, 6), r = ri(1, 6), n = q * 7 + r; return { text: `Skřítek počítá ${n} dní. Kolik je to CELÝCH týdnů?`, ans: q, h1: `Týden má 7 dní: kolikrát se 7 vejde do ${n}?`, h2: `= ${q}` }; },
      () => { const q = ri(2, 6), r = ri(1, 6), n = q * 7 + r; return { text: `${n} dní je ${q} ${skl(q, 'týden', 'týdny', 'týdnů')} a ještě kolik dní navíc?`, ans: r, h1: `${q} × 7 = ${q * 7}, zbývá ${n} − ${q * 7}.`, h2: `= ${r} ${skl(r, 'den', 'dny', 'dní')}` }; },
      () => { const { d, q, n } = nz(); return { text: `Do jednoho plata se vejde ${d} ${skl(d, 'vejce', 'vejce', 'vajec')}. Kolik plat úplně naplníš, když máš ${n} ${skl(n, 'vejce', 'vejce', 'vajec')}?`, ans: q, h1: `${d} × ${q} = ${d * q} se vejde, víc už ne.`, h2: `= ${q}` }; },
      () => { const d = ri(2, 9), n = ri(10, 80); const deli = n % d === 0; return { text: `Dá se číslo ${n} rozdělit číslem ${d} beze zbytku?`, ans: deli ? 'ANO' : 'NE', h1: `Projdi řadu násobků čísla ${d} — je v ní ${n}?`, h2: deli ? 'ANO' : 'NE' }; },
      () => { const { d, q, n } = nz(); return { text: `Jaký je největší násobek čísla ${d}, který je menší než ${n}?`, ans: d * q, h1: `Projdi násobky: ${d}, ${d * 2}, ${d * 3}… poslední pod ${n}.`, h2: `= ${d * q}` }; },
      () => { const { d, r, n } = nz(); return { text: `Jezevec dává ${n} žaludů do pytlíků po ${d}. Kolik žaludů mu CHYBÍ do dalšího plného pytlíku?`, ans: d - r, h1: `Zbyde mu ${r} — do plného pytlíku chybí ${d} − ${r}.`, h2: `= ${d - r}` }; },
      () => { const { d, q, r, n } = nz(); return { text: `${n} zlaťáků rozdělíme po ${d}. Doplň: ${n} = ${d} × ? + ${r}`, ans: q, h1: `Kolikrát se ${d} vejde do ${n - r}?`, h2: `= ${q}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 4-3 Slovní úlohy dělení — mix: beze zbytku i se zbytkem (jako 4-1 a 4-2)
  function gen_4_3() {
    const tasks = [];
    const T = [
      // — beze zbytku (vyjde celek) —
      () => { const d = ri(2, 7), total = d * ri(3, 9); return { text: `${total} oříšků rozdělíme rovným dílem mezi ${d} ${skl(d, 'veverku', 'veverky', 'veverek')}. Kolik dostane každá?`, ans: total / d, h1: `${total} : ${d}`, h2: `= ${total / d}` }; },
      () => { const d = ri(2, 8), n = d * ri(3, 9); return { text: `Skřítek rozdělil ${n} hub do ${d} ${skl(d, 'košíku', 'košíků', 'košíků')} stejně. Kolik hub je v jednom košíku?`, ans: n / d, h1: `${n} : ${d}`, h2: `= ${n / d}` }; },
      () => { const cols = ri(3, 8), rows = ri(2, 6); return { text: `${rows * cols} stromků je vysázeno ${rows < 5 ? 've' : 'v'} ${rows} ${skl(rows, 'řadě', 'řadách', 'řadách')} stejně. Kolik stromků je v jedné řadě?`, ans: cols, h1: `${rows * cols} : ${rows}`, h2: `= ${cols}` }; },
      () => { const d = ri(2, 6), q = ri(3, 9); return { text: `Provaz dlouhý ${d * q} m rozstříháme na kusy po ${d} m. Kolik kusů dostaneme?`, ans: q, h1: `${d * q} : ${d}`, h2: `= ${q}` }; },
      () => { const d = ri(2, 5), q = ri(3, 9); return { text: `Medvědice rozdělila ${d * q} medových koláčků rovným dílem mezi ${d} ${skl(d, 'medvídě', 'medvíďata', 'medvíďat')}. Kolik koláčků dostalo každé?`, ans: q, h1: `${d * q} : ${d}`, h2: `= ${q}` }; },
      () => { const cena = ri(3, 9), penize = cena * ri(3, 9); return { text: `Jedna kouzelná fazole stojí ${cena} zlaťáky. Kolik fazolí koupíš za ${penize} zlaťáků?`, ans: penize / cena, h1: `${penize} : ${cena}`, h2: `= ${penize / cena}` }; },
      // — se zbytkem —
      () => { const d = ri(3, 6), q = ri(3, 8), r = ri(1, d - 1), n = d * q + r; return { text: `Jezevec našel ${n} žaludů a rozděluje je rovným dílem mezi ${d} ${skl(d, 'jezevce', 'jezevce', 'jezevců')}. Kolik žaludů zbyde?`, ans: r, h1: `${d} × ${q} = ${d * q}, zbyde ${n} − ${d * q}.`, h2: `zbyde ${r}` }; },
      () => { const d = ri(3, 6), q = ri(3, 8), r = ri(1, d - 1), n = d * q + r; return { text: `Máš ${n} jablek a dáváš je do pytlíků po ${d}. Kolik pytlíků úplně naplníš?`, ans: q, h1: `${d} × ${q} = ${d * q} se vejde, ${d} × ${q + 1} už ne.`, h2: `= ${q}` }; },
      () => { const d = ri(2, 4), q = ri(3, 8), r = ri(1, d - 1), n = d * q + r; return { text: `Na lavičku se vejdou ${d} ${skl(d, 'skřítek', 'skřítci', 'skřítků')}. Kolik laviček je PLNĚ obsazených, když se posadí ${n} ${skl(n, 'skřítek', 'skřítci', 'skřítků')}?`, ans: q, h1: `${n} : ${d} je ${q}, zbytek ${r}.`, h2: `= ${q}` }; },
      () => { const d = ri(3, 6), q = ri(2, 7), r = ri(1, d - 1), n = d * q + r; return { text: `Víla svazuje kytice po ${d} ${skl(d, 'květině', 'květinách', 'květinách')}. Má ${n} ${skl(n, 'květinu', 'květiny', 'květin')}. Kolik květin jí zbyde mimo kytice?`, ans: r, h1: `Celé kytice: ${q} (${d} × ${q} = ${d * q}). Zbytek: ${n} − ${d * q}.`, h2: `= ${r}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
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
    const T = [
      () => { const [a, b, c] = triSides(2, 12); return { text: `Trojúhelník má strany ${a} cm, ${b} cm a ${c} cm. Jaký je jeho obvod?`, ans: a + b + c, h1: `Obvod = součet všech tří stran: ${a} + ${b} + ${c}.`, h2: `= ${a + b + c} cm` }; },
      () => { const a = ri(3, 15); return { text: `Rovnostranný trojúhelník má stranu ${a} cm. Jaký je jeho obvod?`, ans: 3 * a, h1: `Rovnostranný = tři stejné strany: ${a} + ${a} + ${a}.`, h2: `= ${3 * a} cm` }; },
      () => { const r = ri(3, 12), z = ri(2, 2 * r - 1); return { text: `Rovnoramenný trojúhelník má dvě ramena po ${r} cm a základnu ${z} cm. Jaký je jeho obvod?`, ans: 2 * r + z, h1: `Sečti obě ramena a základnu: ${r} + ${r} + ${z}.`, h2: `= ${2 * r + z} cm` }; },
      () => { const [a, b, c] = triSides(3, 10); const o = a + b + c; return { text: `Obvod trojúhelníku je ${o} cm. Dvě strany měří ${a} cm a ${b} cm. Kolik měří třetí strana?`, ans: c, h1: `Od obvodu odečti známé strany: ${o} − ${a} − ${b}.`, h2: `= ${c} cm` }; },
      () => { const a = ri(3, 8), c = ri(a + 1, 3 * a - 1); return { text: `Jedna strana trojúhelníku měří ${a} cm, druhá je dvakrát delší a třetí měří ${c} cm. Jaký je obvod?`, ans: a + 2 * a + c, h1: `Druhá strana: 2 × ${a} = ${2 * a}. Sečti všechny tři.`, h2: `= ${a + 2 * a + c} cm` }; },
      () => { const [a, b, c] = triSides(2, 9); return { text: `Vílí záhon má tvar trojúhelníku se stranami ${a} m, ${b} m a ${c} m. Kolik metrů plotu je potřeba na jeho oplocení?`, ans: a + b + c, h1: `Plot vede po obvodu: sečti strany.`, h2: `= ${a + b + c} m` }; },
      () => { const a = ri(20, 90), b = ri(20, 90), c = ri(20, 90); return { text: `Trojúhelníková stezka má úseky ${a} m, ${b} m a ${c} m. Jak dlouhá je celá stezka?`, ans: a + b + c, h1: `Celá stezka = součet úseků.`, h2: `= ${a + b + c} m` }; },
      () => { const [a, b, c] = triSides(10, 40); return { text: `Trojúhelník má strany ${a} mm, ${b} mm a ${c} mm. Jaký je jeho obvod v milimetrech?`, ans: a + b + c, h1: `Stejný postup jako s centimetry: sečti strany.`, h2: `= ${a + b + c} mm` }; },
      () => { const a = ri(3, 12); const o = 3 * a; const ok = ri(0, 1) === 0; const tvrz = ok ? o : o + pick([-3, 3, -a, a]); const spravne = tvrz === o; return { text: `Skřítek tvrdí, že rovnostranný trojúhelník se stranou ${a} cm má obvod ${tvrz} cm. Má pravdu?`, ans: spravne ? 'ANO' : 'NE', h1: `Spočítej ${a} + ${a} + ${a} a porovnej.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const o = ri(4, 12) * 3; return { text: `Rovnostranný trojúhelník má obvod ${o} cm. Kolik měří jedna jeho strana?`, ans: o / 3, h1: `Tři stejné strany: ${o} : 3.`, h2: `= ${o / 3} cm` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'geo' });
    }
    return tasks;
  }

  // 5-2 Obvod čtverce a obdélníku — jako SOUČET stran (3. roč., bez vzorců)
  function gen_5_2() {
    const obd = () => { const a = ri(3, 12); let b = ri(2, 11); if (b >= a) b = a - 1; return [a, b]; };
    const tasks = [];
    const T = [
      () => { const a = ri(2, 12); return { text: `Čtverec má 4 stejné strany po ${a} cm. Jaký je jeho obvod?`, ans: 4 * a, h1: `Sečti všechny 4 strany: ${a} + ${a} + ${a} + ${a}.`, h2: `= ${4 * a} cm` }; },
      () => { const [a, b] = obd(); return { text: `Obdélník má dvě strany po ${a} cm a dvě strany po ${b} cm. Jaký je jeho obvod?`, ans: 2 * (a + b), h1: `Sečti všechny 4 strany: ${a} + ${b} + ${a} + ${b}.`, h2: `= ${2 * (a + b)} cm` }; },
      () => { const o = ri(3, 12) * 4; return { text: `Čtverec má obvod ${o} cm. Kolik měří jedna jeho strana?`, ans: o / 4, h1: `Čtyři stejné strany: ${o} : 4.`, h2: `= ${o / 4} cm` }; },
      () => { const [a, b] = obd(); const o = 2 * (a + b); return { text: `Obdélník má obvod ${o} cm a dvě strany měří po ${a} cm. Kolik měří každá z dalších dvou stran?`, ans: b, h1: `Zbytek obvodu: ${o} − ${a} − ${a} = ${o - 2 * a}. To jsou DVĚ stejné strany.`, h2: `= ${b} cm` }; },
      () => { const a = ri(2, 9); return { text: `Čtvercový záhon s bylinkami má stranu ${a} m. Kolik metrů nízkého plůtku je potřeba kolem dokola?`, ans: 4 * a, h1: `Plot = obvod: ${a} + ${a} + ${a} + ${a}.`, h2: `= ${4 * a} m` }; },
      () => { const [a, b] = obd(); return { text: `Obrázek lesa má tvar obdélníku ${a} cm a ${b} cm. Jak dlouhý proužek kůry je potřeba na rámeček kolem dokola?`, ans: 2 * (a + b), h1: `Rámeček = obvod: ${a} + ${b} + ${a} + ${b}.`, h2: `= ${2 * (a + b)} cm` }; },
      () => { const a = ri(3, 12); const o = 4 * a; const ok = ri(0, 1) === 0; const tvrz = ok ? o : o + pick([-4, 4, -a, a]); const spravne = tvrz === o; return { text: `Je pravda, že čtverec se stranou ${a} cm má obvod ${tvrz} cm?`, ans: spravne ? 'ANO' : 'NE', h1: `Sečti čtyři strany po ${a} cm.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(4, 12); const [c, d] = obd(); const oC = 4 * a, oO = 2 * (c + d); const rozdil = Math.abs(oC - oO); return { text: `Čtverec má strany po ${a} cm, obdélník strany ${c} cm a ${d} cm. O kolik cm se liší jejich obvody?`, ans: rozdil, h1: `Obvod čtverce: ${oC} cm. Obvod obdélníku: ${oO} cm. Odečti menší od většího.`, h2: `= ${rozdil} cm` }; },
      () => { const a = ri(2, 9); return { text: `Mechový čtvereček má stranu ${a} cm. Mravenec ho obejde přesně jednou dokola. Kolik cm ujde?`, ans: 4 * a, h1: `Cesta dokola = obvod.`, h2: `= ${4 * a} cm` }; },
      () => { const [a, b] = obd(); return { text: `Broučí hřiště je obdélník se stranami ${a} m a ${b} m. Brouk ho oběhne jednou dokola. Kolik metrů uběhne?`, ans: 2 * (a + b), h1: `Jedno kolečko = obvod: sečti všechny strany.`, h2: `= ${2 * (a + b)} m` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'geo' });
    }
    return tasks;
  }

  // 5-3 Úsečky, lomená čára a poznávání rovinných obrazců (3. ročník)
  function gen_5_3() {
    const SHAPES = [['čtverec', 4], ['obdélník', 4], ['trojúhelník', 3], ['šestiúhelník', 6]];
    const tasks = [];
    const T = [
      () => { const a = ri(2, 9), b = ri(2, 9); return { text: `Body A, B, C leží za sebou v jedné řadě. Úsečka AB měří ${a} cm, úsečka BC měří ${b} cm. Jak dlouhá je úsečka AC?`, ans: a + b, h1: `Sečti obě části: ${a} + ${b}.`, h2: `= ${a + b} cm` }; },
      () => { const a = ri(2, 8), c = a + ri(2, 8); return { text: `Body A, B, C leží za sebou v jedné řadě. Celá úsečka AC měří ${c} cm, část AB měří ${a} cm. Kolik měří část BC?`, ans: c - a, h1: `Od celku odečti známou část: ${c} − ${a}.`, h2: `= ${c - a} cm` }; },
      () => { const a = ri(3, 9), n = ri(2, 4); return { text: `Lomená čára má ${n} stejné úseky po ${a} cm. Jaká je její celková délka?`, ans: a * n, h1: `Sečti všechny úseky: ${n} × ${a}.`, h2: `= ${a * n} cm` }; },
      () => { const a = ri(2, 8), b = ri(2, 8), c = ri(2, 8); return { text: `Klikatá stezka broučka má tři úseky: ${a} cm, ${b} cm a ${c} cm. Jak dlouhá je celá lomená čára?`, ans: a + b + c, h1: `Délka lomené čáry = součet úseků.`, h2: `= ${a + b + c} cm` }; },
      () => { const [nm, sides] = SHAPES[ri(0, SHAPES.length - 1)]; return { text: `Kolik stran má ${nm}?`, ans: sides, h1: `Spočítej čáry po obvodu obrazce.`, h2: `= ${sides}` }; },
      () => { const [nm, corners] = SHAPES[ri(0, SHAPES.length - 1)]; return { text: `Kolik vrcholů (rohů) má ${nm}?`, ans: corners, h1: `Vrchol je místo, kde se potkávají dvě strany.`, h2: `= ${corners}` }; },
      () => { const ok = ri(0, 1) === 0; return ok ? { text: `Má kruh nějaký vrchol?`, ans: 'NE', h1: `Kruh je kulatý — nikde se nelámou strany.`, h2: 'NE' } : { text: `Má trojúhelník právě 3 vrcholy?`, ans: 'ANO', h1: `Troj-úhelník = tři úhly, tři vrcholy.`, h2: 'ANO' }; },
      () => { const a = ri(2, 7), mm = ri(1, 9); return { text: `Úsečka měří ${a} cm a ${mm} mm. Kolik je to celkem milimetrů? (1 cm = 10 mm)`, ans: a * 10 + mm, h1: `${a} cm = ${a * 10} mm, přičti ${mm} mm.`, h2: `= ${a * 10 + mm} mm` }; },
      () => { const b = ri(2, 8), a = b + ri(1, 6); return { text: `Úsečka KL měří ${a} cm, úsečka MN měří ${b} cm. O kolik cm je KL delší?`, ans: a - b, h1: `Porovnání délek = odčítání: ${a} − ${b}.`, h2: `= ${a - b} cm` }; },
      () => { const n = ri(2, 5); return { text: `Lomená čára se skládá z ${n} ${skl(n, 'úseku', 'úseků', 'úseků')}. Kolik má vrcholů (počítej i oba konce)?`, ans: n + 1, h1: `Každý úsek přidá jeden vrchol navíc: úseky + 1.`, h2: `= ${n + 1}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'geo' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 6 — JEDNOTKY A ČAS
  // ══════════════════════════════════════════════════════════════

  // 6-1 Jednotky délky (mm, cm, dm, m)
  function gen_6_1() {
    const tasks = [];
    const T = [
      () => { const n = ri(1, 9); return { text: `Kolik cm je ${n} dm? (1 dm = 10 cm)`, ans: n * 10, h1: '1 dm = 10 cm — násob deseti.', h2: `= ${n * 10} cm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik mm je ${n} cm? (1 cm = 10 mm)`, ans: n * 10, h1: '1 cm = 10 mm — násob deseti.', h2: `= ${n * 10} mm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik dm je ${n} m? (1 m = 10 dm)`, ans: n * 10, h1: '1 m = 10 dm — násob deseti.', h2: `= ${n * 10} dm` }; },
      () => { const n = ri(1, 9) * 10; return { text: `Kolik dm je ${n} cm?`, ans: n / 10, h1: 'Děl deseti (10 cm = 1 dm).', h2: `= ${n / 10} dm` }; },
      () => { const n = ri(1, 9) * 10; return { text: `Kolik cm je ${n} mm?`, ans: n / 10, h1: 'Děl deseti (10 mm = 1 cm).', h2: `= ${n / 10} cm` }; },
      () => { const n = ri(1, 9); return { text: `Kolik cm je ${n} m? (1 m = 100 cm)`, ans: n * 100, h1: '1 m = 100 cm — násob stem.', h2: `= ${n * 100} cm` }; },
      () => { const n = ri(2, 9) * 100; return { text: `Kolik m je ${n} cm?`, ans: n / 100, h1: 'Děl stem (100 cm = 1 m).', h2: `= ${n / 100} m` }; },
      () => { const m = ri(1, 5), cm = ri(10, 90); return { text: `Liščí nora je hluboká ${m} m a ${cm} cm. Kolik je to celkem centimetrů?`, ans: m * 100 + cm, h1: `${m} m = ${m * 100} cm, přičti ${cm} cm.`, h2: `= ${m * 100 + cm} cm` }; },
      () => { const dm = ri(2, 9), cm = dm * 10 + pick([-5, 5]); const ok = dm * 10 > cm; return { text: `Co je delší — ${dm} dm, nebo ${cm} cm? Napiš délku té delší v cm.`, ans: ok ? dm * 10 : cm, h1: `Převeď na stejné jednotky: ${dm} dm = ${dm * 10} cm.`, h2: `= ${ok ? dm * 10 : cm} cm` }; },
      () => { const n = ri(2, 9); const ok = ri(0, 1) === 0; const tvrz = ok ? n * 10 : n * 100; const spravne = tvrz === n * 10; return { text: `Je pravda, že ${n} dm = ${tvrz} cm?`, ans: spravne ? 'ANO' : 'NE', h1: `1 dm = 10 cm.`, h2: spravne ? 'ANO' : 'NE' }; },
    ];
    for (let i = 0; i < T.length; i++) {
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
      () => { const n = ri(2, 9) * 1000; return { text: `Kolik kg je ${n} g?`, ans: n / 1000, h1: '1000 g = 1 kg — děl tisícem.', h2: `= ${n / 1000} kg` }; },
      () => { const n = ri(1, 8); return { text: `Kolik minut je ${n} ${skl(n, 'hodina', 'hodiny', 'hodin')}? (1 h = 60 min)`, ans: n * 60, h1: '1 h = 60 min.', h2: `= ${n * 60} min` }; },
      () => { const n = ri(1, 8); return { text: `Kolik sekund je ${n} ${skl(n, 'minuta', 'minuty', 'minut')}? (1 min = 60 s)`, ans: n * 60, h1: '1 min = 60 s.', h2: `= ${n * 60} s` }; },
      () => { const h = ri(1, 4), m = ri(5, 50); return { text: `${h} h ${m} min = kolik minut celkem?`, ans: h * 60 + m, h1: `${h} h = ${h * 60} min, přičti ${m} min.`, h2: `${h * 60} + ${m} = ${h * 60 + m} min` }; },
      () => { const n = ri(2, 9); return { text: `Kolik hodin má ${n} ${skl(n, 'den', 'dny', 'dní')}? (1 den = 24 h)`, ans: n * 24, h1: '1 den = 24 h.', h2: `= ${n * 24} h` }; },
      () => { const druh = pick([['půl hodiny', 30], ['čtvrt hodiny', 15], ['tři čtvrtě hodiny', 45]]); return { text: `Kolik minut je ${druh[0]}?`, ans: druh[1], h1: `Hodina má 60 minut — rozděl ji na čtvrtiny po 15 minutách.`, h2: `= ${druh[1]} min` }; },
      () => { const start = ri(10, 55); const kon = 60; return { text: `Sova se probudila v celou hodinu a ${start} minut. Za kolik minut bude další celá hodina?`, ans: kon - start, h1: `Do celé hodiny zbývá 60 − ${start}.`, h2: `= ${kon - start} min` }; },
      () => { const t = ri(2, 8); return { text: `Kolik dní je ${t} ${skl(t, 'týden', 'týdny', 'týdnů')}? (1 týden = 7 dní)`, ans: t * 7, h1: '1 týden = 7 dní.', h2: `= ${t * 7} dní` }; },
      () => { const g = ri(1100, 1900); const ok = g > 1000; return { text: `Medvídě váží ${g} g. Váží víc než 1 kg?`, ans: ok ? 'ANO' : 'NE', h1: `1 kg = 1000 g — porovnej.`, h2: ok ? 'ANO' : 'NE' }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 6-3 Peníze
  function gen_6_3() {
    const tasks = [];
    const T = [
      () => { const price = ri(8, 60), count = ri(2, 7); return { text: `Jeden perníček stojí ${price} Kč. Kolik zaplatíš za ${count} ${skl(count, 'perníček', 'perníčky', 'perníčků')}?`, ans: price * count, h1: `${price} × ${count}`, h2: `= ${price * count} Kč` }; },
      () => { const total = ri(100, 500), price = ri(20, 90); return { text: `Měl jsi ${total} Kč a koupil sis lucernu za ${price} Kč. Kolik korun ti zbylo?`, ans: total - price, h1: `${total} − ${price}`, h2: `= ${total - price} Kč` }; },
      () => { const a = ri(2, 5), b = ri(2, 5); return { text: `Máš ${a} ${skl(a, 'minci', 'mince', 'mincí')} po 10 Kč a ${b} ${skl(b, 'minci', 'mince', 'mincí')} po 5 Kč. Kolik korun máš celkem?`, ans: a * 10 + b * 5, h1: `${a} × 10 + ${b} × 5 = ${a * 10} + ${b * 5}`, h2: `= ${a * 10 + b * 5} Kč` }; },
      () => { const cena = ri(35, 180); const bank = cena < 100 ? 100 : 200; return { text: `Koupil jsi mapu lesa za ${cena} Kč a platíš ${bank > 100 ? 'dvoustovkou' : 'stovkou'}. Kolik ti prodavač vrátí?`, ans: bank - cena, h1: `${bank} − ${cena}`, h2: `= ${bank - cena} Kč` }; },
      () => { const a = ri(20, 90), b = ri(20, 90); return { text: `Kupuješ píšťalku za ${a} Kč a provázek za ${b} Kč. Kolik zaplatíš dohromady?`, ans: a + b, h1: `${a} + ${b}`, h2: `= ${a + b} Kč` }; },
      () => { const cena = ri(150, 400), ma = cena - ri(20, 120); return { text: `Kouzelný kompas stojí ${cena} Kč. Skřítek má našetřeno ${ma} Kč. Kolik korun mu ještě chybí?`, ans: cena - ma, h1: `${cena} − ${ma}`, h2: `= ${cena - ma} Kč` }; },
      () => { const a = ri(1, 4), b = ri(1, 4), c = ri(1, 4); const sum = a * 20 + b * 10 + c * 5; return { text: `V měšci máš ${a} ${skl(a, 'minci', 'mince', 'mincí')} po 20 Kč, ${b} po 10 Kč a ${c} po 5 Kč. Kolik korun máš?`, ans: sum, h1: `${a} × 20 + ${b} × 10 + ${c} × 5`, h2: `= ${sum} Kč` }; },
      () => { const cena = ri(3, 12) * 20; return { text: `Lucerna stojí ${cena} Kč, dnes je za polovinu. Kolik stojí dnes?`, ans: cena / 2, h1: `Polovina = ${cena} : 2.`, h2: `= ${cena / 2} Kč` }; },
      () => { const kusy = ri(2, 5), cena = ri(15, 45); const bank = 200; const utrata = kusy * cena; return { text: `Koupíš ${kusy} ${skl(kusy, 'svíčku', 'svíčky', 'svíček')} po ${cena} Kč a zaplatíš dvoustovkou. Kolik ti vrátí?`, ans: bank - utrata, h1: `Útrata: ${kusy} × ${cena} = ${utrata} Kč. Vrátí: 200 − ${utrata}.`, h2: `= ${bank - utrata} Kč` }; },
      () => { const ma = ri(50, 250), cena = ri(40, 260); const ok = ma >= cena; return { text: `Máš ${ma} Kč. Stačí ti to na košík borůvek za ${cena} Kč?`, ans: ok ? 'ANO' : 'NE', h1: `Porovnej, co máš, s cenou.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const tydny = ri(2, 6), castka = ri(10, 50); return { text: `Trpaslík si každý týden ušetří ${castka} Kč. Kolik našetří za ${tydny} ${skl(tydny, 'týden', 'týdny', 'týdnů')}?`, ans: tydny * castka, h1: `${tydny} × ${castka}`, h2: `= ${tydny * castka} Kč` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
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
    const T = [
      () => { const a = ri(100, 700), b = ri(50, 250); return { text: `${a} + ${b} = ?`, ans: a + b, h1: `Sečti stovky a zbytek.`, h2: `= ${a + b}` }; },
      () => { const b = ri(50, 300), a = b + ri(100, 500); return { text: `${a} − ${b} = ?`, ans: a - b, h1: `Odečti po skupinách.`, h2: `= ${a - b}` }; },
      () => { const a = ri(2, 9), b = ri(2, 9); return { text: `${a} × ${b} = ?`, ans: a * b, h1: `Z malé násobilky.`, h2: `= ${a * b}` }; },
      () => { const b = ri(2, 9), q = ri(2, 9); return { text: `${b * q} : ${b} = ?`, ans: q, h1: `Jaké číslo × ${b} = ${b * q}?`, h2: `= ${q}` }; },
      () => { const b = ri(100, 400), c = b + ri(100, 450); return { text: `? + ${b} = ${c}`, ans: c - b, h1: `Sčítanec = ${c} − ${b}.`, h2: `= ${c - b}` }; },
      () => { const a = ri(150, 800), b = ri(30, 140); const ok = ri(0, 1) === 0; const tvrz = ok ? a + b : a + b + pick([-10, 10]); const spravne = tvrz === a + b; return { text: `Je pravda, že ${a} + ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Přepočítej si to.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(100, 800), b = ri(20, 150); return { text: `Jaké číslo je o ${b} větší než ${a}?`, ans: a + b, h1: `„O větší" = přičti.`, h2: `= ${a + b}` }; },
      () => { const n = ri(11, 990); const r = Math.round(n / 10) * 10; return { text: `Zaokrouhli ${n} na desítky.`, ans: r, h1: `Rozhodují jednotky: ${n % 10}.`, h2: `= ${r}` }; },
      () => { let a = ri(100, 999), b = ri(100, 999); while (b === a) b = ri(100, 999); return { text: `Které číslo je větší: ${a}, nebo ${b}?`, ans: Math.max(a, b), h1: `Porovnej stovky.`, h2: `= ${Math.max(a, b)}` }; },
      () => { const q = ri(5, 45); return { text: `Jaká je polovina čísla ${q * 2}?`, ans: q, h1: `${q * 2} : 2`, h2: `= ${q}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true, distractors: t.distractors });
    }
    return tasks;
  }

  // 7-2 Násobení a dělení 10, 100
  function gen_7_2() {
    const tasks = [];
    const T = [
      () => { const a = ri(2, 9); return { text: `${a} × 100 = ?`, ans: a * 100, h1: `Přidej dvě nuly.`, h2: `= ${a * 100}` }; },
      () => { const a = ri(2, 9) * 100; return { text: `${a} : 100 = ?`, ans: a / 100, h1: `Uber dvě nuly.`, h2: `= ${a / 100}` }; },
      () => { const a = ri(2, 9) * 10; return { text: `${a} : 10 = ?`, ans: a / 10, h1: `Uber jednu nulu.`, h2: `= ${a / 10}` }; },
      () => { const a = ri(2, 9), b = ri(2, 9) * 10; return { text: `${a} × ${b} = ?`, ans: a * b, h1: `${a} × ${b / 10} = ${a * (b / 10)}, pak přidej nulu.`, h2: `= ${a * b}` }; },
      () => { const a = ri(2, 9); return { text: `${a} × 10 = ?`, ans: a * 10, h1: `Přidej jednu nulu.`, h2: `= ${a * 10}` }; },
      () => { const a = ri(3, 90); return { text: `Jaký je desetinásobek čísla ${a}?`, ans: a * 10, h1: `${a} × 10`, h2: `= ${a * 10}` }; },
      () => { const a = ri(2, 9) * 100; return { text: `Kolik stovek je v čísle ${a}?`, ans: a / 100, h1: `${a} : 100`, h2: `= ${a / 100}` }; },
      () => { const a = ri(2, 9); return { text: `Doplň: ? × 10 = ${a * 10}`, ans: a, h1: `Uber nulu z výsledku.`, h2: `= ${a}` }; },
      () => { const a = ri(2, 9) * 10; return { text: `Kouzelný stroj dělí každé číslo deseti. Co vypadne, když vložíš ${a}?`, ans: a / 10, h1: `${a} : 10`, h2: `= ${a / 10}` }; },
      () => { const a = ri(2, 9); const ok = ri(0, 1) === 0; const tvrz = ok ? a * 100 : a * 10; const spravne = tvrz === a * 100; return { text: `Platí ${a} × 100 = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Stem se násobí přidáním DVOU nul.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(2, 9); return { text: `Skřítek naskládal ${a} ${skl(a, 'krabici', 'krabice', 'krabic')} po 100 žaludech. Kolik žaludů má?`, ans: a * 100, h1: `${a} × 100`, h2: `= ${a * 100}` }; },
      () => { const a = ri(2, 9) * 10; return { text: `${a} světlušek se rozdělí do 10 stejných rojů. Kolik jich bude v jednom roji?`, ans: a / 10, h1: `${a} : 10`, h2: `= ${a / 10}` }; },
      () => { const a = ri(2, 9); return { text: `Kolik desetikorun potřebuješ na zaplacení ${a * 10} Kč?`, ans: a, h1: `${a * 10} : 10`, h2: `= ${a}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 7-3 Finální duel — mix všeho
  function gen_7_3() {
    const tasks = [];
    const T = [
      () => { const a = ri(2, 10), b = ri(2, 10); return { text: `${a} × ${b} = ?`, ans: a * b, h1: `Malá násobilka.`, h2: `= ${a * b}`, skill: 'calc' }; },
      () => { const b = ri(2, 10), q = ri(2, 10); return { text: `${b * q} : ${b} = ?`, ans: q, h1: `${b} × ? = ${b * q}.`, h2: `= ${q}`, skill: 'calc' }; },
      () => { const a = ri(150, 700), b = ri(50, 250); return { text: `${a} + ${b} = ?`, ans: a + b, h1: `Po řádech: stovky, desítky, jednotky.`, h2: `= ${a + b}`, skill: 'calc' }; },
      () => { const b = ri(50, 300), a = b + ri(100, 500); return { text: `${a} − ${b} = ?`, ans: a - b, h1: `Odečti po skupinách.`, h2: `= ${a - b}`, skill: 'calc' }; },
      () => { const n = ri(15, 980); const r = Math.round(n / 10) * 10; return { text: `Zaokrouhli ${n} na desítky.`, ans: r, h1: `Jednotky: ${n % 10}.`, h2: `= ${r}`, skill: 'calc' }; },
      () => { const [a, b, c] = triSides(2, 12); return { text: `Jaký obvod má trojúhelník se stranami ${a} cm, ${b} cm a ${c} cm?`, ans: a + b + c, h1: `Sečti strany: ${a} + ${b} + ${c}.`, h2: `= ${a + b + c} cm`, skill: 'geo' }; },
      () => { const a = ri(2, 12); return { text: `Jaký obvod má čtverec se stranou ${a} cm?`, ans: 4 * a, h1: `Čtyři stejné strany: ${a} + ${a} + ${a} + ${a}.`, h2: `= ${4 * a} cm`, skill: 'geo' }; },
      () => { const d = ri(2, 9), q = ri(2, 9), r = ri(1, d - 1); const n = d * q + r; return { text: `Jaký zbytek má dělení ${n} : ${d}?`, ans: r, h1: `${d} × ${q} = ${d * q}, zbytek ${n} − ${d * q}.`, h2: `zbytek ${r}`, skill: 'calc' }; },
      () => { const n = ri(1, 8); return { text: `Kolik minut je ${n} ${skl(n, 'hodina', 'hodiny', 'hodin')}?`, ans: n * 60, h1: `1 h = 60 min.`, h2: `= ${n * 60} min`, skill: 'calc' }; },
      () => { const cena = ri(30, 90), bank = 100; return { text: `Platíš stovkou za mapu za ${cena} Kč. Kolik ti vrátí?`, ans: bank - cena, h1: `100 − ${cena}`, h2: `= ${bank - cena} Kč`, skill: 'calc' }; },
      () => { const a = ri(100, 700); return { text: `Kolik chybí číslu ${a} do 1000?`, ans: 1000 - a, h1: `Doplň do celé stovky, pak do tisíce.`, h2: `= ${1000 - a}`, skill: 'calc' }; },
      () => { const a = ri(2, 9); return { text: `Jaká je polovina čísla ${a * 2}?`, ans: a, h1: `${a * 2} : 2`, h2: `= ${a}`, skill: 'calc' }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: t.skill });
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
