/* ══════════════════════════════════════════════════════════════════
   RPG Matematika 8 — Teorie ke všem 21 misím
   Citadela arcimága 🏛️  /  Matematická akademie 🎓
   Třída: 8. ročník ZŠ (RVP ZV)
   Zdroje: RVP ZV, učebnice Odvárko/Kadleček, CERMAT, MŠMT
   Videa: kanál @matematikajednoduse (Lucie Straková)
   ══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
window.RPG_LEARN_8 = {

/* ─── Oblast 1: BRÁNA AKADEMIE ────────────────────────────────── */

'1-1': {
 mistakes: [
  {wrong:'−3 − 5 = −2', right:'−3 − 5 = −8', why:'Obě čísla míří na ose doleva, znaménka jsou stejná → vzdálenosti se sčítají. Výsledek je −8.'},
  {wrong:'−3² = 9', right:'−3² = −9; jen (−3)² = 9', why:'Bez závorky se umocňuje jen trojka a minus zůstane vepředu. Závorka (−3)² umocní i znaménko.'},
  {wrong:'|−5| = −5', right:'|−5| = 5', why:'Absolutní hodnota je vzdálenost od nuly, vždy nezáporná. Minus se „ztratí".'},
 ],
 intro: '🏛️ Strážce brány Akademie tě nepustí dál, dokud neovládneš celá čísla a jejich tajemství. Proveď ho čísly záporných hodnot!',
 sections: [
  { h: 'Celá čísla a číselná osa',
    p: [
      'Celá čísla jsou …, −3, −2, −1, 0, 1, 2, 3, … Záporná leží <b>vlevo</b> od nuly, kladná <b>vpravo</b>. Nula není kladná ani záporná.',
      '<b>Absolutní hodnota</b> |a| je vzdálenost čísla od nuly — vždy nezáporná: |−7| = 7, |5| = 5, |0| = 0.',
      '<svg width="280" height="60" style="display:block;margin:8px auto 0" viewBox="0 0 280 60"><line x1="10" y1="30" x2="270" y2="30" stroke="#4a9eff" stroke-width="2"/><polygon points="265,25 275,30 265,35" fill="#4a9eff"/><text x="5" y="50" font-size="11" fill="#c9d1d9">−5</text><text x="30" y="50" font-size="11" fill="#c9d1d9">−4</text><text x="55" y="50" font-size="11" fill="#c9d1d9">−3</text><text x="80" y="50" font-size="11" fill="#c9d1d9">−2</text><text x="105" y="50" font-size="11" fill="#c9d1d9">−1</text><text x="133" y="50" font-size="11" fill="#ffcc00">0</text><text x="157" y="50" font-size="11" fill="#c9d1d9">1</text><text x="182" y="50" font-size="11" fill="#c9d1d9">2</text><text x="207" y="50" font-size="11" fill="#c9d1d9">3</text><text x="232" y="50" font-size="11" fill="#c9d1d9">4</text><text x="257" y="50" font-size="11" fill="#c9d1d9">5</text><line x1="12" y1="25" x2="12" y2="35" stroke="#c9d1d9" stroke-width="1"/><line x1="37" y1="25" x2="37" y2="35" stroke="#c9d1d9" stroke-width="1"/><line x1="62" y1="25" x2="62" y2="35" stroke="#c9d1d9" stroke-width="1"/><line x1="87" y1="25" x2="87" y2="35" stroke="#c9d1d9" stroke-width="1"/><line x1="112" y1="25" x2="112" y2="35" stroke="#c9d1d9" stroke-width="1"/><line x1="137" y1="22" x2="137" y2="38" stroke="#ffcc00" stroke-width="2"/><line x1="162" y1="25" x2="162" y2="35" stroke="#c9d1d9" stroke-width="1"/><line x1="187" y1="25" x2="187" y2="35" stroke="#c9d1d9" stroke-width="1"/><line x1="212" y1="25" x2="212" y2="35" stroke="#c9d1d9" stroke-width="1"/><line x1="237" y1="25" x2="237" y2="35" stroke="#c9d1d9" stroke-width="1"/><line x1="262" y1="25" x2="262" y2="35" stroke="#c9d1d9" stroke-width="1"/></svg>',
    ] },
  { h: 'Sčítání a odčítání celých čísel',
    p: [
      '<b>Stejná znaménka:</b> sečti absolutní hodnoty a ponech znaménko. Například (−4) + (−3) = −7.',
      '<b>Různá znaménka:</b> odečti menší absolutní hodnotu od větší, výsledek dostane znaménko čísla s větší absolutní hodnotou. Například (−7) + 3 = −4.',
      '<b>Odčítání = přičtení opačného čísla:</b> 5 − (−3) = 5 + 3 = 8.',
    ] },
  { h: 'Násobení a dělení celých čísel',
    p: [
      'Pravidlo znamének: <b>stejná → kladné</b>, <b>různá → záporné</b>.',
      '(−4) · (−3) = <b>+12</b> &nbsp;|&nbsp; (−4) · 3 = <b>−12</b> &nbsp;|&nbsp; (−20) : (−4) = <b>+5</b>',
    ] },
  { h: 'Závorky a mocniny — POZOR!',
    p: [
      '<span style="color:#ff5555">⚠️</span> <b>(−3)² = (−3) · (−3) = 9</b> &nbsp;ale&nbsp; <b>−3² = −(3·3) = −9</b>',
      'Závorka mění základ mocniny! Bez závorky se umocňuje pouze 3, znaménko minus zůstává před výsledkem.',
    ] },
  { h: 'Absolutní hodnota v nerovnicích',
    p: [
      '|a| &lt; 5 znamená, že číslo <i>a</i> leží méně než 5 od nuly na obě strany: <b>−5 &lt; a &lt; 5</b>.',
      '|a| &gt; 5 znamená <b>a &lt; −5 nebo a &gt; 5</b> (daleko od nuly).',
    ] },
 ],
 formulas: [
  '<b>|a| ≥ 0</b> vždy &nbsp;|&nbsp; <b>|−a| = |a|</b>',
  '<b>(−a)² = a²</b> &nbsp;ale&nbsp; <b>−a² = −(a²)</b>',
  '<b>|a| &lt; k</b> &nbsp;⟺&nbsp; <b>−k &lt; a &lt; k</b>',
  '<b>− · − = +</b> &nbsp;|&nbsp; <b>+ · − = −</b>',
 ],
 examples: [
  { q: 'Spočítej: −7 + 12',
    s: ['Různá znaménka: |12| − |−7| = 12 − 7 = 5', 'Větší absolutní hodnota má znaménko +', 'Výsledek: <b>5</b>'] },
  { q: 'Spočítej: (−6) · (−5)',
    s: ['Stejná znaménka → výsledek kladný', '6 · 5 = <b>30</b>'] },
  { q: 'Spočítej: (−3)² a −3²',
    s: ['(−3)² = (−3) · (−3) = <b>9</b>', '−3² = −(3²) = −9', 'Závorka je zásadní rozdíl!'] },
  { q: 'Vyřeš nerovnici |x| &lt; 4',
    s: ['|x| &lt; 4 ⟺ −4 &lt; x &lt; 4', 'Výsledek: <b>x ∈ (−4; 4)</b>'] },
 ],
 video: { id: 'IEhTvjkjLtU', title: 'Celá čísla — opakování' }
},

'1-2': {
 mistakes: [
  {wrong:'1/3 + 1/4 = 2/7', right:'4/12 + 3/12 = 7/12', why:'Jmenovatele se NESČÍTAJÍ. Sjednoť je (NSN = 12), pak sečti jen čitatele.'},
  {wrong:'3/4 : 2/5 = 6/20', right:'3/4 × 5/2 = 15/8', why:'Dělení zlomkem = násobení převráceným zlomkem. Nesmí se rovnou násobit.'},
  {wrong:'0,6 = 6/10 a nekrátím', right:'0,6 = 6/10 = 3/5', why:'Zlomek z desetinného čísla vždy zkrať na základní tvar.'},
 ],
 intro: '📚 Mlžný archivář Akademie ti ukazuje svitky racionálních čísel. Zlomky a desetinná čísla jsou základem každého výpočtu.',
 sections: [
  { h: 'Racionální čísla',
    p: [
      'Množina racionálních čísel <b>ℚ</b> = všechna čísla, která lze zapsat jako zlomek <b>a/b</b>, kde b ≠ 0.',
      'Patří sem: celá čísla (5 = 5/1), zlomky (3/4), <b>konečná desetinná</b> čísla (0,75) i <b>nekonečná periodická</b> desetinná čísla (1/3 = 0,333…).',
    ] },
  { h: 'Operace se zlomky',
    p: [
      '<b>Sčítání a odčítání:</b> nejdříve převeď na <b>společný jmenovatel</b> (nejmenší společný násobek jmenovatelů), pak sčítej/odčítej pouze čitatele.',
      '<b>Násobení:</b> čitatel × čitatel, jmenovatel × jmenovatel — zjednodušuj zkracováním před výpočtem.',
      '<b>Dělení:</b> násob <b>převrácenou hodnotou</b> (obrať druhý zlomek): <sup>a</sup>/<sub>b</sub> : <sup>c</sup>/<sub>d</sub> = <sup>a</sup>/<sub>b</sub> · <sup>d</sup>/<sub>c</sub>',
    ] },
  { h: 'Převody zlomek ↔ desetinné číslo',
    p: [
      'Zlomek → desetinné: <b>dělení čitatele jmenovatelem</b>. Příklady: 3/4 = 0,75 &nbsp;|&nbsp; 1/3 = 0,333… (periodické)',
      'Desetinné → zlomek: zapiš podle řádu poslední číslice a zkrať. 0,6 = 6/10 = <b>3/5</b>',
    ] },
  { h: 'Nejmenší společný jmenovatel — časté chyby',
    p: [
      '<span style="color:#ff5555">⚠️</span> Studenti často píší 1/3 + 1/4 = 2/7 — to je <b>špatně!</b>',
      'Správně: NSN(3,4) = 12 → 4/12 + 3/12 = <b>7/12</b>. Jmenovatele se <b>nesčítají</b>!',
    ] },
 ],
 formulas: [
  '<b>a/b + c/b = (a+c)/b</b> &nbsp;(stejný jmenovatel)',
  '<b>a/b · c/d = (a·c)/(b·d)</b>',
  '<b>a/b : c/d = a/b · d/c</b>',
 ],
 examples: [
  { q: 'Spočítej: 2/3 + 1/6',
    s: ['NSN(3, 6) = 6', '2/3 = 4/6', '4/6 + 1/6 = <b>5/6</b>'] },
  { q: 'Spočítej: 3/4 · 8/9',
    s: ['Zkrátíme: 3 a 9 → dělíme 3; 4 a 8 → dělíme 4', '(3:3)/1 · (8:4)/(9:3) = 1/1 · 2/3 = <b>2/3</b>'] },
  { q: 'Převeď 5/8 na desetinné číslo',
    s: ['5 : 8 = 0,625', 'Výsledek: <b>0,625</b> (konečné)'] },
 ],
 video: { id: 'ME5pLObMogw', title: 'Racionální čísla — zlomky' }
},

