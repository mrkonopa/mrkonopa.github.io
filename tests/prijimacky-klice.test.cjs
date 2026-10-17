/* ══════════════════════════════════════════════════════════════════
   Každý klíč přijímaček v úložišti je buď OSOBNÍ (smaže se při odhlášení), nebo
   jmenovitě NASTAVENÍ ZAŘÍZENÍ (zůstává).

   PROČ. Na sdíleném tabletu smí odhlášení smazat všechno, co patří žákovi — jinak by
   další dítě zdědilo cizí výsledky a při přihlášení je nahrálo do SVÉHO cloudu (v RPG hrách se to
   stalo). O tom, co je „osobní“, rozhoduje jediné místo, `jeOsobni` v `rpg-cloud.js`. CLAUDE.md
   říká „nový klíč s osobními daty přidej do jeOsobni“, jenže zápis v textu se nehlídá: přibude-li
   klíč a nikdo si nevzpomene, prošla by celá brána a data by po odhlášení zůstala.

   Test proto projde zdrojáky přijímaček, vytáhne VŠECHNY klíče `PZ_…`, které se čtou nebo píšou do
   úložiště, a každý musí být osobní podle SKUTEČNÉHO predikátu z `rpg-cloud.js` (nečte se kopie),
   nebo být v seznamu nastavení zařízení níž — s důvodem.

   Spusť: node tests/prijimacky-klice.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PROJ = path.join(ROOT, 'projects');
const STR = path.join(PROJ, 'prijimacky-matematika');

/* Nastavení zařízení — zůstává i po odhlášení, protože nepatří žákovi, ale tabletu. */
const NASTAVENI_ZARIZENI = {
  PZ_KN_CARY: 'tloušťka čar v rýsovacím okně (pohodlí při psaní prstem, žádná data o žákovi)',
  PZ_MOTIV: 'světlý / tmavý vzhled (volba tabletu, žádná data o žákovi; po odhlášení zůstává, jak ji dítě na zařízení nastavilo)'
};
/* Klíče, které se do localStorage nezapisují: PZ_EVT_ + jméno události je v sessionStorage (jednou za návštěvu karty). */
const MIMO_LOCALSTORAGE = { PZ_EVT_: 'sessionStorage, mizí se zavřením karty' };

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

/* Predikát `jeOsobni` ze zdroje rpg-cloud.js (ne kopie): `const jeOsobni = k => …;` */
function nactiPredikat(src) {
  const m = /const jeOsobni = k =>([\s\S]*?);\n/.exec(src);
  if (!m) return null;
  return new Function('k', 'return (' + m[1] + ');');
}
/* Všechny řetězcové literály `PZ_…` ve zdrojácích přijímaček (jádro, stránky, konstrukce, banky). */
function sbirejKlice(zdroje) {
  const kl = new Map();
  for (const f of zdroje) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/['"`](PZ_[A-Z0-9_]+)['"`]/g)) (kl.get(m[1]) || kl.set(m[1], new Set()).get(m[1])).add(path.basename(f));
  }
  return kl;
}
const zdrojePZ = fs.readdirSync(STR).filter(f => /\.(js|html)$/.test(f)).map(f => path.join(STR, f))
  .concat([path.join(PROJ, 'rpg-cloud.js'), path.join(PROJ, 'rpg-cermat-9.js')]);

function posud(srcCloud, kl) {
  const jeOsobni = nactiPredikat(srcCloud);
  if (!jeOsobni) return { chyba: 'predikát jeOsobni se v rpg-cloud.js nenašel' };
  const nezarazene = [], osobni = [], nastaveni = [];
  for (const k of kl.keys()) {
    if (MIMO_LOCALSTORAGE[k]) continue;
    if (jeOsobni(k)) osobni.push(k);
    else if (NASTAVENI_ZARIZENI[k]) nastaveni.push(k);
    else nezarazene.push(k);
  }
  return { nezarazene, osobni, nastaveni };
}

console.log('\n── Přijímačky: co se po odhlášení maže ──\n');
const srcCloud = fs.readFileSync(path.join(PROJ, 'rpg-cloud.js'), 'utf8');
const kl = sbirejKlice(zdrojePZ);
const v = posud(srcCloud, kl);

ok(!v.chyba, 'predikát jeOsobni se ze zdroje rpg-cloud.js vytáhl', v.chyba);
ok(kl.size >= 5, 've zdrojácích se našlo ' + kl.size + ' klíčů PZ_… (podlaha 5; nic nevidět by znamenalo slepý test)', [...kl.keys()].join(', '));
ok((v.osobni || []).length >= 5, 'osobních klíčů je ' + (v.osobni || []).length + ' (výsledky testů, procvičování, diagnostika, témata testu, rozepsaný test)', (v.osobni || []).join(', '));
ok(!(v.nezarazene || []).length, 'každý klíč je osobní, nebo jmenovitě nastavení zařízení', (v.nezarazene || []).map(k => k + ' (' + [...kl.get(k)].join(', ') + ')').join(' | '));
// Seznam výjimek nesmí hnít: klíč, který ve zdrojácích není, a přece je ve výjimkách, je zbytečný.
const hnije = Object.keys(NASTAVENI_ZARIZENI).filter(k => !kl.has(k)).concat(Object.keys(MIMO_LOCALSTORAGE).filter(k => !kl.has(k)));
ok(!hnije.length, 'výjimky odpovídají skutečným klíčům (žádná zbytečná)', hnije.join(', '));
// Nastavení zařízení nesmí být současně osobní (jinak by výjimka nic neznamenala).
ok(Object.keys(NASTAVENI_ZARIZENI).every(k => nactiPredikat(srcCloud)(k) === false), 'nastavení zařízení se při odhlášení nemaže');

/* Sabotáže: test musí chytit (a) nový osobní klíč, který nikdo nezařadil, (b) vyřazení klíče z predikátu. */
{
  const klNovy = new Map(kl); klNovy.set('PZ_NOVY_VYSLEDEK', new Set(['vymysleny.html']));
  ok(posud(srcCloud, klNovy).nezarazene.includes('PZ_NOVY_VYSLEDEK'), 'sabotáž: nový klíč bez zařazení je chycen');
  const bezRunu = srcCloud.replace('TEST_RUN', 'TEST_RUN_X');
  ok(bezRunu !== srcCloud && posud(bezRunu, kl).nezarazene.includes('PZ_TEST_RUN'), 'sabotáž: klíč vyřazený z predikátu (rozepsaný test) je chycen');
  const bezPredikatu = srcCloud.replace('const jeOsobni = k =>', 'const jeOsobniX = k =>');
  ok(bezPredikatu !== srcCloud && !!posud(bezPredikatu, kl).chyba, 'sabotáž: zmizelý predikát nespadne potichu, ale nahlas');
}

console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
