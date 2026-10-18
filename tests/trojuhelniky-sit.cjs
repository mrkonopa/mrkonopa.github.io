/* ═════════════════════════════════════════════════════════════════
   Sdílené měřidlo: útvary z trojúhelníků v trojúhelníkové síti (osová a středová souměrnost).

   Používá ho `prijimacky-trojuhelniky` (úplný test úlohy 8 „Útvary v trojúhelníkové síti“).
   Jedno místo, žádné kopie.

   NENÍ KRUH S GENERÁTOREM: banka počítá přesně v celých číslech nad souřadnicemi mřížky
   (a, b) = a·e1 + b·e2 a zná šest zrcadel a středový obraz jako celočíselné vzorce. Tady se
   útvar PŘEČTE Z KRESBY (polygony s vrcholy v pixelech) a souměrnost se počítá skutečnou
   euklidovskou geometrií v pohyblivé řádové čárce: útvar souměrný podle osy / středu je právě
   ten, jehož těžiště leží na ose / ve středu a jehož každý trojúhelník se (po odrazu všech tří
   vrcholů) trefí přesně na jiný trojúhelník útvaru. Směr ani polohu os test předem nezná.
   ═════════════════════════════════════════════════════════════════ */
const R1 = v => Math.round(v * 10) / 10;                         // vrcholy mají rozestup ≥ 24 px, 0,1 px stačí
const klicV = pts => pts.map(p => R1(p[0]) + ',' + R1(p[1])).sort().join(';');
const tezisteT = pts => [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3];

/* Útvary a prázdná pole sítě z kresby. */
function ctiTr(svg) {
  const u = { A: [], B: [], C: [] }, prazdne = { A: [], B: [], C: [] };
  const body = s => s.trim().split(/\s+/).map(p => p.split(',').map(Number));
  for (const m of svg.matchAll(/<polygon data-utvar="([ABC])" data-bunka="(\d+)" points="([^"]+)"/g)) { const pts = body(m[3]); u[m[1]].push({ n: +m[2], pts, t: tezisteT(pts) }); }
  for (const m of svg.matchAll(/<polygon data-prazdne="([ABC])" points="([^"]+)"/g)) { const pts = body(m[2]); prazdne[m[1]].push({ pts, t: tezisteT(pts) }); }
  return { u, prazdne };
}
const tezisteSady = b => [b.reduce((s, c) => s + c.t[0], 0) / b.length, b.reduce((s, c) => s + c.t[1], 0) / b.length];
const mnozina = b => new Set(b.map(c => klicV(c.pts)));
/* Souřadnice v kresbě jsou na dvě desetinná místa, odraz je počítaný — porovnává se s tolerancí 0,3 px (strana trojúhelníku je 30). */
const blizko = (p, q) => Math.abs(p[0] - q[0]) < 0.3 && Math.abs(p[1] - q[1]) < 0.3;
/* Který trojúhelník útvaru b je obrazem trojúhelníku c při zobrazení f? (těžiště i všechny tři vrcholy musí sedět) */
const obrazC = (b, f, c) => {
  const m = c.pts.map(f), mt = tezisteT(m), d = b.find(x => blizko(x.t, mt));
  return d && m.every(p => d.pts.some(q => blizko(p, q))) ? d : null;
};
/* Útvar b se zobrazením f (bod → bod) převede sám na sebe? */
const vzor = (b, f) => b.every(c => !!obrazC(b, f, c));

/* Osy souměrnosti: každá prochází těžištěm útvaru; směr zná jen z dvojic těžišť trojúhelníků
   (osa úsečky mezi dvěma těžišti) a z těžišť samotných (trojúhelník ležící na ose). */
