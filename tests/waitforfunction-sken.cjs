/* ══════════════════════════════════════════════════════════════════════
   Skener volání page.waitForFunction(…) — sdílí ho test-pojistka
   (waitforfunction-volby.test.cjs) i jednorázový codemod.

   Playwright: waitForFunction(pageFunction, arg, options) — volby jsou až
   TŘETÍ. Zápis waitForFunction(fn, {timeout: N}) předá objekt jako ARGUMENT
   funkce a čeká se výchozích 30 s (naměřeno na Playwrightu 1.60: 30,0 s
   proti 1,0 s s null na místě argumentu).

   Bez parseru: v repozitáři je jediná závislost (playwright), takže ruční
   lexer, který zná řetězce, šablony s ${} (i vnořené), komentáře a regulární
   výrazy — jinak by závorka v řetězci nebo v /[)]/ rozhodila hloubku.

   najdiVolani(src) → [{ index, radek, args: [{ start, end, text }], druh }]
     druh: 'ok'        — 1 nebo 3 argumenty, nebo 2. argument není objekt voleb
           'volby'     — 2 argumenty a 2. je objekt jen s klíči timeout/polling
           'smisene'   — 2. argument je objekt s volbami I jinými klíči
           'nejasne'   — 0 nebo víc než 3 argumenty, nebo se volání nepodařilo
                         dočíst (lexer se ztratil) — test to musí ohlásit
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

const VOLBY = new Set(['timeout', 'polling']);

/* Projde zdroják a vrátí pole „významných“ pozic: pro každý znak mimo
   řetězce/komentáře/regex/text šablony je kod[i] === 1. Hloubku závorek
   pak počítáme jen na nich. */
function maska(src) {
  const n = src.length, m = new Uint8Array(n);
  let i = 0;
  const sablony = [];            // zásobník hloubky {} uvnitř ${…} pro vnořené šablony
  let posledni = '';             // poslední významný token (kvůli regexu vs. dělení)
  const predRegexem = /[(,=:[!&|?{};+\-*%<>~^]$|^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const k = src.indexOf('*/', i + 2); i = k < 0 ? n : k + 2; continue; }
    if (c === '"' || c === "'") {
      i++;
      while (i < n && src[i] !== c) { if (src[i] === '\\') i++; i++; }
      i++; posledni = 'str'; continue;
    }
    if (c === '`') { i = sablona(i + 1); posledni = 'str'; continue; }
    if (c === '}' && sablony.length && sablony[sablony.length - 1] === 0) {
      // konec ${…} — pokračuje text šablony
      sablony.pop(); i = sablona(i + 1); posledni = 'str'; continue;
    }
    if (c === '/' && predRegexem.test(posledni || '(')) {
      // regulární výraz: do neescapovaného / mimo třídu […]
      i++; let trida = false;
      while (i < n) {
        const z = src[i];
        if (z === '\\') { i += 2; continue; }
        if (z === '[') trida = true; else if (z === ']') trida = false;
        else if (z === '/' && !trida) break;
        else if (z === '\n') break;
        i++;
      }
      i++; while (i < n && /[a-z]/i.test(src[i])) i++;
      posledni = 'regex'; continue;
    }
    if (/\s/.test(c)) { i++; continue; }
    m[i] = 1;
    if (sablony.length) {
      if (c === '{') sablony[sablony.length - 1]++;
      else if (c === '}') sablony[sablony.length - 1]--;
    }
    if (/[A-Za-z_$0-9]/.test(c)) {
      let j = i; while (j < n && /[A-Za-z_$0-9]/.test(src[j])) { m[j] = 1; j++; }
      posledni = src.slice(i, j); i = j; continue;
    }
    posledni = c; i++;
  }
  return m;

  // text šablony od pozice p; vrátí pozici za koncem šablony nebo za „${“
  function sablona(p) {
    while (p < n) {
      if (src[p] === '\\') { p += 2; continue; }
      if (src[p] === '`') return p + 1;
      // „${“ i jeho párová „}“ jsou oddělovače šablony, ne závorky výrazu
      if (src[p] === '$' && src[p + 1] === '{') { sablony.push(0); return p + 2; }
      p++;
    }
    return n;
  }
}

