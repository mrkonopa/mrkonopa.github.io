#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   Napojí videa Matýskovy matematiky na teorii 1. stupně (3.–5. ročník).

   PROČ RUČNÍ TABULKA. `tools/data/matyskova-videa.csv` má 3 632 videí,
   ale v názvu nesou JEN „díl / strana / cvičení" — žádné téma. Z těch
   dat se tedy nedá odvodit, které video patří ke které misi; chybějící
   článek je mapování mise → strana učebnice, a to musí dodat člověk.
   Zdrojový web je navíc ze sandboxu nedostupný, takže se témata nedají
   dohledat ani odtud.

   POSTUP:
     1. Vyplň `tools/data/1stupen-videa-mapovani.csv` — sloupce `dil`
        a `strana`. `dil` musí PŘESNĚ odpovídat některé hodnotě ve
        sloupci `dil` souboru s videi (vypíše je `--dily`).
        Řádky, které necháš prázdné, se přeskočí.
     2. `node tools/napoj-videa-1stupen.cjs` (napřed nasucho)
     3. `node tools/napoj-videa-1stupen.cjs --zapsat`

   Vypsaná strana, ke které se nenajde video, je CHYBA a skript skončí
   nenulovým kódem — tichý přeskok by znamenal, že si vyplníš tabulku
   a nic se nestane.
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ZAPSAT = process.argv.includes('--zapsat');

/* Minimální CSV parser — pole mohou být v uvozovkách a obsahovat čárky. */
function csv(text) {
  const out = []; let row = [], pole = '', vUvoz = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (vUvoz) {
      if (c === '"' && text[i + 1] === '"') { pole += '"'; i++; }
      else if (c === '"') vUvoz = false;
      else pole += c;
    } else if (c === '"') vUvoz = true;
    else if (c === ',') { row.push(pole); pole = ''; }
    else if (c === '\n') { row.push(pole); out.push(row); row = []; pole = ''; }
    else if (c !== '\r') pole += c;
  }
  if (pole || row.length) { row.push(pole); out.push(row); }
  return out.filter(r => r.length > 1);
}

const videaRaw = csv(fs.readFileSync(path.join(ROOT, 'tools/data/matyskova-videa.csv'), 'utf8'));
const vh = videaRaw[0];
const videa = videaRaw.slice(1).map(r => Object.fromEntries(vh.map((k, i) => [k, r[i] || ''])));

if (process.argv.includes('--dily')) {
  console.log('Hodnoty sloupce `dil`, které smí být v mapovací tabulce:\n');
  [...new Set(videa.map(v => v.dil))].sort().forEach(d => {
    const n = videa.filter(v => v.dil === d).length;
    console.log(`  ${String(n).padStart(5)}×  ${JSON.stringify(d)}`);
  });
  process.exit(0);
}

const mapRaw = csv(fs.readFileSync(path.join(ROOT, 'tools/data/1stupen-videa-mapovani.csv'), 'utf8'));
const mh = mapRaw[0];
const mapa = mapRaw.slice(1).map(r => Object.fromEntries(mh.map((k, i) => [k, (r[i] || '').trim()])));

/* Ze všech videí dané strany bereme PRVNÍ cvičení — je to úvod k látce. */
const najdi = (dil, strana) => {
  const na = videa.filter(v => v.dil === dil &&
    new RegExp('strana\\s*' + strana + '\\s*,', 'i').test(v.nazev_videa));
  if (!na.length) return null;
  na.sort((a, b) => a.nazev_videa.localeCompare(b.nazev_videa, 'cs'));
  return na[0];
};

let napojeno = 0, preskoceno = 0;
const chyby = [];
const zmeny = { 3: [], 4: [], 5: [] };

for (const r of mapa) {
  if (!r.dil || !r.strana) { preskoceno++; continue; }
  const v = najdi(r.dil, r.strana);
  if (!v) { chyby.push(`${r.rocnik}/${r.mise} „${r.nazev_mise}": pro díl ${JSON.stringify(r.dil)} stranu ${r.strana} není video`); continue; }
  zmeny[r.rocnik].push({ mise: r.mise, id: v.youtube_id, title: `${r.nazev_mise} — ${r.dil}, strana ${r.strana}` });
  napojeno++;
}

console.log(`\nMapování: ${napojeno} misí k napojení, ${preskoceno} nevyplněných, ${chyby.length} chyb.`);
chyby.forEach(c => console.log('  ❌ ' + c));

for (const g of [3, 4, 5]) {
  if (!zmeny[g].length) continue;
  const p = path.join(ROOT, `projects/rpg-learn-${g}.js`);
  let s = fs.readFileSync(p, 'utf8');
  let ok = 0;
  for (const z of zmeny[g]) {
    /* Najdi blok mise a v NĚM první `video: null`. */
    const i = s.search(new RegExp(`['"\`]${z.mise}['"\`]\\s*:`));
    if (i < 0) { chyby.push(`${g}/${z.mise}: mise v rpg-learn-${g}.js není`); continue; }
    const j = s.indexOf('video: null', i);
    if (j < 0) { chyby.push(`${g}/${z.mise}: `+'`video: null` v bloku mise nenalezeno'); continue; }
    const nahrada = `video: { id: '${z.id}', title: ${JSON.stringify(z.title)} }`;
    s = s.slice(0, j) + nahrada + s.slice(j + 'video: null'.length);
    ok++;
  }
  console.log(`  ${g}. ročník: ${ok} / ${zmeny[g].length}`);
  if (ZAPSAT && ok) { fs.writeFileSync(p, s); console.log(`     zapsáno do rpg-learn-${g}.js`); }
}

if (!ZAPSAT) console.log('\n(nasucho — pro zápis přidej --zapsat)');
if (chyby.length) { console.log(`\n${chyby.length} chyb — nic se nepovažuje za hotové.`); process.exit(1); }
process.exit(0);
