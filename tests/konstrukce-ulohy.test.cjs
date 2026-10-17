/* konstrukce-ulohy.test.cjs — generátory konstrukčních úloh (čistý Node).
   Řešení se NEBERE z generátoru: každá vlastnost se ověřuje nezávisle
   z toho, co zadání tvrdí — pravý úhel při C, stejná vzdálenost od A a B,
   vzdálenost a výška vyčtené z TEXTU zadání, střed úsečky XX′ na ose,
   A + C = B + D, u útvarů jejich definice (obdélník = úhlopříčky shodné
   a půlí se, kosočtverec = shodné strany, lichoběžník = souměrnost podle
   osy a různé základny, délka těžnice a výšky vyčtená z TEXTU).
   Bodování (bodovat) se ověřuje proti klíči CERMAT: přesně → plný počet,
   mírná nepřesnost → o bod méně, jen část → o dva méně, kropení → 0.
   Jinak by test prošel i u úlohy, jejíž řešení je utržené
   od zadání (vzor „test, který si očekávanou hodnotu bere ze stejného
   objektu, je kruh" z CLAUDE.md). Math.random je seedovaný. */
const path = require('path');
const ROOT = path.join(__dirname, '..');
let seed = 20260927;
Math.random = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
global.window = {};
require(path.join(ROOT, 'projects/prijimacky-matematika/konstrukce-geo.js'));
require(path.join(ROOT, 'projects/prijimacky-matematika/konstrukce-ulohy.js'));
const G = global.window.PZ_GEO, K = global.window.PZ_KONSTRUKCE;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };
const EPS = 1e-6;
const naPrimce = (x, l) => G.vzdalOdPrimky(x, l.p, l.q) <= EPS;
const cislo = (s, re) => { const m = s.match(re); return m ? parseFloat(m[1].replace(',', '.')) : NaN; };
const vsechnaCisla = (o, out) => {
  if (typeof o === 'number') out.push(o);
  else if (o && typeof o === 'object') for (const k of Object.keys(o)) vsechnaCisla(o[k], out);
  return out;
};
const texty = u => [u.text].concat(u.napovedy, u.postup.map(k => k.text));

// Úhel XVY ve vrcholu V (radiány)
const uhel = (V, X, Y) => Math.acos(Math.max(-1, Math.min(1, G.skal(G.jednot(G.odecti(X, V)), G.jednot(G.odecti(Y, V))))));
const stupne = r => r * 180 / Math.PI;
// Obdélník ABCD (v tomto pořadí): úhlopříčky se půlí a jsou shodné
function obdelnik4(A, B, C, D) {
  if (G.vzdal(G.stred(A, C), G.stred(B, D)) > EPS || Math.abs(G.vzdal(A, C) - G.vzdal(B, D)) > EPS) return 'ABCD není obdélník';
  return Math.min(G.vzdal(A, B), G.vzdal(B, C)) < 25 ? 'obdélník je skoro úsečka' : null;
}
function ctverec4(A, B, C, D) {
  const e = obdelnik4(A, B, C, D); if (e) return e.replace('obdélník', 'čtverec');
  return Math.abs(G.vzdal(A, B) - G.vzdal(B, C)) > EPS ? 'ABCD není čtverec' : null;
}
/* Rovnoramenný lichoběžník se základnami XY a ZW (vrcholy X, Y, Z, W po obvodu):
   základny rovnoběžné, osa základny XY je zároveň osou ZW (souměrnost), různě dlouhé
   (jinak obdélník) a konvexní. Vrací popis vady, nebo null. */
function rovnoramennyLich(X, Y, Z, W) {
  const u = G.jednot(G.odecti(Y, X));
  if (Math.abs(G.vekt(u, G.jednot(G.odecti(Z, W)))) > 1e-9 || G.skal(u, G.odecti(Z, W)) <= 0) return 'základny nejsou rovnoběžné';
  if (Math.abs(G.skal(G.odecti(G.stred(Z, W), G.stred(X, Y)), u)) > EPS) return 'lichoběžník není souměrný podle osy základen';
  if (Math.abs(G.vzdal(X, Y) - G.vzdal(Z, W)) < 15) return 'základny jsou skoro stejné (obdélník)';
  const m = [X, Y, Z, W], z = m.map((a, i) => G.vekt(G.odecti(m[(i + 1) % 4], a), G.odecti(m[(i + 2) % 4], m[(i + 1) % 4])));
  return z.every(v => v > 0) || z.every(v => v < 0) ? null : 'lichoběžník není konvexní';
}

/* Pravoúhlý lichoběžník ABCD (vrcholy po obvodu): konvexní, právě jedna dvojice protilehlých stran
   rovnoběžná (jinak obdélník / rovnoběžník / obecný čtyřúhelník), aspoň jeden pravý úhel (a tedy
   druhý u téhož ramene), žádná strana kratší než 20. Vrací popis vady, nebo null. */
function pravouhlyLich4(A, B, C, D) {
  const m = [A, B, C, D], v = m.map((x, i) => G.jednot(G.odecti(m[(i + 1) % 4], x)));
  if (m.some((x, i) => G.vzdal(x, m[(i + 1) % 4]) < 20)) return 'strana kratší než 20';
  const z = m.map((x, i) => G.vekt(G.odecti(m[(i + 1) % 4], x), G.odecti(m[(i + 2) % 4], m[(i + 1) % 4])));
  if (!(z.every(t => t > 0) || z.every(t => t < 0))) return 'čtyřúhelník není konvexní';
  const rovn = [Math.abs(G.vekt(v[0], v[2])) < 1e-9, Math.abs(G.vekt(v[1], v[3])) < 1e-9];
  if (rovn[0] === rovn[1]) return rovn[0] ? 'rovnoběžník (obě dvojice stran rovnoběžné)' : 'není lichoběžník';
  return v.some((x, i) => Math.abs(G.skal(x, v[(i + 1) % 4])) < 1e-9) ? null : 'lichoběžník nemá pravý úhel';
}

