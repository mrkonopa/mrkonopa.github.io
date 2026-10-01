/**
 * Obrázky u úloh v RPG (3.–9. ročník) — se SKUTEČNÝMI kreslicími funkcemi her.
 *
 * Poučení z přijímaček (obrázky v testu nanečisto, září 2026): obrázek má
 * ukázat zadanou situaci, ne ji vyřešit, a jeho proporce nesmí lhát.
 * Naměřeno 30. 9. 2026 na RPG:
 *
 *  1) OBRÁZEK PROZRADIL VÝSLEDEK:
 *     • 7/7-2 „Kvádr má objem V a podstavu a × b. Jak vysoký je (hrana c)?"
 *       — na obrázku stálo rovnou c (65–78 % losů; zbytek jen proto, že
 *       c vyšlo stejné jako a nebo b, takže bylo i v zadání). Tohle pravidlo
 *       hlídá.
 *     • 9/1-3 teploměr a ponorka — šipka „+b" na číselné ose končila přímo
 *       na výsledku. To je prozrazení KRESBOU, ne popiskem, takže ho pravidlo
 *       nevidí; šipka šla pryč a osa ukazuje jen start.
 *     Pravidlo počítá podíl losů ve skupině (ročník / mise / tvar zadání),
 *     kde je výsledek na obrázku a NENÍ v zadání. Náhodná shoda je v pořádku:
 *     „Kolik stupňů chybí úhlu 45° do pravého?" má výsledek 45 právě ve
 *     čtvrtině losů. Práh 40 % leží mezi náhodou (25 %) a skutečným
 *     prozrazením (nejméně 65 %).
 *
 *  2) KVÁDR S POPISKY PROTI PROPORCÍM — v 45 % kvádrů stálo „2" u nejdelší
 *     nakreslené hrany a „9" u nejkratší. svgCuboid teď dává popisky podle
 *     velikosti (šířka > výška > hloubka); popisek, který není číslo („?"),
 *     pořadí nemění.
 *
 * Spusť: node tests/rpg-obrazky.test.cjs
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), P = f => path.join(ROOT, 'projects', f);
const GRADES = [3, 4, 5, 6, 7, 8, 9];
const ITER = Number(process.env.ITER || 100);

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function g(a, b) { return b ? g(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, a, b, c) => n === 1 ? a : (n >= 2 && n <= 4 ? b : c);
global.shuffleArr = a => a;
global.countDiv = () => 1;

// Kreslicí funkce ročníku: 6./7./8. mají vlastní kopie v HTML, 9. sdílené
// rpg-svg-9.js, 1. stupeň svgRect v HTML. Tělo se vezme počítáním závorek.
function vytahni(src) {
  const out = [], re = /function (svg(?!AttrRadar)\w+)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    let j = src.indexOf('{', src.indexOf(')', m.index)), d = 0;
    for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } }
    out.push([m[1], src.slice(m.index, j + 1)]);
  }
  return out;
}
// Čísla na stupnici osy (data-nltick) se nepočítají: číselná osa popisuje
// KAŽDÉ celé číslo v rozsahu, takže výsledek mezi nimi leží vždycky a nic
// neprozrazuje. Prozrazovala ho šipka, která na něm končila — ta šla pryč
// (rpg-tasks-9.js, mise 1-3) a pravidlem se hlídat nedá, je to kresba.
const POPISEK = /<text(?![^>]*data-nltick)[^>]*>([^<]*)<\/text>/g;
const popisky = svg => [...String(svg).matchAll(POPISEK)].map(m => m[1].trim());
const cislo = s => { const t = String(s).replace(/[−–]/g, '-').replace(/\s+/g, '').replace(/(cm|dm|mm|km|m|l|kg|g|°|Kč|cm²|cm³|dm³|m²|m³)$/, '').replace(',', '.'); return /^-?\d+(\.\d+)?$/.test(t) ? +t : null; };
const vZadani = (hodnota, text) => {
  const t = String(text).replace(/[−–]/g, '-').replace(/-\s+(\d)/g, '-$1').replace(/(\d)\.(\d)/g, '$1,$2');
  const h = String(hodnota).replace('.', ',').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(^|[^\\d,])' + h + '($|[^\\d,])').test(t);
};

let obrazku = 0, chybGeneratoru = 0, kvadru = 0;
const obrazkuRoc = {};
const skupiny = {}, kvadrZle = [];
for (const g of GRADES) {
  const html = fs.readFileSync(P('rpg-mat-' + g + '.html'), 'utf8');
  const kresby = vytahni(g === 9 ? fs.readFileSync(P('rpg-svg-9.js'), 'utf8') : html);
  for (const [jm, kod] of kresby) global[jm] = new Function(kod + '\n;return ' + jm)();
  const kvadr = global.svgCuboid;
  // pořadí popisků kvádru se čte z výstupu: šířka, výška, hloubka
  if (g >= 6 && g !== 8) global.svgCuboid = (...a) => { const s = kvadr(...a); global.__kvadry.push(s); return s; };
  global.__kvadry = [];
  const AREAS = new Function('return ' + html.match(/const AREAS\s*=\s*(\[[\s\S]*?\n\s*\];)/)[1].replace(/;\s*$/, ''))();
  global.window = {};
  new Function(fs.readFileSync(P('rpg-tasks-' + g + '.js'), 'utf8'))();
  const EX = global.window['RPG_TASK_EXTRA_' + g] || {};
  AREAS.forEach(ar => ar.missions.forEach(mi => {
    for (const [zdroj, gen] of [['základ', mi.tasks], ['banka', EX[mi.id]]]) if (gen) for (let i = 0; i < ITER; i++) {
      let ulohy;
      try { ulohy = gen() || []; } catch (e) { chybGeneratoru++; continue; }
      for (const t of ulohy) {
        if (!t || !t.svg) continue;
        obrazku++; obrazkuRoc[g] = (obrazkuRoc[g] || 0) + 1;
        const text = String(t.text || ''), klic = g + '/' + mi.id + ' ' + zdroj + ' | ' + text.replace(/\d+/g, '#').replace(/\n/g, ' ').slice(0, 70);
        const sk = skupiny[klic] = skupiny[klic] || { n: 0, prozradi: 0 };
        sk.n++;
        const an = cislo(t.ans);
        const hit = popisky(t.svg).find(l => (an !== null && cislo(l) === an) || (an === null && l && l === String(t.ans).trim()));
        if (hit !== undefined && !vZadani(hit, text)) sk.prozradi++;
      }
    }
  }));
  for (const s of global.__kvadry) {
    kvadru++;
    const [a, b, c] = popisky(s).map(cislo);
    if (a !== null && b !== null && c !== null && !(a >= b && b >= c)) kvadrZle.push(g + '. roč.: ' + popisky(s).join(' / '));
  }
}

console.log('\n── Obrázky u úloh (3.–9. ročník) ──');
ok(chybGeneratoru === 0, 'žádný generátor nespadl (' + chybGeneratoru + ')');
// Naměřeno 16 500 obrázků při ITER=100 (dřív 12 700, +3 800 z obdélníků,
// čtverců a trojúhelníků 1. stupně); rozbité načtení kreseb dá desítky.
ok(obrazku > 15000, 'prohlédnuto ' + obrazku + ' obrázků (podlaha 15 000)');
/* 1. stupeň zvlášť: v celkovém součtu by ztráta obrázků v jednom ročníku
   zapadla. Počty jsou PŘESNĚ stabilní (každá šablona obdélníku, čtverce
   a trojúhelníku obrázek vydá vždy): 3. roč. 2 000, 4. roč. 1 000,
   5. roč. 1 100 při ITER=100. Dřív měl každý jen 100 (jediná šablona). */
