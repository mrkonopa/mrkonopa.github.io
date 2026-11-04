/* ═══════════════════════════════════════════════════════════════════
   Test: spolužáci uvidí můj vzhled z obchodu i v ŽEBŘÍČKU VĚŽE LEGEND
   (fáze 31 `tower_board.look`, klient `RPGCloud.lookRadky` + `twRenderBoard` v rpg-mat-6/7/8/9.html).

   Řádky žebříčku sezóny dostanou rámeček s iniciálou, barvu jména, titul a mazlíčka (tytéž moduly jako
   v žebříčku třídy a v živém souboji). Dokazujeme, na SKUTEČNÝCH hrách 6.–9. ročníku:
     1. rámeček i mazlíček se skutečně NAKRESLÍ (pixely), barva jména a titul z katalogu obchodu
     2. řádek bez vzhledu (žák z jiné třídy: `look` = null) i starý server bez klíče `look` zůstane prostý
        a dostane prázdné místo stejné šířky (jména začínají pod sebou)
     3. nepřátelský vzhled (HTML v rámečku, neexistující odznak, titul z cizí kategorie, objekt místo id)
        nevytvoří žádnou značku ani rámeček a nespustí kód
     4. opakované překreslení žebříčku nezdvojí ozdoby
     5. starý `rpg-cloud.js` bez `lookRadky`: žebříček zůstane prostý, žádná chyba
     6. síň slávy zůstává prostá (jména zapsaná natrvalo)
     7. na telefonu 360 px se řádek nerozbije (nic nevyčnívá)
   Sabotáže (5, na 9. ročníku): bez volání, bez značky řádku, bez značky jména, bez prázdného místa,
   vzhled se zahazuje.
   Spusť: node tests/rpg-tower-look.test.cjs
   ═══════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function serve(prepis) {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      const u = decodeURIComponent(q.url.split('?')[0]);
      const f = path.normalize(path.join(ROOT, u));
      if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('nf'); }
      let telo = fs.readFileSync(f);
      const jm = path.basename(f);
      for (const [k, fn] of (prepis || [])) if (k === jm) telo = Buffer.from(fn(telo.toString('utf8')), 'utf8');
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      r.end(telo);
    });
    s.listen(0, () => res(s));
  });
}

let pass = 0, fail = 0;
const hl = [];
let SAB_BEZI = false;   // v sabotáži se zdařené kontroly nepočítají
const ok = (n, c, d = '') => { if (c) { if (!SAB_BEZI) pass++; } else { fail++; hl.push('  ❌ ' + n + (d ? ' — ' + d : '')); } };

const SEED = { name: 'TEST', xp: 0, level: 1, attrs: { calc: 0, geo: 0, anal: 0, craft: 0 }, done: {}, inv: [] };
const RADKY = [
  { display_name: 'Bořek Silný', best_floor: 12, is_me: false, look: { border: 'border-gold', badge: 'badge-purple', title: 'title-lovec', pet: 'pet-sova' } },
  { display_name: 'Cyril Prostý', best_floor: 9, is_me: false, look: null },
  { display_name: 'Já', best_floor: 7, is_me: true, look: { border: 'border-cyan', title: 'title-lovec' } },
  { display_name: '<img src=x onerror=window.__xss=1>', best_floor: 5, is_me: false,
    look: { border: '<img src=x onerror=window.__xss=2>', badge: 'badge-neexistuje', title: 'border-gold', pet: { a: 1 } } },
  { display_name: 'Starý server', best_floor: 3, is_me: false }
];

async function otevri(browser, base, N, sirka, mod) {
  const ctx = await browser.newContext({ viewport: { width: sirka || 480, height: 900 } });
  const page = await ctx.newPage();
  const chyby = [];
  page.on('pageerror', e => chyby.push(String(e.message).slice(0, 140)));
  await page.addInitScript(() => { window.__TW_TESTNOW = '2026-05-15T10:00:00'; });
  await page.addInitScript(({ key, seed }) => { localStorage.setItem(key, JSON.stringify(seed)); }, { key: 'RPG_MAT_' + N, seed: SEED });
  await page.goto(`${base}/projects/rpg-mat-${N}.html`, { waitUntil: 'load' });
  await page.evaluate(() => continueGame());
  await page.evaluate(({ radky, mod }) => {
    const nad = {
      configured: () => true, currentUser: () => ({ id: 'u1' }), towerEligible: async () => true,
      towerBoard: async () => radky,
      towerHall: async () => [{ season: '2024/25', rank: 1, display_name: 'Síň Slávy', best_floor: 28 }]
    };
    window.RPGCloud = Object.assign({}, window.RPGCloud, nad);
    if (mod === 'stary-cloud') delete window.RPGCloud.lookRadky;
    go('map'); go('tower');
  }, { radky: RADKY, mod: mod || null });
  await page.waitForFunction(() => { const b = document.getElementById('tw-board'); return b && b.style.display === 'block' && b.querySelectorAll('[data-i]').length >= 5; }, null, { timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(150);
  return { ctx, page, chyby };
}

const radky = page => page.evaluate(() => Array.from(document.querySelectorAll('#tw-board [data-i]')).map(r => {
  const nm = r.querySelector('.tw-nm'), tit = r.querySelector('.lk-title');
  const pix = c => { if (!c) return 0; const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i] > 40) n++; return n; };
  return {
    text: nm ? nm.textContent : null, trida: nm ? nm.className : '',
    ramy: r.querySelectorAll('.lk-av:not(.lk-prazdny)').length, prazdnych: r.querySelectorAll('.lk-prazdny').length,
    ramPix: pix(r.querySelector('.lk-av canvas')), petPix: pix(r.querySelector('canvas.lk-pet')), pets: r.querySelectorAll('canvas.lk-pet').length,
    titul: tit ? tit.textContent : null, imgs: r.querySelectorAll('img').length, prekryv: r.scrollWidth > r.clientWidth + 1
  };
}));

/* sada kontrol nad jednou hrou; vrací počet nezdarů (pro sabotáže) */
async function kontroly(browser, base, N, popis, sirka, mod) {
  const pred = fail;
  const { ctx, page, chyby } = await otevri(browser, base, N, sirka, mod);
  const r = await radky(page);
  const kat = await page.evaluate(() => ({
    titul: RPGWallet.itemById('title-lovec').name, badge: RPGWallet.itemById('badge-purple').cssKey, xss: window.__xss || 0,
    hall: { ram: document.querySelectorAll('#tw-hall .lk-av').length, uid: document.querySelectorAll('#tw-hall [data-i]').length, txt: document.getElementById('tw-hall').textContent }
  }));
  const P = `${N}. ročník ${popis}: `;
  ok(P + 'žebříček má 5 řádků', r.length === 5, JSON.stringify(r.map(x => x.text)));
  if (r.length === 5) {
    const [bo, cy, ja, zlo, sta] = r;
    if (mod === 'stary-cloud') {
      ok(P + 'starý rpg-cloud.js: žádný rámeček ani titul', r.every(x => x.ramy === 0 && x.titul === null && x.pets === 0 && x.prazdnych === 0), JSON.stringify(r.map(x => [x.ramy, x.titul])));
      ok(P + 'starý rpg-cloud.js: jména i patra zůstala', bo.text === 'Bořek Silný' && ja.text === 'Já (ty)');
    } else {
      ok(P + 'rámeček spolužáka je nakreslený (pixely)', bo.ramy === 1 && bo.ramPix > 20, JSON.stringify([bo.ramy, bo.ramPix]));
      ok(P + 'mazlíček spolužáka je nakreslený (pixely)', bo.pets === 1 && bo.petPix > 10, JSON.stringify([bo.pets, bo.petPix]));
      ok(P + 'titul z katalogu pod jménem', bo.titul === kat.titul, JSON.stringify([bo.titul, kat.titul]));
      ok(P + 'barva jména z odznaku (třída z katalogu)', !!kat.badge && bo.trida.split(' ').includes(kat.badge), bo.trida + ' / ' + kat.badge);
      ok(P + 'vlastní řádek má rámeček a titul', ja.ramy === 1 && ja.ramPix > 20 && ja.titul === kat.titul, JSON.stringify(ja));
      ok(P + 'řádek bez vzhledu (jiná třída) je prostý a má prázdné místo', cy.ramy === 0 && cy.titul === null && cy.pets === 0 && cy.prazdnych === 1, JSON.stringify(cy));
      ok(P + 'starý server bez klíče look: prostý řádek s prázdným místem', sta.ramy === 0 && sta.titul === null && sta.prazdnych === 1, JSON.stringify(sta));
      ok(P + 'nepřátelský vzhled: žádný rámeček, titul ani mazlíček a žádná značka', zlo.ramy === 0 && zlo.titul === null && zlo.pets === 0 && zlo.imgs === 0 && kat.xss === 0, JSON.stringify([zlo, kat.xss]));
      ok(P + 'jméno s HTML je jen text', zlo.text === '<img src=x onerror=window.__xss=1>');
      ok(P + 'nic nevyčnívá z řádku', r.every(x => !x.prekryv), JSON.stringify(r.map(x => x.prekryv)));
      // překreslení nezdvojí ozdoby
      await page.evaluate(() => twRenderBoard());
      await page.waitForTimeout(250);
      const r2 = await radky(page);
      ok(P + 'překreslení žebříčku nezdvojí ozdoby', r2.length === 5 && r2[0].ramy === 1 && r2[0].pets === 1 && r2[1].prazdnych === 1 && r2[2].ramy === 1, JSON.stringify(r2.map(x => [x.ramy, x.pets, x.prazdnych])));
    }
  }
  ok(P + 'síň slávy zůstává prostá', kat.hall.ram === 0 && kat.hall.uid === 0 && /Síň Slávy/.test(kat.hall.txt), JSON.stringify(kat.hall));
  ok(P + 'žádná JS chyba', chyby.length === 0, chyby.join(' | '));
  await ctx.close();
  return fail - pred;
}

