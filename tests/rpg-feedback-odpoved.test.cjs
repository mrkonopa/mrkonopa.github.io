/* ═══════════════════════════════════════════════════════════════════════════
   Zpětná vazba v učitelské konzoli: odpověď žákovi PŘÍMO u jeho zprávy (Vojtův pokyn 9. 11. 2026:
   „ze zpětné vazby chci být schopen napsat žákovi přímo odpověď, než abych ho musel hledat“).

   Odpověď jde jako vzkaz do hry (tabulka `notes`, tentýž `RPGCloud.addNote` jako poznámky ve třídách), takže ji žák uvidí
   ve 📨 Vzkazech. Tabulka `feedback` nese `user_id`; seznam ho musí vybírat.

   Kontroluje se ve vykreslené konzoli (zmocněný cloud, učitelka přihlášená):
     1. tlačítko „✉ Odpovědět“ mají jen zprávy s účtem; zpráva bez účtu říká „nelze odpovědět“
     2. prázdná odpověď se neodešle; odešle se text, žákovi (`student_id` = `user_id` zprávy), s citací začátku zprávy
     3. dvojité kliknutí na Odeslat nevytvoří dva vzkazy
     4. po odeslání je u zprávy „odpověď odeslána“ a pole zmizí; při chybě zápisu zůstane rozepsaný text a ohlásí se chyba
     5. rozepsaná odpověď přežije smazání JINÉ zprávy (seznam se překreslí, indexy se posunou)
     6. jméno a text zprávy s HTML se nikdy neprovede
   Sabotáže: seznam bez `user_id`; odpověď na špatné id; bez citace; rozepsaný text se neukládá; bez ochrany dvojího odeslání.
   Spusť: node tests/rpg-feedback-odpoved.test.cjs
   ═══════════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const UCITELKA = 'kolegyne@husovaliberec.cz';
const DLOUHA = 'Mohli byste do hry přidat možnost vrátit poslední krok při špatné odpovědi, protože se mi to někdy splete?';
const ZPRAVY = [
  { id: 'f1', created_at: '2026-11-08T10:00:00Z', user_id: 'u-1', display_name: 'Žák Jedna', body: DLOUHA },
  { id: 'f2', created_at: '2026-11-08T11:00:00Z', user_id: 'u-2', display_name: '<b>Žák Dva</b>', body: 'Super hra <img src=x onerror="window.__xss=1">' },
  { id: 'f3', created_at: '2026-11-08T12:00:00Z', user_id: null, display_name: 'Smazaný účet', body: 'Stará zpráva' }
];

const mock = () => `(() => {
  const DB = { roles: [{ email: '${UCITELKA}', role: 'teacher' }], feedback: ${JSON.stringify(ZPRAVY)}, saves: [], classes: [], class_members: [], notes: [], snap_events: [] };
  window.__vlozeno = [];
  function dotaz(table) {
    let filters = [], single = false, op = 'select', radek = null, sloupce = null;
    const rows = () => { let r = (DB[table] || []).slice(); filters.forEach(([c, v]) => { r = r.filter(x => String(x[c]) === String(v)); }); return r; };
    const vyres = () => {
      if (op === 'insert') {
        if (window.__zapisSelze) return Promise.resolve({ data: null, error: { message: 'RLS zamítla zápis' } });
        window.__vlozeno.push({ table, row: radek }); return Promise.resolve({ data: null, error: null });
      }
      if (op === 'delete') { const ids = rows().map(x => x.id); DB[table] = (DB[table] || []).filter(x => !ids.includes(x.id)); return Promise.resolve({ data: null, error: null }); }
      const vyber = (r) => { if (!sloupce) return r; const o = {}; sloupce.forEach(c => { if (c in r) o[c] = r[c]; }); return o; };   /* jako PostgREST: jen vyžádané sloupce */
      return Promise.resolve({ data: single ? (rows()[0] ? vyber(rows()[0]) : null) : rows().map(vyber), error: null });
    };
    const b = { select(c) { sloupce = c ? String(c).split(',').map(x => x.trim()) : null; return b; }, upsert: () => b, update: () => b, order: () => b, limit: () => b, in: () => b,
      insert(r) { op = 'insert'; radek = r; return b; }, delete() { op = 'delete'; return b; },
      eq(c, v) { filters.push([c, v]); return b; }, maybeSingle() { single = true; return vyres(); }, then(r, j) { return vyres().then(r, j); } };
    return b;
  }
  window.supabase = { createClient: () => ({
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u-uc', email: '${UCITELKA}', user_metadata: { full_name: 'Kolegyně' } } } } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signInWithOAuth: async () => {}, signOut: async () => {} },
    from: t => dotaz(t),
    rpc: async (fn) => fn === 'staff_emails' ? { data: [{ email: '${UCITELKA}' }], error: null } : { data: [], error: null }
  }) };
})();`;

function server(prepis) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); }
    let telo = fs.readFileSync(fp), pr = null;
    for (const [k, f] of Object.entries(prepis || {})) if (k === path.basename(fp)) pr = f;
    if (pr) telo = Buffer.from(pr(telo.toString('utf8')));
    r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream' });
    r.end(telo);
  });
  return new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv)));
}

/* jeden průchod; vrací počet nálezů (kontroly se zapisují přes ok) */
async function scenar(browser, prepis, nazev) {
  const srv = await server(prepis);
  const ctx = await browser.newContext();
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const chyby = []; pg.on('pageerror', e => chyby.push(e.message)); pg.on('dialog', d => d.accept());
  const f0 = fail;
  const K = (c, m, d) => ok(c, nazev + ': ' + m, d);
  try {
    await pg.addInitScript(mock());
    await pg.goto('http://127.0.0.1:' + srv.address().port + '/projects/rpg-ucitel.html', { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => typeof RPGCloud !== 'undefined' && typeof loadFeedback === 'function', null, { timeout: 8000 });
    await pg.waitForFunction(() => RPGCloud.getRole && RPGCloud.getRole() === 'teacher', null, { timeout: 8000 });
    await pg.evaluate(() => document.querySelector('.tab[data-tab="feedback"]').click());
    await pg.waitForFunction(() => document.querySelectorAll('#feedback-wrap > div').length >= 3, null, { timeout: 8000 });

    const stav = () => pg.evaluate(() => {
      const radky = [...document.querySelectorAll('#feedback-wrap > div')].filter(d => d.querySelector('.mini.red'));
      return radky.map(d => ({
        text: d.textContent, tlacitko: [...d.querySelectorAll('.mini')].filter(b => /Odpovědět/.test(b.textContent)).length,
        nelze: /nelze odpovědět/.test(d.textContent), pole: d.querySelector('textarea') ? d.querySelector('textarea').value : null,
        odeslano: /odpověď odeslána/.test(d.textContent)
      }));
    });
    let r = await stav();
    K(r.length === 3, 'seznam má 3 zprávy', String(r.length));
    K(r[0].tlacitko === 1 && r[1].tlacitko === 1, 'zprávy s účtem mají tlačítko Odpovědět', JSON.stringify(r.map(x => x.tlacitko)));
    K(r[2].tlacitko === 0 && r[2].nelze, 'zpráva bez účtu nemá tlačítko a říká „nelze odpovědět“');
    K(r.every(x => x.pole === null), 'pole pro odpověď je na začátku zavřené');
    K(await pg.evaluate(() => !window.__xss), 'HTML ve zprávě ani ve jméně se neprovede');
    K(r[1].text.includes('<b>Žák Dva</b>') && r[1].text.includes('<img'), 'jméno a text zprávy s HTML se ukážou jako text');

    /* otevřít první zprávu, prázdnou odpověď neodeslat */
    await pg.evaluate(() => [...document.querySelectorAll('#feedback-wrap .mini')].find(b => /Odpovědět/.test(b.textContent)).click());
    await pg.waitForSelector('#fb-odp-0');
    K(await pg.evaluate(() => document.activeElement && document.activeElement.id === 'fb-odp-0'), 'pole pro odpověď dostane fokus');
    await pg.evaluate(() => [...document.querySelectorAll('#feedback-wrap .mini')].find(b => /Odeslat žákovi/.test(b.textContent)).click());
    K(await pg.evaluate(() => window.__vlozeno.length) === 0, 'prázdná odpověď se neodešle');
    K(/Napiš odpověď/.test(await pg.evaluate(() => document.getElementById('toast').textContent)), 'prázdná odpověď ohlásí „Napiš odpověď“');

    /* chyba zápisu: text zůstane, nic se neoznačí */
    await pg.evaluate(() => { window.__zapisSelze = true; });
    await pg.fill('#fb-odp-0', 'Díky, přidáme to.');
    await pg.evaluate(() => [...document.querySelectorAll('#feedback-wrap .mini')].find(b => /Odeslat žákovi/.test(b.textContent)).click());
    await pg.waitForFunction(() => /Chyba/.test(document.getElementById('toast').textContent), null, { timeout: 3000 }).catch(() => {});
    r = await stav();
    K(/Chyba: RLS zamítla zápis/.test(await pg.evaluate(() => document.getElementById('toast').textContent)), 'chyba zápisu se ohlásí učiteli');
    K(!r[0].odeslano && r[0].pole === 'Díky, přidáme to.', 'po chybě zůstane rozepsaný text a zpráva není označená', JSON.stringify(r[0].pole));
    await pg.evaluate(() => { window.__zapisSelze = false; });

    /* rozepsaná odpověď přežije smazání JINÉ zprávy (indexy se posunou) */
    await pg.evaluate(() => [...document.querySelectorAll('#feedback-wrap .mini.red')][2].click());   /* smaže f3 */
    await pg.waitForFunction(() => document.querySelectorAll('#feedback-wrap .mini.red').length === 2, null, { timeout: 3000 }).catch(() => {});
    r = await stav();
    K(r.length === 2 && r[0].pole === 'Díky, přidáme to.', 'rozepsaná odpověď přežije smazání jiné zprávy', JSON.stringify(r.map(x => x.pole)));

    /* odeslání, dvojité kliknutí */
    await pg.evaluate(() => { const b = [...document.querySelectorAll('#feedback-wrap .mini')].find(x => /Odeslat žákovi/.test(x.textContent)); b.click(); b.click(); });
    await pg.waitForFunction(() => window.__vlozeno.length >= 1, null, { timeout: 3000 }).catch(() => {});
    await pg.waitForTimeout(300);
    const vl = await pg.evaluate(() => window.__vlozeno);
    K(vl.length === 1, 'dvojité kliknutí vytvoří jediný vzkaz', String(vl.length));
    const v = vl[0] && vl[0].row || {};
    K(vl[0] && vl[0].table === 'notes' && v.student_id === 'u-1', 'vzkaz jde žákovi zprávy (student_id = user_id)', JSON.stringify(v.student_id));
    K(typeof v.body === 'string' && v.body.includes('„' + DLOUHA.slice(0, 60) + '…“') && v.body.endsWith('Díky, přidáme to.'),
      'vzkaz nese citaci začátku zprávy a text odpovědi', JSON.stringify(v.body));
    r = await stav();
    K(r[0].odeslano && r[0].pole === null, 'u odeslané zprávy je „odpověď odeslána“ a pole je zavřené');
    K(!r[1].odeslano, 'druhá zpráva označená není');
    K(chyby.length === 0, 'žádná chyba stránky', chyby.join(' | '));
  } catch (e) { ok(false, nazev + ': scénář spadl', String(e && e.message || e).split('\n')[0]); }
  finally { await ctx.close(); srv.close(); }
  return fail - f0;
}

(async () => {
  const browser = await chromium.launch();
  const skutecny = await scenar(browser, null, 'skutečné');
  const f1 = fail;

  const sab = (soubor, a, b, nazev) => ({ [soubor]: (s) => { if (s.split(a).length !== 2) throw new Error('sabotáž nemá jediný cíl: ' + nazev); return s.replace(a, b); }, nazev });
  const SABOTAZE = [
    sab('rpg-cloud.js', "'id,created_at,user_id,display_name,body'", "'id,created_at,display_name,body'", 'seznam bez user_id'),
    sab('rpg-ucitel.html', "RPGCloud.addNote(r.user_id,'Odpověď", "RPGCloud.addNote(r.id,'Odpověď", 'odpověď na špatné id'),
    sab('rpg-ucitel.html', "'Odpověď na tvou zpětnou vazbu „'+fbCitace(r)+'“: '+txt", 'txt', 'bez citace'),
    sab('rpg-ucitel.html', 'if(r)fbStav.koncept[r.id]=v;', 'if(r){}', 'rozepsaný text se neukládá'),
    sab('rpg-ucitel.html', 'if(!r||!r.user_id||fbStav.odesila)return;', 'if(!r||!r.user_id)return;', 'bez ochrany dvojího odeslání')
  ];
  let chycene = 0;
  for (const s of SABOTAZE) {
    if (process.env.SAB_POUZE && !s.nazev.includes(process.env.SAB_POUZE)) continue;   /* vývoj: jedna sabotáž */
    const nazev = s.nazev; const prepis = {}; for (const k of Object.keys(s)) if (k !== 'nazev') prepis[k] = s[k];
    let nalez = 0;
    try { nalez = await scenar(browser, prepis, 'sabotáž „' + nazev + '“'); } catch (e) { nalez = 1; }
    if (nalez > 0) chycene++;
    fail -= nalez;                    /* nálezy sabotovaného běhu nejsou vada produktu */
    ok(nalez > 0, 'sabotáž „' + nazev + '“ je chycena', 'nalezeno ' + nalez);
  }
  await browser.close();
  void f1;
  console.log((fail ? '❌ ' : '✅ ') + 'rpg-feedback-odpoved: ' + pass + ' ok, ' + fail + ' chyb (sabotáží chyceno ' + chycene + ' z ' + SABOTAZE.length + ')');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
