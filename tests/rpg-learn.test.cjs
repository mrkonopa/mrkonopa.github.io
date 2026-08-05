/* ══════════════════════════════════════════════════════════════════
   Test: learning content (Teorie) pro ročníky 3.–9.

   Ověřuje moduly rpg-learn-N.js + zapojení s-learn v rpg-mat-N.html.

   Původně pokrýval jen 6.–9. — a přesně proto v něm přežila vada:
   ve 4. ročníku měly VŠECHNY příklady jen otázku a holý výsledek
   (`{q, a}`) místo kroků řešení (`{q, s:[…]}`). Renderer to nespadne,
   jen místo návodu ukáže odpověď, takže „vyřešený postup", kvůli
   kterému teorie existuje, tam chyběl. První stupeň se proto testuje
   taky a přibylo pravidlo na kroky řešení.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const PROJ = path.join(__dirname, '..', 'projects');
let pass = 0, fail = 0;
function ok(cond, msg, detail){ if(cond){pass++; console.log('  ✅ '+msg);} else {fail++; console.log('  ❌ '+msg+(detail?' — '+detail:''));} }

const GRADES = [3, 4, 5, 6, 7, 8, 9];
// Oba stupně mají historicky jiná jména polí u sekcí: 2. stupeň {h, p:[]},
// 1. stupeň {title, body}. Test počítá s obojím, ať neplatí jen na půlku her.
const sekceMaObsah = (x) => !!(x && ((x.h || x.title) && ((Array.isArray(x.p) && x.p.length) || x.body)));

for (const g of GRADES) {
  console.log(`\n── ${g}. ročník ──`);

  // 1) modul rpg-learn-N.js
  const modPath = path.join(PROJ, `rpg-learn-${g}.js`);
  ok(fs.existsSync(modPath), `rpg-learn-${g}.js existuje`);
  const sandbox = { window: {} };
  const code = fs.readFileSync(modPath, 'utf8');
  new Function('window', code)(sandbox.window);
  const L = sandbox.window[`RPG_LEARN_${g}`];
  ok(L && typeof L === 'object', `window.RPG_LEARN_${g} je objekt`);
  const keys = Object.keys(L || {});
  ok(keys.length === 21, `obsahuje 21 misí (má ${keys.length})`);

  // každá mise má intro a aspoň jednu sekci; video je null nebo {id,title}
  let structOK = true, videoOK = true, vids = 0;
  for (const k of keys) {
    const e = L[k];
    if (!e.intro || !Array.isArray(e.sections) || e.sections.length === 0) structOK = false;
    if (e.video !== null) {
      if (!e.video || typeof e.video.id !== 'string' || typeof e.video.title !== 'string') videoOK = false;
      else vids++;
    }
  }
  ok(structOK, 'každá mise má intro + alespoň jednu sekci');

  /* ÚVOD MÁ VTÁHNOUT DO PŘÍBĚHU, ne být popiskem z obsahu učebnice.
     Hry stojí na světě se strážci misí, ale první stupeň a 9. ročník
     měly úvody typu „Pořadí operací a obory čísel — základ každého
     výpočtu." — správně, ale žáka to nikam nezve.

     Pozor na detekci: symboly jako ⚖️ ⚗️ ⛰️ ✨ ⚙️ leží MIMO blok emoji
     (U+1F300–1FAFF). Když jsem je do rozsahu nezahrnul, vyšlo mi, že
     7. a 8. ročník příběh nemá — a přitom má. Proto se hlídá i délka
     a přítomnost přímé řeči, ne jen jeden znakový rozsah. */
  {
    const maZnak = (t) => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(t);
    const maRec = (t) => /[„“"]/.test(t);
    const ploche = keys.filter(k => {
      const t = L[k].intro || '';
      return !(maZnak(t) || maRec(t)) || t.length < 60;
    });
    ok(ploche.length === 0,
      'úvod mise vtahuje do příběhu, není to holý popisek tématu',
      ploche.slice(0, 3).map(k => k + ': «' + String(L[k].intro).slice(0, 42) + '»').join(' | '));
  }
  ok(videoOK, 'video je všude buď null, nebo {id,title}');
  console.log(`     (misí s videem: ${vids})`);

  // sekce musí mít nadpis i text — prázdná sekce projde tvarem, ale žák
  // v ní nic nenajde
  {
    const prazdne = keys.filter(k => (L[k].sections || []).some(x => !sekceMaObsah(x)));
    ok(prazdne.length === 0, 'žádná sekce není bez nadpisu nebo bez textu',
      prazdne.slice(0, 3).join(', '));
  }

  /* ŘEŠENÝ POSTUP — hlavní smysl teorie.

     Pozor na míru: na 2. stupni jsou postupy často zhuštěné do jednoho
     řádku („67 + 48 = 67 + 40 + 8 = 115"), a to je pro třináctileté
     v pořádku. Pravidlo „aspoň dva kroky" by na ně křičelo vlka.
     Skutečná vada byla jiná — ve 4. ročníku stálo místo postupu holé
     „6". Hlídá se tedy to, co odlišuje vadu od zhuštění: příklad musí
     mít kroky (`s`), ne jen odpověď (`a`), a text musí ukazovat práci,
     ne pouhou hodnotu. */
  {
    const vsechny = keys.flatMap(k => (L[k].examples || []).map(e => ({ k, e })));
    ok(vsechny.length >= keys.length, `příklady existují (${vsechny.length})`);

    const holyVysledek = vsechny.filter(x => !Array.isArray(x.e.s) || !x.e.s.length);
    ok(holyVysledek.length === 0,
      'každý příklad má kroky řešení (`s`), ne jen odpověď (`a`)',
      holyVysledek.slice(0, 3).map(x => x.k + ': ' + String(x.e.q).slice(0, 38)).join(' | '));

    // Ukazuje postup = je tam rovnítko/šipka/dvojtečka, nebo je to věta.
    const ukazujePostup = (t) => /[=→:]/.test(t) || (t.includes(' ') && t.length >= 18);
    const bezPostupu = vsechny.filter(x => {
      const t = (x.e.s || []).join(' ').replace(/<[^>]+>/g, '').trim();
      return t && !ukazujePostup(t);
    });
    ok(bezPostupu.length === 0,
      'řešení ukazuje postup, ne jen holou hodnotu',
      bezPostupu.slice(0, 3).map(x => x.k + ': «' + (x.e.s || []).join(' ').slice(0, 30) + '»').join(' | '));
  }

  // mise odpovídají vzoru oblast-mise 1-1 … 7-3
  const expected = [];
  for (let a = 1; a <= 7; a++) for (let m = 1; m <= 3; m++) expected.push(`${a}-${m}`);
  ok(expected.every(id => keys.includes(id)), 'klíče misí odpovídají 1-1 … 7-3');

  // 2) zapojení v rpg-mat-N.html
  const htmlPath = path.join(PROJ, `rpg-mat-${g}.html`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  ok(html.includes('id="s-learn"'), 'HTML má obrazovku s-learn');
  ok(html.includes('function startLearn'), 'HTML má funkci startLearn');
  ok(html.includes('function renderLearn'), 'HTML má funkci renderLearn');
  if (g >= 6) ok(html.includes('function launchLearnBattle'), 'HTML má funkci launchLearnBattle');
  ok(html.includes(`window.RPG_LEARN_${g}`), `renderLearn čte RPG_LEARN_${g}`);
  ok(html.includes(`./rpg-learn-${g}.js`), `HTML načítá rpg-learn-${g}.js`);
  if (g >= 6) ok(html.includes("if(active.id==='s-learn'){launchLearnBattle();}"), 's-learn má klávesovou zkratku');
  ok(html.includes('startLearn('), 'tlačítko Teorie volá startLearn');
}

console.log('\n══════════════════════════════════════════');
console.log(`  VÝSLEDEK: ${pass} ✅  /  ${fail} ❌`);
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
