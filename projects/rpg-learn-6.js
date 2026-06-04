/* ══════════════════════════════════════════════════════════════════
   RPG Matematika 6 — Teorie ke všem 21 misím (Vesmírná expedice 🚀)
   6. ročník ZŠ, RVP ZV — pro 11leté žáky
   Zdroje: RVP ZV, učebnice Odvárko/Kadleček, Hejný (Fraus), MŠMT
   Videa: kanál @matematikajednoduse (Lucie Straková)
   ══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
window.RPG_LEARN_6 = {

/* ─── Oblast 1: ODLETOVÁ STANICE ──────────────────────────────── */

'1-1': {
 intro: '🛰️ Palubní robot blokuje vstup do lodi: „Prokáž znalost číselných oborů a pořadí operací — nebo tě nepustím na palubu." Zopakuj si základy vesmírné matematiky!',
 sections: [
  { h: 'Co jsou přirozená čísla a číselné obory',
    p: ['Přirozená čísla <b>N</b> jsou čísla, kterými počítáme předměty: 1, 2, 3, 4, … (v ČR zahrnujeme i 0, pak píšeme <b>N₀</b>).',
        '<b>Celá čísla Z</b> přidávají záporná čísla: …, −3, −2, −1, 0, 1, 2, 3, … <b>Racionální čísla Q</b> jsou všechna čísla, která lze zapsat jako zlomek (včetně desetinných).<br>Číselné obory se vnořují: <b>N ⊂ Z ⊂ Q</b> — každé přirozené číslo je i celé a racionální.',
        '<svg width="280" height="90" style="display:block;margin:8px auto 0" viewBox="0 0 280 90"><rect x="5" y="5" width="270" height="80" rx="12" fill="none" stroke="#4a9eff" stroke-width="2"/><text x="14" y="22" font-size="13" fill="#4a9eff" font-family="monospace">Q — racionální čísla</text><rect x="30" y="30" width="200" height="48" rx="10" fill="none" stroke="#00ff88" stroke-width="2"/><text x="38" y="46" font-size="12" fill="#00ff88" font-family="monospace">Z — celá čísla</text><rect x="60" y="52" width="110" height="22" rx="8" fill="none" stroke="#ffcc00" stroke-width="2"/><text x="70" y="67" font-size="11" fill="#ffcc00" font-family="monospace">N — přirozená</text></svg>'] },
  { h: 'Místní hodnota a zápis',
    p: ['V desítkové soustavě má každá číslice svou místní hodnotu: v čísle 4 273 je 4 tisíce, 2 stovky, 7 desítek, 3 jednotky.',
        'Velká čísla zapisujeme po trojicích s mezerou: <b>1 250 000</b> = jeden milion dvě stě padesát tisíc.'] },
  { h: 'Pořadí operací',
    p: ['Nejdřív závorky <b>( )</b>, pak násobení a dělení <b>× ÷</b>, nakonec sčítání a odčítání <b>+ −</b>. Na stejné úrovni počítáme zleva doprava.',
        '<span style="color:#ff5555">⚠️ Pozor:</span> <b>3 + 4 × 5 = 23</b>, NE 35! (4 × 5 se počítá dřív.) Se závorkou: (3 + 4) × 5 = 35.',
        '<svg width="240" height="48" style="display:block;margin:8px auto 0" viewBox="0 0 240 48"><rect x="2" y="8" width="236" height="32" rx="6" fill="#161b22" stroke="#4a9eff" stroke-width="1.5"/><text x="12" y="29" font-size="14" fill="#ffcc00" font-family="monospace" font-weight="bold">( )  →  × ÷  →  + −</text></svg>'] },
  { h: 'Zaokrouhlování',
    p: ['Díváme se na číslici <i>za</i> řádem, na který zaokrouhlujeme: <b>0–4 dolů</b>, <b>5–9 nahoru</b>.',
        'Příklady: 2 847 na stovky = <b>2 800</b>; na tisíce = <b>3 000</b>.<br>3,742 na desetiny = <b>3,7</b>; na setiny = <b>3,74</b>.',
        '<svg width="260" height="54" style="display:block;margin:8px auto 0" viewBox="0 0 260 54"><line x1="10" y1="36" x2="250" y2="36" stroke="#4a9eff" stroke-width="2"/><line x1="10" y1="30" x2="10" y2="42" stroke="#4a9eff" stroke-width="2"/><line x1="250" y1="30" x2="250" y2="42" stroke="#4a9eff" stroke-width="2"/><text x="7" y="52" font-size="11" fill="#c9d1d9" font-family="monospace">0</text><text x="58" y="52" font-size="11" fill="#c9d1d9" font-family="monospace">2</text><text x="108" y="52" font-size="11" fill="#c9d1d9" font-family="monospace">4</text><text x="157" y="52" font-size="11" fill="#c9d1d9" font-family="monospace">6</text><text x="207" y="52" font-size="11" fill="#c9d1d9" font-family="monospace">8</text><text x="243" y="52" font-size="11" fill="#c9d1d9" font-family="monospace">10</text><line x1="58" y1="30" x2="58" y2="42" stroke="#c9d1d9" stroke-width="1"/><line x1="108" y1="30" x2="108" y2="42" stroke="#c9d1d9" stroke-width="1"/><line x1="157" y1="30" x2="157" y2="42" stroke="#c9d1d9" stroke-width="1"/><line x1="207" y1="30" x2="207" y2="42" stroke="#c9d1d9" stroke-width="1"/><circle cx="135" cy="36" r="5" fill="#ffcc00"/><text x="130" y="22" font-size="10" fill="#ffcc00" font-family="monospace">5,2</text></svg>'] },
 ],
 formulas: [
  '<b>Pořadí:</b> ( ) → × ÷ → + −',
  '<b>Zaokrouhlení:</b> 0–4 dolů, 5–9 nahoru',
  '<b>N ⊂ Z ⊂ Q</b> (každé přirozené je i celé a racionální)',
 ],
 examples: [
  { q: 'Spočítej: 5 + 2 × (8 − 3)', s: ['Závorka: 8 − 3 = 5', 'Násobení: 2 × 5 = 10', 'Součet: 5 + 10 = <b>15</b>'] },
  { q: 'Zaokrouhli 6 481 na stovky', s: ['Číslice na desítkách je 8 → nahoru', 'Výsledek: <b>6 500</b>'] },
  { q: 'Je číslo −3 přirozené? Celé? Racionální?', s: ['Přirozené: <b>NE</b> (N obsahuje jen kladná čísla + 0)', 'Celé: <b>ANO</b> (Z obsahuje záporná čísla)', 'Racionální: <b>ANO</b> (Q obsahuje vše z Z)'] },
 ],
 video: { id: '8-H_UX9zCzM', title: 'Zaokrouhlování desetinných čísel' }
},

'1-2': {
 intro: '📏 Měřicí dron skenuje stěny stanice. „Spočítej mi obvody a obsahy, nebo neotevřu hangárové dveře!" Ukáž, co umíš.',
 sections: [
  { h: 'Obvod obdélníku a čtverce',
    p: ['Obvod je délka celé hranice obrazce — jakoby délka „plotu" dokola.',
        'Obdélník má <b>dvě strany a</b> (délka) a <b>dvě strany b</b> (šířka). Čtverec má všechny čtyři strany stejné (<b>a</b>).',
        '<svg width="260" height="100" style="display:block;margin:8px auto 0" viewBox="0 0 260 100"><rect x="30" y="20" width="140" height="60" fill="none" stroke="#4a9eff" stroke-width="2.5" rx="2"/><text x="88" y="15" font-size="13" fill="#ffcc00" font-family="monospace" text-anchor="middle">a</text><text x="88" y="92" font-size="13" fill="#ffcc00" font-family="monospace" text-anchor="middle">a</text><text x="18" y="54" font-size="13" fill="#ffcc00" font-family="monospace" text-anchor="middle">b</text><text x="182" y="54" font-size="13" fill="#ffcc00" font-family="monospace" text-anchor="middle">b</text><text x="88" y="56" font-size="11" fill="#c9d1d9" font-family="monospace" text-anchor="middle">obdélník</text></svg>'] },
  { h: 'Obsah obdélníku a čtverce',
    p: ['Obsah říká, kolik čtvercových jednotek se vejde dovnitř. Měří se v <b>cm², dm², m²</b>…',
        'U obdélníku: délka × šířka. U čtverce: strana × strana = strana².'] },
  { h: 'Jednotky obsahu — převody',
    p: ['Mezi sousedními plošnými jednotkami je vždy <b>100×</b> (ne 10×!).',
        '<table style="border-collapse:collapse;font-size:12px;color:#c9d1d9;margin:4px 0"><tr><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">mm²</th><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">cm²</th><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">dm²</th><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">m²</th></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px;text-align:center">1</td><td style="border:1px solid #4a9eff;padding:3px 8px;text-align:center">÷ 100</td><td style="border:1px solid #4a9eff;padding:3px 8px;text-align:center">÷ 10 000</td><td style="border:1px solid #4a9eff;padding:3px 8px;text-align:center">÷ 1 000 000</td></tr></table>',
        '<span style="color:#ff5555">⚠️ Nejčastější chyba:</span> záměna <b>obvodu</b> (délka, cm) a <b>obsahu</b> (plocha, cm²) — jsou to úplně různé věci s různými jednotkami!'] },
 ],
 formulas: [
  '<b>Obvod obdélníku:</b> o = 2 · (a + b)',
  '<b>Obsah obdélníku:</b> S = a · b',
  '<b>Obvod čtverce:</b> o = 4 · a',
  '<b>Obsah čtverce:</b> S = a²',
  '<b>Jednotky obsahu:</b> ×100 mezi sousedními (mm² → cm² → dm² → m²)',
 ],
 examples: [
  { q: 'Obdélník a = 8 cm, b = 5 cm. Obvod a obsah?', s: ['o = 2 · (8 + 5) = 2 · 13 = <b>26 cm</b>', 'S = 8 · 5 = <b>40 cm²</b>'] },
  { q: 'Čtverec se stranou 6 cm. Obvod a obsah?', s: ['o = 4 · 6 = <b>24 cm</b>', 'S = 6² = <b>36 cm²</b>'] },
  { q: 'Převeď 3,5 dm² na cm²', s: ['1 dm² = 100 cm²', '3,5 · 100 = <b>350 cm²</b>'] },
 ],
 video: null,
},

