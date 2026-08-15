/* Skloňování VEŠKERÉHO textu RPG her (shoda čísla a jména 1 / 2-4 / 5+).
   Rozšíření pojistky nad rpg-declension.test.cjs: kromě .text úloh skenuje i
   NÁPOVĚDY, názvy/intro misí a TEORII (rpg-learn) — vše vygenerované + statické —
   proti kurátorskému slovníku běžných počítaných jmen. Čistý Node.
   Ignoruje pádovou rekci (z/do/po dobu…), desetinná čísla a exponenty (6,2 / 10^3).
   Spusť: node tests/rpg-declension-all.test.cjs */
const fs = require('fs'), path = require('path');
const PROJ = path.join(__dirname, '..', 'projects');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m); } };

// ── mock globálů (jako audit) ──
global.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
global.gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => { const a = Math.abs(n); return a === 1 ? o : (a >= 2 && a <= 4 ? f : m); };
global.countDiv = n => { let c = 0; for (let i = 1; i <= Math.abs(n); i++) if (n % i === 0) c++; return c; };
['svgTriangle','svgLineGraph','svgCylinder','svgCone','svgSphere','svgSimilar','svgCuboid','svgTrapezoid','svgCircleR','svgMirror','svgRightTri','svgCyl','svgThales','svgParallelogram','svgPointSym','svgAngle','svgCross'].forEach(s => global[s] = () => '<svg></svg>');

// skl unit
ok(global.skl(1,'a','b','c')==='a','skl(1)');
ok(global.skl(3,'a','b','c')==='b'&&global.skl(4,'a','b','c')==='b','skl(2-4)');
ok(global.skl(5,'a','b','c')==='c'&&global.skl(0,'a','b','c')==='c','skl(5+/0)');

function extractAreas(h) {
  const s = h.indexOf('const AREAS'); if (s < 0) return null;
  let k = h.indexOf('[', s); const st = []; let inStr = false, sc = '', esc = false;
  for (; k < h.length; k++) { const c = h[k], t = st[st.length - 1];
    if (esc) { esc = false; continue; }
    if (inStr) { if (c === '\\') esc = true; else if (c === sc) inStr = false; continue; }
    if (t === '`') { if (c === '\\') esc = true; else if (c === '`') st.pop(); else if (c === '$' && h[k + 1] === '{') { st.push('E'); k++; } continue; }
    if (c === "'" || c === '"') { inStr = true; sc = c; continue; }
    if (c === '`') { st.push('`'); continue; }
    if (c === '[' || c === '{' || c === '(') { st.push(c); continue; }
    if (c === ')') { if (t === '(') st.pop(); continue; }
    if (c === '}') { if (t === '{' || t === 'E') st.pop(); continue; }
    if (c === ']') { if (t === '[') { st.pop(); if (!st.length) return h.slice(s, k + 1); } continue; }
  }
  return null;
}

