/* prijimacky-diagnostika.test.cjs — Diagnostika (mapa slabin) v přijímačkovém hubu.
   Ověřuje: 9 úloh napříč tématy, průchod, mapa po tématech (✓/✗), doporučení
   se prolinkem do procvičování, uložení do localStorage, žádné JS chyby. */
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

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  const ctx=await browser.newContext();
  await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource|net::ERR/i.test(m.text()))errs.push(m.text()); });

  await page.goto(base+'/projects/prijimacky-matematika/diagnostika.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PZ_TOPICS&&window.RPG_CERMAT_9&&window.PZ,{timeout:8000});
  console.log('── Přijímačky: diagnostika ──');

  await page.click('button.pz-btn.primary:has-text("Začít")');
  await page.waitForFunction(()=>document.getElementById('dg-run').style.display!=='none',{timeout:5000});
  const n=await page.evaluate(()=>DG.seq.length);
  ok(n===9,'9 úloh napříč tématy ('+n+')');

  // odpověz všechny správně, kromě 5. (index 4) schválně špatně
  for(let q=0;q<n;q++){
    await page.evaluate((wrongIdx)=>{
      const cur=DG.seq[DG.i], it=cur.item; const makeWrong=(DG.i===wrongIdx);
      if(it.type==='mc'){ const letters=it.options.map(o=>o.charAt(0));
        const val=makeWrong?(letters.find(l=>l!==it.ans)||letters[0]):it.ans;
        const r=document.querySelector('input[name="dg-mc"][value="'+val+'"]'); if(r)r.checked=true; dgSubmit(); }
      else if(it.type==='yn'){ dgSubmitYN(makeWrong?(it.ans==='A'?'N':'A'):it.ans); }
      else { document.getElementById('dg-input').value=makeWrong?'___WRONG___':String(it.ans); dgSubmit(); }
    }, 4);
  }

  await page.waitForFunction(()=>document.getElementById('dg-end').style.display!=='none',{timeout:5000});
  ok(await page.evaluate(()=>/8 \/ 9 správně/.test(document.getElementById('dg-score').textContent)),'skóre 8/9 (jedna schválně špatně)');
  ok(await page.evaluate(()=>document.querySelectorAll('#dg-map .dg-map-row').length===9),'mapa: 9 řádků po tématech');
  ok(await page.evaluate(()=>document.querySelectorAll('#dg-map .dg-dot.bad').length===1),'právě 1 téma červené');
  ok(await page.evaluate(()=>{const a=document.querySelector('#dg-map a');return a&&/procvicovani\.html\?okruh=/.test(a.getAttribute('href'));}),'„Procvičit" prolinkuje na okruh');
  ok(await page.evaluate(()=>/Doporučení/.test(document.getElementById('dg-reco-wrap').textContent)),'doporučení na slabé téma');
  ok(await page.evaluate(()=>{ try{const d=JSON.parse(localStorage.getItem('PZ_DIAG_LAST'));return d.ok===8&&d.topics.length===9;}catch(e){return false;} }),'diagnostika uložena do localStorage');

  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
