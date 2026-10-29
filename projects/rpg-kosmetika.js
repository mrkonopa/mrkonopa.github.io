/* ═══════════════════════════════════════════════════════════════════════
   Pixelová kosmetika RPG (rámy avatara; později aury, jmenovky, mazlíčci)

   Proč: dosavadní „rám“ byl `drop-shadow` na avataru 54×72 px v profilu — téměř neviditelný,
   bez tvaru a bez pohybu (změřeno 29. 10. 2026, viz tests/KONTROLY.md). Tady je rám pixelová
   kresba s vlastním tvarem hran a rohů a se čtyřmi druhy pohybu: LED (běžící světýlka), lesk
   (pruh světla přes rám), jiskry a duha. Všechno se kreslí do plátna o logických rozměrech
   (avatar 18 × 24 + rám) a zvětšuje se celým číslem (`image-rendering: pixelated`).

   Jedno místo pro obojí: čistá funkce `renderFrame(id, W, H, step)` vrací RGBA buffer, takže ji
   používá plátno ve hře i test (otisky, kontrast, žádná magenta) bez prohlížeče.
   `step` je celé číslo (jeden krok = 80 ms); stejné `step` = stejné pixely (žádné Math.random).
   Pod `reduced-motion` se kreslí jen krok 0.
   ═══════════════════════════════════════════════════════════════════════ */
