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

/* Seznam stránek je SDÍLENÝ (tests/stranky.cjs) — tři ručně udržované
   kopie se podle CLAUDE.md rozešly čtyřikrát a pokaždé v nich chyběl celý
   kus webu. Úplnost proti skutečnému obsahu repozitáře hlídá
   `stranky-uplnost.test.cjs`. */
const PAGES = require('./stranky.cjs').jakoDvojiceJmeno();

const VW = 360, VH = 740;

/* Malé klikací plochy, které jsou ROZHODNUTÍ, ne vada. Vypsané
   jmenovitě i s počtem, takže NOVÝ malý prvek na téže stránce bránu
   shodí — jen ty známé projdou. Ověřeno s Vojtou 28. 8. 2026:
    · osobní stránka: šest odkazů po 17 px. Je to retro terminál, kde
      monospace řádky těsně pod sebou dělají celý ten efekt; zvětšení
      na 44 px by ho rozbilo.
    · statistiky přijímaček: „diagnostiku" je odkaz UVNITŘ VĚTY,
      ne tlačítko — řádkový odkaz v textu se zvětšovat nedá. */
const ZNAME_MALE_PLOCHY = {
  '/index.html': 6,
  '/projects/prijimacky-matematika/statistiky.html': 1,
  /* Právní stránky: e-mailové odkazy a odkaz na uoou.cz stojí UPROSTŘED
     VĚTY („Stačí napsat na …", „stížnost u Úřadu (…)"). Zvětšení na
     44 px by rozhodilo řádkování odstavce. Odkaz zpět i odkazy v patičce
     zvětšené JSOU — ty stojí samostatně. */
  '/projects/podminky.html': 1,
  '/projects/soukromi.html': 3,
};

(async()=>{
 const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({executablePath:EXEC});
 let totalIssues=0, vady=0; const souhrn=[];
 for(const [name,url] of PAGES){
  const ctx=await browser.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  /* Měříme JEN naše stránky. Cokoli mimo vlastní server se odřízne —
     stejně jako to dělá `layout-overflow.test.cjs` i hostile harness.
     PROČ: tři cestovatelské zápisky mají vložené video z
     `youtube-nocookie.com`. Blackhole na CI míří jen na `youtube.com`,
     takže se na runneru SKUTEČNĚ načetl přehrávač a audit pak hlásil
     „🐞 JS chyby: A network error occurred." — jenže to byla výjimka
     z YOUTUBE PLAYERU uvnitř iframu, ne z naší stránky (ta v JS nemá
     jedinou síťovou operaci, jen počítadlo fotek a lightbox). Padalo to
     navíc jen na jedné ze tří stránek s videem, tedy náhodně podle
     toho, jak se runneru zrovna dařilo YouTube načíst. Odříznutím
     externích zdrojů se zároveň srovná sandbox s CI: tady se fonty
     stáhnou, na runneru jsou blokované, a měření se tím rozcházelo. */
  await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  const page=await ctx.newPage();
  /* K hlášce se bere i PRVNÍ ŘÁDEK ZÁSOBNÍKU. Samotné „A network error
     occurred." neřekne, kdo ji vyhodil — a přesně to stálo jeden kruh
     přes CI, než se ukázalo, že šlo o cizí kód ve vloženém iframu. */
  const errs=[]; page.on('pageerror',e=>{
   const kde=(e.stack||'').split('\n').find(r=>/https?:\/\//.test(r));
   errs.push(e.message+(kde?'  ['+kde.trim().slice(0,90)+']':''));
  });
  try{
   await page.goto(base+url,{waitUntil:'load',timeout:15000});
   await page.waitForTimeout(600);
  }catch(e){console.log('\n### '+name+'  ('+url+')\n  ⚠️ NELZE NAČÍST: '+e.message);await ctx.close();continue;}

  const report=await page.evaluate((VW)=>{
   const out={overflowDoc:false,docW:0,offRight:[],smallTaps:[],tinyFont:[]};
   const de=document.documentElement;
   out.docW=Math.max(de.scrollWidth,document.body?document.body.scrollWidth:0);
   out.overflowDoc=out.docW>VW+1;
   // prvky vyčuhující výrazně za pravý okraj (>4px), jen viditelné.
   // Prvek uvnitř rámečku s overflow-x auto/scroll se NEHLÁSÍ — tam je
   // přesah záměr (široká tabulka nebo obrázek se posouvá uvnitř karty,
   // stránka sama se nehýbe). Stejné pravidlo má layout-overflow.test.cjs;
   // do té doby se ty dva audity na téže věci rozcházely.
   const vRolovaci=el=>{
    for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){
     if(/auto|scroll/.test(getComputedStyle(p).overflowX))return true;
    }
    return false;
   };
   const all=[...document.querySelectorAll('body *')];
   const seen=new Set();
   for(const el of all){
    const cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)===0)continue;
    const r=el.getBoundingClientRect();
    if(r.width===0||r.height===0)continue;
    if(vRolovaci(el))continue;
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
   /* Přetečení a JS chyby jsou VŽDY vada. Malé klikací plochy jsou vada
      jen tehdy, když jich je víc, než kolik jich má stránka povoleno. */
   let vadaTady=false;
   if(report.overflowDoc||report.offRight.length||errs.length){vady++;vadaTady=true;}
   const povoleno=ZNAME_MALE_PLOCHY[url]||0;
   if(report.smallTaps.length>povoleno){
    vady++;vadaTady=true;
    console.log('     ↑ povoleno '+povoleno+', nalezeno '+report.smallTaps.length);
   }
   souhrn.push({url,vada:vadaTady,popis:issues.join(' · '),
     plochy:report.smallTaps.length,povoleno});
  }else{
   console.log('\n### '+name+'  ('+url+')\n  ✅ OK (docW='+report.docW+')');
  }
  await ctx.close();
 }
 const verze=browser.version();
 await browser.close(); srv.close();

 /* Souhrn patří na KONEC. `run-ci.cjs` ukazuje z výstupu testu jen jeho
    poslední řádky, takže nálezy vypsané průběžně u jednotlivých stránek
    se z logu CI ztratí — a pak v něm stojí „1 vada" bez uvedení stránky.
    Stálo to jeden celý kruh přes CI (~7 min), a to jenom kvůli tomu,
    abych se dozvěděl, KDE. Vypisuje se i verze prohlížeče: sandbox má
    předinstalovaný starší build než si stáhne runner, takže se měření
    může lišit a z logu to musí být poznat. */
 if(souhrn.length){
  console.log('\n── SOUHRN NÁLEZŮ (stránka → co) ──');
  for(const s of souhrn) console.log('  '+(s.vada?'❌':'ℹ️ ')+' '+s.url+
    (s.plochy?'  [plochy '+s.plochy+'/'+s.povoleno+']':'')+'  '+s.popis.slice(0,150));
 }
 console.log('\n==========================================');
 console.log('  CELKEM nálezů: '+totalIssues+'  (z toho vad: '+vady+')');
 console.log('  proměřeno stránek: '+PAGES.length+'  ·  '+verze);
 console.log('==========================================');
 /* Dřív se končilo NULOU i s nálezy. Nová pravidla viz ZNAME_MALE_PLOCHY. */
 if(vady>0){console.error('\n  ❌ mobil: '+vady+' vad (přetečení, JS chyby nebo nové malé plochy)');process.exit(1);}
 if(PAGES.length<25){console.error('\n  ❌ audit proměřil jen '+PAGES.length+' stránek (čekáno ≥25)');process.exit(1);}
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
