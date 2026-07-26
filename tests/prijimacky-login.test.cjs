/* prijimacky-login.test.cjs — Fáze 21: Google login + cloud sync pokroku (mock Supabase).
   Ověří: graceful bez cloudu (lišta skrytá), po přihlášení se lokální a cloudový
   pokrok SLOUČÍ (nikdy neztratí), uloží zpět do cloudu, statistiky se překreslí. */
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

// Mock Supabase: přihlášený školní účet, cloud vrátí __MOCK_CLOUD, save uloží do __MOCK_SAVED.
const MOCK = `
window.__MOCK_SAVED = null;
window.__MOCK_CLOUD = { attempts:[{date:'2026-05-02',score:44,max:50}],
  practice:{ rovnice:{ok:3,total:12}, zlomky:{ok:8,total:8} },
  diag:{date:'2026-05-02',ok:9,n:10,topics:[]} };
localStorage.setItem('PZ_CERMAT_ATTEMPTS', JSON.stringify([{date:'2026-05-01',score:20,max:50}]));
localStorage.setItem('PZ_PRACTICE_PROGRESS', JSON.stringify({ rovnice:{ok:5,total:10} }));
(function(){
  let session = { user: { id:'u1', email:'zak@husovaliberec.cz' } };
  const okp = d => Promise.resolve({ data:d, error:null });
  function q(){ const o={data:null,error:null};
    ['select','eq','maybeSingle','order','limit','single','insert','update','upsert','delete','in','gte','lte','is'].forEach(m=>o[m]=()=>o);
    o.then=(r)=>r({data:null,error:null}); return o; }
  window.supabase = { createClient: ()=>({
    auth: {
      getSession: ()=>okp({ session }),
      signOut: ()=>{ session=null; return okp(null); },
      signInWithOAuth: ()=>okp(null),
      onAuthStateChange: ()=>({ data:{ subscription:{ unsubscribe(){} } } }),
    },
    from: ()=>q(),
    rpc: (fn,args)=>{
      if(fn==='pz_get_stats')  return okp(window.__MOCK_CLOUD || {});
      if(fn==='pz_save_stats'){ window.__MOCK_SAVED = args.p_data; return okp(null); }
      return okp(null);
    },
  }) };
})();`;

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  const errs=[];
  const STATS = base+'/projects/prijimacky-matematika/statistiky.html';
  console.log('── Přijímačky: login + cloud sync ──');

  // ── 1) Graceful: bez mocku (CDN blokované) lišta NENÍ ──
  const c0=await browser.newContext();
  await c0.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const p0=await c0.newPage(); p0.on('pageerror',e=>errs.push(e.message));
  await p0.goto(STATS,{waitUntil:'domcontentloaded'});
  await p0.waitForFunction(()=>document.querySelectorAll('#st-big .st-stat').length===4,{timeout:8000});
  await p0.waitForTimeout(300);
  ok(await p0.evaluate(()=>!document.querySelector('#pz-login')),'graceful: bez cloudu žádná login lišta');
  await c0.close();

  // ── 2) Přihlášený: sloučení lokál+cloud, uložení zpět, překreslení ──
  const c1=await browser.newContext();
  await c1.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const p1=await c1.newPage(); p1.on('pageerror',e=>errs.push(e.message));
  await p1.addInitScript(MOCK);
  await p1.goto(STATS,{waitUntil:'domcontentloaded'});
  // počkej, až sync sloučí testy (lokál 1 + cloud 1 = 2)
  await p1.waitForFunction(()=>{ try{ return JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS')||'[]').length===2; }catch(e){ return false; } },{timeout:8000});

  const att=await p1.evaluate(()=>JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS')));
  ok(att.length===2 && att.some(a=>a.score===20) && att.some(a=>a.score===44),'testy sloučeny (lokál 20 + cloud 44)');
  const pra=await p1.evaluate(()=>JSON.parse(localStorage.getItem('PZ_PRACTICE_PROGRESS')));
  ok(pra.rovnice.ok===5 && pra.rovnice.total===12,'procvičování: per-téma max (ok 5, total 12)');
  ok(pra.zlomky && pra.zlomky.ok===8,'procvičování: nové téma z cloudu (zlomky)');
  const dia=await p1.evaluate(()=>JSON.parse(localStorage.getItem('PZ_DIAG_LAST')));
  ok(dia && dia.date==='2026-05-02','diagnostika: novější (cloud) převzata');

  const saved=await p1.evaluate(()=>window.__MOCK_SAVED);
  ok(saved && saved.attempts && saved.attempts.length===2,'sloučený pokrok uložen zpět do cloudu');
  // readiness = avg(best 44/50=88 %, přesnost 13/20=65 %) = 77
  ok(saved && saved.readiness===77,'readiness přepočítán a uložen (77): '+(saved&&saved.readiness));

  ok(await p1.evaluate(()=>{ const el=document.querySelector('#pz-login'); return el && /zak@husovaliberec\.cz/.test(el.textContent) && /Odhlásit/.test(el.textContent); }),'login lišta ukazuje účet + Odhlásit');
  ok(await p1.evaluate(()=>document.querySelector('#st-big .st-stat .v').textContent==='77 %'),'statistiky překresleny po syncu (77 %)');
  await c1.close();

  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
