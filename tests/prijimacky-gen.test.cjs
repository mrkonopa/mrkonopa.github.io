/* prijimacky-gen.test.cjs — korektnost doplňkových generátorů (Fáze 3b).
   Pro každý generátor NEZÁVISLE přepočítá očekávaný výsledek z surových čísel
   (_check) a porovná s ans. Chytí chybu ve vzorci (typografie/matika = správnost).
   Čistý Node (bez prohlížeče). */
const fs = require('fs');
const path = require('path');

// Prostředí pro IIFE modul: window + ri (jako v ../rpg-svg-9.js)
global.window = {};
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
eval(fs.readFileSync(path.join(__dirname, '..', 'projects/prijimacky-matematika/prijimacky-gen.js'), 'utf8'));
const GEN = global.window.PZ_GEN;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m); } };

// Nezávislý přepočet očekávané odpovědi z _check (NEpoužívá _check.expect).
function expected(c) {
  switch (c.kind) {
    case 'deleni': return (c.total % (c.a + c.b) === 0) ? Math.max(c.a, c.b) * (c.total / (c.a + c.b)) : NaN;
    case 'prima': return (c.cost1 % c.n1 === 0) ? (c.cost1 / c.n1) * c.n2 : NaN;
    case 'neprima': { const t = c.w1 * c.d1; return (t % c.w2 === 0) ? t / c.w2 : NaN; }
    case 'meritko': { const r = c.mapCm * c.scale / 100; return Number.isInteger(r) ? r : NaN; }
    case 'prumer': { const s = c.vals.reduce((a, b) => a + b, 0); return (s % c.vals.length === 0) ? s / c.vals.length : NaN; }
    case 'prumerPridani': { const v = (c.n * c.avg + c.nv) / (c.n + 1); return Number.isInteger(v) ? v : NaN; }
    case 'mocnina': return c.a ** c.n;
    case 'odmocnina': { const r = Math.sqrt(c.sq); return Number.isInteger(r) ? r : NaN; }
    case 'mocninaVyraz': return c.a * c.a - c.b * c.c;
    case 'zlomekCelku': return (c.celek % c.q === 0) ? (c.celek / c.q) * c.p : NaN;
    case 'zlomekZbytek': return (c.celek % c.q === 0) ? c.celek - (c.celek / c.q) * c.p : NaN;
    case 'zlomekPocet': return c.N * c.q;
    case 'dosazeniLin': return c.a * c.v + c.b;
    case 'dosazeniKvadrat': return c.v * c.v + c.a * c.v;
    case 'dosazeniZavorka': return c.a * (c.v + c.b) - c.c;
    case 'rovniceLin': return ((c.c - c.b) % c.a === 0) ? (c.c - c.b) / c.a : NaN;
    case 'rovniceZlomek': return (c.c - c.b) * c.a;
    case 'soucetRozdil': return ((c.S + c.D) % 2 === 0) ? (c.S + c.D) / 2 : NaN;
    case 'nakup': return c.a * c.p + c.b * c.q;
    case 'procCast': return ((c.p * c.celek) % 100 === 0) ? (c.p * c.celek) / 100 : NaN;
    case 'procZaklad': return ((c.X * 100) % c.p === 0) ? (c.X * 100) / c.p : NaN;
    case 'procKolik': return ((c.X * 100) % c.celek === 0) ? (c.X * 100) / c.celek : NaN;
    case 'median': { const s = [...c.vals].sort((a, b) => a - b); return s[2]; }
    case 'modus': { const f = {}; let best = null, bc = 0; c.arr.forEach(v => { f[v] = (f[v] || 0) + 1; if (f[v] > bc) { bc = f[v]; best = v; } }); return best; }
    case 'rozsah': return Math.max(...c.vals) - Math.min(...c.vals);
    case 'draha': return c.v * c.t;
    case 'cenaDoprava': return c.a * c.p + c.d;
    case 'zbyva': return c.M - c.a * c.p;
    case 'slevaCena': return c.X * (100 - c.p) / 100;
    case 'navyseniCena': return c.X * (100 + c.p) / 100;
    case 'urok': return ((c.jist * c.p) % 100 === 0) ? (c.jist * c.p) / 100 : NaN;
    case 'smisene': return c.cele * c.q + c.p;
    case 'zlomekRozsir': return (c.q2 % c.q === 0) ? c.p * (c.q2 / c.q) : NaN;
    case 'castJeCelek': return c.jednotka * c.q;
    case 'mocnina10': return 10 ** c.n;
    case 'kvadratSouctu': return (c.a + c.b) ** 2;
    case 'odmocninaSoucin': return c.a * c.b;
    case 'dosazeniDve': return c.a * c.v + c.b * c.w;
    case 'vyrazSlovni': return c.mul * (c.v + c.pl);
    case 'rovniceZavorka': return (c.c % c.a === 0) ? (c.c / c.a - c.b) : NaN;
    case 'rovniceObeStrany': return ((c.d - c.b) % (c.a - c.c) === 0) ? (c.d - c.b) / (c.a - c.c) : NaN;
    case 'pomerDoplnit': return (c.b % c.a === 0) ? c.b * c.c / c.a : NaN;
    case 'obvodObd': return 2 * (c.a + c.b);
    case 'obsahObd': return c.a * c.b;
    case 'obsahCtverec': return c.a * c.a;
    case 'obvodCtverec': return 4 * c.a;
    case 'obsahTroj': return (c.a * c.v) % 2 === 0 ? c.a * c.v / 2 : NaN;
    case 'uhelVedlejsi': return 180 - c.x;
    case 'pythag': { const r = Math.sqrt(c.a * c.a + c.b * c.b); return Number.isInteger(r) ? r : NaN; }
    case 'objemKvadr': return c.a * c.b * c.c;
    case 'povrchKvadr': return 2 * (c.a * c.b + c.b * c.c + c.a * c.c);
    case 'objemKrychle': return c.a ** 3;
    case 'povrchKrychle': return 6 * c.a * c.a;
    case 'hranyKvadr': return 4 * (c.a + c.b + c.c);
    case 'objemLitr': return (c.a * c.b * c.c) % 1000 === 0 ? c.a * c.b * c.c / 1000 : NaN;
    // ── rozšíření banky (Fáze 3c) — každý přepočet NEZÁVISLE z surových čísel ──
    case 'poradiOperaci': { const k = Math.sqrt(c.sq); return Number.isInteger(k) ? c.a * c.a + c.b * c.c - k : NaN; }
    case 'rozdilMocnin': return c.a > c.b ? c.a * c.a - c.b * c.b : NaN;
    case 'zlomekZCasti': {
      if (c.celek % c.q !== 0) return NaN;
      const t1 = c.celek / c.q * c.p;
      return t1 % c.s === 0 ? t1 / c.s * c.r : NaN;
    }
    case 'zlomekZbytekDvakrat': {
      if (c.celek % c.q !== 0) return NaN;
      const po1 = c.celek - c.celek / c.q * c.p;
      return po1 % c.s === 0 ? po1 - po1 / c.s * c.r : NaN;
    }
    case 'dveSlevy': {
      const v1 = c.X * (100 - c.p) / 100;
      if (!Number.isInteger(v1)) return NaN;
      const v2 = v1 * (100 - c.r) / 100;
      return Number.isInteger(v2) ? v2 : NaN;
    }
    case 'dph': { const d = c.base * 21 / 100; return Number.isInteger(d) ? c.base + d : NaN; }
    case 'pomerTri': { const s = c.a + c.b + c.c; return c.total % s === 0 ? Math.max(c.a, c.b, c.c) * (c.total / s) : NaN; }
    case 'recept': {
      if (c.X % c.n1 !== 0) return NaN;
      const per = c.X / c.n1;
      return c.Y % per === 0 ? c.Y / per : NaN;
    }
    case 'dosazeniZlomek': { const t = c.a * c.v + c.b; return t % c.c === 0 ? t / c.c : NaN; }
    case 'obvodVyraz': return 2 * (c.x + (c.x + c.k));
    case 'rovniceDvojiZavorka': {
      if (c.a === c.c) return NaN;
      const num = c.c * c.d - c.a * c.b, den = c.a - c.c;
      return num % den === 0 ? num / den : NaN;
    }
    case 'rovnicePodil': return c.a * c.k - c.b;
    case 'vek': { const t = c.F - 2 * c.S; return t > 0 ? t : NaN; }
    case 'smes': { const tot = c.a * c.p + c.b * c.q, kg = c.a + c.b; return tot % kg === 0 ? tot / kg : NaN; }
    case 'lichobeznik': { const t = (c.a + c.c) * c.v; return t % 2 === 0 ? t / 2 : NaN; }
    case 'tretiUhel': { const g = 180 - c.al - c.be; return g > 0 ? g : NaN; }
    case 'hranol': { const t = c.a * c.va; return t % 2 === 0 ? (t / 2) * c.v : NaN; }
    case 'hranaZObjemu': { const a = Math.round(Math.cbrt(c.V)); return a * a * a === c.V ? a : NaN; }
    case 'prumerChybejici': {
      const sum = c.known.reduce((x, y) => x + y, 0), miss = c.n * c.avg - sum;
      return (c.known.length === c.n - 1 && miss >= 1) ? miss : NaN;
    }
    case 'soucetZPrumeru': return c.n * c.avg;
    default: return NaN;
  }
}

