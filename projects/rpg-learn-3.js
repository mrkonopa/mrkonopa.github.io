/* rpg-learn-3.js — RPG Matematika 3 — teorie (21 misí)
   Kouzelný les 🌳 | Matematika 3. ročník
   window.RPG_LEARN_3 = { '<mid>': {intro, sections[], formulas[], examples[], mistakes[], video} }
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
      { q: 'Rozlož číslo 638 na stovky, desítky a jednotky.', s: ['Zleva čtu řády: 6 stovek, 3 desítky, 8 jednotek.', 'Zapíšu jako součet: 600 + 30 + 8.', 'Výsledek: 638 = 6 stovek + 3 desítky + 8 jednotek.'] },
      { q: 'Zapiš číslo, které má 3 stovky, 0 desítek a 5 jednotek.', s: ['Stovky napíšu na první místo: 3.', 'Desítky jsou 0, jednotky 5 → doplním nulu doprostřed.', 'Výsledek: 305.'] },
    ],
    mistakes: [
      { wrong: '305 = 35', right: '305 = 3 stovky, 0 desítek, 5 jednotek', why: 'Nulu uprostřed nesmíš vynechat — drží místo desítek. Bez ní by číslo mělo jiný řád.' },
      { wrong: 'V čísle 472 je na místě desítek 4', right: 'Na místě desítek je 7 (prostřední cifra)', why: 'Žáci pletou pořadí řádů. Zleva jsou stovky, uprostřed desítky, vpravo jednotky.' },
    ],
    video: null
  },
  '1-2': {
    intro: 'Porovnávání čísel do 1000 — znaky <, >, =.',
    sections: [
      { title: 'Jak porovnat dvě čísla', body: 'Porovnáváme od nejvyššího řádu. Nejdřív stovky — kdo má víc stovek, má větší číslo. Jsou-li stovky stejné, porovnáme desítky a pak jednotky.' },
    ],
    formulas: ['345 < 412 (3 stovky < 4 stovky)', '560 > 540 (desítky: 6 > 4)'],
    examples: [
      { q: 'Porovnej: 678 a 687', s: ['Stovky jsou stejné (6 = 6), jdu dál.', 'Desítky: 7 < 8, takže 678 je menší.', 'Výsledek: 678 < 687.'] },
      { q: 'Porovnej: 500 a 480', s: ['Stovky: 5 > 4, další řády už nemusím zkoumat.', 'Číslo s víc stovkami je větší.', 'Výsledek: 500 > 480.'] },
    ],
    mistakes: [
      { wrong: '480 > 500 (protože 8 je velké)', right: '480 < 500', why: 'Nesmíš porovnávat podle jedné cifry. Rozhoduje nejvyšší řád — nejdřív stovky (4 < 5).' },
      { wrong: 'Znak < čte jako „větší než"', right: 'Špička (užší konec) ukazuje na menší číslo: 3 < 8', why: 'Žáci si pletou směr znaku. Otevřená strana míří k většímu číslu.' },
    ],
    video: null
  },
  '1-3': {
    intro: 'Zaokrouhlování — na desítky a stovky.',
    sections: [
      { title: 'Pravidlo zaokrouhlování', body: 'Podíváme se na číslici vpravo od místa, na které zaokrouhlujeme. Je-li 0–4, zaokrouhlíme dolů. Je-li 5–9, zaokrouhlíme nahoru.' },
      { title: 'Příklady', body: '347 na desítky: jednotky jsou 7 → nahoru → 350. Na stovky: desítky jsou 4 → dolů → 300.' },
    ],
    formulas: ['Na desítky: dívám se na jednotky', 'Na stovky: dívám se na desítky'],
    examples: [
      { q: 'Zaokrouhli 468 na desítky.', s: ['Zaokrouhluji na desítky → dívám se na jednotky: 8.', '8 je 5 nebo víc → zaokrouhluji nahoru.', 'Výsledek: 470.'] },
      { q: 'Zaokrouhli 349 na stovky.', s: ['Zaokrouhluji na stovky → dívám se na desítky: 4.', '4 je méně než 5 → zaokrouhluji dolů.', 'Výsledek: 300.'] },
    ],
    mistakes: [
      { wrong: '45 zaokrouhlím na desítky na 40', right: '45 → 50', why: 'Cifra 5 se vždy zaokrouhluje nahoru, ne dolů. To je časté nedopatření.' },
      { wrong: '349 na stovky → 400 (protože 49 je skoro 50)', right: '349 → 300', why: 'Pro stovky se koukám jen na cifru desítek (4), ne na celé číslo 49. 4 < 5 → dolů.' },
    ],
    video: null
  },
  '2-1': {
    intro: 'Sčítání čísel do 1000.',
    sections: [
      { title: 'Sčítání po řádech', body: 'Sčítáme stejné řády: stovky ke stovkám, desítky k desítkám, jednotky k jednotkám. Přesáhne-li součet 9, přeneseme jednotku do vyššího řádu.' },
    ],
    formulas: ['245 + 137 = 382', '320 + 450 = 770'],
    examples: [
      { q: '356 + 228 = ?', s: ['Jednotky: 6 + 8 = 14 → napíšu 4, přenáším 1 do desítek.', 'Desítky: 5 + 2 + 1 = 8. Stovky: 3 + 2 = 5.', 'Výsledek: 584.'] },
      { q: '320 + 450 = ?', s: ['Jednotky: 0 + 0 = 0. Desítky: 2 + 5 = 7.', 'Stovky: 3 + 4 = 7.', 'Výsledek: 770.'] },
    ],
    mistakes: [
      { wrong: '356 + 228 = 574', right: '356 + 228 = 584', why: 'Žák zapomněl přenést desítku. Z 6 + 8 = 14 se přenáší 1 do desítek.' },
      { wrong: 'Zarovná zleva: 245 a 30 → počítá 2450 + 30', right: 'Zarovnej zprava (jednotky pod jednotky): 245 + 30 = 275', why: 'Když je jedno číslo kratší, zarovnej ho zprava podle jednotek, ne zleva.' },
    ],
    video: null
  },
  '2-2': {
    intro: 'Odčítání čísel do 1000.',
    sections: [
      { title: 'Odčítání po řádech', body: 'Odčítáme zprava. Je-li číslice nahoře menší než dole, půjčíme si jednu z vyššího řádu (desítku, stovku).' },
    ],
    formulas: ['583 − 247 = 336', '600 − 254 = 346'],
    examples: [
      { q: '700 − 365 = ?', s: ['Jednotky: 0 − 5 nejde → půjčím z desítek. 10 − 5 = 5.', 'Po půjčce počítám desítky a stovky: 700 − 365.', 'Výsledek: 335.'] },
      { q: '583 − 247 = ?', s: ['Jednotky: 3 − 7 nejde → půjčím desítku: 13 − 7 = 6.', 'Desítky: 7 (po půjčce) − 4 = 3. Stovky: 5 − 2 = 3.', 'Výsledek: 336.'] },
    ],
    mistakes: [
      { wrong: '583 − 247 = 344 (počítá 7 − 3 místo 3 − 7)', right: '583 − 247 = 336', why: 'Žák odečte menší od většího „aby to šlo". Správně si musíš půjčit z vyššího řádu.' },
      { wrong: '600 − 254 = 454', right: '600 − 254 = 346', why: 'Půjčování přes nuly dělá potíže. Z 600 si musíš půjčit postupně přes desítky i stovky.' },
    ],
    video: null
  },
  '2-3': {
    intro: 'Slovní úlohy se sčítáním a odčítáním.',
    sections: [
      { title: 'Postup řešení', body: '1. Přečtu úlohu a vím, co hledám.\n2. Rozhodnu: sčítám, nebo odčítám?\n3. Vypočítám.\n4. Odpovím větou.' },
    ],
    formulas: [],
    examples: [
      { q: 'Skřítek měl 240 žaludů a našel dalších 130. Kolik má celkem?', s: ['„Našel dalších" → přibývá, budu sčítat.', 'Vypočítám: 240 + 130 = 370.', 'Odpověď: Skřítek má celkem 370 žaludů.'] },
      { q: 'Veverka měla 350 oříšků, 120 snědla. Kolik jí zbylo?', s: ['„Snědla" → ubývá, budu odčítat.', 'Vypočítám: 350 − 120 = 230.', 'Odpověď: Zbylo jí 230 oříšků.'] },
    ],
    mistakes: [
      { wrong: 'U „snědla 120" žák sečte 350 + 120 = 470', right: '350 − 120 = 230', why: 'Žák počítá bez přemýšlení. Když něco ubývá (snědl, ztratil, utratil), musíš odčítat.' },
      { wrong: 'Napíše jen výsledek 370 bez odpovědi', right: 'Skřítek má celkem 370 žaludů.', why: 'Ke slovní úloze patří odpověď celou větou, ne jen číslo.' },
    ],
    video: null
  },
  '3-1': {
    intro: 'Malá násobilka 1–10 — základ celé matematiky.',
    sections: [
      { title: 'Co je násobení', body: 'Násobení je opakované sčítání. 4 × 3 znamená 3 + 3 + 3 + 3 = 12. Musíme znát malou násobilku zpaměti!' },
      { title: 'Zákon zaměnitelnosti', body: 'Nezáleží na pořadí: 6 × 7 = 7 × 6 = 42.' },
    ],
    formulas: ['a × b = b × a', '4 × 3 = 3 + 3 + 3 + 3 = 12'],
    examples: [
      { q: '7 × 8 = ?', s: ['Vzpomenu si na násobilku sedmi.', '7 × 8 znamená sedmkrát osm.', 'Výsledek: 56.'] },
      { q: 'Kolik je 4 × 3 pomocí sčítání?', s: ['4 × 3 znamená sečíst čtyřikrát trojku.', '3 + 3 + 3 + 3 = 12.', 'Výsledek: 12.'] },
    ],
    mistakes: [
      { wrong: '7 × 8 = 54', right: '7 × 8 = 56', why: 'Klasická chyba z nejisté násobilky. 7 × 8 = 56, ne 54 (to je 6 × 9).' },
      { wrong: '6 × 7 se učí zvlášť a 7 × 6 zvlášť', right: '6 × 7 = 7 × 6 = 42', why: 'Na pořadí činitelů nezáleží. Stačí umět jeden směr a druhý plyne z něj.' },
    ],
    video: null
  },
  '3-2': {
    intro: 'Násobení 10, 100 a desítkami.',
    sections: [
      { title: 'Násobení 10 a 100', body: 'Násobíme-li 10, připíšeme na konec jednu nulu. Násobíme-li 100, připíšeme dvě nuly.' },
      { title: 'Násobení desítkami', body: '6 × 40 = 6 × 4 × 10 = 24 × 10 = 240.' },
    ],
    formulas: ['n × 10 → přidám jednu 0', 'n × 100 → přidám dvě 0', '6 × 40 = (6 × 4) × 10 = 240'],
    examples: [
      { q: '8 × 10 = ?', s: ['Násobím deseti → připíšu jednu nulu za číslo.', 'K 8 připíšu 0.', 'Výsledek: 80.'] },
      { q: '6 × 40 = ?', s: ['Rozložím: 6 × 4 × 10.', '6 × 4 = 24, pak × 10 → připíšu nulu.', 'Výsledek: 240.'] },
    ],
    mistakes: [
      { wrong: '5 × 100 = 500 zapíše jako 50', right: '5 × 100 = 500', why: 'Při násobení 100 se přidávají dvě nuly, ne jedna. Žáci často přidají jen jednu.' },
      { wrong: '6 × 40 = 24', right: '6 × 40 = 240', why: 'Žák vynásobí 6 × 4, ale zapomene připsat nulu za desítku.' },
    ],
    video: null
  },
  '3-3': {
    intro: 'Slovní úlohy s násobením.',
    sections: [
      { title: 'Kdy násobíme?', body: 'Násobíme, když máme několik stejných skupin a chceme zjistit celkový počet. Např. 5 košíků po 6 hubách = 5 × 6 = 30 hub.' },
    ],
    formulas: ['počet skupin × velikost skupiny = celkem'],
    examples: [
      { q: 'Na 4 větvích sedí po 7 ptácích. Kolik ptáků?', s: ['Mám 4 stejné skupiny po 7 → budu násobit.', '4 × 7 = 28.', 'Odpověď: Na větvích je 28 ptáků.'] },
      { q: 'Skřítek nasbíral 5 košíků po 6 hubách. Kolik hub?', s: ['5 stejných skupin po 6 → násobím.', '5 × 6 = 30.', 'Odpověď: Nasbíral 30 hub.'] },
    ],
    mistakes: [
      { wrong: 'U „4 větve po 7 ptácích" žák sečte 4 + 7 = 11', right: '4 × 7 = 28', why: 'Několik stejných skupin se počítá násobením, ne sčítáním čísel ze zadání.' },
      { wrong: '„o 3 víc" chápe jako „3× víc"', right: '„o kolik" = přičti, „kolikrát" = násob', why: 'Slovíčka „o" a „krát" se pletou. „O 3 víc" znamená + 3, „3krát víc" znamená × 3.' },
    ],
    video: null
  },
  '4-1': {
    intro: 'Dělení bez zbytku — opak násobení.',
    sections: [
      { title: 'Dělení jako opak násobení', body: 'Dělení je opak násobení. 56 : 7 = ? → ptáme se: 7 × ? = 56 → 7 × 8 = 56 → výsledek je 8.' },
    ],
    formulas: ['a : b = c  ⟺  b × c = a'],
    examples: [
      { q: '72 : 9 = ?', s: ['Ptám se: 9 × ? = 72.', 'Z násobilky vím 9 × 8 = 72.', 'Výsledek: 72 : 9 = 8.'] },
      { q: '40 : 5 = ?', s: ['Ptám se: 5 × ? = 40.', '5 × 8 = 40.', 'Výsledek: 40 : 5 = 8.'] },
    ],
    mistakes: [
      { wrong: '72 : 9 = 7', right: '72 : 9 = 8', why: 'Nejistá násobilka. Kontrola: 9 × 7 = 63, ne 72. Správně 9 × 8 = 72.' },
      { wrong: '40 : 5 = 35 (odečte 40 − 5)', right: '40 : 5 = 8', why: 'Žák si plete dělení s odčítáním. Dělení hledá, kolikrát se 5 vejde do 40.' },
    ],
    video: null
  },
  '4-2': {
    intro: 'Dělení se zbytkem — co nevyjde přesně.',
    sections: [
      { title: 'Zbytek po dělení', body: 'Ne vždy dělení vyjde přesně. Zbytek je to, co zbyde. Platí: dělenec = dělitel × podíl + zbytek. Zbytek je vždy menší než dělitel!' },
    ],
    formulas: ['a = b × q + zbytek  (zbytek < b)', '23 : 4 = 5 zbytek 3  (4×5=20, 23−20=3)'],
    examples: [
      { q: '29 : 6 = ?', s: ['Hledám největší násobek 6, který nepřesáhne 29: 6 × 4 = 24.', 'Zbytek: 29 − 24 = 5. Kontrola: 5 < 6 ✓.', 'Výsledek: 4 (zbytek 5).'] },
      { q: '23 : 4 = ?', s: ['Největší násobek 4 do 23: 4 × 5 = 20.', 'Zbytek: 23 − 20 = 3. Kontrola: 3 < 4 ✓.', 'Výsledek: 5 (zbytek 3).'] },
    ],
    mistakes: [
      { wrong: '29 : 6 = 3 zbytek 11', right: '29 : 6 = 4 zbytek 5', why: 'Zbytek 11 je větší než dělitel 6 → ještě se tam vejde další šestka. Zbytek musí být vždy menší než dělitel.' },
      { wrong: '23 : 4 = 5 zbytek 4', right: '23 : 4 = 5 zbytek 3', why: 'Zbytek 4 = dělitel → dá se dělit dál. Zbytek nesmí být roven ani větší než dělitel.' },
    ],
    video: null
  },
  '4-3': {
    intro: 'Slovní úlohy s dělením — rovné rozdělování.',
    sections: [
      { title: 'Kdy dělíme?', body: 'Dělíme, když rozdělujeme stejnoměrně (kolik každému?) nebo zjišťujeme, kolikrát se menší číslo vejde do většího.' },
    ],
    formulas: [],
    examples: [
      { q: '24 oříšků rozdělíme rovně mezi 4 veverky. Kolik každá?', s: ['Rovné rozdělení mezi 4 → dělím.', '24 : 4 = 6.', 'Odpověď: Každá veverka dostane 6 oříšků.'] },
      { q: 'Kolikrát se vejde 5 do 35 hub v košíku?', s: ['Ptám se, kolikrát se 5 vejde do 35 → dělím.', '35 : 5 = 7.', 'Odpověď: Vejde se sedmkrát.'] },
    ],
    mistakes: [
      { wrong: 'U „rozděl 24 mezi 4" žák počítá 24 × 4', right: '24 : 4 = 6', why: 'Rovné rozdělování je dělení, ne násobení. Každý dostane méně, než je celek.' },
      { wrong: 'Výsledek 6 oříšků napíše bez odpovědi', right: 'Každá veverka dostane 6 oříšků.', why: 'Ke slovní úloze patří odpověď větou, aby bylo jasné, co číslo znamená.' },
    ],
    video: null
  },
  '5-1': {
    intro: 'Obvod trojúhelníku — součet všech stran.',
    sections: [
      { title: 'Obvod = obrys tvaru', body: 'Obvod je délka celé hranice tvaru. U trojúhelníku sečteme délky všech tří stran.' },
      { title: 'Rovnostranný trojúhelník', body: 'Má všechny tři strany stejně dlouhé, takže obvod = 3 × strana.' },
    ],
    formulas: ['Obvod trojúhelníku: O = a + b + c', 'Rovnostranný: O = 3 × a'],
    examples: [
      { q: 'Trojúhelník má strany 5, 6 a 7 cm. Jaký je obvod?', s: ['Obvod = součet všech tří stran.', 'O = 5 + 6 + 7.', 'Výsledek: O = 18 cm.'] },
      { q: 'Rovnostranný trojúhelník má stranu 8 cm. Obvod?', s: ['Všechny tři strany jsou stejné → O = 3 × strana.', 'O = 3 × 8.', 'Výsledek: O = 24 cm.'] },
    ],
    mistakes: [
      { wrong: 'O = 5 + 6 + 7 = 18, ale zapíše bez jednotky', right: 'O = 18 cm', why: 'K délce vždy patří jednotka (cm). Bez ní není jasné, o čem číslo mluví.' },
      { wrong: 'Rovnostranný se stranou 8 → O = 8 + 8 = 16', right: 'O = 3 × 8 = 24 cm', why: 'Trojúhelník má tři strany, ne dvě. Žák jednu stranu vynechá.' },
    ],
    video: null
  },
  '5-2': {
    intro: 'Obvod čtverce a obdélníku — sečti délky všech stran.',
    sections: [
      { title: 'Čtverec', body: 'Čtverec má 4 stejné strany. Obvod spočítáš tak, že sečteš všechny 4 strany (strana + strana + strana + strana).' },
      { title: 'Obdélník', body: 'Obdélník má čtyři strany — dvě delší a dvě kratší. Obvod je součet všech čtyř stran.' },
    ],
    formulas: ['Obvod = sečti délky všech stran obrazce'],
    examples: [
      { q: 'Čtverec má stranu 6 cm. Jaký je obvod?', s: ['Čtverec má 4 stejné strany → sečtu čtyřikrát 6.', '6 + 6 + 6 + 6 = 24.', 'Výsledek: O = 24 cm.'] },
      { q: 'Obdélník má strany 8 cm a 5 cm. Obvod?', s: ['Obdélník má dvě strany 8 a dvě strany 5.', '8 + 5 + 8 + 5 = 26.', 'Výsledek: O = 26 cm.'] },
    ],
    mistakes: [
      { wrong: 'Obdélník 8 a 5 → O = 8 + 5 = 13', right: 'O = 8 + 5 + 8 + 5 = 26 cm', why: 'Obdélník má čtyři strany, ne dvě. Každá délka je tam dvakrát.' },
      { wrong: 'Čtverec 6 cm → O = 6 × 6 = 36', right: 'O = 4 × 6 = 24 cm', why: 'Obvod je součet stran (4 × 6), ne 6 × 6. To by byl obsah, ne obvod.' },
    ],
    video: null
  },
  '5-3': {
    intro: 'Úsečky, lomené čáry a rovinné obrazce.',
    sections: [
      { title: 'Úsečka', body: 'Úsečka je rovná čára mezi dvěma body. Označujeme ji dvěma písmeny, např. úsečka AB. Měříme ji pravítkem v cm a mm.' },
      { title: 'Lomená čára', body: 'Lomená čára je několik úseček spojených za sebou. Její délku spočítáš součtem délek všech úseků.' },
      { title: 'Rovinné obrazce', body: 'Trojúhelník má 3 strany a 3 vrcholy (rohy). Čtverec a obdélník mají 4 strany a 4 vrcholy.' },
    ],
    formulas: ['Úsečka AB — od bodu A do bodu B', 'Trojúhelník: 3 strany · Čtverec a obdélník: 4 strany'],
    examples: [
      { q: 'Body A−B−C leží v přímce. AB = 4 cm, BC = 3 cm. Kolik měří AC?', s: ['Úseky jdou za sebou → délku AC sečtu.', 'AC = AB + BC = 4 + 3.', 'Výsledek: AC = 7 cm.'] },
      { q: 'Lomená čára má úseky 2 cm, 5 cm a 3 cm. Jak je dlouhá?', s: ['Délka lomené čáry = součet všech úseků.', '2 + 5 + 3 = 10.', 'Výsledek: 10 cm.'] },
    ],
    mistakes: [
      { wrong: 'Délku lomené čáry odhadne podle nejdelšího úseku', right: 'Sečti všechny úseky: 2 + 5 + 3 = 10 cm', why: 'Délka lomené čáry je součet všech úseků, ne jen ten nejdelší.' },
      { wrong: 'Trojúhelník má 4 strany', right: 'Trojúhelník má 3 strany a 3 vrcholy', why: 'Žáci pletou trojúhelník se čtvercem. Troj- znamená tři.' },
    ],
    video: null
  },
  '6-1': {
    intro: 'Jednotky délky — mm, cm, dm, m.',
    sections: [
      { title: 'Přehled jednotek', body: '1 m = 10 dm\n1 dm = 10 cm\n1 cm = 10 mm' },
      { title: 'Převody', body: 'Na menší jednotky násobíme 10. Na větší jednotky dělíme 10.' },
    ],
    formulas: ['1 m = 10 dm = 100 cm = 1000 mm', '1 cm = 10 mm'],
    examples: [
      { q: '3 dm = ? cm', s: ['Z dm na cm jdu na menší jednotku → násobím 10.', '3 × 10 = 30.', 'Výsledek: 30 cm.'] },
      { q: '50 mm = ? cm', s: ['Z mm na cm jdu na větší jednotku → dělím 10.', '50 : 10 = 5.', 'Výsledek: 5 cm.'] },
    ],
    mistakes: [
      { wrong: '3 dm = 3 cm', right: '3 dm = 30 cm', why: 'Žák jen přepíše číslo bez převodu. Mezi dm a cm je poměr 10.' },
      { wrong: '50 mm = 500 cm', right: '50 mm = 5 cm', why: 'Na větší jednotku se dělí, ne násobí. mm je menší než cm, tak jich musí být míň.' },
    ],
    video: null
  },
  '6-2': {
    intro: 'Jednotky hmotnosti a času.',
    sections: [
      { title: 'Hmotnost', body: '1 kg = 1000 g. Hmotnost měříme na váze. Jednotky: g (gram), kg (kilogram).' },
      { title: 'Čas', body: '1 hodina = 60 minut. 1 minuta = 60 sekund. 1 den = 24 hodin.' },
    ],
    formulas: ['1 kg = 1000 g', '1 h = 60 min', '1 den = 24 h'],
    examples: [
      { q: '2 kg = ? g', s: ['Z kg na g → násobím 1000.', '2 × 1000 = 2000.', 'Výsledek: 2000 g.'] },
      { q: '3 h = ? min', s: ['Z hodin na minuty → násobím 60.', '3 × 60 = 180.', 'Výsledek: 180 min.'] },
    ],
    mistakes: [
      { wrong: '1 h = 100 min', right: '1 h = 60 min', why: 'Čas není desítkový. Hodina má 60 minut, ne 100.' },
      { wrong: '2 kg = 200 g', right: '2 kg = 2000 g', why: 'Mezi kg a g je tisíc, ne sto. Žák přidá jen dvě nuly místo tří.' },
    ],
    video: null
  },
  '6-3': {
    intro: 'Peníze — počítání s korunami.',
    sections: [
      { title: 'České peníze', body: 'Mince: 1, 2, 5, 10, 20, 50 Kč. Bankovky: 100, 200, 500, 1000 Kč. Při nákupu sčítáme ceny, při placení počítáme, kolik nám vrátí.' },
    ],
    formulas: ['Vrátí = zaplaceno − cena'],
    examples: [
      { q: 'Perníček stojí 25 Kč. Kolik zaplatíš za 3 perníčky?', s: ['3 stejné ceny → násobím.', '3 × 25 = 75.', 'Výsledek: 75 Kč.'] },
      { q: 'Nákup stojí 70 Kč, platíš stokorunou. Kolik ti vrátí?', s: ['Vrátí = zaplaceno − cena.', '100 − 70 = 30.', 'Výsledek: Vrátí ti 30 Kč.'] },
    ],
    mistakes: [
      { wrong: 'Za 3 perníčky po 25 Kč zaplatí 25 Kč', right: '3 × 25 = 75 Kč', why: 'Cena je za jeden kus, ne za všechny. Tři kusy musíš vynásobit.' },
      { wrong: 'Vrátí = cena − zaplaceno (70 − 100)', right: 'Vrátí = zaplaceno − cena = 100 − 70 = 30 Kč', why: 'Odčítá se v opačném pořadí. Od zaplacené částky odečteš cenu.' },
    ],
    video: null
  },
  '7-1': {
    intro: 'Velké opakování — počítání do 1000.',
    sections: [
      { title: 'Co umíme', body: 'Sčítáme a odčítáme do 1000, násobíme a dělíme z malé násobilky. V této oblasti si vše procvičíme dohromady.' },
    ],
    formulas: ['+, −, ×, : — vše do 1000'],
    examples: [
      { q: '320 + 150 = ?', s: ['Sčítám po řádech. Desítky: 2 + 5 = 7, stovky: 3 + 1 = 4.', 'Jednotky jsou 0 + 0 = 0.', 'Výsledek: 470.'] },
      { q: '480 − 260 = ?', s: ['Odčítám po řádech. Stovky: 4 − 2 = 2, desítky: 8 − 6 = 2.', 'Jednotky: 0 − 0 = 0.', 'Výsledek: 220.'] },
    ],
    mistakes: [
      { wrong: '320 + 150 = 370 (zapomene stovky)', right: '320 + 150 = 470', why: 'Při rychlém počítání žák sečte jen část řádů. Vždy projdi jednotky, desítky i stovky.' },
      { wrong: 'Plete znaménka: 480 − 260 sečte na 740', right: '480 − 260 = 220', why: 'Nepozorné čtení znaménka. Nejdřív se podívej, jestli sčítáš, nebo odčítáš.' },
    ],
    video: null
  },
  '7-2': {
    intro: 'Násobení a dělení 10 a 100.',
    sections: [
      { title: 'Rychlé počítání s nulami', body: 'Násobíš 10 → přidáš nulu. Násobíš 100 → přidáš dvě nuly. Dělíš 10 → ubereš nulu. Dělíš 100 → ubereš dvě nuly.' },
    ],
    formulas: ['n × 100 → +00', 'n : 10 → −0'],
    examples: [
      { q: '7 × 100 = ?', s: ['Násobím 100 → přidám dvě nuly.', 'K 7 připíšu 00.', 'Výsledek: 700.'] },
      { q: '600 : 100 = ?', s: ['Dělím 100 → uberu dvě nuly.', 'Z 600 uberu 00.', 'Výsledek: 6.'] },
    ],
    mistakes: [
      { wrong: '7 × 100 = 70', right: '7 × 100 = 700', why: 'U násobení 100 se přidají dvě nuly, ne jedna.' },
      { wrong: '600 : 100 = 60', right: '600 : 100 = 6', why: 'Při dělení 100 se uberou dvě nuly. Žák ubere jen jednu.' },
    ],
    video: null
  },
  '7-3': {
    intro: 'Finální duel — mix všeho z 3. ročníku.',
    sections: [
      { title: 'Přehled 3. ročníku', body: 'Naučili jsme se: čísla do 1000, sčítání a odčítání, malou násobilku a dělení (i se zbytkem), obvody, jednotky a peníze.' },
    ],
    formulas: [],
    examples: [
      { q: 'Trojúhelník má strany 6, 8 a 10 cm. Obvod?', s: ['Obvod = součet všech tří stran.', 'O = 6 + 8 + 10.', 'Výsledek: O = 24 cm.'] },
      { q: '35 : 6 = ? (se zbytkem)', s: ['Největší násobek 6 do 35: 6 × 5 = 30.', 'Zbytek: 35 − 30 = 5. Kontrola: 5 < 6 ✓.', 'Výsledek: 5 (zbytek 5).'] },
    ],
    mistakes: [
      { wrong: '35 : 6 = 5 zbytek 6', right: '35 : 6 = 5 zbytek 5', why: 'Zbytek 6 = dělitel → vejde se tam ještě jedna šestka. Zbytek musí být menší než dělitel.' },
      { wrong: 'Obvod trojúhelníku spočítá jen 6 + 8 = 14', right: 'O = 6 + 8 + 10 = 24 cm', why: 'Trojúhelník má tři strany. Nezapomeň přičíst i třetí.' },
    ],
    video: null
  }
};
