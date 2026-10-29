/* ═══════════════════════════════════════════════════════════════════════════
   Aura a štítek jména v aréně (`RPGKosmetika.arenaAura`) — čistá část, bez prohlížeče.

   Proč: rámy se ukazovaly jen v profilu a v obchodě, ale dítě tráví čas v boji (Vojtův pokyn 29. 10. 2026:
   odměny mají mít „oomph“). Aura se kreslí do plátna arény PŘED hrdinou, takže ho nikdy nezakryje;
   štítek se jménem stojí nad hlavou.

   Pravidla (počítají se ze skutečných volání kreslicího kontextu — napodobenina `ctx` je zaznamená):
     1. nic nenasazeno (bez rámu, bez barvy jména) → `null`, v aréně se nezmění ani pixel
     2. všech 10 rámů: drawer je funkce, v 60 časech nikdy nevyhodí výjimku, počet kreslicích volání je 6–70
        (cenu kreslení nese POČET VOLÁNÍ, ne plocha — viz CLAUDE.md), všechny souřadnice jsou konečná čísla
     3. barva je z rámu: první barva záře (`glow`) se objeví ve výplni; rámy s duhou (`*hue`) mění barvu v čase
     4. POHYB: s pohybem se volání mezi časy liší, pod reduced-motion je výstup v různých časech SHODNÝ
        (a volání je méně: žádná světýlka)
     5. DETERMINISMUS: stejný vstup = stejná volání (žádné Math.random)
     6. ŠTÍTEK: text je nejvýš 14 znaků bez řídicích znaků, písmo ≥ 12 px, štítek leží celý v plátně
        (i u hrdiny u levého okraje na úzkém plátně) a nad hlavou hrdiny; bez místa nad hlavou se nekreslí
     7. aura sahá jen kolem hrdiny: žádné čtvereček aury (≤ 10 px) neleží dál než 1,3 × výška hrdiny od jeho středu
   Sabotáže: aura bez pohybu, text bez ořezu, štítek mimo plátno.
   Spusť: node tests/rpg-aura.test.cjs
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'projects', 'rpg-kosmetika.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function nacti(zdroj) {
  const win = { document: undefined };
  win.window = win;
  vm.runInNewContext(zdroj, Object.assign(win, { Math, Uint8ClampedArray, console, setInterval() {}, clearInterval() {}, performance: { now: () => 0 } }));
  return win.RPGKosmetika;
}

/* napodobenina plátna: zaznamená volání a stav (fillStyle, globalAlpha, font) v okamžiku volání */
function fakeCtx(W) {
  const log = [];
  const c = {
    canvas: { width: W || 400 }, fillStyle: '#000', strokeStyle: '#000', globalAlpha: 1, font: '', lineWidth: 1, textAlign: 'start', textBaseline: 'alphabetic',
    save() {}, restore() {},
    fillRect(x, y, w, h) { log.push({ k: 'rect', x, y, w, h, fs: String(this.fillStyle), a: this.globalAlpha }); },
    strokeRect(x, y, w, h) { log.push({ k: 'stroke', x, y, w, h, ss: String(this.strokeStyle) }); },
    fillText(t, x, y) { log.push({ k: 'text', t, x, y, font: this.font, fs: String(this.fillStyle) }); },
    measureText(t) { return { width: String(t).length * 7.2 }; },
    createRadialGradient() { return { addColorStop() { log.push({ k: 'grad' }); } }; }
  };
  c.log = log;
  return c;
}
const HERO = (over) => Object.assign({ x: 40, y: 40, w: 100, h: 140, feet: 180, S: 5, now: 1234, rm: false }, over || {});
const volej = (drawer, g, W) => { const c = fakeCtx(W); drawer(c, g); return c.log; };
const kons = l => JSON.stringify(l);

const K = nacti(SRC);
const IDS = K.ids();

