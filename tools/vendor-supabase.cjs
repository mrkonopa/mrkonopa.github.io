/* ═════════════════════════════════════════════════════════════════
   Vlastní kopie knihovny @supabase/supabase-js (UMD) místo `cdn.jsdelivr.net/npm/@supabase/supabase-js@2`.

   Proč: (1) IP adresa každého návštěvníka (i žáků, kteří se nikdy nepřihlásí) odcházela cizímu serveru — stejný
   důvod jako u písem; (2) `@2` znamená „vždy nejnovější 2.x“, takže nová verze knihovny mohla přijít a rozbít
   přihlášení bez jediné změny u nás; (3) školní filtr může cizí doménu zablokovat a cloud by tiše přestal
   fungovat. Kopie má přesnou verzi a změní se jen tímhle nástrojem.

   Co nástroj dělá: stáhne balíček přes `npm pack`, vezme `dist/umd/supabase.js`, uloží ho jako
   `projects/vendor/supabase-js-<verze>.js` s hlavičkou a PODMÍNKOU kolem (jediná úprava originálu: úvodní
   `var supabase=` je `window.supabase=` uvnitř podmínky), a přepíše odkazy ve všech stránkách.

   Podmínka: knihovna se nenačte, když `window.supabase` už existuje (testy ho napodobují před načtením stránky)
   nebo když stránka běží na localhost / 127.0.0.1 (testy, vývoj) — přesně jako dřív, kdy byl CDN v testech
   zablokovaný. Na `mrkonopa.github.io` se načte vždy.

   Použití: node tools/vendor-supabase.cjs 2.118.0
   Hlídá `tests/vendor-supabase.test.cjs`.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const { vsechnyHtml } = require('../tests/stranky.cjs');
const ROOT = path.join(__dirname, '..');
const VEND = path.join(ROOT, 'projects', 'vendor');
const CDN = /https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2(?:\.\d+\.\d+)?(?:\/[^"'\s]*)?/g;

const verze = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(verze || '')) { console.error('Použití: node tools/vendor-supabase.cjs <verze>, např. 2.118.0'); process.exit(2); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-'));
execFileSync('npm', ['pack', '@supabase/supabase-js@' + verze, '--silent'], { cwd: tmp, stdio: ['ignore', 'pipe', 'inherit'] });
const tgz = fs.readdirSync(tmp).find(f => f.endsWith('.tgz'));
execFileSync('tar', ['xzf', tgz], { cwd: tmp });
const original = fs.readFileSync(path.join(tmp, 'package', 'dist', 'umd', 'supabase.js'), 'utf8');
if (!original.startsWith('var supabase=')) { console.error('Neočekávaný začátek souboru, nástroj je třeba upravit.'); process.exit(1); }
const sha = crypto.createHash('sha256').update(original).digest('hex');
const licence = fs.readFileSync(path.join(tmp, 'package', 'LICENSE'), 'utf8').split('\n')[2] || 'MIT';

const telo = original.replace(/^var supabase=/, 'window.supabase=').replace(/\s+$/, '');
const hlavicka =
  '/* @supabase/supabase-js ' + verze + ' — dist/umd/supabase.js (MIT, ' + licence.replace(/^Copyright /, '©') + ').\n' +
  '   Vlastní kopie místo jsDelivr @2; vytvořeno nástrojem tools/vendor-supabase.cjs, neupravuj ručně.\n' +
  '   sha256 originálu: ' + sha + '\n' +
  '   Jediná úprava: úvodní `var supabase=` je `window.supabase=` uvnitř podmínky. Knihovna se nenačte, když už\n' +
  '   window.supabase existuje (testy ho napodobují) nebo na localhost / 127.0.0.1 (testy, vývoj). */\n' +
  "if (!window.supabase && !/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(location.hostname)) {\n";
const soubor = 'supabase-js-' + verze + '.js';
fs.mkdirSync(VEND, { recursive: true });
for (const f of fs.readdirSync(VEND)) if (/^supabase-js-.*\.js$/.test(f) && f !== soubor) { fs.unlinkSync(path.join(VEND, f)); console.log('- odstraněna stará verze ' + f); }
fs.writeFileSync(path.join(VEND, soubor), hlavicka + telo + '\n}\n');
console.log('+ projects/vendor/' + soubor + ' (' + (original.length / 1e3).toFixed(0) + ' kB, sha256 ' + sha.slice(0, 12) + '…)');

/* odkazy ve stránkách: relativní cesta podle hloubky; přepíše CDN i předchozí vlastní verzi */
const vlastni = /(?:\.\.\/|\.\/)*(?:vendor\/)supabase-js-\d+\.\d+\.\d+\.js/g;
let zmen = 0;
for (const f of vsechnyHtml()) {
  const abs = path.join(ROOT, f); let h = fs.readFileSync(abs, 'utf8');
  if (!CDN.test(h) && !vlastni.test(h)) { CDN.lastIndex = 0; vlastni.lastIndex = 0; continue; }
  CDN.lastIndex = 0; vlastni.lastIndex = 0;
  const rel = path.relative(path.dirname(abs), path.join(VEND, soubor)).split(path.sep).join('/');
  const nove = h.replace(CDN, rel).replace(vlastni, rel);
  if (nove !== h) { fs.writeFileSync(abs, nove); zmen++; console.log('~ ' + f + ' → ' + rel); }
}
console.log('stránek přepsáno: ' + zmen);
fs.rmSync(tmp, { recursive: true, force: true });
