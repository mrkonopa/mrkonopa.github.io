/* ═════════════════════════════════════════════════════════════════
   Knihovna Supabase je VLASTNÍ kopie s pevnou verzí, ne `cdn.jsdelivr.net/npm/@supabase/supabase-js@2`.

   Před změnou (26. 10. 2026) načítalo `@2` všech 15 stránek s přihlášením a cloudem: IP každého návštěvníka
   odcházela cizímu serveru, „nejnovější 2.x“ se mohla kdykoli změnit bez jediné změny u nás (a rozbít přihlášení
   žáků), a školní filtr mohl cizí doménu zablokovat. Knihovna má 218 kB (55,6 kB gzip). Kopie je v
   `projects/vendor/supabase-js-<verze>.js`, vzniká nástrojem `tools/vendor-supabase.cjs` a má kolem sebe podmínku:
   nenačte se, když `window.supabase` už existuje (testy ho napodobují) nebo na localhost / 127.0.0.1.

   Hlídá se:
     • kopie je neporušená: po vrácení jediné úpravy (`window.supabase=` ↔ `var supabase=`) vyjde sha256 zapsané v
       hlavičce; verze v hlavičce = verze v názvu; ve složce `vendor` je jediná verze;
     • žádná stránka nenačítá Supabase z jsDelivr; každá stránka, která přihlášení používá, odkazuje na kopii
       správnou relativní cestou, která existuje, a PŘED `rpg-cloud.js` (obě jsou `defer`, pořadí rozhoduje);
     • kopie se v prohlížeči SKUTEČNĚ načte (stránka na jiné doméně než localhost) a nabízí všechno, co `rpg-cloud.js`
       volá (`createClient`, `auth.getSession/signOut/signInWithOAuth/onAuthStateChange`, `from`, `rpc`) — seznam se
       bere ze zdroje `rpg-cloud.js`, ne z hlavy;
     • na 127.0.0.1 a s napodobeninou před načtením se knihovna nenačte (testy a vývoj fungují jako dřív).
   Sabotáže (přepis odpovědi, soubory se nemění): odebraná podmínka, porušený bajt knihovny, odkaz zpět na jsDelivr.
   Skutečné přihlášení přes Google tu otestovat nejde (bez sítě a účtu) — po nasazení stačí jednou se přihlásit.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { ROOT, vsechnyHtml } = require('./stranky.cjs');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
const cti = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* ── 1. neporušená kopie ──────────────────────────────────────────── */
const vendDir = path.join(ROOT, 'projects', 'vendor');
const kopie = fs.existsSync(vendDir) ? fs.readdirSync(vendDir).filter(f => /^supabase-js-.*\.js$/.test(f)) : [];
ok(kopie.length === 1 && /^supabase-js-\d+\.\d+\.\d+\.js$/.test(kopie[0]), 've vendor je právě jedna verze knihovny (' + kopie.join(', ') + ')');
const nazev = kopie[0] || 'supabase-js-0.0.0.js', verze = (nazev.match(/(\d+\.\d+\.\d+)/) || [])[1];

