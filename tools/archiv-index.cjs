/* ═════════════════════════════════════════════════════════════════
   Přegeneruje archiv testů na úvodní stránce přijímaček (<main> v projects/prijimacky-matematika/index.html)
   podle toho, co skutečně leží ve složce pdfs/. Dřív se řádky kopírovaly ručně, takže přidání roku
   znamenalo dopsat desítky odkazů a nějaký se vždy zapomněl.

   Z každé složky pdfs/<rok>/<termín>/ udělá jeden řádek; soubory třídí podle jména:
     zadání            M9A_2025_zadani.pdf, M9A_2026_TS.pdf
     řešení (Vojtovo)  M9A_2025_vyplneno.pdf, nanecisto_2025_reseni.pdf   (ručně dopsané na iPadu)
     klíč              M9A_2025_klic.pdf, M9A_2026_KSR.pdf
     vzorové řešení    M9A_2024_vzorove_reseni.pdf                        (postup od CERMATu)
     vzorový arch      M9A_2026_VZA.pdf
     záznamový arch    M9A_2025_ZA.pdf
   Neznámé jméno souboru je chyba (jinak by zůstal bez odkazu).

   Zachovává se, co je v řádku psané ručně: hlavička řádku (zejména u nanečisto) a poznámka `row-note`
   s odkazem do Doplňků. Najdou se podle cesty (rok + složka), takže přežijí i přeuspořádání souborů.

   Použití: node tools/archiv-index.cjs           (přepíše index.html)
            node tools/archiv-index.cjs --kontrola (nic nepíše, skončí 1, když by se stránka změnila)
   Hlídá `tests/prijimacky-archiv.test.cjs`.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'projects', 'prijimacky-matematika');
const HTML = path.join(ROOT, 'index.html');
const PDFS = path.join(ROOT, 'pdfs');
const KONTROLA = process.argv.includes('--kontrola');

const TERMINY = {
  '1_radny': { label: 'Termín 1', tag: 'radny', tagText: 'řádný', code: 'M9A' },
  '2_radny': { label: 'Termín 2', tag: 'radny', tagText: 'řádný', code: 'M9B' },
  '3_nahradni': { label: 'Termín 1', tag: 'nahradni', tagText: 'náhradní', code: 'M9C' },
  '4_nahradni': { label: 'Termín 2', tag: 'nahradni', tagText: 'náhradní', code: 'M9D' },
  '5_nanecisto': { label: 'Nanečisto', tag: 'nanecisto', tagText: 'nanečisto', code: 'Nový Amos' },
};
const PORADI = ['1_radny', '2_radny', '3_nahradni', '4_nahradni', '5_nanecisto'];
/* pořadí tlačítek v řádku */
const DRUHY = ['zadani', 'reseni', 'klic', 'vzorove', 'vzorovy_arch', 'zaznamovy_arch'];
const POPISEK = { zadani: 'zadání', reseni: 'řešení', klic: 'klíč', vzorove: 'vzorové řešení', vzorovy_arch: 'vzorový arch', zaznamovy_arch: 'záznamový arch' };

function druh(jmeno, slozka) {
  if (/_(zadani|TS)\.pdf$/.test(jmeno)) return 'zadani';
  if (/_vyplneno\.pdf$/.test(jmeno)) return 'reseni';
  if (slozka === '5_nanecisto' && /_reseni\.pdf$/.test(jmeno)) return 'reseni';
  if (/_(klic|KSR)\.pdf$/.test(jmeno)) return 'klic';
  if (/_vzorove_reseni\.pdf$/.test(jmeno)) return 'vzorove';
  if (/_VZA\.pdf$/.test(jmeno)) return 'vzorovy_arch';
  if (/_ZA\.pdf$/.test(jmeno)) return 'zaznamovy_arch';
  return null;
}

const html = fs.readFileSync(HTML, 'utf8');
/* značky se hledají mimo HTML komentáře (hlavička stránky popisuje postup a zmiňuje <main> doslova) */
const maskovane = html.replace(/<!--[\s\S]*?-->/g, c => ' '.repeat(c.length));
const m0 = maskovane.indexOf('<main>'), m1 = maskovane.indexOf('</main>');
if (m0 < 0 || m1 < 0 || maskovane.indexOf('<main>', m0 + 1) >= 0) throw new Error('index.html nemá právě jedno <main>…</main>');
const stary = html.slice(m0, m1);

