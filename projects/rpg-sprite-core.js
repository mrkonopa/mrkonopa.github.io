/* ════════════════════════════════════════════════════════════════════
   rpg-sprite-core.js — sdílené jádro pixel-art bojové scény (fáze 02)
   ────────────────────────────────────────────────────────────────────
   Obsahuje VŠECHNO, co je napříč ročníky stejné: plátno, smyčka snímků,
   kreslení spritu, celočíselné škálování, rim light, kontaktní stín,
   časování úderu, systém efektů, rm() guard, strop částic.

   NEOBSAHUJE nic tématického. Mřížky, palety a pozadí dodává „popis
   světa" (world descriptor) — viz rpg-sprites-9.js.

   Použití v ročníkovém souboru (poslední řádek souboru):
     window.RPGSprites9 = RPGSpriteCore.create(WORLD9);

   Graceful: když se jádro nenačte, ročníkový soubor NIC nedefinuje
   (window.RPGSprites9 zůstane undefined) a hra spadne na emoji animace,
   jak to dělá dnes při nenačteném modulu. Žádná záložní kopie enginu.
   ════════════════════════════════════════════════════════════════════ */
window.RPGSpriteCore = (function () {
  'use strict';

  const VERSION = '1.0.0';
  const FRAME_MS = 130;      // přepínání snímků spritu
  const FX_CAP   = 48;       // Chromebook: strop všech částic naráz
  const SMOKE_CAP = 10;      // kouř je nejdražší (velké průhledné čtverce)

  /* ── časování úderu (ms od začátku akce) ──
     Držet tyhle hodnoty — jsou naladěné tak, aby úder „sedl". */
  const T = {
    WINDUP:    110,   // nápřah (hrdina se zakloní o 4 % vzdálenosti dozadu)
    IMPACT:    260,   // zásah — flash bosse, oblouk, boom
    HOLD:        2,   // zámraz: 2 snímky (~32 ms) se scéna vůbec neposune
    KB:          7,   // odhození bosse v px (pak exponenciální návrat 0.88/snímek ≈ 200 ms)
    FLASH:     130,   // jak dlouho boss svítí bíle
    SLASH:     540,   // celá délka výpadu (nápřah + zásah + dojezd)
    SHOOT:     320,
    CAST:      500,
    TELEGRAPH: 520,   // boss: blikající „!" před útokem
    PROJ:      480,   // let projektilu bosse
    HIT:       420    // jak dlouho drží hrdina pózu zásahu
  };

  const rm = () => document.documentElement.classList.contains('reduced-motion');

  /* ── barvy ── */
  function rgbOf(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function lum(hex) {
    const c = rgbOf(hex).map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
  function mixWhite(hex, t) {
    const [r, g, b] = rgbOf(hex), f = v => Math.round(v + (255 - v) * t);
    return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }
  /* Rim light musí být vidět i tam, kde má oblast tmavý neon.
     Práh 0.28 relativní luminance ⇒ proti pozadí arény (L ≤ 0.03) vždy ≥ 3.0 kontrast. */
  const RIM_MIN_L = 0.28;
  function rimColor(hex) {
    let t = 0, c = hex;
    while (lum(c) < RIM_MIN_L && t < 0.9) { t += 0.08; c = mixWhite(hex, t); }
    return c;
  }
  function rgbTriple(hex) { return rgbOf(hex).join(','); }

  /* deterministický seedovaný RNG → stejná oblast = stejné rozložení pozadí */
  function srnd(seed) {
    let s = (seed * 2654435761) >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* ════════════════════════════════════════════════════════════════
     create(world) → veřejné API jednoho ročníku
     ════════════════════════════════════════════════════════════════ */
  function create(world) {
    const AR = Object.assign({ h: 200, groundPad: 14, heroX: 0.12, bossX: 0.58 }, world.arena || {});
    const HS = world.hero, BS = world.bosses, AL = world.ally || null;
    const COMMON = BS.common || {};
    const AREAS = world.areas || {};
    /* Přepínač vzhledu. V README stojí, že rim light a kontaktní stín
       „svět nedostane, dokud se nevymění mřížky" — v dodaném jádru na to
       ale nebyl žádný prostředek: contactShadow() se volal bezpodmínečně
       a rim se aplikoval na každé K na osvětlené hraně. Bez toho nejde
       splnit slíbená NULOVÁ vizuální změna ve fázi 02.
       Výchozí je zapnuto, takže svět fáze 03 se chová přesně podle návrhu;
       svět fáze 02 si obojí vypne a vykreslí se jako starý engine. */
    const LOOK = Object.assign({ rim: true, shadow: true }, world.look || {});
    const AREA_MAX = Object.keys(AREAS).length || 7;

    let cv = null, ctx = null, raf = 0, lastT = 0, lastNow = 0, tick = 0, hold = 0;
    let bgc = null, bgx = null, bgKey = '';
    let curArea = 1, hiddenEmoji = null, activeSkin = null;

    const ST = {
      hero: { mode: 'idle', t: 0, hpFrac: 1 },
      boss: { mode: 'gone', t: 0, flash: 0, progress: 0, kb: 0 },
      fx: []
    };

    const rimCache = {};
    function areaRim(a) {
      if (!rimCache[a]) rimCache[a] = rimColor((AREAS[a] || {}).neon || '#ffffff');
      return rimCache[a];
    }
    function areaNeon(a) { return (AREAS[a] || AREAS[1] || {}).neon || '#ffffff'; }

    /* ── palety hrdiny (+ skiny z obchodu) ── */
    function heroPal() {
      const sk = HS.skins && HS.skins[activeSkin];
      return sk ? Object.assign({}, HS.pal, sk) : HS.pal;
    }
    function setSkin(key) { activeSkin = (HS.skins && HS.skins[key]) ? key : null; }

    /* ── plátno ── */
    function attach(topEl) {
      if (cv && cv.isConnected && cv.parentNode === topEl && ctx) return;
      // Osiřelé plátno (hra se překreslila / modul se načetl znovu) zahoď a začni znovu,
      // ať v aréně nezůstane černý čtverec, do kterého nikdo nekreslí.
      if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
      const old = topEl.querySelectorAll('#bt-arena');
      for (let i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      cv = document.createElement('canvas');
      cv.id = 'bt-arena';
      cv.style.cssText = 'display:block;width:100%;height:' + AR.h + 'px;image-rendering:pixelated;position:relative;z-index:2';
      const mon = document.getElementById('bt-mon');
      if (mon) { mon.style.display = 'none'; hiddenEmoji = mon; }
      const anchor = topEl.querySelector('.bt-mname');
      if (anchor) topEl.insertBefore(cv, anchor); else topEl.appendChild(cv);
      resize();
      ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      if (!raf) loop(performance.now());
    }
    function detach() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
      if (hiddenEmoji) { hiddenEmoji.style.display = ''; hiddenEmoji = null; }
      cv = null; ctx = null; bgc = null; bgx = null; bgKey = '';
      ST.fx.length = 0;
    }
    const active = () => !!(cv && cv.isConnected);

    function resize() {
      if (!cv) return;
      const w = cv.clientWidth || 600;
      cv.width = w; cv.height = AR.h;
      bgKey = '';                       // vynutí překreslení statického pozadí
    }

    /* ── kreslení spritu ──
       Znak '.' = průhledný. Znak 'O' = rim light (barvu NEURČUJE paleta,
       dodává ji jádro z neonu oblasti). Obrys 'K' se na horní a přivrácené
       hraně přebarví na rim — proto je silueta na tmavém pozadí vidět.
       Neznámý znak = magenta #f0f (záměrný signál chyby, hlídá test). */
    function isOpaque(g, r, c) { return !!(g[r] && g[r][c] && g[r][c] !== '.'); }
    /* Kolik řádků mřížky je SKUTEČNĚ pokreslených. Spodní prázdné řádky se
       nepočítají — jinak sprite „stojí" o ty řádky výš a stejně tak vysoko visel
       kontaktní stín i hrdina ve Věži legend. */
    const prMemo = new Map();
    function paintedRows(grid) {
      if (prMemo.has(grid)) return prMemo.get(grid);
      let e = 0;
      for (let r = grid.length - 1; r >= 0 && /^\.+$/.test(grid[r]); r--) e++;
      const n = grid.length - e;
      prMemo.set(grid, n);
      return n;
    }
    const HERO_PAINT = paintedRows(HS.grids.idle[0]);
    function onLitEdge(g, r, c, flip) {
      return !isOpaque(g, r - 1, c) || !isOpaque(g, r, flip ? c + 1 : c - 1);
    }
    function drawSprite(g, grid, pal, x, y, sc, flip, flash, rim) {
      for (let r = 0; r < grid.length; r++) {
        const row = grid[r];
        for (let c = 0; c < row.length; c++) {
          const ch = row[c];
          if (ch === '.') continue;
          let col;
          if (flash) col = '#ffffff';
          else if (ch === 'O') col = rim;
          else if (ch === 'K' && rim && onLitEdge(grid, r, c, flip)) col = rim;
          else col = pal[ch] || COMMON[ch] || '#f0f';
          g.fillStyle = col;
          const px = flip ? x + (row.length - 1 - c) * sc : x + c * sc;
          g.fillRect(px, y + r * sc, sc, sc);
        }
      }
    }

    /* ── kontaktní stín ──
       elipsa pod nohama; `lift` 0–1 = jak vysoko je sprite nad zemí
       (stín se zmenší a zesvětlí, aby bylo poznat odlepení). */
    function contactShadow(cx, feetY, wpx, sc, lift) {
      if (!LOOK.shadow) return;
      const l = Math.max(0, Math.min(1, lift || 0));
      ctx.save();
      ctx.globalAlpha = 0.40 - 0.18 * l;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(cx, feetY + Math.max(1, sc * 0.4),
        wpx * 0.27 * (1 - 0.4 * l), Math.max(2, sc * 0.9) * (1 - 0.3 * l), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* ── pozadí: statické vrstvy jednou do off-screen plátna ──
       Chromebook: v každém snímku se jen překlopí bitmapa a dokreslí
       ta hrstka pohyblivých vrstev. Žádné filtry, žádný blur. */
    function bgEnv(now) {
      const neon = areaNeon(curArea), t = rgbTriple(neon);
      return {
        w: cv.width, h: cv.height, area: curArea, neon: neon,
        horizon: Math.round(cv.height * (world.backdrop && world.backdrop.horizon || 0.46)),
        ground: AR.h - AR.groundPad,
        rgba: a => 'rgba(' + t + ',' + a + ')',
        rnd: srnd(curArea * 173 + 11),
        now: now || 0, animOK: !rm()
      };
    }
    function drawBackdrop(now) {
      const key = cv.width + 'x' + cv.height + '@' + curArea;
      if (key !== bgKey) {
        if (!bgc) bgc = document.createElement('canvas');
        bgc.width = cv.width; bgc.height = cv.height;
        bgx = bgc.getContext('2d');
        bgx.imageSmoothingEnabled = false;
        bgx.clearRect(0, 0, bgc.width, bgc.height);
        if (world.backdrop && world.backdrop.paintStatic) world.backdrop.paintStatic(bgx, bgEnv(0));
        bgKey = key;
      }
      ctx.drawImage(bgc, 0, 0);
      if (!rm() && world.backdrop && world.backdrop.paintAnim) world.backdrop.paintAnim(ctx, bgEnv(now));
    }

    /* ── pozice ── */
    function heroPos() {
      return { x: Math.round(cv.width * AR.heroX), y: (AR.h - AR.groundPad) - HERO_PAINT * HS.scale };
    }
    function bossGrids() { return BS.grids[curArea] || BS.grids[1]; }
    function bossPos() {
      const fr = bossGrids(), rows = fr[0].length, sc = BS.scale;
      /* Základna bosse je vlastní hodnota, ne odvozená od hrdinovy.
         Starý engine devítky měl hrdinu na `h - groundPad` a bosse na
         pevných 186 px — bez tohohle by se boss posunul o 2 px. */
      const pad = (typeof AR.bossPad === 'number') ? AR.bossPad : AR.groundPad + 2;
      return { x: Math.round(cv.width * AR.bossX), y: (AR.h - pad) - rows * sc, sc: sc, rows: rows, cols: fr[0][0].length };
    }
    function heroGrid() {
      const m = ST.hero.mode, G = HS.grids;
      if (m === 'windup') return G.windup || G.slash;
      if (m === 'slash') return G.slash;
      if (m === 'cast') return G.cast;
      if (m === 'shoot') return G.shoot;
      if (m === 'hit') return G.hit;
      return G.idle[rm() ? 0 : tick % G.idle.length];
    }

    /* ── efekty: strop, ať to na Chromebooku nezadrhne ── */
    function push(o) {
      if (ST.fx.length >= FX_CAP) return;
      if (o.kind === 'smoke') {
        let n = 0; for (let i = 0; i < ST.fx.length; i++) if (ST.fx[i].kind === 'smoke') n++;
        if (n >= SMOKE_CAP) return;
      }
      ST.fx.push(o);
    }
    function impact(f, rgb) {
      ST.boss.flash = T.FLASH; ST.boss.t = 0; ST.boss.kb = T.KB;
      hold = T.HOLD;
      push({ kind: 'boom', x: f.x1, y: f.y1, t: 0, rgb: rgb || (f.kind === 'orb' ? '25,230,230' : '244,208,63') });
    }

    /* ════════ render ════════ */
    function render(now) {
      if (!ctx) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      drawBackdrop(now);
      const hp = heroPos(), bp = bossPos();
      const bpal = Object.assign({}, COMMON, BS.pals[curArea] || BS.pals[1]);
      const rim = LOOK.rim ? areaRim(curArea) : null;
      const b = ST.boss, h = ST.hero;

      /* ── boss ── */
      if (b.mode !== 'gone') {
        let by = bp.y, bx = bp.x, alpha = 1, bsc = bp.sc, lift = 0;
        if (b.mode === 'enter' && !rm()) {
          const p = Math.min(1, b.t / 900);
          if (p < 0.55) {
            by = bp.y - (1 - p / 0.55) * 130;
            alpha = (Math.floor(b.t / 70) % 3 === 0) ? 0.25 : 0.9;
            bsc = bp.sc * (0.4 + 0.6 * (p / 0.55));
            lift = 1 - p / 0.55;
          } else if (p < 0.75) { bsc = bp.sc; by = bp.y + 4; }
          if (p >= 1) { b.mode = 'idle'; b.t = 0; }
        } else if (b.mode === 'enter') { b.mode = 'idle'; }
        if (b.mode === 'charge') {
          if (!rm()) bx += Math.sin(b.t / 30) * 3;
          if (b.t > 650) { b.mode = 'idle'; b.t = 0; }
        }
        if (b.mode === 'defeat') {
          const p = Math.min(1, b.t / 900);
          alpha = 1 - p; by = bp.y + p * 30;
          if (p >= 1) b.mode = 'gone';
        }
        const frames = bossGrids();
        const grid = frames[rm() ? 0 : tick % frames.length];
        let empty = 0;
        for (let r = grid.length - 1; r >= 0 && /^\.+$/.test(grid[r]); r--) empty++;
        const floats = empty >= 3;
        if (b.mode === 'idle' && !rm()) {
          if (floats) { by += Math.sin(now / 480) * 4; lift = 0.5; }
          else bx += Math.sin(now / 620) * 1.5;
        }
        if (b.kb > 0.4) { bx += b.kb; b.kb *= 0.88; } else b.kb = 0;
        if (b.progress >= 0.52 && b.mode === 'idle' && !rm()) bx += Math.sin(now / 85) * (b.progress - 0.52) * 11;

        const feet = by + (grid.length - empty) * bsc;
        if (b.mode !== 'defeat') contactShadow(bx + bp.cols * bsc / 2, feet, bp.cols * bsc * 0.8, bsc, lift);

        ctx.globalAlpha = alpha;
        const off = (b.flash > 0 && !rm()) ? (b.t % 2 ? 2 : -2) : 0;
        drawSprite(ctx, grid, bpal, bx + off, by, bsc, false, b.flash > 0, rim);
        ctx.globalAlpha = 1;
        if (b.flash > 0) b.flash -= 16;

        /* poškození bosse ve třech stupních: jiskry → trhliny → kouř */
        if (b.progress > 0.22 && b.mode !== 'defeat' && b.mode !== 'gone' && !rm()) {
          if (Math.random() < Math.min(0.4, (b.progress - 0.22) * 0.55)) {
            push({ kind: 'spark', x: bx + (3 + Math.random() * 12) * bsc, y: by + (1 + Math.random() * 9) * bsc,
              vx: (Math.random() - 0.5) * 2.5, vy: -1.5 - Math.random() * 2, t: 0 });
          }
          if (b.progress >= 0.52) {
            const n = b.progress >= 0.72 ? 5 : 3;
            ctx.globalAlpha = Math.min(1, (b.progress - 0.52) * 2.4) * alpha * 0.65;
            ctx.fillStyle = '#ff5522';
            for (let k = 0; k < n; k++) {
              const cw = (2 + k % 3 + (b.t % 220 < 70 ? 1 : 0)) * bsc;
              ctx.fillRect(bx + (2 + k * 2) * bsc, by + (2 + k * 3) * bsc, cw, 2);
            }
            ctx.globalAlpha = 1;
            if (b.progress >= 0.72 && Math.random() < 0.18)
              push({ kind: 'smoke', x: bx + (3 + Math.random() * 12) * bsc, y: by + Math.random() * 4 * bsc,
                vx: (Math.random() - 0.5) * 1.2, vy: -0.9 - Math.random() * 0.8, t: 0 });
          }
        }
        /* telegraf útoku */
        if (b.mode === 'charge' && !rm() && Math.floor(b.t / 110) % 2 === 0) {
          ctx.fillStyle = COMMON.R || '#ff3355';
          const ex = bx + 9 * bsc - 4, ey = by - 34;
          ctx.fillRect(ex, ey, 8, 18); ctx.fillRect(ex, ey + 22, 8, 8);
        }
      }

      /* ── hrdina ── */
      let hx = hp.x, hy = hp.y;
      if ((h.mode === 'slash' || h.mode === 'windup') && !rm()) {
        const t = h.t, reach = bp.x - hp.x - (HS.cols - 4) * HS.scale;
        let d = 0;
        if (t < T.WINDUP) d = -0.04 * (t / T.WINDUP);
        else if (t < T.IMPACT) { const p = (t - T.WINDUP) / (T.IMPACT - T.WINDUP); d = p * p; }
        else { const p = Math.min(1, (t - T.IMPACT) / (T.SLASH - T.IMPACT)); d = 1 - p * (2 - p); }
        hx = hp.x + d * reach;
      }
      const hpf = h.hpFrac === undefined ? 1 : h.hpFrac;
      if (hpf <= 0.34) { hy += 3; if (!rm() && h.mode === 'idle') hx += Math.sin(now / 70) * 2; }
      contactShadow(hx + HS.cols * HS.scale / 2, hy + HERO_PAINT * HS.scale, HS.cols * HS.scale, HS.scale, 0);
      drawSprite(ctx, heroGrid(), heroPal(), hx, hy, HS.scale, false, h.mode === 'hit', rim);

      /* šrámy a únava podle HP */
      if (hpf <= 0.67 && h.mode !== 'hit') {
        const bad = hpf <= 0.34, S = HS.scale;
        ctx.globalAlpha = 0.75; ctx.fillStyle = COMMON.R || '#ff3355';
        ctx.fillRect(hx + 4 * S, hy + 16 * S, 2 * S, 2);
        ctx.fillRect(hx + 7 * S, hy + 18 * S, 2 * S, 2);
        if (bad) { ctx.fillRect(hx + 5 * S, hy + 10 * S, 2 * S, 2); ctx.fillRect(hx + 8 * S, hy + 20 * S, 2 * S, 2); }
        ctx.globalAlpha = 1;
        if (!rm() && Math.random() < (bad ? 0.09 : 0.035))
          push({ kind: 'sweat', x: hx + (4 + Math.random() * 5) * S, y: hy + 7 * S,
            vx: (Math.random() - 0.5) * 0.8, vy: 1.1 + Math.random(), t: 0 });
        if (bad && !rm() && Math.random() < 0.06)
          push({ kind: 'smoke', x: hx + 11 * S, y: hy + 13 * S, vx: 0.5 + Math.random() * 0.5, vy: -0.4 - Math.random() * 0.4, t: 0 });
      }

      /* ── parťák (levituje vedle hrdiny) ── */
      if (AL) {
        const bob = rm() ? 0 : Math.sin(now / 380) * 6;
        /* Výchozí odsazení `(cols-2)*scale` drží parťáka na místě i po
           zvětšení hrdiny na 20 sloupců (fáze 03). Svět si ho ale může
           přepsat — fáze 02 má hrdinu ještě 18 sloupců široko a bez
           přepisu by parťák uskočil o 10 px doleva. */
        const adx = (AL.dx != null) ? AL.dx : (HS.cols - 2) * HS.scale + 6;
        const ax = hp.x + adx, ay = hp.y + 6 * HS.scale + bob;
        drawSprite(ctx, AL.grids[rm() ? 0 : tick % AL.grids.length], AL.pal, ax, ay, AL.scale, false, false, rim);
        if (!rm() && AL.jet) {
          ctx.fillStyle = (tick % 2) ? AL.jet.hot : AL.jet.cold;
          AL.jet.at.forEach(p => ctx.fillRect(ax + p[0] * AL.scale, ay + p[1] * AL.scale, AL.scale, AL.scale));
        }
        ST._ally = { x: ax + 7 * AL.scale, y: ay + 7 * AL.scale };
      }

      /* ── efekty ── */
      const gy = AR.h - 12;
      for (let i = ST.fx.length - 1; i >= 0; i--) {
        const f = ST.fx[i];
        f.t += 16;
        const k = f.kind;
        if (k === 'orb' || k === 'bolt') {
          const dur = k === 'orb' ? 420 : 260, p = Math.min(1, f.t / dur);
          const x = f.x0 + (f.x1 - f.x0) * p;
          const y = f.y0 + (f.y1 - f.y0) * p - (k === 'orb' ? Math.sin(p * Math.PI) * 36 : 0);
          const s = k === 'orb' ? 10 : 6;
          ctx.fillStyle = k === 'orb' ? '#19e6e6' : '#f4d03f';
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
          ctx.fillStyle = k === 'orb' ? 'rgba(25,230,230,.4)' : 'rgba(244,208,63,.4)';
          ctx.fillRect(x - s, y - s, s * 2, s * 2);
          if (p >= 1) { ST.fx.splice(i, 1); impact(f); }
        } else if (k === 'bossproj') {
          const p = Math.min(1, f.t / T.PROJ);
          const x = f.x0 + (f.x1 - f.x0) * p, y = f.y0 + (f.y1 - f.y0) * p;
          ctx.fillStyle = '#ff3355'; ctx.fillRect(x - 5, y - 5, 10, 10);
          ctx.fillStyle = 'rgba(255,51,85,.4)'; ctx.fillRect(x - 9, y - 9, 18, 18);
          if (p >= 1) {
            ST.fx.splice(i, 1);
            ST.hero.mode = 'hit'; ST.hero.t = 0; hold = T.HOLD;
            setTimeout(() => { if (ST.hero.mode === 'hit') { ST.hero.mode = 'idle'; ST.hero.t = 0; } }, T.HIT);
          }
        } else if (k === 'fireball') {
          const p = Math.min(1, f.t / 480);
          const x = f.x0 + (f.x1 - f.x0) * p, y = f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * 30;
          ctx.fillStyle = '#ff7733'; ctx.fillRect(x - 8, y - 8, 16, 16);
          ctx.fillStyle = '#ffd24a'; ctx.fillRect(x - 4, y - 4, 8, 8);
          ctx.fillStyle = 'rgba(255,119,51,.45)'; ctx.fillRect(x - 18 - 6 * Math.random(), y - 5, 12, 10);
          if (p >= 1) { ST.fx.splice(i, 1); impact(f, '255,119,51'); }
        } else if (k === 'lightning') {
          const p = Math.min(1, f.t / 320);
          if (f.t < 60 && !f.hitDone) { f.hitDone = 1; impact(f, '244,208,63'); }
          if (Math.floor(f.t / 60) % 2 === 0) {
            ctx.strokeStyle = '#fff7c0'; ctx.lineWidth = 4;
            ctx.beginPath();
            let yy = 0, xx = f.x1; ctx.moveTo(xx, yy);
            while (yy < f.y1) { yy += 22; xx = f.x1 + (Math.random() * 24 - 12); ctx.lineTo(xx, Math.min(yy, f.y1)); }
            ctx.stroke();
            ctx.strokeStyle = 'rgba(244,208,63,.5)'; ctx.lineWidth = 9; ctx.stroke();
          }
          if (p >= 1) ST.fx.splice(i, 1);
        } else if (k === 'ice') {
          const p = Math.min(1, f.t / 620);
          if (!f.hitDone && f.t > 80) { f.hitDone = 1; impact(f, '140,220,255'); }
          for (let q = 0; q < 6; q++) {
            const ang = q / 6 * Math.PI * 2 + 0.5, d = 18 + p * 26;
            const sx = f.x1 + Math.cos(ang) * d, sy = f.y1 + Math.sin(ang) * d;
            ctx.fillStyle = 'rgba(170,230,255,' + (1 - p) + ')'; ctx.fillRect(sx - 3, sy - 8, 6, 16);
            ctx.fillStyle = 'rgba(255,255,255,' + (0.8 - p * 0.8) + ')'; ctx.fillRect(sx - 1, sy - 5, 3, 9);
          }
          if (p >= 1) ST.fx.splice(i, 1);
        } else if (k === 'swamp') {
          const p = Math.min(1, f.t / 680);
          if (!f.hitDone && f.t > 250) { f.hitDone = 1; impact(f, '90,180,70'); }
          ctx.fillStyle = 'rgba(70,140,50,' + (0.55 - p * 0.5) + ')';
          ctx.fillRect(f.x1 - 56, f.gy - 8, 112, 12);
          for (let q = 0; q < 5; q++) {
            const ph = (p * 1.4 + q * 0.21) % 1, r2 = 4 + q % 3 * 2;
            ctx.fillStyle = 'rgba(120,210,90,' + (0.9 - ph) + ')';
            ctx.fillRect(f.x1 - 40 + q * 19 - r2 / 2, f.gy - 6 - ph * 52, r2, r2);
          }
          if (p >= 1) ST.fx.splice(i, 1);
        } else if (k === 'poison') {
          const p = Math.min(1, f.t / 680);
          if (!f.hitDone && f.t > 200) { f.hitDone = 1; impact(f, '150,255,90'); }
          for (let q = 0; q < 4; q++) {
            const ang = q * 1.7 + p * 2;
            const cx2 = f.x1 + Math.cos(ang) * 22, cy2 = f.y1 - 10 + Math.sin(ang) * 14 - p * 18;
            ctx.fillStyle = 'rgba(120,220,60,' + (0.5 - p * 0.45) + ')'; ctx.fillRect(cx2 - 11, cy2 - 8, 22, 16);
            ctx.fillStyle = 'rgba(190,255,120,' + (0.35 - p * 0.3) + ')'; ctx.fillRect(cx2 - 5, cy2 - 4, 10, 8);
          }
          if (p >= 1) ST.fx.splice(i, 1);
        } else if (k === 'spit') {
          const p = Math.min(1, f.t / 420);
          const x = f.x0 + (f.x1 - f.x0) * p, y = f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * 48;
          ctx.fillStyle = '#8de84a'; ctx.fillRect(x - 4, y - 4, 8, 8);
          ctx.fillStyle = 'rgba(141,232,74,.45)'; ctx.fillRect(x - 7, y - 7, 14, 14);
          if (p >= 1) { ST.fx.splice(i, 1); impact(f, '141,232,74'); }
        } else if (k === 'slasharc') {
          const p = Math.min(1, f.t / 240);
          ctx.strokeStyle = 'rgba(232,236,245,' + (1 - p) + ')'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(f.x, f.y, 26 + p * 22, -1.1 + p, 0.9 + p); ctx.stroke();
          if (p >= 1) ST.fx.splice(i, 1);
        } else if (k === 'boom') {
          const p = Math.min(1, f.t / 380);
          for (let q = 0; q < 8; q++) {
            const ang = q / 8 * Math.PI * 2, d = p * 38;
            ctx.fillStyle = 'rgba(' + f.rgb + ',' + (1 - p) + ')';
            ctx.fillRect(f.x + Math.cos(ang) * d - 3, f.y + Math.sin(ang) * d - 3, 6, 6);
          }
          if (p >= 1) ST.fx.splice(i, 1);
        } else if (k === 'spark') {
          f.x += f.vx; f.y += f.vy; f.vy += 0.1;
          const p = Math.min(1, f.t / 480);
          ctx.fillStyle = 'rgba(255,190,60,' + (1 - p) + ')'; ctx.fillRect(f.x - 2, f.y - 2, 4, 4);
          ctx.fillStyle = 'rgba(255,255,180,' + (0.6 - p * 0.6) + ')'; ctx.fillRect(f.x - 1, f.y - 1, 2, 2);
          if (p >= 1 || f.y > AR.h + 10) ST.fx.splice(i, 1);
        } else if (k === 'sweat') {
          f.x += f.vx; f.y += f.vy; f.vy += 0.15;
          const p = Math.min(1, f.t / 420);
          ctx.fillStyle = 'rgba(120,200,255,' + (1 - p) + ')'; ctx.fillRect(f.x - 2, f.y - 2, 4, 4);
          if (p >= 1 || f.y > AR.h + 10) ST.fx.splice(i, 1);
        } else if (k === 'smoke') {
          f.x += f.vx; f.y += f.vy;
          const p = Math.min(1, f.t / 700), s = 3 + p * 5;
          ctx.fillStyle = 'rgba(80,65,55,' + (0.45 - p * 0.44) + ')';
          ctx.fillRect(f.x - s / 2, f.y - s / 2, s, s);
          if (p >= 1 || f.y < -10) ST.fx.splice(i, 1);
        } else if (k === 'shock') {
          const p = Math.min(1, f.t / 260);
          ctx.strokeStyle = 'rgba(' + f.rgb + ',' + (0.9 - p * 0.9) + ')'; ctx.lineWidth = 4 - p * 3;
          ctx.beginPath(); ctx.arc(f.x, f.y, 8 + p * 58, 0, Math.PI * 2); ctx.stroke();
          if (p >= 1) ST.fx.splice(i, 1);
        } else if (k === 'debris') {
          f.x += f.vx; f.y += f.vy; f.vy += 0.18; f.vx *= 0.99;
          const p = Math.min(1, f.t / 380), s = f.s || 4;
          ctx.fillStyle = 'rgba(' + f.rgb + ',' + (1 - p) + ')';
          ctx.fillRect(f.x - s / 2, f.y - s / 2, s, s);
          if (p >= 1 || f.y > AR.h + 12) ST.fx.splice(i, 1);
        } else { ST.fx.splice(i, 1); }
      }
      void gy;
    }

    /* ════════ smyčka ════════ */
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!ctx) return;
      // Bitmapa plátna musí mít stejnou šířku jako jeho CSS box, jinak
      // prohlížeč obraz roztáhne a sprity vypadají protáhle. Při attach()
      // ještě není hotový layout (clientWidth = 0), dorovná se to tady.
      if (cv.clientWidth && cv.width !== cv.clientWidth) resize();
      // zámraz úderu: 2 snímky se scéna vůbec neposune
      if (hold > 0 && !rm()) { hold--; render(lastNow); return; }
      const dt = Math.min(64, now - lastT); lastT = now; lastNow = now;
      if (now - (loop._ft || 0) > FRAME_MS) { tick++; loop._ft = now; }
      ST.hero.t += dt; ST.boss.t += dt;
      render(now);
    }

    /* ════════ veřejné akce (API se NEMĚNÍ) ════════ */
    function setHeroHp(frac) {
      const f = +frac;
      ST.hero.hpFrac = isFinite(f) ? Math.max(0, Math.min(1, f)) : 1;
    }
    function spawn(areaId, startDmg) {
      curArea = Math.max(1, Math.min(AREA_MAX, areaId | 0));
      resize();
      ST.boss.mode = rm() ? 'idle' : 'enter';
      ST.boss.t = 0; ST.boss.flash = 0; ST.boss.kb = 0;
      ST.boss.progress = Math.max(0, Math.min(1, startDmg || 0));
      ST.hero.mode = 'idle'; ST.hero.t = 0; ST.hero.hpFrac = 1;
      ST.fx.length = 0;
    }
    /* Pozor: skutečná signatura v repu je setProgress(ratio).
       Hlavičkový komentář her uvádí (area, done) — bereme obojí. */
    function setProgress(a, b) {
      const r = (typeof b === 'number') ? b : a;
      ST.boss.progress = Math.max(0, Math.min(1, r || 0));
    }

    const ATTACKS = world.attacks || ['slash', 'orb', 'shoot', 'fireball', 'lightning', 'ice', 'swamp', 'poison'];
    let lastAtk = '';
    function heroAttack(isCrit, force) {
      if (!active()) return;
      let kind = force || ATTACKS[Math.floor(Math.random() * ATTACKS.length)];
      if (!force && kind === lastAtk) kind = ATTACKS[(ATTACKS.indexOf(kind) + 1) % ATTACKS.length];
      lastAtk = kind;
      const hp = heroPos(), bp = bossPos();
      const bcx = bp.x + bp.cols * bp.sc / 2, bcy = bp.y + 9 * bp.sc;
      if (rm()) { ST.boss.flash = T.FLASH; ST.boss.t = 0; return; }
      ST.hero.mode = kind === 'slash' ? 'windup' : kind === 'shoot' ? 'shoot' : 'cast';
      ST.hero.t = 0;
      const S = HS.scale;
      const hx0 = hp.x + (HS.cols - 6) * S, hyOrb = hp.y + 6 * S, hyArm = hp.y + 14 * S;
      if (kind === 'slash') {
        setTimeout(() => { if (ST.hero.mode === 'windup') { ST.hero.mode = 'slash'; } }, T.WINDUP);
        setTimeout(() => {
          push({ kind: 'slasharc', x: bcx - 20, y: bcy, t: 0 });
          ST.boss.flash = T.FLASH; ST.boss.t = 0; ST.boss.kb = T.KB; hold = T.HOLD;
          push({ kind: 'boom', x: bcx, y: bcy, t: 0, rgb: '232,236,245' });
        }, T.IMPACT);
      } else if (kind === 'orb') {
        push({ kind: 'orb', x0: hx0, y0: hyOrb, x1: bcx, y1: bcy, t: 0 });
      } else if (kind === 'shoot') {
        push({ kind: 'bolt', x0: hx0, y0: hyArm, x1: bcx, y1: bcy, t: 0 });
      } else if (kind === 'fireball') {
        push({ kind: 'fireball', x0: hx0, y0: hyOrb, x1: bcx, y1: bcy, t: 0 });
      } else if (kind === 'lightning' || kind === 'ice' || kind === 'poison') {
        setTimeout(() => push({ kind: kind, x1: bcx, y1: bcy, t: 0 }), 200);
      } else if (kind === 'swamp') {
        setTimeout(() => push({ kind: 'swamp', x1: bcx, y1: bcy, gy: AR.h - 12, t: 0 }), 200);
      }
      const dur = kind === 'slash' ? T.SLASH : kind === 'shoot' ? T.SHOOT : T.CAST;
      setTimeout(() => { if (ST.hero.mode !== 'hit') { ST.hero.mode = 'idle'; ST.hero.t = 0; } }, dur);
      if (AL && Math.random() < 0.35) {
        setTimeout(() => {
          const a = ST._ally; if (!a || !active()) return;
          push({ kind: 'spit', x0: a.x, y0: a.y, x1: bcx, y1: bcy - 10, t: 0 });
        }, 650);
      }
      void isCrit;
    }
    function bossAttack() {
      if (!active()) return;
      const hp = heroPos(), bp = bossPos();
      if (rm()) { ST.hero.mode = 'hit'; setTimeout(() => { ST.hero.mode = 'idle'; }, 300); return; }
      ST.boss.mode = 'charge'; ST.boss.t = 0;
      setTimeout(() => {
        push({ kind: 'bossproj', x0: bp.x + 5 * bp.sc, y0: bp.y + 9 * bp.sc,
          x1: hp.x + 6 * HS.scale, y1: hp.y + 15 * HS.scale, t: 0 });
      }, T.TELEGRAPH);
    }
    function defeat() {
      if (!active()) return;
      const bp = bossPos();
      ST.boss.mode = 'defeat'; ST.boss.t = 0;
      const pal = BS.pals[curArea] || BS.pals[1];
      const rgb = rgbTriple(pal.A || areaNeon(curArea));
      const cx = bp.x + bp.cols * bp.sc / 2, cy = bp.y + 9 * bp.sc;
      push({ kind: 'boom', x: cx, y: cy, t: 0, rgb });
      if (rm()) return;
      push({ kind: 'shock', x: cx, y: cy, t: 0, rgb });
      for (let k = 0; k < 18; k++) {
        const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3.4;
        push({ kind: 'debris', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.4,
          s: 3 + Math.floor(Math.random() * 3), rgb, t: 0 });
      }
      for (let k = 0; k < 7; k++)
        push({ kind: 'smoke', x: cx + (Math.random() - 0.5) * 34, y: cy + (Math.random() - 0.5) * 22,
          vx: (Math.random() - 0.5) * 1.3, vy: -0.6 - Math.random() * 0.9, t: 0 });
    }

    /* Hrdina na cizí plátno (Věž legend). Signatura se NEMĚNÍ.
       Sprite je vyšší než dřív (29 řádků proti 24), proto se kreslí
       ukotvený k CHODIDLŮM: volající předává stejné y jako dřív a hrdina
       stojí na stejné římse. Viz README, sekce „drawHeroOn". */
    function drawHeroOn(c2, x, y, scale, frame, flipX) {
      const grid = HS.grids.idle[frame ? 1 : 0];
      const dy = (paintedRows(grid) - (HS.legacyRows || HS.rows)) * scale;
      const pal = heroPal(), rim = LOOK.rim ? areaRim(curArea) : null;
      for (let r = 0; r < grid.length; r++) {
        const row = grid[r];
        for (let c = 0; c < row.length; c++) {
          const ch = row[c];
          if (ch === '.') continue;
          let col;
          if (ch === 'O') col = rim;
          else if (ch === 'K' && onLitEdge(grid, r, c, flipX)) col = rim;
          else col = pal[ch] || COMMON[ch] || '#f0f';
          c2.fillStyle = col;
          const px = flipX ? x + (row.length - 1 - c) * scale : x + c * scale;
          c2.fillRect(px, y - dy + r * scale, scale, scale);
        }
      }
    }

    window.addEventListener('resize', resize);

    return {
      attach, detach, active, spawn, heroAttack, bossAttack, defeat,
      setProgress, setHeroHp, drawHeroOn, setSkin,
      skins: () => Object.keys(HS.skins || {}),
      /* nové, jen ke čtení — testy a Věž legend */
      heroSize: () => ({ cols: HS.cols, rows: HS.rows, painted: HERO_PAINT, scale: HS.scale, legacyRows: HS.legacyRows || HS.rows }),
      fxCount: () => ST.fx.length,
      world: () => world,
      version: VERSION
    };
  }

  return { create, version: VERSION, rm, lum, contrast, rimColor, mixWhite, srnd, timing: T, FX_CAP, RIM_MIN_L };
})();
