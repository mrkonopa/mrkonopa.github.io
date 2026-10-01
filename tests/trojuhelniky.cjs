/**
 * Trojúhelník zadaný délkami stran musí jít sestrojit: součet dvou kratších
 * stran je VĚTŠÍ než nejdelší. Při rovnosti vznikne úsečka, ne trojúhelník.
 *
 * Sdílí ho audit RPG (rpg-content-quality) i audit banky testu nanečisto
 * (prijimacky-cermat-audit). Naměřeno 1. 10. 2026, když se pravidlo
 * zavádělo: ve 3. ročníku „Trojúhelníková stezka má úseky 23 m, 41 m a 84 m"
 * (úseky se losovaly nezávisle, 22 % nesestrojitelných), v 6. ročníku
 * „Rameno … je 7 cm, základna 14 cm" (základna VŽDY dvojnásobek ramene,
 * tedy 100 %), v 7. ročníku „strany 8 cm, 11 cm a 3 cm" (třetí strana
 * jen ri(3, i + j − 1), 11 %) a strany v otázce „Jsou shodné?" bez kontroly.
 *
 * trojuhelniky(text, ans) vrátí VŠECHNY rozpoznané trojúhelníky zadání:
 *   [{ strany: [a, b, c], ok }]
 * Volající si sám počítá, kolik jich posoudil — bez té pojistky by pravidlo
 * po změně tvaru zadání tiše mlčelo.
 *
 * Rozpoznává tvary, které v bankách skutečně jsou:
 *   „strany 3 cm, 8 cm a 10 cm", „úseky 23 m, 41 m a 84 m",
 *   „strany 4, 10, 11 cm" (i víc trojic v jednom zadání),
 *   „ramena po 6 cm a základnu 5 cm", „Rameno … je 7 cm, základna 13 cm",
 *   „… Dvě strany měří 6 cm a 8 cm. Kolik měří třetí strana?" (třetí = odpověď),
 *   rovnoramenný se základnou z a obvodem o (ramena (o − z) / 2).
 * Otázka, zda úsečky MOHOU být stranami trojúhelníku, se přeskakuje — tam je
 * nesestrojitelná trojice smyslem úlohy.
 */
const U = '(mm|cm|dm|km|m)(?![\\p{L}\\d])';
const C = '(\\d+(?:,\\d+)?)';
const VZORY = [
  new RegExp(C + ' ' + U + ', ' + C + ' \\2 a ' + C + ' \\2', 'gu'),          // 3 cm, 8 cm a 10 cm
  new RegExp(C + ', ' + C + ',? (?:a )?' + C + ' ' + U, 'gu'),               // 4, 10, 11 cm
];
const cislo = s => +String(s).replace(',', '.');
const sestrojitelny = s => { const [a, b, c] = [...s].sort((x, y) => x - y); return a > 0 && a + b > c; };

function trojuhelniky(text, ans) {
  text = String(text || '').replace(/\n/g, ' ');
  if (!/trojúhel/i.test(text)) return [];
  if (/(?<!\p{L})(mohou|můžou|může|lze|dá se)(?!\p{L})[^.?]*(sestroj|stranami|existova)/iu.test(text)) return [];
  const out = [];
  const pridej = s => out.push({ strany: s, ok: sestrojitelny(s) });
  let m;
  for (const re of VZORY) {
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      const n = m.slice(1).filter(x => /^\d/.test(x || '')).map(cislo);
      if (n.length === 3) pridej(n);
    }
  }
  if (/rovnoramenn/iu.test(text)) {
    // „ramen" jen na začátku slova — uvnitř „rovnoramenný" by vzor chytil cokoli
    const r = text.match(new RegExp('(?<!\\p{L})[Rr]amen\\w*[^\\d.?]{0,40}?' + C + ' ' + U, 'u'));
    const z = text.match(new RegExp('základn\\w*[^\\d.?]{0,25}?' + C + ' ' + U, 'u'));
    const o = text.match(new RegExp('obvod\\w*[^\\d.?]{0,12}?' + C + ' ' + U, 'u'));
    if (r && z) pridej([cislo(r[1]), cislo(r[1]), cislo(z[1])]);
    else if (o && z) { const ram = (cislo(o[1]) - cislo(z[1])) / 2; pridej([ram, ram, cislo(z[1])]); }
  }
  if (/třetí stran/iu.test(text) && !isNaN(cislo(ans))) {
    const d = text.match(new RegExp(C + ' ' + U + ' a ' + C + ' \\2', 'u'));
    if (d) pridej([cislo(d[1]), cislo(d[3]), cislo(ans)]);
  }
  return out;
}

module.exports = { trojuhelniky, sestrojitelny };
