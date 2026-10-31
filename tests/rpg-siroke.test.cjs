/* ═════════════════════════════════════════════════════════════════════
   Široká mapa a oblast v RPG hrách 3.–9. ročníku (`projects/rpg-siroke.css`, jediné pravidlo pro všech sedm her).

   Dřív měla mapa i oblast `max-width` 640/680 px, takže na tabletu na šířku (1024–1366 px) využívala obsah jen 45–66 % šířky displeje
   a na počítači 24–47 %. Teď od 900 px na šířku: mapa vlevo oblasti, vpravo zkušenosti + tlačítka + doporučení + žebříček;
   oblast vlevo karta oblasti, vpravo mise. Telefon a tablet na výšku zůstávají beze změny.

   Ověřuje se (7 her × tablety 1024×768, 1180×820, 1366×1024 a počítače 1440×900, 1920×1080; mapa prázdná i s plnými panely):
     1. právě jedna aktivní obrazovka (styl obrazovky váže na `.active`, ne na id — viz boj na šířku, 9. 9.)
     2. mapa i oblast jsou dvousloupcové a široké: obsah ≥ 80 % šířky okna (≤ 1366 px), na počítači plná šířka 1240 px
     3. žádné vodorovné přetečení stránky
     4. mapa: oblasti vlevo, sloupec vpravo; panely vpravo se nepřekrývají; VŠECHNA tlačítka (Trénink, Věž, Živý souboj…) jsou vidět bez rolování,
        i když jsou panely doporučení, žebříček a oživení plné
     5. ovladače jdou stisknout: každé tlačítko i oblast aspoň 44 px a nic je nezakrývá (`elementFromPoint` ve středu)
     6. oblast: karta vlevo, mise vpravo, nepřekrývají se; první mise jde stisknout
     7. TELEFON A TABLET NA VÝŠKU BEZE ZMĚNY: snímek mapy i oblasti na 390×844, 844×390, 899×600 a 1024×1366 je bajt po bajtu stejný jako se styly
        vypnutými (prázdný `rpg-siroke.css`); na hranici 900×600 už je dvousloupcové
   Sabotáže (6): pravidlo bez hranice šířky, bez orientace, úzký obsah, levá mřížka bez rozpětí řádků, karta oblasti ve sloupci misí,
   hra bez odkazu na styl.
   Spusť: node tests/rpg-siroke.test.cjs
   ═════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const LAUNCH = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };
const HRY = [3, 4, 5, 6, 7, 8, 9];
const TABLETY = [[1024, 768], [1180, 820], [1366, 1024]];
const POCITAC = [[1440, 900], [1920, 1080]];
const CSS = 'rpg-siroke.css';

function server(prepis) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); }
    let telo = fs.readFileSync(fp), pr = null;
    for (const [k, f] of Object.entries(prepis || {})) if (k === path.basename(fp)) pr = f;
    if (pr) telo = Buffer.from(pr(telo.toString('utf8')));
    r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream' });
    r.end(telo);
  });
  return new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv)));
}
const baseOf = srv => 'http://127.0.0.1:' + srv.address().port;

async function otevri(br, base, g, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const chyby = [];
  p.on('pageerror', e => chyby.push(e.message));
  await p.goto(base + '/projects/rpg-mat-' + g + '.html');
  await p.waitForFunction(() => typeof window.startGame === 'function', null, { timeout: 20000 });
  await p.evaluate(() => { document.getElementById('ni').value = 'Vojta'; startGame(); S.tutorialDone = true; });
  return { ctx, p, chyby };
}

/* ── měření ve stránce ── */
const MER_MAPA = plny => {
  go('map');
  if (plny) {
    const radky = (n, t) => Array.from({ length: n }, (_, i) => '<div style="display:flex;gap:8px;padding:5px 8px;font-size:13px;margin:3px 0"><span>' + (i + 1) + '.</span><span style="flex:1">' + t + ' ' + (i + 1) + '</span><span>' + (900 - 90 * i) + ' XP</span></div>').join('');
    for (const [id, t, n] of [['map-leaderboard', 'Spolužák', 5], ['map-recommend', 'Doporučujeme procvičit misi', 2], ['map-revive', 'Oživ svého hrdinu', 2]]) {
      const el = document.getElementById(id); el.style.display = 'block'; el.innerHTML = radky(n, t);
    }
  }
  return new Promise(res => setTimeout(() => {
    const R = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const vid = e => { if (!e) return false; const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && e.getBoundingClientRect().height > 0; };
    const trefa = e => { const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); };
    const wrap = document.querySelector('#s-map .wrap');
    const tlac = [...document.querySelectorAll('#s-map .map-actions .btn')];
    const uzly = [...document.querySelectorAll('#s-map .map-node')];
    const prava = ['.map-xppanel', '.map-actions', '.map-actions-note', '#map-recommend', '#map-leaderboard', '#map-revive'].map(s => document.querySelector('#s-map ' + s)).filter(vid);
    res({
      aktivni: document.querySelectorAll('.screen.active').length, aktivniId: [...document.querySelectorAll('.screen.active')].map(e => e.id).join(','),
      iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth,
      disp: getComputedStyle(wrap).display, wrap: R(wrap),
      grid: R(document.getElementById('map-grid')),
      tlac: tlac.map(e => ({ r: R(e), trefa: trefa(e), txt: e.textContent.trim().slice(0, 18) })),
      uzly: uzly.map(e => ({ r: R(e), trefa: trefa(e) })),
      prava: prava.map(e => ({ r: R(e), id: e.id || e.className })),
      plnych: ['map-leaderboard', 'map-recommend', 'map-revive'].filter(i => vid(document.getElementById(i))).length
    });
  }, 450));
};
const MER_OBLAST = () => {
  go('map'); openArea(AREAS[0].id);
  return new Promise(res => setTimeout(() => {
    const R = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const trefa = e => { const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 20)); return !!t && (t === e || e.contains(t)); };
    const wrap = document.querySelector('#s-area .wrap'), prvni = document.querySelector('#mission-list > *');
    res({
      aktivni: document.querySelectorAll('.screen.active').length, iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth,
      disp: getComputedStyle(wrap).display, wrap: R(wrap), karta: R(document.getElementById('area-head')), seznam: R(document.getElementById('mission-list')),
      prvni: R(prvni), prvniTrefa: prvni ? trefa(prvni) : false
    });
  }, 450));
};

