#!/usr/bin/env node
// Scrapes CERMAT website for the next JPZ math exam date (1. kolo).
// Writes result to projects/cermat-date.json.
// Called by .github/workflows/update-cermat.yml weekly.
// If the date cannot be found, the stored JSON is left unchanged and the
// script exits NON-ZERO, so the weekly job goes red instead of pretending
// it worked. This workflow blocks nothing — it only reports.

const https = require('https');
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../../projects/cermat-date.json');

/* CERMAT se přestěhoval z cermat.cz na cermat.gov.cz a změnil strukturu
   adres. Staré cesty vracely 404, aniž by to bylo vidět — job totiž
   končil exit 0 (viz `run()` níže).

   18. 9. 2026 OVĚŘENO PROTI ŽIVÉMU WEBU (adresy už ze sandboxu prochází):
     · prijimacky.cermat.cz/menu/jednotna-prijimaci-zkouska.html  → 200,
       a právě tady je tabulka „OBOR VZDĚLÁNÍ / 1. ŘÁDNÝ TERMÍN / …",
     · varianta bez `.html` → 301 na tu výše (fetchUrl přesměrování následuje),
     · cermat.gov.cz/terminy-zkousek/ i /jednotna-prijimaci-zkouska/ → 404,
       proto jdou pryč. Adresa, která 200 vrátí, ale datum v ní nikdy není,
       je jen šum v logu.
   Když nezabere žádná adresa, job spadne ČERVENĚ. */
const CERMAT_URLS = [
  // Kanonická stránka s tabulkou termínů (ověřeno 18. 9. 2026).
  'https://prijimacky.cermat.cz/menu/jednotna-prijimaci-zkouska.html',
  // Bez přípony — kdyby se kanonický tvar změnil, tohle na něj přesměruje.
  'https://prijimacky.cermat.cz/menu/jednotna-prijimaci-zkouska',
  'https://prijimacky.cermat.cz/aktuality',
  'https://prijimacky.cermat.cz/',
];

