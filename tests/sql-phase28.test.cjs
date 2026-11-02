/* ═════════════════════════════════════════════════════════════════
   Test FÁZE 28 SQL proti SKUTEČNÉMU PostgreSQL — spolužáci uvidí můj vzhled z obchodu.

   `look_of(p_ids uuid[])` vrací z peněženek (`saves`, game = '_wallet') jen rámeček, barvu jména, titul a mazlíčka.
   Peněženku si píše žák sám, takže se hlídá:
     1. kdo koho vidí: já, spolužáci ze sdílené třídy, učitel všechny; cizí třída ne; bez přihlášení nic; strop 60 id
     2. tvar výstupu: přesně čtyři klíče, žádné kredity ani jiná pole peněženky
     3. nepřátelská data nikdy nespadnou a nic nepustí: id mimo koupené, cizí kategorie, HTML, čísla, objekty, příliš dlouhé,
        velká písmena, seznam koupených jako objekt nebo nad 300 položek, záplava cizích klíčů, rozbitý tvar `cosmetics`
     4. práva: anon nic, přihlášený jen veřejnou funkci (pomocné ne), SECURITY DEFINER s pevným search_path
     5. idempotence: fáze jde pustit podruhé
   Sabotáže (6): bez ověření koupených, bez předpony kategorie, bez kontroly třídy, bez stropu 60, bez stropu seznamu koupených,
   anon smí volat.
   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ═════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const H = require('./sql-harness.cjs');

const PHASE = path.join(__dirname, '..', 'projects', 'rpg-cloud-setup-phase28.sql');
const ME = 'aaaaaaaa-0000-0000-0000-00000000000a';
const MATE = 'aaaaaaaa-0000-0000-0000-00000000000b';
const ALIEN = 'aaaaaaaa-0000-0000-0000-00000000000c';
const TEACH = 'aaaaaaaa-0000-0000-0000-00000000000d';
const LONER = 'aaaaaaaa-0000-0000-0000-00000000000e';
const CLS = '11111111-1111-1111-1111-111111111111', CLS2 = '22222222-2222-2222-2222-222222222222';
const uuid = n => 'bbbbbbbb-0000-0000-0000-' + String(n).padStart(12, '0');

const STUBS = H.AUTH_STUB + `
create table public.saves(user_id uuid, game text, data jsonb, primary key (user_id, game));
create table public.class_members(class_id uuid, user_id uuid);
`;
const wallet = (owned, active, extra) => JSON.stringify(Object.assign({ v: 1, credits: 777, cosmetics: { owned, active } }, extra || {}));
const DOBRA = wallet(['theme-default', 'border-gold', 'badge-purple', 'title-lovec', 'pet-sova'],
  { border: 'border-gold', badge: 'badge-purple', title: 'title-lovec', pet: 'pet-sova', theme: 'theme-default', victory: null, skin: null });

let pass = 0, fail = 0, tiche = false;
const ok = (n, c, d = '') => { if (c) { pass++; if (!tiche) console.log('  ✅ ' + n); } else { fail++; if (!tiche) console.log('  ❌ ' + n + (d ? ' — ' + d : '')); } };
const stejne = (a, b) => JSON.stringify(a, Object.keys(a || {}).sort()) === JSON.stringify(b, Object.keys(b || {}).sort());
const sq = s => "'" + String(s).replace(/'/g, "''") + "'";
const nastav = (uid, json) => H.exec(`insert into public.saves values ('${uid}','_wallet',${sq(json)}::jsonb)
  on conflict (user_id, game) do update set data = excluded.data`);
const jako = (uid, role) => `set test.uid='${uid || ''}'; set test.role='${role || ''}'; `;
const look = (uid, kdo, role) => {
  const r = H.q(jako(kdo, role) + `select look from public.look_of(array['${uid}']::uuid[])`).trim();
  return r === '' ? null : JSON.parse(r);
};
const pocet = (kdo, ids, role) => Number(H.q(jako(kdo, role) + `select count(*) from public.look_of(array[${ids.map(i => `'${i}'`).join(',')}]::uuid[])`).trim());

function kontroly() {
  H.exec('truncate public.saves; truncate public.class_members;');
  H.exec(`insert into public.class_members values ('${CLS}','${ME}'), ('${CLS}','${MATE}'), ('${CLS2}','${ALIEN}');`);
  nastav(ME, wallet(['border-cyan'], { border: 'border-cyan' }));
  nastav(MATE, DOBRA);
  nastav(ALIEN, wallet(['border-holo'], { border: 'border-holo' }));
  nastav(LONER, wallet(['badge-gold'], { badge: 'badge-gold' }));
  nastav(TEACH, wallet([], {}));

  /* 1 — kdo koho vidí */
  const vse = [ME, MATE, ALIEN, LONER];
  ok('já vidím sebe a spolužáka, ne cizí třídu ani žáka bez třídy', pocet(ME, vse) === 2, 'řádků ' + pocet(ME, vse));
  ok('moje vlastní peněženka je vidět i bez třídy', pocet(LONER, vse) === 1, 'řádků ' + pocet(LONER, vse));
  ok('učitel vidí všechny', pocet(TEACH, vse, 'teacher') === 4 && pocet(TEACH, vse, 'superadmin') === 4);
  ok('přihlášený bez role učitele cizí třídu nevidí', pocet(ALIEN, [ME, MATE, ALIEN], 'student') === 1);
  ok('bez přihlášení nikdo nic', pocet('', vse) === 0);
  ok('NULL a prázdné pole nespadnou a nic nevrátí', Number(H.q(jako(ME) + 'select count(*) from public.look_of(null)').trim()) === 0
    && Number(H.q(jako(ME) + "select count(*) from public.look_of('{}'::uuid[])").trim()) === 0);
  H.exec(`insert into public.saves values ('${MATE}','RPG_MAT_9', ${sq(DOBRA)}::jsonb) on conflict do nothing`);
  /* 2 — tvar výstupu */
  const mate = look(MATE, ME);
  ok('spolužák: přesně rámeček, barva jména, titul a mazlíček', stejne(mate, { badge: 'badge-purple', border: 'border-gold', pet: 'pet-sova', title: 'title-lovec' }), JSON.stringify(mate));
  ok('výstup nenese kredity ani jiná pole peněženky', !/credits|theme|victory|skin|owned|777/.test(JSON.stringify(mate)));
  H.exec(`update public.saves set data = ${sq(DOBRA)}::jsonb where user_id='${ME}' and game='_wallet'`);
  H.exec(`delete from public.saves where game='RPG_MAT_9'`);
  /* 3 — nepřátelská data */
  const cizi = (owned, active, extra) => { nastav(MATE, wallet(owned, active, extra)); return look(MATE, ME); };
  const prazdne = (n, v) => ok(n, v === null, JSON.stringify(v));
  prazdne('rámeček mimo koupené se nepustí', cizi(['border-cyan'], { border: 'border-gold' }));
  prazdne('HTML místo id se nepustí', cizi(['badge-x'], { badge: '<img src=x onerror=alert(1)>' }));
  prazdne('id z cizí kategorie (mazlíček „badge-gold“) se nepustí', cizi(['badge-gold'], { pet: 'badge-gold' }));
  prazdne('příliš dlouhé id se nepustí', cizi(['border-' + 'a'.repeat(40)], { border: 'border-' + 'a'.repeat(40) }));
  prazdne('velká písmena se nepustí', cizi(['Border-Gold'], { border: 'Border-Gold' }));
  prazdne('mezera a lomítko v id se nepustí', cizi(['border-gold x', 'border-a/b'], { border: 'border-gold x', badge: 'border-a/b' }));
  prazdne('číslo, objekt, pole a null místo id se nepustí', cizi(['border-gold'], { border: 5, badge: { a: 1 }, title: ['title-lovec'], pet: null }));
  prazdne('active jako řetězec', cizi(['border-gold'], 'border-gold'));
  nastav(MATE, JSON.stringify({ cosmetics: { owned: ['border-gold'], active: ['border-gold'] } })); prazdne('active jako pole', look(MATE, ME));
  prazdne('koupené jako objekt místo pole', cizi({ 'border-gold': true }, { border: 'border-gold' }));
  prazdne('koupené jako řetězec', cizi('border-gold', { border: 'border-gold' }));
  prazdne('koupených nad 300 položek se bere jako prázdný seznam', cizi(Array.from({ length: 400 }, (_, i) => i === 399 ? 'border-gold' : 'border-x' + i), { border: 'border-gold' }));
  for (const [jm, d] of [['cosmetics jako řetězec', '{"cosmetics":"ahoj"}'], ['cosmetics jako pole', '{"cosmetics":[1,2]}'], ['cosmetics jako číslo', '{"cosmetics":7}'],
    ['bez cosmetics', '{}'], ['data jako pole', '[1,2,3]'], ['data jako řetězec', '"x"'], ['data jako null', 'null'], ['prázdné active a owned', '{"cosmetics":{}}']]) {
    nastav(MATE, d); let v, chyba = '';
    try { v = look(MATE, ME); } catch (e) { chyba = String(e.stderr || e.message).slice(0, 90); }
    ok('rozbitý tvar nespadne a nic nepustí: ' + jm, !chyba && v === null, chyba || JSON.stringify(v));
  }
  const smes = cizi(['border-gold', 'badge-purple'], { border: 'border-gold', badge: 'badge-neexistuje', title: 'title-lovec' });
  ok('platné se pustí, neplatné ne (směs)', stejne(smes, { border: 'border-gold' }), JSON.stringify(smes));
  const aktiv = { border: 'border-gold' }; for (let i = 0; i < 5000; i++) aktiv['junk' + i] = 'border-gold';
  const zaplava = cizi(['border-gold'], aktiv);
  ok('záplava cizích klíčů v active nic nepřidá', stejne(zaplava, { border: 'border-gold' }), JSON.stringify(zaplava).slice(0, 100));
  /* strop 60 id */
  H.exec('truncate public.saves; truncate public.class_members;');
  H.exec(`insert into public.class_members values ('${CLS}','${ME}');`);
  H.exec(`insert into public.class_members select '${CLS}', ('bbbbbbbb-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid from generate_series(1,70) g;`);
  H.exec(`insert into public.saves select ('bbbbbbbb-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid, '_wallet', ${sq(DOBRA)}::jsonb from generate_series(1,70) g;`);
  const sedmdesat = Array.from({ length: 70 }, (_, i) => uuid(i + 1));
  ok('strop: z 70 požadovaných id se zpracuje nejvýš 60', pocet(ME, sedmdesat) === 60, 'řádků ' + pocet(ME, sedmdesat));
  /* 4 — práva a nastavení funkce */
  const pr = (role, fn) => H.q(`select has_function_privilege('${role}', '${fn}', 'execute')`).trim() === 't';
  ok('anon nesmí volat look_of', !pr('anon', 'public.look_of(uuid[])'));
  ok('přihlášený smí volat look_of', pr('authenticated', 'public.look_of(uuid[])'));
  ok('pomocné funkce nejsou volatelné zvenčí', !pr('authenticated', 'public._look_id(jsonb,text)') && !pr('authenticated', 'public._look_z_penezenky(jsonb)')
    && !pr('anon', 'public._look_id(jsonb,text)'));
  const cfg = H.q("select prosecdef::text || '|' || coalesce(proconfig::text,'') from pg_proc where proname='look_of'").trim();
  ok('look_of je SECURITY DEFINER s pevným search_path', /^true\|.*search_path=public/.test(cfg), cfg);
}

