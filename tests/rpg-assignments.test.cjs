/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 20 — učitelské úkoly s termínem (Playwright, mock Supabase).
   Konzole ÚKOLY: create → list → progress → delete + XSS + student pull.
   Spusť: NODE_PATH=/opt/node22/lib/node_modules node tests/rpg-assignments.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18492;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function ok(name, cond, d='') { if (cond){console.log('  ✅ '+name);pass++;} else {console.log('  ❌ '+name+(d?' — '+d:''));fail++;} }

function mockScript(scenario) {
  return `(function(){
    const S = ${JSON.stringify(scenario)};
    const db = { roles:S.roles||[], saves:S.saves||[], classes:S.classes||[], class_members:S.class_members||[], assignments:[] };
    let _id=1;
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
      function clsName(cid){ const c=db.classes.find(x=>x.id===cid); return c?c.name:'?'; }
      return {
        auth:{ getSession:async()=>({data:{session:S.session||null}}), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}), signInWithOAuth:async()=>{}, signOut:async()=>{} },
        from:q,
        rpc:async(fn,args)=>{
          window.__rpcCalls.push({fn,args});
          if(fn==='create_assignment'){ const id='a-'+(_id++); db.assignments.push({id,class_id:args.p_class_id,game:args.p_game,mission_id:args.p_mission_id,due_date:args.p_due_date||null}); return {data:id,error:null}; }
          if(fn==='list_assignments'){ return {data:db.assignments.map(a=>({id:a.id,class_id:a.class_id,class_name:clsName(a.class_id),game:a.game,mission_id:a.mission_id,due_date:a.due_date,created_at:'2026-07-23'})),error:null}; }
          if(fn==='delete_assignment'){ db.assignments=db.assignments.filter(a=>a.id!==args.p_id); return {data:null,error:null}; }
          if(fn==='assignment_progress'){ return {data:S.progress||[],error:null}; }
          if(fn==='my_assignments'){ return {data:S.mine||[],error:null}; }
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
  console.log('\n── Fáze 20: konzole ÚKOLY ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:CHROMIUM });
  const errors = [];
  try {
    const admin='vojtech.konopa@husovaliberec.cz';
    const scenario = {
      roles: [{ email: admin, role:'superadmin' }],
      session: { user:{ id:'u-admin', email:admin, user_metadata:{full_name:'Vojta'} } },
      saves: [],
      classes: [{ id:'cls-9b', name:'9.B <img src=x onerror="window.__xss=1">', cohort_start_year:null, archived:false }],
      progress: [
        { display_name:'Anička', mastered:true },
        { display_name:'<img src=x onerror="window.__xss=2">', mastered:false },
      ],
    };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    page.on('dialog', d=>d.accept());
    await page.addInitScript(mockScript(scenario));
    await page.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil:'load' });
    await page.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'), {timeout:8000});

    // ── záložka ÚKOLY ──
    await page.click('[data-tab="assignments"]');
    await page.waitForFunction(()=>!document.getElementById('t-assignments').classList.contains('hidden'), {timeout:4000});
    ok('záložka ÚKOLY se otevře', true);

    // selecty se naplní
    await page.waitForFunction(()=>document.querySelectorAll('#asg-class option').length>=2, {timeout:4000});
    const classOpts = await page.evaluate(()=>document.querySelectorAll('#asg-class option').length);
    ok('select tříd naplněn', classOpts>=2, 'opts='+classOpts);
    const gameOpts = await page.evaluate(()=>document.querySelectorAll('#asg-game option').length);
    ok('select her naplněn (7 her + placeholder)', gameOpts>=8, 'opts='+gameOpts);

    // vyber hru → mise se doplní podle hry
    await page.selectOption('#asg-game','RPG_MAT_9');
    await page.waitForFunction(()=>document.querySelectorAll('#asg-mid option').length>=2, {timeout:4000});
    const midOpts = await page.evaluate(()=>document.querySelectorAll('#asg-mid option').length);
    ok('mise se doplní podle hry', midOpts>=2, 'opts='+midOpts);

    // vytvoř úkol
    await page.selectOption('#asg-class','cls-9b');
    await page.selectOption('#asg-mid','2-3');
    await page.fill('#asg-due','2026-09-05');
    await page.click('button:has-text("Zadat úkol")');
    await page.waitForFunction(()=>window.__rpcCalls.some(c=>c.fn==='create_assignment'), {timeout:4000});
    const created = await page.evaluate(()=>window.__rpcCalls.find(c=>c.fn==='create_assignment'));
    ok('create_assignment volán se správnými parametry',
      created && created.args.p_class_id==='cls-9b' && created.args.p_game==='RPG_MAT_9' && created.args.p_mission_id==='2-3' && created.args.p_due_date==='2026-09-05',
      JSON.stringify(created&&created.args));

    // úkol se objeví v seznamu
    await page.waitForFunction(()=>document.querySelectorAll('#assignments-wrap button').length>0, {timeout:4000});
    const listed = await page.evaluate(()=>document.getElementById('assignments-wrap').textContent);
    ok('úkol je v seznamu (mise + třída)', /2-3/.test(listed) && /9\.B/.test(listed), listed.slice(0,80));

    // XSS: název třídy s payloadem se nespustí
    const xss1 = await page.evaluate(()=>window.__xss);
    ok('XSS v názvu třídy neprovedeno', !xss1);

    // progress: kdo splnil
    await page.click('button:has-text("Kdo splnil")');
    await page.waitForFunction(()=>window.__rpcCalls.some(c=>c.fn==='assignment_progress'), {timeout:4000});
    await page.waitForFunction(()=>/Splnilo/.test(document.getElementById('assignments-wrap').textContent), {timeout:4000});
    const prog = await page.evaluate(()=>document.getElementById('assignments-wrap').textContent);
    ok('progress ukáže splnil/nesplnil + počet', /Splnilo/.test(prog) && /Anička/.test(prog) && /1 \/ 2/.test(prog), prog.slice(-120));
    const xss2 = await page.evaluate(()=>window.__xss);
    ok('XSS ve jméně žáka neprovedeno', !xss2);

    // smazání úkolu
    await page.click('#assignments-wrap button.red');
    await page.waitForFunction(()=>window.__rpcCalls.some(c=>c.fn==='delete_assignment'), {timeout:4000});
    await page.waitForFunction(()=>/žádné úkoly/.test(document.getElementById('assignments-wrap').textContent), {timeout:4000});
    ok('úkol smazán (seznam prázdný)', true);

    ok('žádné JS chyby', errors.length===0, errors.join(' | '));
  } catch (e) {
    ok('běh testu bez výjimky', false, e.message);
  } finally {
    await browser.close();
    srv.close();
  }
  console.log(`\n${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
}
run();