const prekryv = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));

function posud(g, w, h, plny, m, o, f) {
  const k = `g${g} ${w}×${h}${plny ? ' plná mapa' : ''}`;
  /* 1 */ f(m.aktivni === 1, k + ': právě jedna aktivní obrazovka', m.aktivniId);
  /* 2 */ const cil = Math.min(1240, w - 24);
  f(m.disp === 'grid' && m.wrap.w >= cil - 2, k + ': mapa je dvousloupcová a široká (' + Math.round(m.wrap.w) + ' z ' + cil + ' px, display ' + m.disp + ')');
  if (w <= 1366) f(m.wrap.w / w >= 0.8, k + ': mapa využívá ≥ 80 % šířky', Math.round(m.wrap.w / w * 100) + ' %');
  /* 3 */ f(m.sw <= w, k + ': mapa nepřetéká vodorovně', 'scrollWidth ' + m.sw);
  /* 4 */ const pr = m.prava;
  f(pr.length >= 3 && m.tlac.length >= 3, k + ': pravý sloupec a tlačítka existují', pr.length + ' panelů, ' + m.tlac.length + ' tlačítek');
  if (pr.length && m.grid) {
    f(pr.every(p => p.r.l >= m.grid.r - 1), k + ': panely jsou vpravo od oblastí', 'oblasti končí ' + Math.round(m.grid.r) + ', panel začíná ' + Math.round(Math.min(...pr.map(p => p.r.l))));
    let prek = 0; for (let i = 0; i < pr.length; i++) for (let j = i + 1; j < pr.length; j++) prek += prekryv(pr[i].r, pr[j].r);
    f(prek <= 4, k + ': panely vpravo se nepřekrývají', Math.round(prek) + ' px²');
    const razene = pr.slice().sort((a, b) => a.r.t - b.r.t);
    let mezera = 0; for (let i = 1; i < razene.length; i++) mezera = Math.max(mezera, razene[i].r.t - razene[i - 1].r.b);
    f(mezera <= 40, k + ': panely vpravo na sebe navazují bez děr', 'největší mezera ' + Math.round(mezera) + ' px');
    f(pr.every(p => p.r.r <= m.wrap.r + 1), k + ': panely vpravo nevyčnívají z obsahu');
  }
  f(m.tlac.every(t => t.r.t >= 0 && t.r.b <= h), k + ': všechna tlačítka jsou vidět bez rolování', m.tlac.map(t => t.txt + ' ' + Math.round(t.r.t) + '–' + Math.round(t.r.b)).join('; ') + ' (okno ' + h + ')');
  /* 5 */ f(m.tlac.every(t => t.r.w >= 44 && t.r.h >= 44), k + ': tlačítka mají aspoň 44 px', m.tlac.map(t => Math.round(t.r.w) + '×' + Math.round(t.r.h)).join(' '));
  f(m.tlac.every(t => t.trefa), k + ': tlačítka nic nezakrývá', m.tlac.filter(t => !t.trefa).map(t => t.txt).join(', '));
  f(m.uzly.length === 7 && m.uzly.every(u => u.r.w >= 44 && u.r.h >= 44 && u.trefa), k + ': všech 7 oblastí jde stisknout', m.uzly.length + ' oblastí');
  if (plny) f(m.plnych === 3, k + ': panely doporučení, žebříčku a oživení jsou vidět', m.plnych + ' z 3');
  /* 6 */ if (o) {
    f(o.aktivni === 1, k + ' oblast: právě jedna aktivní obrazovka');
    f(o.disp === 'grid' && o.wrap.w >= cil - 2, k + ' oblast: dvousloupcová a široká (' + Math.round(o.wrap.w) + ' px)');
    f(o.sw <= w, k + ' oblast: nepřetéká vodorovně', 'scrollWidth ' + o.sw);
    f(o.karta && o.seznam && o.karta.r <= o.seznam.l + 1, k + ' oblast: karta vlevo, mise vpravo', o.karta ? 'karta končí ' + Math.round(o.karta.r) + ', seznam začíná ' + Math.round(o.seznam.l) : 'chybí');
    f(o.prvni && o.prvni.h >= 44 && o.prvniTrefa, k + ' oblast: první misi jde stisknout');
  }
}

