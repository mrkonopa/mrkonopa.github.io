/* ══════════════════════════════════════════════════════════════════
   Týdenní kontrola videí na YouTube (.github/workflows/videa.yml).

   PROČ. Ve výkladech je přes 140 odkazů na YouTube a v cestovatelských
   zápiscích vložená videa. Když autor video smaže nebo skryje, žák klikne
   na mrtvý odkaz a nikdo se to nedozví. Ze sandboxu je YouTube blokovaný,
   takže se to dá ověřit jen tady, na runneru GitHubu.

   CO SE HLEDÁ. Všechny soubory v gitu kromě VYJIMEK (každá i s důvodem):
   odkazy youtube.com/watch, youtu.be, /embed/, /shorts/ a zápisy
   `video: { id: '…' }` / `video: { url: '…' }` / `video: '…'` z výkladů.
   Zápis `video:` ve výkladu, který se nepodaří přečíst, je CHYBA — jinak
   by nové video v jiném tvaru kontrolou tiše prošlo.

   JAK SE OVĚŘUJE. oEmbed odpoví 200 jen u veřejného videa, které jde
   vložit. Cokoli jiného se dověří na stránce videa (`playabilityStatus`):
   „OK" znamená, že video žije, jen ho autor nedovolil vkládat — pro odkaz
   v pořádku, pro <iframe> v zápisku ne.

   KANÁREK. Každý běh ověří i vymyšlené ID, které nemůže existovat. Kdyby
   vyšlo „žije", měřidlo je slepé (YouTube odpovídá na všechno kladně)
   a běh zčervená — jinak by kontrola hlásila zelenou nad čímkoli.

   NEÚSPĚCH = ČERVENÁ. Job nic neblokuje, běží sám jednou týdně; jeho
   JEDINÝ úkol je poznat mrtvé video, takže mrtvé video, neověřitelné
   video i slepé měřidlo končí kódem 1 (poučení z CERMAT jobu, který
   devět týdnů hlásil zelenou a nestahoval nic).

   Spusť: node .github/scripts/check-videos.js
   Prostředí: VIDEA_REPORT=soubor.md (souhrn pro issue), GITHUB_STEP_SUMMARY.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

// Soubory, ve kterých se videa nehledají. Každá výjimka má důvod.
const VYJIMKY = [
  ['tools/data/', 'katalogy celých kanálů (tisíce videí), ze kterých se vybíralo — žák na ně neklikne'],
  ['tests/', 'testy, ne obsah pro žáky'],
  ['.github/', 'CI a tahle kontrola sama (vymyšlené ID kanárka)'],
];
const TEXTOVE = /\.(html?|js|cjs|mjs|json|md|css|txt|csv|svg)$/i;

const ID = '[A-Za-z0-9_-]{11}';
const RE_ODKAZ = new RegExp(
  '(?:youtube(?:-nocookie)?\\.com/(?:watch\\?(?:[^"\'\\s<>]*?&(?:amp;)?)?v=|embed/|shorts/|live/|v/)|youtu\\.be/)(' + ID + ')(?![A-Za-z0-9_-])', 'g');
const RE_VIDEO = /\bvideo\s*:\s*(null\b|\{[^}]*\}|'[^']*'|"[^"]*")/g;
const RE_VIDEO_ID = new RegExp('\\bid\\s*:\\s*[\'"](' + ID + ')[\'"]');
const RE_VIDEO_URL = /\burl\s*:\s*['"]([^'"]+)['"]/;
const RE_JEN_ID = new RegExp('^[\'"](' + ID + ')[\'"]$');

// Vymyšlené ID, které nemůže existovat (pravděpodobnost shody ~1 : 10⁹).
const KANAREK = 'Zq0vKx7Tw2E';

const OEMBED = process.env.YT_OEMBED || 'https://www.youtube.com/oembed';
const WATCH = process.env.YT_WATCH || 'https://www.youtube.com/watch';
const PAUZA_MS = Number(process.env.YT_PAUZA_MS ?? 300);
const POKUSY = Number(process.env.YT_POKUSY ?? 3);

const spi = ms => new Promise(r => setTimeout(r, ms));

function soubory(root = ROOT) {
  const vse = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0');
  return vse.filter(f => f && TEXTOVE.test(f) && !VYJIMKY.some(([v]) => f.startsWith(v)));
}

/* Najde videa. Vrací { videa: Map(id → [{soubor, radek, druh}]), chyby: [] }.
   `druh` je 'embed' (přehrává se v <iframe>) nebo 'odkaz'. */
