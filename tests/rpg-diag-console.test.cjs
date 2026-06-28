/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 3 (diagnostika): heatmapa chybovosti v učitelské konzoli.
   Mock saves nesou data.errs + data.done → ověří agregaci a render.
   Spusť: node tests/rpg-diag-console.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18479;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function ok(name, cond, d='') { if (cond){console.log('  ✅ '+name);pass++;} else {console.log('  ❌ '+name+(d?' — '+d:''));fail++;} }

function mockScript(scenario) {
  return `(function(){
    const S = ${JSON.stringify(scenario)};
    const db = { roles:S.roles||[], saves:S.saves||[], classes:S.classes||[], class_members:S.class_members||[], notes:[] };
    function mkClient(){
      function q(table){
        let op='select', filters=[], single=false, payload=null;
        function rows(){ let r=(db[table]||[]).slice(); filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));}); return r; }
        function resolve(){
          if(op==='select'){ const r=rows(); return Promise.resolve({data: single?(r[0]||null):r, error:null}); }
          return Promise.resolve({data:null,error:null});
        }
        const b={
          select(){ if(op!=='insert')op='select'; return b; },
          insert(p){op='insert';payload=p;return b;},
          upsert(p){op='upsert';payload=p;return b;},
          update(p){op='update';payload=p;return b;},
          delete(){op='delete';return b;},
          eq(c,v){filters.push([c,v]);return b;},
          order(){return b;},
          maybeSingle(){single=true;return resolve();},
          single(){single=true;return resolve();},
          then(res,rej){return resolve().then(res,rej);}
        };
        return b;
      }
      return { auth:{ getSession:async()=>({data:{session:S.session||null}}), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}), signInWithOAuth:async()=>{}, signOut:async()=>{} }, from:q, rpc:async()=>({data:[],error:null}) };
    }
    window.supabase = { createClient:()=>mkClient() };
  })();`;
}

function startServer() {
  const mime={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',json:'application/json'};
  const srv=http.createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    const fp=path.normalize(path.join(ROOT,p));
    if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('forbidden');return;}
    try{const buf=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(buf);}
    catch{res.writeHead(404);res.end('nf');} });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}

// mise 1-1 splněná celá (6/6)
const fullDone = mid => { const o={}; for(let i=0;i<6;i++)o[mid+'-'+i]=1; return o; };

