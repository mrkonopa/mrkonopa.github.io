/* Virtuální třída: 30 žáků projde hrami 6/7/8/9 — boje, teorie, trénink.
   Čte BT.tasks[BT.idx].ans přímo ze stránky → reálně vyhrává mise.
   Sbírá console.error a pageerror. Spusť: node tests/vstudents.harness.cjs */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'};

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      if (u.endsWith('/')) u += 'index.html';
      const fp = path.join(ROOT, u);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { rep.writeHead(404); return rep.end('nf'); }
      rep.writeHead(200, {'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream'});
      fs.createReadStream(fp).pipe(rep);
    });
    srv.listen(0, () => res(srv));
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const GAMES = [6,7,8,9];
const NAMES = ['Adam','Bára','Cyril','Dana','Eva','Filip','Gita','Hana','Ivan','Jana','Karel','Lucie','Marek','Nela','Ota','Pavla','Radek','Sára','Tomáš','Ula','Vít','Zoe','Áďa','Bedřich','Cecilie','Dalibor','Ela','Fanda','Gábi','Honza'];

async function runStudent(browser, base, idx) {
  const game = GAMES[idx % 4];
  const name = NAMES[idx];
  const errors = [];
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const log = [];
  // ignoruj síťové selhání externího CDN (Supabase přes jsdelivr je v sandboxu blokované — hra běží lokálně)
  const isEnvNoise = t => /Failed to load resource|ERR_CERT_AUTHORITY_INVALID|net::ERR_|supabase|jsdelivr/i.test(t);
  page.on('console', m => { if (m.type() === 'error' && !isEnvNoise(m.text())) errors.push(`[console] ${m.text()}`); });
  page.on('pageerror', e => { if (!isEnvNoise(e.message)) errors.push(`[pageerror] ${e.message}`); });
  const did = { battles:0, tasksAnswered:0, missionsDone:0, theoryOpened:0, videosFound:0, trainAnswered:0, hints:0 };

  try {
    await page.goto(`${base}/projects/rpg-mat-${game}.html`, { waitUntil: 'load' });
    // intro → name → start
    await page.waitForSelector('#ni', { timeout: 8000 });
    await page.fill('#ni', name);
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 8000 });

    // projdi až 2 oblasti (1. odemčená, 2. se odemkne dokončením 1.)
    for (let area = 1; area <= 2; area++) {
      const opened = await page.evaluate((aid) => { try { openArea(aid); return true; } catch(e){ return false; } }, area);
      if (!opened) break;
      await page.waitForFunction(() => document.querySelector('#s-area')?.classList.contains('active'), { timeout: 6000 });

      // otevři Teorii u první mise, co ji má
      const learnBtn = await page.$('#mission-list .learn-btn');
      if (learnBtn) {
        await learnBtn.click();
        await page.waitForFunction(() => document.querySelector('#s-learn')?.classList.contains('active'), { timeout: 5000 }).catch(()=>{});
        const info = await page.evaluate(() => {
          const c = document.querySelector('#learn-content');
          const vid = document.querySelector('#learn-content .learn-video');
          return { kids: c ? c.children.length : 0, hasVideo: !!vid, href: vid?vid.getAttribute('href'):null };
        });
        if (info.kids > 0) did.theoryOpened++;
        if (info.hasVideo && /youtube\.com\/watch\?v=.+/.test(info.href)) did.videosFound++;
        await page.evaluate(() => go('area'));
        await sleep(30);
      }

      // dokonči všechny mise v oblasti (čteme správné odpovědi)
      const missionIds = await page.evaluate((aid) => {
        const ar = AREAS.find(a => a.id === aid);
        return ar ? ar.missions.map(m => ({ id: m.id, tc: m.tc })) : [];
      }, area);

      for (const m of missionIds) {
        const started = await page.evaluate((p) => { try { launchBattle(p.aid, p.id); return true; } catch(e){ return false; } }, { aid: area, id: m.id });
        if (!started) continue;
        await page.waitForFunction(() => document.querySelector('#s-battle')?.classList.contains('active'), { timeout: 6000 }).catch(()=>{});
        did.battles++;

        // odpověz na všechny úkoly mise
        for (let step = 0; step < m.tc + 3; step++) {
          const st = await page.evaluate(() => {
            if (!document.querySelector('#s-battle')?.classList.contains('active')) return { done:true };
            const t = BT.tasks[BT.idx];
            if (!t) return { done:true };
            const mc = document.querySelector('#mc-grid');
            const isMC = mc && getComputedStyle(mc).display !== 'none';
            return { done:false, ans: String(t.ans), isMC,
              mcOpts: isMC ? Array.from(mc.querySelectorAll('button,div')).map(b=>b.textContent.trim()) : [] };
          });
          if (st.done) break;

          // občas si vyžádej nápovědu
          if (step === 0) { await page.evaluate(() => { try{ showHint(); }catch(e){} }); did.hints++; }

          if (st.isMC) {
            await page.evaluate((ans) => {
              const mc = document.querySelector('#mc-grid');
              const btns = Array.from(mc.querySelectorAll('button,div')).filter(b=>b.textContent.trim()!=='');
              const hit = btns.find(b => b.textContent.trim() === ans) || btns[0];
              hit.click();
            }, st.ans);
          } else {
            await page.fill('#bt-ans', st.ans).catch(()=>{});
            await page.evaluate(() => { try{ submitAnswer(); }catch(e){} });
          }
          did.tasksAnswered++;
          await sleep(20);
          // klikni další, pokud je vidět
          await page.evaluate(() => { const n=document.querySelector('#next-btn'); if(n && n.style.display!=='none'){ try{ nextTask(); }catch(e){} } });
          await sleep(20);
        }
        // spočítej dokončené mise dle save
        await page.evaluate(() => { try{ if(document.querySelector('#s-battle')?.classList.contains('active')) exitBattle(); }catch(e){} });
        await sleep(20);
      }
      const doneCount = await page.evaluate(() => Object.keys(S.done||{}).length);
      did.missionsDone = doneCount;
    }

    // trénink: mapa → train → první téma → pár odpovědí
    await page.evaluate(() => go('map'));
    await page.evaluate(() => { try{ go('train'); renderTrainPicker(); }catch(e){} });
    await sleep(40);
    const trainHas = await page.evaluate(() => document.querySelector('#s-train')?.classList.contains('active'));
    if (trainHas) {
      const startedTrain = await page.evaluate(() => {
        const list = document.querySelector('#train-list');
        const first = list && list.querySelector('button[onclick^="startTrain"]');
        if (first) { first.click(); return true; }
        return false;
      });
      if (startedTrain) {
        await sleep(40);
        for (let i = 0; i < 5; i++) {
          const st = await page.evaluate(() => {
            if (!TR || !TR.task) return { done:true };
            const mc = document.querySelector('#tr-mc');
            const isMC = mc && getComputedStyle(mc).display !== 'none';
            return { done:false, ans:String(TR.task.ans), isMC };
          }).catch(()=>({done:true}));
          if (st.done) break;
          if (st.isMC) {
            await page.evaluate((ans) => {
              const mc = document.querySelector('#tr-mc');
              const btns = Array.from(mc.querySelectorAll('button,div')).filter(b=>b.textContent.trim()!=='');
              const hit = btns.find(b => b.textContent.trim() === ans) || btns[0];
              if (hit) hit.click();
            }, st.ans);
          } else {
            await page.fill('#tr-ans', st.ans).catch(()=>{});
            await page.evaluate(() => { try{ trSubmit(); }catch(e){} });
          }
          did.trainAnswered++;
          await sleep(20);
          await page.evaluate(() => { const n=document.querySelector('#tr-next-btn'); if(n && n.style.display!=='none'){ try{ trNext(); }catch(e){} } });
          await sleep(20);
        }
      }
    }

    // profil + zpět na mapu (klikání)
    await page.evaluate(() => { try{ go('profile'); }catch(e){} });
    await sleep(20);
    await page.evaluate(() => { try{ go('map'); }catch(e){} });

    // ověř uložení
    const saved = await page.evaluate((g) => !!localStorage.getItem('RPG_MAT_' + g), game);
    if (!saved) errors.push('[save] localStorage RPG_MAT_' + game + ' chybí');

  } catch (e) {
    errors.push('[harness] ' + e.message);
  } finally {
    await ctx.close();
  }
  return { idx, name, game, errors, did };
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args:['--no-sandbox'] });
  console.log('▶ Spouštím 30 virtuálních žáků…\n');

  const results = [];
  const CONC = 6;
  for (let i = 0; i < 30; i += CONC) {
    const batch = [];
    for (let j = i; j < Math.min(i + CONC, 30); j++) batch.push(runStudent(browser, base, j));
    results.push(...await Promise.all(batch));
    process.stdout.write(`  …${Math.min(i+CONC,30)}/30\n`);
  }

  await browser.close();
  srv.close();

  // souhrn
  const agg = { battles:0, tasksAnswered:0, theoryOpened:0, videosFound:0, trainAnswered:0, hints:0 };
  let totalErrors = 0;
  const perGame = {6:0,7:0,8:0,9:0};
  console.log('\n══════════ VÝSLEDKY ══════════');
  for (const r of results) {
    for (const k in agg) agg[k] += r.did[k] || 0;
    perGame[r.game]++;
    if (r.errors.length) {
      totalErrors += r.errors.length;
      console.log(`❌ ž.${r.idx} ${r.name} (mat-${r.game}) [done:${r.did.missionsDone}]`);
      r.errors.slice(0,5).forEach(e => console.log('     '+e));
    }
  }
  console.log('\n── Souhrn aktivity (30 žáků) ──');
  console.log(`  Žáků/hra: 6:${perGame[6]} 7:${perGame[7]} 8:${perGame[8]} 9:${perGame[9]}`);
  console.log(`  Bojů spuštěno:      ${agg.battles}`);
  console.log(`  Úkolů zodpovězeno:  ${agg.tasksAnswered}`);
  console.log(`  Nápověd vyžádáno:   ${agg.hints}`);
  console.log(`  Teorie otevřeno:    ${agg.theoryOpened}`);
  console.log(`  Videí ověřeno:      ${agg.videosFound}`);
  console.log(`  Tréninkových úloh:  ${agg.trainAnswered}`);
  console.log('\n══════════════════════════════');
  console.log(totalErrors === 0 ? '  ✅ ŽÁDNÉ JS CHYBY' : `  ❌ CELKEM CHYB: ${totalErrors}`);
  console.log('══════════════════════════════');
  process.exit(totalErrors === 0 ? 0 : 1);
})();
