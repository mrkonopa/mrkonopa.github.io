/* ══════════════════════════════════════════════════════════════════
   RPG Matematika 6 — Teorie ke všem 21 misím (Vesmírná expedice 🚀)
   Zdroje: RVP ZV, učebnice Odvárko/Kadleček, Hejný (Fraus), MŠMT
   Videa: kanál @matematikajednoduse (Lucie Straková)
   ══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
window.RPG_LEARN_6 = {

/* ─── Oblast 1: ODLETOVÁ STANICE ──────────────────────────────── */

'1-1': {
 intro: '🛰️ Palubní robot kontroluje posádku: „Bez jistoty v přirozených číslech tě na palubu nepustím." Zopakuj si základy!',
 sections: [
  { h: 'Co jsou přirozená čísla?',
    p: ['Přirozená čísla jsou čísla, kterými počítáme předměty: 1, 2, 3, 4, … Nula se v Česku obvykle bere jako přirozené číslo také (množina N₀).',
        'Každé přirozené číslo má svého následovníka (o 1 větší) i předchůdce (o 1 menší, kromě nuly).'] },
  { h: 'Místní hodnota a zápis',
    p: ['V desítkové soustavě má každá číslice svou místní hodnotu: v čísle 4 273 je 4 tisíce, 2 stovky, 7 desítek a 3 jednotky.',
        'Velká čísla zapisujeme po trojicích s mezerou: 1 250 000 = jeden milion dvě stě padesát tisíc.'] },
  { h: 'Pořadí operací',
    p: ['Nejdřív závorky, pak násobení a dělení, nakonec sčítání a odčítání. Sčítání a odčítání (i násobení a dělení) zleva doprava.',
        'Příklad: 3 + 4 × 5 = 3 + 20 = 23 (ne 35!). Se závorkou: (3 + 4) × 5 = 35.'] },
  { h: 'Zaokrouhlování',
    p: ['Díváme se na číslici za řádem, na který zaokrouhlujeme: 0–4 dolů, 5–9 nahoru.',
        '2 847 zaokrouhleno na stovky = 2 800; na tisíce = 3 000.'] },
 ],
 formulas: [
  '<b>Pořadí:</b> ( ) → × ÷ → + −',
  '<b>Zaokrouhlení:</b> 0–4 dolů, 5–9 nahoru',
 ],
 examples: [
  { q: 'Spočítej: 5 + 2 × (8 − 3)', s: ['Závorka: 8 − 3 = 5', 'Násobení: 2 × 5 = 10', 'Součet: 5 + 10 = <b>15</b>'] },
  { q: 'Zaokrouhli 6 481 na stovky', s: ['Číslice na desítkách je 8 → nahoru', 'Výsledek: <b>6 500</b>'] },
 ],
 video: null,
},

'1-2': {
 intro: '📏 Měřicí dron skenuje stěny stanice. Spočítej obvody a obsahy obdélníků a čtverců, ať tě pustí dál.',
 sections: [
  { h: 'Obvod obdélníku a čtverce',
    p: ['Obvod je délka „celého plotu" kolem obrazce — součet všech stran.',
        'Obdélník má dvě délky a a dvě šířky b. Čtverec má všechny čtyři strany stejné (a).'] },
  { h: 'Obsah obdélníku a čtverce',
    p: ['Obsah říká, kolik jednotkových čtverečků se vejde dovnitř. Měří se v cm², m², …',
        'U obdélníku násobíme délku × šířku, u čtverce stranu × stranu.'] },
  { h: 'Jednotky obsahu',
    p: ['1 cm² = 100 mm², 1 dm² = 100 cm², 1 m² = 100 dm². Mezi sousedními jednotkami obsahu je vždy 100×.',
        'Pozor nezaměnit s délkou, kde je mezi jednotkami 10×.'] },
 ],
 formulas: [
  '<b>Obvod obdélníku:</b> o = 2 · (a + b)',
  '<b>Obsah obdélníku:</b> S = a · b',
  '<b>Obvod čtverce:</b> o = 4 · a',
  '<b>Obsah čtverce:</b> S = a · a = a²',
 ],
 examples: [
  { q: 'Obdélník a = 8 cm, b = 5 cm. Obvod a obsah?', s: ['o = 2 · (8 + 5) = 2 · 13 = <b>26 cm</b>', 'S = 8 · 5 = <b>40 cm²</b>'] },
  { q: 'Čtverec se stranou 6 cm. Obsah?', s: ['S = 6 · 6 = <b>36 cm²</b>'] },
 ],
 video: null,
},

