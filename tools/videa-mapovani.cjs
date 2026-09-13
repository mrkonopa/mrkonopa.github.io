#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   Generátor klikacího nástroje pro mapování MISE → VIDEO (1. stupeň).

   PROČ VŮBEC: rpg-learn-3/4/5.js má `video: null` u všech 63 misí,
   zatímco 2. stupeň má 82 videí. Menší dítě přitom z videa vytěží víc
   než deváťák. Data v repozitáři leží — tools/data/matyskova-videa.csv
   má 3 632 videí s dílem, stranou i YouTube ID — ale chybí článek
   mise → strana učebnice, a ten je pedagogické rozhodnutí.

   PROČ NE ČISTÝ AUTOMAT: názvy videí NEOBSAHUJÍ TÉMA. Změřeno na všech
   3 632: jsou to čistě „Matýskova matematika, 4. díl, strana 24,
   cvičení 1a", takže podle čeho hledat „zaokrouhlování" tam není nic.
   Chybějící rozměr dodávají popisky stran (matyskova-popisky-stran.csv,
   567 stran s tématem, napojeno na videa 1 : 1). Z nich nástroj VYROBÍ
   NÁVRH — shoda názvu mise a tématu strany po slovních základech — ale
   vybírá pořád člověk. Strojově odvozená pedagogika je v tomhle
   repozitáři doložený zdroj chyb a návrh se umí splést srozumitelně:
   „Dělení bez zbytku" mu sedne na „Dělení se zbytkem" (společné slovo,
   opačné téma) a „Souřadnice a síť" na „Síť krychle".

   Výstup: tools/videa-mapovani.html — JEDEN soubor s daty uvnitř,
   takže se dá otevřít dvojklikem z Windows (žádný server, žádné fetch
   přes file://, které Chrome blokuje).

   Spusť: node tools/videa-mapovani.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSV_VIDEA = path.join(ROOT, 'tools/data/matyskova-videa.csv');
const CSV_MISE = path.join(ROOT, 'tools/data/1stupen-videa-mapovani.csv');
const CSV_POPISKY = path.join(ROOT, 'tools/data/matyskova-popisky-stran.csv');
/* výstup jde přepsat argumentem, aby test mohl generovat do dočasného
   souboru a porovnat ho s tím zapsaným v repozitáři (hlídání rozjetí) */
const OUT = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'tools/videa-mapovani.html');

/* ── CSV parser, který zvládne uvozovky a čárky uvnitř polí ────────
   Názvy videí čárky OBSAHUJÍ („…, 4. díl, strana 24…"), takže dělit
   na `split(',')` by rozsekalo řádek na kusy. */
function parseCsv(text, delim) {
  const D = delim || ',';
  const rows = [];
  let row = [], val = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { val += '"'; i++; } else q = false; }
      else val += c;
    } else if (c === '"') q = true;
    else if (c === D) { row.push(val); val = ''; }
    else if (c === '\n') { row.push(val); rows.push(row); row = []; val = ''; }
    else if (c !== '\r') val += c;
  }
  if (val !== '' || row.length) { row.push(val); rows.push(row); }
  const head = rows.shift().map(h => h.replace(/^﻿/, '').trim());
  return rows.filter(r => r.length > 1).map(r => {
    const o = {}; head.forEach((h, i) => { o[h] = (r[i] || '').trim(); }); return o;
  });
}

const videa = parseCsv(fs.readFileSync(CSV_VIDEA, 'utf8'));
const mise = parseCsv(fs.readFileSync(CSV_MISE, 'utf8'));
/* Popisky stran jsou oddělené STŘEDNÍKEM, protože samotná témata čárky
   obsahují („Orientace na číselné ose; jednotky, desítky"). */
const popisky = parseCsv(fs.readFileSync(CSV_POPISKY, 'utf8'), ';');

/* slug z popisků → přesný název dílu, jak ho zná CSV s videi.
   Ověřeno měřením: po tomhle mapování má popisek i video 567 z 567
   stran, tedy 100 %. Kdyby se některý název rozešel, generátor to
   níž zjistí a spadne — tichá mezera by znamenala díl bez témat. */
