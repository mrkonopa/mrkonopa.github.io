/* ═══════════════════════════════════════════════════════════════════════
   Pixelové rámy avatara (`projects/rpg-kosmetika.js`) — čistá část, bez prohlížeče.

   Proč: dosavadní rám byl `drop-shadow` na avataru 54×72 px (Vojtův lístek 29. 10. 2026: „frame border je slabý
   a není vidět“). Nový rám je pixelová kresba s pohybem; hlídá se, že to, co se do hry nasadí, je opravdu vidět,
   hýbe se, nepřekrývá hrdinu a že sedí na katalog obchodu.

   Pravidla (všechna se POČÍTAJÍ z vykreslených pixelů, ne z popisu):
     1. katalog: id rámů v modulu = id položek `border-*` v obchodě (`rpg-wallet.js`), žádný navíc a žádný chybí
     2. definice: b ≥ 4, c ≥ b, vzor okraje má b řádků stejné délky, rohová mřížka c × c, každý znak je v paletě,
        žádná magenta (#f0f)
     3. okraj je vyplněný (≥ 90 % pixelů pásu b px od okraje), střed zůstává volný (≤ 8 % nepřehledných
        mimo rohy — rám nesmí zakrýt hrdinu)
     4. VIDITELNOST (proti pozadí karty #0f1830, kroky 0, 7, 19): aspoň 30 % pixelů okraje má kontrast ≥ 3 : 1
        a 90. percentil ≥ 5,5 : 1 (je tam světlý akcent). Naměřeno nejméně 34 % a 6,27 : 1; průměr barev se NEPOUŽÍVÁ,
        protože tmavý obrys ho stáhne, i když rám svítí
     5. POHYB: každý rám se mezi kroky 0 a 1–40 liší aspoň o 12 pixelů; krok 0 je vždy stejný (reduced-motion)
     6. DETERMINISMUS: stejný krok = stejné pixely (žádné Math.random), otisky `tests/fixtures/kosmetika-golden.json`
        (přegeneruj `--update` až po pohledu na kontaktní arch)
   Sabotáže: poškozená paleta, odebraný pohyb, průhledný okraj.
   Spusť: node tests/rpg-kosmetika.test.cjs
   ═══════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-kosmetika.js'), 'utf8');
const GOLD = path.join(__dirname, 'fixtures', 'kosmetika-golden.json');
const UPDATE = process.argv.includes('--update');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function nacti(zdroj) {
  const win = { document: undefined };
  win.window = win;
  vm.runInNewContext(zdroj, Object.assign(win, { Math, Uint8ClampedArray, console, setInterval() {}, clearInterval() {}, performance: { now: () => 0 } }));
  return win.RPGKosmetika;
}
const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const kontrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const BG = [0x0f, 0x18, 0x30];

/* ── vyhodnocení jedné sady rámů (použito i pro sabotáže) ── */
function posud(K, popis) {
  const nalezy = []; let kontrol = 0;
  for (const id of K.ids()) {
    const d = K.FRAMES[id], P = d.edge[0].length;
    kontrol++;
    if (!(d.b >= 4 && d.c >= d.b)) nalezy.push(id + ': b/c mimo meze (' + d.b + '/' + d.c + ')');
    if (d.edge.length !== d.b || d.edge.some(r => r.length !== P)) nalezy.push(id + ': vzor okraje nemá b řádků stejné délky');
    if (d.corner.length !== d.c || d.corner.some(r => r.length !== d.c)) nalezy.push(id + ': rohová mřížka není c × c');
    const znaky = new Set((d.edge.join('') + d.corner.join('')).split('')); znaky.delete('.');
    for (const z of znaky) if (d.pal[z] == null) nalezy.push(id + ': znak „' + z + '“ není v paletě');
    for (const [z, v] of Object.entries(d.pal)) if (/^#f0?f0?f$/i.test(v) || /^#ff00ff$/i.test(v)) nalezy.push(id + ': magenta v paletě (' + z + ')');
    const W = 18 + 2 * d.b, H = 24 + 2 * d.b;
    const b0 = K.renderFrame(id, W, H, 0);
    // pás okraje a střed
    let pas = 0, pasOk = 0, stred = 0, stredOk = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4, a = b0[o + 3];
      const vPasu = x < d.b || y < d.b || x >= W - d.b || y >= H - d.b;
      const vRohu = (x < d.c || x >= W - d.c) && (y < d.c || y >= H - d.c);
      if (vPasu) { pas++; if (a > 0) pasOk++; }
      else if (!vRohu) { stred++; if (a > 0) stredOk++; }
    }
    kontrol += 3;
    if (pasOk / pas < 0.9) nalezy.push(id + ': okraj je vyplněný jen z ' + Math.round(100 * pasOk / pas) + ' %');
    if (stredOk / stred > 0.08) nalezy.push(id + ': rám zakrývá střed (' + Math.round(100 * stredOk / stred) + ' % nepřehledných)');
    const kts = [];
    for (const s of [0, 7, 19]) {
      const bs = K.renderFrame(id, W, H, s);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!(x < d.b || y < d.b || x >= W - d.b || y >= H - d.b)) continue;
        const o = (y * W + x) * 4; if (bs[o + 3] > 0) kts.push(kontrast([bs[o], bs[o + 1], bs[o + 2]], BG));
      }
    }
    kts.sort((p, q) => p - q);
    const podil = kts.filter(v => v >= 3).length / (kts.length || 1), p90 = kts[Math.floor(kts.length * 0.9)] || 0;
    kontrol++;
    if (podil < 0.30) nalezy.push(id + ': jen ' + Math.round(100 * podil) + ' % pixelů okraje má kontrast ≥ 3 : 1 proti kartě (< 30 %)');
    if (p90 < 5.5) nalezy.push(id + ': nejsvětlejší desetina okraje má kontrast jen ' + p90.toFixed(2) + ' : 1 (< 5,5), rám není vidět');
    // pohyb
    let nejvic = 0;
    for (let s = 1; s <= 40; s++) {
      const bs = K.renderFrame(id, W, H, s); let r = 0;
      for (let i = 0; i < bs.length; i++) if (bs[i] !== b0[i]) r++;
      nejvic = Math.max(nejvic, Math.round(r / 4));
    }
    kontrol++;
    if (nejvic < 12) nalezy.push(id + ': rám se nehýbe (nejvíc změněných pixelů ' + nejvic + ')');
    // determinismus
    const b0b = K.renderFrame(id, W, H, 0), b7a = K.renderFrame(id, W, H, 7), b7b = K.renderFrame(id, W, H, 7);
    kontrol++;
    if (Buffer.compare(Buffer.from(b0), Buffer.from(b0b)) !== 0 || Buffer.compare(Buffer.from(b7a), Buffer.from(b7b)) !== 0) nalezy.push(id + ': stejný krok dává jiné pixely');
  }
  return { nalezy, kontrol };
}

