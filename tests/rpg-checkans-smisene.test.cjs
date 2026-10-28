/* ═══════════════════════════════════════════════════════════════════════
   checkAns v RPG přijímá SMÍŠENÉ ČÍSLO („1 4/5“) jako správný zápis nepravého zlomku (9/5).

   Našlo se 28. 10. 2026 při auditu nejchybovějších misí (7/2-2 a 7/2-3 zlomky, 2,6 chyby na úkol):
   `norm` v checkAns odstraní mezery, takže z „1 4/5“ vzniklo „14/5“ (= 2,8) a správná odpověď na
   „Sečti celé číslo se zlomkem: 1 + 4/5 = ?“ (9/5) dostala „špatně“. A naopak: „1 2/3“ se po odstranění
   mezer rovnalo řetězci „12/3“, takže prošlo za správné, kdyby byla odpověď 12/3.
   Změřeno v bankách: nepravý zlomek bez pokynu k zápisu (zlomek / nepravý / smíšené) mají odpovědi
   86 z 1 909 úloh se zlomkem v 7. ročníku (mise 2-2, 2-3) a 66 z 508 v 8. ročníku (mise 1-2, 13 %).

   Test načte SKUTEČNOU funkci z `projects/rpg-shared.js` (ne kopii) a ověří: smíšená čísla projdou,
   chybná ne, kolize s řetězcem nezůstala, nic dalšího se nezměnilo (tisícová mezera, jednotka, čárka),
   a v 7. a 8. ročníku platí pro KAŽDÝ nepravý zlomek z procházení (a/b → „w n/d“). Dvě sabotáže zdroje
   (bez větve smíšeného čísla; bez podmínky u zkratky) musí test shodit.
   Spusť: node tests/rpg-checkans-smisene.test.cjs
   ═══════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-shared.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function nactiCheckAns(src) {
  const m = src.match(/function checkAns\(raw, correct\)\{[\s\S]*?\n\}\n/);
  if (!m || m[0].length < 300) throw new Error('checkAns se v rpg-shared.js nenašel');
  return new Function(m[0] + ';return checkAns;')();
}

const PRIPADY = [
  // smíšené číslo = správný zápis nepravého zlomku
  ['1 4/5', '9/5', true], ['3 1/6', '19/6', true], ['2 1/2', '5/2', true], ['  2 1/2 ', '5/2', true], ['2  1/2', '5/2', true],
  ['1 4/5', '1,8', true], ['1 4/5', '1.8', true],
  ['-1 1/2', '-3/2', true], ['−1 1/2', '-3/2', true], ['– 1 1/2', '-3/2', true], ['- 1 1/2', '-3/2', true], ['-1 1/2', '3/2', false],   // mínus s mezerou je taky záporné smíšené číslo (jako „- 5/8“ v přijímačkách)
  // chybné smíšené číslo neprojde
  ['1 3/5', '9/5', false], ['2 4/5', '9/5', false], ['1 4/6', '9/5', false], ['0 4/5', '9/5', false], ['1 4/0', '9/5', false],
  // dřívější kolize: po odstranění mezer bylo „1 2/3“ totéž co „12/3“
  ['1 2/3', '12/3', false], ['2 1/2', '21/2', false],
  // nic dalšího se nezměnilo
  ['9/5', '9/5', true], ['18/10', '9/5', true], ['1,8', '9/5', true], ['0,83', '5/6', true], ['12 000', '12000', true],
  ['1 000 000', '1000000', true], ['12 kg', '12', true], ['−5', '-5', true], ['5', '6', false], ['2/3', '3/2', false], ['', '5', false],
];

function behemPripadu(checkAns, popis) {
  const spatne = [];
  for (const [u, c, ocek] of PRIPADY) {
    let v; try { v = checkAns(u, c); } catch (e) { v = 'výjimka: ' + e.message; }
    if (v !== ocek) spatne.push(JSON.stringify(u) + ' vs ' + c + ' → ' + v + ' (čekáno ' + ocek + ')');
  }
  return spatne;
}

console.log('── Ruční případy ──');
const checkAns = nactiCheckAns(SRC);
const spatne = behemPripadu(checkAns);
ok(spatne.length === 0, PRIPADY.length + ' případů (smíšené číslo, chybné, kolize, beze změny)', spatne.slice(0, 3).join(' | '));

console.log('── Každý nepravý zlomek: „w n/d“ projde, jiné ne ──');
const gcd = (a, b) => b ? gcd(b, a % b) : a;
let zlomku = 0, dobre = 0, spatneOdm = 0, kolize = 0; const hlasky = [];
for (let d = 2; d <= 12; d++) for (let a = d + 1; a <= 6 * d; a++) {
  if (a % d === 0) continue;                       // celé číslo smíšené číslo nemá
  zlomku++;
  const w = Math.floor(a / d), n = a % d, spr = a + '/' + d;
  if (checkAns(w + ' ' + n + '/' + d, spr) === true) dobre++; else hlasky.push(w + ' ' + n + '/' + d + ' vs ' + spr);
  // o jednu větší nebo menší celá část / čitatel není správně
  const spatnaCela = checkAns((w + 1) + ' ' + n + '/' + d, spr), spatnyCit = n + 1 < d ? checkAns(w + ' ' + (n + 1) + '/' + d, spr) : false;
  if (spatnaCela === false && spatnyCit === false) spatneOdm++;
  // řetězcová kolize: „w n/d“ nesmí projít za zlomek zapsaný bez mezery („1 2/3“ za „12/3“), když se hodnoty liší
  const slepene = w + '' + n + '/' + d, hodnotaSlepene = parseInt(w + '' + n, 10) / d, hodnotaSmis = w + n / d;
  if (Math.abs(hodnotaSlepene - hodnotaSmis) > 0.016 && checkAns(w + ' ' + n + '/' + d, slepene) === false) kolize++;
  else if (Math.abs(hodnotaSlepene - hodnotaSmis) <= 0.016) kolize++;       // shodné hodnoty: nic k rozlišení
}
ok(zlomku >= 300, 'prošlo se dost nepravých zlomků: ' + zlomku + ' (naměřeno 330, podlaha 300)');
ok(dobre === zlomku, 'smíšené číslo projde u všech ' + zlomku + ' zlomků', hlasky.slice(0, 3).join(' | '));
ok(spatneOdm === zlomku, 'chybná celá část i chybný čitatel neprojdou u všech ' + zlomku);
ok(kolize === zlomku, 'smíšené číslo neprojde za slepený zápis bez mezery (dřívější kolize)');

console.log('── Zdroj: jedna definice ve sdíleném skriptu ──');
for (const g of [3, 4, 5, 6, 7, 8, 9]) {
  const html = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-mat-' + g + '.html'), 'utf8');
  ok(!/function checkAns\s*\(/.test(html), g + '. ročník nemá vlastní kopii checkAns');
}

console.log('── Sabotáže: test musí spadnout ──');
const sab = (nazev, preved) => {
  const m = SRC.match(/function checkAns\(raw, correct\)\{[\s\S]*?\n\}\n/)[0];
  const zmeneno = preved(m);
  if (zmeneno === m) { ok(false, 'sabotáž „' + nazev + '“ se neaplikovala (vzor v kódu není)'); return; }
  const f = new Function(zmeneno + ';return checkAns;')();
  const s = behemPripadu(f);
  ok(s.length >= 1, 'sabotáž „' + nazev + '“ je chycena (' + s.length + ' selhání)');
};
sab('smíšené číslo se čte jako dřív (jen evalS)', m => m.replace('const un=isNaN(su)?evalS(u):su, cn=isNaN(sc)?evalS(c):sc;', 'const un=evalS(u), cn=evalS(c);').replace('if(u===c && isNaN(smis(raw))) return true;', 'if(u===c) return true;'));
sab('zkratka u===c bez podmínky (kolize 1 2/3 = 12/3)', m => m.replace('if(u===c && isNaN(smis(raw))) return true;', 'if(u===c) return true;'));
/* Záměrně NENÍ sabotáž „nulový jmenovatel se nehlídá“: je to ekvivalentní mutant. Bez podmínky vyjde z „1 4/0“ nekonečno, které se s žádným
   konečným číslem nerovná, takže výsledek je `false` stejně; podmínka `+m[4]` jen dokumentuje záměr (případ „1 4/0“ je výše mezi ručními). */

console.log('\n' + (fail ? '❌' : '✅') + ' checkAns a smíšená čísla: ' + pass + ' ✅, ' + fail + ' ❌');
process.exit(fail ? 1 : 0);
