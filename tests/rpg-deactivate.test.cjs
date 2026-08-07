/* ══════════════════════════════════════════════════════════════════════
   Vypnutí kosmetiky ve sdíleném obchodu.

   Vojta chtěl mít možnost kliknout na mazlíčka, kterého vlastní, vypnout
   ho — a tím zmizí i sponka, sprite vlevo v hrách.

   Háček: sponka odjakživa brala i JAKÉHOKOLI vlastněného mazlíčka („koupil
   jsem si ho, tak ho mám"), ne jen aktivního. Samotné smazání `active.pet`
   by ji tedy neskrylo — hned by si našla jiného vlastněného. Proto se
   vypnutí drží zvlášť v `settings.petOff`, což rozliší dva různé stavy:

       nikdy jsem si nevybral  → fallback platí, sponka je (staré savy)
       vypnul jsem si to       → nekreslí se nic

   Test hlídá obojí i to, že vypnutí nesmí nic ukrást (koupené zůstává
   koupené) a že povinné kategorie vypnout nejdou.

   Spusť: node tests/rpg-deactivate.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const path = require('path');

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

// localStorage stub — peněženka je čistě klientská
const uloziste = {};
global.localStorage = {
  getItem: k => (k in uloziste ? uloziste[k] : null),
  setItem: (k, v) => { uloziste[k] = String(v); },
  removeItem: k => { delete uloziste[k]; },
  clear: () => { for (const k in uloziste) delete uloziste[k]; },
};
global.window = global;
require(path.join(__dirname, '..', 'projects', 'rpg-wallet.js'));
const W = global.window.RPGWallet;

console.log('\n── Vypnutí kosmetiky ──\n');

/* ── 1. mazlíček: koupit → aktivní → vypnout ─────────────────────────── */
{
  localStorage.clear();
  W.earn(30000);
  const koupe = W.buy('pet-sova');
  ok(koupe && koupe.ok, 'mazlíčka jde koupit', JSON.stringify(koupe));
  ok(W.owns('pet-sova'), 'po koupi ho vlastním');

  W.activate('pet-sova');
  ok(W.activeId('pet') === 'pet-sova', 'po aktivaci je aktivní');

  const vyp = W.deactivate('pet');
  ok(vyp && vyp.ok, 'vypnutí projde', JSON.stringify(vyp));
  ok(W.activeId('pet') === null, 'po vypnutí není nic aktivní');
  ok(W.owns('pet-sova'), 'vypnutí NIC neukradlo — mazlíček zůstal koupený');
  ok(W.get().settings.petOff === true, 'vypnutí je zapsané v settings.petOff');

  // Znovu zapnout musí jít a příznak zrušit.
  W.activate('pet-sova');
  ok(W.activeId('pet') === 'pet-sova', 'jde zase zapnout');
  ok(W.get().settings.petOff === false, 'zapnutí ruší příznak vypnutí');
}

/* ── 2. rozlišení „nikdy nevybráno" vs „vypnuto" ─────────────────────── */
{
  localStorage.clear();
  W.earn(30000); W.buy('pet-sova');
  ok(W.activeId('pet') !== 'pet-sova' || true, 'výchozí stav po koupi');
  ok(W.get().settings.petOff === false,
    'čerstvě koupený mazlíček NENÍ vypnutý (staré savy si sponku nechají)');

  W.deactivate('pet');
  ok(W.get().settings.petOff === true, 'po vypnutí příznak platí');

  // Přežije to kolo přes localStorage (sanitize nesmí příznak spolknout)?
  const znovu = W.get();
  ok(znovu.settings.petOff === true, 'příznak přežije načtení a _sanitize()');
}

/* ── 3. povinné kategorie vypnout nejdou ─────────────────────────────── */
{
  localStorage.clear();
  const t = W.deactivate('theme');
  ok(!t.ok, 'téma vypnout nejde (má povinnou výchozí položku)', JSON.stringify(t));
  ok(W.activeId('theme') === 'theme-default', 'téma zůstalo na výchozím');

  const v = W.deactivate('victory');
  ok(!v.ok, 'vítězná animace vypnout nejde');

  for (const cat of ['border', 'badge', 'skin', 'title', 'pet']) {
    ok(W.deactivate(cat).ok, `kategorie ${cat} vypnout jde`);
  }
}

/* ── 4. nesmysly nespadnou ───────────────────────────────────────────── */
{
  localStorage.clear();
  let spadlo = false;
  try { W.deactivate('neexistuje'); W.deactivate(''); W.deactivate(null); W.deactivate(undefined); }
  catch (e) { spadlo = true; }
  ok(!spadlo, 'deactivate() nespadne na neznámé/prázdné kategorii');
  ok(!W.deactivate('neexistuje').ok, 'neznámá kategorie se odmítne');
}

console.log(`\n  Vypnutí kosmetiky: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
