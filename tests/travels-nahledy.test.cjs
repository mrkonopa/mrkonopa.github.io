/* ══════════════════════════════════════════════════════════════════════
   Náhledy fotek v mřížkách cestovatelských zápisků (`tools/nahledy-fotek.py`).

   Dřív se v mřížce (buňka ~170–430 px) stahovaly plné fotky ⌀ 323 kB: při proscrollování
   Itálie 111 MB, Španělsko 89 MB (naměřeno 18. 11. 2026, soubory na disku). Teď má každá fotka
   `srcset` s náhledem 640 px (⌀ 46 kB) a plnou fotkou; `src` zůstává PLNÁ fotka, takže lightbox
   (`img.src`) i obsluha kliknutí na stránkách se nemění. Ukrajina a ČR–BH mají do 900 px dva velké
   sloupce (410 px × DPR 2 = 820 px), kde by náhled 640 byl rozmazaný, takže mají navíc náhled 960 px
   (⌀ 100 kB, 25 MB v repu) a tři kandidáty; na iPadu na výšku tím proscrollování všech osmi zápisků
   kleslo z 136 na 87 MB (telefon a počítač beze změny, 75 a 74 MB).

   Hlídá se čtyřmi věcmi, které by jinak selhaly TIŠE:
     1) ZDROJ: každé `<img>` s fotkou má `srcset`, jeho první kandidát je existující náhled široký přesně
        tolik, kolik říká descriptor `w`, druhý je plná fotka se SKUTEČNOU šířkou souboru (špatný descriptor
        přiměje prohlížeč vybrat špatně a nic nespadne) a `sizes`; náhled NESMÍ být ignorovaný gitem
        (italy a spain mají ve složce `.gitignore` s `*` — složka s náhledy by se bez výjimky nenasadila
        a na webu by zůstaly rozbité obrázky, přitom lokálně vše funguje).
     2) PROHLÍŽEČ: při proscrollování celé stránky se stahují náhledy (ne plné fotky) a nic nezůstane rozbité.
     3) LIGHTBOX: klik na fotku otevře PLNOU fotku (ne náhled), šířka zvětšené fotky = šířka souboru.
     4) SABOTÁŽE (přepis odpovědi serveru, soubory se nemění): bez `srcset`, descriptor 640w → 3000w,
        náhled ukazuje na neexistující soubor; u Ukrajiny na iPadu totéž pro náhled 960, jeho descriptor
        960w → 3000w a vrácení stavu před druhým náhledem.

   Spusť: node tests/travels-nahledy.test.cjs        (NAHLEDY_VYPIS=1 vypíše naměřená čísla)
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
const ZAPISKY = require('./stranky.cjs').STRANKY.filter(p => p.id.startsWith('t-')).map(p => p.id.slice(2));
const VYPIS = !!process.env.NAHLEDY_VYPIS;
const DVA_SLOUPCE = new Set(['ukraine-2017', 'cr-bh-2018']);   // `.gallery` 3 sloupce, do 900 px 2 sloupce (viz CSS); mají i druhý náhled 960 px

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { c ? pass++ : (fail++, console.log('  ❌ ' + m + (d ? ' — ' + d : ''))); };

/* šířka JPEG ze SOF markeru (bez knihovny; test nesmí záviset na Pillow) */
function sirkaJpeg(cesta) {
  const b = fs.readFileSync(cesta);
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return b.readUInt16BE(i + 7);
    i += 2 + b.readUInt16BE(i + 2);
  }
  return 0;
}

const IMG = /<img\b[^>]*>/g;
function fotkyZeZdroje(html) {
  const r = [];
  let m;
  while ((m = IMG.exec(html))) {
    const t = m[0], s = /\bsrc="(\.\/images\/([a-z0-9_]+)\/([^"/]+))"/.exec(t);
    if (!s || s[2] === 'nahledy') continue;
    r.push({ tag: t, url: s[1], adresar: s[2], jmeno: decodeURIComponent(s[3]),
             srcset: (/\bsrcset="([^"]*)"/.exec(t) || [])[1] || '', sizes: (/\bsizes="([^"]*)"/.exec(t) || [])[1] || '' });
  }
  return r;
}

