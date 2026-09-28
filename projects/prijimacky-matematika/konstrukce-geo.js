/* ══════════════════════════════════════════════════════════════════
   GEOMETRIE PRO KONSTRUKČNÍ ÚLOHY (přijímačky, úlohy 9 a 10)

   Čistý výpočet bez DOM — běží v prohlížeči i v Node testech.
   Souřadnice jsou jednotky viewBoxu kreslicího okna (y roste DOLŮ),
   okno má 400 × 300 jednotek a 1 cm = 30 jednotek (13,3 × 10 cm).

   Tvary:  bod {typ:'bod', p}          úsečka {typ:'usecka', p, q}
           přímka {typ:'primka', p, q} (nekonečná; p, q určují polohu)
           kružnice {typ:'kruznice', c, r[, od, rozpeti]} — s `od`
             (počáteční úhel) a `rozpeti` (opsaný úhel se znaménkem) je
             to oblouk; hodnotí se ale jako celá kružnice
           kresba {typ:'kresba', body} — tah, který nic nepřipomíná;
             zobrazí se, ale nehodnotí

   Hodnotí se VÝSLEDEK jako v klíči CERMAT („bod C leží na polopřímce DA
   a úhel DCB je pravý"): kde leží označené body a kolik řešení žák našel.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CM = 30, W = 400, H = 300;
  const EPS = 1e-9;
  const bod = (x, y) => ({ x, y });
  const odecti = (a, b) => bod(a.x - b.x, a.y - b.y);
  const secti = (a, b) => bod(a.x + b.x, a.y + b.y);
  const nasob = (a, k) => bod(a.x * k, a.y * k);
  const skal = (a, b) => a.x * b.x + a.y * b.y;
  const vekt = (a, b) => a.x * b.y - a.y * b.x;
  const delka = a => Math.hypot(a.x, a.y);
  const vzdal = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const stred = (a, b) => bod((a.x + b.x) / 2, (a.y + b.y) / 2);
  const jednot = a => { const d = delka(a); return d < EPS ? bod(0, 0) : bod(a.x / d, a.y / d); };
  const uhel = (c, x) => Math.atan2(x.y - c.y, x.x - c.x);

  // Pata kolmice z bodu x na přímku pq
  function pata(x, p, q) {
    const u = odecti(q, p), t = skal(odecti(x, p), u) / (skal(u, u) || EPS);
    return secti(p, nasob(u, t));
  }
  const vzdalOdPrimky = (x, p, q) => vzdal(x, pata(x, p, q));
  function vzdalOdUsecky(x, p, q) {
    const u = odecti(q, p), t = Math.max(0, Math.min(1, skal(odecti(x, p), u) / (skal(u, u) || EPS)));
    return vzdal(x, secti(p, nasob(u, t)));
  }
  // Obrazy v souměrnostech
  const osove = (x, p, q) => { const f = pata(x, p, q); return bod(2 * f.x - x.x, 2 * f.y - x.y); };
  const stredove = (x, s) => bod(2 * s.x - x.x, 2 * s.y - x.y);

  // ── průsečíky (přímky nekonečné; úsečky a oblouky ořezává `pruseciky`) ──
  function prusecikPP(p1, q1, p2, q2) {
    const r = odecti(q1, p1), s = odecti(q2, p2), d = vekt(r, s);
    if (Math.abs(d) < 1e-9 * (delka(r) * delka(s) + 1)) return null;   // rovnoběžky
    return secti(p1, nasob(r, vekt(odecti(p2, p1), s) / d));
  }
  function prusecikyPK(p, q, c, r) {
    const f = pata(c, p, q), d = vzdal(c, f);
    if (d > r + 1e-7) return [];
    const h = Math.sqrt(Math.max(0, r * r - d * d)), u = jednot(odecti(q, p));
    if (h < 1e-7) return [f];
    return [secti(f, nasob(u, -h)), secti(f, nasob(u, h))];
  }
  function prusecikyKK(c1, r1, c2, r2) {
    const d = vzdal(c1, c2);
    if (d < EPS || d > r1 + r2 + 1e-7 || d < Math.abs(r1 - r2) - 1e-7) return [];
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const u = jednot(odecti(c2, c1)), m = secti(c1, nasob(u, a)), n = bod(-u.y, u.x);
    if (h < 1e-7) return [m];
    return [secti(m, nasob(n, h)), secti(m, nasob(n, -h))];
  }
  function naTvaru(t, x, rez) {
    if (t.typ === 'usecka') return vzdalOdUsecky(x, t.p, t.q) <= rez + 1e-6;
    return t.typ === 'primka' || t.typ === 'kruznice';
  }
  const linearni = t => t.typ === 'usecka' || t.typ === 'primka';
  // Průsečíky dvou tvarů. Úsečka se ořeže s rezervou `rez` (žák ji mohl
  // nakreslit o kousek kratší); oblouk se bere jako celá kružnice.
  function pruseciky(a, b, rez) {
    let out = [];
    if (linearni(a) && linearni(b)) { const x = prusecikPP(a.p, a.q, b.p, b.q); if (x) out = [x]; }
    else if (linearni(a) && b.typ === 'kruznice') out = prusecikyPK(a.p, a.q, b.c, b.r);
    else if (a.typ === 'kruznice' && linearni(b)) out = prusecikyPK(b.p, b.q, a.c, a.r);
    else if (a.typ === 'kruznice' && b.typ === 'kruznice') out = prusecikyKK(a.c, a.r, b.c, b.r);
    return out.filter(x => naTvaru(a, x, rez || 0) && naTvaru(b, x, rez || 0));
  }

  // Soustava 3×3 Cramerovým pravidlem; null, když je singulární.
  function resit3(M, v, eps) {
    const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const d0 = det(M);
    if (Math.abs(d0) < eps) return null;
    const sl = i => M.map((r, k) => r.map((x, j) => (j === i ? v[k] : x)));
    return [det(sl(0)) / d0, det(sl(1)) / d0, det(sl(2)) / d0];
  }
  /* Kružnice tahem. Nejdřív algebraicky (Kåsa: x² + y² + Dx + Ey + F = 0),
     pak pár kroků Gauss–Newtona na skutečné vzdálenosti od kružnice. Kåsa
     sám u krátkých zašuměných oblouků poloměr zmenšuje; naměřeno u oblouků
     45°–90° se šumem 1,5 jednotky: poloměr do 10 % v 64 % případů, po
     doladění v 82 %. U oblouků nad 180° je to jedno (oba 100 %). */
  function fitKruznice(pts) {
    let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sz = 0, sxz = 0, syz = 0;
    const n = pts.length;
    for (const p of pts) {
      const z = p.x * p.x + p.y * p.y;
      sx += p.x; sy += p.y; sxx += p.x * p.x; syy += p.y * p.y; sxy += p.x * p.y; sz += z; sxz += p.x * z; syz += p.y * z;
    }
    const DEF = resit3([[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]], [-sxz, -syz, -sz], 1e-6);
    if (!DEF) return null;
    let cx = -DEF[0] / 2, cy = -DEF[1] / 2;
    const r2 = cx * cx + cy * cy - DEF[2];
    if (!(r2 > 0)) return null;
    let r = Math.sqrt(r2);
    for (let it = 0; it < 15; it++) {
      const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
      for (const p of pts) {
        const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || EPS, res = d - r, j = [-dx / d, -dy / d, -1];
        for (let i = 0; i < 3; i++) { b[i] -= j[i] * res; for (let k = 0; k < 3; k++) A[i][k] += j[i] * j[k]; }
      }
      const krok = resit3(A, b, 1e-12);
      if (!krok || !(r + krok[2] > 0)) break;
      cx += krok[0]; cy += krok[1]; r += krok[2];
      if (Math.abs(krok[0]) + Math.abs(krok[1]) + Math.abs(krok[2]) < 1e-6) break;
    }
    return { c: bod(cx, cy), r };
  }

  /* Rozpoznání tahu od ruky. Klepnutí a malá značka (tečka, čárka, křížek
     do 14 jednotek ≈ 5 mm) → bod; pak se tah změří jako přímka i jako
     kružnice. Oblouk = sedí na kružnici a opíše aspoň 30° (na papíře se
     kreslí právě krátké oblouky); úsečka = drží se v pásu kolem hlavního
     směru a nevrací se. Když sedí obojí, vyhraje kružnice jen tehdy, když
     tah vystihuje výrazně líp — mírně prohnutá rovná čára tak zůstane
     úsečkou. Cokoli jiného zůstane volnou kresbou. */
  function rozpoznej(vstup) {
    const pts = [];
    for (const x of vstup || []) if (!pts.length || vzdal(x, pts[pts.length - 1]) > 0.3) pts.push(bod(x.x, x.y));
    if (!pts.length) return null;
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += vzdal(pts[i], pts[i - 1]);
    const tez = pts.reduce((a, x) => bod(a.x + x.x / pts.length, a.y + x.y / pts.length), bod(0, 0));
    if (L < 6) return { typ: 'bod', p: tez };
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const x of pts) { x0 = Math.min(x0, x.x); x1 = Math.max(x1, x.x); y0 = Math.min(y0, x.y); y1 = Math.max(y1, x.y); }
    if (Math.max(x1 - x0, y1 - y0) <= 14) return { typ: 'bod', p: tez };
    // přímka: hlavní směr z kovariance, odchylky kolmo na něj
    let sxx = 0, syy = 0, sxy = 0;
    for (const x of pts) { const dx = x.x - tez.x, dy = x.y - tez.y; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), u = bod(Math.cos(th), Math.sin(th)), n = bod(-u.y, u.x);
    let maxOdch = 0, ctvL = 0, smin = Infinity, smax = -Infinity;
    for (const x of pts) {
      const d = skal(odecti(x, tez), n), s = skal(odecti(x, tez), u);
      maxOdch = Math.max(maxOdch, Math.abs(d)); ctvL += d * d; smin = Math.min(smin, s); smax = Math.max(smax, s);
    }
    const rmsL = Math.sqrt(ctvL / pts.length), rozsah = smax - smin;
    const a = pts[0], b = pts[pts.length - 1];
    /* „Nevrací se" se měří PRŮMĚTEM konců na hlavní směr, ne délkou dráhy:
       třes ruky dráhu prodlouží (naměřeno až o 10 % při šumu 1,2 jednotky),
       takže poměr tětiva : dráha odmítal čtvrtinu rovných čar. */
    const rovna = Math.abs(skal(odecti(b, a), u)) >= 0.9 * rozsah && maxOdch <= Math.max(3, 0.05 * rozsah);
    let oblouk = null;
    const k = fitKruznice(pts);
    if (k && k.r >= 8 && k.r <= 900) {
      let ctv = 0;
      for (const x of pts) ctv += (vzdal(x, k.c) - k.r) ** 2;
      const rms = Math.sqrt(ctv / pts.length);
      let sw = 0, pu = uhel(k.c, pts[0]);
      for (let i = 1; i < pts.length; i++) {
        const cu = uhel(k.c, pts[i]); let d = cu - pu;
        if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
        sw += d; pu = cu;
      }
      if (rms <= Math.max(2.5, 0.08 * k.r) && Math.abs(sw) >= Math.PI / 6) oblouk = { k, rms, sw };
    }
    if (oblouk && (!rovna || oblouk.rms < 0.6 * rmsL)) {
      const { k: kr, sw } = oblouk;
      return Math.abs(sw) >= 2 * Math.PI * 0.9 ? { typ: 'kruznice', c: kr.c, r: kr.r }
        : { typ: 'kruznice', c: kr.c, r: kr.r, od: uhel(kr.c, pts[0]), rozpeti: sw };
    }
    if (rovna) {
      const pr = x => secti(tez, nasob(u, skal(odecti(x, tez), u)));
      return { typ: 'usecka', p: pr(a), q: pr(b) };
    }
    return { typ: 'kresba', body: pts };
  }

  /* Body, ke kterým se přichytává: zadané a nakreslené body, konce úseček
     a průsečíky všech čar. Díky tomu „od ruky" vyjde přesně tam, kam žák
     mířil, a klepnutí na průsečík sedí na průsečík. */
  function prichytne(tvary, dane) {
    const out = [];
    for (const p of dane || []) out.push(p);
    const cary = tvary.filter(t => t.typ === 'usecka' || t.typ === 'primka' || t.typ === 'kruznice');
    for (const t of tvary) {
      if (t.typ === 'bod') out.push(t.p);
      if (t.typ === 'usecka') { out.push(t.p); out.push(t.q); }
    }
    for (let i = 0; i < cary.length; i++) for (let j = i + 1; j < cary.length; j++) for (const x of pruseciky(cary[i], cary[j], 6)) out.push(x);
    return out;
  }
  function nejblizsi(x, body, dosah) {
    let best = null, bd = dosah;
    for (const p of body) { const d = vzdal(x, p); if (d <= bd) { bd = d; best = p; } }
    return best;
  }
  /* Přichycení nového tvaru. Konce úsečky a střed kružnice k bodům; úsečka
     vedená skoro přes dva body jde přesně přes ně; kružnice, která skoro
     prochází bodem, jím projde (typicky „kružnice se středem A přes B"). */
  function prichyt(t, body, dosah) {
    const D = dosah || 10;
    if (!t) return t;
    if (t.typ === 'bod') { const s = nejblizsi(t.p, body, D); return s ? { typ: 'bod', p: bod(s.x, s.y) } : t; }
    if (t.typ === 'usecka') {
      const ps = nejblizsi(t.p, body, D), qs = nejblizsi(t.q, body, D);
      let p = ps || t.p, q = qs || t.q;
      if (!(ps && qs)) {
        // kotvy = přichycené konce + body, přes které tah vede; úsečka pak
        // jde přesně přes dvě nejvzdálenější kotvy, volné konce se promítnou
        const kotvy = [ps, qs].filter(Boolean);
        for (const x of body) if (kotvy.indexOf(x) === -1 && vzdalOdUsecky(x, t.p, t.q) <= D * 0.8) kotvy.push(x);
        if (kotvy.length >= 2) {
          const k1 = kotvy[0];
          const k2 = kotvy.slice(1).sort((a, b) => vzdal(b, k1) - vzdal(a, k1))[0];
          if (vzdal(k1, k2) > 2 * D) {
            const u = jednot(odecti(k2, k1)), pr = x => secti(k1, nasob(u, skal(odecti(x, k1), u)));
            if (!ps) p = pr(t.p);
            if (!qs) q = pr(t.q);
          }
        }
      }
      return { typ: 'usecka', p: bod(p.x, p.y), q: bod(q.x, q.y) };
    }
    if (t.typ === 'kruznice') {
      const c = nejblizsi(t.c, body, D) || t.c;
      let r = t.r;
      const pres = body.filter(x => vzdal(x, c) > D && Math.abs(vzdal(x, c) - r) <= D * 0.8)
        .sort((a, b) => Math.abs(vzdal(a, c) - r) - Math.abs(vzdal(b, c) - r))[0];
      if (pres) r = vzdal(pres, c);
      const k = Object.assign({}, t, { c: bod(c.x, c.y), r });
      return k;
    }
    return t;
  }

  /* Vyhodnocení. Kandidáti na výsledek = označené body a konce úseček
     (kdo narýsuje trojúhelník ABC, má C v konci stran, i když ho zvlášť
     neoznačí). Řešení je nalezené, když má KAŽDÝ jeho hledaný bod
     kandidáta v toleranci. Body navíc se jen hlásí — pomocné body jsou
     na papíře běžné — a trestají se až při zjevném „kropení". */
  function kandidati(tvary) {
    const kand = [];
    for (const t of tvary || []) {
      if (t.typ === 'bod') kand.push({ p: t.p, oznaceny: true });
      else if (t.typ === 'usecka') { kand.push({ p: t.p }); kand.push({ p: t.q }); }
    }
    return kand;
  }
  function vyhodnot(u, tvary, tol) {
    const T = tol || u.tol || 10;
    const kand = kandidati(tvary);
    const reseni = u.reseni.map(s => Object.keys(s).every(k => kand.some(c => vzdal(c.p, s[k]) <= T)));
    const nalezeno = reseni.filter(Boolean).length;
    const vyznamne = [].concat(Object.values(u.dane.body || {}), ...u.reseni.map(s => Object.values(s)), u.pomocne || []);
    const navic = kand.filter(c => c.oznaceny && !vyznamne.some(v => vzdal(v, c.p) <= T)).length;
    const hledanych = u.reseni.reduce((s, r) => s + Object.keys(r).length, 0);
    const kropeni = navic > Math.max(3, hledanych);
    return { nalezeno, celkem: u.reseni.length, reseni, navic, kropeni, spravne: nalezeno === u.reseni.length && !kropeni };
  }

  /* Bodování v testu nanečisto podle klíčů CERMAT (M9C/2025 ú. 10,
     M9A/2025 ú. 9–10, M9A/2026 ú. 9–10): plný počet = všechna řešení
     přesně; o bod méně = všechna s mírnou nepřesností, nebo jen část
     řešení přesně; o dva méně = jen část řešení s mírnou nepřesností,
     nebo jen část hledaných bodů („správně jsou sestrojeny pouze oba
     body D"); jinak 0. Body „pro jistotu" (kropení) = zcela chybná
     konstrukce, 0 b. Hranice přesnosti CERMAT nezveřejňuje: „přesně"
     je tolerance procvičování (10 jednotek ≈ 3 mm), mírná nepřesnost
     do 18 jednotek (6 mm). */
  const TOL_PRESNE = 10, TOL_MIRNE = 18;
  // Stav každého řešení: 'presne' | 'mirne' | 'cast' (jen některé hledané body) | null
  function stavReseni(u, tvary) {
    const kand = kandidati(tvary);
    return u.reseni.map(s => {
      const d = Object.keys(s).map(k => kand.reduce((m, c) => Math.min(m, vzdal(c.p, s[k])), Infinity));
      if (d.every(x => x <= TOL_PRESNE)) return 'presne';
      if (d.every(x => x <= TOL_MIRNE)) return 'mirne';
      return d.some(x => x <= TOL_MIRNE) ? 'cast' : null;
    });
  }
  function bodovat(u, tvary, max) {
    const stav = stavReseni(u, tvary), n = stav.length;
    const pocet = s => stav.filter(x => x === s).length;
    const presne = pocet('presne'), mirne = pocet('mirne'), cast = pocet('cast');
    const v = vyhodnot(u, tvary, TOL_PRESNE);
    let body = 0;
    if (v.kropeni) body = 0;
    else if (presne === n) body = max;
    else if (presne + mirne === n || presne > 0) body = max - 1;
    else if (mirne > 0 || cast > 0) body = max - 2;
    return { body: Math.max(0, body), max, stav, presne, mirne, cast, celkem: n, kropeni: v.kropeni, navic: v.navic };
  }

  // Přímka ořezaná na okno (pro kreslení nekonečné přímky jako úsečky)
  function oriznoutNaOkno(p, q, okraj) {
    const m = okraj || 0, u = odecti(q, p);
    const ts = [];
    const hrany = [[bod(m, m), bod(W - m, m)], [bod(W - m, m), bod(W - m, H - m)], [bod(W - m, H - m), bod(m, H - m)], [bod(m, H - m), bod(m, m)]];
    for (const [a, b] of hrany) {
      const x = prusecikPP(p, q, a, b);
      if (x && vzdalOdUsecky(x, a, b) < 1e-6) ts.push(skal(odecti(x, p), u) / (skal(u, u) || EPS));
    }
    if (ts.length < 2) return null;
    const t0 = Math.min(...ts), t1 = Math.max(...ts);
    return { p: secti(p, nasob(u, t0)), q: secti(p, nasob(u, t1)) };
  }

  window.PZ_GEO = { CM, W, H, bod, vzdal, stred, jednot, secti, odecti, nasob, skal, vekt, uhel, pata, vzdalOdPrimky, vzdalOdUsecky,
    osove, stredove, prusecikPP, prusecikyPK, prusecikyKK, pruseciky, fitKruznice, rozpoznej, prichytne, prichyt, nejblizsi, vyhodnot, oriznoutNaOkno,
    TOL_PRESNE, TOL_MIRNE, stavReseni, bodovat };
})();
