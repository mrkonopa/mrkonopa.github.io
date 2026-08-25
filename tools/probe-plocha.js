/* ════════════════════════════════════════════════════════════════════
   probe-plocha.js — sonda překreslené plochy pro běžící hru
   ────────────────────────────────────────────────────────────────────
   Vloží se do konzole nad otevřenou hrou (rpg-mat-3..9.html), nebo se
   načte přes <script> při ladění. NEPATŘÍ do produkce.

   Měří tři věci a všechny ve stejných jednotkách jako tabulka v zadání:

     PLOCHA   součet výplní za snímek / plocha plátna
              (fillRect a tahy ano; drawImage NE — upečené bitmapy jsou
              vedle jako „blitů", jinak by každý blit přidal celé 1,00 ×)
     VOLÁNÍ   kolik kreslicích příkazů za snímek
     PRÁCE    jak dlouho trvá TĚLO snímku, ne odstup snímků

   Poslední bod je ten podstatný. Odstup dvou snímků je zamčený na
   obnovovací frekvenci ⇒ 16,66 ms naměříš i na prázdné scéně a o zátěži
   to neříká nic. Sonda proto obaluje callback requestAnimationFrame a
   měří jeho vlastní dobu běhu — to je práce, kterou hra skutečně dělá,
   a to je číslo, které se dá porovnávat s rozpočtem.

   Použití:
     RPGProbe.start()        // sbírá
     RPGProbe.report()       // vypíše a nechá běžet
     RPGProbe.stop()         // vrátí originální funkce

   Pozn.: čísla čti až po ~3 s běhu a s otevřenou (aktivní) záložkou —
   na pozastavené kartě prohlížeč requestAnimationFrame uspí.
   ════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  const P2D = root.CanvasRenderingContext2D && root.CanvasRenderingContext2D.prototype;
  if (!P2D) { console.warn('[RPGProbe] Canvas 2D není k dispozici'); return; }

  const orig = {};
  let live = false;
  let f = null;                        // rozpracovaný snímek
  const frames = [];                   // hotové snímky
  const MAX = 240;

  function blank() { return { px: 0, fills: 0, blits: 0, ms: 0, area: 0, gap: 0 }; }
  let lastT = 0;                       // čas předchozího callbacku (jen vnější úroveň)

  /* Plátno arény poznáme podle toho, na které se kreslí nejvíc. Hra může
     mít víc pláten (HP bar, ikony), a poměr „× plátna" má smysl jen proti
     tomu, na kterém scéna běží. */
  const seenCanvas = new Map();
  function noteCanvas(cv, px) {
    if (!cv) return;
    seenCanvas.set(cv, (seenCanvas.get(cv) || 0) + px);
  }
  function mainCanvas() {
    let best = null, bestPx = -1;
    seenCanvas.forEach((px, cv) => { if (px > bestPx) { bestPx = px; best = cv; } });
    return best;
  }

  function wrap(name, fn) { orig[name] = P2D[name]; P2D[name] = fn; }

  function install() {
    wrap('fillRect', function (x, y, w, h) {
      if (f) { const a = Math.abs(w * h); f.px += a; f.fills++; noteCanvas(this.canvas, a); }
      return orig.fillRect.apply(this, arguments);
    });
    wrap('strokeRect', function (x, y, w, h) {
      if (f) { const lw = this.lineWidth || 1; f.px += 2 * (Math.abs(w) + Math.abs(h)) * lw; f.fills++; }
      return orig.strokeRect.apply(this, arguments);
    });
    wrap('drawImage', function () { if (f) f.blits++; return orig.drawImage.apply(this, arguments); });

    /* Tahy: plocha = délka cesty × šířka pera. U vodorovné linky přes
       plátno je to přesné, u šikmé mírně nadsazené. Cesta se sleduje
       jen tak hluboko, jak ji hry používají (moveTo/lineTo). */
    wrap('beginPath', function () { this.__pl = 0; this.__px = 0; this.__py = 0; return orig.beginPath.apply(this, arguments); });
    wrap('moveTo', function (x, y) { this.__px = x; this.__py = y; return orig.moveTo.apply(this, arguments); });
    wrap('lineTo', function (x, y) {
      this.__pl = (this.__pl || 0) + Math.hypot(x - (this.__px || 0), y - (this.__py || 0));
      this.__px = x; this.__py = y;
      return orig.lineTo.apply(this, arguments);
    });
    wrap('stroke', function () {
      if (f) { f.px += (this.__pl || 0) * (this.lineWidth || 1); f.fills++; }
      return orig.stroke.apply(this, arguments);
    });
    wrap('fill', function () { if (f) f.fills++; return orig.fill.apply(this, arguments); });

    /* Jádro čistí plátno na začátku snímku — bere se jako hranice snímku
       jen tehdy, když nic jiného nemáme; primární hranice je rAF callback. */
    orig.raf = root.requestAnimationFrame;
    root.requestAnimationFrame = function (cb) {
      return orig.raf.call(root, function (t) {
        const prev = f;
        f = blank();
        const t0 = performance.now();
        let out;
        try { out = cb(t); }
        finally {
          f.ms = performance.now() - t0;
          const cv = mainCanvas();
          f.area = cv ? cv.width * cv.height : 0;
          /* Odstup callbacků. Sám o sobě o zátěži neříká nic (zamčený na
             obnovovací frekvenci), ale jeho ROZDĚLENÍ říká to podstatné:
             odstup nad ~1,5 snímku = prohlížeč snímek zahodil. To je číslo,
             které dítě vidí jako sekání — ne milisekundy práce.
             Měří se jen na vnější úrovni (prev === null), aby vnořené rAF
             nevykazovaly nulové odstupy. */
          if (prev === null) {
            if (lastT) f.gap = t - lastT;
            lastT = t;
          }
          if (f.fills || f.blits) { frames.push(f); if (frames.length > MAX) frames.shift(); }
          f = prev;
        }
        return out;
      });
    };
  }

  function restore() {
    Object.keys(orig).forEach(k => { if (k !== 'raf') P2D[k] = orig[k]; });
    if (orig.raf) root.requestAnimationFrame = orig.raf;
  }

  function stats(arr) {
    if (!arr.length) return null;
    const s = arr.slice().sort((a, b) => a - b);
    const sum = s.reduce((a, b) => a + b, 0);
    return { avg: sum / s.length, med: s[(s.length / 2) | 0], max: s[s.length - 1] };
  }

  const API = {
    start() {
      if (live) return console.log('[RPGProbe] už běží');
      frames.length = 0; seenCanvas.clear(); lastT = 0; install(); live = true;
      console.log('[RPGProbe] sbírám — nech to ~3 s běžet, pak RPGProbe.report()');
    },
    stop() { if (!live) return; restore(); live = false; console.log('[RPGProbe] konec'); },
    report() {
      if (!frames.length) return console.log('[RPGProbe] žádné snímky — běží hra? je záložka aktivní?');
      const area = frames[frames.length - 1].area || 1;
      const px = stats(frames.map(x => x.px));
      const fills = stats(frames.map(x => x.fills));
      const blits = stats(frames.map(x => x.blits));
      const ms = stats(frames.map(x => x.ms));
      const pad = (s, n) => String(s).padStart(n);

      /* Zahozené snímky. Referenční odstup se bere z MEDIÁNU naměřených
         odstupů, ne z pevných 16,66 — Chromebook může jít na 48 nebo 50 Hz
         a proti pevné hodnotě by pak „zahazoval“ pořád. */
      const gaps = frames.map(x => x.gap).filter(g => g > 0);
      const gs = stats(gaps);
      const base = gs ? gs.med : 16.66;
      const dropped = gaps.filter(g => g > base * 1.5).length;
      const dropPct = gaps.length ? (100 * dropped / gaps.length) : 0;
      const hz = base ? Math.round(1000 / base) : 0;
      const txt =
        '\n[RPGProbe] ' + frames.length + ' snímků · plátno ' + area.toLocaleString('cs-CZ') + ' px\n' +
        '  PLOCHA   ' + pad(Math.round(px.med).toLocaleString('cs-CZ'), 9) + ' px  = ' +
          (px.med / area).toFixed(2) + ' × plátna   (max ' + (px.max / area).toFixed(2) + ' ×)\n' +
        '  VÝPLNÍ   ' + pad(Math.round(fills.med), 9) + '     (max ' + fills.max + ')\n' +
        '  BLITŮ    ' + pad(Math.round(blits.med), 9) + '\n' +
        '  PRÁCE    ' + pad(ms.med.toFixed(3), 9) + ' ms  ⌀ ' + ms.avg.toFixed(3) +
          ' · max ' + ms.max.toFixed(3) + '  ⇒ vejde se ' + Math.round(16.66 / Math.max(ms.med, 0.001)) + ' ×\n' +
        '  SNÍMKY   ' + pad(hz, 9) + ' Hz   odstup ⌒ ' + (gs ? gs.med.toFixed(1) : '—') +
          ' ms · max ' + (gs ? gs.max.toFixed(1) : '—') + '\n' +
        '  ZAHOZENO ' + pad(dropPct.toFixed(1) + ' %', 9) + '     (' + dropped + ' z ' + gaps.length + ')\n' +
        '  (PRÁCE je doba běhu callbacku rAF. Sama o sobě je jen část odpovědi —\n' +
        '   rozhoduje ZAHOZENO: kolik snímků prohlížeč nestihl. Na výkonném\n' +
        '   stroji bude 0 % i při vyšší práci; na tabletu je to číslo,\n' +
        '   podle kterého se optimalizace rozhoduje.)\n';
      console.log(txt);
      API._txt = txt;
      return { px: px, fills: fills, blits: blits, ms: ms, area: area, text: txt,
               frames: frames.length, hz: hz, gap: gs, droppedPct: dropPct };
    },
    /* ── výpis NA OBRAZOVKU ───────────────────────────────────
       Na tabletu se konzole neotevře (iPad Safari ji bez Macu nemá vůbec,
       Android Chrome jen přes USB ladění), takže by tam byla sonda k ničemu.
       `show()` vysype týž text do panelu přes stránku. */
    show() {
      if (!API._txt) API.report();
      const t = API._txt;
      if (!t) return;
      let box = document.getElementById('rpgprobe-out');
      if (!box) {
        box = document.createElement('pre');
        box.id = 'rpgprobe-out';
        box.style.cssText = 'position:fixed;left:8px;right:8px;top:8px;z-index:99999;' +
          'background:#0b0f1aee;color:#d8e4ff;border:2px solid #4dc8ff;border-radius:8px;' +
          'padding:12px;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;' +
          'white-space:pre-wrap;max-height:70vh;overflow:auto;user-select:text';
        box.addEventListener('click', function () { box.remove(); });
        document.body.appendChild(box);
      }
      box.textContent = t + '\n(klepnutím zavřeš)';
      return t;
    },

    /* Celé měření jedním voláním — pro bookmarklet na tabletu.
       Sebere `sec` sekund a výsledek rovnou ukáže na obrazovce. */
    run(sec) {
      const s2 = Math.max(2, +sec || 5);
      API.start();
      setTimeout(function () { API.report(); API.stop(); API.show(); }, s2 * 1000);
      return 'měřím ' + s2 + ' s…';
    },

    /* Vrátí surová data, ať se dá tabulka poskládat skriptem přes 7 her. */
    raw() { return frames.slice(); }
  };

  root.RPGProbe = API;
  console.log('[RPGProbe] připraveno — RPGProbe.start()');
})(typeof window !== 'undefined' ? window : globalThis);
