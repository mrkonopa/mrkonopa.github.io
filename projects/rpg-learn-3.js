/* rpg-learn-3.js — RPG Matematika 3 — teorie (21 misí)
   Kouzelný les 🌳 | Matematika 3. ročník
   window.RPG_LEARN_3 = { '<mid>': {intro, sections[], formulas[], examples[], mistakes[], video} }
*/
window.RPG_LEARN_3 = {
  '1-1': {
    intro: '🐌 Hlemýžď Počtář si na krunýř pomalu zapisuje čísla. „Než projdeš, pověz mi, co který řád znamená," šeptá. Nauč se číst stovky, desítky a jednotky.',
    sections: [
      { title: 'Trojciferná čísla', body: 'Čísla od 100 do 999 mají tři číslice. Zleva: stovky, desítky, jednotky. Např. 472 = 4 stovky + 7 desítek + 2 jednotky.' },
      { title: 'Rozklad čísla', body: 'Každé číslo umíme rozložit na řády. 305 = 3 stovky + 0 desítek + 5 jednotek = 300 + 0 + 5.' },
    ,
      { title: 'Pomůcka: rozděl si číslo zprava', body: 'Řády se počítají odzadu: první číslice zprava jsou jednotky, druhá desítky, třetí stovky. U čísla 472 zakryj prstem poslední dvě číslice — zbyde 4, a to jsou stovky. Pozor na nulu uprostřed: v čísle 305 nula neznamená „nic tam není", ale „žádné desítky".' }
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
    intro: '🐞 Beruška Soudkyně drží v tlapkách dvě čísla. „Které je větší?" ptá se přísně. Nauč se porovnávat čísla do 1000 pomocí znaků < a >.',
    sections: [
      { title: 'Jak porovnat dvě čísla', body: 'Porovnáváme od nejvyššího řádu. Nejdřív stovky — kdo má víc stovek, má větší číslo. Jsou-li stovky stejné, porovnáme desítky a pak jednotky.' },
    ,
      { title: 'Když se první číslice shodují', body: 'Nejčastější chyba je porovnat čísla podle toho, které „vypadá delší". Řiď se řády zleva: 6 789 a 6 798 mají stejné tisíce i stovky, takže rozhodnou až desítky — 8 je méně než 9. Šipka u znaku vždycky ukazuje na menší číslo: 6 789 < 6 798.' }
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
    intro: '🦗 Cvrček Skokan skáče po číselné ose a nikdy nedopadne přesně. „Zaokrouhli mě!" volá. Nauč se zaokrouhlovat na desítky a stovky.',
    sections: [
      { title: 'Pravidlo zaokrouhlování', body: 'Podíváme se na číslici vpravo od místa, na které zaokrouhlujeme. Je-li 0–4, zaokrouhlíme dolů. Je-li 5–9, zaokrouhlíme nahoru.' },
      { title: 'Příklady', body: '347 na desítky: jednotky jsou 7 → nahoru → 350. Na stovky: desítky jsou 4 → dolů → 300.' },
    ,
      { title: 'Zaokrouhlené číslo se píše s ≈', body: 'Zaokrouhlením se číslo změní, proto se mezi ně nepíše rovnítko, ale vlnovka: 347 ≈ 350. Rovnítko by znamenalo, že 347 a 350 je totéž — a to není pravda. Rozhoduje vždy jen jedna číslice: ta hned vpravo od místa, na které zaokrouhluješ.' }
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
    intro: '🍄 Muchomůrka roste a roste a rozsypala houby po celé mýtině. „Spočítej je všechny dohromady," směje se. Procvič sčítání do 1000.',
    sections: [
      { title: 'Sčítání po řádech', body: 'Sčítáme stejné řády: stovky ke stovkám, desítky k desítkám, jednotky k jednotkám. Přesáhne-li součet 9, přeneseme jednotku do vyššího řádu.' },
    ,
      { title: 'Jak sčítat pod sebou', body: 'Napiš čísla pod sebe tak, aby jednotky byly pod jednotkami a desítky pod desítkami. Sčítej zprava. Když ti vyjde víc než 9, napiš poslední číslici a jedničku si přenes do dalšího sloupce. Přenos si piš malinko nad další sloupec, ať na něj nezapomeneš.' }
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
    intro: '🐛 Hladová housenka ukusuje z listů. „Kolik ti zbyde, když ti ujím?" mlaská. Nauč se odčítat čísla do 1000.',
    sections: [
      { title: 'Odčítání po řádech', body: 'Odčítáme zprava. Je-li číslice nahoře menší než dole, půjčíme si jednu z vyššího řádu (desítku, stovku).' },
    ,
      { title: 'Jak si půjčit z vyššího řádu', body: 'Když nahoře stojí menší číslice než dole, půjč si jednu desítku ze sloupce vlevo. Ze 4 se tak stane 14 a sousedovi vlevo o jednu ubude. U čísla jako 8 000 se půjčuje přes několik sloupců najednou — vyplatí se počítat pomalu a nahlas.' }
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
    intro: '🦋 Motýlí duch mluví jen v příbězích. „Rozluštíš, jestli mám přidat, nebo ubrat?" Nauč se poznat, kdy se ve slovní úloze sčítá a kdy odčítá.',
    sections: [
      { title: 'Postup řešení', body: '1. Přečtu úlohu a vím, co hledám.\n2. Rozhodnu: sčítám, nebo odčítám?\n3. Vypočítám.\n4. Odpovím větou.' },
    ,
      { title: 'Jak poznat, co se má počítat', body: 'Slova v úloze napovídají: „přibylo", „celkem", „dohromady" znamenají sčítání. „Ubylo", „zbylo", „utratil", „o kolik víc" znamenají odčítání. Než začneš počítat, řekni si nahlas, co vlastně hledáš — ušetří ti to většinu chyb.' }
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
    intro: '🦊 Lstivá liška si připravila past ze stejně velkých hromádek. „Kolik je jich dohromady, když je nebudeš počítat po jedné?" Nauč se malou násobilku.',
    sections: [
      { title: 'Co je násobení', body: 'Násobení je opakované sčítání. 4 × 3 znamená 3 + 3 + 3 + 3 = 12. Musíme znát malou násobilku zpaměti!' },
      { title: 'Zákon zaměnitelnosti', body: 'Nezáleží na pořadí: 6 × 7 = 7 × 6 = 42.' },
    ,
      { title: 'Násobilku si spočítáš, i když ji zapomeneš', body: 'Když si nevzpomeneš na 7 × 8, jdi od něčeho, co víš: 7 × 10 = 70, a od toho odečti dvě sedmičky: 70 − 14 = 56. Podobně 9 × 6 spočítáš jako 10 × 6 = 60 mínus jedna šestka: 54. Zákon zaměnitelnosti ti navíc půlí práci — stačí umět jednu polovinu tabulky.' }
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
    intro: '🐺 Vlčí mládě vyje na měsíc a přidává za čísla nuly. „Kolik bude desetkrát tolik?" Nauč se násobit deseti, stem a desítkami.',
    sections: [
      { title: 'Násobení 10 a 100', body: 'Násobíme-li 10, připíšeme na konec jednu nulu. Násobíme-li 100, připíšeme dvě nuly.' },
      { title: 'Násobení desítkami', body: '6 × 40 = 6 × 4 × 10 = 24 × 10 = 240.' },
    ,
      { title: 'Nuly připisuj, ale až nakonec', body: 'U 6 × 40 nejdřív vynásob 6 × 4 = 24 a teprve pak připiš nulu: 240. Když nuly připíšeš dřív, snadno jich napíšeš víc nebo míň. Kolik nul je v činiteli, tolik jich připíšeš k výsledku.' }
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
    intro: '🦝 Mýval Škodíš schoval slovní úlohu do bahna. „Poznáš, kolikrát se to má vzít?" Nauč se řešit slovní úlohy s násobením.',
    sections: [
      { title: 'Kdy násobíme?', body: 'Násobíme, když máme několik stejných skupin a chceme zjistit celkový počet. Např. 5 košíků po 6 hubách = 5 × 6 = 30 hub.' },
    ,
      { title: 'Kolik skupin a kolik v jedné', body: 'V úloze si vždy najdi dvě čísla: kolik je skupin a kolik je v jedné skupině. „5 košíků po 6 houbách" — 5 skupin, 6 v každé, tedy 5 × 6 = 30. Odpověz celou větou: „V košících je dohromady 30 hub." Samotné číslo není odpověď.' }
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
    intro: '🐿️ Lakomá veverka má hromadu oříšků a chce je rozdělit spravedlivě. „Kolik jich připadne na každého?" Nauč se dělit beze zbytku.',
    sections: [
      { title: 'Dělení jako opak násobení', body: 'Dělení je opak násobení. 56 : 7 = ? → ptáme se: 7 × ? = 56 → 7 × 8 = 56 → výsledek je 8.' },
    ,
      { title: 'Dělení si ověříš násobením', body: 'Každé dělení jde zkontrolovat obráceně: vyjde-li 56 : 7 = 8, musí platit 7 × 8 = 56. Když ti kontrola nesedí, výsledek je špatně. Tenhle trik funguje vždycky a zabere pár vteřin.' }
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
    intro: '🦔 Ježek Bodlináč nikdy nevyjde přesně. „A co s tím, co zbude?" bodá. Nauč se dělit se zbytkem a hlídat, aby zbytek byl menší než dělitel.',
    sections: [
      { title: 'Zbytek po dělení', body: 'Ne vždy dělení vyjde přesně. Zbytek je to, co zbyde. Platí: dělenec = dělitel × podíl + zbytek. Zbytek je vždy menší než dělitel!' },
    ,
      { title: 'Zbytek musí být menší než dělitel', body: 'Kdyby byl zbytek stejný nebo větší než dělitel, znamenalo by to, že se do něj dělitel vejde ještě jednou. U 29 : 6 nemůže vyjít „3 zbytek 11" — jedenáct šestek by pobralo ještě jednu. Správně je 4 (zbytek 5), protože 5 < 6.' }
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
    intro: '🦡 Jezevec Hrabal rozhrabal mraveniště na stejné díly. „Kolik do každého?" Nauč se řešit slovní úlohy s dělením.',
    sections: [
      { title: 'Kdy dělíme?', body: 'Dělíme, když rozdělujeme stejnoměrně (kolik každému?) nebo zjišťujeme, kolikrát se menší číslo vejde do většího.' },
    ,
      { title: 'Někdy se ptáme na počet, jindy na velikost', body: 'Dvě různé otázky vedou na totéž dělení. „Kolik dostane každý z 6 dětí?" i „Pro kolik dětí to vystačí po 6?" — obojí je 42 : 6. Když v úloze zbyde zbytek, přečti si ji znovu: ptá se na plné díly, nebo na to, co zbylo?' }
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
    intro: '🌳 Starý dub natáhl tři kořeny do trojúhelníku. „Kolik je to dokola?" duní. Nauč se počítat obvod trojúhelníku.',
    sections: [
      { title: 'Obvod = obrys tvaru', body: 'Obvod je délka celé hranice tvaru. U trojúhelníku sečteme délky všech tří stran.' },
      { title: 'Rovnostranný trojúhelník', body: 'Má všechny tři strany stejně dlouhé, takže obvod = 3 × strana.' },
    ,
      { title: 'Obvod obcházíš po hranici', body: 'Představ si, že po obrysu tvaru jdeš prstem dokola. Délka té cesty je obvod. U trojúhelníku sečteš tři strany — a všechny musí být ve stejné jednotce. Než sečteš, zkontroluj, jestli není jedna strana v milimetrech a druhá v centimetrech.' }
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
    intro: '🪵 Dřevěný golem má tělo z rovných prken. „Změř mě po obvodu," vrže. Nauč se obvod čtverce a obdélníku.',
    sections: [
      { title: 'Čtverec', body: 'Čtverec má 4 stejné strany. Obvod spočítáš tak, že sečteš všechny 4 strany (strana + strana + strana + strana).' },
      { title: 'Obdélník', body: 'Obdélník má čtyři strany — dvě delší a dvě kratší. Obvod je součet všech čtyř stran.' },
    ,
      { title: 'U obdélníku stačí sečíst dvě strany a zdvojnásobit', body: 'Obdélník má dvě delší a dvě kratší strany, takže místo sčítání čtyř čísel sečti jen sousední dvě a výsledek vezmi dvakrát. Pro strany 8 cm a 5 cm: 8 + 5 = 13, pak 2 × 13 = 26 cm. U čtverce je to ještě rychlejší: stačí jedna strana krát čtyři.' }
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
    intro: '🍂 Listový přízrak se skládá z čar a tvarů. „Poznáš, co jsem?" šustí. Nauč se rozlišit úsečku, lomenou čáru a rovinné obrazce.',
    sections: [
      { title: 'Úsečka', body: 'Úsečka je rovná čára mezi dvěma body. Označujeme ji dvěma písmeny, např. úsečka AB. Měříme ji pravítkem v cm a mm.' },
      { title: 'Lomená čára', body: 'Lomená čára je několik úseček spojených za sebou. Její délku spočítáš součtem délek všech úseků.' },
      { title: 'Rovinné obrazce', body: 'Trojúhelník má 3 strany a 3 vrcholy (rohy). Čtverec a obdélník mají 4 strany a 4 vrcholy.' },
    ,
      { title: 'Čára, nebo obrazec?', body: 'Úsečka a lomená čára jsou čáry — mají jen délku. Trojúhelník, čtverec a obdélník jsou obrazce — mají hranici i plochu uvnitř. Lomená čára se od obrazce liší tím, že není uzavřená: nezačíná a nekončí ve stejném bodě. Délku lomené čáry spočítáš součtem všech jejích úseků, stejně jako obvod.' }
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
    intro: '🦉 Moudrá sova měří větve od milimetrů po metry. „Kolik je to v jiné jednotce?" houká. Nauč se převádět jednotky délky.',
    sections: [
      { title: 'Přehled jednotek', body: '1 m = 10 dm\n1 dm = 10 cm\n1 cm = 10 mm' },
      { title: 'Převody', body: 'Na menší jednotky násobíme 10. Na větší jednotky dělíme 10.' },
    ,
      { title: 'Menší jednotka, větší číslo', body: 'Když převádíš na menší jednotku, číslo vzroste — 3 m je 30 dm, protože decimetry jsou drobnější. Když převádíš na větší jednotku, číslo klesne. Než výsledek napíšeš, zeptej se sám sebe: mělo mi číslo vyjít větší, nebo menší? Chytíš tím většinu překlepů.' }
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
    intro: '⏳ Hodinový skřítek přesýpá čas a váží houby. „Kolik minut a kolik gramů?" chichotá se. Nauč se jednotky hmotnosti a času.',
    sections: [
      { title: 'Hmotnost', body: '1 kg = 1000 g. Hmotnost měříme na váze. Jednotky: g (gram), kg (kilogram).' },
      { title: 'Čas', body: '1 hodina = 60 minut. 1 minuta = 60 sekund. 1 den = 24 hodin.' },
    ,
      { title: 'Čas se nepočítá po desítkách', body: 'U délky i hmotnosti se posouváš po desítkách a stovkách, ale u času ne — hodina má 60 minut, ne 100. Proto 1 h 15 min není 115 minut, ale 75 minut. Vždy nejdřív převeď hodiny na minuty a teprve pak přičti zbytek.' }
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
    intro: '🐦 Straka zlodějka sbírá mince do hnízda. „Kolik ti zbyde a kolik ti vrátím?" Nauč se počítat s korunami.',
    sections: [
      { title: 'České peníze', body: 'Mince: 1, 2, 5, 10, 20, 50 Kč. Bankovky: 100, 200, 500, 1000 Kč. Při nákupu sčítáme ceny, při placení počítáme, kolik nám vrátí.' },
    ,
      { title: 'Kolik zaplatím a kolik mi vrátí', body: 'Při nákupu ceny sčítáš. Když platíš větší bankovkou, vrácené peníze jsou rozdíl: kolik jsi dal mínus kolik to stálo. Zaplatíš-li 200 Kč za nákup 165 Kč, vrátí ti 200 − 165 = 35 Kč. Zkontroluj se selským rozumem: vrácená částka musí být menší než to, cos podal.' }
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
    intro: '🐺 Šedý vlk zkouší všechno, co už umíš. „Projdeš, jen když nic nezapomeneš." Velké opakování počítání do 1000.',
    sections: [
      { title: 'Co umíme', body: 'Sčítáme a odčítáme do 1000, násobíme a dělíme z malé násobilky. V této oblasti si vše procvičíme dohromady.' },
    ,
      { title: 'Nejdřív odhad, potom výpočet', body: 'Než začneš počítat, odhadni výsledek zaokrouhlením: 387 + 245 je zhruba 400 + 250 = 650. Když ti pak vyjde 632, sedí to. Kdyby vyšlo 1 632, hned víš, že je někde chyba. Odhad zabere pár vteřin a ušetří opravování.' }
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
    intro: '🌑 Stín lesa mizí a objevuje se s nulami navíc. „Desetkrát? Stokrát?" Opakování násobení a dělení deseti a stem.',
    sections: [
      { title: 'Rychlé počítání s nulami', body: 'Násobíš 10 → přidáš nulu. Násobíš 100 → přidáš dvě nuly. Dělíš 10 → ubereš nulu. Dělíš 100 → ubereš dvě nuly.' },
    ,
      { title: 'Přidávám nulu, nebo ubírám?', body: 'Násobení číslo zvětšuje, takže se nula přidává. Dělení zmenšuje, takže se ubírá. 250 × 10 = 2 500, ale 250 : 10 = 25. Když si nejsi jistý, řekni si, jestli má výsledek vyjít větší, nebo menší.' }
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
    intro: '👑 Král lesa čeká na mýtině. „Ukaž mi všechno, co ses naučil." Finální duel ze všeho, co třetí ročník přinesl.',
    sections: [
      { title: 'Přehled 3. ročníku', body: 'Naučili jsme se: čísla do 1000, sčítání a odčítání, malou násobilku a dělení (i se zbytkem), obvody, jednotky a peníze.' },
    ,
      { title: 'Na co si dát pozor v závěrečném duelu', body: 'Nejčastější chyby celého ročníku: zapomenutý přenos při sčítání, zbytek větší než dělitel, smíchané jednotky v jednom příkladu a rovnítko místo ≈ u zaokrouhlení. Když si na tyhle čtyři věci dáš pozor, projdeš.' }
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
