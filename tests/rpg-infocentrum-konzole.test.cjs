/* ══════════════════════════════════════════════════════════════════════
   Infocentrum hodiny v učitelské konzoli (`rpg-ucitel.html`, záložka INFOCENTRUM) — Playwright, autor Vojtěch Konopa.

   Napodobenina cloudu drží tabulky v paměti (`window.__db`), test mezi načteními mění postavy žáků a ZAVOLÁ obnovu přímo
   (`icTik`), takže se nečeká na 6s časovač.

   Ověřuje se:
     1. načítání: jen členové vybrané třídy a jen vybraná hra, bez počtů chyb (`errs`) i v dotazu; další obnova bere jen změněné řádky
     2. karty: zkrácená jména („Anna N.“), jméno hrdiny jako záloha, žádné HTML ze jména žáka (XSS), žádná slova o chybách na plátně
     3. řazení: kdo v hodině splnil víc úkolů a misí, je nahoře; karta ukazuje přírůstek (+6 úkolů · 1 mise)
     4. události: splněná mise = obyčejný řádek, dokončená oblast = zlatý řádek a mírný efekt na kartě (třída boss)
     5. cíl hodiny: po splnění stupně další stupeň a animace přes obrazovku (STUPEŇ 2; pod „omezit pohyb“ bez konfet)
     6. týmy: z živého souboje v týmovém režimu skóre a jména obou týmů, bez týmového režimu panel zmizí
     7. celá obrazovka a telefon: nic nepřetéká do šířky (1920 × 1080 v režimu projektoru, 390 px)
     8. chyba načtení: stavový štítek zčervená, karty zůstanou; „Nová hodina“ vynuluje přírůstky; po obnovení stránky se hodina a stupeň zachovají
     9. odchod ze záložky zastaví časovač (konzole nesmí v pozadí dál dotazovat server)
   Sabotáže (7): řazení podle abecedy, chyby v dotazu, jména přes innerHTML, obnova bez „jen změněné“, časovač neběží do konce,
   cíl bez animace, týmy bez ohledu na režim.
   Spusť: node tests/rpg-infocentrum-konzole.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const PODLAHA = 47;                                               // naměřeno
const LAUNCH = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const sy = (() => { const d = new Date(); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; })();
const ted = () => new Date().toISOString(), davno = () => new Date(Date.now() - 3600e3).toISOString();
const done = (...m) => { const o = {}; for (const [mid, n] of m) for (let i = 0; i < n; i++) o[mid + '-' + i] = true; return o; };
const zak = (id, full, hero, data, updated) => ({ user_id: id, game: 'RPG_MAT_8', name: hero, email: id + '@husovaliberec.cz', full_name: full, updated_at: updated, data: Object.assign({ name: hero, xp: 100, level: 3, done: {}, ach: {}, errs: { '1-1': 9 } }, data) });
const SCENAR = {
  roles: [{ email: 'ucitel@husovaliberec.cz', role: 'teacher' }],
  session: { user: { id: 'u-uc', email: 'ucitel@husovaliberec.cz', user_metadata: { full_name: 'Učitel' } } },
  classes: [{ id: 'c1', name: 'Osmá B', section: 'B', cohort_start_year: sy - 2, archived: false }],
  members: ['z1', 'z2', 'z3', 'z4', 'z5', 'z6'].map(u => ({ class_id: 'c1', user_id: u })),
  saves: [
    zak('z1', 'Anna Nováková', 'Neo', { level: 5, done: done(['1-1', 6], ['1-2', 3]), ach: { boot: 1 } }, ted()),
    zak('z2', 'Adam Hrubý', 'Trinity', { level: 4, done: done(['1-1', 2]) }, ted()),
    zak('z3', 'Barbora Lesná', 'Morpheus', {}, davno()),
    zak('z4', 'Čeněk Dvořák', 'Cypher', {}, davno()),
    zak('z5', 'Dana Pokorná', 'Switch', {}, davno()),
    zak('z6', null, '<img src=x onerror=window.__xss=1>', {}, davno()),
    zak('z7', 'Cizí Žák', 'Mimo', { done: done(['1-1', 6]) }, ted()),          // není ve třídě — nesmí se vůbec číst
  ],
};

function mock(S) {
  return `(function(){
    const S=${JSON.stringify(S)};
    const db={roles:S.roles,saves:S.saves,classes:S.classes,class_members:S.members,log:[],selze:false,bitvy:[],stavBitvy:null};
    window.__db=db;
    function q(table){
      const f=[];let sel='';
      const res=()=>{
        db.log.push({table,sel,f:JSON.parse(JSON.stringify(f))});
        let r=(db[table]||[]).slice();
        for(const [op,c,v] of f){
          if(op==='eq')r=r.filter(x=>String(x[c])===String(v));
          else if(op==='in')r=r.filter(x=>v.map(String).includes(String(x[c])));
          else if(op==='gt')r=r.filter(x=>String(x[c])>String(v));
        }
        if(table==='saves'&&/xp:data->xp/.test(sel)){
          if(db.selze)return Promise.resolve({data:null,error:{message:'boom'}});
          r=r.map(x=>({user_id:x.user_id,game:x.game,name:x.name,full_name:x.full_name,updated_at:x.updated_at,xp:x.data.xp,level:x.data.level,done:x.data.done,ach:x.data.ach,hero:x.data.name}));
        }
        return Promise.resolve({data:r,error:null});
      };
      const b={select(c){sel=c||'';return b;},eq(c,v){f.push(['eq',c,v]);return b;},in(c,v){f.push(['in',c,v]);return b;},gt(c,v){f.push(['gt',c,v]);return b;},
        order(){return b;},is(){return b;},neq(){return b;},limit(){return b;},insert(){return b;},upsert(){return b;},update(){return b;},delete(){return b;},
        maybeSingle(){return res().then(x=>({data:(x.data||[])[0]||null,error:x.error}));},single(){return res().then(x=>({data:(x.data||[])[0]||null,error:x.error}));},
        then(a,c){return res().then(a,c);}};
      return b;
    }
    const rpc=async(name)=>{
      if(name==='list_active_battles')return {data:db.bitvy,error:null};
      if(name==='battle_state')return {data:db.stavBitvy,error:null};
      return {data:[],error:null};
    };
    window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:S.session}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth:async()=>{},signOut:async()=>{}},from:q,rpc})};
  })();`;
}

function server(prepis) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); }
    let telo = fs.readFileSync(fp), pr = null;
    for (const [k, f] of Object.entries(prepis || {})) if (k === path.basename(fp)) pr = f;
    if (pr) telo = Buffer.from(pr(telo.toString('utf8')));
    r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream', 'cache-control': 'no-store' });
    r.end(telo);
  });
  return new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv)));
}
const baseOf = s => 'http://127.0.0.1:' + s.address().port;

async function otevri(br, base, volby) {
  const ctx = await br.newContext(Object.assign({ viewport: { width: 1920, height: 1080 } }, volby || {}));
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await ctx.addInitScript(mock(SCENAR));
  const p = await ctx.newPage(), chyby = [];
  p.on('pageerror', e => chyby.push(e.message));
  await p.goto(base + '/projects/rpg-ucitel.html');
  await p.waitForFunction(() => !document.getElementById('console').classList.contains('hidden'), null, { timeout: 15000 });
  await p.click('.tab[data-tab="infocentrum"]');
  await p.waitForFunction(() => document.querySelectorAll('#ic-cards .ic-card').length === 6, null, { timeout: 10000 });
  await p.evaluate(() => infoStop());                                 // obnovu řídí test, ne časovač
  return { ctx, p, chyby };
}
const tik = async p => { await p.waitForFunction(() => !IC.bezi, null, { timeout: 8000 }); await p.evaluate(() => icTik(false)); };
const zmen = (p, uid, fn) => p.evaluate(([u, k]) => { const s = __db.saves.find(x => x.user_id === u); new Function('s', k)(s); s.updated_at = new Date().toISOString(); }, [uid, fn]);
const klice = (mid, n) => Array.from({ length: n }, (_, i) => `s.data.done['${mid}-${i}']=true;`).join('');

const ODDILY = {
  /* 1 + 2 — načítání a karty */
  async data(p, f) {
    const log = await p.evaluate(() => __db.log.filter(l => l.table === 'saves' && /xp:data->xp/.test(l.sel)));
    f(log.length >= 1, 'infocentrum si vyžádalo postavy přes lehký dotaz', String(log.length));
    const l0 = log[0] || { f: [], sel: '' };
    const ids = (l0.f.find(x => x[0] === 'in') || [0, 0, []])[2];
    f(ids.slice().sort().join() === 'z1,z2,z3,z4,z5,z6', 'čtou se jen členové třídy (ne žák mimo třídu)', ids.join());
    f(JSON.stringify(l0.f.find(x => x[0] === 'eq')) === '["eq","game","RPG_MAT_8"]', 'čte se jen vybraná hra (8. ročník podle kohorty třídy)', JSON.stringify(l0.f));
    f(!/errs|chyb/i.test(l0.sel), 'dotaz nežádá počty chyb', l0.sel);
    f(!l0.f.some(x => x[0] === 'gt'), 'první načtení bere všechno');
    await zmen(p, 'z2', klice('1-1', 6)); await tik(p);
    const l1 = await p.evaluate(() => __db.log.filter(l => l.table === 'saves' && /xp:data->xp/.test(l.sel)).pop());
    f(l1.f.some(x => x[0] === 'gt' && x[1] === 'updated_at'), 'další obnova bere jen změněné řádky (updated_at >)', JSON.stringify(l1.f));
    const jm = await p.evaluate(() => [...document.querySelectorAll('#ic-cards .ic-nm')].map(e => e.textContent).sort());
    f(jm.includes('Anna N.') && jm.includes('Čeněk D.') && jm.includes('Adam H.'), 'jména na kartách jsou zkrácená („Anna N.“)', jm.join('|'));
    f(!jm.some(x => /Nováková|Hrubý|Dvořák/.test(x)), 'celé příjmení se na plátně neukazuje');
    const main = await p.evaluate(() => document.querySelector('#ic-root .ic-main').textContent);
    f(!/chyb|errs/i.test(main), 'na plátně nejsou slova o chybách');
  },
  async xss(p, f) {
    const v = await p.evaluate(() => ({ img: document.querySelectorAll('#ic-cards img, #ic-feed img').length, x: window.__xss, text: [...document.querySelectorAll('#ic-cards .ic-nm')].map(e => e.textContent).join('|') }));
    f(v.img === 0 && v.x === undefined, 'jméno hrdiny s HTML se nevykoná ani nevykreslí', JSON.stringify(v));
    f(v.text.includes('<img '), 'jméno s HTML je vidět jako text', v.text);
  },
  /* 3 — řazení */
  async poradi(p, f) {
    await zmen(p, 'z4', klice('1-1', 6)); await zmen(p, 'z5', klice('1-1', 2)); await tik(p);
    const por = await p.evaluate(() => IC.poradi.join());
    f(por.startsWith('z4,z5,'), 'nahoře je ten, kdo v hodině splnil nejvíc úkolů (6, pak 2)', por);
    f(por === 'z4,z5,z6,z2,z1,z3,z4'.replace(',z4', '').replace('z4,z5,z6,z2,z1,z3', 'z4,z5,z6,z2,z1,z3') || por === 'z4,z5,z6,z2,z1,z3', 'zbylí s nulou jdou abecedně česky („<img O.“, Adam, Anna, Barbora)', por);
    const t = await p.evaluate(() => document.querySelector('#ic-cards [data-k="z4"] .ic-gain b').textContent.replace(/ /g, ' '));
    f(/\+6 úkolů · 1 mise/.test(t), 'karta ukazuje přírůstek „+6 úkolů · 1 mise“', t);
    const prvni = await p.evaluate(() => document.querySelector('#ic-cards [data-k="z4"]').style.order);
    f(prvni === '0', 'karta prvního má pořadí 0 (CSS order)', prvni);
  },
  /* 4 — události */
  async oblast(p, f) {
    await zmen(p, 'z3', klice('1-1', 6) + klice('1-2', 6) + klice('1-3', 6)); await tik(p);
    const v = await p.evaluate(() => ({ ev: [...document.querySelectorAll('#ic-feed .ic-ev')].map(e => e.className + '|' + e.textContent.replace(/ /g, ' ')), boss: document.querySelector('#ic-cards [data-k="z3"]').classList.contains('boss') }));
    f(v.ev.some(x => /^ic-ev oblast\|.*Barbora L\. — dokončena oblast 1!/.test(x)), 'dokončená oblast = zlatý řádek v přehledu', v.ev.join(' ; '));
    f(!v.ev.some(x => /Barbora L\. — mise/.test(x)), 'dokončená oblast nahradí události jejích misí');
    f(v.boss, 'karta má při dokončené oblasti mírný zlatý efekt (třída boss)');
    await zmen(p, 'z5', klice('2-1', 6)); await tik(p);
    const m = await p.evaluate(() => [...document.querySelectorAll('#ic-feed .ic-ev')].map(e => e.textContent.replace(/ /g, ' ')));
    f(m.some(x => /Dana P\. — mise 2-1 .*splněna/.test(x)), 'splněná mise je obyčejný řádek s názvem mise', m.join(' ; '));
    f(!m.some(x => /(dokonči|splni|získa)l/i.test(x)), 'věty bez slovesa v minulém čase (rod ze jména neznáme)');
  },
  /* 5 — cíl */
  async cil(p, f) {
    await zmen(p, 'z1', klice('2-1', 6) + klice('2-2', 6) + klice('2-3', 6) + klice('3-1', 6) + klice('3-2', 6)); await tik(p);
    const v = await p.evaluate(() => ({ on: document.getElementById('ic-lv').classList.contains('on'), h: document.getElementById('ic-lvh').textContent, st: IC.cil.stupen, px: document.querySelectorAll('#ic-lv .ic-px').length }));
    f(v.on && v.h === 'STUPEŇ 2' && v.st === 2, 'po splnění cíle se přehraje animace „STUPEŇ 2“', JSON.stringify(v));
    f(v.px > 0, 'animace má konfety (bez omezení pohybu)', String(v.px));
  },
  async cilBezPohybu(p, f) {
    await zmen(p, 'z1', klice('2-1', 6) + klice('2-2', 6) + klice('2-3', 6) + klice('3-1', 6) + klice('3-2', 6)); await tik(p);
    const v = await p.evaluate(() => ({ on: document.getElementById('ic-lv').classList.contains('on'), px: document.querySelectorAll('#ic-lv .ic-px').length }));
    f(v.on && v.px === 0, 'pod „omezit pohyb“ je animace bez konfet', JSON.stringify(v));
  },
  /* 6 — týmy */
  async tymy(p, f) {
    await p.evaluate(() => { __db.bitvy = [{ id: 'b1', game: 'RPG_MAT_8', status: 'running' }]; __db.stavBitvy = { battle: { team_mode: true }, teams: { 0: 5120, 1: 4380 }, players: [{ team: 0, display_name: 'Anna Nováková' }, { team: 1, display_name: 'Adam Hrubý' }, { team: null, display_name: 'Host' }] }; });
    await p.evaluate(() => icTymy());
    const v = await p.evaluate(() => ({ hid: document.getElementById('ic-tymy').hidden, a: document.getElementById('ic-t1').textContent, b: document.getElementById('ic-t2').textContent, n1: document.getElementById('ic-tn1').textContent, n2: document.getElementById('ic-tn2').textContent }));
    f(!v.hid && v.a === '5120' && v.b === '4380' && v.n1 === 'Anna N.' && v.n2 === 'Adam H.', 'týmy: skóre a jména (host bez týmu nikam nepatří)', JSON.stringify(v));
    await p.evaluate(() => { __db.stavBitvy = { battle: { team_mode: false }, teams: null, players: [] }; });
    await p.evaluate(() => icTymy());
    f(await p.evaluate(() => document.getElementById('ic-tymy').hidden), 'bez týmového režimu panel týmů zmizí');
  },
  /* 7 — rozvržení */
  async rozvrzeni(p, f) {
    await p.click('#ic-full');
    await p.waitForFunction(() => document.getElementById('ic-root').classList.contains('ic-proj'), null, { timeout: 4000 }).catch(() => {});
    const v = await p.evaluate(() => ({ proj: document.getElementById('ic-root').classList.contains('ic-proj'), sw: document.documentElement.scrollWidth, iw: innerWidth, ovl: getComputedStyle(document.getElementById('ic-ovl')).display, r: document.getElementById('ic-root').scrollWidth - document.getElementById('ic-root').clientWidth }));
    f(v.proj && v.ovl === 'none', 'režim projektoru schová ovládání', JSON.stringify(v));
    f(v.sw <= v.iw && v.r <= 1, 'celá obrazovka 1920 × 1080 nepřetéká do šířky', JSON.stringify(v));
    await p.evaluate(() => { if (document.fullscreenElement) return document.exitFullscreen(); document.getElementById('ic-root').classList.remove('ic-proj'); });
    await p.waitForFunction(() => !document.getElementById('ic-root').classList.contains('ic-proj'), null, { timeout: 4000 }).catch(() => {});
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);
    const t = await p.evaluate(() => { const r = document.getElementById('ic-root').getBoundingClientRect(); const pre = [...document.querySelectorAll('#t-infocentrum .ic-card, #t-infocentrum .ic-panel')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length; return { pre, right: Math.round(r.right), iw: innerWidth }; });
    f(t.pre === 0, 'na telefonu 390 px nic z infocentra nepřesahuje okno', JSON.stringify(t));
    await p.setViewportSize({ width: 1920, height: 1080 });
  },
  /* 8 — chyba, nová hodina, obnova stránky */
  async chyba(p, f) {
    await p.evaluate(() => { __db.selze = true; });
    await tik(p);
    const v = await p.evaluate(() => ({ zle: document.getElementById('ic-stav').classList.contains('zle'), karet: document.querySelectorAll('#ic-cards .ic-card').length }));
    f(v.zle && v.karet === 6, 'při chybě načtení štítek zčervená a karty zůstanou', JSON.stringify(v));
    await p.evaluate(() => { __db.selze = false; });
    await tik(p);
    f(!(await p.evaluate(() => document.getElementById('ic-stav').classList.contains('zle'))), 'po obnovení spojení štítek zase zezelená');
  },
  async nova(p, f) {
    await zmen(p, 'z4', klice('1-1', 6)); await tik(p);
    f((await p.evaluate(() => document.querySelector('#ic-cards [data-k="z4"] .ic-gain b').textContent)).startsWith('+'), 'před novou hodinou má žák přírůstek');
    await p.click('#ic-nova');
    const v = await p.evaluate(() => ({ b: document.querySelector('#ic-cards [data-k="z4"] .ic-gain b').textContent, feed: document.querySelectorAll('#ic-feed .ic-ev').length, gv: document.getElementById('ic-gv').textContent }));
    f(v.b === '—' && v.feed === 0 && v.gv === '0', '„Nová hodina“ vynuluje přírůstky, události i cíl', JSON.stringify(v));
  },
  async obnova(p, f) {
    await zmen(p, 'z1', klice('2-1', 6) + klice('2-2', 6) + klice('2-3', 6) + klice('3-1', 6) + klice('3-2', 6)); await tik(p);
    const pred = await p.evaluate(() => ({ start: IC.start, st: IC.cil.stupen }));
    await p.reload();
    await p.waitForFunction(() => !document.getElementById('console').classList.contains('hidden'), null, { timeout: 15000 });
    await p.click('.tab[data-tab="infocentrum"]');
    await p.waitForFunction(() => document.querySelectorAll('#ic-cards .ic-card').length === 6, null, { timeout: 10000 });
    await p.evaluate(() => infoStop());
    const po = await p.evaluate(() => ({ start: IC.start, st: IC.cil.stupen }));
    f(po.start === pred.start && po.st === pred.st && pred.st === 2, 'po obnovení stránky se zachová začátek hodiny i stupeň', JSON.stringify([pred, po]));
  },
  /* 9 — časovač */
  async stop(p, f) {
    await p.evaluate(() => icZacni());
    f(await p.evaluate(() => IC.timer !== null), 'časovač po otevření záložky běží');
    await p.click('.tab[data-tab="overview"]');
    f(await p.evaluate(() => IC.timer === null), 'po odchodu ze záložky se časovač zastaví');
  },
};