async function run() {
  console.log('\n── Diagnostika: heatmapa chybovosti ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:CHROMIUM });
  const errors = [];
  try {
    const admin='vojtech.konopa@husovaliberec.cz';
    const scenario = {
      roles: [{ email: admin, role:'superadmin' }],
      session: { user:{ id:'u-admin', email:admin, user_metadata:{full_name:'Vojta'} } },
      saves: [
        { user_id:'z1', game:'RPG_MAT_9', name:'Neo', email:'z1@husovaliberec.cz', full_name:'Žák 1', updated_at:new Date().toISOString(),
          data:{ name:'Neo', xp:300, level:4, done:fullDone('1-1'), errs:{ '1-1':4, '5-2':6 },
            errsSnap:[{t:'2026-05-01',errs:{'1-1':1}},{t:'2026-05-08',errs:{'1-1':3}},{t:'2026-05-15',errs:{'1-1':4}}] } },
        { user_id:'z2', game:'RPG_MAT_9', name:'Trinity', email:'z2@husovaliberec.cz', full_name:'Žák 2', updated_at:new Date().toISOString(),
          data:{ name:'Trinity', xp:120, level:2, done:{ '1-1-0':1, '1-1-1':1 }, errs:{ '1-1':2 } } },
      ],
      classes: [{ id:'c1', name:'9.A', section:'A', cohort_start_year:2021, created_by:'u-admin' }],
      class_members: [{ class_id:'c1', user_id:'z1' }],  // jen Neo je v 9.A
    };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    page.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource|ERR_/i.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(mockScript(scenario));
    await page.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil:'load' });
    await page.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'), {timeout:8000});
    // počkej na načtení ROWS
    await page.waitForFunction(()=>Array.isArray(window.ROWS) && window.ROWS.length>=2, {timeout:6000}).catch(()=>{});

    // přepni na DIAGNOSTIKA
    await page.click('.tab[data-tab="diag"]');
    await page.waitForFunction(()=>!document.getElementById('t-diag').classList.contains('hidden'),{timeout:4000});
    ok('záložka Diagnostika se otevře', true);

    const opts = await page.evaluate(()=>document.getElementById('diag-game').options.length);
    ok('výběr ročníku je naplněn (7 her: 1.+2. stupeň)', opts===7, 'options='+opts);

    // vyber 9. ročník
    await page.evaluate(()=>{ const s=document.getElementById('diag-game'); s.value='RPG_MAT_9'; renderDiag(); });
    await page.waitForFunction(()=>/Bootovací sekvence/.test(document.getElementById('diag-wrap').textContent),{timeout:4000});
    const txt = await page.evaluate(()=>document.getElementById('diag-wrap').textContent);

    ok('heatmapa ukazuje názvy misí', /Bootovací sekvence/.test(txt));
    ok('mise 1-1: 1/2 dokončilo, ⌀ 3.0 chyb', /1\/2 dokončilo · ⌀ 3\.0 chyb/.test(txt), txt.slice(0,200));
    ok('mise 5-2: vysoká chybovost ⌀ 6.0', /⌀ 6\.0 chyb/.test(txt));
    ok('mise bez dat má text „zatím nikdo nezkoušel"', /zatím nikdo nezkoušel/.test(txt));
    ok('vykresleno všech 7 oblastí', (txt.match(/Oblast \d/g)||[]).length===7);

    // trend z errsSnap: 1-1 má snímky [1,3,4] → recent +1, prev +2 → zlepšení 🔽
    ok('trend mise 1-1: nově +1 (minule +2)', /nově \+1 chyb \(minule \+2\)/.test(txt), txt.match(/nově[^<]{0,40}/)?.[0]||'(nic)');
    const hasDown = await page.evaluate(()=>/🔽/.test(document.getElementById('diag-wrap').innerHTML));
    ok('trend zlepšení má zelenou šipku 🔽', hasDown);

    // heat barva: zkoušené mise dostanou hsl pozadí (zelená→červená dle chyb)
    const heatCells = await page.evaluate(()=>document.querySelectorAll('#diag-wrap div[style*="hsl"]').length);
    ok('mise s daty mají heat-barvu (hsl pozadí)', heatCells>=2, 'hsl buněk='+heatCells);

    // filtr třídy: 9.A obsahuje jen Neo (errs 1-1:4) → ⌀ 4.0, 1/1 dokončilo
    const classOpts = await page.evaluate(()=>document.getElementById('diag-class')?document.getElementById('diag-class').options.length:0);
    ok('filtr tříd je naplněn (Všechny + 9.A)', classOpts===2, 'options='+classOpts);
    await page.evaluate(()=>{ const c=document.getElementById('diag-class'); c.value='c1'; renderDiag(); });
    const txtC = await page.evaluate(()=>document.getElementById('diag-wrap').textContent);
    ok('po filtru 9.A: mise 1-1 jen Neo → 1/1 ⌀ 4.0', /1\/1 dokončilo · ⌀ 4\.0 chyb/.test(txtC), txtC.slice(0,200));
    // zpět na všechny třídy
    await page.evaluate(()=>{ const c=document.getElementById('diag-class'); c.value=''; renderDiag(); });

    ok('žádné JS chyby na stránce', errors.length===0, errors.slice(0,3).join(' | '));
    await ctx.close();
  } catch(e) {
    ok('běh bez výjimky', false, e.message);
  } finally {
    await browser.close(); srv.close();
  }
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
}
run();