console.log('── Rámy avatara: katalog, definice, viditelnost, pohyb ──');
const K = nacti(SRC);
{
  // 1) katalog obchodu
  const wallet = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-wallet.js'), 'utf8');
  const obchod = [...wallet.matchAll(/id: '(border-[a-z]+)',\s*cat: 'border'/g)].map(m => m[1]).sort();
  const modul = K.ids().slice().sort();
  ok(obchod.length >= 10, 'v obchodě je ' + obchod.length + ' rámů (naměřeno 10)');
  ok(JSON.stringify(obchod) === JSON.stringify(modul), 'rámy v modulu se kryjí s katalogem obchodu',
     'obchod bez modulu: ' + obchod.filter(x => !modul.includes(x)).join(',') + ' | modul bez obchodu: ' + modul.filter(x => !obchod.includes(x)).join(','));
  // 2)–5)
  const r = posud(K);
  ok(r.kontrol >= 10 * 6, 'posouzeno dost kontrol: ' + r.kontrol);
  ok(r.nalezy.length === 0, 'všech ' + K.ids().length + ' rámů prošlo definicí, viditelností, pohybem i determinismem', r.nalezy.slice(0, 4).join(' | '));
  // 6) otisky
  const otisky = {};
  for (const id of K.ids()) {
    const d = K.FRAMES[id], W = 18 + 2 * d.b, H = 24 + 2 * d.b;
    for (const s of [0, 7, 19]) otisky[id + '@' + s] = crypto.createHash('sha256').update(Buffer.from(K.renderFrame(id, W, H, s))).digest('hex').slice(0, 16);
  }
  if (UPDATE) { fs.writeFileSync(GOLD, JSON.stringify(otisky, null, 1) + '\n'); console.log('  otisky zapsány: ' + Object.keys(otisky).length); }
  else {
    let zlate = {}; try { zlate = JSON.parse(fs.readFileSync(GOLD, 'utf8')); } catch (e) {}
    const spatne = Object.keys(otisky).filter(k => zlate[k] !== otisky[k]);
    ok(Object.keys(zlate).length === Object.keys(otisky).length, 'otisky pokrývají všech ' + Object.keys(otisky).length + ' kombinací (rám × krok)');
    ok(spatne.length === 0, 'otisky pixelů se nezměnily', spatne.slice(0, 3).join(', '));
  }
}

