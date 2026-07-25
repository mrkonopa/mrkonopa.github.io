/* ─────────────────────────────────────────────────────────────────────────
   PŘIJÍMAČKY HUB — sdílený glue.
   Spojuje vizuálně neutrální engine hry (checkAns z rpg-shared.js, generátor
   RPG_CERMAT_9 z rpg-cermat-9.js) se světlým UI hubu. Vše čistě klientské
   (localStorage), žádná závislost na RPG stavu.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // Generátor rpg-cermat-9.js spoléhá na globální `ri` (random int [a,b]) — ve hře
  // je to lexikální const v rpg-mat-9.html, do sdíleného rpg-shared.js ho dát nelze
  // (kolize). V hubu ho tedy dodáme jako window.ri (guarded). Musí být k dispozici
  // dřív, než se generátor spustí → proto se prijimacky-core.js načítá PŘED ním.
  // Malé matematické helpery, které rpg-cermat-9.js sdílí se hrou (rpg-mat-9.html:974–981):
  // ri (random int), gcd (největší společný dělitel), cz (desetinná čárka), + shuffleArr/
  // countDiv/skl pro jistotu. Guarded → nekolidují, kdyby je stránka už měla.
  if (typeof window.ri !== 'function') window.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  if (typeof window.gcd !== 'function') window.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
  if (typeof window.cz !== 'function') window.cz = n => String(n).replace('.', ',');
  if (typeof window.shuffleArr !== 'function') window.shuffleArr = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
  if (typeof window.countDiv !== 'function') window.countDiv = n => { let c = 0; for (let i = 1; i <= n; i++) if (n % i === 0) c++; return c; };
  if (typeof window.skl !== 'function') window.skl = (n, one, few, many) => n === 1 ? one : (n >= 2 && n <= 4 ? few : many);

  // SVG helpery, které generátor sdílí se hrou (rpg-mat-9.html): svgTriangle, svgSimilar.
  // (svgSud/svgAngles jsou interní modulu.) Kopie 1:1 — barvy přebarví themeSvg níže.
  if (typeof window.svgTriangle !== 'function') window.svgTriangle = function (kind, opt) {
    opt = opt || {}; let p;
    if (kind === 'rovnostr') p = [[125, 30], [55, 135], [195, 135]];
    else if (kind === 'rovnoram') p = [[125, 28], [70, 135], [180, 135]];
    else if (kind === 'pravo') p = [[55, 135], [55, 35], [195, 135]];
    else p = [[60, 40], [40, 135], [205, 120]];
    const pts = p.map(q => q.join(',')).join(' ');
    const vlabels = (opt.v || ['A', 'B', 'C']); const off = [[0, -10], [-12, 14], [12, 14]]; let txt = '';
    p.forEach((q, i) => { txt += '<text x="' + (q[0] + off[i][0]) + '" y="' + (q[1] + off[i][1]) + '" fill="#fff" font-size="14" font-family="monospace" text-anchor="middle">' + vlabels[i] + '</text>'; });
    return '<svg viewBox="0 0 250 165"><polygon points="' + pts + '" fill="#16203a" stroke="#19e6e6" stroke-width="3"/>' + (kind === 'pravo' ? '<rect x="55" y="120" width="15" height="15" fill="none" stroke="#ff3d7f" stroke-width="2"/>' : '') + txt + (opt.extra || '') + '</svg>';
  };
  if (typeof window.svgSimilar !== 'function') window.svgSimilar = function (k) {
    return '<svg viewBox="0 0 250 160"><polygon points="30,120 90,120 30,75" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/><polygon points="130,135 240,135 130,55" fill="#16203a" stroke="#39ff9e" stroke-width="2.5"/><text x="60" y="138" fill="#5d6e94" font-size="12" font-family="monospace" text-anchor="middle">orig.</text><text x="185" y="152" fill="#5d6e94" font-size="12" font-family="monospace" text-anchor="middle">obraz</text><text x="125" y="22" fill="#ff3d7f" font-size="15" font-family="monospace" text-anchor="middle">k = ' + k + '</text></svg>';
  };

  // Přebarvení generovaných SVG z tmavé RPG palety na světlou akademickou.
  // Delší kódy barev první (ať #ffffff nepřebije #fff jen zčásti).
  const SVG_MAP = [
    ['#ffffff', '#1a1a2e'],
    // tmavé výplně tvarů → světle modrá
    ['#16203a', '#eaf1fb'], ['#101a2e', '#eaf1fb'], ['#1b2742', '#eaf1fb'], ['#12233a', '#eaf1fb'], ['#233', '#eaf1fb'],
    // vodní plochy (rybník apod.) → světle modrá, ať se liší od pevniny
    ['#0e4a6e', '#bcdcf0'], ['#1a5a80', '#cfe8f5'],
    // neon tahy/akcenty → akademická modrá / teal / červená
    ['#19e6e6', '#1a73c8'], ['#4cc9f0', '#1a73c8'], ['#39ff9e', '#0f8a72'],
    ['#ff3d7f', '#d63c2f'], ['#ff5c8a', '#d63c2f'],
    // tlumené popisky → šedá
    ['#8a9bc4', '#6b7280'], ['#5d6e94', '#6b7280'],
    ['#fff', '#1a1a2e'],
  ];
  function themeSvg(s) { let o = String(s == null ? '' : s); for (const [a, b] of SVG_MAP) o = o.split(a).join(b); return o; }

  // Escapování user-controlled textu do innerHTML (i jednoduché uvozovky kvůli onclick kontextům)
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Kontrola odpovědi — přednostně sdílená checkAns z rpg-shared.js; fallback pro jistotu.
  function check(raw, correct) {
    if (typeof window.checkAns === 'function') return window.checkAns(raw, correct);
    const norm = s => String(s).trim().toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').replace(/,/g, '.').replace(/[−–]/g, '-');
    const u = norm(raw), c = norm(correct);
    if (u === c) return true;
    const ev = s => { if (/^-?\d+\/-?\d+$/.test(s)) { const [a, b] = s.split('/'); return parseFloat(a) / parseFloat(b); } return parseFloat(s); };
    const un = ev(u), cn = ev(c);
    return (!isNaN(un) && !isNaN(cn)) ? Math.abs(un - cn) < 0.016 : false;
  }

  // localStorage wrapper (bezpečný proti privátnímu režimu / plné kvótě)
  const store = {
    get(key, def) { try { const r = localStorage.getItem(key); return r == null ? def : JSON.parse(r); } catch (e) { return def; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } },
  };

  // Vhodná mobilní klávesnice podle očekávané odpovědi (jako Tier 1 ② ve hrách):
  // kladné celé → numeric, kladné desetinné → decimal, jinak (zápor/zlomek/text) → text.
  function inputMode(ans) {
    const a = String(ans == null ? '' : ans);
    return /^\d+$/.test(a) ? 'numeric' : /^\d+[.,]\d+$/.test(a) ? 'decimal' : 'text';
  }

  window.PZ = { esc, check, store, inputMode, themeSvg };
})();
