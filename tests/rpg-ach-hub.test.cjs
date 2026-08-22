/* ══════════════════════════════════════════════════════════════════════
   Zrcadlo odznaků v HUBu musí sedět s ACH ve hrách.

   PROČ tenhle test vznikl. Do všech sedmi her se přidaly čtyři odznaky
   (živý souboj a oživení hvězdou), ale do zrcadla v `rpg-matematika.html`
   ne. Hub pak počítal „X/15" místo „X/19" a čtyři skutečně získané
   odznaky se v souhrnu napříč ročníky VŮBEC neukázaly. Nikde to nespadlo:
   `ACH.filter(a => allAch[a.id])` chybějící ID prostě přeskočí.

   Druhá věc, kterou hlídá: názvy v hubu musí být NEUTRÁLNÍ. Hub agreguje
   přes všechny ročníky, takže tematické jméno jednoho z nich je pro
   ostatní špatně. Dřív tu byly názvy z 9. ročníku (NULL_BYTE), takže
   třeťák viděl u svého lesního odznaku „ROOT přístup" místo „Pán lesa".
   Test proto zakazuje, aby se název v hubu shodoval s tematickým názvem
   kteréhokoli ročníku — kromě těch, které jsou stejné ve VŠECH sedmi
   (ty tematické nejsou, např. „Trenér" nebo „Mistr tématu").

   Spusť: node tests/rpg-ach-hub.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const ROCNIKY = [3, 4, 5, 6, 7, 8, 9];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

/* Vytáhne pole ACH ze zdrojáku — počítá závorky, aby se netrefilo do
   vnořeného pole. */
function achBlok(txt) {
  const m = /const ACH\s*=\s*\[/.exec(txt);
  if (!m) return null;
  let d = 1, i = m.index + m[0].length;
  while (d > 0 && i < txt.length) { if (txt[i] === '[') d++; else if (txt[i] === ']') d--; i++; }
  return txt.slice(m.index + m[0].length, i - 1);
}
const polozky = blok => [...blok.matchAll(/id:\s*'([^']+)'[\s\S]{0,140}?nm:\s*'([^']+)'/g)]
  .map(m => ({ id: m[1], nm: m[2] }));

console.log('\n── Odznaky: hub vs hry ──\n');

const hub = polozky(achBlok(fs.readFileSync(path.join(ROOT, 'projects/rpg-matematika.html'), 'utf8')) || '');
ok(hub.length > 0, 'zrcadlo ACH v hubu se našlo');

const hry = {};
for (const g of ROCNIKY) {
  const b = achBlok(fs.readFileSync(path.join(ROOT, `projects/rpg-mat-${g}.html`), 'utf8'));
  ok(!!b, `g${g}: pole ACH se našlo`);
  hry[g] = b ? polozky(b) : [];
  ok(hry[g].length > 0, `g${g}: má nenulový počet odznaků (${hry[g].length})`);
}

/* ── 1. hub zná každý odznak ze hry ─────────────────────────────────── */
const idHub = new Set(hub.map(a => a.id));
for (const g of ROCNIKY) {
  const chybi = hry[g].map(a => a.id).filter(id => !idHub.has(id));
  ok(chybi.length === 0, `g${g}: hub zná všechny odznaky téhle hry`, chybi.join(', '));
}

/* ── 2. hub nemá odznak navíc (jinak by čítač lhal opačným směrem) ──── */
{
  const vsechny = new Set(ROCNIKY.flatMap(g => hry[g].map(a => a.id)));
  const navic = hub.map(a => a.id).filter(id => !vsechny.has(id));
  ok(navic.length === 0, 'hub nemá odznak, který v žádné hře není', navic.join(', '));
  ok(hub.length === vsechny.size,
    `počet v hubu odpovídá hrám (${hub.length} vs ${vsechny.size})`);
}

/* ── 3. názvy v hubu jsou neutrální, ne tematické ───────────────────── */
{
  /* Název je tematický, když ho používá JEN NĚKTERÝ ročník. Když ho mají
     všechny (Trenér, Mistr tématu…), tematický není a smí se převzít. */
  const spolecne = new Set();
  for (const a of hry[3]) {
    if (ROCNIKY.every(g => (hry[g].find(x => x.id === a.id) || {}).nm === a.nm)) spolecne.add(a.nm);
  }
  const prohresky = [];
  for (const a of hub) {
    for (const g of ROCNIKY) {
      const h = hry[g].find(x => x.id === a.id);
      if (h && h.nm === a.nm && !spolecne.has(a.nm)) { prohresky.push(`${a.id}: „${a.nm}" je název z g${g}`); break; }
    }
  }
  ok(prohresky.length === 0,
    'názvy v hubu nejsou převzaté z jednoho ročníku', prohresky.slice(0, 4).join(' | '));
  ok(spolecne.size > 0, `některé názvy jsou shodné napříč ročníky, ty se převzít smí (${spolecne.size})`);
}

/* ── 4. tematické odznaky se mezi ročníky nesmí opakovat ────────────
   Osm odznaků je vázaných na téma hry (první úkol, kritický zásah,
   combo, mise bez nápovědy, rychlá odpověď, první oblast, půlka hry,
   všech sedm oblastí). Ty musí mít každý ročník vlastní — 6., 7. i 8.
   ročník totiž měly doslova opsané cyberpunkové názvy z devítky, takže
   Vesmírná expedice odměňovala „ROOT přístupem" a Ztracený chrám
   „Insiderem". Je to týž vzorec jako u ATTR_META v 1. stupni.

   Zbylých jedenáct (Level 5, Trenér, Návyk, souboje…) tematické NENÍ
   a shodovat se smí — proto se kontrolují jen ty tematické. */
{
  const TEMATICKE = ['boot', 'crit', 'combo5', 'flawless', 'flash', 'area1', 'root'];
  for (const id of TEMATICKE) {
    const jmena = ROCNIKY.map(g => (hry[g].find(x => x.id === id) || {}).nm);
    const kolize = jmena.map((n, i) => ({ n, g: ROCNIKY[i] }))
      .filter((a, i, p) => p.findIndex(b => b.n === a.n) !== i);
    ok(kolize.length === 0, `odznak „${id}" má v každém ročníku vlastní název`,
      kolize.map(k => `g${k.g}: ${k.n}`).join(', '));
  }
}

console.log(`\n  Odznaky hub vs hry: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
