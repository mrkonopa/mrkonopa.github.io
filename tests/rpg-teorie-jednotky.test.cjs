/* rpg-teorie-jednotky.test.cjs — pevná mezera mezi číslem a jednotkou v TEORII (3.–9. ročník).
   Playwright, auto-discovery v tests/run-ci.cjs.

   Teorie je HTML psané rukou v rpg-learn-N.js a vykresluje ho renderLearn() do #learn-content, takže
   `zapis()` (zadání úloh) se na ni nedostane. Pevná mezera se proto dělá nad TEXTOVÝMI UZLY po
   vykreslení (`pevneMezeryDom` v rpg-shared.js). Test proto měří, co dítě skutečně dostane na
   obrazovce, ne zdroj: otevře teorii každé mise každého ročníku, projde textové uzly mimo SVG
   a hledá „číslo␣jednotka" s obyčejnou mezerou. Naměřeno 23. 10. 2026 ve zdrojích: 929 míst.

   Hlídá i to, co by pravidlo mohlo rozbít: obsah SVG (popisky, data křivek) se nesmí změnit a text
   bez jednotky zůstat beze změny. */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');          // NIKDY natvrdo /home/user — CI má jinou cestu
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml' };
const GRADES = [3, 4, 5, 6, 7, 8, 9];

function serve(){ return new Promise(res=>{ const s=http.createServer((q,p)=>{
  let u=decodeURIComponent(q.url.split('?')[0]); if(u.endsWith('/'))u+='index.html';
  const fp=path.normalize(path.join(ROOT,u));
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){p.writeHead(404);return p.end('nf');}
  p.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});
  fs.createReadStream(fp).pipe(p);
}); s.listen(0,()=>res(s)); }); }

let pass=0, fail=0;
const ok=(c,m)=>{ if(c){pass++;console.log('  ✅ '+m);} else {fail++;console.log('  ❌ '+m);} };

(async()=>{
  const srv=await serve(); const base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({ headless:true, executablePath:EXEC });
  let celkemPevnych=0;

  for (const g of GRADES) {
    const ctx=await browser.newContext({viewport:{width:380,height:900},isMobile:true,hasTouch:true});
    await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
    const page=await ctx.newPage(); const errs=[];
    page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/projects/rpg-mat-'+g+'.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(gg=>typeof window.startGame==='function'&&window['RPG_LEARN_'+gg], g, {timeout:10000});

    const r = await page.evaluate(async gg=>{
      const L=window['RPG_LEARN_'+gg];
      document.getElementById('ni').value='TEST'; window.startGame();
      try { S.tutorialDone = true; } catch (e) {}
      const RE_OBYC=/(\d) (cm|dm|mm|km|kg|dkg|mg|ml|dl|hl|Kč|min|hod|[mglht]|%)(?![\p{L}\d])/u;
      const RE_PEVNA=/(\d) (cm|dm|mm|km|kg|dkg|mg|ml|dl|hl|Kč|min|hod|[mglht]|%)(?![\p{L}\d])/gu;
      const out={ misi:0, spatne:[], pevnych:0, svgZmena:0, svgUzlu:0 };
      for(const mid of Object.keys(L)){
        window.startLearn(mid);
        await new Promise(r=>setTimeout(r,0));          // pozorovatel běží jako mikroúloha po vykreslení
        const el=document.getElementById('learn-content');
        out.misi++;
        const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT); let n;
        while((n=w.nextNode())){
          const vSvg=!!(n.parentElement&&n.parentElement.closest('svg'));
          if(vSvg){ out.svgUzlu++; if(n.data.includes(' ')) out.svgZmena++; continue; }
          if(RE_OBYC.test(n.data)) out.spatne.push(mid+': '+n.data.slice(Math.max(0,n.data.search(RE_OBYC)-12), n.data.search(RE_OBYC)+14));
          out.pevnych += (n.data.match(RE_PEVNA)||[]).length;
        }
      }
      return out;
    }, g);

    celkemPevnych += r.pevnych;
    ok(r.misi===21, g+'. ročník: otevřeno '+r.misi+' z 21 teorií');
    ok(r.spatne.length===0, g+'. ročník: v žádné teorii nezůstalo „číslo mezera jednotka" s obyčejnou mezerou'
      + (r.spatne.length?' — '+r.spatne.length+'×: '+r.spatne.slice(0,3).join(' · '):''));
    ok(r.pevnych>=50, g+'. ročník: pevná mezera je skutečně v textu ('+r.pevnych+' míst, naměřeno 64–235, podlaha 50)');
    ok(r.svgZmena===0, g+'. ročník: text uvnitř SVG zůstal beze změny ('+r.svgUzlu+' uzlů)');
    ok(errs.length===0, g+'. ročník: žádná chyba stránky'+(errs.length?' — '+errs[0]:''));
    await ctx.close();
  }

  ok(celkemPevnych>=800, 'celkem pevných mezer v teorii: '+celkemPevnych+' (naměřeno 929, podlaha 800; dřív 1209, ale blok „Časté chyby“ se počítal 2–3× u každé teorie 2. stupně)');
  await browser.close(); srv.close();
  console.log(`\n${pass} ✅ / ${fail} ❌`);
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
