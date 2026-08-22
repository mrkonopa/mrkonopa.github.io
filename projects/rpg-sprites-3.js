/* ════════════════════════════════════════════════════════════════════
   rpg-sprites-3.js — svět 3. ročníku pro rpg-sprite-core
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
  // Hrdina — lesní průzkumník v zelené kápi (J=zelená tunika, G=hnědý opasek, Y=zlatá spona)
  /* ══ paleta ══
     Ramp 1–4 jsou tokeny --g3-ramp1..4 z fáze 00 beze změny.
     Akcentová dvojice je u 1. stupně o KROK SVĚTLEJI než u 2. stupně:
       A = --g3-rim (#a9f08a), a = --g3-accent (#6fc24a)
     (2. stupeň má A = accent, a = dark — proti #233856 by to u mladších
     dětí bylo zbytečně na hraně, viz README, sekce Kontrast.)
     Znak 'e' = --g3-light (v IDLE0 se nepoužívá — tvář je
     ramp 4 s tmavýma očima; 'e' drží paletu úplnou pro skiny a pózy). Znak 'O' = rim light — v paletě NENÍ,
     barvu dodává jádro z neonu oblasti. */
  const PAL_HERO = {
    K: '#05070c',
    1: '#10240f', 2: '#1e4520', 3: '#2f6b33', 4: '#5da85c',
    A: '#a9f08a', a: '#6fc24a', e: '#d8ffcf',
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
     Sloupce 0–15 tělo, 16–19 rekvizita (listová hůlka, tyč sahá k rameni).
     Řádek 13, sloupce 14–15 je PŘEDLOKTÍ, které rekvizitu drží —
     bez něj se vznáší vedle těla. Drží se v jednom bodě, ne po celé délce. */
  const IDLE0 = [
    '..........KAK.......',
    '.........KaAK.......',
    '........K4aK........',
    '.......K43K.........',
    '......K443K.........',
    '.....K4443K.........',
    '....K44443K.........',
    '....K444432K........',
    '....O444444K........',
    '....O4K44K4K.....A..',
    '.....K4444K.....AaA.',
    '.....K1111K......A..',
    '...KAA4443AAK...KyK.',
    '....O44444432KGGKyK.',
    '....O4444432K...KyK.',
    '....O4YYYY43K...KyK.',
    '....O4444432K...KyK.',
    '....O4444432K...KyK.',
    '....O4444432K...KyK.',
    '...O443A44443K..KyK.',
    '...K444444432K..KyK.',
    '...K.4K.4K.4K...KyK.',
    '.....K4K.K4K........',
    '.....K4K.K4K........',
    '.....K4K.K4K........',
    '....KGGK.KGGK.......',
    '....KGgK.KGgK.......',
    '....KKKK.KKKK.......',
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

  /* Dech vypouští ZDVOJENÝ řádek 18 (je shodný s 17 včetně sloupců hůlky)
     a zbytek posune o pixel níž. Nohy zůstávají na místě ⇒ nejnižší
     pokreslený řádek je u OBOU snímků 27, chodidla neposkakují a kontaktní
     stín se neodlepí. */
  const IDLE1 = ['.'.repeat(W)].concat(IDLE0.slice(0, 18)).concat(IDLE0.slice(19));

  const WINDUP = stripProp(IDLE0.slice());
  paste(WINDUP, 2, 12, 'KWWWWWK'); paste(WINDUP, 3, 13, 'KwWWWK'); paste(WINDUP, 4, 15, 'KYYK');

  const SLASH = stripProp(IDLE0.slice());
  paste(SLASH, 12, 13, 'KWWWWWK'); paste(SLASH, 13, 13, 'KwWWWwK');

  const CAST = IDLE0.slice();
  paste(CAST, 1, 0, 'AA'); paste(CAST, 2, 0, 'AAA'); paste(CAST, 3, 0, 'aAa'); paste(CAST, 4, 0, '.A.');

  const SHOOT = stripProp(IDLE0.slice());
  paste(SHOOT, 13, 13, 'KGGWWA'); paste(SHOOT, 14, 13, 'KKK');

  const HIT = IDLE0.map(r => r.replace(/A/g, 'a').replace(/O/g, 'K'));

  const PAL_COM = { K:'#0a0c12', S:'#8a5a2e', s:'#5e3f18', C:'#e8c878', Y:'#ffb030', W:'#f4f0e0' };
  const COMPANION = [[
    '..K......K....',
    '..KSK..KSK....',
    '...KSSSSSSK...',
    '..KSSSSSSSSK..',
    '..KWWKSSKWWK..',
    '..KWKKSSKKWK..',
    '..KSSKYYKSSK..',
    '..KSCCCCCCSK..',
    '..KSCCCCCCSK..',
    '..KSSCCCCSSK..',
    '..KSSSSSSSSK..',
    '...KsKKKKsK...',
    '...KK....KK...',
    '..............'
  ],[
    '..K......K....',
    '..KSK..KSK....',
    '...KSSSSSSK...',
    '..KSSSSSSSSK..',
    '..KWWKSSKWWK..',
    '..KWKKSSKKWK..',
    '..KSSKYYKSSK..',
    '.KSSCCCCCCSSK.',
    '.KSSCCCCCCSSK.',
    '..KSSCCCCSSK..',
    '..KSSSSSSSSK..',
    '...KsKKKKsK...',
    '...KK....KK...',
    '..............'
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
    /* zelený brouk strážce */
    1: [[
      '...K..........K...',
      '....K........K....',
      '....KK......KK....',
      '.....KAAAAAAK.....',
      '....KAAWWWWAAK....',
      '....KAWKWWKWAK....',
      '....KAAWWWWAAK....',
      '...KKAAAAAAAAKK...',
      '..KMAAAAAAAAAAMK..',
      '.KMMAAAAAAAAAAMMK.',
      '.KMAAAAKKKKAAAAMK.',
      '.KMAAAAKKKKAAAAMK.',
      '.KMAAAAKKKKAAAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '..KMMAAAAAAAAMMK..',
      '...KKMMMMMMMMKK...',
      '..KK.K.K..K.K.KK..',
      '..K..K.K..K.K..K..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '...K..........K...',
      '....K........K....',
      '....KK......KK....',
      '.....KAAAAAAK.....',
      '....KAAWWWWAAK....',
      '....KAWKWWKWAK....',
      '....KAAWWWWAAK....',
      '...KKAAAAAAAAKK...',
      '..KMAAAAAAAAAAMK..',
      '.KMMAAAAAAAAAAMMK.',
      '.KMAAAAKKKKAAAAMK.',
      '.KMAAAAKKKKAAAAMK.',
      '.KMAAAAKKKKAAAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '..KMMAAAAAAAAMMK..',
      '...KKMMMMMMMMKK...',
      '..KK.K.K..K.K.KK..',
      '..K..K.K..K.K..K..',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* muchomůrka */
    2: [[
      '..................',
      '....KKKKKKKKKK....',
      '..KKAAAAAAAAAAKK..',
      '.KAAAWWAAAAWWAAAK.',
      'KAAWWWWAAAAAWWWAAK',
      'KAAAAAAAAWWAAAAAAK',
      'KAAWWAAAAAAAAWWAAK',
      'KAAAAAAAWWAAAAAAAK',
      '.KAAAAAAAAAAAAAAK.',
      '..KKKKKKKKKKKKKK..',
      '....KMMMMMMMMK....',
      '....KMWKMMKWMK....',
      '....KMMMMMMMMK....',
      '....KMMWWWWMMK....',
      '....KMMMMMMMMK....',
      '....KMMMMMMMMK....',
      '...KMMMMMMMMMMK...',
      '...KMMMMMMMMMMK...',
      '..KKMMMMMMMMMMKK..',
      '..KMMMMMMMMMMMMK..',
      '..KKKKKKKKKKKKKK..',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '....KKKKKKKKKK....',
      '..KKAAAAAAAAAAKK..',
      '.KAAAWWAAAAWWAAAK.',
      'KAAWWWWAAAAAWWWAAK',
      'KAAAAAAAAWWAAAAAAK',
      'KAAWWAAAAAAAAWWAAK',
      'KAAAAAAAWWAAAAAAAK',
      '.KAAAAAAAAAAAAAAK.',
      '..KKKKKKKKKKKKKK..',
      '....KMMMMMMMMK....',
      '....KMWKMMKWMK....',
      '....KMMMMMMMMK....',
      '....KMMWWWWMMK....',
      '....KMMMMMMMMK....',
      '....KMMMMMMMMK....',
      '...KMMMMMMMMMMK...',
      '...KMMMMMMMMMMK...',
      '..KKMMMMMMMMMMKK..',
      '..KMMMMMMMMMMMMK..',
      '..KKKKKKKKKKKKKK..',
      '..................',
      '..................',
      '..................'
    ]],
    /* lstivá liška */
    3: [[
      '..................',
      '..K..........K....',
      '..KAK........KAK..',
      '..KAAK......KAAK..',
      '..KAMAK....KAMAK..',
      '..KAAAKKKKKAAAAK..',
      '..KAAAAAAAAAAAAK..',
      '.KAAAAAAAAAAAAAAK.',
      '.KAAWWKAAAAKWWAAK.',
      '.KAAWKKAAAAKKWAAK.',
      '.KAAAAAAAAAAAAAAK.',
      '.KAAAAAMMMMAAAAAK.',
      '.KAAAAMWWWWMAAAAK.',
      '..KAAAMWKKWMAAAK..',
      '..KAAAAMMMMAAAAK..',
      '...KAAAAAAAAAAK...',
      '....KKAAAAAAKK....',
      '......KAAAAK......',
      '......KK..KK......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '..K..........K....',
      '..KAK........KAK..',
      '..KAAK......KAAK..',
      '..KAMAK....KAMAK..',
      '..KAAAKKKKKAAAAK..',
      '..KAAAAAAAAAAAAK..',
      '.KAAAAAAAAAAAAAAK.',
      '.KAAWWKAAAAKWWAAK.',
      '.KAAWKKAAAAKKWAAK.',
      '.KAAAAAAAAAAAAAAK.',
      '.KAAAAAMMMMAAAAAK.',
      '.KAAAAMWWWWMAAAAK.',
      '..KAAAMWKKWMAAAK..',
      '..KAAAAMMMMAAAAK..',
      '...KAAAAAAAAAAK...',
      '....KKAAAAAAKK....',
      '......KAAAAK......',
      '......KK..KK......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* jezevec */
    4: [[
      '..................',
      '...KK......KK.....',
      '..KAAK....KAAK....',
      '..KAAKKKKKKAAK....',
      '.KAAAAAAAAAAAAK...',
      '.KAWWWAKKAWWWAK...',
      'KWWWWWAKKAWWWWWK..',
      'KWWKWWAKKAWWKWWK..',
      'KWWWWWAAAAWWWWWK..',
      'KWWWWWAAAAWWWWWK..',
      '.KAAKWWKKWWKAAK...',
      '.KAAAAKKKKAAAAK...',
      '.KAAAAAAAAAAAAK...',
      '..KAAAAAAAAAAK....',
      '..KMAAAAAAAAMK....',
      '..KMMAAAAAAMMK....',
      '..KMMMAAAAMMMK....',
      '...KKMMMMMMKK.....',
      '...K.K....K.K.....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '...KK......KK.....',
      '..KAAK....KAAK....',
      '..KAAKKKKKKAAK....',
      '.KAAAAAAAAAAAAK...',
      '.KAWWWAKKAWWWAK...',
      'KWWWWWAKKAWWWWWK..',
      'KWWKWWAKKAWWKWWK..',
      'KWWWWWAAAAWWWWWK..',
      'KWWWWWAAAAWWWWWK..',
      '.KAAKWWKKWWKAAK...',
      '.KAAAAKKKKAAAAK...',
      '.KAAAAAAAAAAAAK...',
      '..KAAAAAAAAAAK....',
      '..KMAAAAAAAAMK....',
      '..KMMAAAAAAMMK....',
      '..KMMMAAAAMMMK....',
      '...KKMMMMMMKK.....',
      '...K.K....K.K.....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* lesní ent (duch) */
    5: [[
      '....K....K...K....',
      '..K.KAK.KAK.KAK...',
      '..KAKAAKKAAKKAK...',
      '...KAAAAAAAAAAK...',
      '..KMAAAAAAAAAAMK..',
      '.KMAAAAAAAAAAAAMK.',
      '.KMAAWWAAAAWWAAMK.',
      '.KMAAWKAAAAKWAAMK.',
      '.KMAAAAAKKAAAAAMK.',
      '.KMAAAAKRRKAAAAMK.',
      '.KMAAAAAKKAAAAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '..KMAAAmmmmAAAMK..',
      '..KMAAAmKKmAAAMK..',
      '..KMAAAmKKmAAAMK..',
      '..KMAAAmKKmAAAMK..',
      '..KMMAAmKKmAAMMK..',
      '.KMK.KmmKKmmK.KMK.',
      '.KK..KK..KK..KK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '....K....K...K....',
      '..K.KAK.KAK.KAK...',
      '..KAKAAKKAAKKAK...',
      '...KAAAAAAAAAAK...',
      '..KMAAAAAAAAAAMK..',
      '.KMAAAAAAAAAAAAMK.',
      '.KMAAWWAAAAWWAAMK.',
      '.KMAAWKAAAAKWAAMK.',
      '.KMAAAAAKKAAAAAMK.',
      '.KMAAAAKRRKAAAAMK.',
      '.KMAAAAAKKAAAAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '..KMAAAmmmmAAAMK..',
      '..KMAAAmKKmAAAMK..',
      '..KMAAAmKKmAAAMK..',
      '..KMAAAmKKmAAAMK..',
      '..KMMAAmKKmAAMMK..',
      '.KMK.KmmKKmmK.KMK.',
      '.KK..KK..KK..KK...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* sova strážkyně */
    6: [[
      '..K...........K...',
      '..KAK........KAK..',
      '..KAAK......KAAK..',
      '...KAAAAAAAAAAK...',
      '..KAAAAAAAAAAAAK..',
      '.KAAWWWWAAWWWWAAK.',
      '.KAWWKKWAAWKKWWAK.',
      '.KAWWKKWMMWKKWWAK.',
      '.KAWWWWMMMMWWWWAK.',
      '.KAAAAAMMMMAAAAAK.',
      '.KAAAAAAMMAAAAAAK.',
      '.KMAAAAAAAAAAAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '..KMMAAAAAAAAMMK..',
      '..KMMMAAAAAAMMMK..',
      '...KMMMAAAAMMMK...',
      '....KMMMMMMMMK....',
      '.....KKMMMMKK.....',
      '......K....K......',
      '.....KMK..KMK.....',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..K...........K...',
      '..KAK........KAK..',
      '..KAAK......KAAK..',
      '...KAAAAAAAAAAK...',
      '..KAAAAAAAAAAAAK..',
      '.KAAWWWWAAWWWWAAK.',
      '.KAWWKKWAAWKKWWAK.',
      '.KAWWKKWMMWKKWWAK.',
      '.KAWWWWMMMMWWWWAK.',
      '.KAAAAAMMMMAAAAAK.',
      '.KAAAAAAMMAAAAAAK.',
      '.KMAAAAAAAAAAAAMK.',
      '.KMMAAAAAAAAAAMMK.',
      '..KMMAAAAAAAAMMK..',
      '..KMMMAAAAAAMMMK..',
      '...KMMMAAAAMMMK...',
      '....KMMMMMMMMK....',
      '.....KKMMMMKK.....',
      '......K....K......',
      '.....KMK..KMK.....',
      '..................',
      '..................',
      '..................',
      '..................'
    ]],
    /* šedý vlk */
    7: [[
      '..................',
      '..KK........KK....',
      '.KAAK......KAAK...',
      '.KAaAK....KAaAK...',
      '.KAAAKKKKKKAAAK...',
      '.KAAAAAAAAAAAAAK..',
      'KAAAAAAAAAAAAAAAK.',
      'KAAWWKAAAAAAKWWAK.',
      'KAAWKKAAAAAAKKWAK.',
      'KAAAAAAAKKAAAAAAK.',
      'KAAAAAAKRRKAAAAAK.',
      'KMAAAAAAKKAAAAAMK.',
      'KMAAWWWWWWWWWWAMK.',
      'KMAAWKWKWKWKWKWMK.',
      '.KMAAAAAAAAAAAAMK.',
      '.KMMAAAAAAAAAAMK..',
      '..KMMMAAAAAAMMK...',
      '...KKMMMMMMMKK....',
      '....K.K..K.K......',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................'
    ],[
      '..................',
      '..KK........KK....',
      '.KAAK......KAAK...',
      '.KAaAK....KAaAK...',
      '.KAAAKKKKKKAAAK...',
      '.KAAAAAAAAAAAAAK..',
      'KAAAAAAAAAAAAAAAK.',
      'KAAWWKAAAAAAKWWAK.',
      'KAAWKKAAAAAAKKWAK.',
      'KAAAAAAAKKAAAAAAK.',
      'KAAAAAAKRRKAAAAAK.',
      'KMAAAAAAKKAAAAAMK.',
      'KMAAWWWWWWWWWWAMK.',
      'KMAAWKWKWKWKWKWMK.',
      '.KMAAAAAAAAAAAAMK.',
      '.KMMAAAAAAAAAAMK..',
      '..KMMMAAAAAAMMK...',
      '...KKMMMMMMMKK....',
      '....K.K..K.K......',
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

  const G3_WOOD = {
    1: { sky:'#bfe8ff', ground:'#4f9a35', grass:'#6fc24a', trunk:'#7a5230', leaf:'#3f8f3a', leaf2:'#5aaa45', sun:'#ffe060', sunH:'#fff5b0', firefly:false },
    2: { sky:'#a8dcf0', ground:'#45872f', grass:'#5fb040', trunk:'#6e4a2a', leaf:'#357a32', leaf2:'#4f9a3e', sun:'#ffd84a', sunH:'#fff0a0', firefly:false },
    3: { sky:'#ffd9a0', ground:'#8a6a2a', grass:'#b58a30', trunk:'#7a4a22', leaf:'#d07a22', leaf2:'#e8a030', sun:'#ff9c3a', sunH:'#ffd070', firefly:false },
    4: { sky:'#a0d8e8', ground:'#4a8a3a', grass:'#62ad48', trunk:'#6a4626', leaf:'#367a34', leaf2:'#509a42', sun:'#ffe060', sunH:'#fff5b0', firefly:false },
    5: { sky:'#88c0a0', ground:'#356a2a', grass:'#4a8a38', trunk:'#5a3e22', leaf:'#2a6a2e', leaf2:'#3f8a38', sun:'#e8f0c0', sunH:'#f8ffe0', firefly:true },
    6: { sky:'#9a86c0', ground:'#3a3258', grass:'#4e447a', trunk:'#4a3a2a', leaf:'#3a4a6a', leaf2:'#52608a', sun:'#ffe8a0', sunH:'#fff8d8', firefly:true },
    7: { sky:'#2a2c44', ground:'#1c2238', grass:'#2a3450', trunk:'#3a3242', leaf:'#28304a', leaf2:'#3a4664', sun:'#dfe6f5', sunH:'#ffffff', firefly:true }
  };
  function paintSky(g, env, animOK) {
    const W = env.w, H = env.h, now = env.now;
    const wood = G3_WOOD[env.area] || G3_WOOD[1];
    const rnd = env.rnd;
    const groundH = Math.round(H * 0.30);
    const skyH = H - groundH;
    // obloha
    g.fillStyle = wood.sky;
    g.fillRect(0, 0, W, skyH);
    // slunce / měsíc
    const scx = Math.round(W * 0.82), scy = 34, sr = 18;
    g.globalAlpha = 0.85; pxDisc(g, scx, scy, sr, 3, wood.sun);
    g.globalAlpha = 0.5; pxDisc(g, scx - 5, scy - 5, Math.round(sr * 0.55), 3, wood.sunH);
    g.globalAlpha = 1;
    // stromy v pozadí (koruny + kmeny) — deterministicky
    const nTrees = 5;
    for (let i = 0; i < nTrees; i++) {
      const tx = Math.round((i + 0.5) / nTrees * W + (rnd() - 0.5) * 30);
      const th = 40 + Math.round(rnd() * 26);
      const baseY = skyH + 4;
      const trunkW = 8 + Math.round(rnd() * 4);
      // kmen
      g.fillStyle = wood.trunk;
      g.fillRect(tx - trunkW / 2, baseY - th, trunkW, th);
      // koruna
      const cr = 18 + Math.round(rnd() * 10);
      g.globalAlpha = 0.95; pxDisc(g, tx, baseY - th - cr + 6, cr, 4, wood.leaf);
      g.globalAlpha = 0.7; pxDisc(g, tx - cr * 0.4, baseY - th - cr + 2, Math.round(cr * 0.7), 4, wood.leaf2);
      g.globalAlpha = 0.7; pxDisc(g, tx + cr * 0.4, baseY - th - cr + 4, Math.round(cr * 0.6), 4, wood.leaf2);
      g.globalAlpha = 1;
    }
    // zem (tráva)
    g.fillStyle = wood.ground;
    g.fillRect(0, skyH, W, groundH);
    g.fillStyle = wood.grass;
    g.fillRect(0, skyH, W, 6);
    // stébla trávy v popředí
    g.globalAlpha = 0.5;
    g.fillStyle = wood.grass;
    for (let i = 0; i < 14; i++) {
      const gx = rnd() * W;
      const gh = 4 + Math.round(rnd() * 8);
      g.fillRect(gx, skyH + 4 - gh, 2, gh);
      g.fillRect(gx + 3, skyH + 4 - Math.round(gh * 0.7), 2, Math.round(gh * 0.7));
    }
    g.globalAlpha = 1;
    // světlušky / padající listí (jen animace)
    if (animOK && wood.firefly) {
      for (let i = 0; i < 6; i++) {
        const fx = ((rnd() * W) + Math.sin(now / 900 + i) * 18) % W;
        const fy = 30 + ((now / 24 + i * 40) % (skyH - 30));
        const tw = (Math.sin(now / 200 + i * 2) + 1) / 2;
        g.globalAlpha = 0.3 + tw * 0.55;
        g.fillStyle = '#ffee99';
        g.fillRect(Math.round(fx), Math.round(fy), 3, 3);
      }
      g.globalAlpha = 1;
    } else if (animOK) {
      // padající lístky pro denní oblasti
      for (let i = 0; i < 5; i++) {
        const lx = ((rnd() * W) + Math.sin(now / 700 + i * 1.3) * 26) % W;
        const ly = ((now / 30 + i * 55) % (skyH + 10));
        g.globalAlpha = 0.5;
        g.fillStyle = i % 2 ? wood.leaf2 : wood.leaf;
        g.fillRect(Math.round(lx), Math.round(ly), 4, 3);
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
    1: { neon: '#6ab83a' },
    2: { neon: '#e05544' },
    3: { neon: '#ff9133' },
    4: { neon: '#c2843e' },
    5: { neon: '#7aab4a' },
    6: { neon: '#d2aa52' },
    7: { neon: '#94a0b4' },
  };

  const WORLD3 = {
    id: 3,
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
    ally: { scale: 4, dy: 38, pal: PAL_COM, grids: COMPANION,
            bob: 5, jet: { hot: '#ffd040', cold: '#cc2222', at: [[5, 10]] } },
    /* 5, NE 7 — všech 7 bossů má 24 řádků, starý engine je kreslil
       měřítkem 5 a BSCALE = 7 je mrtvá konstanta. NEOPRAVOVAT. */
    bosses: { scale: 5, pals: BOSS_PALS, common: COMMON, grids: BOSS_SPRITES },
    areas: AREAS,
    backdrop: backdrop
  };

  window.RPGSpriteWorld3 = WORLD3;
  if (window.RPGSpriteCore) window.RPGSprites3 = window.RPGSpriteCore.create(WORLD3);
})();
