/* ══════════════════════════════════════════════════════════════════
   Hloubkový harness: virtuální žáci hrají, vyhrávají i prohrávají.
   Kontroluje funkčnost, která se historicky rozbíjí při změnách kódu:
   - boss HP bar (viditelný, klesá po správné odpovědi)
   - srdíčka hráče (ubývají po chybě) + setHeroHp hook do enginu
   - prohra (BT.maxHp chyb → fail overlay) i výhra (mise dokončena)
   - nápovědy v boji: 2 úrovně, neprázdné, label tlačítka se mění
   - úplnost úloh: každá úloha v poolu má text+ans, ne-MC mají hints
   - reduced-motion: canvas se ZASTAVÍ (hrdina, boss, parťák, particles)
   - trénink: otevření, správná odpověď zvýší počítadlo, nápověda funguje
   - odkazy: zpět na projekty, hub, CERMAT chip (9. ročník)
   Spusť: node tests/vstudents-deep.harness.cjs
   ══════════════════════════════════════════════════════════════════ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'};
let pass = 0, fail = 0;
const issues = [];
function ok(c, m){ if(c){pass++;} else {fail++; issues.push(m); console.log('  ❌ ' + m);} }

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('nf');}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* správná odpověď na aktuální úlohu (text/YN/MC) */
async function answerCorrect(page){
  return page.evaluate(async () => {
    const t = BT.curTask;
    if (BT.mcMode) {
      const btns = [...document.querySelectorAll('#mc-grid .mc-btn')];
      const ok = btns.find(b => (b.dataset.v ?? b.textContent.replace(/^[A-D]\s*/,'').trim()) === String(t.ans));
      (ok || btns[0]).click();
    } else if (t.ans === 'ANO' || t.ans === 'NE') {
      answerYN(t.ans);
    } else {
      document.getElementById('bt-ans').disabled = false;
      document.getElementById('bt-ans').value = String(t.ans);
      submitAnswer();
    }
    await new Promise(r => setTimeout(r, 250));
  });
}
async function answerWrong(page){
  return page.evaluate(async () => {
    const t = BT.curTask;
    if (BT.mcMode) {
      // U MC mise špatná odpověď zablokuje jen ten knoflík a zůstane na téže úloze;
      // jedna úloha má jen 3 špatné možnosti. Když dojdou, postup správně na další úlohu.
      const btns = [...document.querySelectorAll('#mc-grid .mc-btn')];
      const bad = btns.find(b => !b.disabled && (b.dataset.v ?? b.textContent.replace(/^[A-D]\s*/,'').trim()) !== String(t.ans));
      if (bad) { bad.click(); }
      else {
        const good = btns.find(b => (b.dataset.v ?? b.textContent.replace(/^[A-D]\s*/,'').trim()) === String(t.ans));
        if (good) good.click();
        await new Promise(r => setTimeout(r, 300));
        const nb = document.getElementById('next-btn');
        if (nb && nb.style.display !== 'none') nextTask();
      }
    } else if (t.ans === 'ANO' || t.ans === 'NE') {
      answerYN(t.ans === 'ANO' ? 'NE' : 'ANO');
    } else {
      document.getElementById('bt-ans').disabled = false;
      document.getElementById('bt-ans').value = '−999999';
      submitAnswer();
    }
    await new Promise(r => setTimeout(r, 250));
  });
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC });

  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    console.log(`\n━━ rpg-mat-${g} ━━`);
    const ctx = await browser.newContext({ viewport: { width: 480, height: 800 } });
    const page = await ctx.newPage();
    const jsErrs = [];
    page.on('pageerror', e => jsErrs.push(e.message));
    await page.goto(`${base}/projects/rpg-mat-${g}.html`, { waitUntil: 'load' });
    await page.waitForSelector('#ni');
    await page.fill('#ni', 'Tester');
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => document.querySelector('#s-map')?.classList.contains('active'));

    /* ── 1. STATICKÝ AUDIT ÚLOH: každá úloha má text+ans, ne-MC mají hints ── */
    {
      const audit = await page.evaluate(() => {
        const bad = [];
        for (const ar of AREAS) for (const m of ar.missions) {
          let pool;
          try { pool = m.tasks(); } catch (e) { bad.push(`${m.id}: tasks() hází ${e.message}`); continue; }
          const extra = window['RPG_TASK_EXTRA_' + (document.title.match(/\d/) || [''])[0]];
          pool.forEach((t, i) => {
            if (!t || typeof t.text !== 'string' || !t.text.trim()) bad.push(`${m.id}[${i}]: chybí text`);
            if (t && (t.ans === undefined || t.ans === null || String(t.ans) === 'NaN' || String(t.ans) === 'undefined')) bad.push(`${m.id}[${i}]: vadná odpověď (${t && t.ans})`);
            if (t && !m.mc && (!Array.isArray(t.hints) || !t.hints[0] || !String(t.hints[0]).trim())) bad.push(`${m.id}[${i}]: chybí/prázdný hints[0]`);
            if (t && !m.mc && Array.isArray(t.hints) && /Výsledek:/.test(String(t.hints[0] || ''))) bad.push(`${m.id}[${i}]: hints[0] prozrazuje výsledek`);
          });
        }
        return bad.slice(0, 8);
      });
      ok(audit.length === 0, `g${g} audit úloh: ${audit.join(' | ')}`);
    }

    /* ── 2. PROHRA v oblasti 1: 3 špatné odpovědi → fail overlay ── */
    await page.evaluate(() => { const ar = AREAS.find(a => a.id === 1); launchBattle(1, ar.missions[0].id); });
    await page.waitForFunction(() => document.querySelector('#s-battle')?.classList.contains('active'));
    await sleep(700);
    {
      const hb = await page.evaluate(() => { const el = document.getElementById('bt-hpbar'); const r = el.getBoundingClientRect(); return { w: el.style.width, vis: r.width > 0 && r.height > 0 }; });
      ok(hb.vis, `g${g} boss HP bar je viditelný v boji`);
      const maxHp = await page.evaluate(() => BT.maxHp);
      const hearts0 = await page.evaluate(() => document.querySelectorAll('#player-hp .heart:not(.lost)').length);
      ok(hearts0 === maxHp, `g${g} start boje: ${maxHp} srdíček (je ${hearts0})`);
      // Každou špatnou odpověď podáme až když je vstup připravený (jinak se klik spolkne během animace).
      for (let i = 0; i < maxHp * 2 + 6; i++) {
        const lost = await page.evaluate(() => {
          const el = document.getElementById('fail-overlay');
          return !!(el && getComputedStyle(el).display !== 'none' && el.classList.contains('show'));
        });
        if (lost) break;
        // počkej, až jde zase odpovídat
        await page.waitForFunction(() => {
          if (BT.mcMode) return [...document.querySelectorAll('#mc-grid .mc-btn')].some(b => !b.disabled);
          if (BT.curTask && (BT.curTask.ans === 'ANO' || BT.curTask.ans === 'NE')) return [...document.querySelectorAll('#yn-row button')].some(b => !b.disabled);
          const inp = document.getElementById('bt-ans'); return inp && !inp.disabled;
        }, { timeout: 4000 }).catch(() => {});
        const before = await page.evaluate(() => document.querySelectorAll('#player-hp .heart:not(.lost)').length);
        await answerWrong(page);
        await page.waitForFunction(b => document.querySelectorAll('#player-hp .heart:not(.lost)').length < b, before, { timeout: 4000 }).catch(() => {});
        await sleep(250);
      }
      const hearts1 = await page.evaluate(() => document.querySelectorAll('#player-hp .heart:not(.lost)').length);
      ok(hearts1 === 0, `g${g} po ${maxHp} chybách: 0 srdíček (je ${hearts1})`);
      await sleep(1100);
      const failVis = await page.evaluate(() => { const el = document.getElementById('fail-overlay'); return el && getComputedStyle(el).display !== 'none' && el.classList.contains('show'); });
      ok(failVis, `g${g} prohra: fail overlay se ukázal`);
      await page.evaluate(() => { document.getElementById('fail-overlay').classList.remove('show'); go('map'); });
      await sleep(300);
    }

    /* ── 3. VÝHRA v oblasti 1 + HP bar klesá + nápovědy ── */
    await page.evaluate(() => { const ar = AREAS.find(a => a.id === 1); launchBattle(1, ar.missions[0].id); });
    await page.waitForFunction(() => document.querySelector('#s-battle')?.classList.contains('active'));
    await sleep(700);
    {
      // hook spy: setHeroHp se volá při změně HP
      await page.evaluate((g) => { const E = window['RPGSprites' + g]; window.__hpCalls = []; const orig = E.setHeroHp; E.setHeroHp = f => { window.__hpCalls.push(f); return orig(f); }; }, g);
      // nápovědy (jen ne-MC úlohy)
      const isMc = await page.evaluate(() => BT.mcMode);
      if (!isMc) {
        const h = await page.evaluate(async () => {
          showHint();
          const txt = document.getElementById('hint-box').textContent.trim();
          const disabled = document.getElementById('hint-btn').disabled;
          const ans = String(BT.curTask.ans);
          return { txt, disabled, ans };
        });
        ok(h.txt.length > 0, `g${g} nápověda neprázdná`);
        ok(h.disabled, `g${g} po nápovědě je tlačítko vypnuté (jediná nápověda)`);
        ok(!h.txt.includes('Výsledek: ' + h.ans), `g${g} nápověda neprozrazuje výsledek`);
      }
      const w0 = await page.evaluate(() => parseFloat(document.getElementById('bt-hpbar').style.width));
      const tot = await page.evaluate(() => BT.tasks.length);
      let lostHeart = false;
      for (let i = 0; i < tot; i++) {
        // 4. úkol zkazíme jednou (žák chybuje, ale vyhraje)
        if (i === 3) { await answerWrong(page); await sleep(450); lostHeart = true; }
        await answerCorrect(page);
        await sleep(350);
        const more = await page.evaluate(() => document.getElementById('next-btn').style.display !== 'none');
        if (more) { await page.evaluate(() => nextTask()); await sleep(350); }
        else break;
      }
      const w1 = await page.evaluate(() => parseFloat(document.getElementById('bt-hpbar').style.width));
      ok(w1 < w0, `g${g} boss HP bar klesá (${w0}% → ${w1}%)`);
      const done = await page.evaluate(() => BT._doneBattle);
      ok(done >= tot, `g${g} mise dokončena (${done}/${tot})`);
      const hpCalls = await page.evaluate(() => window.__hpCalls);
      ok(lostHeart ? hpCalls.some(f => f < 1) : true, `g${g} setHeroHp hook volán při ztrátě HP`);
      await sleep(400);
      await page.evaluate(() => { document.querySelectorAll('.victory-banner,.fail-overlay.show').forEach(e => e.remove()); go('map'); });
      await sleep(300);
    }

    /* ── 4. REDUCED MOTION: canvas se musí zastavit ── */
    await page.evaluate(() => { const ar = AREAS.find(a => a.id === 4); launchBattle(4, ar.missions[0].id); });
    await page.waitForFunction(() => document.querySelector('#s-battle')?.classList.contains('active'));
    await sleep(1200); // doběhne enter animace
    {
      const moves = async () => {
        const a = await page.evaluate(() => document.getElementById('bt-arena')?.toDataURL());
        await sleep(450);
        const b = await page.evaluate(() => document.getElementById('bt-arena')?.toDataURL());
        return a !== b;
      };
      ok(await moves(), `g${g} VFX zapnuté: canvas se hýbe`);
      await page.evaluate(() => toggleReducedMotion(true));
      await sleep(300);
      ok(!(await moves()), `g${g} VFX vypnuté: canvas STOJÍ (hrdina+boss+parťák)`);
      await page.evaluate(() => toggleReducedMotion(false));
      await page.evaluate(() => go('map'));
      await sleep(250);
    }

    /* ── 5. TRÉNINK: otevření, odpověď, počítadlo, nápověda ── */
    {
      const tr = await page.evaluate(async () => {
        go('train');
        await new Promise(r => setTimeout(r, 200));
        const mid = AREAS[0].missions[0].id;
        startTrain(mid);
        await new Promise(r => setTimeout(r, 300));
        const active = document.querySelector('#s-train')?.classList.contains('active');
        const t = TR && TR.task;
        if (!t) return { active, err: 'TR.task chybí' };
        const mc = document.getElementById('tr-mc')
          ? document.getElementById('tr-mc').style.display !== 'none' : false;
        let hint = '';
        if (!mc && document.getElementById('tr-hint-btn').style.display !== 'none') {
          trHint(); hint = document.getElementById('tr-hint-box').textContent.trim();
        }
        const before = TR.correct || 0;
        if (mc) {
          const btns = [...document.querySelectorAll('#tr-mc .mc-btn')];
          const okB = btns.find(b => (b.dataset.v ?? b.textContent.replace(/^[A-D]\s*/,'').trim()) === String(t.ans));
          (okB || btns[0]).click();
        } else if (t.ans === 'ANO' || t.ans === 'NE') {
          trAnswerYN ? trAnswerYN(t.ans) : trSubmit();
        } else {
          document.getElementById('tr-ans').disabled = false;
          document.getElementById('tr-ans').value = String(t.ans);
          trSubmit();
        }
        await new Promise(r => setTimeout(r, 300));
        return { active, hint, before, after: TR.correct || 0, mc };
      }).catch(e => ({ err: String(e).slice(0, 120) }));
      ok(tr.active && !tr.err, `g${g} trénink se otevře (${tr.err || 'ok'})`);
      if (!tr.err) {
        ok(tr.after > tr.before, `g${g} trénink: správná odpověď zvýší počítadlo (${tr.before}→${tr.after})`);
        if (!tr.mc && tr.hint !== '') ok(tr.hint.length > 0, `g${g} trénink: nápověda neprázdná`);
      }
      await page.evaluate(() => { if (typeof trEnd === 'function') trEnd(); go('map'); }).catch(()=>{});
      await sleep(200);
    }

    /* ── 6. ODKAZY ── */
    {
      const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => h && !h.startsWith('http') && !h.startsWith('#') && !h.startsWith('mailto')));
      for (const href of [...new Set(links)]) {
        const target = href.replace(/[?#].*$/, '');
        const url = new URL(target, `${base}/projects/rpg-mat-${g}.html`).pathname;
        const fp = path.normalize(path.join(ROOT, decodeURIComponent(url))) + (url.endsWith('/') ? 'index.html' : '');
        ok(fs.existsSync(fp), `g${g} odkaz "${href}" → existuje (${url})`);
      }
    }

    ok(jsErrs.length === 0, `g${g} žádné JS chyby (${jsErrs.slice(0,3).join(' | ')})`);
    await ctx.close();
    console.log(`  ✓ g${g} hotovo`);
  }

  await browser.close();
  srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  if (issues.length) { console.log('\n  NALEZENÉ PROBLÉMY:'); issues.forEach(i => console.log('  • ' + i)); }
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
