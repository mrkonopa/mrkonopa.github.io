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
    // 1 bod — druhá odmocnina součinu; součin je vždy druhá mocnina ⇒ výsledek CELÉ číslo (bez kalkulačky)
    const k = ri(2, 3), v = ri(2, 3);
    const a = k, b = k * v * v;       // a·b = k²·v² = (k·v)²
    const root = k * v;
    return {
      no: 1, points: 1, title: 'Číselný výraz',
      parts: [{ key: '', points: 1,
        prompt: `Vypočítejte druhou odmocninu ze součinu čísel ${a} a ${b}: √(${a} · ${b}) =`,
        ans: String(root),
        /* Postup má tři kroky v pevném tvaru: PRAVIDLO (proč se to dělá
           takhle) → DOSAZENÍ (s mezivýsledkem) → VÝSLEDEK. Kdo úlohu
           spletl, potřebuje nejdřív to pravidlo; samotná aritmetika mu
           řekne jen to, že se netrefil. */
        sol: [
          `Odmocnit jde až jedno číslo — nejdřív tedy spočítej, co je pod odmocninou.`,
          `Součin: ${a} · ${b} = ${a * b}.`,
          `√${a * b} = ${root}, protože ${root} · ${root} = ${a * b}.`
        ] }]
    };
  }

  function gen2() {
    // 3 body — dva výrazy se zlomky, druhý s postupem
    /* 🔴 Rozsahy b (2–6) a c (3–9) se PŘEKRÝVAJÍ, takže se losovalo
       b = c, a pak je 1/b − 1/c nula — zadání „(−3) · (1/3 − 1/3)"
       nezkouší vůbec nic. Naměřeno na 10 024 generováních: 11,4 %.
       c = b + 1 zůstává v původním rozsahu (b je nejvýš 6). */
    const a = ri(2, 6), b = ri(2, 6);
    let c = ri(3, 9);
    if (c === b) c = b + 1;
    // 2.1: (-a) * (1/b - 1/c)
    const v1 = (-a) * (1 / b - 1 / c);
    const num1 = -a * (c - b), den1 = b * c, g1 = gcd(Math.abs(num1), den1);
    const ans1 = g1 === den1 ? String(num1 / g1) : `${num1 / g1}/${den1 / g1}`;
    // 2.2: (d^2 - e^2) / f  s postupem — f je dělitel num2 ⇒ výsledek CELÉ číslo
    /* Dřív při rozdílu bez dělitele 2–6 (4² − 3² = 7, 7² − 6² = 13) padlo
       f = 1 a zadání dělilo jedničkou. Takové dvojice se teď přelosují. */
    let d, e, num2, fCand;
    do { d = ri(4, 9); e = ri(2, d - 1); num2 = d * d - e * e; fCand = [2, 3, 4, 5, 6].filter(x => num2 % x === 0); }
    while (!fCand.length);
    const f = pick(fCand);
    const ans2 = num2 / f;
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `Vypočítejte a výsledek zapište zlomkem v základním tvaru: (−${a}) · (1/${b} − 1/${c}) =`,
          ans: ans1,
          sol: [
            `Zlomky se dají odečíst, teprve když mají stejného jmenovatele — nejdřív tedy uprav závorku.`,
            `Společný jmenovatel je ${b} · ${c} = ${b * c}, takže 1/${b} − 1/${c} = ${c}/${b * c} − ${b}/${b * c} = ${zlS(c - b, b * c)}.`,
            `Vynásob číslem −${a}: (−${a}) · ${zlZ(c - b, b * c)} = ${zlS(num1, den1)}.`,
            g1 === 1 ? `Zlomek ${zlS(num1, den1)} už je v základním tvaru: ${ans1.replace('-', '−')}.`
              : `Krať největším společným dělitelem, tedy ${g1}: ${ans1.replace('-', '−')}.`
          ] },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `Vypočítejte: (${d}² − ${e}²) : ${f} =`,
          ans: String(ans2),
          sol: [
            `Závorka má přednost — spočítej ji celou dřív, než začneš dělit.`,
            `Umocni obě čísla: ${d}² = ${d * d} a ${e}² = ${e * e}, takže závorka je ${d * d} − ${e * e} = ${num2}.`,
            `Nakonec vyděl: ${num2} : ${f} = ${ans2}.`
          ] }
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
    // 4 body — rovnice s postupem
    // p(a4 − x) = q(x − b4)  ⇒  p·a4 + q·b4 = (p+q)·x
    // Kořen VOLÍME celý a dopočítáme a4, aby vyšel PŘESNĚ — dřív se a4/b4 losovaly
    // nezávisle, takže kořen býval neukončený (91 : 11) a zadání ho tiše
    // zaokrouhlovalo na 2 des. místa. Žák, který počítal správně a zaokrouhlil
    // jinak, dostal „špatně" — a přijímačky mají kořeny celé.
    const x2 = ri(2, 9);
    const kq = ri(1, 3);
    const p = ri(2, 6), q = p * kq;      // q násobkem p ⇒ a4 vyjde celé
    const b4 = ri(1, x2 - 1);
    const a4 = x2 + kq * (x2 - b4);      // p(a4 − x2) = p·kq·(x2 − b4) = q(x2 − b4) ✓
    const y1 = ri(2, 9);
    const c4 = ri(2, 5) / 10;            // koeficient v závorce (0,2–0,5)
    const diff = ri(2, 3) / 10;          // koeficient u y v rovnici (0,2–0,3) — NENULOVÝ ⇒ jednoznačný kořen
    const m4 = ri(2, 8);
    const n4 = r1(1 - c4 - diff);        // koeficient u y vpravo; 1−c4−n4 = diff ≠ 0
    const cm4 = r1(c4 * m4);
    const o4 = r1(y1 * diff - cm4);      // konstanta tak, aby kořen byl přesně y1
    const o4sign = o4 < 0 ? `− ${cz(-o4)}` : `+ ${cz(o4)}`;
    const lhsY = r1(1 - c4);
    return {
      no: 4, points: 4, title: 'Rovnice',
      parts: [
        { key: '4.1', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen x: ${p}·(${a4} − x) = ${q}·(x − ${b4})`,
          ans: String(x2),
          sol: [
            `Nejdřív roznásob obě závorky — číslo před závorkou násobí KAŽDÝ člen uvnitř. Pak převeď členy s x na jednu stranu a čísla na druhou.`,
            `${p}·${a4} − ${p}x = ${q}x − ${q}·${b4}, tedy ${p * a4} − ${p}x = ${q}x − ${q * b4}.`,
            `Členy s x doprava, čísla doleva (přes rovnítko mění znaménko): ${p * a4} + ${q * b4} = ${q}x + ${p}x, čili ${p * a4 + q * b4} = ${p + q}x.`,
            `x = ${p * a4 + q * b4} : ${p + q} = ${x2}.`
          ] },
        { key: '4.2', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen y: y − (y + ${m4})·${cz(c4)} = ${cz(n4)}y ${o4sign}`,
          ans: String(y1),
          sol: [
            `Roznásob závorku — desetinné číslo za ní násobí oba členy. Pak dej členy s y na jednu stranu a čísla na druhou; kdo chce, vynásobí celou rovnici deseti a zbaví se čárek.`,
            `(y + ${m4})·${cz(c4)} = ${cz(c4)}y + ${cz(cm4)}, takže rovnice je ${cz(lhsY)}y − ${cz(cm4)} = ${cz(n4)}y ${o4sign}.`,
            `Členy s y vlevo, čísla vpravo: ${cz(lhsY)}y − ${cz(n4)}y = ${zn(o4)} + ${cz(cm4)}, tedy ${cz(diff)}y = ${cz(r1(o4 + cm4))}.`,
            `y = ${cz(r1(o4 + cm4))} : ${cz(diff)} = ${y1}.`
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
    const b5 = Math.round(domObsah / a5); // šířka domu
    const rybnik = Math.round(cel * ri(10, 25) / 100);
    const volna = cel - Math.round(domObsah) - rybnik;
    const pRybnik = Math.round(rybnik / cel * 100);
    return {
      no: 5, points: 4, title: 'Pozemek',
      svg: (function () {
        const s = 150, x = 30, y = 20;
        return `<svg viewBox="0 0 220 190"><rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" stroke="#19e6e6" stroke-width="2"/><rect x="${x + 12}" y="${y + 10}" width="${s * 0.32}" height="${s * 0.5}" fill="#233" stroke="#39ff9e" stroke-width="1.5"/><text x="${x + s / 2}" y="${y + s + 16}" fill="#fff" font-size="12" font-family="monospace" text-anchor="middle">c = ${c5} m</text></svg>`;
      })(),
      intro: `Pozemek má tvar čtverce se stranou c = ${c5} m. Na pozemku je dům (obdélník) a rybníček. Půdorys domu má obsah rovný pětině rozlohy pozemku.`,
      parts: [
        { key: '5.1', points: 2,
          prompt: `Délka domu a je rovna polovině strany pozemku (a = ${a5} m). Určete šířku domu b (v m, zaokrouhlete na celé metry).`,
          ans: String(b5),
          sol: [`Pozemek je čtverec, takže jeho obsah je strana krát strana: ${c5}² = ${cel} m².`,`Dům zabírá pětinu pozemku: ${cel} : 5 = ${domObsah} m².`,`Obdélníkový dům má obsah délka krát šířka, takže šířku dostaneš dělením: ${domObsah} : ${a5} = ${b5} m (zaokrouhleno na celé metry).`] },
        { key: '5.2', points: 2,
          prompt: `Rybníček má rozlohu ${pRybnik} % celkové rozlohy pozemku. Vypočítejte v m² rozlohu volné části pozemku (bez domu a rybníčku). Použijte obsah domu = ${domObsah} m² a obsah rybníčku = ${rybnik} m².`,
          ans: String(volna),
          sol: [`Volná část je to, co zbyde, když z celého pozemku odečteš dům i rybníček.`,`Obě plochy už znáš ze zadání, takže je jen odečti: ${cel} − ${domObsah} − ${rybnik} = ${volna} m².`] }
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
      no: 6, points: 2, title: 'Sud',
      svg: svgSud(S6),
      intro: `Zahradní sud má tvar rotačního válce. Dno sudu má obsah ${S6} cm².`,
      parts: [
        { key: '6.1', points: 1,
          prompt: `Při dešti stoupla hladina vody v sudu o ${mm1} mm. Kolik litrů vody přibylo (zaokrouhlete na 1 des. místo)?`,
          ans: String(litry1exact),
          sol: `Převeď mm na cm: ${mm1} mm = ${cz(mm1 / 10)} cm. Objem přibylé vody = obsah dna × výška: ${S6} cm² × ${cz(mm1 / 10)} cm = ${cz(r2(S6 * (mm1 / 10)))} cm³. Převeď na litry (1 l = 1000 cm³): ${cz(r2(S6 * (mm1 / 10)))} : 1000 ≈ ${cz(litry1exact)} l.` },
        { key: '6.2', points: 1,
          prompt: `Při lijáku přibylo v sudu ${litry2} l vody. O kolik mm stoupla hladina (zaokrouhlete na celé mm)?`,
          ans: String(Math.round(litry2 * 1000 / S6 * 10)),
          sol: `Převeď litry na cm³: ${litry2} l = ${litry2 * 1000} cm³. Výšku vypočítáš jako objem : obsah dna: ${litry2 * 1000} : ${S6} ≈ ${cz(r2(litry2 * 1000 / S6))} cm. Převeď na mm (×10): ≈ ${Math.round(litry2 * 1000 / S6 * 10)} mm.` }
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
      no: 7, points: 3, title: 'Úhly na rovnoběžkách',
      svg: svgAngles(given),
      intro: `Přímky p, q jsou rovnoběžné a protíná je příčka. Vyznačený úhel na přímce p má velikost ${given}°.`,
      parts: [
        { key: '7.1', points: 1, prompt: `Vypočítejte velikost úhlu α (souhlasný úhel na přímce q).`, ans: String(alpha),
          sol: [`Rovnoběžky protnuté příčkou tvoří dvojice shodných úhlů. Souhlasné úhly leží na stejné straně příčky a u obou rovnoběžek stejně.`,`Souhlasné úhly jsou vždy stejně velké, takže α = ${given}°.`] },
        { key: '7.2', points: 1, prompt: `Vypočítejte velikost úhlu β (vedlejší úhel k α).`, ans: String(beta),
          sol: [`Vedlejší úhly leží u téže přímky vedle sebe a dohromady tvoří přímý úhel 180°.`,`β = 180 − ${given} = ${beta}°.`] },
        { key: '7.3', points: 1, prompt: `Vypočítejte velikost úhlu γ (vrcholový úhel k danému úhlu ${given}° na přímce p).`, ans: String(gamma),
          sol: [`Vrcholové úhly leží proti sobě přes průsečík dvou přímek — nedotýkají se ramenem, jen vrcholem.`,`Takové úhly jsou vždy shodné, takže γ = ${given}°.`] }
      ]
    };
  }

  function gen8() {
    // 4 body — obvod + počítání prvků v pravidelných rozestupech
    // aStr = SUDÝ násobek 3 (12/18/24) ⇒ všechny strany v cm dělitelné rozestupem 40 cm
    // ⇒ počet rostlin i rozdíl vyjdou přesně celočíselně (žádné zaokrouhlování).
    const aStr = ri(2, 4) * 6;
    const bStr = Math.round(aStr * 4 / 3);
    const obvodM = 3 * aStr + bStr;
    const rozestupCm = 40;
    const pocetRostlin = obvodM * 100 / rozestupCm;
    const rostlinB = bStr * 100 / rozestupCm;
    const rostlinA = aStr * 100 / rozestupCm;
    const rozdilRostlin = rostlinB - rostlinA;
    // velikost skupinky = dělitel počtu rostlin ⇒ dělení vyjde přesně
    const skupCand = [2, 3, 4, 5].filter(d => pocetRostlin % d === 0);
    const skupinaVelikost = skupCand[ri(0, skupCand.length - 1)];
    return {
      no: 8, points: 4, title: 'Záhon',
      intro: `Záhon má tvar čtyřúhelníku: tři strany jsou stejně dlouhé (${aStr} m), čtvrtá strana měří ${bStr} m. Po obvodu jsou ve stejných rozestupech ${rozestupCm} cm vysázeny rostliny, po jedné i v každém rohu. Celkem je jich ${pocetRostlin}.`,
      parts: [
        { key: '8.1', points: 2, prompt: `Vypočítejte v metrech obvod záhonu.`, ans: String(obvodM),
          sol: `Tři strany po ${aStr} m: 3 × ${aStr} = ${3 * aStr} m. Přičti čtvrtou stranu ${bStr} m: ${3 * aStr} + ${bStr} = ${obvodM} m.` },
        { key: '8.2', points: 1, prompt: `O kolik se liší počet rostlin na nejdelší straně (${bStr} m) od počtu rostlin na jedné z kratších stran (${aStr} m)?`, ans: String(rozdilRostlin),
          sol: `Na straně ${bStr} m je ${rostlinB} rostlin (${bStr * 100} cm : ${rozestupCm} cm), na straně ${aStr} m je ${rostlinA} rostlin (${aStr * 100} cm : ${rozestupCm} cm). Rozdíl: ${rostlinB} − ${rostlinA} = ${rozdilRostlin}.` },
        { key: '8.3', points: 1, prompt: `Rostliny jsou po obvodu seskupené do skupinek po ${skupinaVelikost}. Kolik skupinek je celkem po obvodu (${pocetRostlin} rostlin)?`, ans: String(pocetRostlin / skupinaVelikost),
          sol: [`Nejdřív musíš znát celkový počet rostlin — ten jsi spočítal v předchozí podúloze (${pocetRostlin}).`,`Skupinky jsou po ${skupinaVelikost}, takže se celkový počet touto velikostí dělí.`,`Počet skupinek = ${pocetRostlin} : ${skupinaVelikost} = ${pocetRostlin / skupinaVelikost}.`] }
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
          sol: `Žebřík, zeď a zem tvoří pravoúhlý trojúhelník s pravým úhlem u paty zdi. Přepona (žebřík) c se počítá z odvěsen a = ${a9} m a b = ${b9} m Pythagorovou větou: c² = a² + b² = ${a9}² + ${b9}² = ${a9 * a9} + ${b9 * b9} = ${a9 * a9 + b9 * b9}. Odmocni: c = √${a9 * a9 + b9 * b9} = ${c9} m.` }
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
    // 4 body -> upraveno na 3 body (3× 1 bod) — pravda/nepravda o tělesech
    const a11 = ri(2, 4), b11 = ri(3, 6), c11 = ri(2, 5);
    const soucetHran = 4 * (a11 + b11 + c11);
    const tvrzeniSoucet = soucetHran + (ri(0, 1) ? 0 : ri(2, 8));
    const st1 = { text: `Součet délek všech hran kvádru s hranami ${a11} cm, ${b11} cm a ${c11} cm je ${tvrzeniSoucet} cm.`, ans: tvrzeniSoucet === soucetHran ? 'A' : 'N',
      sol: [`Kvádr má 12 hran — od každého ze tří rozměrů právě čtyři stejné.`,`Součet všech hran = 4 · (a + b + c) = 4 · (${a11} + ${b11} + ${c11}) = ${soucetHran} cm.`,`Tvrzení uvádí ${tvrzeniSoucet} cm, což je ${tvrzeniSoucet === soucetHran ? 'stejné číslo — tvrzení je PRAVDIVÉ (A).' : 'jiné číslo — tvrzení je NEPRAVDIVÉ (N).'}`] };
    const povrch1 = 2 * (a11 * b11 + b11 * c11 + a11 * c11);
    const a11b = a11 + 1;
    const povrch2 = 2 * (a11b * b11 + b11 * c11 + a11b * c11);
    const rozdilTvrzeny = ri(0, 1) ? (povrch2 - povrch1) : (povrch2 - povrch1) + ri(2, 6);
    const st2 = { text: `Kvádr s hranami ${a11b} cm, ${b11} cm, ${c11} cm má o ${rozdilTvrzeny} cm² větší povrch než kvádr s hranami ${a11} cm, ${b11} cm, ${c11} cm.`, ans: rozdilTvrzeny === (povrch2 - povrch1) ? 'A' : 'N',
      sol: [`Povrch kvádru je plocha všech šesti stěn: S = 2 · (a·b + b·c + a·c).`,`Menší kvádr ${a11}×${b11}×${c11}: S = 2 · (${a11 * b11} + ${b11 * c11} + ${a11 * c11}) = ${povrch1} cm².`,`Větší kvádr ${a11b}×${b11}×${c11}: S = 2 · (${a11b * b11} + ${b11 * c11} + ${a11b * c11}) = ${povrch2} cm².`,`Rozdíl = ${povrch2} − ${povrch1} = ${povrch2 - povrch1} cm². Tvrzení uvádí ${rozdilTvrzeny} cm², takže je ${rozdilTvrzeny === (povrch2 - povrch1) ? 'PRAVDIVÉ (A).' : 'NEPRAVDIVÉ (N).'}`] };
    const objem1 = a11 * b11 * c11;
    const objem2 = a11b * b11 * c11;
    // náhodně obrátit směr tvrzení, ať poslední řádek není vždy 'A' (nepredikovatelné)
    const st3menuje = ri(0, 1);  // true: tvrdí větší (pravda), false: tvrdí menší (nepravda)
    const st3 = st3menuje
      ? { text: `Kvádr s hranami ${a11b} cm, ${b11} cm, ${c11} cm má větší objem než kvádr s hranami ${a11} cm, ${b11} cm, ${c11} cm.`, ans: 'A',
          sol: [`Objem kvádru je součin všech tří hran: V = a · b · c.`,`Menší kvádr ${a11}×${b11}×${c11}: V = ${objem1} cm³. Větší kvádr ${a11b}×${b11}×${c11}: V = ${objem2} cm³.`,`Jedna hrana se zvětšila z ${a11} na ${a11b} cm a ostatní zůstaly stejné, takže objem musí vzrůst: ${objem2} > ${objem1}. Tvrzení je PRAVDIVÉ (A).`] }
      : { text: `Kvádr s hranami ${a11} cm, ${b11} cm, ${c11} cm má větší objem než kvádr s hranami ${a11b} cm, ${b11} cm, ${c11} cm.`, ans: 'N',
          sol: [`Objem kvádru je součin všech tří hran: V = a · b · c.`,`Menší kvádr ${a11}×${b11}×${c11}: V = ${objem1} cm³. Větší kvádr ${a11b}×${b11}×${c11}: V = ${objem2} cm³.`,`Hrana se zvětšila z ${a11} na ${a11b} cm, takže objem VZROSTL (${objem1} < ${objem2}). Tvrzení říká opak, je tedy NEPRAVDIVÉ (N).`] };
    return {
      no: 11, points: 3, title: 'Kvádry',
      kind: 'tfgrid',
      intro: `Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [st1, st2, st3]
    };
  }

  function gen12() {
    // 2 body — MC A-E, objem (bazén se šikmým dnem)
    // Šířka je násobek 10 (ne 15): objem = zonaNepl × sirka × 2,5 musí vyjít CELÝ.
    // Při šířce 15 a délce 30 vycházelo 562,5, ale volby byly 513/538/563/588 —
    // kdo počítal správně, svou hodnotu mezi možnostmi nenašel a „jiný objem“
    // (jediná poctivá volba) se počítal jako chyba. Zasaženo 1 z 6 kombinací.
    const delka = ri(2, 4) * 10, sirka = ri(1, 2) * 10;
    const h1 = 1, h2 = 2;
    const zonaNepl = delka / 2;
    const V = delka === 0 ? 0 : (zonaNepl * sirka * h1) + (zonaNepl * sirka * (h1 + h2) / 2);
    const correct = V;   // celé číslo z konstrukce; kdyby přestalo být, prijimacky-postupy.test.cjs to nahlásí
    const opts = [correct - 50, correct - 25, correct, correct + 25, 'jiný objem'];
    const shuffled = shuffleOpts(opts, correct);
    return {
      no: 12, points: 2, title: 'Bazén',
      kind: 'mc',
      prompt: `Bazén má délku ${delka} m a šířku ${sirka} m. V zóně pro neplavce (polovina délky) je všude hloubka ${h1} m. V zóně pro plavce dno plynule klesá z ${h1} m na ${h2} m. Jaký je objem bazénu?`,
      options: shuffled.labels,
      ans: shuffled.correctLetter,
      sol: `Bazén rozděl na dvě poloviny po délce ${zonaNepl} m. Neplavecká část má všude hloubku ${h1} m: objem = ${zonaNepl} × ${sirka} × ${h1} = ${zonaNepl * sirka * h1} m³. Plavecká část má šikmé dno od ${h1} m do ${h2} m, průměrná hloubka je (${h1}+${h2}):2 = ${cz((h1 + h2) / 2)} m: objem = ${zonaNepl} × ${sirka} × ${cz((h1 + h2) / 2)} = ${cz(zonaNepl * sirka * (h1 + h2) / 2)} m³. Celkový objem = ${zonaNepl * sirka * h1} + ${cz(zonaNepl * sirka * (h1 + h2) / 2)} = ${correct} m³ → odpověď ${shuffled.correctLetter}.`
    };
  }

  function gen13() {
    // 2 body — MC A-E, procenta (tábory)
    const mista = ri(4, 8) * 20;
    const p1 = 20, p2 = 30;
    const prihl1 = Math.round(mista * (1 + p1 / 100));
    const prihl2 = Math.round(mista * (1 + p2 / 100));
    const celkem = prihl1 + prihl2;
    const odmitnuto = celkem - 2 * mista;
    const opts = [odmitnuto - 10, odmitnuto - 5, odmitnuto, odmitnuto + 5, 'jiný počet'];
    const shuffled = shuffleOpts(opts, odmitnuto);
    return {
      no: 13, points: 2, title: 'Letní tábory',
      kind: 'mc',
      prompt: `Tábor měl dva termíny se stejným počtem míst. Celkem přišlo ${celkem} přihlášek. V prvním termínu počet přihlášek překročil počet míst o ${p1} %, ve druhém o ${p2} %. Kolik přihlášek muselo být kvůli nedostatku míst odmítnuto?`,
      options: shuffled.labels,
      ans: shuffled.correctLetter,
      sol: `V prvním termínu přišlo ${prihl1} přihlášek (${mista} + ${p1} % = ${mista} × 1,2 = ${prihl1}), ve druhém ${prihl2} přihlášek (${mista} × 1,3 = ${prihl2}). Celkem ${prihl1} + ${prihl2} = ${celkem} přihlášek na ${2 * mista} míst (2 × ${mista}). Odmítnuto bylo ${celkem} − ${2 * mista} = ${odmitnuto} přihlášek → odpověď ${shuffled.correctLetter}.`
    };
  }

  function gen14() {
    // 2 body — MC A-E, statistika/průměr
    const n14 = 20;
    // průměr 1,5–1,9: se známkami 1 a 2 je průměr vždy v (1;2) ⇒ počet jedniček 2–10 (kladný)
    const prumer = ri(15, 19) / 10;
    // zjednodušený model: známky 1 a 2, žádné jiné
    const soucetZnamek = Math.round(prumer * n14);
    const pocetJednicek = 2 * n14 - soucetZnamek; // z: 1*j + 2*(n-j) = soucet -> j = 2n - soucet
    const opts = [pocetJednicek - 2, pocetJednicek - 1, pocetJednicek, pocetJednicek + 1, pocetJednicek + 2];
    const shuffled = shuffleOpts(opts, pocetJednicek);
    return {
      no: 14, points: 2, title: 'Testové známky',
      kind: 'mc',
      prompt: `Test psalo ${n14} žáků, každý dostal známku 1 nebo 2. Aritmetický průměr známek byl ${cz(prumer)}. Kolik žáků dostalo jedničku?`,
      options: shuffled.labels,
      ans: shuffled.correctLetter,
      sol: [`Průměr je součet dělený počtem, takže součet dostaneš zpětně vynásobením: ${cz(prumer)} × ${n14} = ${soucetZnamek}.`,`Označ si j počet jedniček. Zbylých ${n14} − j žáků má dvojku, takže součet je 1·j + 2·(${n14} − j) = ${2 * n14} − j.`,`Tenhle součet se musí rovnat ${soucetZnamek}, odtud ${2 * n14} − j = ${soucetZnamek}.`,`Počet jedniček j = ${2 * n14} − ${soucetZnamek} = ${pocetJednicek} → odpověď ${shuffled.correctLetter}.`]
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
          sol: [`Rám je mezikruží — plocha, která zbyde, když z celého obrázku vyjmeš bílý čtverec uprostřed.`,`Obsah celého obrázku: ${side(w1)}² = ${side(w1) * side(w1)} cm².`,`Obsah bílého čtverce: ${w1}² = ${w1 * w1} cm².`,`Obsah rámu = ${side(w1) * side(w1)} − ${w1 * w1} = ${frameArea(w1)} cm².`] },
        { key: '16.3', points: 1, prompt: `Jaká je délka strany celého obrázku, má-li bílý čtverec stranu ${w3} cm (v cm)?`, ans: String(side(w3)),
          sol: [`Postupuj stejně jako v předchozí podúloze — rám přidá ${RAM} cm na obou protějších stranách.`,`Strana obrázku = ${w3} + ${2 * RAM} = ${side(w3)} cm.`] }
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
      no: 1, points: 1, title: 'Číselný výraz',
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

  function gen4b() {
    // 4 body — dvě lineární rovnice (2+2), s postupem
    /* a − c aspoň 2: dřív mohlo vyjít 1, a poslední krok pak dělil
       jedničkou („1x = 7, x = 7 : 1"). */
    const x1 = ri(2, 9);
    const a = ri(4, 7), c = ri(2, a - 2), b = ri(1, 9);
    const d = (a - c) * x1 + b; // a*x1+b = c*x1+d
    /* mm musí vyjít kladné: n·k se losovalo od 6 a x2 do 9, takže vznikalo
       „(x + 0) : 2 = 3" i „(x + −3) : 2 = 3". */
    let x2, k, n, mm;
    do { x2 = ri(2, 9); k = ri(2, 5); n = ri(3, 8); mm = n * k - x2; } while (mm < 1); // (x2+mm)/k = n
    return {
      no: 4, points: 4, title: 'Rovnice',
      parts: [
        { key: '4.1', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen x: ${a}x + ${b} = ${c}x + ${d}`,
          ans: String(x1),
          sol: [
            `Neznámou dostaň na jednu stranu a čísla na druhou. Co přenášíš přes rovnítko, mění znaménko — z +${c}x vpravo se vlevo stane −${c}x.`,
            `${a}x − ${c}x = ${d} − ${b}.`,
            `${a - c}x = ${d - b}.`,
            `x = ${d - b} : ${a - c} = ${x1}.`
          ] },
        { key: '4.2', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen x: (x + ${mm}) : ${k} = ${n}`,
          ans: String(x2),
          sol: [
            `Dělení se zbavíš tak, že obě strany rovnice vynásobíš číslem ${k}; závorka se tím uvolní celá a zbude jednoduchá rovnice.`,
            `x + ${mm} = ${n} · ${k} = ${n * k}.`,
            `x = ${n * k} − ${mm} = ${x2}.`
          ] }
      ]
    };
  }

  function gen7b() {
    // 3 body — úhly v trojúhelníku (součet 180°) + vnější úhel
    const al = ri(30, 70), be = ri(30, Math.min(90, 155 - al));
    const ga = 180 - al - be;
    const vnejsiC = al + be; // vnější úhel u C = 180 - γ = α + β
    const maxIn = Math.max(al, be, ga);
    return {
      no: 7, points: 3, title: 'Úhly v trojúhelníku',
      svg: svgTriangle('obecny', { v: ['A', 'B', 'C'] }),
      intro: `V trojúhelníku ABC platí α = ${al}° (u vrcholu A) a β = ${be}° (u vrcholu B).`,
      parts: [
        { key: '7.1', points: 1, prompt: `Vypočítejte velikost vnitřního úhlu γ (u vrcholu C).`, ans: String(ga),
          sol: [`Součet vnitřních úhlů je v každém trojúhelníku 180°.`,`Třetí úhel dopočítáš odečtením obou známých: γ = 180 − ${al} − ${be}.`,`γ = ${180 - al} − ${be} = ${ga}°.`] },
        { key: '7.2', points: 1, prompt: `Vypočítejte velikost vnějšího úhlu u vrcholu C.`, ans: String(vnejsiC),
          sol: [`Vnější úhel a vnitřní úhel u téhož vrcholu tvoří dohromady 180°.`,`Z toho plyne užitečné pravidlo: vnější úhel se rovná součtu obou zbývajících vnitřních úhlů.`,`Vnější úhel = ${al} + ${be} = ${vnejsiC}° (kontrola: 180 − ${ga} = ${vnejsiC}°).`] },
        { key: '7.3', points: 1, prompt: `Který vnitřní úhel trojúhelníku je největší? Napište jeho velikost ve stupních.`, ans: String(maxIn),
          sol: [`Nejdřív musíš znát všechny tři úhly — γ jsi dopočítal v předchozí podúloze.`,`Úhly jsou α = ${al}°, β = ${be}°, γ = ${ga}°.`,`Největší z nich je ${maxIn}°.`] }
      ]
    };
  }

  function gen12b() {
    // 2 body — MC A-E, objem kvádru (bazén tvaru kvádru)
    const delka = ri(2, 4) * 5, sirka = ri(2, 3) * 4, hloubka = ri(1, 2) + 1;
    const V = delka * sirka * hloubka;
    const opts = [V - sirka * hloubka, V - delka, V, V + delka, 'jiný objem'];
    const shuffled = shuffleOpts(opts, V);
    return {
      no: 12, points: 2, title: 'Bazén', kind: 'mc',
      svg: svgCuboid(delka + ' m', sirka + ' m', hloubka + ' m'),
      prompt: `Bazén má tvar kvádru: délka ${delka} m, šířka ${sirka} m a všude stejná hloubka ${hloubka} m. Jaký je jeho objem?`,
      options: shuffled.labels, ans: shuffled.correctLetter,
      sol: [`Objem kvádru je součin všech tří rozměrů: V = délka · šířka · hloubka.`,`Vynásob první dva rozměry: ${delka} · ${sirka} = ${delka * sirka} m².`,`Objem = ${delka * sirka} · ${hloubka} = ${V} m³ → odpověď ${shuffled.correctLetter}.`]
    };
  }

  function gen13b() {
    // 2 body — MC A-E, procenta (zdražení a následná sleva)
    /* 🔴 Konečná cena se dřív ZAOKROUHLOVALA: 500 Kč, +25 %, −10 % je
       562,50 Kč, ale nabízelo se jen 563 a „jiná cena" — kdo počítal
       správně, zvolil „jinou cenu" a dostal špatně (1 generování ze 12).
       Teď se losuje znovu, dokud cena nevyjde celá. Našel to nezávislý
       dopočet rovností v postupech (prijimacky-dopocet.test.cjs). */
    let cena, p1, p2, po1, fin;
    do {
      cena = ri(4, 9) * 100; p1 = [10, 20, 25][ri(0, 2)]; p2 = [10, 20][ri(0, 1)];
      po1 = cena * (100 + p1) / 100; fin = po1 * (100 - p2) / 100;
    } while (!Number.isInteger(po1) || !Number.isInteger(fin));
    const opts = [fin - 20, fin - 10, fin, fin + 10, 'jiná cena'];
    const shuffled = shuffleOpts(opts, fin);
    return {
      no: 13, points: 2, title: 'Cena zboží', kind: 'mc',
      prompt: `Zboží stálo ${cena} Kč. Nejdřív zdražilo o ${p1} %, potom z nové ceny zlevnilo o ${p2} %. Kolik stojí nyní?`,
      options: shuffled.labels, ans: shuffled.correctLetter,
      sol: `Po zdražení o ${p1} %: ${cena} × ${cz(1 + p1 / 100)} = ${po1} Kč. Po zlevnění o ${p2} % z této ceny: ${po1} × ${cz(1 - p2 / 100)} = ${fin} Kč → odpověď ${shuffled.correctLetter}. (Pozor: procenta se počítají vždy z aktuální ceny, ne z původní.)`
    };
  }

  function shuffleOpts(rawOpts, correctVal) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const arr = rawOpts.map(v => typeof v === 'string' ? v : String(v));
    // shuffle
    for (let i = arr.length - 1; i > 0; i--) { const j = ri(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    const correctStr = String(correctVal);
    const correctIdx = arr.indexOf(correctStr);
    const labels = arr.map((v, i) => `${letters[i]}) ${typeof correctVal === 'number' ? v : v}`);
    return { labels, correctLetter: letters[correctIdx] };
  }

  function gen2b() {
    // 3 body — zlomkový výraz + rozdíl druhých mocnin přes vzorec
    const a = ri(2, 6), b = ri(2, 6), c = ri(3, 9);
    const num = a * (b + c), den = b * c;          // a·(1/b + 1/c) = a(b+c)/(bc)
    const g = gcd(num, den), n1 = num / g, d1 = den / g;
    const ans1 = d1 === 1 ? String(n1) : `${n1}/${d1}`;
    const d = ri(3, 9), e = ri(2, 8);
    const ans2 = 2 * d * e;                          // (d+e)² − (d²+e²) = 2de
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `Vypočítejte a výsledek zapište zlomkem v základním tvaru: ${a} · (1/${b} + 1/${c}) =`,
          ans: ans1,
          sol: [
            `Zlomky se dají sečíst, teprve když mají stejného jmenovatele — nejdřív tedy uprav závorku.`,
            `Společný jmenovatel je ${b} · ${c} = ${b * c}, takže 1/${b} + 1/${c} = ${c}/${b * c} + ${b}/${b * c} = ${b + c}/${b * c}.`,
            `Vynásob číslem ${a}: ${a} · ${b + c}/${b * c} = ${num}/${den}.`,
            g === 1 ? `Zlomek ${num}/${den} už je v základním tvaru: ${ans1}.`
              : `Krať největším společným dělitelem, tedy ${g}: ${ans1}.`
          ] },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `Vypočítejte: (${d} + ${e})² − (${d}² + ${e}²) =`,
          ans: String(ans2),
          sol: [
            `(${d} + ${e})² NENÍ ${d}² + ${e}² — druhá mocnina součtu se roznásobuje vzorcem (a + b)² = a² + 2ab + b². Právě na tomhle je úloha postavená.`,
            `Roznásob: (${d} + ${e})² = ${d * d} + 2 · ${d} · ${e} + ${e * e} = ${(d + e) * (d + e)}.`,
            `Druhá závorka je ${d}² + ${e}² = ${d * d} + ${e * e} = ${d * d + e * e}.`,
            `Odečti je: ${(d + e) * (d + e)} − ${d * d + e * e} = ${ans2}. Zbyde přesně prostřední člen 2 · ${d} · ${e}.`
          ] }
      ]
    };
  }

  function gen3b() {
    // 4 body — vzorce (x−a)², rozdíl čtverců, doplnění na (x+k)²
    const a = ri(3, 8), p = ri(2, 6), k = ri(2, 7);
    return {
      no: 3, points: 4, title: 'Algebraické výrazy',
      parts: [
        { key: '3.1', points: 1,
          prompt: `Ve výrazu (x − ${a})² = x² − ?·x + ${a}² napište číslo místo otazníku (koeficient u x).`,
          ans: String(2 * a),
          sol: [
            `Použij vzorec (x − a)² = x² − 2ax + a²: prostřední člen je vždy dvojnásobek součinu obou členů v závorce, a právě ten se při umocňování nejčastěji zapomene.`,
            `Tady je a = ${a}, takže 2a = 2 · ${a} = ${2 * a}.`,
            `(x − ${a})² = x² − ${2 * a}x + ${a * a}; místo otazníku patří ${2 * a}.`
          ] },
        { key: '3.2', points: 1, showExplain: true,
          prompt: `Upravte na co nejjednodušší tvar a napište koeficient u x: (x + ${p})² − (x − ${p})²`,
          ans: String(4 * p),
          sol: [
            `Umocni obě závorky zvlášť podle vzorců (a ± b)² = a² ± 2ab + b² a teprve pak je odečti — minus platí pro CELOU druhou závorku, tedy pro všechny tři její členy.`,
            `(x + ${p})² = x² + ${2 * p}x + ${p * p} a (x − ${p})² = x² − ${2 * p}x + ${p * p}.`,
            `Rozdíl: x² + ${2 * p}x + ${p * p} − x² + ${2 * p}x − ${p * p} — členy x² i čísla se vyruší.`,
            `Zbude ${2 * p}x + ${2 * p}x, koeficient u x je ${2 * p} + ${2 * p} = ${4 * p}.`
          ] },
        { key: '3.3', points: 2, showExplain: true,
          prompt: `Rozložte na součin pomocí vzorce a napište číslo místo otazníku: x² + ${2 * k}x + ${k * k} = (x + ?)²`,
          ans: String(k),
          sol: [
            `Trojčlen tvaru a² + 2ab + b² je rozepsaný čtverec (a + b)². Z prostředního členu zjistíš b a poslední člen ti ho potvrdí.`,
            `2 · x · b = ${2 * k}x, takže b = ${2 * k} : 2 = ${k}.`,
            `Kontrola: b² = ${k} · ${k} = ${k * k} sedí, takže x² + ${2 * k}x + ${k * k} = (x + ${k})².`
          ] }
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
      no: 5, points: 4, title: 'Zahrada',
      intro: `Obdélníková zahrada má rozměry ${L} m × ${W} m. Je na ní obdélníkový záhon a cesta.`,
      parts: [
        { key: '5.1', points: 2,
          prompt: `Záhon má obsah rovný čtvrtině rozlohy zahrady a jeho délka je ${zL} m. Určete šířku záhonu (v m).`,
          ans: String(zW),
          sol: `Rozloha zahrady = ${L} · ${W} = ${celk} m². Obsah záhonu = čtvrtina: ${celk} : 4 = ${zahon} m². Šířka = obsah : délka = ${zahon} : ${zL} = ${zW} m.` },
        { key: '5.2', points: 2,
          prompt: `Cesta zabírá ${pCesta} % rozlohy zahrady. Vypočítejte v m² volnou část zahrady (bez záhonu a cesty). Použijte obsah záhonu = ${zahon} m².`,
          ans: String(volna),
          sol: [`Nejdřív spočítej plochu cesty, teprve pak odečítej.`,
            `Cesta je ${pCesta} % z ${celk} m²: ${celk} · ${pCesta} : 100 = ${cesta} m².`,
            `Volná část = celková rozloha − záhon − cesta.`,
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
      no: 6, points: 2, title: 'Akvárium',
      svg: svgCuboid(a + ' cm', b + ' cm', c + ' cm'),
      intro: `Akvárium má tvar kvádru s rozměry dna ${a} cm × ${b} cm a výškou ${c} cm.`,
      parts: [
        { key: '6.1', points: 1,
          prompt: `Kolik litrů vody se do akvária vejde, když ho naplníme až po okraj? (1 l = 1000 cm³)`,
          ans: String(litryCelk),
          sol: `Objem kvádru = ${a} · ${b} · ${c} = ${objemCm} cm³. Převeď na litry: ${objemCm} : 1000 = ${litryCelk} l.` },
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
      no: 8, points: 4, title: 'Plot kolem pozemku',
      intro: `Obdélníkový pozemek má rozměry ${a} m × ${b} m. Po celém obvodu jsou ve stejných rozestupech ${dCm} cm sloupky plotu. Celkem je jich ${pocet}.`,
      parts: [
        { key: '8.1', points: 2, prompt: `Vypočítejte v metrech obvod pozemku.`, ans: String(obvod),
          sol: [`Obvod obdélníku je součet všech čtyř stran; protější jsou stejné, takže se sečtou dvě sousední a zdvojnásobí.`,`Součet sousedních stran: ${a} + ${b} = ${a + b} m.`,`Obvod = 2 · ${a + b} = ${obvod} m.`] },
        { key: '8.2', points: 1, prompt: `O kolik víc sloupků připadá na delší stranu (${b} m) než na kratší stranu (${a} m)?`, ans: String(rozdil),
          sol: `Na stranu ${b} m připadá ${naB} sloupků (${b * 100} cm : ${dCm} cm), na stranu ${a} m ${naA} sloupků (${a * 100} cm : ${dCm} cm). Rozdíl: ${naB} − ${naA} = ${rozdil}.` },
        { key: '8.3', points: 1, prompt: `Sloupky se natírají po skupinkách po ${skup}. Kolik skupinek je celkem (${pocet} sloupků)?`, ans: String(pocet / skup),
          sol: [`Skupinky jsou po ${skup} kusech, takže celkový počet ${pocet} vyděl touto velikostí.`,`Počet skupinek = ${pocet} : ${skup} = ${pocet / skup}.`] }
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
          sol: `Úhlopříčka obdélníku je přeponou pravoúhlého trojúhelníku s odvěsnami ${a} m a ${b} m. Podle Pythagorovy věty: u² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}. Odmocni: u = √${a * a + b * b} = ${c} m.` }
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
          sol: `Měřítko 1 : ${k} znamená, že 1 cm na mapě odpovídá ${k} cm ve skutečnosti. Skutečná délka = ${dCm} · ${k} = ${dCm * k} cm. Převeď na metry (: 100): ${dCm * k} : 100 = ${realM} m.` }
      ]
    };
  }

  function gen11b() {
    // 3 body — pravda/nepravda o krychli a kvádru
    const a = ri(2, 6), hrany = 12 * a, povrch = 6 * a * a;
    const tvrz1 = ri(0, 1) ? hrany : hrany + ri(2, 6);
    const st1 = { text: `Součet délek všech hran krychle s hranou ${a} cm je ${tvrz1} cm.`, ans: tvrz1 === hrany ? 'A' : 'N',
      sol: [`Krychle má 12 hran a všechny jsou stejně dlouhé.`,`Součet hran = 12 · ${a} = ${hrany} cm.`,`Tvrzení uvádí ${tvrz1} cm — ${tvrz1 === hrany ? 'stejné číslo, je tedy PRAVDIVÉ (A).' : 'jiné číslo, je tedy NEPRAVDIVÉ (N).'}`] };
    const tvrz2 = ri(0, 1) ? povrch : povrch + 6 * ri(1, 4);
    const st2 = { text: `Povrch krychle s hranou ${a} cm je ${tvrz2} cm².`, ans: tvrz2 === povrch ? 'A' : 'N',
      sol: [`Krychle má 6 shodných čtvercových stěn, takže povrch je šestinásobek obsahu jedné stěny.`,`Obsah jedné stěny: ${a}² = ${a * a} cm².`,`Povrch = 6 · ${a * a} = ${povrch} cm². Tvrzení uvádí ${tvrz2} cm² — ${tvrz2 === povrch ? 'PRAVDIVÉ (A).' : 'NEPRAVDIVÉ (N).'}`] };
    const objemK = a * a * a, bb = a + 1, objemKv = a * a * bb;
    const st3 = ri(0, 1)
      ? { text: `Kvádr s hranami ${a} cm, ${a} cm, ${bb} cm má větší objem než krychle s hranou ${a} cm.`, ans: 'A',
          sol: `Krychle: ${a}³ = ${objemK} cm³. Kvádr ${a}×${a}×${bb}: ${objemKv} cm³. Protože ${bb} > ${a}, kvádr má větší objem (${objemKv} > ${objemK}) — PRAVDA (A).` }
      : { text: `Krychle s hranou ${a} cm má větší objem než kvádr s hranami ${a} cm, ${a} cm, ${bb} cm.`, ans: 'N',
          sol: `Krychle: ${objemK} cm³. Kvádr ${a}×${a}×${bb}: ${objemKv} cm³. Protože ${a} < ${bb}, krychle má menší objem (${objemK} < ${objemKv}) — NEPRAVDA (N).` };
    return {
      no: 11, points: 3, title: 'Krychle a kvádr', kind: 'tfgrid',
      intro: `Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [st1, st2, st3]
    };
  }

  function gen14b() {
    // 2 body — MC A-E, doplnění chybějící hodnoty z průměru
    const known = []; let s = 0;
    for (let i = 0; i < 4; i++) { const v = ri(2, 9); known.push(v); s += v; }
    let missing = ri(3, 9);
    while ((s + missing) % 5 !== 0) missing++;
    const soucet = s + missing, prumer = soucet / 5;
    const opts = [missing - 2, missing - 1, missing, missing + 1, missing + 2];
    const shuffled = shuffleOpts(opts, missing);
    return {
      no: 14, points: 2, title: 'Průměr měření', kind: 'mc',
      prompt: `Pět měření mělo aritmetický průměr ${prumer}. Čtyři z naměřených hodnot byly ${known.join(', ')}. Jaká byla pátá hodnota?`,
      options: shuffled.labels, ans: shuffled.correctLetter,
      sol: `Součet všech pěti hodnot = průměr × počet = ${prumer} · 5 = ${soucet}. Součet čtyř známých: ${known.join(' + ')} = ${s}. Pátá hodnota = ${soucet} − ${s} = ${missing} → odpověď ${shuffled.correctLetter}.`
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
          sol: `Obsah celého obrazu i s rámem = ${outL(L)} · ${outL(W)} = ${outL(L) * outL(W)} cm². Obsah samotného obrazu = ${L} · ${W} = ${L * W} cm². Rám = ${outL(L) * outL(W)} − ${L * W} = ${frameArea} cm².` },
        { key: '16.3', points: 1, prompt: `Jiný obraz má kratší stranu ${W3} cm. Jaká je délka celého obrazu i s rámem podél této strany (v cm)?`, ans: String(outL(W3)),
          sol: [`Postupuj stejně jako u předchozí strany — rám přidá ${RAM} cm na obou koncích.`,`Vnější rozměr = ${W3} + ${2 * RAM} = ${outL(W3)} cm.`] }
      ]
    };
  }

  /* ═══ TŘETÍ VARIANTY vybraných pozic (podle reálných CERMAT předloh) ═══ */

  function gen1c() {
    // 1 bod — mocnina a násobení (pořadí operací), výsledek kladný
    const a = ri(5, 9), b = ri(2, 4), c = ri(2, 4), ans = a * a - b * c;
    return {
      no: 1, points: 1, title: 'Číselný výraz',
      parts: [{ key: '', points: 1,
        prompt: `Vypočítejte: ${a}² − ${b} · ${c} =`,
        ans: String(ans),
        sol: [
          `Mocnina i násobení mají přednost před odčítáním — spočítej je dřív, ne zleva doprava.`,
          `${a}² = ${a} · ${a} = ${a * a} a ${b} · ${c} = ${b * c}.`,
          `Nakonec odečti: ${a * a} − ${b * c} = ${ans}.`
        ] }]
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
      no: 1, points: 1, title: 'Číselný výraz',
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
      no: 1, points: 1, title: 'Číselný výraz',
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
      no: 1, points: 1, title: 'Číselný výraz',
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
      no: 1, points: 1, title: 'Číselný výraz',
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
    // Vzor: M9A/2023 ú. 1 — kolik minut zbývá do konce. Časy se drží
    // v minutách od půlnoci a na text se převádějí až nakonec, aby
    // nevznikl čas typu 19:65.
    const fmt = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
    const zacatek = ri(14, 19) * 60 + ri(0, 11) * 5;
    const delka = ri(16, 26) * 5;        // 80–130 minut, vždy delší než zbytek
    const zbyva = ri(3, 12) * 5;         // 15–60 minut
    const konec = zacatek + delka, ted = konec - zbyva;
    const h = Math.floor(delka / 60), m = delka % 60;
    return {
      no: 1, points: 1, title: 'Číselný výraz',
      parts: [{ key: '', points: 1,
        prompt: `Film začal v ${fmt(zacatek)} a trvá ${delka} minut. Kolik minut zbývá do jeho konce v ${fmt(ted)}?`,
        ans: String(zbyva),
        sol: [
          `Přímo se to spočítat nedá — nejdřív zjisti, KDY film končí: k času začátku přičti jeho délku.`,
          `${delka} minut = ${h} h ${m} min, takže konec je v ${fmt(konec)}.`,
          `Od konce odečti současný čas: z ${fmt(ted)} do ${fmt(konec)} zbývá ${zbyva} minut.`
        ] }]
    };
  }

  function gen4c() {
    // 4 body — rovnice: lineární + rovnice se zlomkem (dělením)
    const x1 = ri(2, 9), a = ri(2, 6), b = ri(1, 9), c = a * x1 - b;
    const d = ri(2, 5), x2 = ri(2, 5) * d, e = ri(1, 6), f = x2 / d + e;
    return {
      no: 4, points: 4, title: 'Rovnice',
      parts: [
        { key: '4.1', points: 2, showExplain: true,
          // `zn`: pravá strana bývá záporná a dřív se psala „= -5" se spojovníkem
          prompt: `Vyřešte rovnici a napište kořen x: ${a}x − ${b} = ${zn(c)}`,
          ans: String(x1),
          sol: [
            `Neznámou osamostatni postupně: nejdřív se zbav čísla, které se k ní přičítá nebo odečítá, a teprve pak koeficientu, kterým se násobí.`,
            `Přičti ${b} k oběma stranám: ${a}x = ${zn(c)} + ${b} = ${c + b}.`,
            `Vyděl číslem ${a}: x = ${c + b} : ${a} = ${x1}.`
          ] },
        { key: '4.2', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen x: x : ${d} + ${e} = ${f}`,
          ans: String(x2),
          sol: [
            `Postupuj v opačném pořadí, než se s x počítalo: nejdřív odečti přičtené číslo, pak zruš dělení násobením.`,
            `Odečti ${e} od obou stran: x : ${d} = ${f} − ${e} = ${f - e}.`,
            `Vynásob číslem ${d}: x = ${f - e} · ${d} = ${x2}.`
          ] }
      ]
    };
  }

  /* ═══ POZICE 4 — rovnice podle ostrých zadání ═══════════════════════
     V M9A/2025 je to úloha 4, v ostatních letech úloha 5. Sken 2023–2025:
     ZLOMKY se závorkou nebo dvojčlenem v čitateli jsou v šesti ze sedmi
     zadání, DESETINNÁ ČÍSLA se závorkou ve třech a SOUSTAVA dvou rovnic
     ve třech z pěti zadání roku 2025. Banka neměla ani zlomky, ani
     soustavu. Kořen se vždy volí PRVNÍ a zadání se z něj dopočítá. */
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
      no: 4, points: 4, title: 'Rovnice se zlomky',
      parts: [
        { key: '4.1', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen x: (x + ${a})/${p} − (x − ${b})/${q} = ${zn(c)}`,
          ans: String(x),
          sol: [
            `Zlomků se zbavíš, když CELOU rovnici vynásobíš společným násobkem jmenovatelů, tady ${L}. Pozor na minus před zlomkem: platí pro celý čitatel, ne jen pro jeho první člen.`,
            `Po vynásobení číslem ${L}: ${krat(A, `(x + ${a})`)} − ${krat(B, `(x − ${b})`)} = ${zn(L * c)}.`,
            `Roznásob — minus před druhou závorkou otočí znaménko u obou členů: ${clen(A, 'x', true)} + ${A * a}${clen(-B, 'x')} + ${B * b} = ${zn(L * c)}.`,
            `Členy s x vlevo, čísla vpravo: ${clen(k1, 'x', true)} = ${zn(L * c)} − ${A * a} − ${B * b} = ${zn(P1)}.`,
            `x = ${zn(P1)} : ${zav(k1)} = ${zn(x)}.`
          ] },
        { key: '4.2', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen y: ${n0} − (${m} − ${sy})/${r} = ${zn(w)} + (${f}y − ${g})/${t}`,
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
      no: 4, points: 4, title: 'Rovnice a soustava',
      parts: [
        { key: '4.1', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen x: ${cz(a10 / 10)}x + ${b}·(x + ${cz(c10 / 10)}) = ${cz(d10 / 10)}·(x ${eSign} ${cz(Math.abs(E10) / 10)})`,
          ans: String(x),
          sol: [
            `Nejdřív roznásob závorky — číslo před závorkou násobí KAŽDÝ člen uvnitř. Desetinná čísla nevadí; kdo chce, vynásobí celou rovnici stem a počítá s celými čísly.`,
            `${cz(a10 / 10)}x + ${b}x + ${h(bc100)} = ${cz(d10 / 10)}x${pm(de100 / 100)}.`,
            `Čísla vpravo: ${hz(de100)} − ${h(bc100)} = ${hz(P100)}. Koeficient u x vlevo: ${cz(a10 / 10)} + ${b} − ${cz(d10 / 10)} = ${zn(k10 / 10)}.`,
            `${zn(k10 / 10)}x = ${hz(P100)}, tedy x = ${hz(P100)} : ${zav(k10 / 10)} = ${zn(x)}.`
          ] },
        { key: '4.2', points: 1, showExplain: true,
          prompt: `Řešte soustavu rovnic ${rovnice}. Napište hodnotu x.`,
          ans: String(x0),
          sol: krokyX },
        { key: '4.3', points: 1, showExplain: true,
          prompt: `Řešte soustavu rovnic ${rovnice}. Napište hodnotu y.`,
          ans: String(y0),
          sol: krokyX.concat([dosazeni]) }
      ]
    };
  }

  function gen12c() {
    // 2 body — MC, počet krychlových kostek v kvádrové krabici
    const k = [2, 5][ri(0, 1)], a = ri(2, 4) * k, b = ri(2, 4) * k, cc = ri(2, 3) * k;
    const pocet = (a / k) * (b / k) * (cc / k);
    const opts = [pocet - 2, pocet - 1, pocet, pocet + 2, 'jiný počet'];
    const sh = shuffleOpts(opts, pocet);
    return {
      no: 12, points: 2, title: 'Kostky v krabici', kind: 'mc',
      svg: svgCuboid(a + ' cm', b + ' cm', cc + ' cm'),
      prompt: `Krabice tvaru kvádru má rozměry ${a} cm × ${b} cm × ${cc} cm. Kolik krychlových kostek o hraně ${k} cm se do ní přesně vejde?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Kostky se skládají do řad, vrstev a sloupců — spočítej tedy, kolik se jich vejde podél KAŽDÉ hrany.`,`Podél hran: ${a} : ${k} = ${a / k}, ${b} : ${k} = ${b / k} a ${cc} : ${k} = ${cc / k} kostek.`,`Celkem = ${a / k} · ${b / k} · ${cc / k} = ${pocet} kostek → odpověď ${sh.correctLetter}.`]
    };
  }

  function gen13c() {
    // 2 body — MC, o kolik procent se cena zvýšila
    // POZOR: `stara * (1 + p/100)` je násobení desetinným číslem → vzniklo
    // „770.0000000000001 Kč" přímo v zadání ostrého testu. Počítáme v celých:
    // `stara` je násobek 100, takže přírůstek vyjde vždy celý.
    const stara = ri(1, 9) * 100, p = [10, 20, 25, 50][ri(0, 3)];
    const prirustek = stara * p / 100, nova = stara + prirustek;
    const opts = [p - 5, p, p + 5, p + 10, 'jiná hodnota'];
    const sh = shuffleOpts(opts, p);
    return {
      no: 13, points: 2, title: 'Zdražení', kind: 'mc',
      prompt: `Zboží zdražilo z ${stara} Kč na ${nova} Kč. O kolik procent se cena zvýšila?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: `Zdražení v korunách: ${nova} − ${stara} = ${prirustek} Kč. Vztaženo k PŮVODNÍ ceně: ${prirustek} : ${stara} = ${p}/100 = ${p} % → odpověď ${sh.correctLetter}.`
    };
  }

  function gen14c() {
    // 2 body — MC, medián pěti čísel
    const arr = []; while (arr.length < 5) { const v = ri(1, 20); if (!arr.includes(v)) arr.push(v); }
    const sorted = [...arr].sort((x, y) => x - y), med = sorted[2];
    const sh = shuffleOpts(sorted.slice(), med);
    return {
      no: 14, points: 2, title: 'Medián', kind: 'mc',
      prompt: `Určete medián (prostřední hodnotu) těchto čísel: ${arr.join(', ')}.`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Medián je prostřední hodnota — ale až po seřazení. Bez seřazení vyjde nesmysl.`,`Seřazeno od nejmenšího: ${sorted.join(', ')}.`,`Hodnot je pět, prostřední je tedy třetí: medián = ${med} → odpověď ${sh.correctLetter}.`]
    };
  }

  function gen2c() {
    // 3 body — dělení zlomků (stejný jmenovatel) + rozdíl druhých mocnin vzorcem
    /* Ani tady se čitatel nesmí rovnat jmenovateli: „5/5 : 3/5" je
       dělenec 1 a „a/5 : 5/5" dělení jedničkou — obojí z úlohy dělá
       nesmysl, přestože společný jmenovatel je jejím smyslem. */
    /* A dělenec se nesmí rovnat děliteli: a a c se losovaly nezávisle,
       takže v 17 % případů vyšlo „6/4 : 6/4 = 1" — zlomek dělený sám
       sebou, stejná prázdnota jako dělení jedničkou. Cyklus místo
       jednorázové opravy: ta se může trefit do téže hodnoty znovu. */
    const b = ri(3, 9);
    let a = ri(2, 8), c = ri(2, 8);
    if (a === b) a = a % 8 + 2;
    while (c === b || c === a) c = ri(2, 8);
    const g = gcd(a, c), na = a / g, nc = c / g;
    const ans1 = nc === 1 ? String(na) : `${na}/${nc}`;
    const d = ri(5, 12), e = ri(1, d - 1), ans2 = d * d - e * e;
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `Vypočítejte a zapište zlomkem v základním tvaru: ${a}/${b} : ${c}/${b} =`,
          ans: ans1,
          sol: [
            `Dělit zlomkem znamená násobit jeho převrácenou hodnotou — druhý zlomek se tedy obrátí vzhůru nohama.`,
            `${a}/${b} : ${c}/${b} = ${a}/${b} · ${b}/${c}. Jmenovatel ${b} se v čitateli i jmenovateli vykrátí, zbyde ${a}/${c}.`,
            g === 1 ? `Zlomek ${a}/${c} už je v základním tvaru: ${ans1}.`
              : `Krať největším společným dělitelem, tedy ${g}: ${ans1}.`
          ] },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `Vypočítejte pomocí vzorce: (${d} + ${e}) · (${d} − ${e}) =`,
          ans: String(ans2),
          sol: [
            `Roznásobovat závorku po členech není potřeba — je to vzorec pro rozdíl druhých mocnin: (a + b) · (a − b) = a² − b².`,
            `Dosaď a = ${d} a b = ${e}: (${d} + ${e}) · (${d} − ${e}) = ${d}² − ${e}².`,
            `Umocni a odečti: ${d * d} − ${e * e} = ${ans2}.`
          ] }
      ]
    };
  }

  /* ── POZICE 2 — další varianty ───────────────────────────────────
     Sken úlohy 2 ve všech 13 ostrých zadáních ukázal, že je to
     v posledních letech téměř výhradně ZLOMKOVÝ VÝRAZ se zápisem
     v základním tvaru, a že nejtěžší podúlohou bývá SLOŽENÝ ZLOMEK
     (zlomek ve zlomku) — v roce 2026 je v OBOU testech (M9A ú. 2.2,
     M9B ú. 2.3) a právě u něj se vyžaduje celý postup řešení.
     V bance nebyl ani jednou. Naše tři původní varianty měly navíc
     druhou podúlohu na algebraické vzorce, což je látka pozice 3.

     Pozn. k zápisu: složený zlomek se v ostrém testu sází nad sebe.
     Zadání tady jde do prostého textového pole (`PZ.esc`), takže se
     píše dělením se závorkami — matematicky totéž, vizuálně ne. ──── */

  // zlomek v základním tvaru jako text; celé číslo se vypíše bez jmenovatele
  function zlText(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(Math.abs(n), d) || 1;
    const nn = n / g, dd = d / g;
    return dd === 1 ? String(nn) : `${nn}/${dd}`;
  }

  function gen2d() {
    // 3 body — 2.1 zlomkový výraz se závorkou, 2.2 SLOŽENÝ ZLOMEK s postupem.
    // Vzor: M9B/2026 ú. 2.3 „(1 − 1/4) : (2 · 5/8 − 2)".
    const a = ri(2, 6), c = ri(3, 8), e = ri(3, 8);
    const d = ri(1, e - 1);
    /* Závorka nesmí vyjít 0, tedy b/c se nesmí rovnat d/e. Cyklus projde
       všechny přípustné čitatele 1…c−1; kolidovat může nejvýš jeden, takže
       vždycky skončí — na rozdíl od jednorázové opravy, která se může
       trefit do téže hodnoty znovu. */
    let b = ri(1, c - 1);
    for (let i = 0; i < c && b * e === d * c; i++) b = b % (c - 1) + 1;
    const cit1 = a * (b * e - d * c), jm1 = c * e;
    const ans1 = zlText(cit1, jm1);

    const n = ri(2, 6);                                 // čitatel: 1 − 1/n = (n−1)/n
    const m = ri(3, 9), k = ri(2, m - 1);               // jmenovatel: m/k − 1 = (m−k)/k
    const cit2 = (n - 1) * k, jm2 = n * (m - k);
    const ans2 = zlText(cit2, jm2);
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `Vypočítejte a výsledek zapište zlomkem v základním tvaru: ${a} · (${b}/${c} − ${d}/${e}) =`,
          ans: ans1,
          sol: [
            `Zlomky se dají odečíst, teprve když mají stejného jmenovatele — nejdřív tedy uprav závorku.`,
            `Společný jmenovatel je ${c} · ${e} = ${c * e}: ${b}/${c} = ${b * e}/${c * e} a ${d}/${e} = ${d * c}/${c * e}, takže závorka je ${zlS(b * e - d * c, c * e)}.`,
            `Vynásob číslem ${a}: ${a} · ${zlZ(b * e - d * c, c * e)} = ${zlS(cit1, jm1)}.`,
            gcd(Math.abs(cit1), jm1) === 1 ? `Zlomek už je v základním tvaru: ${ans1.replace('-', '−')}.`
              : `Zkrať na základní tvar: ${ans1.replace('-', '−')}.`
          ] },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `Vypočítejte a výsledek zapište zlomkem v základním tvaru: (1 − 1/${n}) : (${m}/${k} − 1) =`,
          ans: ans2,
          sol: [
            `Takový zápis je jen DĚLENÍ dvou závorek. Spočítej proto každou zvlášť a teprve pak je vyděl — uvnitř závorek se nic krátit nedá.`,
            `Celé číslo se na zlomek převede přes jmenovatele: 1 = ${n}/${n}, takže první závorka je ${n}/${n} − 1/${n} = ${n - 1}/${n}.`,
            `Stejně druhá: 1 = ${k}/${k}, takže ${m}/${k} − ${k}/${k} = ${m - k}/${k}.`,
            `Dělit zlomkem znamená násobit jeho převrácenou hodnotou: ${n - 1}/${n} · ${k}/${m - k} = ${cit2}/${jm2}.`,
            `Zkrať na základní tvar: ${ans2}.`
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

    const a = ri(2, 7), c = ri(2, 6), d = ri(2, 6);
    /* b se nesmí rovnat a — „1 : 5/5" je dělení jedničkou a nezkouší nic.
       Stejná past jako v gen2, kde se překrývaly rozsahy b a c. */
    let b = ri(3, 9);
    if (b === a) b = a + 1;
    const cit2 = b * c * d - a, jm2 = a * c * d;        // b/a − 1/(c·d)
    const ans2 = zlText(cit2, jm2);
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
          prompt: `Vypočítejte a výsledek zapište zlomkem v základním tvaru: 1 : ${a}/${b} − 1/${c} : ${d} =`,
          ans: ans2,
          sol: [
            `Dělení má přednost před odčítáním — spočítej proto oba podíly zvlášť a teprve pak je od sebe odečti.`,
            `Dělit zlomkem = násobit převrácenou hodnotou: 1 : ${a}/${b} = 1 · ${b}/${a} = ${b}/${a}.`,
            `Dělit celým číslem = násobit jeho převrácenou hodnotou, tedy zvětšit jmenovatele: 1/${c} : ${d} = 1/${c * d}.`,
            `Společný jmenovatel je ${a} · ${c * d} = ${jm2}: ${b}/${a} = ${b * c * d}/${jm2} a 1/${c * d} = ${a}/${jm2}, takže rozdíl je ${cit2}/${jm2}.`,
            `Zkrať na základní tvar: ${ans2}.`
          ] }
      ]
    };
  }

  function gen2f() {
    // 3 body — 2.1 celé číslo dělené zlomkem, 2.2 součet zlomků dělený
    // celým číslem s postupem. Vzor: M9B/2026 ú. 2.1 „3 · (2/3 − 7/9) + 2/3"
    // a M9A/2025 ú. 2.1 — obojí stojí na „uprav a zapiš v základním tvaru".
    const a = ri(2, 9), b = ri(2, 7);
    /* c se nesmí rovnat b — „2 : 7/7" je zase jen dělení jedničkou.
       b je nejvýš 7, takže b + 1 zůstává v původním rozsahu 3–9. */
    let c = ri(3, 9);
    if (c === b) c = b + 1;
    const ans1 = zlText(a * c, b);                      // a : b/c = a·c/b

    /* Čitatel se nesmí rovnat jmenovateli — „(4/4 + 2/5) : 5" sice není
       matematicky špatně, ale v ostrém zadání by nikdo zlomek 4/4
       nenapsal a žák to čte jako překlep. Posun o jedna v kruhu 1–5
       kolizi spolehlivě odstraní, protože q a s se už nemění. */
    const q = ri(2, 8), s = ri(2, 8), t = ri(2, 6);
    let p = ri(1, 5), r = ri(1, 5);
    if (p === q) p = p % 5 + 1;
    if (r === s) r = r % 5 + 1;
    const cit2 = p * s + r * q, jm2 = q * s * t;        // (p/q + r/s) : t
    const ans2 = zlText(cit2, jm2);
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `Vypočítejte a výsledek zapište zlomkem v základním tvaru: ${a} : ${b}/${c} =`,
          ans: ans1,
          sol: [
            `Dělit zlomkem znamená násobit jeho převrácenou hodnotou — zlomek se obrátí vzhůru nohama a dělení se změní na násobení.`,
            `${a} : ${b}/${c} = ${a} · ${c}/${b} = ${a * c}/${b}.`,
            `Zkrať na základní tvar: ${ans1}.`
          ] },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `Vypočítejte a výsledek zapište zlomkem v základním tvaru: (${p}/${q} + ${r}/${s}) : ${t} =`,
          ans: ans2,
          sol: [
            `Závorka má přednost — nejdřív sečti zlomky uvnitř a teprve celý výsledek vyděl.`,
            `Společný jmenovatel je ${q} · ${s} = ${q * s}: ${p}/${q} = ${p * s}/${q * s} a ${r}/${s} = ${r * q}/${q * s}, takže závorka je ${cit2}/${q * s}.`,
            `Dělit celým číslem znamená zvětšit jmenovatele ${t}krát: ${cit2}/${q * s} : ${t} = ${cit2}/${jm2}.`,
            `Zkrať na základní tvar: ${ans2}.`
          ] }
      ]
    };
  }

  function gen3c() {
    // 4 body — vzorec (x+a)², sčítání členů, rozklad rozdílu čtverců
    const a = ri(3, 9), p = ri(3, 9), q = ri(2, 8), r = ri(1, Math.min(p, q)), c = ri(3, 10);
    return {
      no: 3, points: 4, title: 'Algebraické výrazy',
      parts: [
        { key: '3.1', points: 1,
          prompt: `Ve výrazu (x + ${a})² = x² + ?·x + ${a}² napište číslo místo otazníku (koeficient u x).`,
          ans: String(2 * a),
          sol: [`Použij vzorec (x + a)² = x² + 2ax + a². Prostřední člen má vždy tvar 2ax a při umocňování se nejčastěji zapomene.`,`Zde je a = ${a}, takže koeficient u x je 2 · ${a} = ${2 * a}.`,`Celý výsledek: (x + ${a})² = x² + ${2 * a}x + ${a * a}.`] },
        { key: '3.2', points: 1, showExplain: true,
          prompt: `Sečtěte členy a napište koeficient u x: ${p}x + ${q}x − ${r}x`,
          ans: String(p + q - r),
          sol: [`Všechny členy obsahují stejnou proměnnou x, takže je lze sečíst — sčítají se jen jejich koeficienty.`,`Sečti koeficienty: ${p} + ${q} − ${r} = ${p + q - r}.`,`Výraz se rovná ${p + q - r}x.`] },
        { key: '3.3', points: 2, showExplain: true,
          prompt: `Rozložte na součin pomocí vzorce a napište číslo místo otazníku: x² − ${c * c} = (x − ?)·(x + ?)`,
          ans: String(c),
          sol: [`Rozdíl druhých mocnin se rozkládá podle vzorce a² − b² = (a − b)(a + b).`,`Číslo ${c * c} je druhá mocnina: ${c}² = ${c * c}, takže b = ${c}.`,`Proto x² − ${c * c} = (x − ${c})(x + ${c}).`] }
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
      no: 7, points: 3, title: 'Úhly v rovnoramenném trojúhelníku',
      intro: `Rovnoramenný trojúhelník má oba úhly při základně stejné, každý ${beta}°.`,
      parts: [
        { key: '7.1', points: 1, prompt: `Vypočítejte velikost úhlu při hlavním vrcholu (proti základně).`, ans: String(alpha),
          sol: [`Trojúhelník je rovnoramenný, takže oba úhly při základně jsou stejné — každý ${beta}°.`,`Součet všech tří je 180°, tedy úhel u vrcholu = 180 − ${beta} − ${beta} = 180 − ${2 * beta}.`,`Úhel u vrcholu = ${alpha}°.`] },
        { key: '7.2', points: 1, prompt: `Vypočítejte velikost vnějšího úhlu u jednoho z úhlů při základně.`, ans: String(vnejsi),
          sol: [`Vnější úhel doplňuje vnitřní úhel u téhož vrcholu do přímého úhlu, tedy do 180°.`,`Vnější úhel = 180 − ${beta} = ${vnejsi}°.`] },
        { key: '7.3', points: 1, prompt: `Jaký je součet obou úhlů při základně?`, ans: String(soucet),
          sol: [`U rovnoramenného trojúhelníku jsou oba úhly při základně shodné, takže stačí jeden zdvojnásobit.`,`Součet = 2 · ${beta} = ${soucet}°.`] }
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
    // 3 body — pravda/nepravda o kvádru (objem, povrch, počet prvků)
    const a = ri(2, 5), b = ri(2, 5), c = ri(2, 5), V = a * b * c, S = 2 * (a * b + b * c + a * c);
    const t1 = ri(0, 1) ? V : V + ri(1, 5);
    const st1 = { text: `Kvádr s hranami ${a} cm, ${b} cm, ${c} cm má objem ${t1} cm³.`, ans: t1 === V ? 'A' : 'N',
      sol: `Objem = a·b·c = ${a}·${b}·${c} = ${V} cm³. Tvrzení uvádí ${t1} cm³ — ${t1 === V ? 'PRAVDA (A).' : 'NEPRAVDA (N).'}` };
    const t2 = ri(0, 1) ? S : S + 2 * ri(1, 4);
    const st2 = { text: `Povrch téhož kvádru je ${t2} cm².`, ans: t2 === S ? 'A' : 'N',
      sol: `Povrch = 2·(ab+bc+ac) = 2·(${a * b}+${b * c}+${a * c}) = ${S} cm². Tvrzení uvádí ${t2} cm² — ${t2 === S ? 'PRAVDA (A).' : 'NEPRAVDA (N).'}` };
    const opts = [['stěn', 6], ['hran', 12], ['vrcholů', 8]][ri(0, 2)];
    const claimed = ri(0, 1) ? opts[1] : opts[1] + ri(1, 3);
    const st3 = { text: `Každý kvádr má ${claimed} ${opts[0]}.`, ans: claimed === opts[1] ? 'A' : 'N',
      sol: `Kvádr má vždy 6 stěn, 12 hran a 8 vrcholů. Počet — ${opts[0]}: ${opts[1]}. Tvrzení uvádí ${claimed} — ${claimed === opts[1] ? 'PRAVDA (A).' : 'NEPRAVDA (N).'}` };
    return {
      no: 11, points: 3, title: 'Tělesa', kind: 'tfgrid',
      intro: `Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [st1, st2, st3]
    };
  }

  function gen6c() {
    // 2 body — nádrže (dělení, čas napouštění; bez π)
    const konev = ri(3, 8), pocet = ri(4, 12), sud = konev * pocet;
    const rate = ri(2, 9), min = ri(3, 12), V = rate * min;
    return {
      no: 6, points: 2, title: 'Nádrže',
      parts: [
        { key: '6.1', points: 1,
          prompt: `Sud pojme ${sud} litrů. Konev má objem ${konev} litrů. Kolik plných konví je potřeba na naplnění sudu?`,
          ans: String(pocet),
          sol: [`Ptáme se, kolikrát se konev vejde do sudu — to je dělení.`,`Počet konví = ${sud} : ${konev} = ${pocet}.`] },
        { key: '6.2', points: 1,
          prompt: `Nádrž o objemu ${V} litrů se napouští rychlostí ${rate} litrů za minutu. Za kolik minut bude plná?`,
          ans: String(min),
          sol: [`Když znáš objem a rychlost napouštění, čas dostaneš dělením.`,`Čas = ${V} : ${rate} = ${min} ${skl(min, 'minuta', 'minuty', 'minut')}.`] }
      ]
    };
  }

  function gen8c() {
    // 4 body — oplocení obdélníkové zahrady (obvod, cena, sloupky)
    const a = ri(5, 15), b = ri(5, 15), obvod = 2 * (a + b);
    const cena = ri(50, 150), celkem = obvod * cena;
    const cand = [2, 3, 4, 5].filter(x => obvod % x === 0), d = cand[ri(0, cand.length - 1)], sloupky = obvod / d;
    return {
      no: 8, points: 4, title: 'Oplocení zahrady',
      intro: `Obdélníková zahrada má rozměry ${a} m × ${b} m a chceme ji celou oplotit.`,
      parts: [
        { key: '8.1', points: 2, prompt: `Kolik metrů plotu je potřeba (obvod zahrady)?`, ans: String(obvod),
          sol: [`Obvod obdélníku je dvojnásobek součtu dvou sousedních stran.`,`Součet sousedních stran: ${a} + ${b} = ${a + b} m.`,`Obvod = 2 · ${a + b} = ${obvod} m.`] },
        { key: '8.2', points: 1, prompt: `Metr plotu stojí ${cena} Kč. Kolik Kč stojí celý plot?`, ans: String(celkem),
          sol: [`Cena se počítá za každý metr plotu, takže se obvod násobí cenou za metr.`,`Celkem = ${obvod} · ${cena} = ${celkem} Kč.`] },
        { key: '8.3', points: 1, prompt: `Sloupky jsou rozmístěny po ${d} metrech. Kolik sloupků je po celém obvodu?`, ans: String(sloupky),
          sol: [`Sloupky stojí po celém obvodu v pravidelných rozestupech, takže se obvod dělí rozestupem.`,`Počet sloupků = ${obvod} : ${d} = ${sloupky}.`] }
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
          sol: [`Chodník obepíná bazén dokola, takže každý rozměr prodlouží na OBOU koncích o ${w} m.`,`Vnější rozměr = ${a} + 2 · ${w} = ${oa} m.`] },
        { key: '16.2', points: 1, prompt: `Jaká je celková šířka obrazce (bazén i s chodníkem, v m)?`, ans: String(ob),
          sol: [`Druhý rozměr se prodlouží úplně stejně — na obou koncích o ${w} m.`,`Vnější rozměr = ${b} + 2 · ${w} = ${ob} m.`] },
        { key: '16.3', points: 1, prompt: `Jaký obsah má samotný chodník (v m²)?`, ans: String(chodnik),
          sol: `Obsah celku = ${oa}·${ob} = ${oa * ob} m². Minus bazén ${a}·${b} = ${a * b} m². Chodník = ${oa * ob} − ${a * b} = ${chodnik} m².` }
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
      no: 5, points: 4, title: 'Místnost',
      intro: `Obdélníková místnost má rozměry ${L} m × ${W} m.`,
      parts: [
        { key: '5.1', points: 2, prompt: `Jaký obsah má podlaha místnosti (v m²)?`, ans: String(area),
          sol: [`Obsah obdélníku je součin dvou sousedních stran (pozor, ne jejich součet — to je obvod).`,`Obsah = ${L} · ${W} = ${area} m².`] },
        { key: '5.2', points: 2, prompt: `Na podlahu položíme obdélníkový koberec ${a} m × ${b} m. Kolik m² podlahy zůstane nezakryto?`, ans: String(volna),
          sol: `Koberec pokryje ${a} · ${b} = ${koberec} m². Nezakryto zůstane ${area} − ${koberec} = ${volna} m².` }
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
          sol: `Provázek (přepona), vodorovná vzdálenost a výška tvoří pravoúhlý trojúhelník. Pythagorova věta: výška² = provázek² − vzdálenost² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${c * c - a * a}. Odmocni: výška = √${c * c - a * a} = ${b} m.` }
      ]
    };
  }

  function gen12d() {
    // 2 body — MC, objem místnosti (kvádr)
    const a = ri(3, 6), b = ri(3, 6), c = ri(2, 4), V = a * b * c;
    const sh = shuffleOpts([V - 2, V - 1, V, V + 2, 'jiný objem'], V);
    return {
      no: 12, points: 2, title: 'Objem místnosti', kind: 'mc',
      svg: svgCuboid(a + ' m', b + ' m', c + ' m'),
      prompt: `Místnost má tvar kvádru: délka ${a} m, šířka ${b} m, výška ${c} m. Jaký je její objem?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Objem kvádru je součin všech tří rozměrů.`,
        `Vynásob podlahu: ${a} · ${b} = ${a * b} m².`,
        `Objem = ${a * b} · ${c} = ${V} m³ → odpověď ${sh.correctLetter}.`]
    };
  }

  function gen13d() {
    // 2 body — MC, kolik procent ušetříš
    const puvodni = ri(2, 9) * 100, usetreno = [10, 20, 25, 50][ri(0, 3)], usetrenoKc = puvodni * usetreno / 100;
    const sh = shuffleOpts([usetreno - 5, usetreno, usetreno + 5, usetreno + 10, 'jiná hodnota'], usetreno);
    return {
      no: 13, points: 2, title: 'Úspora v procentech', kind: 'mc',
      prompt: `Zboží stálo ${puvodni} Kč, teď ho koupíš za ${puvodni - usetrenoKc} Kč. Kolik procent ušetříš?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: `Úspora = ${puvodni} − ${puvodni - usetrenoKc} = ${usetrenoKc} Kč. Vztaženo k původní ceně: ${usetrenoKc} : ${puvodni} = ${usetreno} % → odpověď ${sh.correctLetter}.`
    };
  }

  function gen14d() {
    // 2 body — MC, modus
    const vals = []; while (vals.length < 5) { const v = ri(2, 12); if (!vals.includes(v)) vals.push(v); }
    const m = vals[0], arr = [m, m, m, vals[1], vals[2], vals[3], vals[4]];
    for (let i = arr.length - 1; i > 0; i--) { const j = ri(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    const sh = shuffleOpts(vals.slice(), m);
    return {
      no: 14, points: 2, title: 'Modus', kind: 'mc',
      prompt: `Určete modus (nejčastější hodnotu) těchto čísel: ${arr.join(', ')}.`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Modus je hodnota, která se v souboru objevuje nejčastěji — nepočítá se, jen se hledá.`,`Číslo ${m} se vyskytuje třikrát, ostatní jen jednou.`,`Modus = ${m} → odpověď ${sh.correctLetter}.`]
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
      no: 6, points: 2, title: 'Těžítko',
      svg: svgTezitko(R, H, r, h),
      intro: `Skleněné těžítko má tvar rotačního válce s poloměrem podstavy ${R} cm a výškou ${H} cm. Vnější část těžítka je z čirého skla, uvnitř je část z modrého skla, která má také tvar rotačního válce, a to s poloměrem podstavy ${r} cm a výškou ${h} cm. Pro výpočet použijte π ≐ 3,14.`,
      parts: [
        { key: '6.1', points: 1,
          prompt: `Vypočítejte v cm³ objem celého těžítka. Výsledek zaokrouhlete na desítky cm³.`,
          ans: String(des(Vcelk)),
          sol: [`Objem válce je obsah podstavy krát výška: V = π · r² · v.`,
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
    // 2 body — MC A-E, povrch válce z poměru pláště a podstavy (věrné M9A/2023, úloha 13)
    // Poloměr je násobek 10, aby 3,14 · r² i celý povrch vyšly CELÉ. Při r = 15 vycházelo
    // 3,14 · 225 = 706,5 a povrch 3532,5 — postup to psal jako „= 3533", tedy useknuté
    // cifry s rovnítkem. Zachytil to prijimacky-postupy.test.cjs.
    const r = ri(1, 2) * 10, k = ri(2, 4);
    const povrch = (2 + k) * 3.14 * r * r;
    const opts = [povrch - 2 * 3.14 * r * r, povrch - 3.14 * r * r, povrch, povrch + 3.14 * r * r, 'jiný povrch'];
    const sh = shuffleOpts(opts, povrch);
    return {
      no: 12, points: 2, title: 'Povrch válce', kind: 'mc',
      svg: svgCylinder(r, cz(k * r / 2)),
      prompt: `Obsah pláště rotačního válce je ${k}krát větší než obsah jedné jeho podstavy. Poloměr podstavy válce je ${r} cm. Jaký je povrch válce v cm²? Pro výpočet použijte π ≐ 3,14.`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Povrch válce je plášť PLUS DVĚ podstavy: S = S(plášť) + 2 · S(podstava).`,
        `Plášť je ${k}krát větší než jedna podstava, takže celý povrch je ${k} + 2 = ${k + 2} podstav.`,
        `Obsah jedné podstavy: 3,14 · ${r}² = ${cz(3.14 * r * r)} cm².`,
        `Povrch = ${k + 2} · ${cz(3.14 * r * r)} = ${cz(povrch)} cm² → odpověď ${sh.correctLetter}.`]
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
    const sh = shuffleOpts([hledana - 4, hledana - 2, hledana, hledana + 2, 'jiný počet'], hledana);
    return {
      no: 14, points: 2, title: 'Kroužky', kind: 'mc',
      svg: svgSloupce(jm, hod, neznamy),
      prompt: `Žáci 9. tříd chodí do tří kroužků: ${jm.join(', ')}. Každý žák je právě v jednom z nich a celkem jich je ${celkem}. V grafu chybí počet žáků u kroužku „${jm[neznamy]}". Kolik žáků chodí do tohoto kroužku?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Každý žák je právě v jednom kroužku, takže se počty ve všech třech sloupcích sečtou na celkový počet.`,
        `Z grafu přečti známé sloupce: ${zn[0]} a ${zn[1]}, dohromady ${zn[0]} + ${zn[1]} = ${zn[0] + zn[1]}.`,
        `Chybějící počet = ${celkem} − ${zn[0] + zn[1]} = ${hledana} → odpověď ${sh.correctLetter}.`]
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
    /* Distraktory jen kladné: pro rozdíl 10 dřív vycházely volby „−10" a „0"
       jako odpověď na „o kolik více" — nesmysl, který se vyloučí bez počítání. */
    const vedle = [rozdil - 20, rozdil - 10, rozdil + 10, rozdil + 20, rozdil + 30].filter(v => v > 0).slice(0, 3);
    const sh = shuffleOpts([...vedle, rozdil, 'jiný počet'], rozdil);
    /* 6. pád se musí vypsat, ne skládat: přilepené „-i" dávalo
       „v květeni", „v červeni" a „v srpeni" — ve třech měsících z pěti. */
    const V_MESICI = { 'květen': 'květnu', 'červen': 'červnu', 'červenec': 'červenci', 'srpen': 'srpnu', 'září': 'září' };
    return {
      no: 14, points: 2, title: 'Návštěvnost', kind: 'mc',
      svg: svgSloupce(mesice, hod, -1),
      prompt: `V grafu je uvedena návštěvnost rodného domu spisovatele v jedné letní sezoně. O kolik více vstupenek se prodalo v ${V_MESICI[mesice[iA]]} než v ${V_MESICI[mesice[iB]]}?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: [`Otázka „o kolik více“ znamená ROZDÍL — z grafu tedy stačí přečíst dvě hodnoty a odečíst je.`,
        `${mesice[iA]}: ${hod[iA]} vstupenek, ${mesice[iB]}: ${hod[iB]} vstupenek.`,
        `Rozdíl = ${hod[iA]} − ${hod[iB]} = ${rozdil} → odpověď ${sh.correctLetter}.`]
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

  /* ── SLOTY 1–16 ─────────────────────────────────────────────────
     Každá pozice testu je POLE variant (zatím vždy jedna). Pro
     přidání další varianty do pozice N stačí dopsat další funkci do
     SLOTS[N-1] se STEJNÝM tvarem návratové hodnoty (points musí sedět
     na stejné číslo jako ostatní varianty té pozice, jinak se pokazí
     bodový součet 50). generate() při každém spuštění testu náhodně
     vybere jednu variantu z každé pozice.
     ──────────────────────────────────────────────────────────────── */
  const SLOTS = [
    [gen1, gen1b, gen1c, gen1d, gen1e, gen1f, gen1g, gen1h], [gen2, gen2b, gen2c, gen2d, gen2e, gen2f], [gen3, gen3b, gen3c, gen3d, gen3e, gen3f], [gen4, gen4b, gen4c, gen4d, gen4e], [gen5, gen5b, gen5c], [gen6, gen6b, gen6c, gen6d], [gen7, gen7b, gen7c], [gen8, gen8b, gen8c],
    [gen9, gen9b, gen9c], [gen10, gen10b, gen10c], [gen11, gen11b, gen11c], [gen12, gen12b, gen12c, gen12d, gen12e], [gen13, gen13b, gen13c, gen13d], [gen14, gen14b, gen14c, gen14d, gen14e, gen14f], [gen15, gen15b, gen15c, gen15d, gen15e, gen15f, gen15g, gen15h], [gen16, gen16b, gen16c]
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
