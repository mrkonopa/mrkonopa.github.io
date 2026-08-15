/* rpg-tasks-5.js — RPG Matematika 5 — rozšiřující banka úloh
   Dračí říše 🐉 | Matematika 5. ročník (velká čísla, písemné × a :, zlomky, desetinná)
   window.RPG_TASK_EXTRA_5 = { '<mid>': ()=>[task,…], … } (21 misí)
   POZOR: MC mise (1-1,1-2,3-1,4-1,7-1) smí mít jen numerické nebo ANO/NE odpovědi.
*/
(function () {
  'use strict';
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const r1 = n => Math.round(n * 10) / 10;
  const r2 = n => Math.round(n * 100) / 100;
  const cz = n => String(n).replace('.', ',');
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const FR = () => pick(['Vypočítej', 'Spočítej', 'Urči', 'Kolik je']); // framing-pool pro dril (nemění odpověď)
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
    const T = [
      () => { const tis = ri(12, 980); return { text: `Jak zapíšeme číslem: ${tis} tisíc?`, ans: tis * 1000, h1: `Za počet tisíců připiš tři nuly.`, h2: `= ${tis * 1000}`, d: (tis * 100 !== tis * 1000 ? [String(tis * 100)] : []) }; }, // miskoncepce: připíše jen dvě nuly (stovky místo tisíců)
      () => { const n = ri(100000, 999999); const dtis = Math.floor(n / 10000) % 10; const tis = Math.floor(n / 1000) % 10; return { text: `Jakou cifru má číslo ${n} na místě desetitisíců?`, ans: dtis, h1: `Řády zprava: J, D, S, tisíce, desetitisíce (5. cifra zprava).`, h2: `= ${dtis}`, d: (tis !== dtis ? [String(tis)] : []) }; }, // miskoncepce: přečte cifru tisíců místo desetitisíců
      () => { const n = ri(100000, 999999); const st = Math.floor(n / 100000); const dtis = Math.floor(n / 10000) % 10; return { text: `Jakou cifru má číslo ${n} na místě statisíců?`, ans: st, h1: `Statisíce jsou šestá cifra zprava (první zleva).`, h2: `= ${st}`, d: (dtis !== st ? [String(dtis)] : []) }; }, // miskoncepce: přečte cifru desetitisíců místo statisíců
      () => { const n = ri(100001, 999998); return { text: `Jaké číslo je o 1 menší než ${n}?`, ans: n - 1, h1: `Odečti jedničku.`, h2: `= ${n - 1}`, d: [String(n + 1)] }; }, // miskoncepce: přičte místo odečte
      () => { const n = ri(100001, 999998); return { text: `Jaké číslo následuje hned po ${n}?`, ans: n + 1, h1: `Přičti jedničku.`, h2: `= ${n + 1}`, d: [String(n - 1)] }; }, // miskoncepce: odečte místo přičte
      () => { const st = ri(1, 9), tis = ri(1, 9), j = ri(1, 9); const n = st * 100000 + tis * 1000 + j; const bezNul = st * 100 + tis * 10 + j; return { text: `Dračí písař zapsal: ${st} statisíců, ${tis} ${skl(tis, 'tisíc', 'tisíce', 'tisíců')} a ${j} ${skl(j, 'jednotka', 'jednotky', 'jednotek')}. Jaké je to číslo?`, ans: n, h1: `Pozor na nuly na prázdných řádech: ${st}0${tis} 00${j}.`, h2: `= ${n}`, d: (bezNul !== n ? [String(bezNul)] : []) }; }, // miskoncepce: slepí cifry bez nul na prázdných řádech
      () => { const m = ri(1, 9); return { text: `Kolik je ${m} ${skl(m, 'milion', 'miliony', 'milionů')}? (zapiš číslem)`, ans: m * 1000000, h1: `Milion má šest nul.`, h2: `= ${m * 1000000}`, d: (m * 100000 !== m * 1000000 ? [String(m * 100000)] : []) }; }, // miskoncepce: jen pět nul (statisíce místo milionu)
      () => { const n = ri(10, 99); return { text: `Zapiš číslem: ${n} tisíc a 40.`, ans: n * 1000 + 40, h1: `${n} tisíc = ${n * 1000}, přičti 40.`, h2: `= ${n * 1000 + 40}`, d: (n * 100 + 40 !== n * 1000 + 40 ? [String(n * 100 + 40)] : []) }; }, // miskoncepce: „tisíc" jako dvě nuly
      () => { const pul = pick([['půl milionu', 500000], ['čtvrt milionu', 250000], ['tři čtvrtě milionu', 750000]]); return { text: `Kolik je ${pul[0]}?`, ans: pul[1], h1: `Milion = 1 000 000, rozděl ho.`, h2: `= ${pul[1]}`, d: [String(pul[1] / 10)] }; }, // miskoncepce: řád vedle (o jednu nulu míň)
      () => { const n = ri(12, 98) * 10000; return { text: `Kolik desetitisíců má číslo ${n}?`, ans: n / 10000, h1: `Odděl poslední čtyři nuly.`, h2: `= ${n / 10000}`, d: (n / 1000 !== n / 10000 ? [String(n / 1000)] : []) }; }, // miskoncepce: oddělí jen tři nuly (počítá tisíce)
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true, distractors: t.d || [] });
    }
    return tasks;
  }

  // 1-2 Porovnávání velkých čísel (MC — ANO/NE i číselná)
  function gen_1_2() {
    const dva = () => { let a = ri(10000, 999999), b = ri(10000, 999999); while (b === a) b = ri(10000, 999999); return [a, b]; };
    const tasks = [];
    const T = [
      () => { const [a, b] = dva(); const op = pick(['<', '>']); const ok = op === '<' ? a < b : a > b; return { text: `Je pravda, že ${a} ${op} ${b}?`, ans: ok ? 'ANO' : 'NE', h1: `Porovnej od nejvyššího řádu.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const [a, b] = dva(); return { text: `Které číslo je větší: ${a}, nebo ${b}?`, ans: Math.max(a, b), h1: `Porovnávej od nejvyššího řádu doleva.`, h2: `= ${Math.max(a, b)}`, d: [String(Math.min(a, b))] }; }, // miskoncepce: vybere menší číslo
      () => { const [a, b] = dva(); return { text: `Které číslo je menší: ${a}, nebo ${b}?`, ans: Math.min(a, b), h1: `Kratší zápis, nebo menší nejvyšší řád.`, h2: `= ${Math.min(a, b)}`, d: [String(Math.max(a, b))] }; }, // miskoncepce: vybere větší číslo
      () => { const s = new Set(); while (s.size < 3) s.add(ri(10000, 999999)); const arr = [...s]; return { text: `Které z čísel ${arr[0]}, ${arr[1]}, ${arr[2]} je největší?`, ans: Math.max(...arr), h1: `Nejdřív porovnej počty cifer, pak zleva.`, h2: `= ${Math.max(...arr)}`, d: [String(Math.min(...arr))] }; }, // miskoncepce: vybere nejmenší
      () => { const s = new Set(); while (s.size < 3) s.add(ri(10000, 999999)); const arr = [...s]; return { text: `Které z čísel ${arr[0]}, ${arr[1]}, ${arr[2]} je nejmenší?`, ans: Math.min(...arr), h1: `Hledej nejmenší nejvyšší řád.`, h2: `= ${Math.min(...arr)}`, d: [String(Math.max(...arr))] }; }, // miskoncepce: vybere největší
      () => { const b = ri(10000, 800000), a = b + ri(1000, 90000); return { text: `O kolik je ${a} větší než ${b}?`, ans: a - b, h1: `Rozdíl: ${a} − ${b}.`, h2: `= ${a - b}`, d: [String(a + b)] }; }, // miskoncepce: sečte místo odečte
      () => { const lo = ri(100000, 700000), hi = lo + ri(20000, 150000); const inside = ri(0, 1) === 0; const x = inside ? ri(lo + 1, hi - 1) : (ri(0, 1) ? ri(10000, lo - 1) : ri(hi + 1, 999999)); const ok = x > lo && x < hi; return { text: `Leží číslo ${x} mezi čísly ${lo} a ${hi}?`, ans: ok ? 'ANO' : 'NE', h1: `Musí být větší než ${lo} a menší než ${hi}.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const a = ri(100, 999); const big = a * 1000, small = a * 100; const ok = ri(0, 1) === 0; return ok ? { text: `Je ${big} desetkrát větší než ${small}?`, ans: 'ANO', h1: `${small} × 10 = ${small * 10}.`, h2: 'ANO' } : { text: `Je ${small} desetkrát větší než ${big}?`, ans: 'NE', h1: `${small} je naopak desetkrát MENŠÍ.`, h2: 'NE' }; },
      () => { const [a, b] = dva(); const ok = a > b; return { text: `Zlatý drak střeží ${a} dukátů, stříbrný ${b}. Střeží zlatý drak víc?`, ans: ok ? 'ANO' : 'NE', h1: `Porovnej obě čísla.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const [a, b] = dva(); const blizsi = Math.abs(a - 500000) < Math.abs(b - 500000) ? a : b; return { text: `Které číslo je blíž k 500 000: ${a}, nebo ${b}?`, ans: blizsi, h1: `Porovnej vzdálenosti od půl milionu.`, h2: `= ${blizsi}`, d: [String(a === blizsi ? b : a)] }; }, // miskoncepce: vybere to vzdálenější
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'anal', mc: true, distractors: t.d || [] });
    }
    return tasks;
  }

  // 1-3 Zaokrouhlování velkých čísel
  function gen_1_3() {
    const tasks = [];
    const T = [
      () => { const n = ri(1200, 998000); const v = Math.round(n / 1000) * 1000; return { text: `Zaokrouhli ${n} na tisíce.`, ans: v, h1: `Dívej se na cifru stovek: ${Math.floor((n % 1000) / 100)}. 0–4 dolů, 5–9 nahoru.`, h2: `= ${v}` }; },
      () => { const n = ri(12000, 980000); const v = Math.round(n / 10000) * 10000; return { text: `Zaokrouhli ${n} na desetitisíce.`, ans: v, h1: `Dívej se na cifru tisíců: ${Math.floor((n % 10000) / 1000)}.`, h2: `= ${v}` }; },
      () => { const n = ri(120000, 950000); const v = Math.round(n / 100000) * 100000; return { text: `Zaokrouhli ${n} na statisíce.`, ans: v, h1: `Dívej se na cifru desetitisíců: ${Math.floor((n % 100000) / 10000)}.`, h2: `= ${v}` }; },
      () => { const n = ri(120000, 980000); const v = Math.round(n / 10000) * 10000; return { text: `Který celý desetitisíc je nejblíž číslu ${n}?`, ans: v, h1: `Zaokrouhli na desetitisíce.`, h2: `= ${v}` }; },
      () => { const n = ri(12000, 980000); const spravne = Math.round(n / 1000) * 1000; const tvrdi = ri(0, 1) ? spravne : spravne + pick([-1000, 1000]); const ok = tvrdi === spravne; return { text: `Dračí účetní tvrdí: „${n} zaokrouhleno na tisíce je ${tvrdi}." Má pravdu?`, ans: ok ? 'ANO' : 'NE', h1: `Rozhodují stovky: ${Math.floor((n % 1000) / 100)}.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const r = ri(2, 98) * 10000; return { text: `Jaké NEJVĚTŠÍ číslo se zaokrouhlí na desetitisíce na ${r}?`, ans: r + 4999, h1: `Poslední, co ještě jde dolů, končí 4999.`, h2: `= ${r + 4999}` }; },
      () => { const r = ri(2, 98) * 10000; return { text: `Jaké NEJMENŠÍ číslo se zaokrouhlí na desetitisíce na ${r}?`, ans: r - 5000, h1: `Od pěti tisíc pod hranicí se zaokrouhluje nahoru.`, h2: `= ${r - 5000}` }; },
      () => { const n = ri(105000, 985000); const dolni = Math.floor(n / 100000) * 100000; return { text: `Mezi kterými dvěma celými statisíci leží ${n}? Napiš ten MENŠÍ.`, ans: dolni, h1: `Nech jen cifru statisíců, zbytek nuly.`, h2: `= ${dolni}` }; },
      () => { const n = ri(120000, 970000); const v = Math.round(n / 1000) * 1000; return { text: pick([`V dračí pokladnici je ${n} dukátů. Kolik je to zhruba — po zaokrouhlení na tisíce?`, `Poklad má ${n} dukátů. Zaokrouhli tento počet na tisíce.`, `Písař napočítal ${n} dukátů. Kolik je to přibližně, zaokrouhleno na tisíce?`]), ans: v, h1: `Zaokrouhli na tisíce.`, h2: `= ${v}` }; },
      () => { const n = ri(12000, 980000); const nahoru = Math.floor((n % 10000) / 1000) >= 5; return { text: `Zaokrouhlí se ${n} na desetitisíce NAHORU?`, ans: nahoru ? 'ANO' : 'NE', h1: `Cifra tisíců je ${Math.floor((n % 10000) / 1000)} — nahoru jde 5–9.`, h2: nahoru ? 'ANO' : 'NE' }; },
      () => { const n = ri(210000, 940000); const v = Math.round(n / 10000) * 10000; return { text: pick([`Drak spočítal ${n} drahokamů. Zaokrouhli jejich počet na desetitisíce.`, `Ve věži je ${n} drahokamů. Kolik je to zhruba — po zaokrouhlení na desetitisíce?`]), ans: v, h1: `Rozhoduje cifra tisíců: ${Math.floor((n % 10000) / 1000)}.`, h2: `= ${v}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 2 — PÍSEMNÉ NÁSOBENÍ
  // ══════════════════════════════════════════════════════════════

  // 2-1 Násobení víceciferné × jednociferné
  function gen_2_1() {
    const tasks = [];
    const T = [
      () => { const a = ri(112, 989), b = ri(3, 9); return { text: `${FR()}: ${a} × ${b} = ?`, ans: a * b, h1: `Násob každou cifru zprava, přenosy přičítej do vyššího řádu.`, h2: `= ${a * b}` }; },
      () => { const a = ri(112, 989), b = ri(3, 9); return { text: `${a} × ? = ${a * b}`, ans: b, h1: `Kolikrát vzít ${a}, aby vyšlo ${a * b}? Zkus ${a * b} : ${a}.`, h2: `= ${b}` }; },
      () => { const a = ri(112, 989), b = ri(3, 9); return { text: `Kolik je ${b}krát ${a}?`, ans: a * b, h1: `${b}krát ${a} = ${a} × ${b}.`, h2: `= ${a * b}` }; },
      () => { const a = ri(1112, 4989), b = ri(2, 5); return { text: `Vypočítej písemně: ${a} × ${b}`, ans: a * b, h1: `Násob po cifrách zprava, s přenosy.`, h2: `= ${a * b}` }; },
      () => { const a = ri(112, 989), b = ri(3, 9); const ok = ri(0, 1) === 0; const tvrz = ok ? a * b : a * b + pick([-10, 10, -100, 100]); const spravne = tvrz === a * b; return { text: `Je pravda, že ${a} × ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Přepočítej písemně nebo odhadem: ${Math.round(a / 100) * 100} × ${b} ≈ ${Math.round(a / 100) * 100 * b}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(120, 480); return { text: `Jaký je trojnásobek čísla ${a}?`, ans: a * 3, h1: `3 × ${a}`, h2: `= ${a * 3}` }; },
      () => { const a = ri(112, 989), b = ri(3, 9); return { text: `Zvětši číslo ${a} ${b}krát.`, ans: a * b, h1: `Zvětšit ${b}krát = násobit: ${a} × ${b}.`, h2: `= ${a * b}` }; },
      () => { const den = ri(115, 350), dnu = ri(4, 9); return { text: pick([`Drak sní ${den} kg masa denně. Kolik kg spořádá za ${dnu} ${skl(dnu, 'den', 'dny', 'dní')}?`, `Drak spořádá každý den ${den} kg masa. Kolik kg to je za ${dnu} ${skl(dnu, 'den', 'dny', 'dní')}?`]), ans: den * dnu, h1: `${den} × ${dnu}`, h2: `= ${den * dnu} kg` }; },
      () => { const a = ri(125, 450), b = ri(3, 8); return { text: pick([`V jedné dračí sluji je ${a} drahokamů. Kolik drahokamů je v ${b} slujích?`, `Každá z ${b} slují ukrývá ${a} drahokamů. Kolik drahokamů je ve všech?`, `Drak schoval do každé z ${b} slují ${a} drahokamů. Kolik drahokamů schoval celkem?`]), ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b}` }; },
      () => { const a = ri(112, 500), b = ri(3, 9); return { text: `Doplň: ? × ${b} = ${a * b}`, ans: a, h1: `Hledaný činitel: ${a * b} : ${b}.`, h2: `= ${a}` }; },
      () => { const cena = ri(115, 260), poc = ri(3, 8); return { text: pick([`Jeden dračí meč stojí ${cena} dukátů. Kolik dukátů dá rytíř za ${poc} ${skl(poc, 'meč', 'meče', 'mečů')}?`, `Kovář prodává meč za ${cena} dukátů. Kolik zaplatí družina za ${poc} ${skl(poc, 'meč', 'meče', 'mečů')}?`]), ans: cena * poc, h1: `${cena} × ${poc}`, h2: `= ${cena * poc} dukátů` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 2-2 Násobení dvojciferným
  function gen_2_2() {
    const tasks = [];
    const T = [
      () => { const a = ri(23, 98), b = ri(12, 49); return { text: `${FR()}: ${a} × ${b} = ?`, ans: a * b, h1: `${a} × ${b % 10} a ${a} × ${Math.floor(b / 10)}0, pak sečti.`, h2: `= ${a * b}` }; },
      () => { const a = ri(23, 98), b = ri(12, 49); return { text: `Kolik je ${a}krát ${b}?`, ans: a * b, h1: `${a}krát ${b} = ${a} × ${b}.`, h2: `= ${a * b}` }; },
      () => { const a = ri(112, 480), b = ri(12, 29); return { text: `Vypočítej písemně: ${a} × ${b}`, ans: a * b, h1: `Rozlož: ${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10}.`, h2: `= ${a * b}` }; },
      () => { const a = ri(12, 45), b = ri(12, 40); return { text: pick([`Rytíř posbíral ${a} mincí v každé z ${b} truhel. Kolik mincí má celkem?`, `V každé z ${b} truhel je ${a} mincí. Kolik mincí je ve všech truhlách?`, `Drak střeží ${b} truhel po ${a} mincích. Kolik mincí střeží dohromady?`]), ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b}` }; },
      () => { const a = ri(15, 60), b = ri(12, 30); return { text: `Jedna dračí šupina váží ${a} g. Kolik váží ${b} šupin?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b} g` }; },
      () => { const a = ri(23, 90), b = ri(12, 40); const ok = ri(0, 1) === 0; const tvrz = ok ? a * b : a * b + pick([-a, a, -10, 10]); const spravne = tvrz === a * b; return { text: `Platí ${a} × ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Odhad: ${Math.round(a / 10) * 10} × ${Math.round(b / 10) * 10} = ${Math.round(a / 10) * 10 * Math.round(b / 10) * 10}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = ri(20, 60); return { text: `Kolik je ${a} × 11?`, ans: a * 11, h1: `${a} × 11 = ${a} × 10 + ${a}.`, h2: `= ${a * 11}` }; },
      () => { const radku = ri(12, 35), mist = ri(14, 40); return { text: pick([`V dračí aréně je ${radku} řad po ${mist} místech. Kolik diváků se vejde?`, `Tribuna arény má ${radku} řad a v každé ${mist} míst. Kolik diváků se sem vejde?`]), ans: radku * mist, h1: `${radku} × ${mist}`, h2: `= ${radku * mist}` }; },
      () => { const a = ri(25, 95), b = ri(12, 45); return { text: `Doplň: ${a} × ? = ${a * b}`, ans: b, h1: `Hledaný činitel: ${a * b} : ${a}.`, h2: `= ${b}` }; },
      () => { const tyden = ri(15, 55), tydnu = ri(12, 30); return { text: pick([`Kovář vyrobí ${tyden} podkov týdně. Kolik podkov vyrobí za ${tydnu} týdnů?`, `Za týden ukove kovář ${tyden} podkov. Kolik jich ukove za ${tydnu} týdnů?`]), ans: tyden * tydnu, h1: `${tyden} × ${tydnu}`, h2: `= ${tyden * tydnu}` }; },
      () => { const a = ri(15, 45), b = ri(12, 28); return { text: pick([`Do každé z ${b} komnat postavili ${a} soch draků. Kolik soch je v hradu celkem?`, `Hrad má ${b} komnat a v každé ${a} soch draků. Kolik soch to je dohromady?`]), ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 2-3 Slovní úlohy násobení
  function gen_2_3() {
    const tasks = [];
    const T = [
      () => { const a = ri(120, 480), b = ri(4, 9); return { text: `Drak střeží ${a} zlatých ${b < 5 ? 've' : 'v'} ${b} ${skl(b, 'jeskyni', 'jeskyních', 'jeskyních')}. Kolik zlatých střeží celkem?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b}` }; },
      () => { const a = ri(15, 60), b = ri(12, 30); return { text: `Jedna dračí šupina váží ${a} g. Kolik váží ${b} šupin?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b} g` }; },
      () => { const a = ri(125, 350), b = ri(6, 9); return { text: pick([`Rytíř ujede ${a} km za den. Kolik ujede za ${b} dní?`, `Posel urazí denně ${a} km. Kolik km urazí za ${b} dní?`, `Družina zvládne za den ${a} km. Kolik km ujede za ${b} dní jízdy?`]), ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b} km` }; },
      () => { const cena = ri(120, 450), kusu = ri(3, 8); return { text: `Kouzelný lektvar stojí ${cena} dukátů. Kolik zaplatí čaroděj za ${kusu} ${skl(kusu, 'lektvar', 'lektvary', 'lektvarů')}?`, ans: cena * kusu, h1: `${cena} × ${kusu}`, h2: `= ${cena * kusu} dukátů` }; },
      () => { const a = ri(140, 400), b = ri(3, 7); return { text: `Věž má ${a} schodů. Strážný ji za den vyjde ${b}krát. Kolik schodů za den vyšlape?`, ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b}` }; },
      () => { const beden = ri(12, 35), v_bedne = ri(15, 48); return { text: pick([`Do hradu přivezli ${beden} beden po ${v_bedne} jablkách. Kolik jablek přivezli?`, `Na hrad dovezli ${beden} beden a v každé bylo ${v_bedne} jablek. Kolik jablek to bylo?`]), ans: beden * v_bedne, h1: `${beden} × ${v_bedne}`, h2: `= ${beden * v_bedne}` }; },
      () => { const a = ri(150, 450), b = ri(3, 6); return { text: `Dračice snesla ${a} vajec. Její sestra ${b}krát víc. Kolik vajec snesla sestra?`, ans: a * b, h1: `„${b}krát víc" = násob: ${a} × ${b}.`, h2: `= ${a * b}` }; },
      () => { const den = ri(12, 30), hodin = ri(14, 24); return { text: `Kovadlina zvoní ${den} úderů za hodinu. Kolik úderů zazní za ${hodin} hodin?`, ans: den * hodin, h1: `${den} × ${hodin}`, h2: `= ${den * hodin}` }; },
      () => { const a = ri(115, 320), b = ri(4, 9), navic = ri(50, 200); return { text: `Drak spálil ${b} ${skl(b, 'vesnici', 'vesnice', 'vesnic')} po ${a} chalupách a ještě ${navic} chalup samostatně. Kolik chalup spálil celkem?`, ans: a * b + navic, h1: `${b} × ${a} = ${a * b}, přičti ${navic}.`, h2: `= ${a * b + navic}` }; },
      () => { const kroku = ri(115, 380), b = ri(3, 8); return { text: `Jedna otočka dračího křídla urazí ${kroku} m. Kolik metrů urazí ${b} ${skl(b, 'otočka', 'otočky', 'otoček')}?`, ans: kroku * b, h1: `${kroku} × ${b}`, h2: `= ${kroku * b} m` }; },
    ];
    for (let i = 0; i < T.length; i++) { const t = T[i % T.length](); tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' }); }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 3 — PÍSEMNÉ DĚLENÍ
  // ══════════════════════════════════════════════════════════════

  // 3-1 Dělení jednociferným, beze zbytku (MC — číselná)
  function gen_3_1() {
    const tasks = [];
    const T = [
      () => { const b = ri(3, 9), q = ri(23, 142); return { text: `${FR()}: ${b * q} : ${b} = ?`, ans: q, h1: `Děl postupně zleva: kolikrát se ${b} vejde do prvních cifer.`, h2: `= ${q}`, d: [String(q * 10)] }; }, // miskoncepce: chyba o řád v podílu (nula navíc)
      () => { const b = ri(3, 9), q = ri(23, 142); return { text: `Kolikrát se ${b} vejde do ${b * q}?`, ans: q, h1: `To je ${b * q} : ${b}.`, h2: `= ${q}`, d: [String(q * 10)] }; }, // miskoncepce: chyba o řád v podílu
      () => { const b = ri(3, 9), q = ri(23, 142); return { text: `? : ${b} = ${q}`, ans: b * q, h1: `Hledané číslo: ${b} × ${q}.`, h2: `= ${b * q}`, d: [String(b + q)] }; }, // miskoncepce: sečte místo vynásobí
      () => { const b = ri(3, 9), q = ri(23, 120); return { text: `${b * q} : ? = ${q}`, ans: b, h1: `Čím dělit ${b * q}, aby vyšlo ${q}? Zkus ${b * q} : ${q}.`, h2: `= ${b}`, d: [String(q)] }; }, // miskoncepce: zamění dělitele a podíl
      () => { const q = ri(56, 480); return { text: `Jaká je polovina čísla ${q * 2}?`, ans: q, h1: `${q * 2} : 2`, h2: `= ${q}`, d: [String(q * 2)] }; }, // miskoncepce: zapomene vydělit dvěma
      () => { const q = ri(26, 240); return { text: `Jaká je čtvrtina čísla ${q * 4}?`, ans: q, h1: `${q * 4} : 4`, h2: `= ${q}`, d: [String(q * 2)] }; }, // miskoncepce: udělá polovinu místo čtvrtiny
      () => { const b = ri(3, 9), q = ri(23, 130); const ok = ri(0, 1) === 0; const tvrz = ok ? q : q + pick([-1, 1, 10]); const spravne = tvrz === q; return { text: `Platí ${b * q} : ${b} = ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Zkouška: ${b} × ${tvrz} = ${b * tvrz}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const k = ri(3, 9), a = ri(25, 120); return { text: `Kolikrát je číslo ${a} menší než ${a * k}?`, ans: k, h1: `${a * k} : ${a}`, h2: `= ${k}`, d: [String(a * (k - 1))] }; }, // miskoncepce: „kolikrát" zamění za „o kolik" (rozdíl místo podílu)
      () => { const b = ri(3, 8), q = ri(30, 120); return { text: `Zmenši číslo ${b * q} ${b}krát.`, ans: q, h1: `Zmenšit ${b}krát = dělit: ${b * q} : ${b}.`, h2: `= ${q}`, d: [String(b * q - b)] }; }, // miskoncepce: „zmenši ×krát" zamění za „zmenši o" (odečte)
      () => { const q = ri(25, 95) * 10; return { text: `Vyděl desítkou: ${q} : 10`, ans: q / 10, h1: `Dělení deseti → škrtni nulu.`, h2: `= ${q / 10}`, d: [String(q * 10)] }; }, // miskoncepce: záměna : 10 za × 10
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true, distractors: t.d || [] });
    }
    return tasks;
  }

  // 3-2 Dělení se zbytkem
  function gen_3_2() {
    const nz = () => { const b = ri(3, 9), q = ri(20, 130), r = ri(1, b - 1); return { b, q, r, n: b * q + r }; };
    const tasks = [];
    const T = [
      () => { const { b, q, r, n } = nz(); return { text: `${n} : ${b} = ? (napiš jen zbytek)`, ans: r, h1: `Největší násobek ${b}: ${b} × ${q} = ${b * q}. Zbytek = ${n} − ${b * q}.`, h2: `zbytek = ${r}` }; },
      () => { const { b, q, n } = nz(); return { text: `${n} : ${b} = ? (napiš jen celý podíl, bez zbytku)`, ans: q, h1: `${b} × ${q} = ${b * q} se ještě vejde, ${b} × ${q + 1} už ne.`, h2: `podíl = ${q}` }; },
      () => { const { b, q, r, n } = nz(); return { text: `Doplň: ${n} = ${b} × ? + ${r}`, ans: q, h1: `Kolikrát se ${b} vejde do ${n - r}?`, h2: `= ${q}` }; },
      () => { const { b, q, n } = nz(); return { text: `Jaký je největší násobek čísla ${b}, který je menší než ${n}?`, ans: b * q, h1: `Vyděl ${n} : ${b} a podíl vynásob zpět.`, h2: `= ${b * q}` }; },
      () => { const b = ri(3, 9), n = ri(50, 900); const deli = n % b === 0; return { text: `Je číslo ${n} dělitelné číslem ${b} beze zbytku?`, ans: deli ? 'ANO' : 'NE', h1: `Vyděl a sleduj, jestli zbyde nula.`, h2: deli ? 'ANO' : 'NE' }; },
      () => { const { b, r, n } = nz(); return { text: pick([`Rytířů je ${n} a stoly jsou po ${b}. Kolik rytířů zůstane u nezaplněného stolu?`, `Do hodovní síně přišlo ${n} rytířů a ke stolu se jich vejde ${b}. Kolik rytířů zbyde u posledního, neúplného stolu?`]), ans: r, h1: `Zbytek po dělení ${n} : ${b}.`, h2: `= ${r}` }; },
      () => { const { b, q, n } = nz(); return { text: `Do jedné klece se vejde ${b} ${skl(b, 'drak', 'draci', 'draků')}. Kolik klecí ÚPLNĚ zaplní ${n} draků?`, ans: q, h1: `Celé klece = celý podíl ${n} : ${b}.`, h2: `= ${q}` }; },
      () => { const { b, q, n } = nz(); return { text: `Kolik klecí po ${b} dracích je potřeba pro VŠECH ${n} draků?`, ans: q + 1, h1: `${q} plných klecí + 1 pro zbytek.`, h2: `= ${q + 1}` }; },
      () => { const { b, r, n } = nz(); return { text: `Kolik dukátů chybí číslu ${n}, aby bylo dělitelné ${b} beze zbytku (směrem nahoru)?`, ans: b - r, h1: `Zbytek je ${r}, chybí ${b} − ${r}.`, h2: `= ${b - r}` }; },
      () => { const q2 = ri(15, 60), r2x = ri(1, 6), n = q2 * 7 + r2x; return { text: pick([`Obléhání trvá ${n} dní. Kolik je to CELÝCH týdnů?`, `Dračí spánek trval ${n} dní. Kolik CELÝCH týdnů drak prospal?`]), ans: q2, h1: `Kolikrát se 7 vejde do ${n}?`, h2: `= ${q2}` }; },
      () => { const { b, q, r, n } = nz(); return { text: pick([`${n} drahokamů se ukládá do měšců po ${b}. Kolik drahokamů zbyde na poslední, neúplný měšec?`, `Čaroděj třídí ${n} drahokamů do hromádek po ${b}. Kolik drahokamů mu zbyde stranou?`]), ans: r, h1: `Zbytek po dělení ${n} : ${b}.`, h2: `= ${r}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 3-3 Slovní úlohy dělení
  function gen_3_3() {
    const tasks = [];
    const T = [
      () => { const b = ri(4, 8), q = ri(40, 120); return { text: pick([`${b * q} zlatých rozdělíme rovným dílem ${b} rytířům. Kolik dostane každý?`, `Král rozdělil ${b * q} zlatých ${b} rytířům stejným dílem. Kolik připadne na jednoho?`, `${b * q} zlatých se má rovným dílem rozdělit mezi ${b} ${skl(b, 'rytíře', 'rytíře', 'rytířů')}. Kolik dostane každý?`]), ans: q, h1: `${b * q} : ${b}`, h2: `= ${q}` }; },
      () => { const b = ri(3, 7), q = ri(30, 90); return { text: `Dračice snesla ${b * q} vajec do ${b} hnízd stejně. Kolik vajec je v jednom hnízdě?`, ans: q, h1: `${b * q} : ${b}`, h2: `= ${q}` }; },
      () => { const per = ri(6, 12), groups = ri(8, 20); return { text: `${per * groups} kusů zlata uložíme po ${per} do truhel. Kolik truhel potřebujeme?`, ans: groups, h1: `${per * groups} : ${per}`, h2: `= ${groups}` }; },
      () => { const b = ri(3, 8), q = ri(25, 90); return { text: `Hradní kuchař upekl ${b * q} koláčů pro ${b} ${skl(b,'stůl','stoly','stolů')}. Kolik koláčů dostane každý stůl?`, ans: q, h1: `${b * q} : ${b}`, h2: `= ${q}` }; },
      () => { const cena = ri(6, 12), penize = cena * ri(15, 60); return { text: `Jeden šíp stojí ${cena} dukátů. Kolik šípů koupí lučištník za ${penize} dukátů?`, ans: penize / cena, h1: `${penize} : ${cena}`, h2: `= ${penize / cena}` }; },
      () => { const b = ri(4, 9), q = ri(20, 80); return { text: pick([`Karavana urazila ${b * q} km za ${b} ${skl(b, 'den', 'dny', 'dní')}, každý den stejně. Kolik km ušla za den?`, `Poutníci ušli ${b * q} km za ${b} ${skl(b, 'den', 'dny', 'dní')} a každý den stejně. Kolik km zvládli denně?`]), ans: q, h1: `${b * q} : ${b}`, h2: `= ${q} km` }; },
      () => { const delka = ri(5, 9), q = ri(12, 40); return { text: `Řetěz dlouhý ${delka * q} m rozsekáme na kusy po ${delka} m. Kolik kusů vznikne?`, ans: q, h1: `${delka * q} : ${delka}`, h2: `= ${q}` }; },
      () => { const b = ri(3, 7), q = ri(30, 90), r = ri(1, b - 1); const n = b * q + r; return { text: `${n} drahokamů se dělí rovným dílem mezi ${b} ${skl(b, 'čaroděje', 'čaroděje', 'čarodějů')}. Kolik drahokamů zbyde?`, ans: r, h1: `${b} × ${q} = ${b * q}, zbytek ${n} − ${b * q}.`, h2: `zbyde ${r}` }; },
      () => { const lidi = ri(3, 8), celkem = lidi * ri(40, 150); return { text: `${celkem} dukátů žoldu se dělí rovným dílem mezi ${lidi} ${skl(lidi, 'strážného', 'strážné', 'strážných')}. Kolik dostane jeden?`, ans: celkem / lidi, h1: `${celkem} : ${lidi}`, h2: `= ${celkem / lidi}` }; },
      () => { const q = ri(30, 120), b = ri(3, 8); return { text: `Král rozdal ${b * q} bochníků chleba. Každá rodina dostala ${b} bochníků. Kolik rodin obdaroval?`, ans: q, h1: `${b * q} : ${b}`, h2: `= ${q}` }; },
    ];
    for (let i = 0; i < T.length; i++) { const t = T[i % T.length](); tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' }); }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 4 — ZLOMKY
  // ══════════════════════════════════════════════════════════════

  // 4-1 Zlomek z čísla (MC — číselná)
  function gen_4_1() {
    const tasks = [];
    const DTIN = { 2: 'polovina', 3: 'třetina', 4: 'čtvrtina', 5: 'pětina', 6: 'šestina', 8: 'osmina', 10: 'desetina' };
    const DENS = [2, 3, 4, 5, 6, 8, 10];
    const T = [
      () => { const den = pick(DENS), whole = den * ri(2, 9), num = ri(1, den - 1); return { text: `Kolik je ${num}/${den} z čísla ${whole}?`, ans: (whole / den) * num, h1: `Nejdřív ${whole} : ${den} = ${whole / den}, pak × ${num}.`, h2: `= ${(whole / den) * num}`, d: [String(whole * num)] }; }, // miskoncepce: vynásobí čitatelem, ale zapomene vydělit jmenovatelem
      () => { const den = pick(DENS), whole = den * ri(2, 9); return { text: `Kolik je ${DTIN[den]} z čísla ${whole}?`, ans: whole / den, h1: `${DTIN[den]} znamená : ${den}.`, h2: `= ${whole / den}`, d: [String(whole * den)] }; }, // miskoncepce: násobí místo dělí
      () => { const den = pick([2, 4, 5, 10]), whole = den * ri(10, 60); return { text: `Drak spí ${DTIN[den].slice(0, -1)}u dne. Kolik hodin spí, když den má 24 hodin?`, ans: den === 2 ? 12 : den === 4 ? 6 : den === 5 ? Math.round(24 / 5 * 10) / 10 : 2.4, h1: `24 : ${den}`, h2: `= ${cz(Math.round(24 / den * 10) / 10)} h`, d: [String(24 * den)] }; }, // miskoncepce: násobí 24 jmenovatelem místo dělení
      () => { const den = pick([2, 3, 4, 5]), cast = ri(3, 12); return { text: `Jedna ${DTIN[den]} pokladu je ${cast} ${skl(cast, 'dukát', 'dukáty', 'dukátů')}. Kolik dukátů má CELÝ poklad?`, ans: cast * den, h1: `Celek = část × ${den}.`, h2: `= ${cast * den}`, d: [String(cast)] }; }, // miskoncepce: napíše část jako celek (nezvětší)
      () => { const den = pick([4, 5, 6, 8]), num = ri(1, den - 1); return { text: `Kolik ${den === 4 ? 'čtvrtin' : den === 5 ? 'pětin' : den === 6 ? 'šestin' : 'osmin'} chybí zlomku ${num}/${den} do celku?`, ans: den - num, h1: `Celek = ${den}/${den}.`, h2: `= ${den - num}`, d: [String(den)] }; }, // miskoncepce: napíše celý jmenovatel místo doplňku
      () => { const den = pick(DENS), whole = den * ri(2, 9), num = ri(1, den - 1); const cast = (whole / den) * num; return { text: `Rytíř snědl ${num}/${den} z ${whole} koláčů. Kolik koláčů mu ZBYLO?`, ans: whole - cast, h1: `Snědl ${cast}, zbylo ${whole} − ${cast}.`, h2: `= ${whole - cast}`, d: (cast !== whole - cast ? [String(cast)] : []) }; }, // miskoncepce: spočítá snědené místo zbylých
      () => { const a = ri(1, 5), b = ri(1, 5); const den = pick([6, 8, 10, 12]); const ok = a === b; return ok ? { text: `Platí ${a}/${den} = ${b}/${den}?`, ans: 'ANO', h1: `Stejný jmenovatel i čitatel.`, h2: 'ANO' } : { text: `Je ${Math.max(a, b)}/${den} větší než ${Math.min(a, b)}/${den}?`, ans: 'ANO', h1: `Při stejném jmenovateli rozhoduje čitatel.`, h2: 'ANO' }; },
      () => { const den = pick([3, 4, 5]), whole = den * ri(4, 12); const ok = ri(0, 1) === 0; const tvrz = ok ? whole / den : whole / den + pick([-2, 2, den]); const spravne = tvrz === whole / den; return { text: `Čaroděj tvrdí: 1/${den} z ${whole} je ${tvrz}. Má pravdu?`, ans: spravne ? 'ANO' : 'NE', h1: `${whole} : ${den} = ${whole / den}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const half = ri(6, 40) * 2; return { text: `Polovina dračího hejna má ${half / 2} draků. Kolik draků má celé hejno?`, ans: half, h1: `Celek = polovina × 2.`, h2: `= ${half}`, d: [String(half / 2)] }; }, // miskoncepce: napíše polovinu místo celku (nezdvojnásobí)
      () => { const den = pick([2, 4]), km = den * ri(5, 30); return { text: `Cesta k jeskyni měří ${km} km. Rytíř ušel ${den === 2 ? 'polovinu' : 'čtvrtinu'}. Kolik km ušel?`, ans: km / den, h1: `${km} : ${den}`, h2: `= ${km / den} km`, d: [String(km * den)] }; }, // miskoncepce: násobí místo dělí
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true, distractors: t.d || [] });
    }
    return tasks;
  }

  // 4-2 Sčítání a odčítání zlomků (stejný jmenovatel) — čitatel výsledku
  function gen_4_2() {
    const DENS = [4, 5, 6, 7, 8, 9, 10];
    const tasks = [];
    const T = [
      () => { const den = pick(DENS), a = ri(1, den - 2), b = ri(1, den - 1 - a); return { text: `${a}/${den} + ${b}/${den} = ?/${den}\n(napiš jen čitatele výsledku)`, ans: a + b, h1: `Jmenovatel zůstává ${den}, sečti čitatele: ${a} + ${b}.`, h2: `čitatel = ${a + b}` }; },
      () => { const den = pick(DENS), a = ri(1, den - 2), b = ri(1, den - 1 - a); const big = a + b; return { text: `${big}/${den} − ${a}/${den} = ?/${den}\n(napiš jen čitatele výsledku)`, ans: b, h1: `Jmenovatel zůstává ${den}, odečti čitatele: ${big} − ${a}.`, h2: `čitatel = ${b}` }; },
      () => { const den = pick(DENS), a = ri(1, den - 2); return { text: `${a}/${den} + ?/${den} = ${den}/${den} (celek). Jaký čitatel chybí?`, ans: den - a, h1: `${den} − ${a}`, h2: `= ${den - a}` }; },
      () => { const den = pick(DENS), a = ri(1, den - 2), b = ri(1, den - 1 - a); return { text: `Doplň čitatele: ${a}/${den} + ?/${den} = ${a + b}/${den}`, ans: b, h1: `${a + b} − ${a}`, h2: `= ${b}` }; },
      () => { const den = pick([6, 8, 10]), a = ri(1, den / 2 - 1), b = ri(1, den / 2 - 1); const ok = a + b === den / 2; const tvrz = ok ? 'polovinu' : 'polovinu'; const spravne = a + b === den / 2; return { text: `Dají ${a}/${den} + ${b}/${den} dohromady přesně polovinu?`, ans: spravne ? 'ANO' : 'NE', h1: `Polovina = ${den / 2}/${den}. Součet čitatelů: ${a + b}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const den = pick(DENS), a = ri(2, den - 1), b = ri(1, a - 1); return { text: pick([`Drak snědl ${a}/${den} stáda, vlk ${b}/${den}. Rozdíl je ?/${den}\n(napiš jen čitatele rozdílu)`, `Drak spořádal ${a}/${den} pokladu a čaroděj ${b}/${den}. O kolik ${den}-tin snědl drak víc? (napiš jen čitatele)`]), ans: a - b, h1: `${a} − ${b}`, h2: `= ${a - b}` }; },
      () => { const den = pick(DENS); const a = ri(1, den - 2), b = ri(1, den - 1 - a); return { text: pick([`Kouzelník vypil ${a}/${den} lektvaru ráno a ${b}/${den} večer. Celkem vypil ?/${den}\n(napiš jen čitatele)`, `Čaroděj upil ${a}/${den} lektvaru a pak ještě ${b}/${den}. Kolik ${den}-tin vypil celkem? (napiš jen čitatele)`]), ans: a + b, h1: `Sečti čitatele: ${a} + ${b}.`, h2: `= ${a + b}` }; },
      () => { const den = pick(DENS), a = ri(1, den - 1); const ok = ri(0, 1) === 0; const tvrz = ok ? den - a : den - a + pick([-1, 1]); const spravne = tvrz === den - a; return { text: `Platí ${a}/${den} + ${tvrz}/${den} = 1 (celek)?`, ans: spravne ? 'ANO' : 'NE', h1: `Celek je ${den}/${den}: ${a} + ${tvrz} = ${a + tvrz}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const den = pick([5, 6, 8, 10]); const c = ri(3, den + 3); const a = ri(1, c - 2), b = c - a; return { text: `${a}/${den} + ${b}/${den} + ?/${den} = ${c + 2}/${den} — jaký čitatel chybí?`, ans: 2, h1: `${c + 2} − ${a} − ${b}`, h2: `= 2` }; },
      () => { const den = pick(DENS), a = ri(1, den - 1); let b = ri(1, den - 1); while (b === a) b = ri(1, den - 1); return { text: `Který zlomek je větší: ${a}/${den}, nebo ${b}/${den}? Napiš jeho čitatele.`, ans: Math.max(a, b), h1: `Při stejném jmenovateli rozhoduje čitatel.`, h2: `= ${Math.max(a, b)}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 4-3 Slovní úlohy se zlomky
  function gen_4_3() {
    const tasks = [];
    const T = [
      () => { const den = pick([2, 3, 4, 5]), whole = den * ri(4, 9), num = ri(1, den - 1); return { text: `Ve třídě je ${whole} žáků. ${num}/${den} z nich jsou dívky. Kolik je dívek?`, ans: (whole / den) * num, h1: `${whole} : ${den} × ${num}`, h2: `= ${(whole / den) * num}` }; },
      () => { const den = pick([4, 5, 6]), whole = den * ri(3, 8); return { text: `Drak měl ${whole} mincí. Utratil 1/${den} z nich. Kolik mincí utratil?`, ans: whole / den, h1: `${whole} : ${den}`, h2: `= ${whole / den}` }; },
      () => { const den = pick([2, 4, 5, 10]), whole = den * ri(4, 9), num = ri(1, den - 1); return { text: pick([`Cesta měří ${whole} km. Rytíř ujel ${num}/${den} cesty. Kolik km ujel?`, `K dračí sluji je to ${whole} km. Rytíř má za sebou ${num}/${den} cesty. Kolik km už ujel?`, `Výprava měří ${whole} km. Družina prošla ${num}/${den} cesty. Kolik km ušla?`]), ans: (whole / den) * num, h1: `${whole} : ${den} × ${num}`, h2: `= ${(whole / den) * num} km` }; },
      () => { const den = pick([3, 4, 5]), whole = den * ri(4, 10), num = ri(1, den - 1); const ujedeno = (whole / den) * num; return { text: `Výprava má před sebou ${whole} km. Už ušla ${num}/${den}. Kolik km jí ZBÝVÁ?`, ans: whole - ujedeno, h1: `Ušla ${ujedeno} km, zbývá ${whole} − ${ujedeno}.`, h2: `= ${whole - ujedeno} km` }; },
      () => { const den = pick([2, 3, 4]), cast = ri(5, 20); return { text: pick([`1/${den} dračího pokladu je ${cast} rubínů. Kolik rubínů má celý poklad?`, `Jedna ${den === 2 ? 'polovina' : den === 3 ? 'třetina' : 'čtvrtina'} pokladu je ${cast} rubínů. Kolik rubínů je v celém pokladu?`]), ans: cast * den, h1: `Celek = ${cast} × ${den}.`, h2: `= ${cast * den}` }; },
      () => { const den = pick([4, 5, 8]), whole = den * ri(3, 8); return { text: `Kuchař rozkrájel ${whole} jablek. Do koláče dal 1/${den}. Kolik jablek dal do koláče?`, ans: whole / den, h1: `${whole} : ${den}`, h2: `= ${whole / den}` }; },
      () => { const whole = ri(3, 10) * 4; return { text: `Rytíř prospal čtvrtinu z ${whole} hodin výpravy. Kolik hodin spal?`, ans: whole / 4, h1: `${whole} : 4`, h2: `= ${whole / 4} h` }; },
      () => { const den = pick([2, 3, 5]), whole = den * ri(6, 15), num = ri(1, den - 1); return { text: `Hradní studna pojme ${whole} věder vody. Je naplněná z ${num}/${den}. Kolik věder je ve studni?`, ans: (whole / den) * num, h1: `${whole} : ${den} × ${num}`, h2: `= ${(whole / den) * num}` }; },
      () => { const polovina = ri(8, 40) * 2; return { text: `Polovinu úlovku, tedy ${polovina / 2} ryb, dostal drak. Kolik ryb měl celý úlovek?`, ans: polovina, h1: `Polovina × 2.`, h2: `= ${polovina}` }; },
      () => { const den = pick([3, 4, 6]), whole = den * ri(4, 9), num = den - 1; return { text: `Z ${whole} šípů se jich při bitvě ${num}/${den} zlomilo. Kolik šípů zůstalo celých?`, ans: whole / den, h1: `Celých zůstala 1/${den}: ${whole} : ${den}.`, h2: `= ${whole / den}` }; },
    ];
    for (let i = 0; i < T.length; i++) { const t = T[i % T.length](); tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' }); }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 5 — DESETINNÁ ČÍSLA
  // ══════════════════════════════════════════════════════════════

  // 5-1 Porovnávání desetinných čísel (MC — ANO/NE)
  function gen_5_1() {
    const dvojice = () => { const a = r2(ri(10, 99) / 10); let b = r2(ri(10, 99) / 10); while (b === a) b = r2(ri(10, 99) / 10); return [a, b]; };
    const tasks = [];
    const T = [
      () => { const [a, b] = dvojice(); const op = pick(['<', '>']); const ok = op === '<' ? a < b : a > b; return { text: `Je pravda, že ${cz(a)} ${op} ${cz(b)}?`, ans: ok ? 'ANO' : 'NE', h1: `Porovnej nejdřív celou část, pak desetiny.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const cela = ri(2, 9); const a = r1(cela + ri(1, 9) / 10); const ok = a > cela; return { text: `Je ${cz(a)} větší než ${cela}?`, ans: ok ? 'ANO' : 'NE', h1: `${cz(a)} má za čárkou ještě desetiny navíc.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const a = ri(2, 9); const stejne = ri(0, 1) === 0; const b = stejne ? a : r1(a + pick([-0.5, 0.5, 0.1, -0.1])); const ok = a === b; return { text: `Platí ${cz(a)} = ${cz(b)}?`, ans: ok ? 'ANO' : 'NE', h1: `Celé číslo ${a} = ${a},0.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const des = ri(1, 9); const a = r1(ri(2, 9) + des / 10); const ok = ri(0, 1) === 0; const tvrz = ok ? des : (des % 9) + 1; const spravne = tvrz === des; return { text: `Má číslo ${cz(a)} na místě desetin cifru ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Desetiny jsou první cifra za čárkou.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = r1(ri(15, 85) / 10); const okolo = Math.round(a); const ok = ri(0, 1) === 0; const tvrz = ok ? okolo : okolo + pick([-1, 1]); const spravne = tvrz === okolo; return { text: `Zaokrouhlí se ${cz(a)} na celé číslo ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Rozhodují desetiny: ${Math.round((a % 1) * 10)}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const [a, b] = dvojice(); const ok = a < b; return { text: `Dračí vejce váží ${cz(a)} kg, orlí ${cz(b)} kg. Je dračí lehčí?`, ans: ok ? 'ANO' : 'NE', h1: `Lehčí = menší číslo.`, h2: ok ? 'ANO' : 'NE' }; },
      () => { const a = r1(ri(20, 90) / 10); const ok = ri(0, 1) === 0; return ok ? { text: `Leží číslo ${cz(a)} mezi ${Math.floor(a)} a ${Math.floor(a) + 1}?`, ans: 'ANO', h1: `Celá část je ${Math.floor(a)}.`, h2: 'ANO' } : { text: `Leží číslo ${cz(a)} mezi ${Math.floor(a) + 2} a ${Math.floor(a) + 3}?`, ans: 'NE', h1: `Celá část ${cz(a)} je ${Math.floor(a)}.`, h2: 'NE' }; },
      () => { const d = ri(1, 4); const a = r1(ri(3, 8) + d / 10); const b = r1(a + 0.5); const ok = b > a; return { text: `Je ${cz(b)} větší než ${cz(a)}?`, ans: 'ANO', h1: `Stejné celé části, porovnej desetiny: ${Math.round((b % 1) * 10)} > ${Math.round((a % 1) * 10)}.`, h2: 'ANO' }; },
      () => { const x = pick([[r1(0.5), 'polovina', true], [r2(0.25), 'čtvrtina', true], [r1(0.2), 'pětina', true]]); return { text: `Je ${cz(x[0])} totéž co jedna ${x[1]}?`, ans: 'ANO', h1: `1 : ${x[1] === 'polovina' ? 2 : x[1] === 'čtvrtina' ? 4 : 5} = ${cz(x[0])}.`, h2: 'ANO' }; },
      () => { const s = new Set(); while (s.size < 3) s.add(r1(ri(10, 99) / 10)); const arr = [...s]; const kandidat = pick(arr); const ok = kandidat === Math.max(...arr); return { text: `Je ${cz(kandidat)} největší z čísel ${cz(arr[0])}; ${cz(arr[1])} a ${cz(arr[2])}?`, ans: ok ? 'ANO' : 'NE', h1: `Porovnej celé části, pak desetiny.`, h2: ok ? 'ANO' : 'NE' }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'anal', mc: true });
    }
    return tasks;
  }

  // 5-2 Sčítání a odčítání desetinných čísel
  function gen_5_2() {
    const par = () => [r1(ri(15, 95) / 10), r1(ri(11, 89) / 10)];
    const tasks = [];
    const T = [
      () => { const [a, b] = par(); const v = r1(a + b); return { text: `${FR()}: ${cz(a)} + ${cz(b)} = ?`, ans: v, h1: `Sčítej pod sebou, desetinnou čárku pod čárku.`, h2: `= ${cz(v)}` }; },
      () => { const [a, b] = par(); const big = Math.max(a, b), small = Math.min(a, b); const v = r1(big - small); return { text: `${FR()}: ${cz(big)} − ${cz(small)} = ?`, ans: v, h1: `Odečítej pod sebou, čárku pod čárku.`, h2: `= ${cz(v)}` }; },
      () => { const [a, b] = par(); const v = r1(a + b); return { text: `${cz(a)} + ? = ${cz(v)}`, ans: b, h1: `Chybějící sčítanec: ${cz(v)} − ${cz(a)}.`, h2: `= ${cz(b)}` }; },
      () => { const a = r1(ri(15, 85) / 10); const v = r1(10 - a); return { text: `Kolik chybí číslu ${cz(a)} do 10?`, ans: v, h1: `10 − ${cz(a)}`, h2: `= ${cz(v)}` }; },
      () => { const [a, b] = par(); const v = r1(a + b); return { text: `Zvětši číslo ${cz(a)} o ${cz(b)}.`, ans: v, h1: `Zvětšit o = přičíst.`, h2: `= ${cz(v)}` }; },
      () => { const a = r1(ri(40, 95) / 10), b = r1(ri(11, 35) / 10); const v = r1(a - b); return { text: `Zmenši číslo ${cz(a)} o ${cz(b)}.`, ans: v, h1: `Zmenšit o = odečíst.`, h2: `= ${cz(v)}` }; },
      () => { const a = r1(ri(12, 40) / 10), b = r1(ri(12, 40) / 10), c = r1(ri(12, 40) / 10); const v = r1(a + b + c); return { text: `${FR()}: ${cz(a)} + ${cz(b)} + ${cz(c)} = ?`, ans: v, h1: `Sečti postupně, čárky pod sebe.`, h2: `= ${cz(v)}` }; },
      () => { const [a, b] = par(); const v = r1(a + b); const ok = ri(0, 1) === 0; const tvrz = ok ? v : r1(v + pick([-0.1, 0.1, -1, 1])); const spravne = tvrz === v; return { text: `Je pravda, že ${cz(a)} + ${cz(b)} = ${cz(tvrz)}?`, ans: spravne ? 'ANO' : 'NE', h1: `Sečti pod sebou, čárka pod čárku.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const a = r1(ri(15, 60) / 10), b = r1(ri(15, 60) / 10); const v = r1(a + b); return { text: pick([`Lektvar vznikne smícháním ${cz(a)} l vody a ${cz(b)} l dračí krve. Kolik litrů lektvaru vznikne?`, `Čaroděj slil ${cz(a)} l vody a ${cz(b)} l dračí krve. Kolik litrů lektvaru má?`]), ans: v, h1: `${cz(a)} + ${cz(b)}`, h2: `= ${cz(v)} l` }; },
      () => { const a = r1(ri(45, 95) / 10), b = r1(ri(11, 40) / 10); const v = r1(a - b); return { text: pick([`Dračí ocas měřil ${cz(a)} m. V bitvě se zkrátil o ${cz(b)} m. Kolik měří teď?`, `Dračí ocas byl dlouhý ${cz(a)} m. O ${cz(b)} m ho usekl rytíř. Kolik metrů z ocasu zbylo?`]), ans: v, h1: `${cz(a)} − ${cz(b)}`, h2: `= ${cz(v)} m` }; },
      () => { const a = r1(ri(20, 70) / 10), b = r1(ri(15, 55) / 10); const v = r1(a + b); return { text: pick([`Rytíř urazil první den ${cz(a)} km a druhý den ${cz(b)} km. Kolik km ušel celkem?`, `Družina zvládla ráno ${cz(a)} km a odpoledne ${cz(b)} km. Kolik km to je dohromady?`]), ans: v, h1: `${cz(a)} + ${cz(b)}`, h2: `= ${cz(v)} km` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // 5-3 Násobení a dělení desetinných 10 a 100
  function gen_5_3() {
    const tasks = [];
    const T = [
      () => { const a = r1(ri(11, 98) / 10); return { text: `${FR()}: ${cz(a)} × 10 = ?`, ans: r1(a * 10), h1: `Posuň čárku o jedno místo doprava.`, h2: `= ${cz(r1(a * 10))}` }; },
      () => { const a = r2(ri(110, 980) / 100); return { text: `Vynásob stovkou: ${cz(a)} × 100`, ans: r2(a * 100), h1: `Posuň čárku o dvě místa doprava.`, h2: `= ${cz(r2(a * 100))}` }; },
      () => { const a = ri(2, 9) * 10 + ri(0, 9); return { text: `${FR()}: ${a} : 10 = ?`, ans: r1(a / 10), h1: `Posuň čárku o jedno místo doleva.`, h2: `= ${cz(r1(a / 10))}` }; },
      () => { const a = ri(120, 990); return { text: `Vyděl stovkou: ${a} : 100`, ans: r2(a / 100), h1: `Posuň čárku o dvě místa doleva.`, h2: `= ${cz(r2(a / 100))}` }; },
      () => { const a = r2(ri(101, 989) / 100); return { text: `Jaký je desetinásobek čísla ${cz(a)}?`, ans: r1(a * 10), h1: `${cz(a)} × 10 — čárka o jedno doprava.`, h2: `= ${cz(r1(a * 10))}` }; },
      () => { const a = r1(ri(11, 98) / 10); const v = r1(a * 10); const ok = ri(0, 1) === 0; const tvrz = ok ? v : r1(v * 10); const spravne = tvrz === v; return { text: `Platí ${cz(a)} × 10 = ${cz(tvrz)}?`, ans: spravne ? 'ANO' : 'NE', h1: `Čárka se posouvá o JEDNO místo.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const cena = r1(ri(15, 95) / 10); return { text: pick([`Jeden metr lana stojí ${cz(cena)} ${Number.isInteger(cena) ? skl(cena, 'dukát', 'dukáty', 'dukátů') : 'dukátu'}. Kolik stojí 10 metrů?`, `Metr provazu má cenu ${cz(cena)} ${Number.isInteger(cena) ? skl(cena, 'dukát', 'dukáty', 'dukátů') : 'dukátu'}. Kolik zaplatíš za 10 metrů?`]), ans: r1(cena * 10), h1: `${cz(cena)} × 10`, h2: `= ${cz(r1(cena * 10))}` }; },
      () => { const vaha = ri(12, 95); return { text: pick([`100 stejných šupin váží ${vaha * 10} g. Kolik váží jedna? (napiš desetinné číslo)`, `Sto dračích šupin má hmotnost ${vaha * 10} g. Kolik gramů váží jedna šupina? (napiš desetinné číslo)`]), ans: r1(vaha / 10), h1: `${vaha * 10} : 100 — čárka o dvě doleva.`, h2: `= ${cz(r1(vaha / 10))} g` }; },
      () => { const a = r1(ri(12, 90) / 10); return { text: `Doplň: ${cz(a)} × ? = ${cz(r1(a * 100))}`, ans: 100, h1: `Čárka se posunula o dvě místa doprava.`, h2: `= 100` }; },
      () => { const a = ri(3, 9); return { text: `Vyděl jednociferné číslo: ${a} : 10 = ? (napiš desetinné číslo)`, ans: r1(a / 10), h1: `${a} = ${a},0 — posuň čárku doleva.`, h2: `= ${cz(r1(a / 10))}` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 6 — GEOMETRIE A JEDNOTKY
  // ══════════════════════════════════════════════════════════════

  // 6-1 Obvod a obsah
  function gen_6_1() {
    const obd = () => { const a = ri(4, 18); let b = ri(3, 15); if (b === a) b++; return [a, b]; };
    const tasks = [];
    const T = [
      () => { const [a, b] = obd(); return { text: `Obdélník ${a} cm × ${b} cm. Jaký je obvod? (cm)`, ans: 2 * (a + b), h1: `O = 2 × (a + b) = 2 × (${a} + ${b}).`, h2: `= ${2 * (a + b)} cm` }; },
      () => { const [a, b] = obd(); return { text: `Obdélník ${a} cm × ${b} cm. Jaký je obsah? (cm²)`, ans: a * b, h1: `S = a × b = ${a} × ${b}.`, h2: `= ${a * b} cm²` }; },
      () => { const a = ri(3, 15); return { text: `Čtverec se stranou ${a} cm. Jaký je obsah? (cm²)`, ans: a * a, h1: `S = a × a = ${a} × ${a}.`, h2: `= ${a * a} cm²` }; },
      () => { const a = ri(3, 15); return { text: `Čtverec se stranou ${a} cm. Jaký je obvod? (cm)`, ans: 4 * a, h1: `O = 4 × a = 4 × ${a}.`, h2: `= ${4 * a} cm` }; },
      () => { const o = ri(4, 20) * 4; return { text: `Čtvercové nádvoří má obvod ${o} m. Jak dlouhá je jedna strana?`, ans: o / 4, h1: `Strana = obvod : 4.`, h2: `= ${o / 4} m` }; },
      () => { const a = ri(4, 15), S = a * ri(4, 15); return { text: `Obdélníková síň má obsah ${S} m² a šířku ${a} m. Jak je dlouhá?`, ans: S / a, h1: `Délka = obsah : šířka = ${S} : ${a}.`, h2: `= ${S / a} m` }; },
      () => { const [a, b] = obd(); const o = 2 * (a + b); return { text: `Obdélníková zahrada má obvod ${o} m a jednu stranu ${a} m. Jaká je druhá strana?`, ans: b, h1: `Půl obvodu = ${o / 2} = a + b.`, h2: `= ${b} m` }; },
      () => { const a = ri(3, 12); const ok = ri(0, 1) === 0; const tvrz = ok ? a * a : 4 * a; const spravne = tvrz === a * a; return { text: `Má čtverec se stranou ${a} cm obsah ${tvrz} cm²?`, ans: spravne ? 'ANO' : 'NE', h1: `Obsah = ${a} × ${a}, nezaměň s obvodem.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const [a, b] = obd(); return { text: pick([`Dračí zahrada ${a} m × ${b} m se má oplotit dokola. Kolik metrů plotu je potřeba?`, `Kolem obdélníkového výběhu ${a} m × ${b} m se staví hradba. Kolik metrů hradby je potřeba?`]), ans: 2 * (a + b), h1: `Plot = obvod.`, h2: `= ${2 * (a + b)} m` }; },
      () => { const [a, b] = obd(); return { text: pick([`Kolik dlaždic 1 × 1 m pokryje podlahu síně ${a} m × ${b} m?`, `Podlaha trůnního sálu je ${a} m × ${b} m. Kolik dlaždic 1 × 1 m ji pokryje?`]), ans: a * b, h1: `Počet dlaždic = obsah.`, h2: `= ${a * b}` }; },
      () => { const [a, b] = obd(); return { svg: svgRect(a, b, { lw: `${a} m`, lh: `${b} m` }), text: `Dračí pole tvaru obdélníku ${a} m × ${b} m.\nJaký je jeho obsah? (m²)`, ans: a * b, h1: `S = a × b = ${a} × ${b}.`, h2: `= ${a * b} m²` }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'geo', svg: t.svg });
    }
    return tasks;
  }

  // 6-2 Převody jednotek
  function gen_6_2() {
    const tasks = [];
    const T = [
      () => { const n = ri(2, 9); return { text: `Kolik m je ${n} km? (1 km = 1000 m)`, ans: n * 1000, h1: '1 km = 1000 m.', h2: `= ${n * 1000} m` }; },
      () => { const n = ri(2, 9); return { text: `Kolik g je ${n} kg?`, ans: n * 1000, h1: '1 kg = 1000 g.', h2: `= ${n * 1000} g` }; },
      () => { const n = ri(2, 9); return { text: `Kolik kg je ${n} t? (1 t = 1000 kg)`, ans: n * 1000, h1: '1 t = 1000 kg.', h2: `= ${n * 1000} kg` }; },
      () => { const n = ri(2, 9); return { text: `Kolik ml je ${n} l? (1 l = 1000 ml)`, ans: n * 1000, h1: '1 l = 1000 ml.', h2: `= ${n * 1000} ml` }; },
      () => { const n = ri(2, 9); return { text: `Kolik cm je ${n} m? (1 m = 100 cm)`, ans: n * 100, h1: '1 m = 100 cm.', h2: `= ${n * 100} cm` }; },
      () => { const n = ri(2, 6); return { text: `Kolik minut je ${n} ${skl(n, 'hodina', 'hodiny', 'hodin')}?`, ans: n * 60, h1: '1 h = 60 min.', h2: `= ${n * 60} min` }; },
      () => { const n = ri(2, 9) * 1000; return { text: `Kolik km je ${n} m?`, ans: n / 1000, h1: 'Děl tisícem.', h2: `= ${n / 1000} km` }; },
      () => { const n = ri(2, 9) * 1000; return { text: `Kolik litrů je ${n} ml?`, ans: n / 1000, h1: 'Děl tisícem.', h2: `= ${n / 1000} l` }; },
      () => { const km = ri(2, 8), m = ri(100, 900); return { text: pick([`Dračí let měřil ${km} km a ${m} m. Kolik je to metrů celkem?`, `Drak přeletěl ${km} km a ${m} m. Kolik metrů urazil dohromady?`]), ans: km * 1000 + m, h1: `${km} km = ${km * 1000} m, přičti ${m}.`, h2: `= ${km * 1000 + m} m` }; },
      () => { const kg = ri(2, 9), g = ri(100, 900); return { text: pick([`Poklad váží ${kg} kg ${g} g. Kolik gramů to je?`, `Truhla s dukáty váží ${kg} kg a ${g} g. Kolik je to gramů celkem?`]), ans: kg * 1000 + g, h1: `${kg} kg = ${kg * 1000} g.`, h2: `= ${kg * 1000 + g} g` }; },
      () => { const n = ri(2, 5); const ok = ri(0, 1) === 0; const tvrz = ok ? n * 1000 : n * 100; const spravne = tvrz === n * 1000; return { text: `Platí ${n} t = ${tvrz} kg?`, ans: spravne ? 'ANO' : 'NE', h1: `1 t = 1000 kg.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const min = ri(2, 6) * 60; return { text: `Kolik hodin je ${min} minut?`, ans: min / 60, h1: `Děl šedesáti.`, h2: `= ${min / 60} h` }; },
    ];
    for (let i = 0; i < T.length; i++) { const t = T[i % T.length](); tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc' }); }
    return tasks;
  }

  // 6-3 Aritmetický průměr
  function gen_6_3() {
    const mkNums = (cnt, avg) => {
      let nums, last;
      do {
        nums = [];
        let sum = 0;
        for (let k = 0; k < cnt - 1; k++) { const d = ri(-3, 3); nums.push(avg + d); sum += avg + d; }
        last = avg * cnt - sum;
      } while (last < 1 || last > avg + 6);
      nums.push(last);
      return nums;
    };
    const tasks = [];
    const T = [
      () => { const cnt = ri(2, 4), avg = ri(8, 30); const nums = mkNums(cnt, avg); return { text: `Jaký je aritmetický průměr čísel ${nums.join(', ')}?`, ans: avg, h1: `Sečti všechna čísla (${nums.reduce((x, y) => x + y, 0)}) a vyděl počtem (${cnt}).`, h2: `= ${avg}` }; },
      () => { const avg = ri(10, 40); const nums = mkNums(3, avg); return { text: pick([`Rytíř skolil za tři dny ${nums[0]}, ${nums[1]} a ${nums[2]} nestvůr. Kolik jich skolil PRŮMĚRNĚ za den?`, `Za tři dny ulovil drak ${nums[0]}, ${nums[1]} a ${nums[2]} ovcí. Kolik ovcí ulovil PRŮMĚRNĚ za den?`]), ans: avg, h1: `Součet : 3 = ${nums.reduce((x, y) => x + y, 0)} : 3.`, h2: `= ${avg}` }; },
      () => { const avg = ri(8, 25); const nums = mkNums(2, avg); return { text: pick([`Dvě dračata váží ${nums[0]} kg a ${nums[1]} kg. Jaká je jejich průměrná váha?`, `Dvě mláďata draka mají ${nums[0]} kg a ${nums[1]} kg. Kolik váží průměrně?`]), ans: avg, h1: `(${nums[0]} + ${nums[1]}) : 2`, h2: `= ${avg} kg` }; },
      () => { const avg = ri(10, 30), cnt = 3; return { text: `Průměr tří čísel je ${avg}. Jaký je jejich součet?`, ans: avg * cnt, h1: `Součet = průměr × počet = ${avg} × 3.`, h2: `= ${avg * cnt}` }; },
      () => { const a = ri(8, 25), b = a + ri(2, 8); const avg2 = (a + b) / 2; const cele = Number.isInteger(avg2); return cele ? { text: `Jaký je průměr čísel ${a} a ${b}?`, ans: avg2, h1: `(${a} + ${b}) : 2`, h2: `= ${avg2}` } : { text: `Jaký je průměr čísel ${a} a ${b + 1}?`, ans: (a + b + 1) / 2, h1: `(${a} + ${b + 1}) : 2`, h2: `= ${(a + b + 1) / 2}` }; },
      () => { const avg = ri(10, 30); const nums = mkNums(4, avg); return { text: `Čtyři lučištníci zasáhli ${nums.join(', ')} terčů. Kolik terčů zasáhl průměrný střelec?`, ans: avg, h1: `Součet : 4.`, h2: `= ${avg}` }; },
      () => { const a = ri(5, 20), navic = ri(2, 8) * 2; const b = a + navic; return { text: `První hlídka trvala ${a} hodin, druhá ${b}. O kolik hodin je průměr obou delší než první hlídka?`, ans: navic / 2, h1: `Průměr = ${(a + b) / 2}, rozdíl od ${a}.`, h2: `= ${navic / 2}` }; },
      () => { const avg = ri(10, 25); const nums = mkNums(3, avg); const ok = ri(0, 1) === 0; const tvrz = ok ? avg : avg + pick([-2, 2, 3]); const spravne = tvrz === avg; return { text: `Je průměr čísel ${nums.join(', ')} roven ${tvrz}?`, ans: spravne ? 'ANO' : 'NE', h1: `Součet ${nums.reduce((x, y) => x + y, 0)} : 3 = ${avg}.`, h2: spravne ? 'ANO' : 'NE' }; },
      () => { const avg = ri(12, 30); const a = avg - ri(1, 5); const b = 2 * avg - a; return { text: `Průměr dvou pokladů je ${avg} rubínů. První má ${a} rubínů. Kolik má druhý?`, ans: b, h1: `Součet = ${avg} × 2 = ${avg * 2}, odečti ${a}.`, h2: `= ${b}` }; },
      () => { const avg = ri(10, 28); const nums = mkNums(3, avg); const max = Math.max(...nums); return { text: `Teploty v dračí sluji byly ${nums.join(', ')} stupňů. Byl průměr menší než nejvyšší z nich (${max})?`, ans: avg < max ? 'ANO' : 'NE', h1: `Průměr je ${avg}.`, h2: avg < max ? 'ANO' : 'NE' }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'anal' });
    }
    return tasks;
  }

  // ══════════════════════════════════════════════════════════════
  // OBLAST 7 — SOUBOJ S DRAKEM (finále)
  // ══════════════════════════════════════════════════════════════

  // 7-1 Velká čísla mix (MC — číselná)
  function gen_7_1() {
    const tasks = [];
    const T = [
      () => { const a = ri(120000, 480000), b = ri(120000, 480000); return { text: `${FR()}: ${a} + ${b} = ?`, ans: a + b, h1: `Sčítej po řádech pod sebou.`, h2: `= ${a + b}`, d: [String(Math.abs(a - b))] }; }, // miskoncepce: odečte místo sečte
      () => { const b = ri(50000, 300000), a = b + ri(50000, 400000); return { text: `${FR()}: ${a} − ${b} = ?`, ans: a - b, h1: `Odečítej po řádech.`, h2: `= ${a - b}`, d: [String(a + b)] }; }, // miskoncepce: sečte místo odečte
      () => { const n = ri(120000, 950000); const v = Math.round(n / 1000) * 1000; const v2 = Math.round(n / 10000) * 10000; return { text: `Zaokrouhli ${n} na tisíce.`, ans: v, h1: `Cifra stovek rozhoduje.`, h2: `= ${v}`, d: (v2 !== v ? [String(v2)] : []) }; }, // miskoncepce: zaokrouhlí na desetitisíce
      () => { const n = ri(120000, 950000); const v = Math.round(n / 100000) * 100000; const v2 = Math.round(n / 10000) * 10000; return { text: `Zaokrouhli ${n} na statisíce.`, ans: v, h1: `Cifra desetitisíců rozhoduje.`, h2: `= ${v}`, d: (v2 !== v ? [String(v2)] : []) }; }, // miskoncepce: zaokrouhlí na desetitisíce
      () => { const a = ri(2, 9); return { text: `${FR()}: ${a} × 100 000 = ?`, ans: a * 100000, h1: `Přidej pět nul.`, h2: `= ${a * 100000}`, d: [String(a * 10000)] }; }, // miskoncepce: přidá jen čtyři nuly (řád vedle)
      () => { let a = ri(100000, 999999), b = ri(100000, 999999); while (a === b) b = ri(100000, 999999); return { text: `Které číslo je větší: ${a}, nebo ${b}?`, ans: Math.max(a, b), h1: `Porovnej zleva po řádech.`, h2: `= ${Math.max(a, b)}`, d: [String(Math.min(a, b))] }; }, // miskoncepce: vybere menší číslo
      () => { const tis = ri(100, 980); return { text: `Zapiš číslem: ${tis} tisíc.`, ans: tis * 1000, h1: `Připiš tři nuly.`, h2: `= ${tis * 1000}`, d: [String(tis * 100)] }; }, // miskoncepce: připíše jen dvě nuly (stovky)
      () => { const b = ri(100000, 400000), a = b + ri(50000, 300000); return { text: `O kolik je ${a} větší než ${b}?`, ans: a - b, h1: `Rozdíl: ${a} − ${b}.`, h2: `= ${a - b}`, d: [String(a + b)] }; }, // miskoncepce: sečte místo odečte
      () => { const n = ri(2, 9) * 100000; return { text: `${FR()}: ${n} : 1000 = ?`, ans: n / 1000, h1: `Škrtni tři nuly.`, h2: `= ${n / 1000}`, d: [String(n / 100)] }; }, // miskoncepce: škrtne jen dvě nuly (řád vedle)
      () => { const a = ri(120, 480) * 1000, dar = ri(20, 90) * 1000; return { text: `Dračí poklad má ${a} dukátů. Drak daroval ${dar}. Kolik mu zbylo?`, ans: a - dar, h1: `${a} − ${dar}`, h2: `= ${a - dar}`, d: [String(a + dar)] }; }, // miskoncepce: přičte místo odečte
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: 'calc', mc: true, distractors: t.d || [] });
    }
    return tasks;
  }

  // 7-2 Operace mix (písemné +−×:)
  function gen_7_2() {
    const tasks = [];
    const T = [
      () => { const a = ri(115, 870), b = ri(3, 9); return { text: `${FR()}: ${a} × ${b} = ?`, ans: a * b, h1: `Písemné násobení po cifrách.`, h2: `= ${a * b}` }; },
      () => { const b = ri(3, 9), q = ri(30, 130); return { text: `${FR()}: ${b * q} : ${b} = ?`, ans: q, h1: `Písemné dělení zleva.`, h2: `= ${q}` }; },
      () => { const a = r1(ri(15, 95) / 10), b = r1(ri(11, 89) / 10); return { text: `${FR()}: ${cz(a)} + ${cz(b)} = ?`, ans: r1(a + b), h1: `Desetinná čárka pod čárku.`, h2: `= ${cz(r1(a + b))}` }; },
      () => { const den = pick([2, 4, 5, 10]), whole = den * ri(3, 9); return { text: `Kolik je 1/${den} z ${whole}?`, ans: whole / den, h1: `${whole} : ${den}`, h2: `= ${whole / den}` }; },
      () => { const a = ri(23, 85), b = ri(12, 45); return { text: `Násobení dvojciferným: ${a} × ${b}`, ans: a * b, h1: `Rozlož: ${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10}.`, h2: `= ${a * b}` }; },
      () => { const b = ri(3, 8), q = ri(25, 110), r = ri(1, b - 1); const n = b * q + r; return { text: `${n} : ${b} — jaký je zbytek?`, ans: r, h1: `${b} × ${q} = ${b * q}.`, h2: `zbytek ${r}` }; },
      () => { const a = r1(ri(45, 95) / 10), b = r1(ri(11, 40) / 10); return { text: `${FR()}: ${cz(a)} − ${cz(b)} = ?`, ans: r1(a - b), h1: `Odečítej pod sebou, čárka pod čárku.`, h2: `= ${cz(r1(a - b))}` }; },
      () => { const a = r1(ri(11, 95) / 10); return { text: `Vynásob deseti: ${cz(a)} × 10`, ans: r1(a * 10), h1: `Čárka o jedno doprava.`, h2: `= ${cz(r1(a * 10))}` }; },
      () => { const a = ri(1120, 4980), b = ri(2, 4); return { text: `Vypočítej písemně: ${a} × ${b}`, ans: a * b, h1: `Po cifrách zprava, s přenosy.`, h2: `= ${a * b}` }; },
      () => { const den = pick([3, 4, 5]), whole = den * ri(4, 12), num = ri(2, den - 1); return { text: `Zlomek z čísla: kolik je ${num}/${den} z ${whole}?`, ans: (whole / den) * num, h1: `${whole} : ${den} × ${num}`, h2: `= ${(whole / den) * num}` }; },
      () => { const a = ri(120, 380), b = ri(3, 8); return { text: pick([`Drak střeží v každé z ${b} komnat ${a} dukátů. Kolik dukátů střeží celkem?`, `V každé z ${b} věží je ukryto ${a} dukátů. Kolik dukátů je ve všech věžích?`]), ans: a * b, h1: `${a} × ${b}`, h2: `= ${a * b} dukátů` }; },
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
      () => { const a = ri(112, 980), b = ri(12, 39); return { text: `${FR()}: ${a} × ${b} = ?`, ans: a * b, h1: `Násobení dvojciferným: rozlož ${b} na desítky a jednotky.`, h2: `= ${a * b}`, sk: 'calc' }; },
      () => { const b = ri(3, 9), q = ri(40, 140); return { text: `${FR()}: ${b * q} : ${b} = ?`, ans: q, h1: `Písemné dělení zleva.`, h2: `= ${q}`, sk: 'calc' }; },
      () => { const a = r1(ri(20, 95) / 10), b = r1(ri(11, 89) / 10); const big = Math.max(a, b), small = Math.min(a, b); return { text: `${FR()}: ${cz(big)} − ${cz(small)} = ?`, ans: r1(big - small), h1: `Desetinné odčítání, čárka pod čárku.`, h2: `= ${cz(r1(big - small))}`, sk: 'calc' }; },
      () => { const a = ri(4, 16), b = ri(3, 14); return { text: `Obsah obdélníku ${a} cm × ${b} cm? (cm²)`, ans: a * b, h1: `S = a × b.`, h2: `= ${a * b} cm²`, sk: 'geo' }; },
      () => { const avg = ri(6, 24); const n1 = avg + ri(-2, 2), n2 = avg + ri(-2, 2), n3 = avg * 3 - n1 - n2; return { text: `Aritmetický průměr čísel ${n1}, ${n2}, ${n3}?`, ans: avg, h1: `Součet : 3.`, h2: `= ${avg}`, sk: 'anal' }; },
      () => { const n = ri(120000, 950000); const v = Math.round(n / 10000) * 10000; return { text: `Zaokrouhli ${n} na desetitisíce.`, ans: v, h1: `Cifra tisíců rozhoduje.`, h2: `= ${v}`, sk: 'calc' }; },
      () => { const den = pick([2, 3, 4, 5]), whole = den * ri(4, 10), num = ri(1, den - 1); return { text: `Kolik je ${num}/${den} z ${whole}?`, ans: (whole / den) * num, h1: `${whole} : ${den} × ${num}`, h2: `= ${(whole / den) * num}`, sk: 'calc' }; },
      () => { const a = r1(ri(11, 90) / 10); return { text: `${FR()}: ${cz(a)} × 100 = ?`, ans: r1(a * 100), h1: `Čárka o dvě místa doprava.`, h2: `= ${cz(r1(a * 100))}`, sk: 'calc' }; },
      () => { const b = ri(4, 8), q = ri(30, 90), r = ri(1, b - 1); const n = b * q + r; return { text: pick([`Drak hlídá ${n} vajec v hnízdech po ${b}. Kolik vajec zbyde mimo plná hnízda?`, `Dračice snesla ${n} vajec a do hnízda se jich vejde ${b}. Kolik vajec zbyde na poslední, neúplné hnízdo?`]), ans: r, h1: `Zbytek po dělení ${n} : ${b}.`, h2: `= ${r}`, sk: 'calc' }; },
      () => { const a = ri(3, 15); return { text: `Čtverec se stranou ${a} cm — jaký má obvod?`, ans: 4 * a, h1: `O = 4 × a.`, h2: `= ${4 * a} cm`, sk: 'geo' }; },
      () => { const a = ri(120000, 480000), b = ri(120000, 480000); return { text: `${FR()}: ${a} + ${b} = ?`, ans: a + b, h1: `Sčítej po řádech.`, h2: `= ${a + b}`, sk: 'calc' }; },
      () => { const km = ri(2, 8), m = ri(100, 900); return { text: `Dračí let: ${km} km ${m} m. Kolik metrů celkem?`, ans: km * 1000 + m, h1: `${km} × 1000 + ${m}`, h2: `= ${km * 1000 + m} m`, sk: 'calc' }; },
    ];
    for (let i = 0; i < T.length; i++) {
      const t = T[i % T.length]();
      tasks.push({ text: t.text, ans: t.ans, hints: [t.h1, t.h2], skill: t.sk });
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
