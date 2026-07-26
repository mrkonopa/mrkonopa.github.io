/* ─────────────────────────────────────────────────────────────────────────
   PŘIJÍMAČKY HUB — sdílený glue.
   Spojuje vizuálně neutrální engine hry (checkAns z rpg-shared.js, generátor
   RPG_CERMAT_9 z rpg-cermat-9.js) se světlým UI hubu. Vše čistě klientské
   (localStorage), žádná závislost na RPG stavu.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // Herní helpery (ri/gcd/cz/shuffleArr/countDiv/skl) i celá knihovna SVG diagramů
  // (svgTriangle/svgSimilar/…) teď žijí ve sdíleném ../rpg-svg-9.js, který se načítá
  // PŘED tímto souborem i před rpg-cermat-9.js. Netřeba je tu duplikovat.

  // Přebarvení generovaných SVG z tmavé RPG palety na světlou akademickou.
  // Delší kódy barev první (ať #ffffff nepřebije #fff jen zčásti).
  const SVG_MAP = [
    ['#ffffff', '#1a1a2e'],
    // tmavé výplně tvarů → světle modrá
    ['#16203a', '#eaf1fb'], ['#101a2e', '#eaf1fb'], ['#1b2742', '#eaf1fb'], ['#12233a', '#eaf1fb'], ['#233', '#eaf1fb'],
    // vodní plochy (rybník apod.) → světle modrá, ať se liší od pevniny
    ['#0e4a6e', '#bcdcf0'], ['#1a5a80', '#cfe8f5'],
    // neon tahy/akcenty → akademická modrá / teal / červená
    ['#19e6e6', '#1a73c8'], ['#4cc9f0', '#1a73c8'], ['#39ff9e', '#0f8a72'],
    ['#ff3d7f', '#d63c2f'], ['#ff5c8a', '#d63c2f'],
    // tlumené popisky → šedá
    ['#8a9bc4', '#6b7280'], ['#5d6e94', '#6b7280'],
    ['#fff', '#1a1a2e'],
  ];
  function themeSvg(s) { let o = String(s == null ? '' : s); for (const [a, b] of SVG_MAP) o = o.split(a).join(b); return o; }

  // Escapování user-controlled textu do innerHTML (i jednoduché uvozovky kvůli onclick kontextům)
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Kontrola odpovědi — přednostně sdílená checkAns z rpg-shared.js; fallback pro jistotu.
  function check(raw, correct) {
    if (typeof window.checkAns === 'function') return window.checkAns(raw, correct);
    const norm = s => String(s).trim().toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').replace(/,/g, '.').replace(/[−–]/g, '-');
    const u = norm(raw), c = norm(correct);
    if (u === c) return true;
    const ev = s => { if (/^-?\d+\/-?\d+$/.test(s)) { const [a, b] = s.split('/'); return parseFloat(a) / parseFloat(b); } return parseFloat(s); };
    const un = ev(u), cn = ev(c);
    return (!isNaN(un) && !isNaN(cn)) ? Math.abs(un - cn) < 0.016 : false;
  }

  // localStorage wrapper (bezpečný proti privátnímu režimu / plné kvótě)
  const store = {
    get(key, def) { try { const r = localStorage.getItem(key); return r == null ? def : JSON.parse(r); } catch (e) { return def; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } },
  };

  // Vhodná mobilní klávesnice podle očekávané odpovědi (jako Tier 1 ② ve hrách):
  // kladné celé → numeric, kladné desetinné → decimal, jinak (zápor/zlomek/text) → text.
  function inputMode(ans) {
    const a = String(ans == null ? '' : ans);
    return /^\d+$/.test(a) ? 'numeric' : /^\d+[.,]\d+$/.test(a) ? 'decimal' : 'text';
  }

  /* ════════ CLOUD SYNC POKROKU — Fáze 21 (graceful) ════════
     Bez RPGCloud / bez přihlášení běží vše lokálně jako dřív. Po přihlášení
     školním Google účtem se pokrok slévá napříč zařízeními (nikdy neztratí). */
  const K_ATT = 'PZ_CERMAT_ATTEMPTS', K_PRA = 'PZ_PRACTICE_PROGRESS', K_DIA = 'PZ_DIAG_LAST';
  const hasCloud = () => (typeof window.RPGCloud !== 'undefined') &&
    (typeof RPGCloud.configured === 'function') && RPGCloud.configured();

  // Obranné pomůcky proti podvrženému/poškozenému pokroku (cloud i localStorage):
  // sync nesmí spadnout ani na {téma: null}, poli místo objektu, nečíselných hodnotách.
  const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const num = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };

  // Odhad připravenosti (0–100) — STEJNÝ vzorec jako statistiky.html:
  // průměr z (nejlepší test/50) a (přesnost procvičování).
  function computeReadiness() {
    const att = store.get(K_ATT, []), pra = store.get(K_PRA, {});
    const sig = [];
    if (Array.isArray(att) && att.length) sig.push(Math.round(Math.max(...att.map(a => num(a && a.score))) / 50 * 100));
    let ok = 0, tot = 0;
    if (isObj(pra)) for (const k in pra) { const v = pra[k]; if (isObj(v)) { ok += num(v.ok); tot += num(v.total); } }
    if (tot) sig.push(Math.round(ok / tot * 100));
    return sig.length ? Math.max(0, Math.min(100, Math.round(sig.reduce((a, b) => a + b, 0) / sig.length))) : 0;
  }
  const readLocal = () => ({
    attempts: store.get(K_ATT, []), practice: store.get(K_PRA, {}),
    diag: store.get(K_DIA, null), readiness: computeReadiness(),
  });

  // Sloučení lokálního a cloudového pokroku (kid-friendly: nikdy neztratí).
  // Plně obranné: cizí strana (vlastní cloud řádek, ale mohl ho žák podvrhnout
  // nebo je z jiné verze klienta) může být jakýkoli JSON — nesmí shodit sync.
  function mergeStats(a, b) {
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    // testy: jen objektové položky, sanitizované na {date,score,max}, dedup, cap 50
    const seen = new Set(), attempts = [];
    const rawAtt = [].concat(Array.isArray(a.attempts) ? a.attempts : [], Array.isArray(b.attempts) ? b.attempts : []);
    for (const x of rawAtt) {
      if (!isObj(x)) continue;
      const item = { date: String(x.date == null ? '' : x.date).slice(0, 20), score: num(x.score), max: num(x.max) || 50 };
      const key = item.date + '|' + item.score + '|' + item.max;
      if (!seen.has(key)) { seen.add(key); attempts.push(item); }
    }
    // procvičování: per-téma vyšší ok i total; jen objektové hodnoty; cap 60 témat (anti-flood)
    const practice = {};
    for (const src of [isObj(a.practice) ? a.practice : {}, isObj(b.practice) ? b.practice : {}])
      for (const t in src) {
        if (!Object.prototype.hasOwnProperty.call(src, t)) continue;
        if (t === '__proto__' || t === 'constructor' || t === 'prototype') continue;
        const v = src[t]; if (!isObj(v)) continue;
        if (!practice[t] && Object.keys(practice).length >= 60) continue;
        const cur = practice[t] || { ok: 0, total: 0 };
        practice[t] = { ok: Math.max(cur.ok, num(v.ok)), total: Math.max(cur.total, num(v.total)) };
      }
    // diagnostika: novější dle date; jen objekt
    const da = isObj(a.diag) ? a.diag : null, db = isObj(b.diag) ? b.diag : null;
    const diag = (!da) ? db : (!db) ? da : (String(db.date) > String(da.date) ? db : da);
    const out = { attempts: attempts.slice(-50), practice, diag };
    out.readiness = 0; // dopočítá se po zápisu z lokálu
    return out;
  }
  function writeLocal(m) {
    if (m.attempts) store.set(K_ATT, m.attempts);
    if (m.practice) store.set(K_PRA, m.practice);
    if (m.diag) store.set(K_DIA, m.diag);
  }

  let pushTimer = null;
  // Odešle aktuální lokální pokrok do cloudu (debounced). Volají stránky po uložení.
  function cloudPush() {
    if (!hasCloud() || !RPGCloud.currentUser || !RPGCloud.currentUser()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      const l = readLocal();
      RPGCloud.pzSaveStats({ attempts: l.attempts, practice: l.practice, diag: l.diag, readiness: l.readiness });
    }, 800);
  }
  // Po přihlášení: stáhni cloud, sloučí s lokálem, zapiš OBĚ strany.
  async function cloudSync() {
    if (!hasCloud() || !RPGCloud.currentUser || !RPGCloud.currentUser()) return;
    const cloud = await RPGCloud.pzGetStats();
    const merged = mergeStats(readLocal(), cloud || {});
    writeLocal(merged);
    merged.readiness = computeReadiness();
    await RPGCloud.pzSaveStats(merged);
    if (typeof window.PZ_ON_SYNC === 'function') { try { window.PZ_ON_SYNC(); } catch (e) {} }
  }

  // Vloží přihlašovací lištu do .top-bar (graceful: bez cloudu nic nevloží).
  function attachLoginBar() {
    if (!hasCloud()) return;
    const bar = document.querySelector('.top-bar');
    if (!bar || bar.querySelector('#pz-login')) return;
    const wrap = document.createElement('span');
    wrap.id = 'pz-login';
    wrap.style.cssText = 'margin-left:auto;display:inline-flex;align-items:center;gap:10px;font-size:.85rem';
    bar.appendChild(wrap);
    const paint = (u) => {
      if (u) {
        wrap.innerHTML = '<span style="color:var(--muted)">' + esc(u.email || 'přihlášen') + '</span>' +
          '<button id="pz-logout" class="pz-authbtn">Odhlásit</button>';
        wrap.querySelector('#pz-logout').onclick = () => RPGCloud.logout();
      } else {
        wrap.innerHTML = '<button id="pz-signin" class="pz-authbtn">🔑 Přihlásit (školní účet)</button>';
        wrap.querySelector('#pz-signin').onclick = () => RPGCloud.login();
      }
    };
    RPGCloud.onChange((u) => { paint(u); if (u) cloudSync(); });
    paint(RPGCloud.currentUser ? RPGCloud.currentUser() : null);
    RPGCloud.init();
  }

  window.PZ = { esc, check, store, inputMode, themeSvg, attachLoginBar, cloudPush, cloudSync };
})();
