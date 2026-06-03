/* Test: odznaky (achievements) + denní série v rpg-mat-9.html (Playwright).
   Ověřuje: streak po startu, odemčení 'boot' po 1. úkolu, splnění mise → další
   odznaky, render v profilu, perzistence v localStorage. 0 JS chyb.
   Spusť: node tests/rpg-ach.test.cjs */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css' };

let pass = 0, fail = 0;
function ok(name, cond, d='') { if (cond){console.log('  ✅ '+name);pass++;} else {console.log('  ❌ '+name+(d?' — '+d:''));fail++;} }

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { rep.writeHead(404); return rep.end('nf'); }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(rep);
    });
    srv.listen(0, () => res(srv));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isNoise = t => /Failed to load resource|ERR_CERT_AUTHORITY_INVALID|net::ERR_|supabase|jsdelivr/i.test(t);

// dohraje jednu misi: čte správné odpovědi z BT.tasks
async function finishMission(page, aid, mid, tc) {
  await page.evaluate(p => launchBattle(p.aid, p.mid), { aid, mid });
  await page.waitForFunction(() => document.querySelector('#s-battle')?.classList.contains('active'), { timeout: 6000 }).catch(()=>{});
  for (let step = 0; step < tc + 4; step++) {
    const st = await page.evaluate(() => {
      if (!document.querySelector('#s-battle')?.classList.contains('active')) return { done:true };
      const t = BT.tasks[BT.idx]; if (!t) return { done:true };
      const mc = document.querySelector('#mc-grid');
      const isMC = mc && getComputedStyle(mc).display !== 'none';
      return { done:false, ans:String(t.ans), isMC };
    });
    if (st.done) break;
    if (st.isMC) {
      await page.evaluate(ans => {
        // text tlačítka = klávesa (A–D) + možnost → odstraň úvodní písmeno
        const val = b => b.textContent.trim().replace(/^[ABCD]/, '');
        const btns = Array.from(document.querySelectorAll('#mc-grid .mc-btn')).filter(b=>val(b)!=='');
        (btns.find(b=>val(b)===ans)||btns[0]).click();
      }, st.ans);
    } else {
      await page.fill('#bt-ans', st.ans).catch(()=>{});
      await page.evaluate(() => { try{ submitAnswer(); }catch(e){} });
    }
    await sleep(25);
    await page.evaluate(() => { const n=document.querySelector('#next-btn'); if(n&&n.style.display!=='none'){ try{ nextTask(); }catch(e){} } });
    await sleep(25);
  }
  await page.evaluate(() => { try{ if(document.querySelector('#s-battle')?.classList.contains('active')) exitBattle(); }catch(e){} });
  await sleep(20);
}

(async () => {
  console.log('\n── Odznaky + denní série (rpg-mat-9) ──\n');
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args:['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type()==='error' && !isNoise(m.text())) errors.push(m.text()); });
    page.on('pageerror', e => { if (!isNoise(e.message)) errors.push(e.message); });
    await page.goto(`${base}/projects/rpg-mat-9.html`, { waitUntil:'load' });

    await page.waitForSelector('#ni', { timeout: 8000 });
    await page.fill('#ni', 'TESTER');
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 8000 });

    ok('ACH a evalAch jsou definované', await page.evaluate(() => Array.isArray(ACH) && typeof evalAch==='function'));
    ok('po startu má hráč denní sérii ≥1', await page.evaluate(() => (S.streak&&S.streak.count)>=1));

    // dohraj celou 1. oblast (3 mise) → boot, area1, flawless možné
    const a1 = await page.evaluate(() => AREAS.find(a=>a.id===1).missions.map(m=>({id:m.id,tc:m.tc})));
    for (const m of a1) await finishMission(page, 1, m.id, m.tc);

    const ach = await page.evaluate(() => Object.keys(S.ach||{}));
    ok("'boot' odemčen po prvním úkolu", ach.includes('boot'), 'ach='+ach.join(','));
    ok('1. oblast splněna → odznak area1', ach.includes('area1'), 'ach='+ach.join(','));
    ok('odemčeno aspoň 2 odznaky', ach.length >= 2, 'počet='+ach.length);

    // profil renderuje odznaky
    await page.evaluate(() => go('profile'));
    await page.waitForFunction(() => document.querySelector('#s-profile')?.classList.contains('active'), { timeout: 4000 });
    const slots = await page.$$('#pr-ach .ach-slot');
    ok('profil vykreslí mřížku odznaků', slots.length === await page.evaluate(()=>ACH.length), 'slotů='+slots.length);
    const haveSlots = await page.$$('#pr-ach .ach-slot.have');
    ok('získané odznaky jsou zvýrazněné (have)', haveSlots.length >= 2, 'have='+haveSlots.length);
    const counter = await page.evaluate(() => document.getElementById('pr-ach-n').textContent);
    ok('počítadlo odznaků sedí', String(haveSlots.length) === counter, counter+' vs '+haveSlots.length);

    // perzistence: nový kontext, načti save
    const saved = await page.evaluate(() => localStorage.getItem('RPG_MAT_9'));
    ok('odznaky uložené v localStorage', /"ach"/.test(saved) && /"boot"/.test(saved));
    ok('série uložená v localStorage', /"streak"/.test(saved));

    ok('žádné JS chyby', errors.length === 0, errors.slice(0,3).join(' | '));
    await ctx.close();
  } catch (e) {
    ok('běh bez výjimky', false, e.message);
  } finally {
    await browser.close(); srv.close();
  }
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
