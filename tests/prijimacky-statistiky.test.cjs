/* prijimacky-statistiky.test.cjs — Statistiky (lokální pokrok) v hubu.
   Naseeduje localStorage a ověří výpočty: odhad připravenosti z MEDIÁNU
   posledních tří testů (pokusy schválně neseřazené), nejlepší test, trend,
   „kde ztrácíš body" po úlohách testu, úrovně z diagnostiky v mapě témat,
   starý tvar dat (bez bodů po úlohách, diagnostika jen ✓/✗), podvržená data
   a prázdný stav. Žádné JS chyby. */
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

// Body po úlohách: plný počet všude kromě úlohy 11 (2 ze 4) a 15 (2 ze 6).
// Skóre a body po úlohách se v seedu navzájem nekontrolují — stránka je nesčítá.
const MAX = [1,2,4,4,4,4,3,3,3,3,4,2,2,2,6,3];
const U = MAX.map((m,i)=>i===10?[2,4,'geometrie']:i===14?[2,6,'procenta']:[m,m,null]);
const seed = (att, diag, prac) => `
localStorage.setItem('PZ_CERMAT_ATTEMPTS', ${JSON.stringify(JSON.stringify(att))});
localStorage.setItem('PZ_PRACTICE_PROGRESS', ${JSON.stringify(JSON.stringify(prac||{}))});
${diag?`localStorage.setItem('PZ_DIAG_LAST', ${JSON.stringify(JSON.stringify(diag))});`:''}`;
const PRAC = { rovnice:{ok:8,total:10}, zlomky:{ok:2,total:8} };

