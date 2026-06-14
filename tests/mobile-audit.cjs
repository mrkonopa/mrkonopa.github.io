/* Mobilní/responzivní audit — načte každou stránku na 360px šířce a hlásí:
   - horizontální přetečení (scrollWidth > clientWidth)
   - prvky vyčuhující za pravý okraj viewportu
   - malé klikací plochy (<40px) u tlačítek/odkazů
   Spusť: node tests/mobile-audit.cjs
*/
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}

const PAGES = [
 ['Home (terminal)','/index.html'],
 ['404','/404.html'],
 ['Projects index','/projects/index.html'],
 ['Přijímačky archiv','/projects/prijimacky-matematika/index.html'],
 ['Únikovka procenta','/projects/unikovka_procenta.html'],
 ['Únikovka tělesa','/projects/unikovka_telesa.html'],
 ['Procenta příklady','/projects/procenta_priklady.html'],
 ['Cesta peněz','/projects/cesta_penez.html'],
 ['RPG hub','/projects/rpg-matematika.html'],
 ['RPG mat 6','/projects/rpg-mat-6.html'],
 ['RPG mat 7','/projects/rpg-mat-7.html'],
 ['RPG mat 8','/projects/rpg-mat-8.html'],
 ['RPG mat 9','/projects/rpg-mat-9.html'],
 ['Travels index','/travels/index.html'],
];

const VW = 360, VH = 740;

(async()=>{
 const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({executablePath:EXEC});
 let totalIssues=0;
 for(const [name,url] of PAGES){
  const ctx=await browser.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  try{
   await page.goto(base+url,{waitUntil:'load',timeout:15000});
   await page.waitForTimeout(600);
  }catch(e){console.log('\n### '+name+'  ('+url+')\n  ⚠️ NELZE NAČÍST: '+e.message);await ctx.close();continue;}

  const report=await page.evaluate((VW)=>{
   const out={overflowDoc:false,docW:0,offRight:[],smallTaps:[],tinyFont:[]};
   const de=document.documentElement;
   out.docW=Math.max(de.scrollWidth,document.body?document.body.scrollWidth:0);
   out.overflowDoc=out.docW>VW+1;
   // prvky vyčuhující výrazně za pravý okraj (>4px), jen viditelné
   const all=[...document.querySelectorAll('body *')];
   const seen=new Set();
   for(const el of all){
    const cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)===0)continue;
    const r=el.getBoundingClientRect();
    if(r.width===0||r.height===0)continue;
    if(r.right>VW+4&&r.width<=VW+40){ // ignoruj plnošířkové wrappery, hlas konkrétní vyčuhující prvky
     const sel=el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'');
     if(!seen.has(sel)){seen.add(sel);out.offRight.push({sel,right:Math.round(r.right),w:Math.round(r.width)});}
    }
   }
   // malé klikací plochy: viditelná tlačítka/odkazy s rozměrem <40px (a obsahem)
   const taps=[...document.querySelectorAll('button,a,[role=button],input[type=button],input[type=submit],.btn')];
   const tapSeen=new Set();
   for(const el of taps){
    const cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)===0)continue;
    const r=el.getBoundingClientRect();
    if(r.width===0||r.height===0)continue;
    const txt=(el.textContent||el.value||'').trim().slice(0,24);
    if(!txt&&!el.querySelector('img,svg'))continue;
    if(r.height<40||r.width<32){
     const key=el.tagName+'|'+txt+'|'+Math.round(r.height);
     if(!tapSeen.has(key)){tapSeen.add(key);out.smallTaps.push({txt:txt||'(ikona)',h:Math.round(r.height),w:Math.round(r.width)});}
    }
   }
   return out;
  },VW);

  const issues=[];
  if(report.overflowDoc)issues.push('📏 horizontální přetečení dokumentu: scrollWidth='+report.docW+'px (>'+VW+')');
  if(report.offRight.length)issues.push('➡️  '+report.offRight.length+' prvků vyčuhuje vpravo: '+report.offRight.slice(0,6).map(o=>o.sel+' (right='+o.right+',w='+o.w+')').join('  |  '));
  if(report.smallTaps.length)issues.push('👆 '+report.smallTaps.length+' malých klik. ploch (<40px): '+report.smallTaps.slice(0,10).map(t=>'"'+t.txt+'" '+t.w+'×'+t.h).join(', '));
  if(errs.length)issues.push('🐞 JS chyby: '+errs.slice(0,2).join(' | '));

  if(issues.length){
   console.log('\n### '+name+'  ('+url+')');
   issues.forEach(i=>console.log('  '+i));
   totalIssues+=issues.length;
  }else{
   console.log('\n### '+name+'  ('+url+')\n  ✅ OK (docW='+report.docW+')');
  }
  await ctx.close();
 }
 await browser.close(); srv.close();
 console.log('\n==========================================');
 console.log('  CELKEM nálezů: '+totalIssues);
 console.log('==========================================');
})().catch(e=>{console.error(e);process.exit(1);});
