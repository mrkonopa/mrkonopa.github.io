/* ══════════════════════════════════════════════════════════════════
   RPG Matematika 8 — Teorie ke všem 21 misím (Citadela arcimága 🏛️)
   Zdroje: RVP ZV, učebnice Odvárko/Kadleček, CERMAT, MŠMT
   Videa: kanál @matematikajednoduse (Lucie Straková)
   ══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
window.RPG_LEARN_8 = {

/* ─── Oblast 1: ÚDOLÍ OPAKOVÁNÍ ───────────────────────────────── */

'1-1': {
 intro: '🏔️ Strážce údolí tě nepustí dál, dokud neovládneš celá čísla a jejich znaménka.',
 sections: [
  { h: 'Celá čísla a osa',
    p: ['Celá čísla jsou …, −3, −2, −1, 0, 1, 2, 3, … Záporná leží vlevo od nuly, kladná vpravo.',
        'Absolutní hodnota |a| je vzdálenost čísla od nuly — vždy nezáporná: |−5| = 5.'] },
  { h: 'Sčítání a odčítání',
    p: ['Stejná znaménka: sečti a ponech znaménko. Různá znaménka: odečti menší od většího a vezmi znaménko většího.',
        'Odčítání = přičtení opačného čísla: 5 − (−3) = 5 + 3 = 8.'] },
  { h: 'Násobení a dělení',
    p: ['Stejná znaménka → výsledek kladný. Různá znaménka → výsledek záporný.',
        '(−4) · (−3) = 12; (−4) · 3 = −12.'] },
 ],
 formulas: [
  '<b>− · − = +</b> · <b>+ · − = −</b>',
  '<b>a − (−b) = a + b</b>',
 ],
 examples: [
  { q: 'Spočítej: −7 + 12', s: ['Různá znaménka: 12 − 7 = 5, znaménko většího (+)', 'Výsledek: <b>5</b>'] },
  { q: 'Spočítej: (−6) · (−5)', s: ['Stejná znaménka → kladně', '6 · 5 = <b>30</b>'] },
 ],
 video: null,
},

'1-2': {
 intro: '🗻 Mlžný duch testuje tvou znalost racionálních čísel — zlomků i desetinných.',
 sections: [
  { h: 'Racionální čísla',
    p: ['Racionální číslo lze zapsat jako zlomek a/b (b ≠ 0). Patří sem celá čísla, zlomky i konečná a periodická desetinná čísla.'] },
  { h: 'Operace se zlomky',
    p: ['Sčítání/odčítání: převeď na společný jmenovatel, pak sčítej čitatele.',
        'Násobení: čitatel × čitatel, jmenovatel × jmenovatel. Dělení: násob převrácenou hodnotou.'] },
  { h: 'Převody zlomek ↔ desetinné',
    p: ['Zlomek na desetinné: vyděl čitatele jmenovatelem. 3/4 = 3 ÷ 4 = 0,75.',
        'Desetinné na zlomek: zapiš podle řádu a zkrať. 0,6 = 6/10 = 3/5.'] },
 ],
 formulas: [
  '<b>a/b · c/d = (a·c)/(b·d)</b>',
  '<b>a/b ÷ c/d = a/b · d/c</b>',
 ],
 examples: [
  { q: 'Spočítej: 2/3 + 1/6', s: ['Společný jmenovatel 6: 4/6 + 1/6 = 5/6', 'Výsledek: <b>5/6</b>'] },
  { q: 'Spočítej: 3/5 · 10/9', s: ['(3·10)/(5·9) = 30/45 = <b>2/3</b>'] },
 ],
 video: null,
},

'1-3': {
 intro: '⚗️ Alchymista počítá poměry lektvarů. Bez procent ti recept nevydá.',
 sections: [
  { h: 'Co jsou procenta',
    p: ['1 % = jedna setina celku = 0,01. Základ je celek (100 %), procentová část je úsek a počet procent je kolik setin bereme.'] },
  { h: 'Tři typy úloh',
    p: ['Procentová část: část = základ · (počet % ÷ 100).',
        'Počet procent: % = (část ÷ základ) · 100.',
        'Základ: základ = část ÷ (počet % ÷ 100).'] },
  { h: 'Sleva, zdražení, daň',
    p: ['Sleva 20 % → platíš 80 % původní ceny. Zdražení o 15 % → platíš 115 %.'] },
 ],
 formulas: [
  '<b>část = základ · p/100</b>',
  '<b>p % = (část/základ) · 100</b>',
  '<b>základ = část · 100/p</b>',
 ],
 examples: [
  { q: 'Kolik je 35 % z 240?', s: ['240 · 35/100 = 240 · 0,35 = <b>84</b>'] },
  { q: 'Kabát za 1 200 Kč zlevnili o 25 %. Nová cena?', s: ['Sleva: 1 200 · 0,25 = 300 Kč', '1 200 − 300 = <b>900 Kč</b>'] },
 ],
 video: null,
},

