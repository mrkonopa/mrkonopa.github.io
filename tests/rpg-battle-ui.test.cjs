/* ══════════════════════════════════════════════════════════════════
   Test ŽIVÝ SOUBOJ — vylepšené UI (rpg-battle-ui.js).
   Mock RPGCloud.pollBattle zachytí onState callback → testem řídíme
   stavy souboje a ověříme: Kahoot dlaždice (4 barvy+tvary), 3-2-1
   odpočet (skip při reduced-motion), host přehled správně/špatně,
   průběžný žebříček, výsledky + zápis výsledku (recordBattleResult).
   Spusť: node tests/rpg-battle-ui.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18493;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function ok(name, cond, d='') { if (cond){console.log('  ✅ '+name);pass++;} else {console.log('  ❌ '+name+(d?' — '+d:''));fail++;} }

function startServer() {
  const mime={html:'text/html',js:'application/javascript',css:'text/css'};
  const srv=http.createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    const fp=path.normalize(path.join(ROOT,p));
    if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('forbidden');return;}
    try{const buf=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(buf);}
    catch{res.writeHead(404);res.end('nf');} });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}

// minimální harness: mock cloud + banka, načte rpg-battle-ui.js
function harness() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>:root{--gold:#19e6e6}</style></head>
  <body><script>
    window.__rec = 0;
    window.RPGWallet = { getReducedMotion:()=>true };   // skip odpočtu/konfet pro rychlost
    window.RPG_BATTLE_9 = { build:function(seed,count){
      var a=[]; for(var i=0;i<count;i++) a.push({text:'Otázka '+(i+1)+'?',choices:['Alfa','Beta','Gama','Delta'],correct:0}); return a; } };
    window.RPGCloud = {
      currentUser:()=>({id:'u-me'}),
      isStaff:()=>false,
      createBattle:(g,c,n)=>Promise.resolve({id:'b1',code:'WXYZ'}),
      joinBattle:(c,n)=>Promise.resolve({id:'b1',code:'WXYZ'}),
      pollBattle:(id,cb,iv)=>{ window.__cb=cb; return ()=>{}; },
      submitBattleAnswer:function(){ window.__lastSubmit=[].slice.call(arguments); },
      advanceBattle:()=>{}, setBattleStatus:()=>{},
      listActiveBattles:()=>Promise.resolve([]),
      recordBattleResult:(id)=>{ window.__rec++; return Promise.resolve(true); }
    };
  </script>
  <script src="${BASE}/projects/rpg-battle-ui.js"></script>
  </body></html>`;
}

async function run() {
  console.log('\n── Živý souboj: vylepšené UI ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:CHROMIUM });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport:{width:480,height:820} });
    const page = await ctx.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    await page.setContent(harness(), { waitUntil:'load' });
    await page.waitForFunction(()=>typeof window.RPGBattle!=='undefined',{timeout:5000});

    // založ souboj jako host
    await page.evaluate(()=>{ RPGBattle.open({game:'RPG_MAT_9', name:'Me', autoAction:'host'}); });
    await page.evaluate(()=>RPGBattle._create(5));
    await page.waitForFunction(()=>!!window.__cb,{timeout:4000});
    ok('host založil místnost (polling běží)', true);

    const now=new Date().toISOString();
    const P=(score,cc,lq)=>({user_id:'u-me',display_name:'Me',score:score,correct_count:cc,last_qi:lq});
    const O=(score,cc,lq)=>({user_id:'u-op',display_name:'Soupeř',score:score,correct_count:cc,last_qi:lq});
    const feed=(st)=>page.evaluate((s)=>window.__cb(s),st);

    // lobby
    await feed({battle:{status:'lobby',code:'WXYZ',q_seed:7,q_count:5,q_index:-1},
      players:[{user_id:'u-me',display_name:'Me'},{user_id:'u-op',display_name:'Soupeř'}],me:'u-me'});
    await page.waitForFunction(()=>/Čekárna/.test(document.body.textContent),{timeout:3000});
    ok('lobby ukazuje kód a 2 hráče', await page.evaluate(()=>/WXYZ/.test(document.body.textContent)));

    // start → otázka 0 (odpočet se přeskočí kvůli reduced-motion)
    await feed({battle:{status:'active',q_seed:7,q_count:5,q_index:0,q_started_at:now},
      players:[P(0,0,-1),O(0,0,-1)],me:'u-me'});
    await page.waitForFunction(()=>!!document.getElementById('rpgb-choices'),{timeout:3000});
    ok('otázka 0 vykreslena', await page.evaluate(()=>/OTÁZKA 1 \/ 5/.test(document.body.textContent)));

    // Kahoot dlaždice: 4 barvy + tvary
    const tiles = await page.evaluate(()=>{
      const cs=[...document.querySelectorAll('.rpgb-ch')];
      return { n:cs.length, klass:cs.map(c=>['k0','k1','k2','k3'].find(k=>c.classList.contains(k))||''),
               shapes:cs.map(c=>{const s=c.querySelector('.rpgb-sh');return s?s.textContent:'';}) };
    });
    ok('4 dlaždice se 4 barvami k0–k3', tiles.n===4 && tiles.klass.join(',')==='k0,k1,k2,k3', JSON.stringify(tiles.klass));
    ok('dlaždice mají tvary ▲◆●■', tiles.shapes.join('')==='▲◆●■', tiles.shapes.join(''));

    // odpovím správně (tile 0) → zápis odpovědi + žebříček
    await page.click('#rpgb-c0');
    await page.waitForFunction(()=>/Správně/.test(document.body.textContent),{timeout:2000});
    ok('správná odpověď → zelená zpětná vazba', await page.evaluate(()=>/Správně/.test(document.getElementById('rpgb-fb').textContent)));
    ok('správná dlaždice označena .ok', await page.evaluate(()=>document.getElementById('rpgb-c0').classList.contains('ok')));

    // poll s aktualizovaným skóre → host přehled + průběžný žebříček
    await feed({battle:{status:'active',q_seed:7,q_count:5,q_index:0,q_started_at:now},
      players:[P(1200,1,0),O(0,0,0)],me:'u-me'});
    await page.waitForFunction(()=>/PRŮBĚŽNÉ POŘADÍ/.test(document.body.textContent),{timeout:2000});
    ok('mezikolo: průběžný žebříček s 🥇', await page.evaluate(()=>/🥇/.test(document.getElementById('rpgb-stand').textContent)));
    const ansTxt = await page.evaluate(()=>document.getElementById('rpgb-ans').textContent);
    ok('host přehled: ✓1 ✗1 (jeden správně, jeden špatně)', /✓1/.test(ansTxt)&&/✗1/.test(ansTxt), ansTxt);

    // konec souboje → výsledky + zápis výsledku
    await feed({battle:{status:'finished',q_seed:7,q_count:5,q_index:5},
      players:[P(1200,1,0),O(0,0,0)],me:'u-me'});
    await page.waitForFunction(()=>/Konec souboje/.test(document.body.textContent),{timeout:3000});
    ok('výsledková listina: 🥇 vítěz', await page.evaluate(()=>/🥇/.test(document.body.textContent)));
    ok('recordBattleResult zavolán jednou', await page.evaluate(()=>window.__rec)===1);

    // re-render výsledků nezapíše podruhé (idempotence na klientu)
    await feed({battle:{status:'finished',q_seed:7,q_count:5,q_index:5},
      players:[P(1200,1,0)],me:'u-me'});
    await page.waitForTimeout(150);
    ok('opakovaný „finished" nezapíše výsledek dvakrát', await page.evaluate(()=>window.__rec)===1);

    ok('žádné JS chyby', errors.length===0, errors.join(' | '));
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail?1:0);
}
run().catch(e=>{console.error(e);process.exit(1);});