'1-3': {
 intro: '🧭 Navigační AI ti zadá hádanky. Bez logického uvažování stanici neopustíš!',
 sections: [
  { h: 'Jak číst slovní úlohu',
    p: ['1) Přečti zadání pomalu a podtrhni, co se ptá. 2) Vypiš, co víš. 3) Najdi vztah mezi údaji. 4) Spočítej. 5) Napiš odpověď celou větou.',
        'Vždy si zkontroluj, jestli výsledek dává smysl (řád, jednotka, znaménko).'] },
  { h: 'Úsudek a převody',
    p: ['Často pomůže přepočítat „na jeden kus": když 5 sešitů stojí 75 Kč, jeden stojí 75 ÷ 5 = 15 Kč.',
        'U úloh s časem, penězi nebo množstvím dej pozor na jednotky (min/hod, Kč/halíře).'] },
  { h: 'Logické tahy',
    p: ['U logických hádanek vyzkoušej možnosti a vyřaď ty, co odporují zadání.',
        'Pomáhá kreslit si obrázek, tabulku nebo schéma.'] },
 ],
 formulas: [
  '<b>Cena za 1 kus:</b> celková cena ÷ počet kusů',
  '<b>Kontrola:</b> dosaď výsledek zpět do zadání',
 ],
 examples: [
  { q: 'Za 6 rohlíků zaplatíš 24 Kč. Kolik stojí 10 rohlíků?', s: ['1 rohlík: 24 ÷ 6 = 4 Kč', '10 rohlíků: 10 · 4 = <b>40 Kč</b>'] },
 ],
 video: null,
},

/* ─── Oblast 2: PLANETA DESETIN ───────────────────────────────── */

'2-1': {
 intro: '🛸 Oblačný strážce váží náklad na desetiny gramu. Ovládni desetinná čísla a projdeš.',
 sections: [
  { h: 'Co je desetinné číslo?',
    p: ['Desetinné číslo zapisujeme s desetinnou čárkou (v Česku čárkou, ne tečkou!). 3,7 = 3 celé a 7 desetin.',
        'Místní hodnoty za čárkou: desetiny, setiny, tisíciny. V čísle 2,845 je 8 desetin, 4 setiny, 5 tisícin.'] },
  { h: 'Porovnávání desetinných čísel',
    p: ['Nejdřív porovnej celou část. Když je stejná, porovnávej desetiny, pak setiny…',
        'Pomáhá doplnit nuly na stejný počet míst: 3,5 vs 3,45 → 3,50 vs 3,45 → 3,50 je větší.'] },
  { h: 'Zaokrouhlování desetinných čísel',
    p: ['Stejné pravidlo: díváme se na číslici za daným řádem. 3,748 na setiny = 3,75; na desetiny = 3,7.'] },
 ],
 formulas: [
  '<b>Řády za čárkou:</b> desetiny, setiny, tisíciny',
  '<b>Porovnání:</b> doplň nuly na stejný počet míst',
 ],
 examples: [
  { q: 'Co je větší: 0,7 nebo 0,68?', s: ['0,70 vs 0,68', '70 setin > 68 setin → <b>0,7</b> je větší'] },
  { q: 'Zaokrouhli 5,063 na setiny', s: ['Číslice na tisícinách je 3 → dolů', 'Výsledek: <b>5,06</b>'] },
 ],
 video: null,
},

