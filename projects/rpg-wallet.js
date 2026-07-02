/* ════════════════════════════════════════════════════════════════════
   RPG Matematika — SDÍLENÁ PENĚŽENKA (Globální profil, varianta 2)

   Jediný zdroj pravdy pro kredity, kosmetiku a globální VFX přepínač,
   sdílený mezi všemi hrami (6/7/8/9) a HUBem přes localStorage
   `RPG_HUB_WALLET` (stejný origin ⇒ funguje napříč hrami i záložkami).

   Per-game saves (RPG_MAT_X) si dál drží POSTUP, atributy, achievementy,
   mastery a chyby. Peněženka řeší jen to, co má být GLOBÁLNÍ:
     • credits        — univerzální měna (vyděláš v kterékoli hře)
     • cosmetics       — koupíš jednou, nosíš ve všech hrách
     • settings.reducedMotion — vypneš VFX jednou pro všechny hry

   Anti-cheat: každé čtení projde _sanitize() (kredity nezáporné celé,
   active musí být vlastněné/zdarma, neznámá ID se zahodí).

   Graceful: když modul není načtený, hra spadne zpět na per-game chování
   (volající kontroluje `typeof RPGWallet !== 'undefined'`).
   ════════════════════════════════════════════════════════════════════ */
window.RPGWallet = (function () {
  'use strict';
  const KEY = 'RPG_HUB_WALLET';
  const DEFAULT_THEME = 'theme-default';
  const DEFAULT_VICTORY = 'victory-default';

  // ── Katalog (jediný zdroj pravdy; hry i HUB ho čtou přes items()) ──
  const SHOP_ITEMS = [
    { id: 'border-silver', cat: 'border', name: 'Stříbrný rám', ic: '🔲', price: 40,  cssKey: 'av-silver' },
    { id: 'border-cyan',   cat: 'border', name: 'Kyber modrý',  ic: '💠', price: 80,  cssKey: 'av-cyan' },
    { id: 'border-gold',   cat: 'border', name: 'Zlatý rám',    ic: '🏆', price: 130, cssKey: 'av-gold' },
    { id: 'border-holo',   cat: 'border', name: 'Hologram',     ic: '✨', price: 220, cssKey: 'av-holo' },
    { id: 'badge-cyan',    cat: 'badge',  name: 'Cyan jméno',   ic: '🔵', price: 60,  cssKey: 'nm-cyan' },
    { id: 'badge-gold',    cat: 'badge',  name: 'Zlaté jméno',  ic: '🌟', price: 90,  cssKey: 'nm-gold' },
    { id: 'badge-green',   cat: 'badge',  name: 'Neon zelená',  ic: '🟢', price: 80,  cssKey: 'nm-green' },
    { id: 'badge-purple',  cat: 'badge',  name: 'Fialová',      ic: '🟣', price: 120, cssKey: 'nm-purple' },
    { id: 'theme-default', cat: 'theme',  name: 'Výchozí téma', ic: '🖤', price: 0,   cssKey: '' },
    { id: 'theme-matrix',  cat: 'theme',  name: 'Matrix',       ic: '🟩', price: 150, cssKey: 'matrix' },
    { id: 'theme-blood',   cat: 'theme',  name: 'Red Circuit',  ic: '🔴', price: 200, cssKey: 'blood' },
    { id: 'theme-violet',  cat: 'theme',  name: 'Violet Hack',  ic: '🟣', price: 180, cssKey: 'violet' },
    { id: 'victory-default', cat: 'victory', name: 'Výchozí',      ic: '⚡', price: 0,   cssKey: '' },
    { id: 'victory-cyber',   cat: 'victory', name: 'Cyber výbuch', ic: '🔥', price: 100, cssKey: 'vc-cyber' },
    { id: 'victory-neon',    cat: 'victory', name: 'Neon záření',  ic: '💚', price: 140, cssKey: 'vc-neon' },
    // ── skiny hrdiny (palette swap) ──
    { id: 'skin-gold',    cat: 'skin', name: 'Zlatý rytíř',    ic: '🥇', price: 18000, skinKey: 'skin-gold' },
    { id: 'skin-red',     cat: 'skin', name: 'Rudý bojovník',   ic: '🔴', price:  3000, skinKey: 'skin-red' },
    { id: 'skin-emerald', cat: 'skin', name: 'Smaragdový lovec',ic: '💚', price:  3500, skinKey: 'skin-emerald' },
    { id: 'skin-ghost',   cat: 'skin', name: 'Duch neoneonu',   ic: '👻', price: 10000, skinKey: 'skin-ghost' },
    { id: 'skin-stealth', cat: 'skin', name: 'Stínový agent',   ic: '🥷', price:  6000, skinKey: 'skin-stealth' },
    // ── powerupy (gameplay, one-time purchase) ──
    { id: 'pu-ghost-heart',   cat: 'powerup', name: 'Železná vůle',    ic: '🫀', price: 550, minLevel: 5, desc: '+1 prázdné srdce na start každého boje.' },
    { id: 'pu-time-bonus',    cat: 'powerup', name: 'Přesýpací hodiny',ic: '⏳', price: 500, minLevel: 4, desc: '+5 sekund na každý příklad.' },
    { id: 'pu-freeze-dbl',    cat: 'powerup', name: 'Permafrost',      ic: '🧊', price: 700, minLevel: 6, desc: 'Zmrznutí trvá 30 s místo 15 s.' },
    { id: 'pu-full-heart',    cat: 'powerup', name: 'Druhá krev',      ic: '💗', price: 1000, minLevel: 8, desc: '+1 plné srdce na start každého boje.' },
    { id: 'pu-xp-crit',       cat: 'powerup', name: 'Adrenalin',       ic: '⚡', price: 750, minLevel: 7, desc: '+1 XP navíc za každý kritický zásah.' },
    { id: 'pu-second-chance',  cat: 'powerup', name: 'Druhá šance',    ic: '🛡️', price: 1300, minLevel: 10, desc: '1× za boj: místo porážky přežiješ s 1 ❤️.' },
    /* ── Dávka 1 — prémiová kosmetika (ceny kalibrované na hru 3.–9. třída,
          ~2–4k kr/ročník ⇒ životní výdělek ~15–30k; tohle jsou cíle na měsíce) ── */
    { id: 'border-wreath', cat: 'border', name: 'Květinový věnec', ic: '🌸', price:  600, cssKey: 'av-wreath' },
    { id: 'border-anchor', cat: 'border', name: 'Pirátský provaz', ic: '⚓', price:  800, cssKey: 'av-anchor' },
    { id: 'border-dragon', cat: 'border', name: 'Dračí šupiny',    ic: '🐉', price: 2400, cssKey: 'av-dragon' },
    { id: 'badge-ice',     cat: 'badge',  name: 'Ledové jméno',    ic: '💠', price: 1200, cssKey: 'nm-ice' },
    { id: 'badge-shine',   cat: 'badge',  name: 'Zlatě zářící',    ic: '✨', price: 1500, cssKey: 'nm-shine' },
    { id: 'badge-rainbow', cat: 'badge',  name: 'Duhový přeliv',   ic: '🌈', price: 2200, cssKey: 'nm-rainbow' },
    { id: 'theme-space',   cat: 'theme',  name: 'Hlubina vesmíru', ic: '🌌', price: 1800, cssKey: 'space' },
    { id: 'theme-temple',  cat: 'theme',  name: 'Chrámové zlato',  ic: '🏛️', price: 2200, cssKey: 'temple' },
    { id: 'victory-coins',     cat: 'victory', name: 'Zlatý déšť mincí', ic: '🪙', price: 1200, cssKey: 'vc-coins' },
    { id: 'victory-fireworks', cat: 'victory', name: 'Ohňostroj',        ic: '🎆', price: 1800, cssKey: 'vc-fireworks' },
    /* ── Dávka 2 — QoL powerupy (drahé; vypnuté ve Věži legend a živém souboji) ── */
    { id: 'pu-novice-shield', cat: 'powerup', name: 'Štít nováčka',   ic: '⛨',  price: 3000, minLevel: 3, desc: 'První špatná odpověď v každém boji tě nezraní.' },
    { id: 'pu-study-guide',   cat: 'powerup', name: 'Studijní rádce', ic: '🔁', price: 2500, minLevel: 5, desc: 'V tréninku ti jedna chyba za sezení nezlomí sérii.' },
    { id: 'pu-calm-mind',     cat: 'powerup', name: 'Klidná mysl',    ic: '🧘', price: 4500, minLevel: 8, desc: '+20 % času na každý příklad v normálním boji.' },
    /* ── Dávka 3 — tituly (text pod jménem) ── */
    { id: 'title-pocitar', cat: 'title', name: 'Počtář',         ic: '🧮', price:  1000 },
    { id: 'title-lovec',   cat: 'title', name: 'Lovec příkladů', ic: '🎯', price:  2500 },
    { id: 'title-strateg', cat: 'title', name: 'Stratég',        ic: '♟️', price:  5000 },
    { id: 'title-mudrc',   cat: 'title', name: 'Mudrc',          ic: '🦉', price:  9000 },
    { id: 'title-genius',  cat: 'title', name: 'Génius',         ic: '🧠', price: 15000 },
    /* ── Dávka 3 — mazlíčci (parťák v profilu) ── */
    { id: 'pet-sova',       cat: 'pet', name: 'Sova',      ic: '🦉', price:  5000 },
    { id: 'pet-kocka',      cat: 'pet', name: 'Kočka',     ic: '🐈‍⬛', price:  8000 },
    { id: 'pet-robot',      cat: 'pet', name: 'Robot',     ic: '🤖', price: 10000 },
    { id: 'pet-drak',       cat: 'pet', name: 'Dráček',    ic: '🐉', price: 12000 },
    { id: 'pet-jednorozec', cat: 'pet', name: 'Jednorožec',ic: '🦄', price: 25000 },
    /* ── Dávka 3 — sezónní (v obchodě jen v daném období; koupené zůstává navždy) ── */
    { id: 'border-dyne',  cat: 'border', name: 'Dýňový rám',     ic: '🎃', price: 2500, cssKey: 'av-pumpkin', season: { fm: 10, fd: 15, tm: 11, td: 5 } },
    { id: 'theme-vanoce', cat: 'theme',  name: 'Vánoční',        ic: '🎄', price: 3000, cssKey: 'vanoce',     season: { fm: 12, fd: 1,  tm: 1,  td: 6 } },
    { id: 'border-srdce', cat: 'border', name: 'Srdcový rám',    ic: '💘', price: 2000, cssKey: 'av-heart',   season: { fm: 2,  fd: 1,  tm: 2,  td: 20 } },
    { id: 'theme-leto',   cat: 'theme',  name: 'Letní vlny',     ic: '🏖️', price: 3000, cssKey: 'leto',       season: { fm: 6,  fd: 1,  tm: 8,  td: 31 } },
    /* ── Exkluzivní odměny za životní úspěchy (nekoupitelné; grant přes GACH) ── */
    { id: 'border-diamond',    cat: 'border', name: 'Diamantová aura',    ic: '💎', price: 999999, ach: true, cssKey: 'av-diamond' },
    { id: 'title-pan-casu',    cat: 'title',  name: 'Pán času',           ic: '🕰️', price: 999999, ach: true },
    { id: 'title-velmistr',    cat: 'title',  name: 'Absolutní velmistr', ic: '👑', price: 999999, ach: true },
    { id: 'title-legenda-veze',cat: 'title',  name: 'Legenda věže',       ic: '🗼', price: 999999, ach: true },
    { id: 'title-magnat',      cat: 'title',  name: 'Magnát',             ic: '🤑', price: 999999, ach: true },
    { id: 'pet-fenix',         cat: 'pet',    name: 'Fénix',              ic: '🔥', price: 999999, ach: true },
    { id: 'pet-zlaty-drak',    cat: 'pet',    name: 'Zlatý drak',         ic: '🐲', price: 999999, ach: true },
  ];

  /* ── Globální ŽIVOTNÍ ÚSPĚCHY (GACH) — počítají se napříč všemi hrami 3.–9.
        a celou školní docházkou. Odměny: kredity, exkluzivní kosmetika, PERKY.
        Perk 'notimer': čas se v normálních bojích už neodpočítává (Věž legend
        a živý souboj mají vlastní časomíru — těch se perk netýká). ── */
  const GACH = [
    { id: 'gach-tasks-1k',    ic: '📚', nm: 'Znalec',             stat: 'tasks',     goal: 1000,  reward: { credits: 1000 },
      desc: 'Vyřeš 1 000 příkladů (počítá se napříč všemi ročníky).' },
    { id: 'gach-tasks-10k',   ic: '🕰️', nm: 'Pán času',           stat: 'tasks',     goal: 10000, reward: { credits: 5000, grant: ['title-pan-casu'], perk: 'notimer' },
      desc: 'Vyřeš 10 000 příkladů. Odměna: čas se ti v bojích už NIKDY neodpočítává (kromě Věže legend).' },
    { id: 'gach-crit-1k',     ic: '⚡', nm: 'Bouřlivák',           stat: 'crits',     goal: 1000,  reward: { credits: 2000, perk: 'critcredit' },
      desc: 'Dej 1 000 kritických zásahů. Odměna: každý krit navíc +2 kredity.' },
    { id: 'gach-flawless-100',ic: '💎', nm: 'Neposkvrněný',        stat: 'flawless',  goal: 100,   reward: { grant: ['border-diamond'] },
      desc: 'Vyhraj 100 misí bez jediného zranění. Odměna: exkluzivní Diamantová aura.' },
    { id: 'gach-master-21',   ic: '🏆', nm: 'Velmistr',            stat: 'mastered',  goal: 21,    reward: { credits: 3000 },
      desc: 'Získej 21 mistrovství témat (celý jeden ročník).' },
    { id: 'gach-master-147',  ic: '👑', nm: 'Absolutní velmistr',  stat: 'mastered',  goal: 147,   reward: { credits: 10000, grant: ['title-velmistr', 'pet-zlaty-drak'] },
      desc: 'Získej všech 147 mistrovství (7 ročníků × 21 témat).' },
    { id: 'gach-tower-50',    ic: '🗼', nm: 'Legenda věže',        stat: 'towerFloor',goal: 50,    reward: { credits: 5000, grant: ['title-legenda-veze'] },
      desc: 'Vylez na 50. patro Věže legend.' },
    { id: 'gach-streak-100',  ic: '🔥', nm: 'Věčný plamen',        stat: 'streakMax', goal: 100,   reward: { credits: 5000, grant: ['pet-fenix'] },
      desc: 'Hraj 100 dní v řadě. Odměna: exkluzivní Fénix.' },
    { id: 'gach-earned-50k',  ic: '🤑', nm: 'Magnát',              stat: 'earned',    goal: 50000, reward: { grant: ['title-magnat'] },
      desc: 'Vydělej celkem 50 000 kreditů.' },
  ];
  const LIFE_KEYS = ['tasks', 'crits', 'flawless', 'mastered', 'streakMax', 'towerFloor', 'earned', 'spent'];
  const ACTIVE_CATS = ['border', 'badge', 'theme', 'victory', 'skin', 'title', 'pet'];

  /* Sezónní dostupnost (okno smí přetéct přes Silvestr, např. 1.12.–6.1.).
     Testy můžou čas podvrhnout přes window.__RW_TESTNOW. */
  function seasonOpen(it) {
    if (!it || !it.season) return true;
    const s = it.season;
    const d = (typeof window !== 'undefined' && window.__RW_TESTNOW) ? new Date(window.__RW_TESTNOW) : new Date();
    const cur = (d.getMonth() + 1) * 100 + d.getDate();
    const from = s.fm * 100 + s.fd, to = s.tm * 100 + s.td;
    return from <= to ? (cur >= from && cur <= to) : (cur >= from || cur <= to);
  }

  const VALID = new Set(SHOP_ITEMS.map(i => i.id));
  const FREE  = SHOP_ITEMS.filter(i => i.price === 0).map(i => i.id);
  const byId  = id => SHOP_ITEMS.find(i => i.id === id);

  const CLOUD_GAME = '_wallet';   // řádek v tabulce `saves` (game='_wallet') ⇒ sync přes Google účet, bez nového SQL
  let _suppressCloud = false;     // při slučování z cloudu neposílej hned zpět (zabrání smyčce)

  const listeners = [];
  function emit() { const w = get(); listeners.forEach(f => { try { f(w); } catch (e) {} }); }

  function _blank() {
    return {
      credits: 0,
      cosmetics: {
        owned: FREE.slice(),
        active: { border: null, badge: null, theme: DEFAULT_THEME, victory: DEFAULT_VICTORY, skin: null, title: null, pet: null }
      },
      settings: { reducedMotion: false },
      life: {},        // životní countery (tasks/crits/…) — doplní _sanitize
      gach: {},        // odemčené životní úspěchy { id: 'YYYY-MM-DD' }
      migrated: [],
      absorbed: {},
      v: 1
    };
  }

  function _sanitize(w) {
    if (!w || typeof w !== 'object' || Array.isArray(w)) w = _blank();
    // kredity: nezáporné celé číslo
    if (typeof w.credits !== 'number' || !isFinite(w.credits) || w.credits < 0) w.credits = 0;
    w.credits = Math.floor(w.credits);
    // kosmetika
    if (!w.cosmetics || typeof w.cosmetics !== 'object' || Array.isArray(w.cosmetics)) w.cosmetics = {};
    let owned = Array.isArray(w.cosmetics.owned) ? w.cosmetics.owned.filter(id => VALID.has(id)) : [];
    owned = [...new Set([...FREE, ...owned])];
    w.cosmetics.owned = owned;
    if (!w.cosmetics.active || typeof w.cosmetics.active !== 'object' || Array.isArray(w.cosmetics.active)) w.cosmetics.active = {};
    const A = w.cosmetics.active;
    ACTIVE_CATS.forEach(cat => {
      const id = A[cat], it = byId(id);
      const fallback = cat === 'theme' ? DEFAULT_THEME : cat === 'victory' ? DEFAULT_VICTORY : null;
      if (!id) { A[cat] = fallback; return; }
      if (!it || it.cat !== cat) { A[cat] = fallback; return; }
      if (it.price > 0 && !owned.includes(id)) A[cat] = fallback;  // aktivní jen co vlastním
    });
    // životní countery + úspěchy
    if (!w.life || typeof w.life !== 'object' || Array.isArray(w.life)) w.life = {};
    LIFE_KEYS.forEach(k => { const v = w.life[k]; w.life[k] = (typeof v === 'number' && isFinite(v) && v > 0) ? Math.floor(v) : 0; });
    if (!w.gach || typeof w.gach !== 'object' || Array.isArray(w.gach)) w.gach = {};
    const G = {}; GACH.forEach(g => { if (typeof w.gach[g.id] === 'string') G[g.id] = w.gach[g.id]; }); w.gach = G;
    // nastavení
    if (!w.settings || typeof w.settings !== 'object') w.settings = {};
    w.settings.reducedMotion = !!w.settings.reducedMotion;
    if (!Array.isArray(w.migrated)) w.migrated = [];
    if (!w.absorbed || typeof w.absorbed !== 'object' || Array.isArray(w.absorbed)) w.absorbed = {};
    w.v = 1;
    return w;
  }

  function get() {
    let w = null;
    try { w = JSON.parse(localStorage.getItem(KEY)); } catch (e) { w = null; }
    return _sanitize(w);
  }
  function put(w) {
    w = _sanitize(w);
    try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) {}
    // cloud: po každé změně pošli peněženku na Google účet (debounced v RPGCloud.push;
    // bez přihlášení/náhledu se push sám přeskočí ⇒ čistě lokální chování zůstává)
    if (!_suppressCloud) { try { if (typeof window !== 'undefined' && window.RPGCloud && RPGCloud.push) RPGCloud.push(CLOUD_GAME, w); } catch (e) {} }
    emit();
    return w;
  }

  // ── Kredity ──
  function getCredits() { return get().credits; }
  function earn(n) {
    n = Number(n);
    if (!isFinite(n) || n <= 0) return getCredits();
    const w = get();
    w.credits = Math.floor(w.credits) + Math.floor(n);
    w.life.earned += Math.floor(n);
    _evalGach(w);              // Magnát apod. — toast doručí nejbližší bumpLife
    put(w);
    return w.credits;
  }

  /* ── Životní úspěchy ──
     _evalGach zkontroluje prahy, nově odemčené uloží (datum), aplikuje odměny
     (kredity + grant exkluzivní kosmetiky) a přidá je do fronty toastů.
     bumpLife/setLifeMax frontu vrací volajícímu (hra je ukáže přes achToast). */
  let _gachQueue = [];
  function _evalGach(w) {
    GACH.forEach(g => {
      if (w.gach[g.id]) return;
      if ((w.life[g.stat] || 0) < g.goal) return;
      w.gach[g.id] = new Date().toISOString().slice(0, 10);
      const r = g.reward || {};
      if (r.credits) { w.credits = Math.floor(w.credits) + r.credits; w.life.earned += r.credits; }
      (r.grant || []).forEach(id => { if (VALID.has(id)) w.cosmetics.owned = [...new Set([...w.cosmetics.owned, id])]; });
      _gachQueue.push({ ic: g.ic, nm: g.nm, desc: g.desc, id: g.id });
    });
  }
  function bumpLife(key, n) {
    if (!LIFE_KEYS.includes(key)) return [];
    n = Math.floor(Number(n)); if (!isFinite(n) || n <= 0) n = 1;
    const w = get();
    w.life[key] += n;
    _evalGach(w);
    put(w);
    const out = _gachQueue; _gachQueue = [];
    return out;
  }
  function setLifeMax(key, v) {
    if (!LIFE_KEYS.includes(key)) return [];
    v = Math.floor(Number(v)); if (!isFinite(v) || v <= 0) return [];
    const w = get();
    if (v <= w.life[key]) return [];
    w.life[key] = v;
    _evalGach(w);
    put(w);
    const out = _gachQueue; _gachQueue = [];
    return out;
  }
  function hasPerk(p) {
    const g = GACH.find(x => x.reward && x.reward.perk === p);
    return !!(g && get().gach[g.id]);
  }
  function lifeStats() { return { ...get().life }; }
  function gachList() { const w = get(); return GACH.map(g => ({ ...g, reward: { ...g.reward }, unlocked: w.gach[g.id] || null, have: Math.min(w.life[g.stat] || 0, g.goal) })); }

  // ── Obchod ──
  function buy(id) {
    const it = byId(id);
    if (!it) return { ok: false, reason: 'unknown' };
    const w = get();
    if (it.ach && !w.cosmetics.owned.includes(id)) return { ok: false, reason: 'ach-locked' };  // jen odměna za úspěch
    if (it.season && !seasonOpen(it) && !w.cosmetics.owned.includes(id)) return { ok: false, reason: 'season' };
    if (it.cat === 'powerup') {
      if (w.cosmetics.owned.includes(id)) return { ok: true, reason: 'already-owned' };
      if (w.credits < it.price) return { ok: false, reason: 'insufficient', need: it.price, have: w.credits };
      w.credits = Math.floor(w.credits) - it.price;
      w.life.spent += it.price;
      w.cosmetics.owned = [...new Set([...w.cosmetics.owned, id])];
      put(w);
      return { ok: true, reason: 'bought' };
    }
    if (it.price === 0 || w.cosmetics.owned.includes(id)) {  // zdarma / už vlastním → jen aktivuj
      w.cosmetics.active[it.cat] = id;
      put(w);
      return { ok: true, reason: 'activated' };
    }
    if (w.credits < it.price) return { ok: false, reason: 'insufficient', need: it.price, have: w.credits };
    w.credits = Math.floor(w.credits) - it.price;
    w.life.spent += it.price;
    w.cosmetics.owned = [...new Set([...w.cosmetics.owned, id])];
    w.cosmetics.active[it.cat] = id;
    put(w);
    return { ok: true, reason: 'bought' };
  }
  function hasPowerup(id) { return get().cosmetics.owned.includes(id); }
  function activate(id) {
    const it = byId(id);
    if (!it) return { ok: false, reason: 'unknown' };
    const w = get();
    if (it.price > 0 && !w.cosmetics.owned.includes(id)) return { ok: false, reason: 'not-owned' };
    w.cosmetics.active[it.cat] = id;
    put(w);
    return { ok: true };
  }
  function owns(id) { return get().cosmetics.owned.includes(id); }
  function activeId(cat) { return get().cosmetics.active[cat]; }
  function isActive(id) { const it = byId(id); return it ? get().cosmetics.active[it.cat] === id : false; }
  function cssFor(cat) { const it = byId(activeId(cat)); return it ? it.cssKey : ''; }

  // ── Globální nastavení (VFX) ──
  function getReducedMotion() { return get().settings.reducedMotion; }
  function setReducedMotion(b) { const w = get(); w.settings.reducedMotion = !!b; put(w); return w.settings.reducedMotion; }

  // ── Katalog ──
  /* items() vrací, co má obchod UKÁZAT: exkluzivní (ach) položky až po
     odemčení, sezónní jen v okně (koupené vždy) — „limitovaná nabídka". */
  function items() {
    const owned = get().cosmetics.owned;
    return SHOP_ITEMS
      .filter(i => (!i.ach || owned.includes(i.id)) && (!i.season || seasonOpen(i) || owned.includes(i.id)))
      .map(i => ({ ...i }));
  }
  function itemsAll() { return SHOP_ITEMS.map(i => ({ ...i })); }
  function itemById(id) { const it = byId(id); return it ? { ...it } : null; }

  /* Migrace per-game kreditů/kosmetiky do sdílené peněženky (jednou na hru).
     Volá se z loadS každé hry: absorbuje staré S.credits + S.cosmetics.owned,
     aby se při přechodu na sdílený model nic neztratilo. */
  function migrateFrom(gameKey, legacyS) {
    if (!gameKey || !legacyS || typeof legacyS !== 'object') return false;
    const w = get();
    if (w.migrated.includes(gameKey)) return false;  // už absorbováno
    let changed = false;
    if (typeof legacyS.credits === 'number' && isFinite(legacyS.credits) && legacyS.credits > 0) {
      w.credits = Math.floor(w.credits) + Math.floor(legacyS.credits);
      changed = true;
    }
    if (legacyS.cosmetics && Array.isArray(legacyS.cosmetics.owned)) {
      const add = legacyS.cosmetics.owned.filter(id => VALID.has(id));
      if (add.length) { w.cosmetics.owned = [...new Set([...w.cosmetics.owned, ...add])]; changed = true; }
    }
    w.migrated.push(gameKey);
    put(w);
    return changed;
  }

  /* Net-new absorb (pro HUB): při každé návštěvě stáhne nově vydělané per-game
     kredity do sdílené peněženky bez dvojího započítání. Sleduje poslední viděný
     stav `w.absorbed[gameKey]`. Když per-game zůstatek klesne (utratil ve hře),
     jen sníží sledovanou hodnotu (bez refundu) — sdílený pot je čistě motivační,
     kosmetický, takže drobné dvojí utracení nevadí. */
  function absorbGame(gameKey, legacyS) {
    if (!gameKey || !legacyS || typeof legacyS !== 'object') return false;
    const w = get();
    let changed = false;
    const cur = (typeof legacyS.credits === 'number' && isFinite(legacyS.credits) && legacyS.credits > 0) ? Math.floor(legacyS.credits) : 0;
    const seen = Math.floor(w.absorbed[gameKey] || 0);
    if (cur > seen) { w.credits = Math.floor(w.credits) + (cur - seen); w.absorbed[gameKey] = cur; changed = true; }
    else if (cur !== seen) { w.absorbed[gameKey] = cur; }  // utraceno ve hře → jen posuň značku dolů
    if (legacyS.cosmetics && Array.isArray(legacyS.cosmetics.owned)) {
      const add = legacyS.cosmetics.owned.filter(id => VALID.has(id));
      if (add.length) {
        const before = w.cosmetics.owned.length;
        w.cosmetics.owned = [...new Set([...w.cosmetics.owned, ...add])];
        if (w.cosmetics.owned.length !== before) changed = true;
      }
    }
    put(w);
    return changed;
  }

  /* ════════ CLOUD SYNC (sdílení napříč zařízeními přes Google účet) ════════
     Peněženka se ukládá jako řádek v tabulce `saves` s game='_wallet'. Po
     přihlášení RPGCloud stáhne vzdálenou peněženku a zavolá mergeRemote(),
     pak pushne sloučený stav zpět ⇒ co koupíš doma, máš i ve škole.
     Sloučení je „kid-friendly": nikdy neztratí kredity ani kosmetiku. */
  function mergeRemote(remote) {
    if (!remote || typeof remote !== 'object' || Array.isArray(remote)) return get();
    const local = get();
    let r;
    try { r = _sanitize(JSON.parse(JSON.stringify(remote))); } catch (e) { return local; }
    // kredity: vyšší z obou (žák nikdy nepřijde o nasbírané)
    local.credits = Math.max(Math.floor(local.credits), Math.floor(r.credits));
    // vlastněná kosmetika: sjednocení
    local.cosmetics.owned = [...new Set([...local.cosmetics.owned, ...r.cosmetics.owned])];
    // aktivní kosmetika: převezmi vzdálenou volbu, pokud ji teď vlastníme
    ACTIVE_CATS.forEach(cat => {
      const rid = r.cosmetics.active[cat], it = byId(rid);
      if (it && it.cat === cat && (it.price === 0 || local.cosmetics.owned.includes(rid))) local.cosmetics.active[cat] = rid;
    });
    // životní countery: max z obou (nikdy neztratit postup); úspěchy: sjednocení
    LIFE_KEYS.forEach(k => { local.life[k] = Math.max(local.life[k] || 0, r.life[k] || 0); });
    Object.keys(r.gach).forEach(id => { if (!local.gach[id]) local.gach[id] = r.gach[id]; });
    // reducedMotion necháváme LOKÁLNÍ (komfort daného zařízení, nesynchronizuje se)
    // migrated/absorbed: sjednoť/max, ať se per-game migrace nezapočítá dvakrát
    local.migrated = [...new Set([...(local.migrated || []), ...(r.migrated || [])])];
    const ab = {}, keys = new Set([...Object.keys(local.absorbed || {}), ...Object.keys(r.absorbed || {})]);
    keys.forEach(k => { ab[k] = Math.max(Math.floor((local.absorbed || {})[k] || 0), Math.floor((r.absorbed || {})[k] || 0)); });
    local.absorbed = ab;
    _suppressCloud = true; put(local); _suppressCloud = false;  // ulož bez okamžitého pushe (push řeší pushCloud)
    return get();
  }
  function pushCloud() {
    try { if (typeof window !== 'undefined' && window.RPGCloud && RPGCloud.push) RPGCloud.push(CLOUD_GAME, get()); } catch (e) {}
  }

  /* ── SDÍLENÉ CSS nové kosmetiky (jedno místo místo kopií v 8 souborech).
        Selektory míří na herní (#pr-avatar/#pr-name/#map-name) i HUBí
        (.gp-av/.gp-name) prvky. Témata jen přepisují CSS proměnné — engine
        je má ve všech hrách stejné (--gold/--panel/--panel2/--blue). ── */
  function _injectCss() {
    if (typeof document === 'undefined' || document.getElementById('rw-css')) return;
    const st = document.createElement('style');
    st.id = 'rw-css';
    st.textContent = `
#pr-avatar.av-wreath,.gp-av.av-wreath{border-color:#ff9edb!important;box-shadow:0 0 12px #ff9edb99,inset 0 0 8px #ff9edb44}
#pr-avatar.av-anchor,.gp-av.av-anchor{border-color:#c9a066!important;box-shadow:0 0 0 3px #23486b,0 0 14px #23486b99}
#pr-avatar.av-dragon,.gp-av.av-dragon{border-color:#3ddc84!important;box-shadow:0 0 10px #3ddc8499,0 0 22px #f4d03f55,inset 0 0 8px #3ddc8444}
#pr-avatar.av-pumpkin,.gp-av.av-pumpkin{border-color:#ff8c1a!important;box-shadow:0 0 14px #ff8c1a99,inset 0 0 10px #ff8c1a44}
#pr-avatar.av-heart,.gp-av.av-heart{border-color:#ff5c8a!important;box-shadow:0 0 12px #ff5c8a99;animation:rw-heart 1.6s ease-in-out infinite}
#pr-avatar.av-diamond,.gp-av.av-diamond{border-color:#bff3ff!important;box-shadow:0 0 10px #bff3ffcc,0 0 26px #7fd8ff88;animation:rw-diamond 2.2s linear infinite}
@keyframes rw-heart{50%{box-shadow:0 0 22px #ff5c8acc}}
@keyframes rw-diamond{0%{filter:hue-rotate(0)}100%{filter:hue-rotate(360deg)}}
.nm-ice{color:#9fdcff!important;text-shadow:0 0 8px #9fdcff88}
.nm-shine{color:#ffd75e!important;text-shadow:0 0 6px #ffd75e,0 0 18px #ffb70088;animation:rw-shine 2.4s ease-in-out infinite}
@keyframes rw-shine{50%{text-shadow:0 0 12px #ffd75e,0 0 30px #ffb700cc}}
.nm-rainbow{background:linear-gradient(90deg,#ff5c5c,#ffb84d,#ffe14d,#6be36b,#5cc9ff,#b18cff,#ff5c5c);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent!important;animation:rw-rainbow 4s linear infinite}
@keyframes rw-rainbow{100%{background-position:300% 0}}
html[data-theme="space"]{--gold:#8fb8ff;--panel:#070b1a;--panel2:#0b1230;--blue:#6ea8ff}
html[data-theme="temple"]{--gold:#ffd97a;--panel:#1a140a;--panel2:#241c0e;--blue:#e0b25a}
html[data-theme="vanoce"]{--gold:#ff6a6a;--panel:#08140c;--panel2:#0e2214;--blue:#7fdc9a}
html[data-theme="leto"]{--gold:#ffd166;--panel:#062033;--panel2:#0a2e4a;--blue:#4cc9f0}
.victory-banner.vc-coins{text-shadow:3px 3px 0 #8a6d00,0 0 20px #ffd700,0 0 44px #ffb700}
.victory-banner.vc-fireworks{text-shadow:3px 3px 0 #ff3d7f,0 0 16px #ffd75e,0 0 32px #5cc9ff,0 0 48px #b18cff}
.rw-title{font-size:12px;letter-spacing:1.5px;opacity:.9;color:var(--gold,#f4d03f);margin-top:2px}
.rw-pet{display:inline-block;font-size:24px;margin-left:8px;vertical-align:middle;animation:rw-pet-b 2.4s ease-in-out infinite;cursor:default}
@keyframes rw-pet-b{50%{transform:translateY(-5px)}}
.reduced-motion .rw-pet,.reduced-motion .nm-shine,.reduced-motion .nm-rainbow,.reduced-motion #pr-avatar.av-heart,.reduced-motion .gp-av.av-heart,.reduced-motion #pr-avatar.av-diamond,.reduced-motion .gp-av.av-diamond{animation:none!important}
.rw-gach{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.rw-gach-row{display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--panel2,#181830);border:1px solid #3a3a5e;border-radius:8px}
.rw-gach-row.locked{opacity:.55}
.rw-gach-row.locked .rw-gach-ic{filter:grayscale(1)}
.rw-gach-ic{font-size:24px;flex:none}
.rw-gach-nm{font-weight:700;font-size:13px}
.rw-gach-desc{font-size:11px;opacity:.8}
.rw-gach-bar{height:5px;background:#00000055;border-radius:3px;overflow:hidden;margin-top:4px}
.rw-gach-fill{height:100%;background:var(--gold,#f4d03f)}
.rw-gach-pct{font-size:10px;opacity:.7;flex:none;min-width:64px;text-align:right}`;
    (document.head || document.documentElement).appendChild(st);
  }
  try { _injectCss(); } catch (e) {}

  /* Titul pod jménem + mazlíček u avatara. Volá se z applyCosmetics her a
     z HUBu; prvky předá volající, tvorbu/úklid řeší peněženka centrálně. */
  function _esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function renderTitlePet(o) {
    o = o || {};
    const t = itemById(activeId('title')), p = itemById(activeId('pet'));
    [o.nameEl, o.mapNameEl].forEach(el => {
      if (!el) return;
      let d = el.parentNode && el.parentNode.querySelector(':scope > .rw-title');
      if (!t) { if (d) d.remove(); return; }
      if (!d) { d = document.createElement('div'); d.className = 'rw-title'; el.after(d); }
      d.textContent = t.ic + ' ' + t.name;
    });
    const av = o.avatarEl;
    if (av) {
      let sp = av.parentNode && av.parentNode.querySelector(':scope > .rw-pet');
      if (!p) { if (sp) sp.remove(); }
      else {
        if (!sp) { sp = document.createElement('span'); sp.className = 'rw-pet'; av.after(sp); }
        sp.textContent = p.ic; sp.title = p.name;
      }
    }
  }

  /* Mřížka životních úspěchů s pokrokem (profil her + HUB). */
  function renderGachInto(el) {
    if (!el) return;
    const list = gachList();
    el.innerHTML = '<div class="rw-gach">' + list.map(g => {
      const pct = Math.min(100, Math.round(g.have / g.goal * 100));
      const done = !!g.unlocked;
      return `<div class="rw-gach-row${done ? '' : ' locked'}">
        <div class="rw-gach-ic">${g.ic}</div>
        <div style="flex:1;min-width:0">
          <div class="rw-gach-nm">${_esc(g.nm)}</div>
          <div class="rw-gach-desc">${_esc(g.desc)}</div>
          <div class="rw-gach-bar"><div class="rw-gach-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="rw-gach-pct">${done ? '✅ ' + _esc(g.unlocked) : g.have.toLocaleString('cs-CZ') + ' / ' + g.goal.toLocaleString('cs-CZ')}</div>
      </div>`;
    }).join('') + '</div>';
  }

  // ── Živé aktualizace (i napříč záložkami) ──
  function onChange(fn) { if (typeof fn === 'function') listeners.push(fn); }
  try { window.addEventListener('storage', e => { if (e.key === KEY) emit(); }); } catch (e) {}

  return {
    KEY, CLOUD_GAME, items, itemsAll, itemById, get,
    getCredits, earn,
    buy, activate, owns, activeId, isActive, cssFor, hasPowerup,
    getReducedMotion, setReducedMotion,
    bumpLife, setLifeMax, hasPerk, lifeStats, gachList, seasonOpen,
    renderTitlePet, renderGachInto,
    migrateFrom, absorbGame, mergeRemote, pushCloud, onChange
  };
})();
