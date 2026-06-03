/* ══════════════════════════════════════════════════════════════════
   RPG Matematika 9 — Teorie ke všem 21 misím (NULL_BYTE 💻 cyberpunk)
   Zdroje: RVP ZV, učebnice Odvárko/Kadleček, CERMAT, MŠMT
   Videa: kanál @matematikajednoduse (Lucie Straková)
   ══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
window.RPG_LEARN_9 = {

/* ─── Oblast 1: VSTUPNÍ TERMINÁL ──────────────────────────────── */

'1-1': {
 intro: '🔓 [BOOT] Vstupní terminál vyžaduje ověření základů. Zopakuj početní operace a pořadí.',
 sections: [
  { h: 'Obor čísel',
    p: ['Pracujeme s racionálními čísly: celá, zlomky, desetinná (konečná i periodická). Lze je zapsat jako zlomek a/b.'] },
  { h: 'Pořadí operací',
    p: ['Závorky → mocniny a odmocniny → násobení a dělení → sčítání a odčítání.',
        'Operace stejné úrovně počítej zleva doprava.'] },
  { h: 'Znaménka',
    p: ['Stejná znaménka při násobení/dělení → kladně, různá → záporně. Odčítání = přičtení opačného.'] },
 ],
 formulas: [
  '<b>Pořadí:</b> ( ) → ^ √ → × ÷ → + −',
  '<b>− · − = +</b>',
 ],
 examples: [
  { q: 'Spočítej: 2 + 3 · 4²', s: ['Mocnina: 4² = 16', 'Násobení: 3 · 16 = 48', '2 + 48 = <b>50</b>'] },
 ],
 video: null,
},

'1-2': {
 intro: '📊 [SCAN] Procentní skener čte data v procentech a promile. Ovládni je a projdeš firewallem.',
 sections: [
  { h: 'Procenta a promile',
    p: ['1 % = 1/100 = 0,01. 1 ‰ (promile) = 1/1000 = 0,001. Promile se hodí pro malé podíly (alkohol v krvi, solnost).'] },
  { h: 'Tři základní úlohy',
    p: ['Část = základ · p/100. Počet procent = (část/základ)·100. Základ = část · 100/p.'] },
  { h: 'Změny v procentech',
    p: ['Zdražení o p % → násob (1 + p/100). Zlevnění o p % → násob (1 − p/100).'] },
 ],
 formulas: [
  '<b>část = základ · p/100</b>',
  '<b>1 ‰ = 0,001</b>',
 ],
 examples: [
  { q: 'Kolik je 8 % z 1 500 Kč?', s: ['1 500 · 0,08 = <b>120 Kč</b>'] },
  { q: 'Cena 600 Kč vzroste o 20 %. Nová cena?', s: ['600 · 1,20 = <b>720 Kč</b>'] },
 ],
 video: null,
},

'1-3': {
 intro: '⚠️ [WARN] Záporná zóna — datové toky se znaménky. Spočítej je správně, jinak crash.',
 sections: [
  { h: 'Celá čísla a absolutní hodnota',
    p: ['|a| je vzdálenost od nuly, vždy nezáporná. |−7| = 7, |7| = 7.'] },
  { h: 'Operace se znaménky',
    p: ['Sčítání různých znamének: odečti menší od většího, vezmi znaménko většího.',
        'Násobení/dělení: stejná znaménka → +, různá → −.'] },
 ],
 formulas: [
  '<b>a − (−b) = a + b</b>',
  '<b>(−)·(−) = (+)</b>, <b>(−)·(+) = (−)</b>',
 ],
 examples: [
  { q: 'Spočítej: −8 − (−15)', s: ['−8 + 15 = <b>7</b>'] },
  { q: 'Spočítej: (−12) ÷ (−4)', s: ['Stejná znaménka → kladně', '12 ÷ 4 = <b>3</b>'] },
 ],
 video: null,
},

/* ─── Oblast 2: MOCNINOVÝ REAKTOR ─────────────────────────────── */

