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
  W.earn(500000);
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

test('absorbGame: net-new kredity, žádné dvojí započítání', () => {
  // 1. návštěva HUBu: hra má 50 kr
  assert.strictEqual(W.absorbGame('RPG_MAT_6', { credits: 50 }), true);
  assert.strictEqual(W.getCredits(), 50);
  // 2. návštěva beze změny → nic
  assert.strictEqual(W.absorbGame('RPG_MAT_6', { credits: 50 }), false);
  assert.strictEqual(W.getCredits(), 50);
  // hra vydělala dalších 30 (teď 80) → přiteče jen 30
  assert.strictEqual(W.absorbGame('RPG_MAT_6', { credits: 80 }), true);
  assert.strictEqual(W.getCredits(), 80);
});

test('absorbGame: utracení ve hře nesnižuje sdílený pot, ale re-absorb funguje', () => {
  W.absorbGame('RPG_MAT_7', { credits: 100 });
  assert.strictEqual(W.getCredits(), 100);
  // hráč utratil ve hře → per-game kleslo na 20; sdílený pot zůstává 100
  assert.strictEqual(W.absorbGame('RPG_MAT_7', { credits: 20 }), false);
  assert.strictEqual(W.getCredits(), 100);
  // znovu vydělal nad značku (60) → přiteče 40 (60-20)
  W.absorbGame('RPG_MAT_7', { credits: 60 });
  assert.strictEqual(W.getCredits(), 140);
});

test('absorbGame: více her se sčítá nezávisle', () => {
  W.absorbGame('RPG_MAT_6', { credits: 10 });
  W.absorbGame('RPG_MAT_7', { credits: 20 });
  W.absorbGame('RPG_MAT_8', { credits: 30 });
  W.absorbGame('RPG_MAT_9', { credits: 40 });
  assert.strictEqual(W.getCredits(), 100);
  // re-běh beze změny → nic
  W.absorbGame('RPG_MAT_6', { credits: 10 });
  assert.strictEqual(W.getCredits(), 100);
});

test('absorbGame: absorbuje i vlastněnou kosmetiku', () => {
  W.absorbGame('RPG_MAT_9', { credits: 0, cosmetics: { owned: ['border-gold', 'CHEAT'] } });
  assert.ok(W.owns('border-gold'));
  assert.ok(!W.owns('CHEAT'));
});

test('absorbGame: ignoruje nevalidní vstup bez crashe', () => {
  assert.strictEqual(W.absorbGame(null, { credits: 5 }), false);
  assert.strictEqual(W.absorbGame('RPG_MAT_6', null), false);
  assert.strictEqual(W.absorbGame('RPG_MAT_6', { credits: NaN }), false);
  assert.strictEqual(W.getCredits(), 0);
});

test('cssFor vrací aktivní cssKey pro kategorii', () => {
  W.earn(500);
  W.buy('theme-matrix');
  assert.strictEqual(W.cssFor('theme'), 'matrix');
  W.buy('theme-default');
  assert.strictEqual(W.cssFor('theme'), '');
});

/* ════════ CLOUD SYNC — mergeRemote (sdílení napříč zařízeními) ════════ */
test('mergeRemote: kredity = vyšší z obou (žák nikdy neztratí)', () => {
  W.earn(40);                                   // lokál (škola) = 40
  W.mergeRemote({ credits: 120, cosmetics: { owned: [], active: {} } }); // cloud (doma) = 120
  assert.strictEqual(W.getCredits(), 120);
  W.mergeRemote({ credits: 10, cosmetics: { owned: [], active: {} } });  // nižší cloud nesnižuje
  assert.strictEqual(W.getCredits(), 120);
});

test('mergeRemote: sjednotí vlastněnou kosmetiku z obou zařízení', () => {
  W.earn(500); W.buy('border-silver');          // škola koupila stříbrný rám
  W.mergeRemote({ credits: 0, cosmetics: { owned: ['border-gold', 'badge-cyan'], active: {} } });
  assert.ok(W.owns('border-silver'), 'lokální nákup zůstává');
  assert.ok(W.owns('border-gold'), 'domácí nákup se přidá');
  assert.ok(W.owns('badge-cyan'));
});

test('mergeRemote: převezme vzdálenou aktivní kosmetiku, pokud ji teď vlastníme', () => {
  W.mergeRemote({ credits: 0, cosmetics: { owned: ['border-gold'], active: { border: 'border-gold' } } });
  assert.strictEqual(W.activeId('border'), 'border-gold');
});

test('mergeRemote: NEpřevezme aktivní kosmetiku, kterou nevlastníme (anti-cheat)', () => {
  // remote tvrdí active border-holo, ale owned ho neobsahuje → _sanitize ho zahodí, nepřevezme se
  W.mergeRemote({ credits: 0, cosmetics: { owned: [], active: { border: 'border-holo' } } });
  assert.strictEqual(W.activeId('border'), null);
  assert.ok(!W.owns('border-holo'));
});

test('mergeRemote: ignoruje nevalidní/neúplný vstup bez crashe', () => {
  W.earn(30);
  assert.strictEqual(W.mergeRemote(null).credits, 30);
  assert.strictEqual(W.mergeRemote('x').credits, 30);
  assert.strictEqual(W.mergeRemote({}).credits, 30);   // chybějící cosmetics → _sanitize doplní
  assert.strictEqual(W.getCredits(), 30);
});

test('mergeRemote: reducedMotion zůstává lokální (nesynchronizuje se)', () => {
  W.setReducedMotion(false);                    // lokál vypnuto
  W.mergeRemote({ credits: 0, settings: { reducedMotion: true }, cosmetics: { owned: [], active: {} } });
  assert.strictEqual(W.getReducedMotion(), false, 'vzdálené reducedMotion nepřepíše lokální');
});

test('mergeRemote: migrated/absorbed se sjednotí (zabrání dvojí migraci)', () => {
  W.migrateFrom('RPG_MAT_6', { credits: 20 });  // lokálně migrováno 6
  W.mergeRemote({ credits: 0, migrated: ['RPG_MAT_7'], absorbed: { RPG_MAT_8: 50 }, cosmetics: { owned: [], active: {} } });
  // po sloučení už migrateFrom pro 6 ani 7 znovu nepřičte
  const before = W.getCredits();
  assert.strictEqual(W.migrateFrom('RPG_MAT_7', { credits: 999 }), false, '7 už je v migrated → nepřičte');
  assert.strictEqual(W.getCredits(), before);
});

test('pushCloud bez RPGCloud nespadne (graceful)', () => {
  assert.doesNotThrow(() => W.pushCloud());
});

console.log(`\n${passed + failed} testů: ${passed} prošlo, ${failed} selhalo`);
if (failed > 0) process.exit(1);
