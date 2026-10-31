/* ═════════════════════════════════════════════════════════════════════
   Mazlíčci z obchodu — `window.RPGMazlicci` (Vojta Konopa).

   Dřív byl mazlíček z obchodu jen malý plovoucí sprite mimo arénu (`sponka` v rpg-wallet.js) a v aréně stál světový
   parťák (sonda, sova…). Teď ho aréna kreslí místo parťáka: stojí vedle hrdiny, mrká, vrtí se a REAGUJE na boj —
   zaplesá při útoku hrdiny, uhne při zásahu, skáče po vítězství a když hrdinovi ubývá životů, přikrčí se. Stejné sprity
   jsou v obchodě (živý náhled s ukázkou) a v profilu (místo emoji).

   Pravidla, která modul drží (vadami tohohle druhu se v hrách ztrácelo ovládání):
     • `frame()` je ČISTÁ funkce času — jen fillRect, žádné `Math.random`, žádné časovače; stav (idle / cheer / flinch /
       victory / worry) a čas ve stavu dostane zvenku, takže jde měřit a nemůže zasáhnout do ovládání
     • do DOM sahá jediná funkce, `mount()` (obchod, profil), a jen do plátna, které jí zadá volající
     • pod reduced-motion jediný klidný snímek (bez houpání, bez částic)
     • strop 120 volání fillRect na snímek (naměřeno 48–101; cenu nese počet volání, ne plocha)
   API: IDS, META, has, stav, frame, arena, shot, size, mount
   ═════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* Sprity se kreslí jako LEVÁ POLOVINA (7 znaků) a pravá se zrcadlí — symetrie se tak nemůže rozejít. Řádky, které
     symetrické nejsou (ocas), se přepisují celé v `A` (1. snímek) a `B` (2. snímek) podle čísla řádku.
     `eyes` jsou znaky, které mrknutí nahradí `blink`; `fx` je dodatečná kresba, `at` místa, odkud létají jiskry;
     `shot` je barva střely. */
  const PETS = {
    'pet-sova': {
      name: 'Sova', anim: 'mrká a mává křídly, při útoku shazuje pírka', fx: 'feather', shot: '#e8c07a', eyes: 'IP', blink: 'L',
      pal: { K: '#0a0c12', d: '#5a3a1c', B: '#8a5a2e', L: '#b8844a', I: '#f4b82a', P: '#14100c', O: '#f2a23a', o: '#c97a1e', c: '#efe0bd', v: '#c9a56a' },
      half: ['.KK....', 'KdBKKKK', 'KdBBLLL', 'KBLIIIL', 'KBLIPIL', 'KBLIIIO', 'KdBLLLo', 'KdBcvcc', 'KdBccvc', '.KdBccc', '..KdBcc', '..KOOKK'],
      A: {}, B: { 7: 'KBBcvccccvcBBK', 8: '.dBccvccvccBd.' }
    },
    'pet-kocka': {
      name: 'Kočka', anim: 'vrtí ocasem a mrká, při vítězství pouští srdíčka', fx: 'heart', shot: '#f4d03f', eyes: 'EP', blink: 'B',
      pal: { K: '#05050a', d: '#22222e', B: '#3a3a52', h: '#6a6a92', E: '#f4d03f', P: '#05050a', N: '#ff8fc7', p: '#ff8fc7', w: '#e8e8f4', m: '#a0a0c0' },
      half: ['.KK....', 'KpBK...', 'KhBBKKK', 'KhBBBBB', 'KBEEEBB', 'KBEPEBB', 'mBBBBBN', '.KBBwww', '.KdBBww', '.KdBBBB', '.KdBBBB', '.KBBK..', '.KwwK..'],
      A: { 10: '.KdBBBBBBBBdKB', 11: '.KBBK....KBBKB', 12: '.KwwK....KwwKK' },
      B: { 8: '.KdBBwwwwBBdKB', 9: '.KdBBBBBBBBdKB' }
    },
    'pet-robot': {
      name: 'Robot', anim: 'bliká anténou, při útoku jiskří', fx: 'zap', shot: '#19e6e6', eyes: 'E', blink: 'b',
      pal: { K: '#0a0c12', W: '#d4dcea', w: '#8d9bb0', h: '#f4f8ff', E: '#19e6e6', Y: '#19e6e6', b: '#2a3a56', O: '#ffb03a' },
      half: ['......Y', '......K', '..KKKKK', '.KhWWWW', 'KWbbbbb', 'KWbEEbb', 'KWbEEbb', 'KWWbbbb', '..KKWWW', '.KWWOYW', '.KWwwww', '..KKK..'],
      A: {}, B: { 0: '..............', 9: '.KWWOWWWWOWWK.' }
    },
    'pet-drak': {
      name: 'Dráček', anim: 'vrtí ocasem, občas zafuní plamínek', fx: 'ember', at: [[5, 6], [8, 6]], shot: '#ff8a3a', eyes: 'EP', blink: 'd',
      pal: { K: '#0a0c12', d: '#1c6b42', B: '#34b86e', L: '#6fe09a', s: '#c8f4cf', E: '#f4d03f', P: '#0a0c12', H: '#fff0a0', n: '#1c6b42', w: '#2fae66' },
      half: ['..H....', '.KHKKKK', 'KdBBBBB', 'KBLLBBB', 'KBEPBBB', 'KBEEBBB', 'KdBBBnB', '.KdBBBB', 'wKBBsss', 'wwKBsss', '.KdBsss', '.KBBK..', '.KKK...'],
      A: { 11: '.KBBK....KBBKB', 12: '.KKK......KKKd' },
      B: { 10: '.KdBssssssBdKB', 11: '.KBBK....KBBKd' }
    },
    'pet-jednorozec': {
      name: 'Jednorožec', anim: 'třpytí se kolem rohu, hříva a ocas mění barvu', fx: 'sparkle', at: [[6, -1], [1, 2], [12, 3]], shot: '#ff8fc7', eyes: 'EP', blink: 'W', cycle: ['m', ['#ff8fc7', '#c78fff', '#8fd0ff']],
      pal: { K: '#0a0c12', W: '#f6f6ff', w: '#c8cce8', L: '#e8e8fa', m: '#ff8fc7', q: '#ffd0e6', E: '#6fa8ff', P: '#0a0c12', N: '#ffb0d6', H: '#f4d03f', h: '#fff0a0', k: '#8a6a4a' },
      half: ['......h', '......H', '.mmqWWW', 'mmqWWWW', 'mqWEPWW', 'mqWEEWW', 'mqWWwNN', '.mqWWWW', '.KWWWww', '.KWWWWw', '.KWWK..', '.KkkK..'],
      A: { 9: '.KWWWWwwWWWWKm', 10: '.KWWK....KWWKm', 11: '.KkkK....KkkKq' },
      B: { 8: '.KWWWwwwwWWWKm', 9: '.KWWWWwwWWWWKm' }
    },
    'pet-fenix': {
      name: 'Fénix', anim: 'plamení, ze křídel odlétají jiskry', fx: 'ember', at: [[0, 7], [13, 7], [6, 0]], shot: '#ffb03a', eyes: 'EP', blink: 'r',
      pal: { K: '#0a0c12', R: '#ff5a3a', r: '#c23a24', O: '#ffb03a', Y: '#fff0a0', E: '#fff0a0', P: '#0a0c12', b: '#ffd75a' },
      half: ['.....OY', '....OYY', '...KRRR', '..KRRRR', '.KRrEPR', 'KORRRRb', 'OOrRRRb', 'OYORRRR', '.OORRRY', '..OORRY', '...ORRR', '.....OO'],
      A: {}, B: { 0: '.....YOOY.....', 7: 'OOORRRRRRRROOO' }
    },
    'pet-zlaty-drak': {
      name: 'Zlatý drak', anim: 'zlatě se leskne, při útoku zasype jiskrami', fx: 'sparkle', at: [[6, -1], [0, 7], [13, 7]], shot: '#ffd75a', eyes: 'EP', blink: 'g',
      pal: { K: '#0a0c12', g: '#8a6a12', d: '#b88a1c', B: '#e0b030', L: '#fff0b0', s: '#fff6d0', E: '#ff5a3a', P: '#0a0c12', H: '#fff6d0', G: '#ff3a5a', n: '#8a6a12', w: '#f0c850' },
      half: ['..H.H.H', '.KHKKKK', 'KdBBBBB', 'KBLLGGB', 'KBEPBBB', 'KBEEBBB', 'KdBBBnB', '.KdBBBB', 'wKdBsss', 'wwKBsss', 'wwwKsss', '.wKBK..', '.KKK...'],
      A: { 11: '.wKBK....KBKwd', 12: '.KKK......KKKd' },
      B: { 8: 'wwKdBssssBdKww', 9: 'wwKBsssssBKww.' }
    }
  };
  const IDS = Object.keys(PETS);
  const META = {};
  const mirror = r => r + r.split('').reverse().join('');
  /* složí dva idle snímky; řádek z `A`/`B` se bere celý, ostatní se zrcadlí z poloviny */
  IDS.forEach(id => {
    const p = PETS[id];
    const base = p.half.map(mirror);
    const sad = o => base.map((r, i) => (o && o[i] !== undefined ? o[i] : r));
    p.frames = [sad(p.A), sad(p.B)];
    p.gw = base[0].length; p.gh = base.length;
    META[id] = { name: p.name, anim: p.anim };
  });
  const has = id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(PETS, id);
  const size = id => (has(id) ? { cols: PETS[id].gw, rows: PETS[id].gh } : null);
  /* jen ke čtení (testy): řádky mřížky snímku k (0/1) a paleta */
  const rows = (id, k) => (has(id) ? PETS[id].frames[k ? 1 : 0].slice() : null);
  const palette = id => (has(id) ? Object.assign({}, PETS[id].pal) : null);

  const CHEER = { windup: 1, slash: 1, shoot: 1, cast: 1 };
  /* stav pro aréně: `hero` = ST.hero.mode, `boss` = ST.boss.mode, `hpFrac` = zlomek životů hrdiny */
  function stav(hero, boss, hpFrac) {
    if (boss === 'defeat') return 'victory';
    if (hero === 'hit') return 'flinch';
    if (CHEER[hero]) return 'cheer';
    if (hpFrac !== undefined && hpFrac <= 0.34) return 'worry';
    return 'idle';
  }

  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  }

  /* pozice a tvar mazlíčka podle stavu; vše z času, žádný stav navíc */
  function pose(state, t, tS, S, rm) {
    if (rm) return { dx: 0, dy: 0, sy: 1, flash: 0 };
    let dx = 0, dy = 0, sy = 1, flash = 0;
    if (state === 'idle') dy = Math.round(Math.sin(t / 420) * S * 0.45);
    else if (state === 'cheer') { const p = Math.min(1, tS / 460); dy = -Math.round(Math.sin(p * Math.PI) * S * 3.2); }
    else if (state === 'flinch') {
      const p = Math.min(1, tS / 320);
      dx = -Math.round((1 - p) * S * 1.6); sy = p < 0.5 ? 0.82 : 1; dy = 0;
      flash = tS < 110 ? 1 : 0;
    } else if (state === 'victory') dy = -Math.round(Math.abs(Math.sin(tS / 250 * Math.PI)) * S * 4);
    else if (state === 'worry') { dy = Math.round(S * 0.6); dx = Math.round(Math.sin(t / 55) * 1); }
    return { dx, dy, sy, flash };
  }

  /* hlavní kresba. o: { x, feet, S, t, state, tS, rm }
       x    = levý okraj sprite, feet = y chodidel, S = měřítko pixelu, t = čas v ms, tS = čas od změny stavu
     Vrací střed mazlíčka (odtud letí střela). */
  function frame(ctx, id, o) {
    if (!has(id)) return null;
    const p = PETS[id];
    const S = o.S, rm = !!o.rm, t = o.t || 0, tS = o.tS || 0, state = o.state || 'idle';
    const k = rm ? 0 : (Math.floor(t / 650) % 2);
    const grid = p.frames[k];
    const gh = p.gh, gw = p.gw;
    const pal = p.cycle ? Object.assign({}, p.pal, { [p.cycle[0]]: p.cycle[1][rm ? 0 : Math.floor(t / 1400) % p.cycle[1].length] }) : p.pal;
    const ps = pose(state, t, tS, S, rm);
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
      /* souvislé úseky téže barvy se kreslí jedním obdélníkem — míň volání, stejný obraz */
      let c = 0;
      while (c < row.length) {
        const ch = row[c];
        if (ch === '.') { c++; continue; }
        let e = c + 1; while (e < row.length && row[e] === ch) e++;
        ctx.fillStyle = ps.flash ? '#ffffff' : (pal[ch] || '#ff00ff');
        ctx.fillRect(left + c * S, y0, (e - c) * S, Math.max(1, y1 - y0));
        c = e;
      }
    }
    fx(ctx, p, S, left, top, state, t, tS, rm);
    return { x: left + w / 2, y: top + (gh * S) / 2 };
  }

  /* dodatečná kresba podle druhu — vše z času, nejvýš ~25 čtverečků */
  function fx(ctx, p, S, left, top, state, t, tS, rm) {
    if (rm) return;
    const gw = p.gw;
    const px = Math.max(2, Math.round(S * 0.6));
    const c = (col, a, x, y, s) => { ctx.fillStyle = rgba(col, a); ctx.fillRect(Math.round(x), Math.round(y), s || px, s || px); };
    const vesel = state === 'cheer' || state === 'victory';
    if (p.fx === 'ember') {
      const em = p.at || [[3, 2], [8, 2]];
      const n = vesel ? em.length * 2 : em.length;
      for (let i = 0; i < n; i++) {
        const e = em[i % em.length];
        const ph = ((t / 1100) + i / n) % 1;
        c(i % 2 ? '#ffb03a' : '#ff5a3a', 1 - ph, left + e[0] * S + Math.sin(ph * 6 + i) * S * 0.5, top + e[1] * S - ph * S * 5);
      }
    } else if (p.fx === 'sparkle') {
      const em = p.at || [[6, -1]];
      const n = vesel ? em.length : 1;
      for (let i = 0; i < n; i++) {
        const ph = ((t / 1300) + i / em.length) % 1;
        if (ph > 0.55) continue;
        const a = Math.sin(ph / 0.55 * Math.PI);
        const x = left + em[i][0] * S + S * 0.4, y = top + em[i][1] * S + ph * S;
        c('#ffffff', a, x, y); c('#ffffff', a * 0.7, x - px, y); c('#ffffff', a * 0.7, x + px, y); c('#ffffff', a * 0.7, x, y - px); c('#ffffff', a * 0.7, x, y + px);
      }
    } else if (p.fx === 'zap') {
      if (state === 'cheer' && tS < 420) {
        const a = 1 - tS / 420;
        for (let i = 0; i < 3; i++) c('#19e6e6', a, left + (gw * 0.5 + (i - 1) * 2.2) * S, top - S * (0.6 + (i % 2)), px);
      }
    } else if (p.fx === 'feather') {
      if (state === 'cheer' && tS < 600) {
        const ph = tS / 600;
        for (let i = 0; i < 3; i++) c('#e8c07a', 1 - ph, left + (i * 4.5 + 0.5) * S + Math.sin(ph * 8 + i) * S, top + S * 2 + ph * S * 4);
      }
    } else if (p.fx === 'heart') {
      if (state === 'victory') {
        for (let i = 0; i < 2; i++) {
          const ph = ((tS / 900) + i / 2) % 1;
          const x = left + (3 + i * 5) * S, y = top - ph * S * 4;
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

  /* ── živé plátno (obchod, profil) ───────────────────────────────────────────────────────────────────────────────
     JEDINÁ část modulu, která sahá do stránky, a jen do plátna, které zadá volající. Jeden společný cyklus kreslí
     všechna připojená plátna asi 14× za sekundu; plátno, které z dokumentu zmizelo, se samo odhlásí, a skrytá karta
     cyklus zastaví. Pod reduced-motion se kreslí jediný klidný snímek. */
  const MOUNT = new Set();
  let rafId = 0, lastDraw = 0;
  const reduced = () => {
    try { return document.documentElement.classList.contains('reduced-motion') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  };
  function paint(m, now) {
    const ctx = m.canvas.getContext('2d');
    ctx.clearRect(0, 0, m.canvas.width, m.canvas.height);
    const rm = reduced();
    /* plán ukázky: seznam [stav, do kdy]; po jeho konci se vrátí klid */
    if (m.plan) {
      while (m.plan.length && now >= m.plan[0][1]) { m.plan.shift(); m.since = now; }
      m.state = m.plan.length ? m.plan[0][0] : 'idle';
      if (!m.plan.length) m.plan = null;
    }
    frame(ctx, m.id, { x: m.pad, feet: m.canvas.height - m.pad / 2, S: m.S, t: now, state: m.state, tS: now - (m.since || 0), rm });
  }
  function tick(now) {
    rafId = 0;
    for (const m of Array.from(MOUNT)) { if (!m.canvas.isConnected) MOUNT.delete(m); }
    if (!MOUNT.size) return;
    if (now - lastDraw >= 70) { lastDraw = now; MOUNT.forEach(m => { try { paint(m, now); } catch (e) { MOUNT.delete(m); } }); }
    if (!reduced() || Array.from(MOUNT).some(m => m.plan)) rafId = requestAnimationFrame(tick);
  }
  function kick() { if (!rafId && typeof requestAnimationFrame === 'function') rafId = requestAnimationFrame(tick); }

  /* mount(plátno, id, { S }) → { stav(s), ukazka(), stop() } */
  function mount(canvas, id, o) {
    if (!has(id) || !canvas || !canvas.getContext) return null;
    const S = (o && o.S) || 4, p = PETS[id];
    const pad = S * 2;
    canvas.width = p.gw * S + pad * 2; canvas.height = p.gh * S + S * 9;
    canvas.style.imageRendering = 'pixelated';
    const m = { canvas, id, S, pad, state: 'idle', since: 0, plan: null };
    MOUNT.add(m);
    paint(m, (typeof performance !== 'undefined' ? performance.now() : 0));
    kick();
    return {
      stav(s) { m.state = s; m.since = (typeof performance !== 'undefined' ? performance.now() : 0); paint(m, m.since); kick(); },
      /* ukázka: zaplesá, uhne, zaskáče a vrátí se do klidu — jen z času, žádný časovač */
      ukazka() { const n = (typeof performance !== 'undefined' ? performance.now() : 0); m.plan = [['cheer', n + 650], ['flinch', n + 1050], ['victory', n + 2750]]; m.since = n; kick(); },
      stop() { MOUNT.delete(m); }
    };
  }

  root.RPGMazlicci = { IDS, META, has, size, rows, palette, stav, frame, arena, shot, mount };
})(typeof window !== 'undefined' ? window : globalThis);