function zkontrolujKopii(src, verze) {
  const v = [];
  const hlava = (src.match(/sha256 originálu: ([0-9a-f]{64})/) || [])[1], verHl = (src.match(/@supabase\/supabase-js (\d+\.\d+\.\d+)/) || [])[1];
  if (!hlava) v.push('v hlavičce chybí sha256 originálu');
  if (verHl !== verze) v.push('verze v hlavičce „' + verHl + '“ ≠ verze v názvu „' + verze + '“');
  const zacatek = "if (!window.supabase && !/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(location.hostname)) {\n";
  const i = src.indexOf(zacatek);
  if (i < 0) return v.concat('chybí podmínka (nenačíst na localhostu a nad napodobeninou)');
  let telo = src.slice(i + zacatek.length);
  if (!telo.endsWith('\n}\n')) return v.concat('kopie nekončí uzavřením podmínky');
  telo = telo.slice(0, -3);
  if (!telo.startsWith('window.supabase=')) return v.concat('payload nezačíná window.supabase=');
  const puvodni = telo.replace(/^window\.supabase=/, 'var supabase=');
  const sha = crypto.createHash('sha256').update(puvodni).digest('hex');
  if (hlava && sha !== hlava) v.push('payload nesedí na sha256 z hlavičky (je ' + sha.slice(0, 12) + '…, má být ' + hlava.slice(0, 12) + '…) — knihovna byla upravena');
  return v;
}
const src = cti('projects/vendor/' + nazev);
const vk = zkontrolujKopii(src, verze);
ok(vk.length === 0, 'kopie ' + nazev + ' (' + (src.length / 1e3).toFixed(0) + ' kB) je neporušená: sha256 z hlavičky sedí, podmínka je na místě', vk.join(' | '));
ok(src.length > 150000 && src.length < 400000, 'velikost ' + (src.length / 1e3).toFixed(0) + ' kB je v rozumném rozmezí (originál 218 kB; podlaha 150, strop 400)');

/* ── 2. stránky ───────────────────────────────────────────────────── */
const vady = []; let stranek = 0;
for (const f of vsechnyHtml()) {
  const h = cti(f);
  if (/cdn\.jsdelivr\.net\/npm\/@supabase/.test(h)) vady.push(f + ': pořád načítá Supabase z jsDelivr');
  const m = h.match(/<script[^>]*\bsrc="([^"]*supabase-js[^"]*)"/);
  const cloud = h.search(/<script[^>]*\bsrc="[^"]*rpg-cloud\.js/);
  if (!m) { if (cloud >= 0 && !/rpg-cloud/.test(f)) vady.push(f + ': načítá rpg-cloud.js, ale ne knihovnu Supabase'); continue; }
  stranek++;
  const cil = path.normalize(path.join(path.dirname(path.join(ROOT, f)), m[1]));
  if (cil !== path.join(vendDir, nazev)) vady.push(f + ': odkaz „' + m[1] + '“ nevede na ' + nazev);
  else if (!fs.existsSync(cil)) vady.push(f + ': soubor ' + m[1] + ' neexistuje');
  if (cloud >= 0 && h.indexOf(m[0]) > cloud) vady.push(f + ': knihovna je až ZA rpg-cloud.js');
  /* knihovna `defer` + cloud synchronní = cloud poběží dřív než knihovna; opačně (knihovna synchronní) je to v pořádku */
  const cm = h.match(/<script[^>]*\bsrc="[^"]*rpg-cloud\.js[^"]*"[^>]*>/);
  if (cm && /\bdefer\b/.test(m[0]) && !/\bdefer\b/.test(cm[0])) vady.push(f + ': knihovna má defer, rpg-cloud.js ne (cloud poběží dřív)');
}
ok(vady.length === 0, stranek + ' stránek odkazuje na vlastní kopii správnou cestou, před rpg-cloud.js, bez jsDelivr', vady.slice(0, 3).join(' | '));
ok(stranek >= 15, 'změřeno ' + stranek + ' stránek s knihovnou (podlaha 15; naměřeno 15)');

