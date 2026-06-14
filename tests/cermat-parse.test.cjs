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

console.log('\n==========================================');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('==========================================');
process.exit(fail ? 1 : 0);