/* ── 1. nic nenasazeno ── */
ok(K.arenaAura(null, {}) === null, 'bez rámu a bez barvy jména má být null');
ok(K.arenaAura('border-neexistuje', { name: 'Vojta' }) === null, 'neznámý rám bez barvy jména má být null');
ok(typeof K.arenaAura(null, { name: 'Vojta', nameColor: '#ffd24a' }) === 'function', 'jen barva jména má dát štítek');
ok(typeof K.arenaAura('border-gold', {}) === 'function', 'jen rám má dát auru');

/* ── 2.–5. všech 10 rámů ── */
ok(IDS.length === 10, 'rámů je ' + IDS.length + ' (čekáno 10)');
let casu = 0;
for (const id of IDS) {
  const d = K.arenaAura(id, { name: 'Vojta' });
  ok(typeof d === 'function', id + ': drawer není funkce');
  if (typeof d !== 'function') continue;
  let nejmin = 1e9, nejvic = 0, konecne = true, vyjimka = null;
  for (let t = 0; t < 60; t++) {
    let l; try { l = volej(d, HERO({ now: t * 137 })); } catch (e) { vyjimka = e.message; break; }
    casu++;
    const n = l.filter(x => x.k !== 'grad').length;
    nejmin = Math.min(nejmin, n); nejvic = Math.max(nejvic, n);
    for (const r of l) if (r.k === 'rect' && ![r.x, r.y, r.w, r.h].every(Number.isFinite)) konecne = false;
  }
  ok(!vyjimka, id + ': drawer vyhodil výjimku', vyjimka);
  ok(nejmin >= 6 && nejvic <= 70, id + ': počet kreslicích volání ' + nejmin + '–' + nejvic + ' (čekáno 6–70)');
  ok(konecne, id + ': nekonečná nebo NaN souřadnice');
  /* barva z rámu */
  const def = K.FRAMES[id], hue = Object.keys(def.pal).some(k => def.pal[k] === '*hue');
  const a = volej(d, HERO({ now: 1000 })), b = volej(d, HERO({ now: 6000 }));
  const barva = def.glow[0].toLowerCase();
  if (!hue) ok(a.some(r => r.k === 'rect' && r.fs.toLowerCase() === barva), id + ': ve výplni chybí barva záře ' + barva);
  else ok(kons(a.filter(r => r.k === 'rect').map(r => r.fs)) !== kons(b.filter(r => r.k === 'rect').map(r => r.fs)), id + ': duhový rám nemění barvu');
  /* pohyb */
  ok(kons(volej(d, HERO({ now: 1000 }))) !== kons(volej(d, HERO({ now: 1500 }))), id + ': aura se nehýbe');
  const r1 = volej(d, HERO({ now: 1000, rm: true })), r2 = volej(d, HERO({ now: 7777, rm: true }));
  ok(kons(r1) === kons(r2), id + ': pod reduced-motion se aura hýbe');
  ok(r1.filter(x => x.k === 'rect').length < a.filter(x => x.k === 'rect').length, id + ': pod reduced-motion nejsou menší počet čtverečků');
  /* determinismus */
  ok(kons(volej(d, HERO({ now: 4321 }))) === kons(volej(d, HERO({ now: 4321 }))), id + ': aura není deterministická');
  /* 7. dosah: čtverečky aury (do 10 px) blízko hrdiny */
  const cx = 90, cy = 110;
  const daleko = a.filter(r => r.k === 'rect' && r.w <= 10 && r.h <= 10 && Math.hypot(r.x - cx, r.y - cy) > 1.3 * 140);
  ok(daleko.length === 0, id + ': ' + daleko.length + ' čtverečků aury je daleko od hrdiny');
}
ok(casu === 600, 'změřeno ' + casu + ' časů (čekáno 600)');

