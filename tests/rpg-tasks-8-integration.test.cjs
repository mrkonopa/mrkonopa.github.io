/**
 * Integrace rozšiřující banky úloh do hry rpg-mat-8.html
 * Spusť: node tests/rpg-tasks-integration.test.cjs
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18534;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function startServer(){
  const mime={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',json:'application/json'};
  const srv=http.createServer((req,res)=>{
    let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    try{const fp=path.normalize(path.join(ROOT,p));if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('forbidden');return;}const buf=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(buf);}
    catch{res.writeHead(404);res.end('nf');}
  });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}

let pass=0, fail=0;
function ok(name,cond,detail=''){ if(cond){console.log(`  ✅ ${name}`);pass++;} else {console.log(`  ❌ ${name}${detail?' — '+detail:''}`);fail++;} }

async function run(){
  console.log('\n══════════════════════════════════════════');
  console.log('  rpg-mat-8 — integrace banky úloh');
  console.log('══════════════════════════════════════════\n');

  const srv=await startServer();
  const browser=await chromium.launch({headless:true, executablePath:CHROMIUM});
  const ctx=await browser.newContext();
  await ctx.route('**jsdelivr**', r=>r.abort());        // cloud nedostupný → graceful
  const pg=await ctx.newPage();
  const perr=[];
  pg.on('pageerror', e=>perr.push(e.message));

  try{
    await pg.goto(`${BASE}/projects/rpg-mat-8.html`,{waitUntil:'domcontentloaded'});
    await pg.waitForFunction(()=>typeof AREAS!=='undefined' && typeof launchBattle==='function',{timeout:8000});

    // 1) banka načtená
    const bank=await pg.evaluate(()=>!!window.RPG_TASK_EXTRA_8 && Object.keys(window.RPG_TASK_EXTRA_8).length);
    ok('Banka rpg-tasks-8.js načtená (21 misí)', bank===21, 'misí: '+bank);

    const hasShuffle=await pg.evaluate(()=>typeof window.shuffleArr==='function');
    ok('Helper shuffleArr existuje', hasShuffle);

    // 2) spuštění hry + mise
    await pg.evaluate(()=>{ document.getElementById('ni').value='TESTER'; startGame(); });
    await pg.waitForTimeout(200);
    await pg.evaluate(()=>launchBattle(1,'1-1'));
    await pg.waitForTimeout(200);

    const tc=await pg.evaluate(()=>{ const m=AREAS[0].missions[0]; return m.tc; });
    const drawn=await pg.evaluate(()=>BT.tasks.length);
    ok('Mise vylosovala přesně tc úloh', drawn===tc, `tc=${tc}, drawn=${drawn}`);

    const curOK=await pg.evaluate(()=>!!(BT.curTask && BT.curTask.text && typeof BT.curTask.ans!=='undefined'));
    ok('Aktuální úloha má text i odpověď', curOK);

    // 3) sloučený pool = základ + banka (víc generátorů než původních tc)
    const sizes=await pg.evaluate(()=>{
      const m=AREAS[0].missions[0];
      const base=m.tasks().length;
      const ex=window.RPG_TASK_EXTRA_8;
      const bank=(ex&&ex[m.id])?ex[m.id]().length:0;
      return {base,bank,total:base+bank,tc:m.tc};
    });
    ok('Pool mísí základ + banku (větší než tc)', sizes.total>sizes.tc,
       `základ=${sizes.base} + banka=${sizes.bank} = ${sizes.total} (losuje se ${sizes.tc})`);

    // distinkce konkrétních zadání napříč losováním (parametrické varianty)
    const distinct=await pg.evaluate(()=>{
      const m=AREAS[0].missions[0];
      const seen=new Set();
      for(let r=0;r<80;r++){
        let pool=m.tasks();
        const ex=window.RPG_TASK_EXTRA_8;
        if(ex && ex[m.id]) pool=pool.concat(ex[m.id]());
        pool.forEach(t=>seen.add(t.text));
      }
      return seen.size;
    });
    ok('Parametrické varianty dávají desítky různých zadání', distinct>=30, 'různých zadání: '+distinct);

    // 4) MC mise: vše numerické (kontrola distraktorů nespadne)
    const mcSafe=await pg.evaluate(()=>{
      const ex=window.RPG_TASK_EXTRA_8;
      const mcIds=['1-1','2-1','3-1','4-1','5-1','6-1','7-3'];
      for(const id of mcIds){
        for(let r=0;r<200;r++){
          for(const t of ex[id]()){
            const a=String(t.ans);
            if(a==='ANO'||a==='NE') continue;
            if(!isFinite(parseFloat(a.replace(',','.'))) || a.includes('/')) return false;
          }
        }
      }
      return true;
    });
    ok('MC mise mají jen numerické odpovědi', mcSafe);

    // 5) žádné chyby na stránce
    ok('Žádné JS chyby při běhu', perr.length===0, perr.join(' | '));

  }catch(e){ console.error('\nChyba testu:',e.message); fail++; }

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════\n');
  if(fail>0) process.exit(1);
}
run().catch(e=>{console.error(e);process.exit(1);});
