/* ══════════════════════════════════════════════════════════════════
   Společný harness pro strojové ověřování SQL fází (rpg-cloud-setup-phaseN.sql).

   Proč: do živé Supabase nevidíme, takže se fáze psaly „naslepo" a spoléhalo
   se na to, že je Vojta spustí a ono to půjde. V sandboxu jsou ale binárky
   PostgreSQL, takže fázi lze SKUTEČNĚ spustit nad dočasným klastrem, doplnit
   minimální stuby (tabulky, auth.uid(), my_role()) a ověřit chování včetně
   odolnosti proti podvrženému žákovskému JSONu.

   Bez shellu: všechno přes execFileSync s polem argumentů (cesty tečou z
   filesystému → skládání příkazů by byl injection sink, viz CodeQL #75).
   Práva se shazují přes uid/gid, ne přes `su`.

   Použití:
     const H = require('./sql-harness.cjs');
     const why = H.unavailable();           // string = důvod skipu, null = OK
     H.start('pgtest19');                   // nastartuje klastr
     H.exec(SQL); H.file('…/phaseN.sql');   // spustí SQL
     H.q('select 1');                       // vrátí text výsledku
     H.stop();                              // zastaví + uklidí
   ══════════════════════════════════════════════════════════════════ */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');

let BIN = null, DIR = null, SOCK = null, DATA = null, IDS = null;

const run = (file, args, opts = {}) =>
  execFileSync(file, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
const isRoot = () => typeof process.getuid === 'function' && process.getuid() === 0;

function findPgBin() {
  for (const g of ['/usr/lib/postgresql', '/usr/local/pgsql', '/opt/postgresql']) {
    if (!fs.existsSync(g)) continue;
    for (const v of fs.readdirSync(g).sort().reverse()) {
      const b = path.join(g, v, 'bin');
      if (fs.existsSync(path.join(b, 'initdb'))) return b;
    }
  }
  return null;
}
// postgres se odmítá spustit jako root → jako root shodíme práva na
// neprivilegovaného uživatele; jinak (CI runner) běžíme sami sebou.
function pgIds() {
  if (!isRoot()) return null;                 // null = běž jako já
  for (const u of ['postgres', 'pgtest', 'nobody']) {
    try {
      const uid = parseInt(run('id', ['-u', u]).trim(), 10);
      const gid = parseInt(run('id', ['-g', u]).trim(), 10);
      if (Number.isFinite(uid) && Number.isFinite(gid)) return { uid, gid };
    } catch (e) {}
  }
  return undefined;                           // undefined = nemáme koho
}
const asPg = (file, args) => run(file, args, IDS ? { uid: IDS.uid, gid: IDS.gid } : {});
const rmrf = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) {} };

/** Důvod, proč harness nejde použít (string), nebo null když je vše OK. */
function unavailable() {
  BIN = BIN || findPgBin();
  if (!BIN) return 'v prostředí není PostgreSQL server (jen klient nebo nic)';
  IDS = pgIds();
  if (IDS === undefined) return 'běží jako root a není neprivilegovaný uživatel pro postgres';
  return null;
}

/** Nastartuje čistý klastr. `name` = krátký adresář (socket má limit 107 B). */
function start(name) {
  DIR = '/tmp/' + String(name).replace(/[^a-z0-9_-]/gi, '') ;
  SOCK = DIR + '/s'; DATA = DIR + '/data';
  rmrf(DIR);
  fs.mkdirSync(SOCK, { recursive: true });
  fs.mkdirSync(DATA, { recursive: true });
  if (IDS) for (const p of [DIR, SOCK, DATA]) fs.chownSync(p, IDS.uid, IDS.gid);
  asPg(path.join(BIN, 'initdb'), ['-D', DATA, '-U', 'postgres', '--auth=trust']);
  // jen unixový socket: `-c listen_addresses=` je jeden čistý token,
  // takže nepotřebujeme shellové uvozovkování `-h ""`
  asPg(path.join(BIN, 'pg_ctl'),
    ['-D', DATA, '-o', '-k ' + SOCK + ' -c listen_addresses=', '-l', DIR + '/pg.log', 'start']);
}

function stop() {
  if (!DIR) return;
  try { asPg(path.join(BIN, 'pg_ctl'), ['-D', DATA, '-m', 'immediate', 'stop']); } catch (e) {}
  rmrf(DIR);
  DIR = SOCK = DATA = null;
}

/** Dotaz → text (bez hlaviček). Potvrzení „SET" u `set …;` se odfiltruje,
 *  jinak by ulpělo jako první řádek dat a testy by měřily hlášku, ne data. */
function q(sql) {
  return run('psql', ['-h', SOCK, '-U', 'postgres', '-tAX', '-v', 'ON_ERROR_STOP=1', '-c', sql])
    .split('\n').filter(l => l.trim() !== 'SET').join('\n').trim();
}
/** Dotaz → pole řádků rozsekaných podle `|`. */
function rows(sql) {
  const out = q(sql);
  return out ? out.split('\n').map(l => l.split('|')) : [];
}
/** Spustí SQL (bez čtení výsledku). */
function exec(sql) { fs.writeFileSync(DIR + '/_x.sql', sql); return file(DIR + '/_x.sql'); }
/** Spustí SQL soubor. */
function file(f) { return run('psql', ['-h', SOCK, '-U', 'postgres', '-qX', '-v', 'ON_ERROR_STOP=1', '-f', f]); }
/** Očekává, že SQL SELHÁ; vrací text chyby (nebo null když neselhalo). */
function expectFail(sql) {
  try { q(sql); return null; } catch (e) { return String(e.stderr || e.message || e); }
}

/* Stuby, které potřebuje víc fází — Supabase věci, co v čistém PG nejsou.
   auth.uid() i my_role() čtou GUC, takže test může přepínat „kdo se ptá". */
const AUTH_STUB = `
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;
-- my_role() zrcadlí OPRAVENOU produkční semantiku (fáze 23): kdo není
-- v allowlistu, je 'student' — NIKDY NULL. Při NULL totiž vyjde
-- (NULL not in ('teacher','superadmin')) = NULL, takže strážní IF
-- neprojde a brána se tiše otevře — tu díru zavírá fáze 23.
create or replace function public.my_role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('test.role', true), ''), 'student') $$;
create role anon;
create role authenticated;
`;

module.exports = { unavailable, start, stop, q, rows, exec, file, expectFail, AUTH_STUB,
  get dir() { return DIR; } };
