/* ═══════════════════════════════════════════════════════════════════════
   Efekty vítězství: pixelové částice přes celou obrazovku po porážce bosse (7 efektů z obchodu).

   Dřív se efekty lišily jen barvou stínu nápisu „VÍTĚZSTVÍ!“ a déšť emoji byl u všech stejný (změřeno 30. 10. 2026).
   Teď má každý efekt vlastní průběh a jméno z obchodu říká, co se děje (mince padají a odskakují, ohňostroj vybuchuje).
   Dva legendární (Výbuch bomby, Strom vítězství) jsou jen za životní úspěchy a nápis je součástí děje.

   `frame(ctx, id, t, W, H)` je ČISTÁ funkce: stejné `t` = stejné pixely, žádné Math.random, žádný stav mezi snímky.
   Proto ji používá hra, ukázka i test (otisk snímků). W × H jsou rozměry plátna v LOGICKÝCH pixelech
   (jeden logický pixel = S CSS pixelů, `image-rendering: pixelated`). Nápis zůstává v DOM, jak je dnes.
   ═══════════════════════════════════════════════════════════════════════ */
window.RPGVitezstvi = (function () {
  'use strict';
  const DUR = 2400;   // výchozí délka efektu (ms); dnes 1500
  const S = 4;        // CSS pixelů na jeden logický pixel
  const IDS = ['victory-default', 'victory-cyber', 'victory-neon', 'victory-coins', 'victory-fireworks', 'victory-bomb', 'victory-tree'];
  /* délka efektu a načasování nápisu „VÍTĚZSTVÍ!“ (zpoždění a délka jeho animace, ms); nápis zůstává v DOM */
  const META = {
    'victory-default': { dur: 2400, banner: { delay: 0, dur: 1500 }, still: 800 },
    'victory-cyber': { dur: 2400, banner: { delay: 0, dur: 1500 }, still: 800 },
    'victory-neon': { dur: 2400, banner: { delay: 0, dur: 1500 }, still: 800 },
    'victory-coins': { dur: 2400, banner: { delay: 0, dur: 1500 }, still: 1500 },
    'victory-fireworks': { dur: 2400, banner: { delay: 0, dur: 1500 }, still: 1300 },
    'victory-bomb': { dur: 2400, banner: { delay: 650, dur: 1600 }, still: 1000 },
    'victory-tree': { dur: 3200, banner: { delay: 1100, dur: 2000 }, still: 2200 }
  };
  const TAU = Math.PI * 2;

  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* jediné místo, které kreslí: celé logické pixely, barva a průhlednost */
  function malovat(ctx) {
    return function (x, y, w, h, c, a) {
      ctx.globalAlpha = a == null ? 1 : clamp(a, 0, 1);
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    };
  }

  /* křížek ze 5 pixelů — „jiskra“ */
  function jiskra(px, x, y, c, a) { px(x - 1, y, 3, 1, c, a); px(x, y - 1, 1, 3, c, a); }
  /* plný kruh po vodorovných pruzích (krok 1 nebo 2 px) — pixelový „míč“ nebo ohnivá koule */
  function kruh(px, x, y, r, c, a, krok) {
    krok = krok || 1;
    for (let dy = -r; dy <= r; dy += krok) { const h = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy))); px(x - h, y + dy, 2 * h + 1, krok, c, a); }
  }

  const EFEKTY = {
    /* ── Výchozí: pár zlatých jisker, nic dalšího ── */
    'victory-default'(px, t, W, H, cx, cy) {
      const r = rng(11);
      for (let i = 0; i < 26; i++) {
        const a = r() * TAU, sp = 22 + r() * 42, life = 900 + r() * 700, d = r() * 260, tau = t - d;
        if (tau < 0 || tau > life) continue;
        const k = tau / 1000;
        px(cx + Math.cos(a) * sp * k, cy + Math.sin(a) * sp * k - 6 * k, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2, ['#f4d03f', '#fff2a8', '#ffd966'][i % 3], 1 - tau / life);
      }
      for (let i = 0; i < 4; i++) {
        const u = ((t + i * 310) % 1100) / 1100;
        if (u < 0.5) jiskra(px, cx + (i - 1.5) * 38, cy + (i % 2 ? 9 : -11), '#fff2a8', Math.sin(u * Math.PI * 2) * clamp((1900 - t) / 400, 0, 1));
      }
    },

    /* ── Cyber výbuch: střepy do stran, glitch pruhy přes nápis, jeden slabý záblesk ── */
    'victory-cyber'(px, t, W, H, cx, cy) {
      if (t < 140) px(0, 0, W, H, '#ffffff', 0.22 * (1 - t / 140));
      /* dvě vlny střepů: velká hned, menší a pomalejší po 650 ms */
      [[0, 64, 23, 70, 190, 2.0], [650, 36, 29, 40, 110, 1.7]].forEach(function (w) {
        const r = rng(w[2]), k = (t - w[0]) / 1000;
        if (k < 0) return;
        for (let i = 0; i < w[1]; i++) {
          const a = r() * TAU, sp = w[3] + r() * w[4], sz = 2 + Math.floor(r() * 5), c = ['#ff3d7f', '#19e6e6', '#ffffff', '#ff3d7f'][i % 4];
          px(cx + Math.cos(a) * sp * k, cy + Math.sin(a) * sp * k + 60 * k * k, sz, i % 2 ? sz : Math.max(1, sz >> 1), c, clamp((w[5] - k) / 1.1, 0, 1));
        }
      });
      if (t < 520) {
        const q = rng(1000 + Math.floor(t / 70));
        for (let i = 0; i < 6; i++) px(cx - 80 + q() * 40, cy - 12 + Math.floor(q() * 24), 40 + q() * 80, 1 + Math.floor(q() * 2), i % 2 ? '#ff3d7f' : '#19e6e6', 0.55);
      }
    },

    /* ── Neon záření: tři tečkované kruhy se rozbíhají od středu, kolem nápisu bliká neon ── */
    'victory-neon'(px, t, W, H, cx, cy) {
      for (let k = 0; k < 5; k++) {
        const tau = t - k * 280;
        if (tau < 0 || tau > 1400) continue;
        const rad = 8 + tau * 0.09, off = k * 0.4 + tau * 0.0006, sz = tau < 600 ? 3 : 2;
        for (let i = 0; i < 40; i++) {
          const a = off + (i / 40) * TAU;
          px(cx + Math.cos(a) * rad * 1.5, cy + Math.sin(a) * rad * 0.8, sz, sz, i % 6 === 0 ? '#d9ffec' : '#39ff9e', 1 - tau / 1400);
        }
      }
      const r = rng(31);
      for (let i = 0; i < 22; i++) {
        const a = r() * TAU, d = 18 + r() * 70, ph = r() * 700, u = ((t + ph) % 700) / 700;
        if (t > 300 && t < DUR - 300 && u < 0.55) jiskra(px, cx + Math.cos(a) * d * 1.7, cy + Math.sin(a) * d * 0.75, i % 3 ? '#39ff9e' : '#d9ffec', Math.sin((u / 0.55) * Math.PI));
      }
    },

    /* ── Zlatý déšť mincí: pixelové mince se točí, dopadnou, dvakrát odskočí a blýskají ── */
    'victory-coins'(px, t, W, H, cx, cy) {
      const r = rng(41), g = 0.00055, KROK = [8, 6, 4, 2, 4, 6];  // 40 mincí, začínají padat postupně až do 1,1 s
      const konec = clamp((DUR - t) / 500, 0, 1);
      for (let i = 0; i < 40; i++) {
        const x = r() * W, d = r() * 1100, vy0 = r() * 0.02, tau = t - d, dno = H - 8 - (i % 5) * 2;
        if (tau < 0) continue;
        let pos = -8, vel = vy0, tt = tau, y = dno, vzduchu = false;
        for (let b = 0; b < 3; b++) {
          const Tb = (-vel + Math.sqrt(vel * vel + 2 * g * (dno - pos))) / g;
          if (tt <= Tb) { y = pos + vel * tt + 0.5 * g * tt * tt; vzduchu = true; break; }
          tt -= Tb; vel = -(vel + g * Tb) * 0.42; pos = dno;
        }
        const w = vzduchu ? KROK[Math.floor(tau / 90) % 6] : 8, x0 = x - w / 2;
        px(x0, y, w, 8, '#b8860b', konec);
        if (w > 2) px(x0 + 1, y + 1, w - 2, 6, '#f4d03f', konec);
        if (w >= 6) px(x0 + 2, y + 2, 1, 2, '#fff2a8', konec);
      }
      const q = rng(43);
      for (let i = 0; i < 10; i++) {
        const sx = q() * W, sy = H - 12 - q() * 26, u = ((t + q() * 800) % 800) / 800;
        if (t > 700 && u < 0.4) jiskra(px, sx, sy, '#fff2a8', Math.sin((u / 0.4) * Math.PI) * konec);
      }
    },

    /* ── Ohňostroj: pět střel vystoupí a vybuchnou do hvězd ── */
    'victory-fireworks'(px, t, W, H, cx, cy) {
      const START = [0, 260, 520, 800, 1100], XS = [0.5, 0.25, 0.75, 0.38, 0.64], VYSKA = [0.22, 0.30, 0.18, 0.34, 0.26], RISE = 480;
      const PAL = [['#ffd75e', '#fff2a8'], ['#5cc9ff', '#d9f2ff'], ['#ff3d7f', '#ffb3cf'], ['#b18cff', '#e6d9ff'], ['#39ff9e', '#d9ffec']];
      for (let k = 0; k < 5; k++) {
        const tau = t - START[k], ax = Math.round(XS[k] * W), ay = Math.round(VYSKA[k] * H);
        if (tau < 0) continue;
        if (tau < RISE) {
          const u = tau / RISE, e = 1 - (1 - u) * (1 - u), y = H - 4 - (H - 4 - ay) * e;
          px(ax, y, 2, 3, '#ffffff');
          for (let j = 1; j <= 7; j++) px(ax, y + j * 3, 1, 2, PAL[k][0], 1 - j / 8);
        } else {
          const s = tau - RISE, zivot = Math.min(1200, DUR - START[k] - RISE);
          if (s > zivot) continue;
          if (s < 90) px(ax - 2, ay - 2, 5, 5, '#ffffff');
          const r = rng(500 + k), kruh = k % 2 === 0;
          for (let i = 0; i < 44; i++) {
            const a = r() * TAU, sp = kruh ? 72 + r() * 10 : 20 + r() * 76, q = s / 1000;
            if (s > 700 && (Math.floor(s / 60) + i) % 4 === 0) continue;
            px(ax + Math.cos(a) * sp * q, ay + Math.sin(a) * sp * q + 60 * q * q, s < 800 ? 2 : 1, s < 800 ? 2 : 1, PAL[k][i % 2], 1 - s / zivot);
          }
        }
      }
    },

    /* ── Výbuch bomby (legendární): bomba spadne, exploze, v ní vyskočí nápis ── */
    'victory-bomb'(px, t, W, H, cx, cy) {
      const BOOM = 650, by = cy + 4;
      if (t < BOOM) {
        const u = t / BOOM, y = -12 + (by + 12) * u * u;
        kruh(px, cx, y, 5, '#1b1f2a');
        px(cx - 3, y - 3, 2, 2, '#5a6478'); px(cx - 2, y - 8, 5, 2, '#3a4152'); px(cx + 1, y - 11, 1, 3, '#b08a4a');
        const b = Math.floor(t / 70) % 2;
        px(cx, y - 14, 3, 3, b ? '#ffd75e' : '#ff7a00');
        const r = rng(61);
        for (let i = 0; i < 6; i++) { const k = ((t + r() * 300) % 300) / 300; px(cx + 1 + (r() - 0.5) * 8 * k, y - 14 - k * 9, 1, 1, '#ffd75e', 1 - k); }
        return;
      }
      const s = t - BOOM;
      if (s < 140) px(0, 0, W, H, '#ffffff', 0.25 * (1 - s / 140));
      const e = 1 - Math.pow(1 - Math.min(1, s / 300), 3), fa = 1 - clamp((s - 500) / 700, 0, 1), R = Math.round(50 * e);
      if (fa > 0 && R > 1) {
        kruh(px, cx, by, R, '#b3260a', fa * 0.95, 2);
        kruh(px, cx, by, Math.round(R * 0.78), '#ff6a00', fa, 2);
        kruh(px, cx, by, Math.round(R * 0.5), '#ffc21a', fa, 2);
        kruh(px, cx, by, Math.round(R * 0.25), '#fff3b0', fa, 2);
      }
      if (s < 700) for (let i = 0; i < 56; i++) { const a = (i / 56) * TAU; px(cx + Math.cos(a) * (10 + s * 0.4) * 1.5, by + Math.sin(a) * (10 + s * 0.4) * 0.8, 3, 3, i % 4 ? '#ffd75e' : '#ffffff', 1 - s / 700); }
      const r = rng(67), q = s / 1000;
      for (let i = 0; i < 46; i++) {
        const a = r() * TAU, sp = 60 + r() * 170, sz = 2 + Math.floor(r() * 3);
        px(cx + Math.cos(a) * sp * q, by + Math.sin(a) * sp * q + 120 * q * q, sz, sz, ['#1b1f2a', '#ff6a00', '#ffc21a', '#5a6478'][i % 4], 1 - s / 1500);
      }
      const m = rng(71);
      for (let i = 0; i < 14; i++) {
        const x0 = cx + (m() - 0.5) * 70, sp = 8 + m() * 14, d = 250 + m() * 300, tau = s - d;
        if (tau > 0 && tau < 1300) px(x0, by - 6 - tau * sp / 1000, 5, 5, '#3a4152', 0.55 * (1 - tau / 1300));
      }
    },

    /* ── Strom vítězství (legendární, za úspěch): semínko, kmen, koruna a v ní nápis ── */
    'victory-tree'(px0, t, W, H, cx, cy) {
      const D = 3200, f = clamp((D - t) / 500, 0, 1), px = (x, y, w, h, c, a) => px0(x, y, w, h, c, (a == null ? 1 : a) * f);
      const ZEM = H - 12, TOP = cy + 18;
      if (t < 440) { const y = -6 + (ZEM + 4) * Math.pow(t / 440, 2); px(cx - 1, y, 3, 4, '#7a4a1c'); px(cx, y - 2, 1, 2, '#6fd36a'); }
      if (t >= 440) {
        px(cx - 7, ZEM + 1, 15, 2, '#5a3a1a'); px(cx - 4, ZEM, 9, 1, '#6b4a22');
        const r = rng(73);
        for (let i = 0; i < 9; i++) { const tau = t - 440 - r() * 80, a = Math.PI * (1 + r()); if (tau > 0 && tau < 500) px(cx + Math.cos(a) * tau * 0.05, ZEM + Math.sin(a) * tau * 0.03, 2, 2, '#8a6a3a', 1 - tau / 500); }
      }
      const g = clamp((t - 480) / 650, 0, 1), ge = 1 - (1 - g) * (1 - g), vyska = Math.round((ZEM - TOP) * ge);
      if (vyska > 0) {
        const spod = Math.min(vyska, Math.round((ZEM - TOP) * 0.5));
        px(cx - 5, ZEM - spod, 10, spod, '#6b3f1d'); px(cx - 5, ZEM - spod, 3, spod, '#4a2a12'); px(cx + 1, ZEM - spod, 1, spod, '#9a6a3a');
        if (vyska > spod) { const h2 = vyska - spod; px(cx - 3, ZEM - vyska, 7, h2, '#6b3f1d'); px(cx - 3, ZEM - vyska, 2, h2, '#4a2a12'); px(cx + 1, ZEM - vyska, 1, h2, '#9a6a3a'); }
        for (let k = 0; k < 6; k++) if (vyska > 14 * (k + 1)) px(cx - 3 + (k % 2) * 3, ZEM - 14 * (k + 1), 2, 3, '#3a200c');
      }
      const vet = clamp((t - 950) / 500, 0, 1);
      if (vet > 0) [-1, 1].forEach(function (d) { const n = Math.round(8 * vet); for (let j = 0; j < n; j++) px(cx + d * (4 + j * 3) - 1, TOP + 2 - j * 2, 3, 3, '#6b3f1d'); });
      /* koruna: pět plných koulí (základ) + světlejší koule nahoře vlevo + listí na okraji */
      const KOULE = [[0, -2, 30], [-38, 2, 24], [38, 2, 24], [-18, -14, 22], [20, -14, 22]];
      KOULE.forEach(function (k, n) {
        const u = clamp((t - (950 + n * 110)) / 450, 0, 1);
        if (u <= 0) return;
        const e = 1 - Math.pow(1 - u, 2), r = Math.round(k[2] * e), x = cx + k[0], y = cy + k[1];
        kruh(px, x, y, r, '#2e8b3a', 1, 3);
        kruh(px, x - Math.round(k[2] * 0.12), y - Math.round(k[2] * 0.2), Math.round(r * 0.62), '#3fae4f', 1, 4);
      });
      const L = rng(77);
      for (let i = 0; i < 72; i++) {
        const a = L() * TAU, rr = 0.6 + L() * 0.45, x = cx + Math.cos(a) * rr * 66, y = cy - 4 + Math.sin(a) * rr * 38, ap = 1150 + L() * 700, sz = i % 3 ? 4 : 3, u = clamp((t - ap) / 160, 0, 1);
        if (u > 0) px(x, y, u < 1 ? 2 : sz, u < 1 ? 2 : sz, i % 2 ? '#a6f08a' : '#6fd36a');
      }
      const B = rng(79);
      for (let i = 0; i < 14; i++) {
        const x = cx + (B() - 0.5) * 130, y = cy - 4 + (B() - 0.5) * 66, ph = B() * 900;
        if (t > 1750 && ((t + ph) % 900) < 450) px(x, y, 2, 2, i % 2 ? '#ffd75e' : '#ff7aa8');
      }
      const F = rng(83);
      for (let i = 0; i < 14; i++) {
        const x0 = cx + (F() - 0.5) * 130, y0 = cy - 4 + (F() - 0.5) * 50, t0 = 1900 + F() * 700, tau = t - t0;
        if (tau > 0) { const y = y0 + tau * 0.03; if (y < ZEM) px(x0 + Math.sin(tau / 220 + i) * 5, y, 3, 3, i % 3 ? '#6fd36a' : '#a6f08a', 1 - tau / 1100); }
      }
    }
  };

  /* jeden snímek: W × H v logických pixelech, t v ms */
  function frame(ctx, id, t, W, H) {
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    const f = EFEKTY[id] || EFEKTY['victory-default'];
    f(malovat(ctx), t, W, H, Math.round(W / 2), Math.round(H * 0.38));
    ctx.globalAlpha = 1;
  }

  /* hra: plátno přes celou obrazovku, nechytá dotyk, po DUR zmizí; pod reduced-motion jediný statický snímek */
  let aktualni = null;
  function play(id, opts) {
    opts = opts || {};
    if (aktualni) aktualni.stop();
    if (!META[id]) id = 'victory-default';   // neznámé jméno (starý save) = výchozí efekt
    const nadpis = opts.banner || null;
    const cv = document.createElement('canvas');
    const W = Math.ceil(innerWidth / S), H = Math.ceil(innerHeight / S);
    cv.width = W; cv.height = H;
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:107;pointer-events:none;image-rendering:pixelated';
    cv.setAttribute('aria-hidden', 'true');
    cv.dataset.vitezstvi = id;   // pro testy a ladění: který efekt se právě kreslí
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const M = META[id] || META['victory-default'];
    const klid = opts.still === true || document.documentElement.classList.contains('reduced-motion') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    let hotovo = false, raf = 0, tm = 0, tmN = 0;
    const h = { stop() { if (hotovo) return; hotovo = true; cancelAnimationFrame(raf); clearTimeout(tm); clearTimeout(tmN); cv.remove(); if (nadpis) nadpis.remove(); if (aktualni === h) aktualni = null; } };
    aktualni = h;
    /* nápis „VÍTĚZSTVÍ!“ zůstává v DOM; modul mu dá načasování (u legendárních se objeví až v průběhu efektu) a sám ho odstraní */
    if (nadpis) {
      if (klid) { nadpis.style.animation = 'none'; nadpis.style.opacity = '1'; tmN = setTimeout(function () { nadpis.remove(); }, 1500); }
      else { nadpis.style.animation = 'vict ' + M.banner.dur + 'ms ease-out ' + M.banner.delay + 'ms both'; tmN = setTimeout(function () { nadpis.remove(); }, M.banner.delay + M.banner.dur + 100); }
    }
    if (klid) { frame(ctx, id, M.still, W, H); tm = setTimeout(h.stop, 1500); return h; }
    const t0 = performance.now();
    (function krok(now) {
      if (hotovo) return;
      const t = now - t0;
      if (t >= M.dur) return h.stop();
      frame(ctx, id, t, W, H);
      raf = requestAnimationFrame(krok);
    })(t0);
    tm = setTimeout(h.stop, M.dur + 800);   // jistota, kdyby se rAF zastavil (skrytá karta)
    return h;
  }

  /* ukázka z obchodu: vlastní nápis s třídou efektu (`cssKey` z katalogu) a stejný průběh jako po vítězství */
  function ukaz(id, cssKey) {
    const b = document.createElement('div');
    b.className = 'victory-banner' + (cssKey ? ' ' + cssKey : '');
    b.textContent = '⚔ VÍTĚZSTVÍ! ⚔';
    document.body.appendChild(b);
    return play(id, { banner: b });
  }

  return { DUR, S, IDS, META, frame, play, ukaz };
})();