'1-3': {
 intro: '🧭 Navigační AI vydává staniční hádanky. „Logické uvažování je základ každé expedice," říká. Ukaž, jak řešíš slovní úlohy.',
 sections: [
  { h: '5 kroků k řešení slovní úlohy',
    p: ['<b>1. Přečti</b> zadání pomalu — co se ptají? <b>2. Vypiš</b> všechna čísla a jejich jednotky. <b>3. Najdi vztah</b> — jak údaje spolu souvisí? <b>4. Spočítej.</b> <b>5. Napiš odpověď</b> celou větou s jednotkou.',
        'Vždy si zkontroluj, zda výsledek dává smysl (řád, znaménko, jednotka).'] },
  { h: 'Tip: nakresli si diagram',
    p: ['Složité úlohy o drahách, skupinách nebo sdílení je mnohem snazší vyřešit s obrázkem nebo tabulkou.',
        'U úloh „na jeden kus": když 5 sešitů stojí 75 Kč, jeden stojí 75 ÷ 5 = 15 Kč.'] },
  { h: 'Úsudek a převody jednotek',
    p: ['Hlídej jednotky: minuty vs. hodiny, Kč vs. haléře, kg vs. g. Vždy převeď na stejnou jednotku před výpočtem.',
        'U logických hádanek vyzkoušej možnosti a vyřaď ty, co odporují zadání.'] },
 ],
 formulas: [
  '<b>Cena za 1 kus:</b> celková cena ÷ počet kusů',
  '<b>Kontrola:</b> dosaď výsledek zpět do zadání',
  '<b>5 kroků:</b> přečti → vypiš → vztah → spočítej → odpověz',
 ],
 examples: [
  { q: 'Za 6 rohlíků zaplatíš 24 Kč. Kolik stojí 10 rohlíků?', s: ['1 rohlík: 24 ÷ 6 = 4 Kč', '10 rohlíků: 10 · 4 = <b>40 Kč</b>'] },
  { q: 'Vlak jede 2 hodiny průměrnou rychlostí 85 km/h. Jakou vzdálenost ujede?', s: ['Vztah: s = v · t', 's = 85 · 2 = <b>170 km</b>'] },
 ],
 video: null,
},

/* ─── Oblast 2: PLANETA DESETIN ───────────────────────────────── */

'2-1': {
 intro: '🛸 Oblačný strážce váží náklad na desetiny gramu. „Bez znalosti desetinných čísel tě nepustím na planetu!" Ovládni jejich místní hodnotu.',
 sections: [
  { h: 'Co je desetinné číslo?',
    p: ['Desetinné číslo zapisujeme s <b>desetinnou čárkou</b> (v Česku čárkou, ne tečkou!). 3,7 = 3 celé a 7 desetin.',
        'Zlomkový zápis: 3,7 = 3 + 7/10; 2,845 = 2 + 8/10 + 4/100 + 5/1000.'] },
  { h: 'Tabulka místních hodnot',
    p: ['<table style="border-collapse:collapse;font-size:12px;color:#c9d1d9;margin:4px 0"><tr><th style="border:1px solid #4a9eff;padding:3px 7px;color:#ffcc00">Jednotky</th><th style="border:1px solid #4a9eff;padding:3px 7px;color:#ffcc00">Desetiny</th><th style="border:1px solid #4a9eff;padding:3px 7px;color:#ffcc00">Setiny</th><th style="border:1px solid #4a9eff;padding:3px 7px;color:#ffcc00">Tisíciny</th></tr><tr><td style="border:1px solid #4a9eff;padding:3px 7px;text-align:center">2</td><td style="border:1px solid #4a9eff;padding:3px 7px;text-align:center">8</td><td style="border:1px solid #4a9eff;padding:3px 7px;text-align:center">4</td><td style="border:1px solid #4a9eff;padding:3px 7px;text-align:center">5</td></tr></table>',
        'Číslo 2,845 přečteme: „dvě celé osm set čtyřicet pět tisícin".'] },
  { h: 'Porovnávání desetinných čísel',
    p: ['Nejdřív porovnej celou část. Při shodné celé části porovnávej desetiny, pak setiny…',
        'Pomáhá doplnit nuly na stejný počet míst: 3,5 vs 3,45 → 3,50 vs 3,45 → <b>3,50 je větší</b>.'] },
  { h: 'Desetinná čísla na číselné ose',
    p: ['Mezi dvěma sousedními přirozenými čísly leží nekonečně mnoho desetinných čísel.',
        '<svg width="260" height="52" style="display:block;margin:8px auto 0" viewBox="0 0 260 52"><line x1="10" y1="30" x2="250" y2="30" stroke="#4a9eff" stroke-width="2"/><line x1="10" y1="22" x2="10" y2="38" stroke="#4a9eff" stroke-width="2"/><line x1="250" y1="22" x2="250" y2="38" stroke="#4a9eff" stroke-width="2"/><line x1="130" y1="22" x2="130" y2="38" stroke="#4a9eff" stroke-width="2"/><text x="6" y="48" font-size="12" fill="#c9d1d9" font-family="monospace">3</text><text x="246" y="48" font-size="12" fill="#c9d1d9" font-family="monospace">4</text><line x1="172" y1="24" x2="172" y2="36" stroke="#ffcc00" stroke-width="2"/><circle cx="172" cy="30" r="5" fill="#ffcc00"/><text x="162" y="16" font-size="12" fill="#ffcc00" font-family="monospace">3,7</text><text x="115" y="48" font-size="11" fill="#c9d1d9" font-family="monospace">3,5</text></svg>'] },
 ],
 formulas: [
  '<b>Řády za čárkou:</b> desetiny (÷10), setiny (÷100), tisíciny (÷1000)',
  '<b>Porovnání:</b> doplň nuly na stejný počet míst',
 ],
 examples: [
  { q: 'Co je větší: 0,7 nebo 0,68?', s: ['0,70 vs 0,68', '70 setin > 68 setin → <b>0,7 je větší</b>'] },
  { q: 'Zaokrouhli 5,063 na setiny', s: ['Číslice na tisícinách je 3 → dolů', 'Výsledek: <b>5,06</b>'] },
  { q: 'Které číslo leží mezi 1,2 a 1,3?', s: ['Např. <b>1,25</b> (nebo 1,21, 1,28 — možností je nekonečně mnoho)'] },
 ],
 video: { id: 'EtOriZ2cNeQ', title: 'Desítková soustava' }
},

