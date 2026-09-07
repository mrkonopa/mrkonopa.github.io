/* rpg-learn-diagramy.test.cjs — diagramy ve výkladu 1. stupně (3.–5. ročník).
   Playwright, auto-discovery v tests/run-ci.cjs.

   PROČ RUNTIME A NE ZDROJ. Renderer 1. stupně proháněl odstavce výkladu přes
   esc2(), takže by se <svg> dítěti VYPSALO JAKO TEXT. Zdrojová kontrola („modul
   obsahuje <svg") by takový stav klidně pustila — proto se tady otevírá skutečná
   obrazovka a hledá se textový uzel obsahující „<svg". To je celý smysl testu.

   Barvy diagramů jsou CSS proměnné (var(--blue)…), aby si každý ročník obarvil
   obrázek vlastní paletou; test proto ověřuje i to, že se proměnná rozvinula. */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');          // NIKDY natvrdo /home/user — CI má jinou cestu
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml' };

// Naměřeno: 3. ročník má 10 misí s diagramem. 4. a 5. zatím 0 — až se doplní,
// zvedne se jejich podlaha. Podlaha 8 nechává rezervu 2 mise.
const PODLAHA = { 3: 8, 4: 0, 5: 0 };

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
  const browser=await chromium.launch({executablePath:EXEC});
  console.log('── Výklad 1. stupně: diagramy ──');

  // ── 1) renderer 1. a 2. stupně se nesmí rozejít ──
  // Odstavce výkladu musí jít do HTML surově v OBOU stupních. Kdyby se 1. stupeň
  // vrátil k esc2(), diagramy by se tiše změnily v text — a nikde by to nespadlo.
  const rozesle=[];
  for (const g of [3,4,5,6,7,8,9]) {
    const h = fs.readFileSync(path.join(ROOT, 'projects/rpg-mat-'+g+'.html'), 'utf8');
    const m = h.match(/\(Array\.isArray\(s\.p\)[^\n]{0,200}?forEach\(p=>\{html\+=`<p>\$\{([^}]*)\}/);
    if (!m || /esc2\s*\(/.test(m[1])) rozesle.push('g'+g);
  }
  ok(rozesle.length===0, 'odstavce výkladu jdou surově ve všech 7 ročnících'
    + (rozesle.length ? ' — rozešly se: '+rozesle.join(', ') : ''));
  const escP=[3,4,5].filter(g => /esc2\(p\)/.test(fs.readFileSync(path.join(ROOT,'projects/rpg-mat-'+g+'.html'),'utf8')));
  ok(escP.length===0, 'v 1. stupni nezbylo esc2(p) u odstavců výkladu'+(escP.length?' — '+escP.join(', '):''));

  // ── 1b) pole sekcí nesmí mít DÍRY ──
  // Každá mise 3.–5. ročníku měla v sections jeden prázdný slot (osamocená čárka
  // ve zdroji, 63 dohromady; 6.–9. ani jeden). forEach díry přeskočí, takže to nebylo
  // vidět — ale map/for na nich spadne, což se stalo při stavbě náhledu diagramů.
  {
    global.window = {};
    for (const g of [3,4,5,6,7,8,9]) require(path.join(ROOT, 'projects/rpg-learn-'+g+'.js'));
    const dir=[]; let misi=0;
    for (const g of [3,4,5,6,7,8,9]) {
      const L = global.window['RPG_LEARN_'+g];
      for (const [mid, m] of Object.entries(L)) {
        misi++;
        const sec = m.sections || [];
        for (let i=0;i<sec.length;i++) if (sec[i] === undefined) dir.push('g'+g+'/'+mid+'['+i+']');
      }
    }
    ok(misi === 147, 'prošlo se všech 147 misí výkladu (7 ročníků × 21) — bez toho by kontrola běžela naprázdno');
    ok(dir.length === 0, 'pole sekcí nemá díry' + (dir.length ? ' — '+dir.length+'×, např. '+dir.slice(0,4).join(', ') : ''));
  }

  // ── 2) runtime: každý diagram se VYKRESLÍ ──
  let celkem=0;
  for (const g of [3,4,5]) {
    const ctx=await browser.newContext({viewport:{width:380,height:900},isMobile:true,hasTouch:true});
    await ctx.route('**/*', r=> r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
    const page=await ctx.newPage(); const errs=[];
    page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/projects/rpg-mat-'+g+'.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(gg=>typeof window.startGame==='function'&&window['RPG_LEARN_'+gg], g, {timeout:10000});

    const r = await page.evaluate(gg=>{
      const L=window['RPG_LEARN_'+gg];
      document.getElementById('ni').value='TEST'; window.startGame();
      try { S.tutorialDone = true; } catch (e) {}
      const out=[];
      for(const mid of Object.keys(L)){
        if(!/<svg/.test(JSON.stringify(L[mid]))) continue;
        window.startLearn(mid);
        const sc=document.getElementById('s-learn');
        const svgs=[...sc.querySelectorAll('.learn-section svg')];
        const w=document.createTreeWalker(sc,NodeFilter.SHOW_TEXT); let text=false,nd;
        while((nd=w.nextNode())) if(nd.nodeValue.includes('<svg')){text=true;break;}
        const doc=document.documentElement;
        const b0=svgs[0]?svgs[0].getBoundingClientRect():null;
        const prvni=svgs[0];
        out.push({ mid, pocet:svgs.length, text,
          w:b0?Math.round(b0.width):0, h:b0?Math.round(b0.height):0,
          prazdny: svgs.some(s=>s.querySelectorAll('*').length===0),
          maViewBox: svgs.every(s=>s.hasAttribute('viewBox')),
          maPopis: svgs.every(s=>!!s.getAttribute('aria-label')),
          skript: svgs.some(s=>s.querySelector('script')),
          barva: (()=>{ if(!prvni) return '';
            for (const el of prvni.querySelectorAll('[stroke],[fill]')) {
              const c=getComputedStyle(el);
              if (/^rgb/.test(c.stroke)) return c.stroke;
              if (/^rgb/.test(c.fill)) return c.fill;
            } return 'nerozvinulo se'; })(),
          preteka: doc.scrollWidth>doc.clientWidth+1 });
      }
      return out;
    }, g);

    celkem += r.length;
    ok(r.length>=PODLAHA[g], g+'. ročník má '+r.length+' misí s diagramem (podlaha '+PODLAHA[g]+')');

    if (r.length) {
      const jakoText=r.filter(x=>x.text);
      ok(jakoText.length===0, g+'. ročník: diagram se vykreslí, nevypíše jako text'
        + (jakoText.length?' — '+jakoText.map(x=>x.mid).join(', '):''));
      const spatne=r.filter(x=>x.prazdny||x.pocet===0||x.w<80||x.h<40);
      ok(spatne.length===0, g+'. ročník: každý diagram má obsah a rozumný rozměr'
        + (spatne.length?' — '+spatne.map(x=>x.mid+' '+x.w+'×'+x.h).join(', '):''));
      const bezVB=r.filter(x=>!x.maViewBox);
      ok(bezVB.length===0, g+'. ročník: každý diagram má viewBox (škáluje se)'
        + (bezVB.length?' — '+bezVB.map(x=>x.mid).join(', '):''));
      const bezPopisu=r.filter(x=>!x.maPopis);
      ok(bezPopisu.length===0, g+'. ročník: každý diagram má aria-label (čtečka ho popíše)'
        + (bezPopisu.length?' — '+bezPopisu.map(x=>x.mid).join(', '):''));
      const skript=r.filter(x=>x.skript);
      ok(skript.length===0, g+'. ročník: v diagramech není <script>');
      const pret=r.filter(x=>x.preteka);
      ok(pret.length===0, g+'. ročník: nic nepřetéká na 380 px'
        + (pret.length?' — '+pret.map(x=>x.mid).join(', '):''));
      // CSS proměnná se musí rozvinout na skutečnou barvu; „none"/prázdno = paleta nedojela
      const bezBarvy=r.filter(x=>!/^rgb/.test(x.barva));
      ok(bezBarvy.length===0, g+'. ročník: barvy z palety ročníku se rozvinuly (např. '+(r[0]||{}).barva+')'
        + (bezBarvy.length?' — '+bezBarvy.map(x=>x.mid).join(', '):''));
    }
    ok(errs.length===0, g+'. ročník: žádné JS chyby'+(errs.length?' ['+errs[0]+']':''));
    await ctx.close();
  }

  ok(celkem>0, 'celkem zkontrolováno '+celkem+' misí s diagramem (pojistka proti běhu naprázdno)');

  await browser.close(); srv.close();
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