// Czech month names → month index (0-based)
const CS_MONTHS = {
  ledna:0, února:1, března:2, dubna:3, května:4, června:5,
  července:6, srpna:7, září:8, října:9, listopadu:10, prosince:11,
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (cermat-date-bot/1.0)' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow one redirect
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

/* Stránka CERMATu má češtinu v HTML ENTITÁCH: „1. ŘÁDNÝ TERMÍN" je v jejím
   zdroji `1. &#344;&Aacute;DN&Yacute; TERM&Iacute;N`. Bez dekódování nemohl
   kontextový vzor sednout a parseDate vracela null na stránce, kde datum JE —
   přesně tohle dělalo z jobu pět červených týdnů v řadě (v logu „No date found
   in page" při HTTP 200). Pojmenované entity stačí ty, které čeština potřebuje;
   zbytek pokryje číselný zápis. */
const ENTITY = {
  nbsp: "\u00a0", amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'",
  aacute: "á", Aacute: "Á", eacute: "é", Eacute: "É", iacute: "í", Iacute: "Í",
  oacute: "ó", Oacute: "Ó", uacute: "ú", Uacute: "Ú", yacute: "ý", Yacute: "Ý",
  scaron: "š", Scaron: "Š",
};
function dekodujEntity(s) {
  const znak = n => (Number.isFinite(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "");
  return String(s)
    .replace(/&#x([0-9a-f]{1,6});/gi, (m, h) => znak(parseInt(h, 16)) || m)
    .replace(/&#(\d{1,7});/g, (m, d) => znak(parseInt(d, 10)) || m)
    .replace(/&([a-z]+);/gi, (m, n) => (Object.prototype.hasOwnProperty.call(ENTITY, n) ? ENTITY[n] : m));
}

/* Značky pryč RUČNÍM skenerem, ne přes regulární výraz — ten vzor hlásí CodeQL
   jako neúplnou sanitizaci a v tomhle repu je kvůli němu zapsané pravidlo.
   Pořadí „nejdřív značky, pak entity" je schválně: kdyby se dekódovalo dřív,
   z &lt;b&gt; by vznikla značka a skener by ji snědl i s textem za ní. */
function bezZnacek(s) {
  let out = "", uvnitr = false;
  for (const ch of String(s)) {
    if (ch === "<") uvnitr = true;
    else if (ch === ">") uvnitr = false;
    else if (!uvnitr) out += ch;
  }
  return out;
}

function parseDate(html, currentYear) {
  // Entity AŽ PO odstranění značek — viz komentář u bezZnacek().
  const text = dekodujEntity(bezZnacek(html)).replace(/\s+/g, ' ');

  // Patterns for Czech date near "JPZ" / "přijímací zkouška" / "1. termín" / "1. kolo"
  // e.g. "14. dubna 2027" or "14. dubna 2027"
  const dateRe = /(\d{1,2})[.\s ]+([a-záéíóúůžšřčďťňě]+)[.\s ]+(\d{4})/gi;

  // Context keywords that indicate this is the JPZ math exam
  const contextRe = /jednotn[áé]\s+p[řr][íi]j[íi]mac[íi]\s+zkou[šs]k[ay]|JPZ|1\.\s*(?:ř[áa]dn[ýy]\s+)?term[íi]n|1\.\s*kolo/i;

  /* Tabulka termínů má DVA řádky: „Čtyřleté obory a obory nástavbového studia"
     (12. a 13. 4. 2027) a „Obory šestiletých a osmiletých gymnázií" (14. a 15. 4.).
     Nás zajímá ten první — deváťáci jdou na čtyřleté. Tahle záměna už jednou
     ručně proběhla (v JSONu stálo 13. 4., což je gymnaziální termín), takže se
     datum bere jen z rozsahu mezi popiskem čtyřletých a popiskem gymnázií.
     Když stránka popisky nemá (starší tvar, jednotkové testy), platí celý text. */
  let odI = 0, doI = text.length;
  const ctyrI = text.search(/čty[řr]let/i);
  if (ctyrI >= 0) {
    odI = ctyrI;
    const dalsi = text.slice(ctyrI).search(/[šs]estilet|osmilet/i);
    if (dalsi > 0) doI = ctyrI + dalsi;
  }

  // Split into windows around context keywords
  const hits = [];
  let m;
  while ((m = dateRe.exec(text)) !== null) {
    // mimo řádek čtyřletých oborů se datum nebere
    if (m.index < odI || m.index >= doI) continue;
    const day = parseInt(m[1], 10);
    const monthName = m[2].toLowerCase();
    const year = parseInt(m[3], 10);
    const month = CS_MONTHS[monthName];

    if (month === undefined) continue;
    if (year < currentYear || year > currentYear + 2) continue;
    if (day < 1 || day > 31) continue;

    // Check context window (500 chars before match)
    const start = Math.max(0, m.index - 500);
    const window = text.slice(start, m.index + 100);
    if (!contextRe.test(window)) continue;

    // Prefer April (typical JPZ month), then March/May
    const score = (month === 3) ? 10 : (month === 2 || month === 4) ? 5 : 1;
    hits.push({ day, month, year, score });
  }

  if (!hits.length) return null;

  // Pick highest score, then earliest date
  hits.sort((a, b) => b.score - a.score || a.year - b.year || a.month - b.month || a.day - b.day);
  const best = hits[0];

  const mm = String(best.month + 1).padStart(2, '0');
  const dd = String(best.day).padStart(2, '0');
  return { date: `${best.year}-${mm}-${dd}`, year: best.year, round: 1 };
}

async function run(opts) {
  const urls = (opts && opts.urls) || CERMAT_URLS;
  const now = new Date();
  // Look for next upcoming exam — skip dates already more than a week past
  const cutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const currentYear = now.getFullYear();

  let found = null;
  for (const url of urls) {
    try {
      console.log(`Fetching ${url} ...`);
      const html = await fetchUrl(url);
      const parsed = parseDate(html, currentYear);
      if (parsed) {
        const d = new Date(parsed.date + 'T08:00:00');
        if (d >= cutoff) {
          found = parsed;
          console.log(`Found: ${parsed.date}`);
          break;
        } else {
          console.log(`Found ${parsed.date} but it's in the past — continuing`);
        }
      } else {
        console.log('No date found in page');
      }
    } catch (e) {
      console.log(`Error fetching ${url}: ${e.message}`);
    }
  }

  if (!found) {
    /* Dřív tu bylo `process.exit(0)` s odůvodněním „ať to neblokuje CI".
       Jenže tenhle workflow NIC neblokuje — je samostatný a běží v pondělí
       ráno. Jediné, co exit 0 zařídil, bylo, že se devět mrtvých běhů
       tvářilo zeleně a nikdo si nevšiml, že se doména přestěhovala.
       Job, jehož JEDINÝ úkol je stáhnout datum, musí při neúspěchu
       zčervenat. Uložený JSON zůstává nedotčený, takže web běží dál. */
    console.error('CHYBA: nepodařilo se zjistit termín — žádná z adres nevrátila použitelné datum.');
    console.error('Zkontroluj CERMAT_URLS v .github/scripts/fetch-cermat.js (web CERMAT mění adresy).');
    console.error('Uložený JSON zůstává beze změny, web tedy jede dál na posledním známém datu.');
    process.exit(1);
  }

  const existing = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  if (existing.next && existing.next.date === found.date) {
    console.log('Date unchanged');
    process.exit(0);
  }

  const updated = {
    next: {
      date: found.date,
      label: `1. termín ${found.year}`,
      round: 1,
      year: found.year,
    },
    source: 'auto',
    updated: now.toISOString().slice(0, 10),
    note: existing.note || '',
  };

  fs.writeFileSync(JSON_PATH, JSON.stringify(updated, null, 2) + '\n');
  console.log(`Updated cermat-date.json → ${found.date}`);
}

// Run only when invoked directly (so tests can require + unit-test parseDate).
if (require.main === module) {
  // Neočekávaná chyba taky musí být VIDĚT — dřív ji `exit 0` schoval.
  run().catch(e => { console.error(e); process.exit(1); });
}

// CERMAT_URLS se exportuje, aby šlo testem hlídat, že nemíří na mrtvou doménu.
module.exports = { parseDate, CERMAT_URLS, run };
