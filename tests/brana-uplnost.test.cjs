/* ══════════════════════════════════════════════════════════════════════
   Neztratila brána nějaký test?

   PROČ. `run-ci.cjs` bere testy podle JMÉNA souboru (`*.test.cjs`,
   `*.audit.cjs`), takže soubor pojmenovaný jinak z brány tiše vypadne —
   a nikde to nezčervená, protože chybějící test se nijak neprojeví.
   Repozitář na to doplatil už DVAKRÁT:

     · `a11y-audit.cjs` a `mobile-audit.cjs` měly POMLČKU místo tečky,
       takže je auto-discovery neviděla (zapsáno v CLAUDE.md),
     · 18. 9. 2026 se našlo SEDM dalších: `rpg-content-quality.cjs`
       (22 kontrol nad ~575 tis. úlohami!), `test-g3/4/5-smoke.cjs`,
       `test-hub-stupen.cjs`, `verify-scorekeeper.cjs` a `pr83-verify.cjs`
       — dohromady 81 kontrol, které nikdy neběžely v CI. Všechny byly
       přitom v pořádku: zelené, samostatné a končící kódem 1 při pádu.
       Chyběla jim jen ta tečka v názvu.

   CO SE HLÍDÁ. Každý `.cjs` v `tests/`, který vypadá jako test (umí
   spadnout — má větev končící nenulovým kódem), MUSÍ být v seznamu,
   který vrátí `run-ci.cjs --list`. Výjimky jsou vypsané JMENOVITĚ
   i s důvodem; neexistující výjimka test shodí, aby seznam nehnil.

   Seznam se bere ze SKUTEČNÉ brány (spustí se `--list`), ne z kopie
   jejího pravidla — dvě kopie téhož pravidla se rozejdou a nikde to
   nespadne (viz CLAUDE.md, „Záloha, která se chová JINAK…").
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TESTY = path.join(ROOT, 'tests');

let pass = 0, fail = 0;
const ok = (jmeno, podminka, detail = '') => {
  if (podminka) { console.log('  ✅ ' + jmeno); pass++; }
  else { console.log('  ❌ ' + jmeno + (detail ? ' — ' + detail : '')); fail++; }
};

/* Soubory, které do brány NEPATŘÍ — a proč. Důvod je součást pravidla:
   kdo sem něco přidá, musí napsat, čím se to od testu liší. */
const MIMO_BRANU = {
  'run-ci.cjs': 'sama brána, ne test',
  'sql-harness.cjs': 'pomocník ostatních SQL testů (startuje PostgreSQL), sám nic netvrdí',
  'verify-qol.cjs': 'čeká ručně spuštěný dev server na :8765 (zapsáno v CLAUDE.md)',
  'shot-g3.cjs': 'nástroj na snímky, ne test',
  'shot-hub.cjs': 'nástroj na snímky, ne test',
  'shot-review.cjs': 'nástroj na snímky, ne test',
  'shot-verify.cjs': 'nástroj na snímky, ne test',
  'svg-shots.cjs': 'nástroj na snímky, ne test',
  'sprite-screenshots.cjs': 'nástroj na snímky, ne test',
  'vstudents.harness.cjs': 'lehčí varianta; v bráně běží vstudents-deep.harness.cjs (3.–9. ročník)',
  'vstudents-stress.harness.cjs': '120 žáků, na běžný běh brány moc dlouhé — pouští se ručně',
};

/* ── 1. co vidí SKUTEČNÁ brána ─────────────────────────────────────── */
let vypis = '';
try {
  vypis = execFileSync(process.execPath, [path.join(TESTY, 'run-ci.cjs'), '--list'],
    { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
} catch (e) {
  console.log('  ❌ `run-ci.cjs --list` se nepodařilo spustit — ' + (e && e.message));
  process.exit(1);
}
const vBrane = new Set();
for (const m of vypis.matchAll(/^\s*•\s*([A-Za-z0-9._-]+\.cjs)/gm)) vBrane.add(m[1]);

ok('brána vrátila seznam testů (' + vBrane.size + ' souborů)', vBrane.size >= 40,
  'našlo se jen ' + vBrane.size + ', vzor na čtení seznamu asi nesedí');

/* ── 2. co leží v tests/ ───────────────────────────────────────────── */
const vsechny = fs.readdirSync(TESTY).filter(f => f.endsWith('.cjs'));
ok('v tests/ je rozumný počet .cjs souborů (' + vsechny.length + ')', vsechny.length >= 40);

/* Umí soubor spadnout? Hledá se nenulový konec — ať psaný jakkoli:
   `process.exit(1)`, `process.exit(fail?1:0)`, `process.exitCode = 1`.
   Samotné `process.exit(0)` se nepočítá: to je přesně ten tvar, kterým
   týdenní CERMAT job devětkrát „uspěl", aniž cokoli stáhl. */
const umiSpadnout = src =>
  /process\.exit\(\s*(?!0\s*\))/.test(src) || /process\.exitCode\s*=\s*[^0]/.test(src);

const chybejici = [];
for (const f of vsechny) {
  if (vBrane.has(f)) continue;
  if (MIMO_BRANU[f]) continue;
  const src = fs.readFileSync(path.join(TESTY, f), 'utf8');
  if (umiSpadnout(src)) chybejici.push(f);
}
ok('žádný test neleží mimo bránu', chybejici.length === 0,
  chybejici.length + ' souborů umí spadnout, ale brána je nespouští: ' + chybejici.join(', '));

/* ── 3. výjimky nesmí hnít ─────────────────────────────────────────── */
const neexistujici = Object.keys(MIMO_BRANU).filter(f => !vsechny.includes(f));
ok('všechny vypsané výjimky pořád existují', neexistujici.length === 0,
  'zmizely: ' + neexistujici.join(', '));

const zbytecne = Object.keys(MIMO_BRANU).filter(f => vBrane.has(f));
ok('žádná výjimka není zbytečná (brána ji stejně bere)', zbytecne.length === 0,
  zbytecne.join(', '));

/* ── 4. každá výjimka má napsaný důvod ─────────────────────────────── */
const bezDuvodu = Object.entries(MIMO_BRANU).filter(([, d]) => !d || d.trim().length < 10).map(([f]) => f);
ok('každá výjimka má napsaný důvod', bezDuvodu.length === 0, bezDuvodu.join(', '));

/* ── 5. pojistka proti běhu naprázdno ──────────────────────────────── */
const posouzeno = vsechny.filter(f => !vBrane.has(f)).length;
ok('pravidlo něco posuzovalo (' + posouzeno + ' souborů mimo seznam brány)', posouzeno >= 5,
  'mimo bránu nezůstalo skoro nic — buď je vše v pořádku, nebo se špatně čte seznam');

console.log('\n══════════════════════════════════════════');
console.log('  Úplnost brány: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('  v bráně ' + vBrane.size + ' souborů · v tests/ ' + vsechny.length +
  ' · výjimek ' + Object.keys(MIMO_BRANU).length);
console.log('══════════════════════════════════════════');
process.exit(fail > 0 ? 1 : 0);
