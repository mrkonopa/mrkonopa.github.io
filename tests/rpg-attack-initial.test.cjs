/* Test: utocne tlacitko a HP bary pri vstupu do boje
   1) HP bar viditelny ihned pri vstupu
   2) Input + attack-btn zamceny prvnich 700 ms (vstupni animace), pak se odemkne
   3) HP bar klesa po spravne odpovedi
   4) Po porazce bosse jsou vsechna tlacitka zamcena
   5) Re-entry: znovu zamceno behem animace, pak odemknuto
   Spust: node tests/rpg-attack-initial.test.cjs
*/
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
let pass=0, fail=0;
const ok=(c,m)=>{c?(pass++,console.log('  ✅ '+m)):(fail++,console.log('  ❌ '+m));};

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}

const SEED = {name:'TEST',xp:0,level:1,attrs:{calc:0,geo:0,anal:0,craft:0},done:{},inv:[]};

async function answerCorrect(page){
 // Run entirely inside the browser context (async evaluate) so timing is correct.
 // This is the same pattern used in rpg-battle-minigame.test.cjs.
 const handled=await page.evaluate(async()=>{
  const mt=window.BT&&BT.mini&&BT.mini[BT.idx];
  if(!mt)return false;
  // Poll for banner to clear (BT.miniStarting → false)
  const t0=Date.now();
  while(typeof BT!=='undefined'&&BT.miniStarting&&Date.now()-t0<3500)
   await new Promise(r=>setTimeout(r,80));
  if(mt.type==='order'){
   const sorted=[...mt.data].sort((a,b)=>mt.desc?(b.v-a.v):(a.v-b.v));
   for(const d of sorted){
    const chip=[...document.querySelectorAll('#bt-prob .tto-chip')].find(c=>!c.classList.contains('done')&&c.textContent===d.label);
    if(chip)chip.click();
    await new Promise(r=>setTimeout(r,80));
   }
  }else{
   const qs=[...document.querySelectorAll('#bt-prob .ttm-q')];
   for(const q of qs){
    if(q.classList.contains('done'))continue;
    q.click();
    await new Promise(r=>setTimeout(r,80));
    const ans=q.dataset.a;
    const a=[...document.querySelectorAll('#bt-prob .ttm-a:not(.done)')].find(b=>b.textContent===ans);
    if(a)a.click();
    await new Promise(r=>setTimeout(r,100));
   }
  }
  await new Promise(r=>setTimeout(r,250));
  return true;
 });
 if(handled)return;
 await page.evaluate(()=>{
  const t=BT.curTask, a=String(t.ans);
  if(BT.mcMode){
   const btns=[...document.querySelectorAll('#mc-grid .mc-btn')];
   const target=btns.find(b=>b.textContent.replace(/^[A-D]/,'')===a);
   if(target)target.click(); else submitMC(a,btns[0]);
  }else if(/^(ANO|NE)$/i.test(a.trim())){
   answerYN(a.toUpperCase());
  }else{
   document.getElementById('bt-ans').disabled=false;
   document.getElementById('bt-ans').value=a; submitAnswer();
  }
 });
}

