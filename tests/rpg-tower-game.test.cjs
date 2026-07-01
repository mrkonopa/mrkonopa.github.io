/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 11: věž legend — herní obrazovka (rpg-mat-6/7/8/9.html, Playwright)
   Ověřuje: bránu (practice / login / eligible), výstup (správně → patro+1,
   3× špatně → konec), časomíru, rekord v S.tower, zápis přes towerSubmit,
   žebříček+síň slávy, XSS odolnost jmen, reduced-motion (canvas statický).
   Běží přes VŠECHNY 4 ročníky (věž portovaná z 9. do 6./7./8.).
   ══════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
let pass=0, fail=0; const ok=(c,m)=>{c?(pass++,console.log('  ✅ '+m)):(fail++,console.log('  ❌ '+m));};

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}

const SEED = {name:'TEST',xp:0,level:1,attrs:{calc:0,geo:0,anal:0,craft:0},done:{},inv:[]};

async function newGame(browser, base, N){
  const KEY='RPG_MAT_'+N;
  const ctx=await browser.newContext({viewport:{width:480,height:900}});
  const page=await ctx.newPage();
  page.on('pageerror',e=>{fail++;console.log('  ❌ JS chyba: '+e.message);});
  // Pevné datum mimo prázdniny věže (červenec/srpen), aby test běžel deterministicky
  // bez ohledu na skutečné datum — jinak by v létě byla věž zavřená (prázdninový úklid).
  await page.addInitScript(()=>{window.__TW_TESTNOW='2026-05-15T10:00:00';});
  await page.addInitScript(({key,seed})=>{localStorage.setItem(key,JSON.stringify(seed));},{key:KEY,seed:SEED});
  await page.goto(`${base}/projects/rpg-mat-${N}.html`,{waitUntil:'load'});
  await page.evaluate(()=>continueGame());
  return {ctx,page};
}
async function answerCurrent(page, correct){
  await page.evaluate((correct)=>{
    const t=TW.task;
    const v=correct?String(t.ans):'×××';
    if(TW.m.mc){
      // MC: klikni na správné/špatné tlačítko
      const btns=[...document.querySelectorAll('#tw-mc .mc-btn')];
      const target=btns.find(b=>correct===(b.textContent.replace(/^[A-D]/,'')===String(t.ans)));
      (target||btns[0]).click();
    }else if(/^(ANO|NE)$/i.test(String(t.ans).trim())){
      twAnswerYN(correct?String(t.ans).toUpperCase():(String(t.ans).toUpperCase()==='ANO'?'NE':'ANO'));
    }else{
      document.getElementById('tw-ans').value=v;
      twSubmit();
    }
  },correct);
}

