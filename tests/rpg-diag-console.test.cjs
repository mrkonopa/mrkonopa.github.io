/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 3 (diagnostika): heatmapa chybovosti v učitelské konzoli.
   Mock saves nesou data.errs + data.done → ověří agregaci a render.
   Spusť: node tests/rpg-diag-console.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18479;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function ok(name, cond, d='') { if (cond){console.log('  ✅ '+name);pass++;} else {console.log('  ❌ '+name+(d?' — '+d:''));fail++;} }

function mockScript(scenario) {
  return `(function(){
    const S = ${JSON.stringify(scenario)};
    const db = { roles:S.roles||[], saves:S.saves||[], classes:S.classes||[], class_members:S.class_members||[], notes:[] };
    function mkClient(){
      function q(table){
        let op='select', filters=[], single=false, payload=null;
        function rows(){ let r=(db[table]||[]).slice(); filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));}); return r; }
        function resolve(){
          if(op==='select'){ const r=rows(); return Promise.resolve({data: single?(r[0]||null):r, error:null}); }
          return Promise.resolve({data:null,error:null});
        }
        const b={
          select(){ if(op!=='insert')op='select'; return b; },
          insert(p){op='insert';payload=p;return b;},
          upsert(p){op='upsert';payload=p;return b;},
          update(p){op='update';payload=p;return b;},
          delete(){op='delete';return b;},
          eq(c,v){filters.push([c,v]);return b;},
          order(){return b;},
          maybeSingle(){single=true;return resolve();},
          single(){single=true;return resolve();},
          then(res,rej){return resolve().then(res,rej);}
        };
        return b;
      }
      return { auth:{ getSession:async()=>({data:{session:S.session||null}}), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}), signInWithOAuth:async()=>{}, signOut:async()=>{} }, from:q, rpc:async()=>({data:[],error:null}) };
    }
    window.supabase = { createClient:()=>mkClient() };
  })();`;
}

function startServer() {
  const mime={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',json:'application/json'};
  const srv=http.createServer((req,res)=>{ let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    const fp=path.normalize(path.join(ROOT,p));
    if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('forbidden');return;}
    try{const buf=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});res.end(buf);}
    catch{res.writeHead(404);res.end('nf');} });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}

// mise 1-1 splněná celá (6/6)
const fullDone = mid => { const o={}; for(let i=0;i<6;i++)o[mid+'-'+i]=1; return o; };

