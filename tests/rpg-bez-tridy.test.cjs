/* ══════════════════════════════════════════════════════════════════
   Upozornění „N žáků není v žádné třídě" v učitelské konzoli.

   PROČ: nezařazený žák přijde o Věž legend (tower_eligible → _grades_of
   bere ročník z členství ve třídě) i o žebříček (leaderboard chce
   spolužáka ze stejné třídy). Naměřeno 10. 9. 2026 v ostré databázi:
   13 žáků bez třídy, z toho 11 aktivních za 14 dní — a konzole o tom
   mlčela.

   Dvě pasti, které tenhle test hlídá jmenovitě:
     1) VAROVÁNÍ SE NESMÍ POČÍTAT Z FILTRU. Kdyby renderNoClass() bralo
        filtered(), stačilo by v přehledu přepnout na třídu a varování
        by zmizelo, přestože ti žáci pořád existují.
     2) 1. STUPEŇ NENÍ NÁLEZ. Kohorty začínají 6. ročníkem, takže
        „třeťák bez třídy" je normální stav. Pravidlo, které křičí
        vlka, je horší než žádné.

   Spusť: node tests/rpg-bez-tridy.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18488;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function ok(name, cond, d = '') {
  if (cond) { console.log('  ✅ ' + name); pass++; }
  else { console.log('  ❌ ' + name + (d ? ' — ' + d : '')); fail++; }
}

const ADMIN = 'vojtech.konopa@husovaliberec.cz';

function mockScript(scenario) {
  return `(function(){
    const S = ${JSON.stringify(scenario)};
    const db = { roles:S.roles||[], saves:S.saves||[], classes:[], class_members:[], notes:[] };
    let _id=1;
    function mkClient(){
      function q(table){
        let op='select', filters=[], single=false, payload=null;
        function rows(){ let r=(db[table]||[]).slice(); filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));}); return r; }
        function doInsert(){ const arr=Array.isArray(payload)?payload:[payload]; const out=[]; arr.forEach(p=>{ const row=Object.assign({},p); if(table==='classes'&&!row.id)row.id='cls-'+(_id++); db[table].push(row); out.push(row); }); return out; }
        function doUpsert(){ const arr=Array.isArray(payload)?payload:[payload]; arr.forEach(p=>{ if(table==='class_members'){ const ex=db.class_members.find(m=>m.class_id===p.class_id&&m.user_id===p.user_id); if(!ex)db.class_members.push(Object.assign({},p)); } else { db[table].push(Object.assign({},p)); } }); return []; }
        function resolve(){
          if(op==='select'){ const r=rows(); return Promise.resolve({data: single?(r[0]||null):r, error:null}); }
          if(op==='insert'){ const o=doInsert(); return Promise.resolve({data: single?(o[0]||null):o, error:null}); }
          if(op==='upsert'){ doUpsert(); return Promise.resolve({data:null, error:null}); }
          if(op==='update'){ rows().forEach(x=>Object.assign(x,payload)); return Promise.resolve({data:null,error:null}); }
          if(op==='delete'){ db[table]=(db[table]||[]).filter(x=>!filters.every(([c,v])=>String(x[c])===String(v))); return Promise.resolve({data:null,error:null}); }
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
      return {
        auth:{ getSession:async()=>({data:{session:S.session||null}}), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}), signInWithOAuth:async()=>{}, signOut:async()=>{} },
        from:q,
        rpc:async()=>({data:null,error:null})
      };
    }
    window.supabase = { createClient:()=>mkClient() };
  })();`;
}

function startServer() {
  const mime = { html:'text/html', js:'application/javascript', css:'text/css', svg:'image/svg+xml', json:'application/json' };
  const srv = http.createServer((req, res) => {
    let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
    const fp = path.normalize(path.join(ROOT, p));
    if (!fp.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end('forbidden'); return; }
    try { const buf = fs.readFileSync(fp); res.writeHead(200, { 'Content-Type': mime[p.split('.').pop()] || 'application/octet-stream' }); res.end(buf); }
    catch { res.writeHead(404); res.end('nf'); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

const now = () => new Date().toISOString();
const zak = (uid, game, jmeno, mail) => ({
  user_id: uid, game, data: { name: jmeno, xp: 120, level: 2, done: {} },
  name: jmeno, email: mail, full_name: jmeno, updated_at: now()
});

async function otevri(browser, scenario, errors) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_/i.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(mockScript(scenario));
  await page.goto(`${BASE}/projects/rpg-ucitel.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => !document.getElementById('console').classList.contains('hidden'), { timeout: 8000 });
  /* POZOR: ROWS je `let` na úrovni skriptu, takže NENÍ na window —
     `window.ROWS` je vždy undefined a čekání by vypršelo nad zdravou
     stránkou. Ptát se musíš holým jménem. */
  await page.waitForFunction(() => typeof ROWS !== 'undefined' && ROWS.length > 0, { timeout: 8000 });
  return { ctx, page };
}

