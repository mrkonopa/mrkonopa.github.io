/* ══════════════════════════════════════════════════════════════════════
   ÚTOK musí jít stisknout v KAŽDÉ úloze, ne jen v první (Vojtův lístek 8. 10. 2026:
   „při hodině s dětmi občas mizelo tlačítko útok/další“).

   Příčina: po správné odpovědi `submitAnswer` ÚTOK vypne (ochrana proti dvojímu odeslání)
   a nová úloha ho ve 3.–8. ročníku nikdy nezapnula — odemykání měl jen 9. ročník. Ťuknutí
   na šedé tlačítko nic neudělalo, šel jen Enter. Žádný test si toho nevšiml, protože všechny
   odpovídaly voláním `submitAnswer()` nebo Enterem, nikdy tlačítkem, na které dítě ťuká.

   Test odpovídá SKUTEČNÝM ťuknutím (hasTouch) a hlídá ve všech 7 hrách:
     1) tři textové úlohy po sobě: ÚTOK je před každým ťuknutím povolený, odpověď se přijme,
        DÁLE je hned na místě ÚTOKU a jde zasáhnout,
     2) text → ANO/NE → text → text: ÚTOK se zapne i po ANO/NE (tam se vypíná taky, přes `answerYN`),
     3) čas vyprší a dítě během 1,3 s odpoví správně: zpožděná obsluha nesmí znovu rozjet časomíru
        ani zapnout pole u hotové úlohy (srdíčka by ubývala u DÁLE),
     4) čas vyprší a dítě odejde z boje: na mapě nesmí běžet časomíra,
     5) minihra se rozjede a dítě odejde: zpožděný start časomíry nesmí zasáhnout mapu.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const HRY = [3, 4, 5, 6, 7, 8, 9];
const ROZMERY = [['iPad na šířku', 1024, 768], ['telefon', 360, 740]];

async function novaStranka(b, base, g, w, h, errs) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await ctx.route('**/*', r => { const u = r.request().url(); return u.startsWith(base) && !/rpg-sprite/.test(u) ? r.continue() : r.abort(); });
  await ctx.addInitScript(() => { window.__TW_TESTNOW = '2026-05-15T10:00:00'; });
  const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push('g' + g + ': ' + e.message.split('\n')[0]));
  await pg.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'load' });
  await pg.fill('#ni', 'TESTER'); await pg.evaluate(() => { startGame(); S.tutorialDone = true; });
  return { ctx, pg };
}
/* Boj se čtyřmi připravenými úlohami: [text, ANO/NE, text, text] (bez minihry a obrázků). */
const pripravBoj = (pg, sada) => pg.evaluate(sada => {
  for (const ar of AREAS) for (const m of ar.missions) {
    if (m.mc) continue;
    launchBattle(ar.id, m.id);
    const t = BT.tasks.filter(x => !isYN(x) && x.text && !x.svg);
    if (t.length < 3) continue;
    BT.tasks = sada === 'text-yn' ? [t[0], { text: 'Je 7 > 5?', ans: 'ANO', hints: ['', ''] }, t[1], t[2]] : [t[0], t[1], t[2]];
    BT.mini = {}; for (let i = 0; i < BT.tasks.length; i++) BT.mini[i] = null;
    for (let i = 0; i < 6; i++) delete S.done[m.id + '-' + i];
    window.adaptMaybeSwap = function () {};           // tichá adaptivita by uprostřed zkoušky vyměnila úlohu (třeba za ANO/NE)
    BT.idx = 0; renderTask(); return true;
  } return false;
}, sada);
const stav = pg => pg.evaluate(() => {
  const $ = id => document.getElementById(id), n = $('next-btn'), a = $('attack-btn'), q = n.getBoundingClientRect();
  const e = q.width ? document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2) : null;
  return { idx: BT.idx, hp: BT.hp, timer: !!BT.timer, hotovo: Object.keys(S.done).length, utokDis: a.disabled, utokVid: getComputedStyle(a).display !== 'none',
    daleVid: getComputedStyle(n).display !== 'none', daleVRadku: !!n.parentElement && n.parentElement.id === 'bt-input-row', daleZasah: !!e && (e === n || n.contains(e)),
    vstupDis: $('bt-ans').disabled, boj: !!document.querySelector('#s-battle.active'), yn: getComputedStyle($('yn-row')).display !== 'none' };
});
const tapId = async (pg, sel) => { const c = await pg.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); await pg.touchscreen.tap(c.x, c.y); };
const cekejNa = async (pg, fn, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await pg.evaluate(fn)) return true; await sleep(40); } return false; };
// po SPUŠTĚNÍ boje je pole 700 ms zamčené (animace vstupu bosse) a zámek se na konci odemkne SÁM — odpovídat dřív dítě nemůže
const vstupPripraven = pg => cekejNa(pg, () => { const i = document.getElementById('bt-ans'), a = document.getElementById('attack-btn'); return !i.disabled && !a.disabled && getComputedStyle(document.getElementById('bt-input-row')).display !== 'none'; });
const odemkniVstup = async pg => { await sleep(800); return vstupPripraven(pg); };

