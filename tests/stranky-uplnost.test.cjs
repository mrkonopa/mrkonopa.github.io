/* ══════════════════════════════════════════════════════════════════════
   Hlídá, že seznam stránek pro plošné audity pokrývá CELÝ web.

   Proč: podle CLAUDE.md se ručně udržované kopie toho seznamu rozešly
   ČTYŘIKRÁT a pokaždé chyběl celý kus webu — 1. stupeň, goniometrie,
   šest z osmi únikovek, naposled sedm cestovatelských zápisků pod
   rozcestníkem (kryl se rozcestník, ale ne to, kam vede). Pokaždé se
   po doplnění hned našly SKUTEČNÉ vady, takže ta mezera nebyla
   teoretická.

   Zápis „udělej sken ručně" v dokumentaci nestačil — sken se prostě
   neudělal. Proto tenhle test: seznam se porovnává se SKUTEČNÝM obsahem
   repozitáře, ne s jiným seznamem.

   Spusť: node tests/stranky-uplnost.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { ROOT, STRANKY, MIMO, vsechnyHtml } = require('./stranky.cjs');

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { c ? pass++ : (fail++, console.log('  ❌ ' + m + (d ? '\n       ' + d : ''))); };

const vseHtml = vsechnyHtml();
const vSeznamu = new Set(STRANKY.map(p => p.url));
const vyjimky = new Map(MIMO);

console.log('\n── Úplnost seznamu stránek ──\n');

// 1) nic nesmí propadnout: každý .html je buď v seznamu, nebo mezi výjimkami
const chybi = vseHtml.filter(u => !vSeznamu.has(u) && !vyjimky.has(u));
ok(chybi.length === 0,
  `${chybi.length} stránek není ani v seznamu, ani mezi výjimkami`,
  chybi.join('\n       '));

// 2) výjimka na neexistující soubor = hnijící seznam
const mrtve = [...vyjimky.keys()].filter(u => !fs.existsSync(path.join(ROOT, u.slice(1))));
ok(mrtve.length === 0, `${mrtve.length} výjimek míří na neexistující soubor`, mrtve.join(', '));

// 3) každá výjimka musí mít NAPSANÝ důvod (výjimka bez důvodu je jen díra)
const bezDuvodu = MIMO.filter(([, d]) => !d || d.trim().length < 10).map(([u]) => u);
ok(bezDuvodu.length === 0, `${bezDuvodu.length} výjimek nemá uvedený důvod`, bezDuvodu.join(', '));

// 4) seznam nesmí odkazovat na soubor, který už neexistuje
const neexistujici = STRANKY.filter(p => !fs.existsSync(path.join(ROOT, p.url.slice(1)))).map(p => p.url);
ok(neexistujici.length === 0, `${neexistujici.length} položek seznamu míří mimo repozitář`, neexistujici.join(', '));

// 5) žádné duplicity (ani v url, ani v id — id vybírá typ průchodu v layout-overflow)
const dupUrl = STRANKY.map(p => p.url).filter((u, i, a) => a.indexOf(u) !== i);
const dupId = STRANKY.map(p => p.id).filter((u, i, a) => a.indexOf(u) !== i);
ok(dupUrl.length === 0, 'seznam obsahuje duplicitní url', dupUrl.join(', '));
ok(dupId.length === 0, 'seznam obsahuje duplicitní id', dupId.join(', '));

/* 6) Pojistka proti „audit doběhl a nic neviděl": kdyby se změnil způsob
   hledání souborů, chceme to poznat, ne tiše projít nad prázdnou množinou. */
ok(vseHtml.length >= 40, `nalezeno ${vseHtml.length} .html souborů (čekám aspoň 40)`);

console.log(`\n  pokrytí: ${vSeznamu.size} auditovaných + ${vyjimky.size} jmenovitých výjimek = ${vseHtml.length} souborů v repozitáři`);
console.log(`\n  Úplnost seznamu: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
