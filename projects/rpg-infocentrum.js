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
  const CS = new Intl.Collator('cs');

  /* Neutrální názvy odznaků (ve hrách má každý ročník svůj tematický název). Test hlídá, že každé
     id z `const ACH=[…]` všech sedmi her tu je — nový odznak bez zápisu tady shodí bránu. */
  const ODZNAKY = {
    boot: 'První úkol', crit: 'Kritické zásahy', combo5: 'Combo 5', flawless: 'Mise bez nápovědy',
    flash: 'Bleskový', survivor: 'Z posledních sil', area1: 'První oblast', half: 'Půlka oblastí',
    root: 'Všechny oblasti', lv5: 'Úroveň 5', lv10: 'Úroveň 10', master1: 'Mistr tématu',
    train50: 'Trenér', streak3: 'Tři dny v řadě', streak7: 'Týden v řadě',
    battle1: 'První klání', battlewin: 'Vítěz souboje', battleflawless: 'Bezchybný souboj', star1: 'Oživovatel',
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
      ukoly, mise, oblasti, ach, updated: (r && r.updated_at) || null,
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
  function tymy(st) {
    if (!st || !st.battle || !st.battle.team_mode || !st.teams) return null;
    const jmena = t => (Array.isArray(st.players) ? st.players : []).filter(p => p && p.team != null && Number(p.team) === t).map(p => kratke(p.display_name)).sort(CS.compare);
    return {
      skore: [cislo(st.teams['0'], 1e9), cislo(st.teams['1'], 1e9)],
      modry: jmena(0), cerveny: jmena(1),
    };
  }

  return {
    UKOLU_V_MISI, MISI_V_OBLASTI, ONLINE_MIN, UKOLU_NA_HRACE, MIN_KROK, MAX_KLICU, ODZNAKY,
    kratke, jmeno, stav, klic, online, zaklad, doplnZaklad, prirustek, seradit, souhrn,
    udalosti, pamet, pocet, ukolu, misi, text, krokPro, novyCil, posun, tymy,
  };
});