// Nezávislá kontrola: vrací popis vady, nebo null
const VLASTNOST = {
  thales(u) {
    const { A, B } = u.dane.body, p = u.dane.primky[0];
    for (const { C } of u.reseni) {
      if (!naPrimce(C, p)) return 'C neleží na přímce p';
      const a = G.odecti(A, C), b = G.odecti(B, C), cos = G.skal(a, b) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
      if (Math.abs(cos) > 1e-9) return 'úhel ACB není pravý (cos = ' + cos.toFixed(4) + ')';
    }
    return null;
  },
  osa(u) {
    const { A, B } = u.dane.body, p = u.dane.primky[0], { X } = u.reseni[0];
    if (!naPrimce(X, p)) return 'X neleží na přímce p';
    return Math.abs(G.vzdal(X, A) - G.vzdal(X, B)) > EPS ? '|XA| ≠ |XB|' : null;
  },
  kruznice(u) {
    const r = cislo(u.text, /vzdálenost (\d+(?:,\d+)?) cm/) * G.CM, { S } = u.dane.body, p = u.dane.primky[0];
    if (!(r > 0)) return 'ze zadání nejde přečíst vzdálenost';
    for (const { X } of u.reseni) {
      if (!naPrimce(X, p)) return 'X neleží na přímce p';
      if (Math.abs(G.vzdal(X, S) - r) > EPS) return '|XS| = ' + G.vzdal(X, S).toFixed(2) + ', zadání chce ' + r;
    }
    return null;
  },
  vyska(u) {
    const v = cislo(u.text, /délku (\d+(?:,\d+)?) cm/) * G.CM, { A, B } = u.dane.body, p = u.dane.primky[0];
    if (!(v > 0)) return 'ze zadání nejde přečíst výšku';
    const strany = [];
    for (const { C } of u.reseni) {
      if (!naPrimce(C, p)) return 'C neleží na přímce p';
      if (Math.abs(G.vzdalOdPrimky(C, A, B) - v) > EPS) return 'výška na AB je ' + G.vzdalOdPrimky(C, A, B).toFixed(2) + ', zadání chce ' + v;
      const ab = G.odecti(B, A), ac = G.odecti(C, A);
      strany.push(Math.sign(ab.x * ac.y - ab.y * ac.x));
    }
    return strany[0] === strany[1] ? 'obě řešení leží na TÉŽE straně AB' : null;
  },
  soumernost(u) {
    const o = u.dane.primky[0], uo = G.jednot(G.odecti(o.q, o.p));
    for (const k of ['A', 'B', 'C']) {
      const X = u.dane.body[k], Y = u.reseni[0][k + '′'];
      if (!naPrimce(G.stred(X, Y), o)) return 'střed ' + k + k + '′ neleží na ose';
      if (Math.abs(G.skal(G.odecti(Y, X), uo)) > EPS) return k + k + '′ není kolmá k ose';
      if (G.vzdal(X, Y) < 1) return k + ' leží na ose (obraz splývá)';
    }
    return null;
  },
  rovnobeznik(u) {
    const { A, B, C } = u.dane.body, { D } = u.reseni[0];
    if (G.vzdal(G.secti(A, C), G.secti(B, D)) > EPS) return 'A + C ≠ B + D (úhlopříčky se nepůlí)';
    const ab = G.odecti(B, A), bc = G.odecti(C, B);
    return Math.abs(ab.x * bc.y - ab.y * bc.x) < 1000 ? 'rovnoběžník je skoro úsečka' : null;
  },
  obdelnik(u) {
    const { A, S } = u.dane.body, p = u.dane.primky[0];
    for (const { B, C, D } of u.reseni) {
      if (!naPrimce(D, p)) return 'D neleží na přímce p';
      if (G.vzdal(G.stred(A, C), S) > EPS || G.vzdal(G.stred(B, D), S) > EPS) return 'úhlopříčky se v S nepůlí';
      if (Math.abs(G.vzdal(A, C) - G.vzdal(B, D)) > EPS) return 'úhlopříčky nejsou shodné (není to obdélník)';
      if (Math.min(G.vzdal(A, B), G.vzdal(A, D)) < 30) return 'obdélník je skoro úsečka';
    }
    return G.vzdal(u.reseni[0].D, u.reseni[1].D) < 30 ? 'obě řešení splývají' : null;
  },
  ctverec(u) {
    const { S } = u.dane.body, p = u.dane.primky[0], { A, B, C, D } = u.reseni[0];
    if (!naPrimce(A, p) || !naPrimce(B, p)) return 'strana AB neleží na přímce p';
    if (G.vzdal(G.stred(A, C), S) > EPS || G.vzdal(G.stred(B, D), S) > EPS) return 'úhlopříčky se v S nepůlí';
    const ac = G.odecti(C, A), bd = G.odecti(D, B);
    if (Math.abs(G.vzdal(A, C) - G.vzdal(B, D)) > EPS || Math.abs(G.skal(ac, bd)) > EPS * 1e3) return 'úhlopříčky nejsou shodné a kolmé (není to čtverec)';
    return Math.abs(G.vzdal(A, B) * Math.SQRT2 - G.vzdal(A, C)) > EPS ? 'AB není strana čtverce' : null;
  },
  kosoctverec(u) {
    const { A, C } = u.dane.body, p = u.dane.primky[0], { B, D } = u.reseni[0];
    if (!naPrimce(B, p)) return 'B neleží na přímce p';
    const s = [G.vzdal(A, B), G.vzdal(B, C), G.vzdal(C, D), G.vzdal(D, A)];
    if (Math.max(...s) - Math.min(...s) > EPS) return 'strany nejsou shodné (' + s.map(x => x.toFixed(2)).join(', ') + ')';
    return G.vzdalOdPrimky(B, A, C) < 20 ? 'kosočtverec je skoro úsečka' : null;
  },
  lichobeznik(u) {
    const { A, M } = u.dane.body, o = u.dane.primky[0], { B, C, D } = u.reseni[0];
    if (G.vzdal(G.stred(B, C), M) > EPS) return 'M není střed ramene BC';
    for (const [X, Y] of [[A, B], [D, C]]) {
      if (!naPrimce(G.stred(X, Y), o) || Math.abs(G.skal(G.odecti(Y, X), G.jednot(G.odecti(o.q, o.p)))) > EPS) return 'lichoběžník není souměrný podle osy o';
    }
    const ab = G.odecti(B, A), dc = G.odecti(C, D);
    if (Math.abs(ab.x * dc.y - ab.y * dc.x) > EPS * 1e3 || G.skal(ab, dc) <= 0) return 'základny AB a CD nejsou rovnoběžné a souhlasně orientované';
    return Math.abs(G.vzdal(A, B) - G.vzdal(C, D)) < 20 ? 'základny jsou skoro stejné (obdélník, ne lichoběžník)' : null;
  },
  teznice(u) {
    const t = cislo(u.text, /délku (\d+(?:,\d+)?) cm/) * G.CM, { A, C } = u.dane.body, p = u.dane.primky[0];
    if (!(t > 0)) return 'ze zadání nejde přečíst délku těžnice';
    for (const { B } of u.reseni) {
      if (!naPrimce(B, p)) return 'B neleží na přímce p';
      if (Math.abs(G.vzdal(B, G.stred(A, C)) - t) > EPS) return 'těžnice z B měří ' + G.vzdal(B, G.stred(A, C)).toFixed(2) + ', zadání chce ' + t;
      if (G.vzdalOdPrimky(B, A, C) < 20) return 'trojúhelník je skoro úsečka';
    }
    return null;
  },
  rovnoramenny(u) {
    const v = cislo(u.text, /délku (\d+(?:,\d+)?) cm/) * G.CM, { A, B } = u.dane.body;
    if (!(v > 0)) return 'ze zadání nejde přečíst výšku';
    const strany = [];
    for (const { C } of u.reseni) {
      if (Math.abs(G.vzdal(C, A) - G.vzdal(C, B)) > EPS) return 'ramena AC a BC nejsou shodná';
      if (Math.abs(G.vzdalOdPrimky(C, A, B) - v) > EPS) return 'výška na základnu je ' + G.vzdalOdPrimky(C, A, B).toFixed(2) + ', zadání chce ' + v;
      const ab = G.odecti(B, A), ac = G.odecti(C, A);
      strany.push(Math.sign(ab.x * ac.y - ab.y * ac.x));
    }
    return strany[0] === strany[1] ? 'obě řešení leží na TÉŽE straně AB' : null;
  },
  // ── typy 13–34 ──
  stredova(u) {
    const { S } = u.dane.body;
    for (const k of ['A', 'B', 'C']) if (G.vzdal(G.stred(u.dane.body[k], u.reseni[0][k + '′']), S) > EPS) return 'S není středem úsečky ' + k + k + '′';
    return null;
  },
  osauhlu(u) {
    const { K: Kk, L, M } = u.dane.body, { P: Pp } = u.reseni[0];
    if (G.vzdalOdUsecky(Pp, Kk, M) > EPS) return 'P neleží na straně KM';
    return Math.abs(uhel(L, Kk, Pp) - uhel(L, Pp, M)) > 1e-9 ? 'úhly KLP a PLM nejsou shodné' : null;
  },
  opsana(u) {
    const { A, B, C } = u.dane.body, { S } = u.reseni[0], r = [G.vzdal(S, A), G.vzdal(S, B), G.vzdal(S, C)];
    return Math.max(...r) - Math.min(...r) > EPS ? 'S nemá od vrcholů stejnou vzdálenost' : null;
  },
  vysky(u) {
    const { A, B, O } = u.dane.body, { C } = u.reseni[0], kolmo = (a, b) => Math.abs(G.skal(G.jednot(a), G.jednot(b))) < 1e-9;
    if (!kolmo(G.odecti(C, A), G.odecti(O, B)) || !kolmo(G.odecti(C, B), G.odecti(O, A)) || !kolmo(G.odecti(C, O), G.odecti(B, A))) return 'O není průsečík výšek trojúhelníku ABC';
    return null;
  },
  obdelnikUhl(u) {
    const { B, D } = u.dane.body, c = u.dane.primky[0];
    for (const { A, C } of u.reseni) {
      if (!naPrimce(C, c)) return 'C neleží na přímce c';
      if (Math.abs(G.skal(G.jednot(G.odecti(B, C)), G.jednot(G.odecti(D, C)))) > 1e-9) return 'úhel BCD není pravý';
      if (G.vzdal(G.secti(A, C), G.secti(B, D)) > EPS) return 'ABCD není rovnoběžník';
    }
    return null;
  },
  obdelnikM(u) {
    const { A, C, M } = u.dane.body, { B, D } = u.reseni[0];
    if (G.vzdal(G.stred(A, C), G.stred(B, D)) > EPS || Math.abs(G.vzdal(A, C) - G.vzdal(B, D)) > EPS) return 'úhlopříčky nejsou shodné a nepůlí se';
    return G.vzdalOdPrimky(M, B, D) > EPS ? 'M neleží na úhlopříčce BD' : null;
  },
  lichobeznikZakl(u) {
    const { A, B, S } = u.dane.body, { C, D } = u.reseni[0];
    if (G.vzdal(G.stred(A, D), S) > EPS) return 'S není středem ramene AD';
    return rovnoramennyLich(A, B, C, D);
  },
  rovnoramennyOsa(u) {
    const { L } = u.dane.body, [o, p] = u.dane.primky, { K: Kk, M } = u.reseni[0];
    if (!naPrimce(Kk, o) || !naPrimce(Kk, p) || !naPrimce(L, p)) return 'K neleží na o i p';
    if (!naPrimce(G.stred(L, M), o) || Math.abs(G.skal(G.odecti(M, L), G.jednot(G.odecti(o.q, o.p)))) > EPS) return 'M není obraz L podle osy o';
    return Math.abs(G.vzdal(Kk, L) - G.vzdal(Kk, M)) > EPS ? 'ramena KL a KM nejsou shodná' : null;
  },
  ctverecUhl(u) { const { B, D } = u.dane.body, { A, C } = u.reseni[0]; return ctverec4(A, B, C, D); },
  vcTc(u) {
    const { B, C } = u.dane.body, [p, q] = u.dane.primky, { A } = u.reseni[0];
    if (!naPrimce(C, p) || Math.abs(G.skal(G.jednot(G.odecti(B, A)), G.jednot(G.odecti(p.q, p.p)))) > 1e-9) return 'výška z C neleží na p';
    return !naPrimce(G.stred(A, B), q) || !naPrimce(C, q) ? 'těžnice z C neleží na q' : null;
  },
  obdelnikStrana(u) {
    const { A, S } = u.dane.body, p = u.dane.primky[0];
    for (const { B, C, D } of u.reseni) {
      if (!naPrimce(D, p)) return 'D neleží na přímce p';
      if (G.vzdal(G.stred(C, D), S) > EPS) return 'S není střed strany CD';
      const e = obdelnik4(A, B, C, D); if (e) return e;
    }
    return null;
  },
  kosoctverecOsa(u) {
    const { A } = u.dane.body, o = u.dane.primky[0], { B, C, D } = u.reseni[0];
    if (!naPrimce(B, o) || !naPrimce(D, o)) return 'B nebo D neleží na ose o';
    const s = [G.vzdal(A, B), G.vzdal(B, C), G.vzdal(C, D), G.vzdal(D, A)];
    if (Math.max(...s) - Math.min(...s) > EPS) return 'strany nejsou shodné';
    return Math.abs(G.vzdal(B, D) - 2 * G.vzdal(A, C)) > EPS ? '|BD| není dvojnásobek |AC|' : null;
  },
  teziste(u) {
    const { C, T } = u.dane.body, { A, B } = u.reseni[0];
    if (Math.abs(G.skal(G.jednot(G.odecti(A, C)), G.jednot(G.odecti(B, C)))) > 1e-9 || Math.abs(G.vzdal(C, A) - G.vzdal(C, B)) > EPS) return 'není to rovnoramenný pravoúhlý trojúhelník s pravým úhlem u C';
    return G.vzdal(G.bod((A.x + B.x + C.x) / 3, (A.y + B.y + C.y) / 3), T) > EPS ? 'T není těžiště' : null;
  },
  dveThalet(u) {
    const { A, B, D } = u.dane.body, { C } = u.reseni[0], prav = (X, Y) => Math.abs(G.skal(G.jednot(G.odecti(X, C)), G.jednot(G.odecti(Y, C)))) < 1e-9;
    if (G.vzdal(B, C) < 20) return 'C splývá s B';
    return prav(A, B) && prav(B, D) ? null : 'úhly ACB a BCD nejsou oba pravé';
  },
  rovnoramennyKruz(u) {
    const { K: Kk, L } = u.dane.body, k = u.dane.kruznice[0];
    for (const { M } of u.reseni) {
      if (Math.abs(G.vzdal(Kk, M) - G.vzdal(Kk, L)) > EPS) return 'ramena KL a KM nejsou shodná';
      if (Math.abs(G.vzdal(k.c, M) - k.r) > EPS) return 'M neleží na kružnici k';
    }
    return null;
  },
  pravouhlyLich(u) {
    const { A, B, D } = u.dane.body, { C } = u.reseni[0], ab = G.jednot(G.odecti(B, A));
    if (Math.abs(G.vekt(ab, G.jednot(G.odecti(C, D)))) > 1e-9) return 'CD není rovnoběžná s AB';
    if (Math.abs(G.skal(ab, G.jednot(G.odecti(C, B)))) > 1e-9) return 'rameno BC není kolmé k základnám';
    return Math.abs(G.skal(ab, G.jednot(G.odecti(D, A)))) < 0.15 ? 'úhel DAB je skoro pravý — zadání je dvojznačné' : null;
  },
  osaStrany(u) {
    const { P: Pp, Q } = u.dane.body, o = u.dane.primky[0], osaZ = (X, Y) => naPrimce(G.stred(X, Y), o) && Math.abs(G.skal(G.odecti(Y, X), G.jednot(G.odecti(o.q, o.p)))) < EPS;
    for (const { R } of u.reseni) if (!osaZ(Pp, R) && !osaZ(Q, R)) return 'o není osou strany PR ani QR';
    return osaZ(Pp, Q) ? 'o je osou strany PQ — pak by R nešlo určit' : null;
  },
  sestiuhelnik(u) {
    const { S, A } = u.dane.body, V = [A].concat(Object.values(u.reseni[0])), R = G.vzdal(S, A);
    if (V.some(x => Math.abs(G.vzdal(S, x) - R) > EPS)) return 'vrcholy neleží na kružnici se středem S';
    const f = V.map(x => Math.atan2(x.y - S.y, x.x - S.x)).sort((a, b) => a - b);
    return f.some((x, i) => Math.abs(((i ? x - f[i - 1] : x + 2 * Math.PI - f[5])) - Math.PI / 3) > 1e-9) ? 'vrcholy nejsou po 60°' : null;
  },
  stredyStran(u) {
    const { C, 'S₁': S1, 'S₂': S2 } = u.dane.body, mnoziny = new Set();
    for (const { A, B } of u.reseni) {
      const stredy = [G.stred(A, B), G.stred(B, C), G.stred(C, A)];
      const i1 = stredy.findIndex(x => G.vzdal(x, S1) < EPS), i2 = stredy.findIndex(x => G.vzdal(x, S2) < EPS);
      if (i1 < 0 || i2 < 0 || i1 === i2) return 'S₁ a S₂ nejsou středy dvou různých stran';
      if (G.vzdalOdPrimky(C, A, B) < 20) return 'trojúhelník je skoro úsečka';
      mnoziny.add([A, B].map(x => x.x.toFixed(3) + ',' + x.y.toFixed(3)).sort().join('|'));
    }
    return mnoziny.size === 3 ? null : 'řešení nejsou tři různá';
  },
  lichobeznikTri(u) {
    const { E, F, G: G0 } = u.dane.body;
    for (const { H } of u.reseni) {
      if (rovnoramennyLich(E, F, G0, H) && rovnoramennyLich(F, G0, H, E)) return 'EFGH není rovnoramenný lichoběžník s žádnou dvojicí základen';
    }
    return null;
  },
  obdelnikSp(u) {
    const { B, C } = u.dane.body, p = u.dane.primky[0], { S, A, D } = u.reseni[0];
    if (!naPrimce(S, p)) return 'S neleží na přímce p';
    if (G.vzdal(G.stred(A, C), S) > EPS) return 'S není střed obdélníku';
    return obdelnik4(A, B, C, D);
  },
  rovnoramennyZakl(u) {
    const { S, Q } = u.dane.body, p = u.dane.primky[0], { A, B, C } = u.reseni[0];
    if (!naPrimce(A, p) || Math.abs(G.skal(G.jednot(G.odecti(B, A)), G.jednot(G.odecti(p.q, p.p)))) > 1e-9) return 'A neleží na p nebo AB není kolmá k p';
    if (G.vzdal(G.stred(A, B), S) > EPS) return 'S není střed základny AB';
    if (Math.abs(G.vzdal(C, A) - G.vzdal(C, B)) > EPS) return 'ramena nejsou shodná';
    return G.vzdalOdPrimky(C, A, Q) > EPS ? 'C neleží na přímce AQ' : null;
  },
  // ── úhel ve stupních: velikost se vyčte z TEXTU a změří na řešení ──
  rovnoramennyUhel(u) {
    const { K: Kk, L } = u.dane.body, st = cislo(u.text, /úhlu LKM je (\d+)°/), M = u.reseni.map(r => r.M);
    for (const X of M) {
      if (Math.abs(stupne(uhel(Kk, L, X)) - st) > 1e-6) return 'úhel LKM není ' + st + '°';
      if (Math.abs(G.vzdal(L, Kk) - G.vzdal(L, X)) > EPS) return '|LK| ≠ |LM|';
    }
    const u0 = G.odecti(L, Kk);
    return G.vekt(u0, G.odecti(M[0], Kk)) * G.vekt(u0, G.odecti(M[1], Kk)) < 0 ? null : 'řešení nejsou na opačných stranách přímky KL';
  },
  uhelOsaStrany(u) {
    const { B, X } = u.dane.body, o = u.dane.primky[0], { A, C } = u.reseni[0], st = cislo(u.text, /úhlu BAC je (\d+)°/);
    if (!naPrimce(G.stred(A, B), o) || Math.abs(G.skal(G.jednot(G.odecti(A, B)), G.jednot(G.odecti(o.q, o.p)))) > 1e-9) return 'o není osou strany AB';
    const pl = (u.dane.poloprimky || [])[0];
    if (!pl || G.vzdal(pl.p, B) > EPS || G.vzdalOdPrimky(X, pl.p, pl.q) > EPS) return 'zadaná polopřímka není BX';
    if (G.vzdalOdPrimky(C, B, X) > EPS || G.skal(G.odecti(C, B), G.odecti(X, B)) <= 0) return 'C neleží na polopřímce BX';
    return Math.abs(stupne(uhel(A, B, C)) - st) > 1e-6 ? 'úhel BAC není ' + st + '°' : null;
  },
  rovnobeznikUhel(u) {
    const { A, S } = u.dane.body, p = u.dane.primky[0], { B, C, D } = u.reseni[0], st = cislo(u.text, /má velikost (\d+)°/);
    if (G.vzdal(G.stred(A, C), S) > EPS || G.vzdal(G.stred(B, D), S) > EPS) return 'S není střed úhlopříček';
    if (!naPrimce(B, p)) return 'B neleží na přímce p';
    if (Math.abs(stupne(uhel(S, A, B)) - st) > 1e-6) return 'úhel ASB není ' + st + '°';
    // jediné řešení: rameno souměrné podle přímky SA (druhá strana) přímku p neprotne
    const e = G.jednot(G.odecti(A, S)), d = G.jednot(G.odecti(B, S)), d2 = G.odecti(G.nasob(e, 2 * G.skal(d, e)), d);
    const Y = G.prusecikPP(S, G.secti(S, d2), p.p, p.q);
    return Y && G.skal(G.odecti(Y, S), d2) > 0 ? 'přímku p protne i rameno na druhé straně — řešení jsou dvě' : null;
  },
  pravouhlyUhel(u) {
    const { A } = u.dane.body, [b, c] = u.dane.primky, st = cislo(u.text, /při vrcholu C je (\d+)°/);
    for (const { B, C } of u.reseni) {
      if (!naPrimce(A, b) || !naPrimce(B, b) || !naPrimce(C, c)) return 'vrcholy neleží na svých přímkách';
      if (Math.abs(uhel(A, B, C) - Math.PI / 2) > 1e-9) return 'úhel při A není pravý';
      if (Math.abs(stupne(uhel(C, A, B)) - st) > 1e-6) return 'úhel při C není ' + st + '°';
    }
    const [r1, r2] = u.reseni;
    return G.vzdal(r1.C, r2.C) < EPS && G.skal(G.odecti(r1.B, A), G.odecti(r2.B, A)) < 0 ? null : 'řešení nejsou souměrná podle přímky AC';
  },
  lichobeznikUhel(u) {
    const { A, D } = u.dane.body, st = cislo(u.text, /úhlu DAB je (\d+)°/), m = u.text.match(/\|AB\| : \|CD\| = (\d+) : (\d+)/);
    if (!m) return 'v zadání chybí poměr základen';
    for (const { B, C } of u.reseni) {
      if (Math.abs(G.vzdal(A, B) - G.vzdal(A, D)) > EPS) return '|AB| ≠ |AD|';
      if (Math.abs(stupne(uhel(A, D, B)) - st) > 1e-6) return 'úhel DAB není ' + st + '°';
      if (G.vzdal(G.jednot(G.odecti(B, A)), G.jednot(G.odecti(C, D))) > 1e-9) return 'základny AB a DC nejsou rovnoběžné a souhlasné';
      if (Math.abs(G.vzdal(D, C) * m[1] - G.vzdal(A, B) * m[2]) > EPS) return 'poměr základen nesedí';
      const q = [A, B, C, D], z = q.map((x, i) => G.vekt(G.odecti(q[(i + 1) % 4], x), G.odecti(q[(i + 2) % 4], q[(i + 1) % 4])));
      if (!(z.every(v => v > 0) || z.every(v => v < 0))) return 'lichoběžník není konvexní';
    }
    const [r1, r2] = u.reseni, e = G.odecti(D, A);
    return G.vekt(e, G.odecti(r1.B, A)) * G.vekt(e, G.odecti(r2.B, A)) < 0 ? null : 'řešení nejsou na opačných stranách přímky AD';
  },
  tupyUhelVyska(u) {
    const { A, C, M } = u.dane.body, { B } = u.reseni[0], st = cislo(u.text, /při vrcholu C je (\d+)°/), v = cislo(u.text, /měří (\d+(?:,\d+)?) cm/) * G.CM;
    if (Math.abs(G.vzdalOdPrimky(B, A, C) - v) > EPS) return 'výška na stranu AC nesedí';
    if (Math.abs(stupne(uhel(C, A, B)) - st) > 1e-6) return 'úhel při C není ' + st + '°';
    const s = [[A, B], [B, C], [C, A]].map(([X, Y]) => Math.sign(G.vekt(G.odecti(Y, X), G.odecti(M, X))));
    return s[0] === s[1] && s[1] === s[2] ? null : 'M neleží uvnitř trojúhelníku';
  },
  // ── typy 41–48 (dávka 1: M9 2025–2026) ──
  rovnoramennyStred(u) {
    const { A, S } = u.dane.body, p = u.dane.primky[0];
    for (const { C, P: Pp, B: Bb } of u.reseni) {
      if (G.vzdal(G.stred(A, C), S) > EPS) return 'S není střed ramene AC';
      if (G.vzdal(G.stred(Bb, C), Pp) > EPS) return 'P není střed ramene BC';
      if (!naPrimce(Pp, p)) return 'P neleží na přímce p';
      if (Math.abs(G.vzdal(A, C) - G.vzdal(Bb, C)) > EPS) return 'ramena AC a BC nejsou shodná';
      if (G.vzdalOdPrimky(Bb, A, C) < 20) return 'trojúhelník je skoro úsečka';
    }
    return G.vzdal(u.reseni[0].P, u.reseni[1].P) < 30 ? 'obě řešení splývají' : null;
  },
  obdelnikKolmice(u) {
    const { U: Uu, V } = u.dane.body, k = u.dane.primky[0], { K: Kk, L, M, N } = u.reseni[0];
    const e = obdelnik4(Kk, L, M, N); if (e) return e;
    if (!naPrimce(Kk, k) || !naPrimce(L, k)) return 'strana KL neleží na přímce k';
    if (G.vzdal(G.stred(Kk, M), V) > EPS) return 'V není průsečík úhlopříček';
    if (G.vzdalOdUsecky(Uu, Kk, N) > EPS) return 'U neleží na straně KN';
    return Math.min(G.vzdal(Uu, Kk), G.vzdal(Uu, N)) < 30 ? 'U neleží uvnitř strany KN (je u vrcholu)' : null;
  },
  trojuhelnikRozdil(u) {
    const { A } = u.dane.body, [b, c] = u.dane.primky, d = cislo(u.text, /o (\d+(?:,\d+)?) cm delší/) * G.CM;
    if (!(d > 0)) return 'ze zadání nejde přečíst rozdíl stran';
    for (const { B: Bb, C } of u.reseni) {
      if (!naPrimce(Bb, b)) return 'B neleží na přímce b';
      if (Math.abs(G.skal(G.odecti(Bb, A), G.jednot(G.odecti(b.q, b.p)))) > EPS) return 'AB není kolmá k přímce b';
      if (!naPrimce(C, c)) return 'C neleží na přímce c';
      if (Math.abs(G.vzdal(Bb, C) - G.vzdal(A, Bb) - d) > EPS) return '|BC| − |AB| = ' + ((G.vzdal(Bb, C) - G.vzdal(A, Bb)) / G.CM).toFixed(3) + ' cm, zadání chce ' + (d / G.CM);
      if (G.vzdalOdPrimky(C, A, Bb) < 20) return 'trojúhelník je skoro úsečka';
    }
    return G.vzdal(u.reseni[0].B, u.reseni[1].B) > EPS || G.vzdal(u.reseni[0].C, u.reseni[1].C) < 30 ? 'řešení nemají společné B, nebo splývají' : null;
  },
  pravouhlyRovnoramenny(u) {
    const { B: Bb, D } = u.dane.body, p = u.dane.primky[0], { C } = u.reseni[0];
    if (Math.abs(G.skal(G.odecti(Bb, C), G.odecti(D, C))) > EPS * 1e3) return 'úhel BCD není pravý';
    if (Math.abs(G.vzdal(C, Bb) - G.vzdal(C, D)) > EPS) return 'trojúhelník BCD není rovnoramenný (|CB| ≠ |CD|)';
    const dp = x => G.vzdalOdPrimky(x, p.p, p.q);
    if (!(dp(C) > dp(Bb))) return 'C není od p dál než B';
    // druhý kandidát (zrcadlový obraz C podle BD) nesmí podmínku také splnit — řešení je jediné
    const C2 = G.osove(C, Bb, D);
    return dp(C2) > dp(Bb) ? 'podmínku splňují oba kandidáty — řešení by nebylo jednoznačné' : null;
  },
  obdelnikOpsana(u) {
    const { D, S, U: Uu } = u.dane.body, { A, B: Bb, C } = u.reseni[0];
    const e = obdelnik4(A, Bb, C, D); if (e) return e;
    const r = [A, Bb, C, D].map(x => G.vzdal(S, x));
    if (Math.max(...r) - Math.min(...r) > EPS) return 'S nemá od všech vrcholů stejnou vzdálenost';
    if (G.vzdalOdPrimky(Uu, A, C) > EPS) return 'U neleží na přímce AC';
    return G.vzdalOdPrimky(D, A, C) < 20 ? 'D leží na přímce AC (úhlopříčka by splynula s DB)' : null;
  },
  sestiuhelnikOsa(u) {
    const { A, O, P: Pp } = u.dane.body, { B: Bb, C, D, E, F } = u.reseni[0], V = [A, Bb, C, D, E, F];
    const s = V.map((x, i) => G.vzdal(x, V[(i + 1) % 6])), dv = V.map((x, i) => G.vzdal(x, V[(i + 2) % 6]));
    if (Math.max(...s) - Math.min(...s) > EPS) return 'strany nejsou shodné';
    if (Math.abs(dv[0] - s[0] * Math.sqrt(3)) > 1e-6 || Math.max(...dv) - Math.min(...dv) > EPS) return 'šestiúhelník není pravidelný (kratší úhlopříčky ≠ √3 · strana)';
    const Sx = G.bod(V.reduce((a, x) => a + x.x, 0) / 6, V.reduce((a, x) => a + x.y, 0) / 6);
    if (Math.abs(G.vzdal(Sx, A) - s[0]) > 1e-6) return 'poloměr opsané kružnice ≠ strana';
    if (Math.abs(G.vzdal(O, A) - G.vzdal(O, Bb)) > EPS || Math.abs(G.vzdal(Pp, A) - G.vzdal(Pp, Bb)) > EPS) return 'přímka OP není osa strany AB';
    const dir = G.odecti(Pp, O), t = G.skal(G.odecti(Sx, O), dir), o = G.vekt(G.odecti(Sx, O), dir);
    if (Math.abs(o) > 1e-6 * G.vzdal(O, Pp) || t <= 0) return 'střed S neleží na polopřímce OP';
    // druhý možný střed (obraz S podle středu AB) na polopřímce NEleží — řešení je jediné
    const S2 = G.stredove(Sx, G.stred(A, Bb));
    return G.skal(G.odecti(S2, O), dir) > 0 ? 'druhý kandidát na střed leží na polopřímce OP taky' : null;
  },
  rovnobeznikUhlopricka(u) {
    const { A, D, M } = u.dane.body, { B: Bb, C } = u.reseni[0], dm = G.vzdal(D, M);
    if (G.vzdal(G.secti(A, C), G.secti(Bb, D)) > EPS) return 'A + C ≠ B + D (úhlopříčky se nepůlí)';
    const bd = G.odecti(Bb, D), dmv = G.odecti(M, D);
    if (Math.abs(G.vekt(bd, dmv)) > EPS * 1e3 || G.skal(bd, dmv) <= 0) return 'úhlopříčka BD neleží na polopřímce DM';
    if (Math.abs(G.vzdal(A, C) - dm) > EPS) return '|AC| ≠ |DM|';
    if (G.vzdalOdPrimky(A, D, M) < 20) return 'A leží na přímce DM (rovnoběžník je úsečka)';
    // kružnice (A, ½|DM|) protne přímku DM dvakrát; na polopřímce DM leží právě jeden průsečík
    const X = G.prusecikyPK(D, M, A, dm / 2).filter(x => G.skal(G.odecti(x, D), dmv) > 0);
    return X.length === 1 ? null : 'na polopřímce DM leží ' + X.length + ' možných středů (má být právě 1)';
  },
  rovnoramennyTc(u) {
    const { A, B: Bb, M } = u.dane.body, S = G.stred(A, Bb), ab = G.vzdal(A, Bb), strany = [];
    for (const { C } of u.reseni) {
      const sc = G.odecti(C, S), sm = G.odecti(M, S);
      if (Math.abs(G.vekt(sc, sm)) > EPS * 1e3 || G.skal(sc, sm) <= 0) return 'M neleží na polopřímce SC (těžnici t_c)';
      const m = G.vzdal(S, M), c = G.vzdal(S, C);
      if (m >= c - 30) return 'M neleží uvnitř trojúhelníku (je u vrcholu C)';
      if (Math.abs(m - c / 3) < 10) return 'M je těžiště';
      const ca = G.vzdal(C, A), cb = G.vzdal(C, Bb);
      if (Math.abs(ca - cb) < 1) return 'C je na ose AB (základna AB), ale M na ose není';
      if (Math.abs(ca - ab) > EPS && Math.abs(cb - ab) > EPS) return 'trojúhelník není rovnoramenný (|CA| = |AB| ani |CB| = |AB|)';
      strany.push(Math.abs(ca - ab) < EPS ? 'A' : 'B');
    }
    return strany[0] === strany[1] ? 'obě řešení mají rameno ze stejného vrcholu' : null;
  },
  // ── typy 49–56 (dávka 2: M9 2023–2025) ──
  rovnoramennyVyskaM(u) {
    const { B: Bb, M } = u.dane.body, q = u.dane.primky[0], { A, C } = u.reseni[0];
    if (!naPrimce(A, q)) return 'A neleží na přímce q';
    if (Math.abs(G.vzdal(C, A) - G.vzdal(C, Bb)) > EPS) return 'ramena CA a CB nejsou shodná (základna má být AB)';
    if (Math.abs(G.skal(G.jednot(G.odecti(Bb, M)), G.jednot(G.odecti(C, A)))) > 1e-9) return 'BM není kolmá na AC';
    if (G.vzdalOdUsecky(M, A, C) > EPS) return 'M neleží na straně AC';
    return Math.min(G.vzdal(M, A), G.vzdal(M, C)) < 30 ? 'M je skoro ve vrcholu' : null;
  },
  rovnobeznikStred(u) {
    const { L, M } = u.dane.body, p = u.dane.primky[0];
    for (const { S, K: Kk, N } of u.reseni) {
      if (!naPrimce(S, p)) return 'S neleží na přímce p';
      if (G.vzdal(G.stred(L, N), S) > EPS || G.vzdal(G.stred(Kk, M), S) > EPS) return 'úhlopříčky se v S nepůlí';
      if (Math.abs(G.vzdal(L, N) - G.vzdal(L, M)) > EPS) return '|LN| ≠ |LM|';
      if (G.vzdalOdPrimky(S, L, M) < 20) return 'rovnoběžník je skoro úsečka';
    }
    return G.vzdal(u.reseni[0].S, u.reseni[1].S) < 30 ? 'řešení splývají' : null;
  },
  rovnostrannyOsa(u) {
    const { A, M } = u.dane.body, A2 = u.dane.body['A′'], { B: Bb, C } = u.reseni[0], s = G.vzdal(A, C);
    if (Math.abs(G.vzdal(A, Bb) - s) > EPS || Math.abs(G.vzdal(Bb, C) - s) > EPS) return 'ABC není rovnostranný';
    if (Math.abs(G.vekt(G.jednot(G.odecti(C, A)), G.jednot(G.odecti(M, A)))) > 1e-9) return 'C neleží na přímce AM';
    if (Math.abs(G.vzdal(C, A) - G.vzdal(C, A2)) > EPS) return 'C neleží na ose úsečky AA′ (osa o nevede bodem C)';
    // jediný společný bod C: A i B leží (přísně) na téže straně osy o; druhý možný vrchol B na opačné
    const n = G.odecti(A2, A), dA = G.skal(G.odecti(A, C), n), dB = G.skal(G.odecti(Bb, C), n), dAlt = G.skal(G.odecti(G.osove(Bb, A, C), C), n);
    if (!(dA * dB > 0) || Math.abs(dB) / G.vzdal(A, A2) < 10) return 'A a B neleží přísně na téže straně osy o';
    return dA * dAlt < 0 ? null : 'druhý rovnostranný trojúhelník nad AC vyhovuje také (řešení není jediné)';
  },
  obdelnikAE(u) {
    const { A, E } = u.dane.body, [a, p] = u.dane.primky, { B: Bb, C, D } = u.reseni[0];
    const e = obdelnik4(A, Bb, C, D); if (e) return e;
    if (!naPrimce(Bb, a) || !naPrimce(E, a) || !naPrimce(A, a)) return 'B neleží na přímce a (AE)';
    if (!naPrimce(C, p) || !naPrimce(E, p)) return 'C neleží na přímce p';
    if (Math.abs(G.vzdal(Bb, D) - G.vzdal(A, E)) > EPS) return '|BD| ≠ |AE|';
    return G.vzdal(C, E) < 30 ? 'C splývá s E (B by splynulo s C)' : null;
  },
  pravouhlyStrana(u) {
    const { C, S } = u.dane.body, p = u.dane.primky[0], dp = G.jednot(G.odecti(p.q, p.p)), prava = [], j = (x, y) => G.jednot(G.odecti(x, y));
    for (const { A, B: Bb } of u.reseni) {
      if (G.vzdal(G.stred(Bb, C), S) > EPS) return 'S není střed BC';
      if (Math.abs(G.vekt(j(Bb, A), dp)) > 1e-9) return 'AB není rovnoběžná s p';
      const pravy = [];
      if (Math.abs(G.skal(j(A, C), j(Bb, C))) < 1e-9) pravy.push('C');
      if (Math.abs(G.skal(j(Bb, A), j(C, A))) < 1e-9) pravy.push('A');
      if (Math.abs(G.skal(j(A, Bb), j(C, Bb))) < 1e-9) pravy.push('B');
      if (pravy.length !== 1) return 'pravý úhel je v ' + pravy.length + ' vrcholech';
      prava.push(pravy[0]);
      if (G.vzdalOdPrimky(A, C, Bb) < 20) return 'trojúhelník je skoro úsečka';
    }
    return prava.slice().sort().join() === 'A,C' ? null : 'pravý úhel má být jednou při A a jednou při C (je ' + prava.join() + ')';
  },
  rovnoramennyKruzP(u) {
    const { A, P: Pp, S } = u.dane.body, k = u.dane.kruznice[0], rozdil = new Set();
    for (const { B: Bb, C } of u.reseni) {
      if (Math.abs(G.vzdal(S, Bb) - k.r) > EPS || Math.abs(G.vzdal(S, C) - k.r) > EPS) return 'B nebo C neleží na kružnici k';
      if (G.vzdalOdPrimky(Bb, A, Pp) > EPS) return 'základna AB neleží na přímce AP';
      if (Math.abs(G.vzdal(C, A) - G.vzdal(C, Bb)) > EPS) return 'ramena CA a CB nejsou shodná';
      if (G.vzdalOdPrimky(C, A, Bb) < 20) return 'trojúhelník je skoro úsečka';
      rozdil.add([Bb, C].map(x => x.x.toFixed(2) + ',' + x.y.toFixed(2)).join('|'));
    }
    return rozdil.size === 4 ? null : 'řešení nejsou čtyři různá (' + rozdil.size + ')';
  },
  thalesQ(u) {
    const { C, Q, S } = u.dane.body, k = u.dane.kruznice[0], prepony = [];
    for (const { A, B: Bb } of u.reseni) {
      if (Math.abs(G.vzdal(S, A) - k.r) > EPS || Math.abs(G.vzdal(S, Bb) - k.r) > EPS) return 'A nebo B neleží na kružnici k';
      if (Math.abs(G.skal(G.jednot(G.odecti(A, C)), G.jednot(G.odecti(Bb, C)))) > 1e-9) return 'úhel ACB není pravý';
      const strany = [['AB', A, Bb], ['CA', C, A], ['CB', C, Bb]].filter(([, X, Y]) => G.vzdalOdUsecky(Q, X, Y) < 1e-6).map(t => t[0]);
      if (!strany.length) return 'žádná strana neprochází bodem Q';
      prepony.push(strany.includes('AB') ? 'AB' : 'odvěsna');
    }
    return prepony.slice().sort().join() === 'AB,odvěsna' ? null : 'jedno řešení má mít Q na přeponě a druhé na odvěsně (je ' + prepony.join() + ')';
  },
  rovnoramennyVyskaC(u) {
    const { A, C } = u.dane.body, p = u.dane.primky[0], { B: Bb } = u.reseni[0];
    if (!naPrimce(C, p)) return 'p neprochází bodem C';
    if (Math.abs(G.vzdal(Bb, A) - G.vzdal(Bb, C)) > EPS) return 'ramena BA a BC nejsou shodná (základna má být AC)';
    if (Math.abs(G.skal(G.jednot(G.odecti(Bb, A)), G.jednot(G.odecti(p.q, p.p)))) > 1e-9) return 'AB není kolmá k p, výška z C neleží na p';
    return G.vzdalOdPrimky(Bb, A, C) < 20 ? 'trojúhelník je skoro úsečka' : null;
  },
  // ── typy 57–64 (dávka 3: M9 2021–2024) ──
  rovnostrannyStred(u) {
    const { C, S } = u.dane.body, { A, B: Bb } = u.reseni[0], s = G.vzdal(A, Bb);
    if (G.vzdal(G.stred(A, Bb), S) > EPS) return 'S není střed AB';
    return Math.abs(G.vzdal(Bb, C) - s) > EPS || Math.abs(G.vzdal(A, C) - s) > EPS ? 'ABC není rovnostranný' : null;
  },
  pravouhlyLichKruz(u) {
    const { A, E, S } = u.dane.body, k = u.dane.kruznice[0], { B: Bb, C, D } = u.reseni[0], j = (x, y) => G.jednot(G.odecti(x, y));
    if ([A, C, D].some(x => Math.abs(G.vzdal(S, x) - k.r) > EPS)) return 'A, C, D neleží na kružnici k';
    if (G.vzdal(G.stred(Bb, C), E) > EPS) return 'E není střed ramene BC';
    if (Math.abs(G.vekt(j(Bb, A), j(D, C))) > 1e-9) return 'základny AB a CD nejsou rovnoběžné';
    if (Math.abs(G.skal(j(Bb, A), j(D, A))) > 1e-9) return 'úhel DAB není pravý';
    if (Math.abs(G.vzdal(A, Bb) - G.vzdal(C, D)) < 15) return 'základny jsou skoro stejné (obdélník)';
    const q = [A, Bb, C, D], z = q.map((x, i) => G.vekt(G.odecti(q[(i + 1) % 4], x), G.odecti(q[(i + 2) % 4], q[(i + 1) % 4])));
    return z.every(v => v > 0) || z.every(v => v < 0) ? null : 'lichoběžník není konvexní';
  },
  rovnoramennyStredQ(u) {
    const { C, S } = u.dane.body, q = u.dane.primky[0];
    for (const { A, B: Bb } of u.reseni) {
      if (G.vzdal(G.stred(C, A), S) > EPS) return 'S není střed ramene CA';
      if (Math.abs(G.vzdal(C, A) - G.vzdal(C, Bb)) > EPS) return 'ramena CA a CB nejsou shodná';
      if (!naPrimce(Bb, q) && !naPrimce(A, q)) return 'na přímce q neleží žádný ze základnových vrcholů';
      if (G.vzdalOdPrimky(Bb, C, A) < 20) return 'trojúhelník je skoro úsečka';
    }
    return G.vzdal(u.reseni[0].B, u.reseni[1].B) < 30 ? 'řešení splývají' : null;
  },
  rovnoramennyOsaQ(u) {
    const d = cislo(u.text, /délku (\d+(?:,\d+)?) cm/) * G.CM, { C, Q } = u.dane.body, p = u.dane.primky[0];
    if (!(d > 0)) return 'ze zadání nejde přečíst délku ramen';
    for (const { A, B: Bb } of u.reseni) {
      if (Math.abs(G.vzdal(C, A) - d) > EPS || Math.abs(G.vzdal(C, Bb) - d) > EPS) return 'ramena neměří ' + d / G.CM + ' cm';
      if (!naPrimce(A, p) && !naPrimce(Bb, p)) return 'na přímce p neleží ani A, ani B';
      if (Math.abs(G.vzdal(Q, A) - G.vzdal(Q, Bb)) > EPS) return 'osa trojúhelníku nevede bodem Q';
      if (G.vzdal(A, Bb) < 30) return 'základna je skoro bod';
    }
    return null;
  },
  obdelnikRovnobezky(u) {
    const { A, X } = u.dane.body, [c, p] = u.dane.primky, kdo = [];
    if (Math.abs(G.vekt(G.jednot(G.odecti(c.q, c.p)), G.jednot(G.odecti(p.q, p.p)))) > 1e-9) return 'c a p nejsou rovnoběžné';
    for (const { B: Bb, C, D } of u.reseni) {
      const e = obdelnik4(A, Bb, C, D); if (e) return e;
      if (!naPrimce(C, c)) return 'C neleží na přímce c';
      const naB = naPrimce(Bb, p), naD = naPrimce(D, p);
      if (naB === naD) return 'na p má ležet právě jeden z vrcholů B, D';
      kdo.push(naB ? 'B' : 'D');
      if (G.vzdalOdUsecky(X, A, Bb) > EPS || Math.min(G.vzdal(X, A), G.vzdal(X, Bb)) < 30) return 'X neleží uvnitř strany AB';
    }
    return kdo.slice().sort().join() === 'B,D' ? null : 'řešení mají mít jedno B a jedno D na p (je ' + kdo.join() + ')';
  },
  rovnobeznikRovnobezkaP(u) {
    const { A, C } = u.dane.body, p = u.dane.primky[0], { B: Bb, D } = u.reseni[0], dp = G.jednot(G.odecti(p.q, p.p)), j = (x, y) => G.jednot(G.odecti(x, y));
    if (G.vzdal(G.secti(A, C), G.secti(Bb, D)) > EPS) return 'A + C ≠ B + D (úhlopříčky se nepůlí)';
    if (Math.abs(G.vekt(j(Bb, A), dp)) > 1e-9 && Math.abs(G.vekt(j(D, A), dp)) > 1e-9) return 'žádná strana z vrcholu A není rovnoběžná s p';
    if (Math.abs(G.skal(j(Bb, D), dp)) > 1e-9) return 'úhlopříčka BD není kolmá k p';
    if (Math.abs(G.skal(j(C, A), dp)) < 1e-3) return 'AC je kolmá k p (řešení by nebylo jednoznačné)';
    return Math.abs(G.vekt(G.odecti(Bb, A), G.odecti(D, A))) < 1000 ? 'rovnoběžník je skoro úsečka' : null;
  },
  obdelnikOpsanaM(u) {
    const { A, B: Bb, M } = u.dane.body, { C, D } = u.reseni[0];
    const e = obdelnik4(A, Bb, C, D); if (e) return e;
    const S = G.stred(A, C);
    return Math.abs(G.vzdal(S, M) - G.vzdal(S, A)) > EPS ? 'M neleží na kružnici opsané obdélníku' : null;
  },
  trojuhelnikOsy(u) {
    const { A, B: Bb, L } = u.dane.body, { C } = u.reseni[0];
    const d = [G.vzdalOdPrimky(L, A, Bb), G.vzdalOdPrimky(L, Bb, C), G.vzdalOdPrimky(L, C, A)];
    if (Math.max(...d) - Math.min(...d) > 1e-6) return 'L není stejně daleko od všech tří stran (není to střed kružnice vepsané)';
    const s = [[A, Bb], [Bb, C], [C, A]].map(([X, Y]) => Math.sign(G.vekt(G.odecti(Y, X), G.odecti(L, X))));
    return s[0] === s[1] && s[1] === s[2] ? null : 'L neleží uvnitř trojúhelníku';
  },
  // ── typy 65–72 (dávka 4: M9 2016–2022) ──
  rovnoramennyDvojnasobek(u) {
    const { L, M, U: Uu } = u.dane.body, d = G.vzdal(L, M);
    // nezávislý výčet všech šesti kandidátů (kružnice z modulu geometrie) a těch, které obsahují U s odstupem od stran
    const uvnitr = (X, A, Bb, C) => { const s = [[A, Bb], [Bb, C], [C, A]].map(([P1, P2]) => G.vekt(G.odecti(P2, P1), G.odecti(X, P1)) / G.vzdal(P1, P2)); return s.every(v => v > 6) || s.every(v => v < -6); };
    const kand = [].concat(G.prusecikyKK(L, 2 * d, M, 2 * d), G.prusecikyKK(L, d, M, d / 2), G.prusecikyKK(L, d / 2, M, d));
    const dobre = kand.filter(K => uvnitr(Uu, K, L, M));
    if (dobre.length !== u.reseni.length) return 'U leží uvnitř ' + dobre.length + ' trojúhelníků, řešení je ' + u.reseni.length;
    for (const { K: Kk } of u.reseni) {
      const s = [G.vzdal(Kk, L), G.vzdal(Kk, M), d].sort((a, b) => a - b);
      if (Math.abs(s[1] - s[2]) > EPS || Math.abs(s[2] - 2 * s[0]) > EPS) return 'strany nejsou b, 2b, 2b';
      if (!dobre.some(k => G.vzdal(k, Kk) < 1e-6)) return 'K není mezi trojúhelníky obsahujícími U';
    }
    return null;
  },
  obdelnikCDCS(u) {
    const { A, S } = u.dane.body;
    for (const { B: Bb, C, D } of u.reseni) {
      const e = obdelnik4(A, Bb, C, D); if (e) return e;
      if (G.vzdal(G.stred(A, C), S) > EPS) return 'S není střed obdélníku';
      if (Math.abs(G.vzdal(C, D) - G.vzdal(C, S)) > EPS) return '|CD| ≠ |CS|';
    }
    return G.vzdal(u.reseni[0].D, u.reseni[1].D) < 30 ? 'řešení splývají' : null;
  },
  pravouhlyRovnoramennyX(u) {
    const { A, X } = u.dane.body, c = u.dane.primky[0], j = (x, y) => G.jednot(G.odecti(x, y)), pri = [];
    for (const { B: Bb, C } of u.reseni) {
      if (!naPrimce(C, c)) return 'C neleží na přímce c';
      if (Math.abs(G.vekt(j(Bb, A), j(X, A))) > 1e-9 || G.skal(G.odecti(Bb, A), G.odecti(X, A)) <= 0) return 'B neleží na polopřímce AX';
      if (Math.abs(G.skal(j(Bb, A), j(C, A))) < 1e-9 && Math.abs(G.vzdal(A, Bb) - G.vzdal(A, C)) < EPS) pri.push('A');
      else if (Math.abs(G.skal(j(A, Bb), j(C, Bb))) < 1e-9 && Math.abs(G.vzdal(Bb, A) - G.vzdal(Bb, C)) < EPS) pri.push('B');
      else return 'trojúhelník není pravoúhlý rovnoramenný s pravým úhlem při A ani při B';
    }
    // nezávislý výčet: B = A + t·x, C leží na kolmici v A (pravý úhel při A) nebo na 45° přímce z A (při B); t z lineární rovnice
    const xh = G.jednot(G.odecti(X, A)), nn = G.bod(-xh.y, xh.x), dc = G.jednot(G.odecti(c.q, c.p)), sd = P => G.vekt(dc, G.odecti(P, c.p));
    let pocet = 0;
    for (const typ of ['A', 'B']) for (const sg of [1, -1]) {
      const dir = typ === 'A' ? G.nasob(nn, sg) : G.secti(xh, G.nasob(nn, sg)), k = G.vekt(dc, dir);
      if (Math.abs(k) > 1e-9 && -sd(A) / k > 20) pocet++;
    }
    if (pocet !== u.reseni.length) return 'úplný výčet dává ' + pocet + ' řešení, úloha ' + u.reseni.length;
    return pri.slice().sort().join() === 'A,B' ? null : 'má být jedno řešení s pravým úhlem při A a jedno při B (je ' + pri.join() + ')';
  },
  rovnobeznikVyskaBD(u) {
    const { A, M, N } = u.dane.body, h = cislo(u.text, /měří (\d+(?:,\d+)?) cm/) * G.CM, { B: Bb, C, D } = u.reseni[0];
    if (!(h > 0)) return 'ze zadání nejde přečíst výšku';
    if (G.vzdal(G.secti(A, C), G.secti(Bb, D)) > EPS) return 'A + C ≠ B + D';
    if (Math.abs(G.vzdalOdPrimky(D, A, Bb) - h) > EPS) return 'výška na AB není ' + h / G.CM + ' cm';
    if (Math.abs(G.vzdal(Bb, D) - G.vzdal(A, D)) > EPS) return '|BD| ≠ |AD|';
    if (G.vzdalOdUsecky(M, A, Bb) > EPS || Math.min(G.vzdal(M, A), G.vzdal(M, Bb)) < 30) return 'M neleží uvnitř strany AB';
    if (G.vzdalOdUsecky(N, A, D) > EPS || Math.min(G.vzdal(N, A), G.vzdal(N, D)) < 30) return 'N neleží uvnitř strany AD';
    return null;
  },
  ctverecPolorovina(u) {
    const { A } = u.dane.body, [a, p] = u.dane.primky, dp = G.jednot(G.odecti(p.q, p.p)), sd = x => G.vekt(dp, G.odecti(x, p.p));
    for (const { B: Bb, C, D } of u.reseni) {
      const e = ctverec4(A, Bb, C, D); if (e) return e;
      if (!naPrimce(Bb, a)) return 'AB neleží na přímce a';
      const d = [Bb, C, D].map(sd);
      if (!d.some(v => Math.abs(v) < 1e-6)) return 'žádný z vrcholů B, C, D neleží na p';
      if (!(d.every(v => v > -1e-6) || d.every(v => v < 1e-6))) return 'čtverec neleží celý v jedné polorovině';
    }
    // nezávislý výčet: čtverec dané strany s (B = A + τ·x·s, D = A + σ·n·s), vrchol V ∈ {B, C, D} na p dává s z lineární rovnice
    const xh = G.jednot(G.odecti(a.q, a.p)), nn = G.bod(-xh.y, xh.x), nalezene = new Set();
    for (const tau of [1, -1]) for (const sg of [1, -1]) for (const dir of [G.nasob(xh, tau), G.nasob(nn, sg), G.secti(G.nasob(xh, tau), G.nasob(nn, sg))]) {
      const k = G.vekt(dp, dir);
      if (Math.abs(k) < 1e-9) continue;
      const s = -sd(A) / k;
      if (s < 45) continue;
      const Bb = G.secti(A, G.nasob(xh, tau * s)), D = G.secti(A, G.nasob(nn, sg * s)), C = G.secti(Bb, G.odecti(D, A)), d = [Bb, C, D].map(sd);
      if (!(d.every(v => v > -1e-6) || d.every(v => v < 1e-6)) || d.some(v => Math.abs(v) > 1e-6 && Math.abs(v) < 12) || Math.abs(sd(A)) < 12) continue;
      nalezene.add([Bb, D].map(q => q.x.toFixed(2) + ',' + q.y.toFixed(2)).join('|'));
    }
    return nalezene.size === u.reseni.length ? null : 'úplný výčet dává ' + nalezene.size + ' čtverců, úloha ' + u.reseni.length;
  },
  lichobeznikKolmeUhl(u) {
    const { B: Bb, P: P1 } = u.dane.body, q = u.dane.primky[0], { A, C, D } = u.reseni[0];
    const e = rovnoramennyLich(A, Bb, C, D); if (e) return e;
    if (!naPrimce(C, q) || !naPrimce(Bb, q)) return 'rameno BC neleží na přímce q';
    const X = G.prusecikPP(A, C, Bb, D);
    if (!X || G.vzdal(X, P1) > 1e-6) return 'úhlopříčky se neprotínají v bodě P';
    if (Math.abs(G.skal(G.jednot(G.odecti(C, A)), G.jednot(G.odecti(D, Bb)))) > 1e-9) return 'úhlopříčky nejsou kolmé';
    // jediné řešení: druhé možné A (opačné otočení BP o 90°) lichoběžník nedá (C′ by neležel za P)
    const A2 = G.secti(P1, G.otoc(G.odecti(Bb, P1), Math.abs(G.vzdal(A, G.secti(P1, G.otoc(G.odecti(Bb, P1), Math.PI / 2)))) < 1e-6 ? -Math.PI / 2 : Math.PI / 2)), C2 = G.prusecikPP(A2, P1, q.p, q.q);
    return C2 && G.skal(G.odecti(C2, P1), G.odecti(P1, A2)) > 0 ? 'druhé A také dává lichoběžník (řešení by nebylo jediné)' : null;
  },
  rovnobeznikDvojnasobek(u) {
    const { A, C } = u.dane.body, p = u.dane.primky[0], dl = G.vzdal(A, C);
    for (const { B: Bb, D } of u.reseni) {
      if (G.vzdal(G.secti(A, C), G.secti(Bb, D)) > EPS) return 'A + C ≠ B + D';
      if (Math.abs(G.vzdal(Bb, D) - 2 * dl) > EPS) return '|BD| ≠ 2|AC|';
      if (!naPrimce(A, p) || !(naPrimce(Bb, p) || naPrimce(D, p))) return 'ani B, ani D neleží na p';
      if (G.vzdalOdPrimky(Bb, A, C) < 20) return 'rovnoběžník je skoro úsečka';
    }
    return G.vzdal(u.reseni[0].B, u.reseni[1].B) < 30 ? 'řešení splývají' : null;
  },
  lichobeznikKruzAC(u) {
    const { A, C, S } = u.dane.body, k = u.dane.kruznice[0], { B: Bb, D } = u.reseni[0], j = (x, y) => G.jednot(G.odecti(x, y));
    if ([A, Bb, C, D].some(x => Math.abs(G.vzdal(S, x) - k.r) > EPS)) return 'vrchol neleží na kružnici k';
    if (Math.abs(G.vzdal(A, Bb) - G.vzdal(A, C)) > EPS) return '|AB| ≠ |AC|';
    if (Math.abs(G.vekt(j(Bb, A), j(D, C))) > 1e-9) return 'základny AB a CD nejsou rovnoběžné';
    if (Math.abs(G.vzdal(A, Bb) - G.vzdal(C, D)) < 15) return 'základny jsou skoro stejné (obdélník)';
    const q = [A, Bb, C, D], z = q.map((x, i) => G.vekt(G.odecti(q[(i + 1) % 4], x), G.odecti(q[(i + 2) % 4], q[(i + 1) % 4])));
    return z.every(v => v > 0) || z.every(v => v < 0) ? null : 'ABCD není konvexní (AC má být úhlopříčka)';
  },
  pravouhlyLichAC(u) {
    const { A, B: Bb } = u.dane.body, p = u.dane.primky[0], L = G.vzdal(A, Bb), C = u.reseni[0].C;
    if (u.reseni.some(s => G.vzdal(s.C, C) > EPS)) return 'řešení nemají společné C';
    if (!naPrimce(C, p) || Math.abs(G.vzdal(A, C) - L) > EPS) return 'C neleží na p, nebo |AC| ≠ |AB|';
    if (!naPrimce(Bb, p)) return 'přímka p neprochází bodem B';
    // C je jediný průsečík kružnice (A, |AB|) s p kromě B
    const druhe = G.prusecikyPK(p.p, p.q, A, L).filter(x => G.vzdal(x, Bb) > 1e-6);
    if (druhe.length !== 1 || G.vzdal(druhe[0], C) > EPS) return 'C není druhý průsečík kružnice (A, |AB|) s p';
    for (const s of u.reseni) { const e = pravouhlyLich4(A, Bb, C, s.D); if (e) return e + ' (D = ' + s.D.x.toFixed(0) + ',' + s.D.y.toFixed(0) + ')'; }
    // úplný výčet D jinou cestou než generátor: strana DA je ∥ BC, nebo kolmá k AB či BC; strana CD je ∥ AB, nebo kolmá k AB či BC.
    // Průsečíky každé z těchto tří přímek přes A s každou z tří přes C jsou všichni možní kandidáti; platí ty, co dají pravoúhlý lichoběžník.
    const uAB = G.jednot(G.odecti(Bb, A)), uBC = G.jednot(G.odecti(C, Bb)), nAB = G.bod(-uAB.y, uAB.x), nBC = G.bod(-uBC.y, uBC.x);
    const prima = (X, d) => [X, G.secti(X, d)], pocetD = [];
    for (const [a1, a2] of [uBC, nAB, nBC].map(d => prima(A, d))) for (const [c1, c2] of [uAB, nAB, nBC].map(d => prima(C, d))) {
      const X = G.prusecikPP(a1, a2, c1, c2);
      if (X && !pocetD.some(y => G.vzdal(X, y) < 1e-6) && !pravouhlyLich4(A, Bb, C, X)) pocetD.push(X);
    }
    if (pocetD.length !== u.reseni.length) return 'úplný výčet dává ' + pocetD.length + ' lichoběžníků, úloha ' + u.reseni.length;
    return u.reseni.every(s => pocetD.some(y => G.vzdal(s.D, y) < 1e-6)) ? null : 'řešení se neshodují s úplným výčtem';
  },
  obdelnikDvePrimky(u) {
    const { R } = u.dane.body, [p, q] = u.dane.primky, { K: Kk, L, M: Mm, N } = u.reseni[0], O = G.prusecikPP(p.p, p.q, q.p, q.q);
    if (!O) return 'p ∥ q';
    const e = obdelnik4(Kk, L, Mm, N); if (e) return e;
    const vr = [Kk, L, Mm, N];
    if (vr.filter(x => naPrimce(x, p)).length !== 2 || vr.filter(x => naPrimce(x, q)).length !== 2) return 'na každé z přímek p, q mají ležet právě dva vrcholy';
    if (G.vzdalOdUsecky(R, Mm, N) > EPS || Math.min(G.vzdal(R, Mm), G.vzdal(R, N)) < 30) return 'R neleží uvnitř strany MN';
    if (G.vzdal(u.pomocne[0], O) > EPS) return 'pomocný bod není průsečík p a q';
    // úplný výčet jinou cestou: R − O = a·up + b·uq; úhlopříčky na p, q se půlí v O a jsou shodné, tedy X = O + s·up, Y = O + σ·s·uq;
    // R leží na XY pro λ = σb / (a + σb) ∈ (0, 1)
    const up = G.jednot(G.odecti(p.q, p.p)), uq = G.jednot(G.odecti(q.q, q.p)), r = G.odecti(R, O), det = G.vekt(up, uq);
    const a = G.vekt(r, uq) / det, b = G.vekt(up, r) / det, nalez = [];
    // zadání radí osu VĚTŠÍHO úhlu: R leží v tom z úhlů p, q, který je tupý (nebo v úhlu k němu vrcholovém)
    if (!(a * b * G.skal(up, uq) < 0)) return 'R neleží v úhlu většího z úhlů, které p a q svírají';
    for (const sg of [1, -1]) {
      const lam = sg * b / (a + sg * b);
      if (!(lam > 0 && lam < 1)) continue;
      const s = a + sg * b, X = G.secti(O, G.nasob(up, s)), Y = G.secti(O, G.nasob(uq, sg * s));
      nalez.push([X, Y, G.stredove(X, O), G.stredove(Y, O)]);
    }
    if (nalez.length !== 1) return 'úplný výčet dává ' + nalez.length + ' obdélníků, úloha 1';
    return vr.every(x => nalez[0].some(y => G.vzdal(x, y) < 1e-6)) ? null : 'obdélník se neshoduje s úplným výčtem';
  },
  ctverecTriBody(u) {
    const a = u.dane.primky[0], pts = [u.dane.body.P, u.dane.body.Q, u.dane.body.R], O0 = a.p;
    const xh = G.jednot(G.odecti(a.q, a.p)), nn = G.bod(-xh.y, xh.x), M = 30;
    // (1) vlastnosti každého řešení ze zadání: čtverec se stranou AB na a; dva body uvnitř DVOU RŮZNÝCH stran, třetí mimo čtverec
    for (const { A, B: Bb, C, D } of u.reseni) {
      const e = ctverec4(A, Bb, C, D); if (e) return e;
      if (!naPrimce(A, a) || !naPrimce(Bb, a)) return 'AB neleží na přímce a';
      const strany4 = [[A, Bb], [Bb, C], [C, D], [D, A]], kde = pts.map(x => strany4.map(([s, t], i) => G.vzdalOdUsecky(x, s, t) <= 1e-6 && Math.min(G.vzdal(x, s), G.vzdal(x, t)) >= M ? i : -1).filter(i => i >= 0));
      const naStranach = kde.filter(l => l.length === 1), k = kde.findIndex(l => l.length === 0);
      if (naStranach.length !== 2 || k < 0) return 'právě dva body mají ležet uvnitř stran a třetí mimo';
      if (naStranach[0][0] === naStranach[1][0]) return 'oba body leží na téže straně';
      if (naStranach.some(l => l[0] === 0)) return 'bod leží na straně AB (na přímce a)';
      const z = [[A, Bb], [Bb, C], [C, D], [D, A]].map(([s, t]) => G.vekt(G.odecti(t, s), G.odecti(pts[k], s)));
      if (z.every(t => t > 0) || z.every(t => t < 0)) return 'třetí bod leží uvnitř čtverce';
    }
    // (2) úplný výčet jinou cestou než generátor: čtverec je dán x0, s, polorovinou; dva body na dvou stranách dají soustavu 2 × 2 (Cramerovo pravidlo)
    const uu = pts.map(x => G.skal(G.odecti(x, O0), xh)), nv = pts.map(x => G.skal(G.odecti(x, O0), nn)), nalez = new Map();
    for (const e of [1, -1]) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) for (const s1 of ['DA', 'BC', 'CD']) for (const s2 of ['DA', 'BC', 'CD']) {
      if (s1 === s2) continue;
      const radek = (k, t) => t === 'DA' ? [1, 0, uu[k]] : t === 'BC' ? [1, 1, uu[k]] : [0, 1, e * nv[k]];
      const r1 = radek(i, s1), r2 = radek(j, s2), det = r1[0] * r2[1] - r1[1] * r2[0];
      if (Math.abs(det) < 1e-9) continue;
      const x0 = (r1[2] * r2[1] - r1[1] * r2[2]) / det, s = (r1[0] * r2[2] - r1[2] * r2[0]) / det;
      if (s < 72) continue;
      const vnitr = (k, t) => t === 'CD' ? uu[k] > x0 + M && uu[k] < x0 + s - M : e * nv[k] > M && e * nv[k] < s - M;
      if (!vnitr(i, s1) || !vnitr(j, s2)) continue;
      const k = 3 - i - j;
      if (Math.hypot(Math.max(0, x0 - uu[k], uu[k] - x0 - s), Math.max(0, -e * nv[k], e * nv[k] - s)) < M) continue;
      nalez.set([e, x0.toFixed(3), s.toFixed(3)].join(), [x0, 0, x0 + s, 0, x0 + s, e * s, x0, e * s]);
    }
    if (nalez.size !== u.reseni.length) return 'úplný výčet dává ' + nalez.size + ' čtverců, úloha ' + u.reseni.length;
    const naPlatne = (v) => { const out = []; for (let t = 0; t < 8; t += 2) out.push(G.secti(O0, G.secti(G.nasob(xh, v[t]), G.nasob(nn, v[t + 1])))); return out; };
    const vse = [...nalez.values()].map(naPlatne);
    return u.reseni.every(s => vse.some(v => [s.A, s.B, s.C, s.D].every(x => v.some(y => G.vzdal(x, y) < 1e-6)))) ? null : 'řešení se neshodují s úplným výčtem';
  },
  kosoctverecVyska(u) {
    const { A, X, Y } = u.dane.body, { B: Bb, C, D } = u.reseni[0], hy = G.vzdal(A, Y), j = (a, b) => G.jednot(G.odecti(b, a)), strana = G.vzdal(A, Bb);
    if ([G.vzdal(Bb, C), G.vzdal(C, D), G.vzdal(D, A)].some(x => Math.abs(x - strana) > EPS)) return 'čtyřúhelník nemá shodné strany';
    if (G.vzdal(G.secti(A, C), G.secti(Bb, D)) > EPS) return 'A + C ≠ B + D (není rovnoběžník)';
    if (Math.abs(G.vekt(j(A, X), j(A, Bb))) > 1e-9 || G.skal(j(A, X), j(A, Bb)) <= 0) return 'B neleží na polopřímce AX';
    if (Math.abs(G.vekt(j(A, Y), j(A, D))) > 1e-9 || G.skal(j(A, Y), j(A, D)) <= 0) return 'D neleží na polopřímce AY';
    if (Math.abs(G.vzdalOdPrimky(D, A, Bb) - hy) > EPS) return 'výška kosočtverce není |AY|';
    // jednoznačnost: výška bodu A + a·u_Y nad AX roste lineárně s a, takže |AD| je jediné číslo, pro které se rovná |AY|
    const sinA = G.vzdalOdPrimky(G.secti(A, j(A, Y)), A, X);
    if (Math.abs(strana - hy / sinA) > 1e-6) return 'strana kosočtverce není |AY| / sin α';
    return strana < 40 ? 'kosočtverec je příliš malý' : null;
  },
  ctverecVepsany(u) {
    const { A, B: Bb, C } = u.dane.body, { S, D, E, F } = u.reseni[0], r = G.vzdal(S, C);
    if ([A, Bb].some(x => Math.abs(G.vzdal(S, x) - r) > EPS)) return 'S není stejně daleko od A, B i C';
    if ([D, E, F].some(x => Math.abs(G.vzdal(S, x) - r) > EPS)) return 'vrchol čtverce neleží na k';
    const e = ctverec4(C, D, E, F); if (e) return e;
    // střed kružnice opsané jinou cestou: průsečík os stran AB a BC (kolmice ve středech)
    const o = (X, Y) => { const M = G.stred(X, Y); return [M, G.secti(M, G.bod(-(Y.y - X.y), Y.x - X.x))]; };
    const S2 = G.prusecikPP(...o(A, Bb), ...o(Bb, C));
    if (!S2 || G.vzdal(S, S2) > 1e-6) return 'S není průsečík os stran';
    // čtverec s vrcholem C na k je jediný: E je obraz C ve středové souměrnosti, D a F obrazy při otočení o ±90° (záměnné)
    const E2 = G.stredove(C, S), R1 = G.secti(S, G.otoc(G.odecti(C, S), Math.PI / 2)), R2 = G.secti(S, G.otoc(G.odecti(C, S), -Math.PI / 2));
    if (G.vzdal(E, E2) > 1e-6) return 'E není protější vrchol';
    return (G.vzdal(D, R1) < 1e-6 && G.vzdal(F, R2) < 1e-6) || (G.vzdal(D, R2) < 1e-6 && G.vzdal(F, R1) < 1e-6) ? null : 'D, F nejsou obrazy C při otočení o ±90°';
  },
  lichobeznikKruzCD(u) {
    const { S, C, D } = u.dane.body, k = u.dane.kruznice[0], p = u.dane.primky[0], { A, B: Bb } = u.reseni[0], r = k.r;
    if ([A, Bb, C, D].some(x => Math.abs(G.vzdal(S, x) - r) > EPS)) return 'vrchol neleží na kružnici k';
    const e = rovnoramennyLich(A, Bb, C, D); if (e) return e;
    if (!naPrimce(C, p) || !naPrimce(D, p)) return 'C, D neleží na p';
    if ([A, Bb].some(x => Math.abs(G.vzdalOdPrimky(x, C, D) - r) > EPS)) return 'vzdálenost A, B od CD není r';
    // úplný výčet jinou cestou: body ve vzdálenosti r od CD leží na dvou rovnoběžkách (po obou stranách CD); protnou k jen v bodech A, B
    const n = G.jednot(G.bod(-(D.y - C.y), D.x - C.x)), nalez = [];
    for (const sg of [1, -1]) { const T0 = G.secti(C, G.nasob(n, sg * r)); for (const x of G.prusecikyPK(T0, G.secti(T0, G.odecti(D, C)), S, r)) nalez.push(x); }
    return nalez.length === 2 && [A, Bb].every(x => nalez.some(y => G.vzdal(x, y) < 1e-6)) ? null : 'úplný výčet dává ' + nalez.length + ' bodů (nebo se neshodují) místo 2';
  },
  lichobeznikTrojnasobek(u) {
    const { B: Bb, D } = u.dane.body, [p, q] = u.dane.primky, { A, C } = u.reseni[0];
    if (!naPrimce(Bb, p) || !naPrimce(A, p)) return 'B, A neleží na p';
    if (!naPrimce(D, q) || !naPrimce(C, q)) return 'D, C neleží na q';
    const e = rovnoramennyLich(A, Bb, C, D); if (e) return e;
    if (Math.abs(uhel(Bb, A, C) - 3 * uhel(Bb, A, D)) > 1e-9) return '∢ABC ≠ 3·∢ABD (' + stupne(uhel(Bb, A, C)).toFixed(2) + '° proti ' + stupne(3 * uhel(Bb, A, D)).toFixed(2) + '°)';
    // úplný výčet jinou cestou: A = B + t·u po přímce p, C je obraz D v osové souměrnosti podle osy úsečky AB; řešení jsou kořeny f(t) = ∢ABC − 3·∢ABD
    const up = G.jednot(G.odecti(p.q, p.p)), np = G.bod(-up.y, up.x);
    const f = t => { const A2 = G.secti(Bb, G.nasob(up, t)), M = G.stred(Bb, A2), C2 = G.osove(D, M, G.secti(M, np)); return uhel(Bb, A2, C2) - 3 * uhel(Bb, A2, D); };
    let koreny = 0;
    for (const [lo, hi] of [[2, 800], [-800, -2]]) { let pred = f(lo); for (let t = lo + 0.25; t <= hi; t += 0.25) { const v = f(t); if (pred * v < 0) koreny++; pred = v; } }
    return koreny === 1 ? null : 'úplný výčet dává ' + koreny + ' řešení místo 1';
  },
  ctverecKruzP(u) {
    const { A, S } = u.dane.body, k = u.dane.kruznice[0], p = u.dane.primky[0], r = k.r, naK = x => Math.abs(G.vzdal(S, x) - r) < 1e-6;
    const sUvnitr = m => { const z = m.map((x, i) => G.vekt(G.odecti(m[(i + 1) % 4], x), G.odecti(S, x))); return z.every(v => v > 1e-9) || z.every(v => v < -1e-9); };
    if (!naK(A) || !naPrimce(A, p)) return 'A není průsečík p a k';
    for (const { B: Bb, C, D } of u.reseni) {
      const e = ctverec4(A, Bb, C, D); if (e) return e;
      if (!naPrimce(Bb, p)) return 'AB neleží na p';
      const n = [A, Bb, C, D].filter(naK).length;
      if (n !== 2) return 'na k leží ' + n + ' vrcholů místo právě dvou';
      if (!sUvnitr([A, Bb, C, D])) return 'S neleží uvnitř čtverce';
    }
    // úplný výčet jinou cestou: třetí společný bod s k dávají průsečíky k s přímkou p (B), s kolmicí k p v A (D) a s úhlopříčkou pod 45° (C), pro obě orientace čtverce
    const up = G.jednot(G.odecti(p.q, p.p)), nn = G.bod(-up.y, up.x), nalez = [];
    for (const w of [up, G.nasob(up, -1)]) for (const m of [nn, G.nasob(nn, -1)]) {
      const smery = { B: w, D: m, C: G.jednot(G.secti(w, m)) };
      for (const kde of ['B', 'C', 'D']) for (const X of G.prusecikyPK(A, G.secti(A, smery[kde]), S, r)) {
        if (G.vzdal(X, A) < 1e-6 || G.skal(G.odecti(X, A), smery[kde]) <= 0) continue;
        const s = kde === 'C' ? G.vzdal(A, X) / Math.SQRT2 : G.vzdal(A, X), Bb = G.secti(A, G.nasob(w, s)), ctv = [A, Bb, G.secti(Bb, G.nasob(m, s)), G.secti(A, G.nasob(m, s))];
        if (ctv.filter(naK).length === 2 && sUvnitr(ctv)) nalez.push(ctv);
      }
    }
    if (nalez.length !== u.reseni.length) return 'úplný výčet dává ' + nalez.length + ' čtverců, úloha ' + u.reseni.length;
    return u.reseni.every(s => nalez.some(c => [s.B, s.C, s.D].every(x => c.some(y => G.vzdal(x, y) < 1e-6)))) ? null : 'řešení se neshodují s úplným výčtem';
  },
  rovnoramennyPrimkaA(u) {
    const { A, B: Bb } = u.dane.body, p = u.dane.primky[0], { C } = u.reseni[0];
    if (!naPrimce(A, p) || !naPrimce(C, p)) return 'A nebo C neleží na p';
    if (Math.abs(G.vzdal(C, A) - G.vzdal(C, Bb)) > EPS) return '|CA| ≠ |CB|';
    const M = G.stred(A, Bb), X = G.prusecikPP(p.p, p.q, M, G.secti(M, G.bod(-(Bb.y - A.y), Bb.x - A.x)));
    if (!X || G.vzdal(X, C) > 1e-6) return 'C není průsečík p s osou AB';
    return Math.min(G.vzdal(C, A), G.vzdal(C, Bb)) < 50 ? 'C je příliš blízko základně' : null;
  },
  rovnoramennyPoloprimka(u) {
    const { A, B: Bb, Y } = u.dane.body, { C } = u.reseni[0];
    if (Math.abs(G.vzdal(C, A) - G.vzdal(C, Bb)) > EPS) return '|CA| ≠ |CB|';
    if (Math.abs(G.vekt(G.jednot(G.odecti(Y, Bb)), G.jednot(G.odecti(C, Bb)))) > 1e-9 || G.skal(G.odecti(Y, Bb), G.odecti(C, Bb)) <= 0) return 'C neleží na polopřímce BY';
    const M = G.stred(A, Bb), X = G.prusecikPP(Bb, Y, M, G.secti(M, G.bod(-(Bb.y - A.y), Bb.x - A.x)));
    return X && G.vzdal(X, C) < 1e-6 ? null : 'C není průsečík polopřímky BY s osou AB';
  },
  rovnoramennyZaklQ(u) {
    const { C } = u.dane.body, q = u.dane.primky[0], { A, B: Bb } = u.reseni[0], l = cislo(u.text, /délku (\d+(?:,\d+)?) cm/) * G.CM;
    if (!(l > 0)) return 'ze zadání nejde přečíst délku základny';
    if (!naPrimce(A, q) || !naPrimce(Bb, q)) return 'A nebo B neleží na q';
    if (Math.abs(G.vzdal(A, Bb) - l) > EPS) return '|AB| není ' + l / G.CM + ' cm';
    if (Math.abs(G.vzdal(C, A) - G.vzdal(C, Bb)) > EPS) return '|CA| ≠ |CB|';
    return G.vzdalOdPrimky(C, q.p, q.q) < 50 ? 'C je příliš blízko přímce q' : null;
  },
  ctverecStredP(u) {
    const { S } = u.dane.body, p = u.dane.primky[0], { A, B: Bb, C, D } = u.reseni[0];
    const e = ctverec4(A, Bb, C, D); if (e) return e;
    if (G.vzdal(G.stred(A, C), S) > EPS || G.vzdal(G.stred(Bb, D), S) > EPS) return 'S není středem čtverce';
    if (!naPrimce(Bb, p)) return 'B neleží na p';
    if (Math.abs(G.vekt(G.jednot(G.odecti(C, A)), G.jednot(G.odecti(p.q, p.p)))) > 1e-9) return 'AC není rovnoběžná s p';
    // jednoznačnost jinou cestou: pro B(t) na p je směr AC kolmý na SB; rovnoběžnost s p je lineární rovnice v t s jediným kořenem
    const up = G.jednot(G.odecti(p.q, p.p)), g = t => { const B2 = G.secti(p.p, G.nasob(up, t)); return G.vekt(G.bod(-(B2.y - S.y), B2.x - S.x), up); };
    const g0 = g(0), g1 = g(1), t0 = -g0 / (g1 - g0), B3 = G.secti(p.p, G.nasob(up, t0));
    return G.vzdal(B3, Bb) < 1e-6 ? null : 'B není jediný kořen rovnice (kořen je jinde o ' + G.vzdal(B3, Bb).toFixed(2) + ')';
  },
};
const POCET_RESENI = { thales: 2, osa: 1, kruznice: 2, vyska: 2, soumernost: 1, rovnobeznik: 1, obdelnik: 2, ctverec: 1, kosoctverec: 1, lichobeznik: 1, teznice: 2, rovnoramenny: 2,
  stredova: 1, osauhlu: 1, opsana: 1, vysky: 1, obdelnikUhl: 2, obdelnikM: 1, lichobeznikZakl: 1, rovnoramennyOsa: 1, ctverecUhl: 1, vcTc: 1,
  obdelnikStrana: 2, kosoctverecOsa: 1, teziste: 1, dveThalet: 1, rovnoramennyKruz: 2, pravouhlyLich: 1, osaStrany: 2, sestiuhelnik: 1,
  stredyStran: 3, lichobeznikTri: 2, obdelnikSp: 1, rovnoramennyZakl: 1,
  rovnoramennyUhel: 2, uhelOsaStrany: 1, rovnobeznikUhel: 1, pravouhlyUhel: 2, lichobeznikUhel: 2, tupyUhelVyska: 1,
  rovnoramennyStred: 2, obdelnikKolmice: 1, trojuhelnikRozdil: 2, pravouhlyRovnoramenny: 1, obdelnikOpsana: 1, sestiuhelnikOsa: 1, rovnobeznikUhlopricka: 1, rovnoramennyTc: 2,
  rovnoramennyVyskaM: 1, rovnobeznikStred: 2, rovnostrannyOsa: 1, obdelnikAE: 1, pravouhlyStrana: 2, rovnoramennyKruzP: 4, thalesQ: 2, rovnoramennyVyskaC: 1,
  rovnostrannyStred: 1, pravouhlyLichKruz: 1, rovnoramennyStredQ: 2, rovnoramennyOsaQ: 2, obdelnikRovnobezky: 2, rovnobeznikRovnobezkaP: 1, obdelnikOpsanaM: 1, trojuhelnikOsy: 1,
  rovnoramennyDvojnasobek: 3, obdelnikCDCS: 2, pravouhlyRovnoramennyX: 2, rovnobeznikVyskaBD: 1, ctverecPolorovina: 3, lichobeznikKolmeUhl: 1, rovnobeznikDvojnasobek: 2, lichobeznikKruzAC: 1,
  pravouhlyLichAC: 2, obdelnikDvePrimky: 1, ctverecTriBody: 2,
  kosoctverecVyska: 1, ctverecVepsany: 1, lichobeznikKruzCD: 1, lichobeznikTrojnasobek: 1, ctverecKruzP: 3, rovnoramennyPrimkaA: 1, rovnoramennyPoloprimka: 1, rovnoramennyZaklQ: 1, ctverecStredP: 1 };

