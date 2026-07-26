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
    // 1 bod — druhá odmocnina součinu; součin je vždy druhá mocnina ⇒ výsledek CELÉ číslo (bez kalkulačky)
    const k = ri(2, 3), v = ri(2, 3);
    const a = k, b = k * v * v;       // a·b = k²·v² = (k·v)²
    const root = k * v;
    return {
      no: 1, points: 1, title: 'Číselný výraz',
      parts: [{ key: '', points: 1,
        prompt: `Vypočítejte druhou odmocninu ze součinu čísel ${a} a ${b}: √(${a} · ${b}) =`,
        ans: String(root),
        sol: `Nejdřív součin: ${a} · ${b} = ${a * b}. Pak odmocni: √${a * b} = ${root} (protože ${root}² = ${a * b}).` }]
    };
  }

  function gen2() {
    // 3 body — dva výrazy se zlomky, druhý s postupem
    const a = ri(2, 6), b = ri(2, 6), c = ri(3, 9);
    // 2.1: (-a) * (1/b - 1/c)
    const v1 = (-a) * (1 / b - 1 / c);
    const num1 = -a * (c - b), den1 = b * c, g1 = gcd(Math.abs(num1), den1);
    const ans1 = g1 === den1 ? String(num1 / g1) : `${num1 / g1}/${den1 / g1}`;
    // 2.2: (d^2 - e^2) / f  s postupem — f je dělitel num2 ⇒ výsledek CELÉ číslo
    const d = ri(4, 9), e = ri(2, d - 1);
    const num2 = d * d - e * e;
    const fCand = [2, 3, 4, 5, 6].filter(x => num2 % x === 0);
    const f = fCand.length ? fCand[ri(0, fCand.length - 1)] : 1;
    const ans2 = num2 / f;
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `Vypočítejte a výsledek zapište zlomkem v základním tvaru: (−${a}) · (1/${b} − 1/${c}) =`,
          ans: ans1,
          sol: `Nejdřív uprav závorku na společného jmenovatele: 1/${b} − 1/${c} = (${c} − ${b})/(${b}·${c}) = ${c - b}/${b * c}. Pak vynásob číslem −${a}: (−${a}) · ${c - b}/${b * c} = ${num1}/${den1}. ${g1 === 1 ? `Zlomek ${num1}/${den1} už je v základním tvaru: ${ans1}.` : `Zkrať zlomek jejich NSD (${g1}) na výsledný tvar ${ans1}.`}` },
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
          prompt: `Upravte výraz x·(x − ${2 * k}) + ${k}² a rozložte na součin pomocí vzorce. Napište číslo, které patří místo otazníku v rozkladu (x − ?)².`,
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
          ans: String(Number.isInteger(x2) ? x2 : r2(x2)),
          sol: `Roznásob závorky: ${p}·${a4} − ${p}x = ${q}x − ${q}·${b4}, tedy ${p * a4} − ${p}x = ${q}x − ${q * b4}. Převeď členy s x na jednu stranu a čísla na druhou: ${p * a4} + ${q * b4} = ${q}x + ${p}x, čili ${p * a4 + q * b4} = ${p + q}x. Vyděl: x = ${p * a4 + q * b4} : ${p + q} = ${Number.isInteger(x2) ? x2 : r2(x2)}.` },
        { key: '4.2', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen y: y − (y + ${m4})·${cz(c4)} = ${cz(n4)}y ${o4sign}`,
          ans: String(y1),
          sol: `Roznásob závorku: (y + ${m4})·${cz(c4)} = ${cz(c4)}y + ${cz(cm4)}. Rovnice je pak ${cz(lhsY)}y − ${cz(cm4)} = ${cz(n4)}y ${o4sign}. Dej členy s y vlevo a čísla vpravo: (${cz(lhsY)} − ${cz(n4)})y = ${cz(diff)}y a vyděl koeficientem ${cz(diff)}. Vyjde y = ${y1}.` }
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
          prompt: `Při lijáku přibylo v sudu ${litry2} l vody. O kolik mm stoupla hladina (zaokrouhlete na celé mm)?`,
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
          sol: `Počet skupinek = počet rostlin : velikost skupinky: ${pocetRostlin} : ${skupinaVelikost} = ${pocetRostlin / skupinaVelikost}.` }
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
    // náhodně obrátit směr tvrzení, ať poslední řádek není vždy 'A' (nepredikovatelné)
    const st3menuje = ri(0, 1);  // true: tvrdí větší (pravda), false: tvrdí menší (nepravda)
    const st3 = st3menuje
      ? { text: `Kvádr s hranami ${a11b} cm, ${b11} cm, ${c11} cm má větší objem než kvádr s hranami ${a11} cm, ${b11} cm, ${c11} cm.`, ans: 'A',
          sol: `Objem kvádru = a·b·c. Kvádr ${a11}×${b11}×${c11}: ${objem1} cm³. Kvádr ${a11b}×${b11}×${c11}: ${objem2} cm³. Protože ${a11b} > ${a11} a ostatní hrany jsou stejné, je objem větší (${objem2} > ${objem1}) — tvrzení je PRAVDIVÉ (A).` }
      : { text: `Kvádr s hranami ${a11} cm, ${b11} cm, ${c11} cm má větší objem než kvádr s hranami ${a11b} cm, ${b11} cm, ${c11} cm.`, ans: 'N',
          sol: `Objem kvádru = a·b·c. Kvádr ${a11}×${b11}×${c11}: ${objem1} cm³. Kvádr ${a11b}×${b11}×${c11}: ${objem2} cm³. Protože ${a11} < ${a11b}, je objem menší (${objem1} < ${objem2}), ne větší — tvrzení je NEPRAVDIVÉ (N).` };
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
      sol: `Součet všech známek = průměr × počet žáků: ${cz(prumer)} × ${n14} = ${soucetZnamek}. Když j žáků má jedničku a zbylých ${n14}−j žáků má dvojku, součet = 1·j + 2·(${n14}−j) = ${2 * n14} − j. Z rovnice ${2 * n14} − j = ${soucetZnamek} vyjde j = ${2 * n14} − ${soucetZnamek} = ${pocetJednicek} → odpověď ${shuffled.correctLetter}.`
    };
  }

  function gen15() {
    // 6 bodů — přiřazování, 3 procentové úlohy → 6 možností
    // pct volíme první ⇒ část i procenta vyjdou PŘESNĚ celočíselně (žádné zaokrouhlování)
    function pctTask(used) {
      let pct, celek, cast;
      do {
        pct = ri(2, 18) * 5;              // 10–90 %
        celek = [100, 200][ri(0, 1)];
        cast = pct * celek / 100;         // vždy celé číslo
      } while (used.includes(pct) || cast > celek);
      used.push(pct);
      return { celek, cast, pct };
    }
    const used = [];
    const t1 = pctTask(used), t2 = pctTask(used), t3 = pctTask(used);
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
        `Ze ${t2.celek} výrobků bylo ${t2.cast} vadných. Kolik procent výrobků bylo vadných?`,
        `Třída má ${t3.celek} žáků, ${t3.cast} z nich jezdí do školy autobusem. Kolik procent žáků jezdí autobusem?`
      ],
      options: labels,
      ans: ansLetters,
      sol: [
        `Podíl pracovníků na home office: ${t1.cast} : ${t1.celek} = ${cz(t1.cast / t1.celek)}. Vynásob 100, abys dostal procenta: ${t1.pct} %.`,
        `Podíl vadných výrobků: ${t2.cast} : ${t2.celek} = ${cz(t2.cast / t2.celek)}. Vynásob 100: ${t2.pct} %.`,
        `Podíl žáků jedoucích autobusem: ${t3.cast} : ${t3.celek} = ${cz(t3.cast / t3.celek)}. Vynásob 100: ${t3.pct} %.`
      ]
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
          sol: `Rám přidá ${RAM} cm na obou protějších stranách, tedy 2× ${RAM} cm: strana obrázku = ${w1} + 2 × ${RAM} = ${w1} + ${2 * RAM} = ${side(w1)} cm.` },
        { key: '16.2', points: 1, prompt: `Jaký obsah má samotný rám u obrázku s bílým čtvercem o straně ${w1} cm (v cm²)?`, ans: String(frameArea(w1)),
          sol: `Obsah rámu = obsah celého obrázku − obsah bílého čtverce: ${side(w1)}² − ${w1}² = ${side(w1) * side(w1)} − ${w1 * w1} = ${frameArea(w1)} cm².` },
        { key: '16.3', points: 1, prompt: `Jaká je délka strany celého obrázku, má-li bílý čtverec stranu ${w3} cm (v cm)?`, ans: String(side(w3)),
          sol: `Stejně jako v 16.1: strana obrázku = ${w3} + 2 × ${RAM} = ${w3} + ${2 * RAM} = ${side(w3)} cm.` }
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
    const po1 = Math.round(cena * (1 + p1 / 100));   // celé číslo (cena násobek 100, p násobek 5)
    const fin = Math.round(po1 * (1 - p2 / 100));
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
          sol: `Sečti zlomky v závorce na společného jmenovatele ${b}·${c} = ${b * c}: 1/${b} + 1/${c} = ${b + c}/${b * c}. Vynásob číslem ${a}: ${a} · ${b + c}/${b * c} = ${num}/${den}. ${g === 1 ? `Zlomek ${num}/${den} už je v základním tvaru: ${ans1}.` : `Zkrať NSD (${g}): ${ans1}.`}` },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `Vypočítejte: (${d} + ${e})² − (${d}² + ${e}²) =`,
          ans: String(ans2),
          sol: `Umocni součet vzorcem (a+b)² = a² + 2ab + b²: (${d}+${e})² = ${d * d} + ${2 * d * e} + ${e * e} = ${(d + e) * (d + e)}. Odečti (${d}² + ${e}²) = ${d * d + e * e}: ${(d + e) * (d + e)} − ${d * d + e * e} = ${ans2}. (Zbyde přesně dvojnásobek součinu 2·${d}·${e}.)` }
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
          sol: `Použij vzorec (x − a)² = x² − 2ax + a². Koeficient u x je 2a = 2·${a} = ${2 * a}.` },
        { key: '3.2', points: 1, showExplain: true,
          prompt: `Upravte na co nejjednodušší tvar a napište koeficient u x: (x + ${p})² − (x − ${p})²`,
          ans: String(4 * p),
          sol: `(x+${p})² = x² + ${2 * p}x + ${p * p} a (x−${p})² = x² − ${2 * p}x + ${p * p}. Rozdíl: (x² + ${2 * p}x + ${p * p}) − (x² − ${2 * p}x + ${p * p}) = ${4 * p}x. Koeficient u x je ${4 * p}.` },
        { key: '3.3', points: 2, showExplain: true,
          prompt: `Rozložte na součin pomocí vzorce a napište číslo místo otazníku: x² + ${2 * k}x + ${k * k} = (x + ?)²`,
          ans: String(k),
          sol: `Vzorec a² + 2ab + b² = (a+b)². Zde 2ab = ${2 * k}x, tedy b = ${2 * k} : 2 = ${k} (a b² = ${k}² = ${k * k} sedí). Výraz se rozloží na (x + ${k})².` }
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
          sol: `Cesta = ${pCesta} % z ${celk} = ${cesta} m². Volná část = celková rozloha − záhon − cesta = ${celk} − ${zahon} − ${cesta} = ${volna} m².` }
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
      intro: `Akvárium má tvar kvádru s rozměry dna ${a} cm × ${b} cm a výškou ${c} cm.`,
      parts: [
        { key: '6.1', points: 1,
          prompt: `Kolik litrů vody se do akvária vejde, když ho naplníme až po okraj? (1 l = 1000 cm³)`,
          ans: String(litryCelk),
          sol: `Objem kvádru = ${a} · ${b} · ${c} = ${objemCm} cm³. Převeď na litry: ${objemCm} : 1000 = ${litryCelk} l.` },
        { key: '6.2', points: 1,
          prompt: `Voda v akváriu sahá do výšky ${hCm} cm. Kolik litrů vody v něm je?`,
          ans: String(litryVoda),
          sol: `Objem vody = obsah dna × výška vody = (${a} · ${b}) · ${hCm} = ${baseA} · ${hCm} = ${baseA * hCm} cm³ = ${litryVoda} l.` }
      ]
    };
  }

  function gen8b() {
    // 4 body — obdélníkový pozemek: obvod + sloupky v rozestupech
    const a = ri(2, 5) * 4, b = ri(3, 6) * 4, obvod = 2 * (a + b), dCm = 40;
    const pocet = obvod * 100 / dCm, naA = a * 100 / dCm, naB = b * 100 / dCm;
    const rozdil = naB - naA;
    const cand = [2, 3, 4, 5].filter(x => pocet % x === 0);
    const skup = cand[ri(0, cand.length - 1)];
    return {
      no: 8, points: 4, title: 'Plot kolem pozemku',
      intro: `Obdélníkový pozemek má rozměry ${a} m × ${b} m. Po celém obvodu jsou ve stejných rozestupech ${dCm} cm sloupky plotu. Celkem je jich ${pocet}.`,
      parts: [
        { key: '8.1', points: 2, prompt: `Vypočítejte v metrech obvod pozemku.`, ans: String(obvod),
          sol: `Obvod obdélníku = 2·(délka + šířka) = 2·(${a} + ${b}) = ${obvod} m.` },
        { key: '8.2', points: 1, prompt: `O kolik víc sloupků připadá na delší stranu (${b} m) než na kratší stranu (${a} m)?`, ans: String(rozdil),
          sol: `Na stranu ${b} m připadá ${naB} sloupků (${b * 100} cm : ${dCm} cm), na stranu ${a} m ${naA} sloupků (${a * 100} cm : ${dCm} cm). Rozdíl: ${naB} − ${naA} = ${rozdil}.` },
        { key: '8.3', points: 1, prompt: `Sloupky se natírají po skupinkách po ${skup}. Kolik skupinek je celkem (${pocet} sloupků)?`, ans: String(pocet / skup),
          sol: `Počet skupinek = ${pocet} : ${skup} = ${pocet / skup}.` }
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
      sol: `Krychle má 12 stejně dlouhých hran: 12 · ${a} = ${hrany} cm. Tvrzení uvádí ${tvrz1} cm — ${tvrz1 === hrany ? 'PRAVDA (A).' : 'NEPRAVDA (N).'}` };
    const tvrz2 = ri(0, 1) ? povrch : povrch + 6 * ri(1, 4);
    const st2 = { text: `Povrch krychle s hranou ${a} cm je ${tvrz2} cm².`, ans: tvrz2 === povrch ? 'A' : 'N',
      sol: `Povrch krychle = 6·a² = 6·${a}² = 6·${a * a} = ${povrch} cm². Tvrzení uvádí ${tvrz2} cm² — ${tvrz2 === povrch ? 'PRAVDA (A).' : 'NEPRAVDA (N).'}` };
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
        `Ve třídě je ${t1.celek} žáků. ${t1.pct} % z nich chodí na kroužek. Kolik žáků chodí na kroužek?`,
        `Výrobek stál ${t2.celek} Kč. Sleva je ${t2.pct} %. O kolik Kč se cena sníží?`,
        `V nádrži je ${t3.celek} litrů vody. Vypustí se ${t3.pct} %. Kolik litrů se vypustí?`
      ],
      options: labels,
      ans: ansLetters,
      sol: [
        `${t1.pct} % z ${t1.celek} = ${t1.pct}/100 · ${t1.celek} = ${t1.cast} žáků.`,
        `${t2.pct} % z ${t2.celek} = ${t2.cast} Kč.`,
        `${t3.pct} % z ${t3.celek} = ${t3.cast} litrů.`
      ]
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
          sol: `Rám přidá ${RAM} cm na obou koncích strany, tedy 2·${RAM} cm: ${L} + 2·${RAM} = ${L} + ${2 * RAM} = ${outL(L)} cm.` },
        { key: '16.2', points: 1, prompt: `Jaký obsah má samotný rám (v cm²)?`, ans: String(frameArea),
          sol: `Obsah celého obrazu i s rámem = ${outL(L)} · ${outL(W)} = ${outL(L) * outL(W)} cm². Obsah samotného obrazu = ${L} · ${W} = ${L * W} cm². Rám = ${outL(L) * outL(W)} − ${L * W} = ${frameArea} cm².` },
        { key: '16.3', points: 1, prompt: `Jiný obraz má kratší stranu ${W3} cm. Jaká je délka celého obrazu i s rámem podél této strany (v cm)?`, ans: String(outL(W3)),
          sol: `Stejně jako v 16.1: ${W3} + 2·${RAM} = ${W3} + ${2 * RAM} = ${outL(W3)} cm.` }
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
        sol: `Nejdřív mocnina a násobení: ${a}² = ${a * a} a ${b} · ${c} = ${b * c}. Pak odečti: ${a * a} − ${b * c} = ${ans}.` }]
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
          prompt: `Vyřešte rovnici a napište kořen x: ${a}x − ${b} = ${c}`,
          ans: String(x1),
          sol: `Přičti ${b} k oběma stranám: ${a}x = ${c} + ${b} = ${c + b}. Vyděl ${a}: x = ${c + b} : ${a} = ${x1}.` },
        { key: '4.2', points: 2, showExplain: true,
          prompt: `Vyřešte rovnici a napište kořen x: x : ${d} + ${e} = ${f}`,
          ans: String(x2),
          sol: `Odečti ${e} od obou stran: x : ${d} = ${f} − ${e} = ${f - e}. Vynásob ${d}: x = ${f - e} · ${d} = ${x2}.` }
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
      prompt: `Krabice tvaru kvádru má rozměry ${a} cm × ${b} cm × ${cc} cm. Kolik krychlových kostek o hraně ${k} cm se do ní přesně vejde?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: `Podél hran se vejde ${a} : ${k} = ${a / k}, ${b} : ${k} = ${b / k} a ${cc} : ${k} = ${cc / k} kostek. Celkem ${a / k} · ${b / k} · ${cc / k} = ${pocet} kostek → odpověď ${sh.correctLetter}. (Kontrola: objem ${a * b * cc} cm³ : ${k}³ = ${a * b * cc} : ${k * k * k} = ${pocet}.)`
    };
  }

  function gen13c() {
    // 2 body — MC, o kolik procent se cena zvýšila
    const stara = ri(1, 9) * 100, p = [10, 20, 25, 50][ri(0, 3)], nova = stara * (1 + p / 100);
    const opts = [p - 5, p, p + 5, p + 10, 'jiná hodnota'];
    const sh = shuffleOpts(opts, p);
    return {
      no: 13, points: 2, title: 'Zdražení', kind: 'mc',
      prompt: `Zboží zdražilo z ${stara} Kč na ${nova} Kč. O kolik procent se cena zvýšila?`,
      options: sh.labels, ans: sh.correctLetter,
      sol: `Zdražení v korunách: ${nova} − ${stara} = ${nova - stara} Kč. Vztaženo k PŮVODNÍ ceně: ${nova - stara} : ${stara} = ${cz((nova - stara) / stara)} = ${p} % → odpověď ${sh.correctLetter}.`
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
      sol: `Seřaď čísla od nejmenšího: ${sorted.join(', ')}. Medián je prostřední (třetí) hodnota: ${med} → odpověď ${sh.correctLetter}.`
    };
  }

  function gen2c() {
    // 3 body — dělení zlomků (stejný jmenovatel) + rozdíl druhých mocnin vzorcem
    const b = ri(3, 9), a = ri(2, 8), c = ri(2, 8);
    const g = gcd(a, c), na = a / g, nc = c / g;
    const ans1 = nc === 1 ? String(na) : `${na}/${nc}`;
    const d = ri(5, 12), e = ri(1, d - 1), ans2 = d * d - e * e;
    return {
      no: 2, points: 3, title: 'Výrazy se zlomky',
      parts: [
        { key: '2.1', points: 1, showExplain: false,
          prompt: `Vypočítejte a zapište zlomkem v základním tvaru: ${a}/${b} : ${c}/${b} =`,
          ans: ans1,
          sol: `Dělení zlomků: ${a}/${b} : ${c}/${b} = ${a}/${b} · ${b}/${c} = ${a}/${c}. ${g === 1 ? `Základní tvar: ${ans1}.` : `Zkrať NSD (${g}): ${ans1}.`}` },
        { key: '2.2', points: 2, showExplain: true,
          prompt: `Vypočítejte pomocí vzorce: (${d} + ${e}) · (${d} − ${e}) =`,
          ans: String(ans2),
          sol: `Vzorec (a+b)(a−b) = a² − b²: (${d}+${e})(${d}−${e}) = ${d}² − ${e}² = ${d * d} − ${e * e} = ${ans2}.` }
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
          sol: `Vzorec (x+a)² = x² + 2ax + a². Koeficient u x je 2a = 2·${a} = ${2 * a}.` },
        { key: '3.2', points: 1, showExplain: true,
          prompt: `Sečtěte členy a napište koeficient u x: ${p}x + ${q}x − ${r}x`,
          ans: String(p + q - r),
          sol: `Sečti koeficienty: ${p} + ${q} − ${r} = ${p + q - r}. Výraz se rovná ${p + q - r}x.` },
        { key: '3.3', points: 2, showExplain: true,
          prompt: `Rozložte na součin pomocí vzorce a napište číslo místo otazníku: x² − ${c * c} = (x − ?)·(x + ?)`,
          ans: String(c),
          sol: `Vzorec a² − b² = (a−b)(a+b). Protože ${c * c} = ${c}², je x² − ${c * c} = (x − ${c})(x + ${c}).` }
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
          sol: `Součet vnitřních úhlů trojúhelníku je 180°: úhel u vrcholu = 180° − 2·${beta}° = ${alpha}°.` },
        { key: '7.2', points: 1, prompt: `Vypočítejte velikost vnějšího úhlu u jednoho z úhlů při základně.`, ans: String(vnejsi),
          sol: `Vnější úhel = 180° − vnitřní = 180° − ${beta}° = ${vnejsi}°.` },
        { key: '7.3', points: 1, prompt: `Jaký je součet obou úhlů při základně?`, ans: String(soucet),
          sol: `Oba úhly při základně jsou ${beta}°, jejich součet = 2 · ${beta}° = ${soucet}°.` }
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
          sol: `Měřítko 1 : ${k} znamená, že 1 cm na modelu = ${k} cm ve skutečnosti. Skutečná výška = ${modelCm} · ${k} = ${realCm} cm = ${realM} m.` }
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
          sol: `Počet konví = objem sudu : objem konve = ${sud} : ${konev} = ${pocet}.` },
        { key: '6.2', points: 1,
          prompt: `Nádrž o objemu ${V} litrů se napouští rychlostí ${rate} litrů za minutu. Za kolik minut bude plná?`,
          ans: String(min),
          sol: `Čas = objem : rychlost = ${V} : ${rate} = ${min} minut.` }
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
          sol: `Obvod obdélníku = 2·(${a} + ${b}) = ${obvod} m.` },
        { key: '8.2', points: 1, prompt: `Metr plotu stojí ${cena} Kč. Kolik Kč stojí celý plot?`, ans: String(celkem),
          sol: `${obvod} m · ${cena} Kč = ${celkem} Kč.` },
        { key: '8.3', points: 1, prompt: `Sloupky jsou rozmístěny po ${d} metrech. Kolik sloupků je po celém obvodu?`, ans: String(sloupky),
          sol: `Počet sloupků = obvod : rozestup = ${obvod} : ${d} = ${sloupky}.` }
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
          sol: `Chodník přidá ${w} m na obou koncích: ${a} + 2·${w} = ${oa} m.` },
        { key: '16.2', points: 1, prompt: `Jaká je celková šířka obrazce (bazén i s chodníkem, v m)?`, ans: String(ob),
          sol: `${b} + 2·${w} = ${ob} m.` },
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
      sol: [
        `1 % je ${t1.cast} : ${t1.p} = ${t1.cast / t1.p}. Celek (100 %) = ${t1.cast / t1.p} · 100 = ${t1.celek}.`,
        `1 % je ${t2.cast} : ${t2.p} = ${t2.cast / t2.p}. Celek = ${t2.celek}.`,
        `1 % je ${t3.cast} : ${t3.p} = ${t3.cast / t3.p}. Celek = ${t3.celek}.`
      ]
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
          sol: `Obsah obdélníku = délka · šířka = ${L} · ${W} = ${area} m².` },
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

  /* ── SLOTY 1–16 ─────────────────────────────────────────────────
     Každá pozice testu je POLE variant (zatím vždy jedna). Pro
     přidání další varianty do pozice N stačí dopsat další funkci do
     SLOTS[N-1] se STEJNÝM tvarem návratové hodnoty (points musí sedět
     na stejné číslo jako ostatní varianty té pozice, jinak se pokazí
     bodový součet 50). generate() při každém spuštění testu náhodně
     vybere jednu variantu z každé pozice.
     ──────────────────────────────────────────────────────────────── */
  const SLOTS = [
    [gen1, gen1b, gen1c], [gen2, gen2b, gen2c], [gen3, gen3b, gen3c], [gen4, gen4b, gen4c], [gen5, gen5b, gen5c], [gen6, gen6b, gen6c], [gen7, gen7b, gen7c], [gen8, gen8b, gen8c],
    [gen9, gen9b, gen9c], [gen10, gen10b, gen10c], [gen11, gen11b, gen11c], [gen12, gen12b, gen12c], [gen13, gen13b, gen13c], [gen14, gen14b, gen14c], [gen15, gen15b, gen15c], [gen16, gen16b, gen16c]
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