'2-2': {
 intro: '🌟 Jiskřící mlhovina tě prověří ze všech operací s desetinnými čísly. Sčítej, odčítej, násob i děl!',
 sections: [
  { h: 'Sčítání a odčítání',
    p: ['Zarovnej desetinné čárky pod sebe a počítej jako celá čísla: 3,7 + 2,45 → doplň nuly 3,70 + 2,45 = 6,15.',
        'Odčítání stejně: 8,3 − 2,76 = 8,30 − 2,76 = 5,54.'] },
  { h: 'Násobení desetinných čísel',
    p: ['Počítej nejdřív bez čárek. Počet desetinných míst výsledku = součet desetinných míst obou činitelů.',
        '2,3 × 1,4 → 23 × 14 = 322 → 2 desetinná místa → 3,22.'] },
  { h: 'Násobení a dělení mocninami 10',
    p: ['× 10 → čárka o jedno místo doprava (3,7 → 37). ÷ 10 → čárka o jedno místo doleva (3,7 → 0,37).',
        'Každá nula = jeden posun: × 100 = dva posuny doprava.'] },
  { h: 'Dělení desetinných čísel',
    p: ['Dělíš-li desetinným číslem, posuň čárku u dělitele i dělence stejně, ať dělíš celým číslem.',
        '4,5 ÷ 0,3 = 45 ÷ 3 = 15.'] },
 ],
 formulas: [
  '<b>× 10:</b> čárka o 1 doprava · <b>÷ 10:</b> čárka o 1 doleva',
  '<b>Násobení:</b> des. místa výsledku = součet des. míst činitelů',
 ],
 examples: [
  { q: 'Spočítej: 5,08 + 3,7', s: ['5,08 + 3,70 = <b>8,78</b>'] },
  { q: 'Spočítej: 2,4 × 3,5', s: ['24 × 35 = 840 → 2 des. místa → <b>8,40</b>'] },
  { q: 'Spočítej: 9,6 ÷ 0,4', s: ['96 ÷ 4 = <b>24</b>'] },
 ],
 video: { id: 'w9C9H7EOiGM', title: 'Sčítání a odčítání desetinných čísel' },
},

'2-3': {
 intro: '💫 Prstencový duch dělí prstence na stejné díly. Zlomky a aritmetický průměr ti otevřou cestu.',
 sections: [
  { h: 'Co je zlomek?',
    p: ['Zlomek a/b vyjadřuje část celku: čitatel a (kolik dílů máme) a jmenovatel b (na kolik dílů je celek rozdělen).',
        '3/4 znamená „tři čtvrtiny" — celek na 4 díly, vezmeme 3.'] },
  { h: 'Sčítání zlomků se stejným jmenovatelem',
    p: ['Jmenovatel zůstává, sčítáme jen čitatele: 2/7 + 3/7 = 5/7.',
        'Odčítání stejně: 5/8 − 1/8 = 4/8 = 1/2 (zkrátíme).'] },
  { h: 'Aritmetický průměr',
    p: ['Průměr = součet všech hodnot ÷ jejich počet. Říká nám „typickou" hodnotu.',
        'Příklad: známky 1, 2, 2, 3 → (1+2+2+3) ÷ 4 = 8 ÷ 4 = 2.'] },
 ],
 formulas: [
  '<b>Sčítání (stejný jmenovatel):</b> a/c + b/c = (a+b)/c',
  '<b>Průměr:</b> (součet hodnot) ÷ (počet hodnot)',
 ],
 examples: [
  { q: 'Spočítej: 3/10 + 4/10', s: ['Jmenovatel zůstává: (3+4)/10 = <b>7/10</b>'] },
  { q: 'Průměr čísel 4, 6, 6, 8', s: ['Součet: 4+6+6+8 = 24', 'Počet: 4', '24 ÷ 4 = <b>6</b>'] },
 ],
 video: null,
},

/* ─── Oblast 3: POLE DĚLITELNOSTI ─────────────────────────────── */