/* Polopřímka (rameno z úhloměru) v geometrii: průsečík za vrcholem se nepočítá,
   vrchol je bod k přichycení a kreslí se jen od vrcholu dál. Kružnice
   se středem ve vrcholu protne přímku dvakrát, polopřímku jen jednou. */
console.log('── Polopřímka ──');
{
  const V = G.bod(200, 150), ray = { typ: 'poloprimka', p: V, q: G.bod(260, 150) }, k = { typ: 'kruznice', c: V, r: 50 };
  const X = G.pruseciky(ray, k, 0), Xp = G.pruseciky({ typ: 'primka', p: V, q: ray.q }, k, 0);
  ok(Xp.length === 2 && X.length === 1 && Math.abs(X[0].x - 250) < 1e-9, 'polopřímka a kružnice kolem vrcholu: 1 průsečík (přímka 2), a to před vrcholem');
  const l = { typ: 'usecka', p: G.bod(150, 100), q: G.bod(150, 200) };
  ok(G.pruseciky(ray, l, 0).length === 0 && G.pruseciky({ typ: 'poloprimka', p: V, q: G.bod(140, 150) }, l, 0).length === 1, 'úsečka za vrcholem polopřímku neprotne, před vrcholem ano');
  ok(G.prichytne([ray], []).some(x => G.vzdal(x, V) < 1e-9), 'vrchol polopřímky je bod k přichycení');
  const o = G.oriznoutPoloprimku(V, ray.q);
  ok(o && G.vzdal(o.p, V) < 1e-9 && Math.abs(o.q.x - G.W) < 1e-9, 'polopřímka se kreslí od vrcholu k okraji okna, ne za vrchol');
  const r = G.otoc(G.bod(1, 0), Math.PI / 2);
  ok(Math.abs(r.x) < 1e-12 && Math.abs(r.y - 1) < 1e-12, 'otoc: +90° otočí (1, 0) na (0, 1), tedy po směru hodinových ručiček na obrazovce');
}