/* ── 3. v prohlížeči ──────────────────────────────────────────────── */
function pouzivaneMetody() {
  const z = cti('projects/rpg-cloud.js');
  return { auth: [...new Set([...z.matchAll(/client\.auth\.(\w+)\(/g)].map(m => m[1]))].sort(), klient: [...new Set([...z.matchAll(/client\.(from|rpc)\(/g)].map(m => m[1]))].sort() };
}
(async () => {
  console.log('\n── Vlastní kopie knihovny Supabase ──\n');
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const use = pouzivaneMetody();
  ok(use.auth.length >= 4 && use.klient.length === 2, 'rpg-cloud.js volá auth.' + use.auth.join(', ') + ' a client.' + use.klient.join(', '));

  /* stránka na „cizí“ doméně (skola.test), odpovědi z disku; `upravy` mění obsah knihovny */
  async function nacti(host, predSkript, upravy) {
    const c = await browser.newContext(); const p = await c.newPage(); const chyby = [];
    p.on('pageerror', e => chyby.push(e.message));
    await c.route('**/*', r => {
      const u = new URL(r.request().url());
      if (u.pathname === '/__stranka') return r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body>' + (predSkript ? '<script>' + predSkript + '<\/script>' : '') + '<script src="/projects/vendor/' + nazev + '"><\/script>' });
      const f = path.normalize(path.join(ROOT, decodeURIComponent(u.pathname)));
      if (f.startsWith(ROOT + path.sep) && fs.existsSync(f) && fs.statSync(f).isFile()) { let t = fs.readFileSync(f, 'utf8'); if (upravy) t = upravy(t); return r.fulfill({ contentType: 'text/javascript', body: t }); }
      return r.fulfill({ status: 404, body: '' });
    });
    await p.goto('http://' + host + '/__stranka');
    const r = await p.evaluate((use) => {
      const s = window.supabase; if (!s) return { nacteno: false };
      const k = typeof s.createClient === 'function' ? s.createClient('https://x.supabase.co', 'klic') : null;
      return { nacteno: true, mock: !!s.__mock, createClient: typeof s.createClient, auth: use.auth.filter(m => !k || !k.auth || typeof k.auth[m] !== 'function'), klient: use.klient.filter(m => !k || typeof k[m] !== 'function') };
    }, use);
    await c.close(); r.chyby = chyby; return r;
  }

  const ostra = await nacti('skola.test');
  ok(ostra.nacteno && ostra.createClient === 'function' && ostra.auth.length === 0 && ostra.klient.length === 0 && ostra.chyby.length === 0,
    'na jiné doméně než localhost se kopie načte a klient nabízí vše, co rpg-cloud.js volá', JSON.stringify(ostra));
  const pages = await nacti('127.0.0.1');
  ok(!pages.nacteno, 'na 127.0.0.1 se knihovna nenačte (testy a vývoj fungují jako dřív)');
  const lh = await nacti('localhost');
  ok(!lh.nacteno, 'na localhostu se knihovna nenačte');
  const mock = await nacti('skola.test', 'window.supabase = { __mock: true, createClient: function(){ return {}; } };');
  ok(mock.nacteno && mock.mock, 'napodobenina z testu před načtením zůstane (knihovna ji nepřepíše)');

  /* ── sabotáže ─────────────────────────────────────────────────── */
  const bezPodminky = t => t.replace(/if \(!window\.supabase && [^\n]*\{\n/, '').replace(/\n\}\n$/, '\n');
  const s1 = await nacti('127.0.0.1', null, bezPodminky);
  ok(s1.nacteno, 'sabotáž „odebraná podmínka“ je chycena (na 127.0.0.1 se knihovna načetla)');
  const s1b = await nacti('skola.test', 'window.supabase = { __mock: true };', bezPodminky);
  ok(!s1b.mock, 'sabotáž „odebraná podmínka“ přepíše napodobeninu z testu (test to pozná)');
  const rozbita = zkontrolujKopii(src.replace('function t(e,t){', 'function t(e,x){'), verze);
  ok(rozbita.some(x => /sha256/.test(x)), 'sabotáž „změněný bajt knihovny“ je chycena (' + (rozbita[0] || 'nic').slice(0, 70) + ')');
  ok(zkontrolujKopii(src.replace(/sha256 originálu: [0-9a-f]{64}/, 'sha256 originálu: ' + '0'.repeat(64)), verze).some(x => /sha256/.test(x)), 'sabotáž „špatný hash v hlavičce“ je chycena');
  ok(zkontrolujKopii(src.replace("if (!window.supabase && ", "if ("), verze).some(x => /podmínka/.test(x)), 'sabotáž „zkrácená podmínka“ je chycena');

  await browser.close();
  console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
