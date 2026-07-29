/* prijimacky-hints.test.cjs — progresivní 3úrovňové nápovědy v procvičování.
   L1 nasměrování → L2 vzorec/postup → L3 výsledek (oranžová). Odhalují se postupně,
   L3 = správná odpověď, reset u nové úlohy, po odpovědi zamčené. Žádné JS chyby. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
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

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const URL=base+'/projects/prijimacky-matematika/procvicovani.html';
  const browser=await chromium.launch({executablePath:EXEC});
  const errs=[];
  const ctx=await browser.newContext();
  await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page=await ctx.newPage(); page.on('pageerror',e=>errs.push(e.message));
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PZ&&window.PZ_TOPICS&&PZ.hintsFor,{timeout:8000});
  console.log('── Přijímačky: progresivní nápovědy ──');

  // hintsFor přímo: L1/L2 z tématu, L3 = výsledek
  const hf = await page.evaluate(()=>PZ.hintsFor({ans:'42'}, 'procenta'));
  ok(/1 %/.test(hf[0]) && /1 %/.test(hf[1]) === false || /procenta/i.test(hf[0]) || /díl/.test(hf[0]), 'L1 procenta = nasměrování ('+hf[0].slice(0,40)+'…)');
  ok(hf.length===3 && /Výsledek: 42/.test(hf[2]), 'L3 = výsledek (42)');

  // spusť okruh a odhaluj nápovědy postupně
  await page.evaluate(()=>prStart('procenta'));
  await page.waitForFunction(()=>document.getElementById('pr-hintwrap').style.display!=='none',{timeout:4000});
  ok(await page.evaluate(()=>document.querySelectorAll('#pr-hints .pr-hint').length===0), 'na startu žádná nápověda odhalená');

  await page.click('#pr-hint-btn');
  ok(await page.evaluate(()=>document.querySelectorAll('#pr-hints .pr-hint').length===1), '1. klik → L1');
  await page.click('#pr-hint-btn');
  ok(await page.evaluate(()=>document.querySelectorAll('#pr-hints .pr-hint').length===2), '2. klik → L1+L2');
  await page.click('#pr-hint-btn');
  const st = await page.evaluate(()=>({ n:document.querySelectorAll('#pr-hints .pr-hint').length,
    l3:!!document.querySelector('#pr-hints .pr-hint.l3'),
    l3text:(document.querySelector('#pr-hints .pr-hint.l3')||{}).textContent||'',
    disabled:document.getElementById('pr-hint-btn').disabled,
    ansMatch:false }));
  const ansOk = await page.evaluate(()=>{ const l3=document.querySelector('#pr-hints .pr-hint.l3'); return l3 && l3.textContent.includes(String(PR.item.ans)); });
  ok(st.n===3 && st.l3, '3. klik → L1+L2+L3 (L3 zvýrazněná)');
  ok(ansOk, 'L3 obsahuje správnou odpověď úlohy');
  ok(st.disabled, 'po 3/3 je tlačítko nápovědy zamčené');

  // reset u nové úlohy
  await page.evaluate(()=>prNext());
  ok(await page.evaluate(()=>document.querySelectorAll('#pr-hints .pr-hint').length===0 && PR.hintLevel===0 && !document.getElementById('pr-hint-btn').disabled), 'nová úloha → nápovědy resetovány');

  // po odpovědi jsou nápovědy zamčené
  await page.evaluate(()=>{ const i=document.getElementById('pr-input'); if(i)i.value=String(PR.item.ans); if(PR.item.type==='yn')prSubmitYN(PR.item.ans); else if(PR.item.type==='mc'){const r=document.querySelector('input[name="pr-mc"]');if(r)r.checked=true;prSubmit();} else prSubmit(); });
  ok(await page.evaluate(()=>document.getElementById('pr-hint-btn').disabled), 'po odpovědi je nápověda zamčená');

  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
