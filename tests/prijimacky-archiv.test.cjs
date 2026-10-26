/* prijimacky-archiv.test.cjs — úplnost a průchodnost archivu přijímaček.

   Proč to vzniklo: díru v roce 2026 (chybí oba náhradní termíny a klíče
   k oběma řádným) našla až externí AI. Archiv přitom nehlídalo NIC — ani to,
   že odkaz vede na existující soubor. Ročník, který má o dva termíny míň než
   ten předchozí, má poznat brána, ne náhodný čtenář.

   Chybějící termíny se NEHLÁSÍ jako pád, protože CERMAT je nemusí mít ještě
   zveřejněné. Jsou vedené JMENOVITĚ i s počtem v ZNAME_MEZERY, takže je to
   zapsané rozhodnutí, ne tichá mezera — a jakmile se doplní, test řekne, že
   se má výjimka odebrat. Stejný vzor jako ZNAME_MALE_PLOCHY v mobilním auditu.

   POZOR na měřidlo: odkazy jsou v podobě href="./pdfs/…", ne href="pdfs/…".
   První verze sondy to nezohlednila a nad zdravým archivem hlásila
   „0 odkazů, 45 osiřelých souborů". */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'projects', 'prijimacky-matematika');
const PDFS = path.join(ROOT, 'pdfs');

/* Rok → termíny, které v archivu CHYBÍ, i s důvodem. Až se doplní, tenhle záznam se odebere a test na to
   sám upozorní. 26. 10. 2026: 2023 a 2026 doplněny; zápis „CERMAT náhradní termíny 2023 nezveřejnil“
   z 9. 9. 2026 byl NEPRAVDIVÝ (katalog CERMATu má M9C/M9D 2023 včetně klíče a záznamového archu) — výjimku
   je třeba ověřit proti zdroji, ne proti vlastnímu archivu. */
const ZNAME_MEZERY = {
  2020: { chybi: ['2_radny', '3_nahradni', '4_nahradni'], proc: 'katalog CERMATu uvádí pro 2020 jediný řádný termín a žádný náhradní' },
};
/* Termíny bez klíče správných řešení (od 26. 10. 2026 žádný). */
const ZNAME_BEZ_KLICE = [];

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

console.log('── Archiv přijímaček ──');

