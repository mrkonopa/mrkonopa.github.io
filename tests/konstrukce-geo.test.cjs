/* konstrukce-geo.test.cjs — geometrie a rozpoznávání tahů pro konstrukční úlohy (čistý Node).
   1) průsečíky přímka/kružnice proti ručnímu výpočtu,
   2) rozpoznání tahu od ruky na syntetických tazích se ŠUMEM (třes ruky,
      mírně prohnutá „rovná" čára, nepřesný oblouk) — seedovaný generátor,
      takže čísla jsou pokaždé stejná; prahy jsou z měření s rezervou,
   3) přichycení k bodům (úsečka přes A a B, kružnice se středem S přes bod),
   4) vyhodnocení výsledku: všechna řešení, část, nic, konce úseček, „kropení". */
const path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = {};
require(path.join(ROOT, 'projects/prijimacky-matematika/konstrukce-geo.js'));
const G = global.window.PZ_GEO;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };
const blizko = (a, b, e) => Math.abs(a - b) <= (e || 1e-6);
const B = G.bod;
// seedovaný generátor (mulberry32) — test musí dávat pokaždé stejná čísla
let seed = 20260926;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const nah = (a, b) => a + rnd() * (b - a);
const gauss = s => s * Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());

console.log('── Konstrukce: geometrie ──');
// 1) průsečíky
const x1 = G.prusecikPP(B(0, 0), B(10, 10), B(0, 10), B(10, 0));
ok(x1 && blizko(x1.x, 5) && blizko(x1.y, 5), 'přímka × přímka: (5, 5)');
ok(G.prusecikPP(B(0, 0), B(10, 0), B(0, 5), B(10, 5)) === null, 'rovnoběžky nemají průsečík');
const pk = G.prusecikyPK(B(0, 3), B(10, 3), B(0, 0), 5);
ok(pk.length === 2 && pk.every(p => blizko(Math.hypot(p.x, p.y), 5) && blizko(p.y, 3)) && blizko(Math.abs(pk[0].x), 4), 'přímka × kružnice: (±4, 3)');
ok(G.prusecikyPK(B(0, 5), B(10, 5), B(0, 0), 5).length === 1 && G.prusecikyPK(B(0, 6), B(10, 6), B(0, 0), 5).length === 0, 'tečna 1 průsečík, míjející 0');
const kk = G.prusecikyKK(B(0, 0), 5, B(8, 0), 5);
ok(kk.length === 2 && kk.every(p => blizko(p.x, 4) && blizko(Math.abs(p.y), 3)), 'kružnice × kružnice: (4, ±3)');
ok(G.prusecikyKK(B(0, 0), 2, B(10, 0), 2).length === 0 && G.prusecikyKK(B(0, 0), 5, B(1, 0), 1).length === 0, 'vzdálené i vnořené kružnice nemají průsečík');
const obr = G.osove(B(1, 5), B(0, 0), B(10, 0));
ok(blizko(obr.x, 1) && blizko(obr.y, -5), 'osová souměrnost podle osy x: (1, 5) → (1, −5)');

// 2) rozpoznání syntetických tahů
function tahUsecka() {
  const L = nah(40, 300), a = nah(0, 2 * Math.PI), p = B(nah(50, 350), nah(50, 250)), u = B(Math.cos(a), Math.sin(a)), n = B(-u.y, u.x);
  const luk = nah(-0.015, 0.015) * L, pts = [];
  for (let s = 0; s <= L; s += 4) { const t = s / L, b = luk * 4 * t * (1 - t); pts.push(B(p.x + u.x * s + n.x * b + gauss(1.2), p.y + u.y * s + n.y * b + gauss(1.2))); }
  return pts;
}
function tahOblouk(minSw, maxSw, zvlneni, rMin) {
  const zv = zvlneni == null ? 0.03 : zvlneni;
  const r = nah(rMin || 25, 150), c = B(nah(100, 300), nah(80, 220)), a0 = nah(0, 2 * Math.PI), sw = nah(minSw, maxSw) * (rnd() < 0.5 ? -1 : 1), pts = [];
  const kroky = Math.max(12, Math.round(Math.abs(sw) * r / 4));
  for (let i = 0; i <= kroky; i++) { const a = a0 + sw * i / kroky, rr = r * (1 + zv * Math.sin(3 * a)); pts.push(B(c.x + rr * Math.cos(a) + gauss(1.5), c.y + rr * Math.sin(a) + gauss(1.5))); }
  return { pts, r, c, a0, sw };
}
/* Jak daleko leží rozpoznaná kružnice od ZAMÝŠLENÉHO oblouku (bez třesu)
   v rozsahu, který žák opsal. Tohle žák vidí: tah se nahradí čistým
   obloukem a ten má ležet tam, kam kreslil. Poloměr sám se u krátkého
   oblouku porovnávat nedá — trojlaločné zvlnění o 3 % mění místní
   zakřivení až o ±27 %, takže krátký kus poloměr prostě neurčuje. */
