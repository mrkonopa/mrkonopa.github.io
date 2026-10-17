/* ══════════════════════════════════════════════════════════════════════
   Přijímačky: světlý / tmavý vzhled (přepínač v horní liště).

   Co se slibuje a co se tu MĚŘÍ (každý bod má sabotáž na konci):
   1. výchozí je SVĚTLÝ a systémové nastavení tmavého se nesleduje,
   2. přepínač je na všech 7 stránkách, je to `role=switch`, jde ovládat
      klávesnicí a na dotyku má 44 px,
   3. volba se pamatuje v zařízení, nastaví se DŘÍV než se cokoli vykreslí
      (synchronní skript v <head> před styly — jinak by tmavá volba při každém
      načtení zablikala světle), propíše se do druhé karty a bez úložiště nespadne,
   4. tisk je vždy světlý a přepínač se netiskne,
   5. obrázky úloh se při přepnutí PŘEKRESLÍ (světlý vzhled je přebarvuje
      seznamem SVG_MAP, tmavý ne) a přepnutí tam a zpět dá původní obrázek,
   6. KONTRAST textu ≥ 4,5 : 1 (velký 3 : 1) v OBOU vzhledech na všech
      obrazovkách, kam se žák dostane (průchody z `pz-pruchody.cjs`, měřidlo
      z `kontrast-mer.cjs` — jedno místo, žádné kopie). Tmavý je navíc
      opravdu tmavý (pozadí stránky i karty), ne jen „bez chyb".

   Sabotáže se dělají PŘEPISEM odpovědi serveru (page.route), ne zásahem do
   souborů — nic se nedá zapomenout vrátit.
   Spusť: node tests/prijimacky-motiv.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const { ROOT, STRANKY } = require('./stranky.cjs');
const PZ = require('./pz-pruchody.cjs');
const { SKEN } = require('./kontrast-mer.cjs');
const { MOCK } = require('./pz-mock-cloud.cjs');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const STR = STRANKY.filter(s => /^pz-/.test(s.id));
const DIR = path.join(ROOT, 'projects', 'prijimacky-matematika');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const f = path.normalize(path.join(ROOT, u));
      if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(0, () => res(s));
  });
}

/* Nový kontext: jen naše stránky, volitelně uložená volba vzhledu a přepisy odpovědí. */
async function otevri(browser, base, url, { motiv, prepis = {}, viewport = { width: 1000, height: 900 }, dotyk = false, schema = 'light', bezUlozisteho = false, session } = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', colorScheme: schema, isMobile: dotyk, hasTouch: dotyk });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  for (const [koncovka, fn] of Object.entries(prepis)) {
    await ctx.route('**/' + koncovka, async r => {
      const res = await r.fetch(); const t = await res.text();
      await r.fulfill({ response: res, body: fn(t) });
    });
  }
  if (session !== undefined) await ctx.addInitScript('window.__SESSION = ' + JSON.stringify(session) + '; window.__CLOUD = null;' + MOCK);   // přihlášený žák bez sítě
  await ctx.addInitScript(([m, bez]) => {
    if (bez) { Object.defineProperty(window, 'localStorage', { get() { throw new Error('úložiště zablokováno'); } }); }
    else if (m && !sessionStorage.getItem('__motiv_seed')) { sessionStorage.setItem('__motiv_seed', '1'); localStorage.setItem('PZ_MOTIV', m); }
    document.addEventListener('DOMContentLoaded', () => { window.__motivPriDCL = document.documentElement.getAttribute('data-motiv'); });
  }, [motiv || null, bezUlozisteho]);
  const page = await ctx.newPage();
  await page.goto(base + url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  if (url.indexOf('doplnky') < 0) await page.waitForFunction(() => window.PZ, null, { timeout: 8000 });
  await page.waitForTimeout(250);
  return { ctx, page };
}

