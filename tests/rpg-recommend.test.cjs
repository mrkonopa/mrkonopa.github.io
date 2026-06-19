/**
 * Doporučené procvičování na mapě (rpg-mat-6/7/8/9.html)
 * Spusť: node tests/rpg-recommend.test.cjs
 *
 * Ověřuje: mapa doporučí misi s nejvíc chybami, vyloučí zvládnuté (mastered)
 * i mise s <2 chybami, tlačítko „Procvičit" skočí do tréninku té mise,
 * a bez chyb je panel skrytý.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18461;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GAMES = ['6','7','8','9'];

function startServer(){
  const mime={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',json:'application/json'};
  const srv=http.createServer((req,res)=>{let p=req.url.split('?')[0];if(p==='/')p='/index.html';
   try{const fp=path.normalize(path.join(ROOT,p));if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('forbidden');return;}const b=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(b);}catch{res.writeHead(404);res.end('nf');}});
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}
let pass=0,fail=0;
function ok(n,c,d=''){if(c){console.log(`  ✅ ${n}`);pass++;}else{console.log(`  ❌ ${n}${d?' — '+d:''}`);fail++;}}

async function testGame(ctx, g){
  console.log(`\n━━ rpg-mat-${g} ━━`);
  const pg=await ctx.newPage();
  const perr=[];pg.on('pageerror',e=>perr.push(e.message));
  try{
    await pg.goto(`${BASE}/projects/rpg-mat-${g}.html`,{waitUntil:'domcontentloaded'});
    await pg.waitForFunction(()=>typeof recommendedMission==='function'&&typeof AREAS!=='undefined'&&typeof startGame==='function',{timeout:8000});

    // nová postava + nastav chybovost: 3-1 nejvíc (5), 2-2 vysoká ale ZVLÁDNUTÁ (9), 1-1 jen 1 chyba
    await pg.evaluate(()=>{document.getElementById('ni').value='TEST';startGame();});
    await pg.evaluate(()=>{S.errs={'3-1':5,'2-2':9,'1-1':1};S.mastery={'2-2':{score:15,mastered:true}};renderMap();});

    const info=await pg.evaluate(()=>{
      let name='';AREAS.forEach(a=>a.missions.forEach(m=>{if(m.id==='3-1')name=m.name;}));
      const rec=recommendedMission();
      const rp=document.getElementById('map-recommend');
      return {name, recMid:rec&&rec.mid, visible:rp&&rp.style.display!=='none', html:rp?rp.innerHTML:''};
    });
    ok('doporučí misi s nejvíc chybami (3-1)', info.recMid==='3-1', 'vráceno: '+info.recMid);
    ok('zvládnutá mise (2-2, 9 chyb) je vyloučena', info.recMid!=='2-2');
    ok('panel je viditelný', info.visible===true);
    ok('panel obsahuje název mise', info.name&&info.html.indexOf(info.name)>=0, 'název: '+info.name);

    // klik na Procvičit → trénink té mise
    await pg.evaluate(()=>goPractice('3-1'));
    await pg.waitForTimeout(120);
    const tr=await pg.evaluate(()=>({mid:typeof TR!=='undefined'?TR.mid:null, play:document.getElementById('train-play').style.display!=='none', onTrain:document.getElementById('s-train').classList.contains('active')}));
    ok('„Procvičit" spustí trénink správné mise', tr.mid==='3-1'&&tr.play===true, `mid=${tr.mid} play=${tr.play}`);
    ok('je na obrazovce tréninku', tr.onTrain===true);

    // edge: jen 1 chyba nikde ≥2 → panel skrytý
    await pg.evaluate(()=>{S.errs={'4-1':1};S.mastery={};go('map');});
    await pg.waitForTimeout(80);
    const hiddenLow=await pg.evaluate(()=>document.getElementById('map-recommend').style.display==='none');
    ok('mise s <2 chybami nedoporučí (panel skrytý)', hiddenLow===true);

    // edge: žádné chyby → panel skrytý
    await pg.evaluate(()=>{S.errs={};S.mastery={};go('map');});
    await pg.waitForTimeout(80);
    const hiddenNone=await pg.evaluate(()=>document.getElementById('map-recommend').style.display==='none');
    ok('bez chyb panel skrytý', hiddenNone===true);

    ok('žádná JS chyba na stránce', perr.length===0, perr.join(' | '));
  }catch(e){
    ok('běh bez výjimky', false, e.message);
  }finally{ await pg.close(); }
}

async function run(){
  console.log('\n══════════════════════════════════════════');
  console.log('  Doporučené procvičování — 4 ročníky');
  console.log('══════════════════════════════════════════');
  const srv=await startServer();
  const browser=await chromium.launch({headless:true,executablePath:CHROMIUM});
  const ctx=await browser.newContext();
  await ctx.route('**jsdelivr**',r=>r.abort());
  for(const g of GAMES) await testGame(ctx, g);
  await browser.close();
  srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
}
run();
