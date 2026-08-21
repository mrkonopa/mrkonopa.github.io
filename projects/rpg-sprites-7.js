/* ════════════════════════════════════════════════════════════════════
   rpg-sprites-7.js — svět 7. ročníku pro rpg-sprite-core
   ────────────────────────────────────────────────────────────────────
   KROK A migrace: jen data + pozadí, engine je ve sdíleném jádru.
   Mřížky jsou ZÁMĚRNĚ ty současné (hrdina 18×24) a rim light ani
   kontaktní stín se nekreslí — tenhle krok NESMÍ změnit vzhled.
   Nové mřížky 20×29 přijdou v kroku B.

   Bez jádra se nedefinuje NIC a hra jede dál na emoji animacích.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palety ── */
  // Hrdina v průzkumném obleku (olivová/khaki)
  /* ══ paleta ══
     Ramp 1–4 a akcent A/a jsou tokeny --g7-ramp1..4 / --g7-accent z fáze 00,
     takže portrét na kartě hubu a sprite v aréně jsou tatáž postava.
     Znak 'e' = světlý tón (sklo přilby / papyrus / papír).
     Znak 'O' v mřížce = rim light — v paletě NENÍ, barvu dodává jádro. */
  const PAL_HERO = {
    K: '#05070c',
    1: '#2b1d0c', 2: '#4c3419', 3: '#715228', 4: '#ab834a',
    A: '#f2c14e', a: '#7a5a12', e: '#fff2cf',
    W: '#eef4ff', w: '#93a1bd',
    Y: '#f4d03f', y: '#9a7a12',
    G: '#3d465e', g: '#8b98b5'
  };

  /* Přepisují jen ramp 2–4 a akcent; K, e, W/w, Y/y, G/g zůstávají, takže
     žádný znak nezůstane nedefinovaný. ID stejná — obchod je prodává. */
  const HERO_SKINS = {
    'skin-gold': { 2: '#4a3a0e', 3: '#8a6a12', 4: '#caa12a', A: '#fff0b0', a: '#c9a227' },
    'skin-red': { 2: '#3d0d14', 3: '#7a1a26', 4: '#c23a48', A: '#ff6b6b', a: '#a02020' },
    'skin-emerald': { 2: '#0a3323', 3: '#0f6b45', 4: '#2aa877', A: '#39ff9e', a: '#1a8a5a' },
    'skin-ghost': { 2: '#1d1733', 3: '#3a2d63', 4: '#6a55a8', A: '#c08aff', a: '#7a4fd0' },
    'skin-stealth': { 2: '#14161c', 3: '#262a33', 4: '#4a515e', A: '#9fb0c8', a: '#5a6a85' }
  };

  /* ══ hrdina — 20 × 29, 28 pokreslených řádků (spodní je rezerva pro stín) ══
     Sloupce 0–15 tělo, 16–19 rekvizita (pochodeň).
     Řádek 13, sloupce 14–15 je PŘEDLOKTÍ, které rekvizitu drží —
     bez něj se vznáší vedle těla. Drží se v jednom bodě, ne po celé délce. */
  const IDLE0 = [
    '.......K44K.........',
    '......K3333K........',
    '...KKKKKKKKKK.......',
    '...K33333333K....A..',
    '...KK444444KK...AeA.',
    '....O44444K.....AYA.',
    '....O4eAAe4K....YAY.',
    '....O44444K......Y..',
    '.....K444K......KwK.',
    '.....K111K......KwK.',
    '...O44444444K...KwK.',
    '..O4w4444444K...KwK.',
    '..O43w333332K...KwK.',
    '..O433w3332KGGGGKwK.',
    '..O4333w332KgG..KwK.',
    '..O4YYYYYYY2KGG.KYK.',
    '..O43333332K........',
    '..K23333322K........',
    '...K3333333K........',
    '...K333K.K333K......',
    '...O433K.O433K......',
    '...O433K.O433K......',
    '...OG3GK.OG3GK......',
    '...KGGGK.KGGGK......',
    '...KgGGK.KgGGK......',
    '...KGGGK.KGGGK......',
    '...KGGGK.KGGGK......',
    '...KKKKK.KKKKK......',
    '....................'
  ];

  /* ── pózy se ODVOZUJÍ z IDLE0, neopisují se ── */
  const W = IDLE0[0].length;
  const paste = (gr, r, c, s) => { gr[r] = (gr[r].slice(0, c) + s + gr[r].slice(c + s.length)).slice(0, W); };

  /* Ruší rekvizitu I to předloktí — meč a rekvizita se vylučují a bez druhého
     kroku by v pózách s mečem zůstal viset dvoupixelový stub. */
  function stripProp(gr) {
    const out = gr.map(r => r.slice(0, 16) + '....');
    paste(out, 13, 14, '..');
    return out;
  }

  /* Dech vypouští ZDVOJENÝ řádek 21 a zbytek posune o pixel níž.
     Nohy zůstávají na místě ⇒ oba snímky mají 28 pokreslených řádků,
     chodidla neposkakují a kontaktní stín se neodlepí. */
  const IDLE1 = ['.'.repeat(W)].concat(IDLE0.slice(0, 21)).concat(IDLE0.slice(22));

  const WINDUP = stripProp(IDLE0.slice());
  paste(WINDUP, 0, 12, 'KWWWWWK'); paste(WINDUP, 1, 13, 'KwWWWK'); paste(WINDUP, 2, 15, 'KYYK');

  const SLASH = stripProp(IDLE0.slice());
  paste(SLASH, 12, 13, 'KWWWWWK'); paste(SLASH, 13, 13, 'KwWWWwK');

  const CAST = IDLE0.slice();
  paste(CAST, 1, 0, 'AA'); paste(CAST, 2, 0, 'AAA'); paste(CAST, 3, 0, 'aAa'); paste(CAST, 4, 0, '.A.');

  const SHOOT = stripProp(IDLE0.slice());
  paste(SHOOT, 13, 13, 'KGGWWA'); paste(SHOOT, 14, 13, 'KKK');

  const HIT = IDLE0.map(r => r.replace(/A/g, 'a').replace(/O/g, 'K'));

  const PAL_COM = { K:'#0a0c12', G:'#c8a040', g:'#806820', S:'#e8d090', T:'#40a8c0' };
      const COMPANION = [[
    '.....KGGK.....',
    '...KKGGGGKK...',
    '..KGGGggGGGK..',
    '.KGGGgGGgGGGK.',
    '.KGTGgGGgGTGK.',
    'KGGGGggggGGGGK',
    'KGGgGGGGGGgGGK',
    '.KGGGggggGGGK.',
    '..KGGGggGGGK..',
    '...KKGggGKK...',
    '..KGK.KK.KGK..',
    '.KGK......KGK.',
    'KGK........KGK',
    '.K..........K.'
  ],[
    '.....KGGK.....',
    '...KKGGGGKK...',
    '..KGGGggGGGK..',
    '.KGGGgGGgGGGK.',
    '.KGTGgGGgGTGK.',
    'KGGggGGGGggGGK',
    'KGGgGGGGGGgGGK',
    '.KGGGggggGGGK.',
    '..KGGGggGGGK..',
    '...KKGggGKK...',
    '..KGK.KK.KGK..',
    'KGK........KGK',
    '.KGK......KGK.',
    '.K..........K.'
  ]];

  /* ── bossové: 7 oblastí, egyptská/chrámová témata ── */
  const BOSS_PALS = {
    1:{A:'#e8c060',a:'#806820',M:'#5c3a10',m:'#3d2808'},   // strážce karavany — zlatá
    2:{A:'#e0c050',a:'#8a7020',M:'#a89858',m:'#706438'},   // had hieroglyfů — pískový
    3:{A:'#88ddff',a:'#3a7a9f',M:'#2a3a5c',m:'#1a2840'},   // ledový strážce — modrá
    4:{A:'#d4a820',a:'#8a6810',M:'#5c3a10',m:'#3d2808'},   // strážce vah — bronz
    5:{A:'#c0c8d8',a:'#6a7888',M:'#3a4050',m:'#282a38'},   // strážce zrcadla — stříbro
    6:{A:'#e84040',a:'#881818',M:'#c4bca0',m:'#8a8268'},   // mumie — obvazy + rudé oči
    7:{A:'#f0c830',a:'#9a7a10',M:'#4a3810',m:'#322808'}    // strážce pyramidy — královské zlato
  };
  const COMMON = { K:'#0a0c12', W:'#e8ecf5', R:'#ff3355' };

  const BOSS_SPRITES = {
    1: [[ // strážce karavany — kamenná socha Anubise (18×24 hi-res)
      '...KK......KK.....',
      '..KMMK....KMMK....',
      '..KMMKKKKKKMMK....',
      '..KMMMMMMMMMMK....',
      '..KMMMMMMMMMMK....',
      '..KMMWAKKAWMMK....',
      '..KMMMMMMMMMMK....',
      '...KMMmmMMK.......',
      '...KMMMMMMK.......',
      '..KKAAAAAAAAKK....',
      '..KMMAaAAaAMMK....',
      '..KMMMAAAAMMMK....',
      '..KMMMMMMMMMMK....',
      '..KMMMMMMMMMMK....',
      '..KMmMMMMMMmMK....',
      '..KMMMMMMMMMMK....',
      '..KMMKMMMMKMMK....',
      '..KMMKMMMMKMMK....',
      '..KmmKMmmMKmmK....',
      '..KKKKMMMMKKKK....',
      '.....KKKKKK.......',
      '..................',
      '..................',
      '..................'
    ],[
      '...KK......KK.....',
      '..KMMK....KMMK....',
      '..KMMKKKKKKMMK....',
      '..KMMMMMMMMMMK....',
      '..KMMMMMMMMMMK....',
      '..KMMAWKKWAMMK....',
      '..KMMMMMMMMMMK....',
      '...KMMmmMMK.......',
      '...KMMMMMMK.......',
      '..KKAAAAAAAAKK....',
      '..KMMAaAAaAMMK....',
      '..KMMMAAAAMMMK....',
      '..KMMMMMMMMMMK....',
      '..KMMMMMMMMMMK....',
      '..KMmMMMMMMmMK....',
      '..KMMMMMMMMMMK....',
      '..KMMKMMMMKMMK....',
      '..KMMKMMMMKMMK....',
      '..KmmKMmmMKmmK....',
      '..KKKKMMMMKKKK....',
      '.....KKKKKK.......',
      '..................',
      '..................',
      '..................'
    ]],
    2: [[ // had hieroglyfů — vztyčená kobra (18×24 hi-res)
      '......KKKK........',
      '.....KMMMMK.......',
      '....KMMMMMMK......',
      '...KMMWAKKAWMMK...',
      '...KMMMMMMMMMK....',
      '..KMMAAAAAAAAMMK..',
      '..KMAaAAAAAAaAMMK.',
      '..KMMAAAAAAAAMMK..',
      '...KMMMMMMMMMMK...',
      '....KMMMMMMMK.....',
      '.....KMMMMK.......',
      '.....KAMMAK.......',
      '......KMMAK.......',
      '......KAMMK.......',
      '.....KMMAMMK......',
      '....KMMAMMMMK.....',
      '...KMMMMMAMMMK....',
      '..KMmMMMMMMAMmMK..',
      '..KKKKKKKKKKKKKK..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '......KKKK........',
      '.....KMMMMK.......',
      '....KMMMMMMK......',
      '...KMMWAKKAWMMK...',
      '...KMMMMMMMMMK....',
      '..KMMAAAAAAAAMMK..',
      '..KMAAaAAAAaAAMMK.',
      '..KMMAAAAAAAAMMK..',
      '...KMMMMMMMMMMK...',
      '....KMMMMMMMK.....',
      '.....KMMMMK.......',
      '.....KAMMAK.......',
      '......KMMAK.......',
      '......KAMMK.......',
      '.....KMMAMMK......',
      '....KMMAMMMMK.....',
      '...KMMMMMAMMMK....',
      '..KMmMMMAMMMMMmMK.',
      '..KKKKKKKKKKKKKK..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    3: [[ // ledový strážce — krystalický golem (18×24 hi-res)
      '..................',
      '..................',
      '........KK........',
      '.......KAAK.......',
      '......KAAAAK......',
      '.....KAAAAAAK.....',
      '....KAAWKKWAAK....',
      '....KAAKKKKAAK....',
      '....KAAAAAAAAK....',
      '...KKAAaaaaAAKK...',
      '..KAKAaAAAAaAKAK..',
      '.KAAKAAAAAAAAKAAK.',
      '.KaAKAaAAAAaAKAaK.',
      '..KKKAAAAAAAAKKK..',
      '....KAaAAAAaAK....',
      '....KAAAAAAAAK....',
      '....KAAK..KAAK....',
      '....KaAK..KAaK....',
      '...KKKKK..KKKKK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '..................',
      '........KK........',
      '.......KAAK.......',
      '......KAAAAK......',
      '.....KAAAAAAK.....',
      '....KAWAKKAAWK....',
      '....KAAKKKKAAK....',
      '....KAAAAAAAAK....',
      '...KKAAaaaaAAKK...',
      '..KAKAAaAAaAAKAK..',
      '.KAAKAAAAAAAAKAAK.',
      '.KaAKAAaAAaAAKAaK.',
      '..KKKAAAAAAAAKKK..',
      '....KAaAAAAaAK....',
      '....KAAAAAAAAK....',
      '....KAAK..KAAK....',
      '....KaAK..KAaK....',
      '...KKKKK..KKKKK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    4: [[ // strážce vah — oživlé zlaté váhy (18×24 hi-res)
      '........KK........',
      '.......KAAK.......',
      '....KKKKAAKKKK....',
      '..KKAAAAAAAAAAKK..',
      '.KAK...KAAK...KAK.',
      '.KAK..KAAAAK..KAK.',
      'KAWAK.KAAAAK.KAWAK',
      'KAAAK.KAAAAK.KAAAK',
      '.KKK..KAAAAK..KKK.',
      '......KAAAAK......',
      '......KAAAAK......',
      '.....KAAAAAAK.....',
      '....KAAaAAaAAK....',
      '...KMMMMMMMMMMK...',
      '..KMMMMMMMMMMMMK..',
      '..KMmMMMMMMMMmMK..',
      '..KMMMMMMMMMMMMK..',
      '..KKKKKKKKKKKKKK..',
      '...KMK......KMK...',
      '...KKK......KKK...',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '........KK........',
      '.......KAAK.......',
      '....KKKKAAKKKK....',
      '..KKAAAAAAAAAAKK..',
      '.KAK...KAAK...KAK.',
      '.KAK...KAAK...KAK.',
      'KAAK..KAAAAK..KAAK',
      'KAAAK.KAAAAK.KAAAK',
      '.KKK..KAAAAK..KKK.',
      '......KAAAAK......',
      '......KAAAAK......',
      '.....KAAAAAAK.....',
      '....KAAAaaAAAK....',
      '...KMMMMMMMMMMK...',
      '..KMMMMMMMMMMMMK..',
      '..KMmMMMMMMMMmMK..',
      '..KMMMMMMMMMMMMK..',
      '..KKKKKKKKKKKKKK..',
      '...KMK......KMK...',
      '...KKK......KKK...',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    5: [[ // pokladník faraona — žijící truhla (18×24 hi-res)
      '..................',
      '..................',
      '...KKKKKKKKKKKK...',
      '..KMMMMMMMMMMMMK..',
      '.KMMAAAAAAAAAAMMK.',
      '.KMAAaAAAAAAaAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '.KKKKKKKKKKKKKKKK.',
      '.KMWWKAAAAAAKWWMK.',
      '.KMWAKAaAAaAKAWMK.',
      '.KMMMKAAAAAAKMMMK.',
      '.KMAAAAKKKKAAAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '.KMMMAAaAAaAAMMMK.',
      '.KmMMMMMMMMMMMMmK.',
      '..KKKKKKKKKKKKKK..',
      '..KMK........KMK..',
      '..KKK........KKK..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '..................',
      '...KKKKKKKKKKKK...',
      '..KMMMMMMMMMMMMK..',
      '.KMMAAAAAAAAAAMMK.',
      '.KMAAaAAAAAAaAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '.KKKKKKKKKKKKKKKK.',
      '.KMAWKAAAAAAKWAMK.',
      '.KMWWKAAaaAAKWWMK.',
      '.KMMMKAAAAAAKMMMK.',
      '.KMAAAAKKKKAAAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '.KMMMAAaAAaAAMMMK.',
      '.KmMMMMMMMMMMMMmK.',
      '..KKKKKKKKKKKKKK..',
      '..KMK........KMK..',
      '..KKK........KKK..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    6: [[ // kněz shodnosti — prastará mumie (18×24 hi-res)
      '......KKKKKK......',
      '.....KMMMMMMK.....',
      '....KMMmMMmMMK....',
      '....KMRWKKWRMK....',
      '....KMKKKKKKMK....',
      '....KMMmKKmMMK....',
      '.....KMMMMMMK.....',
      '....KKKMmmMKKK....',
      '...KMMKMMMMKMMK...',
      '..KMmMKmMMmKMmMK..',
      '..KMMMKMMMMKMMMK..',
      '..KmMKKMmmMKKMmK..',
      '..KMMMKMMMMKMMMK..',
      '...KKK.KMMK.KKK...',
      '.......KMmMK......',
      '.......KMMMK......',
      '......KKKKKK......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '......KKKKKK......',
      '.....KMMMMMMK.....',
      '....KMMmMMmMMK....',
      '....KMWRKKRWMK....',
      '....KMKKKKKKMK....',
      '....KMMmKKmMMK....',
      '.....KMMMMMMK.....',
      '....KKKMmmMKKK....',
      '...KMMKMMMMKMMK...',
      '..KMmMKMmmMKMmMK..',
      '..KMMMKMMMMKMMMK..',
      '..KmMKKmMMmKKMmK..',
      '..KMMMKMMMMKMMMK..',
      '...KKK.KMMK.KKK...',
      '.......KMmMK......',
      '.......KMMMK......',
      '......KKKKKK......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    7: [[ // strážce pyramidy — zlatý sarkofág faraona (18×24 hi-res)
      '.....KKKKKKKK.....',
      '....KAAAAAAAAK....',
      '...KAAMMMMMMAAK...',
      '...KAMKWKKWKMAK...',
      '...KAMKKKKKKMAK...',
      '...KAAMMmmMMAAK...',
      '...KAAAMMMMAAAK...',
      '..KAKAAAAAAAAKAK..',
      '..KAKAaAAAAaAKAK..',
      '..KAKAAAAAAAAKAK..',
      '..KAKAAaAAaAAKAK..',
      '..KAKAAAAAAAAKAK..',
      '..KAKAAaAAaAAKAK..',
      '...KAAaAAAAaAAK...',
      '...KAAAAAAAAAAK...',
      '....KAAAAAAAAK....',
      '....KMMMMMMMMK....',
      '...KKKKKKKKKKKK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '.....KKKKKKKK.....',
      '....KAAAAAAAAK....',
      '...KAAMMMMMMAAK...',
      '...KAMKKWWKKMAK...',
      '...KAMKKKKKKMAK...',
      '...KAAMMmmMMAAK...',
      '...KAAAMMMMAAAK...',
      '..KAKAAAAAAAAKAK..',
      '..KAKAAaAAaAAKAK..',
      '..KAKAAAAAAAAKAK..',
      '..KAKAaAAAAaAKAK..',
      '..KAKAAAAAAAAKAK..',
      '..KAKAAaAAaAAKAK..',
      '...KAAaAAAAaAAK...',
      '...KAAAAAAAAAAK...',
      '....KAAAAAAAAK....',
      '....KMMMMMMMMK....',
      '...KKKKKKKKKKKK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]]
  };

  function pxDisc(g, cx, cy, r, step, color) {
    g.fillStyle = color;
    const rr = r * r;
    for (let y = -r; y <= r; y += step)
      for (let x = -r; x <= r; x += step)
        if (x * x + y * y <= rr) g.fillRect(Math.round(cx + x), Math.round(cy + y), step, step);
  }

  const G7_TH = {
    1: { sun: '#e8a23a', pyr: '#43321c' }, // úsvit
    2: { sun: '#e0c050', pyr: '#4a3a1e' }, // zlatá
    3: { sun: '#bfe0f0', pyr: '#33414e' }, // ledová oblast — chladnější
    4: { sun: '#f0d060', pyr: '#46361c' },
    5: { sun: '#e8b040', pyr: '#3e2e16' },
    6: { sun: '#d8c068', pyr: '#403420' },
    7: { sun: '#f0c040', pyr: '#46351a' }
  };
  function paintSky(g, env, animOK) {
    const W = env.w, H = env.h, now = env.now;
    const th = G7_TH[env.area] || G7_TH[1];
    const rnd = env.rnd;
    const fy = H - 30;
    // noční hvězdy
    for (let i = 0; i < 22; i++) {
      const x = Math.floor(rnd() * W), y = Math.floor(rnd() * (fy - 50));
      g.globalAlpha = animOK ? 0.28 + 0.3 * Math.abs(Math.sin(now / 700 + i * 1.3)) : 0.4;
      g.fillStyle = '#f0e0b0'; g.fillRect(x, y, 1, 1);
    }
    g.globalAlpha = 1;
    // slunce / měsíc vlevo nahoře
    const scx = Math.round(W * 0.30), scy = 40, sr = 17;
    g.globalAlpha = 0.25; pxDisc(g, scx, scy, sr + 6, 3, th.sun);
    g.globalAlpha = 0.85; pxDisc(g, scx, scy, sr, 3, th.sun);
    g.globalAlpha = 1;
    // pyramidy na horizontu
    function pyr(px, w, col) {
      g.fillStyle = col;
      for (let yy = 0; yy < w / 2; yy++) { const ww = w - yy * 2; g.fillRect(Math.round(px - ww / 2), fy - yy * 2, ww, 2); }
    }
    g.globalAlpha = 0.55;
    pyr(Math.round(W * 0.54), 52, th.pyr);
    pyr(Math.round(W * 0.70), 40, th.pyr);
    pyr(Math.round(W * 0.84), 30, th.pyr);
    pyr(Math.round(W * 0.20), 38, th.pyr);
    g.globalAlpha = 1;
    // rámující chrámové sloupy
    function pillar(px) {
      g.globalAlpha = 0.55; g.fillStyle = '#2c2418';
      g.fillRect(px, 26, 16, fy - 26);
      g.fillStyle = '#3a3020'; g.fillRect(px - 3, 22, 22, 6); g.fillRect(px - 3, fy - 6, 22, 6);
      g.fillStyle = '#1f190f'; for (let yy = 32; yy < fy - 8; yy += 9) g.fillRect(px + 4, yy, 2, 5);
      g.globalAlpha = 1;
    }
    pillar(4); pillar(W - 20);
  }

  const backdrop = {
    horizon: 0.46,
    seed: a => a * 131 + 7,   // PŮVODNÍ seed — jinak se rozložení posune
    /* Pozadí se odjakživa překresluje celé každý snímek, proto `fullAnim`
       a obě vrstvy volají téhož malíře: statická s vypnutým blikáním,
       pohyblivá se zapnutým. Rozdělit ho na „staticky pozadí, pohyblivě
       jen blikání“ nejde — změnilo by se pořadí kreslení. */
    fullAnim: true,
    paintStatic(g, env) { paintSky(g, env, false); },
    paintAnim(g, env)   { paintSky(g, env, env.animOK); }
  };

  /* Neon oblasti = akcent bosse. V kroku A se nepoužije (rim je vypnutý). */
  const AREAS = {
    1: { neon: '#e8c060' },
    2: { neon: '#e0c050' },
    3: { neon: '#88ddff' },
    4: { neon: '#d4a820' },
    5: { neon: '#c0c8d8' },
    6: { neon: '#e84040' },
    7: { neon: '#f0c830' },
  };

  const WORLD7 = {
    id: 7,
    /* bossPad 14: starý engine měl bosse na pevných 186 px. */
    arena: { h: 200, groundPad: 14, bossPad: 14, heroX: 0.12, bossX: 0.58 },
    hero: {
      cols: 20, rows: 29, legacyRows: 24,   // legacyRows = kotva drawHeroOn (Věž legend)
      scale: 5, pal: PAL_HERO, skins: HERO_SKINS,
      grids: { idle: [IDLE0, IDLE1], windup: WINDUP, slash: SLASH,
               cast: CAST, shoot: SHOOT, hit: HIT }
    },
    /* dx 96 = staré hp.x + 18*SCALE + 6; výchozí (18−2)*5+6 = 86 by parťáka
       posunulo o 10 px doleva.  `jet` = jiskřičky pod parťákem — bez nich
       se parťák kreslí, ale efekt tiše zmizí, a pod reduced-motion se to
       NEPOZNÁ, protože se stejně nekreslí. */
    ally: { scale: 4, dy: 34, pal: PAL_COM, grids: COMPANION,
            jet: { hot: '#e8c060', cold: '#a07820', at: [[5, 13]] } },
    /* 5, NE 7 — všech 7 bossů má 24 řádků, starý engine je kreslil
       měřítkem 5 a BSCALE = 7 je mrtvá konstanta. NEOPRAVOVAT. */
    bosses: { scale: 5, pals: BOSS_PALS, common: COMMON, grids: BOSS_SPRITES },
    areas: AREAS,
    backdrop: backdrop
  };

  window.RPGSpriteWorld7 = WORLD7;
  if (window.RPGSpriteCore) window.RPGSprites7 = window.RPGSpriteCore.create(WORLD7);
})();
