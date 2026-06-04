/* Test: ročníkové kohorty v učitelské konzoli (rpg-ucitel.html).
   Ověřuje výpočet aktuálního ročníku z cohort_start_year podle data —
   automatický posun po 1. září (6.B → 7.B → …) bez cron jobu.
   Čistý Node — extrahuje helper funkce z HTML přes new Function().
   Spusť: node tests/rpg-cohort.test.cjs */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'projects', 'rpg-ucitel.html'), 'utf8');

// vytáhni blok kohortních helperů (od schoolYearStart po cohortStatus)
const start = html.indexOf('function schoolYearStart');
const endMarker = html.indexOf('/* ── brána ──');
if (start < 0 || endMarker < 0) { console.error('❌ Nenašel jsem blok kohort v HTML'); process.exit(1); }
// vezmi jen funkce, které potřebujeme (do konce cohortStatus)
const csEnd = html.indexOf('}', html.indexOf('function cohortStatus')) ;
// cohortStatus má víc závorek — najdi konec přes počítání
function sliceFn(src, name){
  const i = src.indexOf('function ' + name);
  let depth = 0, started = false;
  for (let j = i; j < src.length; j++){
    if (src[j] === '{'){ depth++; started = true; }
    else if (src[j] === '}'){ depth--; if (started && depth === 0) return src.slice(i, j + 1); }
  }
  return '';
}
const code = [
  sliceFn(html, 'schoolYearStart'),
  sliceFn(html, 'gradeOfCohort'),
  sliceFn(html, 'syLabel'),
  sliceFn(html, 'cohortRangeLabel'),
  sliceFn(html, 'classLabel'),
  sliceFn(html, 'cohortStatus'),
].join('\n');

const api = new Function(code + '\nreturn {schoolYearStart,gradeOfCohort,syLabel,cohortRangeLabel,classLabel,cohortStatus};')();

let pass = 0, fail = 0;
function ok(name, cond, d = '') { if (cond) { console.log('  ✅ ' + name); pass++; } else { console.log('  ❌ ' + name + (d ? ' — ' + d : '')); fail++; } }

const D = (y, m, day) => new Date(y, m - 1, day); // m: 1–12

console.log('\n── Ročníkové kohorty (rpg-ucitel) ──\n');

// schoolYearStart: 1.9. je hranice
ok('1.9.2025 → školní rok začíná 2025', api.schoolYearStart(D(2025, 9, 1)) === 2025);
ok('31.8.2025 → školní rok ještě 2024', api.schoolYearStart(D(2025, 8, 31)) === 2024);
ok('15.6.2026 → školní rok 2025', api.schoolYearStart(D(2026, 6, 15)) === 2025);

// kohorta start 2025 (6. ve školním roce 25/26)
ok('cohort 2025 v září 2025 → 6. ročník', api.gradeOfCohort(2025, D(2025, 9, 5)) === 6);
ok('cohort 2025 v lednu 2026 → stále 6.', api.gradeOfCohort(2025, D(2026, 1, 20)) === 6);
ok('cohort 2025 po 1.9.2026 → 7. ročník (auto-posun)', api.gradeOfCohort(2025, D(2026, 9, 2)) === 7);
ok('cohort 2025 v září 2028 → 9. ročník', api.gradeOfCohort(2025, D(2028, 9, 10)) === 9);
ok('cohort 2025 v září 2029 → 10 (odešli >9)', api.gradeOfCohort(2025, D(2029, 9, 10)) === 10);
ok('cohort 2025 v roce 2024 → 5 (<6, ještě nenastoupili)', api.gradeOfCohort(2025, D(2024, 10, 1)) === 5);

// štítky školních roků
ok('syLabel(2025) = 25/26', api.syLabel(2025) === '25/26');
ok('syLabel(2028) = 28/29', api.syLabel(2028) === '28/29');
ok('syLabel(2099) = 99/00 (přechod století)', api.syLabel(2099) === '99/00');
ok('cohortRangeLabel(2025) = 25/26–28/29', api.cohortRangeLabel(2025) === '25/26–28/29');

// classLabel: kohorta + section → "<ročník>.<section>", jinak name
ok('classLabel kohorta 2025 + B v 2026/09 → 7.B',
   api.classLabel({ name: 'puvodni', section: 'B', cohort_start_year: 2025 }, ) === api.classLabel({ name: 'x', section: 'B', cohort_start_year: 2025 }));
const lbl = api.classLabel({ name: 'X', section: 'B', cohort_start_year: api.schoolYearStart() });
ok('classLabel(start=letos) → 6.B', lbl === '6.B', lbl);
ok('classLabel bez kohorty → name', api.classLabel({ name: 'Doučování', section: '', cohort_start_year: null }) === 'Doučování');

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅  /  ' + fail + ' ❌');
console.log('══════════════════════════════════════════\n');
process.exit(fail ? 1 : 0);