'1-3': {
 mistakes: [
  {wrong:'Zdražilo o 10 % na 550 Kč, původní = 550 − 55 = 495 Kč', right:'C = 550 : 1,1 = 500 Kč', why:'Procenta počítáš ze špatného základu. 550 Kč je 110 % původní ceny → dělíš 1,1.'},
  {wrong:'Zdražit o 20 % a pak zlevnit o 20 % = původní cena', right:'1000 × 1,2 × 0,8 = 960 Kč', why:'Druhé procento se počítá z jiné (vyšší) hodnoty, takže se změny nevyruší.'},
  {wrong:'20 % z 500 = 500 × 20 = 10 000', right:'500 × 0,20 = 100', why:'Procento nejdřív převeď na setiny: 20 % = 0,20. Násobení dvaceti dá 100× víc.'},
 ],
 intro: '⚗️ Alchymista Akademie počítá poměry vzácných lektvarů. Zvládni všechny typy procentových úloh a zdražování!',
 sections: [
  { h: 'Základní pojmy',
    p: [
      '1 % = jedna setina celku = 0,01. <b>Základ</b> = celek (100 %), <b>část</b> = kolik procent bereme, <b>počet procent</b> = p%.',
      'Klíčový vztah: <b>část = základ · p/100</b>',
    ] },
  { h: 'Čtyři typy úloh',
    p: [
      '<b>1. Výpočet části:</b> část = základ · p/100 &nbsp;→&nbsp; 20 % z 500 = 500 · 0,2 = 100',
      '<b>2. Výpočet počtu procent:</b> p = (část/základ) · 100 &nbsp;→&nbsp; 80 z 200 = 40 %',
      '<b>3. Výpočet základu:</b> základ = část · 100/p &nbsp;→&nbsp; 30 je 15 % z? → 30·100/15 = 200',
      '<b>4. Zpětná úloha:</b> cena <i>po</i> zdražení je základ! Zdražili o 20 % → nová cena = 120 %, základ = nová cena/1,2',
    ] },
  { h: 'Složené změny',
    p: [
      'Zdražení o 20 % pak sleva 20 % <b>není</b> stejná cena! 1200 · 1,2 · 0,8 = 1 200 · 0,96 = <b>1 152 Kč</b>',
      'Procenta se uplatňují z <b>aktuální</b> hodnoty, ne z původní. Proto 20 % z vyšší ceny je větší číslo než 20 % z nižší.',
    ] },
  { h: 'DPH',
    p: [
      'DPH (daň z přidané hodnoty) se přičítá k ceně bez daně. Cena s DPH = cena bez DPH · (1 + sazba/100).',
      'Příklad: cena 1 000 Kč, DPH 21 % → cena s DPH = 1 000 · 1,21 = <b>1 210 Kč</b>',
    ] },
  { h: 'Zpětná úloha — nejčastější chyba',
    p: [
      '<span style="color:#ff5555">⚠️</span> Zboží zdražilo o 10 %, nová cena je 550 Kč. Původní cena?',
      '<b>ŠPATNĚ:</b> 550 − 10 % ze 550 = 550 − 55 = 495 Kč (počítáme % ze špatného základu!)',
      '<b>SPRÁVNĚ:</b> 550 : 1,1 = <b>500 Kč</b> (základ je původní cena = 100 %)',
    ] },
 ],
 formulas: [
  '<b>část = základ · p/100</b>',
  '<b>p % = (část / základ) · 100</b>',
  '<b>základ = část · 100/p</b>',
  '<b>Zpětná úloha: základ = výsledek / (1 ± p/100)</b>',
  '<b>Cena s DPH = cena · (1 + sazba/100)</b>',
 ],
 examples: [
  { q: 'Kolik je 35 % z 240?',
    s: ['240 · 35/100 = 240 · 0,35 = <b>84</b>'] },
  { q: 'Kabát za 960 Kč je po slevě 20 %. Původní cena?',
    s: ['960 Kč = 80 % původní ceny', 'základ = 960 / 0,8 = <b>1 200 Kč</b>'] },
  { q: 'Zdražení o 20 %, pak sleva 20 %. Vstupní cena 1 000 Kč, výsledná?',
    s: ['Po zdražení: 1 000 · 1,2 = 1 200 Kč', 'Po slevě: 1 200 · 0,8 = <b>960 Kč</b> (ne 1 000!)'] },
 ],
 video: { id: 'yxORjK7z3xI', title: 'Procenta — výpočet procentové části' }
},

/* ─── Oblast 2: HORA PYTHAGOROVA ──────────────────────────────── */

'2-1': {
 mistakes: [
  {wrong:'2³ = 6', right:'2³ = 2 · 2 · 2 = 8', why:'Mocnina není násobení základu exponentem. 2³ znamená tři dvojky vynásobené mezi sebou, ne 2 × 3.'},
  {wrong:'a² · a³ = a⁶', right:'a² · a³ = a⁵', why:'Při násobení mocnin stejného základu se exponenty SČÍTAJÍ (2+3 = 5), ne násobí.'},
  {wrong:'−4² = 16', right:'−4² = −16; jen (−4)² = 16', why:'Bez závorky se umocňuje jen čtyřka, minus zůstane před ní.'},
 ],
 intro: '⛰️ Na úpatí Pythagorovy hory tě zkouší duch čísel: ovládáš mocniny a odmocniny? Bez nich na horu nevstoupíš.',
 sections: [
  { h: 'Mocniny — základní pojmy',
    p: [
      '<b>aⁿ</b> = základ <i>a</i> umocněný na <i>n</i>-tou; počítáme <i>a</i> jako činitel <i>n</i>-krát: a² = a · a, a³ = a · a · a',
      '<b>Druhá mocnina</b> a² se čte "a na druhou" nebo "a squared".',
      '<b>Druhá odmocnina</b> √a je číslo, jehož druhou mocninou je a: √25 = 5, protože 5² = 25. Odmocnina je definována jen pro a ≥ 0.',
    ] },
  { h: 'Tabulka čtverců 1² – 15²',
    p: [
      '<table style="border-collapse:collapse;font-size:12px;color:#c9d1d9;margin:6px auto"><tr><th style="padding:2px 6px;color:#ffcc00">n</th><td style="padding:2px 5px">1</td><td style="padding:2px 5px">2</td><td style="padding:2px 5px">3</td><td style="padding:2px 5px">4</td><td style="padding:2px 5px">5</td><td style="padding:2px 5px">6</td><td style="padding:2px 5px">7</td><td style="padding:2px 5px">8</td><td style="padding:2px 5px">9</td><td style="padding:2px 5px">10</td><td style="padding:2px 5px">11</td><td style="padding:2px 5px">12</td><td style="padding:2px 5px">13</td><td style="padding:2px 5px">14</td><td style="padding:2px 5px">15</td></tr><tr><th style="padding:2px 6px;color:#ffcc00">n²</th><td style="padding:2px 5px">1</td><td style="padding:2px 5px">4</td><td style="padding:2px 5px">9</td><td style="padding:2px 5px">16</td><td style="padding:2px 5px">25</td><td style="padding:2px 5px">36</td><td style="padding:2px 5px">49</td><td style="padding:2px 5px">64</td><td style="padding:2px 5px">81</td><td style="padding:2px 5px">100</td><td style="padding:2px 5px">121</td><td style="padding:2px 5px">144</td><td style="padding:2px 5px">169</td><td style="padding:2px 5px">196</td><td style="padding:2px 5px">225</td></tr></table>',
    ] },
  { h: 'Pravidla pro odmocniny',
    p: [
      '<b>√(a · b) = √a · √b</b> &nbsp;např. √(4 · 9) = √4 · √9 = 2 · 3 = 6',
      '<b>√(a/b) = √a / √b</b> &nbsp;(b &gt; 0)',
      '<b>Záporná základna:</b> (−a)² = a², ale √(a²) = <b>|a|</b> — výsledek odmocniny je vždy nezáporný!',
    ] },
  { h: 'Záporná čísla a mocniny',
    p: [
      '<span style="color:#ff5555">⚠️</span> <b>(−3)² = 9</b> (záporné číslo na sudou mocninu je kladné)',
      '<b>−3² = −9</b> (umocňujeme 3, minus je před výrazem)',
      'Vždy si zkontroluj, kde přesně jsou závorky!',
    ] },
 ],
 formulas: [
  '<b>a² = a · a</b> &nbsp;|&nbsp; <b>√(a²) = |a|</b> pro jakékoliv a',
  '<b>√(a · b) = √a · √b</b> &nbsp;(a, b ≥ 0)',
  '<b>(−a)² = a²</b> &nbsp;ale&nbsp; <b>−a² ≠ (−a)²</b>',
 ],
 examples: [
  { q: 'Spočítej: 13²',
    s: ['13 · 13 = <b>169</b> (z tabulky)'] },
  { q: 'Spočítej: √196',
    s: ['14² = 196 → <b>14</b>'] },
  { q: 'Zjednodušti: √(16 · 25)',
    s: ['√16 · √25 = 4 · 5 = <b>20</b>'] },
 ],
 video: { id: 'DVQl6pLx8qI', title: 'Druhá mocnina a odmocnina' },
},

