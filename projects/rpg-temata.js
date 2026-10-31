/* RPG témata z obchodu jako pixelové pozadí (window.RPGTemata).
   Dřív téma přepisovalo jen čtyři barevné proměnné (--gold, --panel, --panel2, --blue):
   okraje panelů se přebarvily, pozadí i aréna zůstaly stejné. Teď má každé téma
   vlastní pohyblivé pozadí stránky a lehký nános v aréně.

   • Stránka: plátno `canvas[data-tema]` (fixed, z-index:-1, pointer-events:none),
     logický pixel 6 CSS px (4 na telefonu), ~15 snímků/s, stojí při skryté kartě.
   • Aréna: jádro spritů (rpg-sprite-core.js) volá `setThemeFx(fn)` po vykreslení
     pozadí světa a před postavami — nános nikdy nezakryje hrdinu ani bosse.
   • `frame` a `arenaFrame` jsou ČISTÉ funkce času: žádné Math.random, jen
     fillRect + fillStyle + globalAlpha. Snímek je dán jen `t`, takže jde otisknout
     a testovat. Strop počtu volání hlídá test (cenu nese počet volání, ne plocha).
   • Pod reduced-motion (třída na <html> nebo systémové nastavení) se kreslí
     jediný statický snímek.
   Bez modulu hra běží po starém (jen přebarvení). */