// ── slovník: {sg,few,many} — few smí mít víc tvarů (nom+ak u životných maskulin) ──
const DICT = [
  ['den','dny','dní'],['minutu','minuty','minut'],['hodinu','hodiny','hodin'],['sekundu','sekundy','sekund'],
  ['týden','týdny','týdnů'],['rok','roky','let'],['litr','litry','litrů'],['minci','mince','mincí'],
  ['dukát','dukáty','dukátů'],['zlaťák','zlaťáky','zlaťáků'],['dublon','dublony','dublonů'],['kredit','kredity','kreditů'],
  ['bod','body','bodů'],['paket','pakety','paketů'],['uzel','uzly','uzlů'],['server','servery','serverů'],
  ['proces','procesy','procesů'],['oříšek','oříšky','oříšků'],['žalud','žaludy','žaludů'],['jablko','jablka','jablek'],
  ['vejce','vejce','vajec'],['strom','stromy','stromů'],['houbu','houby','hub'],['krok','kroky','kroků'],
  ['řadu','řady','řad'],['stranu','strany','stran'],['drahokam','drahokamy','drahokamů'],['šupinu','šupiny','šupin'],
  ['schod','schody','schodů'],['svitek','svitky','svitků'],['sochu','sochy','soch'],['sloup','sloupy','sloupů'],
  ['planetu','planety','planet'],['raketu','rakety','raket'],['asteroid','asteroidy','asteroidů'],['modul','moduly','modulů'],
  ['satelit','satelity','satelitů'],['sondu','sondy','sond'],['meteor','meteory','meteorů'],['knihu','knihy','knih'],
  ['projekt','projekty','projektů'],['sešit','sešity','sešitů'],['kus','kusy','kusů'],['stůl','stoly','stolů'],
  // životná maskulina: few = nom I akuzativ
  ['pracovník',['pracovníci','pracovníky'],'pracovníků'],['student',['studenti','studenty'],'studentů'],
  ['pirát',['piráti','piráty'],'pirátů'],['dělník',['dělníci','dělníky'],'dělníků'],['rytíř',['rytíři','rytíře'],'rytířů'],
  ['drak',['draci','draky'],'draků'],['kosmonaut',['kosmonauti','kosmonauty'],'kosmonautů'],['žák',['žáci','žáky'],'žáků'],
  ['dron','drony','dronů'],['tým','týmy','týmů'],
  /* Doplněno po nálezu „Kolik metrů urazí 3 otoček?" v 5. ročníku.
     Slovník tehdy pokrýval jen 34 % slov stojících za číslovkou, takže
     chyba u neznámého slova propadla — scanner je v pořádku, jen o tom
     slově nevěděl. Přidávám podstatná jména, která se v bankách reálně
     vyskytují a jejichž tvary jsou jednoznačné. */
  ['otočku','otočky','otoček'],['bednu','bedny','beden'],['sáček','sáčky','sáčků'],
  ['košík','košíky','košíků'],['hnízdo','hnízda','hnízd'],['komnatu','komnaty','komnat'],
  ['truhlu','truhly','truhel'],['bochník','bochníky','bochníků'],['poleno','polena','polen'],
  ['květinu','květiny','květin'],['světlušku','světlušky','světlušek'],['rubín','rubíny','rubínů'],
  ['perníček','perníčky','perníčků'],['větev','větve','větví'],['sluj','sluje','slují'],
];
const FORM2CLASS = {};
DICT.forEach(([sg, few, many]) => [[sg,0],[few,1],[many,2]].forEach(([f, ci]) => (Array.isArray(f) ? f : [f]).forEach(w => (FORM2CLASS[w] = FORM2CLASS[w] || new Set()).add(ci))));
const classOf = n => n === 1 ? 0 : (n >= 2 && n <= 4 ? 1 : 2);
// pádová rekce (genitiv/lokál/dativ) → pevný tvar nezávislý na počtu
const CASE_PREP = new Set(['z','ze','do','od','u','bez','během','dobu','kolem','okolo','vedle','podél','k','ke','ku','po','při']);
const bad = [];
const neznama = new Map();   // slova po číslovce, která slovník neumí posoudit
let videno = 0;               // kolikrát se naopak posoudit DALO
function scan(text, where) {
  const s = String(text).replace(/\n/g, ' ');
  const re = /([a-záčďéěíňóřšťúůýžA-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+)?\s*(\d+)\s+([a-záčďéěíňóřšťúůýž]{3,})/g; let m;
  while ((m = re.exec(s))) {
    const prev = (m[1] || '').toLowerCase(), n = parseInt(m[2], 10), w = m[3];
    const before = s[m.index + m[0].indexOf(m[2]) - 1] || '';
    if (',.^·'.includes(before)) continue;   // desetinné / exponent (6,2 / 10^3)
    if (CASE_PREP.has(prev)) continue;        // pádová rekce
    const cs = FORM2CLASS[w];
    /* Slovo, které slovník nezná, se posoudit nedá — a přesně tam se
       schovala chyba „3 otoček" i „3 bochníků". Dřív takové slovo prostě
       tiše propadlo. Teď se počítá, aby byla mezera vidět v logu. */
    if (!cs) { neznama.set(w, (neznama.get(w) || 0) + 1); continue; }
    videno++;
    if (!cs.has(classOf(n))) bad.push(where + ': „' + n + ' ' + w + '"');
  }
}

// unit test scanneru (pozitivní i negativní)
scan('mám 5 dní', 'ut1'); ok(bad.length === 0, 'scan: „5 dní" OK (5→gen)'); bad.length = 0;
scan('mám 3 dní', 'ut2'); ok(bad.length === 1, 'scan: „3 dní" flagne (má být dny)'); bad.length = 0;
scan('za 6,2 kreditů', 'ut3'); ok(bad.length === 0, 'scan: desetinné „6,2 kreditů" OK'); bad.length = 0;
scan('z 3 stromů', 'ut4'); ok(bad.length === 0, 'scan: pádová rekce „z 3 stromů" OK'); bad.length = 0;
bad.length = 0;

// ── harvest RPG textu ──
let gen = 0;
const add = (t, w) => { if (t && typeof t === 'string') { gen++; scan(t, w); } };
const walk = (o, w) => { if (!o) return; if (typeof o === 'string') { add(o, w); return; } if (Array.isArray(o)) return o.forEach(x => walk(x, w)); if (typeof o === 'object') for (const k in o) walk(o[k], w); };
for (const g of [3, 4, 5, 6, 7, 8, 9]) {
  global.window = {}; try { new Function(fs.readFileSync(path.join(PROJ, 'rpg-tasks-' + g + '.js'), 'utf8'))(); } catch (e) { ok(false, 'tasks-' + g + ' load: ' + e.message); }
  const ex = global.window['RPG_TASK_EXTRA_' + g] || {};
  for (let r = 0; r < 80; r++) for (const mid in ex) { if (typeof ex[mid] !== 'function') continue; let l; try { l = ex[mid](); } catch (e) { continue; } l.forEach(t => { add(t.text, 'tasks-' + g + '/' + mid); (t.hints || []).forEach(x => add(x, 'tasks-' + g + '/' + mid + '/hint')); }); }
  try { const api = require(path.join(PROJ, 'rpg-battle-' + g + '.js')); for (let s = 1; s < 250; s++) (api.build(s, 8) || []).forEach(q => add(q.text, 'battle-' + g)); } catch (e) {}
  try { const h = fs.readFileSync(path.join(PROJ, 'rpg-mat-' + g + '.html'), 'utf8'); const src = extractAreas(h); (src.match(/\bsvg\w+/g) || []).forEach(n => global[n] = () => '<svg></svg>'); const A = new Function(src + '\nreturn AREAS;')(); A.forEach(ar => { add(ar.name, 'base-' + g); add(ar.desc, 'base-' + g); ar.missions.forEach(m => { add(m.name, 'base-' + g + '/' + m.id); add(m.sub, 'base-' + g + '/' + m.id); add(m.intro, 'base-' + g + '/' + m.id); if (typeof m.tasks === 'function') for (let r = 0; r < 80; r++) m.tasks().forEach(t => { add(t.text, 'base-' + g + '/' + m.id); (t.hints || []).forEach(x => add(x, 'base-' + g + '/' + m.id + '/hint')); }); }); }); } catch (e) { ok(false, 'base-' + g + ': ' + e.message); }
  global.window = {}; try { new Function(fs.readFileSync(path.join(PROJ, 'rpg-learn-' + g + '.js'), 'utf8'))(); walk(global.window['RPG_LEARN_' + g], 'learn-' + g); } catch (e) {}
}
ok(gen > 20000, 'vygenerováno dost textu (' + gen + ')');

/* Kolik slov za číslovkou slovník vůbec pokrývá. Není to tvrdé pravidlo —
   většina neznámých slov nejsou skloňovaná podstatná jména („větší",
   „mezi", „odečti"). Ale kdyby pokrytí spadlo, přestal by test hlídat
   skoro cokoli, aniž by zčervenal. Proto se tiskne a drží nad podlahou. */
{
  const pokryto = videno + [...neznama.values()].reduce((a, b) => a + b, 0);
  const pct = pokryto ? (100 * videno / pokryto) : 0;
  console.log('\n  Slovník posoudil ' + videno + ' z ' + pokryto + ' slov za číslovkou (' + pct.toFixed(1) + ' %).');
  const top = [...neznama].sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log('  Nejčastější neposouzená (mezi nimi se schovalo „otoček" i „bochníků"):');
  console.log('    ' + top.map(([w, n]) => w + ' (' + n + ')').join(', '));
  ok(pct > 25, 'slovník pokrývá aspoň čtvrtinu slov za číslovkou (' + pct.toFixed(1) + ' %)');
}
const uniq = [...new Set(bad)];
ok(uniq.length === 0, 'skloňování VEŠKERÉHO RPG textu (' + uniq.length + ' nálezů)');
uniq.slice(0, 20).forEach(b => console.log('     · ' + b));

console.log('\n  Skloňování (vše): ' + pass + ' ✅  /  ' + fail + ' ❌  (zkontrolováno ' + gen + ' textů)');
process.exit(fail ? 1 : 0);
