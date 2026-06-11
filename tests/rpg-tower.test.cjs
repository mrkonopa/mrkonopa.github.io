/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 11: věž legend (rpg-cloud.js towerEligible/Submit/Board/
   Hall/CloseSeason). Mock Supabase klient — ověřuje RPC parametry,
   staff-gate u uzavření sezóny a graceful chování bez přihlášení.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
function ok(c, m){ if(c){pass++;console.log('  ✅ '+m);} else {fail++;console.log('  ❌ '+m);} }

const SELF = { id: 'u-self', email: 'zak@husovaliberec.cz', user_metadata: { full_name: 'Žák Věžový' } };
const BOARD_FX = [
  { display_name: 'Anna', best_floor: 14, is_me: false },
  { display_name: 'Žák Věžový', best_floor: 9, is_me: true },
];
const HALL_FX = [
  { season: '2025/26', rank: 1, display_name: 'Legenda', best_floor: 31 },
];

function makeClient(opts) {
  opts = opts || {};
  const calls = { rpcs: [] };
  return {
    _calls: calls,
    from: (table) => {
      const b = {};
      ['select','eq','order','insert','update','delete','upsert','in','is','limit','range']
        .forEach(m => b[m] = () => b);
      const res = () => {
        if (table === 'roles') return { data: { role: opts.role || 'student' }, error: null };
        return { data: null, error: null };
      };
      b.maybeSingle = () => Promise.resolve(res());
      b.single = () => Promise.resolve(res());
      b.then = (r, j) => Promise.resolve(res()).then(r, j);
      return b;
    },
    rpc: (fn, args) => {
      calls.rpcs.push({ fn, args });
      if (fn === 'tower_eligible') return Promise.resolve({ data: opts.eligible !== false, error: null });
      if (fn === 'tower_submit')   return Promise.resolve(opts.submitError
        ? { data: null, error: { message: opts.submitError } }
        : { data: 14, error: null });
      if (fn === 'tower_board')    return Promise.resolve({ data: BOARD_FX, error: null });
      if (fn === 'tower_hall_of_fame') return Promise.resolve({ data: HALL_FX, error: null });
      if (fn === 'tower_close_season') return Promise.resolve({ data: 10, error: null });
      return Promise.resolve({ data: [], error: null });
    },
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
  console.log('\n── Fáze 11: věž legend ──\n');

  console.log('── exporty ──');
  {
    const { RPGCloud } = await loadCloud();
    ['towerEligible','towerSubmit','towerBoard','towerHall','towerCloseSeason']
      .forEach(f => ok(typeof RPGCloud[f] === 'function', f + '() je exportováno'));
  }

  console.log('\n── přihlášený žák 9. ročníku ──');
  {
    const { RPGCloud, client } = await loadCloud({ eligible: true });
    const el = await RPGCloud.towerEligible('RPG_MAT_9');
    ok(el === true, 'towerEligible → true');
    const r1 = client._calls.rpcs.find(r => r.fn === 'tower_eligible');
    ok(r1 && r1.args.p_game === 'RPG_MAT_9', 'tower_eligible dostane p_game');

    const sub = await RPGCloud.towerSubmit('RPG_MAT_9', 14.4);
    ok(sub.ok === true && sub.best === 14, 'towerSubmit → {ok:true, best}');
    const r2 = client._calls.rpcs.find(r => r.fn === 'tower_submit');
    ok(r2 && r2.args.p_floor === 14, 'patro se zaokrouhluje na celé číslo');

    const neg = await RPGCloud.towerSubmit('RPG_MAT_9', -3);
    ok(neg.ok === true, 'záporné patro neodmítne klient…');
    const r3 = client._calls.rpcs.filter(r => r.fn === 'tower_submit')[1];
    ok(r3 && r3.args.p_floor === 0, '…ale pošle 0 (server navíc validuje)');

    const board = await RPGCloud.towerBoard('RPG_MAT_9');
    ok(board.length === 2 && board[1].is_me === true, 'towerBoard vrací řádky s is_me');
    const hall = await RPGCloud.towerHall('RPG_MAT_9');
    ok(hall.length === 1 && hall[0].season === '2025/26', 'towerHall vrací síň slávy');
  }

  console.log('\n── žák špatného ročníku ──');
  {
    const { RPGCloud } = await loadCloud({ eligible: false });
    const el = await RPGCloud.towerEligible('RPG_MAT_9');
    ok(el === false, 'towerEligible → false (server řekl ne)');
  }

  console.log('\n── chyba serveru při zápisu ──');
  {
    const { RPGCloud } = await loadCloud({ submitError: 'wrong grade' });
    const sub = await RPGCloud.towerSubmit('RPG_MAT_9', 5);
    ok(sub.ok === false && /wrong grade/.test(sub.error), 'towerSubmit propaguje chybu serveru');
  }

  console.log('\n── uzavření sezóny: staff-gate ──');
  {
    const { RPGCloud, client } = await loadCloud({ role: 'student' });
    const r = await RPGCloud.towerCloseSeason('RPG_MAT_9');
    ok(r.ok === false, 'žák nemůže uzavřít sezónu');
    ok(!client._calls.rpcs.some(c => c.fn === 'tower_close_season'), 'žák RPC vůbec nevolá');
  }
  {
    const { RPGCloud, client } = await loadCloud({ role: 'teacher' });
    const r = await RPGCloud.towerCloseSeason('RPG_MAT_9');
    ok(r.ok === true && r.count === 10, 'učitel uzavře sezónu (počet zapsaných)');
    const c = client._calls.rpcs.find(c => c.fn === 'tower_close_season');
    ok(c && c.args.p_game === 'RPG_MAT_9', 'tower_close_season dostane p_game');
  }

  console.log('\n── bez přihlášení (graceful) ──');
  {
    const { RPGCloud, client } = await loadCloud({ noUser: true });
    ok(await RPGCloud.towerEligible('RPG_MAT_9') === false, 'towerEligible → false');
    ok((await RPGCloud.towerSubmit('RPG_MAT_9', 5)).ok === false, 'towerSubmit → {ok:false}');
    ok((await RPGCloud.towerBoard('RPG_MAT_9')).length === 0, 'towerBoard → []');
    ok((await RPGCloud.towerHall('RPG_MAT_9')).length === 0, 'towerHall → []');
    ok(client._calls.rpcs.length === 0, 'žádné RPC bez přihlášení');
  }

  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
