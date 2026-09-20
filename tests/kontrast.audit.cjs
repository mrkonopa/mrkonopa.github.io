/* ══════════════════════════════════════════════════════════════════════
   KONTRAST TEXTU proti pozadí na všech stránkách.

   Proč to vzniklo: ani přístupnostní, ani mobilní audit kontrast neměřil,
   přestože je v CLAUDE.md doloženo hned několik případů, kdy se tudy
   propadla skutečná vada — popisky pod sloupci grafu na **1,3 : 1**
   (tedy neviditelné) a zelená na 4,29 : 1 těsně pod normou. Obojí se
   našlo náhodou, ne měřením.

   První sken nad 2 564 texty našel **429 míst pod prahem**. Nebylo to
   429 samostatných chyb: skoro všechno stálo na HRSTCE TOKENŮ, hlavně
   na zlaté `#c89a10`, která na bílé dává **2,47 : 1** a dělá mimo jiné
   nadpis „📋 Pravidla" ve všech osmi únikovkách. Opraveno posunem
   tokenů (viz commit), ne 429 záplatami.

   Jak se měří — a proč zrovna takhle:
   · pozadí se skládá průhledností nahoru po předcích. Jakmile je v cestě
     obrázek nebo přechod, výsledek NEPLATÍ (CLAUDE.md: „kontrast měř
     proti SKUTEČNÉMU pozadí, ne proti tokenu" — tam vyšel rozdíl mezi
     tokenem a skutečností z 3,25 na 2,76). Takové prvky se proto počítají
     zvlášť jako „neurčitelné" a NEhlásí se jako nález.
   · měří se jen viditelný text s VLASTNÍM textovým uzlem, aby se totéž
     nepočítalo znovu za každého předka,
   · prvky pod 15 % průhlednosti se přeskakují: zamčené položky jsou
     schválně skoro neviditelné, to není vada kontrastu,
   · práh podle WCAG AA: velký text (≥ 24 px, nebo ≥ 18,66 px tučně)
     3,0 : 1, jinak 4,5 : 1.

   Spusť: node tests/kontrast.audit.cjs
   ══════════════════════════════════════════════════════════════════════ */
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const { ROOT, jakoDvojiceJmeno } = require('./stranky.cjs');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const PAGES = jakoDvojiceJmeno();

/* Naměřeno při zavedení (po opravě tokenů). Podlahy jsou VELKORYSÉ:
   rozbité vykreslení dá nulu, takže nic nestojí mít rezervu, a naopak
   těsná podlaha by shodila stránku, která je v pořádku. */
const PODLAHA_TEXTU = 1800;   // naměřeno 2 564

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

const SKEN = () => {
  const parse = c => {
    const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || '');
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const lum = ({ r, g, b }) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const pomer = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const slozit = (vrch, spod) => ({
    r: vrch.r * vrch.a + spod.r * (1 - vrch.a),
    g: vrch.g * vrch.a + spod.g * (1 - vrch.a),
    b: vrch.b * vrch.a + spod.b * (1 - vrch.a), a: 1,
  });
  const sig = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
    (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');

  const out = { mereno: 0, nejiste: 0, nalezy: [] };
  for (const el of document.querySelectorAll('body *')) {
    const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!txt) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let pruh = 1, p = el;
    while (p && p !== document.documentElement) { pruh *= parseFloat(getComputedStyle(p).opacity || '1'); p = p.parentElement; }
    if (pruh < 0.15) continue;

    const fg0 = parse(cs.color); if (!fg0) continue;
    let obrazek = false, nasel = false, q = el;
    const vrstvy = [];
    while (q) {
      const qs = getComputedStyle(q);
      if (qs.backgroundImage && qs.backgroundImage !== 'none') { obrazek = true; break; }
      const c = parse(qs.backgroundColor);
      if (c && c.a > 0) { vrstvy.push(c); if (c.a >= 0.999) { nasel = true; break; } }
      q = q.parentElement;
    }
    if (obrazek) { out.nejiste++; continue; }
    if (!nasel) vrstvy.push({ r: 255, g: 255, b: 255, a: 1 });
    const bg = vrstvy.reduceRight((spod, vrch) => slozit(vrch, spod));
    const fg = fg0.a >= 0.999 ? fg0 : slozit(fg0, bg);

    const vel = parseFloat(cs.fontSize) || 16;
    const tucne = (parseInt(cs.fontWeight, 10) || 400) >= 700;
    const prah = (vel >= 24 || (vel >= 18.66 && tucne)) ? 3.0 : 4.5;
    const pom = pomer(fg, bg);
    out.mereno++;
    if (pom + 0.005 < prah) {
      out.nalezy.push({
        kde: sig(el), txt: txt.slice(0, 40).replace(/\s+/g, ' '),
        pom: +pom.toFixed(2), prah, vel: Math.round(vel),
        fg: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,
      });
    }
  }
  out.nalezy.sort((a, b) => a.pom - b.pom);
  return out;
};

(async () => {
  console.log('\n── Kontrast textu (WCAG AA) ──\n');
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  let mereno = 0, nejiste = 0, nalezu = 0, chyby = 0;
  const souhrn = [];
  try {
    for (const [jmeno, url] of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: 1024, height: 800 } });
      /* Jen naše stránky — stejný vzor jako ostatní plošné audity. Bez toho
         drží blokovaný požadavek na fonty `load` až 12 s a cizí JS z vloženého
         přehrávače u tří cestovatelských zápisků běží doopravdy. */
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      try {
        await page.goto(base + url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(700);
        const r = await page.evaluate(SKEN);
        mereno += r.mereno; nejiste += r.nejiste; nalezu += r.nalezy.length;
        if (r.nalezy.length) {
          console.log(`❌ ${jmeno}  (${r.mereno} textů) — ${r.nalezy.length} pod prahem`);
          r.nalezy.slice(0, 8).forEach(n => console.log(
            `     ${String(n.pom).padStart(5)} : 1 (práh ${n.prah})  ${n.kde}  „${n.txt}"  ${n.fg} na ${n.bg}  ${n.vel}px`));
          if (r.nalezy.length > 8) console.log(`     … a dalších ${r.nalezy.length - 8}`);
          souhrn.push(`${url} → ${r.nalezy.length}× pod prahem (nejhorší ${r.nalezy[0].pom} : 1)`);
        }
      } catch (e) { chyby++; console.log(`❌ ${jmeno}: CHYBA ${e.message.slice(0, 80)}`); }
      await ctx.close();
    }
  } finally { await browser.close(); srv.close(); }

  if (souhrn.length) { console.log('\n── SOUHRN ──'); souhrn.forEach(x => console.log('  ' + x)); }
  console.log('\n==========================================');
  console.log(`  proměřeno textů: ${mereno} na ${PAGES.length} stránkách`);
  console.log(`  neurčitelné pozadí (obrázek/přechod): ${nejiste} — nehlásí se`);
  console.log(`  POD PRAHEM: ${nalezu}`);
  console.log('==========================================\n');

  /* Pojistka proti „audit doběhl zeleně a nic neviděl" — přesně ten případ,
     kvůli kterému tenhle repozitář přišel o 57 460 nezkontrolovaných úloh. */
  let fail = nalezu + chyby;
  if (mereno < PODLAHA_TEXTU) {
    console.log(`❌ POJISTKA: proměřeno jen ${mereno} textů (podlaha ${PODLAHA_TEXTU}) — audit skoro nic neviděl.`);
    fail++;
  }
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
