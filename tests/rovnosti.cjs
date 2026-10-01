/**
 * Skener rovností v postupech a nápovědách — sdílí ho prijimacky-dopocet,
 * prijimacky-postupy a rpg-content-quality (dřív kopie v každém zvlášť).
 *
 * Každé „výraz = výsledek" z čistých čísel se vyhodnotí. Od rovnítka se na
 * obě strany bere CELÝ souvislý aritmetický úsek (číslice, · × : + −,
 * závorky, desetinná čárka mezi číslicemi). Úsek přilepený k proměnné,
 * procentu, zlomku nebo mocnině se zahodí: „(2x − 3 + 1) = 34" není rovnost
 * čísel „3 + 1 = 34", a první verze kontroly, která vybírala úseky
 * regulárním výrazem, přesně takhle hlásila plané poplachy. Dvojtečka bez
 * mezery před sebou je za popiskem („Úterý: 240 · 1,25"), ne dělení
 * („50 : 2").
 *
 * Mínus se čte jen jako „−" (U+2212). Spojovník, který je ve skutečnosti
 * mínus („-6 + 4", „- (−15)"), převede `minusZeSpojovniku` — tak, jak ho
 * žák vidí.
 */
const ARITZ = /[\d·×:+−()\s,]/;
const PRILEPENO = /[\p{L}\d)²³%/√]/u;            // znak, na který úsek navazuje → není samostatný

function rovnostiVKroku(k) {
  const out = [];
  const pust = j => {
    const ch = k[j];
    if (!ARITZ.test(ch)) return false;
    if (ch === ':' && k[j - 1] !== ' ') return false;
    if (ch === ',' && !(/\d/.test(k[j - 1] || '') && /\d/.test(k[j + 1] || ''))) return false;
    return true;
  };
  for (let i = k.indexOf('='); i >= 0; i = k.indexOf('=', i + 1)) {
    let a = i; while (a > 0 && pust(a - 1)) a--;
    let b = i + 1; while (b < k.length && pust(b)) b++;
    const L = k.slice(a, i).trim(), R = k.slice(i + 1, b).trim();
    const pred = k.slice(0, a).replace(/\s+$/, '').slice(-1);
    const za = k.slice(b).replace(/^\s+/, '').charAt(0);
    if (!/\d/.test(L) || !/\d/.test(R)) continue;
    if (!/[·×:+−]/.test(L.replace(/^−/, ''))) continue;                 // vlevo musí být výpočet
    // Přilepené bez mezery („√81", „3/5", „x2"): úsek je jen kus většího zápisu.
    if (!/\s/.test(k[a] || '') && a > 0 && PRILEPENO.test(k[a - 1])) continue;
    if (!/\s/.test(k[b - 1] || '') && /[\p{L}(²³/%]/u.test(k[b] || '')) continue;   // „= 12x", „= 3²"
    // Začíná-li úsek operátorem, pokračuje výraz, který stojí vlevo od něj:
    // „(2x − 3 + 1) = 34". Unární minus je v pořádku jen po rovnítku, závorce
    // nebo popisku („= −42", „Úterý: −5 + 9").
    if (/^[·×:+]/.test(L) || (/^−/.test(L) && PRILEPENO.test(pred))) continue;
    if (/[·×:+−(]$/.test(L) || /[·×:+−(]$/.test(R)) continue;
    if (/[%/²³]/.test(za)) continue;                                       // „= 45 %", „= 6/25"
    out.push([L, R]);
  }
  return out;
}

function spocti(vyraz) {
  let e = vyraz.replace(/(\d) (?=\d{3}\b)/g, '$1').replace(/[·×]/g, '*').replace(/:/g, '/')
    .replace(/−/g, '-').replace(/,/g, '.').replace(/\s+/g, '');
  const otev = (e.match(/\(/g) || []).length, zav = (e.match(/\)/g) || []).length;
  if (zav > otev) e = '('.repeat(zav - otev) + e; else if (otev > zav) e += ')'.repeat(otev - zav);
  if (!/^[\d+\-*/().]+$/.test(e)) return null;
  try { const v = Function('"use strict";return (' + e + ')')(); return Number.isFinite(v) ? v : null; } catch (err) { return null; }
}

const blizko = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

// „-6 + 4", „- (−15)", „10 - 3" → s mínusem, jak se to žákovi ukáže
const minusZeSpojovniku = s => String(s).replace(/(^|[\s(=·×:+[])-\s?(?=[\d(])/g, '$1−').replace(/ - /g, ' − ');

/* Záporné číslo hned za operátorem patří do závorky: „2 · (−1) − 6", ne
   „2·-1−6"; „x = −4 : (−2)", ne „−4 : −2". Dvojtečka BEZ mezery před sebou
   je popisek („Výsledek: −30"), ne dělení. */
const ZA_OPERATOREM = /(?:[·×+−]|\s:|\s-)\s*[−-]\d/;

/* Všechny nesedící rovnosti v textu: [[L, R, hodnotaL], …] a počet vyhodnocených. */
function nesediciRovnosti(text) {
  const spatne = []; let videno = 0;
  for (const [L, R] of rovnostiVKroku(text)) {
    const l = spocti(L), r = spocti(R);
    if (l === null || r === null) continue;
    videno++;
    if (!blizko(l, r)) spatne.push([L, R, l]);
  }
  return { spatne, videno };
}

module.exports = { rovnostiVKroku, spocti, blizko, minusZeSpojovniku, ZA_OPERATOREM, nesediciRovnosti };
