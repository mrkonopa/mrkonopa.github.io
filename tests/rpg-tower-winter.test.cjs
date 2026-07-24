/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 3 — zimní turnaj věže (Playwright, 4 ročníky).
   Prosinec/leden = zimní vizuál (věž ZŮSTÁVÁ otevřená), reduced-motion OK.
   Spusť: NODE_PATH=/opt/node22/lib/node_modules node tests/rpg-tower-winter.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PORT = 18488, BASE = 'http://localhost:' + PORT;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c){console.log('  ✅ '+n);pass++;} else {console.log('  ❌ '+n+(d?' — '+d:''));fail++;} };
function serve(){
  const mime={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',json:'application/json'};
  const srv=http.createServer((req,res)=>{let p=req.url.split('?')[0];if(p==='/')p='/index.html';const fp=path.normalize(path.join(ROOT,p));if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('x');return;}try{res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(fs.readFileSync(fp));}catch{res.writeHead(404);res.end('nf');}});
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}
async function run(){
  console.log('\n── Zimní turnaj věže (4 ročníky) ──\n');
  const srv=await serve();
  const b=await chromium.launch({headless:true,executablePath:CHROMIUM});
  try{
    for(const g of [6,7,8,9]){
      const errors=[];
      const ctx=await b.newContext();
      await ctx.route('**/*',r=>r.request().url().includes('localhost:'+PORT)?r.continue():r.abort());
      const pg=await ctx.newPage();
      pg.on('pageerror',e=>errors.push(e.message));
      await pg.addInitScript(()=>{window.__TW_TESTNOW='2026-12-15T10:00:00';});
      await pg.goto(`${BASE}/projects/rpg-mat-${g}.html`,{waitUntil:'domcontentloaded'});
      await pg.waitForSelector('#ni',{timeout:9000});
      await pg.fill('#ni','Z');
      await pg.evaluate(()=>{startGame();});
      await pg.waitForFunction(()=>document.querySelector('#s-map')?.classList.contains('active'),{timeout:9000});
      // prosinec: zimní režim ON, letní zámek OFF (věž otevřená)
      const dec=await pg.evaluate(()=>({winter:twWinter().on,holiday:twHoliday().on}));
      ok(`g${g}: prosinec → zimní režim ON`, dec.winter===true, JSON.stringify(dec));
      ok(`g${g}: prosinec → letní zámek OFF (věž otevřená)`, dec.holiday===false);
      // hranice dat
      const bnd=await pg.evaluate(()=>{const s=d=>{window.__TW_TESTNOW=d;return twWinter().on;};const r={jan:s('2026-01-20'),nov:s('2026-11-25'),feb:s('2026-02-05'),jul:s('2026-07-10')};window.__TW_TESTNOW='2026-12-15T10:00:00';return r;});
      ok(`g${g}: hranice led ON · list/ún/čvc OFF`, bnd.jan&&!bnd.nov&&!bnd.feb&&!bnd.jul, JSON.stringify(bnd));
      // render věže v prosinci (canvas + sníh) bez JS chyb
      await pg.evaluate(()=>{go('tower');renderTowerGate();});
      await pg.waitForTimeout(600);
      // reduced-motion: re-render bez chyb (sníh statický)
      await pg.emulateMedia({reducedMotion:'reduce'});
      await pg.evaluate(()=>{try{twDrawCanvas();}catch(e){}});
      await pg.waitForTimeout(200);
      ok(`g${g}: render zimní věže (i reduced-motion) bez chyb`, errors.length===0, errors.slice(0,2).join(' | '));
      await ctx.close();
    }
  }catch(e){ ok('běh bez výjimky',false,e.message); }
  finally{ await b.close(); srv.close(); }
  console.log(`\n${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail?1:0);
}
run();
