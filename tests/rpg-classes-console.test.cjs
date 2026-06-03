/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 3 — učitelská konzole (Playwright): záložka Třídy + poznámky
   Mock Supabage persistuje classes/class_members/notes a vrací inserty.
   Spusť: node tests/rpg-classes-console.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18477;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function ok(name, cond, d='') { if (cond){console.log('  ✅ '+name);pass++;} else {console.log('  ❌ '+name+(d?' — '+d:''));fail++;} }

function mockScript(scenario) {
  return `(function(){
    const S = ${JSON.stringify(scenario)};
    const db = { roles:S.roles||[], saves:S.saves||[], classes:[], class_members:[], notes:[] };
    let _id=1;
    function mkClient(){
      function q(table){
        let op='select', filters=[], single=false, payload=null;
        function rows(){ let r=(db[table]||[]).slice(); filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));}); return r; }
        function doInsert(){ const arr=Array.isArray(payload)?payload:[payload]; const out=[]; arr.forEach(p=>{ const row=Object.assign({},p); if(table==='classes'&&!row.id)row.id='cls-'+(_id++); db[table].push(row); out.push(row); }); return out; }
        function doUpsert(){ const arr=Array.isArray(payload)?payload:[payload]; arr.forEach(p=>{ if(table==='class_members'){ const ex=db.class_members.find(m=>m.class_id===p.class_id&&m.user_id===p.user_id); if(!ex)db.class_members.push(Object.assign({},p)); } else { db[table].push(Object.assign({},p)); } }); return []; }
        function resolve(){
          if(op==='select'){ const r=rows(); return Promise.resolve({data: single?(r[0]||null):r, error:null}); }
          if(op==='insert'){ const o=doInsert(); return Promise.resolve({data: single?(o[0]||null):o, error:null}); }
          if(op==='upsert'){ doUpsert(); return Promise.resolve({data:null, error:null}); }
          if(op==='update'){ rows().forEach(x=>Object.assign(x,payload)); return Promise.resolve({data:null,error:null}); }
          if(op==='delete'){ db[table]=(db[table]||[]).filter(x=>!filters.every(([c,v])=>String(x[c])===String(v))); return Promise.resolve({data:null,error:null}); }
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
      return { auth:{ getSession:async()=>({data:{session:S.session||null}}), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}), signInWithOAuth:async()=>{}, signOut:async()=>{} }, from:q };
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

async function run() {
  console.log('\n── Fáze 3: konzole (třídy + poznámky) ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:CHROMIUM });
  const errors = [];
  try {
    const admin='vojtech.konopa@husovaliberec.cz';
    const scenario = {
      roles: [{ email: admin, role:'superadmin' }],
      session: { user:{ id:'u-admin', email:admin, user_metadata:{full_name:'Vojta'} } },
      saves: [
        { user_id:'z1', game:'RPG_MAT_9', data:{name:'Neo',xp:300,level:4,done:{'1-1-0':1}}, name:'Neo', email:'zak1@husovaliberec.cz', full_name:'Žák Jedna', updated_at:new Date().toISOString() },
        { user_id:'z2', game:'RPG_MAT_7', data:{name:'Trinity',xp:120,level:2,done:{}}, name:'Trinity', email:'zak2@husovaliberec.cz', full_name:'Žák Dva', updated_at:new Date().toISOString() },
      ],
    };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    page.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource|ERR_/i.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(mockScript(scenario));
    await page.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil:'load' });

    await page.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'), {timeout:8000});
    ok('konzole se zobrazí superadminovi', true);

    // přepni na záložku Třídy
    await page.click('.tab[data-tab="classes"]');
    await page.waitForFunction(()=>!document.getElementById('t-classes').classList.contains('hidden'),{timeout:4000});
    ok('záložka Třídy se otevře', true);

    // založ třídu
    await page.fill('#new-class','9.A');
    await page.click('button[onclick="createClassUI()"]');
    await page.waitForFunction(()=>/9\.A/.test(document.getElementById('classes-wrap').textContent),{timeout:4000});
    ok('nová třída „9.A" se objeví v seznamu', true);

    // rozbal roster a přiřaď prvního žáka
    await page.click('#classes-wrap button[onclick^="toggleRoster"]');
    await page.waitForSelector('#classes-wrap input[type="checkbox"]',{timeout:4000});
    const boxes = await page.$$('#classes-wrap input[type="checkbox"]');
    ok('roster ukazuje žáky k přiřazení', boxes.length>=2, 'nalezeno '+boxes.length);
    await boxes[0].click();
    await page.waitForFunction(()=>/1 žáků|1 žák/.test(document.getElementById('classes-wrap').textContent),{timeout:4000}).catch(()=>{});
    const memberCount = await page.evaluate(()=>MEMBERSHIPS.length);
    ok('přiřazení žáka přidá členství', memberCount===1, 'memberships='+memberCount);

    // filtr podle třídy v přehledu
    await page.click('.tab[data-tab="overview"]');
    await page.waitForFunction(()=>!document.getElementById('t-overview').classList.contains('hidden'),{timeout:4000});
    const optCount = await page.evaluate(()=>document.getElementById('fclass').options.length);
    ok('filtr tříd je naplněn', optCount===2, 'options='+optCount);
    const assignedUid = await page.evaluate(()=>MEMBERSHIPS[0].user_id);
    await page.evaluate(()=>{ const s=document.getElementById('fclass'); s.value=s.options[1].value; renderTable(); });
    const rowsShown = await page.evaluate(()=>window.__filtered.length);
    ok('filtr podle třídy zúží přehled na členy', rowsShown===1, 'řádků='+rowsShown);
    await page.evaluate(()=>{ document.getElementById('fclass').value=''; renderTable(); });

    // detail žáka → poznámka
    await page.evaluate(()=>openDetail(0));
    await page.waitForSelector('#note-body',{timeout:4000});
    ok('detail žáka má pole pro poznámku', true);
    await page.fill('#note-body','Výborně zvládnutý reaktor!');
    await page.click('button[onclick="addNoteUI(0)"]');
    await page.waitForFunction(()=>/Výborně zvládnutý reaktor/.test(document.getElementById('notes-box').textContent),{timeout:4000});
    ok('přidaná poznámka se zobrazí v detailu', true);
    const noteCount = await page.evaluate(()=>document.querySelectorAll('#notes-box button.red').length);
    ok('poznámka má tlačítko smazat', noteCount===1);

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
