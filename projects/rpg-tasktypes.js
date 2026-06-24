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
      '.ttm-q,.ttm-a{font-family:var(--px,monospace);font-size:16px;line-height:1.35;' +
      'text-align:left;padding:9px 10px;border-radius:8px;cursor:pointer;' +
      'border:2px solid var(--line,#2a3450);background:rgba(255,255,255,.04);' +
      'color:var(--text,#e8eaf6);transition:.12s;word-break:break-word}' +
      '.ttm-a{text-align:center;font-weight:700;font-size:18px}' +
      '.ttm-q.sel{border-color:var(--blue,#5dc8f0);background:rgba(93,200,240,.14)}' +
      '.ttm-q.done,.ttm-a.done{border-color:#4ade80;background:rgba(74,222,128,.14);' +
      'color:#4ade80;cursor:default;opacity:.8}' +
      '.ttm-a.bad,.tto-chip.bad{border-color:#ff6b6b!important;background:rgba(255,107,107,.2)!important;' +
      'animation:ttmshake .35s}' +
      '@keyframes ttmshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}' +
      '.tto-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}' +
      '.tto-chip{font-family:var(--px,monospace);font-size:18px;font-weight:700;' +
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
  function pickPairs(pool, n, maxQLen) {
    n = n || 4; maxQLen = maxQLen || 110;
    const seen = new Set(), out = [];
    for (const t of shuffle(pool || [])) {
      if (!t || !t.text || t.ans == null || t.svg) continue;     // SVG úlohy nemají v 2 sloupcích místo
      const a = String(t.ans).trim();
      if (!a || a.length > 8 || seen.has(a)) continue;
      const q = String(t.text).replace(/\s+/g, ' ').trim();
      if (q.length < 4 || q.length > maxQLen) continue;
      seen.add(a); out.push({ q, a });
      if (out.length === n) return out;
    }
    return null;
  }

  function renderMatch(el, pairs, onDone, opts) {
    injectCss();
    opts = opts || {};
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
          if (opts.onMistake) opts.onMistake();
          b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 400);
        }
      };
      R.appendChild(b);
    });
  }

  /* ── ŘAZENÍ ──
     Z poolu vybere n úloh s UNIKÁTNÍMI číselnými výsledky. Chip ukazuje
     ZADÁNÍ úlohy (ne hotový výsledek), takže žák musí každý příklad spočítat,
     aby je seřadil. Vrací [{v,label,ans}] nebo null (≥4 různé hodnoty se
     samostatným krátkým zadáním). */
  function pickOrderItems(pool, n) {
    n = n || 5;
    const seen = new Set(), vals = [];
    for (const t of shuffle(pool || [])) {
      if (!t || t.ans == null || t.svg) continue;
      const v = parseFloat(String(t.ans).replace(',', '.'));
      if (!isFinite(v) || seen.has(v)) continue;
      const q = String(t.text || '').replace(/\s+/g, ' ').trim();
      if (q.length < 2 || q.length > 42) continue;   // chip musí být krátký
      seen.add(v); vals.push({ v, label: q, ans: String(t.ans) });
      if (vals.length === n) break;
    }
    return vals.length >= 4 ? vals : null;
  }

  /* opts: { onMistake, desc }  — desc=true seřadí od největšího. */
  function renderOrder(el, items, onDone, opts) {
    injectCss();
    opts = opts || {};
    const desc = !!opts.desc;
    let want = 0, mistakes = 0;
    const sorted = items.slice().sort((a, b) => desc ? b.v - a.v : a.v - b.v);
    el.innerHTML = '<div class="ttm-head">↕ ŘAZENÍ — spočítej a klikej na úlohy podle výsledku ' +
      (desc ? 'od NEJVĚTŠÍHO' : 'od NEJMENŠÍHO') + '</div>' +
      '<div class="tto-row" data-ttm="row"></div>';
    const row = el.querySelector('[data-ttm="row"]');
    shuffle(items).forEach(it => {
      const b = document.createElement('button');
      b.className = 'tto-chip'; b.textContent = it.label;
      b.onclick = () => {
        if (b.classList.contains('done')) return;
        if (it.v === sorted[want].v) {
          b.classList.add('done');
          b.innerHTML = '<span class="tto-n">' + (want + 1) + '.</span>' + esc(it.label) +
            ' <span class="tto-n">= ' + esc(it.ans) + '</span>';
          want++;
          if (want === items.length && typeof onDone === 'function') onDone(mistakes);
        } else {
          mistakes++;
          if (opts.onMistake) opts.onMistake();
          b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 400);
        }
      };
      row.appendChild(b);
    });
  }

  /* ── PEXESO ──
     Karty = úloha + její výsledek. Otoč dvě; dvojice zůstane otočená.
     mistakes = počet neúspěšných otočení (2 „zdarma" odečítá volající). */
  function renderPexeso(el, pairs, onDone) {
    injectCss();
    if (!document.getElementById('ttp-css')) {
      const css = document.createElement('style');
      css.id = 'ttp-css';
      css.textContent =
        '.ttp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}' +
        '@media(max-width:480px){.ttp-grid{grid-template-columns:repeat(2,1fr)}}' +
        '.ttp-card{font-family:var(--px,monospace);font-size:14px;line-height:1.3;min-height:74px;' +
        'padding:8px;border-radius:9px;cursor:pointer;border:2px solid var(--line,#2a3450);' +
        'background:rgba(255,255,255,.05);color:transparent;transition:.15s;word-break:break-word;' +
        'display:flex;align-items:center;justify-content:center;text-align:center;position:relative}' +
        '.ttp-card::after{content:"❓";position:absolute;inset:0;display:flex;align-items:center;' +
        'justify-content:center;font-size:26px;color:var(--muted,#8895b5)}' +
        '.ttp-card.open{color:var(--text,#e8eaf6);background:rgba(93,200,240,.12);border-color:var(--blue,#5dc8f0)}' +
        '.ttp-card.open::after,.ttp-card.done::after{content:""}' +
        '.ttp-card.done{color:#4ade80;border-color:#4ade80;background:rgba(74,222,128,.12);cursor:default}' +
        '.ttp-card.sm{font-size:12px;line-height:1.25}';
      document.head.appendChild(css);
    }
    let open = null, lock = false, solved = 0, mistakes = 0;
    const cards = shuffle(pairs.flatMap((p, i) => [{ k: i, t: p.q }, { k: i, t: p.a }]));
    el.innerHTML = '<div class="ttm-head">🃏 PEXESO — najdi dvojice úloha + výsledek</div>' +
      '<div class="ttp-grid" data-ttm="grid"></div>';
    const grid = el.querySelector('[data-ttm="grid"]');
    cards.forEach(c => {
      const b = document.createElement('button');
      b.className = 'ttp-card' + (String(c.t).length > 34 ? ' sm' : ''); b.textContent = c.t;
      b.onclick = () => {
        if (lock || b.classList.contains('open') || b.classList.contains('done')) return;
        b.classList.add('open');
        if (!open) { open = { b, k: c.k }; return; }
        if (open.k === c.k) {
          open.b.classList.remove('open'); b.classList.remove('open');
          open.b.classList.add('done'); b.classList.add('done');
          open = null; solved++;
          if (solved === pairs.length && typeof onDone === 'function') onDone(mistakes);
        } else {
          mistakes++; lock = true;
          const prev = open.b; open = null;
          setTimeout(() => { prev.classList.remove('open'); b.classList.remove('open'); lock = false; }, 750);
        }
      };
      grid.appendChild(b);
    });
  }

  return { pickPairs, renderMatch, pickOrderItems, renderOrder, renderPexeso };
})();
