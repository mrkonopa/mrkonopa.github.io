/* rpg-learn-4.js — RPG Matematika 4 — teorie (21 misí)
   Pirátská plavba 🏴‍☠️ | Matýskova matematika 4. ročník
   window.RPG_LEARN_4 = { '<mid>': {intro, sections[], formulas[], examples[], video} }
*/
window.RPG_LEARN_4 = {
  '1-1': {
    intro: 'Čísla do 10 000 — číslice tisíců, stovek, desítek a jednotek.',
    sections: [
      { title: 'Číselná řada do 10 000', body: 'Čísla od 1 000 do 10 000 se skládají ze čtyř číslic. Největší čtyřciferné číslo je 9 999, největší číslo do 10 000 je 10 000.' },
      { title: 'Rozklad čísla', body: 'Každé číslo můžeme rozložit: tisíce + stovky + desítky + jednotky. Např. 4 725 = 4 tisíce + 7 stovek + 2 desítky + 5 jednotek.' },
    ],
    formulas: ['4 725 = 4 000 + 700 + 20 + 5'],
    examples: [
      { q: 'Jaká cifra je na místě stovek v čísle 3 618?', a: '6' },
      { q: 'Kolik tisíců je v čísle 7 042?', a: '7 tisíců' },
    ],
    video: null
  },
  '1-2': {
    intro: 'Porovnávání čísel do 10 000 — znaky <, >, =.',
    sections: [
      { title: 'Jak porovnat dvě čísla', body: 'Porovnáváme vždy od nejvyššího řádu. Nejprve tisíce — kdo má více tisíců, má větší číslo. Jsou-li tisíce stejné, porovnáme stovky, pak desítky, pak jednotky.' },
    ],
    formulas: ['3 456 < 4 123 (3 tisíce < 4 tisíce)', '5 200 > 5 180 (stovky: 2 > 1)'],
    examples: [
      { q: 'Porovnej: 6 789 a 6 798', a: '6 789 < 6 798 (desítky: 8 < 9)' },
    ],
    video: null
  },
  '1-3': {
    intro: 'Zaokrouhlování čísel — na desítky, stovky, tisíce.',
    sections: [
      { title: 'Pravidlo zaokrouhlování', body: 'Podíváme se na číslici vpravo od místa, na které zaokrouhlujeme. Je-li 0–4, zaokrouhlíme dolů (zbývající číslice nahradíme nulami). Je-li 5–9, zaokrouhlíme nahoru.' },
      { title: 'Příklady', body: '3 247 zaokrouhleno na stovky: cifra desítek je 4 → dolů → 3 200. Na tisíce: cifra stovek je 2 → dolů → 3 000.' },
    ],
    formulas: ['Zaokrouhlování na stovky: dívám se na desítky', 'Zaokrouhlování na tisíce: dívám se na stovky'],
    examples: [
      { q: 'Zaokrouhli 4 680 na stovky.', a: '4 700 (desítky: 8 ≥ 5 → nahoru)' },
      { q: 'Zaokrouhli 7 349 na tisíce.', a: '7 000 (stovky: 3 < 5 → dolů)' },
    ],
    video: null
  },
  '2-1': {
    intro: 'Sčítání čísel do 10 000 — postup pod sebou.',
    sections: [
      { title: 'Sčítání pod sebou', body: 'Čísla zapíšeme pod sebe, jednotky pod jednotky, desítky pod desítky atd. Sčítáme zprava. Přesáhne-li součet 9, zapíšeme jednotku přenosu do vyššího řádu.' },
    ],
    formulas: ['2 456 + 1 738 = 4 194'],
    examples: [
      { q: '3 567 + 2 489 = ?', a: '6 056' },
    ],
    video: null
  },
  '2-2': {
    intro: 'Odčítání čísel do 10 000 — postup pod sebou.',
    sections: [
      { title: 'Odčítání pod sebou', body: 'Zapíšeme čísla pod sebe. Odčítáme zprava. Je-li menšenec menší než menšitel na daném místě, půjčíme si z vyššího řádu (přenosem).' },
    ],
    formulas: ['5 003 − 2 487 = 2 516'],
    examples: [
      { q: '8 000 − 3 456 = ?', a: '4 544' },
    ],
    video: null
  },
  '2-3': {
    intro: 'Slovní úlohy se sčítáním a odčítáním — postup řešení.',
    sections: [
      { title: 'Postup řešení slovní úlohy', body: '1. Přečtu úlohu a vyznačím, co hledám.\n2. Zapíšu rovnici nebo výpočet.\n3. Vypočítám.\n4. Odpovím celou větou.' },
    ],
    formulas: [],
    examples: [
      { q: 'Loď naložila 2 400 kg nákladu a ještě 850 kg. Celkem?', a: '2 400 + 850 = 3 250 kg' },
    ],
    video: null
  },
  '3-1': {
    intro: 'Násobilka 1–10 — opakování a procvičení.',
    sections: [
      { title: 'Násobilka jako základ', body: 'Násobilka jsou výsledky součinů čísel 1 až 10. Musíme ji znát zpaměti! Platí i zákon zaměnitelnosti: 3 × 7 = 7 × 3.' },
    ],
    formulas: ['a × b = b × a (zákon zaměnitelnosti)'],
    examples: [
      { q: '7 × 8 = ?', a: '56' },
      { q: '9 × 6 = ?', a: '54' },
    ],
    video: null
  },
  '3-2': {
    intro: 'Násobení desítkami a stovkami — zkrácený postup.',
    sections: [
      { title: 'Násobení 10 a 100', body: 'Násobíme-li číslo 10, připíšeme na konec nulu. Násobíme-li 100, připíšeme dvě nuly.' },
      { title: 'Násobení desítkami', body: '6 × 40 = 6 × 4 × 10 = 24 × 10 = 240. Využíváme násobilku a přidáme nulu.' },
    ],
    formulas: ['n × 10 → přidám jednu 0', 'n × 100 → přidám dvě 0', '6 × 40 = (6 × 4) × 10 = 240'],
    examples: [
      { q: '7 × 300 = ?', a: '2 100' },
      { q: '5 × 80 = ?', a: '400' },
    ],
    video: null
  },
  '3-3': {
    intro: 'Násobení dvojciferného čísla jednociferným — rozklad.',
    sections: [
      { title: 'Rozklad na desítky a jednotky', body: 'Dvoumístné číslo rozložíme na desítky a jednotky: 34 = 30 + 4. Pak násobíme každou část zvlášť a výsledky sečteme.' },
    ],
    formulas: ['34 × 6 = (30 + 4) × 6 = 30 × 6 + 4 × 6 = 180 + 24 = 204'],
    examples: [
      { q: '47 × 5 = ?', a: '(40 + 7) × 5 = 200 + 35 = 235' },
    ],
    video: null
  },
  '4-1': {
    intro: 'Dělení bez zbytku — opak násobení.',
    sections: [
      { title: 'Dělení jako opak násobení', body: 'Dělení je opakem násobení. Hledáme číslo, kterým musíme vynásobit dělitele, abychom dostali dělenec. Např. 56 : 7 = ? → ptáme se: 7 × ? = 56 → 7 × 8 = 56 → výsledek je 8.' },
    ],
    formulas: ['a : b = c  ⟺  b × c = a'],
    examples: [
      { q: '72 : 9 = ?', a: '8 (protože 9 × 8 = 72)' },
    ],
    video: null
  },
  '4-2': {
    intro: 'Dělení se zbytkem — co nevyjde přesně.',
    sections: [
      { title: 'Zbytek po dělení', body: 'Ne vždy vyjde dělení přesně. Zbytek je část, která zbyde po dělení. Platí: dělenec = dělitel × podíl + zbytek. Zbytek musí být vždy menší než dělitel!' },
    ],
    formulas: ['a = b × q + r  (r < b)', '23 : 4 = 5 zbytek 3  (4×5=20, 23−20=3)'],
    examples: [
      { q: '29 : 6 = ? zbytek ?', a: '4 zbytek 5 (6×4=24, 29−24=5)' },
    ],
    video: null
  },
  '4-3': {
    intro: 'Slovní úlohy s dělením — rovné dělení a rozdělování.',
    sections: [
      { title: 'Kdy dělíme?', body: 'Dělíme, když rozdělujeme stejnoměrně (kolika lidem?, kolik každému?) nebo zjišťujeme, kolikrát se vejde menší číslo do většího.' },
    ],
    formulas: [],
    examples: [
      { q: '42 sušenek rozdělíme do 6 pytlíků rovnoměrně. Kolik v každém?', a: '42 : 6 = 7 sušenek' },
    ],
    video: null
  },
  '5-1': {
    intro: 'Obvod obdélníku a čtverce — délka všech stran.',
    sections: [
      { title: 'Obvod = součet všech stran', body: 'Obvod je celková délka hranice (obrysu) tvaru. U obdélníku jsou dvě dvojice rovnoběžných stran (a a b). U čtverce jsou všechny strany stejně dlouhé.' },
    ],
    formulas: ['Obvod obdélníku: O = 2 × (a + b)', 'Obvod čtverce: O = 4 × a'],
    examples: [
      { q: 'Obdélník: a = 8 cm, b = 5 cm. Obvod?', a: 'O = 2 × (8 + 5) = 2 × 13 = 26 cm' },
      { q: 'Čtverec: a = 7 cm. Obvod?', a: 'O = 4 × 7 = 28 cm' },
    ],
    video: null
  },
  '5-2': {
    intro: 'Obsah obdélníku a čtverce — pokrytí plochou.',
    sections: [
      { title: 'Obsah = počet čtverečků uvnitř', body: 'Obsah říká, kolik čtverečků (čtvercových jednotek) leží uvnitř tvaru. Obdélník se dá vyplnit čtverečky po řadách: a řad po b čtverečcích.' },
    ],
    formulas: ['Obsah obdélníku: S = a × b', 'Obsah čtverce: S = a × a = a²', 'Jednotky: cm², m², dm²'],
    examples: [
      { q: 'Obdélník: 6 cm × 4 cm. Obsah?', a: 'S = 6 × 4 = 24 cm²' },
      { q: 'Čtverec: strana 9 cm. Obsah?', a: 'S = 9 × 9 = 81 cm²' },
    ],
    video: null
  },
  '5-3': {
    intro: 'Souřadnice bodů a souřadnicová síť.',
    sections: [
      { title: 'Souřadnicová síť', body: 'V síti určujeme polohu bodu dvojicí čísel (x, y). První číslo je vzdálenost od svislé osy (vpravo), druhé od vodorovné osy (nahoru). Píšeme do závorky: bod A(3, 4).' },
      { title: 'Osy souměrnosti', body: 'Osa souměrnosti je přímka, která dělí tvar na dvě stejné (zrcadlové) části. Obdélník má 2 osy, čtverec má 4 osy souměrnosti.' },
    ],
    formulas: ['Bod: A(x, y) — x vpravo, y nahoru'],
    examples: [
      { q: 'Kolik os souměrnosti má obdélník (ne čtverec)?', a: '2 osy (vodorovná a svislá středová osa)' },
    ],
    video: null
  },
  '6-1': {
    intro: 'Jednotky délky — km, m, dm, cm, mm.',
    sections: [
      { title: 'Přehled jednotek', body: '1 km = 1 000 m\n1 m = 10 dm\n1 dm = 10 cm\n1 cm = 10 mm' },
      { title: 'Převody', body: 'Při převodu na menší jednotky násobíme. Při převodu na větší jednotky dělíme.' },
    ],
    formulas: ['1 km = 1 000 m', '1 m = 10 dm = 100 cm = 1 000 mm'],
    examples: [
      { q: '5 km = ? m', a: '5 000 m' },
      { q: '30 cm = ? dm', a: '3 dm' },
    ],
    video: null
  },
  '6-2': {
    intro: 'Jednotky hmotnosti a času.',
    sections: [
      { title: 'Hmotnost', body: '1 kg = 1 000 g. Hmotnost měříme na váze. Běžné jednotky: g (gram), kg (kilogram), t (tuna = 1 000 kg).' },
      { title: 'Čas', body: '1 hodina = 60 minut. 1 minuta = 60 sekund. 1 den = 24 hodin. 1 týden = 7 dní.' },
    ],
    formulas: ['1 kg = 1 000 g', '1 h = 60 min', '1 min = 60 s'],
    examples: [
      { q: '3 kg = ? g', a: '3 000 g' },
      { q: '2 h 30 min = ? min', a: '150 min' },
    ],
    video: null
  },
  '6-3': {
    intro: 'Peníze a slovní úlohy s mírami.',
    sections: [
      { title: 'Peníze v ČR', body: '1 Kč = 100 haléřů (haléře se dnes nepoužívají). Běžné mince: 1, 2, 5, 10, 20, 50 Kč. Bankovky: 100, 200, 500, 1 000, 2 000, 5 000 Kč.' },
    ],
    formulas: [],
    examples: [
      { q: 'Knížka stojí 149 Kč, pero 35 Kč. Zaplatíme celkem?', a: '149 + 35 = 184 Kč' },
    ],
    video: null
  },
  '7-1': {
    intro: 'Čísla do 1 000 000 — milion.',
    sections: [
      { title: 'Od tisíce k milionu', body: '1 000 = tisíc\n10 000 = deset tisíc\n100 000 = sto tisíc\n1 000 000 = jeden milion = 1 000 tisíc.' },
      { title: 'Zápis velkých čísel', body: 'Velká čísla píšeme s mezerou po každých třech cifrách zprava: 345 678 (tři sta čtyřicet pět tisíc šest set sedmdesát osm).' },
    ],
    formulas: ['1 000 000 = 10³ × 10³ = milion'],
    examples: [
      { q: 'Jak zapíšeme: dvě stě třicet tisíc šest set deset?', a: '230 610' },
    ],
    video: null
  },
  '7-2': {
    intro: 'Sčítání a odčítání čísel do 1 000 000.',
    sections: [
      { title: 'Postup je stejný jako pro menší čísla', body: 'Sčítáme a odčítáme stejně jako u menších čísel — pod sebou, zprava. Jenom máme více sloupců. Dávat pozor na přenosy!' },
    ],
    formulas: ['256 780 + 143 220 = 400 000', '500 000 − 123 456 = 376 544'],
    examples: [
      { q: '345 000 + 78 500 = ?', a: '423 500' },
    ],
    video: null
  },
  '7-3': {
    intro: 'Finální přehled — velká čísla, zaokrouhlování, operace.',
    sections: [
      { title: 'Přehled 4. ročníku', body: 'V 4. ročníku jsme se naučili: počítat do 10 000 a dál do 1 000 000, násobilku a dělení, obvody a obsahy, jednotky délky, hmotnosti a času.' },
    ],
    formulas: [],
    examples: [
      { q: 'Zaokrouhli 456 789 na tisíce.', a: '457 000 (stovky: 7 ≥ 5 → nahoru)' },
    ],
    video: null
  }
};
