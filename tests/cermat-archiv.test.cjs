/* ══════════════════════════════════════════════════════════════════
   Archiv ostrých testů CERMAT (tools/cermat-archiv/) — bez sítě.

   Hlídá dvě věci:
   1. KATALOG je úplný a čitelný: každý stupeň má zadání i klíče za celé
      období, každý dokument má určený typ a míří na web CERMATu. Když
      CERMAT přestaví stránku, parser vrátí málo položek nebo typ „jine"
      a tady to zčervená (katalog se jinak přegeneruje tiše).
   2. DOSLOVNÉ ZNĚNÍ ÚLOH NEJDE DO GITU. Pravidla CZVV povolují testovou
      dokumentaci ve výuce, ne její další zveřejňování; stažená PDF
      a vytěžené texty proto leží v .cache/, která musí být ignorovaná,
      a commitovaný souhrn ROZBOR.md smí nést jen počty.

   Spusť: node tests/cermat-archiv.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'tools', 'cermat-archiv');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

console.log('── Katalog ──');
const k = JSON.parse(fs.readFileSync(path.join(DIR, 'katalog.json'), 'utf8'));
ok(k.length >= 600, `katalog má ${k.length} položek`);
ok(k.every(x => /^https:\/\/prijimacky\.cermat\.cz\/files\/.+\.pdf$/i.test(x.url)), 'všechny odkazy vedou na PDF na prijimacky.cermat.cz');
const jine = k.filter(x => x.typ === 'jine');
ok(jine.length === 0, 'každý dokument má určený typ' + (jine.length ? ' — neurčeno: ' + jine.map(x => x.text + ' ' + x.soubor).join(', ') : ''));
ok(k.every(x => x.rok >= 2015 && x.rok <= 2100 && x.termin), 'každá položka má rok i termín');
for (const st of ['M9', 'M7', 'M5']) {
  const cs = k.filter(x => x.stupen === st && x.jazyk === 'cs');
  const testy = cs.filter(x => x.typ === 'test'), klice = cs.filter(x => x.typ === 'klic');
  const roky = new Set(testy.map(x => x.rok));
  ok(testy.length >= 38 && klice.length >= 38 && roky.size >= 12,
    `${st}: ${testy.length} zadání, ${klice.length} klíčů, ${roky.size} ročníků (2015–2026)`);
}
ok(k.filter(x => x.stupen === 'nanecisto').every(x => /matematika/i.test(x.nadpis)),
  'z přijímaček nanečisto jen matematika (stránka má i češtinu a angličtinu)');

console.log('── Nic doslovného v gitu ──');
const tracked = execFileSync('git', ['ls-files', 'tools/cermat-archiv'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
ok(tracked.every(f => !f.includes('/.cache/') && !/\.pdf$/i.test(f)), `v gitu jen nástroje a souhrny (${tracked.length} souborů), žádné PDF ani mezipaměť`);
let ignorovano = false;
try { execFileSync('git', ['check-ignore', '-q', 'tools/cermat-archiv/.cache/ulohy.json'], { cwd: ROOT }); ignorovano = true; } catch (e) { /* 1 = neignorováno */ }
ok(ignorovano, '.cache/ je v .gitignore (PDF i vytěžené texty zůstanou mimo git)');
const rozbor = fs.readFileSync(path.join(DIR, 'ROZBOR.md'), 'utf8');
const dlouhe = rozbor.split('\n').filter(l => l.length > 300);
ok(dlouhe.length === 0 && !/VÝCHOZÍ TEXT|Vypočtěte|Sestrojte/.test(rozbor),
  'ROZBOR.md nese jen počty, žádné znění úloh');
ok(/\| 16 \| \d+ \|/.test(rozbor) && /Pokrytí/.test(rozbor), 'ROZBOR.md má pokrytí i tabulku po pozicích');

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
process.exit(fail ? 1 : 0);
