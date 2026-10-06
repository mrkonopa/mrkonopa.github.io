/* prijimacky-tablet.test.cjs — procvičování a diagnostika přijímaček na tabletu na šířku:
   po „Další" musí být vidět ZAČÁTEK nové úlohy (úvod, obrázek nebo zadání), po odpovědi
   hláška o výsledku a vstup i „Další" všude tam, kde se pod začátek vejdou.

   Proč to vzniklo: stránka po „Další" zůstávala tam, kde žák klikl, a prostý focus()
   vstup jen dotáhl do okna (nebo ho vycentroval), takže obrázek nové úlohy zůstal nad
   okrajem. Naměřeno před opravou na iPadu 10,2" bez klávesnice u 12 z 19 úloh s obrázkem
   (až 277 px), s klávesnicí u všech (až 568 px); na telefonu na šířku navíc vycentrované
   „Další" odsunulo hlášku o výsledku nad okraj (12 z 30, až 49 px). V konstrukcích byl po
   „Další úloha" horní okraj kreslicího okna 49–126 px nad obrazovkou iPadu bez klávesnice,
   přestože se okno i zadání pod ním vejdou. Opraveno `PZ.ukaz` v prijimacky-core.js.
   Sabotáž: `PZ.ukaz` jako prostý focus() shodí všechny tři stránky.

   Úlohy se losují ze seedovaného Math.random, takže počty jsou mezi běhy stejné. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

// Tytéž rozměry jako tablet-landscape.test.cjs (CSS px; klávesnice ubere zhruba 45 % výšky).
const ZARIZENI = [
  ['iPad 10,2" na šířku', 1024, 768],
  ['iPad 10,2" + klávesnice', 1024, 420],
  ['iPad 10,9" na šířku', 1180, 820],
  ['iPad 10,9" + klávesnice', 1180, 450],
  ['Android 10" + klávesnice', 1280, 440],
  ['telefon na šířku', 740, 360],
];

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

// Poloha začátku úlohy a vstupu; `vejde` = začátek i vstup se do okna vejdou zároveň.
const merUlohu = pfx => {
  const vid = id => { const e = document.getElementById(id); return e && e.style.display !== 'none' && e.offsetHeight > 0 ? e : null; };
  const zac = vid(pfx + '-intro') || vid(pfx + '-svg') || vid(pfx + '-prompt'), inp = document.getElementById(pfx + '-input');
  const z = zac.getBoundingClientRect().top, i = inp ? inp.getBoundingClientRect().bottom : null;
  return { obr: !!vid(pfx + '-svg'), z: Math.round(z), i: i == null ? null : Math.round(i), vh: innerHeight, vejde: i == null || i - z + 20 <= innerHeight };
};
const merHlasku = () => {
  const fb = document.getElementById('pr-fb').getBoundingClientRect(), nb = document.getElementById('pr-next').getBoundingClientRect();
  return { z: Math.round(fb.top), i: Math.round(nb.bottom), vh: innerHeight, vejde: nb.bottom - fb.top + 20 <= innerHeight };
};
const chyba = (m, co) => m.z < -1 ? co + ' ' + (-m.z) + ' px nad okrajem'
  : m.z > m.vh - 20 ? co + ' pod okrajem (' + m.z + ' px při výšce ' + m.vh + ')'
  : (m.i != null && m.vejde && m.i > m.vh + 1) ? co + ': vstup ' + (m.i - m.vh) + ' px pod okrajem, přestože se vejde' : null;

(async () => {
  const srv = http.createServer((q, p) => { const u = decodeURIComponent(q.url.split('?')[0]);
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end(); }
    p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(p); });
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  console.log('── Přijímačky na tabletu na šířku: začátek úlohy po „Další" ──');

  const spPr = [], spDg = [], spKn = []; let prUloh = 0, prObr = 0, prHl = 0, dgUloh = 0, dgObr = 0, knMer = 0;
  for (const [jm, w, h] of ZARIZENI) {
    const ctx = await br.newContext({ viewport: { width: w, height: h }, hasTouch: true });
    await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    await ctx.addInitScript(() => { let a = 20261004; Math.random = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });

    // procvičování: žák odpoví špatně (ukáže se postup) a klikne na „Další úloha"
    { const page = await ctx.newPage();
      await page.goto(base + '/projects/prijimacky-matematika/procvicovani.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof window.prStart === 'function' && window.PZ && PZ.ukaz, null, { timeout: 10000 });
      for (const okruh of ['geometrie', 'telesa', 'procenta']) {
        await page.evaluate(o => prStart(o), okruh); await page.waitForTimeout(120);
        for (let i = 0; i < 8; i++) {
          const m = await page.evaluate(merUlohu, 'pr'); prUloh++; if (m.obr) prObr++;
          const e = chyba(m, okruh + ' ' + (m.obr ? 's obrázkem' : 'bez obrázku') + ': začátek'); if (e) spPr.push(jm + ' — ' + e);
          const typ = await page.evaluate(() => PR.item.type);
          if (typ === 'mc') await page.evaluate(() => { document.querySelector('input[name=pr-mc]').checked = true; prSubmit(); });
          else if (typ === 'yn') await page.evaluate(() => prSubmitYN('A'));
          else await page.evaluate(() => { document.getElementById('pr-input').value = '999999'; prSubmit(); });
          await page.waitForTimeout(100);
          const f = await page.evaluate(merHlasku); prHl++;
          const ef = chyba(f, okruh + ': hláška po odpovědi'); if (ef) spPr.push(jm + ' — ' + ef.replace('vstup', '„Další"'));
          await page.click('#pr-next'); await page.waitForTimeout(120);
        }
      }
      await page.close(); }

    // diagnostika: „Další →" rovnou vykreslí další úlohu
    { const page = await ctx.newPage();
      await page.goto(base + '/projects/prijimacky-matematika/diagnostika.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof window.dgStart === 'function' && window.PZ && PZ.ukaz, null, { timeout: 10000 });
      await page.evaluate(() => dgStart()); await page.waitForTimeout(120);
      for (let i = 0; i < 20; i++) {
        const typ = await page.evaluate(() => document.getElementById('dg-run').style.display !== 'none' && DG.it ? DG.it.type : null);
        if (!typ) break;
        const m = await page.evaluate(merUlohu, 'dg'); dgUloh++; if (m.obr) dgObr++;
        const e = chyba(m, 'úloha ' + (i + 1) + (m.obr ? ' s obrázkem' : '') + ': začátek'); if (e) spDg.push(jm + ' — ' + e);
        if (typ === 'yn') await page.evaluate(() => dgSubmitYN('A'));
        else {
          if (typ === 'mc') await page.evaluate(() => { document.querySelector('input[name=dg-mc]').checked = true; });
          else await page.fill('#dg-input', '999999');
          await page.click('.dg-akce .pz-btn.primary');
        }
        await page.waitForTimeout(120);
      }
      await page.close(); }

    // konstrukce: žák má „Vyhodnotit" u dolního okraje, pak klikne na „Další úloha →"
    { const page = await ctx.newPage();
      await page.goto(base + '/projects/prijimacky-matematika/konstrukce.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof window.knNova === 'function' && window.PZ && PZ.ukaz, null, { timeout: 10000 });
      for (let i = 0; i < 4; i++) {
        const v = await page.evaluate(() => { const b = document.getElementById('kn-vyhodnot');
          window.scrollBy(0, b.getBoundingClientRect().bottom - innerHeight + 2); knVyhodnot();
          const r = document.getElementById('kn-vysledek').getBoundingClientRect();
          return { z: Math.round(r.top), i: Math.round(r.bottom), vh: innerHeight, vejde: r.height + 20 <= innerHeight }; });
        knMer++; const ev = chyba(v, 'hláška po vyhodnocení'); if (ev) spKn.push(jm + ' — ' + ev.replace('vstup', 'hláška'));
        await page.click('button[onclick="knNova(1)"]'); await page.waitForTimeout(120);
        const m = await page.evaluate(() => { const o = document.getElementById('kn-okno').getBoundingClientRect(), t = document.getElementById('kn-text').getBoundingClientRect();
          return { z: Math.round(o.top), i: Math.round(t.bottom), vh: innerHeight, vejde: t.bottom - o.top + 20 <= innerHeight }; });
        const e = chyba(m, 'okno nové úlohy'); if (e) spKn.push(jm + ' — ' + e.replace('vstup', 'zadání'));
      }
      await page.close(); }
    await ctx.close();
  }

  ok(spPr.length === 0, `procvičování: začátek nové úlohy a hláška po odpovědi jsou vidět, vstup i „Další", když se vejdou — na všech ${ZARIZENI.length} rozměrech`
    + (spPr.length ? ' — ' + spPr.length + '×: ' + spPr.slice(0, 4).join(' · ') : ''));
  ok(spDg.length === 0, `diagnostika: začátek nové úlohy je vidět a vstup, když se vejde — na všech ${ZARIZENI.length} rozměrech`
    + (spDg.length ? ' — ' + spDg.length + '×: ' + spDg.slice(0, 4).join(' · ') : ''));
  ok(spKn.length === 0, `konstrukce: po vyhodnocení je vidět hláška a po „Další úloha" okno i zadání pod ním — na všech ${ZARIZENI.length} rozměrech`
    + (spKn.length ? ' — ' + spKn.length + '×: ' + spKn.slice(0, 4).join(' · ') : ''));
  // Pojistka proti běhu naprázdno: bez úloh s obrázkem by kontrola začátku nic nedokazovala.
  ok(prUloh === ZARIZENI.length * 24 && prHl === prUloh && dgUloh === ZARIZENI.length * 20 && prObr >= ZARIZENI.length * 12 && dgObr >= ZARIZENI.length * 2 && knMer === ZARIZENI.length * 4,
    `proměřeno: procvičování ${prUloh} úloh (z toho ${prObr} s obrázkem) a ${prHl} hlášek, diagnostika ${dgUloh} úloh (${dgObr} s obrázkem), konstrukce ${knMer} kol`);

  await br.close(); srv.close();
  console.log(`\n══════════════════════════════════════════\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n══════════════════════════════════════════`);
  process.exit(fail ? 1 : 0);
})();