'2-1': {
 intro: '⚡ [CORE] Energetické články běží na mocninách a odmocninách. Nabij je správně.',
 sections: [
  { h: 'Mocniny a odmocniny',
    p: ['aⁿ = a · a · … · a (n-krát). √a je číslo, jehož druhá mocnina je a (pro a ≥ 0).',
        'a⁰ = 1 (pro a ≠ 0). a¹ = a.'] },
  { h: 'Odmocniny zpaměti',
    p: ['Znej druhé mocniny do 20² a odpovídající odmocniny. √169 = 13, √225 = 15, √400 = 20.'] },
 ],
 formulas: [
  '<b>aⁿ = a · a · … · a</b> (n-krát)',
  '<b>a⁰ = 1</b> (a ≠ 0)',
 ],
 examples: [
  { q: 'Spočítej: 2⁵', s: ['2·2·2·2·2 = <b>32</b>'] },
  { q: 'Spočítej: √196', s: ['14 · 14 = 196 → <b>14</b>'] },
 ],
 video: { id: 'DVQl6pLx8qI', title: 'Druhá mocnina a odmocnina' },
},

'2-2': {
 intro: '🔋 [RULES] Reaktor vyžaduje pravidla pro počítání s mocninami. Sjednoť exponenty.',
 sections: [
  { h: 'Pravidla pro mocniny se stejným základem',
    p: ['Násobení: exponenty sčítáme. Dělení: exponenty odečítáme. Mocnina mocniny: exponenty násobíme.'] },
  { h: 'Mocnina součinu a podílu',
    p: ['(a · b)ⁿ = aⁿ · bⁿ. (a/b)ⁿ = aⁿ/bⁿ.'] },
 ],
 formulas: [
  '<b>aᵐ · aⁿ = aᵐ⁺ⁿ</b>',
  '<b>aᵐ ÷ aⁿ = aᵐ⁻ⁿ</b>',
  '<b>(aᵐ)ⁿ = aᵐ·ⁿ</b>',
 ],
 examples: [
  { q: 'Zjednoduš: 2³ · 2⁴', s: ['Sčítáme exponenty: 2³⁺⁴ = 2⁷ = <b>128</b>'] },
  { q: 'Zjednoduš: (3²)³', s: ['Násobíme exponenty: 3⁶ = <b>729</b>'] },
 ],
 video: { id: 'x0Yv5r2NjTU', title: 'Součin mocnin' },
},

'2-3': {
 intro: '🛰️ [SIGNAL] Vědecký zápis komprimuje obří čísla. A Pythagoras hlídá geometrii sítě.',
 sections: [
  { h: 'Vědecký (semilogaritmický) zápis',
    p: ['Číslo zapíšeme jako a · 10ⁿ, kde 1 ≤ a < 10. Velká čísla mají kladné n, malá záporné.',
        '6 500 = 6,5 · 10³. 0,0042 = 4,2 · 10⁻³.'] },
  { h: 'Pythagorova věta',
    p: ['V pravoúhlém trojúhelníku c² = a² + b² (c je přepona naproti pravému úhlu).',
        'Přepona: c = √(a²+b²). Odvěsna: a = √(c²−b²).'] },
 ],
 formulas: [
  '<b>Vědecký zápis:</b> a · 10ⁿ, 1 ≤ a < 10',
  '<b>c² = a² + b²</b>',
 ],
 examples: [
  { q: 'Zapiš vědecky: 73 000', s: ['7,3 · 10⁴ → <b>7,3 · 10⁴</b>'] },
  { q: 'Odvěsny 9 a 12. Přepona?', s: ['c² = 81 + 144 = 225', 'c = <b>15</b>'] },
 ],
 video: { id: 'ssvz3u8imgk', title: 'Pythagorova věta' },
},

/* ─── Oblast 3: ROVNICOVÝ PROCESOR ────────────────────────────── */

