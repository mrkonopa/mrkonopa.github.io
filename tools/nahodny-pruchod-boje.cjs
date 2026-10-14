/* Ruční nástroj: náhodný průchod bojem s plnou geometrií (zásah, zakrytí toasty a přišpendlenou lištou).
   Jádro a popis pravidel: tests/nahodny-pruchod.cjs. Brána pouští jen logickou část.

   node tools/nahodny-pruchod-boje.cjs [hry=3,9] [rozmery=tel,ipv,ips] [seedy=1-6] [kroku=70]
                                       [anim=1] [tutorial=1] [out=cesta] [koren=cesta k repu]
   `koren` dovolí pustit TOTÉŽ měřidlo nad jinou verzí webu (např. složka s vyexportovanou starou verzí). */
'use strict';
const path = require('path');
const { spust } = require('../tests/nahodny-pruchod.cjs');
const arg = (k, d) => { const a = process.argv.slice(2).find(x => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
(async () => {
  const t0 = Date.now();
  const v = await spust({
    koren: arg('koren', undefined), out: arg('out', path.join(__dirname, '..', 'tmp-fuzz')),
    hry: arg('hry', '3,4,5,6,7,8,9').split(',').map(Number), rozmery: arg('rozmery', 'tel,ipv,ips').split(','),
    seedy: arg('seedy', '1-6').split('-').map(Number), kroku: +arg('kroku', 70),
    anim: arg('anim', '0') === '1', tutorial: arg('tutorial', '0') === '1', geometrie: true,
  });
  const tridy = {}; for (const n of v.nalezy) for (const p of n.problemy) { const k = p.replace(/\d+/g, '#').slice(0, 90); tridy[k] = (tridy[k] || 0) + 1; }
  console.log('\nNÁLEZY podle druhu:'); for (const [k, c] of Object.entries(tridy).sort((a, b) => b[1] - a[1])) console.log('  ' + String(c).padStart(4) + '× ' + k);
  console.log(`\n${v.nalezy.length} nálezů, ${Math.round((Date.now() - t0) / 1000)} s. Podrobnosti: ${path.join(v.out, 'nalezy.json')}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