console.log('── Sabotáže: test musí spadnout ──');
{
  const sab = (nazev, upravit, ocekavane) => {
    const zdroj = upravit(SRC);
    if (zdroj === SRC) { ok(false, 'sabotáž „' + nazev + '“ se neaplikovala'); return; }
    let r; try { r = posud(nacti(zdroj)); } catch (e) { r = { nalezy: ['výjimka: ' + e.message] }; }
    ok(r.nalezy.length > 0 && (!ocekavane || r.nalezy.some(n => ocekavane.test(n))), 'sabotáž „' + nazev + '“ je chycena (' + r.nalezy.length + ' nálezů)', r.nalezy.slice(0, 2).join(' | '));
  };
  sab('znak mimo paletu', s => s.replace("edge: ['rrrrrrrr', 'vdddddcd', 'abbbbbbb', 'ssssssss']", "edge: ['rrrrrrrr', 'vdddddcd', 'abbbbbbb', 'sssssszz']"), /není v paletě/);
  sab('stříbrný rám bez pohybu', s => s.replace("fx: [{ k: 'sweep', w: 3, speed: 0.7, gap: 26, color: '#ffffff', amount: 0.85 }]", 'fx: []'), /nehýbe/);
  sab('tmavý okraj bez kontrastu', s => s.replace("pal: { r: '#171b23', d: '#f4f8ff', v: '#ffffff', c: '#c9d2e0', b: '#8e99ab', a: '#5a6577', s: '#2b323f' }", "pal: { r: '#0c1226', d: '#101a38', v: '#131f44', c: '#0f1a3a', b: '#0e1836', a: '#0d1730', s: '#0c1428' }"), /kontrast|není vidět/);
  sab('magenta v paletě', s => s.replace("v: '#ffffff', c: '#c9d2e0'", "v: '#ff00ff', c: '#c9d2e0'"), /magenta/);
  sab('rám zakrývá střed', s => s.replace("{ k: 'sparkle', n: 3, life: 8, color: '#ffffff', size: 1, seed: 11 }", "{ k: 'sparkle', n: 80, life: 40, color: '#ffffff', size: 7, seed: 11 }"), /zakrývá střed/);
}

console.log('\n' + (fail ? '❌' : '✅') + ' Rámy avatara: ' + pass + ' ✅, ' + fail + ' ❌');
process.exit(fail ? 1 : 0);
