/* ═════════════════════════════════════════════════════════════════════
   Témata z obchodu jako pixelové pozadí (`projects/rpg-temata.js`, čistá část bez prohlížeče).

   Dřív téma přepsalo čtyři barvy a pozadí i aréna zůstaly stejné. Teď má každé téma vlastní pozadí stránky a nános v aréně;
   snímek je čistá funkce času (`frame`, `arenaFrame`: jen fillRect + fillStyle + globalAlpha, žádná náhoda), takže jde měřit.

   Ověřuje se:
     1. katalog: každé téma z obchodu (kromě výchozího) má pozadí stránky i nános v aréně a naopak (nic nechybí, nic nepřebývá),
        každé má jméno a popis pohybu
     2. cena: při každém rozměru a čase nejvýš 260 volání fillRect (stránka) a 200 (aréna) — cenu nese počet volání, ne plocha
     3. správnost kreslení: konečné souřadnice, průhlednost 0–1, barvy `#rrggbb`, žádné obří obdélníky mimo plátno
     4. determinismus: týž čas dá týž snímek (bez Math.random), snímek pro reduced-motion (`STILL`) je pevný
     5. pohyb: snímky v různých časech se liší (u každého tématu, stránka i aréna)
     6. odlišnost: žádná dvě témata nevykreslí stejný snímek
     7. neprůstřelnost: neznámé téma nic nenakreslí a nespadne
   Sabotáže (6): náhoda ve snímku, průhlednost nad 1, výbuch počtu volání, zmrzlý čas, dvě totožná témata, chybějící nános v aréně.
   Spusť: node tests/rpg-temata.test.cjs
   ═════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-temata.js'), 'utf8');
const WALLET = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-wallet.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function nacti(src) {
  const w = {};
  new Function('window', src)(w);
  return w.RPGTemata;
}

/* plátno, které si pamatuje, co se na něj kreslilo */
function zaznam() {
  const log = []; let alfa = 1, barva = '#000';
  return {
    log,
    c: {
      set globalAlpha(v) { alfa = v; }, get globalAlpha() { return alfa; },
      set fillStyle(v) { barva = v; }, get fillStyle() { return barva; },
      fillRect(x, y, w, h) { log.push([x, y, w, h, alfa, barva]); },
      save() {}, restore() {}
    }
  };
}
const otisk = log => log.map(r => r.join(',')).join('|');

const ROZMERY = [['tablet na šířku', 197, 137], ['iPad Pro', 228, 171], ['telefon', 98, 211]];
const ARENY = [[638, 380, 175, 4], [372, 300, 138, 2], [360, 240, 110, 2]];
const CASY = [0, 330, 700, 1300, 1900, 2800, 4200, 6100, 9300, 15000, 31000];
const STROP_STRANKA = 260, STROP_ARENA = 200;

