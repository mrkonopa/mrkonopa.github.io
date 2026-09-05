/* ══════════════════════════════════════════════════════════════════════
   Repo-wide kontrola rozvržení: nic nesmí vylézt ze svého rámečku.

   Vznikla poté, co Vojta na screenshotu ukázal, že tlačítko VĚŽ LEGEND
   přetéká z řady akcí pod mapou ven. Žádný test to nechytil, protože
   layout se do té doby neměřil vůbec — testy kontrolovaly, že se prvky
   VYKRESLÍ, ne KAM.

   Prochází všechny stránky (7 her × všechny obrazovky, HUB, učitelská
   konzole, celý přijímačkový hub) ve třech šířkách a u každého viditelného
   prvku porovná jeho rámeček s rámečkem rodiče. Hlásí dvě věci:

     • prvek přesahuje rodiče (a rodič si přetečení neřeší scrollem)
     • prvek má ořezaný vlastní obsah (scrollWidth > clientWidth)

   Rodiče s overflow auto/scroll/hidden se přeskakují — tam je přesah
   záměr, ne vada. Stejně tak absolutně/fixně pozicované prvky.

   Ověřeno, že pravidlo skutečně štěká: na verzi před opravou řady akcí
   nález hlásí (přetečení se propíše až na .wrap kolem obsahu mapy) a na
   přetékajícím odpočtu na přijímačkovém hubu ho poprvé našlo samo.

   Pomalé (~3 min). Spusť: node tests/layout-overflow.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
// ROOT se MUSÍ odvodit od umístění testu. Původně tu byla natvrdo cesta
// z vývojového sandboxu (`/home/user/…`) — vzniklo to při povýšení
// ad-hoc auditu na test. Lokálně to fungovalo, na CI je repo jinde
// (`/home/runner/work/…`), takže server nenašel ANI JEDEN soubor,
// všech 42 načtení skončilo na 404 a audit doběhl za 10 vteřin bez
// jediného měření.
const ROOT=path.join(__dirname,'..'),PORT=18999;
// Chyby při čtení se dřív tiše měnily na 404, takže „chybí soubor" a
// „nešel přečíst" vypadaly stejně. Teď se důvod pošle v hlavičce i do
// konzole — ať je příště vidět, co se doopravdy stalo.
let ctyristaCtyri=0;   // ať rozbitý server nezaplaví log tisíci řádky
const srv=http.createServer((q,p)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';
 const fp=path.normalize(path.join(ROOT,u));
 if(!fp.startsWith(ROOT)){p.writeHead(403);return p.end('mimo ROOT');}
 let b=null,duvod='';
 // Jen errno (ENOENT, EACCES…), nikdy celá výjimka — ta nese cestu i
 // zásobník volání a neposílá se ven (CodeQL: information exposure
 // through a stack trace). Do odpovědi nejde nic, důvod jen do konzole.
 try{b=fs.readFileSync(fp);}catch(e){duvod=(e&&e.code)||'chyba čtení';}
 if(b===null){
   if(++ctyristaCtyri<=10)console.log('   [server] 404 '+u+' ('+duvod+')');
   else if(ctyristaCtyri===11)console.log('   [server] … další 404 se už nevypisují');
   p.writeHead(404);return p.end();}
 const m={html:'text/html',js:'application/javascript',css:'text/css'};
 p.writeHead(200,{'Content-Type':m[u.split('.').pop()]||'application/octet-stream'});p.end(b);});

const PAGES=[...[3,4,5,6,7,8,9].map(g=>['g'+g,'/projects/rpg-mat-'+g+'.html']),
 ['hub','/projects/rpg-matematika.html'],['ucitel','/projects/rpg-ucitel.html'],
 ['pz-hub','/projects/prijimacky-matematika/index.html'],['pz-test','/projects/prijimacky-matematika/test.html'],
 ['pz-proc','/projects/prijimacky-matematika/procvicovani.html'],['pz-diag','/projects/prijimacky-matematika/diagnostika.html'],
 ['pz-stat','/projects/prijimacky-matematika/statistiky.html'],['pz-dopl','/projects/prijimacky-matematika/doplnky.html'],
 // Tenhle seznam byl ručně udržovaný a KRYL JEN RPG + přijímačky, i když
 // hlavička testu tvrdila „prochází všechny stránky". Chybělo 15 stránek
 // odkázaných z rozcestníku — únikovky, cesta peněz, procenta, goniometrie
 // i osobní web. Po doplnění se hned našlo přetečení řádku „Mám kód
 // odjinud" v goniometrii na 380 px. Zbytek byl v pořádku
 // (252 obrazovek / 14 968 prvků).
 ['gonio','/projects/goniometrie.html'],['naroz','/projects/narozeniny.html'],
 ['papir','/projects/papir.html'],['cesta','/projects/cesta_penez.html'],
 ['proc','/projects/procenta_priklady.html'],
 ...['linearni_funkce','mocniny','procenta','pythagoras','rovnice','statistika','telesa','trojuhelniky']
   .map(u=>['u-'+u,'/projects/unikovka_'+u+'.html']),
 ['proj','/projects/index.html'],['home','/index.html'],['404','/404.html'],
 ['travels','/travels/index.html']];
const SIRKY=[1100,820,380];

/* ── Průchod obrazovkami u stránek, které NEJSOU RPG hra ──────────────
   Dřív se u nich měřila JEN úvodní obrazovka: `screens` bylo natvrdo
   `[null]` pro všechno, co není `g3`–`g9`. Přetečení řádku „Mám kód
   odjinud" se proto našlo jen díky tomu, že je náhodou na intru
   goniometrie. Neproměřených zůstávalo ~177 obrazovek — a jsou to
   zrovna ty s hustým obsahem: tabulky v zadáních zámků, SVG
   trojúhelníky, nápovědové boxy.

   Každý průchod má tři části a všechny běží V PROHLÍŽEČI (Playwright
   si funkci serializuje), takže tu nesmí být nic z Node.
   `prepnout` vrací prázdný řetězec při úspěchu, jinak důvod — stejně
   jako herní větev, aby se přeskočená obrazovka neztratila potichu.

   Nápovědy se ZÁMĚRNĚ rozbalují: L3 box je nejširší obsah na stránce
   a právě on se na 380 px nejspíš někam nevejde. */
