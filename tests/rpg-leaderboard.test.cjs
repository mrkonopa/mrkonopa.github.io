/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 4: žebříček třídy (rpg-cloud.js leaderboard())
   Mock Supabase klient s .rpc — ověřuje volání leaderboard(p_game) a
   graceful chování (bez přihlášení → prázdné pole).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
function ok(c, m){ if(c){pass++;console.log('  ✅ '+m);} else {fail++;console.log('  ❌ '+m);} }

const SELF = { id: 'u-self', email: 'vojtech.konopa@husovaliberec.cz', user_metadata: { full_name: 'Vojta K.' } };
const LB_FX = [
  { user_id:'u-a', display_name:'Neo',     xp:300, lvl:4, is_me:false },
  { user_id:'u-self', display_name:'Vojta', xp:120, lvl:2, is_me:true  },
];

function makeClient(opts) {
  opts = opts || {};
  const rpcCalls = [];
  function builder(table) {
    const b = {};
    const chain = () => () => b;
    ['select','eq','order','insert','upsert','update','delete','neq'].forEach(m => b[m] = chain());
    const res = () => ({ data: table==='roles' ? { role:'student' } : null, error: null });
    b.maybeSingle = () => Promise.resolve(res());
    b.single = () => Promise.resolve(res());
    b.then = (r,j) => Promise.resolve(res()).then(r,j);
    return b;
  }
  return {
    _rpc: rpcCalls,
    from: builder,
    rpc: (name, params) => { rpcCalls.push({ name, params }); return Promise.resolve({ data: LB_FX, error: null }); },
    auth: {
      getSession: async () => ({ data: { session: opts.noUser ? null : { user: SELF } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe(){} } } }),
      signOut: async () => {},
    },
  };
}

async function loadCloud(opts) {
  const client = makeClient(opts);
  const sandbox = {
    window: { supabase: { createClient: () => client } },
    document: { addEventListener: () => {}, getElementById: id => (opts && opts.el && id === 'lb') ? opts.el : null },
    location: { search: '', href: 'http://x/' },
    console, setTimeout, clearTimeout, URLSearchParams, alert: () => {}, Date,
  };
  sandbox.window.location = sandbox.location;
  if (opts && opts.wallet) sandbox.RPGWallet = opts.wallet;
  vm.createContext(sandbox);
  const code = fs.readFileSync(path.join(__dirname, '..', 'projects', 'rpg-cloud.js'), 'utf8');
  vm.runInContext(code, sandbox);
  const RPGCloud = sandbox.window.RPGCloud;
  await RPGCloud.init();
  return { RPGCloud, client };
}

(async () => {
  console.log('\n── Fáze 4: žebříček třídy ──\n');

  console.log('── přihlášený žák ──');
  {
    const { RPGCloud, client } = await loadCloud();
    ok(typeof RPGCloud.leaderboard === 'function', 'leaderboard() je exportováno');
    ok(typeof RPGCloud.renderLeaderboardInto === 'function', 'renderLeaderboardInto() je exportováno');
    const lb = await RPGCloud.leaderboard('RPG_MAT_9');
    ok(Array.isArray(lb) && lb.length === 2, 'leaderboard vrací řádky');
    ok(client._rpc.length === 1 && client._rpc[0].name === 'leaderboard', 'volá RPC funkci leaderboard');
    ok(client._rpc[0].params && client._rpc[0].params.p_game === 'RPG_MAT_9', 'předává p_game správně');
    ok(lb.some(r => r.is_me) && lb.some(r => !r.is_me), 'fixture rozliší hráče (is_me)');
    // vrací jen necitlivá pole
    ok(lb.every(r => !('email' in r) && !('data' in r)), 'řádky neobsahují e-mail ani celý save (soukromí)');
  }

  console.log('\n── barva jména z obchodu v žebříčku ──');
  {
    const radek = (html, jmeno) => { const i = html.indexOf(jmeno); return i < 0 ? '' : html.slice(html.lastIndexOf('<span', i), i); };
    const el = () => ({ style: {}, innerHTML: '' });
    // koupená barva jména: třída jen u VLASTNÍHO řádku (spolužákům ji ukáže až databáze)
    const e1 = el();
    const { RPGCloud: C1 } = await loadCloud({ el: e1, wallet: { cssFor: c => c === 'badge' ? 'nm-gold' : '' } });
    await C1.renderLeaderboardInto('lb', 'RPG_MAT_9');
    ok(/class="nm-gold"/.test(radek(e1.innerHTML, 'Vojta')), 'vlastní řádek má třídu nm-gold: ' + radek(e1.innerHTML, 'Vojta').slice(0, 60));
    ok(!/nm-/.test(radek(e1.innerHTML, 'Neo')), 'cizí řádek nemá žádnou třídu nm-*');
    // bez koupené barvy (nebo bez peněženky) se nepřidá nic
    const e2 = el();
    const { RPGCloud: C2 } = await loadCloud({ el: e2, wallet: { cssFor: () => '' } });
    await C2.renderLeaderboardInto('lb', 'RPG_MAT_9');
    ok(!/nm-/.test(e2.innerHTML), 'bez koupené barvy žádná třída nm-*');
    const e3 = el();
    const { RPGCloud: C3 } = await loadCloud({ el: e3 });
    await C3.renderLeaderboardInto('lb', 'RPG_MAT_9');
    ok(!/nm-/.test(e3.innerHTML) && /Vojta/.test(e3.innerHTML), 'bez RPGWallet se žebříček vykreslí a třída není');
    // do atributu `class` se nikdy nedostane nic než [a-z-]
    const e4 = el();
    const { RPGCloud: C4 } = await loadCloud({ el: e4, wallet: { cssFor: () => 'nm-x" onclick="alert(1)' } });
    await C4.renderLeaderboardInto('lb', 'RPG_MAT_9');
    const kl = (e4.innerHTML.match(/<span class="([^"]*)"/) || [])[1];
    ok(kl !== undefined && /^[a-z-]*$/.test(kl) && !/ onclick=/.test(e4.innerHTML), 'třída z peněženky se očistí na [a-z-] (žádný vnořený atribut): „' + kl + '“');
  }

  console.log('\n── bez přihlášení (graceful) ──');
  {
    const { RPGCloud, client } = await loadCloud({ noUser: true });
    const lb = await RPGCloud.leaderboard('RPG_MAT_9');
    ok(Array.isArray(lb) && lb.length === 0, 'bez přihlášení → prázdné pole');
    ok(client._rpc.length === 0, 'bez přihlášení vůbec nevolá RPC');
  }

  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
