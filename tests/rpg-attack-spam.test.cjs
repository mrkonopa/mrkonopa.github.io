/* ══════════════════════════════════════════════════════════════════
   Regrese: NEKONEČNÉ SPAMOVÁNÍ ÚTOKU (gamebreaking exploit).
   Žák po správné odpovědi opakovaně klikal na ÚTOK a farmil kredity/XP.
   Tento test hlídá ve VŠECH 4 hrách dvě nezávislé pojistky:
     (A) po správné odpovědi je tlačítko ÚTOK (#attack-btn) i input
         OKAMŽITĚ zamčené — vektor (klikatelné tlačítko) je uzavřen;
     (B) i kdyby útočník tlačítko/input násilím odemkl a submitAnswer()
         zavolal znovu na TÉŽE úloze, NEZÍSKÁ žádné další kredity ani XP
         (gate `firstTime` přes S.xpClaimed drží).
   Spusť: node tests/rpg-attack-spam.test.cjs
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
  await page.waitForFunction(()=>typeof AREAS!=='undefined'&&typeof launchBattle==='function'&&typeof _walletBal==='function',{timeout:8000});
  await page.evaluate(()=>{S.done={};S.xpClaimed=S.xpClaimed||{};continueGame?continueGame():startGame&&startGame();}).catch(()=>{});

  // Najdi non-MC misi a uvnitř ní obyčejnou textovou úlohu (ne minihra, ne ANO/NE).
  await page.evaluate(()=>{const ar=AREAS.find(a=>a.missions.some(m=>!m.mc));const m=ar.missions.find(m=>!m.mc);launchBattle(ar.id,m.id);});
  await page.waitForFunction(()=>document.querySelector('#s-battle').classList.contains('active'),{timeout:5000});
  await page.waitForTimeout(600);

  const found=await page.evaluate(()=>{
   for(let i=0;i<BT.tasks.length;i++){
    if(S.done[BT.mid+'-'+i])continue;
    const t=BT.tasks[i];
    if(/^(ano|ne)$/i.test(String(t.ans||'').trim()))continue;      // přeskoč ANO/NE
    const mt=(typeof miniForIdx==='function')?miniForIdx(i):null;   // přeskoč minihry
    if(mt)continue;
    if(t.ans==null||!String(t.ans).trim())continue;
    BT.idx=i; renderTask();
    return {idx:i, inputShown:document.getElementById('bt-input-row').style.display!=='none'};
   }
   return null;
  });
  ok(found&&found.inputShown,`g${g} našel textovou úlohu k otestování`);
  if(!found){await ctx.close();continue;}

  // (A) Správná odpověď → útok i input se OKAMŽITĚ zamknou.
  const afterCorrect=await page.evaluate(()=>{
   const before={xp:S.xp, cr:_walletBal()};
   document.getElementById('bt-ans').disabled=false;
   document.getElementById('bt-ans').value=String(BT.curTask.ans);
   submitAnswer();
   return {
    before,
    xp:S.xp, cr:_walletBal(),
    atkDis:(document.getElementById('attack-btn')||{disabled:false}).disabled,
    ansDis:document.getElementById('bt-ans').disabled,
    nextShown:document.getElementById('next-btn').style.display!=='none',
   };
  });
  ok(afterCorrect.atkDis===true,`g${g} ÚTOK zamčený hned po správné odpovědi`);
  ok(afterCorrect.ansDis===true,`g${g} input zamčený hned po správné odpovědi`);
  ok(afterCorrect.nextShown===true,`g${g} tlačítko DALŠÍ se zobrazilo (Enter pokračuje, neútočí)`);
  const gainedCr=afterCorrect.cr-afterCorrect.before.cr;
  ok(gainedCr>0,`g${g} jednorázová odměna připsána (+${gainedCr} kr)`);

  // (B) Násilné odemčení + 6× re-submit téže úlohy → ŽÁDNÝ další zisk.
  const afterSpam=await page.evaluate(()=>{
   for(let k=0;k<6;k++){
    document.getElementById('attack-btn').disabled=false;
    document.getElementById('bt-ans').disabled=false;
    document.getElementById('bt-ans').value=String(BT.curTask.ans);
    submitAnswer();
   }
   return {xp:S.xp, cr:_walletBal()};
  });
  ok(afterSpam.xp===afterCorrect.xp,`g${g} spam útoku NEDÁ další XP (${afterCorrect.xp}→${afterSpam.xp})`);
  ok(afterSpam.cr===afterCorrect.cr,`g${g} spam útoku NEDÁ další kredity (${afterCorrect.cr}→${afterSpam.cr})`);

  ok(errs.length===0,`g${g} žádné JS chyby (${errs.slice(0,2).join(' | ')})`);
  await ctx.close();
 }

 await browser.close(); srv.close();
 console.log(`\n══════════════════════════════════════════`);
 console.log(`  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
 console.log('══════════════════════════════════════════');
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