/* ─── Oblast 2: HORA PYTHAGOROVA ──────────────────────────────── */

'2-1': {
 intro: '⛰️ U paty hory tě zkouší duch čísel: ovládáš mocniny a odmocniny?',
 sections: [
  { h: 'Druhá mocnina a odmocnina',
    p: ['Druhá mocnina: a² = a · a (5² = 25). Druhá odmocnina √ je opačná operace: √25 = 5.',
        'Mocnina s exponentem n: aⁿ = a · a · … · a (n-krát).'] },
  { h: 'Mocniny deseti',
    p: ['10² = 100, 10³ = 1 000. Počet nul = exponent. Hodí se pro velká čísla a vědecký zápis.'] },
  { h: 'Odmocňování zpaměti',
    p: ['Znej druhé mocniny do 15²: 11²=121, 12²=144, 13²=169, 14²=196, 15²=225.'] },
 ],
 formulas: [
  '<b>a² = a · a</b> · <b>√(a²) = a</b> (pro a ≥ 0)',
  '<b>10ⁿ</b> = 1 a n nul',
 ],
 examples: [
  { q: 'Spočítej: 13²', s: ['13 · 13 = <b>169</b>'] },
  { q: 'Spočítej: √144', s: ['12 · 12 = 144 → <b>12</b>'] },
 ],
 video: { id: 'DVQl6pLx8qI', title: 'Druhá mocnina a odmocnina' },
},

'2-2': {
 intro: '🧗 Na svahu hory ti chybí délka lana. Spočítej přeponu Pythagorovou větou!',
 sections: [
  { h: 'Pythagorova věta',
    p: ['V pravoúhlém trojúhelníku platí: obsah čtverce nad přeponou = součet obsahů čtverců nad odvěsnami.',
        'Přepona c je nejdelší strana, leží naproti pravému úhlu. Odvěsny a, b svírají pravý úhel.'] },
  { h: 'Výpočet přepony',
    p: ['Známe obě odvěsny → c² = a² + b², pak c = √(a² + b²).',
        'Postup: umocni odvěsny, sečti, odmocni.'] },
 ],
 formulas: [
  '<b>c² = a² + b²</b>',
  '<b>c = √(a² + b²)</b>',
 ],
 examples: [
  { q: 'Odvěsny 3 cm a 4 cm. Přepona?', s: ['c² = 3² + 4² = 9 + 16 = 25', 'c = √25 = <b>5 cm</b>'] },
  { q: 'Odvěsny 6 cm a 8 cm. Přepona?', s: ['c² = 36 + 64 = 100', 'c = √100 = <b>10 cm</b>'] },
 ],
 video: { id: 'ssvz3u8imgk', title: 'Pythagorova věta' },
},

'2-3': {
 intro: '🪨 Skála se sesula a znáš jen přeponu a jednu odvěsnu. Dopočítej druhou odvěsnu.',
 sections: [
  { h: 'Výpočet odvěsny',
    p: ['Známe přeponu c a jednu odvěsnu → druhou odvěsnu vyjádříme z věty: a² = c² − b².',
        'Pozor: od čtverce přepony odečítáme čtverec známé odvěsny (ne naopak).'] },
  { h: 'Užití v praxi',
    p: ['Pythagorova věta řeší žebřík opřený o zeď, úhlopříčku obdélníku, výšku ve trojúhelníku.'] },
 ],
 formulas: [
  '<b>a² = c² − b²</b>',
  '<b>a = √(c² − b²)</b>',
 ],
 examples: [
  { q: 'Přepona 13 cm, odvěsna 5 cm. Druhá odvěsna?', s: ['a² = 13² − 5² = 169 − 25 = 144', 'a = √144 = <b>12 cm</b>'] },
  { q: 'Úhlopříčka obdélníku 10 cm, jedna strana 6 cm. Druhá strana?', s: ['√(10² − 6²) = √(100−36) = √64 = <b>8 cm</b>'] },
 ],
 video: { id: 'ssvz3u8imgk', title: 'Pythagorova věta' },
},