/* Obrazovky, které se měří: základ každé stránky + průchody z pz-pruchody.cjs (několik reprezentativních). */
function stavy() {
  const vyber = (seznam, kolik) => { const n = seznam.length; return [...new Set([0, Math.floor(n / 2), n - 2, n - 1].filter(i => i >= 0 && i < n))].slice(0, kolik).map(i => seznam[i]); };
  return {
    'pz-hub': [['základ', null]], 'pz-dopl': [['základ', null]], 'pz-proc': [['základ', null], ['úloha s řešením', 'proc']],
    'pz-test': [['brána', null]].concat(['běžící test', 'konstrukce přes celou obrazovku', 'rozbor'].map(k => [k, ['pz-test', k]])),
    'pz-diag': [['úvod', null]].concat(['úloha 1', 'úloha 2', 'úloha 3', 'konec'].map(k => [k, ['pz-diag', k]])),
    'pz-stat': [['prázdné', null], ['s daty', ['pz-stat', 's daty']]],
    'pz-konstr': [['základ', null]],            // typy a celá obrazovka se doplní z průchodu za běhu
  };
}

async function zmerStranku(browser, base, s, motiv, prepis) {
  const { ctx, page } = await otevri(browser, base, s.url, { motiv, prepis });
  const nalez = [], zprava = []; let mereno = 0, nejiste = 0, obrazovek = 0;
  const meri = async (popis, p = page) => {
    await p.waitForTimeout(250);
    await p.addStyleTag({ content: 'html,body{background-image:none!important}' });   // jemná zář pod textem by jinak vše označila za „neurčitelné"
    const r = await p.evaluate(SKEN);
    mereno += r.mereno; nejiste += r.nejiste; obrazovek++;
    r.nalezy.forEach(n => nalez.push({ ...n, kde2: s.id + ' · ' + popis }));
  };
  const plan = stavy()[s.id], pripraveno = new Set();
  try {
    for (const [popis, krok] of plan) {
      if (krok === 'proc') {
        await page.evaluate(() => { document.querySelectorAll('button.topic-card')[8].click(); grade(false); });
      } else if (Array.isArray(krok)) {
        const P = PZ[krok[0]];
        if (!pripraveno.has(krok[0])) { pripraveno.add(krok[0]); await page.evaluate(P.pripravit); }
        const d = await page.evaluate(P.prepnout, krok[1]);
        if (d) throw new Error('průchod: ' + d);
      }
      await meri(popis);
    }
    if (s.id === 'pz-hub' || s.id === 'pz-proc') {
      /* PŘIHLÁŠENÝ žák: e-mail a „Odhlásit" v liště, na hlavní stránce karta „Ulož si postup" a počítadla s daty.
         (Dotaz na dlouhý e-mail je i v prijimacky-uvod; tady jde o barvy.) */
      const x = await otevri(browser, base, s.url, { motiv, prepis, session: { user: { id: 'u1', email: 'zak.novak@husovaliberec.cz' } } });
      try {
        if (s.id === 'pz-hub') { await x.page.evaluate(PZ['pz-data'].pripravit); await x.page.reload({ waitUntil: 'domcontentloaded' }); await x.page.waitForTimeout(900); }
        else await x.page.waitForTimeout(700);
        // jistota, že se přihlášený stav opravdu vykreslil (jinak by se měřila prázdná lišta a test by byl slepý)
        if (!(await x.page.evaluate(() => document.body.textContent.includes('zak.novak@husovaliberec.cz')))) zprava.push(s.id + ': přihlášený stav se nezobrazil (e-mail není na stránce)');
        await meri('přihlášený žák' + (s.id === 'pz-hub' ? ' s daty' : ''), x.page);
      } finally { await x.ctx.close(); }
    }
    if (s.id === 'pz-konstr') {                 // několik typů úloh + celá obrazovka
      const P = PZ['pz-konstr'];
      const seznam = await page.evaluate(P.seznam);
      for (const k of [seznam[0], seznam[Math.floor(seznam.length / 2)], seznam[seznam.length - 2], 'celá obrazovka']) {
        const d = await page.evaluate(P.prepnout, k); if (d) throw new Error('průchod: ' + d);
        await meri('konstrukce · ' + k);
      }
    }
  } catch (e) { zprava.push(s.id + ': ' + String(e.message).slice(0, 100)); }
  await ctx.close();
  return { mereno, nejiste, obrazovek, nalez, zprava };
}

