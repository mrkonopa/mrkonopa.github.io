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
  /* ══ paleta ══
     Ramp 1–4 a akcent A/a jsou tokeny --g8-ramp1..4 / --g8-accent z fáze 00,
     takže portrét na kartě hubu a sprite v aréně jsou tatáž postava.
     Znak 'e' = světlý tón (sklo přilby / papyrus / papír).
     Znak 'O' v mřížce = rim light — v paletě NENÍ, barvu dodává jádro. */
  const PAL_HERO = {
    K: '#05070c',
    1: '#1c1440', 2: '#302566', 3: '#4b3c94', 4: '#8576cb',
    A: '#b39ddb', a: '#4b3b78', e: '#f0e8ff',
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
     Sloupce 0–15 tělo, 16–19 rekvizita (svitek).
     Řádek 13, sloupce 14–15 je PŘEDLOKTÍ, které rekvizitu drží —
     bez něj se vznáší vedle těla. Drží se v jednom bodě, ne po celé délce. */
  const IDLE0 = [
    '......K44K..........',
    '.....K3333K.........',
    '....K433334K........',
    '....O43ee34K........',
    '....O4eAAe4K........',
    '....O43ee34K........',
    '....K433334K........',
    '....K4444K..........',
    '...K444444K.........',
    '..K444444442K.......',
    '..O44YY44432K.......',
    '..O444444432K.......',
    '...K33333332K....KK.',
    '..O4333333332KGGKWW.',
    '..O4333333332K..KWw.',
    '.O433333333332K.KWw.',
    '.O43333333332K..KWW.',
    '.O433333333332K..KK.',
    '.O433333333332K.....',
    'O43333333333332K....',
    'O43333333333332K....',
    'K22222222222222K....',
    '...K433K.K433K......',
    '...O433K.O433K......',
    '...O432K.O432K......',
    '...KGGGK.KGGGK......',
    '...KgGGK.KgGGK......',
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

  /* Dech vypouští ZDVOJENÝ řádek 20 a zbytek posune o pixel níž.
     Nohy zůstávají na místě ⇒ oba snímky mají 28 pokreslených řádků,
     chodidla neposkakují a kontaktní stín se neodlepí. */
  const IDLE1 = ['.'.repeat(W)].concat(IDLE0.slice(0, 20)).concat(IDLE0.slice(21));

  const WINDUP = stripProp(IDLE0.slice());
  paste(WINDUP, 0, 12, 'KWWWWWK'); paste(WINDUP, 1, 13, 'KwWWWK'); paste(WINDUP, 2, 15, 'KYYK');

  const SLASH = stripProp(IDLE0.slice());
  paste(SLASH, 10, 13, 'KWWWWWK'); paste(SLASH, 11, 13, 'KwWWWwK');

  const CAST = IDLE0.slice();
  paste(CAST, 1, 0, 'AA'); paste(CAST, 2, 0, 'AAA'); paste(CAST, 3, 0, 'aAa'); paste(CAST, 4, 0, '.A.');

  const SHOOT = stripProp(IDLE0.slice());
  paste(SHOOT, 11, 13, 'KGGWWA'); paste(SHOOT, 12, 13, 'KKK');

  const HIT = IDLE0.map(r => r.replace(/A/g, 'a').replace(/O/g, 'K'));

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
    /* podlaha začíná na fy = H − 30. Krok A sem zkopíroval 0.46 z devítky —
       dnes to nikdo nečte, ale fáze 04 by podle toho vrstvila. */
    horizon: 0.85,
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
