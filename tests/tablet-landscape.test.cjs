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

  await br.close(); srv.close();
  console.log(`\n══════════════════════════════════════════\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n══════════════════════════════════════════`);
  process.exit(fail ? 1 : 0);
})();