function osyTr(b) {
  if (!b.length) return [];
  const G = tezisteSady(b), kand = new Map();
  const pridej = (a, bb, c) => {                                   // přímka a·x + b·y = c, kanonicky
    const d = Math.hypot(a, bb); if (d < 1e-9) return;
    let na = a / d, nb = bb / d, nc = c / d;
    if (na < -1e-9 || (Math.abs(na) < 1e-9 && nb < 0)) { na = -na; nb = -nb; nc = -nc; }
    if (Math.abs(na * G[0] + nb * G[1] - nc) > 0.15) return;       // osa musí vést těžištěm útvaru (tolerance zaokrouhlení kresby)
    kand.set([na, nb, nc].map(v => Math.round(v * 1e5)).join(','), [na, nb, nc]);
  };
  for (let i = 0; i < b.length; i++) {
    const [px, py] = b[i].t;
    for (let j = i + 1; j < b.length; j++) { const [qx, qy] = b[j].t; pridej(qx - px, qy - py, (qx - px) * (px + qx) / 2 + (qy - py) * (py + qy) / 2); }
    if (Math.hypot(G[0] - px, G[1] - py) > 1e-6) pridej(-(G[1] - py), G[0] - px, -(G[1] - py) * px + (G[0] - px) * py);
  }
  const odraz = ([a, bb, c]) => ([x, y]) => { const t = a * x + bb * y - c; return [x - 2 * t * a, y - 2 * t * bb]; };
  return [...kand.values()].filter(L => vzor(b, odraz(L))).map(L => ({ L, f: odraz(L), uhel: Math.round(((Math.atan2(L[0], -L[1]) * 180 / Math.PI) % 180 + 180) % 180) }));
}
/* Středová souměrnost: střed musí být těžiště útvaru. */
function stredTr(b) {
  if (!b.length) return null;
  const G = tezisteSady(b), f = ([x, y]) => [2 * G[0] - x, 2 * G[1] - y];
  return vzor(b, f) ? { G, f } : null;
}
const bez = (b, n) => b.filter(c => c.n !== n);
/* Čísla trojúhelníků, jejichž odebráním vznikne osově souměrný útvar. */
const reseniOdebrani = b => b.filter(c => osyTr(bez(b, c.n)).length).map(c => c.n);
/* Čísla trojúhelníků, jejichž přesunutím na jiné prázdné pole vznikne středově souměrný útvar. */
function reseniPresunuti(b, prazdne) {
  const mn = mnozina(b);
  return b.filter(c => prazdne.some(q => !mn.has(klicV(q.pts)) && stredTr(bez(b, c.n).concat([{ n: -1, pts: q.pts, t: q.t }])))).map(c => c.n);
}
/* Cíle přesunutí trojúhelníku n a střed vzniklého útvaru (pro kontrolu postupu). */
function cilePresunuti(b, prazdne, n) {
  const mn = mnozina(b), res = [];
  prazdne.forEach(q => { if (mn.has(klicV(q.pts))) return; const nb = bez(b, n).concat([{ n: -1, pts: q.pts, t: q.t }]), s = stredTr(nb); if (s) res.push({ q, s, nb }); });
  return res;
}
/* Dvojice protějšků „n ↔ m“ (n < m) podle zobrazení f v sadě b; naOse = trojúhelníky zobrazené samy na sebe. */
function paryPodle(b, f, vynech) {
  const pary = [], naOse = [];
  b.forEach(c => {
    if (c.n === vynech) return;
    const d = obrazC(b, f, c);
    if (!d || d.n === vynech) return;
    if (d.n === c.n) naOse.push(c.n); else if (c.n < d.n) pary.push(c.n + '↔' + d.n);
  });
  return { pary: pary.sort().join(','), naOse: naOse.sort((x, y) => x - y).join(',') };
}
const paryZTextu = t => [...String(t).matchAll(/(\d+) ↔ (\d+)/g)].map(m => m[1] + '↔' + m[2]).sort().join(',');
/* Číslování: shora dolů po řadách (řada = horní hrana trojúhelníku), v řadě zleva doprava podle těžiště. */
const horniY = c => Math.min(...c.pts.map(p => p[1]));
const poradiOk = b => b.every((c, i) => {
  if (!i) return true;
  const p = b[i - 1], dy = horniY(c) - horniY(p);
  return Math.abs(dy) < 1 ? c.t[0] > p.t[0] : dy > 0;
});
/* Aspoň vrcholem se dotýkají (jako v ostré úloze)? */
function dotykV(b) {
  const vs = b.map(c => new Set(c.pts.map(p => R1(p[0]) + ',' + R1(p[1])))), vid = new Set([0]), zas = [0];
  while (zas.length) { const k = zas.pop(); vs.forEach((s, m) => { if (!vid.has(m) && [...vs[k]].some(x => s.has(x))) { vid.add(m); zas.push(m); } }); }
  return vid.size === b.length;
}

/* Těžiště obrazu trojúhelníku c při zobrazení f. */
const teziste = (f, c) => tezisteT(c.pts.map(f));

module.exports = { blizko, teziste, ctiTr, osyTr, stredTr, bez, reseniOdebrani, reseniPresunuti, cilePresunuti, paryPodle, paryZTextu, poradiOk, dotykV, klicV };
