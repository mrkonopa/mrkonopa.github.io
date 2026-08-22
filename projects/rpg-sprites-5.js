/* ════════════════════════════════════════════════════════════════════
   rpg-sprites-5.js — svět 5. ročníku pro rpg-sprite-core
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
  // Hrdina — mladý pirát v námořnické vestě
  /* ══ paleta ══
     Ramp 1–3 jsou tokeny --g5-ramp1..3 z fáze 00 beze změny.
     RAMP 4 JE ZMĚNĚNÝ — dvakrát, a druhá změna je ta podstatná:
       token --g5-ramp4 #ad6252 dává proti aréně #233856 kontrast 2,62,
       jediná hodnota sedmiletky pod prahem 3,0 ⇒ musí se zesvětlit.
       První pokus #d08b74 prošel (4,31), ale H 15° / S 0,49 / L 0,64 je
       tělový odstín a ramp 4 zabírá 36 % pixelů spritu ⇒ rytina četla jako
       nahé tělo, ať měla jakýkoli tvar.
       Platí #e25132: H 11° (jako token), S 0,75, L 0,54, kontrast 3,08 —
       zesvětleno do SYTOSTI, ne do jasu, takže to čte jako zbroj.
     Tuhle jednu hodnotu přepiš i v tokens.css a v rpg-hero-portraits.js,
     jinak se rozšlape vazba portrét ↔ sprite.
     Akcentová dvojice je u 1. stupně o KROK SVĚTLEJI než u 2. stupně:
       A = --g5-rim (#ff9a86), a = --g5-accent (#e0584a)
     A zůstává beze změny: je to 7 % pixelů (hřeben, emblem, opasek), tedy
     světlé hrany na zbroji, ne plocha — tělový dojem nedrželo ono.
     Znak 'e' = --g5-light (průzor přilby). Znak 'O' = rim light —
     v paletě NENÍ, barvu dodává jádro z neonu oblasti. */
  const PAL_HERO = {
    K: '#05070c',
    1: '#2b1013', 2: '#4d1f22', 3: '#743430', 4: '#e25132',
    A: '#ff9a86', a: '#e0584a', e: '#ffd9d3',
    W: '#eef4ff', w: '#93a1bd',
    Y: '#f4d03f', y: '#9a7a12',
    G: '#3d465e', g: '#8b98b5'
  };

  /* Přepisují jen ramp 2–4 a akcent; K, e, W/w, Y/y, G/g zůstávají, takže
     žádný znak nezůstane nedefinovaný. ID stejná — obchod je prodává.
     Tabulka je shodná se 2. stupněm (sdílená kosmetika v peněžence). */
  const HERO_SKINS = {
    'skin-gold': { 2: '#4a3a0e', 3: '#8a6a12', 4: '#caa12a', A: '#fff0b0', a: '#c9a227' },
    'skin-red': { 2: '#3d0d14', 3: '#7a1a26', 4: '#c23a48', A: '#ff6b6b', a: '#a02020' },
    'skin-emerald': { 2: '#0a3323', 3: '#0f6b45', 4: '#2aa877', A: '#39ff9e', a: '#1a8a5a' },
    'skin-ghost': { 2: '#1d1733', 3: '#3a2d63', 4: '#6a55a8', A: '#c08aff', a: '#7a4fd0' },
    'skin-stealth': { 2: '#14161c', 3: '#262a33', 4: '#4a515e', A: '#9fb0c8', a: '#5a6a85' }
  };

  /* ══ hrdina — 20 × 29, 28 pokreslených řádků (spodní je rezerva pro stín) ══
     Sloupce 0–15 tělo, 16–19 rekvizita (šupinový štít).
     Řádky 13 a 14, sloupce 14–15 jsou PŘEDLOKTÍ, které rekvizitu drží —
     bez něj se vznáší vedle těla. Drží se v jednom bodě, ne po celé délce. */
  const IDLE0 = [
    '.....A.A.A..........',
    '....KAKAKAK.........',
    '....K4443K..........',
    '...K444443K.........',
    '...K4KKK43K.........',
    '...K444443K.........',
    '.....K11K...........',
    '..KAA44444AAK.......',
    '...O44444443K.......',
    '...O4AAAA443K.......',
    '...O44444443K.......',
    '...O44444443K....KK.',
    '...O44YY4443K...KAAK',
    '...O444444443KGGKAYK',
    '...O444444443KGGKAYK',
    '...O44444443K...KAAK',
    '..O4YYYYYY443K...KK.',
    '..O4111111443K......',
    '..K4444444443K......',
    '.K43K......K43K.....',
    '.K43K......K43K.....',
    'K443K......K443K....',
    'K443K......K443K....',
    'K443K......K443K....',
    'KGGGK......KGGGK....',
    'KGgGK......KGgGK....',
    'KGGGK......KGGGK....',
    'KKKKK......KKKKK....',
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
    paste(out, 14, 14, '..');   // předloktí je u pětky dva řádky vysoké
    return out;
  }

  /* Dech vypouští ZDVOJENÝ řádek 14 (je shodný s 13 včetně sloupců štítu)
     a zbytek posune o pixel níž. Nohy zůstávají na místě ⇒ nejnižší
     pokreslený řádek je u OBOU snímků 27, chodidla neposkakují a kontaktní
     stín se neodlepí. */
  const IDLE1 = ['.'.repeat(W)].concat(IDLE0.slice(0, 14)).concat(IDLE0.slice(15));

  const WINDUP = stripProp(IDLE0.slice());
  paste(WINDUP, 0, 13, 'KWWWWWK'); paste(WINDUP, 1, 14, 'KwWWWK'); paste(WINDUP, 2, 16, 'KYYK');

  const SLASH = stripProp(IDLE0.slice());
  paste(SLASH, 12, 13, 'KWWWWWK'); paste(SLASH, 13, 13, 'KwWWWwK');

  /* Kouzlo u 1. stupně startuje NÍŽ (řádky 4–7) — nad tím je hřeben přilby
     a jiskry by se v jeho zubech ztratily. */
  const CAST = IDLE0.slice();
  paste(CAST, 4, 0, 'AA'); paste(CAST, 5, 0, 'AAA'); paste(CAST, 6, 0, 'aAa'); paste(CAST, 7, 0, '.A.');

  const SHOOT = stripProp(IDLE0.slice());
  paste(SHOOT, 13, 13, 'KGGWWA'); paste(SHOOT, 14, 13, 'KKK');

  const HIT = IDLE0.map(r => r.replace(/A/g, 'a').replace(/O/g, 'K'));

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

  function pxDisc(g, cx, cy, r, step, color) {
    g.fillStyle = color;
    const rr = r * r;
    for (let y = -r; y <= r; y += step)
      for (let x = -r; x <= r; x += step)
        if (x * x + y * y <= rr) g.fillRect(Math.round(cx + x), Math.round(cy + y), step, step);
  }

  const G5_DRAGON = {
    1: { sky:'#3a2228', glow:'#6a2818', ground:'#3a2420', rock:'#52352c', lava:'#ff6a22', orb:'#ff8a40', orbH:'#ffd070', ember:true },
    2: { sky:'#4a2418', glow:'#a83a10', ground:'#3a2014', rock:'#5a3220', lava:'#ff7a18', orb:'#ff9020', orbH:'#ffe080', ember:true },
    3: { sky:'#3a2e1a', glow:'#7a5210', ground:'#352a18', rock:'#564224', lava:'#ffaa30', orb:'#ffc040', orbH:'#fff0a0', ember:true },
    4: { sky:'#2a1e3e', glow:'#5a2a8a', ground:'#241c34', rock:'#3a2e52', lava:'#b070e0', orb:'#c890f0', orbH:'#f0d8ff', ember:true },
    5: { sky:'#3e1e12', glow:'#d84410', ground:'#341810', rock:'#522a1c', lava:'#ff5a14', orb:'#ff7a20', orbH:'#ffd060', ember:true },
    6: { sky:'#1c2a44', glow:'#2a5a9a', ground:'#1a2436', rock:'#2e3e58', lava:'#4a92d8', orb:'#6ab0f0', orbH:'#d0ecff', ember:false },
    7: { sky:'#2a1416', glow:'#9a2818', ground:'#260f10', rock:'#42201e', lava:'#ff4422', orb:'#ffb030', orbH:'#fff0c0', ember:true }
  };
  function paintSky(g, env, animOK) {
    const W = env.w, H = env.h, now = env.now;
    const den = G5_DRAGON[env.area] || G5_DRAGON[1];
    const rnd = env.rnd;
    const groundH = Math.round(H * 0.26);
    const skyH = H - groundH;
    // obloha (temná jeskyně)
    g.fillStyle = den.sky;
    g.fillRect(0, 0, W, skyH);
    // lávová záře u dna oblohy
    g.globalAlpha = 0.4;
    g.fillStyle = den.glow;
    g.fillRect(0, skyH - 30, W, 30);
    g.globalAlpha = 1;
    // dračí orb (sopečné slunce / měsíc)
    const scx = Math.round(W * 0.82), scy = 32, sr = 17;
    g.globalAlpha = 0.85; pxDisc(g, scx, scy, sr, 3, den.orb);
    g.globalAlpha = 0.5; pxDisc(g, scx - 5, scy - 5, Math.round(sr * 0.55), 3, den.orbH);
    g.globalAlpha = 1;
    // skály / stalagmity v pozadí (špičaté siluety)
    const nRock = 5;
    for (let i = 0; i < nRock; i++) {
      const rx = Math.round((i + 0.5) / nRock * W + (rnd() - 0.5) * 30);
      const rh = 34 + Math.round(rnd() * 34);
      const rw = 22 + Math.round(rnd() * 14);
      const baseY = skyH + 2;
      g.fillStyle = den.rock;
      // trojúhelníková skála (řádky se zužují nahoru)
      for (let yy = 0; yy < rh; yy++) {
        const t = yy / rh;
        const half = Math.round((rw / 2) * (1 - t));
        g.fillRect(rx - half, baseY - yy, half * 2, 1);
      }
    }
    // dno (skála)
    g.fillStyle = den.ground;
    g.fillRect(0, skyH, W, groundH);
    // lávové praskliny ve dně
    g.globalAlpha = animOK ? (0.55 + Math.sin(now / 400) * 0.2) : 0.55;
    g.fillStyle = den.lava;
    for (let i = 0; i < 6; i++) {
      const lx = rnd() * W;
      const lw = 14 + Math.round(rnd() * 28);
      g.fillRect(lx, skyH + 4 + Math.round(rnd() * (groundH - 8)), lw, 2);
    }
    g.globalAlpha = 1;
    // jiskry / popel stoupající vzhůru (animace)
    if (animOK && den.ember) {
      for (let i = 0; i < 8; i++) {
        const ex = ((rnd() * W) + Math.sin(now / 600 + i * 1.4) * 16) % W;
        const ey = skyH - ((now / 22 + i * 36) % (skyH - 10));
        const tw = (Math.sin(now / 180 + i * 2) + 1) / 2;
        g.globalAlpha = 0.3 + tw * 0.55;
        g.fillStyle = i % 3 ? '#ff8a30' : '#ffd060';
        g.fillRect(Math.round(ex), Math.round(ey), 3, 3);
      }
      g.globalAlpha = 1;
    } else if (animOK) {
      // sněhové/ledové vločky pro ledovou oblast (6)
      for (let i = 0; i < 6; i++) {
        const fx = ((rnd() * W) + Math.sin(now / 700 + i) * 20) % W;
        const fy = ((now / 26 + i * 50) % (skyH + 10));
        g.globalAlpha = 0.5;
        g.fillStyle = '#cfe6ff';
        g.fillRect(Math.round(fx), Math.round(fy), 3, 3);
      }
      g.globalAlpha = 1;
    }
  }

  const backdrop = {
    horizon: 0.46,
    seed: a => a * 97 + 13,   // PŮVODNÍ seed — jinak se rozložení posune
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
    1: { neon: '#e04040' },
    2: { neon: '#ff8a2e' },
    3: { neon: '#c89040' },
    4: { neon: '#a060d8' },
    5: { neon: '#ff7028' },
    6: { neon: '#4a92d8' },
    7: { neon: '#e0b038' },
  };

  const WORLD5 = {
    id: 5,
    /* bossPad 14: starý engine měl bosse na pevných 186 px. */
    arena: { h: 200, groundPad: 14, bossPad: 14, heroX: 0.12, bossX: 0.58 },
    hero: {
      cols: 20, rows: 29, legacyRows: 24,   // legacyRows = kotva drawHeroOn
      scale: 5, pal: PAL_HERO, skins: HERO_SKINS,
      grids: { idle: [IDLE0, IDLE1], windup: WINDUP, slash: SLASH,
               cast: CAST, shoot: SHOOT, hit: HIT }
    },
    /* dx 96 = staré hp.x + 18*SCALE + 6; výchozí (18−2)*5+6 = 86 by parťáka
       posunulo o 10 px doleva.  `jet` = jiskřičky pod parťákem — bez nich
       se parťák kreslí, ale efekt tiše zmizí, a pod reduced-motion se to
       NEPOZNÁ, protože se stejně nekreslí. */
    ally: { scale: 4, dy: 34, pal: PAL_COM, grids: COMPANION,
            bob: 5, jet: { hot: '#ffd040', cold: '#cc2222', at: [[5, 10]] } },
    /* 5, NE 7 — všech 7 bossů má 24 řádků, starý engine je kreslil
       měřítkem 5 a BSCALE = 7 je mrtvá konstanta. NEOPRAVOVAT. */
    bosses: { scale: 5, pals: BOSS_PALS, common: COMMON, grids: BOSS_SPRITES },
    areas: AREAS,
    backdrop: backdrop
  };

  window.RPGSpriteWorld5 = WORLD5;
  if (window.RPGSpriteCore) window.RPGSprites5 = window.RPGSpriteCore.create(WORLD5);
})();