function najdiVidea({ root = ROOT, seznam = soubory(root) } = {}) {
  const videa = new Map();
  const chyby = [];
  const pridej = (id, soubor, radek, druh) => {
    if (!videa.has(id)) videa.set(id, []);
    videa.get(id).push({ soubor, radek, druh });
  };
  for (const soubor of seznam) {
    const text = fs.readFileSync(path.join(root, soubor), 'utf8');
    const radky = text.split('\n');
    radky.forEach((r, i) => {
      for (const m of r.matchAll(RE_ODKAZ)) pridej(m[1], soubor, i + 1, /\/embed\//.test(m[0]) ? 'embed' : 'odkaz');
    });
    // Zápisy `video:` se čtou jen v obsahu her a přijímaček; v dokumentaci jsou to příklady.
    if (!soubor.startsWith('projects/') || !/\.js$/.test(soubor)) continue;
    for (const m of text.matchAll(RE_VIDEO)) {
      const radek = text.slice(0, m.index).split('\n').length;
      const hodnota = m[1];
      if (hodnota === 'null') continue;
      const id = (hodnota.match(RE_VIDEO_ID) || hodnota.match(RE_JEN_ID) || [])[1];
      const url = (hodnota.match(RE_VIDEO_URL) || [])[1];
      const zUrl = url && [...url.matchAll(RE_ODKAZ)][0];
      if (id) pridej(id, soubor, radek, 'odkaz');
      else if (zUrl) continue; // adresa v `url:` už prošla hledáním odkazů výše
      else chyby.push(`${soubor}:${radek} nerozpoznaný zápis videa: video: ${hodnota.slice(0, 60)}`);
    }
  }
  return { videa, chyby };
}

async function stahni(url) {
  let posledni;
  for (let pokus = 1; pokus <= POKUSY; pokus++) {
    try {
      // Hlavička smí mít jen Latin-1 — „ů“ v User-Agentu shodilo každý dotaz (chytil to test).
      const r = await fetch(url, { headers: { 'Accept-Language': 'cs,en;q=0.5', 'User-Agent': 'Mozilla/5.0 (link-check; github.com/mrkonopa)' } });
      if (r.status === 429 || r.status >= 500) throw new Error('HTTP ' + r.status);
      return { status: r.status, text: await r.text() };
    } catch (e) {
      posledni = e;
      if (pokus < POKUSY) await spi(PAUZA_MS * 2 ** pokus);
    }
  }
  throw posledni;
}

// Důvod ze stránky videa: `"reason":"…"` nebo `"reason":{"simpleText":"…"}`.
function duvodZeStranky(html) {
  const m = html.match(/"playabilityStatus":\{"status":"([A-Z_]+)"(?:,"reason":(?:"((?:[^"\\]|\\.)*)"|\{"simpleText":"((?:[^"\\]|\\.)*)"))?/);
  if (!m) return null;
  let duvod = m[2] || m[3] || '';
  try { duvod = JSON.parse('"' + duvod + '"'); } catch (e) { /* ponechat syrový text */ }
  return { status: m[1], duvod };
}

/* Stav jednoho videa: 'ok' | 'mrtve' | 'nelze' (neověřitelné). */
async function over(id) {
  try {
    const o = await stahni(`${OEMBED}?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`);
    if (o.status === 200) {
      let data = {};
      try { data = JSON.parse(o.text); } catch (e) { return { stav: 'nelze', duvod: 'oEmbed nevrátil JSON' }; }
      return { stav: 'ok', vkladani: true, nazev: data.title || '', autor: data.author_name || '' };
    }
    const w = await stahni(`${WATCH}?v=${encodeURIComponent(id)}&hl=cs`);
    const p = duvodZeStranky(w.text);
    if (!p) return { stav: 'nelze', duvod: `oEmbed ${o.status}, stránka videa bez playabilityStatus (změnil se formát?)` };
    if (p.status === 'OK') return { stav: 'ok', vkladani: false, duvod: `oEmbed ${o.status}: autor zakázal vkládání` };
    if (/robot|\bbot\b/i.test(p.duvod)) return { stav: 'nelze', duvod: `YouTube blokuje runner: ${p.duvod}` };
    return { stav: 'mrtve', duvod: `${p.status}${p.duvod ? ': ' + p.duvod : ''} (oEmbed ${o.status})` };
  } catch (e) {
    return { stav: 'nelze', duvod: 'síť: ' + (e.cause && e.cause.code || e.message) };
  }
}

async function run({ root, seznam, log = console.log } = {}) {
  const { videa, chyby } = najdiVidea({ root, seznam });
  const problemy = [...chyby];
  log(`Nalezeno ${videa.size} různých videí v ${new Set([...videa.values()].flat().map(u => u.soubor)).size} souborech.`);
  // Pojistka proti „extrakce nic nenašla a kontrola zeleně prošla nad ničím".
  const PODLAHA = Number(process.env.YT_PODLAHA ?? 100);
  if (videa.size < PODLAHA) problemy.push(`nalezeno jen ${videa.size} videí (podlaha ${PODLAHA}) — hledání přestalo fungovat`);

  const kanarek = await over(KANAREK);
  if (kanarek.stav === 'ok') problemy.push(`kanárek ${KANAREK} „žije" — měřidlo je slepé, YouTube odpovídá kladně na neexistující video`);
  if (kanarek.stav === 'nelze') problemy.push(`kanárka nešlo ověřit (${kanarek.duvod}) — výsledku nelze věřit`);

  const radky = [];
  let ok = 0;
  for (const [id, pouziti] of videa) {
    const v = await over(id);
    const kde = pouziti.map(u => `${u.soubor}:${u.radek}`).join(', ');
    const embed = pouziti.some(u => u.druh === 'embed');
    if (v.stav === 'ok' && !(embed && v.vkladani === false)) { ok++; }
    else {
      const duvod = v.stav === 'ok' ? 'video je vložené v <iframe>, ale autor vkládání zakázal' : v.duvod;
      const znacka = v.stav === 'nelze' ? 'NELZE OVĚŘIT' : 'MRTVÉ';
      radky.push(`- **${znacka}** \`${id}\` — ${duvod}\n  - https://www.youtube.com/watch?v=${id}\n  - ${kde}`);
    }
    if (PAUZA_MS) await spi(PAUZA_MS);
  }
  problemy.push(...radky);
  const souhrn = [`## Videa na YouTube: ${ok} / ${videa.size} v pořádku`, '',
    problemy.length ? problemy.join('\n') : 'Všechna videa žijí; kanárek (neexistující video) správně vyšel jako mrtvý.', ''].join('\n');
  log(souhrn);
  for (const f of [process.env.GITHUB_STEP_SUMMARY, process.env.VIDEA_REPORT]) if (f) fs.appendFileSync(f, souhrn + '\n');
  return { ok, celkem: videa.size, problemy };
}

if (require.main === module) {
  run().then(r => process.exit(r.problemy.length ? 1 : 0))
    .catch(e => { console.error(e); process.exit(1); });
}

module.exports = { najdiVidea, duvodZeStranky, over, run, KANAREK, VYJIMKY };
