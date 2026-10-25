#!/usr/bin/env node
/* Ruční náhodný průchod přijímačkami: node tools/prijimacky-nahodny-pruchod.cjs [stránka] [semínko] [kroků]
   Bez argumentů projde všech šest stránek v telefonu i tabletu se třemi semínky a 60 kroky. PNP_ZAZNAM=1 vypíše,
   co dítě dělalo (každý nález jde přehrát stejným semínkem). Jádro a pravidla jsou v tests/prijimacky-nahodny-pruchod.cjs. */
'use strict';
const { projdi, server, STRANKY, ROZMERY } = require('../tests/prijimacky-nahodny-pruchod.cjs');

{
  (async () => {
    const [, , s, sem, kr] = process.argv, srv = await server(), base = 'http://127.0.0.1:' + srv.address().port;
    const strs = s && STRANKY[s] ? [s] : Object.keys(STRANKY), semena = sem ? [+sem] : [1, 2, 3], kroku = +kr || 60;
    let celkem = 0;
    for (const stranka of strs) for (const rozmer of Object.keys(ROZMERY)) for (const semeno of semena) {
      const t0 = Date.now(), n = await projdi({ base, stranka, rozmer, semeno, kroku });
      celkem += n.length;
      console.log((n.length ? '❌' : '✅') + ' ' + stranka + ' ' + rozmer + ' sem ' + semeno + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)' + n.map(x => '\n     krok ' + x.krok + ': ' + x.co).join(''));
    }
    srv.close();
    process.exit(celkem ? 1 : 0);
  })();
}
