/* ═══════════════════════════════════════════════════════════════════════════
   Efekty vítězství (`RPGVitezstvi`) — čistá část, bez prohlížeče.

   Proč: efekty z obchodu se dřív lišily jen barvou stínu nápisu a déšť emoji byl u všech stejný (změřeno 30. 10. 2026),
   takže „Ohňostroj“ za 1 800 kr žádný ohňostroj neukázal. Teď má každý z 7 efektů vlastní průběh; dva legendární
   (Výbuch bomby, Strom vítězství) jsou jen za životní úspěchy.

   Pravidla (počítají se ze skutečných volání kreslicího kontextu — napodobenina `ctx` je zaznamená):
     1. 7 efektů, každý má `META` (délka, načasování nápisu) a nápis skončí nejpozději s efektem
     2. snímek je ČISTÁ funkce: stejné `t` = stejná volání (žádné Math.random v kódu), jen fillRect / clearRect / fillStyle / globalAlpha
     3. cena kreslení nese POČET VOLÁNÍ (CLAUDE.md): nejvýš 300 na snímek (naměřeno nejvýš 252; aréna jich kreslí 700–1 700)
     4. souřadnice jsou konečná čísla, rozměry kladné, průhlednost v 0–1
     5. efekt se hýbe (snímky v t a t + 300 ms se liší), v „still“ čase něco kreslí a na konci je neviditelný
     6. všech 7 efektů se navzájem liší (v t = 900 ms i ve „still“ čase)
     7. katalog obchodu: ids modulu = položky kategorie „victory“ (kromě žádné chybějící), bomba a strom jsou `ach` (nekoupitelné),
        bomba je odměna za Bouřlivák, strom za Velmistr, třída nápisu (`cssKey`) má CSS v peněžence;
        odměna přidaná později se hráči, který úspěch už má, doplní (jinak by ji nikdy nedostal)
   Sabotáže: Math.random v efektu, nepřípustná průhlednost, efekt zaměněný za výchozí, strom nezmizí, bez zpětného doplnění odměny,
             prohozená odměna.
   Spusť: node tests/rpg-vitezstvi.test.cjs
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const P = path.join(__dirname, '..', 'projects');
const SRC = fs.readFileSync(path.join(P, 'rpg-vitezstvi.js'), 'utf8');
const WALLET = fs.readFileSync(path.join(P, 'rpg-wallet.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function nactiModul(zdroj) {
  const win = {}; win.window = win;
  vm.runInNewContext(zdroj, Object.assign(win, { Math, console, performance: { now: () => 0 } }));
  return win.RPGVitezstvi;
}
/* kreslicí kontext, který zná jen to, co modul smí použít; cokoli jiného vyhodí chybu */
function ctxZaznam() {
  const log = [];
  const povolene = new Set(['globalAlpha', 'fillStyle']);
  const c = new Proxy({ globalAlpha: 1, fillStyle: '#000' }, {
    get(t, k) {
      if (k === 'fillRect') return (x, y, w, h) => log.push([x, y, w, h, String(t.fillStyle), t.globalAlpha]);
      if (k === 'clearRect') return () => {};
      if (povolene.has(k)) return t[k];
      throw new Error('nepovolený přístup ke kontextu: ' + String(k));
    },
    set(t, k, v) { if (!povolene.has(k)) throw new Error('nepovolený zápis do kontextu: ' + String(k)); t[k] = v; return true; }
  });
  return { c, log };
}
const W = 295, H = 205;
function snimek(V, id, t) { const z = ctxZaznam(); V.frame(z.c, id, t, W, H); return z.log; }
const kons = l => JSON.stringify(l);

const V = nactiModul(SRC);
const IDS = V.IDS;

/* ── 1. soupis a načasování ── */
ok(IDS.length === 7, 'efektů je ' + IDS.length + ' (čekáno 7)');
for (const id of IDS) {
  const m = V.META[id];
  ok(!!m && m.dur >= 2400 && m.banner && m.banner.dur > 0 && m.still > 0, id + ': chybí META', JSON.stringify(m));
  if (m) ok(m.banner.delay + m.banner.dur <= m.dur + 200, id + ': nápis (' + (m.banner.delay + m.banner.dur) + ' ms) končí dlouho po efektu (' + m.dur + ' ms)');
}