async function zmerVse(browser, base, motiv, prepis) {
  let mereno = 0, obrazovek = 0; const nalez = [], zprava = [];
  for (const s of STR) {
    const r = await zmerStranku(browser, base, s, motiv, prepis);
    mereno += r.mereno; obrazovek += r.obrazovek; nalez.push(...r.nalez); zprava.push(...r.zprava);
  }
  return { mereno, obrazovek, nalez, zprava };
}
const souhrn = nalez => { const m = new Map(); nalez.forEach(n => { const k = n.kde2 + ' | ' + n.kde + ' „' + n.txt + '“ ' + n.fg + ' na ' + n.bg + ' = ' + n.pom; if (!m.has(k)) m.set(k, 1); }); return [...m.keys()].sort(); };

/* ── Statické kontroly zdroje: pořadí v <head> ── */
function poradiVHead(html) {
  const head = html.slice(0, html.indexOf('</head>'));
  const iSk = head.indexOf('<script src="motiv.js"></script>');
  const prvniStyl = Math.min(...['<link rel="stylesheet"', '<link href=', '<style'].map(t => { const i = head.indexOf(t); return i < 0 ? Infinity : i; }));
  const iCss = head.lastIndexOf('<link rel="stylesheet" href="motiv.css">');
  const posledniStyl = Math.max(head.lastIndexOf('</style>'), head.lastIndexOf('<link rel="stylesheet" href="prijimacky.css">'));
  return { skriptPredStyly: iSk >= 0 && iSk < prvniStyl, cssPoStylech: iCss >= 0 && iCss > posledniStyl, jednou: head.split('motiv.js').length === 2 && head.split('motiv.css').length === 2 };
}