/* ─── Oblast 3: BAŽINY ROVNIC ─────────────────────────────────── */

'3-1': {
 intro: '🌿 Bahno tě stahuje dolů. Jen vyřešená rovnice ti ukáže pevnou cestu.',
 sections: [
  { h: 'Co je rovnice',
    p: ['Rovnice je rovnost dvou výrazů s neznámou (x). Řešit = najít hodnotu x, pro kterou rovnost platí.',
        'Co uděláme na jedné straně, musíme udělat i na druhé — rovnováha „vah".'] },
  { h: 'Základní úpravy',
    p: ['K oběma stranám můžeme přičíst/odečíst stejné číslo a obě strany vynásobit/vydělit stejným nenulovým číslem.',
        'Cíl: osamostatnit x na jedné straně.'] },
  { h: 'Zkouška',
    p: ['Dosaď výsledek zpět do původní rovnice — levá strana se musí rovnat pravé.'] },
 ],
 formulas: [
  '<b>x + a = b → x = b − a</b>',
  '<b>a · x = b → x = b / a</b>',
 ],
 examples: [
  { q: 'Vyřeš: x + 7 = 12', s: ['x = 12 − 7 = <b>5</b>'] },
  { q: 'Vyřeš: 4x = 20', s: ['x = 20 ÷ 4 = <b>5</b>'] },
 ],
 video: null,
},

'3-2': {
 intro: '🐸 Strážce bažin zadává rovnice na víc kroků. Ovládni je a projdeš.',
 sections: [
  { h: 'Rovnice na více kroků',
    p: ['Nejdřív převeď členy s x na jednu stranu a čísla na druhou. Pak vyděl koeficientem u x.',
        'Příklad: 3x + 5 = 20 → 3x = 15 → x = 5.'] },
  { h: 'Neznámá na obou stranách',
    p: ['Členy s x dej vlevo, čísla vpravo: 5x − 2 = 2x + 7 → 5x − 2x = 7 + 2 → 3x = 9 → x = 3.'] },
 ],
 formulas: [
  '<b>Postup:</b> x vlevo, čísla vpravo, pak ÷ koeficient',
 ],
 examples: [
  { q: 'Vyřeš: 3x + 5 = 20', s: ['3x = 20 − 5 = 15', 'x = 15 ÷ 3 = <b>5</b>'] },
  { q: 'Vyřeš: 5x − 2 = 2x + 7', s: ['5x − 2x = 7 + 2', '3x = 9 → x = <b>3</b>'] },
 ],
 video: null,
},

'3-3': {
 intro: '🗺️ Ztracený poutník popíše svůj problém slovy. Přelož ho do rovnice a vyřeš.',
 sections: [
  { h: 'Od slov k rovnici',
    p: ['1) Označ neznámou x. 2) Vyjádři ostatní veličiny pomocí x. 3) Sestav rovnici podle vztahu ze zadání. 4) Vyřeš a napiš odpověď.'] },
  { h: 'Typické formulace',
    p: ['„O 5 více" → +5. „Třikrát tolik" → ·3. „Dohromady" → součet se rovná celku.'] },
 ],
 formulas: [
  '<b>Postup:</b> neznámá → vztah → rovnice → řešení → odpověď',
 ],
 examples: [
  { q: 'Myslím si číslo. Jeho trojnásobek zvětšený o 4 je 19. Které?', s: ['3x + 4 = 19', '3x = 15 → x = <b>5</b>'] },
 ],
 video: null,
},

/* ─── Oblast 4: VĚŽE ALGEBRY ──────────────────────────────────── */

