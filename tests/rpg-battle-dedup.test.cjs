/* rpg-battle-dedup.test.cjs — boj nesmí opakovat „stejná čísla".
   Pro KAŽDOU misi spustí launchBattle mnohokrát a v reálném enginu ověří, že
   vybraných tc úloh má vždy RŮZNÝ text (žádné dvě úlohy se stejným zněním/čísly).
   Zároveň hlídá plný počet úloh (tc) a měří míru shodných odpovědí (jen log).
   `node tests/rpg-battle-dedup.test.cjs [ročník]` (default 4). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '4';
const PORT = 18700 + Number(GRADE);
const ITERS = 20;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

(async () => {
  const srv = http.createServer((req, res) => {
    const p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
    if (!p.startsWith(ROOT + path.sep)) { res.statusCode = 403; res.end(); return; }
    try { res.end(fs.readFileSync(p)); } catch { res.statusCode = 404; res.end(); }
  }).listen(PORT);
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const br = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined });
  const ctx = await br.newContext();
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1:' + PORT) ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/projects/rpg-mat-${GRADE}.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function' && typeof launchBattle === 'function' && typeof AREAS !== 'undefined', { timeout: 8000 });
  await page.evaluate(() => { localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); if (typeof S !== 'undefined') S.tutorialDone = true; });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  console.log(`\n── Boj: neopakování „stejných čísel" — ${GRADE}. ročník (${ITERS}×/misi) ──`);
  const missions = await page.evaluate(() => AREAS.flatMap(a => a.missions.map(m => ({ aid: a.id, mid: m.id, nm: m.name || m.id }))));

  let totalDupText = 0, worstAns = { pct: 0, mid: '' };
  for (const { aid, mid, nm } of missions) {
    const r = await page.evaluate(({ aid, mid, iters }) => {
      const out = [];
      for (let k = 0; k < iters; k++) {
        try { launchBattle(aid, mid); } catch (e) { return { err: String(e && e.message || e) }; }
        if (typeof BT === 'undefined' || !Array.isArray(BT.tasks)) return { err: 'BT.tasks chybí' };
        out.push({ t: BT.tasks.map(x => String(x && x.text)), a: BT.tasks.map(x => String(x && x.ans)), n: BT.tasks.length, tc: BT.tasks.length });
      }
      return { out };
    }, { aid, mid, iters: ITERS });

    if (r.err) { ok(false, `${nm}: chyba enginu — ${r.err}`); continue; }
    let dupText = 0, dupAns = 0, shortfall = 0;
    for (const b of r.out) {
      if (new Set(b.t).size < b.t.length) dupText++;
      if (new Set(b.a).size < b.a.length) dupAns++;
      if (b.n < 6) shortfall++;
    }
    totalDupText += dupText;
    const ansPct = dupAns / ITERS * 100;
    if (ansPct > worstAns.pct) worstAns = { pct: ansPct, mid: `${GRADE}/${mid}` };
    ok(dupText === 0 && shortfall === 0, `${mid} ${nm}: 0 duplicit textu, plných 6 úloh` +
      (dupText ? ` — ${dupText}/${ITERS} boj(ů) mělo duplicitu!` : '') +
      (shortfall ? ` — ${shortfall}× méně než 6 úloh!` : ''));
  }

  ok(errs.length === 0, 'žádné JS chyby' + (errs.length ? ` [${errs[0]}]` : ''));
  console.log(`  (nejvyšší míra shodné ODPOVĚDI: ${worstAns.pct.toFixed(0)} % u ${worstAns.mid} — jiné číslo/text, jen stejný výsledek; není to opakování)`);

  await br.close(); srv.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌  (${GRADE}. ročník)`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