function serve(uprava) {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const f = path.normalize(path.join(ROOT, u));
      if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      let tel = fs.readFileSync(f);
      if (f.endsWith('.html') && uprava.fn) tel = Buffer.from(uprava.fn(tel.toString('utf8'), u), 'utf8');
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Content-Length': tel.length });
      r.end(tel);
    });
    s.listen(0, () => res(s));
  });
}

/* ── 1) ZDROJ ───────────────────────────────────────────────────────── */
function zdroj() {
  console.log('\n── Zdroj: srcset, šířky, existence, git ──');
  let celkem = 0;
  const nahledyKGitu = [];
  for (const z of ZAPISKY) {
    const html = fs.readFileSync(path.join(ROOT, 'travels', z + '.html'), 'utf8');
    const f = fotkyZeZdroje(html);
    celkem += f.length;
    const zle = [];
    for (const x of f) {
      const kand = x.srcset.split(/,\s+/).map(s => s.trim()).filter(Boolean).map(s => { const p = s.split(/\s+/); return { url: p[0], w: parseInt(p[1], 10) }; });
      const plny = path.join(ROOT, 'travels', 'images', x.adresar, x.jmeno);
      /* zápisky se dvěma velkými sloupci mají u fotky širší než 960 px tři kandidáty (640, 960, plná), ostatní dva */
      const maDruhy = DVA_SLOUPCE.has(z) && fs.existsSync(plny) && sirkaJpeg(plny) > 960;
      if (kand.length !== (maDruhy ? 3 : 2)) { zle.push(x.jmeno + ': srcset nemá ' + (maDruhy ? 3 : 2) + ' kandidáty (má ' + kand.length + ')'); continue; }
      const n = kand[0], p = kand[kand.length - 1];
      if (maDruhy) {
        const d = kand[1], nahled960 = path.join(ROOT, 'travels', 'images', x.adresar, 'n960', x.jmeno);
        if (!/\/n960\//.test(d.url)) zle.push(x.jmeno + ': druhý kandidát není náhled 960');
        else if (!fs.existsSync(nahled960)) zle.push(x.jmeno + ': náhled 960 neexistuje');
        else { if (sirkaJpeg(nahled960) !== 960 || d.w !== 960) zle.push(x.jmeno + ': náhled není 960 px (' + sirkaJpeg(nahled960) + ', descriptor ' + d.w + ')'); nahledyKGitu.push(path.relative(ROOT, nahled960)); }
      }
      const nahled = path.join(ROOT, 'travels', 'images', x.adresar, 'n640', x.jmeno);
      if (decodeURIComponent(p.url) !== decodeURIComponent(x.url)) zle.push(x.jmeno + ': poslední kandidát není plná fotka z src');
      if (!/\/n640\//.test(n.url)) zle.push(x.jmeno + ': první kandidát není náhled');
      if (!fs.existsSync(plny)) zle.push(x.jmeno + ': plná fotka neexistuje');
      else if (sirkaJpeg(plny) !== p.w) zle.push(x.jmeno + ': descriptor ' + p.w + 'w ≠ skutečná šířka ' + sirkaJpeg(plny));
      if (!fs.existsSync(nahled)) zle.push(x.jmeno + ': náhled neexistuje');
      else { if (sirkaJpeg(nahled) !== 640 || n.w !== 640) zle.push(x.jmeno + ': náhled není 640 px (' + sirkaJpeg(nahled) + ', descriptor ' + n.w + ')'); nahledyKGitu.push(path.relative(ROOT, nahled)); }
      if (!x.sizes) zle.push(x.jmeno + ': chybí sizes');
    }
    ok(f.length > 50 && zle.length === 0, z + ': ' + f.length + ' fotek, každá má srcset (náhled 640' + (DVA_SLOUPCE.has(z) ? ' + 960' : '') + ' + plná se skutečnou šířkou) a sizes', zle.slice(0, 3).join(' | '));
  }
  ok(celkem >= 1500, 'dohromady ' + celkem + ' fotek se srcset (podlaha 1 500; naměřeno 1 577)');
  // git: žádný náhled nesmí být ignorovaný (git check-ignore: 0 = ignorováno, 1 = ne)
  let ignorovano = 0;
  for (let i = 0; i < nahledyKGitu.length; i += 200) {
    const davka = nahledyKGitu.slice(i, i + 200);
    try { ignorovano += execFileSync('git', ['check-ignore', '--no-index', ...davka], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).length; }
    catch (e) { if (e.status !== 1) throw e; }
  }
  ok(nahledyKGitu.length >= 1800 && ignorovano === 0, 'žádný z ' + nahledyKGitu.length + ' náhledů není ignorovaný gitem (jinak by se nenasadil)', ignorovano + ' ignorovaných');
}

/* ── 2) + 3) PROHLÍŽEČ ──────────────────────────────────────────────── */
const VIEWPORTY = [
  { nazev: 'telefon 390 × 844 ×3', w: 390, h: 844, dpr: 3, mobil: true },
  { nazev: 'iPad na výšku 820 × 1180 ×2', w: 820, h: 1180, dpr: 2, mobil: true },
  { nazev: 'počítač 1440 × 900 ×1', w: 1440, h: 900, dpr: 1, mobil: false },
];

async function proscrolluj(browser, base, z, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr, isMobile: vp.mobil, hasTouch: vp.mobil });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const st = { plne: 0, nahledy: 0, bajtu: 0, rozbite: 0, fotek: 0 };
  page.on('response', async r => {
    const u = r.url();
    if (!/\/travels\/images\/[a-z0-9_]+\//.test(u) || /\/images\/nahledy\//.test(u)) return;
    const len = parseInt(r.headers()['content-length'] || '0', 10);
    st.bajtu += len;
    if (/\/n(640|960)\//.test(u)) st.nahledy++; else st.plne++;
  });
  await page.goto(base + '/travels/' + z + '.html', { waitUntil: 'domcontentloaded' });
  const vyska = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < vyska; y += Math.round(vp.h * 0.7)) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(25); }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const f = [...document.querySelectorAll('img[srcset]')];
    return { fotek: f.length, rozbite: f.filter(i => i.complete === false || (i.complete && i.naturalWidth === 0 && i.currentSrc)).length };
  });
  st.fotek = r.fotek; st.rozbite = r.rozbite;
  return { st, page, ctx };
}

