// rpg-learn-9.js — Teorie pro NULL_BYTE 💻 (9. ročník)
// Audience: 14letí žáci, téma: cyberpunk, jazyk: čeština
(function(){
'use strict';
window.RPG_LEARN_9 = {

'1-1': {
  mistakes: [
   {wrong:'12 : 4 · 3 = 12 : 12 = 1', right:'12 : 4 · 3 = 3 · 3 = 9', why:'Násobení a dělení mají stejnou úroveň — počítají se zleva doprava, ne dělení jako první.'},
   {wrong:'−3² = 9', right:'−3² = −9; jen (−3)² = 9', why:'Bez závorky se umocní jen trojka a minus zůstane vepředu.'},
   {wrong:'√2 je racionální číslo', right:'√2 je iracionální', why:'Má nekonečný neperiodický desetinný rozvoj (1,41421…).'},
  ],
  intro: 'Pořadí operací a obory čísel — základ každého výpočtu.',
  sections: [
    {
      h: 'Obory čísel',
      p: [
        '<b>Racionální čísla (Q)</b> — zlomky, celá čísla, konečná nebo periodická desetinná čísla. Příklady: 3, −7, ½, 0,25.',
        '<b>Iracionální čísla (R − Q)</b> — nekonečná neperiodická desetinná čísla. Příklady: √2 = 1,41421…, π = 3,14159…',
        '<b>Reálná čísla (R)</b> = racionální + iracionální. Zahrnují úplně vše na číselné ose.'
      ]
    },
    {
      h: 'Pořadí operací',
      p: [
        '1. <b>Závorky</b> — vypočítej obsah závorek jako první.<br>2. <b>Mocniny a odmocniny</b>.<br>3. <b>Násobení a dělení</b> — zleva doprava.<br>4. <b>Sčítání a odčítání</b> — zleva doprava.',
        '⚠️ Operace stejné úrovně (např. × a :) se vyhodnocují <b>zleva doprava</b>: 12 : 4 × 3 = 3 × 3 = 9, <b>ne</b> 12 : 12 = 1!'
      ]
    },
    {
      h: 'Záporná čísla v mocninách',
      p: [
        '<b>(−3)² = 9</b> — záporné číslo v závorce, sudá mocnina → výsledek kladný.',
        '<b>−3² = −9</b> — nejprve mocnina (3² = 9), pak záporné znaménko. Závorka mění vše!',
        '⚠️ Pravidlo: sudá mocnina záporného čísla je <b>kladná</b>; lichá mocnina záporného čísla je <b>záporná</b>.'
      ]
    }
  ],
  formulas: [
    'Pořadí: závorky → mocniny → × : → + −',
    '(−a)<sup>2n</sup> = a<sup>2n</sup> &gt; 0 (sudá mocnina → kladné)',
    '(−a)<sup>2n+1</sup> = −a<sup>2n+1</sup> (lichá mocnina → záporné)'
  ],
  examples: [
    {
      q: 'Vypočítej: 3 + 4 · 2 − (8 − 3)',
      s: [
        'Závorka: (8 − 3) = 5',
        'Násobení: 4 · 2 = 8',
        'Výsledek: 3 + 8 − 5 = <b>6</b>'
      ]
    },
    {
      q: 'Jak se liší (−3)² a −3²?',
      s: [
        '(−3)² = (−3) · (−3) = <b>9</b> — závorka zahrnuje i znaménko.',
        '−3² = −(3 · 3) = <b>−9</b> — nejprve mocnina, pak znaménko.'
      ]
    },
    {
      q: 'Je číslo √5 racionální nebo iracionální?',
      s: [
        'Zkus: 2² = 4, 3² = 9 — √5 není celé číslo.',
        'Desetinný rozvoj √5 = 2,2360679… je nekonečný a neperiodický.',
        'Závěr: √5 je <b>iracionální číslo</b>.'
      ]
    }
  ],
  video: { id: 'dd9r3g6WMKI', title: 'Celá čísla — přednost operací' }
},

'1-2': {
  mistakes: [
   {wrong:'20 % z 300 = 300 : 20 = 15', right:'20 % z 300 = 300 · 20 : 100 = 60', why:'Jedno procento je SETINA základu, násobíš procenty a dělíš stem.'},
   {wrong:'100 Kč +20 % a pak −20 % = zpět 100 Kč', right:'100 → 120 → 96 Kč', why:'Druhé procento se počítá z nového (jiného) základu, ne z původního.'},
   {wrong:'5 ‰ z 2000 = 100', right:'5 ‰ z 2000 = 2000 · 5 : 1000 = 10', why:'Promile je TISÍCINA, ne setina.'},
  ],
  intro: 'Procenta a promile — základ finanční gramotnosti.',
  sections: [
    {
      h: 'Co je 1 % a 1 ‰',
      p: [
        '<b>1 % (jedno procento)</b> = jedna setina celku = 1/100 = 0,01.',
        '<b>1 ‰ (jedno promile)</b> = jedna tisícina celku = 1/1000 = 0,001. Promile se používají např. pro alkohol v krvi nebo náklon silnice.'
      ]
    },
    {
      h: 'Tři typy úloh',
      p: [
        '<b>Výpočet části:</b> část = základ · p / 100 → Kolik je 15 % z 800?<br><b>Výpočet procent:</b> p = část · 100 / základ → Kolik procent je 120 ze 400?<br><b>Výpočet základu:</b> základ = část · 100 / p → 60 Kč je 20 %, kolik je 100 %?',
        '💡 Pomůcka: nakresli si trojúhelník — nahoře <b>část</b>, dole vlevo <b>základ</b>, dole vpravo <b>p/100</b>. Překryj hledanou veličinu — zbylé dvě ukazují operaci.'
      ]
    },
    {
      h: 'Procentní změna',
      p: [
        '<b>Zdražení o p %:</b> nová cena = původní · (1 + p/100)',
        '<b>Zlevnění o p %:</b> nová cena = původní · (1 − p/100)',
        '⚠️ <b>Zdražení o 20 % a pak zlevnění o 20 % ≠ původní cena!</b><br>100 · 1,2 · 0,8 = 96 Kč — ztratili jsme 4 Kč!'
      ]
    },
    {
      h: 'Zpětná úloha',
      p: [
        'Víme výsledek <i>po</i> procentní změně, hledáme původní hodnotu.',
        'Zboží stojí po slevě 20 % cenu 640 Kč. Jaká byla původní cena?',
        'Původní = 640 : (1 − 20/100) = 640 : 0,8 = <b>800 Kč</b>.'
      ]
    }
  ],
  formulas: [
    'část = základ · p / 100',
    'základ = část · 100 / p',
    'nová cena = základ · (1 ± p/100)'
  ],
  examples: [
    {
      q: 'Kolik je 35 % z 2 400 Kč?',
      s: [
        'část = 2 400 · 35 / 100',
        'část = 2 400 · 0,35 = <b>840 Kč</b>'
      ]
    },
    {
      q: 'Tričko stojí 360 Kč po slevě 25 %. Jaká byla původní cena?',
      s: [
        'Po slevě 25 % zaplatíš 75 % původní ceny.',
        'Původní = 360 : 0,75 = <b>480 Kč</b>'
      ]
    },
    {
      q: 'Cena televize vzrostla o 10 % a pak ještě o 10 %. O kolik procent celkem?',
      s: [
        '1. zvýšení: 100 · 1,1 = 110',
        '2. zvýšení: 110 · 1,1 = 121',
        'Celkový růst: 21 %, <b>ne 20 %</b>!'
      ]
    }
  ],
  video: { id: 'Sl9CxhhrnUE', title: 'Promile a procenta' }
},

'1-3': {
  mistakes: [
   {wrong:'|−5| = −5', right:'|−5| = 5', why:'Absolutní hodnota je vzdálenost od nuly — nikdy není záporná.'},
   {wrong:'−3 − 5 = −2', right:'−3 − 5 = −8', why:'Obě čísla míří doleva, znaménka jsou stejná → vzdálenosti se sčítají.'},
   {wrong:'−7 > −3', right:'−7 < −3', why:'Čím dál vlevo na ose, tím MENŠÍ číslo.'},
  ],
  intro: 'Záporná čísla a absolutní hodnota — orientace na číselné ose.',
  sections: [
    {
      h: 'Číselná osa a absolutní hodnota',
      p: [
        'Kladná čísla jsou napravo od nuly, záporná čísla nalevo. Čím menší (zápornější), tím víc vlevo.',
        '<b>Absolutní hodnota |a|</b> = vzdálenost čísla od nuly na číselné ose. Vždy platí |a| ≥ 0.<br>|−7| = 7, |3| = 3, |0| = 0.'
      ]
    },
    {
      h: 'Sčítání a odčítání záporných čísel',
      p: [
        'Odčítání záporného čísla = přičítání kladného: <b>a − (−b) = a + b</b>.<br>Příklad: 5 − (−3) = 5 + 3 = 8.',
        'Sčítání stejně znaménkových: sečti absolutní hodnoty, zachovej znaménko.<br>Sčítání různě znaménkových: odečti absolutní hodnoty, výsledek má znaménko čísla s větší absolutní hodnotou.'
      ]
    },
    {
      h: 'Násobení a dělení záporných čísel',
      p: [
        '<b>Pravidlo znamének při násobení/dělení:</b><br>(+) · (+) = (+) &nbsp;&nbsp; (+) · (−) = (−)<br>(−) · (+) = (−) &nbsp;&nbsp; (−) · (−) = (+)',
        'Sudý počet záporných čísel v součinu → výsledek kladný. Lichý počet → záporný.<br>Příklad: (−2) · (−3) · (−1) = −6 (tři záporné → záporný výsledek).'
      ]
    }
  ],
  formulas: [
    '|a| ≥ 0 pro všechna reálná a',
    'a − (−b) = a + b',
    '(−) · (−) = (+), &nbsp; (+) · (−) = (−)'
  ],
  examples: [
    {
      q: 'Vypočítej: −8 + 3 − (−5)',
      s: [
        '−8 + 3 − (−5) = −8 + 3 + 5',
        '= (3 + 5) − 8 = 8 − 8 = <b>0</b>'
      ]
    },
    {
      q: 'Vypočítej: (−4) · (−3) · 2',
      s: [
        '(−4) · (−3) = +12',
        '12 · 2 = <b>24</b>'
      ]
    },
    {
      q: 'Seřaď od nejmenšího: −3; |−5|; −|−1|; 2',
      s: [
        '|−5| = 5, &nbsp; −|−1| = −1',
        'Seřazeno: −3 &lt; −1 &lt; 2 &lt; 5',
        'Tedy: <b>−3; −|−1|; 2; |−5|</b>'
      ]
    }
  ],
  video: { id: 'EsJkCWLytiI', title: 'Celá čísla — sčítání a odčítání' }
},

'2-1': {
  mistakes: [
   {wrong:'2³ = 6', right:'2³ = 8', why:'Mocnina je opakované násobení (2·2·2), ne 2·3.'},
   {wrong:'(−2)⁴ = −16', right:'(−2)⁴ = 16', why:'Sudá mocnina záporného čísla je kladná.'},
   {wrong:'5⁰ = 0', right:'5⁰ = 1', why:'Každé nenulové číslo na nultou je 1.'},
  ],
  intro: 'Mocniny a odmocniny — základ každého výpočtu v reaktoru.',
  sections: [
    {
      h: 'Definice mocniny',
      p: [
        '<b>aⁿ</b> = a · a · a · … · a (n-krát). Číslo <i>a</i> je základ, <i>n</i> je exponent.',
        'Záporný základ: sudá mocnina je vždy <b>kladná</b> (−3)² = 9; lichá mocnina je <b>záporná</b> (−2)³ = −8.',
        '<b>a⁰ = 1</b> pro každé a ≠ 0. Cokoliv na nultou je 1!'
      ]
    },
    {
      h: 'Odmocnina',
      p: [
        '<b>√a</b> je číslo x ≥ 0 takové, že x² = a. Platí jen pro a ≥ 0 (odmocnina záporného čísla v R neexistuje).',
        '√a · √a = a &nbsp;|&nbsp; √(a²) = |a| &nbsp;|&nbsp; √(ab) = √a · √b'
      ]
    },
    {
      h: 'Druhé mocniny 1–15 zpaměti',
      p: [
        '<table style="border-collapse:collapse;font-size:13px;color:#c9d1d9;margin:6px auto"><tr><th style="padding:3px 8px;border:1px solid #4a9eff">n</th><th style="padding:3px 8px;border:1px solid #4a9eff">n²</th><th style="padding:3px 8px;border:1px solid #4a9eff">n</th><th style="padding:3px 8px;border:1px solid #4a9eff">n²</th></tr><tr><td style="padding:3px 8px;border:1px solid #4a9eff">1</td><td style="padding:3px 8px;border:1px solid #4a9eff">1</td><td style="padding:3px 8px;border:1px solid #4a9eff">9</td><td style="padding:3px 8px;border:1px solid #4a9eff">81</td></tr><tr><td style="padding:3px 8px;border:1px solid #4a9eff">2</td><td style="padding:3px 8px;border:1px solid #4a9eff">4</td><td style="padding:3px 8px;border:1px solid #4a9eff">10</td><td style="padding:3px 8px;border:1px solid #4a9eff">100</td></tr><tr><td style="padding:3px 8px;border:1px solid #4a9eff">3</td><td style="padding:3px 8px;border:1px solid #4a9eff">9</td><td style="padding:3px 8px;border:1px solid #4a9eff">11</td><td style="padding:3px 8px;border:1px solid #4a9eff">121</td></tr><tr><td style="padding:3px 8px;border:1px solid #4a9eff">4</td><td style="padding:3px 8px;border:1px solid #4a9eff">16</td><td style="padding:3px 8px;border:1px solid #4a9eff">12</td><td style="padding:3px 8px;border:1px solid #4a9eff">144</td></tr><tr><td style="padding:3px 8px;border:1px solid #4a9eff">5</td><td style="padding:3px 8px;border:1px solid #4a9eff">25</td><td style="padding:3px 8px;border:1px solid #4a9eff">13</td><td style="padding:3px 8px;border:1px solid #4a9eff">169</td></tr><tr><td style="padding:3px 8px;border:1px solid #4a9eff">6</td><td style="padding:3px 8px;border:1px solid #4a9eff">36</td><td style="padding:3px 8px;border:1px solid #4a9eff">14</td><td style="padding:3px 8px;border:1px solid #4a9eff">196</td></tr><tr><td style="padding:3px 8px;border:1px solid #4a9eff">7</td><td style="padding:3px 8px;border:1px solid #4a9eff">49</td><td style="padding:3px 8px;border:1px solid #4a9eff">15</td><td style="padding:3px 8px;border:1px solid #4a9eff">225</td></tr><tr><td style="padding:3px 8px;border:1px solid #4a9eff">8</td><td style="padding:3px 8px;border:1px solid #4a9eff">64</td><td style="padding:3px 8px;border:1px solid #4a9eff">&nbsp;</td><td style="padding:3px 8px;border:1px solid #4a9eff">&nbsp;</td></tr></table>'
      ]
    }
  ],
  formulas: [
    'aⁿ = a · a · … · a &nbsp;(n-krát)',
    '√a · √a = a &nbsp;(pro a ≥ 0)',
    'a⁰ = 1 &nbsp;(pro a ≠ 0)'
  ],
  examples: [
    {
      q: 'Vypočítej 2⁵',
      s: [
        '2⁵ = 2 · 2 · 2 · 2 · 2',
        '= 4 · 4 · 2 = <b>32</b>'
      ]
    },
    {
      q: 'Vypočítej √196',
      s: [
        'Hledáme číslo x ≥ 0 takové, že x² = 196.',
        'Z tabulky: 14² = 196, tedy √196 = <b>14</b>.'
      ]
    },
    {
      q: 'Vypočítej (−4)²',
      s: [
        '(−4)² = (−4) · (−4)',
        '(−) · (−) = (+), tedy (−4)² = <b>16</b>.'
      ]
    }
  ],
  video: { id: 'DVQl6pLx8qI', title: 'Druhá mocnina a odmocnina' }
},

'2-2': {
  mistakes: [
   {wrong:'a² · a³ = a⁶', right:'a² · a³ = a⁵', why:'Při násobení mocnin se stejným základem se exponenty SČÍTAJÍ.'},
   {wrong:'(a²)³ = a⁵', right:'(a²)³ = a⁶', why:'Mocnina mocniny — exponenty se NÁSOBÍ.'},
   {wrong:'a⁵ : a² = a^(5:2)', right:'a⁵ : a² = a³', why:'Při dělení mocnin se exponenty ODČÍTAJÍ.'},
  ],
  intro: 'Pravidla pro práci s mocninami — zkratky výpočtů.',
  sections: [
    {
      h: 'Stejný základ — násobení, dělení, mocnina mocniny',
      p: [
        '<b>Násobení:</b> aᵐ · aⁿ = aᵐ⁺ⁿ &nbsp;→&nbsp; 3² · 3⁴ = 3⁶ = 729',
        '<b>Dělení:</b> aᵐ : aⁿ = aᵐ⁻ⁿ &nbsp;→&nbsp; 5⁷ : 5³ = 5⁴ = 625',
        '<b>Mocnina mocniny:</b> (aᵐ)ⁿ = aᵐⁿ &nbsp;→&nbsp; (2³)⁴ = 2¹² = 4 096'
      ]
    },
    {
      h: 'Mocnina součinu a podílu',
      p: [
        '<b>Součin:</b> (a · b)ⁿ = aⁿ · bⁿ &nbsp;→&nbsp; (2 · 3)⁴ = 2⁴ · 3⁴ = 16 · 81 = 1 296',
        '<b>Podíl:</b> (a / b)ⁿ = aⁿ / bⁿ &nbsp;→&nbsp; (3/5)² = 9/25'
      ]
    },
    {
      h: 'Záporný exponent',
      p: [
        '<b>a⁻ⁿ = 1 / aⁿ</b> &nbsp;(pro a ≠ 0)',
        'Příklad: 2⁻³ = 1/2³ = 1/8 = 0,125',
        '⚠️ Záporný exponent <b>neznamená záporné číslo</b> — výsledek je zlomek!'
      ]
    }
  ],
  formulas: [
    'aᵐ · aⁿ = aᵐ⁺ⁿ',
    'aᵐ : aⁿ = aᵐ⁻ⁿ &nbsp;(a ≠ 0)',
    '(aᵐ)ⁿ = aᵐ·ⁿ',
    '(a·b)ⁿ = aⁿ·bⁿ',
    'a⁻ⁿ = 1/aⁿ &nbsp;(a ≠ 0)'
  ],
  examples: [
    {
      q: 'Zjednoduš: x³ · x⁵',
      s: [
        'Stejný základ x, exponenty sečti.',
        'x³ · x⁵ = x³⁺⁵ = <b>x⁸</b>'
      ]
    },
    {
      q: 'Zjednoduš: (y²)⁶ : y⁸',
      s: [
        '(y²)⁶ = y¹²',
        'y¹² : y⁸ = y¹²⁻⁸ = <b>y⁴</b>'
      ]
    },
    {
      q: 'Vypočítej: 4⁻²',
      s: [
        '4⁻² = 1 / 4² = 1 / 16 = <b>0,0625</b>'
      ]
    }
  ],
  video: { id: 'x0Yv5r2NjTU', title: 'Součin mocnin' }
},

'2-3': {
  mistakes: [
   {wrong:'V pravoúhlém trojúhelníku c² = a² − b²', right:'c² = a² + b² (c je přepona proti pravému úhlu γ)', why:'Přepona je nejdelší strana, druhé mocniny odvěsen se sčítají.'},
   {wrong:'Odvěsna a = √(c² + b²)', right:'Odvěsna a = √(c² − b²)', why:'Od druhé mocniny přepony se odečítá, protože odvěsna je kratší.'},
   {wrong:'√(a² + b²) = a + b', right:'√(a² + b²) nelze rozdělit', why:'Odmocnina součtu se NEROVNÁ součtu odmocnin.'},
  ],
  intro: 'Vědecký zápis a Pythagorova věta — dva mocné nástroje.',
  sections: [
    {
      h: 'Vědecký zápis',
      p: [
        '<b>Vědecký zápis:</b> a · 10ⁿ, kde 1 ≤ a &lt; 10 a n je celé číslo.',
        '<b>Velká čísla:</b> 93 000 000 = 9,3 · 10⁷ &nbsp;(desetinná čárka se posune o 7 míst doleva).<br><b>Malá čísla:</b> 0,0000045 = 4,5 · 10⁻⁶ &nbsp;(čárka se posune o 6 míst doprava).',
        '💡 Počet nul u mocniny 10 = počet míst, o která se desetinná čárka posune.'
      ]
    },
    {
      h: 'Pythagorova věta',
      p: [
        'V pravoúhlém trojúhelníku ABC s pravým úhlem γ u vrcholu C platí: <b>c² = a² + b²</b><br>kde c je přepona (strana AB naproti pravému úhlu), a = BC a b = AC jsou odvěsny.',
        '<svg width="220" height="170" style="display:block;margin:8px auto 0" viewBox="0 0 220 170"><rect width="220" height="170" fill="#0d1117"/><polygon points="30,140 30,40 160,140" fill="none" stroke="#4a9eff" stroke-width="2"/><rect x="30" y="120" width="20" height="20" fill="none" stroke="#00ff88" stroke-width="2"/><text x="20" y="36" fill="#ffcc00" font-size="14" font-family="monospace">A</text><text x="164" y="152" fill="#ffcc00" font-size="14" font-family="monospace">B</text><text x="14" y="152" fill="#ffcc00" font-size="14" font-family="monospace">C</text><text x="97" y="105" fill="#00ff88" font-size="13" font-family="monospace">c</text><text x="6" y="92" fill="#c9d1d9" font-size="13" font-family="monospace">b</text><text x="90" y="157" fill="#c9d1d9" font-size="13" font-family="monospace">a</text><text x="30" y="18" fill="#c9d1d9" font-size="11" font-family="monospace">pravý úhel γ u C</text></svg>'
      ]
    },
    {
      h: 'Pythagorejské trojice zpaměti',
      p: [
        'Celočíselné trojice (a, b, c) splňující a² + b² = c² — tyto se vyskytují na přijímačkách!',
        '<b>3–4–5</b> &nbsp;(9+16=25) &nbsp;|&nbsp; <b>5–12–13</b> &nbsp;(25+144=169)<br><b>8–15–17</b> &nbsp;(64+225=289) &nbsp;|&nbsp; <b>6–8–10</b> &nbsp;(násobek 3-4-5)',
        '💡 Každý násobek trojice je také pythagorejská trojice: 2×(3,4,5) = (6,8,10).'
      ]
    }
  ],
  formulas: [
    'Vědecký zápis: a · 10ⁿ, kde 1 ≤ a &lt; 10',
    'Pythagorova věta: c² = a² + b²',
    'Odvěsna: a = √(c² − b²)'
  ],
  examples: [
    {
      q: 'Zapiš ve vědeckém zápisu: 0,00078',
      s: [
        'Posuneme čárku o 4 místa doprava: 7,8',
        '0,00078 = <b>7,8 · 10⁻⁴</b>'
      ]
    },
    {
      q: 'Vypočítej z vědeckého zápisu: 3,6 · 10⁵',
      s: [
        'Posuneme čárku o 5 míst doprava.',
        '3,6 · 10⁵ = <b>360 000</b>'
      ]
    },
    {
      q: 'Trojúhelník má odvěsny a = 9 cm, b = 12 cm. Jaká je přepona c?',
      s: [
        'c² = a² + b² = 81 + 144 = 225',
        'c = √225 = <b>15 cm</b> &nbsp;(trojice 9-12-15 = 3×(3,4,5))'
      ]
    }
  ],
  video: { id: 'ssvz3u8imgk', title: 'Pythagorova věta' }
},

'3-1': {
  mistakes: [
   {wrong:'x + 5 = 12 → x = 12 + 5 = 17', right:'x = 12 − 5 = 7', why:'Člen přechází přes rovnítko s OPAČNÝM znaménkem.'},
   {wrong:'3x = 12 → x = 12 · 3', right:'x = 12 : 3 = 4', why:'Koeficientem u x se dělí, ne násobí.'},
   {wrong:'x : 4 = 3 → x = 3 : 4', right:'x = 3 · 4 = 12', why:'Opačná operace k dělení je násobení.'},
  ],
  intro: 'Lineární rovnice — jádro algebry.',
  sections: [
    {
      h: 'Co je lineární rovnice',
      p: [
        '<b>Lineární rovnice</b> = neznámá (x) se vyskytuje jen v <b>první mocnině</b>. Tvar: ax + b = c.',
        '<b>Ekvivalentní úpravy</b> — co uděláš jedné straně, musíš udělat i druhé: přičíst/odečíst stejné číslo, vynásobit/dělit stejným číslem (≠ 0).'
      ]
    },
    {
      h: 'Postup řešení',
      p: [
        '1. Přesuň členy s x na <b>levou stranu</b> (odečti od obou stran).<br>2. Přesuň <b>čísla na pravou stranu</b>.<br>3. Vyděl koeficientem u x.',
        '⚠️ Nikdy nesmíme <b>dělit nulou</b>! Pokud je koeficient u x roven 0, rovnice je buď splněna pro všechna x, nebo pro žádné.'
      ]
    },
    {
      h: 'Zkouška',
      p: [
        'Vždy dosaď výsledek zpět do <b>původní</b> rovnice a ověř, zda levá strana = pravá strana.',
        'Zkouška odhalí chyby ve výpočtu — nevynechávej ji při písemce!'
      ]
    }
  ],
  formulas: [
    'ax + b = c &nbsp;→&nbsp; ax = c − b &nbsp;→&nbsp; x = (c − b) / a',
    'Zkouška: dosaď x do původní rovnice a ověř rovnost'
  ],
  examples: [
    {
      q: 'Řeš: 3x − 7 = 14',
      s: [
        '3x = 14 + 7 = 21',
        'x = 21 : 3 = <b>7</b>',
        'Zkouška: 3 · 7 − 7 = 21 − 7 = 14 ✓'
      ]
    },
    {
      q: 'Řeš: x/2 + 3 = x/4 + 5',
      s: [
        'Vynásob rovnici 4: 2x + 12 = x + 20',
        '2x − x = 20 − 12',
        'x = <b>8</b> &nbsp;|&nbsp; Zkouška: 4 + 3 = 2 + 5 = 7 ✓'
      ]
    },
    {
      q: 'Řeš a zkontroluj: 5(x − 2) = 3x + 4',
      s: [
        '5x − 10 = 3x + 4',
        '2x = 14, &nbsp; x = <b>7</b>',
        'Zkouška: 5·(7−2) = 25; 3·7+4 = 25 ✓'
      ]
    }
  ],
  video: { id: 'q2saJQdkF34', title: 'Rovnice' }
},

'3-2': {
  mistakes: [
   {wrong:'3(x + 2) = 3x + 2', right:'3(x + 2) = 3x + 6', why:'Číslo před závorkou násobí KAŽDÝ člen uvnitř.'},
   {wrong:'5x = 2x + 9 → 5x + 2x = 9', right:'5x − 2x = 9, tedy 3x = 9', why:'Člen 2x přechází na druhou stranu se změnou znaménka (odečteš).'},
   {wrong:'−(x − 4) = −x − 4', right:'−(x − 4) = −x + 4', why:'Mínus před závorkou obrací znaménka VŠECH členů.'},
  ],
  intro: 'Závorky a neznámá na obou stranách — pokročilá rovnicová technika.',
  sections: [
    {
      h: 'Roznásobení závorek',
      p: [
        'Každý člen závorky vynásob číslem před ní (distribuční zákon).',
        '<b>Pozor na záporné znaménko:</b> −(a − b) = −a + b &nbsp;(každé znaménko se otočí!)',
        'Příklady: 3(x − 4) = 3x − 12 &nbsp;|&nbsp; −2(x + 5) = −2x − 10'
      ]
    },
    {
      h: 'Neznámá na obou stranách',
      p: [
        '1. Roznásob závorky.<br>2. Přesuň všechny členy s x na jednu stranu (odečti od obou stran).<br>3. Přesuň čísla na druhou stranu.<br>4. Vyděl koeficientem.',
        '⚠️ Vždy proveď <b>zkoušku</b> dosazením do původní rovnice!'
      ]
    },
    {
      h: 'Zvláštní případy',
      p: [
        '<b>0 = 0:</b> rovnice je splněna pro <b>každé x</b> (nekonečně mnoho řešení). Příklad: x + 2 = x + 2.',
        '<b>5 = 0:</b> rovnice <b>nemá řešení</b> (je nesplnitelná). Příklad: x + 3 = x + 7.'
      ]
    }
  ],
  formulas: [
    '−(a − b) = −a + b',
    'a(b + c) = ab + ac'
  ],
  examples: [
    {
      q: 'Řeš: 2(x + 3) = 4x − 2',
      s: [
        '2x + 6 = 4x − 2',
        '6 + 2 = 4x − 2x',
        '8 = 2x, &nbsp; x = <b>4</b>'
      ]
    },
    {
      q: 'Řeš: 3(x − 1) − 2(x + 4) = x − 15',
      s: [
        '3x − 3 − 2x − 8 = x − 15',
        'x − 11 = x − 15',
        '−11 = −15 — <b>žádné řešení!</b>'
      ]
    },
    {
      q: 'Řeš: 5 − (2x − 3) = 11 − 2x',
      s: [
        '5 − 2x + 3 = 11 − 2x',
        '8 − 2x = 11 − 2x',
        '8 = 11 — <b>žádné řešení</b> (8 ≠ 11)'
      ]
    }
  ],
  video: { id: 'zDCDOr_kFBU', title: 'Rovnice se zlomky' }
},

'3-3': {
  mistakes: [
   {wrong:'S = a · v → v = S · a', right:'v = S : a', why:'Ze součinu vyjádříš neznámou dělením.'},
   {wrong:'o = 2(a + b) → a = o : 2 · b', right:'a = o : 2 − b', why:'Nejdřív děl obvod dvěma, pak odečti druhou stranu b.'},
   {wrong:'„o 5 větší“ znamená · 5', right:'„o 5 větší“ znamená + 5', why:'„O“ znamená sčítání/odčítání, „krát“ znamená násobení.'},
  ],
  intro: 'Vyjádření ze vzorce a slovní úlohy — algebra v praxi.',
  sections: [
    {
      h: 'Vyjádření neznámé ze vzorce',
      p: [
        'Vzorec je rovnice s více proměnnými. Vyjádřit jednu proměnnou = zacházíme s ní jako s neznámou x a ostatní bereme jako konstanty.',
        'Postup: izoluj hledanou proměnnou pomocí ekvivalentních úprav (stejně jako při řešení rovnice).'
      ]
    },
    {
      h: 'Postup pro slovní úlohy',
      p: [
        '1. <b>Označ</b> neznámou (x = ?).<br>2. <b>Sestav rovnici</b> z podmínek úlohy.<br>3. <b>Vyřeš</b> rovnici.<br>4. <b>Odpověz</b> celou větou a ověř, zda výsledek dává smysl.'
      ]
    },
    {
      h: 'Příklady vzorců z fyziky a geometrie',
      p: [
        '<b>Obsah obdélníku:</b> S = a · b &nbsp;→&nbsp; a = S / b',
        '<b>Obvod obdélníku:</b> o = 2(a + b) &nbsp;→&nbsp; a = o/2 − b',
        '<b>Dráha:</b> s = v · t &nbsp;→&nbsp; t = s / v &nbsp;→&nbsp; v = s / t'
      ]
    }
  ],
  formulas: [
    'S = a · b &nbsp;→&nbsp; a = S / b',
    'o = 2(a + b) &nbsp;→&nbsp; a = o/2 − b',
    's = v · t &nbsp;→&nbsp; v = s/t, &nbsp; t = s/v'
  ],
  examples: [
    {
      q: 'Vyjádři t ze vzorce s = ½ · a · t²',
      s: [
        '2s = a · t²',
        't² = 2s / a',
        't = √(2s / a)'
      ]
    },
    {
      q: 'Obdélník má obvod 38 cm a jednu stranu 12 cm. Jaká je druhá strana?',
      s: [
        'o = 2(a + b): &nbsp; 38 = 2(12 + b)',
        '19 = 12 + b',
        'b = <b>7 cm</b>'
      ]
    },
    {
      q: 'Auto ujelo 240 km za 3 hodiny. Jaká byla průměrná rychlost?',
      s: [
        's = v · t &nbsp;→&nbsp; v = s / t',
        'v = 240 / 3 = <b>80 km/h</b>'
      ]
    }
  ],
  video: { id: '9KL_tx0SYJk', title: 'Slovní úlohy — rovnice' }
},

'4-1': {
  mistakes: [
   {wrong:'5/(x − 3) má smysl pro všechna x', right:'Platí podmínka x ≠ 3', why:'Jmenovatel nesmí být nula: x − 3 = 0 dává x = 3.'},
   {wrong:'Podmínka je čitatel ≠ 0', right:'Podmínka je JMENOVATEL ≠ 0', why:'Čitatel může být nula, dělit nulou ale nelze.'},
   {wrong:'3/x je definováno i pro x = 0', right:'x ≠ 0', why:'Dělení nulou není definováno.'},
  ],
  intro: 'Podmínky lomeného výrazu — hlídej jmenovatel!',
  sections: [
    {
      h: 'Lomený výraz a dělení nulou',
      p: [
        '<b>Lomený výraz</b> = zlomek, v jehož jmenovateli je proměnná. Příklad: (x+3)/(x−2).',
        'Dělení nulou je <b>nedefinované</b> — lomený výraz nemá hodnotu, když je jmenovatel = 0.',
        '<b>Podmínka</b> = hodnota(y) proměnné, pro které by byl jmenovatel nulový, a které jsou proto <b>zakázané</b>.'
      ]
    },
    {
      h: 'Jak najít podmínku',
      p: [
        'Postav jmenovatel roven nule a vyřeš. Tato hodnota je zakázaná.',
        'Příklad: výraz 5/(x − 4) → podmínka: x − 4 ≠ 0 → <b>x ≠ 4</b>.'
      ]
    },
    {
      h: 'Složitější jmenovatel',
      p: [
        'Jmenovatel x² − x = x(x − 1) → dvě podmínky: x ≠ 0 a x ≠ 1.',
        'Postup: rozlož jmenovatel na součin, každý činitel polož ≠ 0.'
      ]
    }
  ],
  formulas: [
    'Podmínka: jmenovatel ≠ 0',
    'Složitý jmenovatel: rozlož na součin, každý činitel ≠ 0'
  ],
  examples: [
    {
      q: 'Urči podmínky výrazu: (2x+1)/(x+5)',
      s: [
        'Jmenovatel: x + 5 ≠ 0',
        'Podmínka: <b>x ≠ −5</b>'
      ]
    },
    {
      q: 'Urči podmínky výrazu: 3/(x² − 4)',
      s: [
        'x² − 4 = (x−2)(x+2) ≠ 0',
        'Podmínky: <b>x ≠ 2</b> a <b>x ≠ −2</b>'
      ]
    },
    {
      q: 'Urči podmínky výrazu: (x−1)/(x² − 3x)',
      s: [
        'x² − 3x = x(x − 3) ≠ 0',
        'Podmínky: <b>x ≠ 0</b> a <b>x ≠ 3</b>'
      ]
    }
  ],
  video: { id: 'Gxwd7Nr3H7k', title: 'Rovnice se zlomky 1' }
},

'4-2': {
  mistakes: [
   {wrong:'(x + 3)/(x + 5) zkrátím x → 3/5', right:'Nelze krátit — x je sčítanec', why:'Krátit lze jen společné ČINITELE, ne jednotlivé sčítance.'},
   {wrong:'(3x)/6 = x/6', right:'(3x)/6 = x/2', why:'Zkrátíš trojku se šestkou (obojí děl 3).'},
   {wrong:'V (x + 3 + y) krátím (x + 3)', right:'Nelze', why:'(x + 3) není činitelem celého čitatele, jen jeho částí.'},
  ],
  intro: 'Hodnota a krácení lomených výrazů — rozklady jsou klíč.',
  sections: [
    {
      h: 'Výpočet hodnoty lomeného výrazu',
      p: [
        'Dosaď konkrétní číslo za proměnnou. Nejdříve ověř, že dosazovaná hodnota <b>splňuje podmínky</b>.',
        'Příklad: hodnota (x+3)/(x−1) pro x = 4 → (4+3)/(4−1) = 7/3.'
      ]
    },
    {
      h: 'Krácení lomeného výrazu',
      p: [
        'Rozlož čitatel i jmenovatel na součin. Zkrať <b>shodné činitele</b> (nenulové!).',
        '⚠️ Krátit lze jen celé součiny — NELZE krátit sčítance: (x+2)/(x+5) nelze zkrátit!'
      ]
    },
    {
      h: 'Klíčové rozklady',
      p: [
        '<b>Rozdíl čtverců:</b> x² − a² = (x − a)(x + a)',
        '<b>Úplný čtverec:</b> x² + 2ax + a² = (x + a)²',
        'Příklad krácení: (x² − 9)/(x + 3) = (x−3)(x+3)/(x+3) = x − 3 &nbsp;(pro x ≠ −3)'
      ]
    }
  ],
  formulas: [
    'x² − a² = (x − a)(x + a)',
    'x² + 2ax + a² = (x + a)²',
    'x² − 2ax + a² = (x − a)²'
  ],
  examples: [
    {
      q: 'Zkrať: (x² − 25)/(x + 5)',
      s: [
        'x² − 25 = (x−5)(x+5)',
        '(x−5)(x+5)/(x+5) = <b>x − 5</b> &nbsp;(pro x ≠ −5)'
      ]
    },
    {
      q: 'Zkrať: (2x² − 8)/(x − 2)',
      s: [
        'Čitatel: 2x² − 8 = 2(x² − 4) = 2(x−2)(x+2)',
        '2(x−2)(x+2)/(x−2) = <b>2(x+2)</b> &nbsp;(pro x ≠ 2)'
      ]
    },
    {
      q: 'Vypočítej hodnotu (x²−1)/(x+1) pro x = 3',
      s: [
        'Podmínka: x ≠ −1 ✓ (3 ≠ −1)',
        'Zkrať: (x−1)(x+1)/(x+1) = x − 1',
        'Pro x = 3: 3 − 1 = <b>2</b>'
      ]
    }
  ],
  video: { id: '_w3pjQikcX8', title: 'Algebraické vzorce' }
},

'4-3': {
  mistakes: [
   {wrong:'12/x = 4 → x = 12 · 4', right:'x = 12 : 4 = 3', why:'Z rovnosti 12 = 4x plyne x = 12 : 4.'},
   {wrong:'Vyřeším a vynechám podmínku', right:'Vždy uveď podmínku x ≠ 0 a ověř kořen', why:'Kořen shodný s vyloučenou hodnotou neplatí.'},
   {wrong:'Násobím jmenovatelem jen jednu stranu', right:'Násobíš OBĚ strany rovnice', why:'Ekvivalentní úprava musí zasáhnout celou rovnici.'},
  ],
  intro: 'Rovnice s neznámou ve jmenovateli — podmínky jsou nutnost.',
  sections: [
    {
      h: 'Postup řešení',
      p: [
        '1. Urči <b>podmínky</b> (zakázané hodnoty).<br>2. Vynásob obě strany rovnice <b>jmenovatelem</b> (nebo LCD).<br>3. Vyřeš vzniklou <b>lineární rovnici</b>.<br>4. <b>Ověř podmínky</b> — pokud vychází zakázaná hodnota, rovnice nemá řešení!'
      ]
    },
    {
      h: 'Nepřípustné řešení',
      p: [
        'Pokud výsledek rovnice je zakázaná hodnota, tuto hodnotu <b>odmítáme</b>.',
        'Příklad: řeší-li rovnice na x = 3, ale podmínka říká x ≠ 3, pak rovnice <b>nemá řešení</b>.',
        '⚠️ Vždy piš podmínky ještě <i>před</i> výpočtem — jinak snadno zapomeneš ověřit!'
      ]
    }
  ],
  formulas: [
    'Postup: podmínky → vynásob jmenovatelem → lineární rovnice → ověř podmínky'
  ],
  examples: [
    {
      q: 'Řeš: 3/(x − 2) = 1',
      s: [
        'Podmínka: x ≠ 2',
        'Vynásob (x−2): 3 = x − 2',
        'x = 5 &nbsp;|&nbsp; 5 ≠ 2 ✓ &nbsp;→&nbsp; <b>x = 5</b>'
      ]
    },
    {
      q: 'Řeš: 1/(x−3) = 2/(x−3) − 1',
      s: [
        'Podmínka: x ≠ 3',
        'Vynásob (x−3): 1 = 2 − (x−3) = 5 − x',
        'x = 4 &nbsp;|&nbsp; 4 ≠ 3 ✓ &nbsp;→&nbsp; <b>x = 4</b>'
      ]
    },
    {
      q: 'Řeš: x/(x−1) = 1',
      s: [
        'Podmínka: x ≠ 1',
        'Vynásob (x−1): x = x − 1 → 0 = −1, což neplatí',
        'Rovnice <b>nemá řešení</b>.'
      ]
    }
  ],
  video: { id: 'SIVaNSiq2ZY', title: 'Rovnice se zlomky' }
},

'5-1': {
  mistakes: [
   {wrong:'Sečtu rovnice (5x + y) + (3x − y) = 8x + 2y', right:'Vyjde 8x (y se vyruší)', why:'+y a −y dají dohromady nulu — to je smysl sčítací metody.'},
   {wrong:'Při odčítání změním znaménko jen prvního členu', right:'Změň znaménko VŠECH členů odčítané rovnice', why:'−(3x − y) = −3x + y.'},
   {wrong:'Najdu x a skončím', right:'Dosaď x zpět a dopočítej y', why:'Řešením soustavy je DVOJICE [x, y].'},
  ],
  intro: 'Soustava dvou rovnic — dvě podmínky, jedna odpověď.',
  sections: [
    {
      h: 'Co je soustava rovnic',
      p: [
        'Hledáme dvojici čísel (x, y), která <b>splňuje obě rovnice najednou</b>.',
        'Geometricky: průsečík dvou přímek. Soustava může mít 1 řešení (přímky se kříží), žádné (rovnoběžky) nebo nekonečně mnoho (splývají).'
      ]
    },
    {
      h: 'Metoda dosazovací',
      p: [
        '1. Z jedné rovnice vyjádři <b>jednu neznámou</b> (např. y = …).<br>2. Dosaď do <b>druhé rovnice</b> — dostaneš rovnici s jednou neznámou.<br>3. Vyřeš, pak dosaď zpět pro druhou neznámou.',
        'Vhodná, když je koeficient 1 nebo −1.'
      ]
    },
    {
      h: 'Metoda sčítací',
      p: [
        '1. Uprav rovnice tak, aby koeficienty jedné neznámé byly <b>opačná čísla</b> (např. +3y a −3y).<br>2. <b>Sečti</b> obě rovnice — jedna neznámá vypadne.<br>3. Vyřeš zbývající, dosaď zpět.',
        '⚠️ Vždy ověř výsledek v <b>obou původních rovnicích</b>!'
      ]
    }
  ],
  formulas: [
    'Dosazovací: z jedné rovnice vyjádři x (nebo y), dosaď do druhé',
    'Sčítací: násobíme rovnice tak, aby jedna neznámá vypadla sečtením'
  ],
  examples: [
    {
      q: 'Dosazovací: x + y = 7 a x − y = 3',
      s: [
        'Z 1. rovnice: x = 7 − y',
        'Do 2.: (7−y) − y = 3 → 7 − 2y = 3 → y = 2',
        'x = 7 − 2 = 5. Řešení: <b>x = 5, y = 2</b>'
      ]
    },
    {
      q: 'Sčítací: 2x + 3y = 12 a 4x − 3y = 6',
      s: [
        'Sečteme: (2x+4x) + (3y−3y) = 18 → 6x = 18 → x = 3',
        'Do 1.: 6 + 3y = 12 → y = 2',
        'Řešení: <b>x = 3, y = 2</b>'
      ]
    },
    {
      q: 'Slovní úloha: 2 sešity a 3 tužky stojí 84 Kč, 1 sešit a 2 tužky stojí 46 Kč. Kolik stojí jeden sešit?',
      s: [
        'Označ sešit s, tužku t: 2s + 3t = 84 a s + 2t = 46',
        'Z 2.: s = 46 − 2t, dosaď: 2(46−2t) + 3t = 84 → 92 − t = 84 → t = 8',
        's = 46 − 16 = <b>30 Kč</b>'
      ]
    }
  ],
  video: { id: '1FqALSmZYFQ', title: 'Soustava rovnic — metoda sčítací' }
},

'5-2': {
  mistakes: [
   {wrong:'Koncentrace směsi = průměr obou procent', right:'Vážený průměr: (m₁·p₁ + m₂·p₂) : (m₁ + m₂)', why:'Rozhoduje množství každé složky, ne jen procenta.'},
   {wrong:'2 dělníci za 6 h → 1 dělník za 3 h', right:'1 dělník za 12 h', why:'Méně dělníků → DELŠÍ čas (nepřímá úměra).'},
   {wrong:'20% roztok = vždy 20 g soli', right:'20 % ze skutečné hmotnosti roztoku', why:'Procento se počítá z dané hmotnosti, ne paušálně.'},
  ],
  intro: 'Soustavy v praxi — směsi a spolupráce.',
  sections: [
    {
      h: 'Úlohy o směsích',
      p: [
        '<b>Klíč:</b> (cena nebo koncentrace) × množství = celková hodnota. Součet složek = výsledná směs.',
        'Postup: sestav dvě rovnice — jednu pro množství, druhou pro hodnotu (cenu / obsah látky).'
      ]
    },
    {
      h: 'Úlohy o práci a výkonu',
      p: [
        'Pracovník dokončí úkol za <i>a</i> hodin → za 1 hodinu udělá <b>1/a</b> práce.',
        'Za t hodin udělá t/a práce. Společná práce: t/a + t/b = 1 (celá práce).'
      ]
    },
    {
      h: 'Tip: tabulka hodnot',
      p: [
        'Nakresli tabulku se sloupci: složka, množství, cena/výkon. Řádky vyplň ze zadání a sestav rovnice z součtů sloupců.',
        'Tabulka zabrání záměně proměnných a pomůže sestavit rovnice správně.'
      ]
    }
  ],
  formulas: [
    'Směs: c₁·m₁ + c₂·m₂ = c_výsl·(m₁+m₂)',
    'Práce: t/a + t/b = 1, kde a, b jsou časy na celou práci'
  ],
  examples: [
    {
      q: 'Čaj za 80 Kč/100 g a za 120 Kč/100 g smícháme na 500 g za 92 Kč/100 g. Kolik g každého?',
      s: [
        'x + y = 500 &nbsp;|&nbsp; 80x + 120y = 92 · 500 = 46 000',
        'Z 1.: x = 500 − y → 80(500−y) + 120y = 46 000',
        '40 000 + 40y = 46 000 → y = 150 g, x = <b>350 g</b>'
      ]
    },
    {
      q: 'Instalatér udělá práci za 6 hodin, pomocník za 10 hodin. Za jak dlouho spolu?',
      s: [
        't/6 + t/10 = 1 &nbsp;|&nbsp; Vynásob 30: 5t + 3t = 30',
        '8t = 30 → t = 30/8 = <b>3,75 hodiny = 3 h 45 min</b>'
      ]
    },
    {
      q: 'Kolik litrů vody přidat k 4 l šťávy s 60 % cukru, aby vznikla směs s 40 % cukru?',
      s: [
        'Cukr se přidáním vody nemění: 0,6 · 4 = 2,4 l cukru',
        'Po přidání x litrů: 2,4 / (4 + x) = 0,4',
        '2,4 = 0,4·(4+x) → 2,4 = 1,6 + 0,4x → 0,8 = 0,4x → x = <b>2 litry</b>'
      ]
    }
  ],
  video: { id: 'uT3O19Ds6Ds', title: 'Slovní úlohy — rovnice' }
},

'5-3': {
  mistakes: [
   {wrong:'t = v · s', right:'t = s : v', why:'Čas je dráha dělená rychlostí.'},
   {wrong:'Jedou proti sobě → rychlosti odečtu', right:'Sbližovací rychlost = SOUČET rychlostí', why:'Vzdálenost mezi nimi ubývá součtem obou rychlostí.'},
   {wrong:'Jedou stejným směrem → rychlosti sečtu', right:'Náskok roste ROZDÍLEM rychlostí', why:'Rychlejší se vzdaluje rozdílem rychlostí.'},
  ],
  intro: 'Pohybové úlohy — dráha, rychlost, čas.',
  sections: [
    {
      h: 'Základní vztah s = v · t',
      p: [
        '<b>s = v · t</b> — dráha = rychlost × čas. Trojúhelník: překryj hledanou veličinu.<br>v = s/t &nbsp;|&nbsp; t = s/v',
        '⚠️ Dbej na <b>jednotky</b>: km/h × h = km; m/s × s = m. Nemíchej!'
      ]
    },
    {
      h: 'Pohyb vstříc (protijedoucí)',
      p: [
        'Dvě tělesa jedou <b>naproti sobě</b>: vzdálenosti se sčítají.',
        'Po čase t: s₁ + s₂ = d → (v₁ + v₂) · t = d'
      ]
    },
    {
      h: 'Pohyb za sebou (dostih)',
      p: [
        'Jedno těleso dohání druhé: těleso A má náskok d, těleso B jede rychleji.',
        'Dostih nastane, když B doběhne náskok: (v_B − v_A) · t = d',
        '💡 Pokud vyjíždí ve stejný čas, nastav rovnici pro stejnou ujetou vzdálenost: v_A · t = v_B · t − d.'
      ]
    }
  ],
  formulas: [
    's = v · t, &nbsp; v = s/t, &nbsp; t = s/v',
    'Vstříc: (v₁ + v₂) · t = d',
    'Dostih: (v_B − v_A) · t = d'
  ],
  examples: [
    {
      q: 'Dvě města jsou 240 km od sebe. Vlaky vyjíždí naproti sobě: jeden 80 km/h, druhý 100 km/h. Za jak dlouho se setkají?',
      s: [
        '(80 + 100) · t = 240',
        '180t = 240 → t = 4/3 h = <b>1 h 20 min</b>'
      ]
    },
    {
      q: 'Cyklista 18 km/h vyjede o hodinu dříve. Druhý jede 27 km/h. Kdy ho dohoní?',
      s: [
        'Náskok cyklisty za 1 h: 18 · 1 = 18 km',
        '(27 − 18) · t = 18 → 9t = 18 → t = 2 hodiny od startu druhého',
        'Celkový čas od startu prvního: <b>3 hodiny</b>'
      ]
    },
    {
      q: 'Lodní motorka jede 60 km/h. Po 2 hodinách vyjede záchranný člun 90 km/h. Za jak dlouho záchranáři doplují?',
      s: [
        'Náskok motorky: 60 · 2 = 120 km',
        '(90 − 60) · t = 120 → 30t = 120 → t = <b>4 hodiny</b>'
      ]
    }
  ],
  video: { id: 'h0m6TOGF3Ug', title: 'Rychlost a čtení z grafu' }
},

'6-1': {
  mistakes: [
   {wrong:'f(x) = 3x + 2, tedy f(4) = 3 + 2·4', right:'f(4) = 3·4 + 2 = 14', why:'Dosaď za KAŽDÉ x hodnotu 4.'},
   {wrong:'Průsečík s osou y hledám dosazením y = 0', right:'Osu y: dosaď x = 0', why:'Na ose y je x = 0, vyjde y = q.'},
   {wrong:'Směrnice k je číslo q', right:'k je koeficient u x, q je posun', why:'V zápisu y = kx + q je k směrnice.'},
  ],
  intro: 'Lineární funkce y = kx + q — základ analytické geometrie.',
  sections: [
    {
      h: 'Definice a parametry',
      p: [
        '<b>y = kx + q</b> — každé reálné x dává přesně jednu hodnotu y. Grafem je <b>přímka</b>.',
        '<b>k (směrnice)</b> = sklon přímky. <b>q (absolutní člen)</b> = průsečík s osou y (bod [0; q]).'
      ]
    },
    {
      h: 'Jak nakreslit přímku',
      p: [
        'Stačí <b>dva body</b>. Nejjednodušší: dosaď x = 0 → dostaneš y = q (bod na ose y). Dosaď x = 1 → y = k + q.',
        '<svg width="240" height="180" style="display:block;margin:8px auto 0" viewBox="0 0 240 180"><rect width="240" height="180" fill="#0d1117"/><line x1="20" y1="90" x2="220" y2="90" stroke="#4a9eff" stroke-width="1.5"/><line x1="110" y1="10" x2="110" y2="170" stroke="#4a9eff" stroke-width="1.5"/><text x="222" y="94" fill="#4a9eff" font-size="11" font-family="monospace">x</text><text x="113" y="10" fill="#4a9eff" font-size="11" font-family="monospace">y</text><line x1="20" y1="150" x2="210" y2="30" stroke="#00ff88" stroke-width="2"/><circle cx="110" cy="68" r="4" fill="#ffcc00"/><text x="115" y="64" fill="#ffcc00" font-size="11" font-family="monospace">[0; 1]</text><circle cx="55" cy="90" r="4" fill="#ff5555"/><text x="28" y="108" fill="#ff5555" font-size="11" font-family="monospace">[−0,5; 0]</text><text x="145" y="28" fill="#00ff88" font-size="12" font-family="monospace">y = 2x + 1</text></svg>'
      ]
    },
    {
      h: 'Vliv parametru k',
      p: [
        '<b>k &gt; 0</b>: přímka stoupá zleva doprava.<br><b>k &lt; 0</b>: přímka klesá.<br><b>k = 0</b>: vodorovná přímka y = q.',
        'Čím větší |k|, tím <b>strmější</b> přímka. Rovnoběžné přímky mají stejné k.'
      ]
    }
  ],
  formulas: [
    'y = kx + q',
    'Průsečík s osou y: [0; q] (dosaď x = 0)',
    'Průsečík s osou x: [−q/k; 0] (dosaď y = 0)'
  ],
  examples: [
    {
      q: 'Nakresli přímku y = 3x − 2 (najdi dva body)',
      s: [
        'x = 0: y = −2 → bod [0; −2]',
        'x = 1: y = 1 → bod [1; 1]',
        'Přímka <b>stoupá</b> (k = 3 &gt; 0), průsečík s osou y je −2.'
      ]
    },
    {
      q: 'Jaká je směrnice přímky procházející body [2; 5] a [4; 11]?',
      s: [
        'k = (y₂ − y₁) / (x₂ − x₁) = (11 − 5) / (4 − 2) = 6 / 2 = <b>3</b>'
      ]
    },
    {
      q: 'Patří bod [3; 7] na přímku y = 2x + 1?',
      s: [
        'Dosaď x = 3: y = 2 · 3 + 1 = 7',
        'Vyšlo 7, což sedí se zadanou souřadnicí → bod <b>na přímce leží</b>.'
      ]
    }
  ],
  video: { id: 'Ft4bVyLP9Gc', title: 'Graf lineární funkce' }
},

'6-2': {
  mistakes: [
   {wrong:'y = −2x + 5 je rostoucí', right:'Je KLESAJÍCÍ', why:'Záporná směrnice (k < 0) → funkce klesá.'},
   {wrong:'Konstantní funkce y = 3 je rostoucí', right:'Není rostoucí ani klesající', why:'Směrnice k = 0, hodnota se nemění.'},
   {wrong:'Průsečík s osou x hledám dosazením x = 0', right:'Osu x: dosaď y = 0', why:'Na ose x je y = 0.'},
  ],
  intro: 'Vlastnosti lineárních funkcí a průsečíky přímek.',
  sections: [
    {
      h: 'Rostoucí a klesající funkce',
      p: [
        '<b>Rostoucí:</b> k &gt; 0 — s rostoucím x roste i y.',
        '<b>Klesající:</b> k &lt; 0 — s rostoucím x y klesá.',
        '<b>Konstantní:</b> k = 0 — hodnota y je stále stejná (q).'
      ]
    },
    {
      h: 'Průsečíky s osami',
      p: [
        '<b>S osou y:</b> dosaď x = 0 → y = q. Bod [0; q].',
        '<b>S osou x:</b> dosaď y = 0 → 0 = kx + q → x = −q/k. Bod [−q/k; 0].',
        '⚠️ Průsečík s osou x neexistuje, pokud k = 0 (přímka je rovnoběžná s osou x, nebo splývá s ní).'
      ]
    },
    {
      h: 'Průsečík dvou přímek',
      p: [
        'Přímky y = k₁x + q₁ a y = k₂x + q₂ se kříží, kde y₁ = y₂.',
        'Sestav rovnici: k₁x + q₁ = k₂x + q₂, vyřeš pro x, pak dosaď pro y.'
      ]
    }
  ],
  formulas: [
    'Průsečík s osou y: [0; q]',
    'Průsečík s osou x: [−q/k; 0]',
    'Průsečík dvou přímek: k₁x + q₁ = k₂x + q₂'
  ],
  examples: [
    {
      q: 'Najdi průsečíky přímky y = 2x − 4 s oběma osami.',
      s: [
        'Osa y (x=0): y = −4 → bod <b>[0; −4]</b>',
        'Osa x (y=0): 2x − 4 = 0 → x = 2 → bod <b>[2; 0]</b>'
      ]
    },
    {
      q: 'Kde se kříží přímky y = x + 3 a y = 3x − 1?',
      s: [
        'x + 3 = 3x − 1',
        '4 = 2x → x = 2',
        'y = 2 + 3 = 5. Průsečík: <b>[2; 5]</b>'
      ]
    },
    {
      q: 'Jsou přímky y = 2x + 1 a y = 2x − 3 rovnoběžné?',
      s: [
        'Obě mají k = 2, ale různé q (1 ≠ −3).',
        'Ano, přímky jsou <b>rovnoběžné</b> — nikdy se nesetkají.'
      ]
    }
  ],
  video: { id: 'ZKkrOVxUYlU', title: 'Lineární funkce — průsečíky s osami' }
},

'6-3': {
  mistakes: [
   {wrong:'y = 12/x je přímá úměrnost', right:'Je NEPŘÍMÁ úměrnost', why:'Konstantní je součin x·y = k, ne podíl.'},
   {wrong:'y = k/x je definováno i pro x = 0', right:'x ≠ 0', why:'Dělení nulou není definováno.'},
   {wrong:'Větší x → větší y', right:'Větší x → MENŠÍ y', why:'U nepřímé úměrnosti hodnota klesá.'},
  ],
  intro: 'Nepřímá úměra y = k/x — hyperbola v síti.',
  sections: [
    {
      h: 'Definice a vlastnosti',
      p: [
        '<b>y = k/x</b> (pro x ≠ 0). <b>k</b> je konstanta úměrnosti (k ≠ 0).',
        'Klíčová vlastnost: součin x · y = k je vždy konstantní. Když x zdvojnásobíš, y se půlí.'
      ]
    },
    {
      h: 'Graf — hyperbola',
      p: [
        '<svg width="220" height="200" style="display:block;margin:8px auto 0" viewBox="0 0 220 200"><rect width="220" height="200" fill="#0d1117"/><line x1="15" y1="100" x2="205" y2="100" stroke="#4a9eff" stroke-width="1.5"/><line x1="110" y1="10" x2="110" y2="190" stroke="#4a9eff" stroke-width="1.5"/><text x="207" y="104" fill="#4a9eff" font-size="10" font-family="monospace">x</text><text x="113" y="10" fill="#4a9eff" font-size="10" font-family="monospace">y</text><path d="M125,20 C140,30 165,55 190,100" fill="none" stroke="#00ff88" stroke-width="2"/><path d="M125,180 C140,170 165,145 190,100" fill="none" stroke="#00ff88" stroke-width="2" opacity="0.5"/><path d="M95,20 C80,30 55,55 30,100" fill="none" stroke="#ffcc00" stroke-width="2"/><path d="M95,180 C80,170 55,145 30,100" fill="none" stroke="#ffcc00" stroke-width="2" opacity="0.6"/><text x="155" y="42" fill="#00ff88" font-size="11" font-family="monospace">k&gt;0</text><text x="22" y="38" fill="#ffcc00" font-size="11" font-family="monospace">k&lt;0</text></svg>',
        'Graf má <b>dvě větve</b>: pro k &gt; 0 v I. a III. kvadrantu. Osy x a y jsou asymptoty — křivka se k nim přibližuje, ale nikdy jich nedosáhne.'
      ]
    },
    {
      h: 'Přímá vs nepřímá úměra',
      p: [
        '<table style="border-collapse:collapse;font-size:12px;color:#c9d1d9;margin:4px auto"><tr><th style="padding:3px 7px;border:1px solid #4a9eff">&nbsp;</th><th style="padding:3px 7px;border:1px solid #4a9eff">Přímá</th><th style="padding:3px 7px;border:1px solid #4a9eff">Nepřímá</th></tr><tr><td style="padding:3px 7px;border:1px solid #4a9eff">Vzorec</td><td style="padding:3px 7px;border:1px solid #4a9eff">y = kx</td><td style="padding:3px 7px;border:1px solid #4a9eff">y = k/x</td></tr><tr><td style="padding:3px 7px;border:1px solid #4a9eff">Konstantní</td><td style="padding:3px 7px;border:1px solid #4a9eff">y/x = k</td><td style="padding:3px 7px;border:1px solid #4a9eff">x·y = k</td></tr><tr><td style="padding:3px 7px;border:1px solid #4a9eff">Graf</td><td style="padding:3px 7px;border:1px solid #4a9eff">přímka</td><td style="padding:3px 7px;border:1px solid #4a9eff">hyperbola</td></tr><tr><td style="padding:3px 7px;border:1px solid #4a9eff">Příklad</td><td style="padding:3px 7px;border:1px solid #4a9eff">cena × ks</td><td style="padding:3px 7px;border:1px solid #4a9eff">rychlost × čas</td></tr></table>'
      ]
    }
  ],
  formulas: [
    'y = k/x &nbsp;(x ≠ 0)',
    'x · y = k = konst.'
  ],
  examples: [
    {
      q: 'Pro y = 12/x: jaká je hodnota y při x = 4?',
      s: [
        'y = 12 / 4 = <b>3</b>',
        'Ověř: x · y = 4 · 3 = 12 = k ✓'
      ]
    },
    {
      q: 'Cesta trvá 3 h při rychlosti 80 km/h. Jak dlouho trvá při 120 km/h?',
      s: [
        'k = v · t = 80 · 3 = 240 km (konstanta = vzdálenost)',
        't = 240 / 120 = <b>2 hodiny</b>'
      ]
    },
    {
      q: '6 dělníků postaví zeď za 8 dní. Za kolik dní ji postaví 4 dělníci?',
      s: [
        'Méně dělníků → delší čas (nepřímá úměra): k = 6 · 8 = 48',
        't = 48 / 4 = <b>12 dní</b>'
      ]
    }
  ],
  video: { id: '1jnAzljrmZk', title: 'Graf nepřímé úměrnosti' }
},

'7-1': {
  mistakes: [
   {wrong:'Koeficient podobnosti = rozdíl odpovídajících stran', right:'k = PODÍL odpovídajících stran (a′ : a)', why:'Podobnost mění velikost násobením, ne přičítáním.'},
   {wrong:'Obsahy podobných útvarů jsou v poměru k', right:'V poměru k²', why:'Obsah roste s DRUHOU mocninou koeficientu.'},
   {wrong:'Měřítko 1 : 500, úsek 3 cm = 3·500 = 1500 m', right:'1500 cm = 15 m', why:'Skutečnou délku v cm ještě převeď na metry (: 100).'},
  ],
  intro: 'Podobnost trojúhelníků a měřítko — zachování tvaru.',
  sections: [
    {
      h: 'Co je podobnost',
      p: [
        'Dvě tělesa jsou <b>podobná</b>, mají-li stejný tvar (všechny odpovídající úhly jsou shodné) a poměry odpovídajících stran jsou stejné.',
        '<b>Koeficient podobnosti k</b> = (strana obrazu) / (strana originálu).',
        '<svg width="280" height="140" style="display:block;margin:8px auto 0" viewBox="0 0 280 140"><rect width="280" height="140" fill="#0d1117"/><polygon points="20,120 80,20 130,120" fill="none" stroke="#4a9eff" stroke-width="2"/><text x="13" y="134" fill="#ffcc00" font-size="12" font-family="monospace">A</text><text x="77" y="16" fill="#ffcc00" font-size="12" font-family="monospace">B</text><text x="128" y="134" fill="#ffcc00" font-size="12" font-family="monospace">C</text><text x="61" y="130" fill="#c9d1d9" font-size="11" font-family="monospace">a</text><text x="34" y="72" fill="#c9d1d9" font-size="11" font-family="monospace">c</text><text x="114" y="72" fill="#c9d1d9" font-size="11" font-family="monospace">b</text><polygon points="155,120 215,45 265,120" fill="none" stroke="#00ff88" stroke-width="2"/><text x="148" y="134" fill="#ffcc00" font-size="12" font-family="monospace">A\'</text><text x="212" y="41" fill="#ffcc00" font-size="12" font-family="monospace">B\'</text><text x="262" y="134" fill="#ffcc00" font-size="12" font-family="monospace">C\'</text><text x="204" y="130" fill="#00ff88" font-size="11" font-family="monospace">ka</text><text x="166" y="83" fill="#00ff88" font-size="11" font-family="monospace">kc</text><text x="252" y="83" fill="#00ff88" font-size="11" font-family="monospace">kb</text></svg>'
      ]
    },
    {
      h: 'Obvod a obsah podobných útvarů',
      p: [
        '<b>Obvod</b> se zvětší <b>k-krát</b>: o₂ = k · o₁.',
        '<b>Obsah</b> se zvětší <b>k²-krát</b>: S₂ = k² · S₁.',
        'Příklad: trojúhelník zvětšíme 3× → obvod je 3× větší, obsah je 9× větší!'
      ]
    },
    {
      h: 'Měřítko mapy a plánů',
      p: [
        'Měřítko <b>1 : m</b> → skutečná vzdálenost = mapa × m.',
        'Příklad: měřítko 1 : 50 000 → 1 cm na mapě = 50 000 cm = 500 m ve skutečnosti.',
        'Obrácený postup: skutečnost → mapa: mapa = skutečnost / m.'
      ]
    }
  ],
  formulas: [
    'k = strana obrazu / strana originálu',
    'Obvod: o₂ = k · o₁',
    'Obsah: S₂ = k² · S₁'
  ],
  examples: [
    {
      q: 'Trojúhelníky jsou podobné, poměr stran 2 : 5. Menší má obsah 8 cm². Jaký je obsah většího?',
      s: [
        'k = 5/2 = 2,5',
        'S₂ = k² · S₁ = 6,25 · 8 = <b>50 cm²</b>'
      ]
    },
    {
      q: 'Na mapě v měřítku 1 : 25 000 je vzdálenost 4,5 cm. Jaká je skutečná vzdálenost?',
      s: [
        'skutečnost = 4,5 · 25 000 = 112 500 cm = 1 125 m = <b>1,125 km</b>'
      ]
    },
    {
      q: 'Trojúhelník se zvětšil 4×. Původní obvod byl 15 cm. Jaký je nový obvod?',
      s: [
        'o₂ = k · o₁ = 4 · 15 = <b>60 cm</b>'
      ]
    }
  ],
  video: { id: 'XFIg5VJ2Ujc', title: 'Podobnost trojúhelníků' }
},

'7-2': {
  mistakes: [
   {wrong:'Objem kužele = π·r²·v', right:'V = 1/3 · π·r²·v', why:'Kužel má TŘETINU objemu válce se stejnou podstavou a výškou.'},
   {wrong:'Povrch válce = 2πr·v (jen plášť)', right:'S = 2πr² + 2πrv', why:'K plášti musíš přičíst dvě kruhové podstavy.'},
   {wrong:'Zaměním poloměr r a průměr d', right:'r = d : 2', why:'Poloměr je polovina průměru — hlídej, co je v zadání.'},
  ],
  intro: 'Objem a povrch rotačních těles — válec, kužel, koule.',
  sections: [
    {
      h: 'Válec',
      p: [
        '<svg width="160" height="120" style="display:block;margin:8px auto 0" viewBox="0 0 160 120"><rect width="160" height="120" fill="#0d1117"/><ellipse cx="80" cy="30" rx="50" ry="15" fill="none" stroke="#4a9eff" stroke-width="2"/><ellipse cx="80" cy="90" rx="50" ry="15" fill="none" stroke="#4a9eff" stroke-width="2"/><line x1="30" y1="30" x2="30" y2="90" stroke="#4a9eff" stroke-width="2"/><line x1="130" y1="30" x2="130" y2="90" stroke="#4a9eff" stroke-width="2"/><line x1="80" y1="30" x2="130" y2="30" stroke="#ffcc00" stroke-width="1.5" stroke-dasharray="4,3"/><text x="100" y="24" fill="#ffcc00" font-size="11" font-family="monospace">r</text><line x1="132" y1="30" x2="132" y2="90" stroke="#00ff88" stroke-width="1.5" stroke-dasharray="4,3"/><text x="136" y="63" fill="#00ff88" font-size="11" font-family="monospace">v</text></svg>',
        '<b>r</b> = poloměr základny, <b>v</b> = výška.<br><b>Objem:</b> V = π · r² · v<br><b>Povrch:</b> S = 2πr² + 2πrv &nbsp;(2 podstavy + plášť)'
      ]
    },
    {
      h: 'Kužel',
      p: [
        '<svg width="160" height="130" style="display:block;margin:8px auto 0" viewBox="0 0 160 130"><rect width="160" height="130" fill="#0d1117"/><ellipse cx="80" cy="105" rx="55" ry="16" fill="none" stroke="#4a9eff" stroke-width="2"/><line x1="25" y1="105" x2="80" y2="15" stroke="#4a9eff" stroke-width="2"/><line x1="135" y1="105" x2="80" y2="15" stroke="#4a9eff" stroke-width="2"/><line x1="80" y1="105" x2="135" y2="105" stroke="#ffcc00" stroke-width="1.5" stroke-dasharray="4,3"/><text x="103" y="100" fill="#ffcc00" font-size="11" font-family="monospace">r</text><line x1="80" y1="15" x2="80" y2="105" stroke="#00ff88" stroke-width="1.5" stroke-dasharray="4,3"/><text x="83" y="63" fill="#00ff88" font-size="11" font-family="monospace">v</text><text x="100" y="55" fill="#ff5555" font-size="11" font-family="monospace">s</text><text x="77" y="12" fill="#c9d1d9" font-size="10" font-family="monospace">vrchol</text></svg>',
        '<b>s = √(r² + v²)</b> = délka strany (šikmá výška). ⚠️ <b>Plášť kužele používá s, ne v!</b><br><b>Objem:</b> V = ⅓ · π · r² · v<br><b>Povrch:</b> S = πr² + πrs &nbsp;(podstava + plášť)'
      ]
    },
    {
      h: 'Koule',
      p: [
        '<b>r</b> = poloměr koule.',
        '<b>Objem:</b> V = (4/3) · π · r³',
        '<b>Povrch:</b> S = 4 · π · r²'
      ]
    }
  ],
  formulas: [
    'Válec: V = πr²v, &nbsp; S = 2πr² + 2πrv',
    'Kužel: s = √(r²+v²), &nbsp; V = ⅓πr²v, &nbsp; S = πr² + πrs',
    'Koule: V = (4/3)πr³, &nbsp; S = 4πr²'
  ],
  examples: [
    {
      q: 'Koule má poloměr r = 3 cm. Vypočítej povrch.',
      s: [
        'S = 4 · π · r² = 4 · π · 9',
        'S = 36π ≈ <b>113,1 cm²</b>'
      ]
    },
    {
      q: 'Kužel: r = 4 cm, v = 3 cm. Vypočítej objem.',
      s: [
        'V = ⅓ · π · r² · v = ⅓ · π · 16 · 3',
        'V = 16π ≈ <b>50,3 cm³</b>'
      ]
    },
    {
      q: 'Válec: r = 5 cm, v = 10 cm. Vypočítej objem.',
      s: [
        'V = π · r² · v = π · 25 · 10',
        'V = 250π ≈ <b>785,4 cm³</b>'
      ]
    }
  ],
  video: { id: 'GG9WF955El4', title: 'Objem a povrch válce' }
},

'7-3': {
  mistakes: [
   {wrong:'U slovní úlohy nenapíšu závěrečnou odpověď', right:'Vždy napiš odpověď včetně jednotky', why:'CERMAT strhává body za chybějící nebo špatnou jednotku.'},
   {wrong:'Zaokrouhlím mezivýsledek a počítám s ním dál', right:'Zaokrouhluj až úplně nakonec', why:'Zaokrouhlování mezivýsledků kumuluje chybu.'},
   {wrong:'Řeším úlohy popořadě a na těžké mi nezbude čas', right:'Nejdřív jisté úlohy, těžké nech nakonec', why:'Každá úloha má váhu — sbírej jisté body dřív.'},
  ],
  intro: 'Finální mise — přehled všeho a přijímačkové tipy.',
  sections: [
    {
      h: 'Co testují přijímačky CERMAT',
      p: [
        '• Pořadí operací, racionální a iracionální čísla<br>• Procenta a procentní změna<br>• Mocniny, odmocniny, vědecký zápis<br>• Pythagorova věta a pythagorejské trojice<br>• Lineární rovnice, rovnice se závorkami<br>• Vyjádření ze vzorce, slovní úlohy<br>• Lomené výrazy — podmínky, krácení<br>• Soustavy dvou rovnic (dosazovací, sčítací)<br>• Lineární funkce y = kx + q — průsečíky, sklon<br>• Nepřímá úměra y = k/x<br>• Podobnost a měřítko<br>• Objem a povrch válce, kužele, koule'
      ]
    },
    {
      h: 'Nejčastější chyby',
      p: [
        '• <b>Závorky a znaménka:</b> −(a−b) = −a+b, ne −a−b<br>• <b>Záporné mocniny:</b> −3² = −9, ale (−3)² = 9<br>• <b>Podmínky u lomených výrazů</b> zapomenuté nebo nevyhodnocené<br>• <b>Jednotky:</b> km/h × h = km, ne míchej km a m<br>• <b>Obsah vs. obvod</b> u podobných útvarů (k vs. k²)<br>• <b>s vs. v u kužele</b> — do vzorce pro plášť patří s!'
      ]
    },
    {
      h: 'Postup řešení na písemce',
      p: [
        '1. <b>Čti dvakrát</b> — co je dáno, co hledáš.',
        '2. <b>Nakresli nebo zapiš</b> — schéma, tabulka, vzorec.',
        '3. <b>Řeš systematicky</b> — ekvivalentní úpravy, nic nepřeskakuj.',
        '4. <b>Zkouška</b> — dosaď výsledek, ověř jednotky, zkontroluj podmínky.'
      ]
    }
  ],
  formulas: [
    'Pythagorova věta: c² = a² + b²',
    'Povrch koule: S = 4πr²',
    'Objem koule: V = (4/3)πr³',
    'Lineární funkce: y = kx + q',
    'Lineární rovnice: ax + b = c → x = (c−b)/a'
  ],
  examples: [
    {
      q: 'Kovová koule o poloměru 6 cm se přetaví na válec s výškou v = 8 cm. Jaký je poloměr válce?',
      s: [
        'Objem koule = objem válce',
        '(4/3)π · 6³ = π · r² · 8',
        '(4/3) · 216 = 8r² → 288 = 8r² → r² = 36 → r = <b>6 cm</b>'
      ]
    },
    {
      q: 'Cena výrobku vzrostla o 20 %, pak klesla o 20 %. Je výsledná cena stejná jako původní?',
      s: [
        'Vezmi 100 Kč: po růstu 120 Kč, po poklesu 120 · 0,8 = 96 Kč',
        'Výsledek <b>96 Kč ≠ 100 Kč</b> — procenta se počítají z jiného základu, cena klesla o 4 %.'
      ]
    },
    {
      q: 'Zjednoduš: (x² − 9) / (x + 3) a urči podmínku.',
      s: [
        'Podmínka: x + 3 ≠ 0 → <b>x ≠ −3</b>',
        'Čitatel rozlož: x² − 9 = (x − 3)(x + 3)',
        'Krácení (x+3): výsledek <b>x − 3</b>'
      ]
    },
    {
      q: 'V kleci jsou bažanti a králíci, celkem 12 hlav a 34 nohou. Kolik je králíků?',
      s: [
        'Bažant má 2 nohy, králík 4. Soustava: b + k = 12, 2b + 4k = 34.',
        'Z první rovnice b = 12 − k, dosadíme: 2(12 − k) + 4k = 34 → 24 + 2k = 34 → 2k = 10',
        'k = <b>5 králíků</b> (a 7 bažantů). Zkouška: 7·2 + 5·4 = 14 + 20 = 34 ✓'
      ]
    }
  ],
  video: { id: 'FO-xAjpo3b0', title: 'CERMAT 2025 — přijímací zkoušky' }
}

};
})();