'2-2': {
 intro: '🌟 Jiskřící mlhovina tě prověří ze všech operací s desetinnými čísly. Sčítej, odčítej, násob i děl — hvězdná loď to potřebuje!',
 sections: [
  { h: 'Sčítání a odčítání',
    p: ['Zarovnej desetinné <b>čárky pod sebe</b> a doplň nuly tak, aby obě čísla měla stejný počet desetinných míst.',
        '3,7 + 2,45 → 3,<b>70</b> + 2,45 = <b>6,15</b><br>8,3 − 2,76 → 8,<b>30</b> − 2,76 = <b>5,54</b>'] },
  { h: 'Násobení desetinných čísel',
    p: ['Počítej nejdřív <b>bez čárek</b>. Potom umísti čárku: počet desetinných míst výsledku = <b>součet</b> desetinných míst obou čísel.',
        '2,3 × 1,4 → 23 × 14 = 322 → 2 des. místa → <b>3,22</b><br>0,5 × 0,4 → 5 × 4 = 20 → 2 des. místa → <b>0,20 = 0,2</b>'] },
  { h: 'Násobení a dělení mocninami 10',
    p: ['× 10 → čárka o 1 doprava (3,7 → 37). ÷ 10 → čárka o 1 doleva (3,7 → 0,37).',
        'Každá nula navíc = jeden posun: × 100 = 2 posuny, ÷ 1000 = 3 posuny doleva.'] },
  { h: 'Dělení desetinným číslem',
    p: ['Dělíš-li desetinným číslem: <b>posuň čárku u dělitele i dělence</b> stejně, dokud dělíš celým číslem.',
        '4,5 ÷ 0,3 → × 10 obě → 45 ÷ 3 = <b>15</b><br>0,6 ÷ 0,02 → × 100 obě → 60 ÷ 2 = <b>30</b>',
        '<span style="color:#ff5555">⚠️ Dělení desetinným číslem:</span> výsledek může být <b>větší</b> než dělenec! Příklad: 6 ÷ 0,2 = 30. Ptáme se: „Kolikrát se 0,2 vejde do 6?" — odpověď je 30×. Výsledek JE větší než 6!'] },
 ],
 formulas: [
  '<b>× 10:</b> čárka o 1 doprava · <b>÷ 10:</b> čárka o 1 doleva',
  '<b>Násobení:</b> des. místa výsledku = součet des. míst činitelů',
  '<b>Dělení des. číslem:</b> rozšiř dělitele i dělence ×10ⁿ',
 ],
 examples: [
  { q: 'Spočítej: 5,08 + 3,7', s: ['5,08 + 3,70 = <b>8,78</b>'] },
  { q: 'Spočítej: 2,4 × 3,5', s: ['24 × 35 = 840 → 2 des. místa → <b>8,40</b>'] },
  { q: 'Spočítej: 9,6 ÷ 0,4', s: ['×10 obě: 96 ÷ 4 = <b>24</b>'] },
  { q: 'Spočítej: 6 ÷ 0,2', s: ['×10 obě: 60 ÷ 2 = <b>30</b> (výsledek větší než 6 — to je správně!)'] },
 ],
 video: { id: 'w9C9H7EOiGM', title: 'Sčítání a odčítání desetinných čísel' },
},

'2-3': {
 intro: '💫 Prstencový duch dělí prstence na stejné díly. „Zlomky a průměry jsou jazyk vesmíru," říká. Nauč se je!',
 sections: [
  { h: 'Co je zlomek — čitatel a jmenovatel',
    p: ['Zlomek <b>a/b</b> vyjadřuje část celku: <b>jmenovatel b</b> říká, na kolik dílů je celek rozdělen; <b>čitatel a</b> říká, kolik dílů máme.',
        '3/4 = „tři čtvrtiny" — celek rozdělen na 4 díly, bereme 3.',
        '<svg width="220" height="48" style="display:block;margin:8px auto 0" viewBox="0 0 220 48"><rect x="10" y="8" width="46" height="30" fill="#4a9eff" stroke="#4a9eff" stroke-width="1.5"/><rect x="57" y="8" width="46" height="30" fill="#4a9eff" stroke="#4a9eff" stroke-width="1.5"/><rect x="104" y="8" width="46" height="30" fill="#4a9eff" stroke="#4a9eff" stroke-width="1.5"/><rect x="151" y="8" width="46" height="30" fill="#161b22" stroke="#4a9eff" stroke-width="1.5"/><text x="28" y="46" font-size="10" fill="#ffcc00" font-family="monospace" text-anchor="middle">1</text><text x="75" y="46" font-size="10" fill="#ffcc00" font-family="monospace" text-anchor="middle">2</text><text x="122" y="46" font-size="10" fill="#ffcc00" font-family="monospace" text-anchor="middle">3</text><text x="169" y="46" font-size="10" fill="#c9d1d9" font-family="monospace" text-anchor="middle">4</text><text x="112" y="5" font-size="11" fill="#ffcc00" font-family="monospace" text-anchor="middle">3/4 obarveno</text></svg>',
        'Na číselné ose leží 3/4 mezi 0 a 1, blíže k 1.'] },
  { h: 'Zkracování a rozšiřování zlomků',
    p: ['<b>Zkracování:</b> vydělíme čitatele i jmenovatele jejich NSD. Výsledný zlomek je „nejmenší" (základní) tvar.',
        '12/18 → NSD(12,18) = 6 → 12÷6 / 18÷6 = <b>2/3</b>',
        '<b>Rozšiřování:</b> vynásobíme čitatele i jmenovatele stejným číslem (zachovává hodnotu).<br>2/3 × (4/4) = 8/12'] },
  { h: 'Aritmetický průměr',
    p: ['Průměr = <b>součet všech hodnot ÷ jejich počet</b>. Říká nám „typickou" hodnotu souboru.',
        'Příklad: výsledky testů 70, 85, 90, 75 bodů → průměr = (70+85+90+75) ÷ 4 = 320 ÷ 4 = <b>80 bodů</b>.',
        '<span style="color:#ff5555">⚠️ Pozor:</span> průměr ≠ nejčastější hodnota (modus) ≠ střední hodnota (medián)!'] },
 ],
 formulas: [
  '<b>Zkracování:</b> a/b = (a÷NSD) / (b÷NSD)',
  '<b>Rozšiřování:</b> a/b = (a·k) / (b·k)',
  '<b>Průměr:</b> (součet hodnot) ÷ (počet hodnot)',
 ],
 examples: [
  { q: 'Zkrať zlomek 15/25', s: ['NSD(15,25) = 5', '15÷5 / 25÷5 = <b>3/5</b>'] },
  { q: 'Průměr čísel 4, 6, 6, 8', s: ['Součet: 4+6+6+8 = 24', 'Počet: 4', '24 ÷ 4 = <b>6</b>'] },
  { q: 'Rozšiř 2/5 tak, aby jmenovatel byl 20', s: ['5 × 4 = 20, takže k = 4', '2·4 / 5·4 = <b>8/20</b>'] },
 ],
 video: { id: '4_MuthDfVJQ', title: 'Aritmetický průměr' }
},

/* ─── Oblast 3: POLE DĚLITELNOSTI ─────────────────────────────── */

'3-1': {
 intro: '🪨 Kamenný kolos blokuje cestu. „Dokážeš rozpoznat dělitelnost bez počítání?" burácí. Rozděl ho znalostí znaků dělitelnosti!',
 sections: [
  { h: 'Co je dělitelnost',
    p: ['Číslo <i>a</i> je <b>dělitelné</b> číslem <i>b</i>, když po dělení nezbyde zbytek. Pak je <i>a</i> násobek <i>b</i>.',
        'Znaky dělitelnosti ti umožní poznat dělitelnost okamžitě, bez počítání.'] },
  { h: 'Přehledová tabulka znaků dělitelnosti',
    p: ['<table style="border-collapse:collapse;font-size:12px;color:#c9d1d9;margin:4px 0;width:100%"><tr><th style="border:1px solid #4a9eff;padding:3px 6px;color:#ffcc00;text-align:left">Dělitel</th><th style="border:1px solid #4a9eff;padding:3px 6px;color:#ffcc00;text-align:left">Znak dělitelnosti</th><th style="border:1px solid #4a9eff;padding:3px 6px;color:#ffcc00;text-align:left">Příklad</th></tr><tr><td style="border:1px solid #4a9eff;padding:3px 6px"><b>2</b></td><td style="border:1px solid #4a9eff;padding:3px 6px">poslední číslice je sudá (0,2,4,6,8)</td><td style="border:1px solid #4a9eff;padding:3px 6px">138 ✓, 137 ✗</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 6px"><b>3</b></td><td style="border:1px solid #4a9eff;padding:3px 6px">ciferný součet dělitelný 3</td><td style="border:1px solid #4a9eff;padding:3px 6px">123: 1+2+3=6 ✓</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 6px"><b>4</b></td><td style="border:1px solid #4a9eff;padding:3px 6px">poslední dvojčíslí dělitelné 4</td><td style="border:1px solid #4a9eff;padding:3px 6px">524: 24÷4=6 ✓</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 6px"><b>5</b></td><td style="border:1px solid #4a9eff;padding:3px 6px">poslední číslice 0 nebo 5</td><td style="border:1px solid #4a9eff;padding:3px 6px">135 ✓, 137 ✗</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 6px"><b>6</b></td><td style="border:1px solid #4a9eff;padding:3px 6px">dělitelné 2 <i>a zároveň</i> 3</td><td style="border:1px solid #4a9eff;padding:3px 6px">138: sudé ✓, 1+3+8=12 ✓</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 6px"><b>8</b></td><td style="border:1px solid #4a9eff;padding:3px 6px">poslední trojčíslí dělitelné 8</td><td style="border:1px solid #4a9eff;padding:3px 6px">1 016: 016÷8=2 ✓</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 6px"><b>9</b></td><td style="border:1px solid #4a9eff;padding:3px 6px">ciferný součet dělitelný 9</td><td style="border:1px solid #4a9eff;padding:3px 6px">729: 7+2+9=18 ✓</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 6px"><b>10</b></td><td style="border:1px solid #4a9eff;padding:3px 6px">poslední číslice 0</td><td style="border:1px solid #4a9eff;padding:3px 6px">450 ✓, 451 ✗</td></tr></table>',
        '<span style="color:#ff5555">⚠️ Dělitelnost 6</span> = dělitelnost <b>2 A 3 zároveň</b>. Nestačí jen jedno z nich!'] },
 ],
 formulas: [
  '<b>2:</b> sudá poslední číslice · <b>5:</b> 0 nebo 5 · <b>10:</b> 0',
  '<b>3, 9:</b> ciferný součet ÷ 3 resp. ÷ 9',
  '<b>4:</b> poslední dvojčíslí ÷ 4 · <b>6:</b> dělitelné 2 i 3',
 ],
 examples: [
  { q: 'Je 738 dělitelné 3?', s: ['Ciferný součet: 7+3+8 = 18', '18 je dělitelné 3 → <b>ANO</b>'] },
  { q: 'Je 524 dělitelné 4?', s: ['Poslední dvojčíslí: 24', '24 ÷ 4 = 6 → <b>ANO</b>'] },
  { q: 'Je 324 dělitelné 6?', s: ['Dělitelné 2? 324 → sudá číslice 4 → ANO', 'Dělitelné 3? 3+2+4=9, 9÷3=3 → ANO', 'Dělitelné 2 i 3 → <b>ANO, dělitelné 6</b>'] },
 ],
 video: { id: 'xSaL1AtoUAk', title: 'Pravidla dělitelnosti' },
},