(async()=>{
 const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({executablePath:EXEC});

 for(const g of [6,7,8,9]){
  console.log('\n-- rpg-mat-'+g+' --');
  const ctx=await browser.newContext({viewport:{width:480,height:900}});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.addInitScript((seed)=>{localStorage.setItem('RPG_MAT_'+document.title.match(/\d/),JSON.stringify(seed));},SEED);
  await page.goto(base+'/projects/rpg-mat-'+g+'.html',{waitUntil:'load'});
  await page.waitForFunction(()=>typeof AREAS!=='undefined'&&typeof launchBattle==='function',{timeout:8000});
  await page.evaluate((seed)=>{localStorage.setItem(SAVE_KEY,JSON.stringify(seed));},SEED).catch(()=>{});
  await page.evaluate(()=>{S.done={};S.xpClaimed=S.xpClaimed||{};});

  // Najdi prvni ne-MC misi
  const {aid, mid} = await page.evaluate(()=>{
   const ar=AREAS[0]; const m=ar.missions.find(x=>!x.mc)||ar.missions[0];
   return {aid:ar.id,mid:m.id};
  });

  // 1) HP bar viditelny ihned po vstupu
  await page.evaluate(({a,m})=>launchBattle(a,m), {a:aid,m:mid});
  await page.waitForFunction(()=>document.querySelector('#s-battle').classList.contains('active'),{timeout:5000});

  const hpState = await page.evaluate(()=>{
   const bar=document.getElementById('bt-hpbar');
   const playerHp=document.getElementById('player-hp');
   const barRect=bar?bar.getBoundingClientRect():null;
   const barPct=bar?parseFloat(bar.style.width||'100'):-1;
   const hearts=playerHp?playerHp.querySelectorAll('.heart:not(.lost)').length:0;
   return {barVisible:barRect&&barRect.width>0, barPct, hearts, taskLoaded:typeof BT!=='undefined'&&BT.curTask!=null};
  });
  ok(hpState.barVisible, 'g'+g+' boss HP bar viditelny ihned po vstupu ('+hpState.barPct+'%)');
  ok(hpState.barPct > 0, 'g'+g+' boss HP bar neni prazdny pri vstupu');
  ok(hpState.hearts > 0, 'g'+g+' hracska srdicky viditelna ('+hpState.hearts+')');
  ok(hpState.taskLoaded, 'g'+g+' BT.curTask nastaven pred zobrazenim tlacitek');

  // 2) Vstupni lock: input + attack-btn zamceny prvnich 700 ms
  const lockedDuringAnim = await page.evaluate(()=>{
   const inpEl=document.getElementById('bt-ans');
   const atkEl=document.getElementById('attack-btn');
   return {ansDis:inpEl?inpEl.disabled:null, atkDis:atkEl?atkEl.disabled:null};
  });
  ok(lockedDuringAnim.ansDis===true, 'g'+g+' input zamceny behem vstupni animace');
  ok(lockedDuringAnim.atkDis!==false, 'g'+g+' attack-btn zamceny nebo neexistuje behem vstupni animace');

  // Pockej na odemceni
  await page.waitForTimeout(820);
  const unlocked = await page.evaluate(()=>{
   const inpEl=document.getElementById('bt-ans');
   return inpEl?!inpEl.disabled:false;
  });
  ok(unlocked, 'g'+g+' input se odemkne po 700 ms');

  // 3) HP bar klesa po spravne odpovedi
  const hpBefore = await page.evaluate(()=>parseFloat(document.getElementById('bt-hpbar').style.width||'100'));
  await answerCorrect(page);
  // Wait until HP bar actually changes (minigame banner = 1.5 s delay, so can't use fixed timeout)
  await page.waitForFunction((before)=>parseFloat(document.getElementById('bt-hpbar').style.width||'100')<before,hpBefore,{timeout:5000}).catch(()=>{});
  const hpAfter = await page.evaluate(()=>parseFloat(document.getElementById('bt-hpbar').style.width||'100'));
  ok(hpAfter < hpBefore, 'g'+g+' boss HP bar klesa po spravne odpovedi ('+hpBefore+'% -> '+hpAfter+'%)');

  // 4) Dokonci misi — spust znovu s cistym S.done, pockej na lock
  await page.evaluate(()=>{S.done={};});
  await page.evaluate(({a,m})=>launchBattle(a,m), {a:aid,m:mid});
  await page.waitForFunction(()=>document.querySelector('#s-battle').classList.contains('active'),{timeout:5000});
  await page.waitForTimeout(850); // vstupni lock

  const tot=await page.evaluate(()=>BT.tasks.length);
  for(let i=0;i<tot;i++){
   await answerCorrect(page);
   // Wait for next-btn to appear (minigames may need extra time after chip clicks)
   await page.waitForFunction(()=>document.getElementById('next-btn').style.display!=='none'||BT.bossDefeated,{timeout:5000}).catch(()=>{});
   const more=await page.evaluate(()=>document.getElementById('next-btn').style.display!=='none');
   if(more&&i<tot-1){await page.evaluate(()=>nextTask());await page.waitForTimeout(350);}
  }
  await page.waitForTimeout(600);

  const defeatedLocked = await page.evaluate(()=>({
   defeated:BT.bossDefeated===true,
   ansDis:document.getElementById('bt-ans')?document.getElementById('bt-ans').disabled:true,
   hintDis:document.getElementById('hint-btn')?document.getElementById('hint-btn').disabled:true,
   atkDis:(document.getElementById('attack-btn')||{disabled:true}).disabled,
  }));
  ok(defeatedLocked.defeated, 'g'+g+' BT.bossDefeated=true po vyhre');
  ok(defeatedLocked.ansDis&&defeatedLocked.hintDis&&defeatedLocked.atkDis,
     'g'+g+' vsechna tlacitka zamcena po vyhre (ans='+defeatedLocked.ansDis+' hint='+defeatedLocked.hintDis+' atk='+defeatedLocked.atkDis+')');

  // 5) Re-entry: vstup znovu do stejne mise — behem animace opet zamceno, pak odemceno
  await page.evaluate(({a,m})=>launchBattle(a,m), {a:aid,m:mid});
  await page.waitForFunction(()=>document.querySelector('#s-battle').classList.contains('active'),{timeout:5000});
  const reentryLocked = await page.evaluate(()=>{
   const inpEl=document.getElementById('bt-ans');
   return inpEl?inpEl.disabled:null;
  });
  ok(reentryLocked===true, 'g'+g+' input zamceny i po re-vstupu (nova animace)');
  await page.waitForTimeout(850);
  const reentryState = await page.evaluate(()=>({
   defeated:BT.bossDefeated,
   ansDis:document.getElementById('bt-ans')?document.getElementById('bt-ans').disabled:null,
   taskLoaded:BT.curTask!=null,
  }));
  ok(reentryState.defeated===false, 'g'+g+' BT.bossDefeated=false po re-vstupu');
  ok(reentryState.ansDis===false, 'g'+g+' vstupni pole aktivni po re-vstupu (po 800ms)');
  ok(reentryState.taskLoaded, 'g'+g+' BT.curTask nastaven po re-vstupu');

  ok(errs.length===0, 'g'+g+' zadne JS chyby ('+errs.slice(0,2).join(' | ')+')');
  await ctx.close();
 }

 await browser.close(); srv.close();
 console.log('\n==========================================');
 console.log('  VYSLEDEK: '+pass+' OK / '+fail+' FAIL');
 console.log('==========================================');
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
