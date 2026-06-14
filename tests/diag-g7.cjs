const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = '/home/user/mrkonopa.github.io';
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}
const SEED = {name:'TEST',xp:0,level:1,attrs:{calc:0,geo:0,anal:0,craft:0},done:{},inv:[]};
async function answerCorrect(page){
 const handled=await page.evaluate(async()=>{
  const chips=[...document.querySelectorAll('#bt-prob .tto-chip:not(.done)')];
  if(chips.length>0){
   const mt=window.BT&&BT.mini&&BT.mini[BT.idx];
   if(!mt||!mt.data)return {r:'chips-no-mt',idx:BT.idx,mini:JSON.stringify(BT.mini).substring(0,400),miniAtIdx:String(BT.mini[BT.idx]),miniStarting:BT.miniStarting};
   const sorted=[...mt.data].sort((a,b)=>mt.desc?(b.v-a.v):(a.v-b.v));
   for(const d of sorted){
    let chip=null;const t1=Date.now();
    while(!chip&&Date.now()-t1<500){
     chip=[...document.querySelectorAll('#bt-prob .tto-chip:not(.done)')].find(c=>c.textContent.trim()===d.label.trim());
     if(!chip)await new Promise(r=>setTimeout(r,50));
    }
    if(chip)chip.click();
    await new Promise(r=>setTimeout(r,100));
   }
   await new Promise(r=>setTimeout(r,300));
   return {r:'chips-done'};
  }
  const qBtns=[...document.querySelectorAll('#bt-prob .ttm-q:not(.done)')];
  if(qBtns.length>0){
   for(const q of qBtns){
    q.click();await new Promise(r=>setTimeout(r,80));
    const ans=q.dataset.a;
    const a=[...document.querySelectorAll('#bt-prob .ttm-a:not(.done)')].find(b=>b.textContent.trim()===String(ans).trim());
    if(a)a.click();
    await new Promise(r=>setTimeout(r,120));
   }
   await new Promise(r=>setTimeout(r,300));
   return {r:'match-done'};
  }
  return {r:'no-mini'};
 });
 console.log('[mini-result]',JSON.stringify(handled));
 if(handled&&handled.r==='no-mini'){
  await page.evaluate(()=>{
   const t=BT.curTask; if(!t||t.ans==null)return;
   const a=String(t.ans); if(!a.trim())return;
   const inp=document.getElementById('bt-ans');
   if(inp){inp.disabled=false;inp.value=a;submitAnswer();}
  });
 }
}
(async()=>{
 const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({executablePath:EXEC});
 const ctx=await browser.newContext({viewport:{width:480,height:900}});
 const page=await ctx.newPage();
 page.on('pageerror',e=>console.log('[js-err]',e.message));
 await page.addInitScript((seed)=>{localStorage.setItem('RPG_MAT_7',JSON.stringify(seed));},SEED);
 await page.goto(base+'/projects/rpg-mat-7.html',{waitUntil:'load'});
 await page.waitForFunction(()=>typeof AREAS!=='undefined'&&typeof launchBattle==='function',{timeout:8000});
 await page.evaluate((seed)=>{localStorage.setItem(SAVE_KEY,JSON.stringify(seed));},SEED).catch(()=>{});
 await page.evaluate(()=>{S.done={};S.xpClaimed=S.xpClaimed||{};});
 const {aid, mid} = await page.evaluate(()=>{
  const ar=AREAS[0]; const m=ar.missions.find(x=>!x.mc)||ar.missions[0];
  return {aid:ar.id,mid:m.id};
 });
 await page.evaluate(({a,m})=>launchBattle(a,m), {a:aid,m:mid});
 await page.waitForFunction(()=>document.querySelector('#s-battle').classList.contains('active'),{timeout:5000});
 await page.waitForTimeout(900);
 
 const tot=await page.evaluate(()=>BT.tasks.length);
 let maxIter=tot*6;
 while(maxIter-->0){
  const st0=await page.evaluate(()=>({done:Object.keys(S.done).length,defeated:BT.bossDefeated}));
  if(st0.defeated)break;
  await answerCorrect(page);
  const resolved=await page.waitForFunction(()=>document.getElementById('next-btn').style.display!=='none'||BT.bossDefeated,{timeout:3000}).then(()=>true).catch(()=>false);
  const st=await page.evaluate(()=>({defeated:BT.bossDefeated,done:Object.keys(S.done).length,nextShown:document.getElementById('next-btn').style.display!=='none',idx:BT.idx}));
  console.log('[iter] resolved='+resolved+' done='+st.done+'/'+tot+' idx='+st.idx+' defeated='+st.defeated+' nextShown='+st.nextShown);
  if(st.defeated)break;
  if(st.nextShown){await page.evaluate(()=>nextTask());await page.waitForTimeout(300);}
  else if(st.done===st0.done){await page.waitForTimeout(200);}
 }
 const final=await page.evaluate(()=>({defeated:BT.bossDefeated,done:Object.keys(S.done).length}));
 console.log('[final]',JSON.stringify(final));
 await browser.close(); srv.close();
})().catch(e=>{console.error(e);process.exit(1);});
