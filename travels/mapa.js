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
   kolem bodu ve dvou vzdálenostech a vezme první, která se s ničím nepere
   a vejde se do plátna.

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
  var PISMO_HLAVNI = 9.5, PISMO_DRUHE = 8, ODSTUP = 1.2;

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

  /* Světlý lem kolem textu, aby byl čitelný i přes pevninu. Tentýž
     postup měly původní mapy — jen ho teď mají všechny stejný. */
  var defs = el('defs');
  var f = el('filter', { id: 'mapa-lem', x: '-14%', y: '-30%', width: '128%', height: '160%' });
  f.appendChild(el('feMorphology', { in: 'SourceGraphic', operator: 'dilate', radius: '1.6', result: 'exp' }));
  f.appendChild(el('feFlood', { 'flood-color': 'var(--bg, #1c1c1c)', result: 'bg' }));
  f.appendChild(el('feComposite', { in: 'bg', in2: 'exp', operator: 'in', result: 'lem' }));
  var merge = el('feMerge');
  merge.appendChild(el('feMergeNode', { in: 'lem' }));
  merge.appendChild(el('feMergeNode', { in: 'SourceGraphic' }));
  f.appendChild(merge);
  defs.appendChild(f);
  svg.appendChild(defs);

  /* ── podklad: pevnina ─────────────────────────────────────────────── */
  var zeme = el('g', { class: 'mapa-pevnina' });
  (D.podklad || []).forEach(function (d) {
    zeme.appendChild(el('path', { d: d }));
  });
  svg.appendChild(zeme);

  /* ── trasa ────────────────────────────────────────────────────────── */
  if (D.trasa) svg.appendChild(el('polyline', { class: 'mapa-trasa', points: D.trasa }));

  /* Spoje mimo silnici (trajekt) — čárkovaně, aby bylo poznat, že se
     tenhle úsek nejel. */
  var Z = D.zastavky || [];
  (D.spoje || []).forEach(function (s) {
    var a = Z[s.z], b = Z[s.do];
    if (!a || !b) return;
    svg.appendChild(el('line', { class: 'mapa-spoj', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    if (s.popis) {
      var t = el('text', {
        class: 'mapa-spoj-popis', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 2,
        'text-anchor': 'middle', 'font-size': PISMO_DRUHE, filter: 'url(#mapa-lem)',
      }, s.popis);
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
  var VZDALENOSTI = [5, 10, 16];
  var obsazeno = Z.map(function (z) {
    return { x: z.x - 4, y: z.y - 4, w: 8, h: 8 };   // samotné body
  });

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

  /* Nejdřív začátek trasy, pak shora dolů — ať mají přednost body,
     u kterých je místa nejmíň. */
  Z.map(function (z, i) { return { z: z, i: i }; })
    .sort(function (a, b) { return (b.z.zacatek - a.z.zacatek) || (a.z.y - b.z.y); })
    .forEach(function (p) {
      var z = p.z;
      if (!z.hlavni) return;
      var g = el('g', { class: z.zacatek ? 'mapa-popis mapa-popis--start' : 'mapa-popis' });
      var t1 = el('text', { 'font-size': PISMO_HLAVNI, filter: 'url(#mapa-lem)' }, z.hlavni);
      g.appendChild(t1);
      var t2 = null;
      if (z.druhy) {
        t2 = el('text', { class: 'mapa-popis-druhy', 'font-size': PISMO_DRUHE, filter: 'url(#mapa-lem)' }, z.druhy);
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
})();
