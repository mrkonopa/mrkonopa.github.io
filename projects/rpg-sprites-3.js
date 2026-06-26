/* ════════════════════════════════════════════════════════════════════
   RPG Matematika 3 — pixel-art bojová scéna (canvas engine)
   Téma: Kouzelný les 🌳
   ────────────────────────────────────────────────────────────────────
   API (window.RPGSprites3):
     attach(topEl)          – vloží canvas do arény
     spawn(areaId,startDmg) – vstup bosse
     heroAttack(isCrit)     – útok hrdiny
     bossAttack()           – útok bosse
     defeat()               – poražení bosse
     setProgress(ratio)     – vizuální poškození 0→1
     detach()               – zastaví smyčku
     active()               – je engine připojený?
   ════════════════════════════════════════════════════════════════════ */
window.RPGSprites3 = (function () {
  'use strict';

  /* ── palety ── */
  // Hrdina — lesní průzkumník v zelené kápi (J=zelená tunika, G=hnědý opasek, Y=zlatá spona)
  const PAL_HERO = {
    K:'#0a0c12', J:'#2e7d32', j:'#1b4d20', C:'#f5c896', c:'#c08050',
    G:'#8a5a2b', B:'#23232e', W:'#d8e8c0', Y:'#e0b020'
  };
  const HERO_SKINS = {
    'skin-gold':    { J:'#8a6012', j:'#5a3a08', C:'#fff0b0', c:'#c9a227', G:'#c09020' },
    'skin-red':     { J:'#8a1520', j:'#5e0d14', C:'#f5c896', c:'#c08050', G:'#aa1010' },
    'skin-emerald': { J:'#0a5a38', j:'#083a24', C:'#f5c896', c:'#c08050', G:'#10aa60' },
    'skin-ghost':   { J:'#4a3a78', j:'#241d3f', C:'#d8ccff', c:'#9880d0', G:'#7050c0' },
    'skin-stealth': { J:'#1a2230', j:'#0e141e', C:'#f5c896', c:'#c08050', G:'#404a5a' }
  };
  let activeSkin = null;
  function setSkin(key) { activeSkin = HERO_SKINS[key] ? key : null; }
  function heroPal() { return activeSkin ? Object.assign({}, PAL_HERO, HERO_SKINS[activeSkin]) : PAL_HERO; }

  /* ── hrdina (18×24, pirát v námořnické vestě — kouká doprava) ── */
  const HERO_IDLE = [[
    '.......K..........',
    '......KYK.........',
    '......KCK.........',
    '.....KKCCCKK......',
    '....KCCCCCCCK.....',
    '...KCCCCCCCCCCK...',
    '...KCGGGGGGcCK....',
    '...KCGYYYYGcCK....',
    '...KCCCCCCCCCK....',
    '....KCCCCCCCCK....',
    '...WWKJJJJKWW.....',
    '..WJjKJJJJKjJW....',
    '.KWJjKJYYJKjJWK...',
    '.KWJjJYYYYJjJWK...',
    '.KWJjJWJJWJjJWK...',
    '..KKJjJYYJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KJJK.KJJK......',
    '..KJJJK.KJJJK.....',
    '..KKKKK.KKKKK.....'
  ],[
    '..................',
    '.......K..........',
    '......KYK.........',
    '......KCK.........',
    '.....KKCCCKK......',
    '....KCCCCCCCK.....',
    '...KCCCCCCCCCCK...',
    '...KCGGGGGGcCK....',
    '...KCGYYYYGcCK....',
    '...KCCCCCCCCCK....',
    '....KCCCCCCCCK....',
    '...WWKJJJJKWW.....',
    '..WJjKJJJJKjJW....',
    '.KWJjKJYYJKjJWK...',
    '.KWJjJYYYYJjJWK...',
    '.KWJjJWJJWJjJWK...',
    '..KKJjJYYJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KJJK.KJJK......',
    '..KJJJK.KJJJK.....'
  ]];
  const HERO_SLASH = [
    '.......K..........',
    '......KYK.........',
    '......KCK.........',
    '.....KKCCCKK......',
    '....KCCCCCCCK.....',
    '...KCCCCCCCCCCK...',
    '...KCGGGGGGcCK....',
    '...KCGYYYYGcCK....',
    '...KCCCCCCCCCK....',
    '....KCCCCCCCCK....',
    '...WWKJJJJKWW.....',
    '..WJjKJJJJKjJW....',
    '.KWJjKJYYJKjJWKKKK',
    '.KWJjJYYYYJjJWWWWK',
    '.KWJjJWJJWJjJKKKK.',
    '..KKJjJYYJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KJJK.KJJK......',
    '..KJJJK.KJJJK.....',
    '..KKKKK.KKKKK.....'
  ];
  const HERO_CAST = [
    'Y......K..........',
    'KY....KYK.........',
    'KJY...KCK.........',
    'KJjY.KKCCCKK......',
    'KJjKKCCCCCCCK.....',
    'KJjKCCCCCCCCCCK...',
    '...KCGGGGGGcCK....',
    '...KCGYYYYGcCK....',
    '...KCCCCCCCCCK....',
    '....KCCCCCCCCK....',
    '...WWKJJJJKWW.....',
    '..WJjKJJJJKjJW....',
    '.KWJjKJYYJKjJWK...',
    '.KWJjJYYYYJjJWK...',
    '.KWJjJWJJWJjJWK...',
    '..KKJjJYYJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KJJK.KJJK......',
    '..KJJJK.KJJJK.....',
    '..KKKKK.KKKKK.....'
  ];
  const HERO_SHOOT = [
    '.......K..........',
    '......KYK.........',
    '......KCK.........',
    '.....KKCCCKK......',
    '....KCCCCCCCK.....',
    '...KCCCCCCCCCCK...',
    '...KCGGGGGGcCK....',
    '...KCGYYYYGcCK....',
    '...KCCCCCCCCCK....',
    '....KCCCCCCCCK....',
    '...WWKJJJJKWW.....',
    '..WJjKJJJJKjJWKKKK',
    '.KWJjKJYYJKjJWYYYY',
    '.KWJjJYYYYJjJKYYWW',
    '.KWJjJWJJWJjJKKKK.',
    '..KKJjJYYJjJKK....',
    '...KJjJJJJjJK.....',
    '...KJjJJJJjJK.....',
    '...KJjJKKjJK......',
    '...KJJK.KJJK......',
    '...KjJK.KJjK......',
    '...KJJK.KJJK......',
    '..KJJJK.KJJJK.....',
    '..KKKKK.KKKKK.....'
  ];
  const HERO_HIT = [
    '.......K..........',
    '......KGK.........',
    '......KGK.........',
    '.....KKGGGKK......',
    '....KGGGGGGGK.....',
    '...KGGGGGGGGGK....',
    '...KGCCCCCCcGK....',
    '...KGCGGGGCcGK....',
    '...KGGGGGGGGGK....',
    '....KGGGGGGGK.....',
    '...WWKJJJJKWW.....',
    '..WJjKJJJJKjJW....',
    '.KWJjKJJJJKjJWK...',
    '.KWJjJJJJJJjJWK...',
    '.KWJjJJJJJJjJWK...',
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

  /* ── lesní ptáček (parťák, 14×14) — hnědé tělo, oranžová bříška ── */
  const PAL_COM = { K:'#0a0c12', S:'#9a6a2e', s:'#5e3f18', C:'#e07820', c:'#a8520f', Y:'#ffd040', k:'#aa8800' };
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

  /* ── bossové: 7 oblastí, lesní/kouzelná témata ── */
  const BOSS_PALS = {
    1:{A:'#6ab83a',a:'#3a7a1f',M:'#58a430',m:'#356b1a'},  // zelený brouk strážce — listově zelený
    2:{A:'#e05544',a:'#a02e22',M:'#cc4433',m:'#8a2218'},  // muchomůrka — červená s puntíky
    3:{A:'#ff9133',a:'#b85618',M:'#e87a22',m:'#9c4a12'},  // lstivá liška — oranžová
    4:{A:'#c2843e',a:'#7e4f20',M:'#a86c2e',m:'#6a4015'},  // jezevec/lasička — teplá hnědá
    5:{A:'#7aab4a',a:'#46692a',M:'#689a3a',m:'#3e5e24'},  // lesní duch (ent) — mechově zelený
    6:{A:'#d2aa52',a:'#8a6c2c',M:'#bc9440',m:'#705626'},  // sova strážkyně — žlutohnědá
    7:{A:'#94a0b4',a:'#54606f',M:'#7c8898',m:'#444e5a'}   // šedý vlk — břidlicově šedý
  };
  const COMMON = { K:'#0a0c12', W:'#e8ecf5', R:'#ff3355' };

  const BOSS_SPRITES = {
    1: [[ // mořský krab — tělo + klepeta + oči na stopkách (18×24)
      '..................',
      '....K........K....',
      '...KAK......KAK...',
      '..KAAK......KAAK..',
      'KAAAK........KAAAK',
      'KAAAAmmmmmmmAAAAAK',
      '.KAAAmmMMMMMmmAAK.',
      '.KAAAmMMMMMMmAAAK.',
      '.KAAAmMWWWWMmAAAK.',
      '.KAAAmMMMMMMmAAAK.',
      '.KAAAmmMMMMMmmAAK.',
      '.KAAAAmmmmmAAAAAK.',
      '..KAAAAAAAAAAAK...',
      '..KKKKKKKKKKKKK...',
      '..KaK..KaK..KaK...',
      '..KaK..KaK..KaK...',
      '..KAK..KAK..KAK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '.....K......K.....',
      '....KAK....KAK....',
      '...KAAK....KAAK...',
      'KAAAK........KAAAK',
      'KAAAAmmmmmmmAAAAAK',
      '.KAAAmmMMMMMmmAAK.',
      '.KAAAmMMMMMMmAAAK.',
      '.KAAAmMWWWWMmAAAK.',
      '.KAAAmMMMMMMmAAAK.',
      '.KAAAmmMMMMMmmAAK.',
      '.KAAAAmmmmmAAAAAK.',
      '..KAAAAAAAAAAAK...',
      '..KKKKKKKKKKKKK...',
      '..KAK..KAK..KAK...',
      '..KAK..KAK..KAK...',
      '..KaK..KaK..KaK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    2: [[ // chobotnice — kulatá hlava + chapadla (18×24)
      '......KKKKKK......',
      '....KKAAAAAAKK....',
      '...KAAAAAAAAaAK...',
      '..KAAAaaaaaaaAAAK.',
      '.KAAAaMMMMMMMaAAAK',
      '.KAAaaMMMMMMMaaAAK',
      '.KAAAaMMMMMMMaAAAK',
      '.KAAAaMWWWWWMaAAAK',
      '.KAAAaMMMMMMMaAAAK',
      '.KAAaaMMMMMMMaaAAK',
      '.KAAAaaaaaaaAAAAK.',
      '..KAAAAAAAAAAAAAK.',
      '...KKAAAAAAAAKK...',
      '..KaK.KAK.KAK.KaK.',
      '.KaAK.KAaK.KaAK.K.',
      '..KAK.KaK.KAK.KaK.',
      '..KaK..KAK..KaK...',
      '...KAK.......KaK..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '......KKKKKK......',
      '....KKAAAAAAKK....',
      '...KAAAAAAAAaAK...',
      '..KAAAaaaaaaaAAAK.',
      '.KAAAaMMMMMMMaAAAK',
      '.KAAaaMMMMMMMaaAAK',
      '.KAAAaMMMMMMMaAAAK',
      '.KAAAaWWWWWWWaAAAK',
      '.KAAAaMMMMMMMaAAAK',
      '.KAAaaMMMMMMMaaAAK',
      '.KAAAaaaaaaaAAAAK.',
      '..KAAAAAAAAAAAAAK.',
      '...KKAAAAAAAAKK...',
      '..KAK.KaK.KAK.KAK.',
      '.KAaK.KaAK.KAaK.K.',
      '..KaK.KAK.KaK.KAK.',
      '..KAK..KaK..KAK...',
      '...KaK.......KAK..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    3: [[ // kostra piráta — lebka s kloboukem a zkříženými kostmi (18×24)
      '.......KKKK.......',
      '......KMMMMK......',
      '.....KMMMMMMK.....',
      '.....KMKaaKMK.....',
      '.....KMMMMMMK.....',
      '....KKMMMMMMKK....',
      '...KMKAAAAAAKMK...',
      '...KMKAWWWAAKMK...',
      '...KMKAAAAAAKMK...',
      '...KmMMMMMMMMmK...',
      '....KWWMMMWWWK....',
      '.....KWMmKWWK.....',
      '......KMMMMK......',
      '.......KMMK.......',
      '....KMK....KMK....',
      '...KMMK....KMMK...',
      '..KMMMKKKKKKMMMK..',
      '...KMMK....KMMK...',
      '....KMK....KMK....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '.......KKKK.......',
      '......KMmMMK......',
      '.....KMMmMMMK.....',
      '.....KMKaaKMK.....',
      '.....KMMmMMMK.....',
      '....KKMMmMMMKK....',
      '...KMKAAAAAAKMK...',
      '...KMKAWWWaaKMK...',
      '...KMKAAAAAAKMK...',
      '...KmMMMMMMMMmK...',
      '....KWWWWWMWWK....',
      '.....KWWmKMWK.....',
      '......KMMMMK......',
      '.......KMMK.......',
      '....KMK....KMK....',
      '...KMMK....KMMK...',
      '..KMMMKKKKKKMMMK..',
      '...KMMK....KMMK...',
      '....KMK....KMK....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    4: [[ // žraločí kapitán — žralok s kapitánskou čepicí (18×24)
      '..................',
      '..................',
      '........KK........',
      '.......KMMK.......',
      '......KMMMMK......',
      '......KMMMMK......',
      '.....KKMMMMKK.....',
      '....KKKKKKKKKK....',
      '...KAAAAAAAAAAK...',
      '..KAAAAAAAAAAAAMK.',
      '.KAAAAaaAAAAAAAAK.',
      'KAAAAaaMMMaAAAAaaK',
      'KAAAAaaMMMaAAAAaaK',
      '.KAAAAMAAAMKAAAAK.',
      '..KAAAKWWWKAAAAK..',
      '...KAAAAAAAAAAK...',
      '....KAAAAAAAAAK...',
      '.....KAAAAAAAAK...',
      '......KAAAAAK.....',
      '.......KAAAK......',
      '........KAK.......',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '..................',
      '........KK........',
      '.......KmMK.......',
      '......KMmMMK......',
      '......KMMmMK......',
      '.....KKMMmMKK.....',
      '....KKKKKKKKKK....',
      '...KAAAAAAAAAAK...',
      '..KAAAAAAAAAAAAMK.',
      '.KAAAAaaAAAAAAAAK.',
      'KAAAAaaMMMaAAAAaaK',
      'KAAAAaaMMMaAAAAaaK',
      '.KAAAAMAAAMKAAAAK.',
      '..KAAAKWWWKAAAAK..',
      '...KAAAAAAAAAAK...',
      '....KAAAAAAAAAK...',
      '.....KAAAAAAAAK...',
      '......KAAAAAK.....',
      '.......KAAAK......',
      '........KAK.......',
      '..................',
      '..................',
      '..................'
    ]],
    5: [[ // mořská čarodějnice — záhadná postava v mořských řasách (18×24)
      '......KKKKKK......',
      '.....KAAAAAAK.....',
      '....KAAaaaAAK.....',
      '....KAaKWKaAK.....',
      '....KAaKKKaAK.....',
      '....KAAaaaAAK.....',
      '...KKAAAAAAAAmK...',
      '..KAAAAAMAAAAAK...',
      '.KAAAAMAMAAAAAAMK.',
      '.KAAAAAAMAAAAAAAAm',
      '.KAAAAAaMAAAAAMAK.',
      '.KAAAAAAMAAAAAAAAm',
      '.KAAAAMAMAAAAAAMK.',
      '..KAMAAAAAAAAAMAK.',
      '...KAAAAAAAAAAK...',
      '...KaK.KaK.KaK...',
      '...KAK.KAK.KAK...',
      '...KaK.KaK.KaK...',
      '...KAK.KAK.KAK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '......KKKKKK......',
      '.....KAAAAAAK.....',
      '....KAAaaaAAK.....',
      '....KAaKWKaAK.....',
      '....KAaKKKaAK.....',
      '....KAAaaaAAK.....',
      '...KKAAAAAAAAmK...',
      '..KAAAAAAMAAAAAK..',
      '.KAAAAAaMAAAAMAMm.',
      '.KAAAAAAaMAAAAMAm.',
      '.KAAAAAAAMAMAAAAAK',
      '.KAAAAAAaMAAAAMAm.',
      '.KAAAAAaMAAAAMAMm.',
      '..KAAAAAAMAAAAAK..',
      '...KAAAAAAAAAAK...',
      '...KAK.KAK.KAK...',
      '...KaK.KaK.KaK...',
      '...KAK.KAK.KAK...',
      '...KaK.KaK.KaK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    6: [[ // bouřkový golem — tvor z bouřkových mraků s blesky (18×24)
      '......KKKKKK......',
      '....KKAAAAAAKK....',
      '...KAAAAAAAAAaK...',
      '..KAaAAAAAAAAAaAK.',
      '.KAAaAAAAAAAAaaAMK',
      '.KAAAaAMAAMAaaAAMK',
      '.KAAAaAMAAMAaaAAMK',
      '.KAAAAaAAAAAAaAAMK',
      '.KAAAAAAAAAAAAAMmK',
      '.KAAAAAKWWWKAAAAK.',
      '..KAAAAKWaWKAAAAK.',
      '..KAAAAKWWWKAAAAmK',
      '..KKAAAAAAAAAAmKK.',
      '.KMMKAAAAAAAAAAKm.',
      '.KAAAKAAAAAAAAAK..',
      '..KKKKAAAAAAKKKK..',
      '...KAK......KAK...',
      '..KAaK......KAaK..',
      '.KAaaK......KAaaK.',
      '..KAK.......KAK...',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '......KKKKKK......',
      '....KKAAAAaAKK....',
      '...KAAAAAAAAAaK...',
      '..KAaAAAAAAAAAaAK.',
      '.KAAaAAAAAAAAaaAMK',
      '.KAAAaAMAAMAaaAAMK',
      '.KAAAaAMAAMAaaAAMK',
      '.KAAAAaAAAAAAaAAMK',
      '.KAAAAAAAAAAAAAMmK',
      '.KAAAAAKWWWKAAAAK.',
      '..KAAAAKWaWKAAAAK.',
      '..KAAAAKWWWKAAAAmK',
      '..KKAAAAAAAAAAmKK.',
      '.KMMKAAAAAAAAAAKm.',
      '.KAAAKAAAAAAAAAK..',
      '..KKKKAAAAAAKKKK..',
      '...KaK......KaK...',
      '..KaaK......KaaK..',
      '.KAaaK......KAaaK.',
      '..KaK.......KaK...',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    7: [[ // kraken — obrovský chobotnicovitý démon temných hlubin (18×24)
      '....K........K....',
      '...KAK......KAK...',
      '..KAAaK....KaAAK..',
      '.KAAAmAK..KAmAAAK.',
      'KAAAmmAAKKAAmmmAAK',
      'KAAAmMAAAAAAAmMAAK',
      'KAAAmMAAAAAAAmMAAK',
      '.KAAAmMAMMAMAmAAAK',
      '.KAAAAaMMMMMaAAAAK',
      '.KAAAAaMWWWWaAAAAK',
      '.KAAAAaMWaWMaAAAAK',
      '.KAAAAaMWWWWaAAAAK',
      '.KAAAAaMMMMMaAAAAK',
      '.KAAAAAAAAAAAAAAaK',
      '..KKAAAAAAAAAAAKK.',
      'KaK.KaK.KAK.KaK.Ka',
      'KAK.KAK.KaK.KAK.KA',
      'KaK.KaK.KAK.KaK.Ka',
      '.K...K...K...K...K',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '....K........K....',
      '...KaK......KaK...',
      '..KAAAK....KAAAa..',
      '.KAAAmAK..KAmAAAK.',
      'KAAAmmAAKKAAmmMAAK',
      'KAAAmMAAAAAAAmMAAK',
      'KAAAmMAAAAAAAmMAAK',
      '.KAAAmMAMMAMAmAAAK',
      '.KAAAAaMMMMMaAAAAK',
      '.KAAAAaWWWWWaAAAAK',
      '.KAAAAaMWaWMaAAAAK',
      '.KAAAAaWWWWWaAAAAK',
      '.KAAAAaMMMMMaAAAAK',
      '.KAAAAAAAAAAAAAAaK',
      '..KKAAAAAAAAAAAKK.',
      'KAK.KAK.KaK.KAK.KA',
      'KaK.KaK.KAK.KaK.Ka',
      'KAK.KAK.KaK.KAK.KA',
      '.K...K...K...K...K',
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

  // deterministický seedovaný RNG → stabilní pozadí pro danou oblast
  function srnd(seed) {
    let s = (seed * 2654435761) >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function pxDisc(cx, cy, r, step, color) {
    ctx.fillStyle = color;
    const rr = r * r;
    for (let y = -r; y <= r; y += step)
      for (let x = -r; x <= r; x += step)
        if (x * x + y * y <= rr) ctx.fillRect(Math.round(cx + x), Math.round(cy + y), step, step);
  }

  // lesní pozadí (obloha + slunce/měsíc + stromy + tráva, per oblast)
  const G3_WOOD = {
    1: { sky:'#bfe8ff', ground:'#4f9a35', grass:'#6fc24a', trunk:'#7a5230', leaf:'#3f8f3a', leaf2:'#5aaa45', sun:'#ffe060', sunH:'#fff5b0', firefly:false },
    2: { sky:'#a8dcf0', ground:'#45872f', grass:'#5fb040', trunk:'#6e4a2a', leaf:'#357a32', leaf2:'#4f9a3e', sun:'#ffd84a', sunH:'#fff0a0', firefly:false },
    3: { sky:'#ffd9a0', ground:'#8a6a2a', grass:'#b58a30', trunk:'#7a4a22', leaf:'#d07a22', leaf2:'#e8a030', sun:'#ff9c3a', sunH:'#ffd070', firefly:false },
    4: { sky:'#a0d8e8', ground:'#4a8a3a', grass:'#62ad48', trunk:'#6a4626', leaf:'#367a34', leaf2:'#509a42', sun:'#ffe060', sunH:'#fff5b0', firefly:false },
    5: { sky:'#88c0a0', ground:'#356a2a', grass:'#4a8a38', trunk:'#5a3e22', leaf:'#2a6a2e', leaf2:'#3f8a38', sun:'#e8f0c0', sunH:'#f8ffe0', firefly:true },
    6: { sky:'#9a86c0', ground:'#3a3258', grass:'#4e447a', trunk:'#4a3a2a', leaf:'#3a4a6a', leaf2:'#52608a', sun:'#ffe8a0', sunH:'#fff8d8', firefly:true },
    7: { sky:'#2a2c44', ground:'#1c2238', grass:'#2a3450', trunk:'#3a3242', leaf:'#28304a', leaf2:'#3a4664', sun:'#dfe6f5', sunH:'#ffffff', firefly:true }
  };
  function drawBackdrop(now) {
    const W = cv.width, H = cv.height, animOK = !rm();
    const wood = G3_WOOD[curArea] || G3_WOOD[1];
    const rnd = srnd(curArea * 97 + 13);
    const groundH = Math.round(H * 0.30);
    const skyH = H - groundH;
    // obloha
    ctx.fillStyle = wood.sky;
    ctx.fillRect(0, 0, W, skyH);
    // slunce / měsíc
    const scx = Math.round(W * 0.82), scy = 34, sr = 18;
    ctx.globalAlpha = 0.85; pxDisc(scx, scy, sr, 3, wood.sun);
    ctx.globalAlpha = 0.5; pxDisc(scx - 5, scy - 5, Math.round(sr * 0.55), 3, wood.sunH);
    ctx.globalAlpha = 1;
    // stromy v pozadí (koruny + kmeny) — deterministicky
    const nTrees = 5;
    for (let i = 0; i < nTrees; i++) {
      const tx = Math.round((i + 0.5) / nTrees * W + (rnd() - 0.5) * 30);
      const th = 40 + Math.round(rnd() * 26);
      const baseY = skyH + 4;
      const trunkW = 8 + Math.round(rnd() * 4);
      // kmen
      ctx.fillStyle = wood.trunk;
      ctx.fillRect(tx - trunkW / 2, baseY - th, trunkW, th);
      // koruna
      const cr = 18 + Math.round(rnd() * 10);
      ctx.globalAlpha = 0.95; pxDisc(tx, baseY - th - cr + 6, cr, 4, wood.leaf);
      ctx.globalAlpha = 0.7; pxDisc(tx - cr * 0.4, baseY - th - cr + 2, Math.round(cr * 0.7), 4, wood.leaf2);
      ctx.globalAlpha = 0.7; pxDisc(tx + cr * 0.4, baseY - th - cr + 4, Math.round(cr * 0.6), 4, wood.leaf2);
      ctx.globalAlpha = 1;
    }
    // zem (tráva)
    ctx.fillStyle = wood.ground;
    ctx.fillRect(0, skyH, W, groundH);
    ctx.fillStyle = wood.grass;
    ctx.fillRect(0, skyH, W, 6);
    // stébla trávy v popředí
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = wood.grass;
    for (let i = 0; i < 14; i++) {
      const gx = rnd() * W;
      const gh = 4 + Math.round(rnd() * 8);
      ctx.fillRect(gx, skyH + 4 - gh, 2, gh);
      ctx.fillRect(gx + 3, skyH + 4 - Math.round(gh * 0.7), 2, Math.round(gh * 0.7));
    }
    ctx.globalAlpha = 1;
    // světlušky / padající listí (jen animace)
    if (animOK && wood.firefly) {
      for (let i = 0; i < 6; i++) {
        const fx = ((rnd() * W) + Math.sin(now / 900 + i) * 18) % W;
        const fy = 30 + ((now / 24 + i * 40) % (skyH - 30));
        const tw = (Math.sin(now / 200 + i * 2) + 1) / 2;
        ctx.globalAlpha = 0.3 + tw * 0.55;
        ctx.fillStyle = '#ffee99';
        ctx.fillRect(Math.round(fx), Math.round(fy), 3, 3);
      }
      ctx.globalAlpha = 1;
    } else if (animOK) {
      // padající lístky pro denní oblasti
      for (let i = 0; i < 5; i++) {
        const lx = ((rnd() * W) + Math.sin(now / 700 + i * 1.3) * 26) % W;
        const ly = ((now / 30 + i * 55) % (skyH + 10));
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = i % 2 ? wood.leaf2 : wood.leaf;
        ctx.fillRect(Math.round(lx), Math.round(ly), 4, 3);
      }
      ctx.globalAlpha = 1;
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
    drawBackdrop(now);
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
      if (b.mode === 'idle' && !rm()) {
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
    // papoušek — sedí na rameni hrdiny a mírně se houpá
    {
      const bob = rm() ? 0 : Math.sin(performance.now() / 380) * 5;
      const ax = hp.x + 18 * SCALE + 6, ay = hp.y + 6 * SCALE + bob;
      drawSprite(COMPANION[rm() ? 0 : tick % 2], PAL_COM, ax, ay, ASCALE, false, false);
      if (!rm()) {
        // křídlo — žlutý pohyb
        ctx.fillStyle = (tick % 2) ? '#ffd040' : '#cc2222';
        ctx.fillRect(ax + 5 * ASCALE, ay + 10 * ASCALE, ASCALE, ASCALE);
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
        ctx.fillStyle = f.kind === 'orb' ? '#ffd040' : '#ff8833';
        const s = f.kind === 'orb' ? 10 : 6;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.fillStyle = f.kind === 'orb' ? 'rgba(255,208,64,.4)' : 'rgba(255,136,51,.4)';
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
        if (f.t < 60 && !f.hitDone) { f.hitDone = 1; impact(f, '255,208,64'); }
        if (Math.floor(f.t / 60) % 2 === 0) {
          ctx.strokeStyle = '#fff7c0'; ctx.lineWidth = 4;
          ctx.beginPath();
          let xx = f.x1, yy = f.y1 - 80;
          ctx.moveTo(xx, yy);
          while (yy < f.y1) { yy += 22; xx = f.x1 + (Math.random() * 24 - 12); ctx.lineTo(xx, Math.min(yy, f.y1)); }
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,208,64,.5)'; ctx.lineWidth = 9; ctx.stroke();
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
        ctx.fillStyle = '#4dc8ff';
        ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.fillStyle = 'rgba(77,200,255,.45)';
        ctx.fillRect(x - 7, y - 7, 14, 14);
        if (p >= 1) { ST.fx.splice(i, 1); impact(f, '77,200,255'); }
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
      } else if (f.kind === 'shock') {
        const p = Math.min(1, f.t / 260);
        ctx.strokeStyle = 'rgba(' + f.rgb + ',' + (0.9 - p * 0.9) + ')';
        ctx.lineWidth = 4 - p * 3;
        ctx.beginPath(); ctx.arc(f.x, f.y, 8 + p * 58, 0, Math.PI * 2); ctx.stroke();
        if (p >= 1) ST.fx.splice(i, 1);
      } else if (f.kind === 'debris') {
        f.x += f.vx; f.y += f.vy; f.vy += 0.18; f.vx *= 0.99;
        const p = Math.min(1, f.t / 380);
        ctx.fillStyle = 'rgba(' + f.rgb + ',' + (1 - p) + ')';
        const s = f.s || 4;
        ctx.fillRect(f.x - s / 2, f.y - s / 2, s, s);
        if (p >= 1 || f.y > 212) ST.fx.splice(i, 1);
      }
    }
  }

  function impact(f, rgb) {
    ST.boss.flash = 130; ST.boss.t = 0;
    ST.fx.push({ kind: 'boom', x: f.x1, y: f.y1, t: 0,
      rgb: rgb || (f.kind === 'orb' ? '255,208,64' : '255,136,51') });
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
    const bcx = bp.x + 9 * bp.sc, bcy = bp.y + 9 * bp.sc;
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
      ST.fx.push({ kind: 'bossproj', x0: bp.x + 5 * bp.sc, y0: bp.y + 9 * bp.sc, x1: hp.x + 6 * SCALE, y1: hp.y + 13 * SCALE, t: 0 });
    }, 520);
  }

  function defeat() {
    if (!active()) return;
    const bp = bossPos();
    ST.boss.mode = 'defeat'; ST.boss.t = 0;
    const pal = BOSS_PALS[curArea] || BOSS_PALS[1];
    const n = parseInt(pal.A.slice(1), 16);
    const rgb = ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
    const cx = bp.x + 9 * bp.sc, cy = bp.y + 9 * bp.sc;
    ST.fx.push({ kind: 'boom', x: cx, y: cy, t: 0, rgb });
    if (rm()) return;
    ST.fx.push({ kind: 'shock', x: cx, y: cy, t: 0, rgb });
    for (let k = 0; k < 18; k++) {
      const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3.4;
      ST.fx.push({ kind: 'debris', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.4,
        s: 3 + Math.floor(Math.random() * 3), rgb, t: 0 });
    }
    for (let k = 0; k < 7; k++)
      ST.fx.push({ kind: 'smoke', x: cx + (Math.random() - 0.5) * 34, y: cy + (Math.random() - 0.5) * 22,
        vx: (Math.random() - 0.5) * 1.3, vy: -0.6 - Math.random() * 0.9, t: 0 });
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
