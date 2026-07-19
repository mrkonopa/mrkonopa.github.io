/* Skloňování textu ostatních hracích projektů (únikovky, cesta_penez,
   procenta_priklady) — statický i generovaný text. Playwright: generátory se
   proženou v kontextu stránky, deep-walkem se posbírají řetězce a skenují se
   stejným slovníkem jako rpg-declension-all. Spusť: node tests/declension-games.test.cjs */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 18488;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function startServer() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml' };
  const srv = http.createServer((req, res) => { let p = req.url.split('?')[0]; if (p === '/') p = '/index.html'; try { const fp = path.normalize(path.join(ROOT, p)); if (!fp.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end(); return; } res.writeHead(200, { 'Content-Type': mime[p.split('.').pop()] || 'application/octet-stream' }); res.end(fs.readFileSync(fp)); } catch { res.writeHead(404); res.end('nf'); } });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { console.log('  ✅ ' + m); pass++; } else { console.log('  ❌ ' + m); fail++; } };

// ── slovník + scanner (shodné s rpg-declension-all) ──
const DICT = [['den','dny','dní'],['minutu','minuty','minut'],['hodinu','hodiny','hodin'],['sekundu','sekundy','sekund'],['týden','týdny','týdnů'],['rok','roky','let'],['litr','litry','litrů'],['minci','mince','mincí'],['dukát','dukáty','dukátů'],['kredit','kredity','kreditů'],['bod','body','bodů'],['jablko','jablka','jablek'],['strom','stromy','stromů'],['krok','kroky','kroků'],['řadu','řady','řad'],['stranu','strany','stran'],['knihu','knihy','knih'],['kus','kusy','kusů'],['stůl','stoly','stolů'],['korunu','koruny','korun'],['procento','procenta','procent'],['hrušku','hrušky','hrušek'],['dívku','dívky','dívek'],['výrobek','výrobky','výrobků'],['metr','metry','metrů'],['žák',['žáci','žáky'],'žáků'],['student',['studenti','studenty'],'studentů']];
const F = {}; DICT.forEach(([s, f, m]) => [[s,0],[f,1],[m,2]].forEach(([x, c]) => (Array.isArray(x)?x:[x]).forEach(w => (F[w]=F[w]||new Set()).add(c))));
const classOf = n => n === 1 ? 0 : (n >= 2 && n <= 4 ? 1 : 2);
const CP = new Set(['z','ze','do','od','u','bez','během','dobu','kolem','okolo','vedle','podél','k','ke','ku','po','při']);
const bad = [];
function scan(text, where) { const s = String(text).replace(/\n/g, ' '); const re = /([a-záčďéěíňóřšťúůýžA-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+)?\s*(\d+)\s+([a-záčďéěíňóřšťúůýž]{3,})/g; let m; while ((m = re.exec(s))) { const prev = (m[1]||'').toLowerCase(), n = parseInt(m[2], 10), w = m[3]; const bef = s[m.index + m[0].indexOf(m[2]) - 1] || ''; if (',.^·'.includes(bef)) continue; if (CP.has(prev)) continue; const cs = F[w]; if (!cs) continue; if (!cs.has(classOf(n))) bad.push(where + ': „' + n + ' ' + w + '"'); } }

async function run() {
  console.log('\n══ Skloňování ostatních her ══');
  const srv = await startServer();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  const ctx = await browser.newContext();
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  let gen = 0;

  const games = fs.readdirSync(path.join(ROOT, 'projects')).filter(f => /^(unikovka_|cesta_penez|procenta_priklady)/.test(f) && f.endsWith('.html'));
  for (const g of games) {
    const pg = await ctx.newPage(); const perr = []; pg.on('pageerror', e => perr.push(e.message));
    try {
      await pg.goto(`${BASE}/projects/${g}`, { waitUntil: 'domcontentloaded' });
      // statický text stránky
      const bodyTxt = await pg.evaluate(() => document.body ? document.body.innerText : '');
      scan(bodyTxt, g + '(static)'); gen++;
      // generovaný text: procenta (genX) + cesta (ACTS)
      const generated = await pg.evaluate(() => {
        const out = []; const walk = o => { if (!o) return; if (typeof o === 'string') { out.push(o); return; } if (Array.isArray(o)) return o.forEach(walk); if (typeof o === 'object') for (const k in o) walk(o[k]); };
        const gens = ['genPart','genBase','genPercent','genIncrease','genDecrease','genCompound','genComparison','genRatio'];
        for (const name of gens) { const fn = window[name]; if (typeof fn !== 'function') continue; for (let d = 0; d < 3; d++) for (let r = 0; r < 120; r++) { try { walk(fn(d)); } catch (e) {} } }
        if (Array.isArray(window.ACTS)) { for (const act of window.ACTS) { for (let r = 0; r < 40; r++) { try { const c = act.setup ? act.setup() : {}; (act.scenes || []).forEach(sc => { try { walk(sc.build ? sc.build(c) : sc); } catch (e) {} }); } catch (e) {} } } }
        return out;
      });
      generated.forEach(t => { gen++; scan(t, g + '(gen)'); });
      ok(perr.length === 0, 'načteno bez JS chyby: ' + g + (perr.length ? ' — ' + perr.slice(0, 1).join() : ''));
    } catch (e) { ok(false, 'běh ' + g + ' — ' + e.message); }
    finally { await pg.close(); }
  }
  await browser.close(); srv.close();

  ok(gen > 500, 'vygenerováno dost textu (' + gen + ')');
  const uniq = [...new Set(bad)];
  ok(uniq.length === 0, 'skloňování textu ostatních her (' + uniq.length + ' nálezů)');
  uniq.slice(0, 20).forEach(b => console.log('     · ' + b));
  console.log(`\n  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌  (${gen} textů)`);
  process.exit(fail ? 1 : 0);
}
run();