/* ── ikony a ručně psané části z původních řádků ── */
const ikony = {};
for (const a of stary.matchAll(/<a [^>]*>\s*<span class="ico">(<svg[\s\S]*?<\/svg>)<\/span>\s*([^<]+?)\s*<\/a>/g)) {
  const text = a[2].trim();
  for (const [k, p] of Object.entries(POPISEK)) if (p === text && !ikony[k]) ikony[k] = a[1];
}
/* „vzorové řešení“ je nový druh tlačítka, ikona knihy s řádky */
ikony.vzorove = ikony.zadani.replace(/<path d="[^"]*"/, '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M8 8h7 M8 12h7"');
for (const k of DRUHY) if (!ikony[k]) throw new Error('chybí ikona pro ' + k + ' — v původní stránce není žádné takové tlačítko');

const rucni = {}; // 'rok/složka' → { hlavicka, poznamka }
for (const r of stary.matchAll(/<li class="row">([\s\S]*?)<\/li>/g)) {
  const p = r[1].match(/pdfs\/(\d{4})\/([a-z0-9_]+)\//);
  if (!p) continue;
  rucni[p[1] + '/' + p[2]] = {
    hlavicka: (r[1].match(/<div class="row-header">[\s\S]*?<\/div>/) || [''])[0],
    poznamka: (r[1].match(/<p class="row-note">[\s\S]*?<\/p>/) || [''])[0],
  };
}

/* ── sběr souborů ── */
const roky = fs.readdirSync(PDFS).filter(n => /^\d{4}$/.test(n)).sort().reverse();
const nezname = [];
const sekce = roky.map(rok => {
  const slozky = PORADI.filter(s => fs.existsSync(path.join(PDFS, rok, s)));
  for (const s of fs.readdirSync(path.join(PDFS, rok))) if (!PORADI.includes(s)) nezname.push(`${rok}/${s}/ (neznámá složka)`);
  const radky = slozky.map(s => {
    const jmena = fs.readdirSync(path.join(PDFS, rok, s)).filter(n => n.toLowerCase().endsWith('.pdf')).sort();
    const pole = {};
    for (const j of jmena) {
      const d = druh(j, s);
      if (!d) { nezname.push(`${rok}/${s}/${j}`); continue; }
      if (pole[d]) nezname.push(`${rok}/${s}: dva soubory druhu „${POPISEK[d]}“ (${pole[d]}, ${j})`);
      pole[d] = j;
    }
    const t = TERMINY[s], r = rucni[rok + '/' + s] || {};
    const hlavicka = r.hlavicka || `<div class="row-header">
            <span class="label">${t.label}</span>
            <span class="tag ${t.tag}">${t.tagText}</span>
            <span class="code">${t.code}</span>
          </div>`;
    const tlacitka = DRUHY.filter(d => pole[d]).map(d =>
      `            <a${d === 'reseni' ? ' class="primary"' : ''} href="./pdfs/${rok}/${s}/${pole[d]}" target="_blank" rel="noopener"><span class="ico">${ikony[d]}</span> ${POPISEK[d]}</a>`);
    return { s, html: `        <li class="row">
          ${hlavicka}
          <div class="files">
${tlacitka.join('\n')}
          </div>${r.poznamka ? '\n          ' + r.poznamka : ''}
        </li>` };
  });
  const n = k => radky.filter(r => r.s.endsWith(k)).length;
  const casti = [];
  if (n('_radny')) casti.push(`${n('_radny')} ${n('_radny') === 1 ? 'řádný' : 'řádné'}`);
  if (n('_nahradni')) casti.push(`${n('_nahradni')} náhradní`);
  if (n('_nanecisto')) casti.push(`${n('_nanecisto')} nanečisto`);
  let pocet = casti.join(' · ');
  if (casti.length === 1 && n('_radny')) pocet += n('_radny') === 1 ? ' termín' : ' termíny';
  return `    <!-- ─── ${rok} ─────────────────────────────────────────────────────────── -->
    <section class="year">
      <div class="year-header">
        <h2>${rok}</h2>
        <span class="count">${pocet}</span>
      </div>
      <ul class="rows">

${radky.map(r => r.html).join('\n\n')}

      </ul>
    </section>`;
});
if (nezname.length) { console.error('Nerozpoznané soubory/složky:\n  ' + nezname.join('\n  ')); process.exit(2); }

const novy = '<main>\n\n' + sekce.join('\n\n') + '\n\n  ';
if (novy === stary) { console.log('index.html je aktuální (' + roky.length + ' let).'); process.exit(0); }
if (KONTROLA) { console.error('index.html neodpovídá složce pdfs/ — pusť node tools/archiv-index.cjs'); process.exit(1); }
fs.writeFileSync(HTML, html.slice(0, m0) + novy + html.slice(m1));
console.log('index.html přegenerován: ' + roky.join(', ') + '; odkazů ' + (novy.match(/href="\.\/pdfs\//g) || []).length);
