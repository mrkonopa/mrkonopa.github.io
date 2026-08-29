/* ══════════════════════════════════════════════════════════════════════
   Čas na úlohu se řídí její DÉLKOU, ne jednou konstantou.

   PROČ. Naměřeno na 574 080 úlohách: v 8. ročníku je 93,9 % zadání
   víceřádkových slovních úloh a v 9. 85,8 % — a měly stejných 40 s jako
   jednořádkové „NSN(4, 7) = ?". Ve 3. ročníku je víceřádkových 0,4 %
   a času bylo 60 s. Nejmladší tedy dostávali nejvíc času na nejkratší
   zadání.

   Pravidlo: +1 s za každých 6 znaků nad 50, nejvýš +25 s. Čas se tím
   NIKDY NEZKRACUJE — to je hlavní invariant, který tenhle test hlídá.

   Testuje se v PROHLÍŽEČI přes skutečný boj, ne jen výpočet funkce:
   `BT.curLimit` se nastavuje na dvou místech (renderTask a startTimer)
   a v startTimer proměnná `t` NEEXISTUJE — na tom jsem se při psaní
   nachytal a hra by spadla. Proto se ověřuje i to, že boj vůbec běží.

   Spusť: node tests/rpg-cas-podle-ulohy.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PORT = 19121;
let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const f = path.normalize(path.join(ROOT, u));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});

const ZAKLAD = { 3: 60, 4: 55, 5: 50, 6: 40, 7: 40, 8: 40, 9: 40 };

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const ctx = await br.newContext();
    await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const chyby = [];
    pg.on('pageerror', e => chyby.push(e.message));
    await pg.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => typeof startGame === 'function', { timeout: 8000 });

    const r = await pg.evaluate(() => {
      localStorage.clear(); startGame('Testovací žákyně'); S.tutorialDone = true;
      const f = casNaUlohu;
      const zaklad = TIME_PER_TASK;
      return {
        zaklad,
        kratka: f({ text: '3 × ? = 6' }),
        prah:   f({ text: 'x'.repeat(50) }),
        delsi:  f({ text: 'x'.repeat(80) }),
        dlouha: f({ text: 'x'.repeat(114) }),
        extrem: f({ text: 'x'.repeat(1000) }),
        prazdna: f({}),
        nic:    f(null),
      };
    });

    const P = `g${g}`;
    ok(r.zaklad === ZAKLAD[g], `${P}: základní limit ${ZAKLAD[g]} s`, 'je ' + r.zaklad);
    /* NIKDY MÉNĚ než dřív — to je celý smysl. */
    ok(r.kratka === r.zaklad, `${P}: krátká úloha má přesně tolik co dřív`, `${r.kratka} vs ${r.zaklad}`);
    ok(r.prah === r.zaklad, `${P}: 50 znaků je práh (beze změny)`, String(r.prah));
    ok(r.delsi > r.zaklad, `${P}: 80 znaků dostane víc času`, `${r.delsi}`);
    ok(r.dlouha > r.delsi, `${P}: delší zadání = víc času`, `${r.dlouha} vs ${r.delsi}`);
    ok(r.extrem <= r.zaklad + 25, `${P}: přídavek je zastropovaný na +25 s`, String(r.extrem));
    /* Chybějící text nesmí dát NaN — to by rozbilo časomíru. */
    ok(r.prazdna === r.zaklad && r.nic === r.zaklad, `${P}: úloha bez textu dá základní limit`, `${r.prazdna} / ${r.nic}`);

    /* A hlavně: boj musí skutečně běžet. V startTimer neexistuje `t`. */
    const boj = await pg.evaluate(() => {
      try {
        const a = AREAS[0], m = a.missions.find(x => !x.mc) || a.missions[0];
        launchBattle(a.id, m.id);
        /* Minihry si limit nastavují SAMY (`22 + n*8`, resp. `(18+n*8)*3`)
           a klidně pod TIME_PER_TASK — to je původní chování, ne tahle
           změna. Musí se odlišit, jinak test hlásí vadu na hře, která je
           v pořádku (nachytal jsem se: g3 vyšlo 54 = minihra „match"). */
        const jeMinihra = !!(BT.mini && BT.mini[BT.idx]);
        const limit = BT.curLimit, delka = String((BT.curTask && BT.curTask.text) || '').length;
        /* `startTimer` má vlastní větev `if(!BT.curLimit){…}`, kde
           proměnná `t` NEEXISTUJE. Po renderTask je ale curLimit vždycky
           nastavený, takže se ta větev normálně nespustí — a chyba v ní
           je latentní. Ověřeno: sabotáž `casNaUlohu(t)` prošla, dokud
           test tuhle větev nevynutil. Proto se curLimit schválně vynuluje. */
        BT.curLimit = 0;
        startTimer();
        return { ok: true, limit, delka, jeMinihra, poStartu: BT.curLimit, timeMax: BT.timeMax };
      } catch (e) { return { ok: false, err: String(e && e.message || e) }; }
    });
    ok(boj.ok, `${P}: boj se spustí a časomíra naskočí`, boj.err);
    if (boj.ok) {
      ok(Number.isFinite(boj.limit) && boj.limit > 0, `${P}: limit v boji je kladné číslo`, String(boj.limit));
      if (!boj.jeMinihra)
        ok(boj.limit >= ZAKLAD[g], `${P}: běžná úloha nemá MÍŇ času než dřív`, `${boj.limit} < ${ZAKLAD[g]}`);
      ok(Number.isFinite(boj.timeMax) && boj.timeMax > 0, `${P}: timeMax je číslo`, String(boj.timeMax));
      ok(Number.isFinite(boj.poStartu) && boj.poStartu > 0,
        `${P}: i záložní větev v startTimer spočítá limit`, String(boj.poStartu));
    }
    const skut = chyby.filter(e => !/ERR_|CERT_|net::/i.test(e));
    ok(skut.length === 0, `${P}: žádné JS chyby`, skut.slice(0, 1).join(''));
    await ctx.close();
  }

  console.log(`\n  Čas podle délky úlohy: ${pass} ✅ / ${fail} ❌\n`);
  await br.close(); srv.close();
  process.exit(fail ? 1 : 0);
})();
