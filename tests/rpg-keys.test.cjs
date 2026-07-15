// Fáze 5 — ovládání klávesnicí (centrální RPGKeys). Ověří: 1–4/A–D vybere
// MC volbu; A/N vybere ANO/NE; při fokusu v <input> se klávesy NEhijackují
// (psaní číselné odpovědi funguje). `node ... [9]`.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '9';
const PORT = 18870 + Number(GRADE);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m); } };

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
  await page.waitForFunction(() => typeof startGame === 'function' && typeof launchBattle === 'function', { timeout: 8000 });
  await page.evaluate(() => { localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  // ── 1) MC: nastartuj MC misi, zobraz mc-mřížku ──
  const mcReady = await page.evaluate(() => {
    for (const ar of AREAS) for (const m of ar.missions) {
      if (m.mc) { launchBattle(ar.id, m.id); return { ok: true, aid: ar.id, mid: m.id }; }
    }
    return { ok: false };
  });
  ok(mcReady.ok, 'nalezena MC mise');
  await page.waitForFunction(() => typeof BT !== 'undefined' && BT.curTask, { timeout: 5000 });
  const gridVisible = await page.evaluate(() => {
    const g = document.getElementById('mc-grid');
    return g && g.offsetParent !== null && g.querySelectorAll('.mc-btn').length >= 2;
  });
  ok(gridVisible, 'mc-mřížka je viditelná se 2+ volbami');

  // ── 2) klávesa "1" klikne první volbu (submitMC → tlačítka se zamknou) ──
  const key1 = await page.evaluate(() => {
    const g = document.getElementById('mc-grid');
    const first = g.querySelector('.mc-btn');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    return { locked: first.disabled, marked: first.classList.contains('right') || first.classList.contains('wrong') };
  });
  ok(key1.locked && key1.marked, 'klávesa 1 vybere první MC volbu');

  // ── 3) klávesa "B" na nové kartě klikne druhou volbu ──
  const keyB = await page.evaluate(() => {
    // další MC úloha ve stejné misi
    for (let i = 0; i < BT.tasks.length; i++) { if (!S.done[`${BT.mid}-${i}`]) { BT.idx = i; BT._rendered = -1; renderTask(); break; } }
    const g = document.getElementById('mc-grid');
    if (!g || g.offsetParent === null) return { skip: true };
    const btns = [...g.querySelectorAll('.mc-btn')];
    if (btns.length < 2) return { skip: true };
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
    return { skip: false, marked: btns[1].disabled };
  });
  ok(keyB.skip || keyB.marked, 'klávesa B vybere druhou MC volbu');

  // ── 4) guard: fokus v <input> → klávesa se NEhijackne ──
  const guard = await page.evaluate(() => {
    // nová MC karta
    for (let i = 0; i < BT.tasks.length; i++) { if (!S.done[`${BT.mid}-${i}`]) { BT.idx = i; BT._rendered = -1; renderTask(); break; } }
    const g = document.getElementById('mc-grid');
    if (!g || g.offsetParent === null) return { skip: true };
    const first = g.querySelector('.mc-btn');
    // vlož dočasný viditelný input a zaostři ho
    const inp = document.createElement('input'); inp.type = 'text'; document.body.appendChild(inp); inp.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    const clicked = first.disabled;
    inp.remove();
    return { skip: false, notClicked: !clicked };
  });
  ok(guard.skip || guard.notClicked, 'při fokusu v inputu se MC klávesa NEhijackne (psaní odpovědi funguje)');

  // ── 5) ANO/NE kontrakt handleru: A→první (ANO), N→druhé (NE) ──
  // Real-battle YN je zamlžený minihrami (leftover viditelný yn-row); handler
  // ale reaguje na JAKÝKOLI viditelný [id$="yn-row"] v aktivní obrazovce, tak
  // ověříme mapování kláves deterministicky přímo na jeho DOM kontraktu.
  await page.evaluate(() => { if (typeof go === 'function') go('map'); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });
  const yn = await page.evaluate(() => {
    const scr = document.querySelector('.screen.active');
    const row = document.createElement('div');
    row.id = 'test-yn-row';
    row.innerHTML = '<button>ANO</button><button>NE</button>';
    let clicked = '';
    row.children[0].addEventListener('click', () => clicked = 'ano');
    row.children[1].addEventListener('click', () => clicked = 'ne');
    scr.appendChild(row);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));
    const afterN = clicked; clicked = '';
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    const afterA = clicked;
    row.remove();
    return { afterN, afterA };
  });
  ok(yn.afterN === 'ne', 'klávesa N vybere NE');
  ok(yn.afterA === 'ano', 'klávesa A vybere ANO');

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Klávesnice (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
