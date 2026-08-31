/* ══════════════════════════════════════════════════════════════════
   Test: „Skrýt učitele" v konzoli nefunguje BĚŽNÉMU UČITELI.

   Hlášeno z praxe (nová kolegyně-učitelka): zaškrtnuté „Skrýt učitele"
   nic neskryje. Příčina je DVOJÍ a obě vrstvy selhávají TIŠE:

     1) `RPGCloud.listRoles()` má klientskou pojistku
        `if (!client || !isAdmin()) return []` — učitel dostane prázdno.
     2) I bez ní by to nešlo: RLS `roles_select` (fáze 2) pouští čtení
        VŠECH řádků jen superadminovi, ostatní vidí pouze SVŮJ řádek.
        Učitel by tedy skryl leda sám sebe.

   Konzole z toho staví `STAFF_EMAILS` a filtr `hideStaff` pak nemá co
   skrývat. Chyba nikde nevyskočí — `catch` nastaví prázdnou množinu.

   Fáze 26 přidává `public.staff_emails()`: SECURITY DEFINER funkce, která
   vrátí POUZE seznam e-mailů personálu (bez rolí a bez „kdo koho přidal")
   komukoli ze staff. Test nejdřív reprodukuje díru, pak dokazuje opravu.

   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const H = require('./sql-harness.cjs');
const P = f => path.join(__dirname, '..', 'projects', f);

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

const why = H.unavailable();
if (why) { console.log('⏭ SKIP — ' + why); process.exit(0); }

const STUBS = `
create schema if not exists auth;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', coalesce(current_setting('test.email', true), '')) $$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;
create role anon; create role authenticated;
-- minimální stub tabulky saves (fáze 2 na ni věší politiky)
create table public.saves(user_id uuid, game text, data jsonb default '{}'::jsonb,
  name text default '', email text default '', full_name text default '',
  updated_at timestamptz default now(), primary key (user_id, game));
alter table public.saves enable row level security;
`;
const jako = (email, role) => `set test.email='${email}'; set test.role='${role}';`;

const SPRAVCE = 'spravce@husovaliberec.cz';
const UCITELKA = 'kolegyne@husovaliberec.cz';
const ZAK = 'zak@husovaliberec.cz';

try {
  H.start('pgstaff');
  H.exec(STUBS);
  H.file(P('rpg-cloud-setup-phase2.sql'));
  H.file(P('rpg-cloud-setup-phase23.sql'));   // my_role() nikdy NULL
  H.exec(`insert into public.roles(email, role) values
            ('${SPRAVCE}','superadmin'), ('${UCITELKA}','teacher')
          on conflict (email) do update set role = excluded.role;`);

  /* ── 1) REPRODUKCE: učitelka v tabulce roles vidí jen sebe ── */
  H.exec(`grant select on public.roles to authenticated;`);
  const jakoUcitelka = sql => H.q(`${jako(UCITELKA, 'teacher')} set role authenticated; ${sql}`);
  const jakoSpravce = sql => H.q(`${jako(SPRAVCE, 'superadmin')} set role authenticated; ${sql}`);

  // fáze 2 si do roles zakládá i Vojtův vlastní účet, proto se počet čte
  const vsechRolí = H.q(`select count(*) from public.roles`);
  const videnoUcitelkou = jakoUcitelka(`select count(*) from public.roles`);
  const videnoSpravcem = jakoSpravce(`select count(*) from public.roles`);
  ok('REPRODUKCE: superadmin vidí v roles všechny záznamy', videnoSpravcem === vsechRolí,
     'vidí ' + videnoSpravcem + ' z ' + vsechRolí);
  ok('REPRODUKCE: učitelka vidí v roles jen SEBE (proto nemá co skrýt)',
     videnoUcitelkou === '1', 'vidí ' + videnoUcitelkou);

  /* ── 2) OPRAVA: fáze 26 ── */
  H.file(P('rpg-cloud-setup-phase26.sql'));

  const seznam = r => H.rows(`${jako(r === 'superadmin' ? SPRAVCE : r === 'teacher' ? UCITELKA : ZAK, r)} set role authenticated;
                              select email from public.staff_emails() order by 1`).map(x => x[0]);

  const uc = seznam('teacher');
  ok('učitelka dostane e-maily VŠECH ze staff',
     uc.length === Number(vsechRolí) && uc.includes(SPRAVCE) && uc.includes(UCITELKA), JSON.stringify(uc));
  const sp = seznam('superadmin');
  ok('superadmin dostane totéž', sp.join(',') === uc.join(','), JSON.stringify(sp));

  /* ── 3) Soukromí a brána ── */
  const zakChyba = H.expectFail(`${jako(ZAK, 'student')} set role authenticated; select * from public.staff_emails()`);
  ok('ŽÁK funkci zavolat nesmí', !!zakChyba && /forbidden|permission/i.test(zakChyba), String(zakChyba).slice(0, 90));

  const vraci = H.q(`select pg_get_function_result('public.staff_emails'::regproc)`);
  ok('vrací jen e-mail, ne roli ani „kdo přidal"', /email/.test(vraci) && !/role/.test(vraci), vraci);

  const anon = H.q(`select has_function_privilege('anon','public.staff_emails()','execute')`);
  ok('anon nemá execute', anon === 'f', anon);
  const auth = H.q(`select has_function_privilege('authenticated','public.staff_emails()','execute')`);
  ok('authenticated MÁ execute (volá se přímo z klienta)', auth === 't', auth);
  const pub = H.q(`select has_function_privilege('public','public.staff_emails()','execute')`);
  ok('public nemá execute', pub === 'f', pub);

  /* ── 4) Idempotence ── */
  H.file(P('rpg-cloud-setup-phase26.sql'));
  ok('fáze 26 jde spustit dvakrát', seznam('teacher').length === Number(vsechRolí));

  /* ── 5) NULL role díru neotevře (vzor z fáze 23) ── */
  const bezRole = H.expectFail(`set test.email=''; set test.role=''; set role authenticated;
                                select * from public.staff_emails()`);
  ok('nepřihlášený/neznámý taky nesmí', !!bezRole, String(bezRole).slice(0, 60));

} catch (e) {
  console.log('  ❌ výjimka: ' + (e.stderr || e.message));
  fail++;
} finally { H.stop(); }

console.log(`\n  Staff e-maily (fáze 26): ${pass} ✅ / ${fail} ❌`);
process.exit(fail ? 1 : 0);
