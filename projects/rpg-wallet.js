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
    // ── powerupy (gameplay, one-time purchase) ──
    { id: 'pu-ghost-heart',   cat: 'powerup', name: 'Železná vůle',    ic: '🫀', price: 550, minLevel: 5, desc: '+1 prázdné srdce na start každého boje.' },
    { id: 'pu-time-bonus',    cat: 'powerup', name: 'Přesýpací hodiny',ic: '⏳', price: 500, minLevel: 4, desc: '+5 sekund na každý příklad.' },
    { id: 'pu-freeze-dbl',    cat: 'powerup', name: 'Permafrost',      ic: '🧊', price: 700, minLevel: 6, desc: 'Zmrznutí trvá 30 s místo 15 s.' },
    { id: 'pu-full-heart',    cat: 'powerup', name: 'Druhá krev',      ic: '💗', price: 1000, minLevel: 8, desc: '+1 plné srdce na start každého boje.' },
    { id: 'pu-xp-crit',       cat: 'powerup', name: 'Adrenalin',       ic: '⚡', price: 750, minLevel: 7, desc: '+1 XP navíc za každý kritický zásah.' },
    { id: 'pu-second-chance',  cat: 'powerup', name: 'Druhá šance',    ic: '🛡️', price: 1300, minLevel: 10, desc: '1× za boj: místo porážky přežiješ s 1 ❤️.' },
  ];

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
        active: { border: null, badge: null, theme: DEFAULT_THEME, victory: DEFAULT_VICTORY }
      },
      settings: { reducedMotion: false },
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
    ['border', 'badge', 'theme', 'victory'].forEach(cat => {
      const id = A[cat], it = byId(id);
      const fallback = cat === 'theme' ? DEFAULT_THEME : cat === 'victory' ? DEFAULT_VICTORY : null;
      if (!it || it.cat !== cat) { A[cat] = fallback; return; }
      if (it.price > 0 && !owned.includes(id)) A[cat] = fallback;  // aktivní jen co vlastním
    });
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
    put(w);
    return w.credits;
  }

  // ── Obchod ──
  function buy(id) {
    const it = byId(id);
    if (!it) return { ok: false, reason: 'unknown' };
    const w = get();
    if (it.cat === 'powerup') {
      if (w.cosmetics.owned.includes(id)) return { ok: true, reason: 'already-owned' };
      if (w.credits < it.price) return { ok: false, reason: 'insufficient', need: it.price, have: w.credits };
      w.credits = Math.floor(w.credits) - it.price;
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
  function items() { return SHOP_ITEMS.map(i => ({ ...i })); }
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
    ['border', 'badge', 'theme', 'victory'].forEach(cat => {
      const rid = r.cosmetics.active[cat], it = byId(rid);
      if (it && it.cat === cat && (it.price === 0 || local.cosmetics.owned.includes(rid))) local.cosmetics.active[cat] = rid;
    });
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

  // ── Živé aktualizace (i napříč záložkami) ──
  function onChange(fn) { if (typeof fn === 'function') listeners.push(fn); }
  try { window.addEventListener('storage', e => { if (e.key === KEY) emit(); }); } catch (e) {}

  return {
    KEY, CLOUD_GAME, items, itemById, get,
    getCredits, earn,
    buy, activate, owns, activeId, isActive, cssFor, hasPowerup,
    getReducedMotion, setReducedMotion,
    migrateFrom, absorbGame, mergeRemote, pushCloud, onChange
  };
})();