'2-2': {
 mistakes: [
  {wrong:'√(a² + b²) = a + b', right:'√(a² + b²) nelze rozdělit na a + b', why:'Odmocninu součtu nejde roztrhnout. √(3²+4²) = √25 = 5, ne 3+4 = 7.'},
  {wrong:'c² = a² + b², a beru c = c² (zapomenu odmocnit)', right:'c = √(a² + b²)', why:'Pythagoras dá nejdřív c² (obsah čtverce). Délku přepony získáš až odmocněním.'},
  {wrong:'Přepona je jedna z kratších stran u pravého úhlu', right:'přepona je nejdelší, leží naproti pravému úhlu', why:'Odvěsny svírají pravý úhel; přepona je vždy naproti němu a je nejdelší.'},
 ],
 intro: '🧗 Na úbočí hory potřebuješ přesně změřit délku lana od základny k vrcholu. Pythagoras ti pomůže vypočítat přeponu!',
 sections: [
  { h: 'Pythagorova věta — znění',
    p: [
      'V pravoúhlém trojúhelníku platí: <b>c² = a² + b²</b>, kde <i>c</i> je přepona (nejdelší strana, naproti pravému úhlu).',
      'Česky: obsah čtverce nad přeponou se rovná součtu obsahů čtverců nad oběma odvěsnami.',
    ] },
  { h: 'Popis trojúhelníku ABC',
    p: [
      'Pravý úhel γ je u vrcholu <b>C</b>. Strana <b>c</b> (přepona) leží naproti C — je to úsečka AB.',
      'Strana <b>a</b> leží naproti vrcholu A — je to úsečka BC. Strana <b>b</b> leží naproti vrcholu B — je to úsečka AC.',
      '<svg width="200" height="160" style="display:block;margin:8px auto 0" viewBox="0 0 200 160"><polygon points="20,140 20,20 160,140" fill="none" stroke="#4a9eff" stroke-width="2"/><rect x="20" y="120" width="20" height="20" fill="none" stroke="#ffcc00" stroke-width="2"/><text x="5" y="16" font-size="13" fill="#ffcc00" font-weight="bold">A</text><text x="163" y="148" font-size="13" fill="#ffcc00" font-weight="bold">B</text><text x="3" y="152" font-size="13" fill="#ffcc00" font-weight="bold">C</text><text x="93" y="133" font-size="13" fill="#00ff88" font-weight="bold">a</text><text x="6" y="85" font-size="13" fill="#00ff88" font-weight="bold">b</text><text x="85" y="72" font-size="13" fill="#ff5555" font-weight="bold">c</text></svg>',
    ] },
  { h: 'Výpočet přepony',
    p: [
      'Jsou-li známy obě odvěsny <i>a</i> a <i>b</i>, přepona c: <b>c = √(a² + b²)</b>',
      'Pythagorejské trojice (celá čísla): <b>3–4–5</b>, <b>5–12–13</b>, <b>8–15–17</b> — tyto výsledky jsou přesné (bez odmocniny).',
    ] },
  { h: 'Přepona je vždy nejdelší',
    p: [
      '<span style="color:#ff5555">⚠️</span> Přepona musí být <b>delší než každá odvěsna</b>. Pokud ti vychází přepona kratší, něco je špatně.',
      'Přepona leží vždy naproti pravému úhlu.',
    ] },
 ],
 formulas: [
  '<b>c² = a² + b²</b>',
  '<b>c = √(a² + b²)</b>',
 ],
 examples: [
  { q: 'Odvěsny a = 3 cm, b = 4 cm. Přepona?',
    s: ['c² = 3² + 4² = 9 + 16 = 25', 'c = √25 = <b>5 cm</b> (pythagorejská trojice 3–4–5)'] },
  { q: 'Odvěsny a = 5 cm, b = 12 cm. Přepona?',
    s: ['c² = 5² + 12² = 25 + 144 = 169', 'c = √169 = <b>13 cm</b> (trojice 5–12–13)'] },
  { q: 'Obdélník 6 × 8 cm. Jak dlouhá je úhlopříčka?',
    s: ['Úhlopříčka je přepona: u² = 6² + 8² = 36 + 64 = 100', 'u = √100 = <b>10 cm</b>'] },
 ],
 video: { id: 'ssvz3u8imgk', title: 'Pythagorova věta' },
},

'2-3': {
 mistakes: [
  {wrong:'Odvěsna a = √(c² + b²)', right:'a = √(c² − b²)', why:'Od čtverce přepony se ODEČÍTÁ. c je nejdelší strana, c² je největší číslo.'},
  {wrong:'√(c² − b²) = c − b', right:'nejdřív odečti čtverce, pak odmocni', why:'Odmocninu rozdílu nejde roztrhnout. √(13²−5²) = √144 = 12, ne 13−5 = 8.'},
  {wrong:'Přeponu dosadím jako odvěsnu do a² + b²', right:'přepona patří samostatně jako c', why:'Přepona (naproti pravému úhlu) se do součtu odvěsen neplete — je to výsledné c.'},
 ],
 intro: '🪨 Řetízkový most se zhroutil — znáš délku lana (přeponu) a vzdálenost k jednomu pilíři. Dopočítej výšku druhého!',
 sections: [
  { h: 'Výpočet odvěsny',
    p: [
      'Jsou-li známy přepona c a jedna odvěsna (třeba b), druhá odvěsna: <b>a = √(c² − b²)</b>',
      '<span style="color:#ff5555">⚠️</span> <b>Od čtverce přepony odečítáme</b> — ne přičítáme. c je nejdelší strana, c² je největší číslo!',
    ] },
  { h: 'Žebřík opřený o zeď',
    p: [
      'Žebřík délky c je opřen o svislou zeď, dolní konec stojí ve vodorovné vzdálenosti b od zdi. Výška dosahu a = √(c² − b²).',
      '<svg width="180" height="160" style="display:block;margin:8px auto 0" viewBox="0 0 180 160"><line x1="30" y1="10" x2="30" y2="150" stroke="#4a9eff" stroke-width="3"/><line x1="10" y1="150" x2="170" y2="150" stroke="#4a9eff" stroke-width="3"/><line x1="30" y1="30" x2="130" y2="150" stroke="#ffcc00" stroke-width="2.5" stroke-dasharray="5,3"/><rect x="30" y="130" width="20" height="20" fill="none" stroke="#00ff88" stroke-width="1.5"/><text x="55" y="148" font-size="12" fill="#c9d1d9">b</text><text x="5" y="95" font-size="12" fill="#c9d1d9">a</text><text x="87" y="82" font-size="12" fill="#ffcc00">c</text><text x="133" y="148" font-size="10" fill="#c9d1d9">(zeď)</text></svg>',
    ] },
  { h: 'Úhlopříčka obdélníku a souřadnice',
    p: [
      'Úhlopříčka d obdélníku se stranami a, b: d = √(a² + b²) (Pythagorova věta na pravoúhlý trojúhelník).',
      'Vzdálenost dvou bodů v souřadnicové soustavě: d = √((x₂−x₁)² + (y₂−y₁)²)',
    ] },
  { h: 'Pythagorejské trojice — opakování',
    p: [
      'Celá čísla bez odmocniny: <b>3–4–5</b>, <b>5–12–13</b>, <b>8–15–17</b>. Jejich násobky také fungují (6–8–10, 9–12–15…).',
    ] },
 ],
 formulas: [
  '<b>a² = c² − b²</b>',
  '<b>a = √(c² − b²)</b>',
 ],
 examples: [
  { q: 'Přepona 13 cm, odvěsna b = 5 cm. Druhá odvěsna?',
    s: ['a² = 13² − 5² = 169 − 25 = 144', 'a = √144 = <b>12 cm</b>'] },
  { q: 'Žebřík 10 m sahá do výšky 8 m. Jak daleko stojí od zdi?',
    s: ['b² = 10² − 8² = 100 − 64 = 36', 'b = √36 = <b>6 m</b>'] },
  { q: 'Vzdálenost bodů A[1; 2] a B[4; 6]?',
    s: ['d = √((4−1)² + (6−2)²) = √(3² + 4²)', 'd = √(9 + 16) = √25 = <b>5</b>'] },
 ],
 video: { id: 'ssvz3u8imgk', title: 'Pythagorova věta' },
},

/* ─── Oblast 3: BAŽINY ROVNIC ─────────────────────────────────── */

'3-1': {
 mistakes: [
  {wrong:'3x − 4 = 11 → 3x = 11 − 4 = 7', right:'3x = 11 + 4 = 15 → x = 5', why:'Při přesunu členu přes rovnítko se MĚNÍ znaménko: −4 vlevo → +4 vpravo.'},
  {wrong:'2x = 10 → x = 10 (dělím jen levou stranu)', right:'x = 10 : 2 = 5', why:'Dělit dvěma musíš OBĚ strany rovnice, aby zůstala v rovnováze.'},
  {wrong:'7 − 2x = 1 → 2x = 1 − 7 = −6, x = −6', right:'−2x = −6 → x = 3', why:'U členu −2x zůstává znaménko minus u koeficientu; dělíš −2, ne 2.'},
 ],
 intro: '🌿 Bahno rovnicových bažin tě stahuje dolů. Jen správně sestavená a vyřešená rovnice ti ukáže pevnou cestu ven.',
 sections: [
  { h: 'Co je lineární rovnice',
    p: [
      'Rovnice = rovnost dvou výrazů obsahujících neznámou. <b>Lineární</b> = neznámá x je pouze v <b>první mocnině</b> (žádné x², x³ apod.).',
      'Řešit = najít hodnotu x, pro kterou rovnost platí. Každá lineární rovnice má právě jedno řešení (nebo žádné, nebo nekonečně mnoho).',
    ] },
  { h: 'Ekvivalentní úpravy — zlaté pravidlo vah',
    p: [
      'Rovnici neporušíme, pokud <b>na obě strany provedeme stejnou operaci</b>: přičteme/odečteme stejné číslo, vynásobíme/vydělíme stejným nenulovým číslem.',
      'Představ si váhy v rovnováze — co dáš na levou misku, musíš dát i na pravou.',
    ] },
  { h: 'Postup řešení',
    p: [
      '<b>1.</b> Rozeber závorky (roznásobení). <b>2.</b> Seber členy s x na levou stranu. <b>3.</b> Přesuň čísla na pravou stranu. <b>4.</b> Vyděl koeficientem u x.',
      '<b>Zkouška:</b> dosaď výsledek do <i>původní</i> rovnice — levá = pravá.',
    ] },
  { h: 'Násobení záporným číslem v rovnicích',
    p: [
      '<span style="color:#ff5555">⚠️</span> V rovnicích násobení/dělení záporným číslem <b>neotáčí</b> znaménko nerovnosti (to se mění jen u <i>nerovnic</i>). V rovnici zůstává = na obou stranách.',
    ] },
 ],
 formulas: [
  '<b>x + a = b → x = b − a</b>',
  '<b>a · x = b → x = b / a</b> &nbsp;(a ≠ 0)',
 ],
 examples: [
  { q: 'Vyřeš: 3x − 4 = 11',
    s: ['3x = 11 + 4 = 15', 'x = 15 : 3 = <b>5</b>', 'Zkouška: 3·5−4 = 15−4 = 11 ✓'] },
  { q: 'Vyřeš: 5x − 2 = 2x + 7',
    s: ['5x − 2x = 7 + 2', '3x = 9', 'x = <b>3</b>'] },
  { q: 'Vyřeš: 7 − 2x = 1',
    s: ['−2x = 1 − 7 = −6', 'x = −6 : (−2) = <b>3</b>', 'Zkouška: 7 − 2·3 = 1 ✓'] },
 ],
 video: { id: 'q2saJQdkF34', title: 'Rovnice' }
},

