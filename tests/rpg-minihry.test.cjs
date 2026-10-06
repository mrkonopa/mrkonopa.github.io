/* rpg-minihry.test.cjs — minihry (spojovačka, pexeso, řazení) nad SKUTEČNÝMI úlohami
   všech misí 3.–9. ročníku. Minihry se skládají z úloh mise samy, takže každá vada
   v tom, jak čtou odpověď, zasáhne celou banku najednou.

   Naměřeno 4. 10. 2026 (velký průchod, tests/KONTROLY.md #4 a #5):
   · ŘAZENÍ bralo hodnotu přes parseFloat: „1/3" → 1, „1 500" → 1. Úlohy se zlomkovým
     výsledkem se tak řadily podle čitatele — 561 z 20 276 způsobilých úloh (6/2-3
     „1/6 + 1/6 =" → hra 1, správně 0,33). Kdo počítal správně, dostal „špatně".
   · SPOJOVAČKA ukazovala odpověď tak, jak leží v bance: desetinnou tečkou („4.8",
     1 021×) a spojovníkem („-5", 1 824×). A protože jedinečnost hlídala podle
     ŘETĚZCE, mohla mít jedna hra tutéž hodnotu dvakrát („3.2" a „3,2", 445×) —
     párování pak rozhodoval zápis, ne výpočet.
   Hodnota se tu počítá NEZÁVISLE (vlastní parser), ne voláním kódu hry. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), P = f => path.join(ROOT, 'projects', f);
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

// herní prostředí: sdílené formátovače (czMC) z rpg-shared.js jako v prohlížeči
global.window = globalThis;
try { vm.runInThisContext(fs.readFileSync(P('rpg-shared.js'), 'utf8'), { filename: 'rpg-shared.js' }); } catch (e) { /* DOM části modulu tu nejsou potřeba */ }
vm.runInThisContext(fs.readFileSync(P('rpg-tasktypes.js'), 'utf8'), { filename: 'rpg-tasktypes.js' });
const TT = globalThis.RPGTaskTypes;
ok(TT && typeof TT.pickPairs === 'function' && typeof TT.pickOrderItems === 'function', 'modul minihry se načetl');
ok(typeof TT.zobraz === 'function', 'modul má jeden formátovač zobrazení odpovědi (zobraz)');
const zobraz = typeof TT.zobraz === 'function' ? TT.zobraz : String;

// nezávislá hodnota odpovědi: zlomek, smíšené číslo, mezery v tisících, čárka, jednotka za číslem
function hodnota(a) {
  let s = String(a).trim().replace(/−/g, '-'), m;
  if ((m = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/))) return (+m[1] < 0 ? -1 : 1) * (Math.abs(+m[1]) + m[2] / m[3]);
  if ((m = s.match(/^(-?\d+)\/(\d+)$/))) return m[1] / m[2];
  s = s.replace(/(\d)\s(?=\d{3}\b)/g, '$1').replace(',', '.');
  if ((m = s.match(/^(-?\d+(?:\.\d+)?)\s*(%|°|[a-zA-Zčšžřůáéíý²³]+.*)?$/))) return +m[1];
  return NaN;
}
ok(hodnota('1/3') === 1 / 3 && hodnota('1 500') === 1500 && hodnota('2 1/2') === 2.5 && hodnota('-3,5') === -3.5 && hodnota('15 %') === 15 && Number.isNaN(hodnota('x = 5')),
  'nezávislý parser hodnoty (zlomek, smíšené číslo, tisíce, čárka, jednotka)');

// úlohy všech misí (základ + banka) se stejnými stuby jako rpg-content-quality
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a; global.gcd = function g(a, b) { return b ? g(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ','); global.skl = (n, o, f, m) => n === 1 ? o : (n >= 2 && n <= 4 ? f : m);
global.shuffleArr = a => a; global.countDiv = () => 1;
let src = ''; for (const g of [3, 4, 5, 6, 7, 8, 9]) for (const f of ['rpg-mat-' + g + '.html', 'rpg-tasks-' + g + '.js']) src += fs.readFileSync(P(f), 'utf8');
[...new Set(src.match(/\bsvg[A-Z]\w*/g) || [])].forEach(k => { global[k] = () => '<svg></svg>'; });

const nal = { razeni: [], dupl: [], zapis: [] }; let razeniN = 0, paryN = 0, misi = 0;
for (const g of [3, 4, 5, 6, 7, 8, 9]) {
  const html = fs.readFileSync(P('rpg-mat-' + g + '.html'), 'utf8');
  const AREAS = new Function('return ' + html.match(/const AREAS\s*=\s*(\[[\s\S]*?\n\s*\];)/)[1].replace(/;\s*$/, ''))();
  const EXPRED = global['RPG_TASK_EXTRA_' + g];
  new Function(fs.readFileSync(P('rpg-tasks-' + g + '.js'), 'utf8'))();
  const EX = global['RPG_TASK_EXTRA_' + g] || {};
  ok(EX !== EXPRED && Object.keys(EX).length > 0, `${g}. ročník: banka úloh se načetla (${Object.keys(EX).length} misí)`);
  for (const ar of AREAS) for (const mi of ar.missions) {
    const pool = [];
    for (let i = 0; i < 12; i++) { try { pool.push(...(mi.tasks() || [])); } catch (e) {} if (EX[mi.id]) try { pool.push(...(EX[mi.id]() || [])); } catch (e) {} }
    misi++;
    for (let k = 0; k < 30; k++) {
      const it = TT.pickOrderItems(pool, 5);
      if (it) for (const x of it) { razeniN++; const v = hodnota(x.ans);
        if (!(Math.abs(x.v - v) < 1e-9)) nal.razeni.push(`${g}/${mi.id}: „${x.ans}“ řazeno jako ${x.v}, správně ${+v.toFixed(4)}`); }
      const pary = TT.pickPairs(pool, 4);
      if (pary) { paryN++;
        const h = pary.map(p => hodnota(p.a)), vid = pary.map(p => zobraz(p.a));
        const st = new Set(h.filter(Number.isFinite).map(x => Math.round(x * 1e9)));
        if (st.size < h.filter(Number.isFinite).length) nal.dupl.push(`${g}/${mi.id}: ${pary.map(p => p.a).join(' | ')}`);
        for (const z of vid) if (/\d\.\d|(^|[\s(])-\d/.test(z)) nal.zapis.push(`${g}/${mi.id}: „${z}“`); }
    }
  }
}
const uk = a => [...new Set(a)].slice(0, 3).join(' · ');
ok(razeniN > 10000 && paryN > 3000 && misi === 147, `proměřeno ${misi} misí: ${razeniN} položek řazení, ${paryN} spojovaček`);
ok(nal.razeni.length === 0, 'řazení: každá položka se řadí podle skutečné hodnoty (zlomky, tisíce)', nal.razeni.length + '× — ' + uk(nal.razeni));
ok(nal.dupl.length === 0, 'spojovačka: žádná hodnota dvakrát (ani jiným zápisem)', nal.dupl.length + '× — ' + uk(nal.dupl));
ok(nal.zapis.length === 0, 'spojovačka: výsledek s desetinnou čárkou a znakem minus', nal.zapis.length + '× — ' + uk(nal.zapis));

console.log(`\n══════════════════════════════════════════\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n══════════════════════════════════════════`);
process.exit(fail ? 1 : 0);