'3-2': {
 intro: '⚙️ Ozubený automat se zasekl. „Rozlož mě na prvočísla a opravíš mě!" volá. Prvočísla jsou stavební kameny všech čísel.',
 sections: [
  { h: 'Prvočísla a čísla složená',
    p: ['<b>Prvočíslo</b> má právě <b>dva dělitele</b>: 1 a samo sebe. <b>Číslo 1 není prvočíslo</b> (má jen jeden dělitel).',
        'Prvních 15 prvočísel: <b>2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47</b>.',
        '<b>Složené číslo</b> má víc než dva dělitele (např. 12 má dělitele 1, 2, 3, 4, 6, 12). Číslo 2 je jediné <i>sudé</i> prvočíslo.'] },
  { h: 'Eratosthenovo síto',
    p: ['Starořecký způsob nalezení prvočísel: vypiš čísla 2–100, vyškrtni násobky 2 (kromě 2), pak násobky 3, pak 5, pak 7… Co zbyde, jsou prvočísla.',
        'Stačí vyškrtat násobky prvočísel až do √100 = 10.'] },
  { h: 'Rozklad na prvočinitele (strom faktorů)',
    p: ['Každé složené číslo lze jednoznačně zapsat jako součin prvočísel.',
        'Postup: dělíme nejmenším možným prvočíslem, dokud nevyjde 1.<br><br>Příklad — rozklad 60:<br><span style="font-family:monospace;color:#00ff88">60<br>├─ 2 × 30<br>│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ 2 × 15<br>│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ 3 × 5<br>│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ prvočísla!</span><br>60 = 2 · 2 · 3 · 5 = <b>2² · 3 · 5</b>'] },
 ],
 formulas: [
  '<b>Prvočíslo:</b> právě 2 dělitelé (1 a ono samo)',
  '<b>Rozklad:</b> každé číslo = součin prvočísel (jednoznačný)',
 ],
 examples: [
  { q: 'Rozlož 84 na prvočinitele', s: ['84 ÷ 2 = 42', '42 ÷ 2 = 21', '21 ÷ 3 = 7 (prvočíslo)', '84 = <b>2² · 3 · 7</b>'] },
  { q: 'Je 97 prvočíslo?', s: ['Zkoušíme dělitele 2, 3, 5, 7 (až do √97 ≈ 9,8)', '97 není dělitelné žádným z nich → <b>ANO, 97 je prvočíslo</b>'] },
 ],
 video: { id: 'O280lRBZxI8', title: 'Rozklad čísla na součin prvočísel' },
},

'3-3': {
 intro: '🛰️ Orbitální sonda synchronizuje dva tryskové motory. „Najdi jejich společný dělitel a násobek — jinak se srazíme!" Zachraň sondu!',
 sections: [
  { h: 'Největší společný dělitel (NSD)',
    p: ['NSD dvou čísel je <b>největší číslo</b>, kterým jsou dělitelná obě najednou.',
        '<b>Postup:</b> oba rozlož na prvočinitele → vezmi <b>společné</b> prvočinitele v <b>nejnižší</b> mocnině.',
        'Využití: zkracování zlomků, dělení na co největší stejné části.'] },
  { h: 'Nejmenší společný násobek (NSN)',
    p: ['NSN dvou čísel je <b>nejmenší číslo</b>, které je násobkem obou najednou.',
        '<b>Postup:</b> oba rozlož → vezmi <b>všechna</b> prvočísla v <b>nejvyšší</b> mocnině.',
        'Využití: hledání společného jmenovatele u zlomků, „kdy se autobusy opět setkají" — synchronizace.'] },
  { h: 'Vztah NSD a NSN',
    p: ['Platí: <b>NSD(a,b) · NSN(a,b) = a · b</b> — užitečné pro ověření výsledku.'] },
 ],
 formulas: [
  '<b>NSD:</b> společné prvočinitele v nejnižší mocnině',
  '<b>NSN:</b> všechny prvočinitele v nejvyšší mocnině',
  '<b>Vztah:</b> NSD(a,b) · NSN(a,b) = a · b',
 ],
 examples: [
  { q: 'NSD(12, 18)', s: ['12 = 2² · 3 ; 18 = 2 · 3²', 'Společné: 2¹ · 3¹ = <b>6</b>'] },
  { q: 'NSN(12, 18)', s: ['Všechna prvočísla v nejvyšší mocnině: 2² · 3²', '= 4 · 9 = <b>36</b>'] },
  { q: 'Ověř: NSD · NSN = ?', s: ['6 · 36 = 216', '12 · 18 = 216 ✓'] },
 ],
 video: { id: '2KXST0O9DjI', title: 'Největší společný dělitel' },
},

/* ─── Oblast 4: MLHOVINA ÚHLŮ ─────────────────────────────────── */

'4-1': {
 intro: '🌌 Mlhovinný strážce měří úhly mezi hvězdami. „Pojmenuj každý druh úhlu přesně — nebo mlhovinou neprojdeš!" Ukaž, co víš.',
 sections: [
  { h: 'Co je úhel',
    p: ['Úhel je část roviny ohraničená dvěma <b>polopřímkami</b> se společným počátkem (<b>vrcholem</b>). Velikost měříme ve <b>stupních (°)</b>.',
        'Úhel značíme malým řeckým písmenem (α, β, γ) nebo třemi body s vrcholem uprostřed: ∠ABC.'] },
  { h: 'Druhy úhlů',
    p: ['<table style="border-collapse:collapse;font-size:12px;color:#c9d1d9;margin:4px 0"><tr><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">Název</th><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">Velikost</th></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px">Nulový úhel</td><td style="border:1px solid #4a9eff;padding:3px 8px">0°</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px">Ostrý úhel</td><td style="border:1px solid #4a9eff;padding:3px 8px">0° – 90°</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px">Pravý úhel</td><td style="border:1px solid #4a9eff;padding:3px 8px">přesně 90°</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px">Tupý úhel</td><td style="border:1px solid #4a9eff;padding:3px 8px">90° – 180°</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px">Přímý úhel</td><td style="border:1px solid #4a9eff;padding:3px 8px">přesně 180°</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px">Plný úhel</td><td style="border:1px solid #4a9eff;padding:3px 8px">360°</td></tr></table>',
        '<svg width="280" height="72" style="display:block;margin:8px auto 0" viewBox="0 0 280 72"><g transform="translate(10,60)"><line x1="0" y1="0" x2="30" y2="0" stroke="#4a9eff" stroke-width="2"/><line x1="0" y1="0" x2="26" y2="-14" stroke="#4a9eff" stroke-width="2"/><path d="M 12,0 A 12,12 0 0,0 10.4,-5.6" fill="none" stroke="#ffcc00" stroke-width="1.5"/><text x="4" y="-17" font-size="9" fill="#c9d1d9" font-family="monospace">ostrý</text></g><g transform="translate(70,60)"><line x1="0" y1="0" x2="30" y2="0" stroke="#4a9eff" stroke-width="2"/><line x1="0" y1="0" x2="0" y2="-30" stroke="#4a9eff" stroke-width="2"/><rect x="0" y="-8" width="8" height="8" fill="none" stroke="#ffcc00" stroke-width="1.5"/><text x="2" y="-33" font-size="9" fill="#c9d1d9" font-family="monospace">pravý</text></g><g transform="translate(130,60)"><line x1="0" y1="0" x2="30" y2="0" stroke="#4a9eff" stroke-width="2"/><line x1="0" y1="0" x2="-20" y2="-22" stroke="#4a9eff" stroke-width="2"/><path d="M 12,0 A 12,12 0 0,0 -8.5,-9.3" fill="none" stroke="#ffcc00" stroke-width="1.5"/><text x="-10" y="-25" font-size="9" fill="#c9d1d9" font-family="monospace">tupý</text></g><g transform="translate(195,60)"><line x1="0" y1="0" x2="30" y2="0" stroke="#4a9eff" stroke-width="2"/><line x1="0" y1="0" x2="-30" y2="0" stroke="#4a9eff" stroke-width="2"/><path d="M 12,0 A 12,12 0 0,0 -12,0" fill="none" stroke="#ffcc00" stroke-width="1.5"/><text x="-12" y="-8" font-size="9" fill="#c9d1d9" font-family="monospace">přímý</text></g></svg>'] },
  { h: 'Měření úhloměrem',
    p: ['Střed úhloměru polož na <b>vrchol</b> úhlu. Nulovou linku zarovnej s jedním ramenem. Odečti, kde protíná úhloměr druhé rameno.',
        'Pozor: úhloměr má dvě stupnice (jedna jde 0→180, druhá 180→0). Správnou stranu volíš podle toho, ze které strany začínáš.'] },
 ],
 formulas: [
  '<b>Ostrý:</b> 0° < α < 90°',
  '<b>Pravý:</b> α = 90° · <b>Tupý:</b> 90° < α < 180°',
  '<b>Přímý:</b> α = 180° · <b>Plný:</b> α = 360°',
 ],
 examples: [
  { q: 'Jaký druh úhlu je 125°?', s: ['125° je mezi 90° a 180° → <b>tupý</b>'] },
  { q: 'Jaký druh úhlu je 90°?', s: ['Přesně 90° → <b>pravý</b>'] },
  { q: 'Jaký druh úhlu je 7°?', s: ['7° je mezi 0° a 90° → <b>ostrý</b>'] },
 ],
 video: { id: 'x-oIA8Xc-e0', title: 'Měření úhlů a různoběžky' }
},

