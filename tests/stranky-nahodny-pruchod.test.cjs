/* ═════════════════════════════════════════════════════════════════
   Brána: náhodný průchod ostatními VZDĚLÁVACÍMI stránkami (osm únikovek, procenta_priklady, Cesta peněz,
   goniometrie, narozeniny, papír). Jádro je to samé jako u přijímaček (`prijimacky-nahodny-pruchod.cjs`):
   seedované „dítě“ ťuká, píše nesmysly a vybírá z nabídek; po každém kroku žádná výjimka, žádné přetečení, žádné
   „undefined / NaN / [object Object] / null“, žádný prázdný obrázek, žádné zamrznutí, použitelný ovladač.

   Hned první běh našel skutečnou vadu: v Cestě peněz po dohrání kapitoly vlajka CZ/EN vyhodila výjimku
   (`renderScene` bez scény) a obrazovka „Kapitola hotová“ se nepřeložila — viz `cesta-penez-jazyk.test.cjs`.
   Proto je tu i sabotáž: server vrátí stránku se starým řádkem a průchod ji MUSÍ najít (se semínkem 1 ji najde
   v 99. kroku).

   Úlohy v únikovkách jdou dál jen správnou odpovědí, takže náhodné psaní projde jen úvodem a prvním zámkem (3–4 obrazovky);
   hlubší cesty hlídají jejich vlastní testy. Stránka `ucitel.html` je za heslem (pole `password` dítě-průchod nepoužívá).
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { projdi, server } = require('./prijimacky-nahodny-pruchod.cjs');
const STR = require('./stranky.cjs');
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const seznam = STR.STRANKY;
const STRANKY = seznam.map(p => (p.url.startsWith('/') ? p.url : '/' + p.url))
  .filter(u => /^\/projects\/(unikovka_[a-z_]+|cesta_penez|procenta_priklady|goniometrie|papir|narozeniny)\.html$/.test(u));
const ROZMERY = ['tel', 'tab'], KROKU = 100;

(async () => {
  console.log('\n── Náhodný průchod ostatními vzdělávacími stránkami ──\n');
  ok(STRANKY.length >= 13, 'v seznamu stránek je ' + STRANKY.length + ' vzdělávacích stránek (osm únikovek + 5; podlaha 13)');
  const srv = await server(), base = 'http://127.0.0.1:' + srv.address().port;
  let kroku = 0, tuku = 0;
  for (const url of STRANKY) {
    let obrazovky = new Set(), nalezy = [];
    for (const rozmer of ROZMERY) {
      const n = await projdi({ base, stranka: 'x', rozmer, semeno: 1, kroku: KROKU, url, sekce: url });
      nalezy = nalezy.concat(n.map(x => rozmer + ' krok ' + x.krok + ': ' + x.co));
      kroku += n.stat.kroku; tuku += n.stat.tuku; n.stat.obrazovky.forEach(o => obrazovky.add(o));
    }
    ok(nalezy.length === 0, url.replace('/projects/', '') + ': ' + KROKU * ROZMERY.length + ' kroků bez nálezu (' + obrazovky.size + ' obrazovek)', nalezy.slice(0, 3).join(' | '));
  }
  ok(kroku >= STRANKY.length * ROZMERY.length * KROKU * 0.95 && tuku >= STRANKY.length * ROZMERY.length * 40, 'průchod opravdu jedná: ' + kroku + ' kroků, ' + tuku + '× ťuk');
  srv.close();

  /* sabotáž: Cesta peněz bez opravy přepnutí jazyka na obrazovce „Kapitola hotová“ */
  const sab = await server({ 'cesta_penez.html': ['if (sceneIdx >= activeAct.scenes.length) showActComplete(); else renderScene();', 'renderScene();'] });
  const b2 = 'http://127.0.0.1:' + sab.address().port;
  let nalez = [];
  for (const rozmer of ROZMERY) { nalez = nalez.concat(await projdi({ base: b2, stranka: 'x', rozmer, semeno: 1, kroku: KROKU, url: '/projects/cesta_penez.html', sekce: '/projects/cesta_penez.html' })); if (nalez.length) break; }
  ok(sab.prepsano > 0, 'sabotáž „Cesta peněz bez opravy jazyka“ se aplikovala (přepis uplatněn ' + sab.prepsano + '×)');
  ok(nalez.some(x => /výjimka/.test(x.co)), 'sabotáž „Cesta peněz bez opravy jazyka“ je chycena (' + (nalez[0] ? nalez[0].co.slice(0, 70) : 'nic') + ')', 'průchod prošel i nad starým kódem');
  sab.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
