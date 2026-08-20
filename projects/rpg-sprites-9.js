/* ════════════════════════════════════════════════════════════════════
   rpg-sprites-9.js — svět 9. ročníku (NULL_BYTE) pro rpg-sprite-core
   ────────────────────────────────────────────────────────────────────
   Fáze 03. Tenhle soubor je JEN DATA + pozadí. Žádná smyčka, žádné
   kreslení spritu, žádné efekty — to všechno je ve sdíleném jádru.

   Načítat POŘADÍ (obojí plain <script>, bez defer):
     <script src="rpg-sprite-core.js"></script>
     <script src="rpg-sprites-9.js"></script>

   Bez jádra se nedefinuje NIC (window.RPGSprites9 zůstane undefined)
   a hra jede dál na emoji animacích. Žádná záložní kopie enginu.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ══════════════ HRDINA — 20 × 29, kouká doprava ══════════════
     Znaky: K obrys · 1–4 čtyřtónový ramp světa (1 = nejtmavší, JEN vnitřní
     stín) · O rim light (barvu dodává jádro z neonu oblasti) · A/a akcent ·
     W/w čepel · Y/y zlato · G/g bota.
     Ramp 1–4 i sdílené barvy jsou TOTOŽNÉ s fází 01 (rpg-hero-portraits.js). */
  const PAL_HERO = {
    K: '#05070c',
    1: '#082029', 2: '#0f3a48', 3: '#175a6b', 4: '#2f92a4',
    A: '#19e6e6', a: '#0e8a8a',
    W: '#eef4ff', w: '#93a1bd',
    Y: '#f4d03f', y: '#9a7a12',
    G: '#3d465e', g: '#8b98b5'
  };

  /* Skiny z obchodu — přebarvují jen ramp a akcent; obrys K, čepel W/w,
     zlato Y/y a boty G/g zůstávají, takže žádný znak nezůstane nedefinovaný.
     ID zůstávají stejná jako dnes (obchod je prodává). */
  const HERO_SKINS = {
    'skin-gold':    { 2: '#4a3a0e', 3: '#8a6a12', 4: '#caa12a', A: '#fff0b0', a: '#c9a227' },
    'skin-red':     { 2: '#3d0d14', 3: '#7a1a26', 4: '#c23a48', A: '#ff6b6b', a: '#a02020' },
    'skin-emerald': { 2: '#0a3323', 3: '#0f6b45', 4: '#2aa877', A: '#39ff9e', a: '#1a8a5a' },
    'skin-ghost':   { 2: '#1d1733', 3: '#3a2d63', 4: '#6a55a8', A: '#c08aff', a: '#7a4fd0' },
    'skin-stealth': { 2: '#14161c', 3: '#262a33', 4: '#4a515e', A: '#9fb0c8', a: '#5a6a85' }
  };

  const IDLE0 = [
    '.......OAO..........',
    '......O4A4O....wWO..',
    '.....O444444O..wWO..',
    '....O44444444O.wWO..',
    '....O4AAAAAA4O.wWO..',
    '....O4AAAAAA4K.wWO..',
    '....O43333332K.wWO..',
    '.....O333332K..wWO..',
    '......K1111K...wWO..',
    '...O444444444K.wWO..',
    '..O4444444444K.wWO..',
    '..O4333333333K.wWO..',
    '..O4333A33332K.wWO..',
    '..O4333A33332K.wWO..',
    '..O4333333332K.wWO..',
    '..O4YYYYYY332KYYYYK.',
    '..O4333333332K.KyK..',
    '..K2333333322K.KK...',
    '...K333K.K333K......',
    '...O433K.O433K......',
    '...O433K.O433K......',
    '...O432K.O432K......',
    '...K332K.K332K......',
    '...K222K.K222K......',
    '..KGGGGK.KGGGGK.....',
    '..KgggGK.KgggGK.....',
    '..KGGGGK.KGGGGK.....',
    '..KKKKKK.KKKKKK.....',
    '....................'
  ];

  /* ── pomocné transformace: pózy vznikají z IDLE, ne opisem ──
     Šetří to ~3 kB a hlavně to zaručuje, že se pózy nerozejdou. */
  const W = IDLE0[0].length;
  function clone(g) { return g.slice(); }
  function paste(g, r, c, s) {
    const row = g[r];
    g[r] = (row.slice(0, c) + s + row.slice(c + s.length)).slice(0, W);
  }
  function stripSword(g) {                       // odebere svislý meč (sl. 14–18)
    return g.map(row => row.slice(0, 14) + '.....'.slice(0, 5) + row.slice(19));
  }

  /* Dýchání: o řádek níž se posune JEN horní polovina (hlava, trup, meč).
     Nohy a boty zůstávají — chodidla se nesmí hýbat, jinak sprite poskakuje
     nad zemí a kontaktní stín se odlepí. Oba snímky mají 28 pokreslených řádků. */
  const IDLE1 = ['.'.repeat(W)].concat(IDLE0.slice(0, 17)).concat(IDLE0.slice(18));

  const WINDUP = stripSword(clone(IDLE0));                    // nápřah nad hlavu
  paste(WINDUP, 0, 12, 'KWWWWWK');
  paste(WINDUP, 1, 13, 'KwWWWK');
  paste(WINDUP, 2, 15, 'KYYK');

  const SLASH = stripSword(clone(IDLE0));                     // seknutí vodorovně
  paste(SLASH, 12, 13, 'KWWWWWK');
  paste(SLASH, 13, 13, 'KwWWWwK');

  const CAST = clone(IDLE0);                                  // kouzlo: orb u ruky
  paste(CAST, 1, 0, 'AA');
  paste(CAST, 2, 0, 'AAA');
  paste(CAST, 3, 0, 'aAa');
  paste(CAST, 4, 0, '.A.');

  const SHOOT = stripSword(clone(IDLE0));                     // střelba: paže vpřed
  paste(SHOOT, 13, 13, 'KGGWWA');
  paste(SHOOT, 14, 13, 'KKK');

  /* Zásah: akcent zhasne, rim se schová (hrdina „ztmavne"). Bez nových znaků. */
  const HIT = IDLE0.map(r => r.replace(/A/g, 'a').replace(/O/g, 'K'));

  /* ══════════════ ANDROID PARŤÁK — 14 × 14, levituje ══════════════
     Beze změny proti dnešnímu enginu (funguje, neredesignujeme ho). */
  const PAL_AND = { K: '#0a0c12', G: '#8a97ad', g: '#5a6a85', C: '#19e6e6', W: '#e8ecf5' };
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
  ], [
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

  /* ══════════════ BOSSOVÉ — 18 × 24, koukají doleva ══════════════
     Mřížky se ve fázi 03 NEMĚNÍ (7 archetypů, ověřené v provozu).
     Rim light dostávají automaticky z jádra — proto v mřížkách žádné 'O'.
     Znaky: K obrys · A/a akcent oblasti · M/m tělo · W bílá · R oko. */
  const BOSS_PALS = {
    1: { A: '#19e6e6', a: '#0d7a7a', M: '#3a4a66', m: '#28354d' },
    2: { A: '#f4d03f', a: '#9a7d10', M: '#5c4a22', m: '#3d3217' },
    3: { A: '#39ff9e', a: '#157a4a', M: '#2d4a3a', m: '#1d3328' },
    4: { A: '#ff5dd5', a: '#8a2a72', M: '#4a2d4a', m: '#331d33' },
    5: { A: '#5dade2', a: '#28628f', M: '#2d3a4a', m: '#1d2833' },
    6: { A: '#45e0c0', a: '#1d7a66', M: '#2d4a44', m: '#1d332f' },
    7: { A: '#ff5d7f', a: '#8f2a44', M: '#4a2d35', m: '#331d23' }
  };
  const COMMON = { K: '#0a0c12', W: '#e8ecf5', R: '#ff3355' };

  const E = '..................';
  const BOSS = {
    1: [[  // strážní bot
      E, '...KKKKKKKKKK.....', '..KMMMMMMMMMMK....', '..KMKKKKKKKKMK....',
      '..KMKAAKKAAKMK....', '..KMKAAKKAAKMK....', '..KMKKKKKKKKMK....', '..KmMMMMMMMMmK....',
      '...KKKMMMMKKK.....', '..KAAKMmmMKAAK....', '.KMMMKMmmMKMMMK...', '.KmmmKMMMMKmmmK...',
      '.KKKKKMMMMKKKKK...', '....KMMMMMMMMK....', '....KmMMMMMmMK....', '....KMMMMMMMMK....',
      '....KMMKKMMK......', '....KMMK.KMMK.....', '....KmmK.KmmK.....', '...KKKKK.KKKKK....',
      E, E, E, E
    ], [
      E, E, '...KKKKKKKKKK.....', '..KMMMMMMMMMMK....', '..KMKKKKKKKKMK....',
      '..KMKAAKKAAKMK....', '..KMKAAKKAAKMK....', '..KMKKKKKKKKMK....', '..KmMMMMMMMMmK....',
      '...KKKMMMMKKK.....', '..KAAKMmmMKAAK....', '.KMMMKMmmMKMMMK...', '.KmmmKMMMMKmmmK...',
      '.KKKKKMMMMKKKKK...', '....KMMMMMMMMK....', '....KmMMMMMmMK....', '....KMMMMMMMMK....',
      '....KMMKKMMK......', '....KMMK.KMMK.....', '....KmmK.KmmK.....', '...KKKKK.KKKKK....',
      E, E, E
    ]],
    2: [[  // reaktorové jádro
      E, '......KKKKKK......', '....KKAAAAAAKK....', '...KAAaaaaaaAAK...',
      '..KAaaMMMMMMaaAK..', '.KAaMMWWWWMMMMaAK.', '.KAaMWWAAWWMMMaAK.', 'KAaMMWAAAAWMMMMaAK',
      'KAaMMWAAAAWMMMMaAK', 'KAaMMWWAAWWMMMMaAK', '.KAaMMWWWWMMMMaAK.', '.KAaaMMMMMMMMaaAK.',
      '..KAaaaaaaaaaaAK..', '...KAAaaaaaaAAK...', '....KKAAAAAAKK....', '......KKKKKK......',
      E, E, E, E, E, E, E, E
    ], [
      E, '......KKKKKK......', '....KKAAAAAAKK....', '...KAAaaaaaaAAK...',
      '..KAaaMMMMMMaaAK..', '.KAaMMMWWWWMMMaAK.', '.KAaMMWWAAWWMMaAK.', 'KAaMMMWAAAAWMMMaAK',
      'KAaMMMWAAAAWMMMaAK', 'KAaMMMWWAAWWMMMaAK', '.KAaMMMWWWWMMMaAK.', '.KAaaMMMMMMMMaaAK.',
      '..KAaaaaaaaaaaAK..', '...KAAaaaaaaAAK...', '....KKAAAAAAKK....', '......KKKKKK......',
      E, E, E, E, E, E, E, E
    ]],
    3: [[  // procesorový golem
      E, '..KK..........KK..', '..KAK........KAK..', '...KAK......KAK...',
      '..KKKKKKKKKKKKKK..', '.KMMMMMMMMMMMMMMK.', '.KMKKKKKKKKKKKKMK.', '.KMKAAKAAKAAKAKMK.',
      '.KMKKKKKKKKKKKKMK.', '.KMKAKAAKAAKAAKMK.', '.KMKKKKKKKKKKKKMK.', '.KmMMMMMMMMMMMMmK.',
      '..KKKKKKKKKKKKKK..', '...KAK......KAK...', '..KAK........KAK..', '..KK..........KK..',
      E, E, E, E, E, E, E, E
    ], [
      E, '..KK..........KK..', '...KAK......KAK...', '..KAK........KAK..',
      '..KKKKKKKKKKKKKK..', '.KMMMMMMMMMMMMMMK.', '.KMKKKKKKKKKKKKMK.', '.KMKAKAAKAAKAAKMK.',
      '.KMKKKKKKKKKKKKMK.', '.KMKAAKAAKAKAAKMK.', '.KMKKKKKKKKKKKKMK.', '.KmMMMMMMMMMMMMmK.',
      '..KKKKKKKKKKKKKK..', '..KAK........KAK..', '...KAK......KAK...', '..KK..........KK..',
      E, E, E, E, E, E, E, E
    ]],
    4: [[  // glitch wraith
      E, '.....KKKKKKK......', '...KKMMMMMMMKK....', '..KMMMMMMMMMMMK...',
      '.KMMRRKMMMKRRMMK..', '.KMMRRKMMMKRRMMK..', '.KMMMMMMMMMMMMMK..', '..KMMMKKKKKMMMK...',
      '.KMMMMMMMMMMMMMK..', 'KAAKMMMMMMMMMKAAK.', '.KKMMMKMMMKMMMKK..', '..KMMK.KMK.KMMK...',
      '..KMK...K...KMK...', '...K..KAK.K..K....', '......K.K.A.......', '....A.....K.......',
      E, E, E, E, E, E, E, E
    ], [
      E, '.....KKKKKKK......', '...KKMMMMMMMKK....', '..KMMMMMMMMMMMK...',
      '.KMMRRKMMMKRRMMK..', '.KMMRRKMMMKRRMMK..', '.KMMMMMMMMMMMMMK..', '..KMMMKKKKKMMMK...',
      '.KMMMMMMMMMMMMMK..', 'KAAKMMMMMMMMMKAAK.', '.KKMMKMMMMKMMMKK..', '..KMK.KMMK..KMK...',
      '..KK...KK....K....', '....K.A...KA......', '...A....K....K....', '......K....A......',
      E, E, E, E, E, E, E, E
    ]],
    5: [[  // síťový pavouk
      E, '.KK.....KK.....KK.', '..KK...KAK....KK..', '...KK..KAK...KK...',
      '....KKKKKKKKKK....', '...KKMMMMMMMKK....', '..KMMMMMMMMMMMK...', '.KMMKAAKMKAAKMMK..',
      '.KMMKAAKMKAAKMMK..', '.KMMMMMMMMMMMMK...', '..KmMMKKKKKMMmK...', '...KKKMMMMMKKK....',
      '..KK..KMMMK..KK...', '.KK...KKKKK...KK..', 'KK...KK...KK...KK.', 'K....K.....K....K.',
      E, E, E, E, E, E, E, E
    ], [
      E, '.KK.....KK.....KK.', '..KK...KAK....KK..', '...KK..KAK...KK...',
      '....KKKKKKKKKK....', '...KKMMMMMMMKK....', '..KMMMMMMMMMMMK...', '.KMMKAAKMKAAKMMK..',
      '.KMMKAAKMKAAKMMK..', '.KMMMMMMMMMMMMK...', '..KmMMKKKKKMMmK...', '...KKKMMMMMKKK....',
      '...KK.KMMMK.KK....', '..KK..KKKKK..KK...', '.KK..KK...KK..KK..', '.K...K.....K...K..',
      E, E, E, E, E, E, E, E
    ]],
    6: [[  // monitor s anténou
      '........KAK.......', '........KAK.......', '....KKKKKKKKKK....', '..KKMMMMMMMMMMKK..',
      '.KMMKKKKKKKKKKMMK.', '.KMKAAAAAAAAAAKMK.', '.KMKAWAAAAAWAAKMK.', '.KMKAAAAAAAAAAKMK.',
      '.KMKAAKAAAKAAAKMK.', '.KMKAAAAAAAAAAKMK.', '.KMMKKKKKKKKKKMMK.', '..KKMMMMMMMMMMKK..',
      '....KKKKKKKKKK....', '.....KMK..KMK.....', '.....KMK..KMK.....', '.....KmK..KmK.....',
      '....KKKK..KKKK....', E, E, E, E, E, E, E
    ], [
      '........KAK.......', '........KAK.......', '....KKKKKKKKKK....', '..KKMMMMMMMMMMKK..',
      '.KMMKKKKKKKKKKMMK.', '.KMKAAAAAAAAAAKMK.', '.KMKAAWAAAAAWAKMK.', '.KMKAAAAAAAAAAKMK.',
      '.KMKAAAKAAAKAAKMK.', '.KMKAAAAAAAAAAKMK.', '.KMMKKKKKKKKKKMMK.', '..KKMMMMMMMMMMKK..',
      '....KKKKKKKKKK....', '.....KMK..KMK.....', '.....KMK..KMK.....', '.....KmK..KmK.....',
      '....KKKK..KKKK....', E, E, E, E, E, E, E
    ]],
    7: [[  // jádro systému
      E, '....KKKKKKKKKK....', '..KKMMMMMMMMMMKK..', '.KMMMKKKKKKKKMMMK.',
      '.KMKKAAAAAAAAKKMK.', 'KMKAAaaaaaaaaAAKMK', 'KMKAaWWWWWWWWaAKMK', 'KMKAaWWRRRRWWaAKMK',
      'KMKAaWRRRRRRWaAKMK', 'KMKAaWRRKKRRWaAKMK', 'KMKAaWWRRRRWWaAKMK', 'KMKAaWWWWWWWWaAKMK',
      '.KMKAAaaaaaaAAKMK.', '.KMKKAAAAAAAAKKMK.', '.KMMMKKKKKKKKMMMK.', '..KKMMMMMMMMMMKK..',
      '....KKKKKKKKKK....', E, E, E, E, E, E, E
    ], [
      E, '....KKKKKKKKKK....', '..KKMMMMMMMMMMKK..', '.KMMMKKKKKKKKMMMK.',
      '.KMKKAAAAAAAAKKMK.', 'KMKAAaaaaaaaaAAKMK', 'KMKAaWWWWWWWWaAKMK', 'KMKAaWWWWWWWWaAKMK',
      'KMKAaWWRRRRWWaAKMK', 'KMKAaWRRKKRRWaAKMK', 'KMKAaWWRRRRWWaAKMK', 'KMKAaWWWWWWWWaAKMK',
      '.KMKAAaaaaaaAAKMK.', '.KMKKAAAAAAAAKKMK.', '.KMMMKKKKKKKKMMMK.', '..KKMMMMMMMMMMKK..',
      '....KKKKKKKKKK....', E, E, E, E, E, E, E
    ]]
  };

  /* ══════════════ OBLASTI: neon = barva rim lightu i pozadí ══════════════ */
  const AREAS = {
    1: { neon: '#3fd6e0', name: 'brána systému' },
    2: { neon: '#ff5a8a', name: 'reaktor' },
    3: { neon: '#5affc0', name: 'procesor' },
    4: { neon: '#c06aff', name: 'glitch zóna' },
    5: { neon: '#ffb03a', name: 'síť' },
    6: { neon: '#4a8aff', name: 'monitoring' },
    7: { neon: '#3fe06a', name: 'jádro' }
  };

  /* ══════════════ POZADÍ ══════════════
     Rozdělené na statické (jednou do off-screen plátna) a pohyblivé
     (jen dvě vrstvy, ať to na Chromebooku neskáče). Žádné filtry ani blur. */
  const backdrop = {
    horizon: 0.46,
    paintStatic(g, env) {
      const { w, h, horizon, rnd, rgba, neon } = env;
      for (let i = 0; i < 24; i++) {                       // datové tečky
        const x = Math.floor(rnd() * w), y = Math.floor(rnd() * (horizon - 6));
        g.globalAlpha = 0.4;
        g.fillStyle = rnd() < 0.5 ? rgba(1) : '#6a7a98';
        g.fillRect(x, y, 1, 1);
      }
      g.globalAlpha = 1;
      let tx = 8;                                          // silueta věží s okny
      while (tx < w) {
        const tw = 14 + Math.floor(rnd() * 22), th = 18 + Math.floor(rnd() * 48);
        g.globalAlpha = 0.85; g.fillStyle = '#0d1019';
        g.fillRect(tx, horizon - th, tw, th);
        for (let wy = horizon - th + 4; wy < horizon - 4; wy += 6)
          for (let wx = tx + 3; wx < tx + tw - 2; wx += 5)
            if (rnd() < 0.45) { g.globalAlpha = 0.4 + rnd() * 0.4; g.fillStyle = rgba(1); g.fillRect(wx, wy, 2, 2); }
        tx += tw + 5 + Math.floor(rnd() * 10);
      }
      g.globalAlpha = 0.7; g.fillStyle = rgba(1); g.fillRect(0, horizon - 1, w, 1);
      g.globalAlpha = 0.12; g.fillStyle = neon; g.fillRect(0, horizon, w, 4);
      g.globalAlpha = 1;
      g.strokeStyle = rgba(0.32); g.lineWidth = 1;          // perspektivní paprsky
      for (let gx = -6; gx <= 6; gx++) {
        g.beginPath(); g.moveTo(Math.round(w * 0.5), horizon); g.lineTo(w / 2 + gx * (w / 9), h); g.stroke();
      }
    },
    paintAnim(g, env) {
      const { w, h, horizon, now, rgba, rnd } = env;
      g.strokeStyle = rgba(0.32); g.lineWidth = 1;
      const scroll = (now / 1400) % 1;                      // ubíhající mřížka
      for (let r = 0; r < 8; r++) {
        const t = (r + scroll) / 8, y = horizon + t * t * (h - horizon);
        g.globalAlpha = 0.08 + 0.3 * t;
        g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      }
      g.globalAlpha = 1;
      for (let i = 0; i < 9; i++) {                         // datový déšť
        const x = Math.floor((i / 9) * w) + Math.floor(rnd() * 8);
        const yy = ((now / 1000 * (36 + rnd() * 60)) + rnd() * h) % (horizon + 18);
        for (let k = 0; k < 5; k++) {
          g.globalAlpha = 0.5 - k * 0.1; g.fillStyle = rgba(1);
          g.fillRect(x, yy - k * 5, 1, 3);
        }
      }
      g.globalAlpha = 1;
    }
  };

  /* ══════════════ popis světa ══════════════ */
  const WORLD9 = {
    id: 9,
    theme: 'NULL_BYTE',
    arena: { h: 200, groundPad: 14, heroX: 0.12, bossX: 0.58 },
    hero: {
      cols: 20, rows: 29, legacyRows: 24,      // legacyRows = kotva pro drawHeroOn
      scale: 5, pal: PAL_HERO, skins: HERO_SKINS,
      grids: { idle: [IDLE0, IDLE1], windup: WINDUP, slash: SLASH, cast: CAST, shoot: SHOOT, hit: HIT }
    },
    ally: {
      scale: 4, dy: 90, pal: PAL_AND, grids: ANDROID,
      jet: { hot: '#19e6e6', cold: '#0e8a8a', at: [[4, 13], [9, 13]] }
    },
    bosses: { scale: 5, pals: BOSS_PALS, common: COMMON, grids: BOSS },
    areas: AREAS,
    backdrop: backdrop
  };

  window.RPGSpriteWorld9 = WORLD9;                          // pro testy a kontaktní list
  if (window.RPGSpriteCore) window.RPGSprites9 = window.RPGSpriteCore.create(WORLD9);
})();