function odchylkaOblouku(t, k) {
  let m = 0;
  for (let i = 0; i <= 20; i++) { const a = t.a0 + t.sw * i / 20; m = Math.max(m, Math.abs(G.vzdal(B(t.c.x + t.r * Math.cos(a), t.c.y + t.r * Math.sin(a)), k.c) - k.r)); }
  return m;
}
function tahKlikyhak() {           // „Z" nebo „N": tři rovné kusy s ostrými zlomy
  const p = B(nah(80, 320), nah(60, 240)), s = nah(30, 70), pts = [];
  const vrcholy = [p, B(p.x + s, p.y), B(p.x, p.y + s), B(p.x + s, p.y + s)];
  for (let k = 0; k < 3; k++) for (let i = 0; i <= 10; i++) { const a = vrcholy[k], b = vrcholy[k + 1]; pts.push(B(a.x + (b.x - a.x) * i / 10 + gauss(1), a.y + (b.y - a.y) * i / 10 + gauss(1))); }
  return pts;
}
const N = 400;
const podil = (f) => { let k = 0; for (let i = 0; i < N; i++) if (f()) k++; return k / N; };
const cara = podil(() => G.rozpoznej(tahUsecka()).typ === 'usecka');
const oblouk = podil(() => { const t = tahOblouk(Math.PI / 4, 5.2); const r = G.rozpoznej(t.pts); return r.typ === 'kruznice' && r.rozpeti != null && odchylkaOblouku(t, r) <= 8; });
const dlouhy = podil(() => { const t = tahOblouk(Math.PI, 5.2); const r = G.rozpoznej(t.pts); return r.typ === 'kruznice' && Math.abs(r.r - t.r) / t.r <= 0.05; });
// krátký oblouk BEZ zvlnění (jen šum): tady poloměr určený je a Kåsa sám ho
// zmenšuje — naměřeno 64 % do 10 % bez doladění, 82 % s ním
const kratky = podil(() => { const t = tahOblouk(Math.PI / 4, Math.PI / 2, 0, 40); const r = G.rozpoznej(t.pts); return r.typ === 'kruznice' && Math.abs(r.r - t.r) / t.r <= 0.10; });
const cela = podil(() => { const t = tahOblouk(2 * Math.PI, 2.15 * Math.PI); const r = G.rozpoznej(t.pts); return r.typ === 'kruznice' && r.rozpeti == null; });
const klik = podil(() => G.rozpoznej(tahKlikyhak()).typ === 'kresba');
const tap = podil(() => { const p = B(nah(20, 380), nah(20, 280)); return G.rozpoznej([p, B(p.x + gauss(1), p.y + gauss(1))]).typ === 'bod'; });
const krizek = podil(() => { const p = B(nah(20, 380), nah(20, 280)), s = nah(3, 6); return G.rozpoznej([B(p.x - s, p.y - s), B(p.x, p.y), B(p.x + s, p.y + s)]).typ === 'bod'; });
const pct = v => (v * 100).toFixed(1) + ' %';
console.log('  naměřeno: čára ' + pct(cara) + ' · oblouk ' + pct(oblouk) + ' · dlouhý oblouk ' + pct(dlouhy) + ' · krátký bez zvlnění ' + pct(kratky) + ' · celá kružnice ' + pct(cela) + ' · klikyhák ' + pct(klik) + ' · klepnutí ' + pct(tap) + ' · křížek ' + pct(krizek));
ok(cara >= 0.97, 'rovný tah se šumem a prohnutím → úsečka (' + pct(cara) + ', práh 97 %)');
ok(oblouk >= 0.95, 'oblouk 45°–300° se šumem → oblouk nejvýš 8 jednotek (≈ 2,7 mm) od zamýšleného (' + pct(oblouk) + ', práh 95 %)');
ok(dlouhy >= 0.95, 'oblouk 180°–300° → poloměr do 5 % — tam už ho tah určuje (' + pct(dlouhy) + ', práh 95 %)');
ok(kratky >= 0.74, 'krátký oblouk 45°–90° bez zvlnění → poloměr do 10 % (' + pct(kratky) + ', práh 74 %; bez doladění Kåsy 64 %)');
ok(cela >= 0.95, 'celý kruh → celá kružnice, ne oblouk (' + pct(cela) + ', práh 95 %)');
ok(klik >= 0.95, 'klikyhák „Z" zůstane kresbou — nehodnotí se (' + pct(klik) + ', práh 95 %)');
ok(tap === 1 && krizek === 1, 'klepnutí i malý křížek → bod');

