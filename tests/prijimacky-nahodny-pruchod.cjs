/* ═════════════════════════════════════════════════════════════════
   Náhodný průchod PŘIJÍMAČKAMI — „dítě“ (generátor s pevným semínkem) ťuká na cokoli, co je vidět, píše do polí
   i nesmysly, vybírá z nabídek, čas od času stránku znovu načte. Po každém kroku musí platit:
     1) žádná neošetřená výjimka ani `console.error` (kromě blokovaných cizích zdrojů);
     2) stránka nepřetéká do šířky (scrollWidth ≤ šířka okna + 1);
     3) ve viditelném textu není „undefined“, „NaN“, „[object Object]“ ani „null“;
     4) žádný viditelný obrázek (`svg`) není prázdný;
     5) stránka NEZAMRZLA — hlavní vlákno odpoví do 4 s (zacyklený generátor typu gen14f, který zastaví prohlížeč);
     6) po každém kroku existuje aspoň jeden viditelný a povolený ovladač (slepá ulička).
   Vzor je z RPG (`nahodny-pruchod.cjs`: tam tak našlo mrtvé tlačítko ÚTOK, které scénářové testy obešly,
   protože volaly funkce místo ťukání). Scénářové testy přijímaček procházejí cesty, které jsme vymysleli;
   tohle zkouší i ty, které nikoho nenapadly (dvojí odeslání, odeslání prázdna, návrat uprostřed testu).

   Jádro (`projdi`) používá brána (prijimacky-nahodny-pruchod.test.cjs) i ruční nástroj
   (node tools/prijimacky-nahodny-pruchod.cjs [stránka] [semínko] [kroků], PNP_ZAZNAM=1 vypíše kroky).
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');                    // NIKDY natvrdo /home/user — CI má jinou cestu
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
const DIR = '/projects/prijimacky-matematika/';
const STRANKY = { index: 'index.html', procvicovani: 'procvicovani.html', diagnostika: 'diagnostika.html', test: 'test.html', statistiky: 'statistiky.html', konstrukce: 'konstrukce.html' };
const ROZMERY = { tel: [360, 740], tab: [820, 1180] };
const TEXTY = ['', '0', '5', '12', '-3', '1/2', '3,5', '1 500', '2 cm', 'abc', '😀', '9'.repeat(40), '<b>x</b>', "'\"", '4/3 p', '6; 10', 'A', 'N'];

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* prepis: { 'procvicovani.html': [hledej, nahrad] } — odpověď serveru se přepíše (sabotáž BEZ zásahu do souborů);
   `s.prepsano` počítá, kolikrát se přepis uplatnil (0 = sabotáž se neaplikovala a nic nedokazuje). */
function server(prepis) {
  return new Promise(res => {
    const s = http.createServer((q, p) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
      p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      const pr = prepis && prepis[path.basename(fp)];
      if (pr) { const t = fs.readFileSync(fp, 'utf8'); if (t.includes(pr[0])) s.prepsano++; return p.end(t.replace(pr[0], () => pr[1])); }
      fs.createReadStream(fp).pipe(p);
    });
    s.prepsano = 0;
    s.listen(0, () => res(s));
  });
}