console.log('── Konstrukce: generátory úloh ──');
ok(K.TYPY.length === 84 && K.TYPY.every(t => VLASTNOST[t]), '84 typů a každý má nezávislou kontrolu (' + K.TYPY.join(', ') + ')');

const N = 300;
for (const typ of K.TYPY) {
  let nul = 0, struktura = [], cisla = 0, tecka = [], okno = 0, odstup = Infinity, odstupDane = Infinity, vada = [], postupBez = 0, hodnoceni = 0, vsechna = 0, bodovani = [], popisky = Infinity;
  const prvni = new Set();
  for (let i = 0; i < N; i++) {
    const u = K.nova(typ);
    if (!u) { nul++; continue; }
    if (!(u.text && u.napovedy.length === 3 && u.napovedy.every(Boolean) && u.postup.length >= 2 && u.postup.every(k => k.text && Array.isArray(k.tvary))
      && u.reseni.length >= 1 && u.reseni.every(s => Object.keys(s).join() === u.hledane.join()) && u.tol === 10)) struktura.push(i);
    if (vsechnaCisla(u, []).some(x => !Number.isFinite(x))) cisla++;
    for (const s of texty(u)) if (/\d\.\d|NaN|undefined|\[object/.test(s)) tecka.push(s);
    const reseni = u.reseni.flatMap(s => Object.values(s)), dane = Object.values(u.dane.body);
    if (!reseni.concat(dane).every(x => x.x >= 20 && x.x <= G.W - 20 && x.y >= 20 && x.y <= G.H - 20)) okno++;
    for (let a = 0; a < reseni.length; a++) {
      // shodný bod = sdílený vrchol dvou řešení (C u obdélníku), ten se nepočítá
      for (let b = a + 1; b < reseni.length; b++) { const d = G.vzdal(reseni[a], reseni[b]); if (d > EPS) odstup = Math.min(odstup, d); }
      for (const d of dane) odstupDane = Math.min(odstupDane, G.vzdal(reseni[a], d));
    }
    const v = u.reseni.length === POCET_RESENI[typ] ? VLASTNOST[typ](u) : 'řešení je ' + u.reseni.length + ' místo ' + POCET_RESENI[typ];
    if (v) vada.push(v);
    // postup ukáže každý hledaný bod (krokování řešení)
    const bodyPostupu = u.postup.flatMap(k => k.tvary.filter(t => t.typ === 'bod').map(t => t.p));
    if (!reseni.every(x => bodyPostupu.some(y => G.vzdal(x, y) <= EPS))) postupBez++;
    // „Najděte všechna řešení." tam, kde je jich víc (tak to píše CERMAT)
    if (u.reseni.length > 1 && !/Najděte všechna řešení\./.test(u.text)) vsechna++;
    // hodnocení nad touto úlohou: všechna řešení → správně; o jedno míň → ne; jen zadané body → nic
    const bodT = p => ({ typ: 'bod', p });
    const vse = G.vyhodnot(u, reseni.map(bodT)), bezJednoho = G.vyhodnot(u, reseni.filter(x => G.vzdal(x, reseni[0]) > EPS).map(bodT)), zadane = G.vyhodnot(u, dane.map(bodT));
    if (!(vse.spravne && !bezJednoho.spravne && zadane.nalezeno === 0)) hodnoceni++;
    /* bodování testu nanečisto podle klíče CERMAT, úloha za 3 b.: posun o 14 jednotek
       leží mezi tolerancí „přesně" (10) a „mírně nepřesně" (18) */
    const posun = x => { const f = Math.random() * 2 * Math.PI; return G.bod(x.x + 14 * Math.cos(f), x.y + 14 * Math.sin(f)); };
    const b3 = tv => G.bodovat(u, tv, 3).body;
    const cekam = [[b3(reseni.map(bodT)), 3, 'přesně'], [b3(reseni.map(x => bodT(posun(x)))), 2, 'mírně nepřesně'], [b3([]), 0, 'nic'], [b3(dane.map(bodT)), 0, 'jen zadané body']];
    if (u.reseni.length > 1) cekam.push([b3(Object.values(u.reseni[0]).map(bodT)), 2, 'jen první řešení přesně'], [b3(Object.values(u.reseni[0]).map(x => bodT(posun(x)))), 1, 'jen první řešení mírně nepřesně']);
    if (u.hledane.length > 1) cekam.push([b3([bodT(Object.values(u.reseni[0])[0])]), 1, 'jen jeden hledaný bod']);
    const sit = []; for (let x = 20; x <= 380; x += 20) for (let y = 20; y <= 280; y += 20) sit.push(bodT(G.bod(x, y)));
    cekam.push([b3(sit), 0, 'kropení (síť bodů)'], [G.bodovat(u, reseni.map(x => bodT(posun(x))), 2).body, 1, 'úloha za 2 b., mírně nepřesně']);
    for (const [je, ma, co] of cekam) if (je !== ma) bodovani.push(co + ' → ' + je + ' b. místo ' + ma);
    prvni.add(dane[0].x.toFixed(1) + ',' + dane[0].y.toFixed(1));
    // popsané body (zadané + body s popiskem v postupu) se nesmí překrývat popisky
    const popsane = dane.concat(...u.postup.map(k => k.tvary.filter(t => t.typ === 'bod' && t.popis).map(t => t.p)));
    for (let a = 0; a < popsane.length; a++) for (let b = a + 1; b < popsane.length; b++) { const d = G.vzdal(popsane[a], popsane[b]); if (d > EPS) popisky = Math.min(popisky, d); }
  }
  console.log('  ' + typ + ': nejmenší odstup řešení ' + (odstup === Infinity ? '—' : odstup.toFixed(1)) + ', od zadaného bodu ' + odstupDane.toFixed(1) + ' (tolerance přesně 10, mírně 18)');
  ok(nul === 0, typ + ': ' + N + ' losování, žádné nevrátí null (' + nul + ')');
  ok(struktura.length === 0 && cisla === 0, typ + ': úplná struktura a žádné NaN/∞ v číslech (' + struktura.length + ' / ' + cisla + ')');
  ok(tecka.length === 0, typ + ': texty bez desetinné tečky, NaN a undefined' + (tecka.length ? ' — např. „' + tecka[0] + '"' : ''));
  ok(okno === 0, typ + ': zadané body i řešení leží v okně s okrajem 20 (' + okno + ' mimo)');
  // 2 × mírná tolerance (18): jedna značka nesmí ani „mírně" splnit dva různé body
  ok(odstup >= 36 && odstupDane >= 36, typ + ': řešení jsou od sebe i od zadaných bodů aspoň 2 × tolerance mírné nepřesnosti — jeden bod nesplní dvě řešení a zadaný bod žádné');
  ok(vada.length === 0, typ + ': nezávislá kontrola řešení proti zadání' + (vada.length ? ' — ' + vada.length + '×, např. ' + vada[0] : ''));
  ok(postupBez === 0 && vsechna === 0, typ + ': postup ukáže každý hledaný bod a víc řešení = „Najděte všechna řešení." (' + postupBez + ' / ' + vsechna + ')');
  ok(hodnoceni === 0, typ + ': hodnocení — všechna řešení správně, o jedno míň ne, zadané body nic (' + hodnoceni + ' vad)');
  ok(bodovani.length === 0, typ + ': bodování jako klíč CERMAT (přesně 3, mírně 2, část 1–2, kropení 0)' + (bodovani.length ? ' — ' + bodovani.length + '×, např. ' + bodovani[0] : ''));
  // naměřeno nejméně 30 (kosočtverec); dřív u osy 0,1 (P, Q na X) a u výšky 0,1 (K na C₁)
  ok(popisky >= 25, typ + ': popsané body leží aspoň 25 jednotek od sebe, popisky se nepřekrývají (nejméně ' + popisky.toFixed(1) + ')');
  ok(prvni.size >= N * 0.95, typ + ': čísla se losují (' + prvni.size + ' různých zadání z ' + N + ')');
}

/* střídání typů: nova() bez typu nedá dvakrát po sobě týž a projde všechny.
   Počet losování roste s počtem typů: pevných 300 stačilo na 34 typů, se 40 už
   jeden typ v seedovaném běhu nepadl (šance, že typ chybí, je (1 − 1/(n−1))^N). */
let minuly = null, dvakrat = 0, prazdne = 0;
const videne = new Set();
for (let i = 0; i < K.TYPY.length * 20; i++) {
  const u = K.nova();
  if (!u) { prazdne++; minuly = null; continue; }
  if (u.typ === minuly) dvakrat++;
  minuly = u.typ; videne.add(u.typ);
}
ok(dvakrat === 0 && prazdne === 0 && videne.size === K.TYPY.length, 'bez zadaného typu se typy střídají (' + dvakrat + '× dvakrát po sobě, ' + prazdne + '× nic, ' + videne.size + ' typů)');

// test nanečisto: úloha 9 (3 b.) a 10 (2 b.) mají disjunktní sady typů, jiné pozice nic
const s9 = K.PRO_TEST[9], s10 = K.PRO_TEST[10];
ok(s9.concat(s10).every(t => K.GENERATORY[t]) && !s9.some(t => s10.indexOf(t) >= 0) && K.proTest(5) === null,
  'sady pro úlohy 9 a 10 existují a nepřekrývají se (test nedá dvakrát týž typ), jiná pozice nic');
const los = { 9: new Set(), 10: new Set() };
let mimo = 0;
for (let i = 0; i < 400; i++) for (const c of [9, 10]) { const u = K.proTest(c); if (!u || K.PRO_TEST[c].indexOf(u.typ) < 0) mimo++; else los[c].add(u.typ); }
ok(mimo === 0 && los[9].size === s9.length && los[10].size === s10.length, 'proTest losuje jen ze své sady a projde celou (' + los[9].size + ' + ' + los[10].size + ' typů, ' + mimo + ' mimo)');

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
