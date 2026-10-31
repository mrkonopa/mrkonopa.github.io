/* ═════════════════════════════════════════════════════════════════════
   Mazlíčci z obchodu v aréně — `window.RPGMazlicci` (Vojta Konopa).

   Dřív byl mazlíček z obchodu jen malý plovoucí sprite mimo arénu (`sponka` v rpg-wallet.js) a v aréně stál světový
   parťák (sonda, sova…). Teď ho aréna kreslí místo parťáka: stojí vedle hrdiny, mrká, vrtí se a REAGUJE na boj —
   zaplesá při útoku hrdiny, uhne při zásahu, skáče po vítězství a když hrdinovi ubývá životů, stáhne se.

   Pravidla, která modul drží (vadami tohohle druhu se v hrách ztrácelo ovládání):
     • `frame()` je ČISTÁ funkce času — jen fillRect, žádné `Math.random`, žádné časovače; stav (idle / cheer / flinch /
       victory / worry) a čas ve stavu dostane zvenku, takže jde měřit a nemůže zasáhnout do ovládání
     • nikdy nesahá do DOM (kreslí do plátna, které mu dá aréna), takže nic nezakrývá a nic nechytá dotyk ani Enter
     • pod reduced-motion jediný klidný snímek (bez houpání, bez částic)
     • strop 40 volání fillRect na snímek (cenu nese počet volání, ne plocha)
   API: IDS, META, has(id), frame(ctx, id, o), arena(id) → funkce pro setPet v jádru spritů, shot(id)
   ═════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* Mřížky převzaté z plovoucí sponky (znaky mají tytéž barvy), `g2` přepisuje řádky pro druhý snímek,
     `eyes` jsou znaky, které mrknutí nahradí `blink`; `fx` je dodatečná kresba; `shot` barva střely. */
  const PETS = {
    'pet-sova': {
      name: 'Sova', anim: 'mrká a mává křídly, při útoku shazuje pírka', fx: 'feather', shot: '#e8c07a', eyes: 'WP', blink: 'B',
      pal: { K: '#0a0c12', B: '#9a6a38', b: '#6a4522', W: '#f0f2f8', P: '#14100c', w: '#e6d2a4', O: '#f2a23a' },
      grid: ['.KK.....KK.', 'KBBKKKKKBBK', 'KBBBBBBBBBK', 'KBWWWBWWWBK', 'KBWPWOWPWBK', 'KBWWWOWWWBK', '.KBBBBBBBK.', 'KbBBwwwBBbK', 'KbBBwwwBBbK', '.KbBwwwBbK.', '..KOK.KOK..'],
      g2: { 7: 'KBBBwwwBBBK', 8: '.bBBwwwBBb.' }
    },
    'pet-kocka': {
      name: 'Kočka', anim: 'vrtí ocasem a mrká, při vítězství pouští srdíčka', fx: 'heart', shot: '#f4d03f', eyes: 'E', blink: 'B',
      pal: { K: '#05050a', B: '#3a3a52', h: '#6a6a92', E: '#f4d03f', P: '#ff8fc7' },
      grid: ['.KK......KK.', '.KhK....KhK.', '.KBBKKKKBBK.', 'KhhBBBBBBBBK', 'KBBEEBBEEBBK', 'KBBEKBBEKBBK', 'KBBBBPPBBBBK', '.KBBBBBBBBK.', '.KBBBBBBBBKB', '.KBBK..KBBKB', '.KKK....KKKK'],
      g2: { 8: '.KBBBBBBBBK.', 9: '.KBBK..KBBKB', 7: '.KBBBBBBBBKB', 10: '.KKK....KKK.' }
    },
    'pet-robot': {
      name: 'Robot', anim: 'bliká anténou, při útoku jiskří', fx: 'zap', shot: '#19e6e6', eyes: 'E', blink: 'K',
      pal: { K: '#0a0c12', W: '#d4dcea', w: '#8d9bb0', Y: '#19e6e6', E: '#19e6e6' },
      grid: ['.....YY.....', '.....KK.....', '.KKKKKKKKKK.', 'KWWWWWWWWWWK', 'KWKEEKKEEKWK', 'KWKEEKKEEKWK', 'KWWWKKKKWWWK', '..KWWWWWWK..', '.KWWWYWWYWK.', '.KwwwwwwwwK.', '..KK....KK..'],
      g2: { 0: '.....KK.....', 8: '.KWWYWWWWYK.' }
    },
    'pet-drak': {
      name: 'Dráček', anim: 'vrtí ocasem, občas zafuní plamínek', fx: 'ember', shot: '#ff8a3a', eyes: 'E', blink: 'g',
      pal: { K: '#0a0c12', B: '#34b86e', g: '#1c6b42', s: '#a8ecb4', E: '#f4d03f', H: '#fff0a0' },
      grid: ['..H......H..', '.KBKKKKKKBK.', 'KBBBBBBBBBBK', 'KBBEEBBEEBBK', 'KBBEKBBEKBBK', 'KBBBBBBBBBBK', '.KBBBggBBBK.', '.KBBBssBBBK.', '.KBBBssBBBK.', '.KBBK..KBBK.', '.KKK....KKKg'],
      g2: { 9: '.KBBK..KBBKg', 10: '.KKK....KKK.' }
    },
    'pet-jednorozec': {
      name: 'Jednorožec', anim: 'třpytí se kolem rohu, hříva a ocas mění barvu', fx: 'sparkle', shot: '#ff8fc7', eyes: 'E', blink: 'W', cycle: ['m', ['#ff8fc7', '#c78fff', '#8fd0ff']],
      pal: { K: '#0a0c12', W: '#f2f2fa', w: '#c4c8e0', m: '#ff8fc7', E: '#6fa8ff', N: '#ffb0d6', H: '#f4d03f' },
      grid: ['.....HH.....', '.....HH.....', '.mWWWWWWWWm.', 'mWWWWWWWWWWm', 'mWWEEWWEEWWm', 'mWWEKWWEKWWm', 'mWWWWNNWWWWm', '.mWWWWWWWWm.', '.KWWWWWWWWK.', '.KWWK..KWWKm', '.KKK....KKKm'],
      g2: { 8: '.KWWWWWWWWKm', 9: '.KWWK..KWWK.', 10: '.KKK....KKK.' }
    },
    'pet-fenix': {
      name: 'Fénix', anim: 'plamení, ze křídel odlétají jiskry', fx: 'ember', shot: '#ffb03a', eyes: 'E', blink: 'R',
      pal: { K: '#0a0c12', R: '#ff5a3a', O: '#ffb03a', Y: '#fff0a0', E: '#fff0a0', B: '#ffd75a' },
      grid: ['.....OO.....', '....OYYO....', '..KKRRRRKK..', '.KRRRRRRRRK.', 'KRREERREERRK', 'KRRRRBBRRRRK', 'ORRRRBBRRRRO', 'OORRRRRRRROO', '.OORRRRRROO.', '..ORRYYRRO..', '...OO..OO...'],
      g2: { 0: '....OOOO....', 1: '.....OO.....', 7: 'ORRRRRRRRRRO' }
    },
    'pet-zlaty-drak': {
      name: 'Zlatý drak', anim: 'zlatě se leskne, při útoku zasype jiskrami', fx: 'sparkle', shot: '#ffd75a', eyes: 'E', blink: 'g',
      pal: { K: '#0a0c12', B: '#e0b030', g: '#8a6a12', s: '#fff0b0', E: '#ff5a3a', H: '#fff6d0', w: '#f6dc80' },
      grid: ['..H......H..', '.KBKKKKKKBK.', 'KBBBBBBBBBBK', 'KBBEEBBEEBBK', 'KBBEKBBEKBBK', 'KBBBBBBBBBBK', '.KBBBggBBBK.', 'wKBBBssBBBKw', 'wwBBBssBBBww', '.wKBK..KBKw.', '.KKK....KKKg'],
      g2: { 7: '.KBBBssBBBK.', 8: 'wwBBBssBBBww', 9: '.wKBK..KBKw.' }
    }
  };
  const IDS = Object.keys(PETS);
  const META = {};
  IDS.forEach(id => { META[id] = { name: PETS[id].name, anim: PETS[id].anim }; });
  const has = id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(PETS, id);

  const CHEER = { windup: 1, slash: 1, shoot: 1, cast: 1 };
  /* stav pro aréně: `hero` = ST.hero.mode, `boss` = ST.boss.mode, `hpFrac` = zlomek životů hrdiny */
  function stav(hero, boss, hpFrac) {
    if (boss === 'defeat') return 'victory';
    if (hero === 'hit') return 'flinch';
    if (CHEER[hero]) return 'cheer';
    if (hpFrac !== undefined && hpFrac <= 0.34) return 'worry';
    return 'idle';
  }

  function gridAt(p, k) {
    if (!k || !p.g2) return p.grid;
    return p.grid.map((r, i) => (p.g2[i] !== undefined ? p.g2[i] : r));
  }

  /* hex → rgba řetězec; barva se skládá bez náhody */
  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  }

  /* pozice a tvar mazlíčka podle stavu; vše z času, žádný stav navíc */
  function pose(state, t, tS, S, rm) {
    if (rm) return { dx: 0, dy: 0, sy: 1, flash: 0 };
    let dx = 0, dy = 0, sy = 1, flash = 0;
    const bob = Math.sin(t / 420) * S * 0.45;
    if (state === 'idle') dy = Math.round(bob);
    else if (state === 'cheer') { const p = Math.min(1, tS / 460); dy = -Math.round(Math.sin(p * Math.PI) * S * 3.2); }
    else if (state === 'flinch') {
      const p = Math.min(1, tS / 320);
      dx = -Math.round((1 - p) * S * 1.6); sy = p < 0.5 ? 0.82 : 1; dy = p < 0.5 ? Math.round(S * 0.5) : 0;
      flash = tS < 110 ? 1 : 0;
    } else if (state === 'victory') dy = -Math.round(Math.abs(Math.sin(tS / 250 * Math.PI)) * S * 4);
    else if (state === 'worry') { dy = Math.round(S * 0.6); dx = Math.round(Math.sin(t / 55) * 1); }
    return { dx, dy, sy, flash };
  }

  /* hlavní kresba. o: { x, feet, S, t, state, tS, rm }
       x    = levý okraj sprite, feet = y chodidel, S = měřítko pixelu, t = čas v ms, tS = čas od změny stavu
     Vrací střed mazlíčka (odtud letí střela). */
  function frame(ctx, id, o) {
    const p = PETS[id]; if (!has(id)) return null;
    const S = o.S, rm = !!o.rm, t = o.t || 0, tS = o.tS || 0, state = o.state || 'idle';
    const k = rm ? 0 : (Math.floor(t / 650) % 2);
    const grid = gridAt(p, k);
    const pal = p.cycle ? Object.assign({}, p.pal, { [p.cycle[0]]: p.cycle[1][Math.floor(t / 1400) % p.cycle[1].length] }) : p.pal;
    const gh = grid.length, gw = grid[0].length;
    const ps = pose(state, t, tS, S, rm);
    /* mrknutí: krátce zavřené oči (jen v klidu a ve stavu bez překvapení) */
    const blink = !rm && state !== 'flinch' && ((t % 3300) > 3170);
    const w = gw * S;
    const top = Math.round(o.feet - gh * S + ps.dy);
    const left = Math.round(o.x + ps.dx);

    /* kontaktní stín: zůstává na zemi, zmenší se při skoku */
    const lift = Math.max(0, -ps.dy) / (S * 4);
    ctx.fillStyle = 'rgba(0,0,0,' + (0.34 - lift * 0.18).toFixed(3) + ')';
    const sw = Math.round(w * (0.82 - lift * 0.25));
    ctx.fillRect(Math.round(o.x + (w - sw) / 2), Math.round(o.feet - S * 0.5), sw, Math.max(2, Math.round(S * 0.7)));

    /* stlačení při zásahu: řádky se zkrátí a zůstanou přilepené k zemi; hranice řádků se zaokrouhlují zvlášť,
       aby mezi nimi nevznikly mezery */
    const sqY = ps.sy, H = gh * S, base = top + (H - H * sqY);
    for (let r = 0; r < gh; r++) {
      let row = grid[r];
      if (blink && p.eyes) row = row.split('').map(ch => (p.eyes.indexOf(ch) >= 0 ? p.blink : ch)).join('');
      const y0 = Math.round(base + r * S * sqY), y1 = Math.round(base + (r + 1) * S * sqY);
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        ctx.fillStyle = ps.flash ? '#ffffff' : (pal[ch] || '#ff00ff');
        ctx.fillRect(left + c * S, y0, S, Math.max(1, y1 - y0));
      }
    }
    fx(ctx, p, S, left, top, gw, gh, state, t, tS, rm);
    return { x: left + w / 2, y: top + (gh * S) / 2 };
  }

  /* dodatečná kresba podle druhu — vše z času, nejvýš ~12 čtverečků */
  function fx(ctx, p, S, left, top, gw, gh, state, t, tS, rm) {
    if (rm) return;
    const px = Math.max(2, Math.round(S * 0.6));
    const c = (col, a, x, y, s) => { ctx.fillStyle = rgba(col, a); ctx.fillRect(Math.round(x), Math.round(y), s || px, s || px); };
    if (p.fx === 'ember') {
      const n = state === 'cheer' || state === 'victory' ? 4 : 2;
      for (let i = 0; i < n; i++) {
        const ph = ((t / 1100) + i / n) % 1;
        c(i % 2 ? '#ffb03a' : '#ff5a3a', 1 - ph, left + (1 + i * 2) * S + Math.sin(ph * 6 + i) * S * 0.5, top + S - ph * S * 5);
      }
    } else if (p.fx === 'sparkle') {
      const n = state === 'cheer' || state === 'victory' ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const ph = ((t / 1300) + i / n) % 1;
        if (ph > 0.55) continue;
        const a = Math.sin(ph / 0.55 * Math.PI);
        const x = left + (gw * 0.28 + i * gw * 0.22) * S, y = top - S * (0.5 + i * 0.8) + ph * S;
        c('#ffffff', a, x, y); c('#ffffff', a * 0.7, x - px, y); c('#ffffff', a * 0.7, x + px, y); c('#ffffff', a * 0.7, x, y - px); c('#ffffff', a * 0.7, x, y + px);
      }
    } else if (p.fx === 'zap') {
      if (state === 'cheer' && tS < 420) {
        const a = 1 - tS / 420;
        for (let i = 0; i < 3; i++) c('#19e6e6', a, left + (gw * 0.5 + (i - 1) * 2.2) * S, top - S * (0.6 + (i % 2)) , px);
      }
    } else if (p.fx === 'feather') {
      if (state === 'cheer' && tS < 600) {
        const ph = tS / 600;
        for (let i = 0; i < 3; i++) c('#e8c07a', 1 - ph, left + (i * 3.5 + 0.5) * S + Math.sin(ph * 8 + i) * S, top + S * 2 + ph * S * 4);
      }
    } else if (p.fx === 'heart') {
      if (state === 'victory') {
        for (let i = 0; i < 2; i++) {
          const ph = ((tS / 900) + i / 2) % 1;
          const x = left + (2 + i * 4) * S, y = top - ph * S * 4;
          c('#ff8fc7', 1 - ph, x, y); c('#ff8fc7', 1 - ph, x + px * 2, y); c('#ff8fc7', 1 - ph, x + px, y + px);
        }
      }
    }
  }

  /* funkce pro `setPet` v jádru spritů; drží vlastní „stav od kdy“ — čas se bere z `now`, nic se nenačasuje */
  function arena(id) {
    if (!has(id)) return null;
    let last = null, since = 0;
    const fn = function (ctx, e) {
      const st = stav(e.hero, e.boss, e.hpFrac);
      if (st !== last) { last = st; since = e.now; }
      return frame(ctx, id, { x: e.x, feet: e.feet, S: e.S, t: e.now, state: st, tS: e.now - since, rm: e.rm });
    };
    fn.shot = PETS[id].shot;
    fn.petId = id;
    return fn;
  }
  const shot = id => (has(id) ? PETS[id].shot : null);

  root.RPGMazlicci = { IDS, META, has, stav, frame, arena, shot };
})(typeof window !== 'undefined' ? window : globalThis);
