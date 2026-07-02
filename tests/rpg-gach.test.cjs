/* rpg-gach.test.cjs — životní úspěchy (GACH), perky, sezónní obchod, tituly/pets.
   Čistý Node (vm sandbox nad rpg-wallet.js), žádný Playwright.
   Spusť: node tests/rpg-gach.test.cjs */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

function makeSandbox() {
  let store = {};
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { store = {}; },
  };
  const windowObj = {};
  const ctx = vm.createContext({ window: windowObj, localStorage, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'projects/rpg-wallet.js'), 'utf8'), ctx);
  return { W: ctx.window.RPGWallet, win: windowObj, store,
    raw: () => { try { return JSON.parse(store['RPG_HUB_WALLET']); } catch (e) { return null; } },
    inject: v => { store['RPG_HUB_WALLET'] = JSON.stringify(v); } };
}

let passed = 0, failed = 0;
function ok(label, cond, detail) {
  if (cond) { console.log('  ✓', label); passed++; }
  else { console.error('  ✗', label, detail ? `[${detail}]` : ''); failed++; }
}

console.log('\n═══ rpg-gach: životní úspěchy + sezónní obchod ═══\n');

// ── 1) blank stav ──
{
  const { W } = makeSandbox();
  const ls = W.lifeStats();
  ok('blank: všechny life countery 0', Object.values(ls).every(v => v === 0), JSON.stringify(ls));
  const gl = W.gachList();
  ok('blank: 9 úspěchů, vše zamčené', gl.length === 9 && gl.every(g => !g.unlocked));
}

// ── 2) Znalec (1 000 příkladů) ──
{
  const { W } = makeSandbox();
  ok('999 tasks: nic neodemčeno', W.bumpLife('tasks', 999).length === 0);
  const before = W.getCredits();
  const unl = W.bumpLife('tasks', 1);
  ok('1000. task odemkne Znalce', unl.length === 1 && unl[0].id === 'gach-tasks-1k');
  ok('Znalec: +1000 kr', W.getCredits() === before + 1000, `${before}→${W.getCredits()}`);
  ok('opakovaný bump už toast nevrací', W.bumpLife('tasks', 1).length === 0);
}

// ── 3) Pán času (10 000) — perk notimer + exkluzivní titul ──
{
  const { W } = makeSandbox();
  ok('perk notimer před odemčením: false', !W.hasPerk('notimer'));
  const unl = W.bumpLife('tasks', 10000);
  ok('10k tasks odemkne Znalce i Pána času', unl.map(u => u.id).sort().join(',') === 'gach-tasks-10k,gach-tasks-1k');
  ok('perk notimer aktivní', W.hasPerk('notimer'));
  ok('exkluzivní titul Pán času vlastněn', W.owns('title-pan-casu'));
  ok('titul jde aktivovat', W.activate('title-pan-casu').ok && W.activeId('title') === 'title-pan-casu');
}

// ── 4) Bouřlivák — critcredit perk ──
{
  const { W } = makeSandbox();
  W.bumpLife('crits', 1000);
  ok('critcredit perk po 1000 kritech', W.hasPerk('critcredit'));
}

// ── 5) Neposkvrněný — grant exkluzivního rámu ──
{
  const { W } = makeSandbox();
  ok('border-diamond nelze koupit (ach-locked)', W.buy('border-diamond').reason === 'ach-locked');
  ok('border-diamond nejde aktivovat bez vlastnictví', !W.activate('border-diamond').ok);
  W.bumpLife('flawless', 100);
  ok('po 100 flawless vlastněn border-diamond', W.owns('border-diamond'));
  ok('grantnutý rám jde aktivovat', W.activate('border-diamond').ok);
}

// ── 6) setLifeMax — věž ──
{
  const { W } = makeSandbox();
  W.setLifeMax('towerFloor', 30);
  ok('nižší max nepřepíše vyšší', W.setLifeMax('towerFloor', 20).length === 0 && W.lifeStats().towerFloor === 30);
  const unl = W.setLifeMax('towerFloor', 50);
  ok('patro 50 → Legenda věže', unl.some(u => u.id === 'gach-tower-50'));
  ok('titul Legenda věže vlastněn', W.owns('title-legenda-veze'));
}

// ── 7) Věčný plamen — pet Fénix ──
{
  const { W } = makeSandbox();
  W.setLifeMax('streakMax', 100);
  ok('100denní série → Fénix vlastněn', W.owns('pet-fenix'));
}

// ── 8) Magnát přes earn() — tichý unlock, toast doručí další bump ──
{
  const { W } = makeSandbox();
  W.earn(50000);
  ok('Magnát odemčen earn(50000)', !!W.get().gach['gach-earned-50k']);
  ok('titul Magnát vlastněn', W.owns('title-magnat'));
  const unl = W.bumpLife('tasks', 1);
  ok('toast Magnáta doručen nejbližším bumpem', unl.some(u => u.id === 'gach-earned-50k'));
}

// ── 9) Velmistři ──
{
  const { W } = makeSandbox();
  const u21 = W.bumpLife('mastered', 21);
  ok('21 mistrovství → Velmistr', u21.some(u => u.id === 'gach-master-21'));
  const u147 = W.bumpLife('mastered', 126);
  ok('147 mistrovství → Absolutní velmistr', u147.some(u => u.id === 'gach-master-147'));
  ok('grant titul+zlatý drak', W.owns('title-velmistr') && W.owns('pet-zlaty-drak'));
}