'3-1': {
 intro: '🧮 [SOLVE] Procesor čeká na hodnotu x. Vyřeš základní rovnici a odemkni jádro.',
 sections: [
  { h: 'Lineární rovnice',
    p: ['Rovnice s neznámou x v první mocnině. Cíl: osamostatnit x ekvivalentními úpravami.',
        'Co uděláš jedné straně, udělej i druhé.'] },
  { h: 'Postup a zkouška',
    p: ['Členy s x na jednu stranu, čísla na druhou, pak vyděl koeficientem. Výsledek ověř dosazením.'] },
 ],
 formulas: [
  '<b>ax + b = c → x = (c − b)/a</b>',
 ],
 examples: [
  { q: 'Vyřeš: 5x − 8 = 17', s: ['5x = 25', 'x = <b>5</b>'] },
 ],
 video: null,
},

'3-2': {
 intro: '🔁 [PARSE] Rovnice se závorkami a neznámou na obou stranách. Rozparsuj je.',
 sections: [
  { h: 'Odstranění závorek',
    p: ['Roznásob závorky (pozor na znaménko před závorkou): −(x − 3) = −x + 3.'] },
  { h: 'Neznámá na obou stranách',
    p: ['Členy s x dej vlevo, čísla vpravo, sečti a vyděl koeficientem.'] },
 ],
 formulas: [
  '<b>−(a − b) = −a + b</b>',
  '<b>Postup:</b> roznásob → x vlevo → ÷ koeficient',
 ],
 examples: [
  { q: 'Vyřeš: 3(x − 2) = x + 4', s: ['3x − 6 = x + 4', '3x − x = 4 + 6', '2x = 10 → x = <b>5</b>'] },
 ],
 video: null,
},

'3-3': {
 intro: '📐 [EXTRACT] Vyjádři neznámou ze vzorce a vyřeš slovní rovnici. Datová extrakce.',
 sections: [
  { h: 'Vyjádření neznámé ze vzorce',
    p: ['Se vzorcem zacházíme jako s rovnicí — osamostatníme hledanou veličinu ekvivalentními úpravami.',
        'Z S = a · b vyjádříme a = S / b.'] },
  { h: 'Slovní rovnice',
    p: ['Označ neznámou, vyjádři vztahy, sestav rovnici, vyřeš a napiš odpověď.'] },
 ],
 formulas: [
  '<b>S = a·b → a = S/b</b>',
  '<b>o = 2(a+b) → a = o/2 − b</b>',
 ],
 examples: [
  { q: 'Ze vzorce V = a³ vyjádři a', s: ['Odmocni obě strany (třetí odmocnina)', 'a = <b>³√V</b>'] },
  { q: 'Obdélník: o = 30 cm, b = 7 cm. Strana a?', s: ['a = o/2 − b = 15 − 7 = <b>8 cm</b>'] },
 ],
 video: null,
},

/* ─── Oblast 4: SEKTOR LOMENÉHO KÓDU ──────────────────────────── */

'4-1': {
 intro: '🧬 [VALIDATE] Lomené výrazy mají podmínky. Zjisti, kdy jmenovatel nesmí být nula.',
 sections: [
  { h: 'Lomený výraz',
    p: ['Lomený výraz má proměnnou ve jmenovateli. Jmenovatel nikdy nesmí být roven nule (dělení nulou není definováno).'] },
  { h: 'Podmínky řešitelnosti',
    p: ['Najdi hodnoty, pro které je jmenovatel nula, a vyluč je. Pro 1/(x−3) platí podmínka x ≠ 3.'] },
 ],
 formulas: [
  '<b>Jmenovatel ≠ 0</b>',
  '<b>x − a ≠ 0 → x ≠ a</b>',
 ],
 examples: [
  { q: 'Urči podmínku pro 5/(x − 2)', s: ['Jmenovatel x − 2 ≠ 0', 'Podmínka: <b>x ≠ 2</b>'] },
  { q: 'Urči podmínku pro x/(x + 4)', s: ['x + 4 ≠ 0', '<b>x ≠ −4</b>'] },
 ],
 video: null,
},