/* ve stránce: seznam ovladačů, které dítě vidí, a kontroly po kroku */
const VE_STRANCE = `(function () {
  const viditelny = el => {
    const c = getComputedStyle(el), r = el.getBoundingClientRect();
    return c.display !== 'none' && c.visibility !== 'hidden' && parseFloat(c.opacity) > 0.3 && r.width >= 4 && r.height >= 4 && !el.closest('[hidden]');
  };
  const SEL = 'button, a[href], input, select, textarea, summary, [role=button], [role=switch]';
  window.__ovladace = function () {
    if (!document.body) return [];
    return [...document.querySelectorAll(SEL)].filter(el => {
      if (!viditelny(el) || el.disabled) return false;
      if (el.tagName === 'A') { const h = el.getAttribute('href') || ''; let p = ''; try { p = new URL(el.href).pathname; } catch (e) {} if (/^(mailto:|tel:|#?$)/.test(h) || p.indexOf(window.__SEKCE || '/projects/prijimacky-matematika/') !== 0 || p.indexOf('/pdfs/') >= 0 || /\\.pdf$/i.test(p) || el.hasAttribute('download') || el.target === '_blank') return false; }
      if (el.tagName === 'INPUT' && /^(hidden|file|password)$/.test(el.type)) return false;
      return true;
    });
  };
  window.__kontrola = function () {
    // na mobilu se při širším obsahu zvětší i innerWidth, takže se měří proti šířce, kterou dítě skutečně má (nastaví průchod)
    const SIRKA = window.__SIRKA || innerWidth;
    if (!document.body) return { vycnivaPx: 0, sirka: 0, text: '', prazdneSvg: 0, ovladacu: 1 };
    // prvek, který vyčnívá za pravý okraj okna, i když ho body s overflow-x: hidden před dítětem schová (scrollWidth ho pak nevidí)
    let vycnivaPx = 0, vycnivaCo = '';
    document.querySelectorAll('body *').forEach(e => {
      if (e.closest('svg') && e.tagName !== 'svg') return;
      const r = e.getBoundingClientRect();
      if (r.width < 1 || r.right <= SIRKA + 1) return;
      const c = getComputedStyle(e);
      if (c.display === 'none' || c.visibility === 'hidden' || c.position === 'fixed' || c.position === 'sticky') return;
      for (let q = e.parentElement; q && q !== document.body && q !== document.documentElement; q = q.parentElement) { const o = getComputedStyle(q); if (/(auto|scroll|hidden|clip)/.test(o.overflowX) || o.position === 'fixed') return; }
      const px = Math.round(r.right - SIRKA); if (px > vycnivaPx) { vycnivaPx = px; vycnivaCo = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : ''); }
    });
    const o = { vycnivaPx, vycnivaCo, podpis: location.pathname + '|' + [...document.querySelectorAll('[id]')].filter(e => viditelny(e) && e.getBoundingClientRect().height > 40).map(e => e.id).join(','), sirka: document.documentElement.scrollWidth - SIRKA, text: '', prazdneSvg: 0, ovladacu: window.__ovladace().length };
    const txt = document.body.innerText || '';
    const m = /undefined|\\bNaN\\b|\\[object Object\\]|\\bnull\\b/.exec(txt);
    if (m) o.text = txt.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\\s+/g, ' ');
    document.querySelectorAll('svg').forEach(s => { if (viditelny(s) && !s.closest('button') && s.querySelectorAll('*').length === 0) o.prazdneSvg++; });
    return o;
  };
})();`;

