/* tools/build-badwords.cjs — (RE)GENERÁTOR projects/rpg-badwords.js
   Stáhne standardní veřejné profanity listy (EN + CS) a složí z nich filtr
   nevhodných jmen. Spusť čas od času pro aktualizaci:  node tools/build-badwords.cjs

   Zdroje:
     • LDNOOBW  (en, cs)   github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
     • chucknorris-io/swear-words (en, cs)
     • censor-text/profanity-list (cs)
   Slovenština sdílí kořeny s češtinou → doplněna kurátorsky (CZSK níže).
*/
const fs = require('fs'), cp = require('child_process'), path = require('path');
const OUT = path.join(__dirname, '..', 'projects', 'rpg-badwords.js');

const SOURCES = [
  'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en',
  'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/cs',
  'https://raw.githubusercontent.com/chucknorris-io/swear-words/master/en',
  'https://raw.githubusercontent.com/chucknorris-io/swear-words/master/cs',
  'https://raw.githubusercontent.com/censor-text/profanity-list/main/list/cs.txt',
];
function fetchText(url) {
  try { return cp.execSync('curl -sS --max-time 30 ' + JSON.stringify(url), { encoding: 'utf8' }); }
  catch (e) { console.warn('  ! nedostupné:', url); return ''; }
}

function norm(s) {
  return String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[0@]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't')
    .replace(/[^a-z]/g, '').replace(/(.)\1{2,}/g, '$1');
}

// kurátorské CZ/SK doplňky (slovenština + slury, které v listech chybí)
const CZSK = ['piča', 'pica', 'picus', 'picka', 'pico', 'čurák', 'curak', 'kokot', 'kokotina', 'kunda', 'pizda',
  'mrdka', 'mrdat', 'mrdnik', 'vymrdat', 'zmrd', 'zkurvysyn', 'zkurvit', 'chuj', 'hovno', 'sračka', 'srát', 'hajzl',
  'debil', 'kretén', 'buzna', 'buzerant', 'teplouš', 'teploš', 'cigán', 'cikán', 'židák', 'negr', 'čokl', 'jebať',
  'jebat', 'vyjebaný', 'skurvysyn', 'skurvený', 'dopiče', 'doriti', 'šulín', 'sulin', 'prcať', 'prcat', 'sráč',
  'pičus', 'píčus', 'homoš', 'nácek', 'sviňa'];
const EN_CORE = ['fuck', 'motherfucker', 'shit', 'bullshit', 'cunt', 'dick', 'dickhead', 'cock', 'pussy', 'bitch',
  'bastard', 'asshole', 'arsehole', 'jackass', 'dumbass', 'wanker', 'twat', 'prick', 'bollocks', 'slut', 'whore',
  'nigger', 'nigga', 'negro', 'faggot', 'fag', 'dyke', 'tranny', 'retard', 'spastic', 'mongoloid', 'cripple', 'nazi',
  'hitler', 'holocaust', 'rape', 'rapist', 'pedophile', 'molest', 'incest', 'penis', 'vagina', 'scrotum', 'ejaculate',
  'masturbate', 'porn', 'milf', 'coon', 'spic', 'chink', 'gook', 'kike', 'beaner', 'paki', 'raghead', 'wetback',
  'jigaboo', 'kaffir'];

let raw = [];
for (const u of SOURCES) { raw = raw.concat(fetchText(u).split('\n')); }
raw = raw.concat(CZSK, EN_CORE);
const set = new Set();
for (const w of raw) { const n = norm((w || '').trim()); if (n.length >= 3) set.add(n); }

// FORCE_SUBSTR: jednoznačné kořeny (podřetězec, i krátké) — chytí složeniny
const FORCE_SUBSTR = new Set(['fuck', 'shit', 'cunt', 'cock', 'wank', 'twat', 'slut', 'prick', 'whore', 'pussy',
  'bitch', 'nigger', 'nigga', 'faggot', 'retard', 'hitler', 'penis', 'vagina', 'kokot', 'kurva', 'kunda', 'pizda',
  'curak', 'chuj', 'mrdat', 'mrdka', 'mrdnik', 'prdel', 'hovno', 'sracka', 'hajzl', 'zmrd', 'cigan', 'cikan', 'jebat',
  'buzna', 'buzerant', 'zidak', 'konomrd', 'oslosoust', 'vypicenec', 'sulin', 'picus', 'zkurvy', 'skurvy', 'vyjeb', 'vymrd']);
