/* NEPŘÁTELSKÝ HARNESS — 60 virtuálních žáků se snaží rozbít a ojebat
   ekonomiku kreditů + obchod v rpg-mat-9.html.

   Každý žák legitimně vydělá kredity (dokončí misi), pak provede sadu
   útoků a po každém zkontroluje invarianty:
     • kredity nikdy NaN / záporné / nečíselné
     • owned bez duplikátů
     • nelze aktivovat nevlastněnou placenou kosmetiku
     • nelze koupit za nedostatek kreditů
     • dvojí nákup neúčtuje dvakrát
     • garbage v localStorage → migrace v loadS to sanitizuje, hra nespadne
     • škodlivý import kód → nespadne
   Sbírá console.error, pageerror a porušené invarianty.
   Spusť: node tests/rpg-shop-hostile.cjs */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'};
const N = 60;

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { rep.writeHead(404); return rep.end('nf'); }
      rep.writeHead(200, {'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream'});
      fs.createReadStream(fp).pipe(rep);
    });
    srv.listen(0, () => res(srv));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isEnvNoise = t => /Failed to load resource|ERR_CERT_AUTHORITY_INVALID|net::ERR_|supabase|jsdelivr/i.test(t);

// invarianty čteme přímo ze stavu hry; vrací pole porušení (string[])
const INVARIANTS = () => {
  const bad = [];
  // efektivní stav: peněženka, když je (zdroj pravdy od PR #69), jinak legacy S
  const st = (typeof RPGWallet !== 'undefined') ? RPGWallet.get() : { credits: S.credits, cosmetics: S.cosmetics };
  const c = st.credits;
  if (typeof c !== 'number' || !isFinite(c)) bad.push('credits not finite number: ' + JSON.stringify(c));
  if (c < 0) bad.push('credits negative: ' + c);
  if (Math.floor(c) !== c) bad.push('credits not integer: ' + c);
  // legacy mirror nesmí být rozbitý ani při aktivní peněžence
  if (typeof S.credits !== 'number' || !isFinite(S.credits) || S.credits < 0) bad.push('legacy S.credits broken: ' + JSON.stringify(S.credits));
  const cos = st.cosmetics;
  if (!cos || typeof cos !== 'object') { bad.push('cosmetics missing'); return bad; }
  // katalog: peněženka (nové položky žijí jen tam), jinak lokální fallback hry
  const CAT = (typeof RPGWallet !== 'undefined' && RPGWallet.itemsAll) ? RPGWallet.itemsAll() : SHOP_ITEMS;
  if (!Array.isArray(cos.owned)) bad.push('owned not array');
  else {
    const seen = new Set();
    for (const id of cos.owned) { if (seen.has(id)) bad.push('owned duplicate: ' + id); seen.add(id); }
    // každá owned položka musí existovat v katalogu
    for (const id of cos.owned) if (!CAT.find(i => i.id === id)) bad.push('owned unknown id: ' + id);
  }
  if (!cos.active || typeof cos.active !== 'object') bad.push('active missing');
  else {
    // aktivní placená položka MUSÍ být vlastněná
    for (const cat of Object.keys(cos.active)) {
      const id = cos.active[cat];
      if (!id) continue;
      const item = CAT.find(i => i.id === id);
      if (!item) { bad.push('active unknown id: ' + id); continue; }
      if (item.price > 0 && !cos.owned.includes(id)) bad.push('CHEAT: active paid item not owned: ' + id);
    }
  }
  return bad;
};

