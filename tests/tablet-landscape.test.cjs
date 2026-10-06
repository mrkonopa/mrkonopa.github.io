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
    const spatne = [], prekryvy = [];
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
        /* Na každé obrazovce smí být vidět PRÁVĚ JEDNA .screen. Pravidlo boje na šířku
           (#s-battle.screen, id přebije .screen{display:none}) platilo i pro NEAKTIVNÍ
           boj, takže na tabletu na šířku ležel boj přes úvod, mapu i trénink a zakryl
           tlačítko startu — hra nešla spustit (Vojtův snímek z iPadu, 6. 10. 2026).
           Měřilo se jen uvnitř boje, proto to měsíc nikdo neviděl. */
        const viditelne = () => [...document.querySelectorAll('.screen')]
          .filter(s => getComputedStyle(s).display !== 'none').map(s => s.id);
        const zakryva = el => { const b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
          const hit = document.elementFromPoint(x, y);
          return hit && hit !== el && !el.contains(hit) ? (hit.id || String(hit.className) || hit.tagName) : null; };
        const obrazovky = [];
        let vid = viditelne();
        if (vid.join() !== 's-intro') obrazovky.push('úvod: vidět ' + vid.join(' + '));
        const start = document.querySelector('#s-intro button[onclick*="startGame"]');
        if (!start) obrazovky.push('úvod: chybí tlačítko startu');
        else { start.scrollIntoView({ block: 'center' }); const k = zakryva(start); if (k) obrazovky.push('úvod: tlačítko startu zakrývá ' + k); }
        document.getElementById('ni').value = 'Test';
        startGame(); S.tutorialDone = true;
        for (const s of document.querySelectorAll('.screen')) {
          const jm = s.id.slice(2); if (jm === 'intro' || jm === 'battle') continue;
          go(jm); vid = viditelne();
          if (vid.join() !== s.id) obrazovky.push(jm + ': vidět ' + vid.join(' + '));
        }
        go('map');
        const a = AREAS[0], m = a.missions[1] || a.missions[0];   // X-1 jsou MC
        launchBattle(a.id, m.id);
        vid = viditelne(); if (vid.join() !== 's-battle') obrazovky.push('boj: vidět ' + vid.join(' + '));
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
                 nedosazitelne: (preteka && !lzeRolovat) ? 1 : 0, obrazovky };
      });
      mereni++;
      for (const o of r.obrazovky) prekryvy.push(`${jm}: ${o}`);
      for (const [co, px] of Object.entries(r)) {
        if (co === 'obrazovky' || px <= 0) continue;
        spatne.push(co === 'nedosazitelne'
          ? `${jm}: zadání přetéká a sloupec NEROLUJE — konec je nedosažitelný`
          : `${jm}: ${co} ${px} px pod okrajem`);
      }
      await ctx.close();
    }
    ok(spatne.length===0, `${g}. ročník: začátek zadání, vstup i DÁLE jsou dosažitelné na všech ${ZARIZENI.length} rozměrech`
      + (spatne.length ? ' — ' + spatne.slice(0,3).join(' · ') : ''));
    ok(prekryvy.length===0, `${g}. ročník: na každé obrazovce je vidět jen ona a tlačítko startu jde stisknout (${ZARIZENI.length} rozměrů)`
      + (prekryvy.length ? ' — ' + prekryvy.slice(0,3).join(' · ') : ''));
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
  let obrMer = 0, trMer = 0, twMer = 0, trDale = 0, btDale = 0, twDale = 0, btPrvni = 0;
  const mise = {};
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
        /* Řazení podle délky ŠABLONY (číslice → #), ne konkrétního zadání: délka zadání
           kolísá s počtem číslic a nejhorší šablona (7. roč., 6-3) se pak do šestice
           dostala jen někdy — test na CI padal podle losu (6. 10. 2026). */
        const nejhorsi = [...vyber.entries()]
          .sort((a, b) => b[0].length - a[0].length || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
          .slice(0, 6).map(e => e[1]);
        const vady = [];
        /* Trénink a věž nemají přišpendlenou lištu: roluje celá stránka a fokus
           do vstupu ji posune. Chrome ale vstup pod okrajem VYCENTRUJE, takže na
           iPadu s klávesnicí odjel začátek obrázku o 4–13 px — trénink proto
           posouvá sám (`ukazUlohu`). Fokus se před vykreslením sundá, jako když ho ve
           skutečném průchodu drží tlačítko DÁLE; jinak druhé focus() nic
           neposune a měří se nesmysl (vstup „119 px pod okrajem“). */
        const vh0 = innerHeight; let tr = 0, tw = 0, trD = 0;
        const raf = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
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
        /* Realisticky: žák odpoví, sjede k „DALŠÍ ÚKOL“ a klikne tam, kde právě je.
           Měření od horního okraje (výš) tohle nevidí — po kliknutí zůstala stránka
           sjetá a začátek nové úlohy byl nad okrajem (iPad s klávesnicí 5–15 px ve
           3., 6. a 8. roč., 5. 10. 2026; boj a věž v pořádku). */
        { go('train'); startTrain(nejhorsi[0].mi);
          const puvodni = window.trDraw; let k = 0;
          window.trDraw = function () { TR.task = nejhorsi[k % nejhorsi.length].t; TR.hl = 0; trRender(); };
          trDraw();
          for (k = 1; k <= nejhorsi.length; k++) {
            await raf();
            document.getElementById('tr-ans').value = '987654'; trSubmit(); await raf();
            const nb = document.getElementById('tr-next-btn'); nb.scrollIntoView({ block: 'nearest' }); await raf();
            if (document.activeElement) document.activeElement.blur();
            nb.click(); await raf();
            mer('trénink po DALŠÍ ÚKOL', 'tr-prob', 'tr-input-row', nejhorsi[k % nejhorsi.length].mi); trD++;
          }
          window.trDraw = puvodni; }
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
          /* Vstup má fokus UŽ PŘED vykreslením: focus() na takový prvek nic neposune,
             takže to je ta těžší cesta. Dřív záleželo na losu první úlohy boje
             (s fokusem jen u textové), a proto test padal zhruba 1 běh z 5. */
          document.getElementById('bt-input-row').style.display = 'flex';
          // preventScroll: test nesmí rolovat sám (prohlížeč může rolování po focus() odložit)
          const bi = document.getElementById('bt-ans'); bi.disabled = false; bi.focus({ preventScroll: true });
          const col = document.querySelector('.bt-col-task'); col.scrollTop = 0;
          BT.tasks[BT.idx] = p.t; if (BT.mini) BT.mini[BT.idx] = null;
          renderTask();                                     // dá fokus do vstupu
          const poRender = col.scrollTop;
          document.getElementById('next-btn').style.display = '';
          await new Promise(res => requestAnimationFrame(() => res()));
          const vh = innerHeight, lista = document.querySelector('.bt-akce').getBoundingClientRect();
          const vstup = document.getElementById('bt-input-row').getBoundingClientRect();
          const prob = document.getElementById('bt-prob').getBoundingClientRect(), c = col.getBoundingClientRect();
          const zakryto = Math.round(vstup.bottom - Math.min(vh, lista.top));
          // diagnostika do hlášky: kdyby to padalo jen občas, ať je z logu vidět proč
          if (zakryto > 1) vady.push(`vstup ${zakryto} px pod lištou (${p.mi}; sloupec ${poRender}→${col.scrollTop}/${col.scrollHeight - col.clientHeight}, zadání ${Math.round(prob.top)}–${Math.round(prob.bottom)}, vstup ${Math.round(vstup.top)}–${Math.round(vstup.bottom)}, lišta ${Math.round(lista.top)}, fokus ${document.activeElement && document.activeElement.id}, úloha ${BT.curTask === p.t ? 'zadaná' : 'VYMĚNĚNÁ: ' + String(BT.curTask && BT.curTask.text).slice(0, 30)})`);
          if (tablet && c.top - prob.top > 1) vady.push(`začátek zadání odjel o ${Math.round(c.top - prob.top)} px (${p.mi})`);
        }
        /* Boj a věž realisticky (průchod 5. 10. 2026): žák odpoví, sjede k DÁLE (boj),
           klikne tam, kde je; ve věži se další patro vykreslí samo. Naměřeno 0 nálezů
           na tabletech (boj 0 z 252, věž 0 z 96) — hlídá se, aby to tak zůstalo.
           Telefon na šířku se nevejde nikdy: tam se hlídá jen vstup (nad lištou). */
        const cekej = ms => new Promise(res => setTimeout(res, ms));
        let btD = 0, twD = 0;
        { launchBattle(nejhorsi[0].ar, nejhorsi[0].mi); await raf();
          BT.tasks = nejhorsi.map(o => o.t).concat(nejhorsi.map(o => o.t)); BT.mini = BT.tasks.map(() => null); BT.idx = 0; renderTask(); await raf();
          for (let i = 0; i < nejhorsi.length - 1; i++) {
            const inp = document.getElementById('bt-ans'); if (!inp) { vady.push('boj po DÁLE: chybí vstup'); break; }
            inp.value = String(BT.tasks[BT.idx].ans); submitAnswer(); await raf(); await cekej(80);
            const col = document.querySelector('.bt-col-task'); col.scrollTop = col.scrollHeight; window.scrollTo(0, document.body.scrollHeight);
            const nb = document.getElementById('next-btn'); if (!nb || nb.style.display === 'none') { vady.push('boj: DÁLE se neukázalo'); break; }
            if (document.activeElement) document.activeElement.blur();
            nb.click(); await raf(); await cekej(80);
            const p = document.getElementById('bt-prob').getBoundingClientRect(), v = document.getElementById('bt-input-row').getBoundingClientRect();
            const c = col.getBoundingClientRect(), horni = Math.max(0, c.top), dolni = Math.min(innerHeight, document.querySelector('.bt-akce').getBoundingClientRect().top);
            if (tablet && p.top < horni - 1) vady.push(`boj po DÁLE: začátek zadání ${Math.round(horni - p.top)} px nad okrajem`);
            if (v.bottom > dolni + 1) vady.push(`boj po DÁLE: vstup ${Math.round(v.bottom - dolni)} px pod lištou`);
            btD++;
          } }
        if (typeof twStart === 'function') {
          S.settings = S.settings || {}; S.settings.reducedMotion = true;   // věž pak přejde na další patro za 250 ms, ne 900
          go('tower'); twStart(); await raf();
          const puvodni = window.twDrawTask; let q = 0;
          window.twDrawTask = function () { TW.task = nejhorsi[q++ % nejhorsi.length].t; twRenderTask(); };
          twDrawTask(); await raf();
          for (let i = 0; i < 4; i++) {
            const inp = document.getElementById('tw-ans'); if (!inp) break;
            inp.scrollIntoView({ block: 'nearest' }); inp.value = String(TW.task.ans); twSubmit();
            await cekej(400); await raf();
            mer('věž po správné odpovědi', 'tw-prob', 'tw-input-row', 'patro ' + (i + 2)); twD++;
          }
          TW.on = false; if (typeof twStopTimer === 'function') twStopTimer(); window.twDrawTask = puvodni;
        }
        /* PRVNÍ úloha boje jako ve hře: z mapy se renderTask pustí ještě na SKRYTÉM boji
           (go('battle') je až za ním), takže vstup zaostří a posune až konec vstupní
           animace (700 ms). Smyčka výš tuhle cestu obchází — volá renderTask znovu. */
        let btPrvni = 0;
        if (innerHeight <= 500) {
          const p = nejhorsi[0], m = AREAS.find(a => a.id === p.ar).missions.find(x => x.id === p.mi);
          const banky = Object.keys(window).filter(k => /^RPG_TASK_EXTRA_\d$/.test(k) && window[k][p.mi]);
          const puvB = banky.map(k => window[k][p.mi]), puvT = m.tasks, puvM = window.miniForIdx;
          m.tasks = () => Array(12).fill(p.t); banky.forEach(k => { window[k][p.mi] = () => []; });
          window.miniForIdx = () => null;                   // 1. kolo bez minihry
          try { go('map'); launchBattle(p.ar, p.mi); }
          finally { m.tasks = puvT; banky.forEach((k, i) => { window[k][p.mi] = puvB[i]; }); window.miniForIdx = puvM; }
          await cekej(800); await raf();
          const col = document.querySelector('.bt-col-task'), lista = document.querySelector('.bt-akce').getBoundingClientRect();
          const v = document.getElementById('bt-input-row').getBoundingClientRect(), pr = document.getElementById('bt-prob').getBoundingClientRect(), c = col.getBoundingClientRect();
          const zakryto = Math.round(v.bottom - Math.min(innerHeight, lista.top));
          if (BT.curTask !== p.t) vady.push(`první úloha boje: zadaná je jiná úloha (${p.mi})`);
          else if (document.activeElement !== document.getElementById('bt-ans')) vady.push(`první úloha boje: vstup nemá fokus (${p.mi})`);
          else if (zakryto > 1) vady.push(`první úloha boje: vstup ${zakryto} px pod lištou (${p.mi}; sloupec ${col.scrollTop}/${col.scrollHeight - col.clientHeight})`);
          if (tablet && c.top - pr.top > 1) vady.push(`první úloha boje: začátek zadání odjel o ${Math.round(c.top - pr.top)} px (${p.mi})`);
          btPrvni++;
        }
        return { n: nejhorsi.length, vady, tr, tw, trD, btD, twD, btPrvni, mise: nejhorsi.map(p => p.mi).join(' ') };
      }, h >= 420);
      obrMer += r.n; trMer += r.tr; twMer += r.tw; trDale += r.trD; btDale += r.btD; twDale += r.twD; btPrvni += r.btPrvni; mise[g] = r.mise;
      for (const v of r.vady) spatne.push(`${jm}: ${v}`);
      await ctx.close();
    }
    ok(spatne.length===0, `${g}. ročník: u 6 úloh s obrázkem a nejdelším zadáním (${mise[g]}) je vstup vidět v boji, tréninku${g>=6?' i věži':''} na všech ${ZARIZENI.length} rozměrech`
      + (spatne.length ? ' — ' + spatne.slice(0,3).join(' · ') : ''));
  }
  // Pod šest úloh s obrázkem by ročník klesl jen tehdy, kdyby se obrázky ztratily.
  const nizke = ZARIZENI.filter(z => z[2] <= 500).length;
  ok(obrMer === 7*ZARIZENI.length*6 && trMer === obrMer && trDale === obrMer && twMer === 4*ZARIZENI.length*6 && btDale === 7*ZARIZENI.length*5 && twDale === 4*ZARIZENI.length*4 && btPrvni === 7*nizke,
    `proměřeno ${obrMer} úloh s obrázkem v boji (+ ${btDale} po DÁLE, + ${btPrvni} prvních po vstupní animaci), ${trMer} v tréninku (+ ${trDale} po „DALŠÍ ÚKOL“) a ${twMer} ve věži (+ ${twDale} po správné odpovědi)`);

  await br.close(); srv.close();
  console.log(`\n══════════════════════════════════════════\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n══════════════════════════════════════════`);
  process.exit(fail ? 1 : 0);
})();
