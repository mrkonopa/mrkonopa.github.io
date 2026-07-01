/**
 * Letní prázdniny věže legend (fáze 17) — červenec + srpen je věž zavřená:
 *  - prázdninová obrazovka (uklízečka + text, otevře se 1. září),
 *  - nejde vstoupit (twStart zablokován, žádné tlačítko),
 *  - hranice dat: 30.6. otevřeno, 1.7. zavřeno, 31.8. zavřeno, 1.9. otevřeno,
 *  - mimo prázdniny věž funguje normálně (hrdina, tlačítko vstupu),
 *  - reduced-motion nespadne,
 *  - žádné JS chyby, ve všech 4 hrách (6/7/8/9).
 * Spusť: node tests/rpg-tower-holiday.test.cjs
 */
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..');
const EXEC='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end('nf');}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'x'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0;
const ok=(n,c,d='')=>{if(c){console.log('  ✅ '+n);pass++;}else{console.log('  ❌ '+n+(d?' — '+d:''));fail++;}};

async function openTower(browser,base,N,date,rm){
  const ctx=await browser.newContext({viewport:{width:600,height:760}});
  await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1')?r.continue():r.abort());
  await ctx.addInitScript(d=>{window.__TW_TESTNOW=d;},date);
  if(rm)await ctx.addInitScript(()=>{try{document.documentElement.classList.add('reduced-motion');}catch(e){}});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e.message).slice(0,120)));
  await page.goto(`${base}/projects/rpg-mat-${N}.html`,{waitUntil:'domcontentloaded'});await sleep(500);
  await page.evaluate(()=>{document.getElementById('ni').value='LEGENDA';startGame();});await sleep(200);
  if(rm)await page.evaluate(()=>{try{document.documentElement.classList.add('reduced-motion');}catch(e){}});
  await page.evaluate(()=>{go('tower');renderTowerGate();});await sleep(800);
  return {ctx,page,errs};
}

(async()=>{
  const srv=await serve();const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});

  // ── hranice dat (stačí na 9. ročníku, logika je sdílená) ──
  console.log('\n━━ hranice dat (9. ročník) ━━');
  for(const [date,expect] of [['2026-05-15T10:00:00',false],['2026-06-30T10:00:00',false],['2026-07-01T10:00:00',true],['2026-08-31T10:00:00',true],['2026-09-01T10:00:00',false]]){
    const {ctx,page}=await openTower(browser,base,9,date,false);
    const onHol=await page.evaluate(()=>twHoliday().on);
    ok(`${date.slice(0,10)}: prázdniny=${expect}`,onHol===expect,'dostal '+onHol);
    await ctx.close();
  }

  for(const N of [6,7,8,9]){
    console.log(`\n━━ ${N}. ročník ━━`);
    // PRÁZDNINY (červenec)
    {
      const {ctx,page,errs}=await openTower(browser,base,N,'2026-07-15T10:00:00',false);
      const s=await page.evaluate(()=>({
        holiday:TW.holiday,
        status:(document.getElementById('tw-gate-status').textContent||''),
        actions:(document.getElementById('tw-gate-actions').innerHTML||''),
        rulesHidden:document.getElementById('tw-rules')?getComputedStyle(document.getElementById('tw-rules')).display==='none':false,
        canStart:(()=>{const b=TW.on;twStart();const r=TW.on;TW.on=b;return r;})(),
      }));
      ok(`g${N}: TW.holiday=true`,s.holiday===true);
      ok(`g${N}: text zmiňuje úklid + 1. září`,/úklid/i.test(s.status)&&/1\. září/.test(s.status),s.status.slice(0,60));
      ok(`g${N}: žádné tlačítko vstupu`,s.actions.trim()==='',s.actions.slice(0,40));
      ok(`g${N}: pravidla schovaná`,s.rulesHidden);
      ok(`g${N}: twStart() nespustí výstup`,s.canStart===false);
      // nech animaci proběhnout pár snímků (uklízečka + prach) — nesmí spadnout
      await sleep(500);
      const re=errs.filter(e=>!/ERR_CERT|net::|jsdelivr|supabase/i.test(e));
      ok(`g${N}: žádné JS chyby (prázdniny)`,re.length===0,re.slice(0,2).join(' | '));
      await ctx.close();
    }
    // MIMO PRÁZDNINY (květen) — věž normální
    {
      const {ctx,page,errs}=await openTower(browser,base,N,'2026-05-15T10:00:00',false);
      const s=await page.evaluate(()=>({holiday:TW.holiday,actions:document.getElementById('tw-gate-actions').innerHTML||''}));
      ok(`g${N}: mimo prázdniny NENÍ holiday`,s.holiday===false);
      ok(`g${N}: mimo prázdniny je tlačítko vstupu`,/VSTOUPIT|PŘIHLÁSIT/.test(s.actions),s.actions.slice(0,40));
      const re=errs.filter(e=>!/ERR_CERT|net::|jsdelivr|supabase/i.test(e));
      ok(`g${N}: žádné JS chyby (mimo prázdniny)`,re.length===0,re.slice(0,2).join(' | '));
      await ctx.close();
    }
    // reduced-motion o prázdninách
    {
      const {ctx,page,errs}=await openTower(browser,base,N,'2026-07-15T10:00:00',true);
      await sleep(400);
      const re=errs.filter(e=>!/ERR_CERT|net::|jsdelivr|supabase/i.test(e));
      ok(`g${N}: reduced-motion o prázdninách nespadne`,re.length===0,re.slice(0,2).join(' | '));
      await ctx.close();
    }
  }

  await browser.close();srv.close();
  console.log(`\n══════════ VÝSLEDEK: ${pass} ✅ / ${fail} ❌ ══════════`);
  if(fail)process.exitCode=1;
})();
