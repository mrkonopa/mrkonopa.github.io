// Fáze 2 — zvuk + juice. Ověří: RPGSound existuje a je němý dokud soundOn=false;
// AudioContext se NEvytvoří na load (autoplay policy) — až po play() se zapnutým
// zvukem; setSoundOn přepíná (default false); screen-shake přidá .shaking na
// #s-battle, ale při reduced-motion je animace vypnutá (CSS). `node ... [9]`.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '9';
const PORT = 18930 + Number(GRADE);
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
  // špión: spočítej vytvoření AudioContextu, aniž bychom rozbili WebAudio
  await page.addInitScript(() => {
    window.__ACount = 0;
    const wrap = C => C ? class extends C { constructor(...a) { super(...a); window.__ACount++; } } : C;
    if (window.AudioContext) window.AudioContext = wrap(window.AudioContext);
    if (window.webkitAudioContext) window.webkitAudioContext = wrap(window.webkitAudioContext);
  });
  await page.goto(`http://127.0.0.1:${PORT}/projects/rpg-mat-${GRADE}.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof RPGSound !== 'undefined' && typeof startGame === 'function' && typeof RPGWallet !== 'undefined', { timeout: 8000 });

  // ── 1) default: němý ──
  const d = await page.evaluate(() => ({ enabled: RPGSound._enabled(), soundOn: RPGWallet.getSoundOn(), acAtLoad: window.__ACount }));
  ok(d.enabled === false, 'RPGSound je ve výchozím stavu němý (_enabled=false)');
  ok(d.soundOn === false, 'RPGWallet.getSoundOn() default false');
  ok(d.acAtLoad === 0, 'AudioContext se NEvytvořil na load (autoplay policy)');

  // ── 2) play s vypnutým zvukem nic nevytvoří ──
  const off = await page.evaluate(() => { RPGSound.play('ok'); RPGSound.play('crit'); return window.__ACount; });
  ok(off === 0, 'play() s vypnutým zvukem nevytvoří AudioContext');

  // ── 3) zapnutí + play vytvoří kontext právě jednou ──
  const on = await page.evaluate(() => {
    RPGWallet.setSoundOn(true);
    const en = RPGSound._enabled();
    RPGSound.play('ok'); RPGSound.play('coin'); RPGSound.play('level'); RPGSound.play('boss'); RPGSound.play('bad'); RPGSound.play('click');
    return { en, count: window.__ACount };
  });
  ok(on.en === true, 'setSoundOn(true) → _enabled true');
  ok(on.count === 1, `AudioContext vznikne až po play se zapnutým zvukem, právě 1× (count ${on.count})`);

  // ── 4) neznámý název je no-op ──
  const noop = await page.evaluate(() => { const b = window.__ACount; RPGSound.play('nonexistent'); return window.__ACount === b; });
  ok(noop, 'neznámý název zvuku je bezpečný no-op');

  // ── 5) juice: shakeBattle přidá .shaking na #s-battle ──
  await page.evaluate(() => { localStorage.clear(); const i = document.getElementById('ni'); if (i) i.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });
  const shake = await page.evaluate(() => {
    const el = document.getElementById('s-battle');
    shakeBattle();
    const has = el.classList.contains('shaking');
    const anim = getComputedStyle(el).animationName;
    return { has, anim };
  });
  ok(shake.has, 'shakeBattle přidá třídu .shaking na #s-battle');
  ok(shake.anim === 'shake', `.shaking spouští @keyframes shake (animationName ${shake.anim})`);

  // ── 6) reduced-motion vypne shake animaci (CSS) ──
  const rm = await page.evaluate(() => {
    document.documentElement.classList.add('reduced-motion');
    const el = document.getElementById('s-battle');
    el.classList.add('shaking');
    const anim = getComputedStyle(el).animationName;
    document.documentElement.classList.remove('reduced-motion');
    return anim;
  });
  ok(rm === 'none', `při reduced-motion je shake animace vypnutá (animationName ${rm})`);

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Zvuk + juice (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