'3-2': {
 mistakes: [
  {wrong:'2(3x − 1) = 6x − 1', right:'2·3x − 2·1 = 6x − 2', why:'Číslem před závorkou se násobí KAŽDÝ člen uvnitř, ne jen první.'},
  {wrong:'3(2x+1) − (x − 4) = 6x+3 − x − 4', right:'6x + 3 − x + 4', why:'Minus před závorkou obrací znaménka VŠECH členů: −(x−4) = −x + 4.'},
  {wrong:'x/3 + 1 = 5/6 → násobím 6 jen zlomky', right:'násob 6 KAŽDÝ člen: 2x + 6 = 5', why:'Společným jmenovatelem se násobí celá rovnice včetně čísla 1 (→ 6).'},
 ],
 intro: '🐸 Strážce bažin zadává rovnice se závorkami a zlomky. Ovládni je a projdeš bez mokrých bot.',
 sections: [
  { h: 'Rovnice se závorkami',
    p: [
      'Nejdříve <b>rozeber závorky</b> (vynásob jednočlenem), pak teprve sbírej x na jednu stranu.',
      'Příklad: 2(3x − 1) = 4(x + 5) → 6x − 2 = 4x + 20 → 2x = 22 → x = 11',
    ] },
  { h: 'Rovnice se zlomky',
    p: [
      'Zbav se jmenovatelů: vynásob obě strany <b>NSN všech jmenovatelů</b>.',
      'Příklad: x/3 + 1 = 5/6 → násob 6: 2x + 6 = 5 → 2x = −1 → x = −1/2',
    ] },
  { h: 'Speciální případy',
    p: [
      '<b>0 = 0:</b> rovnice je splněna pro každé x → <b>nekonečně mnoho řešení</b> (x ∈ ℝ)',
      '<b>5 = 0</b> nebo jiný spor: rovnice nemá žádné řešení → <b>∅</b>',
    ] },
  { h: 'Vzorový příklad — celý postup',
    p: [
      'Zadání: 3(2x + 1) − (x − 4) = 2x + 15',
      '<b>Krok 1</b> — závorky: 6x + 3 − x + 4 = 2x + 15',
      '<b>Krok 2</b> — sesbírat: 5x + 7 = 2x + 15',
      '<b>Krok 3</b> — x vlevo: 5x − 2x = 15 − 7',
      '<b>Krok 4</b> — výsledek: 3x = 8 → <b>x = 8/3</b>',
    ] },
 ],
 formulas: [
  '<b>Závorky → rozeber; zlomky → vynásob NSN</b>',
  '<b>0 = 0 → ∞ řešení &nbsp;|&nbsp; c = 0 (c≠0) → žádné řešení</b>',
 ],
 examples: [
  { q: 'Vyřeš: 2(x + 3) = 3(x − 1)',
    s: ['2x + 6 = 3x − 3', '6 + 3 = 3x − 2x', 'x = <b>9</b>'] },
  { q: 'Vyřeš: x/2 − x/3 = 1',
    s: ['NSN(2,3) = 6; násob 6: 3x − 2x = 6', 'x = <b>6</b>'] },
  { q: 'Vyřeš: 4(x − 2) = 2(x + 1)',
    s: ['4x − 8 = 2x + 2', '4x − 2x = 2 + 8 → 2x = 10', 'x = <b>5</b>'] },
 ],
 video: { id: 'zDCDOr_kFBU', title: 'Rovnice se zlomky' }
},

'3-3': {
 mistakes: [
  {wrong:'Napíšu jen x = 15', right:'Odpověď: Hledané číslo je 15.', why:'Slovní úloha vyžaduje odpověď celou větou a s jednotkou, ne holé x.'},
  {wrong:'Součet je 45, jedno 2× větší → x = 45', right:'x + 2x = 45 → x = 15', why:'Rovnici sestav podle podmínky. „Součet" znamená x + 2x, ne rovnou x = 45.'},
  {wrong:'x = 15 a končím (zapomenu druhé číslo)', right:'druhé číslo 2·15 = 30', why:'Úloha se ptá na obě čísla — po nalezení x dopočítej i zbylé veličiny.'},
 ],
 intro: '🗺️ Ztracený průzkumník Akademie popisuje svůj problém slovy. Přelož ho do rovnice a zachraň ho!',
 sections: [
  { h: 'Pět kroků pro slovní úlohu',
    p: [
      '<b>1. Označ neznámou:</b> zaveď x (nebo jiné písmeno) pro hledanou veličinu — napiš, co x znamená.',
      '<b>2. Vyjádři ostatní:</b> ostatní veličiny ze zadání vyjádři pomocí x.',
      '<b>3. Sestav rovnici:</b> podle podmínky ze zadání (součet, poměr, věkový rozdíl…).',
      '<b>4. Vyřeš:</b> standardní postup (závorky → x vlevo → výsledek).',
      '<b>5. Odpověz:</b> dosaď zpět, ověř a napiš odpověď celou větou s jednotkami.',
    ] },
  { h: 'Typické typy slovních úloh',
    p: [
      '<b>Číselné:</b> jedno číslo je dvakrát druhé, jejich součet je 45 → x + 2x = 45 → x = 15.',
      '<b>Věkové:</b> otec je 3× starší než syn, za 10 let bude 2× starší… vyjádři obě věkové podmínky.',
      '<b>Pohybové:</b> dva chodci jdou vstříc → celková vzdálenost = součet uražených vzdáleností.',
    ] },
  { h: 'Úplná odpověď — povinnost!',
    p: [
      '<span style="color:#ff5555">⚠️</span> Odpověď musí obsahovat <b>jednotky</b> a být formulovaná jako <b>celá věta</b>. Samo číslo "x = 15" nestačí.',
      'Správně: „Hledané číslo je 15." nebo „Sáček stojí 45 Kč."',
    ] },
 ],
 formulas: [
  '<b>Postup:</b> neznámá → vyjádření → rovnice → řešení → odpověď s jednotkami',
 ],
 examples: [
  { q: 'Jedno číslo je dvakrát druhé. Součet čísel je 45. Jaká jsou to čísla?',
    s: ['x + 2x = 45', '3x = 45 → x = 15', 'Druhé číslo: 2·15 = 30', 'Odpověď: <b>čísla jsou 15 a 30</b>'] },
  { q: 'Martinovi je o 8 let méně než Alžbětě. Dohromady jim je 44 let. Kolik je každému?',
    s: ['x = věk Martina; Alžběta: x + 8', 'x + (x + 8) = 44 → 2x = 36 → x = 18', 'Odpověď: <b>Martin má 18 let, Alžběta 26 let</b>'] },
  { q: 'Obdélník má obvod 30 cm, délka je o 5 cm větší než šířka. Jaké jsou strany?',
    s: ['x = šířka; délka = x + 5', '2(x + x + 5) = 30 → 2(2x + 5) = 30 → 4x + 10 = 30 → x = 5', 'Odpověď: <b>šířka 5 cm, délka 10 cm</b>'] },
 ],
 video: { id: '9KL_tx0SYJk', title: 'Slovní úlohy — rovnice' }
},

/* ─── Oblast 4: VĚŽE ALGEBRY ──────────────────────────────────── */

'4-1': {
 mistakes: [
  {wrong:'Pro x = −2: 2x² = 2·−2² = −8', right:'2·(−2)² = 2·4 = 8', why:'Zápornou hodnotu při dosazení dej do závorky, jinak umocníš jen dvojku a ztratíš znaménko.'},
  {wrong:'2a + 3b = 5ab', right:'2a + 3b nelze zjednodušit', why:'Sčítat lze jen podobné členy (stejná proměnná). Různé proměnné zůstanou odděleně.'},
  {wrong:'3x² + 2x² = 5x⁴', right:'3x² + 2x² = 5x²', why:'Sčítají se koeficienty, mocnina proměnné zůstává stejná (x², ne x⁴).'},
 ],
 intro: '🏰 Strážce Věží algebry ti předloží výraz a hodnotu proměnné. Dosaď, vypočítej a postoupíš do vyšších pater!',
 sections: [
  { h: 'Algebraický výraz',
    p: [
      'Výraz = kombinace čísel, proměnných a operací <b>bez znaménka "="</b>. Má hodnotu, ale ne řešení.',
      'Příklady: 2x + 3, a² − b², 3(x − 1)/2',
    ] },
  { h: 'Dosazování hodnot',
    p: [
      'Nahraď každý výskyt proměnné daným číslem — u záporných hodnot <b>dej číslo do závorky</b>, aby ses vyhnul chybě se znaménkem.',
      'Dodržuj pořadí operací: <b>závorky → mocniny → násobení/dělení → sčítání/odčítání</b>.',
    ] },
  { h: 'Zjednodušování — sčítání podobných členů',
    p: [
      '<b>Podobné členy</b> mají stejnou proměnnou ve stejné mocnině. Lze je sčítat: 2a + 3a = 5a.',
      '<span style="color:#ff5555">⚠️</span> 2a + 3b <b>nelze zjednodušit</b> — různé proměnné se nesčítají.',
      'Příklad: 3x² − x + 2x² + 5x = 5x² + 4x',
    ] },
 ],
 formulas: [
  '<b>Dosazení:</b> nahraď proměnnou číslem, zachovej závorky a pořadí operací',
  '<b>Podobné členy:</b> koeficienty u stejné proměnné sečti',
 ],
 examples: [
  { q: 'Urči hodnotu výrazu 2x² − 3x + 1 pro x = −2',
    s: ['2·(−2)² − 3·(−2) + 1', '= 2·4 + 6 + 1', '= 8 + 6 + 1 = <b>15</b>'] },
  { q: 'Zjednodušti: 4a − 2b + a + 5b',
    s: ['Sesbírej a: 4a + a = 5a', 'Sesbírej b: −2b + 5b = 3b', 'Výsledek: <b>5a + 3b</b>'] },
  { q: 'Urči hodnotu výrazu 3a − 2b pro a = 4, b = −1',
    s: ['3·4 − 2·(−1)', '= 12 + 2 = <b>14</b>'] },
 ],
 video: { id: 'TwzbrIEIwn0', title: 'Algebraické vzorce 1' }
},

