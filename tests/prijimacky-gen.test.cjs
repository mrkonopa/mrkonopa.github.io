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
console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
