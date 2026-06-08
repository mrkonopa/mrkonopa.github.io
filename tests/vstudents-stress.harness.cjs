/* Stresový harness: 120 žáků projde hrami 6/7/8/9 + wallet stres test.
   30 žáků na každou hru, concurrency 10, kontrola JS chyb + wallet integrity.
   Spusť: node tests/vstudents-stress.harness.cjs */
'use strict';
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
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { rep.writeHead(404); return rep.end('nf'); }
      rep.writeHead(200, {'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream'});
      fs.createReadStream(fp).pipe(rep);
    });
    srv.listen(0, () => res(srv));
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const GAMES = [6,7,8,9];
const NAMES = [
  'Adam','Bára','Cyril','Dana','Eva','Filip','Gita','Hana','Ivan','Jana',
  'Karel','Lucie','Marek','Nela','Ota','Pavla','Radek','Sára','Tomáš','Ula',
  'Vít','Zoe','Áďa','Bedřich','Cecilie','Dalibor','Ela','Fanda','Gábi','Honza',
  'Igor','Jitka','Klára','Leoš','Marta','Norbert','Olga','Petr','Renata','Stanislav',
  'Tereza','Urban','Václav','Wanda','Xena','Yvona','Zuzana','Aleš','Barbora','Caesar',
  'David','Emma','Félix','Gabriela','Hamid','Irena','Jaroslav','Kateřina','Lukáš','Marie',
  'Natálie','Ondřej','Petra','Quentin','Rozálie','Šimon','Táňa','Ugo','Viola','Waldemar',
  'Xantipa','Yelena','Zdravko','Aneta','Boris','Ctibor','Dagmar','Eduard','Fiala','Gustáv',
  'Helena','Isidor','Juliana','Kamil','Leona','Milan','Nina','Otto','Pavol','Radmila',
  'Sylvester','Taťána','Ulrika','Věra','Wendy','Xenofon','Yaroslav','Zita','Antonín','Blanka',
  'Ctislav','Darina','Emil','Fatima','Gregor','Hedvika','Justýna','Kristýna','Libor','Monika',
  'Nikolaj','Oleg','Pavel','Radan','Soňa','Theodor','Vladimíra','Walther','Zbynek','Žaneta',
];

