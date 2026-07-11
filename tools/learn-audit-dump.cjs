/* Čitelný výpis teorie (rpg-learn-N.js) pro obsahový audit — statický obsah:
   intro, sekce, vzorce, řešené příklady (q+kroky), časté chyby (wrong/right/why).
   Použití: node tools/learn-audit-dump.cjs <ročník 3-9> > dump.txt  */
const fs = require('fs');
const G = process.argv[2] || '9';
global.window = {};
new Function(fs.readFileSync(`${__dirname}/../projects/rpg-learn-${G}.js`, 'utf8'))();
const L = global.window['RPG_LEARN_' + G];
if (!L) { console.log('modul nenalezen'); process.exit(2); }
const strip = s => String(s == null ? '' : s).replace(/<\/?b>/g, '*').replace(/<[^>]+>/g, '');
const out = [`TEORIE ROČNÍK ${G} — ${Object.keys(L).length} misí`];
for (const mid of Object.keys(L)) {
  const m = L[mid];
  out.push(`\n${'═'.repeat(66)}\nMISE ${mid}`);
  out.push(`INTRO: ${strip(m.intro)}`);
  (m.sections || []).forEach(sec => {
    out.push(`  § ${strip(sec.h)}`);
    (sec.p || []).forEach(p => out.push(`     ${strip(p)}`));
  });
  if (m.formulas && m.formulas.length) out.push(`  VZORCE: ${m.formulas.map(strip).join('  |  ')}`);
  (m.examples || []).forEach((e, i) => {
    out.push(`  PŘÍKLAD ${i + 1}: ${strip(e.q)}`);
    (e.s || []).forEach(s => out.push(`     → ${strip(s)}`));
  });
  (m.mistakes || []).forEach((mi, i) => {
    out.push(`  CHYBA ${i + 1}: ✗ ${strip(mi.wrong)}   ✓ ${strip(mi.right)}`);
    if (mi.why) out.push(`     proč: ${strip(mi.why)}`);
  });
}
console.log(out.join('\n'));
