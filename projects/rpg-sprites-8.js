/* ════════════════════════════════════════════════════════════════════
   RPG Matematika 8 — pixel-art bojová scéna (canvas engine)
   Téma: Matematická akademie 🎓
   ────────────────────────────────────────────────────────────────────
   API (window.RPGSprites8):
     attach(topEl)          – vloží canvas do arény
     spawn(areaId,startDmg) – vstup bosse
     heroAttack(isCrit)     – útok hrdiny
     bossAttack()           – útok bosse
     defeat()               – poražení bosse
     setProgress(ratio)     – vizuální poškození 0→1
     detach()               – zastaví smyčku
     active()               – je engine připojený?
   ════════════════════════════════════════════════════════════════════ */
window.RPGSprites8 = (function () {
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

  /* ── engine ── */
  let cv = null, ctx = null, raf = 0, lastT = 0, tick = 0;
  let curArea = 1, hiddenEmoji = null;
  const ST = {
    hero: { mode: 'idle', t: 0 },
    boss: { mode: 'gone', t: 0, flash: 0, progress: 0 },
    fx: []
  };
  const SCALE = 5;
  const BSCALE = 7;
  const ASCALE = 4;
  const FRAME_MS = 130;

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

  function heroPos() { return { x: Math.round(cv.width * 0.12), y: 200 - 24 * SCALE - 14 }; }
  function bossPos() {
    const fr = BOSS_SPRITES[curArea] || BOSS_SPRITES[1];
    const rows = fr[0].length;
    const sc = rows >= 20 ? 5 : BSCALE;
    return { x: Math.round(cv.width * 0.58), y: 186 - rows * sc, sc };
  }

  function heroGrid() {
    const m = ST.hero.mode;
    if (m === 'slash') return HERO_SLASH;
    if (m === 'cast')  return HERO_CAST;
    if (m === 'shoot') return HERO_SHOOT;
    if (m === 'hit')   return HERO_HIT;
    return HERO_IDLE[rm() ? 0 : tick % 2];
  }

  function render(now) {
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const hp = heroPos(), bp = bossPos();
    const pal = Object.assign({}, COMMON, BOSS_PALS[curArea] || BOSS_PALS[1]);
    const b = ST.boss;
    if (b.mode !== 'gone') {
      let by = bp.y, bx = bp.x, alpha = 1, bscale = bp.sc;
      if (b.mode === 'enter' && !rm()) {
        const p = Math.min(1, b.t / 900);
        if (p < 0.55) {
          by = bp.y - (1 - p / 0.55) * 130;
          alpha = (Math.floor(b.t / 70) % 3 === 0) ? 0.25 : 0.9;
          bscale = bp.sc * (0.4 + 0.6 * (p / 0.55));
        } else if (p < 0.75) {
          bscale = bp.sc; by = bp.y + 4;
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
      // idle pohyb: vznášející se bossové (≥3 prázdné spodní řádky) levitují, stojící lehce „dýchají“
      if (b.mode === "idle" && !rm()) {
        let eb = 0; for (let r = grid.length - 1; r >= 0 && /^\.+$/.test(grid[r]); r--) eb++;
        if (eb >= 3) by += Math.sin(performance.now() / 480) * 4;
        else bx += Math.sin(performance.now() / 620) * 1.5;
      }
      ctx.globalAlpha = alpha;
      const off = (b.flash > 0 && !rm()) ? (b.t % 2 ? 2 : -2) : 0;
      drawSprite(grid, pal, bx + off, by, bscale, false, b.flash > 0);
      ctx.globalAlpha = 1;
      if (b.flash > 0) b.flash -= 16;
      if (b.progress > 0.22 && b.mode !== 'defeat' && b.mode !== 'gone' && !rm()) {
        const sparkChance = Math.min(0.4, (b.progress - 0.22) * 0.55);
        if (Math.random() < sparkChance) {
          ST.fx.push({ kind: 'spark', x: bx + (3 + Math.random() * 12) * bscale,
            y: by + (1 + Math.random() * 9) * bscale,
            vx: (Math.random() - 0.5) * 2.5, vy: -1.5 - Math.random() * 2, t: 0 });
        }
        if (b.progress >= 0.52) {
          if (b.mode === 'idle') bx += Math.sin(performance.now() / 85) * (b.progress - 0.52) * 11;
          const nCracks = b.progress >= 0.72 ? 5 : 3;
          const dmgAlpha = Math.min(1, (b.progress - 0.52) * 2.4) * alpha;
          ctx.globalAlpha = dmgAlpha * 0.65;
          ctx.fillStyle = '#ff5522';
          for (let k = 0; k < nCracks; k++) {
            const cy = by + (2 + k * 3) * bscale;
            const cw = (2 + k % 3 + (b.t % 220 < 70 ? 1 : 0)) * bscale;
            ctx.fillRect(bx + (2 + k * 2) * bscale, cy, cw, 2);
          }
          ctx.globalAlpha = 1;
          if (b.progress >= 0.72 && Math.random() < 0.18) {
            ST.fx.push({ kind: 'smoke', x: bx + (3 + Math.random() * 12) * bscale,
              y: by + Math.random() * 4 * bscale,
              vx: (Math.random() - 0.5) * 1.2, vy: -0.9 - Math.random() * 0.8, t: 0 });
          }
        }
      }
      if (b.mode === 'charge' && !rm() && Math.floor(b.t / 110) % 2 === 0) {
        ctx.fillStyle = '#ff3355';
        const ex = bx + 9 * bscale - 4, ey = by - 34;
        ctx.fillRect(ex, ey, 8, 18);
        ctx.fillRect(ex, ey + 22, 8, 8);
      }
    }
    const h = ST.hero;
    let hx = hp.x;
    if (h.mode === 'slash' && !rm()) {
      const p = Math.min(1, h.t / 520);
      const dash = p < 0.5 ? p * 2 : (1 - p) * 2;
      hx = hp.x + dash * (bp.x - hp.x - 16 * SCALE);
    }
    // ── vizuální stav hrdiny podle HP (zrcadlí poškozování bosse) ──
    // plné HP: nic | 2/3: šrámy + pot | 1/3: třes, shrbení, supění
    const hpf = h.hpFrac === undefined ? 1 : h.hpFrac;
    let hy = hp.y;
    if (hpf <= 0.34) {
      hy += 3;
      if (!rm() && h.mode === 'idle') hx += Math.sin(performance.now() / 70) * 2;
    }
    drawSprite(heroGrid(), heroPal(), hx, hy, SCALE, false, h.mode === 'hit');
    if (hpf <= 0.67 && h.mode !== 'hit') {
      const bad = hpf <= 0.34;
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#ff3355';
      ctx.fillRect(hx + 4 * SCALE, hy + 13 * SCALE, 2 * SCALE, 2);
      ctx.fillRect(hx + 7 * SCALE, hy + 15 * SCALE, 2 * SCALE, 2);
      if (bad) {
        ctx.fillRect(hx + 5 * SCALE, hy + 8 * SCALE, 2 * SCALE, 2);
        ctx.fillRect(hx + 8 * SCALE, hy + 16 * SCALE, 2 * SCALE, 2);
      }
      ctx.globalAlpha = 1;
      if (!rm() && Math.random() < (bad ? 0.09 : 0.035)) {
        ST.fx.push({ kind: 'sweat', x: hx + (4 + Math.random() * 5) * SCALE, y: hy + 6 * SCALE,
          vx: (Math.random() - 0.5) * 0.8, vy: 1.1 + Math.random(), t: 0 });
      }
      if (bad && !rm() && Math.random() < 0.06) {
        ST.fx.push({ kind: 'smoke', x: hx + 11 * SCALE, y: hy + 11 * SCALE,
          vx: 0.5 + Math.random() * 0.5, vy: -0.4 - Math.random() * 0.4, t: 0 });
      }
    }
    // sova — akademická průvodkyně, levituje vedle hrdiny
    {
      const bob = rm() ? 0 : Math.sin(performance.now() / 380) * 6;
      const ax = hp.x + 18 * SCALE + 6, ay = hp.y + 6 * SCALE + bob;
      drawSprite(COMPANION[rm() ? 0 : tick % 2], PAL_COM, ax, ay, ASCALE, false, false);
      if (!rm()) {
        // magické jiskřičky pod sovou
        ctx.fillStyle = (tick % 2) ? '#aa88ff' : '#5533aa';
        ctx.fillRect(ax + 3 * ASCALE, ay + 13 * ASCALE, ASCALE, ASCALE);
        ctx.fillRect(ax + 6 * ASCALE, ay + 13 * ASCALE, ASCALE, ASCALE);
      }
      ST._androidPos = { x: ax + 7 * ASCALE, y: ay + 7 * ASCALE };
    }
    // efekty
    for (let i = ST.fx.length - 1; i >= 0; i--) {
      const f = ST.fx[i];
      f.t += 16;
      if (f.kind === 'orb' || f.kind === 'bolt') {
        const dur = f.kind === 'orb' ? 420 : 260;
        const p = Math.min(1, f.t / dur);
        const x = f.x0 + (f.x1 - f.x0) * p;
        const y = f.y0 + (f.y1 - f.y0) * p - (f.kind === 'orb' ? Math.sin(p * Math.PI) * 36 : 0);
        ctx.fillStyle = f.kind === 'orb' ? '#aa88ff' : '#cc44ee';
        const s = f.kind === 'orb' ? 10 : 6;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.fillStyle = f.kind === 'orb' ? 'rgba(170,136,255,.4)' : 'rgba(204,68,238,.4)';
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
      } else if (f.kind === 'fireball') {
        const p = Math.min(1, f.t / 480);
        const x = f.x0 + (f.x1 - f.x0) * p;
        const y = f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * 30;
        ctx.fillStyle = '#ff7733';
        ctx.fillRect(x - 8, y - 8, 16, 16);
        ctx.fillStyle = '#ffd24a';
        ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.fillStyle = 'rgba(255,119,51,.45)';
        ctx.fillRect(x - 18 - 6 * Math.random(), y - 5, 12, 10);
        if (p >= 1) { ST.fx.splice(i, 1); impact(f, '255,119,51'); }
      } else if (f.kind === 'lightning') {
        const p = Math.min(1, f.t / 320);
        if (f.t < 60 && !f.hitDone) { f.hitDone = 1; impact(f, '170,136,255'); }
        if (Math.floor(f.t / 60) % 2 === 0) {
          ctx.strokeStyle = '#e0d0ff'; ctx.lineWidth = 4;
          ctx.beginPath();
          let yy = 0, xx = f.x1;
          ctx.moveTo(xx, yy);
          while (yy < f.y1) { yy += 22; xx = f.x1 + (Math.random() * 24 - 12); ctx.lineTo(xx, Math.min(yy, f.y1)); }
          ctx.stroke();
          ctx.strokeStyle = 'rgba(170,136,255,.5)'; ctx.lineWidth = 9; ctx.stroke();
        }
        if (p >= 1) ST.fx.splice(i, 1);
      } else if (f.kind === 'freeze') {
        const p = Math.min(1, f.t / 620);
        if (!f.hitDone && f.t > 80) { f.hitDone = 1; impact(f, '140,220,255'); }
        for (let k = 0; k < 6; k++) {
          const ang = k / 6 * Math.PI * 2 + 0.5;
          const d = 18 + p * 26;
          const sx = f.x1 + Math.cos(ang) * d, sy = f.y1 + Math.sin(ang) * d;
          ctx.fillStyle = 'rgba(170,230,255,' + (1 - p) + ')';
          ctx.fillRect(sx - 3, sy - 8, 6, 16);
          ctx.fillStyle = 'rgba(255,255,255,' + (0.8 - p * 0.8) + ')';
          ctx.fillRect(sx - 1, sy - 5, 3, 9);
        }
        if (p >= 1) ST.fx.splice(i, 1);
      } else if (f.kind === 'swamp') {
        const p = Math.min(1, f.t / 680);
        if (!f.hitDone && f.t > 250) { f.hitDone = 1; impact(f, '90,180,70'); }
        ctx.fillStyle = 'rgba(70,140,50,' + (0.55 - p * 0.5) + ')';
        ctx.fillRect(f.x1 - 56, f.gy - 8, 112, 12);
        for (let k = 0; k < 5; k++) {
          const ph = (p * 1.4 + k * 0.21) % 1;
          const bx2 = f.x1 - 40 + k * 19;
          ctx.fillStyle = 'rgba(120,210,90,' + (0.9 - ph) + ')';
          const r2 = 4 + k % 3 * 2;
          ctx.fillRect(bx2 - r2 / 2, f.gy - 6 - ph * 52, r2, r2);
        }
        if (p >= 1) ST.fx.splice(i, 1);
      } else if (f.kind === 'poison') {
        const p = Math.min(1, f.t / 680);
        if (!f.hitDone && f.t > 200) { f.hitDone = 1; impact(f, '150,255,90'); }
        for (let k = 0; k < 4; k++) {
          const ang = k * 1.7 + p * 2;
          const cx2 = f.x1 + Math.cos(ang) * 22, cy2 = f.y1 - 10 + Math.sin(ang) * 14 - p * 18;
          ctx.fillStyle = 'rgba(120,220,60,' + (0.5 - p * 0.45) + ')';
          ctx.fillRect(cx2 - 11, cy2 - 8, 22, 16);
          ctx.fillStyle = 'rgba(190,255,120,' + (0.35 - p * 0.3) + ')';
          ctx.fillRect(cx2 - 5, cy2 - 4, 10, 8);
        }
        if (p >= 1) ST.fx.splice(i, 1);
      } else if (f.kind === 'spit') {
        const p = Math.min(1, f.t / 420);
        const x = f.x0 + (f.x1 - f.x0) * p;
        const y = f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * 48;
        ctx.fillStyle = '#aa88ff';
        ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.fillStyle = 'rgba(170,136,255,.45)';
        ctx.fillRect(x - 7, y - 7, 14, 14);
        if (p >= 1) { ST.fx.splice(i, 1); impact(f, '170,136,255'); }
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
      } else if (f.kind === 'spark') {
        f.x += f.vx; f.y += f.vy; f.vy += 0.1;
        const p = Math.min(1, f.t / 480);
        ctx.fillStyle = 'rgba(255,190,60,' + (1 - p) + ')';
        ctx.fillRect(f.x - 2, f.y - 2, 4, 4);
        ctx.fillStyle = 'rgba(255,255,180,' + (0.6 - p * 0.6) + ')';
        ctx.fillRect(f.x - 1, f.y - 1, 2, 2);
        if (p >= 1 || f.y > 210) ST.fx.splice(i, 1);
      } else if (f.kind === 'sweat') {
        f.x += f.vx; f.y += f.vy; f.vy += 0.15;
        const p = Math.min(1, f.t / 420);
        ctx.fillStyle = 'rgba(120,200,255,' + (1 - p) + ')';
        ctx.fillRect(f.x - 2, f.y - 2, 4, 4);
        if (p >= 1 || f.y > 210) ST.fx.splice(i, 1);
      } else if (f.kind === 'smoke') {
        f.x += f.vx; f.y += f.vy;
        const p = Math.min(1, f.t / 700);
        const s = 3 + p * 5;
        ctx.fillStyle = 'rgba(80,65,55,' + (0.45 - p * 0.44) + ')';
        ctx.fillRect(f.x - s / 2, f.y - s / 2, s, s);
        if (p >= 1 || f.y < -10) ST.fx.splice(i, 1);
      }
    }
  }

  function impact(f, rgb) {
    ST.boss.flash = 130; ST.boss.t = 0;
    ST.fx.push({ kind: 'boom', x: f.x1, y: f.y1, t: 0,
      rgb: rgb || (f.kind === 'orb' ? '170,136,255' : '204,68,238') });
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(64, now - lastT); lastT = now;
    if (!ctx) return;
    if (now - (loop._ft || 0) > FRAME_MS) { tick++; loop._ft = now; }
    ST.hero.t += dt; ST.boss.t += dt;
    render(now);
  }


  function setHeroHp(frac) {
    const f = +frac;
    ST.hero.hpFrac = isFinite(f) ? Math.max(0, Math.min(1, f)) : 1;
  }

  function spawn(areaId, startDmg) {
    curArea = Math.max(1, Math.min(7, areaId | 0));
    resize();
    ST.boss.mode = rm() ? 'idle' : 'enter';
    ST.boss.t = 0; ST.boss.flash = 0;
    ST.boss.progress = Math.max(0, Math.min(1, startDmg || 0));
    ST.hero.mode = 'idle'; ST.hero.t = 0; ST.hero.hpFrac = 1;
    ST.fx.length = 0;
  }

  function setProgress(ratio) {
    ST.boss.progress = Math.max(0, Math.min(1, ratio || 0));
  }

  const ATTACKS = ['slash', 'orb', 'shoot', 'fireball', 'lightning', 'freeze', 'swamp', 'poison'];
  let lastAtk = '';
  function heroAttack(isCrit, force) {
    if (!active()) return;
    let kind = force || ATTACKS[Math.floor(Math.random() * ATTACKS.length)];
    if (!force && kind === lastAtk) kind = ATTACKS[(ATTACKS.indexOf(kind) + 1) % ATTACKS.length];
    lastAtk = kind;
    const hp = heroPos(), bp = bossPos();
    const bcx = bp.x + 9 * BSCALE, bcy = bp.y + 8 * BSCALE;
    const gy = 200 - 12;
    if (rm()) { ST.boss.flash = 130; ST.boss.t = 0; return; }
    ST.hero.mode = kind === 'slash' ? 'slash' : kind === 'shoot' ? 'shoot' : 'cast';
    ST.hero.t = 0;
    const hx0 = hp.x + 14 * SCALE, hyOrb = hp.y + 6 * SCALE, hyArm = hp.y + 12 * SCALE;
    if (kind === 'slash') {
      setTimeout(() => { ST.fx.push({ kind: 'slasharc', x: bcx - 20, y: bcy, t: 0 }); ST.boss.flash = 130; ST.boss.t = 0; ST.fx.push({ kind: 'boom', x: bcx, y: bcy, t: 0, rgb: '232,236,245' }); }, 260);
    } else if (kind === 'orb') {
      ST.fx.push({ kind: 'orb', x0: hx0, y0: hyOrb, x1: bcx, y1: bcy, t: 0 });
    } else if (kind === 'shoot') {
      ST.fx.push({ kind: 'bolt', x0: hx0, y0: hyArm, x1: bcx, y1: bcy, t: 0 });
    } else if (kind === 'fireball') {
      ST.fx.push({ kind: 'fireball', x0: hx0, y0: hyOrb, x1: bcx, y1: bcy, t: 0 });
    } else if (kind === 'lightning') {
      setTimeout(() => ST.fx.push({ kind: 'lightning', x1: bcx, y1: bcy, t: 0 }), 200);
    } else if (kind === 'freeze') {
      setTimeout(() => ST.fx.push({ kind: 'freeze', x1: bcx, y1: bcy, t: 0 }), 200);
    } else if (kind === 'swamp') {
      setTimeout(() => ST.fx.push({ kind: 'swamp', x1: bcx, y1: bcy, gy: gy, t: 0 }), 200);
    } else if (kind === 'poison') {
      setTimeout(() => ST.fx.push({ kind: 'poison', x1: bcx, y1: bcy, t: 0 }), 200);
    }
    const dur = kind === 'slash' ? 540 : kind === 'shoot' ? 320 : 500;
    const myMode = ST.hero.mode;
    setTimeout(() => { if (ST.hero.mode === myMode) { ST.hero.mode = 'idle'; ST.hero.t = 0; } }, dur);
    if (Math.random() < 0.35) {
      setTimeout(() => {
        const a = ST._androidPos; if (!a || !active()) return;
        ST.fx.push({ kind: 'spit', x0: a.x, y0: a.y, x1: bcx, y1: bcy - 10, t: 0 });
      }, 650);
    }
  }

  function bossAttack() {
    if (!active()) return;
    const hp = heroPos(), bp = bossPos();
    if (rm()) { ST.hero.mode = 'hit'; setTimeout(() => { ST.hero.mode = 'idle'; }, 300); return; }
    ST.boss.mode = 'charge'; ST.boss.t = 0;
    setTimeout(() => {
      ST.fx.push({ kind: 'bossproj', x0: bp.x + 4 * BSCALE, y0: bp.y + 8 * BSCALE, x1: hp.x + 6 * SCALE, y1: hp.y + 13 * SCALE, t: 0 });
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
  function drawHeroOn(c2, x, y, scale, frame, flipX) {
    const grid = HERO_IDLE[frame ? 1 : 0];
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        c2.fillStyle = heroPal()[ch] || COMMON[ch] || '#f0f';
        const px = flipX ? x + (row.length - 1 - c) * scale : x + c * scale;
        c2.fillRect(px, y + r * scale, scale, scale);
      }
    }
  }


  return { attach, detach, active, spawn, heroAttack, bossAttack, defeat, setProgress, setHeroHp, drawHeroOn, setSkin, skins: () => Object.keys(HERO_SKINS) };
})();