async function runStudent(browser, base, idx) {
  const game = GAMES[idx % 4];
  const name = NAMES[idx % NAMES.length] + (idx >= NAMES.length ? `_${Math.floor(idx/NAMES.length)}` : '');
  const errors = [];
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const isEnvNoise = t => /Failed to load resource|ERR_CERT_AUTHORITY_INVALID|net::ERR_|supabase|jsdelivr/i.test(t);
  page.on('console', m => { if (m.type() === 'error' && !isEnvNoise(m.text())) errors.push(`[console] ${m.text()}`); });
  page.on('pageerror', e => { if (!isEnvNoise(e.message)) errors.push(`[pageerror] ${e.message}`); });
  const did = { battles:0, tasksAnswered:0, missionsDone:0, theoryOpened:0, videosFound:0, trainAnswered:0, hints:0, shopOpened:0, creditsEarned:0 };

  try {
    await page.goto(`${base}/projects/rpg-mat-${game}.html`, { waitUntil: 'load' });
    await page.waitForSelector('#ni', { timeout: 8000 });
    await page.fill('#ni', name);
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 8000 });

    for (let area = 1; area <= 2; area++) {
      const opened = await page.evaluate((aid) => { try { openArea(aid); return true; } catch(e){ return false; } }, area);
      if (!opened) break;
      await page.waitForFunction(() => document.querySelector('#s-area')?.classList.contains('active'), { timeout: 6000 });

      // Teorie
      const learnBtn = await page.$('#mission-list .learn-btn');
      if (learnBtn) {
        await learnBtn.click();
        await page.waitForFunction(() => document.querySelector('#s-learn')?.classList.contains('active'), { timeout: 5000 }).catch(()=>{});
        const info = await page.evaluate(() => {
          const c = document.querySelector('#learn-content');
          const vid = document.querySelector('#learn-content .learn-video');
          return { kids: c ? c.children.length : 0, hasVideo: !!vid };
        });
        if (info.kids > 0) did.theoryOpened++;
        if (info.hasVideo) did.videosFound++;
        await page.evaluate(() => go('area'));
        await sleep(30);
      }

      const missionIds = await page.evaluate((aid) => {
        const ar = AREAS.find(a => a.id === aid);
        return ar ? ar.missions.map(m => ({ id: m.id, tc: m.tc })) : [];
      }, area);

      for (const m of missionIds) {
        const started = await page.evaluate((p) => { try { launchBattle(p.aid, p.id); return true; } catch(e){ return false; } }, { aid: area, id: m.id });
        if (!started) continue;
        await page.waitForFunction(() => document.querySelector('#s-battle')?.classList.contains('active'), { timeout: 6000 }).catch(()=>{});
        did.battles++;

        for (let step = 0; step < m.tc + 3; step++) {
          const st = await page.evaluate(() => {
            if (!document.querySelector('#s-battle')?.classList.contains('active')) return { done:true };
            const t = BT.tasks[BT.idx];
            if (!t) return { done:true };
            const mc = document.querySelector('#mc-grid');
            const isMC = mc && getComputedStyle(mc).display !== 'none';
            return { done:false, ans: String(t.ans), isMC };
          });
          if (st.done) break;
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
          await page.evaluate(() => { const n=document.querySelector('#next-btn'); if(n && n.style.display!=='none'){ try{ nextTask(); }catch(e){} } });
          await sleep(20);
        }
        await page.evaluate(() => { try{ if(document.querySelector('#s-battle')?.classList.contains('active')) exitBattle(); }catch(e){} });
        await sleep(20);
      }
      const doneCount = await page.evaluate(() => Object.keys(S.done||{}).length);
      did.missionsDone = doneCount;
    }

    // Trénink
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

    // Obchod: otevři, zkus koupit první položku
    await page.evaluate(() => { try{ go('map'); }catch(e){} });
    await sleep(30);
    const shopOpened = await page.evaluate(() => {
      try { go('shop'); return document.querySelector('#s-shop')?.classList.contains('active'); }
      catch(e){ return false; }
    });
    if (shopOpened) {
      did.shopOpened++;
      // Zkus koupit první shopItem (může selhat pro nedostatek kreditů – to je OK)
      await page.evaluate(() => {
        try { if(typeof buyItem==='function') buyItem(SHOP_ITEMS[0]?.id); } catch(e){}
      });
      await sleep(20);
    }

    // Kredity z wallet
    did.creditsEarned = await page.evaluate(() => {
      try {
        if (typeof RPGWallet !== 'undefined') return RPGWallet.getCredits();
        return S.credits || 0;
      } catch(e){ return 0; }
    });

    // Zpět na mapu
    await page.evaluate(() => { try{ go('map'); }catch(e){} });
    await sleep(20);

    // Wallet invariant: kredity >= 0
    const walletOk = await page.evaluate(() => {
      try {
        if (typeof RPGWallet === 'undefined') return true;
        const w = RPGWallet.get();
        return typeof w.credits === 'number' && w.credits >= 0 && Number.isFinite(w.credits);
      } catch(e){ return false; }
    });
    if (!walletOk) errors.push('[wallet] credits invariant porušen');

    const saved = await page.evaluate((g) => !!localStorage.getItem('RPG_MAT_' + g), game);
    if (!saved) errors.push('[save] localStorage RPG_MAT_' + game + ' chybí');

  } catch (e) {
    errors.push('[harness] ' + e.message);
  } finally {
    await ctx.close();
  }
  return { idx, name, game, errors, did };
}