'4-2': {
 intro: '✨ Dvojhvězda vrhá překřížené paprsky. „Popiš mi všechny čtyři úhly, nebo tě paprsky pohltí!" Pochop vedlejší a vrcholové úhly.',
 sections: [
  { h: 'Vedlejší úhly',
    p: ['Vedlejší úhly mají <b>jedno rameno společné</b> a druhá ramena tvoří přímku. Jejich součet je vždy <b>180°</b>.',
        'Když znáš jeden, druhý dopočítáš: β = 180° − α.<br>Příklad: α = 53° → β = 180° − 53° = <b>127°</b>.'] },
  { h: 'Vrcholové úhly',
    p: ['Vrcholové úhly vzniknou protnutím dvou přímek a leží „<b>proti sobě</b>". Jsou vždy <b>shodné</b> (stejně velké).',
        '<svg width="200" height="180" style="display:block;margin:8px auto 0" viewBox="0 0 200 180"><line x1="20" y1="160" x2="180" y2="20" stroke="#4a9eff" stroke-width="2"/><line x1="20" y1="20" x2="180" y2="160" stroke="#4a9eff" stroke-width="2"/><path d="M 120,90 A 30,30 0 0,0 100,60" fill="none" stroke="#ffcc00" stroke-width="2"/><path d="M 80,90 A 30,30 0 0,0 100,120" fill="none" stroke="#ffcc00" stroke-width="2"/><path d="M 100,60 A 30,30 0 0,0 80,90" fill="none" stroke="#00ff88" stroke-width="2"/><path d="M 100,120 A 30,30 0 0,0 120,90" fill="none" stroke="#00ff88" stroke-width="2"/><text x="118" y="72" font-size="14" fill="#ffcc00" font-family="monospace">α</text><text x="72" y="118" font-size="14" fill="#ffcc00" font-family="monospace">α</text><text x="72" y="78" font-size="14" fill="#00ff88" font-family="monospace">β</text><text x="116" y="116" font-size="14" fill="#00ff88" font-family="monospace">β</text></svg>',
        '<span style="color:#ff5555">⚠️ Záměna:</span> vedlejší (α + β = 180°) ≠ vrcholové (α = α). Vedlejší leží vedle sebe, vrcholové naproti sobě.'] },
 ],
 formulas: [
  '<b>Vedlejší úhly:</b> α + β = 180°',
  '<b>Vrcholové úhly:</b> vzájemně shodné (α = α, β = β)',
 ],
 examples: [
  { q: 'K úhlu 53° najdi vedlejší úhel', s: ['180° − 53° = <b>127°</b>'] },
  { q: 'Vrcholový úhel k 110° má velikost?', s: ['Vrcholové úhly jsou shodné → <b>110°</b>'] },
  { q: 'Přímky se kříží. Jeden z úhlů je 40°. Urči všechny čtyři úhly.', s: ['Vedlejší k 40°: 180°−40° = 140°', 'Vrcholový k 40°: 40°; vrcholový k 140°: 140°', 'Čtyři úhly: <b>40°, 140°, 40°, 140°</b>'] },
 ],
 video: { id: 'a0OCeHpRcOI', title: 'Vedlejší úhly' }
},

'4-3': {
 intro: '🌠 Kometární mistr počítá dobu letu ve stupních a minutách. „Sčítej a převáděj přesně — nebo kometa mine cíl!" Ovládni sexagesimální soustavu.',
 sections: [
  { h: 'Stupně a minuty (sexagesimální soustava)',
    p: ['Jeden stupeň se dělí na <b>60 minut</b>: <b>1° = 60′</b>. A 1 minuta na 60 vteřin: <b>1′ = 60″</b>.',
        'Zápis 35°40′ = 35 stupňů a 40 minut. Není to desetinné číslo — je to jako hodiny a minuty!'] },
  { h: 'Sčítání úhlů (s přenosem)',
    p: ['Minuty sčítej s minutami, stupně se stupni. Když minut vyjde ≥ 60, převeď: 60′ = 1°.',
        'Příklad: 45°30′ + 28°45′<br>Minuty: 30′ + 45′ = 75′ = 1°15′<br>Stupně: 45° + 28° + 1° = 74°<br>Výsledek: <b>74°15′</b>'] },
  { h: 'Odčítání úhlů (s výpůjčkou) a převody',
    p: ['Když nemáš dost minut, „vypůjč" 1° = 60′ ze stupňů.',
        '50°10′ − 23°35′ → 50°10′ = 49°70′ → 70′ − 35′ = 35′, 49° − 23° = 26° → <b>26°35′</b>',
        '<span style="color:#ff5555">⚠️ Pozor:</span> 45,5° ≠ 45°5′. Správně: 45,5° = 45°<b>30</b>′ (0,5 × 60 = 30 minut).'] },
 ],
 formulas: [
  '<b>1° = 60′ · 1′ = 60″</b>',
  '<b>Přetečení při sčítání:</b> 60′ → +1° a −60′',
  '<b>Desetinné stupně → min:</b> 0,5° = 30′ (× 60)',
 ],
 examples: [
  { q: 'Spočítej: 28°45′ + 16°25′', s: ['Minuty: 45′ + 25′ = 70′ = 1°10′', 'Stupně: 28° + 16° + 1° = 45°', 'Výsledek: <b>45°10′</b>'] },
  { q: 'Převeď 150′ na stupně a minuty', s: ['150′ = 120′ + 30′ = 2° + 30′ = <b>2°30′</b>'] },
  { q: 'Kolik minut je 2,75°?', s: ['0,75 × 60 = 45′', '2,75° = <b>2°45′</b>'] },
 ],
 video: { id: 'yhsgmMrGpng', title: 'Sčítání úhlů — stupně a minuty' }
},

/* ─── Oblast 5: ZRCADLOVÝ MĚSÍC ───────────────────────────────── */

'5-1': {
 intro: '🌓 Zrcadlový dvojník tě napodobuje každým pohybem. „Ukáži ti osu souměrnosti — dokážeš najít obraz?" Osová souměrnost je základem vesmírné navigace.',
 sections: [
  { h: 'Co je osová souměrnost',
    p: ['Osová souměrnost <b>překlopí</b> (zrcadlí) obrazec podle osy (přímky). Obraz je stejně velký, jen zrcadlově otočený.',
        'Bod a jeho obraz leží na <b>kolmici k ose</b>, ve <b>stejné vzdálenosti</b> od osy z obou stran.'] },
  { h: 'Konstrukční postup pro obraz bodu',
    p: ['1. Z bodu P veď kolmici k ose souměrnosti.<br>2. Změř vzdálenost bodu od osy (= <i>d</i>).<br>3. Obraz P′ leží na téže kolmici, na druhé straně osy, ve vzdálenosti <i>d</i> od osy.',
        '<svg width="240" height="130" style="display:block;margin:8px auto 0" viewBox="0 0 240 130"><line x1="120" y1="5" x2="120" y2="125" stroke="#4a9eff" stroke-width="2" stroke-dasharray="6,3"/><text x="123" y="18" font-size="11" fill="#4a9eff" font-family="monospace">osa</text><circle cx="60" cy="65" r="6" fill="#ffcc00"/><text x="40" y="58" font-size="12" fill="#ffcc00" font-family="monospace">P</text><circle cx="180" cy="65" r="6" fill="#00ff88"/><text x="183" y="58" font-size="12" fill="#00ff88" font-family="monospace">P\'</text><line x1="60" y1="65" x2="180" y2="65" stroke="#c9d1d9" stroke-width="1" stroke-dasharray="4,3"/><text x="82" y="80" font-size="10" fill="#c9d1d9" font-family="monospace">d</text><text x="130" y="80" font-size="10" fill="#c9d1d9" font-family="monospace">d</text></svg>'] },
  { h: 'Osy souměrnosti obrazců',
    p: ['Některé obrazce mají osy souměrnosti — přímky, podél nichž se obrazec překryje sám se sebou.',
        'Čtverec: <b>4 osy</b> | Obdélník (ne čtverec): <b>2 osy</b> | Rovnostranný trojúhelník: <b>3 osy</b> | Kruh: <b>nekonečně mnoho os</b>.'] },
 ],
 formulas: [
  '<b>Obraz bodu:</b> kolmice k ose, stejná vzdálenost na druhé straně',
  '<b>Osy:</b> čtverec 4, obdélník 2, rovnostranný △ 3, kruh ∞',
 ],
 examples: [
  { q: 'Kolik os souměrnosti má čtverec?', s: ['2 úhlopříčky + 2 středové přímky = <b>4</b>'] },
  { q: 'Kolik os souměrnosti má obdélník (ne čtverec)?', s: ['Pouze 2 středové přímky (ne úhlopříčky!) → <b>2</b>'] },
 ],
 video: { id: 'Yp5u-LyQUXQ', title: 'Osová souměrnost' },
},

