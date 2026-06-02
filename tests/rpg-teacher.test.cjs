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

    console.log();

    // ── 7) Mistrovství napříč ročníky 6/7/8/9 ───────────────────────────
    console.log('[ 7 ] Mistrovství v konzoli pro 6./7./8./9. ročník');
    {
      const M=(s)=>({score:15,mastered:true});
      const masterySaves=[
        {user_id:'u-m6', game:'RPG_MAT_6', email:'m6@husovaliberec.cz', full_name:'Šestka',
         data:{name:'ASTRO', xp:200, level:3, attrs:{calc:3,geo:2,anal:2,craft:1}, done:{'1-0':1},
           mastery:{'1-2':M()}}, updated_at:new Date().toISOString()},
        {user_id:'u-m7', game:'RPG_MAT_7', email:'m7@husovaliberec.cz', full_name:'Sedmička',
         data:{name:'INDY', xp:300, level:4, attrs:{calc:4,geo:2,anal:3,craft:2}, done:{'1-0':1},
           mastery:{'3-2':M(),'4-1':M()}}, updated_at:new Date().toISOString()},
        {user_id:'u-m8', game:'RPG_MAT_8', email:'m8@husovaliberec.cz', full_name:'Osmička',
         data:{name:'EULER', xp:400, level:5, attrs:{calc:5,geo:3,anal:4,craft:2}, done:{'1-0':1},
           mastery:{'1-1':M(),'2-1':M(),'5-2':M()}}, updated_at:new Date().toISOString()},
        {user_id:'u-m9', game:'RPG_MAT_9', email:'m9@husovaliberec.cz', full_name:'Devítka',
         data:{name:'NEO', xp:500, level:6, attrs:{calc:6,geo:4,anal:5,craft:3}, done:{'1-0':1},
           mastery:{'7-3':M()}}, updated_at:new Date().toISOString()},
      ];
      const {ctx,pg}=await page({ session: sess('vojta@husovaliberec.cz'),
        roles:[{email:'vojta@husovaliberec.cz',role:'superadmin'}], saves:masterySaves });
      await pg.goto(`${BASE}/projects/rpg-ucitel.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForFunction(()=>document.querySelectorAll('.tbl tbody tr').length>0,{timeout:6000}).catch(()=>{});

      // stat počítá mistrovství napříč všemi ročníky (1+2+3+1 = 7)
      const stMastery=await pg.evaluate(()=>document.getElementById('st-mastery').textContent);
      ok('Stat mistrovství = 7 (napříč všemi ročníky)', stMastery==='7', stMastery);

      // tabulka ukazuje 🏅 buňku i pro ne-9. ročníky
      const badgeRows=await pg.evaluate(()=>[...document.querySelectorAll('.tbl tbody tr')]
        .filter(tr=>tr.innerHTML.includes('🏅')).length);
      ok('Všechny 4 ročníky mají 🏅 buňku v tabulce', badgeRows===4, 'řádků s 🏅: '+badgeRows);

      // detail 8. ročníku → buildMasteryHtml s názvy misí 8. ročníku
      const det8=await pg.evaluate(()=>{
        const i=window.__filtered.findIndex(r=>r.game==='RPG_MAT_8');
        openDetail(i);
        return document.getElementById('modal').innerHTML;
      });
      ok('Detail 8.r. ukazuje "3 / 21 🏅"', det8.includes('3 / 21'), 'chybí počet');
      ok('Detail 8.r. má název mise 8.r. (Celá čísla)', det8.includes('Celá čísla'));
      ok('Detail 8.r. NEukazuje názvy z 9.r. (Bootovací)', !det8.includes('Bootovací'));

      // detail 6. ročníku → názvy misí 6. ročníku
      const det6=await pg.evaluate(()=>{
        const i=window.__filtered.findIndex(r=>r.game==='RPG_MAT_6');
        openDetail(i);
        return document.getElementById('modal').innerHTML;
      });
      ok('Detail 6.r. má název mise 6.r. (Obvod a obsah)', det6.includes('Obvod a obsah'));
      ok('Detail 6.r. ukazuje "1 / 21 🏅"', det6.includes('1 / 21'));

      await ctx.close();
    }

    // ── 8) Teacher unlock napříč ročníky 6/7/8/9 ────────────────────────
    console.log('[ 8 ] Teacher unlock v konzoli pro 6./7./8./9. ročník');
    {
      const unlockSaves=[
        {user_id:'u-ul6', game:'RPG_MAT_6', email:'ul6@husovaliberec.cz', full_name:'Šestka',
         data:{name:'ASTRO', xp:0, level:1, attrs:{calc:0,geo:0,anal:0,craft:0}, done:{}, inv:[], mastery:{}, xpClaimed:{}, teacherUnlocked:['2-1']},
         updated_at:new Date().toISOString()},
        {user_id:'u-ul7', game:'RPG_MAT_7', email:'ul7@husovaliberec.cz', full_name:'Sedmička',
         data:{name:'INDY', xp:0, level:1, attrs:{calc:0,geo:0,anal:0,craft:0}, done:{}, inv:[], mastery:{}, xpClaimed:{}, teacherUnlocked:[]},
         updated_at:new Date().toISOString()},
        {user_id:'u-ul8', game:'RPG_MAT_8', email:'ul8@husovaliberec.cz', full_name:'Osmička',
         data:{name:'EULER', xp:0, level:1, attrs:{calc:0,geo:0,anal:0,craft:0}, done:{}, inv:[], mastery:{}, xpClaimed:{}, teacherUnlocked:['3-2']},
         updated_at:new Date().toISOString()},
        {user_id:'u-ul9', game:'RPG_MAT_9', email:'ul9@husovaliberec.cz', full_name:'Devítka',
         data:{name:'NEO', xp:0, level:1, attrs:{calc:0,geo:0,anal:0,craft:0}, done:{}, inv:[], mastery:{}, xpClaimed:{}, teacherUnlocked:[]},
         updated_at:new Date().toISOString()},
      ];
      const {ctx,pg}=await page({ session: sess('admin@husovaliberec.cz'),
        roles:[{email:'admin@husovaliberec.cz',role:'superadmin'}], saves:unlockSaves });
      await pg.goto(`${BASE}/projects/rpg-ucitel.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForFunction(()=>document.querySelectorAll('.tbl tbody tr').length>0,{timeout:6000}).catch(()=>{});

      // buildUnlockHtml vrací HTML pro všechny ročníky (ne prázdné)
      const unlockHtmls=await pg.evaluate(()=>{
        return ['RPG_MAT_6','RPG_MAT_7','RPG_MAT_8','RPG_MAT_9'].map(game=>{
          const i=window.__filtered.findIndex(r=>r.game===game);
          return i>=0?buildUnlockHtml(window.__filtered[i]):'';
        });
      });
      ok('buildUnlockHtml vrací HTML pro 6. ročník', unlockHtmls[0].includes('Odemknout misi'));
      ok('buildUnlockHtml vrací HTML pro 7. ročník', unlockHtmls[1].includes('Odemknout misi'));
      ok('buildUnlockHtml vrací HTML pro 8. ročník', unlockHtmls[2].includes('Odemknout misi'));
      ok('buildUnlockHtml vrací HTML pro 9. ročník', unlockHtmls[3].includes('Odemknout misi'));

      // existující unlock 2-1 v 6.r. se zobrazí jako pill
      ok('Unlock 2-1 viditelný v 6.r. detailu', unlockHtmls[0].includes('2-1'));
      // dropdown pro 8.r. obsahuje mise 8. ročníku (nikoli 9.)
      ok('Dropdown 8.r. obsahuje misi z 8.r. (Celá čísla)', unlockHtmls[2].includes('Celá čísla'));
      ok('Dropdown 8.r. NEobsahuje mise 9.r. (Bootovací)', !unlockHtmls[2].includes('Bootovací'));
      // dropdown pro 6.r. obsahuje mise 6. ročníku
      ok('Dropdown 6.r. obsahuje misi z 6.r. (Obvod a obsah)', unlockHtmls[0].includes('Obvod a obsah'));

      await ctx.close();
    }

    // ── 9) Hromadné akce (jen superadmin) ───────────────────────────────
    console.log('[ 9 ] Hromadné akce — výběr, +XP, unlock, cross-grade guard');
    {
      const bulkSaves=[
        {user_id:'b-1', game:'RPG_MAT_8', email:'b1@husovaliberec.cz', full_name:'Anna',
         data:{name:'A', xp:100, level:2, attrs:{calc:0,geo:0,anal:0,craft:0}, done:{}, inv:[], mastery:{}, xpClaimed:{}, teacherUnlocked:[]},
         updated_at:new Date().toISOString()},
        {user_id:'b-2', game:'RPG_MAT_8', email:'b2@husovaliberec.cz', full_name:'Bára',
         data:{name:'B', xp:200, level:3, attrs:{calc:0,geo:0,anal:0,craft:0}, done:{}, inv:[], mastery:{}, xpClaimed:{}, teacherUnlocked:[]},
         updated_at:new Date().toISOString()},
        {user_id:'b-3', game:'RPG_MAT_9', email:'b3@husovaliberec.cz', full_name:'Cyril',
         data:{name:'C', xp:0, level:1, attrs:{calc:0,geo:0,anal:0,craft:0}, done:{}, inv:[], mastery:{}, xpClaimed:{}, teacherUnlocked:[]},
         updated_at:new Date().toISOString()},
      ];
      const {ctx,pg}=await page({ session: sess('admin@husovaliberec.cz'),
        roles:[{email:'admin@husovaliberec.cz',role:'superadmin'}], saves:bulkSaves });
      await pg.goto(`${BASE}/projects/rpg-ucitel.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForFunction(()=>document.querySelectorAll('.tbl tbody tr').length>0,{timeout:6000}).catch(()=>{});

      // superadmin vidí zaškrtávací sloupec
      const hasChecks=await pg.evaluate(()=>document.querySelectorAll('.sel-row').length);
      ok('Superadmin vidí zaškrtávací sloupec', hasChecks===3, 'checkboxů: '+hasChecks);

      // bulk bar je skrytý dokud nic není vybráno
      const hiddenInit=await pg.evaluate(()=>document.getElementById('bulk-bar').classList.contains('hidden'));
      ok('Bulk bar skrytý bez výběru', hiddenInit===true);

      // vyber dvě postavy 8. ročníku (b-1, b-2)
      const barShown=await pg.evaluate(()=>{
        const idx=window.__filtered.map((r,i)=>[r.user_id,i]).filter(([u])=>u==='b-1'||u==='b-2').map(([,i])=>i);
        idx.forEach(i=>toggleSel(i,true));
        return {count:document.getElementById('bulk-count').textContent,
                hidden:document.getElementById('bulk-bar').classList.contains('hidden')};
      });
      ok('Bulk bar ukáže "2 vybráno"', barShown.count==='2', 'count: '+barShown.count);
      ok('Bulk bar se zobrazí při výběru', barShown.hidden===false);

      // dropdown nabízí mise 8. ročníku (stejný ročník)
      const midOpts=await pg.evaluate(()=>document.getElementById('bulk-mid').innerHTML);
      ok('Bulk dropdown obsahuje mise 8.r. (Celá čísla)', midOpts.includes('Celá čísla'));

      // hromadné +50 XP oběma vybraným
      const afterXp=await pg.evaluate(async()=>{
        document.getElementById('bulk-xp').value='50';
        await bulkAwardXp();
        const a=window.__filtered.find(r=>r.user_id==='b-1').data.xp;
        const b=window.__filtered.find(r=>r.user_id==='b-2').data.xp;
        const c=window.__filtered.find(r=>r.user_id==='b-3').data.xp;
        return {a,b,c};
      });
      ok('b-1 dostal +50 XP (100→150)', afterXp.a===150, 'xp: '+afterXp.a);
      ok('b-2 dostal +50 XP (200→250)', afterXp.b===250, 'xp: '+afterXp.b);
      ok('Nevybraný b-3 beze změny (0)', afterXp.c===0, 'xp: '+afterXp.c);

      // hromadné odemčení mise 3-2 vybraným (po renderTable se výběr drží podle klíče)
      const afterUnlock=await pg.evaluate(async()=>{
        const idx=window.__filtered.map((r,i)=>[r.user_id,i]).filter(([u])=>u==='b-1'||u==='b-2').map(([,i])=>i);
        idx.forEach(i=>toggleSel(i,true));
        document.getElementById('bulk-mid').value='3-2';
        await bulkUnlock();
        const a=window.__filtered.find(r=>r.user_id==='b-1').data.teacherUnlocked;
        const b=window.__filtered.find(r=>r.user_id==='b-2').data.teacherUnlocked;
        const c=window.__filtered.find(r=>r.user_id==='b-3').data.teacherUnlocked;
        return {a,b,c};
      });
      ok('b-1 má odemčeno 3-2', afterUnlock.a.includes('3-2'));
      ok('b-2 má odemčeno 3-2', afterUnlock.b.includes('3-2'));
      ok('Nevybraný b-3 nemá nic odemčeno', afterUnlock.c.length===0);

      // cross-grade guard: vyber 8.r. + 9.r. → unlock zablokován
      const crossGuard=await pg.evaluate(async()=>{
        clearSel();
        window.__filtered.forEach((r,i)=>{if(r.user_id==='b-1'||r.user_id==='b-3')toggleSel(i,true);});
        const optsHtml=document.getElementById('bulk-mid').innerHTML;
        // pokus o unlock musí selhat (různé ročníky) → b-3 stále bez unlocku z tohoto kroku
        document.getElementById('bulk-mid').value='';
        await bulkUnlock();
        return {opts:optsHtml, b3unlocks:window.__filtered.find(r=>r.user_id==='b-3').data.teacherUnlocked.length};
      });
      ok('Cross-grade výběr blokuje dropdown misí', crossGuard.opts.includes('jednoho ročníku'));
      ok('Cross-grade unlock nic neprovede (b-3 = 0)', crossGuard.b3unlocks===0);

      // clearSel schová bulk bar
      const cleared=await pg.evaluate(()=>{clearSel();return document.getElementById('bulk-bar').classList.contains('hidden');});
      ok('clearSel schová bulk bar', cleared===true);

      // učitel (ne superadmin) zaškrtávací sloupec nevidí
      await ctx.close();
      const {ctx:ctx2,pg:pg2}=await page({ session: sess('ucitel@husovaliberec.cz'),
        roles:[{email:'ucitel@husovaliberec.cz',role:'teacher'}], saves:bulkSaves });
      await pg2.goto(`${BASE}/projects/rpg-ucitel.html`,{waitUntil:'domcontentloaded'});
      await pg2.waitForFunction(()=>document.querySelectorAll('.tbl tbody tr').length>0,{timeout:6000}).catch(()=>{});
      const teacherChecks=await pg2.evaluate(()=>document.querySelectorAll('.sel-row').length);
      ok('Učitel (ne admin) nevidí zaškrtávací sloupec', teacherChecks===0, 'checkboxů: '+teacherChecks);
      await ctx2.close();
    }

  }catch(e){ console.error('\nChyba testu:',e.message,e.stack); fail++; }

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════\n');
  if(fail>0) process.exit(1);
}
run().catch(e=>{console.error(e);process.exit(1);});
