/* ══════════════════════════════════════════════════════════════════════
   ÚTOK a DÁLE na jednom místě (Vojtův lístek 7. 10. 2026: „Na tabletu na útok
   nelze dát dále … Spojit tlačítko útok.“).

   Naměřeno sondou na tabletových rozměrech: po první správné odpovědi vyjel
   toast odznaku (.ach-toast, z-index 130, bez pointer-events:none) a 1–2,5 s
   ležel přes DÁLE v liště — ve všech 7 hrách. Ťuknutí dítěte trefilo toast.
   Hry teď po správné TEXTOVÉ odpovědi ukážou DÁLE tam, kde byl ÚTOK (`ukazDale`
   v rpg-shared.js), toast dotyk propouští a nová úloha vrátí ÚTOK (`daleZpet`).
   Test na skutečném ťuknutí (hasTouch) hlídá ve všech 7 hrách:
     1) DÁLE je na místě ÚTOKU a jde zasáhnout hned i během toastu,
     2) dvojité ťuknutí na ÚTOK nepřeskočí rovnou na další úlohu (pojistka 400 ms),
     3) další ťuknutí posune boj a nová úloha má zase ÚTOK (DÁLE skryté v liště),
     4) ANO/NE: DÁLE zůstává v liště a jde stisknout,
     5) toast odznaku má pointer-events:none a zásah jeho středem jde POD něj.
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
const ROZMERY = [['iPad na šířku s klávesnicí', 1024, 420], ['iPad na výšku', 768, 1024]];

/* Trénink a věž: odeslat → (odpověď) → DÁLE na místě odesílacího tlačítka → ťuknutí → nová úloha
   vrátí odesílací tlačítko a DÁLE schová zpátky na jeho místo. Funkce z `k` běží ve stránce. */
async function zkusDvojici(pg, k) {
  const f = x => x.toString();
  await pg.evaluate(`(${f(k.start)})()`);
  // najdi textovou úlohu (řádek se vstupem vidět, vstup povolený) — volby, ANO/NE a minihry přeskoč
  const nalez = await pg.evaluate(`(() => { for (let i = 0; i < 40; i++) {
      const r = document.getElementById('${k.radek}'), v = document.getElementById('${k.vstup}');
      if (r && getComputedStyle(r).display !== 'none' && v && !v.disabled) return true; (${f(k.dalsi)})(); } return false; })()`);
  if (!nalez) return { ok: false, proc: 'textová úloha se nenašla' };
  await pg.fill('#' + k.vstup, await pg.evaluate(`(${f(k.odpoved)})()`));
  const tl = await pg.evaluate(`(() => { const b = [...document.getElementById('${k.radek}').querySelectorAll('button')].find(b => b.id !== '${k.dale}');
      const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, text: b.textContent.trim() }; })()`);
  await pg.touchscreen.tap(tl.x, tl.y);
  await sleep(80);
  const po = await pg.evaluate(`(() => { const n = document.getElementById('${k.dale}'), q = n.getBoundingClientRect();
      const e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
      const b = [...document.getElementById('${k.radek}').querySelectorAll('button')].find(b => b.id !== '${k.dale}');
      return { vRadku: n.parentElement.id === '${k.radek}', odeslatSkryto: getComputedStyle(b).display === 'none',
        zasah: e === n || n.contains(e), stav: (${f(k.stav)})() }; })()`);
  await sleep(450);
  const n = await pg.evaluate(`(() => { const q = document.getElementById('${k.dale}').getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; })()`);
  await pg.touchscreen.tap(n.x, n.y);
  await sleep(250);
  const zpet = await pg.evaluate(`(() => { const n = document.getElementById('${k.dale}');
      const b = [...document.getElementById('${k.radek}').querySelectorAll('button')].find(b => b.id !== '${k.dale}');
      return { daleMimoRadek: n.parentElement.id !== '${k.radek}', daleSkryto: getComputedStyle(n).display === 'none',
        odeslatZpet: getComputedStyle(b).display !== 'none' }; })()`);
  return { ok: po.vRadku && po.odeslatSkryto && po.zasah && zpet.daleMimoRadek && zpet.daleSkryto && zpet.odeslatZpet, tlacitko: tl.text, po, zpet };
}

