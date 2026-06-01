/**
 * Trénink + mastery v rpg-mat-9.html
 * Spusť: node tests/rpg-train.test.cjs
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18435;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function startServer(){
  const mime={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',json:'application/json'};
  const srv=http.createServer((req,res)=>{let p=req.url.split('?')[0];if(p==='/')p='/index.html';
   try{const b=fs.readFileSync(path.join(ROOT,p));res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(b);}catch{res.writeHead(404);res.end('nf');}});
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}
let pass=0,fail=0;
function ok(n,c,d=''){if(c){console.log(`  ✅ ${n}`);pass++;}else{console.log(`  ❌ ${n}${d?' — '+d:''}`);fail++;}}

async function run(){
  console.log('\n══════════════════════════════════════════');
  console.log('  rpg-mat-9 — Trénink + mastery');
  console.log('══════════════════════════════════════════\n');
  const srv=await startServer();
  const browser=await chromium.launch({headless:true,executablePath:CHROMIUM});
  const ctx=await browser.newContext();
  await ctx.route('**jsdelivr**',r=>r.abort());
  const pg=await ctx.newPage();
  const perr=[];pg.on('pageerror',e=>perr.push(e.message));
  try{
    await pg.goto(`${BASE}/projects/rpg-mat-9.html`,{waitUntil:'domcontentloaded'});
    await pg.waitForFunction(()=>typeof startTrain==='function'&&typeof AREAS!=='undefined',{timeout:8000});

    // start game + otevři trénink
    await pg.evaluate(()=>{document.getElementById('ni').value='TRENER';startGame();});
    await pg.evaluate(()=>go('train'));
    await pg.waitForTimeout(150);

    const pickerShown=await pg.evaluate(()=>document.getElementById('s-train').classList.contains('active')&&document.getElementById('train-picker').style.display!=='none');
    ok('Trénink — výběr tématu zobrazen', pickerShown);
    const btnCount=await pg.evaluate(()=>document.querySelectorAll('#train-list .ms-item').length);
    ok('Výběr nabízí všech 21 misí', btnCount===21, 'tlačítek: '+btnCount);

    // spusť trénink mise 1-2 (input, ne MC)
    await pg.evaluate(()=>startTrain('1-2'));
    await pg.waitForTimeout(150);
    const playShown=await pg.evaluate(()=>document.getElementById('train-play').style.display!=='none');
    ok('Procvičování spuštěno', playShown);
    const hasTask=await pg.evaluate(()=>!!(TR.task&&TR.task.text&&typeof TR.task.ans!=='undefined'));
    ok('Úloha vylosována z poolu', hasTask);

    // odpověz správně 15× → mistrovství
    const res=await pg.evaluate(async()=>{
      for(let i=0;i<MASTERY_GOAL;i++){
        document.getElementById('tr-ans').value=String(TR.task.ans);
        trSubmit();
        trNext();
      }
      return {score:S.mastery['1-2'].score, mastered:S.mastery['1-2'].mastered, correct:TR.correct, total:TR.total};
    });
    ok('15 správných → mastery score = 15', res.score===15, 'score: '+res.score);
    ok('Mistrovství splněno (mastered=true)', res.mastered===true);
    ok('Počítadlo správných sedí', res.correct===15&&res.total===15, `correct=${res.correct} total=${res.total}`);

    // špatná odpověď nuluje sérii a nezvyšuje mastery
    const wrong=await pg.evaluate(()=>{
      const before=S.mastery['1-2'].score;
      document.getElementById('tr-ans').value='999999';
      trSubmit();
      return {streak:TR.streak, scoreSame:S.mastery['1-2'].score===before};
    });
    ok('Špatná odpověď vynuluje sérii', wrong.streak===0);
    ok('Špatná odpověď nezvýší mastery', wrong.scoreSame);

    // mastery se ukládá do localStorage (přežije reload)
    await pg.reload({waitUntil:'domcontentloaded'});
    await pg.waitForFunction(()=>typeof loadS==='function',{timeout:8000});
    const persisted=await pg.evaluate(()=>{loadS();return S.mastery&&S.mastery['1-2']&&S.mastery['1-2'].mastered;});
    ok('Mastery přežije reload (uloženo v save)', persisted===true);

    // badge 🏅 v seznamu oblasti
    const badge=await pg.evaluate(()=>{openArea(1);return document.getElementById('mission-list').innerHTML.includes('🏅');});
    ok('Badge 🏅 u zvládnuté mise v oblasti', badge);

    ok('Žádné JS chyby', perr.length===0, perr.join(' | '));
  }catch(e){console.error('\nChyba testu:',e.message);fail++;}
  await browser.close();srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════\n');
  if(fail>0)process.exit(1);
}
run().catch(e=>{console.error(e);process.exit(1);});