async function run() {
  console.log('\n── Diagnostika: heatmapa chybovosti ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:CHROMIUM });
  const errors = [];
  try {
    const admin='vojtech.konopa@husovaliberec.cz';
    const scenario = {
      roles: [{ email: admin, role:'superadmin' }],
      session: { user:{ id:'u-admin', email:admin, user_metadata:{full_name:'Vojta'} } },
      saves: [
        { user_id:'z1', game:'RPG_MAT_9', name:'Neo', email:'z1@husovaliberec.cz', full_name:'Žák 1', updated_at:new Date().toISOString(),
          data:{ name:'Neo', xp:300, level:4, done:fullDone('1-1'), errs:{ '1-1':4, '5-2':6 },
            errsSnap:[{t:'2026-05-01',errs:{'1-1':1}},{t:'2026-05-08',errs:{'1-1':3}},{t:'2026-05-15',errs:{'1-1':4}}] } },
        { user_id:'z2', game:'RPG_MAT_9', name:'Trinity', email:'z2@husovaliberec.cz', full_name:'Žák 2', updated_at:new Date().toISOString(),
          data:{ name:'Trinity', xp:120, level:2, done:{ '1-1-0':1, '1-1-1':1, '3-1-0':1 }, errs:{ '1-1':2, '3-1':15 } } },  // 15 chyb v 3-1, ale jeden úkol splnila → NENÍ zaseknutá
        // zaseknutý: 12 chyb v misi 3-3 a ani jeden splněný úkol v ní; jméno nese pokus o vložení značky
        { user_id:'z4', game:'RPG_MAT_9', name:'Zasekly', email:'z4@husovaliberec.cz', full_name:'Žák 4 "><b id=pwn>x</b>', updated_at:new Date().toISOString(),
          data:{ name:'Zasekly', xp:20, level:1, done:{}, errs:{ '3-3':12, '3-2':9 } } },
        // postava UČITELE: 20 chyb v misi 4-1 bez splněného úkolu — do žákovské diagnostiky nepatří
        { user_id:'u-admin', game:'RPG_MAT_9', name:'Testovací', email:admin, full_name:'Vojta', updated_at:new Date().toISOString(),
          data:{ name:'Testovací', xp:5, level:1, done:{}, errs:{ '4-1':20 } } },
      ],
      classes: [{ id:'c1', name:'9.A', section:'A', cohort_start_year:2021, created_by:'u-admin' }],
      class_members: [{ class_id:'c1', user_id:'z1' }],  // jen Neo je v 9.A
    };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    page.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource|ERR_/i.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(mockScript(scenario));
    await page.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil:'load' });
    await page.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'), null, {timeout:8000});
    // počkej na načtení ROWS
    await page.waitForFunction(()=>typeof ROWS!=='undefined' && Array.isArray(ROWS) && ROWS.length>=2, null, {timeout:6000}).catch(()=>{});

    // přepni na DIAGNOSTIKA
    await page.click('.tab[data-tab="diag"]');
    await page.waitForFunction(()=>!document.getElementById('t-diag').classList.contains('hidden'),null,{timeout:4000});
    ok('záložka Diagnostika se otevře', true);

    const opts = await page.evaluate(()=>document.getElementById('diag-game').options.length);
    ok('výběr ročníku je naplněn (7 her: 1.+2. stupeň)', opts===7, 'options='+opts);

    // vyber 9. ročník
    await page.evaluate(()=>{ const s=document.getElementById('diag-game'); s.value='RPG_MAT_9'; renderDiag(); });
    await page.waitForFunction(()=>/Bootovací sekvence/.test(document.getElementById('diag-wrap').textContent),null,{timeout:4000});
    const txt = await page.evaluate(()=>document.getElementById('diag-wrap').textContent);

    ok('heatmapa ukazuje názvy misí', /Bootovací sekvence/.test(txt));
    /* Průměr se píše českou desetinnou ČÁRKOU. Test dřív čekal „3.0"
       s tečkou, čímž zakonzervoval nesprávný zápis — konzole je jediné
       místo v projektu, kde tečka přežila. Kontroluje se i to, že se
       tečka nevrátí. */
    ok('mise 1-1: 1/2 dokončilo, ⌀ 3,0 chyb', /1\/2 dokončilo · ⌀ 3,0 chyb/.test(txt), txt.slice(0,200));
    ok('mise 5-2: vysoká chybovost ⌀ 6,0', /⌀ 6,0 chyb/.test(txt));
    ok('žádný průměr se nepíše s desetinnou tečkou', !/⌀ \d+\.\d/.test(txt),
       (txt.match(/⌀ \d+\.\d[^·]*/) || [''])[0]);
    ok('mise bez dat má text „zatím nikdo nezkoušel"', /zatím nikdo nezkoušel/.test(txt));
    ok('vykresleno všech 7 oblastí', (txt.match(/Oblast \d/g)||[]).length===7);

    // trend z errsSnap: 1-1 má snímky [1,3,4] → recent +1, prev +2 → zlepšení 🔽
    ok('trend mise 1-1: nově +1 (minule +2)', /nově \+1 chyb \(minule \+2\)/.test(txt), txt.match(/nově[^<]{0,40}/)?.[0]||'(nic)');
    const hasDown = await page.evaluate(()=>/🔽/.test(document.getElementById('diag-wrap').innerHTML));
    ok('trend zlepšení má zelenou šipku 🔽', hasDown);

    // heat barva: zkoušené mise dostanou hsl pozadí (zelená→červená dle chyb)
    const heatCells = await page.evaluate(()=>document.querySelectorAll('#diag-wrap div[style*="hsl"]').length);
    ok('mise s daty mají heat-barvu (hsl pozadí)', heatCells>=2, 'hsl buněk='+heatCells);

    /* ── Zaseknutí žáci a učitelské účty (14. 11. 2026) ──────────────────
       Zaseknutý = aspoň 10 chyb a žádný splněný úkol v misi. Průměr „chyb na žáka“ takové žáky
       sice počítá, ale učitel z něj nepozná, KDO se zasekl; navíc postava učitele zkreslovala
       průměry (testovací účet). Jména jsou jen v bublině (title), ne v souhrnu na plátně. */
    const bunka = id => page.evaluate(i=>{ const b=[...document.querySelectorAll('#diag-wrap div')].find(e=>e.children.length===0&&e.textContent.trim().indexOf(i+' ·')===0);
      return b ? { text:b.parentElement.textContent, stuck:(b.parentElement.querySelector('[title]')||{}).title||'' } : null; }, id);
    const c33 = await bunka('3-3');
    ok('zaseknutý žák: buňka mise 3-3 ukáže „zaseklo se 1“', !!c33 && /🧱 zaseklo se 1/.test(c33.text), c33&&c33.text);
    ok('jméno zaseknutého je v bublině (title)', !!c33 && /Žák 4/.test(c33.stuck), c33&&c33.stuck);
    const c32 = await bunka('3-2');
    ok('9 chyb (pod prahem 10) ještě není zaseknutí', !!c32 && !/zaseklo se/.test(c32.text), c32&&c32.text);
    const c31 = await bunka('3-1');
    ok('15 chyb, ale splněný úkol v misi → není zaseknutí (3-1)', !!c31 && /⌀ 15,0 chyb/.test(c31.text) && !/zaseklo se/.test(c31.text), c31&&c31.text);
    const c11 = await bunka('1-1');
    ok('mise, kde žák splnil úkol, není zaseknutí (1-1)', !!c11 && !/zaseklo se/.test(c11.text), c11&&c11.text);
    const sum = await page.evaluate(()=>{ const t=document.getElementById('diag-wrap').innerText; const i=t.indexOf('ZASEKLI SE'); return i<0?'':t.slice(i,i+400); });
    ok('souhrn „Zasekli se“ je nad tabulkou a jmenuje misi', /ZASEKLI SE/.test(sum) && /Zatím|3-3/.test(sum) && /1 žák/.test(sum), sum.replace(/\s+/g,' ').slice(0,200));
    ok('souhrn nenese jméno žáka (tabulka se promítá)', !/Žák 4/.test(sum));
    ok('jméno se značkou se nevykoná (žádný #pwn)', await page.evaluate(()=>!document.getElementById('pwn')));
    // postava učitele: dokud konzole nezná jeho e-mail, počítá se; po načtení seznamu učitelů mizí
    const pred = await bunka('4-1');
    ok('(před) postava učitele se bez seznamu učitelů počítá: ⌀ 20,0 chyb', !!pred && /⌀ 20,0 chyb/.test(pred.text), pred&&pred.text);
    await page.evaluate(a=>{ STAFF_EMAILS.add(a.toLowerCase()); renderDiag(); }, admin);
    const po = await bunka('4-1');
    ok('postava učitele se do diagnostiky nepočítá (4-1: nikdo nezkoušel)', !!po && /zatím nikdo nezkoušel/.test(po.text) && !/zaseklo se/.test(po.text), po&&po.text);
    await page.evaluate(a=>{ STAFF_EMAILS.delete(a.toLowerCase()); renderDiag(); }, admin);

    // filtr třídy: 9.A obsahuje jen Neo (errs 1-1:4) → ⌀ 4,0, 1/1 dokončilo
    const classOpts = await page.evaluate(()=>document.getElementById('diag-class')?document.getElementById('diag-class').options.length:0);
    ok('filtr tříd je naplněn (Všechny + 9.A)', classOpts===2, 'options='+classOpts);
    await page.evaluate(()=>{ const c=document.getElementById('diag-class'); c.value='c1'; renderDiag(); });
    const txtC = await page.evaluate(()=>document.getElementById('diag-wrap').textContent);
    ok('po filtru 9.A: mise 1-1 jen Neo → 1/1 ⌀ 4,0', /1\/1 dokončilo · ⌀ 4,0 chyb/.test(txtC), txtC.slice(0,200));
    // zpět na všechny třídy
    await page.evaluate(()=>{ const c=document.getElementById('diag-class'); c.value=''; renderDiag(); });

    /* ── Podvržený save nesmí rozbít heatmapu ──────────────────────────
       `errs` píše ŽÁK, takže si tam může dát cokoli. Bez čištění se
       `totErr += e` změnilo na zřetězení a učiteli svítilo „⌀ NaN chyb";
       horší než text je barva — `hue` se počítá z průměru a `NaN|0` je 0,
       tedy sytě červená, takže jeden žák udělal z libovolné mise
       „největší problém třídy". Je to týž vzor jako slepý ::int cast
       v SQL (fáze 19/24), jen na klientovi. */
    {
      const podvrh = JSON.parse(JSON.stringify(scenario));
      podvrh.saves[1].data.errs = { '1-1': 'pwn', '5-2': { x: 1 } };
      podvrh.saves.push({ user_id:'z3', game:'RPG_MAT_9', name:'Morpheus', email:'z3@husovaliberec.cz',
        full_name:'Žák 3', updated_at:new Date().toISOString(),
        data:{ name:'Morpheus', xp:10, level:1, done:{ '1-1-0':1 }, errs:{ '1-1': 1e308 } } });
      const c2 = await browser.newContext();
      const p2 = await c2.newPage();
      await p2.addInitScript(mockScript(podvrh));
      await p2.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil:'domcontentloaded' });
      await p2.waitForFunction(()=>!document.getElementById('console').classList.contains('hidden'), null, {timeout:8000});
      await p2.click('[data-tab="diag"]');
      await p2.waitForTimeout(700);
      const t2 = await p2.evaluate(()=>{ const s=document.getElementById('diag-game'); if(s){s.value='RPG_MAT_9';}
                                          try{renderDiag();}catch(e){return 'VÝJIMKA: '+e.message;}
                                          return document.getElementById('diag-wrap').innerText; });
      ok('podvržené errs nedají NaN', !/NaN/.test(t2), (t2.match(/[^\n]*NaN[^\n]*/)||[''])[0].slice(0,80));
      ok('podvržené errs nedají [object]', !/\[object/.test(t2));
      ok('obří číslo se ořízne (žádná exponenciála)', !/e\+\d/.test(t2), (t2.match(/[^\n]*e\+\d[^\n]*/)||[''])[0].slice(0,60));
      await c2.close();
    }

    ok('žádné JS chyby na stránce', errors.length===0, errors.slice(0,3).join(' | '));
    await ctx.close();
  } catch(e) {
    ok('běh bez výjimky', false, e.message);
  } finally {
    await browser.close(); srv.close();
  }
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
}
run();
