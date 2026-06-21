/* ══════════════════════════════════════════════════════════════════
   Test: živý souboj — pozvánky (rpg-battle-ui.js)
   • Žák vidí čekající pozvánku v menu a připojí se kliknutím
   • Pozvánka pro jiný ročník (game) se nezobrazí
   • Host v čekárně pozve spolužáka e-mailem (invite_battle_email)
   • Neplatný e-mail se neodešle
   Mock RPGCloud (žádné Supabase CDN). Chromium headless.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const UI = fs.readFileSync(path.join(__dirname, '..', 'projects', 'rpg-battle-ui.js'), 'utf8');

let pass = 0, fail = 0;
function ok(c, m){ if(c){pass++;console.log('  ✅ '+m);} else {fail++;console.log('  ❌ '+m);} }

const MOCK = `
window.__calls = { join: [], invite: [] };
window.__cfg = {};
window.RPG_BATTLE_9 = { build: function(seed,count){ var a=[]; for(var i=0;i<count;i++) a.push({text:'Q'+i,choices:['1','2','3','4'],correct:0}); return a; } };
window.RPGCloud = {
  currentUser: function(){ return { id:'u-self', email:'vojta@husovaliberec.cz' }; },
  isStaff: function(){ return false; },
  myBattleInvites: function(){ return Promise.resolve(window.__cfg.invites || []); },
  joinBattle: function(code,name){ window.__calls.join.push([code,name]); return Promise.resolve(window.__cfg.joinResult || null); },
  inviteBattleEmail: function(id,email){ window.__calls.invite.push([id,email]); return Promise.resolve(window.__cfg.inviteOk !== false); },
  createBattle: function(game,count,name){ return Promise.resolve(window.__cfg.createResult || null); },
  pollBattle: function(id,cb){ setTimeout(function(){ if(window.__cfg.state) cb(window.__cfg.state); }, 0); return function(){}; },
  advanceBattle: function(){}, submitBattleAnswer: function(){},
  setBattleStatus: function(){ return Promise.resolve(); }
};
`;

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC });
  const page = await browser.newPage();
  page.on('pageerror', e => { fail++; console.log('  ❌ JS error: ' + e.message); });
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ content: MOCK });
  await page.addScriptTag({ content: UI });

  const BANK = { _: 1 }; // open() bere bank z opts; použijeme RPG_BATTLE_9 přes GAME
  const openMenu = async (invites) => {
    await page.evaluate((inv) => {
      window.__cfg = { invites: inv };
      window.__calls = { join: [], invite: [] };
      window.RPGBattle.open({ game: 'RPG_MAT_9', name: 'Vojta' });
    }, invites);
  };

  // ── A: pozvánka pro tento ročník se zobrazí ──────────────────────
  await openMenu([{ id:'i1', code:'ABCD', host_name:'Karel', game:'RPG_MAT_9', status:'lobby' }]);
  await page.waitForFunction(() => /Máš pozvánku/.test(document.getElementById('rpgb-invites')?.textContent || ''), { timeout: 3000 }).catch(()=>{});
  const invHtml = await page.evaluate(() => document.getElementById('rpgb-invites').innerHTML);
  ok(/Máš pozvánku/.test(invHtml), 'menu ukáže box s pozvánkou');
  ok(/ABCD/.test(invHtml) && /Karel/.test(invHtml), 'pozvánka obsahuje kód i jméno hosta');

  // ── B: klik na pozvánku připojí daným kódem ──────────────────────
  await page.evaluate(() => { window.__cfg.joinResult = { id:'b1', code:'ABCD' }; window.__cfg.state = { battle:{ status:'lobby', q_count:5 }, players:[{user_id:'u-self',display_name:'Vojta'}], me:'u-self' }; });
  await page.click('#rpgb-invites button.invite');
  await page.waitForTimeout(50);
  const joinCalls = await page.evaluate(() => window.__calls.join);
  ok(joinCalls.length === 1 && joinCalls[0][0] === 'ABCD', 'klik na pozvánku zavolá joinBattle("ABCD")');

  // ── C: pozvánka pro jiný ročník se NEzobrazí ─────────────────────
  await openMenu([{ id:'i2', code:'WXYZ', host_name:'Eva', game:'RPG_MAT_8', status:'lobby' }]);
  await page.waitForTimeout(80);
  const invHtml2 = await page.evaluate(() => document.getElementById('rpgb-invites').innerHTML);
  ok(invHtml2 === '' , 'pozvánka z jiného ročníku (RPG_MAT_8) je odfiltrovaná');

  // ── D: host v čekárně — formulář pozvánky + odeslání ─────────────
  await page.evaluate(() => {
    window.__cfg = { createResult: { id:'b9', code:'QWER' }, state: { battle:{ status:'lobby', q_count:5 }, players:[{user_id:'u-self',display_name:'Vojta'}], me:'u-self' } };
    window.__calls = { join: [], invite: [] };
    window.RPGBattle.open({ game:'RPG_MAT_9', name:'Vojta' });
    window.RPGBattle._create(5);
  });
  await page.waitForSelector('#rpgb-invmail', { timeout: 3000 });
  ok(true, 'host čekárna ukáže pole pro pozvání e-mailem');
  await page.fill('#rpgb-invmail', 'zak@husovaliberec.cz');
  await page.click('button[onclick="RPGBattle._invite()"]');
  await page.waitForFunction(() => /odeslána/.test(document.getElementById('rpgb-invmsg')?.textContent || ''), { timeout: 3000 }).catch(()=>{});
  const inviteCalls = await page.evaluate(() => window.__calls.invite);
  ok(inviteCalls.length === 1 && inviteCalls[0][0] === 'b9' && inviteCalls[0][1] === 'zak@husovaliberec.cz', 'Pozvat zavolá inviteBattleEmail(battleId, email)');
  const msg = await page.evaluate(() => document.getElementById('rpgb-invmsg').textContent);
  ok(/✓/.test(msg), 'po odeslání se ukáže potvrzení');

  // ── E: neplatný e-mail se neodešle ───────────────────────────────
  await page.evaluate(() => { window.__calls.invite = []; });
  await page.fill('#rpgb-invmail', 'neplatny-email');
  await page.click('button[onclick="RPGBattle._invite()"]');
  await page.waitForTimeout(60);
  const inviteCalls2 = await page.evaluate(() => window.__calls.invite);
  ok(inviteCalls2.length === 0, 'neplatný e-mail neodešle pozvánku');

  await browser.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: ' + pass + ' ✅  /  ' + fail + ' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