// FORCE_EXACT: krátká/kolizní slova jen jako CELÝ token (ass, sex, dick, pica…)
const FORCE_EXACT = new Set(['dick', 'pica', 'ass', 'sex', 'cum', 'gay', 'fag', 'hell', 'damn', 'poo', 'hoe', 'wang',
  'tit', 'tits', 'homo', 'anal', 'anus', 'negr', 'negro', 'coon', 'spic', 'gook', 'kike', 'paki', 'chink', 'dyke',
  'wog', 'jap', 'dago', 'kraut', 'heil', 'rape', 'poon', 'clit', 'knob', 'arse', 'crap', 'turd', 'shag', 'jizz', 'dik',
  'fap', 'pron', 'std', 'fatass', 'pis', 'piss', 'butt', 'boob', 'boobs', 'wtf', 'omg', 'xxx', 'milf', 'thot', 'simp']);

const SUBSTR = new Set(), EXACT = new Set();
for (const w of set) {
  if (FORCE_SUBSTR.has(w)) { SUBSTR.add(w); continue; }
  if (FORCE_EXACT.has(w)) { EXACT.add(w); continue; }
  if (w.length >= 6) SUBSTR.add(w); else EXACT.add(w);
}
for (const w of FORCE_SUBSTR) SUBSTR.add(w);
for (const w of FORCE_EXACT) EXACT.add(w);
const substr = [...SUBSTR].sort(), exact = [...EXACT].sort();

const wrap = a => { const L = []; for (let i = 0; i < a.length; i += 10) L.push('    ' + a.slice(i, i + 10).map(w => "'" + w + "'").join(',')); return L.join(',\n'); };
const FILE = `/* rpg-badwords.js — filtr nevhodných jmen (sdílený pro všechny hry i HUB).
   AUTOMATICKY GENEROVÁNO: tools/build-badwords.cjs (spusť pro aktualizaci ze zdrojů).
   API: RPGBadWords.contains(name) → true; .norm(name); .SUBSTR; .EXACT.

   Zdroje: LDNOOBW (en,cs), chucknorris-io/swear-words (en,cs),
   censor-text/profanity-list (cs) + kurátorské CZ/SK doplňky (SK sdílí kořeny s CZ).
   Celkem ~${substr.length + exact.length} kořenů (${substr.length} podřetězcových + ${exact.length} celotokenových).

   Normalizace vstupu: malá písmena, pryč diakritika, leetspeak (0→o,1→i,3→e,4→a,
   5→s,7→t,@→a,$→s), pryč mezery/interpunkce ("F U C K"→"fuck"), 3+ opakování→1.
   SUBSTR = jednoznačné kořeny (podřetězec — chytí složeniny i "FUCK NIGGERS").
   EXACT  = krátká/kolizní slova (ass,sex,dick,pica…) jen jako CELÝ token, aby
            neblokovala běžná jména (Dickens, Picasso, Assunta, Massimo…).
*/
(function () {
  'use strict';
  var SUBSTR = [
${wrap(substr)}
  ];
  var EXACT = new Set([
${wrap(exact)}
  ]);
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
      .replace(/[0@]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e')
      .replace(/4/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't')
      .replace(/[^a-z]/g, '').replace(/(.)\\1{2,}/g, '$1');
  }
  function contains(str) {
    var joined = norm(str);
    if (!joined) return false;
    for (var i = 0; i < SUBSTR.length; i++) { if (joined.indexOf(SUBSTR[i]) !== -1) return true; }
    var toks = String(str).toLowerCase().split(/[^a-z0-9@$!|\\u00e0-\\u017f]+/i);
    for (var j = 0; j < toks.length; j++) { var t = norm(toks[j]); if (t && EXACT.has(t)) return true; }
    if (EXACT.has(joined)) return true;
    return false;
  }
  window.RPGBadWords = { contains: contains, norm: norm, SUBSTR: SUBSTR, EXACT: EXACT };
})();
`;
fs.writeFileSync(OUT, FILE);
console.log('OK →', OUT, `(${substr.length} substr + ${exact.length} exact = ${substr.length + exact.length})`);
