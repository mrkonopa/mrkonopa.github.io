/* ══════════════════════════════════════════════════════════════════
   Test: spolužáci uvidí můj vzhled z obchodu i v ŽIVÉM SOUBOJI (fáze 28 `look_of`, klient `rpg-battle-ui.js`).

   Řádky hráčů v čekárně (každý sám i týmy), v průběžném pořadí a ve výsledcích dostanou rámeček s iniciálou,
   barvu jména, titul a mazlíčka (`RPGCloud.lookDekoruj`, tytéž moduly jako v žebříčku třídy). Dokazujeme:
     1. čekárna, průběžné pořadí a výsledky: rámeček i mazlíček se skutečně NAKRESLÍ (pixely), barva jména, titul z katalogu
     2. dotaz `lookOf` jde na VŠECHNY hráče souboje najednou (i na ty, kdo nejsou v top 5 pořadí), ne po částech
     3. úzké řádky (týmová čekárna, průběžné pořadí) titul nenesou, ostatní ano
     4. řádky bez rámečku dostanou prázdné místo stejné šířky (jména začínají pod sebou)
     5. opakované překreslení výsledků (poll 1,2 s) nezdvojí ozdoby
     6. starý `rpg-cloud.js` bez `lookOf`, chyba `lookOf` i nepřátelský vzhled: řádky zůstanou prosté, nic se nevykoná, žádná chyba
     7. jméno hráče s HTML se nevloží jako značka
   Sabotáže (7): bez ozdoby v čekárně / v pořadí / ve výsledcích, titul v úzkých řádcích, dotaz jen na viditelné řádky,
   bez prázdného místa, bez značek `data-uid`.
   Spusť: node tests/rpg-battle-look.test.cjs
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CLOUD_ZDROJ = fs.readFileSync(path.join(ROOT, 'projects/rpg-cloud.js'), 'utf8');
const SHARED = fs.readFileSync(path.join(ROOT, 'projects/rpg-shared.js'), 'utf8');

/* kód vzhledu z rpg-cloud.js (dekorace řádku), beze změny; `lookOf` je v testu napodobenina */
const LOOK_KOD = (() => {
  const a = CLOUD_ZDROJ.indexOf('const LOOK_KAT'), b = CLOUD_ZDROJ.indexOf('async function lookOf(');
  const c = CLOUD_ZDROJ.indexOf('function lookCss()'), d = CLOUD_ZDROJ.indexOf('async function renderLeaderboardInto');
  if (a < 0 || b < a || c < b || d < c) throw new Error('v rpg-cloud.js se nenašel kód vzhledu (LOOK_KAT … lookDekoruj)');
  return CLOUD_ZDROJ.slice(a, b) + CLOUD_ZDROJ.slice(c, d);
})();
const ZAPIS = (() => { const i = SHARED.indexOf('function zapis('); return SHARED.slice(i, SHARED.indexOf('\n', i)); })();

function serve(prepis) {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      const u = decodeURIComponent(q.url.split('?')[0]);
      const f = path.normalize(path.join(ROOT, u));
      if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('nf'); }
      let telo = fs.readFileSync(f);
      const jm = path.basename(f);
      for (const [k, fn] of (prepis || [])) if (k === jm) telo = Buffer.from(fn(telo.toString('utf8')), 'utf8');
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      r.end(telo);
    });
    s.listen(0, () => res(s));
  });
}

const UID = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const ME = UID(1), MATE = UID(2), HOLY = UID(3), HOST = UID(4), P5 = UID(5), P6 = UID(6), P7 = UID(7), P8 = UID(8);
const JM = { [ME]: 'Já Sám', [MATE]: 'Bořek Silný', [HOLY]: 'Cyril Prostý', [HOST]: '<img src=x onerror=window.__xss=1>', [P5]: 'Eva', [P6]: 'Filip', [P7]: 'Gita', [P8]: 'Hana' };
const LOOKY = {
  [ME]: { border: 'border-cyan', title: 'title-lovec' },
  [MATE]: { border: 'border-gold', badge: 'badge-purple', title: 'title-lovec', pet: 'pet-sova' },
  [HOST]: { border: '<img src=x onerror=window.__xss=2>', badge: 'badge-neexistuje', title: 'border-gold', pet: { a: 1 } },
  [P7]: { title: 'title-lovec' }
};