(async () => {
  console.log('\n── Přijímačky: světlý / tmavý vzhled ──\n');
  const srv = await serve(); const port = srv.address().port; const base = 'http://127.0.0.1:' + port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  try {
    /* 0. zdroj: skript je první a synchronní, styl poslední */
    console.log('· pořadí v <head>');
    for (const s of STR) {
      const html = fs.readFileSync(path.join(ROOT, s.url), 'utf8'), p = poradiVHead(html);
      ok(p.skriptPredStyly && p.cssPoStylech && p.jednou && !/<script[^>]*motiv\.js[^>]*(defer|async)/.test(html),
        s.id + ': motiv.js je synchronně PŘED styly (bez bliknutí) a motiv.css až po nich', JSON.stringify(p));
    }

    /* 1.–4. chování přepínače na každé stránce */
    console.log('· přepínač a paměť volby');
    for (const s of STR) {
      // výchozí světlý, i když systém hlásí tmavý
      let { ctx, page } = await otevri(browser, base, s.url, { schema: 'dark' });
      let r = await page.evaluate(() => ({ m: document.documentElement.dataset.motiv, n: document.querySelectorAll('.top-bar .pz-motiv').length,
        role: (document.querySelector('.pz-motiv') || {}).getAttribute && document.querySelector('.pz-motiv').getAttribute('role'),
        chk: document.querySelector('.pz-motiv') && document.querySelector('.pz-motiv').getAttribute('aria-checked'),
        bg: getComputedStyle(document.body).backgroundColor, pam: localStorage.getItem('PZ_MOTIV') }));
      ok(r.m === 'light' && r.n === 1 && r.role === 'switch' && r.chk === 'false' && r.pam === null,
        s.id + ': výchozí SVĚTLÝ i při systémovém tmavém, jeden přepínač (role=switch, vypnutý), nic se neukládá samo', JSON.stringify(r));
      const svetleBg = r.bg;
      // klik myší
      await page.click('.pz-motiv');
      r = await page.evaluate(() => ({ m: document.documentElement.dataset.motiv, chk: document.querySelector('.pz-motiv').getAttribute('aria-checked'),
        bg: getComputedStyle(document.body).backgroundColor, pam: localStorage.getItem('PZ_MOTIV'), cs: getComputedStyle(document.documentElement).colorScheme }));
      const lum = c => { const v = (c.match(/\d+/g) || []).slice(0, 3).map(Number); return (0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]) / 255; };
      ok(r.m === 'dark' && r.chk === 'true' && r.pam === 'dark' && lum(r.bg) < 0.12 && lum(svetleBg) > 0.7 && /dark/.test(r.cs),
        s.id + ': klik přepne na TMAVÝ (pozadí ' + r.bg + ' proti ' + svetleBg + '), uloží volbu a nastaví color-scheme', JSON.stringify(r));
      // po načtení zůstane (a atribut byl nastaven už při DOMContentLoaded)
      await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(200);
      r = await page.evaluate(() => ({ m: document.documentElement.dataset.motiv, dcl: window.__motivPriDCL, chk: document.querySelector('.pz-motiv').getAttribute('aria-checked') }));
      ok(r.m === 'dark' && r.dcl === 'dark' && r.chk === 'true', s.id + ': po načtení zůstane tmavý a atribut byl nastaven už při DOMContentLoaded', JSON.stringify(r));
      // klávesnice: Mezerník vrací zpět
      await page.focus('.pz-motiv'); await page.keyboard.press('Space');
      r = await page.evaluate(() => ({ m: document.documentElement.dataset.motiv, pam: localStorage.getItem('PZ_MOTIV') }));
      ok(r.m === 'light' && r.pam === 'light', s.id + ': Mezerník na zaostřeném přepínači vrátí světlý', JSON.stringify(r));
      await ctx.close();
    }

    // druhá karta, tisk, dotyk, bez úložiště — stačí na jedné stránce na každý bod (sdílený skript)
    {
      const { ctx, page } = await otevri(browser, base, '/projects/prijimacky-matematika/procvicovani.html');
      const druha = await ctx.newPage();
      await druha.goto(base + '/projects/prijimacky-matematika/statistiky.html', { waitUntil: 'domcontentloaded' });
      await page.click('.pz-motiv');
      // čeká se na PODMÍNKU s horní mezí, ne pevnou prodlevu (událost storage dorazí asynchronně)
      const prepnuta = await druha.waitForFunction(() => document.documentElement.dataset.motiv === 'dark', null, { timeout: 4000 }).then(() => true, () => false);
      ok(prepnuta, 'druhá otevřená karta se přepne taky (událost storage)');
      await page.emulateMedia({ media: 'print' });
      const t = await page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, txt: getComputedStyle(document.body).color,
        prep: getComputedStyle(document.querySelector('.pz-motiv')).display }));
      ok(t.bg === 'rgb(245, 240, 230)' && t.prep === 'none', 'TISK je světlý (' + t.bg + ') i při tmavé volbě a přepínač se netiskne', JSON.stringify(t));
      await ctx.close();
    }
    {
      const { ctx, page } = await otevri(browser, base, '/projects/prijimacky-matematika/index.html', { dotyk: true, viewport: { width: 360, height: 780 } });
      const b = await page.evaluate(() => { const r = document.querySelector('.pz-motiv').getBoundingClientRect(); return { h: r.height, w: r.width, doc: document.documentElement.scrollWidth }; });
      ok(b.h >= 44 && b.doc <= 360, 'dotyk: přepínač má ≥ 44 px (' + Math.round(b.h) + ') a stránka na 360 px nepřetéká (' + b.doc + ')', JSON.stringify(b));
      await ctx.close();
    }
    {
      const { ctx, page } = await otevri(browser, base, '/projects/prijimacky-matematika/statistiky.html', { bezUlozisteho: true });
      await page.click('.pz-motiv');
      ok(await page.evaluate(() => document.documentElement.dataset.motiv) === 'dark', 'bez úložiště: přepínač funguje (jen se nezapamatuje) a stránka nespadne');
      await ctx.close();
    }

    /* 5. obrázky úloh se překreslí a přepnutí tam a zpět dá původní obrázek */
    console.log('· obrázky úloh');
    async function obrazky(prepis) {
      const { ctx, page } = await otevri(browser, base, '/projects/prijimacky-matematika/procvicovani.html', { prepis });
      await page.evaluate(() => {
        const orig = PZ_TOPICS.item.bind(PZ_TOPICS);
        PZ_TOPICS.item = (id, u) => { for (let i = 0; i < 800; i++) { const it = orig(id, 'test'); if (it && it.svg && /#101a30|#16203a|#19e6e6|#4cc9f0|#39ff9e|#cfe8ff/.test(it.svg)) return it; } return orig(id, u); };
        document.querySelectorAll('button.topic-card')[8].click();
      });
      const cti = () => page.evaluate(() => { const e = document.querySelector('#pr-svg svg'); return e ? { html: e.outerHTML, id: e.getAttribute('data-pz-svg'), n: document.querySelectorAll('#pr-svg svg').length } : null; });
      const a = await cti(); await page.click('.pz-motiv'); const b = await cti(); await page.click('.pz-motiv'); const c = await cti();
      await ctx.close();
      return { a, b, c };
    }
    {
      const { a, b, c } = await obrazky({});
      ok(a && a.id && b && b.id === a.id && b.n === 1, 'obrázek úlohy nese značku a po přepnutí je pořád JEDEN a týž (id ' + (a && a.id) + ')');
      ok(a && b && a.html !== b.html, 'tmavý vzhled obrázek PŘEBARVÍ (světlý seznamem SVG_MAP, tmavý původní herní paletou)');
      ok(a && c && a.html === c.html, 'přepnutí tam a zpět vrátí původní světlý obrázek přesně');
    }
    // pokrytí: každý obrázek z banky i ze základu dostane značku (jinak by se při přepnutí nepřekreslil)
    {
      const { ctx, page } = await otevri(browser, base, '/projects/prijimacky-matematika/procvicovani.html');
      const r = await page.evaluate(() => {
        let n = 0, bez = [];
        const vez = (zdroj, svg) => { if (!svg) return; n++; if (!/^<svg data-pz-svg="\d+"/.test(PZ.themeSvg(svg))) bez.push(zdroj); };
        for (let i = 0; i < RPG_CERMAT_9.slotCount(); i++) for (let k = 0; k < 40; k++) { const t = RPG_CERMAT_9.genSlot(i); vez('pozice ' + (i + 1) + ' ' + (t.title || ''), t.svg); }
        for (const o of PZ_TOPICS.list) for (let k = 0; k < 40; k++) { const it = PZ_TOPICS.item(o.id, 'zaklad'); if (it) vez('základ ' + o.id, it.svg); }
        return { n, bez: [...new Set(bez)].slice(0, 5) };
      });
      ok(r.n > 300 && r.bez.length === 0, 'každý z ' + r.n + ' obrázků (banka + základ) dostane značku pro překreslení', r.bez.join(' | '));
      await ctx.close();
    }

    /* 6. kontrast: oba vzhledy, všechny obrazovky */
    console.log('· kontrast textu (WCAG AA) — měřím oba vzhledy na všech obrazovkách');
    const svetly = await zmerVse(browser, base, null, {});
    const tmavy = await zmerVse(browser, base, 'dark', {});
    for (const [jm, v] of [['SVĚTLÝ', svetly], ['TMAVÝ', tmavy]]) {
      ok(v.zprava.length === 0, jm + ': všechny obrazovky se daly otevřít (' + v.obrazovek + ')', v.zprava.join(' | '));
      ok(v.mereno > 1500, jm + ': proměřeno ' + v.mereno + ' textů na ' + v.obrazovek + ' obrazovkách (podlaha 1500 — nic nevidět by znamenalo slepý test)');
      const s = souhrn(v.nalez);
      ok(s.length === 0, jm + ': žádný text pod prahem WCAG AA', s.slice(0, 8).join('\n        ') + (s.length > 8 ? '\n        … a dalších ' + (s.length - 8) : ''));
    }

    /* 7. sabotáže: každá pojistka musí něco chytit */
    console.log('· sabotáže (přepis odpovědi serveru)');
    const jednou = (text, hledej) => text.split(hledej).length - 1 === 1;
    const css = fs.readFileSync(path.join(DIR, 'motiv.css'), 'utf8'), core = fs.readFileSync(path.join(DIR, 'prijimacky-core.js'), 'utf8'), js = fs.readFileSync(path.join(DIR, 'motiv.js'), 'utf8');
    const S = [
      ['bílá karta v tmavém vzhledu (světlý text na bílém)', 'motiv.css', css, '--card:#1b2130;', '--card:#ffffff;', 'kontrast'],
      ['rýsovací plocha není světlý ostrůvek (text na bílém papíru dědí světlou barvu)', 'motiv.css', css, 'html[data-motiv="dark"] .ggb-wrap, html[data-motiv="dark"] .kn-svg {', 'html[data-motiv="dark"] .ggb-wrap {', 'kontrast'],
      ['chybí token --on-accent (bílý text na světle modrém tlačítku)', 'motiv.css', css, '    --on-accent:#0b1424;', '    /* --on-accent chybí */', 'kontrast'],
      ['tmavý blok mimo @media not print (tisk by byl tmavý)', 'motiv.css', css, '@media not print {', '@media all {', 'tisk'],
      ['tmavý vzhled přebarvuje obrázky seznamem SVG_MAP', 'prijimacky-core.js', core, "if (!jeTmavy()) for (const [a, b] of SVG_MAP)", "if (true) for (const [a, b] of SVG_MAP)", 'obrazky'],
      ['volba se neukládá', 'motiv.js', js, "try { localStorage.setItem(KLIC, m); }", "try { 0; }", 'pamet'],
    ];
    for (const [popis, koncovka, zdroj, hledej, nahrad, co] of S) {
      ok(jednou(zdroj, hledej), 'sabotáž „' + popis + '“ se aplikuje (nalezeno právě 1×)');
      if (!jednou(zdroj, hledej)) continue;
      const prepis = { [koncovka]: t => t.replace(hledej, nahrad) };
      let chyceno = false, jak = '';
      if (co === 'kontrast') { const v = await zmerVse(browser, base, 'dark', prepis); chyceno = souhrn(v.nalez).length > 0; jak = souhrn(v.nalez)[0] || ''; }
      else if (co === 'tisk') {
        const { ctx, page } = await otevri(browser, base, '/projects/prijimacky-matematika/procvicovani.html', { motiv: 'dark', prepis });
        await page.emulateMedia({ media: 'print' }); const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        chyceno = bg !== 'rgb(245, 240, 230)'; jak = 'pozadí při tisku ' + bg; await ctx.close();
      } else if (co === 'obrazky') { const { a, b } = await obrazky(prepis); chyceno = !(a && b && a.html !== b.html); jak = 'obrázek se nepřebarvil'; }
      else if (co === 'pamet') {
        const { ctx, page } = await otevri(browser, base, '/projects/prijimacky-matematika/statistiky.html', { prepis });
        await page.click('.pz-motiv'); await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(200);
        const m = await page.evaluate(() => document.documentElement.dataset.motiv); chyceno = m !== 'dark'; jak = 'po načtení je ' + m; await ctx.close();
      }
      ok(chyceno, 'sabotáž „' + popis + '“ je chycena (' + jak.slice(0, 90) + ')');
    }
    // zdrojová kontrola pořadí: skript za styly / css před styly musí propadnout
    {
      const html = fs.readFileSync(path.join(ROOT, STR[1].url), 'utf8');
      const spatne = html.replace('<script src="motiv.js"></script>\n', '').replace('<link rel="stylesheet" href="prijimacky.css">', '<link rel="stylesheet" href="prijimacky.css">\n<script src="motiv.js"></script>');
      const p = poradiVHead(spatne);
      ok(spatne !== html && !p.skriptPredStyly, 'sabotáž „skript až za styly“ je chycena (pořadí v <head>)');
    }
  } finally { await browser.close(); srv.close(); }

  console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
