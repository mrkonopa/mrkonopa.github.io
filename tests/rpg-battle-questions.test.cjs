/* ══════════════════════════════════════════════════════════════════════
   Audit bank otázek živého souboje — VŠECH SEDM ročníků (3.–9.).

   Do teď se kontrolovala JEN devítka: soubor měl natvrdo
   `require('projects/rpg-battle-9.js')` a žádný parametr ročníku.
   Šest ze sedmi bank tedy nikdy nikdo strojově neprošel — a otázky
   souboje běží NAŽIVO PŘED TŘÍDOU, takže je vada vidět okamžitě všem.
   Je to stejný vzorec jako u „najdi chybu", kde se roky testovala jen
   devítka a šest sad karet leželo bez dozoru.

   Druhá mezera byla v tom, CO se kontrolovalo. `choices[correct] ===
   answer` je KRUH — porovnává odpověď samu se sebou, takže projde
   i generátor, který počítá špatně. Přesně tak se schovaly dvě vady
   v 8. ročníku (viz `KONTROLY_OBSAHU` níže).

   Kontroluje se: API, determinismus, validita MC, česká desetinná
   čárka, artefakty plovoucí čárky a u rozpoznaných témat i to, že
   odpověď SKUTEČNĚ vychází ze zadání.

   Spusť: node tests/rpg-battle-questions.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ROCNIKY = [3, 4, 5, 6, 7, 8, 9];

let pass = 0, fail = 0;
const ok = (label, cond, d) => { if (cond) { pass++; } else { fail++; console.error('  ✗', label, d ? `[${d}]` : ''); } };

/* Dopočet zadání u témat, která umíme přečíst. Vrací očekávanou
   hodnotu, nebo null („tvar neznáme"). Tohle je jediná kontrola, která
   pozná špatně počítající generátor — zbytek je jen struktura. */
const KONTROLY_OBSAHU = [
  // 8. ročník: obě větve úměry byly rozbité (viz rpg-battle-8.js)
  { téma: /nepřímá úměra/, re: /^(\d+) \S+ \S+ zeď za (\d+) \S+\. Kolik hodin to bude trvat (\d+)/,
    spočti: m => +m[1] * +m[2] / +m[3] },
  { téma: /přímá úměra/, re: /za (\d+) \S+ (\d+) \S+\. Kolik jich vyrobí za (\d+)/,
    spočti: m => +m[2] / +m[1] * +m[3] },
  { téma: /úměra/, re: /^(\d+) (?:ks|\S+) stojí (\d+) Kč\. Kolik stojí (\d+)/,
    spočti: m => +m[2] / +m[1] * +m[3] },
];

let celkemOtazek = 0, dopocteno = 0;

