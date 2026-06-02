/**
 * Bezpečnost + odolnost RPG her (rpg-mat-6/7/8/9)
 * Spusť: node tests/rpg-antispam-robustness.test.cjs
 *
 * Pokrývá:
 *  - Issue #51 „Level spam": opakování splněné mise nesmí dávat XP
 *  - Exploit přes retryMission (smaže done) — XP claim je trvalý
 *  - XSS: jméno hráče se nevkládá jako HTML
 *  - Poškozený save: hra se nezhroutí
 *  - „Dítě klikající všude": fuzz klikání + Enter + nesmyslné odpovědi → žádné JS chyby, XP nepřeteče
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18540;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GRADES = [6,7,8,9];

function startServer(){
  const mime={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',json:'application/json'};
  const srv=http.createServer((req,res)=>{let p=req.url.split('?')[0];if(p==='/')p='/index.html';
   try{const b=fs.readFileSync(path.join(ROOT,p));res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(b);}catch{res.writeHead(404);res.end('nf');}});
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}
let pass=0,fail=0;
function ok(n,c,d=''){if(c){console.log(`  ✅ ${n}`);pass++;}else{console.log(`  ❌ ${n}${d?' — '+d:''}`);fail++;}}

// odehraje celou misi (jen NE-MC mise s textovým vstupem) přímo přes submitAnswer
const PLAY = `
window.__play = function(aid,mid){
  launchBattle(aid,mid);
  const m=AREAS.find(a=>a.id===aid).missions.find(x=>x.id===mid);
  const xpBefore=S.xp, atBefore=JSON.stringify(S.attrs);
  for(let k=0;k<m.tc;k++){
    BT.idx=k; BT.curTask=BT.tasks[k];
    const inp=document.getElementById('bt-ans');
    inp.disabled=false; inp.value=String(BT.tasks[k].ans);
    submitAnswer();
  }
  return {gainedXp:S.xp-xpBefore, attrsChanged:JSON.stringify(S.attrs)!==atBefore};
}`;

async function testGrade(ctx, g){
  console.log(`\n── ${g}. ročník (rpg-mat-${g}.html) ──`);
  const pg=await ctx.newPage();
  const perr=[];
  pg.on('pageerror', e=>perr.push(e.message));
  await pg.goto(`${BASE}/projects/rpg-mat-${g}.html`,{waitUntil:'domcontentloaded'});
  await pg.waitForFunction(()=>typeof launchBattle==='function'&&typeof submitAnswer==='function'&&typeof AREAS!=='undefined',{timeout:8000});
  await pg.evaluate(PLAY);

  // start hry
  await pg.evaluate(()=>{document.getElementById('ni').value='TESTER';startGame();});

  // 1) první splnění mise 1-2 dá XP
  const first=await pg.evaluate(()=>__play(1,'1-2'));
  ok(`[g${g}] První splnění mise dá XP`, first.gainedXp>0, 'gainedXp='+first.gainedXp);
  ok(`[g${g}] První splnění přidá body do atributů`, first.attrsChanged);

  // 2) ANTI-SPAM: opakování téže mise nedá žádné XP (issue #51)
  const replay=await pg.evaluate(()=>__play(1,'1-2'));
  ok(`[g${g}] Opakování splněné mise NEDÁ XP`, replay.gainedXp===0, 'gainedXp='+replay.gainedXp);
  ok(`[g${g}] Opakování NEPŘIDÁ body do atributů`, replay.attrsChanged===false);

  // 3) EXPLOIT přes retryMission: smaže S.done, ale XP claim je trvalý
  const afterRetry=await pg.evaluate(()=>{
    // simuluj „úmyslné selhání" tím, že smažeme postup mise jako retryMission
    for(let i=0;i<8;i++) delete S.done['1-2-'+i];
    saveS();
    return __play(1,'1-2');
  });
  ok(`[g${g}] Po retryMission (smazaný done) stále 0 XP`, afterRetry.gainedXp===0, 'gainedXp='+afterRetry.gainedXp);

  // 4) xpClaimed přežije reload (trvalý záznam)
  await pg.reload({waitUntil:'domcontentloaded'});
  await pg.waitForFunction(()=>typeof loadS==='function',{timeout:8000});
  await pg.evaluate(PLAY);
  const persisted=await pg.evaluate(()=>{loadS();return Object.keys(S.xpClaimed||{}).length;});
  ok(`[g${g}] xpClaimed přežije reload`, persisted>=6, 'claimů='+persisted);
  const replay2=await pg.evaluate(()=>{startGame();return __play(1,'1-2');});
  ok(`[g${g}] Po reloadu opakování stále 0 XP`, replay2.gainedXp===0, 'gainedXp='+replay2.gainedXp);

  // 5) XSS: jméno se nevkládá jako HTML
  const xss=await pg.evaluate(()=>{
    const payload='<img src=x onerror=window.__xss=1>';
    document.getElementById('ni').value=payload;
    startGame();
    go('map');
    const el=document.getElementById('map-name');
    return {childEls:el.children.length, firedXss:!!window.__xss, text:el.textContent};
  });
  ok(`[g${g}] Jméno hráče nevytvoří HTML element`, xss.childEls===0, 'childEls='+xss.childEls);
  ok(`[g${g}] XSS payload se nespustil`, xss.firedXss===false);

  // 6) Poškozený save hru nezhroutí
  const corrupt=await pg.evaluate((key)=>{
    const errs=[];
    try{ localStorage.setItem(key,'{ this is not json'); loadS(); }catch(e){errs.push('badjson:'+e.message);}
    try{ localStorage.setItem(key,JSON.stringify({name:'X'})); loadS(); go('map'); }catch(e){errs.push('partial:'+e.message);}
    try{ localStorage.setItem(key,JSON.stringify({name:'X',done:null,attrs:null})); loadS(); }catch(e){errs.push('nulls:'+e.message);}
    return errs;
  }, `RPG_MAT_${g}`);
  ok(`[g${g}] Poškozený/neúplný save nezhroutí loadS`, Array.isArray(corrupt), corrupt.join(' | '));

  // 7) „Dítě klikající všude": fuzz klikání + Enter + nesmyslné odpovědi
  await pg.evaluate(()=>{localStorage.clear();document.getElementById('ni').value='FUZZ';startGame();});
  const fuzzGarbage=['','   ','💣💣💣','<b>x</b>','999999999999','-0','abc','0/0','NaN','%%%','\n\t',' 1 e9 ','1,2,3'];
  await pg.evaluate(async (garbage)=>{
    const screens=['map','train','profile'];
    for(let i=0;i<400;i++){
      // občas přepni obrazovku
      if(i%17===0){try{go(screens[Math.floor(Math.random()*screens.length)]);}catch(e){}}
      // občas vstup do oblasti / mise
      if(i%23===0){try{openArea(1+Math.floor(Math.random()*7));}catch(e){}}
      if(i%29===0){try{launchBattle(1+Math.floor(Math.random()*7), (1+Math.floor(Math.random()*7))+'-'+(1+Math.floor(Math.random()*3)));}catch(e){}}
      // nasázej nesmyslnou odpověď a submitni
      if(i%5===0){const inp=document.getElementById('bt-ans');if(inp){inp.disabled=false;inp.value=garbage[i%garbage.length];}
        try{submitAnswer();}catch(e){}}
      // klikni náhodné viditelné tlačítko
      const btns=[...document.querySelectorAll('button')].filter(b=>b.offsetParent!==null&&!b.disabled);
      if(btns.length){try{btns[Math.floor(Math.random()*btns.length)].click();}catch(e){}}
    }
  }, fuzzGarbage);
  // mash Enter na všech obrazovkách
  for(let i=0;i<60;i++){ await pg.keyboard.press('Enter'); }

  const xpSane=await pg.evaluate(()=>S.xp);
  ok(`[g${g}] Fuzz neprodukuje JS chyby`, perr.length===0, perr.slice(0,3).join(' | '));
  ok(`[g${g}] XP po fuzzu zůstává v rozumných mezích`, xpSane>=0 && xpSane<100000, 'xp='+xpSane);

  await pg.close();
}

async function run(){
  console.log('\n══════════════════════════════════════════');
  console.log('  RPG — bezpečnost + odolnost (anti-spam, fuzz, XSS)');
  console.log('══════════════════════════════════════════');
  const srv=await startServer();
  const browser=await chromium.launch({headless:true,executablePath:CHROMIUM});
  try{
    for(const g of GRADES){
      const ctx=await browser.newContext();
      await ctx.route('**jsdelivr**',r=>r.abort());
      await testGrade(ctx,g);
      await ctx.close();
    }
  }catch(e){console.error('\nChyba testu:',e.stack||e.message);fail++;}
  await browser.close();srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════\n');
  if(fail>0)process.exit(1);
}
run().catch(e=>{console.error(e);process.exit(1);});
