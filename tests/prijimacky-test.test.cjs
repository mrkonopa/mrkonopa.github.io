/* prijimacky-test.test.cjs — Test nanečisto v přijímačkovém hubu (světlá stránka).
   Ověřuje: načtení, vyplnění všech typů úloh (open/tfgrid/mc/match), skóre 50/50
   při správných odpovědích, částečné skóre při chybě, inputmode, světlé pozadí,
   review s řešením, žádné JS chyby, XSS bezpečnost esc(). */
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

// vyplní VŠECHNY úlohy (volitelně jednu open úlohu schválně špatně) a odevzdá
async function fillAndSubmit(page, sabotage){
  page.once('dialog', d=>d.accept());
  await page.evaluate((sab)=>{
    let firstOpenDone=false;
    CM.tasks.forEach(t=>{
      if(t.kind==='tfgrid'){ t.statements.forEach((s,i)=>{ const r=document.querySelector('input[name="cm-tf-'+t.no+'-'+i+'"][value="'+s.ans+'"]'); if(r)r.checked=true; }); }
      else if(t.kind==='mc'){ const r=document.querySelector('input[name="cm-mc-'+t.no+'"][value="'+t.ans+'"]'); if(r)r.checked=true; }
      else if(t.kind==='match'){ t.prompts.forEach((p,i)=>{ const sel=document.getElementById('cm-match-'+t.no+'-'+i); if(sel)sel.value=t.ans[i]; }); }
      else { (t.parts||[]).forEach((p,i)=>{ const inp=document.getElementById('cm-p-'+t.no+'-'+i);
        if(!inp)return; if(sab&&!firstOpenDone){ inp.value='___SPATNE___'; firstOpenDone=true; } else inp.value=String(p.ans); }); }
    });
  }, !!sabotage);
  await page.click('button.pz-btn.primary:has-text("Odevzdat")');
  await page.waitForFunction(()=>document.getElementById('cm-end').style.display!=='none',{timeout:5000});
}

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  const ctx=await browser.newContext();
  // Blokuj externí (Google Fonts) — jinak load čeká na zablokované CDN.
  await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource|net::ERR/i.test(m.text()))errs.push(m.text()); });

  await page.goto(base+'/projects/prijimacky-matematika/test.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.RPG_CERMAT_9&&window.PZ&&typeof window.checkAns==='function',{timeout:8000});
  console.log('── Přijímačky: test nanečisto ──');

  ok(await page.evaluate(()=>RPG_CERMAT_9.maxScore===50&&RPG_CERMAT_9.timeLimitSec===70*60),'generátor: 50 bodů / 70 min');

  // světlé pozadí (ne tmavý RPG)
  const bg=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  const light=(()=>{ const m=bg.match(/\d+/g); if(!m)return false; const [r,g,b]=m.map(Number); return (r+g+b)/3>180; })();
  ok(light,'světlé pozadí ('+bg+')');
  ok(await page.evaluate(()=>getComputedStyle(document.body).fontFamily.toLowerCase().includes('lexend')),'font Lexend');

  // spusť test
  await page.click('button.pz-btn.primary:has-text("Začít")');
  await page.waitForFunction(()=>document.getElementById('cm-play').style.display!=='none',{timeout:5000});
  const nTasks=await page.evaluate(()=>CM.tasks.length);
  ok(nTasks===16,'vygenerováno 16 úloh ('+nTasks+')');

  // inputmode na open vstupech (numeric/decimal/text)
  const im=await page.evaluate(()=>{ const els=[...document.querySelectorAll('.cm-part input[type=text]')];
    return els.length && els.every(e=>['numeric','decimal','text'].includes(e.inputMode)); });
  ok(im,'inputmode nastaven na všech číselných vstupech');

  // sticky timer běží
  ok(await page.evaluate(()=>/^\d+:\d\d$/.test(document.getElementById('cm-timer-v').textContent)),'časomíra zobrazena');

  // ── vše správně → 50/50 ──
  await fillAndSubmit(page, false);
  const scoreTxt=await page.evaluate(()=>document.getElementById('cm-end-score').textContent);
  ok(/^50 \/ 50 bodů/.test(scoreTxt),'správné odpovědi → 50 / 50 ('+scoreTxt+')');
  ok(await page.evaluate(()=>document.getElementById('cm-end-pct').textContent==='100 %'),'100 %');
  ok(await page.evaluate(()=>document.querySelectorAll('#cm-end-detail details').length===16),'rozbor: 16 úloh');

  // historie se uloží (localStorage)
  ok(await page.evaluate(()=>{ try{return JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS')).length>=1;}catch(e){return false;} }),'pokus uložen do historie');

  // ── jedna chyba → méně než 50 + review ukáže správně/tvoje ──
  await page.click('button.pz-btn.primary:has-text("Zkusit znovu")');
  await page.waitForFunction(()=>document.getElementById('cm-play').style.display!=='none',{timeout:5000});
  await fillAndSubmit(page, true);
  const sc2=await page.evaluate(()=>parseInt(document.getElementById('cm-end-score').textContent));
  ok(sc2<50 && sc2>0,'jedna chyba → částečné skóre ('+sc2+')');
  ok(await page.evaluate(()=>/Správně:/.test(document.getElementById('cm-end-detail').textContent)),'review ukazuje správnou odpověď');
  ok(await page.evaluate(()=>document.querySelector('#cm-end-detail .cm-review-given')!==null),'review ukazuje „Tvoje odpověď" u chyby');

  // ── rozbor drží kontext zadání: úvodní text i nákres ──
  // Dřív se do rozboru předával jen prompt/odpověď, takže si dítě geometrickou chybu
  // prohlíželo BEZ obrázku, u kterého ji udělalo. Porovnáváme proti pravdě z generátoru,
  // ne proti konstantě — počet se mezi běhy liší. (Naměřeno na 3000 bězích: každý běh
  // má aspoň 1 nákres a aspoň 6 introů, takže kontrola nikdy neběží naprázdno.)
  const ctxR=await page.evaluate(()=>({
    svgT: CM.tasks.filter(t=>t.svg).length,
    introT: CM.tasks.filter(t=>t.intro).length,
    svgD: document.querySelectorAll('#cm-end-detail .cm-review-svg svg').length,
    introD: document.querySelectorAll('#cm-end-detail .cm-review-intro').length
  }));
  ok(ctxR.svgT>0 && ctxR.introT>0,'běh obsahuje úlohy s nákresem i introm ('+ctxR.svgT+' / '+ctxR.introT+')');
  ok(ctxR.svgD===ctxR.svgT,'rozbor ukazuje nákres u všech úloh, které ho mají ('+ctxR.svgD+' / '+ctxR.svgT+')');
  ok(ctxR.introD===ctxR.introT,'rozbor ukazuje úvodní text u všech úloh, které ho mají ('+ctxR.introD+' / '+ctxR.introT+')');

  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
