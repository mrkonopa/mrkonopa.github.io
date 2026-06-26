const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..');
const EXEC='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('nf');}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const srv=await serve();const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  const page=await(await browser.newContext({viewport:{width:480,height:820}})).newPage();
  await page.goto(base+'/projects/'+process.argv[2],{waitUntil:'load'});
  await sleep(1500);
  await page.evaluate(()=>{document.getElementById('ni').value='Test';startGame();});
  await sleep(400);
  // launch a battle in area picked from argv[3]
  const aid=parseInt(process.argv[3]||'3');
  await page.evaluate((aid)=>{const ar=AREAS[aid-1];launchBattle(ar.id,ar.missions[2].id);},aid);
  await sleep(900);
  await page.screenshot({path:'/tmp/claude-0/-home-user-mrkonopa-github-io/003acab7-a9a6-5f0a-9129-a3817d502e78/scratchpad/'+process.argv[4]});
  await browser.close();srv.close();
  console.log('shot saved');
})();