window.RPGKosmetika = (function () {
  'use strict';
  const VERSION = 1;
  const STEP_MS = 80;

  /* ── barvy ── */
  const _hexCache = {};
  function rgb(hex) {
    if (_hexCache[hex]) return _hexCache[hex];
    const h = hex.replace('#', '');
    return (_hexCache[hex] = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function hsl(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ═══ KATALOG RÁMŮ ═══════════════════════════════════════════════════
     b = tloušťka okraje (logické px), c = velikost rohové mřížky (≥ b),
     edge = vzor okraje (b řádků, opakuje se po obvodu), corner = c × c (levý horní roh,
     ostatní se zrcadlí), pal = znak → barva, fx = vrstvy pohybu.
     Světlo je vlevo nahoře: spodní a pravá hrana se ztmaví. */
  const FRAMES = {
    /* 40 kr — ocelová deska s nýty; po ní občas přejede lesk */
    'border-silver': {
      b: 4, c: 6, glow: ['#cfd8e8', 3, 6],
      pal: { r: '#171b23', d: '#f4f8ff', v: '#ffffff', c: '#c9d2e0', b: '#8e99ab', a: '#5a6577', s: '#2b323f' },
      edge: ['rrrrrrrr', 'vdddddcd', 'abbbbbbb', 'ssssssss'],
      corner: ['.rrrrr', 'rdddcb', 'rdvcbb', 'rdcbba', 'rcbbas', 'rbbass'],
      fx: [{ k: 'sweep', w: 3, speed: 0.7, gap: 26, color: '#ffffff', amount: 0.85 }]
    },
    /* 80 kr — modrý kyberový krystal; po obvodu běží světýlka */
    'border-cyan': {
      b: 5, c: 7, glow: ['#35c8ff', 4, 9],
      pal: { r: '#06142a', k: '#0d3a6e', m: '#1b79c9', c: '#3fd4ff', w: '#c8f6ff', s: '#0a2750', l: '#2a5fa8' },
      edge: ['rrrrrrrr', 'kmmkmmmk', 'mcwcmcwc', 'lmkmlmkm', 'ssssssss'],
      corner: ['.rrrrrr', 'rkmmmcw', 'rmcwwcc', 'rmwwcmk', 'rkcmkls', 'rcckssl', 'rwmlsll'],
      fx: [{ k: 'led', inset: 2, pitch: 4, speed: 0.9, tail: 9, on: '#ffffff', off: '#0f5fa8' },
           { k: 'sweep', w: 2, speed: 0.5, gap: 40, color: '#bfeeff', amount: 0.6 }]
    },
    /* 130 kr — zlatý ornament; lesk a jiskry */
    'border-gold': {
      b: 5, c: 7, glow: ['#ffd24a', 4, 10],
      pal: { r: '#3a2300', o: '#7a4b08', g: '#d99a1c', y: '#ffd24a', w: '#fff3b0', d: '#a8680f', e: '#e23b3b' },
      edge: ['rrrrrrrrrr', 'oyyywyyyyo', 'gyggdggdyg', 'oddgddgddo', 'rrrrrrrrrr'],
      corner: ['.rrrrrrr', 'roywyyyy', 'royggdgo', 'rwyrerdo', 'royeeedr', 'ryddrdor', 'rygdorrr'.slice(0, 7) + 'r'].map(s => s.slice(0, 7)),
      fx: [{ k: 'sweep', w: 3, speed: 0.8, gap: 22, color: '#ffffff', amount: 0.9 },
           { k: 'sparkle', n: 3, life: 8, color: '#ffffff', size: 1, seed: 11 }]
    },
    /* 220 kr — hologram: duhový přeliv, scanline, LED v barvách duhy */
    'border-holo': {
      b: 5, c: 7, glow: ['#9b6bff', 5, 12],
      pal: { r: '#0a0618', h: '*hue', k: '#1a1038', w: '#ffffff', s: '#140c2c' },
      edge: ['rrrrrrrr', 'hhhhhhhh', 'kwkhkkwk', 'hhhhhhhh', 'ssssssss'],
      corner: ['.rrrrrr', 'rhhhhhh', 'rhwwkhk', 'rhwhhhh', 'rhkhsss', 'rhhhsrr', 'rhhhsrr'],
      fx: [{ k: 'led', inset: 2, pitch: 3, speed: 1.2, tail: 7, on: '*hue', off: '#2a1c52' },
           { k: 'scan', gap: 4, amount: 0.22 },
           { k: 'glitch', every: 23, amount: 3 }]
    },
    /* 600 kr — květinový věnec: listy a růžové květy se vlní, padají okvětní lístky */
    'border-wreath': {
      b: 6, c: 8, glow: ['#ff9edb', 3, 8],
      pal: { r: '#0d2a14', g: '#2f9b45', l: '#58d06a', d: '#1c6a30', p: '#ff7ab8', q: '#ffc2e0', y: '#ffe36a', w: '#fff6fb' },
      edge: ['rrrrrrrrrrrr', 'rgldgdlgrrgg', 'dllgllgldlgl', 'lgdlppqllgdl', 'rdlgpyplgdlr', 'rrdgdqqdgdrr'],
      corner: ['.rrrrrrr', 'rgglllpq', 'rglpqpyp', 'rdlpywpq', 'rlgqpqll', 'rgdlllgd', 'rrdgdlgr', '.rrrrrrr'],
      fx: [{ k: 'sway', amp: 1.5, speed: 0.12 },
           { k: 'drift', n: 4, color: '#ffc2e0', color2: '#ff7ab8', seed: 5 }]
    },
    /* 800 kr — pirátské lano: kroucené, rohy s kotvou, lucerna mrká */
    'border-anchor': {
      b: 5, c: 8, glow: ['#ffb347', 3, 7],
      pal: { r: '#241606', t: '#d9b779', u: '#a77a3b', v: '#6e4a1c', n: '#1b4f86', m: '#3a8fe0', w: '#bfe4ff', y: '#ffb347', z: '#ff7a1a' },
      edge: ['rrrrrrrr', 'ttuuvvtt', 'tuuvvttu', 'uuvvttuu', 'rrrrrrrr'],
      corner: ['.rrrrrrr', 'rttuuvvt', 'rtnnnnuv', 'ruwmmnvt', 'rvmnnnrt', 'rvnnyzrr', 'rtuvyzr.', 'rrrrrr..'].map(s => s.slice(0, 8)),
      fx: [{ k: 'flicker', ch: 'yz', a: '#ffb347', b: '#ff5a10', every: 2 },
           { k: 'sweep', w: 2, speed: 0.4, gap: 34, color: '#8fd0ff', amount: 0.5 }]
    },
    /* 1 600 kr — dračí šupiny: zlato a zeleň, oči v rozích žhnou, vzlétají jiskry */
    'border-dragon': {
      b: 6, c: 8, glow: ['#3ddc84', 4, 11],
      pal: { r: '#06200f', g: '#14703c', l: '#46d67c', d: '#0a3d20', y: '#ffd24a', o: '#ff7a1a', e: '#ff3b2b', w: '#fff0a0' },
      edge: ['rrrrrrrr', 'gllggylg', 'llldllld', 'lggllggl', 'ldllldll', 'rrrrrrrr'],
      corner: ['.rrrrrrr', 'rgllgyll', 'rlldlldl', 'rylewwdl', 'rlddeoyl', 'rdlyooyg', 'rrdlgdgr', '..rrrrrr'],
      fx: [{ k: 'flicker', ch: 'eo', a: '#ff3b2b', b: '#ffb02b', every: 2 },
           { k: 'drift', n: 5, color: '#ffb02b', color2: '#ff5a10', seed: 9, up: 1 },
           { k: 'sweep', w: 3, speed: 0.6, gap: 30, color: '#fff0a0', amount: 0.7 }]
    },
    /* 1 600 kr (podzim) — dýňový rám: dýně a liány, svíčka v obličeji mrká */
    'border-dyne': {
      b: 6, c: 8, glow: ['#ff8c1a', 4, 10],
      pal: { r: '#2a1100', o: '#ff8c1a', u: '#d9630a', d: '#8a3304', g: '#3a8a2a', v: '#1f5a18', y: '#ffe36a' },
      edge: ['rrrrrrrr', 'rrrggrrr', 'roooooor', 'ooyooyoo', 'ouooouuo', 'oyuyuyuo'].slice(0, 5).concat(['rddddddr']),
      corner: ['.rrrrrrr', 'rouoddov', 'rodrrdog', 'ruoryyou', 'rdoryyrd', 'rouodddr', 'rvgvrrrr', '.rrrrr..'].map(s => s.slice(0, 8)),
      fx: [{ k: 'flicker', ch: 'y', a: '#ffe36a', b: '#ff9a1a', every: 2 },
           { k: 'led', inset: 3, pitch: 5, speed: 0.5, tail: 5, on: '#ffe36a', off: '#8a3a05' }]
    },
    /* 2 000 kr (únor) — srdce v řetězu; tep a vznášející se srdíčka */
    'border-srdce': {
      b: 5, c: 7, glow: ['#ff5c8a', 4, 12],
      pal: { r: '#3a0a1c', p: '#ff5c8a', q: '#ffb0c8', d: '#c2305f', w: '#ffe0ec', k: '#6e1432' },
      edge: ['rqqrqqrr', 'qpppppdr', 'rpppppdr', 'rrpppdrr', 'rrrpdrrr'],
      corner: ['.rrrrrr', 'rqqrqqr', 'qpwpppd', 'rpppppd', 'rrpppdr', 'rrrpdrr', 'rrrrrr.'],
      fx: [{ k: 'pulse', amp: 0.35, speed: 0.25 },
           { k: 'sweep', w: 2, speed: 0.6, gap: 30, color: '#ffe0ec', amount: 0.8 },
           { k: 'sparkle', n: 3, life: 8, color: '#ffe0ec', size: 1, seed: 17 },
           { k: 'drift', n: 4, color: '#ffb0c8', color2: '#ff5c8a', seed: 21, up: 1 }]
    },
    /* nekoupitelný — diamantová aura: fazety, duha, hodně jisker */
    'border-diamond': {
      b: 6, c: 8, glow: ['#bff3ff', 6, 14],
      pal: { r: '#0b2233', w: '#ffffff', c: '#bff3ff', b: '#6fc8ff', d: '#2f86c9', h: '*hue', k: '#14486e' },
      edge: ['rrrrrrrr', 'wcbcwcbc', 'cwbdbwbd', 'bdhkdbhk', 'dbkddbkd', 'rrrrrrrr'],
      corner: ['.rrrrrrr', 'rwwcbhdr', 'rwcbhdkr', 'rcbwwhdr', 'rbhwwcbr', 'rdkhbcdr', 'rrdrdbrr', '..rrrrrr'],
      fx: [{ k: 'sweep', w: 3, speed: 1.1, gap: 18, color: '#ffffff', amount: 1 },
           { k: 'sparkle', n: 6, life: 8, color: '#ffffff', size: 2, seed: 3 },
           { k: 'led', inset: 3, pitch: 3, speed: 1.4, tail: 8, on: '*hue', off: '#1c5a8a' }]
    }
  };

  /* ═══ ČISTÁ KRESBA ═══════════════════════════════════════════════════ */
  function ringIndex(W, H, inset) {                   // body obdélníku po směru hodin (levý horní → …)
    const pts = [], x0 = inset, y0 = inset, x1 = W - 1 - inset, y1 = H - 1 - inset;
    for (let x = x0; x <= x1; x++) pts.push([x, y0]);
    for (let y = y0 + 1; y <= y1; y++) pts.push([x1, y]);
    for (let x = x1 - 1; x >= x0; x--) pts.push([x, y1]);
    for (let y = y1 - 1; y > y0; y--) pts.push([x0, y]);
    return pts;
  }

  function renderFrame(id, W, H, step) {
    const def = FRAMES[id];
    const buf = new Uint8ClampedArray(W * H * 4);
    if (!def) return buf;
    step = step | 0;
    const b = def.b, c = def.c, P = def.edge[0].length, pal = def.pal;
    const fxs = def.fx || [];
    const sway = fxs.find(f => f.k === 'sway');
    const flick = fxs.filter(f => f.k === 'flicker');
    const swayShift = sway ? Math.round(Math.sin(step * sway.speed * 2 * Math.PI) * sway.amp) : 0;

    function put(x, y, col, a) {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const o = (y * W + x) * 4;
      buf[o] = col[0]; buf[o + 1] = col[1]; buf[o + 2] = col[2]; buf[o + 3] = a == null ? 255 : a;
    }
    function charColor(ch, x, y) {
      let v = pal[ch];
      if (v == null) return null;
      for (const f of flick) if (f.ch.indexOf(ch) >= 0) return rgb(((step / (f.every || 2) | 0) % 2 === 0) ? f.a : f.b);
      if (v === '*hue') return hsl(x * 14 + y * 14 + step * 18, 90, 62);
      return rgb(v);
    }
    const isRing = (x, y) => x < b || y < b || x >= W - b || y >= H - b;

    /* 1) základ: okraj ze vzoru, rohy z mřížky */
    const ringPix = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const inL = x < c, inR = x >= W - c, inT = y < c, inB = y >= H - c;
      let ch = null, shade = 1;
      if ((inL || inR) && (inT || inB)) {
        const cx = inL ? x : W - 1 - x, cy = inT ? y : H - 1 - y;
        ch = def.corner[cy][cx];
        shade = (inB && inR) ? 0.74 : (inB || inR) ? 0.87 : 1;
      } else if (isRing(x, y)) {
        let row, col;
        if (y < b) { row = y; col = x - c; shade = 1; }
        else if (y >= H - b) { row = H - 1 - y; col = x - c; shade = 0.78; }
        else if (x < b) { row = x; col = y - c; shade = 1; }
        else { row = W - 1 - x; col = y - c; shade = 0.78; }
        const sh = (row === 0 || row === b - 1) ? 0 : swayShift;
        ch = def.edge[row][(((col + sh) % P) + P) % P];
      }
      if (ch == null || ch === '.') continue;
      const cc = charColor(ch, x, y);
      if (!cc) continue;
      put(x, y, cc.map(v => v * shade));
      ringPix.push([x, y]);
    }

    /* 2) pohyb */
    for (let fi = 0; fi < fxs.length; fi++) {
      const f = fxs[fi];
      if (f.k === 'sweep') {                                        // lesk: úhlopříčný pruh světla
        const period = W + H + f.gap, pos = (step * f.speed * 2) % period;
        for (const [x, y] of ringPix) {
          const d = Math.abs((x + y) - pos);
          if (d <= f.w) {
            const o = (y * W + x) * 4, t = (1 - d / (f.w + 0.5)) * f.amount, w = rgb(f.color);
            const m = mix([buf[o], buf[o + 1], buf[o + 2]], w, t);
            buf[o] = m[0]; buf[o + 1] = m[1]; buf[o + 2] = m[2];
          }
        }
      } else if (f.k === 'led') {                                    // běžící světýlka po obvodu
        const pts = ringIndex(W, H, f.inset), n = pts.length, head = Math.floor(step * f.speed) % n;
        for (let i = 0; i < n; i += f.pitch) {
          const dist = ((head - i) % n + n) % n, lit = dist < f.tail * f.pitch ? 1 - dist / (f.tail * f.pitch) : 0;
          const off = rgb(f.off), on = f.on === '*hue' ? hsl(i * 9 + step * 20, 95, 66) : rgb(f.on);
          const m = mix(off, on, lit);
          put(pts[i][0], pts[i][1], m);
        }
      } else if (f.k === 'sparkle') {                                // hvězdičky: kříž 3 / 5 px, jeden pixel střed
        for (let k = 0; k < f.n; k++) {
          const period = f.life * 2 + (k % 3) * 3, ph = (step + k * 5) % period, cyc = Math.floor((step + k * 5) / period);
          if (ph >= f.life) continue;
          const r = rng(f.seed * 131 + k * 17 + cyc * 7919), p = ringPix[Math.floor(r() * ringPix.length)];
          if (!p) continue;
          const inten = 1 - Math.abs(ph - f.life / 2) / (f.life / 2), col = rgb(f.color), a = Math.round(255 * Math.min(1, inten * 1.4));
          put(p[0], p[1], col, a);
          if (inten > 0.45) { const s = f.size; for (let q = 1; q <= s; q++) { put(p[0] + q, p[1], col, a); put(p[0] - q, p[1], col, a); put(p[0], p[1] + q, col, a); put(p[0], p[1] - q, col, a); } }
        }
      } else if (f.k === 'scan') {                                   // vodorovné scanline (hologram)
        for (const [x, y] of ringPix) if ((y + step) % f.gap === 0) {
          const o = (y * W + x) * 4, m = mix([buf[o], buf[o + 1], buf[o + 2]], [255, 255, 255], f.amount);
          buf[o] = m[0]; buf[o + 1] = m[1]; buf[o + 2] = m[2];
        }
      } else if (f.k === 'glitch') {                                 // krátké zacuknutí: posun jednoho řádku okraje
        if (step % f.every < 2) {
          const y = 1 + ((step / f.every | 0) * 7) % (H - 2), sh = (step % 2 ? 1 : -1) * f.amount;
          const row = []; for (let x = 0; x < W; x++) { const o = (y * W + x) * 4; row.push([buf[o], buf[o + 1], buf[o + 2], buf[o + 3]]); }
          for (let x = 0; x < W; x++) { const s = row[((x - sh) % W + W) % W], o = (y * W + x) * 4; if (s[3]) { buf[o] = s[0]; buf[o + 1] = s[1]; buf[o + 2] = s[2]; buf[o + 3] = 255; } }
        }
      } else if (f.k === 'drift') {                                  // lístky / jiskry u vnitřního okraje
        for (let k = 0; k < f.n; k++) {
          const r = rng(f.seed * 97 + k * 31), side = r() < 0.5 ? b : W - b - 1, y0 = r() * H, vy = 0.35 + r() * 0.5, wob = 1 + r() * 2;
          let y = (y0 + step * vy * (f.up ? -1 : 1)) % H; if (y < 0) y += H;
          const x = Math.round(side + (side === b ? 1 : -1) * (1 + Math.sin(step * 0.3 + k) * wob));
          if (y > b && y < H - b) put(x, Math.round(y), rgb((k % 2) ? f.color : f.color2), 230);
        }
      }
    }
    return buf;
  }

  /* skutečné světlo za rámem: [barva, min, max px] podle kroku (tep) */
  function glowAt(id, step) {
    const def = FRAMES[id]; if (!def) return null;
    const g = def.glow || ['#ffffff', 2, 5], pulse = (def.fx || []).find(f => f.k === 'pulse');
    const t = 0.5 + 0.5 * Math.sin(step * (pulse ? pulse.speed : 0.16) * 2 * Math.PI);
    return { color: g[0], blur: g[1] + (g[2] - g[1]) * t };
  }

  /* ═══ POPISY PRO OBCHOD ═════════════════════════════════════════════ */
  const META = {
    'border-silver':  { tier: 'běžný',      motion: 'lesk přejíždí po oceli' },
    'border-cyan':    { tier: 'běžný',      motion: 'běžící světýlka a lesk' },
    'border-gold':    { tier: 'vzácný',     motion: 'zlatý lesk a jiskry' },
    'border-holo':    { tier: 'vzácný',     motion: 'duha, scanline a cuknutí' },
    'border-wreath':  { tier: 'epický',     motion: 'vlnění a padající okvětní lístky' },
    'border-anchor':  { tier: 'epický',     motion: 'mrkající lucerny a vlny' },
    'border-dragon':  { tier: 'legendární', motion: 'žhnoucí oči, jiskry a zlatý lesk' },
    'border-dyne':    { tier: 'sezónní',    motion: 'svíčka mrká, světýlka' },
    'border-srdce':   { tier: 'sezónní',    motion: 'tep srdce a vznášející se srdíčka' },
    'border-diamond': { tier: 'za úspěch',  motion: 'duhová světýlka, lesk a hodně jisker' }
  };
  /* Katalog obchodu (`rpg-wallet.js`) pojmenovává rámy jinak než tento modul: srdce je tam `border-srdce`,
     dýně `border-dyne` — stejně jako zde. Ostatní id sedí. Test `rpg-kosmetika` hlídá, že se oba seznamy kryjí. */

  /* ═══ PLÁTNO VE STRÁNCE ═══════════════════════════════════════════════ */
  const mounted = new Set();
  let timer = 0, t0 = 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const reduced = () => {
    try { return document.documentElement.classList.contains('reduced-motion') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  };
  const has = id => !!(id && FRAMES[id]);
  function geom(id, aw, ah) { const b = has(id) ? FRAMES[id].b : 0; return { b, W: aw + 2 * b, H: ah + 2 * b }; }
  function place(m) {
    const g = geom(m.id, m.aw, m.ah);
    m.W = g.W; m.H = g.H;
    if (m.cv.width !== g.W) m.cv.width = g.W;
    if (m.cv.height !== g.H) m.cv.height = g.H;
    const st = m.cv.style;
    st.left = (-g.b * m.u) + 'px'; st.top = (-g.b * m.u) + 'px'; st.width = (g.W * m.u) + 'px'; st.height = (g.H * m.u) + 'px';
  }
  function paint(m, step) {
    place(m);
    const ctx = m.cv.getContext('2d');
    if (!has(m.id)) { ctx.clearRect(0, 0, m.cv.width, m.cv.height); m.cv.style.filter = ''; return; }
    const img = ctx.createImageData(m.W, m.H);
    img.data.set(renderFrame(m.id, m.W, m.H, step));
    ctx.putImageData(img, 0, 0);
    const g = glowAt(m.id, step);
    m.cv.style.filter = 'drop-shadow(0 0 ' + g.blur.toFixed(1) + 'px ' + g.color + ')';
  }
  function curStep() { return reduced() ? 0 : Math.floor((now() - t0) / STEP_MS); }
  function tick() {
    const step = curStep();
    mounted.forEach(m => { if (!m.cv.isConnected) { mounted.delete(m); return; } if (m.step !== step) { m.step = step; paint(m, step); } });
    if (!mounted.size) { clearInterval(timer); timer = 0; }
  }
  function start() { if (!timer && !reduced()) { t0 = t0 || now(); timer = setInterval(tick, STEP_MS); } }

  /* Rám nad prvkem `host` (ten musí mít velikost avatara a position: relative). */
  function mountFrame(host, id, o) {
    o = o || {};
    const m = { cv: document.createElement('canvas'), id: id || null, u: o.u || 3, aw: o.aw || 18, ah: o.ah || 24, step: -1, W: 0, H: 0 };
    m.cv.className = 'kos-frame';
    m.cv.setAttribute('aria-hidden', 'true');
    m.cv.style.cssText = 'position:absolute;image-rendering:pixelated;pointer-events:none;z-index:2';
    host.appendChild(m.cv);
    mounted.add(m); paint(m, 0); start();
    return {
      set(next) { m.id = next || null; m.step = -1; paint(m, curStep()); start(); },
      get id() { return m.id; },
      destroy() { mounted.delete(m); m.cv.remove(); },
      canvas: m.cv
    };
  }

  /* Hrdina hráče na plátně aw×ah logických px (3× zvětšeno) — stejný výřez jako profilová karta ve hrách. */
  function drawHero(cv) {
    const ctx = cv.getContext && cv.getContext('2d');
    if (!ctx) return false;
    ctx.clearRect(0, 0, cv.width, cv.height); ctx.imageSmoothingEnabled = false;
    for (let n = 3; n <= 9; n++) {
      const sp = window['RPGSprites' + n];
      if (sp && typeof sp.drawHeroOn === 'function') { try { sp.drawHeroOn(ctx, 0, 0, 3, 0, false); return true; } catch (e) { return false; } }
    }
    return false;
  }

  /* Profil / hub: rám na avataru. `el` je buď plátno avatara (obalí se), nebo hotový obal (`o.inside`). */
  function applyAvatar(el, id, o) {
    if (!el) return null;
    o = o || {};
    const u = o.u || 3;
    let host = el;
    if (!o.inside) {
      host = el.parentNode && el.parentNode.classList && el.parentNode.classList.contains('kos-av') ? el.parentNode : null;
      if (!host) {
        host = document.createElement('span'); host.className = 'kos-av';
        el.parentNode.insertBefore(host, el); host.appendChild(el);
      }
      host.style.cssText = 'position:relative;display:inline-block;line-height:0;flex:none;margin:' + (6 * u) + 'px';
    } else if (!host.style.position) host.style.position = 'relative';
    const aw = o.aw || (o.inside ? 18 : Math.round((el.clientWidth || el.width || 54) / u));
    const ah = o.ah || (o.inside ? 24 : Math.round((el.clientHeight || el.height || 72) / u));
    if (host._kos) { host._kos.set(id); return host._kos; }
    host._kos = mountFrame(host, id, { u, aw, ah });
    return host._kos;
  }

  /* ═══ OBCHOD: živý náhled rámu na hrdinovi a „Vyzkoušet“ ═══════════════ */
  let tryHandle = null, tryName = null;
  function ensureStrip(grid) {
    let strip = document.getElementById('kos-try');
    if (strip && strip.parentNode !== grid.parentNode) { strip.remove(); strip = null; }
    if (strip) return strip;
    strip = document.createElement('div');
    strip.id = 'kos-try'; strip.className = 'kos-try'; strip.hidden = true;
    const av = document.createElement('span'); av.className = 'kos-av'; av.style.cssText = 'position:relative;display:inline-block;line-height:0;margin:18px';
    const cv = document.createElement('canvas'); cv.width = 54; cv.height = 72; cv.style.cssText = 'width:54px;height:72px;image-rendering:pixelated;display:block';
    av.appendChild(cv); strip.appendChild(av);
    const txt = document.createElement('div'); txt.className = 'kos-try-t';
    const t1 = document.createElement('b'); t1.id = 'kos-try-name'; const t2 = document.createElement('span'); t2.id = 'kos-try-hint';
    txt.append(t1, t2);
    const off = document.createElement('button'); off.type = 'button'; off.className = 'btn sm'; off.id = 'kos-try-off'; off.textContent = 'ZPĚT';
    off.addEventListener('click', () => tryOn(null));
    strip.append(txt, off);
    grid.parentNode.insertBefore(strip, grid);
    drawHero(cv);
    tryHandle = mountFrame(av, null, { u: 3, aw: 18, ah: 24 });
    return strip;
  }
  function activeBorder() { try { return (window.RPGWallet && RPGWallet.activeId && RPGWallet.activeId('border')) || null; } catch (e) { return null; } }
  function itemName(id) { try { const it = RPGWallet.itemById(id); return it ? it.name : id; } catch (e) { return id; } }
  function tryOn(id) {
    tryName = id || null;
    const strip = document.getElementById('kos-try'); if (!strip || !tryHandle) return;
    const shown = id || activeBorder();
    tryHandle.set(shown);
    const n = document.getElementById('kos-try-name'), h = document.getElementById('kos-try-hint'), off = document.getElementById('kos-try-off');
    n.textContent = shown ? itemName(shown) : 'Bez rámu';
    h.textContent = id ? ' — vyzkoušeno na tvém hrdinovi, ještě to nemáš nasazené' : ' — tvůj hrdina teď';
    off.hidden = !id;
  }
  /* Karty obchodu mají v každé hře jiné třídy (g3–8 `.shop-card .shop-ic .shop-nm`, g9 `.shop-item .si-ic .si-nm`,
     hub `.sc .ic .nm`) — hledá se podle seznamu. */
  const SEL_IC = '.si-ic,.shop-ic,.ic', SEL_NM = '.si-nm,.shop-nm,.nm', SEL_BTN = '.si-btn';
  function decorateCard(card, item) {
    if (!item || item.cat !== 'border' || !has(item.id) || card.querySelector('.kos-av')) return;
    const ic = card.querySelector(SEL_IC); if (!ic) return;
    const av = document.createElement('span'); av.className = 'kos-av'; av.style.cssText = 'position:relative;display:inline-block;line-height:0;margin:18px auto 14px';
    const cv = document.createElement('canvas'); cv.width = 54; cv.height = 72; cv.style.cssText = 'width:54px;height:72px;image-rendering:pixelated;display:block';
    av.appendChild(cv); drawHero(cv);
    mountFrame(av, item.id, { u: 3, aw: 18, ah: 24 });
    ic.replaceWith(av);
    const m = META[item.id];
    if (m) {
      const t = document.createElement('div'); t.className = 'kos-meta';
      const tier = document.createElement('span'); tier.className = 'kos-tier kos-tier-' + (m.tier === 'běžný' ? 'a' : m.tier === 'vzácný' ? 'b' : m.tier === 'epický' ? 'c' : m.tier === 'legendární' ? 'd' : 'e'); tier.textContent = m.tier;
      const mo = document.createElement('span'); mo.textContent = m.motion;
      t.append(tier, mo);
      const nm = card.querySelector(SEL_NM); if (nm) nm.after(t);
    }
    const tb = document.createElement('button'); tb.type = 'button'; tb.className = 'btn sm kos-try-btn'; tb.textContent = 'VYZKOUŠET'; tb.setAttribute('aria-label', 'Vyzkoušet rám ' + item.name + ' na mém hrdinovi');
    tb.addEventListener('click', () => { tryOn(item.id); const s = document.getElementById('kos-try'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); });
    (card.querySelector(SEL_BTN) || card).appendChild(tb);
  }
  /* Volá se na konci každého `renderShop()` — jedna funkce pro všech 7 her i hub. `items` jsou položky vykreslené v `grid` ve stejném pořadí. */
  function shopRendered(grid, items, cat) {
    if (!grid) return;
    const strip = ensureStrip(grid);
    strip.hidden = cat !== 'border';
    if (cat !== 'border') return;
    tryOn(tryName && has(tryName) ? tryName : null);
    const cards = Array.from(grid.children);
    items.forEach((it, i) => { if (cards[i]) decorateCard(cards[i], it); });
  }

  /* Styl sdílený všemi hrami (jedno místo, ne kopie v osmi souborech). */
  function injectCss() {
    if (typeof document === 'undefined' || document.getElementById('kos-css')) return;
    const st = document.createElement('style'); st.id = 'kos-css';
    st.textContent = '.kos-try{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:6px 14px;background:var(--panel,#0e1630);border:2px solid var(--gold,#f4d03f);margin:0 0 12px;padding:2px 14px 2px 2px;flex-wrap:wrap}' +
      '.kos-try[hidden]{display:none}.kos-try-t{display:flex;flex-direction:column;gap:2px;flex:1;min-width:160px;font-size:13px}.kos-try-t b{font-size:15px;color:var(--gold,#f4d03f)}' +
      '.kos-meta{display:flex;flex-direction:column;gap:2px;align-items:center;font-size:12px;opacity:.9;margin:2px 0 4px}' +
      '.kos-tier{font-weight:700;letter-spacing:1px;text-transform:uppercase;font-size:12px}.kos-tier-a{color:#b9c4d6}.kos-tier-b{color:#6ec6ff}.kos-tier-c{color:#c58bff}.kos-tier-d{color:#ffb23e}.kos-tier-e{color:#ff7ab8}' +
      '.kos-try-btn{margin-left:4px}';
    (document.head || document.documentElement).appendChild(st);
  }
  try { injectCss(); } catch (e) {}

  return { VERSION, STEP_MS, FRAMES, META, has, ids: () => Object.keys(FRAMES), renderFrame, glowAt, mountFrame, applyAvatar, drawHero, shopRendered, tryOn, rgb, hsl, rng };
})();
