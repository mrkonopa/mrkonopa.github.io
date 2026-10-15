/* konstrukce-pokryti.test.cjs — kolik rýsovacích úloh z ostrých testů M9 (2015–2026) umíme.
   Zdroj: tools/cermat-archiv/konstrukce-m9.json — 74 konstrukcí (úlohy 9 a 10), každá s údaji
   „co je dáno / jaké podmínky / hledá se víc řešení“ a s tím, který náš typ ji pokrývá.
   V souboru jsou jen vlastní shrnutí, žádný doslovný text zadání (pravidla CZVV).

   PROČ TEST: slovo „všechny konstrukce z testů máme“ je tvrzení, které se bez měření rozejde
   s realitou (u prvního průchodu jsme pokrývali 28 z 74). Test drží tři věci:
   1) tabulka je úplná a vnitřně shodná (74 řádků, jednoznačná čísla, krátká shrnutí),
   2) KAŽDÝ řádek s `pokryti: "ano"` ukazuje na typ, který ve skutečnosti existuje v
      PZ_KONSTRUKCE.TYPY — přejmenování nebo smazání typu tedy tabulku neotráví potichu,
   3) počet pokrytých je PRAHOVÁ HODNOTA, která smí jen růst: kdo přidá typ a opraví řádek, musí
      zvednout PODLAHA_ANO; kdo typ smaže, spadne pod ni. Podlaha se zvedá i při zlepšení (test
      jinak spadne), aby nezůstala zastaralá. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = {};
require(path.join(ROOT, 'projects/prijimacky-matematika/konstrukce-geo.js'));
require(path.join(ROOT, 'projects/prijimacky-matematika/konstrukce-ulohy.js'));
const K = global.window.PZ_KONSTRUKCE;

const PODLAHA_ANO = 28;   // zvedni, když přibude pokrytá konstrukce (viz hlavička)
const POCET_RADKU = 74;   // M9 2015–2026: 74 konstrukcí na pozicích 9 a 10

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/cermat-archiv/konstrukce-m9.json'), 'utf8'));
const ano = T.filter(r => r.pokryti === 'ano'), cast = T.filter(r => r.pokryti === 'cast'), ne = T.filter(r => r.pokryti === 'ne');

console.log('\n── Pokrytí ostrých konstrukcí M9 našimi typy ──\n');
ok(T.length === POCET_RADKU, 'tabulka má ' + POCET_RADKU + ' konstrukcí (je jich ' + T.length + ')');
ok(new Set(T.map(r => r.id)).size === T.length, 'čísla řádků jsou jednoznačná');
ok(T.every(r => ['ano', 'cast', 'ne'].includes(r.pokryti)), 'pokrytí je jen ano / cast / ne');
ok(T.every(r => r.rok >= 2015 && r.rok <= 2026 && [9, 10].includes(r.uloha) && [2, 3].includes(r.body)),
  'každý řádek je úloha 9 nebo 10 za 2 nebo 3 body z let 2015–2026');
ok(T.every(r => r.obrazec && r.dane && r.podminky && typeof r.vsechna === 'boolean'), 'každý řádek má obrazec, dané, podmínky a příznak „všechna řešení“');
const dlouhe = T.filter(r => String(r.podminky).length > 120 || String(r.dane).length > 60 || String(r.obrazec).length > 60);
ok(dlouhe.length === 0, 'shrnutí jsou krátká (žádný doslovný text zadání)', dlouhe.map(r => r.id).join());

// Typ musí existovat; „ano“ ho musí mít vždy
const chybiTyp = ano.filter(r => !r.typ);
ok(chybiTyp.length === 0, 'každý řádek „ano“ uvádí typ', chybiTyp.map(r => r.id).join());
const neexistuje = T.filter(r => r.typ && !K.TYPY.includes(r.typ));
ok(neexistuje.length === 0, 'každý uvedený typ opravdu existuje v PZ_KONSTRUKCE.TYPY', neexistuje.map(r => r.id + ':' + r.typ).join());
ok(ne.every(r => !r.typ), 'řádek „ne“ typ neuvádí (jinak by nebyl „ne“)', ne.filter(r => r.typ).map(r => r.id).join());

// Práh smí jen růst
ok(ano.length >= PODLAHA_ANO, 'pokrytých konstrukcí je alespoň ' + PODLAHA_ANO + ' (je ' + ano.length + ')');
ok(ano.length <= PODLAHA_ANO, 'podlaha je aktuální: pokrytých je ' + ano.length + ' a PODLAHA_ANO je ' + PODLAHA_ANO + (ano.length > PODLAHA_ANO ? ' — zvedni ji' : ''));

// Přehled pro člověka
const rocni = r => r.rok >= 2023;
const nov = T.filter(rocni);
console.log('\n  Pokryto: ' + ano.length + ' ano / ' + cast.length + ' část / ' + ne.length + ' ne z ' + T.length +
  ' (2023–2026: ' + nov.filter(r => r.pokryti === 'ano').length + ' ano z ' + nov.length + ')');
const pouzite = new Set(T.map(r => r.typ).filter(Boolean));
console.log('  Typy bez řádku v tabulce (' + K.TYPY.filter(t => !pouzite.has(t)).length + '): ' + K.TYPY.filter(t => !pouzite.has(t)).join(', '));

console.log('\n  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
