/* ═════════════════════════════════════════════════════════════════
   Brána: náhodný průchod přijímačkami (jádro v prijimacky-nahodny-pruchod.cjs; ruční běh s víc semínky
   a kroky: node tests/prijimacky-nahodny-pruchod.cjs [stránka] [semínko] [kroků]).

   Dítě (generátor s pevným semínkem) ťuká, píše i nesmysly a vybírá z nabídek na všech šesti stránkách přijímaček
   v telefonu 360 px i v tabletu 820 px. Po každém kroku: žádná výjimka ani console.error, žádné přetečení do šířky,
   žádné „undefined / NaN / [object Object] / null“ ve viditelném textu, žádný prázdný obrázek, stránka nezamrzla,
   existuje aspoň jeden použitelný ovladač. Naměřeno 23. 10. 2026: 36 průchodů × 150 kroků (6 stránek × 2 rozměry
   × 3 semínka) = 0 nálezů; brána bere jedno semínko a 100 kroků na stránku a rozměr (12 průchodů), protože pevné
   semínko při změně stránek stejně prochází jinými cestami.

   JE TO TEST, KTERÝ MŮŽE MLČET, PROTO SE OVĚŘUJE SÁM:
     • statistika — průchod musí opravdu ťukat, psát a měnit obrazovky (jinak „0 nálezů“ nic neznamená);
     • dvě sabotáže přepisem ODPOVĚDI SERVERU (soubory se nemění): nápověda s „undefined“ a pád po „Nevím“ v diagnostice —
       průchod je musí najít.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { projdi, server, STRANKY, ROZMERY } = require('./prijimacky-nahodny-pruchod.cjs');
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

(async () => {
  const srv = await server(), base = 'http://127.0.0.1:' + srv.address().port, KROKU = 100, SEMENO = 11;
  console.log('\n── Náhodný průchod přijímačkami ──\n');
  let tuku = 0, poli = 0, vyberu = 0, kroku = 0;
  for (const stranka of Object.keys(STRANKY)) {
    const obrazovky = new Set();
    for (const rozmer of Object.keys(ROZMERY)) {
      const n = await projdi({ base, stranka, rozmer, semeno: SEMENO, kroku: KROKU });
      ok(n.length === 0, stranka + ' (' + rozmer + '): ' + n.stat.kroku + ' kroků bez nálezu', n.map(x => 'krok ' + x.krok + ': ' + x.co).join(' | '));
      tuku += n.stat.tuku; poli += n.stat.poli; vyberu += n.stat.vyberu; kroku += n.stat.kroku;
      n.stat.obrazovky.forEach(o => obrazovky.add(o));
    }
    /* Podpis s prázdným seznamem id (`…/|`) je přechodný stav těsně po navigaci, než se stránka vykreslí; chytí se jen někdy
       (index: 3 běhy po sobě 6, 6, 5 celkem, ale STÁLÝCH vždy 5; naměřeno 31. 10. 2026), takže se nepočítá. Práh je podle měření (stálé
       obrazovky index 5, ostatní 10–29): index 5, ostatní 6. Odhalilo to CI 31. 10. 2026 (5 místo 6). */
    const stale = [...obrazovky].filter(o => !/\|$/.test(o)).length, MIN = stranka === 'index' ? 5 : 6;
    ok(stale >= MIN, stranka + ': průchod prošel ' + stale + ' stálými obrazovkami (aspoň ' + MIN + ')');
  }
  ok(kroku >= 12 * KROKU * 0.95 && tuku >= 400 && poli >= 50 && vyberu >= 5, 'průchod opravdu jedná: ' + kroku + ' kroků, ' + tuku + '× ťuk, ' + poli + '× psaní do pole, ' + vyberu + '× výběr z nabídky (podlaha 1140 / 400 / 50 / 5)');
  srv.close();

  /* sabotáže: přepis odpovědi serveru; musí je najít, a musí se přepis opravdu uplatnit */
  const SAB = [
    ['nápověda 2 vypíše „undefined“', 'procvicovani', 'procvicovani.html', ["PZ.esc(PR.hints[i]||'')", "PZ.esc(i===1?String(PR.hints[7]):(PR.hints[i]||''))"], 1, /undefined/],
    ['„Nevím“ v diagnostice shodí skript', 'diagnostika', 'diagnostika.html', ['function dgNevim(){ dgZapis(false, null); }', 'function dgNevim(){ if(DG.k>0) DG.it.zzz.yyy; dgZapis(false, null); }'], 2, /výjimka/],
    ['stránka přetéká do šířky', 'statistiky', 'statistiky.html', ['</body>', '<div style="width:900px;height:4px;background:red"></div></body>'], 1, /přetéká|vyčnívá/],
    ['zacyklená úloha (zamrznutí)', 'procvicovani', 'procvicovani.html', ['function prHint(){', 'function prHint(){ if (PR.hintLevel === 1) { const t = Date.now(); while (Date.now() - t < 6000) {} }'], 1, /zamrzl|krok trval/]
  ];
  for (const [popis, stranka, soubor, prepis, semeno, vzor] of SAB) {
    const s = await server({ [soubor]: prepis }), b = 'http://127.0.0.1:' + s.address().port;
    let nalezy = [];
    for (const rozmer of ['tel', 'tab']) { nalezy = nalezy.concat(await projdi({ base: b, stranka, rozmer, semeno, kroku: 150 })); if (nalezy.some(x => vzor.test(x.co))) break; }
    ok(s.prepsano > 0, 'sabotáž „' + popis + '“ se aplikovala (přepis uplatněn ' + s.prepsano + '×)');
    ok(nalezy.some(x => vzor.test(x.co)), 'sabotáž „' + popis + '“ je chycena (' + (nalezy[0] ? nalezy[0].co.slice(0, 70) : 'nic') + ')', 'průchod prošel i nad rozbitou stránkou');
    s.close();
  }
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
