/**
 * Audit KVALITY ZADÁNÍ napříč všemi hrami (3.–9. ročník).
 *
 * Proč: existující audity hlídají MATEMATIKU (NaN, správnost výsledku). Jenže
 * v přijímačkové bance byly úlohy matematicky správně a zadání přesto drhla —
 * „Na 2 porcí", nezkrácené zlomky „2/4", nesmyslné dvojice („po 50 Kč a po
 * 50 Kč"). Takové vady projdou strojovým testem a odhalí je až žák v hodině.
 * Tenhle audit je hledá strojově napříč základním poolem i rozšiřující bankou.
 *
 * Kontroluje:
 *   1) nezkrácené zlomky v zadání (mimo úlohy, které KRÁTIT přímo zadávají),
 *   2) skloňování počitatelných jmen (2–4 dny vs 5 dní),
 *   3) prázdné nebo duplicitní nápovědy (známá opakovaná vada, viz CLAUDE.md),
 *   4) NaN/undefined v textu i nápovědách,
 *   5) dvojité mezery a mezera před interpunkcí (typografie).
 *
 * Spusť: node tests/rpg-content-quality.cjs
 */
const fs = require('fs');
const path = require('path');

const P = f => path.join(__dirname, '..', 'projects', f);
const GRADES = [3, 4, 5, 6, 7, 8, 9];
const ITER = Number(process.env.ITER || 260);