const SLUG_DIL = {
  '7-dil': '7. díl',
  '8-dil': '8. díl',
  'geometrie-3': 'Geometrie pro 3. ročník',
  '4-rocnik-1-dil': '4. ročník, 1. díl',
  '4-rocnik-2-dil': '4. ročník, 2. díl',
  'geometrie-4': 'Geometrie pro 4. ročník',
  '5-rocnik-1-dil': '5. ročník, 1. díl',
  '5-rocnik-2-dil': '5. ročník, 2. díl',
  'geometrie-5': 'Geometrie pro 5. ročník'
};

/* ── z názvu vytáhni stranu a cvičení ─────────────────────────────── */
/* `\s+`, ne jedna mezera: 18 titulků má za slovem „strana" nedělitelnou
   mezeru (U+00A0). S literálním ' ' by tiše vypadly z nabídky. */
const R_STRANA = /strana\s+(\d+)/i;
const R_CVICENI = /cvičení\s+(.+?)\s*$/i;

const dily = [];
const zaznamy = [];   // [dilIndex, strana, youtube_id, cviceni]
let bezStrany = 0;

videa.forEach(v => {
  const m = R_STRANA.exec(v.nazev_videa || '');
  if (!m) { bezStrany++; return; }
  const id = (v.youtube_id || '').trim();
  if (!id) { bezStrany++; return; }
  let di = dily.indexOf(v.dil);
  if (di < 0) { dily.push(v.dil); di = dily.length - 1; }
  const cv = (R_CVICENI.exec(v.nazev_videa || '') || [, ''])[1] || '';
  zaznamy.push([di, parseInt(m[1], 10), id, cv]);
});

/* ── pojistka proti běhu naprázdno ────────────────────────────────
   Kdyby se změnil tvar CSV, generátor by tiše vyrobil prázdný
   nástroj a vypadalo by to, že je hotovo. */
if (zaznamy.length < 3000) {
  console.error('❌ Z CSV se načetlo jen ' + zaznamy.length + ' videí (čekáno 3000+). Změnil se tvar souboru?');
  process.exit(1);
}
if (mise.length !== 63) {
  console.error('❌ Misí načteno ' + mise.length + ', čekáno 63 (3 ročníky × 21).');
  process.exit(1);
}

const MISE = mise.map(m => ({
  r: m.rocnik, id: m.mise, nm: m.nazev_mise,
  dil: m.dil || '', strana: m.strana || '', pozn: m.poznamka || ''
}));

const stranPerDil = {};
zaznamy.forEach(([di, s]) => { (stranPerDil[di] = stranPerDil[di] || new Set()).add(s); });

/* ── témata stran a ročník dílu ───────────────────────────────────── */
const TEMATA = {};      // "dilIndex|strana" → téma
const DIL_ROCNIK = {};  // dilIndex → '3' | '4' | '5'
let bezDilu = 0, mimoVidea = 0;
popisky.forEach(p => {
  const nazev = SLUG_DIL[p.dil_slug];
  if (!nazev) { bezDilu++; return; }
  const di = dily.indexOf(nazev);
  if (di < 0) { mimoVidea++; return; }
  DIL_ROCNIK[di] = p.rocnik;
  TEMATA[di + '|' + parseInt(p.strana, 10)] = p.tema;
});

/* Tichá mezera by tu byla nejhorší: díl bez témat vypadá v nástroji
   úplně normálně, jen se u něj nedá nic najít. */
if (bezDilu || mimoVidea) {
  console.error('❌ Popisky se nepodařilo napojit: ' + bezDilu + ' neznámých slugů, ' +
    mimoVidea + ' dílů chybí v CSV s videi. Zkontroluj SLUG_DIL.');
  process.exit(1);
}
const temPocet = Object.keys(TEMATA).length;
if (temPocet < 500) {
  console.error('❌ Témat napojeno jen ' + temPocet + ' (čekáno 500+).');
  process.exit(1);
}

