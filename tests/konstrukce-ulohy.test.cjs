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
};
const POCET_RESENI = { thales: 2, osa: 1, kruznice: 2, vyska: 2, soumernost: 1, rovnobeznik: 1, obdelnik: 2, ctverec: 1, kosoctverec: 1, lichobeznik: 1, teznice: 2, rovnoramenny: 2,
  stredova: 1, osauhlu: 1, opsana: 1, vysky: 1, obdelnikUhl: 2, obdelnikM: 1, lichobeznikZakl: 1, rovnoramennyOsa: 1, ctverecUhl: 1, vcTc: 1,
  obdelnikStrana: 2, kosoctverecOsa: 1, teziste: 1, dveThalet: 1, rovnoramennyKruz: 2, pravouhlyLich: 1, osaStrany: 2, sestiuhelnik: 1,
  stredyStran: 3, lichobeznikTri: 2, obdelnikSp: 1, rovnoramennyZakl: 1 };

console.log('── Konstrukce: generátory úloh ──');
ok(K.TYPY.length === 34 && K.TYPY.every(t => VLASTNOST[t]), '34 typů a každý má nezávislou kontrolu (' + K.TYPY.join(', ') + ')');

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

// střídání typů: nova() bez typu nedá dvakrát po sobě týž a projde všechny
let minuly = null, dvakrat = 0, prazdne = 0;
const videne = new Set();
for (let i = 0; i < 300; i++) {
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
