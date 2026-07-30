/* ══════════════════════════════════════════════════════════════════
   Test FÁZÍ 20 + 24 SQL proti SKUTEČNÉMU PostgreSQL — úkoly (assignments).

   Nález ze strojového ověřování: `assignment_progress()` zjišťovala „splněno"
   slepým castem `(s.data->'mastery'->mid->>'mastered')::boolean`. `s.data` je
   ŽÁKOVSKÝ save, a `::boolean` v PG vyhodí chybu na všem, co není platný
   boolean ⇒ jeden žák s `mastered:"lol"` (nebo prostě s poškozeným savem)
   shodil učiteli přehled splnění CELÉ třídě. Stejná rodina jako DoS na
   žebříčku z fáze 19, jen na booleanu.

   Test nejdřív díru REPRODUKUJE na definici z fáze 20 (bez fáze 24), pak
   spustí phase24.sql a dokáže, že je zavřená — plus proveze celý životní
   cyklus úkolu a jeho brány (po fázi 23).

   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const H = require('./sql-harness.cjs');

const P = f => path.join(__dirname, '..', 'projects', f);
const S1  = 'aaaaaaaa-0000-0000-0000-000000000001';   // žák se splněnou misí
const S2  = 'aaaaaaaa-0000-0000-0000-000000000002';   // žák bez splnění
const S3  = 'aaaaaaaa-0000-0000-0000-000000000003';   // žák z jiné třídy
const T   = 'aaaaaaaa-0000-0000-0000-0000000000ff';   // učitel
const CLS = '11111111-1111-1111-1111-111111111111';
const CL2 = '22222222-2222-2222-2222-222222222222';

let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c) { console.log('  ✅ '+n); pass++; } else { console.log('  ❌ '+n+(d?' — '+d:'')); fail++; } };

const STUBS = `
create schema if not exists auth;
create table auth.users(id uuid primary key, email text);
insert into auth.users values ('${S1}','zak1@husovaliberec.cz'),('${S2}','zak2@husovaliberec.cz'),
                              ('${S3}','zak3@husovaliberec.cz'),('${T}','ucitel@husovaliberec.cz');
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), '')) $$;
create role anon; create role authenticated;
create table public.roles(email text primary key, role text);
insert into public.roles values ('ucitel@husovaliberec.cz','teacher');
create table public.classes(id uuid primary key, name text);
insert into public.classes values ('${CLS}','9.B'), ('${CL2}','8.A');
create table public.class_members(class_id uuid, user_id uuid);
insert into public.class_members values ('${CLS}','${S1}'),('${CLS}','${S2}'),('${CL2}','${S3}');
create table public.saves(user_id uuid, game text, name text, full_name text, data jsonb);
insert into public.saves values
  ('${S1}','RPG_MAT_9','Anička',null,'{"mastery":{"2-3":{"mastered":true},"1-1":{"mastered":false}}}'),
  ('${S2}','RPG_MAT_9',null,'Bořek Dvořák','{"mastery":{"1-1":{"mastered":true}}}'),
  ('${S3}','RPG_MAT_9','Cizí',null,'{}');
`;

const asTeacher = (sql) => `set test.uid='${T}'; set test.email='ucitel@husovaliberec.cz'; ` + sql;
const asStudent = (uid, sql) => `set test.uid='${uid}'; set test.email='zak1@husovaliberec.cz'; ` + sql;

(function main(){
  console.log('\n── Fáze 20+24 SQL: úkoly (assignments) proti skutečnému PostgreSQL ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: '+why+'\n'); process.exit(0); }

  try {
    H.start('pgtest24');
    H.exec(STUBS);
    // fáze 23 = my_role() bez NULL (jinak by staff brány byly děravé)
    for (const f of ['rpg-cloud-setup-phase23.sql', 'rpg-cloud-setup-phase20.sql']) {
      let good = true, err = '';
      try { H.file(P(f)); } catch (e) { good = false; err = String(e.stderr||e.message||e).slice(0,180); }
      ok(f.replace('rpg-cloud-setup-','')+' se spustí bez chyby', good, err);
      if (!good) return;
    }

    // ── 1) životní cyklus úkolu ──
    ok('nepřihlášený nemůže zadat úkol',
      /not logged in/.test(H.expectFail(`select public.create_assignment('${CLS}','RPG_MAT_9','2-3',null)`)||''));
    ok('žák NESMÍ zadat úkol (po fázi 23)',
      /forbidden/.test(H.expectFail(asStudent(S1, `select public.create_assignment('${CLS}','RPG_MAT_9','2-3',null)`))||''));
    const aid = H.q(asTeacher(`select public.create_assignment('${CLS}','RPG_MAT_9','2-3', current_date + 7)`));
    ok('učitel zadá úkol a dostane id', /^[0-9a-f-]{36}$/.test(aid), aid);
    ok('úkol nese e-mail učitele (created_by)',
      H.q(`select created_by from public.assignments where id='${aid}'`)==='ucitel@husovaliberec.cz');
    ok('prázdná mise je odmítnuta',
      /invalid input/.test(H.expectFail(asTeacher(`select public.create_assignment('${CLS}','RPG_MAT_9','',null)`))||''));
    ok('chybějící třída je odmítnuta',
      /invalid input/.test(H.expectFail(asTeacher(`select public.create_assignment(null,'RPG_MAT_9','2-3',null)`))||''));
    ok('učitel vidí úkol v seznamu s názvem třídy',
      H.rows(asTeacher(`select class_name, game, mission_id from public.list_assignments()`))
        .some(r=>r[0]==='9.B' && r[2]==='2-3'));
    ok('žák seznam úkolů (učitelský) NEvidí',
      H.q(asStudent(S1, `select count(*) from public.list_assignments()`))==='0');

    // ── 2) „moje úkoly" u žáka ──
    ok('žák z té třídy vidí svůj úkol',
      H.rows(asStudent(S1, `select mission_id, class_name from public.my_assignments()`)).some(r=>r[0]==='2-3'));
    ok('žák z JINÉ třídy úkol nevidí',
      H.q(`set test.uid='${S3}'; select count(*) from public.my_assignments()`)==='0');
    ok('nepřihlášený nevidí žádné úkoly',
      H.q(`select count(*) from public.my_assignments()`)==='0');

    // ── 3) přehled splnění (před opravou) ──
    let prog = H.rows(asTeacher(`select display_name, mastered from public.assignment_progress('${aid}')`));
    ok('přehled splnění: 2 žáci třídy', prog.length===2, JSON.stringify(prog));
    ok('splněno u žáka s mastered:true', (prog.find(r=>r[0]==='Anička')||[])[1]==='t', JSON.stringify(prog));
    ok('nesplněno u žáka bez té mise', (prog.find(r=>r[0]==='Bořek Dvořák')||[])[1]==='f', JSON.stringify(prog));
    ok('žák přehled splnění nevidí',
      H.q(asStudent(S1, `select count(*) from public.assignment_progress('${aid}')`))==='0');

    // ── 4) REPRODUKCE DoS na PŮVODNÍ definici z fáze 20 (před opravou) ──
    // Fáze 20 je už v repu opravená, takže děravou verzi nainstalujeme
    // explicitně — ať je vidět, že nález byl pravý, ne domněnka.
    H.exec(`create or replace function public.assignment_progress(p_id uuid)
      returns table (display_name text, mastered boolean)
      language sql stable security definer set search_path = public as $ORIG$
        select
          coalesce(nullif(s.name, ''), nullif(s.full_name, ''), 'Hráč') as display_name,
          coalesce((s.data -> 'mastery' -> a.mission_id ->> 'mastered')::boolean, false) as mastered
        from public.assignments a
        join public.class_members cm on cm.class_id = a.class_id
        left join public.saves s on s.user_id = cm.user_id and s.game = a.game
        where a.id = p_id and (select my_role()) in ('teacher', 'superadmin')
        order by mastered desc, display_name asc;
      $ORIG$;`);
    H.exec(`update public.saves set data='{"mastery":{"2-3":{"mastered":"lol"}}}'::jsonb where user_id='${S2}'`);
    const dos = H.expectFail(asTeacher(`select count(*) from public.assignment_progress('${aid}')`));
    ok('DÍRA: podvržený „mastered" SHODÍ přehled splnění celé třídě',
      /invalid input syntax for type boolean/.test(dos||''), String(dos).slice(0,90));

    // ── 5) oprava fází 24 ──
    let applied = true, err2 = '';
    try { H.file(P('rpg-cloud-setup-phase24.sql')); } catch (e) { applied = false; err2 = String(e.stderr||e.message||e).slice(0,180); }
    ok('phase24.sql se spustí bez chyby', applied, err2);
    if (!applied) return;

    let after = null;
    try { after = H.rows(asTeacher(`select display_name, mastered from public.assignment_progress('${aid}')`)); }
    catch (e) { after = null; }
    ok('ZAVŘENO: přehled se zobrazí i s podvrženým savem', !!after && after.length===2, JSON.stringify(after));
    ok('podvržená hodnota se čte jako NEsplněno', !!after && (after.find(r=>r[0]==='Bořek Dvořák')||[])[1]==='f', JSON.stringify(after));
    ok('poctivé splnění se pořád čte správně', !!after && (after.find(r=>r[0]==='Anička')||[])[1]==='t', JSON.stringify(after));

    // ── 6) _jsonb_true: nikdy nespadne, chová se rozumně ──
    const cases = [
      ['true', 't', 'JSON boolean true'], ['false', 'f', 'JSON boolean false'],
      ['"true"', 't', 'string "true"'], ['"lol"', 'f', 'string "lol"'],
      ['"yes"', 't', 'string "yes"'], ['1', 't', 'číslo 1'], ['0', 'f', 'číslo 0'],
      ['null', 'f', 'JSON null'], ['{}', 'f', 'objekt'], ['[]', 'f', 'pole'],
      ['"1e9"', 'f', 'string "1e9"'], ['"  "', 'f', 'mezery'],
    ];
    let allOk = true, det = '';
    for (const [json, want, label] of cases) {
      let got;
      try { got = H.q(`select public._jsonb_true('${json}'::jsonb)`); }
      catch (e) { got = 'CHYBA'; }
      if (got !== want) { allOk = false; det += label+':'+got+' '; }
    }
    ok('_jsonb_true: 12 variant (vč. podvržených) nikdy nespadne a vrací správně', allOk, det);
    ok('_jsonb_true na SQL NULL → false', H.q(`select public._jsonb_true(null)`)==='f');

    // ── 7) mazání úkolu ──
    ok('žák NESMÍ smazat úkol',
      /forbidden/.test(H.expectFail(asStudent(S1, `select public.delete_assignment('${aid}')`))||''));
    ok('úkol po pokusu žáka pořád existuje', H.q(`select count(*) from public.assignments where id='${aid}'`)==='1');
    H.q(asTeacher(`select public.delete_assignment('${aid}')`));
    ok('učitel úkol smaže', H.q(`select count(*) from public.assignments where id='${aid}'`)==='0');

    // ── 8) tabulka a práva ──
    ok('assignments má zapnutou RLS bez politik (vše jen přes RPC)',
      H.q(`select relrowsecurity from pg_class where relname='assignments'`)==='t' &&
      H.q(`select count(*) from pg_policies where tablename='assignments'`)==='0');
    for (const [label, sig] of [['create_assignment','public.create_assignment(uuid,text,text,date)'],
                                ['list_assignments','public.list_assignments()'],
                                ['delete_assignment','public.delete_assignment(uuid)'],
                                ['assignment_progress','public.assignment_progress(uuid)'],
                                ['my_assignments','public.my_assignments()']]) {
      ok('anon NEMÁ execute na '+label, H.q(`select has_function_privilege('anon','${sig}','execute')`)==='f');
    }

    // ── 9) zdrojové soubory: re-run fáze nesmí vady vrátit ──
    const p20 = fs.readFileSync(P('rpg-cloud-setup-phase20.sql'), 'utf8');
    ok('phase20.sql už NEobsahuje slepý ::boolean na mastery (re-run vadu nevrátí)',
      !/->>\s*'mastered'\s*\)\s*::boolean/.test(p20) && /_jsonb_true/.test(p20));
    const p4 = fs.readFileSync(P('rpg-cloud-setup-phase4.sql'), 'utf8');
    ok('phase4.sql má bezpečný cast xp/level (re-run nevrátí DoS z fáze 19)',
      /~ '\^\[0-9\]\{1,15\}\$'/.test(p4) && !/coalesce\(\(s\.data->>'xp'\)::int, 0\)/.test(p4));

    // ── 10) idempotence ──
    let again = true; try { H.file(P('rpg-cloud-setup-phase24.sql')); } catch (e) { again = false; }
    ok('phase24.sql jde spustit znovu', again);
  } catch (e) {
    ok('test proběhl bez neočekávané výjimky', false, String(e.stderr||e.message||e).slice(0,300));
  } finally {
    H.stop();
  }
  console.log('\n══════════════════════════════════════════');
  console.log('  VÝSLEDEK: '+pass+' ✅ / '+fail+' ❌');
  console.log('══════════════════════════════════════════');
  process.exit(fail?1:0);
})();
