/* rpg-learn-5.js — RPG Matematika 5 — teorie (21 misí)
   Dračí říše 🐉 | Matematika 5. ročník
   window.RPG_LEARN_5 = { '<mid>': {intro, sections[], formulas[], examples[], mistakes[], video} }
*/
window.RPG_LEARN_5 = {
  '1-1': {
    intro: '🐲 Mládě draka počítá poklad po milionech. „Přečteš to číslo nahlas?" syčí. Nauč se řády a zápis velkých čísel.',
    sections: [
      { title: 'Řády velkých čísel', body: 'Zprava: jednotky, desítky, stovky, tisíce, desetitisíce, statisíce, miliony. 1 000 000 = milion = 1000 tisíc.' },
      { title: 'Zápis velkých čísel', body: 'Píšeme s mezerou po každých třech cifrách zprava: 345 678 čteme tři sta čtyřicet pět tisíc šest set sedmdesát osm.' },
    ,
      { title: 'Trojice cifer mají jména', body: 'Mezery dělí velké číslo na trojice a každá má své jméno. 4 305 218 přečteš jako „čtyři miliony — tři sta pět tisíc — dvě stě osmnáct". Nejdřív si číslo rozděl očima, teprve pak čti nahlas. Milion je tisíc tisíců.' }
    ],
    formulas: ['1 000 000 = 1000 tisíc = milion'],
    examples: [
      { q: 'Jakou cifru má 472 935 na místě tisíců?', s: ['Řády zprava: 5 jednotky, 3 desítky, 9 stovky, 2 tisíce.', 'Na místě tisíců je cifra 2.'] },
      { q: 'Zapiš číslem: 230 tisíc', s: ['230 tisíc = 230 × 1000.', 'Za 230 připíšeme tři nuly: 230 000.'] },
      { q: 'Přečti a zapiš: dvě stě čtyři tisíce sedm set', s: ['Tisíce: 204, tedy 204 000.', 'Přidáme sedm set: 204 700.'] },
    ],
    mistakes: [
      { wrong: '230 tisíc = 23 000', right: '230 000', why: 'Za „tisíc" patří tři nuly, ne dvě. 230 × 1000 = 230 000.' },
      { wrong: 'V čísle 472 935 je na místě tisíců 4', right: 'na místě tisíců je 2', why: 'Řády se čtou ZPRAVA. 4 je na místě statisíců, ne tisíců.' },
    ],
    video: null
  },
  '1-2': {
    intro: '🦎 Ještěr strážce klade vedle sebe dvě obrovská čísla. „Které je větší?" Nauč se porovnávat velká čísla po řádech.',
    sections: [
      { title: 'Postup porovnání', body: 'Nejprve porovnáme počet cifer — kdo má víc cifer, je větší. Při stejném počtu cifer porovnáváme od nejvyššího řádu vlevo.' },
    ,
      { title: 'Nejdřív spočítej cifry', body: 'Než porovnáváš po řádech, podívej se na počet cifer — víc cifer znamená větší číslo. Teprve při stejném počtu jdeš zleva řád po řádu a hledáš první místo, kde se čísla liší. Nuly uvnitř čísla se nepřeskakují, jsou to plnohodnotné řády.' }
    ],
    formulas: ['345 678 < 354 000 (desetitisíce: 4 < 5)'],
    examples: [
      { q: 'Porovnej: 198 000 a 201 000', s: ['Obě mají 6 cifer, porovnáme zleva.', 'Statisíce 1 = 2? Ne: 1 < 2.', '198 000 < 201 000.'] },
      { q: 'Porovnej: 87 500 a 105 000', s: ['87 500 má 5 cifer, 105 000 má 6 cifer.', 'Víc cifer = větší číslo.', '87 500 < 105 000.'] },
    ],
    mistakes: [
      { wrong: '87 500 > 105 000, protože 87 > 10', right: '87 500 < 105 000', why: 'Nesrovnáváme začátky, ale celá čísla. 105 000 má víc cifer, proto je větší.' },
      { wrong: '198 000 > 201 000, protože 98 > 01', right: '198 000 < 201 000', why: 'Porovnáváme od nejvyššího řádu vlevo: statisíce 1 < 2.' },
    ],
    video: null
  },
  '1-3': {
    intro: '🪨 Skalní golem odlamuje z čísel poslední kusy. „Co zbude?" duní. Nauč se zaokrouhlovat velká čísla.',
    sections: [
      { title: 'Pravidlo', body: 'Podíváme se na cifru o jeden řád níž, než na který zaokrouhlujeme. 0–4 dolů, 5–9 nahoru. Zbylé nižší řády nahradíme nulami.' },
    ,
      { title: 'Zaokrouhlené číslo se píše s ≈', body: 'Zaokrouhlením se hodnota změní, proto tam nepatří rovnítko, ale vlnovka: 456 789 ≈ 457 000. Nižší řády se nahradí nulami. Rozhoduje jediná cifra — ta hned vpravo od místa, na které zaokrouhluješ, bez ohledu na to, co je za ní.' }
    ],
    formulas: ['Na tisíce: rozhoduje cifra stovek', 'Na desetitisíce: rozhoduje cifra tisíců'],
    examples: [
      { q: 'Zaokrouhli 456 789 na tisíce.', s: ['Zaokrouhlujeme na tisíce → rozhoduje cifra stovek: 7.', '7 ≥ 5 → nahoru.', 'Výsledek: 457 000.'] },
      { q: 'Zaokrouhli 234 500 na desetitisíce.', s: ['Rozhoduje cifra tisíců: 4.', '4 < 5 → dolů.', 'Výsledek: 230 000.'] },
    ],
    mistakes: [
      { wrong: '456 789 na tisíce = 456 000', right: '457 000', why: 'Rozhoduje cifra stovek (7). 7 ≥ 5, proto zaokrouhlujeme nahoru.' },
      { wrong: '234 500 na desetitisíce = 235 000', right: '230 000', why: 'Na desetitisíce rozhoduje cifra tisíců (4), ne stovek. 4 < 5 → dolů.' },
    ],
    video: null
  },
  '2-1': {
    intro: '🔥 Ohnivá ještěrka rozmnožuje plameny. „Kolik jich bude, když je vezmeš sedmkrát?" Nauč se písemné násobení jednociferným.',
    sections: [
      { title: 'Postup', body: 'Násobíme každou cifru horního čísla zprava doleva. Přesáhne-li výsledek 9, přeneseme desítky do dalšího řádu a přičteme.' },
    ,
      { title: 'Přenos zapisuj, nepamatuj si ho', body: 'Při písemném násobení vzniká u každé cifry přenos do vyššího řádu. Piš si ho drobně nad další sloupec. Nejvíc chyb vzniká tím, že se přenos zapomene přičíst. Odhadni si výsledek dopředu: 4 × 2 145 je zhruba 4 × 2 000 = 8 000.' }
    ],
    formulas: ['347 × 6 = 2 082'],
    examples: [
      { q: '258 × 4 = ?', s: ['8 × 4 = 32, píšu 2, přenáším 3.', '5 × 4 = 20, +3 = 23, píšu 3, přenáším 2.', '2 × 4 = 8, +2 = 10, píšu 10.', 'Výsledek: 1 032.'] },
      { q: '347 × 6 = ?', s: ['7 × 6 = 42, píšu 2, přenáším 4.', '4 × 6 = 24, +4 = 28, píšu 8, přenáším 2.', '3 × 6 = 18, +2 = 20, píšu 20.', 'Výsledek: 2 082.'] },
    ],
    mistakes: [
      { wrong: '258 × 4 = 8 202 (přenos připsán vedle)', right: '1 032', why: 'Přenos se PŘIČÍTÁ k dalšímu součinu, nepíše se jako samostatná cifra.' },
      { wrong: '258 × 4 = 8032 (zapomenutý přenos)', right: '1 032', why: 'Z 8 × 4 = 32 se přenáší 3 do dalšího řádu — nesmí se zapomenout přičíst.' },
    ],
    video: null
  },
  '2-2': {
    intro: '🐊 Lávový krokodýl násobí dvěma čelistmi najednou. „Zvládneš dvojciferného činitele?" Nauč se násobit pod sebou.',
    sections: [
      { title: 'Dva řádky a součet', body: 'Násobíme nejprve jednotkami, pak desítkami (výsledek posuneme o jedno místo doleva). Oba řádky sečteme.' },
    ,
      { title: 'Druhý řádek se posouvá doleva', body: 'Při násobení dvojciferným číslem násobíš dvakrát: nejdřív jednotkami, pak desítkami. Druhý řádek musí začínat o jedno místo doleva, protože nenásobíš čtyřkou, ale čtyřiceti. Kdo posun zapomene, dostane výsledek zhruba desetkrát menší.' }
    ],
    formulas: ['47 × 23 = 47×3 + 47×20 = 141 + 940 = 1 081'],
    examples: [
      { q: '64 × 25 = ?', s: ['64 × 5 = 320.', '64 × 20 = 1 280.', '320 + 1 280 = 1 600.'] },
      { q: '47 × 23 = ?', s: ['47 × 3 = 141.', '47 × 20 = 940.', '141 + 940 = 1 081.'] },
    ],
    mistakes: [
      { wrong: '64 × 25: druhý řádek nezasunutý (64×2=128 pod jednotky)', right: 'druhý řádek posunout o řád: 1 280', why: 'Desítky (2) znamenají 20 — součin patří o jedno místo doleva.' },
      { wrong: '47 × 23 = 47×3 = 141 (jen jednou)', right: '1 081', why: 'Musíme násobit OBĚMA ciframi (3 i 20) a řádky sečíst.' },
    ],
    video: null
  },
  '2-3': {
    intro: '👺 Ohnivý skřet schoval násobení do příběhu. „Kolikrát se to má vzít?" Nauč se slovní úlohy s násobením.',
    sections: [
      { title: 'Kdy násobíme?', body: 'Když máme více stejných skupin a hledáme celkový počet. Vždy odpovíme celou větou s jednotkou.' },
    ,
      { title: 'Kolik skupin a kolik v jedné', body: 'V úloze najdi dvě čísla: kolik je skupin a kolik je v jedné. Jejich součin je celkový počet. Odhadni výsledek zaokrouhlením, než začneš počítat — poznáš tím řádovou chybu. Odpověz celou větou s jednotkou.' }
    ],
    formulas: ['počet skupin × velikost skupiny = celkem'],
    examples: [
      { q: 'Rytíř ujede 180 km za den. Kolik za 6 dní?', s: ['6 stejných dní po 180 km → násobíme.', '180 × 6 = 1 080.', 'Za 6 dní ujede 1 080 km.'] },
      { q: 'V truhle je 24 mincí, truhel je 15. Kolik mincí celkem?', s: ['15 stejných truhel po 24 mincích → násobíme.', '24 × 15 = 360.', 'Celkem je 360 mincí.'] },
    ],
    mistakes: [
      { wrong: '180 km za 6 dní → 180 + 6 = 186', right: '180 × 6 = 1 080 km', why: 'Šest stejných skupin po 180 = násobení, ne sčítání jedné hodnoty a počtu.' },
      { wrong: 'Odpověď „1 080" bez jednotky', right: '1 080 km', why: 'Slovní úlohu vždy dokončíme celou větou s jednotkou.' },
    ],
    video: null
  },
  '3-1': {
    intro: '⚒️ Kovářský golem rozděluje žhavé železo na stejné díly. „Kolik na každý?" Nauč se písemné dělení jednociferným.',
    sections: [
      { title: 'Postup zleva', body: 'Dělíme postupně od nejvyššího řádu. Zjistíme, kolikrát se dělitel vejde, zapíšeme podíl, odečteme a snížíme další cifru.' },
    ,
      { title: 'Dělení jde zleva, ne zprava', body: 'Na rozdíl od sčítání a násobení se písemné dělení počítá od nejvyššího řádu, tedy zleva. V každém kroku zjistíš, kolikrát se dělitel vejde, zapíšeš cifru podílu, odečteš a snížíš další cifru. Když se dělitel nevejde ani jednou, píše se do podílu nula — nesmí se vynechat.' }
    ],
    formulas: ['856 : 8 = 107'],
    examples: [
      { q: '742 : 7 = ?', s: ['7 : 7 = 1, zbytek 0, snížím 4.', '4 : 7 = 0 (nevejde se), píšu 0, snížím 2 → 42.', '42 : 7 = 6.', 'Výsledek: 106.'] },
      { q: '856 : 8 = ?', s: ['8 : 8 = 1, snížím 5.', '5 : 8 = 0, píšu 0, snížím 6 → 56.', '56 : 8 = 7.', 'Výsledek: 107.'] },
    ],
    mistakes: [
      { wrong: '742 : 7 = 16 (vynechaná nula)', right: '106', why: 'Když se dělitel do cifry nevejde, píše se do podílu 0 — nesmí se přeskočit.' },
      { wrong: '856 : 8 = 17', right: '107', why: 'Stejná chyba: prostřední 0 v podílu se nesmí zapomenout.' },
    ],
    video: null
  },
  '3-2': {
    intro: '🦂 Ohnivý škorpion nikdy nerozdělí všechno beze zbytku. „A co zbude?" Nauč se dělit se zbytkem.',
    sections: [
      { title: 'Zbytek', body: 'Když dělení nevyjde přesně, zbyde zbytek. Platí: dělenec = dělitel × podíl + zbytek. Zbytek je vždy menší než dělitel.' },
    ,
      { title: 'Zbytek musí být menší než dělitel', body: 'Kdyby byl zbytek stejný nebo větší než dělitel, vešel by se tam dělitel ještě jednou. Kontrola je jednoduchá: dělitel × podíl + zbytek musí dát zpátky dělence. Když ti kontrola nesedí, chyba je ve výpočtu, ne v pravidle.' }
    ],
    formulas: ['a = b × q + zbytek (zbytek < b)', '745 : 6 = 124 zbytek 1'],
    examples: [
      { q: '523 : 4 = ?', s: ['5 : 4 = 1, zbytek 1, snížím 2 → 12.', '12 : 4 = 3, zbytek 0, snížím 3.', '3 : 4 = 0, zbytek 3.', 'Výsledek: 130 zbytek 3.'] },
      { q: '745 : 6 = ?', s: ['7 : 6 = 1, zbytek 1, snížím 4 → 14.', '14 : 6 = 2, zbytek 2, snížím 5 → 25.', '25 : 6 = 4, zbytek 1.', 'Výsledek: 124 zbytek 1.'] },
    ],
    mistakes: [
      { wrong: '523 : 4 = 13 zbytek 3 (vynechaná 0)', right: '130 zbytek 3', why: 'I zde chybí nula v podílu — po 12:4=3 se snižuje 3 a vzniká další cifra.' },
      { wrong: '745 : 6 = 124 zbytek 7', right: '124 zbytek 1', why: 'Zbytek musí být MENŠÍ než dělitel (6). Zbytek 7 znamená, že podíl je moc malý.' },
    ],
    video: null
  },
  '3-3': {
    intro: '🐗 Lávový kanec rozryl úlohu na kusy. „Poznáš, co se má dělit?" Nauč se slovní úlohy s dělením.',
    sections: [
      { title: 'Kdy dělíme?', body: 'Když rozdělujeme rovnoměrně (kolik na jednoho?) nebo zjišťujeme, kolik skupin vznikne (po kolika?).' },
    ,
      { title: 'Dvě různé otázky, totéž dělení', body: '„Kolik dostane každý ze 6?" i „Pro kolik lidí to vystačí po 6?" vedou na stejný výpočet. Liší se ale odpověď: v prvním případě mluvíš o množství, ve druhém o počtu skupin. Když vyjde zbytek, přečti si otázku znovu — ptá se na plné díly, nebo na zbytek?' }
    ],
    formulas: ['celek : počet = na jednoho'],
    examples: [
      { q: '480 zlatých rozdělíme mezi 6 rytířů. Kolik každý?', s: ['Rozdělujeme rovnoměrně → dělíme.', '480 : 6 = 80.', 'Každý rytíř dostane 80 zlatých.'] },
      { q: '350 šípů dáme po 7 do toulců. Kolik toulců?', s: ['Zjišťujeme, kolik skupin po 7 → dělíme.', '350 : 7 = 50.', 'Naplníme 50 toulců.'] },
    ],
    mistakes: [
      { wrong: '480 zlatých mezi 6 → 480 × 6', right: '480 : 6 = 80', why: 'Rozdělování rovnoměrně je dělení, ne násobení.' },
      { wrong: 'Odpověď „50" bez jednotky', right: '50 toulců', why: 'Slovní úloha se dokončí celou větou s jednotkou.' },
    ],
    video: null
  },
  '4-1': {
    intro: '💎 Krystalový wyrm rozlomil krystal na díly. „Kolik z celku držíš?" Nauč se zlomky jako část celku.',
    sections: [
      { title: 'Co je zlomek', body: 'Zlomek vyjadřuje část celku. Jmenovatel (dole) říká, na kolik dílů celek dělíme; čitatel (nahoře), kolik dílů bereme. 3/4 = celek rozdělím na 4 díly a vezmu 3.' },
      { title: 'Zlomek z čísla', body: 'Kolik je 3/4 z 20? Nejdřív 20 : 4 = 5 (jedna čtvrtina), pak × 3 = 15.' },
    ,
      { title: 'Jmenovatel pojmenovává díl', body: 'Jmenovatel říká, na kolik stejných dílů celek dělíš, a tím ten díl pojmenuje: čtvrtina, pětina, osmina. Čitatel říká, kolik takových dílů bereš. Čím větší jmenovatel, tím menší díl — 1/8 je méně než 1/4, i když osmička je větší než čtyřka.' }
    ],
    formulas: ['část = (celek : jmenovatel) × čitatel'],
    examples: [
      { q: 'Kolik je 2/5 z 30?', s: ['Jedna pětina: 30 : 5 = 6.', 'Dvě pětiny: 6 × 2 = 12.', 'Výsledek: 12.'] },
      { q: 'Kolik je 3/4 z 20?', s: ['Jedna čtvrtina: 20 : 4 = 5.', 'Tři čtvrtiny: 5 × 3 = 15.', 'Výsledek: 15.'] },
    ],
    mistakes: [
      { wrong: '2/5 z 30 = 30 : 2 × 5 = 75', right: '12', why: 'Nejdřív dělíme JMENOVATELEM (5), pak násobíme čitatelem (2). Ne obráceně.' },
      { wrong: '3/4 z 20 = 3 × 4 = 12', right: '15', why: 'Zlomek z čísla není součin čitatele a jmenovatele. 20 : 4 × 3 = 15.' },
    ],
    video: null
  },
  '4-2': {
    intro: '🕷️ Křišťálový pavouk spřádá síť ze stejných dílků. „Sečti je," šeptá. Nauč se sčítat zlomky se stejným jmenovatelem.',
    sections: [
      { title: 'Stejný jmenovatel', body: 'Mají-li zlomky stejného jmenovatele, sčítáme (nebo odčítáme) jen čitatele. Jmenovatel zůstává stejný.' },
    ,
      { title: 'Jmenovatel se nesčítá', body: 'Při sčítání zlomků se stejným jmenovatelem se sčítají jen čitatelé: 2/7 + 3/7 = 5/7. Jmenovatel zůstává, protože se nemění velikost dílu — pořád jsou to sedminy. Napsat 5/14 je nejčastější chyba: sečetlo by se i to, na kolik dílů je celek rozdělený.' }
    ],
    formulas: ['2/7 + 3/7 = 5/7', '5/8 − 2/8 = 3/8'],
    examples: [
      { q: '3/10 + 4/10 = ?', s: ['Stejný jmenovatel 10 → sčítám jen čitatele.', '3 + 4 = 7.', 'Výsledek: 7/10.'] },
      { q: '5/8 − 2/8 = ?', s: ['Stejný jmenovatel 8 → odčítám jen čitatele.', '5 − 2 = 3.', 'Výsledek: 3/8.'] },
    ],
    mistakes: [
      { wrong: '3/10 + 4/10 = 7/20', right: '7/10', why: 'Jmenovatelé se NESČÍTAJÍ. Při stejném jmenovateli zůstává (10), sčítají se jen čitatele.' },
      { wrong: '5/8 − 2/8 = 3/0', right: '3/8', why: 'Jmenovatel se neodečítá ani nemění — zůstává 8.' },
    ],
    video: null
  },
  '4-3': {
    intro: '👁️ Vševidoucí oko schovalo zlomek do příběhu. „Kolik to je doopravdy?" Nauč se slovní úlohy se zlomky.',
    sections: [
      { title: 'Najdi celek a část', body: 'V úloze najdeme celek (z čeho počítáme) a zlomek, který z něj bereme. Spočítáme část jako zlomek z čísla.' },
    ,
      { title: 'Najdi celek, pak teprve počítej', body: 'V úloze si nejdřív najdi, z čeho se počítá — to je celek. Teprve pak ber zlomek z něj. Postup je vždy stejný: celek děl jmenovatelem a výsledek vynásob čitatelem. Když se úloha ptá na zbytek, odečti spočítanou část od celku.' }
    ],
    formulas: ['část = (celek : jmenovatel) × čitatel'],
    examples: [
      { q: 'Třída má 28 žáků, 3/4 jsou přítomni. Kolik?', s: ['Celek 28, bereme 3/4.', 'Jedna čtvrtina: 28 : 4 = 7.', 'Tři čtvrtiny: 7 × 3 = 21.', 'Přítomno je 21 žáků.'] },
      { q: 'Sud má 60 l, 2/5 se vylilo. Kolik litrů?', s: ['Celek 60, bereme 2/5.', 'Jedna pětina: 60 : 5 = 12.', 'Dvě pětiny: 12 × 2 = 24.', 'Vylilo se 24 litrů.'] },
    ],
    mistakes: [
      { wrong: '3/4 z 28 = 28 : 3 × 4', right: '28 : 4 × 3 = 21', why: 'Dělíme JMENOVATELEM (4), násobíme čitatelem (3) — pořadí nezaměnit.' },
      { wrong: '2/5 z 60 = 60 − 2 − 5', right: '24 l', why: 'Zlomek z čísla se počítá dělením a násobením, ne odečítáním čitatele a jmenovatele.' },
    ],
    video: null
  },
  '5-1': {
    intro: '🌋 Lávová bestie měří teplotu na desetiny. „Které číslo je větší?" Nauč se číst a porovnávat desetinná čísla.',
    sections: [
      { title: 'Desetinná čárka', body: 'Za desetinnou čárkou jsou desetiny, setiny... 3,4 = 3 celé a 4 desetiny. Čteme „tři celé čtyři desetiny".' },
      { title: 'Porovnávání', body: 'Nejdřív porovnáme celou část. Při shodě porovnáme desetiny, pak setiny. 3,5 > 3,45, protože 3,50 > 3,45.' },
    ,
      { title: 'Nula na konci hodnotu nemění', body: 'U desetinných čísel platí 3,5 = 3,50 = 3,500 — nuly na konci nic nepřidávají. Právě proto se čísla dají porovnat tak, že si je doplníš na stejný počet desetinných míst: 3,50 a 3,45. Pozor, uvnitř čísla nula hodnotu mění: 3,05 není totéž co 3,5.' }
    ],
    formulas: ['3,4 = 3 + 4/10', '3,5 > 3,45'],
    examples: [
      { q: 'Co je větší: 2,7 nebo 2,65?', s: ['Celé části stejné (2 = 2).', 'Doplním na stejný počet míst: 2,70 a 2,65.', 'Desetiny 7 > 6, tedy 2,7 > 2,65.'] },
      { q: 'Co je větší: 0,5 nebo 0,45?', s: ['Celé části stejné (0 = 0).', 'Doplním: 0,50 a 0,45.', 'Desetiny 5 > 4, tedy 0,5 > 0,45.'] },
    ],
    mistakes: [
      { wrong: '0,45 > 0,5, protože 45 > 5', right: '0,5 > 0,45', why: 'Delší zápis za čárkou NEznamená větší číslo. Porovnej po řádech: 0,50 > 0,45.' },
      { wrong: '2,65 > 2,7, protože 65 > 7', right: '2,7 > 2,65', why: 'Desetiny se porovnávají s desetinami: 2,70 vs 2,65 → 7 > 6.' },
    ],
    video: null
  },
  '5-2': {
    intro: '🐉 Žhavý drak sčítá desetiny a setiny. „Pozor, ať ti čárka nesklouzne!" Nauč se sčítat a odčítat desetinná čísla.',
    sections: [
      { title: 'Čárka pod čárku', body: 'Píšeme čísla pod sebe tak, aby desetinná čárka byla pod čárkou. Pak sčítáme nebo odčítáme jako celá čísla a čárku opíšeme dolů.' },
    ,
      { title: 'Čárka pod čárku', body: 'Při sčítání a odčítání desetinných čísel zarovnej čísla podle desetinné čárky, ne podle poslední cifry. Chybějící místa si doplň nulami: 5,08 + 3,70. Čárku ve výsledku opiš přesně pod ty ostatní.' }
    ],
    formulas: ['3,4 + 2,5 = 5,9', '6,2 − 1,7 = 4,5'],
    examples: [
      { q: '4,6 + 3,8 = ?', s: ['Čárku pod čárku: 4,6 + 3,8.', 'Desetiny: 6 + 8 = 14, píšu 4, přenáším 1.', 'Celé: 4 + 3 + 1 = 8.', 'Výsledek: 8,4.'] },
      { q: '6,2 − 1,7 = ?', s: ['Čárku pod čárku: 6,2 − 1,7.', 'Desetiny: 2 − 7 nejde, půjčím: 12 − 7 = 5.', 'Celé: 5 − 1 = 4.', 'Výsledek: 4,5.'] },
    ],
    mistakes: [
      { wrong: '0,5 + 0,7 = 0,12', right: '1,2', why: 'Desetiny se sčítají jako celé: 5 + 7 = 12, to je 1 celá a 2 desetiny → 1,2. Nepíše se „0,12".' },
      { wrong: '4,6 + 3,8 = 7,14', right: '8,4', why: 'Z desetin 6 + 8 = 14 se přenáší 1 do celých — nesmí zůstat „14" za čárkou.' },
    ],
    video: null
  },
  '5-3': {
    intro: '☄️ Ohnivá kometa posouvá desetinnou čárku. „Desetkrát? Stokrát?" Nauč se násobit a dělit desetinná čísla deseti a stem.',
    sections: [
      { title: 'Posun čárky', body: 'Násobíš 10 → čárka o jedno místo doprava. Násobíš 100 → o dvě místa doprava. Dělíš 10 → čárka doleva o jedno, dělíš 100 → o dvě.' },
    ,
      { title: 'Kterým směrem čárka putuje', body: 'Násobení číslo zvětšuje, takže se čárka posouvá doprava. Dělení zmenšuje, takže doleva. Kolik nul, tolik míst: 10 posune o jedno, 100 o dvě. Když chybí místo, doplní se nula: 2,5 × 100 = 250.' }
    ],
    formulas: ['3,5 × 10 = 35', '42 : 10 = 4,2'],
    examples: [
      { q: '2,3 × 100 = ?', s: ['× 100 → čárka o DVĚ místa doprava.', '2,3 → 23, → 230.', 'Výsledek: 230.'] },
      { q: '560 : 100 = ?', s: [': 100 → čárka o DVĚ místa doleva.', '560, → 56,0 → 5,60.', 'Výsledek: 5,6.'] },
    ],
    mistakes: [
      { wrong: '3,5 × 10 = 3,50', right: '35', why: 'U desetinných čísel se NEPŘIDÁVÁ nula — posouvá se čárka. 3,5 × 10 = 35.' },
      { wrong: '2,3 × 100 = 2,300', right: '230', why: 'Násobení 100 posune čárku o dvě místa doprava, nepřidávají se nuly za čárku.' },
    ],
    video: null
  },
  '6-1': {
    intro: '🦅 Skalní orlosup obletí pozemek a pak ho přeměří. „Obvod, nebo obsah?" Nauč se obojí u obdélníku a čtverce.',
    sections: [
      { title: 'Obvod', body: 'Obvod je délka obrysu. Obdélník: O = 2 × (a + b). Čtverec: O = 4 × a.' },
      { title: 'Obsah', body: 'Obsah je plocha uvnitř. Obdélník: S = a × b. Čtverec: S = a × a. Jednotky obsahu: cm², m², mm².' },
    ,
      { title: 'Obvod a obsah mají jiné jednotky', body: 'Obvod je cesta kolem a měří se v centimetrech nebo metrech. Obsah je plocha uvnitř a měří se v cm² nebo m². Když u obsahu napíšeš jen cm, je odpověď neúplná. Pomůcka: obvod je plot, obsah je tráva uvnitř.' }
    ],
    formulas: ['O = 2×(a+b), S = a×b', 'Čtverec: O = 4×a, S = a×a'],
    examples: [
      { q: 'Obdélník 8 × 5 cm. Obsah?', s: ['Obsah obdélníku: S = a × b.', 'S = 8 × 5 = 40.', 'Obsah je 40 cm².'] },
      { q: 'Obdélník 8 × 5 cm. Obvod?', s: ['Obvod obdélníku: O = 2 × (a + b).', 'O = 2 × (8 + 5) = 2 × 13.', 'O = 26 cm.'] },
    ],
    mistakes: [
      { wrong: 'Obsah obdélníku 8 × 5 = 40 cm', right: '40 cm²', why: 'Obsah má vždy čtvereční jednotku (cm²), obvod běžnou (cm).' },
      { wrong: 'Obvod 8 × 5 = 40', right: 'O = 2 × (8 + 5) = 26 cm', why: 'Násobení stran je OBSAH. Obvod je součet všech stran: 2×(a+b).' },
    ],
    video: null
  },
  '6-2': {
    intro: '🧊 Ledový drak mrazí metry, kilogramy i litry. „Převedeš je?" Nauč se převádět jednotky.',
    sections: [
      { title: 'Délka a hmotnost', body: '1 km = 1000 m, 1 m = 100 cm, 1 cm = 10 mm. 1 t = 1000 kg, 1 kg = 1000 g.' },
      { title: 'Objem a čas', body: '1 l = 1000 ml = 100 cl. 1 h = 60 min, 1 min = 60 s, 1 den = 24 h.' },
    ,
      { title: 'Ověř si směr převodu', body: 'Na menší jednotku číslo roste, na větší klesá. Než výsledek napíšeš, zeptej se, jestli mělo vyjít větší, nebo menší. U času to ale neplatí po desítkách — hodina má 60 minut, ne 100. Tenhle rozdíl je nejčastější past celého tématu.' }
    ],
    formulas: ['1 km = 1000 m', '1 t = 1000 kg', '1 l = 1000 ml'],
    examples: [
      { q: '5 km = ? m', s: ['1 km = 1000 m.', '5 × 1000 = 5000.', '5 km = 5 000 m.'] },
      { q: '3 t = ? kg', s: ['1 t = 1000 kg.', '3 × 1000 = 3000.', '3 t = 3 000 kg.'] },
    ],
    mistakes: [
      { wrong: '5 km = 500 m', right: '5 000 m', why: '1 km = 1000 m (tři nuly), ne 100 m. 5 × 1000 = 5 000.' },
      { wrong: '1 m = 10 cm', right: '1 m = 100 cm', why: 'Metr má 100 cm. Deset platí až u převodu centimetrů na milimetry (1 cm = 10 mm).' },
    ],
    video: null
  },
  '6-3': {
    intro: '⚖️ Strážce rovnováhy hledá střed mezi čísly. „Kolik připadne na jedno?" Nauč se aritmetický průměr.',
    sections: [
      { title: 'Jak spočítat průměr', body: 'Aritmetický průměr = součet všech čísel vydělený jejich počtem. Říká, jaká hodnota by připadla na každého, kdyby se vše rozdělilo rovnoměrně.' },
    ,
      { title: 'Průměr leží mezi nejmenším a největším', body: 'Aritmetický průměr nikdy nevyjde menší než nejmenší hodnota ani větší než největší. Když ti vyjde mimo tento rozsah, je někde chyba ve výpočtu. Průměr říká, kolik by připadlo na jednoho, kdyby se všechno rozdělilo rovnoměrně.' }
    ],
    formulas: ['průměr = (součet hodnot) : (počet hodnot)'],
    examples: [
      { q: 'Průměr čísel 12, 8, 10?', s: ['Součet: 12 + 8 + 10 = 30.', 'Počet hodnot: 3.', 'Průměr: 30 : 3 = 10.'] },
      { q: 'Průměr čísel 6, 9, 7, 10?', s: ['Součet: 6 + 9 + 7 + 10 = 32.', 'Počet hodnot: 4.', 'Průměr: 32 : 4 = 8.'] },
    ],
    mistakes: [
      { wrong: 'Průměr 6, 9, 7, 10 = 32 : 3', right: '32 : 4 = 8', why: 'Dělíme POČTEM hodnot. Čísla jsou čtyři, tedy dělíme 4, ne 3.' },
      { wrong: 'Průměr 12, 8, 10 = 12 + 8 + 10 = 30', right: '30 : 3 = 10', why: 'Průměr není jen součet — součet se ještě dělí počtem hodnot.' },
    ],
    video: null
  },
  '7-1': {
    intro: '🐲 Dračí stráž prověřuje velká čísla. „Projdeš, jen když se nespleteš." Opakování velkých čísel a operací.',
    sections: [
      { title: 'Připrav se na mix', body: 'Drak prověří sčítání, odčítání a zaokrouhlování velkých čísel. Počítej pečlivě po řádech.' },
    ,
      { title: 'Odhad dřív než výpočet', body: 'Než začneš počítat, odhadni výsledek zaokrouhlením: 345 000 + 78 500 je zhruba 345 + 79 tisíc, tedy asi 424 000. Když ti pak vyjde 423 500, sedí to. Kdyby vyšlo 4 235 000, hned víš o chybě. Odhad zabere pár vteřin a ušetří opravování.' }
    ],
    formulas: ['Po řádech pod sebou — pozor na přenosy'],
    examples: [
      { q: '345 000 + 278 000 = ?', s: ['Tisíce: 345 + 278 = 623.', 'Připojím tři nuly.', 'Výsledek: 623 000.'] },
      { q: '600 000 − 145 000 = ?', s: ['Tisíce: 600 − 145 = 455.', 'Připojím tři nuly.', 'Výsledek: 455 000.'] },
    ],
    mistakes: [
      { wrong: '345 000 + 278 000 = 523 000', right: '623 000', why: 'Z 45 + 78 (tisíců) vzniká přenos do statisíců — nesmí se zapomenout.' },
      { wrong: '600 000 − 145 000 = 545 000', right: '455 000', why: 'Při odčítání se musí půjčovat přes nuly: 600 − 145 = 455.' },
    ],
    video: null
  },
  '7-2': {
    intro: '🐉 Starodávný drak žádá písemné výpočty. „Ukaž mi celý postup." Opakování písemného násobení a dělení.',
    sections: [
      { title: 'Všechny čtyři operace', body: 'Procvičíš písemné násobení, dělení, desetinné sčítání a zlomek z čísla — vše dohromady.' },
    ,
      { title: 'Poznej, kterou operaci úloha chce', body: 'V mixu se snadno spletou operace. Ptá se úloha na celkový počet stejných skupin? Násobíš. Na rozdělení? Dělíš. U zlomků a desetinných čísel si nejdřív ujasni, co je celek. Než počítáš, řekni si nahlas, co hledáš.' }
    ],
    formulas: ['×, :, desetinná, zlomky'],
    examples: [
      { q: '348 × 7 = ?', s: ['8 × 7 = 56, píšu 6, přenáším 5.', '4 × 7 = 28, +5 = 33, píšu 3, přenáším 3.', '3 × 7 = 21, +3 = 24, píšu 24.', 'Výsledek: 2 436.'] },
      { q: '912 : 8 = ?', s: ['9 : 8 = 1, zbytek 1, snížím 1 → 11.', '11 : 8 = 1, zbytek 3, snížím 2 → 32.', '32 : 8 = 4.', 'Výsledek: 114.'] },
    ],
    mistakes: [
      { wrong: '348 × 7 = 2 106 (zapomenuté přenosy)', right: '2 436', why: 'Každý přenos (5, pak 3) se musí přičíst k dalšímu součinu.' },
      { wrong: '912 : 8 = 14 (vynechaná cifra)', right: '114', why: 'Podíl musí mít tři cifry — po prvním kroku se snižuje a dělí dál.' },
    ],
    video: null
  },
  '7-3': {
    intro: '👑 Dračí král čeká v nitru hory. „Ukaž mi všechno, co ses naučil." Finální duel z celého 5. ročníku.',
    sections: [
      { title: 'Co umíme', body: 'V 5. ročníku jsme zvládli: čísla přes milion, písemné násobení a dělení, zlomky, desetinná čísla, převody jednotek, obsah a obvod, aritmetický průměr.' },
    ,
      { title: 'Na co si dát pozor v závěru', body: 'Nejčastější chyby ročníku: zapomenutý posun druhého řádku při násobení, vynechaná nula v podílu, sečtený jmenovatel u zlomků, čárka nezarovnaná pod čárku a chybějící cm² u obsahu. Když si na tohle dáš pozor, drak tě pustí.' }
    ],
    formulas: ['S = a × b, O = 2×(a+b)', 'průměr = součet : počet'],
    examples: [
      { q: 'Obsah obdélníku 12 × 9 cm?', s: ['Obsah: S = a × b.', 'S = 12 × 9 = 108.', 'Obsah je 108 cm².'] },
      { q: 'Průměr čísel 5, 8, 11?', s: ['Součet: 5 + 8 + 11 = 24.', 'Počet: 3.', 'Průměr: 24 : 3 = 8.'] },
    ],
    mistakes: [
      { wrong: 'Obsah 12 × 9 = 108 cm', right: '108 cm²', why: 'Obsah má čtvereční jednotku cm².' },
      { wrong: 'Průměr 5, 8, 11 = 24', right: '24 : 3 = 8', why: 'Součet se ještě dělí počtem hodnot (3).' },
    ],
    video: null
  }
};
