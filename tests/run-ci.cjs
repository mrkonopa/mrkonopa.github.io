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
  'rpg-distractors.test.cjs': ['6', '7', '8', '9'],
  'rpg-battle-dedup.test.cjs': ['3', '4', '5', '6', '7', '8', '9'],
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
runs.sort((a, b) => (b.f.startsWith('vstudents-deep') ? 1 : 0) - (a.f.startsWith('vstudents-deep') ? 1 : 0));

console.log(`\n╔══ CI brána: ${runs.length} běhů (sekvenčně) ══╗\n`);
if (LIST_ONLY) { runs.forEach(r => console.log('  •', r.label)); process.exit(0); }

function runOne(f, args) {
  const started = Date.now();
  const res = spawnSync('node', [path.join(DIR, f), ...args], {
    encoding: 'utf8', timeout: PER_TEST_TIMEOUT, maxBuffer: 64 * 1024 * 1024,
  });
  const secs = ((Date.now() - started) / 1000).toFixed(0);
  const out = (res.stdout || '') + (res.stderr || '');
  const last = out.split('\n').filter(l => /VÝSLEDEK|✅|❌|✓|✗|passed|failed|prošlo/.test(l)).pop() || '';
  const timedOut = res.signal === 'SIGTERM' || res.error?.code === 'ETIMEDOUT';
  return { ok: res.status === 0 && !timedOut, secs, out, last, timedOut };
}

const fails = [], flaky = [];
const t0 = Date.now();
for (let i = 0; i < runs.length; i++) {
  const { f, args, label } = runs[i];
  let r = runOne(f, args);
  // Retry-once: Playwright testy občas na CI bliknou (timing pod zátěží).
  // Skutečná chyba selže 2×; flaky projde na druhý pokus → nezčervená bránu.
  if (!r.ok) { const r2 = runOne(f, args); if (r2.ok) { flaky.push(label); r = r2; } else r = r2; }
  const tag = r.ok ? (flaky.includes(label) ? '✅~' : '✅') : (r.timedOut ? '⏱ TIMEOUT' : '❌');
  console.log(`[${String(i + 1).padStart(2)}/${runs.length}] ${tag} ${label} (${r.secs}s)  ${r.last.trim().slice(0, 70)}`);
  if (!r.ok) { fails.push(label); if (r.out.trim()) console.log(r.out.trim().split('\n').slice(-8).map(l => '      ' + l).join('\n')); }
}
if (flaky.length) console.log('\n⚠ flaky (prošlo až na 2. pokus): ' + flaky.join(', '));

const mins = ((Date.now() - t0) / 60000).toFixed(1);
console.log(`\n╚══ ${runs.length - fails.length}/${runs.length} OK · ${mins} min ══╝`);
if (fails.length) { console.log('SELHALO:\n' + fails.map(x => '  ✗ ' + x).join('\n')); process.exit(1); }
console.log('✅ Celá brána zelená.');