'3-1': {
 intro: '🪨 Kamenný kolos blokuje cestu. Rozdělíš ho jen znalostí znaků dělitelnosti.',
 sections: [
  { h: 'Co je dělitelnost',
    p: ['Číslo a je dělitelné číslem b, když po dělení nezbude zbytek (zbytek = 0). Pak je a násobek b.',
        'Znaky dělitelnosti ti umožní poznat dělitelnost bez počítání celého dělení.'] },
  { h: 'Znaky dělitelnosti',
    p: ['Dělitelné 2: končí sudou číslicí (0,2,4,6,8). Dělitelné 5: končí 0 nebo 5. Dělitelné 10: končí 0.',
        'Dělitelné 3: ciferný součet je dělitelný 3. Dělitelné 9: ciferný součet je dělitelný 9.',
        'Dělitelné 4: poslední dvojčíslí je dělitelné 4.'] },
 ],
 formulas: [
  '<b>2:</b> sudá poslední číslice · <b>5:</b> 0 nebo 5 · <b>10:</b> 0',
  '<b>3:</b> ciferný součet ÷ 3 · <b>9:</b> ciferný součet ÷ 9',
  '<b>4:</b> poslední dvojčíslí ÷ 4',
 ],
 examples: [
  { q: 'Je 738 dělitelné 3?', s: ['Ciferný součet: 7+3+8 = 18', '18 je dělitelné 3 → <b>ANO</b>'] },
  { q: 'Je 524 dělitelné 4?', s: ['Poslední dvojčíslí: 24', '24 ÷ 4 = 6 → <b>ANO</b>'] },
 ],
 video: { id: 'xSaL1AtoUAk', title: 'Pravidla dělitelnosti' },
},

'3-2': {
 intro: '⚙️ Ozubený automat se zasekl. Rozlož ho na prvočísla a najdi všechny dělitele.',
 sections: [
  { h: 'Prvočísla a čísla složená',
    p: ['Prvočíslo má právě dva dělitele: 1 a samo sebe (2, 3, 5, 7, 11, 13, …). Číslo 1 není prvočíslo.',
        'Složené číslo má víc než dva dělitele (např. 12 má dělitele 1, 2, 3, 4, 6, 12).'] },
  { h: 'Rozklad na prvočinitele',
    p: ['Každé složené číslo lze zapsat jako součin prvočísel. Postupně dělíme nejmenšími prvočísly.',
        '60 = 2 · 30 = 2 · 2 · 15 = 2 · 2 · 3 · 5 = 2² · 3 · 5.'] },
  { h: 'Hledání dělitelů',
    p: ['Dělitele hledej v párech: 24 = 1·24 = 2·12 = 3·8 = 4·6. Dělitelé: 1, 2, 3, 4, 6, 8, 12, 24.'] },
 ],
 formulas: [
  '<b>Prvočíslo:</b> právě 2 dělitelé (1 a ono samo)',
  '<b>Rozklad:</b> součin prvočísel',
 ],
 examples: [
  { q: 'Rozlož 84 na prvočinitele', s: ['84 = 2 · 42 = 2 · 2 · 21 = 2 · 2 · 3 · 7', 'Výsledek: <b>2² · 3 · 7</b>'] },
  { q: 'Je 17 prvočíslo?', s: ['Dělitelné jen 1 a 17 → <b>ANO</b>'] },
 ],
 video: { id: 'O280lRBZxI8', title: 'Rozklad čísla na součin prvočísel' },
},

'3-3': {
 intro: '🛰️ Orbitální sonda synchronizuje dva motory. Najdi jejich společný dělitel (NSD) a násobek (NSN).',
 sections: [
  { h: 'Největší společný dělitel (NSD)',
    p: ['NSD dvou čísel je největší číslo, kterým jsou dělitelná obě. Použijeme rozklad na prvočísla a vezmeme společné činitele v nejnižší mocnině.',
        'Hodí se při krácení zlomků nebo dělení na co největší stejné části.'] },
  { h: 'Nejmenší společný násobek (NSN)',
    p: ['NSN je nejmenší číslo, které je násobkem obou čísel. Vezmeme všechny prvočinitele v nejvyšší mocnině.',
        'Hodí se při hledání společného jmenovatele nebo „kdy se zase setkají".'] },
 ],
 formulas: [
  '<b>NSD:</b> společné prvočinitele v nejnižší mocnině',
  '<b>NSN:</b> všechny prvočinitele v nejvyšší mocnině',
  '<b>Vztah:</b> NSD(a,b) · NSN(a,b) = a · b',
 ],
 examples: [
  { q: 'NSD(12, 18)', s: ['12 = 2² · 3, 18 = 2 · 3²', 'Společné: 2 · 3 = <b>6</b>'] },
  { q: 'NSN(12, 18)', s: ['Nejvyšší mocniny: 2² · 3² = 4 · 9 = <b>36</b>'] },
 ],
 video: { id: '2KXST0O9DjI', title: 'Největší společný dělitel' },
},

