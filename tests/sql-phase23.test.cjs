/* ══════════════════════════════════════════════════════════════════
   Test FÁZE 23 SQL — my_role() nesmí vracet NULL (privilege escalation).

   Nález ze strojového ověřování: staff gate má tvar
       if (select my_role()) not in ('teacher','superadmin') then raise …
   a `NULL not in (…)` je v SQL NULL, takže při NULL se `if` NESPLNÍ a brána
   se tiše otevře. `my_role()` z fáze 2 přitom vracelo NULL pro každého, kdo
   není v allowlistu `roles` — tedy pro KAŽDÉHO ŽÁKA.

   Test to dělá poctivě: nejdřív reprodukuje díru na STARÉ definici (aby bylo
   jasné, že nález je pravý a ne domněnka), pak spustí phase23.sql a ověří, že
   je zavřená u všech dotčených vzorů. Používá skutečné produkční definice
   z rpg-cloud-setup-phase2.sql / phase23.sql, ne jejich opisy.

   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');

const P = f => path.join(__dirname, '..', 'projects', f);
const STUDENT = 'aaaaaaaa-0000-0000-0000-000000000001';
const TEACHER = 'aaaaaaaa-0000-0000-0000-0000000000ff';

let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c) { console.log('  ✅ '+n); pass++; } else { console.log('  ❌ '+n+(d?' — '+d:'')); fail++; } };

// auth.jwt() vrací e-mail dle GUC → můžeme přepínat „kdo se ptá"
const STUBS = `
create schema if not exists auth;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), '')) $$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;
create role anon; create role authenticated;
create table public.roles(email text primary key, role text);
insert into public.roles values ('ucitel@husovaliberec.cz','teacher');
-- žák@… v tabulce ROLES SCHVÁLNĚ NENÍ (tak to je i v praxi)
`;

// Stará (děravá) definice — přesně jak byla ve fázi 2 před opravou.
const OLD_MY_ROLE = `
create or replace function public.my_role() returns text
language sql security definer stable set search_path = public as $$
  select role from public.roles
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1;
$$;`;

// Zástupná staff-only funkce se STEJNÝM vzorem brány jako fáze 7/11/12/15/18/20.
const GUARDED = `
create table if not exists public.hall(x int);
create or replace function public.staff_only_action() returns text
language plpgsql security definer set search_path = public as $$
begin
  if (select my_role()) not in ('teacher', 'superadmin') then
    raise exception 'forbidden';
  end if;
  insert into public.hall values (1);
  return 'provedeno';
end $$;`;

const asStudent = (sql) => `set test.uid='${STUDENT}'; set test.email='zak@husovaliberec.cz'; ` + sql;
const asTeacher = (sql) => `set test.uid='${TEACHER}'; set test.email='ucitel@husovaliberec.cz'; ` + sql;

(function main(){
  console.log('\n── Fáze 23 SQL: my_role() nesmí vracet NULL (privilege escalation) ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: '+why+'\n'); process.exit(0); }

  try {
    H.start('pgtest23');
    H.exec(STUBS);
    H.exec(GUARDED);

    // ── 1) reprodukce nálezu na STARÉ definici ──
    H.exec(OLD_MY_ROLE);
    ok('stará definice: učiteli vrátí „teacher"', H.q(asTeacher(`select public.my_role()`))==='teacher');
    ok('stará definice: ŽÁKOVI vrátí prázdno (NULL) — příčina díry',
      H.q(asStudent(`select coalesce(public.my_role(),'<NULL>')`))==='<NULL>');
    ok('SQL past potvrzena: NULL not in (…) je NULL, ne TRUE',
      H.q(`select coalesce((null not in ('teacher','superadmin'))::text, '<NULL>')`)==='<NULL>');
    const holeErr = H.expectFail(asStudent(`select public.staff_only_action()`));
    ok('DÍRA: žák PROJDE staff-only branou (výjimka se nevyhodí)', holeErr===null,
      'dostali jsme chybu: '+String(holeErr).slice(0,80));
    ok('a jeho zápis se skutečně provedl', H.q(`select count(*) from public.hall`)==='1');

    // ── 2) oprava: skutečný phase23.sql ──
    H.exec(`delete from public.hall`);
    let applied = true, err = '';
    try { H.file(P('rpg-cloud-setup-phase23.sql')); } catch (e) { applied = false; err = String(e.stderr||e.message||e).slice(0,180); }
    ok('phase23.sql se spustí bez chyby', applied, err);
    if (!applied) return;

    ok('po opravě: žák má roli „student" (nikdy NULL)',
      H.q(asStudent(`select public.my_role()`))==='student');
    ok('po opravě: učitel má pořád „teacher"', H.q(asTeacher(`select public.my_role()`))==='teacher');
    ok('ZAVŘENO: žák dostane „forbidden"',
      /forbidden/.test(H.expectFail(asStudent(`select public.staff_only_action()`))||''));
    ok('a nic nezapsal', H.q(`select count(*) from public.hall`)==='0');
    ok('učitel projde dál normálně', H.q(asTeacher(`select public.staff_only_action()`))==='provedeno');
    ok('nepřihlášený (bez e-mailu) je taky „student" → forbidden',
      /forbidden/.test(H.expectFail(`select public.staff_only_action()`)||''));

    // ── 3) druhý vzor brány (`where my_role() in (…)`) opravou neoslabl ──
    H.exec(`create or replace function public.staff_only_rows() returns table(v int)
      language sql stable security definer set search_path = public as $$
        select 1 where public.my_role() in ('teacher','superadmin') $$;`);
    ok('where-in vzor: žák nevidí řádky (dřív i teď)',
      H.q(asStudent(`select count(*) from public.staff_only_rows()`))==='0');
    ok('where-in vzor: učitel řádky vidí',
      H.q(asTeacher(`select count(*) from public.staff_only_rows()`))==='1');

    // ── 4) superadmin projde a neznámá role ne ──
    H.exec(`insert into public.roles values ('admin@husovaliberec.cz','superadmin'),
                                            ('divny@husovaliberec.cz','kdovico')`);
    ok('superadmin projde',
      H.q(`set test.email='admin@husovaliberec.cz'; select public.staff_only_action()`)==='provedeno');
    ok('neznámá role neprojde',
      /forbidden/.test(H.expectFail(`set test.email='divny@husovaliberec.cz'; select public.staff_only_action()`)||''));

    // ── 5) fáze 2 je opravená u zdroje (opětovné spuštění díru neotevře) ──
    const p2 = require('fs').readFileSync(P('rpg-cloud-setup-phase2.sql'), 'utf8');
    const body = (p2.match(/create or replace function public\.my_role\(\)[\s\S]*?\$\$;/)||[''])[0];
    ok('phase2.sql má v my_role() coalesce na „student" (re-run díru neotevře)',
      /coalesce/.test(body) && /'student'/.test(body), body.slice(0,120));

    // ── 6) práva zůstala (interní helper) ──
    ok('anon NEMÁ execute na my_role()',
      H.q(`select has_function_privilege('anon','public.my_role()','execute')`)==='f');
    ok('authenticated NEMÁ execute na my_role() (volá se jen zevnitř)',
      H.q(`select has_function_privilege('authenticated','public.my_role()','execute')`)==='f');
    ok('my_role() je SECURITY DEFINER', H.q(`select prosecdef from pg_proc where proname='my_role'`)==='t');

    // ── 7) idempotence ──
    let again = true; try { H.file(P('rpg-cloud-setup-phase23.sql')); } catch (e) { again = false; }
    ok('phase23.sql jde spustit znovu', again);
    ok('a po opakování je brána pořád zavřená',
      /forbidden/.test(H.expectFail(asStudent(`select public.staff_only_action()`))||''));
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
