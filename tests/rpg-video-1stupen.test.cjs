/* ══════════════════════════════════════════════════════════════════
   Videa v teorii — napojení a shoda se zdrojem.

   PROČ ZVLÁŠŤ, když `rpg-learn.test.cjs` už video kontroluje: ta
   kontrola říká jen „je to null, nebo objekt s id a title". To projde
   i tehdy, když je v `id` vymyšlený řetězec nebo když video ukazuje na
   úplně jinou stranu učebnice, než tvrdí titulek. A hlavně prošla celou
   dobu, co mělo 1. stupeň `video: null` u všech 63 misí, zatímco
   6.–9. mělo 82 videí — přesně ten obrácený vzorec, na který tenhle
   repozitář opakovaně doplácí (pavučinový graf atributů, padání
   předmětů, diagramy v teorii).

   DRUHÝ ZDROJ PRAVDY. Titulek nese odkaz do učebnice („… · 8. díl,
   s. 36"). `tools/data/matyskova-videa.csv` nezávisle ví, na které
   straně které YouTube ID leží, a `matyskova-popisky-stran.csv` ví, co
   se na té straně probírá. Kontrola „id je 11 znaků" by sama o sobě
   byla kruh; tady se porovnávají DVA soubory proti třetímu.

   Spusť: node tests/rpg-video-1stupen.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PROJ = path.join(ROOT, 'projects');
const DATA = path.join(ROOT, 'tools', 'data');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

/* ── CSV parser (čárky i středníky, uvozovky) ───────────────────────── */
function parseCsv(text, D) {
  const rows = []; let row = [], val = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { val += '"'; i++; } else q = false; } else val += c; }
    else if (c === '"') q = true;
    else if (c === D) { row.push(val); val = ''; }
    else if (c === '\n') { row.push(val); rows.push(row); row = []; val = ''; }
    else if (c !== '\r') val += c;
  }
  if (val !== '' || row.length) { row.push(val); rows.push(row); }
  const head = rows.shift().map(h => h.replace(/^﻿/, '').trim());
  return rows.filter(r => r.length > 1).map(r => { const o = {}; head.forEach((h, i) => o[h] = (r[i] || '').trim()); return o; });
}

/* ── moduly teorie ──────────────────────────────────────────────────── */
function nactiLearn(g) {
  const src = fs.readFileSync(path.join(PROJ, 'rpg-learn-' + g + '.js'), 'utf8');
  const win = { RPGDia: new Proxy({}, { get: () => () => '' }) };
  new Function('window', src)(win);
  return win['RPG_LEARN_' + g];
}

/* ── kde které video leží (nezávisle na hrách) ───────────────────────── */
const videa = parseCsv(fs.readFileSync(path.join(DATA, 'matyskova-videa.csv'), 'utf8'), ',');
const popisky = parseCsv(fs.readFileSync(path.join(DATA, 'matyskova-popisky-stran.csv'), 'utf8'), ';');
const R_STRANA = /strana\s+(\d+)/i;   // `\s+` kvůli nedělitelné mezeře v 18 titulcích
const KDE = {};                       // youtube_id → { dil, strana }
videa.forEach(v => {
  const m = R_STRANA.exec(v.nazev_videa || '');
  const id = (v.youtube_id || '').trim();
  if (m && id) KDE[id] = { dil: v.dil, strana: +m[1] };
});
const SLUG_DIL = {
  '7-dil': '7. díl', '8-dil': '8. díl', 'geometrie-3': 'Geometrie pro 3. ročník',
  '4-rocnik-1-dil': '4. ročník, 1. díl', '4-rocnik-2-dil': '4. ročník, 2. díl',
  'geometrie-4': 'Geometrie pro 4. ročník', '5-rocnik-1-dil': '5. ročník, 1. díl',
  '5-rocnik-2-dil': '5. ročník, 2. díl', 'geometrie-5': 'Geometrie pro 5. ročník',
};
const TEMA = {};                      // "díl|strana" → téma
popisky.forEach(p => { TEMA[SLUG_DIL[p.dil_slug] + '|' + (+p.strana)] = p.tema; });

/* Titulek zkracuje díl, ať se tlačítko vejde; pro porovnání se zkratka
   rozbalí zpátky na plný název, který zná CSV s videi. */
const rozbalDil = d => d
  .replace(/^Geometrie (\d)$/, 'Geometrie pro $1. ročník')
  .replace(/^(\d)\. roč\., (\d)\. díl$/, '$1. ročník, $2. díl');

console.log('\n── Videa v teorii 1. stupně ──\n');

ok(Object.keys(KDE).length > 3000, 'zdroj videí se načetl (' + Object.keys(KDE).length + ' ID)',
  'ID=' + Object.keys(KDE).length);