const bannerText = page => page.evaluate(() => {
  const el = document.getElementById('nocls');
  return el.classList.contains('hidden') ? null : el.textContent;
});

async function run() {
  console.log('\n── Upozornění „žák bez třídy" v konzoli ──\n');
  const srv = await startServer();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  const errors = [];
  let ctx1, ctx2, ctx3;
  try {
    /* ── Scénář A: dva druhostupňoví bez třídy + jeden třeťák ───────── */
    const scA = {
      roles: [{ email: ADMIN, role: 'superadmin' }],
      session: { user: { id: 'u-admin', email: ADMIN, user_metadata: { full_name: 'Vojta' } } },
      saves: [
        zak('z1', 'RPG_MAT_6', 'Anna Nováková', 'anna@husovaliberec.cz'),
        zak('z2', 'RPG_MAT_9', 'Bedřich Malý', 'bedrich@husovaliberec.cz'),
        zak('z3', 'RPG_MAT_3', 'Cilka Třeťačka', 'cilka@husovaliberec.cz'),
      ],
    };
    const a = await otevri(browser, scA, errors); ctx1 = a.ctx;
    const page = a.page;

    let txt = await bannerText(page);
    ok('panel se ukáže, když někdo není v žádné třídě', !!txt);
    ok('hlásí naměřený počet se správným tvarem („2 žáci nejsou")',
      !!txt && /2 žáci nejsou v žádné třídě/.test(txt), JSON.stringify((txt || '').slice(0, 60)));
    ok('jmenuje oba nezařazené žáky',
      !!txt && txt.includes('Anna Nováková') && txt.includes('Bedřich Malý'));
    ok('řekne, o co žák přichází (věž a žebříček)',
      !!txt && /Věž legend/.test(txt) && /žebříček/.test(txt));

    /* 1. stupeň NENÍ nález — jen tichá poznámka pod seznamem */
    ok('třeťák se nepočítá mezi nálezy', !!txt && !txt.includes('Cilka Třeťačka'));
    ok('…ale je zmíněný jako známý stav', !!txt && /1\. stupeň se do tříd nezařazuje/.test(txt));
    ok('a je jich uveden naměřený počet', !!txt && /takových je tu 1\./.test(txt));

    /* bez jediné třídy panel poradí, co udělat dřív */
    ok('bez založené třídy pošle do záložky TŘÍDY',
      !!txt && /nejdřív založ třídu/i.test(txt));
    ok('a nenabízí prázdný výběr tříd',
      (await page.evaluate(() => document.querySelectorAll('#nocls select').length)) === 0);

    /* ── Založ třídu a zařaď JEDNOHO ─────────────────────────────────── */
    await page.click('.tab[data-tab="classes"]');
    await page.waitForFunction(() => !document.getElementById('t-classes').classList.contains('hidden'), { timeout: 4000 });
    await page.fill('#new-class', '6.A');
    await page.click('button[onclick="createClassUI()"]');
    await page.waitForFunction(() => CLASSES.length === 1, { timeout: 4000 });
    await page.click('.tab[data-tab="overview"]');
    await page.waitForFunction(() => !document.getElementById('t-overview').classList.contains('hidden'), { timeout: 4000 });

    const selCount = await page.evaluate(() => document.querySelectorAll('#nocls select').length);
    ok('po založení třídy má každý nezařazený žák výběr třídy', selCount === 2, 'selectů=' + selCount);

    /* Šířka 380 px. Konzole je za přihlášením, takže se do plošného
       sweepu layout-overflow.test.cjs nedostane — tady je jediné místo,
       kde se ten panel na mobilu vůbec změří. Mřížka má minmax(300px,…),
       což je na 380px okno těsné. */
    await page.setViewportSize({ width: 380, height: 800 });
    await page.evaluate(() => renderTable());
    const uzke = await page.evaluate(() => {
      const el = document.getElementById('nocls');
      const doc = document.documentElement;
      const prvky = [...el.querySelectorAll('*')].map(n => n.getBoundingClientRect().right);
      return { panel: el.getBoundingClientRect().right, nej: Math.max(...prvky), okno: doc.clientWidth,
               scroll: doc.scrollWidth };
    });
    ok('panel se na 380 px vejde do okna', uzke.nej <= uzke.okno + 1,
      'nejpravější prvek ' + Math.round(uzke.nej) + ' px, okno ' + uzke.okno);
    ok('a nerozšíří stránku do vodorovného rolování', uzke.scroll <= uzke.okno + 1,
      'scrollWidth ' + uzke.scroll + ' proti ' + uzke.okno);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => renderTable());

    /* přiřazení přímo z panelu */
    await page.evaluate(() => {
      const s = document.querySelector('#nocls select');
      s.value = s.options[1].value;
      s.dispatchEvent(new Event('change'));
    });
    await page.waitForFunction(() => MEMBERSHIPS.length === 1, { timeout: 4000 });
    ok('výběr třídy v panelu žáka opravdu zařadí', true);

    txt = await bannerText(page);
    ok('zařazený žák z panelu zmizí', !!txt && !txt.includes('Anna Nováková'));
    ok('a počet klesne na jednoho („1 žák není")',
      !!txt && /1 žák není v žádné třídě/.test(txt), JSON.stringify((txt || '').slice(0, 60)));

    /* ── PAST Č. 1: filtr třídy nesmí varování umlčet ────────────────── */
    await page.evaluate(() => {
      const s = document.getElementById('fclass');
      s.value = s.options[1].value;
      renderTable();
    });
    txt = await bannerText(page);
    ok('varování přežije zapnutý filtr třídy', !!txt && txt.includes('Bedřich Malý'),
      'panel po filtru: ' + JSON.stringify((txt || '').slice(0, 60)));

    /* ani filtr, který nevrátí ani jednu postavu */
    await page.evaluate(() => { document.getElementById('search').value = 'xxxxnenajdenixxxx'; renderTable(); });
    txt = await bannerText(page);
    ok('varování přežije i filtr, který nic nenajde', !!txt && txt.includes('Bedřich Malý'));
    await page.evaluate(() => { document.getElementById('search').value = ''; const s = document.getElementById('fclass'); s.value = ''; renderTable(); });

    /* ── Když jsou zařazení všichni, panel zmizí ─────────────────────── */
    await page.evaluate(() => {
      const s = document.querySelector('#nocls select');
      s.value = s.options[1].value;
      s.dispatchEvent(new Event('change'));
    });
    await page.waitForFunction(() => MEMBERSHIPS.length === 2, { timeout: 4000 });
    txt = await bannerText(page);
    ok('po zařazení všech se panel schová', txt === null, 'zbylo: ' + JSON.stringify((txt || '').slice(0, 60)));

    /* ── Scénář B: pět žáků → tvar „5 žáků není" ─────────────────────── */
    const scB = {
      roles: [{ email: ADMIN, role: 'superadmin' }],
      session: { user: { id: 'u-admin', email: ADMIN, user_metadata: { full_name: 'Vojta' } } },
      saves: [1, 2, 3, 4, 5].map(i => zak('p' + i, 'RPG_MAT_7', 'Žák ' + i, 'p' + i + '@husovaliberec.cz')),
    };
    const b = await otevri(browser, scB, errors); ctx2 = b.ctx;
    const txtB = await bannerText(b.page);
    ok('pět žáků dá tvar „5 žáků není"', !!txtB && /5 žáků není v žádné třídě/.test(txtB),
      JSON.stringify((txtB || '').slice(0, 60)));
    ok('u pěti se neobjeví poznámka o 1. stupni', !!txtB && !/1\. stupeň/.test(txtB));

    /* ── Scénář C: jen 1. stupeň ⇒ ŽÁDNÉ varování ────────────────────── */
    const scC = {
      roles: [{ email: ADMIN, role: 'superadmin' }],
      session: { user: { id: 'u-admin', email: ADMIN, user_metadata: { full_name: 'Vojta' } } },
      saves: [
        zak('m1', 'RPG_MAT_3', 'Třeťák', 'm1@husovaliberec.cz'),
        zak('m2', 'RPG_MAT_5', 'Páťačka', 'm2@husovaliberec.cz'),
        /* jméno se škodlivým HTML i apostrofem — konzole je nepřátelské
           prostředí, save si píše žák sám */
        zak('m3', 'RPG_MAT_8', `<img src=x onerror="window.__XSS=1">O'Brien`, 'm3@husovaliberec.cz'),
      ],
    };
    const c = await otevri(browser, scC, errors); ctx3 = c.ctx;
    const txtC = await bannerText(c.page);
    ok('sami prvostupňoví žáci varování nespustí', !!txtC && /1 žák není v žádné třídě/.test(txtC),
      JSON.stringify((txtC || '').slice(0, 70)));
    ok('a jsou vedení jen jako poznámka (2)', !!txtC && /takových je tu 2\./.test(txtC));

    /* XSS: jméno se musí vypsat jako TEXT, ne provést */
    const xss = await c.page.evaluate(() => !!window.__XSS);
    ok('škodlivé jméno ze savu se nespustí', xss === false);
    ok('…a vypíše se jako text', !!txtC && txtC.includes("O'Brien"));
    const imgs = await c.page.evaluate(() => document.querySelectorAll('#nocls img').length);
    ok('…a nevznikne z něj prvek', imgs === 0, 'img=' + imgs);

    ok('žádné chyby JavaScriptu', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    ok('test doběhl bez výjimky', false, e.stack ? e.stack.split('\n').slice(0,2).join(' // ') : e.message);
  } finally {
    for (const c of [ctx1, ctx2, ctx3]) { if (c) await c.close().catch(() => {}); }
    await browser.close();
    srv.close();
  }
  console.log(`\n${pass} ✅  ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
}
run();
