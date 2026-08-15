/* ══════════════════════════════════════════════════════════════════════
   Zdroj termínu přijímaček je živý a jeho porucha je VIDĚT.

   Týdenní job „Update CERMAT exam date" hlásil devět úspěchů po sobě,
   zatímco ve skutečnosti nestáhl vůbec nic. CERMAT se přestěhoval
   z cermat.cz na cermat.gov.cz, staré adresy vracely 404 — a skript
   končil `process.exit(0)` s odůvodněním „ať to neblokuje CI". Job byl
   tedy zelený, aniž by kdy splnil svůj jediný úkol.

   Dosavadní test (`cermat-parse.test.cjs`) kontroloval jen parser nad
   vymyšleným HTML. Parser přitom byl v pořádku celou dobu; mrtvé byly
   URL. Zelený test tak poruchu ani nemohl odhalit.

   Tenhle test hlídá to, co ten první nepokrýval:
     • adresy nemíří na mrtvou doménu www.cermat.cz
     • neúspěch končí NENULOVÝM kódem (job zčervená)
     • uložený termín není v minulosti (žáci nevidí prošlý odpočet)
     • odpočet ve hře i na stránce přijímaček drží STEJNÉ datum

   Síť se záměrně nevolá — test musí běžet i v prostředí, kde je
   cermat.gov.cz blokovaný.

   Spusť: node tests/cermat-source.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

console.log('\n── Zdroj termínu přijímaček ──\n');

const modul = require(P('.github', 'scripts', 'fetch-cermat.js'));
const CERMAT_URLS = Array.isArray(modul.CERMAT_URLS) ? modul.CERMAT_URLS : [];

/* ── 1. adresy ────────────────────────────────────────────────────── */
// Bez tohohle exportu nejde adresy zvenčí zkontrolovat — a právě proto se
// stěhování domény devět týdnů nikdo nedozvěděl. Hlásíme to srozumitelně,
// ne výjimkou.
ok(Array.isArray(modul.CERMAT_URLS), 'skript exportuje CERMAT_URLS (jde je zkontrolovat)');
ok(typeof modul.run === 'function', 'skript exportuje run() (jde ověřit chování při neúspěchu)');
ok(CERMAT_URLS.length > 0, `seznam adres není prázdný (${CERMAT_URLS.length})`);

const mrtve = CERMAT_URLS.filter(u => /(^|\/\/)(www\.)?cermat\.cz/.test(u));
ok(mrtve.length === 0,
  'žádná adresa nemíří na starou doménu cermat.cz (přesměrovává na gov.cz a 404)',
  mrtve.join(', '));

ok(CERMAT_URLS.every(u => u.startsWith('https://')), 'všechny adresy jsou https');

/* ── 2. porucha musí být vidět ────────────────────────────────────── */
{
  /* Neúspěch se vynutí podstrčenou adresou na doméně .invalid, která se
     z definice nikdy nepřeloží (RFC 2606). Test tedy nesahá na síť a dá
     stejný výsledek tady i na CI — což je podstatné, protože až budou
     skutečné adresy fungovat, nesmí to tenhle test rozhodit.

     Uložený JSON musí zůstat nedotčený: web má běžet dál na posledním
     známém datu, i když se stahování nepovede. */
  const jsonPath = P('projects', 'cermat-date.json');
  const pred = fs.readFileSync(jsonPath, 'utf8');

  const kod = `
    const m = require(${JSON.stringify(P('.github', 'scripts', 'fetch-cermat.js'))});
    if (typeof m.run !== 'function') { console.error('run() se neexportuje'); process.exit(3); }
    m.run({ urls: ['https://nikdy-neexistuje.invalid/terminy/'] })
      .catch(e => { console.error(e.message); process.exit(1); });
  `;
  const r = spawnSync(process.execPath, ['-e', kod], { encoding: 'utf8', timeout: 120000 });

  ok(r.status === 1,
    'když se termín nepodaří zjistit, skript skončí kódem 1 (job zčervená)',
    'exit=' + r.status + ' ' + (r.stderr || '').trim().split('\n').pop());
  ok(/nepodařilo se zjistit termín/.test(r.stderr || ''),
    'a řekne proč, ať je z logu poznat, co opravit');

  const po = fs.readFileSync(jsonPath, 'utf8');
  ok(pred === po, 'neúspěšný běh NEPŘEPÍŠE uložený termín (web jede dál)');
}

/* ── 3. uložený termín dává smysl ─────────────────────────────────── */
const data = JSON.parse(fs.readFileSync(P('projects', 'cermat-date.json'), 'utf8'));
ok(data.next && /^\d{4}-\d{2}-\d{2}$/.test(data.next.date),
  `uložený termín má platný tvar (${data.next && data.next.date})`);

const termin = new Date(data.next.date + 'T08:00:00');
ok(termin.getTime() > Date.now(),
  `uložený termín je v budoucnu (${data.next.date}) — jinak žáci vidí prošlý odpočet`);

/* ── 4. hra i stránka přijímaček drží stejné datum ────────────────── */
{
  const hra = fs.readFileSync(P('projects', 'rpg-mat-9.html'), 'utf8');
  const stranka = fs.readFileSync(P('projects', 'prijimacky-matematika', 'index.html'), 'utf8');
  const vytahni = s => (s.match(/new Date\('(\d{4}-\d{2}-\d{2})T/) || [])[1];
  const dHra = vytahni(hra), dStranka = vytahni(stranka);

  ok(!!dHra && !!dStranka, `záložní datum nalezeno v obou souborech (${dHra} / ${dStranka})`);
  ok(dHra === dStranka, 'hra i stránka přijímaček mají stejné záložní datum', `${dHra} vs ${dStranka}`);
  ok(dHra === data.next.date,
    'záložní datum v kódu souhlasí s cermat-date.json',
    `${dHra} vs ${data.next.date}`);
}

console.log(`\n  Zdroj termínu: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
