/**
 * Volby u úloh s výběrem (MC) — všech 7 ročníků, boj, trénink i věž.
 *
 * Poučení z přijímaček: „správně ± k" prozradí odpověď i bez počítání.
 * Naměřeno 30. 9. 2026 na skutečném kódu her (správná odpověď podle
 * VELIKOSTI mezi čtyřmi volbami, 1 = nejmenší):
 *
 *   3. roč. 1 % / 11 % / 88 % / 0 %   ← „vezmi druhou největší" = 88 %
 *   4. roč. 1 % / 36 % / 63 % / 0 %
 *   5. roč. 0 % / 59 % / 41 % / 0 %
 *   6.–9.   0–3 % / 25–31 % / 48–53 % / 17–22 %
 *
 * Příčina v 1. stupni: sousední hodnoty se přidávaly v pevném pořadí
 * (−1, +1, −2), ve 2. stupni navíc VŽDY opačné znaménko — to je u kladné
 * odpovědi vždycky nejmenší volba, a v 6. ročníku (záporná čísla se ještě
 * neučí) stálo u 99,9 % úloh. Po opravě (mcRozloz / mcVolby2 v rpg-shared.js)
 * je největší podíl jednoho místa 33 % a nejmenší 13 %.
 *
 * Prahy jsou odvozené z OBOU stran: nejvyšší podíl ≤ 40 % (nová verze 33 %,
 * nejlepší stará 48 %), nejnižší ≥ 8 % (nová 13 %, staré 0–3 %).
 *
 * Spusť: node tests/rpg-mc-volby.test.cjs
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), P = f => path.join(ROOT, 'projects', f);

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function g(a, b) { return b ? g(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, a, b, c) => n === 1 ? a : (n >= 2 && n <= 4 ? b : c);
global.countDiv = () => 1;

// Tělo funkce podle jména — počítá závorky, takže vezme celou definici.
function fn(src, jm) {
  const i = src.indexOf('function ' + jm + '(');
  if (i < 0) return null;
  let j = src.indexOf('{', src.indexOf(')', i)), d = 0;
  for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } }
  return src.slice(i, j + 1);
}
const shared = fs.readFileSync(P('rpg-shared.js'), 'utf8');
const SDILENE = ['czMC', 'mcZaporne', 'mcRozloz', 'mcCislo', 'mcVolby2'];
ok(SDILENE.every(j => fn(shared, j)), 'rpg-shared.js nabízí ' + SDILENE.join(', '));

const cislo = v => parseFloat(String(v).replace(/\s/g, '').replace(',', '.').replace('−', '-'));
const ITER = Number(process.env.ITER || 300);

for (const g of [3, 4, 5, 6, 7, 8, 9]) {
  console.log('\n── ' + g + '. ročník ──');
  const html = fs.readFileSync(P('rpg-mat-' + g + '.html'), 'utf8');
  const kod = [...SDILENE.map(j => fn(shared, j)), fn(html, 'shuffleArr')];
  for (const jm of ['mcDistractors', '_mcWrong', '_mcVolby', 'renderMC']) { const f = fn(html, jm); if (f) kod.push(f); }
  // renderMC skládá tlačítka do DOM — stačí zapisovač, který si je zapamatuje
  const grid = { btns: [], set innerHTML(v) { this.btns = []; }, style: {}, appendChild(b) { this.btns.push(b); } };
  global.document = {
    getElementById: () => grid,
    createElement: () => ({ dataset: {}, set innerHTML(v) { this.textContent = v.replace(/<span[^>]*>[^<]*<\/span>/, ''); } })
  };
  const api = new Function(kod.join('\n') + '\n;return { renderMC, shuffleArr, mcZaporne };')();
  global.shuffleArr = api.shuffleArr;

  const src = html + fs.readFileSync(P('rpg-tasks-' + g + '.js'), 'utf8');
  [...new Set(src.match(/\bsvg[A-Z]\w*/g) || [])].forEach(k => { global[k] = () => ''; });
  const AREAS = new Function('return ' + html.match(/const AREAS\s*=\s*(\[[\s\S]*?\n\s*\];)/)[1].replace(/;\s*$/, ''))();
  global.window = {};
  new Function(fs.readFileSync(P('rpg-tasks-' + g + '.js'), 'utf8'))();
  const EX = global.window['RPG_TASK_EXTRA_' + g] || {};

  const misto = [0, 0, 0, 0, 0];
  let n = 0, spatnyPocet = 0, zapornaNavic = 0;
  const zapPriklad = [];
  AREAS.forEach(ar => ar.missions.forEach(mi => {
    if (!mi.mc) return;
    for (const gen of [mi.tasks, EX[mi.id]].filter(Boolean)) for (let i = 0; i < ITER; i++) for (const t of gen() || []) {
      if (!t || /^(ano|ne)$/i.test(String(t.ans).trim()) || (Array.isArray(t.mc_opts) && t.mc_opts.length >= 2)) continue;
      api.renderMC(t);
      const volby = grid.btns.map(b => b.textContent);
      const spr = cislo(t.ans), cis = volby.map(cislo);
      if (isNaN(spr) || cis.some(isNaN)) continue;
      n++;
      if (volby.length !== 4 || new Set(volby).size !== 4 || !cis.some(x => Math.abs(x - spr) < 1e-9)) { spatnyPocet++; continue; }
      misto[1 + cis.filter(x => x < spr - 1e-9).length]++;
      // Záporná volba u nezáporné odpovědi jen tam, kde úloha pracuje se zápornými
      // čísly. Kurátorský distraktor generátoru se nepočítá — v 7.–9. ročníku bývá
      // chyba ve znaménku skutečně typická („x − 10 = 3“ → −7); ve 3.–6. ročníku
      // záporná čísla hlídá obsahový audit (pravidlo zap16) i u něj.
      const kur = (t.distractors || []).map(cislo);
      if (spr >= 0 && cis.some(x => x < 0 && !kur.some(k => Math.abs(k - x) < 1e-9)) && !api.mcZaporne(t)) {
        zapornaNavic++;
        if (zapPriklad.length < 2) zapPriklad.push(mi.id + ' „' + String(t.text).replace(/\n/g, ' ').slice(0, 50) + '" → ' + volby.join(' / '));
      }
    }
  }));
  ok(n > 5000, 'změřeno ' + n + ' číselných úloh s výběrem (podlaha 5 000)');
  ok(spatnyPocet === 0, 'vždy 4 různé volby a mezi nimi správná', spatnyPocet + '×');
  const podil = misto.slice(1).map(x => x / Math.max(1, n - spatnyPocet));
  const txt = podil.map(x => Math.round(100 * x) + ' %').join(' / ');
  ok(Math.max(...podil) <= 0.40, 'správná odpověď nestojí pořád na stejném místě podle velikosti (' + txt + '; nejvýš 40 %)');
  ok(Math.min(...podil) >= 0.08, 'správná bývá i nejmenší a největší volbou (nejméně 8 %)', txt);
  ok(zapornaNavic === 0, 'záporná volba u nezáporné odpovědi jen u úloh se zápornými čísly', zapornaNavic + '× — ' + zapPriklad.join(' | '));
}

console.log('\n── Jedna implementace pro boj, trénink i věž ──');
const hry2 = [6, 7, 8, 9].map(g => [g, fs.readFileSync(P('rpg-mat-' + g + '.html'), 'utf8')]);
const vez = fs.readFileSync(P('rpg-2stupen.js'), 'utf8');
ok(hry2.every(([, h]) => /mcVolby2\(t\)/.test(fn(h, 'renderMC')) && /mcVolby2\(t\)/.test(fn(h, 'trRenderMC'))),
  '6.–9. ročník: boj i trénink berou volby ze sdíleného mcVolby2');
ok(/mcVolby2\(t\)/.test(fn(vez, 'twRenderMC')) && /_mcVolby\(t\)/.test(fn(vez, 'twRenderMC')),
  'věž legend bere volby ze sdíleného mcVolby2 a zná uzavřený výběr (mc_opts)');
const kopie = [...hry2, ['věž', vez]].filter(([, h]) => /czMC\(-cn\)/.test(h)).map(([g]) => g);
ok(kopie.length === 0, 'nikde nezůstala stará kopie „vždy opačné znaménko"', kopie.join(', '));

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail > 0 ? 1 : 0);
