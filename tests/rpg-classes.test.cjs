/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 3: třídy + poznámky (rpg-cloud.js)
   Mockuje Supabase klienta, ověřuje správné tabulky/filtry a oprávnění.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
function ok(c, m){ if(c){pass++;console.log('  ✅ '+m);} else {fail++;console.log('  ❌ '+m);} }

const SELF = { id: 'u-self', email: 'vojtech.konopa@husovaliberec.cz', user_metadata: { full_name: 'Vojta K.' } };
const CLASSES_FX = [{ id: 'c1', name: '9.A', created_by: '', created_at: '2026-01-01' }];
const MEMBERS_FX = [{ class_id: 'c1', user_id: 'u-self', added_at: '2026-01-01' }];
const NOTES_FX   = [{ id: 'n1', student_id: 'u-zak', author_email: 'a@b', author_name: 'Uč', body: 'Výborně!', created_at: '2026-02-01' }];

function makeClient(role) {
  const calls = [];
  function builder(table) {
    const rec = { table, ops: [] };
    calls.push(rec);
    const b = {};
    const chain = name => (...a) => { rec.ops.push([name, a]); return b; };
    ['select','eq','order','insert','upsert','update','delete','neq','is'].forEach(m => b[m] = chain(m));
    function result() {
      if (table === 'roles') return { data: { role }, error: null };
      if (table === 'classes' && rec.ops.some(o=>o[0]==='insert')) return { data: { id: 'c-new' }, error: null };
      if (table === 'classes') return { data: CLASSES_FX, error: null };
      if (table === 'class_members') return { data: MEMBERS_FX, error: null };
      if (table === 'notes') return { data: NOTES_FX, error: null };
      return { data: null, error: null };
    }
    b.maybeSingle = () => { rec.ops.push(['maybeSingle',[]]); return Promise.resolve(result()); };
    b.single = () => { rec.ops.push(['single',[]]); return Promise.resolve(result()); };
    b.then = (res, rej) => Promise.resolve(result()).then(res, rej);
    return b;
  }
  return {
    _calls: calls,
    from: builder,
    auth: {
      getSession: async () => ({ data: { session: { user: SELF } } }),
      onAuthStateChange: () => {},
      signOut: async () => {},
    },
  };
}

