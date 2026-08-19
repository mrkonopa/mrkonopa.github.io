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
  const PAL_HERO = {
    K:'#0a0c12', J:'#5a6a30', j:'#3a4a18', C:'#e8c060', c:'#a07820',
    G:'#7a6a48', B:'#23232e', W:'#e8ecf5', Y:'#d4401c'
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

  /* ── hrdina (18×24, průzkumník s kloboukem — kouká doprava) ── */
  const HERO_IDLE = [[
    '.......K..........',
    '......KcCK........',
    '....KKcCCcKK......',
    '....KcCCCCcK......',
    '...KcCCCCCCcK.....',
    '..KcCCCCCCCCCcK...',
    '...KKKKKKKKKK.....',
    '....KcGGGGcK......',
    '....KcGYGGcK......',
    '.....KcGGcK.......',
    '....KJJJJJJK......',
    '.KGJjJJJJjJGK.....',
    '.KGJjJJJJjJGK.....',
    '.KGJjJCJJCJjJGK...',
    '..KKJjJJJJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJjK.KJjK......',
    '...KJjK.KJjK......',
    '...KGjK.KjGK......',
    '...KBBK.KBBK......',
    '..KBBBK.KBBBK.....',
    '..KKKKK.KKKKK.....'
  ],[
    '..................',
    '.......K..........',
    '......KcCK........',
    '....KKcCCcKK......',
    '....KcCCCCcK......',
    '...KcCCCCCCcK.....',
    '..KcCCCCCCCCCcK...',
    '...KKKKKKKKKK.....',
    '....KcGGGGcK......',
    '....KcGYGGcK......',
    '.....KcGGcK.......',
    '....KJJJJJJK......',
    '.KGJjJJJJjJGK.....',
    '.KGJjJJJJjJGK.....',
    '.KGJjJCJJCJjJGK...',
    '..KKJjJJJJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJjK.KJjK......',
    '...KJjK.KJjK......',
    '...KGjK.KjGK......',
    '...KBBK.KBBK......',
    '..KBBBK.KBBBK.....'
  ]];
  const HERO_SLASH = [
    '.......K..........',
    '......KcCK........',
    '....KKcCCcKK......',
    '....KcCCCCcK......',
    '...KcCCCCCCcK.....',
    '..KcCCCCCCCCCcK...',
    '...KKKKKKKKKK.....',
    '....KcGGGGcK......',
    '....KcGYGGcK......',
    '.....KcGGcK.......',
    '....KJJJJJJK......',
    '.KGJjJJJJjJGKKGGK.',
    '.KGJjJJJJjJGGKKKK.',
    '.KGJjJCJJCJjJGKKKK',
    '..KKJjJJJJjJKKGK..',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJjK.KJjK......',
    '...KJjK.KJjK......',
    '...KGjK.KjGK......',
    '...KBBK.KBBK......',
    '..KBBBK.KBBBK.....',
    '..KKKKK.KKKKK.....'
  ];
  const HERO_CAST = [
    'Y......K..........',
    'KY....KcCK........',
    'KJY.KKcCCcKK......',
    'KJjYKcCCCCcK......',
    'KJjKcCCCCCCcK.....',
    'KJKcCCCCCCCCCcK...',
    'KJ.KKKKKKKKKK.....',
    'KJ..KcGGGGcK......',
    'KJ..KcGYGGcK......',
    'KJ...KcGGcK.......',
    'KJjKKJJJJJJK......',
    '.KGJjJJJJjJGK.....',
    '.KGJjJJJJjJGK.....',
    '.KGJjJCJJCJjJGK...',
    '..KKJjJJJJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJjK.KJjK......',
    '...KJjK.KJjK......',
    '...KGjK.KjGK......',
    '...KBBK.KBBK......',
    '..KBBBK.KBBBK.....',
    '..KKKKK.KKKKK.....'
  ];
  const HERO_SHOOT = [
    '.......K..........',
    '......KcCK........',
    '....KKcCCcKK......',
    '....KcCCCCcK......',
    '...KcCCCCCCcK.....',
    '..KcCCCCCCCCCcK...',
    '...KKKKKKKKKK.....',
    '....KcGGGGcK......',
    '....KcGYGGcK......',
    '.....KcGGcK.......',
    '....KJJJJJJK......',
    '.KGJjJJJJjJGKKKKK.',
    '.KGJjJJJJjJGGGcCK.',
    '.KGJjJCJJCJjJGKKKK',
    '..KKJjJJJJjJKKKK..',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJjK.KJjK......',
    '...KJjK.KJjK......',
    '...KGjK.KjGK......',
    '...KBBK.KBBK......',
    '..KBBBK.KBBBK.....',
    '..KKKKK.KKKKK.....'
  ];
  const HERO_HIT = [
    '.......K..........',
    '......KcCK........',
    '....KKcCCcKK......',
    '....KcCCCCcK......',
    '...KcCCCCCCcK.....',
    '..KcCCCCCCCCCcK...',
    '...KKKKKKKKKK.....',
    '....KcGGGGcK......',
    '....KcGJGGcK......',
    '.....KcGGcK.......',
    '....KJJJJJJK......',
    '.KGJjJJJJjJGK.....',
    '.KGJjJJJJjJGK.....',
    '.KGJjJCJJCJjJGK...',
    '..KKJjJJJJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJjK.KJjK......',
    '...KJjK.KJjK......',
    '...KGjK.KjGK......',
    '...KBBK.KBBK......',
    '..KBBBK.KBBBK.....',
    '..KKKKK.KKKKK.....'
  ];

  /* ── zlatý skarabeus (parťák, 10×10) ── */
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
    ally: { scale: 4, pal: PAL_COM, grids: COMPANION, dx: 96,
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
