/* SEO / sdílení regrese — ověří, že každá stránka má favicon + Open Graph meta
   (kromě 404 a učitelské konzole, které mají noindex), že se statické SEO
   soubory servírují, a že se stránky načtou bez JS chyb.
   Spusť: node tests/seo.test.cjs
*/
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain','.json':'application/json'};
let pass=0, fail=0; const ok=(c,m)=>{c?(pass++,console.log('  ✅ '+m)):(fail++,console.log('  ❌ '+m));};

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}

const NOINDEX = ['/404.html','/projects/rpg-ucitel.html'];
const PAGES = ['/index.html','/404.html','/projects/index.html','/projects/prijimacky-matematika/index.html','/projects/unikovka_procenta.html','/projects/unikovka_telesa.html','/projects/procenta_priklady.html','/projects/cesta_penez.html','/projects/rpg-matematika.html','/projects/rpg-mat-6.html','/projects/rpg-mat-7.html','/projects/rpg-mat-8.html','/projects/rpg-mat-9.html','/projects/rpg-ucitel.html','/travels/index.html'];

(async()=>{
 const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({executablePath:EXEC});

 for(const a of ['/favicon.svg','/og-default.png','/sitemap.xml','/robots.txt']){
  const p=await browser.newPage(); const r=await p.goto(base+a); ok(r.status()===200,'statický soubor '+a+' → '+r.status()); await p.close();
 }
 for(const u of PAGES){
  const ctx=await browser.newContext(); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(base+u,{waitUntil:'load'}); await p.waitForTimeout(250);
  const info=await p.evaluate(()=>({
   og:!!document.querySelector('meta[property="og:image"]'),
   ogt:!!document.querySelector('meta[property="og:title"]'),
   fav:!!document.querySelector('link[rel="icon"]'),
   noindex:!!document.querySelector('meta[name="robots"][content="noindex"]'),
   titles:document.querySelectorAll('title').length,
  }));
  const wantNoindex=NOINDEX.includes(u);
  ok(info.fav,u+' má favicon');
  ok(info.titles===1,u+' má právě jeden <title>');
  ok(errs.length===0,u+' bez JS chyb'+(errs.length?(' ['+errs[0]+']'):''));
  if(wantNoindex)ok(info.noindex,u+' má noindex (neindexovat)');
  else ok(info.og&&info.ogt,u+' má og:image + og:title');
  await ctx.close();
 }
 await browser.close(); srv.close();
 console.log('\n==========================================');
 console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
 console.log('==========================================');
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
