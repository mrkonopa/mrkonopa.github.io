// „Neprůstřelný" nepřátelský test sponky — snaží se ji rozbít a odhalit „kraviny".
// Pokrývá: gating vlastnictvím, cooldown proti spamu, umlčení po 3 zavřeních,
// auto-nápověda BEZ vedlejších efektů na herní stav, hint jen 1× na úkol,
// schování na časovaných obrazovkách (CERMAT/Věž), reduced-motion, XSS v bublině,
// žádné překrytí herních tlačítek na mobilu, žádné memory-leaky při toggle, 0 JS chyb.
// Parametrizováno ročníkem: `node ... [3-9]` (default 9).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '9';
const PORT = 18900 + Number(GRADE);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m); } };

function overlap(a, b) { return a && b && a.width > 0 && b.width > 0 && !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y); }

(async () => {
  const srv = http.createServer((req, res) => {
    const p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
    if (!p.startsWith(ROOT + path.sep)) { res.statusCode = 403; res.end(); return; }
    try { res.end(fs.readFileSync(p)); } catch { res.statusCode = 404; res.end(); }
  }).listen(PORT);
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const br = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined });
  const errs = [];
  const URL = `http://127.0.0.1:${PORT}/projects/rpg-mat-${GRADE}.html`;

  async function newPage(viewport) {
    const ctx = await br.newContext(viewport ? { viewport } : {});
    await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1:' + PORT) ? r.continue() : r.abort());
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    return { ctx, page };
  }
  async function bootWithPet(page) {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof RPGWallet !== 'undefined' && typeof startGame === 'function', { timeout: 8000 });
    await page.evaluate(() => { window.__SPONKA_COOLDOWN_MS = 0; localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); });
    await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });
    await page.evaluate(() => { RPGWallet.earn(30000); RPGWallet.buy('pet-sova'); });
    await page.waitForTimeout(150);
  }
  async function enterBattle(page) {
    await page.evaluate(() => { const ar = AREAS[0], m = ar.missions[0]; launchBattle(ar.id, m.id); });
    await page.waitForFunction(() => typeof BT !== 'undefined' && BT.curTask, { timeout: 5000 });
    await page.waitForTimeout(800); // ať se scéna a tlačítka ustálí
  }

  // ═══ A) auto-nápověda BEZ vedlejších efektů + jen 1× na úkol ═══
  {
    const { ctx, page } = await newPage();
    await bootWithPet(page);
    await enterBattle(page);
    await page.evaluate(() => { BT.hp = 1; BT.hl = 0; BT.missionHinted = false; });
    await page.waitForTimeout(4300);
    const st = await page.evaluate(() => ({ disp: document.getElementById('rw-sponka-bubble').style.display, txt: document.getElementById('rw-sponka-bubble').textContent, hl: BT.hl, hinted: !!BT.missionHinted, hintBoxShown: document.getElementById('hint-box') ? document.getElementById('hint-box').classList.contains('show') : false }));
    ok(st.disp === 'block' && st.txt.includes('💡'), 'A1 auto-nápověda v bublině (💡)');
    ok(st.hl === 0 && st.hinted === false, 'A2 auto-nápověda NEsahá na BT.hl ani missionHinted (odznak zachován)');
    ok(st.hintBoxShown === false, 'A3 herní nápovědový box se NEotevře (sponka nekradne showHint)');
    // stejný úkol → hint se NEopakuje (skryj bublinu, zopakuj poll)
    await page.evaluate(() => { const b = document.getElementById('rw-sponka-bubble'); b.style.display = 'none'; });
    await page.waitForTimeout(4300);
    const again = await page.evaluate(() => { const b = document.getElementById('rw-sponka-bubble'); return b.style.display === 'block' && b.textContent.includes('💡'); });
    ok(!again, 'A4 stejný úkol při HP=1 se nehintuje podruhé (žádné otravování)');
    // nový úkol → hint zase jednou
    await page.evaluate(() => { BT.curTask = { text: 'x', ans: '1', hints: ['Zkus rozklad.'], skill: 'calc' }; BT.hp = 1; BT.hl = 0; });
    await page.waitForTimeout(4300);
    const fresh = await page.evaluate(() => { const b = document.getElementById('rw-sponka-bubble'); return b.style.display === 'block' && b.textContent.includes('Zkus rozklad'); });
    ok(fresh, 'A5 nový úkol → nápověda se zase ukáže (1× na úkol)');
    await ctx.close();
  }

  // ═══ B) umlčení po 3 zavřeních + cooldown proti spamu ═══
  {
    const { ctx, page } = await newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof RPGWallet !== 'undefined' && typeof startGame === 'function', { timeout: 8000 });
    // NEnastavuj cooldown=0 → ověř skutečný cooldown
    await page.evaluate(() => { localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); });
    await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });
    await page.evaluate(() => { RPGWallet.earn(30000); RPGWallet.buy('pet-sova'); });
    await page.waitForTimeout(150);
    await page.evaluate(() => { go('train'); startTrain('1-1'); });
    await page.waitForFunction(() => document.querySelector('#s-train')?.classList.contains('active') && TR.task != null, { timeout: 5000 });
    // vyvolej dobrou náladu, ale s reálným cooldownem 100 s
    await page.evaluate(() => { TR.streak = 5; TR.total = 5; TR.correct = 5; });
    await page.waitForTimeout(4300);
    const firstShown = await page.evaluate(() => document.getElementById('rw-sponka-bubble').style.display === 'block');
    ok(firstShown, 'B1 první trigger ukáže bublinu');
    // zavři a hned zkus znovu — cooldown 100 s to nesmí pustit
    await page.evaluate(() => document.getElementById('rw-sponka-bubble').click());
    await page.waitForTimeout(4300);
    ok(await page.evaluate(() => document.getElementById('rw-sponka-bubble').style.display === 'none'), 'B2 cooldown 100 s blokuje okamžitý další trigger (žádný spam)');
    // teď cooldown 0 + 3× zavření → umlčení
    await page.evaluate(() => { window.__SPONKA_COOLDOWN_MS = 0; });
    let dismissed = 0;
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(4300);
      const vis = await page.evaluate(() => document.getElementById('rw-sponka-bubble').style.display === 'block');
      if (vis) { await page.evaluate(() => document.getElementById('rw-sponka-bubble').click()); dismissed++; }
    }
    ok(dismissed >= 2, `B3 opakované triggery po cooldownu (zavřeno ${dismissed}×)`);
    await page.waitForTimeout(4300);
    ok(await page.evaluate(() => document.getElementById('rw-sponka-bubble').style.display === 'none'), 'B4 po 3 zavřeních je sponka umlčená (nespamuje)');
    await ctx.close();
  }

  // ═══ C) schování na časovaných obrazovkách (CERMAT test, Věž) ═══
  {
    const { ctx, page } = await newPage();
    await bootWithPet(page);
    ok(await page.evaluate(() => getComputedStyle(document.getElementById('rw-sponka')).visibility !== 'hidden'), 'C1 na mapě je sponka viditelná');
    for (const scr of ['cermat', 'tower']) {
      const has = await page.evaluate((s) => typeof go === 'function' && !!document.getElementById('s-' + s), scr);
      if (!has) continue;
      await page.evaluate((s) => go(s), scr);
      await page.waitForTimeout(600);
      ok(await page.evaluate(() => getComputedStyle(document.getElementById('rw-sponka')).visibility === 'hidden'), `C2 na s-${scr} (časovaný režim) je sponka schovaná`);
      await page.evaluate(() => go('map'));
      await page.waitForTimeout(500);
      ok(await page.evaluate(() => getComputedStyle(document.getElementById('rw-sponka')).visibility !== 'hidden'), `C3 zpět na mapě je sponka zase viditelná (po s-${scr})`);
    }
    await ctx.close();
  }

  // ═══ D) XSS: škodlivý hint se nespustí a je escapovaný ═══
  {
    const { ctx, page } = await newPage();
    await bootWithPet(page);
    await enterBattle(page);
    await page.evaluate(() => { BT.curTask = { text: 'x', ans: '1', hints: ['<img src=x onerror="window.__xss=1">'], skill: 'calc' }; BT.hp = 1; BT.hl = 0; });
    await page.waitForTimeout(4300);
    ok(await page.evaluate(() => window.__xss !== 1), 'D1 škodlivý hint se NEspustí');
    ok(await page.evaluate(() => { const h = document.getElementById('rw-sponka-bubble').innerHTML; return h.includes('&lt;img'); }), 'D2 hint je v bublině escapovaný (textContent)');
    await ctx.close();
  }

  // ═══ E) toggle spam → žádné duplicitní elementy ani leaky ═══
  {
    const { ctx, page } = await newPage();
    await bootWithPet(page);
    for (let i = 0; i < 6; i++) { await page.evaluate((on) => RPGWallet.setSponkaEnabled(on), i % 2 === 0); await page.waitForTimeout(60); }
    await page.evaluate(() => RPGWallet.setSponkaEnabled(true));
    await page.waitForTimeout(150);
    ok(await page.evaluate(() => document.querySelectorAll('#rw-sponka').length === 1), 'E1 po toggle-spamu existuje právě 1 sponka (žádné duplikáty)');
    ok(await page.evaluate(() => document.querySelectorAll('#rw-sponka-canvas').length === 1), 'E2 právě 1 canvas');
    await ctx.close();
  }

  // ═══ F) reduced-motion: sponka se stále vykreslí, jen bez animace ═══
  {
    const { ctx, page } = await newPage();
    await bootWithPet(page);
    await page.evaluate(() => { document.documentElement.classList.add('reduced-motion'); });
    await page.waitForTimeout(300);
    const painted = await page.evaluate(() => { const c = document.getElementById('rw-sponka-canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return true; return false; });
    ok(painted, 'F1 při reduced-motion je sponka stále vykreslená (statická)');
    await ctx.close();
  }

  // ═══ G) MOBIL: sponka nepřekrývá herní tlačítka v boji ═══
  {
    const { ctx, page } = await newPage({ width: 390, height: 780 });
    await bootWithPet(page);
    await enterBattle(page);
    const res = await page.evaluate(() => {
      const rect = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
      return { canvas: rect(document.getElementById('rw-sponka-canvas')), hint: rect(document.getElementById('hint-btn')), atk: rect(document.getElementById('attack-btn')), ans: rect(document.getElementById('bt-ans')) };
    });
    ok(!overlap(res.canvas, res.hint), `G1 sponka nepřekrývá tlačítko NÁPOVĚDA (canvas ${JSON.stringify(res.canvas)} vs hint ${JSON.stringify(res.hint)})`);
    ok(!overlap(res.canvas, res.atk), 'G2 sponka nepřekrývá tlačítko ÚTOK');
    ok(!overlap(res.canvas, res.ans), 'G3 sponka nepřekrývá pole odpovědi');
    await ctx.close();
  }

  const real = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(real.length === 0, 'H žádné JS chyby: ' + real.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Sponka HOSTILE (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
