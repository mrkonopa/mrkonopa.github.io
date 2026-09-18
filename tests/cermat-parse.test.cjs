/* Verifikace CERMAT scraperu — jednotková kontrola parseDate()
   z .github/scripts/fetch-cermat.js (parser data JPZ z webu CERMAT).
   Spusť: node tests/cermat-parse.test.cjs
*/
const { parseDate } = require('../.github/scripts/fetch-cermat.js');

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✅ ' + m)) : (fail++, console.log('  ❌ ' + m)); };

const CUR = new Date().getFullYear();
const Y = CUR + 1;            // rok v povoleném okně [CUR, CUR+2]
const TOO_OLD = CUR - 5;      // mimo okno

// 1) Reálná věta s kontextem JPZ → najde datum
{
  const html = `<main><h2>Termíny</h2>
    <p>Jednotná přijímací zkouška z matematiky proběhne v 1. termínu dne 14. dubna ${Y}.</p>
  </main>`;
  const r = parseDate(html, CUR);
  ok(r && r.date === `${Y}-04-14`, `najde datum s kontextem JPZ (${r && r.date})`);
  ok(r && r.round === 1 && r.year === Y, `vrací round=1 a year=${Y}`);
}

// 2) Datum bez kontextu → null (nesmí brát náhodné datum ze stránky)
{
  const html = `<p>Dnešní teplota byla naměřena 14. dubna ${Y} ráno, bylo hezky.</p>`;
  const r = parseDate(html, CUR);
  ok(r === null, 'datum bez kontextu JPZ ignoruje (null)');
}

// 3) Rok mimo okno (příliš starý) → null
{
  const html = `<p>Jednotná přijímací zkouška 1. termín 14. dubna ${TOO_OLD}.</p>`;
  const r = parseDate(html, CUR);
  ok(r === null, `rok ${TOO_OLD} mimo okno [${CUR},${CUR + 2}] → null`);
}

// 4) Více dat s kontextem → preferuje duben (typický měsíc JPZ)
{
  const html = `
    <p>Náhradní 1. termín: 10. března ${Y}.</p>
    <p>Jednotná přijímací zkouška – 1. termín 14. dubna ${Y}.</p>`;
  const r = parseDate(html, CUR);
  ok(r && r.date === `${Y}-04-14`, `z více dat vybere duben, ne březen (${r && r.date})`);
}

// 5) Varianta formátování "1. kolo" a HTML tagy mezi slovy
{
  const html = `<div>JPZ <b>1.&nbsp;kolo</b> se koná <span>22. dubna ${Y}</span></div>`;
  const r = parseDate(html, CUR);
  ok(r && r.date === `${Y}-04-22`, `zvládne tagy/entitu kolem data (${r && r.date})`);
}

// 6) Prázdná / nesmyslná stránka → null (nikdy nespadne)
{
  ok(parseDate('<html><body>nic tu není</body></html>', CUR) === null, 'prázdná stránka → null');
  ok(parseDate('', CUR) === null, 'prázdný řetězec → null');
}

/* 7) SKUTEČNÁ stránka CERMATu — vymyšlené HTML výše nestačilo.
   Parser pět týdnů v řadě hlásil „No date found in page" při HTTP 200,
   protože web posílá češtinu v entitách: „1. ŘÁDNÝ TERMÍN" je ve zdroji
   `1. &#344;&Aacute;DN&Yacute; TERM&Iacute;N`. Fixtura je doslovný výřez
   tabulky, takže tenhle test padá přesně tehdy, když by spadl i ostrý job.

   Druhá půlka je stejně důležitá: tabulka nese DVA řádky a ten druhý patří
   šestiletým a osmiletým gymnáziím (14. a 15. 4.). Právě tahle záměna už
   jednou ručně proběhla, takže se hlídá i to, že se gymnaziální datum
   nevezme. */
{
  const fs = require('fs');
  const path = require('path');
  const cesta = path.join(__dirname, 'fixtures', 'cermat-jpz-2027.html');
  const html = fs.readFileSync(cesta, 'utf8');

  ok(/&#344;|&Aacute;|&nbsp;/.test(html),
    'fixtura opravdu obsahuje HTML entity (jinak by test nic nedokazoval)');

  const r = parseDate(html, 2026);
  ok(r !== null, 'na skutečné stránce CERMATu datum NAJDE (dřív vracela null)');
  ok(r && r.date === '2027-04-12',
    `bere 1. řádný termín ČTYŘLETÝCH oborů: 2027-04-12 (dostal ${r && r.date})`);
  ok(r && r.date !== '2027-04-14',
    'nevezme termín šestiletých a osmiletých gymnázií (14. 4.) — jiný typ školy');
  ok(r && r.date !== '2027-04-29' && r.date !== '2027-04-30',
    'nevezme náhradní termín (29./30. 4.) — odpočet míří na řádný');
}

/* 8) Omezení na řádek čtyřletých oborů — POCTIVĚ.
   Na skutečné tabulce výše ta pojistka NENÍ nosná: čtyřleté mají 12. 4.
   a gymnázia 14. 4., takže „nejdřívější duben" trefí správný řádek i bez ní.
   Kdyby to CERMAT jednou otočil (gymnázia dřív, nebo je uvedl jako první),
   pravidlo „ber nejdřívější" by tiše sáhlo po cizím termínu. Tady je proto
   pořadí řádků prohozené — a bez omezení by test spadl na 10. dubna. */
{
  const html = `<table><tr><th>OBOR VZD&Eacute;L&Aacute;N&Iacute;</th><th>1. &#344;&Aacute;DN&Yacute; TERM&Iacute;N</th></tr>
    <tr><td>Obory &scaron;estilet&yacute;ch a osmilet&yacute;ch gymn&aacute;zi&iacute;</td><td>10. dubna 2027</td></tr>
    <tr><td>&#268;ty&#345;let&eacute; obory a obory n&aacute;stavbov&eacute;ho studia</td><td>16. dubna 2027</td></tr></table>`;
  const r = parseDate(html, 2026);
  ok(r && r.date === '2027-04-16',
    `i když jsou gymnázia v tabulce první, bere řádek čtyřletých (dostal ${r && r.date})`);
}

console.log('\n==========================================');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('==========================================');
process.exit(fail ? 1 : 0);
