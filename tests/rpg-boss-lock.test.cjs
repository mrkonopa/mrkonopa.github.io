/* ══════════════════════════════════════════════════════════════════
   Regrese: (1) po porážce bosse je VŠECHEN vstup trvale zamčený
   (útok, input, MC, ANO/NE, nápověda) a submitAnswer/submitMC nic
   nedělají; (2) MC volby obsahují opačné znaménko u úloh se zápornými
   čísly — tam je to TA typická chyba — a jinde žádnou zápornou volbu
   (dřív i u „Kolik litrů…", v 6. ročníku u 99,9 % úloh, kde se
   záporná čísla ještě neučí); (3) jediná nápověda — tlačítko se po
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
 const handled=await page.evaluate(async()=>{
  const chips=[...document.querySelectorAll('#bt-prob .tto-chip:not(.done)')];
  if(chips.length>0){
   const mt=window.BT&&BT.mini&&BT.mini[BT.idx];
   if(!mt||!mt.data){
    if(typeof battleMiniDone==='function'&&!BT.bossDefeated&&BT.hp>0){BT.miniStarting=false;battleMiniDone(0);}
    return true;
   }
   const sorted=[...mt.data].sort((a,b)=>mt.desc?(b.v-a.v):(a.v-b.v));
   // čip ukazuje ZOBRAZENÝ tvar (minus „−“, desetinná čárka), ne surový popisek z dat
   const zob=x=>window.RPGTaskTypes&&RPGTaskTypes.zobraz?String(RPGTaskTypes.zobraz(x)):String(x);
   for(const d of sorted){
    let chip=null;const t1=Date.now();
    while(!chip&&Date.now()-t1<500){
     chip=[...document.querySelectorAll('#bt-prob .tto-chip:not(.done)')]
       .find(c=>c.textContent.trim()===zob(d.label).trim());
     if(!chip)await new Promise(r=>setTimeout(r,50));
    }
    if(chip)chip.click();
    await new Promise(r=>setTimeout(r,100));
   }
   await new Promise(r=>setTimeout(r,300));
   return true;
  }
  const qBtns=[...document.querySelectorAll('#bt-prob .ttm-q:not(.done)')];
  if(qBtns.length>0){
   const zob=x=>window.RPGTaskTypes&&RPGTaskTypes.zobraz?String(RPGTaskTypes.zobraz(x)):String(x);
   for(const q of qBtns){
    q.click();await new Promise(r=>setTimeout(r,80));
    const ans=q.dataset.a;
    const a=[...document.querySelectorAll('#bt-prob .ttm-a:not(.done)')]
      .find(b=>b.textContent.trim()===zob(ans).trim()||b.textContent.trim()===String(ans).trim());
    if(a)a.click();
    await new Promise(r=>setTimeout(r,120));
   }
   await new Promise(r=>setTimeout(r,300));
   return true;
  }
  return false;
 });
 if(handled)return;
 await page.evaluate(()=>{
  const t=BT.curTask;
  if(!t||t.ans==null)return;
  const a=String(t.ans);if(!a.trim())return;
  if(BT.mcMode){
   const btns=[...document.querySelectorAll('#mc-grid .mc-btn')];
   // tlačítko píše minus jako „−“ (zapis() v rpg-shared.js), odpověď v bance „-“
   const target=btns.find(b=>b.textContent.replace(/^[A-D]/,'').replace(/−/g,'-')===a);
   if(target)target.click();else if(btns[0])submitMC(a,btns[0]);
  }else if(/^(ANO|NE)$/i.test(a.trim())){
   answerYN(a.toUpperCase());
  }else{
   const inp=document.getElementById('bt-ans');
   if(inp){inp.disabled=false;inp.value=a;submitAnswer();}
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
   let maxIter=tot*6;
   while(maxIter-->0){
    const st0=await page.evaluate(()=>({done:Object.keys(S.done).length,defeated:BT.bossDefeated}));
    if(st0.defeated)break;
    await answerCorrect(page);
    await page.waitForFunction(()=>document.getElementById('next-btn').style.display!=='none'||BT.bossDefeated,{timeout:6000}).catch(()=>{});
    const st=await page.evaluate(()=>({
     defeated:BT.bossDefeated,done:Object.keys(S.done).length,
     nextShown:document.getElementById('next-btn').style.display!=='none'
    }));
    if(st.defeated)break;
    if(st.nextShown){await page.evaluate(()=>nextTask());await page.waitForTimeout(350);}
    else if(st.done===st0.done){await page.waitForTimeout(500);}
   }
   await page.waitForTimeout(400);
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

  // ── 3) MC volby: opačné znaménko u úloh se zápornými čísly vždy, jinde žádná záporná volba ──
  {
   const mc=await page.evaluate(()=>{
    const res={zaporna:0,kontext:0,bezne:0,checked:0};
    for(let it=0;it<90;it++){
     const k=(it%7)+2, typ=it%3;
     const fake=typ===0?{text:'Vypočítej: '+k+' − '+(2*k)+' = ?',ans:String(-k)}
      :typ===1?{text:'Vypočítej: (−'+(k+3)+') + '+(2*k+3)+' = ?',ans:String(k)}
      :{text:'Kolik litrů se vejde do nádrže?',ans:String(k)};
     fake.hints=['x'];fake.skill='calc';
     renderMC(fake);
     // „−“ na tlačítku zpět na „-“: jinak by parseFloat dal NaN a kontrola záporných voleb oslepla
     const opts=[...document.querySelectorAll('#mc-grid .mc-btn')].map(b=>b.textContent.replace(/^[A-D]/,'').replace(/−/g,'-'));
     const cn=parseFloat(fake.ans);
     res.checked++;
     if(typ===0&&!opts.includes(String(-cn)))res.zaporna++;
     if(typ===1&&!opts.includes(String(-cn)))res.kontext++;
     if(typ===2&&opts.some(o=>parseFloat(o)<0))res.bezne++;
    }
    return res;
   });
   ok(mc.zaporna===0,`g${g} MC: záporná odpověď ⇒ opačné znaménko je mezi volbami (chybí ${mc.zaporna}× z ${mc.checked/3})`);
   ok(mc.kontext===0,`g${g} MC: úloha se zápornými čísly ⇒ opačné znaménko je mezi volbami (chybí ${mc.kontext}× z ${mc.checked/3})`);
   ok(mc.bezne===0,`g${g} MC: úloha bez záporných čísel nemá zápornou volbu (${mc.bezne}× z ${mc.checked/3})`);
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
