/* ══════════════════════════════════════════════════════════════════
   Hlavní stránka přijímaček: karta „Ulož si postup“ (přihlášení) a počítadla
   pod kartami (testy, procvičování, diagnostika, připravenost).

   Co se hlídá a PROČ:
   1. čísla na kartách se dopočítají NEZÁVISLE z nasazených dat (test si je spočítá
      sám z toho, co do localStorage vložil, ne z `PZ.souhrn()`);
   2. animace opravdu BĚŽÍ (v půlce je číslo mezi nulou a cílem) a DOBĚHNE na přesné
      cílové číslo; pod `prefers-reduced-motion` se ukáže hned;
   3. karta má tři stavy: bez cloudu skrytá (stránka běží jako dřív), odhlášený = nabídka
      s přihlášením, přihlášený = e-mail a Odhlásit; tlačítka volají RPGCloud;
   4. e-mail z přihlášení se NEvkládá jako HTML (podvržený účet) a dlouhý e-mail nerozbije
      rozvržení — a to na VŠECH stránkách s přihlašovací lištou (před opravou měly přihlášené
      děti na telefonu 656 px široké stránky, žádný test neměřil přihlášeného);
   5. podvržená / poškozená data (řetězce, záporná čísla, NaN, obří čísla) nikdy nevyrobí
      „NaN“ ani výjimku;
   6. čtečka dostane celou větu s konečnými čísly, ne počítání.

   Sabotáže jsou na konci (obnova v `finally`, po konci porovnání souboru).
   Spusť: node tests/prijimacky-uvod.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const STR = path.join(ROOT, 'projects', 'prijimacky-matematika');
/* Pojistná záloha sabotovaných souborů. `finally` nepomůže, když se proces ZABIJE (Ctrl+C, vypršený limit):
   jednou tak zůstala v kódu sabotáž „animace končí o 1 níž“ a skončila v commitu. Záloha leží vedle testu
   (je v .gitignore); každý další běh ji NAJDE, soubory obnoví a nahlas selže. */
const POJISTKA = path.join(__dirname, '.uvod-sabotaz-zaloha.json');
function obnovZPojistky() {
  if (!fs.existsSync(POJISTKA)) return false;
  const z = JSON.parse(fs.readFileSync(POJISTKA, 'utf8'));
  for (const f of Object.keys(z)) fs.writeFileSync(f, z[f]);
  fs.unlinkSync(POJISTKA);
  return true;
}
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { try { obnovZPojistky(); } catch (e) { /* nic dalšího se dělat nedá */ } process.exit(130); });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

function serve() {
  return new Promise(res => {
    const s = http.createServer((q, p) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
      p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(p);
    });
    s.listen(0, () => res(s));
  });
}

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

// Mock Supabase (sdílený modul): session podle `window.__SESSION`, RPC volání se počítají.
const { MOCK } = require('./pz-mock-cloud.cjs');

// Data, která žák „už udělal“. Čísla v očekávání níže se počítají z TÉHO SAMÉHO pole, ale vlastním kódem testu.
const DATA = {
  attempts: [{ date: '2026-09-20', t: 1, score: 31, max: 50 }, { date: '2026-10-01', t: 2, score: 36, max: 50 }, { date: '2026-10-10', t: 3, score: 39, max: 50 }],
  practice: { rovnice: { ok: 40, total: 52 }, zlomky: { ok: 30, total: 41 }, procenta: { ok: 22, total: 35 }, konstrukce: { ok: 6, total: 9 } },
  diag: { date: '2026-10-05', topics: [{ id: 'rovnice', level: 3 }, { id: 'zlomky', level: 3 }, { id: 'procenta', level: 2 }, { id: 'pomer', level: 1 }, { id: 'telesa', level: 0 }, { id: 'data', level: 3 }] }
};
// Nezávislý dopočet (jiný kód než PZ.souhrn): medián posledních tří testů, součty procvičování, okruhy na úrovni 3.
function ocekavane(d) {
  const sk = d.attempts.map(a => a.score).slice(-3).sort((a, b) => a - b);
  const odhad = sk.length % 2 ? sk[sk.length >> 1] : (sk[sk.length / 2 - 1] + sk[sk.length / 2]) / 2;
  let uloh = 0, ok_ = 0; Object.values(d.practice).forEach(v => { uloh += v.total; ok_ += v.ok; });
  return {
    testy: d.attempts.length, odhad, uloh, uspesnost: Math.round(ok_ / uloh * 100),
    zvladas: d.diag.topics.filter(t => t.level === 3).length, okruhu: d.diag.topics.length,
    pripravenost: Math.round(odhad / 50 * 100)
  };
}
// Jen JEDNOU za kartu: init skript běží i po znovunačtení (např. po odhlášení) a smazaná data by vrátil.
const seed = (d, extra) => `
if (!sessionStorage.getItem('__SEEDED')) { sessionStorage.setItem('__SEEDED', '1');
localStorage.setItem('PZ_CERMAT_ATTEMPTS', ${JSON.stringify(JSON.stringify(d.attempts))});
localStorage.setItem('PZ_PRACTICE_PROGRESS', ${JSON.stringify(JSON.stringify(d.practice))});
localStorage.setItem('PZ_DIAG_LAST', ${JSON.stringify(JSON.stringify(d.diag))});
${extra || ''} }`;

