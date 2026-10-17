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
const { projdi, OBRAZOVKY } = require('./vnitrni-obrazovky.cjs');
const CEKANO_OBRAZOVEK = OBRAZOVKY.reduce((a, o) => a + o.kroky.length, 0);
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const PAGES = jakoDvojiceJmeno();

/* Naměřeno při zavedení (po opravě tokenů). Podlahy jsou VELKORYSÉ:
   rozbité vykreslení dá nulu, takže nic nestojí mít rezervu, a naopak
   těsná podlaha by shodila stránku, která je v pořádku. */
const PODLAHA_TEXTU = 1800;   // naměřeno 2 564
/* Vnitřní obrazovky (boj, trénink, teorie, profil, obchod, věž, běžící test,
   rozbor, konec diagnostiky…) — dřív se neměřily vůbec a průchod 5. 10. 2026
   na nich našel 24 skupin textu pod prahem (nejhorší 2,79 : 1). */
const PODLAHA_VNITRNI = 3000; // naměřeno 4 100 textů na 69 obrazovkách

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

const { SKEN } = require('./kontrast-mer.cjs');   // sdílené měřidlo (viz soubor)

(async () => {
  console.log('\n── Kontrast textu (WCAG AA) ──\n');
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  let mereno = 0, nejiste = 0, nalezu = 0, chyby = 0, mereniVnitrni = 0, obrazovek = 0;
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
    // vnitřní obrazovky: kam se žák dostane až klikáním
    const vn = await projdi(browser, base, async (page, jm) => {
      const r = await page.evaluate(SKEN);
      mereniVnitrni += r.mereno; nejiste += r.nejiste; nalezu += r.nalezy.length;
      if (r.nalezy.length) {
        console.log(`❌ ${jm}  (${r.mereno} textů) — ${r.nalezy.length} pod prahem`);
        r.nalezy.slice(0, 6).forEach(n => console.log(
          `     ${String(n.pom).padStart(5)} : 1 (práh ${n.prah})  ${n.kde}  „${n.txt}"  ${n.fg} na ${n.bg}  ${n.vel}px`));
        souhrn.push(`${jm} → ${r.nalezy.length}× pod prahem (nejhorší ${r.nalezy[0].pom} : 1)`);
      }
    });
    obrazovek = vn.obrazovek; vn.chyby.forEach(c => { chyby++; console.log('❌ obrazovka se nedala otevřít: ' + c); });
  } finally { await browser.close(); srv.close(); }

  if (souhrn.length) { console.log('\n── SOUHRN ──'); souhrn.forEach(x => console.log('  ' + x)); }
  console.log('\n==========================================');
  console.log(`  proměřeno textů: ${mereno} na ${PAGES.length} stránkách + ${mereniVnitrni} na ${obrazovek} vnitřních obrazovkách`);
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
  if (mereniVnitrni < PODLAHA_VNITRNI || obrazovek < CEKANO_OBRAZOVEK) {
    console.log(`❌ POJISTKA: na vnitřních obrazovkách proměřeno jen ${mereniVnitrni} textů na ${obrazovek} obrazovkách (podlaha ${PODLAHA_VNITRNI} / ${CEKANO_OBRAZOVEK}).`);
    fail++;
  }
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
