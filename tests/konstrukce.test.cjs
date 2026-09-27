/* konstrukce.test.cjs — stránka Konstrukce (přijímačky, úlohy 9 a 10) v prohlížeči.
   Kreslí se SKUTEČNÝMI událostmi ukazatele (myš i prst přes CDP), ne voláním
   funkcí stránky — rozpoznání tahu, přichycení i hodnocení tak projdou celou
   cestou jako u žáka. Počítač: všech šest typů (Bod na řešení → správně),
   Thales pravítkem a kružítkem, část řešení, tah od ruky, kružítko na půl cm,
   kolmice a rovnoběžka, nápovědy (L3 ukáže řešení), postup po krocích,
   „kropení", zpět/smazat, pokrok se počítá jednou. Tablet: klepnutí otevře
   okno přes celou obrazovku, kreslí se prstem a okno se vejde na displej
   na výšku i na šířku. */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml' };
function serve(){ return new Promise(res=>{ const s=http.createServer((q,p)=>{
  let u=decodeURIComponent(q.url.split('?')[0]); if(u.endsWith('/'))u+='index.html';
  const fp=path.normalize(path.join(ROOT,u));
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){p.writeHead(404);return p.end('nf');}
  p.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});
  fs.createReadStream(fp).pipe(p);
}); s.listen(0,()=>res(s)); }); }
let pass=0, fail=0;
const ok=(c,m)=>{ if(c){pass++;console.log('  ✅ '+m);} else {fail++;console.log('  ❌ '+m);} };
const URL_K='/projects/prijimacky-matematika/konstrukce.html';

