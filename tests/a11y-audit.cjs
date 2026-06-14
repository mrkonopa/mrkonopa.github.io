/* Přístupnostní audit (a11y) — načte každou stránku a hlásí konkrétní opravitelné nálezy:
   - <img> bez atributu alt
   - tlačítka/odkazy/[role=button] bez přístupného jména (text/aria-label/title)
   - formulářové prvky (input/select/textarea) bez popisku (label/aria-label)
   - chybějící lang na <html>, chybějící <title>, chybějící <h1>
   - kladný tabindex (anti-pattern)
   - odstraněný outline bez :focus-visible náhrady (klávesnicová navigace)
   Spusť: node tests/a11y-audit.cjs
*/
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}

const PAGES = [
 ['Home','/index.html'],
 ['404','/404.html'],
 ['Projects index','/projects/index.html'],
 ['Přijímačky','/projects/prijimacky-matematika/index.html'],
 ['Únikovka procenta','/projects/unikovka_procenta.html'],
 ['Únikovka tělesa','/projects/unikovka_telesa.html'],
 ['Procenta příklady','/projects/procenta_priklady.html'],
 ['Cesta peněz','/projects/cesta_penez.html'],
 ['RPG hub','/projects/rpg-matematika.html'],
 ['RPG mat 6','/projects/rpg-mat-6.html'],
 ['RPG mat 7','/projects/rpg-mat-7.html'],
 ['RPG mat 8','/projects/rpg-mat-8.html'],
 ['RPG mat 9','/projects/rpg-mat-9.html'],
 ['RPG učitel','/projects/rpg-ucitel.html'],
 ['Travels','/travels/index.html'],
];

(async()=>{
 const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({executablePath:EXEC});
 let total=0;
 for(const [name,url] of PAGES){
  const ctx=await browser.newContext({viewport:{width:1024,height:800}});
  const page=await ctx.newPage();
  try{await page.goto(base+url,{waitUntil:'load',timeout:15000});await page.waitForTimeout(400);}
  catch(e){console.log('\n### '+name+'  ⚠️ '+e.message);await ctx.close();continue;}

  const rep=await page.evaluate(()=>{
   const accName=el=>{
    const t=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(t)return t;
    if(el.getAttribute('aria-label'))return el.getAttribute('aria-label').trim();
    if(el.getAttribute('title'))return el.getAttribute('title').trim();
    if(el.getAttribute('aria-labelledby'))return 'labelledby';
    const img=el.querySelector('img[alt]');if(img&&img.getAttribute('alt').trim())return img.alt.trim();
    if(el.value&&String(el.value).trim())return String(el.value).trim();
    return '';
   };
   const out={lang:document.documentElement.getAttribute('lang')||'',title:document.title||'',h1:document.querySelectorAll('h1').length,
              imgNoAlt:[],nameless:[],unlabeled:[],posTab:0,outlineNoneNoFocus:false};
   // imgs without alt ATTRIBUTE (alt="" = decorative, OK)
   document.querySelectorAll('img').forEach(im=>{if(!im.hasAttribute('alt'))out.imgNoAlt.push(im.getAttribute('src')||'(no src)');});
   // nameless interactive controls
   const seen=new Set();
   document.querySelectorAll('button,a[href],[role=button],input[type=button],input[type=submit],input[type=image]').forEach(el=>{
    if(accName(el))return;
    const sig=el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/)[0]:'');
    if(!seen.has(sig)){seen.add(sig);out.nameless.push(sig);}
   });
   // unlabeled form fields
   const lseen=new Set();
   document.querySelectorAll('input,select,textarea').forEach(el=>{
    const ty=(el.getAttribute('type')||'text').toLowerCase();
    if(['hidden','button','submit','reset','image'].includes(ty))return;
    let labeled=false;
    if(el.id&&document.querySelector('label[for="'+CSS.escape(el.id)+'"]'))labeled=true;
    if(el.closest('label'))labeled=true;
    if(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')||el.getAttribute('title'))labeled=true;
    if(!labeled){
     const sig=el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+'['+ty+']';
     if(!lseen.has(sig)){lseen.add(sig);out.unlabeled.push(sig);}
    }
   });
   // positive tabindex
   document.querySelectorAll('[tabindex]').forEach(el=>{const v=parseInt(el.getAttribute('tabindex'),10);if(v>0)out.posTab++;});
   // outline:none in stylesheets without any :focus-visible rule
   let hasOutlineNone=false,hasFocusVisible=false;
   for(const ss of document.styleSheets){
    let rules;try{rules=ss.cssRules;}catch(e){continue;}
    if(!rules)continue;
    for(const r of rules){
     const tx=r.cssText||'';
     if(/:focus-visible/.test(tx))hasFocusVisible=true;
     if(/outline\s*:\s*(none|0)/i.test(tx)&&/:focus(?![\w-])/.test(tx))hasOutlineNone=true;
    }
   }
   out.outlineNoneNoFocus=hasOutlineNone&&!hasFocusVisible;
   return out;
  });

  const issues=[];
  if(!rep.lang)issues.push('🌐 chybí lang na <html>');
  if(!rep.title)issues.push('📄 chybí <title>');
  if(rep.h1===0)issues.push('🔠 žádný <h1>');
  if(rep.imgNoAlt.length)issues.push('🖼️  '+rep.imgNoAlt.length+' <img> bez alt: '+rep.imgNoAlt.slice(0,5).join(', '));
  if(rep.nameless.length)issues.push('🔘 '+rep.nameless.length+' ovládacích prvků bez jména: '+rep.nameless.slice(0,8).join(', '));
  if(rep.unlabeled.length)issues.push('📝 '+rep.unlabeled.length+' polí bez popisku: '+rep.unlabeled.slice(0,8).join(', '));
  if(rep.posTab)issues.push('⌨️  '+rep.posTab+'× kladný tabindex');
  if(rep.outlineNoneNoFocus)issues.push('🎯 outline:none na :focus bez :focus-visible náhrady');

  if(issues.length){console.log('\n### '+name+'  ('+url+')');issues.forEach(i=>console.log('  '+i));total+=issues.length;}
  else console.log('\n### '+name+'  ✅ OK');
  await ctx.close();
 }
 await browser.close(); srv.close();
 console.log('\n==========================================');
 console.log('  CELKEM kategorií nálezů: '+total);
 console.log('==========================================');
})().catch(e=>{console.error(e);process.exit(1);});