'4-2': {
 mistakes: [
  {wrong:'(a + b)² = a² + b²', right:'(a + b)² = a² + 2ab + b²', why:'Zapomenutý prostřední člen 2ab. Kontrola: (3+4)² = 49, ale 3²+4² = 25.'},
  {wrong:'(2x − 5)² = 2x² − 25', right:'(2x)² − 2·2x·5 + 5² = 4x² − 20x + 25', why:'Umocňuje se celý člen 2x (→ 4x²) a nesmí chybět prostřední 2ab.'},
  {wrong:'(a − b)² = a² + 2ab + b²', right:'(a − b)² = a² − 2ab + b²', why:'U rozdílu je prostřední člen záporný (−2ab).'},
 ],
 intro: '✨ V čarodějnické věži se skrývají tři magické vzorce pro druhou mocninu. Ovládni je a algebraické kouzlo bude tvoje!',
 sections: [
  { h: 'Tři algebraické vzorce',
    p: [
      '<b>(a + b)² = a² + 2ab + b²</b> — druhá mocnina součtu',
      '<b>(a − b)² = a² − 2ab + b²</b> — druhá mocnina rozdílu',
      '<b>(a + b)(a − b) = a² − b²</b> — součin součtu a rozdílu (rozdíl čtverců)',
    ] },
  { h: 'Geometrický důkaz (a+b)²',
    p: [
      'Velký čtverec strany (a+b) rozdělíme na 4 části:',
      '<svg width="200" height="185" style="display:block;margin:8px auto 0" viewBox="0 0 200 185"><rect x="20" y="10" width="160" height="160" fill="none" stroke="#4a9eff" stroke-width="2"/><line x1="110" y1="10" x2="110" y2="170" stroke="#ffcc00" stroke-width="1.5" stroke-dasharray="4,2"/><line x1="20" y1="100" x2="180" y2="100" stroke="#ffcc00" stroke-width="1.5" stroke-dasharray="4,2"/><text x="58" y="58" font-size="15" fill="#00ff88" text-anchor="middle" font-weight="bold">a²</text><text x="145" y="58" font-size="14" fill="#c9d1d9" text-anchor="middle">ab</text><text x="58" y="138" font-size="14" fill="#c9d1d9" text-anchor="middle">ab</text><text x="145" y="138" font-size="15" fill="#00ff88" text-anchor="middle" font-weight="bold">b²</text><text x="63" y="180" font-size="12" fill="#ffcc00" text-anchor="middle">a</text><text x="143" y="180" font-size="12" fill="#ffcc00" text-anchor="middle">b</text><text x="10" y="58" font-size="12" fill="#ffcc00" text-anchor="middle">a</text><text x="10" y="138" font-size="12" fill="#ffcc00" text-anchor="middle">b</text></svg>',
      'Obsah = a² + ab + ab + b² = <b>a² + 2ab + b²</b>',
    ] },
  { h: 'Nejčastější chyba!',
    p: [
      '<span style="color:#ff5555">⚠️</span> <b>(a + b)² ≠ a² + b²</b> — studenti zapomínají na <b>2ab</b>!',
      'Příklad: (3 + 4)² = 7² = 49, ale 3² + 4² = 9 + 16 = 25 ≠ 49.',
    ] },
 ],
 formulas: [
  '<b>(a + b)² = a² + 2ab + b²</b>',
  '<b>(a − b)² = a² − 2ab + b²</b>',
  '<b>(a + b)(a − b) = a² − b²</b>',
 ],
 examples: [
  { q: 'Rozepiš (x + 3)²',
    s: ['a = x, b = 3', 'x² + 2·x·3 + 3² = <b>x² + 6x + 9</b>'] },
  { q: 'Rozepiš (2x − 5)²',
    s: ['a = 2x, b = 5', '(2x)² − 2·2x·5 + 5² = <b>4x² − 20x + 25</b>'] },
  { q: 'Vypočítej (x − 7)(x + 7)',
    s: ['Rozdíl čtverců: a = x, b = 7', 'x² − 7² = <b>x² − 49</b>'] },
 ],
 video: { id: 'nD2ZY0V5aPE', title: 'Výrazy – vzorce' },
},

'4-3': {
 mistakes: [
  {wrong:'6x² − 9x = 3(2x² − 3x)', right:'3x(2x − 3)', why:'Vytýká se i společná proměnná x, ne jen číslo. Zkontroluj roznásobením.'},
  {wrong:'x² − 4x vytknu na x²(1 − 4)', right:'x(x − 4)', why:'Vytýkej nejnižší společnou mocninu (x¹), ne x². Uvnitř zůstane x − 4.'},
  {wrong:'5a − 5 = 5(a)', right:'5(a − 1)', why:'Po vytknutí musí ve druhém členu zůstat 1 (5 = 5·1), ne nic.'},
 ],
 intro: '🔮 Mistr algebry z Věže se nenechá oklamat složitými výrazy. Vytkni společného činitele a zjednodušíš každé kouzlo!',
 sections: [
  { h: 'Vytýkání — princip',
    p: [
      'Vytýkání je obrácená distributivita: ab + ac = <b>a(b + c)</b>. Hledáme, co mají všechny členy společné.',
      'Vytýkáme <b>největší společný dělitel čísel</b> a <b>nejnižší společnou mocninu proměnné</b>.',
    ] },
  { h: 'Postup',
    p: [
      '<b>1.</b> Najdi NSD koeficientů. <b>2.</b> Najdi nejnižší mocninu proměnné vyskytující se ve všech členech. <b>3.</b> Tyto dej před závorku. <b>4.</b> Do závorky napiš, čím vychází zbývající části.',
      'Příklad: 6x² − 9x = <b>3x</b> · (2x − 3) &nbsp;[NSD(6,9)=3; nejnižší mocnina x¹]',
    ] },
  { h: 'Kombinace s rozdílem čtverců',
    p: [
      'x² − 4 = (x − 2)(x + 2) &nbsp;→&nbsp; vzorec a² − b²',
      '2x² − 8 = 2(x² − 4) = <b>2(x − 2)(x + 2)</b> &nbsp;→&nbsp; nejdřív vytkni 2, pak rozlož',
    ] },
  { h: 'Ověření rozkladu',
    p: [
      'Vždy ověř zpětným roznásobením: <b>3x(2x − 3) = 6x² − 9x</b> ✓',
    ] },
 ],
 formulas: [
  '<b>ab + ac = a(b + c)</b>',
  '<b>a² − b² = (a − b)(a + b)</b>',
 ],
 examples: [
  { q: 'Vytkni: 12x³ + 8x²',
    s: ['NSD(12,8) = 4; nejnižší mocnina x²', '= <b>4x²(3x + 2)</b>', 'Ověř: 4x²·3x + 4x²·2 = 12x³ + 8x² ✓'] },
  { q: 'Rozlož: 3x² − 12',
    s: ['Vytkni 3: 3(x² − 4)', 'Rozdíl čtverců: <b>3(x − 2)(x + 2)</b>'] },
  { q: 'Vytkni: 10ab − 15a',
    s: ['NSD(10,15) = 5; společná proměnná a', '= <b>5a(2b − 3)</b>'] },
 ],
 video: { id: 'LOuVE-8-3xs', title: 'Vytýkání' },
},

/* ─── Oblast 5: JEZERO KRUŽNIC ────────────────────────────────── */

'5-1': {
 mistakes: [
  {wrong:'Obsah kruhu S = 2πr', right:'S = πr² (obvod je 2πr)', why:'Obvod je čára (r jednou), obsah je plocha (r na druhou). Nezaměňuj vzorce.'},
  {wrong:'Do vzorců dosadím průměr místo poloměru', right:'r je poloměr = polovina průměru', why:'Když znáš průměr d, poloměr je r = d : 2. Záměna d a r zdvojnásobí výsledek.'},
  {wrong:'Obvod pro r = 7: o = 2 · 7 = 14', right:'o = 2πr = 2 · 3,14 · 7 = 43,96', why:'Nezapomeň na π. Bez něj vyjde jen dvojnásobek poloměru, ne obvod.'},
 ],
 intro: '🌊 Hladina Akademického jezera tvoří dokonalý kruh. Spočítej jeho obvod i obsah a získáš klíč k vodnímu chrámu.',
 sections: [
  { h: 'Kružnice vs. kruh',
    p: [
      '<b>Kružnice</b> = jen <i>obvod</i> (čára), <b>kruh</b> = celá vyplněná plocha (disk).',
      'Poloměr <b>r</b> = vzdálenost středu k okraji. Průměr <b>d = 2r</b>.',
    ] },
  { h: 'Obvod a obsah',
    p: [
      '<b>Obvod kružnice:</b> o = 2πr = πd',
      '<b>Obsah kruhu:</b> S = πr²',
      'π ≈ 3,14 nebo přesněji 22/7. Ve výpočtech bez instrukce použij 3,14.',
      '<svg width="180" height="160" style="display:block;margin:8px auto 0" viewBox="0 0 180 160"><circle cx="90" cy="80" r="55" fill="none" stroke="#4a9eff" stroke-width="2.5"/><circle cx="90" cy="80" r="3" fill="#ffcc00"/><line x1="90" y1="80" x2="145" y2="80" stroke="#ffcc00" stroke-width="2"/><text x="112" y="73" font-size="13" fill="#ffcc00" font-weight="bold">r</text><line x1="35" y1="80" x2="145" y2="80" stroke="#00ff88" stroke-width="1.5" stroke-dasharray="5,3"/><text x="80" y="103" font-size="12" fill="#00ff88">d = 2r</text><line x1="90" y1="25" x2="130" y2="55" stroke="#ff5555" stroke-width="1.5" stroke-dasharray="4,3"/><text x="120" y="40" font-size="11" fill="#ff5555">tětiva</text></svg>',
    ] },
  { h: 'Záměna vzorců — nejčastější chyba',
    p: [
      '<span style="color:#ff5555">⚠️</span> Obvod obsahuje <b>r</b> (nebo d), obsah obsahuje <b>r²</b>.',
      'Pamatuj: Obvod je <i>čára</i> (1D) → r jednou. Obsah je <i>plocha</i> (2D) → r².',
    ] },
 ],
 formulas: [
  '<b>Obvod: o = 2πr = πd</b>',
  '<b>Obsah: S = πr²</b>',
  '<b>π ≈ 3,14</b>',
 ],
 examples: [
  { q: 'Kruh s r = 7 cm. Obvod? Obsah? (π ≈ 3,14)',
    s: ['o = 2 · 3,14 · 7 = <b>43,96 cm</b>', 'S = 3,14 · 7² = 3,14 · 49 = <b>153,86 cm²</b>'] },
  { q: 'Kolo má průměr d = 60 cm. Jak daleko ujede za jednu otáčku?',
    s: ['o = π · d = 3,14 · 60 = <b>188,4 cm</b>'] },
  { q: 'Kruh má obsah 50,24 cm². Jaký je jeho poloměr? (π ≈ 3,14)',
    s: ['S = πr² → 50,24 = 3,14 · r² → r² = 16', 'r = √16 = <b>4 cm</b>'] },
 ],
 video: { id: 'Cj3fwDlrpPM', title: 'Obvod a obsah kruhu' },
},

