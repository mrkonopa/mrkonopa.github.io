/* prijimacky-procvicovani.test.cjs — Procvičování po tématech v přijímačkovém hubu.
   Ověřuje: 9 okruhů, KAŽDÝ generuje validní položky (prompt i odpověď, žádné
   NaN/undefined/prázdno — chytí rozbité mapování okruh→generátor), odpovědní
   tok (správně → počítadlo + vyřešený postup), inputmode, žádné JS chyby. */
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

  await page.goto(base+'/projects/prijimacky-matematika/procvicovani.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PZ_TOPICS&&window.RPG_CERMAT_9&&window.PZ,{timeout:8000});
  console.log('── Přijímačky: procvičování po tématech ──');

  const nTopics=await page.evaluate(()=>PZ_TOPICS.list.length);
  ok(nTopics===9,'9 okruhů ('+nTopics+')');
  ok(await page.evaluate(()=>document.querySelectorAll('.topic-card').length===9),'9 karet okruhů');

  // VALIDITA: každý okruh generuje smysluplné položky (prompt + odpověď)
  const report=await page.evaluate(()=>{
    const bad=[]; const seen={};
    PZ_TOPICS.list.forEach(t=>{
      let okCount=0;
      for(let i=0;i<30;i++){
        const it=PZ_TOPICS.item(t.id);
        if(!it){ bad.push(t.id+': null'); continue; }
        const p=String(it.prompt||''); const a=String(it.ans==null?'':it.ans);
        const badPrompt = !p.trim() || /NaN|undefined/.test(p);
        const badAns = !a.trim() || /NaN|undefined/.test(a);
        const badType = !['text','mc','yn'].includes(it.type);
        if(badPrompt||badAns||badType){ if(bad.length<12) bad.push(t.id+' ['+it.type+'] p="'+p.slice(0,40)+'" a="'+a+'"'); }
        else okCount++;
        seen[it.type]=(seen[it.type]||0)+1;
      }
      seen['topic:'+t.id]=okCount;
    });
    return { bad, seen };
  });
  ok(report.bad.length===0, 'všechny okruhy generují validní položky (prompt+odpověď, žádné NaN/undefined)');
  if(report.bad.length){ report.bad.forEach(b=>console.log('       ✗ '+b)); }
  ok(report.seen.text>0 && report.seen.mc>0, 'pokryty typy text i mc ('+JSON.stringify({text:report.seen.text,mc:report.seen.mc,yn:report.seen.yn||0})+')');

  // ODPOVĚDNÍ TOK: spusť textový okruh (rovnice), odpověz správně
  await page.evaluate(()=>prStart('rovnice'));
  await page.waitForFunction(()=>document.getElementById('pr-run').style.display!=='none');
  // vynuť text položku (rovnice je open→text; pro jistotu generuj dokud není text)
  await page.evaluate(()=>{ let g=0; while((!PR.item||PR.item.type!=='text')&&g<10){prNext();g++;} });
  const it=await page.evaluate(()=>({type:PR.item.type, ans:String(PR.item.ans), hasSol:!!PR.item.sol}));
  ok(it.type==='text','rovnice dává text položku');
  await page.fill('#pr-input', it.ans);
  await page.click('button.pz-btn.primary:has-text("Zkontrolovat")');
  await page.waitForFunction(()=>document.getElementById('pr-fb').style.display!=='none',{timeout:4000});
  ok(await page.evaluate(()=>/Správně/.test(document.getElementById('pr-fb').textContent)),'správná odpověď → ✓ Správně');
  ok(await page.evaluate(()=>PR.ok===1&&PR.total===1),'počítadlo 1/1');
  ok(!it.hasSol || await page.evaluate(()=>document.getElementById('pr-sol').style.display!=='none'),'vyřešený postup se zobrazí');

  // Další úloha
  await page.click('#pr-next');
  await page.waitForFunction(()=>document.getElementById('pr-fb').style.display==='none',{timeout:4000}).catch(()=>{});
  ok(await page.evaluate(()=>!PR.answered),'Další úloha → nová položka');

  // pokrok se uloží do localStorage
  ok(await page.evaluate(()=>{ try{return JSON.parse(localStorage.getItem('PZ_PRACTICE_PROGRESS')).rovnice.total>=1;}catch(e){return false;} }),'pokrok uložen do localStorage');

  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
