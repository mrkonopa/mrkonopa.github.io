/* prijimacky-obnova.test.cjs — rozepsaný test nanečisto přežije obnovení stránky (15. 10. 2026).
   Na tabletu stačí přepnout aplikaci a Safari kartu zahodí. Bez uložení by žák přišel o odpovědi, nákresy
   i o čas. Test dělá, co žák: klikne na „Začít test“, vyplní pole, zaškrtne volbu, vybere přiřazení, nakreslí
   čáru myší do okna konstrukce, stránku obnoví a pokračuje. Ověřuje shodu úloh, odpovědí a nákresu,
   že čas běží dál (konec se neposouvá), zahození, vypršený test (nabídne vyhodnocení), poškozený záznam
   a že odevzdání i vzdání uložený běh smažou. Sabotáž: ukládání v cmStart vypnout → obnova nic nenabídne. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
function serve() { return new Promise(res => { const s = http.createServer((q, p) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const fp = path.normalize(path.join(ROOT, u));
  if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { p.writeHead(404); return p.end('nf'); }
  p.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(p);
}); s.listen(0, () => res(s)); }); }
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
const URL_T = '/projects/prijimacky-matematika/test.html';
const KLIC = 'PZ_TEST_RUN';

(async () => {
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC });
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 } });
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/i.test(m.text())) errs.push(m.text()); });
  page.on('dialog', d => d.accept());
  const nacti = async () => { await page.goto(base + URL_T, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof cmStart === 'function' && window.RPG_CERMAT_9 && document.getElementById('cm-gate'), null, { timeout: 8000 }); };
  const ulozeno = () => page.evaluate(k => localStorage.getItem(k), KLIC);

  console.log('\n── Rozepsaný test přežije obnovení stránky ──\n');
  await nacti();
  ok(await page.evaluate(() => document.getElementById('cm-resume').style.display === 'none'), 'čistá stránka: nabídka pokračování není vidět');

  // ══ 1) Žák test začne a vyplní ══
  await page.click('#cm-gate .pz-btn.primary');
  await page.waitForFunction(() => CM.on && document.querySelectorAll('#cm-tasks .cm-task').length === 16, null, { timeout: 5000 });
  const pole = '#cm-tasks input[type=text]';
  await page.fill(pole, '42');
  const mc = await page.evaluate(() => { const r = document.querySelector('#cm-tasks input[type=radio]'); return r ? { name: r.name, value: r.value } : null; });
  await page.check('#cm-tasks input[type=radio]');
  const sel = await page.evaluate(() => { const s = document.querySelector('#cm-tasks select'); return s ? { id: s.id, hodnoty: [...s.options].map(o => o.value) } : null; });
  if (sel) await page.selectOption('#' + sel.id, sel.hodnoty.find(v => v) || sel.hodnoty[0]);
  const selHodnota = sel ? await page.inputValue('#' + sel.id) : null;
  await page.click('#cm-kn9-nastroje [data-n="ruka"]');
  await page.evaluate(() => document.getElementById('cm-kn9-svg').scrollIntoView({ block: 'center' }));
  const b = await page.evaluate(() => { const r = document.getElementById('cm-kn9-svg').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await page.mouse.move(b.x + b.w * 0.2, b.y + b.h * 0.5); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(b.x + b.w * (0.2 + 0.075 * i), b.y + b.h * 0.5 + (i % 2) * 2, { steps: 2 });
  await page.mouse.up();
  const pred = await page.evaluate(() => ({ tvary: CM.okna[9].tvary.length, text1: document.querySelector('#cm-tasks .cm-task').textContent,
    konstrukceText: CM.tasks.find(t => t.kind === 'konstrukce').u.text, konec: CM.konec }));
  ok(pred.tvary === 1, 'nákres: tah myší nakreslil čáru do okna úlohy 9 (' + pred.tvary + ')');
  // čeká se na uložení Z POZDĚJŠÍ DOBY (po vyplnění a nakreslení); první uložení při startu je prázdné
  await page.waitForFunction(k => { const r = localStorage.getItem(k); if (!r) return false; const x = JSON.parse(r);
    return Object.values(x.odp || {}).includes('42') && Object.values(x.kresby || {}).some(t => t.length === 1); }, KLIC, { timeout: 4000 }).catch(() => {});
  const run = JSON.parse(await ulozeno() || 'null');
  ok(run && run.v === 1 && run.tasks.length === 16 && run.konec === pred.konec, 'uloženo: 16 úloh a konec testu (čas se při obnovení neposune)');
  ok(run && Object.values(run.odp).includes('42'), 'uloženo: odpověď v textovém poli');
  ok(run && (!mc || run.odp[mc.name] === mc.value), 'uloženo: zaškrtnutá volba (' + (mc ? mc.name + '=' + mc.value : 'v testu žádná') + ')');
  ok(run && Object.values(run.kresby).some(t => t.length === 1), 'uloženo: nákres v okně konstrukce');

  // ══ 2) Obnovení stránky → nabídka → pokračování ══
  await nacti();
  const nab = await page.evaluate(() => { const bx = document.getElementById('cm-resume'); return { viditelna: bx.style.display !== 'none', text: bx.textContent }; });
  ok(nab.viditelna && /rozepsaný test/.test(nab.text) && /zbývá \d+:\d\d/.test(nab.text), 'po obnovení stránky se nabídne pokračování: „' + nab.text.replace(/\s+/g, ' ').trim().slice(0, 70) + '…“');
  ok(await page.evaluate(() => !CM.on), 'test se sám nespustil, žák se rozhoduje');
  await page.click('#cm-resume-go');
  await page.waitForFunction(() => CM.on && document.querySelectorAll('#cm-tasks .cm-task').length === 16, null, { timeout: 5000 });
  const po = await page.evaluate(sel0 => ({ text1: document.querySelector('#cm-tasks .cm-task').textContent, pole: document.querySelector('#cm-tasks input[type=text]').value,
    radio: (() => { const r = document.querySelector('#cm-tasks input[type=radio]'); return r ? r.checked : null; })(),
    sel: sel0 ? document.getElementById(sel0.id).value : null, tvary: CM.okna[9].tvary.length, konstrukceText: CM.tasks.find(t => t.kind === 'konstrukce').u.text,
    konec: CM.konec, zbyva: CM.timeLeft, vzor: document.querySelectorAll('#cm-kn9-zak > *').length }), sel);
  ok(po.text1 === pred.text1, 'obnoveno: stejné zadání (ne nově vylosované)');
  ok(po.konstrukceText === pred.konstrukceText, 'obnoveno: stejná konstrukce');
  ok(po.pole === '42', 'obnoveno: odpověď v poli (' + po.pole + ')');
  ok(po.radio === (mc ? true : null), 'obnoveno: zaškrtnutá volba');
  ok(!sel || po.sel === selHodnota, 'obnoveno: vybrané přiřazení (' + po.sel + ')');
  ok(po.tvary === 1 && po.vzor === 1, 'obnoveno: nákres je v okně i v SVG (' + po.tvary + ' / ' + po.vzor + ')');
  ok(po.konec === pred.konec && po.zbyva > 70 * 60 - 120 && po.zbyva <= 70 * 60, 'obnoveno: čas běží dál od původního konce (zbývá ' + po.zbyva + ' s)');
  await page.waitForTimeout(1300);
  ok(await page.evaluate(z => CM.timeLeft < z, po.zbyva), 'obnoveno: odpočet po pokračování běží');

  // ══ 3) Odevzdání smaže uložený běh ══
  await page.evaluate(() => cmSubmit(false));
  ok(await ulozeno() === null, 'odevzdání: uložený běh je pryč');
  await nacti();
  ok(await page.evaluate(() => document.getElementById('cm-resume').style.display === 'none'), 'po odevzdání se nic nenabízí');

  // ══ 4) Zahodit ══
  await page.click('#cm-gate .pz-btn.primary'); await page.waitForFunction(() => CM.on, null, { timeout: 5000 });
  await page.fill(pole, '7'); await page.waitForFunction(k => !!localStorage.getItem(k), KLIC, { timeout: 4000 });
  await nacti();
  ok(await page.evaluate(() => document.getElementById('cm-resume').style.display !== 'none'), 'zahození: nabídka se zobrazí');
  await page.click('#cm-resume-drop');
  ok(await ulozeno() === null && await page.evaluate(() => document.getElementById('cm-resume').style.display === 'none'), 'zahození: záznam smazán a nabídka zmizí');

  // ══ 5) Čas vypršel, než se žák vrátil ══
  await page.click('#cm-gate .pz-btn.primary'); await page.waitForFunction(() => CM.on, null, { timeout: 5000 });
  await page.fill(pole, '9'); await page.waitForFunction(k => !!localStorage.getItem(k), KLIC, { timeout: 4000 });
  await page.evaluate(k => { const r = JSON.parse(localStorage.getItem(k)); r.konec = Date.now() - 60000; localStorage.setItem(k, JSON.stringify(r)); }, KLIC);
  await page.evaluate(() => { stopTimer(); CM.on = false; });   // jako by karta zanikla, a ne dobíhala
  await nacti();
  const vyp = await page.evaluate(() => ({ text: document.getElementById('cm-resume').textContent, tl: document.getElementById('cm-resume-go').textContent }));
  ok(/vypršel/.test(vyp.text) && /Vyhodnotit/.test(vyp.tl), 'vypršelý test: nabídne vyhodnocení, ne pokračování („' + vyp.tl + '“)');
  const pokusuPred = await page.evaluate(() => JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS') || '[]').length);
  await page.click('#cm-resume-go');
  // hned po kliknutí, ne až po prvním tiknutí odpočtu: žák nemá vidět vteřinu rozepsaného testu, který už vypršel
  ok(await page.evaluate(() => document.getElementById('cm-end').style.display !== 'none'), 'vypršelý test: výsledek se ukáže hned, bez probliknutí testu');
  await page.waitForFunction(() => document.getElementById('cm-end').style.display !== 'none', null, { timeout: 5000 });
  const konec = await page.evaluate(k => ({ bezi: CM.on, pokusu: JSON.parse(localStorage.getItem('PZ_CERMAT_ATTEMPTS') || '[]').length, zbyl: localStorage.getItem(k) }), KLIC);
  ok(!konec.bezi && konec.pokusu === pokusuPred + 1 && konec.zbyl === null, 'vypršelý test: vyhodnotí se, výsledek se zapíše jednou a záznam zmizí (pokusů ' + pokusuPred + ' → ' + konec.pokusu + ')');

  // ══ 6) Poškozený záznam nesmí nic rozbít ══
  for (const [popis, hodnota] of [['nečitelný JSON', '{rozbite'], ['špatný tvar úloh', '{"v":1,"konec":5,"tasks":[1,2]}'], ['bez konce', '{"v":1,"tasks":[{"no":1}]}'], ['cizí verze', '{"v":9,"konec":5,"tasks":[{"no":1}]}']]) {
    await page.evaluate(([k, h]) => localStorage.setItem(k, h), [KLIC, hodnota]);
    await nacti();
    ok(await page.evaluate(() => document.getElementById('cm-resume').style.display === 'none' && !CM.on), 'poškozený záznam (' + popis + '): nic se nenabízí, stránka funguje');
  }
  await page.evaluate(k => localStorage.removeItem(k), KLIC);

  // ══ 7) Vzdání smaže uložený běh ══
  await nacti();
  await page.click('#cm-gate .pz-btn.primary'); await page.waitForFunction(() => CM.on, null, { timeout: 5000 });
  await page.fill(pole, '1'); await page.waitForFunction(k => !!localStorage.getItem(k), KLIC, { timeout: 4000 });
  await page.evaluate(() => cmGiveUp());
  ok(await ulozeno() === null, 'vzdání: uložený běh je pryč');

  ok(errs.length === 0, 'žádné JS chyby' + (errs.length ? ' [' + errs[0] + ']' : ''));
  await browser.close(); srv.close();
  console.log('\n  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
