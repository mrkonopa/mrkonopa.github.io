/* ══════════════════════════════════════════════════════════════════════
   HUB — souhrn atributů a odznaků přes všechny ročníky.

   PROČ. Hub sčítá atributy ze VŠECH sedmi her (`tot[k] += S.attrs[k]`)
   a slučuje odznaky (`Object.assign(allAch, S.ach)`). Na odznaky test byl
   (`rpg-ach-hub`), na SOUČET atributů ne — přitom je to číslo, které dítě
   vidí na profilu jako svůj celkový pokrok, a sčítá se přes hry, které
   mohou mít každá jiný stav.

   Test nastaví savy se ZNÁMÝMI hodnotami a ověří, že hub ukáže právě
   jejich součet — druhý, nezávislý zdroj pravdy (ne odečet z téhož kódu).

   Hlídá i případy, kde se to snadno rozbije: chybějící `attrs`, hra bez
   savu, podvržená nečíselná hodnota a záporné číslo.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 19060;
let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const GAMES = ['RPG_MAT_3','RPG_MAT_4','RPG_MAT_5','RPG_MAT_6','RPG_MAT_7','RPG_MAT_8','RPG_MAT_9'];

(async () => {
  const mime = { html:'text/html', js:'application/javascript', css:'text/css', json:'application/json' };
  const srv = http.createServer((req, res) => {
    const p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
    if (!p.startsWith(ROOT + path.sep)) { res.statusCode = 403; res.end(); return; }
    try { res.writeHead(200, {'Content-Type': mime[p.split('.').pop()] || 'application/octet-stream'});
          res.end(fs.readFileSync(p)); } catch { res.statusCode = 404; res.end(); }
  }).listen(PORT);
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const br = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined });

  async function hub(savy) {
    const ctx = await br.newContext();
    await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1:' + PORT) ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(s => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, JSON.stringify(v)); }, savy);
    await pg.goto(`http://127.0.0.1:${PORT}/projects/rpg-matematika.html`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(900);
    const r = await pg.evaluate(() => {
      const el = document.getElementById('gp-attrs');
      const cisla = [...(el ? el.querySelectorAll('.v') : [])].map(x => parseInt(x.textContent, 10));
      return { cisla, text: el ? el.textContent : null };
    });
    await ctx.close();
    return { ...r, errs };
  }

  const zaklad = a => ({ name: 'T', xp: 0, level: 1, attrs: a, done: {}, inv: [] });

  /* ── 1) Součet přes tři hry ── */
  {
    const savy = {
      RPG_MAT_3: zaklad({ calc: 10, geo: 5, anal: 2, craft: 1 }),
      RPG_MAT_6: zaklad({ calc: 7,  geo: 3, anal: 4, craft: 6 }),
      RPG_MAT_9: zaklad({ calc: 1,  geo: 1, anal: 1, craft: 1 }),
    };
    const r = await hub(savy);
    // nezávislý součet ze vstupu, ne z kódu hubu
    const ceka = ['calc','geo','anal','craft'].map(k =>
      Object.values(savy).reduce((s, S) => s + (S.attrs[k] || 0), 0));
    ok(JSON.stringify(r.cisla) === JSON.stringify(ceka),
       `součet atributů přes hry sedí (${JSON.stringify(r.cisla)} = ${JSON.stringify(ceka)})`);
    ok(r.errs.length === 0, 'žádné JS chyby', r.errs.join(' | '));
  }

  /* ── 2) Hra bez savu a save bez `attrs` se nesmí započítat ani shodit ── */
  {
    const r = await hub({
      RPG_MAT_4: zaklad({ calc: 3, geo: 0, anal: 0, craft: 0 }),
      RPG_MAT_7: { name: 'T', xp: 0, level: 1, done: {} },      // bez attrs
    });
    ok(JSON.stringify(r.cisla) === JSON.stringify([3, 0, 0, 0]),
       `save bez attrs se přeskočí (${JSON.stringify(r.cisla)})`);
    ok(r.errs.length === 0, 'nespadne na chybějících attrs', r.errs.join(' | '));
  }

  /* ── 3) Podvržené hodnoty: žák si save může přepsat ──
     Hub kreslí `${tot[k]|0}`, takže nečíselná hodnota má vyjít 0,
     ne „NaN" nebo „[object Object]" na profilu. */
  {
    const r = await hub({
      RPG_MAT_5: zaklad({ calc: 'ahoj', geo: { x: 1 }, anal: null, craft: 4 }),
    });
    ok(!/NaN|object|undefined/i.test(r.text || ''),
       `podvržené hodnoty nevytečou na profil („${(r.text || '').slice(0, 40)}")`);
    ok(r.errs.length === 0, 'nespadne na podvrženém savu', r.errs.join(' | '));
  }

  /* ── 4) Prázdný start: nic nerozehráno ── */
  {
    const r = await hub({});
    ok(JSON.stringify(r.cisla) === JSON.stringify([0, 0, 0, 0]),
       `bez rozehraných her jsou nuly (${JSON.stringify(r.cisla)})`);
  }

  await br.close(); srv.close();
  console.log(`\n  Hub — souhrn atributů: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
