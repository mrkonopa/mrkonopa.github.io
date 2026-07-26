/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 21 — konzole PŘIJÍMAČKY (Playwright, mock Supabase).
   Učitel vybere třídu → pz_class_readiness → řádky připravenosti (jméno,
   %, počet testů), XSS ve jméně escapováno, prázdný stav.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18493;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function ok(name, cond, d='') { if (cond){console.log('  ✅ '+name);pass++;} else {console.log('  ❌ '+name+(d?' — '+d:''));fail++;} }

function mockScript(scenario) {
  return `(function(){
    const S = ${JSON.stringify(scenario)};
    const db = { roles:S.roles||[], saves:S.saves||[], classes:S.classes||[], class_members:S.class_members||[] };
    window.__rpcCalls = [];
    function mkClient(){
      function q(table){
        let single=false, filters=[];
        function rows(){ let r=(db[table]||[]).slice(); filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));}); return r; }
        function resolve(){ const r=rows(); return Promise.resolve({data: single?(r[0]||null):r, error:null}); }
        const b={ select(){return b;}, insert(){return b;}, upsert(){return b;}, update(){return b;}, delete(){return b;},
          eq(c,v){filters.push([c,v]);return b;}, order(){return b;}, limit(){return b;}, range(){return b;}, is(){return b;}, in(){return b;},
          maybeSingle(){single=true;return resolve();}, single(){single=true;return resolve();},
          then(res,rej){return resolve().then(res,rej);} };
        return b;
      }
      return {
        auth:{ getSession:async()=>({data:{session:S.session||null}}), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}), signInWithOAuth:async()=>{}, signOut:async()=>{} },
        from:q,
        rpc:async(fn,args)=>{
          window.__rpcCalls.push({fn,args});
          if(fn==='pz_class_readiness'){ return {data:S.readiness||[], error:null}; }
          return {data:[],error:null};
        }
      };
    }
    window.supabase = { createClient:()=>mkClient() };
  })();`;
}

function startServer() {
  const mime={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml'};
  const srv=http.createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    const fp=path.normalize(path.join(ROOT,p));
    if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('forbidden');return;}
    try{const buf=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(buf);}
    catch{res.writeHead(404);res.end('nf');} });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}

async function run() {
  console.log('\n── Fáze 21: konzole PŘIJÍMAČKY ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:CHROMIUM });
  const errors = [];
  try {
    const admin='vojtech.konopa@husovaliberec.cz';
    const scenario = {
      roles: [{ email: admin, role:'superadmin' }],
      session: { user:{ id:'u-admin', email:admin, user_metadata:{full_name:'Vojta'} } },
      classes: [{ id:'cls-9b', name:'9.B', section:'B', cohort_start_year:null, archived:false }],
      class_members: [{ class_id:'cls-9b', user_id:'u1' }, { class_id:'cls-9b', user_id:'u2' }],
      readiness: [
        { user_id:'u1', display_name:'Anička', readiness:82, attempts:3, updated_at:'2026-07-26T10:00:00Z' },
        { user_id:'u2', display_name:'<img src=x onerror="window.__xss=3">', readiness:40, attempts:1, updated_at:null },
      ],
    };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    page.on('dialog', d=>d.accept());
    await page.addInitScript(mockScript(scenario));
    await page.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil:'load' });
    await page.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'), {timeout:8000});

    // ── záložka PŘIJÍMAČKY ──
    await page.click('[data-tab="prijimacky"]');
    await page.waitForFunction(()=>!document.getElementById('t-prijimacky').classList.contains('hidden'), {timeout:4000});
    ok('záložka PŘIJÍMAČKY se otevře', true);

    // select tříd naplněn
    await page.waitForFunction(()=>document.querySelectorAll('#pz-class option').length>=2, {timeout:4000});
    ok('select tříd naplněn', await page.evaluate(()=>document.querySelectorAll('#pz-class option').length)>=2);

    // před výběrem: výzva
    ok('bez třídy výzva k výběru', /Vyber třídu/.test(await page.evaluate(()=>document.getElementById('pz-wrap').textContent)));

    // vyber třídu → připravenost
    await page.selectOption('#pz-class','cls-9b');
    await page.waitForFunction(()=>window.__rpcCalls.some(c=>c.fn==='pz_class_readiness'), {timeout:4000});
    await page.waitForFunction(()=>/Anička/.test(document.getElementById('pz-wrap').textContent), {timeout:4000});
    const called = await page.evaluate(()=>window.__rpcCalls.find(c=>c.fn==='pz_class_readiness'));
    ok('pz_class_readiness volán se správnou třídou', called && called.args.p_class==='cls-9b', JSON.stringify(called&&called.args));

    const txt = await page.evaluate(()=>document.getElementById('pz-wrap').textContent);
    ok('řádek žáka: jméno + %', /Anička/.test(txt) && /82 %/.test(txt), txt.slice(0,80));
    ok('řádek žáka: počet testů', /3× test/.test(txt), txt.slice(0,120));
    ok('druhý žák s 40 %', /40 %/.test(txt));

    // XSS ve jméně žáka se nespustí
    ok('XSS ve jméně žáka neprovedeno', !(await page.evaluate(()=>window.__xss)));

    // prázdný výběr → výzva
    await page.selectOption('#pz-class','');
    await page.waitForFunction(()=>/Vyber třídu/.test(document.getElementById('pz-wrap').textContent), {timeout:4000});
    ok('návrat na prázdný výběr ukáže výzvu', true);

    ok('žádné JS chyby', errors.length===0, errors[0]||'');
  } finally {
    await browser.close(); srv.close();
  }
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
}
run().catch(e=>{console.error(e);process.exit(1);});
