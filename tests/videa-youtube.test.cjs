/* ══════════════════════════════════════════════════════════════════
   Týdenní kontrola videí — test bez sítě.

   Skutečný YouTube je ze sandboxu blokovaný a v bráně by byl nespolehlivý,
   proto se tady ověřuje všechno OKOLO sítě:
   1. hledání videí najde každý zápis `video:` ve výkladech a každé vložené
      video v zápiscích — počítané NEZÁVISLE jiným postupem než ve skriptu;
   2. nerozpoznaný zápis videa je chyba, ne tiché přeskočení;
   3. rozhodování ok / mrtvé / neověřitelné nad podvrženým YouTube
      (místní HTTP server napodobí oEmbed i stránku videa);
   4. celý běh: zdravý stav končí 0, mrtvé video, video bez vkládání
      v <iframe>, slepé měřidlo (kanárek „žije") i nedostupná síť končí 1.

   Spusť: node tests/videa-youtube.test.cjs
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SKRIPT = path.join(ROOT, '.github', 'scripts', 'check-videos.js');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'videa.yml');
const K = require(SKRIPT);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

(async () => {
  console.log('── Hledání videí ──');
  const { videa, chyby } = K.najdiVidea();
  const pouziti = [...videa.values()].flat();
  ok(chyby.length === 0, 'žádný nerozpoznaný zápis videa' + (chyby.length ? ' [' + chyby[0] + ']' : ''));
  ok(videa.size >= 100, `nalezeno ${videa.size} různých videí (${pouziti.length} použití)`);

  // Nezávislé počítání: každý objekt `video: {…}` ve výkladech a každé `video: '…'`
  // v přijímačkách musí mít své použití. Počítá se jinak (prostý výskyt), ne
  // stejným regulárním výrazem jako skript — jinak by to byl kruh.
  const soubory = fs.readdirSync(path.join(ROOT, 'projects')).filter(f => /^rpg-learn-\d\.js$/.test(f))
    .map(f => 'projects/' + f).concat('projects/prijimacky-matematika/prijimacky-topics.js');
  for (const f of soubory) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const ocekavano = text.split(/\bvideo\s*:\s*[{'"]/).length - 1;
    const nalezeno = pouziti.filter(u => u.soubor === f).length;
    ok(ocekavano > 0 && nalezeno === ocekavano, `${f}: ${nalezeno} / ${ocekavano} zápisů videa`);
  }
  const travels = fs.readdirSync(path.join(ROOT, 'travels')).filter(f => f.endsWith('.html'));
  const vlozenych = travels.reduce((n, f) => n + (fs.readFileSync(path.join(ROOT, 'travels', f), 'utf8').split('/embed/').length - 1), 0);
  const embedu = pouziti.filter(u => u.druh === 'embed').length;
  ok(vlozenych > 0 && embedu === vlozenych, `vložená videa v zápiscích: ${embedu} / ${vlozenych}, všechna jako 'embed'`);
  ok(K.VYJIMKY.every(([v, duvod]) => fs.existsSync(path.join(ROOT, v)) && duvod.length > 20),
    'každá výjimka existuje a má důvod (výjimka na neexistující cestu by hnila)');

  // Nerozpoznaný zápis se nesmí tiše přeskočit.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'videa-'));
  fs.mkdirSync(path.join(tmp, 'projects'));
  fs.writeFileSync(path.join(tmp, 'projects', 'x.js'),
    "a = { video: { src: 'neco' } };\nb = { video: null };\nc = { video: { id: 'abcdefghijk', title: 't' } };\n");
  const syn = K.najdiVidea({ root: tmp, seznam: ['projects/x.js'] });
  ok(syn.chyby.length === 1 && /x\.js:1/.test(syn.chyby[0]) && syn.videa.has('abcdefghijk') && syn.videa.size === 1,
    'nerozpoznaný zápis je chyba s místem, null se přeskočí, platné id se najde');

  console.log('── Rozhodování nad podvrženým YouTube ──');
  const stranka = (status, duvod) => '<html><script>var ytInitialPlayerResponse = {"playabilityStatus":{"status":"' +
    status + '"' + (duvod ? ',"reason":' + duvod : '') + ',"playableInEmbed":true}};</script></html>';
  const CHOVANI = {
    OKOKOKOKOK1: { o: 200 },
    DEADDEADDE1: { o: 404, w: stranka('ERROR', '"Video není k dispozici"') },
    NOEMBEDNOE1: { o: 401, w: stranka('OK') },
    PRIVATEPRI1: { o: 401, w: stranka('LOGIN_REQUIRED', '"Toto video je soukromé"') },
    BOTBOTBOTB1: { o: 401, w: stranka('LOGIN_REQUIRED', '"Přihlaste se a potvrďte, že nejste robot"') },
    SIMPLETXT01: { o: 404, w: stranka('UNPLAYABLE', '{"simpleText":"Video není dostupné"}') },
    ERR500ERR51: { o: 500 },
    NOSTATUSNO1: { o: 403, w: '<html>žádný stav</html>' },
  };
  let scenar = id => CHOVANI[id] || { o: 200 };
  let dotazu = 0;
  const srv = http.createServer((q, p) => {
    dotazu++;
    const u = new URL(q.url, 'http://x');
    const id = u.pathname === '/oembed' ? new URL(u.searchParams.get('url')).searchParams.get('v') : u.searchParams.get('v');
    const c = scenar(id);
    if (u.pathname === '/oembed') {
      p.writeHead(c.o, { 'Content-Type': 'application/json' });
      return p.end(c.o === 200 ? JSON.stringify({ title: 'Video ' + id, author_name: 'Autor' }) : 'Chyba');
    }
    p.writeHead(200, { 'Content-Type': 'text/html' });
    p.end(c.w || stranka('OK'));
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const env = { ...process.env, YT_OEMBED: base + '/oembed', YT_WATCH: base + '/watch', YT_PAUZA_MS: '0', YT_POKUSY: '2',
    GITHUB_STEP_SUMMARY: '', VIDEA_REPORT: '' };
  const spust = (args, extra = {}) => new Promise(res => execFile(process.execPath, args,
    { env: { ...env, ...extra }, encoding: 'utf8', timeout: 120000, maxBuffer: 1 << 24 },
    (e, stdout, stderr) => res({ kod: e ? (e.code ?? 1) : 0, out: stdout + stderr })));

  const kod = 'const K=require(' + JSON.stringify(SKRIPT) + ');Promise.all(' + JSON.stringify(Object.keys(CHOVANI)) +
    '.map(id=>K.over(id).then(v=>[id,v]))).then(r=>console.log(JSON.stringify(Object.fromEntries(r))))';
  const r1 = await spust(['-e', kod]);
  let v = {};
  try { v = JSON.parse(r1.out.trim().split('\n').pop()); } catch (e) { /* ohlásí se níže */ }
  ok(v.OKOKOKOKOK1 && v.OKOKOKOKOK1.stav === 'ok' && v.OKOKOKOKOK1.vkladani === true, 'oEmbed 200 → video žije a jde vložit');
  ok(v.DEADDEADDE1 && v.DEADDEADDE1.stav === 'mrtve' && /ERROR: Video není k dispozici/.test(v.DEADDEADDE1.duvod), 'smazané video → mrtvé s důvodem ze stránky');
  ok(v.NOEMBEDNOE1 && v.NOEMBEDNOE1.stav === 'ok' && v.NOEMBEDNOE1.vkladani === false, 'zakázané vkládání → žije, ale nejde vložit');
  ok(v.PRIVATEPRI1 && v.PRIVATEPRI1.stav === 'mrtve' && /soukromé/.test(v.PRIVATEPRI1.duvod), 'soukromé video → mrtvé');
  ok(v.SIMPLETXT01 && v.SIMPLETXT01.stav === 'mrtve' && /Video není dostupné/.test(v.SIMPLETXT01.duvod), 'důvod ve tvaru simpleText se přečte');
  ok(v.BOTBOTBOTB1 && v.BOTBOTBOTB1.stav === 'nelze', 'zeď „nejste robot" → neověřitelné, ne mrtvé');
  ok(v.ERR500ERR51 && v.ERR500ERR51.stav === 'nelze', 'opakovaná 500 → neověřitelné (po opakování)');
  ok(v.NOSTATUSNO1 && v.NOSTATUSNO1.stav === 'nelze' && /formát/.test(v.NOSTATUSNO1.duvod), 'stránka bez stavu → neověřitelné, ne „žije"');

  console.log('── Celý běh ──');
  const PRVNI = [...videa.keys()].find(id => videa.get(id).every(u => u.druh === 'odkaz'));
  const VLOZENE = [...videa.keys()].find(id => videa.get(id).some(u => u.druh === 'embed'));
  const mrtvyKanarek = id => id === K.KANAREK ? { o: 404, w: stranka('ERROR', '"Video není k dispozici"') } : { o: 200 };

  scenar = mrtvyKanarek; dotazu = 0;
  let r = await spust([SKRIPT]);
  ok(r.kod === 0 && new RegExp(`${videa.size} / ${videa.size} v pořádku`).test(r.out), `zdravý stav → kód 0, ${videa.size} / ${videa.size}`);
  ok(dotazu >= videa.size + 1, `ověřil každé video i kanárka (${dotazu} dotazů)`);

  scenar = id => id === PRVNI ? CHOVANI.DEADDEADDE1 : mrtvyKanarek(id);
  r = await spust([SKRIPT]);
  const misto = videa.get(PRVNI)[0];
  ok(r.kod === 1 && r.out.includes('MRTVÉ') && r.out.includes(PRVNI) && r.out.includes(`${misto.soubor}:${misto.radek}`),
    `mrtvé video → kód 1, hláška s ID a místem (${misto.soubor}:${misto.radek})`);

  scenar = id => id === VLOZENE ? CHOVANI.NOEMBEDNOE1 : mrtvyKanarek(id);
  r = await spust([SKRIPT]);
  ok(r.kod === 1 && /vkládání zakázal/.test(r.out) && r.out.includes(VLOZENE), 'vložené video bez povoleného vkládání → kód 1');

  scenar = () => ({ o: 200 });
  r = await spust([SKRIPT]);
  ok(r.kod === 1 && /kanárek .* „žije"/.test(r.out), 'slepé měřidlo (kanárek „žije") → kód 1');

  const rep = path.join(tmp, 'report.md');
  r = await spust([SKRIPT], { YT_OEMBED: 'https://nikdy-neexistuje.invalid/oembed', YT_WATCH: 'https://nikdy-neexistuje.invalid/watch', VIDEA_REPORT: rep });
  ok(r.kod === 1 && /NELZE OVĚŘIT/.test(r.out) && /kanárka nešlo ověřit/.test(r.out), 'nedostupná síť → kód 1 a hláška proč, ne tichá nula');
  ok(fs.existsSync(rep) && /Videa na YouTube/.test(fs.readFileSync(rep, 'utf8')), 'souhrn se zapíše do VIDEA_REPORT (tělo issue)');
  srv.close();
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log('── Workflow ──');
  const wf = fs.existsSync(WORKFLOW) ? fs.readFileSync(WORKFLOW, 'utf8') : '';
  ok(/schedule:\s*\n\s*- cron:/.test(wf) && /workflow_dispatch/.test(wf), 'workflow běží podle rozvrhu i ručně');
  ok(/node \.github\/scripts\/check-videos\.js/.test(wf), 'workflow spouští tenhle skript');
  ok(!/continue-on-error:\s*true/.test(wf) && !/check-videos\.js[^\n]*\|\|/.test(wf), 'neúspěch se nemaskuje (žádné continue-on-error ani || true)');

  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
