/* ════════════════════════════════════════════════════════════════════
   rpg-sprites-4.js — svět 4. ročníku pro rpg-sprite-core
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
     Ramp 1–4 jsou tokeny --g4-ramp1..4 z fáze 00 beze změny.
     Akcentová dvojice je u 1. stupně o KROK SVĚTLEJI než u 2. stupně:
       A = --g4-rim (#8fd9ff), a = --g4-accent (#4ab0e0)
     Znak 'e' = --g4-light (sklo lucerny, tvář). Znak 'O' = rim light —
     v paletě NENÍ, barvu dodává jádro z neonu oblasti. */
  const PAL_HERO = {
    K: '#05070c',
    1: '#0e2438', 2: '#173e5c', 3: '#255e85', 4: '#4e97c4',
    A: '#8fd9ff', a: '#4ab0e0', e: '#d6f3ff',
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
     Řádek 2 je krempa trojrohého klobouku (nejširší bod celého spritu),
     řádek 3 celý na ramp 3 = stín pod krempou (viz README, Rozhodnutí 2).
     Sloupce 0–15 tělo, 16–19 rekvizita (lodní lucerna, visí z ruky).
     Řádek 13, sloupce 14–15 je PŘEDLOKTÍ (manžeta), které rekvizitu drží —
     bez něj se vznáší vedle těla. Drží se v jednom bodě, ne po celé délce. */
  const IDLE0 = [
    '.......K44K.........',
    '......K44443K.......',
    '.KKK444444444KKK....',
    '...K33333333K.......',
    '....K444443K........',
    '....K4K4K43K........',
    '.....K4443K.........',
    '.....K1111K.........',
    '....K444443K........',
    '...K4A4444A43K......',
    '...O444444443K......',
    '...O444Y44443K......',
    '...O444444443K......',
    '..O4444444443KGG.KK.',
    '.OA4444444444AK.K..K',
    '..O4YYYY44443K..KYYK',
    '..O44444444443K.KeeK',
    '..O44444444443K.KeeK',
    '..O44444444443K.KYYK',
    '..K44444444443K..KK.',
    '..K44444444443K.....',
    '..K43K.K4K.K43K.....',
    '..K3K..K4K..K3K.....',
    '.......K4K..........',
    '.......K4K..........',
    '......KGGGK.........',
    '......KGgGK.........',
    '......KKKKK.........',
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

  /* Dech vypouští ZDVOJENÝ řádek 17 (je shodný s 16 včetně sloupců lucerny)
     a zbytek posune o pixel níž. Nohy zůstávají na místě ⇒ nejnižší
     pokreslený řádek je u OBOU snímků 27, chodidla neposkakují a kontaktní
     stín se neodlepí. */
  const IDLE1 = ['.'.repeat(W)].concat(IDLE0.slice(0, 17)).concat(IDLE0.slice(18));

  const WINDUP = stripProp(IDLE0.slice());
  paste(WINDUP, 0, 13, 'KWWWWWK'); paste(WINDUP, 1, 14, 'KwWWWK'); paste(WINDUP, 2, 16, 'KYYK');

  const SLASH = stripProp(IDLE0.slice());
  paste(SLASH, 12, 13, 'KWWWWWK'); paste(SLASH, 13, 13, 'KwWWWwK');

  /* Kouzlo u 1. stupně startuje NÍŽ (řádky 4–7) — nad tím je klobouk
     přes celou šířku a jiskry by mu jedla krempa. */
  const CAST = IDLE0.slice();
  paste(CAST, 4, 0, 'AA'); paste(CAST, 5, 0, 'AAA'); paste(CAST, 6, 0, 'aAa'); paste(CAST, 7, 0, '.A.');

  const SHOOT = stripProp(IDLE0.slice());
  paste(SHOOT, 13, 13, 'KGGWWA'); paste(SHOOT, 14, 13, 'KKK');

  const HIT = IDLE0.map(r => r.replace(/A/g, 'a').replace(/O/g, 'K'));

  const PAL_COM = { K:'#0a0c12', S:'#1f9e3a', s:'#13692a', C:'#e23b2b', c:'#9c1d12', Y:'#ffcf3a', B:'#2bb6e0', W:'#e8ecf5' };
  const COMPANION = [[
    '....KCCK......',
    '...KCCCCK.Y...',
    '..KCCCCKKYY...',
    '..KCCKWKSYYK..',
    '..KCKWWKSSK...',
    '.KSCCKSSSSSK..',
    'KSSSSSSSSSSK..',
    'KSBBSSSSSBSK..',
    '.KSBSSSSSBK...',
    '.KSSSSSSSK....',
    '..KSYSYSK.....',
    '...KKsKK......',
    '....KsK.......',
    '...KssK.......'
  ],[
    '....KCCK......',
    '...KCCCCK.Y...',
    '..KCCCCKKYY...',
    '..KCCKWKSYYK..',
    '..KCKWWKSSK...',
    '..KCCKSSSSK...',
    '.KSSSSSSSSK...',
    'KSBBSSSSSBSK..',
    'KSBBSSSSSBSK..',
    '.KSSSSSSSK....',
    '..KSYSYSK.....',
    '...KKsKK......',
    '...KssK.......',
    '..KssK........'
  ]];

  /* ── bossové: 7 oblastí, pirátská/mořská témata ── */
  const BOSS_PALS = {
    1:{A:'#ff6633',a:'#993322',M:'#cc4422',m:'#882211'},  // mořský krab — oranžovočervený
    2:{A:'#aa44cc',a:'#6622aa',M:'#883aaa',m:'#552288'},  // chobotnice — fialová
    3:{A:'#cccccc',a:'#888888',M:'#aaaaaa',m:'#666666'},  // kostra piráta — šedivá
    4:{A:'#2266cc',a:'#112288',M:'#1a44aa',m:'#0d2266'},  // žraločí kapitán — námořnická
    5:{A:'#22bbaa',a:'#117788',M:'#1a9988',m:'#0d5555'},  // mořská čarodějnice — tyrkys
    6:{A:'#667799',a:'#334466',M:'#445577',m:'#223344'},  // bouřkový golem — šedavě modrá
    7:{A:'#881144',a:'#440022',M:'#660833',m:'#440022'}   // kraken — temně purpurová
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
      '...KaK.KaK.KaK....',
      '...KAK.KAK.KAK....',
      '...KaK.KaK.KaK....',
      '...KAK.KAK.KAK....',
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
      '...KAK.KAK.KAK....',
      '...KaK.KaK.KaK....',
      '...KAK.KAK.KAK....',
      '...KaK.KaK.KaK....',
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

  function pxDisc(g, cx, cy, r, step, color) {
    g.fillStyle = color;
    const rr = r * r;
    for (let y = -r; y <= r; y += step)
      for (let x = -r; x <= r; x += step)
        if (x * x + y * y <= rr) g.fillRect(Math.round(cx + x), Math.round(cy + y), step, step);
  }

  const G4_SEAS = {
    1: { sky:'#87ceeb', sky2:'#b0deff', water:'#1a6a9a', wave:'#4dc8ff', sun:'#ffd040', sunH:'#fff090', cloud:true },
    2: { sky:'#5599cc', sky2:'#88aadd', water:'#0d4a7a', wave:'#3399cc', sun:'#ffcc00', sunH:'#ffe066', cloud:true },
    3: { sky:'#445566', sky2:'#667788', water:'#223344', wave:'#336677', sun:'#cc9933', sunH:'#ddaa44', cloud:false },
    4: { sky:'#40c8c0', sky2:'#60e8d8', water:'#158878', wave:'#30c0b0', sun:'#fff000', sunH:'#ffff80', cloud:true },
    5: { sky:'#7788aa', sky2:'#99aabb', water:'#334455', wave:'#557788', sun:'#eeddcc', sunH:'#fff0e8', cloud:false },
    6: { sky:'#ff9944', sky2:'#ffcc66', water:'#1a3366', wave:'#3355aa', sun:'#ff5511', sunH:'#ff9944', cloud:false },
    7: { sky:'#1a1a33', sky2:'#222233', water:'#0a0d22', wave:'#1a2244', sun:'#334455', sunH:'#445566', cloud:false }
  };
  function paintSky(g, env, animOK) {
    const W = env.w, H = env.h, now = env.now;
    const sea = G4_SEAS[env.area] || G4_SEAS[1];
    const rnd = env.rnd;
    const skyH = Math.round(H * 0.58);
    // obloha
    g.fillStyle = sea.sky;
    g.fillRect(0, 0, W, skyH);
    // slunce
    const scx = Math.round(W * 0.82), scy = 36, sr = 20;
    g.globalAlpha = 0.85; pxDisc(g, scx, scy, sr, 3, sea.sun);
    g.globalAlpha = 0.55; pxDisc(g, scx - 6, scy - 6, Math.round(sr * 0.55), 3, sea.sunH);
    g.globalAlpha = 1;
    // mraky
    if (sea.cloud) {
      g.globalAlpha = 0.40;
      pxDisc(g, Math.round(W * 0.18), 30, 22, 4, '#e8f4ff');
      pxDisc(g, Math.round(W * 0.30), 24, 15, 4, '#ffffff');
      g.globalAlpha = 1;
    }
    // moře
    g.fillStyle = sea.water;
    g.fillRect(0, skyH, W, H - skyH);
    // vlny
    if (animOK) {
      const woff = (now / 700) % 1;
      g.globalAlpha = 0.35;
      for (let i = 0; i < 4; i++) {
        g.fillStyle = sea.wave;
        const wx = ((woff + i * 0.25) % 1) * W;
        const wy = skyH + 4 + i * 10;
        g.fillRect(wx, wy, 38, 3);
        g.fillRect((wx + W * 0.5) % W, wy + 2, 28, 2);
      }
      g.globalAlpha = 1;
    }
    // lodní vlnky v popředí
    g.globalAlpha = 0.15;
    g.fillStyle = sea.wave;
    for (let i = 0; i < 5; i++) {
      const wx2 = rnd() * W;
      g.fillRect(wx2, H - 28 - Math.round(rnd() * 20), 22 + Math.round(rnd() * 20), 2);
    }
    g.globalAlpha = 1;
  }

  const backdrop = {
    /* moře začíná na H*0.58 (skyH). Krok A sem zkopíroval 0.46 z devítky —
       dnes to nikdo nečte, ale fáze 04 by podle toho vrstvila. */
    horizon: 0.58,
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
    1: { neon: '#ff6633' },
    2: { neon: '#aa44cc' },
    3: { neon: '#cccccc' },
    4: { neon: '#2266cc' },
    5: { neon: '#22bbaa' },
    6: { neon: '#667799' },
    7: { neon: '#881144' },
  };

  const WORLD4 = {
    id: 4,
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

  window.RPGSpriteWorld4 = WORLD4;
  if (window.RPGSpriteCore) window.RPGSprites4 = window.RPGSpriteCore.create(WORLD4);
})();
