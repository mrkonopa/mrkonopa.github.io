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
     · SCÉNÁŘE: rozložení pro určitou činnost (Samostatná práce, Týmový souboj a vlastní pod jménem); každý scénář
       má pro každou třídu své rozložení a množinu panelů (panel jde odebrat a vrátit)
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

  const SLOUPCU = 12, MAX_RADKU = 200, MAX_VYSKA = 60, MAX_ULOZENO = 100, MAX_VLASTNICH = 10, MAX_NAZEV = 30;
  const KLIC = 'RPG_INFOCENTRUM_ROZLOZENI';

  /* Registr panelů: výchozí poloha a nejmenší velikost, při níž je obsah ještě čitelný. Pořadí v poli je pořadí
     při shodě polohy (Týmy jsou nad ostatními). Další panely se přidávají sem. */
  const PANELY = [
    /* Místnost je v registru PRVNÍ: při shodě polohy (všechny panely schované kromě Kdo hraje a Děje se leží na y = 0,
       a když souboj začne, vracejí se Místnost a Týmy na y = 0 také) vyhrává dřívější panel, takže pruh Místnost je nad
       Týmy a ty nad ostatními. Poloha je poloha při prvním přidání do Samostatné práce. */
    { id: 'mistnost', nazev: 'Místnost souboje', x: 0, y: 0,  w: 12, h: 5,  minW: 4, minH: 4 },
    { id: 'tymy',  nazev: 'Týmy',            x: 0, y: 0,  w: 12, h: 12, minW: 6, minH: 8 },
    { id: 'kdo',   nazev: 'Kdo hraje',       x: 0, y: 12, w: 8,  h: 17, minW: 4, minH: 5 },
    { id: 'trida', nazev: 'Třída dohromady', x: 8, y: 12, w: 4,  h: 8,  minW: 3, minH: 7 },
    { id: 'deje',  nazev: 'Děje se',         x: 8, y: 20, w: 4,  h: 9,  minW: 3, minH: 5 },
    /* Etapa 3: v Samostatné práci jsou ve výchozím stavu odebrané (přidají se přes „＋ Přidat panel“). Místnost je
       ve scénáři Týmový souboj nahoře. */
    { id: 'kde',      nazev: 'Kde kdo je',       x: 0, y: 29, w: 8,  h: 8,  minW: 4, minH: 5 },
    { id: 'mapa',     nazev: 'Mapa misí',        x: 0, y: 37, w: 8,  h: 12, minW: 5, minH: 7 },
    { id: 'stopky',   nazev: 'Čas',              x: 8, y: 29, w: 4,  h: 8,  minW: 3, minH: 6 },
  ];
  const meta = id => PANELY.find(p => p.id === id) || null;
  const ID = PANELY.map(p => p.id);
  /* Panely z etapy 3: ve výchozím rozložení Samostatné práce nejsou (nic se nezměnilo těm, kdo je už používají) */
  const NOVE = ['mistnost', 'kde', 'mapa', 'stopky'];

  const celeCislo = (v, od, do_) => {
    const n = typeof v === 'number' ? v : NaN;
    if (!isFinite(n)) return null;
    return Math.min(do_, Math.max(od, Math.round(n)));
  };

  /* Vestavěné scénáře (id se ukládá, proto se nikdy nepřejmenovává). Vlastní scénáře mají id `v…` a jméno od uživatele. */
  const SCENARE = [
    { id: 'hodina', nazev: 'Samostatná práce' },
    { id: 'souboj', nazev: 'Týmový souboj' },
  ];
  const ID_VESTAVENYCH = SCENARE.map(x => x.id);

  /* `a` = výška se řídí obsahem (h je jen poslední změřená hodnota); a === false = výška připnutá uživatelem;
     `o` = panel je v rozložení (o === false = odebraný, neukazuje se a nezabírá místo, uložená poloha zůstane). */
  function vychozi(scenar) {
    const l = PANELY.map(p => ({ id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, a: true, o: !NOVE.includes(p.id) }));
    if (scenar === 'souboj') {
      /* Týmový souboj: nahoře pruh Místnost (kód, otázka, odpočet), pod ním Týmy přes celou šířku, pod nimi Kdo hraje a
         Děje se; Třída dohromady se k souboji nehodí. Místnost a Týmy mají ZÁMĚRNĚ obě y = 0 (srážku vyřeší gravitace:
         vyhraje Místnost, Týmy ustoupí pod ni) — jen tak se po začátku souboje seřadí správně, i když Kdo hraje a Děje se
         mezitím vyrostly nahoru na y = 0. Výsledek po srovnání: Místnost 0, Týmy 5, Kdo hraje a Děje se 17. */
      l.forEach(p => {
        if (p.id === 'trida') p.o = false;
        if (p.id === 'mistnost') p.o = true;
        if (p.id === 'kdo' || p.id === 'deje') p.y = 17;
      });
    }
    return l;
  }
  const kopie = l => l.map(p => ({ id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, a: p.a !== false, o: p.o !== false }));
  const prekryv = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const sloupceSdileji = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w;

  /* Velikost a poloha jednoho panelu do mezí (šířka k nejmenší velikosti a k 12 sloupcům, x tak, aby panel nevyčníval). */
  function omez(p) {
    const m = meta(p.id);
    const w = Math.min(SLOUPCU, Math.max(m.minW, p.w));
    const h = Math.min(MAX_VYSKA, Math.max(m.minH, p.h));
    return { id: p.id, w, h, a: p.a !== false, o: p.o !== false, x: Math.min(SLOUPCU - w, Math.max(0, p.x)), y: Math.min(MAX_RADKU, Math.max(0, p.y)) };
  }

  /* Gravitace: viditelné panely se seřadí podle (y, přednost, x, pořadí v registru); každý se postaví na požadované
     místo, při srážce s už postaveným se posune pod něj a pak „spadne“ nahoru, jak to jde. Skryté panely se
     nemění (neukazují se, jejich uložená poloha zůstane). `prednost` = panel, který uživatel právě táhne:
     při shodném y je první, takže ostatní ustupují jemu. Výsledek je bez překryvů a při opakování se nemění. */
  function kompaktuj(rozlozeni, viditelne, prednost) {
    const vid = viditelne instanceof Set ? viditelne : new Set(viditelne || ID);
    const vstup = rozlozeni.map(omez);
    const poradi = vstup.map((p, i) => ({ p, i })).filter(o => vid.has(o.p.id) && o.p.o !== false)
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
      const hotovy = { id: p.id, x: p.x, y, w: p.w, h: p.h, a: p.a, o: true };
      umistene.push(hotovy); vysledek.set(p.id, hotovy);
    }
    return vstup.map(p => vysledek.get(p.id) || p);
  }

  const klicPolohy = l => l.map(p => p.id + ':' + p.x + ',' + p.y + ',' + p.w + ',' + p.h + (p.a === false ? 'p' : 'a') + (p.o === false ? 'x' : '')).join(';');
  const stejne = (a, b) => klicPolohy(a) === klicPolohy(b);
  const vSadu = v => v instanceof Set ? v : new Set(v || ID);

  /* Přesun na požadované místo (v buňkách). Poloha se omezí na mřížku, ostatní panely ustoupí. */
  function presun(rozlozeni, id, x, y, viditelne) {
    if (!meta(id)) return kopie(rozlozeni);
    const nove = rozlozeni.map(p => p.id === id ? omez({ id, x: celeCislo(x, 0, SLOUPCU) === null ? p.x : x, y: celeCislo(y, 0, MAX_RADKU) === null ? p.y : y, w: p.w, h: p.h, a: p.a, o: p.o }) : p);
    return kompaktuj(nove, vSadu(viditelne), id);
  }

  /* Odebrání panelu z rozložení (jeho poloha se pamatuje) a návrat: vrácený panel se postaví pod ostatní a gravitace
     ho zvedne na první volné místo ve svých sloupcích. */
  function odeber(rozlozeni, id) {
    return rozlozeni.map(p => Object.assign({}, p, p.id === id && meta(id) ? { o: false } : {}));
  }
  function pridej(rozlozeni, id, viditelne) {
    if (!meta(id)) return kopie(rozlozeni);
    const vid = new Set(vSadu(viditelne)); vid.add(id);
    return kompaktuj(rozlozeni.map(p => p.id === id ? Object.assign({}, p, { o: true, y: MAX_RADKU }) : p), vid, id);
  }

  /* Změna velikosti (v buňkách). Nejmenší velikost drží panel čitelný, největší je celá šířka. Změna VÝŠKY panel
     připne (přestane se řídit obsahem), změna samotné šířky ne. */
  function zmenVelikost(rozlozeni, id, w, h, viditelne) {
    if (!meta(id)) return kopie(rozlozeni);
    const nove = rozlozeni.map(p => {
      if (p.id !== id) return p;
      const o = omez({ id, x: p.x, y: p.y, w: celeCislo(w, 1, SLOUPCU) === null ? p.w : w, h: celeCislo(h, 1, MAX_VYSKA) === null ? p.h : h, a: p.a, o: p.o });
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
    rozlozeni.forEach(p => { if (meta(p.id)) { const a = [p.x, p.y, p.w, p.a === false ? p.h : 0]; if (p.o === false) a.push(0); o[p.id] = a; } });
    return o;
  }
  /* Nedůvěřivé čtení: cokoli neznámé nebo rozbité se nahradí výchozím panelem; výsledek je vždy platné rozložení. */
  function ocisti(raw, viditelne, scenar) {
    const ziskej = (o, id) => (o && typeof o === 'object' && !Array.isArray(o) && Object.prototype.hasOwnProperty.call(o, id)) ? o[id] : undefined;
    const vych = vychozi(scenar);
    const l = PANELY.map(m => {
      const a = ziskej(raw, m.id);
      const zaklad = vych.find(q => q.id === m.id);
      if (!Array.isArray(a) || (a.length !== 4 && a.length !== 5)) return zaklad;
      const odebrany = a.length === 5 && a[4] === 0;
      const automaticka = a[3] === 0;
      const w = celeCislo(a[2], m.minW, SLOUPCU), h = automaticka ? m.h : celeCislo(a[3], m.minH, MAX_VYSKA);
      const x = celeCislo(a[0], 0, SLOUPCU), y = celeCislo(a[1], 0, MAX_RADKU);
      if (w === null || h === null || x === null || y === null) return zaklad;
      return omez({ id: m.id, x, y, w, h, a: automaticka, o: !odebrany });
    });
    return kompaktuj(l, vSadu(viditelne));
  }
  const klicUloziste = (cid, scenar) => String(cid || '') + '|' + String(scenar || 'hodina');

  /* Úložiště je jeden text {v:1, r:{"třída|scénář": rozložení}, s:[{id, nazev}] (vlastní scénáře), a:{třída: id aktivního}}.
     Čte se nedůvěřivě: co nesedí, se zahodí a použije se výchozí. Zápis vždy zachová všechny tři části. */
  function rozbor(text) {
    let o = null;
    try { o = JSON.parse(text); } catch (e) { o = null; }
    const platne = o && typeof o === 'object' && !Array.isArray(o) && o.v === 1;
    const objekt = v => v && typeof v === 'object' && !Array.isArray(v);
    return { r: platne && objekt(o.r) ? o.r : {}, s: platne && Array.isArray(o.s) ? o.s : [], a: platne && objekt(o.a) ? o.a : {} };
  }
  const slozit = (r, s, a) => JSON.stringify({ v: 1, r, s, a });
  const vlastn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const cistyNazev = v => (typeof v === 'string' ? v : '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_NAZEV);

  /* Vlastní scénáře ze zápisu: jen platné (id `v…` z malých písmen a číslic, jméno 1–30 znaků), bez duplicit, nejvýš 10. */
  function vlastniScenare(s) {
    const videno = new Set(ID_VESTAVENYCH), nazvy = new Set(), v = [];
    (Array.isArray(s) ? s : []).forEach(x => {
      if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !/^v[a-z0-9]{1,12}$/.test(x.id) || videno.has(x.id)) return;
      const nazev = cistyNazev(x.nazev);
      if (!nazev || nazvy.has(nazev.toLowerCase()) || v.length >= MAX_VLASTNICH) return;
      videno.add(x.id); nazvy.add(nazev.toLowerCase()); v.push({ id: x.id, nazev, vlastni: true });
    });
    return v;
  }
  function seznamScenaru(text) {
    return SCENARE.map(x => ({ id: x.id, nazev: x.nazev, vlastni: false })).concat(vlastniScenare(rozbor(text).s));
  }
  /* Aktivní scénář třídy; neznámý nebo smazaný → Samostatná práce. */
  function aktivniScenar(text, cid) {
    const { a } = rozbor(text), seznam = seznamScenaru(text), k = String(cid || '');
    return (vlastn(a, k) && typeof a[k] === 'string' && seznam.some(x => x.id === a[k])) ? a[k] : 'hodina';
  }
  function nastavAktivni(text, cid, id) {
    if (!seznamScenaru(text).some(x => x.id === id)) return text;
    const { r, s, a } = rozbor(text), k = String(cid || ''), nove = {};
    Object.keys(a).filter(x => x !== k).slice(-(MAX_ULOZENO - 1)).forEach(x => { nove[x] = a[x]; });
    nove[k] = id;
    return slozit(r, s, nove);
  }
  /* Nový vlastní scénář `nazev` s id `id` (id vymýšlí volající). Vrací {text} nebo {chyba}. */
  function pridejScenar(text, nazev, id) {
    const jmeno = cistyNazev(nazev), { r, s, a } = rozbor(text), seznam = seznamScenaru(text);
    if (!jmeno) return { chyba: 'Napiš název scénáře.' };
    if (typeof id !== 'string' || !/^v[a-z0-9]{1,12}$/.test(id) || seznam.some(x => x.id === id)) return { chyba: 'Scénář se nepodařilo vytvořit.' };
    if (seznam.some(x => x.nazev.toLowerCase() === jmeno.toLowerCase())) return { chyba: 'Scénář s tímto názvem už existuje.' };
    if (seznam.filter(x => x.vlastni).length >= MAX_VLASTNICH) return { chyba: 'Vlastních scénářů může být nejvýš ' + MAX_VLASTNICH + '.' };
    return { text: slozit(r, vlastniScenare(s).map(x => ({ id: x.id, nazev: x.nazev })).concat([{ id, nazev: jmeno }]), a) };
  }
  /* Smaže vlastní scénář, jeho rozložení u všech tříd a odkazy na něj jako na aktivní. Vestavěné nejdou smazat. */
  function smazScenar(text, id) {
    if (!vlastniScenare(rozbor(text).s).some(x => x.id === id)) return text;
    const { r, s, a } = rozbor(text), nr = {}, na = {};
    Object.keys(r).filter(k => !k.endsWith('|' + id)).forEach(k => { nr[k] = r[k]; });
    Object.keys(a).filter(k => a[k] !== id).forEach(k => { na[k] = a[k]; });
    return slozit(nr, vlastniScenare(s).filter(x => x.id !== id).map(x => ({ id: x.id, nazev: x.nazev })), na);
  }

  /* Text z úložiště → rozložení pro daný klíč nebo null (nic uložené / rozbité). `scenar` určuje výchozí podobu chybějících panelů. */
  function nactiUlozene(text, klic, scenar) {
    const { r } = rozbor(text);
    if (!vlastn(r, klic)) return null;
    return ocisti(r[klic], undefined, scenar);
  }
  /* Přidá/nahradí rozložení pro klíč a vrátí nový text; drží nejvýš MAX_ULOZENO nejnovějších klíčů. */
  function ulozDoTextu(text, klic, rozlozeni) {
    const { r, s, a } = rozbor(text), nove = {};
    Object.keys(r).filter(k => k !== klic).slice(-(MAX_ULOZENO - 1)).forEach(k => { nove[k] = r[k]; });
    nove[klic] = serializuj(rozlozeni);
    return slozit(nove, s, a);
  }
  function smazDoTextu(text, klic) {
    const o = rozbor(text);
    if (!vlastn(o.r, klic)) return text;
    delete o.r[klic];
    return slozit(o.r, o.s, o.a);
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
       volby.onZmena    — funkce() po změně scénáře, jejich seznamu nebo množiny panelů (stránka přestaví nabídky)
       volby.siroke     — funkce() → true, když je okno dost široké na mřížku (výchozí: ≥ 900 px)
     ════════════════════════════════════════════════════════════════════════ */
  function pripoj(koren, volby) {
    volby = volby || {};
    const doc = koren.ownerDocument, win = doc.defaultView;
    const uloziste = volby.uloziste || (() => { try { return win.localStorage; } catch (e) { return null; } })();
    const siroke = volby.siroke || (() => win.matchMedia('(min-width: 900px)').matches);
    const zprava = volby.zprava || (() => {});
    const prvky = {};
    let cid = '', scenar = 'hodina', rozlozeni = vychozi(), klic = klicUloziste(cid, scenar), uprava = false, tazeni = null, bezi = false;

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
      const odebrat = doc.createElement('button');
      odebrat.type = 'button'; odebrat.className = 'ic-odeber'; odebrat.hidden = true; odebrat.textContent = '✕';
      odebrat.setAttribute('aria-label', 'Odebrat panel ' + m.nazev + ' z rozložení'); odebrat.title = 'Odebrat panel z rozložení (vrátíš ho přes „Přidat panel“)';
      odebrat.addEventListener('click', () => odeberPanel(m.id));
      el.append(odebrat, uchyt, roh);
      prvky[m.id] = { el, uchyt, roh, odebrat, obsah };
      uchyt.addEventListener('keydown', e => klavesnice(e, m.id));
      uchyt.addEventListener('pointerdown', e => zacniTazeni(e, m.id, 'presun', uchyt));
      roh.addEventListener('pointerdown', e => zacniTazeni(e, m.id, 'velikost', roh));
    });

    const vypnuty = id => { const p = rozlozeni.find(q => q.id === id); return !!p && p.o === false; };
    const viditelne = () => new Set(ID.filter(id => prvky[id] && !prvky[id].el.hidden && !vypnuty(id)));
    function uplatni(l) {
      rozlozeni = l;
      const sir = siroke();
      koren.classList.toggle('ic-mr', sir);
      l.forEach(p => {
        const o = prvky[p.id]; if (!o) return;
        o.el.style.display = p.o === false ? 'none' : '';
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
      PANELY.forEach(m => { const o = prvky[m.id]; if (o) { o.uchyt.hidden = !ukaz; o.roh.hidden = !ukaz; o.odebrat.hidden = !ukaz; } });
    }
    const text = () => { try { return uloziste ? uloziste.getItem(KLIC) : null; } catch (e) { return null; } };
    const zapis = t => { if (!uloziste) return; try { uloziste.setItem(KLIC, t); } catch (e) { /* plné úložiště apod. — platí aspoň do obnovení */ } };
    const zmena = () => { if (volby.onZmena) { try { volby.onZmena(); } catch (e) { /* stránka si nabídky řeší sama */ } } };
    const nazevScenare = id => { const x = seznamScenaru(text()).find(q => q.id === id); return x ? x.nazev : id; };
    function uloz() { zapis(ulozDoTextu(text(), klic, rozlozeni)); }
    function nactiRozlozeni() {
      klic = klicUloziste(cid, scenar);
      let l = null;
      try { l = nactiUlozene(text(), klic, scenar); } catch (e) { l = null; }
      rozlozeni = l || vychozi(scenar);
      prekresli();
    }
    /* Třída se změnila: načte se její aktivní scénář a rozložení pro dvojici třída + scénář. */
    function nacti(novaTrida) {
      cid = String(novaTrida || '');
      scenar = aktivniScenar(text(), cid);
      nactiRozlozeni(); zmena();
    }
    function obnov() {
      const t = text();
      if (t) zapis(smazDoTextu(t, klic));
      rozlozeni = vychozi(scenar); prekresli(); zmena(); zprava('Rozložení panelů je výchozí.');
    }
    function prepniScenar(id) {
      if (!seznamScenaru(text()).some(x => x.id === id)) return false;
      scenar = id; zapis(nastavAktivni(text(), cid, id));
      nactiRozlozeni(); zmena(); zprava('Scénář: ' + nazevScenare(id));
      return true;
    }
    /* Uloží AKTUÁLNÍ rozložení pod novým jménem a přepne na něj. */
    function novyScenar(nazev) {
      const id = 'v' + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36);
      const r = pridejScenar(text(), nazev, id);
      if (r.chyba) return { ok: false, chyba: r.chyba };
      scenar = id; klic = klicUloziste(cid, id);
      zapis(ulozDoTextu(nastavAktivni(r.text, cid, id), klic, rozlozeni));
      zmena(); zprava('Scénář „' + nazevScenare(id) + '“ je uložen.');
      return { ok: true, id };
    }
    function smaz(id) {
      const t = text();
      if (!seznamScenaru(t).some(x => x.id === id && x.vlastni)) return false;
      zapis(smazScenar(t, id));
      if (scenar === id) { scenar = 'hodina'; nactiRozlozeni(); }
      zmena(); zprava('Scénář je smazán.');
      return true;
    }
    function odeberPanel(id) {
      if (!meta(id)) return;
      uplatni(kompaktuj(odeber(rozlozeni, id), viditelne())); uloz(); zmena();
      zprava(meta(id).nazev + ': panel je odebrán z rozložení.');
    }
    function pridejPanel(id) {
      if (!meta(id)) return;
      uplatni(pridej(rozlozeni, id, viditelne())); uloz(); zmena();
      zprava(popis(rozlozeni.find(p => p.id === id)) + ' (přidáno)');
    }
    const chybejici = () => rozlozeni.filter(p => p.o === false && prvky[p.id]).map(p => ({ id: p.id, nazev: meta(p.id).nazev }));
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
    return {
      nacti, obnov, prekresli, uprav: nastavUpravu, jeUprava, rozlozeni: () => kopie(rozlozeni), klic: () => klic,
      scenare: () => ({ seznam: seznamScenaru(text()), aktivni: scenar }), prepniScenar, novyScenar, smazScenar: smaz,
      odeberPanel, pridejPanel, chybejici,
    };
  }

  return {
    SLOUPCU, MAX_RADKU, MAX_VYSKA, MAX_ULOZENO, MAX_VLASTNICH, MAX_NAZEV, KLIC, PANELY, ID, SCENARE,
    vychozi, omez, kompaktuj, presun, zmenVelikost, odeber, pridej, radkuPro, prizpusob, klavesa, prekryv, stejne,
    serializuj, ocisti, klicUloziste, nactiUlozene, ulozDoTextu, smazDoTextu, popis, pripoj,
    seznamScenaru, aktivniScenar, nastavAktivni, pridejScenar, smazScenar,
  };
});