async function loadCloud(role) {
  const client = makeClient(role);
  const sandbox = {
    window: { supabase: { createClient: () => client } },
    document: { addEventListener: () => {} },
    location: { search: '', href: 'http://x/', },
    console, setTimeout, clearTimeout,
    URLSearchParams,
    alert: () => {},
    Date,
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
  console.log('── superadmin: třídy ──');
  {
    const { RPGCloud, client } = await loadCloud('superadmin');
    ok(RPGCloud.isStaff() && RPGCloud.isAdmin(), 'role superadmin rozpoznána');

    const cls = await RPGCloud.listClasses();
    ok(Array.isArray(cls) && cls.length === 1 && cls[0].name === '9.A', 'listClasses čte tabulku classes');
    ok(client._calls.some(c=>c.table==='classes' && c.ops.some(o=>o[0]==='select')), 'listClasses → select z classes');

    const cr = await RPGCloud.createClass('7.B');
    ok(cr.ok && cr.id === 'c-new', 'createClass vrací nové id');
    const insCall = client._calls.find(c=>c.table==='classes' && c.ops.some(o=>o[0]==='insert'));
    ok(insCall && insCall.ops.find(o=>o[0]==='insert')[1][0].name === '7.B', 'createClass insertuje název do classes');

    const mem = await RPGCloud.listMemberships();
    ok(mem.length === 1 && mem[0].class_id === 'c1', 'listMemberships čte class_members');

    const add = await RPGCloud.addToClass('c1', 'u-zak');
    ok(add.ok, 'addToClass projde');
    const upCall = client._calls.find(c=>c.table==='class_members' && c.ops.some(o=>o[0]==='upsert'));
    ok(upCall && upCall.ops.find(o=>o[0]==='upsert')[1][0].user_id === 'u-zak', 'addToClass upsert do class_members se správným user_id');

    const rm = await RPGCloud.removeFromClass('c1', 'u-zak');
    ok(rm.ok, 'removeFromClass projde');
    ok(client._calls.some(c=>c.table==='class_members' && c.ops.some(o=>o[0]==='delete')), 'removeFromClass → delete z class_members');

    const cr2 = await RPGCloud.createClass('   ');
    ok(!cr2.ok, 'createClass odmítne prázdný název');
  }

  console.log('\n── superadmin: poznámky ──');
  {
    const { RPGCloud, client } = await loadCloud('superadmin');
    const notes = await RPGCloud.listNotesFor('u-zak');
    ok(notes.length === 1 && notes[0].body === 'Výborně!', 'listNotesFor čte notes');
    const sel = client._calls.find(c=>c.table==='notes' && c.ops.some(o=>o[0]==='select'));
    ok(sel && sel.ops.some(o=>o[0]==='eq' && o[1][0]==='student_id' && o[1][1]==='u-zak'), 'listNotesFor filtruje na student_id');

    const an = await RPGCloud.addNote('u-zak', 'Skvělá práce');
    ok(an.ok, 'addNote projde');
    const ins = client._calls.find(c=>c.table==='notes' && c.ops.some(o=>o[0]==='insert'));
    const payload = ins.ops.find(o=>o[0]==='insert')[1][0];
    ok(payload.student_id==='u-zak' && payload.body==='Skvělá práce' && payload.author_email===SELF.email, 'addNote vkládá student_id, body i autora');

    const an2 = await RPGCloud.addNote('u-zak', '   ');
    ok(!an2.ok, 'addNote odmítne prázdný text');

    const del = await RPGCloud.deleteNote('n1');
    ok(del.ok && client._calls.some(c=>c.table==='notes' && c.ops.some(o=>o[0]==='delete')), 'deleteNote → delete z notes');

    const mine = await RPGCloud.pullMyNotes();
    ok(Array.isArray(mine), 'pullMyNotes vrací pole');
    const selfSel = client._calls.find(c=>c.table==='notes' && c.ops.some(o=>o[0]==='eq' && o[1][0]==='student_id' && o[1][1]===SELF.id));
    ok(!!selfSel, 'pullMyNotes filtruje na vlastní user_id (RLS pustí jen vlastní)');
  }

  console.log('\n── učitel (teacher): práva ──');
  {
    const { RPGCloud } = await loadCloud('teacher');
    ok(RPGCloud.isStaff() && !RPGCloud.isAdmin(), 'teacher je staff, ne admin');
    const cr = await RPGCloud.createClass('8.C');
    ok(cr.ok, 'teacher SMÍ zakládat třídy');
    const an = await RPGCloud.addNote('u-zak', 'pozn');
    ok(an.ok, 'teacher SMÍ psát poznámky');
  }

  console.log('\n── žák (student): zákazy ──');
  {
    const { RPGCloud, client } = await loadCloud('student');
    ok(!RPGCloud.isStaff(), 'student není staff');
    const cls = await RPGCloud.listClasses();
    ok(cls.length === 0, 'student listClasses → prázdné (gate)');
    const cr = await RPGCloud.createClass('hack');
    ok(!cr.ok, 'student NESMÍ zakládat třídy');
    const an = await RPGCloud.addNote('u-jiny', 'hack');
    ok(!an.ok, 'student NESMÍ psát poznámky');
    ok(!client._calls.some(c=>c.table==='classes' && c.ops.some(o=>o[0]==='insert')), 'student vůbec nesahá na insert do classes');
    // ale své vlastní vzkazy si přečíst smí
    const mine = await RPGCloud.pullMyNotes();
    ok(Array.isArray(mine) && mine.length === 1, 'student pullMyNotes SMÍ (vlastní vzkazy)');
  }

  console.log('\n══════════════════════════════════════════');
  console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
  console.log('══════════════════════════════════════════');
  process.exit(fail ? 1 : 0);
})();