'4-2': {
 intro: '🔢 [EVAL] Vyhodnoť hodnotu lomeného výrazu — dosaď a zkrať.',
 sections: [
  { h: 'Hodnota výrazu',
    p: ['Dosaď číslo za proměnnou (musí splňovat podmínku) a vypočítej. Pozor na pořadí operací.'] },
  { h: 'Krácení lomených výrazů',
    p: ['Čitatel i jmenovatel rozlož na součin a zkrať společné činitele. (x²−9)/(x−3) = (x−3)(x+3)/(x−3) = x+3.'] },
 ],
 formulas: [
  '<b>Krácení:</b> rozlož na součin, zkrať společné',
  '<b>x² − a² = (x − a)(x + a)</b>',
 ],
 examples: [
  { q: 'Hodnota (x + 1)/(x − 1) pro x = 3', s: ['(3+1)/(3−1) = 4/2 = <b>2</b>'] },
  { q: 'Zkrať: (x² − 4)/(x − 2)', s: ['(x−2)(x+2)/(x−2) = <b>x + 2</b> (x ≠ 2)'] },
 ],
 video: null,
},

'4-3': {
 intro: '🧩 [DECODE] Rovnice s neznámou ve jmenovateli. Dekóduj ji opatrně — nezapomeň podmínky.',
 sections: [
  { h: 'Rovnice s neznámou ve jmenovateli',
    p: ['Nejdřív urči podmínky (jmenovatel ≠ 0). Pak vynásob rovnici společným jmenovatelem a vyřeš lineární rovnici.',
        'Výsledek nesmí porušit podmínku — jinak je řešení nepřípustné.'] },
 ],
 formulas: [
  '<b>Postup:</b> podmínky → vynásob jmenovatelem → vyřeš → ověř podmínku',
 ],
 examples: [
  { q: 'Vyřeš: 6/x = 2  (x ≠ 0)', s: ['Vynásob x: 6 = 2x', 'x = <b>3</b> (splňuje x ≠ 0)'] },
 ],
 video: null,
},

/* ─── Oblast 5: SÍŤOVÝ UZEL ───────────────────────────────────── */

'5-1': {
 intro: '🔗 [LINK] Dvě rovnice, dvě neznámé. Propoj uzel řešením soustavy.',
 sections: [
  { h: 'Soustava dvou rovnic',
    p: ['Hledáme dvojici (x, y), která vyhovuje oběma rovnicím současně.'] },
  { h: 'Metoda dosazovací a sčítací',
    p: ['Dosazovací: z jedné rovnice vyjádři jednu neznámou a dosaď do druhé.',
        'Sčítací: rovnice sečti/odečti tak, aby jedna neznámá vypadla.'] },
 ],
 formulas: [
  '<b>Dosazovací:</b> vyjádři x → dosaď do 2. rovnice',
  '<b>Sčítací:</b> uprav koeficienty → sečti → 1 neznámá vypadne',
 ],
 examples: [
  { q: 'Vyřeš: x + y = 10, x − y = 4', s: ['Sečti rovnice: 2x = 14 → x = 7', 'y = 10 − 7 = 3', 'Řešení: <b>x = 7, y = 3</b>'] },
 ],
 video: null,
},

'5-2': {
 intro: '⚗️ [MIX] Roztoky, slitiny a výkon. Sestav rovnice pro směsi a práci.',
 sections: [
  { h: 'Úlohy o směsích',
    p: ['Hlídej množství „čisté" složky: koncentrace × množství. Součet složek = výsledná směs.',
        'Příklad roztoku: 2 l 10% + 3 l 20% → čistá látka 0,2 + 0,6 = 0,8 l v 5 l → 16 %.'] },
  { h: 'Úlohy o společné práci',
    p: ['Pracuj s výkonem za jednotku času. Kdo udělá práci za a hodin, zvládne za hodinu 1/a práce.'] },
 ],
 formulas: [
  '<b>Směs:</b> Σ(koncentrace · množství) = výsledná látka',
  '<b>Práce:</b> výkon = 1/čas',
 ],
 examples: [
  { q: 'Smícháme 2 kg za 50 Kč/kg a 3 kg za 100 Kč/kg. Cena za kg směsi?', s: ['Celkem: 2·50 + 3·100 = 100 + 300 = 400 Kč', '400 ÷ 5 kg = <b>80 Kč/kg</b>'] },
 ],
 video: null,
},