/* Klíče nejvyšší úrovně objektového literálu „{ a: 1, b: 2 }“ (jen pro
   jednoduché literály, jaké se do waitForFunction píšou). */
function klice(text, m0, start) {
  const out = [];
  let hl = 0, cast = '', vKlici = true;
  for (let i = start + 1; i < start + text.length - 1; i++) {
    const c = text[i - start];
    if (!m0[i]) { if (vKlici && hl === 0) cast += c; continue; }
    if ('([{'.includes(c)) hl++;
    else if (')]}'.includes(c)) hl--;
    if (hl === 0 && c === ':' && vKlici) { out.push(cast.trim().replace(/^['"]|['"]$/g, '')); vKlici = false; cast = ''; continue; }
    if (hl === 0 && c === ',') { if (vKlici && cast.trim()) out.push(cast.trim()); vKlici = true; cast = ''; continue; }
    if (vKlici && hl === 0) cast += c;
  }
  if (vKlici && cast.trim()) out.push(cast.trim());     // zkrácený zápis { timeout }
  return out;
}

function najdiVolani(src) {
  const m = maska(src), vysledky = [];
  const re = /\bwaitForFunction\s*\(/g;
  let x;
  while ((x = re.exec(src))) {
    const otevr = src.indexOf('(', x.index);
    if (!m[x.index]) continue;                          // v řetězci nebo komentáři
    const radek = src.slice(0, x.index).split('\n').length;
    const args = []; let hl = 0, zac = otevr + 1, i = otevr, konec = -1;
    for (; i < src.length; i++) {
      if (!m[i]) continue;
      const c = src[i];
      if ('([{'.includes(c)) { hl++; continue; }
      if (')]}'.includes(c)) {
        hl--;
        if (hl === 0) { konec = i; break; }
        continue;
      }
      if (c === ',' && hl === 1) { args.push({ start: zac, end: i }); zac = i + 1; }
    }
    if (konec < 0) { vysledky.push({ index: x.index, radek, args: [], druh: 'nejasne' }); continue; }
    args.push({ start: zac, end: konec });
    for (const a of args) {                                // ořež mezery, zapamatuj text
      while (a.start < a.end && /\s/.test(src[a.start])) a.start++;
      while (a.end > a.start && /\s/.test(src[a.end - 1])) a.end--;
      a.text = src.slice(a.start, a.end);
    }
    const plne = args.filter(a => a.text.length);
    let druh = 'ok';
    if (plne.length === 0 || plne.length > 3 || plne.length !== args.length) druh = 'nejasne';
    else if (plne.length === 2 && plne[1].text[0] === '{' && plne[1].text.endsWith('}')) {
      const k = klice(plne[1].text, m, plne[1].start);
      const volby = k.filter(s => VOLBY.has(s)).length;
      if (volby && volby === k.length) druh = 'volby';
      else if (volby) druh = 'smisene';
    }
    vysledky.push({ index: x.index, radek, args: plne, druh });
  }
  return vysledky;
}

/* Má funkce (1. argument) parametry? U „volby“ by je codemod přepsal na null,
   takže taková volání se neopravují strojově, ale hlásí se k ručnímu posouzení. */
function maParametry(text) {
  const t = text.trim();
  let m = t.match(/^(?:async\s*)?\(([^)]*)\)\s*=>/);
  if (m) return m[1].trim().length > 0;
  if (/^(?:async\s+)?[A-Za-z_$][\w$]*\s*=>/.test(t)) return true;
  m = t.match(/^(?:async\s+)?function\s*[\w$]*\s*\(([^)]*)\)/);
  if (m) return m[1].trim().length > 0;
  return null;                                           // řetězec nebo odkaz na funkci — neznámé
}

module.exports = { najdiVolani, maParametry, maska };