async function projdi({ base, stranka, rozmer, semeno, kroku, url, sekce }) {   // url (např. '/projects/cesta_penez.html') a sekce (předpona povolených odkazů) pro jiné stránky než přijímačky
  const [W, H] = ROZMERY[rozmer], rnd = mulberry32(semeno), nalezy = [], zaznam = [], stat = { kroku: 0, tuku: 0, poli: 0, vyberu: 0, obrazovky: new Set() };
  const nalez = (krok, co) => { if (nalezy.length < 12 && !nalezy.some(n => n.co === co)) nalezy.push({ stranka, rozmer, semeno, krok, co }); };
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true });
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  await ctx.addInitScript(sem => {
    let a = sem >>> 0;                                                    // generátory úloh losují stejně při každém přehrání
    Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }, semeno);
  await ctx.addInitScript('window.__SIRKA = ' + W + ';');
  await ctx.addInitScript('window.__SEKCE = ' + JSON.stringify(sekce || DIR) + ';');
  await ctx.addInitScript(VE_STRANCE);                                    // znovu po každém přechodu na jinou stránku (odkaz, reload)
  const page = await ctx.newPage();
  let krok = 0;
  page.on('pageerror', e => nalez(krok, 'výjimka: ' + String(e.message).slice(0, 120)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) nalez(krok, 'console.error: ' + m.text().slice(0, 120)); });
  page.on('dialog', d => (d.type() === 'beforeunload' ? d.accept() : d.dismiss()).catch(() => {}));   // „opustit stránku?“ = dítě potvrdí, jinak by se nic nenačetlo
  // ťuk na odkaz stránku vymění uprostřed vyhodnocení — to není vada, jen počkat a zkusit znovu
  const ev = async (fn, arg) => {
    for (let pokus = 0; pokus < 3; pokus++) {
      try { return await page.evaluate(fn, arg); }
      catch (e) { if (!/Execution context was destroyed|navigation|Target closed/.test(e.message) || pokus === 2) throw e; await page.waitForLoadState('domcontentloaded').catch(() => {}); }
    }
  };
  const nacti = async () => { await page.goto(base + (url || DIR + STRANKY[stranka]), { waitUntil: 'domcontentloaded' }); };
  try {
    await nacti();
    for (krok = 1; krok <= kroku; krok++) {
      // ── akce ──
      if (rnd() < 0.04) { await page.reload({ waitUntil: 'domcontentloaded' }); }
      else {
        const t0 = Date.now();
        let pocet = await Promise.race([ev(() => window.__ovladace().length), new Promise(r => setTimeout(() => r(-1), 4000))]);
        if (pocet === 0) { await page.waitForTimeout(400); pocet = await ev(() => window.__ovladace().length); }      // právě se mění stránka
        if (pocet === -1) { nalez(krok, 'stránka zamrzla (hlavní vlákno neodpovědělo do 4 s)'); break; }
        if (pocet === 0) { nalez(krok, 'slepá ulička: žádný viditelný a povolený ovladač'); await nacti(); continue; }
        let i = Math.floor(rnd() * pocet); if (rnd() < 0.7) { const mimoOdkazy = await ev(() => window.__ovladace().map((e, k) => e.tagName === 'A' ? -1 : k).filter(k => k >= 0)); if (mimoOdkazy.length) i = mimoOdkazy[Math.floor(rnd() * mimoOdkazy.length)]; }
        const text = TEXTY[Math.floor(rnd() * TEXTY.length)], vyber = rnd();
        const popis = await ev(([i, text, vyber]) => {
          const el = window.__ovladace()[i];
          if (!el) return 'zmizel';
          el.scrollIntoView({ block: 'center' });
          const tag = el.tagName, typ = (el.type || '').toLowerCase();
          if (tag === 'SELECT') { if (el.options.length) { el.selectedIndex = Math.floor(vyber * el.options.length); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } return 'select'; }
          if (tag === 'TEXTAREA' || (tag === 'INPUT' && !/^(radio|checkbox|button|submit|range|color)$/.test(typ))) { el.focus(); el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); if (vyber < 0.5) el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return 'pole ' + JSON.stringify(text.slice(0, 12)); }
          const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y);
          // přes celou obrazovku (okno rýsování, překryv): zakrytí ostatních ovladačů je záměr
          const modal = [...document.querySelectorAll('body *')].some(q => { const c = getComputedStyle(q); if (c.position !== 'fixed' || c.display === 'none' || c.visibility === 'hidden') return false; const b = q.getBoundingClientRect(); return b.width >= 0.8 * innerWidth && b.height >= 0.8 * innerHeight; });
          const zasah = modal || (!!e && (e === el || el.contains(e) || e.contains(el)));
          el.click();
          return (zasah ? 'ťuk ' : 'ťuk (ZAKRYTO) ') + (el.id || el.tagName.toLowerCase()) + ' „' + (el.textContent || el.value || '').trim().slice(0, 24) + '“' + (zasah ? '' : ' pod ' + (e && (e.id || e.tagName)) + ' [' + [r, e && e.getBoundingClientRect()].map(q => q ? Math.round(q.left) + ',' + Math.round(q.top) + ' ' + Math.round(q.width) + '×' + Math.round(q.height) : '?').join(' pod ') + '; okno ' + innerWidth + '×' + innerHeight + ', rolování ' + Math.round(scrollY) + ']');
        }, [i, text, vyber]);
        zaznam.push(krok + ': ' + popis);
        if (/^ťuk/.test(popis)) stat.tuku++; else if (/^pole/.test(popis)) stat.poli++; else if (popis === 'select') stat.vyberu++;
        if (/ZAKRYTO/.test(popis)) nalez(krok, popis);
        const dt = Date.now() - t0; if (dt > 4000) nalez(krok, 'krok trval ' + dt + ' ms: ' + popis);
      }
      await page.waitForTimeout(40);
      await page.waitForLoadState('domcontentloaded').catch(() => {});      // ťuk na odkaz = nová stránka
      // ── kontrola po kroku ──
      const k = await Promise.race([ev(() => window.__kontrola()), new Promise(r => setTimeout(() => r(null), 4000))]);
      stat.kroku++; if (k) stat.obrazovky.add(k.podpis);
      if (!k) { nalez(krok, 'stránka zamrzla (kontrola neodpověděla do 4 s)'); break; }
      if (k.sirka > 1) nalez(krok, 'stránka přetéká o ' + k.sirka + ' px');
      if (k.vycnivaPx > 1) nalez(krok, 'prvek ' + k.vycnivaCo + ' vyčnívá o ' + k.vycnivaPx + ' px za okraj okna');
      if (k.text) nalez(krok, 've viditelném textu: „' + k.text + '“');
      if (k.prazdneSvg) nalez(krok, k.prazdneSvg + '× prázdný obrázek');
      if (k.ovladacu === 0) { await page.waitForTimeout(400); const k2 = await ev(() => window.__kontrola()); if (k2.ovladacu === 0) nalez(krok, 'slepá ulička: žádný viditelný a povolený ovladač (ani po 0,4 s)'); }
    }
  } catch (e) { nalez(krok, 'průchod spadl: ' + String(e.message).slice(0, 140)); }
  await browser.close();
  if (process.env.PNP_ZAZNAM) console.log(zaznam.join('\n'));
  nalezy.stat = stat;
  return nalezy;
}

module.exports = { projdi, server, STRANKY, ROZMERY };