const PRUCHODY = {
  unikovka: {
    pripravit: () => {
      const b = [...document.querySelectorAll('button')]
        .find(x => /Začít|Start|detektiv|Spustit/i.test(x.textContent));
      if (b) b.click();
    },
    seznam: () => STEPS.map((_, i) => 'zámek ' + (i + 1)).concat(['finále']),
    prepnout: k => {
      try {
        /* `k` je POPISEK, ne index. První verze psala `if (k < STEPS.length)`,
           jenže „zámek 3" < 10 je false, takže se pokaždé volalo `finish()`
           a všech jedenáct „obrazovek" byla jedna a tatáž finálová. Coverage
           přitom vypadalo v pořádku (774 obrazovek) — proto ta pojistka na
           různost otisků níže. */
        if (k !== 'finále') {
          render(+k.replace('zámek ', '') - 1);
          /* Rozbal nápovědu k úloze i ke kódu — bez toho se měří
             jen složená karta a boxy se nikdy nezobrazí. */
          document.querySelectorAll('.hint-btn').forEach(b => b.click());
          const ch = document.getElementById('ch-btn');
          if (ch) { ch.click(); ch.click(); ch.click(); }
        } else { finish(); }
        return '';
      } catch (e) { return 'výjimka: ' + String(e && e.message || e).slice(0, 60); }
    },
  },
  /* Goniometrie i Cesta peněz mají stejný tvar: `startAct(id)` a pak
     index scény + překreslení. Liší se jen jménem proměnné. */
  gonio: {
    seznam: () => ACTS.flatMap(a => a.scenes.map((_, i) => 'kap.' + a.id + '/scéna ' + i)),
    prepnout: k => {
      try {
        const [ai, si] = k.replace('kap.', '').split('/scéna ');
        startAct(+ai); currentSceneIdx = +si; renderScene();
        const h = document.getElementById('hint-toggle');
        if (h) { h.click(); h.click(); h.click(); }
        return '';
      } catch (e) { return 'výjimka: ' + String(e && e.message || e).slice(0, 60); }
    },
  },
  cesta: {
    seznam: () => ACTS.flatMap(a => a.scenes.map((_, i) => 'akt' + a.id + '/scéna ' + i)),
    prepnout: k => {
      try {
        const [ai, si] = k.replace('akt', '').split('/scéna ');
        startAct(+ai); sceneIdx = +si; renderScene();
        const h = document.getElementById('hint-btn') || document.querySelector('.hint-btn');
        if (h) { h.click(); h.click(); h.click(); }
        return '';
      } catch (e) { return 'výjimka: ' + String(e && e.message || e).slice(0, 60); }
    },
  },
  proc: {
    pripravit: () => { selectDifficulty('hard'); startGame(); },
    seznam: () => problems.map((_, i) => 'úloha ' + (i + 1)),
    prepnout: k => {
      try {
        cur = +k.replace('úloha ', '') - 1; hintLevel = 0; renderProblem();
        advanceHint(); advanceHint(); advanceHint();
        return '';
      } catch (e) { return 'výjimka: ' + String(e && e.message || e).slice(0, 60); }
    },
  },
};

