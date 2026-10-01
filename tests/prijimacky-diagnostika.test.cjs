/* prijimacky-diagnostika.test.cjs — Diagnostika (mapa slabin) v přijímačkovém hubu.
   Dvě úlohy na téma: první vždy na úrovni testu, druhá po správné opět testová,
   po chybné ze základu. Úroveň 0–3 = (první, druhá). Test projde všechny čtyři
   kombinace (každé téma dostane jednu podle pořadí), ověří, že druhá úloha
   přichází ze SPRÁVNÉ úrovně, pořadí plánu podle bodů v testu, rozbor chyb,
   tlačítko „Nevím", uložení (nový i zpětně čitelný tvar) a žádné JS chyby. */
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
// vzor odpovědí po tématech: [první správně?, druhá správně?] → úroveň 3, 2, 1, 0
const VZOR = [[true,true],[true,false],[false,true],[false,false]];
const UROVEN = v => v[0] ? (v[1] ? 3 : 2) : (v[1] ? 1 : 0);
(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:EXEC});
  const ctx=await browser.newContext();
  await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource|net::ERR/i.test(m.text()))errs.push(m.text()); });
  await page.goto(base+'/projects/prijimacky-matematika/diagnostika.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PZ_TOPICS&&window.RPG_CERMAT_9&&window.PZ,{timeout:8000});
  console.log('── Přijímačky: diagnostika ──');
  await page.click('button.pz-btn.primary:has-text("Začít")');
  await page.waitForFunction(()=>document.getElementById('dg-run').style.display!=='none',{timeout:5000});
  const T=await page.evaluate(()=>PZ_TOPICS.list.length);
  ok(await page.evaluate(()=>document.getElementById('dg-n').textContent)===String(2*T),'dvě úlohy na téma ('+(2*T)+')');

  // průchod: téma k dostane vzor VZOR[k % 4]; sleduj úroveň, ze které úloha přišla
  const urovne=[]; let nevim=0, spatne=0;
  for(let q=0;q<2*T;q++){
    const st=await page.evaluate(()=>({k:DG.k, krok:DG.krok, u:DG.it&&DG.it.uroven}));
    urovne.push(st);
    const spravne=VZOR[st.k%4][st.krok];
    if(!spravne) spatne++;
    // u vzoru (✗,✗) odpověz napoprvé „Nevím" — i to se musí počítat jako chyba
    const pouzijNevim=!spravne && st.krok===0 && VZOR[st.k%4][1]===false;
    if(pouzijNevim) nevim++;
    await page.evaluate(({spravne,pouzijNevim})=>{
      const it=DG.it;
      if(pouzijNevim){ dgNevim(); return; }
      if(it.type==='mc'){ const letters=it.options.map(o=>o.charAt(0));
        const val=spravne?it.ans:(letters.find(l=>l!==it.ans)||letters[0]);
        const r=document.querySelector('input[name="dg-mc"][value="'+val+'"]'); if(r)r.checked=true; dgSubmit(); }
      else if(it.type==='yn'){ dgSubmitYN(spravne?it.ans:(it.ans==='A'?'N':'A')); }
      else { document.getElementById('dg-input').value=spravne?String(it.ans):'___WRONG___'; dgSubmit(); }
    },{spravne,pouzijNevim});
  }
  await page.waitForFunction(()=>document.getElementById('dg-end').style.display!=='none',{timeout:5000});

  ok(urovne.filter(x=>x.krok===0).every(x=>x.u==='test'),'první úloha tématu je vždy na úrovni testu');
  const druhe=urovne.filter(x=>x.krok===1);
  ok(druhe.every(x=>x.u===(VZOR[x.k%4][0]?'test':'zaklad')),'druhá úloha: po správné testová, po chybné ze základu ('+druhe.map(x=>x.u[0]).join('')+')');

  const d=await page.evaluate(()=>{ try{ return JSON.parse(localStorage.getItem('PZ_DIAG_LAST')); }catch(e){ return null; } });
  const cekane=Array.from({length:T},(_,k)=>UROVEN(VZOR[k%4]));
  ok(d && d.ver===2 && Array.isArray(d.topics) && d.topics.length===T,'uloženo v novém tvaru (ver 2, '+T+' témat)');
  ok(d && d.topics.every((t,k)=>t.level===cekane[k]),'úroveň po tématech sedí na vzor ('+(d&&d.topics.map(t=>t.level).join(''))+')');
  ok(d && d.topics.every(t=>t.correct===(t.level>=2)),'zpětně čitelné „correct" = úroveň ≥ 2');
  ok(d && d.n===2*T && d.ok===2*T-spatne,'počet správných úloh '+(2*T-spatne)+' / '+(2*T));

  const tecky=await page.evaluate(()=>[0,1,2,3].map(l=>document.querySelectorAll('#dg-map .dg-dot.l'+l).length));
  const cek=[0,1,2,3].map(l=>cekane.filter(x=>x===l).length);
  ok(tecky.join()===cek.join(),'mapa: úrovně 0–3 po '+tecky.join('/')+' (čekáno '+cek.join('/')+')');
  ok(await page.evaluate(()=>{ const r=[...document.querySelectorAll('#dg-map .dg-dot')].map(e=>+e.textContent); return r.every((v,i)=>i===0||r[i-1]<=v); }),'mapa: nejslabší nahoře');
  ok(await page.evaluate(()=>{ const row=[...document.querySelectorAll('#dg-map .dg-map-row')].find(r=>r.querySelector('.dg-dot.l3')); return row && !row.querySelector('a'); }),'zvládnuté téma nemá odkaz na procvičení');
  ok(await page.evaluate(()=>[...document.querySelectorAll('#dg-map .dg-map-row')].filter(r=>!r.querySelector('.dg-dot.l3')).every(r=>/procvicovani\.html\?okruh=/.test((r.querySelector('a[href*="procvicovani"]')||{}).getAttribute?.('href')||''))),'slabší témata prolinkují do procvičování');
  ok(await page.evaluate(()=>{ const rows=[...document.querySelectorAll('#dg-map .dg-map-row')].filter(r=>r.querySelector('.dg-dot.l0'));
      return rows.length>0 && rows.some(r=>/rpg-mat-\d\.html\?preview=1&learn=/.test((r.querySelector('a[href*="learn="]')||{getAttribute:()=>''}).getAttribute('href'))); }),'úroveň 0 nabízí i výklad');

  // plán: pořadí podle (3 − úroveň) × body okruhu v testu
  const plan=await page.evaluate(()=>{
    const body=PZ_TOPICS.bodyVTestu(), lv=JSON.parse(localStorage.getItem('PZ_DIAG_LAST')).topics;
    const cek=lv.filter(t=>t.level<3).sort((a,b)=>(3-b.level)*body[b.id]-(3-a.level)*body[a.id]).slice(0,3).map(t=>t.id);
    const je=[...document.querySelectorAll('#dg-reco-wrap .cm-next-row:not([href="konstrukce.html"])')].map(a=>decodeURIComponent(a.getAttribute('href').split('okruh=')[1]));
    const kn=document.querySelector('#dg-reco-wrap a.cm-next-row[href="konstrukce.html"]');
    return { cek, je, kn: kn ? kn.textContent : null };
  });
  ok(plan.je.length===3 && plan.je.join()===plan.cek.join(),'plán: 3 témata podle bodů, které lze získat ('+plan.je.join(', ')+')');
  // konstrukce (úlohy 9 a 10) diagnostika nezkouší — konec na ně odkáže zvlášť, s body v testu
  ok(/Konstrukce \(úlohy 9 a 10\)/.test(plan.kn||'') && /nesou 5 b\./.test(plan.kn||''),'konstrukce: odkaz na procvičování s body v testu ('+(plan.kn||'chybí').replace(/\s+/g,' ')+')');

  const rozbor=await page.evaluate(()=>({ n:document.querySelectorAll('#dg-rozbor .cm-review-item').length,
    nevim:[...document.querySelectorAll('#dg-rozbor .cm-review-given')].filter(e=>/nevím/.test(e.textContent)).length,
    kroky:document.querySelectorAll('#dg-rozbor .cm-review-steps').length }));
  ok(rozbor.n===spatne,'rozbor: každá chyba má položku ('+rozbor.n+' / '+spatne+')');
  ok(rozbor.nevim===nevim,'„Nevím" se v rozboru ukáže jako nevím ('+rozbor.nevim+')');
  ok(rozbor.kroky>0,'rozbor ukazuje postup ('+rozbor.kroky+' položek s kroky)');
  /* Obrázek v rozboru — jako rozbor testu nanečisto (dřív tu chyběl, takže si dítě
     chybu z geometrie prohlíželo bez obrázku, u kterého ji udělalo). Los obrázek mezi
     chybami mít nemusí, proto se první chybě navíc podstrčí skutečná geometrická
     úloha s obrázkem a konec se vykreslí znovu — jinak by kontrola mohla být prázdná. */
  const obr=await page.evaluate(()=>{
    const pocet=()=>document.querySelectorAll('#dg-rozbor .cm-review-svg svg').length;
    const cekano=DG.odp.filter(x=>!x.ok&&x.it&&x.it.svg).length, je=pocet();
    let it=null; for(let i=0;i<300&&!it;i++){ const u=PZ_TOPICS.item('geometrie','test'); if(u&&u.svg) it=u; }
    const x=DG.odp.find(o=>!o.ok&&!(o.it&&o.it.svg)); if(it&&x){ x.it=it; dgEnd(); }
    return { cekano, je, podstrceno:!!(it&&x), po:pocet(), cekanoPo:DG.odp.filter(o=>!o.ok&&o.it&&o.it.svg).length };
  });
  ok(obr.je===obr.cekano,'rozbor: obrázek u každé chybné úlohy, která ho měla ('+obr.je+' / '+obr.cekano+')');
  ok(obr.podstrceno&&obr.po===obr.cekanoPo&&obr.po>obr.je,'rozbor: podstrčená úloha s obrázkem ho v rozboru má ('+obr.po+' / '+obr.cekanoPo+')');
  ok(errs.length===0,'žádné JS chyby'+(errs.length?(' ['+errs[0]+']'):''));
  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
