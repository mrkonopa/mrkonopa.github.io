/* ══════════════════════════════════════════════════════════════════
   Sdílené měřidlo: osová souměrnost útvarů z čtverců ve čtvercové síti.

   Používá ho `prijimacky-soumernost` (úplný test úloh 8 a 11), `prijimacky-dopocet`
   (nezávislý dopočet odpovědi) i `prijimacky-obrazky`. Jedno místo, žádné kopie.

   NENÍ KRUH S GENERÁTOREM: banka hledá osy celočíselnými vzorci (svislá x → k − x,
   vodorovná, dvě šikmé). Tady se osy počítají jinak — skutečnou geometrií:
   kandidáty jsou osy úseček mezi středy dvou čtverců a spojnice středu s těžištěm,
   každý čtverec se zrcadlí včetně čtyř rohů a obraz musí být čtverec rovnoběžný
   s mřížkou přesně na místě jiného čtverce. Útvar se čte Z KRESBY (`data-bunka`,
   `data-x`, `data-y`), ne z objektu, který generátor vrátil.
   ══════════════════════════════════════════════════════════════════ */
const EPS = 1e-9;
/* Osy souměrnosti množiny jednotkových čtverců se středy v celých bodech. */
function osyGeom(bunky) {
  const mn = new Set(bunky.map(([x, y]) => x + ',' + y));
  const n = bunky.length;
  const G = [bunky.reduce((s, b) => s + b[0], 0) / n, bunky.reduce((s, b) => s + b[1], 0) / n];
  const kand = new Map();
  const pridej = (a, b, c) => {                              // přímka a·x + b·y = c, kanonicky
    const d = Math.hypot(a, b); if (d < EPS) return;
    let na = a / d, nb = b / d, nc = c / d;
    if (na < -EPS || (Math.abs(na) < EPS && nb < 0)) { na = -na; nb = -nb; nc = -nc; }
    kand.set([na, nb, nc].map(v => Math.round(v * 1e6)).join(','), [na, nb, nc]);
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {                        // osa úsečky mezi dvěma středy
      const [px, py] = bunky[i], [qx, qy] = bunky[j];
      pridej(qx - px, qy - py, (qx - px) * (px + qx) / 2 + (qy - py) * (py + qy) / 2);
    }
    const dx = G[0] - bunky[i][0], dy = G[1] - bunky[i][1];  // čtverec na ose: osa jde jeho středem a těžištěm
    if (Math.hypot(dx, dy) > EPS) pridej(-dy, dx, -dy * bunky[i][0] + dx * bunky[i][1]);
  }
  const odraz = ([a, b, c], x, y) => { const t = a * x + b * y - c; return [x - 2 * t * a, y - 2 * t * b]; };
  const vyhovuje = os => bunky.every(([x, y]) => {
    const [mx, my] = odraz(os, x, y);
    const rx = Math.round(mx), ry = Math.round(my);
    if (Math.abs(mx - rx) > 1e-7 || Math.abs(my - ry) > 1e-7 || !mn.has(rx + ',' + ry)) return false;
    return [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]].every(([ex, ey]) => {   // obraz čtverce je rovnoběžný s mřížkou
      const [cx, cy] = odraz(os, x + ex, y + ey);
      return Math.abs(Math.abs(cx - mx) - .5) < 1e-7 && Math.abs(Math.abs(cy - my) - .5) < 1e-7;
    });
  });
  return [...kand.values()].filter(vyhovuje).map(os => ({
    os, rodina: Math.abs(os[1]) < 1e-7 ? 'sv' : Math.abs(os[0]) < 1e-7 ? 'vo'
      : Math.abs(Math.abs(os[0]) - Math.abs(os[1])) < 1e-7 ? (os[0] * os[1] > 0 ? 'd' : 'a') : 'jina',
    odraz: (x, y) => odraz(os, x, y)
  }));
}

function ctiUtvary(svg) {
  const u = { A: [], B: [], C: [] };
  for (const m of svg.matchAll(/<rect data-utvar="([ABC])" data-bunka="(\d+)" data-x="(\d+)" data-y="(\d+)" x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g))
    u[m[1]].push({ n: +m[2], x: +m[3], y: +m[4], px: +m[5], py: +m[6], w: +m[7], h: +m[8] });
  return u;
}
const bez = (b, n) => b.filter(c => c.n !== n);
const pole = b => b.map(c => [c.x, c.y]);
const kraloveSouvisly = b => {
  const mn = new Set(b.map(c => c.x + ',' + c.y)), vid = new Set([b[0].x + ',' + b[0].y]), zas = [b[0]];
  while (zas.length) {
    const c = zas.pop();
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const k = (c.x + dx) + ',' + (c.y + dy);
      if (mn.has(k) && !vid.has(k)) { vid.add(k); zas.push(b.find(d => d.x === c.x + dx && d.y === c.y + dy)); }
    }
  }
  return vid.size === b.length;
};
/* Čtverce, jejichž odebráním útvar zesouměrní. */
const reseniOdebrani = b => b.filter(c => osyGeom(pole(bez(b, c.n))).length).map(c => c.n);
/* Dvojice čtverců (n ↔ m, n < m) podle osy, bez čtverce `vynech`. */
function paryPodleOsy(b, os, vynech) {
  const mp = new Map(b.map(c => [c.x + ',' + c.y, c.n])), pary = [];
  b.forEach(c => {
    if (c.n === vynech) return;
    const [mx, my] = os.odraz(c.x, c.y), m = mp.get(Math.round(mx) + ',' + Math.round(my));
    if (m !== undefined && m !== vynech && c.n < m) pary.push(c.n + '↔' + m);
  });
  return pary.sort().join(',');
}
const paryZTextu = t => [...t.matchAll(/(\d+) ↔ (\d+)/g)].map(m => m[1] + '↔' + m[2]).sort().join(',');


module.exports = { osyGeom, ctiUtvary, bez, pole, kraloveSouvisly, reseniOdebrani, paryPodleOsy, paryZTextu };
