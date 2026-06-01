/**
 * RPG Matematika — Fáze 2 (učitelská konzole) smoke tests
 * Spusť: node tests/rpg-teacher.test.cjs
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18433;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// ── Mock Supabase s podporou rolí + saves ────────────────────────────────────
function mockScript(scenario) {
  return `
  (function(){
    const SCENARIO = ${JSON.stringify(scenario)};
    function mkClient(){
      const db = { roles: SCENARIO.roles||[], saves: SCENARIO.saves||[] };
      function tableQuery(table){
        let op='select', filters=[], single=false;
        function rows(){ let r=(db[table]||[]).slice();
          filters.forEach(([c,v])=>{ r=r.filter(x=>String(x[c])===String(v)); }); return r; }
        function resolve(){
          if(op==='select'){ const r=rows(); return Promise.resolve({data: single?(r[0]||null):r, error:null}); }
          return Promise.resolve({error:null});
        }
        const b={
          select(){op='select';return b;},
          insert(){op='insert';return b;},
          upsert(){op='upsert';return b;},
          update(){op='update';return b;},
          delete(){op='delete';return b;},
          eq(c,v){filters.push([c,v]);return b;},
          order(){return b;},
          maybeSingle(){single=true;return resolve();},
          then(res,rej){return resolve().then(res,rej);}
        };
        return b;
      }
      return {
        auth:{
          getSession: async()=>({data:{session: SCENARIO.session||null}}),
          onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
          signInWithOAuth: async()=>{ window.__loginCalled=true; },
          signOut: async()=>{}
        },
        from:(t)=>tableQuery(t)
      };
    }
    window.supabase = { createClient: ()=>mkClient() };
  })();
  `;
}

const sess = (email) => ({ user: { id: 'u-'+email, email, user_metadata:{full_name:'Test '+email} } });

let pass=0, fail=0;
function ok(name, cond, detail=''){ if(cond){console.log(`  ✅ ${name}`);pass++;} else {console.log(`  ❌ ${name}${detail?' — '+detail:''}`);fail++;} }

function startServer(){
  const mime={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',json:'application/json'};
  const srv=http.createServer((req,res)=>{
    let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    try{const buf=fs.readFileSync(path.join(ROOT,p));res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(buf);}
    catch{res.writeHead(404);res.end('nf');}
  });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}

async function run(){
  console.log('\n══════════════════════════════════════════');
  console.log('  RPG Matematika — Fáze 2 (konzole) Tests');
  console.log('══════════════════════════════════════════\n');

  const srv=await startServer();
  const browser=await chromium.launch({headless:true, executablePath:CHROMIUM});

  async function page(scenario){
    const ctx=await browser.newContext();
    await ctx.route('**jsdelivr**', r=>r.abort());
    await ctx.route('**supabase.co/**', r=>r.abort());
    const pg=await ctx.newPage();
    pg.on('dialog', d=>d.dismiss());
    await pg.addInitScript(mockScript(scenario));
    return {ctx,pg};
  }

  const SAVES = [
    {user_id:'u-zak1@husovaliberec.cz', game:'RPG_MAT_9', email:'zak1@husovaliberec.cz', full_name:'Žák Jedna',
     data:{name:'NEO', xp:350, level:4, attrs:{calc:5,geo:3,anal:4,craft:2}, done:{'1-0':1,'1-1':1,'1-2':1}, inv:['klíč']},
     updated_at:new Date().toISOString()},
    {user_id:'u-zak2@husovaliberec.cz', game:'RPG_MAT_6', email:'zak2@husovaliberec.cz', full_name:'Žák Dva',
     data:{name:'KAPITÁN', xp:120, level:2, attrs:{calc:2,geo:1,anal:1,craft:1}, done:{'1-0':1}, inv:[]},
     updated_at:new Date(Date.now()-30*864e5).toISOString()},
  ];

  try{
    // ── 1) Student → brána odmítne ──────────────────────────────────────
    console.log('[ 1 ] Student bez role → konzole skrytá');
    {
      const {ctx,pg}=await page({ session: sess('zak1@husovaliberec.cz'), roles:[], saves:SAVES });
      await pg.goto(`${BASE}/projects/rpg-ucitel.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForTimeout(1200);
      const conHidden=await pg.evaluate(()=>document.getElementById('console').classList.contains('hidden'));
      const gateBig=await pg.evaluate(()=>document.getElementById('gate-big').textContent);
      ok('Konzole skrytá pro studenta', conHidden);
      ok('Brána hlásí "Nemáš oprávnění"', gateBig.includes('oprávnění'), `"${gateBig}"`);
      await ctx.close();
    }
    console.log();

    // ── 2) Učitel → konzole, bez správy učitelů ─────────────────────────
    console.log('[ 2 ] Učitel → konzole + přehled');
    {
      const {ctx,pg}=await page({ session: sess('ucitel@husovaliberec.cz'),
        roles:[{email:'ucitel@husovaliberec.cz',role:'teacher'}], saves:SAVES });
      await pg.goto(`${BASE}/projects/rpg-ucitel.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'),{timeout:6000}).catch(()=>{});
      const conShown=await pg.evaluate(()=>!document.getElementById('console').classList.contains('hidden'));
      ok('Konzole zobrazena učiteli', conShown);
      const teachersTabHidden=await pg.evaluate(()=>document.getElementById('tab-teachers').classList.contains('hidden'));
      ok('Záložka "Správa učitelů" skrytá (jen teacher)', teachersTabHidden);
      await pg.waitForFunction(()=>document.querySelectorAll('.tbl tbody tr').length>0,{timeout:6000}).catch(()=>{});
      const rowCount=await pg.evaluate(()=>document.querySelectorAll('.tbl tbody tr').length);
      ok('Tabulka má 2 řádky (2 postavy)', rowCount===2, `řádků: ${rowCount}`);
      const students=await pg.evaluate(()=>document.getElementById('st-students').textContent);
      ok('Stat "žáků" = 2', students==='2', students);
      const tasks=await pg.evaluate(()=>document.getElementById('st-tasks').textContent);
      ok('Stat "úkolů hotovo" = 4', tasks==='4', tasks);
      const active=await pg.evaluate(()=>document.getElementById('st-active').textContent);
      ok('Stat "aktivních (7 dní)" = 1', active==='1', active);
      // teacher nemá mazací tlačítka
      const hasDelete=await pg.evaluate(()=>!!document.querySelector('.tbl .mini.red'));
      ok('Učitel nevidí mazací tlačítka', !hasDelete);
      await ctx.close();
    }
    console.log();

    // ── 3) Superadmin → správa učitelů + mazání ─────────────────────────
    console.log('[ 3 ] Superadmin → plná práva');
    {
      const {ctx,pg}=await page({ session: sess('vojta@husovaliberec.cz'),
        roles:[{email:'vojta@husovaliberec.cz',role:'superadmin'},{email:'kolega@husovaliberec.cz',role:'teacher'}],
        saves:SAVES });
      await pg.goto(`${BASE}/projects/rpg-ucitel.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'),{timeout:6000}).catch(()=>{});
      const teachersTabShown=await pg.evaluate(()=>!document.getElementById('tab-teachers').classList.contains('hidden'));
      ok('Záložka "Správa učitelů" viditelná superadminovi', teachersTabShown);
      await pg.waitForFunction(()=>document.querySelectorAll('.tbl tbody tr').length>0,{timeout:6000}).catch(()=>{});
      const hasDelete=await pg.evaluate(()=>!!document.querySelector('.tbl .mini.red'));
      ok('Superadmin vidí mazací tlačítka', hasDelete);
      // přepni na tab učitelů
      await pg.evaluate(()=>document.getElementById('tab-teachers').click());
      await pg.waitForTimeout(800);
      const teacherRows=await pg.evaluate(()=>document.querySelectorAll('#teachers-wrap .tbl tbody tr').length);
      ok('Seznam učitelů má 2 řádky', teacherRows===2, `řádků: ${teacherRows}`);
      await ctx.close();
    }
    console.log();

    // ── 4) Náhled hry (?preview=1) — banner + nic se neukládá ────────────
    console.log('[ 4 ] Náhled hry ?preview=1');
    {
      const {ctx,pg}=await page({ session:null, roles:[], saves:[] });
      await pg.goto(`${BASE}/projects/rpg-mat-9.html?preview=1`,{waitUntil:'domcontentloaded'});
      await pg.waitForTimeout(1200);
      const banner=await pg.evaluate(()=>{const b=document.getElementById('preview-banner');return b?b.textContent:'';});
      ok('Preview banner zobrazen', banner.includes('NÁHLED HRY'), `"${banner}"`);
      const cloudBarHidden=await pg.evaluate(()=>{const b=document.getElementById('cloud-bar');return !b||b.style.display==='none'||b.style.display==='';});
      ok('Cloud lišta skrytá v náhledu', cloudBarHidden);
      // simuluj uložení → nesmí dopadnout do reálného localStorage
      const persisted=await pg.evaluate(()=>{
        localStorage.setItem('RPG_MAT_9', JSON.stringify({name:'TEST'}));
        // čteme přes nativní zdroj? sandbox vrací z paměti; reálný klíč zůstává prázdný
        return localStorage.getItem('RPG_MAT_9');
      });
      // V sandboxu getItem vrací z paměti → 'TEST' je čitelný, ALE nezapsal se na disk.
      // Ověříme, že to je sandbox: po reloadu (nový kontext) klíč zmizí.
      await pg.reload({waitUntil:'domcontentloaded'});
      await pg.waitForTimeout(800);
      const afterReload=await pg.evaluate(()=>localStorage.getItem('RPG_MAT_9'));
      ok('Po reloadu žádný uložený stav (sandbox nic nezapsal)', afterReload===null, `hodnota: ${afterReload}`);
      await ctx.close();
    }
    console.log();

    // ── 5) Náhled postavy žáka (?su=ID) — banner + skok na mapu ──────────
    console.log('[ 5 ] Náhled postavy žáka ?su=ID');
    {
      const suSaves=[{user_id:'u-zak1', game:'RPG_MAT_9', email:'zak1@husovaliberec.cz', full_name:'Žák Jedna',
        data:{name:'NEO', xp:350, level:4, attrs:{calc:5,geo:3,anal:4,craft:2}, done:{'1-0':1}, inv:[]},
        updated_at:new Date().toISOString()}];
      const {ctx,pg}=await page({ session: sess('vojta@husovaliberec.cz'),
        roles:[{email:'vojta@husovaliberec.cz',role:'superadmin'}], saves:suSaves });
      await pg.goto(`${BASE}/projects/rpg-mat-9.html?su=u-zak1`,{waitUntil:'domcontentloaded'});
      await pg.waitForTimeout(1500);
      const banner=await pg.evaluate(()=>{const b=document.getElementById('preview-banner');return b?b.textContent:'';});
      ok('Banner "NÁHLED POSTAVY ŽÁKA" zobrazen', banner.includes('NÁHLED POSTAVY'), `"${banner}"`);
      const mapActive=await pg.evaluate(()=>document.getElementById('s-map').classList.contains('active'));
      ok('Hra skočila na mapu žáka', mapActive);
      const nm=await pg.evaluate(()=>{const e=document.getElementById('map-name');return e?e.textContent:'';});
      ok('Zobrazeno jméno postavy žáka (NEO)', nm==='NEO', `"${nm}"`);
      await ctx.close();
    }
    console.log();

    // ── 6) Hub — odkaz na konzoli jen pro staff ─────────────────────────
    console.log('[ 6 ] Hub — odkaz na konzoli podle role');
    {
      const {ctx,pg}=await page({ session: sess('ucitel@husovaliberec.cz'),
        roles:[{email:'ucitel@husovaliberec.cz',role:'teacher'}], saves:[] });
      await pg.goto(`${BASE}/projects/rpg-matematika.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForFunction(()=>{const l=document.getElementById('teacher-link');return l&&l.style.display!=='none';},{timeout:6000}).catch(()=>{});
      const linkShown=await pg.evaluate(()=>{const l=document.getElementById('teacher-link');return l&&l.style.display!=='none';});
      ok('Učitel vidí odkaz na konzoli na hubu', linkShown);
      await ctx.close();
    }
    {
      const {ctx,pg}=await page({ session: sess('zak@husovaliberec.cz'), roles:[], saves:[] });
      await pg.goto(`${BASE}/projects/rpg-matematika.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForTimeout(1200);
      const linkHidden=await pg.evaluate(()=>{const l=document.getElementById('teacher-link');return !l||l.style.display==='none';});
      ok('Student nevidí odkaz na konzoli', linkHidden);
      await ctx.close();
    }

  }catch(e){ console.error('\nChyba testu:',e.message,e.stack); fail++; }

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════\n');
  if(fail>0) process.exit(1);
}
run().catch(e=>{console.error(e);process.exit(1);});