(async () => {
  console.log('\n── ÚTOK jde stisknout v každé úloze (skutečné ťuknutí, 7 her) ──\n');
  const srv = http.createServer((q, r) => {
    const f = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0])));
    if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  });
  await new Promise(r => srv.listen(0, r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ executablePath: EXEC });
  const errs = [];
  try {
    for (const g of HRY) {
      // ── 1) + 2) text → ANO/NE → text → text, vše ťuknutím ──
      for (const [jm, w, h] of ROZMERY) {
        const { ctx, pg } = await novaStranka(b, base, g, w, h, errs);
        const kde = `g${g} ${jm}`;
        if (!await pripravBoj(pg, 'text-yn')) { ok(`${kde}: boj se čtyřmi úlohami se nepodařilo připravit`, false); await ctx.close(); continue; }
        await sleep(800);
        const kroky = ['text', 'ANO/NE', 'text', 'text'];
        for (let k = 0; k < kroky.length; k++) {
          const druh = kroky[k];
          if (druh === 'text') {
            const pripraven = await vstupPripraven(pg);
            ok(`${kde}: úloha ${k + 1} (text) — pole i ÚTOK jsou povolené`, pripraven, JSON.stringify(await stav(pg)));
            if (!pripraven) break;
            await pg.fill('#bt-ans', await pg.evaluate(() => String(BT.curTask.ans)));
            const pred = await stav(pg);
            await tapId(pg, '#attack-btn'); await sleep(120);
            const po = await stav(pg);
            ok(`${kde}: úloha ${k + 1} (text) — ťuknutí na ÚTOK odpověď přijme, DÁLE je na místě ÚTOKU a jde zasáhnout`,
              po.hotovo > pred.hotovo && po.daleVid && po.daleVRadku && po.daleZasah && !po.utokVid, JSON.stringify(po));
            if (k === 0) {
              // toast odznaku a nabídka věže (po splnění mise, 6,5 s s tlačítkem) jezdí shora — dole přistávaly přesně na DÁLE
              await pg.evaluate(() => { achToast({ id: 'zk', ic: 'star', nm: 'Zkouška' }); if (typeof suggestTower === 'function') suggestTower(); });
              await sleep(700);
              const t = await pg.evaluate(() => {
                const n = document.getElementById('next-btn'), q = n.getBoundingClientRect(), e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
                const toasty = [...document.querySelectorAll('.ach-toast')].map(x => x.getBoundingClientRect()).filter(r => r.width > 0 && r.bottom > 0 && r.top < innerHeight);
                const kryje = toasty.filter(r => Math.min(r.right, q.right) - Math.max(r.left, q.left) > 2 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 2).length;
                return { zasah: !!e && (e === n || n.contains(e)), toastu: toasty.length, kryje, toastDole: toasty.some(r => r.top > innerHeight / 2) };
              });
              ok(`${kde}: toast odznaku a nabídka věže nezakrývají DÁLE (jedou shora)`, t.toastu >= 1 && t.kryje === 0 && t.zasah && !t.toastDole, JSON.stringify(t));
            }
          } else {
            await cekejNa(pg, () => [...document.querySelectorAll('#yn-row button')].some(x => !x.disabled) && getComputedStyle(document.getElementById('yn-row')).display !== 'none');
            const pred = await stav(pg);
            await tapId(pg, '#yn-row button'); await sleep(120);                // první tlačítko = ANO
            const po = await stav(pg);
            ok(`${kde}: úloha ${k + 1} (ANO/NE) — odpověď se přijme a DÁLE jde zasáhnout`, po.hotovo > pred.hotovo && po.daleVid && po.daleZasah, JSON.stringify(po));
          }
          await sleep(430);                                                      // pojistka 400 ms proti dvojitému ťuknutí
          if (k < kroky.length - 1) { await tapId(pg, '#next-btn'); await sleep(150); }
        }
        await ctx.close();
      }
      // ── 3) až 5): časovač a zpožděné obsluhy (jen na tabletu na šířku) ──
      {
        const { ctx, pg } = await novaStranka(b, base, g, 1024, 768, errs);
        const kde = `g${g} iPad na šířku`;
        // 3) čas vyprší, dítě během 1,3 s správně odpoví
        await pripravBoj(pg, 'text'); await odemkniVstup(pg);
        await pg.evaluate(() => { stopTimer(); onTimeOut(); });
        await sleep(250);
        await pg.fill('#bt-ans', await pg.evaluate(() => String(BT.curTask.ans)));
        await tapId(pg, '#attack-btn'); await sleep(1700);                      // přes zpožděný blok po vypršení času
        const s3 = await stav(pg);
        ok(`${kde}: čas vypršel, dítě správně odpovědělo — časomíra se po 1,3 s nerozjela a pole zůstalo vypnuté`,
          !s3.timer && s3.daleVid && s3.vstupDis, JSON.stringify(s3));
        // 4) čas vyprší, dítě odejde z boje
        await pripravBoj(pg, 'text'); await odemkniVstup(pg);
        await pg.evaluate(() => { stopTimer(); onTimeOut(); exitBattle(); });
        await sleep(1700);
        const s4 = await stav(pg);
        ok(`${kde}: čas vypršel a dítě odešlo — na mapě neběží časomíra`, !s4.boj && !s4.timer, JSON.stringify(s4));
        // 5) minihra se rozjede a dítě odejde dřív než za 1,5 s
        const mini = await pg.evaluate(() => {
          for (const ar of AREAS) for (const m of ar.missions) {
            if (m.mc) continue;
            launchBattle(ar.id, m.id);
            const pairs = RPGTaskTypes.pickPairs(battlePool(), 4); if (!pairs) continue;
            stopTimer();                                       // úloha před minihrou je vyřešená, takže časomíra neběží
            BT.mini[BT.idx] = { type: 'match', data: pairs }; renderTask(); return BT.miniStarting === true;
          } return false;
        });
        if (mini) { await sleep(300); await pg.evaluate(() => openArea(BT.aid)); await sleep(1900); }   // jako DÁLE po poslední úloze nebo přeskočení předmětem
        const s5 = await stav(pg);
        ok(`${kde}: minihra se rozjela a dítě odešlo — zpožděný start časomíry nezasáhl mapu`, mini && !s5.boj && !s5.timer, mini ? JSON.stringify(s5) : 'minihru se nepodařilo spustit');
        await ctx.close();
      }
    }
  } finally { await b.close(); srv.close(); }
  ok('žádné JS chyby', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