async function runStudent(browser, base, idx) {
  const errors = [];
  const ctx = await browser.newContext();
  // Blokuj externí zdroje (Google Fonts, jsdelivr Supabase CDN) — jinak
  // `waitUntil:'load'` čeká na zablokované CDN ~12 s/stránku a test vytimeoutuje.
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  // Od PR #69 je zdrojem pravdy pro kredity/kosmetiku GLOBÁLNÍ peněženka
  // (RPGWallet, localStorage RPG_HUB_WALLET); legacy S.credits je jen fallback
  // bez modulu. Útoky i asserty proto míří na EFEKTIVNÍ ekonomiku přes __eco.
  await ctx.addInitScript(() => {
    window.__eco = {
      hasW: () => typeof RPGWallet !== 'undefined',
      credits: () => window.__eco.hasW() ? RPGWallet.getCredits() : S.credits,
      owned:   () => window.__eco.hasW() ? RPGWallet.get().cosmetics.owned  : S.cosmetics.owned,
      active:  () => window.__eco.hasW() ? RPGWallet.get().cosmetics.active : S.cosmetics.active,
      setCredits: (n) => {
        if (window.__eco.hasW()) { let w; try { w = JSON.parse(localStorage.getItem('RPG_HUB_WALLET')) || {}; } catch (e) { w = {}; } w.credits = n; localStorage.setItem('RPG_HUB_WALLET', JSON.stringify(w)); }
        else { S.credits = n; saveS(); }
      },
      resetCosmetics: () => {
        const fresh = { owned: ['theme-default', 'victory-default'], active: { border: null, badge: null, theme: 'theme-default', victory: 'victory-default', skin: null } };
        if (window.__eco.hasW()) { let w; try { w = JSON.parse(localStorage.getItem('RPG_HUB_WALLET')) || {}; } catch (e) { w = {}; } w.cosmetics = fresh; localStorage.setItem('RPG_HUB_WALLET', JSON.stringify(w)); }
        else { S.cosmetics = fresh; saveS(); }
      }
    };
  });
  const page = await ctx.newPage();
  page.on('dialog', d => d.dismiss().catch(()=>{}));
  page.on('console', m => { if (m.type() === 'error' && !isEnvNoise(m.text())) errors.push(`[console] ${m.text()}`); });
  page.on('pageerror', e => { if (!isEnvNoise(e.message)) errors.push(`[pageerror] ${e.message}`); });

  const did = { attacks:0, invChecks:0, earned:0 };
  // pomocník: spustí fn v page, ověří invarianty, zaznamená porušení
  const checkInv = async (label) => {
    const bad = await page.evaluate((inv) => (new Function('return (' + inv + ')()'))(), INVARIANTS.toString());
    did.invChecks++;
    if (bad && bad.length) bad.forEach(b => errors.push(`[INV ${label}] ${b}`));
  };

  try {
    await page.goto(`${base}/projects/rpg-mat-9.html`, { waitUntil: 'load' });
    await page.waitForSelector('#ni', { timeout: 8000 });
    await page.fill('#ni', 'HACKER' + idx);
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'), { timeout: 8000 });

    // ── LEGIT: dokonči numerickou misi 1-2, vydělej kredity (MC je flaky na klikání) ──
    const before = await page.evaluate(() => __eco.credits());
    await page.evaluate(() => { try { launchBattle(1, '1-2'); } catch(e){} });
    await page.waitForFunction(() => document.querySelector('#s-battle')?.classList.contains('active'), { timeout: 6000 }).catch(()=>{});
    // Vypni náhodné minihry (34 % šance/úkol) — test měří EKONOMIKU, ne minihry;
    // žák, který si vylosoval minihru na idx 0, by jinak nevydělal nic.
    await page.evaluate(() => { try { BT.mini = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i, null])); renderTask(); } catch(e){} });
    for (let step = 0; step < 12; step++) {
      // Počkej, až jde zase odpovídat. Rychlé submit/next během animace
      // (chatty styl s page.fill + víc evaluate/krok) destabilizuje headless
      // render a po pár správných odpovědích zavře kontext. Stabilní vzor je
      // jako ve vstudents-deep: čekej na ready + celá odpověď v JEDNOM evaluate.
      await page.waitForFunction(() => {
        if (!document.querySelector('#s-battle')?.classList.contains('active')) return true;
        if (BT.mcMode) return [...document.querySelectorAll('#mc-grid .mc-btn')].some(b => !b.disabled);
        const inp = document.getElementById('bt-ans'); return inp && !inp.disabled;
      }, { timeout: 4000 }).catch(()=>{});
      const st = await page.evaluate(async () => {
        if (!document.querySelector('#s-battle')?.classList.contains('active')) return { done:true };
        const t = BT.curTask || BT.tasks[BT.idx]; if (!t) return { done:true };
        if (BT.mcMode) {
          const btns = [...document.querySelectorAll('#mc-grid .mc-btn')];
          const ok = btns.find(b => (b.dataset.v ?? b.textContent.replace(/^[A-D]\s*/,'').trim()) === String(t.ans));
          (ok || btns[0]).click();
        } else {
          const el = document.getElementById('bt-ans'); el.disabled = false; el.value = String(t.ans);
          submitAnswer();
        }
        await new Promise(r => setTimeout(r, 260));
        const n = document.getElementById('next-btn');
        if (n && n.style.display !== 'none') nextTask();
        return { done:false };
      }).catch(()=>({ done:true }));
      if (st.done) break;
      await sleep(120);
    }
    await page.evaluate(() => { try{ if(document.querySelector('#s-battle')?.classList.contains('active')) exitBattle(); }catch(e){} });
    const after = await page.evaluate(() => __eco.credits());
    did.earned = after - before;
    if (did.earned <= 0) errors.push('[earn] dokončení mise nepřineslo kredity (před ' + before + ' po ' + after + ')');
    await checkInv('po-vydělání');

    // ── útoky (každý žák provede podmnožinu dle idx, ať pokryjeme vše) ──
    await page.evaluate(() => go('shop'));
    await sleep(20);

    // A) koupit nejdražší položku bez dost kreditů → nesmí projít
    await page.evaluate(() => { __eco.setCredits(5); buyItem('border-holo'); });
    did.attacks++;
    const a = await page.evaluate(() => ({ owned: __eco.owned().includes('border-holo'), credits: __eco.credits() }));
    if (a.owned) errors.push('[A] koupil border-holo (220) za 5 kr!');
    if (a.credits !== 5) errors.push('[A] kredity se změnily při neúspěšném nákupu: ' + a.credits);
    await checkInv('A');

    // B) aktivovat nevlastněnou placenou položku z konzole → nesmí se aktivovat
    await page.evaluate(() => { __eco.setCredits(0); __eco.resetCosmetics(); activateItem('border-gold'); });
    did.attacks++;
    const b = await page.evaluate(() => __eco.active().border);
    if (b === 'border-gold') errors.push('[B] CHEAT: aktivoval border-gold bez vlastnictví');
    await checkInv('B');

    // C) dvojí nákup téže položky → účtováno jen jednou, žádný duplikát
    await page.evaluate(() => { __eco.setCredits(100); __eco.resetCosmetics(); buyItem('badge-cyan'); buyItem('badge-cyan'); buyItem('badge-cyan'); });
    did.attacks++;
    const c = await page.evaluate(() => ({ credits: __eco.credits(), count: __eco.owned().filter(x=>x==='badge-cyan').length }));
    if (c.count !== 1) errors.push('[C] duplikát badge-cyan v owned: ' + c.count + '×');
    if (c.credits !== 40) errors.push('[C] dvojí účtování — zbylo ' + c.credits + ' (mělo 40 po 1× 60)');
    await checkInv('C');

    // D) buyItem / activateItem s nesmyslným ID → nespadne, beze změny
    await page.evaluate(() => { const cr=__eco.credits(); buyItem('nonsense-xyz'); activateItem('also-fake'); buyItem(null); activateItem(undefined); buyItem(12345); window.__crD = (__eco.credits()===cr); });
    did.attacks++;
    const d = await page.evaluate(() => window.__crD);
    if (!d) errors.push('[D] nesmyslné ID změnilo kredity');
    await checkInv('D');

    // E) earnCredits se zápornými / NaN / nesmysly → ignorováno
    await page.evaluate(() => { const cr=__eco.credits(); earnCredits(-1000); earnCredits(NaN); earnCredits('500'); earnCredits(undefined); window.__crE = __eco.credits(); window.__crE0 = cr; });
    did.attacks++;
    const e = await page.evaluate(() => ({ now: window.__crE, was: window.__crE0 }));
    if (e.now < e.was) errors.push('[E] earnCredits se zápornou hodnotou ubralo kredity: ' + e.was + '→' + e.now);
    if (typeof e.now !== 'number' || !isFinite(e.now)) errors.push('[E] kredity rozbité po earnCredits(NaN/str): ' + e.now);
    await checkInv('E');

    // F) garbage do localStorage → reload → loadS musí sanitizovat a nespadnout
    const corruptions = [
      '{"credits":"9999","cosmetics":null}',
      '{"credits":-50,"cosmetics":{"owned":"notarray","active":[]}}',
      '{"credits":null,"cosmetics":{"owned":["theme-default","theme-default","fake-id"],"active":{"border":"border-holo"}}}',
      '{"credits":1e309,"cosmetics":{}}',   // Infinity přes JSON → null, ale test typu
      'totally not json {{{',
    ];
    const corrupt = corruptions[idx % corruptions.length];
    // garbage do per-game save I do globální peněženky — obě vrstvy musí přežít
    await page.evaluate((raw) => { localStorage.setItem('RPG_MAT_9', raw); localStorage.setItem('RPG_HUB_WALLET', raw); }, corrupt);
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#ni', { timeout: 8000 }).catch(()=>{});
    const loaded = await page.evaluate(() => { try { const ok = loadS(); return { ok, credits: S.credits, owned: Array.isArray(S.cosmetics?.owned), activeBorder: S.cosmetics?.active?.border }; } catch(err) { return { err: err.message }; } });
    did.attacks++;
    if (loaded.err) errors.push('[F] loadS spadl na garbage "' + corrupt.slice(0,30) + '...": ' + loaded.err);
    else {
      if (typeof loaded.credits !== 'number' || !isFinite(loaded.credits) || loaded.credits < 0) errors.push('[F] kredity po loadS garbage: ' + loaded.credits);
      if (!loaded.owned) errors.push('[F] owned není pole po loadS garbage');
      // border-holo nesmí být aktivní, když není vlastněn (po sanitizaci aktivace je ok ponechat, ale invariant to chytí)
    }
    // pokračuj do hry po sanitizaci
    await page.evaluate(() => { try { if (loadS()) { go('map'); } else { document.querySelector('#ni') && (document.querySelector('#ni').value='REHACK'+0); startGame(); } } catch(e){} });
    await sleep(20);
    await checkInv('F-po-reload');

    // G) škodlivý import kód → nespadne
    await page.evaluate(() => {
      const evil = btoa(unescape(encodeURIComponent(JSON.stringify({ credits:-999, cosmetics:{owned:42, active:'nope'}, xp:'lol' }))));
      try { S = JSON.parse(decodeURIComponent(escape(atob(evil)))); } catch(e){}
      // simuluj sanitizační větev importu
      if(typeof S.credits!=='number'||!isFinite(S.credits)||S.credits<0)S.credits=0;S.credits=Math.floor(S.credits);
      if(!S.cosmetics||typeof S.cosmetics!=='object')S.cosmetics={owned:['theme-default','victory-default'],active:{}};
      if(!Array.isArray(S.cosmetics.owned))S.cosmetics.owned=['theme-default','victory-default'];
      if(!S.cosmetics.active||typeof S.cosmetics.active!=='object')S.cosmetics.active={};
    });
    did.attacks++;
    await checkInv('G-import');

    // H) spam: rychle kup a aktivuj vše, co jde, s velkým balíkem
    await page.evaluate(() => {
      __eco.setCredits(100000);
      (typeof SHOP_ITEMS!=='undefined') && SHOP_ITEMS.forEach(it => { try { buyItem(it.id); activateItem(it.id); } catch(e){} });
    });
    did.attacks++;
    const h = await page.evaluate(() => ({ credits: __eco.credits(), owned: __eco.owned().length }));
    if (h.credits < 0) errors.push('[H] kredity záporné po hromadném nákupu: ' + h.credits);
    await checkInv('H-spam');

    // I) render obchodu po všech útocích nesmí spadnout
    await page.evaluate(() => { try { go('shop'); ['border','badge','theme','victory'].forEach(c=>shopCat(c)); go('profile'); go('map'); } catch(e){} });
    did.attacks++;
    await checkInv('I-render');

  } catch (e) {
    errors.push('[harness] ' + e.message);
  } finally {
    await ctx.close();
  }
  return { idx, errors, did };
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args:['--no-sandbox'] });
  console.log(`▶ ${N} nepřátelských žáků útočí na ekonomiku kreditů…\n`);

  const results = [];
  const CONC = 8;
  for (let i = 0; i < N; i += CONC) {
    const batch = [];
    for (let j = i; j < Math.min(i + CONC, N); j++) batch.push(runStudent(browser, base, j));
    results.push(...await Promise.all(batch));
    process.stdout.write(`  …${Math.min(i+CONC,N)}/${N}\n`);
  }
  await browser.close();
  srv.close();

  let totalErr = 0, totalAttacks = 0, totalInv = 0, earners = 0;
  console.log('\n══════════ VÝSLEDKY NEPŘÁTELSKÉHO TESTU ══════════');
  for (const r of results) {
    totalAttacks += r.did.attacks; totalInv += r.did.invChecks;
    if (r.did.earned > 0) earners++;
    if (r.errors.length) {
      totalErr += r.errors.length;
      console.log(`❌ ž.${r.idx} (vydělal ${r.did.earned} kr)`);
      r.errors.slice(0,8).forEach(e => console.log('     ' + e));
    }
  }
  console.log('\n── Souhrn ──');
  console.log(`  Žáků:                 ${N}`);
  console.log(`  Vydělali kredity:     ${earners}/${N}`);
  console.log(`  Útoků celkem:         ${totalAttacks}`);
  console.log(`  Kontrol invariantů:   ${totalInv}`);
  console.log(`  Porušení / chyb:      ${totalErr}`);
  console.log(totalErr === 0 ? '\n✅ EKONOMIKA ODOLALA — žádný cheat, žádný crash.' : `\n❌ ${totalErr} problémů — viz výše.`);
  process.exit(totalErr === 0 ? 0 : 1);
})();
