/* ══════════════════════════════════════════════════════════════════════
   Sdílená napodobenina Supabase pro stránky přijímaček: přihlášený (nebo
   odhlášený) žák bez sítě. Session se čte z `window.__SESSION`, volání přihlášení
   a odhlášení se počítají v `window.__VOLANI`. Používá ji `prijimacky-uvod`
   (hlavní stránka) i `prijimacky-motiv` (tmavý vzhled přihlášeného žáka) —
   jedno místo, žádné kopie. Vkládá se jako init skript PŘED stránkou.
   ══════════════════════════════════════════════════════════════════════ */
const MOCK = `
window.__VOLANI = { login: 0, logout: 0 };
(function(){
  let session = window.__SESSION === undefined ? null : window.__SESSION;
  try { if (sessionStorage.getItem('__LOGOUT')) session = null; } catch (e) {}   // po odhlášení a znovunačtení je žák zase odhlášený
  const okp = d => Promise.resolve({ data: d, error: null });
  function q(){ const o={data:null,error:null};
    ['select','eq','maybeSingle','order','limit','single','insert','update','upsert','delete','in','gte','lte','is'].forEach(m=>o[m]=()=>o);
    o.then=(r)=>r({data:null,error:null}); return o; }
  window.supabase = { createClient: ()=>({
    auth: {
      getSession: ()=>okp({ session }),
      signOut: ()=>{ try { sessionStorage.setItem('__LOGOUT', String(Number(sessionStorage.getItem('__LOGOUT') || 0) + 1)); } catch (e) {} session=null; return okp(null); },
      signInWithOAuth: ()=>{ window.__VOLANI.login++; return okp(null); },
      onAuthStateChange: ()=>({ data:{ subscription:{ unsubscribe(){} } } }),
    },
    from: ()=>q(),
    rpc: (fn)=> okp(fn==='pz_get_stats' ? (window.__CLOUD || {}) : null),
  }) };
})();`;

module.exports = { MOCK };
