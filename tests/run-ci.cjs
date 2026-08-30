#!/usr/bin/env node
/* CI brána — spouští udržovanou testovou sadu SEKVENČNĚ (dle CLAUDE.md nikdy
   paralelně: 3 souběžné Playwrighty se uškrtí → falešné timeouty).
   Auto-discovery *.test.cjs + *.audit.cjs + explicitní harnessy/hostile.
   Lokálně: `node tests/run-ci.cjs`  |  podmnožina: `RUN_FILTER=tower node tests/run-ci.cjs`
   Seznam bez spuštění: `node tests/run-ci.cjs --list` */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DIR = __dirname;
const LIST_ONLY = process.argv.includes('--list');
const FILTER = process.env.RUN_FILTER || '';
const PER_TEST_TIMEOUT = 420000; // 7 min — pokryje i pomalý issue103 (~4 min) a tower-game (108×)

// Testy MIMO bránu (nepočítat mezi regrese):
const SKIP = new Set([
  'verify-qol.cjs',               // potřebuje ruční dev server na :8765
  'vstudents-stress.harness.cjs', // 120 žáků — moc těžké na každý PR (pouští se ručně)
  'vstudents.harness.cjs',        // 30 žáků, na CI >7 min → timeout; autoritativní je vstudents-deep
]);
// Testy, co berou ročník jako argument → pusť per-ročník (jinak nepokryjí vše):
const PARAM = {
  'svg-tasks.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
  // Kryl jen 2. stupeň, přestože 1. stupeň má VLASTNÍ implementaci výběru
  // ze čtyř (`mcDistractors`/`pickMC` proti `submitMC`) — tedy tu, kterou
  // nikdy nikdo strojově neprošel. Test na ni přitom byl připravený
  // (má v sobě větev pro „compact g3–5 dataset.v"). Všech sedm prochází.
  'rpg-distractors.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
  'rpg-battle-dedup.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
  // Bez tohohle běžela „Najdi chybu" jen pro 9. ročník a zbylých šest
  // sad karet nikdo nekontroloval. Všech sedm prochází (18 kontrol každý).
  'rpg-finderror.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
  // Test jádra bere ročník argumentem. Bez tohohle řádku by se z něj
  // kontrolovala jen výchozí devítka a zbylé tři migrované ročníky
  // (mřížky, kontrast, skiny, drawHeroOn) by neprošly ničím.
  // Sprite jádro je od PR #223 ve VŠECH sedmi ročnících, ale záznam
  // zůstal na čtyřech. Na 1. stupni prochází taky (23 kontrol každý).
  'rpg-sprite-core.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],

  /* ── Doplněno po skenu `process.argv[2]` proti klíčům PARAM ──────────
     Osm testů bralo ročník jako argument, ale v PARAM nebylo ANI JEDNO
     z nich — běžely tedy jen pro svou výchozí devítku a zbylých šest
     ročníků nekontroloval nikdo. Je to přesně vzorec, který CLAUDE.md
     popisuje u „Najdi chybu"; poučení bylo zapsané, ale sken se nikdy
     neudělal.

     Vyplatilo se hned: `rpg-adaptive-battle` na ŠESTCE padal, protože
     čekal časomíru 40×1,2 = 48, kenže základ se od změny času odvíjí
     od délky zadání. V devítce to procházelo jen náhodou (padla krátká
     úloha), takže test byl nestabilní i tam, kde „procházel".

     Dva adaptivní tréninkové testy tu ZÁMĚRNĚ nejsou: 1. a 2. stupeň
     mají každý vlastní mechanismus (`trBuildBag` proti `trWeightedPick`)
     a na cizím stupni test spadne. `rpg-adaptive-train-bag` je proto
     jen pro 1. stupeň, `rpg-adaptive-train` jen pro 2. */
  'rpg-adaptive-battle.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
  'rpg-adaptive-train-bag.test.cjs': ['3', '4', '5'],
  'rpg-adaptive-train.test.cjs': ['6', '7', '8', '9'],
  'rpg-keys.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
  'rpg-revive-stars.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
  'rpg-sound.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
  'rpg-sponka.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
  'rpg-tutorial.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
};
// Harnessy/hostile skripty, co nesedí na *.test.cjs / *.audit.cjs vzor:
const EXTRA = [
  'vstudents-deep.harness.cjs',  // HLAVNÍ brána (113/0)
  'vstudents.harness.cjs',
  'rpg-shop-hostile.cjs',
  'rpg-1stupen-hostile.cjs',
  'rpg-newfeatures-hostile.cjs',
  'rpg-sponka-hostile.cjs',
];

