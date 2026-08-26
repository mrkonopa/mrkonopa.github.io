/* ══════════════════════════════════════════════════════════════════════
   Koupený skin musí být VIDĚT na hrdinovi v aréně.

   PROČ tenhle test. Skiny jsou jediná věc, kterou si dítě za nasbírané
   kredity kupuje. Cesta od kliknutí ke změně pixelů vede přes čtyři
   nezávislé kusy kódu — peněženka (`RPGWallet.buy`), `applyCosmetics()`
   ve hře, `setSkin()` ve sprite modulu a přepis palety v jádře — a každý
   z nich může tiše selhat, aniž by cokoli spadlo. Konkrétní past, na
   kterou balíček spritů sám upozorňuje: staré skiny přepisovaly znaky
   `J/j/C/c/G`, které v nových mřížkách NEEXISTUJÍ, takže by se koupený
   skin nepoužil a dítě by přišlo o to, co si zaplatilo.

   Proto se neměří „vrátila funkce true", ale SKUTEČNĚ VYKRESLENÉ PIXELY:
   otisk plátna arény před aktivací a po ní se musí lišit.

   Spusť: node tests/rpg-skin-live.test.cjs [ročník…]
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PORT = 18987;
const ARG = process.argv.filter(a => /^[3-9]$/.test(a)).map(Number);
const ROCNIKY = ARG.length ? ARG : [3, 4, 5, 6, 7, 8, 9];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const srv = http.createServer((q, p) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const fp = path.normalize(path.join(ROOT, u));
  if (!fp.startsWith(ROOT)) { p.writeHead(403); return p.end(); }
  let b = null; try { b = fs.readFileSync(fp); } catch (e) {}
  if (b === null) { p.writeHead(404); return p.end(); }
  p.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'application/javascript' : 'text/html' });
  p.end(b);
});

const otisk = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 12);

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  console.log('\n── Skiny naživo ──\n');

  for (const g of ROCNIKY) {
    const ctx = await br.newContext({ viewport: { width: 900, height: 900 } });
    await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const chyby = [];
    pg.on('pageerror', e => chyby.push(e.message));
    await pg.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

    const r = await pg.evaluate(async gg => {
      const spi = () => window['RPGSprites' + gg];
      localStorage.clear(); startGame('Zkouška'); S.tutorialDone = true;
      /* reduced-motion: jinak by se otisky lišily i bez skinu */
      document.documentElement.classList.add('reduced-motion');
      const ar = AREAS[0]; launchBattle(ar.id, ar.missions[0].id);
      await new Promise(r2 => setTimeout(r2, 900));
      const plat = () => document.querySelector('#bt-top canvas');
      const snap = () => { const c = plat(); return c ? c.toDataURL() : null; };

      const nabidka = (typeof RPGWallet !== 'undefined' && RPGWallet.itemsAll ? RPGWallet.itemsAll() : SHOP_ITEMS)
        .filter(i => i.cat === 'skin');
      const out = { skiny: nabidka.map(i => i.id), kroky: [], zaklad: snap(), api: typeof (spi() || {}).setSkin };

      /* Dost kreditů, ať koupě neselže na ceně. */
      if (typeof RPGWallet !== 'undefined') RPGWallet.earn(999999);
      S.credits = 999999;

      for (const it of nabidka) {
        let koupeno = false, chyba = null;
        try {
          if (typeof RPGWallet !== 'undefined') { const b = RPGWallet.buy(it.id); koupeno = !!(b && b.ok); }
          if (!koupeno && typeof buyItem === 'function') { buyItem(it.id); koupeno = true; }
          if (typeof activateItem === 'function') activateItem(it.id);
          else if (typeof RPGWallet !== 'undefined') RPGWallet.activate(it.id);
          if (typeof applyCosmetics === 'function') applyCosmetics();
        } catch (e) { chyba = String(e); }
        await new Promise(r2 => setTimeout(r2, 350));
        out.kroky.push({ id: it.id, koupeno, chyba, otisk: snap(),
          vlastni: (typeof RPGWallet !== 'undefined' && RPGWallet.owns) ? RPGWallet.owns(it.id) : null });
      }
      return out;
    }, String(g));

    ok(r.api === 'function', `g${g}: sprite modul má setSkin()`);
    ok(!!r.zaklad, `g${g}: plátno arény se čte`);
    ok(r.skiny.length === 5, `g${g}: obchod nabízí 5 skinů (${r.skiny.length})`);

    const zmenene = [];
    for (const k of r.kroky) {
      ok(!k.chyba, `g${g}/${k.id}: koupě a aktivace nespadly`, k.chyba || '');
      ok(k.vlastni !== false, `g${g}/${k.id}: peněženka ho eviduje jako vlastněný`);
      const zmena = k.otisk && k.otisk !== r.zaklad;
      ok(zmena, `g${g}/${k.id}: SKIN JE VIDĚT (otisk plátna se změnil)`,
        zmena ? '' : `otisk zůstal ${otisk(r.zaklad)}`);
      if (zmena) zmenene.push(otisk(k.otisk));
    }
    /* Pět skinů musí dát pět RŮZNÝCH výsledků. Kdyby se aktivoval pořád
       týž (nebo žádný a zůstal ten předchozí), otisky by se opakovaly. */
    ok(new Set(zmenene).size === zmenene.length,
      `g${g}: každý skin vypadá jinak (${new Set(zmenene).size} různých z ${zmenene.length})`);

    const skut = chyby.filter(e => !/ERR_|CERT_|net::|supabase|jsdelivr|Failed to fetch/i.test(e));
    ok(skut.length === 0, `g${g}: žádné JS chyby`, skut.slice(0, 2).join(' | '));
    await ctx.close();
  }

  /* ── skin koupený v JEDNÉ hře musí být vidět ve VŠECH ─────────────
     Peněženka je sdílená (`RPG_HUB_WALLET`, stejný origin), takže „co
     koupíš tady, nosíš všude" je slíbená vlastnost — a do teď ji nic
     neověřovalo: testy výš kupují a aktivují v rámci jedné hry a jednoho
     načtení stránky. Tady se skin koupí v šestce a kontroluje se otisk
     plátna v jiných ročnících po ČERSTVÉM načtení.

     Pozor na základ srovnání: `RPGWallet.buy()` skin rovnou AKTIVUJE,
     takže „před koupí" se musí měřit na úplně prázdné peněžence. Když
     se to spletlo, vyšlo falešně, že přenos nefunguje.
     A vypíná se `deactivate('skin')`, ne `activate(null)` — ten vrací
     `{ok:false, reason:'unknown'}` a nechá skin zapnutý. */
  {
    const ctx = await br.newContext({ viewport: { width: 900, height: 800 } });
    await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
    const pg = await ctx.newPage();

    const nacti = async g => {
      await pg.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await pg.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
      return pg.evaluate(async () => {
        startGame('Zkouška'); S.tutorialDone = true;
        document.documentElement.classList.add('reduced-motion');
        const ar = AREAS[0]; launchBattle(ar.id, ar.missions[0].id);
        await new Promise(r => setTimeout(r, 800));
        const cv = document.querySelector('#bt-top canvas');
        return { otisk: cv ? cv.toDataURL() : null, aktivni: RPGWallet.activeId('skin') };
      });
    };

    await pg.goto(`http://localhost:${PORT}/projects/rpg-mat-6.html`, { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => typeof RPGWallet !== 'undefined', { timeout: 20000 });
    await pg.evaluate(() => localStorage.clear());

    const cista = await nacti(7);
    ok(cista.aktivni == null, 'čistá peněženka nemá aktivní skin', String(cista.aktivni));

    await pg.goto(`http://localhost:${PORT}/projects/rpg-mat-6.html`, { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => typeof RPGWallet !== 'undefined', { timeout: 20000 });
    const koupe = await pg.evaluate(() => { RPGWallet.earn(99999); const r = RPGWallet.buy('skin-gold');
      return { ok: !!(r && r.ok), aktivni: RPGWallet.activeId('skin') }; });
    ok(koupe.ok, 'skin se dá koupit v 6. ročníku');
    ok(koupe.aktivni === 'skin-gold', 'koupě ho rovnou aktivuje', String(koupe.aktivni));

    for (const g of [3, 5, 7, 9]) {
      const r = await nacti(g);
      ok(r.aktivni === 'skin-gold', `g${g}: peněženka nese skin i sem`, String(r.aktivni));
      ok(r.otisk && r.otisk !== cista.otisk,
        `g${g}: SKIN KOUPENÝ V ŠESTCE JE VIDĚT (otisk se liší od čisté peněženky)`);
    }

    await pg.evaluate(() => RPGWallet.deactivate('skin'));
    const vyp = await nacti(7);
    ok(vyp.aktivni == null, 'deactivate(\'skin\') skin vypne', String(vyp.aktivni));
    ok(vyp.otisk === cista.otisk, 'po vypnutí vypadá hrdina jako s čistou peněženkou');
    await ctx.close();
  }

  console.log(`\n  Skiny naživo: ${pass} ✅ / ${fail} ❌\n`);
  await br.close(); srv.close();
  process.exit(fail ? 1 : 0);
})();