// ── 10) sanitize — tamper life/gach ──
{
  const { W, inject } = makeSandbox();
  inject({ credits: 10, cosmetics: { owned: [], active: {} }, life: { tasks: -5, crits: 'x', earned: 1e309, fake: 9 }, gach: { 'gach-tasks-1k': 42, 'neexistuje': '2026-01-01', 'gach-crit-1k': '2026-01-01' }, settings: {}, migrated: [], absorbed: {}, v: 1 });
  const w = W.get();
  ok('sanitize: záporné/nečíselné/Infinity life → 0', w.life.tasks === 0 && w.life.crits === 0 && w.life.earned === 0);
  ok('sanitize: neznámý life klíč zahozen', !('fake' in w.life));
  ok('sanitize: nevalidní gach hodnota (číslo) zahozena', !w.gach['gach-tasks-1k']);
  ok('sanitize: neznámé gach id zahozeno', !w.gach['neexistuje']);
  ok('sanitize: validní gach záznam přežije', w.gach['gach-crit-1k'] === '2026-01-01');
}

// ── 11) sezónní obchod (okno přes __RW_TESTNOW) ──
{
  const { W, win } = makeSandbox();
  win.__RW_TESTNOW = '2026-07-15T10:00:00';
  ok('červenec: Letní vlny v nabídce', W.items().some(i => i.id === 'theme-leto'));
  ok('červenec: Vánoční skryté', !W.items().some(i => i.id === 'theme-vanoce'));
  W.earn(10000);
  ok('mimo sezónu nejde koupit', W.buy('theme-vanoce').reason === 'season');
  ok('v sezóně koupit jde (leto)', W.buy('theme-leto').ok);
  win.__RW_TESTNOW = '2026-12-24T10:00:00';
  ok('prosinec: Vánoční v nabídce', W.items().some(i => i.id === 'theme-vanoce'));
  ok('prosinec (okno přes Silvestr → 6.1.)', (() => { win.__RW_TESTNOW = '2027-01-03T10:00:00'; return W.items().some(i => i.id === 'theme-vanoce'); })());
  win.__RW_TESTNOW = '2026-12-24T10:00:00';
  ok('koupě v sezóně', W.buy('theme-vanoce').ok);
  win.__RW_TESTNOW = '2026-07-15T10:00:00';
  ok('koupené zůstává v nabídce i mimo sezónu', W.items().some(i => i.id === 'theme-vanoce'));
  ok('koupené jde aktivovat i mimo sezónu', W.activate('theme-vanoce').ok);
}

// ── 12) exkluzivní položky skryté v items(), viditelné po grantu ──
{
  const { W } = makeSandbox();
  ok('itemsAll obsahuje exkluzivní', W.itemsAll().some(i => i.id === 'pet-fenix'));
  ok('items() exkluzivní skrývá', !W.items().some(i => i.id === 'pet-fenix'));
  W.setLifeMax('streakMax', 100);
  ok('po grantu se objeví v items()', W.items().some(i => i.id === 'pet-fenix'));
}

// ── 13) spent tracking + tituly/pets nákup ──
{
  const { W } = makeSandbox();
  W.earn(20000);
  W.buy('title-pocitar'); W.buy('pet-sova');
  ok('spent = 6000 po titulu (1000) + sově (5000)', W.lifeStats().spent === 6000, W.lifeStats().spent);
  ok('aktivní titul i pet', W.activeId('title') === 'title-pocitar' && W.activeId('pet') === 'pet-sova');
}

// ── 14) mergeRemote — life max, gach union, grant přežije ──
{
  const { W, inject } = makeSandbox();
  W.bumpLife('tasks', 500);
  const remote = { credits: 0, cosmetics: { owned: ['pet-fenix'], active: {} }, life: { tasks: 300, crits: 800 }, gach: { 'gach-streak-100': '2026-05-01' }, settings: {}, migrated: [], absorbed: {}, v: 1 };
  W.mergeRemote(remote);
  const w = W.get();
  ok('merge: life po klíčích max', w.life.tasks === 500 && w.life.crits === 800);
  ok('merge: gach sjednocen', w.gach['gach-streak-100'] === '2026-05-01');
  ok('merge: vlastněná exkluzivní kosmetika přežije', w.cosmetics.owned.includes('pet-fenix'));
}

// ── 15) neplatné vstupy ──
{
  const { W } = makeSandbox();
  ok('bumpLife neznámý klíč → []', Array.isArray(W.bumpLife('hack', 5)) && W.bumpLife('hack', 5).length === 0);
  ok('bumpLife NaN → +1 (default)', (W.bumpLife('tasks', NaN), W.lifeStats().tasks === 1));
  ok('setLifeMax záporné → ignorováno', W.setLifeMax('towerFloor', -3).length === 0 && W.lifeStats().towerFloor === 0);
}

console.log(`\n${passed + failed} testů: ${passed} prošlo, ${failed} selhalo`);
process.exit(failed ? 1 : 0);