'5-2': {
 mistakes: [
  {wrong:'Povrch válce = plášť = 2πrv', right:'S = 2πr² + 2πrv (plášť + 2 podstavy)', why:'Plášť je jen boční stěna. Celý povrch přidává i dvě kruhové podstavy 2πr².'},
  {wrong:'Objem válce V = πr · v', right:'V = πr² · v', why:'Objem = obsah podstavy (πr²) × výška. Poloměr je na druhou, ne jednou.'},
  {wrong:'Plášť rozvinu na obdélník se stranou r', right:'strana pláště = obvod podstavy 2πr', why:'Rozvinutý plášť má šířku rovnou obvodu kruhu (2πr), ne poloměru.'},
 ],
 intro: '🛢️ Ze dna jezera vyčnívá válcová věž. Aby ses dostal dovnitř, musíš spočítat, kolik materiálu tvoří její povrch a objem!',
 sections: [
  { h: 'Popis válce',
    p: [
      'Válec má dvě shodné <b>kruhové podstavy</b> (poloměr r) a <b>plášť</b> (boční povrch) o výšce v.',
      'Plášť rozvinutý do roviny = <b>obdélník</b> o stranách 2πr (= obvod základny) a v.',
    ] },
  { h: 'Objem a povrch',
    p: [
      '<b>Objem V = πr² · v</b> &nbsp;(obsah podstavy × výška)',
      '<b>Povrch S = 2πr² + 2πrv</b> &nbsp;(2 podstavy + plášť)',
      '<b>Plášť: S<sub>pl</sub> = 2πrv</b> &nbsp;(někdy se ptají jen na plášť)',
    ] },
  { h: 'Rozvinutý plášť',
    p: [
      '<svg width="290" height="140" style="display:block;margin:8px auto 0" viewBox="0 0 290 140"><ellipse cx="50" cy="60" rx="30" ry="12" fill="none" stroke="#4a9eff" stroke-width="2"/><ellipse cx="50" cy="100" rx="30" ry="12" fill="none" stroke="#4a9eff" stroke-width="2"/><line x1="20" y1="60" x2="20" y2="100" stroke="#4a9eff" stroke-width="2"/><line x1="80" y1="60" x2="80" y2="100" stroke="#4a9eff" stroke-width="2"/><text x="85" y="83" font-size="12" fill="#ffcc00">v</text><text x="42" y="58" font-size="11" fill="#c9d1d9">r</text><line x1="50" y1="60" x2="80" y2="60" stroke="#ffcc00" stroke-width="1.5"/><text x="115" y="70" font-size="18" fill="#ffcc00">→</text><rect x="145" y="20" width="120" height="100" fill="none" stroke="#00ff88" stroke-width="2"/><text x="195" y="128" font-size="12" fill="#ffcc00" text-anchor="middle">2πr</text><text x="270" y="75" font-size="12" fill="#ffcc00">v</text></svg>',
      'Plášť jako obdélník: šířka = obvod kružnice = <b>2πr</b>, výška = <b>v</b>. Obsah plášte = 2πr · v.',
    ] },
 ],
 formulas: [
  '<b>Objem válce: V = πr²v</b>',
  '<b>Povrch válce: S = 2πr² + 2πrv = 2πr(r + v)</b>',
  '<b>Plášť: S<sub>pl</sub> = 2πrv</b>',
 ],
 examples: [
  { q: 'Válec r = 3 cm, v = 10 cm. Objem? (π ≈ 3,14)',
    s: ['V = 3,14 · 3² · 10 = 3,14 · 9 · 10 = <b>282,6 cm³</b>'] },
  { q: 'Tentýž válec (r = 3, v = 10). Povrch?',
    s: ['S = 2 · 3,14 · 3 · (3 + 10) = 6,28 · 3 · 13 = 6,28 · 39 = <b>244,92 cm²</b>'] },
  { q: 'Válec r = 2 cm, v = 5 cm. Obsah pláště? (π ≈ 3,14)',
    s: ['S_pl = 2πrv = 2 · 3,14 · 2 · 5', '= 6,28 · 10 = <b>62,8 cm²</b>'] },
 ],
 video: { id: 'GG9WF955El4', title: 'Objem a povrch válce' },
},

'5-3': {
 mistakes: [
  {wrong:'Mezikruží S = π(R − r)²', right:'S = π(R² − r²)', why:'Odečítají se OBSAHY (R² a r²), ne poloměry. (R−r)² dá jiné, menší číslo.'},
  {wrong:'0,6 m³ = 6 litrů', right:'0,6 m³ = 600 litrů (1 m³ = 1000 l)', why:'1 m³ = 1000 dm³ = 1000 litrů. Hlídej převod jednotek objemu.'},
  {wrong:'Na zalití trávníku počítám obvod', right:'plocha trávníku = obsah πr²', why:'Obvod je jen délka okraje. Kolik trávy zaleješ určuje obsah, ne obvod.'},
 ],
 intro: '🎣 Akademický rybář potřebuje tvou pomoc s kruhovým jezerem i sudovým zásobníkem. Reálné slovní úlohy tě čekají!',
 sections: [
  { h: 'Rozlišení obvod / obsah / objem',
    p: [
      '<b>Obvod</b> = délka okraje (plot, obruba…)',
      '<b>Obsah</b> = velikost plochy (tráva, nátěr…)',
      '<b>Objem</b> = kolik se vejde dovnitř (voda, písek, vzduch…)',
    ] },
  { h: 'Mezikruží (annulus)',
    p: [
      'Mezikruží = plocha mezi dvěma soustřednými kružnicemi. S = π(R² − r²) = π(R − r)(R + r)',
      'Příklad: běžecká dráha šíře 2 m, vnitřní poloměr 50 m → S = π(52² − 50²) = π·2·102 = 204π ≈ 641 m²',
    ] },
  { h: 'Převody jednotek objemu',
    p: [
      '<b>1 litr = 1 dm³ = 1 000 cm³</b>',
      '<b>1 dl = 0,1 l = 100 cm³</b>',
      'Hlídat při výpočtu objemu válce: jsou r a v ve stejných jednotkách?',
    ] },
  { h: 'Vícekrokové úlohy',
    p: [
      'Typický postup: z obsahu kruhu zjisti r → dosaď do vzorce pro objem válce.',
      'Příklad: Bazén s obsahem dna 28,26 m² (S = πr²). Jaký má poloměr? r = √(S/π) = √(28,26/3,14) = √9 = 3 m.',
    ] },
 ],
 formulas: [
  '<b>Mezikruží: S = π(R² − r²)</b>',
  '<b>1 l = 1 dm³ = 1 000 cm³</b>',
  '<b>Obvod: o = 2πr &nbsp;|&nbsp; Obsah: S = πr² &nbsp;|&nbsp; Objem válce: V = πr²v</b>',
 ],
 examples: [
  { q: 'Kruhový záhon r = 3 m. Kolik metrů plot? Kolik m² tráva? (π ≈ 3,14)',
    s: ['Plot (obvod): o = 2·3,14·3 = <b>18,84 m</b>', 'Tráva (obsah): S = 3,14·9 = <b>28,26 m²</b>'] },
  { q: 'Válcový sud r = 0,4 m, v = 1,2 m. Kolik litrů pojme?',
    s: ['V = 3,14 · 0,16 · 1,2 = 0,602 88 m³', '0,602 88 m³ = 602,88 dm³ = <b>přibližně 603 litrů</b>'] },
  { q: 'Mezikruží: vnější poloměr R = 5 cm, vnitřní r = 3 cm. Obsah? (π ≈ 3,14)',
    s: ['S = π(R² − r²) = 3,14 · (25 − 9)', '= 3,14 · 16 = <b>50,24 cm²</b>'] },
 ],
 video: { id: '0WyDjeYY2mg', title: 'Obsah mezikruží' }
},

/* ─── Oblast 6: DÍLNA KONSTRUKCÍ ──────────────────────────────── */

'6-1': {
 mistakes: [
  {wrong:'Osa úsečky a osa úhlu je totéž', right:'osa úsečky = stejná vzdálenost od 2 BODŮ; osa úhlu = od 2 RAMEN', why:'Osa úsečky je kolmá na úsečku a půlí ji; osa úhlu půlí úhel a prochází vrcholem. Různé množiny.'},
  {wrong:'Kružnice je vyplněný kruh', right:'kružnice = jen čára (okraj), kruh = plocha', why:'Množina bodů ve vzdálenosti r od středu je jen čára — kružnice, ne vyplněný disk.'},
  {wrong:'Osa úsečky nemusí procházet středem', right:'prochází přesně středem a je kolmá', why:'Jen body u středu jsou stejně daleko od A i B; osa proto vede středem kolmo na AB.'},
 ],
 intro: '🔧 V Citadelové dílně se rýsuje kompasem a pravítkem. Pochop množiny bodů — základ každé geometrické konstrukce.',
 sections: [
  { h: 'Co je množina bodů dané vlastnosti',
    p: [
      'Soubor <b>všech</b> bodů roviny, které splňují danou podmínku. Obvykle tvoří známou geometrickou figuru.',
    ] },
  { h: 'Základní množiny',
    p: [
      '<b>Kružnice:</b> všechny body ve vzdálenosti r od středu S.',
      '<b>Úsečka:</b> všechny body mezi body A a B (včetně krajních).',
      '<b>Polopřímka:</b> všechny body od bodu A jedním směrem (vychází z A, nekonečná).',
      '<b>Osa úsečky:</b> všechny body stejně vzdálené od A i B — je kolmá na AB a prochází jeho středem.',
      '<b>Osa úhlu:</b> všechny body stejně vzdálené od obou ramen úhlu — prochází vrcholem, dělí úhel na dvě shodné části.',
    ] },
  { h: 'Konstrukce osy úsečky',
    p: [
      'Postup: (1) Z bodu A narýsuj kružnici s r &gt; AB/2. (2) Z bodu B narýsuj kružnici se stejným r. (3) Spoj průsečíky P₁ a P₂ — to je osa úsečky AB.',
      '<svg width="200" height="160" style="display:block;margin:8px auto 0" viewBox="0 0 200 160"><circle cx="60" cy="80" r="55" fill="none" stroke="#4a9eff" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/><circle cx="140" cy="80" r="55" fill="none" stroke="#4a9eff" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/><circle cx="60" cy="80" r="4" fill="#ffcc00"/><circle cx="140" cy="80" r="4" fill="#ffcc00"/><text x="52" y="97" font-size="12" fill="#ffcc00">A</text><text x="141" y="97" font-size="12" fill="#ffcc00">B</text><line x1="60" y1="80" x2="140" y2="80" stroke="#c9d1d9" stroke-width="1.5"/><circle cx="100" cy="26" r="4" fill="#00ff88"/><circle cx="100" cy="134" r="4" fill="#00ff88"/><line x1="100" y1="10" x2="100" y2="150" stroke="#00ff88" stroke-width="2"/><text x="106" y="22" font-size="11" fill="#00ff88">P₁</text><text x="106" y="147" font-size="11" fill="#00ff88">P₂</text></svg>',
    ] },
 ],
 formulas: [
  '<b>Kružnice:</b> |SP| = r pro všechna P na kružnici',
  '<b>Osa úsečky AB:</b> |PA| = |PB|',
  '<b>Osa úhlu:</b> d(P, r₁) = d(P, r₂) pro obě ramena r₁, r₂',
 ],
 examples: [
  { q: 'Jaká množina jsou body vzdálené právě 4 cm od bodu O?',
    s: ['Všechny body ve vzdálenosti 4 cm → <b>kružnice se středem O a poloměrem 4 cm</b>'] },
  { q: 'Jaká množina jsou body stejně vzdálené od bodů A a B?',
    s: ['<b>Osa úsečky AB</b> — přímka kolmá na AB procházející jeho středem'] },
  { q: 'Jaká množina jsou body stejně vzdálené od obou ramen úhlu?',
    s: ['Body se stejnou vzdáleností od obou ramen', '→ <b>osa úhlu</b> (prochází vrcholem)'] },
 ],
 video: { id: 'M5MoEys_w5I', title: 'Množiny bodů dané vlastnosti 1' }
},

