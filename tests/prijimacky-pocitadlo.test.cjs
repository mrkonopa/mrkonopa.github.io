/* prijimacky-pocitadlo.test.cjs — fáze 27: anonymní počítadlo používání přijímaček (mock Supabase).
   Ověřuje, že se počítá, co se počítat má (vstup, spuštění a odevzdání testu, procvičování, konec
   diagnostiky, vyhodnocení konstrukce) A NIC DALŠÍHO: do volání jde jen jméno události (žádná identita,
   žádný obsah odpovědí), jen ze seznamu, „vstup“ a „procvičování“ jen jednou za návštěvu, učitelské
   účty se nepočítají, obnova rozepsaného testu nepočítá nové spuštění a porucha počítadla nic nerozbije. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
function serve() { return new Promise(res => { const s = http.createServer((q, p) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const fp = path.normalize(path.join(ROOT, u));
  if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
  p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(p);
}); s.listen(0, () => res(s)); }); }
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
const D = '/projects/prijimacky-matematika/';
const POVOLENE = ['vstup', 'test_start', 'test_done', 'procvic', 'diag_done', 'konstrukce_check'];

// Mock: přihlášený (role student/teacher), nebo nepřihlášený; rpc si zapisuje volání. `padat` = rpc vyhodí chybu.
const mock = ({ prihlaseny, role, padat }) => `
window.__RPC = [];
(function(){
  const okp = d => Promise.resolve({ data:d, error:null });
  const session = ${prihlaseny ? "{ user:{ id:'u1', email:'zak@husovaliberec.cz' } }" : 'null'};
  function q(tab){ const o={};
    ['select','eq','order','limit','single','insert','update','upsert','delete','in','gte','lte','is'].forEach(m=>o[m]=()=>o);
    o.maybeSingle=()=>okp(tab==='roles' ? { role:${JSON.stringify(role || 'student')} } : null);
    o.then=(r)=>r({data:null,error:null}); return o; }
  window.supabase = { createClient: ()=>({
    auth: { getSession:()=>okp({ session }), signOut:()=>okp(null), signInWithOAuth:()=>okp(null),
            onAuthStateChange:()=>({ data:{ subscription:{ unsubscribe(){} } } }) },
    from: tab=>q(tab),
    rpc: (fn,args)=>{ window.__RPC.push({ fn, args });
      ${padat ? "if (fn==='pz_event') { throw new Error('počítadlo je rozbité'); }" : ''}
      return okp(null); },
  }) };
})();`;

(async () => {
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC });
  const errs = [];
  async function stranka(nastaveni) {
    const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 } });
    await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
    if (nastaveni) await ctx.addInitScript(mock(nastaveni));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    return { ctx, p };
  }
  const udalosti = p => p.evaluate(() => (window.__RPC || []).filter(c => c.fn === 'pz_event').map(c => c.args.p_event));
  const cekej = async (p, fn, arg) => { await p.waitForFunction(fn, arg || null, { timeout: 8000 }); };
  const otevri = async (p, stranka) => { await p.goto(base + D + stranka, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(700); };

  console.log('\n── Anonymní počítadlo přijímaček ──\n');

  // ══ 1) NEPŘIHLÁŠENÝ žák: test ══
  { const { ctx, p } = await stranka({ prihlaseny: false });
    await otevri(p, 'test.html');
    await cekej(p, () => typeof cmStart === 'function' && window.RPG_CERMAT_9);
    ok((await udalosti(p)).join() === 'vstup', 'nepřihlášený: po otevření stránky jde „vstup“ (' + (await udalosti(p)).join() + ')');
    await p.click('#cm-gate .pz-btn.primary'); await cekej(p, () => CM.on);
    await p.evaluate(() => cmSubmit(false));
    ok((await udalosti(p)).join() === 'vstup,test_start,test_done', 'spuštění a odevzdání testu: test_start, test_done (' + (await udalosti(p)).join() + ')');
    // druhá stránka ve stejné kartě: „vstup“ se neopakuje
    await otevri(p, 'procvicovani.html');
    ok(!(await udalosti(p)).includes('vstup'), '„vstup“ jen jednou za návštěvu (druhá stránka ve stejné kartě ho nepošle znovu)');
    // volání neobsahuje nic kromě jména události
    const vse = await p.evaluate(() => (window.__RPC || []).filter(c => c.fn === 'pz_event').map(c => Object.keys(c.args).join()));
    ok(vse.every(k => k === 'p_event'), 'do volání jde jen jméno události — žádná identita ani obsah');
    await ctx.close(); }

  // ══ 2) Obnova rozepsaného testu nepočítá nové spuštění ══
  { const { ctx, p } = await stranka({ prihlaseny: false });
    await otevri(p, 'test.html'); await cekej(p, () => typeof cmStart === 'function' && window.RPG_CERMAT_9);
    await p.click('#cm-gate .pz-btn.primary'); await cekej(p, () => CM.on);
    await p.fill('#cm-tasks input[type=text]', '5'); await cekej(p, () => !!localStorage.getItem('PZ_TEST_RUN'));
    await otevri(p, 'test.html'); await cekej(p, () => document.getElementById('cm-resume-go'));
    await p.click('#cm-resume-go'); await cekej(p, () => CM.on);
    ok((await udalosti(p)).filter(e => e === 'test_start').length === 0, 'pokračování v rozepsaném testu nepočítá nové spuštění (po obnovení stránky: ' + ((await udalosti(p)).join() || 'nic') + ')');
    await ctx.close(); }

  // ══ 3) Procvičování: víc odpovědí = jedna událost ══
  { const { ctx, p } = await stranka({ prihlaseny: false });
    await otevri(p, 'procvicovani.html'); await cekej(p, () => typeof bumpProg === 'function');
    await p.evaluate(() => { bumpProg('rovnice', true); bumpProg('rovnice', false); bumpProg('zlomky', true); });
    await p.waitForTimeout(200);
    ok((await udalosti(p)).filter(e => e === 'procvic').length === 1, 'procvičování: tři odpovědi = jedna událost za návštěvu');
    await ctx.close(); }

  // ══ 4) Diagnostika ══
  { const { ctx, p } = await stranka({ prihlaseny: false });
    await otevri(p, 'diagnostika.html'); await cekej(p, () => typeof dgStart === 'function');
    await p.evaluate(() => { dgStart(); let n = 0; while (DG.it && DG.k < DG.okruhy.length && n++ < 80) dgNevim(); });
    await cekej(p, () => document.getElementById('dg-end').style.display !== 'none');
    ok((await udalosti(p)).filter(e => e === 'diag_done').length === 1, 'diagnostika: na konci jde diag_done právě jednou');
    await ctx.close(); }

  // ══ 5) Konstrukce ══
  { const { ctx, p } = await stranka({ prihlaseny: false });
    await otevri(p, 'konstrukce.html'); await cekej(p, () => typeof knVyhodnot === 'function');
    await p.evaluate(() => { knNova(); knVyhodnot(); });
    ok((await udalosti(p)).filter(e => e === 'konstrukce_check').length === 1, 'konstrukce: vyhodnocení pošle konstrukce_check');
    await ctx.close(); }

  // ══ 6) Přihlášený žák se počítá, učitel ne ══
  { const { ctx, p } = await stranka({ prihlaseny: true, role: 'student' });
    await otevri(p, 'test.html'); await cekej(p, () => typeof cmStart === 'function');
    ok((await udalosti(p)).includes('vstup'), 'přihlášený žák se počítá');
    await ctx.close(); }
  { const { ctx, p } = await stranka({ prihlaseny: true, role: 'teacher' });
    await otevri(p, 'test.html'); await cekej(p, () => typeof cmStart === 'function' && window.RPG_CERMAT_9);
    await p.click('#cm-gate .pz-btn.primary'); await cekej(p, () => CM.on); await p.evaluate(() => cmSubmit(false));
    ok((await udalosti(p)).length === 0, 'učitel se nepočítá (poslaných událostí: ' + (await udalosti(p)).length + ')');
    await ctx.close(); }

  // ══ 7) Porucha počítadla nic nerozbije ══
  { const { ctx, p } = await stranka({ prihlaseny: false, padat: true });
    await otevri(p, 'test.html'); await cekej(p, () => typeof cmStart === 'function' && window.RPG_CERMAT_9);
    await p.click('#cm-gate .pz-btn.primary'); await cekej(p, () => CM.on);
    await p.evaluate(() => cmSubmit(false));
    ok(await p.evaluate(() => !CM.on && document.getElementById('cm-end').style.display !== 'none'), 'rozbité počítadlo: test se přesto spustí i odevzdá');
    await ctx.close(); }

  // ══ 8) Bez cloudu nic neposílá a nic neselže ══
  { const { ctx, p } = await stranka(null);
    await otevri(p, 'test.html'); await cekej(p, () => typeof cmStart === 'function' && window.RPG_CERMAT_9);
    await p.click('#cm-gate .pz-btn.primary'); await cekej(p, () => CM.on);
    ok(await p.evaluate(() => typeof PZ.event === 'function'), 'bez cloudu: PZ.event existuje a nic nerozbije');
    await ctx.close(); }

  // ══ 9) Seznam jmen ve webu = seznam ve SQL (dvě kopie se rozejdou) ══
  const js = fs.readFileSync(path.join(ROOT, 'projects/rpg-cloud.js'), 'utf8');
  const sql = fs.readFileSync(path.join(ROOT, 'projects/rpg-cloud-setup-phase27.sql'), 'utf8');
  const wJs = (js.match(/UDALOSTI_PZ = \[([^\]]*)\]/) || [, ''])[1].match(/'([a-z_]+)'/g).map(x => x.replace(/'/g, '')).sort().join();
  const wSql = (sql.match(/p_event not in\s*\(([^)]*)\)/) || [, ''])[1].match(/'([a-z_]+)'/g).map(x => x.replace(/'/g, '')).sort().join();
  ok(wJs === wSql && wJs === POVOLENE.slice().sort().join(), 'jména událostí sedí v klientovi i v SQL (' + wJs + ')', wSql);

  ok(errs.length === 0, 'žádné JS chyby' + (errs.length ? ' [' + errs[0] + ']' : ''));
  await browser.close(); srv.close();
  console.log('\n  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