/* ── 2.–5. každý efekt ── */
const statistika = [];
for (const id of IDS) {
  const m = V.META[id];
  let max = 0, vyjimka = null, spatne = 0, alfaMimo = 0;
  for (let t = 0; t <= m.dur; t += 50) {
    let l; try { l = snimek(V, id, t); } catch (e) { vyjimka = e.message; break; }
    max = Math.max(max, l.length);
    for (const r of l) {
      if (![r[0], r[1], r[2], r[3], r[5]].every(Number.isFinite) || r[2] <= 0 || r[3] <= 0) spatne++;
      if (r[5] < 0 || r[5] > 1) alfaMimo++;
    }
  }
  ok(!vyjimka, id + ': výjimka při kreslení', vyjimka);
  ok(max <= 300, id + ': ' + max + ' volání na snímek (strop 300)');
  ok(spatne === 0, id + ': ' + spatne + ' nekonečných / nekladných obdélníků');
  ok(alfaMimo === 0, id + ': ' + alfaMimo + ' volání s průhledností mimo 0–1');
  /* determinismus */
  let stejne = true; for (const t of [0, 123, 450, 777, 1200, 1999]) if (kons(snimek(V, id, t)) !== kons(snimek(V, id, t))) stejne = false;
  ok(stejne, id + ': snímek není deterministický');
  /* pohyb, still, konec */
  let hybe = 0; for (const t of [300, 700, 1100, 1500]) if (kons(snimek(V, id, t)) !== kons(snimek(V, id, t + 300))) hybe++;
  ok(hybe >= 3, id + ': efekt se hýbe jen v ' + hybe + ' ze 4 dvojic snímků');
  const klid = snimek(V, id, m.still);
  ok(klid.length >= 8, id + ': ve „still“ čase (' + m.still + ' ms) je jen ' + klid.length + ' volání');
  const konec = snimek(V, id, m.dur).filter(r => r[5] > 0.1).length;
  ok(konec === 0, id + ': na konci (' + m.dur + ' ms) je ještě ' + konec + ' viditelných obdélníků');
  statistika.push(id.replace('victory-', '') + ' ≤' + max);
}
/* ── 6. efekty se liší ── */
for (const [cas, nazev] of [[900, 't = 900 ms']]) {
  const otisky = IDS.map(id => kons(snimek(V, id, cas)));
  ok(new Set(otisky).size === IDS.length, 'efekty se v ' + nazev + ' neliší', new Set(otisky).size + ' různých ze ' + IDS.length);
}
{
  const otisky = IDS.map(id => kons(snimek(V, id, V.META[id].still)));
  ok(new Set(otisky).size === IDS.length, 'efekty se ve svých „still“ časech neliší', new Set(otisky).size + ' různých ze ' + IDS.length);
}
/* žádný Math.random v kódu (komentáře se nepočítají) */
{
  const kod = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  ok(!/Math\.random/.test(kod), 'modul používá Math.random');
}