'6-2': {
 mistakes: [
  {wrong:'Thaletova kružnice má poloměr rovný přeponě', right:'přepona = PRŮMĚR; poloměr = přepona : 2', why:'Přepona je průměr Thaletovy kružnice. Poloměr je tedy její polovina.'},
  {wrong:'Každý úhel vepsaný do kružnice je 90°', right:'jen úhel nad PRŮMĚREM je 90° (Thales)', why:'Thaletova věta platí jen pro vrchol na kružnici nad průměrem, ne pro libovolnou tětivu.'},
  {wrong:'Střed Thaletovy kružnice je vrchol pravého úhlu', right:'střed je uprostřed přepony AB', why:'Střed leží ve středu průměru (přepony), ne v bodě P s pravým úhlem.'},
 ],
 intro: '⚙️ Mistr konstruktér Akademie tě učí Thaletovu kružnici. Kdo ji ovládne, může sestrojit pravý úhel kdekoliv!',
 sections: [
  { h: 'Thaletova věta',
    p: [
      'Pokud je AB průměr kružnice a P je libovolný bod na kružnici (odlišný od A a B), pak <b>∠APB = 90°</b>.',
      'Jinými slovy: trojúhelník vepsaný do kružnice s přeponou rovnou průměru je pravoúhlý.',
    ] },
  { h: 'Thaletova kružnice',
    p: [
      '<svg width="200" height="190" style="display:block;margin:8px auto 0" viewBox="0 0 200 190"><circle cx="100" cy="110" r="70" fill="none" stroke="#4a9eff" stroke-width="2"/><circle cx="30" cy="110" r="4" fill="#ffcc00"/><circle cx="170" cy="110" r="4" fill="#ffcc00"/><circle cx="100" cy="40" r="4" fill="#00ff88"/><line x1="30" y1="110" x2="170" y2="110" stroke="#4a9eff" stroke-width="2"/><line x1="30" y1="110" x2="100" y2="40" stroke="#c9d1d9" stroke-width="1.5"/><line x1="170" y1="110" x2="100" y2="40" stroke="#c9d1d9" stroke-width="1.5"/><text x="22" y="128" font-size="13" fill="#ffcc00">A</text><text x="170" y="128" font-size="13" fill="#ffcc00">B</text><text x="103" y="36" font-size="13" fill="#00ff88">P</text><rect x="94" y="40" width="12" height="12" fill="none" stroke="#ff5555" stroke-width="2" transform="rotate(-30,100,46)"/><text x="88" y="68" font-size="11" fill="#ff5555">90°</text></svg>',
      'Středem průměru AB je střed kružnice S = střed AB.',
    ] },
  { h: 'Konstrukce pravoúhlého trojúhelníku s danou přeponou',
    p: [
      '(1) Narýsuj úsečku AB = požadovaná přepona. (2) Sestav kružnici s průměrem AB (střed = střed AB). (3) Jakýkoli bod P na kružnici dá pravoúhlý trojúhelník APB s pravým úhlem u P.',
    ] },
  { h: 'Praktické využití',
    p: [
      'Sestrojení tečny z vnějšího bodu T ke kružnici k: průsečíky Thaletovy kružnice nad TS (S = střed k) s kružnicí k jsou dotyčné body.',
    ] },
 ],
 formulas: [
  '<b>Thaletova věta: P na kružnici nad průměrem AB ⟹ ∠APB = 90°</b>',
 ],
 examples: [
  { q: 'AB je průměr kružnice, C leží na kružnici. Jaký je úhel ACB?',
    s: ['Thaletova věta → <b>∠ACB = 90°</b>'] },
  { q: 'Narýsuj pravoúhlý trojúhelník s přeponou 6 cm. Popiš postup.',
    s: ['Narýsuj AB = 6 cm', 'Střed S = střed AB; kružnice se středem S a r = 3 cm', 'Vyber P na kružnici (ne A, B) → trojúhelník APB je pravoúhlý u P'] },
  { q: 'Přepona pravoúhlého trojúhelníku je 10 cm. Jaký poloměr má Thaletova kružnice?',
    s: ['Thaletova kružnice má průměr roven přeponě = 10 cm', 'r = 10 : 2 = <b>5 cm</b>'] },
 ],
 video: { id: '1rYON5bw8_w', title: 'Množiny bodů dané vlastnosti 2 — Thaletova kružnice' }
},

'6-3': {
 mistakes: [
  {wrong:'Podle osy x: (2, 5) → (−2, 5)', right:'(2, −5)', why:'Osa x je vodorovná, zrcadlí nahoru/dolů → mění se y. Znaménko x mění osa y.'},
  {wrong:'Čtverec má 2 osy souměrnosti', right:'čtverec má 4 osy', why:'Kromě dvou spojnic středů stran má čtverec i dvě úhlopříčky jako osy.'},
  {wrong:'Osa úsečky je rovnoběžná s úsečkou', right:'osa je KOLMÁ na úsečku', why:'Osa úsečky svírá s úsečkou pravý úhel a prochází jejím středem.'},
 ],
 intro: '📐 Závěrečná zkouška dílny: osy a souměrnosti v praktických konstrukcích. Bez nich nelze postavit ani bránu Citadely!',
 sections: [
  { h: 'Osa úsečky',
    p: [
      'Osa úsečky AB = <b>kolmá přímka procházející středem AB</b>. Každý bod na ose je stejně vzdálený od A i od B.',
      'Konstrukce: viz mise 6-1 — dvě kružnice z A a B se stejným r &gt; AB/2, spoj průsečíky.',
    ] },
  { h: 'Osa úhlu',
    p: [
      'Osa úhlu = <b>přímka dělící úhel na dvě shodné poloviny</b>. Každý bod na ose je stejně vzdálený od obou ramen úhlu.',
      'Konstrukce: (1) Z vrcholu V narýsuj kružnici → průsečíky s rameny P₁ a P₂. (2) Z P₁ a P₂ narýsuj stejně velké kružnice → průsečík Q. (3) Přímka VQ je osa úhlu.',
    ] },
  { h: 'Souměrnosti',
    p: [
      '<b>Osová souměrnost:</b> obraz bodu P v ose o je bod P\' takový, že osa o je osou úsečky PP\'.',
      '<b>Středová souměrnost:</b> obraz bodu P ve středu S je bod P\' takový, že S je středem úsečky PP\'.',
      'Osa souměrnosti tvaru = přímka, přes kterou lze tvar přeložit na sebe. Kruh má nekonečně mnoho os (každý průměr).',
    ] },
  { h: 'Vazba na množiny bodů',
    p: [
      'Osa souměrnosti je zároveň <b>množinou bodů stejně vzdálených od dvou bodů nebo ramen</b> — propojení s misí 6-1.',
    ] },
 ],
 formulas: [
  '<b>Osa úsečky:</b> |PA| = |PB| (kolmá na AB, prochází středem)',
  '<b>Osa úhlu:</b> d(P, r₁) = d(P, r₂)',
 ],
 examples: [
  { q: 'Bod A = (1; 0), B = (5; 0). Kde leží osa úsečky AB?',
    s: ['Střed AB = (3; 0)', 'Osa úsečky je kolmá na AB (= osa x) procházející (3;0)', 'Osa úsečky: <b>přímka x = 3</b>'] },
  { q: 'Kolik os souměrnosti má čtverec?',
    s: ['Čtverec má <b>4 osy</b>: 2 spojující středy protilehlých stran, 2 diagonály'] },
  { q: 'Bod P[2; 5] zobraz osovou souměrností podle osy x. Najdi P\'.',
    s: ['Podle osy x se mění znaménko y: (x; y) → (x; −y)', 'P\'[<b>2; −5</b>]'] },
 ],
 video: { id: 'Rm937j0MHxA', title: 'Tečna ke kružnici a Thaletova kružnice' }
},

/* ─── Oblast 7: CITADELA ARCIMÁGA ─────────────────────────────── */

'7-1': {
 mistakes: [
  {wrong:'x+y=20, x−y=6, sečtu na 2x = 14', right:'2x = 26 → x = 13', why:'Sčítáš levé i pravé strany: (x+y)+(x−y) = 20+6 = 26. Pozor na sečtení pravých stran.'},
  {wrong:'Přepona z odvěsen 8 a 15: c = 8 + 15 = 23', right:'c = √(8² + 15²) = √289 = 17', why:'Přepona se počítá Pythagorovou větou, ne prostým součtem odvěsen.'},
  {wrong:'Obvod kruhu 31,4 → obsah = 31,4', right:'z obvodu urči r = 5, pak S = πr² = 78,5', why:'Obvod a obsah jsou různé veličiny. Nejdřív z obvodu poloměr, pak obsah.'},
 ],
 intro: '🏛️ Velká brána Citadely arcimága! Projít smíš jen tehdy, zvládneš-li úlohy kombinující všechna témata 8. ročníku.',
 sections: [
  { h: 'Co jsi za rok zvládl',
    p: [
      '<b>Oblast 1:</b> celá a racionální čísla, procenta (4 typy + složené + DPH)',
      '<b>Oblast 2:</b> druhá mocnina a odmocnina, Pythagorova věta (přepona i odvěsna)',
      '<b>Oblast 3:</b> lineární rovnice (jednoduché, se závorkami, zlomky, slovní úlohy)',
      '<b>Oblast 4:</b> algebraické výrazy, vzorce (a±b)², vytýkání',
      '<b>Oblast 5:</b> kruh a kružnice, válec (obsah, obvod, objem, povrch), slovní úlohy',
      '<b>Oblast 6:</b> množiny bodů, Thaletova kružnice, osy a souměrnosti',
    ] },
  { h: 'Propojení témat',
    p: [
      'Pythagorova věta potřebuje odmocniny (oblast 2). Slovní úlohy z geometrie vedou na rovnice (oblasti 3 a 5). Algebraické vzorce se kombinují s rovnicemi (oblasti 3 a 4).',
      'Složená úloha: obsah kruhu = πr² → z toho r → objem válce πr²v → převod na litry.',
    ] },
  { h: 'Strategie při kombinovaných úlohách',
    p: [
      '<b>1.</b> Načrtni obrázek u geometrie. <b>2.</b> Zaveď neznámou pro hledanou veličinu. <b>3.</b> Napiš rovnici / vzorec. <b>4.</b> Proveď zkoušku nebo ověření. <b>5.</b> Odpověz celou větou s jednotkami.',
    ] },
 ],
 formulas: [
  '<b>c = √(a² + b²)</b> &nbsp;|&nbsp; <b>S<sub>kruhu</sub> = πr²</b> &nbsp;|&nbsp; <b>V<sub>válce</sub> = πr²v</b>',
  '<b>(a+b)² = a²+2ab+b²</b> &nbsp;|&nbsp; <b>(a+b)(a−b) = a²−b²</b>',
 ],
 examples: [
  { q: 'Součet dvou čísel je 20, jejich rozdíl je 6. Jaká jsou čísla?',
    s: ['x + y = 20 a x − y = 6', 'Sečteme: 2x = 26 → x = 13', 'y = 20 − 13 = 7', 'Čísla jsou <b>13 a 7</b>'] },
  { q: 'Pravoúhlý trojúhelník: odvěsna a = 8 cm, b = 15 cm. Obsah trojúhelníku a délka přepony.',
    s: ['Přepona: c = √(8² + 15²) = √(64+225) = √289 = <b>17 cm</b>', 'Obsah: S = a·b/2 = 8·15/2 = <b>60 cm²</b>'] },
  { q: 'Bazén ve tvaru kruhu má obvod 31,4 m. Jaký je jeho obsah? (π ≈ 3,14)',
    s: ['Z obvodu: o = 2πr → 31,4 = 6,28 · r → r = 5 m', 'S = πr² = 3,14 · 25 = <b>78,5 m²</b>'] },
 ],
 video: { id: 'f4CXEHf_3gw', title: 'CERMAT 2024 — přijímací zkoušky' }
},