for (const g of ROCNIKY) {
  const B = require(path.join(ROOT, `projects/rpg-battle-${g}.js`));
  const P = `g${g}`;

  // 1) API
  ok(`${P}: modul existuje`, !!B);
  ok(`${P}: build je funkce`, typeof B.build === 'function');
  ok(`${P}: game = RPG_MAT_${g}`, B.game === `RPG_MAT_${g}`);
  ok(`${P}: topicCount > 8`, B.topicCount > 8, B.topicCount);

  // 2) determinismus
  let detOk = true;
  for (let s = 1; s <= 300; s++) {
    if (JSON.stringify(B.build(s, 10)) !== JSON.stringify(B.build(s, 10))) { detOk = false; break; }
  }
  ok(`${P}: determinismus (300 seedů)`, detOk);

  // 3) různé seedy → různé sady
  let diff = 0;
  for (let s = 1; s <= 200; s++) if (JSON.stringify(B.build(s, 10)) !== JSON.stringify(B.build(s + 1000, 10))) diff++;
  ok(`${P}: různé seedy dávají různé sady (>180/200)`, diff > 180, diff);

  // 4) validita + obsah
  let badNaN = 0, badChoices = 0, badCorrect = 0, badAnswer = 0, badDup = 0, badEmpty = 0;
  let tecka = 0, artefakt = 0, n = 0;
  const obsahNalezy = [];
  for (let s = 1; s <= 1500; s++) {
    const qs = B.build(s, 12);
    if (qs.length !== 12) badEmpty++;
    for (const q of qs) {
      n++; celkemOtazek++;
      if (!Array.isArray(q.choices) || q.choices.length !== 4) { badChoices++; continue; }
      if (new Set(q.choices).size !== 4) badDup++;
      if (q.correct < 0 || q.correct > 3) badCorrect++;
      if (q.choices[q.correct] !== q.answer) badAnswer++;
      for (const c of q.choices) {
        const str = String(c);
        if (c === undefined || c === null || c === '' || /NaN|undefined/.test(str)) badNaN++;
        /* Zadání píše „1,8 + 1,5", volby ukazovaly „3.4" — a mezi nimi
           svítilo 3.1999999999999997, protože distraktory vznikaly jako
           `v + 0.1` bez zaokrouhlení. */
        if (/(?<![\d.])\d+\.\d+(?![\d.])/.test(str)) tecka++;
        const des = str.match(/^-?\d+[.,](\d+)$/);
        if (des && des[1].length > 3) artefakt++;
      }
      if (!q.text || /NaN|undefined/.test(q.text)) badNaN++;

      const txt = String(q.text).replace(/\n/g, ' ');
      for (const k of KONTROLY_OBSAHU) {
        if (!k.téma.test(q.topic || '')) continue;
        const m = txt.match(k.re);
        if (!m) continue;
        dopocteno++;
        const čekáno = k.spočti(m);
        const dáno = parseFloat(String(q.answer).replace(',', '.'));
        if (Math.abs(čekáno - dáno) > 1e-9 && obsahNalezy.length < 3)
          obsahNalezy.push(`„${txt.slice(0, 60)}" → vychází ${čekáno}, hra čeká ${q.answer}`);
        break;
      }
    }
  }
  ok(`${P}: vždy 12 otázek v sadě`, badEmpty === 0, badEmpty);
  ok(`${P}: žádné NaN/undefined`, badNaN === 0, badNaN);
  ok(`${P}: přesně 4 možnosti`, badChoices === 0, badChoices);
  ok(`${P}: žádné duplicitní možnosti`, badDup === 0, badDup);
  ok(`${P}: correct index 0..3`, badCorrect === 0, badCorrect);
  ok(`${P}: choices[correct] === answer`, badAnswer === 0, badAnswer);
  ok(`${P}: volby mají desetinnou ČÁRKU, ne tečku`, tecka === 0, tecka);
  ok(`${P}: žádné artefakty plovoucí čárky ve volbách`, artefakt === 0, artefakt);
  ok(`${P}: odpověď vychází ze zadání`, obsahNalezy.length === 0, obsahNalezy.join(' | '));

  // 5) clamp a okrajové seedy
  ok(`${P}: count<1 → aspoň 1 otázka`, B.build(7, 0).length >= 1);
  ok(`${P}: count>40 → max 40 otázek`, B.build(7, 999).length <= 40);
  let z = true; try { B.build(0, 10); } catch (e) { z = false; }
  ok(`${P}: seed 0 bez pádu`, z);
}

/* Pojistka proti planému běhu: kdyby se tvar zadání změnil, dopočet by
   nic nerozpoznal a mlčel by. Naměřeno ~3 500 dopočítaných. */
ok(`dopočet obsahu se vůbec měřil (${dopocteno})`, dopocteno > 2000, `dopočítáno jen ${dopocteno}`);

console.log(`\n${'═'.repeat(52)}`);
console.log(`  BATTLE QUESTIONS (7 ročníků): ${pass} ✅  /  ${fail} ❌`);
console.log(`  ${celkemOtazek} otázek · ${dopocteno} dopočítaných`);
console.log('═'.repeat(52));
process.exit(fail === 0 ? 0 : 1);
