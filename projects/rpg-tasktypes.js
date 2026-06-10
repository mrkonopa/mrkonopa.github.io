/* ══════════════════════════════════════════════════════════════════
   RPG Matematika — NOVÉ TYPY ÚLOH (spojovačka, řazení)

   Sdílený modul pro trénink. Cvičení se AUTOMATICKY generují
   z existujícího poolu úloh dané mise — žádný nový obsah:
     • Spojovačka: spoj úlohu se správným výsledkem (4 dvojice)
     • Řazení: klikej na výsledky od nejmenšího po největší (5 čísel)

   Graceful: bez modulu hra běží beze změny (tlačítka volají
   window.RPGTaskTypes přes guard). Žádná změna formátu save.
   ══════════════════════════════════════════════════════════════════ */
window.RPGTaskTypes = (function () {
  'use strict';

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function injectCss() {
    if (document.getElementById('ttm-css')) return;
    const css = document.createElement('style');
    css.id = 'ttm-css';
    css.textContent =
      '.ttm-head{font-family:var(--px,monospace);font-weight:700;font-size:13px;' +
      'color:var(--gold,#f4d03f);letter-spacing:1px;margin-bottom:10px;text-align:center}' +
      '.ttm-cols{display:flex;gap:10px;align-items:stretch}' +
      '.ttm-col{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}' +
      '.ttm-q,.ttm-a{font-family:var(--vt,monospace);font-size:17px;line-height:1.35;' +
      'text-align:left;padding:9px 10px;border-radius:8px;cursor:pointer;' +
      'border:2px solid var(--line,#2a3450);background:rgba(255,255,255,.04);' +
      'color:var(--text,#e8eaf6);transition:.12s;word-break:break-word}' +
      '.ttm-a{text-align:center;font-weight:700;font-size:19px}' +
      '.ttm-q.sel{border-color:var(--blue,#5dc8f0);background:rgba(93,200,240,.14)}' +
      '.ttm-q.done,.ttm-a.done{border-color:#4ade80;background:rgba(74,222,128,.14);' +
      'color:#4ade80;cursor:default;opacity:.8}' +
      '.ttm-a.bad,.tto-chip.bad{border-color:#ff6b6b!important;background:rgba(255,107,107,.2)!important;' +
      'animation:ttmshake .35s}' +
      '@keyframes ttmshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}' +
      '.tto-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}' +
      '.tto-chip{font-family:var(--vt,monospace);font-size:21px;font-weight:700;' +
      'padding:11px 16px;border-radius:9px;cursor:pointer;' +
      'border:2px solid var(--line,#2a3450);background:rgba(255,255,255,.04);' +
      'color:var(--text,#e8eaf6);transition:.12s}' +
      '.tto-chip.done{border-color:#4ade80;background:rgba(74,222,128,.14);color:#4ade80;cursor:default}' +
      '.tto-n{font-size:13px;color:var(--gold,#f4d03f);margin-right:2px}' +
      '.reduced-motion .ttm-a.bad,.reduced-motion .tto-chip.bad{animation:none}';
    document.head.appendChild(css);
  }

  /* ── SPOJOVAČKA ──
     Z poolu vybere n úloh s krátkými UNIKÁTNÍMI odpověďmi (jinak by spoj
     nebyl jednoznačný). Vrací [{q,a}] nebo null, když se nedá sestavit. */
  function pickPairs(pool, n) {
    n = n || 4;
    const seen = new Set(), out = [];
    for (const t of shuffle(pool || [])) {
      if (!t || !t.text || t.ans == null || t.svg) continue;     // SVG úlohy nemají v 2 sloupcích místo
      const a = String(t.ans).trim();
      if (!a || a.length > 8 || seen.has(a)) continue;
      const q = String(t.text).replace(/\s+/g, ' ').trim();
      if (q.length < 4 || q.length > 110) continue;
      seen.add(a); out.push({ q, a });
      if (out.length === n) return out;
    }
    return null;
  }

  function renderMatch(el, pairs, onDone) {
    injectCss();
    let sel = null, solved = 0, mistakes = 0;
    el.innerHTML = '<div class="ttm-head">🔗 SPOJOVAČKA — spoj úlohu se správným výsledkem</div>' +
      '<div class="ttm-cols"><div class="ttm-col" data-ttm="l"></div><div class="ttm-col" data-ttm="r"></div></div>';
    const L = el.querySelector('[data-ttm="l"]'), R = el.querySelector('[data-ttm="r"]');
    pairs.forEach(p => {
      const b = document.createElement('button');
      b.className = 'ttm-q'; b.textContent = p.q; b.dataset.a = p.a;
      b.onclick = () => {
        if (b.classList.contains('done')) return;
        L.querySelectorAll('.ttm-q').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel'); sel = b;
      };
      L.appendChild(b);
    });
    shuffle(pairs.map(p => p.a)).forEach(a => {
      const b = document.createElement('button');
      b.className = 'ttm-a'; b.textContent = a;
      b.onclick = () => {
        if (b.classList.contains('done') || !sel) return;
        if (sel.dataset.a === a) {
          sel.classList.remove('sel'); sel.classList.add('done'); b.classList.add('done');
          sel = null; solved++;
          if (solved === pairs.length && typeof onDone === 'function') onDone(mistakes);
        } else {
          mistakes++;
          b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 400);
        }
      };
      R.appendChild(b);
    });
  }

  /* ── ŘAZENÍ ──
     Z poolu vybere n úloh s UNIKÁTNÍMI číselnými výsledky.
     Vrací [{v,label}] nebo null (potřebuje aspoň 4 různé hodnoty). */
  function pickOrderItems(pool, n) {
    n = n || 5;
    const seen = new Set(), vals = [];
    for (const t of shuffle(pool || [])) {
      if (!t || t.ans == null) continue;
      const v = parseFloat(String(t.ans).replace(',', '.'));
      if (!isFinite(v) || seen.has(v)) continue;
      seen.add(v); vals.push({ v, label: String(t.ans) });
      if (vals.length === n) break;
    }
    return vals.length >= 4 ? vals : null;
  }

  function renderOrder(el, items, onDone) {
    injectCss();
    let want = 0, mistakes = 0;
    const sorted = items.slice().sort((a, b) => a.v - b.v);
    el.innerHTML = '<div class="ttm-head">↕ ŘAZENÍ — klikej na čísla od NEJMENŠÍHO po největší</div>' +
      '<div class="tto-row" data-ttm="row"></div>';
    const row = el.querySelector('[data-ttm="row"]');
    shuffle(items).forEach(it => {
      const b = document.createElement('button');
      b.className = 'tto-chip'; b.textContent = it.label;
      b.onclick = () => {
        if (b.classList.contains('done')) return;
        if (it.v === sorted[want].v) {
          b.classList.add('done');
          b.innerHTML = '<span class="tto-n">' + (want + 1) + '.</span>' + esc(it.label);
          want++;
          if (want === items.length && typeof onDone === 'function') onDone(mistakes);
        } else {
          mistakes++;
          b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 400);
        }
      };
      row.appendChild(b);
    });
  }

  return { pickPairs, renderMatch, pickOrderItems, renderOrder };
})();
