/* ══════════════════════════════════════════════════════════════════════
   GEOMETRIE KRESEB — hlídá UMÍSTĚNÍ, ne existenci.

   PROČ ZVLÁŠŤ. Ostatní testy nad kresbami se ptají „je tam <svg>?",
   „má viewBox?", „nesvítí magenta?". Žádný z nich se neptá, jestli
   popisek sedí u TÉ hrany, kterou popisuje, a jestli oblouk úhlu
   vyznačuje TEN úhel. Vojta nahlásil tři takové vady z obrazovky —
   strojově je nenašel nikdo, protože z pohledu kódu bylo vše v pořádku:
   platné SVG, žádné NaN, nic nepřeteklo.

   Čtyři vady, které tenhle test REPRODUKUJE na staré verzi:
   1. Oblouky úhlů na rovnoběžkách měly obrácený příznak `sweep`. V SVG
      roste y dolů, takže kladný vektorový součin znamená sweep=1; se
      špatným příznakem sáhne prohlížeč (large-arc=0) po druhém možném
      středu, zrcadleném přes tětivu. Naměřeno: všech 48 oblouků leželo
      mimo kružnici u vrcholu, nejhorší o 19,3 px při poloměru 20.
   2. Popisky vrcholů trojúhelníku se odsazovaly podle POŘADÍ v poli.
      U pravoúhlého je ale první bod vlevo DOLE, takže popisek skončil
      uvnitř obrazce, přímo na značce pravého úhlu.
   3. Hloubka `c` u kvádru seděla u SVISLÉ hrany vpravo — tedy u téže
      hrany, kterou vyznačuje výška `b`. Rozměry a, b, c jsou přitom
      z definice tři hrany z JEDNOHO vrcholu (tři různé směry).
   4. Rameno úhlu mělo pevných 170 px a nad ~50° vyjelo z viewBoxu.
      Ořez je TICHÝ: obsah mimo viewBox se nenakreslí a stránka
      nepřeteče. Generátory v 6. ročníku přitom losují až ri(100,160).

   Ověřeno proti ostrým papírům CERMATu (M9C/2024 úloha 6, M9A/2023
   úloha 12): oblouk úhlu má střed ve vrcholu a vypouklý je ven, popisky
   vrcholů leží vně obrazce a každý rozměr stojí u své vlastní hrany.

   Spusť: node tests/rpg-diagramy-geometrie.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

/* ── načtení kreslicích funkcí ─────────────────────────────────────── */
const EXPORT = '\n;return {svgAngle,svgCross,svgCuboid,svgTriangle,svgRightTri,svgMirror,' +
  'svgPointSym,svgParallelogram,svgTrapezoid,svgLineGraph,svgCylinder,svgCone,svgSphere,svgSimilar,svgNumLine};';
const jadroSrc = fs.readFileSync(path.join(ROOT, 'projects/rpg-svg-9.js'), 'utf8');
const JADRO = new Function(jadroSrc + EXPORT)();

/* Vytáhne jmenované funkce z HTML hry. Podle JMÉNA, ne podle čísel řádků —
   rozsahy natvrdo se rozejdou při první úpravě (viz CLAUDE.md). */
function funkceZeHry(soubor, jmena) {
  const src = fs.readFileSync(path.join(ROOT, soubor), 'utf8');
  return jmena.map(jm => {
    const i = src.indexOf('\nfunction ' + jm + '(');
    if (i < 0) throw new Error(soubor + ': nenalezeno ' + jm);
    return src.slice(i + 1, src.indexOf('\n}\n', i) + 2);
  }).join('\n');
}

/* Banka testu nanečisto — kresby úhlů na rovnoběžkách jsou uvnitř ní. */
function bankaCermat() {
  const g = {
    window: {}, ri: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
    gcd: function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); },
    cz: n => String(n).replace('.', ','),
    skl: (n, o, f, m) => (n === 1 ? o : (n >= 2 && n <= 4 ? f : m)),
  };
  Object.assign(g, JADRO);
  const jm = Object.keys(g);
  new Function(...jm, fs.readFileSync(path.join(ROOT, 'projects/rpg-cermat-9.js'), 'utf8'))(...jm.map(k => g[k]));
  return g.window.RPG_CERMAT_9;
}