/* ─── Oblast 4: MLHOVINA ÚHLŮ ─────────────────────────────────── */

'4-1': {
 intro: '🌌 Mlhovinný strážce měří úhly mezi hvězdami. Rozeznej druhy úhlů a projdeš mlhovinou.',
 sections: [
  { h: 'Co je úhel',
    p: ['Úhel je část roviny mezi dvěma polopřímkami se společným počátkem (vrcholem). Velikost měříme ve stupních (°).',
        'Úhel značíme malým řeckým písmenem (α, β, γ) nebo třemi body s vrcholem uprostřed.'] },
  { h: 'Druhy úhlů',
    p: ['Ostrý: 0°–90°. Pravý: přesně 90°. Tupý: 90°–180°. Přímý: přesně 180°.',
        'Plný úhel je 360° (celá otáčka).'] },
  { h: 'Měření a rýsování úhloměrem',
    p: ['Střed úhloměru polož na vrchol, nulu na jedno rameno a odečti, kde leží druhé rameno.'] },
 ],
 formulas: [
  '<b>Ostrý:</b> 0°–90° · <b>Pravý:</b> 90° · <b>Tupý:</b> 90°–180°',
  '<b>Přímý:</b> 180° · <b>Plný:</b> 360°',
 ],
 examples: [
  { q: 'Jaký druh úhlu je 125°?', s: ['125° je mezi 90° a 180° → <b>tupý</b>'] },
  { q: 'Jaký druh úhlu je 90°?', s: ['Přesně 90° → <b>pravý</b>'] },
 ],
 video: null,
},

'4-2': {
 intro: '✨ Dvojhvězda vrhá dvojice úhlů. Pochop vedlejší a vrcholové úhly a získej světlo.',
 sections: [
  { h: 'Vedlejší úhly',
    p: ['Vedlejší úhly mají jedno rameno společné a druhá ramena tvoří přímku. Jejich součet je vždy 180°.',
        'Když znáš jeden, druhý dopočítáš: β = 180° − α.'] },
  { h: 'Vrcholové úhly',
    p: ['Vrcholové úhly vzniknou protnutím dvou přímek a leží „proti sobě". Jsou vždy shodné (stejně velké).'] },
 ],
 formulas: [
  '<b>Vedlejší úhly:</b> α + β = 180°',
  '<b>Vrcholové úhly:</b> α = β (shodné)',
 ],
 examples: [
  { q: 'K úhlu 53° najdi vedlejší úhel', s: ['180° − 53° = <b>127°</b>'] },
  { q: 'Vrcholový úhel k 110° má velikost?', s: ['Vrcholové úhly jsou shodné → <b>110°</b>'] },
 ],
 video: null,
},

'4-3': {
 intro: '🌠 Kometární mistr počítá čas ve stupních a minutách. Sčítej, odčítej a převáděj úhly.',
 sections: [
  { h: 'Stupně a minuty',
    p: ['Jeden stupeň se dělí na 60 minut: 1° = 60′. (A 1 minuta na 60 vteřin, 1′ = 60″.)',
        'Zápis 35°40′ znamená 35 stupňů a 40 minut.'] },
  { h: 'Sčítání a odčítání',
    p: ['Stupně sčítej se stupni, minuty s minutami. Když minut vyjde 60 a více, převeď 60′ = 1°.',
        'Při odčítání, když nemáš dost minut, „vypůjč si" 1° = 60′.'] },
  { h: 'Převody',
    p: ['Z minut na stupně: 90′ = 60′ + 30′ = 1°30′. Ze stupňů na minuty: 2° = 120′.'] },
 ],
 formulas: [
  '<b>1° = 60′</b> · <b>1′ = 60″</b>',
  '<b>Přetečení:</b> 60′ → převeď na 1°',
 ],
 examples: [
  { q: 'Spočítej: 28°45′ + 16°25′', s: ['Minuty: 45′ + 25′ = 70′ = 1°10′', 'Stupně: 28° + 16° + 1° = 45°', 'Výsledek: <b>45°10′</b>'] },
  { q: 'Převeď 150′ na stupně a minuty', s: ['150′ = 120′ + 30′ = <b>2°30′</b>'] },
 ],
 video: null,
},

