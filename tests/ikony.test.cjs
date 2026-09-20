/* ══════════════════════════════════════════════════════════════════════
   Ikona v záložce (favicon) na každé stránce.

   PROČ VZNIKL: odkaz na ikonu měla jen část webu a nikdo to neměřil.
   Naměřeno 20. 9. 2026 (`grep -L 'rel="icon"'` přes všechny `.html`):

     bez ikony  20 stránek ze 42
     z toho     všech SEDM cestovatelských zápisků (odkaz měl jen
                rozcestník `/travels/index.html`)
                ŠEST z osmi únikovek — procenta a tělesa ji měly
                goniometrie, narozeniny, papír, podmínky, soukromí,
                učitelská konzole

   „Šest z osmi únikovek" je v tomhle repozitáři doložený opakovaný vzorec
   (dotykové plochy, `min-width:0`, rozestup karet) — pokaždé se zapomene
   na tytéž stránky. Proto se to hlídá měřením, ne dobrou vůlí.

   🔴 Kontroluje se i `travels/_template.html`, PŘESTOŽE je v `MIMO` a
   nenasazuje se: nový zápisek se kopíruje Z NĚJ, takže chybějící odkaz
   v šabloně by tu díru rovnou zopakoval u každé další cesty.

   Spusť: node tests/ikony.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { ROOT, STRANKY } = require('./stranky.cjs');

/* Která ikona kam patří. Cestovatelská sekce má vlastní (jantarová stopa
   trasy na tmavém), zbytek webu zelený terminálový prompt. */
const IKONA_WEB = '/favicon.svg';
const IKONA_CESTY = '/travels/favicon.svg';

/* Šablona zápisku není v `STRANKY` (nenasazuje se), ale kontroluje se —
   viz hlavička. Kdyby soubor zmizel, test spadne, aby výjimka nehnila. */
const NAVIC = ['/travels/_template.html'];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { c ? pass++ : (fail++, console.log('  ❌ ' + m + (d ? ' — ' + d : ''))); };

console.log('\n── Ikony v záložce ──\n');

/* ── 1. obě ikony existují a jsou to skutečná SVG ───────────────────── */
for (const [jmeno, url] of [['webová', IKONA_WEB], ['cestovatelská', IKONA_CESTY]]) {
  const f = path.join(ROOT, url.replace(/^\//, ''));
  const je = fs.existsSync(f);
  ok(je, `${jmeno} ikona existuje (${url})`);
  if (!je) continue;
  const s = fs.readFileSync(f, 'utf8');
  ok(/<svg[^>]*viewBox="[^"]+"/.test(s), `${jmeno} ikona má viewBox`);
  ok(s.length < 4096, `${jmeno} ikona je malá (${s.length} B)`);
}

/* Obě musí být RŮZNÉ — jinak by „vlastní ikona sekce" byla jen tvrzení. */
if (fs.existsSync(path.join(ROOT, 'favicon.svg')) && fs.existsSync(path.join(ROOT, 'travels/favicon.svg'))) {
  ok(fs.readFileSync(path.join(ROOT, 'favicon.svg'), 'utf8')
     !== fs.readFileSync(path.join(ROOT, 'travels/favicon.svg'), 'utf8'),
    'cestovatelská ikona se liší od webové');
}

/* ── 2. každá stránka odkazuje na SVOU ikonu a ta existuje ──────────── */
const seznam = [...STRANKY.map(p => p.url), ...NAVIC];
let videno = 0, cesty = 0;
for (const url of seznam) {
  const f = path.join(ROOT, url.replace(/^\//, '').replace(/\/$/, '') || 'index.html');
  const soubor = fs.existsSync(f) ? f : path.join(f, 'index.html');
  if (!fs.existsSync(soubor)) { ok(false, `${url}: soubor nenalezen`, soubor); continue; }
  videno++;
  const s = fs.readFileSync(soubor, 'utf8');
  const odkazy = [...s.matchAll(/<link[^>]*rel="icon"[^>]*>/g)].map(m => m[0]);
  if (odkazy.length !== 1) { ok(false, `${url}: právě jeden odkaz na ikonu`, `nalezeno ${odkazy.length}`); continue; }

  const href = (odkazy[0].match(/href="([^"]+)"/) || [])[1] || '';
  const ceka = url.startsWith('/travels/') ? IKONA_CESTY : IKONA_WEB;
  if (ceka === IKONA_CESTY) cesty++;
  ok(href === ceka, `${url}: ikona ${ceka}`, `odkazuje na „${href}"`);

  /* Odkaz na neexistující soubor je TICHÁ vada — prohlížeč jen ukáže
     výchozí ikonu a nic nehlásí. Proto se ověřuje i cíl. */
  ok(fs.existsSync(path.join(ROOT, href.replace(/^\//, ''))), `${url}: cíl odkazu existuje`, href);
  ok(/type="image\/svg\+xml"/.test(odkazy[0]), `${url}: odkaz má type`, odkazy[0]);
}

/* ── 3. pojistka proti auditu, který nic neviděl ────────────────────── */
ok(videno === seznam.length, `proměřeny všechny stránky (${seznam.length})`, `proměřeno ${videno}`);
ok(cesty >= 8, `cestovatelská sekce proměřena celá (${cesty} stránek, podlaha 8)`,
  'rozcestník + 7 zápisků + šablona');

console.log(`\n  Ikony: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