/* Z názvu stránky v PAGES na typ průchodu. */
const typPruchodu = jm => /^u-/.test(jm) ? 'unikovka' : (PRUCHODY[jm] ? jm : null);

const DET=()=>{
 const de=document.documentElement;
 const stranka=de.scrollWidth>de.clientWidth+1?de.scrollWidth-de.clientWidth:0;
 const ven=[]; let videno=0;
 for(const el of document.querySelectorAll('body *')){
   const cs=getComputedStyle(el);
   if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='absolute'||cs.position==='fixed')continue;
   const pa=el.parentElement; if(!pa||pa===document.body)continue;
   const ps=getComputedStyle(pa);
   if(/auto|scroll|hidden/.test(ps.overflowX))continue;      // rodič si přetečení řeší sám
   if(ps.display==='inline'||ps.display==='contents')continue;
   const pb=pa.getBoundingClientRect(); if(pb.width<20)continue;
   const cb=el.getBoundingClientRect(); if(cb.width<4&&cb.height<4)continue;
   videno++;
   const mimo=cb.right>pb.right+2||cb.left<pb.left-2;
   const orez=el.scrollWidth>el.clientWidth+2&&!/auto|scroll/.test(cs.overflowX);
   if(mimo||orez)
     ven.push((pa.id||pa.className.toString().split(' ')[0]||pa.tagName)+' → '+
              (el.id||el.className.toString().split(' ')[0]||el.tagName)+
              ' «'+(el.textContent||'').trim().slice(0,20)+'» '+(mimo?'mimo':'')+(orez?'ořez':''));
 }
 // Otisk obsahu — slouží k odhalení průchodu, který se ve skutečnosti
 // nikam nepřepnul (viz komentář u průchodu únikovkami).
 const otisk=(document.body.textContent||'').replace(/\s+/g,'').length;
 return {stranka,videno,ven:[...new Set(ven)].slice(0,8),otisk};
};

