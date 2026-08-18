/* ════════════════════════════════════════════════════════════════════
   rpg-sprites-9.js — svět 9. ročníku (NULL_BYTE) pro rpg-sprite-core
   ────────────────────────────────────────────────────────────────────
   FÁZE 02. Tenhle soubor je JEN DATA + pozadí. Žádná smyčka, žádné
   kreslení spritu, žádné efekty — to všechno je ve sdíleném jádru.

   Mřížky jsou ZÁMĚRNĚ ty současné (hrdina 18×24, boss 18×24). Fáze 02
   je čistý refaktor: vzhled se nemění, jen se engine přestěhoval do
   rpg-sprite-core.js. Nové mřížky 20×29, rim light a kontaktní stín
   přijdou až ve fázi 03 — proto `look: {rim:false, shadow:false}`.

   Načítat POŘADÍ (obojí plain <script>, bez defer):
     <script src="rpg-sprite-core.js"></script>
     <script src="rpg-sprites-9.js"></script>

   Bez jádra se nedefinuje NIC (window.RPGSprites9 zůstane undefined)
   a hra jede dál na emoji animacích. Žádná záložní kopie enginu —
   to je vzorec, na kterém se repo už jednou spálilo (viz CLAUDE.md).
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const PAL_HERO = {
    K:'#0a0c12', J:'#22335c', j:'#16223f', C:'#19e6e6', c:'#0e8a8a',
    G:'#5a6a85', B:'#23232e', W:'#e8ecf5', Y:'#f4d03f'
  };
  const HERO_SKINS = {
    'skin-gold':    { J:'#caa12a', j:'#8a6a12', C:'#fff0b0', c:'#c9a227', G:'#8a7a3a' },
    'skin-red':     { J:'#a51d2e', j:'#5e1019', C:'#ff6b6b', c:'#a02020', G:'#7a3a44' },
    'skin-emerald': { J:'#108a55', j:'#0a4d31', C:'#39ff9e', c:'#1a8a5a', G:'#3a7a5a' },
    'skin-ghost':   { J:'#4a3a78', j:'#241d3f', C:'#c08aff', c:'#7a4fd0', G:'#6a5a85' },
    'skin-stealth': { J:'#2c2c34', j:'#161619', C:'#9fb0c8', c:'#5a6a85', G:'#40454f' }
  };
  const HERO_IDLE = [[
    '......KK..........',
    '.....KYYK.........',
    '....KKJJKK...KWK..',
    '....KJJJJK...KWK..',
    '...KJJWJJjK..KWK..',
    '...KJJJJJJK..KWK..',
    '...KKcKKcKK..KWK..',
    '...KJCJJCJK..KWK..',
    '...KJJJJJJK..KWK..',
    '....KJJJJK...KWK..',
    '...KGGGGGGK..KWK..',
    '.KGGKJJJJKGGGKWK..',
    'KGGGJWJJjJGGYYYYK.',
    'KGGJjJWJjJJGGKWK..',
    'KKGJjJJJJjJGKKKK..',
    '.KKJjJWJjJjKK.....',
    '..KJjJYYYYjJK.....',
    '..KjJJJJJJjK......',
    '..KJjJKKKjJK......',
    '..KGJjK.KjGK......',
    '..KGJjK.KjGK......',
    '..KKJjK.KjKK......',
    '..KBBBK.KBBBK.....',
    '.KBBBBK.KBBBBK....'
  ],[
    '..................',
    '......KK..........',
    '.....KYYK.........',
    '....KKJJKK...KWK..',
    '....KJJJJK...KWK..',
    '...KJJWJJjK..KWK..',
    '...KJJJJJJK..KWK..',
    '...KKcKKcKK..KWK..',
    '...KJCJJCJK..KWK..',
    '...KJJJJJJK..KWK..',
    '....KJJJJK...KWK..',
    '...KGGGGGGK..KWK..',
    '.KGGKJJJJKGGGKWK..',
    'KGGGJWJJjJGGYYYYK.',
    'KGGJjJWJjJJGGKWK..',
    'KKGJjJJJJjJGKKKK..',
    '.KKJjJWJjJjKK.....',
    '..KJjJYYYYjJK.....',
    '..KjJJJJJJjK......',
    '..KJjJKKKjJK......',
    '..KGJjK.KjGK......',
    '..KGJjK.KjGK......',
    '..KKJjK.KjKK......',
    '..KBBBK.KBBBK.....'
  ]];
  const HERO_SLASH = [
    '......KK..........',
    '.....KYYK.........',
    '....KKJJKK........',
    '....KJJJJK........',
    '...KJJWJJjK.......',
    '...KJJJJJJK.......',
    '...KKcKKcKK.......',
    '...KJCJJCJK.......',
    '...KJJJJJJK.......',
    '....KJJJJK........',
    '...KGGGGGGK.......',
    '.KGGKJJJJKGGKKKK..',
    'KGGGJWJJjJGGYWWWWK',
    'KGGJjJWJjJJGGKKKK.',
    'KKGJjJJJJjJGK.....',
    '.KKJjJWJjJjKK.....',
    '..KJjJYYYYjJK.....',
    '..KjJJJJJJjK......',
    '..KJjJKKKjJK......',
    '..KGJjK.KjGK......',
    '..KGJjK.KjGK......',
    '..KKJjK.KjKK......',
    '..KBBBK.KBBBK.....',
    '.KBBBBK.KBBBBK....'
  ];
  const HERO_CAST = [
    'C.....KK..........',
    'CC...KYYK.........',
    '.CC.KKJJKK...KWK..',
    'KCK.KJJJJK...KWK..',
    'KCKKJJWJJjK..KWK..',
    '.KKKJJJJJJK..KWK..',
    '...KKcKKcKK..KWK..',
    '...KJCJJCJK..KWK..',
    '...KJJJJJJK..KWK..',
    '....KJJJJK...KWK..',
    '...KGGGGGGK..KWK..',
    '.KGGKJJJJKGGGKWK..',
    'KGGGJWJJjJGGYYYYK.',
    'KGGJjJWJjJJGGKWK..',
    'KKGJjJJJJjJGKKKK..',
    '.KKJjJWJjJjKK.....',
    '..KJjJYYYYjJK.....',
    '..KjJJJJJJjK......',
    '..KJjJKKKjJK......',
    '..KGJjK.KjGK......',
    '..KGJjK.KjGK......',
    '..KKJjK.KjKK......',
    '..KBBBK.KBBBK.....',
    '.KBBBBK.KBBBBK....'
  ];
  const HERO_SHOOT = [
    '......KK..........',
    '.....KYYK.........',
    '....KKJJKK........',
    '....KJJJJK........',
    '...KJJWJJjK.......',
    '...KJJJJJJK.......',
    '...KKcKKcKK.......',
    '...KJCJJCJK.......',
    '...KJJJJJJK.......',
    '....KJJJJK........',
    '...KGGGGGGK.......',
    '.KGGKJJJJKGGKKKKK.',
    'KGGGJWJJjJGGGGGWWW',
    'KGGJjJWJjJJGGKKKKK',
    'KKGJjJJJJjJGK.....',
    '.KKJjJWJjJjKK.....',
    '..KJjJYYYYjJK.....',
    '..KjJJJJJJjK......',
    '..KJjJKKKjJK......',
    '..KGJjK.KjGK......',
    '..KGJjK.KjGK......',
    '..KKJjK.KjKK......',
    '..KBBBK.KBBBK.....',
    '.KBBBBK.KBBBBK....'
  ];
  const HERO_HIT = [
    '......KK..........',
    '.....KJJK.........',
    '....KKJJKK...KJK..',
    '....KJJJJK...KJK..',
    '...KJJJJJjK..KJK..',
    '...KJJJJJJK..KJK..',
    '...KKcKKcKK..KJK..',
    '...KJCJJCJK..KJK..',
    '...KJJJJJJK..KJK..',
    '....KJJJJK...KJK..',
    '...KGGGGGGK..KJK..',
    '.KGGKJJJJKGGGKJK..',
    'KGGGJJJJjJGGJJJJK.',
    'KGGJjJJJjJJGGKJK..',
    'KKGJjJJJJjJGKKKK..',
    '.KKJjJJJjJjKK.....',
    '..KJjJJJJJjJK.....',
    '..KjJJJJJJjK......',
    '..KJjJKKKjJK......',
    '..KGJjK.KjGK......',
    '..KGJjK.KjGK......',
    '..KKJjK.KjKK......',
    '..KBBBK.KBBBK.....',
    '.KBBBBK.KBBBBK....'
  ];
  const PAL_AND = { K:'#0a0c12', G:'#8a97ad', g:'#5a6a85', C:'#19e6e6', W:'#e8ecf5' };
  const ANDROID = [[
    '......KC......',
    '......KK......',
    '....KKKKKK....',
    '...KGGGGGGK...',
    '..KGgWCCWgGK..',
    '..KGgWCCWgGK..',
    '..KGgCCCCgGK..',
    '..KGgWCCWgGK..',
    '..KGgWCCWgGK..',
    '...KGGGGGGK...',
    '....KKKKKK....',
    '....KG..GK....',
    '.....K..K.....',
    '......KK......'
  ],[
    '......KC......',
    '......KK......',
    '....KKKKKK....',
    '...KGGGGGGK...',
    '..KGgWWWWgGK..',
    '..KGgWCCWgGK..',
    '..KGgCCCCgGK..',
    '..KGgWCCWgGK..',
    '..KGgWCCWgGK..',
    '...KGGGGGGK...',
    '....KKKKKK....',
    '....KG..GK....',
    '.....K..K.....',
    '......KK......'
  ]];
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
    1: [[ // strážní bot — hranatý robot (18×24 hi-res)
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
      '....KMMMMMMMMK....',
      '....KmMMMMMmMK....',
      '....KMMMMMMMMK....',
      '....KMMKKMMK......',
      '....KMMK.KMMK.....',
      '....KmmK.KmmK.....',
      '...KKKKK.KKKKK....',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
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
      '....KMMMMMMMMK....',
      '....KmMMMMMmMK....',
      '....KMMMMMMMMK....',
      '....KMMKKMMK......',
      '....KMMK.KMMK.....',
      '....KmmK.KmmK.....',
      '...KKKKK.KKKKK....',
      '..................',
      '..................',
      '..................'
    ]],
    2: [[ // reaktorové jádro — pulzující orb (18×24 hi-res)
      '..................',
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
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    3: [[ // procesorový golem — čip s nohama (18×24 hi-res)
      '..................',
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
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    4: [[ // glitch wraith — roztrhaný duch (18×24 hi-res)
      '..................',
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
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    5: [[ // síťový pavouk — spider bot (18×24 hi-res)
      '..................',
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
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    6: [[ // monitor — CRT hlava s anténou (18×24 hi-res)
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
      '.....KMK..KMK.....',
      '.....KmK..KmK.....',
      '....KKKK..KKKK....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
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
      '.....KMK..KMK.....',
      '.....KmK..KmK.....',
      '....KKKK..KKKK....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    7: [[ // jádro systému — velké oko v mech. schránce (18×24 hi-res)
      '..................',
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
      '....KKKKKKKKKK....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
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
      '....KKKKKKKKKK....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]]
  };
  const G9_TH = {
    1: '#3fd6e0', 2: '#ff5a8a', 3: '#5affc0', 4: '#c06aff',
    5: '#ffb03a', 6: '#4a8aff', 7: '#3fe06a'
  };
  const ASCALE = 4;

  /* ══════════════ POZADÍ ══════════════
     Rozdělené na statickou a pohyblivou vrstvu kvůli Chromebookům:
     statická se kreslí JEDNOU do off-screen plátna a pak se jen
     překlápí, každý snímek se dokresluje jen to, co se hýbe.
     Obsah je převzatý 1:1 ze starého drawBackdrop, jen rozdělený —
     `paintStatic` kreslí přesně to, co starý engine vykreslil při
     zapnutém reduced-motion, `paintAnim` přidává pohyb navrch. */
  const BACKDROP = {
    horizon: 0.46,

    paintStatic(g, env) {
      const W = env.w, H = env.h, RGBA = env.rgba, rnd = env.rnd, horizon = env.horizon;
      // datové tečky nad horizontem (statická podoba: pevná průhlednost)
      for (let i = 0; i < 24; i++) {
        const x = Math.floor(rnd() * W), y = Math.floor(rnd() * (horizon - 6));
        g.globalAlpha = 0.4;
        g.fillStyle = rnd() < 0.5 ? RGBA(1) : '#6a7a98'; g.fillRect(x, y, 1, 1);
      }
      g.globalAlpha = 1;
      // vzdálená silueta věží s neonovými okny
      let tx = 8;
      while (tx < W) {
        const tw = 14 + Math.floor(rnd() * 22), thh = 18 + Math.floor(rnd() * 48);
        g.globalAlpha = 0.85; g.fillStyle = '#0d1019'; g.fillRect(tx, horizon - thh, tw, thh);
        for (let wy = horizon - thh + 4; wy < horizon - 4; wy += 6)
          for (let wx = tx + 3; wx < tx + tw - 2; wx += 5)
            if (rnd() < 0.45) { g.globalAlpha = 0.4 + rnd() * 0.4; g.fillStyle = RGBA(1); g.fillRect(wx, wy, 2, 2); }
        tx += tw + 5 + Math.floor(rnd() * 10);
      }
      g.globalAlpha = 1;
      // zářící horizont
      g.globalAlpha = 0.7; g.fillStyle = RGBA(1); g.fillRect(0, horizon - 1, W, 1);
      g.globalAlpha = 0.12; g.fillStyle = env.neon; g.fillRect(0, horizon, W, 4);
      g.globalAlpha = 1;
      // perspektivní mřížka — sbíhavé paprsky (nehýbou se)
      const vpx = Math.round(W * 0.5);
      g.strokeStyle = RGBA(0.32); g.lineWidth = 1;
      for (let gx = -6; gx <= 6; gx++) {
        const fx = W / 2 + gx * (W / 9);
        g.beginPath(); g.moveTo(vpx, horizon); g.lineTo(fx, H); g.stroke();
      }
      // vodorovné linky v klidové poloze (scroll = 0)
      for (let r = 0; r < 8; r++) {
        const t = r / 8, y = horizon + t * t * (H - horizon);
        g.globalAlpha = 0.08 + 0.3 * t;
        g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      }
      g.globalAlpha = 1;
    },

    paintAnim(g, env) {
      const W = env.w, H = env.h, RGBA = env.rgba, rnd = env.rnd, horizon = env.horizon, now = env.now;
      // pulzující datové tečky
      for (let i = 0; i < 24; i++) {
        const x = Math.floor(rnd() * W), y = Math.floor(rnd() * (horizon - 6));
        g.globalAlpha = 0.22 + 0.3 * Math.abs(Math.sin(now / 500 + i * 1.1));
        g.fillStyle = rnd() < 0.5 ? RGBA(1) : '#6a7a98'; g.fillRect(x, y, 1, 1);
      }
      g.globalAlpha = 1;
      // ubíhající vodorovné linky mřížky
      g.strokeStyle = RGBA(0.32); g.lineWidth = 1;
      const scroll = (now / 1400) % 1;
      for (let r = 0; r < 8; r++) {
        const t = (r + scroll) / 8, y = horizon + t * t * (H - horizon);
        g.globalAlpha = 0.08 + 0.3 * t;
        g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      }
      g.globalAlpha = 1;
      // datový déšť
      for (let i = 0; i < 9; i++) {
        const x = Math.floor((i / 9) * W) + Math.floor(rnd() * 8);
        const speed = 36 + rnd() * 60;
        const yy = ((now / 1000 * speed) + rnd() * H) % (horizon + 18);
        for (let k = 0; k < 5; k++) { g.globalAlpha = 0.5 - k * 0.1; g.fillStyle = RGBA(1); g.fillRect(x, yy - k * 5, 1, 3); }
      }
      g.globalAlpha = 1;
    }
  };

  const AREAS = {};
  Object.keys(G9_TH).forEach(k => { AREAS[k] = { neon: G9_TH[k] }; });

  const WORLD9 = {
    id: 9,
    theme: 'NULL_BYTE',
    /* Fáze 02 = nulová vizuální změna: rim light ani kontaktní stín se
       nekreslí, dokud nepřijdou nové mřížky ve fázi 03. */
    look: { rim: false, shadow: false },
    arena: { h: 200, groundPad: 14, bossPad: 14, heroX: 0.12, bossX: 0.58 },
    hero: {
      cols: 18, rows: 24, legacyRows: 24, scale: 5,
      pal: PAL_HERO, skins: HERO_SKINS,
      grids: { idle: HERO_IDLE, slash: HERO_SLASH, cast: HERO_CAST, shoot: HERO_SHOOT, hit: HERO_HIT }
    },
    /* dx = 18*5+6, tedy přesně to, co počítal starý engine (šířka hrdiny
       × měřítko + 6). Ve fázi 03 se vypustí a jádro si ho spočítá samo. */
    ally: { scale: ASCALE, pal: PAL_AND, grids: ANDROID, dx: 96 },
    /* POZOR na měřítko bosse. Starý engine ho volil podle výšky mřížky
       (`rows >= 20 ? 5 : BSCALE`) a všech sedm bossů devítky má 24 řádků,
       takže se vždy kreslili měřítkem 5. Konstanta BSCALE = 7 byla pro
       tenhle ročník fakticky mrtvá. Kdyby se sem dalo 7, byli by bossové
       o 40 % větší — což je přesně to, co fáze 02 nesmí udělat. */
    bosses: { scale: 5, pals: BOSS_PALS, common: COMMON, grids: BOSS_SPRITES },
    areas: AREAS,
    backdrop: BACKDROP
  };

  window.RPGSpriteWorld9 = WORLD9;                            // pro testy
  if (window.RPGSpriteCore) window.RPGSprites9 = window.RPGSpriteCore.create(WORLD9);
})();
