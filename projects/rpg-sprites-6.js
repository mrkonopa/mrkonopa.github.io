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

  /* ══ paleta ══
     Ramp 1–4 a akcent A/a jsou tokeny --g6-ramp1..4 / --g6-accent z fáze 00,
     takže portrét na kartě hubu a sprite v aréně jsou tatáž postava.
     Znak 'e' = světlý tón (sklo přilby / papyrus / papír).
     Znak 'O' v mřížce = rim light — v paletě NENÍ, barvu dodává jádro. */
  const PAL_HERO = {
    K: '#05070c',
    1: '#141c40', 2: '#243070', 3: '#3a4d9e', 4: '#6f89d8',
    A: '#5dc8f0', a: '#1d5d77', e: '#dff5ff',
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
     Sloupce 0–15 tělo, 16–19 rekvizita (maják na tyči).
     Řádek 13, sloupce 14–15 je PŘEDLOKTÍ, které rekvizitu drží —
     bez něj se vznáší vedle těla. Drží se v jednom bodě, ne po celé délce. */
  const IDLE0 = [
    '.......OAO..........',
    '......O4A4O.........',
    '....OO444444OO......',
    '...O4444444444O.....',
    '..O444444444444.OAO.',
    '..O4eeeeeeee4O..OeO.',
    '..O4eAaAAaAe4O..OAO.',
    '..O4eeeeeeee4O..KwK.',
    '..O444444444K...KwK.',
    '...K11111111K...KwK.',
    'OGGG44444444GGGKKwK.',
    'OGgG4444444GGgGKKwK.',
    '.O44444444444K..KwK.',
    '.O4AAAAAAAA32KGGKwK.',
    '.O4AeeeeeeA32K..KwK.',
    '.O4YYYYYYYY32K..KYK.',
    '.O44444444432K......',
    '.K2444444442K.......',
    '..K33333333333K.....',
    '..K3333K.K3333K.....',
    '..O4332K.O4332K.....',
    '..O4332K.O4332K.....',
    '..O4322K.O4322K.....',
    '..K3322K.K3322K.....',
    '..KGGGGK.KGGGGK.....',
    '..KgGGGK.KgGGGK.....',
    '..KGGGGK.KGGGGK.....',
    '..KKKKKK.KKKKKK.....',
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

  /* Dech vypouští ZDVOJENÝ řádek 21 a zbytek posune o pixel níž.
     Nohy zůstávají na místě ⇒ oba snímky mají 28 pokreslených řádků,
     chodidla neposkakují a kontaktní stín se neodlepí. */
  const IDLE1 = ['.'.repeat(W)].concat(IDLE0.slice(0, 21)).concat(IDLE0.slice(22));

  const WINDUP = stripProp(IDLE0.slice());
  paste(WINDUP, 0, 12, 'KWWWWWK'); paste(WINDUP, 1, 13, 'KwWWWK'); paste(WINDUP, 2, 15, 'KYYK');

  const SLASH = stripProp(IDLE0.slice());
  paste(SLASH, 12, 13, 'KWWWWWK'); paste(SLASH, 13, 13, 'KwWWWwK');

  const CAST = IDLE0.slice();
  paste(CAST, 1, 0, 'AA'); paste(CAST, 2, 0, 'AAA'); paste(CAST, 3, 0, 'aAa'); paste(CAST, 4, 0, '.A.');

  const SHOOT = stripProp(IDLE0.slice());
  paste(SHOOT, 13, 13, 'KGGWWA'); paste(SHOOT, 14, 13, 'KKK');

  const HIT = IDLE0.map(r => r.replace(/A/g, 'a').replace(/O/g, 'K'));

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
    /* bossPad 14: starý engine měl bosse na pevných 186 px. */
    arena: { h: 200, groundPad: 14, bossPad: 14, heroX: 0.12, bossX: 0.58 },
    hero: {
      cols: 20, rows: 29, legacyRows: 24,   // legacyRows = kotva drawHeroOn (Věž legend)
      scale: 5, pal: PAL_HERO, skins: HERO_SKINS,
      grids: { idle: [IDLE0, IDLE1], windup: WINDUP, slash: SLASH,
               cast: CAST, shoot: SHOOT, hit: HIT }
    },
    /* dx 96 = staré hp.x + 18*SCALE + 6. Bez toho parťák uskočí o 10 px
       doleva, protože výchozí (18−2)*5+6 dá 86. */
    /* `jet` = iontový pohon sondy (dva čtverečky pod trupem, střídavě
       studený/horký podle tick%2). Bez něj se sonda kreslí, ale plamínky
       zmizí — a pod reduced-motion se to NEPOZNÁ, protože se stejně
       nekreslí. Odhaleno až srovnáním animované vrstvy se zmrazeným časem. */
    ally: { scale: 4, dy: 34, pal: PAL_COM, grids: COMPANION,
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
