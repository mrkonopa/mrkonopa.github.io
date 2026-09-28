/* prijimacky-test.test.cjs — Test nanečisto v přijímačkovém hubu (světlá stránka).
   Ověřuje: načtení, vyplnění všech typů úloh (open/tfgrid/mc/match), skóre 50/50
   při správných odpovědích, částečné skóre při chybě, inputmode, světlé pozadí,
   review s řešením, žádné JS chyby, XSS bezpečnost esc(). */
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

// vyplní VŠECHNY úlohy (volitelně jednu open úlohu schválně špatně) a odevzdá
// tfSpatne = kolik tvrzení úlohy 11 odpovědět obráceně (stupnice CERMAT: 3 správně 4 b, 2 správně 2 b, jinak 0)
// kn = jak „narýsovat" konstrukce 9 a 10: 'presne' (vrcholy přesně), 'mirne' (o 14 jednotek
// vedle — mezi tolerancí přesně 10 a mírně 18) nebo 'nic'
async function fillAndSubmit(page, sabotage, tfSpatne, kn){
  page.once('dialog', d=>d.accept());
  await page.evaluate(([sab, tfS, kn])=>{
    let firstOpenDone=false;
    CM.tasks.forEach(t=>{
      if(t.kind==='tfgrid'){ t.statements.forEach((s,i)=>{ const v=i<tfS?(s.ans==='A'?'N':'A'):s.ans;
        const r=document.querySelector('input[name="cm-tf-'+t.no+'-'+i+'"][value="'+v+'"]'); if(r)r.checked=true; }); }
      else if(t.kind==='mc'){ const r=document.querySelector('input[name="cm-mc-'+t.no+'"][value="'+t.ans+'"]'); if(r)r.checked=true; }
      else if(t.kind==='match'){ t.prompts.forEach((p,i)=>{ const sel=document.getElementById('cm-match-'+t.no+'-'+i); if(sel)sel.value=t.ans[i]; }); }
      else if(t.kind==='konstrukce'){ if(kn==='nic') return;
        t.u.reseni.forEach(r=>Object.values(r).forEach(p=>CM.okna[t.no].tvary.push({typ:'bod', p: kn==='mirne' ? PZ_GEO.bod(p.x+14, p.y) : p}))); }
      else { (t.parts||[]).forEach((p,i)=>{ const inp=document.getElementById('cm-p-'+t.no+'-'+i);
        if(!inp)return; if(sab&&!firstOpenDone){ inp.value='___SPATNE___'; firstOpenDone=true; } else inp.value=String(p.ans); }); }
    });
  }, [!!sabotage, tfSpatne||0, kn||'presne']);
  await page.click('button.pz-btn.primary:has-text("Odevzdat")');
  await page.waitForFunction(()=>document.getElementById('cm-end').style.display!=='none',{timeout:5000});
}

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  const ctx=await browser.newContext();
  // Blokuj externí (Google Fonts) — jinak load čeká na zablokované CDN.
  await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource|net::ERR/i.test(m.text()))errs.push(m.text()); });

  await page.goto(base+'/projects/prijimacky-matematika/test.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.RPG_CERMAT_9&&window.PZ&&typeof window.checkAns==='function',{timeout:8000});
  console.log('── Přijímačky: test nanečisto ──');

  ok(await page.evaluate(()=>RPG_CERMAT_9.maxScore===50&&RPG_CERMAT_9.timeLimitSec===70*60),'generátor: 50 bodů / 70 min');

  // světlé pozadí (ne tmavý RPG)
  const bg=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  const light=(()=>{ const m=bg.match(/\d+/g); if(!m)return false; const [r,g,b]=m.map(Number); return (r+g+b)/3>180; })();
  ok(light,'světlé pozadí ('+bg+')');
  ok(await page.evaluate(()=>getComputedStyle(document.body).fontFamily.toLowerCase().includes('lexend')),'font Lexend');

  // spusť test
  await page.click('button.pz-btn.primary:has-text("Začít")');
  await page.waitForFunction(()=>document.getElementById('cm-play').style.display!=='none',{timeout:5000});
  const nTasks=await page.evaluate(()=>CM.tasks.length);
  ok(nTasks===16,'vygenerováno 16 úloh ('+nTasks+')');

  // inputmode na open vstupech (numeric/decimal/text)
  const im=await page.evaluate(()=>{ const els=[...document.querySelectorAll('.cm-part input[type=text]')];
    return els.length && els.every(e=>['numeric','decimal','text'].includes(e.inputMode)); });
  ok(im,'inputmode nastaven na všech číselných vstupech');

  // sticky timer běží
  ok(await page.evaluate(()=>/^\d+:\d\d$/.test(document.getElementById('cm-timer-v').textContent)),'časomíra zobrazena');

  // ── úlohy 9 a 10 jsou rýsovací konstrukce (v ostrém testu vždy) ──
  const kn=await page.evaluate(()=>{ const t9=CM.tasks[8], t10=CM.tasks[9];
    return { kind:[t9.kind,t10.kind], body:[t9.points,t10.points], soucet:CM.tasks.reduce((a,t)=>a+t.points,0),
      typy:[t9.u&&t9.u.typ, t10.u&&t10.u.typ], vSade:!!(t9.u&&t10.u)&&PZ_KONSTRUKCE.PRO_TEST[9].indexOf(t9.u.typ)>=0&&PZ_KONSTRUKCE.PRO_TEST[10].indexOf(t10.u.typ)>=0,
      okna:document.querySelectorAll('#cm-tasks .cm-kn svg.kn-svg').length, listy:document.querySelectorAll('#cm-tasks .cm-kn [data-n="bod"]').length,
      ostatni:CM.tasks.filter(t=>t.kind==='konstrukce').length }; });
  ok(kn.kind.join()==='konstrukce,konstrukce' && kn.body.join()==='3,2' && kn.soucet===50 && kn.ostatni===2,
    'úlohy 9 a 10 jsou konstrukce za 3 a 2 b., test má dál 50 bodů ('+kn.kind.join()+', '+kn.body.join()+', součet '+kn.soucet+')');
  ok(kn.vSade && kn.okna===2 && kn.listy===2,'každá má své kreslicí okno s nástroji a typ ze své sady ('+kn.typy.join(', ')+'; oken '+kn.okna+')');
  // skutečné kliknutí myší nástrojem Bod do okna úlohy 10: dvě okna na stránce se nesmí plést
  await page.click('#cm-kn10-nastroje [data-n="bod"]');
  const cile=await page.evaluate(()=>{ const s=document.getElementById('cm-kn10-svg'); s.scrollIntoView({block:'center'});
    const m=s.getScreenCTM(); return Object.values(CM.tasks[9].u.reseni[0]).map(p=>({x:m.a*p.x+m.c*p.y+m.e, y:m.b*p.x+m.d*p.y+m.f})); });
  for(const c of cile) await page.mouse.click(c.x, c.y);
  const klik=await page.evaluate(()=>{ const r=Object.values(CM.tasks[9].u.reseni[0]), tv=CM.okna[10].tvary;
    return { n10:tv.length, n9:CM.okna[9].tvary.length, max:Math.max(...r.map(p=>Math.min(...tv.map(t=>Math.hypot(t.p.x-p.x,t.p.y-p.y))))) }; });
  ok(klik.n10===cile.length && klik.n9===0 && klik.max<1.5,'klik myší nástrojem Bod kreslí jen do okna úlohy 10 a trefí vrcholy ('+klik.n10+' bodů, okno 9: '+klik.n9+', odchylka '+klik.max.toFixed(2)+')');

  // ── vše správně → 50/50 ──
  await fillAndSubmit(page, false);
  const scoreTxt=await page.evaluate(()=>document.getElementById('cm-end-score').textContent);
  ok(/^50 \/ 50 bodů/.test(scoreTxt),'správné odpovědi → 50 / 50 ('+scoreTxt+')');
  ok(await page.evaluate(()=>document.getElementById('cm-end-pct').textContent==='100 %'),'100 %');
  ok(await page.evaluate(()=>document.querySelectorAll('#cm-end-detail details').length===16),'rozbor: 16 úloh');

  // historie se uloží (localStorage)
  ok(await page.evaluate(()=>{ try{return JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS')).length>=1;}catch(e){return false;} }),'pokus uložen do historie');
  // body po úlohách (statistiky z nich počítají, KDE se body ztrácejí) musí sedět na skóre
  const posl=await page.evaluate(()=>{ try{ const a=JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS')); return a[a.length-1]; }catch(e){ return null; } });
  ok(posl && Array.isArray(posl.ulohy) && posl.ulohy.length===16 && posl.ulohy.reduce((s,u)=>s+u[0],0)===posl.score &&
     posl.ulohy.reduce((s,u)=>s+u[1],0)===posl.max && posl.t>0 && posl.cas>=0,
     'pokus nese body po 16 úlohách (součet = skóre '+(posl&&posl.score)+', maxima = '+(posl&&posl.max)+'), čas a okamžik odevzdání');

  // ── jedna chyba → méně než 50 + review ukáže správně/tvoje ──
  await page.click('button.pz-btn.primary:has-text("Zkusit znovu")');
  await page.waitForFunction(()=>document.getElementById('cm-play').style.display!=='none',{timeout:5000});
  await fillAndSubmit(page, true);
  const sc2=await page.evaluate(()=>parseInt(document.getElementById('cm-end-score').textContent));
  ok(sc2<50 && sc2>0,'jedna chyba → částečné skóre ('+sc2+')');
  ok(await page.evaluate(()=>/Správně:/.test(document.getElementById('cm-end-detail').textContent)),'review ukazuje správnou odpověď');
  ok(await page.evaluate(()=>document.querySelector('#cm-end-detail .cm-review-given')!==null),'review ukazuje „Tvoje odpověď" u chyby');
  // U úloh s volbami rozbor ukazuje celou volbu („Správně: C) 54 m"), ne holé písmeno,
  // a u tvrzení A/N slovo („A (pravdivé)"). Úlohy 12–14 jsou vždy s volbami.
  const volby=await page.evaluate(()=>{
    const txt=[...document.querySelectorAll('#cm-end-detail .cm-review-correct')].map(e=>e.textContent);
    return { mc: txt.filter(x=>/^Správně: [A-F]\) \S/.test(x)).length, holych: txt.filter(x=>/^Správně: [A-F]$/.test(x)).length,
      an: txt.filter(x=>/^Správně: [AN] \((ne)?pravdivé\)$/.test(x)).length };
  });
  ok(volby.mc>=6 && volby.holych===0 && volby.an>=3,'rozbor ukazuje celé volby a slovem pravdivost ('+JSON.stringify(volby)+')');

  // ── rozbor drží kontext zadání: úvodní text i nákres ──
  // Dřív se do rozboru předával jen prompt/odpověď, takže si dítě geometrickou chybu
  // prohlíželo BEZ obrázku, u kterého ji udělalo. Porovnáváme proti pravdě z generátoru,
  // ne proti konstantě — počet se mezi běhy liší. (Naměřeno na 3000 bězích: každý běh
  // má aspoň 1 nákres a aspoň 6 introů, takže kontrola nikdy neběží naprázdno.)
  const ctxR=await page.evaluate(()=>({
    // konstrukce (úlohy 9 a 10) mají v rozboru snímek kresby a zadání jako úvod
    svgT: CM.tasks.filter(t=>t.svg||t.kind==='konstrukce').length,
    introT: CM.tasks.filter(t=>t.intro||t.kind==='konstrukce').length,
    svgD: document.querySelectorAll('#cm-end-detail .cm-review-svg svg').length,
    introD: document.querySelectorAll('#cm-end-detail .cm-review-intro').length
  }));
  ok(ctxR.svgT>0 && ctxR.introT>0,'běh obsahuje úlohy s nákresem i introm ('+ctxR.svgT+' / '+ctxR.introT+')');
  ok(ctxR.svgD===ctxR.svgT,'rozbor ukazuje nákres u všech úloh, které ho mají ('+ctxR.svgD+' / '+ctxR.svgT+')');
  ok(ctxR.introD===ctxR.introT,'rozbor ukazuje úvodní text u všech úloh, které ho mají ('+ctxR.introD+' / '+ctxR.introT+')');

  // ── úloha 11 se boduje stupnicí, ne bodem za tvrzení ──
  // 1 tvrzení špatně → 2 správně → 2 body ze 4; 2 špatně → 1 správně → 0 bodů.
  for (const [spatne, cekam] of [[1, 48], [2, 46], [3, 46]]) {
    await page.click('button.pz-btn.primary:has-text("Zkusit znovu")');
    await page.waitForFunction(()=>document.getElementById('cm-play').style.display!=='none',{timeout:5000});
    await fillAndSubmit(page, false, spatne);
    const sc=await page.evaluate(()=>parseInt(document.getElementById('cm-end-score').textContent));
    ok(sc===cekam,'úloha 11: '+spatne+' tvrzení špatně → '+cekam+' / 50 ('+sc+')');
    // ztráta musí v uložených bodech po úlohách sedět právě na úlohu 11
    const u=await page.evaluate(()=>{ const a=JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS')); return a[a.length-1].ulohy; });
    const ztraty=u.map((x,i)=>x[1]-x[0]>0?i+1:0).filter(Boolean);
    ok(ztraty.join()==='11' && u[10][0]===cekam-46,'uložené body po úlohách: ztráta jen v úloze 11 ('+ztraty.join()+', '+u[10][0]+' b.)');
  }

  // ── konstrukce se bodují podle klíče CERMAT a mají svůj rozbor ──
  for (const [jak, cekam, u9, u10] of [['mirne', 48, 2, 1], ['nic', 45, 0, 0]]) {
    await page.click('button.pz-btn.primary:has-text("Zkusit znovu")');
    await page.waitForFunction(()=>document.getElementById('cm-play').style.display!=='none',{timeout:5000});
    await fillAndSubmit(page, false, 0, jak);
    const sc=await page.evaluate(()=>parseInt(document.getElementById('cm-end-score').textContent));
    const u=await page.evaluate(()=>{ const a=JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS')); return a[a.length-1].ulohy; });
    ok(sc===cekam && u[8].join()===u9+',3,konstrukce' && u[9].join()===u10+',2,konstrukce',
      'konstrukce '+(jak==='mirne'?'s mírnou nepřesností (o 14 jednotek vedle) → o bod méně v každé':'nenarýsované → 0 b.')+': '+sc+' / 50, uloženo '+u[8].join('|')+' a '+u[9].join('|'));
    if (jak !== 'mirne') continue;
    const r=await page.evaluate(()=>{ const d=[...document.querySelectorAll('#cm-end-detail details')].filter(x=>/^Úloha (9|10) /.test(x.querySelector('summary').textContent));
      return { n:d.length, snimky:d.filter(x=>x.querySelector('.cm-review-svg svg.kn-snimek .kn-z')&&x.querySelector('.kn-snimek .kn-r')).length,
        kroky:d.map(x=>x.querySelectorAll('ol.cm-review-steps li').length).join(), postup:[8,9].map(i=>CM.tasks[i].u.postup.length).join(),
        popis:d.filter(x=>/mírnou nepřesností/.test(x.textContent)).length,
        odkazy:d.filter(x=>x.querySelector('a[href^="konstrukce.html?typ="]')).length,
        dalsi:!!document.querySelector('.cm-next a.cm-next-row[href="konstrukce.html"]'),
        vyklad:d.filter(x=>x.querySelector('a[href*="rpg-mat"]')).length,
        // každý bod vzorového řešení má jeden popisek (dřív ho popsala vrstva řešení i krok postupu: „C₁C₁")
        dvojite:d.map(x=>[...x.querySelectorAll('.kn-snimek text.kn-r-txt')].map(e=>e.textContent)).filter(t=>new Set(t).size!==t.length).map(t=>t.join(' ')) }; });
    ok(r.n===2 && r.snimky===2 && r.kroky===r.postup && r.popis===2,'rozbor konstrukcí: snímek kresby se vzorovým řešením, slovní hodnocení a celý postup ('+r.kroky+' kroků)');
    ok(r.dvojite.length===0,'snímek popíše každý bod řešení jednou'+(r.dvojite.length?' — dvakrát: '+r.dvojite[0]:''));
    ok(r.odkazy===2 && r.dalsi && r.vyklad===0,'odkazy vedou do procvičování konstrukcí (ne na výklad výpočetní geometrie), „Co teď procvičovat" je nabízí');
  }

  // ── tablet: klepnutí otevře kreslení přes celou obrazovku, bez průběžného vyhodnocení ──
  const tctx=await browser.newContext({ viewport:{width:820,height:1180}, isMobile:true, hasTouch:true });
  await tctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const tp=await tctx.newPage(); tp.on('pageerror',e=>errs.push('tablet: '+e.message));
  await tp.goto(base+'/projects/prijimacky-matematika/test.html',{waitUntil:'domcontentloaded'});
  await tp.waitForFunction(()=>window.RPG_CERMAT_9&&window.PZ_OKNO,{timeout:8000});
  await tp.evaluate(()=>cmStart());
  await tp.evaluate(()=>document.getElementById('cm-kn9-svg').scrollIntoView({block:'center'}));
  await tp.tap('#cm-kn9-svg');
  await tp.waitForFunction(()=>CM.okna[9].jePlna(),{timeout:3000}).catch(()=>{});
  const f=await tp.evaluate(()=>({ plna:CM.okna[9].jePlna(), tlacitka:[...document.querySelectorAll('#kn-full-akce button')].map(b=>b.textContent),
    cas:document.getElementById('kn-full-cas').textContent, text:document.getElementById('kn-full-text').textContent===CM.tasks[8].u.text }));
  ok(f.plna && f.tlacitka.join()==='✓ Hotovo' && f.text,'tablet: celá obrazovka se zadáním a jen tlačítkem Hotovo — v testu se průběžně nevyhodnocuje ('+f.tlacitka.join()+')');
  await tp.evaluate(()=>updateTimerUI());
  ok(/^⏱ \d+:\d\d$/.test(await tp.evaluate(()=>document.getElementById('kn-full-cas').textContent)),'tablet: čas testu je vidět i při kreslení přes celou obrazovku');
  // čas vyprší při otevřeném kreslení: test se odevzdá a celá obrazovka zavře
  await tp.evaluate(()=>{ CM.timeLeft=1; cmTick(); });
  const po=await tp.evaluate(()=>({ plna:CM.okna[9].jePlna(), on:document.getElementById('kn-full').classList.contains('on'), konec:document.getElementById('cm-end').style.display!=='none' }));
  ok(!po.plna && !po.on && po.konec,'tablet: vypršení času při kreslení test odevzdá a celou obrazovku zavře');
  await tctx.close();

  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
