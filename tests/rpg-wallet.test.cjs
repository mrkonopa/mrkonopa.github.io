/* rpg-wallet.test.cjs — sdílená peněženka (globální profil, varianta 2)
   Čistý Node: mockuje localStorage + window, načte modul, ověří
   ekonomiku, anti-cheat, migraci a globální nastavení. */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// ── mock prostředí ──
let store = {};
const localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
  clear: () => { store = {}; }
};
const window = { addEventListener: () => {} };
global.localStorage = localStorage;
global.window = window;

// načti modul (přiřadí window.RPGWallet)
const src = fs.readFileSync(path.resolve(__dirname, '../projects/rpg-wallet.js'), 'utf8');
new Function('window', 'localStorage', src)(window, localStorage);
const W = window.RPGWallet;

let passed = 0, failed = 0;
function test(name, fn) {
  store = {}; // čistý stav pro každý test
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}: ${e.message}`); failed++; }
}

console.log('\n═══ rpg-wallet: sdílená peněženka ═══\n');

test('fresh wallet: 0 kreditů, default kosmetika', () => {
  assert.strictEqual(W.getCredits(), 0);
  assert.ok(W.owns('theme-default'));
  assert.ok(W.owns('victory-default'));
  assert.strictEqual(W.activeId('theme'), 'theme-default');
  assert.strictEqual(W.activeId('victory'), 'victory-default');
  assert.strictEqual(W.activeId('border'), null);
});

test('earn přidá kredity', () => {
  assert.strictEqual(W.earn(50), 50);
  assert.strictEqual(W.earn(30), 80);
  assert.strictEqual(W.getCredits(), 80);
});

test('earn ignoruje NaN / záporné / 0 / Infinity, ale numerický string přičte (ne konkatenace)', () => {
  W.earn(100);
  assert.strictEqual(W.earn(NaN), 100);
  assert.strictEqual(W.earn(-1000), 100);
  assert.strictEqual(W.earn(0), 100);
  assert.strictEqual(W.earn(Infinity), 100);
  // '500' se převede přes Number() na 500 a přičte aritmeticky (klíčové: NE "100500")
  assert.strictEqual(W.earn('500'), 600, 'numerický string se přičte jako číslo, ne konkatenuje');
  assert.strictEqual(typeof W.getCredits(), 'number');
});

test('earn ukládá celá čísla (floor)', () => {
  W.earn(10.9);
  assert.strictEqual(W.getCredits(), 10);
});

test('buy: nedostatek kreditů → odmítnuto, žádná změna', () => {
  W.earn(10);
  const r = W.buy('border-gold'); // 130 kr
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'insufficient');
  assert.strictEqual(W.getCredits(), 10);
  assert.ok(!W.owns('border-gold'));
});

test('buy: dostatek kreditů → koupeno, odečteno, aktivováno', () => {
  W.earn(200);
  const r = W.buy('border-gold'); // 130
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.reason, 'bought');
  assert.strictEqual(W.getCredits(), 70);
  assert.ok(W.owns('border-gold'));
  assert.ok(W.isActive('border-gold'));
  assert.strictEqual(W.cssFor('border'), 'av-gold');
});

test('buy stejnou věc 2× → účtováno jen jednou', () => {
  W.earn(300);
  W.buy('theme-matrix'); // 150
  assert.strictEqual(W.getCredits(), 150);
  const r = W.buy('theme-matrix'); // už vlastním → jen aktivace, bez účtu
  assert.strictEqual(r.reason, 'activated');
  assert.strictEqual(W.getCredits(), 150, 'druhý nákup neúčtuje');
  // owned bez duplikátů
  const owned = W.get().cosmetics.owned.filter(id => id === 'theme-matrix');
  assert.strictEqual(owned.length, 1);
});

test('buy zdarma věc → bez účtu, aktivace', () => {
  W.earn(50);
  const r = W.buy('theme-default');
  assert.strictEqual(r.reason, 'activated');
  assert.strictEqual(W.getCredits(), 50);
});

test('buy neznámé ID → odmítnuto, bez crashe', () => {
  W.earn(1000);
  assert.strictEqual(W.buy('hacker-item-9000').ok, false);
  assert.strictEqual(W.buy(null).ok, false);
  assert.strictEqual(W.buy(undefined).ok, false);
  assert.strictEqual(W.buy(12345).ok, false);
  assert.strictEqual(W.getCredits(), 1000, 'nic se neodečetlo');
});

test('activate bez vlastnictví → blokováno', () => {
  const r = W.activate('border-holo'); // 220, nevlastním
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'not-owned');
  assert.strictEqual(W.activeId('border'), null);
});

test('activate vlastněnou věc → ok', () => {
  W.earn(300);
  W.buy('badge-gold'); // 90
  W.buy('theme-default'); // přepne téma zpět
  // koupit a aktivovat jiný badge
  W.earn(100);
  W.buy('badge-cyan'); // 60
  assert.ok(W.isActive('badge-cyan'));
  const r = W.activate('badge-gold'); // vlastním (koupeno výš)
  assert.strictEqual(r.ok, true);
  assert.ok(W.isActive('badge-gold'));
});

test('anti-cheat: ručně vložené neznámé owned ID se zahodí', () => {
  store[W.KEY] = JSON.stringify({ credits: 50, cosmetics: { owned: ['theme-default', 'victory-default', 'FAKE_ITEM', 'border-gold'], active: {} }, settings: {} });
  const w = W.get();
  assert.ok(!w.cosmetics.owned.includes('FAKE_ITEM'), 'neznámé ID pryč');
  assert.ok(w.cosmetics.owned.includes('border-gold'), 'platné ID zůstává');
});

test('anti-cheat: active neowned placená věc → spadne na default', () => {
  store[W.KEY] = JSON.stringify({ credits: 0, cosmetics: { owned: ['theme-default', 'victory-default'], active: { border: 'border-holo', theme: 'theme-blood', victory: 'victory-neon', badge: 'badge-gold' } }, settings: {} });
  const w = W.get();
  assert.strictEqual(w.cosmetics.active.border, null, 'neowned border → null');
  assert.strictEqual(w.cosmetics.active.theme, 'theme-default', 'neowned theme → default');
  assert.strictEqual(w.cosmetics.active.victory, 'victory-default', 'neowned victory → default');
  assert.strictEqual(w.cosmetics.active.badge, null, 'neowned badge → null');
});

test('anti-cheat: záporné/NaN kredity v storage → 0', () => {
  store[W.KEY] = JSON.stringify({ credits: -9999, cosmetics: { owned: [], active: {} }, settings: {} });
  assert.strictEqual(W.getCredits(), 0);
  store[W.KEY] = JSON.stringify({ credits: 'hodně', cosmetics: { owned: [], active: {} }, settings: {} });
  assert.strictEqual(W.getCredits(), 0);
});

test('anti-cheat: úplně rozbitý JSON → blank wallet, bez crashe', () => {
  store[W.KEY] = '{{{ ne json';
  assert.strictEqual(W.getCredits(), 0);
  assert.ok(W.owns('theme-default'));
});

test('globální VFX: set/get reducedMotion', () => {
  assert.strictEqual(W.getReducedMotion(), false);
  W.setReducedMotion(true);
  assert.strictEqual(W.getReducedMotion(), true);
  W.setReducedMotion(false);
  assert.strictEqual(W.getReducedMotion(), false);
});

test('migrace: absorbuje per-game kredity + owned, jen jednou', () => {
  const legacyS = { credits: 75, cosmetics: { owned: ['theme-default', 'victory-default', 'border-cyan'], active: {} } };
  const ch1 = W.migrateFrom('RPG_MAT_9', legacyS);
  assert.strictEqual(ch1, true);
  assert.strictEqual(W.getCredits(), 75);
  assert.ok(W.owns('border-cyan'));
  // druhá migrace téže hry → nic
  const ch2 = W.migrateFrom('RPG_MAT_9', legacyS);
  assert.strictEqual(ch2, false);
  assert.strictEqual(W.getCredits(), 75, 'nezdvojnásobí');
});

test('migrace: více her se sečte', () => {
  W.migrateFrom('RPG_MAT_6', { credits: 20, cosmetics: { owned: [] } });
  W.migrateFrom('RPG_MAT_7', { credits: 30, cosmetics: { owned: [] } });
  W.migrateFrom('RPG_MAT_8', { credits: 50, cosmetics: { owned: [] } });
  assert.strictEqual(W.getCredits(), 100);
});

test('migrace: ignoruje nevalidní owned ID', () => {
  W.migrateFrom('RPG_MAT_9', { credits: 0, cosmetics: { owned: ['CHEAT', 'border-gold'] } });
  assert.ok(W.owns('border-gold'));
  assert.ok(!W.owns('CHEAT'));
});

test('spam buy vše s velkým rozpočtem → kredity nikdy záporné', () => {
  W.earn(100000);
  W.items().forEach(it => W.buy(it.id));
  assert.ok(W.getCredits() >= 0, 'kredity nezáporné');
  // vlastním všechno
  W.items().forEach(it => assert.ok(W.owns(it.id), 'vlastním ' + it.id));
});

test('items() vrací kopii (nelze zvenčí přepsat ceny)', () => {
  const its = W.items();
  its[0].price = -999;
  const fresh = W.items();
  assert.ok(fresh[0].price > 0, 'cena nezměněna zvenčí');
});

test('cssFor vrací aktivní cssKey pro kategorii', () => {
  W.earn(500);
  W.buy('theme-matrix');
  assert.strictEqual(W.cssFor('theme'), 'matrix');
  W.buy('theme-default');
  assert.strictEqual(W.cssFor('theme'), '');
});

console.log(`\n${passed + failed} testů: ${passed} prošlo, ${failed} selhalo`);
if (failed > 0) process.exit(1);
