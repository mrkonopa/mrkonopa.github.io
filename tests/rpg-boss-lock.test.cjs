/* ══════════════════════════════════════════════════════════════════
   Regrese: (1) po porážce bosse je VŠECHEN vstup trvale zamčený
   (útok, input, MC, ANO/NE, nápověda) a submitAnswer/submitMC nic
   nedělají; (2) MC distraktory obsahují i opačné znaménko, když je
   správná odpověď nenulová; (3) jediná nápověda — tlačítko se po
   použití vypne a text neprozrazuje výsledek.
   Spusť: node tests/rpg-boss-lock.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
let pass=0, fail=0; const ok=(c,m)=>{c?(pass++,console.log('  ✅ '+m)):(fail++,console.log('  ❌ '+m));};

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}

const SEED = {name:'TEST',xp:0,level:1,attrs:{calc:0,geo:0,anal:0,craft:0},done:{},inv:[]};

async function answerCorrect(page){
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
 const srv=await serve(); const base=`http://127.0.0.1:${srv.address().port}`;
 const browser=await chromium.launch({executablePath:EXEC});

 for(const g of [6,7,8,9]){
  console.log(`\n── rpg-mat-${g} ──`);
  const ctx=await browser.newContext({viewport:{width:480,height:900}});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.addInitScript((seed)=>{localStorage.setItem('RPG_MAT_'+document.title.match(/\d/),JSON.stringify(seed));},SEED);
  await page.goto(`${base}/projects/rpg-mat-${g}.html`,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof AREAS!=='undefined'&&typeof launchBattle==='function',{timeout:8000});
  await page.evaluate((seed)=>{localStorage.setItem(SAVE_KEY,JSON.stringify(seed));loadS&&typeof loadS==='function';},SEED).catch(()=>{});
  await page.evaluate(()=>{S.done={};continueGame?continueGame():startGame&&startGame();}).catch(()=>{});
  await page.evaluate(()=>{S.done={};S.xpClaimed=S.xpClaimed||{};});

  // ── 1) nápověda: jediná, vypne tlačítko, neprozrazuje výsledek (ne-MC mise) ──
  await page.evaluate(()=>{const ar=AREAS.find(a=>a.missions.some(m=>!m.mc));const m=ar.missions.find(m=>!m.mc);launchBattle(ar.id,m.id);});
  await page.waitForFunction(()=>document.querySelector('#s-battle').classList.contains('active'),{timeout:5000});
  await page.waitForTimeout(600);
  {
   const h=await page.evaluate(()=>{
    showHint();
    const txt=document.getElementById('hint-box').textContent;
    const dis=document.getElementById('hint-btn').disabled;
    showHint(); // druhé volání nesmí nic změnit
    const txt2=document.getElementById('hint-box').textContent;
    return {txt,dis,same:txt===txt2,leak:txt.includes('Výsledek: '+String(BT.curTask.ans)),hl:BT.hl};
   });
   ok(h.txt.trim().length>5,`g${g} nápověda má obsah`);
   ok(h.dis,`g${g} tlačítko nápovědy se po použití vypne`);
   ok(h.same,`g${g} druhé volání showHint nic nemění`);
   ok(!h.leak,`g${g} nápověda neprozrazuje výsledek`);
   ok(h.hl===1,`g${g} BT.hl=1 po nápovědě (XP penalizace platí)`);
  }

  // ── 2) porážka bosse → vstup trvale zamčený ──
  {
   const tot=await page.evaluate(()=>BT.tasks.length);
   for(let i=0;i<tot;i++){
    await answerCorrect(page); await page.waitForTimeout(350);
    const more=await page.evaluate(()=>document.getElementById('next-btn').style.display!=='none'&&!BT.tasks.every((_,j)=>S.done[`${BT.mid}-${j}`]));
    if(more){await page.evaluate(()=>nextTask());await page.waitForTimeout(300);}
   }
   const st=await page.evaluate(()=>({
    defeated:BT.bossDefeated===true,
    ansDis:document.getElementById('bt-ans').disabled,
    hintDis:document.getElementById('hint-btn').disabled,
    atkDis:(document.getElementById('attack-btn')||{disabled:true}).disabled,
   }));
   ok(st.defeated,`g${g} BT.bossDefeated po výhře`);
   ok(st.ansDis&&st.hintDis&&st.atkDis,`g${g} input+nápověda+útok zamčené po výhře`);
   // pokus o útok po smrti bosse nesmí nic udělat (žádné XP, žádná změna)
   const xp0=await page.evaluate(()=>S.xp);
   await page.evaluate(()=>{document.getElementById('bt-ans').disabled=false;document.getElementById('bt-ans').value=String(BT.curTask.ans);submitAnswer();});
   await page.waitForTimeout(250);
   const xp1=await page.evaluate(()=>S.xp);
   ok(xp0===xp1,`g${g} submitAnswer po porážce bosse je no-op (XP ${xp0}→${xp1})`);
   await page.evaluate(()=>{try{submitMC('1',document.createElement('button'));}catch(e){window.__mcErr=e.message;}});
   const mcErr=await page.evaluate(()=>window.__mcErr||'');
   ok(mcErr==='',`g${g} submitMC po porážce bosse je no-op (bez výjimky)`);
  }

  // ── 3) MC distraktory: záporná odpověď ⇒ aspoň jedna záporná volba; opačné znaménko v nabídce ──
  {
   const mc=await page.evaluate(()=>{
    const res={negHasNeg:true,oppPresent:true,checked:0};
    for(let it=0;it<60;it++){
     const fake={ans:String((it%2?-1:1)*( (it%7)+2 )),hints:['x'],skill:'calc'};
     renderMC(fake);
     const opts=[...document.querySelectorAll('#mc-grid .mc-btn')].map(b=>b.textContent.replace(/^[A-D]/,''));
     const cn=parseFloat(fake.ans);
     res.checked++;
     if(!opts.includes(String(-cn)))res.oppPresent=false;
     if(cn<0&&!opts.some(o=>parseFloat(o)<0))res.negHasNeg=false;
    }
    return res;
   });
   ok(mc.oppPresent,`g${g} MC: opačné znaménko je vždy mezi volbami (${mc.checked}×)`);
   ok(mc.negHasNeg,`g${g} MC: záporná odpověď ⇒ záporné volby existují`);
  }

  ok(errs.length===0,`g${g} žádné JS chyby (${errs.slice(0,2).join(' | ')})`);
  await ctx.close();
 }

 await browser.close(); srv.close();
 console.log(`\n══════════════════════════════════════════`);
 console.log(`  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
 console.log('══════════════════════════════════════════');
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