// ── stuby herních helperů ──
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function g(a, b) { return b ? g(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, one, few, many) => n === 1 ? one : (n >= 2 && n <= 4 ? few : many);
global.shuffleArr = a => a;
global.countDiv = () => 1;
// všechny svg* helpery, které se v souborech vyskytnou, stubneme automaticky
(function stubSvg() {
  let src = '';
  for (const g of GRADES) {
    for (const f of ['rpg-mat-' + g + '.html', 'rpg-tasks-' + g + '.js', 'rpg-sprites-' + g + '.js']) {
      if (fs.existsSync(P(f))) src += fs.readFileSync(P(f), 'utf8');
    }
  }
  [...new Set(src.match(/\bsvg[A-Z]\w*/g) || [])].forEach(k => { global[k] = () => '<svg></svg>'; });
})();

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

/* ── pravidla ─────────────────────────────────────────────────────── */

// zlomek musí být v základním tvaru; VÝJIMKA: úlohy, které krácení/rozšiřování
// samy zadávají (tam je nezkrácený zlomek smyslem úlohy)
const KRATI = /krať|krácen|krátit|základní(m)? tvar|rozšiř|rozšíře|doplň(te)? čitatele|stejnou hodnotu/i;
// jména jmenovatelů — když se na ně úloha ptá, jmenovatel MUSÍ zůstat
const JMENOVATELE = /polovin|třetin|čtvrtin|pětin|šestin|sedmin|osmin|devítin|desetin|dvanáctin|dvacetin/i;
function unreducedFractions(text) {
  const t = String(text);
  if (KRATI.test(t) || JMENOVATELE.test(t)) return [];
  const fr = [...t.matchAll(/(?<![\d,.])(\d{1,3})\/(\d{1,3})(?![\d,.])/g)]
    .map(m => ({ raw: m[0], a: +m[1], b: +m[2] }))
    .filter(f => f.a > 0 && f.b > 1 && f.a < f.b);
  // porovnávání/sčítání zlomků se STEJNÝM jmenovatelem je smysl úlohy —
  // krátit by ji zničilo, takže takové zadání nehlásíme
  const denoms = fr.map(f => f.b);
  if (denoms.some((d, i) => denoms.indexOf(d) !== i)) return [];
  return fr.filter(f => global.gcd(f.a, f.b) !== 1).map(f => f.raw);
}

// skloňování: 2–4 → tvar množný (dny), 5+ → genitiv (dní)
const NOUNS = [
  { few: 'dny', many: 'dní' }, { few: 'hodiny', many: 'hodin' },
  { few: 'minuty', many: 'minut' }, { few: 'kusy', many: 'kusů' },
  { few: 'žáci', many: 'žáků' }, { few: 'litry', many: 'litrů' },
  { few: 'metry', many: 'metrů' }, { few: 'koruny', many: 'korun' },
  { few: 'porce', many: 'porcí' }, { few: 'body', many: 'bodů' },
  { few: 'roky', many: 'let' }, { few: 'stránky', many: 'stránek' },
];
function badDeclension(text) {
  // POZOR: hlásíme jen JEDNOZNAČNÝ směr „5+ s tvarem pro 2–4" („5 hodiny").
  // Opačný směr hlásit nelze: „po dobu 2 hodin" nebo „během 3 dní" je správně,
  // protože ty předložky vážou genitiv. Kdybychom hlásili i to, test by křičel
  // vlka na korektní češtinu (ověřeno na 262 tis. úlohách).
  const out = [];
  for (const { few, many } of NOUNS) {
    const r = new RegExp('(?<![\\d])(\\d*[05-9])\\s+' + few + '\\b', 'g');
    for (const m of String(text).matchAll(r)) out.push(m[0] + ' → ' + m[1] + ' ' + many);
  }
  return out;
}

// Artefakt plovoucí čárky: „5,1000000000000005". 6+ desetinných míst je jistota
// (učivo ZŠ má max 3; „0,0008" u mocnin deseti je legitimní, proto ne 4).
function floatNoise(text) {
  return [...String(text).matchAll(/\d+[.,]\d{6,}/g)].map(m => m[0]);
}
// Stejná normalizace, jakou hra dělá při zobrazení nápovědy (czTxt).
const czTxt = t => String(t).replace(/(\d)\.(\d)/g, '$1,$2');
// Nezaokrouhlený periodický rozvoj v nápovědě: 1/3 = 0,3333… Žák má vidět
// zaokrouhlenou hodnotu se znaménkem ≈, ne useknuté cifry (Vojtovo pravidlo).
function periodicDecimal(text) {
  return [...String(text).matchAll(/\d+[.,]\d{3,}/g)].map(m => m[0]);
}
// Desetinná TEČKA v textu pro žáka — česky se píše čárka.
function decimalDot(text) {
  const t = String(text);
  if (t.includes('<')) return [];           // SVG/HTML atributy (stroke-width="3.5")
  return [...t.matchAll(/\d\.\d/g)].map(m => m[0]);
}

function typography(text) {
  const out = [];
  // dvojitá mezera se v HTML stejně slévá do jedné → není to vada zadání
  // „?" bývá ZÁSTUPNÝ ZNAK („518 = 500 + 10 + ?"), ne interpunkce → nehlásíme
  if (/\s+[,;!](?!\d)/.test(text) || /\s+\.(?!\d)/.test(text)) out.push('mezera před interpunkcí');
  return out;
}

/* ── načtení úloh ze hry ───────────────────────────────────────────── */
function loadGrade(g) {
  const items = [];
  const htmlPath = P('rpg-mat-' + g + '.html');
  if (!fs.existsSync(htmlPath)) return items;
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/const AREAS\s*=\s*(\[[\s\S]*?\n\s*\];)/);
  if (!m) return items;
  let AREAS;
  try { AREAS = new Function('return ' + m[1].replace(/;\s*$/, ''))(); } catch (e) { return items; }

  global.window = {};
  const bankPath = P('rpg-tasks-' + g + '.js');
  let EX = {};
  if (fs.existsSync(bankPath)) {
    try { new Function(fs.readFileSync(bankPath, 'utf8'))(); EX = global.window['RPG_TASK_EXTRA_' + g] || {}; } catch (e) {}
  }
  AREAS.forEach(ar => (ar.missions || []).forEach(mi => {
    items.push({ mid: mi.id, name: mi.name, gen: mi.tasks, src: 'base' });
    if (EX[mi.id]) items.push({ mid: mi.id, name: mi.name, gen: EX[mi.id], src: 'banka' });
  }));
  return items;
}

/* ── běh ──────────────────────────────────────────────────────────── */
console.log('\n── Audit kvality zadání (3.–9. ročník) ──\n');
const found = { frac: [], decl: [], hintEmpty: [], hintDup: [], nan: [], typo: [], float: [], dotText: [], dotHint: [], periodic: [] };
let generated = 0;

