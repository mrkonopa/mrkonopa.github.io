/* ══════════════════════════════════════════════════════════════════
   Regrese — Issue #104: ANO/NE tlačítka mrtvá po výhře předchozí mise.
   checkMissionComplete() po splnění mise vypne #yn-row tlačítka. Pokud
   je PRVNÍ úloha další mise typu ANO/NE, zůstala dřív zamčená a žák
   musel reloadovat stránku. renderTask() je teď znovu odemyká.
   Tento test simuluje přesně tu situaci ve VŠECH 4 hrách:
     1) zamkne #yn-row (jako po výhře mise),
     2) nechá renderTask vykreslit ANO/NE úlohu,
     3) ověří, že jsou tlačítka opět klikatelná a klik se zaregistruje.
   Spusť: node tests/rpg-yn-reenable.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
let pass=0, fail=0; const ok=(c,m)=>{c?(pass++,console.log('  ✅ '+m)):(fail++,console.log('  ❌ '+m));};

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}

const SEED = {name:'TEST',xp:0,level:1,attrs:{calc:0,geo:0,anal:0,craft:0},done:{},inv:[]};

(async()=>{
 const srv=await serve(); const base=`http://127.0.0.1:${srv.address().port}`;
 const browser=await chromium.launch({executablePath:EXEC});

 for(const g of [6,7,8,9]){
  console.log(`\n── rpg-mat-${g} ──`);
  const ctx=await browser.newContext({viewport:{width:480,height:900}});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.addInitScript((seed)=>{localStorage.setItem('RPG_MAT_'+document.title.match(/\d/),JSON.stringify(seed));},SEED);
  await page.goto(`${base}/projects/rpg-mat-${g}.html`,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof AREAS!=='undefined'&&typeof launchBattle==='function'&&typeof renderTask==='function',{timeout:8000});
  await page.evaluate(()=>{S.done={};S.xpClaimed=S.xpClaimed||{};continueGame?continueGame():startGame&&startGame();}).catch(()=>{});

  await page.evaluate(()=>{const ar=AREAS.find(a=>a.missions.some(m=>!m.mc));const m=ar.missions.find(m=>!m.mc);launchBattle(ar.id,m.id);});
  await page.waitForFunction(()=>document.querySelector('#s-battle').classList.contains('active'),{timeout:5000});
  await page.waitForTimeout(500);

  const r=await page.evaluate(()=>{
   // 1) simuluj stav po výhře předchozí mise: ANO/NE tlačítka zamčená
   document.querySelectorAll('#yn-row button').forEach(b=>b.disabled=true);
   const wasDisabled=[...document.querySelectorAll('#yn-row button')].every(b=>b.disabled);
   // 2) vynuť ANO/NE úlohu na aktuálním indexu (žádná minihra)
   BT.mini=BT.mini||{}; BT.mini[BT.idx]=0;
   BT.mcMode=false;
   delete S.done[BT.mid+'-'+BT.idx];
   BT.tasks[BT.idx]={text:'Je trojúhelník 3,4,5 pravoúhlý?\n(napiš ANO nebo NE)',ans:'ANO',hints:['Pythagoras'],skill:'calc'};
   renderTask();
   // 3) stav po renderTask
   const ynShown=document.getElementById('yn-row').style.display!=='none';
   const btnsEnabled=[...document.querySelectorAll('#yn-row button')].every(b=>!b.disabled);
   // 4) klik na ANO se zaregistruje (úloha se splní)
   const doneBefore=!!S.done[BT.mid+'-'+BT.idx];
   if(typeof answerYN==='function')answerYN('ANO');
   const doneAfter=!!S.done[BT.mid+'-'+BT.idx];
   return {wasDisabled,ynShown,btnsEnabled,doneBefore,doneAfter};
  });
  ok(r.wasDisabled,`g${g} výchozí stav: ANO/NE zamčené (po výhře mise)`);
  ok(r.ynShown,`g${g} renderTask zobrazil ANO/NE řádek pro YN úlohu`);
  ok(r.btnsEnabled,`g${g} ANO/NE tlačítka znovu odemčená v renderTask (#104 fix)`);
  ok(!r.doneBefore&&r.doneAfter,`g${g} klik na ANO se zaregistroval (úloha splněna)`);
  ok(errs.length===0,`g${g} žádné JS chyby (${errs.slice(0,2).join(' | ')})`);
  await ctx.close();
 }

 await browser.close(); srv.close();
 console.log(`\n══════════════════════════════════════════`);
 console.log(`  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
 console.log('══════════════════════════════════════════');
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