async function runForGame(browser, base, N){
  const KEY='RPG_MAT_'+N;
  console.log(`\n╔══════ ${N}. ROČNÍK (${KEY}) ══════╗`);

  console.log('\n── practice režim (bez cloudu) ──');
  {
    const {ctx,page}=await newGame(browser,base,N);
    await page.evaluate(()=>go('tower'));
    await page.waitForTimeout(250);
    ok(await page.evaluate(()=>document.getElementById('s-tower').classList.contains('active')),'obrazovka věže se otevře z mapy');
    const gate=await page.evaluate(()=>({st:document.getElementById('tw-gate-status').textContent,btn:document.getElementById('tw-gate-actions').textContent}));
    ok(/nanečisto/i.test(gate.st),'bez cloudu: brána hlásí lezení nanečisto');
    ok(/VSTOUPIT/.test(gate.btn),'bez cloudu: tlačítko vstupu je dostupné');

    await page.evaluate(()=>twStart());
    await page.waitForTimeout(150);
    const st0=await page.evaluate(()=>({floor:TW.floor,lives:TW.lives,play:document.getElementById('tw-play').style.display,task:!!TW.task,timer:document.getElementById('tw-timer-v').textContent}));
    ok(st0.play==='block'&&st0.floor===1&&st0.lives===3&&st0.task,'výstup začíná: patro 1, 3 ❤, úloha vylosovaná');
    ok(parseInt(st0.timer)>=12,'časomíra patra běží ('+st0.timer+' s)');

    // 3 patra správně
    for(let i=0;i<3;i++){await answerCurrent(page,true);await page.waitForTimeout(1100);}
    const st1=await page.evaluate(()=>({floor:TW.floor,lives:TW.lives}));
    ok(st1.floor===4&&st1.lives===3,'3 správné odpovědi → patro 4, životy drží');

    // kontrola escalace limitu: patro 4 má kratší limit než patro 1
    const lim=await page.evaluate(()=>twLimit());
    ok(lim<40,'limit se s patrem zkracuje ('+lim+' s)');

    // 3× špatně → konec
    for(let i=0;i<3;i++){
      await answerCurrent(page,false);
      await page.waitForTimeout(200);
      if(i<2)await page.evaluate(()=>twNext());
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1100);
    const end=await page.evaluate(()=>({on:TW.on,end:document.getElementById('tw-end').style.display,msg:document.getElementById('tw-end-msg').textContent,best:S.tower.best,xp:S.xp}));
    ok(end.end==='block'&&end.on===false,'3 chyby → konec výstupu');
    ok(/3\. patra/.test(end.msg),'zpráva uvádí dosažené 3. patro');
    ok(end.best===3,'rekord v S.tower.best = 3');
    ok(end.xp===6,'odměna +2 XP za patro (6 XP)');

    // restart drží rekord
    await page.evaluate(()=>twStart());
    await page.waitForTimeout(120);
    ok(await page.evaluate(()=>document.getElementById('tw-best').textContent)==='3','rekord se ukazuje při dalším pokusu');
    await ctx.close();
  }

  console.log('\n── cloud režim: brána + zápis ──');
  {
    const {ctx,page}=await newGame(browser,base,N);
    // nepřihlášený
    await page.evaluate(()=>{
      window.__rpc={submits:[]};
      window.RPGCloud=Object.assign({},window.RPGCloud,{
        configured:()=>true,currentUser:()=>null,
      });
      go('tower');
    });
    await page.waitForTimeout(200);
    ok(/přihlášený žák/i.test(await page.evaluate(()=>document.getElementById('tw-gate-status').textContent)),'nepřihlášený: výzva k přihlášení');
    ok(/PŘIHLÁSIT/.test(await page.evaluate(()=>document.getElementById('tw-gate-actions').textContent)),'nepřihlášený: tlačítko přihlášení místo vstupu');

    // přihlášený, špatný ročník
    await page.evaluate(()=>{
      window.RPGCloud=Object.assign({},window.RPGCloud,{
        currentUser:()=>({id:'u1'}),towerEligible:async()=>false,
      });
      go('map');go('tower');
    });
    await page.waitForTimeout(250);
    ok(/zamčená/i.test(await page.evaluate(()=>document.getElementById('tw-gate-status').textContent)),'špatný ročník: věž zamčená');
    ok((await page.evaluate(()=>document.getElementById('tw-gate-actions').textContent)).trim()==='','špatný ročník: žádné tlačítko vstupu');

    // přihlášený, správný ročník + XSS jména v žebříčku
    await page.evaluate(()=>{
      window.RPGCloud=Object.assign({},window.RPGCloud,{
        towerEligible:async()=>true,
        towerSubmit:async(g,f)=>{window.__rpc.submits.push({g,f});return{ok:true,best:Math.max(f,7)};},
        towerBoard:async()=>[
          {display_name:'<img src=x onerror="window.__xss=1">',best_floor:12,is_me:false},
          {display_name:'Já',best_floor:7,is_me:true}],
        towerHall:async()=>[{season:'2024/25',rank:1,display_name:'<script>window.__xss=2</script>',best_floor:28}],
      });
      go('map');go('tower');
    });
    await page.waitForTimeout(350);
    const gate=await page.evaluate(()=>({
      st:document.getElementById('tw-gate-status').textContent,
      board:document.getElementById('tw-board').style.display,
      hall:document.getElementById('tw-hall').style.display,
      boardTxt:document.getElementById('tw-board').textContent,
      xss:window.__xss||0,
    }));
    ok(/Vstup povolen/.test(gate.st),'správný ročník: vstup povolen');
    ok(gate.board==='block'&&/12\. patro/.test(gate.boardTxt),'žebříček sezóny se vykreslí');
    ok(gate.hall==='block','síň slávy se vykreslí');
    ok(gate.xss===0,'XSS jména v žebříčku/síni neprojdou (esc s uvozovkami)');

    // výstup 2 patra → konec → towerSubmit(2)
    await page.evaluate(()=>twStart());
    await page.waitForTimeout(120);
    for(let i=0;i<2;i++){await answerCurrent(page,true);await page.waitForTimeout(1100);}
    await page.evaluate(()=>twGiveUp());
    await page.waitForTimeout(400);
    const sub=await page.evaluate(()=>({subs:window.__rpc.submits,cloud:document.getElementById('tw-end-cloud').textContent}));
    ok(sub.subs.length===1&&sub.subs[0].g===KEY&&sub.subs[0].f===2,`konec → towerSubmit(${KEY}, 2)`);
    ok(/Zapsáno/.test(sub.cloud)&&/7\. patro/.test(sub.cloud),'hlášení ukazuje rekord sezóny ze serveru');
    await ctx.close();
  }

  console.log('\n── časomíra + reduced-motion ──');
  {
    const {ctx,page}=await newGame(browser,base,N);
    await page.evaluate(()=>{go('tower');twStart();});
    await page.waitForTimeout(150);
    // timeout sebere život
    await page.evaluate(()=>{TW.t0=Date.now()-999999;});
    await page.waitForTimeout(350);
    ok(await page.evaluate(()=>TW.lives)===2,'vypršení času bere ❤');
    ok(/ČAS VYPRŠEL/.test(await page.evaluate(()=>document.getElementById('tw-fb').textContent)),'hlášení o vypršení času');

    // reduced-motion: canvas se nehýbe
    await page.evaluate(()=>{toggleReducedMotion(true);});
    await page.waitForTimeout(200);
    const a=await page.evaluate(()=>document.getElementById('tw-canvas').toDataURL());
    await page.waitForTimeout(600);
    const b=await page.evaluate(()=>document.getElementById('tw-canvas').toDataURL());
    ok(a===b,'reduced-motion: věž i hrdina stojí (canvas beze změny)');

    // bez rm se točí
    await page.evaluate(()=>{toggleReducedMotion(false);});
    await page.waitForTimeout(200);
    const c=await page.evaluate(()=>document.getElementById('tw-canvas').toDataURL());
    await page.waitForTimeout(600);
    const d=await page.evaluate(()=>document.getElementById('tw-canvas').toDataURL());
    ok(c!==d,'bez reduced-motion se věž točí');

    // odchod na mapu zastaví smyčku
    await page.evaluate(()=>twExit());
    await page.waitForTimeout(100);
    ok(await page.evaluate(()=>!TWA.on&&!TW.on&&document.getElementById('s-map').classList.contains('active')),'twExit: zpět na mapu, animace i běh zastaveny');
    await ctx.close();
  }
}

(async()=>{
  const srv=await serve(); const base=`http://127.0.0.1:${srv.address().port}`;
  const browser=await chromium.launch({executablePath:EXEC});

  for(const N of [6,7,8,9]) await runForGame(browser, base, N);

  await browser.close(); srv.close();
  console.log(`\n══════════════════════════════════════════`);
  console.log(`  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
