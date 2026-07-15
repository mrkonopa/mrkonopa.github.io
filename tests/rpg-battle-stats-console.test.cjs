/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 13 (konzole): záložka ⚔️ SOUBOJE v rpg-ucitel.html.
   Mock RPC battle_stats_all → ověří render tabulky (odehráno/správně/
   špatně/úspěšnost/výhry/⌀umístění), join na jméno žáka z save, XSS,
   řazení a přepnutí ročníku.
   Spusť: node tests/rpg-battle-stats-console.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18491;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function ok(name, cond, d='') { if (cond){console.log('  ✅ '+name);pass++;} else {console.log('  ❌ '+name+(d?' — '+d:''));fail++;} }

function mockScript(scenario) {
  return `(function(){
    const S = ${JSON.stringify(scenario)};
    const db = { roles:S.roles||[], saves:S.saves||[], classes:[], class_members:[], notes:[] };
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
          if(fn==='battle_stats_all'){
            let r=S.stats||[];
            if(args&&args.p_game) r=r.filter(x=>x.game===args.p_game);
            return {data:r,error:null};
          }
          return {data:[],error:null};
        }
      };
    }
    window.supabase = { createClient:()=>mkClient() };
  })();`;
}

function startServer() {
  const mime={html:'text/html',js:'application/javascript',css:'text/css'};
  const srv=http.createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    const fp=path.normalize(path.join(ROOT,p));
    if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('forbidden');return;}
    try{const buf=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(buf);}
    catch{res.writeHead(404);res.end('nf');} });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}

async function run() {
  console.log('\n── Konzole: záložka ⚔️ SOUBOJE ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:CHROMIUM });
  const errors = [];
  try {
    const admin='vojtech.konopa@husovaliberec.cz';
    const scenario = {
      roles: [{ email: admin, role:'superadmin' }],
      session: { user:{ id:'u-admin', email:admin, user_metadata:{full_name:'Vojta'} } },
      saves: [
        { user_id:'u-neo',  game:'RPG_MAT_9', data:{}, name:'NeoHrdina', email:'neo@husovaliberec.cz',  full_name:'Tomáš Anderson', updated_at:'2026-06-20T10:00:00Z' },
        { user_id:'u-trin', game:'RPG_MAT_9', data:{}, name:'Trin',      email:'trin@husovaliberec.cz', full_name:'<img src=x onerror="window.__xss=1">', updated_at:'2026-06-20T10:00:00Z' },
        { user_id:'u-six',  game:'RPG_MAT_6', data:{}, name:'Sixer',     email:'six@husovaliberec.cz',  full_name:'Adam Šestý', updated_at:'2026-06-20T10:00:00Z' },
      ],
      stats: [
        { user_id:'u-neo',  game:'RPG_MAT_9', played:5, correct:30, wrong:10, wins:3, score:9000, avg_rank:1.4 },
        { user_id:'u-trin', game:'RPG_MAT_9', played:2, correct:6,  wrong:14, wins:0, score:1800, avg_rank:3.0 },
        { user_id:'u-six',  game:'RPG_MAT_6', played:8, correct:40, wrong:8,  wins:5, score:12000, avg_rank:1.2 },
      ],
    };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    await page.addInitScript(mockScript(scenario));
    await page.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil:'load' });
    await page.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'), {timeout:8000});

    await page.click('.tab[data-tab="battles"]');
    await page.waitForFunction(()=>!document.getElementById('t-battles').classList.contains('hidden'),{timeout:4000});
    ok('záložka Souboje se otevře', true);

    const opts = await page.evaluate(()=>document.getElementById('bt-game').options.length);
    ok('výběr ročníku: 1 „vše" + 7 her (1.+2. stupeň)', opts===8, 'options='+opts);
    ok('výchozí = všechny ročníky (prázdná hodnota)', await page.evaluate(()=>document.getElementById('bt-game').value)==='');

    await page.waitForFunction(()=>/Odehráno/.test(document.getElementById('bt-wrap').textContent),{timeout:4000});
    const t = await page.evaluate(()=>document.getElementById('bt-wrap').textContent);
    ok('řádek Neo: skutečné jméno + 5 odehráno', /Tomáš Anderson/.test(t)&&/neo@/.test(t));
    ok('úspěšnost Neo = 75 % (30/40)', /75%/.test(t), t.slice(0,200));
    ok('Adam Šestý (6. ročník) je vidět ve „všech ročnících"', /Adam Šestý/.test(t));
    ok('výhry: zobrazí 🥇 u žáka s výhrami', /🥇/.test(t));
    ok('⌀ umístění Trin = 3.0', /3\.0/.test(t));
    ok('XSS jméno žáka neprojde', await page.evaluate(()=>window.__xss||0)===0);

    // řazení podle úspěšnosti (klik na hlavičku)
    await page.evaluate(()=>btSort('acc'));
    await page.waitForTimeout(150);
    const firstName = await page.evaluate(()=>{
      const tr=document.querySelector('#bt-wrap tbody tr'); return tr?tr.textContent:'';
    });
    ok('řazení dle úspěšnosti: nejvýš nejlepší (Adam 83 % nebo Neo 75 %)', /Adam Šestý|Tomáš Anderson/.test(firstName), firstName);

    // přepnutí na 6. ročník filtruje
    await page.evaluate(()=>{const s=document.getElementById('bt-game');s.value='RPG_MAT_6';renderBattles();});
    await page.waitForFunction(()=>window.__rpcCalls.some(c=>c.fn==='battle_stats_all'&&c.args.p_game==='RPG_MAT_6'),{timeout:4000});
    await page.waitForTimeout(150);
    const t6 = await page.evaluate(()=>document.getElementById('bt-wrap').textContent);
    ok('filtr 6. ročník: jen Adam Šestý, ne Neo', /Adam Šestý/.test(t6)&&!/Tomáš Anderson/.test(t6), t6.slice(0,200));

    ok('žádné JS chyby', errors.length===0, errors.join(' | '));
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail?1:0);
}
run().catch(e=>{console.error(e);process.exit(1);});