/* ── 7. katalog obchodu a odměny ── */
function nactiPenezenku(zdroj, ulozeno) {
  const store = ulozeno ? { RPG_HUB_WALLET: JSON.stringify(ulozeno) } : {};
  const win = { localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } }, addEventListener() {}, document: undefined };
  win.window = win;
  vm.runInNewContext(zdroj, Object.assign(win, { console, JSON, Math, Date, Object, Array, Set, Number, String, setTimeout, clearTimeout }));
  return win.RPGWallet;
}
function katalog(zdroj) {
  const w = nactiPenezenku(zdroj);
  const vsechny = IDS.map(id => w.itemById(id));
  return { w, vsechny };
}
{
  const { w, vsechny } = katalog(WALLET);
  ok(vsechny.every(Boolean), 'v katalogu obchodu chybí efekt: ' + IDS.filter((id, i) => !vsechny[i]).join(', '));
  ok(vsechny.every(i => i && i.cat === 'victory'), 'položka efektu není v kategorii victory');
  const cssKlice = vsechny.filter(i => i && i.cssKey).map(i => i.cssKey);
  ok(cssKlice.length === 6, 'třídu nápisu (cssKey) má ' + cssKlice.length + ' efektů ze 6 placených');
  /* CSS třídy nápisu je buď v peněžence (vstřikuje ho do všech her), nebo ve všech sedmi hrách */
  const HRY = [3, 4, 5, 6, 7, 8, 9].map(g => fs.readFileSync(path.join(P, 'rpg-mat-' + g + '.html'), 'utf8'));
  const bezCss = cssKlice.filter(k => !WALLET.includes('.victory-banner.' + k + '{') && !HRY.every(h => h.includes('.victory-banner.' + k + '{')));
  ok(bezCss.length === 0, 'třída nápisu nemá CSS (ani v peněžence, ani ve všech hrách): ' + bezCss.join(', '));
  const bomba = w.itemById('victory-bomb'), strom = w.itemById('victory-tree');
  ok(bomba && strom && bomba.ach === true && strom.ach === true, 'bomba a strom musí být jen za úspěch (ach: true)');
  ok(IDS.every(id => id === 'victory-default' || id === 'victory-bomb' || id === 'victory-tree' || !w.itemById(id).ach), 'běžné efekty nesmí být za úspěch');
  /* kdo úspěch nemá, efekt neuvidí ani nekoupí */
  const nic = nactiPenezenku(WALLET, { v: 1, credits: 99999 });
  ok(!nic.items().some(i => i.id === 'victory-bomb' || i.id === 'victory-tree'), 'bomba nebo strom jsou v obchodě viditelné bez úspěchu');
  ok(nic.buy('victory-bomb').ok === false && nic.buy('victory-tree').ok === false, 'bombu nebo strom jde koupit za kredity');
  /* odměny: Bouřlivák → bomba, Velmistr → strom; hráči, který úspěch už má, se efekt doplní */
  const sUspechy = nactiPenezenku(WALLET, { v: 1, credits: 0, gach: { 'gach-crit-1k': '2026-10-01', 'gach-master-21': '2026-10-02' } });
  const vlastni = sUspechy.get().cosmetics.owned;
  ok(vlastni.includes('victory-bomb') && vlastni.includes('victory-tree'), 'úspěch bez efektu v peněžence: ' + vlastni.filter(i => /victory/.test(i)).join(','));
  ok(sUspechy.items().some(i => i.id === 'victory-bomb') && sUspechy.items().some(i => i.id === 'victory-tree'), 'doplněný efekt není v obchodě vidět');
  const jenBomba = nactiPenezenku(WALLET, { v: 1, credits: 0, gach: { 'gach-crit-1k': '2026-10-01' } }).get().cosmetics.owned;
  ok(jenBomba.includes('victory-bomb') && !jenBomba.includes('victory-tree'), 'úspěch Bouřlivák musí dát jen bombu: ' + jenBomba.filter(i => /victory/.test(i)).join(','));
  const jenStrom = nactiPenezenku(WALLET, { v: 1, credits: 0, gach: { 'gach-master-21': '2026-10-02' } }).get().cosmetics.owned;
  ok(jenStrom.includes('victory-tree') && !jenStrom.includes('victory-bomb'), 'úspěch Velmistr musí dát jen strom: ' + jenStrom.filter(i => /victory/.test(i)).join(','));
  /* doplnění nesmí zdvojit kredity ani vlastnictví */
  const dvakrat = nactiPenezenku(WALLET, { v: 1, credits: 5, gach: { 'gach-crit-1k': '2026-10-01' } });
  dvakrat.get(); dvakrat.get();
  ok(dvakrat.get().credits === 5 && dvakrat.get().cosmetics.owned.filter(i => i === 'victory-bomb').length === 1, 'zpětné doplnění změnilo kredity nebo zdvojilo efekt');
}