(function main() {
  console.log('\n── Fáze 28 SQL: look_of (vzhled spolužáků) proti skutečnému PostgreSQL ──\n');
  const why = H.unavailable();
  if (why) { console.log('\n  ⏭️  SKIP: ' + why + '\n'); process.exit(0); }
  const ORIG = fs.readFileSync(PHASE, 'utf8');
  try {
    H.start('pgtest28');
    H.exec(STUBS);
    let ok1 = true, err = '';
    try { H.file(PHASE); } catch (e) { ok1 = false; err = String(e.stderr || e.message || e).slice(0, 300); }
    ok('phase28.sql se spustí bez chyby', ok1, err);
    if (!ok1) return;
    let ok2 = true; try { H.file(PHASE); } catch (e) { ok2 = false; }
    ok('phase28.sql jde pustit podruhé (idempotence)', ok2);
    kontroly();

    /* sabotáže: každá musí shodit aspoň jednu kontrolu */
    const SAB = [
      ['bez ověření koupených', s => s.replace('filter (where id is not null and own ? id)', 'filter (where id is not null)')],
      ['bez předpony kategorie', s => s.replace("('^' || p_kat || '-[a-z0-9-]{1,26}$')", "'^[a-z0-9-]{1,32}$'")],
      ['bez kontroly třídy', s => s.replace('and other.user_id = s.user_id', 'and true')],
      ['bez stropu 60 id', s => s.replace('p_ids[1:60]', 'p_ids')],
      ['bez stropu seznamu koupených', s => s.replace("            and jsonb_array_length(p_data #> '{cosmetics,owned}') <= 300\n", '')],
      ['anon smí volat', s => s.replace(/revoke all on function public\.look_of\(uuid\[\]\)\s+from public, anon;/, '')],
    ];
    for (const [jm, zmena] of SAB) {
      const nove = zmena(ORIG);
      ok('sabotáž „' + jm + '“ se aplikovala', nove !== ORIG);
      if (nove === ORIG) continue;
      const f0 = fail, p0 = pass;
      try {
        H.exec('drop function if exists public.look_of(uuid[]);');   // CREATE OR REPLACE práva zachová — sabotáž s právy musí začít od nuly
        H.exec(nove);
        tiche = true; kontroly();
      } catch (e) { fail++; } finally { tiche = false; }
      const chyceno = fail > f0;
      fail = f0; pass = p0;
      ok('sabotáž „' + jm + '“ je chycena', chyceno);
      H.exec('drop function if exists public.look_of(uuid[]);');
      H.file(PHASE);                                   // zpět na původní definici (i s právy)
    }
    kontroly();                                        // po sabotážích je vše zase v pořádku
  } catch (e) {
    ok('test doběhl bez výjimky', false, String(e.stderr || e.message || e).slice(0, 300));
  } finally { H.stop(); }
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})();
