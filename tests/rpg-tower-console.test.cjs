/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 11 (konzole): záložka VĚŽ LEGEND v rpg-ucitel.html.
   Mock RPC tower_board/tower_hall_of_fame/tower_close_season →
   ověří render žebříčku, síně slávy, XSS jmen a uzavření sezóny.
   Spusť: node tests/rpg-tower-console.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18486;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function ok(name, cond, d='') { if (cond){console.log('  ✅ '+name);pass++;} else {console.log('  ❌ '+name+(d?' — '+d:''));fail++;} }

function mockScript(scenario) {
  return `(function(){
    const S = ${JSON.stringify(scenario)};
    const db = { roles:S.roles||[], saves:S.saves||[], classes:[], class_members:[], notes:[] };
    window.__rpcCalls = [];
    function mkClient(){
      function q(table){
        let single=false, filters=[];
        function rows(){ let r=(db[table]||[]).slice(); filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));}); return r; }
        function resolve(){ const r=rows(); return Promise.resolve({data: single?(r[0]||null):r, error:null}); }
        const b={ select(){return b;}, insert(){return b;}, upsert(){return b;}, update(){return b;}, delete(){return b;},
          eq(c,v){filters.push([c,v]);return b;}, order(){return b;}, limit(){return b;}, range(){return b;}, is(){return b;}, in(){return b;},
          maybeSingle(){single=true;return resolve();}, single(){single=true;return resolve();},
          then(res,rej){return resolve().then(res,rej);} };
        return b;
      }
      return {
        auth:{ getSession:async()=>({data:{session:S.session||null}}), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}), signInWithOAuth:async()=>{}, signOut:async()=>{} },
        from:q,
        rpc:async(fn,args)=>{
          window.__rpcCalls.push({fn,args});
          if(fn==='tower_board') return {data:S.board||[],error:null};
          if(fn==='tower_hall_of_fame') return {data:S.hall||[],error:null};
          if(fn==='tower_close_season') return {data:(S.board||[]).length>10?10:(S.board||[]).length,error:null};
          return {data:[],error:null};
        }
      };
    }
    window.supabase = { createClient:()=>mkClient() };
  })();`;
}

function startServer() {
  const mime={html:'text/html',js:'application/javascript',css:'text/css'};
  const srv=http.createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    const fp=path.normalize(path.join(ROOT,p));
    if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('forbidden');return;}
    try{const buf=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(buf);}
    catch{res.writeHead(404);res.end('nf');} });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}

async function run() {
  console.log('\n── Konzole: záložka VĚŽ LEGEND ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:CHROMIUM });
  const errors = [];
  try {
    const admin='vojtech.konopa@husovaliberec.cz';
    const scenario = {
      roles: [{ email: admin, role:'superadmin' }],
      session: { user:{ id:'u-admin', email:admin, user_metadata:{full_name:'Vojta'} } },
      saves: [],
      board: [
        { display_name:'Neo', best_floor:23, is_me:false },
        { display_name:'<img src=x onerror="window.__xss=1">', best_floor:17, is_me:false },
        { display_name:'Trinity', best_floor:9, is_me:false },
      ],
      hall: [
        { season:'2024/25', rank:1, display_name:'Morpheus', best_floor:31 },
        { season:'2024/25', rank:2, display_name:'<script>window.__xss=2</script>', best_floor:28 },
      ],
    };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    await page.addInitScript(mockScript(scenario));
    await page.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil:'load' });
    await page.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'), {timeout:8000});

    await page.click('.tab[data-tab="tower"]');
    await page.waitForFunction(()=>!document.getElementById('t-tower').classList.contains('hidden'),{timeout:4000});
    ok('záložka Věž legend se otevře', true);

    const opts = await page.evaluate(()=>document.getElementById('tower-game').options.length);
    ok('výběr ročníku je naplněn (1 souhrn + 4 hry)', opts===5, 'options='+opts);
    ok('výchozí = souhrn všech ročníků (prázdná hodnota)', await page.evaluate(()=>document.getElementById('tower-game').value)==='');

    // souhrn všech ročníků: přehled má nadpisy ročníků a uzavření sezóny je skryté
    await page.waitForFunction(()=>/patro|nikdo/.test(document.getElementById('tower-board-wrap').textContent),{timeout:4000});
    const allView = await page.evaluate(()=>({txt:document.getElementById('tower-board-wrap').textContent, closeHidden:document.getElementById('tower-close-btn').style.display==='none'}));
    ok('souhrn ukazuje více ročníků + skrývá Uzavřít sezónu', /Neo/.test(allView.txt)&&allView.closeHidden, allView.txt.slice(0,100));

    // vyber konkrétní ročník (9.) → správa a single žebříček
    await page.evaluate(()=>{ const s=document.getElementById('tower-game'); s.value='RPG_MAT_9'; renderTower(); });
    await page.waitForFunction(()=>/patro/.test(document.getElementById('tower-board-wrap').textContent)&&/top 10/.test(document.getElementById('tower-board-wrap').textContent),{timeout:4000});
    const board = await page.evaluate(()=>document.getElementById('tower-board-wrap').textContent);
    ok('žebříček: 1. místo Neo 23. patro', /🥇/.test(board)&&/Neo/.test(board)&&/23\. patro/.test(board), board.slice(0,120));
    ok('žebříček: 3 řádky + popisek top 10', /Trinity/.test(board)&&/top 10/.test(board));

    const hall = await page.evaluate(()=>document.getElementById('tower-hall-wrap').textContent);
    ok('síň slávy: sezóna 2024/25 + Morpheus 31. patro', /2024\/25/.test(hall)&&/Morpheus/.test(hall)&&/31\. patro/.test(hall), hall.slice(0,120));
    ok('XSS jména neprojdou', await page.evaluate(()=>window.__xss||0)===0);

    // uzavření sezóny (confirm → OK)
    page.once('dialog', d=>d.accept());
    await page.click('#tower-close-btn');
    await page.waitForFunction(()=>window.__rpcCalls.some(c=>c.fn==='tower_close_season'),{timeout:4000});
    const call = await page.evaluate(()=>window.__rpcCalls.find(c=>c.fn==='tower_close_season'));
    ok('Uzavřít sezónu volá tower_close_season(RPG_MAT_9)', call&&call.args.p_game==='RPG_MAT_9');
    await page.waitForFunction(()=>/zapsáno 3 jmen/.test(document.body.textContent),{timeout:4000}).catch(()=>{});
    ok('toast hlásí počet zapsaných', await page.evaluate(()=>/zapsáno 3 jmen/.test(document.body.textContent)));

    // odmítnutý confirm → žádné další volání
    const before = await page.evaluate(()=>window.__rpcCalls.filter(c=>c.fn==='tower_close_season').length);
    page.once('dialog', d=>d.dismiss());
    await page.click('#tower-close-btn');
    await page.waitForTimeout(400);
    const after = await page.evaluate(()=>window.__rpcCalls.filter(c=>c.fn==='tower_close_season').length);
    ok('zrušený confirm sezónu neuzavře', before===after);

    // přepnutí ročníku načte znovu
    await page.evaluate(()=>{const s=document.getElementById('tower-game');s.value='RPG_MAT_6';renderTower();});
    await page.waitForFunction(()=>window.__rpcCalls.some(c=>c.fn==='tower_board'&&c.args.p_game==='RPG_MAT_6'),{timeout:4000});
    ok('přepnutí ročníku volá tower_board pro RPG_MAT_6', true);

    ok('žádné JS chyby', errors.length===0, errors.join(' | '));
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail?1:0);
}
run().catch(e=>{console.error(e);process.exit(1);});
