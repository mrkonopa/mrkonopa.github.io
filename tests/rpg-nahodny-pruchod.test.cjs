/* ══════════════════════════════════════════════════════════════════════
   Náhodný průchod bojem: žádná slepá ulička (8. 10. 2026, „občas mizelo tlačítko útok/další“).

   Žák s pevným semínkem dělá cokoli (správně, špatně, dvojí ťuknutí, Enter, vypršení času, předměty,
   otočení tabletu, klávesnice, odchod z boje a návrat) a po každém druhém kroku musí existovat ovladač,
   kterým jde pokračovat. Jádro a pravidla: tests/nahodny-pruchod.cjs. Plná varianta se zakrytím a
   geometrií je ruční nástroj tools/nahodny-pruchod-boje.cjs (na CI je jiný Chromium než v sandboxu,
   takže rozměry a zakrytí tam v bráně nehlídáme — hlídá je rpg-plovouci a tablet-landscape).

   Na kódu před opravou: ÚTOK zůstal ve 3.–8. ročníku od druhé úlohy vypnutý (99 ze 108 běhů),
   v jednom běhu z 126 se rozjela časomíra na mapě. Pokrytí je podmínka testu: když se nic nevyzkouší,
   0 nálezů nic neznamená (viz CLAUDE.md, „Když audit hlásí 0 nálezů, ověř, že vůbec něco viděl“).
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { spust } = require('./nahodny-pruchod.cjs');

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

(async () => {
  console.log('\n── Náhodný průchod bojem (7 her × telefon a tablet na šířku, semínka 1–3) ──\n');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'nahodny-pruchod-'));
  const v = await spust({ hry: [3, 4, 5, 6, 7, 8, 9], rozmery: ['tel', 'ips'], seedy: [1, 3], kroku: 50, geometrie: false, tiskni: false, out });

  ok('žádná slepá ulička, vypnuté tlačítko ani časomíra mimo boj', v.nalezy.length === 0,
    v.nalezy.slice(0, 3).map(n => `g${n.hra} ${n.rozmer} s${n.seed} ${n.kde}: ${n.problemy.join('; ')} [${n.kroky.slice(-4).join(' | ')}]`).join('  ///  '));

  // pokrytí: podlahy z měření (50 kroků × 3 semínka × 2 rozměry na hru: kroků ~290–300, usazených ~148,
  // správných textových odpovědí 15–37, správných celkem 28–54, čekání 22–31, předmětů 9–19) s rezervou 50 %
  const suma = (a, pred) => Object.entries(a).filter(([k]) => k.startsWith(pred)).reduce((s, [, c]) => s + c, 0);
  let odchodu = 0;
  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const z = v.zaHru[g] || { kroku: 0, usazenych: 0, akce: {} };
    ok(`g${g}: průchod se opravdu provedl (kroků ${z.kroku}, usazených stavů ${z.usazenych})`, z.kroku >= 200 && z.usazenych >= 100);
    ok(`g${g}: vyzkoušelo se odpovídání (správně text ${z.akce['správně (text)'] || 0}, správně celkem ${suma(z.akce, 'správně (')}, špatně ${suma(z.akce, 'špatně (')})`,
      (z.akce['správně (text)'] || 0) >= 7 && suma(z.akce, 'správně (') >= 14 && suma(z.akce, 'špatně (') >= 4);
    ok(`g${g}: vyzkoušelo se DÁLE, čekání na vypršení času a předměty (DÁLE ${z.akce['DÁLE'] || 0}, čekání ${suma(z.akce, 'čekání')}, předměty ${suma(z.akce, 'předmět')})`,
      (z.akce['DÁLE'] || 0) >= 8 && suma(z.akce, 'čekání') >= 8 && suma(z.akce, 'předmět') >= 3);
    odchodu += suma(z.akce, 'odchod');
  }
  ok(`vyzkoušel se i odchod z boje a návrat (${odchodu}× napříč hrami)`, odchodu >= 15);

  fs.rmSync(out, { recursive: true, force: true });
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
