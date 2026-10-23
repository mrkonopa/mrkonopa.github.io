/* ══════════════════════════════════════════════════════════════════
   Úlohy „najděte všechna řešení“: bodování podle klíčů CERMAT (PZ.hodnotReseni, PZ.vyhodnot)
   a každá taková úloha v bance testu nanečisto.

   PROČ. Ostrá úloha 8 (M9D 2023) a 16.3 (M9B 2023) mají v každé části DVĚ řešení, 7.2 (2025) tři.
   Dřív jsme je zjednodušovali na jedno, aby šel použít jednoodpovědní kontrolor — a žák se tak
   nikdy nepotkal s tím, že se bodují jednotlivá řešení a že chybné číslo bod ubírá. Pravidlo
   „body = správná − chybná, nejméně 0, body úlohy = počet řešení“ je v klíčích těchto testů:
     · M9D 2023 ú. 8, M9B 2023 ú. 16.3, M9D 2026 ú. 16.3: dvě řešení, 2 b.
         obě správná → 2 b.; jedno správné, nebo obě + jedno chybné → 1 b.
     · nanečisto 2026 ú. 8.2: „počet chybných čísel je stejný nebo vyšší než počet správných → 0 b.“
     · M9D 2025 ú. 7.2: tři řešení, 3 b., „za každý nedostatek ztráta 1 b.“
   (Klíče 2023 jsou o kousek mírnější: jedno správné a jedno chybné jim je ještě 1 b. Platí pravidlo
   nejnovějších klíčů, 2026.) Tabulka níže je z těchto klíčů; ne z funkce samotné.
   Spusť: node tests/prijimacky-hodnotreseni.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const JADRO = path.join(ROOT, 'projects', 'prijimacky-matematika', 'prijimacky-core.js');
const BANKA = path.join(ROOT, 'projects', 'rpg-cermat-9.js');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const nactiJadro = src => { const win = {}; new Function('window', src)(win); return win.PZ; };
const ZDROJ_JADRA = fs.readFileSync(JADRO, 'utf8');

/* [správná řešení, zápis žáka, očekávané body, proč] — podle klíčů, ne podle implementace */
const TABULKA = [
  [[6, 10], '6; 10', 2, 'obě správná'],
  [[6, 10], '10, 6', 2, 'pořadí nehraje roli'],
  [[6, 10], '6 a 10', 2, 'spojka „a“'],
  [[6, 10], '6 nebo 10', 2, 'spojka „nebo“ (16.3: „361 nebo 441“)'],
  [[6, 10], '6', 1, 'jen jedno ze dvou správných'],
  [[6, 10], '10', 1, 'jen druhé ze dvou správných'],
  [[6, 10], '6; 10; 7', 1, 'obě správná a k nim právě jedno chybné'],
  [[6, 10], '6; 7', 0, 'jedno správné a jedno chybné (nanečisto 2026: chybných ≥ správných → 0 b.)'],
  [[6, 10], '6; 10; 7; 8', 0, 'obě správná a dvě chybná'],
  [[6, 10], '7; 8', 0, 'jen chybná'],
  [[6, 10], '7', 0, 'jediné číslo, chybné'],
  [[6, 10], '', 0, 'nevyplněno'],
  [[6, 10], 'nevím', 0, 'bez čísla'],
  [[6, 10], '6; 6', 1, 'dvakrát totéž řešení je jedno řešení'],
  [[6, 10], '06; 10', 2, 'nuly před číslem'],
  [[1, 3, 5], '1; 3; 5', 3, 'tři ze tří (2025 ú. 7.2)'],
  [[1, 3, 5], '1; 3', 2, 'chybí jedno řešení (−1 b.)'],
  [[1, 3, 5], '1; 3; 5; 2', 2, 'chybný sudý počet (−1 b.)'],
  [[1, 3, 5], '1; 3; 7', 1, 'chybí 5 a přibylo 7 (−2 b.)'],
  [[1, 3, 5], '2; 4', 0, 'jen chybná'],
  [[361, 441], '361 nebo 441', 2, '16.3 z M9B 2023'],
  // 16.3 z M9D 2026 (klíč: „ani jednou; dvakrát“): jedním z řešení je 0, řady číslic ho musí poznat
  [[0, 2], '0; 2', 2, '16.3 z M9D 2026: nula a dvě'],
  [[0, 2], '2 a 0', 2, 'pořadí s nulou nehraje roli'],
  [[0, 2], '0', 1, 'jen nula ze dvou správných'],
  [[0, 2], '2', 1, 'jen dvojka, nula chybí'],
  [[0, 2], '0; 2; 4', 1, 'nula a dvě a k nim chybné číslo'],
  [[0, 2], '02; 2', 1, '„02“ je číslo 2, takže nula chybí a dvojka je uvedena dvakrát (jako jedna)']
];