/* ── sabotáže: test musí spadnout ── */
console.log('── Sabotáže: test musí spadnout ──');
function sabotuj(nazev, kdo, f, kontrola) {
  const zdroj = kdo === 'modul' ? SRC : WALLET;
  const novy = f(zdroj);
  if (novy === zdroj) { ok(false, 'sabotáž „' + nazev + '“ se neaplikovala'); return; }
  const pred = [pass, fail];
  let chyceno = false;
  try { chyceno = !!kontrola(novy); } catch (e) { chyceno = true; }
  pass = pred[0]; fail = pred[1];
  ok(chyceno, 'sabotáž „' + nazev + '“ je chycena');
}
const stejneJako = (Va, id, casy) => casy.every(t => kons(snimek(Va, id, t)) === kons(snimek(Va, id, t)));
sabotuj('Math.random ve výchozím efektu', 'modul', t => t.replace('const r = rng(11);', 'const r = Math.random;'),
  z => !stejneJako(nactiModul(z), 'victory-default', [300, 900]));
sabotuj('průhlednost bez ořezu', 'modul', t => t.replace('ctx.globalAlpha = a == null ? 1 : clamp(a, 0, 1);', 'ctx.globalAlpha = a == null ? 1 : a;'),
  z => { const Vx = nactiModul(z); return IDS.some(id => { for (let t = 0; t <= Vx.META[id].dur; t += 50) if (snimek(Vx, id, t).some(r => r[5] < 0 || r[5] > 1)) return true; return false; }); });
sabotuj('bomba kreslí totéž co výchozí', 'modul', t => t.replace("'victory-bomb'(px, t, W, H, cx, cy) {", "'victory-bomb-x'(px, t, W, H, cx, cy) {"),
  z => { const Vx = nactiModul(z); return kons(snimek(Vx, 'victory-bomb', 900)) === kons(snimek(Vx, 'victory-default', 900)); });
sabotuj('strom na konci nezmizí', 'modul', t => t.replace('f = clamp((D - t) / 500, 0, 1)', 'f = 1'),
  z => snimek(nactiModul(z), 'victory-tree', 3200).filter(r => r[5] > 0.1).length > 0);
sabotuj('nápis stromu končí dlouho po efektu', 'modul', t => t.replace("'victory-tree': { dur: 3200, banner: { delay: 1100, dur: 2000 }", "'victory-tree': { dur: 3200, banner: { delay: 1100, dur: 4000 }"),
  z => { const m = nactiModul(z).META['victory-tree']; return m.banner.delay + m.banner.dur > m.dur + 200; });
sabotuj('odměna Bouřlivák dává strom', 'penezenka', t => t.replace("grant: ['victory-bomb'] },", "grant: ['victory-tree'] },"),
  z => { const o = nactiPenezenku(z, { v: 1, credits: 0, gach: { 'gach-crit-1k': 'x' } }).get().cosmetics.owned; return !(o.includes('victory-bomb') && !o.includes('victory-tree')); });
sabotuj('bez zpětného doplnění odměny', 'penezenka', t => t.replace("if (VALID.has(id) && !owned.includes(id)) owned.push(id); }); });", "if (false) owned.push(id); }); });"),
  z => !nactiPenezenku(z, { v: 1, credits: 0, gach: { 'gach-crit-1k': 'x' } }).get().cosmetics.owned.includes('victory-bomb'));
sabotuj('bombu jde koupit za kredity', 'penezenka', t => t.replace("name: 'Výbuch bomby',      ic: '💣', price: 999999, ach: true,", "name: 'Výbuch bomby',      ic: '💣', price: 100, ach: false,"),
  z => nactiPenezenku(z, { v: 1, credits: 99999 }).buy('victory-bomb').ok === true);

console.log('\nNaměřeno volání na snímek: ' + statistika.join(' · '));
console.log((fail ? '❌' : '✅') + ' Efekty vítězství: ' + pass + ' ✅, ' + fail + ' ❌');
process.exit(fail ? 1 : 0);
