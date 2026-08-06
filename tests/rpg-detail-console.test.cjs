/* ══════════════════════════════════════════════════════════════════════
   Detail žáka v učitelské konzoli.

   Původní podoba byla jeden sloupec 520 px široký a 1225 px vysoký, takže
   se učitel na 1440px monitoru proscrolloval dvě obrazovky, zatímco vedle
   zbývalo 900 px prázdna. Teď jsou to dva sloupce (vlevo „jak si vede“,
   vpravo „co s tím udělám“), pod 900 px se to složí zpátky pod sebe.

   Test měří skutečné rámečky v prohlížeči — jinak by se dalo tvrdit
   cokoli. Kontroluje:

     • na širokém okně jsou sloupce VEDLE SEBE a detail se vejde bez
       scrollování; na úzkém jsou POD SEBOU
     • čipy v hlavičce ukazují to, co učiteli dřív chybělo úplně:
       kredity, denní sérii, odznaky, trend chyb
     • radar atributů se vykreslí a jeho tvar odpovídá hodnotám
     • VŠECHNA pole ze save žáka jsou escapovaná — žák si do save zapíše
       cokoli a konzole ho renderuje v cizím prohlížeči (viz CLAUDE.md,
       stored XSS byla kdysi kritická)

   Spusť: node tests/rpg-detail-console.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18994;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function serve() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json' };
  const srv = http.createServer((q, p) => {
    let u = q.url.split('?')[0]; if (u === '/') u = '/index.html';
    try {
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep)) { p.writeHead(403); return p.end(); }
      const b = fs.readFileSync(fp);
      p.writeHead(200, { 'Content-Type': mime[u.split('.').pop()] || 'application/octet-stream' });
      p.end(b);
    } catch (e) { p.writeHead(404); p.end(); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

const XSS = '<img src=x onerror=window.__pwned=1>';

const SC = {
  session: { user: { id: 'u-ucitel', email: 'ucitel@husovaliberec.cz', user_metadata: { full_name: 'Uč Itel' } } },
  roles: [{ email: 'ucitel@husovaliberec.cz', role: 'superadmin' }],
  saves: [{
    user_id: 'u-zak1', game: 'RPG_MAT_9',
    email: 'zak@husovaliberec.cz', full_name: 'Testovací Žákyně',
    data: {
      name: 'NEO' + XSS, xp: 1480, level: 15,
      attrs: { calc: 18, geo: 11, anal: 14, craft: 7 },
      done: { '1-1': 1, '1-2': 1, '1-3': 1, '2-1': 1 },
      inv: ['Rezavý klíč', XSS],
      mastery: { '1-1': { score: 15, mastered: true }, '2-1': { score: 8, mastered: false } },
      errs: { '2-1': 9, '3-3': 5 },
      streak: { count: 6, last: '2026-08-06' },
      ach: { boot: '1', crit: '2', combo5: '3' },
      teacherUnlocked: ['5-1', XSS],
      credits: 820,
    },
    updated_at: new Date().toISOString(),
  }],
};

const mockScript = (S) => `(function(){const SCENARIO=${JSON.stringify(S)};
 function mkClient(){const db={roles:SCENARIO.roles||[],saves:SCENARIO.saves||[]};
  function tableQuery(table){let op='select',filters=[],single=false;
   function rows(){let r=(db[table]||[]).slice();filters.forEach(([c,v])=>{r=r.filter(x=>String(x[c])===String(v));});return r;}
   function resolve(){if(op==='select'){const r=rows();return Promise.resolve({data:single?(r[0]||null):r,error:null});}return Promise.resolve({error:null});}
   const b={select(){op='select';return b;},insert(){return b;},upsert(){return b;},update(){return b;},delete(){return b;},
    eq(c,v){filters.push([c,v]);return b;},order(){return b;},maybeSingle(){single=true;return resolve();},
    then(res,rej){return resolve().then(res,rej);}};return b;}
  return {auth:{getSession:async()=>({data:{session:SCENARIO.session||null}}),
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth:async()=>{},signOut:async()=>{}},
   from:t=>tableQuery(t), rpc:async(n)=>({data:(n==='my_role'?'superadmin':[]),error:null})};}
 window.supabase={createClient:()=>mkClient()};})();`;

(async () => {
  console.log('\n── Detail žáka (konzole) ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let otevreno = 0;
  try {
    for (const w of [1440, 760]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      page.on('dialog', d => d.dismiss());
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.addInitScript(mockScript(SC));
      await page.goto(`http://localhost:${PORT}/projects/rpg-ucitel.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof openDetail === 'function' && window.__filtered && window.__filtered.length, { timeout: 10000 });
      // Týdenní snímky chyb (fáze 6b) — trend se počítá z posledních dvou.
      await page.evaluate(() => {
        window.SNAP_DATA = window.SNAP_DATA || {};
        SNAP_DATA['RPG_MAT_9'] = [
          { user_id: 'u-zak1', snapped_at: '2026-07-25', errs: { '2-1': 6, '3-3': 4 } },
          { user_id: 'u-zak1', snapped_at: '2026-08-01', errs: { '2-1': 9, '3-3': 5 } },
        ];
        openDetail(0);
      });
      await page.waitForTimeout(300);
      otevreno++;

      const r = await page.evaluate(() => {
        const m = document.getElementById('modal');
        const cols = [...m.querySelectorAll('.det-col')];
        const rc = cols.map(c => c.getBoundingClientRect());
        return {
          wide: m.classList.contains('wide'),
          sirka: Math.round(m.getBoundingClientRect().width),
          vyska: m.scrollHeight,
          sloupcu: cols.length,
          vedleSebe: rc.length === 2 && rc[1].left > rc[0].right - 2,
          text: m.textContent,
          radarPolygonu: m.querySelectorAll('.det-radar svg polygon').length,
          radarTvar: (m.querySelector('.det-radar svg polygon:last-of-type') || {}).getAttribute
            ? m.querySelector('.det-radar svg polygon:last-of-type').getAttribute('points') : '',
          pruh: (m.querySelector('.pbar > i') || {}).style ? m.querySelector('.pbar > i').style.width : '',
          html: m.innerHTML,
        };
      });

      ok(r.sloupcu === 2, `@${w} detail má dva sloupce (${r.sloupcu})`);
      if (w >= 1200) {
        ok(r.wide, `@${w} modal je v širokém režimu`);
        ok(r.vedleSebe, `@${w} sloupce jsou vedle sebe`);
        ok(r.sirka > 900, `@${w} modal využívá šířku (${r.sirka} px)`);
        // Původní jednosloupcová podoba měla 1225 px; smysl změny je, že se
        // detail vejde na obrazovku bez scrollování.
        ok(r.vyska < 900, `@${w} detail se vejde bez scrollování (${r.vyska} px)`);
      } else {
        ok(!r.vedleSebe, `@${w} sloupce jsou pod sebou (mobil/úzké okno)`);
        ok(r.sirka <= 560, `@${w} modal se nerozlévá (${r.sirka} px)`);
      }

      /* ── čipy: údaje, které učiteli dřív chyběly úplně ─────────────── */
      ok(/LV 15 · 1480 XP/.test(r.text), `@${w} čip s levelem a XP`);
      ok(/820 kr/.test(r.text), `@${w} zůstatek kreditů (superadmin je mohl měnit naslepo)`);
      ok(/6 dní v řadě/.test(r.text), `@${w} denní série se správným skloňováním`);
      ok(/3 odznaky/.test(r.text), `@${w} počet odznaků se správným skloňováním`);
      ok(/\+4 chyby od minule/.test(r.text), `@${w} trend chyb z týdenních snímků`,
        (r.text.match(/[+-]\d+ chyb\S* od minule/) || ['nenalezeno'])[0]);

      /* ── grafika ──────────────────────────────────────────────────── */
      ok(r.radarPolygonu >= 5, `@${w} radar má mřížku i tvar (${r.radarPolygonu} polygonů)`);
      const body = String(r.radarTvar).trim().split(/\s+/).map(s => s.split(',').map(Number));
      // calc(18) je maximum → jeho vrchol musí ležet na okraji (nahoře),
      // craft(7) nejmenší → nejblíž středu. Kdyby radar kreslil pořád
      // stejný čtverec, tohle by neprošlo.
      const stred = [64, 64];
      const dist = p => Math.hypot(p[0] - stred[0], p[1] - stred[1]);
      ok(body.length === 4, `@${w} radar má 4 vrcholy (${body.length})`);
      if (body.length === 4) {
        ok(dist(body[0]) > dist(body[3]) + 5, `@${w} radar odráží hodnoty (calc 18 dál než craft 7)`,
          dist(body[0]).toFixed(1) + ' vs ' + dist(body[3]).toFixed(1));
      }
      ok(r.pruh === '9%' || /^\d+%$/.test(r.pruh), `@${w} pruh postupu má šířku podle procent`, r.pruh);

      /* ── XSS: žák si do save zapíše cokoli ────────────────────────── */
      const pwned = await page.evaluate(() => !!window.__pwned);
      ok(!pwned, `@${w} payload ze save se nespustil`);
      ok(!/<img src=x/i.test(r.html), `@${w} pole ze save jsou escapovaná`,
        (r.html.match(/<img src=x[^>]*>/i) || [''])[0]);
      ok(errs.length === 0, `@${w} bez JS chyby`, errs[0] || '');

      /* ── zavření vrátí modal do normální šířky ────────────────────── */
      const poZavreni = await page.evaluate(() => {
        closeModal();
        return document.getElementById('modal').classList.contains('wide');
      });
      ok(!poZavreni, `@${w} po zavření modal ztratí širokou třídu`);
      await ctx.close();
    }
    // Pojistka proti prázdnému běhu.
    ok(otevreno === 2, `detail se otevřel v obou šířkách (${otevreno})`);
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Detail žáka: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