async function spust(br, base, oddily) {
  const nalezy = [], f = (c, m, d) => { if (!c) nalezy.push(m + (d ? ' — ' + d : '')); };
  let kontrol = 0;
  const f2 = (c, m, d) => { kontrol++; f(c, m, d); };
  for (const jm of oddily) {
    const { ctx, p, chyby } = await otevri(br, base, jm === 'cilBezPohybu' ? { reducedMotion: 'reduce' } : null);
    await ODDILY[jm](p, f2);
    f2(chyby.length === 0, jm + ': bez výjimek na stránce', chyby[0]);
    await ctx.close();
  }
  return { nalezy, kontrol };
}

async function hlavni() {
  const br = await chromium.launch(LAUNCH);
  const srv = await server();
  console.log('\n── Infocentrum hodiny v konzoli ──\n');
  const VSE = ['data', 'xss', 'poradi', 'oblast', 'cil', 'cilBezPohybu', 'tymy', 'rozvrzeni', 'chyba', 'nova', 'obnova', 'stop'];
  const r = await spust(br, baseOf(srv), VSE);
  r.nalezy.slice(0, 12).forEach(n => console.log('  ⚠ ' + n));
  ok(r.nalezy.length === 0, 'skutečná konzole projde všemi kontrolami', r.nalezy.slice(0, 4).join(' | '));
  ok(r.kontrol === PODLAHA, 'proběhl očekávaný počet kontrol', String(r.kontrol));
  console.log('  skutečná konzole: ' + (r.nalezy.length ? r.nalezy.length + ' nálezů' : 'bez nálezu') + ' (' + r.kontrol + ' kontrol)');
  srv.close();

  /* ── sabotáže ── */
  const ucitel0 = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-ucitel.html'), 'utf8');
  const cloud0 = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-cloud.js'), 'utf8');
  async function sabotaz(jm, soubor, zmena, oddily, rx) {
    const orig = soubor === 'rpg-ucitel.html' ? ucitel0 : cloud0, nove = zmena(orig);
    ok(nove !== orig, 'sabotáž „' + jm + '“ se aplikovala');
    if (nove === orig) return;
    const s = await server({ [soubor]: zmena });
    const v = await spust(br, baseOf(s), oddily);
    ok(v.nalezy.some(n => rx.test(n)), 'sabotáž „' + jm + '“ je chycena', v.nalezy[0] || 'prošla bez nálezu');
    s.close();
  }
  await sabotaz('řazení podle abecedy', 'rpg-ucitel.html', s => s.replace('serazeni=RPGInfo.seradit(hraci)', 'serazeni=hraci.slice().sort((a,b)=>a.jmeno.localeCompare(b.jmeno,"cs"))'), ['poradi'], /nahoře je ten|pořadí 0/);
  await sabotaz('chyby v dotazu', 'rpg-cloud.js', s => s.replace(",hero:data->name')", ",hero:data->name,errs:data->errs')"), ['data'], /nežádá počty chyb/);
  await sabotaz('jména přes innerHTML', 'rpg-ucitel.html', s => s.replace("el.querySelector('.ic-nm').textContent=h.jmeno;", "el.querySelector('.ic-nm').innerHTML=h.jmeno;"), ['xss'], /nevykoná|jako text/);
  await sabotaz('obnova bez „jen změněné“', 'rpg-ucitel.html', s => s.replace("prvni?'':IC.cursor", "''"), ['data'], /jen změněné řádky/);
  await sabotaz('časovač neběží do konce', 'rpg-ucitel.html', s => s.replace("if(tab!=='infocentrum')infoStop();", ''), ['stop'], /časovač/);
  await sabotaz('cíl bez animace', 'rpg-ucitel.html', s => s.replace('if(p.postoupila)icOslava(IC.cil.stupen);', ''), ['cil'], /animace/);
  await sabotaz('týmy bez ohledu na režim', 'rpg-ucitel.html', s => s.replace("sek.hidden=!t;if(!t)return;", "sek.hidden=false;if(!t)return;"), ['tymy'], /panel týmů zmizí/);

  await br.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
}
hlavni().catch(e => { console.error(e); process.exit(1); });