'4-1': {
 intro: '🏰 Strážce věží ti dá výraz a hodnotu. Dosaď a vypočítej.',
 sections: [
  { h: 'Algebraický výraz',
    p: ['Výraz obsahuje čísla, proměnné a operace, ale nemá znaménko rovná se (na rozdíl od rovnice).',
        'Dosazení = nahrazení proměnné konkrétním číslem a výpočet.'] },
  { h: 'Pozor na pořadí a znaménka',
    p: ['Dodržuj pořadí operací. U záporných hodnot dej proměnnou do závorky: pro x = −2 je x² = (−2)² = 4.'] },
 ],
 formulas: [
  '<b>Dosazení:</b> nahraď proměnnou číslem, dodrž pořadí operací',
 ],
 examples: [
  { q: 'Urči hodnotu 2x + 3 pro x = 4', s: ['2 · 4 + 3 = 8 + 3 = <b>11</b>'] },
  { q: 'Urči hodnotu x² − 1 pro x = −3', s: ['(−3)² − 1 = 9 − 1 = <b>8</b>'] },
 ],
 video: null,
},

'4-2': {
 intro: '✨ Kouzelná formule se skrývá ve vzorcích. Ovládni druhou mocninu součtu a rozdílu.',
 sections: [
  { h: 'Roznásobení závorek',
    p: ['(a + b)(c + d) = ac + ad + bc + bd — každý člen s každým.',
        'Jednočlen před závorkou: a(b + c) = ab + ac.'] },
  { h: 'Vzorce',
    p: ['Druhá mocnina součtu: (a + b)² = a² + 2ab + b².',
        'Druhá mocnina rozdílu: (a − b)² = a² − 2ab + b².',
        'Rozdíl čtverců: (a + b)(a − b) = a² − b².'] },
 ],
 formulas: [
  '<b>(a + b)² = a² + 2ab + b²</b>',
  '<b>(a − b)² = a² − 2ab + b²</b>',
  '<b>(a + b)(a − b) = a² − b²</b>',
 ],
 examples: [
  { q: 'Rozepiš (x + 3)²', s: ['x² + 2·x·3 + 3² = <b>x² + 6x + 9</b>'] },
  { q: 'Rozepiš (x − 5)(x + 5)', s: ['Rozdíl čtverců: x² − 25', 'Výsledek: <b>x² − 25</b>'] },
 ],
 video: { id: 'nD2ZY0V5aPE', title: 'Výrazy – vzorce' },
},

'4-3': {
 intro: '🔮 Mistr algebry žádá zjednodušení. Vytkni společného činitele před závorku.',
 sections: [
  { h: 'Vytýkání',
    p: ['Vytýkání je opak roznásobení: najdeme společného činitele všech členů a dáme ho před závorku.',
        '6x + 9 = 3·(2x + 3), protože 3 dělí 6 i 9.'] },
  { h: 'Společný činitel',
    p: ['Vytýkáme největší společný dělitel čísel a nejnižší mocninu společné proměnné.',
        '4x² + 8x = 4x·(x + 2).'] },
 ],
 formulas: [
  '<b>ab + ac = a(b + c)</b>',
 ],
 examples: [
  { q: 'Vytkni: 6x + 9', s: ['Společný činitel 3', '3·(2x + 3) → <b>3(2x + 3)</b>'] },
  { q: 'Vytkni: 4x² + 8x', s: ['Společný činitel 4x', '<b>4x(x + 2)</b>'] },
 ],
 video: { id: 'LOuVE-8-3xs', title: 'Vytýkání' },
},

/* ─── Oblast 5: JEZERO KRUŽNIC ────────────────────────────────── */

'5-1': {
 intro: '🌊 Hladina jezera tvoří dokonalý kruh. Spočítej jeho obvod a obsah.',
 sections: [
  { h: 'Kruh a kružnice',
    p: ['Kružnice je čára, kruh je plocha uvnitř. Poloměr r je vzdálenost od středu k okraji, průměr d = 2r.',
        'Konstanta π (pí) ≈ 3,14 vyjadřuje poměr obvodu k průměru.'] },
  { h: 'Obvod a obsah',
    p: ['Obvod kruhu: o = 2 · π · r = π · d.',
        'Obsah kruhu: S = π · r².'] },
 ],
 formulas: [
  '<b>Obvod:</b> o = 2 · π · r',
  '<b>Obsah:</b> S = π · r²',
  '<b>π ≈ 3,14</b>',
 ],
 examples: [
  { q: 'Kruh s r = 5 cm. Obvod? (π ≈ 3,14)', s: ['o = 2 · 3,14 · 5 = <b>31,4 cm</b>'] },
  { q: 'Kruh s r = 5 cm. Obsah?', s: ['S = 3,14 · 5² = 3,14 · 25 = <b>78,5 cm²</b>'] },
 ],
 video: { id: 'Cj3fwDlrpPM', title: 'Obvod a obsah kruhu' },
},