'5-3': {
 intro: '🚀 [MOVE] Dráha, rychlost, čas. Vyřeš úlohy o pohybu napříč sítí.',
 sections: [
  { h: 'Vztah dráhy, rychlosti a času',
    p: ['Dráha = rychlost × čas. Z toho rychlost = dráha ÷ čas a čas = dráha ÷ rychlost.'] },
  { h: 'Pohyb proti sobě a za sebou',
    p: ['Proti sobě: rychlosti se sčítají (sbližují se). Za sebou stejným směrem: rychlosti se odečítají.'] },
 ],
 formulas: [
  '<b>s = v · t</b>',
  '<b>v = s / t</b>, <b>t = s / v</b>',
 ],
 examples: [
  { q: 'Auto jede 90 km/h. Jakou dráhu ujede za 2,5 h?', s: ['s = 90 · 2,5 = <b>225 km</b>'] },
 ],
 video: null,
},

/* ─── Oblast 6: GRAFOVÝ MONITOR ───────────────────────────────── */

'6-1': {
 intro: '📈 [PLOT] Monitor vykresluje lineární funkce. Pochop tvar y = kx + q.',
 sections: [
  { h: 'Lineární funkce',
    p: ['Funkce y = kx + q. Grafem je přímka. k je směrnice (sklon), q je úsek na ose y (kde přímka protne osu y).'] },
  { h: 'Smysl k a q',
    p: ['k > 0 → rostoucí, k < 0 → klesající, k = 0 → konstantní (vodorovná).',
        'q je hodnota y pro x = 0.'] },
 ],
 formulas: [
  '<b>y = kx + q</b>',
  '<b>k</b> = sklon · <b>q</b> = úsek na ose y',
 ],
 examples: [
  { q: 'Urči y pro funkci y = 2x + 3 při x = 4', s: ['y = 2·4 + 3 = 8 + 3 = <b>11</b>'] },
  { q: 'Kde protne y = 2x + 3 osu y?', s: ['Pro x = 0: y = 3', 'Bod <b>[0; 3]</b>'] },
 ],
 video: null,
},

'6-2': {
 intro: '🔍 [ANALYZE] Vlastnosti funkcí — rostoucí, klesající, průsečíky. Analyzuj graf.',
 sections: [
  { h: 'Rostoucí a klesající',
    p: ['Rostoucí: s rostoucím x roste i y (k > 0). Klesající: s rostoucím x klesá y (k < 0).'] },
  { h: 'Průsečíky s osami',
    p: ['S osou y: dosaď x = 0. S osou x: polož y = 0 a vyřeš rovnici pro x.'] },
 ],
 formulas: [
  '<b>Průsečík s osou x:</b> y = 0 → vyřeš pro x',
  '<b>Průsečík s osou y:</b> x = 0 → y = q',
 ],
 examples: [
  { q: 'Je y = −3x + 6 rostoucí, nebo klesající?', s: ['k = −3 < 0 → <b>klesající</b>'] },
  { q: 'Kde protne y = −3x + 6 osu x?', s: ['y = 0: 0 = −3x + 6 → x = 2', 'Bod <b>[2; 0]</b>'] },
 ],
 video: null,
},

'6-3': {
 intro: '〽️ [INVERSE] Lomená funkce a nepřímá úměrnost y = k/x. Křivka v monitoru.',
 sections: [
  { h: 'Nepřímá úměrnost',
    p: ['y = k/x (x ≠ 0). Když x roste, y klesá a naopak. Součin x · y = k je stálý.',
        'Grafem je hyperbola (dvě větve).'] },
  { h: 'Užití',
    p: ['Čím víc dělníků, tím kratší čas. Čím vyšší rychlost, tím kratší čas na danou dráhu.'] },
 ],
 formulas: [
  '<b>y = k/x</b> (x ≠ 0)',
  '<b>x · y = k</b> (konstantní)',
 ],
 examples: [
  { q: 'Pro y = 12/x urči y při x = 3', s: ['y = 12/3 = <b>4</b>'] },
  { q: '6 dělníků udělá práci za 8 dní. Za kolik dní 4 dělníci?', s: ['Součin stálý: 6·8 = 48', '48 ÷ 4 = <b>12 dní</b>'] },
 ],
 video: null,
},

