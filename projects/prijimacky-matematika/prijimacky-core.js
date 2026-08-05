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

  // V ČR se píše desetinná ČÁRKA. Generátory skládají odpovědi z JS čísel
  // (1.4), takže se čárka doplní až při zobrazení — mění se jen tečka MEZI
  // číslicemi, aby to nerozbilo číslování úloh („16.1") ani textové odpovědi.
  const czNum = v => String(v == null ? '' : v).replace(/(\d)\.(\d)/g, '$1,$2');

  /* ════════ CLOUD SYNC POKROKU — Fáze 21 (graceful) ════════
     Bez RPGCloud / bez přihlášení běží vše lokálně jako dřív. Po přihlášení
     školním Google účtem se pokrok slévá napříč zařízeními (nikdy neztratí). */
  const K_ATT = 'PZ_CERMAT_ATTEMPTS', K_PRA = 'PZ_PRACTICE_PROGRESS', K_DIA = 'PZ_DIAG_LAST';
  const K_TST = 'PZ_TEST_TOPICS';
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
    diag: store.get(K_DIA, null), test: store.get(K_TST, {}), readiness: computeReadiness(),
  });

  /* ════════ TEST NANEČISTO → SKLAD SLABIN PO OKRUZÍCH ════════
     Ostrý test dosud znal přesně, které pozice žák pokazil, ale zahazoval to
     (ukládalo se jen skóre). Tady se rozbor přeloží přes pozice testu na okruhy
     a uloží do PZ_TEST_TOPICS — adaptivita i mapa témat pak vědí, co nešlo
     v ostrých podmínkách (silnější signál než klidné procvičování). */
  function recordTestTopics(review) {
    if (!Array.isArray(review) || !window.PZ_TOPICS || !PZ_TOPICS.topicsForSlot) return null;
    const cur = isObj(store.get(K_TST, {})) ? store.get(K_TST, {}) : {};
    const now = Date.now();
    let touched = 0;
    review.forEach(r => {
      if (!isObj(r)) return;
      // pozice úlohy v testu je 1-indexovaná (r.no), slot je 0-indexovaný
      const ids = PZ_TOPICS.topicsForSlot(num(r.no) - 1);
      if (!ids.length) return;
      // granularita po podúlohách (věrnější než jen body); fallback = celá úloha
      const items = Array.isArray(r.items) ? r.items.filter(isObj) : [];
      const tot = items.length || 1;
      const ok = items.length ? items.filter(it => !!it.ok).length : (num(r.earned) >= num(r.max) ? 1 : 0);
      ids.forEach(id => {
        if (id === '__proto__' || id === 'constructor' || id === 'prototype') return;
        if (!cur[id] && Object.keys(cur).length >= 60) return; // anti-flood
        const p = isObj(cur[id]) ? cur[id] : { ok: 0, total: 0 };
        cur[id] = { ok: num(p.ok) + ok, total: num(p.total) + tot, last: now };
        touched++;
      });
    });
    if (!touched) return null;
    store.set(K_TST, cur);
    cloudPush();
    return cur;
  }
  // Nejslabší okruhy z JEDNOHO rozboru testu (pro doporučení „co teď procvičovat").
  function weakTopicsFromReview(review) {
    if (!Array.isArray(review) || !window.PZ_TOPICS || !PZ_TOPICS.topicsForSlot) return [];
    const agg = {};
    review.forEach(r => {
      if (!isObj(r)) return;
      const ids = PZ_TOPICS.topicsForSlot(num(r.no) - 1);
      const items = Array.isArray(r.items) ? r.items.filter(isObj) : [];
      const tot = items.length || 1;
      const ok = items.length ? items.filter(it => !!it.ok).length : (num(r.earned) >= num(r.max) ? 1 : 0);
      ids.forEach(id => {
        const a = agg[id] || (agg[id] = { id, ok: 0, total: 0 });
        a.ok += ok; a.total += tot;
      });
    });
    const list = (window.PZ_TOPICS && PZ_TOPICS.list) || [];
    const nameOf = id => { const t = list.find(x => x.id === id); return t ? t.name : id; };
    return Object.keys(agg).map(id => ({ id, name: nameOf(id), ok: agg[id].ok, total: agg[id].total, acc: agg[id].ok / agg[id].total }))
      .filter(x => x.acc < 1).sort((a, b) => a.acc - b.acc);
  }

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
    // testové slabiny po okruzích: stejný kid-friendly max() merge jako procvičování
    const test = {};
    for (const src of [isObj(a.test) ? a.test : {}, isObj(b.test) ? b.test : {}])
      for (const t in src) {
        if (!Object.prototype.hasOwnProperty.call(src, t)) continue;
        if (t === '__proto__' || t === 'constructor' || t === 'prototype') continue;
        const v = src[t]; if (!isObj(v)) continue;
        if (!test[t] && Object.keys(test).length >= 60) continue;
        const cur = test[t] || { ok: 0, total: 0, last: 0 };
        test[t] = { ok: Math.max(cur.ok, num(v.ok)), total: Math.max(cur.total, num(v.total)), last: Math.max(cur.last, num(v.last)) };
      }
    // diagnostika: novější dle date; jen objekt
    const da = isObj(a.diag) ? a.diag : null, db = isObj(b.diag) ? b.diag : null;
    const diag = (!da) ? db : (!db) ? da : (String(db.date) > String(da.date) ? db : da);
    const out = { attempts: attempts.slice(-50), practice, diag, test };
    out.readiness = 0; // dopočítá se po zápisu z lokálu
    return out;
  }
  function writeLocal(m) {
    if (m.attempts) store.set(K_ATT, m.attempts);
    if (m.practice) store.set(K_PRA, m.practice);
    if (m.diag) store.set(K_DIA, m.diag);
    if (m.test) store.set(K_TST, m.test);
  }

  let pushTimer = null;
  // Odešle aktuální lokální pokrok do cloudu (debounced). Volají stránky po uložení.
  function cloudPush() {
    if (!hasCloud() || !RPGCloud.currentUser || !RPGCloud.currentUser()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      const l = readLocal();
      RPGCloud.pzSaveStats({ attempts: l.attempts, practice: l.practice, diag: l.diag, test: l.test, readiness: l.readiness });
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

  /* ════════ ADAPTIVNÍ VÝBĚR TÉMAT — Fáze A personalizace ════════
     Váha okruhu roste s jeho slabostí: nízká přesnost, chyba v diagnostice,
     „dávno neprocvičeno" (spaced repetition), nikdy nezkoušeno. Zvládnuté
     okruhy se deprioritizují. pickWeakTopic() dělá váhovaný náhodný výběr. */
  function topicWeights() {
    const prog = store.get('PZ_PRACTICE_PROGRESS', {}) || {};
    const diag = store.get('PZ_DIAG_LAST', null);
    const diagWrong = new Set();
    if (diag && Array.isArray(diag.topics)) diag.topics.forEach(x => { if (x && !x.correct) diagWrong.add(x.id); });
    const test = isObj(store.get(K_TST, {})) ? store.get(K_TST, {}) : {};
    const now = Date.now();
    const list = (window.PZ_TOPICS && PZ_TOPICS.list) || [];
    return list.map(t => {
      const p = isObj(prog[t.id]) ? prog[t.id] : null;
      const total = p ? num(p.total) : 0, ok = p ? num(p.ok) : 0;
      const acc = total > 0 ? ok / total : null;
      const tp = isObj(test[t.id]) ? test[t.id] : null;
      const ttotal = tp ? num(tp.total) : 0, tok = tp ? num(tp.ok) : 0;
      const tacc = ttotal > 0 ? tok / ttotal : null;
      let w = 1, why = '';
      if (total === 0) { w += 2.5; why = 'ještě jsi nezkoušel'; }
      else { w += (1 - acc) * 3; if (acc < 0.6) why = 'tady míváš chyby'; }
      if (diagWrong.has(t.id)) { w += 2; why = 'slabina z diagnostiky'; }
      // ostrý test nanečisto = nejsilnější důkaz (časový tlak, reálné podmínky)
      if (tacc != null) { w += (1 - tacc) * 3.5; if (tacc < 0.6) why = 'chyby v testu nanečisto'; }
      if (p && p.last) { const days = (now - num(p.last)) / 86400000; w += Math.min(Math.max(days, 0), 10) * 0.25; }
      // „zvládnuté" nezlevňuj, pokud to v ostrém testu drhne
      if (acc != null && acc >= 0.9 && total >= 10 && !(tacc != null && tacc < 0.7)) { w *= 0.25; why = 'zvládnuté 💪'; }
      if (!why) why = 'opakování';
      return { id: t.id, name: t.name, weight: Math.max(0.05, w), acc, total, tacc, ttotal, why };
    });
  }
  function pickWeakTopic() {
    const ws = topicWeights(); if (!ws.length) return null;
    const sum = ws.reduce((a, b) => a + b.weight, 0);
    if (!(sum > 0)) return ws[0].id;
    let r = Math.random() * sum;
    for (const w of ws) { r -= w.weight; if (r <= 0) return w.id; }
    return ws[ws.length - 1].id;
  }

  /* ════════ PROGRESIVNÍ NÁPOVĚDY — L1 nasměrování → L2 vzorec → L3 výsledek ════════
     Baseline per-okruh (L1+L2). Konkrétní generátor může přebít vlastními
     item.hint1/hint2 (přesnější). L3 je vždy samotný výsledek. */
  const TOPIC_HINTS = {
    'vyrazy-mocniny': ['Spočítej nejdřív mocniny a odmocniny, teprve pak zbytek (pořadí operací).', 'Mocnina = číslo krát sebe (a² = a·a). Odmocnina hledá číslo, které umocněné dá daný výsledek.'],
    'zlomky': ['U stejného jmenovatele počítej jen s čitateli. „Část z celku" = celek vyděl jmenovatelem.', 'Část = (celek : jmenovatel) × čitatel. Celek zpět = díl × jmenovatel.'],
    'procenta': ['Převeď procenta na díl: 1 % = celek : 100.', 'Část = procenta × (celek : 100). Základ (celek) = část : procenta × 100.'],
    'pomer': ['Zjisti koeficient — kolikrát se jedno číslo vejde do druhého.', 'Přímá úměra: víc → víc (násob). Nepřímá (víc dělníků → míň dní): víc → míň (poděl).'],
    'vyrazy-promenna': ['Za x dosaď dané číslo a spočítej výraz.', 'Dodrž pořadí: nejdřív mocniny a závorky, pak násobení, nakonec sčítání a odčítání.'],
    'rovnice': ['Dej členy s neznámou na jednu stranu, čísla na druhou.', 'Co je u x přičtené/odečtené, přesuň s opačným znaménkem; pak vyděl číslem u x.'],
    'slovni': ['Vypiš si, co víš a co hledáš; přelož slova do čísel.', 'Součet a rozdíl → větší = (součet + rozdíl) : 2. Nákup → sečti (počet × cena).'],
    'geometrie': ['Nakresli si obrázek a napiš vzorec pro obvod nebo obsah.', 'Obdélník: O = 2·(a+b), S = a·b. Trojúhelník: S = (a·v):2. Pravoúhlý: c² = a² + b² (Pythagoras).'],
    'telesa': ['Napiš vzorec pro objem nebo povrch daného tělesa.', 'Kvádr: V = a·b·c, S = 2·(ab+bc+ac). Krychle: V = a³, S = 6a². Pozor: 1 litr = 1000 cm³.'],
    'data': ['Rozmysli, jestli jde o průměr, medián, modus nebo rozpětí.', 'Průměr = součet : počet. Medián = prostřední po seřazení. Modus = nejčastější. Rozpětí = max − min.'],
  };
  /* Nápovědy PRO KONKRÉTNÍ TYP úlohy. Klíčem je `_check.kind`, který každý
     generátor stejně vrací kvůli strojovému ověření — generátory se tedy
     nemusely měnit vůbec. L1 = co si uvědomit, L2 = konkrétní postup BEZ
     výsledku. Když typ v tabulce není, spadne se na per-okruh baseline. */
  const KIND_HINTS = {
    // ── výrazy, mocniny, odmocniny ──
    mocnina: ['Mocnina je opakované násobení téhož čísla.', 'a² = a·a, a³ = a·a·a. Vynásob to postupně.'],
    odmocnina: ['Hledáš číslo, které samo sebou vynásobené dá dané číslo.', 'Zkoušej: 10² = 100, 11² = 121… dokud netrefíš zadané číslo.'],
    mocninaVyraz: ['Nejdřív mocnina, až potom násobení a odčítání.', 'Spočítej zvlášť a², zvlášť b·c, a teprve pak odečti.'],
    mocnina10: ['Mocnina desíti = jednička a za ní tolik nul, kolik je exponent.', '10³ = 1 000 (tři nuly). Napiš 1 a doplň nuly.'],
    kvadratSouctu: ['Nejdřív sečti závorku, pak umocni.', 'Spočítej (a+b) a výsledek vynásob sám sebou.'],
    odmocninaSoucin: ['Odmocnina ze součinu = součin odmocnin.', '√(a²·b²) = a·b — najdi obě odmocniny a vynásob je.'],
    poradiOperaci: ['Pořadí: mocniny a odmocniny → násobení → sčítání a odčítání.', 'Spočítej zvlášť a², zvlášť b·c, zvlášť odmocninu; pak teprve sečti a odečti.'],
    rozdilMocnin: ['Obě mocniny spočítej zvlášť, pak teprve odečti.', 'Urči a² a b², větší mínus menší.'],
    // ── zlomky ──
    zlomekCelku: ['Zlomek z celku: nejdřív jeden díl, pak jich vezmi tolik, kolik je čitatel.', 'Celek : jmenovatel = jeden díl. Ten vynásob čitatelem.'],
    zlomekZbytek: ['Spočítej část, která platí, a odečti ji od celku.', 'Celek : jmenovatel · čitatel = část. Zbytek = celek − část.'],
    zlomekPocet: ['Kolik dílů 1/q se vejde do jednoho celku?', 'Do jednoho celku se vejde q dílů, do N celků tedy N·q.'],
    smisene: ['Smíšené číslo = celky převedené na díly plus zbývající díly.', 'Celky · jmenovatel + čitatel.'],
    zlomekRozsir: ['Rozšiřuješ: čitatel i jmenovatel násobíš stejným číslem.', 'Zjisti, kolikrát se zvětšil jmenovatel, a stejně zvětši čitatel.'],
    castJeCelek: ['Znáš jeden díl a hledáš celek — postupuješ obráceně.', 'Celek = velikost jednoho dílu · jmenovatel.'],
    zlomekZCasti: ['Dvoukrokové: nejdřív část z celku, pak část z té části.', 'Spočítej první část, a tu pak ber jako nový „celek" pro druhý zlomek.'],
    zlomekZbytekDvakrat: ['Po každém odběru si spočítej, co ZBYLO — druhý zlomek je ze zbytku.', 'Zbytek po prvním = celek − první část. Druhý zlomek počítej z tohoto zbytku.'],
    // ── výrazy s proměnnou ──
    dosazeniLin: ['Za x dosaď dané číslo a spočítej.', 'Nejdřív násobení a·x, teprve pak přičti b.'],
    dosazeniKvadrat: ['Za x dosaď číslo; pozor na pořadí — nejdřív mocnina.', 'Spočítej x², pak a·x, a nakonec sečti.'],
    dosazeniZavorka: ['Nejdřív obsah závorky, pak násobení, nakonec odečtení.', 'Spočítej (x+b), vynásob a, a od výsledku odečti c.'],
    dosazeniDve: ['Dosaď obě proměnné a spočítej oba součiny zvlášť.', 'a·x a b·y spočítej odděleně, pak sečti.'],
    vyrazSlovni: ['Přelož slova do výrazu a teprve pak dosaď.', 'Nejdřív sečti to v závorce, výsledek vynásob.'],
    dosazeniZlomek: ['Zlomková čára je i závorka — nejdřív celý čitatel.', 'Spočítej a·x + b, a teprve výsledek vyděl.'],
    obvodVyraz: ['Vyjádři obě strany a pak použij vzorec pro obvod.', 'Strany jsou x a x+k. Obvod = 2·(součet obou stran).'],
    // ── rovnice ──
    rovniceLin: ['Osamostatni x: čísla na jednu stranu, x na druhou.', 'Odečti b od obou stran, pak vyděl číslem u x.'],
    rovniceZlomek: ['Zbav se zlomku — vynásob obě strany jmenovatelem.', 'Nejdřív převeď b na druhou stranu, pak vynásob jmenovatelem.'],
    rovniceZavorka: ['Nejdřív roznásob závorku, pak řeš jako obyčejnou rovnici.', 'Vyděl obě strany číslem před závorkou a pak odečti b.'],
    rovniceObeStrany: ['x je na obou stranách — dej ho na jednu.', 'Odečti menší počet x od obou stran, čísla dej na druhou stranu.'],
    rovniceDvojiZavorka: ['Roznásob obě závorky, pak posbírej x na jednu stranu.', 'Po roznásobení: členy s x doleva, čísla doprava, nakonec vyděl.'],
    rovnicePodil: ['Zbav se dělení — vynásob obě strany dělitelem.', 'x + b = dělitel · výsledek. Pak odečti b.'],
    // ── procenta ──
    procCast: ['1 % je setina celku.', 'Celek : 100 = 1 %. To vynásob počtem procent.'],
    procZaklad: ['Znáš část a procenta, hledáš celek — postupuješ obráceně.', 'Část : procenta = 1 %. To vynásob stem.'],
    procKolik: ['Ptáš se, kolik setin celku je daná část.', 'Část : celek · 100 = počet procent.'],
    slevaCena: ['Po slevě zbývá 100 − p procent původní ceny.', 'Cena · (100 − p) : 100. Nepočítej slevu a pak odečítat zvlášť.'],
    navyseniCena: ['Po zdražení je to 100 + p procent původní ceny.', 'Cena · (100 + p) : 100.'],
    urok: ['Úrok je procento z jistiny.', 'Jistina : 100 · úroková sazba.'],
    dveSlevy: ['Slevy se NEsčítají — druhá se počítá až z nové ceny.', 'Spočítej cenu po první slevě a teprve z NÍ ber druhou slevu.'],
    dph: ['DPH se připočítává k ceně bez daně.', 'Základ : 100 · 21 = daň. Cena s DPH = základ + daň.'],
    // ── slovní úlohy ──
    soucetRozdil: ['Znáš součet i rozdíl dvou čísel.', 'Větší = (součet + rozdíl) : 2. Menší dopočítáš odečtením.'],
    nakup: ['Každou položku spočítej zvlášť a nakonec sečti.', 'počet · cena pro každou položku, pak součet.'],
    draha: ['Dráha = rychlost × čas.', 'Vynásob rychlost počtem hodin.'],
    cenaDoprava: ['Zvlášť zboží, zvlášť doprava.', 'počet · cena + dopravné.'],
    zbyva: ['Nejdřív útrata, pak co zbylo z původní částky.', 'Peníze − (počet · cena).'],
    vek: ['Za t let přibude t oběma stejně.', 'Sestav rovnici: otec + t = 2 · (syn + t).'],
    smes: ['Cena směsi = celková cena děleno celková hmotnost.', 'Sečti ceny obou složek, vyděl součtem kilogramů.'],
    // ── poměr a úměrnost ──
    deleni: ['Poměr říká, na kolik stejných dílů se dělí.', 'Součet čísel poměru = počet dílů. Celek : ten součet = jeden díl.'],
    prima: ['Víc kusů → víc peněz (přímá úměrnost).', 'Spočítej cenu jednoho kusu a vynásob novým počtem.'],
    neprima: ['Víc dělníků → míň dní (nepřímá úměrnost).', 'Součin počet × dny je stálý. Vyděl ho novým počtem.'],
    meritko: ['Měřítko říká, kolikrát je skutečnost větší než mapa.', 'Délka na mapě · měřítko = skutečnost v cm; pak převeď na metry.'],
    pomerDoplnit: ['Zjisti, kolikrát se první člen zvětšil.', 'Stejným číslem vynásob i druhý člen poměru.'],
    pomerTri: ['Stejný postup jako u dvou dílů, jen sčítáš tři čísla.', 'Součet všech tří čísel poměru = počet dílů. Pak celek : ten součet.'],
    recept: ['Nejdřív spotřeba na jednu porci.', 'Množství : počet porcí = na jednu. Pak nové množství : to číslo.'],
    // ── data a statistika ──
    prumer: ['Průměr = součet dělený počtem.', 'Sečti všechna čísla a vyděl jejich počtem.'],
    median: ['Medián je prostřední hodnota — nejdřív seřaď.', 'Seřaď od nejmenšího a vezmi číslo přesně uprostřed.'],
    modus: ['Modus je hodnota, která se opakuje nejčastěji.', 'Spočítej, kolikrát se která hodnota objeví, a vyber nejčastější.'],
    rozsah: ['Rozpětí je rozdíl mezi největší a nejmenší hodnotou.', 'Najdi maximum a minimum a odečti je.'],
    prumerChybejici: ['Z průměru dopočítáš celkový součet.', 'Počet · průměr = součet všech. Odečti známá čísla.'],
    soucetZPrumeru: ['Průměr a počet ti dají součet.', 'Součet = počet · průměr.'],
    prumerPridani: ['Nový průměr počítej z NOVÉHO součtu i NOVÉHO počtu.', 'Původní součet + přidané číslo, to vyděl počtem o jedna větším.'],
    // ── geometrie v rovině ──
    obvodObd: ['Obvod je součet všech stran dokola.', 'O = 2·(a + b).'],
    obsahObd: ['Obsah obdélníku je součin stran.', 'S = a · b.'],
    obvodCtverec: ['Čtverec má čtyři stejné strany.', 'O = 4 · a.'],
    obsahCtverec: ['Čtverec má obě strany stejné.', 'S = a · a.'],
    obsahTroj: ['Trojúhelník je „půlka" obdélníku.', 'S = (a · v) : 2 — strana krát příslušná výška, děleno dvěma.'],
    uhelVedlejsi: ['Vedlejší úhly dohromady dávají přímý úhel.', 'Druhý úhel = 180° − daný úhel.'],
    pythag: ['Pravoúhlý trojúhelník → Pythagorova věta.', 'c² = a² + b². Sečti druhé mocniny odvěsen a odmocni.'],
    lichobeznik: ['Potřebuješ obě základny a výšku.', 'S = (a + c) : 2 · v.'],
    tretiUhel: ['Součet vnitřních úhlů trojúhelníku je vždy 180°.', 'γ = 180° − α − β.'],
    // ── tělesa ──
    objemKvadr: ['Objem kvádru = součin tří rozměrů.', 'V = a · b · c.'],
    povrchKvadr: ['Kvádr má tři dvojice shodných stěn.', 'S = 2·(ab + bc + ac).'],
    objemKrychle: ['Krychle má všechny hrany stejné.', 'V = a · a · a.'],
    povrchKrychle: ['Krychle má šest shodných čtvercových stěn.', 'S = 6 · a².'],
    hranyKvadr: ['Kvádr má 12 hran — od každého rozměru čtyři.', 'Součet = 4·(a + b + c).'],
    objemLitr: ['Nejdřív objem v cm³, pak převod na litry.', 'V = a·b·c v cm³; 1 litr = 1000 cm³, tedy vyděl tisícem.'],
    hranol: ['Objem hranolu = obsah podstavy × výška hranolu.', 'Podstava je trojúhelník: (a · v) : 2. To vynásob výškou hranolu.'],
    hranaZObjemu: ['Hledáš číslo, které třikrát vynásobené sebou dá objem.', 'Zkoušej: 4·4·4 = 64, 5·5·5 = 125… dokud netrefíš zadaný objem.'],
  };

  function hintsFor(item, topicId) {
    const th = TOPIC_HINTS[topicId] || ['Zkus si vzpomenout na postup pro tento typ úlohy.', 'Rozepiš si výpočet krok za krokem.'];
    // priorita: vlastní hint generátoru → nápověda pro TYP úlohy → baseline okruhu
    const kind = item && item._check && item._check.kind;
    const kh = (kind && KIND_HINTS[kind]) || null;
    const l1 = (item && item.hint1) || (kh && kh[0]) || th[0];
    const l2 = (item && item.hint2) || (kh && kh[1]) || th[1];
    const l3 = 'Výsledek: ' + (item && item.ans != null ? czNum(item.ans) : '');
    return [l1, l2, l3];
  }

  /* ════════ IKONY ════════
     Emoji se na každém systému kreslí jinak (a v šedé se rozmažou v beztvarý
     flek), takže rozhraní používá vlastní vektorové ikony. Jsou kreslené na
     mřížce 24×24 jednou tloušťkou tahu a barvu dědí z CSS (`currentColor`),
     aby seděly k Lexendu a daly se obarvit podle okruhu. */
  const ICONS = {
    // Celý kruh se v jedné cestě kreslí DVĚMA oblouky (…a r r 0 1 0 0 2r
    // a r r 0 1 0 0 -2r). Jeden oblouk udělá jen půlkruh — na to jsem naletěl
    // a terč vyšel jako „G", poměr jako „σᶜ".
    // ── rozcestník ──
    test:      'M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M9 16h4',
    practice:  'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 1 0 0-17 M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 1 0 0-9 M12 12h.01',
    diag:      'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18 M15.6 8.4l-2.3 4.9-4.9 2.3 2.3-4.9z',
    stats:     'M4 20V10 M9.3 20V4 M14.7 20v-7 M20 20v-4',
    // ── okruhy (10 okruhů dle specifikace CERMAT) ──
    'vyrazy-mocniny':  'M3 13h2.5l2.5 6 4-16h9 M17.5 6.5l3 3 M20.5 6.5l-3 3',
    zlomky:            'M3.5 12h17 M12 6.4v.02 M12 17.6v.02',
    procenta:          'M6 18L18 6 M8.2 6.4a1.7 1.7 0 1 0 0 .02 M15.8 17.6a1.7 1.7 0 1 0 0 .02',
    pomer:             'M12 3.5v16.5 M7 20h10 M3.5 6.5h17 M3.5 6.5L1 12.5h5z M20.5 6.5L18 12.5h5z',
    'vyrazy-promenna': 'M7 4.5C4.5 8 4.5 16 7 19.5 M17 4.5c2.5 3.5 2.5 11.5 0 15 M10 9l4 6 M14 9l-4 6',
    rovnice:           'M3.5 9.5h8 M3.5 14.5h8 M15 8l6 8 M21 8l-6 8',
    slovni:            'M4 5h16v11H9l-5 4z M9.5 9.2a2.5 2.5 0 1 1 2.5 2.6v1 M12 14.6v.1',
    geometrie:         'M3.5 19.5h17L8 4.5z M6.6 19.5a4.5 4.5 0 0 0 .9-3.9',
    telesa:            'M4 7.5l8-4 8 4v9l-8 4-8-4z M4 7.5l8 4 8-4 M12 11.5v9',
    data:              'M3.5 4.5h17v15h-17z M3.5 9.5h17 M3.5 14.5h17 M9.5 4.5v15 M15 4.5v15',
    // ── ostatní ──
    check:     'M4.5 12.5l5 5 10-11',
    cross:     'M6 6l12 12 M18 6L6 18',
    clock:     'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18 M12 7.5V12l3 2',
  };
  /** Vloží ikonu jako inline SVG. `cls` se přidá na <svg>, `size` v px. */
  function icon(name, cls, size) {
    const d = ICONS[name];
    if (!d) return '';
    const c = cls ? ' class="' + esc(cls) + '"' : '';
    const s = size || 24;
    return '<svg' + c + ' width="' + (s | 0) + '" height="' + (s | 0) + '" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  }
  /** Prstenec pokroku 0–1 (nebo null = nezačato). Používá procvičování. */
  function ring(frac, size) {
    const s = size || 34, r = s / 2 - 3, c = 2 * Math.PI * r;
    const f = (typeof frac === 'number' && isFinite(frac)) ? Math.max(0, Math.min(1, frac)) : null;
    const barva = f === null ? 'var(--border)' : f >= .8 ? 'var(--green)' : f >= .5 ? 'var(--gold)' : 'var(--red)';
    return '<svg class="pz-ring" width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '" aria-hidden="true">' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r.toFixed(2) + '" fill="none" stroke="var(--border)" stroke-width="3"/>' +
      (f === null ? '' :
        '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r.toFixed(2) + '" fill="none" stroke="' + barva +
        '" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + c.toFixed(2) + '" ' +
        'stroke-dashoffset="' + (c * (1 - f)).toFixed(2) + '" transform="rotate(-90 ' + s / 2 + ' ' + s / 2 + ')"/>') +
      '</svg>';
  }

  window.PZ = { esc, check, store, inputMode, czNum, themeSvg, icon, ring, attachLoginBar, cloudPush, cloudSync, topicWeights, pickWeakTopic, hintsFor, recordTestTopics, weakTopicsFromReview };
})();
