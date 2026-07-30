/* prijimacky-testloop.test.cjs — uzavřená učební smyčka:
   test nanečisto → sklad slabin po okruzích (PZ_TEST_TOPICS) → adaptivita + statistiky.
   Hlídá: reverzní mapa slot→okruh, agregace rozboru, vliv na topicWeights,
   doporučení „co teď procvičovat" (odkazy), cloud merge, obranu proti podvrhu. */
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
  const browser=await chromium.launch({executablePath:EXEC});
  const errs=[];
  const ctx=await browser.newContext();
  await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page=await ctx.newPage(); page.on('pageerror',e=>errs.push(e.message));

  // ── část 1: mapa slot→okruh + agregace (na stránce testu, kde je vše načtené) ──
  await page.goto(base+'/projects/prijimacky-matematika/test.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PZ&&window.PZ_TOPICS&&PZ_TOPICS.topicsForSlot&&PZ.recordTestTopics,{timeout:8000});
  console.log('── Smyčka test → adaptivita ──');

  const map = await page.evaluate(()=>({
    slot0: PZ_TOPICS.topicsForSlot(0),
    slot12: PZ_TOPICS.topicsForSlot(12),
    slot99: PZ_TOPICS.topicsForSlot(99),
    junk: PZ_TOPICS.topicsForSlot('x'),
  }));
  ok(map.slot0.includes('vyrazy-mocniny'), 'slot 0 → vyrazy-mocniny');
  ok(map.slot12.length>=2 && map.slot12.includes('procenta') && map.slot12.includes('slovni'), 'slot 12 → víc okruhů (procenta + slovní)');
  ok(map.slot99.length===0 && map.junk.length===0, 'neznámý/nesmyslný slot → prázdné pole (nespadne)');

  // rozbor: úloha 1 (slot 0) celá špatně, úloha 5 (slot 4 = geometrie) celá správně
  const rec = await page.evaluate(()=>{
    localStorage.removeItem('PZ_TEST_TOPICS');
    const review=[
      {no:1,title:'a',earned:0,max:2,items:[{ok:false},{ok:false}]},
      {no:5,title:'b',earned:2,max:2,items:[{ok:true},{ok:true}]},
    ];
    PZ.recordTestTopics(review);
    return JSON.parse(localStorage.getItem('PZ_TEST_TOPICS'));
  });
  ok(rec['vyrazy-mocniny'] && rec['vyrazy-mocniny'].ok===0 && rec['vyrazy-mocniny'].total===2, 'chybná úloha → 0/2 u svého okruhu');
  ok(rec['geometrie'] && rec['geometrie'].ok===2 && rec['geometrie'].total===2, 'správná úloha → 2/2 u svého okruhu');

  // kumulace přes víc testů (sklad se nepřepisuje)
  const cum = await page.evaluate(()=>{
    PZ.recordTestTopics([{no:1,earned:1,max:2,items:[{ok:true},{ok:false}]}]);
    return JSON.parse(localStorage.getItem('PZ_TEST_TOPICS'))['vyrazy-mocniny'];
  });
  ok(cum.total===4 && cum.ok===1, 'druhý test se PŘIČTE (1/4), nepřepíše');

  // ── část 2: vliv na adaptivní váhy ──
  const w = await page.evaluate(()=>{
    localStorage.removeItem('PZ_TEST_TOPICS'); localStorage.removeItem('PZ_PRACTICE_PROGRESS');
    const before = PZ.topicWeights().find(x=>x.id==='rovnice').weight;
    // v testu nanečisto to v rovnicích drhne (0/4)
    PZ.recordTestTopics([{no:4,earned:0,max:4,items:[{ok:false},{ok:false},{ok:false},{ok:false}]}]);
    const t = PZ.topicWeights().find(x=>x.id==='rovnice');
    return { before, after:t.weight, why:t.why, tacc:t.tacc, ttotal:t.ttotal };
  });
  ok(w.after > w.before, 'chyby v testu ZVÝŠÍ váhu okruhu ('+w.before.toFixed(2)+' → '+w.after.toFixed(2)+')');
  ok(w.why==='chyby v testu nanečisto', 'důvod = „chyby v testu nanečisto"');
  ok(w.tacc===0 && w.ttotal===4, 'topicWeights vrací testovou přesnost (tacc/ttotal)');

  // zvládnuté v procvičování, ale chyby v ostrém testu → NEsmí se deprioritizovat
  const mast = await page.evaluate(()=>{
    localStorage.removeItem('PZ_TEST_TOPICS');
    localStorage.setItem('PZ_PRACTICE_PROGRESS', JSON.stringify({ rovnice:{ok:20,total:20,last:Date.now()} }));
    const clean = PZ.topicWeights().find(x=>x.id==='rovnice');
    PZ.recordTestTopics([{no:4,earned:0,max:4,items:[{ok:false},{ok:false},{ok:false},{ok:false}]}]);
    const drhne = PZ.topicWeights().find(x=>x.id==='rovnice');
    return { cleanWhy:clean.why, cleanW:clean.weight, w:drhne.weight, why:drhne.why };
  });
  ok(/zvládnuté/.test(mast.cleanWhy), 'bez testu: 20/20 v procvičování = „zvládnuté 💪"');
  ok(mast.w > mast.cleanW && !/zvládnuté/.test(mast.why), 'ale chyby v ostrém testu zruší slevu za „zvládnuté"');

  // ── část 3: obrana proti podvrženému/poškozenému vstupu ──
  const hostile = await page.evaluate(()=>{
    localStorage.removeItem('PZ_TEST_TOPICS');
    const out={};
    try { PZ.recordTestTopics(null); PZ.recordTestTopics('x'); PZ.recordTestTopics([null,'y',{},{no:'q'}]); out.survived=true; } catch(e){ out.survived=false; out.err=e.message; }
    // prototype pollution přes okruh
    try { PZ.recordTestTopics([{no:1,items:[{ok:false}]}]); } catch(e){}
    out.protoClean = ({}).ok===undefined;
    out.weightsOk = Array.isArray(PZ.topicWeights()) && PZ.topicWeights().length>0;
    return out;
  });
  ok(hostile.survived, 'nesmysl na vstupu (null/string/prázdné) nespadne');
  ok(hostile.protoClean, 'žádné prototype pollution');
  ok(hostile.weightsOk, 'topicWeights funguje i po podvrženém vstupu');

  const corrupt = await page.evaluate(()=>{
    localStorage.setItem('PZ_TEST_TOPICS', JSON.stringify({ rovnice:'nonsense', geometrie:{ok:'x',total:null} }));
    const ws = PZ.topicWeights();
    return { n:ws.length, allFinite: ws.every(x=>Number.isFinite(x.weight)) };
  });
  ok(corrupt.n>0 && corrupt.allFinite, 'poškozený sklad → váhy jsou pořád čísla');

  // ── část 4: doporučení „co teď procvičovat" v rozboru ──
  const cta = await page.evaluate(()=>{
    const review=[
      {no:1,title:'a',earned:0,max:2,items:[{prompt:'p',given:'1',correct:'2',ok:false},{prompt:'q',given:null,correct:'3',ok:false}]},
      {no:5,title:'b',earned:2,max:2,items:[{prompt:'r',given:'4',correct:'4',ok:true}]},
    ];
    const html = nextStepsHtml(review);
    const d=document.createElement('div'); d.innerHTML=html;
    const rows=[...d.querySelectorAll('.cm-next-row')];
    return { has:!!html, hrefs:rows.map(a=>a.getAttribute('href')), texts:rows.map(a=>a.textContent),
      empty: nextStepsHtml([{no:5,earned:2,max:2,items:[{ok:true}]}]) };
  });
  ok(cta.has && cta.hrefs.length>0, 'rozbor obsahuje doporučení s odkazy');
  ok(cta.hrefs.every(h=>/^procvicovani\.html\?okruh=/.test(h)), 'odkazy míří na procvicovani.html?okruh=… (deep-link)');
  ok(!cta.hrefs.some(h=>/okruh=geometrie/.test(h)), 'zvládnutý okruh z testu se v doporučení NEnabízí');
  ok(cta.texts.some(t=>/chyb/.test(t)), 'doporučení ukazuje počet chyb');
  ok(cta.empty==='', 'plný počet bodů → žádné doporučení (nic se nevloží)');

  // deep-link z doporučení skutečně nastartuje daný okruh
  await page.goto(base+'/projects/prijimacky-matematika/procvicovani.html?okruh=rovnice',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PR&&PR.topic,{timeout:6000}).catch(()=>{});
  ok(await page.evaluate(()=>!!(PR.topic&&PR.topic.id==='rovnice')), 'deep-link ?okruh=rovnice nastartuje ten okruh');

  // ── část 5: cloud merge nesmí testová data ztratit ──
  await page.goto(base+'/projects/prijimacky-matematika/statistiky.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PZ&&PZ.topicWeights,{timeout:8000});
  const stat = await page.evaluate(()=>{
    localStorage.setItem('PZ_TEST_TOPICS', JSON.stringify({ rovnice:{ok:1,total:4,last:Date.now()} }));
    localStorage.removeItem('PZ_PRACTICE_PROGRESS');
    render();
    const row=[...document.querySelectorAll('.st-bar-row')].find(r=>/Rovnice/.test(r.textContent));
    return { txt: row?row.textContent:'', all: document.getElementById('st-topics').textContent };
  });
  ok(/📝 test 25 %/.test(stat.txt), 'statistiky ukazují testovou přesnost okruhu (📝 test 25 %)');
  ok(/chyby v testu nanečisto/.test(stat.all), 'mapa témat pojmenuje slabinu z testu');

  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
