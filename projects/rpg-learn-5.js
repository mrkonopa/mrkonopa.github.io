/* rpg-learn-5.js — RPG Matematika 5 — teorie (21 misí)
   Dračí říše 🐉 | Matematika 5. ročník
   window.RPG_LEARN_5 = { '<mid>': {intro, sections[], formulas[], examples[], video} }
*/
window.RPG_LEARN_5 = {
  '1-1': {
    intro: 'Velká čísla do milionu — řády a zápis.',
    sections: [
      { title: 'Řády velkých čísel', body: 'Zprava: jednotky, desítky, stovky, tisíce, desetitisíce, statisíce, miliony. 1 000 000 = milion = 1000 tisíc.' },
      { title: 'Zápis velkých čísel', body: 'Píšeme s mezerou po každých třech cifrách zprava: 345 678 čteme tři sta čtyřicet pět tisíc šest set sedmdesát osm.' },
    ],
    formulas: ['1 000 000 = 1000 tisíc = milion'],
    examples: [
      { q: 'Jakou cifru má 472 935 na místě tisíců?', a: '2' },
      { q: 'Zapiš číslem: 230 tisíc', a: '230 000' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-1-dil/', title: 'Velká čísla do milionu – Matýskova matematika' }
  },
  '1-2': {
    intro: 'Porovnávání velkých čísel.',
    sections: [
      { title: 'Postup porovnání', body: 'Nejprve porovnáme počet cifer — kdo má víc cifer, je větší. Při stejném počtu cifer porovnáváme od nejvyššího řádu vlevo.' },
    ],
    formulas: ['345 678 < 354 000 (desetitisíce: 4 < 5)'],
    examples: [
      { q: 'Porovnej: 198 000 a 201 000', a: '198 000 < 201 000' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-1-dil/', title: 'Porovnávání velkých čísel – Matýskova matematika' }
  },
  '1-3': {
    intro: 'Zaokrouhlování velkých čísel.',
    sections: [
      { title: 'Pravidlo', body: 'Podíváme se na cifru o jeden řád níž, než na který zaokrouhlujeme. 0–4 dolů, 5–9 nahoru. Zbylé nižší řády nahradíme nulami.' },
    ],
    formulas: ['Na tisíce: rozhoduje cifra stovek', 'Na desetitisíce: rozhoduje cifra tisíců'],
    examples: [
      { q: 'Zaokrouhli 456 789 na tisíce.', a: '457 000 (stovky 7 ≥ 5 → nahoru)' },
      { q: 'Zaokrouhli 234 500 na desetitisíce.', a: '230 000 (tisíce 4 < 5 → dolů)' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-1-dil/', title: 'Zaokrouhlování velkých čísel – Matýskova matematika' }
  },
  '2-1': {
    intro: 'Písemné násobení víceciferného čísla jednociferným.',
    sections: [
      { title: 'Postup', body: 'Násobíme každou cifru horního čísla zprava doleva. Přesáhne-li výsledek 9, přeneseme desítky do dalšího řádu a přičteme.' },
    ],
    formulas: ['347 × 6 = 2 082'],
    examples: [
      { q: '258 × 4 = ?', a: '1 032' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-1-dil/', title: 'Písemné násobení jednociferným – Matýskova matematika' }
  },
  '2-2': {
    intro: 'Písemné násobení dvojciferným číslem.',
    sections: [
      { title: 'Dva řádky a součet', body: 'Násobíme nejprve jednotkami, pak desítkami (výsledek posuneme o jedno místo doleva). Oba řádky sečteme.' },
    ],
    formulas: ['47 × 23 = 47×3 + 47×20 = 141 + 940 = 1 081'],
    examples: [
      { q: '64 × 25 = ?', a: '1 600' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-1-dil/', title: 'Písemné násobení dvojciferným – Matýskova matematika' }
  },
  '2-3': {
    intro: 'Slovní úlohy s násobením.',
    sections: [
      { title: 'Kdy násobíme?', body: 'Když máme více stejných skupin a hledáme celkový počet. Vždy odpovíme celou větou s jednotkou.' },
    ],
    formulas: [],
    examples: [
      { q: 'Rytíř ujede 180 km za den. Kolik za 6 dní?', a: '180 × 6 = 1 080 km' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-1-dil/', title: 'Slovní úlohy s násobením – Matýskova matematika' }
  },
  '3-1': {
    intro: 'Písemné dělení jednociferným číslem (beze zbytku).',
    sections: [
      { title: 'Postup zleva', body: 'Dělíme postupně od nejvyššího řádu. Zjistíme, kolikrát se dělitel vejde, zapíšeme podíl, odečteme a snížíme další cifru.' },
    ],
    formulas: ['856 ÷ 8 = 107'],
    examples: [
      { q: '742 ÷ 7 = ?', a: '106' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Písemné dělení jednociferným – Matýskova matematika' }
  },
  '3-2': {
    intro: 'Dělení se zbytkem.',
    sections: [
      { title: 'Zbytek', body: 'Když dělení nevyjde přesně, zbyde zbytek. Platí: dělenec = dělitel × podíl + zbytek. Zbytek je vždy menší než dělitel.' },
    ],
    formulas: ['a = b × q + zbytek (zbytek < b)', '745 ÷ 6 = 124 zbytek 1'],
    examples: [
      { q: '523 ÷ 4 = ?', a: '130 zbytek 3' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Dělení se zbytkem – Matýskova matematika' }
  },
  '3-3': {
    intro: 'Slovní úlohy s dělením.',
    sections: [
      { title: 'Kdy dělíme?', body: 'Když rozdělujeme rovnoměrně (kolik na jednoho?) nebo zjišťujeme, kolik skupin vznikne (po kolika?).' },
    ],
    formulas: [],
    examples: [
      { q: '480 zlatých rozdělíme mezi 6 rytířů. Kolik každý?', a: '480 ÷ 6 = 80 zlatých' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Slovní úlohy s dělením – Matýskova matematika' }
  },
  '4-1': {
    intro: 'Zlomky — část celku.',
    sections: [
      { title: 'Co je zlomek', body: 'Zlomek vyjadřuje část celku. Jmenovatel (dole) říká, na kolik dílů celek dělíme; čitatel (nahoře), kolik dílů bereme. 3/4 = celek rozdělím na 4 díly a vezmu 3.' },
      { title: 'Zlomek z čísla', body: 'Kolik je 3/4 z 20? Nejdřív 20 ÷ 4 = 5 (jedna čtvrtina), pak × 3 = 15.' },
    ],
    formulas: ['část = (celek ÷ jmenovatel) × čitatel'],
    examples: [
      { q: 'Kolik je 2/5 z 30?', a: '30 ÷ 5 × 2 = 12' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Zlomky – část celku – Matýskova matematika' }
  },
  '4-2': {
    intro: 'Sčítání a odčítání zlomků se stejným jmenovatelem.',
    sections: [
      { title: 'Stejný jmenovatel', body: 'Mají-li zlomky stejného jmenovatele, sčítáme (nebo odčítáme) jen čitatele. Jmenovatel zůstává stejný.' },
    ],
    formulas: ['2/7 + 3/7 = 5/7', '5/8 − 2/8 = 3/8'],
    examples: [
      { q: '3/10 + 4/10 = ?', a: '7/10' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Sčítání a odčítání zlomků – Matýskova matematika' }
  },
  '4-3': {
    intro: 'Slovní úlohy se zlomky.',
    sections: [
      { title: 'Najdi celek a část', body: 'V úloze najdeme celek (z čeho počítáme) a zlomek, který z něj bereme. Spočítáme část jako zlomek z čísla.' },
    ],
    formulas: [],
    examples: [
      { q: 'Třída má 28 žáků, 3/4 jsou přítomni. Kolik?', a: '28 ÷ 4 × 3 = 21 žáků' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Slovní úlohy se zlomky – Matýskova matematika' }
  },
  '5-1': {
    intro: 'Desetinná čísla — čtení a porovnávání.',
    sections: [
      { title: 'Desetinná čárka', body: 'Za desetinnou čárkou jsou desetiny, setiny... 3,4 = 3 celé a 4 desetiny. Čteme „tři celé čtyři desetiny".' },
      { title: 'Porovnávání', body: 'Nejdřív porovnáme celou část. Při shodě porovnáme desetiny, pak setiny. 3,5 > 3,45, protože 3,50 > 3,45.' },
    ],
    formulas: ['3,4 = 3 + 4/10', '3,5 > 3,45'],
    examples: [
      { q: 'Co je větší: 2,7 nebo 2,65?', a: '2,7 (= 2,70 > 2,65)' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Desetinná čísla – čtení a porovnávání – Matýskova matematika' }
  },
  '5-2': {
    intro: 'Sčítání a odčítání desetinných čísel.',
    sections: [
      { title: 'Čárka pod čárku', body: 'Píšeme čísla pod sebe tak, aby desetinná čárka byla pod čárkou. Pak sčítáme nebo odčítáme jako celá čísla a čárku opíšeme dolů.' },
    ],
    formulas: ['3,4 + 2,5 = 5,9', '6,2 − 1,7 = 4,5'],
    examples: [
      { q: '4,6 + 3,8 = ?', a: '8,4' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Sčítání a odčítání desetinných čísel – Matýskova matematika' }
  },
  '5-3': {
    intro: 'Násobení a dělení desetinných čísel 10 a 100.',
    sections: [
      { title: 'Posun čárky', body: 'Násobíš 10 → čárka o jedno místo doprava. Násobíš 100 → o dvě místa doprava. Dělíš 10 → čárka doleva o jedno, dělíš 100 → o dvě.' },
    ],
    formulas: ['3,5 × 10 = 35', '42 ÷ 10 = 4,2'],
    examples: [
      { q: '2,3 × 100 = ?', a: '230' },
      { q: '560 ÷ 100 = ?', a: '5,6' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Násobení a dělení desetinných 10 a 100 – Matýskova matematika' }
  },
  '6-1': {
    intro: 'Obvod a obsah obdélníku a čtverce.',
    sections: [
      { title: 'Obvod', body: 'Obvod je délka obrysu. Obdélník: O = 2 × (a + b). Čtverec: O = 4 × a.' },
      { title: 'Obsah', body: 'Obsah je plocha uvnitř. Obdélník: S = a × b. Čtverec: S = a × a. Jednotky obsahu: cm², m², mm².' },
    ],
    formulas: ['O = 2×(a+b), S = a×b', 'Čtverec: O = 4×a, S = a×a'],
    examples: [
      { q: 'Obdélník 8 × 5 cm. Obsah?', a: 'S = 8 × 5 = 40 cm²' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/geometrie-5/', title: 'Obvod a obsah – Matýskova matematika' }
  },
  '6-2': {
    intro: 'Převody jednotek — délka, hmotnost, objem, čas.',
    sections: [
      { title: 'Délka a hmotnost', body: '1 km = 1000 m, 1 m = 100 cm, 1 cm = 10 mm. 1 t = 1000 kg, 1 kg = 1000 g.' },
      { title: 'Objem a čas', body: '1 l = 1000 ml = 100 cl. 1 h = 60 min, 1 min = 60 s, 1 den = 24 h.' },
    ],
    formulas: ['1 km = 1000 m', '1 t = 1000 kg', '1 l = 1000 ml'],
    examples: [
      { q: '5 km = ? m', a: '5 000 m' },
      { q: '3 t = ? kg', a: '3 000 kg' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Převody jednotek – Matýskova matematika' }
  },
  '6-3': {
    intro: 'Aritmetický průměr.',
    sections: [
      { title: 'Jak spočítat průměr', body: 'Aritmetický průměr = součet všech čísel vydělený jejich počtem. Říká, jaká hodnota by připadla na každého, kdyby se vše rozdělilo rovnoměrně.' },
    ],
    formulas: ['průměr = (součet hodnot) ÷ (počet hodnot)'],
    examples: [
      { q: 'Průměr čísel 12, 8, 10?', a: '(12 + 8 + 10) ÷ 3 = 30 ÷ 3 = 10' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Aritmetický průměr – Matýskova matematika' }
  },
  '7-1': {
    intro: 'Souboj s drakem — velká čísla a operace.',
    sections: [
      { title: 'Připrav se na mix', body: 'Drak prověří sčítání, odčítání a zaokrouhlování velkých čísel. Počítej pečlivě po řádech.' },
    ],
    formulas: ['Po řádech pod sebou — pozor na přenosy'],
    examples: [
      { q: '345 000 + 278 000 = ?', a: '623 000' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Velká čísla – opakování – Matýskova matematika' }
  },
  '7-2': {
    intro: 'Souboj s drakem — písemné operace.',
    sections: [
      { title: 'Všechny čtyři operace', body: 'Procvičíš písemné násobení, dělení, desetinné sčítání a zlomek z čísla — vše dohromady.' },
    ],
    formulas: ['×, ÷, desetinná, zlomky'],
    examples: [
      { q: '348 × 7 = ?', a: '2 436' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Písemné operace – opakování – Matýskova matematika' }
  },
  '7-3': {
    intro: 'Finální duel — přehled celého 5. ročníku.',
    sections: [
      { title: 'Co umíme', body: 'V 5. ročníku jsme zvládli: čísla přes milion, písemné násobení a dělení, zlomky, desetinná čísla, převody jednotek, obsah a obvod, aritmetický průměr.' },
    ],
    formulas: [],
    examples: [
      { q: 'Obsah obdélníku 12 × 9 cm?', a: 'S = 12 × 9 = 108 cm²' },
    ],
    video: { url: 'https://www.matyskova-matematika.cz/5-rocnik-2-dil/', title: 'Velké opakování 5. ročníku – Matýskova matematika' }
  }
};