async function otevri(browser, base, init, errs){
  const ctx=await browser.newContext();
  await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));
  if(init) await page.addInitScript(init);
  await page.goto(base+'/projects/prijimacky-matematika/statistiky.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PZ&&window.PZ_TOPICS&&document.querySelectorAll('#st-big .st-stat').length===4,{timeout:8000});
  return { ctx, page };
}
const big = page => page.evaluate(()=>[...document.querySelectorAll('#st-big .st-stat .v')].map(e=>e.textContent));
const txt = (page, id) => page.evaluate(id=>document.getElementById(id).textContent, id);

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  const errs=[];
  console.log('── Přijímačky: statistiky ──');

  // ── A) nový tvar: body po úlohách, neseřazené pokusy, diagnostika s úrovněmi ──
  {
    const att=[
      {date:'2026-01-01',t:1000,score:30,max:50,cas:3000,ulohy:U},
      {date:'2026-01-02',t:2000,score:40,max:50,cas:3600,ulohy:U},
      {date:'2026-01-03',t:3000,score:36,max:50,ulohy:U},
      {date:'2025-12-01',score:50,max:50}];          // nejstarší až na konci pole
    // bez řazení by „poslední tři" byly 40, 36, 50 → medián 40 → 80 % (ne 72 %)
    const diag={date:'2026-01-04',ver:2,ok:12,n:20,topics:[{id:'zlomky',level:1,correct:false},{id:'rovnice',level:3,correct:true}]};
    const {ctx,page}=await otevri(browser,base,seed(att,diag,PRAC),errs);
    const b=await big(page);
    // poslední tři (po seřazení) 30, 40, 36 → medián 36 → 72 %; nejlepší 50 (ten starý); procvičování 18; testů 4
    ok(b[0]==='72 %','připravenost z mediánu posledních 3 testů = 72 % ('+b[0]+')');
    ok(/≈ 36 \/ 50 b\. · medián posledních 3 testů/.test(await txt(page,'st-big')),'popisek zdroje: ≈ 36 / 50 b.');
    ok(b[1]==='50 / 50' && b[2]==='18' && b[3]==='4','nejlepší 50/50, 18 úloh, 4 testy ('+b.slice(1).join(' | ')+')');
    const pokusy=await page.evaluate(()=>[...document.querySelectorAll('#st-tests .st-attempt')].map(e=>e.textContent));
    ok(pokusy.length===4 && /2026-01-03/.test(pokusy[0]) && /2025-12-01/.test(pokusy[3]),'trend: od nejnovějšího, i když pole seřazené nebylo');
    ok(/50 min/.test(pokusy[2]) && /60 min/.test(pokusy[1]),'u pokusu je čas do odevzdání');
    ok(!/Trend:/.test(await txt(page,'st-tests')),'trend se neukáže, dokud nejsou aspoň 2 × 3 testy');
    const z=await page.evaluate(()=>({ t:document.getElementById('st-ztraty').textContent,
      rows:[...document.querySelectorAll('#st-ztraty .st-bar-row')].map(r=>({t:r.textContent, a:(r.querySelector('a')||{getAttribute:()=>''}).getAttribute('href')})) }));
    ok(/V posledních 3 testech ztrácíš průměrně 6 b\. Nejvíc v úlohách 15 a 11\./.test(z.t),'ztráty: celkem 6 b., nejvíc v úlohách 15 a 11');
    ok(z.rows.length===2 && /^Úloha 15/.test(z.rows[0].t) && /−4 \/ 6 b\./.test(z.rows[0].t) && /−2 \/ 4 b\./.test(z.rows[1].t),'ztráty po úlohách: −4 / 6 a −2 / 4 ('+z.rows.map(r=>r.t.replace(/\s+/g,' ')).join(' | ')+')');
    ok(/okruh=procenta$/.test(z.rows[0].a) && /Procenta/.test(z.rows[0].t),'úloha nese svůj okruh a prolinkuje do procvičování');
    ok(await page.evaluate(()=>document.querySelectorAll('#st-topics .st-bar-row').length===PZ_TOPICS.list.length),'mapa témat: všechny okruhy');
    ok(await page.evaluate(()=>{ const names=[...document.querySelectorAll('#st-topics .st-bar-name')].map(e=>e.textContent); const iz=names.findIndex(n=>/Zlomky/.test(n)), ir=names.findIndex(n=>/Rovnice/.test(n)); return iz>=0&&ir>=0&&iz<ir; }),'mapa: slabší (zlomky) nad silnějším (rovnice)');
    ok(await page.evaluate(()=>{ const r=[...document.querySelectorAll('#st-topics .st-bar-name')].find(e=>/Zlomky/.test(e.textContent)); return r && /🧭 Základ máš/.test(r.textContent); }),'mapa: úroveň z diagnostiky u tématu');
    const d=await txt(page,'st-diag');
    ok(/12 \/ 20 správně/.test(d) && /Zvládáš 1 z 2/.test(d) && /Zlomky a desetinná čísla \(základ máš\)/.test(d),'diagnostika: úrovně a co nejvíc chybí');
    await ctx.close();
  }

  // ── B) starý tvar: pokusy bez bodů po úlohách, diagnostika jen ✓/✗ ──
  {
    const att=[{date:'2026-01-01',score:30,max:50},{date:'2026-01-02',score:40,max:50}];
    const diag={date:'2026-01-03',ok:7,n:10,topics:[{id:'rovnice',correct:true},{id:'zlomky',correct:false}]};
    const {ctx,page}=await otevri(browser,base,seed(att,diag,PRAC),errs);
    const b=await big(page);
    ok(b[0]==='70 %','starý tvar: medián 30 a 40 = 35 b. = 70 % ('+b[0]+')');
    ok(/Po dalším testu nanečisto/.test(await txt(page,'st-ztraty')),'starý tvar: bez bodů po úlohách výzva místo ztrát');
    const d=await txt(page,'st-diag');
    ok(/7 \/ 10/.test(d) && /Zlomky/.test(d),'starý tvar diagnostiky: 7/10 a slabé téma');
    await ctx.close();
  }

  // ── C) trend: šest testů, poslední tři o 10 bodů lepší ──
  {
    const att=[20,20,20,30,30,30].map((s,i)=>({date:'2026-02-0'+(i+1),t:i+1,score:s,max:50}));
    const {ctx,page}=await otevri(browser,base,seed(att,null,null),errs);
    ok(/Trend: 📈 \+10 b\./.test(await txt(page,'st-tests')),'trend: 📈 +10 b.');
    ok((await big(page))[0]==='60 %','připravenost bez procvičování jen z testů (60 %)');
    await ctx.close();
  }

  // ── D) podvržená data: nesmí spadnout ani nic vložit do stránky ──
  {
    const att=[{date:'2026-03-01',score:25,max:50,ulohy:[[1e9,'x','__proto__'],null,'x',[5,2,'<img src=x onerror="window.__xss=1">']]},
               'nesmysl', null, {date:{a:1},score:'abc'}];
    const {ctx,page}=await otevri(browser,base,seed(att,{ver:2,topics:[{id:'<b>x</b>',level:9},{id:'zlomky',level:'2'}]},null),errs);
    ok(await page.evaluate(()=>!window.__xss && !document.querySelector('#st-ztraty img, #st-diag b img')),'podvržené body po úlohách ani okruh nic nevloží');
    ok(await page.evaluate(()=>document.querySelectorAll('#st-ztraty .st-bar-row').length<=2),'nesmyslné položky se zahodí nebo oříznou');
    await ctx.close();
  }

  // ── E) prázdný stav ──
  {
    const {ctx,page}=await otevri(browser,base,null,errs);
    ok((await big(page))[0]==='—','prázdný stav: připravenost —');
    ok(/Zatím žádný test/.test(await txt(page,'st-tests')),'prázdný stav: výzva k testu');
    ok(/Po dalším testu nanečisto/.test(await txt(page,'st-ztraty')),'prázdný stav: ztráty čekají na test');
    await ctx.close();
  }

  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));
  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
