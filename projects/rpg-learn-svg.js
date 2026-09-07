/* rpg-learn-svg.js — sdílené diagramy pro teorii 1. stupně (3.–5. ročník).
 *
 * PROČ MODUL A NE INLINE SVG V KAŽDÉM ROČNÍKU:
 * sedm z deseti tvarů se opakuje napříč ročníky a liší se jen čísly — číselná osa
 * pětkrát, řády čtyřikrát, útvary třikrát, žebřík jednotek a dělení se zbytkem
 * dvakrát. Tři ručně opsané kopie téže kresby se dřív nebo později rozejdou a nikde
 * to nespadne; tenhle repozitář na to už doplatil u portrétů hrdinů.
 *
 * BARVY JSOU CSS PROMĚNNÉ, ne pevné kódy — týž tvar se tak obarví paletou ročníku
 * (les / piráti / draci), aniž by se cokoli kreslilo znovu.
 *
 * KAM SE VÝSTUP SMÍ VLOŽIT: jedině do sections[].p, která jde do HTML SUROVĚ.
 * formulas a examples[].s jdou v 1. stupni přes esc2() — tam by se SVG vypsalo
 * jako text. Hlídá tests/rpg-learn-diagramy.test.cjs.
 *
 * Načítat <script defer> PŘED rpg-learn-N.js: moduly běží v pořadí dokumentu,
 * takže se generátory dají volat rovnou při stavbě dat výkladu.
 */