console.log('── Přijímačky: korektnost doplňkových generátorů ──');
let checked = 0, kinds = {};
for (const topic in GEN) {
  for (const gen of GEN[topic]) {
    for (let i = 0; i < 400; i++) {
      const it = gen();
      const p = String(it.prompt || ''), a = String(it.ans == null ? '' : it.ans), sol = String(it.sol || '');
      if (!p.trim() || /NaN|undefined/.test(p)) { ok(false, topic + ': špatný prompt "' + p.slice(0, 50) + '"'); continue; }
      if (!/NaN|undefined/.test(sol) === false) { ok(false, topic + ': NaN/undefined v řešení'); continue; }
      const exp = expected(it._check);
      const good = Number.isFinite(exp) && Number(a) === exp;
      if (!good) ok(false, topic + '/' + it._check.kind + ': ans=' + a + ' ≠ nezávislý přepočet ' + exp + ' | ' + p.slice(0, 60));
      else { pass++; }
      kinds[it._check.kind] = (kinds[it._check.kind] || 0) + 1;
      checked++;
    }
  }
}
console.log('  ověřeno ' + checked + ' úloh, typy: ' + JSON.stringify(kinds));

/* ── Pojistka na jazyk a typografii zadání ──
   Matematika může být správně, a zadání přesto vypadat nedbale. Hlídáme to,
   co se nám v praxi objevilo: nezkrácené zlomky („2/4 z počtu"), špatné
   skloňování počitatelných podstatných jmen („na 2 porcí") a nesmyslné
   dvojice ve slovních úlohách. */