console.log('Načteno: ' + zaznamy.length + ' videí · ' + dily.length + ' dílů · ' + MISE.length + ' misí');
console.log('Bez použitelné strany nebo ID: ' + bezStrany);
console.log('Popisků stran napojeno: ' + temPocet + ' · dílů s ročníkem: ' + Object.keys(DIL_ROCNIK).length);
dily.forEach((d, i) => {
  const s = [...(stranPerDil[i] || [])].sort((a, b) => a - b);
  console.log('  ' + String(i).padStart(2) + '  ' + d.padEnd(26) + s.length + ' stran (' + s[0] + '–' + s[s.length - 1] + ')');
});

const html = `<meta charset="utf-8">
<title>Mapování videí — 1. stupeň</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap" rel="stylesheet">
<style>
 /* Barvy jsou ZMĚŘENÉ, ne vybrané od oka: každá, kterou se někde píše text,
    má proti VŠEM pozadím nástroje (#fff, #fffaf4, #fff8ec, #e9f6ee, #e4edfb)
    poměr jasu aspoň 4,5 (WCAG AA pro běžný text). Původní sada ho neměla —
    --warn 3,39 · --ok 3,75 · --accent 4,14 · --muted 4,37 — a bylo to na
    nástroji vidět. Hlídá tests/videa-mapovani.test.cjs. */
 :root{--bg:#f6f7f9;--panel:#fff;--line:#dfe3e8;--text:#1e2430;--muted:#616a78;--accent:#2b63bb;--ok:#17743f;--warn:#9c560c}
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);color:var(--text);
      font-family:'Lexend','Inter','Segoe UI',system-ui,-apple-system,Arial,sans-serif;font-size:14px}
 header{background:var(--panel);border-bottom:1px solid var(--line);padding:12px 18px;
        display:flex;align-items:center;gap:14px;flex-wrap:wrap;position:sticky;top:0;z-index:5}
 h1{font-size:16px;margin:0;font-weight:700}
 .stav{color:var(--muted);font-size:13px}
 #navod{background:#fff8ec;border-bottom:1px solid #f0dcc0;padding:12px 18px;font-size:13.5px;line-height:1.55}
 #navod.skryty{display:none}
 #navod .nadpis{font-weight:700;margin-bottom:6px;color:var(--warn);letter-spacing:.3px}
 #navod ol{margin:0;padding-left:20px}
 #navod li{margin-bottom:4px}
 #navod .pozn{margin-top:8px;color:var(--muted);font-size:12.5px}
 #navod .zn{display:inline-block;min-width:16px;text-align:center;font-weight:700}
 #navod .zn.ok{color:var(--ok)}
 #navod .tip{color:var(--warn);font-weight:600}
 .wrap{display:grid;grid-template-columns:300px 1fr;gap:16px;padding:16px;align-items:start}
 @media(max-width:860px){.wrap{grid-template-columns:1fr}}
 .karta{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px}
 .mise{max-height:calc(100vh - 130px);overflow:auto}
 .rocnik{font-weight:700;color:var(--muted);font-size:12px;letter-spacing:.6px;
         margin:12px 0 6px;text-transform:uppercase}
 .rocnik:first-child{margin-top:0}
 .m{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;line-height:1.35}
 .m:hover{background:#eef2f7}
 .m.on{background:#e4edfb;outline:1px solid var(--accent)}
 .m .kod{font-variant-numeric:tabular-nums;color:var(--muted);font-size:12px;min-width:26px}
 .m .zn{margin-left:auto;font-size:13px}
 .m.hot .zn{color:var(--ok)}
 h2{font-size:15px;margin:0 0 4px}
 .podnadpis{color:var(--muted);font-size:13px;margin-bottom:12px}
 label{display:block;font-size:12px;color:var(--muted);margin:12px 0 4px;font-weight:600}
 select,input[type=text],textarea{width:100%;padding:7px 9px;border:1px solid var(--line);border-radius:6px;
        font:inherit;font-size:13px;background:#fff;color:var(--text)}
 textarea{min-height:70px;resize:vertical;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}
 .mrizka{display:grid;grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:4px;margin-top:6px}
 .s{border:1px solid var(--line);border-radius:5px;background:#fff;padding:5px 2px;cursor:pointer;
    text-align:center;font:inherit;font-size:12px;font-variant-numeric:tabular-nums;line-height:1.2}
 .s:hover{border-color:var(--accent)}
 .s .p{display:block;font-size:10px;color:var(--muted)}
 .s.on{background:var(--accent);border-color:var(--accent);color:#fff}
 .s.on .p{color:#dce8fb}
 input[type=checkbox]{width:auto;margin:0}
 .navrh{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px dashed var(--warn);
        border-radius:6px;margin-top:5px;cursor:pointer;background:#fffaf4}
 .navrh:hover{border-style:solid}
 .navrh.on{background:#e9f6ee;border-color:var(--ok);border-style:solid}
 .vid{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--line);
      border-radius:6px;margin-top:5px;cursor:pointer;background:#fff}
 .vid:hover{border-color:var(--accent)}
 .vid.on{background:#e9f6ee;border-color:var(--ok)}
 .vid a{margin-left:auto;color:var(--accent);font-size:12px}
 .btn{padding:7px 13px;border:1px solid var(--line);border-radius:6px;background:#fff;cursor:pointer;
      font:inherit;font-size:13px;font-weight:600}
 .btn.p{background:var(--accent);border-color:var(--accent);color:#fff}
 .btn:disabled{opacity:.5;cursor:default}
 .empty{color:var(--muted);font-style:italic;padding:10px 0}
 details{margin-top:14px;border-top:1px solid var(--line);padding-top:10px}
 summary{cursor:pointer;font-size:13px;font-weight:600;color:var(--muted)}
 .radek{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
</style>
<header>
 <h1>Mapování videí — 1. stupeň</h1>
 <span class="stav" id="stav"></span>
 <span style="margin-left:auto;display:flex;gap:8px">
  <button class="btn" id="b-navod">? Návod</button>
  <button class="btn" id="b-export">⬇ Export CSV</button>
  <button class="btn" id="b-import">⬆ Import CSV</button>
 </span>
</header>
<div id="navod">
 <div class="nadpis">Jak na to — tři kroky u každé mise</div>
 <ol>
  <li><b>Vlevo klikni na misi.</b> <span class="zn">—</span> ještě nemá video,
      <span class="zn ok">✓</span> už má. Pořadí je jedno, můžeš skákat.</li>
  <li><b>Vyber stranu učebnice.</b> Buď klikni na některý z <span class="tip">oranžových návrhů</span>
      (nástroj je odvodil z tématu strany — <i>umí se splést</i>, tak je ověř), nebo si vyber
      díl a v mřížce stranu. Číslo nahoře je strana, číslo dole počet videí;
      <b>po najetí myší se ukáže téma té strany</b>.</li>
  <li><b>Klikni na konkrétní cvičení.</b> Tím je mise hotová. Přes „otevřít ▸" si video
      pustíš na YouTube, jestli si chceš ověřit, že sedí.</li>
 </ol>
 <div class="pozn">
  <b>Nemusíš to dodělat naráz</b> — rozdělaná práce se ukládá v prohlížeči, klidně zavři okno.
  Na konci dej <b>⬇ Export CSV</b> a pošli mi ten soubor; napojím videa do hry.
  Díly se nabízejí jen pro ročník té mise; zaškrtávátkem si zobrazíš všech 15.
  <b>Bez návrhu: <span id="bez-navrhu">?</span> misí</b> (hlavně „Finální duel" — boss nemá jedno
  téma) — těm stranu vyber ručně, nebo je nech prázdné.
 </div>
</div>
<div class="wrap">
 <div class="karta mise" id="seznam"></div>
 <div class="karta" id="detail"></div>
</div>
<script>
const DILY = ${JSON.stringify(dily)};
const Z = ${JSON.stringify(zaznamy)};
const MISE = ${JSON.stringify(MISE)};
const TEMATA = ${JSON.stringify(TEMATA)};
const DIL_ROCNIK = ${JSON.stringify(DIL_ROCNIK)};
const KLIC = 'MATYSKA_MAPOVANI';

/* strany a videa podle dílu — spočítá se jednou */
const PODLE = {};
Z.forEach(([d, s, id, cv]) => {
  (PODLE[d] = PODLE[d] || {});
  (PODLE[d][s] = PODLE[d][s] || []).push({ id, cv });
});

function tema(di, s) { return TEMATA[di + '|' + s] || ''; }

/* ── NÁVRH STRAN ───────────────────────────────────────────────────
   Témata stran jsou konkrétní („Násobení a dělení čísly 2, 3"), názvy
   misí obecnější („Malá násobilka"), takže se shoda hledá po slovních
   ZÁKLADECH, ne po celých slovech — čeština by jinak „násobení" a
   „násobilku" považovala za dvě různá slova. Základ = prvních pět
   znaků bez diakritiky, což pokryje ohýbání i odvozeniny.

   Je to NÁVRH, ne rozhodnutí: v nástroji je označený jako návrh a
   nic nevybírá za tebe. Strojově odvozená pedagogika je v tomhle
   repozitáři doložený zdroj chyb, tak ať je vidět, čí je to volba. */
const STOP = new Set(['a','i','do','na','se','po','pro','ale','nebo','jak','kde','tak','pak','aby']);
function zaklady(txt) {
  return [...new Set(String(txt || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(w => w.length >= 3 && !STOP.has(w))
    .map(w => w.slice(0, 5)))];
}
/* Váha slova = jak je vzácné. Bez toho táhne skóre obyčejné „čísla",
   které je skoro v každém tématu, a u mise „Čísla do 1000" pak vyjdou
   jako nejlepší návrhy čtyři strany o násobení nulami. Slovo, které je
   ve víc než pětině témat ročníku, tedy skoro nic neříká a váží málo. */
const VAHY = {};
function spocitejVahy() {
  const perRoc = {};
  Object.keys(PODLE).forEach(di => {
    const r = String(DIL_ROCNIK[di] || '');
    if (!r) return;
    (perRoc[r] = perRoc[r] || []);
    Object.keys(PODLE[di]).forEach(s => { const t = tema(di, s); if (t) perRoc[r].push(t); });
  });
  Object.keys(perRoc).forEach(r => {
    const temata = perRoc[r], vyskyt = {};
    temata.forEach(t => zaklady(t).forEach(z => { vyskyt[z] = (vyskyt[z] || 0) + 1; }));
    VAHY[r] = {};
    Object.keys(vyskyt).forEach(z => {
      const podil = vyskyt[z] / temata.length;
      VAHY[r][z] = podil > 0.20 ? 0.15 : 1;   // běžné slovo: skoro nic neváží
    });
  });
}
function skore(nazevMise, temaStrany, rocnik) {
  const a = zaklady(nazevMise), b = new Set(zaklady(temaStrany));
  if (!a.length || !b.size) return 0;
  const w = VAHY[String(rocnik)] || {};
  let shoda = 0, celkem = 0;
  a.forEach(z => { const v = (w[z] === undefined ? 1 : w[z]); celkem += v; if (b.has(z)) shoda += v; });
  return celkem ? shoda / celkem : 0;
}
function navrhy(m, limit) {
  const out = [];
  Object.keys(PODLE).forEach(di => {
    if (String(DIL_ROCNIK[di] || '') !== String(m.r)) return;
    Object.keys(PODLE[di]).forEach(s => {
      const t = tema(di, s);
      const sc = skore(m.nm, t, m.r);
      if (sc > 0) out.push({ di: +di, s: +s, t, sc });
    });
  });
  out.sort((x, y) => y.sc - x.sc || x.di - y.di || x.s - y.s);
  /* Totéž téma bývá na několika stranách po sobě. Ukázat ho čtyřikrát
     znamená vyplýtvat čtyři ze šesti míst — nabídne se jednou, a to ta
     strana s nejvyšším skóre (při shodě první v pořadí). */
  const videno = new Set(), uniq = [];
  for (const n of out) {
    if (videno.has(n.t)) continue;
    videno.add(n.t); uniq.push(n);
    if (uniq.length >= (limit || 8)) break;
  }
  return uniq;
}

let STAV = {};      // "rocnik/mise" → {dil, strana, id, cv, pozn}
let vybrana = 0;

function nacti() {
  try { STAV = JSON.parse(localStorage.getItem(KLIC) || '{}') || {}; } catch (e) { STAV = {}; }
  // předvyplň z CSV, pokud tam něco je a v localStorage ještě ne
  MISE.forEach(m => {
    const k = kl(m);
    if (!STAV[k] && m.dil && m.strana) STAV[k] = { dil: m.dil, strana: m.strana, id: '', cv: '', pozn: m.pozn };
  });
}
function uloz() {
  try { localStorage.setItem(KLIC, JSON.stringify(STAV)); } catch (e) {}
}
function kl(m) { return m.r + '/' + m.id; }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

function hotovo() { return MISE.filter(m => (STAV[kl(m)] || {}).id).length; }

function renderStav() {
  const h = hotovo();
  document.getElementById('stav').textContent =
    h + ' z ' + MISE.length + ' misí má video' + (h === MISE.length ? ' ✓' : '');
}

function renderSeznam() {
  const el = document.getElementById('seznam');
  let html = '', rocnik = '';
  MISE.forEach((m, i) => {
    if (m.r !== rocnik) { rocnik = m.r; html += '<div class="rocnik">' + esc(rocnik) + '. ročník</div>'; }
    const s = STAV[kl(m)] || {};
    html += '<div class="m' + (i === vybrana ? ' on' : '') + (s.id ? ' hot' : '') + '" data-i="' + i + '">' +
      '<span class="kod">' + esc(m.id) + '</span>' +
      '<span>' + esc(m.nm) + '</span>' +
      '<span class="zn">' + (s.id ? '✓' : '—') + '</span></div>';
  });
  el.innerHTML = html;
  [...el.querySelectorAll('.m')].forEach(n => {
    n.onclick = () => { vybrana = +n.dataset.i; renderSeznam(); renderDetail(); };
  });
}

function renderDetail() {
  const m = MISE[vybrana];
  const s = STAV[kl(m)] || (STAV[kl(m)] = {});
  const el = document.getElementById('detail');
  let html = '<h2>' + esc(m.r) + '. ročník · ' + esc(m.id) + ' — ' + esc(m.nm) + '</h2>' +
    '<div class="podnadpis">Vyber díl, pak stranu a nakonec konkrétní cvičení.</div>';

  /* NÁVRHY — nejdřív, ať se většinou jen potvrzuje místo hledání */
  const nav = navrhy(m, 6);
  if (nav.length) {
    html += '<label>Návrh podle tématu <span style="font-weight:400">(strojový tip, ne rozhodnutí — ověř si ho)</span></label>';
    nav.forEach(n => {
      const vyb = String(s.dil) === DILY[n.di] && String(s.strana) === String(n.s);
      html += '<div class="navrh' + (vyb ? ' on' : '') + '" data-navrh-di="' + n.di + '" data-navrh-s="' + n.s + '">' +
        '<span style="flex:1;min-width:0"><b>' + esc(n.t) + '</b><br>' +
        '<span style="color:var(--muted);font-size:11.5px">' + esc(DILY[n.di]) + ' · strana ' + n.s +
        ' · ' + PODLE[n.di][n.s].length + ' videí</span></span>' +
        '<span style="color:var(--warn);font-size:11px;white-space:nowrap">vybrat ▸</span></div>';
    });
  }

  /* Díly se nabízejí jen pro ročník té mise — patnáct dílů v seznamu
     je zbytečná práce, když kandidáti jsou tři. */
  const vsechny = !!s.vsechnyDily;
  const nabidka = DILY.map((d, i) => i).filter(i =>
    vsechny || String(DIL_ROCNIK[i] || '') === String(m.r) || String(s.dil) === String(DILY[i]));
  html += '<label for="d-dil">Díl učebnice</label><select id="d-dil"><option value="">— vyber díl —</option>' +
    nabidka.map(i => '<option value="' + i + '"' + (String(s.dil) === String(DILY[i]) ? ' selected' : '') + '>' +
      esc(DILY[i]) + ' (' + Object.keys(PODLE[i] || {}).length + ' stran)</option>').join('') + '</select>' +
    '<label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-weight:400">' +
    '<input type="checkbox" id="d-vse"' + (vsechny ? ' checked' : '') + '> ukázat všech ' + DILY.length + ' dílů</label>';

  const di = DILY.indexOf(s.dil);
  if (di >= 0) {
    const strany = Object.keys(PODLE[di] || {}).map(Number).sort((a, b) => a - b);
    html += '<label>Strana <span style="font-weight:400">(najeď myší pro téma, dole počet videí)</span></label>' +
      '<div class="mrizka">' + strany.map(n => {
        const t = tema(di, n);
        return '<button class="s' + (String(s.strana) === String(n) ? ' on' : '') +
          '" data-s="' + n + '"' + (t ? ' title="' + esc(t) + '"' : '') + '>' + n +
          '<span class="p">' + PODLE[di][n].length + '</span></button>';
      }).join('') + '</div>';

    const vids = (PODLE[di] || {})[s.strana] || [];
    if (vids.length) {
      const t = tema(di, s.strana);
      html += '<label>Cvičení na straně ' + esc(s.strana) + (t ? ' — ' + esc(t) : '') + '</label>';
      vids.forEach(v => {
        html += '<div class="vid' + (s.id === v.id ? ' on' : '') + '" data-id="' + esc(v.id) + '" data-cv="' + esc(v.cv) + '">' +
          '<span>' + (s.id === v.id ? '✓ ' : '') + 'cvičení ' + esc(v.cv || '—') + '</span>' +
          '<a href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener">otevřít ▸</a>' +
          '</div>';
      });
    } else if (s.strana) {
      html += '<div class="empty">Na téhle straně nejsou videa.</div>';
    }
  }

  html += '<label for="d-pozn">Poznámka (nepovinná)</label>' +
    '<input id="d-pozn" value="' + esc(s.pozn || '') + '" placeholder="např. jen 1. polovina strany">';

  html += '<div class="radek">' +
    '<button class="btn" id="b-clear">Vymazat u této mise</button>' +
    '<button class="btn p" id="b-next">Další mise ▸</button></div>';

  el.innerHTML = html;

  [...el.querySelectorAll('[data-navrh-di]')].forEach(n => {
    n.onclick = () => {
      s.dil = DILY[+n.dataset.navrhDi]; s.strana = n.dataset.navrhS; s.id = ''; s.cv = '';
      uloz(); renderDetail(); renderSeznam(); renderStav();
    };
  });
  const cbVse = document.getElementById('d-vse');
  if (cbVse) cbVse.onchange = e => { s.vsechnyDily = e.target.checked; uloz(); renderDetail(); };

  document.getElementById('d-dil').onchange = e => {
    s.dil = e.target.value === '' ? '' : DILY[+e.target.value];
    s.strana = ''; s.id = ''; s.cv = ''; uloz(); renderDetail(); renderSeznam(); renderStav();
  };
  [...el.querySelectorAll('.s')].forEach(b => {
    b.onclick = () => { s.strana = b.dataset.s; s.id = ''; s.cv = ''; uloz(); renderDetail(); };
  });
  [...el.querySelectorAll('.vid')].forEach(v => {
    v.onclick = e => {
      if (e.target.tagName === 'A') return;
      s.id = v.dataset.id; s.cv = v.dataset.cv; uloz(); renderDetail(); renderSeznam(); renderStav();
    };
  });
  document.getElementById('d-pozn').oninput = e => { s.pozn = e.target.value; uloz(); };
  document.getElementById('b-clear').onclick = () => {
    STAV[kl(m)] = {}; uloz(); renderDetail(); renderSeznam(); renderStav();
  };
  document.getElementById('b-next').onclick = () => {
    vybrana = Math.min(MISE.length - 1, vybrana + 1); renderSeznam(); renderDetail();
  };
}

function csvPole(v) {
  v = String(v == null ? '' : v);
  return /[",\\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
/* 🔴 Rozdělit řádek přes split(',') NESTAČÍ, i když to tak původně stálo
   v komentáři („exportujeme jen hodnoty bez čárek"). DVĚ mise se jmenují
   „Násobení a dělení 10, 100" (3/7-2 a 5/5-3) — export je podle pravidel
   zabalí do uvozovek, ale naivní dělení je rozseká a VŠECHNY sloupce za
   názvem se posunou o jedna. Protože se mise páruje podle sloupců PŘED
   názvem (rocnik, mise), řádek se přesto přijal a uložil nesmyslný díl,
   stranu i ID — tiše, u dvou misí z 63. */
function radekCsv(r) {
  const out = []; let val = '', q = false;
  for (let i = 0; i < r.length; i++) {
    const c = r[i];
    if (q) {
      if (c === '"') { if (r[i + 1] === '"') { val += '"'; i++; } else q = false; }
      else val += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(val); val = ''; }
    else val += c;
  }
  out.push(val);
  return out;
}
function doCsv() {
  const hl = ['rocnik', 'mise', 'nazev_mise', 'dil', 'strana', 'youtube_id', 'cviceni', 'poznamka'];
  const rad = MISE.map(m => {
    const s = STAV[kl(m)] || {};
    return [m.r, m.id, m.nm, s.dil || '', s.strana || '', s.id || '', s.cv || '', s.pozn || ''].map(csvPole).join(',');
  });
  return hl.join(',') + '\\n' + rad.join('\\n') + '\\n';
}

document.getElementById('b-export').onclick = () => {
  const csv = doCsv();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = '1stupen-videa-mapovani.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  // pojistka, kdyby prohlížeč stahování zablokoval: ukaž to i k okopírování
  const w = window.open('', '_blank', 'width=700,height=520');
  if (w) {
    w.document.title = 'CSV k okopírování';
    const t = w.document.createElement('textarea');
    t.style.cssText = 'width:100%;height:96%;font-family:monospace;font-size:12px';
    t.value = csv;
    w.document.body.appendChild(t);
    t.select();
  }
};
document.getElementById('b-import').onclick = () => {
  const txt = prompt('Vlož obsah CSV (hlavička + řádky):');
  if (!txt) return;
  const radky = txt.split(/\\r?\\n/).filter(r => r.trim());
  const hl = radekCsv(radky.shift()).map(h => h.trim());
  const ix = n => hl.indexOf(n);
  let n = 0;
  radky.forEach(r => {
    const c = radekCsv(r);
    const key = (c[ix('rocnik')] || '').trim() + '/' + (c[ix('mise')] || '').trim();
    if (!MISE.some(m => kl(m) === key)) return;
    STAV[key] = {
      dil: (c[ix('dil')] || '').trim(), strana: (c[ix('strana')] || '').trim(),
      id: (c[ix('youtube_id')] || '').trim(), cv: (c[ix('cviceni')] || '').trim(),
      pozn: (c[ix('poznamka')] || '').trim()
    };
    n++;
  });
  uloz(); renderSeznam(); renderDetail(); renderStav();
  alert('Načteno ' + n + ' řádků.');
};

/* Návod je vidět hned napoprvé (bez něj nikdo neví, co se po něm chce),
   ale jde schovat a volba se pamatuje — při dvacáté misi už jen překáží. */
const KLIC_NAVOD = KLIC + '_NAVOD_SKRYT';
function navodViditelnost() {
  let skryt = false;
  try { skryt = localStorage.getItem(KLIC_NAVOD) === '1'; } catch (e) {}
  document.getElementById('navod').classList.toggle('skryty', skryt);
  document.getElementById('b-navod').textContent = skryt ? '? Návod' : '✕ Skrýt návod';
}
document.getElementById('b-navod').onclick = () => {
  const skryt = !document.getElementById('navod').classList.contains('skryty');
  try { localStorage.setItem(KLIC_NAVOD, skryt ? '1' : '0'); } catch (e) {}
  navodViditelnost();
};
navodViditelnost();
spocitejVahy();
/* Kolik misí zůstane bez návrhu, se v návodu NEPÍŠE natvrdo — spočítá se
   tady, z těch samých návrhů, které uvidíš. Napsané číslo by se při každé
   změně vážení tiše rozešlo se skutečností. */
(() => {
  /* Zápis „X z Y" se vyhýbá skloňování číslovky — to je v tomhle
     repozitáři doložený zdroj chyb („3 otoček", „4 minut"). */
  const bez = MISE.filter(m => navrhy(m, 1).length === 0).length;
  const el = document.getElementById('bez-navrhu');
  if (el) el.textContent = bez + ' z ' + MISE.length;
})();
nacti(); renderSeznam(); renderDetail(); renderStav();
</script>
`;

fs.writeFileSync(OUT, html, 'utf8');
const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
console.log('\n✅ Zapsáno ' + path.relative(ROOT, OUT) + ' (' + kb + ' kB) — otevři dvojklikem.');
