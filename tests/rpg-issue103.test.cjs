/* ══════════════════════════════════════════════════════════════════
   Test Issue #103 — Věž legend a žebříčky pro učitele.
   (1) HRA: učitel (isStaff) smí vstoupit do KAŽDÉ věže jako náhled —
       gate hlásí „Učitelský náhled" a konec běhu NEvolá towerSubmit
       (postup se nezapočítává). Napříč všemi 4 ročníky.
   (2) KONZOLE: záložka 🏆 ŽEBŘÍČKY řadí žáky podle XP z uložených postav
       (učitel vidí celý ročník i bez vlastní třídy).
   (3) KONZOLE: žebříček věže má 🗑 a maže přes tower_delete_run(user_id).
   Spusť: node tests/rpg-issue103.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
let pass=0, fail=0; const ok=(c,m)=>{c?(pass++,console.log('  ✅ '+m)):(fail++,console.log('  ❌ '+m));};

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}

const SEED = {name:'TEST',xp:0,level:1,attrs:{calc:0,geo:0,anal:0,craft:0},done:{},inv:[]};

async function answerCurrent(page, correct){
  await page.evaluate((correct)=>{
    const t=TW.task;const v=correct?String(t.ans):'×××';
    if(TW.m.mc){const btns=[...document.querySelectorAll('#tw-mc .mc-btn')];const target=btns.find(b=>correct===(b.textContent.replace(/^[A-D]/,'')===String(t.ans)));(target||btns[0]).click();}
    else if(/^(ANO|NE)$/i.test(String(t.ans).trim())){twAnswerYN(correct?String(t.ans).toUpperCase():(String(t.ans).toUpperCase()==='ANO'?'NE':'ANO'));}
    else{document.getElementById('tw-ans').value=v;twSubmit();}
  },correct);
}

// ── (1) HRA: učitelský náhled věže (4 ročníky) ──────────────────────
async function gameStaffPreview(browser, base, N){
  const KEY='RPG_MAT_'+N;
  const ctx=await browser.newContext({viewport:{width:480,height:900}});
  const page=await ctx.newPage();
  page.on('pageerror',e=>{fail++;console.log('  ❌ JS chyba g'+N+': '+e.message);});
  // Pin data mimo letní prázdniny (červenec/srpen) — jinak je věž zavřená
  // (Fáze 17) a náhled/vstup nejde otevřít. Stejně jako rpg-tower-game.test.
  await page.addInitScript(()=>{window.__TW_TESTNOW='2026-05-15T10:00:00';});
  await page.addInitScript(({key,seed})=>{localStorage.setItem(key,JSON.stringify(seed));},{key:KEY,seed:SEED});
  await page.goto(`${base}/projects/rpg-mat-${N}.html`,{waitUntil:'load'});
  await page.evaluate(()=>continueGame());
  await page.evaluate(()=>{
    window.__rpc={submits:[]};
    window.RPGCloud=Object.assign({},window.RPGCloud,{
      configured:()=>true, currentUser:()=>({id:'teacher-1'}), isStaff:()=>true,
      towerEligible:async()=>{throw new Error('eligible se nemá volat pro staff');},
      towerSubmit:async(g,f)=>{window.__rpc.submits.push({g,f});return{ok:true,best:f};},
      towerBoard:async()=>[{display_name:'Žák A',best_floor:5,is_me:false}],
      towerHall:async()=>[],
    });
    go('map');go('tower');
  });
  await page.waitForTimeout(300);
  const gate=await page.evaluate(()=>({st:document.getElementById('tw-gate-status').textContent,btn:document.getElementById('tw-gate-actions').textContent}));
  ok(/náhled/i.test(gate.st),`g${N} brána hlásí „Učitelský náhled"`);
  ok(/VSTOUPIT/.test(gate.btn),`g${N} učitel má tlačítko vstupu (náhled)`);
  // výstup 2 patra → konec → NESMÍ volat towerSubmit
  await page.evaluate(()=>twStart());
  await page.waitForTimeout(120);
  ok(await page.evaluate(()=>TW.practice===true),`g${N} běh je v practice režimu (TW.practice)`);
  for(let i=0;i<2;i++){await answerCurrent(page,true);await page.waitForTimeout(1100);}
  await page.evaluate(()=>twGiveUp());
  await page.waitForTimeout(300);
  const res=await page.evaluate(()=>({subs:window.__rpc.submits.length,cloud:document.getElementById('tw-end-cloud').textContent}));
  ok(res.subs===0,`g${N} konec náhledu NEvolá towerSubmit (nezapočítává se)`);
  ok(/nanečisto/i.test(res.cloud),`g${N} hlášení: lezeš nanečisto`);
  await ctx.close();
}

// ── (2)+(3) KONZOLE ─────────────────────────────────────────────────
function consoleMock(scenario){
  return `(function(){
    const S=${JSON.stringify(scenario)};
    const db={roles:S.roles||[],saves:S.saves||[],classes:[],class_members:[],notes:[]};
    window.__rpcCalls=[];
    function mkClient(){
      function q(table){let single=false,filters=[];
        function rows(){let r=(db[table]||[]).slice();filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));});return r;}
        function resolve(){const r=rows();return Promise.resolve({data:single?(r[0]||null):r,error:null});}
        const b={select(){return b;},insert(){return b;},upsert(){return b;},update(){return b;},delete(){return b;},
          eq(c,v){filters.push([c,v]);return b;},order(){return b;},limit(){return b;},range(){return b;},is(){return b;},in(){return b;},
          maybeSingle(){single=true;return resolve();},single(){single=true;return resolve();},then(res,rej){return resolve().then(res,rej);}};
        return b;}
      return {auth:{getSession:async()=>({data:{session:S.session||null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth:async()=>{},signOut:async()=>{}},
        from:q,
        rpc:async(fn,args)=>{window.__rpcCalls.push({fn,args});
          if(fn==='tower_board_admin')return{data:S.boardAdmin||[],error:null};
          if(fn==='tower_hall_of_fame')return{data:S.hall||[],error:null};
          if(fn==='tower_delete_run')return{data:1,error:null};
          if(fn==='tower_board')return{data:S.board||[],error:null};
          return{data:[],error:null};}};
    }
    window.supabase={createClient:()=>mkClient()};
  })();`;
}

async function runConsole(browser, base){
  const admin='vojtech.konopa@husovaliberec.cz';
  const scenario={
    roles:[{email:admin,role:'superadmin'}],
    session:{user:{id:'u-admin',email:admin,user_metadata:{full_name:'Vojta'}}},
    saves:[
      {user_id:'s1',game:'RPG_MAT_9',name:'Neo',full_name:'N',email:'n@x',updated_at:new Date().toISOString(),data:{xp:340,level:4}},
      {user_id:'s2',game:'RPG_MAT_9',name:'Trinity',full_name:'T',email:'t@x',updated_at:new Date().toISOString(),data:{xp:120,level:2}},
      {user_id:'s3',game:'RPG_MAT_9',name:'Morpheus',full_name:'M',email:'m@x',updated_at:new Date().toISOString(),data:{xp:560,level:6}},
      {user_id:'s4',game:'RPG_MAT_6',name:'Šesták',full_name:'S',email:'s@x',updated_at:new Date().toISOString(),data:{xp:99,level:1}},
    ],
    boardAdmin:[
      {user_id:'s3',display_name:'Morpheus',best_floor:23,runs:4,updated_at:new Date().toISOString()},
      {user_id:'s1',display_name:'Neo',best_floor:11,runs:2,updated_at:new Date().toISOString()},
    ],
    hall:[],
  };
  const ctx=await browser.newContext();
  const page=await ctx.newPage();
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.addInitScript(consoleMock(scenario));
  await page.goto(`${base}/projects/rpg-ucitel.html`,{waitUntil:'load'});
  await page.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'),{timeout:8000});
  await page.waitForFunction(()=>Array.isArray(window.ROWS)&&window.ROWS.length>0,{timeout:6000}).catch(()=>{});

  // (2) ŽEBŘÍČKY tab
  await page.click('.tab[data-tab="leaderboard"]');
  await page.waitForFunction(()=>!document.getElementById('t-leaderboard').classList.contains('hidden'),{timeout:4000});
  await page.waitForFunction(()=>/XP/.test(document.getElementById('lb-wrap').textContent),{timeout:4000}).catch(()=>{});
  const lb=await page.evaluate(()=>document.getElementById('lb-wrap').textContent);
  ok(/🥇/.test(lb)&&/Morpheus/.test(lb)&&/560 XP/.test(lb),'žebříček: 1. Morpheus 560 XP (řazeno dle XP)');
  // pořadí: Morpheus(560) > Neo(340) > Trinity(120)
  const order=await page.evaluate(()=>{const t=document.getElementById('lb-wrap').textContent;return [t.indexOf('Morpheus'),t.indexOf('Neo'),t.indexOf('Trinity')];});
  ok(order[0]<order[1]&&order[1]<order[2],'žebříček: správné pořadí Morpheus→Neo→Trinity');
  ok(!/Šesták/.test(lb),'žebříček 9. ročníku neukazuje žáka 6. ročníku');
  // přepnutí na 6. ročník
  await page.selectOption('#lb-game','RPG_MAT_6');
  await page.waitForTimeout(150);
  ok(/Šesták/.test(await page.evaluate(()=>document.getElementById('lb-wrap').textContent)),'přepnutí ročníku: 6. ročník ukáže Šestáka');

  // (3) VĚŽ LEGEND — mazání žáka z žebříčku
  await page.click('.tab[data-tab="tower"]');
  await page.waitForFunction(()=>!document.getElementById('t-tower').classList.contains('hidden'),{timeout:4000});
  // #174: výchozí je „Všechny ročníky" (read-only přehled bez mazání) → pro
  // správu (🗑) vyber konkrétní ročník
  await page.selectOption('#tower-game','RPG_MAT_9');
  await page.evaluate(()=>renderTower());
  await page.waitForFunction(()=>/patro/.test(document.getElementById('tower-board-wrap').textContent),{timeout:4000});
  const hasDel=await page.evaluate(()=>document.querySelectorAll('#tower-board-wrap button').length);
  ok(hasDel>=2,'žebříček věže (admin): u každého řádku je 🗑 tlačítko ('+hasDel+')');
  ok(/4× pokus/.test(await page.evaluate(()=>document.getElementById('tower-board-wrap').textContent)),'žebříček věže ukazuje počet pokusů');
  // klik na první 🗑 → confirm → tower_delete_run(s3)
  page.once('dialog',d=>d.accept());
  await page.evaluate(()=>document.querySelector('#tower-board-wrap button').click());
  await page.waitForFunction(()=>window.__rpcCalls.some(c=>c.fn==='tower_delete_run'),{timeout:4000});
  const del=await page.evaluate(()=>window.__rpcCalls.find(c=>c.fn==='tower_delete_run'));
  ok(del&&del.args.p_user_id==='s3'&&del.args.p_game==='RPG_MAT_9','🗑 volá tower_delete_run(user_id=s3, RPG_MAT_9)');
  ok(errs.length===0,'konzole bez JS chyb'+(errs.length?(' ['+errs[0]+']'):''));
  await ctx.close();
}

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  console.log('\n── (1) HRA: učitelský náhled věže (4 ročníky) ──');
  for(const N of [6,7,8,9]) await gameStaffPreview(browser,base,N);
  console.log('\n── (2)+(3) KONZOLE: žebříčky + mazání z věže ──');
  await runConsole(browser,base);
  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
