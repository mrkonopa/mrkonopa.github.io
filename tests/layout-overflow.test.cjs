/* ══════════════════════════════════════════════════════════════════════
   Repo-wide kontrola rozvržení: nic nesmí vylézt ze svého rámečku.

   Vznikla poté, co Vojta na screenshotu ukázal, že tlačítko VĚŽ LEGEND
   přetéká z řady akcí pod mapou ven. Žádný test to nechytil, protože
   layout se do té doby neměřil vůbec — testy kontrolovaly, že se prvky
   VYKRESLÍ, ne KAM.

   Prochází všechny stránky (7 her × všechny obrazovky, HUB, učitelská
   konzole, celý přijímačkový hub) ve třech šířkách a u každého viditelného
   prvku porovná jeho rámeček s rámečkem rodiče. Hlásí dvě věci:

     • prvek přesahuje rodiče (a rodič si přetečení neřeší scrollem)
     • prvek má ořezaný vlastní obsah (scrollWidth > clientWidth)

   Rodiče s overflow auto/scroll/hidden se přeskakují — tam je přesah
   záměr, ne vada. Stejně tak absolutně/fixně pozicované prvky.

   Ověřeno, že pravidlo skutečně štěká: na verzi před opravou řady akcí
   nález hlásí (přetečení se propíše až na .wrap kolem obsahu mapy) a na
   přetékajícím odpočtu na přijímačkovém hubu ho poprvé našlo samo.

   Pomalé (~3 min). Spusť: node tests/layout-overflow.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT='/home/user/mrkonopa.github.io',PORT=18999;
const srv=http.createServer((q,p)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';
 const fp=path.normalize(path.join(ROOT,u));if(!fp.startsWith(ROOT)){p.writeHead(403);return p.end();}
 let b=null;try{b=fs.readFileSync(fp);}catch(e){} if(b===null){p.writeHead(404);return p.end();}
 const m={html:'text/html',js:'application/javascript',css:'text/css'};
 p.writeHead(200,{'Content-Type':m[u.split('.').pop()]||'application/octet-stream'});p.end(b);});

const PAGES=[...[3,4,5,6,7,8,9].map(g=>['g'+g,'/projects/rpg-mat-'+g+'.html']),
 ['hub','/projects/rpg-matematika.html'],['ucitel','/projects/rpg-ucitel.html'],
 ['pz-hub','/projects/prijimacky-matematika/index.html'],['pz-test','/projects/prijimacky-matematika/test.html'],
 ['pz-proc','/projects/prijimacky-matematika/procvicovani.html'],['pz-diag','/projects/prijimacky-matematika/diagnostika.html'],
 ['pz-stat','/projects/prijimacky-matematika/statistiky.html']];
const SIRKY=[1100,820,380];

const DET=()=>{
 const de=document.documentElement;
 const stranka=de.scrollWidth>de.clientWidth+1?de.scrollWidth-de.clientWidth:0;
 const ven=[]; let videno=0;
 for(const el of document.querySelectorAll('body *')){
   const cs=getComputedStyle(el);
   if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='absolute'||cs.position==='fixed')continue;
   const pa=el.parentElement; if(!pa||pa===document.body)continue;
   const ps=getComputedStyle(pa);
   if(/auto|scroll|hidden/.test(ps.overflowX))continue;      // rodič si přetečení řeší sám
   if(ps.display==='inline'||ps.display==='contents')continue;
   const pb=pa.getBoundingClientRect(); if(pb.width<20)continue;
   const cb=el.getBoundingClientRect(); if(cb.width<4&&cb.height<4)continue;
   videno++;
   const mimo=cb.right>pb.right+2||cb.left<pb.left-2;
   const orez=el.scrollWidth>el.clientWidth+2&&!/auto|scroll/.test(cs.overflowX);
   if(mimo||orez)
     ven.push((pa.id||pa.className.toString().split(' ')[0]||pa.tagName)+' → '+
              (el.id||el.className.toString().split(' ')[0]||el.tagName)+
              ' «'+(el.textContent||'').trim().slice(0,20)+'» '+(mimo?'mimo':'')+(orez?'ořez':''));
 }
 return {stranka,videno,ven:[...new Set(ven)].slice(0,8)};
};

(async()=>{
 await new Promise(r=>srv.listen(PORT,r));
 const b=await chromium.launch({headless:true,executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const nalezy=[]; let obrazovek=0,prvku=0;
 for(const [jm,url] of PAGES) for(const w of SIRKY){
  const ctx=await b.newContext({viewport:{width:w,height:900}});
  await ctx.route('**/*',r=>r.request().url().startsWith('http://localhost:'+PORT)?r.continue():r.abort());
  const pg=await ctx.newPage();
  try{
   await pg.goto('http://localhost:'+PORT+url,{waitUntil:'domcontentloaded',timeout:15000});
   await pg.waitForTimeout(400);
   const jeHra=/^g\d$/.test(jm);
   if(jeHra){await pg.waitForFunction(()=>typeof startGame==='function',{timeout:8000});
     await pg.evaluate(()=>{localStorage.clear();startGame('Testovací žákyně');S.tutorialDone=true;});}
   const screens=jeHra?await pg.evaluate(()=>[...document.querySelectorAll('.screen')].map(s=>s.id)):[null];
   for(const sc of screens){
    if(sc){const okk=await pg.evaluate(id=>{try{
      document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
      const el=document.getElementById(id);if(!el)return false;el.classList.add('on');
      const f={'s-map':()=>renderMap(),'s-profile':()=>renderProfile(),'s-shop':()=>renderShop(),
               's-train':()=>renderTrainPicker(),'s-tower':()=>renderTowerGate(),
               's-area':()=>renderArea(AREAS[0].id)}[id];
      if(f)try{f();}catch(e){} return true;}catch(e){return false;}},sc);
     if(!okk)continue; await pg.waitForTimeout(100);}
    const r=await pg.evaluate(DET);
    obrazovek++; prvku+=r.videno;
    if(r.stranka||r.ven.length)
      nalezy.push(`${jm}@${w}${sc?' '+sc:''}: ${r.stranka?'STRÁNKA +'+r.stranka+'px; ':''}${r.ven.join(' | ')}`);
   }
  }catch(e){nalezy.push(`${jm}@${w}: CHYBA ${String(e.message).slice(0,70)}`);}
  await ctx.close();
 }
 console.log(`PROMĚŘENO: ${obrazovek} obrazovek, ${prvku} prvků`);
 if(nalezy.length){console.log('  ❌ nálezy:');nalezy.forEach(x=>console.log('     '+x));}
 // Pojistka proti prázdnému běhu: kdyby se stránky přestaly načítat nebo
 // se změnil tvar DOM, smyčka by nic neproměřila a test by tiše prošel.
 const dost = obrazovek >= 150 && prvku >= 5000;
 if(!dost)console.log('  ❌ audit skoro nic neproměřil — pravidlo by štěkalo naprázdno');
 console.log(nalezy.length||!dost ? '\n  Rozvržení: SELHALO\n' : '\n  Rozvržení: v pořádku\n');
 await b.close();srv.close();
 process.exit((nalezy.length||obrazovek<150||prvku<5000)?1:0);
})();