function zkus(PZ, popis) {
  const spatne = [];
  TABULKA.forEach(([reseni, zapis, cekej, proc]) => {
    const h = PZ.hodnotReseni(zapis, reseni);
    if (h.body !== cekej) spatne.push('„' + zapis + '“ z [' + reseni + '] dalo ' + h.body + ' b., klíč chce ' + cekej + ' (' + proc + ')');
    if (h.max !== reseni.length) spatne.push('max ' + h.max + ' ≠ počet řešení ' + reseni.length);
  });
  return spatne;
}

console.log('\n── Úlohy s víc řešeními: bodování a banka ──\n');
const PZ = nactiJadro(ZDROJ_JADRA);
{
  const spatne = zkus(PZ);
  ok(spatne.length === 0, 'tabulka z klíčů CERMAT (' + TABULKA.length + ' případů): body sedí', spatne.slice(0, 3).join(' | '));
}
{
  // vyhodnot(): úloha s `reseni` je „ok“ jen při plném počtu, částečně je `castecne`; ostatní jde přes check()
  const it = { ans: '6; 10', reseni: ['6', '10'] };
  const a = PZ.vyhodnot('6; 10', it), b = PZ.vyhodnot('6', it), c = PZ.vyhodnot('7', it), d = PZ.vyhodnot('42', { ans: '42' }), e = PZ.vyhodnot('41', { ans: '42' });
  ok(a.ok && !a.castecne && a.body === 2, 'vyhodnot: obě řešení → ok, ne částečně');
  ok(!b.ok && b.castecne && b.body === 1 && b.chybi === 1 && b.chybne === 0, 'vyhodnot: jedno ze dvou → ne ok, částečně, jedno chybí');
  ok(!c.ok && !c.castecne && c.body === 0, 'vyhodnot: jen chybné → ani částečně');
  ok(d.ok && !d.castecne && e.ok === false, 'vyhodnot: úloha bez `reseni` se hodnotí jako dřív (check)');
  ok(/Máš 1 z 2/.test(PZ.popisCastecne(b)) && /navíc je chybné/.test(PZ.popisCastecne(PZ.vyhodnot('6; 10; 7', it))), 'popisCastecne říká, co chybí a co přebývá');
}

/* ── Každá úloha s víc řešeními v bance: body = počet řešení, odpověď = řešení, čísla celá ── */
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, o, f, m) => (n === 1 ? o : (n >= 2 && n <= 4 ? f : m));
['svgTriangle', 'svgLineGraph', 'svgCylinder', 'svgCone', 'svgSphere', 'svgSimilar', 'svgCuboid', 'svgSloupce', 'svgTezitko'].forEach(f => { global[f] = () => '<svg></svg>'; });
const nactiBanku = src => { const win = {}; new Function('window', src)(win); return win.RPG_CERMAT_9; };
function auditBanky(C) {
  const chyby = [], nalezeno = {};
  const chyba = m => { if (chyby.length < 6 && !chyby.includes(m)) chyby.push(m); };
  for (let poz = 0; poz < 16; poz++) {
    for (let i = 0; i < 400; i++) {
      let t; try { t = C.genSlot(poz); } catch (e) { continue; }
      (t.parts || []).forEach(p => {
        if (p.reseni === undefined) return;
        const klic = t.title + ' ' + p.key; nalezeno[klic] = (nalezeno[klic] || 0) + 1;
        if (!Array.isArray(p.reseni) || p.reseni.length < 2) { chyba(klic + ': `reseni` musí být pole aspoň dvou řešení'); return; }
        if (!p.reseni.every(x => /^(0|[1-9]\d*)$/.test(String(x)))) chyba(klic + ': řešení musí být celá nezáporná čísla bez nul na začátku (' + p.reseni + '; 0 smí být, ostrý klíč M9D/2026 ú. 16.3 má „ani jednou“)');
        if (new Set(p.reseni.map(String)).size !== p.reseni.length) chyba(klic + ': řešení se opakují (' + p.reseni + ')');
        if (p.points !== p.reseni.length) chyba(klic + ': body ' + p.points + ' ≠ počet řešení ' + p.reseni.length + ' (bodování „správná − chybná“ to předpokládá)');
        const srov = p.reseni.map(Number).sort((a, b) => a - b).join('; ');
        if (String(p.ans) !== srov) chyba(klic + ': zobrazená odpověď „' + p.ans + '“ ≠ řešení seřazená „' + srov + '“');
        if (!/obě řešení/i.test(p.prompt)) chyba(klic + ': zadání neříká, že se hledají obě řešení');
        if (PZ.hodnotReseni(p.ans, p.reseni).body !== p.points) chyba(klic + ': vlastní odpověď „' + p.ans + '“ nedostane plný počet bodů');
      });
    }
  }
  return { chyby, nalezeno };
}
{
  const A = auditBanky(nactiBanku(fs.readFileSync(BANKA, 'utf8')));
  const klice = Object.keys(A.nalezeno);
  ok(A.chyby.length === 0, 'banka: každá část s víc řešeními má body = počet řešení, shodnou odpověď a zadání „obě řešení“', A.chyby.join(' | '));
  // pojistka proti slepému auditu: musí se vidět aspoň 3 části (8.1, 8.2 a 16.3), každá stovkykrát
  ok(klice.length >= 3 && klice.every(k => A.nalezeno[k] >= 20), 'banka: audit viděl ' + klice.length + ' částí s víc řešeními (' + klice.map(k => k + ' ' + A.nalezeno[k] + '×').join(', ') + ')');
}