// 3) přichycení
const A = B(100, 150), Bb = B(300, 170), S = B(200, 100);
const u1 = G.prichyt(G.rozpoznej(Array.from({ length: 30 }, (_, i) => B(96 + i * 7 + gauss(1), 148 + i * 0.7 + gauss(1)))), [A, Bb], 10);
ok(u1.typ === 'usecka' && G.vzdal(u1.p, A) < 1e-9 && G.vzdalOdPrimky(Bb, u1.p, u1.q) < 1e-6, 'tah od A skoro přes B → úsečka přesně z A přes B');
const k1 = G.prichyt({ typ: 'kruznice', c: B(203, 97), r: 58 }, [S, B(260, 100)], 10);
ok(G.vzdal(k1.c, S) < 1e-9 && blizko(k1.r, 60), 'kružnice: střed přichycen k S, poloměr projde bodem (60)');
ok(G.prichyt({ typ: 'bod', p: B(152, 151) }, [B(150, 150)], 10).p.x === 150, 'bod u průsečíku skočí přesně na něj');

// 4) vyhodnocení
const u = { dane: { body: { A, B: Bb } }, reseni: [{ C: B(150, 60) }, { C: B(250, 240) }], pomocne: [], tol: 10 };
const bodT = (x, y) => ({ typ: 'bod', p: B(x, y) });
ok(G.vyhodnot(u, [bodT(153, 57), bodT(247, 244)]).spravne, 'obě řešení označená do 10 jednotek → správně');
const cast = G.vyhodnot(u, [bodT(150, 60)]);
ok(!cast.spravne && cast.nalezeno === 1 && cast.celkem === 2, 'jedno ze dvou → 1 z 2, ne správně');
ok(G.vyhodnot(u, [bodT(170, 60)]).nalezeno === 0, 'o 20 jednotek (≈ 7 mm) vedle → nenalezeno');
ok(G.vyhodnot(u, [{ typ: 'usecka', p: A, q: B(151, 61) }, { typ: 'usecka', p: Bb, q: B(249, 239) }]).spravne, 'vrchol jako konec narýsované strany se počítá');
const kropeni = G.vyhodnot(u, Array.from({ length: 40 }, (_, i) => bodT(10 + (i % 8) * 50, 10 + Math.floor(i / 8) * 60)));
ok(kropeni.kropeni && !kropeni.spravne, 'síť 40 bodů přes celé okno („kropení") → neuzná se, i když řešení zasáhne');
ok(G.vyhodnot(u, [bodT(150, 60), bodT(250, 240), bodT(200, 150)]).spravne, 'jeden pomocný bod navíc nevadí');

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
