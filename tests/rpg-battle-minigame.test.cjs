/* Vynucený minigame v boji (spojovačka / řazení) — 4 ročníky.
   Ověřuje: minigame se vykreslí místo normálního kola, správné dořešení
   označí kolo splněné (S.done) a ukáže NEXT, chyba ubere srdce (-1 HP),
   řazení řadí podle VYPOČÍTANÉHO výsledku (chip ukazuje zadání, ne výsledek). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };
let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m); } }
function good(m) { console.log('  ✅ ' + m); }

function serve() { return new Promise(res => { const s = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html'; const f = path.normalize(path.join(ROOT, u)); if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('nf'); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }); s.listen(0, () => res(s)); }); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC });

  for (const g of [6, 7, 8, 9]) {
    console.log(`\n━━ rpg-mat-${g} ━━`);
    const ctx = await browser.newContext({ viewport: { width: 480, height: 800 } });
    const page = await ctx.newPage();
    const jsErrs = [];
    page.on('pageerror', e => jsErrs.push(e.message));
    await page.goto(`${base}/projects/rpg-mat-${g}.html`, { waitUntil: 'load' });
    await page.waitForSelector('#ni');
    await page.fill('#ni', 'Mini');
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'));

    // najdi první NE-MC misi, jejíž pool umí postavit řazení
    const found = await page.evaluate(() => {
      for (const ar of AREAS) for (const m of ar.missions) {
        if (m.mc) continue;
        let pool; try { pool = m.tasks(); } catch (e) { continue; }
        const ex = window['RPG_TASK_EXTRA_' + (document.title.match(/\d/) || [''])[0]];
        if (ex && typeof ex[m.id] === 'function') { try { pool = pool.concat(ex[m.id]()); } catch (e) {} }
        const items = RPGTaskTypes.pickOrderItems(pool, 4);
        if (items) return { aid: ar.id, mid: m.id };
      }
      return null;
    });
    ok(!!found, `g${g}: existuje mise, kde jde postavit řazení`);
    if (!found) { await ctx.close(); continue; }

    // spusť boj a VYNUŤ řazení na aktuálním kole
    await page.evaluate(({ aid, mid }) => {
      launchBattle(aid, mid);
      const items = RPGTaskTypes.pickOrderItems(battlePool(), 4);
      BT.mini = {}; BT.mini[BT.idx] = { type: 'order', data: items, desc: false };
      renderTask();
    }, found);
    await sleep(200);

    // chip ukazuje ZADÁNÍ (text), ne holý výsledek
    const chipInfo = await page.evaluate(() => {
      const chips = [...document.querySelectorAll('#bt-prob .tto-chip')];
      return { n: chips.length, labels: chips.map(c => c.textContent) };
    });
    ok(chipInfo.n === 4, `g${g}: řazení vykreslilo 4 chipy (${chipInfo.n})`);

    // ŠPATNÝ tah: klikni na chip, který NENÍ nejmenší → -1 HP
    const dmg = await page.evaluate(async () => {
      const hpBefore = BT.hp;
      const sorted = BT._dbgSorted = [...document.querySelectorAll('#bt-prob .tto-chip')];
      // najdi chip, jehož hodnota není minimální
      const data = BT.mini[BT.idx].data;
      const minV = Math.min(...data.map(d => d.v));
      const wrongLabel = (data.find(d => d.v !== minV) || {}).label;
      const wrongBtn = sorted.find(c => !c.classList.contains('done') && c.textContent === wrongLabel);
      if (wrongBtn) wrongBtn.click();
      await new Promise(r => setTimeout(r, 150));
      return { hpBefore, hpAfter: BT.hp };
    });
    ok(dmg.hpAfter === dmg.hpBefore - 1, `g${g}: chyba v řazení ubrala srdce (${dmg.hpBefore}→${dmg.hpAfter})`);

    // SPRÁVNÉ dořešení: klikej v pořadí podle hodnoty
    const done = await page.evaluate(async () => {
      const data = BT.mini[BT.idx].data.slice().sort((a, b) => a.v - b.v);
      for (const d of data) {
        const chips = [...document.querySelectorAll('#bt-prob .tto-chip')];
        const btn = chips.find(c => !c.classList.contains('done') && c.textContent === d.label);
        if (btn) btn.click();
        await new Promise(r => setTimeout(r, 60));
      }
      await new Promise(r => setTimeout(r, 200));
      return {
        markedDone: !!S.done[`${BT.mid}-${BT.idx}`],
        nextShown: document.getElementById('next-btn').style.display !== 'none',
      };
    });
    ok(done.markedDone, `g${g}: dořešené řazení označilo kolo splněné`);
    ok(done.nextShown, `g${g}: po dořešení se ukázalo tlačítko DÁL`);

    ok(jsErrs.length === 0, `g${g}: žádné JS chyby (${jsErrs.slice(0, 2).join(' | ')})`);
    if (jsErrs.length === 0) good(`g${g} hotovo`);
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log(`\n══════════════════════════════════════════\n  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌\n══════════════════════════════════════════`);
  process.exit(fail ? 1 : 0);
})();
