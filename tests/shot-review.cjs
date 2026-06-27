// Visual review: capture intro / map / area / learn / battle for grades 3,4,5
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..');
const EXEC='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT='/tmp/claude-0/-home-user-mrkonopa-github-io/003acab7-a9a6-5f0a-9129-a3817d502e78/scratchpad';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('nf');}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const srv=await serve();const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  for(const g of [3,4,5]){
    const ctx=await browser.newContext({viewport:{width:480,height:860},deviceScaleFactor:1.5});
    const page=await ctx.newPage();
    page.on('pageerror',e=>console.log(`  [g${g} JS ERROR] ${e.message}`));
    await page.goto(base+`/projects/rpg-mat-${g}.html`,{waitUntil:'load'});
    await sleep(1200);
    await page.screenshot({path:`${OUT}/rev-g${g}-1intro.png`});
    await page.evaluate(()=>{document.getElementById('ni').value='Test';startGame();});
    await sleep(700);
    await page.screenshot({path:`${OUT}/rev-g${g}-2map.png`});
    // area view (area 1 mission picker)
    await page.evaluate(()=>{openArea(AREAS[0].id);});
    await sleep(500);
    await page.screenshot({path:`${OUT}/rev-g${g}-3area.png`});
    // learn theory screen for mission 1-1
    await page.evaluate(()=>{startLearn('1-1');});
    await sleep(500);
    await page.screenshot({path:`${OUT}/rev-g${g}-4learn.png`,fullPage:true});
    // battle in area 4 boss mission
    await page.evaluate(()=>{const ar=AREAS[3];launchBattle(ar.id,ar.missions[2].id);});
    await sleep(1000);
    await page.screenshot({path:`${OUT}/rev-g${g}-5battle.png`});
    // an MC battle (area 1 mission 1 is usually mc:true)
    await page.evaluate(()=>{const ar=AREAS[0];launchBattle(ar.id,ar.missions[0].id);});
    await sleep(1000);
    await page.screenshot({path:`${OUT}/rev-g${g}-6mc.png`});
    await ctx.close();
    console.log(`g${g} shots done`);
  }
  await browser.close();srv.close();
  console.log('ALL shots saved to',OUT);
})();
