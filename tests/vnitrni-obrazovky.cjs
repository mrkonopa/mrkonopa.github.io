/* ══════════════════════════════════════════════════════════════════════
   VNITŘNÍ OBRAZOVKY — kam se plošné audity dřív nedostaly.

   Kontrast, přístupná jména i dotykové plochy se měřily jen na ÚVODNÍ
   obrazovce každé stránky. Velký průchod 5. 10. 2026 prošel i to, kam se žák
   dostane až klikáním (boj, trénink, teorie, profil, obchod, věž, běžící test,
   rozbor, konec diagnostiky, procvičování po chybě, statistiky s daty,
   konstrukce po vyhodnocení) a našel 24 skupin textu pod prahem kontrastu
   (nejhorší 2,79 : 1) a 25 polí odpovědí bez přístupného názvu.

   Každá položka: stránka + kroky (kód, který se pustí na stránce, a jméno
   obrazovky, kterou vytvoří). Kroky jdou po sobě na téže stránce.
   Sdílí: kontrast.audit.cjs, a11y.audit.cjs.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const OBRAZOVKY = [];
for (const g of [3, 4, 5, 6, 7, 8, 9]) OBRAZOVKY.push({ url: `/projects/rpg-mat-${g}.html`, jm: `RPG ${g}`, kroky: [
  ['mapa', `document.getElementById('ni').value='Test'; startGame(); S.tutorialDone=true; go('map'); if (window.renderMap) renderMap();`],
  ['oblast', `openArea(AREAS[1].id);`],
  ['boj', `const ar = AREAS[2], mi = ar.missions.find(m => !m.mc) || ar.missions[0]; launchBattle(ar.id, mi.id); const i = BT.tasks.findIndex(t => !isYN(t)); if (i >= 0) { BT.mini[i] = null; BT.idx = i; renderTask(); }`],
  ['boj po chybě + nápověda', `const inp = document.getElementById('bt-ans'); if (inp) { inp.value = '987654'; submitAnswer(); } if (window.showHint) { showHint(); showHint(); }`],
  ['trénink + chyba + nápověda', `go('train'); startTrain(AREAS[3].missions[1].id); const a = document.getElementById('tr-ans'); if (a && a.offsetParent) { a.value = '987654'; trSubmit(); } if (window.trHint) { trHint(); trHint(); }`],
  ['teorie', `startLearn(AREAS[0].missions[0].id);`],
  ['profil', `go('profile'); if (window.renderProfile) renderProfile();`],
  ['obchod', `go('shop'); if (window.renderShop) renderShop();`],
  ...(g >= 6 ? [['věž', `go('tower'); if (window.renderTowerGate) renderTowerGate(); if (window.twStart) twStart();`]] : []),
] });
OBRAZOVKY.push({ url: '/projects/prijimacky-matematika/test.html', jm: 'test nanečisto', kroky: [
  ['běžící test', `cmStart();`],
  ['rozbor', `CM.timeLeft = 0; if (window.cmSubmit) cmSubmit(true); else if (window.cmTick) cmTick();`],
] });
OBRAZOVKY.push({ url: '/projects/prijimacky-matematika/diagnostika.html', jm: 'diagnostika', kroky: [
  ['úloha', `dgStart();`],
  ['konec', `for (let i = 0; i < 40 && document.getElementById('dg-run').style.display !== 'none'; i++) dgNevim();`],
] });
OBRAZOVKY.push({ url: '/projects/prijimacky-matematika/procvicovani.html', jm: 'procvičování', kroky: [
  ['úloha', `prStart('geometrie');`],
  // nápovědy PŘED odpovědí: po odpovědi prHint() nic neukáže (PR.answered), takže dřív
  // se štítky nápověd změřily jen u úloh s výběrem — a L3 „Výsledek“ s 2,39 : 1 proklouzl
  ['tři nápovědy', `prHint(); prHint(); prHint();`],
  ['po odpovědi', `const i = document.getElementById('pr-input'), r = document.querySelector('input[name=pr-mc]');
    if (i) { i.value = '987654'; prSubmit(); } else if (r) { r.checked = true; prSubmit(); } else prSubmitYN('A');`],
] });
OBRAZOVKY.push({ url: '/projects/prijimacky-matematika/statistiky.html', jm: 'statistiky', kroky: [
  ['s daty', `const MAX = [1, 2, 4, 4, 4, 4, 3, 3, 3, 3, 4, 2, 2, 2, 6, 3];
    const att = [30, 34, 38, 41, 36, 44].map((s, i) => ({ date: '2026-0' + (i + 3) + '-10', t: i + 1, score: s, max: 50, cas: 3300,
      ulohy: MAX.map((m, j) => [j === 14 ? 2 : j === 10 ? 3 : m, m, j === 14 ? 'procenta' : j === 10 ? 'geometrie' : null]) }));
    localStorage.setItem('PZ_CERMAT_ATTEMPTS', JSON.stringify(att));
    localStorage.setItem('PZ_PRACTICE_PROGRESS', JSON.stringify({ zlomky: { ok: 2, total: 8 }, geometrie: { ok: 5, total: 9 } }));
    localStorage.setItem('PZ_DIAG_LAST', JSON.stringify({ date: '2026-09-01', ver: 2, ok: 11, n: 20, topics: PZ_TOPICS.list.map((t, i) => ({ id: t.id, level: i % 4, correct: i % 4 >= 2 })) }));
    render();`],
] });
OBRAZOVKY.push({ url: '/projects/prijimacky-matematika/konstrukce.html', jm: 'konstrukce', kroky: [
  ['po vyhodnocení + nápovědy', `knVyhodnot(); knNapoveda(); knNapoveda(); knNapoveda();`],
] });

/* Projde všechny obrazovky a pro každou zavolá `mer(page, jmeno)`.
   Krok, který spadne, se vrátí jako chyba (audit pak zčervená — obrazovka,
   na kterou se nedá dostat, se nedá ani změřit). */
async function projdi(browser, base, mer, volby) {
  const chyby = []; let obrazovek = 0;
  for (const o of OBRAZOVKY) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1024, height: 768 } }, volby || {}));
    await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    const page = await ctx.newPage();
    // věž je o prázdninách zavřená — pevné datum, ať audit platí po celý rok
    await page.addInitScript(() => { window.__TW_TESTNOW = '2026-05-15T10:00:00'; });
    await page.goto(base + o.url, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(600);
    for (const [jm, kod] of o.kroky) {
      const chyba = await page.evaluate(k => { try { new Function(k)(); return ''; } catch (e) { return e.message; } }, kod);
      await page.waitForTimeout(250);
      if (chyba) { chyby.push(o.jm + ' / ' + jm + ': ' + chyba.slice(0, 100)); continue; }
      obrazovek++;
      await mer(page, o.jm + ' / ' + jm);
    }
    await ctx.close();
  }
  return { obrazovek, chyby };
}

module.exports = { OBRAZOVKY, projdi };