'5-2': {
 intro: '🪞 Stříbrná hladina planety odráží souřadnice jako dokonalé zrcadlo. „Urči přesný obraz v souřadnicovém systému!" Souřadnice a osy čekají.',
 sections: [
  { h: 'Obraz bodu v souřadnicovém systému',
    p: ['<b>Souměrnost podle osy y</b> (svislé): změní se znaménko souřadnice <i>x</i>.<br>[<i>x</i> ; <i>y</i>] → [<b>−x</b> ; <i>y</i>]',
        '<b>Souměrnost podle osy x</b> (vodorovné): změní se znaménko souřadnice <i>y</i>.<br>[<i>x</i> ; <i>y</i>] → [<i>x</i> ; <b>−y</b>]',
        '<svg width="200" height="200" style="display:block;margin:8px auto 0" viewBox="0 0 200 200"><line x1="10" y1="100" x2="190" y2="100" stroke="#4a9eff" stroke-width="1.5"/><line x1="100" y1="10" x2="100" y2="190" stroke="#4a9eff" stroke-width="1.5"/><text x="185" y="96" font-size="11" fill="#4a9eff" font-family="monospace">x</text><text x="103" y="16" font-size="11" fill="#4a9eff" font-family="monospace">y</text><circle cx="150" cy="60" r="5" fill="#ffcc00"/><text x="154" y="56" font-size="11" fill="#ffcc00" font-family="monospace">A(2,2)</text><circle cx="50" cy="60" r="5" fill="#00ff88"/><text x="14" y="56" font-size="10" fill="#00ff88" font-family="monospace">A\'(−2,2)</text><circle cx="150" cy="140" r="5" fill="#ff5555"/><text x="154" y="150" font-size="10" fill="#ff5555" font-family="monospace">A\'\'(2,−2)</text><line x1="50" y1="60" x2="150" y2="60" stroke="#00ff88" stroke-width="1" stroke-dasharray="4,3"/><line x1="150" y1="60" x2="150" y2="140" stroke="#ff5555" stroke-width="1" stroke-dasharray="4,3"/></svg>'] },
  { h: 'Hledání osy souměrnosti obrazce',
    p: ['Osa souměrnosti musí každý bod zobrazit na bod, který v obrazci také leží.',
        'U jednoduchých obrazců ji najdeš „od oka" nebo pomocí konstrukce středů stran.'] },
 ],
 formulas: [
  '<b>Podle osy y:</b> [x ; y] → [−x ; y]',
  '<b>Podle osy x:</b> [x ; y] → [x ; −y]',
 ],
 examples: [
  { q: 'Obraz bodu [4 ; 1] podle osy y', s: ['Změní se znaménko x', 'Výsledek: <b>[−4 ; 1]</b>'] },
  { q: 'Obraz bodu [−2 ; 5] podle osy x', s: ['Změní se znaménko y', 'Výsledek: <b>[−2 ; −5]</b>'] },
  { q: 'Obraz bodu [−3 ; −4] podle osy y', s: ['−(−3) = +3', 'Výsledek: <b>[3 ; −4]</b>'] },
 ],
 video: null,
},

'5-3': {
 intro: '🌑 Temná strana Zrcadlového měsíce skrývá shodné útvary. „Poznej, kdy jsou útvary shodné — pak otevřu bránu!" Shodnost je základem geometrie.',
 sections: [
  { h: 'Co je shodnost (kongruence)',
    p: ['Dva útvary jsou <b>shodné</b>, pokud je lze přesně přeložit jeden na druhý — mají <b>stejný tvar i stejnou velikost</b>.',
        'Shodné útvary mají: všechny odpovídající strany stejně dlouhé + všechny odpovídající úhly stejně velké.'] },
  { h: 'Shodná zobrazení (pohyby v rovině)',
    p: ['<b>Posunutí</b> (translace): posun o vektor — každý bod se přesune o stejnou vzdálenost ve stejném směru.',
        '<b>Otočení</b> (rotace): otočení kolem středu o daný úhel.',
        '<b>Osová souměrnost</b>: překlopení podle osy.',
        'Všechna tato zobrazení shodnost <b>zachovávají</b>. Zvětšení/zmenšení shodnost <b>NEzachovává</b> — to je <i>podobnost</i>.'] },
  { h: 'Jak ověřit shodnost',
    p: ['U trojúhelníků stačí ověřit: SSS (tři strany), SAS (dvě strany a úhel mezi nimi), ASA (dva úhly a strana mezi nimi), nebo SSA v pravém △.',
        'Obecně: zkus položit jeden útvar na druhý (nebo jeho obraz v souměrnosti) — pokud se přesně překryjí, jsou shodné.'] },
 ],
 formulas: [
  '<b>Shodné útvary:</b> stejné strany i úhly',
  '<b>Zachovávají shodnost:</b> posunutí, otočení, osová souměrnost',
  '<b>NEzachovává shodnost:</b> zvětšení/zmenšení (= podobnost)',
 ],
 examples: [
  { q: 'Jsou dva čtverce se stranou 5 cm shodné?', s: ['Stejný tvar i velikost → <b>ANO</b>'] },
  { q: 'Zachová shodnost zvětšení 2×?', s: ['Mění velikost → <b>NE</b> (je to podobnost, ne shodnost)'] },
  { q: 'Je obraz v osové souměrnosti shodný s původním útvarem?', s: ['Osová souměrnost zachovává vzdálenosti → <b>ANO</b>'] },
 ],
 video: { id: 'ycpR3sbBwbA', title: 'Konstrukce trojúhelníku — věta USU' }
},

/* ─── Oblast 6: KRYCHLOVÁ STANICE ─────────────────────────────── */

'6-1': {
 intro: '📦 Nákladní robot musí naplnit krychlové kontejnery. „Spočítej mi objem přesně — jinak kontejnery explodují přetlakem!" Ovládni objem těles.',
 sections: [
  { h: 'Co je objem',
    p: ['Objem říká, <b>kolik místa těleso zabírá</b> (kolik se do něj vejde). Měří se v <b>cm³, dm³, m³</b>…',
        'Jednotková krychle 1 cm × 1 cm × 1 cm má objem <b>1 cm³</b>. Objem kvádru = počet takových krychlí.'] },
  { h: 'Objem krychle a kvádru',
    p: ['<b>Kvádr</b>: tři různé rozměry (délka <i>a</i>, šířka <i>b</i>, výška <i>c</i>) → V = a · b · c.<br><b>Krychle</b>: všechny hrany stejné (<i>a</i>) → V = a³.',
        '<svg width="280" height="110" style="display:block;margin:8px auto 0" viewBox="0 0 280 110"><g transform="translate(10,10)"><polygon points="0,70 60,70 60,20 0,20" fill="none" stroke="#4a9eff" stroke-width="2"/><polygon points="0,20 20,0 80,0 60,20" fill="none" stroke="#4a9eff" stroke-width="2"/><polygon points="60,20 80,0 80,50 60,70" fill="none" stroke="#4a9eff" stroke-width="2"/><text x="22" y="88" font-size="12" fill="#ffcc00" font-family="monospace">a</text><text x="63" y="42" font-size="12" fill="#ffcc00" font-family="monospace">b</text><text x="-14" y="48" font-size="12" fill="#ffcc00" font-family="monospace">c</text><text x="18" y="48" font-size="11" fill="#c9d1d9" font-family="monospace">kvádr</text></g><g transform="translate(165,15)"><polygon points="0,65 45,65 45,25 0,25" fill="none" stroke="#4a9eff" stroke-width="2"/><polygon points="0,25 15,10 60,10 45,25" fill="none" stroke="#4a9eff" stroke-width="2"/><polygon points="45,25 60,10 60,50 45,65" fill="none" stroke="#4a9eff" stroke-width="2"/><text x="16" y="82" font-size="12" fill="#ffcc00" font-family="monospace">a</text><text x="48" y="40" font-size="12" fill="#ffcc00" font-family="monospace">a</text><text x="-14" y="46" font-size="12" fill="#ffcc00" font-family="monospace">a</text><text x="8" y="46" font-size="11" fill="#c9d1d9" font-family="monospace">krychle</text></g></svg>'] },
  { h: 'Jednotky objemu — převody',
    p: ['Mezi sousedními objemovými jednotkami je vždy <b>1000×</b> (ne 10×, ne 100×!).',
        '<table style="border-collapse:collapse;font-size:12px;color:#c9d1d9;margin:4px 0"><tr><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">mm³</th><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">cm³</th><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">dm³</th><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">m³</th></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px;text-align:center">× 1000</td><td style="border:1px solid #4a9eff;padding:3px 8px;text-align:center">× 1000</td><td style="border:1px solid #4a9eff;padding:3px 8px;text-align:center">× 1000</td><td style="border:1px solid #4a9eff;padding:3px 8px;text-align:center">—</td></tr></table>',
        '<span style="color:#ff5555">⚠️ Nezaměňuj</span> s plochou (×100) ani s délkou (×10)!'] },
 ],
 formulas: [
  '<b>Objem kvádru:</b> V = a · b · c',
  '<b>Objem krychle:</b> V = a³',
  '<b>Jednotky objemu:</b> ×1000 (mm³ → cm³ → dm³ → m³)',
 ],
 examples: [
  { q: 'Kvádr 4 cm × 3 cm × 5 cm. Objem?', s: ['V = 4 · 3 · 5 = <b>60 cm³</b>'] },
  { q: 'Krychle s hranou 3 cm. Objem?', s: ['V = 3³ = 3 · 3 · 3 = <b>27 cm³</b>'] },
  { q: 'Převeď 2 dm³ na cm³', s: ['1 dm³ = 1000 cm³', '2 · 1000 = <b>2 000 cm³</b>'] },
 ],
 video: { id: '1gF_B-eoKwM', title: 'Objem a povrch krychle' },
},