/* ─── Oblast 5: ZRCADLOVÝ MĚSÍC ───────────────────────────────── */

'5-1': {
 intro: '🌓 Zrcadlový dvojník tě napodobuje. Pochop osovou souměrnost a najdi osy obrazců.',
 sections: [
  { h: 'Co je osová souměrnost',
    p: ['Osová souměrnost překlápí obrazec podle osy (přímky) jako přes zrcadlo. Obraz je stejně velký, jen zrcadlově otočený.',
        'Bod a jeho obraz leží na kolmici k ose, ve stejné vzdálenosti od osy z obou stran.'] },
  { h: 'Osy souměrnosti obrazců',
    p: ['Některé obrazce mají osy souměrnosti — přímky, podle nichž se obrazec sám na sebe překryje.',
        'Čtverec má 4 osy, obdélník 2, rovnostranný trojúhelník 3, kruh nekonečně mnoho.'] },
 ],
 formulas: [
  '<b>Obraz bodu:</b> stejná kolmá vzdálenost od osy na druhé straně',
  '<b>Osy:</b> čtverec 4, obdélník 2, kruh ∞',
 ],
 examples: [
  { q: 'Kolik os souměrnosti má čtverec?', s: ['2 úhlopříčky + 2 středové přímky = <b>4</b>'] },
  { q: 'Kolik os souměrnosti má obdélník (ne čtverec)?', s: ['Dvě středové přímky → <b>2</b>'] },
 ],
 video: { id: 'Yp5u-LyQUXQ', title: 'Osová souměrnost' },
},

'5-2': {
 intro: '🪞 Stříbrná hladina odráží souřadnice. Urči obraz bodů v osové souměrnosti.',
 sections: [
  { h: 'Sestrojení obrazu bodu',
    p: ['Z bodu veď kolmici k ose. Obraz leží na téže kolmici, na druhé straně osy, ve stejné vzdálenosti.',
        'Body ležící přímo na ose se zobrazí samy na sebe (jsou samodružné).'] },
  { h: 'Souřadnice obrazu',
    p: ['Při souměrnosti podle osy y se mění znaménko x: bod [3; 2] → [−3; 2].',
        'Při souměrnosti podle osy x se mění znaménko y: bod [3; 2] → [3; −2].'] },
 ],
 formulas: [
  '<b>Podle osy y:</b> [x; y] → [−x; y]',
  '<b>Podle osy x:</b> [x; y] → [x; −y]',
 ],
 examples: [
  { q: 'Obraz bodu [4; 1] podle osy y', s: ['Změní se znaménko x', 'Výsledek: <b>[−4; 1]</b>'] },
  { q: 'Obraz bodu [−2; 5] podle osy x', s: ['Změní se znaménko y', 'Výsledek: <b>[−2; −5]</b>'] },
 ],
 video: null,
},

'5-3': {
 intro: '🌑 Temná strana měsíce skrývá shodné útvary. Poznej, kdy jsou dva útvary shodné.',
 sections: [
  { h: 'Co je shodnost',
    p: ['Dva útvary jsou shodné, když je lze přesně přeložit jeden na druhý (mají stejný tvar i velikost).',
        'Shodné útvary mají odpovídající strany stejně dlouhé a odpovídající úhly stejně velké.'] },
  { h: 'Shodná zobrazení',
    p: ['Shodnost zachovávají osová souměrnost, středová souměrnost, posunutí a otočení.',
        'Pozor: zvětšení nebo zmenšení shodnost NEzachovává — to je podobnost.'] },
 ],
 formulas: [
  '<b>Shodné útvary:</b> stejné strany i úhly',
  '<b>Zachovávají shodnost:</b> souměrnost, posunutí, otočení',
 ],
 examples: [
  { q: 'Jsou dva čtverce se stranou 5 cm shodné?', s: ['Stejný tvar i velikost → <b>ANO</b>'] },
  { q: 'Zachová shodnost zvětšení 2×?', s: ['Mění velikost → <b>NE</b> (je to podobnost)'] },
 ],
 video: null,
},

