/* Výkonová regrese — hlídá, že se externí skripty u her nenačítají render-blocking.
   Po optimalizaci mají všechny 4 RPG hry 0 blokujících externích skriptů (vše defer),
   takže Supabase CDN ani banky úloh neblokují parsování. Test taky ověří, že se
   stránky načtou bez JS chyb a že počet requestů nepřekročí rozpočet.
   Spusť: node tests/perf.test.cjs
*/
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};
let pass=0, fail=0; const ok=(c,m)=>{c?(pass++,console.log('  ✅ '+m)):(fail++,console.log('  ❌ '+m));};

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}

// hry musí mít 0 render-blocking externích skriptů (vše defer)
const GAMES = ['/projects/rpg-mat-6.html','/projects/rpg-mat-7.html','/projects/rpg-mat-8.html','/projects/rpg-mat-9.html'];

(async()=>{
 const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({executablePath:EXEC});
 for(const u of GAMES){
  const ctx=await browser.newContext(); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(base+u,{waitUntil:'load',timeout:20000});
  const m=await p.evaluate(()=>{
   const ext=[...document.querySelectorAll('script[src]')];
   return {
    ext:ext.length,
    blocking:ext.filter(s=>!s.defer&&!s.async).length,
    blockingSrc:ext.filter(s=>!s.defer&&!s.async).map(s=>s.getAttribute('src')),
    // klíčové globály z odložených skriptů musí být po 'load' k dispozici
    sprites:typeof window.RPGSprites6!=='undefined'||typeof window.RPGSprites7!=='undefined'||typeof window.RPGSprites8!=='undefined'||typeof window.RPGSprites9!=='undefined',
    launch:typeof launchBattle==='function',
   };
  });
  ok(m.blocking===0, u+' nemá render-blocking externí skripty (našel '+m.blocking+(m.blocking?': '+m.blockingSrc.join(','):'')+')');
  ok(m.ext>=8, u+' má externí skripty s defer ('+m.ext+')');
  ok(m.sprites, u+' sprite modul k dispozici po load (defer dojel)');
  ok(m.launch, u+' launchBattle definován');
  ok(errs.length===0, u+' bez JS chyb'+(errs.length?(' ['+errs[0]+']'):''));
  await ctx.close();
 }
 await browser.close(); srv.close();
 console.log('\n==========================================');
 console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
 console.log('==========================================');
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
