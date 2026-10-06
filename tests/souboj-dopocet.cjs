/* Nezávislý dopočet odpovědí živého souboje ZE ZNĚNÍ otázky (sdílí rpg-battle-questions).
   Tvary zadání jsou vytěžené z výpisu všech sedmi bank (4. 10. 2026, ~330 tvarů); dřív se
   dopočítávaly jen tři vzory úměry a obecný výraz by zvládl 6–32 % otázek ročníku.
   dopocet(text) vrátí očekávanou hodnotu, nebo null („tvar neznám"). Vlastní parser výrazů
   (žádné eval): + − × · : ÷ / ^ ² ³ √ |…| a závorky. */
'use strict';
const SUP = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
const num = x => +String(x).replace(/−/g, '-').replace(',', '.');
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);

function vyraz(s0) {
  let s = String(s0).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + [...m].map(c => SUP[c]).join(''))
    .replace(/−/g, '-').replace(/[×·]/g, '*').replace(/[:÷]/g, '/').replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, '');
  let i = 0;
  const prim = () => {
    if (s[i] === '(') { i++; const v = add(); if (s[i] !== ')') throw 0; i++; return v; }
    if (s[i] === '|') { i++; const v = add(); if (s[i] !== '|') throw 0; i++; return Math.abs(v); }
    if (s[i] === '√') { i++; return Math.sqrt(prim()); }
    if (s[i] === '-') { i++; return -pow(); }
    const m = s.slice(i).match(/^\d+(?:\.\d+)?/); if (!m) throw 0; i += m[0].length; return +m[0];
  };
  const pow = () => { const b = prim(); if (s[i] === '^') { i++; return Math.pow(b, pow()); } return b; };
  const mul = () => { let v = pow(); while (s[i] === '*' || s[i] === '/') { const o = s[i++], w = pow(); v = o === '*' ? v * w : v / w; } return v; };
  const add = () => { let v = mul(); while (s[i] === '+' || s[i] === '-') { const o = s[i++], w = mul(); v = o === '+' ? v + w : v - w; } return v; };
  const v = add(); if (i !== s.length) throw 0; return v;
}
const zkus = s => { try { const v = vyraz(s); return Number.isFinite(v) ? v : null; } catch (e) { return null; } };
const cisla = s => [...String(s).matchAll(/[−-]?\d+(?:[.,]\d+)?/g)].map(m => num(m[0]));
const prumer = a => a.reduce((x, y) => x + y, 0) / a.length;
const median = a => { const b = [...a].sort((x, y) => x - y), k = b.length >> 1; return b.length % 2 ? b[k] : (b[k - 1] + b[k]) / 2; };
const JEDN = { 'dm>cm': 10, 'cm>mm': 10, 'm>cm': 100, 'km>m': 1000, 'kg>g': 1000, 't>kg': 1000, 'h>min': 60, 'm>mm': 1000, 'dm>mm': 100 };
const zn = o => (o === '+' ? 1 : -1);
const N = '([−-]?\\d+(?:[.,]\\d+)?)';
const R = (s, f) => ({ re: new RegExp(s.replace(/§/g, N)), f });
const VZORY = [
  R('dvojnásobek čísla §', m => 2 * num(m[1])),
  R('polovina z čísla §', m => num(m[1]) / 2),
  R('hned za číslem §', m => num(m[1]) + 1),
  R('Které číslo je větší\\? § nebo §', m => Math.max(num(m[1]), num(m[2]))),
  R('Zaokrouhli na (desítky|stovky|tisíce): §', m => { const k = { desítky: 10, stovky: 100, tisíce: 1000 }[m[1]]; return Math.round(num(m[2]) / k) * k; }),
  R('Zaokrouhli § na celé číslo', m => Math.round(num(m[1]))),
  R('^§ : § — jaký je zbytek', m => num(m[1]) % num(m[2])),
  R('Doplň chybějící číslo: § \\+ \\? = §', m => num(m[2]) - num(m[1])),
  R('Doplň: § × \\? = §', m => num(m[2]) / num(m[1])),
  R('^§ (dm|cm|m|km|kg|t|h) = \\?\\?\\? (min|cm|mm|m|kg|g)', m => num(m[1]) * JEDN[m[2] + '>' + m[3]]),
  R('Kolik minut je § hodin\\S* a § minut', m => 60 * num(m[1]) + num(m[2])),
  R('Obvod čtverce se stranou §', m => 4 * num(m[1])),
  R('(?:Čtverec se stranou § cm\\.(?: Vypočítej)? [Oo]bsah|Obsah čtverce se stranou §)', m => num(m[1] || m[2]) ** 2),
  R('Obvod obdélníku § cm a § cm', m => 2 * (num(m[1]) + num(m[2]))),
  R('Obdélník: a = § cm, b = § cm\\.(?: Vypočítej)? [Oo]bvod', m => 2 * (num(m[1]) + num(m[2]))),
  R('Obdélník: a = § cm, b = § cm\\.(?: Vypočítej)? [Oo]bsah', m => num(m[1]) * num(m[2])),
  R('Obsah obdélníku § cm × § cm', m => num(m[1]) * num(m[2])),
  R('Obvod trojúhelníku se stranami §, §, §', m => num(m[1]) + num(m[2]) + num(m[3])),
  R('§ větv\\S*[,.]? (?:na každé )?sedí (?:po )?§ ptá', m => num(m[1]) * num(m[2])),
  R('Na každé z(?:e)? § větví sedí § ptá', m => num(m[1]) * num(m[2])),
  R('Na § větvích sedí po § ptácích', m => num(m[1]) * num(m[2])),
  R('^§ oříšk\\S* rozdělíme rovně mezi §', m => num(m[1]) / num(m[2])),
  R('(?:nasbíral|má) § žalud\\S*,? (?:a )?víla §', m => num(m[1]) - num(m[2])),
  R('Modrá loď má § zlatých, červená §', m => num(m[1]) - num(m[2])),
  R('(?:Perníček|Jeden poklad|Jeden satelit) stojí § (?:Kč|kreditů)\\. Kolik (?:zaplatíš )?za §', m => num(m[1]) * num(m[2])),
  R('Ve? § bednách je po § mincích', m => num(m[1]) * num(m[2])),
  R('^§ zlat\\S* minc\\S* si rozdělí rovným dílem §', m => num(m[1]) / num(m[2])),
  R('Kolik je §/§ z čísla §', m => num(m[3]) * num(m[1]) / num(m[2])),
  R('(?:Aritmetický průměr|Průměr) čísel (.+?)(?:\\?| je)', m => prumer(cisla(m[1]))),
  R('Drak má § mincí, skřítek §\\. Kolikrát', m => num(m[1]) / num(m[2])),
  R('Rytíř ujede § km za den\\. Kolik za §', m => num(m[1]) * num(m[2])),
  R('^§/§ \\+ §/§ = \\?/§ \\(napiš čitatele\\)', m => (num(m[1]) / num(m[2]) + num(m[3]) / num(m[4])) * num(m[5])),
  R('Největší společný dělitel čísel § a §', m => gcd(num(m[1]), num(m[2]))),
  R('Nejmenší společný násobek čísel § a §', m => num(m[1]) * num(m[2]) / gcd(num(m[1]), num(m[2]))),
  R('Úhel α má velikost §°\\. Jak velký je úhel k němu vedlejší', m => 180 - num(m[1])),
  R('Krychle se hranou § cm\\. Objem', m => num(m[1]) ** 3),
  R('Krychle se hranou § cm\\. Povrch', m => 6 * num(m[1]) ** 2),
  R('souřadnice \\[§, §\\]\\. Kolik je součet', m => num(m[1]) + num(m[2])),
  R('rychlostí § tisíc km/h po dobu § h', m => num(m[1]) * num(m[2])),
  R('^§ % z čísla je §\\. Celé číslo', m => num(m[2]) * 100 / num(m[1])),
  R('^§ (?:kus\\S*|ks) stojí § Kč\\. Kolik stojí §', m => num(m[2]) / num(m[1]) * num(m[3])),
  R('Kvádr: § cm × § cm × § cm\\. Objem', m => num(m[1]) * num(m[2]) * num(m[3])),
  R('Kvádr: § cm × § cm × § cm\\. Povrch', m => { const [a, b, c] = [m[1], m[2], m[3]].map(num); return 2 * (a * b + a * c + b * c); }),
  R('Vypočítej: §/§ \\+ §/§', m => num(m[1]) / num(m[2]) + num(m[3]) / num(m[4])),
  R('Rozděl číslo § v poměru § : §\\. Jaká je větší část', m => num(m[1]) * Math.max(num(m[2]), num(m[3])) / (num(m[2]) + num(m[3]))),
  R('Vyřeš(?: rovnici)?: §\\s?x ([+−-]) § = §$', m => (num(m[4]) - zn(m[2]) * num(m[3])) / num(m[1])),
  R('Vyřeš: §\\s?x ([+−-]) § = §\\s?x ([+−-]) \\(?§\\)?$', m => (zn(m[5]) * num(m[6]) - zn(m[2]) * num(m[3])) / (num(m[1]) - num(m[4]))),
  R('Vyřeš: §\\(x \\+ §\\) = §', m => num(m[3]) / num(m[1]) - num(m[2])),
  R('Medián (?:čísel|souboru): (.+)$', m => median(cisla(m[1]))),
  R('Hodnota výrazu §\\s?([a-z]) ([+−-]) § pro \\2 = §', m => num(m[1]) * num(m[5]) + zn(m[3]) * num(m[4])),
  R('Zkrať zlomek:? §/§(?: na základní tvar)?\\. Napiš výsledný ČITATEL', m => num(m[1]) / gcd(num(m[1]), num(m[2]))),
  R('Kolik je § % z (?:čísla )?§', m => num(m[1]) * num(m[2]) / 100),
  R('Rovnoběžník: základna § cm, výška § cm', m => num(m[1]) * num(m[2])),
  R('Trojúhelník: základna § cm, výška § cm', m => num(m[1]) * num(m[2]) / 2),
  R('Měřítko 1 : §\\. Na mapě § cm\\. Vzdálenost ve skutečnosti\\? \\(m\\)', m => num(m[1]) * num(m[2]) / 100),
  R('Kruh: poloměr § cm\\. Obsah \\(π ≈ §\\)', m => num(m[2]) * num(m[1]) ** 2),
  R('Kruh: poloměr § cm\\. Obvod \\(π ≈ §\\)', m => 2 * num(m[2]) * num(m[1])),
  R('Válec: poloměr § cm, výška § cm\\. Objem \\(π ≈ §\\)', m => num(m[3]) * num(m[1]) ** 2 * num(m[2])),
  R('f\\(x\\) = §\\s?x ([+−-]) §\\. Kolik je f\\(\\(?§\\)?\\)', m => num(m[1]) * num(m[4]) + zn(m[2]) * num(m[3])),
  R('f\\(x\\) = §\\s?x ([+−-]) §\\. Pro jaké x platí f\\(x\\) = \\(?§\\)?', m => (num(m[4]) - zn(m[2]) * num(m[3])) / num(m[1])),
  R('Kolika procenty je § z §', m => num(m[1]) / num(m[2]) * 100),
  R('Pravoúhlý trojúhelník:? (?:má )?odvěsny §(?: cm)? a §', m => Math.hypot(num(m[1]), num(m[2]))),
  R('Pravoúhlý trojúhelník: přepona § cm, odvěsna § cm', m => Math.sqrt(num(m[1]) ** 2 - num(m[2]) ** 2)),
  R('Stroj vyrobí za § hodin\\S* § součástek\\. Kolik jich vyrobí za §', m => num(m[2]) / num(m[1]) * num(m[3])),
  R('^§ pracovní\\S+ postaví zeď za § hodin\\S*\\. Kolik hodin to bude trvat §', m => num(m[1]) * num(m[2]) / num(m[3])),
  R('Zjednoduš(?:te)?: §\\^?([⁰¹²³⁴-⁹]+|\\d+) · §\\^?([⁰¹²³⁴-⁹]+|\\d+) = §(?:\\^?\\?|ⁿ)', m => { const e = x => /\d/.test(x) ? +x : +[...x].map(c => SUP[c]).join(''); return e(m[2]) + e(m[4]); }),
  R('Zboží za § Kč (?:se )?zlevn\\S* o § %', m => num(m[1]) * (1 - num(m[2]) / 100)),
  R('Cena § Kč se zvýší o § %', m => num(m[1]) * (1 + num(m[2]) / 100)),
  R('Soustava rovnic: x \\+ y = § x [−-] y = § Kolik je x', m => (num(m[1]) + num(m[2])) / 2),
  R('Zapiš jako celé číslo: § · 10\\^?([⁰¹²³⁴-⁹]+|\\d+)', m => num(m[1]) * 10 ** (/\d/.test(m[2]) ? +m[2] : +[...m[2]].map(c => SUP[c]).join(''))),
  R('P = §\\(a \\+ b\\)\\. P = §, a = §\\. Kolik je b', m => num(m[2]) / num(m[1]) - num(m[3])),
  R('Geometrická posloupnost: §, §, §, §, … §\\. člen', m => num(m[1]) * (num(m[2]) / num(m[1])) ** (num(m[5]) - 1)),
  R('Jaké číslo následuje: (.+?), …', m => { const a = cisla(m[1]), n = a.length, d = a[n - 1] - a[n - 2];
    if (a.every((x, i) => i === 0 || Math.abs(x - a[i - 1] - d) < 1e-9)) return a[n - 1] + d;
    const q = a[n - 1] / a[n - 2]; return a.every((x, i) => i === 0 || Math.abs(x - a[i - 1] * q) < 1e-9) ? a[n - 1] * q : null; }),
  R('Zapiš zlomek §/§ jako desetinné číslo', m => num(m[1]) / num(m[2])),
  R('Z § kuliček (?:je|jsou) § červen\\S*\\. P\\(červená\\)', m => num(m[2]) / num(m[1])),
];
const PREFIX = /^(?:Vypočítej|Spočítej|Urči hodnotu výrazu|Urči|Kolik je|Vyčísli)\s*:?\s*(.+?)\s*(?:=\s*)?\??(?:\s*\((?:pozor|výsledek|jako)[^)]*\))?$/;
function dopocet(text, volby) {
  // „Které z těchto čísel je největší?“ — porovnávaná čísla jsou samy volby
  const v = String(text).match(/^Které z těchto čísel je (největší|nejmenší)\?$/);
  if (v && Array.isArray(volby)) { const c = volby.map(hodnota); return c.every(Number.isFinite) ? (v[1] === 'největší' ? Math.max(...c) : Math.min(...c)) : null; }
  const t = String(text).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().replace(/(\d) (?=\d{3}(?!\d))/g, '$1');
  for (const v of VZORY) { const m = t.match(v.re); if (m) { const r = v.f(m); return r == null || !Number.isFinite(r) ? null : r; } }
  const m = t.match(PREFIX); if (m) return zkus(m[1]);
  return null;
}
// hodnota odpovědi: číslo, zlomek, smíšené číslo, mezery v tisících, čárka, jednotka
function hodnota(a) {
  let s = String(a).trim().replace(/−/g, '-'), m;
  if ((m = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/))) return (+m[1] < 0 ? -1 : 1) * (Math.abs(+m[1]) + m[2] / m[3]);
  if ((m = s.match(/^(-?\d+)\/(\d+)$/))) return m[1] / m[2];
  s = s.replace(/(\d)\s(?=\d{3}\b)/g, '$1').replace(',', '.');
  if ((m = s.match(/^(-?\d+(?:\.\d+)?)\s*(%|°|[a-zA-Zčšžřůáéíý²³]+.*)?$/))) return +m[1];
  return NaN;
}
// shoda se zaokrouhlením na tolik míst, kolik jich má odpověď
function sedi(cekano, odpoved) {
  const v = hodnota(odpoved); if (!Number.isFinite(v)) return null;
  const d = (String(odpoved).match(/[.,](\d+)/) || [, ''])[1].length;
  return Math.abs(cekano - v) <= 0.5 * 10 ** -d + 1e-9;
}
module.exports = { dopocet, hodnota, sedi, vyraz };
