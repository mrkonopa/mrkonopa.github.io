/* tablet-landscape.test.cjs — na tabletu NA ŠÍŘKU musí být zadání, vstup
   i tlačítko DÁLE vidět BEZ SCROLLOVÁNÍ, i když je zapnutá klávesnice.

   Proč to vzniklo: Vojta rozjel hru na tabletu a musel scrollovat pro DÁLE.
   Naměřeno před opravou (iPad 10,2" na šířku, 1024×768): aréna 286 px,
   zadání začíná na 553 px, DÁLE 90 px pod okrajem. Se zapnutou klávesnicí
   (viditelných ~420 px) bylo pod okrajem i ZADÁNÍ o 132 px a DÁLE o 315 px —
   dítě odpovědělo a pak muselo scrollovat.

   Opraveno dvousloupcovým rozvržením (aréna vlevo, úloha vpravo), takže se
   výška počítá jako maximum, ne součet. Sabotáž: zvýšit max-height práh
   v media query pod 768 — případ „na šířku bez klávesnice" spadne. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };

// Reálné rozměry v CSS px. Klávesnice ubere zhruba 45 % výšky.
const ZARIZENI = [
  ['iPad 10,2" na šířku',      1024, 768],
  ['iPad 10,2" + klávesnice',  1024, 420],
  ['iPad 10,9" na šířku',      1180, 820],
  ['iPad 10,9" + klávesnice',  1180, 450],
  ['Android 10" + klávesnice', 1280, 440],
  ['telefon na šířku',          740, 360],
];

let pass=0, fail=0;
const ok=(c,m)=>{ if(c){pass++;console.log('  ✅ '+m);} else {fail++;console.log('  ❌ '+m);} };

(async () => {
  const srv = http.createServer((q,p)=>{ const u=decodeURIComponent(q.url.split('?')[0]);
    const fp=path.normalize(path.join(ROOT,u));
    if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){p.writeHead(404);return p.end();}
    p.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});
    fs.createReadStream(fp).pipe(p);});
  await new Promise(r=>srv.listen(0,r));
  const base = 'http://127.0.0.1:'+srv.address().port;
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  console.log('── Tablet na šířku: dosažitelnost ovládání ──');

  let mereni = 0;
  for (const g of [3,4,5,6,7,8,9]) {
    const spatne = [];
    for (const [jm, w, h] of ZARIZENI) {
      const ctx = await br.newContext({ viewport:{width:w,height:h}, hasTouch:true });
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      await page.goto(`${base}/projects/rpg-mat-${g}.html`, {waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>typeof window.startGame==='function', null, {timeout:10000});
      const r = await page.evaluate(() => {
        // Minihry se LOSUJÍ, takže by test bez zafixování kolísal mezi běhy
        // a v CI flakoval. Pevné semínko dá pokaždé tutéž sadu úloh.
        let sem = 42;
        Math.random = () => { sem = (sem * 1103515245 + 12345) % 2147483648; return sem / 2147483648; };
        document.getElementById('ni').value = 'Test';
        startGame(); S.tutorialDone = true;
        const a = AREAS[0], m = a.missions[1] || a.missions[0];   // X-1 jsou MC
        launchBattle(a.id, m.id);
        document.getElementById('next-btn').style.display = '';
        const vh = window.innerHeight;
        // OVLÁDÁNÍ (vstup, DÁLE) musí být celé vidět — na to se kliká.
        const podOkrajem = id => { const e = document.getElementById(id);
          if (!e) return 0;
          const b = e.getBoundingClientRect();
          if (b.height === 0) return 0;                  // skrytý prvek se neposuzuje
          return Math.max(0, Math.round(b.bottom - vh)); };
        // ZADÁNÍ stačí, když je vidět jeho ZAČÁTEK: minihry (ŘAZENÍ, SPOJOVAČKA)
        // mají 316 až 383 px vysoký seznam, který se do 360px okna nevejde nikdy.
        // Rolovat SE V NĚM je záměr — proto se navíc ověřuje, že sloupec úlohy
        // rolovat opravdu jde, jinak by byl konec zadání nedosažitelný.
        const prob = document.getElementById('bt-prob').getBoundingClientRect();
        const col = document.querySelector('.bt-col-task');
        const preteka = col.scrollHeight > col.clientHeight + 1;
        const lzeRolovat = getComputedStyle(col).overflowY === 'auto' || getComputedStyle(col).overflowY === 'scroll';
        return { zacatekZadani: Math.max(0, Math.round(prob.top - vh)),
                 vstup: podOkrajem('bt-ans'), dale: podOkrajem('next-btn'),
                 nedosazitelne: (preteka && !lzeRolovat) ? 1 : 0 };
      });
      mereni++;
      for (const [co, px] of Object.entries(r)) {
        if (px <= 0) continue;
        spatne.push(co === 'nedosazitelne'
          ? `${jm}: zadání přetéká a sloupec NEROLUJE — konec je nedosažitelný`
          : `${jm}: ${co} ${px} px pod okrajem`);
      }
      await ctx.close();
    }
    ok(spatne.length===0, `${g}. ročník: začátek zadání, vstup i DÁLE jsou dosažitelné na všech ${ZARIZENI.length} rozměrech`
      + (spatne.length ? ' — ' + spatne.slice(0,3).join(' · ') : ''));
  }
  // Pojistka proti běhu naprázdno: bez skutečných měření by kontrola prošla i tak.
  ok(mereni === 7*ZARIZENI.length, `proměřeno ${mereni} kombinací ročník × rozměr (čekáno ${7*ZARIZENI.length})`);

  /* ── Úlohy S OBRÁZKEM: šest nejhorších v každém ročníku ──
     Úlohu výš vybírá semínko, takže o obrázku rozhoduje los — a když obrázky
     přibyly do mise 1-2 v 6. ročníku, vstup na telefonu zajel pod okraj. Ve
     skutečnosti byl i ZA přišpendlenou lištou s DÁLE: fokus posune sloupec jen
     „do okna" a o liště nic neví. Naměřeno na 306 úlohách s obrázkem: na telefonu
     136 zakrytých vstupů, na iPadu s klávesnicí 3. Proto se tu berou úlohy s
     obrázkem a NEJDELŠÍM zadáním a vstup musí být nad lištou, ne jen v okně.
     Na tabletech (výška ≥ 420) musí zůstat vidět i začátek zadání; telefon na
     šířku se nevejde nikdy, tam se smí posunout zadání, ovládání ne.
     Sabotáž: bez `scroll-padding-bottom` spadne telefon, bez obrázku vedle
     zadání (:has) spadnou tablety s klávesnicí. */
  let obrMer = 0, trMer = 0, twMer = 0;
  for (const g of [3,4,5,6,7,8,9]) {
    const spatne = [];
    for (const [jm, w, h] of ZARIZENI) {
      const ctx = await br.newContext({ viewport:{width:w,height:h}, hasTouch:true });
      await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      // Věž je o prázdninách zavřená; pevné datum, ať test platí po celý rok.
      await page.addInitScript(() => { window.__TW_TESTNOW = '2026-05-15T10:00:00'; });
      await page.goto(`${base}/projects/rpg-mat-${g}.html`, {waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>typeof window.startGame==='function', null, {timeout:10000});
      const r = await page.evaluate(async (tablet) => {
        document.getElementById('ni').value = 'Test';
        startGame(); S.tutorialDone = true;
        const vyber = new Map();
        for (const ar of AREAS) for (const mi of ar.missions) {
          if (mi.mc) continue;                              // výběr ze 4 nemá vstup
          for (let i = 0; i < 4; i++) {
            let ts = []; try { ts = mi.tasks() || []; } catch (e) {}
            for (const k of Object.keys(window)) if (/^RPG_TASK_EXTRA_\d$/.test(k) && window[k][mi.id]) {
              try { ts = ts.concat(window[k][mi.id]() || []); } catch (e) {} }
            for (const t of ts) if (t && t.svg && !isYN(t)) {
              const klic = String(t.text).replace(/\d+/g, '#');
              if (!vyber.has(klic) || vyber.get(klic).t.text.length < t.text.length) vyber.set(klic, { t, ar: ar.id, mi: mi.id });
            }
          }
        }
        const nejhorsi = [...vyber.values()].sort((a, b) => b.t.text.length - a.t.text.length).slice(0, 6);
        const vady = [];
        /* Trénink a věž nemají přišpendlenou lištu: roluje celá stránka a fokus
           do vstupu ji posune. Chrome ale vstup pod okrajem VYCENTRUJE, takže na
           iPadu s klávesnicí odjel začátek obrázku o 4–13 px — trénink proto
           posouvá jen „nearest“. Fokus se před vykreslením sundá, jako když ho ve
           skutečném průchodu drží tlačítko DÁLE; jinak druhé focus() nic
           neposune a měří se nesmysl (vstup „119 px pod okrajem“). */
        const vh0 = innerHeight; let tr = 0, tw = 0;
        const mer = (co, probId, rowId, mi) => {
          const pr = document.getElementById(probId).getBoundingClientRect();
          const row = document.getElementById(rowId).getBoundingClientRect();
          if (row.bottom - vh0 > 1) vady.push(`${co}: vstup ${Math.round(row.bottom - vh0)} px pod okrajem (${mi})`);
          if (tablet && pr.top < -1) vady.push(`${co}: začátek zadání odjel o ${Math.round(-pr.top)} px (${mi})`);
        };
        for (const p of nejhorsi) {
          go('train'); startTrain(p.mi); if (document.activeElement) document.activeElement.blur(); scrollTo(0, 0);
          TR.task = p.t; trRender(); await new Promise(res => requestAnimationFrame(() => res()));
          mer('trénink', 'tr-prob', 'tr-input-row', p.mi); tr++;
        }
        if (typeof twStart === 'function') {
          for (const p of nejhorsi) {
            go('tower'); twStart(); if (document.activeElement) document.activeElement.blur(); scrollTo(0, 0);
            TW.task = p.t; twRenderTask(); await new Promise(res => requestAnimationFrame(() => res()));
            mer('věž', 'tw-prob', 'tw-input-row', p.mi); tw++;
          }
          TW.on = false; if (typeof twStopTimer === 'function') twStopTimer();
        }
        for (const p of nejhorsi) {
          launchBattle(p.ar, p.mi);
          const col = document.querySelector('.bt-col-task'); col.scrollTop = 0;
          BT.tasks[BT.idx] = p.t; if (BT.mini) BT.mini[BT.idx] = null;
          renderTask();                                     // dá fokus do vstupu
          document.getElementById('next-btn').style.display = '';
          await new Promise(res => requestAnimationFrame(() => res()));
          const vh = innerHeight, lista = document.querySelector('.bt-akce').getBoundingClientRect();
          const vstup = document.getElementById('bt-input-row').getBoundingClientRect();
          const prob = document.getElementById('bt-prob').getBoundingClientRect(), c = col.getBoundingClientRect();
          const zakryto = Math.round(vstup.bottom - Math.min(vh, lista.top));
          if (zakryto > 1) vady.push(`vstup ${zakryto} px pod lištou (${p.mi})`);
          if (tablet && c.top - prob.top > 1) vady.push(`začátek zadání odjel o ${Math.round(c.top - prob.top)} px (${p.mi})`);
        }
        return { n: nejhorsi.length, vady, tr, tw };
      }, h >= 420);
      obrMer += r.n; trMer += r.tr; twMer += r.tw;
      for (const v of r.vady) spatne.push(`${jm}: ${v}`);
      await ctx.close();
    }
    ok(spatne.length===0, `${g}. ročník: u 6 úloh s obrázkem a nejdelším zadáním je vstup vidět v boji, tréninku${g>=6?' i věži':''} na všech ${ZARIZENI.length} rozměrech`
      + (spatne.length ? ' — ' + spatne.slice(0,3).join(' · ') : ''));
  }
  // Pod šest úloh s obrázkem by ročník klesl jen tehdy, kdyby se obrázky ztratily.
  ok(obrMer === 7*ZARIZENI.length*6 && trMer === obrMer && twMer === 4*ZARIZENI.length*6,
    `proměřeno ${obrMer} úloh s obrázkem v boji, ${trMer} v tréninku a ${twMer} ve věži (čekáno ${7*ZARIZENI.length*6} / ${7*ZARIZENI.length*6} / ${4*ZARIZENI.length*6})`);

  await br.close(); srv.close();
  console.log(`\n══════════════════════════════════════════\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n══════════════════════════════════════════`);
  process.exit(fail ? 1 : 0);
})();
