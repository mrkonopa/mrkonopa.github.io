/* ══════════════════════════════════════════════════════════════════════
   Přepínání fotek ve zvětšeném zobrazení.

   Každý zápisek má vlastní prohlížeč fotky (`#lb`), ale zapojený je ve
   TŘECH různých tvarech, jak jednotlivé stránky postupně vznikaly:

     ukraine, cr-bh          `figure.shot > div.img` s background-image
     romania                 `.gallery a[href]` (odkaz obaluje náhled)
     italy, yugoslavia, sf   `.gallery-grid img[src]`

   Psát přepínání šestkrát znovu by přesně zopakovalo vzorec, na který
   tenhle repozitář opakovaně doplácí (viz CLAUDE.md — „dvě kresby téže
   postavy se rozejdou a nikde to nespadne"). Tenhle modul proto stávající
   prohlížeč jen DOPLNÍ: posbírá fotky ve všech třech tvarech, obalí
   `#lb-img` plochou se dvěma polovinami a převezme `openLb`, aby věděl,
   u které fotky zrovna je.

   Na stránku stačí `<script src="lightbox.js" defer></script>`; nic
   dalšího se needituje. `defer` je podstatný: vlastní skript stránky
   běží při parsování, tedy DŘÍV, takže `openLb` už existuje a jde
   převzít. Bez modulu (nebo když se nenačte) funguje prohlížeč fotky
   přesně jako dosud, jen bez přepínání.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var lb = document.getElementById('lb');
  var img = document.getElementById('lb-img');
  if (!lb || !img) return;                    // stránka bez galerie

  /* ── sběr fotek v pořadí, v jakém jsou na stránce ────────────────────
     Dedupe podle ÚPLNÉ adresy: v romania obaluje `<a href>` tentýž
     soubor, jaký má `<img src>` uvnitř, takže by se každá fotka
     napočítala dvakrát a přepínání by na ní uvízlo. */
  function uplna(u) { try { return new URL(u, location.href).href; } catch (e) { return u || ''; } }

  function adresa(el) {
    if (el.tagName === 'IMG') return uplna(el.getAttribute('src'));
    if (el.tagName === 'A') return uplna(el.getAttribute('href'));
    var m = /url\((['"]?)(.+?)\1\)/.exec(el.style.backgroundImage || '');
    return m ? uplna(m[2]) : '';
  }

  var zdroje = [];
  var videno = Object.create(null);
  var uzly = document.querySelectorAll(
    '.gallery .shot .img, .gallery a, .gallery-grid img, .gallery-grid a'
  );
  for (var i = 0; i < uzly.length; i++) {
    var a = adresa(uzly[i]);
    if (!a || videno[a]) continue;
    videno[a] = true;
    zdroje.push(a);
  }
  if (zdroje.length < 2) return;              // jedna fotka se nemá kam přepnout

  /* ── plocha se dvěma polovinami ──────────────────────────────────────
     Poloviny jsou SKUTEČNÁ tlačítka, ne jen obsluha kliknutí na obrázku:
     mají přístupné jméno pro čtečku a jdou na ně šipky z klávesnice.
     Leží nad fotkou, takže kliknutí MIMO fotku dál zavírá prohlížeč —
     to chování stránky už měly a nemá se měnit. */
  var styl = document.createElement('style');
  styl.textContent =
    '#lb-stage{position:relative;display:flex;align-items:center;justify-content:center;max-width:90vw;max-height:90vh}' +
    '#lb-stage .lb-pul{position:absolute;top:0;bottom:0;width:50%;border:0;background:none;' +
    'display:flex;align-items:center;color:#fff;font:400 44px/1 system-ui,sans-serif;' +
    'opacity:.28;cursor:pointer;padding:0 14px;transition:opacity .15s;-webkit-tap-highlight-color:transparent}' +
    '#lb-stage .lb-pul:hover,#lb-stage .lb-pul:focus-visible{opacity:.95}' +
    '#lb-stage .lb-pul:focus-visible{outline:2px solid #fff;outline-offset:-4px}' +
    '#lb-prev{left:0;justify-content:flex-start}#lb-next{right:0;justify-content:flex-end}' +
    '#lb-count{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);color:#fff;opacity:.6;' +
    "font:400 13px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.08em;z-index:1001}" +
    /* Na dotyku nemá „hover" smysl a šipky by jen překážely přes fotku;
       plocha na přepínání zůstává, jen se nekreslí. */
    '@media (pointer:coarse){#lb-stage .lb-pul{opacity:0}}';
  document.head.appendChild(styl);

  var stage = document.createElement('div');
  stage.id = 'lb-stage';
  img.parentNode.insertBefore(stage, img);
  stage.appendChild(img);

  function tlacitko(id, znak, popis) {
    var b = document.createElement('button');
    b.id = id; b.className = 'lb-pul'; b.type = 'button';
    b.setAttribute('aria-label', popis);
    b.textContent = znak;
    stage.appendChild(b);
    return b;
  }
  var bPrev = tlacitko('lb-prev', '‹', 'Previous photo');
  var bNext = tlacitko('lb-next', '›', 'Next photo');

  var pocet = document.createElement('div');
  pocet.id = 'lb-count';
  lb.appendChild(pocet);

  /* ── stav ────────────────────────────────────────────────────────── */
  var idx = -1;

  function popis() {
    var otevreno = lb.classList.contains('open') && idx >= 0;
    pocet.textContent = otevreno ? (idx + 1) + ' / ' + zdroje.length : '';
  }

  function ukaz(n) {
    if (idx < 0) return;                          // ještě nevíme, kde jsme
    idx = (n + zdroje.length) % zdroje.length;    // dokola, ať se nedá zaseknout na kraji
    img.src = zdroje[idx];
    popis();
    // sousedy napřed, ať další fotka neprobliká
    [idx + 1, idx - 1].forEach(function (k) {
      var p = new Image(); p.src = zdroje[(k + zdroje.length) % zdroje.length];
    });
  }

  bPrev.addEventListener('click', function (e) { e.stopPropagation(); ukaz(idx - 1); });
  bNext.addEventListener('click', function (e) { e.stopPropagation(); ukaz(idx + 1); });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); ukaz(idx - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); ukaz(idx + 1); }
    /* Escape zavírá i odtud. Šest zápisků ze sedmi si ho obsluhuje samo,
       baltic-2023 ne — tedy přesně ten vzorec „sedm z osmi", na který
       tenhle web opakovaně doplácí. Odebrání třídy je nezávadné i tam,
       kde si ji stránka odebrala sama; nic jiného zavření nedělá
       (`closeLb` navíc jen maže `src`, což hlídá pozorovatel níž). */
    else if (e.key === 'Escape') lb.classList.remove('open');
  });

  /* ── kde zrovna jsme ─────────────────────────────────────────────────
     Původní verze přebírala `openLb`. Jenže **italy a yugoslavia žádné
     `openLb` nemají** — otevírají fotku přímo v obsluze kliknutí
     (`lbImg.src = img.src; lb.classList.add('open')`), takže se převzetí
     vůbec neuplatnilo: index zůstal -1, první kliknutí na „další" vedlo
     zpátky na fotku 0 a navenek to vypadalo, že přepínání nefunguje.
     Naměřeno, ne odhadnuto — proto se index nebere z toho, KDO otevřel,
     ale z toho, CO je zobrazené. Funguje to na všech třech tvarech
     galerie naráz a přežije to i změnu obsluhy na stránce. */
  function sync() {
    var n = zdroje.indexOf(uplna(img.getAttribute('src') || ''));
    if (n >= 0 && n !== idx) idx = n;
    popis();
  }
  new MutationObserver(sync).observe(img, { attributes: true, attributeFilter: ['src'] });
  new MutationObserver(function () { if (lb.classList.contains('open')) sync(); else popis(); })
    .observe(lb, { attributes: true, attributeFilter: ['class'] });
})();
