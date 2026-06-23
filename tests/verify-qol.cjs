const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8765';

let browser, page, ctx;
const results = [];
const shots = [];

function log(icon, label, detail) {
  results.push({ icon, label, detail });
  console.log(`${icon} ${label}${detail ? ' → ' + detail : ''}`);
}

async function screenshot(name) {
  const path = `/tmp/claude-0/-home-user-mrkonopa-github-io/003acab7-a9a6-5f0a-9129-a3817d502e78/scratchpad/screen-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  shots.push({ name, path });
  return path;
}

async function injectMockSupabase() {
  await page.addInitScript(() => {
    window.__SUPABASE_MOCK__ = true;
    window.supabase = {
      createClient: () => ({
        auth: {
          onAuthStateChange: (cb) => { cb('SIGNED_OUT', null); return { data: { subscription: { unsubscribe: () => {} } } }; },
          getSession: async () => ({ data: { session: null } }),
          signInWithOAuth: async () => {}
        },
        from: () => ({ select: () => ({ eq: () => ({ data: [], error: null }) }) }),
        rpc: async () => ({ data: null, error: { message: 'mock' } })
      })
    };
  });
}

const ucitelSrc = fs.readFileSync('/home/user/mrkonopa.github.io/projects/rpg-ucitel.html', 'utf8');
const cloudSrc = fs.readFileSync('/home/user/mrkonopa.github.io/projects/rpg-cloud.js', 'utf8');
const learn6 = fs.readFileSync('/home/user/mrkonopa.github.io/projects/rpg-learn-6.js', 'utf8');
const learn7 = fs.readFileSync('/home/user/mrkonopa.github.io/projects/rpg-learn-7.js', 'utf8');
const battleJs = fs.readFileSync('/home/user/mrkonopa.github.io/projects/rpg-battle-ui.js', 'utf8');

(async () => {
  browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox']
  });

  // ── Feature 1: Tower suggestion toast ────────────────────────────────
  console.log('\n=== F1: Tower suggestion toast ===');
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await injectMockSupabase();
  await page.addInitScript(() => {
    const S = { name:'TestHrdina', xp:50, level:2, attrs:{calc:5,geo:3,anal:2,craft:1}, done:[], inv:[], errs:{}, mastery:{}, settings:{}, streak:{}, stats:{crits:0,trainCorrect:0,bestCombo:0}, ach:{}, tower:{best:0} };
    for(let i=0;i<5;i++) S.done.push('1-1-'+i);
    localStorage.setItem('RPG_MAT_9', JSON.stringify(S));
  });
  await page.goto(`${BASE}/projects/rpg-mat-9.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });

  const hasSuggestTower = await page.evaluate(() => typeof suggestTower === 'function');
  log(hasSuggestTower ? '✅' : '❌', 'F1 suggestTower function defined', String(hasSuggestTower));

  const hasTowerHintShown = await page.evaluate(() => typeof _towerHintShown !== 'undefined');
  log(hasTowerHintShown ? '✅' : '❌', 'F1 _towerHintShown guard exists', String(hasTowerHintShown));

  await page.evaluate(() => suggestTower());
  await page.waitForSelector('#tower-suggest', { timeout: 2000 });
  const toastText = await page.$eval('#tower-suggest', el => el.textContent);
  log(toastText.includes('Věž') ? '✅' : '❌', 'F1 tower toast shows "Věž legend"', toastText.trim().slice(0,60));
  await screenshot('f1-tower-toast');

  // 🔍 Probe: double call shouldn't create 2 toasts
  await page.evaluate(() => suggestTower());
  const toastCount = await page.$$eval('.ach-toast', els => els.filter(e => e.id === 'tower-suggest').length);
  log(toastCount === 1 ? '✅' : '❌', '🔍 F1 duplicate toast guard', `count=${toastCount}`);
  await ctx.close();

  // ── Feature 2: Countdown desync fix ────────────────────────────────
  console.log('\n=== F2: Countdown sync ===');
  const hasCountdownTo = battleJs.includes('function countdownTo(');
  const hasQStartedAt = battleJs.includes('q_started_at');
  const hasCDMS = battleJs.includes('COUNTDOWN_MS');
  const hasOldCountdown = /function countdown\(/.test(battleJs);
  log(hasCountdownTo ? '✅' : '❌', 'F2 countdownTo wall-clock function', '');
  log(hasQStartedAt ? '✅' : '❌', 'F2 uses q_started_at server timestamp', '');
  log(hasCDMS ? '✅' : '❌', 'F2 COUNTDOWN_MS constant', '');
  log(!hasOldCountdown ? '✅' : '⚠️', 'F2 old countdown() removed', String(hasOldCountdown));

  // ── Feature 3: Remove XP/credits ─────────────────────────────────
  console.log('\n=== F3: Remove XP/credits ===');
  const hasGiveXpFn = /async function giveXP\(i,sign\)/.test(ucitelSrc);
  const hasGiveCrFn = /async function giveCredits\(i,sign\)/.test(ucitelSrc);
  const hasOdebratBtn = ucitelSrc.includes('Odebrat') && ucitelSrc.includes('giveXP') && ucitelSrc.includes('-1');
  log(hasGiveXpFn ? '✅' : '❌', 'F3 giveXP(i,sign) function', '');
  log(hasGiveCrFn ? '✅' : '❌', 'F3 giveCredits(i,sign) function', '');
  log(hasOdebratBtn ? '✅' : '❌', 'F3 Odebrat button with sign=-1', '');

  // ── Feature 4: Hide staff checkbox ────────────────────────────────
  console.log('\n=== F4: Hide staff checkbox ===');
  log(ucitelSrc.includes('id="hide-staff"') ? '✅' : '❌', 'F4 hide-staff checkbox', '');
  log(ucitelSrc.includes('STAFF_EMAILS') ? '✅' : '❌', 'F4 STAFF_EMAILS constant', '');
  log((ucitelSrc.includes('hide-staff') && ucitelSrc.includes('filtered')) ? '✅' : '❌', 'F4 filtered() checks hide-staff', '');

  // ── Feature 5: Audit log ───────────────────────────────────────────
  console.log('\n=== F5: Audit log ===');
  log((ucitelSrc.includes('tab-audit') && ucitelSrc.includes('AKTIVITA')) ? '✅' : '❌', 'F5 AKTIVITA tab', '');
  log(ucitelSrc.includes('function loadAudit') ? '✅' : '❌', 'F5 loadAudit() function', '');
  log((ucitelSrc.includes('renderAuditList') || ucitelSrc.includes('renderAudit')) ? '✅' : '❌', 'F5 renderAuditList()', '');
  log(ucitelSrc.includes('RPGCloud.logAction(') ? '✅' : '❌', 'F5 RPGCloud.logAction() called', '');
  const logCnt = (ucitelSrc.match(/RPGCloud\.logAction\(/g) || []).length;
  log(logCnt > 5 ? '✅' : '⚠️', `F5 logAction call count`, `${logCnt}`);
  log((cloudSrc.includes('logAction') && cloudSrc.includes('listAuditLog')) ? '✅' : '❌', 'F5 exports in rpg-cloud.js', '');

  // ── Feature 6: Class archive ───────────────────────────────────────
  console.log('\n=== F6: Class archive ===');
  log(cloudSrc.includes('archived') ? '✅' : '❌', 'F6 archived in rpg-cloud.js', '');
  log((ucitelSrc.includes('activeClasses()') || ucitelSrc.includes('function activeClasses')) ? '✅' : '❌', 'F6 activeClasses()', '');
  log((ucitelSrc.includes('Archivovat') && ucitelSrc.includes('Obnovit')) ? '✅' : '❌', 'F6 Archivovat + Obnovit', '');
  log(ucitelSrc.includes('archiveClassUI') ? '✅' : '❌', 'F6 archiveClassUI()', '');
  log(fs.existsSync('/home/user/mrkonopa.github.io/projects/rpg-cloud-setup-phase16.sql') ? '✅' : '❌', 'F6 phase16.sql exists', '');

  // ── Feature 7: Theory videos ──────────────────────────────────────
  console.log('\n=== F7: Theory videos ===');
  const g6Videos = (learn6.match(/video:\s*\{/g) || []).length;
  const g7Videos = (learn7.match(/video:\s*\{/g) || []).length;
  const g6Nulls = (learn6.match(/video:\s*null/g) || []).length;
  const g7Nulls = (learn7.match(/video:\s*null/g) || []).length;
  log(g6Videos >= 2 ? '✅' : '❌', `F7 rpg-learn-6.js videos`, `${g6Videos} set, ${g6Nulls} null`);
  log(g7Videos >= 2 ? '✅' : '❌', `F7 rpg-learn-7.js videos`, `${g7Videos} set, ${g7Nulls} null`);
  log(learn6.includes('GcR_xKAu5kQ') ? '✅' : '❌', 'F7 g6 obvod video ID', '');
  log(learn6.includes('Yp5u-LyQUXQ') ? '✅' : '❌', 'F7 g6 osová souměrnost video ID', '');

  // ── Live: rpg-mat-9 full route to map ────────────────────────────
  console.log('\n=== Live: rpg-mat-9 map ===');
  ctx = await browser.newContext();
  const errors = [];
  page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await injectMockSupabase();
  await page.addInitScript(() => {
    const S = {
      name:'Testovač', xp:200, level:3,
      attrs:{calc:10,geo:8,anal:6,craft:4},
      done:[], inv:[], errs:{}, mastery:{},
      settings:{}, streak:{last:'',count:0},
      stats:{crits:0,trainCorrect:0,bestCombo:0},
      ach:{}, tower:{best:0}, snapsMigrated:true
    };
    localStorage.setItem('RPG_MAT_9', JSON.stringify(S));
  });
  await page.goto(`${BASE}/projects/rpg-mat-9.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => continueGame());
  await page.waitForTimeout(1000);
  const mapVisible = await page.isVisible('#s-map');
  log(mapVisible ? '✅' : '❌', 'Live map screen visible after continueGame', '');
  const filteredErrors = errors.filter(e => !e.includes('ERR_CERT') && !e.includes('net::ERR') && !e.includes('Failed to fetch'));
  log(filteredErrors.length === 0 ? '✅' : '❌', 'Live no JS errors', filteredErrors.join('; ').slice(0,120) || 'clean');
  await screenshot('live-map-9');

  // 🔍 Tower toast fires on map
  await page.evaluate(() => { _towerHintShown = false; suggestTower(); });
  await page.waitForTimeout(500);
  const liveToast = await page.isVisible('#tower-suggest');
  log(liveToast ? '✅' : '❌', '🔍 Live tower toast visible on map', '');
  await screenshot('live-map-tower-toast');
  await ctx.close();

  // 🔍 rpg-mat-6 also has suggestTower
  ctx = await browser.newContext();
  page = await ctx.newPage();
  const errs6 = [];
  page.on('pageerror', e => errs6.push(e.message));
  await injectMockSupabase();
  await page.addInitScript(() => {
    const S = { name:'Tester6', xp:100, level:2, attrs:{calc:5,geo:3,anal:2,craft:1}, done:[], inv:[], errs:{}, mastery:{}, settings:{}, streak:{last:'',count:0}, stats:{crits:0,trainCorrect:0,bestCombo:0}, ach:{}, tower:{best:0}, snapsMigrated:true };
    localStorage.setItem('RPG_MAT_6', JSON.stringify(S));
  });
  await page.goto(`${BASE}/projects/rpg-mat-6.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => continueGame());
  await page.waitForTimeout(800);
  const has6tower = await page.evaluate(() => typeof suggestTower === 'function');
  log(has6tower ? '✅' : '❌', '🔍 rpg-mat-6 also has suggestTower', '');
  const filt6 = errs6.filter(e => !e.includes('ERR_CERT') && !e.includes('net::ERR') && !e.includes('Failed to fetch'));
  log(filt6.length === 0 ? '✅' : '❌', '🔍 rpg-mat-6 no JS errors', filt6.slice(0,2).join('; ') || 'clean');
  await ctx.close();

  await browser.close();

  // Summary
  const pass = results.filter(r => r.icon === '✅').length;
  const fail = results.filter(r => r.icon === '❌').length;
  const warn = results.filter(r => r.icon === '⚠️').length;
  console.log(`\n--- SUMMARY: ${pass} ✅  ${fail} ❌  ${warn} ⚠️ ---`);
  console.log(`VERDICT: ${fail > 0 ? 'FAIL' : warn > 0 ? 'PASS (warnings)' : 'PASS'}`);
  console.log('Screenshots:', shots.map(s=>s.name).join(', '));

  if (fail > 0) process.exit(1);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
