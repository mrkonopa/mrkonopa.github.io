/* ══════════════════════════════════════════════════════════════════
   Nápověda v učitelské konzoli — kontextový „?" panel + úvod pro nového.

   Hlídá to, co se snadno rozejde:
     · panel se otevře na sekci podle ZÁLOŽKY, ve které uživatel je
       (jinak by z „kontextové" nápovědy byl jen dlouhý text),
     · úvod se novému učiteli spustí sám, ale POUZE JEDNOU,
     · sekce popisují skutečné záložky konzole — když někdo přidá
       záložku a zapomene na nápovědu, test to řekne,
     · „?" se neukazuje na přihlašovací bráně (visel by nad prázdnem),
     · text nápovědy zmiňuje věci, kde se ročníky liší (Věž jen 6.–9.).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 18846;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

const UCITELKA = 'kolegyne@husovaliberec.cz';
const mock = (session) => `(() => {
  const ROLES = [{email:'${UCITELKA}',role:'teacher'}];
  const SAVES = [{user_id:'u-zak',game:'RPG_MAT_9',email:'zak@husovaliberec.cz',full_name:'Žák',
    updated_at:new Date().toISOString(),data:{name:'NEO',xp:10,level:1,attrs:{calc:1,geo:1,anal:1,craft:1},done:{}}}];
  const db={roles:ROLES,saves:SAVES,classes:[],class_members:[],notes:[],snap_events:[],assignments:[]};
  function tq(t){ let filters=[],single=false;
    const rows=()=>{let r=(db[t]||[]).slice();filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));});return r;};
    const res=()=>Promise.resolve({data:single?(rows()[0]||null):rows(),error:null});
    const b={select:()=>b,insert:()=>b,upsert:()=>b,update:()=>b,delete:()=>b,eq(c,v){filters.push([c,v]);return b;},
      order:()=>b,limit:()=>b,in:()=>b,maybeSingle(){single=true;return res();},then(r,j){return res().then(r,j);}};
    return b; }
  window.supabase={createClient:()=>({
    auth:{getSession:async()=>({data:{session:${session}}}),
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
      signInWithOAuth:async()=>{},signOut:async()=>{}},
    from:t=>tq(t),
    rpc:async(fn)=>fn==='staff_emails'?{data:ROLES.map(r=>({email:r.email})),error:null}:{data:[],error:null}
  })};
})();`;
const SESSION = `{user:{id:'u-uc',email:'${UCITELKA}',user_metadata:{full_name:'Kolegyně'}}}`;

(async () => {
  const mime={html:'text/html',js:'application/javascript',css:'text/css',json:'application/json'};
  const srv=http.createServer((req,res)=>{
    let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    try{const fp=path.normalize(path.join(ROOT,p));
      if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
      res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});
      res.end(fs.readFileSync(fp));}catch{res.writeHead(404);res.end();}
  }).listen(PORT);
  const br=await chromium.launch({headless:true,executablePath:fs.existsSync(CHROMIUM)?CHROMIUM:undefined});

  async function otevri(session=SESSION){
    const ctx=await br.newContext();
    await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:'+PORT)?r.continue():r.abort());
    const pg=await ctx.newPage();
    const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
    await pg.addInitScript(mock(session));
    await pg.goto(`http://127.0.0.1:${PORT}/projects/rpg-ucitel.html`,{waitUntil:'domcontentloaded'});
    await pg.waitForFunction(()=>typeof RPGCloud!=='undefined'&&typeof otevriNapovedu==='function',{timeout:8000});
    return {ctx,pg,errs};
  }

  /* ── 1) Nový učitel: úvod se spustí sám ── */
  {
    const {ctx,pg,errs}=await otevri();
    await pg.waitForFunction(()=>!document.getElementById('intro-wrap').hidden,{timeout:8000}).catch(()=>{});
    ok('novému učiteli se úvod spustí sám',
       await pg.evaluate(()=>!document.getElementById('intro-wrap').hidden));
    const kroku=await pg.evaluate(()=>UVOD.length);
    ok('úvod má krátký, projitelný počet kroků (3–5)', kroku>=3&&kroku<=5, String(kroku));

    /* Úvod NESMÍ blokovat práci s konzolí. První verze byla modální překryv
       přes celou obrazovku a zarazila klik na záložku — shodilo to
       `rpg-prijimacky-topics` na CI a stejně by to zamklo i učitele, který
       se chce jen rozhlédnout. Klika se přes skutečný `click()`, protože
       zachycení ukazatele se z DOM nepozná. */
    let klikProsel = true;
    try { await pg.click('[data-tab="classes"]', { timeout: 3000 }); }
    catch (e) { klikProsel = false; }
    ok('úvod NEBLOKUJE klikání v konzoli (není modální překryv)', klikProsel);
    ok('a při tom je pořád vidět', await pg.evaluate(()=>!document.getElementById('intro-wrap').hidden));
    await pg.click('[data-tab="overview"]');

    // projít celý úvod tlačítkem „Dál"
    for(let i=0;i<kroku;i++) await pg.click('#in-dal');
    ok('po projití se úvod zavře', await pg.evaluate(()=>document.getElementById('intro-wrap').hidden));
    ok('a zapamatuje si to', await pg.evaluate(()=>localStorage.getItem('RPG_UCITEL_UVOD_HOTOVO')==='1'));
    ok('žádné JS chyby', errs.length===0, errs.join(' | '));
    await ctx.close();
  }

  /* ── 2) Podruhé už úvod NEotravuje ── */
  {
    const {ctx,pg}=await otevri();
    await pg.evaluate(()=>{localStorage.setItem('RPG_UCITEL_UVOD_HOTOVO','1');});
    await pg.reload({waitUntil:'domcontentloaded'});
    await pg.waitForFunction(()=>!document.getElementById('help-btn').hidden,{timeout:8000});
    await pg.waitForTimeout(300);
    ok('podruhé se úvod NEspustí', await pg.evaluate(()=>document.getElementById('intro-wrap').hidden));
    ok('ale „?" je k dispozici', await pg.evaluate(()=>!document.getElementById('help-btn').hidden));

    /* ── 3) Kontext: panel se otevře na sekci podle záložky ── */
    for (const tab of ['diag','tower','classes']) {
      const zvyraznene = await pg.evaluate(async (t) => {
        document.querySelector('.tab[data-tab="'+t+'"]').click();
        document.getElementById('help-btn').click();
        const z = document.querySelector('#help-body .hp-sec.zvyrazneno');
        return z ? z.id : null;
      }, tab);
      ok('záložka „'+tab+'" otevře nápovědu na své sekci', zvyraznene==='hp-'+tab, String(zvyraznene));
      await pg.evaluate(()=>zavriNapovedu());
    }

    /* ── 4) „?" chip u konkrétního prvku míří na správnou sekci ── */
    const chip = await pg.evaluate(() => {
      document.querySelector('.tab[data-tab="overview"]').click();
      const b=[...document.querySelectorAll('.help-chip')].find(x=>/otevriNapovedu\('overview'\)/.test(x.getAttribute('onclick')||''));
      if(!b) return 'chip nenalezen';
      b.click();
      const z=document.querySelector('#help-body .hp-sec.zvyrazneno');
      return z?z.id:null;
    });
    ok('chip u „Skrýt učitele" otevře sekci přehledu', chip==='hp-overview', String(chip));
    ok('Esc nápovědu zavře', await pg.evaluate(async()=>{
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      return document.getElementById('help-panel').hidden;
    }));

    /* ── 5) Pokrytí: každá záložka má sekci ── */
    const chybi = await pg.evaluate(() => {
      const taby=[...document.querySelectorAll('.tab')].map(t=>t.dataset.tab);
      const sekce=new Set(NAPOVEDA.map(s=>s.id));
      return taby.filter(t=>!sekce.has(t));
    });
    ok('každá záložka konzole má svou sekci nápovědy', chibiPrazdne(chybi), JSON.stringify(chybi));

    /* ── 6) Obsah zmiňuje rozdíly mezi stupni ── */
    const text = await pg.evaluate(() => { otevriNapovedu('tower'); return document.getElementById('help-body').textContent; });
    ok('nápověda říká, že Věž legend je jen pro 2. stupeň', /Věž[^.]*jen 2\. stupeň|1\. stupeň Věž nemá/i.test(text));
    ok('a zmiňuje prázdninové zavření', /prázdnin/i.test(text));
    ok('vysvětluje rozdíl učitel vs. superadmin', /superadmin/i.test(text));
    await ctx.close();
  }

  /* ── 7) Na přihlašovací bráně „?" není ── */
  {
    const {ctx,pg}=await otevri('null');
    await pg.waitForTimeout(600);
    ok('nepřihlášenému se „?" nezobrazuje', await pg.evaluate(()=>document.getElementById('help-btn').hidden));
    await ctx.close();
  }

  await br.close(); srv.close();
  console.log(`\n  Nápověda konzole: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail?1:0);
})();
function chibiPrazdne(a){ return Array.isArray(a) && a.length===0; }
