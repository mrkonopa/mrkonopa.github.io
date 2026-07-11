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
      { q: 'Rozlož číslo 6 205 na řády.', a: '6 205 = 6 000 + 200 + 0 + 5 = 6 tisíc + 2 stovky + 5 jednotek (na místě desítek je 0)' },
    ],
    mistakes: [
      { wrong: '7 042 = 7 stovek', right: '7 042 = 7 tisíců (číslice 7 je na prvním místě zleva)', why: 'Řády se čtou zprava: jednotky, desítky, stovky, tisíce. Cifra nejvíc vlevo u čtyřciferného čísla jsou tisíce.' },
      { wrong: '3 618 → na místě stovek je 8', right: 'na místě stovek je 6', why: '8 je na místě jednotek. Stovky jsou třetí cifra zprava.' },
      { wrong: '6 205 přečteno jako „šest set dvacet pět"', right: 'šest tisíc dvě stě pět', why: 'Nula na místě desítek se nesmí přeskočit — mění hodnotu celého čísla.' },
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
      { q: 'Porovnej: 4 050 a 4 500', a: '4 050 < 4 500 (tisíce stejné, stovky: 0 < 5)' },
    ],
    mistakes: [
      { wrong: '980 > 1 020, protože 980 „vypadá delší"', right: '980 < 1 020', why: 'Číslo s více ciframi (čtyřciferné 1 020) je vždy větší než trojciferné. Nejdřív porovnáváme počet cifer / nejvyšší řád.' },
      { wrong: '6 789 > 6 798 (protože 9 > 8 na konci)', right: '6 789 < 6 798', why: 'Porovnává se od nejvyššího řádu. Tisíce i stovky jsou stejné, rozhoduje první odlišný řád zleva — desítky (8 < 9).' },
      { wrong: '4 050 = 4 500 (mají stejné cifry)', right: '4 050 < 4 500', why: 'Na pořadí cifer záleží — 0 a 5 jsou prohozené na místě stovek a desítek, hodnota je jiná.' },
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
      { q: 'Zaokrouhli 2 950 na stovky.', a: '3 000 (desítky: 5 ≥ 5 → nahoru, 29 stovek → 30 stovek = 3 000)' },
    ],
    mistakes: [
      { wrong: '4 680 na stovky = 4 600', right: '4 700', why: 'Při zaokrouhlení na stovky rozhoduje cifra desítek (8 ≥ 5), zaokrouhlujeme nahoru na 4 700.' },
      { wrong: '7 349 na tisíce = 7 349 → dívám se na desítky (4)', right: 'dívám se na stovky (3) → 7 000', why: 'Při zaokrouhlení na tisíce rozhoduje cifra o řád níž — stovky, ne desítky.' },
      { wrong: '2 950 na stovky = 2 900', right: '3 000', why: 'Desítky jsou 5 → nahoru. 29 stovek se zvětší na 30 stovek, což je celý tisíc navíc — snadno se zapomene přenos.' },
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
      { q: '4 785 + 1 936 = ?', a: '6 721 (5+6=11 píšu 1 přenos 1; 8+3+1=12 píšu 2 přenos 1; 7+9+1=17 píšu 7 přenos 1; 4+1+1=6)' },
    ],
    mistakes: [
      { wrong: '3 567 + 2 489 = 5 946', right: '6 056', why: 'Zapomenutý přenos: 7+9=16, píšu 6 a 1 přenáším do desítek. Bez přenosu vyjde chybně.' },
      { wrong: 'Čísla sečtena „nakřivo" (tisíce + stovky)', right: 'jednotky pod jednotky, desítky pod desítky…', why: 'Při psaní pod sebe musí být řády přesně zarovnané zprava, jinak sčítáme nesprávné cifry.' },
      { wrong: '4 785 + 1 936 = 5 711', right: '6 721', why: 'Postupné přenosy se řetězí (11 → 12 → 17). Když jeden přenos vypadne, chybí i tisíc ve výsledku.' },
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
      { q: '6 204 − 1 837 = ?', a: '4 367 (4−7 nejde → půjčím: 14−7=7; …; postupně 6 204 − 1 837 = 4 367)' },
    ],
    mistakes: [
      { wrong: '8 000 − 3 456 = 5 456', right: '4 544', why: 'Odčítání od nul vyžaduje postupné půjčování přes několik řádů. Kdo nepůjčí, odečte špatně.' },
      { wrong: '6 204 − 1 837: 4 − 7 = 3 (odečtu menší od většího)', right: '4 − 7 nejde, půjčím si → 14 − 7 = 7', why: 'Nelze prohodit menšence a menšitele. Je-li horní cifra menší, půjčíme si z vyššího řádu.' },
      { wrong: 'Po půjčce zapomenu zmenšit vyšší řád o 1', right: 'z čeho si půjčím, to o 1 zmenším', why: 'Půjčka musí být „zaplacena" — vyšší řád se sníží o 1, jinak výsledek přeroste.' },
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
      { q: 'V truhle bylo 3 500 mincí, piráti utratili 1 275. Kolik zbylo?', a: '3 500 − 1 275 = 2 225 mincí' },
    ],
    mistakes: [
      { wrong: 'U slova „utratili" žák sečte místo odečte', right: 'ubývá → odčítáme (3 500 − 1 275)', why: 'Slova „zbylo, ubylo, utratili, méně" znamenají odčítání; „celkem, přibylo, více" znamenají sčítání.' },
      { wrong: 'Napíšu jen číslo bez jednotky a bez odpovědi', right: '… = 3 250 kg, odpovím celou větou', why: 'Slovní úloha vyžaduje jednotku a odpověď větou — samotné číslo je neúplné řešení.' },
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
      { q: '8 × 7 = ? (a porovnej se 7 × 8)', a: '56 — stejně jako 7 × 8 (zákon zaměnitelnosti)' },
    ],
    mistakes: [
      { wrong: '7 × 8 = 54', right: '56', why: 'Časté přehození s 9 × 6 = 54. Násobilku 7 a 8 je třeba mít pevně zpaměti.' },
      { wrong: '6 × 7 = 13', right: '42', why: 'Násobení se plete se sčítáním (6 + 7 = 13). Násobení znamená opakované sčítání: 6 sedmkrát.' },
      { wrong: '8 × 7 ≠ 7 × 8', right: '8 × 7 = 7 × 8 = 56', why: 'Na pořadí činitelů nezáleží — platí zákon zaměnitelnosti.' },
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
      { q: '4 × 600 = ?', a: '2 400 (4 × 6 = 24, přidám dvě nuly)' },
    ],
    mistakes: [
      { wrong: '7 × 300 = 210', right: '2 100', why: 'U násobení stovkami se přidávají DVĚ nuly, ne jedna. 7 × 3 = 21, pak +00 → 2 100.' },
      { wrong: '5 × 80 = 40', right: '400', why: 'Nula z čísla 80 se musí připsat k výsledku: 5 × 8 = 40, +0 → 400.' },
      { wrong: '4 × 600 = 240', right: '2 400', why: 'Zapomenutá jedna nula. Počet přidaných nul = počet nul u čísla (600 → dvě nuly).' },
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
      { q: '63 × 4 = ?', a: '(60 + 3) × 4 = 240 + 12 = 252' },
    ],
    mistakes: [
      { wrong: '47 × 5 = 200 + 35 = 235, ale žák napíše 205 (sečte jen 200 + 5)', right: '200 + 35 = 235', why: 'Obě dílčí násobení se musí sečíst celá: 40×5=200 a 7×5=35, součet 235.' },
      { wrong: '63 × 4 = (60 + 3) × 4 = 240 + 3 = 243 (jednotky nenásobil)', right: '240 + 12 = 252', why: 'Číslem se násobí OBĚ části rozkladu — i jednotky (3 × 4 = 12), ne jen desítky.' },
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
      { q: '48 : 6 = ?', a: '8 (protože 6 × 8 = 48)' },
    ],
    mistakes: [
      { wrong: '72 : 9 = 9', right: '8', why: 'Kontrola zpětným násobením: 9 × 9 = 81 ≠ 72, kdežto 9 × 8 = 72. Vždy si výsledek ověř násobením.' },
      { wrong: '48 : 6 = 7', right: '8', why: 'Sousední spoj z násobilky (6 × 7 = 42) se plete se správným 6 × 8 = 48.' },
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
      { q: '38 : 5 = ? zbytek ?', a: '7 zbytek 3 (5×7=35, 38−35=3, a 3 < 5 ✓)' },
    ],
    mistakes: [
      { wrong: '29 : 6 = 3 zbytek 11', right: '4 zbytek 5', why: 'Zbytek 11 je větší než dělitel 6 — to je vždy chyba. Vešel by se ještě jeden dělitel, podíl má být 4.' },
      { wrong: '38 : 5 = 7 zbytek 8', right: '7 zbytek 3', why: 'Zbytek MUSÍ být menší než dělitel (r < b). Zbytek 8 ≥ 5 znamená, že podíl je malý.' },
      { wrong: 'U dělení se zbytkem žák napíše jen podíl a zbytek zapomene', right: 'uvedu podíl i zbytek', why: 'Dělenec = dělitel × podíl + zbytek — bez zbytku je odpověď neúplná.' },
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
      { q: '50 dukátů dáme po 8 do měšců. Kolik plných měšců a kolik zbyde?', a: '50 : 8 = 6 měšců, zbyde 2 dukáty (8×6=48, 50−48=2)' },
    ],
    mistakes: [
      { wrong: 'U „rozdělíme rovnoměrně" žák násobí (42 × 6)', right: 'rozdělování → dělíme (42 : 6)', why: 'Slova „rozdělit, každému stejně, po kolika" znamenají dělení, ne násobení.' },
      { wrong: '50 : 8 = 6, zbytek ignoruje', right: '6 měšců a 2 dukáty zbydou', why: 'Ve slovní úloze má zbytek význam (dukáty, které se do měšce nevešly) — nesmí se zahodit.' },
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
      { q: 'Obdélník: a = 12 cm, b = 3 cm. Obvod?', a: 'O = 2 × (12 + 3) = 2 × 15 = 30 cm' },
    ],
    mistakes: [
      { wrong: 'Obvod obdélníku = a + b = 8 + 5 = 13 cm', right: 'O = 2 × (a + b) = 26 cm', why: 'Obdélník má strany dvě dvojice — každou délku i šířku počítáme dvakrát.' },
      { wrong: 'Obvod čtverce = a × a = 49 cm', right: 'O = 4 × a = 28 cm', why: 'a × a je vzorec pro OBSAH. Obvod je součet čtyř stran (4 × a).' },
      { wrong: 'Výsledek obvodu zapsán v cm² ', right: 'obvod je v cm (délka), obsah v cm²', why: 'Obvod je délka čáry — jednotka je cm/m, nikdy ne čtvereční.' },
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
      { q: 'Obdélník: 10 cm × 7 cm. Obsah?', a: 'S = 10 × 7 = 70 cm²' },
    ],
    mistakes: [
      { wrong: 'Obsah obdélníku = 2 × (6 + 4) = 20 cm²', right: 'S = a × b = 6 × 4 = 24 cm²', why: 'To je vzorec pro obvod. Obsah se počítá násobením stran (a × b).' },
      { wrong: 'Obsah zapsán v cm místo cm²', right: 'S = 24 cm² (čtvereční centimetry)', why: 'Obsah je plocha — jednotka je vždy čtvereční (cm², m²…).' },
      { wrong: 'Záměna: pro obvod použije a × b, pro obsah 2×(a+b)', right: 'obsah = a × b, obvod = 2 × (a + b)', why: 'Vzorce se často prohodí. Obsah = plocha uvnitř (násobení), obvod = hranice okolo (sčítání).' },
    ],
    video: null
  },
  '5-3': {
    intro: 'Souřadnice bodů, souřadnicová síť a osy souměrnosti.',
    sections: [
      { title: 'Souřadnicová síť', body: 'V síti určujeme polohu bodu dvojicí čísel (x, y). První číslo je vzdálenost od svislé osy (vpravo), druhé od vodorovné osy (nahoru). Píšeme do závorky: bod A(3, 4).' },
      { title: 'Osy souměrnosti', body: 'Osa souměrnosti je přímka, která dělí tvar na dvě stejné (zrcadlové) části. Obdélník má 2 osy, čtverec má 4 osy souměrnosti.' },
    ],
    formulas: ['Bod: A(x, y) — x vpravo, y nahoru'],
    examples: [
      { q: 'Kolik os souměrnosti má obdélník (ne čtverec)?', a: '2 osy (vodorovná a svislá středová osa)' },
      { q: 'Zapiš souřadnice bodu, který je 5 vpravo a 2 nahoru.', a: 'B(5, 2) — první číslo vpravo (x), druhé nahoru (y)' },
    ],
    mistakes: [
      { wrong: 'Bod A(3, 4) čten jako 3 nahoru a 4 vpravo', right: '3 vpravo (x) a 4 nahoru (y)', why: 'Pořadí souřadnic je pevné: první je vodorovná (x, vpravo), druhá svislá (y, nahoru).' },
      { wrong: 'Obdélník má 4 osy souměrnosti', right: 'obdélník má 2, čtverec 4', why: 'Úhlopříčné osy u obdélníku nedělí tvar na zrcadlové poloviny — má jen 2 osy.' },
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
      { q: '2 m = ? cm', a: '200 cm (1 m = 100 cm, tedy 2 × 100)' },
    ],
    mistakes: [
      { wrong: '5 km = 500 m', right: '5 000 m', why: 'Špatný počet nul. 1 km = 1 000 m (tři nuly), takže 5 km = 5 000 m.' },
      { wrong: '2 m = 20 cm', right: '200 cm', why: '1 m = 100 cm (dvě nuly). Chybí jedna nula — 2 m = 200 cm.' },
      { wrong: '30 cm = 300 dm (násobil místo dělil)', right: '3 dm', why: 'Převod na VĚTŠÍ jednotku (cm → dm) se dělí, ne násobí: 30 : 10 = 3 dm.' },
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
      { q: '1 h 15 min = ? min', a: '75 min (60 + 15)' },
    ],
    mistakes: [
      { wrong: '3 kg = 300 g', right: '3 000 g', why: 'Špatný počet nul. 1 kg = 1 000 g (tři nuly), takže 3 kg = 3 000 g.' },
      { wrong: '2 h 30 min = 230 min', right: '150 min', why: 'Hodiny a minuty se nesčítají jako cifry. 2 h = 120 min, +30 = 150 min.' },
      { wrong: '1 h = 100 min', right: '1 h = 60 min', why: 'Čas není desítková soustava — hodina má 60 minut, ne 100.' },
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
      { q: 'Platíš 200 Kč za nákup za 165 Kč. Kolik ti vrátí?', a: '200 − 165 = 35 Kč' },
    ],
    mistakes: [
      { wrong: 'U „kolik vrátí" žák sečte cenu a platbu', right: 'vrací se rozdíl: 200 − 165 = 35 Kč', why: 'Vrácené peníze = zaplaceno mínus cena. Slovo „vrátí/zbyde" znamená odčítání.' },
      { wrong: 'Výsledek bez jednotky Kč a bez odpovědi', right: '… = 184 Kč, odpovím větou', why: 'U peněz vždy uvádíme jednotku Kč a odpovídáme celou větou.' },
    ],
    video: null
  },
  '7-1': {
    intro: 'Čísla do 1 000 000 — milion.',
    sections: [
      { title: 'Od tisíce k milionu', body: '1 000 = tisíc\n10 000 = deset tisíc\n100 000 = sto tisíc\n1 000 000 = jeden milion = 1 000 tisíc.' },
      { title: 'Zápis velkých čísel', body: 'Velká čísla píšeme s mezerou po každých třech cifrách zprava: 345 678 (tři sta čtyřicet pět tisíc šest set sedmdesát osm).' },
    ],
    formulas: ['1 000 000 = 1 000 × 1 000 = milion'],
    examples: [
      { q: 'Jak zapíšeme: dvě stě třicet tisíc šest set deset?', a: '230 610' },
      { q: 'Kolik tisíců je v čísle 405 000?', a: '405 tisíc' },
    ],
    mistakes: [
      { wrong: '230 610 zapsáno jako 23 610 (chybí nula)', right: '230 610', why: 'Ve „dvě stě třicet tisíc" musí být tři cifry tisíců (230), pak tři cifry pro stovky/desítky/jednotky. Chybějící nula zmenší číslo desetkrát.' },
      { wrong: '405 000 přečteno jako „čtyřicet pět tisíc"', right: 'čtyři sta pět tisíc', why: 'Nula uprostřed (405) drží místo desítek tisíc — nesmí se přeskočit při čtení.' },
      { wrong: 'Velké číslo zapsáno bez mezer: 405000', right: '405 000 (mezera po třech ciframi zprava)', why: 'Mezera po trojicích zprava usnadní čtení a brání záměně řádů.' },
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
      { q: '600 000 − 245 000 = ?', a: '355 000' },
    ],
    mistakes: [
      { wrong: '345 000 + 78 500 = 415 500 (řády nezarovnané)', right: '423 500', why: 'Čísla s různým počtem cifer se musí zarovnat zprava, jinak sčítáme špatné řády.' },
      { wrong: '600 000 − 245 000 = 445 000', right: '355 000', why: 'Postupné půjčování přes nuly. Kontrola: 355 000 + 245 000 = 600 000 ✓.' },
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
      { q: 'Obdélníková zahrada 25 m × 8 m — obvod a obsah?', a: 'O = 2 × (25 + 8) = 66 m; S = 25 × 8 = 200 m²' },
    ],
    mistakes: [
      { wrong: '456 789 na tisíce = 456 000', right: '457 000', why: 'Při zaokrouhlení na tisíce rozhoduje cifra stovek (7 ≥ 5) → nahoru.' },
      { wrong: 'Obvod i obsah zahrady se stejnou jednotkou', right: 'obvod 66 m, obsah 200 m²', why: 'Obvod je délka (m), obsah je plocha (m²) — jednotky se liší, i vzorce.' },
    ],
    video: null
  }
};
