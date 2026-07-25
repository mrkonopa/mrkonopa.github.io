/* prijimacky-statistiky.test.cjs — Statistiky (lokální pokrok) v hubu.
   Naseeduje localStorage a ověří výpočty: odhad připravenosti, nejlepší test,
   trend, mastery per téma, poslední diagnostika + prázdný stav. Žádné JS chyby. */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml' };

function serve(){ return new Promise(res=>{ const s=http.createServer((q,p)=>{
  let u=decodeURIComponent(q.url.split('?')[0]); if(u.endsWith('/'))u+='index.html';
  const fp=path.normalize(path.join(ROOT,u));
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){p.writeHead(404);return p.end('nf');}
  p.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});
  fs.createReadStream(fp).pipe(p);
}); s.listen(0,()=>res(s)); }); }

let pass=0, fail=0;
const ok=(c,m)=>{ if(c){pass++;console.log('  ✅ '+m);} else {fail++;console.log('  ❌ '+m);} };

const SEED = `
localStorage.setItem('PZ_CERMAT_ATTEMPTS', JSON.stringify([
  {date:'2026-01-01',score:30,max:50},{date:'2026-01-02',score:40,max:50}]));
localStorage.setItem('PZ_PRACTICE_PROGRESS', JSON.stringify({
  rovnice:{ok:8,total:10}, zlomky:{ok:2,total:8}}));
localStorage.setItem('PZ_DIAG_LAST', JSON.stringify({date:'2026-01-03',ok:7,n:10,
  topics:[{id:'rovnice',correct:true},{id:'zlomky',correct:false}]}));
`;

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  const errs=[];

  // ── se seedem ──
  const ctx=await browser.newContext();
  await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));
  await page.addInitScript(SEED);
  await page.goto(base+'/projects/prijimacky-matematika/statistiky.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PZ&&window.PZ_TOPICS,{timeout:8000});
  await page.waitForFunction(()=>document.querySelectorAll('#st-big .st-stat').length===4,{timeout:4000});
  console.log('── Přijímačky: statistiky ──');

  const big=await page.evaluate(()=>[...document.querySelectorAll('#st-big .st-stat .v')].map(e=>e.textContent));
  // best 40/50 → 80 %, prac 10/18 → 56 %, ready=avg(80,56)=68
  ok(big[0]==='68 %','odhad připravenosti 68 % ('+big[0]+')');
  ok(big[1]==='40 / 50','nejlepší test 40/50 ('+big[1]+')');
  ok(big[2]==='18','vyřešených úloh 18 ('+big[2]+')');
  ok(big[3]==='2','odevzdaných testů 2 ('+big[3]+')');
  ok(await page.evaluate(()=>document.querySelectorAll('#st-tests .st-attempt').length===2),'trend: 2 pokusy');
  ok(await page.evaluate(()=>document.querySelectorAll('#st-topics .st-bar-row').length===2),'mastery: 2 témata');
  ok(await page.evaluate(()=>/7 \/ 10/.test(document.getElementById('st-diag').textContent)),'diagnostika 7/10');
  ok(await page.evaluate(()=>/Zlomky/i.test(document.getElementById('st-diag').textContent)),'diagnostika ukazuje slabé téma');
  await ctx.close();

  // ── prázdný stav ──
  const ctx2=await browser.newContext();
  await ctx2.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page2=await ctx2.newPage(); page2.on('pageerror',e=>errs.push(e.message));
  await page2.goto(base+'/projects/prijimacky-matematika/statistiky.html',{waitUntil:'domcontentloaded'});
  await page2.waitForFunction(()=>document.querySelectorAll('#st-big .st-stat').length===4,{timeout:6000});
  ok(await page2.evaluate(()=>document.querySelector('#st-big .st-stat .v').textContent==='—'),'prázdný stav: připravenost —');
  ok(await page2.evaluate(()=>/Zatím žádný test/.test(document.getElementById('st-tests').textContent)),'prázdný stav: výzva k testu');
  await ctx2.close();

  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
