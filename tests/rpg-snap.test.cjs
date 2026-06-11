/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 6b: errsSnap → snap_events (rpg-cloud.js pushErrsSnap/getErrsSnaps)
   Mock Supabase klient — ověřuje upsert s onConflict (idempotence),
   mapování řádků, staff-gate u čtení a graceful chování bez přihlášení.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
function ok(c, m){ if(c){pass++;console.log('  ✅ '+m);} else {fail++;console.log('  ❌ '+m);} }

const SELF = { id: 'u-self', email: 'zak@husovaliberec.cz', user_metadata: { full_name: 'Žák Testovací' } };
const SNAP_FX = [
  { user_id:'u-a', snapped_at:'2026-05-01', errs:{'1-1':3} },
  { user_id:'u-a', snapped_at:'2026-05-08', errs:{'1-1':5,'2-1':1} },
];

function makeClient(opts) {
  opts = opts || {};
  const calls = { upserts: [], selects: [] };
  function builder(table) {
    const b = { _table: table, _filters: [], _order: null };
    b.select = (cols) => { b._select = cols; return b; };
    b.eq = (k, v) => { b._filters.push([k, v]); return b; };
    b.order = (col, o) => { b._order = { col, asc: o && o.ascending }; return b; };
    b.upsert = (rows, o) => { calls.upserts.push({ table, rows, opts: o }); return b; };
    ['insert','update','delete','neq','in'].forEach(m => b[m] = () => b);
    const res = () => {
      if (b._select !== undefined && table === 'snap_events') {
        calls.selects.push({ table, select: b._select, filters: b._filters, order: b._order });
        return { data: SNAP_FX, error: null };
      }
      if (table === 'roles') return { data: { role: opts.role || 'student' }, error: null };
      return { data: null, error: null };
    };
    b.maybeSingle = () => Promise.resolve(res());
    b.single = () => Promise.resolve(res());
    b.then = (r, j) => Promise.resolve(res()).then(r, j);
    return b;
  }
  return {
    _calls: calls,
    from: builder,
    rpc: () => Promise.resolve({ data: [], error: null }),
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
    document: { addEventListener: () => {}, getElementById: () => null },
    location: { search: '', href: 'http://x/' },
    console, setTimeout, clearTimeout, URLSearchParams, alert: () => {}, Date,
  };
  sandbox.window.location = sandbox.location;
  vm.createContext(sandbox);
  const code = fs.readFileSync(path.join(__dirname, '..', 'projects', 'rpg-cloud.js'), 'utf8');
  vm.runInContext(code, sandbox);
  const RPGCloud = sandbox.window.RPGCloud;
  await RPGCloud.init();
  return { RPGCloud, client };
}

(async () => {
  console.log('\n── Fáze 6b: snímky chybovosti → SQL ──\n');

  console.log('── přihlášený žák: pushErrsSnap ──');
  {
    const { RPGCloud, client } = await loadCloud();
    ok(typeof RPGCloud.pushErrsSnap === 'function', 'pushErrsSnap() je exportováno');
    ok(typeof RPGCloud.getErrsSnaps === 'function', 'getErrsSnaps() je exportováno');

    const pushed = await RPGCloud.pushErrsSnap('RPG_MAT_9', [
      { t: '2026-06-01', errs: { '1-1': 2 } },
      { t: '2026-06-08', errs: { '1-1': 4, '3-2': 1 } },
      { t: null, errs: { x: 1 } },          // chybí datum → vyhodit
      { t: '2026-06-09', errs: 'nope' },    // errs není objekt → vyhodit
    ]);
    ok(pushed === true, 'úspěšný push vrací true (hra smí nastavit snapsMigrated)');
    ok(client._calls.upserts.length === 1, 'volá přesně 1 upsert');
    const u = client._calls.upserts[0];
    ok(u.table === 'snap_events', 'cílí na tabulku snap_events');
    ok(u.rows.length === 2, 'nevalidní snímky vyfiltrovány (2 ze 4)');
    ok(u.rows.every(r => r.user_id === 'u-self' && r.game === 'RPG_MAT_9'), 'řádky mají user_id + game');
    ok(u.rows[0].snapped_at === '2026-06-01' && JSON.stringify(u.rows[1].errs) === '{"1-1":4,"3-2":1}', 'mapování t→snapped_at, errs→errs');
    ok(u.opts && u.opts.onConflict === 'user_id,game,snapped_at', 'onConflict = user_id,game,snapped_at (idempotence)');
    ok(u.opts.ignoreDuplicates === true, 'ignoreDuplicates = true (re-upload neškodí)');

    const e1 = await RPGCloud.pushErrsSnap('RPG_MAT_9', []);
    const e2 = await RPGCloud.pushErrsSnap('RPG_MAT_9', null);
    ok(client._calls.upserts.length === 1, 'prázdný/null seznam → žádný další upsert');
    ok(e1 === false && e2 === false, 'prázdný/null seznam → vrací false');
  }

  console.log('\n── žák: getErrsSnaps zamčeno ──');
  {
    const { RPGCloud, client } = await loadCloud({ role: 'student' });
    const rows = await RPGCloud.getErrsSnaps('RPG_MAT_9');
    ok(Array.isArray(rows) && rows.length === 0, 'žák (ne-staff) → prázdné pole');
    ok(client._calls.selects.length === 0, 'žák vůbec nečte snap_events');
  }

  console.log('\n── učitel: getErrsSnaps ──');
  {
    const { RPGCloud, client } = await loadCloud({ role: 'teacher' });
    const rows = await RPGCloud.getErrsSnaps('RPG_MAT_6');
    ok(rows.length === 2, 'učitel dostane řádky');
    const s = client._calls.selects[0];
    ok(s.filters.some(f => f[0] === 'game' && f[1] === 'RPG_MAT_6'), 'filtruje podle game');
    ok(s.order && s.order.col === 'snapped_at' && s.order.asc === true, 'řadí vzestupně podle snapped_at');
    ok(/user_id/.test(s.select) && /snapped_at/.test(s.select) && /errs/.test(s.select), 'čte user_id, snapped_at, errs');
  }

  console.log('\n── bez přihlášení (graceful) ──');
  {
    const { RPGCloud, client } = await loadCloud({ noUser: true });
    const p = await RPGCloud.pushErrsSnap('RPG_MAT_9', [{ t: '2026-06-01', errs: {} }]);
    ok(client._calls.upserts.length === 0, 'bez přihlášení žádný upsert');
    ok(p === false, 'bez přihlášení vrací false (snapsMigrated se nenastaví)');
    const rows = await RPGCloud.getErrsSnaps('RPG_MAT_9');
    ok(rows.length === 0, 'bez přihlášení getErrsSnaps → prázdné pole');
  }

  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
