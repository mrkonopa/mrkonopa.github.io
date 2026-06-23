/* Verify: rpgb-myscore persists cumulative score across questions */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 18494;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let pass=0, fail=0;
function ok(n,c,d=''){ if(c){console.log('  ✅ '+n);pass++;}else{console.log('  ❌ '+n+(d?' — '+d:''));fail++;} }

function startServer(){
  const mime={html:'text/html',js:'application/javascript',css:'text/css'};
  const srv=http.createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    const fp=path.normalize(path.join(ROOT,p));
    if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('x');return;}
    try{const b=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(b);}
    catch{res.writeHead(404);res.end('nf');} });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}
function harness(){ return `<!doctype html><html><head><meta charset="utf-8"><style>:root{--gold:#19e6e6}</style></head><body><script>
  window.RPGWallet={getReducedMotion:()=>true};
  window.RPG_BATTLE_9={build:function(s,c){var a=[];for(var i=0;i<c;i++)a.push({text:'Otázka '+(i+1)+'?',choices:['Alfa','Beta','Gama','Delta'],correct:0});return a;}};
  window.RPGCloud={currentUser:()=>({id:'u-me'}),isStaff:()=>false,
    createBattle:(g,c,n,tm)=>Promise.resolve({id:'b1',code:'WXYZ',team_mode:!!tm}),
    joinBattle:(c,n)=>Promise.resolve({id:'b1',code:'WXYZ'}),
    pollBattle:(id,cb)=>{window.__cb=cb;return ()=>{};},
    submitBattleAnswer:function(){window.__lastSubmit=[].slice.call(arguments);},
    advanceBattle:()=>{},setBattleStatus:()=>{},listActiveBattles:()=>Promise.resolve([]),
    recordBattleResult:()=>Promise.resolve(true)};
  </script><script src="${BASE}/projects/rpg-battle-ui.js"></script></body></html>`; }

async function run(){
  console.log('\n── Scorekeeper persistence ──\n');
  const srv=await startServer();
  const browser=await chromium.launch({headless:true,executablePath:CHROMIUM});
  const errors=[];
  try{
    const ctx=await browser.newContext({viewport:{width:480,height:820}});
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.setContent(harness(),{waitUntil:'load'});
    await page.waitForFunction(()=>typeof window.RPGBattle!=='undefined',{timeout:5000});
    await page.evaluate(()=>RPGBattle.open({game:'RPG_MAT_9',name:'Me',autoAction:'host'}));
    await page.evaluate(()=>RPGBattle._create(5));
    await page.waitForFunction(()=>!!window.__cb,{timeout:4000});
    const now=new Date().toISOString();
    const P=(s,cc,lq)=>({user_id:'u-me',display_name:'Me',score:s,correct_count:cc,last_qi:lq});
    const O=(s,cc,lq)=>({user_id:'u-op',display_name:'Soupeř',score:s,correct_count:cc,last_qi:lq});
    const feed=st=>page.evaluate(s=>window.__cb(s),st);
    const myscore=()=>page.evaluate(()=>{const e=document.getElementById('rpgb-myscore');return e?e.textContent:'(missing)';});

    // Q1: fresh, score 0
    await feed({battle:{status:'active',q_seed:7,q_count:5,q_index:0,q_started_at:now},players:[P(0,0,-1),O(0,0,-1)],me:'u-me'});
    await page.waitForFunction(()=>!!document.getElementById('rpgb-choices'),{timeout:3000});
    ok('Q1 myscore shows ⭐ 0', /⭐\s*0/.test(await myscore()), await myscore());

    // answer correctly → server reflects score 1200 (still Q1)
    await feed({battle:{status:'active',q_seed:7,q_count:5,q_index:0,q_started_at:now},players:[P(1200,1,0),O(0,0,0)],me:'u-me'});
    await page.waitForTimeout(150);
    ok('Q1 myscore updates to ⭐ 1200', /⭐\s*1200/.test(await myscore()), await myscore());

    // advance to Q2 → score must PERSIST (was the bug: per-question tracker reset)
    await feed({battle:{status:'active',q_seed:7,q_count:5,q_index:1,q_started_at:now},players:[P(1200,1,0),O(0,0,0)],me:'u-me'});
    await page.waitForFunction(()=>/OTÁZKA 2 \/ 5/.test(document.body.textContent),{timeout:3000});
    ok('Q2 header advanced', /OTÁZKA 2 \/ 5/.test(await page.evaluate(()=>document.body.textContent)));
    ok('Q2 myscore STILL ⭐ 1200 (persists across question)', /⭐\s*1200/.test(await myscore()), await myscore());

    // answer Q2 → cumulative grows to 2500
    await feed({battle:{status:'active',q_seed:7,q_count:5,q_index:1,q_started_at:now},players:[P(2500,2,1),O(0,0,1)],me:'u-me'});
    await page.waitForTimeout(150);
    ok('Q2 myscore accumulates to ⭐ 2500', /⭐\s*2500/.test(await myscore()), await myscore());

    // 🔍 per-question tracker (rpgb-ans) still resets independently — sanity
    const ans=await page.evaluate(()=>document.getElementById('rpgb-ans').textContent);
    ok('🔍 per-question tracker (rpgb-ans) coexists', ans.length>0, ans);

    ok('no JS errors', errors.length===0, errors.join(' | '));
  } finally { await browser.close(); srv.close(); }
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail?1:0);
}
run().catch(e=>{console.error(e);process.exit(1);});