/* ── 6. štítek ── */
{
  const d = K.arenaAura('border-gold', { name: 'Vojta' });
  const l = volej(d, HERO());
  const t = l.filter(x => x.k === 'text');
  ok(t.length === 1 && t[0].t === 'Vojta', 'štítek: text „Vojta“ chybí (' + JSON.stringify(t.map(x => x.t)) + ')');
  ok(t[0] && /^700 1[2-9]px/.test(t[0].font), 'štítek: písmo ' + (t[0] && t[0].font) + ' je menší než 12 px');
  const dlouhy = volej(K.arenaAura('border-gold', { name: 'Ctirad-Přemysl-Vojtěch-Konopa\u0007\u001f' }), HERO()).filter(x => x.k === 'text')[0];
  ok(dlouhy && dlouhy.t.length <= 14 && !/[\u0000-\u001f]/.test(dlouhy.t), 'štítek: dlouhé jméno / řídicí znaky: „' + (dlouhy && dlouhy.t) + '“');
  /* štítek leží celý v plátně a nad hlavou */
  for (const W of [280, 340, 400, 572]) for (const x0 of [0, 14, 20, W - 110]) {
    const g = HERO({ x: x0 });
    const ll = volej(K.arenaAura('border-gold', { name: x0 % 2 ? 'Vojta' : 'Ctirad-Přemysl' }), g, W);
    const pozadi = ll.filter(r => r.k === 'rect' && r.fs.indexOf('rgba(6,10,22') === 0)[0];
    ok(pozadi && pozadi.x >= 2 && pozadi.x + pozadi.w <= W - 2, 'štítek mimo plátno: W ' + W + ', hrdina x ' + x0 + ' (' + (pozadi && pozadi.x + '–' + (pozadi.x + pozadi.w)) + ')');
    ok(pozadi && pozadi.y + pozadi.h <= g.feet - g.h, 'štítek není nad hlavou hrdiny (W ' + W + ')');
  }
  /* bez místa nad hlavou se nekreslí */
  const nizko = volej(K.arenaAura('border-gold', { name: 'Vojta' }), HERO({ feet: 160, h: 150 }));
  ok(nizko.filter(x => x.k === 'text').length === 0, 'štítek se nakreslil, i když nad hlavou není místo');
}

/* ── sabotáže: test musí spadnout ── */
console.log('── Sabotáže: test musí spadnout ──');
function sab(nazev, f) {
  const zdroj = f(SRC);
  if (zdroj === SRC) { ok(false, 'sabotáž „' + nazev + '“ se neaplikovala'); return; }
  const ctxy = nacti(zdroj);
  const before = [pass, fail];
  /* spustí zjednodušenou kontrolu stejným způsobem jako výše */
  let chyceno = false;
  try {
    const d = ctxy.arenaAura('border-gold', { name: 'Ctirad-Přemysl-Vojtěch-Konopa' });
    const a = kons(volej(d, HERO({ now: 1000 }))), b = kons(volej(d, HERO({ now: 1500 })));
    const r1 = kons(volej(d, HERO({ now: 1000, rm: true }))), r2 = kons(volej(d, HERO({ now: 7777, rm: true })));
    const tx = volej(d, HERO()).filter(x => x.k === 'text')[0];
    const pz = volej(ctxy.arenaAura('border-gold', { name: 'Ctirad-Přemysl' }), HERO({ x: 0 }), 280).filter(r => r.k === 'rect' && r.fs.indexOf('rgba(6,10,22') === 0)[0];
    if (a === b) chyceno = true;
    if (r1 !== r2) chyceno = true;
    if (!tx || tx.t.length > 14) chyceno = true;
    if (!pz || pz.x < 2) chyceno = true;
  } catch (e) { chyceno = true; }
  pass = before[0]; fail = before[1];
  ok(chyceno, 'sabotáž „' + nazev + '“ je chycena');
}
sab('aura bez pohybu (čas se nepoužije)', t => t.replace('now = still ? 0 : g.now', 'now = 0'));
sab('jméno bez ořezu', t => t.replace(".slice(0, 14) : '';", " : '';"));
sab('štítek mimo plátno (bez ohraničení doleva)', t => t.replace("const px = Math.max(2, Math.min(W - pw - 2, Math.round(cx - pw / 2)));", "const px = Math.round(cx - pw / 2);"));
sab('pod reduced-motion se hýbe', t => t.replace('still = g.rm', 'still = false'));

console.log('\n' + (fail ? '❌' : '✅') + ' Aura v aréně: ' + pass + ' ✅, ' + fail + ' ❌');
process.exit(fail ? 1 : 0);
