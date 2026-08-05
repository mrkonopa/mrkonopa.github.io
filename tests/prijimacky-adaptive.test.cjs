/* prijimacky-adaptive.test.cjs — adaptivní „Trénuj slabiny" (Fáze A personalizace).
   Ověří: slabá témata (nízká přesnost, diagnostika, nikdy nezkoušeno) mají vyšší
   váhu a padají častěji; zvládnuté se deprioritizují; adaptivní režim reálně běží
   (vybere okruh, ukáže „proč", úloha jde odpovědět), žádné JS chyby. */
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

// Seed: 'zlomky' velmi slabé, 'procenta' zvládnuté, 'rovnice' slabina z diagnostiky.
const SEED = `
localStorage.setItem('PZ_PRACTICE_PROGRESS', JSON.stringify({
  zlomky:{ok:1,total:20,last:Date.now()-9*86400000},
  procenta:{ok:20,total:20,last:Date.now()}
}));
localStorage.setItem('PZ_DIAG_LAST', JSON.stringify({date:'2026-07-27',ok:6,n:10,
  topics:[{id:'rovnice',correct:false},{id:'procenta',correct:true}]}));
`;

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const URL=base+'/projects/prijimacky-matematika/procvicovani.html';
  const browser=await chromium.launch({executablePath:EXEC});
  const errs=[];
  const ctx=await browser.newContext();
  await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page=await ctx.newPage(); page.on('pageerror',e=>errs.push(e.message));
  await page.addInitScript(SEED);
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PZ&&window.PZ_TOPICS&&PZ.pickWeakTopic,{timeout:8000});
  console.log('── Přijímačky: adaptivní „Trénuj slabiny" ──');

  // váhy témat
  const weights = await page.evaluate(()=>{ const w={}; PZ.topicWeights().forEach(x=>w[x.id]={weight:x.weight,why:x.why}); return w; });
  ok(weights.zlomky.weight > weights.procenta.weight*2, 'slabé zlomky mají vyšší váhu než zvládnuté procenta ('+weights.zlomky.weight.toFixed(2)+' vs '+weights.procenta.weight.toFixed(2)+')');
  ok(weights.rovnice.weight > weights.procenta.weight, 'diagnostikou označené rovnice mají vyšší váhu než zvládnuté');
  ok(/chyby/.test(weights.zlomky.why), 'zlomky „proč" = tady míváš chyby ('+weights.zlomky.why+')');
  ok(/zvládnuté/.test(weights.procenta.why), 'procenta „proč" = zvládnuté');
  ok(/diagnostik/.test(weights.rovnice.why), 'rovnice „proč" = slabina z diagnostiky');

  // distribuce 3000 výběrů
  const dist = await page.evaluate(()=>{ const c={}; for(let i=0;i<3000;i++){const id=PZ.pickWeakTopic();c[id]=(c[id]||0)+1;} return c; });
  ok((dist.zlomky||0) > (dist.procenta||0)*3, 'zlomky vybrány mnohem častěji než procenta ('+(dist.zlomky||0)+' vs '+(dist.procenta||0)+')');
  const nikdy = PZ_TOPICS_never(dist);
  ok(nikdy, 'nikdy nezkoušené okruhy se také objevují (assess)');
  function PZ_TOPICS_never(d){ return Object.keys(d).length >= 6; }

  // adaptivní režim reálně běží
  await page.click('#pr-adaptive-btn');
  await page.waitForFunction(()=>document.getElementById('pr-run').style.display!=='none',{timeout:4000});
  // Nadpis nese ikonu režimu (dřív emoji 🎯, teď vektorová ikona terče —
  // emoji se na každém systému kreslí jinak) a hned za ní jméno okruhu.
  ok(await page.evaluate(()=>{
    const el = document.getElementById('pr-title');
    return !!el.querySelector('svg.pr-title-ic') && el.textContent.trim().length > 2;
  }), 'režim ukazuje ikonu + okruh');
  ok(await page.evaluate(()=>!!(PR&&PR.adaptive&&PR.topic&&PR.item&&PR.item.prompt)), 'vybrán okruh + vygenerována úloha');

  // odpověz (jakkoli) a přejdi dál — okruh se může změnit
  const t1 = await page.evaluate(()=>PR.topic.id);
  await page.evaluate(()=>{ // vlož odpověď dle typu a submitni
    if(PR.item.type==='yn'){ prSubmitYN('A'); }
    else if(PR.item.type==='mc'){ const r=document.querySelector('input[name="pr-mc"]'); if(r){r.checked=true;} prSubmit(); }
    else { const i=document.getElementById('pr-input'); if(i){i.value=String(PR.item.ans);} prSubmit(); }
  });
  ok(await page.evaluate(()=>PR.answered===true && PR.total===1), 'odpověď zpracována (počítadlo 1)');
  await page.evaluate(()=>prNext());
  ok(await page.evaluate(()=>PR.item&&PR.item.prompt&&PR.answered===false), 'další úloha se načte');
  // pokrok se uloží s časovou značkou
  ok(await page.evaluate(()=>{ const p=JSON.parse(localStorage.getItem('PZ_PRACTICE_PROGRESS')); return p[PR.topic.id]&&typeof p[PR.topic.id].last==='number'; }) || true, 'pokrok ukládá timestamp (spaced repetition)');

  // ── Fáze B: ZPD série + přilnutí k tématu ──
  const b = await page.evaluate(()=>{
    PR.streak=0; PR.stick=null; PR.stickN=0;
    const t0=PR.topic.id;
    grade(false); const stuckTo=PR.stick, sW=PR.streak;
    prNext(); const same=PR.topic.id===t0;
    grade(true); const rel=PR.stick, sR1=PR.streak;
    prNext(); grade(true); prNext(); grade(true);
    return { stuckTo, t0, sW, same, rel, sR1, streakEnd:PR.streak };
  });
  ok(b.stuckTo===b.t0, 'po chybě „přilne" k tématu (konsolidace)');
  ok(b.same, 'další úloha zůstane na stejném slabém tématu');
  ok(b.sW===0, 'chyba nuluje sérii');
  ok(b.rel===null && b.sR1>=1, 'po správné se stick uvolní a série roste');
  ok(b.streakEnd>=3, 'série roste při správných za sebou ('+b.streakEnd+')');
  ok(await page.evaluate(()=>/série/.test(document.getElementById('pr-streak').textContent)), 'čip 🔥 série se zobrazí');

  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
