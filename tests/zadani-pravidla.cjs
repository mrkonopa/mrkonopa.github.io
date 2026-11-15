/* ═════════════════════════════════════════════════════════════════════════
   Pravidla zadání sdílená mezi audity (14. 11. 2026) — jedno místo, žádné kopie.
   Používá je `rpg-content-quality.audit.cjs` (banky misí) a `rpg-battle-questions.test.cjs`
   (živý souboj); stejná vada se totiž může objevit v každé bance (Vojtův pokyn z 30. 9.:
   zlepšení patří všude, kam se dá použít).
   ═════════════════════════════════════════════════════════════════════════ */
'use strict';
const czTxt = t => String(t).replace(/(\d)\.(\d)/g, '$1,$2');

/* ── „Kolik je celkem?“ u násobení musí říct, že číslo platí pro KAŽDÝ kus ──
   Hlášení žáka z Věže legend (5. 11. 2026): „5 beden obsahuje 27 součástek. Kolik součástek je celkem?“
   Odpověď je 5 · 27, jenže věta říká, že v pěti bednách je dohromady 27 — a žák správně napsal, že mu
   chybí počet beden. Stejná vada byla v 5. ročníku („Drak střeží 125 zlatých v 5 jeskyních. Kolik
   zlatých střeží celkem?“). Všechny dosavadní kontroly ji minuly, protože matematika byla konzistentní
   (odpověď i nápověda si odpovídaly) — jen zadání tvrdilo něco jiného než odpověď.
   Pravidlo: zadání se dvěma až třemi čísly, ve kterém se ptáme „celkem / dohromady / ve všech“ a odpověď je součin
   dvou čísel ze zadání, musí obsahovat signál „každý / po / jeden“. Vrací null (pravidlo se netýká),
   '' (v pořádku), nebo text vady. Poměr se vynechává: „v poměru 3 : 5, dohromady 40“ dává součin shodou okolností. */
const JEDNOTKA_SIGNAL = /každ|(?<![\p{L}\d])po(?![\p{L}\d])|jedn[aoyuéí]/iu;
function jednotkaChybi(text, ans) {
  const tx = czTxt(text).replace(/\s+/g, ' ');
  if (!/celkem|dohromady|ve všech/i.test(tx) || /poměr/i.test(tx)) return null;
  const cis = (tx.match(/\d+(?:,\d+)?/g) || []).map(x => parseFloat(x.replace(',', '.')));
  const v = parseFloat(String(ans).replace(',', '.').replace('−', '-'));
  if (cis.length < 2 || cis.length > 3 || !isFinite(v)) return null;
  let soucin = false;
  for (let a = 0; a < cis.length; a++) for (let b = a + 1; b < cis.length; b++) {
    // součin shodou okolností rovný i součtu (3,5 · 1,4 = 3,5 + 1,4 = 4,9; 2 · 2 = 2 + 2) se nepočítá — to je sčítání
    if (cis[a] > 1 && cis[b] > 1 && Math.abs(cis[a] * cis[b] - v) < 1e-9 && Math.abs(cis[a] + cis[b] - v) > 1e-9) soucin = true;
  }
  if (!soucin) return null;
  return JEDNOTKA_SIGNAL.test(tx) ? '' : 'součin bez „každý / po“ — zadání nepoví, že číslo platí pro jeden kus';
}

/* ── Shoda podmětu s přísudkem po číslovce 2–4 ──
   „3 dělníci přenese kamenné bloky“, „4 kohouti sezobe obilí“ (7. ročník, mise 4-2): po 2–4 stojí podmět v 1. pádě
   množného čísla, takže přísudek je v množném čísle („přenesou“, „sezobou“). Po 5 a víc je podmět ve 2. pádě a přísudek
   v jednotném („5 dělníků přenese“) — správně v bankách bylo jen to druhé. Pravidlo hledá podmět na -ci/-ti/-ni/-ové/-ři
   (alespoň 3 písmena před koncovkou, aby „při“ nebylo podmětem) následovaný slovem na -e/-á, které není spojka ani předložka.
   Tvary na -í („postaví“, „udělají“) se neposuzují: jsou stejné v jednotném i množném čísle. Vrací nalezený úsek, nebo null. */
const SHODA_NEPRISUDEK = /^(a|i|na|za|ve|se|je|ale|více|než|když|že|aby|kde|jak|co|tedy|dále|tam|tu|pak|dnes|zde)$/i;
function shodaPodmetu(text) {
  const tx = czTxt(text).replace(/\s+/g, ' ');
  const re = /(?<![\p{L}\d,])[234] (?:\p{L}+ )?\p{L}{3,}(?:ci|ti|ni|ové|ři|íci|ouři) (\p{L}+)(?![\p{L}])/gu;
  for (const m of tx.matchAll(re)) {
    if (/(e|á)$/i.test(m[1]) && !SHODA_NEPRISUDEK.test(m[1])) return m[0];
  }
  return null;
}

module.exports = { czTxt, jednotkaChybi, shodaPodmetu };
