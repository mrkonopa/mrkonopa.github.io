/* ═════════════════════════════════════════════════════════════════════════════
   INFOCENTRUM — rozložení panelů (mřížka), autor Vojtěch Konopa.

   Učitelská konzole (`rpg-ucitel.html`, záložka INFOCENTRUM) má čtyři panely (Týmy, Kdo hraje, Třída dohromady,
   Děje se). Tenhle modul je umí na dataprojektoru přesouvat a zvětšovat:
     · mřížka 12 sloupců, panel má x, y, šířku a výšku v buňkách; panely se NIKDY nepřekrývají a volné místo nad
       panelem se samo zaplní (jako „gravitace“ v obvyklých mřížkách)
     · přesun a velikost: tažením za úchyt (myš, prst) i klávesnicí (šipky přesouvají, Shift+šipky mění velikost)
     · výška panelu se řídí OBSAHEM (karty žáků se nikdy neschovají za rolování), dokud panel výškově nezměníš ručně;
       pak drží zvolenou výšku a obsah se v něm roluje. „Výchozí rozložení“ vrátí výšku podle obsahu
     · rozložení se mění jen v režimu „Upravit“, jinak se na projektoru nic nepohne omylem
     · ukládá se v TOMTO zařízení (localStorage) pro dvojici třída + scénář, bez SQL; čtení je nedůvěřivé
       (cokoli v úložišti může být rozbité nebo podvržené)
   Čistá část (bez DOM) je určená pro Node: `tests/rpg-infocentrum-mrizka.test.cjs`. Vykreslení (`pripoj`) hlídá
   `tests/rpg-infocentrum-panely.test.cjs`.
   ═════════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RPGInfoGrid = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SLOUPCU = 12, MAX_RADKU = 200, MAX_VYSKA = 60, MAX_ULOZENO = 40;
  const KLIC = 'RPG_INFOCENTRUM_ROZLOZENI';

  /* Registr panelů: výchozí poloha a nejmenší velikost, při níž je obsah ještě čitelný. Pořadí v poli je pořadí
     při shodě polohy (Týmy jsou nad ostatními). Další panely se přidávají sem. */
  const PANELY = [
    { id: 'tymy',  nazev: 'Týmy',            x: 0, y: 0,  w: 12, h: 12, minW: 6, minH: 8 },
    { id: 'kdo',   nazev: 'Kdo hraje',       x: 0, y: 12, w: 8,  h: 17, minW: 4, minH: 5 },
    { id: 'trida', nazev: 'Třída dohromady', x: 8, y: 12, w: 4,  h: 8,  minW: 3, minH: 7 },
    { id: 'deje',  nazev: 'Děje se',         x: 8, y: 20, w: 4,  h: 9,  minW: 3, minH: 5 },
  ];
  const meta = id => PANELY.find(p => p.id === id) || null;
  const ID = PANELY.map(p => p.id);

  const celeCislo = (v, od, do_) => {
    const n = typeof v === 'number' ? v : NaN;
    if (!isFinite(n)) return null;
    return Math.min(do_, Math.max(od, Math.round(n)));
  };

  /* `a` = výška se řídí obsahem (h je jen poslední změřená hodnota); a === false = výška připnutá uživatelem */
  const vychozi = () => PANELY.map(p => ({ id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, a: true }));
  const kopie = l => l.map(p => ({ id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, a: p.a !== false }));
  const prekryv = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const sloupceSdileji = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w;

  /* Velikost a poloha jednoho panelu do mezí (šířka k nejmenší velikosti a k 12 sloupcům, x tak, aby panel nevyčníval). */
  function omez(p) {
    const m = meta(p.id);
    const w = Math.min(SLOUPCU, Math.max(m.minW, p.w));
    const h = Math.min(MAX_VYSKA, Math.max(m.minH, p.h));
    return { id: p.id, w, h, a: p.a !== false, x: Math.min(SLOUPCU - w, Math.max(0, p.x)), y: Math.min(MAX_RADKU, Math.max(0, p.y)) };
  }

  /* Gravitace: viditelné panely se seřadí podle (y, přednost, x, pořadí v registru); každý se postaví na požadované
     místo, při srážce s už postaveným se posune pod něj a pak „spadne“ nahoru, jak to jde. Skryté panely se
     nemění (neukazují se, jejich uložená poloha zůstane). `prednost` = panel, který uživatel právě táhne:
     při shodném y je první, takže ostatní ustupují jemu. Výsledek je bez překryvů a při opakování se nemění. */
  function kompaktuj(rozlozeni, viditelne, prednost) {
    const vid = viditelne instanceof Set ? viditelne : new Set(viditelne || ID);
    const vstup = rozlozeni.map(omez);
    const poradi = vstup.map((p, i) => ({ p, i })).filter(o => vid.has(o.p.id))
      .sort((a, b) => a.p.y - b.p.y || ((b.p.id === prednost) - (a.p.id === prednost)) || a.p.x - b.p.x || a.i - b.i);
    const umistene = [], vysledek = new Map();
    for (const { p } of poradi) {
      let y = p.y, pojistka = 0;
      for (;;) {
        const kolize = umistene.filter(u => prekryv(u, { x: p.x, y, w: p.w, h: p.h }));
        if (!kolize.length || ++pojistka > 500) break;
        y = Math.max(...kolize.map(u => u.y + u.h));
      }
      const nad = umistene.filter(u => sloupceSdileji(u, p) && u.y + u.h <= y).map(u => u.y + u.h);
      y = nad.length ? Math.max(...nad) : 0;
      const hotovy = { id: p.id, x: p.x, y, w: p.w, h: p.h, a: p.a };
      umistene.push(hotovy); vysledek.set(p.id, hotovy);
    }
    return vstup.map(p => vysledek.get(p.id) || p);
  }

  const klicPolohy = l => l.map(p => p.id + ':' + p.x + ',' + p.y + ',' + p.w + ',' + p.h + (p.a === false ? 'p' : 'a')).join(';');
  const stejne = (a, b) => klicPolohy(a) === klicPolohy(b);
  const vSadu = v => v instanceof Set ? v : new Set(v || ID);

  /* Přesun na požadované místo (v buňkách). Poloha se omezí na mřížku, ostatní panely ustoupí. */
  function presun(rozlozeni, id, x, y, viditelne) {
    if (!meta(id)) return kopie(rozlozeni);
    const nove = rozlozeni.map(p => p.id === id ? omez({ id, x: celeCislo(x, 0, SLOUPCU) === null ? p.x : x, y: celeCislo(y, 0, MAX_RADKU) === null ? p.y : y, w: p.w, h: p.h, a: p.a }) : p);
    return kompaktuj(nove, vSadu(viditelne), id);
  }

  /* Změna velikosti (v buňkách). Nejmenší velikost drží panel čitelný, největší je celá šířka. Změna VÝŠKY panel
     připne (přestane se řídit obsahem), změna samotné šířky ne. */
  function zmenVelikost(rozlozeni, id, w, h, viditelne) {
    if (!meta(id)) return kopie(rozlozeni);
    const nove = rozlozeni.map(p => {
      if (p.id !== id) return p;
      const o = omez({ id, x: p.x, y: p.y, w: celeCislo(w, 1, SLOUPCU) === null ? p.w : w, h: celeCislo(h, 1, MAX_VYSKA) === null ? p.h : h, a: p.a });
      return Object.assign(o, { a: o.h !== omez(p).h ? false : p.a !== false });
    });
    return kompaktuj(nove, vSadu(viditelne), id);
  }

  /* Kolik řádků mřížky potřebuje obsah vysoký `px` (řádek `radek` px, mezera `mezera` px; h řádků = h·radek + (h − 1)·mezera). */
  const radkuPro = (px, radek, mezera) => (isFinite(px) && px > 0) ? Math.max(1, Math.ceil((px + mezera) / (radek + mezera))) : 1;
  /* Výšky panelů řízených obsahem podle změřených řádků `radky` {id: počet}; připnuté panely se nemění. */
  function prizpusob(rozlozeni, radky) {
    return rozlozeni.map(p => {
      if (p.a === false || !meta(p.id) || !Object.prototype.hasOwnProperty.call(radky || {}, p.id) || !isFinite(radky[p.id])) return Object.assign({}, p);
      const m = meta(p.id);
      return Object.assign({}, p, { h: Math.min(MAX_VYSKA, Math.max(m.minH, Math.round(radky[p.id]))) });
    });
  }

  /* Klávesnice: šipky přesouvají, Shift+šipky mění velikost. Díky gravitaci se panel o jeden řádek „dolů“ nehne,
     dokud nepřekročí souseda — proto se u svislého směru hledá první poloha, která výsledek skutečně změní. */
  function klavesa(rozlozeni, id, klavesaJmeno, shift, viditelne) {
    const p = rozlozeni.find(q => q.id === id);
    if (!p || !meta(id)) return kopie(rozlozeni);
    const vid = vSadu(viditelne), puvodni = kompaktuj(rozlozeni, vid);
    const aktualni = puvodni.find(q => q.id === id);
    const dx = klavesaJmeno === 'ArrowRight' ? 1 : klavesaJmeno === 'ArrowLeft' ? -1 : 0;
    const dy = klavesaJmeno === 'ArrowDown' ? 1 : klavesaJmeno === 'ArrowUp' ? -1 : 0;
    if (!dx && !dy) return puvodni;
    if (shift) {
      const nove = zmenVelikost(puvodni, id, aktualni.w + dx, aktualni.h + dy, vid);
      return nove;
    }
    if (dx) return presun(puvodni, id, aktualni.x + dx, aktualni.y, vid);
    for (let y = aktualni.y + dy; dy > 0 ? y <= MAX_RADKU : y >= 0; y += dy) {
      const nove = presun(puvodni, id, aktualni.x, y, vid);
      if (!stejne(nove, puvodni)) return nove;
    }
    return puvodni;
  }

  /* ── ukládání ──────────────────────────────────────────────────────────── */
  /* Rozložení → {id:[x,y,w,h]} (nic jiného do úložiště nepatří). */
  function serializuj(rozlozeni) {
    const o = {};
    rozlozeni.forEach(p => { if (meta(p.id)) o[p.id] = [p.x, p.y, p.w, p.a === false ? p.h : 0]; });
    return o;
  }
  /* Nedůvěřivé čtení: cokoli neznámé nebo rozbité se nahradí výchozím panelem; výsledek je vždy platné rozložení. */
  function ocisti(raw, viditelne) {
    const ziskej = (o, id) => (o && typeof o === 'object' && !Array.isArray(o) && Object.prototype.hasOwnProperty.call(o, id)) ? o[id] : undefined;
    const l = PANELY.map(m => {
      const a = ziskej(raw, m.id);
      const zaklad = { id: m.id, x: m.x, y: m.y, w: m.w, h: m.h, a: true };
      if (!Array.isArray(a) || a.length !== 4) return zaklad;
      const automaticka = a[3] === 0;
      const w = celeCislo(a[2], m.minW, SLOUPCU), h = automaticka ? m.h : celeCislo(a[3], m.minH, MAX_VYSKA);
      const x = celeCislo(a[0], 0, SLOUPCU), y = celeCislo(a[1], 0, MAX_RADKU);
      if (w === null || h === null || x === null || y === null) return zaklad;
      return omez({ id: m.id, x, y, w, h, a: automaticka });
    });
    return kompaktuj(l, vSadu(viditelne));
  }
  const klicUloziste = (cid, scenar) => String(cid || '') + '|' + String(scenar || 'hodina');

  /* Text z úložiště → rozložení pro daný klíč nebo null (nic uložené / rozbité). */
  function nactiUlozene(text, klic) {
    let o = null;
    try { o = JSON.parse(text); } catch (e) { return null; }
    if (!o || typeof o !== 'object' || o.v !== 1 || !o.r || typeof o.r !== 'object') return null;
    if (!Object.prototype.hasOwnProperty.call(o.r, klic)) return null;
    return ocisti(o.r[klic]);
  }
  /* Přidá/nahradí rozložení pro klíč a vrátí nový text; drží nejvýš MAX_ULOZENO nejnovějších klíčů. */
  function ulozDoTextu(text, klic, rozlozeni) {
    let o = null;
    try { o = JSON.parse(text); } catch (e) { o = null; }
    const r = (o && o.v === 1 && o.r && typeof o.r === 'object') ? o.r : {};
    const nove = {};
    Object.keys(r).filter(k => k !== klic).slice(-(MAX_ULOZENO - 1)).forEach(k => { nove[k] = r[k]; });
    nove[klic] = serializuj(rozlozeni);
    return JSON.stringify({ v: 1, r: nove });
  }
  function smazDoTextu(text, klic) {
    let o = null;
    try { o = JSON.parse(text); } catch (e) { return text; }
    if (!o || o.v !== 1 || !o.r || typeof o.r !== 'object') return text;
    delete o.r[klic];
    return JSON.stringify(o);
  }

  /* Věta pro čtečku obrazovky po přesunu nebo změně velikosti. */
  function popis(p) {
    const m = meta(p.id);
    return (m ? m.nazev : p.id) + ': sloupec ' + (p.x + 1) + ' z ' + SLOUPCU + ', řádek ' + (p.y + 1) + ', šířka ' + p.w + ', výška ' + p.h;
  }

  /* ════════════════════════════════════════════════════════════════════════
     Vykreslení (prohlížeč). `pripoj(koren, volby)` převezme čtyři existující prvky `.ic-panel[data-ic-panel]`,
     zabalí jejich obsah do rolovací vrstvy, doplní úchyty a drží polohu v CSS mřížce.
       volby.uloziste   — objekt s getItem/setItem (výchozí localStorage)
       volby.zprava     — funkce(text) pro čtečku obrazovky (živá oblast)
       volby.siroke     — funkce() → true, když je okno dost široké na mřížku (výchozí: ≥ 900 px)
     ════════════════════════════════════════════════════════════════════════ */
  function pripoj(koren, volby) {
    volby = volby || {};
    const doc = koren.ownerDocument, win = doc.defaultView;
    const uloziste = volby.uloziste || (() => { try { return win.localStorage; } catch (e) { return null; } })();
    const siroke = volby.siroke || (() => win.matchMedia('(min-width: 900px)').matches);
    const zprava = volby.zprava || (() => {});
    const prvky = {};
    let rozlozeni = vychozi(), klic = klicUloziste('', 'hodina'), uprava = false, tazeni = null, bezi = false;

    koren.classList.add('ic-mr');
    PANELY.forEach(m => {
      const el = koren.querySelector('[data-ic-panel="' + m.id + '"]');
      if (!el) return;
      /* obsah do rolovací vrstvy — ID uvnitř zůstávají, jen se přesunou o úroveň níž */
      const vnitr = doc.createElement('div'), obsah = doc.createElement('div');
      vnitr.className = 'ic-vnitr'; vnitr.tabIndex = 0; vnitr.setAttribute('role', 'region'); vnitr.setAttribute('aria-label', m.nazev);
      obsah.className = 'ic-obsah';                                    // jeho výšku měříme: podle ní roste panel řízený obsahem
      while (el.firstChild) obsah.appendChild(el.firstChild);
      vnitr.appendChild(obsah); el.appendChild(vnitr);
      const uchyt = doc.createElement('button');
      uchyt.type = 'button'; uchyt.className = 'ic-uchyt'; uchyt.hidden = true; uchyt.textContent = '⠿';
      uchyt.setAttribute('aria-label', 'Panel ' + m.nazev + ': šipky přesouvají, Shift a šipky mění velikost');
      uchyt.title = 'Táhni za úchyt. Z klávesnice: šipky = přesun, Shift + šipky = velikost';
      const roh = doc.createElement('span');
      roh.className = 'ic-roh'; roh.hidden = true; roh.setAttribute('aria-hidden', 'true'); roh.title = 'Táhni pro změnu velikosti';
      el.append(uchyt, roh);
      prvky[m.id] = { el, uchyt, roh, obsah };
      uchyt.addEventListener('keydown', e => klavesnice(e, m.id));
      uchyt.addEventListener('pointerdown', e => zacniTazeni(e, m.id, 'presun', uchyt));
      roh.addEventListener('pointerdown', e => zacniTazeni(e, m.id, 'velikost', roh));
    });

    const viditelne = () => new Set(ID.filter(id => prvky[id] && !prvky[id].el.hidden));
    function uplatni(l) {
      rozlozeni = l;
      const sir = siroke();
      koren.classList.toggle('ic-mr', sir);
      l.forEach(p => {
        const o = prvky[p.id]; if (!o) return;
        o.el.style.gridColumn = sir ? (p.x + 1) + ' / span ' + p.w : '';
        o.el.style.gridRow = sir ? (p.y + 1) + ' / span ' + p.h : '';
      });
    }
    /* Panely řízené obsahem dostanou výšku podle změřeného obsahu (jen při mřížce a jen viditelné). */
    function zmerVysky() {
      if (!siroke()) return;
      const cs = win.getComputedStyle(koren), mezera = parseFloat(cs.rowGap) || 0, radek = parseFloat(cs.gridAutoRows) || 36, radky = {};
      /* nevykreslený obsah (výška 0: záložka je schovaná) se neměří, jinak by se panel při návratu na chvíli smrskl */
      ID.forEach(id => { const o = prvky[id]; if (o && !o.el.hidden && o.obsah.offsetHeight > 0) radky[id] = radkuPro(o.obsah.offsetHeight + 2, radek, mezera); });
      rozlozeni = prizpusob(rozlozeni, radky);
    }
    function prekresli() { koren.classList.toggle('ic-mr', siroke()); zmerVysky(); uplatni(kompaktuj(rozlozeni, viditelne())); }
    let rafBezi = false;
    function naplanuj() { if (rafBezi) return; rafBezi = true; win.requestAnimationFrame(() => { rafBezi = false; prekresli(); zobrazUchyty(); }); }
    function jeUprava() { return uprava && siroke() && !koren.closest('.ic-proj'); }
    function zobrazUchyty() {
      const ukaz = jeUprava();
      koren.classList.toggle('ic-uprava', ukaz);
      PANELY.forEach(m => { const o = prvky[m.id]; if (o) { o.uchyt.hidden = !ukaz; o.roh.hidden = !ukaz; } });
    }
    function uloz() {
      if (!uloziste) return;
      try { uloziste.setItem(KLIC, ulozDoTextu(uloziste.getItem(KLIC), klic, rozlozeni)); } catch (e) { /* plné úložiště apod. — rozložení platí aspoň do obnovení */ }
    }
    function nacti(novyKlic) {
      klic = novyKlic;
      let l = null;
      try { l = uloziste ? nactiUlozene(uloziste.getItem(KLIC), klic) : null; } catch (e) { l = null; }
      rozlozeni = l || vychozi();
      prekresli();
    }
    function obnov() {
      if (uloziste) { try { const t = uloziste.getItem(KLIC); if (t) uloziste.setItem(KLIC, smazDoTextu(t, klic)); } catch (e) { /* nic */ } }
      rozlozeni = vychozi(); prekresli(); zprava('Rozložení panelů je výchozí.');
    }
    function nastavUpravu(zap) { uprava = !!zap; zobrazUchyty(); }

    function klavesnice(e, id) {
      if (!jeUprava() || e.altKey || e.ctrlKey || e.metaKey) return;
      if (!/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
      e.preventDefault();
      const nove = klavesa(rozlozeni, id, e.key, e.shiftKey, viditelne());
      if (stejne(nove, kompaktuj(rozlozeni, viditelne()))) { zprava(popis(nove.find(p => p.id === id)) + ' (dál to nejde)'); return; }
      uplatni(nove); uloz(); zprava(popis(nove.find(p => p.id === id)));
    }
    function rozmeryBunek() {
      const cs = win.getComputedStyle(koren), mezera = parseFloat(cs.columnGap) || 0, radek = parseFloat(cs.gridAutoRows) || 36;
      const sirka = koren.getBoundingClientRect().width;
      return { sl: (sirka + mezera) / SLOUPCU, ra: radek + (parseFloat(cs.rowGap) || 0) };
    }
    function zacniTazeni(e, id, druh, el) {
      if (!jeUprava() || (e.button !== undefined && e.button > 0)) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (x) { /* v testu bez skutečného ukazatele */ }
      const z = kompaktuj(rozlozeni, viditelne());
      tazeni = { id, druh, sx: e.clientX, sy: e.clientY, z, p: z.find(q => q.id === id), el, pid: e.pointerId, bunky: rozmeryBunek() };
      el.addEventListener('pointermove', pohyb); el.addEventListener('pointerup', konec); el.addEventListener('pointercancel', zrus);
      prvky[id].el.classList.add('ic-taha');
    }
    function pohyb(e) {
      if (!tazeni || e.pointerId !== tazeni.pid) return;
      const dx = Math.round((e.clientX - tazeni.sx) / tazeni.bunky.sl), dy = Math.round((e.clientY - tazeni.sy) / tazeni.bunky.ra);
      const t = tazeni;
      uplatni(t.druh === 'presun' ? presun(t.z, t.id, t.p.x + dx, t.p.y + dy, viditelne()) : zmenVelikost(t.z, t.id, t.p.w + dx, t.p.h + dy, viditelne()));
    }
    function uklid() {
      const t = tazeni; tazeni = null;
      if (!t) return null;
      t.el.removeEventListener('pointermove', pohyb); t.el.removeEventListener('pointerup', konec); t.el.removeEventListener('pointercancel', zrus);
      try { t.el.releasePointerCapture(t.pid); } catch (x) { /* už uvolněno */ }
      prvky[t.id].el.classList.remove('ic-taha');
      return t;
    }
    function konec(e) {
      if (!tazeni || e.pointerId !== tazeni.pid) return;
      const t = uklid(); uloz(); zprava(popis(rozlozeni.find(p => p.id === t.id)));
    }
    function zrus() { const t = uklid(); if (t) uplatni(t.z); }

    /* skrytí/zobrazení panelu a přepnutí projektoru se promítne hned */
    if (win.MutationObserver) {
      const mo = new win.MutationObserver(() => { if (!bezi) { bezi = true; Promise.resolve().then(() => { bezi = false; prekresli(); zobrazUchyty(); }); } });
      PANELY.forEach(m => { if (prvky[m.id]) mo.observe(prvky[m.id].el, { attributes: true, attributeFilter: ['hidden'] }); });
      const proj = koren.closest('#ic-root');
      if (proj) mo.observe(proj, { attributes: true, attributeFilter: ['class'] });
    }
    win.addEventListener('resize', () => { prekresli(); zobrazUchyty(); });
    if (win.ResizeObserver) { const ro = new win.ResizeObserver(naplanuj); PANELY.forEach(m => { if (prvky[m.id]) ro.observe(prvky[m.id].obsah); }); }
    prekresli();
    return { nacti, obnov, prekresli, uprav: nastavUpravu, jeUprava, rozlozeni: () => kopie(rozlozeni), klic: () => klic };
  }

  return {
    SLOUPCU, MAX_RADKU, MAX_VYSKA, MAX_ULOZENO, KLIC, PANELY, ID,
    vychozi, omez, kompaktuj, presun, zmenVelikost, radkuPro, prizpusob, klavesa, prekryv, stejne,
    serializuj, ocisti, klicUloziste, nactiUlozene, ulozDoTextu, smazDoTextu, popis, pripoj,
  };
});
