/* ══════════════════════════════════════════════════════════════════════
   Název ikony se nikdy nesmí vypsat jako TEXT.

   Vojta našel na screenshotu z 5. ročníku v hlavičce oblasti slovo
   „egg“ místo obrázku vejce. Příčina: `${ar.icon}` v šabloně místo
   `RPGIcons.svg(ar.icon, 48)`. Je to pozůstatek z doby, kdy pole `icon`
   obsahovalo emoji — při přechodu na pixelovou sadu se pár volání
   přehlédlo. V 6.–9. ročníku, kde sada vznikla, to bylo správně; do
   1. stupně se portovala později a tam ta místa zůstala.

   Průchod kódem pak ukázal, že to nebylo jedno místo, ale 22 na hru:
   hlavička oblasti a hlavně mřížka artefaktů v inventáři (ta se ukazuje
   na profilu, v tréninku i v obchodu) plus toast odznaku.

   Kontrolovat to ze zdrojáku nejde spolehlivě: `${item.ic}` v obchodu je
   v pořádku, protože tam jsou v `ic` skutečná emoji. Rozdíl je až ve
   vykresleném výsledku — proto se stránka opravdu vyrenderuje a hledají
   se textové uzly, jejichž obsah je přesně názvem některé ikony ze sady.

   Spusť: node tests/rpg-icon-text.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18996;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GRADES = [3, 4, 5, 6, 7, 8, 9];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

global.window = global;
require(path.join(ROOT, 'projects', 'rpg-icons.js'));
const JMENA = global.window.RPGIcons.names();

function serve() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css' };
  const srv = http.createServer((q, p) => {
    let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT)) { p.writeHead(403); return p.end(); }
    let b = null; try { b = fs.readFileSync(fp); } catch (e) {}
    if (b === null) { p.writeHead(404); return p.end(); }
    p.writeHead(200, { 'Content-Type': mime[u.split('.').pop()] || 'application/octet-stream' });
    p.end(b);
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

(async () => {
  console.log('\n── Názvy ikon se nesmí vypsat jako text ──\n');
  ok(JMENA.length >= 60, `sada ikon načtena (${JMENA.length} jmen)`);
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let obrazovek = 0;
  try {
    for (const g of GRADES) {
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof startGame === 'function', { timeout: 8000 });

      const r = await page.evaluate((jmena) => {
        localStorage.clear(); startGame('Testovací žák'); S.tutorialDone = true;
        // Všechno odemknout a rozdat, ať se vykreslí i inventář a odznaky —
        // jinak by se prázdné mřížky zkontrolovaly naprázdno.
        try { AREAS.forEach(a => a.missions.forEach(m => { for (let i = 0; i < m.tc; i++) S.done[m.id + '-' + i] = 1; })); } catch (e) {}
        try { S.inv = AREAS.map(a => a.art.id); } catch (e) {}
        try { if (typeof ACH !== 'undefined') ACH.forEach(a => S.ach[a.id] = '2026-01-01'); } catch (e) {}

        const uniky = [], videno = [];
        const zkus = (jm, f) => {
          try { f(); } catch (e) { return; }
          videno.push(jm);
          document.querySelectorAll('body *').forEach(el => {
            for (const n of el.childNodes) {
              if (n.nodeType !== 3) continue;                    // jen textové uzly
              const t = (n.textContent || '').trim();
              if (t && jmena.includes(t))
                uniky.push(jm + ' → «' + t + '» v <' + el.tagName.toLowerCase() +
                  (el.className ? ' class=' + String(el.className).split(' ')[0] : '') + '>');
            }
          });
        };
        zkus('mapa', () => renderMap());
        zkus('oblast', () => renderArea(AREAS[0].id));
        zkus('profil', () => renderProfile());
        if (typeof renderTrainPicker === 'function') zkus('trénink', () => renderTrainPicker());
        if (typeof renderShop === 'function') zkus('obchod', () => renderShop());
        return { uniky: [...new Set(uniky)], videno };
      }, JMENA);

      obrazovek += r.videno.length;
      ok(r.videno.length >= 3, `g${g} vykresleno aspoň 3 obrazovky (${r.videno.join(', ')})`);
      ok(r.uniky.length === 0, `g${g} žádný název ikony se nevypsal jako text`,
        r.uniky.slice(0, 5).join(' | ') + (r.uniky.length > 5 ? ` … a další (${r.uniky.length})` : ''));
      await ctx.close();
    }
    // Pojistka proti prázdnému běhu — kdyby se přejmenovaly render funkce,
    // `zkus` by jen tiše nic nespustil a test by prošel naprázdno.
    ok(obrazovek >= GRADES.length * 3, `celkem vykresleno ${obrazovek} obrazovek (čekáno ≥ ${GRADES.length * 3})`);
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Názvy ikon: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
