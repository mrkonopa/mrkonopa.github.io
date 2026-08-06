// Sponka (plovoucí pixel-art společník) — běží ve VŠECH ročnících 3.–9.
// Ověří: bez mazlíčka nic, s aktivním i jen VLASTNĚNÝM mazlíčkem se objeví,
// toggle vypne/zapne, nálada (struggle/good) v boji a tréninku,
// auto-nápověda při HP=1, klik na sponku, žádné JS chyby.
// Parametrizováno ročníkem: `node ... [3|4|5|6|7|8|9]` (default 9).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const GRADE = process.argv[2] || '9';
const PORT = 18770 + Number(GRADE);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m); } };

(async () => {
  const srv = http.createServer((req, res) => {
    const p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
    if (!p.startsWith(ROOT + path.sep)) { res.statusCode = 403; res.end(); return; }
    try { res.end(fs.readFileSync(p)); } catch { res.statusCode = 404; res.end(); }
  }).listen(PORT);
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const br = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined });
  const ctx = await br.newContext();
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1:' + PORT) ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/projects/rpg-mat-${GRADE}.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof RPGWallet !== 'undefined' && typeof go === 'function', { timeout: 8000 });

  await page.evaluate(() => { localStorage.clear(); const inp = document.getElementById('ni'); if (inp) inp.value = 'TEST'; startGame(); });
  await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 5000 });

  ok(await page.evaluate(() => !document.getElementById('rw-sponka')), 'bez mazlíčka se sponka nezobrazí');

  // koupě + aktivace mazlíčka → sponka se objeví
  await page.evaluate(() => { RPGWallet.earn(5000); RPGWallet.buy('pet-sova'); });
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => !!document.getElementById('rw-sponka')), 'po koupi+aktivaci mazlíčka se sponka objeví');
  ok(await page.evaluate(() => document.getElementById('rw-sponka-canvas').width === 56), 'canvas se vykreslí');

  // VLASTNĚNÝ, ale NEAKTIVNÍ pet stále zobrazí sponku (owning ⇒ přístup)
  await page.evaluate(() => { const w = RPGWallet.get(); w.cosmetics.active.pet = null; localStorage.setItem(RPGWallet.KEY, JSON.stringify(w)); });
  await page.evaluate(() => { RPGWallet.earn(1); }); // vyvolá emit → _spSync
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => RPGWallet.activeId('pet') === null && RPGWallet.owns('pet-sova')), 'stav: pet vlastněný ale ne aktivní');
  ok(await page.evaluate(() => !!document.getElementById('rw-sponka')), 'vlastněný (i neaktivní) mazlíček → sponka se zobrazí');
  // reaktivace, ať zbytek testu běží s aktivním petem
  await page.evaluate(() => RPGWallet.activate('pet-sova'));
  await page.waitForTimeout(100);

  // toggle vypne/zapne
  await page.evaluate(() => RPGWallet.setSponkaEnabled(false));
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => !document.getElementById('rw-sponka')), 'vypnutí v nastavení sponku skryje');
  await page.evaluate(() => RPGWallet.setSponkaEnabled(true));
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => !!document.getElementById('rw-sponka')), 'zapnutí v nastavení sponku znovu ukáže');

  // klik na sponku: okamžitá chat bublina (bez cooldownu), druhý klik ji zavře
  await page.evaluate(() => { document.getElementById('rw-sponka-bubble').style.display = 'none'; document.getElementById('rw-sponka-canvas').click(); });
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.getElementById('rw-sponka-bubble').style.display === 'block'), 'klik na sponku okamžitě ukáže bublinu (obchází cooldown)');
  await page.evaluate(() => document.getElementById('rw-sponka-canvas').click());
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.getElementById('rw-sponka-bubble').style.display === 'none'), 'druhý klik na sponku bublinu zavře');

  // trénink: streak>=5 → nálada 'good'
  await page.evaluate(() => go('train'));
  await page.evaluate(() => startTrain('1-1'));
  await page.waitForFunction(() => TR.task != null, { timeout: 5000 });
  await page.evaluate(() => { TR.streak = 5; TR.total = 5; TR.correct = 5; });
  await page.waitForTimeout(4300);
  const bubbleGoodVisible = await page.evaluate(() => document.getElementById('rw-sponka-bubble').style.display === 'block');
  ok(bubbleGoodVisible, 'trénink se streakem 5 vyvolá povzbuzující bublinu');

  // cooldown: hned další trigger podmínka nic dalšího nevyvolá (bublina zůstává ta samá / cooldown drží)
  const lastShown1 = await page.evaluate(() => RPGWallet.get() && Date.now()); // jen timestamp reference
  await page.evaluate(() => { document.getElementById('rw-sponka-bubble').style.display = 'none'; });
  await page.waitForTimeout(4300);
  ok(await page.evaluate(() => document.getElementById('rw-sponka-bubble').style.display === 'none'), 'cooldown brání okamžitému dalšímu popupu');

  // boj: HP=1 → auto-nápověda (showHint se zavolá, BT.hl se nastaví na 1) + struggle bublina
  await page.evaluate(() => { window.__SPONKA_COOLDOWN_MS = 0; go('map'); });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const ar = AREAS[0], m = ar.missions[0];
    launchBattle(ar.id, m.id);
  });
  await page.waitForFunction(() => typeof BT !== 'undefined' && BT.curTask, { timeout: 5000 });
  await page.evaluate(() => { BT.hp = 1; BT.hl = 0; BT.missionHinted = false; });
  await page.waitForTimeout(4300);
  // sponka pošeptá nápovědu ve SVÉ bublině — nesahá na herní stav (BT.hl/missionHinted zůstávají)
  ok(await page.evaluate(() => { const b = document.getElementById('rw-sponka-bubble'); return b.style.display === 'block' && b.textContent.includes('💡'); }), 'HP=1: sponka ukáže nápovědu ve své bublině (💡)');
  ok(await page.evaluate(() => BT.hl === 0 && BT.missionHinted === false), 'auto-nápověda NEsahá na herní stav (BT.hl=0, missionHinted=false — odznak „bez nápovědy" zůstává)');

  /* ── vypnutí mazlíčka v obchodu sponku SKUTEČNĚ schová ──────────────
     Vojtovo zadání: kliknu na mazlíčka, kterého mám, vypnu ho — a sponka
     zmizí. Nestačilo smazat `active.pet`: sponka bere i jakéhokoli
     VLASTNĚNÉHO mazlíčka, takže by se hned vrátila. Proto `settings.petOff`.
     Kontroluje se skutečný prvek v DOM, ne jen stav peněženky. */
  ok(await page.evaluate(() => !!document.getElementById('rw-sponka')),
    'před vypnutím sponka v DOM je');
  const poVypnuti = await page.evaluate(async () => {
    RPGWallet.deactivate('pet');
    await new Promise(r => setTimeout(r, 600));   // onChange → _spSync → _spUnmount
    return {
      vDom: !!document.getElementById('rw-sponka'),
      petOff: RPGWallet.get().settings.petOff === true,
      vlastniDal: RPGWallet.owns('pet-sova') || RPGWallet.get().cosmetics.owned.some(id => /^pet-/.test(id)),
    };
  });
  ok(!poVypnuti.vDom, 'po vypnutí mazlíčka sponka z DOM zmizí');
  ok(poVypnuti.petOff, 'vypnutí je zapsané v peněžence');
  ok(poVypnuti.vlastniDal, 'vypnutí nic neukradlo — mazlíček zůstal koupený');

  const zpet = await page.evaluate(async () => {
    const id = (RPGWallet.get().cosmetics.owned.find(x => /^pet-/.test(x)));
    RPGWallet.activate(id);
    await new Promise(r => setTimeout(r, 600));
    return !!document.getElementById('rw-sponka');
  });
  ok(zpet, 'po opětovném zapnutí se sponka vrátí');

  const realErrs = errs.filter(e => !/ERR_|CERT_|Failed to fetch|supabase|jsdelivr/i.test(e));
  ok(realErrs.length === 0, 'žádné JS chyby: ' + realErrs.join(' | '));

  await br.close(); srv.close();
  console.log(`\n  Sponka test (g${GRADE}): ${pass} ✅  /  ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