function harness(base, rezim) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>:root{--gold:#19e6e6;--muted:#8895b5}body{width:420px}</style></head><body>
  <script>${ZAPIS}</script>
  <script src="${base}/projects/rpg-wallet.js"></script>
  <script src="${base}/projects/rpg-kosmetika.js"></script>
  <script src="${base}/projects/rpg-mazlicci.js"></script>
  <script>${LOOK_KOD}
    window.__lookDekoruj = lookDekoruj;
  </script>
  <script>
    window.__lookOfVolani = [];
    window.RPGWallet.getReducedMotion = () => true;
    window.RPG_BATTLE_9 = { build: function (seed, count) { var a = []; for (var i = 0; i < count; i++) a.push({ text: 'Otázka ' + (i + 1) + '?', choices: ['A', 'B', 'C', 'D'], correct: 0 }); return a; } };
    var loky = ${JSON.stringify(LOOKY)};
    window.RPGCloud = {
      currentUser: () => ({ id: '${ME}' }), isStaff: () => false,
      createBattle: (g, c, n, tm) => Promise.resolve({ id: 'b1', code: 'WXYZ', team_mode: !!tm }),
      joinBattle: () => Promise.resolve({ id: 'b1', code: 'WXYZ' }),
      pollBattle: (id, cb) => { window.__cb = cb; return () => {}; },
      submitBattleAnswer: () => {}, advanceBattle: () => {}, setBattleStatus: () => {},
      listActiveBattles: () => Promise.resolve([]), myBattleInvites: () => Promise.resolve([]),
      recordBattleResult: () => Promise.resolve(true), rematchBattle: () => Promise.resolve({ id: 'b1' }),
      ${rezim === 'bez-lookof' ? '' : `lookDekoruj: window.__lookDekoruj,
      lookOf: (ids) => { window.__lookOfVolani.push(ids.slice()); ${rezim === 'chyba' ? "return Promise.reject(new Error('look_of nedostupné'));" : "var o = {}; ids.forEach(i => { if (loky[i]) o[i] = loky[i]; }); return Promise.resolve(o);"} },`}
      claimBattleRewards: () => Promise.resolve(null)
    };
  </script>
  <script src="${base}/projects/rpg-battle-ui.js"></script></body></html>`;
}

let SNIM = process.env.SNIMEK || null;   // snímky jen z NEsabotovaného běhu
let pass = 0, fail = 0;
const hl = [];
const ok = (n, c, d = '') => { if (c) pass++; else { fail++; hl.push('  ❌ ' + n + (d ? ' — ' + d : '')); } };

const P = (u, s, c, team) => ({ user_id: u, display_name: JM[u], score: s, correct_count: c, last_qi: 0, team: team === undefined ? null : team });

async function otevri(browser, base, rezim, tym) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  const chyby = [];
  page.on('pageerror', e => chyby.push(String(e.message).slice(0, 140)));
  await page.setContent(harness(base, rezim), { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.RPGBattle !== 'undefined' && typeof window.RPGKosmetika !== 'undefined' && typeof window.RPGMazlicci !== 'undefined', null, { timeout: 8000 });
  await page.evaluate(t => { RPGBattle.open({ game: 'RPG_MAT_9', name: 'Já Sám', autoAction: 'host' }); if (t) RPGBattle._mode(1); RPGBattle._create(5); }, !!tym);
  await page.waitForFunction(() => !!window.__cb, null, { timeout: 4000 });
  return { ctx, page, chyby };
}

const radky = (page, sel) => page.evaluate(s => Array.from(document.querySelectorAll(s)).map(r => {
  const nm = r.querySelector('.rpgb-nm'), tit = r.querySelector('.lk-title');
  const pix = c => { if (!c) return 0; const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i] > 40) n++; return n; };
  return {
    uid: r.getAttribute('data-uid'), text: nm ? nm.textContent : null, trida: nm ? nm.className : '',
    ramy: r.querySelectorAll('.lk-av:not(.lk-prazdny)').length, prazdnych: r.querySelectorAll('.lk-prazdny').length,
    ramPix: pix(r.querySelector('.lk-av canvas')), petPix: pix(r.querySelector('canvas.lk-pet')), pets: r.querySelectorAll('canvas.lk-pet').length,
    titul: tit ? tit.textContent : null, imgs: r.querySelectorAll('img').length, prekryv: r.scrollWidth > r.clientWidth + 1
  };
}), sel);
const podleUid = (rs, u) => rs.find(r => r.uid === u);

/* ═══ scénáře ═══ */
async function scenarCekarna(browser, base, tym) {
  const nez0 = fail, T = (tym ? 'týmová' : 'solo') + ' čekárna: ';
  const { ctx, page, chyby } = await otevri(browser, base, 'ok', tym);
  const hraci = tym ? [P(ME, 0, 0, 0), P(MATE, 0, 0, 1), P(HOLY, 0, 0, 0), P(HOST, 0, 0, 1)] : [P(ME, 0, 0), P(MATE, 0, 0), P(HOLY, 0, 0), P(HOST, 0, 0)];
  await page.evaluate(s => window.__cb(s), { battle: { status: 'lobby', code: 'WXYZ', q_seed: 7, q_count: 5, q_index: -1, team_mode: !!tym }, players: hraci, me: ME });
  await page.waitForFunction(() => /Čekárna/.test(document.body.textContent), null, { timeout: 3000 });
  await page.waitForFunction(() => document.querySelectorAll('.rpgb-ply .lk-av').length >= 2, null, { timeout: 3000 }).catch(() => {});
  await sleep(100);
  if (SNIM) await page.screenshot({ path: path.join(SNIM, 'cekarna-' + (tym ? 'tym' : 'solo') + '.png') }).catch(() => {});
  const rs = await radky(page, '#rpgb-ovl .rpgb-ply[data-uid]');
  ok(T + 'všechny 4 řádky mají data-uid', rs.length === 4, 'řádků ' + rs.length);
  const mate = podleUid(rs, MATE), holy = podleUid(rs, HOLY), me = podleUid(rs, ME), host = podleUid(rs, HOST);
  ok(T + 'spolužák s plným vzhledem: rámeček i mazlíček jsou vykreslené (pixely), barva jména z obchodu', !!mate && mate.ramy === 1 && mate.ramPix > 20 && mate.pets === 1 && mate.petPix > 20 && /\S/.test(mate.trida.replace(/rpgb-nm/, '')), JSON.stringify(mate));
  ok(T + 'řádek hráče ' + (tym ? 'BEZ titulu (úzký sloupec)' : 's titulem z katalogu'), tym ? (!mate.titul && !me.titul) : (!!mate.titul && !!me.titul && mate.titul === me.titul && mate.titul.length > 2), JSON.stringify([mate.titul, me.titul]));
  ok(T + 'řádek bez vzhledu je prostý (jen prázdné místo vedle rámečků)', !!holy && holy.ramy === 0 && holy.pets === 0 && !holy.titul && holy.prazdnych === 1, JSON.stringify(holy));
  ok(T + 'nepřátelský vzhled nic nevložil (žádný <img>, žádná chyba)', !!host && host.imgs === 0 && !(await page.evaluate(() => window.__xss)), JSON.stringify(host));
  ok(T + 'jméno s HTML se vypíše jako text, ne jako značka', !!host && /<img/.test(host.text), JSON.stringify(host && host.text));
  const volani = await page.evaluate(() => window.__lookOfVolani);
  ok(T + 'lookOf dostal všech 4 hráče najednou', volani.length >= 1 && volani[0].length === 4 && [ME, MATE, HOLY, HOST].every(u => volani[0].includes(u)), JSON.stringify(volani.map(v => v.length)));
  const prekryv = rs.filter(r => r.prekryv).length;
  ok(T + 'řádky nepřetékají na telefonu (420 px)', prekryv === 0, prekryv + ' řádků přetéká');
  ok(T + 'žádné JS chyby', chyby.length === 0, chyby.slice(0, 2).join(' | '));
  await ctx.close();
  return fail - nez0;
}

async function scenarPoradiAVysledky(browser, base) {
  const nez0 = fail, T = 'souboj: ';
  const { ctx, page, chyby } = await otevri(browser, base, 'ok', false);
  const hraci = [P(P5, 900, 3), P(HOLY, 800, 3), P(P6, 700, 2), P(MATE, 600, 2), P(P7, 500, 2), P(P8, 300, 1), P(ME, 100, 1)];   // já jsem až 7. → v pořadí se přilepí, Hana (6.) v něm není
  const aktivni = { battle: { status: 'active', code: 'WXYZ', q_seed: 7, q_count: 5, q_index: 0, q_started_at: new Date().toISOString() }, players: hraci, me: ME };
  await page.evaluate(s => window.__cb(s), aktivni);
  await page.waitForFunction(() => !!document.getElementById('rpgb-choices'), null, { timeout: 9000 });   // otázka až po odpočtu 3-2-1
  await page.click('#rpgb-c0');                                                                          // pořadí se ukáže po odpovědi
  await page.waitForFunction(() => document.querySelectorAll('#rpgb-stand [data-uid]').length >= 1, null, { timeout: 4000 });
  await page.waitForFunction(() => document.querySelectorAll('#rpgb-stand .lk-av').length >= 1, null, { timeout: 3000 }).catch(() => {});
  await sleep(100);
  if (SNIM) await page.screenshot({ path: path.join(SNIM, 'poradi.png') }).catch(() => {});
  let rs = await radky(page, '#rpgb-stand [data-uid]');
  ok(T + 'průběžné pořadí: top 5 + já (6 řádků ze 7 hráčů), mate s rámečkem i mazlíčkem', rs.length === 6 && !!podleUid(rs, MATE) && podleUid(rs, MATE).ramy === 1 && podleUid(rs, MATE).pets === 1, JSON.stringify(rs.map(r => [r.text, r.ramy])));
  ok(T + 'průběžné pořadí nemá tituly (nízké řádky)', rs.every(r => !r.titul), JSON.stringify(rs.map(r => r.titul)));
  ok(T + 'jména v pořadí začínají pod sebou (každý řádek má rámeček nebo prázdné místo)', rs.every(r => r.ramy + r.prazdnych === 1), JSON.stringify(rs.map(r => [r.ramy, r.prazdnych])));
  const volani = await page.evaluate(() => window.__lookOfVolani);
  ok(T + 'dotaz na vzhled zahrnul všech 7 hráčů, i Hanu, která v pořadí není (viditelných je jen 6)', volani.length >= 1 && volani.every(v => v.length === 7 && v.includes(P8)), JSON.stringify(volani.map(v => v.length)));

  // konec souboje → výsledky
  await page.evaluate(s => window.__cb(s), { battle: { status: 'finished', code: 'WXYZ', q_seed: 7, q_count: 5, q_index: 5 }, players: hraci, me: ME });
  await page.waitForFunction(() => /Konec souboje/.test(document.body.textContent), null, { timeout: 3000 });
  await page.waitForFunction(() => document.querySelectorAll('#rpgb-ovl .rpgb-ply .lk-av').length >= 2, null, { timeout: 3000 }).catch(() => {});
  await sleep(100);
  rs = await radky(page, '#rpgb-ovl .rpgb-ply[data-uid]');
  const mate = podleUid(rs, MATE), me = podleUid(rs, ME), p7 = podleUid(rs, P7);
  ok(T + 'výsledky: 7 řádků, titul se ukáže (je místo), rámeček a mazlíček u spolužáka', rs.length === 7 && !!mate && mate.ramy === 1 && mate.pets === 1 && !!mate.titul && !!me && me.ramy === 1 && !!me.titul && !!p7 && !!p7.titul && p7.ramy === 0, JSON.stringify(rs.map(r => [r.text, r.ramy, r.titul])));
  // opakované překreslení (poll každých 1,2 s) nezdvojí ozdoby
  for (let i = 0; i < 3; i++) { await page.evaluate(s => window.__cb(s), { battle: { status: 'finished', code: 'WXYZ', q_seed: 7, q_count: 5, q_index: 5 }, players: hraci, me: ME }); await sleep(80); }
  rs = await radky(page, '#rpgb-ovl .rpgb-ply[data-uid]');
  if (SNIM) { await sleep(500); await page.screenshot({ path: path.join(SNIM, 'vysledky.png') }).catch(() => {}); }
  ok(T + 'po 3 dalších překresleních má každý řádek stále jediný rámeček (nebo jediné prázdné místo) a jediného mazlíčka', rs.every(r => r.ramy + r.prazdnych === 1 && r.pets <= 1), JSON.stringify(rs.map(r => [r.ramy, r.prazdnych, r.pets])));
  ok(T + 'žádné JS chyby', chyby.length === 0, chyby.slice(0, 2).join(' | '));
  await ctx.close();
  return fail - nez0;
}

async function scenarBezVzhledu(browser, base, rezim) {
  const nez0 = fail, T = (rezim === 'chyba' ? 'lookOf selže' : 'starý rpg-cloud bez lookOf') + ': ';
  const { ctx, page, chyby } = await otevri(browser, base, rezim, false);
  await page.evaluate(s => window.__cb(s), { battle: { status: 'lobby', code: 'WXYZ', q_seed: 7, q_count: 5, q_index: -1 }, players: [P(ME, 0, 0), P(MATE, 0, 0)], me: ME });
  await page.waitForFunction(() => /Čekárna/.test(document.body.textContent), null, { timeout: 3000 });
  await sleep(250);
  const rs = await radky(page, '#rpgb-ovl .rpgb-ply[data-uid]');
  ok(T + 'čekárna se vykreslí, řádky prosté (bez rámečku, titulu a mazlíčka)', rs.length === 2 && rs.every(r => r.ramy === 0 && r.pets === 0 && !r.titul && r.prazdnych === 0), JSON.stringify(rs));
  ok(T + 'žádné JS chyby ani nezachycená výjimka', chyby.length === 0, chyby.slice(0, 2).join(' | '));
  await ctx.close();
  return fail - nez0;
}

async function sada(browser, base) {
  const n0 = fail;
  await scenarCekarna(browser, base, false);
  await scenarCekarna(browser, base, true);
  await scenarPoradiAVysledky(browser, base);
  await scenarBezVzhledu(browser, base, 'bez-lookof');
  await scenarBezVzhledu(browser, base, 'chyba');
  return fail - n0;
}

(async () => {
  console.log('\n── Vzhled spolužáků v živém souboji ──\n');
  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] });
  try {
    const srv = await serve();
    const base = `http://127.0.0.1:${srv.address().port}`;
    await sada(browser, base);
    srv.close();
    hl.forEach(h => console.log(h));
    console.log(`  ${fail ? '❌' : '✅'} ${pass} kontrol prošlo, ${fail} selhalo`);

    SNIM = null;
    console.log('\nSabotáže (zdroj se mění jen v odpovědi serveru):');
    const SAB = [
      ['čekárna bez ozdoby', 'ozdob(root, st, !!B.teamMode);\n    if (B.role === \'host\') {', 'if (B.role === \'host\') {'],
      ['průběžné pořadí bez ozdoby', "    ozdob(el, st, true);\n", ''],
      ['výsledky bez ozdoby', "shell(inner);\n    ozdob(root, st, !!B.teamMode);", 'shell(inner);'],
      ['titul i v úzkých řádcích', "bezTitulu ? { titul: false } : null", 'null'],
      ['dotaz jen na viditelné řádky, ne na všechny hráče', "var ids = (st.players || []).map(function (p) { return p.user_id; });", "var ids = Array.prototype.map.call(radky, function (r) { return r.getAttribute('data-uid'); });"],
      ['bez prázdného místa pro řádky bez rámečku', "r.insertBefore(sp, nm.closest('.lk-col') || nm);", ''],
      ['bez značek data-uid v pořadí', `'" data-uid="' + esc(p.user_id) + '">' +\n          '<span class="rk">'`, `'">' +\n          '<span class="rk">'`]
    ];
    const UI = fs.readFileSync(path.join(ROOT, 'projects/rpg-battle-ui.js'), 'utf8');
    for (const [jm, od, na] of SAB) {
      if (!UI.includes(od)) { ok('sabotáž se neaplikovala (vzor chybí): ' + jm, false); hl.splice(0).forEach(h => console.log(h)); continue; }
      const s2 = await serve([['rpg-battle-ui.js', t => t.replace(od, na)]]);
      const f0 = fail, p0 = pass, h0 = hl.length;
      let vyjimka = false;
      await sada(browser, `http://127.0.0.1:${s2.address().port}`).catch(() => { vyjimka = true; });
      const nezdary = fail - f0 + (vyjimka ? 1 : 0); pass = p0; fail = f0; hl.length = h0;
      console.log('  ' + (nezdary > 0 ? '✅ sabotáž chycena: ' : '❌ SABOTÁŽ PROŠLA: ') + jm + ' (' + nezdary + ' nezdarů)');
      if (nezdary === 0) fail++;
      s2.close();
    }
  } catch (e) { fail++; console.log('  ❌ běh bez výjimky — ' + (e.stack || e.message)); }
  finally { await browser.close(); }
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