/* ── Sabotáže: pravidlo i audit musí něco chytit ── */
{
  const sab = [
    ['chybné číslo bod neubírá', 'Math.max(0, spravne - chybne)', 'spravne'],
    ['chybné číslo bod ubírá dvojnásobně', 'Math.max(0, spravne - chybne)', 'Math.max(0, spravne - 2 * chybne)'],
    ['pořadí čísel hraje roli', "const dano = new Set((String(raw == null ? '' : raw).match(/\\d+/g) || []).map(cislo));", "const dano = new Set((String(raw == null ? '' : raw).match(/\\d+/g) || []).slice(0, spravna.size).map(cislo));"],
    ['nuly před číslem se nesrovnají', 'const cislo = x => String(Number(x));', 'const cislo = x => String(x);']
  ];
  sab.forEach(([popis, hledej, nahrad]) => {
    const pocet = ZDROJ_JADRA.split(hledej).length - 1;
    ok(pocet === 1, 'sabotáž pravidla „' + popis + '“ se aplikovala (' + pocet + '× nalezeno)');
    if (pocet !== 1) return;
    const s = zkus(nactiJadro(ZDROJ_JADRA.replace(hledej, () => nahrad)));
    ok(s.length > 0, 'sabotáž pravidla „' + popis + '“ je chycena (' + (s[0] || '').slice(0, 80) + ')', 'tabulka z klíčů prošla i nad rozbitým pravidlem');
  });
  const ZB = fs.readFileSync(BANKA, 'utf8');
  [
    ['16.3 má jedno řešení v `ans`', "ans: `${(2 * q - 1) ** 2}; ${(2 * q + 1) ** 2}`", "ans: `${(2 * q - 1) ** 2}`"],
    ['8.x má body 3 místo 2', "points: 2, prompt: `Určete číslo čtverce, jehož odebráním vznikne z útvaru ${kdo}", "points: 3, prompt: `Určete číslo čtverce, jehož odebráním vznikne z útvaru ${kdo}"],
    ['zadání 8.x nežádá obě řešení', ' Najděte obě řešení.`,\n      ans: `${u.X}; ${u.X2}`', '`,\n      ans: `${u.X}; ${u.X2}`'],
    ['16.3 má v `reseni` desetinné číslo', "reseni: [String((2 * q - 1) ** 2), String((2 * q + 1) ** 2)]", "reseni: [String((2 * q - 1) ** 2), String((2 * q + 1) ** 2) + '.5']"]
  ].forEach(([popis, hledej, nahrad]) => {
    const pocet = ZB.split(hledej).length - 1;
    ok(pocet === 1, 'sabotáž banky „' + popis + '“ se aplikovala (' + pocet + '× nalezeno)');
    if (pocet !== 1) return;
    const A = auditBanky(nactiBanku(ZB.replace(hledej, () => nahrad)));
    ok(A.chyby.length > 0, 'sabotáž banky „' + popis + '“ je chycena (' + (A.chyby[0] || '').slice(0, 80) + ')', 'audit banky prošel i nad rozbitou bankou');
  });
}

console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
