/* ═════════════════════════════════════════════════════════════════════
   Obrazovka PORAŽEN v 1. stupni (Vojtův pokyn 9. 11. 2026 po hodině v 5. třídě:
   „když někdo dvakrát prohraje, kde může jít procvičit“).

   Dřív měla jen „Zkusit znovu“ a „Mapa oblasti“. Teď (`porazkaNavigace` v rpg-shared.js, volá ji
   `missionFailed` ve hrách 3–5):
     1) po PRVNÍ prohře beze změny — žádné Procvičit ani Teorie, „Zkusit znovu“ je velké;
     2) po DRUHÉ prohře téže mise za sebou: věta, „Procvičit v tréninku“ a „Zopakovat teorii“ NAD
        „Zkusit znovu“ (to je menší), všechna tlačítka jdou zasáhnout a nic není uříznuté, ani na
        nízkém telefonu na šířku (740 × 360);
     3) „Procvičit“ skutečně otevře trénink TÉŽE mise a počítadlo se vynuluje;
     4) výhra počítadlo vynuluje — prohra po ní je zase „první“;
     5) ve hrách 6–9 (tam se nic nezměnilo) leží obsah obrazovky přesně tam, kde ležel bez nového
        sdíleného stylu `.fail-overlay` (ten se týká všech sedmi her) — porovnává se se stránkou, které se
        pravidlo odebere.
   ═════════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) pass++; else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { nactiPisma } = require('./pisma.cjs');
const ROZMERY = [['telefon 360×740', 360, 740], ['telefon na šířku 740×360', 740, 360], ['iPad na výšku', 768, 1024], ['iPad na šířku', 1024, 768]];

function server(prepis) {
  const srv = http.createServer((q, r) => {
    const f = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0])));
    if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    let telo = fs.readFileSync(f), pr = null;
    for (const [k, fn] of Object.entries(prepis || {})) if (k === path.basename(f)) pr = fn;
    if (pr) telo = Buffer.from(pr(telo.toString('utf8')));
    r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(telo);
  });
  return new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv)));
}

/* Stav obrazovky PORAŽEN: co je vidět, v jakém pořadí, co jde zasáhnout. */
const STAV = `(() => {
  const ov = document.getElementById('fail-overlay'), vid = e => !!e && getComputedStyle(e).display !== 'none';
  const tl = [...ov.querySelectorAll('button')].filter(vid);
  const rad = e => !e ? null : e.getBoundingClientRect();
  const pr = document.getElementById('fail-practice'), te = document.getElementById('fail-learn'), ra = document.getElementById('fail-rada');
  const retry = [...ov.querySelectorAll('button')].find(b => /retryMission/.test(b.getAttribute('onclick') || ''));
  const mapa = [...ov.querySelectorAll('button')].find(b => /openArea/.test(b.getAttribute('onclick') || ''));
  /* zasažení: tlačítko se dorolovalo do okna a jeho střed trefí ono samo */
  const zas = b => { b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return r.top >= -1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1 && (e === b || b.contains(e)); };
  const poradi = [pr, te, retry].filter(vid).map(e => e.id || 'retry');
  const y = e => rad(e).top;
  const ikona = ov.firstElementChild, o = rad(ov);
  const hore = rad(ikona).top - o.top;
  return { zobrazeno: ov.classList.contains('show'), practice: vid(pr), learn: vid(te), rada: vid(ra), radaText: ra ? ra.textContent : '',
    retrySm: retry.classList.contains('sm'), poradiOk: (!vid(pr) || (y(pr) < y(retry) && (!vid(te) || (y(pr) < y(te) && y(te) < y(retry))))), poradi,
    zasah: tl.map(zas), zasahVse: tl.every(zas), tlacitek: tl.length, mapaVidet: vid(mapa),
    ikonaNahore: ov.scrollTop === 0 ? hore >= -1 : true, scrolluje: ov.scrollHeight > ov.clientHeight };
})()`;

async function nastart(pg, g) {
  await pg.fill('#ni', 'TESTER');
  await pg.evaluate(() => { startGame(); S.tutorialDone = true; });
  return await pg.evaluate(g => { const ar = AREAS[0], m = ar.missions[0]; launchBattle(ar.id, m.id); return { aid: ar.id, mid: m.id, maUcivo: !!(window['RPG_LEARN_' + g] && window['RPG_LEARN_' + g][m.id]) }; }, g);
}
async function prohra(pg, primo) {
  await pg.evaluate(primo => { BT.hp = 1; BT.secondChance = false; BT.shieldUsed = true; if (primo) { BT.hp = 0; missionFailed(); } else damagePlayer(); }, primo);
  await pg.waitForFunction(() => document.getElementById('fail-overlay').classList.contains('show'), null, { timeout: 4000 });
  await sleep(60);
}