(async () => {
  console.log('\n── ÚTOK a DÁLE na jednom místě (tablet, dotyk) ──\n');
  const srv = http.createServer((q, r) => {
    const f = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0])));
    if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  });
  await new Promise(r => srv.listen(0, r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ executablePath: EXEC });
  const errs = [];
  try {
    for (const g of [3, 4, 5, 6, 7, 8, 9]) for (const [jm, w, h] of ROZMERY) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      await ctx.addInitScript(() => { window.__TW_TESTNOW = '2026-05-15T10:00:00'; });   // věž je v létě zavřená — test nesmí záviset na dni
      const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push('g' + g + ': ' + e.message));
      const kde = `g${g} ${jm}`;
      await pg.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'load' });
      await pg.fill('#ni', 'TESTER'); await pg.evaluate(() => { startGame(); S.tutorialDone = true; });
      // čisté textové kolo v první textové misi (bez minihry a ANO/NE)
      await pg.evaluate(() => {
        for (const ar of AREAS) for (const m of ar.missions) if (!m.mc) {
          launchBattle(ar.id, m.id);
          const i = BT.tasks.findIndex(t => !isYN(t) && t.text); if (i < 0) continue;
          if (BT.mini) BT.mini[i] = null; BT.idx = i; renderTask(); return;
        }
      });
      await pg.waitForFunction(() => !document.getElementById('bt-ans').disabled && !document.getElementById('attack-btn').disabled, null, { timeout: 5000 });
      await pg.fill('#bt-ans', await pg.evaluate(() => String(BT.curTask.ans)));
      const utok = await pg.evaluate(() => { const r = document.getElementById('attack-btn').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, idx: BT.idx }; });
      await pg.touchscreen.tap(utok.x, utok.y);
      await pg.touchscreen.tap(utok.x, utok.y);                       // dítě ťukne dvakrát
      await sleep(80);
      const hned = await pg.evaluate(i => {
        const n = document.getElementById('next-btn'), a = document.getElementById('attack-btn');
        const r = n.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { idx: BT.idx === i, vRadku: n.parentElement && n.parentElement.id === 'bt-input-row', utokSkryt: getComputedStyle(a).display === 'none',
          videt: getComputedStyle(n).display !== 'none' && r.bottom <= innerHeight && r.top >= 0, zasah: e === n || n.contains(e), toast: !!document.querySelector('.ach-toast.show') };
      }, utok.idx);
      ok(`${kde}: DÁLE na místě ÚTOKU, vidět a jde zasáhnout hned` + (hned.toast ? ' (i během toastu odznaku)' : ''),
        hned.vRadku && hned.utokSkryt && hned.videt && hned.zasah, JSON.stringify(hned));
      ok(`${kde}: dvojité ťuknutí na ÚTOK nepřeskočilo úlohu`, hned.idx);
      await sleep(450);
      const n = await pg.evaluate(() => { const r = document.getElementById('next-btn').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await pg.touchscreen.tap(n.x, n.y);
      await pg.waitForFunction(i => BT.idx !== i || !document.querySelector('#s-battle.active'), utok.idx, { timeout: 3000 }).catch(() => {});
      const dal = await pg.evaluate(i => {
        const n = document.getElementById('next-btn'), a = document.getElementById('attack-btn');
        return { posun: BT.idx !== i || !document.querySelector('#s-battle.active'), vListe: !!n.closest('.bt-akce'),
          daleSkryt: getComputedStyle(n).display === 'none', utok: getComputedStyle(a).display !== 'none' };
      }, utok.idx);
      ok(`${kde}: ťuknutí na DÁLE posune boj, nová úloha má zase ÚTOK`, dal.posun && dal.vListe && dal.daleSkryt && dal.utok, JSON.stringify(dal));

      if (h === 1024) {
        // ANO/NE: řádek se vstupem je skrytý → DÁLE zůstane v liště
        const yn = await pg.evaluate(() => {
          const i = BT.tasks.findIndex((t, k) => k > BT.idx && isYN(t));
          if (i < 0) { BT.tasks.splice(BT.idx + 1, 0, { text: 'Je 7 > 5?', ans: 'ANO', hints: ['', ''] }); BT.idx++; }
          else BT.idx = i;
          if (BT.mini) BT.mini[BT.idx] = null; renderTask(); return BT.curTask.ans;
        });
        await pg.waitForFunction(() => [...document.querySelectorAll('#yn-row button')].some(b => !b.disabled), null, { timeout: 5000 });
        await pg.evaluate(a => answerYN(a), yn);
        await sleep(80);
        const r = await pg.evaluate(() => { const n = document.getElementById('next-btn'), q = n.getBoundingClientRect(); const e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
          return { vListe: !!n.closest('.bt-akce'), videt: getComputedStyle(n).display !== 'none', zasah: e === n || n.contains(e) }; });
        ok(`g${g}: ANO/NE — DÁLE zůstává v liště a jde zasáhnout`, r.vListe && r.videt && r.zasah, JSON.stringify(r));
      }

      if (h === 1024) {
        // ── trénink: OVĚŘIT → DALŠÍ ÚKOL na stejném místě, nová úloha vrátí OVĚŘIT ──
        const tr = await zkusDvojici(pg, {
          start: () => { try { exitBattle(); } catch (e) {} go('train');
            const m = AREAS.flatMap(a => a.missions).find(m => !m.mc); startTrain(m.id); },
          dalsi: () => trNext(), radek: 'tr-input-row', vstup: 'tr-ans', dale: 'tr-next-btn', odpoved: () => String(TR.task.ans),
          stav: () => TR.total });
        ok(`g${g}: trénink — DALŠÍ ÚKOL na místě OVĚŘIT, ťuknutí posune, nová úloha vrátí OVĚŘIT`, tr.ok, JSON.stringify(tr));
        if (g >= 6) {
          // ── věž: po CHYBĚ DÁLE na místě VÝŠ (po správné jde věž výš sama) ──
          const tw = await zkusDvojici(pg, {
            start: () => { go('map'); go('tower'); twStart(); TW.floor = 2; twDrawTask(); },
            dalsi: () => twDrawTask(), radek: 'tw-input-row', vstup: 'tw-ans', dale: 'tw-next-btn', odpoved: () => '987654321',
            stav: () => TW.lives });
          ok(`g${g}: věž — po chybě DÁLE na místě VÝŠ, ťuknutí posune, nové patro vrátí VÝŠ`, tw.ok, JSON.stringify(tw));
        }
      }

      // toast odznaku: propouští dotyk
      const t = await pg.evaluate(async () => {
        achToast({ id: 'test', ic: 'star', nm: 'Zkouška' });
        // toasty se řadí do fronty a vyjíždějí zpoza okraje — měřit až ten, který je celý v okně
        for (let i = 0; i < 80; i++) {
          const el = [...document.querySelectorAll('.ach-toast.show')].find(x => { const q = x.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight; });
          if (el) {
            const q = el.getBoundingClientRect(), e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
            return { pe: getComputedStyle(el).pointerEvents, pod: !!e && !el.contains(e) };
          }
          await new Promise(r => setTimeout(r, 100));
        }
        return { chybi: 'žádný toast celý v okně do 8 s' };
      });
      ok(`${kde}: toast odznaku propouští dotyk`, t.pe === 'none' && t.pod, JSON.stringify(t));
      await ctx.close();
    }
  } finally { await b.close(); srv.close(); }
  ok('žádné JS chyby', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
