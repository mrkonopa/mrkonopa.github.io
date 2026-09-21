/* ══════════════════════════════════════════════════════════════════════
   Mapa trasy — společná pro všechny cestovatelské zápisky.

   PROČ VZNIKLA: každý zápisek měl vlastní ručně kreslenou mapu a rozešly
   se, jak se dalo čekat. Naměřeno před přepisem:

     ukraine-2017     5 bodů trasy   · jen úsečky mezi zastávkami
     cr-bh-2018       7 bodů         · jen úsečky
     romania-2019   101 bodů         · překryv popisků na 380 px
     yugoslavia      10 bodů         · jen úsečky
     spain-france   420 bodů         · „La Barranca" mimo plátno
     italy-2022     797 bodů         · 2× překryv, „FERRY GNV" přes 53 px
     baltic-2023    624 bodů         · 1× překryv

   Každá měla jiný viewBox (900×380 … 1060×270 … 700×600) a jiné velikosti
   písma (Itálie sama čtyři). Písmo bylo navíc v absolutních pixelech, takže
   se s mapou NEZMENŠOVALO — na mobilu se kresba smrskla, popisky zůstaly
   a začaly na sebe lézt. Proto Rumunsko kolidovalo jen na 380 px.

   🔴 A hlavně: mapy byly ZPLOŠTĚLÉ. Měly nezávislou škálu pro zeměpisnou
   šířku a délku a nikdo nezapočítal cos(šířky), takže Itálie vyšla jako
   placka (3,54×), Balt 1,82×. Data se dala zachránit — staré mapy jsou
   lineární projekcí skutečných souřadnic (ověřeno kotvami: Itálie 0–5 km,
   Balt 0,6 px proti KMZ z plánování), takže šly invertovat a promítnout
   znovu správně. Dělá to `tools/mapy/gen.py`.

   CO DĚLÁ TENHLE SOUBOR: dostane hotová data (podklad, trasa, zastávky)
   a jen je vykreslí — včetně UMÍSTĚNÍ POPISKŮ, které se počítá až tady,
   protože potřebuje skutečné rozměry vykresleného textu. Zkouší osm poloh
   kolem bodu ve třech vzdálenostech a vezme první, která se s ničím nepere
   a vejde se do plátna; když se nevejde nikam, posune popisek dovnitř.

   Data dodá stránka v `window.MAPA_TRASY`; bez nich se nic nekreslí a
   zápisek vypadá jako dřív (jen bez mapy), takže chybějící soubor nic
   neshodí.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.MAPA_TRASY;
  if (!D) return;
  var host = document.querySelector('.route-svg-wrap');
  if (!host) return;

  var NS = 'http://www.w3.org/2000/svg';
  /* VELIKOST PÍSMA se počítá z NAMĚŘENÉ šířky panelu, nezadává se pevně.

     Písmo je v jednotkách viewBoxu, takže se vykreslí tím větší, čím
     širší panel je. Dokud měly všechny mapy 420 px, stačila konstanta.
     Jakmile se šířka začala odvozovat z tvaru mapy (489 px Itálie až
     1024 px Ukrajina), přestala stačit: pevných 9,5 jednotky dalo na
     Ukrajině 32 px a popisky mapu úplně přebily.

     Opačný směr má ale taky mez — na mobilu je panel jen ~340 px a pod
     8 px se popisek nedá přečíst (hlídá `travels-mapy`). Cílová velikost
     proto s panelem mírně roste a je svázaná zdola i shora:
     340 px → 11 px · 615 px → 12,8 px · 1024 px → 15 px.

     Protože se velikost odvíjí od pixelů, MUSÍ se rozmístění přepočítat
     při změně velikosti okna — viz `rozmisti()` na konci souboru. */
  var PX_MIN = 11, PX_MAX = 15, PX_DELIC = 48, DRUHY_POMER = 0.84;
  var PISMO_HLAVNI, PISMO_DRUHE, ODSTUP = 1.2;

  function velikostPisma() {
    var sirkaPx = host.getBoundingClientRect().width || D.sirka;
    var cil = Math.max(PX_MIN, Math.min(PX_MAX, sirkaPx / PX_DELIC));
    PISMO_HLAVNI = cil * (D.sirka / sirkaPx);
    PISMO_DRUHE = PISMO_HLAVNI * DRUHY_POMER;
    return sirkaPx;
  }

  /* ŠÍŘKA PANELU se počítá z poměru stran na KONSTANTNÍ PLOCHU.

     Jediná pevná `max-width` pro všechny mapy nejde: poměry jdou od 0,40
     (Ukrajina, východozápadní koridor) po 2,51 (Itálie). Při společných
     420 px vycházelo Španělsko 420 × 415, tedy skoro čtverec ztracený
     v sekci široké 1024 px, kdežto Itálie 420 × 1052, pruh přes dvě
     obrazovky — rozdíl ploch 2,53×.

     Cílit na výšku taky nestačí: plochá Ukrajina by pak byla nízký proužek.
     Konstantní plocha dá každé mapě podobně velké okno bez ohledu na tvar
     (naměřený rozptyl 1,18×), a šířka z ní vyjde jako odmocnina — což CSS
     nespočítá, proto je to tady a ne ve stylu.

     Meze: dolní 460 px, ať se nic nezmenší proti původním 420; horní
     1100 px řeší jen extrém, ve skutečnosti dřív narazí `min(100%, …)`
     ve stylu, takže Ukrajina končí na šířce sekce. */
  var PLOCHA_CIL = 600000, SIRKA_MIN = 460, SIRKA_MAX = 1100;
  host.style.setProperty('--mapa-sirka', Math.round(Math.max(SIRKA_MIN,
    Math.min(SIRKA_MAX, Math.sqrt(PLOCHA_CIL * (D.sirka / D.vyska))))) + 'px');

  velikostPisma();

  function el(jmeno, atr, text) {
    var e = document.createElementNS(NS, jmeno);
    for (var k in atr) if (atr[k] !== null && atr[k] !== undefined) e.setAttribute(k, atr[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var svg = el('svg', {
    viewBox: '0 0 ' + D.sirka + ' ' + D.vyska,
    role: 'img',
    'aria-label': D.popis || 'Mapa trasy',
    preserveAspectRatio: 'xMidYMid meet',
  });

  /* Lem kolem textu dělá `paint-order: stroke fill` ve stylu, ne filtr.
     Původní mapy na to měly `feMorphology`, jenže filtr text RASTRUJE a
     rozmázne — Vojta to popsal jako „divné písmo, chtělo by to ostřejší".
     Obrys je ostrý, levnější a nepotřebuje `<defs>`. */

  /* ── podklad: pevnina ─────────────────────────────────────────────── */
  var zeme = el('g', { class: 'mapa-pevnina' });
  (D.podklad || []).forEach(function (d) {
    zeme.appendChild(el('path', { d: d }));
  });
  svg.appendChild(zeme);

  /* ── trasa ────────────────────────────────────────────────────────────
     Trasa je POLE úseků, ne jedna čára. Tam, kde se plulo, je v záznamu
     díra: export z mapy.cz je dopočítaná cesta, ne surový GPS záznam,
     takže mezi Palermem a Salernem protáhl plánovač silnici přes Messinu
     a mapa tvrdila, že se ze Sicílie jelo zpátky autem. Ten úsek se
     vyřízne a nahradí ho čárkovaný spoj níž. */
  (D.trasy || (D.trasa ? [D.trasa] : [])).forEach(function (body) {
    svg.appendChild(el('polyline', { class: 'mapa-trasa', points: body }));
  });

  /* Spoje mimo silnici (trajekt) — čárkovaně, aby bylo poznat, že se
     tenhle úsek nejel. */
  var Z = D.zastavky || [];
  var popisySpoju = [];
  (D.spoje || []).forEach(function (s) {
    var a = Z[s.z], b = Z[s.do];
    if (!a || !b) return;
    svg.appendChild(el('line', { class: 'mapa-spoj', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    if (s.popis) {
      var t = el('text', {
        class: 'mapa-spoj-popis', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 2,
        'text-anchor': 'middle', 'font-size': PISMO_DRUHE,
      }, s.popis);
      popisySpoju.push(t);
      svg.appendChild(t);
    }
  });

  /* ── zastávky ─────────────────────────────────────────────────────── */
  var body = el('g', { class: 'mapa-body' });
  Z.forEach(function (z) {
    body.appendChild(el('circle', {
      class: z.zacatek ? 'mapa-bod mapa-bod--start' : 'mapa-bod',
      cx: z.x, cy: z.y, r: z.zacatek ? 4 : 3,
    }));
  });
  svg.appendChild(body);

  /* ── popisky ──────────────────────────────────────────────────────────
     Umístění se POČÍTÁ z vykreslených rozměrů, ne odhaduje: do plátna se
     text vloží, změří (getBBox — bez `transform`, takže sedí), a když se
     někam nevejde, zkusí se další poloha. Kdyby se to řešilo odhadem
     šířky znaku, drhlo by to při jiném písmu. */
  var vrstva = el('g', { class: 'mapa-popisky' });
  svg.appendChild(vrstva);
  host.appendChild(svg);

  var POLOHY = [
    [1, 0, 'start'], [-1, 0, 'end'], [1, -1, 'start'], [-1, -1, 'end'],
    [1, 1, 'start'], [-1, 1, 'end'], [0, -1, 'middle'], [0, 1, 'middle'],
  ];
  /* Jak daleko od bodu se popisek smí odsunout, než se zkusí další směr.
     Původně jen [5, 10, 16]; u Kosova 2024 je na jihu jedenáct zastávek
     na malé ploše (Priština a Prekaz jsou 32 km = 13 jednotek od sebe)
     a 8 směrů × 3 vzdálenosti na ně nestačilo — popisky skončily na sobě.
     Delší kroky se zkusí AŽ když všechny bližší kolidují, takže popisek,
     který si dřív místo našel, zůstává na svém. Změnit se může jedině
     ten, který dřív nenašel nic a skončil naraženým na kraj plátna — a to
     je zlepšení. Ověřeno měřením: `travels-mapy` hlásí 0 překryvů na všech
     mapách i po téhle změně. */
  var VZDALENOSTI = [5, 10, 16, 24, 34, 46];
  var obsazeno = [];

  function kolize(a) {
    for (var i = 0; i < obsazeno.length; i++) {
      var b = obsazeno[i];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) return true;
    }
    return false;
  }
  /* Vnitřní okraj: popisek se nesmí dotknout kraje plátna. Bez něj skončí
     „CZ · LIBEREC" přesně na hraně a vypadá to useknutě, i když technicky
     uvnitř je. */
  var OKRAJ = 3;
  function venku(a) {
    return a.x < OKRAJ || a.y < OKRAJ ||
           a.x + a.w > D.sirka - OKRAJ || a.y + a.h > D.vyska - OKRAJ;
  }

  /* ROZMÍSTĚNÍ POPISKŮ — spouští se znovu při změně velikosti okna.

     Dřív stačilo jednou: písmo bylo pevné v jednotkách viewBoxu, takže
     výsledek platil při jakémkoli zvětšení. Teď se velikost odvíjí od
     naměřených pixelů (viz `velikostPisma`), a tím se rozmístění stalo
     závislým na šířce okna — při jiné šířce jsou popisky jinak velké
     a to, co se vešlo, se vejít nemusí. Proto se po změně okna počítá
     znovu. */
  function rozmisti() {
    var sirkaPx = velikostPisma();
    while (vrstva.firstChild) vrstva.removeChild(vrstva.firstChild);
    popisySpoju.forEach(function (t) { t.setAttribute('font-size', PISMO_DRUHE); });
    obsazeno = Z.map(function (z) {
      return { x: z.x - 4, y: z.y - 4, w: 8, h: 8 };   // samotné body
    });

    /* Nejdřív začátek trasy, pak shora dolů — ať mají přednost body,
       u kterých je místa nejmíň. */
    Z.map(function (z, i) { return { z: z, i: i }; })
      .sort(function (a, b) { return (b.z.zacatek - a.z.zacatek) || (a.z.y - b.z.y); })
      .forEach(function (p) {
        var z = p.z;
        if (!z.hlavni) return;
        var g = el('g', { class: z.zacatek ? 'mapa-popis mapa-popis--start' : 'mapa-popis' });
        var t1 = el('text', { 'font-size': PISMO_HLAVNI }, z.hlavni);
        g.appendChild(t1);
        var t2 = null;
        if (z.druhy) {
          t2 = el('text', { class: 'mapa-popis-druhy', 'font-size': PISMO_DRUHE }, z.druhy);
          g.appendChild(t2);
        }
        vrstva.appendChild(g);

        var nejlepsi = null;
        for (var v = 0; v < VZDALENOSTI.length && !nejlepsi; v++) {
          for (var i = 0; i < POLOHY.length && !nejlepsi; i++) {
            var sm = POLOHY[i], d = VZDALENOSTI[v];
            var x = z.x + sm[0] * d, y = z.y + sm[1] * d;
            t1.setAttribute('x', x); t1.setAttribute('y', y); t1.setAttribute('text-anchor', sm[2]);
            if (t2) {
              t2.setAttribute('x', x); t2.setAttribute('y', y + PISMO_HLAVNI * ODSTUP);
              t2.setAttribute('text-anchor', sm[2]);
            }
            var bb = g.getBBox();
            /* Rezerva kolem popisku: 0,8 jednotky sice stačilo na „žádný
               překryv", ale popisky na sebe pak vizuálně tlačí. 1,6 dá
               mezeru, která je vidět. */
            var ram = { x: bb.x - 1.6, y: bb.y - 1.6, w: bb.width + 3.2, h: bb.height + 3.2 };
            if (!venku(ram) && !kolize(ram)) nejlepsi = ram;
          }
        }
        if (!nejlepsi) {
          /* Nikam se nevešel. Poslední zkoušená poloha může trčet ven
             (stalo se u „valley of temples" dole pod Agrigentem), takže se
             popisek POSUNE zpátky do plátna — vyjít ven je horší než stát
             blíž jinému popisku. */
          var bb2 = g.getBBox();
          var dx = Math.min(0, D.sirka - OKRAJ - (bb2.x + bb2.width)) - Math.min(0, bb2.x - OKRAJ);
          var dy = Math.min(0, D.vyska - OKRAJ - (bb2.y + bb2.height)) - Math.min(0, bb2.y - OKRAJ);
          [t1, t2].forEach(function (t) {
            if (!t) return;
            t.setAttribute('x', +t.getAttribute('x') + dx);
            t.setAttribute('y', +t.getAttribute('y') + dy);
          });
          var bb3 = g.getBBox();
          nejlepsi = { x: bb3.x, y: bb3.y, w: bb3.width, h: bb3.height };
        }
        obsazeno.push(nejlepsi);

        /* Vodicí čára, když popisek utekl daleko od svého bodu. */
        var stred = { x: nejlepsi.x + nejlepsi.w / 2, y: nejlepsi.y + nejlepsi.h / 2 };
        if (Math.hypot(stred.x - z.x, stred.y - z.y) > 14) {
          vrstva.insertBefore(el('line', {
            class: 'mapa-vodic', x1: z.x, y1: z.y,
            x2: stred.x < z.x ? nejlepsi.x + nejlepsi.w : nejlepsi.x, y2: stred.y,
          }), vrstva.firstChild);
        }
      });

    return sirkaPx;
  }

  var posledni = rozmisti();
  var cekani;
  window.addEventListener('resize', function () {
    clearTimeout(cekani);
    cekani = setTimeout(function () {
      /* Přepočítávat při každém pixelu by bylo zbytečné; prahem 2 px se
         odfiltruje i schovávání adresního řádku na mobilu. */
      var teď = host.getBoundingClientRect().width;
      if (Math.abs(teď - posledni) > 2) posledni = rozmisti();
    }, 150);
  });
})();
