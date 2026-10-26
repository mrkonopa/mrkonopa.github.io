/* Pomocník testů: počkat, až jsou VŠECHNA písma stránky skutečně načtená.

   Od 26. 10. 2026 jsou písma vlastní (`fonts/fonts.css`, podmnožiny latin a latin-ext s `unicode-range`)
   a prohlížeč je stahuje LÍNĚ — až když se poprvé vykreslí znak, který podmnožina nese. Test, který měří
   rozvržení hned po `domcontentloaded` a po prvním vykreslení nové obrazovky (např. trénink s „č“), proto
   může změřit záložní písmo (jiné šířky), ne to, které uvidí dítě: `tablet-landscape` tak v 8. ročníku
   hlásil vstup 21 px pod okrajem, a když se písma načetla předem, prošel 23 / 23.
   `document.fonts.ready` nestačí — vyřeší se i tehdy, když se nic nenačítá —, proto se každá `FontFace`
   načte výslovně. Volat po `page.goto` všude, kde se měří přesné rozměry hned po vykreslení. */
'use strict';
async function nactiPisma(page) {
  await page.evaluate(() => Promise.all([...document.fonts].map(f => f.load().catch(() => null))).then(() => document.fonts.ready)).catch(() => {});
}
module.exports = { nactiPisma };