async function meri(br, base, hry, velikosti, f) {
  let kontrol = 0;
  for (const g of hry) {
    const { ctx, p, chyby } = await otevri(br, base, g, velikosti[0][0], velikosti[0][1]);
    for (const [w, h] of velikosti) {
      await p.setViewportSize({ width: w, height: h });
      for (const plny of [false, true]) {
        const m = await p.evaluate(MER_MAPA, plny);
        const o = plny ? null : await p.evaluate(MER_OBLAST);
        posud(g, w, h, plny, m, o, f); kontrol++;
      }
    }
    f(chyby.length === 0, 'g' + g + ': bez chyb ve stránce', chyby.slice(0, 2).join(' | '));
    await ctx.close();
  }
  return kontrol;
}

/* ── telefon a tablet na výšku: se styly i bez nich stejný snímek ── */
const BEZ_ZMENY = [[390, 844, 'telefon na výšku'], [844, 390, 'telefon na šířku'], [899, 600, 'těsně pod hranicí'], [1024, 1366, 'tablet na výšku']];
async function snimky(br, base, g, f) {
  const out = {};
  const { ctx, p } = await otevri(br, base, g, 390, 844);
  for (const [w, h, jm] of BEZ_ZMENY) {
    await p.setViewportSize({ width: w, height: h });
    await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}#map-cermat,#map-streak{visibility:hidden!important}' });
    for (const co of ['mapa', 'oblast']) {
      await p.evaluate(co => { go('map'); if (co === 'oblast') openArea(AREAS[0].id); }, co);
      await p.waitForTimeout(500);
      out[jm + ' ' + co] = await p.screenshot({ fullPage: true });
    }
  }
  await ctx.close();
  return out;
}

async function bezZmeny(br, srvS, srvPrazdny, hry, f) {
  let kontrol = 0;
  for (const g of hry) {
    const a = await snimky(br, baseOf(srvS), g, f), b = await snimky(br, baseOf(srvPrazdny), g, f);
    for (const k of Object.keys(a)) { f(a[k].equals(b[k]), 'g' + g + ' ' + k + ': snímek je stejný jako bez rozšíření', 'liší se (' + a[k].length + ' vs ' + b[k].length + ' B)'); kontrol++; }
  }
  return kontrol;
}

