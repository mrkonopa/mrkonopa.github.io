/* rpg-cermat-9.js — CERMAT TEST (simulace JPZ) pro RPG Matematika 9 — NULL_BYTE
   Originální úlohy (ne kopie zadání CZVV) ve stejné STRUKTUŘE a BODOVÁNÍ jako
   reálná jednotná přijímací zkouška: 16 úloh, 50 bodů, 70 minut.
   Poměr typů úloh vychází z reálného testu M9A/2025 (otevřené s výsledkem,
   otevřené s postupem, uzavřené A–E, pravda/nepravda A/N, přiřazování).
   Rýsovací konstrukční úlohy (v reálném testu 2) NEJSOU zahrnuty — engine
   nemá kreslicí nástroj — nahrazeny dalšími výpočetními geometrickými úlohami
   se stejnou bodovou dotací.

   window.RPG_CERMAT_9 = { timeLimitSec, maxScore, generate: () => [task,...] }
   task = {
     no, points, title, intro?, svg?,
     parts: [
       { key, points, prompt, ans, showExplain?, sol }   // 'open' — text/number, checkAns()
     ] |
     { kind:'tfgrid', points, statements:[{text,ans:'A'|'N',sol}] } |
     { kind:'mc', points, prompt, options:['A) …',…], ans:'C', sol } |
     { kind:'match', points, prompts:['…','…','…'], options:['A) …',…], ans:['C','A','E'], sol:['…','…','…'] }
   }
   sol = vyřešený postup (krok → vzorec → dosazení), zobrazí se na
   výsledkové obrazovce po odevzdání testu — rozklikávací panel u každé
   úlohy, u špatně zodpovězených částí automaticky rozbalený.

   ROZŠIŘOVÁNÍ: úloha na pozici N v testu = SLOTS[N-1], což je POLE
   variant (funkcí genN, genNb, genNc, …). Při startu testu se z každé
   pozice náhodně vybere jedna varianta — přidáním další funkce do
   SLOTS[N-1] pole se rozšíří variabilita té pozice, aniž by bylo
   nutné cokoliv jinde měnit. Nová varianta musí vracet stejný tvar
   (parts/kind) a STEJNÝ SOUČET points jako ostatní varianty té pozice
   (jinak celkový test nesedí na 50 bodů — ověří tools/verify-cermat.cjs).
*/
(function () {
  'use strict';
  const r1 = n => Math.round(n * 10) / 10;
  const r2 = n => Math.round(n * 100) / 100;
  const pick = arr => arr[ri(0, arr.length - 1)];
  const pr = p => cz(p / 100);                   // procenta jako desetinné číslo: 25 → „0,25"
  /* Zápis čísel a členů v postupech: pravé minus (−), žádné „+ −3" ani „1x". */
  const zn = n => (n < 0 ? '−' + cz(-n) : cz(n));                     // −3 → „−3"
  const pm = n => (n < 0 ? ' − ' : ' + ') + cz(Math.abs(n));          // přičtení: „ + 3" / „ − 3"
  const zav = n => (n < 0 ? `(${zn(n)})` : cz(n));                    // dosazení: „6·(−2)"
  const zlS = (n, d) => (n < 0 ? '−' : '') + Math.abs(n) + '/' + d;  // zlomek: „−2/15"
  const zlZ = (n, d) => (n < 0 ? `(${zlS(n, d)})` : zlS(n, d));       // za operátorem: „· (−2/15)"
  function clen(c, v, prvni) {                                        // člen: „−7a", „ + x", „ − 2y²"
    if (c === 0) return '';
    const telo = (Math.abs(c) === 1 && v ? '' : cz(Math.abs(c))) + v;
    return prvni ? (c < 0 ? '−' : '') + telo : (c < 0 ? ' − ' : ' + ') + telo;
  }
  function mnoho(cleny) {                                             // [[1,'a²'],[−7,'a'],[10,'']] → „a² − 7a + 10"
    let s = '';
    cleny.forEach(([c, v]) => { if (c) s += clen(c, v, s === ''); });
    return s || '0';
  }
  const lcm = (a, b) => a / gcd(a, b) * b;
  const krat = (n, s) => (n === 1 ? s : `${n}·${s}`);                // „3·(x + 2)", ale jen „(x + 2)"
  /* Pozice 4 (rovnice): stejný úvod i zadání u VŠECH variant, aby text ani klávesnice
     neprozradily, kdy rovnice nemá řešení (tak je to i v ostrém testu: „Řešte rovnici"). */
  const UVOD4 = 'Kořen zapište jako číslo. Nemá-li rovnice řešení, napište „nemá řešení“; má-li jich nekonečně mnoho, napište „nekonečně mnoho řešení“.';

  /* ── Vlastní SVG pro CERMAT úlohy (čitelné popisky, žádné překryvy) ── */
  // Sud (rotační válec) s hladinou vody a popiskem obsahu dna POD obrazcem.
  function svgSud(baseArea) {
    const cx = 125, topY = 34, botY = 128, rx = 55, ry = 15;
    return `<svg viewBox="0 0 250 172">`
      + `<path d="M ${cx - rx} ${topY} L ${cx - rx} ${botY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${botY} L ${cx + rx} ${topY}" fill="#12233a" stroke="#19e6e6" stroke-width="2.5"/>`
      + `<path d="M ${cx - rx} 74 L ${cx - rx} ${botY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${botY} L ${cx + rx} 74 A ${rx} ${ry} 0 0 1 ${cx - rx} 74 Z" fill="#0e4a6e" opacity="0.55"/>`
      + `<ellipse cx="${cx}" cy="74" rx="${rx}" ry="${ry}" fill="#1a5a80" stroke="#4cc9f0" stroke-width="1.5"/>`
      + `<ellipse cx="${cx}" cy="${botY}" rx="${rx}" ry="${ry}" fill="none" stroke="#19e6e6" stroke-width="2.5" stroke-dasharray="5 4"/>`
      + `<ellipse cx="${cx}" cy="${topY}" rx="${rx}" ry="${ry}" fill="#1b2742" stroke="#19e6e6" stroke-width="2.5"/>`
      + `<text x="${cx}" y="165" fill="#39ff9e" font-size="14" font-family="monospace" text-anchor="middle">obsah dna S = ${baseArea} cm²</text>`
      + `</svg>`;
  }
  // Dvě rovnoběžky (p, q) s příčkou a VYZNAČENÝMI úhly (oblouk + popisek uvnitř).
  // Zadaný úhel a jemu rovné (α souhlasný, γ vrcholový) jsou modré; β (vedlejší) růžové.
  function svgAngles(given) {
    const A = { x: 172, y: 52 }, B = { x: 120, y: 134 }; // průsečíky příčky s p (nahoře) a q (dole)
    const len = Math.hypot(B.x - A.x, B.y - A.y);
    const dTx = (B.x - A.x) / len, dTy = (B.y - A.y) / len; // příčka směrem dolů (k B)
    const dUx = -dTx, dUy = -dTy;                            // příčka směrem nahoru
    const R = 20, LR = 34;
    // oblouk mezi dvěma jednotkovými směry ve vrcholu V
    // 🔴 Příznak sweep byl OBRÁCENĚ. V soustavě SVG roste y DOLŮ, takže kladný
    // směr otáčení (sweep=1) je po směru hodinových ručiček — a kladný vektorový
    // součin `ax*by − ay*bx` právě takové otočení z a do b znamená. Se špatným
    // příznakem si prohlížeč (kvůli large-arc=0) vybere DRUHÝ možný střed, tedy
    // ten zrcadlený přes tětivu: oblouk se vyboulí K VRCHOLU místo od něj a úhel
    // vypadá vyznačený na opačné straně. Ostré papíry CERMATu i školní učebnice
    // kreslí oblouk se středem ve vrcholu, vypouklý ven (např. M9C/2024 úloha 6).
    function arc(V, ax, ay, bx, by, color) {
      const p1x = V.x + ax * R, p1y = V.y + ay * R, p2x = V.x + bx * R, p2y = V.y + by * R;
      const cross = ax * by - ay * bx, sweep = cross > 0 ? 1 : 0;
      return `<path d="M ${r1(p1x)} ${r1(p1y)} A ${R} ${R} 0 0 ${sweep} ${r1(p2x)} ${r1(p2y)}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
    }
    function lbl(V, ax, ay, bx, by, text, color) {
      let mx = ax + bx, my = ay + by; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
      return `<text x="${r1(V.x + mx * LR)}" y="${r1(V.y + my * LR + 4)}" fill="${color}" font-size="13" font-family="monospace" text-anchor="middle">${text}</text>`;
    }
    const C = '#4cc9f0', P = '#ff5c8a';
    return `<svg viewBox="0 0 260 180">`
      + `<line x1="15" y1="52" x2="245" y2="52" stroke="#19e6e6" stroke-width="2"/>`
      + `<line x1="15" y1="134" x2="245" y2="134" stroke="#19e6e6" stroke-width="2"/>`
      + `<line x1="${A.x + dUx * 44}" y1="${A.y + dUy * 44}" x2="${B.x + dTx * 40}" y2="${B.y + dTy * 40}" stroke="#ff3d7f" stroke-width="2"/>`
      + `<text x="248" y="49" fill="#39ff9e" font-size="13" font-family="monospace">p</text>`
      + `<text x="248" y="131" fill="#39ff9e" font-size="13" font-family="monospace">q</text>`
      // zadaný úhel u A (mezi p vpravo a příčkou nahoru) — modrý
      + arc(A, 1, 0, dUx, dUy, C) + lbl(A, 1, 0, dUx, dUy, given + '°', C)
      // γ vrcholový k zadanému u A (mezi p vlevo a příčkou dolů) — modrý
      + arc(A, -1, 0, dTx, dTy, C) + lbl(A, -1, 0, dTx, dTy, 'γ', C)
      // α souhlasný u B (mezi q vpravo a příčkou nahoru) — modrý
      + arc(B, 1, 0, dUx, dUy, C) + lbl(B, 1, 0, dUx, dUy, 'α', C)
      // β vedlejší k α u B (mezi q vlevo a příčkou nahoru) — růžový
      + arc(B, -1, 0, dUx, dUy, P) + lbl(B, -1, 0, dUx, dUy, 'β', P)
      + `</svg>`;
  }

  function gen1() {
    // 1 bod — druhá odmocnina ze součinu, který je vždy druhou mocninou (bez kalkulačky).
    // V polovině případů jako M9A/2025 ú. 1: „Vypočtěte, kolikrát je součet čísel 16 a 4
    // větší než druhá odmocnina ze součinu čísel 16 a 4" (2,5krát). Dvojice se berou
    // ze všech rozkladů r² = a · b pro r do 30; dřív byly jen čtyři.
    const kolikrat = Math.random() < 0.5, dvojice = [];
    for (let r = 4; r <= 30; r++) for (let a = 2; a < r; a++) {
      const b = r * r / a;
      // podíl na nejvýš dvě desetinná místa, ať se dá spočítat bez kalkulačky
      if (Number.isInteger(b) && b <= 200 && (!kolikrat || ((a + b) * 100) % r === 0)) dvojice.push([a, b, r]);
    }
    const [a, b, r] = pick(dvojice);
    if (kolikrat) {
      const q = (a + b) / r;
      return {
        no: 1, points: 1, title: 'Číselný výraz', okruh: 'vyrazy-mocniny',
        parts: [{ key: '', points: 1,
          prompt: `Vypočítejte, kolikrát je součet čísel ${a} a ${b} větší než druhá odmocnina ze součinu čísel ${a} a ${b}.`,
          ans: String(q),
          sol: [
            `„Kolikrát větší" znamená DĚLENÍ. Spočítej zvlášť součet a odmocninu ze součinu a teprve pak je vyděl.`,
            `Součet: ${a} + ${b} = ${a + b}.`,
            `Součin: ${a} · ${b} = ${a * b} a √${a * b} = ${r}, protože ${r} · ${r} = ${a * b}.`,
            `${a + b} : ${r} = ${cz(q)}, součet je tedy ${cz(q)}krát větší.`
          ] }]
      };
    }
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'vyrazy-mocniny',
      parts: [{ key: '', points: 1,
        prompt: `Vypočítejte druhou odmocninu ze součinu čísel ${a} a ${b}: √(${a} · ${b}) =`,
        ans: String(r),
        /* Postup má tři kroky v pevném tvaru: PRAVIDLO (proč se to dělá
           takhle) → DOSAZENÍ (s mezivýsledkem) → VÝSLEDEK. Kdo úlohu
           spletl, potřebuje nejdřív to pravidlo; samotná aritmetika mu
           řekne jen to, že se netrefil. */
        sol: [
          `Odmocnit jde až jedno číslo — nejdřív tedy spočítej, co je pod odmocninou.`,
          `Součin: ${a} · ${b} = ${a * b}.`,
          `√${a * b} = ${r}, protože ${r} · ${r} = ${a * b}.`
        ] }]
    };
  }

  function gen2() {
    // 3 body — 2.1 celé číslo krát rozdíl zlomků (M9A/2025 ú. 2.1), 2.2 složený zlomek
    // s postupem. Dřív byla 2.2 „(d² − e²) : f", tedy vůbec ne zlomky, ale látka pozice 1.
    let a, B, D, Z, R1;
    for (;;) {
      a = ri(2, 6); B = zlomekZ(2, 9); D = zlomekZ(2, 9);
      if (B[1] === D[1] || lcm(B[1], D[1]) > 24) continue;  // společný jmenovatel potřeba, ale ne přes 24
      Z = zKrok(B, D, -1); R1 = zRed(-a * Z.v[0], Z.v[1]);
      if (R1[1] > 1 && vejdeSe(R1)) break;
    }
    const s2 = slozenyZlomek(false);
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `${ZL} (−${a}) · (${zTxt(B)} − ${zTxt(D)}) =`,
          ans: zAns(R1),
          sol: [
            `Zlomky se dají odečíst, teprve když mají stejného jmenovatele — převeď je na nejmenší společný násobek jmenovatelů a teprve pak násob.`,
            Z.t,
            `(−${a}) · ${zZav(Z.v)} = ${zTxt([-a * Z.v[0], Z.v[1]])}${gcd(a * Math.abs(Z.v[0]), Z.v[1]) > 1 ? ` = ${zTxt(R1)}` : ''}`
          ] },
        { key: '2.2', points: 2, showExplain: true, ...s2 }
      ]
    };
  }

  function gen3() {
    // 4 body — algebraické identity a úpravy (3 podúlohy)
    const a = ri(4, 9); // (x + a)^2 = x^2 + 2a x + a^2
    // 3.1: doplň čísla do (x + _)^2 = x^2 + 2ax + _
    const mid = 2 * a, last = a * a;
    // 3.2: uprav bez závorek: c - (x+d)(-x) + (e-x)(x+f)
    // c - (x+d)(-x) = c + x^2 + dx
    // (e-x)(x+f) = ex + ef - x^2 - fx
    // total = c + x^2 + dx + ex + ef - x^2 - fx = c + ef + (d+e-f)x
    // Koeficient 0 by z otázky „napište koeficient u x" udělal chyták bez smyslu.
    let c, d, e, f;
    do { c = ri(1, 6); d = ri(1, 5); e = ri(2, 7); f = ri(1, 4); } while (d + e - f === 0);
    const coefX = d + e - f, constT = c + e * f;
    const simplified = mnoho([[coefX, 'x'], [constT, '']]);   // dřív i „1x + 17"
    // 3.3: rozlož na součin vzorcem: g*(2h - g) + h*(2g - 2h) -> uprav a rozlož
    const g = ri(3, 8), h = g; // use a^2-2ab+b^2 pattern generically via g,k
    const k = ri(2, g - 1);
    // expr: g*(g - 2k) + k^2  = g^2 - 2gk + k^2 = (g-k)^2
    return {
      no: 3, points: 4, title: 'Algebraické výrazy',
      parts: [
        { key: '3.1', points: 1,
          prompt: `Do rámečků doplňte čísla, aby platila rovnost: (x + ?)² = x² + ${mid}x + ? — napište DRUHÉ (poslední) doplněné číslo.`,
          ans: String(last),
          sol: [
            `Porovnej zadání se vzorcem (x + a)² = x² + 2ax + a²: prostřední člen prozradí číslo a a poslední doplněné číslo je pak jeho druhá mocnina.`,
            `2a = ${mid}, takže a = ${mid} : 2 = ${a}.`,
            `Druhé doplněné číslo: a² = ${a} · ${a} = ${last}.`
          ] },
        { key: '3.2', points: 1, showExplain: true,
          prompt: `Upravte na co nejjednodušší tvar bez závorek a napište koeficient u x: ${c} − (x + ${d})·(−x) + (${e} − x)·(x + ${f})`,
          ans: String(coefX),
          sol: [
            `Roznásob každý součin zvlášť a hlídej znaménka — minus před součinem otočí znaménko u všech jeho členů. Pak sečti členy se stejnou mocninou x.`,
            `−(x + ${d})·(−x) = x² + ${clen(d, 'x', true)} a (${e} − x)·(x + ${f}) = ${e}x + ${e * f} − x²${clen(-f, 'x')}.`,
            `Dohromady: ${c} + x² + ${clen(d, 'x', true)} + ${e}x + ${e * f} − x²${clen(-f, 'x')} — členy x² se vyruší a zbude ${simplified}.`,
            `Koeficient u x: ${d} + ${e} − ${f} = ${zn(coefX)}.`
          ] },
        { key: '3.3', points: 2, showExplain: true,
          prompt: `Upravte výraz x·(x − ${2 * k}) + ${k}² a rozložte na součin pomocí vzorce. Napište číslo, které patří místo otazníku v rozkladu (x − ?)².`,
          ans: String(k),
          sol: [
            `Nejdřív roznásob a sečti; výsledek pak porovnej se vzorcem (a − b)² = a² − 2ab + b². Poslední člen prozradí b, prostřední ho potvrdí.`,
            `x·(x − ${2 * k}) + ${k}² = x² − ${2 * k}x + ${k * k}.`,
            `${k * k} = ${k}² a prostřední člen ${2 * k}x = 2 · x · ${k} sedí, takže výraz je (x − ${k})² — místo otazníku patří ${k}.`
          ] }
      ]
    };
  }

  function gen4() {
    // 4 body — 4.1 ZLOMEK PŘED ZÁVORKOU (2023 1. ř. ú. 5.2, 2026 2. ř. ú. 4.2):
    // k/p·(x − a) = x/q + c. Kořen se volí první a c se z něj dopočítá; po vynásobení
    // společným násobkem jmenovatelů zbude u x koeficient 2–6 (ne 1, ne 0).
    let p, q, k, a, x, c, L, K;
    do {
      p = pick([2, 3, 4, 5, 6]); q = pick([2, 3, 4, 6]); k = ri(1, p - 1); L = lcm(p, q);
      a = ri(1, 9); x = ri(-6, 12); c = (k * (x - a)) / p - x / q;
      K = k * L / p - L / q;
    } while (gcd(k, p) !== 1 || p === q || L > 12 || !Number.isInteger(c) || c === 0 || x === 0 || x === a
      || Math.abs(K) < 2 || Math.abs(K) > 6);
    const kp = k * L / p, lq = L / q, P = L * c + kp * a;
    // 4.2 desetinná čísla se závorkou (M9A/2025 ú. 4.2 bez „nemá řešení"): počítá se v desetinách
    let y1, c10, d10, m4, n10, cm10, o10;                    // y − (y + m)·c = n·y + o
    do {
      y1 = ri(-4, 9); c10 = ri(2, 5); d10 = ri(2, 3); m4 = ri(2, 8);   // c = 0,2–0,5; u y po úpravě 0,2–0,3
      n10 = 10 - c10 - d10; cm10 = c10 * m4; o10 = y1 * d10 - cm10;
    } while (y1 === 0 || o10 === 0);
    const lhs10 = 10 - c10;
    return {
      no: 4, points: 4, title: 'Rovnice', intro: UVOD4,
      parts: [
        { key: '4.1', points: 2, showExplain: true, klavesnice: 'text',
          prompt: `Řešte rovnici: ${k}/${p}·(x − ${a}) = x/${q}${pm(c)}`,
          ans: String(x),
          sol: [
            `Zlomků se zbavíš, když CELOU rovnici vynásobíš společným násobkem jmenovatelů, tady ${L}. Zlomek před závorkou se tím změní na celé číslo a závorku pak roznásobíš jako obvykle.`,
            `${k}/${p}·(x − ${a}) = x/${q}${pm(c)}   | ·${L}`,
            `${krat(kp, `(x − ${a})`)} = ${clen(lq, 'x', true)}${pm(L * c)}`,
            `${clen(kp, 'x', true)} − ${kp * a} = ${clen(lq, 'x', true)}${pm(L * c)}`,
            `${clen(K, 'x', true)} = ${zn(L * c)} + ${kp * a} = ${zn(P)}`,
            `x = ${zn(P)} : ${zav(K)} = ${zn(x)}`
          ] },
        { key: '4.2', points: 2, showExplain: true, klavesnice: 'text',
          prompt: `Řešte rovnici: y − (y + ${m4})·${cz(c10 / 10)} = ${cz(n10 / 10)}y${pm(o10 / 10)}`,
          ans: String(y1),
          sol: [
            `Roznásob závorku — desetinné číslo za ní násobí oba členy. Pak dej členy s y na jednu stranu a čísla na druhou; kdo chce, vynásobí celou rovnici deseti a zbaví se čárek.`,
            `y − ${cz(c10 / 10)}y − ${cz(cm10 / 10)} = ${cz(n10 / 10)}y${pm(o10 / 10)}`,
            `${cz(lhs10 / 10)}y − ${cz(n10 / 10)}y = ${zn(o10 / 10)} + ${cz(cm10 / 10)}`,
            `${cz(d10 / 10)}y = ${zn((o10 + cm10) / 10)}`,
            `y = ${zn((o10 + cm10) / 10)} : ${cz(d10 / 10)} = ${zn(y1)}`
          ] }
      ]
    };
  }

  function gen5() {
    // 4 body — geometrie: pozemek se čtvercem a obdélníkem (2 podúlohy)
    const c5 = ri(2, 4) * 10; // strana čtverce 20/30/40 m ⇒ c²/5 vyjde PŘESNĚ celé (pětina sedí)
    const cel = c5 * c5;
    const domObsah = cel / 5;
    const a5 = c5 / 2; // délka domu = polovina strany
    const b5 = domObsah / a5; // šířka domu = 2c/5 ⇒ 8/12/16 m, vždy celá
    /* Rybníček zadaný PROCENTY, jako v ostré úloze (M9A/2025 ú. 5: 18 % → 558 m²).
       Dřív tu podúloha rovnou prozradila „obsah domu = … a obsah rybníčku = …"
       a zbylo jen odečítání. c² je 400/900/1600, takže p % vyjde vždy celé. */
    const pRybnik = ri(10, 25), rybnik = cel * pRybnik / 100;
    const volna = cel - domObsah - rybnik;
    return {
      no: 5, points: 4, title: 'Pozemek', okruh: 'geometrie',
      svg: (function () {
        const s = 150, x = 30, y = 20;
        return `<svg viewBox="0 0 220 190"><rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" stroke="#19e6e6" stroke-width="2"/><rect x="${x + 12}" y="${y + 10}" width="${s * 0.32}" height="${s * 0.5}" fill="#233" stroke="#39ff9e" stroke-width="1.5"/><text x="${x + s / 2}" y="${y + s + 16}" fill="#fff" font-size="12" font-family="monospace" text-anchor="middle">c = ${c5} m</text></svg>`;
      })(),
      intro: `Pozemek má tvar čtverce se stranou c = ${c5} m. Na pozemku je dům (obdélník) a rybníček. Půdorys domu má obsah rovný pětině rozlohy pozemku.`,
      parts: [
        { key: '5.1', points: 2,
          prompt: `Délka domu a je rovna polovině délky strany pozemku c. Určete šířku domu b (v m).`,
          ans: String(b5),
          sol: [`Pozemek je čtverec, takže jeho obsah je strana krát strana: ${c5} · ${c5} = ${cel} m².`,`Dům zabírá pětinu pozemku: ${cel} : 5 = ${domObsah} m². Jeho délka je polovina strany: a = ${c5} : 2 = ${a5} m.`,`Obdélníkový dům má obsah délka krát šířka, takže šířku dostaneš dělením: b = ${domObsah} : ${a5} = ${b5} m.`] },
        { key: '5.2', points: 2,
          prompt: `Rozloha rybníčku představuje ${pRybnik} % celkové rozlohy pozemku. Vypočítejte v m² rozlohu volné části pozemku, na níž není ani dům, ani rybníček.`,
          ans: String(volna),
          sol: [`Volná část je to, co zbyde, když z celého pozemku odečteš dům i rybníček. Obě plochy je proto potřeba nejdřív vyjádřit v m² — dům je pětina pozemku, rybníček daná procenta.`,
            `Pozemek: ${c5} · ${c5} = ${cel} m². Dům: ${cel} : 5 = ${domObsah} m². Rybníček: ${cel} · ${pRybnik} : 100 = ${rybnik} m².`,
            `Volná část: ${cel} − ${domObsah} − ${rybnik} = ${volna} m².`] }
      ]
    };
  }

  function gen6() {
    // 2 body — válcový sud
    const r6 = ri(15, 30);
    const S6 = Math.round(3.14 * r6 * r6);
    const mm1 = ri(5, 15);
    const litry1 = r1(S6 * mm1 / 1000 * 10 / 10); // S(cm2)*h(cm)=cm3 -> /1000 = l ; mm1/10=cm
    const litry1exact = r1(S6 * (mm1 / 10) / 1000);
    const litry2 = ri(2, 6);
    const mm2 = r1(litry2 * 1000 / S6 * 10);
    return {
      no: 6, points: 2, title: 'Sud', okruh: 'telesa',
      svg: svgSud(S6),
      intro: `Zahradní sud má tvar rotačního válce. Dno sudu má obsah ${S6} cm².`,
      parts: [
        { key: '6.1', points: 1,
          prompt: `Při dešti stoupla hladina vody v sudu o ${mm1} mm. Kolik litrů vody přibylo (zaokrouhlete na 1 des. místo)?`,
          ans: String(litry1exact),
          sol: [`Přibylá voda má tvar válce se stejným dnem jako sud a s výškou, o kterou stoupla hladina. Objem válce = obsah dna · výška, obojí ale musí být ve stejných jednotkách.`,
            `Výška v cm: ${mm1} mm = ${cz(mm1 / 10)} cm. Objem: ${S6} · ${cz(mm1 / 10)} = ${cz(r2(S6 * mm1 / 10))} cm³.`,
            `V litrech (1 l = 1000 cm³): ${cz(r2(S6 * mm1 / 10))} : 1000 ${r2(S6 * mm1 / 10) / 1000 === litry1exact ? '=' : '≈'} ${cz(litry1exact)} l.`] },
        { key: '6.2', points: 1,
          prompt: `Při lijáku přibylo v sudu ${litry2} l vody. O kolik mm stoupla hladina (zaokrouhlete na celé mm)?`,
          ans: String(Math.round(litry2 * 1000 / S6 * 10)),
          sol: [`Přibylá voda je opět válec se dnem sudu. Jeho výšku dostaneš, když objem vydělíš obsahem dna — objem ale musí být v cm³, protože dno je v cm².`,
            `Objem: ${litry2} l = ${litry2 * 1000} cm³. Výška: ${litry2 * 1000} : ${S6} ≈ ${cz(r2(litry2 * 1000 / S6))} cm.`,
            `V milimetrech (1 cm = 10 mm) je to přibližně ${cz(r1(litry2 * 10000 / S6))} mm, po zaokrouhlení ${Math.round(litry2 * 1000 / S6 * 10)} mm.`] }
      ]
    };
  }

  function gen7() {
    // 3 body — úhly na rovnoběžkách s příčkou
    const given = ri(2, 16) * 5; // úhel na jedné rovnoběžce
    const alpha = given;          // souhlasný úhel
    const beta = 180 - given;     // přilehlý (vedlejší)
    const gamma = given;          // vrcholový k alpha
    return {
      no: 7, points: 3, title: 'Úhly na rovnoběžkách', okruh: 'geometrie',
      svg: svgAngles(given),
      intro: `Přímky p, q jsou rovnoběžné a protíná je příčka. Vyznačený úhel na přímce p má velikost ${given}°.`,
      parts: [
        { key: '7.1', points: 1, prompt: `Vypočítejte velikost úhlu α (souhlasný úhel na přímce q).`, ans: String(alpha),
          sol: [`Rovnoběžky protnuté příčkou tvoří dvojice shodných úhlů. Souhlasné úhly leží u obou rovnoběžek na stejné straně příčky a ve stejné poloze.`,
            `Úhel α u přímky q je souhlasný s vyznačeným úhlem ${given}° u přímky p.`,
            `α = ${given}°.`] },
        { key: '7.2', points: 1, prompt: `Vypočítejte velikost úhlu β (vedlejší úhel k α).`, ans: String(beta),
          sol: [`Vedlejší úhly leží u téže přímky vedle sebe a dohromady tvoří přímý úhel 180°.`,
            `Úhel β je vedlejší k úhlu α, a ten má ${given}° (je souhlasný s vyznačeným úhlem).`,
            `β = 180 − ${given} = ${beta}°.`] },
        { key: '7.3', points: 1, prompt: `Vypočítejte velikost úhlu γ (vrcholový úhel k danému úhlu ${given}° na přímce p).`, ans: String(gamma),
          sol: [`Vrcholové úhly leží proti sobě přes průsečík dvou přímek — nemají společné rameno, jen vrchol. Vrcholové úhly jsou vždy shodné.`,
            `Úhel γ je vrcholový k vyznačenému úhlu ${given}° u přímky p.`,
            `γ = ${given}°.`] }
      ]
    };
  }

  function gen8() {
    // 4 body — záhon: z počtu rostlin obvod, rozdíl stran a skupinky (věrné M9A/2025, úloha 8)
    /* 🔴 Dřívější verze psala „na straně 24 m je 60 rostlin" — to je počet
       MEZER. S rostlinou v obou rozích je jich na straně o jednu víc (61).
       Rozdíl dvou stran vyšel správně jen proto, že se ta jednička odečte.
       Strany se teď volí v POČTECH MEZER: kratší (q−1)·u, delší q·u, takže
       je kratší přesně „o q-tinu" a na každou stranu vyjde celý počet mezer.
       Klíč ostré úlohy: 65 rostlin po 40 cm → 26 m, o 5 rostlin, 39 červených. */
    const [q, slovy] = pick([[4, 'o čtvrtinu'], [5, 'o pětinu']]);
    const u = ri(3, 8), dCm = pick([20, 25, 40, 50]);
    const N = u * (4 * q - 3), obvodCm = N * dCm, delsi = q * u * dCm, kratsi = (q - 1) * u * dCm;
    // N = k·(r + 2): k úseků „skupinka červených + dvojice bílých"; červených je nejméně, když je úseků nejvíc
    let k = 0;
    for (let x = 2; x <= N / 3; x++) if (N % x === 0) k = x;
    const cervenych = N - 2 * k, m = x => cz(x / 100);
    return {
      no: 8, points: 4, title: 'Záhon', okruh: 'geometrie',
      intro: `Záhon v parku má tvar čtyřúhelníku, jehož tři strany jsou stejně dlouhé. Každá z těchto tří stran je ${slovy} kratší, než je čtvrtá strana čtyřúhelníku. Po obvodu záhonu je ve stejných rozestupech vysázeno celkem ${N} rostlin, z nichž je po jedné rostlině i v každém rohu záhonu. Rozestupy mezi rostlinami měří ${dCm} cm.`,
      parts: [
        { key: '8.1', points: 2, prompt: `Vypočítejte v metrech obvod záhonu.`, ans: String(obvodCm / 100),
          sol: [`Obvod záhonu je uzavřený: rostlina v rohu patří dvěma stranám zároveň, takže mezer mezi rostlinami je po obvodu přesně tolik, kolik je rostlin.`,
            `Mezer je ${N}, každá měří ${dCm} cm: obvod = ${N} · ${dCm} = ${tis(obvodCm)} cm.`,
            `V metrech: ${tis(obvodCm)} : 100 = ${m(obvodCm)} m.`] },
        { key: '8.2', points: 1, prompt: `Určete, o kolik se liší počet rostlin na nejdelší straně záhonu od počtu rostlin na protější straně záhonu.`, ans: String(u),
          sol: [`Na straně s rostlinou v obou rozích je rostlin o jednu víc než mezer. Ta jedna navíc je ale na obou stranách, takže se počty rostlin liší stejně jako počty mezer.`,
            `Kratší strany mají ${q - 1}/${q} nejdelší strany x, obvod je tedy x + 3 · ${q - 1}/${q} · x = ${4 * q - 3}/${q} · x. Nejdelší strana: x = ${m(obvodCm)} · ${q} : ${4 * q - 3} = ${m(delsi)} m, protější (kratší) ${m(kratsi)} m.`,
            `Na nejdelší straně je ${delsi} : ${dCm} = ${q * u} mezer, na protější ${kratsi} : ${dCm} = ${(q - 1) * u} mezer. Rozdíl: ${q * u} − ${(q - 1) * u} = ${u}.`] },
        { key: '8.3', points: 1, prompt: `Po obvodu záhonu se pravidelně střídají stejně početné skupinky červeně kvetoucích rostlin s dvojicemi bíle kvetoucích rostlin. Určete nejmenší možný počet červeně kvetoucích rostlin po obvodu záhonu.`, ans: String(cervenych),
          sol: [`Obvod se skládá ze stejných úseků „skupinka červených + dvojice bílých". Počet úseků proto musí dělit počet všech rostlin ${N}. Červených je nejméně, když je úseků co nejvíc — každý úsek má ale aspoň 1 červenou, tedy aspoň 3 rostliny.`,
            `Největší dělitel čísla ${N}, pro který vyjdou aspoň 3 rostliny na úsek, je ${k}: ${N} : ${k} = ${N / k} ${skl(N / k, 'rostlina', 'rostliny', 'rostlin')} na úsek.`,
            `Bílých je ${k} · 2 = ${2 * k}, červených ${N} − ${2 * k} = ${cervenych}.`] }
      ]
    };
  }

  function gen9() {
    // 4 body — Pythagorova věta, slovní úloha (náhrada za konstrukční úlohu)
    // reálné rozměry žebříku (přepona 5–17 m) — bez umělého násobení, ať zadání sedí na skutečnost
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
    const t = triples[ri(0, triples.length - 1)];
    const a9 = t[0], b9 = t[1], c9 = t[2];
    return {
      no: 9, points: 4, title: 'Žebřík u zdi',
      svg: svgTriangle('pravo', { v: ['C', 'A', 'B'] }),
      intro: `Žebřík opřený o svislou zeď dosahuje do výšky ${b9} m. Pata žebříku je od zdi vzdálena ${a9} m.`,
      parts: [
        { key: '9.1', points: 4, showExplain: true,
          prompt: `Vypočítejte délku žebříku (v m). Uveďte celý postup.`,
          ans: String(c9),
          sol: [`Žebřík, zeď a zem tvoří pravoúhlý trojúhelník s pravým úhlem u paty zdi. Žebřík leží proti pravému úhlu, je to tedy přepona — a tu dává Pythagorova věta: c² = a² + b².`,
            `Odvěsny jsou výška ${b9} m a vzdálenost paty ${a9} m: c² = ${a9 * a9} + ${b9 * b9} = ${a9 * a9 + b9 * b9}.`,
            `c = √${a9 * a9 + b9 * b9} = ${c9} m.`] }
      ]
    };
  }

  function gen10() {
    // 2 body — podobnost trojúhelníků, měřítko (náhrada za konstrukční úlohu)
    const orig = ri(4, 12);
    const k10 = [2, 3, 4][ri(0, 2)];
    return {
      no: 10, points: 2, title: 'Podobné trojúhelníky',
      svg: svgSimilar(k10),
      parts: [
        { key: '10', points: 2,
          prompt: `Dva podobné trojúhelníky mají koeficient podobnosti k = ${k10}. Strana menšího trojúhelníku měří ${orig} cm. Jak dlouhá je odpovídající strana většího trojúhelníku (v cm)?`,
          ans: String(orig * k10),
          sol: [`Podobné trojúhelníky mají stejný tvar, jen jinou velikost. Každá strana většího je k-krát delší než odpovídající strana menšího.`,`Koeficient k = ${k10} je větší než 1, takže se NÁSOBÍ — strana musí vyjít delší než ${orig} cm.`,`Strana většího trojúhelníku = ${orig} · ${k10} = ${orig * k10} cm.`] }
      ]
    };
  }

  function gen11() {
    // 3 body — kvádr, jehož jedna hrana se prodlouží o 1 cm (součet hran, povrch, objem)
    /* Nepravdivá tvrzení jsou výsledky TYPICKÝCH chyb: součet jen šesti hran
       (jako obvod), povrch bez zdvojení protilehlých stěn, celý objem místo
       přírůstku. Náhodný šum „správně + 5" pozná žák i bez počítání. */
    const a = ri(2, 4), b = ri(3, 6), c = ri(2, 5), a2 = a + 1;
    const H = 4 * (a + b + c), p1 = ri(0, 1) === 1, hTvr = p1 ? H : 2 * (a + b + c);
    const S1 = 2 * (a * b + b * c + a * c), S2 = 2 * (a2 * b + b * c + a2 * c), p2 = ri(0, 1) === 1, sTvr = p2 ? S2 - S1 : b + c;
    const V1 = a * b * c, V2 = a2 * b * c, p3 = ri(0, 1) === 1, vTvr = p3 ? V2 - V1 : V2;
    return {
      no: 11, points: 3, title: 'Kvádry', kind: 'tfgrid', okruh: 'telesa',
      intro: `Kvádr má hrany délek ${a} cm, ${b} cm a ${c} cm. Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [
        tvrzeni(`Součet délek všech hran kvádru je ${hTvr} cm.`, p1,
          [`Kvádr má 12 hran a každý ze tří rozměrů se mezi nimi opakuje čtyřikrát — čtyři hrany dole, čtyři nahoře a čtyři svislé.`,
            `Součet hran: 4 · (${a} + ${b} + ${c}) = ${H} cm.`,
            `Tvrzení uvádí ${hTvr} cm${p1 ? '' : ` — to je jen polovina hran, 2 · (${a} + ${b} + ${c})`}. ${verdikt(p1)}`]),
        tvrzeni(`Když se hrana délky ${a} cm prodlouží na ${a2} cm, povrch kvádru se zvětší o ${sTvr} cm².`, p2,
          [`Povrch je součet obsahů šesti stěn a protilehlé stěny jsou shodné, proto S = 2 · (a · b + b · c + a · c). Spočítej povrch před prodloužením i po něm.`,
            `Před: 2 · (${a * b} + ${b * c} + ${a * c}) = ${S1} cm². Po: 2 · (${a2 * b} + ${b * c} + ${a2 * c}) = ${S2} cm².`,
            `Povrch se zvětší o ${S2} − ${S1} = ${S2 - S1} cm². ${verdikt(p2)}`]),
        tvrzeni(`Když se hrana délky ${a} cm prodlouží na ${a2} cm, objem kvádru se zvětší o ${vTvr} cm³.`, p3,
          [`Objem kvádru je součin jeho tří hran. Tvrzení se ptá, o kolik objem PŘIBUDE, ne jaký bude — potřebuješ tedy oba objemy a jejich rozdíl.`,
            `Před: ${a} · ${b} · ${c} = ${V1} cm³. Po: ${a2} · ${b} · ${c} = ${V2} cm³.`,
            `Objem se zvětší o ${V2} − ${V1} = ${V2 - V1} cm³. ${verdikt(p3)}`])
      ]
    };
  }

  function gen12() {
    // 2 body — bazén se šikmým dnem (věrné M9A/2025, úloha 12; klíč A = 500 m³)
    /* Objem = kvádr (neplavci) + hranol s lichoběžníkovou podstavou (plavci).
       Zóny se losují zvlášť, takže „průměrná hloubka celého bazénu" dává jiné
       číslo než správný postup. Šířka je sudá, aby vyšel celý objem i při
       průměrné hloubce 1,5 m. Při šířce 15 a délce 30 dřív vycházelo 562,5,
       ale mezi volbami bylo jen 563 — kdo počítal správně, neměl co zvolit. */
    const n = pick([15, 20, 25]), p = pick([15, 20, 25]), d = n + p, s = pick([8, 10, 12]), h1 = 1, h2 = pick([2, 3]);
    const Vn = n * s * h1, Vp = p * s * (h1 + h2) / 2, V = Vn + Vp;
    const sh = volbyMC(V, [d * s * (h1 + h2) / 2, Vn + p * s * h2, d * s * h1, d * s * h2], 50, 'jiný objem', v => `${tis(v)} m³`);
    return {
      no: 12, points: 2, title: 'Bazén', kind: 'mc', okruh: 'telesa',
      svg: svgBazen(n, d, h1, h2),
      intro: `Bazén má délku ${d} metrů a šířku ${s} metrů. Hloubka bazénu není všude stejná (viz obrázek). V celé zóně pro neplavce, která je dlouhá ${n} m, je hloubka ${h1} m. Zóna pro plavce má šikmé dno a hloubka bazénu se v ní postupně zvětší z ${h1} m na ${h2} m.`,
      prompt: `Jaký je objem bazénu?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Bazén rozděl na dvě části. Neplavecká zóna je kvádr. Plavecká je hranol, jehož podstavou je lichoběžník z bokorysu — jeho objem dá délka zóny · šířka · PRŮMĚRNÁ hloubka zóny.`,
        `Neplavci: ${n} · ${s} · ${h1} = ${Vn} m³. Plavci: délka ${d} − ${n} = ${p} m, průměrná hloubka (${h1} + ${h2}) : 2 = ${cz((h1 + h2) / 2)} m, objem ${p} · ${s} · ${cz((h1 + h2) / 2)} = ${Vp} m³.`,
        `Celý bazén: ${Vn} + ${Vp} = ${V} m³${odpovedMC(sh)}`]
    };
  }

  function gen13() {
    // 2 body — tábory, přihlášky nad počet míst (věrné M9A/2025, úloha 13; klíč B = 75)
    /* Obě navýšení se počítají z počtu MÍST, který zadání neuvádí — zná se jen
       součet přihlášek. m je násobek 20, aby přihlášky vyšly celé. */
    const [slovo, p1] = pick([['o pětinu', 20], ['o čtvrtinu', 25], ['o desetinu', 10]]), p2 = pick([15, 30, 35, 40].filter(x => x !== p1));
    const m = 20 * ri(3, 10), N = m * (200 + p1 + p2) / 100, odm = m * (p1 + p2) / 100;
    // chyby: procenta z přihlášek (jako by se dělily napůl), jen druhý termín, jen první termín
    const sh = volbyMC(odm, [N * (p1 + p2) / 200, m * p2 / 100, m * p1 / 100].filter(Number.isInteger), 5, 'jiný počet přihlášek', x => `${x} přihlášek`);
    return {
      no: 13, points: 2, title: 'Letní tábory', kind: 'mc', okruh: 'procenta',
      intro: `U ${pick(['Pelhřimova', 'Tábora', 'Jindřichova Hradce'])} se letos pořádaly dětské tábory ve dvou termínech. Počet nabízených míst byl v obou termínech stejný. Sešlo se celkem ${N} přihlášek. V prvním termínu počet přihlášek překročil počet nabízených míst ${slovo}, ve druhém termínu o ${p2} %.`,
      prompt: `Kolik přihlášek celkem muselo být kvůli nedostatku míst odmítnuto?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Obě navýšení se počítají z počtu MÍST m, ne z přihlášek. V prvním termínu přišlo ${cz((100 + p1) / 100)} · m přihlášek, ve druhém ${cz((100 + p2) / 100)} · m, dohromady ${cz((200 + p1 + p2) / 100)} · m.`,
        `${cz((200 + p1 + p2) / 100)} · m = ${N}, takže m = ${N} : ${cz((200 + p1 + p2) / 100)} = ${m} míst v každém termínu.`,
        `Odmítnuto: ${N} − 2 · ${m} = ${odm} přihlášek${odpovedMC(sh)}`]
    };
  }

  function gen14() {
    // 2 body — počet jedniček z průměru (věrné M9A/2025, úloha 14; klíč D = 8)
    /* Známky jsou 1, 2 a 3 a jedniček je stejně jako dvojek. Průměr má mít
       jedno desetinné místo, proto se kombinace losuje znovu. Distraktor
       2n − součet je model „jen jedničky a dvojky" — přesně ten, který dřív
       používala sama banka. */
    let n, j, t;
    do { n = pick([20, 24, 25, 30]); j = ri(3, 10); t = n - 2 * j; } while (t < 2 || (30 * (j + t)) % n !== 0 || j === t);
    const pr = 3 * (j + t) / n, soucet = 3 * (j + t);
    const zaku = v => `${v} ${skl(v, 'žák', 'žáci', 'žáků')}`;
    const sh = volbyMC(j, [t, j + t, 2 * n - soucet], 1, 'jiný počet žáků', zaku);
    return {
      no: 14, points: 2, title: 'Testové známky', kind: 'mc', okruh: 'data',
      intro: `Test z matematiky psalo ${n} žáků. Nejhorší známka byla 3. Počet jedniček a dvojek byl stejný. Aritmetický průměr známek všech žáků byl ${cz(pr)}.`,
      prompt: `Kolik žáků dostalo z testu známku 1?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Průměr krát počet žáků dá součet všech známek. Známky jsou jen 1, 2 a 3; jedniček a dvojek je stejně (j) a zbylých ${n} − 2j žáků má trojku.`,
        `Součet známek: ${cz(pr)} · ${n} = ${soucet}. Zároveň 1 · j + 2 · j + 3 · (${n} − 2j) = ${3 * n} − 3j.`,
        `${3 * n} − 3j = ${soucet}, tedy j = (${3 * n} − ${soucet}) : 3 = ${j}${odpovedMC(sh)}`]
    };
  }

  function gen15() {
    // 6 bodů — přiřazování, 3 procentové úlohy → 6 možností
    // pct volíme první ⇒ část i procenta vyjdou PŘESNĚ celočíselně (žádné zaokrouhlování).
    // Celek dřív býval jen 100 nebo 200, takže „35 ze 100 = 35 %" nic nezkoušelo;
    // teď je to vždy násobek 20, a část tedy vyjde celá pro každé pct dělitelné pěti.
    // Rozsah procent je podle toho, o co jde: 85 % vadných výrobků by nikdo nenapsal.
    function pctTask(used, celky, od, po) {
      let pct, celek;
      do {
        pct = ri(od, po) * 5;
        celek = pick(celky);
      } while (used.includes(pct));
      used.push(pct);
      return { celek, cast: pct * celek / 100, pct };
    }
    const used = [];
    const t1 = pctTask(used, [40, 60, 80, 120, 160], 2, 12),    // home office 10–60 %
      t2 = pctTask(used, [200, 400, 500, 800], 1, 5),           // vadné 5–25 %
      t3 = pctTask(used, [300, 400, 500, 600], 3, 15);          // autobus 15–75 %
    const answers = [t1.pct, t2.pct, t3.pct];
    // 6 možností: 3 správné + 3 distraktory (násobky 5), seřazeno
    const set = new Set(answers);
    while (set.size < 6) { set.add(ri(2, 18) * 5); }
    const optsArr = [...set].sort((a, b) => a - b);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const labels = optsArr.map((v, i) => `${letters[i]}) ${v} %`);
    const ansLetters = answers.map(v => letters[optsArr.indexOf(v)]);
    return {
      no: 15, points: 6, title: 'Procenta',
      kind: 'match',
      prompts: [
        `Ve firmě pracuje ${t1.celek} lidí, z toho ${t1.cast} na home office. Kolik procent zaměstnanců pracuje z domova?`,
        `Z kontrolované várky ${t2.celek} výrobků bylo ${t2.cast} vadných. Kolik procent výrobků bylo vadných?`,
        `Škola má ${t3.celek} žáků, ${t3.cast} z nich jezdí do školy autobusem. Kolik procent žáků jezdí autobusem?`
      ],
      options: labels,
      ans: ansLetters,
      /* Každý postup je SAMOSTATNÝ: procvičování vytahuje z přiřazovací
         úlohy jen jednu otázku, takže „stejně jako výše" by tam nedávalo
         smysl. */
      sol: [t1, t2, t3].map(t => [
        `„Kolik procent" se ptá na podíl části z celku: část vyděl celkem a výsledek vyjádři v setinách, tedy v procentech.`,
        `Podíl: ${t.cast} : ${t.celek} = ${pr(t.pct)}.`,
        `${pr(t.pct)} = ${t.pct}/100 = ${t.pct} %.`
      ])
    };
  }

  function gen16() {
    // 4 body — čtvercový obrázek v rámu (strana + obsah rámu), plně odvoditelné bez obrázku
    const RAM = 2; // šířka rámu v cm (na každé straně stejně)
    const w1 = ri(3, 8), w3 = w1 + ri(4, 7);
    const side = w => w + 2 * RAM;
    const frameArea = w => side(w) * side(w) - w * w;
    return {
      no: 16, points: 4, title: 'Rámeček',
      intro: `Čtvercový bílý obrázek je po celém obvodu lemovaný rámem širokým ${RAM} cm (na každé straně stejně).`,
      parts: [
        { key: '16.1', points: 2, prompt: `Bílý čtverec má stranu ${w1} cm. Jaká je délka strany CELÉHO obrázku i s rámem (v cm)?`, ans: String(side(w1)),
          sol: [`Rám obepíná obrázek dokola, takže na KAŽDÉ straně přidá ${RAM} cm — na jedné straně i na protější.`,`Ke straně se proto přičítá dvakrát ${RAM} cm, tedy ${2 * RAM} cm.`,`Strana obrázku = ${w1} + ${2 * RAM} = ${side(w1)} cm.`] },
        { key: '16.2', points: 1, prompt: `Jaký obsah má samotný rám u obrázku s bílým čtvercem o straně ${w1} cm (v cm²)?`, ans: String(frameArea(w1)),
          /* „Rám je mezikruží" stálo tu dřív — mezikruží je ale plocha mezi dvěma
             KRUŽNICEMI; čtvercový rám je to, co zbyde ze čtverce po vyjmutí menšího. */
          sol: [`Rám je plocha, která zbyde, když z celého obrázku (velký čtverec) vyjmeš bílý čtverec uprostřed — jeho obsah je tedy rozdíl dvou obsahů.`,`Obsah celého obrázku: ${side(w1)} · ${side(w1)} = ${side(w1) * side(w1)} cm².`,`Obsah bílého čtverce: ${w1} · ${w1} = ${w1 * w1} cm².`,`Obsah rámu = ${side(w1) * side(w1)} − ${w1 * w1} = ${frameArea(w1)} cm².`] },
        { key: '16.3', points: 1, prompt: `Jaká je délka strany celého obrázku, má-li bílý čtverec stranu ${w3} cm (v cm)?`, ans: String(side(w3)),
          sol: [`Rám obepíná obrázek dokola, takže na KAŽDÉ straně přidá ${RAM} cm — stranu celého obrázku prodlouží na obou koncích.`,`Přičítá se tedy 2 · ${RAM} = ${2 * RAM} cm.`,`Strana obrázku = ${w3} + ${2 * RAM} = ${side(w3)} cm.`] }
      ]
    };
  }

  /* ═══ DRUHÉ VARIANTY POZIC (stejný tvar a stejný součet bodů) ═══
     Přidáním funkce do SLOTS[N-1] se zvýší variabilita té pozice — při
     každém spuštění testu se náhodně vybere jedna. */

  function gen1b() {
    // 1 bod — o kolik je součin větší než součet
    const a = ri(4, 9), b = ri(4, 9);
    const ans = a * b - (a + b);
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'vyrazy-mocniny',
      parts: [{ key: '', points: 1,
        prompt: `Vypočítejte, o kolik je součin čísel ${a} a ${b} větší než jejich součet.`,
        ans: String(ans),
        sol: [
          `„O kolik větší" znamená ROZDÍL. Spočítej proto obě čísla zvlášť a teprve pak je odečti.`,
          `Součin: ${a} · ${b} = ${a * b}. Součet: ${a} + ${b} = ${a + b}.`,
          `Rozdíl = ${a * b} − ${a + b} = ${ans}.`
        ] }]
    };
  }

  function gen7b() {
    // 3 body — úhly v trojúhelníku (součet 180°) + vnější úhel
    const al = ri(30, 70), be = ri(30, Math.min(90, 155 - al));
    const ga = 180 - al - be;
    const vnejsiC = al + be; // vnější úhel u C = 180 - γ = α + β
    const maxIn = Math.max(al, be, ga);
    return {
      no: 7, points: 3, title: 'Úhly v trojúhelníku', okruh: 'geometrie',
      svg: svgTriangle('obecny', { v: ['A', 'B', 'C'] }),
      intro: `V trojúhelníku ABC platí α = ${al}° (u vrcholu A) a β = ${be}° (u vrcholu B).`,
      parts: [
        { key: '7.1', points: 1, prompt: `Vypočítejte velikost vnitřního úhlu γ (u vrcholu C).`, ans: String(ga),
          sol: [`Součet vnitřních úhlů je v každém trojúhelníku 180°, takže třetí úhel dopočítáš ze dvou známých.`,`Třetí úhel dopočítáš odečtením obou známých: γ = 180 − ${al} − ${be}.`,`γ = ${180 - al} − ${be} = ${ga}°.`] },
        { key: '7.2', points: 1, prompt: `Vypočítejte velikost vnějšího úhlu u vrcholu C.`, ans: String(vnejsiC),
          sol: [`Vnější úhel a vnitřní úhel u téhož vrcholu tvoří dohromady 180°.`,`Z toho plyne užitečné pravidlo: vnější úhel se rovná součtu obou zbývajících vnitřních úhlů.`,`Vnější úhel = ${al} + ${be} = ${vnejsiC}° (kontrola: 180 − ${ga} = ${vnejsiC}°).`] },
        { key: '7.3', points: 1, prompt: `Který vnitřní úhel trojúhelníku je největší? Napište jeho velikost ve stupních.`, ans: String(maxIn),
          sol: [`Nejdřív musíš znát všechny tři úhly — γ jsi dopočítal v předchozí podúloze.`,`Úhly jsou α = ${al}°, β = ${be}°, γ = ${ga}°.`,`Největší z nich je ${maxIn}°.`] }
      ]
    };
  }

  function gen13b() {
    // 2 body — zdražení a potom sleva z nové ceny
    /* Konečná cena se dřív ZAOKROUHLOVALA (500 Kč, +25 %, −10 % = 562,50 Kč,
       nabízelo se 563). Losuje se znovu, dokud cena nevyjde celá. */
    let cena, p1, p2, po1, fin;
    do {
      cena = ri(4, 9) * 100; p1 = pick([10, 20, 25]); p2 = pick([10, 20]);
      po1 = cena * (100 + p1) / 100; fin = po1 * (100 - p2) / 100;
    } while (!Number.isInteger(po1) || !Number.isInteger(fin) || p1 === p2);
    // chyby: procenta jen sečtená, jen zdražení, původní cena
    const sh = volbyMC(fin, [cena * (100 + p1 - p2) / 100, po1, cena].filter(Number.isInteger), 10, 'jiná cena', x => `${tis(x)} Kč`);
    return {
      no: 13, points: 2, title: 'Cena zboží', kind: 'mc', okruh: 'procenta',
      intro: `Zboží stálo ${cena} Kč. Nejdřív zdražilo o ${p1} %, potom z nové ceny zlevnilo o ${p2} %.`,
      prompt: `Kolik stojí zboží nyní?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Každá změna ceny se počítá z AKTUÁLNÍ ceny: sleva ${p2} % se bere z ceny po zdražení, ne z původní. Procenta se proto nesmějí jen sečíst.`,
        `Po zdražení o ${p1} %: ${cena} · ${cz((100 + p1) / 100)} = ${po1} Kč.`,
        `Po slevě o ${p2} %: ${po1} · ${cz((100 - p2) / 100)} = ${fin} Kč${odpovedMC(sh)}`]
    };
  }

  function gen2b() {
    // 3 body — 2.1 DESETINNÉ číslo uvnitř zlomkového výrazu (2024 1. náhr. ú. 3.1,
    // 2026 1. náhr. ú. 2.2), 2.2 složený zlomek s druhou mocninou (2025 2. náhr. ú. 3.2).
    let q, m, t, a;
    do {
      q = pick([2, 4, 5]); m = ri(q + 1, 3 * q - 1); t = ri(2, 4); a = ri(1, 9);
    } while (gcd(m, q) !== 1 || gcd(a, m * t) !== 1 || gcd(a, t * q) !== 1);
    const R1 = zRed(-a, t * q);
    const s2 = slozenyZlomek(true);
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `${ZL} ${a}/${m * t} · (−${cz(m / q)}) =`,
          ans: zAns(R1),
          sol: [
            `Desetinné číslo převeď na zlomek, ať se dá krátit. Pak násob čitatel čitatelem a jmenovatel jmenovatelem — a krať ještě před násobením, čísla zůstanou malá.`,
            `${cz(m / q)} = ${m}/${q}`,
            `${a}/${m * t} · (−${m}/${q}) = −${a}/${t} · 1/${q} = ${zTxt(R1)}`
          ] },
        { key: '2.2', points: 2, showExplain: true, ...s2 }
      ]
    };
  }

  /* ── Pozice 3 podle ostrých testů 2024–26 ─────────────────────────
     Dlouhá úprava za 2 body s postupem („(3 − x)·(3 + x) + (x² + 2)·3 − 2x·(x + 1)",
     M9 2026 1. náhr. ú. 3.3), umocnění „s háčkem", kde je zlomek v závorce nebo
     před ní („4·(n − 1/2)²", „1/2·(2a + 4)²", M9 2026 ú. 3.2), a dosazení do
     rozepsaného čtverce („pro a = 7: 9a² − 6a + 1", M9 2026 1. ř. ú. 3.1).
     Mnohočlen je [c0, c1, c2] = c0 + c1·v + c2·v². */
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const polyTxt = (P, v) => mnoho([[P[2], v + '²'], [P[1], v], [P[0], '']]);
  const polySoucet = (...Ps) => [0, 1, 2].map(i => Ps.reduce((s, P) => s + P[i], 0));
  const polyRozepsane = (Ps, v) => {
    let s = '';
    Ps.forEach(P => [[P[2], v + '²'], [P[1], v], [P[0], '']].forEach(([c, x]) => { if (c) s += clen(c, x, s === ''); }));
    return s || '0';
  };
  const zkTxt = ([n, d]) => (d === 1 ? String(Math.abs(n)) : Math.abs(n) + '/' + d);
  function clenZ(z, x, prvni) {                        // člen se zlomkovým koeficientem: „ − 2/3 n", „ + n²", „ + 1/4"
    if (z[0] === 0) return '';
    const telo = !x ? zkTxt(z) : Math.abs(z[0]) === z[1] ? x : zkTxt(z) + (z[1] > 1 ? ' ' : '') + x;
    return prvni ? (z[0] < 0 ? '−' : '') + telo : (z[0] < 0 ? ' − ' : ' + ') + telo;
  }
  // „napište koeficient u x" / „u x²" / „absolutní člen" — ptá se jen na nenulový člen
  function dotaz(P, v, nabidka) {
    const moznosti = nabidka.filter(k => P[k] !== 0);
    const k = pick(moznosti.length ? moznosti : [1]);
    return {
      text: k === 0 ? `absolutní člen (číslo bez ${v})` : `koeficient u ${v}${k === 2 ? '²' : ''}`,
      zaver: k === 0 ? `Číslo bez ${v} (absolutní člen) je ${zn(P[0])}.` : `Koeficient u ${v}${k === 2 ? '²' : ''} je ${zn(P[k])}.`,
      ans: String(P[k])
    };
  }
  function dlouhyVyraz(v) {
    for (;;) {
      const A = ri(2, 6), C = ri(1, 5), D = ri(2, 4), E = ri(1, 3), F = ri(1, 4), K = ri(2, 4), L = ri(1, 5);
      const G = ri(2, 4), H = ri(2, 3), P1 = ri(1, 4), Q1 = ri(2, 6), M = ri(2, 3), N = ri(1, 4);
      const prvni = pick([
        { t: `(${A} − ${v})·(${A} + ${v})`, P: [A * A, 0, -1] },
        { t: `(${v} + ${P1})·(${Q1} − ${v})`, P: [P1 * Q1, Q1 - P1, -1] },
        { t: `(${M}${v} − ${N})²`, P: [N * N, -2 * M * N, M * M] }
      ]);
      const dalsi = shuffle([
        { t: `(${v}² + ${C})·${D}`, z: 1, P: [C * D, 0, D] },
        { t: `${clen(E, v, true)}·(${v} + ${F})`, z: -1, P: [0, -E * F, -E] },
        { t: `${K}·(${v} + ${L})`, z: -1, P: [-K * L, -K, 0] },
        { t: `(${G}${v} − ${v})·${H}${v}`, z: 1, P: [0, 0, (G - 1) * H] }
      ]).slice(0, 2);
      const R = polySoucet(prvni.P, dalsi[0].P, dalsi[1].P);
      if (R[1] === 0 || R.some(c => Math.abs(c) > 60)) continue;
      const d = dotaz(R, v, [1, 1, 0, 2]);
      const zapis = x => (x.z > 0 ? ' + ' : ' − ') + x.t;
      const rozn = x => `${x.z > 0 ? '' : '−'}${x.t} = ${polyTxt(x.P, v)}`;
      return {
        prompt: `Upravte na co nejjednodušší tvar bez závorek a napište ${d.text}: ${prvni.t}${zapis(dalsi[0])}${zapis(dalsi[1])}`,
        ans: d.ans,
        sol: [
          `Nejdřív roznásob každý součin zvlášť a teprve pak sečti členy se stejnou mocninou ${v}. Minus před součinem mění znaménko VŠEM členům, které z něj vzniknou.`,
          `Roznásobíme: ${prvni.t} = ${polyTxt(prvni.P, v)}; ${rozn(dalsi[0])}; ${rozn(dalsi[1])}.`,
          `Sečteme: ${polyRozepsane([prvni.P, dalsi[0].P, dalsi[1].P], v)} = ${polyTxt(R, v)}.`,
          d.zaver
        ]
      };
    }
  }
  function hacek(v) {
    const druh = ri(1, 3);
    if (druh === 1) {                                  // K·(v − 1/d)², K = m·d²
      const d = pick([2, 3]), m = pick([1, 2]), K = m * d * d, P = [m, -2 * m * d, K], q = dotaz(P, v, [1, 1, 0, 2]);
      return {
        prompt: `Roznásobte a upravte (výsledek bez závorek) a napište ${q.text}: ${K} · (${v} − 1/${d})²`,
        ans: q.ans,
        sol: [
          `Nejdřív umocni závorku podle vzorce (a − b)² = a² − 2ab + b², i když je v ní zlomek, a teprve pak násob číslem ${K} — násobí se KAŽDÝ ze tří členů.`,
          `(${v} − 1/${d})² = ${v}² − 2 · ${v} · 1/${d} + (1/${d})² = ${v}²${clenZ(zRed(-2, d), v, false)}${clenZ(zRed(1, d * d), '', false)}.`,
          `${K} · (${v}²${clenZ(zRed(-2, d), v, false)}${clenZ(zRed(1, d * d), '', false)}) = ${polyTxt(P, v)}.`,
          q.zaver
        ]
      };
    }
    if (druh === 2) {                                  // 1/d·(d·v + c)², c násobek d
      const d = pick([2, 3]), c = d * ri(1, 3), P = [c * c / d, 2 * c, d], q = dotaz(P, v, [1, 1, 0, 2]);
      return {
        prompt: `Roznásobte a upravte (výsledek bez závorek) a napište ${q.text}: 1/${d} · (${d}${v} + ${c})²`,
        ans: q.ans,
        sol: [
          `Nejdřív umocni závorku podle vzorce (a + b)² = a² + 2ab + b², teprve pak násob zlomkem 1/${d} — to znamená vydělit číslem ${d} každý člen.`,
          `(${d}${v} + ${c})² = ${polyTxt([c * c, 2 * d * c, d * d], v)}.`,
          `1/${d} · (${polyTxt([c * c, 2 * d * c, d * d], v)}) = ${polyTxt(P, v)}.`,
          q.zaver
        ]
      };
    }
    let p, qq;                                         // (p/q·v − r)²: háček je (p/q)² = p²/q²
    do { p = ri(1, 3); qq = ri(2, 5); } while (gcd(p, qq) !== 1);
    const r = ri(1, 4), c2 = zRed(p * p, qq * qq), c1 = zRed(-2 * p * r, qq), naV2 = Math.random() < 0.7;
    const cil = naV2 ? c2 : c1;
    return {
      prompt: `Umocněte (zlomek zapište v základním tvaru) a napište koeficient u ${v}${naV2 ? '²' : ''}: (${p}/${qq} ${v} − ${r})²`,
      ans: zAns(cil),
      sol: [
        `Umocňuje se CELÝ první člen i se zlomkem: na druhou jde čitatel i jmenovatel. Prostřední člen je dvojnásobek součinu obou členů v závorce.`,
        `(${p}/${qq} ${v})² = ${zkTxt(c2)} ${v}², 2 · ${p}/${qq} ${v} · ${r} = ${clenZ(zRed(2 * p * r, qq), v, true)} a ${r}² = ${r * r}.`,
        `(${p}/${qq} ${v} − ${r})² = ${clenZ(c2, v + '²', true)}${clenZ(c1, v, false)} + ${r * r}.`,
        `Koeficient u ${v}${naV2 ? '²' : ''} je ${zTxt(cil)}.`
      ]
    };
  }
  function dosazeni(v) {                               // hodnota rozepsaného čtverce (p·v − q)²
    let p, q, x;
    do { p = ri(2, 5); q = ri(1, 5); x = ri(2, 9); } while (gcd(p, q) !== 1 || p * x - q < 5);
    const P = [q * q, -2 * p * q, p * p], h = p * x - q;
    return {
      prompt: `Vypočítejte pro ${v} = ${x}: ${polyTxt(P, v)} =`,
      ans: String(h * h),
      sol: [
        `Dosazovat do každého členu zvlášť jde, ale je to zdlouhavé. Výraz je rozepsaný čtverec (A − B)² = A² − 2AB + B², takže stačí dosadit do závorky.`,
        `${p * p}${v}² = (${p}${v})², ${q * q} = ${q}² a prostřední člen sedí: 2 · ${p}${v} · ${q} = ${2 * p * q}${v}. Tedy ${polyTxt(P, v)} = (${p}${v} − ${q})².`,
        `Pro ${v} = ${x}: (${p} · ${x} − ${q})² = ${h}² = ${h * h}.`
      ]
    };
  }

  function gen3b() {
    // 4 body — dosazení do rozepsaného čtverce, rozdíl dvou čtverců, dlouhá úprava s postupem
    const p = ri(2, 6);
    return {
      no: 3, points: 4, title: 'Algebraické výrazy',
      parts: [
        { key: '3.1', points: 1, ...dosazeni(pick(['a', 'x', 'n'])) },
        { key: '3.2', points: 1, showExplain: true,
          prompt: `Upravte na co nejjednodušší tvar a napište koeficient u x: (x + ${p})² − (x − ${p})²`,
          ans: String(4 * p),
          sol: [
            `Umocni obě závorky zvlášť podle vzorců (a ± b)² = a² ± 2ab + b² a teprve pak je odečti — minus platí pro CELOU druhou závorku, tedy pro všechny tři její členy.`,
            `(x + ${p})² = x² + ${2 * p}x + ${p * p} a (x − ${p})² = x² − ${2 * p}x + ${p * p}.`,
            `Rozdíl: x² + ${2 * p}x + ${p * p} − x² + ${2 * p}x − ${p * p} — členy x² i čísla se vyruší.`,
            `Zbude ${2 * p}x + ${2 * p}x, koeficient u x je ${2 * p} + ${2 * p} = ${4 * p}.`
          ] },
        { key: '3.3', points: 2, showExplain: true, ...dlouhyVyraz(pick(['x', 'n', 'y'])) }
      ]
    };
  }

  function gen5b() {
    // 4 body — obdélníková zahrada: rozměr záhonu + volná plocha
    const L = ri(3, 6) * 10, W = ri(2, 4) * 10, celk = L * W;
    const zahon = celk / 4, zL = L / 2, zW = zahon / zL;   // zW = W/2, celé
    const pCesta = ri(2, 6) * 5, cesta = celk * pCesta / 100;
    const volna = celk - zahon - cesta;
    return {
      no: 5, points: 4, title: 'Zahrada', okruh: 'geometrie',
      intro: `Obdélníková zahrada má rozměry ${L} m × ${W} m. Je na ní obdélníkový záhon, jehož obsah je rovný čtvrtině rozlohy zahrady, a cesta.`,
      parts: [
        { key: '5.1', points: 2,
          prompt: `Délka záhonu je ${zL} m. Určete šířku záhonu (v m).`,
          ans: String(zW),
          sol: [`Šířku obdélníku dostaneš z obsahu a délky: obsah = délka · šířka, takže šířka = obsah : délka. Obsah záhonu je čtvrtina rozlohy zahrady.`,
            `Zahrada: ${L} · ${W} = ${celk} m². Záhon: ${celk} : 4 = ${zahon} m².`,
            `Šířka = ${zahon} : ${zL} = ${zW} m.`] },
        { key: '5.2', points: 2,
          prompt: `Cesta zabírá ${pCesta} % rozlohy zahrady. Vypočítejte v m² volnou část zahrady, kde není záhon ani cesta.`,
          ans: String(volna),
          sol: [`Volná část = celá zahrada − záhon − cesta. Obě odečítané plochy nejdřív vyjádři v m²: záhon je čtvrtina zahrady, cesta dané procento.`,
            `Zahrada: ${L} · ${W} = ${celk} m². Záhon: ${celk} : 4 = ${zahon} m². Cesta: ${celk} · ${pCesta} : 100 = ${cesta} m².`,
            `Volná část = ${celk} − ${zahon} − ${cesta} = ${volna} m².`] }
      ]
    };
  }

  function gen6b() {
    // 2 body — akvárium (kvádr), objem v litrech + částečné naplnění (bez π)
    const a = ri(2, 5) * 10, b = ri(2, 4) * 10, c = ri(2, 5) * 10;
    const objemCm = a * b * c, litryCelk = objemCm / 1000, baseA = a * b;
    const hCm = ri(1, c / 10 - 1) * 10, litryVoda = baseA * hCm / 1000;
    return {
      no: 6, points: 2, title: 'Akvárium', okruh: 'telesa',
      svg: svgCuboid(a + ' cm', b + ' cm', c + ' cm'),
      intro: `Akvárium má tvar kvádru s rozměry dna ${a} cm × ${b} cm a výškou ${c} cm.`,
      parts: [
        { key: '6.1', points: 1,
          prompt: `Kolik litrů vody se do akvária vejde, když ho naplníme až po okraj? (1 l = 1000 cm³)`,
          ans: String(litryCelk),
          sol: [`Objem kvádru je součin jeho tří rozměrů (délka · šířka · výška). Na litry ho převedeš podle 1 l = 1000 cm³.`,
            `Objem: ${a} · ${b} · ${c} = ${objemCm} cm³.`,
            `V litrech: ${objemCm} : 1000 = ${cz(litryCelk)} l.`] },
        { key: '6.2', points: 1,
          prompt: `Voda v akváriu sahá do výšky ${hCm} cm. Kolik litrů vody v něm je?`,
          ans: String(litryVoda),
          sol: [`Voda tvoří kvádr o stejném dnu jako nádrž, jen s menší výškou — počítá se tedy obsah dna krát výška VODY, ne nádrže.`,
            `Obsah dna: ${a} · ${b} = ${baseA} cm².`,
            `Objem vody = ${baseA} · ${hCm} = ${baseA * hCm} cm³.`,
            `Převeď na litry: ${baseA * hCm} : 1000 = ${cz(litryVoda)} l.`] }
      ]
    };
  }

  function gen8b() {
    // 4 body — obdélníkový pozemek: obvod + sloupky v rozestupech
    /* 🔴 Zadání nazývá b DELŠÍ stranou, ale b se losovalo nezávisle na a:
       v 6 ze 16 kombinací byla „delší" strana kratší nebo stejná a odpověď
       vyšla −20 nebo 0 (čtverec místo obdélníku). */
    let a, b;
    do { a = ri(2, 5) * 4; b = ri(3, 6) * 4; } while (b <= a);
    const obvod = 2 * (a + b), dCm = 40;
    const pocet = obvod * 100 / dCm, naA = a * 100 / dCm, naB = b * 100 / dCm;
    const rozdil = naB - naA;
    const cand = [2, 3, 4, 5].filter(x => pocet % x === 0);
    const skup = cand[ri(0, cand.length - 1)];
    return {
      no: 8, points: 4, title: 'Plot kolem pozemku', okruh: 'geometrie',
      intro: `Obdélníkový pozemek má rozměry ${a} m × ${b} m. Po celém obvodu jsou ve stejných rozestupech ${dCm} cm sloupky plotu. Celkem je jich ${pocet}.`,
      parts: [
        { key: '8.1', points: 2, prompt: `Vypočítejte v metrech obvod pozemku.`, ans: String(obvod),
          sol: [`Obvod obdélníku je součet všech čtyř stran; protější jsou stejné, takže se sečtou dvě sousední a zdvojnásobí.`,`Součet sousedních stran: ${a} + ${b} = ${a + b} m.`,`Obvod = 2 · ${a + b} = ${obvod} m.`] },
        { key: '8.2', points: 1, prompt: `O kolik víc sloupků připadá na delší stranu (${b} m) než na kratší stranu (${a} m)?`, ans: String(rozdil),
          sol: [`Sloupek v rohu stojí na dvou stranách zároveň. Když ho připíšeme vždy jen k jedné z nich, připadá na každou stranu tolik sloupků, kolik je na ní mezer.`,
            `Delší strana: ${b * 100} : ${dCm} = ${naB} mezer, kratší: ${a * 100} : ${dCm} = ${naA} mezer.`,
            `Rozdíl: ${naB} − ${naA} = ${rozdil}.`] },
        { key: '8.3', points: 1, prompt: `Sloupky se natírají po skupinkách po ${skup}. Kolik skupinek je celkem (${pocet} sloupků)?`, ans: String(pocet / skup),
          sol: [`Skupinky mají po ${skup} sloupcích, takže celkový počet sloupků se touto velikostí dělí — kolikrát se skupinka „vejde" do všech sloupků.`,
            `Sloupků je celkem ${pocet}.`,
            `Počet skupinek = ${pocet} : ${skup} = ${pocet / skup}.`] }
      ]
    };
  }

  function gen9b() {
    // 4 body — Pythagoras: úhlopříčka obdélníkového hřiště
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]];
    const t = triples[ri(0, triples.length - 1)], a = t[0], b = t[1], c = t[2];
    return {
      no: 9, points: 4, title: 'Úhlopříčka hřiště',
      svg: svgTriangle('pravo', { v: ['C', 'A', 'B'] }),
      intro: `Obdélníkové hřiště má rozměry ${a} m a ${b} m.`,
      parts: [
        { key: '9.1', points: 4, showExplain: true,
          prompt: `Vypočítejte délku úhlopříčky hřiště (v m). Uveďte celý postup.`,
          ans: String(c),
          sol: [`Úhlopříčka rozdělí obdélník na dva pravoúhlé trojúhelníky: strany hřiště jsou jejich odvěsny a úhlopříčka přepona. Platí tedy Pythagorova věta u² = a² + b².`,
            `Odvěsny ${a} m a ${b} m: u² = ${a * a} + ${b * b} = ${a * a + b * b}.`,
            `u = √${a * a + b * b} = ${c} m.`] }
      ]
    };
  }

  function gen10b() {
    // 2 body — měřítko mapy
    const k = [1000, 2000, 5000, 10000][ri(0, 3)], dCm = ri(2, 9), realM = dCm * k / 100;
    return {
      no: 10, points: 2, title: 'Měřítko mapy',
      parts: [
        { key: '10', points: 2,
          prompt: `Na mapě s měřítkem 1 : ${k} je úsečka dlouhá ${dCm} cm. Jaká je skutečná vzdálenost v metrech?`,
          ans: String(realM),
          sol: [`Měřítko 1 : ${k} znamená, že 1 cm na mapě odpovídá ${k} cm ve skutečnosti — každá délka je ve skutečnosti ${k}krát větší.`,
            `Skutečná délka v centimetrech: ${dCm} · ${k} = ${dCm * k} cm.`,
            `Na metry (1 m = 100 cm): ${dCm * k} : 100 = ${cz(realM)} m.`] }
      ]
    };
  }

  function gen11b() {
    // 3 body — krychle: hrany, povrch a objem při dvojnásobné hraně
    const a = ri(2, 6), H = 12 * a, S = 6 * a * a, V = a ** 3, V2 = (2 * a) ** 3;
    const p1 = ri(0, 1) === 1, hTvr = p1 ? H : 8 * a;                                 // chyba: 8 jako počet vrcholů
    const p2 = ri(0, 1) === 1, sTvr = p2 ? S : 4 * a * a;                             // chyba: jen čtyři boční stěny
    const [slovo, kolik] = pick([['osmkrát', 8], ['osmkrát', 8], ['dvakrát', 2], ['čtyřikrát', 4]]), p3 = kolik === 8;
    return {
      no: 11, points: 3, title: 'Krychle', kind: 'tfgrid', okruh: 'telesa',
      intro: `Krychle má hranu délky ${a} cm. Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [
        tvrzeni(`Součet délek všech hran krychle je ${hTvr} cm.`, p1,
          [`Krychle má 12 hran (čtyři dole, čtyři nahoře, čtyři svislé) a všechny jsou stejně dlouhé. Pozor na záměnu s 8 vrcholy.`,
            `Součet hran: 12 · ${a} = ${H} cm.`,
            `Tvrzení uvádí ${hTvr} cm. ${verdikt(p1)}`]),
        tvrzeni(`Povrch krychle je ${sTvr} cm².`, p2,
          [`Povrch tvoří VŠECH šest shodných čtvercových stěn, i dno a víko — ne jen čtyři boční. Stačí obsah jedné stěny vynásobit šesti.`,
            `Jedna stěna: ${a} · ${a} = ${a * a} cm².`,
            `Povrch: 6 · ${a * a} = ${S} cm². ${verdikt(p2)}`]),
        tvrzeni(`Krychle s dvakrát delší hranou má ${slovo} větší objem než tato krychle.`, p3,
          [`Objem krychle je hrana · hrana · hrana. Když se hrana zdvojnásobí, zdvojnásobí se každý ze tří činitelů, takže objem se nezdvojnásobí.`,
            `Objem: ${a} · ${a} · ${a} = ${V} cm³, s hranou ${2 * a} cm: ${2 * a} · ${2 * a} · ${2 * a} = ${V2} cm³.`,
            `${V2} : ${V} = 8, objem je osmkrát větší. ${verdikt(p3)}`])
      ]
    };
  }

  function gen14b() {
    // 2 body — chybějící hodnota z průměru
    const known = Array.from({ length: 4 }, () => ri(2, 9)), s = known.reduce((x, y) => x + y, 0);
    let missing = ri(3, 9); while ((s + missing) % 5 !== 0) missing++;
    const soucet = s + missing, prumer = soucet / 5;
    // chyby: součet jako by hodnot byly jen čtyři, průměr sám, průměr známých hodnot
    const sh = volbyMC(missing, [4 * prumer - s, prumer, s / 4].filter(Number.isInteger), 1, 'jiná hodnota');
    return {
      no: 14, points: 2, title: 'Průměr měření', kind: 'mc', okruh: 'data',
      intro: `Pět měření mělo aritmetický průměr ${prumer}. Čtyři z naměřených hodnot byly ${known.join(', ')}.`,
      prompt: `Jaká byla pátá naměřená hodnota?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Z průměru dopočítáš součet všech hodnot (průměr krát jejich počet). Chybějící hodnota je rozdíl mezi tímto součtem a součtem hodnot, které znáš.`,
        `Součet všech pěti: ${prumer} · 5 = ${soucet}; známé: ${known.join(' + ')} = ${s}.`,
        `Pátá hodnota: ${soucet} − ${s} = ${missing}${odpovedMC(sh)}`]
    };
  }

  function gen15b() {
    // 6 bodů — přiřazování, 3× „část z celku" (p % z celku)
    function task(used) {
      let pct, celek, cast;
      do { pct = ri(1, 9) * 10; celek = [50, 100, 200][ri(0, 2)]; cast = pct * celek / 100; }
      while (used.includes(cast) || cast === 0);
      used.push(cast);
      return { pct, celek, cast };
    }
    const used = [];
    const t1 = task(used), t2 = task(used), t3 = task(used);
    const answers = [t1.cast, t2.cast, t3.cast];
    const set = new Set(answers);
    while (set.size < 6) { set.add(ri(1, 40) * 5); }
    const optsArr = [...set].sort((a, b) => a - b);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const labels = optsArr.map((v, i) => `${letters[i]}) ${v}`);
    const ansLetters = answers.map(v => letters[optsArr.indexOf(v)]);
    return {
      no: 15, points: 6, title: 'Procenta z celku', kind: 'match',
      prompts: [
        `V ročníku je ${t1.celek} žáků. ${t1.pct} % z nich chodí na kroužek. Kolik žáků chodí na kroužek?`,
        `Výrobek stál ${t2.celek} Kč. Sleva je ${t2.pct} %. O kolik Kč se cena sníží?`,
        `V nádrži je ${t3.celek} litrů vody. Vypustí se ${t3.pct} %. Kolik litrů se vypustí?`
      ],
      options: labels,
      ans: ansLetters,
      /* Každý postup je SAMOSTATNÝ — dřív druhý a třetí začínaly „Stejný
         postup…" a „A do třetice stejně", což v procvičování (tam se ukáže
         jen jedna otázka) nedávalo smysl. Přes jedno procento, ne přes
         součin: `200 · 90 = 18000` je pětimístné číslo bez důvodu. */
      sol: [[t1, 'žák', 'žáci', 'žáků'], [t2, 'Kč', 'Kč', 'Kč'], [t3, 'litr', 'litry', 'litrů']]
        .map(([t, j1, j2, j5]) => [
          `Procenta jsou setiny celku. Nejdřív zjisti, kolik je jedno procento — celek vyděl stem — a pak ho vynásob počtem procent.`,
          `1 % z ${t.celek} je ${t.celek} : 100 = ${cz(t.celek / 100)}.`,
          `${t.pct} % je ${cz(t.celek / 100)} · ${t.pct} = ${t.cast} ${skl(t.cast, j1, j2, j5)}.`
        ])
    };
  }

  function gen16b() {
    // 4 body — obdélníkový obraz v rámu (strana s rámem + obsah rámu)
    const RAM = ri(2, 3), L = ri(5, 9), W = ri(3, L - 1);
    const outL = w => w + 2 * RAM, frameArea = outL(L) * outL(W) - L * W, W3 = W + ri(2, 4);
    return {
      no: 16, points: 4, title: 'Obraz v rámu',
      intro: `Obdélníkový obraz je po celém obvodu lemovaný rámem širokým ${RAM} cm (na každé straně stejně).`,
      parts: [
        { key: '16.1', points: 2, prompt: `Obraz má rozměry ${L} cm × ${W} cm. Jaká je délka celého obrazu i s rámem podél jeho DELŠÍ strany (v cm)?`, ans: String(outL(L)),
          sol: [`Rám obepíná obraz dokola, takže délku strany prodlouží na OBOU koncích o ${RAM} cm.`,`Přičítá se tedy dvakrát ${RAM} cm, tedy ${2 * RAM} cm.`,`Vnější délka = ${L} + ${2 * RAM} = ${outL(L)} cm.`] },
        { key: '16.2', points: 1, prompt: `Jaký obsah má samotný rám (v cm²)?`, ans: String(frameArea),
          sol: [`Rám je to, co zbyde z celého obdélníku (obraz i s rámem), když z něj vyjmeš samotný obraz — obsah rámu je rozdíl dvou obsahů. Pozor: oba rozměry celku jsou o 2 · ${RAM} cm větší.`,
            `Obsah celku: ${outL(L)} · ${outL(W)} = ${outL(L) * outL(W)} cm². Obsah obrazu: ${L} · ${W} = ${L * W} cm².`,
            `Rám = ${outL(L) * outL(W)} − ${L * W} = ${frameArea} cm².`] },
        { key: '16.3', points: 1, prompt: `Jiný obraz má kratší stranu ${W3} cm. Jaká je délka celého obrazu i s rámem podél této strany (v cm)?`, ans: String(outL(W3)),
          sol: [`Rám obepíná obraz dokola, takže každý jeho rozměr prodlouží na OBOU koncích o šířku rámu ${RAM} cm.`,`Přičítá se tedy 2 · ${RAM} = ${2 * RAM} cm.`,`Vnější rozměr = ${W3} + ${2 * RAM} = ${outL(W3)} cm.`] }
      ]
    };
  }

  /* ═══ TŘETÍ VARIANTY vybraných pozic (podle reálných CERMAT předloh) ═══ */

  function gen1c() {
    // 1 bod — pořadí operací s mocninou. Čtyři tvary z ostrých testů: „a² − b · c",
    // „(−6)² − 3 · (−3)" (M9 2022 2. ř. ú. 1), „√(1,3² − 1,2²)" (M9 2023 1. náhr.
    // ú. 2.2) a „(0,08 − 1) : 0,2" (M9 2022 2. náhr. ú. 2.2). Desetinná čísla se
    // počítají v celých setinách, aby nevznikl artefakt plovoucí čárky.
    const tvar = ri(1, 4);
    let prompt, ans, sol;
    if (tvar === 1) {
      const a = ri(5, 9), b = ri(2, 4), c = ri(2, 4);
      ans = a * a - b * c; prompt = `Vypočítejte: ${a}² − ${b} · ${c} =`;
      sol = [`Mocnina i násobení mají přednost před odčítáním — spočítej je dřív, ne zleva doprava.`,
        `${a}² = ${a} · ${a} = ${a * a} a ${b} · ${c} = ${b * c}.`,
        `Nakonec odečti: ${a * a} − ${b * c} = ${ans}.`];
    } else if (tvar === 2) {
      const a = ri(3, 9), b = ri(2, 6), c = ri(2, 6);
      ans = a * a + b * c; prompt = `Vypočítejte: (−${a})² − ${b} · (−${c}) =`;
      sol = [`Mocnina i násobení mají přednost před odčítáním. Pozor na znaménka: záporné číslo na druhou je KLADNÉ a odečíst záporné číslo znamená přičíst.`,
        `(−${a})² = (−${a}) · (−${a}) = ${a * a} a ${b} · (−${c}) = −${b * c}.`,
        `${a * a} − (−${b * c}) = ${a * a} + ${b * c} = ${ans}.`];
    } else if (tvar === 3) {
      const [x, y, z] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [7, 24, 25], [9, 12, 15], [12, 16, 20]]);
      const Z = cz(z / 10), Y = cz(y / 10), zz = cz(z * z / 100), yy = cz(y * y / 100), xx = cz(x * x / 100);
      ans = cz(x / 10); prompt = `Vypočítejte: √(${Z}² − ${Y}²) =`;
      sol = [`Pod odmocninou se nejdřív umocní a odečte. Odmocnina rozdílu NENÍ rozdíl odmocnin, takže výsledek není ${Z} − ${Y}.`,
        `${Z}² = ${zz} a ${Y}² = ${yy}, rozdíl ${zz} − ${yy} = ${xx}.`,
        `√${xx} = ${ans}, protože ${ans} · ${ans} = ${xx}.`];
    } else {
      let pS, q, rS;
      do { pS = pick([2, 4, 5, 6, 8, 12, 15, 16, 25]); q = ri(1, 3); rS = pick([20, 25, 40, 50]); }
      while (((pS - 100 * q) * 100) % rS !== 0);                    // podíl na nejvýš dvě místa
      const cS = pS - 100 * q, v = cS / rS;
      ans = String(v); prompt = `Vypočítejte: (${cz(pS / 100)} − ${q}) : ${cz(rS / 100)} =`;
      sol = [`Závorka má přednost. Dělit desetinným číslem se nemusíš: vynásob dělence i dělitele stem, podíl se tím nezmění.`,
        `Závorka: ${cz(pS / 100)} − ${q} = ${zn(cS / 100)}.`,
        `${zn(cS / 100)} : ${cz(rS / 100)} = ${zn(cS)} : ${rS} = ${zn(v)}.`];
    }
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'vyrazy-mocniny',
      parts: [{ key: '', points: 1, prompt, ans: String(ans), sol }]
    };
  }

  /* ── POZICE 1 — další varianty ───────────────────────────────────
     Archetypy NEJSOU vymyšlené: vznikly skenem všech 13 ostrých zadání
     v pdfs/ (2023–2026) a vybráním úloh za 1 bod. Naměřeno 11 takových
     úloh; naše původní tři varianty pokrývaly jediný z jejich archetypů
     (mocnina/odmocnina), takže deváťák viděl při opakování pořád totéž.
     U každé varianty je uvedeno, ze které ostré úlohy vychází. ──────── */

  function gen1d() {
    // Vzor: M9B/2026 ú. 1 a nanecisto/2025 ú. 1 — rozdíl dvou obsahů
    // v RŮZNÝCH jednotkách. Jediný archetyp, který se v archivu opakuje
    // dvakrát, a v roce 2026 stojí rovnou na první pozici testu.
    // Setiny m² se drží v CELÝCH číslech, aby převod nevyrobil artefakt
    // plovoucí čárky (0,1 · 10000 v JS není přesně 1000).
    const setin = pick([5, 10, 20, 25, 40, 50]);
    const velke = setin * 100;          // 1 m² = 10 000 cm² ⇒ setin/100 m² = setin · 100 cm²
    const male = ri(2, 9) * 10;         // 20–90 cm², vždy menší než nejmenší velká plocha (500)
    const ans = velke - male;
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'vyrazy-mocniny',
      parts: [{ key: '', points: 1,
        prompt: `Vypočítejte, o kolik cm² je plocha o obsahu ${cz(setin / 100)} m² větší než plocha o obsahu ${male} cm².`,
        ans: String(ans),
        sol: [
          `Obsahy jde odečítat, teprve když jsou ve STEJNÝCH jednotkách — převeď proto m² na cm².`,
          `Metr má 100 cm, takže 1 m² = 100 · 100 = 10 000 cm². Z toho ${cz(setin / 100)} m² = ${velke} cm².`,
          `Rozdíl = ${velke} − ${male} = ${ans} cm².`
        ] }]
    };
  }

  function gen1e() {
    // Vzor: M9C/2025 ú. 1 — „kolikrát více je 5 kilogramů než 0,25 gramů".
    // Značky (kg, g) místo slov schválně: „0,25 gramů" je sice správně,
    // ale skloňování číslovek je v tomhle repozitáři doložený zdroj chyb.
    // 1 kg tu schválně není: krok „1 kg = 1000 g, takže 1 kg = 1000 g"
    // je tautologie a úloha „kolikrát více je 1 kg" navíc nic nezkouší.
    const kg = pick([2, 4, 5, 8, 10]);
    const setinG = pick([10, 20, 25, 50]);        // setiny gramu
    const gramu = kg * 1000;
    const ans = gramu * 100 / setinG;             // dělitel dělí 100 000 beze zbytku
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'vyrazy-mocniny',
      parts: [{ key: '', points: 1,
        prompt: `Určete, kolikrát více je ${kg} kg než ${cz(setinG / 100)} g.`,
        ans: String(ans),
        sol: [
          `„Kolikrát více" znamená DĚLENÍ. Dělit ale jde jen stejné jednotky, takže nejdřív převeď.`,
          `1 kg = 1000 g, takže ${kg} kg = ${gramu} g.`,
          `Dělit desetinným číslem se nemusíš: rozšiř obě čísla stem, podíl se tím nezmění — ${gramu * 100} : ${setinG}.`,
          `${gramu * 100} : ${setinG} = ${ans}, tedy ${ans}krát více.`
        ] }]
    };
  }

  function gen1f() {
    // Vzor: M9C/2024 ú. 1 — celek zadaný SOUČTEM a ROZDÍLEM dvou částí.
    // Skutečná města tu schválně nejsou: čísla se losují a u pojmenovaného
    // města by ze zadání bylo nepravdivé tvrzení o skutečnosti.
    const mensi = ri(12, 45) * 10;
    const rozdil = ri(3, 15) * 10;
    const celkem = 2 * mensi + rozdil;
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'slovni',
      parts: [{ key: '', points: 1,
        prompt: `V knihovně je dohromady ${celkem} knih. Beletrie je o ${rozdil} knih více než naučné literatury. Kolik je naučných knih?`,
        ans: String(mensi),
        sol: [
          `Obě části dohromady dávají celek. Kdybys od celku odečetl ten rozdíl, zbyly by DVĚ stejné části — obě velké jako ta menší.`,
          `${celkem} − ${rozdil} = ${celkem - rozdil}, a to jsou dvě stejné části.`,
          `Naučných knih je polovina: ${celkem - rozdil} : 2 = ${mensi}.`
        ] }]
    };
  }

  function gen1g() {
    // Vzor: M9D/2024 ú. 1 — dvě různé délky kroku na stejné trase.
    // `nas` je nejmenší násobek metrů, při kterém trasa v CENTIMETRECH
    // vyjde beze zbytku pro oba kroky; jinak by počet kroků nebyl celý.
    const d = pick([
      { a: 75, b: 60, nas: 3 }, { a: 80, b: 60, nas: 12 }, { a: 90, b: 60, nas: 9 },
      { a: 60, b: 40, nas: 6 }, { a: 80, b: 50, nas: 4 }
    ]);
    /* Trasa musí být dělitelná `nas` (aby počty kroků vyšly celé) A ZÁROVEŇ
       stovkou metrů — jinak vyjde délka jako „3,084 km", což na trase
       nikdo neuvádí a rozbije to dojem z ostrého zadání (tam 2,7 km). */
    const krok = d.nas * 100 / gcd(d.nas, 100);
    const trasaM = krok * ri(Math.ceil(1200 / krok), Math.floor(6000 / krok));
    const trasaCm = trasaM * 100;
    const krokuA = trasaCm / d.a, krokuB = trasaCm / d.b;
    const ans = krokuB - krokuA;
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'slovni',
      parts: [{ key: '', points: 1,
        prompt: `Trasa je dlouhá ${cz(trasaM / 1000)} km. Jeden turista má krok dlouhý ${d.a} cm, druhý ${d.b} cm. O kolik kroků udělá druhý turista na celé trase více než první?`,
        ans: String(ans),
        sol: [
          `Kdo má kratší krok, musí jich udělat víc. Spočítej počet kroků každého zvlášť — je to trasa dělená délkou jeho kroku.`,
          `Kroky jsou v centimetrech, převeď proto i trasu: ${cz(trasaM / 1000)} km = ${trasaM} m = ${trasaCm} cm.`,
          `Kroků: ${trasaCm} : ${d.a} = ${krokuA} a ${trasaCm} : ${d.b} = ${krokuB}.`,
          `Rozdíl = ${krokuB} − ${krokuA} = ${ans} kroků.`
        ] }]
    };
  }

  function gen1h() {
    // Vzor: M9B/2026 1. náhr. ú. 1 — jízda s pauzou na oběd („strávil jízdou přesně
    // 7 hodin… zahájil v 7:44… vystoupil ve 12:02 a vrátil se za 38 minut. Kdy dorazil
    // do cíle?"). Časy se drží v minutách od půlnoci a na text se převádějí až nakonec,
    // aby nevznikl čas typu 19:65. Odpověď je čas, PZ.check ho porovná celý.
    const fmt = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
    const vCas = m => ([2, 3, 4, 12, 13, 14, 20, 21, 22, 23].includes(Math.floor(m / 60)) ? 've ' : 'v ') + fmt(m);
    const hm = m => [m >= 60 ? Math.floor(m / 60) + ' h' : '', m % 60 ? (m % 60) + ' min' : ''].filter(Boolean).join(' ');
    const start = ri(6, 8) * 60 + ri(1, 58), ven = ri(11 * 60, 13 * 60 + 30), pred = ven - start;
    const jizda = (Math.ceil((pred + 60) / 60) + ri(0, 1)) * 60, pauza = ri(15, 55);
    const zpet = ven + pauza, zbyva = jizda - pred, cil = zpet + zbyva;
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'slovni',
      intro: `Řidič strávil jízdou v autě přesně ${jizda / 60} ${skl(jizda / 60, 'hodinu', 'hodiny', 'hodin')}, než dojel do cíle. Jízdu zahájil ráno ${vCas(start)} a přerušil ji jen jednou, když si udělal pauzu na oběd: z auta vystoupil ${vCas(ven)} a vrátil se za ${pauza} minut. Pak pokračoval v jízdě až do cíle.`,
      parts: [{ key: '', points: 1, klavesnice: 'text',
        prompt: `Určete, kdy řidič dorazil do cíle. Výsledek zapište ve tvaru hodiny:minuty.`,
        ans: fmt(cil),
        sol: [
          `Pauza se do doby jízdy nepočítá, auto při ní stojí. Zjisti proto, kolik jízdy zbývalo po pauze, a přičti to k času, kdy řidič znovu vyjel.`,
          `Před pauzou jel od ${fmt(start)} do ${fmt(ven)}, tedy ${hm(pred)}.`,
          `Po pauze zbývalo ${jizda / 60} h − ${hm(pred)} = ${hm(zbyva)} jízdy.`,
          `Znovu vyjel ${vCas(zpet)} a jel ještě ${hm(zbyva)}, do cíle tedy dorazil ${vCas(cil)}.`
        ] }]
    };
  }

  // „čtvrtinu", „dvě pětiny" — zlomek ve 4. pádě (odstřihli…, stojí…)
  const ZLOMEK_4P = { '1/2': 'polovinu', '1/3': 'třetinu', '2/3': 'dvě třetiny', '1/4': 'čtvrtinu', '3/4': 'tři čtvrtiny',
    '1/5': 'pětinu', '2/5': 'dvě pětiny', '3/5': 'tři pětiny', '4/5': 'čtyři pětiny' };

  function gen1i() {
    // Vzor: M9B/2025 2. náhr. ú. 1 — „Třímetrovou dárkovou stuhu jsme dvěma střihy
    // rozdělili na tři díly… nejprve čtvrtinu stuhy, potom dvě pětiny ZBYTKU…"
    // Díl ze zbytku je ta past: dvě pětiny se nepočítají z celé stuhy.
    let L, p, k, q, cel, prvni, zbytek, druhy;
    for (;;) {
      L = ri(2, 6); p = pick([3, 4, 5]); [k, q] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5]]);
      cel = L * 100; prvni = cel / p; zbytek = cel - prvni;
      if (cel % p === 0 && zbytek % q === 0) { druhy = zbytek / q * k; break; }
    }
    const treti = zbytek - druhy, ptej = pick(['druhý', 'třetí', 'třetí']);
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'zlomky',
      intro: `Dárkovou stuhu dlouhou ${L} m jsme dvěma střihy rozdělili na tři díly. Nejprve jsme odstřihli ${ZLOMEK_4P['1/' + p]} stuhy na první dárek, potom jsme odstřihli ${ZLOMEK_4P[k + '/' + q]} zbytku stuhy na druhý dárek a poslední díl jsme použili na třetí dárek.`,
      parts: [{ key: '', points: 1,
        prompt: `Vypočítejte, kolik cm stuhy jsme použili na ${ptej} dárek.`,
        ans: String(ptej === 'druhý' ? druhy : treti),
        sol: [
          `Druhý díl se počítá ze ZBYTKU, ne z celé stuhy — nejdřív proto zjisti, kolik stuhy zbylo po prvním střihu.`,
          `${L} m = ${cel} cm. První dárek: ${cel} : ${p} = ${prvni} cm, zbylo ${cel} − ${prvni} = ${zbytek} cm.`,
          `Druhý dárek (${ZLOMEK_4P[k + '/' + q]} zbytku): ${zbytek} : ${q} · ${k} = ${druhy} cm.`,
          ...(ptej === 'třetí' ? [`Třetí dárek dostal, co zbylo: ${zbytek} − ${druhy} = ${treti} cm.`] : [])
        ] }]
    };
  }

  function gen1j() {
    // Poměr a celek, tři kontexty z ostrých testů: závaží v poměru 3 : 5, která se liší
    // o 600 g (M9 2023 2. náhr. ú. 1); film, kde zbývající doba je polovinou uplynulé
    // (M9A/2023 ú. 1); vstupenky, kde dětská stojí dvě pětiny dospělé (M9 2025 2. ř. ú. 1).
    const kontext = ri(1, 3), dily = n => skl(n, 'díl', 'díly', 'dílů');
    if (kontext === 1) {
      // rozdíl dílů aspoň 2, jinak by krok „600 : 1" nic neříkal
      const [p, q] = pick([[2, 5], [3, 5], [3, 7], [4, 7], [5, 7], [3, 8], [5, 8], [2, 7], [4, 9], [5, 9]]);
      const dil = pick([50, 60, 80, 100, 120, 150, 200, 250]), rozdil = (q - p) * dil, lehci = Math.random() < 0.6;
      const m = lehci ? p : q;
      return {
        no: 1, points: 1, title: 'Číselný výraz', okruh: 'pomer',
        parts: [{ key: '', points: 1,
          prompt: `Hmotnosti dvou závaží jsou v poměru ${p} : ${q} a liší se o ${rozdil} g. Vypočítejte v gramech hmotnost ${lehci ? 'lehčího' : 'těžšího'} závaží.`,
          ans: String(m * dil),
          sol: [
            `Poměr ${p} : ${q} říká, že lehčí závaží má ${p} stejných dílů a těžší ${q} takových dílů. Rozdíl hmotností tedy odpovídá rozdílu počtu dílů.`,
            `Rozdíl: ${q} − ${p} = ${q - p} ${dily(q - p)}, a to je ${rozdil} g. Jeden díl: ${rozdil} : ${q - p} = ${dil} g.`,
            `${lehci ? 'Lehčí' : 'Těžší'} závaží má ${m} ${dily(m)}: ${m} · ${dil} = ${m * dil} g.`
          ] }]
      };
    }
    if (kontext === 2) {
      const [k, slovo] = pick([[2, 'polovinou'], [3, 'třetinou'], [4, 'čtvrtinou'], [5, 'pětinou']]);
      const [T, t4, t1] = pick([[60, '1 hodinu', '1 hodina'], [90, 'hodinu a půl', 'hodina a půl'], [120, '2 hodiny', '2 hodiny'],
        [150, '2 a půl hodiny', '2 a půl hodiny']].filter(([d]) => d % (k + 1) === 0));
      const zbyva = T / (k + 1);
      return {
        no: 1, points: 1, title: 'Číselný výraz', okruh: 'pomer',
        intro: `Celý film trvá ${t4}. Doba, která ještě zbývá do konce filmu, je ${slovo} doby, která již uplynula od začátku filmu.`,
        parts: [{ key: '', points: 1,
          prompt: `Vypočítejte, kolik minut zbývá do konce filmu.`,
          ans: String(zbyva),
          sol: [
            `Uplynulou dobu si rozděl na ${k} stejné díly — zbývající doba je jeden takový díl. Celý film tedy tvoří ${k} + 1 = ${k + 1} ${dily(k + 1)}.`,
            `Celý film: ${t1} je ${T} minut.`,
            `Jeden díl: ${T} : ${k + 1} = ${zbyva} minut, a to je doba, která zbývá do konce.`
          ] }]
      };
    }
    const [k, q] = pick([[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [3, 5]]), n = ri(2, 4), dil = pick([10, 15, 20, 25, 30, 40]);
    const dosp = q * dil, det = k * dil, celkem = dosp + n * det, ptejDet = Math.random() < 0.7, vse = q + n * k;
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'pomer',
      intro: `Dětská vstupenka do muzea stojí ${ZLOMEK_4P[k + '/' + q]} ceny vstupenky pro dospělého. Jeden dospělý ${{ 2: 'se dvěma', 3: 'se třemi', 4: 'se čtyřmi' }[n]} dětmi zaplatil za vstupenky ${celkem} korun.`,
      parts: [{ key: '', points: 1,
        prompt: `Vypočítejte v korunách cenu jedné ${ptejDet ? 'dětské vstupenky' : 'vstupenky pro dospělého'}.`,
        ans: String(ptejDet ? det : dosp),
        sol: [
          `Cenu vstupenky pro dospělého si rozděl na ${q} stejné díly — dětská stojí ${k} ${skl(k, 'takový díl', 'takové díly', 'takových dílů')}. Všechny vstupenky pak spočítáš v dílech.`,
          `Dospělý ${q} ${dily(q)}, děti ${n} · ${k} = ${n * k} ${dily(n * k)}, dohromady ${q} + ${n * k} = ${vse} ${dily(vse)}, a to je ${celkem} Kč.`,
          `Jeden díl: ${celkem} : ${vse} = ${dil} Kč. ${ptejDet ? `Dětská vstupenka: ${k} · ${dil} = ${det} Kč.` : `Vstupenka pro dospělého: ${q} · ${dil} = ${dosp} Kč.`}`
        ] }]
    };
  }

  function gen1k() {
    // Vzor: M9B/2026 2. náhr. ú. 1 — „Délka jeho prvního hodu byla 7 m. Každý další hod
    // byl o desetinu delší než předchozí. O kolik cm byl třetí hod delší než první?"
    // (147 cm, ne 140: druhá desetina se bere z DELŠÍHO hodu). Počítá se v centimetrech,
    // aby desetinná čísla nevyrobila artefakt plovoucí čárky.
    const hod = Math.random() < 0.5;
    const [f, slovo] = pick(hod ? [[10, 'desetinu'], [5, 'pětinu']] : [[10, 'desetinu'], [5, 'pětinu'], [4, 'čtvrtinu']]);
    const c1 = hod ? ri(5, 9) * 100 : pick({ 10: [100, 200], 5: [75, 100, 125, 150], 4: [64, 96, 128, 160] }[f]);
    const zmena = x => (hod ? x + x / f : x - x / f), op = hod ? '+' : '−';
    const c2 = zmena(c1), c3 = zmena(c2), ans = Math.abs(c3 - c1), co = hod ? 'hod' : 'odskok';
    return {
      no: 1, points: 1, title: 'Číselný výraz', okruh: 'zlomky',
      intro: hod
        ? `Při tréninku hodu oštěpem měřil první hod ${c1 / 100} m. Každý další hod byl o ${slovo} delší než hod předchozí.`
        : `Míček po prvním dopadu vyskočil do výšky ${c1} cm. Každý další odskok byl o ${slovo} nižší než odskok předchozí.`,
      parts: [{ key: '', points: 1,
        prompt: `Vypočítejte, o kolik cm byl třetí ${co} ${hod ? 'delší' : 'nižší'} než první.`,
        ans: String(ans),
        sol: [
          `Každá změna se počítá z PŘEDCHOZÍ hodnoty, ne z té první — ${hod ? 'druhé prodloužení je proto větší než první' : 'druhé snížení je proto menší než první'}.`,
          ...(hod ? [`První hod: ${c1 / 100} m = ${c1} cm.`] : []),
          `Druhý ${co}: ${c1} ${op} ${c1} : ${f} = ${c1} ${op} ${c1 / f} = ${c2} cm.`,
          `Třetí ${co}: ${c2} ${op} ${c2} : ${f} = ${c2} ${op} ${c2 / f} = ${c3} cm.`,
          `Rozdíl: ${hod ? c3 + ' − ' + c1 : c1 + ' − ' + c3} = ${ans} cm.`
        ] }]
    };
  }

  function gen4d() {
    // 4 body — rovnice se ZLOMKY (vzor M9C/2025 ú. 5.1–5.2, M9A/2023 ú. 5.2)
    // 4.1: rozdíl dvou zlomků s dvojčlenem v čitateli. Jmenovatele jen takové,
    // aby po vynásobení zbyl u x koeficient 2–6 — při 1 by se v posledním
    // kroku dělilo jedničkou.
    let p, q, L, x, a, b;
    do {
      p = pick([2, 3, 4, 5, 6, 10]); q = pick([2, 3, 4, 5, 6, 10]); L = lcm(p, q);
      x = ri(-4, 12); a = ri(1, 9); b = ri(1, 9);
    } while (p === q || L > 20 || Math.abs(L / p - L / q) < 2 || Math.abs(L / p - L / q) > 6
      || (x + a) % p !== 0 || (x - b) % q !== 0 || x + a === 0 || x - b === 0 || x === 0);
    const c = (x + a) / p - (x - b) / q, A = L / p, B = L / q, k1 = A - B, P1 = L * c - A * a - B * b;
    // 4.2: číslo minus zlomek = číslo plus zlomek; druhý jmenovatel je násobkem prvního
    let r, t, y, m, s, f, g, n0, w;
    do {
      [r, t] = pick([[5, 10], [3, 6], [2, 4], [4, 8], [3, 9], [2, 6], [5, 15], [4, 12]]);
      y = ri(-3, 9); m = ri(2, 12); s = ri(1, 4); f = ri(2, 9); g = ri(1, 9); n0 = ri(2, 9);
      w = n0 - (m - s * y) / r - (f * y - g) / t;
    } while ((m - s * y) % r !== 0 || (f * y - g) % t !== 0 || m - s * y === 0 || f * y - g === 0
      || w === 0 || y === 0 || Math.abs(t / r * s - f) < 2);
    const R = t / r, k2 = R * s - f, P2 = t * w - g - t * n0 + R * m;
    const sy = s === 1 ? 'y' : s + 'y';
    return {
      no: 4, points: 4, title: 'Rovnice se zlomky', intro: UVOD4,
      parts: [
        { key: '4.1', points: 2, showExplain: true, klavesnice: 'text',
          prompt: `Řešte rovnici: (x + ${a})/${p} − (x − ${b})/${q} = ${zn(c)}`,
          ans: String(x),
          sol: [
            `Zlomků se zbavíš, když CELOU rovnici vynásobíš společným násobkem jmenovatelů, tady ${L}. Pozor na minus před zlomkem: platí pro celý čitatel, ne jen pro jeho první člen.`,
            `Po vynásobení číslem ${L}: ${krat(A, `(x + ${a})`)} − ${krat(B, `(x − ${b})`)} = ${zn(L * c)}.`,
            `Roznásob — minus před druhou závorkou otočí znaménko u obou členů: ${clen(A, 'x', true)} + ${A * a}${clen(-B, 'x')} + ${B * b} = ${zn(L * c)}.`,
            `Členy s x vlevo, čísla vpravo: ${clen(k1, 'x', true)} = ${zn(L * c)} − ${A * a} − ${B * b} = ${zn(P1)}.`,
            `x = ${zn(P1)} : ${zav(k1)} = ${zn(x)}.`
          ] },
        { key: '4.2', points: 2, showExplain: true, klavesnice: 'text',
          prompt: `Řešte rovnici: ${n0} − (${m} − ${sy})/${r} = ${zn(w)} + (${f}y − ${g})/${t}`,
          ans: String(y),
          sol: [
            `Vynásob celou rovnici číslem ${t}, které je násobkem obou jmenovatelů. Násob KAŽDÝ člen, i čísla bez zlomku, a minus před zlomkem vztáhni na celý čitatel.`,
            `Po vynásobení číslem ${t}: ${t * n0} − ${krat(R, `(${m} − ${sy})`)} = ${zn(t * w)} + ${f}y − ${g}.`,
            `Roznásob a pozor na minus před závorkou: ${t * n0} − ${R * m}${clen(R * s, 'y')} = ${zn(t * w)}${clen(f, 'y')} − ${g}.`,
            `Členy s y vlevo, čísla vpravo: ${clen(k2, 'y', true)} = ${zn(t * w)} − ${g} − ${t * n0} + ${R * m} = ${zn(P2)}.`,
            `y = ${zn(P2)} : ${zav(k2)} = ${zn(y)}.`
          ] }
      ]
    };
  }
  function gen4e() {
    // 4 body — 4.1 rovnice s desetinnými čísly a závorkami (M9A/2023 ú. 5.1,
    // M9D/2025 ú. 5.1), 4.2 + 4.3 SOUSTAVA dvou rovnic (M9B/2025, M9D/2025
    // a nanečisto 2025, vždy ú. 5.2 za 2 body — tady 1 + 1 za x a y).
    // 4.1 se počítá v DESETINÁCH a SETINÁCH jako celých číslech, aby do textu
    // nepronikly artefakty plovoucí čárky.
    let x, a10, b, c10, d10, E10;
    do {
      x = ri(-3, 9); a10 = ri(1, 9); b = ri(2, 5); c10 = ri(1, 9) * 5; d10 = pick([4, 5, 15, 25]);
      E10 = 10 * (a10 * x + 10 * b * x + b * c10) / d10 - 10 * x;
    } while (!Number.isInteger(E10) || E10 === 0 || Math.abs(E10) > 150 || Math.abs(a10 + 10 * b - d10) < 5);
    const h = n => cz(n / 100), hz = n => zn(n / 100);          // setiny → „3,75" / „−3,75"
    const de100 = d10 * E10, bc100 = b * c10 * 10, k10 = a10 + 10 * b - d10, P100 = de100 - bc100;
    const eSign = E10 < 0 ? '−' : '+';
    // soustava: buď y s koeficientem 1 v první rovnici, nebo druhá rovnice
    // rovnou udává y (vzor M9D/2025: „3x − (y + 1) = 10, 2x − 9 = y")
    let x0, y0, rovnice, krokyX, dosazeni;
    if (ri(0, 1)) {
      let sa, sc, sd, se, sf;
      do {
        x0 = ri(-3, 8); y0 = ri(-4, 9); sa = ri(2, 6); sd = ri(1, 5); se = pick([2, 3]);
        sc = sa * x0 + y0; sf = sd * x0 + se * y0;
      } while (Math.abs(sd - se * sa) < 2 || x0 === 0 || y0 === 0);
      rovnice = `${sa}x + y = ${zn(sc)} a ${clen(sd, 'x', true)} + ${se}y = ${zn(sf)}`;
      krokyX = [
        `Soustavu vyřešíš dosazovací metodou: z rovnice, kde je y bez koeficientu, ho vyjádři a dosaď do druhé rovnice — zbyde rovnice s jedinou neznámou.`,
        `Z první rovnice: y = ${zn(sc)} − ${sa}x.`,
        `Dosaď do druhé: ${clen(sd, 'x', true)} + ${se}·(${zn(sc)} − ${sa}x) = ${zn(sf)}, tedy ${clen(sd, 'x', true)}${pm(se * sc)} − ${se * sa}x = ${zn(sf)}.`,
        `${clen(sd - se * sa, 'x', true)} = ${zn(sf)}${pm(-se * sc)} = ${zn(sf - se * sc)}.`,
        `x = ${zn(sf - se * sc)} : ${zav(sd - se * sa)} = ${zn(x0)}.`
      ];
      dosazeni = `Dosaď x zpět do vyjádření: y = ${zn(sc)} − ${sa}·${zav(x0)} = ${zn(y0)}.`;
    } else {
      let sa, sg, sm, sn, sc;
      do {
        x0 = ri(-2, 8); sm = ri(1, 4); sn = ri(1, 9); y0 = sm * x0 - sn; sa = ri(2, 7); sg = ri(1, 6);
        sc = sa * x0 - y0 - sg;
      } while (Math.abs(sa - sm) < 2 || x0 === 0 || y0 === 0 || sg === sn);
      rovnice = `${sa}x − (y + ${sg}) = ${zn(sc)} a ${clen(sm, 'x', true)} − ${sn} = y`;
      krokyX = [
        `Druhá rovnice rovnou udává, čemu se rovná y — stačí ho dosadit do první. Pozor na závorku: minus před ní otočí znaménko u všeho, co je uvnitř.`,
        `Dosaď y = ${clen(sm, 'x', true)} − ${sn} do první rovnice: ${sa}x − (${clen(sm, 'x', true)} − ${sn} + ${sg}) = ${zn(sc)}.`,
        `Odstraň závorku: ${sa}x${clen(-sm, 'x')}${pm(sn - sg)} = ${zn(sc)}, tedy ${clen(sa - sm, 'x', true)} = ${zn(sc)}${pm(sg - sn)} = ${zn(sc + sg - sn)}.`,
        `x = ${zn(sc + sg - sn)} : ${zav(sa - sm)} = ${zn(x0)}.`
      ];
      dosazeni = `Dosaď x do druhé rovnice: y = ${sm === 1 ? '' : sm + '·'}${zav(x0)} − ${sn} = ${zn(y0)}.`;
    }
    return {
      no: 4, points: 4, title: 'Rovnice a soustava', intro: UVOD4,
      parts: [
        { key: '4.1', points: 2, showExplain: true, klavesnice: 'text',
          prompt: `Řešte rovnici: ${cz(a10 / 10)}x + ${b}·(x + ${cz(c10 / 10)}) = ${cz(d10 / 10)}·(x ${eSign} ${cz(Math.abs(E10) / 10)})`,
          ans: String(x),
          sol: [
            `Nejdřív roznásob závorky — číslo před závorkou násobí KAŽDÝ člen uvnitř. Desetinná čísla nevadí; kdo chce, vynásobí celou rovnici stem a počítá s celými čísly.`,
            `${cz(a10 / 10)}x + ${b}x + ${h(bc100)} = ${cz(d10 / 10)}x${pm(de100 / 100)}.`,
            `Čísla vpravo: ${hz(de100)} − ${h(bc100)} = ${hz(P100)}. Koeficient u x vlevo: ${cz(a10 / 10)} + ${b} − ${cz(d10 / 10)} = ${zn(k10 / 10)}.`,
            `${zn(k10 / 10)}x = ${hz(P100)}, tedy x = ${hz(P100)} : ${zav(k10 / 10)} = ${zn(x)}.`
          ] },
        { key: '4.2', points: 1, showExplain: true, klavesnice: 'text',
          prompt: `Řešte soustavu rovnic ${rovnice}. Napište hodnotu x.`,
          ans: String(x0),
          sol: krokyX },
        { key: '4.3', points: 1, showExplain: true, klavesnice: 'text',
          prompt: `Řešte soustavu rovnic ${rovnice}. Napište hodnotu y.`,
          ans: String(y0),
          sol: krokyX.concat([dosazeni]) }
      ]
    };
  }

  /* Rovnice, ve které se x² ODEČTE (2024 1. ř. ú. 5.1, 1. náhr. ú. 5.2), a rovnice
     BEZ ŘEŠENÍ, občas s nekonečně mnoha řešeními (2023 1. ř. ú. 5.1, 2025 1. ř.
     ú. 4.2). Kořen se volí první; u 4.2 se koeficient u neznámé vynuluje schválně.
     Titul i zadání jsou stejné jako u ostatních rovnic, aby nic neprozradilo, že
     řešení chybí. Čtvrtina kořenů v 4.1 je necelá (−2,5; 1,5 …), jako v ostrých testech. */
  function gen4f() {
    const zx = n => (n < 0 ? `(x − ${-n})` : `(x + ${n})`);
    let a, b, c, k, x, e, q0;
    do {
      a = pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]); b = ri(-6, 6); c = ri(-6, 6);
      k = 2 * a - b - c; q0 = a * a - b * c;
      x = ri(0, 3) ? ri(-6, 9) : pick([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]);
      e = k * x + q0;
    } while (b === 0 || c === 0 || b === c || Math.abs(k) < 2 || Math.abs(k) > 6 || !Number.isInteger(e)
      || x === 0 || e === 0 || q0 === 0 || e === q0);
    const A = [[1, 'x²'], [2 * a, 'x'], [a * a, '']], B = [[1, 'x²'], [b + c, 'x'], [b * c, '']];
    // 4.2: y − (y + m)·c = (1 − c)·y + o  →  nemá řešení (o ≠ −c·m), nebo nekonečně mnoho (o = −c·m)
    const nekon = ri(1, 5) === 1;
    let c10, m, cm10, o10;
    do {
      c10 = ri(1, 5); m = ri(2, 9); cm10 = c10 * m; o10 = nekon ? -cm10 : pick([-1, 1]) * ri(1, 9);
    } while (!nekon && o10 === -cm10);
    const n10 = 10 - c10;
    return {
      no: 4, points: 4, title: 'Rovnice', intro: UVOD4,
      parts: [
        { key: '4.1', points: 2, showExplain: true, klavesnice: 'text',
          prompt: `Řešte rovnici: ${zx(a)}² − ${zx(b)}${zx(c)} = ${zn(e)}`,
          ans: String(x),
          sol: [
            `Umocni dvojčlen podle vzorce (A + B)² = A² + 2AB + B² a součin dvou závorek roznásob „každý člen s každým“. Výsledek součinu nech nejdřív v závorce — minus před ním platí pro všechny jeho členy.`,
            `${zx(a)}² = ${mnoho(A)} a ${zx(b)}${zx(c)} = ${mnoho(B)}`,
            `${mnoho(A)} − (${mnoho(B)}) = ${zn(e)}`,
            `${mnoho([[k, 'x'], [q0, '']])} = ${zn(e)} — členy x² se odečetly`,
            `${clen(k, 'x', true)} = ${zn(e)}${pm(-q0)} = ${zn(k * x)}`,
            `x = ${zn(k * x)} : ${zav(k)} = ${zn(x)}`
          ] },
        { key: '4.2', points: 2, showExplain: true, klavesnice: 'text',
          prompt: `Řešte rovnici: y − (y + ${m})·${cz(c10 / 10)} = ${cz(n10 / 10)}y${pm(o10 / 10)}`,
          ans: nekon ? 'nekonečně mnoho řešení' : 'nemá řešení',
          sol: [
            `Roznásob závorku a převeď členy s neznámou na jednu stranu. Když se neznámá úplně odečte, rozhodne zbytek: neplatná rovnost čísel znamená, že rovnice nemá řešení, platná rovnost, že vyhovuje každé číslo.`,
            `y − ${cz(c10 / 10)}y − ${cz(cm10 / 10)} = ${cz(n10 / 10)}y${pm(o10 / 10)}`,
            `${cz(n10 / 10)}y − ${cz(cm10 / 10)} = ${cz(n10 / 10)}y${pm(o10 / 10)} — po odečtení ${cz(n10 / 10)}y zůstane vlevo ${zn(-cm10 / 10)} a vpravo ${zn(o10 / 10)}`,
            nekon ? `Obě strany jsou stejné pro každé y, rovnice má nekonečně mnoho řešení.`
              : `Čísla ${zn(-cm10 / 10)} a ${zn(o10 / 10)} se nerovnají, žádné y rovnost nesplní: rovnice nemá řešení.`
          ] }
      ]
    };
  }

  /* Rovnice se zlomky a soustava, kterou vyřeší SČÍTACÍ metoda: v obou rovnicích je
     u x stejný koeficient (2026 1. náhr. ú. 4.2, 2026 2. náhr. ú. 4.2). */
  function gen4g() {
    // 4.1: x/p + (x − a)/q = c, kořen volený první
    let p, q, a, x, c, L;
    do {
      p = pick([2, 3, 4, 5, 6]); q = pick([2, 3, 4, 5, 6]); L = lcm(p, q);
      a = ri(1, 9); x = ri(-6, 15); c = x / p + (x - a) / q;
    } while (p === q || L > 12 || !Number.isInteger(c) || c === 0 || x === 0 || x === a || L / p + L / q < 3);
    const K = L / p + L / q, P = L * c + (L / q) * a;
    let sa, sb, sd, x0, y0, s1, s2;
    do {
      sa = ri(2, 5); sb = ri(1, 5); sd = ri(1, 5); x0 = ri(-4, 8); y0 = ri(-4, 8);
      s1 = sa * x0 + sb * y0; s2 = sa * x0 - sd * y0;
    } while (x0 === 0 || y0 === 0 || sb === sd || s1 === 0 || s2 === 0);
    const rovnice = `${sa}x${clen(sb, 'y')} = ${zn(s1)} a ${sa}x${clen(-sd, 'y')} = ${zn(s2)}`;
    const krokyY = [
      `V obou rovnicích je u x stejný koeficient ${sa}, takže se x zbavíš ODEČTENÍM rovnic (sčítací metoda). Z toho vyjde y a to pak dosadíš zpět do jedné z rovnic.`,
      `Odečteme druhou rovnici od první: ${clen(sb, 'y', true)} − ${zav(-sd)}y = ${zn(s1)} − ${zav(s2)}`,
      `${clen(sb + sd, 'y', true)} = ${zn(s1 - s2)}`,
      `y = ${zn(s1 - s2)} : ${sb + sd} = ${zn(y0)}`
    ];
    return {
      no: 4, points: 4, title: 'Rovnice a soustava', intro: UVOD4,
      parts: [
        { key: '4.1', points: 2, showExplain: true, klavesnice: 'text',
          prompt: `Řešte rovnici: x/${p} + (x − ${a})/${q} = ${zn(c)}`,
          ans: String(x),
          sol: [
            `Vynásob CELOU rovnici společným násobkem jmenovatelů ${L}. Každý zlomek se tím změní na celé číslo krát čitatel — čitatel s více členy dej do závorky.`,
            `x/${p} + (x − ${a})/${q} = ${zn(c)}   | ·${L}`,
            `${clen(L / p, 'x', true)} + ${krat(L / q, `(x − ${a})`)} = ${zn(L * c)}`,
            `${clen(L / p, 'x', true)}${clen(L / q, 'x')} − ${(L / q) * a} = ${zn(L * c)}`,
            `${clen(K, 'x', true)} = ${zn(L * c)} + ${(L / q) * a} = ${zn(P)}`,
            `x = ${zn(P)} : ${K} = ${zn(x)}`
          ] },
        { key: '4.2', points: 1, showExplain: true, klavesnice: 'text',
          prompt: `Řešte soustavu rovnic ${rovnice}. Napište hodnotu x.`,
          ans: String(x0),
          sol: krokyY.concat([`Dosadíme y = ${zn(y0)} do první rovnice: ${sa}x${pm(sb * y0)} = ${zn(s1)}`,
            `${sa}x = ${zn(s1)}${pm(-sb * y0)} = ${zn(sa * x0)}`, `x = ${zn(sa * x0)} : ${sa} = ${zn(x0)}`]) },
        { key: '4.3', points: 1, showExplain: true, klavesnice: 'text',
          prompt: `Řešte soustavu rovnic ${rovnice}. Napište hodnotu y.`,
          ans: String(y0),
          sol: krokyY }
      ]
    };
  }

  function gen12c() {
    // 2 body — kolik krychlových kostek vyplní krabici
    const k = pick([2, 5]), a = ri(2, 4) * k, b = ri(2, 4) * k, c = ri(2, 3) * k;
    const pocet = (a / k) * (b / k) * (c / k), V = a * b * c;
    // chyby: objem krabice dělený jen HRANOU kostky, jedna vrstva, dělení obsahem stěny
    const sh = volbyMC(pocet, [V / k, (a / k) * (b / k), V / (k * k)], 1, 'jiný počet');
    return {
      no: 12, points: 2, title: 'Kostky v krabici', kind: 'mc', okruh: 'telesa',
      svg: svgCuboid(a + ' cm', b + ' cm', c + ' cm'),
      intro: `Krabice tvaru kvádru má vnitřní rozměry ${a} cm × ${b} cm × ${c} cm. Krabici chceme beze zbytku vyplnit krychlovými kostkami o hraně ${k} cm.`,
      prompt: `Kolik kostek se do krabice vejde?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Kostky se skládají do řad, vrstev a sloupců, takže spočítej, kolik se jich vejde podél KAŽDÉ hrany. Objem krabice dělený jen hranou kostky (ne jejím objemem) by dal nesmysl.`,
        `Podél hran: ${a} : ${k} = ${a / k}, ${b} : ${k} = ${b / k} a ${c} : ${k} = ${c / k}.`,
        `Kostek: ${a / k} · ${b / k} · ${c / k} = ${pocet}${odpovedMC(sh)}`]
    };
  }

  function gen13c() {
    // 2 body — o kolik procent se cena zvýšila
    // Násobení desetinným číslem dalo „770.0000000000001 Kč" — počítá se v celých.
    const stara = ri(1, 9) * 100, p = pick([10, 20, 25, 50]), prir = stara * p / 100, nova = stara + prir;
    // chyby: nová cena v procentech původní (index místo přírůstku), přírůstek vztažený k nové ceně
    const sh = volbyMC(p, [100 + p, 100 * prir / nova].filter(Number.isInteger), 5, 'o jiný počet procent', x => `o ${x} %`);
    return {
      no: 13, points: 2, title: 'Zdražení', kind: 'mc', okruh: 'procenta',
      intro: `Zboží zdražilo z ${stara} Kč na ${nova} Kč.`,
      prompt: `O kolik procent se cena zvýšila?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Zdražení v procentech říká, jakou část PŮVODNÍ ceny tvoří přírůstek. Ne novou cenu v procentech (to by bylo přes 100 %) a ne přírůstek k nové ceně.`,
        `Přírůstek: ${nova} − ${stara} = ${prir} Kč.`,
        `${prir} : ${stara} = ${cz(p / 100)}, tedy o ${p} %${odpovedMC(sh)}`]
    };
  }

  function gen14c() {
    // 2 body — medián pěti čísel
    const arr = []; while (arr.length < 5) { const v = ri(1, 20); if (!arr.includes(v)) arr.push(v); }
    const sorted = [...arr].sort((x, y) => x - y), med = sorted[2], soucet = arr.reduce((x, y) => x + y, 0);
    // chyby: prostřední číslo NESEŘAZENÉHO seznamu, průměr, střed rozpětí
    const sh = volbyMC(med, [arr[2], soucet / 5, (sorted[0] + sorted[4]) / 2].filter(Number.isInteger), 1, null);
    return {
      no: 14, points: 2, title: 'Medián', kind: 'mc', okruh: 'data',
      prompt: `Určete medián (prostřední hodnotu) těchto čísel: ${arr.join(', ')}.`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Medián je prostřední hodnota — ale až po seřazení. Prostřední číslo neseřazeného seznamu ani průměr to nejsou.`,
        `Seřazeno od nejmenšího: ${sorted.join(', ')}.`,
        `Hodnot je pět, prostřední je třetí: medián je ${med}${odpovedMC(sh)}`]
    };
  }

  function gen2c() {
    // 3 body — 2.1 dělení zlomků se stejným jmenovatelem, 2.2 složený zlomek.
    /* Zlomky v zadání jsou vždy v základním tvaru („6/4" by ostrý test nenapsal)
       a dělenec se nerovná děliteli (6/4 : 6/4 = 1 nezkouší nic). */
    let a, b, c;
    do { b = ri(3, 9); a = ri(1, 2 * b - 1); c = ri(1, 2 * b - 1); }
    while (a === c || gcd(a, b) !== 1 || gcd(c, b) !== 1 || c === b);
    const R1 = zRed(a, c);
    const s2 = slozenyZlomek(Math.random() < 0.5);
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `${ZL} ${a}/${b} : ${c}/${b} =`,
          ans: zAns(R1),
          sol: [
            `Dělit zlomkem znamená násobit jeho převrácenou hodnotou — druhý zlomek se obrátí vzhůru nohama. Stejný jmenovatel se pak vykrátí.`,
            `${a}/${b} : ${c}/${b} = ${a}/${b} · ${b}/${c} = ${a}/${c}`,
            gcd(a, c) === 1 ? `Zlomek ${a}/${c} už je v základním tvaru.` : `Zkrátíme ${gcd(a, c)}: ${a}/${c} = ${zTxt(R1)}`
          ] },
        { key: '2.2', points: 2, showExplain: true, ...s2 }
      ]
    };
  }

  function zlText(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(Math.abs(n), d) || 1;
    const nn = n / g, dd = d / g;
    return dd === 1 ? String(nn) : `${nn}/${dd}`;
  }

  /* ── Přesná zlomková aritmetika (v celých číslech, bez plovoucí čárky) ──
     Zlomek je dvojice [čitatel, jmenovatel] v základním tvaru, jmenovatel > 0. */
  const zRed = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(Math.abs(n), d) || 1; return [n / g, d / g]; };
  const zSec = (a, b, s) => zRed(a[0] * b[1] + s * b[0] * a[1], a[1] * b[1]);   // s = +1 / −1
  const zTxt = ([n, d]) => (d === 1 ? zn(n) : (n < 0 ? '−' : '') + Math.abs(n) + '/' + d);
  const zZav = z => (z[0] < 0 ? `(${zTxt(z)})` : zTxt(z));
  const zAns = ([n, d]) => (d === 1 ? String(n) : `${n}/${d}`);
  // zlomek v základním tvaru: zlomekZ menší než 1, zlomekN i větší (ne celé číslo)
  const zlomekZ = (od, po) => { let x, y; do { y = ri(od, po); x = ri(1, y - 1); } while (gcd(x, y) !== 1); return [x, y]; };
  const zlomekN = (od, po) => { let x, y; do { y = ri(od, po); x = ri(1, 2 * y - 1); } while (gcd(x, y) !== 1); return [x, y]; };
  // výsledek jako v ostrých testech: čitatel nejvýš 20, jmenovatel nejvýš 20 (u dělení celým číslem 30)
  const vejdeSe = (R, maxJm = 20) => R[1] <= maxJm && Math.abs(R[0]) <= 20;
  /* Znění z ostrých testů 2026 („…nebo celým číslem"): výsledek občas vyjde
     celý (0, 1, −1) a stejné znění ve všech podúlohách nic neprozradí. */
  const ZL = 'Vypočítejte a výsledek zapište zlomkem v základním tvaru nebo celým číslem:';
  // „3/4 : (−3/2) = 3/4 · (−2/3) = −6/12 = −1/2"
  function zDeleni(N, M, R) {
    const inv = zRed(M[1], M[0]), hruby = [N[0] * inv[0], N[1] * inv[1]];
    return `${zTxt(N)} : ${zZav(M)} = ${zTxt(N)} · ${zZav(inv)}${gcd(Math.abs(hruby[0]), hruby[1]) > 1 ? ` = ${zTxt(hruby)}` : ''} = ${zTxt(R)}`;
  }
  // „3/4 − 5/6 = 9/12 − 10/12 = −1/12": rozšíření na NEJMENŠÍHO společného jmenovatele
  function zKrok(a, b, s) {
    const v = zSec(a, b, s), op = s > 0 ? ' + ' : ' − ';
    if (a[1] === b[1]) return { v, t: `${zTxt(a)}${op}${zTxt(b)} = ${zTxt(v)}` };
    const L = lcm(a[1], b[1]), r = z => `${zn(z[0] * L / z[1])}/${L}`;
    const hruby = a[0] * L / a[1] + s * b[0] * L / b[1];
    const mezi = gcd(Math.abs(hruby), L) > 1 && hruby !== 0 ? ` = ${zTxt([hruby, L])}` : '';   // nezkrácený mezivýsledek
    return { v, t: `${zTxt(a)}${op}${zTxt(b)} = ${r(a)}${op}${r(b)}${mezi} = ${zTxt(v)}` };
  }
  /* Složený zlomek (2025 2. náhr. ú. 3.2, 2026 1. ř. ú. 2.2, 2026 2. ř. ú. 2.3):
     VÝSLEDEK se volí první — čitatel i jmenovatel nejvýš 20, necelý, ve 40 %
     záporný (v ostrých testech 2023–26 je záporných 15 z 38 výsledků). Závorky
     se skládají z jednoduchých zlomků, nanejvýš jedno celé číslo v každé;
     s `mocnina` je první člen čitatele druhá mocnina zlomku. */
  function slozenyZlomek(mocnina) {
    const zlomek = () => zlomekN(2, 6);
    const clen = bezCelych => (!bezCelych && ri(0, 3) === 0 ? [ri(1, 3), 1] : zlomek());
    const zaporny = Math.random() < 0.4, cele = Math.random() < 0.2;
    for (let pokus = 0; pokus < 5000; pokus++) {
      let q = null, a1 = clen(), a2 = clen(a1[1] === 1);
      if (mocnina) { do { q = zlomek(); } while (q[0] >= q[1] * 2 || q[1] > 5); a1 = [q[0] * q[0], q[1] * q[1]]; }
      const b1 = clen(), b2 = clen(b1[1] === 1), s1 = pick([1, -1]), s2 = pick([1, -1]);
      const N = zSec(a1, a2, s1), M = zSec(b1, b2, s2);
      const stejne = (x, y) => x[0] === y[0] && x[1] === y[1];
      // mezivýsledky zvládnutelné bez kalkulačky (jinak vznikalo i „221/100")
      if (N[0] === 0 || M[0] === 0 || stejne(a1, a2) || stejne(b1, b2) || !vejdeSe(N, 36) || !vejdeSe(M, 36)) continue;
      const R = zRed(N[0] * M[1], N[1] * M[0]);
      if ((R[1] === 1) !== cele || !vejdeSe(R) || (R[0] < 0) !== zaporny) continue;
      const kN = zKrok(a1, a2, s1), kM = zKrok(b1, b2, s2);
      const prvni = mocnina ? `(${q[0]}/${q[1]})²` : zTxt(a1);
      const cit = `${prvni}${s1 > 0 ? ' + ' : ' − '}${zTxt(a2)}`, jm = `${zTxt(b1)}${s2 > 0 ? ' + ' : ' − '}${zTxt(b2)}`;
      return {
        prompt: `${ZL} (${cit}) : (${jm}) =`,
        ans: zAns(R),
        sol: [
          `Složený zlomek je dělení: zvlášť spočítej čitatel (první závorku) a jmenovatel (druhou závorku), každý na nejmenšího společného jmenovatele, a teprve pak je vyděl — dělit zlomkem znamená násobit převrácenou hodnotou.`,
          ...(mocnina ? [`(${q[0]}/${q[1]})² = ${q[0] * q[0]}/${q[1] * q[1]}`] : []),
          `Čitatel: ${kN.t}`,
          `Jmenovatel: ${kM.t}`,
          zDeleni(N, M, R)
        ]
      };
    }
    throw new Error('slozenyZlomek: nenašel se výsledek');
  }

  function gen2d() {
    // 3 body — 2.1 „3 · (2/3 − 7/9) + 2/3" (M9B/2026 ú. 2.1), 2.2 složený zlomek
    // s násobením ve jmenovateli: „(1 − 1/4) : (2 · 5/8 − 2)" (M9B/2026 ú. 2.3)
    // a „(7/2 − 1/6) : (12 − 6 · 3/4)" (M9B/2026 2. náhr. ú. 2.3).
    let a, B, D, F, Z, P, R1;
    for (;;) {
      a = ri(2, 6); B = zlomekZ(3, 9); D = zlomekZ(3, 9);
      F = zRed(ri(1, 2 * B[1] - 1), pick([B[1], D[1]]));
      if (B[1] === D[1] || lcm(B[1], D[1]) > 24 || F[1] === 1) continue;   // společný jmenovatel potřeba, ale ne přes 24; F není celé
      Z = zKrok(B, D, -1); P = zRed(a * Z.v[0], Z.v[1]); R1 = zSec(P, F, 1);
      if (vejdeSe(R1) && vejdeSe(P, 24)) break;
    }
    let k, f, sN, w, u, v, c, W, kN, kM, R2, jm;
    for (;;) {
      k = ri(1, 3); f = zlomekZ(2, 6); sN = pick([1, -1]);
      w = ri(2, 6); v = pick([4, 6, 8, 9, 10, 12]); u = ri(1, v - 1); c = ri(1, 6);
      if (gcd(u, v) !== 1 || gcd(w, v) === 1) continue;             // součin se má dát zkrátit
      W = zRed(w * u, v);
      const obracene = Math.random() < 0.5;
      kN = zKrok([k, 1], f, sN);
      kM = obracene ? zKrok([c, 1], W, -1) : zKrok(W, [c, 1], -1);
      if (kN.v[0] === 0 || kM.v[0] === 0) continue;
      R2 = zRed(kN.v[0] * kM.v[1], kN.v[1] * kM.v[0]);
      if (!vejdeSe(R2)) continue;
      jm = obracene ? `${c} − ${w} · ${u}/${v}` : `${w} · ${u}/${v} − ${c}`;
      break;
    }
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `${ZL} ${a} · (${zTxt(B)} − ${zTxt(D)}) + ${zTxt(F)} =`,
          ans: zAns(R1),
          sol: [
            `Pořadí: nejdřív závorka (zlomky převeď na nejmenšího společného jmenovatele), pak násobení a sčítání až nakonec.`,
            `Závorka: ${Z.t}`,
            `${a} · ${zZav(Z.v)} = ${zTxt([a * Z.v[0], Z.v[1]])}${gcd(Math.abs(a * Z.v[0]), Z.v[1]) > 1 ? ` = ${zTxt(P)}` : ''}`,
            zKrok(P, F, 1).t
          ] },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `${ZL} (${k}${sN > 0 ? ' + ' : ' − '}${zTxt(f)}) : (${jm}) =`,
          ans: zAns(R2),
          sol: [
            `Uvnitř závorky má násobení přednost před odčítáním. Každou závorku spočítej zvlášť (celé číslo převeď na zlomek se stejným jmenovatelem) a teprve pak je vyděl — dělit zlomkem znamená násobit převrácenou hodnotou.`,
            `Čitatel: ${kN.t}`,
            `${w} · ${u}/${v} = ${w * u}/${v}${gcd(w * u, v) > 1 ? ` = ${zTxt(W)}` : ''}`,
            `Jmenovatel: ${kM.t}`,
            zDeleni(kN.v, kM.v, R2)
          ] }
      ]
    };
  }

  function gen2e() {
    // 3 body — 2.1 ZÁPORNÁ DESETINNÁ ČÍSLA v závorkách (vzor: M9A/2026 ú. 2.1
    // „(−1,5 − 1) · (−1,5 + 1)"), 2.2 řetězec dělení zlomků s postupem
    // (vzor: M9B/2026 ú. 2.2 „1 : 6/5 − 1/6 : 5").
    // Půlky se drží v CELÝCH polovinách, aby desetinná čísla vycházela přesně.
    const pH = pick([1, 3, 5, 7]);                      // p = pH/2
    const q = ri(1, 3);
    const ans1 = pH * pH / 4 - q * q;                   // (−p − q)(−p + q) = p² − q²

    /* a/b v základním tvaru a různé od 1 („1 : 5/5" nezkouší nic); rozdíl se
       počítá na NEJMENŠÍHO společného jmenovatele, ne na součin. */
    let a, b, c, d, Kr;
    for (;;) {
      a = ri(2, 7); b = ri(3, 9); c = ri(2, 6); d = ri(2, 6);
      if (gcd(a, b) !== 1 || lcm(a, c * d) > 60) continue;
      Kr = zKrok([b, a], [1, c * d], -1);
      if (Kr.v[0] !== 0 && vejdeSe(Kr.v, 30)) break;
    }
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `Vypočítejte: (−${cz(pH / 2)} − ${q}) · (−${cz(pH / 2)} + ${q}) =`,
          ans: cz(ans1),
          /* Druhá závorka vyjde kladná, kdykoli q > p — a pak je výsledek
             ZÁPORNÝ. Dřív první krok vždy tvrdil „součin je KLADNÝ" a čísla
             se tiskla se spojovníkem bez závorky („-3,5 · -1,5"). */
          sol: [
            pH / 2 > q
              ? `Závorky se počítají první. Pozor na znaménka: obě závorky vyjdou záporné a mínus krát mínus dává plus, takže výsledek je KLADNÝ.`
              : `Závorky se počítají první. Pozor na znaménka: první závorka vyjde záporná, druhá kladná — a mínus krát plus dává mínus, takže výsledek je ZÁPORNÝ.`,
            `První závorka: −${cz(pH / 2)} − ${q} = ${zn(-(pH / 2) - q)}. Druhá: −${cz(pH / 2)} + ${q} = ${zn(-(pH / 2) + q)}.`,
            `Vynásob je: ${zn(-(pH / 2) - q)} · ${zav(-(pH / 2) + q)} = ${zn(ans1)}.`,
            `Zkouška vzorcem: je to (−${cz(pH / 2)})² − ${q}² = ${cz(pH * pH / 4)} − ${q * q} = ${zn(ans1)}.`
          ] },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `${ZL} 1 : ${a}/${b} − 1/${c} : ${d} =`,
          ans: zAns(Kr.v),
          sol: [
            `Dělení má přednost před odčítáním — spočítej proto oba podíly zvlášť a teprve pak je od sebe odečti na nejmenším společném jmenovateli.`,
            `Dělit zlomkem = násobit převrácenou hodnotou: 1 : ${a}/${b} = 1 · ${b}/${a} = ${b}/${a}`,
            `Dělit celým číslem = násobit jeho převrácenou hodnotou: 1/${c} : ${d} = 1/${c} · 1/${d} = 1/${c * d}`,
            Kr.t
          ] }
      ]
    };
  }

  function gen2f() {
    // 3 body — 2.1 „6/5 : 9/15 − 2" (M9B/2026 1. náhr. ú. 2.1), 2.2 „(18/14 · 7/6 − 1) : 6"
    // (M9B/2026 2. náhr. ú. 2.2): násobení s krácením křížem, jednička, dělení celým číslem.
    let B, D, k, Q, K1;
    for (;;) {
      B = zlomekN(2, 9); D = zlomekN(2, 9); k = ri(1, 3);
      // dělení sebou samým nic nezkouší; bez společného dělitele by nebylo co krátit
      if (B[0] * D[1] === D[0] * B[1] || gcd(B[0], D[0]) * gcd(B[1], D[1]) === 1) continue;
      Q = zRed(B[0] * D[1], B[1] * D[0]); K1 = zKrok(Q, [k, 1], -1);
      if (vejdeSe(K1.v)) break;
    }
    let p, q, r, s, t, P, K2, R2;
    for (;;) {
      [p, q] = zlomekN(2, 9); [r, s] = zlomekN(2, 9); t = ri(2, 6);
      if (gcd(p, s) === 1 && gcd(r, q) === 1) continue;             // krácení křížem
      P = zRed(p * r, q * s);
      if (P[0] === P[1]) continue;                                   // závorka by byla 0
      K2 = zKrok(P, [1, 1], -1); R2 = zRed(K2.v[0], K2.v[1] * t);
      if (vejdeSe(R2, 30)) break;
    }
    const hruby2 = [K2.v[0], K2.v[1] * t];
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `${ZL} ${zTxt(B)} : ${zTxt(D)} − ${k} =`,
          ans: zAns(K1.v),
          sol: [
            `Dělení má přednost před odčítáním. Dělit zlomkem znamená násobit jeho převrácenou hodnotou — a krátit se vyplatí ještě před násobením.`,
            zDeleni(B, D, Q),
            K1.t
          ] },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `${ZL} (${p}/${q} · ${r}/${s} − 1) : ${t} =`,
          ans: zAns(R2),
          sol: [
            `Nejdřív závorka a v ní násobení před odčítáním. Zlomky násob tak, že nejdřív zkrátíš křížem (čitatel jednoho s jmenovatelem druhého), čísla pak zůstanou malá.`,
            `${p}/${q} · ${r}/${s} = ${p * r}/${q * s}${gcd(p * r, q * s) > 1 ? ` = ${zTxt(P)}` : ''}`,
            K2.t,
            `${zTxt(K2.v)} : ${t} = ${zTxt(K2.v)} · 1/${t} = ${zTxt(hruby2)}${gcd(Math.abs(hruby2[0]), hruby2[1]) > 1 ? ` = ${zTxt(R2)}` : ''}`
          ] }
      ]
    };
  }

  function gen3c() {
    // 4 body — vzorec (x+a)², umocnění se zlomkem, dlouhá úprava s postupem
    const a = ri(3, 9);
    return {
      no: 3, points: 4, title: 'Algebraické výrazy',
      parts: [
        { key: '3.1', points: 1,
          prompt: `Ve výrazu (x + ${a})² = x² + ?·x + ${a}² napište číslo místo otazníku (koeficient u x).`,
          ans: String(2 * a),
          sol: [`Použij vzorec (x + a)² = x² + 2ax + a². Prostřední člen má vždy tvar 2ax a při umocňování se nejčastěji zapomene.`,`Zde je a = ${a}, takže koeficient u x je 2 · ${a} = ${2 * a}.`,`Celý výsledek: (x + ${a})² = x² + ${2 * a}x + ${a * a}.`] },
        { key: '3.2', points: 1, showExplain: true, ...hacek(pick(['a', 'n', 'x'])) },
        { key: '3.3', points: 2, showExplain: true, ...dlouhyVyraz(pick(['x', 'y', 'a'])) }
      ]
    };
  }

  /* ═══ POZICE 3 — úpravy výrazů podle ostrých zadání ═════════════════
     V M9A/2025 je to úloha 3, v ostatních letech úloha 4. Sken 2023–2025:
     VYTÝKÁNÍ po úpravě (M9A/2023, M9B/2023, M9B/2025), UMOCNĚNÍ dvojčlenu
     s koeficientem („(2/3 a − 3)²", „(4 + 8a − 8)²"), ROZKLAD VZORCEM až
     PO roznásobení („k·(k − 9) + 9·(k − 16)", „7·3 + 10·(a² + 10) −
     a·(a + 66)") a dlouhé ÚPRAVY BEZ ZÁVOREK s minusem před čtvercem.
     Pole pro odpověď bere jedno číslo, proto se úloha ptá na koeficient
     nebo na číslo místo otazníku — výpočet je ale celý, jako na ostrém
     testu. */
  function gen3d() {
    // 4 body — umocnění s koeficientem, vytýkání, rozdíl čtverců po úpravě
    // (vzor M9A/2023 ú. 4.1–4.2, M9C/2025 ú. 4.1, M9D/2025 ú. 4.2)
    const p = ri(2, 5), q = ri(1, 9);
    let A, B, C0;
    do { A = ri(2, 4); B = ri(2, 5); C0 = ri(1, 12); } while (A * B - C0 < 1);
    const zbyva = A * B - C0;
    const [t, u] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [2, 7], [3, 2], [4, 3]]);
    const m = t * t, n = u * u, s = t * u;
    return {
      no: 3, points: 4, title: 'Vzorce a vytýkání',
      parts: [
        { key: '3.1', points: 1,
          prompt: `Umocněte a výsledek zapište bez závorek: (${p}a − ${q})². Napište číslo, které stojí před a (i se znaménkem).`,
          ans: String(-2 * p * q),
          sol: [
            `Druhá mocnina rozdílu se roznásobuje vzorcem (A − B)² = A² − 2AB + B². Prostřední člen se nesmí vynechat a umocňuje se CELÉ ${p}a, takže A² = ${p * p}a², ne ${p}a².`,
            `Tady A = ${p}a a B = ${q}: prostřední člen je −2 · ${p}a · ${q}.`,
            `2 · ${p} · ${q} = ${2 * p * q}, takže (${p}a − ${q})² = ${p * p}a² − ${2 * p * q}a + ${q * q}; před a stojí −${2 * p * q}.`
          ] },
        { key: '3.2', points: 1, showExplain: true,
          prompt: `Upravte a rozložte na součin vytknutím: ${A}·(x² − ${B}x) + ${C0}x = x·(${A}x − ?). Napište číslo místo otazníku.`,
          ans: String(zbyva),
          sol: [
            `Nejdřív roznásob závorku a sečti členy se stejnou mocninou x; teprve potom vytkni x, které je ve všech členech výsledku.`,
            `${A}·(x² − ${B}x) = ${A}x² − ${A * B}x, takže celkem ${A}x² − ${A * B}x + ${C0}x = ${A}x²${clen(-zbyva, 'x')}.`,
            `Vytkni x: ${A}x²${clen(-zbyva, 'x')} = x·(${A}x − ${zbyva}); místo otazníku patří ${A * B} − ${C0} = ${zbyva}.`
          ] },
        { key: '3.3', points: 2, showExplain: true,
          prompt: `Upravte a rozložte na součin pomocí vzorce: k·(k − ${m}) + ${m}·(k − ${n}) = (k − ?)·(k + ?). Napište číslo místo otazníku.`,
          ans: String(s),
          sol: [
            `Nejdřív roznásob obě závorky a sečti — členy s k se vyruší a zbude rozdíl druhých mocnin, který rozloží vzorec a² − b² = (a − b)(a + b).`,
            `k·(k − ${m}) = k² − ${m}k a ${m}·(k − ${n}) = ${m}k − ${m * n}.`,
            `Součet: k² − ${m}k + ${m}k − ${m * n} = k² − ${m * n}.`,
            `${m * n} = ${s}², protože ${s} · ${s} = ${m * n}; tedy k² − ${m * n} = (k − ${s})·(k + ${s}).`
          ] }
      ]
    };
  }
  function gen3e() {
    // 4 body — dlouhé úpravy bez závorek, ptá se na jeden koeficient
    // (vzor M9B/2025 ú. 4.1 a 4.3, M9D/2025 ú. 4.1, M9C/2025 ú. 4.2)
    let a, b, c;
    do { a = ri(1, 6); b = ri(1, 6); c = ri(2, 3); } while (2 * a - b * c === 0);
    const P = ri(2, 4), R = ri(2, 3), W = ri(2, 4), S = ri(2, 6);
    let p, q, r, s, t;
    do { p = ri(2, 8); q = ri(1, 5); r = ri(2, 3); s = ri(2, 3); t = ri(1, 6); } while (p * q + r - r * s * t === 0);
    const k1 = 2 * a - b * c, k3 = p * q + r - r * s * t;
    return {
      no: 3, points: 4, title: 'Úpravy výrazů',
      parts: [
        { key: '3.1', points: 1,
          prompt: `Upravte na co nejjednodušší tvar bez závorek a napište koeficient u y: (y + ${a})² + (y − ${b})·${c}y`,
          ans: String(k1),
          sol: [
            `Závorku umocni podle vzorce (A + B)² = A² + 2AB + B² a druhý součin roznásob člen po členu; pak sečti členy se stejnou mocninou y.`,
            `(y + ${a})² = y² + ${2 * a}y + ${a * a} a (y − ${b})·${c}y = ${c}y² − ${b * c}y.`,
            `Dohromady ${mnoho([[1 + c, 'y²'], [k1, 'y'], [a * a, '']])}; koeficient u y je ${2 * a} − ${b * c} = ${zn(k1)}.`
          ] },
        { key: '3.2', points: 1, showExplain: true,
          prompt: `Upravte na co nejjednodušší tvar bez závorek a napište absolutní člen (číslo bez x): x·${P}x − ${R}x·${W} − (x − ${S})²`,
          ans: String(-S * S),
          sol: [
            `Minus před závorkou (x − ${S})² platí pro CELÝ výsledek umocnění — nejdřív tedy umocni a teprve pak otoč znaménka všech tří členů.`,
            `(x − ${S})² = x² − ${2 * S}x + ${S * S}, takže −(x − ${S})² = −x² + ${2 * S}x − ${S * S}.`,
            `Dohromady ${P}x² − ${R * W}x − x² + ${2 * S}x − ${S * S} = ${mnoho([[P - 1, 'x²'], [2 * S - R * W, 'x'], [-S * S, '']])}; absolutní člen je −${S * S}.`
          ] },
        { key: '3.3', points: 2, showExplain: true,
          prompt: `Upravte na co nejjednodušší tvar bez závorek a napište koeficient u a: ${p}a·(a + ${q}) + ${r}·(1 − ${s}a)·(a + ${t})`,
          ans: String(k3),
          sol: [
            `U součinu tří činitelů roznásob nejdřív obě závorky mezi sebou a teprve výsledek číslem před nimi; pak sečti členy se stejnou mocninou a.`,
            `${p}a·(a + ${q}) = ${p}a² + ${p * q}a.`,
            `(1 − ${s}a)·(a + ${t}) = a + ${t} − ${s}a² − ${s * t}a, vynásobeno ${r}: ${r}a + ${r * t} − ${r * s}a² − ${r * s * t}a.`,
            `Členy s a: ${p * q} + ${r} − ${r * s * t} = ${zn(k3)}, výsledek je ${mnoho([[p - r * s, 'a²'], [k3, 'a'], [r * t, '']])}.`
          ] }
      ]
    };
  }
  function gen3f() {
    // 4 body — rozdíl čtverců, umocnění s činitelem, rozklad (A − B)² po úpravě
    // (vzor nanečisto 2025 ú. 4.1–4.3)
    const k = ri(2, 9);
    let p, q, r, s, u;
    do { p = ri(2, 6); q = ri(2, 9); r = ri(2, 4); s = ri(2, 5); u = ri(1, 5); } while (q * r - 2 * s * u === 0);
    const k2 = q * r - 2 * s * u;
    // K + m·(a² + m) − a·(a + w) = (P·a − Q)² ⇒ m = P² + 1, w = 2PQ, K = Q² − m²
    const P = ri(2, 3), m = P * P + 1;
    let Q;
    do { Q = ri(m + 1, m + 4); } while (gcd(P, Q) !== 1);
    const w = 2 * P * Q, K = Q * Q - m * m;
    // Jako na ostrém testu („7 · 3 + 10·(a² + 10) …") se K zapíše součinem, jde-li to.
    const del = [2, 3, 4, 5, 6, 7, 8].filter(d => K % d === 0 && K / d >= d && K / d <= 12);
    const Kd = del.length ? pick(del) : 0;
    const Kz = Kd ? `${Kd} · ${K / Kd}` : String(K);
    return {
      no: 3, points: 4, title: 'Rozklad podle vzorce',
      parts: [
        { key: '3.1', points: 1,
          prompt: `Zjednodušte (výsledek bez závorek) a napište koeficient u y²: x² − (x − ${k}y)·(x + ${k}y)`,
          ans: String(k * k),
          sol: [
            `Součin (A − B)·(A + B) je podle vzorce rozdíl druhých mocnin A² − B² — nemusíš roznásobovat člen po členu, jen nezapomeň na minus před součinem.`,
            `(x − ${k}y)·(x + ${k}y) = x² − (${k}y)² = x² − ${k * k}y².`,
            `x² − (x² − ${k * k}y²) = x² − x² + ${k * k}y² = ${k * k}y²; koeficient u y² je ${k * k}.`
          ] },
        { key: '3.2', points: 1, showExplain: true,
          prompt: `Upravte na co nejjednodušší tvar bez závorek a napište koeficient u n: (${p}n − ${q})·(−${r}n) + (${s}n − ${u})²`,
          ans: String(k2),
          sol: [
            `První součin roznásob člen po členu (pozor, činitel −${r}n je záporný), druhou závorku umocni vzorcem (A − B)² = A² − 2AB + B². Pak sečti členy se stejnou mocninou n.`,
            `(${p}n − ${q})·(−${r}n) = −${p * r}n² + ${q * r}n a (${s}n − ${u})² = ${s * s}n² − ${2 * s * u}n + ${u * u}.`,
            `Členy s n: ${q * r} − ${2 * s * u} = ${zn(k2)}, výsledek je ${mnoho([[s * s - p * r, 'n²'], [k2, 'n'], [u * u, '']])}.`
          ] },
        { key: '3.3', points: 2, showExplain: true,
          prompt: `Zjednodušte a rozložte na součin podle vzorce: ${Kz} + ${m}·(a² + ${m}) − a·(a + ${w}) = (${P}a − ?)². Napište číslo místo otazníku.`,
          ans: String(Q),
          sol: [
            `Roznásob a sečti — mají vyjít tři členy odpovídající vzorci (A − B)² = A² − 2AB + B². Z členu s a² poznáš A, z čísla bez a poznáš B.`,
            `${Kd ? `${Kz} = ${K}, ` : ''}${m}·(a² + ${m}) = ${m}a² + ${m * m} a a·(a + ${w}) = a² + ${w}a.`,
            `Dohromady ${K} + ${m}a² + ${m * m} − a² − ${w}a = ${P * P}a² − ${w}a + ${Q * Q}.`,
            `${P * P}a² = (${P}a)², ${Q * Q} = ${Q}² a prostřední člen sedí: 2 · ${P} · ${Q} = ${w}. Výraz je (${P}a − ${Q})², místo otazníku patří ${Q}.`
          ] }
      ]
    };
  }

  function gen7c() {
    // 3 body — úhly v rovnoramenném trojúhelníku (bez SVG, plně z textu)
    const beta = ri(30, 75), alpha = 180 - 2 * beta, vnejsi = 180 - beta, soucet = 2 * beta;
    return {
      no: 7, points: 3, title: 'Úhly v rovnoramenném trojúhelníku', okruh: 'geometrie',
      intro: `Rovnoramenný trojúhelník má oba úhly při základně stejné, každý ${beta}°.`,
      parts: [
        { key: '7.1', points: 1, prompt: `Vypočítejte velikost úhlu při hlavním vrcholu (proti základně).`, ans: String(alpha),
          sol: [`Trojúhelník je rovnoramenný, takže oba úhly při základně jsou stejné — každý ${beta}°.`,`Součet všech tří je 180°, tedy úhel u vrcholu = 180 − ${beta} − ${beta} = 180 − ${2 * beta}.`,`Úhel u vrcholu = ${alpha}°.`] },
        { key: '7.2', points: 1, prompt: `Vypočítejte velikost vnějšího úhlu u jednoho z úhlů při základně.`, ans: String(vnejsi),
          sol: [`Vnější úhel doplňuje vnitřní úhel u téhož vrcholu do přímého úhlu, tedy do 180°.`,
            `Vnitřní úhel při základně má ${beta}°.`,
            `Vnější úhel = 180 − ${beta} = ${vnejsi}°.`] },
        { key: '7.3', points: 1, prompt: `Jaký je součet obou úhlů při základně?`, ans: String(soucet),
          sol: [`U rovnoramenného trojúhelníku jsou oba úhly při základně shodné, takže stačí jeden zdvojnásobit.`,
            `Každý z nich má ${beta}°.`,
            `Součet = 2 · ${beta} = ${soucet}°.`] }
      ]
    };
  }

  function gen10c() {
    // 2 body — měřítko modelu (převod na skutečnost)
    const k = [100, 200, 500, 1000][ri(0, 3)], modelCm = ri(2, 9), realCm = modelCm * k, realM = realCm / 100;
    return {
      no: 10, points: 2, title: 'Měřítko modelu',
      parts: [
        { key: '10', points: 2,
          prompt: `Model budovy je v měřítku 1 : ${k}. Na modelu měří budova ${modelCm} cm. Jak vysoká je skutečná budova (v metrech)?`,
          ans: String(realM),
          sol: [`Měřítko 1 : ${k} znamená, že 1 cm na modelu odpovídá ${k} cm ve skutečnosti — skutečnost je ${k}× větší.`,`Skutečná výška v centimetrech: ${modelCm} · ${k} = ${realCm} cm.`,`Otázka je na metry, tedy ${realCm} : 100 = ${realM} m.`] }
      ]
    };
  }

  function gen11c() {
    // 3 body — kvádr: objem, povrch a počet stěn, hran, vrcholů
    const a = ri(2, 5), b = ri(2, 5), c = ri(2, 5), V = a * b * c, S = 2 * (a * b + b * c + a * c);
    const p1 = ri(0, 1) === 1, vTvr = p1 ? V : S;                                     // chyba: záměna objemu a povrchu
    const p2 = ri(0, 1) === 1, sTvr = p2 ? S : S / 2;                                 // chyba: každá stěna jen jednou
    const PRVKY = [['stěn', 6], ['hran', 12], ['vrcholů', 8]], [jm, pocet] = pick(PRVKY);
    const p3 = ri(0, 1) === 1, nTvr = p3 ? pocet : pick(PRVKY.filter(x => x[0] !== jm))[1];  // chyba: záměna prvků
    return {
      no: 11, points: 3, title: 'Tělesa', kind: 'tfgrid', okruh: 'telesa',
      intro: `Kvádr má hrany délek ${a} cm, ${b} cm a ${c} cm. Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [
        tvrzeni(`Objem kvádru je ${vTvr} cm³.`, p1,
          [`Objem kvádru (kolik se do něj vejde) je součin délek jeho tří hran. Nezaměň ho s povrchem, který sčítá obsahy stěn.`,
            `Objem: ${a} · ${b} · ${c} = ${V} cm³.`,
            `Tvrzení uvádí ${vTvr} cm³. ${verdikt(p1)}`]),
        tvrzeni(`Povrch kvádru je ${sTvr} cm².`, p2,
          [`Povrch je součet obsahů šesti stěn. Stěny tvoří tři dvojice shodných protilehlých obdélníků, proto S = 2 · (a · b + b · c + a · c).`,
            `Tři různé stěny: ${a} · ${b} = ${a * b}, ${b} · ${c} = ${b * c}, ${a} · ${c} = ${a * c} cm².`,
            `Povrch: 2 · (${a * b} + ${b * c} + ${a * c}) = ${S} cm². ${verdikt(p2)}`]),
        tvrzeni(`Každý kvádr má ${nTvr} ${jm}.`, p3,
          [`Stěny, hrany a vrcholy spočítáš z tvaru kvádru: stěny tvoří tři dvojice protilehlých obdélníků, hrany jsou po čtyřech od každého rozměru a vrcholy leží po čtyřech v dolní a horní podstavě.`,
            `Stěn: 3 · 2 = 6, hran: 3 · 4 = 12, vrcholů: 4 + 4 = 8.`,
            `Kvádr má ${pocet} ${jm}, tvrzení uvádí ${nTvr}. ${verdikt(p3)}`])
      ]
    };
  }

  function gen6c() {
    // 2 body — nádrže (dělení, čas napouštění; bez π)
    /* Konev: v polovině případů dělení NEVYJDE a počet konví se zaokrouhluje
       NAHORU — poslední konev nemusí být plná, ale přinést se musí (pravidlo
       o diskrétních jednotkách v CLAUDE.md). Právě tohle je ta dovednost. */
    const konev = ri(3, 8), cele = ri(4, 12), zbytek = pick([0, ri(1, konev - 1)]), sud = konev * cele + zbytek;
    const pocet = Math.ceil(sud / konev);
    const rate = ri(2, 9), min = ri(3, 12), V = rate * min;
    return {
      no: 6, points: 2, title: 'Nádrže', okruh: 'slovni',
      parts: [
        { key: '6.1', points: 1,
          prompt: `Sud pojme ${sud} litrů. Konev má objem ${konev} ${skl(konev, 'litr', 'litry', 'litrů')}. Kolik konví vody je potřeba přinést, aby byl sud plný?`,
          ans: String(pocet),
          sol: [`Ptáme se, kolikrát se konev vejde do sudu — to je dělení. Když nevyjde beze zbytku, zaokrouhluje se NAHORU: poslední konev nemusí být plná, ale přinést se musí.`,
            /* „31 : 4 = 7, zbytek 3" by nezávislý dopočet rovností četl jako
               nepravdivou rovnost 31 : 4 = 7 — zbytek se proto píše násobením. */
            zbytek ? `Do ${cele} plných konví se vejde ${cele} · ${konev} = ${cele * konev} l, do plného sudu chybí ještě ${sud} − ${cele * konev} = ${zbytek} l.` : `${sud} : ${konev} = ${cele}, beze zbytku.`,
            zbytek ? `Potřeba je ${cele} + 1 = ${pocet} ${skl(pocet, 'konev', 'konve', 'konví')}.` : `Potřeba je přesně ${pocet} ${skl(pocet, 'konev', 'konve', 'konví')}.`] },
        { key: '6.2', points: 1,
          prompt: `Nádrž o objemu ${V} litrů se napouští rychlostí ${rate} ${skl(rate, 'litr', 'litry', 'litrů')} za minutu. Za kolik minut bude plná?`,
          ans: String(min),
          sol: [`Rychlost napouštění říká, kolik litrů přiteče za jednu minutu. Čas je tedy objem nádrže vydělený litry za minutu.`,
            `Nádrž má ${V} l a za minutu přiteče ${rate} l.`,
            `Čas = ${V} : ${rate} = ${min} ${skl(min, 'minuta', 'minuty', 'minut')}.`] }
      ]
    };
  }

  function gen8c() {
    // 4 body — oplocení obdélníkové zahrady (obvod, cena, sloupky)
    // Obdélník, ne čtverec: „obdélníková zahrada 8 m × 8 m" by žák četl jako překlep.
    const a = ri(5, 15);
    let b; do { b = ri(5, 15); } while (b === a);
    const obvod = 2 * (a + b);
    const cena = ri(50, 150), celkem = obvod * cena;
    const cand = [2, 3, 4, 5].filter(x => obvod % x === 0), d = cand[ri(0, cand.length - 1)], sloupky = obvod / d;
    return {
      no: 8, points: 4, title: 'Oplocení zahrady', okruh: 'geometrie',
      intro: `Obdélníková zahrada má rozměry ${a} m × ${b} m a chceme ji celou oplotit.`,
      parts: [
        { key: '8.1', points: 2, prompt: `Kolik metrů plotu je potřeba (obvod zahrady)?`, ans: String(obvod),
          sol: [`Obvod obdélníku je dvojnásobek součtu dvou sousedních stran.`,`Součet sousedních stran: ${a} + ${b} = ${a + b} m.`,`Obvod = 2 · ${a + b} = ${obvod} m.`] },
        { key: '8.2', points: 1, prompt: `Metr plotu stojí ${cena} Kč. Kolik Kč stojí celý plot?`, ans: String(celkem),
          sol: [`Cena se počítá za každý metr plotu, takže se délka plotu (obvod zahrady) násobí cenou za jeden metr.`,
            `Plot měří 2 · (${a} + ${b}) = ${obvod} m.`,
            `Celkem = ${obvod} · ${cena} = ${celkem} Kč.`] },
        { key: '8.3', points: 1, prompt: `Sloupky jsou rozmístěny po ${d} metrech. Kolik sloupků je po celém obvodu?`, ans: String(sloupky),
          sol: [`Plot je uzavřený, takže sloupků je stejně jako mezer mezi nimi — na rozdíl od rovné řady, kde je sloupků o jeden víc než mezer.`,
            `Obvod je 2 · (${a} + ${b}) = ${obvod} m, mezera ${d} m.`,
            `Počet sloupků = ${obvod} : ${d} = ${sloupky}.`] }
      ]
    };
  }

  function gen16c() {
    // 4 body — chodník kolem bazénu (vnější rozměry + obsah chodníku)
    const w = ri(1, 3), a = ri(5, 10), b = ri(3, a - 1);
    const oa = a + 2 * w, ob = b + 2 * w, chodnik = oa * ob - a * b;
    return {
      no: 16, points: 4, title: 'Chodník kolem bazénu',
      intro: `Obdélníkový bazén ${a} m × ${b} m je ze všech stran obklopen chodníkem širokým ${w} m.`,
      parts: [
        { key: '16.1', points: 2, prompt: `Jaká je celková délka obrazce (bazén i s chodníkem) podél delší strany bazénu (v m)?`, ans: String(oa),
          sol: [`Chodník obepíná bazén dokola, takže každý rozměr prodlouží na OBOU koncích o šířku chodníku ${w} m.`,`Delší strana bazénu měří ${a} m.`,`Vnější rozměr = ${a} + 2 · ${w} = ${oa} m.`] },
        { key: '16.2', points: 1, prompt: `Jaká je celková šířka obrazce (bazén i s chodníkem, v m)?`, ans: String(ob),
          sol: [`Chodník obepíná bazén ze všech stran, takže se i druhý rozměr prodlouží na obou koncích o šířku chodníku ${w} m.`,`Kratší strana bazénu měří ${b} m.`,`Vnější rozměr = ${b} + 2 · ${w} = ${ob} m.`] },
        { key: '16.3', points: 1, prompt: `Jaký obsah má samotný chodník (v m²)?`, ans: String(chodnik),
          sol: [`Chodník je to, co zbyde z velkého obdélníku (bazén i s chodníkem), když z něj vyjmeš bazén — jeho obsah je rozdíl dvou obsahů.`,
            `Celek: ${oa} · ${ob} = ${oa * ob} m². Bazén: ${a} · ${b} = ${a * b} m².`,
            `Chodník = ${oa * ob} − ${a * b} = ${chodnik} m².`] }
      ]
    };
  }

  function gen15c() {
    // 6 bodů — přiřazování, 3× hledání ZÁKLADU z procenta (p % čísla je X → číslo)
    function task(used) {
      let p, celek, cast;
      do { p = [10, 20, 25, 50][ri(0, 3)]; celek = [100, 200, 300, 400][ri(0, 3)]; cast = p * celek / 100; }
      while (used.has(celek));
      used.add(celek); return { p, celek, cast };
    }
    const used = new Set();
    const t1 = task(used), t2 = task(used), t3 = task(used);
    const answers = [t1.celek, t2.celek, t3.celek];
    const set = new Set(answers);
    while (set.size < 6) { set.add([100, 200, 300, 400, 500, 600, 150, 250][ri(0, 7)]); }
    const optsArr = [...set].sort((a, b) => a - b);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const labels = optsArr.map((v, i) => `${letters[i]}) ${v}`);
    const ansLetters = answers.map(v => letters[optsArr.indexOf(v)]);
    return {
      no: 15, points: 6, title: 'Procenta — základ', kind: 'match',
      prompts: [
        `${t1.p} % nějakého čísla je ${t1.cast}. Jaké je to číslo?`,
        `${t2.p} % nějakého čísla je ${t2.cast}. Jaké je to číslo?`,
        `${t3.p} % nějakého čísla je ${t3.cast}. Jaké je to číslo?`
      ],
      options: labels,
      ans: ansLetters,
      // Samostatný postup ke každé otázce (dřív měly druhá a třetí jen „Celek = …").
      sol: [t1, t2, t3].map(t => [
        `Známe část a víme, kolik procent celku tvoří. Celek je 100 %, takže nejdřív zjisti, kolik je jedno procento, a pak ho vynásob stem.`,
        `1 % = ${t.cast} : ${t.p} = ${t.cast / t.p}.`,
        `100 % = ${t.cast / t.p} · 100 = ${t.celek}.`
      ])
    };
  }

  function gen5c() {
    // 4 body — obdélníková místnost: obsah podlahy + nezakrytá plocha (bez SVG)
    const L = ri(4, 9), W = ri(3, 8), area = L * W;
    const a = ri(2, L - 1), b = ri(2, W - 1), koberec = a * b, volna = area - koberec;
    return {
      no: 5, points: 4, title: 'Místnost', okruh: 'geometrie',
      intro: `Obdélníková místnost má rozměry ${L} m × ${W} m.`,
      parts: [
        { key: '5.1', points: 2, prompt: `Jaký obsah má podlaha místnosti (v m²)?`, ans: String(area),
          sol: [`Obsah obdélníku je součin dvou sousedních stran (pozor, ne jejich součet — to je obvod).`,`Sousední strany místnosti měří ${L} m a ${W} m.`,`Obsah = ${L} · ${W} = ${area} m².`] },
        { key: '5.2', points: 2, prompt: `Na podlahu položíme obdélníkový koberec ${a} m × ${b} m. Kolik m² podlahy zůstane nezakryto?`, ans: String(volna),
          sol: [`Nezakrytá část je to, co zbyde z podlahy po odečtení koberce — obsah podlahy minus obsah koberce, obojí jako obsah obdélníku.`,
            `Podlaha: ${L} · ${W} = ${area} m². Koberec: ${a} · ${b} = ${koberec} m².`,
            `Nezakryto: ${area} − ${koberec} = ${volna} m².`] }
      ]
    };
  }

  function gen9c() {
    // 4 body — Pythagoras: výška draka (přepona + odvěsna → druhá odvěsna)
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]];
    const t = triples[ri(0, triples.length - 1)], a = t[0], b = t[1], c = t[2];
    return {
      no: 9, points: 4, title: 'Drak na provázku',
      svg: svgTriangle('pravo', { v: ['C', 'A', 'B'] }),
      intro: `Drak drží na napnutém provázku dlouhém ${c} m. Drak je přímo nad místem vzdáleným ${a} m od toho, kdo ho pouští (ruku ber u země).`,
      parts: [
        { key: '9.1', points: 4, showExplain: true,
          prompt: `V jaké výšce nad zemí drak letí (v m)? Uveďte celý postup.`,
          ans: String(b),
          sol: [`Napnutý provázek, vodorovná vzdálenost a výška draka tvoří pravoúhlý trojúhelník; provázek leží proti pravému úhlu, je to přepona. Hledaná výška je odvěsna, takže se v Pythagorově větě ODEČÍTÁ: v² = c² − a².`,
            `Přepona ${c} m, známá odvěsna ${a} m: v² = ${c * c} − ${a * a} = ${c * c - a * a}.`,
            `v = √${c * c - a * a} = ${b} m.`] }
      ]
    };
  }

  function gen13d() {
    // 2 body — kolik procent ušetříš
    const puv = ri(2, 9) * 100, p = pick([10, 20, 25, 50]), usKc = puv * p / 100, nova = puv - usKc;
    // chyby: kolik procent zaplatíš, úspora vztažená k nové ceně
    const sh = volbyMC(p, [100 - p, 100 * usKc / nova].filter(Number.isInteger), 5, 'jiná hodnota', x => `${x} %`);
    return {
      no: 13, points: 2, title: 'Úspora v procentech', kind: 'mc', okruh: 'procenta',
      intro: `Zboží stálo ${puv} Kč, teď ho koupíš za ${nova} Kč.`,
      prompt: `Kolik procent z původní ceny ušetříš?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Úspora v procentech je část PŮVODNÍ ceny, kterou nezaplatíš. Pozor na záměnu s tím, kolik procent zaplatíš — to je doplněk do 100 %.`,
        `Úspora: ${puv} − ${nova} = ${usKc} Kč.`,
        `${usKc} : ${puv} = ${cz(p / 100)}, tedy ${p} %${odpovedMC(sh)}`]
    };
  }

  function gen14d() {
    // 2 body — modus
    const vals = []; while (vals.length < 5) { const v = ri(2, 12); if (!vals.includes(v)) vals.push(v); }
    const m = vals[0], arr = [m, m, m, vals[1], vals[2], vals[3], vals[4]];
    for (let i = arr.length - 1; i > 0; i--) { const j = ri(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    const serazeno = [...arr].sort((x, y) => x - y);
    // chyby: počet výskytů místo hodnoty, medián, největší hodnota
    const sh = volbyMC(m, [3, serazeno[3], serazeno[6]], 1, null);
    return {
      no: 14, points: 2, title: 'Modus', kind: 'mc', okruh: 'data',
      prompt: `Určete modus (nejčastější hodnotu) těchto čísel: ${arr.join(', ')}.`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Modus je hodnota, která se v souboru objevuje nejčastěji — nepočítá se, jen se hledá. Odpovědí je ta HODNOTA, ne to, kolikrát se opakuje.`,
        `Číslo ${m} se vyskytuje třikrát, ostatní jen jednou.`,
        `Modus je ${m}${odpovedMC(sh)}`]
    };
  }

  /* ── Válec ve válci (skleněné těžítko) ── */
  // Vnější válec z čirého skla, uvnitř menší válec z modrého. Popisky VEDLE obrazce,
  // aby se nekřížily s tělesem (stejný důvod jako u svgSud).
  function svgTezitko(R, H, r, h) {
    // topY=36 (dřív 30): popisek „čiré: r=… v=…" je 15 znaků, tedy ~117 px,
    // takže od x=6 dosáhne k x=123 a při topY=30 ležel PŘES horní podstavu
    // (elipsa začíná na x=67). Teď je nad ní a komentář výš konečně platí.
    const cx = 125, topY = 36, botY = 132, rxOut = 58, ryOut = 15;
    const rxIn = Math.round(rxOut * r / R), ryIn = Math.round(ryOut * r / R);
    const inTop = botY - Math.round((botY - topY) * h / H);
    return `<svg viewBox="0 0 250 176">`
      + `<path d="M ${cx - rxOut} ${topY} L ${cx - rxOut} ${botY} A ${rxOut} ${ryOut} 0 0 0 ${cx + rxOut} ${botY} L ${cx + rxOut} ${topY}" fill="#12233a" stroke="#19e6e6" stroke-width="2.5"/>`
      + `<ellipse cx="${cx}" cy="${botY}" rx="${rxOut}" ry="${ryOut}" fill="none" stroke="#19e6e6" stroke-width="2" stroke-dasharray="5 4"/>`
      + `<path d="M ${cx - rxIn} ${inTop} L ${cx - rxIn} ${botY} A ${rxIn} ${ryIn} 0 0 0 ${cx + rxIn} ${botY} L ${cx + rxIn} ${inTop} A ${rxIn} ${ryIn} 0 0 1 ${cx - rxIn} ${inTop} Z" fill="#1a5a80" stroke="#4cc9f0" stroke-width="2"/>`
      + `<ellipse cx="${cx}" cy="${inTop}" rx="${rxIn}" ry="${ryIn}" fill="#2a7aa8" stroke="#4cc9f0" stroke-width="2"/>`
      + `<ellipse cx="${cx}" cy="${topY}" rx="${rxOut}" ry="${ryOut}" fill="#1b2742" stroke="#19e6e6" stroke-width="2.5"/>`
      + `<text x="6" y="13" fill="#19e6e6" font-size="13" font-family="monospace">čiré: r=${R} v=${H}</text>`
      + `<text x="6" y="170" fill="#4cc9f0" font-size="13" font-family="monospace">modré: r=${r} v=${h}</text>`
      + `</svg>`;
  }

  /* ── Sloupcový graf (CERMAT ho má v 8 z 15 zadání) ── */
  // Jeden sloupec smí být neznámý ("?"). Hodnoty jsou NAD sloupci, popisky pod nimi.
  // 🔴 Popisek se VEJDE jen tehdy, když se mu přizpůsobí písmo. Při pevných 11 px
  // měly měsíce („červenec" = 8 znaků ≈ 53 px) rozteč sloupce jen 41 px, takže se
  // sousední názvy PŘEKRÝVALY a četlo se „červenčervenec". Zkrátit je nejde —
  // zadání se na ně odkazuje jménem („o kolik více než v srpnu").
  function svgSloupce(popisky, hodnoty, idxNeznamy) {
    const W = 250, baseY = 130, maxH = 86, x0 = 30;
    const sirka = Math.floor((W - x0 - 14) / popisky.length) - 12;
    const roztec = sirka + 12;
    const nejdelsi = Math.max(...popisky.map(p => String(p).length), 1);
    // monospace má šířku znaku ≈ 0,6 em; 3 px rezerva mezi sousedy
    const fsP = Math.max(8, Math.min(11, (roztec - 3) / (0.6 * nejdelsi)));
    const max = Math.max(...hodnoty.map((v, i) => i === idxNeznamy ? 0 : v)) || 1;
    let s = `<svg viewBox="0 0 ${W} 160">`
      + `<line x1="${x0 - 8}" y1="${baseY}" x2="${W - 6}" y2="${baseY}" stroke="#19e6e6" stroke-width="2"/>`
      + `<line x1="${x0 - 8}" y1="18" x2="${x0 - 8}" y2="${baseY}" stroke="#19e6e6" stroke-width="2"/>`;
    popisky.forEach((p, i) => {
      const x = x0 + i * (sirka + 12);
      const nezn = i === idxNeznamy;
      const v = nezn ? Math.round(max * 0.55) : hodnoty[i];
      const h = Math.max(6, Math.round(maxH * v / max));
      s += `<rect x="${x}" y="${baseY - h}" width="${sirka}" height="${h}" fill="${nezn ? '#3a2a52' : '#1b6f8f'}" stroke="${nezn ? '#ff3d7f' : '#19e6e6'}" stroke-width="2"${nezn ? ' stroke-dasharray="5 4"' : ''}/>`
        + `<text x="${x + sirka / 2}" y="${baseY - h - 5}" fill="${nezn ? '#ff3d7f' : '#39ff9e'}" font-size="13" font-family="monospace" text-anchor="middle">${nezn ? '?' : hodnoty[i]}</text>`
        + `<text x="${x + sirka / 2}" y="${baseY + 16}" fill="#cfe8ff" font-size="${fsP.toFixed(1)}" font-family="monospace" text-anchor="middle">${p}</text>`;
    });
    return s + `</svg>`;
  }

  function gen6d() {
    // 2 body — skleněné těžítko: válec ve válci (věrné M9A/2026, úloha 2)
    // R je násobek 10 a h sudé ⇒ oba objemy vyjdou celé, žádné plovoucí zbytky.
    const R = ri(1, 2) * 10, r = R / 2;
    const H = ri(5, 8) * 2, h = ri(2, (H / 2) - 1) * 2;
    const Vcelk = 3.14 * R * R * H, Vmodre = 3.14 * r * r * h, Vcire = Vcelk - Vmodre;
    const des = x => Math.round(x / 10) * 10;
    return {
      no: 6, points: 2, title: 'Těžítko', okruh: 'telesa',
      svg: svgTezitko(R, H, r, h),
      intro: `Skleněné těžítko má tvar rotačního válce s poloměrem podstavy ${R} cm a výškou ${H} cm. Vnější část těžítka je z čirého skla, uvnitř je část z modrého skla, která má také tvar rotačního válce, a to s poloměrem podstavy ${r} cm a výškou ${h} cm. Pro výpočet použijte π ≐ 3,14.`,
      parts: [
        { key: '6.1', points: 1,
          prompt: `Vypočítejte v cm³ objem celého těžítka. Výsledek zaokrouhlete na desítky cm³.`,
          ans: String(des(Vcelk)),
          sol: [`Objem válce je obsah podstavy krát výška: V = π · r² · v. Podstava je kruh, takže nejdřív spočítej jeho obsah.`,
            `Obsah podstavy: 3,14 · ${R}² = 3,14 · ${R * R} = ${cz(3.14 * R * R)} cm².`,
            `Objem = ${cz(3.14 * R * R)} · ${H} = ${cz(Vcelk)} cm³${des(Vcelk) === Vcelk ? '.' : `, po zaokrouhlení na desítky ${des(Vcelk)} cm³.`}`] },
        { key: '6.2', points: 1,
          prompt: `Vypočítejte v cm³ objem čirého skla v těžítku. Výsledek zaokrouhlete na desítky cm³.`,
          ans: String(des(Vcire)),
          sol: [`Čiré sklo je to, co ZBYDE, když z celého těžítka odebereš modrý válec — počítá se rozdílem, ne zvlášť.`,
            `Objem modré části: 3,14 · ${r}² · ${h} = ${cz(3.14 * r * r)} · ${h} = ${cz(Vmodre)} cm³.`,
            `Objem čirého skla = ${cz(Vcelk)} − ${cz(Vmodre)} = ${cz(Vcire)} cm³.`,
            ...(des(Vcire) === Vcire ? [] : [`Po zaokrouhlení na desítky: ${des(Vcire)} cm³.`])] }
      ]
    };
  }

  function gen12e() {
    // 2 body — povrch válce z poměru pláště a podstavy (věrné M9A/2023, úloha 13)
    /* Poloměr je násobek 10 a podstava se počítá v celých (314 · r · r : 100),
       aby povrch vyšel celý: 3,14 · 15² = 706,5 dávalo „= 3533", tedy useknuté
       cifry s rovnítkem. */
    const r = pick([10, 20]), k = ri(2, 4), Sp = 314 * r * r / 100, povrch = (k + 2) * Sp;
    // chyby: jen plášť, plášť a JEDNA podstava, plášť bez obou podstav krát dvě
    const sh = volbyMC(povrch, [(k + 1) * Sp, k * Sp, 2 * k * Sp], Sp, 'jiný povrch', v => `${tis(v)} cm²`);
    return {
      no: 12, points: 2, title: 'Povrch válce', kind: 'mc', okruh: 'telesa',
      svg: svgCylinder(r, cz(k * r / 2)),
      intro: `Obsah pláště rotačního válce je ${k}krát větší než obsah jedné podstavy tohoto válce. Poloměr podstavy válce je ${r} cm.`,
      prompt: `Jaký je povrch válce? Pro výpočet použijte π ≐ 3,14.`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Povrch válce je plášť PLUS DVĚ podstavy. Plášť je ${k}krát větší než jedna podstava, takže celý povrch je ${k} + 2 = ${k + 2} ${skl(k + 2, 'podstava', 'podstavy', 'podstav')} — výšku válce vůbec nepotřebuješ.`,
        `Jedna podstava: 3,14 · ${r} · ${r} = ${tis(Sp)} cm².`,
        `Povrch: ${k + 2} · ${tis(Sp)} = ${tis(povrch)} cm²${odpovedMC(sh)}`]
    };
  }

  function gen14e() {
    // 2 body — MC A-E, čtení ze sloupcového grafu s chybějícím údajem
    // (věrné M9A/2023, úloha 7 — jeden sloupec neznámý, znám celkový počet)
    const jm = pick([['hudební', 'šachový', 'robotický'], ['fotbal', 'florbal', 'basket'], ['pěvecký', 'výtvarný', 'taneční']]);
    const a = ri(4, 12) * 2, b = ri(3, 10) * 2, chybi = ri(3, 11) * 2;
    const celkem = a + b + chybi, idx = ri(0, 2);
    const hod = [a, b, chybi]; const tmp = hod[idx]; hod[idx] = hod[2]; hod[2] = tmp;
    const neznamy = idx, hledana = hod[neznamy];
    const zn = hod.filter((_, i) => i !== neznamy);
    // chyby: odečten jen jeden známý sloupec (dvakrát), součet známých sloupců
    const sh = volbyMC(hledana, [celkem - zn[0], celkem - zn[1], zn[0] + zn[1]], 2, 'jiný počet');
    return {
      no: 14, points: 2, title: 'Kroužky', kind: 'mc', okruh: 'data',
      svg: svgSloupce(jm, hod, neznamy),
      prompt: `Žáci 9. tříd chodí do tří kroužků: ${jm.join(', ')}. Každý žák je právě v jednom z nich a celkem jich je ${celkem}. V grafu chybí počet žáků u kroužku „${jm[neznamy]}". Kolik žáků chodí do tohoto kroužku?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Každý žák je právě v jednom kroužku, takže se počty ve všech třech sloupcích sečtou na celkový počet.`,
        `Z grafu přečti známé sloupce: ${zn[0]} a ${zn[1]}, dohromady ${zn[0]} + ${zn[1]} = ${zn[0] + zn[1]}.`,
        `Chybějící počet = ${celkem} − ${zn[0] + zn[1]} = ${hledana}${odpovedMC(sh)}`]
    };
  }

  function gen14f() {
    // 2 body — MC A-E, druhé čtení ze sloupcového grafu: rozdíl dvou sloupců
    // (věrné M9C/2025 a M9D/2025 — tam se z grafu porovnávají dvě hodnoty).
    const mesice = ['květen', 'červen', 'červenec', 'srpen', 'září'];
    const hod = mesice.map(() => ri(3, 16) * 10);
    /* 🔴 NEKONEČNÁ SMYČKA: cyklus dřív přelosovával jen MĚSÍC iB, dokud
       nenašel jinou hodnotu než u iA. Když ale vyšlo všech pět sloupců
       stejně vysokých (pravděpodobnost 1 : 38 416 na generování), žádný
       takový měsíc neexistoval a prohlížeč zamrzl. Našel to test
       nezávislého dopočtu, který se jednou za čas zasekl — profil V8
       ukázal 100 % času tady. Teď se přelosuje HODNOTA sloupce. */
    let iA = ri(0, 4), iB = ri(0, 3);
    if (iB >= iA) iB++;                                  // dva různé měsíce
    while (hod[iB] === hod[iA]) hod[iB] = ri(3, 16) * 10;
    if (hod[iA] < hod[iB]) { const t = iA; iA = iB; iB = t; }
    const rozdil = hod[iA] - hod[iB];
    /* Distraktory jsou omyly (hodnota jednoho měsíce, součet místo rozdílu)
       a jen kladné: pro rozdíl 10 dřív vycházely volby „−10" a „0" jako
       odpověď na „o kolik více" — nesmysl, který se vyloučí bez počítání. */
    const sh = volbyMC(rozdil, [hod[iA], hod[iB], hod[iA] + hod[iB]], 10, 'jiný počet');
    /* 6. pád se musí vypsat, ne skládat: přilepené „-i" dávalo
       „v květeni", „v červeni" a „v srpeni" — ve třech měsících z pěti. */
    const V_MESICI = { 'květen': 'květnu', 'červen': 'červnu', 'červenec': 'červenci', 'srpen': 'srpnu', 'září': 'září' };
    return {
      no: 14, points: 2, title: 'Návštěvnost', kind: 'mc', okruh: 'data',
      svg: svgSloupce(mesice, hod, -1),
      prompt: `V grafu je uvedena návštěvnost rodného domu spisovatele v jedné letní sezoně. O kolik více vstupenek se prodalo v ${V_MESICI[mesice[iA]]} než v ${V_MESICI[mesice[iB]]}?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Otázka „o kolik více“ znamená ROZDÍL — z grafu tedy stačí přečíst dvě hodnoty a odečíst je.`,
        `${mesice[iA]}: ${hod[iA]} vstupenek, ${mesice[iB]}: ${hod[iB]} vstupenek.`,
        `Rozdíl = ${hod[iA]} − ${hod[iB]} = ${rozdil}${odpovedMC(sh)}`]
    };
  }

  /* ═══ POZICE 15 — tři VÍCEKROKOVÉ slovní úlohy k přiřazení ═══════════
     Sken úlohy 15 v ostrých zadáních 2023–2025 (pdfs/): je to vždy
     přiřazování tří slovních úloh k šesti výsledkům se SPOLEČNOU
     jednotkou, a nikde se nepočítá jen „p % z celku". Vždy je v tom
     jeden z těchto háčků:
       · ZÁKLAD SE MĚNÍ — „o 20 členů víc než loni" se měří loňskem
         (M9B/2023 ú. 15.1), „mladších o třetinu méně" nedá opačným
         směrem 33 % (M9B/2025 ú. 15.2),
       · ZPĚTNÝ VÝPOČET — „o čtvrtinu víc, než ujela Jana" (M9A/2023),
       · CELEK ZE ZBYTKU — „tři pětiny plné, dolijeme 14 litrů"
         (nanečisto 2025),
       · VĚK PŘES ZLOMEK ŽIVOTA a poměr (M9D/2025),
       · VŠE VZTAŽENÉ K JEDNÉ OSOBĚ — hrnčíři, rybíz (M9C/2025).
     Zadání jsou vlastní (jiné postavy, předměty i čísla), stejně jako
     ve zbytku banky; z ostrých úloh se přebírá STRUKTURA.

     Každá úloha nejdřív zvolí VÝSLEDEK a zadání dopočítá z něj, takže
     vždy vyjde přesně. Vrací { prompt, value, chyby, sol }: `chyby` jsou
     výsledky TYPICKÝCH OMYLŮ (špatný základ, mezivýsledek místo
     výsledku) a právě ty se nabídnou jako distraktory — kdo se splete
     klasickým způsobem, najde svou chybu mezi volbami, jako na ostrém
     testu. Krajní volba („více než 48 let", „jiný počet") bývá obvykle
     jen distraktor, ale NE VŽDY: v M9C/2025 ú. 15.1 vyjde 27 hrnků
     a nabídka končí „F) více než 25 hrnků". Proto se tu občas největší
     výsledek schválně nenabídne a správná je „více než…" — žák musí
     věřit svému výpočtu, i když číslo v nabídce nenajde.

     Postup je u KAŽDÉ podúlohy samostatný (žádné „stejně jako výše"):
     procvičování vytáhne z přiřazovací úlohy jen jednu otázku.
     ─────────────────────────────────────────────────────────────── */
  const dily = n => `${n} ${skl(n, 'díl', 'díly', 'dílů')}`;
  const velke = s => s.charAt(0).toUpperCase() + s.slice(1);
  const litru = v => `${v} ${skl(v, 'litr', 'litry', 'litrů')}`;
  const roku = v => `${v} ${skl(v, 'rok', 'roky', 'let')}`;
  const sklenic = v => `${v} ${skl(v, 'sklenice', 'sklenice', 'sklenic')}`;
  // zlomky slovy: čtvrtinu (4. pád) / čtvrtina (1. pád)
  const ZL_AK = { 2: 'polovinu', 3: 'třetinu', 4: 'čtvrtinu', 5: 'pětinu', 6: 'šestinu' };
  const ZL_NOM = { 2: 'polovina', 3: 'třetina', 4: 'čtvrtina', 5: 'pětina', 6: 'šestina' };
  function zamichej(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  /* Tři úlohy (v daném pořadí), každá s JINÝM výsledkem — jinak by dvě
     podúlohy ukazovaly na tutéž volbu. */
  function vyber15(tvurci) {
    let ulohy;
    do { ulohy = tvurci.map(f => f()); }
    while (new Set(ulohy.map(u => u.value)).size < ulohy.length);
    return ulohy;
  }
  /* Nabídka A–F: správné výsledky + výsledky typických omylů, doplněné
     sousedními hodnotami, seřazené vzestupně. `kraj(max)` = krajní volba
     na konec, nebo null. `skryj`: největší správný výsledek se nenabídne,
     všechny nabídnuté hodnoty jsou menší a správná je krajní „více než…"
     (jen když krajní volba zní „více než"; nepovede-li se nabídku z menších
     hodnot naplnit, vrátí se null a volá se běžná varianta). */
  function nabidka15(ulohy, jednotka, krok, kraj, skryj) {
    const spravne = ulohy.map(u => u.value), nejvic = Math.max(...spravne);
    const smi = v => Number.isInteger(v) && v > 0 && (!skryj || v < nejvic);
    const hodnoty = new Set(skryj ? spravne.filter(v => v !== nejvic) : spravne);
    const mist = kraj ? 5 : 6;
    zamichej(ulohy.flatMap(u => u.chyby)).filter(smi)
      .forEach(v => { if (hodnoty.size < mist) hodnoty.add(v); });
    for (let pokus = 0; hodnoty.size < mist; pokus++) {
      if (pokus >= 200) {
        if (skryj) return null;
        hodnoty.add(Math.max(...hodnoty) + krok);
        continue;
      }
      const v = pick(spravne) + krok * pick([-2, -1, 1, 2]);
      if (smi(v)) hodnoty.add(v);
    }
    const serazene = [...hodnoty].sort((a, b) => a - b);
    const L = 'ABCDEF';
    const options = serazene.map((v, i) => `${L[i]}) ${jednotka(v)}`);
    if (kraj) options.push(`F) ${kraj(serazene[serazene.length - 1])}`);
    return { options, ans: spravne.map(v => (skryj && v === nejvic ? 'F' : L[serazene.indexOf(v)])) };
  }
  function uloha15(title, ulohy, jednotka, krok, kraj, viceNez) {
    // Krajní volba „více než…" je v každé třetí takové sadě správná (viz výše).
    const n = (viceNez && kraj && ri(0, 2) === 0 && nabidka15(ulohy, jednotka, krok, kraj, true))
      || nabidka15(ulohy, jednotka, krok, kraj, false);
    return { no: 15, points: 6, title, kind: 'match', prompts: ulohy.map(u => u.prompt),
      options: n.options, ans: n.ans, sol: ulohy.map(u => u.sol) };
  }

  /* ── sada „Procenta — změny" (výsledky jsou počty) ── */
  function u15Dvakrat() {
    // M9A/2023 ú. 15.1 — dvakrát po sobě o p %, pokaždé z NOVÉHO stavu
    const [p, nasobek, ks] = pick([[10, 100, [1, 2, 3, 4]], [20, 25, [5, 6, 8, 10, 12]],
      [25, 16, [10, 15, 20]], [50, 4, [15, 20, 25, 30, 40, 50]]]);
    const N = nasobek * pick(ks), q = cz((100 + p) / 100);
    const N1 = N * (100 + p) / 100, N2 = N1 * (100 + p) / 100;
    return {
      prompt: `Pekárna upekla v pondělí ${N} rohlíků. V úterý i ve středu upekla vždy o ${p} % rohlíků více než předchozí den. Kolik rohlíků upekla ve středu?`,
      value: N2, chyby: [N * (100 + 2 * p) / 100, N1],
      sol: [
        `Každé zvýšení se počítá z počtu PŘEDCHOZÍHO dne, ne z pondělního — dvakrát o ${p} % proto není totéž co jednou o ${2 * p} %.`,
        `Zvýšit o ${p} % znamená vynásobit číslem ${q} (100 % + ${p} % = ${100 + p} %).`,
        `Úterý: ${N} · ${q} = ${N1} rohlíků.`,
        `Středa: ${N1} · ${q} = ${N2} rohlíků.`
      ]
    };
  }
  function u15Zpet() {
    // M9A/2023 ú. 15.2 — „o čtvrtinu víc, než ujela Klára" → základem je Klára
    const [k, ks] = pick([[3, [20, 30, 40]], [4, [10, 15, 20, 25]], [5, [6, 8, 10, 12, 16]]]);
    const J = k * k * pick(ks), R = J * (k + 1) / k, dil = R / (k + 1);
    return {
      prompt: `Ondřej i Klára jezdili o prázdninách na kole. Ondřej ujel ${R} km, což bylo o ${ZL_AK[k]} více, než ujela Klára. Kolik km ujela Klára?`,
      value: J, chyby: [R - R / k],
      sol: [
        `„O ${ZL_AK[k]} více, než ujela Klára" bere za celek KLÁŘINU vzdálenost. Kdo odečte ${ZL_AK[k]} z Ondřejových ${R} km, bere ji z jiného, většího celku.`,
        `Klára ujela ${dily(k)}, Ondřej o jeden víc, tedy ${dily(k + 1)} — a to je ${R} km.`,
        `Jeden díl: ${R} : ${k + 1} = ${dil} km.`,
        `Klára: ${dil} · ${k} = ${J} km.`
      ]
    };
  }
  function u15Knihovna() {
    // M9A/2023 ú. 15.3 — úbytek z počtu PŘED, přírůstek z počtu PO → odzadu
    const [a, b] = pick([[40, 25], [20, 25], [25, 20], [50, 20], [20, 50], [40, 50], [25, 40], [30, 50]]);
    let P;
    do { P = ri(15, 60) * 10; } while ((P * (100 - a)) % 100 || (P * (100 - a) * b) % 10000);
    const K = P * (100 - a) / 100, M = K * b / 100;
    return {
      prompt: `Knihovna při stěhování vyřadila část knih, takže jich měla o ${a} % méně než předtím. Potom koupila ${M} nových knih a měla jich o ${b} % více než po vyřazení. Kolik knih měla knihovna před stěhováním?`,
      value: P, chyby: [K, K + M, K * (100 + a) / 100],
      sol: [
        `Procenta se tu berou ze DVOU různých celků: úbytek z počtu PŘED vyřazením, přírůstek z počtu PO něm. Počítej proto odzadu, od toho, co znáš.`,
        `${M} nových knih je ${b} % počtu po vyřazení, takže po vyřazení měla knihovna ${M} : ${pr(b)} = ${K} knih.`,
        `Po vyřazení zbylo ${100 - a} % původního počtu (ubylo ${a} %).`,
        `Před stěhováním: ${K} : ${pr(100 - a)} = ${P} knih.`
      ]
    };
  }
  function gen15d() {
    // 6 bodů — přiřazování; změny o procenta, výsledky jsou počty (vzor M9A/2023 ú. 15)
    return uloha15('Procenta — změny', vyber15([u15Dvakrat, u15Zpet, u15Knihovna]),
      v => String(v), 20, pick([null, () => 'jiný počet']));
  }

  /* ── sada „Kolik procent" (výsledky v %) ── */
  function u15Hriste() {
    // M9A/2025 ú. 15.1 — ptá se na ty, kdo NEJSOU hráči → nejdřív hráči
    let N, o, h, t;
    do {
      N = pick([100, 200, 250, 300, 400]); o = ri(2, 12) * 5; h = pick([5, 6, 7, 8, 11]);
      t = N * (100 - o) / 100 / h;
    } while (!Number.isInteger(N * (100 - o) / 100) || !Number.isInteger(t) || t < 5 || t > 20);
    return {
      prompt: `Na zahájení turnaje nastoupilo ${t} družstev po ${h} hráčích a k nim všichni rozhodčí a pořadatelé. Dohromady nastoupilo ${N} lidí. Kolik procent nastoupených tvořili rozhodčí a pořadatelé?`,
      value: o, chyby: [100 - o],
      sol: [
        `Rozhodčí a pořadatelé jsou všichni, kdo NEJSOU hráči — spočítej tedy nejdřív hráče a odečti je od všech nastoupených.`,
        `Hráčů je ${t} · ${h} = ${t * h}, rozhodčích a pořadatelů ${N} − ${t * h} = ${N - t * h}.`,
        `Podíl: ${N - t * h} : ${N} = ${pr(o)}, tedy ${o} %.`
      ]
    };
  }
  function u15Loni() {
    // M9B/2023 ú. 15.1 — „o kolik % víc než loni": základem je LOŇSKÝ stav
    let q, L, D;
    do { q = pick([10, 20, 25, 40, 50, 60, 75]); L = pick([20, 40, 60, 80, 120]); D = L * q / 100; }
    while (D < 5);
    const A = L + D, co = pick(['pěvecký sbor', 'šachový kroužek', 'turistický oddíl']);
    return {
      prompt: `Letos má ${co} ${A} členů, což je o ${D} členů více než loni. O kolik procent má letos ${co} více členů než loni?`,
      value: q, chyby: [Math.round(100 * D / A), D],
      sol: [
        `„O kolik procent víc než loni" bere za základ (100 %) LOŇSKÝ počet — přírůstek se porovnává s tím, co bylo, ne s tím, co je letos.`,
        `Loni: ${A} − ${D} = ${L} členů.`,
        `Přírůstek ${D} z loňských ${L}: ${D} : ${L} = ${pr(q)}.`,
        `${pr(q)} = ${q} %, letos je členů o ${q} % více.`
      ]
    };
  }
  function u15ZlomekZeZlomku() {
    // M9B/2023 ú. 15.2 — „tři pětiny, z toho tři čtvrtiny" → zlomky se NÁSOBÍ
    const ZL = [[1, 2, 'polovinu'], [1, 4, 'čtvrtinu'], [3, 4, 'tři čtvrtiny'], [1, 5, 'pětinu'],
      [2, 5, 'dvě pětiny'], [3, 5, 'tři pětiny'], [4, 5, 'čtyři pětiny']];
    let f, g, pct;
    do { f = pick(ZL); g = pick(ZL); pct = 100 * f[0] * g[0] / (f[1] * g[1]); }
    while (!Number.isInteger(pct) || pct < 10);
    return {
      prompt: `Ema utratila na výletě ${f[2]} svých úspor. ${velke(g[2])} z utracené částky zaplatila za ubytování. Kolik procent svých úspor dala Ema za ubytování?`,
      value: pct, chyby: [100 * f[0] / f[1], 100 * g[0] / g[1]],
      sol: [
        `„${velke(g[2])} z utracené částky" se počítá z UTRACENÝCH peněz, ne ze všech úspor — zlomek ze zlomku se proto NÁSOBÍ.`,
        `Ze všech úspor: ${f[0]}/${f[1]} · ${g[0]}/${g[1]} = ${f[0] * g[0]}/${f[1] * g[1]}.`,
        `${f[0] * g[0]}/${f[1] * g[1]} = ${pct}/100, tedy ${pct} %.`
      ]
    };
  }
  function u15Vystava() {
    // M9B/2023 ú. 15.3 — poslední den „o třetinu víc" → podíl na CELKU přes díly.
    // Jen kombinace, kde podíl vyjde na celé procento (n stejných dnů, pak ±1/k).
    const [n, k, zn, pct] = pick([[2, 3, 1, 40], [1, 2, 1, 60], [4, 3, 1, 25], [5, 4, 1, 20],
      [2, 3, -1, 25], [2, 2, -1, 20], [1, 3, -1, 40], [3, 4, -1, 20]]);
    const DNU = { 3: 'třídenní', 4: 'čtyřdenní', 5: 'pětidenní', 6: 'šestidenní' };
    const DEN = { 2: 'druhý', 3: 'třetí', 4: 'čtvrtý', 5: 'pátý', 6: 'šestý' };
    const PRVNI = { 2: 'první dva dny', 3: 'první tři dny', 4: 'první čtyři dny', 5: 'prvních pět dní' };
    const smer = zn > 0 ? 'více' : 'méně', znam = zn > 0 ? '+' : '−';
    const posl = k + zn, celkem = n * k + posl, den = DEN[n + 1];
    const prompt = n === 1
      ? `Na dvoudenní výstavě přišlo druhý den o ${ZL_AK[k]} ${smer} návštěvníků než první den. Kolik procent všech návštěvníků výstavy přišlo druhý den?`
      : `Na ${DNU[n + 1]} výstavě přišel ${PRVNI[n]} každý den stejný počet návštěvníků. ${velke(den)} den přišlo o ${ZL_AK[k]} ${smer} návštěvníků než v každém z předchozích dnů. Kolik procent všech návštěvníků výstavy přišlo ${den} den?`;
    return {
      prompt, value: pct, chyby: [Math.round(100 / (n + 1)), Math.round(100 / k)],
      sol: [
        `Skutečné počty neznáš, ale na nich nezáleží — zvol si jeden obyčejný den jako ${dily(k)}, aby ${ZL_NOM[k]} vyšla beze zbytku.`,
        n === 1
          ? `První den ${dily(k)}, druhý den ${k} ${znam} 1 = ${dily(posl)}, dohromady ${k} + ${posl} = ${dily(celkem)}.`
          : `${n >= 5 ? 'Prvních' : 'První'} ${n} ${n >= 5 ? 'dní' : 'dny'}: ${n} · ${k} = ${dily(n * k)}. ${velke(den)} den: ${k} ${znam} 1 = ${dily(posl)}. Dohromady ${n * k} + ${posl} = ${dily(celkem)}.`,
        `Podíl ${den.replace(/ý$/, 'ého').replace(/í$/, 'ího')} dne: ${posl} : ${celkem} = ${pr(pct)}, tedy ${pct} %.`
      ]
    };
  }
  function u15Knihy() {
    // M9B/2025 ú. 15.2 — „o třetinu méně než …" → opačným směrem NEvyjde třetina
    const k = pick([3, 5, 6]), pct = 100 / (k - 1);
    return {
      prompt: `V knihovně je naučných knih o ${ZL_AK[k]} méně než románů. O kolik procent je v knihovně románů více než naučných knih?`,
      value: pct, chyby: [Math.round(100 / k)],
      sol: [
        `Pozor na základ: „o ${ZL_AK[k]} méně než románů" bere za celek ROMÁNY, ale otázka „o kolik procent víc než naučných" bere za celek NAUČNÉ knihy. Proto nevyjde znovu ${ZL_NOM[k]}.`,
        `Zvol románů ${dily(k)}, naučných knih je pak ${k} − 1 = ${dily(k - 1)}.`,
        `Románů je o 1 díl víc a ten se porovná s naučnými: 1 : ${k - 1} = ${pr(pct)}, tedy ${pct} %.`
      ]
    };
  }
  function gen15e() {
    // 6 bodů — přiřazování; „kolik procent" s háčkem v základu
    // (vzor M9B/2023, M9A/2025 a M9B/2025 ú. 15). Tři z pěti úloh, pořadí zachované.
    const vse = [u15Hriste, u15Loni, u15ZlomekZeZlomku, u15Vystava, u15Knihy];
    const tri = zamichej([0, 1, 2, 3, 4]).slice(0, 3).sort((a, b) => a - b).map(i => vse[i]);
    return uloha15('Kolik procent', vyber15(tri), v => `${v} %`, 5,
      pick([null, max => `více než ${max} %`]), true);
  }

  /* ── sada „Objem nádoby" (výsledky v litrech) ── */
  function u15Doliti() {
    // nanečisto 2025 ú. 15.1 — dolitá voda zaplní PRÁZDNOU část
    const [a, b, zlomek] = pick([[2, 3, 'Dvě třetiny'], [3, 4, 'Tři čtvrtiny'], [2, 5, 'Dvě pětiny'],
      [3, 5, 'Tři pětiny'], [4, 5, 'Čtyři pětiny']]);
    const V = b * ri(4, 12), X = V * (b - a) / b, dil = V / b;
    const [coGen, co] = pick([['akvária', 'akvárium'], ['sudu', 'sud'], ['barelu', 'barel']]);
    const jedna = 'Jedna ' + ZL_NOM[b];
    return {
      prompt: `${zlomek} objemu ${coGen} jsou zaplněny vodou. Když dolijeme ještě ${litru(X)} vody, bude zaplněný celý objem. Jaký objem má ${co}?`,
      value: V, chyby: [X * b / a, 2 * X],
      sol: [
        `Dolitá voda zaplní tu část, která byla PRÁZDNÁ, ne tu zaplněnou — nejdřív tedy zjisti, jaká část objemu chyběla.`,
        `Prázdné byly 1 − ${a}/${b} = ${b - a}/${b} objemu, a to je ${litru(X)}.`,
        b - a === 1 ? `${jedna} objemu je tedy ${litru(dil)}.` : `${jedna} objemu: ${X} : ${b - a} = ${litru(dil)}.`,
        `Celý objem: ${dil} · ${b} = ${litru(V)}.`
      ]
    };
  }
  function u15Odcerpani() {
    // nanečisto 2025 ú. 15.2 — odčerpaná voda = rozdíl dvou stavů v procentech
    const Q = [[10, 'desetinu', 'Desetina'], [20, 'pětinu', 'Pětina'], [25, 'čtvrtinu', 'Čtvrtina'], [50, 'polovinu', 'Polovina']];
    let p, zq, V;
    do { p = ri(9, 18) * 5; zq = pick(Q); V = ri(4, 16) * 5; }
    while (p - zq[0] < 20 || (V * (p - zq[0])) % 100);
    const q = zq[0], X = V * (p - q) / 100;
    return {
      prompt: `Voda v nádrži vyplňuje ${p} % jejího objemu. Když z nádrže odčerpáme ${litru(X)}, bude voda vyplňovat přesně ${zq[1]} objemu. Jaký objem má nádrž?`,
      value: V, chyby: [Math.round(100 * X / p), 100 * X / q],
      sol: [
        `Odčerpaná voda je rozdíl dvou stavů — před odčerpáním a po něm. Oba vyjádři v procentech objemu a odečti je.`,
        `${zq[2]} objemu je ${q} %, takže odčerpaných ${litru(X)} je ${p} % − ${q} % = ${p - q} % objemu.`,
        `Objem nádrže: ${X} : ${pr(p - q)} = ${litru(V)}.`
      ]
    };
  }
  function u15TriNadoby() {
    // nanečisto 2025 ú. 15.3 — rovnoměrné rozdělení prozradí CELKOVÉ množství
    const [r, slovy] = pick([[40, 'dvě pětiny'], [50, 'polovinu'], [60, 'tři pětiny']]);
    let a, b, s, V;
    do { a = ri(2, 12) * 5; b = ri(2, 12) * 5; s = 3 * r - a - b; V = ri(4, 20) * 5; }
    while (a === b || s < 15 || s > 90 || s === a || s === b || (V * s) % 100);
    const Y = V * s / 100;
    return {
      prompt: `Ve třech stejných nádobách je různé množství vody. V první vyplňuje voda ${a} % objemu, ve druhé ${b} % objemu a ve třetí je ${litru(Y)} vody. Kdybychom vodu rozdělili rovnoměrně do všech tří nádob, vyplnila by v každé ${slovy} objemu. Jaký objem má jedna nádoba?`,
      value: V, chyby: [100 * Y / r, 100 * Y / (100 - a - b)],
      sol: [
        `Po rovnoměrném rozdělení by voda v každé nádobě vyplnila ${r} % objemu, takže vody je CELKEM 3 · ${r} % = ${3 * r} % objemu jedné nádoby.`,
        `První dvě nádoby mají ${a} % + ${b} % = ${a + b} %, na třetí tedy zbývá ${3 * r} % − ${a + b} % = ${s} % objemu, a to je ${litru(Y)}.`,
        `Objem nádoby: ${Y} : ${pr(s)} = ${litru(V)}.`
      ]
    };
  }
  function u15Sud() {
    // obě spotřeby jsou procenta z PŮVODNÍHO množství → sečíst, zbytek do 100 %
    let p, q, V;
    do { p = ri(4, 12) * 5; q = ri(2, 8) * 5; V = ri(4, 20) * 10; }
    while (p + q < 50 || p + q > 90 || p === q || (V * (100 - p - q)) % 100);
    const Z = V * (100 - p - q) / 100;
    return {
      prompt: `Z plného sudu se nejdřív spotřebovalo ${p} % vody a potom ještě ${q} % původního množství. V sudu zůstalo ${litru(Z)} vody. Kolik litrů vody bylo v plném sudu?`,
      value: V, chyby: [100 * Z / (p + q), Z + Z * (p + q) / 100],
      sol: [
        `Obě spotřeby jsou procenta z PŮVODNÍHO množství, takže se dají sečíst — a to, co zůstalo, doplňuje jejich součet do 100 %.`,
        `Spotřebovalo se ${p} % + ${q} % = ${p + q} %, zůstalo tedy 100 % − ${p + q} % = ${100 - p - q} % původního množství, a to je ${litru(Z)}.`,
        `Plný sud: ${Z} : ${pr(100 - p - q)} = ${litru(V)}.`
      ]
    };
  }
  function gen15f() {
    // 6 bodů — přiřazování; celek ze zbytku, výsledky v litrech (vzor nanečisto 2025 ú. 15)
    const tri = pick([[u15Doliti, u15Odcerpani, u15TriNadoby], [u15Doliti, u15Sud, u15TriNadoby],
      [u15Doliti, u15Odcerpani, u15Sud]]);
    return uloha15('Objem nádoby', vyber15(tri), litru, 5, pick([null, () => 'jiný objem']));
  }

  /* ── sada „Věk" (výsledky v letech) ── */
  function u15ZlomekZivota() {
    // M9D/2025 ú. 15.1 — věk při stěhování odpovídá ZBYTKU života, ne té části
    const [a, b, cast, zbytek] = pick([[5, 8, 'posledních pět osmin', 'zbylé tři osminy'],
      [2, 3, 'poslední dvě třetiny', 'zbylou třetinu'], [3, 4, 'poslední tři čtvrtiny', 'zbylou čtvrtinu'],
      [3, 5, 'poslední tři pětiny', 'zbylé dvě pětiny'], [4, 7, 'poslední čtyři sedminy', 'zbylé tři sedminy']]);
    let A;
    do { A = b * ri(Math.ceil(36 / b), Math.floor(84 / b)); } while (A * (b - a) / b < 12);
    const M = A * (b - a) / b, T = A * a / b, dil = A / b;
    const JEDNA = { 3: 'třetina', 4: 'čtvrtina', 5: 'pětina', 7: 'sedmina', 8: 'osmina' };
    const [kdo, kde, muz] = pick([['Pan Novotný', 'v Táboře', 1], ['Paní Dvořáková', 'v Jihlavě', 0],
      ['Pan Beneš', 'v Kolíně', 1], ['Paní Marková', 'v Opavě', 0]]);
    return {
      prompt: `${kdo} žije ${cast} svého dosavadního života ${kde}, kam se ${muz ? 'přestěhoval' : 'přestěhovala'} ve věku ${roku(M)}. Kolik let žije ${kdo.charAt(0).toLowerCase() + kdo.slice(1)} ${kde}?`,
      value: T, chyby: [A, M],
      sol: [
        `${kdo} žije ${kde} ${cast} života, takže před přestěhováním ${muz ? 'prožil' : 'prožila'} ${zbytek} — a ta část odpovídá věku ${roku(M)}.`,
        b - a === 1
          ? `Jedna ${JEDNA[b]} života je tedy ${roku(dil)}, celý dosavadní věk ${dil} · ${b} = ${roku(A)}.`
          : `Jedna ${JEDNA[b]} života: ${M} : ${b - a} = ${roku(dil)}, celý dosavadní věk ${dil} · ${b} = ${roku(A)}.`,
        `${velke(kde)}: ${dil} · ${a} = ${roku(T)}.`
      ]
    };
  }
  function u15Pomer() {
    // M9D/2025 ú. 15.2 — „o 75 % déle než rozhledna" → základem je rozhledna; pak poměr
    let p, u, v, G;
    do { p = pick([20, 25, 50, 60, 75]); [u, v] = pick([[2, 3], [3, 4], [3, 5], [4, 5], [2, 5]]); G = ri(20, 80); }
    while (G % v || (G * (100 + p)) % 100);
    const Z = G * (100 + p) / 100, L = G * u / v;
    return {
      prompt: `Kamenný most stojí už ${roku(Z)}, tedy o ${p} % déle než rozhledna. Stáří altánu a rozhledny je v poměru ${u} : ${v}. Kolik let stojí altán?`,
      value: L, chyby: [G, Z * (100 - p) / 100, Z * u / v],
      sol: [
        `„O ${p} % déle než rozhledna" bere za základ (100 %) stáří ROZHLEDNY — most tedy stojí ${100 + p} % jejího stáří. Odečíst ${p} % od ${Z} by znamenalo počítat z jiného celku.`,
        `Rozhledna: ${Z} : ${pr(100 + p)} = ${roku(G)}.`,
        `Poměr altán : rozhledna je ${u} : ${v}, rozhledna má tedy ${dily(v)}. Jeden díl: ${G} : ${v} = ${roku(G / v)}.`,
        `Altán: ${G / v} · ${u} = ${roku(L)}.`
      ]
    };
  }
  function u15Sourozenci() {
    // M9D/2025 ú. 15.3 — věk dvojčat je vyjádřený věkem STARŠÍHO sourozence
    const [c, deti] = pick([[2, 'dvojčat'], [3, 'trojčat']]);
    const [nom, gen, jeho] = pick([['bratr', 'staršího bratra', 'jeho'], ['sestra', 'starší sestry', 'jejího']]);
    let p, B;
    do { p = pick([20, 25, 40, 50]); B = ri(12, 45); }
    while ((B * (100 - p)) % 100 || (B * (100 + c * (100 - p))) % 100 || B * (100 - p) / 100 < 6);
    const F = 100 + c * (100 - p), T = B * (100 - p) / 100, S = B * F / 100;
    return {
      prompt: `Součet věků ${deti} a jejich ${gen} je ${roku(S)}. Každé z ${deti} je o ${p} % mladší než ${nom}. Kolik let je každému z ${deti}?`,
      value: T, chyby: [B, S / (c + 1)],
      sol: [
        `Věk ${deti} je vyjádřený pomocí věku ${gen.split(' ')[1]} — ${nom} je tedy celek (100 %) a každé z ${deti} má ${100 - p} % ${jeho} věku.`,
        `Všichni dohromady: 100 % + ${c} · ${100 - p} % = ${F} % věku ${gen.split(' ')[1]}, a to je ${roku(S)}.`,
        `${velke(nom)}: ${S} : ${pr(F)} = ${roku(B)}.`,
        `Každé z ${deti}: ${B} · ${pr(100 - p)} = ${roku(T)}.`
      ]
    };
  }
  function gen15g() {
    // 6 bodů — přiřazování; věk přes zlomek, procenta a poměr (vzor M9D/2025 ú. 15)
    return uloha15('Věk', vyber15([u15ZlomekZivota, u15Pomer, u15Sourozenci]), roku, 3,
      pick([null, max => `více než ${roku(max)}`]), true);
  }

  /* ── sada „Sklenice" (výsledky jsou počty sklenic) ── */
  function u15Prepravka() {
    // M9C/2025 ú. 15.1 — ptá se na ZBYTEK, ne na odebrané
    let K, p;
    do { K = pick([20, 24, 30, 36, 40, 48, 50, 60]); p = ri(10, 75); } while ((K * p) % 100);
    const zbylo = K * (100 - p) / 100;
    return {
      prompt: `Do přepravky se vejde přesně ${sklenic(K)} marmelády. Z plné přepravky jsme vyndali ${p} % sklenic. Kolik sklenic v přepravce zůstalo?`,
      value: zbylo, chyby: [K * p / 100],
      sol: [
        `Otázka se ptá na sklenice, které v přepravce ZŮSTALY, ne na ty vyndané — a zůstalo tolik procent, kolik chybí do 100 %.`,
        `Zůstalo 100 % − ${p} % = ${100 - p} % sklenic.`,
        `${100 - p} % z ${K}: ${K} · ${100 - p} : 100 = ${sklenic(zbylo)}.`
      ]
    };
  }
  function u15Zavarovani() {
    // M9C/2025 ú. 15.2 — všechno je vztažené k JEDNÉ osobě → ta je celek
    let p, R;
    do { p = pick([20, 25, 40]); R = ri(40, 100); }
    while (R % 2 || (R * (100 - p)) % 100 || (R * (350 - 2 * p)) % 100 || R * (50 - p) / 100 < 5);
    const T = R * (100 - p) / 100, P = R / 2, N = R * (350 - 2 * p) / 100, rozdil = T - P;
    return {
      prompt: `Čtyři kamarádi zavařili dohromady ${sklenic(N)} marmelády. Adam zavařil o polovinu méně sklenic než Bára. Cyril i Dana zavařili každý o ${p} % sklenic méně než Bára. O kolik sklenic zavařila Dana více než Adam?`,
      value: rozdil, chyby: [P, T, R],
      sol: [
        `Všechny údaje jsou vztažené k BÁŘE, proto vezmi její počet jako celek (100 %) a ostatní vyjádři jako jeho části.`,
        `Adam má 50 %, Cyril a Dana po ${100 - p} %. Dohromady 100 % + 50 % + 2 · ${100 - p} % = ${350 - 2 * p} % Bářina počtu, a to je ${sklenic(N)}.`,
        `Bára: ${N} : ${pr(350 - 2 * p)} = ${sklenic(R)}, Dana: ${R} · ${pr(100 - p)} = ${sklenic(T)}, Adam: ${R} : 2 = ${sklenic(P)}.`,
        `Rozdíl: ${T} − ${P} = ${sklenic(rozdil)}.`
      ]
    };
  }
  function u15Babicka() {
    // M9C/2025 ú. 15.3 — dva vztahy k téže osobě a jejich ROZDÍL → díly
    const e = pick([2, 3, 4]), m = pick([2, 3]), u = ri(2, 6);
    const diff = m * e - (e + 1), d = diff * u, celkem = (2 * e + m * e + 1) * u;
    return {
      prompt: `Babička naplnila marmeládou ${m === 2 ? 'dvakrát' : 'třikrát'} více sklenic než Ema. Děda naplnil o ${ZL_AK[e]} více sklenic než Ema. Přitom děda naplnil o ${d} ${skl(d, 'sklenici', 'sklenice', 'sklenic')} méně než babička. Kolik sklenic naplnili všichni tři dohromady?`,
      value: celkem, chyby: [e * u, m * e * u, (e + 1) * u],
      sol: [
        `Všechny počty jsou vztažené k EMĚ. Zvol si její počet jako ${dily(e)}, aby ${ZL_NOM[e]} vyšla beze zbytku.`,
        `Babička: ${m} · ${e} = ${dily(m * e)}. Děda: ${e} + 1 = ${dily(e + 1)}.`,
        diff === 1
          ? `Babička má o 1 díl víc než děda, a ten díl je ${sklenic(d)}.`
          : `Babička má o ${m * e} − ${e + 1} = ${dily(diff)} víc než děda, a to je ${sklenic(d)}, takže 1 díl = ${d} : ${diff} = ${sklenic(u)}.`,
        `Dohromady: (${e} + ${m * e} + ${e + 1}) · ${u} = ${sklenic(celkem)}.`
      ]
    };
  }
  function gen15h() {
    // 6 bodů — přiřazování; podíly vztažené k jedné osobě (vzor M9C/2025 ú. 15)
    return uloha15('Sklenice', vyber15([u15Prepravka, u15Zavarovani, u15Babicka]), sklenic, 2,
      pick([null, max => `více než ${sklenic(max)}`]), true);
  }

  /* ══ Pozice 6–9 podle ostrých zadání (2026-09-24) ═══════════════════
     Pozice 6 = ostrá úloha 6 (M9A/2025: sud), 7 = úhly (M9A/2025 ú. 7,
     M9A/2026 ú. 8, M9C/2024), 8 = obvod a obsah složených útvarů (ostrá
     úloha 8). Pozice 9 nahrazuje konstrukční úlohu Pythagorovou větou —
     ale VNOŘENOU do úlohy tak, jak ji ostré testy opravdu používají
     (M9A/2026 ú. 13, M9D/2025 ú. 8), ne jako holé dosazení do vzorce. */

  /* ── Kreslení úhlů ──
     Směr se zadává ve stupních od kladné osy x PROTI směru hodinových
     ručiček, jak se kreslí v sešitě; v SVG roste y dolů, proto −sin. */
  const bod = (x, y) => ({ x, y });
  const smer = deg => ({ x: Math.cos(deg * Math.PI / 180), y: -Math.sin(deg * Math.PI / 180) });
  const tg = deg => Math.tan(deg * Math.PI / 180);
  // Přímka bodem P se směrem d oříznutá do obdélníku. Neoříznutá by
  // vyjela z viewBoxu a prohlížeč by ji tiše uřízl (rpg-diagramy-geometrie, kontrola 5).
  function orez(P, d, x0, y0, x1, y1) {
    let lo = -1e9, hi = 1e9;
    [[d.x, P.x, x0, x1], [d.y, P.y, y0, y1]].forEach(([dd, pp, a, b]) => {
      if (Math.abs(dd) < 1e-9) return;
      const t1 = (a - pp) / dd, t2 = (b - pp) / dd;
      lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
    });
    return [bod(P.x + d.x * lo, P.y + d.y * lo), bod(P.x + d.x * hi, P.y + d.y * hi)];
  }
  const cara = (A, B, barva, carky) => `<line x1="${r1(A.x)}" y1="${r1(A.y)}" x2="${r1(B.x)}" y2="${r1(B.y)}" stroke="${barva}" stroke-width="2"${carky ? ` stroke-dasharray="${carky}"` : ''}/>`;
  // Oblouk se středem VE VRCHOLU V mezi jednotkovými směry a, b. Sweep se
  // POČÍTÁ z vektorového součinu (proč, viz svgAngles). data-vrchol nese
  // střed, aby test mohl na vykreslené křivce změřit, že na té kružnici leží.
  function oblouk(V, a, b, R, barva) {
    const sweep = a.x * b.y - a.y * b.x > 0 ? 1 : 0;
    return `<path data-vrchol="${r1(V.x)} ${r1(V.y)}" data-r="${R}" d="M ${r1(V.x + a.x * R)} ${r1(V.y + a.y * R)} A ${R} ${R} 0 0 ${sweep} ${r1(V.x + b.x * R)} ${r1(V.y + b.y * R)}" fill="none" stroke="${barva}" stroke-width="2.5"/>`;
  }
  const napis = (x, y, text, barva, kotva) => `<text x="${r1(x)}" y="${r1(y)}" fill="${barva}" font-size="13" font-family="monospace" text-anchor="${kotva || 'middle'}">${text}</text>`;
  // Popisek úhlu na ose úhlu ve vzdálenosti D od vrcholu.
  function stitek(V, a, b, D, text, barva) {
    const mx = a.x + b.x, my = a.y + b.y, ml = Math.hypot(mx, my) || 1;
    return napis(V.x + mx / ml * D, V.y + my / ml * D + 4, text, barva);
  }
  function pravy(V, a, b, barva) {
    const k = 9, P1 = bod(V.x + a.x * k, V.y + a.y * k), P3 = bod(V.x + b.x * k, V.y + b.y * k);
    return `<polyline points="${r1(P1.x)},${r1(P1.y)} ${r1(P1.x + b.x * k)},${r1(P1.y + b.y * k)} ${r1(P3.x)},${r1(P3.y)}" fill="none" stroke="${barva}" stroke-width="1.5"/>`;
  }
  // Název přímky kousek od jejího konce, posunutý kolmo od čáry.
  function jmenoPrimky(K, d, text, barva) {
    const n = bod(-d.y, d.x);
    return napis(K.x + d.x * 14 + n.x * 10, K.y + d.y * 14 + n.y * 10 + 4, text, barva);
  }
  const ZADANY = '#4cc9f0', HLEDANY = '#ff5c8a', CARA = '#19e6e6', JMENO = '#39ff9e', VRCHOL = '#cfe8ff';

  // M9A/2025 ú. 7: přímky p, q, r bodem R; s ∥ r; t ⊥ s. fp, fq = sklon p a q.
  // γ je jako v ostrém zadání TUPÝ úhel mezi t (nahoru) a q (k bodu R) — klíč: 140° = 90° + 50°.
  function svgSvazek(fp, fq) {
    const W = 320, H = 206, rY = 90, sY = 152, box = [6, 8, W - 6, H - 8];
    const R = bod(205, rY);
    const Ps = bod(R.x - (sY - rY) / tg(fp), sY), Qs = bod(R.x - (sY - rY) / tg(fq), sY);
    const T = bod(R.x + 60 / tg(fq), rY - 60), Ts = bod(T.x, sY);     // T = průsečík q a t
    const [p1, p2] = orez(R, smer(fp), ...box), [q1, q2] = orez(R, smer(fq), ...box);
    const L = smer(180), P = smer(0), N = smer(90);
    return `<svg viewBox="0 0 ${W} ${H}">`
      + cara(bod(box[0], rY), bod(box[2], rY), CARA) + cara(bod(box[0], sY), bod(box[2], sY), CARA)
      + cara(bod(T.x, box[1]), bod(T.x, box[3]), CARA) + cara(p1, p2, CARA) + cara(q1, q2, CARA)
      + pravy(Ts, N, L, CARA)
      + oblouk(R, L, smer(180 + fp), 20, ZADANY) + stitek(R, L, smer(180 + fp), 36, fp + '°', ZADANY)
      + oblouk(R, P, smer(180 + fq), 16, ZADANY) + stitek(R, P, smer(180 + fq), 30, (180 - fq) + '°', ZADANY)
      + oblouk(Ps, P, smer(fp), 20, HLEDANY) + stitek(Ps, P, smer(fp), 34, 'α', HLEDANY)
      + oblouk(Qs, P, smer(fq), 20, HLEDANY) + stitek(Qs, P, smer(fq), 34, 'β', HLEDANY)
      + oblouk(T, N, smer(180 + fq), 16, HLEDANY) + stitek(T, N, smer(180 + fq), 30, 'γ', HLEDANY)
      + napis(R.x - 8, rY - 8, 'R', VRCHOL, 'end')
      + jmenoPrimky(p1, smer(fp), 'p', JMENO) + jmenoPrimky(q1, smer(fq), 'q', JMENO)
      + napis(box[2] - 2, rY - 6, 'r', JMENO, 'end') + napis(box[2] - 2, sY - 6, 's', JMENO, 'end')
      + napis(T.x + 6, box[3] - 4, 't', JMENO, 'start')
      + `</svg>`;
  }

  // M9A/2026 ú. 8: AB je průměr kružnice k (střed S), q ⊥ AB bodem C, o je osa úhlu při B.
  function svgThales(be) {
    const W = 300, H = 270, Y = 150, S = bod(150, Y), Rk = 108, box = [6, 8, W - 6, H - 6];
    const A = bod(S.x - Rk, Y), B = bod(S.x + Rk, Y), al = 90 - be;
    const cb = Math.cos(be * Math.PI / 180), sb = Math.sin(be * Math.PI / 180);
    const C = bod(B.x - 2 * Rk * cb * cb, Y - 2 * Rk * cb * sb), Pq = bod(C.x, Y);
    const X = bod(C.x, Y - (B.x - C.x) * tg(be / 2));
    const [o1, o2] = orez(B, smer(180 - be / 2), ...box);
    const vC = bod((C.x - S.x) / Rk, (C.y - S.y) / Rk), K = smer(35);
    return `<svg viewBox="0 0 ${W} ${H}">`
      + `<circle cx="${S.x}" cy="${S.y}" r="${Rk}" fill="none" stroke="${CARA}" stroke-width="2"/>`
      + cara(A, B, CARA) + cara(A, C, CARA) + cara(C, B, CARA)
      + cara(bod(C.x, box[1]), bod(C.x, Y + 40), CARA) + cara(o1, o2, '#8a9bc4', '6 4')
      + pravy(Pq, smer(90), smer(0), CARA)
      + oblouk(X, smer(90), smer(-be / 2), 16, ZADANY) + stitek(X, smer(90), smer(-be / 2), 32, (90 + be / 2) + '°', ZADANY)
      + oblouk(B, smer(180 - be / 2), smer(180 - be), 30, HLEDANY) + stitek(B, smer(180 - be / 2), smer(180 - be), 44, 'φ', HLEDANY)
      + oblouk(A, smer(0), smer(al), 20, HLEDANY) + stitek(A, smer(0), smer(al), 32, 'α', HLEDANY)
      + napis(A.x - 6, Y + 4, 'A', VRCHOL, 'end') + napis(B.x + 6, Y + 4, 'B', VRCHOL, 'start')
      + napis(C.x + vC.x * 14, C.y + vC.y * 14 + 4, 'C', VRCHOL) + napis(S.x, Y + 18, 'S', VRCHOL)
      + napis(S.x + K.x * (Rk + 12), S.y + K.y * (Rk + 12) + 4, 'k', JMENO)
      + napis(C.x + 7, box[1] + 12, 'q', JMENO, 'start') + jmenoPrimky(o2, smer(-be / 2), 'o', JMENO)
      + `</svg>`;
  }

  // M9C/2024: trojúhelník ABC vymezený přímkami a, b, c; u B vyznačený vnější úhel.
  function svgTriPrimky(al, be, ga) {
    const W = 300, H = 214, box = [6, 8, W - 6, H - 8], rad = Math.PI / 180;
    const k = Math.sin(al * rad) * Math.sin(be * rad) / Math.sin(ga * rad);   // výška : |AB|
    const AB = Math.min(180, 128 / k), Y = 172;
    const A = bod((W - AB) / 2, Y), B = bod(A.x + AB, Y);
    const AC = AB * Math.sin(be * rad) / Math.sin(ga * rad);
    const C = bod(A.x + AC * Math.cos(al * rad), Y - AC * Math.sin(al * rad));
    const [c1, c2] = orez(A, smer(0), ...box), [b1, b2] = orez(A, smer(al), ...box), [a1, a2] = orez(B, smer(180 - be), ...box);
    const obsaz = [];                                  // středy už umístěných popisků
    /* Popisek vrcholu jde do NEJVĚTŠÍHO VOLNÉHO úhlu mezi čtyřmi paprsky
       obou přímek. Odsunutí „ven od těžiště" ho posílalo přesně tam, kudy
       přímka pokračuje za vrchol, takže písmeno leželo na čáře. `zabrano`
       jsou úhly s obloukem (vnitřní, u B i vnější). */
    const ven = (V, paprsky, zabrano, text) => {
      const s = paprsky.map(u => ((u % 360) + 360) % 360).sort((x, y) => x - y);
      let best = null;
      s.forEach((u, i) => {
        const v = i + 1 < s.length ? s[i + 1] : s[0] + 360, gap = v - u, mid = (u + v) / 2;
        if (zabrano.some(z => Math.abs(((z - mid) % 360 + 540) % 360 - 180) < gap / 2)) return;
        if (!best || gap > best.gap) best = { gap, mid };
      });
      const D = Math.min(26, Math.max(14, 11 / Math.sin(best.gap * Math.PI / 360)));
      const P = bod(V.x + smer(best.mid).x * D, V.y + smer(best.mid).y * D); obsaz.push(P);
      return napis(P.x, P.y + 4, text, VRCHOL); };
    const uhel = (V, a, b, R, D, text, barva) => { const mx = a.x + b.x, my = a.y + b.y, ml = Math.hypot(mx, my);
      obsaz.push(bod(V.x + mx / ml * D, V.y + my / ml * D)); return oblouk(V, a, b, R, barva) + stitek(V, a, b, D, text, barva); };
    /* 🔴 Název přímky na PEVNÉM konci narážel na popisek vrcholu: když
       C vyšlo u horního okraje, ležel název přímky b přes „C" (13 ze 106
       kreseb). Zkouší se proto oba konce i obě strany čáry a bere se místo
       nejdál od všeho, co už v obrázku je. */
    const jmeno = (konce, text) => {
      let best = null, bs = -1;
      konce.forEach(([K, d]) => [1, -1].forEach(s => {
        const P = bod(K.x + d.x * 14 - d.y * 10 * s, K.y + d.y * 14 + d.x * 10 * s);
        const sc = Math.min(...obsaz.map(Q => Math.hypot(P.x - Q.x, P.y - Q.y)));
        if (sc > bs) { bs = sc; best = P; }
      }));
      obsaz.push(best); return napis(best.x, best.y + 4, text, JMENO);
    };
    const kresba = cara(c1, c2, CARA) + cara(b1, b2, CARA) + cara(a1, a2, CARA)
      + uhel(A, smer(0), smer(al), 22, 36, 'α', HLEDANY)
      + uhel(B, smer(180), smer(180 - be), 22, 36, 'β', HLEDANY)
      + uhel(C, smer(180 + al), smer(-be), 20, 34, 'γ', HLEDANY)
      + uhel(B, smer(0), smer(180 - be), 14, 30, (180 - be) + '°', ZADANY)
      + ven(A, [0, al, 180, 180 + al], [al / 2], 'A')
      + ven(B, [180, 180 - be, 0, -be], [180 - be / 2, 90 - be / 2], 'B')
      + ven(C, [180 + al, -be, 180 - be, al], [270 + (al - be) / 2], 'C');
    return `<svg viewBox="0 0 ${W} ${H}">` + kresba
      + jmeno([[a1, smer(180 - be)], [a2, smer(-be)]], 'a') + jmeno([[b1, smer(al)], [b2, smer(180 + al)]], 'b')
      + jmeno([[c1, smer(0)], [c2, smer(180)]], 'c')
      + `</svg>`;
  }

  function gen7d() {
    // 3 body — přímky jedním bodem, rovnoběžka a kolmice (věrné M9A/2025, úloha 7)
    const fp = pick([25, 30, 35]), fq = fp + pick([15, 20, 25, 30].filter(d => fp + d >= 45 && fp + d <= 60));
    const tupy = 180 - fq;
    return {
      no: 7, points: 3, title: 'Přímky jedním bodem a kolmice', okruh: 'geometrie',
      svg: svgSvazek(fp, fq),
      intro: `V rovině leží přímky p, q, r, které se protínají v bodě R, a přímky s, t, pro které platí s ∥ r a s ⊥ t. Velikosti některých úhlů jsou vyznačeny v obrázku.`,
      parts: [
        { key: '7.1', points: 1, prompt: 'Vypočítejte ve stupních velikost úhlu α.', ans: String(fp),
          sol: [`Přímka p protíná obě rovnoběžky r a s. Úhly, které leží mezi rovnoběžkami na opačných stranách příčky, jsou střídavé — a střídavé úhly jsou shodné.`,
            `Vyznačený úhel ${fp}° u bodu R (mezi r a p, pod přímkou r) a úhel α u přímky s jsou právě takové střídavé úhly.`,
            `α = ${fp}°.`] },
        { key: '7.2', points: 1, prompt: 'Vypočítejte ve stupních velikost úhlu β.', ans: String(fq),
          sol: [`Úhel ${tupy}° u bodu R a úhel, který svírá přímka q s přímkou r vlevo pod ní, jsou vedlejší — dohromady tvoří přímý úhel 180°.`,
            `Ten vedlejší úhel má 180 − ${tupy} = ${fq}°.`,
            `S úhlem β je střídavý (r ∥ s, příčka q), takže β = ${fq}°.`] },
        { key: '7.3', points: 1, prompt: 'Vypočítejte ve stupních velikost úhlu γ.', ans: String(90 + fq),
          sol: [`Přímka t je kolmá k s, a protože s ∥ r, je kolmá i k r. Přímky q, r, t proto ohraničují pravoúhlý trojúhelník.`,
            `Jeho úhel u bodu R je vedlejší k vyznačenému úhlu ${tupy}°, tedy 180 − ${tupy} = ${fq}°. U přímky t je pravý úhel, takže u průsečíku q a t zbývá 180 − 90 − ${fq} = ${90 - fq}°.`,
            `Úhel γ je k němu vedlejší: γ = 180 − ${90 - fq} = ${90 + fq}°.`] }
      ]
    };
  }

  function gen7e() {
    // 3 body — kružnice opsaná, výška a osa úhlu (věrné M9A/2026, úloha 8: φ za 1 bod, α za 2)
    const fi = ri(8, 30), be = 2 * fi, al = 90 - be, dany = 90 + fi;
    const vedl = [`Přímky q a o se protínají v bodě X. Vyznačený úhel ${dany}° a úhel mezi q (směrem dolů k AB) a o (směrem k B) jsou vedlejší: 180 − ${dany} = ${90 - fi}°.`,
      `Ten úhel patří trojúhelníku, který tvoří q, strana AB a osa o. U strany AB má pravý úhel (q ⊥ AB), takže u vrcholu B mu zbývá 180 − 90 − ${90 - fi} = ${fi}°.`];
    return {
      no: 7, points: 3, title: 'Kružnice opsaná a osa úhlu', okruh: 'geometrie',
      svg: svgThales(be),
      intro: `Trojúhelník ABC je vepsaný do kružnice k, jejíž střed S leží na straně AB. Přímka q prochází vrcholem C a je kolmá ke straně AB. Přímka o je osou vnitřního úhlu při vrcholu B. Velikost jednoho úhlu je vyznačena v obrázku.`,
      parts: [
        { key: '7.1', points: 1, prompt: 'Vypočítejte ve stupních velikost úhlu φ.', ans: String(fi),
          sol: [...vedl, `Osa o dělí úhel při vrcholu B na dvě shodné poloviny; úhel ${fi}° je jedna z nich a φ ta druhá: φ = ${fi}°.`] },
        { key: '7.2', points: 2, prompt: 'Vypočítejte ve stupních velikost úhlu α.', ans: String(al),
          sol: [`Střed S kružnice opsané leží na straně AB, takže AB je průměr. Podle Thaletovy věty je úhel při vrcholu C pravý.`,
            ...vedl,
            `Osa půlí úhel při B, celý je tedy β = 2 · ${fi} = ${be}°.`,
            `α = 180 − 90 − ${be} = ${al}°.`] }
      ]
    };
  }

  function gen7f() {
    // 3 body — trojúhelník vymezený přímkami, vnější úhel a poměr úhlů (věrné M9C/2024)
    const moznosti = [];
    [[2, 3], [3, 4], [1, 2], [2, 5], [3, 5], [4, 5], [3, 2], [4, 3]].forEach(([m, n]) => {
      for (let E = 100; E <= 150; E++) {
        if (E % (m + n)) continue;
        const d = E / (m + n), al = m * d, ga = n * d, be = 180 - E;
        if (al >= 25 && ga >= 25 && be >= 30 && Math.max(al, be, ga) > Math.min(al, be, ga)) moznosti.push([m, n, E]);
      }
    });
    const [m, n, E] = pick(moznosti), d = E / (m + n), al = m * d, ga = n * d, be = 180 - E;
    const nej = Math.max(al, be, ga), nejm = Math.min(al, be, ga);
    return {
      no: 7, points: 3, title: 'Trojúhelník z přímek', okruh: 'geometrie',
      svg: svgTriPrimky(al, be, ga),
      intro: `Trojúhelník ABC je vymezen třemi různoběžkami a, b, c. Přímky a a c svírají úhel ${E}° (vyznačen v obrázku) a velikosti vnitřních úhlů α a γ jsou v poměru ${m} : ${n}.`,
      parts: [
        { key: '7.1', points: 1, prompt: 'Vypočítejte ve stupních velikost vnitřního úhlu β.', ans: String(be),
          sol: [`Přímky a a c se protínají ve vrcholu B. Vyznačený úhel ${E}° a vnitřní úhel β leží u vrcholu B vedle sebe — jsou vedlejší, dohromady tvoří 180°.`,
            `Úhel β tedy doplňuje ${E}° do přímého úhlu.`,
            `β = 180 − ${E} = ${be}°.`] },
        { key: '7.2', points: 1, prompt: 'Vypočítejte ve stupních velikost vnitřního úhlu γ.', ans: String(ga),
          sol: [`Součet vnitřních úhlů je 180° a β = 180 − ${E}, takže na α a γ dohromady zbývá přesně ${E}° — vnější úhel se rovná součtu dvou vnitřních úhlů, které k němu nepřiléhají.`,
            `Poměr α : γ = ${m} : ${n} dělí ${E}° na ${m + n} stejných dílů: 1 díl = ${E} : ${m + n} = ${d}°.`,
            `Úhel γ má ${n} ${skl(n, 'díl', 'díly', 'dílů')}: γ = ${n} · ${d} = ${ga}°.`] },
        { key: '7.3', points: 1, prompt: 'O kolik stupňů je největší vnitřní úhel trojúhelníku ABC větší než nejmenší?', ans: String(nej - nejm),
          sol: [`Nejdřív potřebuješ všechny tři vnitřní úhly: β je vedlejší k vyznačenému úhlu, α a γ vzniknou rozdělením ${E}° v poměru ${m} : ${n}.`,
            `β = 180 − ${E} = ${be}°; 1 díl = ${E} : ${m + n} = ${d}°, takže α = ${m} · ${d} = ${al}° a γ = ${n} · ${d} = ${ga}°.`,
            `Největší je ${nej}°, nejmenší ${nejm}°: rozdíl ${nej} − ${nejm} = ${nej - nejm}°.`] }
      ]
    };
  }

  const tis = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');     // 1600000 → „1 600 000"
  const ODEBRANO = [[1, 2, 'polovinu', 'zůstane polovina'], [1, 3, 'třetinu', 'zůstanou dvě třetiny'],
    [1, 4, 'čtvrtinu', 'zůstanou tři čtvrtiny'], [1, 5, 'pětinu', 'zůstanou čtyři pětiny'], [2, 5, 'dvě pětiny', 'zůstanou tři pětiny']];
  function gen6e() {
    // 2 body — sud, kbelík, konvička + převod jednotek objemu (věrné M9A/2023, úloha 2)
    let a, b, konv, f, sud, zbylo;
    do {
      a = pick([10, 12, 15, 20]); b = pick([4, 5, 6, 8]); konv = pick([0.5, 1, 1.2, 1.5, 2, 2.5]); f = pick(ODEBRANO);
      sud = r2(konv * a * b); zbylo = r2(sud * (f[1] - f[0]) / f[1]);
    } while (!Number.isInteger(sud) || !Number.isInteger(zbylo) || zbylo < 5 || sud > 400);
    const kbelik = r2(konv * b), dil = sud / f[1], k = f[1] - f[0];
    const N = pick([50, 60, 80, 100, 120, 150, 200, 250]), Vk = pick([8, 27]);
    return {
      no: 6, points: 2, title: 'Sud, kbelík a konvička', okruh: 'slovni',
      parts: [
        { key: '6.1', points: 1,
          prompt: `Vnitřní objem sudu je ${a}krát větší než objem kbelíku. Objem kbelíku je ${b}krát větší než objem konvičky. Ze sudu plného vody jsme ${f[2]} vody odebrali, takže v něm zbylo ${zbylo} litrů vody. Vypočítejte v litrech objem konvičky.`,
          ans: String(konv),
          sol: [`Zbylá voda je jen část sudu: když ${f[2]} odebereš, ${f[3]}. Celý objem sudu proto dopočítáš ze zbytku — ne tak, že ke zbytku přičteš ${f[2]} zbytku.`,
            `Sud si rozděl na ${f[1]} ${skl(f[1], 'stejný díl', 'stejné díly', 'stejných dílů')}; zbylá voda zabírá ${k} z nich. 1 díl = ${zbylo} : ${k} = ${dil} l, celý sud = ${f[1]} · ${dil} = ${sud} l.`,
            `Kbelík = ${sud} : ${a} = ${cz(kbelik)} l, konvička = ${cz(kbelik)} : ${b} = ${cz(konv)} l.`] },
        { key: '6.2', points: 1,
          prompt: `Kvádr je možné beze zbytku rozřezat na ${N} krychlí, z nichž každá má objem ${Vk} dm³. Na kolik krychliček o objemu 1 cm³ lze tento kvádr beze zbytku rozřezat?`,
          ans: String(N * Vk * 1000),
          sol: [`Krychliček o objemu 1 cm³ je přesně tolik, kolik cm³ má celý kvádr. Stačí tedy spočítat objem kvádru a převést ho na cm³ — pozor, 1 dm³ = 1000 cm³, ne 100.`,
            `Objem kvádru: ${N} · ${Vk} = ${N * Vk} dm³.`,
            `V cm³: ${N * Vk} · 1000 = ${tis(N * Vk * 1000)} cm³, tedy ${tis(N * Vk * 1000)} krychliček.`] }
      ]
    };
  }

  function gen6f() {
    // 2 body — přelévání mezi válci se stejnou výškou (věrné M9C/2024, úloha 2)
    const k = pick([2, 3]), d1 = pick([6, 8, 10, 12].filter(d => d * k <= 30)), d2 = k * d1;
    const v = k === 2 ? pick([12, 16, 20, 24, 28]) : pick([18, 27, 36]), h = v / (k * k);
    return {
      no: 6, points: 2, title: 'Přelévání vody', okruh: 'telesa',
      intro: `Dvě válcové nádoby A a B mají stejnou výšku v = ${v} cm. Nádoba A má průměr podstavy ${d1} cm, nádoba B má průměr podstavy ${d2} cm. Nádoba A je naplněna až po okraj vodou, nádoba B je prázdná.`,
      parts: [
        { key: '6.1', points: 1, prompt: `Do jaké výšky (v cm) bude sahat voda v nádobě B, když do ní přelijeme všechnu vodu z nádoby A?`,
          ans: String(h),
          sol: [`Přelitím se objem vody nemění. Objem válce je π · r² · v, a protože π je v obou nádobách stejné, stačí porovnávat obsahy podstav — π dosazovat nemusíš.`,
            `Nádoba B má ${k}krát větší průměr, tedy i poloměr, a její podstava je ${k} · ${k} = ${k * k}krát větší.`,
            `Stejný objem na ${k * k}krát větší podstavě sahá do ${k * k}krát menší výšky: ${v} : ${k * k} = ${h} cm.`] },
        { key: '6.2', points: 1, prompt: `Kolikrát bychom museli nádobu A naplnit a přelít do nádoby B, aby byla nádoba B plná až po okraj?`,
          ans: String(k * k),
          sol: [`Obě nádoby jsou stejně vysoké, takže poměr jejich objemů je stejný jako poměr obsahů podstav. A obsah kruhu roste s DRUHOU mocninou poloměru.`,
            `Poměr průměrů (a tedy i poloměrů) je ${d2} : ${d1} = ${k}.`,
            `Poměr podstav, a tedy i objemů: ${k} · ${k} = ${k * k}.`] }
      ]
    };
  }

  // Čtverec, ze kterého se u horní strany odstřihnou dva shodné pravoúhlé trojúhelníky.
  function svgRohy(a, c) {
    const W = 260, H = 222, S = 166, L = 47, T = 24, R = L + S, B = T + S, xx = (S - c * S / a) / 2;
    const troj = (x1, x2) => `<polygon points="${x1},${T} ${r1(x2)},${T} ${x1},${B}" fill="#1b2742" stroke="#8a9bc4" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    return `<svg viewBox="0 0 ${W} ${H}">`
      + troj(L, L + xx) + troj(R, R - xx)
      + `<polygon points="${L},${B} ${r1(L + xx)},${T} ${r1(R - xx)},${T} ${R},${B}" fill="#12233a" stroke="${CARA}" stroke-width="2.5"/>`
      + napis((L + R) / 2, B + 20, `${a} cm`, JMENO) + napis((L + R) / 2, T - 8, `${c} cm`, JMENO)
      + `</svg>`;
  }

  function gen8d() {
    // 4 body — ze čtverce se odstřihnou dva shodné trojúhelníky, zbude lichoběžník (věrné M9D/2025, úloha 8)
    /* Ramena lichoběžníku jsou přepony odstřižených trojúhelníků, proto
       pythagorejské trojice (x, a, s): x = odstřižený kus horní strany,
       a = strana čtverce. Kratší základna c = a − 2x musí vyjít kladná. */
    const [x, a, s] = pick([[5, 12, 13], [7, 24, 25], [10, 24, 26], [15, 36, 39], [12, 35, 37], [9, 40, 41]]);
    const c = a - 2 * x, obvod = a + c + 2 * s, lich = (a + c) * a / 2;
    return {
      no: 8, points: 4, title: 'Odstřižené rohy', okruh: 'geometrie',
      svg: svgRohy(a, c),
      intro: `Ze čtverce o straně délky ${a} cm odstřihneme u horní strany dva shodné pravoúhlé trojúhelníky (v obrázku čárkovaně). Vznikne tak rovnoramenný lichoběžník, jehož kratší základna má délku ${c} cm.`,
      parts: [
        { key: '8.1', points: 1, prompt: `Určete, o kolik cm² je obsah čtverce větší než obsah lichoběžníku.`, ans: String(x * a),
          sol: [`Rozdíl obsahů je přesně to, co jsme odstřihli: dva shodné pravoúhlé trojúhelníky. Jejich odvěsny jsou celá boční strana čtverce a kus horní strany, který zbyl vedle kratší základny.`,
            `Kus horní strany: (${a} − ${c}) : 2 = ${x} cm. Jeden trojúhelník: ${x} · ${a} : 2 = ${x * a / 2} cm².`,
            `Dva trojúhelníky: 2 · ${x * a / 2} = ${x * a} cm².`] },
        { key: '8.2', points: 2, prompt: `Vypočítejte v cm obvod lichoběžníku.`, ans: String(obvod),
          sol: [`Obvod lichoběžníku = obě základny + obě ramena. Ramena jsou přepony odstřižených pravoúhlých trojúhelníků, takže je spočítáš Pythagorovou větou.`,
            `Odvěsny trojúhelníku: (${a} − ${c}) : 2 = ${x} cm a ${a} cm.`,
            `Rameno² = ${x}² + ${a}² = ${x * x} + ${a * a} = ${s * s}, rameno = √${s * s} = ${s} cm.`,
            `Obvod = ${a} + ${c} + 2 · ${s} = ${obvod} cm.`] },
        { key: '8.3', points: 1, prompt: `Vypočítejte v cm² obsah lichoběžníku.`, ans: String(lich),
          sol: [`Obsah lichoběžníku = (součet základen) · výška : 2. Výška je tu celá strana čtverce, protože obě základny leží na protějších stranách čtverce.`,
            `(${a} + ${c}) · ${a} : 2 = ${lich} cm².`,
            `Kontrola přes odstřižené kusy: ${a} · ${a} − 2 · ${x * a / 2} = ${lich} cm².`] }
      ]
    };
  }

  function gen8e() {
    // 4 body — trojúhelníková nerovnost: nejmenší a největší obvod (věrné M9B/2026, úloha 8)
    const a = ri(4, 12), b = a + ri(8, 25);
    const cMin = b - a + 1, cMax = a + b - 1, hodnot = cMax - cMin + 1;
    const pravidlo = `Trojúhelník existuje, jen když je každá strana kratší než součet dvou ostatních (trojúhelníková nerovnost). Pro stranu c z toho plyne b − a < c < a + b.`;
    const cele = `Strany a, b i obvod jsou celá čísla, takže i c = obvod − a − b je celé číslo.`;
    return {
      no: 8, points: 4, title: 'Strana trojúhelníku', okruh: 'geometrie',
      intro: `Délky dvou stran trojúhelníku ABC jsou a = ${a} cm, b = ${b} cm. Obvod trojúhelníku ABC v cm je vyjádřen celým číslem.`,
      parts: [
        { key: '8.1', points: 1, prompt: `Určete, kolik cm musí měřit strana c, aby byl obvod trojúhelníku ABC nejmenší možný.`, ans: String(cMin),
          sol: [pravidlo, `${cele} Musí platit c > ${b} − ${a}, tedy c > ${b - a}.`, `Nejmenší celé c větší než ${b - a} je ${b - a} + 1 = ${cMin} cm.`] },
        { key: '8.2', points: 1, prompt: `Určete, kolik cm musí měřit strana c, aby byl obvod trojúhelníku ABC největší možný.`, ans: String(cMax),
          sol: [pravidlo, `${cele} Musí platit c < ${a} + ${b}, tedy c < ${a + b}.`, `Největší celé c menší než ${a + b} je ${a + b} − 1 = ${cMax} cm.`] },
        { key: '8.3', points: 2, prompt: `Kolik různých hodnot může mít obvod trojúhelníku ABC?`, ans: String(hodnot),
          sol: [`Obvod a + b + c se mění jen se stranou c, takže různých obvodů je tolik, kolik je přípustných celých délek c. ${pravidlo.split('. ')[1]}`,
            `c může být ${cMin}, ${cMin + 1}, …, ${cMax} (celá čísla mezi ${b - a} a ${a + b}).`,
            `Počet hodnot: ${cMax} − ${cMin} + 1 = ${hodnot}.`] }
      ]
    };
  }

  function gen8f() {
    // 4 body — čtverec a obdélník se stejným obvodem, rovnice (věrné M9A/2023, úloha 8)
    const p = pick([20, 25, 50]), d = ri(4, 15);
    // r2: 4 − 3,6 je v plovoucí čárce 0,3999999999999999 — do postupu nesmí.
    const a = 100 * d / p, kr = a * (100 - p) / 100, dl = a + d, zb = (100 - p) / 100, koef = r2(2 * (1 + zb)), zbyva = r2(4 - koef);
    const rovnice = `4a = 2 · (${cz(zb)}a + a + ${d}) = ${cz(koef)}a + ${2 * d}`;
    const reseni = p === 50 ? `4a − 3a = ${2 * d}, tedy a = ${a} m.`
      : `${cz(zbyva)}a = ${2 * d}, tedy a = ${2 * d} : ${cz(zbyva)} = ${a} m.`;
    return {
      no: 8, points: 4, title: 'Dva pozemky', okruh: 'geometrie',
      intro: `Čtvercový pozemek má stejný obvod jako obdélníkový pozemek. Obdélníkový pozemek má jednu stranu o ${p} % kratší než čtvercový pozemek a druhou stranu o ${d} m delší než čtvercový pozemek. Délku strany čtvercového pozemku označíme a.`,
      parts: [
        { key: '8.1', points: 2, prompt: `Vypočítejte v metrech délku a strany čtvercového pozemku.`, ans: String(a),
          sol: [`Stejný obvod znamená rovnici: obvod čtverce 4a se rovná obvodu obdélníku, tedy dvojnásobku součtu jeho stran. Obě strany obdélníku nejdřív vyjádři pomocí a.`,
            `Kratší strana je o ${p} % kratší než a, tedy ${cz(zb)}a; delší je a + ${d}. Rovnice: ${rovnice}.`,
            reseni] },
        { key: '8.2', points: 1, prompt: `Vypočítejte v metrech délku kratší strany obdélníkového pozemku.`, ans: String(kr),
          sol: [`Kratší strana obdélníku je o ${p} % kratší než strana čtverce — zůstává z ní ${100 - p} % délky a. Nejdřív proto potřebuješ a.`,
            `Ze stejného obvodu (${rovnice}) vychází a = ${a} m.`,
            `Kratší strana = ${cz(zb)} · ${a} = ${kr} m.`] },
        { key: '8.3', points: 1, prompt: `Vypočítejte, o kolik m² se liší obsahy obdélníkového a čtvercového pozemku.`, ans: String(a * a - kr * dl),
          sol: [`Obsah čtverce je a · a, obsah obdélníku součin jeho dvou stran. Ze stejného obvodu vychází a = ${a} m, strany obdélníku jsou tedy ${kr} m a ${a} + ${d} = ${dl} m.`,
            `Čtverec: ${a} · ${a} = ${a * a} m², obdélník: ${kr} · ${dl} = ${kr * dl} m².`,
            `Rozdíl: ${a * a} − ${kr * dl} = ${a * a - kr * dl} m².`] }
      ]
    };
  }

  function gen9d() {
    // 4 body — rovnoramenný trojúhelník: z obvodu rameno, výška, obsah (věrné M9A/2026, úloha 13)
    // [polovina základny, výška, rameno]; M9A/2026: základna 16, obvod 50 → obsah 120.
    const [h0, v, r] = pick([[8, 15, 17], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15], [6, 8, 10], [8, 6, 10], [15, 8, 17], [7, 24, 25], [12, 16, 20], [16, 12, 20]]);
    const z = 2 * h0, O = z + 2 * r;
    return {
      no: 9, points: 4, title: 'Rovnoramenný trojúhelník',
      svg: svgTriangle('rovnoram', { v: ['K', 'L', 'M'] }),
      intro: `Rovnoramenný trojúhelník KLM se základnou LM délky ${z} cm má obvod ${O} cm.`,
      parts: [
        { key: '9.1', points: 4, showExplain: true,
          prompt: `Vypočítejte obsah trojúhelníku KLM (v cm²). Uveďte celý postup.`, ans: String(z * v / 2),
          sol: [`K obsahu potřebuješ základnu a výšku na ni. Výška z vrcholu K rozpůlí základnu LM a s ramenem tvoří pravoúhlý trojúhelník, ve kterém je rameno přeponou.`,
            `Obě ramena jsou stejná: (${O} − ${z}) : 2 = ${r} cm. Polovina základny: ${z} : 2 = ${h0} cm.`,
            `Výška (Pythagorova věta): v² = ${r * r} − ${h0 * h0} = ${v * v}, v = √${v * v} = ${v} cm.`,
            `Obsah: ${z} · ${v} : 2 = ${z * v / 2} cm².`] }
      ]
    };
  }

  function gen9e() {
    // 4 body — pravoúhlý lichoběžník: šikmé rameno Pythagorovou větou, pak obvod
    const [dx, v, b] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [9, 12, 15], [12, 5, 13], [8, 15, 17], [12, 9, 15]]);
    const c = ri(4, 15), a = c + dx, obvod = a + b + c + v;
    return {
      no: 9, points: 4, title: 'Pravoúhlý lichoběžník',
      intro: `Pravoúhlý lichoběžník ABCD má základny AB = ${a} cm a CD = ${c} cm a pravý úhel při vrcholu A. Rameno AD je kolmé k oběma základnám a měří ${v} cm.`,
      parts: [
        { key: '9.1', points: 4, showExplain: true,
          prompt: `Vypočítejte obvod lichoběžníku ABCD (v cm). Uveďte celý postup.`, ans: String(obvod),
          sol: [`Obvod je součet všech čtyř stran. Neznáš jen šikmé rameno BC — dopočítáš ho z pravoúhlého trojúhelníku, který vznikne, když z vrcholu C spustíš kolmici na základnu AB.`,
            `Ten trojúhelník má odvěsny ${v} cm (stejně jako AD) a ${a} − ${c} = ${dx} cm (o tolik je AB delší než CD).`,
            `BC² = ${v * v} + ${dx * dx} = ${b * b}, BC = √${b * b} = ${b} cm.`,
            `Obvod = ${a} + ${b} + ${c} + ${v} = ${obvod} cm.`] }
      ]
    };
  }

  function gen9f() {
    // 4 body — kosočtverec z úhlopříček: strana Pythagorovou větou, pak obvod
    const [e2, f2, s] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25]]);
    return {
      no: 9, points: 4, title: 'Kosočtverec',
      intro: `Kosočtverec ABCD má úhlopříčky délek e = ${2 * e2} cm a f = ${2 * f2} cm.`,
      parts: [
        { key: '9.1', points: 4, showExplain: true,
          prompt: `Vypočítejte obvod kosočtverce (v cm). Uveďte celý postup.`, ans: String(4 * s),
          sol: [`Úhlopříčky kosočtverce jsou na sebe kolmé a navzájem se půlí. Rozdělí ho tak na čtyři shodné pravoúhlé trojúhelníky, jejichž přeponou je strana kosočtverce.`,
            `Odvěsny: ${2 * e2} : 2 = ${e2} cm a ${2 * f2} : 2 = ${f2} cm.`,
            `Strana² = ${e2 * e2} + ${f2 * f2} = ${s * s}, strana = √${s * s} = ${s} cm.`,
            `Obvod = 4 · ${s} = ${4 * s} cm.`] }
      ]
    };
  }

  /* ══ Pozice 16: obrazce a posloupnosti (ostrá úloha 16, 2026-09-24) ══
     V ostrých testech je úloha 16 skoro vždy „nestandardní": obrazce, které
     rostou podle pravidla, nebo děj krok po kroku. Všech sedm nových variant
     je ověřených proti klíčům (M9A/2023, M9B/2023, M9A/2025, M9C/2025,
     M9A/2026, M9B/2026; M9B/2025 dopočtem). Barvy: BILA a SEDA vyjdou ve
     světlém motivu přijímaček jako bílá a šedá (PZ.themeSvg, SVG_MAP). */
  const BILA = '#1b2742', SEDA = '#8a9bc4', TMAVA = '#1b6f8f';
  const HORNI = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  const mocnina = (z, e) => z + String(e).split('').map(c => HORNI[+c]).join('');
  const poly = (body, fill) => `<polygon points="${body.map(b => r1(b.x) + ',' + r1(b.y)).join(' ')}" fill="${fill}" stroke="${CARA}" stroke-width="1"/>`;

  // M9A/2023: bílý trojúhelník, každý bílý se dělí na 4 a prostřední zešedne. Obrazce 1–3.
  function svgSierpinski() {
    const s = 84, h = s * Math.sqrt(3) / 2;
    let out = `<svg viewBox="0 0 300 118">`;
    const tri = (A, B, C, hl) => {
      if (!hl) { out += poly([A, B, C], BILA); return; }
      const ab = bod((A.x + B.x) / 2, (A.y + B.y) / 2), bc = bod((B.x + C.x) / 2, (B.y + C.y) / 2), ca = bod((C.x + A.x) / 2, (C.y + A.y) / 2);
      out += poly([ab, bc, ca], SEDA);
      tri(A, ab, ca, hl - 1); tri(ab, B, bc, hl - 1); tri(ca, bc, C, hl - 1);
    };
    [0, 1, 2].forEach(k => {
      const x0 = 12 + k * 96, y0 = 8 + h;
      tri(bod(x0, y0), bod(x0 + s, y0), bod(x0 + s / 2, y0 - h), k);
      out += napis(x0 + s / 2, y0 + 18, (k + 1) + '. obrazec', VRCHOL);
    });
    return out + `</svg>`;
  }
  // M9B/2026: do čtverce se vkládá čtverec s vrcholy ve středech stran, střídavě šedý a bílý. Obrazce 1–4.
  function svgVkladane() {
    const a = 60;
    let out = `<svg viewBox="0 0 300 96">`;
    [1, 2, 3, 4].forEach(n => {
      const x0 = 12 + (n - 1) * 72, y0 = 6;
      let q = [bod(x0, y0), bod(x0 + a, y0), bod(x0 + a, y0 + a), bod(x0, y0 + a)];
      out += poly(q, BILA);
      for (let j = 2; j <= n; j++) {
        q = q.map((P, i) => bod((P.x + q[(i + 1) % 4].x) / 2, (P.y + q[(i + 1) % 4].y) / 2));
        out += poly(q, j % 2 === 0 ? SEDA : BILA);
      }
      out += napis(x0 + a / 2, y0 + a + 20, n + '.', VRCHOL);   // „1. obrazec" je širší než rozteč 72 px a popisky se překrývaly
    });
    return out + `</svg>`;
  }
  // M9C/2025: šestiúhelník z trojúhelníčků, sousední mají různou barvu. Obrazce 1–3.
  function svgSestiuhelnik() {
    const s = 11, v = s * Math.sqrt(3) / 2, cy = 42, r3 = Math.sqrt(3);
    let out = `<svg viewBox="0 0 300 100">`;
    [[1, 44], [2, 130], [3, 240]].forEach(([n, cx]) => {
      const R = n * s, P = (a, b) => bod(cx + (a + b / 2) * s, cy + b * v);
      for (let j = -2 * n; j < 2 * n; j++) for (let i = -3 * n; i <= 3 * n; i++) {
        [[P(i, j), P(i + 1, j), P(i, j + 1), BILA], [P(i + 1, j), P(i + 1, j + 1), P(i, j + 1), SEDA]].forEach(([A, B, C, f]) => {
          const tx = (A.x + B.x + C.x) / 3 - cx, ty = (A.y + B.y + C.y) / 3 - cy;
          if (Math.abs(ty) <= R * r3 / 2 && r3 * Math.abs(tx) + Math.abs(ty) <= r3 * R) out += poly([A, B, C], f);
        });
      }
      out += napis(cx, 92, n + '. obrazec', VRCHOL);
    });
    return out + `</svg>`;
  }
  // M9A/2025: bílý čtverec v pásu z obdélníčků 2 × 3 cm „do mlýnku" — tmavý (úzký pás) a světlý (široký).
  function svgObdelnicky() {
    const k = 8;
    let out = `<svg viewBox="0 0 300 128">`;
    const pas = (x0, y0, s, w, l, fill) => {
      const O = (s + 2 * w) * k, W = w * k, Lk = l * k, m = (s + w) / l, L = x0, T = y0, R = x0 + O, B = y0 + O;
      out += `<rect x="${L}" y="${T}" width="${O}" height="${O}" fill="${BILA}" stroke="${CARA}" stroke-width="1"/>`;
      for (let i = 0; i < m; i++) {
        out += `<rect x="${L + i * Lk}" y="${T}" width="${Lk}" height="${W}" fill="${fill}" stroke="${CARA}" stroke-width="1"/>`
          + `<rect x="${R - W}" y="${T + i * Lk}" width="${W}" height="${Lk}" fill="${fill}" stroke="${CARA}" stroke-width="1"/>`
          + `<rect x="${R - (i + 1) * Lk}" y="${B - W}" width="${Lk}" height="${W}" fill="${fill}" stroke="${CARA}" stroke-width="1"/>`
          + `<rect x="${L}" y="${B - (i + 1) * Lk}" width="${W}" height="${Lk}" fill="${fill}" stroke="${CARA}" stroke-width="1"/>`;
      }
      return O;
    };
    const O1 = pas(24, 8, 4, 2, 3, TMAVA), O2 = pas(160, 8, 5, 3, 2, BILA);
    return out + napis(24 + O1 / 2, 8 + O2 + 16, 'tmavý', VRCHOL) + napis(160 + O2 / 2, 8 + O2 + 16, 'světlý', VRCHOL) + `</svg>`;
  }

  function gen16d() {
    // 4 body — trojúhelníkové obrazce (věrné M9A/2023, úloha 16; klíč 81, 364, 19 683)
    const k = ri(4, 6), m = ri(5, 7), n = ri(8, 10);
    const bile = i => 3 ** (i - 1), sede = i => (3 ** (i - 1) - 1) / 2, D = 3 ** (n - 2);
    return {
      no: 16, points: 4, title: 'Trojúhelníkové obrazce',
      svg: svgSierpinski(),
      intro: `Prvním obrazcem je bílý rovnostranný trojúhelník. Každý další obrazec vznikne z předchozího obrazce podle následujících pravidel: 1. Nejprve každý bílý trojúhelník v obrazci rozdělíme na 4 shodné rovnostranné trojúhelníky. 2. Poté v každé takto vzniklé čtveřici bílých trojúhelníků obarvíme vnitřní trojúhelník na šedo.`,
      parts: [
        { key: '16.1', points: 1, prompt: `Určete, kolik bílých trojúhelníků obsahuje ${k}. obrazec.`, ans: String(bile(k)),
          sol: [`Každý bílý trojúhelník se v dalším obrazci rozpadne na 4 menší: tři krajní zůstanou bílé a prostřední zešedne. Počet bílých se tedy s každým obrazcem ZTROJNÁSOBÍ.`,
            `1. obrazec má 1 bílý trojúhelník, každý další třikrát víc: 1${' · 3'.repeat(k - 1)} = ${bile(k)}.`,
            `${k}. obrazec obsahuje ${bile(k)} bílých trojúhelníků.`] },
        { key: '16.2', points: 1, prompt: `${m}. obrazec obsahuje ${sede(m)} šedých trojúhelníků. Určete, kolik šedých trojúhelníků obsahuje ${m + 1}. obrazec.`, ans: String(sede(m) + bile(m)),
          sol: [`Při přechodu k dalšímu obrazci vznikne z KAŽDÉHO bílého trojúhelníku právě jeden nový šedý. Šedých tedy přibude tolik, kolik bylo v předchozím obrazci bílých.`,
            `${m}. obrazec má ${mocnina(3, m - 1)} = ${bile(m)} bílých trojúhelníků (bílých se každým krokem ztrojnásobí).`,
            `Šedých v ${m + 1}. obrazci: ${sede(m)} + ${bile(m)} = ${sede(m) + bile(m)}.`] },
        { key: '16.3', points: 2, prompt: `Počet šedých trojúhelníků v posledním a v předposledním obrazci se liší o ${tis(D)}. Určete, kolik bílých trojúhelníků obsahuje poslední obrazec.`, ans: String(3 * D),
          sol: [`Rozdíl počtu šedých mezi dvěma po sobě jdoucími obrazci je počet bílých v tom PŘEDCHOZÍM — z každého jeho bílého trojúhelníku vznikl jeden šedý.`,
            `Předposlední obrazec má tedy ${tis(D)} bílých trojúhelníků.`,
            `V posledním se bílých ztrojnásobí: 3 · ${tis(D)} = ${tis(3 * D)}.`] }
      ]
    };
  }

  const RADOVE = { 2: 'druhé', 3: 'třetí', 4: 'čtvrté', 5: 'páté', 6: 'šesté' };
  const PORADI = { 10: 'desáté', 20: 'dvacáté', 30: 'třicáté' };
  function gen16e() {
    // 4 body — roboti plní a vybírají nádobu (věrné M9A/2026, úloha 16; klíč 18, 28. s, 78)
    /* Dok přidá p míčků každou p-tou sekundu, Pat odebere r každou r-tou. Dvojice
       jsou vybrané tak, aby změna o 1 + p byla JEDNOZNAČNÁ: jiná sekunda dá 1,
       1 − r nebo 1 + p − r a žádná z nich nemá stejnou velikost jako 1 + p. */
    const [p, r] = pick([[2, 5], [3, 4], [3, 6]]), c = 1 + p;
    const zmena = t => 1 + (t % p ? 0 : p) - (t % r ? 0 : r);
    const stav = t => t + p * Math.floor(t / p) - r * Math.floor(t / r);
    const T1 = ri(11, 19), X = pick([20, 25, 30, 35]), N = pick([10, 20, 30]);
    let tX = 1; while (stav(tX) <= X) tX++;
    let kolik = 0, tN = 0; while (kolik < N) { tN++; if (zmena(tN) === c) kolik++; }
    const pr3 = [];
    for (let t = 1; pr3.length < 4; t++) if (zmena(t) === c) pr3.push(t);
    const mic = n => skl(n, 'míček', 'míčky', 'míčků');
    return {
      no: 16, points: 4, title: 'Roboti a míčky',
      intro: `Po spuštění automatu začali dva roboti Jas a Dok plnit prázdnou nádobu míčky a třetí robot Pat začal míčky odebírat. Jas dal do nádoby v každé sekundě 1 míček, Dok dal do nádoby v každé ${RADOVE[p]} sekundě ${p} ${mic(p)} najednou a Pat v každé ${RADOVE[r]} sekundě z nádoby ${r} ${mic(r)} najednou odebral.`,
      parts: [
        { key: '16.1', points: 1, prompt: `Určete počet míčků v nádobě na konci ${T1}. sekundy po spuštění automatu.`, ans: String(stav(T1)),
          sol: [`Roboti jednají nezávisle, takže stačí sečíst, kolik míčků za ${T1} sekund každý přidal nebo odebral. Kolikrát robot zasáhl, je počet násobků jeho periody mezi 1 a ${T1}.`,
            `Jas: ${T1} míčků. Dok zasáhl ${Math.floor(T1 / p)}krát: ${Math.floor(T1 / p)} · ${p} = ${p * Math.floor(T1 / p)}. Pat zasáhl ${Math.floor(T1 / r)}krát: ${Math.floor(T1 / r)} · ${r} = ${r * Math.floor(T1 / r)}.`,
            `V nádobě: ${T1} + ${p * Math.floor(T1 / p)} − ${r * Math.floor(T1 / r)} = ${stav(T1)} ${mic(stav(T1))}.`] },
        { key: '16.2', points: 1, prompt: `Určete, v kolikáté sekundě po spuštění počet míčků v nádobě poprvé překročil ${X}.`, ans: String(tX),
          sol: [`Počet míčků neroste rovnoměrně — v sekundě, kdy odebírá Pat, klesne. Proto nestačí dělit; stav v okolí hledaného okamžiku je potřeba sledovat sekundu po sekundě.`,
            `Stav na konci sekundy t je t + ${p} · (počet násobků ${p}) − ${r} · (počet násobků ${r}): ${tX - 2}. s → ${stav(tX - 2)}, ${tX - 1}. s → ${stav(tX - 1)}, ${tX}. s → ${stav(tX)}.`,
            `Poprvé je v nádobě víc než ${X} míčků na konci ${tX}. sekundy (${stav(tX)} ${mic(stav(tX))}), dřív nikdy.`] },
        { key: '16.3', points: 2, prompt: `V některých sekundách se oproti předchozí sekundě počet míčků v nádobě zvětšil celkem o ${c}. Určete počet míčků v nádobě v okamžiku, kdy k tomuto zvětšení došlo právě po ${PORADI[N]}.`, ans: String(stav(tN)),
          sol: [`Zvětšení o ${c} nastane jen v sekundě, kdy přidá Jas i Dok (1 + ${p} = ${c}) a Pat nic neodebere — tedy v násobcích ${p}, které nejsou násobky ${r}.`,
            `Takové sekundy jdou ${pr3.join(', ')}, …; ${N}. z nich je ${tN}. sekunda.`,
            `Na konci ${tN}. sekundy je v nádobě ${tN} + ${p} · ${Math.floor(tN / p)} − ${r} · ${Math.floor(tN / r)} = ${stav(tN)} ${mic(stav(tN))}.`] }
      ]
    };
  }

  function gen16f() {
    // 4 body — vkládané čtverce (věrné M9B/2026, úloha 16; klíč 17, 45. obrazec, 5/16)
    /* Vnitřní čtverec n-tého obrazce je šedý v sudém obrazci, bílý v lichém;
       každý dřívější čtverec úrovně j se rozpadl na 4 trojúhelníky své barvy. */
    const n1 = ri(8, 14), m = 2 * ri(15, 30) + 1, k = pick([4, 5, 6]);
    const sedych = n => (n % 2 === 0 ? 1 : 0) + 4 * Math.floor((n - 1) / 2);
    const W = 2 * m - 1, q = Math.floor((n1 - 1) / 2);
    // obsah celého obrazce = 1; trojúhelníky z úrovně j mají dohromady 1/2^j, vnitřní čtverec k-tého obrazce 1/2^(k−1)
    const cleny = [];
    for (let j = 2; j <= k - 1; j += 2) cleny.push(2 ** j);
    if (k % 2 === 0) cleny.push(2 ** (k - 1));
    const jm = 2 ** (k - 1), cit = cleny.reduce((a, d) => a + jm / d, 0), g = gcd(cit, jm);
    return {
      no: 16, points: 4, title: 'Vkládané čtverce',
      svg: svgVkladane(),
      intro: `První obrazec je bílý čtverec. Druhý obrazec vznikne z prvního vložením menšího šedého čtverce, jehož vrcholy leží ve středech stran bílého čtverce. Další obrazce vznikají střídavým vkládáním stále menších bílých a šedých čtverců, jejichž vrcholy vždy leží ve středech stran čtverce vloženého v předchozím obrazci. Druhý a každý další obrazec se potom skládá z bílých a šedých dílů. Např. třetí obrazec obsahuje 9 dílů — 1 bílý čtverec, 4 šedé trojúhelníky a 4 bílé trojúhelníky.`,
      parts: [
        { key: '16.1', points: 1, prompt: `Určete, kolik šedých dílů obsahuje ${n1}. obrazec.`, ans: String(sedych(n1)),
          sol: [`Vložením nového čtverce se ten předchozí rozpadne na 4 trojúhelníky své barvy. Šedé trojúhelníky tedy přibudou pokaždé, když se vkládá do ŠEDÉHO čtverce — šedé čtverce vznikají ve 2., 4., 6. … obrazci.`,
            `Do ${n1}. obrazce se šedý čtverec rozpadl ${q}krát: ${q} · 4 = ${4 * q} šedých trojúhelníků.${n1 % 2 ? '' : ` Navíc je v ${n1}. obrazci šedý i vnitřní čtverec.`}`,
            n1 % 2 ? `Šedých dílů je ${4 * q}.` : `Šedých dílů: ${4 * q} + 1 = ${4 * q + 1}.`] },
        { key: '16.2', points: 1, prompt: `Určete, kolikátý obrazec obsahuje ${W} bílých dílů.`, ans: String(m),
          sol: [`V lichém obrazci je vnitřní čtverec bílý a k tomu jsou tu 4 bílé trojúhelníky za každý dřívější bílý čtverec. V n-tém lichém obrazci je tak bílých dílů 1 + 4 · (n − 1) : 2 = 2n − 1.`,
            `V sudém obrazci je bílých dílů 4 · n : 2 = 2n, tedy vždy sudý počet. Lichých ${W} bílých dílů proto může mít jen lichý obrazec.`,
            `2n − 1 = ${W}, tedy n = (${W} + 1) : 2 = ${m}.`] },
        { key: '16.3', points: 2, prompt: `Vyjádřete zlomkem v základním tvaru, jakou část obsahu ${k}. obrazce představuje obsah všech jeho šedých dílů dohromady.`, ans: `${cit / g}/${jm / g}`,
          sol: [`Vrcholy vloženého čtverce leží ve středech stran předchozího, takže má POLOVIČNÍ obsah. Trojúhelníky, které kolem něj zbydou, tvoří dohromady druhou polovinu předchozího čtverce.`,
            `Obsah celého obrazce ber jako 1. Šedé jsou ${cleny.map(d => (d === 2 ** (k - 1) && k % 2 === 0 ? `vnitřní ${k}. čtverec (1/${d})` : `trojúhelníky kolem ${Math.log2(d) + 1}. čtverce (1/${d})`)).join(' a ')}.`,
            `Dohromady: ${cleny.map(d => '1/' + d).join(' + ')} = ${cit / g}/${jm / g}.`] }
      ]
    };
  }

  function gen16g() {
    // 4 body — šestiúhelníky z trojúhelníčků, pásy (věrné M9C/2025, úloha 16; klíč 42, 108, 38. obrazec)
    const k = ri(3, 7), m = ri(4, 9), n = ri(20, 60), G = 3 * (2 * n - 1);
    return {
      no: 16, points: 4, title: 'Šestiúhelníkové obrazce',
      svg: svgSestiuhelnik(),
      intro: `Vytváříme obrazce tvaru pravidelného šestiúhelníku složené z bílých a šedých shodných rovnostranných trojúhelníků; trojúhelníky se společnou stranou mají vždy různou barvu. První obrazec se skládá ze 3 bílých a 3 šedých trojúhelníků a každý další obrazec vznikne přidáním jednoho pásu trojúhelníků okolo předchozího obrazce.`,
      parts: [
        { key: '16.1', points: 1, prompt: `Vypočítejte, kolik trojúhelníků (bílých i šedých dohromady) obsahuje poslední přidaný pás ${k}. obrazce.`, ans: String(6 * (2 * k - 1)),
          sol: [`Šestiúhelník n-tého obrazce se skládá ze 6 velkých rovnostranných trojúhelníků o straně n a každý z nich z n · n trojúhelníčků — celkem 6n². Poslední pás je rozdíl dvou po sobě jdoucích obrazců.`,
            `${k}. obrazec: 6 · ${k} · ${k} = ${6 * k * k}, ${k - 1}. obrazec: 6 · ${k - 1} · ${k - 1} = ${6 * (k - 1) * (k - 1)}.`,
            `Poslední pás: ${6 * k * k} − ${6 * (k - 1) * (k - 1)} = ${6 * (2 * k - 1)} trojúhelníků.`] },
        { key: '16.2', points: 1, prompt: `Vypočítejte, kolik šedých trojúhelníků obsahuje celý ${m}. obrazec.`, ans: String(3 * m * m),
          sol: [`Sousední trojúhelníky mají různou barvu a bílých i šedých je v každém obrazci stejně (v 1. obrazci 3 a 3). Šedá je tedy přesně polovina všech trojúhelníků.`,
            `${m}. obrazec má 6 · ${m} · ${m} = ${6 * m * m} trojúhelníků.`,
            `Šedých: ${6 * m * m} : 2 = ${3 * m * m}.`] },
        { key: '16.3', points: 2, prompt: `Určete, kolikátý obrazec má v posledním přidaném pásu ${G} šedých trojúhelníků.`, ans: String(n),
          sol: [`Poslední pás n-tého obrazce má 6n² − 6(n − 1)² = 6 · (2n − 1) trojúhelníků a polovina z nich je šedá, tedy 3 · (2n − 1). Pozor: i 1. obrazec je takový „pás" (3 šedé), počítá se od něj.`,
            `3 · (2n − 1) = ${G}, tedy 2n − 1 = ${G} : 3 = ${2 * n - 1}.`,
            `n = (${2 * n - 1} + 1) : 2 = ${n}.`] }
      ]
    };
  }

  function gen16h() {
    // 4 body — vybarvování polí čtvercové sítě (věrné M9B/2023, úloha 16; klíč 32, o 19, 361 nebo 441)
    /* Do k-tého obrazce přibude 4 · (k − 1) polí (k ≥ 2), světlá v lichých, tmavá
       v sudých. Po 2q-tém obrazci je tmavých 4q² a světlých (2q − 1)². Ostré zadání
       má u 16.3 dvě řešení (361 i 441); tady je doplněné, že naposledy přibyla
       tmavá pole, aby odpověď byla jedna. */
    const n = ri(8, 14), m = ri(8, 12), q = ri(8, 14);
    const svetla = x => 1 + Array.from({ length: x }, (_, i) => i + 1).filter(i => i >= 3 && i % 2).reduce((a, i) => a + 4 * (i - 1), 0);
    const tmava = x => Array.from({ length: x }, (_, i) => i + 1).filter(i => i % 2 === 0).reduce((a, i) => a + 4 * (i - 1), 0);
    const lichy = Array.from({ length: m }, (_, i) => i + 1).filter(i => i >= 3 && i % 2).map(i => 4 * (i - 1));
    const sudy = Array.from({ length: m }, (_, i) => i + 1).filter(i => i % 2 === 0).map(i => 4 * (i - 1));
    const S = svetla(m), T = tmava(m);
    return {
      no: 16, points: 4, title: 'Vybarvování sítě',
      intro: `Vybarvováním některých prázdných polí čtvercové sítě postupně vytváříme obrazce. Prvním obrazcem je jedno světle vybarvené pole čtvercové sítě. Každý další obrazec vytvoříme z předchozího obrazce tak, že vybarvíme všechna prázdná pole, která mají s předchozím obrazcem společné pouze vrcholy. Tato nově vybarvená pole jsou u sudých obrazců tmavá a u lichých obrazců světlá. Druhý obrazec jsme vytvořili z prvního obrazce vybarvením 4 dalších polí tmavou barvou. Třetí obrazec má celkem 13 polí (9 světlých a 4 tmavé) a vytvořili jsme jej z druhého obrazce vybarvením 8 dalších polí světlou barvou.`,
      parts: [
        { key: '16.1', points: 1, prompt: `Určete, vybarvením kolika dalších polí jsme z ${n}. obrazce vytvořili ${n + 1}. obrazec.`, ans: String(4 * n),
          sol: [`Nová pole leží vždy dokola kolem obrazce a s každým krokem jich přibude o 4 víc: ze zadání 4 (na 2. obrazec) a 8 (na 3. obrazec).`,
            `Přírůstky tvoří řadu 4, 8, 12, …, takže z n-tého obrazce na další přibude 4 · n polí.`,
            `Z ${n}. na ${n + 1}. obrazec: 4 · ${n} = ${4 * n} polí.`] },
        { key: '16.2', points: 1, prompt: `Určete, o kolik se liší počet tmavých a světlých polí v ${m}. obrazci.`, ans: String(Math.abs(S - T)),
          sol: [`Světlá pole přibývají v lichých obrazcích a tmavá v sudých; do k-tého obrazce přibude 4 · (k − 1) polí. Obě barvy se proto sčítají zvlášť.`,
            `Světlá: 1 + ${lichy.join(' + ')} = ${S}. Tmavá: ${sudy.join(' + ')} = ${T}.`,
            `Rozdíl: ${Math.max(S, T)} − ${Math.min(S, T)} = ${Math.abs(S - T)}.`] },
        { key: '16.3', points: 2, prompt: `Obrazec má ${4 * q * q} tmavých polí a naposledy do něj přibyla tmavá pole. Určete, kolik má světlých polí.`, ans: String((2 * q - 1) ** 2),
          sol: [`Tmavá pole přibývají ve 2., 4., 6. … obrazci po 4, 12, 20, … kusech, tedy čtyřnásobky lichých čísel. Po 2q-tém obrazci je jich 4 · (1 + 3 + … ) = 4q², protože součet prvních q lichých čísel je q².`,
            `4q² = ${4 * q * q}, tedy q² = ${4 * q * q} : 4 = ${q * q} a q = ${q}. Naposledy přibyla tmavá pole, takže jde o ${2 * q}. obrazec.`,
            `Světlá pole ${2 * q}. obrazce jsou všechna z ${2 * q - 1}. obrazce: 1 + 8 + 16 + … + ${4 * (2 * q - 2)} = ${(2 * q - 1) ** 2}.`] }
      ]
    };
  }

  function gen16i() {
    // 4 body — Mirek a Zuzka odříkávají čísla (věrné M9B/2025, úloha 16)
    /* Trojice „Mirek liché, Mirek sudé, Zuzka součet": b-tá trojice je
       2b − 1, 2b, 4b − 1. Mezi prvními L čísly zazní dvakrát jen Zuzčin součet
       4k − 1, který Mirek stihne říct taky. */
    const a = 2 * ri(10, 30), b = ri(20, 40), P = 3 * b, C = 4 * b - 1, L = pick([120, 150, 180, 210]);
    const M = 2 * L / 3, nej = M % 4 === 3 ? M : M - ((M + 1) % 4);
    return {
      no: 16, points: 4, title: 'Mirek a Zuzka',
      intro: `Mirek a Zuzka odříkávali čísla následujícím způsobem: Mirek postupně odříkával všechna po sobě jdoucí přirozená čísla od 1 do 1 000. Za každým druhým číslem udělal krátkou pauzu, během níž Zuzka řekla součet posledních dvou čísel, která vyslovil Mirek. Na začátku tedy zazněla čísla 1, 2, 3, 3, 4, 7, 5, 6, 11, … (každé třetí číslo řekla Zuzka, ostatní Mirek).`,
      parts: [
        { key: '16.1', points: 1, prompt: `Určete číslo, které zaznělo mezi čísly ${a} a ${a + 1}.`, ans: String(2 * a - 1),
          sol: [`Čísla jdou po trojicích: Mirek řekne dvě po sobě jdoucí čísla (liché a sudé) a Zuzka hned jejich součet. Mezi ${a} a ${a + 1} tedy zazní součet dvojice, kterou sudé ${a} uzavírá.`,
            `Ta dvojice je ${a - 1} a ${a}.`,
            `Zuzka řekne ${a - 1} + ${a} = ${2 * a - 1}.`] },
        { key: '16.2', points: 1, prompt: `Jako ${P}. v pořadí bylo vysloveno číslo C, které později zaznělo ještě jednou. Určete číslo, které bylo vysloveno bezprostředně předtím, než podruhé zaznělo číslo C.`, ans: String(2 * C - 3),
          sol: [`Každá trojice je „Mirek liché, Mirek sudé, Zuzka součet". ${P}. číslo je tedy poslední v ${b}. trojici — Zuzčin součet.`,
            `${b}. trojice obsahuje Mirkova čísla ${2 * b - 1} a ${2 * b}, takže C = ${2 * b - 1} + ${2 * b} = ${C}. Podruhé ho řekne Mirek, a protože je liché, začíná jím novou trojici.`,
            `Bezprostředně před ním zazní Zuzčin součet předchozí dvojice: ${C - 2} + ${C - 1} = ${2 * C - 3}.`] },
        { key: '16.3', points: 2, prompt: `Určete největší číslo, které mezi prvními ${L} vyslovenými čísly zaznělo dvakrát.`, ans: String(nej),
          sol: [`Dvakrát může zaznít jen číslo, které řekne Zuzka jako součet A zároveň Mirek při počítání. Zuzčiny součty jsou 3, 7, 11, … — vždy o 4 víc, tedy čísla, která dávají po dělení 4 zbytek 3.`,
            `Mezi prvními ${L} čísly je ${L / 3} trojic, Mirek v nich došel do čísla 2 · ${L / 3} = ${M}; Zuzka došla mnohem dál, takže rozhoduje Mirek.`,
            `Největší číslo nejvýš ${M} se zbytkem 3 po dělení 4 je ${nej} (${nej} = 4 · ${(nej + 1) / 4} − 1); Zuzka ho řekla dřív, Mirek pak podruhé.`] }
      ]
    };
  }

  function gen16j() {
    // 4 body — čtvercové obrazce z obdélníčků 2 × 3 cm (věrné M9A/2025, úloha 16; klíč 24, o 12, 36)
    /* Pás „do mlýnku": každá strana má řadu, která pokrývá stranu obrazce bez
       jednoho rohu. Tmavý pás je široký 2 cm (obdélníček leží delší stranou 3 cm
       podél), světlý 3 cm (podél 2 cm). Řada tmavého: (A − 2) : 3 kusů. */
    const A = pick([14, 17, 20, 23, 26, 29]), B = pick([11, 17, 23, 29, 35]), Dl = pick([6, 8, 10, 12, 14]);
    const tm = O => 4 * (O - 2) / 3, sv = O => 4 * (O - 3) / 2;
    return {
      no: 16, points: 4, title: 'Obrazce z obdélníčků',
      svg: svgObdelnicky(),
      intro: `Vytváříme tmavé a světlé obrazce tvaru čtverce jako na obrázku. Každý takový obrazec obsahuje jeden bílý čtverec obklopený pásem z několika shodných obdélníčků. Každý obdélníček má rozměry 2 cm a 3 cm. Obdélníčky jsou buď tmavé, nebo světlé a jsou natočeny tak, že pás z tmavých obdélníčků je vždy užší (2 cm) než pás ze světlých obdélníčků (3 cm).`,
      parts: [
        { key: '16.1', points: 1, prompt: `Délka strany tmavého obrazce je ${A} cm. Určete počet obdélníčků v obrazci.`, ans: String(tm(A)),
          sol: [`Obdélníčky tvoří 4 stejné řady, po jedné u každé strany, a každá řada pokrývá stranu obrazce bez jednoho rohu (roh patří sousední řadě). V tmavém pásu (šířka 2 cm) leží obdélníček delší stranou 3 cm podél.`,
            `Jedna řada pokrývá ${A} − 2 = ${A - 2} cm, tedy ${A - 2} : 3 = ${(A - 2) / 3} obdélníčků.`,
            `Čtyři řady: 4 · ${(A - 2) / 3} = ${tm(A)} obdélníčků.`] },
        { key: '16.2', points: 1, prompt: `Délka strany tmavého i světlého obrazce je ${B} cm. Určete, o kolik se liší počet obdélníčků v těchto dvou obrazcích.`, ans: String(Math.abs(tm(B) - sv(B))),
          sol: [`Ve světlém pásu (šířka 3 cm) leží obdélníček kratší stranou 2 cm podél. Řada tedy pokrývá stranu bez rohu 3 cm, v tmavém bez rohu 2 cm.`,
            `Tmavý: 4 · (${B} − 2) : 3 = ${tm(B)}. Světlý: 4 · (${B} − 3) : 2 = ${sv(B)}.`,
            `Rozdíl: ${Math.max(tm(B), sv(B))} − ${Math.min(tm(B), sv(B))} = ${Math.abs(tm(B) - sv(B))}.`] },
        { key: '16.3', points: 2, prompt: `Tmavý i světlý obrazec mají stejný počet obdélníčků, ale délky stran bílých čtverců v těchto obrazcích se liší o ${Dl} cm. Určete počet obdélníčků v tmavém obrazci.`, ans: String(4 * (Dl - 1)),
          sol: [`Stejný počet obdélníčků znamená stejně dlouhé řady. Když je strana bílého čtverce s (tmavý) a t (světlý), je počet obdélníčků v tmavé řadě (s + 2) : 3 a ve světlé (t + 3) : 2; tmavý obrazec má přitom větší bílý čtverec.`,
            `Rovnice: (s + 2) : 3 = (t + 3) : 2, tedy 2s + 4 = 3t + 9, a s = t + ${Dl}. Dosazení: 2t + ${2 * Dl + 4} = 3t + 9, takže t = ${2 * Dl - 5} cm a s = ${3 * Dl - 5} cm.`,
            `Počet obdélníčků: 4 · (${3 * Dl - 5} + 2) : 3 = ${4 * (Dl - 1)}.`] }
      ]
    };
  }

  /* ══ Pozice 5 a 10 (2026-09-24) ══════════════════════════════════════ */
  function gen5d() {
    // 4 body — poměr podle receptu a „o kolik procent víc" (věrné M9B/2026, úloha 5; klíč 85 g, o 200 % více)
    /* Procenta se počítají z množství PODLE RECEPTU. Kdo je vezme ze skutečnosti,
       dostane jiné číslo — to je právě ta past, kvůli které úloha stojí za to. */
    let G, g, R, rec, p, U;
    do {
      // G = 400 by dávalo osminy (850 : 400 = 2,125) — tři desetinná místa do postupu pro deváťáka nepatří.
      G = pick([200, 250, 500]); g = pick([20, 25, 30, 40, 50]); R = ri(3, 20) * 50; rec = R * g / G;
      p = pick([20, 40, 50, 60, 80, 100, 150, 200]); U = rec * (100 + p) / 100;
    } while (!Number.isInteger(rec) || !Number.isInteger(U) || rec < 20 || R <= G);   // salát větší než „každých G g"
    const jm = pick(['František', 'Ondřej', 'Matěj', 'Tomáš']);
    return {
      no: 5, points: 4, title: 'Salát podle receptu', okruh: 'pomer',
      intro: `${jm} dal do svého salátu obsahujícího ${R} g rajčat celkem ${U} g cukru. Podle receptu však do salátu patří na každých ${G} g rajčat pouze ${g} g cukru.`,
      parts: [
        { key: '5.1', points: 2, prompt: `Vypočítejte, kolik gramů cukru měl ${jm} dát podle receptu do svého salátu.`, ans: String(rec),
          sol: [`Recept dává poměr: ${g} g cukru na každých ${G} g rajčat. Zjisti, kolikrát se ${G} g vejde do ${R} g rajčat, a stejně tolikrát vezmi ${g} g cukru.`,
            `${R} : ${G} = ${cz(R / G)}.`,
            `Cukr podle receptu: ${cz(R / G)} · ${g} = ${rec} g.`] },
        { key: '5.2', points: 2, prompt: `Vypočítejte, o kolik procent více cukru dal ${jm} do svého salátu, než měl dát podle receptu.`, ans: String(p),
          sol: [`Procenta se počítají z hodnoty, se kterou srovnáváš — tady z množství PODLE RECEPTU (to je 100 %). Nejdřív ho tedy spočítej: ${G} g rajčat odpovídá ${g} g cukru.`,
            `Podle receptu: ${R} : ${G} · ${g} = ${rec} g. Dal ${U} g, tedy o ${U} − ${rec} = ${U - rec} g víc.`,
            `${U - rec} g z ${rec} g je ${U - rec} : ${rec} · 100 = ${p} %.`] }
      ]
    };
  }

  function gen5e() {
    // 4 body — dva běžci, stejná zbývající vzdálenost (věrné M9A/2026, úloha 7; klíč 5 km, 54 minut)
    const moznosti = [];
    [8, 10, 12, 15].forEach(DA => [40, 48, 50, 60, 75].forEach(TA => [20, 24, 25, 30, 36, 40].forEach(t => {
      if (t >= TA) return;
      const dA = DA * t / TA, rA = DA - dA;
      if (!Number.isInteger(dA * 2)) return;                          // Adam uběhne celé nebo půl km
      [DA - 1, DA - 2, DA - 3].forEach(DB => {
        const sB = DB - rA, TB = t * DB / sB;
        if (sB > 0 && Number.isInteger(TB) && TB > t && Math.abs(TB / DB - TA / DA) > 0.01) moznosti.push([DA, TA, t, DB]);
      });
    })));
    const [DA, TA, t, DB] = pick(moznosti), dA = DA * t / TA, rA = DA - dA, sB = DB - rA, TB = t * DB / sB;
    return {
      no: 5, points: 4, title: 'Dva běžci', okruh: 'slovni',
      intro: `Adam běžel ${DA}kilometrový okruh stálým tempem a uběhl jej za ${TA} minut. Bára běžela pouze ${DB}kilometrový okruh rovněž stálým tempem (jiným než Adam). Adam i Bára vyběhli ve stejném okamžiku a po ${t} minutách běhu jim oběma zbývala do cíle stejná vzdálenost.`,
      parts: [
        { key: '5.1', points: 2, prompt: `Vypočítejte, kolik km uběhla Bára za ${t} minut.`, ans: String(sB),
          sol: [`Oběma zbývá stejná vzdálenost. Tu spočítáš u Adama, jehož tempo znáš, a pak ji odečteš od délky Bářina okruhu.`,
            `Adam za ${t} minut uběhne ${DA} · ${t} : ${TA} = ${cz(dA)} km, zbývá mu ${DA} − ${cz(dA)} = ${cz(rA)} km.`,
            `Bára uběhla ${DB} − ${cz(rA)} = ${cz(sB)} km.`] },
        { key: '5.2', points: 2, prompt: `Vypočítejte, za kolik minut uběhla svůj okruh Bára.`, ans: String(TB),
          sol: [`Bára běží stálým tempem, takže čas je přímo úměrný dráze: na celý okruh potřebuje tolikrát víc času, kolikrát je okruh delší než to, co uběhla za ${t} minut.`,
            `Za ${t} minut uběhla: Adamovi zbývá ${DA} − ${DA} · ${t} : ${TA} = ${cz(rA)} km, jí tedy ${DB} − ${cz(rA)} = ${cz(sB)} km.`,
            `Celý okruh: ${t} · ${DB} : ${cz(sB)} = ${TB} minut.`] }
      ]
    };
  }

  function gen10d() {
    // 2 body — měřítko zadané slovy (věrné M9A/2023, úloha 11: 3,5 cm na mapě = 700 m)
    const [a, b] = pick([[3.5, 700], [2, 500], [2.5, 1000], [4, 1000], [1.5, 300], [2.5, 250]]);
    const m1 = b / a;                                                   // metrů na 1 cm mapy
    let D; do { D = ri(2, 24) / 2; } while (!Number.isInteger(D * 1000 / m1 * 10));
    const naMape = D * 1000 / m1;
    return {
      no: 10, points: 2, title: 'Mapa a trasa',
      parts: [
        { key: '10', points: 2,
          prompt: `${Number.isInteger(a) && a <= 4 ? 'Každé' : 'Každých'} ${cz(a)} cm na turistické mapě je ve skutečnosti ${b} m. Trasa je ve skutečnosti dlouhá ${cz(D)} km. Kolik centimetrů měří na mapě?`,
          ans: String(naMape),
          sol: [`Mapa zmenšuje všechny délky ve stejném poměru. Stačí zjistit, kolik metrů skutečnosti odpovídá JEDNOMU centimetru mapy, a trasu převést na metry.`,
            `1 cm na mapě = ${b} : ${cz(a)} = ${m1} m; trasa ${cz(D)} km = ${cz(D)} · 1000 = ${D * 1000} m.`,
            `Na mapě: ${D * 1000} : ${m1} = ${cz(naMape)} cm.`] }
      ]
    };
  }

  function gen10e() {
    // 2 body — obsah podle měřítka: délky k-krát, obsah k·k-krát
    const k = pick([200, 500, 1000, 2000]), S = ri(4, 40), cm2 = S * k * k, m2 = cm2 / 10000;
    return {
      no: 10, points: 2, title: 'Plocha podle měřítka',
      parts: [
        { key: '10', points: 2,
          prompt: `Na plánu v měřítku 1 : ${tis(k)} má pozemek obsah ${S} cm². Jaká je skutečná rozloha pozemku v m²?`,
          ans: String(m2),
          sol: [`Měřítko platí pro DÉLKY: každá délka je ve skutečnosti ${tis(k)}krát větší. Obsah je délka krát délka, takže se zvětší ${tis(k)} · ${tis(k)} krát — násobit obsah jen číslem ${tis(k)} je nejčastější chyba.`,
            `1 cm² plánu je čtverec 1 cm × 1 cm, ve skutečnosti ${tis(k)} cm × ${tis(k)} cm = ${tis(k * k)} cm² = ${tis(k * k / 10000)} m² (1 m² = 10 000 cm²).`,
            `Pozemek: ${S} · ${tis(k * k / 10000)} = ${tis(m2)} m².`] }
      ]
    };
  }

  function gen10f() {
    // 2 body — podobné útvary: poměr obvodů = k, poměr obsahů = k²
    const [k, o1] = pick([[2, ri(6, 20)], [3, ri(5, 12)], [1.5, 2 * ri(5, 12)]]), o2 = k * o1;
    let S1; do { S1 = ri(4, 30); } while (!Number.isInteger(S1 * k * k));
    const S2 = S1 * k * k;
    return {
      no: 10, points: 2, title: 'Obsah podobných trojúhelníků',
      parts: [
        { key: '10', points: 2,
          prompt: `Dva podobné trojúhelníky mají obvody ${o1} cm a ${cz(o2)} cm. Menší z nich má obsah ${S1} cm². Jaký obsah má větší trojúhelník (v cm²)?`,
          ans: String(S2),
          sol: [`U podobných útvarů jsou všechny DÉLKY (strany i obvod) v poměru koeficientu podobnosti k, ale OBSAHY v poměru k · k, protože obsah násobí dvě délky.`,
            `k = ${cz(o2)} : ${o1} = ${cz(k)}.`,
            `Obsah většího: ${S1} · ${cz(k)} · ${cz(k)} = ${cz(S2)} cm².`] }
      ]
    };
  }

  /* ══ Pozice 11: tvrzení A/N nad výchozím textem (2026-09-24) ══════════
     Úloha nese `okruh`: pozice 11 střídá tělesa, diagramy, mapu i mnohoúhelníky,
     takže mapování jen podle pozice by chybu v kruhovém diagramu připsalo
     tělesům (prijimacky-topics.js, topicsForTask).
     Ostrá úloha 11 má vždy výchozí text s obrázkem, grafem nebo diagramem
     a tvrzení, která vyžadují úvahu. Nepravdivé tvrzení tu NENÍ „správné
     číslo + náhodný šum" (to pozná každý, kdo si jen všimne, že číslo je
     divné), ale výsledek TYPICKÉ CHYBY — přesně ten, ke kterému by žák
     došel, kdyby se spletl. */
  const tvrzeni = (text, pravda, sol) => ({ text, ans: pravda ? 'A' : 'N', sol });
  const verdikt = p => (p ? 'Tvrzení je PRAVDIVÉ (A).' : 'Tvrzení je NEPRAVDIVÉ (N).');
  const txt12 = (x, y, t, barva, kotva) => `<text x="${r1(x)}" y="${r1(y)}" fill="${barva}" font-size="12" font-family="monospace" text-anchor="${kotva || 'middle'}">${t}</text>`;

  // Kruhový diagram: výseče [{jm, uhel, text}] od poledne po směru hodinových ručiček.
  // Jen SVĚTLÉ výplně (po převodu na světlý motiv), aby tmavý popisek uvnitř šel přečíst.
  function svgKolac(vysece) {
    const cx = 150, cy = 100, R = 62, VYPLN = ['#1a5a80', '#0e4a6e', '#101a30', '#3a2a52', '#1b2742', '#0e4a6e'];
    let out = `<svg viewBox="0 0 300 200">`, u = 90;
    vysece.forEach((v, i) => {
      const a1 = u - v.uhel, P0 = smer(u), P1 = smer(a1);
      out += `<path d="M ${cx} ${cy} L ${r1(cx + R * P0.x)} ${r1(cy + R * P0.y)} A ${R} ${R} 0 ${v.uhel > 180 ? 1 : 0} 1 ${r1(cx + R * P1.x)} ${r1(cy + R * P1.y)} Z" fill="${VYPLN[i % VYPLN.length]}" stroke="${CARA}" stroke-width="1.5"/>`;
      const d = smer((u + a1) / 2);
      if (v.text) out += txt12(cx + d.x * R * 0.64, cy + d.y * R * 0.64 + 4, v.text, VRCHOL);
      out += txt12(cx + d.x * (R + 8), cy + d.y * (R + 8) + 4 + (d.y > 0.5 ? 6 : 0), v.jm, JMENO, d.x > 0.25 ? 'start' : d.x < -0.25 ? 'end' : 'middle');
      u = a1;
    });
    return out + `</svg>`;
  }
  // Pravidelný n-úhelník se středem S: α u středu, β u vrcholu v trojúhelníku S V0 V1, γ vnitřní úhel.
  function svgMnohouhelnik(n) {
    const cx = 150, cy = 112, R = 84, st = 360 / n;
    const V = k => bod(cx + R * Math.cos((90 + st / 2 - k * st) * Math.PI / 180), cy - R * Math.sin((90 + st / 2 - k * st) * Math.PI / 180));
    const S = bod(cx, cy), sm = (A, B) => { const d = Math.hypot(B.x - A.x, B.y - A.y); return bod((B.x - A.x) / d, (B.y - A.y) / d); };
    const body = Array.from({ length: n }, (_, k) => V(k));
    const [V0, V1, V2] = [V(0), V(1), V(2)];
    return `<svg viewBox="0 0 300 210">` + poly(body, BILA)
      + cara(S, V0, CARA) + cara(S, V1, CARA)
      + oblouk(S, sm(S, V0), sm(S, V1), 16, HLEDANY) + stitek(S, sm(S, V0), sm(S, V1), 28, 'α', HLEDANY)
      + oblouk(V0, sm(V0, S), sm(V0, V1), 18, HLEDANY) + stitek(V0, sm(V0, S), sm(V0, V1), 30, 'β', HLEDANY)
      + oblouk(V1, sm(V1, V0), sm(V1, V2), 14, HLEDANY) + stitek(V1, sm(V1, V0), sm(V1, V2), 27, 'γ', HLEDANY)
      + `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${CARA}"/>` + napis(cx, cy + 17, 'S', VRCHOL)
      + `</svg>`;
  }
  // Obdélník a × b ze čtyř shodných pravoúhlých trojúhelníků (vlevo) a kosočtverec z nich (vpravo).
  function svgKosoctverec(a, b) {
    const k = Math.min(110 / a, 64 / b), A = a * k, B = b * k, x0 = 14, y0 = 20, cx = 226, cy = 20 + 2 * B / 2 + 4;
    const t = (P, f) => poly(P, f);
    return `<svg viewBox="0 0 300 ${Math.ceil(2 * B + 48)}">`
      + t([bod(x0, y0), bod(x0 + A / 2, y0), bod(x0, y0 + B)], SEDA) + t([bod(x0 + A / 2, y0), bod(x0 + A / 2, y0 + B), bod(x0, y0 + B)], BILA)
      + t([bod(x0 + A / 2, y0), bod(x0 + A, y0), bod(x0 + A / 2, y0 + B)], BILA) + t([bod(x0 + A, y0), bod(x0 + A, y0 + B), bod(x0 + A / 2, y0 + B)], SEDA)
      + napis(x0 + A / 2, y0 + B + 17, `${a} cm`, JMENO) + napis(x0 + A + 5, y0 + B / 2 + 4, `${b} cm`, JMENO, 'start')
      + t([bod(cx, cy), bod(cx - A / 2, cy), bod(cx, cy - B)], SEDA) + t([bod(cx, cy), bod(cx + A / 2, cy), bod(cx, cy - B)], BILA)
      + t([bod(cx, cy), bod(cx - A / 2, cy), bod(cx, cy + B)], BILA) + t([bod(cx, cy), bod(cx + A / 2, cy), bod(cx, cy + B)], SEDA)
      + `</svg>`;
  }

  function gen11d() {
    // 3 body — turistická mapa (věrné M9A/2023, úloha 11; klíč 11.1 N)
    const [a, b] = pick([[3.5, 700], [2.5, 500], [4, 1000], [2, 1000], [3, 1500]]);
    const m1 = b / a, meritko = m1 * 100;                                // metrů na 1 cm, měřítko 1 : …
    const P = pick([1.5, 2, 2.5, 3]), V = 3 * P;                         // přímá a vycházková trasa (km)
    // Nejdřív celá čísla, dělit až nakonec: 49 / 10 · 200 dá 980,0000000000001.
    const mm = pick([35, 42, 45, 49, 56, 63, 70]), skut = mm * m1 / 10;  // trasa na mapě v mm → skutečnost v m
    const hranice = pick([1, 1.5, 2]), p1 = skut > hranice * 1000;
    const rozdil = (V - P) * 1000 / m1, p2 = ri(0, 1) === 1, rTvr = p2 ? rozdil : V * 1000 / m1;   // chyba: celá vycházková
    const p3 = ri(0, 1) === 1, mTvr = p3 ? meritko : meritko * 10;                                  // chyba: m ↔ cm o řád
    return {
      no: 11, points: 3, title: 'Turistická mapa', kind: 'tfgrid', okruh: 'pomer',
      intro: `${Number.isInteger(a) && a <= 4 ? 'Každé' : 'Každých'} ${cz(a)} cm na turistické mapě rovinaté oblasti je ve skutečnosti ${b} m. Délka vycházkové trasy je přesně ${cz(V)} km, což je trojnásobek délky přímé trasy. Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [
        tvrzeni(`Trasa, která na mapě měří ${mm} mm, je ve skutečnosti delší než ${cz(hranice)} km.`, p1,
          [`Nejdřív zjisti, kolik metrů skutečnosti odpovídá 1 cm mapy, a milimetry na mapě převeď na centimetry.`,
            `1 cm mapy = ${b} : ${cz(a)} = ${m1} m; ${mm} mm = ${cz(mm / 10)} cm, tedy ${cz(mm / 10)} · ${m1} = ${tis(skut)} m.`,
            `${tis(skut)} m je ${p1 ? 'víc' : 'méně'} než ${cz(hranice)} km = ${tis(hranice * 1000)} m. ${verdikt(p1)}`]),
        tvrzeni(`Na mapě je vycházková trasa o ${cz(rTvr)} cm delší než přímá trasa.`, p2,
          [`Přímá trasa je třetina vycházkové. Rozdíl délek se převede na mapu stejně jako každá jiná délka — vydělí se počtem metrů na 1 cm mapy.`,
            `Přímá trasa: ${cz(V)} : 3 = ${cz(P)} km, rozdíl ${cz(V)} − ${cz(P)} = ${cz(V - P)} km = ${tis((V - P) * 1000)} m.`,
            `Na mapě: ${tis((V - P) * 1000)} : ${m1} = ${cz(rozdil)} cm. ${verdikt(p2)}`]),
        tvrzeni(`Měřítko turistické mapy je 1 : ${tis(mTvr)}.`, p3,
          [`Měřítko porovnává délku na mapě a ve skutečnosti ve STEJNÝCH jednotkách — metry je proto nutné převést na centimetry.`,
            `1 cm mapy odpovídá ${m1} m = ${m1} · 100 = ${tis(meritko)} cm.`,
            `Měřítko je 1 : ${tis(meritko)}. ${verdikt(p3)}`])
      ]
    };
  }

  function gen11e() {
    // 3 body — kruhový diagram osázené plochy (věrné M9B/2025, úloha 11)
    /* Obsah výseče je úměrný úhlu. Jeden díl = 15°; magnolie mají m dílů a
       zadanou plochu, z ní se dopočítá plocha jednoho dílu. */
    let mag, jab, lev, baz, hor, ruz;
    do {
      mag = pick([2, 3, 4]); jab = ri(4, 8); hor = pick([3, 4, 6]); const K = pick([1.5, 2]);
      /* Levandule i bazalka mají aspoň 2 díly (30°): výseč 15° vedle 45° dala
         popiskům úhlů jen 20 px, takže se „15°" a „45°" překrývaly. */
      const lb = hor * K; lev = ri(2, lb - 2); baz = lb - lev; ruz = 24 - mag - jab - hor - lev - baz;
    } while (ruz < 2 || !Number.isInteger(baz) || baz < 1 || jab === mag);
    const naDil = pick([5, 6, 8, 10]), Am = mag * naDil;              // m² na jeden díl 15°
    const K = (lev + baz) / hor;
    const p1 = ri(0, 1) === 1, D = (jab - mag) * naDil, dTvr = p1 ? D : (jab - mag) * 15;          // chyba: stupně místo m²
    // Nepravdivá hodnota leží na obou stranách pravé, aby „2krát" nebylo samo o sobě prozrazením.
    const p2 = ri(0, 1) === 1, kTvr = p2 ? K : (K === 2 ? pick([1.5, 2.5]) : 2);
    const plochaR = ruz * naDil, p3 = ri(0, 1) === 1, hr = p3 ? plochaR + naDil : plochaR;        // „menší než" vlastní hodnota = nepravda
    const vysece = [['magnolie', mag, true], ['jabloně', jab, true], ['levandule', lev, true], ['bazalka', baz, true], ['hortenzie', hor, true], ['růže', ruz, false]]
      .map(([jm, d, zn]) => ({ jm, uhel: d * 15, text: zn ? d * 15 + '°' : '' }));
    return {
      no: 11, points: 3, title: 'Kruhový diagram zahrady', kind: 'tfgrid', okruh: 'data',
      svg: svgKolac(vysece),
      intro: `V zahradě se pěstuje 6 druhů rostlin. Diagram udává, jakou část osázené plochy zahrady zabírají jednotlivé druhy rostlin. V každé části zahrady se pěstuje pouze jeden druh rostlin. Magnolie zabírají plochu o rozloze ${Am} m². V některých výsečích diagramu je uvedena velikost úhlu, který příslušnou výseč vymezuje. Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [
        tvrzeni(`Jabloně zabírají o ${dTvr} m² větší plochu, než zabírají magnolie.`, p1,
          [`Plocha výseče je úměrná jejímu úhlu. Z magnolií (${mag * 15}° ↔ ${Am} m²) zjistíš, kolik m² připadá na 1°.`,
            `Na 1° připadá ${Am} : ${mag * 15} m²; jabloně mají o ${jab * 15} − ${mag * 15} = ${(jab - mag) * 15}° víc, tedy o ${(jab - mag) * 15} · ${Am} : ${mag * 15} = ${D} m².`,
            `Rozdíl je ${D} m² (NE ${(jab - mag) * 15} — to je rozdíl ve stupních). ${verdikt(p1)}`]),
        tvrzeni(`Levandule a bazalka dohromady zabírají ${cz(kTvr)}krát větší plochu než hortenzie.`, p2,
          [`Plochy jsou ve stejném poměru jako úhly výsečí, takže stačí porovnat úhly — m² počítat není třeba.`,
            `Levandule a bazalka: ${lev * 15} + ${baz * 15} = ${(lev + baz) * 15}°, hortenzie ${hor * 15}°.`,
            `${(lev + baz) * 15} : ${hor * 15} = ${cz(K)}. ${verdikt(p2)}`]),
        tvrzeni(`Růže zabírají plochu menší než ${hr} m².`, p3,
          [`Úhel výseče s růžemi v diagramu není. Všechny výseče dávají dohromady celý kruh, 360°, takže ho dopočítáš odečtením ostatních.`,
            `Růže: 360 − ${mag * 15} − ${jab * 15} − ${lev * 15} − ${baz * 15} − ${hor * 15} = ${ruz * 15}°, tedy ${ruz * 15} · ${Am} : ${mag * 15} = ${plochaR} m².`,
            `${plochaR} m² ${p3 ? 'je' : 'NENÍ'} menší než ${hr} m². ${verdikt(p3)}`])
      ]
    };
  }

  function gen11f() {
    // 3 body — náklad lodi podle diagramu (věrné M9A/2026, úloha 11: rýže 35 %, cukr 25 %, káva a banány po 20 %, 36 t)
    let r, k, c, T, X;
    do {
      k = pick([10, 15, 20, 25]); r = pick([25, 30, 35, 40, 45]); c = 100 - r - 2 * k; T = pick([120, 150, 160, 180, 200, 240, 300]); X = T * k / 100;
    } while (c < 10 || c === r || c === k || !Number.isInteger(X) || !Number.isInteger(T * r / 100));
    const rize = T * r / 100, g = gcd(k, r);
    // chyba: jen jeden ze dvou druhů (k % místo 2k %)
    const zl = gcd(2 * k, 100), z1 = gcd(k, 100), p1 = ri(0, 1) === 1, [cT, jT] = p1 ? [2 * k / zl, 100 / zl] : [k / z1, 100 / z1];
    const p2 = ri(0, 1) === 1, pomer = p2 ? `${k / g} ∶ ${r / g}` : `${r / g} ∶ ${k / g}`;       // chyba: obrácený poměr
    const p3 = ri(0, 1) === 1, rTvr = p3 ? rize : X * r / 100;                                     // chyba: procenta z 36 t
    // „tvoří … jednu pětinu / dvě pětiny" — 4. pád (u 2–4 stejný jako 1. pád)
    const ZLS = { 1: 'jednu', 2: 'dvě', 3: 'tři', 4: 'čtyři' }, JM = { 2: 'poloviny', 3: 'třetiny', 4: 'čtvrtiny', 5: 'pětiny', 10: 'desetiny', 20: 'dvacetiny', 25: 'pětadvacetiny', 50: 'padesátiny' };
    const zlText = (n, d) => (n === 1 && d === 2 ? 'polovinu' : ZLS[n] && JM[d] ? `${ZLS[n]} ${n === 1 ? JM[d].replace(/y$/, 'u') : JM[d]}` : `${n}/${d}`);
    return {
      no: 11, points: 3, title: 'Náklad lodi', kind: 'tfgrid', okruh: 'data',
      svg: svgKolac([['rýže', r], ['cukr', c], ['káva', k], ['banány', k]].map(([jm, p]) => ({ jm, uhel: p * 3.6, text: p + ' %' }))),
      intro: `Náklad na lodi se skládá pouze ze čtyř druhů zboží – rýže, cukru, kávy a banánů. Loď veze ${X} tun banánů a ${X} tun kávy. Diagram udává, jaký podíl na celkové hmotnosti nákladu mají jednotlivé druhy zboží. Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [
        tvrzeni(`Káva a banány tvoří dohromady ${zlText(cT, jT)} celkové hmotnosti nákladu.`, p1,
          [`Podíly v diagramu jsou procenta z celého nákladu; stačí je sečíst a převést na zlomek (100 % = celek).`,
            `Káva a banány: ${k} + ${k} = ${2 * k} %, tedy ${2 * k}/100 = ${2 * k / zl}/${100 / zl}.`,
            `Tvrzení uvádí ${cT}/${jT}${p1 ? '' : ` — to je podíl jen jednoho z obou druhů (${k} %)`}. ${verdikt(p1)}`]),
        tvrzeni(`Poměr hmotnosti kávy ku hmotnosti rýže je ${pomer}.`, p2,
          [`Hmotnosti jsou ve stejném poměru jako jejich podíly v diagramu. Pozor na POŘADÍ: první číslo poměru patří kávě, druhé rýži.`,
            `Káva ${k} %, rýže ${r} %: ${k} ∶ ${r}; obě čísla vyděl ${g}.`,
            `Poměr kávy ku rýži je ${k / g} ∶ ${r / g}. ${verdikt(p2)}`]),
        tvrzeni(`Loď veze ${cz(rTvr)} t rýže.`, p3,
          [`Nejdřív potřebuješ celkovou hmotnost nákladu: ${X} tun kávy je ${k} % celku. Procenta rýže se pak berou z CELKU, ne z kávy.`,
            `Celek: ${X} : ${k} · 100 = ${T} t. Rýže: ${T} · ${r} : 100 = ${rize} t.`,
            `Loď veze ${rize} tun rýže. ${verdikt(p3)}`])
      ]
    };
  }

  function gen11g() {
    // 3 body — úhly v pravidelném mnohoúhelníku (podle nanečisto 2025, úloha 11)
    const n = pick([5, 6, 8, 9, 10, 12]), al = 360 / n, be = (180 - al) / 2, ga = 180 - al;
    const JMN = { 5: 'pětiúhelníku', 6: 'šestiúhelníku', 8: 'osmiúhelníku', 9: 'devítiúhelníku', 10: 'desetiúhelníku', 12: 'dvanáctiúhelníku' };
    const p1 = ri(0, 1) === 1, aTvr = p1 ? al : 180 / n;                            // chyba: 180° místo 360°
    const hr = pick([be - 6, be + 6]), p2 = be < hr;
    /* Třetí tvrzení je vztah mezi úhly. Nepravdivé jsou typické omyly:
       „γ = α" (oba vypadají jako úhel mezi dvěma stranami) a „α + β = 90°"
       (jako by byl trojúhelník pravoúhlý). */
    const [t3, p3, k3] = pick([
      ['γ = 2 · β', true, `γ = 2 · ${cz(be)} = ${cz(ga)}°, tedy γ je dvojnásobek β.`],
      ['α + γ = 180°', true, `α + γ = ${cz(al)} + ${cz(ga)} = 180.`],
      ['γ = α', false, `γ = ${cz(ga)}°, ale α = ${cz(al)}°.`],
      ['α + β = 90°', false, `α + β = ${cz(al)} + ${cz(be)} = ${cz(al + be)}, ne 90.`]]);
    return {
      no: 11, points: 3, title: 'Pravidelný mnohoúhelník', kind: 'tfgrid', okruh: 'geometrie',
      svg: svgMnohouhelnik(n),
      intro: `V náčrtku pravidelného ${JMN[n]} se středem S jsou vyznačeny úhly α, β, γ: α svírají spojnice středu se dvěma sousedními vrcholy, β je úhel při vrcholu v trojúhelníku, který tvoří střed a tyto dva vrcholy, a γ je vnitřní úhel mnohoúhelníku. Úhly neměřte, náčrtek není přesný. Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [
        tvrzeni(`α = ${cz(aTvr)}°`, p1,
          [`Spojnice středu se všemi vrcholy rozdělí plný úhel 360° u středu na ${n} stejných dílů — mnohoúhelník je pravidelný.`,
            `α = 360 : ${n} = ${cz(al)}°.`,
            `Tvrzení uvádí ${cz(aTvr)}°. ${verdikt(p1)}`]),
        tvrzeni(`β < ${cz(hr)}°`, p2,
          [`Trojúhelník ze středu a dvou sousedních vrcholů je rovnoramenný (obě ramena jsou poloměry), takže jeho úhly při základně jsou stejné.`,
            `β = (180 − ${cz(al)}) : 2 = ${cz(be)}°.`,
            `${cz(be)}° ${p2 ? 'je' : 'NENÍ'} menší než ${cz(hr)}°. ${verdikt(p2)}`]),
        tvrzeni(t3, p3,
          [`Spočítej všechny tři úhly: α dělí plný úhel na ${n} dílů, β je úhel při základně rovnoramenného trojúhelníku a vnitřní úhel γ se skládá ze dvou úhlů β sousedních trojúhelníků.`,
            `α = 360 : ${n} = ${cz(al)}°, β = (180 − ${cz(al)}) : 2 = ${cz(be)}°, γ = 2 · ${cz(be)} = ${cz(ga)}°.`,
            `${k3} ${verdikt(p3)}`])
      ]
    };
  }

  function gen11h() {
    // 3 body — obdélník ze 4 trojúhelníků přeskládaný do kosočtverce (věrné M9B/2023, úloha 11; klíč 11.1 N)
    // Jen trojice, u kterých výška S : s vyjde ukončeným desetinným číslem (u 13 by byla periodická).
    const [x, b, s] = pick([[4, 3, 5], [3, 4, 5], [6, 8, 10], [8, 6, 10], [9, 12, 15], [12, 9, 15]]);
    const a = 2 * x, S = a * b, v = S / s;
    const vari = ri(0, 2), p1 = vari === 0, t1 = ['stejný jako', 'větší než', 'menší než'][vari];
    const p2 = ri(0, 1) === 1, sTvr = p2 ? s : x + b;                                         // chyba: součet odvěsen
    const p3 = ri(0, 1) === 1, vTvr = p3 ? v : b;                                              // chyba: výška obdélníku
    return {
      no: 11, points: 3, title: 'Obdélník a kosočtverec', kind: 'tfgrid', okruh: 'geometrie',
      svg: svgKosoctverec(a, b),
      intro: `Obdélník se stranami délek ${a} cm a ${b} cm se skládá ze čtyř shodných pravoúhlých trojúhelníků (viz obrázek vlevo). Přemístěním trojúhelníků vznikl kosočtverec (vpravo). Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [
        tvrzeni(`Obsah kosočtverce je ${t1} obsah obdélníku.`, p1,
          [`Kosočtverec je složený ze STEJNÝCH čtyř trojúhelníků jako obdélník — přeskládáním se obsah nemění.`,
            `Obsah obdélníku: ${a} · ${b} = ${S} cm², kosočtverce taky ${S} cm².`,
            `Obsahy jsou stejné. ${verdikt(p1)}`]),
        tvrzeni(`Strana kosočtverce měří ${sTvr} cm.`, p2,
          [`Stranou kosočtverce je přepona trojúhelníku. Jeho odvěsny jsou polovina delší strany obdélníku a kratší strana: ${a} : 2 = ${x} cm a ${b} cm.`,
            `Přepona² = ${x * x} + ${b * b} = ${s * s}, přepona = √${s * s} = ${s} cm (ne ${x} + ${b} — odvěsny se nesčítají).`,
            `Strana měří ${s} cm. ${verdikt(p2)}`]),
        tvrzeni(`Výška kosočtverce měří ${cz(vTvr)} cm.`, p3,
          [`Obsah kosočtverce je strana krát výška na ni, takže výška = obsah : strana. Obsah i stranu už znáš.`,
            `Obsah ${S} cm², strana ${s} cm.`,
            `Výška = ${S} : ${s} = ${cz(v)} cm. ${verdikt(p3)}`])
      ]
    };
  }

  /* ══ Pozice 12–14: úlohy s výběrem odpovědi (2026-09-24) ══════════════
     Ostré úlohy 12–14 nabízejí pět voleb SEŘAZENÝCH podle velikosti (jednou
     vzestupně, jindy sestupně) a pátá bývá „jiný objem / jiný počet".
     Distraktory tu nejsou šum kolem výsledku („správně ± 25"), ale výsledky
     TYPICKÝCH CHYB — stejně jako u pozice 15: kdo se splete klasickým
     způsobem, najde svou chybu mezi volbami. V 1 z 10 úloh se správný
     výsledek schválně nenabídne a platí „jiný…" — žák musí věřit svému
     výpočtu, i když číslo v nabídce nenajde.
     Úloha nese `okruh`: pozice 13 střídá procenta, slovní úlohy a poměr,
     a bez něj by se chyba ve slovní úloze připsala procentům. */
  function volbyMC(spravne, chyby, krok, jine, fmt) {
    const f = fmt || (v => tis(cz(v)));
    const stejne = (x, y) => Math.abs(x - y) < 1e-9;
    const kand = [];
    const pridej = v => { if (Number.isFinite(v) && v > 0 && !stejne(v, spravne) && !kand.some(x => stejne(x, v))) kand.push(v); };
    chyby.forEach(pridej);
    for (let d = 1; kand.length < 4; d++) { pridej(r2(spravne + d * krok)); pridej(r2(spravne - d * krok)); }
    const jiny = !!jine && ri(1, 10) === 1;
    const cisla = jiny ? kand.slice(0, 4) : [spravne].concat(kand.slice(0, jine ? 3 : 4));
    cisla.sort((x, y) => x - y);
    if (ri(0, 1)) cisla.reverse();
    const labels = cisla.map(f).concat(jine ? [jine] : []).map((v, i) => 'ABCDE'[i] + ') ' + v);
    return { labels, jiny, jine, correctLetter: jiny ? 'E' : 'ABCDE'[cisla.findIndex(x => stejne(x, spravne))] };
  }
  // Konec posledního kroku: písmeno správné volby, nebo proč platí „jiný…".
  const odpovedMC = sh => (sh.jiny
    ? `. Tahle hodnota mezi čísly v nabídce není, platí volba ${sh.correctLetter}) ${sh.jine}.`
    : ` → odpověď ${sh.correctLetter}.`);

  // Kvádr v rovnoběžném promítání: přední stěna w × h, hloubka jde šikmo vzhůru doprava.
  function kvadrPlochy(x, y, w, h, dx, dy, predni, horni, bok) {
    return poly([bod(x, y - h), bod(x + dx, y - h - dy), bod(x + w + dx, y - h - dy), bod(x + w, y - h)], horni)
      + poly([bod(x + w, y), bod(x + w + dx, y - dy), bod(x + w + dx, y - h - dy), bod(x + w, y - h)], bok)
      + poly([bod(x, y), bod(x + w, y), bod(x + w, y - h), bod(x, y - h)], predni);
  }

  // Podélný řez bazénem: vlevo zóna pro neplavce (rovné dno), vpravo plavci (šikmé dno).
  function svgBazen(n, d, h1, h2) {
    const x0 = 36, W = 228, k = W / d, kh = 24, y0 = 30, xN = x0 + n * k, xK = x0 + W, y1 = y0 + h1 * kh, y2 = y0 + h2 * kh;
    return `<svg viewBox="0 0 300 ${y2 + 48}">`
      + poly([bod(x0, y0), bod(xK, y0), bod(xK, y2), bod(xN, y1), bod(x0, y1)], BILA)
      + cara(bod(xN, y0), bod(xN, y1), SEDA, '4 3')
      + napis((x0 + xN) / 2, y0 - 8, 'neplavci', JMENO) + napis((xN + xK) / 2, y0 - 8, 'plavci', JMENO)
      + napis(x0 - 5, (y0 + y1) / 2 + 4, `${h1} m`, ZADANY, 'end') + napis(xK + 5, (y0 + y2) / 2 + 4, `${h2} m`, ZADANY, 'start')
      + napis((x0 + xN) / 2, y1 + 17, `${n} m`, ZADANY)
      + cara(bod(x0, y2 + 26), bod(xK, y2 + 26), SEDA) + cara(bod(x0, y2 + 20), bod(x0, y2 + 32), SEDA) + cara(bod(xK, y2 + 20), bod(xK, y2 + 32), SEDA)
      + napis((x0 + xK) / 2, y2 + 42, `${d} m`, ZADANY)
      + `</svg>`;
  }

  // Hala ABCDEFGH (podlaha ABCD, E nad A …) s lomenou čarou A–C–F–H–A.
  function svgHala(d, s, v) {
    const k = Math.min(150 / d, 84 / v), L = d * k, H = v * k, g = Math.max(18, s * k * 0.4), x0 = 52, y0 = H + g + 34;
    const A = bod(x0, y0), B = bod(x0 + L, y0), C = bod(x0 + L + g, y0 - g), D = bod(x0 + g, y0 - g);
    const nad = P => bod(P.x, P.y - H), [E, F, G, Hh] = [nad(A), nad(B), nad(C), nad(D)];
    const P = (Q, t, dx, dy) => napis(Q.x + dx, Q.y + dy, t, VRCHOL);
    return `<svg viewBox="0 0 300 ${Math.ceil(y0 + 28)}">`
      + cara(A, D, SEDA, '4 3') + cara(D, C, SEDA, '4 3') + cara(D, Hh, SEDA, '4 3')
      + cara(A, B, CARA) + cara(B, C, CARA) + cara(C, G, CARA) + cara(B, F, CARA) + cara(A, E, CARA)
      + cara(E, F, CARA) + cara(F, G, CARA) + cara(G, Hh, CARA) + cara(Hh, E, CARA)
      + cara(A, C, HLEDANY) + cara(C, F, HLEDANY) + cara(F, Hh, HLEDANY) + cara(Hh, A, HLEDANY)
      + P(A, 'A', -10, 14) + P(B, 'B', 6, 14) + P(C, 'C', 10, 4) + P(D, 'D', -12, -4)
      + P(E, 'E', -10, -4) + P(F, 'F', -2, -8) + P(G, 'G', 10, -2) + P(Hh, 'H', -4, -8)
      + napis((A.x + B.x) / 2, y0 + 20, `${d} m`, ZADANY) + napis(A.x - 12, (A.y + E.y) / 2 + 4, `${v} m`, ZADANY, 'end')
      + `</svg>`;
  }

  // Krychle, na jejíchž stěnách leží šedé čtverce podél jedné úhlopříčky (n × n síť).
  function svgPolepenaKrychle(n) {
    const a = 108, g = 44, x0 = 64, y0 = 184;
    const stena = (O, e1, e2) => {
      const p = (u, w) => bod(O.x + e1.x * u + e2.x * w, O.y + e1.y * u + e2.y * w);
      let out = poly([p(0, 0), p(1, 0), p(1, 1), p(0, 1)], BILA);
      for (let i = 0; i < n; i++) out += poly([p(i / n, i / n), p((i + 1) / n, i / n), p((i + 1) / n, (i + 1) / n), p(i / n, (i + 1) / n)], SEDA);
      return out;
    };
    return `<svg viewBox="0 0 300 208">`
      + stena(bod(x0, y0 - a), bod(a, 0), bod(g, -g))
      + stena(bod(x0 + a, y0), bod(g, -g), bod(0, -a))
      + stena(bod(x0, y0), bod(a, 0), bod(0, -a))
      + napis(x0 + a / 2, y0 + 15, '?', HLEDANY)
      + `</svg>`;
  }

  // Dva pravidelné čtyřboké hranoly se stejnou podstavou a různou výškou.
  function svgDvaHranoly() {
    return `<svg viewBox="0 0 300 190">`
      + kvadrPlochy(40, 164, 62, 118, 30, 24, BILA, SEDA, TMAVA) + kvadrPlochy(176, 164, 62, 64, 30, 24, BILA, SEDA, TMAVA)
      + napis(71, 180, 'a', ZADANY) + napis(207, 180, 'a', ZADANY)
      + napis(71, 109, '1.', JMENO) + napis(207, 136, '2.', JMENO)
      + `</svg>`;
  }

  // Trojboký hranol ležící na boční stěně; přední podstava je rovnoramenný trojúhelník.
  function svgLeziciHranol(z, v) {
    const k = Math.min(150 / z, 80 / v), Z = z * k, V = v * k, g = Math.max(22, V * 0.55), x0 = 40, y0 = 150;
    /* Hloubka jde STRMĚ vzhůru (70°): při sklonu jako rovnoběžné promítání (35°)
       byla u ploché podstavy levá stěna střechy jen proužek a těleso se nedalo přečíst. */
    const P1 = bod(x0, y0), P2 = bod(x0 + Z, y0), P3 = bod(x0 + Z / 2, y0 - V), dx = g * 0.36, dy = g;
    const s = Q => bod(Q.x + dx, Q.y - dy), M = bod(x0 + Z / 2, y0);
    return `<svg viewBox="0 0 300 185">`
      + poly([P1, P3, s(P3), s(P1)], BILA) + poly([P2, P3, s(P3), s(P2)], SEDA) + poly([P1, P2, P3], BILA)
      + cara(P3, M, HLEDANY, '4 3') + napis(M.x + 9, (M.y + P3.y) / 2 + 4, 'v', HLEDANY, 'start')
      + napis((P1.x + P2.x) / 2, y0 + 18, `${z} cm`, ZADANY)
      + napis((P2.x + s(P2).x) / 2 + 8, (P2.y + s(P2).y) / 2 + 6, 'v', HLEDANY, 'start')
      + `</svg>`;
  }

  function gen12f() {
    // 2 body — lomená čára v hale tvaru kvádru (věrné M9A/2023, úloha 12; klíč C = 54 m)
    /* Dvě pythagorejské trojice se společnou odvěsnou: [délka, šířka, úhlopříčka
       podlahy] a [šířka, výška, úhlopříčka boční stěny]. Distraktory jsou přesně
       ty z ostrého zadání: výška místo úhlopříčky stěny (46), šířka místo ní (50)
       a všechny čtyři úseky jako úhlopříčka podlahy (68). */
    const [d, s, u, v, w] = pick([[15, 8, 17, 6, 10], [20, 15, 25, 8, 17], [16, 12, 20, 5, 13], [35, 12, 37, 9, 15], [30, 16, 34, 12, 20], [40, 9, 41, 12, 15]]);
    const L = 2 * u + 2 * w;
    const sh = volbyMC(L, [2 * u + 2 * v, 2 * u + 2 * s, 4 * u], 4, 'jiná délka', x => `${x} m`);
    return {
      no: 12, points: 2, title: 'Lomená čára v hale', kind: 'mc', okruh: 'telesa',
      svg: svgHala(d, s, v),
      intro: `Vnitřní prostor haly má tvar kvádru ABCDEFGH, jehož výška je ${v} m a délka ${d} m. Uvnitř haly je na podlaze, stropě a dvou stěnách vyznačena uzavřená lomená čára ACFHA. Úhlopříčka vyznačená na podlaze haly měří ${u} m a tvoří úsek AC této lomené čáry.`,
      prompt: `Jaká je délka lomené čáry ACFHA?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Čára má čtyři úseky: AC a FH jsou stejně dlouhé úhlopříčky podlahy a stropu, CF a HA úhlopříčky dvou shodných bočních stěn. Na boční stěnu potřebuješ šířku haly, kterou dopočítáš z podlahy Pythagorovou větou.`,
        `Šířka: ${u} · ${u} − ${d} · ${d} = ${s * s}, tedy ${s} m. Úhlopříčka boční stěny: ${s} · ${s} + ${v} · ${v} = ${w * w}, tedy ${w} m.`,
        `Délka čáry: 2 · ${u} + 2 · ${w} = ${L} m${odpovedMC(sh)}`]
    };
  }

  function gen12g() {
    // 2 body — krychle s polepenými úhlopříčkami stěn (věrné M9C/2025, úloha 13; klíč B = 10 cm)
    /* Stěna je síť n × n čtverců, šedé leží na úhlopříčce, bílých je n · n − n.
       Hrana je násobek n, aby strana malého čtverce vyšla celá. */
    const [n, slovy] = pick([[4, 'čtyřmi'], [5, 'pěti']]), t = pick([1, 2, 3]), a = n * t, W = 6 * (n * n - n) * t * t;
    const sh = volbyMC(a, [], n === 5 ? 5 : 4, 'jiná délka', x => `${x} cm`);
    return {
      no: 12, points: 2, title: 'Polepená krychle', kind: 'mc', okruh: 'telesa',
      svg: svgPolepenaKrychle(n),
      intro: `Na každé stěně krychle je vždy jedna úhlopříčka celá přelepena ${slovy} shodnými šedými čtverci tak, že sousední čtverce mají právě jeden společný vrchol (viz obrázek). Nepolepená část každé stěny je bílá. Součet obsahů všech bílých nepolepených ploch na povrchu krychle je ${tis(W)} cm².`,
      prompt: `Jakou délku má hrana krychle?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Každá stěna je čtvercová síť ${n} × ${n} shodných čtverců — šedé leží na úhlopříčce a dotýkají se jen rohy. Šedých je na stěně ${n}, bílých tedy ${n * n} − ${n} = ${n * n - n}.`,
        `Bílá plocha jedné stěny: ${tis(W)} : 6 = ${W / 6} cm². Jeden čtverec: ${W / 6} : ${n * n - n} = ${t * t} cm², jeho strana měří ${t} cm.`,
        `Hrana krychle: ${n} · ${t} = ${a} cm${odpovedMC(sh)}`]
    };
  }

  function gen12h() {
    // 2 body — rozdíl objemů dvou krychlí (věrné M9D/2025, úloha 12; klíč C = 37 cm³)
    const a = ri(2, 6), b = a + pick([1, 2]), D = 6 * (b * b - a * a), H = 12 * a, dV = b ** 3 - a ** 3;
    // chyby: objem malé, rozdíl povrchů místo objemů, objem velké
    const sh = volbyMC(dV, [a ** 3, D, b ** 3], 3, 'o jiný objem', x => `o ${x} cm³`);
    return {
      no: 12, points: 2, title: 'Dvě krychle', kind: 'mc', okruh: 'telesa',
      intro: `Povrch malé krychle je o ${D} cm² menší než povrch velké krychle. Součet délek všech hran malé krychle je ${H} cm.`,
      prompt: `O kolik cm³ se liší objem malé a velké krychle?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Z hran malé krychle zjistíš její hranu (krychle má 12 stejných hran). Hranu velké krychle dá její povrch — ten je o ${D} cm² větší a skládá se ze šesti čtverců.`,
        `Malá: ${H} : 12 = ${a} cm, povrch 6 · ${a} · ${a} = ${6 * a * a} cm². Velká: povrch ${6 * a * a} + ${D} = ${6 * b * b} cm², jedna stěna ${6 * b * b} : 6 = ${b * b} cm², hrana ${b} cm.`,
        `Rozdíl objemů: ${b} · ${b} · ${b} − ${a} · ${a} · ${a} = ${dV} cm³${odpovedMC(sh)}`]
    };
  }

  function gen12i() {
    // 2 body — dva hranoly se stejnou podstavou (věrné M9A/2026, úloha 14; klíč B = 6 cm)
    /* Volby ostrého zadání (8, 6, 5, 4, 3) jsou přesně tyhle omyly: dělení
       obsahem podstavy (72 : 9), správně čtyřmi stěnami (72 : 12), šesti
       stěnami (72 : 18) a osmi (72 : 24). Pátá volba tu „jiná" není. */
    const a = pick([2, 3, 4, 5]), dh = ri(2, 8), D = 4 * a * dh;
    const chyby = [D / (a * a), D / (6 * a), D / (8 * a), D / (2 * a)].filter(Number.isInteger);
    const sh = volbyMC(dh, chyby, 1, null, x => `o ${x} cm`);
    return {
      no: 12, points: 2, title: 'Dva hranoly', kind: 'mc', okruh: 'telesa',
      svg: svgDvaHranoly(),
      intro: `První i druhý pravidelný čtyřboký hranol mají podstavnou hranu délky a = ${a} cm. První hranol má o ${D} cm² větší povrch než druhý hranol.`,
      prompt: `O kolik cm se liší výšky obou hranolů?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Podstavy mají oba hranoly stejné, takže se povrchy liší jen pláštěm. Plášť tvoří 4 obdélníky a × výška, a o kolik je vyšší hranol, o tolik je každý z nich delší.`,
        `Na jednu ze 4 stěn připadá ${D} : 4 = ${D / 4} cm².`,
        `Rozdíl výšek: ${D / 4} : ${a} = ${dh} cm${odpovedMC(sh)}`]
    };
  }

  function gen12j() {
    // 2 body — dvoupatrový dort ze dvou válcových forem (věrné M9B/2025, úloha 14; klíč D = 500π cm³)
    const r1 = pick([8, 12, 16]), r2 = r1 * 3 / 4, h = pick([4, 5, 6]), V = h * (r1 * r1 + r2 * r2);
    // chyby: „o čtvrtinu menší" jako „čtvrtina", obě formy velké, rozdíl místo součtu
    const sh = volbyMC(V, [h * (r1 * r1 + (r1 / 4) * (r1 / 4)), 2 * h * r1 * r1, h * (r1 * r1 - r2 * r2)], 10 * h, 'jiný objem', x => `${tis(x)}π cm³`);
    return {
      no: 12, points: 2, title: 'Dort ze dvou forem', kind: 'mc', okruh: 'telesa',
      intro: `Na výrobu dortu byly použity dvě různé formy tvaru rotačního válce. Poloměr podstavy první formy je ${r1} cm a poloměr podstavy druhé formy je o čtvrtinu menší. Výška obou forem je stejná, a to ${h} cm. Dvoupatrový dort je složen z většího a menšího korpusu. Každý korpus má stejný objem jako forma, v níž byl upečen.`,
      prompt: `Jaký je celkový objem obou korpusů dvoupatrového dortu?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Objem válce je π · r · r · výška. „O čtvrtinu menší" znamená, že se z poloměru čtvrtina ODEČTE — zbudou tři čtvrtiny, ne jedna. Výsledek nech s π, jako ve volbách.`,
        `Menší poloměr: ${r1} − ${r1} : 4 = ${r2} cm. Korpusy: ${r1} · ${r1} · ${h} = ${h * r1 * r1} a ${r2} · ${r2} · ${h} = ${h * r2 * r2}, tedy ${h * r1 * r1}π a ${h * r2 * r2}π cm³.`,
        `Celkem: ${h * r1 * r1} + ${h * r2 * r2} = ${V}, objem je ${V}π cm³${odpovedMC(sh)}`]
    };
  }

  function gen12k() {
    // 2 body — ležící trojboký hranol (věrné M9B/2023, úloha 13; klíč C = 300 cm³)
    /* Podstava je rovnoramenný trojúhelník, jehož polovina je pythagorejský
       trojúhelník [polovina základny, výška, rameno]. Výška je vždy kratší než
       rameno i základna, takže „nejkratší hrana hranolu" je opravdu boční hrana. */
    const [pz, v, ram] = pick([[12, 5, 13], [4, 3, 5], [8, 6, 10], [12, 9, 15], [15, 8, 17]]), z = 2 * pz, S = pz * v, V = S * v;
    // chyby: ještě jednou děleno dvěma, zapomenutá polovina v obsahu, délka hranolu = rameno
    const sh = volbyMC(V, [V / 2, z * v * v, S * ram], 10, 'jiný objem', x => `${tis(x)} cm³`);
    return {
      no: 12, points: 2, title: 'Trojboký hranol', kind: 'mc', okruh: 'telesa',
      svg: svgLeziciHranol(z, v),
      intro: `Trojboký hranol je položen na jedné boční stěně. Podstavu hranolu tvoří rovnoramenný trojúhelník, který má základnu délky ${z} cm a obsah ${S} cm². Velikost v výšky na základnu tohoto trojúhelníku je stejná jako délka nejkratší hrany hranolu.`,
      prompt: `Jaký je objem trojbokého hranolu?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Objem hranolu je obsah podstavy krát délka boční hrany. Boční hrana je nejkratší hrana hranolu, tedy stejně dlouhá jako výška v podstavy — a tu dopočítáš z obsahu trojúhelníku (základna · výška : 2).`,
        `Výška podstavy: 2 · ${S} : ${z} = ${v} cm, takže i boční hrana měří ${v} cm (ramena mají ${ram} cm a základna ${z} cm, jsou delší).`,
        `Objem: ${S} · ${v} = ${tis(V)} cm³${odpovedMC(sh)}`]
    };
  }

  function gen13e() {
    // 2 body — rozšíření parkoviště (věrné M9A/2026, úloha 12; klíč C = 75 míst)
    /* Část (místa pro zásobování) zůstává, mění se celek. Kombinace [k, p]
       jsou takové, že letošní celek 100 · Z : p vyjde celý a větší než loňský. */
    const [zlomek, k, p] = pick([['jednu dvacetinu', 20, 4], ['jednu desetinu', 10, 5], ['jednu desetinu', 10, 8], ['jednu osminu', 8, 5], ['jednu pětadvacetinu', 25, 2]]);
    let Z; do { Z = ri(10, 30); } while (!Number.isInteger(100 * Z / p));
    const loni = Z * k, letos = 100 * Z / p, ans = letos - loni;
    const mist = x => `o ${tis(x)} ${skl(x, 'místo', 'místa', 'míst')}`;   // „o 1 250 míst", ne „o 1250"
    // chyby: letošní kapacita, loňská kapacita
    const sh = volbyMC(ans, [letos, loni], 25, 'o jiný počet míst', mist);
    return {
      no: 13, points: 2, title: 'Parkoviště', kind: 'mc', okruh: 'procenta',
      intro: `Na parkovišti je ${Z} míst vyhrazeno pro zásobování. Zatímco loni tato místa představovala ${zlomek} celkové kapacity parkoviště, letos díky rozšíření parkoviště představují tato místa pouze ${p} % celkové kapacity.`,
      prompt: `O kolik parkovacích míst se díky rozšíření parkoviště zvětšila jeho celková kapacita?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Míst pro zásobování je loni i letos stejně, mění se jen celková kapacita. Z části a jejího podílu dopočítáš celek zvlášť pro loňský a zvlášť pro letošní rok, a ty pak odečteš.`,
        `Loni: ${Z} · ${k} = ${loni} míst. Letos je ${Z} míst ${p} %, tedy 1 % je ${Z} : ${p} = ${cz(Z / p)} a celek ${cz(Z / p)} · 100 = ${letos} míst.`,
        `Kapacita se zvětšila o ${letos} − ${loni} = ${ans} míst${odpovedMC(sh)}`]
    };
  }

  function gen13f() {
    // 2 body — pomlázky prodané za dva dny (věrné M9B/2023, úloha 14; klíč A = 60)
    /* Distraktory ostrého zadání (45, 36, 30 u rozdílu 180) jsou 180 děleno 4, 5
       a 6 — tedy počtem dílů druhého dne, všech dílů a o jeden víc. */
    const [slovo, k] = pick([['pětinu', 5], ['čtvrtinu', 4], ['šestinu', 6]]), x = ri(3, 12) * 5, D = (k - 2) * x;
    const kusu = v => `${v} ${skl(v, 'pomlázku', 'pomlázky', 'pomlázek')}`;
    const sh = volbyMC(x, [D / (k - 1), D / k, D / (k + 1)].filter(Number.isInteger), 5, 'jiný počet pomlázek', kusu);
    return {
      no: 13, points: 2, title: 'Pomlázky', kind: 'mc', okruh: 'slovni',
      intro: `Košíkář prodal během prvních dvou dnů velikonočních trhů všechny upletené pomlázky. První den prodal ${slovo} všech upletených pomlázek. Druhý den prodal o ${D} pomlázek více než první den.`,
      prompt: `Kolik pomlázek prodal košíkář první den velikonočních trhů?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Rozděl všechny pomlázky na ${k} ${k <= 4 ? 'stejné díly' : 'stejných dílů'}. První den prodal 1 díl, druhý den zbytek, tedy ${dily(k - 1)}. Druhý den prodal víc právě o ${k - 1} − 1 = ${dily(k - 2)}.`,
        `Rozdíl ${D} pomlázek tedy odpovídá ${k - 2} ${skl(k - 2, 'dílu', 'dílům', 'dílům')}.`,
        `První den (jeden díl): ${D} : ${k - 2} = ${x} pomlázek${odpovedMC(sh)}`]
    };
  }

  function gen13g() {
    // 2 body — hrnky vody do kanystru (věrné M9B/2026, úloha 14; klíč A = 350 ml)
    /* n hrnků je p/q kanystru; po n + 1 hrncích chybí c hrnků. Pro q − p = 1
       je n = p · (c + 1). Distraktor Z : (c + 2) je volba D ostrého zadání. */
    const [slovy, p, q, jednaq] = pick([['sedm osmin', 7, 8, 'osmina'], ['tři čtvrtiny', 3, 4, 'čtvrtina'], ['pět šestin', 5, 6, 'šestina'], ['čtyři pětiny', 4, 5, 'pětina']]);
    const c = pick([2, 3, 4]), n = p * (c + 1), h = pick([150, 200, 250, 300, 350, 400]), Z = c * h, K = q * n / p;
    const sh = volbyMC(h, [Z / (c + 1), Z / (c - 1), Z / (c + 2)].filter(Number.isInteger), 50, 'jiný objem', x => `${tis(x)} ml`);
    return {
      no: 13, points: 2, title: 'Kanystr', kind: 'mc', okruh: 'slovni',
      // „bylo zaplněno sedm osmin", ale „byly zaplněny tři čtvrtiny" (2–4 → sloveso v množném čísle)
      intro: `Pomocí hrnku naléváme do prázdného kanystru vodu ze studánky. Po nalití ${n} hrnků plných vody ${p <= 4 ? 'byly zaplněny' : 'bylo zaplněno'} ${slovy} objemu kanystru. Když jsme přilili ještě 1 hrnek plný vody, do úplného zaplnění kanystru chybělo ${tis(Z)} ml vody.`,
      prompt: `Jaký je objem hrnku?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Nejdřív zjisti, kolik hrnků pojme celý kanystr: ${n} hrnků naplní ${slovy} objemu, takže jedna ${jednaq} je ${n} : ${p} = ${n / p} ${skl(n / p, 'hrnek', 'hrnky', 'hrnků')} a celý kanystr ${q} · ${n / p} = ${K} hrnků.`,
        `Po ${n + 1} hrncích chybí ${K} − ${n + 1} = ${c} ${skl(c, 'hrnek', 'hrnky', 'hrnků')}, a to je ${tis(Z)} ml.`,
        `Objem hrnku = ${tis(Z)} : ${c} = ${h} ml${odpovedMC(sh)}`]
    };
  }

  function gen13h() {
    // 2 body — vagony na třech kolejích (věrné M9D/2025, úloha 13; klíč E = 14)
    /* Pět číselných voleb bez „jiný": počty na první, druhé a třetí koleji
       a rozdíl třetí a druhé jsou přesně ty chyby, které se tu dělají. */
    const d = pick([2, 3, 4, 5]), [kSlovo, k] = pick([['dvakrát', 2], ['třikrát', 3]]), x = ri(4, 12);
    const v2 = x + d, v3 = k * v2, T = x + v2 + v3, ans = v3 - x;
    const vag = v => `o ${v} ${skl(v, 'vagon', 'vagony', 'vagonů')}`;
    const sh = volbyMC(ans, [x, v2, v3, v3 - v2], 1, null, vag);
    return {
      no: 13, points: 2, title: 'Vlaky na kolejích', kind: 'mc', okruh: 'slovni',
      intro: `Ve stanici ${pick(['Lichá Lhota', 'Horní Lhota', 'Suchá Lhota'])} stojí na každé ze tří kolejí jeden vlak. Vlak na druhé koleji má o ${d} ${skl(d, 'vagon', 'vagony', 'vagonů')} více než vlak na první koleji a ${kSlovo} méně vagonů než vlak na třetí koleji. Všechny tři vlaky dohromady mají ${T} vagonů.`,
      prompt: `O kolik vagonů více má vlak na třetí koleji než vlak na první koleji?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Označ x počet vagonů na první koleji. Druhý vlak má x + ${d}, třetí ${kSlovo} víc než druhý, tedy ${k} · (x + ${d}). Všechny tři dohromady dávají ${T}.`,
        `x + (x + ${d}) + ${k} · (x + ${d}) = ${T}, tedy ${k + 2}x + ${d * (k + 1)} = ${T} a x = (${T} − ${d * (k + 1)}) : ${k + 2} = ${x}.`,
        `Vlaky mají ${x}, ${v2} a ${v3} vagonů; rozdíl ${v3} − ${x} = ${ans}${odpovedMC(sh)}`]
    };
  }

  function gen13i() {
    // 2 body — cena kytice z poměrů (věrné nanečisto 2025, úloha 12; klíč D = 1 300 Kč)
    /* Růže : statice = (m + 1) : m, takže o kolik je růží víc, tolik je jeden
       díl. Chryzantémy musí vyjít celé, proto se kombinace losuje znovu. */
    let m, u, w, t;
    do { [m, u, w] = pick([[4, 2, 3], [3, 3, 4], [2, 2, 3], [4, 4, 5], [5, 5, 4]]); t = pick([2, 3]); } while (!Number.isInteger(m * t * w / u));
    const R = (m + 1) * t, S = m * t, Cc = S * w / u;
    // Ceny se liší, jinak by záměna static a chryzantém dala stejnou částku a nešla odhalit.
    const [cr, cc, cs] = [pick([45, 50, 54, 60]), pick([35, 40, 45]), pick([25, 28, 32])];
    const cena = (r, c, s) => r * cr + c * cc + s * cs, spravne = cena(R, Cc, S);
    // chyby: prohozené statice a chryzantémy, prohozené růže a statice, díl neroznásobený
    const sh = volbyMC(spravne, [cena(R, S, Cc), cena(S, Cc, R), cena(m + 1, w * m / u, m)].filter(Number.isInteger), 20, 'jinou částku', x => `${tis(x)} korun`);
    return {
      no: 13, points: 2, title: 'Kytice', kind: 'mc', okruh: 'pomer',
      intro: `Kytice byla svázána ze tří druhů květin: růží, chryzantém a static. Růží a chryzantém dohromady je v kytici o ${t} více než chryzantém a static dohromady. Počet růží ku počtu static je v poměru ${m + 1} ∶ ${m}, počet static ku počtu chryzantém v poměru ${u} ∶ ${w}. Jeden kus stojí: růže ${cr} Kč, chryzantéma ${cc} Kč, statice ${cs} Kč. Cena celé kytice je součtem cen všech jejích květin.`,
      prompt: `Kolik korun bude stát celá kytice?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Chryzantémy jsou na obou stranách porovnání, takže se odečtou: růží je o ${t} více než static. Poměr ${m + 1} ∶ ${m} říká, že růže mají o 1 díl víc než statice — jeden díl je tedy ${t}.`,
        `Růží ${m + 1} · ${t} = ${R}, static ${m} · ${t} = ${S}, chryzantém ${S} : ${u} · ${w} = ${Cc}.`,
        `Cena: ${R} · ${cr} + ${Cc} · ${cc} + ${S} · ${cs} = ${tis(spravne)} Kč${odpovedMC(sh)}`]
    };
  }

  // Dvojitý sloupcový graf (Jonáš a Beáta) pro Ptačí hodinku. Neznámé hodnoty
  // (null) mají čárkovaný sloupec a „?". Hodnoty nesou data-kdo a data-druh,
  // aby je dopočet četl z KRESBY, jako žák.
  function svgPtaci(nazvy, J, B) {
    const baseY = 156, maxH = 100, x0 = 34, sk = (300 - x0 - 8) / nazvy.length, bw = 17;
    const max = Math.max(...J.concat(B).filter(v => v !== null)) || 1;
    let out = `<svg viewBox="0 0 300 182">`
      + `<line x1="${x0 - 6}" y1="${baseY}" x2="294" y2="${baseY}" stroke="#19e6e6" stroke-width="2"/>`
      + `<line x1="${x0 - 6}" y1="30" x2="${x0 - 6}" y2="${baseY}" stroke="#19e6e6" stroke-width="2"/>`
      + `<rect x="${x0 + 40}" y="8" width="12" height="12" fill="#1b6f8f" stroke="#19e6e6" stroke-width="1"/>` + txt12(x0 + 57, 18, 'Jonáš', VRCHOL, 'start')
      + `<rect x="${x0 + 130}" y="8" width="12" height="12" fill="#0e4a6e" stroke="#19e6e6" stroke-width="1"/>` + txt12(x0 + 147, 18, 'Beáta', VRCHOL, 'start');
    nazvy.forEach((n, i) => {
      const gx = x0 + i * sk + (sk - 2 * bw - 3) / 2;
      [[J[i], 'J', gx, '#1b6f8f'], [B[i], 'B', gx + bw + 3, '#0e4a6e']].forEach(([v, kdo, x, fill]) => {
        const nezn = v === null, h = nezn ? Math.round(maxH * 0.55) : Math.round(maxH * v / max);
        if (nezn || v > 0) out += `<rect x="${r1(x)}" y="${baseY - h}" width="${bw}" height="${h}" fill="${nezn ? '#3a2a52' : fill}" stroke="${nezn ? '#ff3d7f' : '#19e6e6'}" stroke-width="1.5"${nezn ? ' stroke-dasharray="4 3"' : ''}/>`;
        out += `<text data-kdo="${kdo}" data-druh="${i}" x="${r1(x + bw / 2)}" y="${baseY - h - 4}" fill="${nezn ? '#ff3d7f' : '#39ff9e'}" font-size="11" font-family="monospace" text-anchor="middle">${nezn ? '?' : v}</text>`;
      });
      // 10 px: „červenka" (8 znaků) má ve 12 px 58 px a sloupcová skupina jen 52 px.
      out += `<text x="${r1(x0 + i * sk + sk / 2)}" y="${baseY + 16}" fill="${VRCHOL}" font-size="10" font-family="monospace" text-anchor="middle">${n}</text>`;
    });
    return out + `</svg>`;
  }

  function gen14g() {
    // 2 body — Ptačí hodinka: dvojitý sloupcový graf se dvěma neznámými (věrné M9D/2025, úloha 14; klíč A = 2)
    /* Z grafu chybí Jonášovy pěnkavy a Beátiny brhlíky. Pěnkavy se dopočítají
       z porovnání se sýkorami, brhlíky z toho, že Jonáš viděl o pětinu víc ptáků
       (jeho součet je 1,2násobek Beátina). Losuje se, dokud vše nevyjde celé. */
    const JM = ['kos černý', 'brhlík lesní', 'sýkora koňadra', 'červenka obecná', 'pěnkava obecná'], KR = ['kos', 'brhlík', 'sýkora', 'červenka', 'pěnkava'];
    let J, B, d, sJ, sB;
    do {
      B = JM.map(() => ri(1, 8)); B[pick([0, 3])] = 0;
      J = JM.map(() => ri(1, 8));
      sB = B.reduce((x, y) => x + y, 0); sJ = 6 * sB / 5;
      J[4] = sJ - (J[0] + J[1] + J[2] + J[3]);
      d = J[2] + B[2] - J[4] - B[4];
    } while (!Number.isInteger(sJ) || J[4] < 1 || J[4] > 9 || d < 2);
    const x = B[1], ostatni = B.filter((v, i) => i !== 1 && v > 0);
    // chyby: Jonášovy pěnkavy vynechané, „o pětinu více" jako odečtení pětiny z Jonášova součtu, Jonášův brhlík
    const sJbez = sJ - J[4], chyby = [sJbez * 5 / 6 - (sB - x), sJ * 4 / 5 - (sB - x), J[1]].filter(v => Number.isInteger(v));
    const jed = v => `${v} ${skl(v, 'jedinec', 'jedince', 'jedinců')}`;
    const sh = volbyMC(x, chyby, 1, 'jiný počet jedinců', jed);
    return {
      no: 14, points: 2, title: 'Ptačí hodinka', kind: 'mc', okruh: 'data',
      svg: svgPtaci(KR, J.map((v, i) => (i === 4 ? null : v)), B.map((v, i) => (i === 1 ? null : v))),
      intro: `Jonáš a Beáta se zapojili do programu Ptačí hodinka. Každý v okolí svého krmítka sledoval výskyt ptáků (${JM.join(', ')}) v průběhu jedné vybrané hodiny. U každého ptačího druhu zaznamenali do grafu vždy nejvyšší počet jedinců spatřených najednou. Jonáš spatřil pět druhů ptáků, zatímco Beáta pouze čtyři z nich. Oba dohromady zaznamenali pěnkav o ${d} méně než sýkor. Jonáš zaznamenal celkem o pětinu více ptačích jedinců než Beáta.`,
      prompt: `Kolik jedinců brhlíka lesního zaznamenala Beáta?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`V grafu chybějí dvě hodnoty: Jonášovy pěnkavy a Beátiny brhlíky. Pěnkavy dopočítáš z porovnání se sýkorami, brhlíky z celkových počtů — „o pětinu více" znamená, že Jonášův součet je 1,2násobek Beátina.`,
        `Sýkor dohromady ${J[2]} + ${B[2]} = ${J[2] + B[2]}, pěnkav o ${d} méně, tedy ${J[2] + B[2] - d}; Jonášových pěnkav ${J[2] + B[2] - d} − ${B[4]} = ${J[4]}. Jonáš celkem ${J.join(' + ')} = ${sJ}.`,
        `Beáta celkem ${sJ} : 1,2 = ${sB}; bez brhlíků má ${ostatni.join(' + ')} = ${sB - x}, brhlíků tedy ${sB} − ${sB - x} = ${x}${odpovedMC(sh)}`]
    };
  }

  const O_KOLIK_VETSI = [[3, 'o třetinu'], [4, 'o čtvrtinu'], [5, 'o pětinu']];
  function gen6g() {
    // 2 body — „o třetinu větší" počítané z menšího (věrné M9A/2026, úloha 5)
    const [n, slovy] = pick(O_KOLIK_VETSI), d = pick([30, 40, 50, 60, 70, 80, 90, 100, 120]);
    const V = (n + 1) * d, men = n * d, pct = 100 / (n + 1), presne = Number.isInteger(pct);
    return {
      no: 6, points: 2, title: 'Dva sudy', okruh: 'slovni',
      intro: `Větší sud má ${slovy} větší objem než menší sud. Objem většího sudu je ${V} litrů.`,
      parts: [
        { key: '6.1', points: 1, prompt: `Vypočítejte v litrech objem menšího sudu.`, ans: String(men),
          sol: [`„${slovy.charAt(0).toUpperCase() + slovy.slice(1)} větší" se počítá z MENŠÍHO sudu: větší sud je menší sud a k tomu ještě ${n === 3 ? 'jeho třetina' : n === 4 ? 'jeho čtvrtina' : 'jeho pětina'}. Proto menší sud NEdostaneš tak, že od většího odečteš ${slovy.slice(2)} většího.`,
            `Menší sud má ${n} ${skl(n, 'díl', 'díly', 'dílů')}, větší ${n} + 1 = ${n + 1} ${skl(n + 1, 'díl', 'díly', 'dílů')}: 1 díl = ${V} : ${n + 1} = ${d} l.`,
            `Menší sud = ${n} · ${d} = ${men} l.`] },
        { key: '6.2', points: 1, prompt: `O kolik procent je objem menšího sudu menší než objem většího sudu?${presne ? '' : ' Výsledek zaokrouhlete na desetiny procenta.'}`,
          ans: String(presne ? pct : r1(pct)),
          sol: [`Procenta se počítají z toho, s ČÍM srovnáváš. Ptáme se, o kolik je menší sud menší než VĚTŠÍ, takže základem (100 %) je větší sud — proto nevyjde totéž číslo jako „${slovy}".`,
            `Rozdíl objemů: ${V} − ${men} = ${d} l.`,
            `${d} l z ${V} l je ${d} : ${V} · 100 ${presne ? '=' : '≈'} ${cz(presne ? pct : r1(pct))} %.`] }
      ]
    };
  }

  /* ── SLOTY 1–16 ─────────────────────────────────────────────────
     Každá pozice testu je POLE variant (zatím vždy jedna). Pro
     přidání další varianty do pozice N stačí dopsat další funkci do
     SLOTS[N-1] se STEJNÝM tvarem návratové hodnoty (points musí sedět
     na stejné číslo jako ostatní varianty té pozice, jinak se pokazí
     bodový součet 50). generate() při každém spuštění testu náhodně
     vybere jednu variantu z každé pozice.
     ──────────────────────────────────────────────────────────────── */
  const SLOTS = [
    [gen1, gen1b, gen1c, gen1d, gen1e, gen1f, gen1g, gen1h, gen1i, gen1j, gen1k], [gen2, gen2b, gen2c, gen2d, gen2e, gen2f], [gen3, gen3b, gen3c, gen3d, gen3e, gen3f], [gen4, gen4d, gen4e, gen4f, gen4g], [gen5, gen5b, gen5c, gen5d, gen5e], [gen6, gen6b, gen6c, gen6d, gen6e, gen6f, gen6g], [gen7, gen7b, gen7c, gen7d, gen7e, gen7f], [gen8, gen8b, gen8c, gen8d, gen8e, gen8f],
    [gen9, gen9b, gen9c, gen9d, gen9e, gen9f], [gen10, gen10b, gen10c, gen10d, gen10e, gen10f], [gen11, gen11b, gen11c, gen11d, gen11e, gen11f, gen11g, gen11h], [gen12, gen12c, gen12e, gen12f, gen12g, gen12h, gen12i, gen12j, gen12k], [gen13, gen13b, gen13c, gen13d, gen13e, gen13f, gen13g, gen13h, gen13i], [gen14, gen14b, gen14c, gen14d, gen14e, gen14f, gen14g], [gen15, gen15b, gen15c, gen15d, gen15e, gen15f, gen15g, gen15h], [gen16, gen16b, gen16c, gen16d, gen16e, gen16f, gen16g, gen16h, gen16i, gen16j]
  ];

  window.RPG_CERMAT_9 = {
    timeLimitSec: 70 * 60,
    maxScore: 50,
    generate: function () {
      return SLOTS.map(variants => pick(variants)());
    },
    // Vystaveno pro přijímačkový hub (procvičování po tématech): 16 pozic testu,
    // každá = pole variant. genSlot(i) vygeneruje úlohu z pozice i (0-indexováno).
    slotCount: function () { return SLOTS.length; },
    genSlot: function (i) { return pick(SLOTS[i])(); }
  };
})();