const ROC1 = { 3: 20, 4: 10, 5: 11 };
const malo = Object.entries(ROC1).filter(([g, n]) => (obrazkuRoc[g] || 0) < n * ITER).map(([g, n]) => g + '. roč. ' + (obrazkuRoc[g] || 0) + ' < ' + n * ITER);
ok(malo.length === 0, '1. stupeň: obdélníky, čtverce a trojúhelníky mají obrázek (' + [3, 4, 5].map(g => g + '. ' + (obrazkuRoc[g] || 0)).join(', ') + ')', malo.join(', '));
const prozrazene = Object.entries(skupiny).filter(([, s]) => s.n >= 20 && s.prozradi / s.n > 0.40);
ok(prozrazene.length === 0, 'žádný obrázek neprozradí výsledek, který v zadání není (práh 40 % losů skupiny)',
  prozrazene.map(([k, s]) => Math.round(100 * s.prozradi / s.n) + ' % ' + k).join(' | '));
// Naměřeno 2 400 kvádrů při ITER=100 (6., 7. a 9. ročník).
ok(kvadru > 1500, 'prohlédnuto ' + kvadru + ' kvádrů (podlaha 1 500)');
ok(kvadrZle.length === 0, 'kvádr má největší číslo u nejdelší nakreslené hrany (šířka ≥ výška ≥ hloubka)',
  kvadrZle.length + '× — ' + kvadrZle.slice(0, 3).join(' | '));

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail > 0 ? 1 : 0);
