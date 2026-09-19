/* ══════════════════════════════════════════════════════════════════════
   Atributy se v profilu ukazují VIZUÁLNĚ, ve všech ročnících.

   Poslední nález z porovnání ročníků (po „egg", mrtvé `checkAns` a
   chybějících minihrách). 2. stupeň měl v profilu pavučinový graf a u
   každého atributu pruh; 1. stupeň jen holé číslo za názvem. Přitom
   data jsou úplně stejná — všech sedm her sbírá tytéž 4 atributy.

   Bylo to obráceně, než by dávalo smysl: čím menší dítě, tím víc mu
   obrázek řekne. Deváťák si „73" přebere sám, třeťák z toho nepozná,
   jestli je to hodně nebo málo, ani v čem je silný.

   Test nekontroluje jen přítomnost funkce (prázdné tělo by prošlo), ale
   vykreslený výsledek: že v grafu jsou VŠECHNY ČTYŘI osy (dřív se
   `craft` v jedné verzi nekreslil a vycházel trojúhelník), že pruh
   opravdu SLEDUJE hodnotu (jinak by stačil natvrdo width:0) a že se
   graf drží uvnitř panelu.

   Spusť: node tests/rpg-attr-radar.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 18995;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GRADES = [3, 4, 5, 6, 7, 8, 9];
const ATTRS = ['calc', 'geo', 'anal', 'craft'];

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

function serve() {
  const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css' };
  const srv = http.createServer((q, p) => {
    let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(ROOT)) { p.writeHead(403); return p.end(); }
    let b = null; try { b = fs.readFileSync(fp); } catch (e) {}
    if (b === null) { p.writeHead(404); return p.end(); }
    p.writeHead(200, { 'Content-Type': mime[u.split('.').pop()] || 'application/octet-stream' });
    p.end(b);
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

(async () => {
  console.log('\n── Atributy v profilu: graf a pruhy ──\n');
  const srv = await serve();
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let mereni = 0;
  const nazvy = {};
  try {
    for (const g of GRADES) {
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
      await ctx.route('**/*', r => r.request().url().startsWith('http://localhost:' + PORT) ? r.continue() : r.abort());
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.goto(`http://localhost:${PORT}/projects/rpg-mat-${g}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof startGame === 'function', { timeout: 8000 });

      const r = await page.evaluate((attrs) => {
        localStorage.clear(); startGame('Testovací žák'); S.tutorialDone = true;
        // Záměrně NEROVNOMĚRNÉ hodnoty: kdyby se pruh kreslil natvrdo,
        // vyšly by všechny stejně a rozdíl by test nepoznal.
        const zadano = { calc: 80, geo: 40, anal: 20, craft: 60 };
        attrs.forEach(k => S.attrs[k] = zadano[k]);
        go('profile'); renderProfile();

        const el = document.getElementById('pr-attrs');
        // Pozor: ikony atributů jsou taky <svg>, takže „nějaké svg tu je"
        // by prošlo i bez grafu. Graf poznáme podle mřížky z polygonů.
        const svg = el && [...el.querySelectorAll('svg')]
          .find(s => s.querySelectorAll('polygon').length >= 2);
        const rows = [...(el ? el.querySelectorAll('.attr-row') : [])];
        const sirky = rows.map(rw => {
          const in_ = rw.querySelector('.bar-in');
          return in_ ? Math.round(in_.getBoundingClientRect().width) : null;
        });
        const panel = el ? el.getBoundingClientRect() : null;
        const gr = svg ? svg.getBoundingClientRect() : null;
        return {
          zadano,
          maSvg: !!svg,
          // datový polygon má tolik vrcholů, kolik je os
          osy: svg ? Math.max(0, ...[...svg.querySelectorAll('polygon')]
            .map(p => (p.getAttribute('points') || '').trim().split(/\s+/).length)) : 0,
          radku: rows.length,
          nazvy: rows.map(rw => (rw.querySelector('.attr-nm') || {}).textContent || ''),
          sirky,
          precniva: (panel && gr) ? (gr.width > panel.width + 1) : false,
        };
      }, ATTRS);

      /* ── Popisky v grafu se nesmí přetisknout ────────────────────────
         Hodnota jede po ose za svým vrcholem (poloměr v+18 %), ikona osy
         sedí na pevném poloměru. Dřív byla ikona na 120 %, takže se při
         atributu 100 potkaly na 1,2 px a číslo se vykreslilo PŘES ikonu.
         SVG na to nijak neupozorní — jen se text přetiskne přes text,
         což je v tomhle repu doložená třída tichých vad.

         Měří se VYKRESLENÝ text přes getBoundingClientRect přepočtený na
         jednotky viewBoxu; `getBBox` vrací rozměr v místní soustavě, takže
         uvnitř <g transform> nesedí. A čte se všech šest složek viewBoxu,
         ne předpoklad „0 0 …".

         Ověřeno sabotáží: návrat ikony na 120 % shodí tuhle kontrolu ve
         všech sedmi ročnících (a jen ji). */
      const pop = await page.evaluate(() => {
        const STAVY = [
          ['start (vše 0)', { calc: 0, geo: 0, anal: 0, craft: 0 }],
          ['rozehráno', { calc: 48, geo: 33, anal: 51, craft: 27 }],
          ['zkušený', { calc: 87, geo: 72, anal: 96, craft: 64 }],
          ['na stropě', { calc: 100, geo: 100, anal: 100, craft: 100 }],
          ['přes strop', { calc: 240, geo: 180, anal: 300, craft: 150 }],
        ];
        const out = { mereno: 0, nalezy: [], nejmensiMezera: 999 };
        const host = document.createElement('div');
        host.style.cssText = 'position:absolute;left:0;top:0;width:400px';
        document.body.appendChild(host);
        const prekryv = (a, b) => {
          const px = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const py = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          return px > 0 && py > 0 ? { px, py } : null;
        };
        for (const [jmeno, attrs] of STAVY) {
          host.innerHTML = svgAttrRadar(attrs);
          const svg = host.querySelector('svg'); if (!svg) continue;
          const vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
          if (vb.length !== 4 || vb.some(n => !Number.isFinite(n))) continue;
          const box = svg.getBoundingClientRect();
          const sx = vb[2] / box.width, sy = vb[3] / box.height;
          const ram = el => {
            const b = el.getBoundingClientRect();
            return { x: vb[0] + (b.left - box.left) * sx, y: vb[1] + (b.top - box.top) * sy,
                     w: b.width * sx, h: b.height * sy, t: (el.textContent || 'ikona').trim() };
          };
          const hodnoty = [...svg.querySelectorAll('text')].filter(t => (t.textContent || '').trim()).map(ram);
          const ikony = [...svg.querySelectorAll('g')].map(ram);
          if (hodnoty.length !== 4 || ikony.length !== 4) {
            out.nalezy.push(`${jmeno}: čekám 4 hodnoty a 4 ikony, mám ${hodnoty.length}/${ikony.length}`);
            continue;
          }
          out.mereno++;
          for (let i = 0; i < hodnoty.length; i++) {
            for (const ik of ikony) {
              const p = prekryv(hodnoty[i], ik);
              if (p) out.nalezy.push(`${jmeno}: hodnota „${hodnoty[i].t}" se tiskne přes IKONU osy (${p.px.toFixed(1)}×${p.py.toFixed(1)} px)`);
            }
            for (let j = i + 1; j < hodnoty.length; j++) {
              const p = prekryv(hodnoty[i], hodnoty[j]);
              if (p) out.nalezy.push(`${jmeno}: hodnoty „${hodnoty[i].t}" a „${hodnoty[j].t}" přes sebe (${p.px.toFixed(1)}×${p.py.toFixed(1)} px)`);
              const dx = Math.max(0, Math.max(hodnoty[i].x, hodnoty[j].x) - Math.min(hodnoty[i].x + hodnoty[i].w, hodnoty[j].x + hodnoty[j].w));
              const dy = Math.max(0, Math.max(hodnoty[i].y, hodnoty[j].y) - Math.min(hodnoty[i].y + hodnoty[i].h, hodnoty[j].y + hodnoty[j].h));
              out.nejmensiMezera = Math.min(out.nejmensiMezera, Math.hypot(dx, dy));
            }
            const h = hodnoty[i];
            if (h.x < vb[0] - 0.5 || h.y < vb[1] - 0.5 ||
                h.x + h.w > vb[0] + vb[2] + 0.5 || h.y + h.h > vb[1] + vb[3] + 0.5)
              out.nalezy.push(`${jmeno}: hodnota „${h.t}" vyčuhuje z plátna`);
          }
        }
        host.remove();
        return out;
      });

      ok(pop.nalezy.length === 0, `g${g} popisky grafu se nepřetiskují`, pop.nalezy[0] || '');
      // pojistka proti „audit doběhl zeleně a nic neviděl"
      ok(pop.mereno === 5, `g${g} proměřeno všech 5 stavů atributů`, 'změřeno: ' + pop.mereno);

      mereni++;
      nazvy[g] = r.nazvy;
      ok(r.maSvg, `g${g} profil obsahuje graf atributů`);
      ok(r.osy === 4, `g${g} graf má všechny 4 osy (i „craft")`, 'vrcholů: ' + r.osy);
      ok(r.radku === 4, `g${g} vypsané všechny 4 atributy`, 'řádků: ' + r.radku);
      ok(r.sirky.every(w => w !== null), `g${g} každý atribut má pruh`, JSON.stringify(r.sirky));
      // Pruh musí hodnotu SLEDOVAT: zadáno 80/40/20/60 → šířky musí být
      // ostře seřaditelné ve stejném pořadí, ne čtyři stejná čísla.
      const p = r.sirky;
      ok(p.length === 4 && p[0] > p[3] && p[3] > p[1] && p[1] > p[2],
        `g${g} šířka pruhu odpovídá hodnotě (80 > 60 > 40 > 20)`, JSON.stringify(p));
      ok(!r.precniva, `g${g} graf nepřečnívá panel`);
      ok(errs.length === 0, `g${g} bez JS chyby`, errs[0] || '');
      await ctx.close();
    }

    /* Názvy atributů mají být tematické, ne opsané mezi ročníky.
       1. stupeň měl ve všech třech hrách doslova stejný řetězec
       („Výpočty — aritmetika a algebra" i pro třeťáka). */
    const prvniStupen = [3, 4, 5].map(g => JSON.stringify(nazvy[g]));
    ok(new Set(prvniStupen).size === 3,
      '1. stupeň má názvy atributů odlišené podle ročníku (ne kopie)',
      new Set(prvniStupen).size + ' různých ze 3');

    ok(mereni === GRADES.length, `proměřeno všech ${GRADES.length} ročníků (${mereni})`);
  } finally {
    await browser.close(); srv.close();
  }
  console.log(`\n  Atributy v profilu: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