(async () => {
  console.log('\n── Geometrie kreseb: oblouky, popisky, ořez ──\n');

  /* ── 1. kopie v 6./7. ročníku mají SHODNOU geometrii se sdíleným jádrem ──
     Hry si nesou vlastní kopie kreslicích funkcí (jiná paleta). Když se
     oprava udělá jen v jádře, kopie zůstanou vadné a nikde to nespadne —
     doložený vzorec „dvě kresby téže postavy se rozejdou". Barvy se proto
     znormalizují a zbytek musí sedět ZNAK PO ZNAKU. */
  {
    const bezBarev = s => s.replace(/#[0-9a-fA-F]{6}\b/g, '#');
    const KOPIE = [
      ['projects/rpg-mat-6.html', ['svgAngle', 'svgCross', 'svgCuboid', 'svgTriangle', 'svgMirror']],
      ['projects/rpg-mat-7.html', ['svgAngle', 'svgCross', 'svgCuboid', 'svgTriangle', 'svgMirror',
        'svgPointSym', 'svgParallelogram', 'svgTrapezoid']],
    ];
    const rozdilne = []; let porovnano = 0;
    for (const [soubor, jmena] of KOPIE) {
      for (const jm of jmena) {
        const kopie = bezBarev(funkceZeHry(soubor, [jm]).trim());
        const zdroj = bezBarev(funkceZeHry('projects/rpg-svg-9.js', [jm]).trim());
        porovnano++;
        if (kopie !== zdroj) {
          const i = [...kopie].findIndex((c, k) => c !== zdroj[k]);
          rozdilne.push(path.basename(soubor) + '/' + jm + ' se liší od znaku ' + i +
            ': „' + kopie.slice(Math.max(0, i - 25), i + 25) + '"');
        }
      }
    }
    ok(porovnano === 13, 'porovnáno ' + porovnano + ' kopií kreslicích funkcí (6. a 7. ročník)');
    ok(rozdilne.length === 0, 'kopie v hrách mají shodnou geometrii se sdíleným jádrem (liší se jen barvy)',
      rozdilne.slice(0, 2).join(' | '));
  }

  const br = await chromium.launch({ headless: true, executablePath: CHROME });
  const page = await br.newPage();
  await page.setContent('<!DOCTYPE html><body></body>');

  /* ── 2. oblouk úhlu leží na kružnici SE STŘEDEM VE VRCHOLU ──
     Neměří se zdroják, ale SKUTEČNĚ VYKRESLENÁ křivka (getPointAtLength).
     Kdyby se kontrolovalo jen „v `d` je správný příznak", byl by to opis
     kódu; takhle se měří, co dítě uvidí. */
  {
    const C = bankaCermat();
    const vz = new Map();
    for (let i = 0; i < 8000 && vz.size < 12; i++) {
      const t = C.genSlot(6);
      if (t && t.svg && /rovnoběžk/i.test(t.title || '')) {
        const u = (t.intro.match(/(\d+)°/) || [])[1];
        if (u && !vz.has(u)) vz.set(u, t.svg);
      }
    }
    const r = await page.evaluate(({ vz }) => {
      /* průsečíky příčky s rovnoběžkami — pevné body kresby */
      const VRCH = [{ x: 172, y: 52 }, { x: 120, y: 134 }], R = 20;
      const out = [];
      for (const [uhel, svgStr] of vz) {
        const d = document.createElement('div'); d.innerHTML = svgStr; document.body.appendChild(d);
        d.querySelectorAll('path').forEach((p, i) => {
          const L = p.getTotalLength(), body = [];
          for (let k = 0; k <= 12; k++) body.push(p.getPointAtLength(L * k / 12));
          const V = VRCH.reduce((a, b) =>
            Math.hypot(body[0].x - a.x, body[0].y - a.y) <= Math.hypot(body[0].x - b.x, body[0].y - b.y) ? a : b);
          let max = 0;
          body.forEach(q => { max = Math.max(max, Math.abs(Math.hypot(q.x - V.x, q.y - V.y) - R)); });
          out.push({ uhel, i, odchylka: +max.toFixed(2) });
        });
        d.remove();
      }
      return out;
    }, { vz: [...vz.entries()] });
    const mimo = r.filter(x => x.odchylka > 0.5);
    ok(r.length >= 30, 'změřeno ' + r.length + ' oblouků úhlů (pojistka proti běhu naprázdno)');
    ok(mimo.length === 0,
      'každý oblouk leží na kružnici se středem ve vrcholu (největší odchylka ' +
      Math.max(0, ...r.map(x => x.odchylka)).toFixed(2) + ' px, práh 0,5)',
      mimo.slice(0, 3).map(x => x.uhel + '° oblouk#' + x.i + ' → ' + x.odchylka + ' px').join(' | '));
  }

  /* ── 2b. totéž pro oblouky, které nesou svůj vrchol ──
     Kresby úhlů v pozici 7 testu nanečisto (přímky jedním bodem, kružnice
     opsaná, trojúhelník z přímek) mají vrcholy pokaždé jinde — počítají se
     z úhlů —, takže pevný seznam vrcholů jako výše nestačí. Oblouk proto
     nese střed v `data-vrchol` a měří se proti němu, zase na VYKRESLENÉ
     křivce. Špatný příznak sweep dá odchylku v desítkách pixelů. */
  {
    const C = bankaCermat(), kresby = new Set();
    for (let i = 0; i < 6000; i++) {
      const t = C.genSlot(6);
      if (t && t.svg && /data-vrchol/.test(t.svg)) kresby.add(t.svg);
    }
    const r = await page.evaluate(svgs => {
      const out = [];
      for (const s of svgs) {
        const d = document.createElement('div'); d.innerHTML = s; document.body.appendChild(d);
        d.querySelectorAll('path[data-vrchol]').forEach(p => {
          const [vx, vy] = p.dataset.vrchol.split(' ').map(Number), R = +p.dataset.r, L = p.getTotalLength();
          let max = 0;
          for (let k = 0; k <= 12; k++) { const q = p.getPointAtLength(L * k / 12); max = Math.max(max, Math.abs(Math.hypot(q.x - vx, q.y - vy) - R)); }
          out.push(+max.toFixed(2));
        });
        d.remove();
      }
      return out;
    }, [...kresby]);
    /* Naměřeno: 104 různých kreseb, 403 oblouků, největší odchylka 0,10 px
       (zaokrouhlení souřadnic na desetiny). */
    ok(r.length >= 200, 'změřeno ' + r.length + ' oblouků s vyznačeným vrcholem v ' + kresby.size + ' kresbách (podlaha 200)');
    ok(r.every(x => x <= 0.5), 'každý oblouk s vyznačeným vrcholem leží na kružnici kolem něj (největší odchylka ' +
      Math.max(0, ...r).toFixed(2) + ' px, práh 0,5)');
  }

  /* ── 3. popisek vrcholu trojúhelníku leží VNĚ obrazce ──
     Práh 0 px by byl křehký (písmeno se dotýká hrany), proto se měří
     střed popisku a ten musí být mimo mnohoúhelník. Navíc nesmí padnout
     na značku pravého úhlu — přesně to se stalo popisku C. */
  {
    const kresby = [];
    for (const kind of ['rovnostr', 'rovnoram', 'pravo', 'obecny'])
      for (const v of [['A', 'B', 'C'], ['C', 'A', 'B'], ['K', 'L', 'M']])
        kresby.push({ jm: kind + ' ' + v.join(''), svg: JADRO.svgTriangle(kind, { v }) });
    const r = await page.evaluate(({ kresby }) => {
      const uvnitr = (px, py, pts) => { // sudá/lichá metoda
        let z = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) z = !z;
        }
        return z;
      };
      const out = [];
      for (const k of kresby) {
        const d = document.createElement('div'); d.innerHTML = k.svg; document.body.appendChild(d);
        const svg = d.querySelector('svg');
        const pts = svg.querySelector('polygon').getAttribute('points').trim().split(/\s+/)
          .map(s => s.split(',').map(Number));
        const znacka = svg.querySelector('rect');
        const zb = znacka ? { x: +znacka.getAttribute('x'), y: +znacka.getAttribute('y'),
          w: +znacka.getAttribute('width'), h: +znacka.getAttribute('height') } : null;
        svg.querySelectorAll('text').forEach(t => {
          const b = t.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
          out.push({ jm: k.jm, txt: t.textContent,
            uvnitr: uvnitr(cx, cy, pts),
            naZnacce: !!zb && cx > zb.x - 1 && cx < zb.x + zb.w + 1 && cy > zb.y - 1 && cy < zb.y + zb.h + 1 });
        });
        d.remove();
      }
      return out;
    }, { kresby });
    const spatne = r.filter(x => x.uvnitr || x.naZnacce);
    ok(r.length === 36, 'změřeno ' + r.length + ' popisků vrcholů (4 tvary × 3 sady písmen × 3 vrcholy)');
    ok(spatne.length === 0, 'žádný popisek vrcholu neleží uvnitř obrazce ani na značce pravého úhlu',
      spatne.slice(0, 3).map(x => x.jm + ' „' + x.txt + '"' + (x.naZnacce ? ' na značce' : ' uvnitř')).join(' | '));
  }

  /* ── 4. každý rozměr kvádru stojí u hrany SVÉHO směru ──
     Kvádr má dvanáct hran ve TŘECH směrech (šířka, výška, hloubka) a
     rozměry a, b, c jsou z definice tři hrany vycházející z jednoho vrcholu,
     tedy po jedné z každého směru. Kontrola tedy zní: pro každý popisek
     najdi ze VŠECH DVANÁCTI hran tu nejbližší a její směr musí sedět.

     ⚠️ První verze porovnávala jen dvě hrany (svislou vs. ustupující) a byla
     to SLABÁ NÁHRAŽKA: starý popisek ležel daleko vpravo ZA koncem obou,
     takže mu vyšla blíž ta ustupující a sabotáž „prošla". Vada se pozná až
     na plné dvanáctce, kde starému popisku vyjde nejblíž SVISLÁ hrana vzadu. */
  {
    const r = await page.evaluate(({ svg }) => {
      const d = document.createElement('div'); d.innerHTML = svg; document.body.appendChild(d);
      const s = d.querySelector('svg');
      /* geometrie kresby: přední stěna x..x+w, y-h..y; ustoupení o (dp,-dd) */
      const x = 60, y = 118, w = 104, h = 72, dp = 30, dd = 24;
      const V = (px, py) => [px, py];
      const A = V(x, y), B = V(x + w, y), Cc = V(x + w, y - h), D = V(x, y - h);
      const A2 = V(x + dp, y - dd), B2 = V(x + w + dp, y - dd),
        C2 = V(x + w + dp, y - h - dd), D2 = V(x + dp, y - h - dd);
      const HRANY = [
        ...[[A, B], [D, Cc], [A2, B2], [D2, C2]].map(e => ({ smer: 'šířka', e })),
        ...[[A, D], [B, Cc], [A2, D2], [B2, C2]].map(e => ({ smer: 'výška', e })),
        ...[[A, A2], [B, B2], [Cc, C2], [D, D2]].map(e => ({ smer: 'hloubka', e })),
      ];
      const vzdal = (px, py, [ax, ay], [bx, by]) => {
        const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
        const t = Math.max(0, Math.min(1, L2 ? ((px - ax) * vx + (py - ay) * vy) / L2 : 0));
        return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
      };
      const out = [];
      s.querySelectorAll('text').forEach(t => {
        const b = t.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
        const poradi = HRANY.map(hr => ({ smer: hr.smer, d: vzdal(cx, cy, hr.e[0], hr.e[1]) }))
          .sort((p, q) => p.d - q.d);
        out.push({ txt: t.textContent, nejblizsi: poradi[0].smer,
          d1: +poradi[0].d.toFixed(1),
          d2: +(poradi.find(p => p.smer !== poradi[0].smer) || { d: 0 }).d.toFixed(1) });
      });
      d.remove();
      return out;
    }, { svg: JADRO.svgCuboid('50 cm', '30 cm', '40 cm') });
    const ocekavano = { '50 cm': 'šířka', '30 cm': 'výška', '40 cm': 'hloubka' };
    const spatne = r.filter(t => ocekavano[t.txt] !== t.nejblizsi);
    ok(r.length === 3, 'kvádr má tři popisky rozměrů (naměřeno ' + r.length + ')');
    ok(spatne.length === 0,
      'každý rozměr stojí u hrany svého směru (nejtěsnější odstup ' +
      Math.min(...r.map(t => t.d2 - t.d1)).toFixed(1) + ' px)',
      spatne.map(t => '„' + t.txt + '" (má být ' + ocekavano[t.txt] + ') je nejblíž hraně směru ' +
        t.nejblizsi + ' — ' + t.d1 + ' px').join(' | '));
  }

  /* ── 5. nic se neořezává viewBoxem ──
     🔴 getBBox() vrací rozměr v MÍSTNÍ soustavě prvku, takže uvnitř
     <g transform> nesedí s viewBoxem. Měří se proto přes obrazovku a
     přepočítá zpět; obrysová čára je v tom rozměru už započítaná. */
  {
    const kresby = [];
    for (const deg of [10, 35, 50, 75, 90, 110, 140, 160])
      kresby.push({ jm: 'svgAngle(' + deg + ')', svg: JADRO.svgAngle(deg, { label: deg + '°' }) });
    for (const deg of [20, 45, 60, 80, 100, 130])
      kresby.push({ jm: 'svgCross(' + deg + ')', svg: JADRO.svgCross(deg) });
    for (const kind of ['rovnostr', 'rovnoram', 'pravo', 'obecny'])
      kresby.push({ jm: "svgTriangle('" + kind + "')", svg: JADRO.svgTriangle(kind) });
    /* Nejdelší popisek, který banka i hry dnes vydají, má PĚT znaků
       (naměřeno nad 6 400 generováními: „30 cm" / „40 cm"). Zkouší se šest,
       tedy jeden znak rezervy — víc by byl vymyšlený případ. */
    kresby.push({ jm: 'svgCuboid 6 znaků', svg: JADRO.svgCuboid('120 cm', '250 cm', '333 cm') });
    kresby.push({ jm: 'svgRightTri(12,5)', svg: JADRO.svgRightTri(12, 5, { la: '12 cm', lb: '5 cm', lc: 'c' }) });
    /* + všechny tvary, které skutečně vydá banka testu nanečisto */
    const C = bankaCermat(); const videno = new Set();
    for (let b = 0; b < 400; b++) for (let i = 0; i < C.slotCount(); i++) {
      const t = C.genSlot(i);
      if (!t || !t.svg) continue;
      /* ⚠️ Otisk NESMÍ být zkrácený. První verze brala prvních 200 znaků a
         tím slila 10 různých tvarů pozice 14 do jednoho — popisky grafu leží
         v SVG až za znakem 200, takže se vybral vždy ten první a pravidlo
         o překryvu popisků bylo SLEPÉ (sabotáž „prošla"). */
      const klic = i + '::' + t.svg.replace(/-?[\d.]+/g, '#');
      if (!videno.has(klic)) { videno.add(klic); kresby.push({ jm: 'banka/pozice ' + (i + 1), svg: t.svg }); }
    }
    const r = await page.evaluate(({ kresby }) => {
      const out = []; let mereno = 0;
      for (const k of kresby) {
        const d = document.createElement('div');
        d.style.cssText = 'width:260px'; d.innerHTML = k.svg; document.body.appendChild(d);
        const svg = d.querySelector('svg');
        svg.style.cssText = 'display:block;width:260px;height:auto';
        const vb = svg.viewBox.baseVal, R = svg.getBoundingClientRect(), s = vb.width / R.width;
        svg.querySelectorAll('*').forEach(el => {
          if (!el.getBBox) return;
          const c = el.getBoundingClientRect();
          if (!c.width && !c.height) return;
          mereno++;
          const L = vb.x + (c.left - R.left) * s, T = vb.y + (c.top - R.top) * s;
          const P = L + c.width * s, B = T + c.height * s, tol = 0.6;
          const ven = [];
          if (L < vb.x - tol) ven.push('vlevo o ' + (vb.x - L).toFixed(1));
          if (T < vb.y - tol) ven.push('nahoře o ' + (vb.y - T).toFixed(1));
          if (P > vb.x + vb.width + tol) ven.push('vpravo o ' + (P - vb.x - vb.width).toFixed(1));
          if (B > vb.y + vb.height + tol) ven.push('dole o ' + (B - vb.y - vb.height).toFixed(1));
          if (ven.length) out.push(k.jm + ' · ' + el.tagName +
            (el.textContent ? ' „' + el.textContent.trim().slice(0, 14) + '"' : '') + ' → ' + ven.join(', '));
        });
        d.remove();
      }
      return { out, mereno };
    }, { kresby });
    /* Podlahy jsou NAMĚŘENÉ, ne odhadnuté: 20 ručních kreseb + 11 tvarů
       z banky (počet tvarů vyšel v pěti bězích po sobě shodně 11, protože
       se losují čísla, ne tvary) = 31 kreseb a 179 prvků. Podlaha leží pod
       tím s rezervou na kolísání; rozbité vykreslení dá 0, takže velkorysá
       podlaha nic nestojí. */
    ok(kresby.length >= 26 && r.mereno >= 140,
      'proměřeno ' + r.mereno + ' prvků v ' + kresby.length + ' kresbách (podlaha 140 / 26)');
    ok(r.out.length === 0, 'žádný prvek kresby nepřesahuje svůj viewBox (tichý ořez)',
      r.out.slice(0, 3).join(' | '));

    /* ── 6. dva popisky se nesmí PŘEKRÝT ──
       Překryv je druhá tichá vada: SVG nic nehlásí, jen se text vykreslí
       přes text a přečíst to nejde. Naměřeno na sloupcovém grafu s měsíci:
       „červen" a „červenec" mají při pevných 11 px šířku 40 a 53 px, ale
       rozteč sloupce je 41 px, takže se slily. Měří se skutečné rámečky,
       ne odhad šířky ze zdrojáku. */
    const p = await page.evaluate(({ kresby }) => {
      const out = []; let dvojic = 0;
      for (const k of kresby) {
        const d = document.createElement('div');
        d.style.cssText = 'width:260px'; d.innerHTML = k.svg; document.body.appendChild(d);
        const svg = d.querySelector('svg');
        svg.style.cssText = 'display:block;width:260px;height:auto';
        const t = [...svg.querySelectorAll('text')].map(el => ({ el, b: el.getBoundingClientRect() }));
        for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) {
          dvojic++;
          const A = t[i].b, B = t[j].b;
          const prx = Math.min(A.right, B.right) - Math.max(A.left, B.left);
          const pry = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
          if (prx > 1 && pry > 1) out.push(k.jm + ': „' + t[i].el.textContent.trim() + '" × „' +
            t[j].el.textContent.trim() + '" překryv ' + prx.toFixed(0) + '×' + pry.toFixed(0) + ' px');
        }
        d.remove();
      }
      return { out, dvojic };
    }, { kresby });
    ok(p.dvojic >= 100, 'porovnáno ' + p.dvojic + ' dvojic popisků (podlaha 100)');
    ok(p.out.length === 0, 'žádné dva popisky se v kresbě nepřekrývají',
      p.out.slice(0, 3).join(' | '));
  }

  await br.close();

  /* ── 7. světlý motiv přijímaček musí mít rozhodnutí o KAŽDÉ barvě ──
     Stránka přijímaček prohání kresby přes `PZ.themeSvg`, který nahrazuje
     barvy podle seznamu `SVG_MAP`. Co v seznamu NENÍ, projde beze změny —
     a protože kresby jsou navržené na tmavé pozadí hry, na bílé to dopadne
     zle a TIŠE. Naměřeno před opravou:
       #101a30 (boční stěna kvádru)  kontrast 17,3 : 1 → černý blok v tělese
       #3a2a52 (neznámý sloupec)     kontrast 12,9 : 1 → černý blok v grafu
       #2a3a5e (pomocné osy)         kontrast 11,3 : 1 → osy tmavší než kresba
       #cfe8ff (popisky pod sloupci) kontrast  1,3 : 1 → text NEVIDITELNÝ
     Pravidlo je proto „každá barva musí být v seznamu", ne „ať to nějak
     vypadá": nutí to u každé nové barvy rozhodnout se vědomě, i kdyby
     rozhodnutí znělo „nechat jak je" (pak se zapíše sama na sebe). */
  {
    const core = fs.readFileSync(path.join(ROOT, 'projects/prijimacky-matematika/prijimacky-core.js'), 'utf8');
    const i = core.indexOf('const SVG_MAP');
    const blok = core.slice(i, core.indexOf('];', i));
    const MAP = [...blok.matchAll(/\['(#[0-9a-f]{3,6})',\s*'(#[0-9a-f]{3,6})'\]/g)].map(m => [m[1], m[2]]);
    const theme = s => { let o = String(s); for (const [a, b] of MAP) o = o.split(a).join(b); return o; };
    const lum = h => {
      const p = h.length === 4 ? '#' + [...h.slice(1)].map(c => c + c).join('') : h;
      const v = [1, 3, 5].map(k => parseInt(p.substr(k, 2), 16) / 255)
        .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    };
    const kontrast = h => 1.05 / (lum(h) + 0.05);

    const C = bankaCermat();
    const barvy = new Map(), textPo = new Map();
    const sber = (s, kde) => {
      for (const m of s.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,6})"/g))
        (barvy.get(m[1]) || barvy.set(m[1], new Set()).get(m[1])).add(kde);
      for (const m of theme(s).matchAll(/<text[^>]*fill="(#[0-9a-fA-F]{3,6})"/g))
        (textPo.get(m[1]) || textPo.set(m[1], new Set()).get(m[1])).add(kde);
    };
    for (let b = 0; b < 300; b++) for (let k = 0; k < C.slotCount(); k++) {
      const t = C.genSlot(k); if (t && t.svg) sber(t.svg, 'banka/pozice ' + (k + 1));
    }
    ([['svgAngle', JADRO.svgAngle(35, { label: 'α' })], ['svgCross', JADRO.svgCross(50)],
      ['svgCuboid', JADRO.svgCuboid('6 m', '5 m', '4 m')], ['svgTriangle', JADRO.svgTriangle('pravo')],
      ['svgRightTri', JADRO.svgRightTri(3, 4)], ['svgMirror', JADRO.svgMirror('L')],
      ['svgPointSym', JADRO.svgPointSym()], ['svgParallelogram', JADRO.svgParallelogram('9', '6')],
      ['svgTrapezoid', JADRO.svgTrapezoid('14', '8', '6')], ['svgLineGraph', JADRO.svgLineGraph(2, -3)],
      ['svgCylinder', JADRO.svgCylinder(5, 12)], ['svgCone', JADRO.svgCone(6, 10)],
      ['svgSphere', JADRO.svgSphere(7)], ['svgSimilar', JADRO.svgSimilar(3)],
      ['svgNumLine', JADRO.svgNumLine(-5, 5, { point: 3 })]]).forEach(([n, s]) => sber(s, n));

    const nemapovane = [...barvy.keys()].filter(c => !MAP.some(([a]) => a === c));
    const slabyText = [...textPo.keys()].filter(c => kontrast(c) < 4.5);
    ok(barvy.size >= 18, 'posbíráno ' + barvy.size + ' barev z kreseb (podlaha 18)');
    ok(nemapovane.length === 0,
      'světlý motiv přijímaček má rozhodnutí o každé barvě kresby (' + MAP.length + ' pravidel)',
      nemapovane.map(c => c + ' (kontrast na bílé ' + kontrast(c).toFixed(1) + ':1, ' +
        [...barvy.get(c)][0] + ')').slice(0, 4).join(' | '));
    ok(slabyText.length === 0,
      'po převodu na světlý motiv je každý popisek čitelný (nejnižší kontrast ' +
      Math.min(...[...textPo.keys()].map(kontrast)).toFixed(1) + ':1, práh 4,5)',
      slabyText.map(c => c + ' → ' + kontrast(c).toFixed(1) + ':1 v ' + [...textPo.get(c)][0]).join(' | '));
  }

  console.log('\n  ' + pass + ' ✅  ' + fail + ' ❌\n');
  process.exit(fail ? 1 : 0);
})();
