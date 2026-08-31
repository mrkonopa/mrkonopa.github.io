/* ══════════════════════════════════════════════════════════════════
   „Skrýt učitele" musí fungovat i BĚŽNÉMU UČITELI (ne jen superadminovi).

   Hlášeno z praxe: nově přidané učitelce se v přehledu ukazovaly učitelské
   účty, přestože zaškrtávátko „Skrýt učitele" bylo zaškrtnuté. Konzole si
   seznam tahala z `listRoles()`, který běžné učitelce vrací prázdno (klientská
   pojistka „jen superadmin" + RLS `roles_select` z fáze 2). Filtr pak neměl
   co skrývat a nikde to nevyskočilo — chyba spadla do catch.

   Test jde přes UI: vyrenderuje přehled jako UČITELKA a porovná, koho tabulka
   ukazuje se zaškrtnutým a odškrtnutým filtrem. Kontroluje se OBOJÍ, aby
   neprošlo „skrývá pořád všechny" ani „neskrývá nic".

   Součástí je REPRODUKCE původního stavu: když se `staffEmails` z RPGCloud
   odebere (tedy chování před fází 26), učitelské řádky se v přehledu objeví.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 18844;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

const UCITELKA = 'kolegyne@husovaliberec.cz';
const SPRAVCE = 'spravce@husovaliberec.cz';
const ZAK = 'zak1@husovaliberec.cz';

const mock = (opts) => `(() => {
  const ROLES = ${JSON.stringify(opts.roles)};
  const SAVES = ${JSON.stringify(opts.saves)};
  const SESSION = ${JSON.stringify(opts.session)};
  const STAFF_RPC = ${opts.rpcWorks ? 'true' : 'false'};
  function tableQuery(table){
    const db = { roles: ROLES, saves: SAVES, classes: [], class_members: [], notes: [], snap_events: [] };
    let filters=[], single=false;
    const rows=()=>{ let r=(db[table]||[]).slice(); filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));}); return r; };
    const resolve=()=>Promise.resolve({data: single?(rows()[0]||null):rows(), error:null});
    const b={ select:()=>b, insert:()=>b, upsert:()=>b, update:()=>b, delete:()=>b,
      eq(c,v){filters.push([c,v]);return b;}, order:()=>b, limit:()=>b, in:()=>b,
      maybeSingle(){single=true;return resolve();}, then(r,j){return resolve().then(r,j);} };
    return b;
  }
  window.supabase = { createClient: () => ({
    auth:{ getSession: async()=>({data:{session:SESSION}}),
           onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
           signInWithOAuth: async()=>{}, signOut: async()=>{} },
    from: t => tableQuery(t),
    rpc: async (fn) => {
      if (fn === 'staff_emails') {
        if (!STAFF_RPC) return { data: null, error: { message: 'forbidden' } };
        return { data: ROLES.map(r => ({ email: r.email })), error: null };
      }
      return { data: [], error: null };
    }
  }) };
})();`;

(async () => {
  const mime = { html:'text/html', js:'application/javascript', css:'text/css', json:'application/json' };
  const srv = http.createServer((req,res)=>{
    let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
    try{ const fp=path.normalize(path.join(ROOT,p));
      if(!fp.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
      res.writeHead(200,{'Content-Type':mime[p.split('.').pop()]||'application/octet-stream'});
      res.end(fs.readFileSync(fp)); } catch { res.writeHead(404); res.end(); }
  }).listen(PORT);
  const br = await chromium.launch({ headless:true, executablePath: fs.existsSync(CHROMIUM)?CHROMIUM:undefined });

  const SAVES = [
    { user_id:'u-zak', game:'RPG_MAT_9', email:ZAK, full_name:'Žák Jedna', updated_at:new Date().toISOString(),
      data:{ name:'NEO', xp:300, level:4, attrs:{calc:5,geo:3,anal:4,craft:2}, done:{} } },
    { user_id:'u-uc', game:'RPG_MAT_9', email:UCITELKA, full_name:'Kolegyně', updated_at:new Date().toISOString(),
      data:{ name:'TESTPOSTAVA', xp:10, level:1, attrs:{calc:1,geo:1,anal:1,craft:1}, done:{} } },
    { user_id:'u-sp', game:'RPG_MAT_8', email:SPRAVCE, full_name:'Správce', updated_at:new Date().toISOString(),
      data:{ name:'ADMIN', xp:20, level:1, attrs:{calc:1,geo:1,anal:1,craft:1}, done:{} } }
  ];
  const ROLES = [{ email:UCITELKA, role:'teacher' }, { email:SPRAVCE, role:'superadmin' }];

  async function otevri({ rpcWorks }) {
    const ctx = await br.newContext();
    await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1:'+PORT) ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(mock({ roles:ROLES, saves:SAVES, rpcWorks,
      session:{ user:{ id:'u-uc', email:UCITELKA, user_metadata:{ full_name:'Kolegyně' } } } }));
    await pg.goto(`http://127.0.0.1:${PORT}/projects/rpg-ucitel.html`, { waitUntil:'domcontentloaded' });
    await pg.waitForFunction(() => typeof RPGCloud !== 'undefined' && typeof renderTable === 'function', { timeout:8000 });
    await pg.waitForFunction(() => typeof ROWS !== 'undefined' && ROWS.length > 0, { timeout:8000 }).catch(()=>{});
    return { ctx, pg, errs };
  }

  const jmenaVTabulce = pg => pg.evaluate(() => {
    renderTable();
    return [...document.querySelectorAll('#tbl-wrap .tbl tr')]
      .map(tr => tr.textContent).join(' | ');
  });
  const prepni = (pg, on) => pg.evaluate(v => {
    const c = document.getElementById('hide-staff'); c.checked = v; renderTable();
    return [...document.querySelectorAll('#tbl-wrap .tbl tr')].map(tr => tr.textContent).join(' | ');
  }, on);

  /* ── 1) Oprava: učitelka, RPC funguje ── */
  {
    const { ctx, pg, errs } = await otevri({ rpcWorks:true });
    const role = await pg.evaluate(() => RPGCloud.getRole());
    ok('scénář: přihlášená je UČITELKA (ne superadmin)', role === 'teacher', String(role));
    const staff = await pg.evaluate(() => [...STAFF_EMAILS]);
    ok('učitelka dostane seznam personálu', staff.length === 2, JSON.stringify(staff));

    const skryto = await prepni(pg, true);
    ok('se zaškrtnutým filtrem NEJSOU vidět učitelské postavy',
       !skryto.includes(UCITELKA) && !skryto.includes(SPRAVCE), skryto.slice(0,160));
    ok('žák je přitom pořád vidět', skryto.includes(ZAK), skryto.slice(0,160));

    const vse = await prepni(pg, false);
    ok('po odškrtnutí se učitelské postavy objeví',
       vse.includes(UCITELKA) && vse.includes(SPRAVCE), vse.slice(0,160));
    ok('žádné JS chyby', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  /* ── 2) REPRODUKCE stavu před fází 26 ──
     Původní zdroj dat byl `listRoles()`. Měří se přímo on: běžné učitelce
     vrátí prázdno (klientská pojistka „jen superadmin"; naživo by ji stejně
     zastavila RLS `roles_select`). Z prázdného seznamu pak filtr nemá co
     skrýt — druhá kontrola to ukazuje na skutečném vykreslení. */
  {
    const { ctx, pg } = await otevri({ rpcWorks:true });
    const stary = await pg.evaluate(async () => (await RPGCloud.listRoles()).length);
    ok('REPRODUKCE: listRoles() vrací učitelce PRÁZDNO', stary === 0, 'vrátil ' + stary);
    const skryto = await pg.evaluate(() => {
      STAFF_EMAILS = new Set();                    // stav, do kterého to konzoli dostalo
      document.getElementById('hide-staff').checked = true; renderTable();
      return [...document.querySelectorAll('#tbl-wrap .tbl tr')].map(t => t.textContent).join(' | ');
    });
    ok('REPRODUKCE: s prázdným seznamem filtr NIC neskryje',
       skryto.includes(UCITELKA) && skryto.includes(SPRAVCE), skryto.slice(0,160));
    await ctx.close();
  }

  /* ── 3) Když RPC selže (fáze 26 ještě nespuštěná), konzole nesmí spadnout ── */
  {
    const { ctx, pg, errs } = await otevri({ rpcWorks:false });
    const skryto = await prepni(pg, true);
    ok('při chybě RPC se konzole vykreslí dál (jen neskryje)', skryto.includes(ZAK), skryto.slice(0,120));
    ok('a nespadne', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  await br.close(); srv.close();
  console.log(`\n  Filtr „Skrýt učitele": ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