async function prohlizec(browser, base, popis) {
  const vysl = {};
  for (const z of ZAPISKY) for (const vp of VIEWPORTY) {
    const { st, page, ctx } = await proscrolluj(browser, base, z, vp);
    vysl[z + '|' + vp.nazev] = st;
    await ctx.close();
  }
  return vysl;
}

(async () => {
  zdroj();
  if (process.env.NAHLEDY_JEN_ZDROJ) { console.log(`\n  Zdroj: ${pass} ✅ / ${fail} ❌\n`); process.exit(fail ? 1 : 0); }
  console.log('\n── Prohlížeč: proscrolování celé stránky ──');
  const uprava = { fn: null };
  const srv = await serve(uprava);
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  try {
    const norm = await prohlizec(browser, base);
    // před/po: "před" = stejné stránky bez srcset (sabotáž „bez srcset“ je zároveň základ pro srovnání)
    uprava.fn = html => html.replace(/ srcset="[^"]*" sizes="[^"]*"/g, '');
    const pred = await prohlizec(browser, base);
    uprava.fn = null;

    let radky = [];
    for (const z of ZAPISKY) {
      for (const vp of VIEWPORTY) {
        const k = z + '|' + vp.nazev, a = norm[k], b = pred[k];
        const mbA = a.bajtu / 1048576, mbB = b.bajtu / 1048576;
        radky.push({ k, a, b, mbA, mbB });
        if (VYPIS) console.log(`  ${z.padEnd(18)} ${vp.nazev.padEnd(30)} po: ${a.nahledy} náhledů + ${a.plne} plných = ${mbA.toFixed(1)} MB   před: ${b.plne} plných = ${mbB.toFixed(1)} MB`);
        ok(a.rozbite === 0, `${z} (${vp.nazev}): žádný obrázek se srcset nezůstal rozbitý`, a.rozbite + ' rozbitých');
        ok(a.fotek > 50, `${z} (${vp.nazev}): ${a.fotek} fotek se srcset na stránce`);
        // úspora: na všech třech rozměrech se stahují převážně náhledy a celkem aspoň 3× méně než před
        const podilNahledu = a.nahledy / Math.max(1, a.nahledy + a.plne);
        const hranice = vp.dpr >= 3 ? 0.9 : 0.8;
        if (DVA_SLOUPCE.has(z) && vp.w === 820) {
          /* ukraine a cr-bh mají do 900 px DVA velké sloupce: buňka 410 px × DPR 2 = 820 px > 640, takže by prohlížeč
             bral plnou fotku (náhled 640 by byl rozmazaný). Od 19. 11. 2026 mají druhý náhled 960 px: naměřeno Ukrajina
             55,8 → 18,2 MB, ČR–BH 18,9 → 7,0 MB (3,1× a 2,7× méně; široké a celostránkové fotky `.wide`/`.full` zůstávají plné). */
          ok(podilNahledu >= 0.8, `${z} (${vp.nazev}): dva sloupce 410 px × 2 → ≥ 80 % staženého jsou náhledy (640 nebo 960)`, `${Math.round(podilNahledu * 100)} % (${a.nahledy} náhledů, ${a.plne} plných)`);
          ok(mbA * 2 <= mbB, `${z} (${vp.nazev}): stažení nejvýš polovina původního`, `${mbA.toFixed(1)} MB proti ${mbB.toFixed(1)} MB`);
        } else {
          ok(podilNahledu >= hranice, `${z} (${vp.nazev}): ≥ ${Math.round(hranice * 100)} % staženého jsou náhledy`, `${Math.round(podilNahledu * 100)} % (${a.nahledy} náhledů, ${a.plne} plných)`);
          ok(mbA * 3 <= mbB, `${z} (${vp.nazev}): stažení nejvýš třetina původního`, `${mbA.toFixed(1)} MB proti ${mbB.toFixed(1)} MB`);
        }
      }
    }
    const soucet = (p, h) => radky.filter(r => r.k.endsWith(h)).reduce((s, r) => s + r[p], 0);
    for (const vp of VIEWPORTY) console.log(`  ${vp.nazev.padEnd(30)} celkem (8 zápisků): po ${soucet('mbA', vp.nazev).toFixed(0)} MB, před ${soucet('mbB', vp.nazev).toFixed(0)} MB`);

    // 3) lightbox otevře PLNOU fotku
    console.log('\n── Lightbox: zvětšená fotka je plná ──');
    const vp0 = VIEWPORTY[2];
    for (const z of ZAPISKY) {
      const ctx = await browser.newContext({ viewport: { width: vp0.w, height: vp0.h }, deviceScaleFactor: 1 });
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      await page.goto(base + '/travels/' + z + '.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.getElementById('lb-prev') !== null, null, { timeout: 8000 }).catch(() => {});
      const cil = await page.evaluate(() => {
        const e = [...document.querySelectorAll('.gallery .shot .img, .gallery a, .gallery-grid img')].find(x => !(x.tagName === 'IMG' && x.closest('.shot, a')));
        e.setAttribute('data-test-prvni', '1'); e.scrollIntoView({ block: 'center' });
        const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      await page.mouse.click(cil.x, cil.y);
      await page.waitForFunction(() => document.getElementById('lb').classList.contains('open'), null, { timeout: 3000 }).catch(() => {});
      await page.waitForFunction(() => { const i = document.getElementById('lb-img'); return i.complete && i.naturalWidth > 0; }, null, { timeout: 8000 }).catch(() => {});
      const lb = await page.evaluate(() => { const i = document.getElementById('lb-img'); return { src: i.getAttribute('src'), nw: i.naturalWidth, otevreno: document.getElementById('lb').classList.contains('open') }; });
      const sk = lb.src && decodeURIComponent(lb.src.split('/').pop()), adr = lb.src && lb.src.split('/').slice(-2, -1)[0];
      const plny = lb.src ? path.join(ROOT, 'travels', 'images', adr, sk) : '';
      ok(lb.otevreno && lb.src && !/\/n(640|960)\//.test(lb.src), `${z}: klik otevře prohlížeč s PLNOU fotkou, ne s náhledem`, lb.src);
      ok(fs.existsSync(plny) && lb.nw === sirkaJpeg(plny), `${z}: zvětšená fotka má plnou šířku souboru (${lb.nw} px)`, `${lb.nw} proti ${fs.existsSync(plny) ? sirkaJpeg(plny) : '?'}`);
      await ctx.close();
    }

    // 4) sabotáže: musí vypadnout vždy aspoň jedna z kontrol výše
    console.log('\n── Sabotáže (přepis odpovědi serveru) ──');
    const sab = [
      ['bez srcset', html => html.replace(/ srcset="[^"]*" sizes="[^"]*"/g, ''), 'italy-2022', 0],
      ['descriptor 640w → 3000w (prohlížeč vybere plnou fotku)', html => html.replace(/\/n640\/([^"]*?) 640w/g, '/n640/$1 3000w'), 'italy-2022', 0],
      ['náhled ukazuje na neexistující soubor', html => html.replace(/\/n640\//g, '/n640x/'), 'italy-2022', 0],
      ['Ukrajina na iPadu: náhled 960 ukazuje na neexistující soubor', html => html.replace(/\/n960\//g, '/n960x/'), 'ukraine-2017', 1],
      ['Ukrajina na iPadu: descriptor 960w → 3000w (prohlížeč vybere plnou fotku)', html => html.replace(/\/n960\/([^"]*?) 960w/g, '/n960/$1 3000w'), 'ukraine-2017', 1],
      ['Ukrajina na iPadu: bez druhého náhledu (jen 640 a plná, jako před 19. 11.)', html => html.replace(/, \.\/images\/ua_2017\/n960\/[^"]*? 960w/g, ''), 'ukraine-2017', 1],
    ];
    for (const [popis, fn, zapisek, vpi] of sab) {
      uprava.fn = (h, u) => (path.basename(u, '.html') === zapisek ? fn(h) : h);
      const vp = VIEWPORTY[vpi];
      const { st, page, ctx } = await proscrolluj(browser, base, zapisek, vp);
      await ctx.close();
      uprava.fn = null;
      const chycena = st.rozbite > 0 || st.nahledy / Math.max(1, st.nahledy + st.plne) < (vpi === 1 ? 0.8 : 0.9) || st.fotek < 50;
      ok(chycena, `sabotáž „${popis}“ je chycena`, `${st.nahledy} náhledů, ${st.plne} plných, ${st.rozbite} rozbitých, ${st.fotek} fotek se srcset`);
    }
    // sabotáž zdrojové kontroly: descriptor ≠ skutečná šířka musí zdroj chytit
    const htmlItaly = fs.readFileSync(path.join(ROOT, 'travels', 'italy-2022.html'), 'utf8');
    const zlyZdroj = fotkyZeZdroje(htmlItaly.replace(/(\.\/images\/italy_2022\/[^"\s]+) (\d+)w"/, '$1 1234w"'));
    const prvni = zlyZdroj[0];
    const wZ = parseInt(prvni.srcset.split(/,\s+/)[1].split(/\s+/)[1], 10);
    ok(wZ !== sirkaJpeg(path.join(ROOT, 'travels', 'images', prvni.adresar, prvni.jmeno)), 'zdrojová kontrola pozná špatný descriptor šířky (sabotáž se aplikovala: ' + wZ + 'w)');
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Náhledy fotek v cestách: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