'5-2': {
 intro: '🛢️ Ze dna jezera vyčnívá válcová věž. Spočítej její povrch a objem.',
 sections: [
  { h: 'Válec',
    p: ['Válec má dvě kruhové podstavy (poloměr r) a plášť o výšce v. Plášť rozvinutý je obdélník o stranách 2πr a v.'] },
  { h: 'Povrch a objem',
    p: ['Objem: V = π · r² · v (obsah podstavy × výška).',
        'Povrch: S = 2 · π · r² + 2 · π · r · v (dvě podstavy + plášť).'] },
 ],
 formulas: [
  '<b>Objem válce:</b> V = π · r² · v',
  '<b>Povrch válce:</b> S = 2πr² + 2πrv = 2πr(r + v)',
 ],
 examples: [
  { q: 'Válec r = 3 cm, v = 10 cm. Objem? (π ≈ 3,14)', s: ['V = 3,14 · 3² · 10 = 3,14 · 90 = <b>282,6 cm³</b>'] },
  { q: 'Tentýž válec. Povrch?', s: ['S = 2·3,14·3·(3+10) = 6,28·3·13 = <b>244,92 cm²</b>'] },
 ],
 video: { id: 'GG9WF955El4', title: 'Objem a povrch válce' },
},

'5-3': {
 intro: '🎣 Rybář u jezera má praktické úlohy. Použij obvod, obsah i válec ve slovních úlohách.',
 sections: [
  { h: 'Řešení slovních úloh',
    p: ['Rozpoznej, zda jde o obvod (délka okraje), obsah (plocha) nebo objem (kolik se vejde).',
        'Hlídej jednotky a zaokrouhlení podle zadání.'] },
  { h: 'Typické situace',
    p: ['Plot kolem kruhového záhonu → obvod. Trávník v kruhu → obsah. Voda v sudu (válci) → objem.'] },
 ],
 formulas: [
  '<b>Obvod:</b> o = 2πr · <b>Obsah:</b> S = πr² · <b>Objem válce:</b> V = πr²v',
 ],
 examples: [
  { q: 'Kruhový bazén r = 2 m. Kolik m² plachty na zakrytí? (π ≈ 3,14)', s: ['S = 3,14 · 2² = 3,14 · 4 = <b>12,56 m²</b>'] },
 ],
 video: null,
},

/* ─── Oblast 6: DÍLNA KONSTRUKCÍ ──────────────────────────────── */

'6-1': {
 intro: '🔧 V dílně se rýsuje. Pochop množiny bodů dané vlastnosti — základ konstrukcí.',
 sections: [
  { h: 'Množina bodů dané vlastnosti',
    p: ['Je to soubor všech bodů, které splňují nějakou podmínku. Často je to čára (přímka, kružnice).'] },
  { h: 'Důležité množiny',
    p: ['Body ve stejné vzdálenosti od daného bodu → kružnice.',
        'Body ve stejné vzdálenosti od dvou bodů → osa úsečky.',
        'Body ve stejné vzdálenosti od ramen úhlu → osa úhlu.'] },
 ],
 formulas: [
  '<b>Stejná vzdálenost od bodu:</b> kružnice',
  '<b>Stejná vzdálenost od 2 bodů:</b> osa úsečky',
 ],
 examples: [
  { q: 'Jaká množina jsou body vzdálené 3 cm od bodu S?', s: ['Všechny ve vzdálenosti 3 cm → <b>kružnice se středem S a r = 3 cm</b>'] },
 ],
 video: null,
},

'6-2': {
 intro: '⚙️ Mistr konstruktér tě učí Thaletovu kružnici — klíč k pravým úhlům.',
 sections: [
  { h: 'Thaletova věta',
    p: ['Každý bod kružnice (kromě krajních) „vidí" průměr pod pravým úhlem.',
        'Trojúhelník s vrcholem na Thaletově kružnici a s přeponou rovnou průměru je pravoúhlý.'] },
  { h: 'Užití',
    p: ['Thaletovu kružnici používáme ke konstrukci pravého úhlu nebo tečny z bodu ke kružnici.'] },
 ],
 formulas: [
  '<b>Thaletova věta:</b> bod na kružnici nad průměrem → pravý úhel',
 ],
 examples: [
  { q: 'Trojúhelník ABC má přeponu AB rovnou průměru kružnice, C leží na kružnici. Jaký je úhel u C?', s: ['Podle Thaletovy věty → <b>90° (pravý)</b>'] },
 ],
 video: null,
},