// souřadnice okna (jednotky viewBoxu) → souřadnice obrazovky
const naObrazovku=(page,body)=>page.evaluate(b=>{
  const m=document.getElementById('kn-svg').getScreenCTM();
  return b.map(p=>({x:m.a*p.x+m.c*p.y+m.e, y:m.b*p.x+m.d*p.y+m.f}));
},body);
async function klik(page,p){ const [s]=await naObrazovku(page,[p]); await page.mouse.click(s.x,s.y); }
async function tah(page,body){
  const s=await naObrazovku(page,body);
  await page.mouse.move(s[0].x,s[0].y); await page.mouse.down();
  for(let i=1;i<s.length;i++) await page.mouse.move(s[i].x,s[i].y,{steps:3});
  await page.mouse.up();
}
const nastroj=(page,id)=>page.click('#kn-nastroje [data-n="'+id+'"]');
async function nova(page,typ){
  await page.selectOption('#kn-typ',typ);
  await page.evaluate(()=>document.getElementById('kn-svg').scrollIntoView({block:'center'}));
  return page.evaluate(()=>JSON.parse(JSON.stringify(KN.u)));
}
const vysledek=page=>page.evaluate(()=>{ const v=document.querySelector('#kn-vysledek .kn-vysl'); return v?{t:v.textContent, ok:v.classList.contains('ok')}:null; });

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  const blok=r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort();

  // ══ Počítač ══
  const ctx=await browser.newContext({viewport:{width:1000,height:1000}});
  await ctx.route('**/*',blok);
  // seedovaný Math.random: úlohy se losují, pád musí jít zopakovat
  await ctx.addInitScript(()=>{ let s=20260927; Math.random=()=>{ s=(Math.imul(s,1103515245)+12345)>>>0; return s/4294967296; }; });
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource|net::ERR/i.test(m.text()))errs.push(m.text()); });
  page.on('dialog',d=>d.accept());
  await page.goto(base+URL_K,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof KN!=='undefined'&&KN.u,{timeout:8000});
  console.log('── Konstrukce: počítač ──');
  ok(await page.$$eval('#kn-nastroje [data-n]',b=>b.length)===6 && await page.$$eval('#kn-nastroje [data-a]',b=>b.length)===3,'lišta: 6 nástrojů + zpět, smazat, zvětšit');

  // 1) každý typ: zadání se vykreslí a Bod na každém řešení = správně
  const typy=await page.evaluate(()=>PZ_KONSTRUKCE.TYPY);
  for(const typ of typy){
    const u=await nova(page,typ);
    const popisky=await page.$$eval('#kn-dane text.kn-d-txt',t=>t.map(x=>x.textContent));
    const dane=Object.keys(u.dane.body);
    ok(dane.every(k=>popisky.includes(k)) && (await page.textContent('#kn-text'))===u.text,typ+': zadané body '+dane.join(', ')+' jsou v okně popsané a text zadání je pod ním');
    await nastroj(page,'bod');
    for(const s of u.reseni) for(const p of Object.values(s)) await klik(page,p);
    await page.click('#kn-vyhodnot');
    const v=await vysledek(page);
    ok(v&&v.ok&&/Správně/.test(v.t),typ+': Bod na každém řešení ('+u.reseni.reduce((a,s)=>a+Object.keys(s).length,0)+') → „Správně"'+(v?'':' (žádný výsledek)'));
  }
  const pocitadlo=await page.evaluate(()=>[document.getElementById('kn-ok').textContent,document.getElementById('kn-total').textContent]);
  ok(pocitadlo[0]===String(typy.length)&&pocitadlo[1]===String(typy.length),'počítadlo „správně X z Y" = '+pocitadlo.join(' z '));

  // 2) Thales poctivě: bod S doprostřed AB, kružítko z S přes A, body na průsečíky
  {
    const u=await nova(page,'thales');
    const {A,B}=u.dane.body, S={x:(A.x+B.x)/2,y:(A.y+B.y)/2};
    await nastroj(page,'bod'); await klik(page,S);
    await nastroj(page,'kruzitko'); await tah(page,[S,{x:(S.x+A.x)/2,y:(S.y+A.y)/2},A]);
    // S je tam, kam klepnutí dopadlo (obrazovka ho zaokrouhlí na pixely), ne ideální střed
    const {k,Sz}=await page.evaluate(()=>({k:KN.tvary[KN.tvary.length-1], Sz:KN.tvary[0].p}));
    const d=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
    ok(k&&k.typ==='kruznice'&&d(k.c,Sz)<1e-9&&Math.abs(k.r-d(Sz,A))<1e-9,'kružítko: střed přesně v označeném S, poloměr přichycený přes A (r = '+(k?k.r.toFixed(3):'—')+', |SA| = '+d(Sz,A).toFixed(3)+')');
    // klepnutí 5 jednotek vedle průsečíku skočí přesně na průsečík TÉ kružnice s p
    const X=await page.evaluate(k=>PZ_GEO.prusecikyPK(KN.u.dane.primky[0].p,KN.u.dane.primky[0].q,k.c,k.r),k);
    await nastroj(page,'bod');
    for(const x of X) await klik(page,{x:x.x+4,y:x.y-3});
    const body=await page.evaluate(()=>KN.tvary.filter(t=>t.typ==='bod').map(t=>t.p));
    ok(X.length===2&&X.every(x=>body.some(p=>d(p,x)<1e-9)),'klepnutí kousek vedle průsečíku kružnice s p skočí přesně na průsečík ('+X.length+' průsečíky)');
    await page.click('#kn-vyhodnot');
    const v=await vysledek(page);
    ok(v&&v.ok&&/všechna řešení \(2\)/.test(v.t),'Thales pravítkem a kružítkem → „Správně, všechna řešení (2)"');
  }

  // 3) část řešení: jedno ze dvou → „1 z 2", a opakované vyhodnocení se nepočítá znovu
  {
    const u=await nova(page,'kruznice');
    const pred=await page.evaluate(()=>KN.total);
    await nastroj(page,'bod'); await klik(page,u.reseni[0].X);
    await page.click('#kn-vyhodnot');
    const v=await vysledek(page);
    ok(v&&!v.ok&&/1 z 2/.test(v.t),'jedno ze dvou řešení → „Našel/našla jsi 1 z 2", ne správně');
    await klik(page,u.reseni[1].X); await page.click('#kn-vyhodnot');
    const v2=await vysledek(page), po=await page.evaluate(()=>KN.total);
    ok(v2&&v2.ok&&po===pred+1,'po doplnění druhého řešení správně, ale úloha se započítá jen jednou ('+(po-pred)+'×)');
  }

  // 4) tah od ruky: skoro rovná čára od A skoro k B → úsečka přesně A–B
  {
    const u=await nova(page,'rovnobeznik');
    const {A,B}=u.dane.body, body=[];
    for(let i=0;i<=24;i++){ const t=i/24; body.push({x:A.x+(B.x-A.x)*t+Math.sin(i*1.7)*1.2, y:A.y+(B.y-A.y)*t+Math.cos(i*1.3)*1.2+(t-0.5)*1.5}); }
    body[0]={x:A.x+3,y:A.y-2}; body[24]={x:B.x-2,y:B.y+3};
    await nastroj(page,'ruka'); await tah(page,body);
    const t=await page.evaluate(()=>KN.tvary[KN.tvary.length-1]);
    const d=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
    ok(t&&t.typ==='usecka'&&d(t.p,A)<1e-6&&d(t.q,B)<1e-6,'od ruky: roztřesený tah z A do B → úsečka přesně A–B');
    // oblouk od ruky → kružnice. Kreslí se tam, kde žádný bod neleží blíž než 25
    // jednotek od kružnice ani od středu — jinak ho přichycení (správně) protáhne
    // tím bodem a poloměr se změní; u náhodné úlohy by test padal podle losu
    const kotvy=Object.values(u.dane.body), c=(()=>{
      for(let y=80;y<=220;y+=10) for(let x=80;x<=320;x+=10){
        const c={x,y}; if(kotvy.every(P=>{ const dd=Math.hypot(P.x-x,P.y-y); return dd>25&&Math.abs(dd-70)>25; })) return c; }
      return null; })(), oblouk=[];
    for(let i=0;i<=30;i++){ const a=-0.3+i*0.07; oblouk.push({x:c.x+70*Math.cos(a),y:c.y+70*Math.sin(a)}); }
    await tah(page,oblouk);
    const k=await page.evaluate(()=>KN.tvary[KN.tvary.length-1]);
    ok(k&&k.typ==='kruznice'&&k.rozpeti!=null&&Math.abs(k.r-70)<5,'od ruky: oblouk o 120° → kružnice (oblouk), r = '+(k&&k.r?k.r.toFixed(1):'—'));
    const obl=await page.$$eval('#kn-zak path',p=>p.length);
    ok(obl>=1,'oblouk se vykreslí jako <path> (ne celá kružnice)');
    // zpět odebere poslední tvar, smazat všechno (s potvrzením)
    const n0=await page.evaluate(()=>KN.tvary.length);
    await page.click('#kn-nastroje [data-a="zpet"]');
    const n1=await page.evaluate(()=>KN.tvary.length);
    await page.click('#kn-nastroje [data-a="smazat"]');
    const n2=await page.evaluate(()=>KN.tvary.length);
    ok(n1===n0-1&&n2===0&&await page.$$eval('#kn-zak > *',x=>x.length)===0,'Zpět odebere poslední tvar ('+n0+' → '+n1+'), Smazat vyčistí náčrt');
  }

  // 5) kružítko bez bodu pod ukazatelem → poloměr na půl centimetru
  {
    const u=await nova(page,'kruznice');
    const S=u.dane.body.S, uhel=[0,1,2,3,4,5].map(i=>i*Math.PI/3).find(a=>{
      const x={x:S.x+88.5*Math.cos(a),y:S.y+88.5*Math.sin(a)};
      return x.x>20&&x.x<380&&x.y>20&&x.y<280;
    });
    await nastroj(page,'kruzitko');
    await tah(page,[S,{x:S.x+88.5*Math.cos(uhel),y:S.y+88.5*Math.sin(uhel)}]);
    const k=await page.evaluate(()=>KN.tvary[KN.tvary.length-1]);
    ok(k&&k.typ==='kruznice'&&Math.abs(k.r-90)<1e-6,'kružítko roztažené na 2,95 cm skončí přesně na 3 cm (r = '+(k?k.r:'—')+')');
  }

  // 6) kolmice a rovnoběžka k přímce p bodem
  {
    const u=await nova(page,'osa');
    const p=u.dane.primky[0], up={x:p.q.x-p.p.x,y:p.q.y-p.p.y}, L=Math.hypot(up.x,up.y);
    const naP=(()=>{ for(let t=0.5;t>=0;t-=0.05){ const x={x:p.p.x+up.x*t,y:p.p.y+up.y*t}; if(x.x>30&&x.x<370&&x.y>30&&x.y<270) return x; } return null; })();
    for(const [id,ocek] of [['kolmice',0],['rovnobezka',1]]){
      await nastroj(page,id);
      await klik(page,naP);                         // výběr přímky p
      await klik(page,u.dane.body.A);               // bodem A
      const t=await page.evaluate(()=>KN.tvary[KN.tvary.length-1]);
      const ut={x:t.q.x-t.p.x,y:t.q.y-t.p.y}, cos=Math.abs(ut.x*up.x+ut.y*up.y)/(Math.hypot(ut.x,ut.y)*L);
      ok(t.typ==='primka'&&Math.abs(cos-ocek)<1e-9&&Math.hypot(t.p.x-u.dane.body.A.x,t.p.y-u.dane.body.A.y)<1e-6,
        id+' k přímce p bodem A (|cos| = '+cos.toFixed(6)+')');
    }
  }

  // 7) nápovědy: tři úrovně, třetí oranžová a ukáže řešení v okně
  {
    const u=await nova(page,'vyska');
    for(let i=0;i<3;i++) await page.click('#kn-hint-btn');
    const h=await page.evaluate(()=>({n:document.querySelectorAll('#kn-napovedy .kn-hint').length, l3:!!document.querySelector('#kn-napovedy .kn-hint.l3'),
      barva:getComputedStyle(document.querySelector('#kn-napovedy .kn-hint.l3')).borderLeftColor, btn:document.getElementById('kn-hint-btn').textContent,
      dis:document.getElementById('kn-hint-btn').disabled, body:document.querySelectorAll('#kn-reseni circle.kn-r-bod').length}));
    ok(h.n===3&&h.l3&&h.barva==='rgb(194, 65, 12)','tři nápovědy, třetí odlišená oranžově ('+h.barva+')');
    ok(h.dis&&/3\/3/.test(h.btn),'tlačítko po třetí nápovědě „'+h.btn+'" a zamčené');
    ok(h.body===u.reseni.length,'L3 nápověda ukáže v okně hledané body ('+h.body+' z '+u.reseni.length+')');
  }

  // 8) postup po krocích po vyhodnocení
  {
    const u=await nova(page,'soumernost');
    await page.click('#kn-vyhodnot');
    const krok=()=>page.evaluate(()=>({t:document.querySelector('.kn-postup-t').textContent, tvaru:document.getElementById('kn-reseni').children.length}));
    const k1=await krok();
    await page.click('.kn-postup-nav button:has-text("Další krok")');
    const k2=await krok();
    ok(new RegExp('krok 1 z '+u.postup.length).test(k1.t)&&/krok 2 z/.test(k2.t)&&k2.tvaru>k1.tvaru,'postup: krok 1 → 2 a v okně přibude kresba ('+k1.tvaru+' → '+k2.tvaru+')');
    const v=await vysledek(page);
    ok(v&&!v.ok&&/není/.test(v.t),'prázdný náčrt → „Hledaný bod tam zatím není"');
  }

  // 9) „kropení": body po celém okně řešení neuznají, i když ho zasáhnou
  {
    await nova(page,'rovnobeznik');
    await page.evaluate(()=>{ for(let x=20;x<=380;x+=20) for(let y=20;y<=280;y+=20) KN.tvary.push({typ:'bod',p:PZ_GEO.bod(x,y)}); });
    await page.evaluate(()=>{ const D=KN.u.reseni[0].D; KN.tvary.push({typ:'bod',p:D}); });
    await page.click('#kn-vyhodnot');
    const v=await vysledek(page);
    ok(v&&!v.ok&&/moc/.test(v.t),'síť bodů přes celé okno → „Označených bodů je moc", neuzná se');
  }

  // 10) pokrok v localStorage a karta v procvičování
  {
    const p=await page.evaluate(()=>JSON.parse(localStorage.getItem('PZ_PRACTICE_PROGRESS')||'{}').konstrukce);
    const kn=await page.evaluate(()=>({ok:KN.ok,total:KN.total}));
    ok(p&&p.ok===kn.ok&&p.total===kn.total,'pokrok uložený pod PZ_PRACTICE_PROGRESS.konstrukce ('+(p?p.ok+'/'+p.total:'nic')+', stránka '+kn.ok+'/'+kn.total+')');
    await page.goto(base+'/projects/prijimacky-matematika/procvicovani.html',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('a.topic-card[href="konstrukce.html"]',{timeout:8000});
    const karta=await page.textContent('a.topic-card[href="konstrukce.html"]');
    ok(/Konstrukce/.test(karta)&&karta.includes(kn.ok+' správně z '+kn.total),'procvičování má kartu Konstrukce s pokrokem („'+karta.replace(/\s+/g,' ').trim()+'")');
    await page.evaluate(()=>localStorage.setItem('PZ_PRACTICE_PROGRESS',JSON.stringify({konstrukce:{ok:'<img src=x onerror=alert(1)>',total:'abc'}})));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('a.topic-card[href="konstrukce.html"]',{timeout:8000});
    const k2=await page.evaluate(()=>{ const a=document.querySelector('a.topic-card[href="konstrukce.html"]'); return {img:!!a.querySelector('img'), t:a.textContent}; });
    ok(!k2.img&&!/NaN/.test(k2.t),'podvržený pokrok (HTML, text) kartu nerozbije');
  }
  ok(errs.length===0,'žádné JS chyby na počítači'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
  await ctx.close();

  // ══ Tablet ══
  console.log('── Konstrukce: tablet ──');
  for(const vp of [{width:820,height:1180,n:'na výšku'},{width:1180,height:820,n:'na šířku'}]){
    const tctx=await browser.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:true,deviceScaleFactor:2});
    await tctx.route('**/*',blok);
    const tp=await tctx.newPage();
    const terrs=[]; tp.on('pageerror',e=>terrs.push(e.message));
    await tp.goto(base+URL_K,{waitUntil:'domcontentloaded'});
    await tp.waitForFunction(()=>typeof KN!=='undefined'&&KN.u,{timeout:8000});
    const u=await nova(tp,'kruznice');
    // klepnutí mimo celou obrazovku nekreslí, jen otevře okno
    const [st]=await naObrazovku(tp,[{x:200,y:150}]);
    await tp.touchscreen.tap(st.x,st.y);
    await tp.waitForFunction(()=>KN.full,{timeout:3000}).catch(()=>{});
    const f=await tp.evaluate(()=>{ const r=document.getElementById('kn-svg').getBoundingClientRect();
      return {full:KN.full, tvaru:KN.tvary.length, v:document.getElementById('kn-full-plocha').contains(document.getElementById('kn-svg')),
        nastroje:document.getElementById('kn-full-top').contains(document.getElementById('kn-nastroje')), zvetsit:!!document.querySelector('#kn-nastroje [data-a="zvetsit"]'),
        text:document.getElementById('kn-full-text').textContent, r:{l:r.left,t:r.top,rr:r.right,b:r.bottom,w:r.width}, W:innerWidth, H:innerHeight}; });
    ok(f.full&&f.v&&f.nastroje&&!f.zvetsit&&f.tvaru===0,vp.n+': klepnutí do okna otevře kreslení přes celou obrazovku (nástroje nahoře, žádná kresba navíc)');
    ok(f.text===u.text,vp.n+': zadání je vidět i v celé obrazovce');
    ok(f.r.l>=0&&f.r.t>=0&&f.r.rr<=f.W+0.5&&f.r.b<=f.H+0.5&&f.r.w>=f.W*0.6,vp.n+': okno se vejde na displej a je velké ('+Math.round(f.r.w)+' × '+Math.round(f.r.b-f.r.t)+' px z '+f.W+' × '+f.H+')');
    // prst: tah od ruky přes CDP (dotyk začne, pohne se, skončí)
    const cdp=await tctx.newCDPSession(tp);
    const S=u.dane.body.S, konce=await naObrazovku(tp,[{x:S.x-60,y:S.y-80},{x:S.x+60,y:S.y-80}]);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:konce[0].x,y:konce[0].y}]});
    for(let i=1;i<=20;i++){ const t=i/20; await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:konce[0].x+(konce[1].x-konce[0].x)*t,y:konce[0].y+(konce[1].y-konce[0].y)*t+Math.sin(i)*1.5}]}); }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const t=await tp.evaluate(()=>KN.tvary[KN.tvary.length-1]);
    ok(t&&t.typ==='usecka',vp.n+': tah prstem v celé obrazovce → úsečka'+(t?'':' (nic nevzniklo)'));
    // prst: Bod na obě řešení a Vyhodnotit z celé obrazovky
    await tp.click('#kn-nastroje [data-n="bod"]');
    for(const s of u.reseni){ const [x]=await naObrazovku(tp,[s.X]); await tp.touchscreen.tap(x.x,x.y); }
    await tp.click('#kn-full-top .pz-btn.primary');
    const v=await vysledek(tp), po=await tp.evaluate(()=>({full:KN.full, doma:document.getElementById('kn-domov').contains(document.getElementById('kn-svg'))}));
    ok(v&&v.ok&&!po.full&&po.doma,vp.n+': Vyhodnotit z celé obrazovky ji zavře, okno se vrátí na stránku a výsledek je „Správně"');
    ok(terrs.length===0,vp.n+': žádné JS chyby'+(terrs.length?': '+terrs[0]:''));
    await tctx.close();
  }

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
