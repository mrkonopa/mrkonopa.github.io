/* ═════════════════════════════════════════════════════════════════════
   Mazlíčci z obchodu (`projects/rpg-mazlicci.js`) — čistá část bez prohlížeče.

   Mazlíček se kreslí do plátna arény, obchodu i profilu. Dokud je kresba čistá funkce času (jen fillRect, žádná náhoda,
   žádné časovače), nemůže zasáhnout do ovládání boje — tohle je to, co se tu hlídá, a vedle toho že sprity vypadají tak,
   jak mají.

   Ověřuje se:
     1. katalog: mazlíčci modulu = mazlíčci v obchodě (`cat: 'pet'`) = sprity sponky (jinak by koupený mazlíček v aréně
        chyběl nebo by sponka ukázala jiného)
     2. data: každá mřížka má stejně dlouhé řádky (14), každý znak je v paletě, oba idle snímky se liší, tělo je souměrné
     3. cena: nejvýš 120 volání fillRect na snímek při každém stavu, času a měřítku (3–5); naměřeno 48–101 (sova nejvíc),
        svět arény samotný 694–1 689 volání, mazlíček tedy přidává nejvýš ~15 % a nahrazuje parťáka
     4. správnost kresby: konečné souřadnice, platné barvy, vše v rozumných mezích kolem sprite
     5. determinismus: týž vstup dá týž snímek (žádné Math.random)
     6. reakce: klid, útok, zásah (bílý záblesk), vítězství a obava se liší; mrknutí mění oči
     7. reduced-motion: žádné houpání ani částice, snímek nezávisí na čase ani stavu
     8. mapování stavu hry (`stav`) a `arena()` — stav se počítá od okamžiku změny
     9. neprůstřelnost: neznámé id (`__proto__`, `constructor`, …) nic nenakreslí
   Sabotáže (8): náhoda ve snímku, výbuch počtu volání, znak mimo paletu, řádek jiné šířky, ignorovaný reduced-motion,
   skok bez pohybu, přejmenovaný mazlíček, záblesk navždy.
   Spusť: node tests/rpg-mazlicci.test.cjs
   ═════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-mazlicci.js'), 'utf8');
const WALLET = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-wallet.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function nacti(src) { const w = {}; new Function('window', src)(w); return w.RPGMazlicci; }
function zaznam() {
  const log = []; let barva = '#000';
  return { log, c: { set fillStyle(v) { barva = v; }, get fillStyle() { return barva; }, fillRect(x, y, w, h) { log.push([x, y, w, h, barva]); } } };
}
const otisk = log => log.map(r => r.join(',')).join('|');
const STAVY = ['idle', 'cheer', 'flinch', 'victory', 'worry'];
const CASY = [0, 350, 700, 1300, 2000, 3200, 3400, 5000];
const VX = 100, FEET = 200;

function kontroly(src) {
  const M = nacti(src), chyby = [], f = t => chyby.push(t);
  const ids = M.IDS;

  /* 1. katalog */
  const wallet = [...WALLET.matchAll(/\{\s*id:\s*'(pet-[a-z-]+)'[^}]*?cat:\s*'pet'/g)].map(m => m[1]).sort();
  const sponka = [...WALLET.matchAll(/^\s*'(pet-[a-z-]+)':\s*\{\s*pal:/gm)].map(m => m[1]).sort();
  const modul = ids.slice().sort();
  if (wallet.length !== 7) f('obchod nemá 7 mazlíčků, ale ' + wallet.length);
  if (JSON.stringify(modul) !== JSON.stringify(wallet)) f('mazlíčci modulu (' + modul.join(',') + ') ≠ obchod (' + wallet.join(',') + ')');
  if (JSON.stringify(modul) !== JSON.stringify(sponka)) f('mazlíčci modulu ≠ sprity sponky (' + sponka.join(',') + ')');
  ids.forEach(id => { if (!M.META[id] || !M.META[id].name || !M.META[id].anim) f(id + ': chybí jméno nebo popis pohybu'); if (!M.shot(id)) f(id + ': chybí barva střely'); });

  const idle = {};
  for (const id of ids) {
    /* 2. data */
    const sz = M.size(id), pal = M.palette(id), A = M.rows(id, 0), B = M.rows(id, 1);
    if (!sz || sz.cols !== 14 || sz.rows < 11 || sz.rows > 14) f(id + ': rozměr ' + JSON.stringify(sz) + ' (čekáno 14 × 11–14)');
    if (!A || !B || A.length !== B.length || A.length !== (sz && sz.rows)) f(id + ': snímky nemají stejný počet řádků');
    for (const [jm, G] of [['A', A], ['B', B]]) (G || []).forEach((r, i) => {
      if (r.length !== (sz && sz.cols)) f(id + ' ' + jm + ' řádek ' + i + ': šířka ' + r.length + ' místo ' + (sz && sz.cols));
      for (const ch of r) if (ch !== '.' && !Object.prototype.hasOwnProperty.call(pal || {}, ch)) { f(id + ' ' + jm + ' řádek ' + i + ': znak „' + ch + '“ není v paletě'); break; }
    });
    if (A && B && A.join('|') === B.join('|')) f(id + ': oba idle snímky jsou stejné (nic se nehýbe)');
    if (A) {
      const sym = A.filter(r => r === r.split('').reverse().join('')).length;
      if (sym < A.length - 5) f(id + ': jen ' + sym + ' z ' + A.length + ' řádků je souměrných (ocas smí rozbít nejvýš 5)');
    }

    /* 3.–5. kresba */
    let maxVol = 0;
    for (const S of [3, 4, 5]) for (const st of STAVY) for (const t of CASY) for (const tS of [0, 110, 230, 500]) {
      const z = zaznam(); const res = M.frame(z.c, id, { x: VX, feet: FEET, S, t, state: st, tS, rm: false });
      maxVol = Math.max(maxVol, z.log.length);
      const w = sz ? sz.cols * S : 0, h = sz ? sz.rows * S : 0;
      if (!res || !Number.isFinite(res.x) || !Number.isFinite(res.y)) f(id + ': frame nevrátil střed');
      for (const r of z.log) {
        if (!r.slice(0, 4).every(Number.isFinite)) { f(id + ' ' + st + ' t=' + t + ': neukončené číslo ' + r); break; }
        if (!/^(#[0-9a-f]{6}|rgba\(\d+,\d+,\d+,[01](\.\d+)?\))$/.test(r[4])) { f(id + ' ' + st + ': barva ' + r[4]); break; }
        if (r[0] < VX - 4 * S || r[0] + r[2] > VX + w + 4 * S || r[1] < FEET - h - 9 * S || r[1] + r[3] > FEET + S) { f(id + ' ' + st + ' S=' + S + ' t=' + t + ': kresba mimo meze ' + r); break; }
      }
      /* 5. determinismus */
      const z2 = zaznam(); M.frame(z2.c, id, { x: VX, feet: FEET, S, t, state: st, tS, rm: false });
      if (otisk(z.log) !== otisk(z2.log)) { f(id + ' ' + st + ' t=' + t + ': snímek není deterministický'); break; }
    }
    if (maxVol > 120) f(id + ': ' + maxVol + ' volání fillRect (strop 120)');
    if (maxVol < 30) f(id + ': kreslí podezřele málo (' + maxVol + ' volání)');

    /* 6. reakce */
    const snap = (st, tS, t) => { const z = zaznam(); M.frame(z.c, id, { x: VX, feet: FEET, S: 4, t: t == null ? 900 : t, state: st, tS: tS || 0, rm: false }); return z.log; };
    const klid = otisk(snap('idle', 0, 900));
    const cheer = otisk(snap('cheer', 230)), zasah = snap('flinch', 50), zasah2 = otisk(snap('flinch', 160)), vit = otisk(snap('victory', 125)), obava = otisk(snap('worry', 300));
    if (klid === cheer) f(id + ': útok se od klidu neliší (mazlíček nezaplesá)');
    if (klid === zasah2) f(id + ': zásah se od klidu neliší (mazlíček neuhne)');
    if (klid === vit) f(id + ': vítězství se od klidu neliší');
    if (klid === obava) f(id + ': obava se od klidu neliší');
    /* výška těla (nejvyšší pokreslený bod, bez stínu a částic): skok musí zvednout, zásah snížit */
    const vrch = log => Math.min(...log.filter(r => /^#/.test(r[4])).map(r => r[1]));
    const v0 = vrch(snap('idle', 0, 900));
    if (vrch(snap('cheer', 230)) > v0 - 8) f(id + ': při útoku mazlíček nevyskočí (výška těla ' + vrch(snap('cheer', 230)) + ' proti klidu ' + v0 + ')');
    if (vrch(snap('victory', 125)) > v0 - 8) f(id + ': po vítězství mazlíček nevyskočí');
    if (vrch(snap('flinch', 100)) < v0 + 4) f(id + ': při zásahu se mazlíček nestlačí (výška těla ' + vrch(snap('flinch', 100)) + ' proti klidu ' + v0 + ')');
    const telo = zasah.filter(r => r[4] === '#ffffff').length;
    if (telo < 5) f(id + ': při zásahu chybí bílý záblesk (' + telo + ' bílých obdélníků)');
    if (otisk(snap('flinch', 200)).includes('#ffffff')) f(id + ': záblesk po zásahu nezmizel (bílá i při tS = 200 ms)');
    if (otisk(snap('idle', 0, 3000)) === otisk(snap('idle', 0, 3200))) f(id + ': mrknutí nic nemění');
    idle[id] = klid;

    /* 7. reduced-motion */
    const rmSnap = (t, st, tS) => { const z = zaznam(); M.frame(z.c, id, { x: VX, feet: FEET, S: 4, t, state: st, tS, rm: true }); return otisk(z.log); };
    const r0 = rmSnap(0, 'idle', 0);
    for (const [t, st, tS] of [[5000, 'cheer', 230], [9999, 'flinch', 50], [3200, 'victory', 125], [4000, 'worry', 300], [1400, 'idle', 0]])
      if (rmSnap(t, st, tS) !== r0) { f(id + ': pod reduced-motion se snímek mění (t=' + t + ', ' + st + ')'); break; }
    if (r0.split('|').slice(1).some(r => /rgba/.test(r))) f(id + ': pod reduced-motion se kreslí částice');
  }

  /* odlišnost mazlíčků */
  const videno = {};
  for (const id of ids) { if (videno[idle[id]]) f(id + ' a ' + videno[idle[id]] + ' vypadají stejně'); videno[idle[id]] = id; }

  /* 8. stav hry */
  const T = [[['idle', 'idle', 1], 'idle'], [['windup', 'idle', 1], 'cheer'], [['slash', 'idle', 1], 'cheer'], [['shoot', 'idle', 1], 'cheer'], [['cast', 'idle', 1], 'cheer'],
    [['hit', 'idle', 1], 'flinch'], [['idle', 'defeat', 1], 'victory'], [['hit', 'defeat', 1], 'victory'], [['idle', 'idle', 0.3], 'worry'], [['idle', 'idle', undefined], 'idle'], [['slash', 'idle', 0.2], 'cheer']];
  for (const [a, ocek] of T) { const v = M.stav(...a); if (v !== ocek) f('stav(' + a.join(',') + ') = ' + v + ', čekáno ' + ocek); }
  {
    const fn = M.arena(ids[0]); const z = zaznam();
    if (typeof fn !== 'function' || fn.shot !== M.shot(ids[0])) f('arena() nevrací funkci s barvou střely');
    const call = (now, hero) => { const q = zaznam(); const c = fn(q.c, { x: VX, feet: FEET, S: 4, now, rm: false, hero, boss: 'idle', hpFrac: 1 }); return { log: otisk(q.log), c }; };
    const a0 = call(1000, 'idle'), a1 = call(2000, 'slash'), a2 = call(2230, 'slash');
    if (!a0.c || !Number.isFinite(a0.c.x)) f('arena() nevrací střed mazlíčka');
    if (a1.log === a2.log) f('arena(): skok při útoku se v čase nemění (stav se nepočítá od okamžiku změny)');
    void z;
  }

  /* 9. neprůstřelnost */
  for (const x of ['', 'neexistuje', '__proto__', 'constructor', 'toString', 'hasOwnProperty', null, undefined, 5, {}]) {
    const z = zaznam();
    let res; try { res = M.frame(z.c, x, { x: 0, feet: 100, S: 4, t: 0, state: 'idle', tS: 0, rm: false }); } catch (e) { f('neznámé id ' + String(x) + ' vyhodilo ' + e.message); }
    if (res || z.log.length) f('neznámé id ' + String(x) + ' něco nakreslilo');
    if (M.has(x) || M.arena(x) || M.size(x) || M.rows(x, 0) || M.shot(x) || M.mount(null, x)) f('neznámé id ' + String(x) + ' prošlo jako mazlíček');
  }
  return chyby;
}

console.log('\n── Mazlíčci: čistá kresba ──\n');
const skutecne = kontroly(SRC);
ok(skutecne.length === 0, 'skutečný modul projde všemi kontrolami', skutecne.slice(0, 6).join(' | '));
console.log('  skutečný modul: ' + (skutecne.length ? skutecne.length + ' nálezů' : 'bez nálezu'));

function sabotaz(jm, zmena, rx) {
  const src = zmena(SRC), apl = src !== SRC;
  ok(apl, 'sabotáž „' + jm + '“ se aplikovala');
  if (!apl) return;
  let c; try { c = kontroly(src); } catch (e) { c = ['VÝJIMKA: ' + e.message]; }
  ok(c.length > 0 && (!rx || c.some(t => rx.test(t))), 'sabotáž „' + jm + '“ je chycena', c.length ? c[0] : 'prošla bez nálezu');
}
sabotaz('náhoda ve snímku', s => s.replace("const k = rm ? 0 : (Math.floor(t / 650) % 2);", "const k = rm ? 0 : (Math.floor(t / 650 + Math.random()) % 2);"), /deterministick/);
sabotaz('výbuch počtu volání', s => s.replace('const n = vesel ? em.length * 2 : em.length;', 'const n = vesel ? em.length * 40 : em.length * 20;'), /volání fillRect/);
sabotaz('znak mimo paletu', s => s.replace("'.KdBcvcc'", "'.KdBcvcQ'").replace("'KdBcvcc'", "'KdBcvcQ'"), /není v paletě/);
sabotaz('řádek jiné šířky', s => s.replace("B: { 7: 'KBBcvccccvcBBK'", "B: { 7: 'KBBcvccccvcBBKK'"), /šířka/);
sabotaz('ignorovaný reduced-motion', s => s.replace('    if (rm) return;\n    const gw = p.gw;', '    const gw = p.gw;'), /reduced-motion/);
sabotaz('skok bez pohybu', s => s.replace("dy = -Math.round(Math.sin(p * Math.PI) * S * 3.2); }", "dy = 0; }"), /nevyskočí/);
sabotaz('přejmenovaný mazlíček', s => s.replace("'pet-kocka': {", "'pet-kocour': {"), /≠ obchod/);
sabotaz('záblesk navždy', s => s.replace('flash = tS < 110 ? 1 : 0;', 'flash = 1;'), /záblesk po zásahu nezmizel/);

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