(async () => {
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port + '/projects/prijimacky-matematika/';
  const browser = await chromium.launch({ executablePath: EXEC });
  const chyby = [];

  async function otevri({ sirka = 1000, session, cloud, data, bezCloudu, reduced, cil = 'index.html', init = '' } = {}) {
    const ctx = await browser.newContext({ viewport: { width: sirka, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
    if (!bezCloudu) await ctx.addInitScript('window.__SESSION = ' + JSON.stringify(session === undefined ? null : session) + '; window.__CLOUD = ' + JSON.stringify(cloud || null) + ';' + MOCK);
    if (data) await ctx.addInitScript(seed(data, init));
    const pg = await ctx.newPage(); pg.on('pageerror', e => chyby.push(e.message));
    await pg.goto(base + cil, { waitUntil: 'domcontentloaded' });
    return { ctx, pg };
  }
  const hodnoty = pg => pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('.pz-cnt')].map(e => [e.dataset.k, e.textContent])));
  const cekej = (pg, ms = 4000) => pg.waitForFunction(() => document.querySelectorAll('.pz-cnt').length >= 7, null, { timeout: ms });
  const hotovo = (pg) => pg.waitForFunction(() => [...document.querySelectorAll('.pz-cnt')].every(e => e.textContent.replace(',', '.') === String(Number(e.dataset.to))), null, { timeout: 6000 }).then(() => true, () => false);

  console.log('\n── Hlavní stránka přijímaček: přihlášení a počítadla ──\n');
  // Potomek (běží nad sabotovaným kódem schválně) zálohu nechává být; hlavní běh ji vyřeší hned na začátku.
  if (!process.argv.includes('--bez-sabotazi')) ok(!obnovZPojistky(), 'předchozí běh nebyl přerušen uprostřed sabotáže (jinak by v souborech zůstala sabotáž — soubory obnoveny, zkontroluj git diff)');
  if (process.env.UVOD_JEN_POJISTKA) { console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n'); process.exit(fail ? 1 : 0); }   // jen pro zkoušku samotné pojistky
  const E = ocekavane(DATA);

  /* ── 1) Odhlášený, s daty: čísla doběhnou na NEZÁVISLE spočtené hodnoty ── */
  {
    const { ctx, pg } = await otevri({ data: DATA });
    await cekej(pg);
    await pg.evaluate(() => document.querySelector('.hub-grid').scrollIntoView());
    ok(await hotovo(pg), 'všechna čísla doběhla na svůj cíl (data-to)');
    const h = await hodnoty(pg);
    const odhad = String(E.odhad).replace('.', ',');
    ok(h.testy === String(E.testy) && h.odhad === odhad && h.uloh === String(E.uloh) && h.uspesnost === String(E.uspesnost) &&
      h.zvladas === String(E.zvladas) && h.okruhu === String(E.okruhu) && h.pripravenost === String(E.pripravenost),
      'čísla doběhla na hodnoty spočtené z dat (testy ' + E.testy + ', odhad ' + odhad + ', úloh ' + E.uloh + ', ' + E.uspesnost + ' %, ' + E.zvladas + ' z ' + E.okruhu + ', připravenost ' + E.pripravenost + ' %)', JSON.stringify(h));
    const sklon = await pg.evaluate(() => [...document.querySelectorAll('[data-pz-stat]:not([hidden]) > span[aria-hidden]')].map(e => e.textContent.replace(/\s+/g, ' ')));
    ok(sklon.length === 4, 'všechny čtyři karty mají počítadlo', sklon.join(' | '));
    ok(/\b3 testy\b/.test(sklon[0]) && /137 úloh/.test(sklon[1]) && /3 z 6 okruhů/.test(sklon[2]), 'česky se skloňuje (3 testy, 137 úloh, 3 z 6 okruhů)', sklon.join(' | '));
    const veta = await pg.evaluate(() => [...document.querySelectorAll('[data-pz-stat] .vh')].map(e => e.textContent));
    ok(veta.length === 4 && veta.every(v => /\d/.test(v) && !/NaN|undefined/.test(v)), 'čtečka dostane větu s konečnými čísly', veta.join(' | '));
    ok(await pg.evaluate(() => [...document.querySelectorAll('[data-pz-stat] > span[aria-hidden="true"]')].length === 4), 'počítající část je pro čtečku skrytá (aria-hidden)');
    const bar = await pg.evaluate(() => document.querySelector('.pz-bar i').style.width);
    ok(bar === E.pripravenost + '%', 'proužek připravenosti končí na ' + E.pripravenost + ' %', bar);
    ok(await pg.evaluate(() => getComputedStyle(document.querySelector('#pz-ucet')).display !== 'none' && !!document.querySelector('#acct-login')), 'odhlášený vidí kartu s tlačítkem přihlášení');
    const text = await pg.evaluate(() => document.querySelector('#pz-ucet').textContent);
    ok(/ZŠ Husova/.test(text) && /@husovaliberec\.cz/.test(text) && /Bez přihlášení všechno funguje/.test(text), 'karta říká komu je přihlášení určené a že bez něj vše funguje');
    await pg.click('#acct-login');
    ok(await pg.evaluate(() => window.__VOLANI.login) === 1, 'tlačítko „Přihlásit“ zavolá přihlášení (RPGCloud.login)');
    ok(await pg.evaluate(() => getComputedStyle(document.querySelector('.top-bar #pz-login')).display === 'none'), 'malé přihlášení v horní liště se na hlavní stránce nezdvojuje');
    await ctx.close();
  }

  /* ── 2) Animace opravdu běží: v půlce je číslo mezi nulou a cílem ── */
  {
    const { ctx, pg } = await otevri({ data: DATA });
    await cekej(pg);
    const vzorky = [];
    await pg.evaluate(() => document.querySelector('.hub-grid').scrollIntoView());
    for (let i = 0; i < 14; i++) { vzorky.push(Number((await hodnoty(pg)).uloh.replace(/\s/g, ''))); await pg.waitForTimeout(80); }
    const konec = vzorky[vzorky.length - 1];
    ok(vzorky.some(v => v > 0 && v < E.uloh), 'číslo se během animace pohybuje mezi nulou a cílem (' + vzorky.slice(0, 8).join(', ') + ' …)');
    ok(vzorky.every((v, i) => !i || v >= vzorky[i - 1]), 'číslo jen roste (nikdy neskočí zpět)');
    ok(await hotovo(pg) && Number((await hodnoty(pg)).uloh) === E.uloh && konec <= E.uloh, 'animace doběhne přesně na ' + E.uloh);
    await ctx.close();
  }

  /* ── 3) Omezení pohybu: hned konečné číslo, proužek bez přechodu ── */
  {
    const { ctx, pg } = await otevri({ data: DATA, reduced: true });
    await cekej(pg);
    const h = await hodnoty(pg);
    ok(h.uloh === String(E.uloh) && h.testy === String(E.testy), 'při omezení pohybu jsou čísla hned konečná (bez počítání)', JSON.stringify(h));
    ok(await pg.evaluate(() => getComputedStyle(document.querySelector('.pz-bar i')).transitionDuration.split(',').every(t => parseFloat(t) === 0)), 'proužek připravenosti se při omezení pohybu neanimuje');
    await ctx.close();
  }

  /* ── 4) Přihlášený: e-mail, Odhlásit, synchronizace přepočítá čísla z cloudu ── */
  {
    const cloud = { attempts: [{ date: '2026-10-12', t: 9, score: 44, max: 50 }], practice: { rovnice: { ok: 40, total: 52 } }, diag: null };
    const { ctx, pg } = await otevri({ data: DATA, session: { user: { id: 'u1', email: 'zak.novak@husovaliberec.cz' } }, cloud });
    await pg.waitForSelector('#acct-logout', { timeout: 5000 });
    ok((await pg.textContent('#pz-ucet')).includes('zak.novak@husovaliberec.cz'), 'přihlášený vidí svůj e-mail na kartě');
    ok(/ukládají do cloudu/.test(await pg.textContent('#pz-ucet')), 'karta říká, že se postup ukládá');
    await pg.waitForFunction(() => /Synchronizováno/.test(document.querySelector('#acct-stav') ? document.querySelector('#acct-stav').textContent : ''), null, { timeout: 5000 });
    ok(true, 'po synchronizaci karta potvrdí „✓ Synchronizováno“');
    await pg.evaluate(() => document.querySelector('.hub-grid').scrollIntoView());   // karty mimo záběr se nepočítají, dokud nejsou vidět
    await hotovo(pg);   // výsledek ověřuje kontrola níž (počet testů)
    const h = await hodnoty(pg);
    ok(Number(h.testy) === 4, 'po synchronizaci se čísla přepočítají (cloudový test se přidal: 3 → 4)', JSON.stringify(h));
    await pg.click('#acct-logout');
    // Odhlášení stránku po signOut znovu načte, proto se volání počítá v sessionStorage (přežije načtení).
    const odhlaseno = await pg.waitForFunction(() => sessionStorage.getItem('__LOGOUT') === '1', null, { timeout: 5000 }).then(() => true, () => false);
    ok(odhlaseno, 'tlačítko „Odhlásit“ zavolá odhlášení');
    await ctx.close();
  }

  /* ── 4b) Odhlášení na sdíleném tabletu smaže VEŠKERÝ postup v zařízení ──
     Vojtův požadavek: další dítě na tomtéž tabletu nesmí zdědit cizí výsledky ani je nahrát do svého cloudu
     (stejná vada se v RPG hrách dělala). Smazat se musí všech pět datových klíčů přijímaček i značka vlastníka;
     nastavení zařízení (tloušťka čar v konstrukcích) zůstává. */
  {
    const PZ_KLICE = ['PZ_CERMAT_ATTEMPTS', 'PZ_PRACTICE_PROGRESS', 'PZ_DIAG_LAST', 'PZ_TEST_TOPICS', 'PZ_TEST_RUN'];
    const extra = "localStorage.setItem('RPG_CLOUD_OWNER','u1'); localStorage.setItem('PZ_TEST_TOPICS','{\"rovnice\":{\"ok\":1,\"total\":2}}'); " +
      "localStorage.setItem('PZ_TEST_RUN','{\"v\":1}'); localStorage.setItem('PZ_KN_CARY','2');";
    const { ctx, pg } = await otevri({ data: DATA, init: extra, session: { user: { id: 'u1', email: 'zak@husovaliberec.cz' } }, cloud: { attempts: DATA.attempts, practice: DATA.practice, diag: DATA.diag } });
    await pg.waitForSelector('#acct-logout', { timeout: 5000 });
    const pred = await pg.evaluate(k => k.map(x => localStorage.getItem(x) !== null), PZ_KLICE);
    ok(pred.every(Boolean), 'před odhlášením je v zařízení všech 5 klíčů s výsledky přijímaček');
    await pg.click('#acct-logout');
    await pg.waitForSelector('#acct-login', { timeout: 8000 });      // stránka se po odhlášení znovu načetla a žák je odhlášený
    await pg.waitForTimeout(500);
    const po = await pg.evaluate(k => ({ klice: k.map(x => localStorage.getItem(x)), vlastnik: localStorage.getItem('RPG_CLOUD_OWNER'), cary: localStorage.getItem('PZ_KN_CARY'),
      pocitadla: document.querySelectorAll('.pz-cnt').length, skryta: [...document.querySelectorAll('[data-pz-stat]')].every(e => e.hidden) }), PZ_KLICE);
    ok(po.klice.every(v => v === null), 'po odhlášení je v zařízení smazáno všech 5 klíčů s výsledky', JSON.stringify(po.klice));
    ok(po.vlastnik === null, 'po odhlášení je smazaná i značka vlastníka zařízení (další žák si zařízení převezme čistě)');
    ok(po.cary === '2', 'nastavení zařízení (tloušťka čar) zůstává, není to postup žáka');
    ok(po.pocitadla === 0 && po.skryta, 'na hlavní stránce po odhlášení nezůstala žádná čísla předchozího žáka');
    await ctx.close();
  }

  /* ── 5) Bez cloudu: karta skrytá, počítadla dál fungují ── */
  {
    const { ctx, pg } = await otevri({ data: DATA, bezCloudu: true });
    await cekej(pg);
    await pg.waitForTimeout(300);
    ok(await pg.evaluate(() => document.querySelector('#pz-ucet').hidden), 'bez cloudu je karta s přihlášením skrytá');
    ok(Number((await hodnoty(pg)).testy.replace(/\s/g, '')) >= 0 && (await hodnoty(pg)).uloh !== undefined, 'počítadla fungují i bez cloudu');
    await ctx.close();
  }

  /* ── 6) Prázdná data: žádná počítadla, žádné „0 úloh“ ── */
  {
    const { ctx, pg } = await otevri({});
    await pg.waitForSelector('#acct-login', { timeout: 5000 });
    ok(await pg.evaluate(() => [...document.querySelectorAll('[data-pz-stat]')].every(e => e.hidden && e.innerHTML === '')), 'bez dat nejsou na kartách žádná počítadla');
    await ctx.close();
  }

  /* ── 7) Podvržená data: žádné NaN, žádná výjimka ── */
  {
    const zla = {
      attempts: [{ date: 'x', score: 'abc', max: -5 }, null, 'text', { score: 1e99, max: 50 }],
      practice: { rovnice: { ok: 'a', total: -3 }, zlomky: { ok: 1e300, total: 5 }, procenta: null, '__proto__': { ok: 1, total: 1 } },
      diag: { topics: [{ id: '<img src=x onerror=alert(1)>', level: 99 }, { id: 'zlomky', level: 'x' }] }
    };
    const { ctx, pg } = await otevri({ data: zla });
    await pg.waitForTimeout(800);
    const t = await pg.evaluate(() => document.querySelector('.hub-grid').innerText);
    ok(!/NaN|undefined|Infinity|\[object/.test(t), 'poškozená data nevyrobí NaN, Infinity ani undefined na kartách', t.replace(/\s+/g, ' ').slice(0, 120));
    ok(await pg.evaluate(() => !document.querySelector('.hub-grid img')), 'podvržený název okruhu se nevloží jako HTML');
    await ctx.close();
  }

  /* ── 8) Podvržený e-mail: nevloží se jako HTML ── */
  {
    const { ctx, pg } = await otevri({ session: { user: { id: 'u1', email: '<img src=x onerror="window.__XSS=1">@husovaliberec.cz' } } });
    await pg.waitForTimeout(800);
    ok(await pg.evaluate(() => !window.__XSS && !document.querySelector('#pz-ucet img') && !document.querySelector('#pz-login img')), 'e-mail s HTML se nevykoná ani nevykreslí jako prvek');
    await ctx.close();
  }

  /* ── 9) Přetečení: přihlášený s dlouhým e-mailem na telefonu, všechny stránky s lištou ── */
  {
    const mail = 'zak.novak.s.opravdu.dlouhym.jmenem@husovaliberec.cz';
    const nadlimit = [];
    for (const f of ['index.html', 'statistiky.html', 'test.html', 'procvicovani.html', 'diagnostika.html', 'konstrukce.html']) {
      for (const w of [360, 380]) {
        const { ctx, pg } = await otevri({ sirka: w, cil: f, data: DATA, session: { user: { id: 'u1', email: mail } } });
        await pg.waitForTimeout(900);
        const r = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
        if (r.sw > r.cw + 1) nadlimit.push(f + ' ' + w + ' px: stránka je široká ' + r.sw);
        await ctx.close();
      }
    }
    ok(nadlimit.length === 0, 'přihlášený s dlouhým e-mailem nemá na telefonu vodorovně posuvnou stránku (6 stránek × 360 a 380 px)', nadlimit.join(' | '));
  }

  ok(chyby.length === 0, 'žádná JS chyba na stránkách (' + chyby.length + ')', chyby.slice(0, 2).join(' | '));
  await browser.close(); srv.close();

  // Potomek spuštěný ze sabotáží (níž) jen změří rozbitý kód a skončí — bez dalších sabotáží.
  if (process.argv.includes('--bez-sabotazi')) { console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n'); process.exit(fail ? 1 : 0); }

  /* ── 10) Sabotáže: každá pojistka musí něco chytit ── */
  const soubory = { core: path.join(STR, 'prijimacky-core.js'), css: path.join(STR, 'prijimacky.css'), idx: path.join(STR, 'index.html'), cloud: path.join(ROOT, 'projects', 'rpg-cloud.js') };
  const zaloha = Object.fromEntries(Object.entries(soubory).map(([k, f]) => [k, fs.readFileSync(f, 'utf8')]));
  const SAB = [
    ['souhrn počítá správné odpovědi místo všech úloh', 'core', 'uloh += t; spravne +=', 'uloh += Math.floor(num(v.ok)); spravne +=', /137 úloh|čísla doběhla/],
    ['animace nikdy nedoběhne na cíl', 'core', 'el.textContent = cislo(x >= 1 ? to : od + (to - od) * e, dec);', 'el.textContent = cislo(x >= 1 ? to - 1 : od + (to - od) * e, dec);', /doběhla|doběhne/],
    ['omezení pohybu se ignoruje', 'core', "if (bezPohybu() || od === to ||", "if (od === to ||", /omezení pohybu/],
    ['tlačítko přihlášení nic nevolá', 'core', "host.querySelector('#acct-login').onclick = () => RPGCloud.login();", "host.querySelector('#acct-login').onclick = () => {};", /zavolá přihlášení/],
    ['e-mail se vkládá jako HTML', 'core', "esc(u.email || 'školní účet')", "(u.email || 'školní účet')", /e-mail s HTML/],
    ['počítající číslo čte čtečka', 'core', '<span aria-hidden="true">\' + d.html', '<span>\' + d.html', /skrytá \(aria-hidden\)/],
    // Dvě opravy lišty se navzájem zastupují (každá sama stačí), proto se vrací obě naráz — to je původní stav, kde měl přihlášený žák 656 px.
    ['přihlašovací lišta se zase nezalamuje (původní stav)', 'core',
      ["margin-left:auto;display:inline-flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:6px 10px;min-width:0;max-width:100%;font-size:.85rem", "style=\"color:var(--muted);min-width:0;overflow-wrap:anywhere\""],
      ["margin-left:auto;display:inline-flex;align-items:center;gap:10px;font-size:.85rem", "style=\"color:var(--muted)\""], /vodorovně posuvnou/],
    ['odhlášení nesmaže rozepsaný test', 'cloud', "/^PZ_(CERMAT_ATTEMPTS|PRACTICE_PROGRESS|DIAG_LAST|TEST_TOPICS|TEST_RUN)$/.test(k)", "/^PZ_(CERMAT_ATTEMPTS|PRACTICE_PROGRESS|DIAG_LAST|TEST_TOPICS)$/.test(k)", /smazáno všech 5 klíčů/],
    ['odhlášení nesmaže vůbec nic', 'cloud', "function smazOsobni() { for (const k of osobniKlice()) { try { localStorage.removeItem(k); } catch (e) {} } }", "function smazOsobni() { }", /smazáno všech 5 klíčů/],
    ['karta se po synchronizaci nepřepočítá', 'core', "nastavStav('✓ Synchronizováno'); vykresliSouhrn();", "nastavStav('✓ Synchronizováno');", /přepočítají/]
  ];
  console.log('\n  — sabotáže —');
  const { spawnSync } = require('child_process');
  fs.writeFileSync(POJISTKA, JSON.stringify(zaloha));
  try {
    for (const [popis, kdo, hledej, nahrad, vzor] of SAB) {
      const H = [].concat(hledej), N = [].concat(nahrad);
      const pocty = H.map(h => zaloha[kdo].split(h).length - 1);
      ok(pocty.every(n => n === 1), 'sabotáž „' + popis + '“ se aplikovala (' + pocty.join('+') + '× nalezeno)');
      if (!pocty.every(n => n === 1)) continue;
      let zmeneno = zaloha[kdo]; H.forEach((h, i) => { zmeneno = zmeneno.replace(h, () => N[i]); });
      fs.writeFileSync(soubory[kdo], zmeneno);
      const r = spawnSync(process.execPath, [__filename, '--bez-sabotazi'], { encoding: 'utf8', timeout: 240000 });
      const vystup = (r.stdout || '') + (r.stderr || '');
      const padlo = (vystup.match(/❌ [^\n]*/g) || []);
      ok(r.status !== 0 && padlo.some(l => vzor.test(l)), 'sabotáž „' + popis + '“ je chycena', padlo.length ? 'padlo jiné: ' + padlo[0].slice(0, 90) : 'test prošel i nad rozbitým kódem');
      fs.writeFileSync(soubory[kdo], zaloha[kdo]);
    }
  } finally {
    for (const k of Object.keys(soubory)) fs.writeFileSync(soubory[k], zaloha[k]);
    try { fs.unlinkSync(POJISTKA); } catch (e) { /* už není */ }
  }
  ok(Object.keys(soubory).every(k => fs.readFileSync(soubory[k], 'utf8') === zaloha[k]), 'po sabotážích jsou všechny soubory zpět beze změny');

  console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