'6-2': {
 intro: '🛠️ Svářecí dron potřebuje pokrýt tělesa přesnou vrstvou plátů. „Vypočítej povrch — plýtvání materiálem zruší misi!" Povrch krychle a kvádru.',
 sections: [
  { h: 'Co je povrch',
    p: ['Povrch je <b>součet obsahů všech stěn</b> tělesa — jako kdybys těleso rozložil do roviny a změřil celkový obal. Měří se v <b>cm², m²</b>.',
        'Krychle má <b>6 stejných čtvercových stěn</b>, kvádr má <b>3 páry shodných obdélníkových stěn</b>.'] },
  { h: 'Výpočet povrchu',
    p: ['<b>Krychle:</b> 6 stěn, každá má obsah a² → S = 6a².',
        '<b>Kvádr:</b> 3 dvojice stěn: čelo (a·b), bok (b·c), víko (a·c) → S = 2(ab + bc + ac).',
        '<svg width="260" height="120" style="display:block;margin:8px auto 0" viewBox="0 0 260 120"><rect x="50" y="40" width="40" height="40" fill="none" stroke="#4a9eff" stroke-width="1.5"/><rect x="90" y="40" width="40" height="40" fill="none" stroke="#4a9eff" stroke-width="1.5"/><rect x="130" y="40" width="40" height="40" fill="none" stroke="#4a9eff" stroke-width="1.5"/><rect x="170" y="40" width="40" height="40" fill="none" stroke="#4a9eff" stroke-width="1.5"/><rect x="90" y="0" width="40" height="40" fill="none" stroke="#4a9eff" stroke-width="1.5"/><rect x="90" y="80" width="40" height="40" fill="none" stroke="#4a9eff" stroke-width="1.5"/><text x="95" y="15" font-size="10" fill="#ffcc00" font-family="monospace">vrch</text><text x="95" y="98" font-size="10" fill="#ffcc00" font-family="monospace">dno</text><text x="52" y="62" font-size="10" fill="#ffcc00" font-family="monospace">bok</text><text x="172" y="62" font-size="10" fill="#ffcc00" font-family="monospace">bok</text><text x="95" y="62" font-size="10" fill="#00ff88" font-family="monospace">č</text><text x="135" y="62" font-size="10" fill="#00ff88" font-family="monospace">č</text><text x="108" y="115" font-size="9" fill="#c9d1d9" font-family="monospace">síť krychle</text></svg>'] },
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
 intro: '🔧 Servisní jednotka kontroluje zásoby paliva v litrech a mililitrech. „Bez znalosti převodů nestartujeme!" Ovládni jednotky objemu a sítě těles.',
 sections: [
  { h: 'Jednotky objemu a jejich vztah k litrům',
    p: ['Klíčové vztahy: <b>1 l = 1 dm³</b> a <b>1 ml = 1 cm³</b> — tohle musíš znát nazpaměť!',
        '<table style="border-collapse:collapse;font-size:12px;color:#c9d1d9;margin:4px 0"><tr><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">Objem</th><th style="border:1px solid #4a9eff;padding:3px 8px;color:#ffcc00">Kapalina</th></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px">1 cm³</td><td style="border:1px solid #4a9eff;padding:3px 8px">1 ml</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px">1 dm³</td><td style="border:1px solid #4a9eff;padding:3px 8px">1 litr (l)</td></tr><tr><td style="border:1px solid #4a9eff;padding:3px 8px">1 m³</td><td style="border:1px solid #4a9eff;padding:3px 8px">1 000 l</td></tr></table>'] },
  { h: 'Převody — řešené příklady',
    p: ['3,5 dm³ → cm³: × 1000 → <b>3 500 cm³</b><br>750 ml → dm³: ÷ 1000 → <b>0,75 dm³</b> = 0,75 l<br>2 m³ → dm³: × 1000 → <b>2 000 dm³</b> = 2 000 l'] },
  { h: 'Síť tělesa',
    p: ['<b>Síť</b> je těleso „rozložené" do roviny — všechny stěny vedle sebe tak, aby šly složit zpět.',
        'Krychle: síť ze <b>6 čtverců</b> (existuje 11 různých platných sítí). Kvádr: síť ze <b>6 obdélníků</b> (3 páry).',
        'Pravidlo: v síti musí každá stěna ležet <b>právě jednou</b>. Sítě se sousedními stranami sdílejí hranu.'] },
 ],
 formulas: [
  '<b>1 l = 1 dm³ · 1 ml = 1 cm³</b>',
  '<b>1 dm³ = 1000 cm³ · 1 m³ = 1000 dm³</b>',
 ],
 examples: [
  { q: 'Převeď 2,5 dm³ na cm³', s: ['1 dm³ = 1000 cm³', '2,5 · 1000 = <b>2 500 cm³</b>'] },
  { q: 'Kolik litrů je 3 000 cm³?', s: ['3 000 cm³ = 3 dm³ → <b>3 litry</b>'] },
  { q: 'Nádrž má objem 0,5 m³. Kolik litrů pojme?', s: ['0,5 m³ = 0,5 · 1000 dm³ = 500 dm³ = <b>500 litrů</b>'] },
 ],
 video: { id: 'KS8_EShoz1M', title: 'Převody jednotek objemu' }
},

/* ─── Oblast 7: TROJÚHELNÍKOVÁ GALAXIE ────────────────────────── */

'7-1': {
 intro: '🔺 Trojhvězda září ve tvaru trojúhelníku. „Součet jeho úhlů je zákon vesmíru — dokaž, že ho znáš!" Pochop součet úhlů trojúhelníku.',
 sections: [
  { h: 'Součet vnitřních úhlů trojúhelníku',
    p: ['Součet velikostí všech tří vnitřních úhlů trojúhelníku je <b>vždy 180°</b> — platí to pro každý trojúhelník bez výjimky.',
        'Když znáš dva úhly, třetí dopočítáš: <b>γ = 180° − α − β</b>.',
        '<svg width="240" height="140" style="display:block;margin:8px auto 0" viewBox="0 0 240 140"><polygon points="120,10 30,130 210,130" fill="none" stroke="#4a9eff" stroke-width="2.5"/><path d="M 108,27 A 18,18 0 0,1 132,27" fill="none" stroke="#ffcc00" stroke-width="2"/><path d="M 48,118 A 18,18 0 0,1 48,118" fill="none" stroke="#00ff88" stroke-width="2"/><path d="M 46,116 A 18,18 0 0,0 62,130" fill="none" stroke="#00ff88" stroke-width="2"/><path d="M 196,130 A 18,18 0 0,0 178,116" fill="none" stroke="#ff5555" stroke-width="2"/><text x="112" y="42" font-size="14" fill="#ffcc00" font-family="monospace">γ</text><text x="52" y="125" font-size="14" fill="#00ff88" font-family="monospace">α</text><text x="184" y="125" font-size="14" fill="#ff5555" font-family="monospace">β</text><text x="88" y="90" font-size="12" fill="#c9d1d9" font-family="monospace">α + β + γ = 180°</text></svg>'] },
  { h: 'Druhy trojúhelníků podle úhlů',
    p: ['<b>Ostroúhlý:</b> všechny tři úhly jsou ostré (méně než 90°).<br><b>Pravoúhlý:</b> jeden úhel je přesně 90° (pravý úhel).<br><b>Tupoúhlý:</b> jeden úhel je tupý (více než 90°).'] },
  { h: 'Vnější úhel trojúhelníku',
    p: ['Vnější úhel = <b>součet dvou vnitřních nepřilehlých úhlů</b>.',
        'Příklad: vnější úhel u vrcholu C = α + β.',
        '<span style="color:#ff5555">⚠️ Česká konvence:</span> strana <b>a</b> leží naproti vrcholu <b>A</b>, strana <b>b</b> naproti <b>B</b>, strana <b>c</b> naproti <b>C</b>. Úhly α (u A), β (u B), γ (u C).'] },
 ],
 formulas: [
  '<b>Součet úhlů:</b> α + β + γ = 180°',
  '<b>Třetí úhel:</b> γ = 180° − α − β',
  '<b>Vnější úhel:</b> = součet dvou vnitřních nepřilehlých',
 ],
 examples: [
  { q: 'V trojúhelníku je α = 70°, β = 60°. Kolik je γ?', s: ['γ = 180° − 70° − 60° = <b>50°</b>'] },
  { q: 'Pravoúhlý trojúhelník má jeden ostrý úhel 35°. Druhý ostrý úhel?', s: ['180° − 90° − 35° = <b>55°</b>'] },
 ],
 video: { id: 'PyAQUUIJuvQ', title: 'Součet úhlů v trojúhelníku' }
},

'7-2': {
 intro: '⭐ Hvězdný geometr zkoumá vlastnosti trojúhelníků pod lupou. „Nerovnost, výšky, těžiště, kružnice — bez toho galaxii neotevřu!" Ponor se hluboko.',
 sections: [
  { h: 'Trojúhelníková nerovnost',
    p: ['V každém trojúhelníku platí: <b>součet libovolných dvou stran je větší než třetí strana</b>.',
        'Pokud tato podmínka není splněna, trojúhelník nelze sestrojit.',
        '<span style="color:#ff5555">⚠️ Česká konvence:</span> strana <i>a</i> je naproti vrcholu A, strana <i>b</i> naproti B, strana <i>c</i> naproti C — pojmenování strany závisí na poloze vrcholu, ne na tom, zda je „přilehlá" nebo „protilehlá" vůči úhlu.'] },
  { h: 'Výšky trojúhelníku',
    p: ['<b>Výška</b> je úsečka z vrcholu kolmá na protilehlou stranu (nebo její prodloužení). Každý trojúhelník má tři výšky.',
        'Všechny tři výšky se protínají v jednom bodě — <b>ortocentru</b>.',
        '<svg width="240" height="140" style="display:block;margin:8px auto 0" viewBox="0 0 240 140"><polygon points="60,120 200,120 110,15" fill="none" stroke="#4a9eff" stroke-width="2.5"/><line x1="110" y1="15" x2="110" y2="120" stroke="#ffcc00" stroke-width="1.5" stroke-dasharray="5,3"/><rect x="104" y="114" width="12" height="12" fill="none" stroke="#ffcc00" stroke-width="1.5"/><text x="48" y="115" font-size="12" fill="#4a9eff" font-family="monospace">A</text><text x="202" y="115" font-size="12" fill="#4a9eff" font-family="monospace">B</text><text x="107" y="12" font-size="12" fill="#4a9eff" font-family="monospace">C</text><text x="114" y="75" font-size="11" fill="#ffcc00" font-family="monospace">v_c</text><text x="100" y="137" font-size="10" fill="#c9d1d9" font-family="monospace">výška z C na stranu c</text></svg>'] },
  { h: 'Těžiště a těžnice',
    p: ['<b>Těžnice</b> spojuje vrchol s středem protilehlé strany. Každý trojúhelník má tři těžnice.',
        'Všechny těžnice se protínají v <b>těžišti</b>, které leží ve <b>2/3 délky</b> těžnice od vrcholu.'] },
  { h: 'Kružnice vepsaná a opsaná',
    p: ['<b>Kružnice opsaná</b>: prochází všemi třemi vrcholy (střed = průsečík os stran).',
        '<b>Kružnice vepsaná</b>: dotýká se všech tří stran zevnitř (střed = průsečík os úhlů).'] },
 ],
 formulas: [
  '<b>Trojúhelníková nerovnost:</b> a + b > c (pro každé pořadí stran)',
  '<b>Výška:</b> kolmice z vrcholu na protilehlou stranu',
  '<b>Těžiště:</b> leží ve 2/3 těžnice od vrcholu',
 ],
 examples: [
  { q: 'Lze sestrojit trojúhelník se stranami 3, 4, 8 cm?', s: ['3 + 4 = 7, ale 7 < 8', '<b>NE</b> — trojúhelníková nerovnost nesplněna'] },
  { q: 'Lze sestrojit trojúhelník 5, 6, 9 cm?', s: ['5 + 6 = 11 > 9 ✓ ; 5 + 9 = 14 > 6 ✓ ; 6 + 9 = 15 > 5 ✓', '<b>ANO</b>'] },
 ],
 video: { id: 'RbkRs2cS8dk', title: 'Trojúhelníky — CERMAT 2023' }
},

'7-3': {
 intro: '👾 Vládce Trojúhelníkové galaxie — finální boss celé expedice! „Prověřím tě ze všech sedmi oblastí. Jen nejlepší vesmírní matematici projdou!" Jsi připraven?',
 sections: [
  { h: 'Přehled klíčových vzorců — 6. ročník',
    p: ['<table style="border-collapse:collapse;font-size:11px;color:#c9d1d9;margin:4px 0;width:100%"><tr><th style="border:1px solid #4a9eff;padding:3px 6px;color:#ffcc00;text-align:left">Téma</th><th style="border:1px solid #4a9eff;padding:3px 6px;color:#ffcc00;text-align:left">Vzorec / pravidlo</th></tr><tr><td style="border:1px solid #4a9eff;padding:2px 6px">Pořadí operací</td><td style="border:1px solid #4a9eff;padding:2px 6px">( ) → × ÷ → + −</td></tr><tr><td style="border:1px solid #4a9eff;padding:2px 6px">Obvod obdélníku</td><td style="border:1px solid #4a9eff;padding:2px 6px">o = 2(a+b)</td></tr><tr><td style="border:1px solid #4a9eff;padding:2px 6px">Obsah obdélníku</td><td style="border:1px solid #4a9eff;padding:2px 6px">S = a · b</td></tr><tr><td style="border:1px solid #4a9eff;padding:2px 6px">Objem kvádru</td><td style="border:1px solid #4a9eff;padding:2px 6px">V = a · b · c</td></tr><tr><td style="border:1px solid #4a9eff;padding:2px 6px">Povrch krychle</td><td style="border:1px solid #4a9eff;padding:2px 6px">S = 6a²</td></tr><tr><td style="border:1px solid #4a9eff;padding:2px 6px">Povrch kvádru</td><td style="border:1px solid #4a9eff;padding:2px 6px">S = 2(ab+bc+ac)</td></tr><tr><td style="border:1px solid #4a9eff;padding:2px 6px">Úhly v trojúhelníku</td><td style="border:1px solid #4a9eff;padding:2px 6px">α + β + γ = 180°</td></tr><tr><td style="border:1px solid #4a9eff;padding:2px 6px">Vedlejší úhly</td><td style="border:1px solid #4a9eff;padding:2px 6px">α + β = 180°</td></tr><tr><td style="border:1px solid #4a9eff;padding:2px 6px">1 l = </td><td style="border:1px solid #4a9eff;padding:2px 6px">1 dm³ ; 1 ml = 1 cm³</td></tr></table>'] },
  { h: 'Tipy pro přijímací zkoušky (CERMAT styl)',
    p: ['<b>Čti pozorně:</b> každé slovo v zadání je důležité. Co se ptají — objem? Povrch? Obvod?<br><b>Hlídej jednotky:</b> nezaměňuj cm a cm², cm² a cm³.<br><b>Nakresli si obrázek</b> — geometrie bez náčrtku = zbytečné chyby.<br><b>Výsledek odhadni:</b> je to v reálném řádu? 500 cm³ kostka ledu dává smysl, 500 m³ ne.',
        '<b>Kontroluj pořadí operací</b> — v testu bývá chyták se závorkami.<br><b>Zaokrouhlování</b> — vždy zkontroluj, na kolik desetinných míst je výsledek požadován.'] },
  { h: 'Rychlá rozcvička',
    p: ['Projdi si: 1-1 → 1-2 → 2-1 → 2-2 → 3-1 → 3-2 → 3-3 → 4-1 → 4-2 → 5-1 → 6-1 → 6-2 → 7-1 → 7-2.<br>Kde si nejsi jistý/á, klikni na „📖 Teorie" a zopakuj si.'] },
 ],
 formulas: [
  '<b>Pořadí operací:</b> ( ) → × ÷ → + −',
  '<b>Úhly v △:</b> 180° · <b>Vedlejší:</b> 180° · <b>Vrcholové:</b> shodné',
  '<b>Objem:</b> ×1000 · <b>Plocha:</b> ×100 · <b>Délka:</b> ×10',
 ],
 examples: [
  { q: 'Rozcvička: 3 + 4 × 2 − (6 − 4)', s: ['Závorka: 6−4 = 2', 'Násobení: 4·2 = 8', '3 + 8 − 2 = <b>9</b>'] },
  { q: 'Kvádr 3 × 4 × 5 cm. Objem i povrch?', s: ['V = 3·4·5 = <b>60 cm³</b>', 'S = 2·(3·4 + 4·5 + 3·5) = 2·(12+20+15) = 2·47 = <b>94 cm²</b>'] },
 ],
 video: { id: 'rBi6FeeDgM4', title: 'CERMAT 2023 — přijímací zkoušky' }
},

};
})();
