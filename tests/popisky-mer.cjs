/* ══════════════════════════════════════════════════════════════════════
   Měřidlo popisků v SVG kresbách — JEDNO pro všechny testy.

   Vzniklo z `rpg-diagramy-geometrie` §9 (popisek přes čáru, 222 → 0 v bankách
   úloh). Velký průchod 5. 10. 2026 pak ukázal, že tytéž vady leží i tam, kam
   §9 nedosáhl: výklad 3.–9. ročníku (31 popisků v 17 kresbách), doplňky
   k řešením přijímaček (7) a snímky konstrukcí v rozboru (711 ve 240 snímcích).
   Kopie měřidla v každém testu by se rozešly, proto je tady a testy si ho
   posílají do prohlížeče jako zdroj:

     const { mer } = require('./popisky-mer.cjs');
     await page.evaluate(([src, jm]) => new Function('return ' + src)()([...document.querySelectorAll('svg')], jm), [mer.toString(), 'teorie']);

   Pro každý viditelný popisek (<text>) hlásí:
     cara    — přes rámeček popisku vede úsečka, hrana mnohoúhelníku, křivka,
               kružnice/elipsa nebo hrana obdélníku (kromě obdélníku, který
               popisek celý obepíná — podklad pod textem); čára bez tahu,
               skrytá nebo průhledná se nepočítá,
     prekryv — dva popisky přes sebe,
     orez    — popisek vyčuhuje z plochy kresby (přes 2 px).
   Rámeček textu je ten, který kreslí prohlížeč (getBoundingClientRect), tedy
   včetně horního a dolního dotahu písma — přísnější než samotné tahy písmen.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

function mer(svgs, jm) {
  const cara = [], prekryv = [], orez = []; let textu = 0, kreseb = 0;
  for (const svg of svgs) {
    const S = svg.getBoundingClientRect(); if (S.width < 20 || S.height < 20) continue;
    kreseb++;
    const T = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && t.getBoundingClientRect().width > 0).map(el => ({ el, q: el.getBoundingClientRect() }));
    textu += T.length;
    const body = [], m = el => el.getScreenCTM(), bod = (el, x, y) => { const c = m(el); return [c.a * x + c.c * y + c.e, c.b * x + c.d * y + c.f]; };
    const usek = (el, a, b) => { for (let i = 0; i <= 80; i++) body.push({ el, p: bod(el, a[0] + (b[0] - a[0]) * i / 80, a[1] + (b[1] - a[1]) * i / 80) }); };
    for (const el of svg.querySelectorAll('line')) usek(el, [el.x1.baseVal.value, el.y1.baseVal.value], [el.x2.baseVal.value, el.y2.baseVal.value]);
    for (const el of svg.querySelectorAll('polygon,polyline')) { const p = [...el.points].map(q => [q.x, q.y]);
      for (let i = 0; i + 1 < p.length + (el.tagName === 'polygon' ? 1 : 0); i++) usek(el, p[i], p[(i + 1) % p.length]); }
    for (const el of svg.querySelectorAll('path,circle,ellipse')) { let L = 0; try { L = el.getTotalLength(); } catch (e) { L = 0; }
      for (let i = 0; i <= 120 && L; i++) { const q = el.getPointAtLength(L * i / 120); body.push({ el, p: bod(el, q.x, q.y) }); } }
    for (const el of svg.querySelectorAll('rect')) { const x = el.x.baseVal.value, y = el.y.baseVal.value, w = el.width.baseVal.value, h = el.height.baseVal.value;
      usek(el, [x, y], [x + w, y]); usek(el, [x + w, y], [x + w, y + h]); usek(el, [x + w, y + h], [x, y + h]); usek(el, [x, y + h], [x, y]); }
    const popis = svg.getAttribute('aria-label') || '';
    const styl = new Map(), st = el => { if (!styl.has(el)) styl.set(el, getComputedStyle(el)); return styl.get(el); };
    for (const t of T) {
      const q = t.q, zas = new Set();
      for (const b of body) {
        const s = st(b.el); if (s.stroke === 'none' || parseFloat(s.strokeWidth) === 0 || s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) continue;
        if (b.el.tagName === 'rect') { const R = b.el.getBoundingClientRect(); if (R.left <= q.left + 1 && R.right >= q.right - 1 && R.top <= q.top + 1 && R.bottom >= q.bottom - 1) continue; }
        if (b.p[0] > q.left + 1 && b.p[0] < q.right - 1 && b.p[1] > q.top + 1 && b.p[1] < q.bottom - 1) zas.add(b.el.tagName + (b.el.getAttribute('class') ? '.' + b.el.getAttribute('class').split(' ')[0] : ''));
      }
      if (zas.size) cara.push(jm + ' ' + popis.slice(0, 40) + ': „' + t.el.textContent.trim() + '" × ' + [...zas].join(','));
      if (q.left < S.left - 2 || q.right > S.right + 2 || q.top < S.top - 2 || q.bottom > S.bottom + 2) orez.push(jm + ' ' + popis.slice(0, 40) + ': „' + t.el.textContent.trim() + '"');
    }
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) { const A = T[i].q, B = T[j].q;
      if (Math.min(A.right, B.right) - Math.max(A.left, B.left) > 1 && Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top) > 1)
        prekryv.push(jm + ' ' + popis.slice(0, 40) + ': „' + T[i].el.textContent.trim() + '" × „' + T[j].el.textContent.trim() + '"'); }
  }
  return { cara, prekryv, orez, textu, kreseb };
}

module.exports = { mer };
