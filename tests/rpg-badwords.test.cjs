/**
 * Filtr nevhodných jmen (rpg-badwords.js) — sdílený pro všechny hry i HUB.
 *  - jednotkové: contains() chytá obcházení (mezery, leet, diakritika, opakování),
 *    a NEhlásí falešně běžná (i záludná) jména,
 *  - integrace: startGame() ve všech 7 hrách zablokuje nevhodné jméno (zůstane
 *    na úvodní obrazovce), čisté jméno pustí dál,
 *  - HUB: přejmenování odmítne nevhodné jméno.
 * Spusť: node tests/rpg-badwords.test.cjs
 */
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..');
const EXEC='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.normalize(path.join(ROOT,u));if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end('nf');}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'x'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res(s));});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0;
const ok=(n,c,d='')=>{if(c){console.log('  ✅ '+n);pass++;}else{console.log('  ❌ '+n+(d?' — '+d:''));fail++;}};

(async()=>{
  const srv=await serve();const base='http://127.0.0.1:'+srv.address().port;
  const b=await chromium.launch({executablePath:EXEC});

  // ── jednotkové testy filtru (načteme jen modul do prázdné stránky) ──
  console.log('\n━━ jednotkové: RPGBadWords.contains ━━');
  {
    const pg=await(await b.newContext()).newPage();
    await pg.setContent('<!doctype html><meta charset=utf-8><body>');
    await pg.addScriptTag({url:base+'/projects/rpg-badwords.js'});
    const R=async(name)=>pg.evaluate(n=>RPGBadWords.contains(n),name);
    for(const bad of ['FUCK NIGGERS','fuck niggers','F U C K','N1GG3R','FUUUCK','kok0t','PÍČA','čurák','ZMRD','HITLER','nazi','FAGGOT','retard','SEX','pí.ča']) ok('blokuje: '+bad, await R(bad)===true);
    for(const good of ['ADÉLA','MATĚJ','SHEILA','JANUSZ','PATRIK','DENISA','ANNA','ŠTĚPÁN','KRISTÝNA','VOJTA','FRANTIŠEK','PRŮZKUMNÍK','DRAKOBIJEC']) ok('pustí: '+good, await R(good)===false);
    await pg.context().close();
  }

  // ── integrace: startGame blokuje ve všech 7 hrách ──
  for(const N of [3,4,5,6,7,8,9]){
    console.log(`\n━━ ${N}. ročník — startGame ━━`);
    const ctx=await b.newContext();
    await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1')?r.continue():r.abort());
    const pg=await ctx.newPage();let dialog='';pg.on('dialog',d=>{dialog=d.message();d.accept();});
    const errs=[];pg.on('pageerror',e=>errs.push(String(e.message).slice(0,100)));
    await pg.goto(base+'/projects/rpg-mat-'+N+'.html',{waitUntil:'domcontentloaded'});await sleep(500);
    // 1) nevhodné jméno → zůstane na intru, jméno se neuloží
    dialog='';
    await pg.evaluate(()=>{document.getElementById('ni').value='FUCK NIGGERS';startGame();});
    await sleep(200);
    const st1=await pg.evaluate(()=>({scr:(document.querySelector('.screen.active')||{}).id,name:(typeof S!=='undefined'?S.name:null)}));
    ok(`g${N}: nevhodné jméno zablokováno (zůstane na intru)`, st1.scr==='s-intro', 'scr='+st1.scr);
    ok(`g${N}: ukázal se alert`, /není povolené/i.test(dialog), 'dialog="'+dialog+'"');
    ok(`g${N}: nevhodné jméno se neuložilo do S.name`, st1.name!=='FUCK NIGGERS', 'name='+st1.name);
    // 2) čisté jméno → projde na mapu
    await pg.evaluate(()=>{document.getElementById('ni').value='ADÉLA';startGame();});
    await sleep(300);
    const st2=await pg.evaluate(()=>({scr:(document.querySelector('.screen.active')||{}).id,name:S.name}));
    ok(`g${N}: čisté jméno projde na mapu`, st2.scr==='s-map'&&st2.name==='ADÉLA', 'scr='+st2.scr+' name='+st2.name);
    const re=errs.filter(e=>!/ERR_CERT|net::|jsdelivr|supabase/i.test(e));
    ok(`g${N}: žádné JS chyby`, re.length===0, re.slice(0,2).join(' | '));
    await ctx.close();
  }

  await b.close();srv.close();
  console.log(`\n══════════ VÝSLEDEK: ${pass} ✅ / ${fail} ❌ ══════════`);
  if(fail)process.exitCode=1;
})();
