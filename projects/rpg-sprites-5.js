/* ════════════════════════════════════════════════════════════════════
   RPG Matematika 5 — pixel-art bojová scéna (canvas engine)
   Téma: Dračí říše 🐉
   ────────────────────────────────────────────────────────────────────
   API (window.RPGSprites5):
     attach(topEl)          – vloží canvas do arény
     spawn(areaId,startDmg) – vstup bosse
     heroAttack(isCrit)     – útok hrdiny
     bossAttack()           – útok bosse
     defeat()               – poražení bosse
     setProgress(ratio)     – vizuální poškození 0→1
     detach()               – zastaví smyčku
     active()               – je engine připojený?
   ════════════════════════════════════════════════════════════════════ */
window.RPGSprites5 = (function () {
  'use strict';

  /* ── palety ── */
  // Hrdina — mladý pirát v námořnické vestě
  const PAL_HERO = {
    K:'#0a0c12', J:'#6f7888', j:'#3a4150', H:'#8a93a4',
    C:'#f3c89a', G:'#b32a22', g:'#7a160f', Y:'#e8c24a',
    W:'#e8ecf5', S:'#cdd2dc', B:'#23262f', N:'#d9caa0',
    R:'#ff3355'
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

  /* ── dračí rytíř s rohatou helmou 🐉 — kouká doprava, velký meč (18×24) ── */
  const HERO_IDLE = [[
    '.N..........N.....',
    '..N........N......',
    '..N........N..S...',
    '...KKHHHHHKK.KSK..',
    '..KHHHHHHHHHKKSK..',
    '..KHHHHHHHHHK.SK..',
    '..KKKKKKKKKKKKSK..',
    '..KHRHHHHRHHK.SK..',
    '..KHHHHHHHHHKYSYK.',
    '...KHHHHHHHK.KSK..',
    '...WKJJJJJJKWCCK..',
    '..WJjJGGGGJjCCK...',
    '..KCJJGYYGJJCK....',
    '...KJJGGGGJJK.....',
    '...KJjGGGGjJK.....',
    '...KJjJGGJjJK.....',
    '...KJjJGGJjJK.....',
    '...KJjJKKJjJK.....',
    '...KBBK..KBBK.....',
    '...KBBK..KBBK.....',
    '..KBBBK..KBBBK....',
    '..KKKKK..KKKKK....',
    '..................',
    '..................'
  ],[
    '..................',
    '.N..........N.....',
    '..N........N......',
    '..N........N..S...',
    '...KKHHHHHKK.KSK..',
    '..KHHHHHHHHHKKSK..',
    '..KHHHHHHHHHK.SK..',
    '..KKKKKKKKKKKKSK..',
    '..KHRHHHHRHHK.SK..',
    '..KHHHHHHHHHKYSYK.',
    '...KHHHHHHHK.KSK..',
    '...WKJJJJJJKWCCK..',
    '..WJjJGGGGJjCCK...',
    '..KCJJGYYGJJCK....',
    '...KJJGGGGJJK.....',
    '...KJjGGGGjJK.....',
    '...KJjJGGJjJK.....',
    '...KJjJGGJjJK.....',
    '...KJjJKKJjJK.....',
    '...KBBK..KBBK.....',
    '...KBBK..KBBK.....',
    '..KBBBK..KBBBK....',
    '..KKKKK..KKKKK....',
    '..................'
  ]];
  const HERO_SLASH = [
    '.N..........N.....',
    '..N........N......',
    '..N........N......',
    '...KKHHHHHKK......',
    '..KHHHHHHHHHK.....',
    '..KHHHHHHHHHK.....',
    '..KKKKKKKKKKK.....',
    '..KHRHHHHRHHK..KKK',
    '..KHHHHHHHHHK.KSSS',
    '...KHHHHHHHK.KSSK.',
    '...WKJJJJJJKWSSK..',
    '..WJjJGGGGJjCSK...',
    '..KCJJGYYGJJCK....',
    '...KJJGGGGJJK.....',
    '...KJjGGGGjJK.....',
    '...KJjJGGJjJK.....',
    '...KJjJGGJjJK.....',
    '...KJjJKKJjJK.....',
    '...KBBK..KBBK.....',
    '...KBBK..KBBK.....',
    '..KBBBK..KBBBK....',
    '..KKKKK..KKKKK....',
    '..................',
    '..................'
  ];
  const HERO_CAST = [
    '.N..........N.....',
    '..N........N......',
    '..N........N......',
    '...KKHHHHHKK......',
    '..KHHHHHHHHHK.....',
    '..KHHHHHHHHHK.....',
    '..KKKKKKKKKKK.....',
    '..KHRHHHHRHHK.....',
    '..KHHHHHHHHHK.RR..',
    '...KHHHHHHHK.RYYR.',
    '...WKJJJJJJKWRYYR.',
    '..WJjJGGGGJjCCRR..',
    '..KCJJGYYGJJCK....',
    '...KJJGGGGJJK.....',
    '...KJjGGGGjJK.....',
    '...KJjJGGJjJK.....',
    '...KJjJGGJjJK.....',
    '...KJjJKKJjJK.....',
    '...KBBK..KBBK.....',
    '...KBBK..KBBK.....',
    '..KBBBK..KBBBK....',
    '..KKKKK..KKKKK....',
    '..................',
    '..................'
  ];
  const HERO_SHOOT = [
    '.N..........N.....',
    '..N........N......',
    '..N........N......',
    '...KKHHHHHKK......',
    '..KHHHHHHHHHK.....',
    '..KHHHHHHHHHK.....',
    '..KKKKKKKKKKK.....',
    '..KHRHHHHRHHK.....',
    '..KHHHHHHHHHK.RRRR',
    '...KHHHHHHHK.RYYR.',
    '...WKJJJJJJKWGRR..',
    '..WJjJGGGGJjCGK...',
    '..KCJJGYYGJJCK....',
    '...KJJGGGGJJK.....',
    '...KJjGGGGjJK.....',
    '...KJjJGGJjJK.....',
    '...KJjJGGJjJK.....',
    '...KJjJKKJjJK.....',
    '...KBBK..KBBK.....',
    '...KBBK..KBBK.....',
    '..KBBBK..KBBBK....',
    '..KKKKK..KKKKK....',
    '..................',
    '..................'
  ];
  const HERO_HIT = [
    '.N..........N.....',
    '..N........N......',
    '..N........N......',
    '...KKGGGGGKK......',
    '..KGGGGGGGGGK.....',
    '..KGGGGGGGGGK.....',
    '..KKKKKKKKKKK.....',
    '..KGRGGGGRGGK.....',
    '..KGGGGGGGGGK.....',
    '...KGGGGGGGK......',
    '...WKGGGGGGKW.....',
    '..WGjGGGGGGjGW....',
    '..KCGGGYYGGGCK....',
    '...KGGGGGGGGK.....',
    '...KGjGGGGGjK.....',
    '...KGjGGGGGjK.....',
    '...KGjGGGGGjK.....',
    '...KGjGKKGjGK.....',
    '...KBBK..KBBK.....',
    '...KBBK..KBBK.....',
    '..KBBBK..KBBBK....',
    '..KKKKK..KKKKK....',
    '..................',
    '..................'
  ];

  /* ── dráče (parťák, 14×14) — mládě draka 🐉 ── */
  const PAL_COM = { K:'#0a0c12', S:'#c0392b', s:'#7e1d12', C:'#ffcf3a', Y:'#e8c24a', W:'#f4f0e0', R:'#ff5a4a' };
  const COMPANION = [[
    '..Y......Y....',
    '..YK....KY....',
    '...KSSSSSSK...',
    '..KSWRSSRWSK..',
    '..KSSSKKSSSK..',
    '.KsKSSYYSSKsK.',
    'KssKSSSSSSKssK',
    '.KsKSSSSSSKsK.',
    '..KSCCCCCCSK..',
    '..KSCCCCCCSK..',
    '...KSSSSSSK...',
    '...KKKKKK.Y...',
    '....KsK..YY...',
    '...KsK...Y....'
  ],[
    '..Y......Y....',
    '..YK....KY....',
    '...KSSSSSSK...',
    '..KSWRSSRWSK..',
    '..KSSSKKSSSK..',
    'KKsKSSYYSSKsKK',
    '.KsKSSSSSSKsK.',
    '..KSSSSSSSSK..',
    '..KSCCCCCCSK..',
    '..KSCCCCCCSK..',
    '...KSSSSSSK...',
    '...KKKKKK.Y...',
    '...KsK...YY...',
    '..KsK....Y....'
  ]];

  /* ── bossové: 7 oblastí, pirátská/mořská témata ── */
  const BOSS_PALS = {
    1:{A:'#e04040',a:'#902020',M:'#c83434',m:'#7a1c1c'},  // červený drak — ohnivě červený
    2:{A:'#ff8a2e',a:'#b85418',M:'#e87622',m:'#9c4a12'},  // ohnivá ještěrka — oranžová
    3:{A:'#c89040',a:'#8a601f',M:'#b07c2e',m:'#6e4c18'},  // kovářský golem — bronzový
    4:{A:'#a060d8',a:'#6638a0',M:'#8c4ec0',m:'#542a7a'},  // krystalový wyrm — fialový
    5:{A:'#ff7028',a:'#b84614',M:'#e85e1c',m:'#9c3c10'},  // lávová bestie — žhavě oranžová
    6:{A:'#4a92d8',a:'#2a5a9a',M:'#3a7cc0',m:'#234a72'},  // bouřkový drak — modrý
    7:{A:'#e0b038',a:'#9a7420',M:'#c8982e',m:'#6e5418'}   // dračí král — zlatý
  };
  const COMMON = { K:'#0a0c12', W:'#e8ecf5', R:'#ff3355' };

  const BOSS_SPRITES = {
    /* červený drak */
    1: [[
      '...K........K.....',
      '..KAK......KAK....',
      '..KAAK....KAAK....',
      '..KAAAKKKKAAAAK...',
      '.KAAAAAAAAAAAAAK..',
      '.KAAWWRAAARWWAAK..',
      '.KAAWKRAAARKWAAK..',
      '.KAAAAAAAAAAAAAK..',
      'KMAAAAAAAAAAAAAMK.',
      'KMAAAKKKKKKKKAAMK.',
      'KMAAKWKWKWKWKWAMK.',
      'KMAAKRRRRRRRRKAMK.',
      'KMAAKWKWKWKWKWAMK.',
      '.KMAAKKKKKKKKAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '..KMMAAAAAAAAMMK..',
      '...KKMAAAAAAMKK...',
      '..KM.KMAAAAMK.MK..',
      '..K...KMMMMK...K..',
      '......KK..KK......',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '...K........K.....',
      '..KAK......KAK....',
      '..KAAK....KAAK....',
      '..KAAAKKKKAAAAK...',
      '.KAAAAAAAAAAAAAK..',
      '.KAAWWRAAARWWAAK..',
      '.KAAWKRAAARKWAAK..',
      '.KAAAAAAAAAAAAAK..',
      'KMAAAAAAAAAAAAAMK.',
      'KMAAAKKKKKKKKAAMK.',
      'KMAAKWKWKWKWKWAMK.',
      'KMAAKRRRRRRRRKAMK.',
      'KMAAKWKWKWKWKWAMK.',
      '.KMAAKKKKKKKKAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '..KMMAAAAAAAAMMK..',
      '...KKMAAAAAAMKK...',
      '..KM.KMAAAAMK.MK..',
      '..K...KMMMMK...K..',
      '......KK..KK......',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* ohnivá ještěrka */
    2: [[
      '..................',
      '........RR........',
      '.......RWWR.......',
      '......RWAAWR......',
      '.....KKAAAAKK.....',
      '....KAAAAAAAAK....',
      '...KAAWWAAWWAAK...',
      '...KAAWKAAWKAAK...',
      '...KAAAAAAAAAAK...',
      '..KMAAAKKKKAAAMKK.',
      '..KMAAKWWWWKAAMAK.',
      '..KMAAAAAAAAAAMAK.',
      '.KMMAAAAAAAAAAMMAK',
      '.KMAAAAAAAAAAAMKAK',
      '.KMAAAAAAAAAAMMKK.',
      '..KMMAAAAAAMMMK...',
      '...KKMMAAMMKK.....',
      '.....KMAAMK..MK...',
      '....KMK.KMK.MAK...',
      '....KK...KK.KK....',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '........RR........',
      '.......RWWR.......',
      '......RWAAWR......',
      '.....KKAAAAKK.....',
      '....KAAAAAAAAK....',
      '...KAAWWAAWWAAK...',
      '...KAAWKAAWKAAK...',
      '...KAAAAAAAAAAK...',
      '..KMAAAKKKKAAAMKK.',
      '..KMAAKWWWWKAAMAK.',
      '..KMAAAAAAAAAAMAK.',
      '.KMMAAAAAAAAAAMMAK',
      '.KMAAAAAAAAAAAMKAK',
      '.KMAAAAAAAAAAMMKK.',
      '..KMMAAAAAAMMMK...',
      '...KKMMAAMMKK.....',
      '.....KMAAMK..MK...',
      '....KMK.KMK.MAK...',
      '....KK...KK.KK....',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* kovářský golem */
    3: [[
      '..................',
      '...KKKKKKKKKKKK...',
      '..KAAAAAAAAAAAAK..',
      '..KAMMAMMMMAMMAK..',
      '..KAMRRMAAMRRMAK..',
      '..KAMRRMAAMRRMAK..',
      '..KAMMMAAAMMMMAK..',
      '..KAAAAKKKKAAAAK..',
      '..KAAAKWWWWKAAAK..',
      '..KKKKKKKKKKKKKK..',
      'KKAAAAAAAAAAAAAAKK',
      'KMAAMMAAAAAAMMAAMK',
      'KMAAMMAAAAAAMMAAMK',
      'KMAAAAAAAAAAAAAAMK',
      'KMAAAAAAAAAAAAAAMK',
      'KKAAAAAAAAAAAAAAKK',
      '..KKKKAAAAAAKKKK..',
      '..KMMK.KAAK.KMMK..',
      '..KMMK.KAAK.KMMK..',
      '..KKKK.KKKK.KKKK..',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '...KKKKKKKKKKKK...',
      '..KAAAAAAAAAAAAK..',
      '..KAMMAMMMMAMMAK..',
      '..KAMRRMAAMRRMAK..',
      '..KAMRRMAAMRRMAK..',
      '..KAMMMAAAMMMMAK..',
      '..KAAAAKKKKAAAAK..',
      '..KAAAKWWWWKAAAK..',
      '..KKKKKKKKKKKKKK..',
      'KKAAAAAAAAAAAAAAKK',
      'KMAAMMAAAAAAMMAAMK',
      'KMAAMMAAAAAAMMAAMK',
      'KMAAAAAAAAAAAAAAMK',
      'KMAAAAAAAAAAAAAAMK',
      'KKAAAAAAAAAAAAAAKK',
      '..KKKKAAAAAAKKKK..',
      '..KMMK.KAAK.KMMK..',
      '..KMMK.KAAK.KMMK..',
      '..KKKK.KKKK.KKKK..',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* krystalový wyrm */
    4: [[
      '.......KK.........',
      '......KAAK....K...',
      '..K..KAAAAK..KAK..',
      '..KK.KAWWAK.KAAK..',
      '..KAKKAWWAKKKAAK..',
      '..KAAKAAAAKAAAAK..',
      '...KAAAAAAAAAAAK..',
      '...KAAAMMMMAAAAK..',
      '...KAAMWWWWMAAAK..',
      '..KAAAMWKKWMAAAAK.',
      '..KAAAMWWWWMAAAAK.',
      '..KAAAAMMMMAAAAAK.',
      '...KAAAAAAAAAAAKK.',
      '....KAAAAAAAAAKKA.',
      '.....KKAAAAAKK.KAK',
      '...K...KAAAK....KK',
      '..KAK..KAAAK......',
      '..KAAK.KAAAK......',
      '...KKKKKAAAKK.....',
      '......KKKKKK......',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '.......KK.........',
      '......KAAK....K...',
      '..K..KAAAAK..KAK..',
      '..KK.KAWWAK.KAAK..',
      '..KAKKAWWAKKKAAK..',
      '..KAAKAAAAKAAAAK..',
      '...KAAAAAAAAAAAK..',
      '...KAAAMMMMAAAAK..',
      '...KAAMWWWWMAAAK..',
      '..KAAAMWKKWMAAAAK.',
      '..KAAAMWWWWMAAAAK.',
      '..KAAAAMMMMAAAAAK.',
      '...KAAAAAAAAAAAKK.',
      '....KAAAAAAAAAKKA.',
      '.....KKAAAAAKK.KAK',
      '...K...KAAAK....KK',
      '..KAK..KAAAK......',
      '..KAAK.KAAAK......',
      '...KKKKKAAAKK.....',
      '......KKKKKK......',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* lávová bestie */
    5: [[
      '..................',
      '....R......R......',
      '...RWR....RWR.....',
      '..KKAKK..KKAKK....',
      '.KAAaAAKKAAaAAK...',
      'KAARRAAAAAARRAAK..',
      'KAAWWAAAAAAWWAAK..',
      'KAAAAAaaaaAAAAAK..',
      'KAARAAaRRaAAARAK..',
      'KAAARAAaaAAARAAAK.',
      'KAAAARRRRRRRAAAAK.',
      'KAARAAAAAAAAAARAK.',
      '.KAAAARRRRRRAAAK..',
      '.KAARAAAAAAAARAK..',
      '..KAAAARRRRAAAAK..',
      '..KAARAAAAAARAK...',
      '...KAAAARRAAAAK...',
      '...KAARAAAARAK....',
      '....KAAAAAAAK.....',
      '.....KKKKKKK......',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '....R......R......',
      '...RWR....RWR.....',
      '..KKAKK..KKAKK....',
      '.KAAaAAKKAAaAAK...',
      'KAARRAAAAAARRAAK..',
      'KAAWWAAAAAAWWAAK..',
      'KAAAAAaaaaAAAAAK..',
      'KAARAAaRRaAAARAK..',
      'KAAARAAaaAAARAAAK.',
      'KAAAARRRRRRRAAAAK.',
      'KAARAAAAAAAAAARAK.',
      '.KAAAARRRRRRAAAK..',
      '.KAARAAAAAAAARAK..',
      '..KAAAARRRRAAAAK..',
      '..KAARAAAAAARAK...',
      '...KAAAARRAAAAK...',
      '...KAARAAAARAK....',
      '....KAAAAAAAK.....',
      '.....KKKKKKK......',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* ledový drak */
    6: [[
      '..W..........W....',
      '.WKW........WKW...',
      '.WKAW......WAKW...',
      '..KAAKK..KKAAK....',
      '..KAAAKKKKAAAAK...',
      '.KAAAAAAAAAAAAAK..',
      '.KAAWWWAAWWWAAAK..',
      '.KAAWKWAAWKWAAAK..',
      '.KMAAAAAAAAAAAMK..',
      'KMAAAKKKKKKKKAAMK.',
      'KMAAKWKWKWKWKWAMK.',
      'KMAAAKKKKKKKKAAMK.',
      '.KMMAAAAAAAAAAMK..',
      '..KMMAAAAAAAAMMK..',
      '.W.KKMAAAAAAMKK.W.',
      'WKW.KMAAAAAAMK.WKW',
      '.W..KMAAAAAAMK..W.',
      '....KKMMMMMMKK....',
      '......KK..KK......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..W..........W....',
      '.WKW........WKW...',
      '.WKAW......WAKW...',
      '..KAAKK..KKAAK....',
      '..KAAAKKKKAAAAK...',
      '.KAAAAAAAAAAAAAK..',
      '.KAAWWWAAWWWAAAK..',
      '.KAAWKWAAWKWAAAK..',
      '.KMAAAAAAAAAAAMK..',
      'KMAAAKKKKKKKKAAMK.',
      'KMAAKWKWKWKWKWAMK.',
      'KMAAAKKKKKKKKAAMK.',
      '.KMMAAAAAAAAAAMK..',
      '..KMMAAAAAAAAMMK..',
      '.W.KKMAAAAAAMKK.W.',
      'WKW.KMAAAAAAMK.WKW',
      '.W..KMAAAAAAMK..W.',
      '....KKMMMMMMKK....',
      '......KK..KK......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* dračí král */
    7: [[
      '..K..K....K..K....',
      '.KAKKAK..KAKKAK...',
      '.KAAAAK..KAAAAK...',
      '..KAAAKKKKAAAK....',
      '...KWAWAAWAWK.....',
      '..KAAAAAAAAAAK....',
      '.KAAAKKKKKKAAAK...',
      '.KAAKWRWWRWKAAAK..',
      'KMAAKWKWWKWKAAAMK.',
      'KMAAAAAAAAAAAAAMK.',
      'KMAAAKKKKKKKKAAMK.',
      'KMAAKRRRRRRRRKAMK.',
      'KMAAAKWKWKWKKAAMK.',
      '.KMAAAAAAAAAAAMK..',
      '.KMMAAAWWWWAAAMMK.',
      '..KMMAAWWWWAAMMK..',
      '...KKMAAAAAAMKK...',
      '..KM.KMAAAAMK.MK..',
      '..K...KMMMMK...K..',
      '......KK..KK......',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..K..K....K..K....',
      '.KAKKAK..KAKKAK...',
      '.KAAAAK..KAAAAK...',
      '..KAAAKKKKAAAK....',
      '...KWAWAAWAWK.....',
      '..KAAAAAAAAAAK....',
      '.KAAAKKKKKKAAAK...',
      '.KAAKWRWWRWKAAAK..',
      'KMAAKWKWWKWKAAAMK.',
      'KMAAAAAAAAAAAAAMK.',
      'KMAAAKKKKKKKKAAMK.',
      'KMAAKRRRRRRRRKAMK.',
      'KMAAAKWKWKWKKAAMK.',
      '.KMAAAAAAAAAAAMK..',
      '.KMMAAAWWWWAAAMMK.',
      '..KMMAAWWWWAAMMK..',
      '...KKMAAAAAAMKK...',
      '..KM.KMAAAAMK.MK..',
      '..K...KMMMMK...K..',
      '......KK..KK......',
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

  // dračí pozadí (jeskyně/sopka + lávová záře + skály, per oblast)
  const G5_DRAGON = {
    1: { sky:'#3a2228', glow:'#6a2818', ground:'#3a2420', rock:'#52352c', lava:'#ff6a22', orb:'#ff8a40', orbH:'#ffd070', ember:true },
    2: { sky:'#4a2418', glow:'#a83a10', ground:'#3a2014', rock:'#5a3220', lava:'#ff7a18', orb:'#ff9020', orbH:'#ffe080', ember:true },
    3: { sky:'#3a2e1a', glow:'#7a5210', ground:'#352a18', rock:'#564224', lava:'#ffaa30', orb:'#ffc040', orbH:'#fff0a0', ember:true },
    4: { sky:'#2a1e3e', glow:'#5a2a8a', ground:'#241c34', rock:'#3a2e52', lava:'#b070e0', orb:'#c890f0', orbH:'#f0d8ff', ember:true },
    5: { sky:'#3e1e12', glow:'#d84410', ground:'#341810', rock:'#522a1c', lava:'#ff5a14', orb:'#ff7a20', orbH:'#ffd060', ember:true },
    6: { sky:'#1c2a44', glow:'#2a5a9a', ground:'#1a2436', rock:'#2e3e58', lava:'#4a92d8', orb:'#6ab0f0', orbH:'#d0ecff', ember:false },
    7: { sky:'#2a1416', glow:'#9a2818', ground:'#260f10', rock:'#42201e', lava:'#ff4422', orb:'#ffb030', orbH:'#fff0c0', ember:true }
  };
  function drawBackdrop(now) {
    const W = cv.width, H = cv.height, animOK = !rm();
    const den = G5_DRAGON[curArea] || G5_DRAGON[1];
    const rnd = srnd(curArea * 97 + 13);
    const groundH = Math.round(H * 0.26);
    const skyH = H - groundH;
    // obloha (temná jeskyně)
    ctx.fillStyle = den.sky;
    ctx.fillRect(0, 0, W, skyH);
    // lávová záře u dna oblohy
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = den.glow;
    ctx.fillRect(0, skyH - 30, W, 30);
    ctx.globalAlpha = 1;
    // dračí orb (sopečné slunce / měsíc)
    const scx = Math.round(W * 0.82), scy = 32, sr = 17;
    ctx.globalAlpha = 0.85; pxDisc(scx, scy, sr, 3, den.orb);
    ctx.globalAlpha = 0.5; pxDisc(scx - 5, scy - 5, Math.round(sr * 0.55), 3, den.orbH);
    ctx.globalAlpha = 1;
    // skály / stalagmity v pozadí (špičaté siluety)
    const nRock = 5;
    for (let i = 0; i < nRock; i++) {
      const rx = Math.round((i + 0.5) / nRock * W + (rnd() - 0.5) * 30);
      const rh = 34 + Math.round(rnd() * 34);
      const rw = 22 + Math.round(rnd() * 14);
      const baseY = skyH + 2;
      ctx.fillStyle = den.rock;
      // trojúhelníková skála (řádky se zužují nahoru)
      for (let yy = 0; yy < rh; yy++) {
        const t = yy / rh;
        const half = Math.round((rw / 2) * (1 - t));
        ctx.fillRect(rx - half, baseY - yy, half * 2, 1);
      }
    }
    // dno (skála)
    ctx.fillStyle = den.ground;
    ctx.fillRect(0, skyH, W, groundH);
    // lávové praskliny ve dně
    ctx.globalAlpha = animOK ? (0.55 + Math.sin(now / 400) * 0.2) : 0.55;
    ctx.fillStyle = den.lava;
    for (let i = 0; i < 6; i++) {
      const lx = rnd() * W;
      const lw = 14 + Math.round(rnd() * 28);
      ctx.fillRect(lx, skyH + 4 + Math.round(rnd() * (groundH - 8)), lw, 2);
    }
    ctx.globalAlpha = 1;
    // jiskry / popel stoupající vzhůru (animace)
    if (animOK && den.ember) {
      for (let i = 0; i < 8; i++) {
        const ex = ((rnd() * W) + Math.sin(now / 600 + i * 1.4) * 16) % W;
        const ey = skyH - ((now / 22 + i * 36) % (skyH - 10));
        const tw = (Math.sin(now / 180 + i * 2) + 1) / 2;
        ctx.globalAlpha = 0.3 + tw * 0.55;
        ctx.fillStyle = i % 3 ? '#ff8a30' : '#ffd060';
        ctx.fillRect(Math.round(ex), Math.round(ey), 3, 3);
      }
      ctx.globalAlpha = 1;
    } else if (animOK) {
      // sněhové/ledové vločky pro ledovou oblast (6)
      for (let i = 0; i < 6; i++) {
        const fx = ((rnd() * W) + Math.sin(now / 700 + i) * 20) % W;
        const fy = ((now / 26 + i * 50) % (skyH + 10));
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#cfe6ff';
        ctx.fillRect(Math.round(fx), Math.round(fy), 3, 3);
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
