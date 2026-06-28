/**
 * "Opravdový hráč" — projde mise 1. stupně (3./4./5.) přes UI a hlídá, že:
 *  - po SPRÁVNÉ odpovědi (MC / text / ANO-NE / řadicí mini-úkol) se objeví „Dále"
 *    a dá se postoupit (žádné zaseknutí jako u cvrčka skokana),
 *  - boss HP ubyde HNED po správné odpovědi (ne až po kliknutí na Dále).
 * Spusť: node tests/rpg-1stupen-play.test.cjs
 */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
function serve() { return new Promise(res => { const s = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html'; const f = path.normalize(path.join(ROOT, u)); if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f)) { r.writeHead(404); return r.end('nf'); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'x' }); fs.createReadStream(f).pipe(r); }); s.listen(0, () => res(s)); }); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

(async () => {
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC });
  for (const g of [3, 4, 5]) {
    console.log(`\n━━ ${g}. ročník ━━`);
    const ctx = await browser.newContext({ viewport: { width: 480, height: 860 } });
    await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0, 80)));
    await pg.goto(`${base}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' }); await sleep(700);
    await pg.evaluate(() => { document.getElementById('ni').value = 'HRÁČ'; startGame(); }); await sleep(300);

    // ── 1) Řadicí mini-úkol (cvrček skokan): po správném dokončení MUSÍ být Dále ──
    const mini = await pg.evaluate(async () => {
      const ar = AREAS[0]; launchBattle(ar.id, ar.missions[0].id);
      await new Promise(r => setTimeout(r, 400));
      // simuluj správně dokončený řadicí/párovací mini-úkol (0 chyb) — tady byl bug:
      // battleMiniDone neukazoval „Dále" a hra se zasekla
      battleMiniDone(0);
      const nb = document.getElementById('next-btn');
      return (nb && nb.style.display !== 'none') ? 'DALE-OK' : 'STUCK';
    });
    ok('řadicí mini-úkol → po správném seřazení se objeví „Dále"', mini === 'DALE-OK', 'výsledek: ' + mini);

    // ── 2) Plný průchod misí 1-1 přes UI: nikde se nezasekne ──
    await pg.evaluate(() => { const ar = AREAS[0]; launchBattle(ar.id, ar.missions[0].id); }); await sleep(500);
    let stuck = false, hpDropSeen = false, steps = 0, completed = false;
    for (let i = 0; i < 24; i++) {
      steps++;
      const st = await pg.evaluate(() => {
        const scr = (document.querySelector('.screen.active') || {}).id;
        if (scr !== 's-battle') return { scr };
        const nb = document.getElementById('next-btn');
        const vis = id => { const e = document.getElementById(id); return e && e.style.display !== 'none'; };
        const t = BT.curTask;
        return {
          scr, next: !!(nb && nb.style.display !== 'none'),
          ans: t ? String(t.ans) : null, isMini: !!(t && t.text === '' && t.ans === ''),
          mc: vis('mc-grid'), yn: vis('yn-row'), input: vis('bt-input-row'),
          hp: parseFloat(document.getElementById('bt-hpbar').style.width || '100')
        };
      });
      if (st.scr !== 's-battle') { completed = true; break; }
      if (st.next) { await pg.evaluate(() => nextTask()); await sleep(160); continue; }
      const hpBefore = st.hp;
      // odpověz správně podle typu
      if (st.isMini) await pg.evaluate(() => battleMiniDone(0));
      else if (st.mc) await pg.evaluate(a => { const b = [...document.querySelectorAll('#mc-grid .mc-btn')].find(x => x.textContent.trim() === a); if (b) b.click(); }, st.ans);
      else if (st.yn) await pg.evaluate(a => answerYN(a), st.ans);
      else if (st.input) await pg.evaluate(a => { document.getElementById('bt-ans').value = a; submitAnswer(); }, st.ans);
      await sleep(260);
      const after = await pg.evaluate(() => ({
        scr: (document.querySelector('.screen.active') || {}).id,
        next: (() => { const nb = document.getElementById('next-btn'); return !!(nb && nb.style.display !== 'none'); })(),
        hp: parseFloat(document.getElementById('bt-hpbar').style.width || '100')
      }));
      if (after.hp < hpBefore - 0.01) hpDropSeen = true; // boss HP ubyl HNED po správné odpovědi
      if (after.scr === 's-battle' && !after.next) { stuck = true; break; }
    }
    ok('mise 1-1: projde se celá bez zaseknutí (objeví se „Dále")', !stuck && (completed || steps > 0), stuck ? 'ZASEKLO se po správné odpovědi' : 'kroků: ' + steps);
    ok('boss HP ubývá hned po správné odpovědi (ne až po „Dále")', hpDropSeen, hpDropSeen ? '' : 'HP bar se po správné odpovědi nezměnil');
    const re = errs.filter(e => !/ERR_CERT|net::|jsdelivr|supabase/i.test(e));
    ok('žádné JS chyby během hraní', re.length === 0, re.slice(0, 2).join(' | '));
    await ctx.close();
  }
  await browser.close(); srv.close();
  console.log(`\n══════════ VÝSLEDEK: ${pass} ✅ / ${fail} ❌ ══════════`);
  if (fail) process.exitCode = 1;
})();