let files = fs.readdirSync(DIR).filter(f => /\.(test|audit)\.cjs$/.test(f));
files = [...new Set([...files, ...EXTRA])]
  .filter(f => fs.existsSync(path.join(DIR, f)) && !SKIP.has(f))
  .sort();

// Sestav běhy (soubor + argumenty). Hlavní harness první (fail-fast na nejdůležitějším).
let runs = [];
for (const f of files) {
  if (PARAM[f]) PARAM[f].forEach(a => runs.push({ f, args: [a], label: `${f} [${a}]` }));
  else runs.push({ f, args: [], label: f });
}
if (FILTER) runs = runs.filter(r => r.label.includes(FILTER));

/* ── Rozdělení brány na dvě části (--only=node | browser) ──────────────
   Na CI běží jako dva paralelní joby: rychlá půlka (čistý Node, SQL,
   audity) doběhne za pár desítek vteřin, takže zpětná vazba na většinu
   chyb přijde skoro hned; pomalá půlka (Playwright) běží vedle a jen ta
   potřebuje instalovat prohlížeč.

   Zařazení se NEURČUJE ručním seznamem — ten by zastaral hned, jak
   přibude test. Rozhoduje, jestli si soubor sám vyžádá playwright.
   Bez přepínače běží všechno jako dřív (a tak to zůstává lokálně). */
