/**
 * Regrese: mapa se „načítala dvakrát" po přihlášení.
 * Příčina: Supabase onAuthStateChange po subscribe pošle event INITIAL_SESSION,
 * což emitovalo onChange podruhé (navíc k explicitnímu emit() po getSession) →
 * celý onChange (continueGame → renderMap s animací nájezdu) běžel 2×.
 * Fix (rpg-cloud.js init): INITIAL_SESSION přeskočit; emitovat jen při skutečné
 * změně uživatele (ne TOKEN_REFRESHED).
 *
 * Test řídí onAuthStateChange callback ručně (jako reálný Supabase) a počítá
 * emity vlastního posluchače.
 * Spusť: node tests/rpg-double-load.test.cjs
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

const U1={id:'u1',email:'zak@husovaliberec.cz',user_metadata:{full_name:'Žák Jedna'}};
const U2={id:'u2',email:'zak2@husovaliberec.cz',user_metadata:{full_name:'Žák Dva'}};

const MOCK=`
window.__authCb=null;
window.supabase={ createClient:function(){ return {
  auth:{
    getSession: async()=>({ data:{ session:{ user:${JSON.stringify(U1)} } } }),
    onAuthStateChange:(cb)=>{ window.__authCb=cb; return { data:{ subscription:{ unsubscribe(){} } } }; },
    signOut: async()=>{ return {}; },
    signInWithOAuth: async()=>({}),
  },
  rpc: async()=>({ data:null, error:null }),
  from:()=>{ const p=Promise.resolve({data:null,error:null}); const h={ select:()=>h, insert:()=>h, upsert:()=>h, update:()=>h, delete:()=>h, eq:()=>h, in:()=>h, order:()=>h, limit:()=>h, single:()=>Promise.resolve({data:null,error:null}), maybeSingle:()=>Promise.resolve({data:null,error:null}), then:p.then.bind(p), catch:p.catch.bind(p) }; return h; },
  channel:()=>({ on:()=>({ subscribe:()=>({}) }) }),
}; } };
`;

(async()=>{
  const srv=await serve();const base='http://127.0.0.1:'+srv.address().port;
  const b=await chromium.launch({executablePath:EXEC});
  const ctx=await b.newContext({viewport:{width:480,height:900}});
  await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1')?r.continue():r.abort());
  await ctx.addInitScript(({key})=>{localStorage.setItem(key,JSON.stringify({name:'HRÁČ',xp:20,level:1,attrs:{calc:5,geo:0,anal:0,craft:0},done:{'1-1-0':true},inv:[]}));},{key:'RPG_MAT_9'});
  await ctx.addInitScript(MOCK);
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e.message).slice(0,120)));
  await pg.goto(base+'/projects/rpg-mat-9.html',{waitUntil:'load'});
  await sleep(600); // init() proběhne: getSession → emit (line 66) + onAuthStateChange registrace

  // Ověř, že callback je zaregistrovaný (jinak test nic netestuje)
  ok('onAuthStateChange callback zaregistrován', await pg.evaluate(()=>typeof window.__authCb==='function'));

  // přidej vlastní čítač emitů AŽ po startovacím emitu
  await pg.evaluate(()=>{ window.__emits=0; RPGCloud.onChange(()=>{window.__emits++;}); });

  // 1) INITIAL_SESSION (reálný Supabase ho pošle hned po subscribe) → NESMÍ emitovat
  await pg.evaluate(u=>window.__authCb('INITIAL_SESSION',{user:u}),U1);
  await sleep(150);
  ok('INITIAL_SESSION NEemituje (žádné druhé načtení mapy)', await pg.evaluate(()=>window.__emits)===0, 'emits='+await pg.evaluate(()=>window.__emits));

  // 2) TOKEN_REFRESHED se stejným uživatelem → NESMÍ emitovat (žádné zbytečné překreslení)
  await pg.evaluate(u=>window.__authCb('TOKEN_REFRESHED',{user:u}),U1);
  await sleep(150);
  ok('TOKEN_REFRESHED (stejný uživatel) NEemituje', await pg.evaluate(()=>window.__emits)===0, 'emits='+await pg.evaluate(()=>window.__emits));

  // 3) SIGNED_OUT → uživatel se změní (na null) → MUSÍ emitovat jednou
  await pg.evaluate(()=>window.__authCb('SIGNED_OUT',null));
  await sleep(150);
  ok('SIGNED_OUT emituje jednou', await pg.evaluate(()=>window.__emits)===1, 'emits='+await pg.evaluate(()=>window.__emits));

  // 4) SIGNED_IN nový uživatel → MUSÍ emitovat (celkem 2)
  await pg.evaluate(u=>window.__authCb('SIGNED_IN',{user:u}),U2);
  await sleep(200);
  ok('SIGNED_IN (nový uživatel) emituje', await pg.evaluate(()=>window.__emits)===2, 'emits='+await pg.evaluate(()=>window.__emits));

  const re=errs.filter(e=>!/ERR_CERT|net::|jsdelivr|supabase|Failed to fetch/i.test(e));
  ok('žádné JS chyby', re.length===0, re.slice(0,2).join(' | '));

  await b.close();srv.close();
  console.log(`\n══════════ VÝSLEDEK: ${pass} ✅ / ${fail} ❌ ══════════`);
  if(fail)process.exitCode=1;
})();