/* ─── Oblast 6: KRYCHLOVÁ STANICE ─────────────────────────────── */

'6-1': {
 intro: '📦 Nákladní robot plní krychlové kontejnery. Spočítej objem krychle a kvádru.',
 sections: [
  { h: 'Co je objem',
    p: ['Objem říká, kolik místa těleso zabírá (kolik se do něj vejde). Měří se v krychlových jednotkách: cm³, dm³, m³.',
        'Jednotková krychle 1 cm × 1 cm × 1 cm má objem 1 cm³.'] },
  { h: 'Objem kvádru a krychle',
    p: ['Kvádr: vynásobíme tři rozměry — délku, šířku a výšku.',
        'Krychle má všechny hrany stejné (a), takže V = a · a · a = a³.'] },
 ],
 formulas: [
  '<b>Objem kvádru:</b> V = a · b · c',
  '<b>Objem krychle:</b> V = a³',
 ],
 examples: [
  { q: 'Kvádr 4 cm × 3 cm × 5 cm. Objem?', s: ['V = 4 · 3 · 5 = <b>60 cm³</b>'] },
  { q: 'Krychle s hranou 3 cm. Objem?', s: ['V = 3³ = 3 · 3 · 3 = <b>27 cm³</b>'] },
 ],
 video: { id: '1gF_B-eoKwM', title: 'Objem a povrch krychle' },
},

'6-2': {
 intro: '🛠️ Svářecí dron potřebuje obalit tělesa plechem. Spočítej povrch krychle a kvádru.',
 sections: [
  { h: 'Co je povrch',
    p: ['Povrch je součet obsahů všech stěn tělesa — jako kdybys těleso rozložil a změřil obal. Měří se v cm², m².',
        'Krychle má 6 stejných čtvercových stěn, kvádr 3 dvojice shodných obdélníků.'] },
  { h: 'Povrch kvádru a krychle',
    p: ['Krychle: 6 stěn po a², tedy S = 6 · a².',
        'Kvádr: spočítej tři různé stěny (ab, bc, ac) a každou vezmi dvakrát.'] },
 ],
 formulas: [
  '<b>Povrch krychle:</b> S = 6 · a²',
  '<b>Povrch kvádru:</b> S = 2 · (a·b + b·c + a·c)',
 ],
 examples: [
  { q: 'Krychle s hranou 5 cm. Povrch?', s: ['S = 6 · 5² = 6 · 25 = <b>150 cm²</b>'] },
  { q: 'Kvádr 4 × 3 × 2 cm. Povrch?', s: ['S = 2·(4·3 + 3·2 + 4·2) = 2·(12+6+8) = 2·26 = <b>52 cm²</b>'] },
 ],
 video: { id: 'v6JBK87_3Nk', title: 'Objem a povrch kvádru' },
},

'6-3': {
 intro: '🔧 Servisní jednotka kontroluje převody a sítě těles. Ovládni jednotky objemu a sítě.',
 sections: [
  { h: 'Jednotky objemu',
    p: ['Mezi sousedními jednotkami objemu je vždy 1000×: 1 dm³ = 1000 cm³, 1 m³ = 1000 dm³.',
        'Důležitý vztah s litry: 1 litr = 1 dm³, 1 ml = 1 cm³.'] },
  { h: 'Síť tělesa',
    p: ['Síť je rozložené těleso do roviny — všechny stěny vedle sebe tak, aby šly složit zpět.',
        'Krychle má síť ze 6 čtverců, kvádr ze 6 obdélníků (3 dvojice).'] },
 ],
 formulas: [
  '<b>1 dm³ = 1000 cm³</b> · <b>1 m³ = 1000 dm³</b>',
  '<b>1 litr = 1 dm³</b> · <b>1 ml = 1 cm³</b>',
 ],
 examples: [
  { q: 'Převeď 2,5 dm³ na cm³', s: ['1 dm³ = 1000 cm³', '2,5 · 1000 = <b>2500 cm³</b>'] },
  { q: 'Kolik litrů je 3000 cm³?', s: ['3000 cm³ = 3 dm³ = <b>3 litry</b>'] },
 ],
 video: null,
},

