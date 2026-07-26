/* prijimacky-hostile.test.cjs — opevnění cloud sync vrstvy (Fáze 21).
   Podvržená/poškozená cloud data i localStorage NESMÍ shodit sync ani render:
   type confusion, flooding, prototype pollution, nečíselné hodnoty, XSS řetězce. */
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

// Mock Supabase přihlášený; cloud vrátí window.__MOCK_CLOUD, save → window.__MOCK_SAVED.
function mock(cloudJson, localSeed){ return `
window.__MOCK_SAVED = null;
window.__MOCK_CLOUD = ${cloudJson};
${localSeed||''}
(function(){
  let session = { user: { id:'u1', email:'zak@husovaliberec.cz' } };
  const okp = d => Promise.resolve({ data:d, error:null });
  function q(){ const o={data:null,error:null};
    ['select','eq','maybeSingle','order','limit','single','insert','update','upsert','delete','in','gte','lte','is'].forEach(m=>o[m]=()=>o);
    o.then=(r)=>r({data:null,error:null}); return o; }
  window.supabase = { createClient: ()=>({
    auth: { getSession:()=>okp({session}), signOut:()=>okp(null), signInWithOAuth:()=>okp(null),
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}) },
    from:()=>q(),
    rpc:(fn,args)=>{ if(fn==='pz_get_stats') return okp(window.__MOCK_CLOUD);
      if(fn==='pz_save_stats'){ window.__MOCK_SAVED=args.p_data; return okp(null); } return okp(null); },
  }) };
})();`; }

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const STATS = base+'/projects/prijimacky-matematika/statistiky.html';
  const browser=await chromium.launch({executablePath:EXEC});
  const errs=[];
  console.log('── Přijímačky: hostile cloud sync ──');

  async function load(initScript){
    const ctx=await browser.newContext();
    await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
    const page=await ctx.newPage(); page.on('pageerror',e=>errs.push(e.message));
    await page.addInitScript(initScript);
    await page.goto(STATS,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelectorAll('#st-big .st-stat').length===4,{timeout:8000});
    return { ctx, page };
  }

  // ── 1) Type confusion + prototype pollution ──
  const evil1 = JSON.stringify({
    attempts: "i-am-not-an-array",
    practice: { rovnice: null, zlomky: "bad", procenta: {ok:'5',total:10},
                evil: {ok:1e9, total:1e9}, "__proto__": {polluted:1} },
    diag: 42, readiness: 99999,
    "__proto__": {polluted:1}
  });
  const seed1 = `
    localStorage.setItem('PZ_CERMAT_ATTEMPTS', JSON.stringify([{date:'2026-05-01',score:30,max:50}]));
    localStorage.setItem('PZ_PRACTICE_PROGRESS', JSON.stringify({rovnice:{ok:4,total:8}}));`;
  let { ctx, page } = await load(mock(evil1, seed1));
  await page.waitForFunction(()=>window.__MOCK_SAVED!==null,{timeout:8000});
  ok(!({}.polluted), 'žádná prototype pollution (Object.prototype čistý)');
  ok(await page.evaluate(()=>({}).polluted===undefined), 'ani ve stránce není prototyp znečištěn');
  const att1 = await page.evaluate(()=>JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS')));
  ok(Array.isArray(att1) && att1.every(a=>a&&typeof a==='object'), 'attempts zůstalo pole objektů (cloud string ignorován)');
  ok(att1.some(a=>a.score===30), 'lokální pokrok zachován (nikdy neztratí)');
  const pra1 = await page.evaluate(()=>JSON.parse(localStorage.getItem('PZ_PRACTICE_PROGRESS')));
  ok(pra1 && !('polluted' in pra1) && pra1.rovnice, 'practice sanitizováno (null/string hodnoty vyhozeny)');
  ok(pra1.procenta && pra1.procenta.ok===5, 'nečíselné "5" převedeno na číslo 5');
  const saved1 = await page.evaluate(()=>window.__MOCK_SAVED);
  ok(saved1 && typeof saved1.readiness==='number' && saved1.readiness>=0 && saved1.readiness<=100, 'readiness přepočítán do 0–100 (ne 99999)');
  await ctx.close();

  // ── 2) Flooding (obří pole/objekty) ──
  const bigAtt = 'Array.from({length:5000},(_,i)=>({date:"2026-01-01",score:i%51,max:50}))';
  const bigPra = 'Object.fromEntries(Array.from({length:400},(_,i)=>["t"+i,{ok:1,total:2}]))';
  const evil2 = `{ attempts: ${bigAtt}, practice: ${bigPra}, diag:null, readiness:50 }`;
  ({ ctx, page } = await load(mock(evil2)));
  await page.waitForFunction(()=>window.__MOCK_SAVED!==null,{timeout:8000});
  const att2 = await page.evaluate(()=>JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS')));
  ok(att2.length<=50, 'attempts zastropováno na 50 (anti-flood): '+att2.length);
  const pra2 = await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('PZ_PRACTICE_PROGRESS'))).length);
  ok(pra2<=60, 'practice zastropováno na 60 témat: '+pra2);
  await ctx.close();

  // ── 3) Poškozený localStorage (bez cloudu) — render nesmí spadnout ──
  const corrupt = `
    localStorage.setItem('PZ_CERMAT_ATTEMPTS', '"totally-not-an-array"');
    localStorage.setItem('PZ_PRACTICE_PROGRESS', '[1,2,3]');
    localStorage.setItem('PZ_DIAG_LAST', '"nope"');`;
  const c3=await browser.newContext();
  await c3.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const p3=await c3.newPage(); p3.on('pageerror',e=>errs.push(e.message));
  await p3.addInitScript(corrupt);
  await p3.goto(STATS,{waitUntil:'domcontentloaded'});
  await p3.waitForFunction(()=>document.querySelectorAll('#st-big .st-stat').length===4,{timeout:8000});
  ok(await p3.evaluate(()=>document.querySelector('#st-big .st-stat .v').textContent==='—'),'poškozený localStorage → render funguje (připravenost —)');
  await c3.close();

  ok(errs.length===0,'žádné JS chyby napříč scénáři'+(errs.length?(' ['+errs[0]+']'):''));

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