'6-3': {
 intro: '📐 Závěrečná zkouška dílny: osy a souměrnosti v praktických konstrukcích.',
 sections: [
  { h: 'Osa úsečky a osa úhlu',
    p: ['Osa úsečky je kolmá k úsečce a prochází jejím středem. Osa úhlu dělí úhel na dvě shodné poloviny.'] },
  { h: 'Souměrnosti v konstrukcích',
    p: ['Osová a středová souměrnost pomáhají sestrojit obraz útvaru a řešit konstrukční úlohy.',
        'Postup konstrukce vždy popisujeme kroky a ověřujeme, zda splňuje zadání.'] },
 ],
 formulas: [
  '<b>Osa úsečky:</b> kolmá, prochází středem',
  '<b>Osa úhlu:</b> dělí úhel na dvě shodné poloviny',
 ],
 examples: [
  { q: 'Co tvoří osa úsečky AB?', s: ['Body stejně vzdálené od A i B', 'Je <b>kolmá k AB a prochází jejím středem</b>'] },
 ],
 video: null,
},

/* ─── Oblast 7: CITADELA ARCIMÁGA ─────────────────────────────── */

'7-1': {
 intro: '🏛️ Brána citadely. Zkouška ohněm kombinuje všechna témata 8. ročníku.',
 sections: [
  { h: 'Co tě čeká',
    p: ['Mix celých a racionálních čísel, procent, mocnin, Pythagorovy věty, rovnic, výrazů a kružnic.',
        'Projdi si teorii misí, kde si nejsi jistý.'] },
  { h: 'Strategie',
    p: ['Čti pozorně, načrtni obrázek u geometrie, dělej zkoušku u rovnic, hlídej jednotky.'] },
 ],
 formulas: [
  '<b>Pythagoras:</b> c² = a² + b² · <b>Kruh:</b> S = πr²',
  '<b>(a ± b)² = a² ± 2ab + b²</b>',
 ],
 examples: [
  { q: 'Rozcvička: 25 % z 80 + √49', s: ['25 % z 80 = 20', '√49 = 7', '20 + 7 = <b>27</b>'] },
 ],
 video: null,
},

'7-2': {
 intro: '📜 Přijímačkový trénink — úlohy ve stylu CERMAT. Připrav se na přijímačky!',
 sections: [
  { h: 'Jak na přijímačkové úlohy',
    p: ['Čti zadání dvakrát. Rozlož složenou úlohu na kroky. Hlídej čas — lehčí úlohy nejdřív.',
        'U výběru ze 4 můžeš dosadit nabízené možnosti a ověřit.'] },
  { h: 'Časté typy',
    p: ['Procenta, poměry, rovnice ze slovní úlohy, obsahy a obvody, Pythagorova věta, čtení z grafu a tabulky.'] },
 ],
 formulas: [
  '<b>Tip:</b> u výběru ze 4 dosaď možnosti zpět do zadání',
 ],
 examples: [
  { q: 'Vlak ujede 240 km za 3 h. Průměrná rychlost?', s: ['v = s ÷ t = 240 ÷ 3 = <b>80 km/h</b>'] },
 ],
 video: null,
},

'7-3': {
 intro: '🔥 Finální duel s Arcimágem — nejtěžší výzva. Dokaž, že 8. ročník ovládáš!',
 sections: [
  { h: 'Před soubojem',
    p: ['Toto je vrchol — kombinace nejnáročnějších úloh z celého ročníku.',
        'Zopakuj si vzorce a postupy, ničeho se neboj a počítej s rozvahou.'] },
  { h: 'Klíčové vzorce na závěr',
    p: ['Měj v hlavě Pythagorovu větu, vzorce pro kruh a válec, algebraické vzorce a postup řešení rovnic.'] },
 ],
 formulas: [
  '<b>c = √(a² + b²)</b> · <b>V válce = πr²v</b>',
  '<b>(a + b)(a − b) = a² − b²</b>',
 ],
 examples: [
  { q: 'Vyřeš: 2(x − 3) = x + 4', s: ['2x − 6 = x + 4', '2x − x = 4 + 6', 'x = <b>10</b>'] },
 ],
 video: null,
},

};
})();