// ── sběr ──
const soubory = [];
(function chod(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) chod(p);
    else if (e.name.toLowerCase().endsWith('.pdf')) soubory.push(path.relative(ROOT, p).replace(/\\/g, '/'));
  }
})(PDFS);

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const odkazy = [...new Set([...html.matchAll(/(?:href|src)="\.?\/?(pdfs\/[^"]+\.pdf)"/g)].map(m => m[1]))];

ok(soubory.length >= 102, `archiv má ${soubory.length} PDF (podlaha 102 — naměřeno 26. 10. 2026)`);
ok(odkazy.length >= 102, `stránka odkazuje na ${odkazy.length} PDF (podlaha 102)`);

// ── 1) odkaz musí vést na existující soubor ──
const rozbite = odkazy.filter(o => !fs.existsSync(path.join(ROOT, o)));
ok(rozbite.length === 0, 'každý odkaz vede na existující soubor'
  + (rozbite.length ? ` — rozbité: ${rozbite.slice(0, 3).join(', ')}` : ''));

// ── 2) žádný soubor nesmí zůstat bez odkazu ──
const osirele = soubory.filter(f => !odkazy.includes(f));
ok(osirele.length === 0, 'žádné PDF nezůstalo bez odkazu (nedosažitelné pro žáka)'
  + (osirele.length ? ` — ${osirele.length}×, např. ${osirele.slice(0, 3).join(', ')}` : ''));

// ── 3) soubory jsou opravdu PDF, ne prázdné nebo přejmenované ──
const nePdf = [], drobne = [];
for (const f of soubory) {
  const p = path.join(ROOT, f);
  if (fs.readFileSync(p).subarray(0, 4).toString('latin1') !== '%PDF') nePdf.push(f);
  if (fs.statSync(p).size < 20000) drobne.push(f);
}
ok(nePdf.length === 0, `všech ${soubory.length} souborů začíná %PDF` + (nePdf.length ? ` — ${nePdf.join(', ')}` : ''));
ok(drobne.length === 0, 'žádné PDF není podezřele malé (< 20 kB)' + (drobne.length ? ` — ${drobne.join(', ')}` : ''));

// ── 4) úplnost termínů podle roku ──
const roky = {};
for (const f of soubory) {
  const m = f.match(/pdfs\/(\d{4})\/(\d_[a-z]+)\//);
  if (m) (roky[m[1]] = roky[m[1]] || new Set()).add(m[2]);
}
const POVINNE = ['1_radny', '2_radny', '3_nahradni', '4_nahradni'];
const neceka = [], vyresene = [];
for (const rok of Object.keys(roky).sort()) {
  const ma = roky[rok];
  const chybi = POVINNE.filter(t => !ma.has(t));
  const zname = ZNAME_MEZERY[rok] ? ZNAME_MEZERY[rok].chybi : [];
  chybi.filter(t => !zname.includes(t)).forEach(t => neceka.push(`${rok}/${t}`));
  zname.filter(t => ma.has(t)).forEach(t => vyresene.push(`${rok}/${t}`));
}
ok(neceka.length === 0, 'žádnému roku nechybí termín, který by neměl být zapsaný v ZNAME_MEZERY'
  + (neceka.length ? ` — NOVÁ MEZERA: ${neceka.join(', ')}` : ''));
ok(vyresene.length === 0, 'ZNAME_MEZERY neuvádí termín, který už v archivu JE'
  + (vyresene.length ? ` — doplněno, odeber z výjimek: ${vyresene.join(', ')}` : ''));

// ── 5) klíč správných řešení u každého termínu ──
const bezKlice = [], klicNavic = [];
for (const rok of Object.keys(roky).sort()) for (const t of [...roky[rok]].sort()) {
  const klic = soubory.some(f => f.includes(`/${rok}/${t}/`) && /klic|ksr/i.test(f));
  const id = `${rok}/${t}`;
  if (!klic && !ZNAME_BEZ_KLICE.includes(id)) bezKlice.push(id);
  if (klic && ZNAME_BEZ_KLICE.includes(id)) klicNavic.push(id);
}
ok(bezKlice.length === 0, 'každý termín má klíč správných řešení'
  + (bezKlice.length ? ` — BEZ KLÍČE: ${bezKlice.join(', ')}` : ''));
ok(klicNavic.length === 0, 'ZNAME_BEZ_KLICE neuvádí termín, který už klíč MÁ'
  + (klicNavic.length ? ` — doplněno, odeber z výjimek: ${klicNavic.join(', ')}` : ''));

// ── 6) stránka odpovídá složce: žádný soubor bez odkazu, žádný odkaz ručně přidaný mimo generátor ──
const { spawnSync } = require('child_process');
const gen = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'archiv-index.cjs'), '--kontrola'], { encoding: 'utf8' });
ok(gen.status === 0, 'index.html odpovídá složce pdfs/ (tools/archiv-index.cjs --kontrola)'
  + (gen.status ? ` — ${String(gen.stderr).trim().split('\n')[0]}` : ''));

// ── 7) všechno, co katalog CERMATu nabízí od 2020 (M9, česky, bez ilustračních), v archivu je ──
const katalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'cermat-archiv', 'katalog.json'), 'utf8'));
const SLOZKA = { '1. řádný': '1_radny', '2. řádný': '2_radny', '1. náhradní': '3_nahradni', '2. náhradní': '4_nahradni' };
const VZOR = { test: /_(zadani|TS)\.pdf$/, klic: /_(klic|KSR)\.pdf$/, arch: /_ZA\.pdf$/, reseni: /_vzorove_reseni\.pdf$/, vyplneny_arch: /_VZA\.pdf$/ };
const nabidka = katalog.filter(e => e.stupen === 'M9' && e.rok >= 2020 && e.jazyk === 'cs' && SLOZKA[e.termin] && VZOR[e.typ]);
const chybiZKatalogu = nabidka.filter(e => !soubory.some(f => f.includes(`/${e.rok}/${SLOZKA[e.termin]}/`) && VZOR[e.typ].test(f)));
ok(nabidka.length >= 88, `katalog CERMATu nabízí ${nabidka.length} souborů od 2020 (podlaha 88 — naměřeno 26. 10. 2026; menší číslo by znamenalo, že kontrola nic nevidí)`);
ok(chybiZKatalogu.length === 0, 'archiv obsahuje vše, co katalog CERMATu nabízí od 2020'
  + (chybiZKatalogu.length ? ` — chybí ${chybiZKatalogu.length}×, např. ${chybiZKatalogu.slice(0, 3).map(e => `${e.rok} ${e.termin} ${e.typ}`).join(', ')} (pusť python3 tools/archiv-doplnit.py --stahni)` : ''));

console.log(`\n  Známé mezery (rozhodnutí, ne vada): ` +
  Object.entries(ZNAME_MEZERY).map(([r, v]) => `${r} bez ${v.chybi.join('+')} (${v.proc})`).join(' · ') +
  `\n  Bez klíče: ${ZNAME_BEZ_KLICE.join(', ')}`);
console.log(`\n══════════════════════════════════════════\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n══════════════════════════════════════════`);
process.exit(fail ? 1 : 0);
