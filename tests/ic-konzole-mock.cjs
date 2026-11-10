/* ═════════════════════════════════════════════════════════════════════════════
   Společné nářadí testů učitelské konzole (záložka INFOCENTRUM), autor Vojtěch Konopa.
   `mock(S)` = napodobenina Supabase (tabulky v paměti `window.__db`, přihlášený učitel ze scénáře S),
   `server(prepis)` = statický server repozitáře (volitelná úprava odpovědi podle jména souboru, pro sabotáže),
   `baseOf(srv)` = adresa serveru. Jedno místo pro `rpg-infocentrum-konzole` a `rpg-infocentrum-panely`.
   ═════════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.join(__dirname, '..');

function mock(S) {
  return `(function(){
    const S=${JSON.stringify(S)};
    const db={roles:S.roles,saves:S.saves,classes:S.classes,class_members:S.members,log:[],selze:false,bitvy:[],stavBitvy:null};
    window.__db=db;
    function q(table){
      const f=[];let sel='';
      const res=()=>{
        db.log.push({table,sel,f:JSON.parse(JSON.stringify(f))});
        let r=(db[table]||[]).slice();
        for(const [op,c,v] of f){
          if(op==='eq')r=r.filter(x=>String(x[c])===String(v));
          else if(op==='in')r=r.filter(x=>v.map(String).includes(String(x[c])));
          else if(op==='gt')r=r.filter(x=>String(x[c])>String(v));
        }
        if(table==='saves'&&/xp:data->xp/.test(sel)){
          if(db.selze)return Promise.resolve({data:null,error:{message:'boom'}});
          r=r.map(x=>({user_id:x.user_id,game:x.game,name:x.name,full_name:x.full_name,updated_at:x.updated_at,xp:x.data.xp,level:x.data.level,done:x.data.done,ach:x.data.ach,hero:x.data.name,cur:/cur:data->cur/.test(sel)?x.data.cur:undefined}));
        }
        return Promise.resolve({data:r,error:null});
      };
      const b={select(c){sel=c||'';return b;},eq(c,v){f.push(['eq',c,v]);return b;},in(c,v){f.push(['in',c,v]);return b;},gt(c,v){f.push(['gt',c,v]);return b;},
        order(){return b;},is(){return b;},neq(){return b;},limit(){return b;},insert(){return b;},upsert(){return b;},update(){return b;},delete(){return b;},
        maybeSingle(){return res().then(x=>({data:(x.data||[])[0]||null,error:x.error}));},single(){return res().then(x=>({data:(x.data||[])[0]||null,error:x.error}));},
        then(a,c){return res().then(a,c);}};
      return b;
    }
    const rpc=async(name,args)=>{
      if(name==='list_active_battles')return {data:db.bitvy,error:null};
      if(name==='battle_state')return {data:(db.stavyPodleId&&args&&db.stavyPodleId[args.p_battle])||db.stavBitvy,error:null};
      return {data:[],error:null};
    };
    window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:S.session}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth:async()=>{},signOut:async()=>{}},from:q,rpc})};
  })();`;
}

function server(prepis) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); }
    let telo = fs.readFileSync(fp), pr = null;
    for (const [k, f] of Object.entries(prepis || {})) if (k === path.basename(fp)) pr = f;
    if (pr) telo = Buffer.from(pr(telo.toString('utf8')));
    r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream', 'cache-control': 'no-store' });
    r.end(telo);
  });
  return new Promise(res => srv.listen(0, '127.0.0.1', () => res(srv)));
}
const baseOf = s => 'http://127.0.0.1:' + s.address().port;


module.exports = { mock, server, baseOf };