console.log('── Jazyk a typografie zadání ──');
function gcd(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }
let badFrac = 0, badDecl = 0, fracEx = '', declEx = '';
for (const topic in GEN) {
  for (const gen of GEN[topic]) {
    for (let i = 0; i < 300; i++) {
      const p = String(gen().prompt || '');
      // zlomky v zadání musí být v základním tvaru (mimo „?/N" u rozšiřování)
      for (const m of p.matchAll(/(\d+)\/(\d+)/g)) {
        const a = +m[1], b = +m[2];
        // poměr „1 : 2000" ani datum tu nejsou; bereme jen skutečné zlomky a<b
        if (a < b && gcd(a, b) !== 1) { badFrac++; if (!fracEx) fracEx = p; }
      }
      // počitatelná jména: 2–4 → tvar bez -í, 5+ → -í
      const decl = [[/\b([2-4]) porcí\b/, '2–4 porce'], [/\b([5-9]|\d\d+) porce\b/, '5+ porcí'],
                    [/\b([2-4]) dní\b/, '2–4 dny'], [/\b1 (porce|dny|kusů|litrů|žáků)\b/, '1 + jednotné číslo']];
      for (const [re, why] of decl) if (re.test(p)) { badDecl++; if (!declEx) declEx = why + ': ' + p; }
    }
  }
}
ok(badFrac === 0, 'nezkrácený zlomek v zadání (' + badFrac + '×), např.: ' + fracEx);
ok(badDecl === 0, 'špatné skloňování v zadání (' + badDecl + '×), např.: ' + declEx);
if (!badFrac && !badDecl) { pass += 2; console.log('  ✅ zlomky v základním tvaru + skloňování OK'); }
console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