window.RPGTemata = (function () {
  'use strict';

  const STILL = 4200;                       // ms: snímek pro reduced-motion
  const KEYS = ['matrix', 'blood', 'violet', 'space', 'temple', 'vanoce', 'leto'];
  const META = {
    matrix: { name: 'Matrix',          anim: 'padající zelený déšť' },
    blood:  { name: 'Red Circuit',     anim: 'červené impulsy po spojích' },
    violet: { name: 'Violet Hack',     anim: 'stoupající fialové částice a záškuby' },
    space:  { name: 'Hlubina vesmíru', anim: 'blikající hvězdy, mlhovina a meteor' },
    temple: { name: 'Chrámové zlato',  anim: 'zlatý prach, sloupy a paprsky' },
    vanoce: { name: 'Vánoční',         anim: 'sněžení a blikající řetěz světýlek' },
    leto:   { name: 'Letní vlny',      anim: 'vlny, slunce a třpyt' }
  };

  /* ── pomůcky ── */
  const mod = (a, n) => ((a % n) + n) % n;
  function rnd(s, i) {                      // deterministické „náhodné“ číslo 0–1
    let x = (Math.imul(s + 1, 374761393) + Math.imul(i + 1, 668265263)) | 0;
    x = x ^ (x >>> 13); x = Math.imul(x, 1274126177); x = x ^ (x >>> 16);
    return (x >>> 0) / 4294967296;
  }
  function R(c, x, y, w, h, col, a) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (w <= 0 || h <= 0) return;
    c.globalAlpha = a == null ? 1 : a;
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  }
  const mixCache = {};
  function mix(a, b, k) {
    const key = a + b + Math.round(k * 50);
    if (mixCache[key]) return mixCache[key];
    const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return (mixCache[key] = '#' + A.map((v, i) =>
      Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''));
  }
  function bands(c, W, H, c0, c1, n) {
    const bh = Math.ceil(H / n);
    for (let i = 0; i < n; i++) R(c, 0, i * bh, W, bh, mix(c0, c1, i / (n - 1)), 1);
  }
  function disc(c, cx, cy, r, col, a) {      // kulatý pixelový kotouč (řádky)
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy + 0.25));
      R(c, cx - w, cy + dy, w * 2 + 1, 1, col, a);
    }
  }
  /* Šestiúhelníková buňka (plochý vršek, 9 × 9 pixelů) s odstupňovanou průhledností. */
  function hex(c, x, y, a) {
    const rows = [5, 7, 9, 9, 9, 9, 9, 7, 5];
    for (let i = 0; i < rows.length; i++) R(c, x - (rows[i] - 1) / 2, y + i, rows[i], 1, '#8a5cff', a * 0.16);
    R(c, x - 1, y + 3, 3, 3, '#c590ff', a * 0.5);
  }
  /* 12 buněk na volné mřížce; každá má vlastní cyklus (6–10 s), místo se po každém cyklu přelosuje. */
  function hexy(c, W, H, s) {
    const cx = Math.floor(W / 11), cy = Math.floor(H / 8);
    for (let i = 0; i < 12; i++) {
      const per = 6 + rnd(300, i) * 4, k = s / per + rnd(301, i), n = Math.floor(k), f = k - n;
      const gx = Math.floor(rnd(302 + i, n) * cx), gy = Math.floor(rnd(303 + i, n) * cy);
      const a = Math.sin(Math.PI * f) ** 2;
      if (a > 0.04) hex(c, gx * 11 + (gy % 2 ? 5 : 0) + 5, gy * 8, a);
    }
  }
  function stars(c, W, H, s, n, seed, y0, y1, cols) {
    for (let i = 0; i < n; i++) {
      const x = rnd(seed, i) * W, y = y0 + rnd(seed + 1, i) * (y1 - y0);
      const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(s * (0.8 + rnd(seed + 2, i) * 2.2) + rnd(seed + 3, i) * 6.28));
      const col = cols[i % cols.length];
      R(c, x, y, 1, 1, col, tw);
      if (i % 9 === 0) { R(c, x - 1, y, 3, 1, col, tw * 0.35); R(c, x, y - 1, 1, 3, col, tw * 0.35); }
    }
  }
  function rise(c, W, H, s, n, seed, spMin, spVar, cols, aMin, aVar, plus) {
    for (let i = 0; i < n; i++) {
      const sp = spMin + rnd(seed, i) * spVar, per = H + 8;
      const y = per - mod(s * sp + rnd(seed + 1, i) * per, per) - 4;
      const x = rnd(seed + 2, i) * W + Math.sin(s * 0.7 + rnd(seed + 3, i) * 6.28) * 2.5;
      const a = aMin + aVar * (0.5 + 0.5 * Math.sin(s * 2 + i));
      const col = cols[i % cols.length];
      if (plus) { R(c, x, y - 1, 1, 3, col, a); R(c, x - 1, y, 3, 1, col, a); }
      else R(c, x, y, 1 + (i % 4 === 0 ? 1 : 0), 1 + (i % 4 === 0 ? 1 : 0), col, a);
    }
  }
  function snow(c, W, H, s, n, seed, a0) {
    for (let i = 0; i < n; i++) {
      const big = rnd(seed, i) < 0.35, sp = (big ? 9 : 5) + rnd(seed + 1, i) * 6, per = H + 6;
      const y = mod(s * sp + rnd(seed + 2, i) * per, per) - 3;
      const x = mod(rnd(seed + 3, i) * W + Math.sin(s * 0.6 + i) * 3, W);
      R(c, x, y, big ? 2 : 1, big ? 2 : 1, '#eaf6ff', big ? a0 + 0.25 : a0);
    }
  }
  function rain(c, W, H, s, seed, step, dens, hUp, a) {
    const cols = Math.floor(W / step);
    for (let i = 0; i < cols; i++) {
      if (rnd(seed, i) < 1 - dens) continue;
      const x = i * step, sp = 5 + rnd(seed + 1, i) * 9, len = 7 + Math.floor(rnd(seed + 2, i) * 12);
      const per = H + len + 10, head = mod(s * sp + rnd(seed + 3, i) * per, per) - 4;
      R(c, x, head - len, 1, len * 0.45, '#17c45a', 0.18 * a);
      R(c, x, head - len * 0.55, 1, len * 0.4, '#2be072', 0.4 * a);
      R(c, x, head - 3, 1, 2, '#7dffae', 0.7 * a);
      R(c, x, head - 1, 1, 1, '#e4fff0', 0.95 * a);
    }
  }

  /* ── pozadí STRÁNKY (W × H logických pixelů; velmi tmavé, ať text zůstane čitelný) ── */
  const PAGE = {
    matrix(c, t, W, H) {
      const s = t / 1000;
      bands(c, W, H, '#020905', '#041208', 16);
      rain(c, W, H, s, 10, 3, 0.55, 0, 1);
    },
    blood(c, t, W, H) {
      const s = t / 1000, g = 14;
      bands(c, W, H, '#0d0307', '#170509', 16);
      for (let r = 1; r * g < H; r++)
        for (let sg = 0; sg * 20 < W; sg++)
          if (rnd(10 + r, sg) < 0.55) R(c, sg * 20, r * g, 20, 1, '#ff3d5a', 0.09);
      for (let q = 1; q * g < W; q++)
        for (let sg = 0; sg * 20 < H; sg++)
          if (rnd(40 + q, sg) < 0.45) R(c, q * g, sg * 20, 1, 20, '#ff3d5a', 0.09);
      for (let q = 1; q * g < W; q++)
        for (let r = 1; r * g < H; r++)
          if (rnd(70 + q, r) < 0.1) { R(c, q * g - 1, r * g - 1, 3, 3, '#ff3d5a', 0.2); R(c, q * g, r * g, 1, 1, '#ffb0bc', 0.55); }
      for (let i = 0; i < 14; i++) {
        const row = 1 + Math.floor(rnd(100, i) * (Math.floor(H / g) - 1)), sp = 14 + rnd(101, i) * 22;
        const per = W + 24, x = mod(s * sp + rnd(102, i) * per, per) - 10, y = row * g;
        R(c, x - 8, y, 4, 1, '#ff3d5a', 0.18); R(c, x - 4, y, 3, 1, '#ff6a80', 0.4); R(c, x - 1, y - 0, 2, 1, '#ffd0d8', 0.85);
      }
    },
    violet(c, t, W, H) {
      const s = t / 1000;
      bands(c, W, H, '#07041a', '#110828', 16);
      for (let i = 0; i < 20; i++) R(c, rnd(120, i) * W, rnd(121, i) * H, 3 + Math.floor(rnd(122, i) * 6), 1, '#8a5cff', 0.07);
      hexy(c, W, H, s);
      rise(c, W, H, s, 26, 130, 3, 6, ['#b06cff', '#c590ff'], 0.18, 0.3, true);
      const ph = mod(s, 6.5);
      if (ph < 0.55) {
        const y = Math.floor(ph / 0.55 * H);
        R(c, 0, y, W, 2, '#c590ff', 0.10);
        R(c, mod(s * 40, W * 0.5), y + 2, W * 0.35, 1, '#e0c4ff', 0.12);
      }
    },
    space(c, t, W, H) {
      const s = t / 1000;
      bands(c, W, H, '#02030b', '#060a1c', 16);
      [[0.72, 0.3, 0.34, 0.22, '#4a3cff', 140], [0.2, 0.74, 0.28, 0.18, '#a03cff', 150]].forEach(b => {
        const cx = W * b[0], cy = H * b[1], rx = W * b[2], ry = H * b[3];
        [1, 0.68, 0.38].forEach(k => {
          for (let y = -ry * k; y <= ry * k; y += 3) {
            const w = rx * k * Math.sqrt(Math.max(0, 1 - (y / (ry * k)) ** 2));
            R(c, cx - w, cy + y, w * 2, 3, b[4], 0.035);
          }
        });
      });
      stars(c, W, H, s, 64, 160, 0, H, ['#cfe0ff', '#ffffff', '#9fc0ff']);
      const ph = mod(s, 7.5);
      if (ph < 0.7) {
        const k = ph / 0.7, x = W * 0.18 + k * W * 0.42, y = H * 0.08 + k * H * 0.26;
        R(c, x, y, 2, 1, '#ffffff', 0.95); R(c, x - 3, y - 1, 3, 1, '#cfe0ff', 0.5);
        R(c, x - 7, y - 2, 4, 1, '#9fc0ff', 0.28); R(c, x - 12, y - 3, 5, 1, '#9fc0ff', 0.12);
      }
    },
    temple(c, t, W, H) {
      const s = t / 1000;
      bands(c, W, H, '#0e0902', '#1a1105', 16);
      for (let i = 0; i < 2; i++) {
        const x0 = W * (0.25 + i * 0.4);
        for (let k = 0; k < 12; k++) R(c, x0 + k * (H / 12) * 0.35, k * (H / 12), 10, H / 12 + 1, '#ffd97a', 0.02);
      }
      [0.08, 0.28, 0.52, 0.74, 0.93].forEach(p => {
        const x = W * p, top = H * (0.5 + 0.06 * (p > 0.5 ? 1 : 0));
        R(c, x - 3, top, 6, H - top, '#c8a050', 0.07);
        R(c, x - 5, top - 2, 10, 2, '#c8a050', 0.11);
        R(c, x - 5, H - 3, 10, 3, '#c8a050', 0.11);
      });
      for (let x = 2, i = 0; x < W - 3; x += 6, i++) {
        const v = Math.floor(rnd(170, i) * 4);
        R(c, x, H - 7, 3, 1, '#ffd97a', 0.1);
        if (v === 0) R(c, x + 1, H - 6, 1, 3, '#ffd97a', 0.1);
        else if (v === 1) R(c, x, H - 5, 3, 1, '#ffd97a', 0.1);
        else if (v === 2) { R(c, x, H - 6, 1, 2, '#ffd97a', 0.1); R(c, x + 2, H - 6, 1, 2, '#ffd97a', 0.1); }
      }
      rise(c, W, H, s, 30, 180, 2, 4, ['#ffd97a', '#ffe9a8', '#e0b25a'], 0.15, 0.4, false);
    },
    vanoce(c, t, W, H) {
      const s = t / 1000;
      bands(c, W, H, '#03100a', '#071b10', 16);
      for (let x = 0, i = 0; x < W; x += 4, i++) { const h = 2 + Math.floor(rnd(190, i) * 3); R(c, x, H - h, 4, h, '#eaf6ff', 0.16); }
      snow(c, W, H, s, 56, 200, 0.55);
      const bulbs = ['#ff4a4a', '#ffd166', '#4adc7a', '#5cc9ff'];
      for (let x = 0; x < W; x += 6) R(c, x, Math.round(1 + Math.sin(x / W * Math.PI * 4)), 6, 1, '#2f5a3a', 0.8);
      for (let x = 6, i = 0; x < W - 3; x += 12, i++) {
        const y = 1 + Math.round(1 + Math.sin(x / W * Math.PI * 4));
        const on = 0.5 + 0.5 * Math.sin(s * 2.2 + i * 1.7) > 0.25;
        R(c, x - 1, y, 3, 3, bulbs[i % 4], on ? 0.2 : 0.06);
        R(c, x, y + 1, 1, 1, bulbs[i % 4], on ? 0.95 : 0.35);
      }
    },
    leto(c, t, W, H) {
      const s = t / 1000;
      bands(c, W, H, '#03121c', '#04202f', 16);      // jas základu < 0,014: i šedý text (muted) na něm drží 4,5 : 1
      const sx = W * 0.82, sy = H * 0.15;
      disc(c, sx, sy, 10, '#ffd166', 0.03); disc(c, sx, sy, 7, '#ffd166', 0.05); disc(c, sx, sy, 4, '#ffe9a0', 0.7);
      [[0.74, 0.35, 1.1], [0.84, 0.45, 1.6], [0.93, 0.55, 2.2]].forEach((L, li) => {
        for (let x = 0; x < W; x += 5) {
          const y = Math.round(H * L[0] + Math.sin(x * 0.12 + s * L[2]) * 1.6);
          R(c, x, y, 5, H - y, '#010a10', L[1]);                    // vlny jsou TMAVŠÍ než základ: vidět je, ale nezvyšují jas
          if (li < 2 && x % 25 === 0) R(c, x, y, 2, 1, '#6fd8f5', 0.2);
        }
      });
      for (let i = 0; i < 10; i++) {
        const x = rnd(210, i) * W, y = H * (0.76 + rnd(211, i) * 0.2);
        const a = Math.max(0, Math.sin(s * 2.4 + i * 2.1));
        if (a > 0.5) R(c, x, y, 1, 1, '#ffffff', a * 0.8);
      }
    }
  };

  /* ── nános v ARÉNĚ (W × H = plátno arény, hz = horizont, u = pixel; jen průhledné vrstvy) ── */
  const ARENA = {
    matrix(c, t, W, H, hz, u) {
      R(c, 0, 0, W, hz, '#00ff66', 0.05); R(c, 0, hz, W, H - hz, '#00ff66', 0.09);
      const s = t / 1000, step = 2 * u, cols = Math.floor(W / step);
      for (let i = 0; i < cols; i++) {
        if (rnd(20, i) < 0.65) continue;
        const sp = 40 + rnd(21, i) * 70, len = (8 + rnd(22, i) * 12) * u, per = H + len;
        const head = mod(s * sp + rnd(23, i) * per, per);
        R(c, i * step, head - len, u, len * 0.5, '#2be072', 0.14);
        R(c, i * step, head - len * 0.5, u, len * 0.4, '#2be072', 0.3);
        R(c, i * step, head - u * 2, u, u * 2, '#e4fff0', 0.6);
      }
    },
    blood(c, t, W, H, hz, u) {
      const s = t / 1000;
      R(c, 0, 0, W, hz, '#ff1030', 0.06); R(c, 0, hz, W, H - hz, '#ff1030', 0.09);
      R(c, 0, hz - u, W, u, '#ff3d5a', 0.3); R(c, 0, hz, W, u, '#ff3d5a', 0.14);
      for (let q = 1; q < 14; q++) R(c, q * W / 14, hz, 1, H - hz, '#ff3d5a', 0.08);
      for (let r = 1; r < 5; r++) R(c, 0, hz + (H - hz) * r * r / 25, W, 1, '#ff3d5a', 0.08);
      for (let i = 0; i < 12; i++) {
        const per = W + 40, x = mod(s * (50 + rnd(30, i) * 60) + rnd(31, i) * per, per) - 20;
        const y = hz + (H - hz) * (0.1 + 0.8 * rnd(32, i));
        R(c, x - 3 * u, y, 2 * u, 1, '#ff3d5a', 0.2); R(c, x - u, y, u * 2, 1, '#ffd0d8', 0.7);
      }
    },
    violet(c, t, W, H, hz, u) {
      const s = t / 1000;
      R(c, 0, 0, W, hz, '#8a3cff', 0.07); R(c, 0, hz, W, H - hz, '#8a3cff', 0.1);
      for (let i = 0; i < 16; i++) {
        const per = H + 20, y = per - mod(s * (14 + rnd(40, i) * 24) + rnd(41, i) * per, per) - 8;
        const x = rnd(42, i) * W + Math.sin(s * 0.8 + i) * 6, a = 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(s * 2 + i));
        R(c, x, y - u, u, 3 * u, '#c590ff', a); R(c, x - u, y, 3 * u, u, '#c590ff', a);
      }
    },
    space(c, t, W, H, hz, u) {
      const s = t / 1000;
      R(c, 0, 0, W, hz, '#2030ff', 0.06);
      [1, 0.65, 0.35].forEach(k => R(c, W * 0.58 - W * 0.3 * k, hz * 0.2 + hz * 0.18 * (1 - k), W * 0.6 * k, hz * 0.4 * k, '#6a50ff', 0.03));
      for (let i = 0; i < 30; i++) {
        const x = rnd(50, i) * W, y = rnd(51, i) * hz * 0.95;
        R(c, x, y, u, u, '#cfe0ff', 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(s * (1 + rnd(52, i) * 2) + i)));
      }
    },
    temple(c, t, W, H, hz, u) {
      const s = t / 1000;
      R(c, 0, 0, W, hz, '#ffb43c', 0.13); R(c, 0, hz, W, H - hz, '#ffb43c', 0.17);
      R(c, 0, hz - u, W, u, '#ffd97a', 0.22);
      [0.3, 0.64].forEach(p => { for (let k = 0; k < 8; k++) R(c, W * p + k * hz / 8 * 0.4, k * hz / 8, 3 * u, hz / 8 + 1, '#ffd97a', 0.06); });
      for (let i = 0; i < 22; i++) {
        const per = H + 20, y = per - mod(s * (8 + rnd(60, i) * 16) + rnd(61, i) * per, per) - 8;
        const big = i % 3 === 0 ? 2 : 1;
        R(c, rnd(62, i) * W + Math.sin(s * 0.6 + i) * 5, y, u * big, u * big, '#ffe9a8', 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(s * 2.4 + i * 2)));
      }
    },
    vanoce(c, t, W, H, hz, u) {
      const s = t / 1000;
      R(c, 0, 0, W, hz, '#00402a', 0.07); R(c, 0, hz, W, H - hz, '#eaf6ff', 0.06);
      for (let i = 0; i < 38; i++) {
        const big = rnd(70, i) < 0.35, per = H + 10, y = mod(s * ((big ? 28 : 16) + rnd(71, i) * 18) + rnd(72, i) * per, per) - 5;
        const x = mod(rnd(73, i) * W + Math.sin(s * 0.6 + i) * 6, W);
        R(c, x, y, big ? 2 * u : u, big ? 2 * u : u, '#eaf6ff', big ? 0.8 : 0.55);
      }
    },
    leto(c, t, W, H, hz, u) {
      const s = t / 1000;
      R(c, 0, 0, W, hz, '#0aa0d0', 0.07); R(c, 0, hz, W, H - hz, '#0aa0d0', 0.1);
      const sx = W * 0.8, sy = hz * 0.45;
      disc(c, sx, sy, 6 * u, '#ffd166', 0.05); disc(c, sx, sy, 4 * u, '#ffd166', 0.09); disc(c, sx, sy, 2 * u, '#ffe9a0', 0.6);
      [[0.06, 0.1, 1.2], [0.5, 0.14, 1.8]].forEach(L => {
        for (let x = 0; x < W; x += 4 * u) {
          const y = Math.round(hz + (H - hz) * L[0] + Math.sin(x * 0.05 + s * L[2]) * u * 1.2);
          R(c, x, y, 4 * u, 2 * u, '#4cc9f0', L[1]);
        }
      });
    }
  };

  /* ── veřejné čisté funkce (testy, ukázky) ── */
  const ma = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);   // `__proto__`, `constructor`… nejsou téma
  function frame(ctx, key, t, W, H) { if (ma(PAGE, key)) PAGE[key](ctx, t, W, H); }
  function arenaFrame(ctx, key, t, W, H, hz, u) { if (ma(ARENA, key)) ARENA[key](ctx, t, W, H, hz, u || Math.max(2, Math.round(W / 160))); }

  /* ── plátno stránky ── */
  let cv = null, cx = null, cur = '', raf = 0, last = 0, T0 = 0, nahledToken = 0;
  const rm = () => document.documentElement.classList.contains('reduced-motion') ||
    (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pxSize = () => (window.innerWidth < 600 ? 4 : 6);

  function fit() {
    if (!cv) return;
    const P = pxSize(), w = Math.max(1, Math.ceil(window.innerWidth / P)), h = Math.max(1, Math.ceil(window.innerHeight / P));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
  }
  function draw(t) {
    if (!cv || !ma(PAGE, cur)) return;
    if (!cx) fit();
    try { PAGE[cur](cx, t, cv.width, cv.height); cx.globalAlpha = 1; }
    catch (e) { teardown(); }
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (document.hidden || now - last < 66) return;
    last = now; draw(now - T0);
  }
  function teardown() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; cur = '';
    if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
    cv = cx = null;
  }
  function onResize() { if (cv) { fit(); draw(rm() ? STILL : performance.now() - T0); } }
  let resizeBound = false;

  /* Zapne pozadí tématu (`''`/neznámé téma = vypne). Vrací true, když se kreslí. */
  function apply(key) {
    if (!ma(PAGE, key)) { teardown(); return false; }
    if (!cv) {
      cv = document.createElement('canvas');
      cv.setAttribute('data-tema', key);
      cv.setAttribute('aria-hidden', 'true');
      cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;image-rendering:pixelated';
      document.body.insertBefore(cv, document.body.firstChild);
      T0 = performance.now();
      fit();
    }
    cur = key; cv.setAttribute('data-tema', key);
    if (!resizeBound) { resizeBound = true; window.addEventListener('resize', onResize); }
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (rm()) draw(STILL);
    else { last = 0; raf = requestAnimationFrame(tick); }
    return true;
  }

  /* Funkce pro jádro spritů (`setThemeFx`). Kreslí po pozadí světa, před postavami. */
  function arenaFx(key) {
    if (!ma(ARENA, key)) return null;
    return function (ctx, env) {
      const t = env.animOK ? env.now : STILL;
      ARENA[key](ctx, t, env.w, env.h, env.horizon, Math.max(2, Math.round(env.w / 160)));
      ctx.globalAlpha = 1;
    };
  }

  /* Náhled z obchodu: téma se na `ms` zapne (i bez vlastnictví) a pak se vrátí.
     `back` = klíč původního tématu, nebo funkce, která ho vrátí (čte se až po uplynutí času, takže
     dítě, které mezitím téma koupilo, o něj nepřijde). Nový náhled starý přebije. */
  function nahled(key, back, ms) {
    const tok = ++nahledToken, html = document.documentElement;
    html.dataset.theme = key; apply(key);
    setTimeout(function () {
      if (tok !== nahledToken) return;
      const b = (typeof back === 'function' ? back() : back) || '';
      html.dataset.theme = b; apply(b);
    }, ms || 4000);
  }

  return { KEYS, META, STILL, frame, arenaFrame, apply, arenaFx, nahled,
           current: () => cur, hasPage: k => ma(PAGE, k), hasArena: k => ma(ARENA, k) };
})();