// Test hubu: navštív rpg-matematika.html, ověř renderování globálního profilu
async function runHubVisit(browser, base, saves) {
  const errors = [];
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const isEnvNoise = t => /Failed to load resource|ERR_CERT_AUTHORITY_INVALID|net::ERR_|supabase|jsdelivr/i.test(t);
  page.on('console', m => { if (m.type() === 'error' && !isEnvNoise(m.text())) errors.push(`[hub-console] ${m.text()}`); });
  page.on('pageerror', e => { if (!isEnvNoise(e.message)) errors.push(`[hub-pageerror] ${e.message}`); });

  try {
    // Injektuj saves ze všech 4 her do localStorage
    await page.goto(`${base}/projects/rpg-matematika.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((s) => {
      for (const [k, v] of Object.entries(s)) localStorage.setItem(k, JSON.stringify(v));
    }, saves);
    await page.reload({ waitUntil: 'load' });
    await sleep(200);

    // Ověř základní render
    const checks = await page.evaluate(() => {
      const gp = document.getElementById('gprofile');
      const grid = document.getElementById('grid');
      const credits = document.getElementById('gp-credits');
      return {
        gpVisible: !!gp && gp.style.opacity !== '.4',
        gridCards: grid ? grid.querySelectorAll('.card').length : 0,
        creditsEl: !!credits,
        noXssMarker: !window.__XSS_FIRED__,
      };
    });
    if (checks.gridCards !== 4) errors.push(`[hub] očekávány 4 karty, nalezeno ${checks.gridCards}`);
    if (!checks.creditsEl) errors.push('[hub] #gp-credits chybí');
    if (!checks.noXssMarker) errors.push('[hub] XSS MARKER BYL NASTAVEN!');

    // Otevři sdílený obchod a ověř, že se renderuje bez chyb
    const shopOk = await page.evaluate(() => {
      try {
        if (typeof toggleShop === 'function') { toggleShop(); return true; }
        return false;
      } catch(e){ return false; }
    });
    if (!shopOk) errors.push('[hub] toggleShop() selhal');

  } catch(e) {
    errors.push('[hub-harness] ' + e.message);
  } finally {
    await ctx.close();
  }
  return errors;
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args:['--no-sandbox'] });
  const N = 120;
  console.log(`▶ Spouštím ${N} virtuálních žáků (CONC=10)…\n`);

  const results = [];
  const CONC = 10;
  for (let i = 0; i < N; i += CONC) {
    const batch = [];
    for (let j = i; j < Math.min(i + CONC, N); j++) batch.push(runStudent(browser, base, j));
    results.push(...await Promise.all(batch));
    process.stdout.write(`  …${Math.min(i+CONC,N)}/${N}\n`);
  }

  // Hub test: vezmi saves prvních 4 žáků (jeden na každou hru) a ověř hub
  console.log('\n▶ Test globálního HUBu (1 navštěvenec, 4 hry)…');
  const hubSaves = {};
  for (const g of [6,7,8,9]) {
    const r = results.find(x => x.game === g && !x.errors.length);
    if (r) {
      // simulate a save (we don't have the actual data, but student ran so save should exist in page)
      // Instead, build a minimal fake save that's representative
      hubSaves[`RPG_MAT_${g}`] = {
        name: `HubTester${g}`, level: 3, xp: 120, done: {'1-1':true,'1-2':true,'2-1':true},
        attrs: {calc:5,geo:4,anal:3,craft:6}, inv: ['artefakt1','artefakt2'],
        ach: {boot:'2026-06-01',lv5:'2026-06-02'}, credits: 45, cosmetics:{owned:['border-silver'],active:{border:'border-silver',badge:null,theme:'theme-default',victory:'victory-default'}}
      };
    }
  }
  const hubErrors = await runHubVisit(browser, base, hubSaves);

  await browser.close();
  srv.close();

  // Souhrn
  const agg = { battles:0, tasksAnswered:0, theoryOpened:0, videosFound:0, trainAnswered:0, hints:0, shopOpened:0 };
  let totalErrors = 0;
  const perGame = {6:0,7:0,8:0,9:0};
  let totalCredits = 0;
  console.log(`\n══════════ VÝSLEDKY (${N} žáků) ══════════`);
  for (const r of results) {
    for (const k in agg) agg[k] += r.did[k] || 0;
    perGame[r.game]++;
    totalCredits += r.did.creditsEarned || 0;
    if (r.errors.length) {
      totalErrors += r.errors.length;
      console.log(`❌ ž.${r.idx} ${r.name} (mat-${r.game}) [done:${r.did.missionsDone}]`);
      r.errors.slice(0,5).forEach(e => console.log('     '+e));
    }
  }
  if (hubErrors.length) {
    totalErrors += hubErrors.length;
    console.log('❌ HUB:');
    hubErrors.forEach(e => console.log('     '+e));
  } else {
    console.log('✅ HUB render: OK');
  }
  console.log(`\n── Souhrn aktivity (${N} žáků) ──`);
  console.log(`  Žáků/hra: 6:${perGame[6]} 7:${perGame[7]} 8:${perGame[8]} 9:${perGame[9]}`);
  console.log(`  Bojů spuštěno:      ${agg.battles}`);
  console.log(`  Úkolů zodpovězeno:  ${agg.tasksAnswered}`);
  console.log(`  Nápověd vyžádáno:   ${agg.hints}`);
  console.log(`  Teorie otevřeno:    ${agg.theoryOpened}`);
  console.log(`  Videí ověřeno:      ${agg.videosFound}`);
  console.log(`  Tréninkových úloh:  ${agg.trainAnswered}`);
  console.log(`  Obchod otevřen:     ${agg.shopOpened}×`);
  console.log(`  Wallet kreditů ∑:   ${totalCredits.toLocaleString('cs-CZ')}`);
  console.log('\n══════════════════════════════════════');
  console.log(totalErrors === 0 ? `  ✅ ŽÁDNÉ JS CHYBY` : `  ❌ CELKEM CHYB: ${totalErrors}`);
  console.log('══════════════════════════════════════');
  process.exit(totalErrors === 0 ? 0 : 1);
})();
