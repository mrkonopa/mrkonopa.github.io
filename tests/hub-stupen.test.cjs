const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..');
const EXEC='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
let pass=0,fail=0;
function ok(c,m){if(c){pass++;console.log('  ✅ '+m);}else{fail++;console.log('  ❌ '+m);}}
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('nf');}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const srv=await serve();const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  const page=await(await browser.newContext({viewport:{width:900,height:1000}})).newPage();
  const jsErrs=[];page.on('pageerror',e=>jsErrs.push(e.message));
  /* Pozn.: ročník karty se od fáze 01 čte z `.badge` vedle názvu — `.gr`
     je nově podtitulek světa („poměry, procenta, trojúhelníky"). */
  console.log('\n━━ hub 1./2. stupeň switch ━━');
  await page.goto(base+'/projects/rpg-matematika.html',{waitUntil:'load'});
  await sleep(1500);
  ok(jsErrs.length===0,'no JS errors at load ('+jsErrs.join(';')+')');
  // default stupeň = 2 → cards are grades 6-9
  let cards=await page.evaluate(()=>Array.from(document.querySelectorAll('#grid .card .badge')).map(e=>e.textContent));
  ok(cards.length===4&&cards.every(c=>['6. ROČNÍK','7. ROČNÍK','8. ROČNÍK','9. ROČNÍK'].includes(c)),'default shows 2. stupeň (6-9): '+cards.join(','));
  // switch to 1. stupeň
  await page.click('#st-1');await sleep(400);
  cards=await page.evaluate(()=>Array.from(document.querySelectorAll('#grid .card .badge')).map(e=>e.textContent));
  ok(cards.length===3&&cards.every(c=>['3. ROČNÍK','4. ROČNÍK','5. ROČNÍK'].includes(c)),'1. stupeň shows 3-5: '+cards.join(','));
  // active button state
  const st1on=await page.evaluate(()=>document.getElementById('st-1').classList.contains('on'));
  ok(st1on,'st-1 button is active after click');
  // battle groups: st=1 visible, st=2 hidden
  const grpVis=await page.evaluate(()=>{const g1=document.querySelector('.hb-grade-group[data-st="1"]');const g2=document.querySelector('.hb-grade-group[data-st="2"]');return {one:g1.style.display,two:g2.style.display};});
  ok(grpVis.one!=='none'&&grpVis.two==='none','battle grade group switched to 1. stupeň (3-5 visible, 6-9 hidden)');
  // persistence: reload keeps stupeň 1
  await page.reload({waitUntil:'load'});await sleep(1200);
  cards=await page.evaluate(()=>Array.from(document.querySelectorAll('#grid .card .badge')).map(e=>e.textContent));
  ok(cards.length===3&&cards.includes('3. ROČNÍK'),'stupeň choice persists across reload: '+cards.join(','));
  // switch back to 2
  await page.click('#st-2');await sleep(400);
  cards=await page.evaluate(()=>Array.from(document.querySelectorAll('#grid .card .badge')).map(e=>e.textContent));
  ok(cards.length===4&&cards.includes('9. ROČNÍK'),'switch back to 2. stupeň works: '+cards.join(','));
  // links resolve to the right files
  const hrefs=await page.evaluate(()=>Array.from(document.querySelectorAll('#grid .card a.btn')).map(a=>a.getAttribute('href')));
  ok(hrefs.some(h=>h&&h.includes('rpg-mat-6.html')),'cards link to game files');

  await browser.close();srv.close();
  console.log('\n══ VÝSLEDEK: '+pass+' ✅  /  '+fail+' ❌ ══\n');
  process.exit(fail>0?1:0);
})();
