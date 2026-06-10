/* ════════════════════════════════════════════════════════════════════
   RPG Matematika 9 — pixel-art bojová scéna (canvas engine, pilot)
   ────────────────────────────────────────────────────────────────────
   Kreslí hrdinu + bosse jako pixel-art sprity na <canvas> místo emoji.
   Graceful: když se modul nenačte, hra běží dál na emoji animacích.

   API (window.RPGSprites9):
     attach(topEl)          – vloží canvas do arény, skryje emoji bosse
     spawn(areaId)          – vstup bosse (materializace + dopad) a hrdiny
     heroAttack(isCrit)     – náhodný útok hrdiny (meč/kouzlo/střela) + zásah bosse
     bossAttack()           – nabití bosse + projektil na hrdinu
     defeat()               – exploze bosse
     detach()               – zastaví smyčku (návrat na mapu)
     active()               – je engine připojený?
   Respektuje .reduced-motion na <html> (statická scéna, žádný pohyb).
   ════════════════════════════════════════════════════════════════════ */
window.RPGSprites9 = (function () {
  'use strict';

  /* ── palety ── */
  const PAL_HERO = {
    K:'#0a0c12', J:'#22335c', j:'#16223f', C:'#19e6e6', c:'#0e8a8a',
    G:'#5a6a85', B:'#23232e', W:'#e8ecf5', Y:'#f4d03f'
  };

  /* ── hrdina (14×16, kouká doprava) ── */
  const HERO_IDLE = [[
    '....KKKKK.....',
    '...KJJJJJK....',
    '..KJJJJJJJK...',
    '..KJCCCCCJK...',
    '..KJcccccJK...',
    '...KJJJJJK....',
    '..KGJJJJJGK...',
    '.KJJJJJJJJJK..',
    '.KJjJJJJJjJK..',
    '.KJjJJJJJjJK..',
    '..KjJJJJJjK...',
    '...KjJJJjK....',
    '...KBJ.JBK....',
    '...KB...BK....',
    '...KB...BK....',
    '..KBB...BBK...'
  ],[
    '..............',
    '....KKKKK.....',
    '...KJJJJJK....',
    '..KJJJJJJJK...',
    '..KJCCCCCJK...',
    '..KJcccccJK...',
    '...KJJJJJK....',
    '..KGJJJJJGK...',
    '.KJJJJJJJJJK..',
    '.KJjJJJJJjJK..',
    '..KjJJJJJjK...',
    '...KjJJJjK....',
    '...KBJ.JBK....',
    '...KB...BK....',
    '...KB...BK....',
    '..KBB...BBK...'
  ]];
  const HERO_SLASH = [
    '....KKKKK.....',
    '...KJJJJJK....',
    '..KJJJJJJJK...',
    '..KJCCCCCJK...',
    '..KJcccccJK...',
    '...KJJJJJK....',
    '..KGJJJJJGKWW.',
    '.KJJJJJJJJKWW.',
    '.KJjJJJJJJKW..',
    '.KJjJJJJJjK...',
    '..KjJJJJJjK...',
    '...KjJJJjK....',
    '...KBJ.JBK....',
    '...KB...BK....',
    '...KB...BK....',
    '..KBB...BBK...'
  ];
  const HERO_CAST = [
    '....KKKKK..C..',
    '...KJJJJJK.CC.',
    '..KJJJJJJJKC..',
    '..KJCCCCCJK...',
    '..KJcccccJKK..',
    '...KJJJJJKJK..',
    '..KGJJJJJGJK..',
    '.KJJJJJJJJJK..',
    '.KJjJJJJJjK...',
    '.KJjJJJJJjK...',
    '..KjJJJJJjK...',
    '...KjJJJjK....',
    '...KBJ.JBK....',
    '...KB...BK....',
    '...KB...BK....',
    '..KBB...BBK...'
  ];
  const HERO_SHOOT = [
    '....KKKKK.....',
    '...KJJJJJK....',
    '..KJJJJJJJK...',
    '..KJCCCCCJK...',
    '..KJcccccJK...',
    '...KJJJJJK....',
    '..KGJJJJJGKKK.',
    '.KJJJJJJJJGGK.',
    '.KJjJJJJJJKKK.',
    '.KJjJJJJJjK...',
    '..KjJJJJJjK...',
    '...KjJJJjK....',
    '...KBJ.JBK....',
    '...KB...BK....',
    '...KB...BK....',
    '..KBB...BBK...'
  ];
  const HERO_HIT = [
    '....KKKKK.....',
    '...KJJJJJK....',
    '..KJJJJJJJK...',
    '..KJWWWWWJK...',
    '..KJWWWWWJK...',
    '...KJJJJJK....',
    '.KGJJJJJGK....',
    'KJJJJJJJJJK...',
    'KJjJJJJJjJK...',
    'KJjJJJJJjJK...',
    '.KjJJJJJjK....',
    '..KjJJJjK.....',
    '..KBJ.JBK.....',
    '..KB...BK.....',
    '..KB...BK.....',
    '.KBB...BBK....'
  ];

  /* ── bossové: 7 archetypů (oblast 1–7), 18×16, koukají doleva ── */
  // společné znaky: K outline, A akcent (mění se per oblast), a tmavší akcent,
  // M tělo, m tělo stín, W bílá, R červené oko
  const BOSS_PALS = {
    1:{A:'#19e6e6',a:'#0d7a7a',M:'#3a4a66',m:'#28354d'},   // strážní bot — cyan
    2:{A:'#f4d03f',a:'#9a7d10',M:'#5c4a22',m:'#3d3217'},   // reaktor — žlutá
    3:{A:'#39ff9e',a:'#157a4a',M:'#2d4a3a',m:'#1d3328'},   // procesor — zelená
    4:{A:'#ff5dd5',a:'#8a2a72',M:'#4a2d4a',m:'#331d33'},   // glitch — magenta
    5:{A:'#5dade2',a:'#28628f',M:'#2d3a4a',m:'#1d2833'},   // síť — modrá
    6:{A:'#45e0c0',a:'#1d7a66',M:'#2d4a44',m:'#1d332f'},   // monitor — teal
    7:{A:'#ff5d7f',a:'#8f2a44',M:'#4a2d35',m:'#331d23'}    // jádro — červená
  };
  const COMMON = { K:'#0a0c12', W:'#e8ecf5', R:'#ff3355' };

  const BOSS_SPRITES = {
    1: [[ // strážní bot — hranatý robot, 2 idle snímky
      '...KKKKKKKKKK.....',
      '..KMMMMMMMMMMK....',
      '..KMKKKKKKKKMK....',
      '..KMKAAKKAAKMK....',
      '..KMKAAKKAAKMK....',
      '..KMKKKKKKKKMK....',
      '..KmMMMMMMMMmK....',
      '...KKKMMMMKKK.....',
      '..KAAKMmmMKAAK....',
      '.KMMMKMmmMKMMMK...',
      '.KmmmKMMMMKmmmK...',
      '.KKKKKMMMMKKKKK...',
      '....KMMKKMMK......',
      '....KMMK.KMMK.....',
      '....KmmK.KmmK.....',
      '...KKKKK.KKKKK....'
    ],[
      '..................',
      '...KKKKKKKKKK.....',
      '..KMMMMMMMMMMK....',
      '..KMKKKKKKKKMK....',
      '..KMKAAKKAAKMK....',
      '..KMKAAKKAAKMK....',
      '..KMKKKKKKKKMK....',
      '..KmMMMMMMMMmK....',
      '...KKKMMMMKKK.....',
      '..KAAKMmmMKAAK....',
      '.KMMMKMmmMKMMMK...',
      '.KmmmKMMMMKmmmK...',
      '.KKKKKMMMMKKKKK...',
      '....KMMKKMMK......',
      '....KMMK.KMMK.....',
      '...KKKKK.KKKKK....'
    ]],
    2: [[ // reaktorové jádro — pulzující orb s prstenci
      '......KKKKKK......',
      '....KKAAAAAAKK....',
      '...KAAaaaaaaAAK...',
      '..KAaaMMMMMMaaAK..',
      '.KAaMMWWWWMMMMaAK.',
      '.KAaMWWAAWWMMMaAK.',
      'KAaMMWAAAAWMMMMaAK',
      'KAaMMWAAAAWMMMMaAK',
      'KAaMMWWAAWWMMMMaAK',
      '.KAaMMWWWWMMMMaAK.',
      '.KAaaMMMMMMMMaaAK.',
      '..KAaaaaaaaaaaAK..',
      '...KAAaaaaaaAAK...',
      '....KKAAAAAAKK....',
      '......KKKKKK......',
      '..................'
    ],[
      '......KKKKKK......',
      '....KKAAAAAAKK....',
      '...KAAaaaaaaAAK...',
      '..KAaaMMMMMMaaAK..',
      '.KAaMMMWWWWMMMaAK.',
      '.KAaMMWWAAWWMMaAK.',
      'KAaMMMWAAAAWMMMaAK',
      'KAaMMMWAAAAWMMMaAK',
      'KAaMMMWWAAWWMMMaAK',
      '.KAaMMMWWWWMMMaAK.',
      '.KAaaMMMMMMMMaaAK.',
      '..KAaaaaaaaaaaAK..',
      '...KAAaaaaaaAAK...',
      '....KKAAAAAAKK....',
      '......KKKKKK......',
      '..................'
    ]],
    3: [[ // procesorový golem — čip s nohama
      '..KK..........KK..',
      '..KAK........KAK..',
      '...KAK......KAK...',
      '..KKKKKKKKKKKKKK..',
      '.KMMMMMMMMMMMMMMK.',
      '.KMKKKKKKKKKKKKMK.',
      '.KMKAAKAAKAAKAKMK.',
      '.KMKKKKKKKKKKKKMK.',
      '.KMKAKAAKAAKAAKMK.',
      '.KMKKKKKKKKKKKKMK.',
      '.KmMMMMMMMMMMMMmK.',
      '..KKKKKKKKKKKKKK..',
      '...KAK......KAK...',
      '..KAK........KAK..',
      '..KK..........KK..',
      '..................'
    ],[
      '..KK..........KK..',
      '...KAK......KAK...',
      '..KAK........KAK..',
      '..KKKKKKKKKKKKKK..',
      '.KMMMMMMMMMMMMMMK.',
      '.KMKKKKKKKKKKKKMK.',
      '.KMKAKAAKAAKAAKMK.',
      '.KMKKKKKKKKKKKKMK.',
      '.KMKAAKAAKAKAAKMK.',
      '.KMKKKKKKKKKKKKMK.',
      '.KmMMMMMMMMMMMMmK.',
      '..KKKKKKKKKKKKKK..',
      '..KAK........KAK..',
      '...KAK......KAK...',
      '..KK..........KK..',
      '..................'
    ]],
    4: [[ // glitch wraith — roztrhaný duch
      '.....KKKKKKK......',
      '...KKMMMMMMMKK....',
      '..KMMMMMMMMMMMK...',
      '.KMMRRKMMMKRRMMK..',
      '.KMMRRKMMMKRRMMK..',
      '.KMMMMMMMMMMMMMK..',
      '..KMMMKKKKKMMMK...',
      '.KMMMMMMMMMMMMMK..',
      'KAAKMMMMMMMMMKAAK.',
      '.KKMMMKMMMKMMMKK..',
      '..KMMK.KMK.KMMK...',
      '..KMK...K...KMK...',
      '...K..KAK.K..K....',
      '......K.K.A.......',
      '....A.....K.......',
      '..................'
    ],[
      '.....KKKKKKK......',
      '...KKMMMMMMMKK....',
      '..KMMMMMMMMMMMK...',
      '.KMMRRKMMMKRRMMK..',
      '.KMMRRKMMMKRRMMK..',
      '.KMMMMMMMMMMMMMK..',
      '..KMMMKKKKKMMMK...',
      '.KMMMMMMMMMMMMMK..',
      'KAAKMMMMMMMMMKAAK.',
      '.KKMMKMMMMKMMMKK..',
      '..KMK.KMMK..KMK...',
      '..KK...KK....K....',
      '....K.A...KA......',
      '...A....K....K....',
      '......K....A......',
      '..................'
    ]],
    5: [[ // síťový pavouk — spider bot
      '.KK.....KK.....KK.',
      '..KK...KAK....KK..',
      '...KK..KAK...KK...',
      '....KKKKKKKKKK....',
      '...KKMMMMMMMKK....',
      '..KMMMMMMMMMMMK...',
      '.KMMKAAKMKAAKMMK..',
      '.KMMKAAKMKAAKMMK..',
      '.KMMMMMMMMMMMMK...',
      '..KmMMKKKKKMMmK...',
      '...KKKMMMMMKKK....',
      '..KK..KMMMK..KK...',
      '.KK...KKKKK...KK..',
      'KK...KK...KK...KK.',
      'K....K.....K....K.',
      '..................'
    ],[
      '.KK.....KK.....KK.',
      '..KK...KAK....KK..',
      '...KK..KAK...KK...',
      '....KKKKKKKKKK....',
      '...KKMMMMMMMKK....',
      '..KMMMMMMMMMMMK...',
      '.KMMKAAKMKAAKMMK..',
      '.KMMKAAKMKAAKMMK..',
      '.KMMMMMMMMMMMMK...',
      '..KmMMKKKKKMMmK...',
      '...KKKMMMMMKKK....',
      '...KK.KMMMK.KK....',
      '..KK..KKKKK..KK...',
      '.KK..KK...KK..KK..',
      '.K...K.....K...K..',
      '..................'
    ]],
    6: [[ // monitor — CRT hlava s anténou
      '........KAK.......',
      '........KAK.......',
      '....KKKKKKKKKK....',
      '..KKMMMMMMMMMMKK..',
      '.KMMKKKKKKKKKKMMK.',
      '.KMKAAAAAAAAAAKMK.',
      '.KMKAWAAAAAWAAKMK.',
      '.KMKAAAAAAAAAAKMK.',
      '.KMKAAKAAAKAAAKMK.',
      '.KMKAAAAAAAAAAKMK.',
      '.KMMKKKKKKKKKKMMK.',
      '..KKMMMMMMMMMMKK..',
      '....KKKKKKKKKK....',
      '.....KMK..KMK.....',
      '.....KmK..KmK.....',
      '....KKKK..KKKK....'
    ],[
      '........KAK.......',
      '........KAK.......',
      '....KKKKKKKKKK....',
      '..KKMMMMMMMMMMKK..',
      '.KMMKKKKKKKKKKMMK.',
      '.KMKAAAAAAAAAAKMK.',
      '.KMKAAWAAAAAWAKMK.',
      '.KMKAAAAAAAAAAKMK.',
      '.KMKAAAKAAAKAAKMK.',
      '.KMKAAAAAAAAAAKMK.',
      '.KMMKKKKKKKKKKMMK.',
      '..KKMMMMMMMMMMKK..',
      '....KKKKKKKKKK....',
      '.....KMK..KMK.....',
      '.....KmK..KmK.....',
      '....KKKK..KKKK....'
    ]],
    7: [[ // jádro systému — velké oko v mech. schránce
      '....KKKKKKKKKK....',
      '..KKMMMMMMMMMMKK..',
      '.KMMMKKKKKKKKMMMK.',
      '.KMKKAAAAAAAAKKMK.',
      'KMKAAaaaaaaaaAAKMK',
      'KMKAaWWWWWWWWaAKMK',
      'KMKAaWWRRRRWWaAKMK',
      'KMKAaWRRRRRRWaAKMK',
      'KMKAaWRRKKRRWaAKMK',
      'KMKAaWWRRRRWWaAKMK',
      'KMKAaWWWWWWWWaAKMK',
      '.KMKAAaaaaaaAAKMK.',
      '.KMKKAAAAAAAAKKMK.',
      '.KMMMKKKKKKKKMMMK.',
      '..KKMMMMMMMMMMKK..',
      '....KKKKKKKKKK....'
    ],[
      '....KKKKKKKKKK....',
      '..KKMMMMMMMMMMKK..',
      '.KMMMKKKKKKKKMMMK.',
      '.KMKKAAAAAAAAKKMK.',
      'KMKAAaaaaaaaaAAKMK',
      'KMKAaWWWWWWWWaAKMK',
      'KMKAaWWWWWWWWaAKMK',
      'KMKAaWWRRRRWWaAKMK',
      'KMKAaWRRKKRRWaAKMK',
      'KMKAaWWRRRRWWaAKMK',
      'KMKAaWWWWWWWWaAKMK',
      '.KMKAAaaaaaaAAKMK.',
      '.KMKKAAAAAAAAKKMK.',
      '.KMMMKKKKKKKKMMMK.',
      '..KKMMMMMMMMMMKK..',
      '....KKKKKKKKKK....'
    ]]
  };

  /* ── engine ── */
  let cv = null, ctx = null, raf = 0, lastT = 0, tick = 0;
  let curArea = 1, hiddenEmoji = null;
  // stavový automat hrdiny/bosse: 'idle'|'enter'|'slash'|'cast'|'shoot'|'hit'|'charge'|'defeat'|'gone'
  const ST = {
    hero: { mode: 'idle', t: 0 },
    boss: { mode: 'gone', t: 0, flash: 0 },
    fx: []   // {kind:'orb'|'bolt'|'slasharc'|'boom'|'bossproj'|'spark', x,y,t,...}
  };
  const SCALE = 5;          // 1 sprite px = 5 canvas px (hrdina)
  const BSCALE = 6;         // boss je větší
  const FRAME_MS = 130;     // rychlost přepínání snímků

  const rm = () => document.documentElement.classList.contains('reduced-motion');

  function attach(topEl) {
    if (cv && cv.isConnected) return;
    cv = document.createElement('canvas');
    cv.id = 'bt-arena';
    cv.style.cssText = 'display:block;width:100%;height:200px;image-rendering:pixelated;position:relative;z-index:2';
    const mon = document.getElementById('bt-mon');
    if (mon) { mon.style.display = 'none'; hiddenEmoji = mon; }
    topEl.insertBefore(cv, topEl.querySelector('.bt-mname'));
    resize();
    ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (!raf) loop(performance.now());
  }
  function detach() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
    if (hiddenEmoji) { hiddenEmoji.style.display = ''; hiddenEmoji = null; }
    cv = null; ctx = null;
    ST.fx.length = 0;
  }
  const active = () => !!(cv && cv.isConnected);

  function resize() {
    if (!cv) return;
    const w = cv.clientWidth || 600;
    cv.width = w; cv.height = 200;
  }

  function drawSprite(grid, pal, x, y, scale, flipX, flash) {
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        const col = flash ? '#ffffff' : (pal[ch] || COMMON[ch] || '#f0f');
        ctx.fillStyle = col;
        const px = flipX ? x + (row.length - 1 - c) * scale : x + c * scale;
        ctx.fillRect(px, y + r * scale, scale, scale);
      }
    }
  }

  /* pozice: hrdina vlevo dole, boss vpravo */
  function heroPos() { return { x: Math.round(cv.width * 0.12), y: 200 - 16 * SCALE - 14 }; }
  function bossPos() { return { x: Math.round(cv.width * 0.58), y: 200 - 16 * BSCALE - 14 }; }

  function heroGrid() {
    const m = ST.hero.mode;
    if (m === 'slash') return HERO_SLASH;
    if (m === 'cast')  return HERO_CAST;
    if (m === 'shoot') return HERO_SHOOT;
    if (m === 'hit')   return HERO_HIT;
    return HERO_IDLE[tick % 2];
  }

  function render(now) {
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const hp = heroPos(), bp = bossPos();
    const pal = Object.assign({}, COMMON, BOSS_PALS[curArea] || BOSS_PALS[1]);
    // ── boss ──
    const b = ST.boss;
    if (b.mode !== 'gone') {
      let by = bp.y, bx = bp.x, alpha = 1, bscale = BSCALE;
      if (b.mode === 'enter' && !rm()) {
        const p = Math.min(1, b.t / 900);            // 0→1 průběh vstupu
        if (p < 0.55) {                               // pád shora + blikání
          by = bp.y - (1 - p / 0.55) * 130;
          alpha = (Math.floor(b.t / 70) % 3 === 0) ? 0.25 : 0.9;
          bscale = BSCALE * (0.4 + 0.6 * (p / 0.55));
        } else if (p < 0.75) {                        // dopad — squash
          bscale = BSCALE; by = bp.y + 4;
        }
        if (p >= 1) { b.mode = 'idle'; b.t = 0; }
      } else if (b.mode === 'enter') { b.mode = 'idle'; }
      if (b.mode === 'charge' && !rm()) {
        bx += Math.sin(b.t / 30) * 3;
        if (b.t > 650) { b.mode = 'idle'; b.t = 0; }
      } else if (b.mode === 'charge') { if (b.t > 650) { b.mode = 'idle'; b.t = 0; } }
      if (b.mode === 'defeat') {
        const p = Math.min(1, b.t / 900);
        alpha = 1 - p; by = bp.y + p * 30;
        if (p >= 1) b.mode = 'gone';
      }
      const frames = BOSS_SPRITES[curArea] || BOSS_SPRITES[1];
      const grid = frames[rm() ? 0 : tick % frames.length];
      ctx.globalAlpha = alpha;
      const off = (b.flash > 0 && !rm()) ? (b.t % 2 ? 2 : -2) : 0;
      drawSprite(grid, pal, bx + off, by, bscale, false, b.flash > 0);
      ctx.globalAlpha = 1;
      if (b.flash > 0) b.flash -= 16;
      // telegraf útoku: blikající ! nad bossem
      if (b.mode === 'charge' && !rm() && Math.floor(b.t / 110) % 2 === 0) {
        ctx.fillStyle = '#ff3355';
        const ex = bx + 9 * bscale - 4, ey = by - 34;
        ctx.fillRect(ex, ey, 8, 18);
        ctx.fillRect(ex, ey + 22, 8, 8);
      }
    }
    // ── hrdina ──
    const h = ST.hero;
    let hx = hp.x;
    if (h.mode === 'slash' && !rm()) {
      const p = Math.min(1, h.t / 520);               // výpad k bossovi a zpět
      const dash = p < 0.5 ? p * 2 : (1 - p) * 2;
      hx = hp.x + dash * (bp.x - hp.x - 15 * SCALE);
    }
    drawSprite(heroGrid(), PAL_HERO, hx, hp.y, SCALE, false, h.mode === 'hit');
    // ── efekty ──
    for (let i = ST.fx.length - 1; i >= 0; i--) {
      const f = ST.fx[i];
      f.t += 16;
      if (f.kind === 'orb' || f.kind === 'bolt') {
        const dur = f.kind === 'orb' ? 420 : 260;
        const p = Math.min(1, f.t / dur);
        const x = f.x0 + (f.x1 - f.x0) * p;
        const y = f.y0 + (f.y1 - f.y0) * p - (f.kind === 'orb' ? Math.sin(p * Math.PI) * 36 : 0);
        ctx.fillStyle = f.kind === 'orb' ? '#19e6e6' : '#f4d03f';
        const s = f.kind === 'orb' ? 10 : 6;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.fillStyle = f.kind === 'orb' ? 'rgba(25,230,230,.4)' : 'rgba(244,208,63,.4)';
        ctx.fillRect(x - s, y - s, s * 2, s * 2);
        if (p >= 1) { ST.fx.splice(i, 1); impact(f); }
      } else if (f.kind === 'bossproj') {
        const p = Math.min(1, f.t / 480);
        const x = f.x0 + (f.x1 - f.x0) * p;
        const y = f.y0 + (f.y1 - f.y0) * p;
        ctx.fillStyle = '#ff3355';
        ctx.fillRect(x - 5, y - 5, 10, 10);
        ctx.fillStyle = 'rgba(255,51,85,.4)';
        ctx.fillRect(x - 9, y - 9, 18, 18);
        if (p >= 1) {
          ST.fx.splice(i, 1);
          ST.hero.mode = 'hit'; ST.hero.t = 0;
          setTimeout(() => { if (ST.hero.mode === 'hit') { ST.hero.mode = 'idle'; ST.hero.t = 0; } }, 420);
        }
      } else if (f.kind === 'slasharc') {
        const p = Math.min(1, f.t / 240);
        ctx.strokeStyle = 'rgba(232,236,245,' + (1 - p) + ')';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 26 + p * 22, -1.1 + p, 0.9 + p);
        ctx.stroke();
        if (p >= 1) ST.fx.splice(i, 1);
      } else if (f.kind === 'boom') {
        const p = Math.min(1, f.t / 380);
        for (let k = 0; k < 8; k++) {
          const ang = k / 8 * Math.PI * 2;
          const d = p * 38;
          ctx.fillStyle = 'rgba(' + f.rgb + ',' + (1 - p) + ')';
          ctx.fillRect(f.x + Math.cos(ang) * d - 3, f.y + Math.sin(ang) * d - 3, 6, 6);
        }
        if (p >= 1) ST.fx.splice(i, 1);
      }
    }
  }

  function impact(f) {
    ST.boss.flash = 130; ST.boss.t = 0;
    ST.fx.push({ kind: 'boom', x: f.x1, y: f.y1, t: 0, rgb: f.kind === 'orb' ? '25,230,230' : '244,208,63' });
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(64, now - lastT); lastT = now;
    if (!ctx) return;
    if (now - (loop._ft || 0) > FRAME_MS) { tick++; loop._ft = now; }
    ST.hero.t += dt; ST.boss.t += dt;
    render(now);
  }

  /* ── veřejné akce ── */
  function spawn(areaId) {
    curArea = Math.max(1, Math.min(7, areaId | 0));
    resize();
    ST.boss.mode = rm() ? 'idle' : 'enter';
    ST.boss.t = 0; ST.boss.flash = 0;
    ST.hero.mode = 'idle'; ST.hero.t = 0;
    ST.fx.length = 0;
  }

  const ATTACKS = ['slash', 'cast', 'shoot'];
  let lastAtk = '';
  function heroAttack() {
    if (!active()) return;
    // náhodný útok, ale ne 2× stejný po sobě
    let kind = ATTACKS[Math.floor(Math.random() * ATTACKS.length)];
    if (kind === lastAtk) kind = ATTACKS[(ATTACKS.indexOf(kind) + 1) % ATTACKS.length];
    lastAtk = kind;
    const hp = heroPos(), bp = bossPos();
    const bcx = bp.x + 9 * BSCALE, bcy = bp.y + 8 * BSCALE;
    if (rm()) { ST.boss.flash = 130; ST.boss.t = 0; return; }
    ST.hero.mode = kind === 'cast' ? 'cast' : kind === 'shoot' ? 'shoot' : 'slash';
    ST.hero.t = 0;
    if (kind === 'slash') {
      setTimeout(() => { ST.fx.push({ kind: 'slasharc', x: bcx - 20, y: bcy, t: 0 }); ST.boss.flash = 130; ST.boss.t = 0; ST.fx.push({ kind: 'boom', x: bcx, y: bcy, t: 0, rgb: '232,236,245' }); }, 260);
      setTimeout(() => { if (ST.hero.mode === 'slash') { ST.hero.mode = 'idle'; ST.hero.t = 0; } }, 540);
    } else if (kind === 'cast') {
      ST.fx.push({ kind: 'orb', x0: hp.x + 13 * SCALE, y0: hp.y + 2 * SCALE, x1: bcx, y1: bcy, t: 0 });
      setTimeout(() => { if (ST.hero.mode === 'cast') { ST.hero.mode = 'idle'; ST.hero.t = 0; } }, 460);
    } else {
      ST.fx.push({ kind: 'bolt', x0: hp.x + 13 * SCALE, y0: hp.y + 8 * SCALE, x1: bcx, y1: bcy, t: 0 });
      setTimeout(() => { if (ST.hero.mode === 'shoot') { ST.hero.mode = 'idle'; ST.hero.t = 0; } }, 320);
    }
  }

  function bossAttack() {
    if (!active()) return;
    const hp = heroPos(), bp = bossPos();
    if (rm()) { ST.hero.mode = 'hit'; setTimeout(() => { ST.hero.mode = 'idle'; }, 300); return; }
    ST.boss.mode = 'charge'; ST.boss.t = 0;
    setTimeout(() => {
      ST.fx.push({ kind: 'bossproj', x0: bp.x + 4 * BSCALE, y0: bp.y + 8 * BSCALE, x1: hp.x + 7 * SCALE, y1: hp.y + 8 * SCALE, t: 0 });
    }, 520);
  }

  function defeat() {
    if (!active()) return;
    const bp = bossPos();
    ST.boss.mode = 'defeat'; ST.boss.t = 0;
    const pal = BOSS_PALS[curArea] || BOSS_PALS[1];
    const rgb = parseInt(pal.A.slice(1), 16);
    ST.fx.push({ kind: 'boom', x: bp.x + 9 * BSCALE, y: bp.y + 8 * BSCALE, t: 0, rgb: ((rgb >> 16) & 255) + ',' + ((rgb >> 8) & 255) + ',' + (rgb & 255) });
  }

  window.addEventListener('resize', resize);

  return { attach, detach, active, spawn, heroAttack, bossAttack, defeat };
})();
