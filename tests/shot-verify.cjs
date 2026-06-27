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
  const ctx=await browser.newContext({viewport:{width:480,height:900},deviceScaleFactor:1.5});
  const page=await ctx.newPage();
  page.on('pageerror',e=>console.log('[JS ERR]',e.message));
  // G4 learn 1-1 (theory + Matýsek video link)
  await page.goto(base+'/projects/rpg-mat-4.html',{waitUntil:'load'});await sleep(1000);
  await page.evaluate(()=>{document.getElementById('ni').value='Test';startGame();});await sleep(400);
  await page.evaluate(()=>{startLearn('6-1');});await sleep(400);
  await page.screenshot({path:OUT+'/vf-g4-learn-video.png',fullPage:true});
  const href=await page.evaluate(()=>{const a=document.querySelector('.learn-video');return a?a.getAttribute('href'):'NONE';});
  console.log('g4 6-1 video href:', href);
  // G5 7-1 MC battle (6-digit distractors)
  await page.goto(base+'/projects/rpg-mat-5.html',{waitUntil:'load'});await sleep(1000);
  await page.evaluate(()=>{document.getElementById('ni').value='Test';startGame();});await sleep(400);
  await page.evaluate(()=>{const ar=AREAS[6];launchBattle(ar.id,ar.missions[0].id);});await sleep(900);
  await page.screenshot({path:OUT+'/vf-g5-71mc.png'});
  const mc=await page.evaluate(()=>{return Array.from(document.querySelectorAll('#mc-grid .mc-btn')).map(b=>b.textContent);});
  console.log('g5 7-1 MC options:', JSON.stringify(mc));
  await browser.close();srv.close();
  console.log('verify shots saved');
})();