/* Polohy dětí obrazovky PORAŽEN (zaokrouhlené) — pro porovnání s verzí bez nového stylu. */
async function polohy(base, br, g, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  /* Pevné semínko: výška bojové obrazovky závisí na vylosované úloze, a tou by se obrazovka PORAŽEN svisle posunula. */
  await ctx.addInitScript(() => { let a = 20261109; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
  const pg = await ctx.newPage();
  await pg.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'load' });
  await nastart(pg, g);
  await nactiPisma(pg);                                                                                        // písma se načítají líně: bez toho se blok zalomí jinak podle okamžiku měření
  await pg.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });   // vstupní animace by polohu měnila podle okamžiku měření
  await pg.evaluate(() => { BT.hp = 0; missionFailed(); });
  await pg.waitForFunction(() => document.getElementById('fail-overlay').classList.contains('show'), null, { timeout: 4000 });
  await sleep(120);
  const v = await pg.evaluate(() => [...document.getElementById('fail-overlay').children].filter(c => getComputedStyle(c).display !== 'none').map(c => { const r = c.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right)]; }));
  await ctx.close(); return v;
}

async function spust(base, br, hry, rozmery, kde) {
  const chyby = [];
  for (const g of hry) for (const [jm, w, h] of rozmery) {
    const ctx = await br.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    await ctx.addInitScript(() => { window.__TW_TESTNOW = '2026-05-15T10:00:00'; });
    const pg = await ctx.newPage(); pg.on('pageerror', e => chyby.push('g' + g + ': ' + e.message));
    await pg.goto(base + '/projects/rpg-mat-' + g + '.html', { waitUntil: 'load' });
    const m = await nastart(pg, g);
    const k = `${kde}g${g} ${jm}`;
    if (g <= 5) {
      /* 1) první prohra: beze změny */
      await prohra(pg, false);
      const a = await pg.evaluate(STAV);
      ok(`${k}: po 1. prohře žádné Procvičit ani Teorie, „Zkusit znovu“ velké`, a.zobrazeno && !a.practice && !a.learn && !a.rada && !a.retrySm, JSON.stringify(a));
      ok(`${k}: po 1. prohře jde zasáhnout všechno (Zkusit znovu, Mapa oblasti)`, a.zasahVse && a.tlacitek === 2 && a.mapaVidet, JSON.stringify(a));
      /* 2) druhá prohra téže mise */
      await pg.evaluate(() => retryMission());
      await sleep(80);
      await prohra(pg, false);
      const b = await pg.evaluate(STAV);
      ok(`${k}: po 2. prohře věta + Procvičit` + (m.maUcivo ? ' + Teorie' : ''), b.rada && /procvičit/i.test(b.radaText) && b.practice && b.learn === m.maUcivo, JSON.stringify(b));
      ok(`${k}: po 2. prohře je Procvičit (a Teorie) NAD „Zkusit znovu“, které je menší`, b.poradiOk && b.retrySm, JSON.stringify(b));
      ok(`${k}: po 2. prohře jde zasáhnout všechna tlačítka a nic není uříznuté nahoře`, b.zasahVse && b.tlacitek === (m.maUcivo ? 4 : 3) && b.ikonaNahore, JSON.stringify(b));
      /* 3) Procvičit otevře trénink téže mise a počítadlo se vynuluje */
      const bod = await pg.evaluate(() => { const p = document.getElementById('fail-practice'); p.scrollIntoView({ block: 'nearest' }); const r = p.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await pg.touchscreen.tap(bod.x, bod.y);
      await pg.waitForFunction(() => document.querySelector('#s-train.active'), null, { timeout: 3000 }).catch(() => {});
      const t = await pg.evaluate(() => ({ trenink: !!document.querySelector('#s-train.active'), mid: typeof TR !== 'undefined' ? TR.mid : null }));
      ok(`${k}: „Procvičit“ otevře trénink té mise`, t.trenink && t.mid === m.mid, JSON.stringify(t));
      await pg.evaluate(a => launchBattle(a.aid, a.mid), m); await sleep(80);
      await prohra(pg, false);
      const c = await pg.evaluate(STAV);
      ok(`${k}: po tréninku je další prohra zase „první“ (počítadlo vynulováno)`, !c.practice && !c.rada && !c.retrySm, JSON.stringify(c));
      /* 4) výhra počítadlo vynuluje */
      await pg.evaluate(a => { launchBattle(a.aid, a.mid); }, m); await sleep(60);
      await prohra(pg, false);                                               // 2. prohra za sebou (po tréninku byla 1.)
      const d = await pg.evaluate(STAV);
      ok(`${k}: druhá prohra za sebou po tréninku zase nabídne Procvičit`, d.practice && d.rada, JSON.stringify(d));
      await pg.evaluate(a => { launchBattle(a.aid, a.mid); for (let i = 0; i < BT.tasks.length; i++) S.done[`${a.mid}-${i}`] = true; checkMissionComplete(); }, m);
      await sleep(80);
      await pg.evaluate(a => { for (let i = 0; i < 6; i++) delete S.done[`${a.mid}-${i}`]; launchBattle(a.aid, a.mid); }, m); await sleep(60);
      await prohra(pg, false);
      const e = await pg.evaluate(STAV);
      ok(`${k}: po výhře je další prohra zase „první“`, !e.practice && !e.rada && !e.retrySm, JSON.stringify(e));
    }
    await ctx.close();
  }
  return chyby;
}

(async () => {
  console.log('\n── Obrazovka PORAŽEN: po 2. prohře Procvičit a Teorie ──\n');
  const br = await chromium.launch({ executablePath: EXEC });
  const srv = await server(); const base = 'http://127.0.0.1:' + srv.address().port;
  const chyby = await spust(base, br, [3, 4, 5], ROZMERY, '');
  /* 5) hry 6–9 a první prohra v 3–5: polohy shodné s verzí bez nového stylu (jinak by sdílené pravidlo zasáhlo cizí hry) */
  const SHARED = "'.fail-overlay{overflow-y:auto;justify-content:flex-start}' +\n    '.fail-overlay>:first-child{margin-top:auto}.fail-overlay>:last-child{margin-bottom:auto}';";
  const bez = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-shared.js'), 'utf8');
  ok('v rpg-shared.js je očekávaný zápis stylu obrazovky PORAŽEN (jinak by porovnání nic neměřilo)', bez.includes(SHARED));
  const s0 = await server({ 'rpg-shared.js': t => t.replace(SHARED, "'';") }); const base0 = 'http://127.0.0.1:' + s0.address().port;
  for (const g of [6, 7, 8, 9]) for (const [jm, w, h] of [ROZMERY[0], ROZMERY[2], ROZMERY[3]]) {
    const nove = await polohy(base, br, g, w, h), puvodni = await polohy(base0, br, g, w, h);
    ok(`g${g} ${jm}: obrazovka PORAŽEN leží přesně tam, kde ležela bez nového stylu`, JSON.stringify(nove) === JSON.stringify(puvodni) && nove.length >= 4, JSON.stringify(nove) + ' ≠ ' + JSON.stringify(puvodni));
  }
  s0.close();
  ok('bez výjimek na stránkách', chyby.length === 0, chyby.slice(0, 3).join(' | '));
  srv.close();
  console.log('  skutečný kód: ' + (fail ? fail + ' nálezů' : 'bez nálezu'));

  /* sabotáže: každá musí něco shodit (na jedné hře a na rozměrech, kde se projeví) */
  const sh = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-shared.js'), 'utf8');
  const g5 = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-mat-5.html'), 'utf8');
  async function sabotaz(jm, soubor, zmena, hry, rozmery) {
    const orig = soubor === 'rpg-shared.js' ? sh : g5, nove = zmena(orig);
    ok(`sabotáž „${jm}“ se aplikovala`, nove !== orig);
    if (nove === orig) return;
    const f0 = fail, p0 = pass;
    const s = await server({ [soubor]: zmena }); const ch = await spust('http://127.0.0.1:' + s.address().port, br, hry, rozmery, '[sabotáž] ').catch(e => ['výjimka ' + e.message]);
    s.close();
    const chycena = fail > f0 || ch.length > 0;
    fail = f0; pass = p0;                                             // chycená sabotáž nesmí zhoršit výsledek testu
    ok(`sabotáž „${jm}“ je chycena`, chycena);
  }
  await sabotaz('počítadlo se nezvyšuje', 'rpg-shared.js', s => s.replace('_porazky[mid]=(_porazky[mid]||0)+1;', '_porazky[mid]=1;'), [5], [ROZMERY[2]]);
  await sabotaz('výhra počítadlo nevynuluje', 'rpg-mat-5.html', s => s.replace('porazkyVynuluj(BT.mid);', ''), [5], [ROZMERY[2]]);
  await sabotaz('Procvičit až pod „Zkusit znovu“', 'rpg-shared.js', s => s.replace("retry.parentNode.insertBefore(pr,retry);retry.parentNode.insertBefore(te,retry);", "retry.parentNode.appendChild(pr);retry.parentNode.appendChild(te);"), [5], [ROZMERY[2]]);
  await sabotaz('„Zkusit znovu“ se nezmenší', 'rpg-shared.js', s => s.replace("retry.classList.toggle('sm',dvakrat);", ''), [5], [ROZMERY[2]]);
  await sabotaz('trénink se po „Procvičit“ neotevře', 'rpg-shared.js', s => s.replace("goPractice(m);};", "};"), [5], [ROZMERY[2]]);
  await sabotaz('Teorie se nikdy neukáže', 'rpg-shared.js', s => s.replace("te.style.display=(dvakrat&&maUcivo)?'':'none';", "te.style.display='none';"), [5], [ROZMERY[2]]);
  await sabotaz('obrazovka neroluje (uříznutá na nízkém telefonu)', 'rpg-shared.js', s => s.replace("'.fail-overlay{overflow-y:auto;justify-content:flex-start}' +", "''+"), [5], [ROZMERY[1]]);

  await br.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
