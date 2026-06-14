/* Bezpečnost: CSV export v učitelské konzoli musí chránit proti formula-injection.
   Žák ovládá své jméno; pokud ho nastaví na "=HYPERLINK(...)", nesmí se v
   exportovaném CSV stát vzorcem (Excel/Sheets). Guard prefixuje apostrofem.
   Spusť: node tests/csv-injection.test.cjs
*/
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
let pass=0, fail=0; const ok=(c,m)=>{c?(pass++,console.log('  ✅ '+m)):(fail++,console.log('  ❌ '+m));};

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}

(async()=>{
 const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({executablePath:EXEC});
 const ctx=await browser.newContext(); const page=await ctx.newPage();
 const errs=[]; page.on('pageerror',e=>errs.push(e.message));
 await page.goto(base+'/projects/rpg-ucitel.html',{waitUntil:'load'});
 await page.waitForFunction(()=>typeof exportCSV==='function',{timeout:8000});

 const cap = await page.evaluate(()=>{
  // izoluj test na cell(): zastub pomocné funkce a vlož nepřátelský řádek
  window.gMeta=()=>({nm:'NULL_BYTE',gr:'9'});
  window.doneCount=()=>5; window.pct=()=>50; window.fmtDate=()=>'2026-01-01';
  window.masteryCount=()=>3; window.MISSIONS_BY_GAME={};
  window.filtered=()=>[{email:'=cmd|"/c calc"!A1',full_name:'+evil',
    data:{name:'=HYPERLINK("http://evil","klikni")',level:3,xp:120,done:{},mastery:{}},
    game:'RPG_MAT_9',updated_at:'2026-01-01T00:00:00Z'}];
  const out={csv:null,err:null};
  const OB=window.Blob; window.Blob=function(parts,opts){out.csv=(parts||[]).join('');return new OB(parts,opts);};
  const OC=URL.createObjectURL; URL.createObjectURL=()=>'blob:fake';
  const OK=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){};
  try{exportCSV();}catch(e){out.err=e.message;}
  window.Blob=OB; URL.createObjectURL=OC; HTMLAnchorElement.prototype.click=OK;
  return out;
 });

 ok(!cap.err, 'exportCSV proběhne bez výjimky'+(cap.err?(' ['+cap.err+']'):''));
 ok(cap.csv && cap.csv.length>0, 'CSV se vygenerovalo');
 const csv = cap.csv||'';
 // nebezpečné buňky musí být prefixované apostrofem (uvnitř uvozovek)
 ok(csv.includes('"\'=HYPERLINK'), 'jméno =HYPERLINK je neutralizováno apostrofem');
 ok(csv.includes('"\'=cmd'), 'e-mail =cmd je neutralizován apostrofem');
 ok(csv.includes('"\'+evil'), 'full_name +evil je neutralizován apostrofem');
 // nesmí existovat buňka začínající rovnou "=" (tj. "=... bez apostrofu)
 ok(!/"=/.test(csv), 'žádná buňka nezačíná holým = (žádný vzorec)');
 ok(errs.length===0, 'žádné JS chyby na stránce');

 await ctx.close(); await browser.close(); srv.close();
 console.log('\n==========================================');
 console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
 console.log('==========================================');
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