/* ─── Oblast 7: JÁDRO SYSTÉMU ─────────────────────────────────── */

'7-1': {
 intro: '🏛️ [SCALE] Podobnost a měřítko — klíč k jádru. Urči koeficient podobnosti.',
 sections: [
  { h: 'Podobnost útvarů',
    p: ['Podobné útvary mají stejný tvar, ale jinou velikost. Odpovídající strany jsou ve stejném poměru — koeficient podobnosti k.',
        'Úhly se při podobnosti zachovávají.'] },
  { h: 'Měřítko',
    p: ['Měřítko 1 : 50 000 znamená, že 1 cm na mapě = 50 000 cm = 500 m ve skutečnosti.'] },
 ],
 formulas: [
  '<b>k</b> = poměr odpovídajících stran',
  '<b>Měřítko 1 : m</b> → skutečnost = mapa · m',
 ],
 examples: [
  { q: 'Trojúhelníky podobné, k = 3. Strana originálu 4 cm. Odpovídající strana obrazu?', s: ['4 · 3 = <b>12 cm</b>'] },
  { q: 'Mapa 1 : 100 000. Úsečka 3 cm = kolik km?', s: ['3 · 100 000 = 300 000 cm = 3 000 m = <b>3 km</b>'] },
 ],
 video: { id: 'XFIg5VJ2Ujc', title: 'Podobnost trojúhelníků' },
},

'7-2': {
 intro: '🧊 [VOLUME] Objem a povrch těles — válec, kužel, koule. Naplň jádro daty.',
 sections: [
  { h: 'Válec',
    p: ['Objem V = π·r²·v. Povrch S = 2πr² + 2πrv.'] },
  { h: 'Kužel',
    p: ['Objem V = ⅓·π·r²·v. Povrch S = πr² + πrs (s je strana kužele).'] },
  { h: 'Koule',
    p: ['Objem V = ⁴⁄₃·π·r³. Povrch S = 4πr².'] },
 ],
 formulas: [
  '<b>Válec:</b> V = πr²v',
  '<b>Kužel:</b> V = ⅓πr²v',
  '<b>Koule:</b> V = ⁴⁄₃πr³, S = 4πr²',
 ],
 examples: [
  { q: 'Koule r = 3 cm. Povrch? (π ≈ 3,14)', s: ['S = 4·3,14·3² = 4·3,14·9 = <b>113,04 cm²</b>'] },
  { q: 'Kužel r = 3 cm, v = 4 cm. Objem? (π ≈ 3,14)', s: ['V = ⅓·3,14·9·4 = ⅓·113,04 = <b>37,68 cm³</b>'] },
 ],
 video: { id: 'GG9WF955El4', title: 'Objem a povrch válce' },
},

'7-3': {
 intro: '💥 [BREACH] Finální průlom do systémového jádra. Mix všech témat 9. ročníku — všechno se počítá.',
 sections: [
  { h: 'Co tě čeká',
    p: ['Procenta, mocniny, rovnice, lomené výrazy, soustavy, funkce, podobnost i tělesa — vše dohromady.',
        'Toto je příprava na přijímačky i na konec ZŠ.'] },
  { h: 'Strategie závěru',
    p: ['Čti zadání pozorně, dělej zkoušku u rovnic, hlídej podmínky u lomených výrazů a jednotky u geometrie.'] },
 ],
 formulas: [
  '<b>c² = a² + b²</b> · <b>y = kx + q</b>',
  '<b>Koule:</b> V = ⁴⁄₃πr³ · <b>Válec:</b> V = πr²v',
 ],
 examples: [
  { q: 'Vyřeš: 4/(x − 1) = 2  (x ≠ 1)', s: ['Vynásob (x−1): 4 = 2(x−1)', '4 = 2x − 2 → 2x = 6 → x = <b>3</b>'] },
 ],
 video: null,
},

};
})();
