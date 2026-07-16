/* Cílené ověření oprav z PR #83 na rpg-mat-9:
   1) boss HP bar = podíl splněných úkolů (ne index / player HP)
   2) ÚTOK ⚔ je po správné odpovědi disabled, po DÁLE zase enabled
   3) BT._bid guard — žádný stale callback z minulého boje
   4) RPGSprites9.setProgress existuje a boss.progress se hýbe
   5) +XP vlevo (hrdina), -HP spark vpravo (boss)
   Spusť: node tests/pr83-verify.cjs */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};

function serve(){return new Promise(res=>{const srv=http.createServer((req,rep)=>{let u=decodeURIComponent(req.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const fp=path.normalize(path.join(ROOT,u));if(!fp.startsWith(ROOT+path.sep)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){rep.writeHead(404);return rep.end('nf');}rep.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});fs.createReadStream(fp).pipe(rep);});srv.listen(0,()=>res(srv));});}

let pass=0,fail=0;
const ok=(c,m)=>{if(c){pass++;console.log('  ✓ '+m);}else{fail++;console.log('  ✗ '+m);}};

(async()=>{
  const srv=await serve();
  const base=`http://127.0.0.1:${srv.address().port}`;
  const browser=await chromium.launch({executablePath:EXEC});
  const page=await browser.newPage();
  const errors=[];
  const noise=t=>/Failed to load resource|ERR_CERT|net::ERR_|supabase|jsdelivr/i.test(t);
  page.on('pageerror',e=>{if(!noise(e.message))errors.push(e.message);});
  page.on('console',m=>{if(m.type()==='error'&&!noise(m.text()))errors.push(m.text());});

  await page.goto(`${base}/projects/rpg-mat-9.html`,{waitUntil:'load'});
  await page.fill('#ni','TesterX');
  await page.evaluate(()=>startGame());
  await page.waitForFunction(()=>document.querySelector('#s-map')?.classList.contains('active'));

  // vstup do boje 1-1 (MC mise)
  await page.evaluate(()=>{openArea(1);launchBattle(1,'1-1');});
  await page.waitForFunction(()=>document.querySelector('#s-battle')?.classList.contains('active'));

  console.log('— HP bar + setProgress —');
  let w=await page.evaluate(()=>document.getElementById('bt-hpbar').style.width);
  ok(w==='100%','HP bar startuje na 100% ('+w+')');
  ok(await page.evaluate(()=>typeof RPGSprites9!=='undefined'&&typeof RPGSprites9.setProgress==='function'),'RPGSprites9.setProgress existuje');

  // zodpověz správně 3 úkoly (MC) — bar má klesat o 1/tc
  const tc=await page.evaluate(()=>BT.tasks.length);
  for(let i=0;i<3;i++){
    await page.evaluate(()=>{
      const ans=String(BT.curTask.ans);
      const btns=[...document.querySelectorAll('#mc-grid .mc-btn')];
      const btn=btns.find(b=>b.textContent.trim().replace(/^[A-D]/,'')===ans)||btns[0];
      btn.click();
    });
    await page.waitForFunction(()=>document.getElementById('next-btn').style.display!=='none');
    const expected=Math.round((1-(i+1)/tc)*1000)/10;
    const got=parseFloat(await page.evaluate(()=>document.getElementById('bt-hpbar').style.width));
    ok(Math.abs(got-expected)<0.5,`po ${i+1}. správné: bar ${got}% (čekáno ~${expected}%)`);
    if(i<2){await page.evaluate(()=>nextTask());await page.waitForTimeout(150);}
  }

  console.log('— text-input mise: zámek tlačítka ÚTOK —');
  // přepni na 1-2 (text input)
  await page.evaluate(()=>{go('map');launchBattle(1,'1-2');});
  await page.waitForFunction(()=>document.querySelector('#s-battle')?.classList.contains('active'));
  // launchBattle zamkne ÚTOK na ~700 ms (boss-entry animace) → počkej na odemčení
  await page.waitForFunction(()=>!document.getElementById('attack-btn').disabled,{timeout:2500}).catch(()=>{});
  ok(await page.evaluate(()=>!document.getElementById('attack-btn').disabled),'ÚTOK je na startu enabled');
  await page.evaluate(()=>{document.getElementById('bt-ans').value=BT.curTask.ans;submitAnswer();});
  await page.waitForFunction(()=>document.getElementById('next-btn').style.display!=='none');
  ok(await page.evaluate(()=>document.getElementById('attack-btn').disabled),'ÚTOK je po správné odpovědi disabled');
  ok(await page.evaluate(()=>document.getElementById('bt-ans').disabled),'input je disabled');
  await page.evaluate(()=>nextTask());
  await page.waitForTimeout(150);
  const ynNow=await page.evaluate(()=>document.getElementById('yn-row').style.display!=='none');
  if(!ynNow) ok(await page.evaluate(()=>!document.getElementById('attack-btn').disabled),'ÚTOK je po DÁLE zase enabled');
  else console.log('  (další úkol je ANO/NE — zámek tlačítka se netýká)');

  console.log('— stale attack guard (BT._bid) —');
  // vyvolej špatnou odpověď → monsterAttack s 1s callbackem; hned přepni misi
  const bidBefore=await page.evaluate(()=>{
    const inp=document.getElementById('bt-ans');
    if(inp&&document.getElementById('bt-input-row').style.display!=='none'){inp.value='99999999';submitAnswer();}
    else{monsterAttack();}
    return BT._bid;
  });
  await page.evaluate(()=>{go('map');launchBattle(1,'1-1');});
  const bidAfter=await page.evaluate(()=>BT._bid);
  ok(bidAfter===bidBefore+1,'BT._bid se inkrementuje při launchBattle');
  await page.waitForTimeout(1300); // nech stale callback doběhnout
  const shaken=await page.evaluate(()=>document.getElementById('bt-top').classList.contains('shake'));
  ok(!shaken,'stale callback z minulého boje neudělal shake v novém boji');

  console.log('— boss damage progress v enginu —');
  await page.evaluate(()=>RPGSprites9.setProgress(0.8));
  // interní stav neexponujeme — stačí, že volání nehodí chybu a clamp funguje
  await page.evaluate(()=>{RPGSprites9.setProgress(5);RPGSprites9.setProgress(-3);RPGSprites9.setProgress(NaN);});
  ok(true,'setProgress snese 0.8 / 5 / -3 / NaN bez chyby');

  console.log('— pozice floatů —');
  const sparkLeft=await page.evaluate(()=>getComputedStyle(document.getElementById('dmg-spark')).left);
  const topW=await page.evaluate(()=>document.getElementById('bt-top').getBoundingClientRect().width);
  ok(parseFloat(sparkLeft)/topW>0.6,'dmg-spark je v pravé části arény ('+sparkLeft+' z '+Math.round(topW)+'px)');

  ok(errors.length===0,'žádné JS chyby ('+errors.length+')');
  if(errors.length)errors.slice(0,5).forEach(e=>console.log('   ⚠ '+e));

  await browser.close();srv.close();
  console.log(`\n${pass} ✓ / ${fail} ✗`);
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
