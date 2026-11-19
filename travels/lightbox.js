/* ══════════════════════════════════════════════════════════════════════
   Přepínání fotek ve zvětšeném zobrazení.

   Každý zápisek má vlastní prohlížeč fotky (`#lb`), ale zapojený je ve
   TŘECH různých tvarech, jak jednotlivé stránky postupně vznikaly:

     ukraine, cr-bh          `figure.shot > div.img > img` (do 26. 10. 2026 background-image)
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
    var vnitrni = el.querySelector && el.querySelector('img');   // ukraine, cr-bh: <div class="img"><img loading="lazy"></div>
    if (vnitrni) return uplna(vnitrni.getAttribute('src'));
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

  /* ── klávesnice a čtečka obrazovky ───────────────────────────────────
     Naměřeno 18. 11. 2026 (Tab + Enter na skutečné klávesnici, 8 zápisků):
     fotky měly obsluhu JEN na kliknutí myší — `<img>` ani `div.img` nejdou
     fokusovat, takže 1 451 fotek v sedmi zápiscích (všechny kromě Rumunska,
     kde je obaluje odkaz) nešlo otevřít klávesnicí ani čtečkou; 1 055
     fotek ve čtyřech zápiscích (Jugoslávie, Španělsko a Francie, Itálie,
     Baltik) navíc nemělo žádné jméno. Oprava je tady, na jednom místě, ne
     v osmi stránkách: stránky si dál obsluhují kliknutí samy, modul jen
     udělá z prvku, který tu obsluhu nese, tlačítko (`tabindex`, `role`,
     jméno, Enter a mezerník = `click()`), seskupí fotky podle dne a
     prohlížeč fotky udělá dialogem (fokus dovnitř, Tab se v něm točí,
     po zavření fokus zpátky na fotku). Žádný popisek se nevymýšlí: jméno
     je číslo fotky a nadpis dne, který na stránce stojí, nebo `alt`, který
     fotka už má (Kosovo). */
  function text(el) { return (el.textContent || '').replace(/\s+/g, ' ').replace(/^\/\/\s*/, '').trim(); }

  function nadpisSkupiny(g) {
    for (var s = g.previousElementSibling; s; s = s.previousElementSibling) {
      if (s.classList.contains('day-heading')) return text(s);
      if (s.classList.contains('gallery') || s.classList.contains('gallery-grid')) break;   // nadpis patří jiné skupině
    }
    return '';
  }

  var popisy = Object.create(null);   // adresa fotky → popis pro čtečku (použije se u zvětšené fotky)
  var skupiny = document.querySelectorAll('.gallery, .gallery-grid');
  for (var gi = 0; gi < skupiny.length; gi++) {
    var g = skupiny[gi];
    var nadpis = nadpisSkupiny(g);
    if (nadpis) { g.setAttribute('role', 'group'); g.setAttribute('aria-label', nadpis); }
    var kandidati = g.querySelectorAll('.shot .img, img, a');
    var cile = [];
    for (var ki = 0; ki < kandidati.length; ki++) {
      var k = kandidati[ki];
      /* odkaz (Rumunsko) už fokus i jméno má; jen ho označíme jako fotku a zapamatujeme popis pro zvětšení */
      if (k.tagName === 'A') {
        k.setAttribute('data-lb-foto', '');
        var jm = (k.getAttribute('aria-label') || '').replace(/^Open photo /, '').trim();
        if (jm) popisy[adresa(k)] = jm;
        continue;
      }
      /* `<img>` uvnitř `.shot` nebo odkazu patří svému obalu (ten nese obsluhu, resp. už je odkaz se jménem) */
      if (k.tagName === 'IMG' && k.closest('.shot, a')) continue;
      cile.push(k);
    }
    for (var ci = 0; ci < cile.length; ci++) {
      var c = cile[ci];
      var vnitrni = c.tagName === 'IMG' ? c : c.querySelector('img');
      var alt = vnitrni ? (vnitrni.getAttribute('alt') || '').trim() : '';
      var popisFotky = alt || nadpis;
      if (!c.getAttribute('aria-label')) {
        c.setAttribute('aria-label', 'Open photo ' + (ci + 1) + ' of ' + cile.length + (popisFotky ? ' — ' + popisFotky : ''));
      }
      c.setAttribute('role', 'button');
      c.setAttribute('tabindex', '0');
      c.setAttribute('data-lb-foto', '');
      if (popisFotky) popisy[adresa(c)] = popisFotky + ' (' + (ci + 1) + '/' + cile.length + ')';
    }
  }

  var zav = document.getElementById('lb-close');
  if (zav) {
    zav.setAttribute('role', 'button'); zav.setAttribute('tabindex', '0'); zav.setAttribute('aria-label', 'Close photo');
  }
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
  lb.setAttribute('tabindex', '-1');
  pocet.setAttribute('aria-live', 'polite');

  var styl2 = document.createElement('style');
  styl2.textContent =
    '[data-lb-foto]:focus-visible{outline:2px solid #fff;outline-offset:3px;box-shadow:0 0 0 5px #000;position:relative;z-index:2}' +
    '#lb:focus{outline:none}#lb-close:focus-visible{outline:2px solid #fff;outline-offset:4px}';
  document.head.appendChild(styl2);

  /* alt zvětšené fotky = popis jejího dne a číslo; stránky mají `alt=""` */
  var puvodniSync = sync;
  sync = function () { puvodniSync(); img.alt = (idx >= 0 && popisy[zdroje[idx]]) || ''; };

  var opener = null, bylo = false;
  new MutationObserver(function () {
    var ted = lb.classList.contains('open');
    if (ted && !bylo) {
      var a = document.activeElement;
      opener = a && a.hasAttribute && a.hasAttribute('data-lb-foto') ? a : null;
      lb.focus({ preventScroll: true });
    } else if (!ted && bylo) {
      if (opener && document.documentElement.contains(opener)) opener.focus({ preventScroll: true });
      opener = null;
    }
    bylo = ted;
  }).observe(lb, { attributes: true, attributeFilter: ['class'] });
  bylo = lb.classList.contains('open');

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var otevreno = lb.classList.contains('open');
    if ((e.key === 'Enter' || e.key === ' ') && t && t.hasAttribute &&
        (t.hasAttribute('data-lb-foto') || (zav && t === zav))) {
      e.preventDefault();
      t.click();
      return;
    }
    if (e.key === 'Tab' && otevreno) {          // fokus zůstává v dialogu
      var l = [zav, bPrev, bNext].filter(Boolean);
      var i = l.indexOf(document.activeElement);
      if (i < 0) { e.preventDefault(); l[e.shiftKey ? l.length - 1 : 0].focus(); }
      else if (e.shiftKey && i === 0) { e.preventDefault(); l[l.length - 1].focus(); }
      else if (!e.shiftKey && i === l.length - 1) { e.preventDefault(); l[0].focus(); }
    }
  });
})();
