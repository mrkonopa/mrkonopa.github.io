/* ════════════════════════════════════════════════════════════════════
   rpg-sprites-6.js — svět 6. ročníku pro rpg-sprite-core
   ────────────────────────────────────────────────────────────────────
   KROK A migrace: jen data + pozadí, engine je ve sdíleném jádru.
   Mřížky jsou ZÁMĚRNĚ ty současné (hrdina 18×24) a rim light ani
   kontaktní stín se nekreslí — tenhle krok NESMÍ změnit vzhled.
   Nové mřížky 20×29 přijdou v kroku B.

   Bez jádra se nedefinuje NIC a hra jede dál na emoji animacích.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const PAL_HERO = {
    K:'#0a0c12', J:'#c84820', j:'#882010', C:'#ffd040', c:'#aa8800',
    G:'#7a5a40', B:'#23232e', W:'#e8ecf5', Y:'#4dc8ff'
  };
  const HERO_SKINS = {
    'skin-gold':    { J:'#caa12a', j:'#8a6a12', C:'#fff0b0', c:'#c9a227', G:'#8a7a3a' },
    'skin-red':     { J:'#a51d2e', j:'#5e1019', C:'#ff6b6b', c:'#a02020', G:'#7a3a44' },
    'skin-emerald': { J:'#108a55', j:'#0a4d31', C:'#39ff9e', c:'#1a8a5a', G:'#3a7a5a' },
    'skin-ghost':   { J:'#4a3a78', j:'#241d3f', C:'#c08aff', c:'#7a4fd0', G:'#6a5a85' },
    'skin-stealth': { J:'#2c2c34', j:'#161619', C:'#9fb0c8', c:'#5a6a85', G:'#40454f' }
  };
  const HERO_IDLE = [[
    '.......K..........',
    '......KYK.........',
    '......KWK.........',
    '.....KKWWWKK......',
    '....KWWWWWWWK.....',
    '...KWWWWWWWWWK....',
    '...KWCCCCCCcWK....',
    '...KWCYYYYCcWK....',
    '...KWWWWWWWWWK....',
    '....KWWWWWWWK.....',
    '...GGKJJJJKGG.....',
    '..GJjKJJJJKjJG....',
    '.KGJjKJYYJKjJGK...',
    '.KWJjJYYYYJjJWK...',
    '.KWJjJWJJWJjJWK...',
    '..KKJjJYYJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KWWK.KWWK......',
    '..KWWWK.KWWWK.....',
    '..KKKKK.KKKKK.....'
  ],[
    '..................',
    '.......K..........',
    '......KYK.........',
    '......KWK.........',
    '.....KKWWWKK......',
    '....KWWWWWWWK.....',
    '...KWWWWWWWWWK....',
    '...KWCCCCCCcWK....',
    '...KWCYYYYCcWK....',
    '...KWWWWWWWWWK....',
    '....KWWWWWWWK.....',
    '...GGKJJJJKGG.....',
    '..GJjKJJJJKjJG....',
    '.KGJjKJYYJKjJGK...',
    '.KWJjJYYYYJjJWK...',
    '.KWJjJWJJWJjJWK...',
    '..KKJjJYYJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KWWK.KWWK......',
    '..KWWWK.KWWWK.....'
  ]];
  const HERO_SLASH = [
    '.......K..........',
    '......KYK.........',
    '......KWK.........',
    '.....KKWWWKK......',
    '....KWWWWWWWK.....',
    '...KWWWWWWWWWK....',
    '...KWCCCCCCcWK....',
    '...KWCYYYYCcWK....',
    '...KWWWWWWWWWK....',
    '....KWWWWWWWK.....',
    '...GGKJJJJKGG.....',
    '..GJjKJJJJKjJG....',
    '.KGJjKJYYJKjJGKKKK',
    '.KWJjJYYYYJjJWWWWK',
    '.KWJjJWJJWJjJKKKK.',
    '..KKJjJYYJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KWWK.KWWK......',
    '..KWWWK.KWWWK.....',
    '..KKKKK.KKKKK.....'
  ];
  const HERO_CAST = [
    'Y......K..........',
    'KY....KYK.........',
    'KJY...KWK.........',
    'KJjY.KKWWWKK......',
    'KJjKKWWWWWWWK.....',
    'KJjKWWWWWWWWWK....',
    '...KWCCCCCCcWK....',
    '...KWCYYYYCcWK....',
    '...KWWWWWWWWWK....',
    '....KWWWWWWWK.....',
    '...GGKJJJJKGG.....',
    '..GJjKJJJJKjJG....',
    '.KGJjKJYYJKjJGK...',
    '.KWJjJYYYYJjJWK...',
    '.KWJjJWJJWJjJWK...',
    '..KKJjJYYJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KWWK.KWWK......',
    '..KWWWK.KWWWK.....',
    '..KKKKK.KKKKK.....'
  ];
  const HERO_SHOOT = [
    '.......K..........',
    '......KYK.........',
    '......KWK.........',
    '.....KKWWWKK......',
    '....KWWWWWWWK.....',
    '...KWWWWWWWWWK....',
    '...KWCCCCCCcWK....',
    '...KWCYYYYCcWK....',
    '...KWWWWWWWWWK....',
    '....KWWWWWWWK.....',
    '...GGKJJJJKGG.....',
    '..GJjKJJJJKjJGKKKK',
    '.KGJjKJYYJKjJGYYYY',
    '.KWJjJYYYYJjJKYYWW',
    '.KWJjJWJJWJjJKKKK.',
    '..KKJjJYYJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KWWK.KWWK......',
    '..KWWWK.KWWWK.....',
    '..KKKKK.KKKKK.....'
  ];
  const HERO_HIT = [
    '.......K..........',
    '......KJK.........',
    '......KJK.........',
    '.....KKJJJKK......',
    '....KJJJJJJJK.....',
    '...KJJJJJJJJJK....',
    '...KJCCCCCCcJK....',
    '...KJCJJJJCcJK....',
    '...KJJJJJJJJJK....',
    '....KJJJJJJJK.....',
    '...GGKJJJJKGG.....',
    '..GJjKJJJJKjJG....',
    '.KGJjKJJJJKjJGK...',
    '.KJJjJJJJJJjJJK...',
    '.KJJjJJJJJJjJJK...',
    '..KKJjJJJJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KJJK.KJJK......',
    '..KJJJK.KJJJK.....',
    '..KKKKK.KKKKK.....'
  ];

  /* ── parťák ── */
  const PAL_COM = { K:'#0a0c12', S:'#a0b4c8', s:'#606878', C:'#4dc8ff', c:'#2a88bb', Y:'#ffd040', k:'#aa8800' };
  const COMPANION = [[
    '......KYK.....',
    '....KKYYYKK...',
    '...KSSSSSSSK..',
    '..KSSSSSSSSSK.',
    '.KSSKCCCCKSSK.',
    '.KSKCCWWCCKSK.',
    '.KSKCCCCCCKSK.',
    '.KSSKCCCCKSSK.',
    '..KSSSSSSSSSK.',
    '...KSSSSSSSK..',
    '...KKssssKK...',
    '.....KssK.....',
    '....KsssK.....',
    '.....KKK......'
  ],[
    '......KkK.....',
    '....KKYYYKK...',
    '...KSSSSSSSK..',
    '..KSSSSSSSSSK.',
    '.KSSKCCCCKSSK.',
    '.KSKCCCWWCKSK.',
    '.KSKCCCCCCKSK.',
    '.KSSKCCCCKSSK.',
    '..KSSSSSSSSSK.',
    '...KSSSSSSSK..',
    '...KKssssKK...',
    '.....KssK.....',
    '.....KsssK....',
    '......KKK.....'
  ]];

  /* ── bossové (mřížky se v této fázi nemění) ── */
  const BOSS_PALS = {
    1:{A:'#4dc8ff',a:'#1a6a8a',M:'#2a3a5c',m:'#1a2a42'},   // palubní robot — cyan
    2:{A:'#ff8833',a:'#994422',M:'#7a4a2a',m:'#54321c'},   // měřicí dron — orange
    3:{A:'#cc66ff',a:'#662288',M:'#6a3a9a',m:'#4a286e'},   // navigační AI — purple
    4:{A:'#88ccff',a:'#3a6a9f',M:'#2a3a66',m:'#1a2a46'},   // oblačný strážce — light blue
    5:{A:'#ff66aa',a:'#882244',M:'#a03060',m:'#702045'},   // mlhovinný strážce — pink
    6:{A:'#ffd040',a:'#997a10',M:'#4a3a10',m:'#322a0a'},   // kometární mistr — gold
    7:{A:'#bb94ff',a:'#6a3ac0',M:'#6e54a8',m:'#4c3a7a'}    // vládce galaxie — violet
  };
  const COMMON = { K:'#0a0c12', W:'#e8ecf5', R:'#ff3355' };
  const BOSS_SPRITES = {
    1: [[ // palubní robot — kyklopí průzkumný stroj s anténou (18×24 hi-res)
      '........KK........',
      '.......KAAK.......',
      '.......KaaK.......',
      '......KMMMMK......',
      '.....KMMMMMMK.....',
      '....KMMMMMMMMK....',
      '...KMMMMMMMMMMK...',
      '...KMKAAAAAAKMK...',
      '...KMKAAWWAAKMK...',
      '...KMKAAAAAAKMK...',
      '...KMMMMMMMMMMK...',
      '...KmMMMMMMMMmK...',
      '..KKKKKKKKKKKKKK..',
      '..KMMMMMMMMMMMMK..',
      '.KMMAAAAAAAAAAMMK.',
      '.KMMAaKMMMMKaAMMK.',
      '.KMMAAAAAAAAAAMMK.',
      '.KMMMMMMMMMMMMMMK.',
      '.KMmMMMMMMMMMMmMK.',
      '.KMMMMMMMMMMMMMMK.',
      '..KKKKKKKKKKKKKK..',
      '...KMK......KMK...',
      '...KmK......KmK...',
      '..KKKK......KKKK..'
    ],[
      '........KK........',
      '.......KaaK.......',
      '.......KAAK.......',
      '......KMMMMK......',
      '.....KMMMMMMK.....',
      '....KMMMMMMMMK....',
      '...KMMMMMMMMMMK...',
      '...KMKAAAAAAKMK...',
      '...KMKAAAAWWKMK...',
      '...KMKAAAAAAKMK...',
      '...KMMMMMMMMMMK...',
      '...KmMMMMMMMMmK...',
      '..KKKKKKKKKKKKKK..',
      '..KMMMMMMMMMMMMK..',
      '.KMMAAAAAAAAAAMMK.',
      '.KMMAaKMMMMKaAMMK.',
      '.KMMAAAAAAAAAAMMK.',
      '.KMMMMMMMMMMMMMMK.',
      '.KMmMMMMMMMMMMmMK.',
      '.KMMMMMMMMMMMMMMK.',
      '..KKKKKKKKKKKKKK..',
      '...KmK......KmK...',
      '...KMK......KMK...',
      '..KKKK......KKKK..'
    ]],
    2: [[ // prstencová planeta s tváří (18×24 hi-res)
      '..................',
      '..................',
      '......KKKKKK......',
      '....KKMMMMMMKK....',
      '...KMMMMMMMMMMK...',
      '..KMMMMMMMMMMMMK..',
      '..KMMWWMMMMWWMMK..',
      '..KMMWAMMMMWAMMK..',
      '..KMMMMMMMMMMMMK..',
      '.KMMMMMMMMMMMMMMK.',
      'KKKKKKKKKKKKKKKKKK',
      'KAAAAAAAAAAAAAAAAK',
      'KKKKKKKKKKKKKKKKKK',
      '.KMMMMMMMMMMMMMMK.',
      '..KMMMKMMMMKMMMK..',
      '..KMMMKKKKKKMMMK..',
      '...KMMMMMMMMMMK...',
      '....KKMMMMMMKK....',
      '......KKKKKK......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '..................',
      '......KKKKKK......',
      '....KKMMMMMMKK....',
      '...KMMMMMMMMMMK...',
      '..KMMMMMMMMMMMMK..',
      '..KMMWWMMMMWWMMK..',
      '..KMMAWMMMMAWMMK..',
      '..KMMMMMMMMMMMMK..',
      '.KMMMMMMMMMMMMMMK.',
      'KKKKKKKKKKKKKKKKKK',
      'KaAaAaAaAaAaAaAaAK',
      'KKKKKKKKKKKKKKKKKK',
      '.KMMMMMMMMMMMMMMK.',
      '..KMMMKMMMMKMMMK..',
      '..KMMMKKKKKKMMMK..',
      '...KMMMMMMMMMMK...',
      '....KKMMMMMMKK....',
      '......KKKKKK......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    3: [[ // jádro asteroidu — rozeklaná skála se žhnoucíma očima (18×24 hi-res)
      '..................',
      '.....KKKKKK.......',
      '...KKMMMMMMKK.....',
      '..KMMMMmMMMMMK....',
      '.KMMmMMMMMMmMMK...',
      '.KMMMMMMMMMMMMK...',
      'KMMKAAKMMKAAKMMK..',
      'KMMKAAKMMKAAKMMK..',
      'KMMMMMMmmMMMMMMK..',
      'KMmMMMMMMMMMMmMK..',
      '.KMMMMKAAAAKMMMK..',
      '.KMMMMKAAAAKMMMK..',
      '.KMMMMMMMMMMMMMK..',
      '.KMmMMMMMMMMMMMK..',
      '..KMMMMmMMMMMMK...',
      '..KMMMMMMMMMMMK...',
      '...KMMMMMMMMMK....',
      '...KMMmMMMMMMK....',
      '....KMMMMMMMK.....',
      '....KKKKKKKKK.....',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '.....KKKKKK.......',
      '...KKMMMMMMKK.....',
      '..KMMMMmMMMMMK....',
      '.KMMmMMMMMMmMMK...',
      '.KMMMMMMMMMMMMK...',
      'KMMKaaKMMKaaKMMK..',
      'KMMKaaKMMKaaKMMK..',
      'KMMMMMMmmMMMMMMK..',
      'KMmMMMMMMMMMMmMK..',
      '.KMMMMKaaaaKMMMK..',
      '.KMMMMKaaaaKMMMK..',
      '.KMMMMMMMMMMMMMK..',
      '.KMmMMMMMMMMMMMK..',
      '..KMMMMmMMMMMMK...',
      '..KMMMMMMMMMMMK...',
      '...KMMMMMMMMMK....',
      '...KMMmMMMMMMK....',
      '....KMMMMMMMK.....',
      '....KKKKKKKKK.....',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    4: [[ // mlhovinný strážce — vlnící se přízrak se třema očima (18×24 hi-res)
      '......KKKKKK......',
      '....KKAAAAAAKK....',
      '...KAAaaaaaaAAK...',
      '..KAaaaaaaaaaaAK..',
      '.KAaaaaaaaaaaaaAK.',
      '.KAaWKaaaaKWaaaAK.',
      '.KAaaKKaaaaKKaaAK.',
      '.KAaaaaaWKaaaaaAK.',
      '.KAaaaaaKKaaaaaAK.',
      '.KAaaaaaaaaaaaaAK.',
      '.KAaaaaaaaaaaaaAK.',
      '..KAaaaaaaaaaaAK..',
      '..KAaKAaaaaKAaAK..',
      '..KAK.KAaaAK.KAK..',
      '..KAK..KAAK..KAK..',
      '...K...KAK...K....',
      '.......KAK........',
      '........K.........',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '......KKKKKK......',
      '....KKAAAAAAKK....',
      '...KAAaaaaaaAAK...',
      '..KAaaaaaaaaaaAK..',
      '.KAaaaaaaaaaaaaAK.',
      '.KAaKWaaaaWKaaaAK.',
      '.KAaaKKaaaaKKaaAK.',
      '.KAaaaaaWKaaaaaAK.',
      '.KAaaaaaKKaaaaaAK.',
      '.KAaaaaaaaaaaaaAK.',
      '.KAaaaaaaaaaaaaAK.',
      '..KAaaaaaaaaaaAK..',
      '..KAaKAaaaaKAaAK..',
      '..KAK.KAaaAK.KAK..',
      '...KAK.KAAK.KAK...',
      '....K..KAK..K.....',
      '.......KAK........',
      '........K.........',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    5: [[ // zrcadlový měsíc — srpek s tváří a hvězdou (18×24 hi-res)
      '.......KKKKKK.....',
      '.....KKMMMMMMK....',
      '....KMMMMMMKKK....',
      '...KMMMMMKK.......',
      '..KMMMMMK.....K...',
      '..KMMWKMK....KAK..',
      '.KMMMKKMK...KAAAK.',
      '.KMMMMMMK....KAK..',
      '.KMMMMMMK.....K...',
      '.KMMMMMMMK........',
      '.KMMMMMMMK........',
      '..KMMMMMMK........',
      '..KMMMMMMMKK......',
      '...KMMMMMMMMKK....',
      '....KMMMMMMMMK....',
      '.....KKMMMMMK.....',
      '.......KKKKK......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '.......KKKKKK.....',
      '.....KKMMMMMMK....',
      '....KMMMMMMKKK....',
      '...KMMMMMKK.......',
      '..KMMMMMK.........',
      '..KMMKWMK....K....',
      '.KMMMKKMK...KWK...',
      '.KMMMMMMK....K....',
      '.KMMMMMMK.....K...',
      '.KMMMMMMMK........',
      '.KMMMMMMMK........',
      '..KMMMMMMK........',
      '..KMMMMMMMKK......',
      '...KMMMMMMMMKK....',
      '....KMMMMMMMMK....',
      '.....KKMMMMMK.....',
      '.......KKKKK......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    6: [[ // krychlová stanice — servisní kostka s nožičkama (18×24 hi-res)
      '..................',
      '...KKKKKKKKKKKK...',
      '..KMMMMMMMMMMMMK..',
      '.KMMAAAAAAAAAAMMK.',
      '.KMAKKKKKKKKKKAMK.',
      '.KMAKWWKKKKWWKAMK.',
      '.KMAKWAKKKKWAKAMK.',
      '.KMAKKKKKKKKKKAMK.',
      '.KMAKAAAAAAAAKAMK.',
      '.KMAKKKKKKKKKKAMK.',
      '.KMAKAAKKKKAAKAMK.',
      '.KMAKKKKKKKKKKAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '..KMMMMMMMMMMMMK..',
      '...KKKKKKKKKKKK...',
      '....KMK....KMK....',
      '....KmK....KmK....',
      '...KKKK....KKKK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '...KKKKKKKKKKKK...',
      '..KMMMMMMMMMMMMK..',
      '.KMMAAAAAAAAAAMMK.',
      '.KMAKKKKKKKKKKAMK.',
      '.KMAKWAKKKKWAKAMK.',
      '.KMAKWWKKKKWWKAMK.',
      '.KMAKKKKKKKKKKAMK.',
      '.KMAKAAAAAAAAKAMK.',
      '.KMAKKKKKKKKKKAMK.',
      '.KMAKAAKKKKAAKAMK.',
      '.KMAKKKKKKKKKKAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '..KMMMMMMMMMMMMK..',
      '...KKKKKKKKKKKK...',
      '....KMK....KMK....',
      '....KmK....KmK....',
      '...KKKK....KKKK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    7: [[ // vládce galaxie — UFO mateřská loď s kupolí (18×24 hi-res)
      '.......KKKK.......',
      '......KAAAAK......',
      '.....KAWWKAAK.....',
      '.....KAAAAAAK.....',
      '....KKAAAAAAKK....',
      '..KKMMMMMMMMMMKK..',
      '.KMMMMMMMMMMMMMMK.',
      'KMmAKMmAKMmAKMmAKK',
      'KMMMMMMMMMMMMMMMMK',
      'KMMMMMMMMMMMMMMMMK',
      '.KmmMMMMMMMMMMmmK.',
      '..KKKKKKKKKKKKKK..',
      '....KAK....KAK....',
      '.....KaK..KaK.....',
      '......K....K......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '.......KKKK.......',
      '......KAAAAK......',
      '.....KAAKWWAK.....',
      '.....KAAAAAAK.....',
      '....KKAAAAAAKK....',
      '..KKMMMMMMMMMMKK..',
      '.KMMMMMMMMMMMMMMK.',
      'KAKMmAKMmAKMmAKMK.',
      'KMMMMMMMMMMMMMMMMK',
      'KMMMMMMMMMMMMMMMMK',
      '.KmmMMMMMMMMMMmmK.',
      '..KKKKKKKKKKKKKK..',
      '.....KAK..KAK.....',
      '....KaK....KaK....',
      '.....K......K.....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]]
  };

  /* ── pozadí ──
     pxDisc zůstává u ročníku (jádro ho nemá — 9. ročník ho nepoužívá).
     Statická vrstva se kreslí jednou do off-screen plátna, pohyblivá
     (mihotání hvězd) každý snímek. */
  function pxDisc(g, cx, cy, r, step, color) {
    g.fillStyle = color;
    const rr = r * r;
    for (let y = -r; y <= r; y += step)
      for (let x = -r; x <= r; x += step)
        if (x * x + y * y <= rr) g.fillRect(Math.round(cx + x), Math.round(cy + y), step, step);
  }

  const G6_PLANETS = {
    1: { c: '#b85a2a', h: '#e08a4a', ring: 0, neb: '#5a2a1a' }, // rezavá
    2: { c: '#c8a24a', h: '#ecd28a', ring: 1, neb: '#4a3a1a' }, // prstencová zlatá
    3: { c: '#5a5a6e', h: '#8a8aa0', ring: 0, neb: '#2a2a3a' }, // kamenná šedá
    4: { c: '#6a44b0', h: '#a070e0', ring: 0, neb: '#3a1f6a' }, // fialová mlhovina
    5: { c: '#5aa0c8', h: '#aee0f0', ring: 0, neb: '#1f3a5a' }, // ledová modrá
    6: { c: '#2f8a5a', h: '#5ad08a', ring: 1, neb: '#1a4a2f' }, // zelený plyn
    7: { c: '#9a3a7a', h: '#d06ab0', ring: 0, neb: '#4a1a3a' }  // purpurová
  };

  function paintSky(g, env, animOK) {
    const W = env.w, H = env.h, now = env.now;
    const pl = G6_PLANETS[env.area] || G6_PLANETS[1];
    const rnd = env.rnd;
    // mlhovinný opar
    g.globalAlpha = 0.10; pxDisc(g, Math.round(W * 0.30), 78, 64, 6, pl.neb);
    g.globalAlpha = 0.07; pxDisc(g, Math.round(W * 0.62), 50, 48, 6, pl.neb);
    g.globalAlpha = 1;
    // hvězdy
    for (let i = 0; i < 48; i++) {
      const x = Math.floor(rnd() * W), y = Math.floor(rnd() * (H - 26));
      const base = 0.30 + rnd() * 0.5;
      const tw = animOK ? 0.28 * Math.sin(now / 600 + i * 1.7) : 0;
      g.globalAlpha = Math.max(0.10, base + tw);
      g.fillStyle = rnd() < 0.28 ? '#aee0ff' : '#ffffff';
      const s = rnd() < 0.16 ? 2 : 1;
      g.fillRect(x, y, s, s);
    }
    g.globalAlpha = 1;
    // planeta vpravo nahoře
    const pcx = Math.round(W * 0.82), pcy = 50, pr = 28;
    if (pl.ring) {
      g.globalAlpha = 0.45; g.strokeStyle = pl.h; g.lineWidth = 3;
      g.beginPath(); g.ellipse(pcx, pcy, pr + 17, 7, -0.42, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 1;
    }
    g.globalAlpha = 0.85; pxDisc(g, pcx, pcy, pr, 3, pl.c);
    g.globalAlpha = 0.5; pxDisc(g, pcx - 8, pcy - 8, Math.round(pr * 0.5), 3, pl.h);
    if (pl.ring) {
      g.globalAlpha = 0.7; g.strokeStyle = pl.h; g.lineWidth = 3;
      g.beginPath(); g.ellipse(pcx, pcy, pr + 17, 7, -0.42, 0.35, Math.PI - 0.35); g.stroke();
    }
    g.globalAlpha = 1;
  }

  const backdrop = {
    horizon: 0.46,
    seed: a => a * 97 + 13,          // PŮVODNÍ seed — jinak se rozložení posune
    fullAnim: true,
    /* Vesmírné pozadí šestky se odjakživa překreslovalo celé každý snímek
       (hvězdy blikají). Obě vrstvy proto volají TÉHOŽ malíře — statická
       s vypnutým blikáním, pohyblivá se zapnutým. Kdyby se rozdělil na
       „opar+planeta staticky, hvězdy pohyblivě“, změnilo by se pořadí
       kreslení (planeta dnes hvězdy překrývá) a pozadí by nebylo shodné. */
    paintStatic(g, env) { paintSky(g, env, false); },
    paintAnim(g, env)   { paintSky(g, env, env.animOK); }

  };

  /* Neon oblasti = akcent bosse, takže hrdina „chytá" světlo toho,
     proti komu stojí. V kroku A se nepoužije (rim je vypnutý). */
  const AREAS = {
    1: { neon: '#4dc8ff' },
    2: { neon: '#ff8833' },
    3: { neon: '#cc66ff' },
    4: { neon: '#88ccff' },
    5: { neon: '#ff66aa' },
    6: { neon: '#ffd040' },
    7: { neon: '#bb94ff' },
  };

  const WORLD6 = {
    id: 6,
    theme: 'Vesmírná expedice',
    /* KROK A: žádný rim ani stín — vzhled se nesmí změnit. */
    look: { rim: false, shadow: false },
    /* bossPad 14: starý engine měl bosse na pevných 186 px. */
    arena: { h: 200, groundPad: 14, bossPad: 14, heroX: 0.12, bossX: 0.58 },
    hero: {
      cols: 18, rows: 24, scale: 5,
      pal: PAL_HERO, skins: HERO_SKINS,
      grids: { idle: HERO_IDLE, slash: HERO_SLASH, cast: HERO_CAST, shoot: HERO_SHOOT, hit: HERO_HIT }
    },
    /* dx 96 = staré hp.x + 18*SCALE + 6. Bez toho parťák uskočí o 10 px
       doleva, protože výchozí (18−2)*5+6 dá 86. */
    /* `jet` = iontový pohon sondy (dva čtverečky pod trupem, střídavě
       studený/horký podle tick%2). Bez něj se sonda kreslí, ale plamínky
       zmizí — a pod reduced-motion se to NEPOZNÁ, protože se stejně
       nekreslí. Odhaleno až srovnáním animované vrstvy se zmrazeným časem. */
    ally: { scale: 4, dy: 90, pal: PAL_COM, grids: COMPANION, dx: 96,
            jet: { hot: '#4dc8ff', cold: '#1a6a8a', at: [[5, 13], [6, 13]] } },
    /* 5, NE 7 — všech 7 bossů má 24 řádků, starý engine je kreslil
       měřítkem 5 a BSCALE = 7 je mrtvá konstanta. NEOPRAVOVAT. */
    bosses: { scale: 5, pals: BOSS_PALS, common: COMMON, grids: BOSS_SPRITES },
    areas: AREAS,
    backdrop: backdrop
  };

  window.RPGSpriteWorld6 = WORLD6;
  if (window.RPGSpriteCore) window.RPGSprites6 = window.RPGSpriteCore.create(WORLD6);
})();
