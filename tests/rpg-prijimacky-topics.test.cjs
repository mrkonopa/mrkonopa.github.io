/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 22 — konzole PŘIJÍMAČKY: „Kde třída tápe" (Playwright, mock Supabase).
   Učitel vybere třídu → pz_class_topics → heatmapa okruhů (nejslabší nahoře,
   zvlášť 📝 test a 🏃 procvičování). Hlídá i graceful stav bez phase22.sql,
   skrytí po přepnutí třídy, zahození podvržených klíčů a XSS.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18497;
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
          if(fn==='pz_class_topics'){
            if(S.topicsMissing) return {data:null, error:{message:'function public.pz_class_topics does not exist'}};
            const byClass = (S.topicsByClass||{})[args&&args.p_class];
            return {data: byClass!==undefined ? byClass : (S.topics||[]), error:null};
          }
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

const admin='vojtech.konopa@husovaliberec.cz';
const baseScenario = () => ({
  roles: [{ email: admin, role:'superadmin' }],
  session: { user:{ id:'u-admin', email:admin, user_metadata:{full_name:'Vojta'} } },
  classes: [{ id:'cls-9b', name:'9.B', section:'B', cohort_start_year:null, archived:false },
            { id:'cls-9a', name:'9.A', section:'A', cohort_start_year:null, archived:false }],
  class_members: [{ class_id:'cls-9b', user_id:'u1' }, { class_id:'cls-9b', user_id:'u2' },
                  { class_id:'cls-9a', user_id:'u3' }],
  readiness: [
    { user_id:'u1', display_name:'Anička', readiness:82, attempts:3, updated_at:'2026-07-26T10:00:00Z' },
    { user_id:'u2', display_name:'Bořek', readiness:40, attempts:1, updated_at:null },
  ],
});

async function openConsole(browser, scenario, errors){
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', e=>errors.push(e.message));
  page.on('dialog', d=>d.accept());
  await page.addInitScript(mockScript(scenario));
  await page.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil:'load' });
  await page.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'), {timeout:8000});
  await page.click('[data-tab="prijimacky"]');
  await page.waitForFunction(()=>!document.getElementById('t-prijimacky').classList.contains('hidden'), {timeout:4000});
  await page.waitForFunction(()=>document.querySelectorAll('#pz-class option').length>=2, {timeout:4000});
  return page;
}

