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
    function arc(V, ax, ay, bx, by, color) {
      const p1x = V.x + ax * R, p1y = V.y + ay * R, p2x = V.x + bx * R, p2y = V.y + by * R;
      const cross = ax * by - ay * bx, sweep = cross < 0 ? 1 : 0;
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
    // 1 bod — kolikrát je součet větší než odmocnina součinu
    const a = ri(2, 9) * 4, b = ri(2, 9) * 4;
    const sqrtProd = Math.sqrt(a * b);
    const ans = (a + b) / sqrtProd;
    return {
      no: 1, points: 1, title: 'Číselný výraz',
      parts: [{ key: '', points: 1,
        prompt: `Vypočítejte, kolikrát je součet čísel ${a} a ${b} větší než druhá odmocnina ze součinu čísel ${a} a ${b}.`,
        ans: String(Number.isInteger(ans) ? ans : r2(ans)),
        sol: `Nejdřív sečti čísla: ${a} + ${b} = ${a + b}. Pak je vynásob a výsledek odmocni: √(${a} · ${b}) = √${a * b} ≈ ${r2(sqrtProd)}. Nakonec součet vyděl odmocninou: ${a + b} : ${r2(sqrtProd)} ≈ ${Number.isInteger(ans) ? ans : r2(ans)}.` }]
    };
  }

  function gen2() {
    // 3 body — dva výrazy se zlomky, druhý s postupem
    const a = ri(2, 6), b = ri(2, 6), c = ri(3, 9);
    // 2.1: (-a) * (1/b - 1/c)
    const v1 = (-a) * (1 / b - 1 / c);
    const num1 = -a * (c - b), den1 = b * c, g1 = gcd(Math.abs(num1), den1);
    const ans1 = g1 === den1 ? String(num1 / g1) : `${num1 / g1}/${den1 / g1}`;
    // 2.2: (d^2 - e^2) / f  s postupem
    const d = ri(4, 9), e = ri(2, d - 1), f = ri(2, 6);
    const num2 = d * d - e * e;
    const ans2 = r2(num2 / f);
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `Vypočítejte a výsledek zapište zlomkem v základním tvaru: (−${a}) · (1/${b} − 1/${c}) =`,
          ans: ans1,
          sol: `Nejdřív uprav závorku na společného jmenovatele: 1/${b} − 1/${c} = (${c} − ${b})/(${b}·${c}) = ${c - b}/${b * c}. Pak vynásob číslem −${a}: (−${a}) · ${c - b}/${b * c} = ${num1}/${den1}. Zkrať zlomek jejich NSD (${g1}) na výsledný tvar ${ans1}.` },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `Vypočítejte: (${d}² − ${e}²) : ${f} =`,
          ans: String(ans2),
          sol: `Umocni obě čísla na druhou: ${d}² = ${d * d}, ${e}² = ${e * e}. Odečti je: ${d * d} − ${e * e} = ${num2}. Nakonec vyděl číslem ${f}: ${num2} : ${f} = ${ans2}.` }
      ]
    };
  }

  function gen3() {
    // 4 body — algebraické identity a úpravy (3 podúlohy)
    const a = ri(4, 9); // (x + a)^2 = x^2 + 2a x + a^2
    // 3.1: doplň čísla do (x + _)^2 = x^2 + 2ax + _
    const mid = 2 * a, last = a * a;
    // 3.2: uprav bez závorek: c - (x+d)(-x) + (e-x)(x+f)
    const c = ri(1, 6), d = ri(1, 5), e = ri(2, 7), f = ri(1, 4);
    // c - (x+d)(-x) = c + x^2 + dx
    // (e-x)(x+f) = ex + ef - x^2 - fx
    // total = c + x^2 + dx + ex + ef - x^2 - fx = c + ef + (d+e-f)x
    const coefX = d + e - f, constT = c + e * f;
    const simplified = `${coefX >= 0 ? '' : '−'}${Math.abs(coefX)}x ${constT >= 0 ? '+' : '−'} ${Math.abs(constT)}`;
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
          sol: `Použij vzorec (x + a)² = x² + 2ax + a². Protože 2a = ${mid}, je a = ${a}. Druhé doplněné číslo je a² = ${a}² = ${last}.` },
        { key: '3.2', points: 1, showExplain: true,
          prompt: `Upravte na co nejjednodušší tvar bez závorek a napište koeficient u x: ${c} − (x + ${d})·(−x) + (${e} − x)·(x + ${f})`,
          ans: String(coefX),
          sol: `Roznásob obě závorky: −(x + ${d})·(−x) = x² + ${d}x, a (${e} − x)·(x + ${f}) = ${e}x + ${e * f} − x² − ${f}x. Sečti všechny členy: ${c} + x² + ${d}x + ${e}x + ${e * f} − x² − ${f}x. Členy x² se vyruší, zbyde (${d} + ${e} − ${f})x + (${c} + ${e * f}) = ${simplified}. Koeficient u x je tedy ${coefX}.` },
        { key: '3.3', points: 2, showExplain: true,
          prompt: `Upravte výraz x·(x − ${2 * k}) + ${k}² a rozložte na součin pomocí vzorce. Napište, čemu se rovná (x − ?) v rozkladu (x − ?)².`,
          ans: String(k),
          sol: `Roznásob: x·(x − ${2 * k}) = x² − ${2 * k}x. Přičti ${k}² = ${k * k}: x² − ${2 * k}x + ${k * k}. To odpovídá vzorci a² − 2ab + b² = (a−b)² s a=x, b=${k} (protože 2ab = 2·x·${k} = ${2 * k}x). Výraz se tedy rozloží na (x − ${k})².` }
      ]
    };
  }

  function gen4() {
    // 4 body — rovnice s postupem
    const x1 = ri(2, 9);
    const p = ri(2, 6), q = ri(2, 8);
    // p*(a/p - x/q) - r*(x/s - t/u) = konst*x  -- keep simple: p(a - x) = q(x - b)
    const a4 = ri(3, 10), b4 = ri(1, a4 - 1);
    // p(a4 - x) = q(x - b4)  =>  p*a4 - p x = q x - q b4  => p*a4+q*b4 = (p+q) x
    const x2 = (p * a4 + q * b4) / (p + q);
    const y1 = ri(2, 9);
    const c4 = ri(2, 6) / 10;
    // y - (y + m)*c4 = n*y + o  solve for y given chosen y1
    const m4 = ri(2, 8);
    const n4 = r1(1 - c4 - ri(1, 3) / 20);
    const o4 = r1(y1 * (1 - c4 - n4) - c4 * m4);
    return {
      no: 4, points: 4, title: 'Rovnice',
      parts: [
        { key: '4.1', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen x: ${p}·(${a4} − x) = ${q}·(x − ${b4})`,
          ans: String(Number.isInteger(x2) ? x2 : r2(x2)),
          sol: `Roznásob závorky: ${p}·${a4} − ${p}x = ${q}x − ${q}·${b4}, tedy ${p * a4} − ${p}x = ${q}x − ${q * b4}. Převeď členy s x na jednu stranu a čísla na druhou: ${p * a4} + ${q * b4} = ${q}x + ${p}x, čili ${p * a4 + q * b4} = ${p + q}x. Vyděl: x = ${p * a4 + q * b4} : ${p + q} = ${Number.isInteger(x2) ? x2 : r2(x2)}.` },
        { key: '4.2', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen y: y − (y + ${m4})·${cz(c4)} = ${cz(n4)}y + ${cz(o4)}`,
          ans: String(y1),
          sol: `Nejdřív roznásob závorku: (y + ${m4})·${cz(c4)} = ${cz(c4)}y + ${cz(r2(c4 * m4))}. Rovnice se změní na tvar (číslo)·y = (číslo) — všechny členy s y dej na jednu stranu, čísla na druhou, a vyděl koeficientem u y. Vyjde y = ${y1}.` }
      ]
    };
  }

  function gen5() {
    // 4 body — geometrie: pozemek se čtvercem a obdélníkem (2 podúlohy)
    const c5 = ri(4, 9) * 4; // strana čtverce (pozemek)
    const cel = c5 * c5;
    const domObsah = Math.round(cel / 5);
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
          sol: `Obsah pozemku je c² = ${c5}² = ${cel} m². Obsah domu je pětina z toho: ${cel} : 5 = ${domObsah} m². Šířku domu spočítáš jako obsah : délka: ${domObsah} : ${a5} = ${b5} m (zaokrouhleno na celé metry).` },
        { key: '5.2', points: 2,
          prompt: `Rybníček má rozlohu ${pRybnik} % celkové rozlohy pozemku. Vypočítejte v m² rozlohu volné části pozemku (bez domu a rybníčku). Použijte obsah domu = ${domObsah} m² a obsah rybníčku = ${rybnik} m².`,
          ans: String(volna),
          sol: `Volná část = celková rozloha − dům − rybníček: ${cel} − ${domObsah} − ${rybnik} = ${volna} m².` }
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
          sol: `Převeď mm na cm: ${mm1} mm = ${mm1 / 10} cm. Objem přibylé vody = obsah dna × výška: ${S6} cm² × ${mm1 / 10} cm = ${r2(S6 * (mm1 / 10))} cm³. Převeď na litry (1 l = 1000 cm³): ${r2(S6 * (mm1 / 10))} : 1000 ≈ ${litry1exact} l.` },
        { key: '6.2', points: 1,
          prompt: `Při lijáku přibyly v sudu ${litry2} litry vody. O kolik mm stoupla hladina (zaokrouhlete na celé mm)?`,
          ans: String(Math.round(litry2 * 1000 / S6 * 10)),
          sol: `Převeď litry na cm³: ${litry2} l = ${litry2 * 1000} cm³. Výšku vypočítáš jako objem : obsah dna: ${litry2 * 1000} : ${S6} ≈ ${r2(litry2 * 1000 / S6)} cm. Převeď na mm (×10): ≈ ${Math.round(litry2 * 1000 / S6 * 10)} mm.` }
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
          sol: `Souhlasné úhly na rovnoběžkách jsou stejně velké, proto α = ${given}°.` },
        { key: '7.2', points: 1, prompt: `Vypočítejte velikost úhlu β (vedlejší úhel k α).`, ans: String(beta),
          sol: `Vedlejší úhly dávají dohromady 180°, proto β = 180° − ${given}° = ${beta}°.` },
        { key: '7.3', points: 1, prompt: `Vypočítejte velikost úhlu γ (vrcholový úhel k danému úhlu ${given}° na přímce p).`, ans: String(gamma),
          sol: `Vrcholové úhly jsou shodné (stejně velké), proto γ = ${given}°.` }
      ]
    };
  }

  function gen8() {
    // 4 body — obvod + počítání prvků v pravidelných rozestupech
    const stran3 = ri(4, 9); // tři strany stejně dlouhé, čtvrtá o čtvrtinu delší
    const d8 = stran3 * 4; // čtvrtá strana (o čtvrtinu delší než 3*stran3? use direct: čtvrtá = stran3 * 4/3 zaokrouhleno)
    const kratsi = stran3 * 3; // tři kratší strany po stran3*3 (celkem)... zjednodušeno níže
    // Zjednodušený model: čtyřúhelník má 3 strany po "a" m a čtvrtou stranu "b" m, b = a * 4/3
    const aStr = ri(3, 8) * 3; // dělitelné 3, aby b vyšlo celé
    const bStr = Math.round(aStr * 4 / 3);
    const obvodM = 3 * aStr + bStr;
    const rozestupCm = 40;
    const pocetRostlin = Math.round(obvodM * 100 / rozestupCm);
    const rozdilRostlin = Math.round((bStr * 100 / rozestupCm) - (aStr * 100 / rozestupCm));
    const skupinaVelikost = ri(2, 4);
    return {
      no: 8, points: 4, title: 'Záhon',
      intro: `Záhon má tvar čtyřúhelníku: tři strany jsou stejně dlouhé (${aStr} m), čtvrtá strana měří ${bStr} m. Po obvodu je ve stejných rozestupech ${rozestupCm} cm vysázeno celkem ${pocetRostlin} rostlin, po jedné i v každém rohu.`,
      parts: [
        { key: '8.1', points: 2, prompt: `Vypočítejte v metrech obvod záhonu.`, ans: String(obvodM),
          sol: `Tři strany po ${aStr} m: 3 × ${aStr} = ${3 * aStr} m. Přičti čtvrtou stranu ${bStr} m: ${3 * aStr} + ${bStr} = ${obvodM} m.` },
        { key: '8.2', points: 1, prompt: `O kolik se liší počet rostlin na nejdelší straně (${bStr} m) od počtu rostlin na jedné z kratších stran (${aStr} m)?`, ans: String(Math.abs(rozdilRostlin)),
          sol: `Na straně ${bStr} m je ${Math.round(bStr * 100 / rozestupCm)} rostlin (${bStr * 100} cm : ${rozestupCm} cm), na straně ${aStr} m je ${Math.round(aStr * 100 / rozestupCm)} rostlin (${aStr * 100} cm : ${rozestupCm} cm). Rozdíl: ${Math.round(bStr * 100 / rozestupCm)} − ${Math.round(aStr * 100 / rozestupCm)} = ${Math.abs(rozdilRostlin)}.` },
        { key: '8.3', points: 1, prompt: `Rostliny se po obvodu pravidelně střídají ve skupinkách po ${skupinaVelikost}. Kolik celkem skupinek je po obvodu (${pocetRostlin} rostlin)?`, ans: String(Math.round(pocetRostlin / skupinaVelikost)),
          sol: `Počet skupinek = počet rostlin : velikost skupinky: ${pocetRostlin} : ${skupinaVelikost} ≈ ${Math.round(pocetRostlin / skupinaVelikost)}.` }
      ]
    };
  }

  function gen9() {
    // 4 body — Pythagorova věta, slovní úloha (náhrada za konstrukční úlohu)
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
    const t = triples[ri(0, triples.length - 1)];
    const k = ri(2, 4);
    const a9 = t[0] * k, b9 = t[1] * k, c9 = t[2] * k;
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
          sol: `U podobných trojúhelníků platí, že odpovídající strany se liší koeficientem podobnosti k. Stranu většího trojúhelníku spočítáš jako: ${orig} × ${k10} = ${orig * k10} cm.` }
      ]
    };
  }

  function gen11() {
    // 4 body -> upraveno na 3 body (3× 1 bod) — pravda/nepravda o tělesech
    const a11 = ri(2, 4), b11 = ri(3, 6), c11 = ri(2, 5);
    const soucetHran = 4 * (a11 + b11 + c11);
    const tvrzeniSoucet = soucetHran + (ri(0, 1) ? 0 : ri(2, 8));
    const st1 = { text: `Součet délek všech hran kvádru s hranami ${a11} cm, ${b11} cm a ${c11} cm je ${tvrzeniSoucet} cm.`, ans: tvrzeniSoucet === soucetHran ? 'A' : 'N',
      sol: `Kvádr má 12 hran (4 od každého rozměru). Součet všech hran = 4·(a+b+c) = 4·(${a11}+${b11}+${c11}) = ${soucetHran} cm. Tvrzení uvádí ${tvrzeniSoucet} cm, což je ${tvrzeniSoucet === soucetHran ? 'stejné číslo — tvrzení je PRAVDIVÉ (A).' : 'jiné číslo — tvrzení je NEPRAVDIVÉ (N).'}` };
    const povrch1 = 2 * (a11 * b11 + b11 * c11 + a11 * c11);
    const a11b = a11 + 1;
    const povrch2 = 2 * (a11b * b11 + b11 * c11 + a11b * c11);
    const rozdilTvrzeny = ri(0, 1) ? (povrch2 - povrch1) : (povrch2 - povrch1) + ri(2, 6);
    const st2 = { text: `Kvádr s hranami ${a11b} cm, ${b11} cm, ${c11} cm má o ${rozdilTvrzeny} cm² větší povrch než kvádr s hranami ${a11} cm, ${b11} cm, ${c11} cm.`, ans: rozdilTvrzeny === (povrch2 - povrch1) ? 'A' : 'N',
      sol: `Povrch kvádru = 2·(a·b + b·c + a·c). Kvádr ${a11}×${b11}×${c11}: povrch = 2·(${a11}·${b11} + ${b11}·${c11} + ${a11}·${c11}) = ${povrch1} cm². Kvádr ${a11b}×${b11}×${c11}: povrch = 2·(${a11b}·${b11} + ${b11}·${c11} + ${a11b}·${c11}) = ${povrch2} cm². Skutečný rozdíl je ${povrch2 - povrch1} cm², tvrzení uvádí ${rozdilTvrzeny} cm², takže je ${rozdilTvrzeny === (povrch2 - povrch1) ? 'PRAVDIVÉ (A).' : 'NEPRAVDIVÉ (N).'}` };
    const objem1 = a11 * b11 * c11;
    const objem2 = a11b * b11 * c11;
    const st3ok = objem2 > objem1;
    const st3 = { text: `Kvádr s hranami ${a11b} cm, ${b11} cm, ${c11} cm má větší objem než kvádr s hranami ${a11} cm, ${b11} cm, ${c11} cm.`, ans: 'A',
      sol: `Objem kvádru = a·b·c. Kvádr ${a11}×${b11}×${c11}: ${a11}·${b11}·${c11} = ${objem1} cm³. Kvádr ${a11b}×${b11}×${c11}: ${a11b}·${b11}·${c11} = ${objem2} cm³. Protože ${a11b} > ${a11} a ostatní hrany jsou stejné, je i objem větší (${objem2} > ${objem1}) — tvrzení je PRAVDIVÉ (A).` };
    return {
      no: 11, points: 3, title: 'Kvádry',
      kind: 'tfgrid',
      intro: `Rozhodněte o každém z tvrzení (11.1–11.3), zda je pravdivé (A), či nikoli (N).`,
      statements: [st1, st2, st3]
    };
  }

  function gen12() {
    // 2 body — MC A-E, objem (bazén se šikmým dnem)
    const delka = ri(2, 4) * 10, sirka = ri(1, 2) * 5 + 5;
    const h1 = 1, h2 = 2;
    const zonaNepl = delka / 2;
    const V = delka === 0 ? 0 : (zonaNepl * sirka * h1) + (zonaNepl * sirka * (h1 + h2) / 2);
    const correct = Math.round(V);
    const opts = [correct - 50, correct - 25, correct, correct + 25, 'jiný objem'];
    const shuffled = shuffleOpts(opts, correct);
    return {
      no: 12, points: 2, title: 'Bazén',
      kind: 'mc',
      prompt: `Bazén má délku ${delka} m a šířku ${sirka} m. V zóně pro neplavce (polovina délky) je všude hloubka ${h1} m. V zóně pro plavce dno plynule klesá z ${h1} m na ${h2} m. Jaký je objem bazénu?`,
      options: shuffled.labels,
      ans: shuffled.correctLetter,
      sol: `Bazén rozděl na dvě poloviny po délce ${zonaNepl} m. Neplavecká část má všude hloubku ${h1} m: objem = ${zonaNepl} × ${sirka} × ${h1} = ${zonaNepl * sirka * h1} m³. Plavecká část má šikmé dno od ${h1} m do ${h2} m, průměrná hloubka je (${h1}+${h2}):2 = ${(h1 + h2) / 2} m: objem = ${zonaNepl} × ${sirka} × ${(h1 + h2) / 2} = ${zonaNepl * sirka * (h1 + h2) / 2} m³. Celkový objem = ${zonaNepl * sirka * h1} + ${zonaNepl * sirka * (h1 + h2) / 2} = ${correct} m³ → odpověď ${shuffled.correctLetter}.`
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
    const prumer = r1(ri(15, 22) / 10);
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
      sol: `Součet všech známek = průměr × počet žáků: ${cz(prumer)} × ${n14} = ${soucetZnamek}. Když j žáků má jedničku a zbylých ${n14}−j žáků má dvojku, součet = 1·j + 2·(${n14}−j) = ${2 * n14} − j. Z rovnice ${2 * n14} − j = ${soucetZnamek} vyjde j = ${2 * n14} − ${soucetZnamek} = ${pocetJednicek} → odpověď ${shuffled.correctLetter}.`
    };
  }

  function gen15() {
    // 6 bodů — přiřazování, 3 procentové úlohy → 6 možností
    function pctTask() {
      const celek = ri(4, 10) * 20;
      const cast = ri(2, 8) * 10;
      return { celek, cast, pct: Math.round(cast / celek * 100) };
    }
    const t1 = pctTask(), t2 = pctTask(), t3 = pctTask();
    const answers = [t1.pct, t2.pct, t3.pct];
    // vytvoř 6 možností: 3 správné + 3 distraktory, seřazeno
    const set = new Set(answers);
    while (set.size < 6) { set.add(ri(20, 80)); }
    const optsArr = [...set].sort((a, b) => a - b);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const labels = optsArr.map((v, i) => `${letters[i]}) ${v} %`);
    const ansLetters = answers.map(v => letters[optsArr.indexOf(v)]);
    return {
      no: 15, points: 6, title: 'Procenta',
      kind: 'match',
      prompts: [
        `Ve firmě pracuje ${t1.celek} lidí, z toho ${t1.cast} na home office. Kolik procent zaměstnanců pracuje z domova?`,
        `Ze ${t2.celek} výrobků bylo ${t2.cast} vadných. Kolik procent výrobků bylo vadných?`,
        `Třída má ${t3.celek} žáků, ${t3.cast} z nich jezdí do školy autobusem. Kolik procent žáků jezdí autobusem?`
      ],
      options: labels,
      ans: ansLetters,
      sol: [
        `Podíl pracovníků na home office: ${t1.cast} : ${t1.celek} ≈ ${r2(t1.cast / t1.celek)}. Vynásob 100, abys dostal procenta: ≈ ${t1.pct} %.`,
        `Podíl vadných výrobků: ${t2.cast} : ${t2.celek} ≈ ${r2(t2.cast / t2.celek)}. Vynásob 100: ≈ ${t2.pct} %.`,
        `Podíl žáků jedoucích autobusem: ${t3.cast} : ${t3.celek} ≈ ${r2(t3.cast / t3.celek)}. Vynásob 100: ≈ ${t3.pct} %.`
      ]
    };
  }

  function gen16() {
    // 4 body — vzor/posloupnost (rámečky z destiček)
    const destickaA = 2, destickaB = 3; // rozměry destičky cm
    const bileStrana = ri(2, 6);
    function pocetDesticek(bila) { return (bila / destickaA + 1) * 4 * 0 + Math.round((4 * (bila + destickaB)) / (destickaA)); }
    // Zjednodušený model rámu: obrazec = bílý čtverec (strana w) obklopený rámem z desiček šířky destickaA,
    // celková strana obrazce = w + 2*destickaA, počet destiček v rámu = obvod rámu / destickaB (přibližně) — zjednodušeno na lineární vzorec:
    function ramData(w) {
      const celk = w + 2 * destickaA;
      const pocet = Math.round((4 * w + 8 * destickaA) / destickaB) ; // heuristika, konzistentní pro generování
      return { celk, pocet };
    }
    const w1 = bileStrana;
    const d1 = ramData(w1);
    const w2 = bileStrana + 3;
    const d2 = ramData(w2);
    const rozdilPocet = Math.abs(d2.pocet - d1.pocet);
    const w3 = bileStrana + 5;
    const d3 = ramData(w3);
    return {
      no: 16, points: 4, title: 'Rámečky',
      intro: `Vytváříme čtvercové obrazce: bílý čtverec obklopený rámem ze shodných destiček o rozměrech ${destickaA} cm × ${destickaB} cm.`,
      parts: [
        { key: '16.1', points: 2, prompt: `Bílý čtverec uvnitř má stranu ${w1} cm. Jaká je délka strany CELÉHO obrazce (v cm)?`, ans: String(d1.celk),
          sol: `Celková strana obrazce = strana bílého čtverce + 2× šířka destičky (destička lemuje obě strany): ${w1} + 2 × ${destickaA} = ${w1} + ${2 * destickaA} = ${d1.celk} cm.` },
        { key: '16.2', points: 1, prompt: `Pro obrazec s bílým čtvercem o straně ${w1} cm je v rámu ${d1.pocet} destiček. Pro obrazec s bílým čtvercem o straně ${w2} cm je v rámu ${d2.pocet} destiček. O kolik destiček se liší?`, ans: String(rozdilPocet),
          sol: `Do rámu s větším čtvercem (${w2} cm) se vejde ${d2.pocet} destiček, do rámu s menším čtvercem (${w1} cm) jen ${d1.pocet}. Rozdíl: ${d2.pocet} − ${d1.pocet} = ${rozdilPocet} destiček.` },
        { key: '16.3', points: 1, prompt: `Jaká je délka strany celého obrazce, má-li bílý čtverec stranu ${w3} cm (v cm)?`, ans: String(d3.celk),
          sol: `Stejně jako v 16.1: strana obrazce = strana bílého čtverce + 2× šířka destičky: ${w3} + 2 × ${destickaA} = ${w3} + ${2 * destickaA} = ${d3.celk} cm.` }
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
        sol: `Součin: ${a} · ${b} = ${a * b}. Součet: ${a} + ${b} = ${a + b}. Rozdíl: ${a * b} − ${a + b} = ${ans}.` }]
    };
  }

  function gen4b() {
    // 4 body — dvě lineární rovnice (2+2), s postupem
    const x1 = ri(2, 9);
    const a = ri(3, 6), c = ri(2, a - 1), b = ri(1, 9);
    const d = (a - c) * x1 + b; // a*x1+b = c*x1+d
    const x2 = ri(2, 9), k = ri(2, 5), n = ri(3, 8);
    const mm = n * k - x2; // (x2+mm)/k = n
    return {
      no: 4, points: 4, title: 'Rovnice',
      parts: [
        { key: '4.1', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen x: ${a}x + ${b} = ${c}x + ${d}`,
          ans: String(x1),
          sol: `Převeď členy s x na jednu stranu, čísla na druhou: ${a}x − ${c}x = ${d} − ${b}, tedy ${a - c}x = ${d - b}. Vyděl: x = ${d - b} : ${a - c} = ${x1}.` },
        { key: '4.2', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen x: (x + ${mm}) : ${k} = ${n}`,
          ans: String(x2),
          sol: `Vynásob obě strany číslem ${k}: x + ${mm} = ${n} · ${k} = ${n * k}. Odečti ${mm}: x = ${n * k} − ${mm} = ${x2}.` }
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
          sol: `Součet vnitřních úhlů trojúhelníku je 180°: γ = 180° − α − β = 180° − ${al}° − ${be}° = ${ga}°.` },
        { key: '7.2', points: 1, prompt: `Vypočítejte velikost vnějšího úhlu u vrcholu C.`, ans: String(vnejsiC),
          sol: `Vnější úhel se rovná součtu dvou vnitřních úhlů při zbylých vrcholech: α + β = ${al}° + ${be}° = ${vnejsiC}° (nebo 180° − γ = ${vnejsiC}°).` },
        { key: '7.3', points: 1, prompt: `Který vnitřní úhel trojúhelníku je největší? Napište jeho velikost ve stupních.`, ans: String(maxIn),
          sol: `Porovnej α = ${al}°, β = ${be}°, γ = ${ga}°. Největší je ${maxIn}°.` }
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
      prompt: `Bazén má tvar kvádru: délka ${delka} m, šířka ${sirka} m a všude stejná hloubka ${hloubka} m. Jaký je jeho objem?`,
      options: shuffled.labels, ans: shuffled.correctLetter,
      sol: `Objem kvádru = délka × šířka × hloubka: ${delka} × ${sirka} × ${hloubka} = ${V} m³ → odpověď ${shuffled.correctLetter}.`
    };
  }

  function gen13b() {
    // 2 body — MC A-E, procenta (zdražení a následná sleva)
    const cena = ri(4, 9) * 100, p1 = [10, 20, 25][ri(0, 2)], p2 = [10, 20][ri(0, 1)];
    const po1 = cena * (1 + p1 / 100);
    const fin = Math.round(po1 * (1 - p2 / 100));
    const opts = [fin - 20, fin - 10, fin, fin + 10, 'jiná cena'];
    const shuffled = shuffleOpts(opts, fin);
    return {
      no: 13, points: 2, title: 'Cena zboží', kind: 'mc',
      prompt: `Zboží stálo ${cena} Kč. Nejdřív zdražilo o ${p1} %, potom z nové ceny zlevnilo o ${p2} %. Kolik stojí nyní?`,
      options: shuffled.labels, ans: shuffled.correctLetter,
      sol: `Po zdražení o ${p1} %: ${cena} × ${1 + p1 / 100} = ${po1} Kč. Po zlevnění o ${p2} % z této ceny: ${po1} × ${1 - p2 / 100} = ${fin} Kč → odpověď ${shuffled.correctLetter}. (Pozor: procenta se počítají vždy z aktuální ceny, ne z původní.)`
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

  /* ── SLOTY 1–16 ─────────────────────────────────────────────────
     Každá pozice testu je POLE variant (zatím vždy jedna). Pro
     přidání další varianty do pozice N stačí dopsat další funkci do
     SLOTS[N-1] se STEJNÝM tvarem návratové hodnoty (points musí sedět
     na stejné číslo jako ostatní varianty té pozice, jinak se pokazí
     bodový součet 50). generate() při každém spuštění testu náhodně
     vybere jednu variantu z každé pozice.
     ──────────────────────────────────────────────────────────────── */
  const SLOTS = [
    [gen1, gen1b], [gen2], [gen3], [gen4, gen4b], [gen5], [gen6], [gen7, gen7b], [gen8],
    [gen9], [gen10], [gen11], [gen12, gen12b], [gen13, gen13b], [gen14], [gen15], [gen16]
  ];

  window.RPG_CERMAT_9 = {
    timeLimitSec: 70 * 60,
    maxScore: 50,
    generate: function () {
      return SLOTS.map(variants => pick(variants)());
    }
  };
})();
