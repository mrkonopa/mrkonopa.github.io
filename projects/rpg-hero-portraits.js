/* ═════════════════════════════════════════════════════════════════════
   RPG MATEMATIKA — portréty hrdinů na kartách hubu  (window.RPGHeroPortrait)

   REFERENČNÍ MODUL k převzetí do repa jako projects/rpg-hero-portraits.js.
   Vanilla, žádné závislosti, žádný build step — stejně jako rpg-icons.js.

   ── Proč to takhle ───────────────────────────────────────────────────
   Sedm ročníků NENÍ sedm kreseb. Sdílí se jedno tělo (16×29 znaků);
   mění se jen:
     • první tři řádky   → pokrývka hlavy podle tématu ročníku
     • sloupce 16–19     → předmět v ruce
     • paleta            → čtyřtónový ramp barev světa
   Držíme tím velikost souboru dole a vzhled konzistentní. Stejný princip
   používají stávající sprite enginy rpg-sprites-3..9.js.

   ── Znaky mřížky ─────────────────────────────────────────────────────
     .  průhledné
     K  obrys (tmavý)          G g  bota tmavá / světlá
     1 2 3 4  ramp těla        W w  čepel / papír, světlá / tmavá
        (stín → základ →       Y y  zlatý detail / jeho stín
         světlo → hrana)
     A  accent světa           a  tmavý tón světa
     e  světlý tón světa       R  obrysové světlo (rim light)

   KAŽDÝ znak v mřížce musí existovat v paletě. Chybějící znak se vykreslí
   magentou #f0f — je to záměrný signál chyby, ne dekorace. Hlídej testem.

   ── Použití ──────────────────────────────────────────────────────────
     <script src="rpg-hero-portraits.js"></script>
     const P = RPGHeroPortrait;
     P.paint(canvas, P.grid('g7'), P.palette('g7'));            // hrdina
     P.paint(canvas, P.BOSS, P.palette('g7'), {silhouette:true}); // nerozehráno
     P.paint(canvas, P.grid('g9'), P.palette('g9'), {shadow:false}); // avatar

   Statické. Žádná animace, žádný requestAnimationFrame — hub je rozcestník
   a musí být okamžitě čitelný i na školním Chromebooku.
   ═════════════════════════════════════════════════════════════════════ */

