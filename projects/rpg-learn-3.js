/* rpg-learn-3.js — RPG Matematika 3 — teorie (21 misí)
   Kouzelný les 🌳 | Matematika 3. ročník
   window.RPG_LEARN_3 = { '<mid>': {intro, sections[], formulas[], examples[], video} }
*/
window.RPG_LEARN_3 = {
  '1-1': {
    intro: 'Čísla do 1000 — stovky, desítky a jednotky.',
    sections: [
      { title: 'Trojciferná čísla', body: 'Čísla od 100 do 999 mají tři číslice. Zleva: stovky, desítky, jednotky. Např. 472 = 4 stovky + 7 desítek + 2 jednotky.' },
      { title: 'Rozklad čísla', body: 'Každé číslo umíme rozložit na řády. 305 = 3 stovky + 0 desítek + 5 jednotek = 300 + 0 + 5.' },
    ],
    formulas: ['472 = 400 + 70 + 2'],
    examples: [
      { q: 'Kolik stovek má číslo 638?', a: '6 stovek' },
      { q: 'Jaká cifra je na místě desítek v čísle 472?', a: '7 (prostřední cifra)' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Čísla do 1000 – Matýskova matematika' }
  },
  '1-2': {
    intro: 'Porovnávání čísel do 1000 — znaky <, >, =.',
    sections: [
      { title: 'Jak porovnat dvě čísla', body: 'Porovnáváme od nejvyššího řádu. Nejdřív stovky — kdo má víc stovek, má větší číslo. Jsou-li stovky stejné, porovnáme desítky a pak jednotky.' },
    ],
    formulas: ['345 < 412 (3 stovky < 4 stovky)', '560 > 540 (desítky: 6 > 4)'],
    examples: [
      { q: 'Porovnej: 678 a 687', a: '678 < 687 (desítky: 7 < 8)' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Porovnávání čísel do 1000 – Matýskova matematika' }
  },
  '1-3': {
    intro: 'Zaokrouhlování — na desítky a stovky.',
    sections: [
      { title: 'Pravidlo zaokrouhlování', body: 'Podíváme se na číslici vpravo od místa, na které zaokrouhlujeme. Je-li 0–4, zaokrouhlíme dolů. Je-li 5–9, zaokrouhlíme nahoru.' },
      { title: 'Příklady', body: '347 na desítky: jednotky jsou 7 → nahoru → 350. Na stovky: desítky jsou 4 → dolů → 300.' },
    ],
    formulas: ['Na desítky: dívám se na jednotky', 'Na stovky: dívám se na desítky'],
    examples: [
      { q: 'Zaokrouhli 468 na desítky.', a: '470 (jednotky: 8 ≥ 5 → nahoru)' },
      { q: 'Zaokrouhli 349 na stovky.', a: '300 (desítky: 4 < 5 → dolů)' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Zaokrouhlování na desítky a stovky – Matýskova matematika' }
  },
  '2-1': {
    intro: 'Sčítání čísel do 1000.',
    sections: [
      { title: 'Sčítání po řádech', body: 'Sčítáme stejné řády: stovky ke stovkám, desítky k desítkám, jednotky k jednotkám. Přesáhne-li součet 9, přeneseme jednotku do vyššího řádu.' },
    ],
    formulas: ['245 + 137 = 382', '320 + 450 = 770'],
    examples: [
      { q: '356 + 228 = ?', a: '584' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Sčítání do 1000 – Matýskova matematika' }
  },
  '2-2': {
    intro: 'Odčítání čísel do 1000.',
    sections: [
      { title: 'Odčítání po řádech', body: 'Odčítáme zprava. Je-li číslice nahoře menší než dole, půjčíme si jednu z vyššího řádu (desítku, stovku).' },
    ],
    formulas: ['583 − 247 = 336', '600 − 254 = 346'],
    examples: [
      { q: '700 − 365 = ?', a: '335' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Odčítání do 1000 – Matýskova matematika' }
  },
  '2-3': {
    intro: 'Slovní úlohy se sčítáním a odčítáním.',
    sections: [
      { title: 'Postup řešení', body: '1. Přečtu úlohu a vím, co hledám.\n2. Rozhodnu: sčítám, nebo odčítám?\n3. Vypočítám.\n4. Odpovím větou.' },
    ],
    formulas: [],
    examples: [
      { q: 'Skřítek měl 240 žaludů a našel dalších 130. Kolik má celkem?', a: '240 + 130 = 370 žaludů' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Slovní úlohy – sčítání a odčítání – Matýskova matematika' }
  },
  '3-1': {
    intro: 'Malá násobilka 1–10 — základ celé matematiky.',
    sections: [
      { title: 'Co je násobení', body: 'Násobení je opakované sčítání. 4 × 3 znamená 3 + 3 + 3 + 3 = 12. Musíme znát malou násobilku zpaměti!' },
      { title: 'Zákon zaměnitelnosti', body: 'Nezáleží na pořadí: 6 × 7 = 7 × 6 = 42.' },
    ],
    formulas: ['a × b = b × a', '4 × 3 = 3 + 3 + 3 + 3 = 12'],
    examples: [
      { q: '7 × 8 = ?', a: '56' },
      { q: '6 × 9 = ?', a: '54' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Malá násobilka – Matýskova matematika' }
  },
  '3-2': {
    intro: 'Násobení 10, 100 a desítkami.',
    sections: [
      { title: 'Násobení 10 a 100', body: 'Násobíme-li 10, připíšeme na konec jednu nulu. Násobíme-li 100, připíšeme dvě nuly.' },
      { title: 'Násobení desítkami', body: '6 × 40 = 6 × 4 × 10 = 24 × 10 = 240.' },
    ],
    formulas: ['n × 10 → přidám jednu 0', 'n × 100 → přidám dvě 0', '6 × 40 = (6 × 4) × 10 = 240'],
    examples: [
      { q: '8 × 10 = ?', a: '80' },
      { q: '5 × 100 = ?', a: '500' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Násobení 10 a 100 – Matýskova matematika' }
  },
  '3-3': {
    intro: 'Slovní úlohy s násobením.',
    sections: [
      { title: 'Kdy násobíme?', body: 'Násobíme, když máme několik stejných skupin a chceme zjistit celkový počet. Např. 5 košíků po 6 hubách = 5 × 6 = 30 hub.' },
    ],
    formulas: ['počet skupin × velikost skupiny = celkem'],
    examples: [
      { q: 'Na 4 větvích sedí po 7 ptácích. Kolik ptáků?', a: '4 × 7 = 28 ptáků' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Slovní úlohy s násobením – Matýskova matematika' }
  },
  '4-1': {
    intro: 'Dělení bez zbytku — opak násobení.',
    sections: [
      { title: 'Dělení jako opak násobení', body: 'Dělení je opak násobení. 56 ÷ 7 = ? → ptáme se: 7 × ? = 56 → 7 × 8 = 56 → výsledek je 8.' },
    ],
    formulas: ['a ÷ b = c  ⟺  b × c = a'],
    examples: [
      { q: '72 ÷ 9 = ?', a: '8 (protože 9 × 8 = 72)' },
      { q: '40 ÷ 5 = ?', a: '8' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Dělení beze zbytku – Matýskova matematika' }
  },
  '4-2': {
    intro: 'Dělení se zbytkem — co nevyjde přesně.',
    sections: [
      { title: 'Zbytek po dělení', body: 'Ne vždy dělení vyjde přesně. Zbytek je to, co zbyde. Platí: dělenec = dělitel × podíl + zbytek. Zbytek je vždy menší než dělitel!' },
    ],
    formulas: ['a = b × q + zbytek  (zbytek < b)', '23 ÷ 4 = 5 zbytek 3  (4×5=20, 23−20=3)'],
    examples: [
      { q: '29 ÷ 6 = ?', a: '4 zbytek 5 (6×4=24, 29−24=5)' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Dělení se zbytkem – Matýskova matematika' }
  },
  '4-3': {
    intro: 'Slovní úlohy s dělením — rovné rozdělování.',
    sections: [
      { title: 'Kdy dělíme?', body: 'Dělíme, když rozdělujeme stejnoměrně (kolik každému?) nebo zjišťujeme, kolikrát se menší číslo vejde do většího.' },
    ],
    formulas: [],
    examples: [
      { q: '24 oříšků rozdělíme rovně mezi 4 veverky. Kolik každá?', a: '24 ÷ 4 = 6 oříšků' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Slovní úlohy s dělením – Matýskova matematika' }
  },
  '5-1': {
    intro: 'Obvod trojúhelníku — součet všech stran.',
    sections: [
      { title: 'Obvod = obrys tvaru', body: 'Obvod je délka celé hranice tvaru. U trojúhelníku sečteme délky všech tří stran.' },
      { title: 'Rovnostranný trojúhelník', body: 'Má všechny tři strany stejně dlouhé, takže obvod = 3 × strana.' },
    ],
    formulas: ['Obvod trojúhelníku: O = a + b + c', 'Rovnostranný: O = 3 × a'],
    examples: [
      { q: 'Trojúhelník 5, 6, 7 cm. Obvod?', a: 'O = 5 + 6 + 7 = 18 cm' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/geometrie-3/', title: 'Obvod trojúhelníku – Matýskova matematika' }
  },
  '5-2': {
    intro: 'Obvod čtverce a obdélníku.',
    sections: [
      { title: 'Čtverec', body: 'Čtverec má 4 stejné strany. Obvod = 4 × strana.' },
      { title: 'Obdélník', body: 'Obdélník má dvě dvojice stejných stran (a a b). Obvod = 2 × (a + b).' },
    ],
    formulas: ['Obvod čtverce: O = 4 × a', 'Obvod obdélníku: O = 2 × (a + b)'],
    examples: [
      { q: 'Čtverec se stranou 6 cm. Obvod?', a: 'O = 4 × 6 = 24 cm' },
      { q: 'Obdélník 8 cm a 5 cm. Obvod?', a: 'O = 2 × (8 + 5) = 26 cm' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/geometrie-3/', title: 'Obvod čtverce a obdélníku – Matýskova matematika' }
  },
  '5-3': {
    intro: 'Úsečky, lomené čáry a osy souměrnosti.',
    sections: [
      { title: 'Úsečka', body: 'Úsečka je rovná čára mezi dvěma body. Označujeme ji dvěma písmeny, např. úsečka AB. Měříme ji pravítkem v cm a mm.' },
      { title: 'Osa souměrnosti', body: 'Osa souměrnosti je přímka, podle které tvar přeložíme tak, aby se obě poloviny kryly. Čtverec má 4 osy, obdélník 2.' },
    ],
    formulas: ['Úsečka AB — od bodu A do bodu B'],
    examples: [
      { q: 'Body A−B−C leží v přímce. AB = 4 cm, BC = 3 cm. Kolik měří AC?', a: 'AC = 4 + 3 = 7 cm' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/geometrie-3/', title: 'Úsečky a osy souměrnosti – Matýskova matematika' }
  },
  '6-1': {
    intro: 'Jednotky délky — mm, cm, dm, m.',
    sections: [
      { title: 'Přehled jednotek', body: '1 m = 10 dm\n1 dm = 10 cm\n1 cm = 10 mm' },
      { title: 'Převody', body: 'Na menší jednotky násobíme 10. Na větší jednotky dělíme 10.' },
    ],
    formulas: ['1 m = 10 dm = 100 cm = 1000 mm', '1 cm = 10 mm'],
    examples: [
      { q: '3 dm = ? cm', a: '30 cm' },
      { q: '50 mm = ? cm', a: '5 cm' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Jednotky délky – Matýskova matematika' }
  },
  '6-2': {
    intro: 'Jednotky hmotnosti a času.',
    sections: [
      { title: 'Hmotnost', body: '1 kg = 1000 g. Hmotnost měříme na váze. Jednotky: g (gram), kg (kilogram).' },
      { title: 'Čas', body: '1 hodina = 60 minut. 1 minuta = 60 sekund. 1 den = 24 hodin.' },
    ],
    formulas: ['1 kg = 1000 g', '1 h = 60 min', '1 den = 24 h'],
    examples: [
      { q: '2 kg = ? g', a: '2000 g' },
      { q: '3 h = ? min', a: '180 min' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Jednotky hmotnosti a času – Matýskova matematika' }
  },
  '6-3': {
    intro: 'Peníze — počítání s korunami.',
    sections: [
      { title: 'České peníze', body: 'Mince: 1, 2, 5, 10, 20, 50 Kč. Bankovky: 100, 200, 500, 1000 Kč. Při nákupu sčítáme ceny, při placení počítáme, kolik nám vrátí.' },
    ],
    formulas: ['Vrátí = zaplaceno − cena'],
    examples: [
      { q: 'Perníček stojí 25 Kč. Kolik za 3 perníčky?', a: '3 × 25 = 75 Kč' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Počítání s penězi – Matýskova matematika' }
  },
  '7-1': {
    intro: 'Velké opakování — počítání do 1000.',
    sections: [
      { title: 'Co umíme', body: 'Sčítáme a odčítáme do 1000, násobíme a dělíme z malé násobilky. V této oblasti si vše procvičíme dohromady.' },
    ],
    formulas: ['+, −, ×, ÷ — vše do 1000'],
    examples: [
      { q: '320 + 150 = ?', a: '470' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Opakování – počítání do 1000 – Matýskova matematika' }
  },
  '7-2': {
    intro: 'Násobení a dělení 10 a 100.',
    sections: [
      { title: 'Rychlé počítání s nulami', body: 'Násobíš 10 → přidáš nulu. Násobíš 100 → přidáš dvě nuly. Dělíš 10 → ubereš nulu. Dělíš 100 → ubereš dvě nuly.' },
    ],
    formulas: ['n × 100 → +00', 'n ÷ 10 → −0'],
    examples: [
      { q: '7 × 100 = ?', a: '700' },
      { q: '600 ÷ 100 = ?', a: '6' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Násobení a dělení 10 a 100 – Matýskova matematika' }
  },
  '7-3': {
    intro: 'Finální duel — mix všeho z 3. ročníku.',
    sections: [
      { title: 'Přehled 3. ročníku', body: 'Naučili jsme se: čísla do 1000, sčítání a odčítání, malou násobilku a dělení (i se zbytkem), obvody, jednotky a peníze.' },
    ],
    formulas: [],
    examples: [
      { q: 'Obvod trojúhelníku 6, 8, 10 cm?', a: 'O = 6 + 8 + 10 = 24 cm' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/vyukova-videa/', title: 'Velké opakování 3. ročníku – Matýskova matematika' }
  }
};