/* ─── Oblast 7: TROJÚHELNÍKOVÁ GALAXIE ────────────────────────── */

'7-1': {
 intro: '🔺 Trojhvězda září ve tvaru trojúhelníku. Pochop, jak velký je součet jeho úhlů.',
 sections: [
  { h: 'Součet úhlů v trojúhelníku',
    p: ['Součet velikostí všech tří vnitřních úhlů trojúhelníku je vždy 180°.',
        'Když znáš dva úhly, třetí dopočítáš: γ = 180° − α − β.'] },
  { h: 'Druhy trojúhelníků podle úhlů',
    p: ['Ostroúhlý: všechny úhly ostré. Pravoúhlý: jeden pravý úhel. Tupoúhlý: jeden tupý úhel.'] },
 ],
 formulas: [
  '<b>Součet úhlů:</b> α + β + γ = 180°',
  '<b>Třetí úhel:</b> γ = 180° − α − β',
 ],
 examples: [
  { q: 'V trojúhelníku je α = 70°, β = 60°. Kolik je γ?', s: ['γ = 180° − 70° − 60° = <b>50°</b>'] },
  { q: 'Pravoúhlý trojúhelník má jeden úhel 35°. Třetí (kromě pravého)?', s: ['180° − 90° − 35° = <b>55°</b>'] },
 ],
 video: null,
},

'7-2': {
 intro: '⭐ Hvězdný geometr zkoumá vlastnosti trojúhelníků. Poznej strany, výšky a kružnice.',
 sections: [
  { h: 'Strany a trojúhelníková nerovnost',
    p: ['V každém trojúhelníku platí, že součet dvou kratších stran je větší než strana nejdelší. Jinak trojúhelník nelze sestrojit.',
        'Strana se značí malým písmenem protilehlého vrcholu (a naproti A, b naproti B, c naproti C).'] },
  { h: 'Výšky trojúhelníku',
    p: ['Výška je kolmice z vrcholu na protější stranu (nebo její prodloužení). Trojúhelník má tři výšky, protínají se v jednom bodě.'] },
  { h: 'Kružnice trojúhelníku',
    p: ['Kružnice opsaná prochází všemi třemi vrcholy (střed = průsečík os stran).',
        'Kružnice vepsaná se dotýká všech tří stran (střed = průsečík os úhlů).'] },
 ],
 formulas: [
  '<b>Trojúhelníková nerovnost:</b> a + b > c',
  '<b>Výška:</b> kolmice z vrcholu na protější stranu',
 ],
 examples: [
  { q: 'Lze sestrojit trojúhelník se stranami 3, 4, 8 cm?', s: ['3 + 4 = 7, což není > 8', '<b>NE</b> — porušena trojúhelníková nerovnost'] },
  { q: 'Lze sestrojit trojúhelník 5, 6, 9 cm?', s: ['5 + 6 = 11 > 9 ✓', '<b>ANO</b>'] },
 ],
 video: null,
},

'7-3': {
 intro: '👾 Vládce galaxie — finální boss! Prověří tě ze všech témat 6. ročníku. Jsi připraven?',
 sections: [
  { h: 'Co tě čeká',
    p: ['Finální duel mixuje vše: přirozená i desetinná čísla, dělitelnost, úhly, souměrnost, objem a povrch i trojúhelníky.',
        'Projdi si teorii předchozích misí, kde si nejsi jistý.'] },
  { h: 'Tipy na závěr',
    p: ['Čti pozorně zadání, hlídej jednotky a pořadí operací. U geometrie si načrtni obrázek.',
        'Nespěchej — radši o krok pomaleji a správně.'] },
 ],
 formulas: [
  '<b>Pořadí operací:</b> ( ) → × ÷ → + −',
  '<b>Úhly v trojúhelníku:</b> 180° · <b>Vedlejší úhly:</b> 180°',
 ],
 examples: [
  { q: 'Rychlá rozcvička: 3 + 4 × 2', s: ['Nejdřív násobení: 4 · 2 = 8', '3 + 8 = <b>11</b>'] },
 ],
 video: null,
},

};
})();
