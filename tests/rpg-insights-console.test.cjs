/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 4: „Key Insights" (klíčové poznatky) v učitelské konzoli.
   Mock saves nesou updated_at / errs / mastery → ověří narativní shrnutí:
   aktivita, dlouho nehráli, nejvíc chyb (mise), nejvíc mistrovství, kdo
   možná potřebuje pomoc. + XSS jména. Spusť: node tests/rpg-insights-console.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18471;
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
        let op='select', filters=[], single=false;
        function rows(){ let r=(db[table]||[]).slice(); filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));}); return r; }
        function resolve(){ if(op==='select'){ const r=rows(); return Promise.resolve({data: single?(r[0]||null):r, error:null}); } return Promise.resolve({data:null,error:null}); }
        const b={ select(){ if(op!=='insert')op='select'; return b; }, insert(){op='insert';return b;}, upsert(){op='upsert';return b;}, update(){op='update';return b;}, delete(){op='delete';return b;}, eq(c,v){filters.push([c,v]);return b;}, order(){return b;}, maybeSingle(){single=true;return resolve();}, single(){single=true;return resolve();}, then(res,rej){return resolve().then(res,rej);} };
        return b;
      }
      return { auth:{ getSession:async()=>({data:{session:S.session||null}}), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}), signInWithOAuth:async()=>{}, signOut:async()=>{} }, from:q, rpc:async()=>({data:[],error:null}) };
    }
    window.supabase = { createClient:()=>mkClient() };
    window.__xss = 0;
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

const nowISO = () => new Date().toISOString();
const daysAgoISO = d => new Date(Date.now() - d*864e5).toISOString();

async function run() {
  console.log('\n── Key Insights: klíčové poznatky ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:CHROMIUM });
  const errors = [];
  try {
    const admin='vojtech.konopa@husovaliberec.cz';
    const scenario = {
      roles: [{ email: admin, role:'superadmin' }],
      session: { user:{ id:'u-admin', email:admin, user_metadata:{full_name:'Vojta'} } },
      saves: [
        // aktivní, má mistrovství, chyby na 1-1 a 5-2
        { user_id:'z1', game:'RPG_MAT_9', name:'Neo', email:'z1@husovaliberec.cz', full_name:'Žák 1', updated_at:nowISO(),
          data:{ name:'Neo', xp:300, level:4, done:{}, errs:{ '1-1':4, '5-2':6 }, mastery:{ '2-1':{mastered:true,score:15} } } },
        // aktivní, chyby na 1-1, bez mistrovství, ale málo chyb (<8)
        { user_id:'z2', game:'RPG_MAT_9', name:'Trinity', email:'z2@husovaliberec.cz', full_name:'Žák 2', updated_at:nowISO(),
          data:{ name:'Trinity', xp:120, level:2, done:{}, errs:{ '1-1':5 } } },
        // aktivní, hodně chyb na 3-1, bez mistrovství → needHelp
        { user_id:'z3', game:'RPG_MAT_9', name:'Cyfer', email:'z3@husovaliberec.cz', full_name:'Žák 3', updated_at:nowISO(),
          data:{ name:'Cyfer', xp:60, level:1, done:{}, errs:{ '3-1':10 } } },
        // >14 dní nehrál
        { user_id:'z4', game:'RPG_MAT_9', name:'Dozer', email:'z4@husovaliberec.cz', full_name:'Žák 4', updated_at:daysAgoISO(20),
          data:{ name:'Dozer', xp:10, level:1, done:{}, errs:{} } },
        // >14 dní, jméno bez full_name je XSS payload → musí být escapované
        { user_id:'z5', game:'RPG_MAT_9', name:'x', email:'z5@husovaliberec.cz', full_name:'', updated_at:daysAgoISO(30),
          data:{ name:'<img src=x onerror=window.__xss=1>', xp:0, level:1, done:{}, errs:{} } },
      ],
      classes: [], class_members: [],
    };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    page.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource|ERR_/i.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(mockScript(scenario));
    await page.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil:'load' });
    await page.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'), {timeout:8000});
    await page.waitForFunction(()=>Array.isArray(window.ROWS) && window.ROWS.length>=5, {timeout:6000}).catch(()=>{});
    // karta se renderuje na PŘEHLEDU (výchozí tab) přes renderTable
    await page.waitForFunction(()=>{const el=document.getElementById('insights');return el && !el.classList.contains('hidden');},{timeout:5000});

    const txt = await page.evaluate(()=>document.getElementById('insights').textContent);
    const html = await page.evaluate(()=>document.getElementById('insights').innerHTML);

    ok('karta Key Insights je viditelná', true);
    ok('má nadpis KLÍČOVÉ POZNATKY', /KLÍČOVÉ POZNATKY/.test(txt));
    ok('aktivita: 3 z 5 hrálo tento týden', /hrálo\s*3\s*z\s*5/.test(txt.replace(/\s+/g,' ')), txt.slice(0,120));
    ok('dlouho nehráli jsou vyjmenovaní (Žák 4)', /Přes 14 dní nehráli/.test(txt) && /Žák 4/.test(txt));
    ok('nejvíc chyb = mise 3-1 (10× u 1 žáka)', /Nejvíc chyb/.test(txt) && /Základní rovnice/.test(txt) && /10× u 1 žáka/.test(txt), txt);
    ok('nejvíc mistrovství: Žák 1 (1)', /Nejvíc mistrovství/.test(txt) && /Žák 1/.test(txt), txt);
    ok('needHelp: Žák 3 (aktivní, hodně chyb, bez mistrovství)', /Možná potřebují pomoc/.test(txt) && /Žák 3/.test(txt), txt);
    // needHelp NEobsahuje Žáka 2 (má jen 5 chyb <8) ani Žáka 1 (má mistrovství)
    const help = (txt.match(/Možná potřebují pomoc:[^(]*/)||[''])[0];
    ok('needHelp nezahrnuje žáky s <8 chybami ani s mistrovstvím', !/Žák 1|Žák 2/.test(help), help);

    // XSS: payload ze jména se NEspustí a je escapovaný
    const xss = await page.evaluate(()=>window.__xss);
    ok('XSS ze jména žáka se NEspustí', xss===0);
    ok('jméno-payload je escapované v innerHTML', /&lt;img/.test(html) && !/<img src=x/.test(html));

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