(async()=>{
 await new Promise(r=>srv.listen(PORT,r));
 const b=await chromium.launch({headless:true,executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const nalezy=[]; let obrazovek=0,prvku=0;
 for(const [jm,url] of PAGES) for(const w of SIRKY){
  const otisky=[];
  const ctx=await b.newContext({viewport:{width:w,height:900}});
  await ctx.route('**/*',r=>r.request().url().startsWith('http://localhost:'+PORT)?r.continue():r.abort());
  const pg=await ctx.newPage();
  try{
   await pg.goto('http://localhost:'+PORT+url,{waitUntil:'domcontentloaded',timeout:15000});
   await pg.waitForTimeout(400);
   const jeHra=/^g\d$/.test(jm);
   if(jeHra){await pg.waitForFunction(()=>typeof startGame==='function',{timeout:8000});
     await pg.evaluate(()=>{localStorage.clear();startGame('Testovací žákyně');S.tutorialDone=true;});}
   const typ=jeHra?null:typPruchodu(jm);
   const P=typ?PRUCHODY[typ]:null;
   if(P&&P.pripravit){await pg.evaluate(P.pripravit);await pg.waitForTimeout(250);}
   const screens=jeHra
     ? await pg.evaluate(()=>[...document.querySelectorAll('.screen')].map(s=>s.id))
     : (P?await pg.evaluate(P.seznam):[null]);
   for(const sc of screens){
    // Dřív tahle větev vracela jen true/false a při false se `continue`lo
    // BEZ ZÁZNAMU. Obrazovka se tedy tiše přeskočila a jediné, co se
    // nakonec ozvalo, byla pojistka „skoro nic neproměřil" — bez důvodu.
    // Teď se vrací důvod a zapíše se mezi nálezy.
    // Ne-herní stránka s průchodem: přepni obrazovku jejím vlastním
    // způsobem. Důvod neúspěchu se zapíše mezi nálezy, ať se obrazovka
    // nepřeskočí potichu (stejná past jako u her, viz komentář níže).
    if(sc&&P){const okk=await pg.evaluate(([f,k])=>new Function('k','return ('+f+')(k)')(k),
      [P.prepnout.toString(),sc]);
     if(okk){nalezy.push(`${jm}@${w} ${sc}: PŘESKOČENO — ${okk}`);continue;}
     await pg.waitForTimeout(80);}
    else if(sc){const okk=await pg.evaluate(id=>{try{
      document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
      const el=document.getElementById(id);
      if(!el)return 'obrazovka v DOM není';
      el.classList.add('on');
      const f={'s-map':()=>renderMap(),'s-profile':()=>renderProfile(),'s-shop':()=>renderShop(),
               's-train':()=>renderTrainPicker(),'s-tower':()=>renderTowerGate(),
               's-area':()=>renderArea(AREAS[0].id)}[id];
      if(f)try{f();}catch(e){} return '';}catch(e){return 'výjimka: '+String(e&&e.message||e).slice(0,60);}},sc);
     if(okk){nalezy.push(`${jm}@${w} ${sc}: PŘESKOČENO — ${okk}`);continue;}
     await pg.waitForTimeout(100);}
    const r=await pg.evaluate(DET);
    obrazovek++; prvku+=r.videno; otisky.push(r.otisk);
    if(r.stranka||r.ven.length)
      nalezy.push(`${jm}@${w}${sc?' '+sc:''}: ${r.stranka?'STRÁNKA +'+r.stranka+'px; ':''}${r.ven.join(' | ')}`);
   }
  }catch(e){nalezy.push(`${jm}@${w}: CHYBA ${String(e.message).slice(0,70)}`);}
  /* Průchod, který se nikam nepřepnul, měří pořád tutéž obrazovku a
     tváří se přitom jako plné pokrytí. Přesně to se stalo únikovkám.
     Pár shodných otisků je v pořádku (obrazovky si můžou být podobné),
     ale VŠECHNY stejné při více obrazovkách znamená, že se nic neděje. */
  if(otisky.length>2&&new Set(otisky).size===1)
    nalezy.push(`${jm}@${w}: PRŮCHOD SE NEPŘEPÍNÁ — všech ${otisky.length} obrazovek má shodný obsah`);
  await ctx.close();
 }
 console.log(`PROMĚŘENO: ${obrazovek} obrazovek, ${prvku} prvků`);
 if(nalezy.length){console.log('  ❌ nálezy:');nalezy.forEach(x=>console.log('     '+x));}
 // Pojistka proti prázdnému běhu: kdyby se stránky přestaly načítat nebo
 // se změnil tvar DOM, smyčka by nic neproměřila a test by tiše prošel.
 // Podlaha je NAMĚŘENÁ: 774 obrazovek / 27 681 prvků. Hlídá i to, že
 // průchody ne-herních stránek pořád fungují — kdyby `seznam` začal
 // vracet prázdno, spadne se zpátky na 252 obrazovek (jen úvodní snímky)
 // a test to ohlásí místo toho, aby tiše měřil třetinu webu jako dřív.
 const dost = obrazovek >= 600 && prvku >= 20000;
 if(!dost)console.log('  ❌ audit skoro nic neproměřil ('+obrazovek+' obrazovek / '+prvku+
   ' prvků, čekáno ≥600 / ≥20000) — pravidlo by štěkalo naprázdno; ROOT='+ROOT);
 console.log(nalezy.length||!dost ? '\n  Rozvržení: SELHALO\n' : '\n  Rozvržení: v pořádku\n');
 await b.close();srv.close();
 process.exit((nalezy.length||obrazovek<150||prvku<5000)?1:0);
})();