window.RPGHeroPortrait = (function () {
  'use strict';

  /* ── sdílené tělo, 16 sloupců × 29 řádků ─────────────────────────────
     Řádky 0–2 přepisuje pokrývka hlavy (HEADS), takže tu jsou prázdné. */
  var BODY = [
    '................', '................', '................',
    '.....K443333321R', '.....K443333321R', '.....KaaAAAAAAaR',
    '.....KaAeeeeAAaR', '.....KaaAAAAAAaR', '.....K443333321R',
    '......K4433321R.', '.......KK333KR..', '......KK22222KR.',
    '...KKKK2222222KR', '..KgggK2222222KR', '..Kg4gK2Y2Y2K4gR',
    '..Kg4gK2222222gR', '..KKgK42222224gR', '...KKK42222224gR',
    '....K4222YYY221R', '....K4222122221R', '....K4222K22221R',
    '....K4222K22221R', '....K1222K22221R', '....KG22K.K222GR',
    '....KG22K.K222GR', '....KG11K.K111GR', '...KKGGK..KGGKR.',
    '..KGGGGK..KGGGGR', '..KKKKKK..KKKKKR'
  ];

  /* ── pokrývky hlavy = téma ročníku (řádky 0–2) ─────────────────────── */
  var HEADS = {
    leaf:   ['.......KAAK.....', '......KAeeAK....', '......KK4444KK..'],  // listová čapka
    pirate: ['.......KYK......', '....KK3333KK....', '...K33333333K...'],  // šátek
    horns:  ['.....A.....A....', '.....KA...AK....', '......KK4444KK..'],  // rohy
    dome:   ['.......KKKK.....', '.....KKeeeeKK...', '....KKe4444eKK..'],  // helma
    hat:    ['.......K44K.....', '......K3333K....', '...KK33333333KK.'],  // klobouk
    board:  ['................', '..KKKKKKKKKKKK..', '..KYYYYYYYYYYK..'],  // talár
    hood:   ['........KAK.....', '.......KA4AK....', '......KK4444KK..']   // kápě
  };

  /* ── předměty v ruce, sloupce 16–19 (4 znaky na řádek) ─────────────── */
  function rod(fill, tip) {                       // hůl / maják / žezlo
    var o = { 5: '..' + tip + '.', 6: '.' + tip + 'e' + tip, 7: '..' + tip + '.',
              8: '..K.', 14: 'KY' + fill + 'K' };
    for (var r = 9; r <= 16; r++) if (!o[r]) o[r] = '.K' + fill + 'K';
    return o;
  }

  var PROPS = (function () {
    var sword = { 3: '..W.', 14: 'KYYY', 15: '.gyg', 16: '.KgK' };
    for (var r = 4; r <= 13; r++) sword[r] = '.KWw';

    var torch = { 4: '..Y.', 5: '.YAY', 6: '.YeY', 7: '.YAY', 8: '..Y.', 9: '..K.', 14: 'KY3K' };
    for (var t = 10; t <= 17; t++) if (!torch[t]) torch[t] = '.K3K';

    return {
      sword:  sword,
      wand:   rod('3', 'A'),
      beacon: rod('4', 'A'),
      torch:  torch,
      scroll: { 11: '..KK', 12: '.KWW', 13: '.KWw', 14: 'KYWw',
                15: '.KWw', 16: '.KWW', 17: '..KK' }
    };
  })();

  /* ── silueta bosse pro nerozehranou kartu, 20×24 ───────────────────── */
  var BOSS = [
    '......KKKKKKKR......', '.....K33444433R.....', '....K3444444443R....',
    '....K3KKKKKKKK3R....', 'KKK.K3KaAAAAaK3R....', 'KggK.K3KAeeeeAK3R...',
    'KggKKK3KaAAAAaK3R...', 'Kgg4333KKKKKKK3R....', 'KggA33333333333R....',
    'KKK333311113333R....', '...K3333KKKK3333R...', '..K33333333333KR....',
    '.K3333KKKKKK3333R...', '.K333K111111K333R...', '.K333K1aAAa1K333R...',
    '.K333K111111K333R...', '.K3333333333333R....', '..KK3333333333KR....',
    '....K333KK333KR.....', '....K33K..K33KR.....', '....K11K..K11KR.....',
    '...KKGGK..KGGKKR....', '...KGGGK..KGGGKR....', '...KKKKK..KKKKKR....'
  ];

  /* ── témata ročníků ───────────────────────────────────────────────── */
  var THEMES = {
    g3: { name: 'Kouzelný les',          head: 'leaf',   prop: 'wand',
          accent: '#6fc24a', dark: '#2f5c22', light: '#d8ffcf', rim: '#a9f08a',
          ramp: ['#10240f', '#1e4520', '#2f6b33', '#5da85c'] },
    g4: { name: 'Pirátská plavba',       head: 'pirate', prop: 'sword',
          accent: '#4ab0e0', dark: '#1c5573', light: '#d6f3ff', rim: '#8fd9ff',
          ramp: ['#0e2438', '#173e5c', '#255e85', '#4e97c4'] },
    g5: { name: 'Dračí říše',            head: 'horns',  prop: 'sword',
          accent: '#e0584a', dark: '#6e2019', light: '#ffd9d3', rim: '#ff9a86',
          ramp: ['#2b1013', '#4d1f22', '#743430', '#e25132' ] },
    g6: { name: 'Vesmírná expedice',     head: 'dome',   prop: 'beacon',
          accent: '#5dc8f0', dark: '#1d5d77', light: '#dff5ff', rim: '#9adcff',
          ramp: ['#141c40', '#243070', '#3a4d9e', '#6f89d8'] },
    g7: { name: 'Ztracený chrám',        head: 'hat',    prop: 'torch',
          accent: '#f2c14e', dark: '#7a5a12', light: '#fff2cf', rim: '#ffd98a',
          ramp: ['#2b1d0c', '#4c3419', '#715228', '#ab834a'] },
    g8: { name: 'Matematická akademie',  head: 'board',  prop: 'scroll',
          accent: '#b39ddb', dark: '#4b3b78', light: '#f0e8ff', rim: '#d3c2f5',
          ramp: ['#1c1440', '#302566', '#4b3c94', '#8576cb'] },
    g9: { name: 'NULL_BYTE',             head: 'hood',   prop: 'sword',
          accent: '#19e6e6', dark: '#0e8a8a', light: '#d7ffff', rim: '#7fe9ff',
          ramp: ['#082029', '#0f3a48', '#175a6b', '#2f92a4'] }
  };

  /* Zlatý ramp pro avatar v profilu — profil není vázaný na jeden svět. */
  var AVATAR = { head: 'hood', prop: 'sword',
                 accent: '#f4d03f', dark: '#7a6410', light: '#fff6cf', rim: '#ffd98a',
                 ramp: ['#2a2410', '#4a3f18', '#6e5d24', '#a8903c'] };

  function theme(key) { return THEMES[key] || AVATAR; }

  /* Poskládá mřížku: hlava (0–2) + tělo (3+) + předmět (sloupce 16–19). */
  function grid(key) {
    var t = theme(key), h = HEADS[t.head], p = PROPS[t.prop];
    return BODY.map(function (row, i) {
      return (i < 3 ? h[i] : row) + (p[i] || '....');
    });
  }

  function palette(key) {
    var t = theme(key), r = t.ramp;
    return {
      K: '#05070c',
      1: r[0], 2: r[1], 3: r[2], 4: r[3],
      G: '#3d465e', g: '#8b98b5',
      W: '#eef4ff', w: '#93a1bd',
      Y: '#f4d03f', y: '#9a7a12',
      A: t.accent, a: t.dark, e: t.light, R: t.rim
    };
  }

  /* ── vykreslení ───────────────────────────────────────────────────────
     opts.shadow     false = bez kontaktního stínu (avatar v profilu)
     opts.silhouette true  = silueta: vše kromě rim se kreslí tónem `a`   */
  function paint(cv, g, pal, opts) {
    if (!cv || !cv.getContext || !g || !g.length) return;
    var o = opts || {}, ctx = cv.getContext('2d');
    if (!ctx || !cv.width || !cv.height) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);

    var gw = Math.max.apply(null, g.map(function (r) { return r.length; }));
    var gh = g.length;

    // Celočíselné měřítko — neceločíselné by pixely rozmazalo.
    var sc = Math.max(1, Math.min(
      Math.floor((cv.width - 8) / gw),
      Math.floor((cv.height - 14) / gh)
    ));
    var ox = Math.round((cv.width - gw * sc) / 2);
    var oy = Math.round(cv.height - 8 - gh * sc);

    if (o.shadow !== false) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(cv.width / 2, oy + gh * sc + 2,
                  gw * sc * 0.27, Math.max(2, sc * 0.9), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (var r = 0; r < gh; r++) {
      var row = g[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row[c];
        if (ch === '.') continue;
        ctx.fillStyle = o.silhouette
          ? (ch === 'R' ? pal.R : pal.a)
          : (pal[ch] || '#f0f');          // #f0f = chybějící znak v paletě
        ctx.fillRect(ox + c * sc, oy + r * sc, sc, sc);
      }
    }
  }

  /* Vrátí seznam znaků, které v paletě chybí. Pro test — má být prázdný. */
  function missingChars(g, pal) {
    var bad = {};
    g.forEach(function (row) {
      for (var i = 0; i < row.length; i++) {
        var ch = row[i];
        if (ch !== '.' && !(ch in pal)) bad[ch] = 1;
      }
    });
    return Object.keys(bad);
  }

  return {
    BODY: BODY, HEADS: HEADS, PROPS: PROPS, BOSS: BOSS, THEMES: THEMES,
    grid: grid, palette: palette, paint: paint, missingChars: missingChars,
    keys: function () { return Object.keys(THEMES); }
  };
})();
