/* ════════════════════════════════════════════════════════════════════
   rpg-sprites-8.js — svět 8. ročníku pro rpg-sprite-core
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
  // Hrdina ve fialovém akademickém rouchu
  const PAL_HERO = {
    K:'#0a0c12', J:'#4a5ec8', j:'#2a3a8a', C:'#b8c0ff', c:'#7878e0',
    G:'#8a92c0', B:'#23232e', W:'#e8ecf5', Y:'#f4d03f'
  };
  const HERO_SKINS = {
    'skin-gold':    { J:'#caa12a', j:'#8a6a12', C:'#fff0b0', c:'#c9a227', G:'#8a7a3a' },
    'skin-red':     { J:'#a51d2e', j:'#5e1019', C:'#ff6b6b', c:'#a02020', G:'#7a3a44' },
    'skin-emerald': { J:'#108a55', j:'#0a4d31', C:'#39ff9e', c:'#1a8a5a', G:'#3a7a5a' },
    'skin-ghost':   { J:'#4a3a78', j:'#241d3f', C:'#c08aff', c:'#7a4fd0', G:'#6a5a85' },
    'skin-stealth': { J:'#2c2c34', j:'#161619', C:'#9fb0c8', c:'#5a6a85', G:'#40454f' }
  };
  let activeSkin = null;
  function setSkin(key) { activeSkin = HERO_SKINS[key] ? key : null; }
  function heroPal() { return activeSkin ? Object.assign({}, PAL_HERO, HERO_SKINS[activeSkin]) : PAL_HERO; }

  /* ── hrdina (18×24, student magie v rouchu — kouká doprava) ── */
  const HERO_IDLE = [[
    '.......K..........',
    '......KJjK........',
    '.....KJJjjK.......',
    '....KJJJJjjK......',
    '...KJJJJJJjjK.....',
    '..KJJJYJJJJjjK....',
    '.KJJJJJJJJJJJJK...',
    '.KKKKKKKKKKKKKKK..',
    '....KcCCCCCcK.....',
    '....KcCYCCCcK.....',
    '....KcCCCCCcK.....',
    '.....KcccccK......',
    '...KJJJJJJJJJJK...',
    '..KJJjJJJJJjJJK...',
    '..KJJjJCCJjJJK....',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJJYYYJJJJJK..',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJJK.',
    '.KKKKKKKKKKKKKKKK.'
  ],[
    '..................',
    '.......K..........',
    '......KJjK........',
    '.....KJJjjK.......',
    '....KJJJJjjK......',
    '...KJJJJJJjjK.....',
    '..KJJJYJJJJjjK....',
    '.KJJJJJJJJJJJJK...',
    '.KKKKKKKKKKKKKKK..',
    '....KcCCCCCcK.....',
    '....KcCYCCCcK.....',
    '....KcCCCCCcK.....',
    '.....KcccccK......',
    '...KJJJJJJJJJJK...',
    '..KJJjJJJJJjJJK...',
    '..KJJjJCCJjJJK....',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJJYYYJJJJJK..',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJJK.'
  ]];
  const HERO_SLASH = [
    '.......K..........',
    '......KJjK........',
    '.....KJJjjK.......',
    '....KJJJJjjK......',
    '...KJJJJJJjjK.....',
    '..KJJJYJJJJjjK....',
    '.KJJJJJJJJJJJJK...',
    '.KKKKKKKKKKKKKKK..',
    '....KcCCCCCcK.....',
    '....KcCYCCCcK.....',
    '....KcCCCCCcK.....',
    '.....KcccccK......',
    '...KJJJJJJJJJJKcCK',
    '..KJJjJJJJJjJJKcCK',
    '..KJJjJCCJjJJKKKK.',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJJYYYJJJJJK..',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJJK.',
    '.KKKKKKKKKKKKKKKK.'
  ];
  const HERO_CAST = [
    'C......K..........',
    'CC....KJjK........',
    '.CC..KJJjjK.......',
    '..CCKJJJJjjK......',
    '...KJJJJJJjjK.....',
    '..KJJJYJJJJjjK....',
    '.KJJJJJJJJJJJJK...',
    '.KKKKKKKKKKKKKKK..',
    '....KcCCCCCcK.....',
    '....KcCYCCCcK.....',
    '....KcCCCCCcK.....',
    '.....KcccccK......',
    '...KJJJJJJJJJJK...',
    '..KJJjJJJJJjJJK...',
    '..KJJjJCCJjJJK....',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJJYYYJJJJJK..',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJJK.',
    '.KKKKKKKKKKKKKKKK.'
  ];
  const HERO_SHOOT = [
    '.......K..........',
    '......KJjK........',
    '.....KJJjjK.......',
    '....KJJJJjjK......',
    '...KJJJJJJjjK.....',
    '..KJJJYJJJJjjK....',
    '.KJJJJJJJJJJJJK...',
    '.KKKKKKKKKKKKKKK..',
    '....KcCCCCCcK.....',
    '....KcCYCCCcK.....',
    '....KcCCCCCcK.....',
    '.....KcccccK......',
    '...KJJJJJJJJJJKYYW',
    '..KJJjJJJJJjJJKYYW',
    '..KJJjJCCJjJJKKKKK',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJJYYYJJJJJK..',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJJK.',
    '.KKKKKKKKKKKKKKKK.'
  ];
  const HERO_HIT = [
    '.......K..........',
    '......KJjK........',
    '.....KJJjjK.......',
    '....KJJJJjjK......',
    '...KJJJJJJjjK.....',
    '..KJJJJJJJJjjK....',
    '.KJJJJJJJJJJJJK...',
    '.KKKKKKKKKKKKKKK..',
    '....KcCCCCCcK.....',
    '....KcCJCCCcK.....',
    '....KcCCCCCcK.....',
    '.....KcccccK......',
    '...KJJJJJJJJJJK...',
    '..KJJjJJJJJjJJK...',
    '..KJJjJCCJjJJK....',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJJJJJJJJJJK..',
    '.KJJJjJJJJJjJJJK..',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJjJJJJJjJJJK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJjK.',
    '.KJJJJJJJJJJJJJJK.',
    '.KKKKKKKKKKKKKKKK.'
  ];

  /* ── sova — akademická průvodkyně (10×10) ── */
  const PAL_COM = { K:'#0a0c12', B:'#8a6a40', b:'#5a4428', W:'#e8ecf5', Y:'#f4d03f', y:'#c8a020', k:'#3a2c18', G:'#c8b090' };
  const COMPANION = [[
    '..KKKKKKKKK...',
    '.KBBBBBBBBbK..',
    '.KBWWWWWWBbK..',
    '.KBWYYYYWBbK..',
    '.KBWYyyYWBbK..',
    '.KBWYYYYWBbK..',
    '.KBWWWWWWBbK..',
    '.KBBBBBBBBbK..',
    '.KBWWWWWWBbK..',
    '.KBWYYYYWBbK..',
    '.KBBBBBBBBbK..',
    '..KbbbbbbbK...',
    '..KK.....KK...',
    '...K.....K....'
  ],[
    '..KKKKKKKKK...',
    '.KBBBBBBBBbK..',
    '.KBWWWWWWBbK..',
    '.KBWWYYWWBbK..',
    '.KBWWyyWWBbK..',
    '.KBWWYYWWBbK..',
    '.KBWWWWWWBbK..',
    '.KBBBBBBBBbK..',
    '.KBWWWWWWBbK..',
    '.KBWYYYYWBbK..',
    '.KBBBBBBBBbK..',
    '..KBBBBBBBbK..',
    '...K.....K....',
    '..KK.....KK...'
  ]];

  /* ── bossové: 7 oblastí, akademická/fantasy témata ── */
  const BOSS_PALS = {
    1:{A:'#7a98ff',a:'#3355cc',M:'#3a52a8',m:'#263878'},   // strážce čísel — modrá
    2:{A:'#cc44ee',a:'#7a2aa0',M:'#5c2a80',m:'#3e1c58'},   // čaroděj procent — fialová
    3:{A:'#88cc44',a:'#3a6618',M:'#4a7a20',m:'#325512'},   // krokodýl algebry — bažinná zelená
    4:{A:'#44eecc',a:'#118866',M:'#2a6a5c',m:'#1a4840'},   // alchymista výrazů — teal
    5:{A:'#44aaee',a:'#1166aa',M:'#4a7aa0',m:'#335570'},   // chobotnice kruhu — jezerní modrá
    6:{A:'#ffaa22',a:'#aa5510',M:'#6e3e0e',m:'#321808'},   // mistr rozkladu — jantar
    7:{A:'#bb99ff',a:'#6a44cc',M:'#503498',m:'#382468'}    // arcimág — arcanová fialová
  };
  const COMMON = { K:'#0a0c12', W:'#e8ecf5', R:'#ff3355' };

  const BOSS_SPRITES = {
    1: [[ // runový kamenný golem (18×24 hi-res)
      '..................',
      '..................',
      '.....KKKKKKKK.....',
      '....KMMMMMMMMK....',
      '...KMMKWKKWKMMK...',
      '...KMMKKKKKKMMK...',
      '...KMMMKAAKMMMK...',
      '....KMMMMMMMMK....',
      '..KKKKMMMMMMKKKK..',
      '.KMMKMMAaAAMMKMMK.',
      '.KMmKMAMMMMAMKmMK.',
      '.KMMKMAMaAMAMKMMK.',
      '.KmMKMMAAAAMMKMmK.',
      '.KKKKMMMMMMMMKKKK.',
      '....KMMMMMMMMK....',
      '....KMmMMMMmMK....',
      '....KMMMMMMMMK....',
      '....KMMK..KMMK....',
      '....KMmK..KmMK....',
      '...KMMMK..KMMMK...',
      '...KKKKK..KKKKK...',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '..................',
      '.....KKKKKKKK.....',
      '....KMMMMMMMMK....',
      '...KMMKKWKWKMMK...',
      '...KMMKKKKKKMMK...',
      '...KMMMKAAKMMMK...',
      '....KMMMMMMMMK....',
      '..KKKKMMMMMMKKKK..',
      '.KMMKMMAAaAMMKMMK.',
      '.KMmKMAMMMMAMKmMK.',
      '.KMMKMAMAaMAMKMMK.',
      '.KmMKMMAAAAMMKMmK.',
      '.KKKKMMMMMMMMKKKK.',
      '....KMMMMMMMMK....',
      '....KMmMMMMmMK....',
      '....KMMMMMMMMK....',
      '....KMMK..KMMK....',
      '....KMmK..KmMK....',
      '...KMMMK..KMMMK...',
      '...KKKKK..KKKKK...',
      '..................',
      '..................',
      '..................'
    ]],
    2: [[ // čaroděj geometrie — horský mág (18×24 hi-res)
      '........KAK.......',
      '.......KAAAK......',
      '......KAAaAAK.....',
      '.....KAAAAAAAK....',
      '....KAAaAAAaAAK...',
      '...KKKKKKKKKKKK...',
      '....KMWKMMKWMK....',
      '....KMKKMMKKMK....',
      '....KMMMmmMMMK....',
      '...KMMMMMMMMMMK...',
      '..KMAKMMAAMMKAMK..',
      '.KMAAKMAMMAMKAAMK.',
      '.KMAAKMMAAMMKAAMK.',
      '..KKKKMMMMMMKKKK..',
      '....KMMMMMMMMK....',
      '....KmMMMMMmMK....',
      '....KMMMMMMMMK....',
      '.....KMMKKMMK.....',
      '.....KmMKKMmK.....',
      '....KKKKKKKKKK....',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '........KAK.......',
      '.......KAAAK......',
      '......KAAaAAK.....',
      '.....KAAAAAAAK....',
      '....KAAaAAAaAAK...',
      '...KKKKKKKKKKKK...',
      '....KMKWMMKWMK....',
      '....KMKKMMKKMK....',
      '....KMMMmmMMMK....',
      '...KMMMMMMMMMMK...',
      '..KMAKMAMMAMKAMK..',
      '.KMAAKMMAAMMKAAMK.',
      '.KMAAKMAMMAMKAAMK.',
      '..KKKKMMMMMMKKKK..',
      '....KMMMMMMMMK....',
      '....KmMMMMMmMK....',
      '....KMMMMMMMMK....',
      '.....KMMKKMMK.....',
      '.....KmMKKMmK.....',
      '....KKKKKKKKKK....',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    3: [[ // krokodýl algebry — bažinný ještěr (18×24 hi-res)
      '..................',
      '..................',
      '..................',
      '..KKK.............',
      '.KMWKKKKKK........',
      'KMKWMMMMMMKKKKKK..',
      'KMKKMMMMMMMMMMMMK.',
      'KMMMMMMMMMMMMMMMMK',
      '.KWKWKWKWKMMMMMMK.',
      '..KKKKKKKMMMMMMK..',
      '.KWKWKWKMMMMMMMK..',
      'KMMMMMMMMMMMMMMK..',
      'KMmMMMMMMMMMMMMMK.',
      '.KKMMMMMMMMMMMMMK.',
      '..KMMKKMMMMKKMMK..',
      '..KMmK.KMMK.KmMK..',
      '..KKKK.KKKK.KKKK..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '..................',
      '..................',
      '..KKK.............',
      '.KMWKKKKKK........',
      'KMKWMMMMMMKKKKKK..',
      'KMKKMMMMMMMMMMMMK.',
      'KMMMMMMMMMMMMMMMMK',
      '.KKWKWKWKWKMMMMMK.',
      '..KKKKKKKMMMMMMK..',
      '.KKWKWKWKMMMMMMK..',
      'KMMMMMMMMMMMMMMK..',
      'KMmMMMMMMMMMMMMMK.',
      '.KKMMMMMMMMMMMMMK.',
      '..KMMKKMMMMKKMMK..',
      '..KMmK.KMMK.KmMK..',
      '..KKKK.KKKK.KKKK..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    4: [[ // alchymista výrazů — věžní mág s baňkou (18×24 hi-res)
      '..................',
      '.......KKKK.......',
      '......KMMMMK......',
      '.....KMMMMMMK.....',
      '.....KMWKWKMK.....',
      '.....KMKKKKMK.....',
      '.....KMMmmMMK.....',
      '....KKKKKKKKKK....',
      '...KMMMAAAAMMMK...',
      '..KMKMMAaAAMMKMK..',
      '..KMKMMAAAAMMKMK..',
      '.KAAKMMMAAMMMKMK..',
      '.KAaAKMMMMMMKKK...',
      '.KAAAKMMMMMMK.....',
      '..KKK.KMMMMK......',
      '......KMMMMMK.....',
      '.....KKKKKKKK.....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '.......KKKK.......',
      '......KMMMMK......',
      '.....KMMMMMMK.....',
      '.....KMKWKWMK.....',
      '.....KMKKKKMK.....',
      '.....KMMmmMMK.....',
      '....KKKKKKKKKK....',
      '...KMMMAAAAMMMK...',
      '..KMKMMAAaAMMKMK..',
      '..KMKMMAAAAMMKMK..',
      '.KAaKMMMAAMMMKMK..',
      '.KAAAKMMMMMMKKK...',
      '.KAaAKMMMMMMK.....',
      '..KKK.KMMMMK......',
      '......KMMMMMK.....',
      '.....KKKKKKKK.....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    5: [[ // chobotnice kruhu — jezerní hlavonožec (18×24 hi-res)
      '..................',
      '......KKKKKK......',
      '....KKMMMMMMKK....',
      '...KMMMMMMMMMMK...',
      '..KMMWWKMMKWWMMK..',
      '..KMMWAKMMKWAMMK..',
      '..KMMKKMMMMKKMMK..',
      '..KMMMMMmmMMMMMK..',
      '...KMMMMMMMMMMK...',
      '..KMKMKMKKMKMKMK..',
      '.KMKMKMKMMKMKMKMK.',
      '.KMKMKMKMMKMKMKMK.',
      '.KmKMKmKMMKmKMKmK.',
      '.KMK.KMKmmKMK.KMK.',
      '..K..KmK..KmK..K..',
      '......K....K......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '......KKKKKK......',
      '....KKMMMMMMKK....',
      '...KMMMMMMMMMMK...',
      '..KMMWWKMMKWWMMK..',
      '..KMMAWKMMKAWMMK..',
      '..KMMKKMMMMKKMMK..',
      '..KMMMMMmmMMMMMK..',
      '...KMMMMMMMMMMK...',
      '..KMKMKMKKMKMKMK..',
      '.KMKMKMKMMKMKMKMK.',
      '.KmKMKMKMMKMKMKmK.',
      '.KmKMKmKMMKmKMKmK.',
      '.KMK.KMKmmKMK.KMK.',
      '..K..KmK..KmK..K..',
      '......K....K......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    6: [[ // rýsovač záhad — mechanické kružítko (18×24 hi-res)
      '..................',
      '........KK........',
      '.......KAAK.......',
      '......KAAAAK......',
      '......KAWWAK......',
      '......KAWWAK......',
      '......KAAAAK......',
      '.....KAAKKAAK.....',
      '.....KAK..KAK.....',
      '....KAAK..KAAK....',
      '....KAK....KAK....',
      '...KAAK....KAAK...',
      '...KAK......KAK...',
      '..KMAK......KAMK..',
      '..KMMK......KMMK..',
      '.KMmMK......KMmMK.',
      '.KKKKK......KKKKK.',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '........KK........',
      '.......KAAK.......',
      '......KAAAAK......',
      '......KAWWAK......',
      '......KWAAWK......',
      '......KAAAAK......',
      '.....KAAKKAAK.....',
      '.....KAK..KAK.....',
      '...KAK......KAK...',
      '...KAAK....KAAK...',
      '..KAK........KAK..',
      '...KAK......KAK...',
      '..KMAK......KAMK..',
      '..KMMK......KMMK..',
      '.KMmMK......KMmMK.',
      '.KKKKK......KKKKK.',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    7: [[ // arcimág — levitující mistr s hůlkou (18×24 hi-res)
      '..................',
      '.....KKKKKKK......',
      '....KAAAAAAAK.....',
      '...KAAaAAAaAAK....',
      '...KKKKKKKKKKK....',
      '....KMWKKWKMK..KK.',
      '....KMKKKKKMK.KAK.',
      '....KMMMmmMMK.KAK.',
      '...KKKMMMMKKK.KAK.',
      '..KMMAKMMKAMMKKAK.',
      '.KMMMAKMMKAMMMKAK.',
      '.KmMMAKMMKAMMmKAK.',
      '..KKKAKMMKAKKKKAK.',
      '.....KMMMMK...KAK.',
      '....KAAAAAAK..KAK.',
      '...KAAaAAaAAK.KaK.',
      '....KKKKKKKK...K..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '.....KKKKKKK......',
      '....KAAAAAAAK.....',
      '...KAAAaAaAAAK....',
      '...KKKKKKKKKKK....',
      '....KMKWKWKMK..KK.',
      '....KMKKKKKMK.KWK.',
      '....KMMMmmMMK.KAK.',
      '...KKKMMMMKKK.KAK.',
      '..KMMAKMMKAMMKKAK.',
      '.KMMMAKMMKAMMMKAK.',
      '.KmMMAKMMKAMMmKAK.',
      '..KKKAKMMKAKKKKAK.',
      '.....KMMMMK...KAK.',
      '....KAAAAAAK..KAK.',
      '...KAAAaAaAAK.KaK.',
      '....KKKKKKKK...K..',
      '..................',
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

  const G8_TH = {
    1: { rune: '#7a9ad0', glow: '#33406e' }, // modrá
    2: { rune: '#e0964a', glow: '#5a3a1a' }, // procenta oranžová
    3: { rune: '#5ac88a', glow: '#1c4a32' }, // algebra zelená
    4: { rune: '#c86ad0', glow: '#451f56' }, // alchymie fialová
    5: { rune: '#4ac8d0', glow: '#1a4654' }, // chobotnice tyrkys
    6: { rune: '#d0c04a', glow: '#544619' }, // rýsování zlatá
    7: { rune: '#d04a6a', glow: '#551a2f' }  // arcimág rudá
  };
  const G8_GLYPHS = ['+', '−', '×', '÷', 'π', '√', '%', '∞', '=', 'x²', 'Σ', '½'];
  function paintSky(g, env, animOK) {
    const W = env.w, H = env.h, now = env.now;
    const th = G8_TH[env.area] || G8_TH[1];
    const rnd = env.rnd;
    const fy = H - 30;
    // klenuté okno (měsíční svit) za bossem
    const wx = Math.round(W * 0.72), wtop = 26, ww = 54;
    g.globalAlpha = 0.16; g.fillStyle = th.glow;
    g.fillRect(wx - ww / 2, wtop, ww, fy - wtop);
    pxDisc(g, wx, wtop, ww / 2, 3, th.glow);
    g.globalAlpha = 0.5; g.strokeStyle = '#23273a'; g.lineWidth = 3;
    g.strokeRect(wx - ww / 2, wtop, ww, fy - wtop);
    g.beginPath(); g.moveTo(wx, wtop); g.lineTo(wx, fy);
    g.moveTo(wx - ww / 2, (wtop + fy) / 2); g.lineTo(wx + ww / 2, (wtop + fy) / 2); g.stroke();
    g.globalAlpha = 1;
    // rámující kamenné sloupy
    function col(px) {
      g.globalAlpha = 0.6; g.fillStyle = '#262a3a';
      g.fillRect(px, 20, 18, fy - 20);
      g.fillStyle = '#343a52'; g.fillRect(px - 3, 16, 24, 7); g.fillRect(px - 3, fy - 7, 24, 7);
      g.fillStyle = '#1b1f30'; for (let yy = 28; yy < fy - 10; yy += 10) g.fillRect(px + 5, yy, 2, 6);
      g.globalAlpha = 1;
    }
    col(3); col(W - 21);
    // arkánový kruh na podlaze
    g.globalAlpha = 0.38; g.strokeStyle = th.rune; g.lineWidth = 2;
    g.beginPath(); g.ellipse(Math.round(W * 0.5), fy - 3, 118, 13, 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.ellipse(Math.round(W * 0.5), fy - 3, 94, 10, 0, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 1;
    // plovoucí matematické symboly
    g.font = '12px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 9; i++) {
      const gx = 22 + rnd() * (W - 44);
      const drift = animOK ? Math.sin(now / 900 + i * 1.7) * 6 : 0;
      const gyy = 24 + rnd() * (fy - 64) + drift;
      g.globalAlpha = 0.20 + 0.14 * rnd();
      g.fillStyle = th.rune;
      g.fillText(G8_GLYPHS[Math.floor(rnd() * G8_GLYPHS.length)], gx, gyy);
    }
    g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  }

  const backdrop = {
    horizon: 0.46,
    seed: a => a * 149 + 5,   // PŮVODNÍ seed — jinak se rozložení posune
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
    1: { neon: '#7a98ff' },
    2: { neon: '#cc44ee' },
    3: { neon: '#88cc44' },
    4: { neon: '#44eecc' },
    5: { neon: '#44aaee' },
    6: { neon: '#ffaa22' },
    7: { neon: '#bb99ff' },
  };

  const WORLD8 = {
    id: 8,
    /* KROK A: žádný rim ani stín — vzhled se nesmí změnit. */
    look: { rim: false, shadow: false },
    /* bossPad 14: starý engine měl bosse na pevných 186 px. */
    arena: { h: 200, groundPad: 14, bossPad: 14, heroX: 0.12, bossX: 0.58 },
    hero: {
      cols: 18, rows: 24, scale: 5,
      pal: PAL_HERO, skins: HERO_SKINS,
      grids: { idle: HERO_IDLE, slash: HERO_SLASH, cast: HERO_CAST, shoot: HERO_SHOOT, hit: HERO_HIT }
    },
    /* dx 96 = staré hp.x + 18*SCALE + 6; výchozí (18−2)*5+6 = 86 by parťáka
       posunulo o 10 px doleva.  `jet` = jiskřičky pod parťákem — bez nich
       se parťák kreslí, ale efekt tiše zmizí, a pod reduced-motion se to
       NEPOZNÁ, protože se stejně nekreslí. */
    ally: { scale: 4, dy: 90, pal: PAL_COM, grids: COMPANION, dx: 96,
            jet: { hot: '#aa88ff', cold: '#5533aa', at: [[3, 13], [6, 13]] } },
    /* 5, NE 7 — všech 7 bossů má 24 řádků, starý engine je kreslil
       měřítkem 5 a BSCALE = 7 je mrtvá konstanta. NEOPRAVOVAT. */
    bosses: { scale: 5, pals: BOSS_PALS, common: COMMON, grids: BOSS_SPRITES },
    areas: AREAS,
    backdrop: backdrop
  };

  window.RPGSpriteWorld8 = WORLD8;
  if (window.RPGSpriteCore) window.RPGSprites8 = window.RPGSpriteCore.create(WORLD8);
})();