const CAST = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);
const jeProhlizec = f => {
  try { return /require\(['"]playwright['"]\)/.test(fs.readFileSync(path.join(DIR, f), 'utf8')); }
  catch (e) { return true; }   // nepřečtu-li ho, ať radši spadne do pomalé části
};
if (CAST) {
  if (!['node', 'browser'].includes(CAST)) {
    console.error(`Neznámá část „${CAST}" — povolené: node | browser`); process.exit(2);
  }
  const chci = CAST === 'browser';
  runs = runs.filter(r => jeProhlizec(r.f) === chci);
  if (!runs.length) { console.error(`Část „${CAST}" neobsahuje žádný test — něco je špatně.`); process.exit(2); }
}
runs.sort((a, b) => (b.f.startsWith('vstudents-deep') ? 1 : 0) - (a.f.startsWith('vstudents-deep') ? 1 : 0));

/* ── Dělení na díly (--shard=i/n) ──────────────────────────────────────
   Uvnitř jednoho stroje se testy pouštějí SEKVENČNĚ — tři souběžné
   Playwrighty se navzájem uškrtí a dělají falešné timeouty (CLAUDE.md).
   Na CI ale každý díl dostane VLASTNÍ runner, takže se nemají o co prát.
   Tím se zkracuje čekání: brána trvá zhruba tak dlouho jako nejdelší díl,
   ne jako součet všech.

   Rozdělení je round-robin přes seřazený seznam, takže drahé a levné
   testy padnou rovnoměrně; deep harness zůstává první v dílu 1, aby
   nejdůležitější kontrola selhala co nejdřív. */
const SHARD = (process.argv.find(a => a.startsWith('--shard=')) || '').slice(8);
if (SHARD) {
  const m = /^(\d+)\/(\d+)$/.exec(SHARD);
  if (!m) { console.error(`Špatný tvar --shard: „${SHARD}" (čekám i/n, např. 2/3)`); process.exit(2); }
  const idx = +m[1], poc = +m[2];
  if (idx < 1 || poc < 1 || idx > poc) { console.error(`--shard=${SHARD} je mimo rozsah`); process.exit(2); }
  runs = runs.filter((_, i) => i % poc === idx - 1);
  if (!runs.length) { console.error(`Díl ${SHARD} je prázdný — dílů je víc než testů.`); process.exit(2); }
}

console.log(`\n╔══ CI brána${CAST?" ["+CAST+"]":""}${SHARD?" díl "+SHARD:""}: ${runs.length} běhů (sekvenčně) ══╗\n`);
if (LIST_ONLY) { runs.forEach(r => console.log('  •', r.label)); process.exit(0); }

function runOne(f, args) {
  const started = Date.now();
  const res = spawnSync('node', [path.join(DIR, f), ...args], {
    encoding: 'utf8', timeout: PER_TEST_TIMEOUT, maxBuffer: 64 * 1024 * 1024,
  });
  const secs = ((Date.now() - started) / 1000).toFixed(0);
  const out = (res.stdout || '') + (res.stderr || '');
  const last = out.split('\n').filter(l => /VÝSLEDEK|✅|❌|✓|✗|passed|failed|prošlo|čisté/.test(l)).pop() || '';
  const timedOut = res.signal === 'SIGTERM' || res.error?.code === 'ETIMEDOUT';
  /* Test, který se sám přeskočil, skončí nulou — tedy „zeleně" — a přitom
     nezkontroloval nic. SQL testy to dělají legitimně, když v prostředí
     není PostgreSQL server (Vojtův Windows), ale na CI by to znamenalo, že
     360 kontrol beze slova zmizelo. Proto se skip nese dál. */
  const skipped = /⏭️?\s*SKIP/.test(out);
  return { ok: res.status === 0 && !timedOut, secs, out, last, timedOut, skipped };
}

const fails = [], flaky = [], skipy = [];
const t0 = Date.now();
for (let i = 0; i < runs.length; i++) {
  const { f, args, label } = runs[i];
  let r = runOne(f, args);
  // Retry-once: Playwright testy občas na CI bliknou (timing pod zátěží).
  // Skutečná chyba selže 2×; flaky projde na druhý pokus → nezčervená bránu.
  if (!r.ok) { const r2 = runOne(f, args); if (r2.ok) { flaky.push(label); r = r2; } else r = r2; }
  if (r.ok && r.skipped) skipy.push(label);
  const tag = !r.ok ? (r.timedOut ? '⏱ TIMEOUT' : '❌')
            : r.skipped ? '⏭ SKIP' : (flaky.includes(label) ? '✅~' : '✅');
  console.log(`[${String(i + 1).padStart(2)}/${runs.length}] ${tag} ${label} (${r.secs}s)  ${r.last.trim().slice(0, 70)}`);
  if (!r.ok) { fails.push(label); if (r.out.trim()) console.log(r.out.trim().split('\n').slice(-8).map(l => '      ' + l).join('\n')); }
}
if (flaky.length) console.log('\n⚠ flaky (prošlo až na 2. pokus): ' + flaky.join(', '));

/* Přeskočený test je lokálně v pořádku (Vojtův Windows nemá PostgreSQL),
   na CI ale ne: tam se prostředí zná a skip by znamenal, že kontroly tiše
   vypadly z brány. Zelená, která nic nezkontrolovala, je horší než červená. */
if (skipy.length) {
  console.log('\n⏭ přeskočeno (test se sám vypnul): ' + skipy.join(', '));
  if (process.env.CI) {
    console.log('   Na CI je to CHYBA — prostředí má být kompletní, skip znamená tiše ztracené kontroly.');
    fails.push(...skipy.map(s => s + ' (SKIP na CI)'));
  }
}

const mins = ((Date.now() - t0) / 60000).toFixed(1);
console.log(`\n╚══ ${runs.length - fails.length}/${runs.length} OK · ${mins} min ══╝`);
if (fails.length) { console.log('SELHALO:\n' + fails.map(x => '  ✗ ' + x).join('\n')); process.exit(1); }
console.log('✅ Celá brána zelená.');