'7-2': {
 mistakes: [
  {wrong:'Sleva 10 %, cena 1 440 → původní = 1 440 + 144 = 1 584', right:'1 440 : 0,9 = 1 600 Kč', why:'1 440 Kč je 90 % původní ceny → dělíš 0,9, ne přičítáš 10 % z výsledné ceny.'},
  {wrong:'(a + b)² = a² + b²', right:'a² + 2ab + b²', why:'Klasický chyták CERMATu — nezapomeň na prostřední člen 2ab.'},
  {wrong:'Obvod kruhu se počítá jako πr²', right:'obvod o = 2πr; πr² je obsah', why:'r je u obvodu jednou (čára), u obsahu na druhou (plocha).'},
 ],
 intro: '📜 Přijímačkový trénink v Archivu Akademie — úlohy ve stylu CERMAT. Kdo tu obstojí, obstojí i u přijímaček.',
 sections: [
  { h: 'Co CERMAT testuje',
    p: [
      'Každé téma ze ZŠ: celá čísla, zlomky, procenta, rovnice, mocniny, Pythagorova věta, obsahy a obvody, 3D tělesa, grafy, kombinatorika, pravděpodobnost.',
      'Úlohy jsou vždy z reálného života — nakupování, mapování, pohyb, tabulky, grafy.',
    ] },
  { h: 'Taktika řešení',
    p: [
      '<b>1. Čti zadání dvakrát</b> — co přesně je otázka? Na konci? Nebo v první větě?',
      '<b>2. U výběru ze 4:</b> dosaď odpovídající hodnoty zpět do zadání a ověř.',
      '<b>3. Lehčí úlohy nejdříve</b> — přeskoč těžké, vrať se k nim.',
      '<b>4. Odhadni výsledek</b> — pokud vychází číslo nesmyslné (záporný věk, tisíciprocentní sleva), hledej chybu.',
    ] },
  { h: 'Kontrolní seznam — časté chyby',
    p: [
      '✗ Záměna procent: výpočet % ze špatného základu (zpětná úloha)',
      '✗ (a + b)² ≠ a² + b² (zapomínaní 2ab)',
      '✗ Přepona ≠ největší odvěsna — přepona je vždy naproti pravému úhlu',
      '✗ Obvod kruhu se zaměňuje s obsahem (r vs. r²)',
      '✗ Závorky u záporných čísel — (−3)² ≠ −3²',
      '✗ Slovní úloha bez odpovědi s jednotkami',
    ] },
  { h: 'Správa času',
    p: [
      'Přijímačky mají zpravidla 16 úloh / 70 minut → průměrně přes 4 min na úlohu. Jednoduché zvládni za minutu, složitější si nech na konec.',
    ] },
 ],
 formulas: [
  '<b>Tip:</b> u výběru ze 4 ověř dosazením do zadání',
  '<b>Tip:</b> odhadni výsledek — je reálný?',
 ],
 examples: [
  { q: 'Koberec stojí 1 440 Kč po slevě 10 %. Původní cena?',
    s: ['1 440 Kč = 90 % původní ceny', 'základ = 1 440 / 0,9 = <b>1 600 Kč</b>'] },
  { q: 'Zeď je 2,4 m vysoká. Žebřík 3 m je opřen o zeď. Jak daleko stojí od zdi?',
    s: ['b = √(3² − 2,4²) = √(9 − 5,76) = √3,24 = <b>1,8 m</b>'] },
  { q: 'V obchodě je sleva 30 %. Kolik zaplatíš za zboží s původní cenou 250 Kč?',
    s: ['Platíš 70 % původní ceny: 250 · 0,70', '= <b>175 Kč</b>'] },
 ],
 video: { id: 'FwqLx8x_bjY', title: 'CERMAT 2024 — 2. řádný termín' }
},

'7-3': {
 mistakes: [
  {wrong:'6x − 12 = 2x + 14 → 6x + 2x = 14 + 12', right:'6x − 2x = 14 + 12 → 4x = 26', why:'Při přesunu 2x přes rovnítko se mění znaménko na −2x. Členy se stejným znaménkem se nesčítají dohromady.'},
  {wrong:'(x+4)² − (x−4)² = 0 (jsou skoro stejné)', right:'= 16x', why:'Rozepiš oba čtverce: (x²+8x+16) − (x²−8x+16) = 16x. Prostřední členy se odečtou na +16x.'},
  {wrong:'V = πr²v = 1,57 m³ = 1,57 litru', right:'1,57 m³ = 1570 litrů', why:'1 m³ = 1000 litrů. Objem v m³ převáděj na litry násobením tisícem.'},
 ],
 intro: '🔥 FINÁLNÍ DUEL S ARCIMÁGEM! Toto je vrchol celého roku. Dokaž, že ovládáš 8. ročník matematiky — a připrav se na 9. ročník!',
 sections: [
  { h: 'Zvládl jsi to!',
    p: [
      'Prošel jsi všemi sedmi oblastmi Citadely arcimága. Zvládl jsi celá a racionální čísla, procenta, Pythagorovu větu, odmocniny, lineární rovnice, algebraické vzorce i geometrické konstrukce.',
      'Teorie 9. ročníku na tebe čeká v <b>NULL_BYTE Akademii 💻</b> — mocniny s přirozeným exponentem, funkce, podobnost, goniometrie a statistika.',
    ] },
  { h: 'Kompletní přehled vzorců 8. ročníku',
    p: [
      '<table style="border-collapse:collapse;font-size:12px;color:#c9d1d9;width:100%;max-width:480px;margin:6px auto"><tr style="background:#1a2030"><th style="padding:4px 8px;color:#ffcc00;text-align:left">Téma</th><th style="padding:4px 8px;color:#ffcc00;text-align:left">Vzorec</th></tr><tr><td style="padding:3px 8px;border-top:1px solid #2a3545">Absolutní hodnota</td><td style="padding:3px 8px;border-top:1px solid #2a3545;color:#00ff88">|a| ≥ 0; |−a| = |a|</td></tr><tr style="background:#111820"><td style="padding:3px 8px">Mocnina / odmocnina</td><td style="padding:3px 8px;color:#00ff88">a² = a·a; √(a²) = |a|</td></tr><tr><td style="padding:3px 8px;border-top:1px solid #2a3545">Pythagorova věta</td><td style="padding:3px 8px;border-top:1px solid #2a3545;color:#00ff88">c² = a² + b²</td></tr><tr style="background:#111820"><td style="padding:3px 8px">Procenta — část</td><td style="padding:3px 8px;color:#00ff88">část = základ · p/100</td></tr><tr><td style="padding:3px 8px;border-top:1px solid #2a3545">Procenta — základ</td><td style="padding:3px 8px;border-top:1px solid #2a3545;color:#00ff88">základ = část · 100/p</td></tr><tr style="background:#111820"><td style="padding:3px 8px">Vzorec (a+b)²</td><td style="padding:3px 8px;color:#00ff88">a² + 2ab + b²</td></tr><tr><td style="padding:3px 8px;border-top:1px solid #2a3545">Vzorec (a−b)²</td><td style="padding:3px 8px;border-top:1px solid #2a3545;color:#00ff88">a² − 2ab + b²</td></tr><tr style="background:#111820"><td style="padding:3px 8px">Rozdíl čtverců</td><td style="padding:3px 8px;color:#00ff88">(a+b)(a−b) = a²−b²</td></tr><tr><td style="padding:3px 8px;border-top:1px solid #2a3545">Vytýkání</td><td style="padding:3px 8px;border-top:1px solid #2a3545;color:#00ff88">ab + ac = a(b+c)</td></tr><tr style="background:#111820"><td style="padding:3px 8px">Obvod kružnice</td><td style="padding:3px 8px;color:#00ff88">o = 2πr = πd</td></tr><tr><td style="padding:3px 8px;border-top:1px solid #2a3545">Obsah kruhu</td><td style="padding:3px 8px;border-top:1px solid #2a3545;color:#00ff88">S = πr²</td></tr><tr style="background:#111820"><td style="padding:3px 8px">Objem válce</td><td style="padding:3px 8px;color:#00ff88">V = πr²v</td></tr><tr><td style="padding:3px 8px;border-top:1px solid #2a3545">Povrch válce</td><td style="padding:3px 8px;border-top:1px solid #2a3545;color:#00ff88">S = 2πr² + 2πrv</td></tr><tr style="background:#111820"><td style="padding:3px 8px">Mezikruží</td><td style="padding:3px 8px;color:#00ff88">S = π(R²−r²)</td></tr></table>',
    ] },
 ],
 formulas: [
  '<b>c = √(a² + b²)</b> &nbsp;|&nbsp; <b>S = πr²</b> &nbsp;|&nbsp; <b>V = πr²v</b>',
  '<b>(a+b)² = a²+2ab+b²</b> &nbsp;|&nbsp; <b>(a+b)(a−b) = a²−b²</b>',
 ],
 examples: [
  { q: 'Finální: Vyřeš 3(2x − 4) = 2(x + 5) + 4',
    s: ['6x − 12 = 2x + 10 + 4', '6x − 2x = 14 + 12', '4x = 26 → <b>x = 6,5</b>'] },
  { q: 'Válcová nádrž r = 0,5 m, v = 2 m je z 60 % plná. Kolik litrů obsahuje? (π ≈ 3,14)',
    s: ['Plný objem: V = 3,14 · 0,25 · 2 = 1,57 m³', '60 % z 1,57 = 0,942 m³', '0,942 m³ = 942 dm³ = <b>942 litrů</b>'] },
  { q: 'Finální: Rozepiš a zjednoduš (x + 4)² − (x − 4)²',
    s: ['(x² + 8x + 16) − (x² − 8x + 16)', '= x² + 8x + 16 − x² + 8x − 16 = <b>16x</b>'] },
 ],
 video: { id: 'FO-xAjpo3b0', title: 'CERMAT 2025 — přijímací zkoušky' }
},

};
})();
