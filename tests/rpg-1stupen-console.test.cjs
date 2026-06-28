/**
 * Učitelská konzole — integrace 1. stupně (3.–5. ročník).
 * Ověřuje: přehled žáků 1. stupně, statistiky/diagnostika/žebříček/vysvětlení
 * obsahují 3.–5., a hlavně NÁHLED postavy žáka (?su=) i hra nanečisto (?preview=1)
 * fungují pro hru 1. stupně.
 * Spusť: node tests/rpg-1stupen-console.test.cjs
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18434;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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
        const b={ select(){op='select';return b;}, insert(){op='insert';return b;},
          upsert(){op='upsert';return b;}, update(){op='update';return b;}, delete(){op='delete';return b;},
          eq(c,v){filters.push([c,v]);return b;}, order(){return b;},
          maybeSingle(){single=true;return resolve();}, then(res,rej){return resolve().then(res,rej);} };
        return b;
      }
      return { auth:{ getSession: async()=>({data:{session: SCENARIO.session||null}}),
          onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
          signInWithOAuth: async()=>{}, signOut: async()=>{} }, from:(t)=>tableQuery(t) };
    }
    window.supabase = { createClient: ()=>mkClient() };
  })();
  `;
}
const sess = (email) => ({ user: { id: 'u-'+email, email, user_metadata:{full_name:'Test '+email} } });

let pass=0, fail=0;
function ok(name, cond, detail=''){ if(cond){console.log(`  ✅ ${name}`);pass++;} else {console.log(`  ❌ ${name}${detail?' — '+detail:''}`);fail++;} }

function startServer(){
  const mime={html:'text/html',js:'application/javascript',css:'text/css'};
  const srv=http.createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    try{const fp=path.normalize(path.join(ROOT,p));if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('x');return;}const buf=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(buf);}
    catch{res.writeHead(404);res.end('nf');} });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}

// žáci napříč 1. i 2. stupněm
const SAVES = [
  {user_id:'u-zak3', game:'RPG_MAT_3', email:'zak3@husovaliberec.cz', full_name:'Lesní Žák',
   data:{name:'PRŮZKUMNÍK', xp:230, level:3, attrs:{calc:4,geo:2,anal:3,craft:1}, done:{'1-0':1,'1-1':1,'1-2':1}, errs:{'1-1':3,'4-2':2}, mastery:{'1-1':{score:15,mastered:true}}}, updated_at:new Date().toISOString()},
  {user_id:'u-zak4', game:'RPG_MAT_4', email:'zak4@husovaliberec.cz', full_name:'Pirátka Žák',
   data:{name:'KAPITÁNKA', xp:140, level:2, attrs:{calc:2,geo:1,anal:1,craft:1}, done:{'1-0':1}, errs:{'2-2':1}}, updated_at:new Date().toISOString()},
  {user_id:'u-zak5', game:'RPG_MAT_5', email:'zak5@husovaliberec.cz', full_name:'Dračí Žák',
   data:{name:'DRAKOBIJEC', xp:410, level:5, attrs:{calc:6,geo:4,anal:5,craft:3}, done:{'1-0':1,'1-1':1}, errs:{'5-2':4}}, updated_at:new Date().toISOString()},
  {user_id:'u-zak9', game:'RPG_MAT_9', email:'zak9@husovaliberec.cz', full_name:'Coder Žák',
   data:{name:'NEO', xp:350, level:4, attrs:{calc:5,geo:3,anal:4,craft:2}, done:{'1-0':1}, errs:{}}, updated_at:new Date().toISOString()},
];

async function run(){
  console.log('\n══════════════════════════════════════════');
  console.log('  Konzole — integrace 1. stupně (3.–5.)');
  console.log('══════════════════════════════════════════\n');
  const srv=await startServer();
  const browser=await chromium.launch({headless:true, executablePath:CHROMIUM});
  async function page(scenario){
    const ctx=await browser.newContext();
    for(const pat of ['**jsdelivr**','**supabase.co/**','**fonts.googleapis.com**','**fonts.gstatic.com**']) await ctx.route(pat,r=>r.abort());
    const pg=await ctx.newPage(); pg.on('dialog',d=>d.dismiss());
    await pg.addInitScript(mockScript(scenario));
    return {ctx,pg};
  }
  const SUPER={ session:sess('vojta@husovaliberec.cz'), roles:[{email:'vojta@husovaliberec.cz',role:'superadmin'}], saves:SAVES };

  try{
    // ── 1) Přehled obsahuje žáky 1. stupně ──
    console.log('[ 1 ] Přehled žáků — 1. stupeň viditelný');
    {
      const {ctx,pg}=await page(SUPER);
      await pg.goto(`${BASE}/projects/rpg-ucitel.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForFunction(()=>document.querySelectorAll('.tbl tbody tr').length>0,{timeout:8000}).catch(()=>{});
      const rows=await pg.evaluate(()=>document.querySelectorAll('.tbl tbody tr').length);
      ok('Tabulka má 4 žáky (3.,4.,5.,9.)', rows===4, 'řádků: '+rows);
      const body=await pg.evaluate(()=>document.querySelector('.tbl tbody').textContent);
      ok('Přehled zmiňuje 1. stupeň (🌳/🏴‍☠️/🐉 nebo jména)', /PRŮZKUMNÍK|KAPITÁNKA|DRAKOBIJEC|🌳|🐉/.test(body), body.slice(0,80));
      const students=await pg.evaluate(()=>document.getElementById('st-students').textContent);
      ok('Statistika "žáků" započítává 1. stupeň (=4)', students==='4', students);
      await ctx.close();
    }
    console.log();

    // ── 2) Diagnostika + žebříček + vysvětlení nabízí 3.–5. ──
    console.log('[ 2 ] Statistiky (diagnostika/žebříček/vysvětlení) mají 3.–5.');
    {
      const {ctx,pg}=await page(SUPER);
      await pg.goto(`${BASE}/projects/rpg-ucitel.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForFunction(()=>typeof GAMES!=='undefined',{timeout:8000}).catch(()=>{});
      const has35=await pg.evaluate(()=>['RPG_MAT_3','RPG_MAT_4','RPG_MAT_5'].every(k=>GAMES.some(g=>g.key===k)&&MISSIONS_BY_GAME[k]&&MISSIONS_BY_GAME[k].length===21&&AREA_NAMES[k]&&AREA_NAMES[k].length===7));
      ok('GAMES+MISSIONS+AREA_NAMES kompletní pro 3.–5.', has35);
      // diagnostika: vyber 3. ročník a vykresli heatmapu
      const diag=await pg.evaluate(async()=>{
        document.getElementById('tab-diag')&&document.getElementById('tab-diag').click();
        const gs=document.getElementById('diag-game'); if(!gs) return 'no-diag-game';
        gs.value='RPG_MAT_3'; if(typeof renderDiag==='function') await renderDiag();
        const w=document.getElementById('diag-wrap')||document.querySelector('#t-diag');
        return w?w.textContent.slice(0,400):'no-wrap';
      });
      ok('Diagnostika 3. ročníku vykreslí oblasti (Palouk/Houbová/…)', /Palouk|Houbová|Liščí|čísel|násobilka|Dělení/i.test(diag), diag.slice(0,80));
      // vysvětlení dropdown
      const explHas3=await pg.evaluate(()=>{const s=document.getElementById('expl-game');return s&&[...s.options].some(o=>o.value==='RPG_MAT_3');});
      ok('„Vysvětlení" nabízí 3. ročník', explHas3);
      await ctx.close();
    }
    console.log();

    // ── 3) NÁHLED postavy žáka (?su=) pro 3. ročník ──
    console.log('[ 3 ] Náhled postavy žáka 1. stupně (?su=)');
    {
      const {ctx,pg}=await page(SUPER);
      await pg.goto(`${BASE}/projects/rpg-mat-3.html?su=u-zak3`,{waitUntil:'domcontentloaded'});
      await pg.waitForTimeout(1500);
      const banner=await pg.evaluate(()=>{const b=document.getElementById('preview-banner');return b?b.textContent:'';});
      ok('Banner „NÁHLED POSTAVY ŽÁKA" zobrazen', banner.includes('NÁHLED POSTAVY'), `"${banner}"`);
      const mapActive=await pg.evaluate(()=>{const m=document.getElementById('s-map');return m&&m.classList.contains('active');});
      ok('Hra skočila na mapu žáka', mapActive);
      const nm=await pg.evaluate(()=>{const e=document.getElementById('map-name');return e?e.textContent:'';});
      ok('Zobrazeno jméno postavy žáka (PRŮZKUMNÍK)', nm==='PRŮZKUMNÍK', `"${nm}"`);
      await ctx.close();
    }
    console.log();

    // ── 4) Hra nanečisto (?preview=1) pro 3. ročník ──
    console.log('[ 4 ] Hra nanečisto (?preview=1) — 3. ročník');
    {
      const {ctx,pg}=await page({session:null,roles:[],saves:[]});
      await pg.goto(`${BASE}/projects/rpg-mat-3.html?preview=1`,{waitUntil:'domcontentloaded'});
      await pg.waitForTimeout(1200);
      const banner=await pg.evaluate(()=>{const b=document.getElementById('preview-banner');return b?b.textContent:'';});
      ok('Banner „NÁHLED HRY" zobrazen', banner.includes('NÁHLED HRY'), `"${banner}"`);
      // hratelnost: jméno + start + klik na misi → boj
      const reached=await pg.evaluate(async()=>{
        const sleep=ms=>new Promise(r=>setTimeout(r,ms));
        document.getElementById('ni').value='UČITEL'; startGame(); await sleep(200);
        const n=document.querySelector('#map-grid .map-node'); if(n)n.click(); await sleep(200);
        const it=document.querySelector('#mission-list .ms-item.avail'); if(it)it.click(); await sleep(400);
        const s=document.querySelector('.screen.active'); return s?s.id:'?';
      });
      ok('Učitel si může 3. ročník zahrát (proklik až do boje)', reached==='s-battle', 'screen='+reached);
      await ctx.close();
    }
  } finally {
    await browser.close(); srv.close();
  }
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  if(fail) process.exitCode=1;
}
run();