(function () {
  'use strict';

  // Popisky píšeme my (statický text v repu), ale uvozovka v aria-label by rozbila
  // atribut, tak ať to nezávisí na tom, že si na to někdo vzpomene.
  const a = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  const svg = (w, h, popis, telo) =>
    '<svg viewBox="0 0 ' + w + ' ' + h + '" style="display:block;margin:10px auto 0;max-width:100%"'
    + ' role="img" aria-label="' + a(popis) + '">' + telo + '</svg>';

  // t(x, y, text, velikost, barva, zarovnání) — zkratka, jinak je každý popisek na řádek
  const t = (x, y, s, size, fill, anchor) =>
    '<text x="' + x + '" y="' + y + '" font-size="' + size + '" font-family="monospace" fill="var(--' + fill + ')"'
    + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + s + '</text>';

  const line = (x1, y1, x2, y2, barva, w, dash) =>
    '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--' + barva + ')"'
    + ' stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';

  const kruh = (cx, cy, r, barva) =>
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--' + barva + ')"/>';

  const ramec = (x, y, w, h, barva, sw, rx) =>
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"'
    + (rx ? ' rx="' + rx + '"' : '') + ' fill="none" stroke="var(--' + barva + ')" stroke-width="' + sw + '"/>';

  // Šipka doprava na konci osy — stejná ve všech ročnících.
  const sipka = x => '<polygon points="' + x + ',34 ' + (x - 8) + ',30 ' + (x - 8) + ',38" fill="var(--blue)"/>';

  const RADY = ['jednotky', 'desítky', 'stovky', 'tisíce', 'desetitisíce', 'statisíce', 'miliony'];

  const API = {

    /* Číselná osa pro POROVNÁVÁNÍ: dvě čísla, menší vlevo.
       Kreslí se v pořadí, v jakém přijdou — volající zodpovídá za to, že a < b. */
    osaPorovnani(mensi, vetsi, popisek) {
      const p = popisek || 'vlevo = menší · vpravo = větší';
      return svg(290, 74, 'Číselná osa: ' + mensi + ' leží vlevo od ' + vetsi + ', proto je menší',
        line(14, 34, 276, 34, 'blue', 2)
        + sipka(276)
        + line(60, 26, 60, 42, 'muted', 2)
        + line(210, 26, 210, 42, 'muted', 2)
        + kruh(60, 34, 6, 'gold')
        + kruh(210, 34, 6, 'green')
        + t(60, 20, mensi, 14, 'gold', 'middle')
        + t(210, 20, vetsi, 14, 'green', 'middle')
        + t(135, 62, p, 13, 'text', 'middle'));
    },

    /* Číselná osa pro ZAOKROUHLOVÁNÍ: úsek s přerušovanou půlkou uprostřed.
       Půlka je červená schválně — je to hranice rozhodnutí, ne další značka. */
    osaZaokrouhleni(od, doo, pulka) {
      const p = (pulka === undefined || pulka === null) ? (od + doo) / 2 : pulka;
      return svg(290, 74, 'Číselná osa od ' + od + ' do ' + doo + ' s vyznačenou půlkou ' + p,
        line(14, 34, 276, 34, 'blue', 2)
        + sipka(276)
        + line(30, 26, 30, 42, 'muted', 2)
        + line(150, 22, 150, 46, 'red', 2, '4 3')
        + line(270, 26, 270, 42, 'muted', 2)
        + t(30, 18, od, 13, 'text', 'middle')
        + t(150, 16, p, 12, 'red', 'middle')
        + t(270, 18, doo, 13, 'text', 'middle')
        + t(88, 62, 'dolů na ' + od, 12, 'text', 'middle')
        + t(212, 62, 'nahoru na ' + doo, 12, 'text', 'middle'));
    },

    /* Rozklad čísla na řády. Počet sloupců se řídí délkou čísla (3 až 6),
       šířka se dopočítá, aby se plátno drželo na 280 — na 380px displeji
       se pak nemusí zmenšovat. */
    rady(cislo, popis) {
      const cifry = String(cislo).replace(/\s/g, '').split('');
      const n = cifry.length;
      const sirka = (280 - 16 - 6 * (n - 1)) / n;
      let telo = '';
      for (let i = 0; i < n; i++) telo += ramec(8 + i * (sirka + 6), 8, sirka, 78, 'blue', 2, 6);
      const stred = i => 8 + i * (sirka + 6) + sirka / 2;
      const fs = n > 4 ? 24 : 34;
      for (let i = 0; i < n; i++) telo += t(stred(i), 56, cifry[i], fs, 'gold', 'middle');
      for (let i = 0; i < n; i++) telo += t(stred(i), 104, RADY[n - 1 - i], n > 4 ? 10 : 12, 'text', 'middle');
      for (let i = 0; i < n; i++) {
        const hod = Number(cifry[i]) * Math.pow(10, n - 1 - i);
        telo += t(stred(i), 122, hod, n > 4 ? 11 : 13, 'muted', 'middle');
      }
      return svg(280, 130, popis || ('Rozklad čísla ' + cislo + ' na řády'), telo);
    },

    /* Násobilka jako obdélníková mřížka kuliček — „4 řady po 3" je vidět,
       kdežto „4 · 3" se musí pamatovat. */
    mrizka(radky, sloupce, popis) {
      // Rozteč sloupců se stahuje, aby mřížka nerostla donekonečna: 3 sloupce
      // 3. ročníku si nechají původních 50 px, sedm sloupců 4. ročníku by s nimi
      // sahalo na 369 px při plátně 240 a část kuliček by se NENAKRESLILA.
      const dx = sloupce > 1 ? Math.min(50, Math.floor(220 / (sloupce - 1))) : 50;
      let telo = '';
      for (let r = 0; r < radky; r++)
        for (let s = 0; s < sloupce; s++)
          telo += kruh(60 + s * dx, 26 + r * 26, 9, 'gold');
      const posX = 60 + (sloupce - 1) * dx, posY = 26 + (radky - 1) * 26;
      const soucet = '= ' + (radky * sloupce);
      const xTxt = posX + 40, stredY = (26 + posY) / 2 + 7;
      telo += t(20, stredY, radky, 13, 'text', 'middle')
        + t((60 + posX) / 2, posY + 18, sloupce + ' v řadě', 13, 'text', 'middle')
        + t(xTxt, stredY, soucet, 15, 'green');
      return svg(xTxt + soucet.length * 9 + 4, posY + 26,
        popis || ('Mřížka ' + radky + ' krát ' + sloupce + ', dohromady ' + radky * sloupce), telo);
    },

    /* Dělení se zbytkem: plné skupiny v rámečcích, zbytek stranou červeně.
       Zbytek je červený proto, že je to ta část, která se do skupiny NEVEŠLA. */
    skupiny(celkem, poKolika, popis) {
      const skupin = Math.floor(celkem / poKolika);
      const zbytek = celkem % poKolika;
      // Kuličky leží po DVOU v řadě — ve skupině i ve zbytku. Z toho se odvodí
      // výška rámečku i celého plátna; bez toho se 29 : 6 (příklad ze 4. ročníku)
      // uřízne, a to potichu, protože obsah mimo viewBox se prostě nenakreslí.
      const rad = n => Math.ceil(n / 2);
      const bunka = (x0, i) => [x0 + (i % 2) * 22, 26 + Math.floor(i / 2) * 24];
      const ramH = 36 + 24 * (rad(poKolika) - 1);
      let kulicky = '', ramecky = '';
      for (let g = 0; g < skupin; g++) {
        const x0 = 24 + g * 88;
        for (let i = 0; i < poKolika; i++) { const b = bunka(x0, i); kulicky += kruh(b[0], b[1], 9, 'blue'); }
        ramecky += ramec(8 + g * 88, 8, 58, ramH, 'muted', 2, 6);
      }
      // Zbytek stojí VPRAVO od poslední skupiny, ne na pevné souřadnici. Ta dřív
      // vycházela na 272 + poloměr 9 = 281 při plátně 280, takže se červené
      // kuličce ořezával okraj — zrovna tomu prvku, kvůli kterému obrázek je.
      const konecSkupin = 66 + 88 * (skupin - 1);
      const zbX = konecSkupin + 21;
      let zb = '';
      for (let i = 0; i < zbytek; i++) { const b = bunka(zbX, i); zb += kruh(b[0], b[1], 9, 'red'); }
      const dno = Math.max(8 + ramH, 26 + 24 * (rad(zbytek) - 1) + 9);
      const W = Math.max(konecSkupin, zbX + (zbytek > 1 ? 22 : 0) + 9) + 8;
      const H = dno + 44;
      return svg(W, H,
        popis || ('Dělení ' + celkem + ' na skupiny po ' + poKolika + ', zbytek ' + zbytek),
        kulicky + ramecky + zb
        + t(W / 2, dno + 20, celkem + ' : ' + poKolika + ' = ' + skupin + ' skupiny po ' + poKolika, 13, 'text', 'middle')
        + t(W / 2, dno + 38, 'zbytek ' + zbytek + ' (červená)', 13, 'red', 'middle'));
    },
    /* Trojúhelník s popsanými stranami a součtem obvodu nad ním. */
    trojuhelnik(a1, b1, c1) {
      return svg(250, 130, 'Trojúhelník se stranami ' + a1 + ', ' + b1 + ' a ' + c1 + ' centimetrů',
        '<polygon points="30,100 220,100 90,22" fill="none" stroke="var(--blue)" stroke-width="2.5"/>'
        + t(125, 118, c1 + ' cm', 14, 'gold', 'middle')
        + t(46, 58, a1 + ' cm', 14, 'gold', 'end')
        + t(170, 52, b1 + ' cm', 14, 'gold')
        + t(125, 14, 'o = ' + a1 + ' + ' + b1 + ' + ' + c1 + ' = ' + (a1 + b1 + c1) + ' cm', 12, 'text', 'middle'));
    },

    /* Čtverec vedle obdélníku — vedle sebe schválně, ať je vidět,
       že čtverec je zvláštní případ obdélníku, ne jiný svět. */
    ctverecObdelnik(strana, sirka, vyska) {
      return svg(260, 120, 'Čtverec se stranou ' + strana + ' cm a obdélník ' + sirka + ' krát ' + vyska + ' cm',
        '<rect x="14" y="20" width="76" height="76" fill="none" stroke="var(--blue)" stroke-width="2.5"/>'
        + t(52, 112, strana + ' cm', 13, 'gold', 'middle')
        + t(52, 14, 'o = 4 · ' + strana + ' = ' + (4 * strana), 11, 'text', 'middle')
        + '<rect x="140" y="34" width="106" height="62" fill="none" stroke="var(--blue)" stroke-width="2.5"/>'
        + t(193, 112, sirka + ' cm', 13, 'gold', 'middle')
        + t(252, 68, vyska, 13, 'gold')
        + t(193, 26, 'o = 2 · (' + sirka + ' + ' + vyska + ') = ' + (2 * (sirka + vyska)), 11, 'text', 'middle'));
    },

    /* Žebřík jednotek. Krok se vypisuje mezi rámečky, ne jen v textu pod obrázkem —
       převod je právě ten krok. */
    zebrik(jednotky, krok, popisek, popis) {
      const n = jednotky.length;
      // Krok smí být i POLE — 4. ročník má km → m ×1000, ale zbytek ×10.
      // Jedno číslo pro všechny stupně by dítěti tvrdilo, že kilometr je
      // deset metrů.
      const kroky = Array.isArray(krok) ? krok : new Array(n - 1).fill(krok);
      // Plátno roste s počtem jednotek. Natlačit pět rámečků do 280 px nejde:
      // popisek „×1000 →" je širší než mezera, která by na něj zbyla.
      const W = 24 + 52 * n + 16 * (n - 1);
      let telo = '';
      for (let i = 0; i < n; i++) {
        telo += ramec(10 + i * 68, 30, 52, 34, 'blue', 2, 6);
        telo += t(36 + i * 68, 52, jednotky[i], 15, 'gold', 'middle');
      }
      for (let i = 0; i < n - 1; i++) telo += t(70 + i * 68, 24, '×' + kroky[i] + ' →', 12, 'green', 'middle');
      const jednotny = kroky.every(k => k === kroky[0]);
      telo += t(W / 2, 86, popisek
        || (jednotny ? 'doprava násob ' + kroky[0] + ', doleva děl ' + kroky[0]
                     : 'doprava násob, doleva děl — kroky nejsou stejné'), 12, 'text', 'middle');
      return svg(W, 96, popis || ('Žebřík jednotek ' + jednotky.join(' ')), telo);
    },
    /* Ciferník + převodní vztahy vedle něj. Ručičky se zadávají DÉLKOU a ÚHLEM,
       ne koncovými body — jinak se při změně času musí přepočítávat ručně.
       Hodinová je kratší a silnější, minutová delší a tenčí; na tom celé čtení
       ciferníku stojí, takže to nesmí být na dva pixely. */
    hodiny(h, min, vztahy, popis) {
      const cx = 60, cy = 60;
      const rucicka = (delka, uhlStupne, barva, sirka) => {
        const r = (uhlStupne - 90) * Math.PI / 180;
        return line(cx, cy, +(cx + delka * Math.cos(r)).toFixed(1),
          +(cy + delka * Math.sin(r)).toFixed(1), barva, sirka);
      };
      const uhelH = (h % 12) * 30 + min * 0.5;   // hodinová se posouvá i s minutami
      const uhelM = min * 6;
      let telo = '<circle cx="60" cy="60" r="46" fill="none" stroke="var(--blue)" stroke-width="2.5"/>'
        + t(60, 31, 12, 13, 'text', 'middle')
        + t(94, 65, 3, 13, 'text', 'middle')
        + t(60, 99, 6, 13, 'text', 'middle')
        + t(26, 65, 9, 13, 'text', 'middle')
        + rucicka(26, uhelH, 'green', 2.5)
        + rucicka(36, uhelM, 'gold', 2.5)
        + '<circle cx="60" cy="60" r="4" fill="var(--gold)"/>';
      (vztahy || []).forEach((v, i) => { telo += t(180, 42 + i * 24, v, 13, 'text', 'middle'); });
      return svg(250, 120, popis || ('Ciferník ukazující ' + h + ':' + String(min).padStart(2, '0')), telo);
    },

    /* Obsah jako POKRYTÍ ČTVEREČKY, ne jako vzorec. Nadpis mise 5-2 ve 4. ročníku
       to říká doslova („Obsah = počet čtverečků uvnitř"), tak ať to dítě vidí:
       a řad po b čtverečcích. Vzorec S = a × b si z toho odvodí samo. */
    ctverecky(a1, b1, popis) {
      const c = 20, x0 = 44, y0 = 22;
      let telo = '';
      for (let r = 0; r < b1; r++)
        for (let k = 0; k < a1; k++)
          telo += ramec(x0 + k * c, y0 + r * c, c, c, 'blue', 1);
      const W = x0 + a1 * c + 20, dno = y0 + b1 * c;
      telo += t(x0 + a1 * c / 2, dno + 18, a1 + ' cm', 13, 'gold', 'middle')
        + t(x0 - 8, y0 + b1 * c / 2 + 4, b1 + ' cm', 13, 'gold', 'end')
        + t(W / 2, 14, 'S = ' + a1 + ' × ' + b1 + ' = ' + (a1 * b1) + ' cm²', 13, 'text', 'middle')
        + t(W / 2, dno + 36, a1 * b1 + ' čtverečků uvnitř', 12, 'green', 'middle');
      return svg(W, dno + 44, popis || ('Obdélník ' + a1 + ' krát ' + b1 + ' pokrytý čtverečky, obsah ' + (a1 * b1) + ' čtverečních centimetrů'), telo);
    },

    /* Násobení desítkami: napřed součin bez nul, teprve pak se nuly PŘIPÍŠOU.
       Nuly jsou v druhém řádku zvlášť orámované, aby bylo vidět, že se
       nepočítají — jen se přidají. */
    nasobeniRadu(a1, b1, popis) {
      const nul = String(b1).length - String(b1).replace(/0+$/, '').length;
      const zaklad = b1 / Math.pow(10, nul);
      const bezNul = a1 * zaklad, vysledek = a1 * b1;
      const W = 280;
      // Druhý řádek se skládá z DVOU kusů vedle sebe (výsledek + orámované nuly),
      // takže se jeho šířka musí spočítat, ne odhadnout. Napevno posazené
      // souřadnice tu narážely textem do rámečku.
      const ADV = 0.6;                     // monospace: šířka znaku ≈ 0,6 em
      const sirkaTxt = (txt, fs) => txt.length * fs * ADV;
      const zapis = String(bezNul), nuly = '0'.repeat(nul);
      const levy = a1 + ' × ' + b1 + ' = ' + zapis;
      const wLevy = sirkaTxt(levy, 17), wNuly = sirkaTxt(nuly, 17);
      const xLevy = (W - (wLevy + 6 + wNuly + 12)) / 2;
      const xBox = xLevy + wLevy + 6;
      let telo = t(W / 2, 22, a1 + ' × ' + zaklad + ' = ' + bezNul, 17, 'gold', 'middle')
        + t(W / 2, 42, 'nejdřív bez nul', 11, 'muted', 'middle')
        + line(40, 54, 240, 54, 'muted', 1, '4 3');
      // Bez koncových nul nemá rámeček co orámovat — pak se nekreslí vůbec,
      // místo prázdného rámečku a hlášky „0 nuly se připíšou".
      // Skloňování: 1 nula · 2–4 nuly · 5+ nul. Napsané ručně, protože strojové
      // skloňování číslovek je v tomhle repozitáři doložený zdroj chyb.
      const hlaska = nul === 0 ? 'tady se žádná nula nepřipisuje'
        : nul === 1 ? 'jedna nula se připíše'
        : nul < 5 ? nul + ' nuly se připíšou'
        : nul + ' nul se připíše';
      telo += t(xLevy, 80, levy, 17, 'text')
        + (nul ? ramec(xBox, 62, wNuly + 12, 26, 'green', 2, 4)
               + t(xBox + (wNuly + 12) / 2, 81, nuly, 17, 'green', 'middle') : '')
        + t(W / 2, 106, hlaska, 12, 'green', 'middle');
      return svg(W, 116, popis || (a1 + ' krát ' + b1 + ' se počítá jako ' + a1 + ' krát ' + zaklad + ', k výsledku se připíšou nuly'), telo);
    },

    /* Souřadnicová síť. Přerušované čáry k osám ukazují, ŽE se čte nejdřív
       doprava a pak nahoru — na pořadí souřadnic mise 5-3 přímo stojí. */
    sit(x1, y1, popisB, popis) {
      // Mřížka se roztáhne tak, aby se do ní bod vešel. Napevno šest políček
      // by u většího bodu znamenalo, že leží mimo síť.
      const c = 26, x0 = 30, y0 = 16, n = Math.max(6, x1, y1);
      let telo = '';
      for (let i = 0; i <= n; i++) {
        telo += line(x0 + i * c, y0, x0 + i * c, y0 + n * c, 'muted', 1);
        telo += line(x0, y0 + i * c, x0 + n * c, y0 + i * c, 'muted', 1);
      }
      const px = x0 + x1 * c, py = y0 + (n - y1) * c;
      telo += line(x0, y0 + n * c, x0 + n * c, y0 + n * c, 'blue', 2)
        + line(x0, y0, x0, y0 + n * c, 'blue', 2)
        + line(x0, py, px, py, 'red', 1.5, '4 3')
        + line(px, y0 + n * c, px, py, 'red', 1.5, '4 3')
        + kruh(px, py, 5, 'gold')
        + t(px + 9, py - 6, 'B[' + x1 + '; ' + y1 + ']', 13, 'gold')
        + t(px, y0 + n * c + 16, x1, 12, 'red', 'middle')
        + t(x0 - 8, py + 4, y1, 12, 'red', 'end')
        + t(x0 + n * c / 2, y0 + n * c + 34, popisB || 'nejdřív doprava, pak nahoru', 12, 'text', 'middle');
      return svg(x0 + n * c + 60, y0 + n * c + 42,
        popis || ('Souřadnicová síť s bodem B na souřadnicích ' + x1 + ' a ' + y1), telo);
    },

    /* Velká čísla se čtou PO TROJICÍCH — to je celé učivo mise 7-1, a jedna
       cifra na sloupec (rady) ho neukáže. Každá trojice má svoje jméno. */
    trojice(cislo, popis) {
      const c = String(cislo).replace(/\s/g, '');
      const sk = [];
      for (let i = c.length; i > 0; i -= 3) sk.unshift(c.slice(Math.max(0, i - 3), i));
      const JMENA = ['jednotky', 'tisíce', 'miliony', 'miliardy'];
      const bw = 76, mezera = 16, x0 = 12;
      const W = x0 * 2 + sk.length * bw + (sk.length - 1) * mezera;
      let telo = '';
      sk.forEach((g, i) => {
        const x = x0 + i * (bw + mezera);
        telo += ramec(x, 24, bw, 44, 'blue', 2, 6)
          + t(x + bw / 2, 55, g, 26, 'gold', 'middle')
          + t(x + bw / 2, 84, JMENA[sk.length - 1 - i] || '', 12, 'text', 'middle');
        if (i < sk.length - 1) telo += t(x + bw + mezera / 2, 52, '·', 20, 'muted', 'middle');
      });
      telo += t(W / 2, 16, 'mezera po každých třech cifrách zprava', 11, 'muted', 'middle')
        + t(W / 2, 104, 'čti po trojicích, ne cifru po cifře', 12, 'green', 'middle');
      return svg(W, 114, popis || ('Číslo ' + cislo + ' rozdělené na trojice cifer'), telo);
    },

    /* České mince a bankovky. Hodnoty jsou parametr, ale výchozí je skutečná
       česká řada — autenticita před obecností (viz CLAUDE.md). */
    penize(mince, bankovky, popisek, popis) {
      const m = mince || [1, 2, 5, 10, 20, 50];
      const b = bankovky || [100, 200, 500, 1000];
      // 4. ročník vypisuje ŠEST bankovek (až 5 000 Kč), trojka čtyři — plátno
      // se proto řídí tím, co je delší. Napevno 280 by pátou a šestou uřízlo,
      // a to potichu: obsah mimo viewBox se prostě nenakreslí.
      const W = Math.max(60 + 44 * (m.length - 1), 82 + 66 * (b.length - 1));
      let telo = '';
      m.forEach((v, i) => {
        const cx = 28 + i * 44;
        telo += '<circle cx="' + cx + '" cy="30" r="18" fill="none" stroke="var(--gold)" stroke-width="2"/>'
          + t(cx, 35, v, 12, 'gold', 'middle');
      });
      b.forEach((v, i) => {
        const x = 14 + i * 66;
        telo += '<rect x="' + x + '" y="62" width="54" height="28" rx="4" fill="none" stroke="var(--green)" stroke-width="2"/>'
          + t(x + 27, 81, v, 12, 'green', 'middle');
      });
      telo += t(W / 2, 108, popisek || 'mince nahoře · bankovky dole (v Kč)', 12, 'text', 'middle');
      return svg(W, 116, popis || 'České mince a bankovky', telo);
    }
  };

  /* Popisek pro čtečku je PARAMETR, ne strojová čeština. První pokus ho skládal
     z číslovek a hned vyrobil „7 desítky" a „do třech skupin" — skloňování číslovek
     je v tomhle repozitáři doložený zdroj chyb (viz rpg-declension-all.test.cjs).
     Diagram kreslí modul, text k němu píše člověk v modulu výkladu. */

  window.RPGDia = API;
})();