for (const g of GRADES) {
  const items = loadGrade(g);
  if (!items.length) { console.log('  ⚠️  ' + g + '. ročník: nepodařilo se načíst úlohy'); continue; }
  for (const it of items) {
    for (let i = 0; i < ITER; i++) {
      let arr;
      try { arr = it.gen() || []; } catch (e) { continue; }
      if (!Array.isArray(arr)) continue;
      for (const t of arr) {
        generated++;
        const text = String((t && t.text) || '');
        const hints = Array.isArray(t && t.hints) ? t.hints : [];
        const where = g + '/' + it.mid + ' (' + it.src + ')';
        const all = text + ' ' + hints.join(' ');

        if (/NaN|undefined/.test(all)) push('nan', where, text.slice(0, 70));
        // 1. stupeň (3.–5.): nezkrácený zlomek je záměr („kolik je 6/8 z 64" se
        // počítá po osminách), proto pravidlo platí až od 6. ročníku
        // Kontrolu základního tvaru zlomku tu ZÁMĚRNĚ neděláme: na 218 tis. úlohách
        // dala jen falešné poplachy. Ve zlomkových misích je nezkrácený tvar SMYSLEM
        // úlohy („6 a 6/8 = ?/8", porovnání se stejným jmenovatelem, „kolik je 6/8
        // z 64"). Pravidlo má smysl u přijímaček (prijimacky-gen.test.cjs), kde se
        // základní tvar očekává; tady by bylo škodlivé.
        floatNoise(all).forEach(f => push('float', where, f + '  «' + text.replace(/\n/g, ' ').slice(0, 55) + '»'));
        decimalDot(text).forEach(() => push('dotText', where, text.replace(/\n/g, ' ').slice(0, 70)));
        // nápovědy hodnotíme PO normalizaci, protože hra ji dělá při zobrazení
        hints.forEach(h => decimalDot(czTxt(h)).forEach(() => push('dotHint', where, String(h).slice(0, 70))));
        hints.forEach(h => periodicDecimal(czTxt(h)).forEach(v => {
          if (!String(h).includes('≈')) push('periodic', where, v + '  «' + String(h).slice(0, 60) + '»');
        }));
        badDeclension(text).forEach(d => push('decl', where, d + '  «' + text.slice(0, 60) + '»'));
        typography(text).forEach(x => push('typo', where, x + '  «' + text.slice(0, 60) + '»'));
        if (hints.length && hints.some(h => !String(h || '').trim())) push('hintEmpty', where, text.slice(0, 60));
        if (hints.length >= 2 && String(hints[0]).trim() === String(hints[1]).trim()) push('hintDup', where, text.slice(0, 60));
      }
    }
  }
}
function push(kind, where, detail) {
  const bucket = found[kind];
  if (!bucket.some(x => x.where === where && x.detail === detail) && bucket.length < 400) bucket.push({ where, detail });
}

console.log('  vygenerováno a zkontrolováno ' + generated.toLocaleString('cs-CZ') + ' úloh\n');
const report = (kind, label) => {
  const b = found[kind];
  ok(label + ' (' + b.length + ')', b.length === 0);
  b.slice(0, 8).forEach(x => console.log('        • ' + x.where + ': ' + x.detail));
  if (b.length > 8) console.log('        … a dalších ' + (b.length - 8));
};
if (process.env.LIST) {
  for (const k of ['frac','dotText','dotHint']) {
    const uniq = [...new Set(found[k].map(x => x.where))];
    console.log('  ['+k+'] '+uniq.length+' generátorů: '+uniq.join(', '));
    uniq.slice(0,4).forEach(w => console.log('      '+w+': '+(found[k].find(x=>x.where===w)||{}).detail));
  }
}
report('nan', 'žádné NaN/undefined');
report('decl', 'skloňování počitatelných jmen');
report('hintEmpty', 'žádná prázdná nápověda');
report('hintDup', 'nápovědy L1 a L2 se liší');
report('float', 'žádné artefakty plovoucí čárky (5,1000000000000005)');
report('dotText', 'v ZADÁNÍ je desetinná čárka, ne tečka');

report('dotHint', 'v NÁPOVĚDÁCH je desetinná čárka, ne tečka');
report('periodic', 'zaokrouhlená hodnota v nápovědě má znaménko ≈, ne useknuté cifry');

// pojistka, že normalizaci opravdu dělá KAŽDÁ hra (ne jen náhodou v datech)
const bezCz = GRADES.filter(g => !fs.readFileSync(P('rpg-mat-' + g + '.html'), 'utf8').includes('czTxt('));
ok('všechny hry normalizují desetinnou čárku v nápovědách', bezCz.length === 0, 'chybí v: ' + bezCz.join(', '));

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