(async () => {
  console.log('\n── Věž: vzhled spolužáků v žebříčku sezóny ──\n');
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] });
  try {
    for (const N of [6, 7, 8, 9]) await kontroly(browser, base, N, 'tablet');
    await kontroly(browser, base, 9, 'telefon 360 px', 360);
    await kontroly(browser, base, 9, 'starý rpg-cloud.js', 480, 'stary-cloud');
    hl.forEach(l => console.log(l));
    const zaklad = fail;
    console.log(`  základ: ${pass} ✅ / ${zaklad} ❌`);
    hl.length = 0;

    console.log('\n── Sabotáže (9. ročník) ──');
    const HRA = 'rpg-mat-9.html', CLOUD = 'rpg-cloud.js';
    const SAB = [
      ['hra nevolá lookRadky', HRA, s => s.replace("RPGCloud.lookRadky(el,'[data-i]'", "RPGCloud.lookRadkyX(el,'[data-i]'")],
      ['řádek bez značky data-i', HRA, s => s.replace('<div data-i="\'+i+\'" style=', '<div style=')],
      ['jméno bez třídy tw-nm', HRA, s => s.replace('<span class="tw-nm" style=', '<span style=')],
      ['řádky bez prázdného místa', CLOUD, s => s.replace("sp.className = 'lk-av lk-prazdny'; sp.setAttribute('aria-hidden', 'true');\n        radek.insertBefore(sp, jm.closest('.lk-col') || jm);\n      });\n    } catch (e) { /* vzhled je jen ozdoba */ }", "sp.className = 'lk-av lk-prazdny'; sp.setAttribute('aria-hidden', 'true');\n      });\n    } catch (e) { /* vzhled je jen ozdoba */ }")],
      ['vzhled se zahazuje', CLOUD, s => s.replace('if (jm) lookDekoruj(radek, jm, getLook(radek));', 'if (jm) lookDekoruj(radek, jm, null);')]
    ];
    for (const [jm, soubor, fn] of SAB) {
      const orig = fs.readFileSync(path.join(ROOT, 'projects', soubor), 'utf8');
      const nove = fn(orig);
      if (nove === orig) { ok('sabotáž se neaplikovala: ' + jm, false); continue; }
      const s2 = await serve([[soubor, fn]]);
      const b2 = 'http://127.0.0.1:' + s2.address().port;
      const pred = fail; const predHl = hl.length;
      let vyjimka = false; SAB_BEZI = true;
      try { await kontroly(browser, b2, 9, 'SABOTÁŽ', 480); } catch (e) { vyjimka = true; }
      SAB_BEZI = false;
      const n = fail - pred + (vyjimka ? 1 : 0);
      // nezdary ze sabotáže se nepočítají jako chyba testu
      fail = pred; hl.length = predHl;
      ok('sabotáž chycena: ' + jm + ' (' + n + ' nezdarů)', n > 0);
      console.log('  ' + (n > 0 ? '✅' : '❌') + ' sabotáž chycena: ' + jm + ' (' + n + ' nezdarů)');
      s2.close();
    }
  } catch (e) {
    console.log('  ❌ výjimka testu: ' + String(e.message || e).slice(0, 400)); fail++;
  } finally { await browser.close(); srv.close(); }
  hl.forEach(l => console.log(l));
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: ' + pass + ' ✅  /  ' + fail + ' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
