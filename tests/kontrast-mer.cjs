/* ══════════════════════════════════════════════════════════════════════
   Sdílené měřidlo kontrastu textu. Běží V PROHLÍŽEČI (`page.evaluate(SKEN)`),
   takže tu nesmí být nic z Node. Používá ho `kontrast.audit` (všechny stránky,
   světlý i původní tmavý vzhled) a `prijimacky-motiv` (tmavý režim přijímaček).
   Jedno místo, žádné kopie: pravidlo „pozadí se skládá průhledností a obrázek
   nebo přechod dělá výsledek NEURČITELNÝM" musí být v obou případech totéž.
   ══════════════════════════════════════════════════════════════════════ */
const SKEN = () => {
  const parse = c => {
    const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || '');
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const lum = ({ r, g, b }) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const pomer = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const slozit = (vrch, spod) => ({
    r: vrch.r * vrch.a + spod.r * (1 - vrch.a),
    g: vrch.g * vrch.a + spod.g * (1 - vrch.a),
    b: vrch.b * vrch.a + spod.b * (1 - vrch.a), a: 1,
  });
  const sig = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
    (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');

  const out = { mereno: 0, nejiste: 0, nalezy: [] };
  for (const el of document.querySelectorAll('body *')) {
    const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!txt) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let pruh = 1, p = el;
    while (p && p !== document.documentElement) { pruh *= parseFloat(getComputedStyle(p).opacity || '1'); p = p.parentElement; }
    if (pruh < 0.15) continue;

    const fg0 = parse(cs.color); if (!fg0) continue;
    let obrazek = false, nasel = false, q = el;
    const vrstvy = [];
    while (q) {
      const qs = getComputedStyle(q);
      if (qs.backgroundImage && qs.backgroundImage !== 'none') { obrazek = true; break; }
      const c = parse(qs.backgroundColor);
      if (c && c.a > 0) { vrstvy.push(c); if (c.a >= 0.999) { nasel = true; break; } }
      q = q.parentElement;
    }
    if (obrazek) { out.nejiste++; continue; }
    if (!nasel) vrstvy.push({ r: 255, g: 255, b: 255, a: 1 });
    const bg = vrstvy.reduceRight((spod, vrch) => slozit(vrch, spod));
    const fg = fg0.a >= 0.999 ? fg0 : slozit(fg0, bg);

    const vel = parseFloat(cs.fontSize) || 16;
    const tucne = (parseInt(cs.fontWeight, 10) || 400) >= 700;
    const prah = (vel >= 24 || (vel >= 18.66 && tucne)) ? 3.0 : 4.5;
    const pom = pomer(fg, bg);
    out.mereno++;
    if (pom + 0.005 < prah) {
      out.nalezy.push({
        kde: sig(el), txt: txt.slice(0, 40).replace(/\s+/g, ' '),
        pom: +pom.toFixed(2), prah, vel: Math.round(vel),
        fg: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,
      });
    }
  }
  out.nalezy.sort((a, b) => a.pom - b.pom);
  return out;
};

module.exports = { SKEN };