async function run() {
  console.log('\n── Fáze 22: konzole „Kde třída tápe" ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:CHROMIUM });
  const errors = [];
  try {
    // ── A) běžný provoz: heatmapa okruhů ──
    const sc = baseScenario();
    sc.topics = [
      // nejslabší nahoře (SQL už řadí); rovnice: v klidu 50 %, v testu 0 % → propad pod tlakem
      { topic:'rovnice',        students:2, prac_ok:5,  prac_total:10, test_ok:0, test_total:8 },
      { topic:'procenta',       students:2, prac_ok:12, prac_total:20, test_ok:2, test_total:6 },
      { topic:'geometrie',      students:1, prac_ok:18, prac_total:20, test_ok:4, test_total:4 },
      // podvržený klíč ze žákova JSONu — konzole ho musí zahodit
      { topic:'<img src=x onerror="window.__xss=1">', students:1, prac_ok:1, prac_total:1, test_ok:0, test_total:0 },
      { topic:'vymyslenyOkruh', students:1, prac_ok:3, prac_total:3, test_ok:0, test_total:0 },
      // známý okruh bez dat → nevykreslovat (jinak by šel 0 % omylem)
      { topic:'telesa',         students:1, prac_ok:0,  prac_total:0, test_ok:0, test_total:0 },
    ];
    let page = await openConsole(browser, sc, errors);

    ok('bez vybrané třídy je heatmapa skrytá',
      await page.evaluate(()=>document.getElementById('pz-topics-box').classList.contains('hidden')));

    await page.selectOption('#pz-class','cls-9b');
    await page.waitForFunction(()=>window.__rpcCalls.some(c=>c.fn==='pz_class_topics'), {timeout:5000});
    await page.waitForFunction(()=>!document.getElementById('pz-topics-box').classList.contains('hidden'), {timeout:5000});
    ok('po výběru třídy se heatmapa zobrazí', true);

    const call = await page.evaluate(()=>window.__rpcCalls.find(c=>c.fn==='pz_class_topics'));
    ok('pz_class_topics volán se správnou třídou', call && call.args.p_class==='cls-9b', JSON.stringify(call&&call.args));

    const txt = await page.evaluate(()=>document.getElementById('pz-topics').textContent);
    ok('okruh má lidský název (ne id)', /Rovnice a soustavy/.test(txt) && !/rovnice/.test(txt.replace(/Rovnice/g,'')), txt.slice(0,100));
    ok('společná úspěšnost okruhu (rovnice 5+0 / 10+8 = 28 %)', /28 %/.test(txt), txt.slice(0,160));
    ok('čip 📝 = ostrý test (rovnice 0 %)', /📝 0 %/.test(txt), txt.slice(0,200));
    ok('čip 🏃 = procvičování (rovnice 50 %)', /🏃 50 %/.test(txt), txt.slice(0,200));
    ok('počet žáků na okruhu', /2 žáků/.test(txt), txt.slice(0,220));

    const rows = await page.evaluate(()=>[...document.querySelectorAll('#pz-topics > div')].map(d=>d.textContent));
    ok('vykresleny jen 3 známé okruhy s daty', rows.length===3, 'řádků: '+rows.length);
    ok('podvržený klíč okruhu zahozen', !/img src/.test(txt) && !/vymyslenyOkruh/.test(txt));
    ok('XSS z klíče okruhu neprovedeno', !(await page.evaluate(()=>window.__xss)));
    ok('známý okruh bez dat se nevykreslí (Tělesa)', !/Tělesa/.test(txt));
    ok('nejslabší okruh je první', /Rovnice a soustavy/.test(rows[0]), rows[0].slice(0,60));

    // rozdíl klid vs. tlak je čitelný (procenta: 60 % vs 33 %)
    ok('u dalšího okruhu taky oba čipy', /📝 33 %/.test(txt) && /🏃 60 %/.test(txt), txt.slice(0,300));

    // ── B) přepnutí na třídu bez dat → heatmapa se schová (nezůstane viset) ──
    sc2 = baseScenario();
    sc2.readiness = [{ user_id:'u3', display_name:'Cyril', readiness:10, attempts:0, updated_at:null }];
    sc2.topicsByClass = { 'cls-9b': sc.topics, 'cls-9a': [] };
    const page2 = await openConsole(browser, sc2, errors);
    await page2.selectOption('#pz-class','cls-9b');
    await page2.waitForFunction(()=>!document.getElementById('pz-topics-box').classList.contains('hidden'), {timeout:5000});
    await page2.selectOption('#pz-class','cls-9a');
    await page2.waitForFunction(()=>document.getElementById('pz-topics-box').classList.contains('hidden'), {timeout:5000});
    ok('přepnutí na třídu bez dat heatmapu SCHOVÁ', true);
    await page2.selectOption('#pz-class','');
    ok('prázdný výběr heatmapu taky schová',
      await page2.evaluate(()=>document.getElementById('pz-topics-box').classList.contains('hidden')));

    // ── C) graceful: phase22.sql nespuštěné (RPC neexistuje) ──
    const sc3 = baseScenario();
    sc3.topicsMissing = true;
    const page3 = await openConsole(browser, sc3, errors);
    await page3.selectOption('#pz-class','cls-9b');
    await page3.waitForFunction(()=>/Anička/.test(document.getElementById('pz-wrap').textContent), {timeout:5000});
    ok('bez phase22.sql zůstane heatmapa skrytá',
      await page3.evaluate(()=>document.getElementById('pz-topics-box').classList.contains('hidden')));
    ok('bez phase22.sql funguje zbytek záložky (připravenost)',
      /82 %/.test(await page3.evaluate(()=>document.getElementById('pz-wrap').textContent)));

    // ── D) obrana proti poškozeným číslům z RPC ──
    const sc4 = baseScenario();
    sc4.topics = [
      { topic:'zlomky', students:'x', prac_ok:'abc', prac_total:'10', test_ok:null, test_total:undefined },
      { topic:'data',   students:1, prac_ok:2, prac_total:4, test_ok:1, test_total:2 },
    ];
    const page4 = await openConsole(browser, sc4, errors);
    await page4.selectOption('#pz-class','cls-9b');
    await page4.waitForFunction(()=>!document.getElementById('pz-topics-box').classList.contains('hidden'), {timeout:5000});
    const t4 = await page4.evaluate(()=>document.getElementById('pz-topics').textContent);
    ok('nečíselné hodnoty nedají NaN', !/NaN/.test(t4), t4.slice(0,160));
    ok('zdravý okruh se vykreslí správně (data 3/6 = 50 %)', /50 %/.test(t4), t4.slice(0,200));

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