ok(Object.keys(TEMA).length > 500, 'zdroj témat se načetl (' + Object.keys(TEMA).length + ' stran)',
  'stran=' + Object.keys(TEMA).length);

let sVideem = 0, bezVidea = [];
const spatnyTvar = [], neexistuje = [], jinaStrana = [], jineTema = [], bezOdkazu = [];

for (const g of [3, 4, 5]) {
  const L = nactiLearn(g);
  const mise = Object.keys(L);
  ok(mise.length === 21, 'g' + g + ' má 21 misí', 'misí=' + mise.length);

  mise.forEach(mid => {
    const v = L[mid].video;
    if (!v) { bezVidea.push(g + '/' + mid); return; }
    sVideem++;

    /* renderer 1. stupně umí `url` i `id`, 2. stupeň JEN `id` — držet
       se `id` je proto jediný tvar, který funguje všude */
    if (typeof v.id !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(v.id)) {
      spatnyTvar.push(g + '/' + mid + ' id=' + JSON.stringify(v.id)); return;
    }
    const kde = KDE[v.id];
    if (!kde) { neexistuje.push(g + '/' + mid + ' id=' + v.id); return; }

    /* titulek končí „ · <díl>, s. <N>" — to je tvrzení, které jde ověřit */
    const m = /·\s*([^·]+),\s*s\.\s*(\d+)\s*$/.exec(v.title || '');
    if (!m) { bezOdkazu.push(g + '/' + mid + ' title=' + JSON.stringify(v.title)); return; }
    const dilT = rozbalDil(m[1].trim()), stranaT = +m[2];
    if (dilT !== kde.dil || stranaT !== kde.strana) {
      jinaStrana.push(g + '/' + mid + ': titulek tvrdí ' + dilT + ' s.' + stranaT +
        ', video leží na ' + kde.dil + ' s.' + kde.strana);
      return;
    }
    /* a téma v titulku musí vycházet z obsahu TÉ strany */
    const tema = (TEMA[kde.dil + '|' + kde.strana] || '').replace(/\s*\[rozšiřující\]\s*/g, '').trim();
    const zacatek = (v.title.split('·')[0] || '').trim().replace(/…$/, '');
    if (!tema || !tema.toLowerCase().startsWith(zacatek.toLowerCase().slice(0, 20))) {
      jineTema.push(g + '/' + mid + ': titulek „' + zacatek + '", obsah učebnice „' + tema + '"');
    }
  });
}

/* Pojistka proti běhu naprázdno: kdyby se moduly nenačetly nebo se
   `video` přejmenovalo, všechny seznamy nálezů zůstanou prázdné a test
   by prošel, aniž by cokoli viděl. */
ok(sVideem === 60, 'zkontrolováno 60 videí (20 na ročník)', 'nalezeno=' + sVideem);
ok(bezVidea.length === 3 && bezVidea.every(x => /7-3$/.test(x)),
  'bez videa zůstávají jen tři finální duely', bezVidea.join(', ') || 'žádná mise bez videa');

ok(spatnyTvar.length === 0, 'všechna videa mají `id` v platném tvaru YouTube', spatnyTvar.slice(0, 3).join(' | '));
ok(neexistuje.length === 0, 'všechna ID existují v datech Matýskovy matematiky', neexistuje.slice(0, 3).join(' | '));
ok(bezOdkazu.length === 0, 'každý titulek uvádí díl a stranu učebnice', bezOdkazu.slice(0, 3).join(' | '));
ok(jinaStrana.length === 0, 'video LEŽÍ na té straně, kterou titulek uvádí', jinaStrana.slice(0, 3).join(' | '));
ok(jineTema.length === 0, 'téma v titulku odpovídá obsahu té strany', jineTema.slice(0, 3).join(' | '));

/* 2. stupeň: renderer tam umí JEN `id`; `url` by dalo „watch?v=undefined" */
let druhyStupen = 0; const urlMisto = [], spatne9 = [];
for (const g of [6, 7, 8, 9]) {
  const L = nactiLearn(g);
  Object.keys(L).forEach(mid => {
    const v = L[mid].video; if (!v) return;
    druhyStupen++;
    if (v.url && !v.id) urlMisto.push(g + '/' + mid);
    else if (!/^[A-Za-z0-9_-]{11}$/.test(v.id || '')) spatne9.push(g + '/' + mid + ' id=' + JSON.stringify(v.id));
  });
}
ok(druhyStupen > 70, '2. stupeň se taky prošel (' + druhyStupen + ' videí)', 'videí=' + druhyStupen);
ok(urlMisto.length === 0, '2. stupeň nemá nikde `url` místo `id` (renderer tam `url` neumí)', urlMisto.join(' | '));
ok(spatne9.length === 0, 'a všechna jeho ID mají platný tvar', spatne9.slice(0, 3).join(' | '));

console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
process.exit(fail ? 1 : 0);