function kontroly(src) {
  const T = nacti(src), chyby = [];
  const f = t => chyby.push(t);
  const klice = T.KEYS;

  /* 1. katalog obchodu */
  const polozky = [...WALLET.matchAll(/\{\s*id:\s*'(theme-[a-z]+)'[^}]*?cat:\s*'theme'[^}]*?cssKey:\s*'([a-z]*)'/g)].map(m => ({ id: m[1], css: m[2] }));
  const bezVychoziho = polozky.filter(p => p.css).map(p => p.css).sort();
  if (bezVychoziho.length !== 7) f('katalog obchodu nemá 7 témat s cssKey, ale ' + bezVychoziho.length);
  if (JSON.stringify([...klice].sort()) !== JSON.stringify(bezVychoziho)) f('témata modulu ' + klice.sort().join(',') + ' ≠ katalog ' + bezVychoziho.join(','));
  for (const k of klice) {
    if (!T.hasPage(k)) f(k + ': chybí pozadí stránky');
    if (!T.hasArena(k)) f(k + ': chybí nános v aréně');
    if (!T.META[k] || !T.META[k].name || !T.META[k].anim) f(k + ': chybí jméno nebo popis pohybu v META');
  }

  /* 2.–5. kresba */
  const sada = {};     // otisky pro porovnání témat
  for (const k of klice) {
    let maxS = 0, maxA = 0, pohybS = new Set(), pohybA = new Set();
    for (const [nm, W, H] of ROZMERY) {
      for (const t of CASY) {
        const z = zaznam(); T.frame(z.c, k, t, W, H);
        maxS = Math.max(maxS, z.log.length);
        for (const r of z.log) {
          if (!r.every(Number.isFinite) && !r.slice(0, 5).every(Number.isFinite)) f(k + ' ' + nm + ' t=' + t + ': neukončené číslo ' + r);
          if (r[4] < 0 || r[4] > 1) f(k + ' ' + nm + ' t=' + t + ': průhlednost ' + r[4]);
          if (!/^#[0-9a-f]{6}$/.test(r[5])) f(k + ' ' + nm + ' t=' + t + ': barva ' + r[5]);
          if (r[2] > W * 2 || r[3] > H * 2) f(k + ' ' + nm + ' t=' + t + ': obří obdélník ' + r);
        }
        const z2 = zaznam(); T.frame(z2.c, k, t, W, H);
        if (otisk(z.log) !== otisk(z2.log)) f(k + ' ' + nm + ' t=' + t + ': snímek není deterministický');
        if (nm === 'tablet na šířku') pohybS.add(otisk(z.log));
      }
    }
    for (const [W, H, hz, u] of ARENY) {
      for (const t of CASY) {
        const z = zaznam(); T.arenaFrame(z.c, k, t, W, H, hz, u);
        maxA = Math.max(maxA, z.log.length);
        for (const r of z.log) {
          if (!r.slice(0, 5).every(Number.isFinite)) f(k + ' aréna ' + W + ' t=' + t + ': neukončené číslo ' + r);
          if (r[4] < 0 || r[4] > 1) f(k + ' aréna ' + W + ' t=' + t + ': průhlednost ' + r[4]);
          if (!/^#[0-9a-f]{6}$/.test(r[5])) f(k + ' aréna ' + W + ' t=' + t + ': barva ' + r[5]);
          if (r[2] > W * 2 || r[3] > H * 2) f(k + ' aréna ' + W + ' t=' + t + ': obří obdélník ' + r);
        }
        const z2 = zaznam(); T.arenaFrame(z2.c, k, t, W, H, hz, u);
        if (otisk(z.log) !== otisk(z2.log)) f(k + ' aréna ' + W + ' t=' + t + ': snímek není deterministický');
        if (W === 638) pohybA.add(otisk(z.log));
      }
    }
    if (maxS > STROP_STRANKA) f(k + ': stránka má ' + maxS + ' volání (strop ' + STROP_STRANKA + ')');
    if (maxA > STROP_ARENA) f(k + ': aréna má ' + maxA + ' volání (strop ' + STROP_ARENA + ')');
    if (maxS < 10) f(k + ': stránka nekreslí skoro nic (' + maxS + ' volání)');
    if (maxA < 5) f(k + ': aréna nekreslí skoro nic (' + maxA + ' volání)');
    if (pohybS.size < CASY.length - 2) f(k + ': pozadí stránky se skoro nehýbe (' + pohybS.size + ' různých snímků z ' + CASY.length + ')');
    if (pohybA.size < CASY.length - 2) f(k + ': nános v aréně se skoro nehýbe (' + pohybA.size + ' různých snímků z ' + CASY.length + ')');
    const zs = zaznam(); T.frame(zs.c, k, T.STILL, 197, 137);
    const za = zaznam(); T.arenaFrame(za.c, k, T.STILL, 638, 380, 175, 4);
    sada[k] = [otisk(zs.log), otisk(za.log)];
  }

  /* 6. odlišnost */
  [['stránku', 0], ['arénu', 1]].forEach(([co, i]) => {
    const videne = {};
    for (const k of klice) { if (videne[sada[k][i]]) f(k + ' a ' + videne[sada[k][i]] + ' vykreslí totéž (' + co + ')'); videne[sada[k][i]] = k; }
  });

  /* 7. neprůstřelnost */
  for (const x of ['', 'neexistuje', '__proto__', 'constructor', 'toString']) {
    const z = zaznam();
    try { T.frame(z.c, x, 1000, 100, 100); T.arenaFrame(z.c, x, 1000, 300, 200, 90, 3); } catch (e) { f('neznámé téma "' + x + '" vyhodilo ' + e.message); }
    if (z.log.length) f('neznámé téma "' + x + '" něco nakreslilo (' + z.log.length + ' volání)');
    if (T.arenaFx(x)) f('neznámé téma "' + x + '" dalo funkci pro arénu');
  }
  return chyby;
}

console.log('\n── Témata RPG: čistá kresba ──\n');
const skutecne = kontroly(SRC);
ok(skutecne.length === 0, 'skutečný modul projde všemi kontrolami', skutecne.slice(0, 6).join(' | '));
console.log('  skutečný modul: ' + (skutecne.length ? skutecne.length + ' nálezů' : 'bez nálezu'));

/* sabotáže: musí být ověřeno, že se opravdu aplikovaly, a že je kontroly chytí */
function sabotaz(jmeno, zmena, hledane) {
  const src = zmena(SRC);
  const aplikovano = src !== SRC;
  ok(aplikovano, 'sabotáž „' + jmeno + '“ se aplikovala');
  if (!aplikovano) return;
  const c = kontroly(src);
  ok(c.length > 0 && (!hledane || c.some(t => hledane.test(t))), 'sabotáž „' + jmeno + '“ je chycena', c.length ? c[0] : 'prošla bez nálezu');
}
sabotaz('náhoda ve snímku', s => s.replace('function rnd(s, i) {', 'function rnd(s, i) { return Math.random();'), /deterministick/);
sabotaz('průhlednost nad 1', s => s.replace('c.globalAlpha = a == null ? 1 : a;', 'c.globalAlpha = a == null ? 1 : a * 8;'), /průhlednost/);
sabotaz('výbuch počtu volání', s => s.replace('rain(c, W, H, s, 10, 3, 0.55, 0, 1);', 'rain(c, W, H, s, 10, 1, 1, 0, 1);'), /volání/);
sabotaz('zmrzlý čas', s => s.split('const s = t / 1000;').join('const s = 0;'), /nehýbe/);
sabotaz('dvě totožná témata', s => s.replace('    violet(c, t, W, H) {', '    violet(c, t, W, H) { return PAGE.matrix(c, t, W, H);'), /vykreslí totéž/);
sabotaz('chybějící nános v aréně', s => s.replace('    leto(c, t, W, H, hz, u) {', '    letoX(c, t, W, H, hz, u) {'), /chybí nános/);

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