/* hranice 900 px: těsně pod ní beze změny, na ní už dva sloupce */
async function hranice(br, base, g, f) {
  const { ctx, p } = await otevri(br, base, g, 899, 600);
  const disp = async (w, h) => { await p.setViewportSize({ width: w, height: h }); return p.evaluate(() => { go('map'); return getComputedStyle(document.querySelector('#s-map .wrap')).display; }); };
  f(await disp(899, 600) === 'block', 'g' + g + ': 899×600 na šířku je beze změny');
  f(await disp(900, 600) === 'grid', 'g' + g + ': 900×600 na šířku je dvousloupcové');
  f(await disp(900, 1200) === 'block', 'g' + g + ': 900×1200 na výšku je beze změny');
  await ctx.close();
}

async function hlavni() {
  const br = await chromium.launch(LAUNCH);
  const srv = await server(), prazdny = await server({ [CSS]: () => '' });
  const nalezy = [];
  const f = (c, m, d) => { if (!c) nalezy.push(m + (d ? ' — ' + d : '')); };

  console.log('\n── Široká mapa a oblast (7 her) ──\n');
  const k1 = await meri(br, baseOf(srv), HRY, TABLETY.concat(POCITAC), f);
  const k2 = await bezZmeny(br, srv, prazdny, HRY, f);
  for (const g of [3, 9]) await hranice(br, baseOf(srv), g, f);
  nalezy.slice(0, 12).forEach(n => console.log('  ⚠ ' + n));
  ok(nalezy.length === 0, 'skutečná hra projde všemi kontrolami', nalezy.slice(0, 4).join(' | '));
  ok(k1 === HRY.length * 5 * 2 && k2 === HRY.length * BEZ_ZMENY.length * 2, 'proběhl očekávaný počet měření', k1 + ' + ' + k2);
  console.log('  skutečná hra: ' + (nalezy.length ? nalezy.length + ' nálezů' : 'bez nálezu') + ' (' + (k1 + k2) + ' měření)');
  srv.close(); prazdny.close();

  /* ── sabotáže ── */
  const css0 = fs.readFileSync(path.join(ROOT, 'projects', CSS), 'utf8');
  const html6 = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-mat-6.html'), 'utf8');
  async function sabotaz(jm, prepis, hry, velikosti, rx, jenBezZmeny) {
    const pr = Object.entries(prepis)[0];
    const orig = pr[0] === CSS ? css0 : html6;
    const zmeneno = pr[1](orig) !== orig;
    ok(zmeneno, 'sabotáž „' + jm + '“ se aplikovala');
    if (!zmeneno) return;
    const sS = await server(prepis), sP = await server({ [CSS]: () => '' });
    const n = [], ff = (c, m, d) => { if (!c) n.push(m + (d ? ' — ' + d : '')); };
    if (jenBezZmeny) await bezZmeny(br, sS, sP, hry, ff); else await meri(br, baseOf(sS), hry, velikosti, ff);
    ok(n.length > 0 && n.some(t => rx.test(t)), 'sabotáž „' + jm + '“ je chycena', n.length ? n[0] : 'prošla bez nálezu');
    sS.close(); sP.close();
  }
  await sabotaz('bez hranice šířky', { [CSS]: s => s.replace('(min-width:900px) and (orientation:landscape)', '(orientation:landscape)') }, [3], null, /stejný jako bez rozšíření/, true);
  await sabotaz('bez orientace', { [CSS]: s => s.replace('(min-width:900px) and (orientation:landscape)', '(min-width:900px)') }, [3], null, /tablet na výšku/, true);
  await sabotaz('úzký obsah', { [CSS]: s => s.replace('max-width:1240px', 'max-width:680px') }, [9], [[1180, 820]], /široká|≥ 80 %/);
  await sabotaz('levá mřížka bez rozpětí řádků', { [CSS]: s => s.replace('grid-row:3/10', 'grid-row:3') }, [9], [[1024, 768]], /bez děr/);
  await sabotaz('karta oblasti ve sloupci misí', { [CSS]: s => s.replace('#s-area #area-head{grid-column:1', '#s-area #area-head{grid-column:2') }, [3], [[1180, 820]], /karta vlevo/);
  await sabotaz('hra bez odkazu na styl', { 'rpg-mat-6.html': s => s.replace(/<link rel="stylesheet" href="\.\/rpg-siroke\.css[^>]*>/, '') }, [6], [[1180, 820]], /široká|≥ 80 %/);

  await br.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
}
hlavni().catch(e => { console.error(e); process.exit(1); });
