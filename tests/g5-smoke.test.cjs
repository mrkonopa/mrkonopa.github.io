const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
let pass = 0, fail = 0;
function ok(c, m){ if(c){pass++;console.log('  ✅ '+m);}else{fail++;console.log('  ❌ '+m);} }

function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('nf');}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC });
  const ctx = await browser.newContext({ viewport: {width:480,height:800} });
  const page = await ctx.newPage();
  const jsErrs = [];
  page.on('pageerror', e => { jsErrs.push(e.message); console.log('  JS ERR: '+e.message); });
  page.on('console', m => { if(m.type()==='error') console.log('  CONSOLE ERR: '+m.text()); });

  console.log('\n━━ rpg-mat-5 smoke test ━━');
  await page.goto(base + '/projects/rpg-mat-5.html', {waitUntil:'load'});
  await sleep(2000);

  const introActive = await page.evaluate(()=>{
    const el = document.getElementById('s-intro');
    return el && el.classList.contains('active');
  });
  ok(introActive, 's-intro is active on load');

  const niExists = await page.evaluate(()=>!!document.getElementById('ni'));
  ok(niExists, '#ni input exists');

  await page.evaluate(()=>{
    if(!window.RPGSprites5) window.RPGSprites5={attach:()=>{},spawn:()=>{},setHeroHp:()=>{},active:()=>false,detach:()=>{},heroAttack:()=>{},bossAttack:()=>{},defeat:()=>{},setSkin:()=>{},drawHeroOn:()=>{}};
    if(!window.RPG_TASK_EXTRA_5) {
      const t = {text:'2+2',ans:'4',hints:['Dej dohromady','4']};
      const mt = {text:'3+3',ans:6,mc:true,hints:['h1','h2']};
      const bank = {};
      for(let a=1;a<=7;a++) for(let m=1;m<=3;m++) bank[a+'-'+m]=()=>[t,t,t,t,t,t];
      bank['1-1']=()=>[mt,mt,mt,mt,mt,mt];
      bank['1-2']=()=>[mt,mt,mt,mt,mt,mt];
      bank['3-1']=()=>[mt,mt,mt,mt,mt,mt];
      bank['4-1']=()=>[mt,mt,mt,mt,mt,mt];
      bank['7-1']=()=>[mt,mt,mt,mt,mt,mt];
      window.RPG_TASK_EXTRA_5=bank;
    }
    if(!window.RPGWallet) window.RPGWallet={earn:()=>{},getCredits:()=>0,onChange:()=>{}};
    if(!window.RPGCloud) window.RPGCloud={attachGame:()=>{}};
  });

  await page.evaluate(()=>document.getElementById('ni').value='Drakobijec');
  await page.evaluate(()=>startGame());
  await sleep(500);

  const mapActive = await page.evaluate(()=>document.querySelector('.screen.active')&&document.querySelector('.screen.active').id);
  ok(mapActive==='s-map','startGame() shows map screen');

  const areaCount = await page.evaluate(()=>typeof AREAS!=='undefined'?AREAS.length:0);
  ok(areaCount===7,'AREAS has 7 entries');

  const cmc = await page.evaluate(()=>typeof checkMissionComplete);
  ok(cmc==='function','checkMissionComplete is defined');

  await page.evaluate(()=>openArea(1));
  await sleep(300);
  const areaScreen = await page.evaluate(()=>document.querySelector('.screen.active')&&document.querySelector('.screen.active').id);
  ok(areaScreen==='s-area','openArea(1) shows area screen');

  await page.evaluate(()=>launchBattle(1,'1-1'));
  await sleep(500);
  const battleScreen = await page.evaluate(()=>document.querySelector('.screen.active')&&document.querySelector('.screen.active').id);
  ok(battleScreen==='s-battle','launchBattle shows battle screen');

  const mcVisible = await page.evaluate(()=>{
    const g=document.getElementById('mc-grid');
    return g && g.style.display!=='none';
  });
  ok(mcVisible,'MC grid visible for mc:true mission 1-1');

  const taskText = await page.evaluate(()=>(document.getElementById('bt-prob')||{textContent:''}).textContent);
  ok(taskText.length>0,'task text rendered');

  ok(jsErrs.length===0,'no JS errors ('+jsErrs.length+' errors)');
  if(jsErrs.length>0) jsErrs.forEach(e=>console.log('  → '+e));

  await browser.close();
  srv.close();
  console.log('\n══ VÝSLEDEK: ' + pass + ' ✅  /  ' + fail + ' ❌ ══\n');
  process.exit(fail>0?1:0);
})();
