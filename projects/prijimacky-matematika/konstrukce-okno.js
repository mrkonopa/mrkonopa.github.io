/* ══════════════════════════════════════════════════════════════════
   KRESLICÍ OKNO konstrukčních úloh — JEDNA implementace pro procvičování
   (konstrukce.html) i test nanečisto (test.html, úlohy 9 a 10). Dvě kopie
   téhož by se rozešly a nikde by to nespadlo.

   PZ_OKNO.vytvor(kontejner, { id, akce }) → okno:
     okno.uloha(u)              nová úloha, prázdná kresba
     okno.tvary                 kresba žáka (tvary z konstrukce-geo.js)
     okno.ukaz({reseni, krok})  překryv vzorového řešení: hledané body
                                a tvary postupu do kroku `krok` (−1 = nic)
     okno.plna(ano)             kreslení přes celou obrazovku (tablet)
     okno.jePlna()
     okno.zamkni(ano)           po odevzdání testu se už nekreslí
   PZ_OKNO.snimek(u, tvary, {reseni, krok})  statické SVG pro rozbor testu
   PZ_OKNO.zavritPlnou()      zavře celou obrazovku u kteréhokoli okna

   `id` je předpona id prvků: okno „kn" má kn-svg, kn-nastroje, kn-domov…
   Celá obrazovka (kn-full) je jedna pro stránku. Její tlačítka dodává
   stránka v `akce` ([popisek, třída, funkce]) — v testu se průběžně
   nevyhodnocuje, takže tam je jen „Hotovo".
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const G = window.PZ_GEO;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NASTROJE = [
    ['ruka', 'Od ruky', 'M4 20l4-1 11-11-3-3L5 16z M14 6l3 3'],
    ['pravitko', 'Pravítko', 'M3 17L17 3l4 4L7 21z M7 13l2 2 M10 10l2 2 M13 7l2 2'],
    ['kruzitko', 'Kružítko', 'M12 3.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3 M11.3 6.3L6 20 M12.7 6.3L18 20 M8.4 13.8h7.2'],
    ['kolmice', 'Kolmice', 'M4 20h16 M12 20V4 M12 16h4v4'],
    ['rovnobezka', 'Rovnoběžka', 'M4 10L20 6 M4 19l16-4'],
    ['bod', 'Bod', 'M8 8l8 8 M16 8l-8 8'],
  ];
  const AKCE = [
    ['zpet', 'Zpět', 'M9 5L4 10l5 5 M4 10h10a5 5 0 0 1 0 10h-3'],
    ['smazat', 'Smazat', 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13'],
    ['zvetsit', 'Zvětšit', 'M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5'],
  ];
  const ik = d => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  const f1 = v => (Math.round(v * 10) / 10).toString();

  // ── kresba: čisté funkce → řetězec SVG (okno i snímek do rozboru) ──
  function cara(p, q, cls) { return '<line x1="' + f1(p.x) + '" y1="' + f1(p.y) + '" x2="' + f1(q.x) + '" y2="' + f1(q.y) + '" class="' + cls + '"/>'; }
  function primkaSvg(p, q, cls) { const o = G.oriznoutNaOkno(p, q, 0); return o ? cara(o.p, o.q, cls) : ''; }
  function kruzSvg(k, cls) {
    if (k.rozpeti == null) return '<circle cx="' + f1(k.c.x) + '" cy="' + f1(k.c.y) + '" r="' + f1(k.r) + '" class="' + cls + '"/>';
    const a0 = k.od, a1 = k.od + k.rozpeti, p0 = G.bod(k.c.x + k.r * Math.cos(a0), k.c.y + k.r * Math.sin(a0)), p1 = G.bod(k.c.x + k.r * Math.cos(a1), k.c.y + k.r * Math.sin(a1));
    // sweep se POČÍTÁ ze znaménka úhlu (y roste dolů), natvrdo zapsaná nula je past
    return '<path d="M' + f1(p0.x) + ' ' + f1(p0.y) + ' A' + f1(k.r) + ' ' + f1(k.r) + ' 0 ' + (Math.abs(k.rozpeti) > Math.PI ? 1 : 0) + ' ' + (k.rozpeti > 0 ? 1 : 0) + ' ' + f1(p1.x) + ' ' + f1(p1.y) + '" class="' + cls + '"/>';
  }
  function krizek(p, cls) { const s = 4.5; return '<path d="M' + f1(p.x - s) + ' ' + f1(p.y - s) + 'L' + f1(p.x + s) + ' ' + f1(p.y + s) + 'M' + f1(p.x + s) + ' ' + f1(p.y - s) + 'L' + f1(p.x - s) + ' ' + f1(p.y + s) + '" class="' + cls + '"/>'; }
  function popisek(p, t, smer, cls) {
    const x = Math.max(10, Math.min(390, p.x + smer.x * 13)), y = Math.max(12, Math.min(292, p.y + smer.y * 13));
    return '<text x="' + f1(x) + '" y="' + f1(y) + '" class="' + cls + '" text-anchor="middle" dominant-baseline="middle">' + esc(t) + '</text>';
  }
  function tvarSvg(t, cls) {
    if (t.typ === 'usecka') return cara(t.p, t.q, cls);
    if (t.typ === 'primka') return primkaSvg(t.p, t.q, cls);
    if (t.typ === 'kruznice') return kruzSvg(t, cls);
    if (t.typ === 'bod') return krizek(t.p, cls);
    if (t.typ === 'kresba') return '<polyline points="' + t.body.map(x => f1(x.x) + ',' + f1(x.y)).join(' ') + '" class="' + cls + ' kn-kresba"/>';
    return '';
  }
  // Zadané čáry jako tvary (přichytávání a výběr přímky pro kolmici/rovnoběžku)
  function daneTvary(u) {
    const d = u.dane, out = [];
    (d.primky || []).forEach(l => out.push({ typ: 'primka', p: l.p, q: l.q }));
    (d.usecky || []).forEach(s => out.push({ typ: 'usecka', p: s.p, q: s.q }));
    (d.kruznice || []).forEach(k => out.push({ typ: 'kruznice', c: k.c, r: k.r }));
    (d.mnohouhelniky || []).forEach(m => m.forEach((k, i) => out.push({ typ: 'usecka', p: d.body[k], q: d.body[m[(i + 1) % m.length]] })));
    return out;
  }
  const MERITKO = G.bod(27, 286);                  // střed měřítka 1 cm
  function svgDane(u) {
    const d = u.dane, body = Object.entries(d.body), tez = body.reduce((a, [, p]) => G.bod(a.x + p.x / body.length, a.y + p.y / body.length), G.bod(0, 0));
    let h = '';
    (d.mnohouhelniky || []).forEach(m => { h += '<polygon points="' + m.map(k => f1(d.body[k].x) + ',' + f1(d.body[k].y)).join(' ') + '" class="kn-d-plocha"/>'; });
    (d.usecky || []).forEach(s => { h += cara(s.p, s.q, 'kn-d'); });
    // zadaná kružnice: název vpravo nahoře na obvodu
    (d.kruznice || []).forEach(k => { const s = G.bod(Math.SQRT1_2, -Math.SQRT1_2); h += kruzSvg({ c: k.c, r: k.r }, 'kn-d') + popisek(G.secti(k.c, G.nasob(s, k.r)), k.nazev, s, 'kn-d-txt kn-d-prim'); });
    (d.primky || []).forEach(l => {
      h += primkaSvg(l.p, l.q, 'kn-d'); const o = G.oriznoutNaOkno(l.p, l.q, 14);
      if (!o) return;
      // název na ten konec, který je dál od měřítka vlevo dole (jinak „p" leželo na „1 cm")
      const [E, F] = G.vzdal(o.q, MERITKO) >= G.vzdal(o.p, MERITKO) ? [o.q, o.p] : [o.p, o.q], u2 = G.jednot(G.odecti(E, F));
      h += popisek(G.secti(E, G.nasob(u2, -6)), l.nazev, G.bod(-u2.y, u2.x), 'kn-d-txt kn-d-prim');
    });
    body.forEach(([k, p]) => { const s = G.jednot(G.odecti(p, tez)); h += '<circle cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="3" class="kn-d-bod"/>' + popisek(p, k, (s.x || s.y) ? s : G.bod(0, -1), 'kn-d-txt'); });
    // měřítko 1 cm vlevo dole
    h += '<path d="M12 288h30 M12 284v8 M42 284v8" class="kn-meritko"/><text x="27" y="280" class="kn-meritko-t" text-anchor="middle">1 cm</text>';
    return h;
  }
  // Vzorové řešení: hledané body (uk.reseni) a tvary postupu do kroku uk.krok
  /* Každý bod dostane popisek JEDNOU: hledaný bod, který popisuje i krok postupu,
     se nepopisuje podruhé („B₁B₁"), a vrchol společný dvěma řešením (C u obdélníku
     ze středu) nese holé jméno, ne „C₁" a „C₂" přes sebe. */
  function svgReseni(u, uk) {
    let h = '';
    const kroky = uk && uk.krok >= 0 ? u.postup.slice(0, uk.krok + 1) : [];
    const popsane = [].concat(...kroky.map(s => s.tvary.filter(t => t.typ === 'bod' && t.popis).map(t => t.p)));
    const blizko = (a, b) => G.vzdal(a, b) < 1;
    if (uk && uk.reseni) {
      const vic = u.reseni.length > 1, idx = '₁₂₃₄';
      u.reseni.forEach((s, i) => Object.entries(s).forEach(([k, p]) => {
        h += '<circle cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="4" class="kn-r-bod"/>';
        if (popsane.some(x => blizko(x, p))) return;
        const sdileny = u.reseni.filter(r => r[k] && blizko(r[k], p)).length > 1;
        popsane.push(p);
        h += popisek(p, k + (vic && !sdileny ? idx[i] : ''), G.bod(0.7, -0.7), 'kn-r-txt');
      }));
    }
    kroky.forEach(s => s.tvary.forEach(t => {
      h += t.typ === 'bod' ? '<circle cx="' + f1(t.p.x) + '" cy="' + f1(t.p.y) + '" r="3.5" class="kn-r-bod"/>' + (t.popis ? popisek(t.p, t.popis, G.bod(-0.7, -0.7), 'kn-r-txt') : '') : tvarSvg(t, 'kn-r');
    }));
    return h;
  }
  // Statický obrázek pro rozbor: zadání, vzorové řešení a NAVRCH kresba žáka —
  // jeho značka v hledaném bodě by jinak zmizela pod oranžovým bodem řešení
  function snimek(u, tvary, uk) {
    return '<svg class="kn-svg kn-snimek" viewBox="0 0 400 300" role="img" aria-label="' + esc('Tvoje konstrukce a vzorové řešení. ' + u.text) + '">' +
      '<g>' + svgDane(u) + '</g><g>' + svgReseni(u, uk) + '</g><g>' + (tvary || []).map(t => tvarSvg(t, 'kn-z')).join('') + '</g></svg>';
  }

  // ── celá obrazovka: jedna na stránku, vytvoří se až při prvním otevření ──
  let FULL = null, plnaOkno = null;
  function overlay() {
    if (FULL) return FULL;
    FULL = document.createElement('div');
    FULL.id = 'kn-full'; FULL.className = 'kn-full';
    FULL.setAttribute('role', 'dialog'); FULL.setAttribute('aria-modal', 'true'); FULL.setAttribute('aria-label', 'Kreslicí okno přes celou obrazovku');
    FULL.innerHTML = '<div class="kn-full-top" id="kn-full-top"><span class="kn-full-akce" id="kn-full-akce"></span><span class="kn-full-cas" id="kn-full-cas"></span></div>' +
      '<div class="kn-full-text" id="kn-full-text"></div><div class="kn-full-plocha" id="kn-full-plocha"></div>';
    document.body.appendChild(FULL);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && plnaOkno) plnaOkno.plna(false); });
    return FULL;
  }
  function zavritPlnou() { if (plnaOkno) plnaOkno.plna(false); }

  let pocet = 0;
  function vytvor(el, volby) {
    const o = volby || {}, id = o.id || ('kn' + (++pocet));
    el.innerHTML =
      '<div class="kn-domov" id="' + id + '-domov">' +
        '<div class="kn-nastroje" id="' + id + '-nastroje" role="toolbar" aria-label="Nástroje"></div>' +
        '<div class="kn-svgwrap" id="' + id + '-svgwrap"><svg class="kn-svg" id="' + id + '-svg" viewBox="0 0 400 300" role="img" aria-label="Kreslicí okno">' +
          '<g id="' + id + '-dane"></g><g id="' + id + '-zak"></g><g id="' + id + '-reseni"></g><g id="' + id + '-nahled"></g></svg></div>' +
      '</div>' +
      '<div class="kn-tip"><span class="kn-tip-mys">Kresli myší do okna. Od ruky: rovná čára se narovná, oblouk se promění v kružnici, klepnutí je bod.</span>' +
        '<span class="kn-tip-dotyk">Klepni do okna — otevře se přes celou obrazovku a můžeš kreslit prstem.</span></div>';
    const $ = s => document.getElementById(id + '-' + s);
    const svg = $('svg'), domov = $('domov'), lista = $('nastroje'), wrap = $('svgwrap');
    const S = { u: null, tvary: [], nastroj: 'ruka', tah: null, vyber: null, aktivni: null, plna: false, zamceno: false, uk: { reseni: false, krok: -1 } };
    const hruby = () => window.matchMedia && matchMedia('(pointer:coarse)').matches;

    function kresliListu() {
      lista.innerHTML = NASTROJE.map(([n, t, d]) => '<button type="button" class="kn-tool" data-n="' + n + '" aria-pressed="' + (S.nastroj === n) + '"' + (S.zamceno ? ' disabled' : '') + '>' + ik(d) + t + '</button>').join('') +
        AKCE.filter(a => !(a[0] === 'zvetsit' && S.plna)).map(([a, t, d]) => '<button type="button" class="kn-tool" data-a="' + a + '"' + (S.zamceno ? ' disabled' : '') + '>' + ik(d) + t + '</button>').join('');
    }
    const kresliDane = () => { $('dane').innerHTML = S.u ? svgDane(S.u) : ''; };
    const kresliZaka = () => { $('zak').innerHTML = S.tvary.map(t => tvarSvg(t, 'kn-z')).join(''); };
    const kresliReseni = () => { $('reseni').innerHTML = S.u ? svgReseni(S.u, S.uk) : ''; };
    function kresliNahled(t) {
      let h = '';
      if (S.vyber) h += tvarSvg(S.vyber, 'kn-vyber');
      if (t) h += tvarSvg(t, 'kn-nahled');
      if (t && t.typ === 'kruznice' && t.rozpeti == null) h += '<text x="' + f1(Math.min(360, t.c.x + t.r * 0.7 + 6)) + '" y="' + f1(Math.max(14, t.c.y - t.r * 0.7 - 6)) + '" class="kn-r-txt">r = ' + String(Math.round(t.r / G.CM * 10) / 10).replace('.', ',') + ' cm</text>';
      $('nahled').innerHTML = h;
    }
    function kresli() { kresliDane(); kresliZaka(); kresliReseni(); kresliNahled(); }

    // ── souřadnice a přichytávání ──
    function bodZ(e) { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return G.bod(q.x, q.y); }
    // dosah přichycení ≈ 14 px na obrazovce, v jednotkách okna
    function dosah() { const w = svg.getBoundingClientRect().width || 400; return Math.max(6, Math.min(16, 14 * 400 / w)); }
    const kotvy = () => G.prichytne(S.tvary.concat(daneTvary(S.u)), Object.values(S.u.dane.body));
    const snap = x => G.nejblizsi(x, kotvy(), dosah()) || x;
    function linearniPod(x) {
      const kand = daneTvary(S.u).concat(S.tvary.filter(t => t.typ === 'usecka' || t.typ === 'primka'));
      let best = null, bd = dosah() * 1.6;
      for (const t of kand) { const d = t.typ === 'primka' ? G.vzdalOdPrimky(x, t.p, t.q) : G.vzdalOdUsecky(x, t.p, t.q); if (d < bd) { bd = d; best = t; } }
      return best;
    }
    function polomer(c, x) {
      // kružítko: přes bod pod ukazatelem, jinak zaokrouhlení na půl centimetru (je-li blízko)
      const b = G.nejblizsi(x, kotvy().filter(p => G.vzdal(p, c) > 1), dosah());
      if (b) return G.vzdal(b, c);
      const r = G.vzdal(c, x), pul = Math.round(r / (G.CM / 2)) * (G.CM / 2);
      return Math.abs(r - pul) <= 3 ? pul : r;
    }

    // ── ovládání ukazatelem (myš, prst, pero) ──
    function dolu(e) {
      if (!S.u || S.zamceno) return;
      if (hruby() && !S.plna) return;            // na tabletu se kreslí až přes celou obrazovku (otevře klepnutí)
      if (S.aktivni !== null) return;            // druhý prst / dlaň se ignoruje
      S.aktivni = e.pointerId; try { svg.setPointerCapture(e.pointerId); } catch (_) { /* starší prohlížeč */ }
      e.preventDefault();
      const x = bodZ(e);
      if (S.nastroj === 'ruka') S.tah = { body: [x] };
      else if (S.nastroj === 'pravitko') S.tah = { p: snap(x) };
      else if (S.nastroj === 'kruzitko') S.tah = { c: snap(x) };
      else S.tah = { x };
    }
    function pohyb(e) {
      if (S.aktivni !== e.pointerId || !S.tah) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      if (S.nastroj === 'ruka') { evs.forEach(v => S.tah.body.push(bodZ(v))); kresliNahled({ typ: 'kresba', body: S.tah.body }); return; }
      const x = bodZ(e);
      if (S.nastroj === 'pravitko') kresliNahled({ typ: 'usecka', p: S.tah.p, q: snap(x) });
      else if (S.nastroj === 'kruzitko') kresliNahled({ typ: 'kruznice', c: S.tah.c, r: polomer(S.tah.c, x) });
    }
    function nahoru(e) {
      if (S.aktivni !== e.pointerId) return;
      S.aktivni = null;
      const tah = S.tah; S.tah = null;
      if (!tah || S.zamceno) { kresliNahled(); return; }
      const x = bodZ(e); let novy = null;
      if (S.nastroj === 'ruka') { tah.body.push(x); const r = G.rozpoznej(tah.body); novy = r && r.typ !== 'kresba' ? G.prichyt(r, kotvy(), dosah()) : r; }
      else if (S.nastroj === 'pravitko') { const q = snap(x); if (G.vzdal(tah.p, q) > 4) novy = { typ: 'usecka', p: tah.p, q }; }
      else if (S.nastroj === 'kruzitko') { const r = polomer(tah.c, x); if (r > 4) novy = { typ: 'kruznice', c: tah.c, r }; }
      else if (S.nastroj === 'bod') novy = { typ: 'bod', p: snap(x) };
      else if (S.nastroj === 'kolmice' || S.nastroj === 'rovnobezka') {
        if (!S.vyber) { S.vyber = linearniPod(x); kresliNahled(); return; }
        const p = snap(x), u = G.jednot(G.odecti(S.vyber.q, S.vyber.p)), s = S.nastroj === 'kolmice' ? G.bod(-u.y, u.x) : u;
        novy = { typ: 'primka', p, q: G.secti(p, s) }; S.vyber = null;
      }
      if (novy) { S.tvary.push(novy); kresliZaka(); }
      kresliNahled();
    }
    function zpet() { S.tvary.pop(); S.vyber = null; kresliZaka(); kresliNahled(); }
    function smazat() {
      if (S.tvary.length && !confirm('Smazat celý svůj náčrt?')) return;
      S.tvary.length = 0; S.vyber = null; kresliZaka(); kresliNahled();
    }

    function plna(ano) {
      if (ano && !S.plna) {
        if (plnaOkno && plnaOkno !== api) plnaOkno.plna(false);
        const F = overlay();
        S.plna = true; plnaOkno = api;
        document.getElementById('kn-full-top').prepend(lista);
        document.getElementById('kn-full-plocha').appendChild(wrap);
        document.getElementById('kn-full-text').textContent = S.u ? S.u.text : '';
        const ak = document.getElementById('kn-full-akce'); ak.textContent = '';
        (o.akce || [['✓ Hotovo', 'primary', () => plna(false)]]).forEach(([t, cls, f]) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'pz-btn' + (cls ? ' ' + cls : ''); b.textContent = t; b.onclick = f; ak.appendChild(b);
        });
        wrap.classList.add('plna'); F.classList.add('on'); document.body.classList.add('kn-full-on');
      } else if (!ano && S.plna) {
        S.plna = false; if (plnaOkno === api) plnaOkno = null;
        domov.appendChild(lista); domov.appendChild(wrap);          // zpět v původním pořadí: lišta, okno
        wrap.classList.remove('plna'); FULL.classList.remove('on'); document.body.classList.remove('kn-full-on');
      }
      kresliListu(); kresliNahled();
    }
    function uloha(u) {
      S.u = u; S.tvary = []; S.tah = null; S.vyber = null; S.aktivni = null; S.uk = { reseni: false, krok: -1 };
      svg.setAttribute('aria-label', 'Kreslicí okno. ' + (u ? u.text : ''));
      if (S.plna) document.getElementById('kn-full-text').textContent = u ? u.text : '';
      kresli();
    }
    function ukaz(uk) { S.uk = { reseni: !!(uk && uk.reseni), krok: uk && uk.krok != null ? uk.krok : -1 }; kresliReseni(); }
    function zamkni(ano) { S.zamceno = !!ano; S.tah = null; S.vyber = null; if (S.zamceno && S.plna) plna(false); kresliListu(); kresliNahled(); }

    lista.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('button');
      if (!b || !lista.contains(b) || S.zamceno) return;
      if (b.dataset.n) { S.nastroj = b.dataset.n; S.vyber = null; S.tah = null; kresliListu(); kresliNahled(); }
      else if (b.dataset.a === 'zpet') zpet();
      else if (b.dataset.a === 'smazat') smazat();
      else if (b.dataset.a === 'zvetsit') plna(true);
    });
    svg.addEventListener('pointerdown', dolu); svg.addEventListener('pointermove', pohyb);
    svg.addEventListener('pointerup', nahoru);
    svg.addEventListener('pointercancel', e => { if (S.aktivni === e.pointerId) { S.aktivni = null; S.tah = null; kresliNahled(); } });
    // tablet: klepnutí do okna otevře kreslení přes celou obrazovku
    svg.addEventListener('click', () => { if (!S.plna && !S.zamceno && hruby()) plna(true); });

    const api = {
      id, svg,
      get u() { return S.u; },
      get tvary() { return S.tvary; },
      uloha, ukaz, plna, zamkni, prekresli: kresli,
      jePlna: () => S.plna,
    };
    kresliListu();
    return api;
  }

  window.PZ_OKNO = { vytvor, snimek, zavritPlnou, svgDane, tvarSvg };
})();
