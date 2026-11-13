/* ══════════════════════════════════════════════════════════════════════
   INFOCENTRUM HODINY — čistá logika (bez DOM a bez sítě), autor Vojtěch Konopa.

   Učitelská konzole (`rpg-ucitel.html`, záložka INFOCENTRUM) z uložených postav žáků počítá,
   KDO V TÉHLE HODINĚ CO PŘIDAL, a ukazuje to na dataprojektoru. Tenhle modul drží jen výpočty,
   aby je šlo zkoušet v Node (`tests/rpg-infocentrum.test.cjs`) a aby konzole nesla jen vykreslení.

   Co modul záměrně NEDĚLÁ: nečte počty chyb (`errs`, `errsSnap`) — na plátně před třídou se
   chyby nikomu nezobrazují (Vojtovo rozhodnutí 1. 11. 2026). Řazení je podle úkolů a misí
   splněných v hodině, ne podle celkového stavu.

   Žákovská data (`data` v tabulce `saves`) píše žák, takže se tu NIKDY nevěří: čísla se ořezávají,
   klíče kontrolují vzorem a počet klíčů má strop (viz CLAUDE.md, „žákovský JSON je nepřátelský“).
   ══════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RPGInfo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const UKOLU_V_MISI = 6;            // všech 147 misí ve hrách 3–9 má tc: 6
  const MISI_V_OBLASTI = 3;
  const ONLINE_MIN = 3;              // hra posílá tep každé 2 minuty, 3 minuty = „právě hraje“
  const UKOLU_NA_HRACE = 10;         // cíl stupně = 10 úkolů na hráče ve hře
  const MIN_KROK = 20;               // ať cíl neklesne pod rozumnou hodnotu, když hraje pár žáků
  const MAX_KLICU = 600;             // strop počtu klíčů v `done` (platných je nejvýš 7 × 3 × 6 = 126)
  const RE_UKOL = /^([1-7])-([1-3])-([0-5])$/;
  const RE_ODZNAK = /^[a-z0-9_-]{1,24}$/;
  const RE_MISE = /^[1-7]-[1-3]$/;
  const KDE_TYPY = ['boj', 'trenink', 'teorie', 'vez', 'mapa', 'souboj'];   // co hra posílá v poli `cur.s`
  const KDE_S_MISI = ['boj', 'trenink', 'teorie'];
  const CS = new Intl.Collator('cs');

  /* Neutrální názvy odznaků (ve hrách má každý ročník svůj tematický název). Test hlídá, že každé
     id z `const ACH=[…]` všech sedmi her tu je — nový odznak bez zápisu tady shodí bránu. */
  const ODZNAKY = {
    boot: 'První úkol', crit: 'Kritické zásahy', combo5: 'Combo 5', flawless: 'Mise bez nápovědy',
    flash: 'Bleskový', survivor: 'Z posledních sil', area1: 'První oblast', half: 'Půlka oblastí',
    root: 'Všechny oblasti', lv5: 'Úroveň 5', lv10: 'Úroveň 10', master1: 'Mistr tématu',
    train50: 'Trenér', streak3: 'Tři dny v řadě', streak7: 'Týden v řadě',
    battle1: 'První klání', battlewin: 'Vítěz souboje', battleflawless: 'Bezchybný souboj', battleteam: 'Týmový hráč', battlestreak3: 'Série výher', battle10: 'Stálý bojovník', star1: 'Oživovatel',
  };

  function cislo(v, max) {
    const n = Math.floor(Number(v));
    return isFinite(n) && n > 0 ? Math.min(n, max) : 0;
  }
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }

  /* Řídicí znaky a přepínače směru textu (U+0000–001F, 007F, 200B–200F, 2028–202F) — sestaveno z kódů, ne z escape sekvencí. */
  const kod = c => String.fromCharCode(c);
  const RIDICI = new RegExp('[' + kod(0) + '-' + kod(31) + kod(127) + kod(0x200b) + '-' + kod(0x200f) + kod(0x2028) + '-' + kod(0x202f) + ']', 'g');

  /* „Anna Nováková“ → „Anna N.“, jedno slovo zůstane, prázdné → „Hráč“. Bez řídicích znaků, nejvýš 14 + 3 znaků. */
  function kratke(jm) {
    const cista = String(jm == null ? '' : jm).replace(RIDICI, ' ').trim();
    const casti = cista.split(/\s+/).filter(Boolean);
    if (!casti.length) return 'Hráč';
    const krestni = Array.from(casti[0]).slice(0, 14).join('');
    if (casti.length < 2) return krestni;
    const prijmeni = Array.from(casti[casti.length - 1]);
    return krestni + ' ' + prijmeni[0].toUpperCase() + '.';
  }
  function jmeno(r) {
    const d = obj(r && r.data);
    return kratke((r && r.full_name) || d.name || (r && r.name) || '');
  }

  /* Pole `cur` z uložení: {s: typ obrazovky, m: mise}. Píše ho hra, ale uložení patří žákovi, takže se tu ověřuje
     znovu: typ jen z pevného seznamu, mise jen tvaru „oblast-mise“ a jen u typů, které misi mají. Cokoli jiného → null. */
  function kde(c) {
    const o = obj(c);
    const s = typeof o.s === 'string' && KDE_TYPY.indexOf(o.s) >= 0 ? o.s : null;
    if (!s) return null;
    const m = KDE_S_MISI.indexOf(s) >= 0 && typeof o.m === 'string' && RE_MISE.test(o.m) ? o.m : null;
    return { s, m };
  }
  /* Krátká věta pro kartu žáka. Název mise (je-li znám) jde jen do `plne` (tooltip), na kartu se nevejde. */
  function kdeText(k, nazvyMisi) {
    if (!k || KDE_TYPY.indexOf(k.s) < 0) return { kratce: '', plne: '' };
    const jm = k.m && nazvyMisi && typeof nazvyMisi[k.m] === 'string' ? nazvyMisi[k.m] : '';
    const mise = k.m ? ' ' + k.m : '';
    const plne = jm ? ' „' + jm + '“' : '';
    if (k.s === 'boj') return { kratce: 'boj' + mise, plne: 'Boj v misi' + mise + plne };
    if (k.s === 'trenink') return { kratce: 'trénink' + mise, plne: 'Trénink' + (k.m ? ' mise' + mise + plne : '') };
    if (k.s === 'teorie') return { kratce: 'teorie' + mise, plne: 'Čte teorii' + (k.m ? ' mise' + mise + plne : '') };
    if (k.s === 'vez') return { kratce: 'věž legend', plne: 'Ve Věži legend' };
    if (k.s === 'souboj') return { kratce: 'živý souboj', plne: 'V živém souboji' };
    return { kratce: 'na mapě', plne: 'Na mapě' };
  }

  /* Postava z řádku tabulky `saves` → jen to, co infocentrum potřebuje. */
  function stav(r) {
    const d = obj(r && r.data), done = obj(d.done);
    const poMisich = {};
    let ukoly = 0, n = 0;
    for (const k in done) {                              // `for…in` je líný: hostilní `done` s miliony klíčů nestojí nic navíc
      if (++n > MAX_KLICU) break;                        // platných klíčů je nejvýš 126, víc je poškozené nebo podvržené uložení
      if (!Object.prototype.hasOwnProperty.call(done, k)) continue;
      const m = RE_UKOL.exec(k);
      if (!m || !done[k]) continue;
      ukoly++;
      const mid = m[1] + '-' + m[2];
      poMisich[mid] = (poMisich[mid] || 0) + 1;
    }
    const mise = Object.keys(poMisich).filter(mid => poMisich[mid] >= UKOLU_V_MISI).sort();
    const oblasti = [];
    for (let a = 1; a <= 7; a++) {
      let hotovo = 0;
      for (let i = 1; i <= MISI_V_OBLASTI; i++) if (mise.indexOf(a + '-' + i) >= 0) hotovo++;
      if (hotovo === MISI_V_OBLASTI) oblasti.push(a);
    }
    const ach = Object.keys(obj(d.ach)).filter(k => RE_ODZNAK.test(k)).slice(0, 60).sort();
    return {
      uid: String((r && r.user_id) || ''), game: String((r && r.game) || ''), jmeno: jmeno(r),
      xp: cislo(d.xp, 1e6), level: cislo(d.level, 9999) || 1,
      ukoly, mise, oblasti, ach, updated: (r && r.updated_at) || null, kde: kde(d.cur),
    };
  }
  const klic = s => s.uid + '|' + s.game;

  function online(updated, ted) {
    const t = Date.parse(updated);
    return isFinite(t) && (ted - t) < ONLINE_MIN * 60000 && (ted - t) > -60000;
  }

  /* ── pokrok v hodině: výchozí stav ukládá konzole při „Začít hodinu“ ── */
  function zaklad(stavy) {
    const z = {};
    for (const s of stavy) z[klic(s)] = [s.ukoly, s.mise.length, s.oblasti.length, s.xp, s.ach.length];
    return z;
  }
  /* Žák, který přišel až po začátku hodiny, začíná od svého prvního viděného stavu (jinak by se mu
     celá minulost počítala jako práce v hodině). Existující záznamy se nepřepisují. */
  function doplnZaklad(z, stavy) {
    for (const s of stavy) if (!Object.prototype.hasOwnProperty.call(z, klic(s))) z[klic(s)] = [s.ukoly, s.mise.length, s.oblasti.length, s.xp, s.ach.length];
    return z;
  }
  function prirustek(s, z) {
    const b = Object.prototype.hasOwnProperty.call(z, klic(s)) ? z[klic(s)] : [s.ukoly, s.mise.length, s.oblasti.length, s.xp, s.ach.length];
    const rozdil = (a, c) => Math.max(0, a - (Number(c) || 0));
    return {
      ukoly: rozdil(s.ukoly, b[0]), mise: rozdil(s.mise.length, b[1]), oblasti: rozdil(s.oblasti.length, b[2]),
      xp: rozdil(s.xp, b[3]), ach: rozdil(s.ach.length, b[4]),
    };
  }

  /* Řazení karet: víc úkolů v hodině nahoře, při shodě víc misí, pak abecedně (česky). Vstup se nemění. */
  function seradit(hraci) {
    return hraci.slice().sort((a, b) =>
      (b.prir.ukoly - a.prir.ukoly) || (b.prir.mise - a.prir.mise) || CS.compare(a.jmeno, b.jmeno) || CS.compare(a.uid, b.uid));
  }
  function souhrn(hraci) {
    const s = { ukoly: 0, mise: 0, oblasti: 0, ach: 0 };
    for (const h of hraci) { s.ukoly += h.prir.ukoly; s.mise += h.prir.mise; s.oblasti += h.prir.oblasti; s.ach += h.prir.ach; }
    return s;
  }

  /* ── události: rozdíl dvou po sobě jdoucích stavů téhož žáka ── */
  function udalosti(pred, nyni) {
    const ven = [];
    for (const s of nyni) {
      const p = pred[klic(s)];
      if (!p) continue;                                   // první spatření = žádná událost
      const noveMise = s.mise.filter(m => p.mise.indexOf(m) < 0);
      const noveOblasti = s.oblasti.filter(a => p.oblasti.indexOf(a) < 0);
      for (const a of noveOblasti) ven.push({ typ: 'oblast', uid: s.uid, jmeno: s.jmeno, oblast: a });
      for (const m of noveMise) {
        if (noveOblasti.indexOf(Number(m.split('-')[0])) >= 0) continue;   // dokončená oblast nahrazuje událost své poslední mise
        ven.push({ typ: 'mise', uid: s.uid, jmeno: s.jmeno, mise: m });
      }
      if (s.level > p.level) ven.push({ typ: 'uroven', uid: s.uid, jmeno: s.jmeno, level: s.level });
      for (const o of s.ach) if (p.ach.indexOf(o) < 0) ven.push({ typ: 'odznak', uid: s.uid, jmeno: s.jmeno, odznak: o });
    }
    const vaha = { oblast: 0, mise: 1, uroven: 2, odznak: 3 };
    return ven.sort((a, b) => (vaha[a.typ] - vaha[b.typ]) || CS.compare(a.jmeno, b.jmeno));
  }
  /* Stav pro příští srovnání (jen to, co `udalosti` čte). */
  function pamet(stavy) {
    const m = {};
    for (const s of stavy) m[klic(s)] = { mise: s.mise, oblasti: s.oblasti, level: s.level, ach: s.ach };
    return m;
  }

  function pocet(n, jedna, dva, pet) { return n === 1 ? jedna : (n >= 2 && n <= 4) ? dva : pet; }
  const ukolu = n => n + ' ' + pocet(n, 'úkol', 'úkoly', 'úkolů');
  const misi = n => n + ' ' + pocet(n, 'mise', 'mise', 'misí');

  /* Věta do přehledu událostí — záměrně BEZ slovesa v minulém čase: z jména nepoznáme rod. */
  function text(e, nazvyMisi) {
    const n = nazvyMisi && nazvyMisi[e.mise];
    if (e.typ === 'oblast') return e.jmeno + ' — dokončena oblast ' + e.oblast + '!';
    if (e.typ === 'mise') return e.jmeno + ' — mise ' + e.mise + (n ? ' „' + n + '“' : '') + ' splněna';
    if (e.typ === 'uroven') return e.jmeno + ' — úroveň ' + e.level;
    if (e.typ === 'odznak') return e.jmeno + ' — odznak „' + (ODZNAKY[e.odznak] || 'nový odznak') + '“';
    return e.jmeno;
  }

  /* ── automatický cíl hodiny: po splnění stupně se posune dál ── */
  const krokPro = hracu => Math.max(MIN_KROK, UKOLU_NA_HRACE * Math.max(0, Math.floor(Number(hracu)) || 0));
  function novyCil(hracu) { return { stupen: 1, zaklad: 0, krok: krokPro(hracu) }; }
  /* celkem = součet úkolů přidaných celou třídou v hodině. Vrací nový cíl, kolik je ve stupni a zda právě postoupila. */
  function posun(cil, celkem, hracu) {
    let c = { stupen: cil.stupen, zaklad: cil.zaklad, krok: cil.krok }, postoupila = false;
    const soucet = Math.max(0, Math.floor(Number(celkem)) || 0);
    for (let i = 0; i < 5 && soucet - c.zaklad >= c.krok; i++) {
      c = { stupen: c.stupen + 1, zaklad: c.zaklad + c.krok, krok: krokPro(hracu) };
      postoupila = true;
    }
    return { cil: c, vStupni: Math.max(0, Math.min(c.krok, soucet - c.zaklad)), postoupila };
  }

  /* ── týmy z právě běžícího živého souboje (`battle_state`, fáze 14) ── */
  /* Hráč souboje: odpojený = jeho `last_seen` je o víc než 20 s starší než NEJNOVĚJŠÍ `last_seen` v místnosti
     (hráč volá `battle_state` každých ~1,2 s). Porovnává se s časem serveru z téhož stavu, ne s hodinami
     počítače, takže rozdíl hodin nikoho neodpojí. Po skončení souboje se nikdo neodpojuje (všichni odcházejí). */
  const FAZE_BOJE = ['lobby', 'active', 'paused', 'finished'];
  const BOJ_ODPOJEN_MS = 20000;
  const BOJ_MAX_HRACU = 40;          // strop řádků na tým, ať stav s tisíci „hráči“ nezaplaví plátno

  /* Je hráč souboje připojen? (po skončení souboje všichni; bez platného času se nikdo neodpojuje) */
  function pripojen(p, konec, nejnovejsi) {
    const viden = Date.parse(p.last_seen);
    return konec || !isFinite(viden) || !isFinite(nejnovejsi) || nejnovejsi - viden <= BOJ_ODPOJEN_MS;
  }

  function hraciTymu(st, t, faze, qi, nejnovejsi) {
    const konec = faze === 'finished';
    return (Array.isArray(st.players) ? st.players : [])
      .filter(p => p && p.team != null && Number(p.team) === t)
      .map(p => {
        const on = pripojen(p, konec, nejnovejsi);
        const odpovedel = faze === 'active' && qi >= 0 && Number(p.last_qi) === qi;
        return {
          jmeno: kratke(p.display_name), skore: cislo(p.score, 1e9), spravne: cislo(p.correct_count, 1e4),
          stav: !on ? 'off' : faze === 'active' ? (odpovedel ? 'odp' : 'mysli') : 'ceka',
        };
      })
      .sort((a, b) => b.skore - a.skore || CS.compare(a.jmeno, b.jmeno))
      .slice(0, BOJ_MAX_HRACU);
  }

  function tymy(st) {
    if (!st || !st.battle || !st.battle.team_mode || !st.teams) return null;
    const jmena = t => (Array.isArray(st.players) ? st.players : []).filter(p => p && p.team != null && Number(p.team) === t).map(p => kratke(p.display_name)).sort(CS.compare);
    const faze = FAZE_BOJE.indexOf(st.battle.status) >= 0 ? st.battle.status : 'lobby';
    const qi = Number.isInteger(Number(st.battle.q_index)) ? Number(st.battle.q_index) : -1;
    const nejnovejsi = (Array.isArray(st.players) ? st.players : []).reduce((m, p) => { const v = p ? Date.parse(p.last_seen) : NaN; return isFinite(v) && v > m ? v : m; }, -Infinity);
    return {
      skore: [cislo(st.teams['0'], 1e9), cislo(st.teams['1'], 1e9)],
      modry: jmena(0), cerveny: jmena(1),
      faze,
      modryHraci: hraciTymu(st, 0, faze, qi, nejnovejsi), cervenyHraci: hraciTymu(st, 1, faze, qi, nejnovejsi),
    };
  }

  /* ── místnost živého souboje: kód, otázka, odpočet (z `battle_state`, funguje pro týmový i obyčejný souboj) ──
     BOJ_OTAZKA_S a BOJ_ODPOCET_MS jsou kopie konstant QSEC a COUNTDOWN_MS z `rpg-battle-ui.js` (žákovská hra počítá
     konec otázky stejně); shodu hlídá `tests/rpg-infocentrum.test.cjs`. */
  const BOJ_OTAZKA_S = 25;
  const BOJ_ODPOCET_MS = 3000;
  const RE_KOD = /^[A-Z0-9]{3,8}$/;

  function mistnost(st, ted) {
    const b = st && typeof st === 'object' && st.battle && typeof st.battle === 'object' && !Array.isArray(st.battle) ? st.battle : null;
    if (!b) return null;
    const faze = FAZE_BOJE.indexOf(b.status) >= 0 ? b.status : null;
    if (!faze) return null;
    const kodTxt = typeof b.code === 'string' ? b.code.trim().toUpperCase() : '';
    const qi = typeof b.q_index === 'number' && Number.isInteger(b.q_index) ? b.q_index : -1;
    const celkem = cislo(b.q_count, 100);
    const hraci = (Array.isArray(st.players) ? st.players : []).filter(p => p && typeof p === 'object');
    const nejnovejsi = hraci.reduce((m, p) => { const v = Date.parse(p.last_seen); return isFinite(v) && v > m ? v : m; }, -Infinity);
    const zive = hraci.filter(p => pripojen(p, faze === 'finished', nejnovejsi));
    const odpovedelo = faze === 'active' && qi >= 0 ? zive.filter(p => typeof p.last_qi === 'number' && p.last_qi === qi).length : 0;
    const t0 = Date.parse(b.q_started_at);
    const konec = faze === 'active' && qi >= 0 && isFinite(t0) ? t0 + (qi === 0 ? BOJ_ODPOCET_MS : 0) + BOJ_OTAZKA_S * 1000 : null;
    const otazka = qi < 0 ? 0 : celkem ? Math.min(qi + 1, celkem) : qi + 1;
    return {
      kod: RE_KOD.test(kodTxt) ? kodTxt : '', faze, tymovy: !!b.team_mode,
      otazka, celkem, hracu: Math.min(hraci.length, 999), zivych: Math.min(zive.length, 999), odpovedelo: Math.min(odpovedelo, 999),
      konec, zbyva: zbyvaSekund(konec, ted),
    };
  }
  /* Sekundy do `konec` (ms), nejvíc délka otázky; bez konce nebo bez hodin null. */
  function zbyvaSekund(konec, ted) {
    if (typeof konec !== 'number' || !isFinite(konec) || typeof ted !== 'number' || !isFinite(ted)) return null;
    return Math.max(0, Math.min(BOJ_OTAZKA_S, Math.ceil((konec - ted) / 1000)));
  }
  /* Věta o stavu souboje a podíl hotových otázek pro ukazatel. */
  function mistnostText(m) {
    if (!m) return { veta: '', podil: 0 };
    const kolik = m.celkem ? m.otazka + ' z ' + m.celkem : String(m.otazka);
    if (m.faze === 'lobby') return { veta: 'Čeká se na hráče', podil: 0 };
    if (m.faze === 'finished') return { veta: 'Souboj skončil', podil: 1 };
    if (m.faze === 'active' && m.otazka < 1) return { veta: 'Souboj začíná', podil: 0 };
    const podil = m.celkem ? Math.min(1, Math.max(0, m.otazka / m.celkem)) : 0;
    return { veta: (m.faze === 'paused' ? 'Pozastaveno · otázka ' : 'Otázka ') + kolik, podil };
  }

  /* ── kdo je kde: počty hrajících podle obrazovky (`cur` z uložení; nehrající se do míst nezapočítávají) ── */
  const KDE_PORADI = ['boj', 'trenink', 'teorie', 'mapa', 'vez', 'souboj'];
  const KDE_NAZVY = { boj: 'v boji', trenink: 'v tréninku', teorie: 'čte teorii', mapa: 'na mapě', vez: 've Věži legend', souboj: 'v živém souboji' };
  function kdeSouhrn(hraci, maxJmen) {
    const max = Math.max(0, Math.min(20, Math.floor(Number(maxJmen)) || 6));
    const skupiny = KDE_PORADI.map(typ => ({ typ, nazev: KDE_NAZVY[typ], pocet: 0, jmena: [], dalsi: 0 }));
    let hraje = 0, nehraje = 0, bezUdaje = 0;
    for (const h of Array.isArray(hraci) ? hraci : []) {
      if (!h || !h.on) { nehraje++; continue; }
      hraje++;
      const k = kde(h.kde), sk = k ? skupiny.find(s => s.typ === k.s) : null;
      if (!sk) { bezUdaje++; continue; }
      sk.pocet++; sk.jmena.push(String(h.jmeno == null ? '' : h.jmeno));
    }
    skupiny.forEach(s => { s.jmena.sort(CS.compare); s.dalsi = Math.max(0, s.jmena.length - max); s.jmena = s.jmena.slice(0, max); });
    return { skupiny, hraje, nehraje, bezUdaje };
  }

  /* ── mapa misí: kolik žáků má kterou misi splněnou a kolik jich ji splnilo v téhle hodině ── */
  const RE_KLIC_ZAKLADU = /^[A-Za-z0-9_-]{1,64}\|RPG_MAT_[3-9]$/;
  const MAX_ZAKLADU = 400;
  function zakladMise(stavy) {
    const z = {};
    for (const s of stavy) z[klic(s)] = s.mise.slice();
    return z;
  }
  function doplnZakladMise(z, stavy) {
    for (const s of stavy) if (!Object.prototype.hasOwnProperty.call(z, klic(s))) z[klic(s)] = s.mise.slice();
    return z;
  }
  /* Uložený základ čteme nedůvěřivě (localStorage může obsahovat cokoli): jen platné klíče a mise, nejvýš MAX_ZAKLADU žáků. */
  function ocistiZakladMise(raw) {
    const ven = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return ven;
    let n = 0;
    for (const k in raw) {
      if (++n > MAX_ZAKLADU * 4) break;
      if (!Object.prototype.hasOwnProperty.call(raw, k) || !RE_KLIC_ZAKLADU.test(k) || !Array.isArray(raw[k])) continue;
      if (Object.keys(ven).length >= MAX_ZAKLADU) break;
      ven[k] = raw[k].filter(m => typeof m === 'string' && RE_MISE.test(m)).slice(0, 21);
    }
    return ven;
  }
  function mapaMisi(stavy, zm) {
    const lide = Array.isArray(stavy) ? stavy : [];
    const bunky = [];
    for (let a = 1; a <= 7; a++) for (let i = 1; i <= MISI_V_OBLASTI; i++) {
      const mid = a + '-' + i, nove = [];
      let hotovo = 0;
      for (const s of lide) {
        if (s.mise.indexOf(mid) < 0) continue;
        hotovo++;
        const b = zm && Object.prototype.hasOwnProperty.call(zm, klic(s)) ? zm[klic(s)] : null;
        if (b && b.indexOf(mid) < 0) nove.push(s.jmeno);
      }
      bunky.push({ mid, oblast: a, poradi: i, hotovo, vHodine: nove.length, jmena: nove.sort(CS.compare) });
    }
    return { hracu: lide.length, bunky };
  }

  /* ── stopky a odpočet (jen v prohlížeči): stav {rezim: nahoru|dolu, bezi, od (kdy spuštěno, ms), nahrano (ms před spuštěním), cil (ms)} ── */
  const STOPKY_MAX_MS = 100 * 3600000 - 1000;       // 99:59:59
  const STOPKY_MAX_CIL_MIN = 180;
  const STOPKY_VYCHOZI_MIN = 10;
  function stopkyNove() { return { rezim: 'nahoru', bezi: false, od: 0, nahrano: 0, cil: STOPKY_VYCHOZI_MIN * 60000 }; }
  const cilMs = min => Math.max(1, Math.min(STOPKY_MAX_CIL_MIN, Math.floor(Number(min)) || 0)) * 60000;
  function stopkyOcisti(raw, ted) {
    const o = raw && typeof raw === 'object' && !Array.isArray(raw) && raw.v === 1 ? raw : null;
    const s = stopkyNove();
    if (!o) return s;
    const kon = (v, max) => typeof v === 'number' && isFinite(v) && v >= 0 && v <= max ? Math.floor(v) : null;
    const nahrano = kon(o.nahrano, STOPKY_MAX_MS), od = kon(o.od, 9e15), cil = kon(o.cil, STOPKY_MAX_CIL_MIN * 60000);
    if (nahrano === null || cil === null || cil < 60000) return s;
    s.rezim = o.rezim === 'dolu' ? 'dolu' : 'nahoru'; s.nahrano = nahrano; s.cil = cil;
    if (o.bezi === true) {
      if (od === null || od > ted + 60000) return s;      // běžící stopky z budoucnosti (přestavené hodiny) nevěříme
      s.bezi = true; s.od = od;
    }
    return s;
  }
  function stopkyUplynulo(s, ted) {
    const beh = s.bezi && isFinite(ted) ? Math.max(0, ted - s.od) : 0;
    return Math.min(STOPKY_MAX_MS, s.nahrano + beh);
  }
  function stopkyCas(ms, dolu) {
    const t = Math.max(0, Math.floor(Number(ms) || 0));
    const sek = dolu ? Math.ceil(t / 1000) : Math.floor(t / 1000);
    const h = Math.floor(sek / 3600), m = Math.floor((sek % 3600) / 60), x = sek % 60;
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0') : m + ':' + String(x).padStart(2, '0');
  }
  /* Co ukázat: čas, štítek a stav (stoji | bezi | konec). */
  function stopkyZobraz(s, ted) {
    const up = stopkyUplynulo(s, ted);
    if (s.rezim === 'dolu') {
      const zbyva = Math.max(0, s.cil - up);
      return { text: stopkyCas(zbyva, true), stitek: zbyva === 0 ? 'čas vypršel' : 'zbývá', stav: zbyva === 0 ? 'konec' : s.bezi ? 'bezi' : 'stoji', ms: zbyva };
    }
    return { text: stopkyCas(up, false), stitek: 'uplynulo', stav: s.bezi ? 'bezi' : 'stoji', ms: up };
  }
  /* Akce nad stavem (čistá): start, pauza, nula, rezim (arg nahoru|dolu), odpocet (arg minuty: nastaví a spustí), pridej (arg minuty navíc). */
  function stopkyAkce(s, akce, ted, arg) {
    const n = { rezim: s.rezim, bezi: s.bezi, od: s.od, nahrano: s.nahrano, cil: s.cil };
    const zastav = () => { if (n.bezi) { n.nahrano = stopkyUplynulo(n, ted); n.bezi = false; n.od = 0; } };
    if (akce === 'start') { if (!n.bezi && stopkyZobraz(n, ted).stav !== 'konec') { n.bezi = true; n.od = ted; } }
    else if (akce === 'pauza') zastav();
    else if (akce === 'nula') { n.bezi = false; n.od = 0; n.nahrano = 0; }
    else if (akce === 'rezim') { if (arg === 'nahoru' || arg === 'dolu') { n.rezim = arg; n.bezi = false; n.od = 0; n.nahrano = 0; } }
    else if (akce === 'odpocet') { n.rezim = 'dolu'; n.cil = cilMs(arg); n.nahrano = 0; n.bezi = true; n.od = ted; }
    else if (akce === 'pridej') {
      if (n.rezim === 'dolu') n.cil = Math.min(STOPKY_MAX_CIL_MIN * 60000, n.cil + cilMs(arg));
    }
    return n;
  }
  function stopkyUloz(s) { return JSON.stringify({ v: 1, rezim: s.rezim, bezi: s.bezi, od: s.od, nahrano: s.nahrano, cil: s.cil }); }
  function stopkyNacti(text, ted) { let o = null; try { o = JSON.parse(text); } catch (e) { o = null; } return stopkyOcisti(o, ted); }

  return {
    UKOLU_V_MISI, MISI_V_OBLASTI, ONLINE_MIN, UKOLU_NA_HRACE, MIN_KROK, MAX_KLICU, ODZNAKY,
    kratke, jmeno, stav, kde, kdeText, klic, online, zaklad, doplnZaklad, prirustek, seradit, souhrn,
    udalosti, pamet, pocet, ukolu, misi, text, krokPro, novyCil, posun, tymy,
    BOJ_OTAZKA_S, BOJ_ODPOCET_MS, mistnost, zbyvaSekund, mistnostText,
    KDE_PORADI, KDE_NAZVY, kdeSouhrn,
    zakladMise, doplnZakladMise, ocistiZakladMise, mapaMisi,
    STOPKY_MAX_MS, STOPKY_MAX_CIL_MIN, stopkyNove, stopkyOcisti, stopkyUplynulo, stopkyCas, stopkyZobraz, stopkyAkce, stopkyUloz, stopkyNacti,
  };
});
