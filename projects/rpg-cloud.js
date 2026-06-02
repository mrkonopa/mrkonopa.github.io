/* ════════════════════════════════════════════════════════════════════
   RPG Matematika — cloudové přihlášení a ukládání postav (FÁZE 1)
   Backend: Supabase (Auth přes Google) · viz RPG-CLOUD-SETUP.md

   DŮLEŽITÉ: Dokud nevyplníš CONFIG níže (nebo když se nenačte knihovna
   Supabase), všechno běží přesně jako dřív — lokálně přes localStorage.
   Přihlašovací lišta se v takovém případě sama skryje. Nulové riziko.
   ════════════════════════════════════════════════════════════════════ */
window.RPGCloud = (function () {
  const CONFIG = {
    SUPABASE_URL: 'https://ovajoalbyofenjbbyhcy.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_XWQ96Yv5YfvUtJ001hiXsw_HZpxJcAp',
    ALLOWED_DOMAIN: 'husovaliberec.cz'   // povolíme jen školní účty
  };

  let client = null, user = null, role = null;
  const listeners = [];
  const pushTimers = {};
  let previewActive = false;   // ?preview=1 nebo ?su=… → nic se neukládá

  const configured = () =>
    !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && window.supabase);

  const emailOK = u =>
    !!u && String(u.email || '').toLowerCase().endsWith('@' + CONFIG.ALLOWED_DOMAIN);

  const currentUser = () => user;
  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(f => { try { f(user); } catch (e) {} }); }

  async function init() {
    if (!configured()) { emit(); return false; }
    try {
      client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      const { data: { session } } = await client.auth.getSession();
      user = session ? session.user : null;
      if (user && !emailOK(user)) {
        await client.auth.signOut();
        user = null;
        alert('Přihlas se prosím školním účtem @' + CONFIG.ALLOWED_DOMAIN + '.');
      }
      role = null;
      if (user) await fetchRole();
      client.auth.onAuthStateChange(async (_event, s) => {
        const nu = s ? s.user : null;
        if (nu && !emailOK(nu)) { client.auth.signOut(); return; }
        user = nu;
        if (user) await fetchRole(); else role = null;
        emit();
      });
      emit();
      return true;
    } catch (e) { console.warn('[RPGCloud] init selhal:', e); emit(); return false; }
  }

  async function login() {
    if (!configured()) { alert('Cloudové přihlášení zatím není nastaveno.'); return; }
    await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { hd: CONFIG.ALLOWED_DOMAIN, prompt: 'select_account' },
        redirectTo: location.href.split('#')[0]
      }
    });
  }
  async function logout() { if (client) { await client.auth.signOut(); user = null; emit(); } }

  async function pull(game) {
    if (!client || !user) return null;
    try {
      const { data } = await client.from('saves')
        .select('data').eq('user_id', user.id).eq('game', game).maybeSingle();
      return data ? data.data : null;
    } catch (e) { console.warn('[RPGCloud] pull selhal:', e); return null; }
  }

  function push(game, obj) {
    if (!client || !user || previewActive) return;  // bez přihlášení / náhled = jen localStorage
    clearTimeout(pushTimers[game]);
    pushTimers[game] = setTimeout(async () => {
      try {
        await client.from('saves').upsert({
          user_id: user.id, game,
          data: obj,
          name: (obj && obj.name) || '',
          email: user.email || '',
          full_name: (user.user_metadata && user.user_metadata.full_name) || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,game' });
      } catch (e) { console.warn('[RPGCloud] push selhal:', e); }
    }, 800);
  }

  /* ════════ ROLE A UČITELSKÉ FUNKCE (Fáze 2) ════════ */
  async function fetchRole() {
    if (!client || !user) { role = null; return null; }
    try {
      const { data } = await client.from('roles')
        .select('role').eq('email', (user.email || '').toLowerCase()).maybeSingle();
      role = data ? data.role : 'student';
    } catch (e) { console.warn('[RPGCloud] fetchRole selhal:', e); role = 'student'; }
    return role;
  }
  const getRole   = () => role;
  const isStaff   = () => role === 'teacher' || role === 'superadmin';
  const isAdmin   = () => role === 'superadmin';

  // všechny postavy všech žáků (jen pro učitele/superadmina — hlídá RLS)
  async function listAllSaves() {
    if (!client || !isStaff()) return [];
    try {
      const { data, error } = await client.from('saves')
        .select('user_id,game,data,name,email,full_name,updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] listAllSaves selhal:', e); return []; }
  }

  // jedna postava konkrétního žáka (pro náhled ?su=…)
  async function pullSaveFor(userId, game) {
    if (!client || !isStaff()) return null;
    try {
      const { data } = await client.from('saves')
        .select('data').eq('user_id', userId).eq('game', game).maybeSingle();
      return data ? data.data : null;
    } catch (e) { console.warn('[RPGCloud] pullSaveFor selhal:', e); return null; }
  }

  // úprava postavy (odměny, posun levelu) — jen superadmin
  async function updateSaveFor(userId, game, dataObj) {
    if (!client || !isAdmin()) return { ok: false, error: 'Nemáš oprávnění.' };
    try {
      const { error } = await client.from('saves')
        .update({ data: dataObj, name: (dataObj && dataObj.name) || '', updated_at: new Date().toISOString() })
        .eq('user_id', userId).eq('game', game);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  // smazání postavy — jen superadmin
  async function deleteSaveFor(userId, game) {
    if (!client || !isAdmin()) return { ok: false, error: 'Nemáš oprávnění.' };
    try {
      const { error } = await client.from('saves')
        .delete().eq('user_id', userId).eq('game', game);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  // správa učitelů — jen superadmin
  async function listRoles() {
    if (!client || !isAdmin()) return [];
    try {
      const { data, error } = await client.from('roles')
        .select('email,role,added_by,created_at').order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] listRoles selhal:', e); return []; }
  }
  async function upsertRole(email, r) {
    if (!client || !isAdmin()) return { ok: false, error: 'Nemáš oprávnění.' };
    email = String(email || '').trim().toLowerCase();
    if (!email.endsWith('@' + CONFIG.ALLOWED_DOMAIN))
      return { ok: false, error: 'Musí být školní e-mail @' + CONFIG.ALLOWED_DOMAIN };
    if (!['teacher', 'superadmin'].includes(r))
      return { ok: false, error: 'Neplatná role.' };
    try {
      const { error } = await client.from('roles')
        .upsert({ email, role: r, added_by: user.email || '' }, { onConflict: 'email' });
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  async function deleteRole(email) {
    if (!client || !isAdmin()) return { ok: false, error: 'Nemáš oprávnění.' };
    email = String(email || '').trim().toLowerCase();
    if (email === (user.email || '').toLowerCase())
      return { ok: false, error: 'Nemůžeš odebrat roli sám sobě.' };
    try {
      const { error } = await client.from('roles').delete().eq('email', email);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  // stránku smí vidět jen učitel/superadmin — jinak přesměruj na hub
  async function requireStaff(redirect) {
    await init();
    if (!isStaff()) {
      alert('Tato stránka je jen pro učitele. Přihlas se učitelským účtem.');
      location.href = redirect || 'rpg-matematika.html';
      return false;
    }
    return true;
  }

  /* ── UI: malá přihlašovací lišta ── */
  function makeBar(extra) {
    const b = document.createElement('div');
    b.id = 'cloud-bar';
    b.style.cssText =
      'display:none;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;text-align:center;' +
      'font-family:var(--px,monospace);font-size:13px;margin:0 0 14px;padding:9px 13px;border-radius:6px;' +
      'border:1px solid var(--line,#2a3450);background:rgba(0,0,0,.28);' + (extra || '');
    b.innerHTML =
      '<span id="cloud-status" style="color:var(--muted,#8895b5)"></span>' +
      '<button id="cloud-btn" style="cursor:pointer;font-family:inherit;font-weight:700;font-size:12px;' +
      'padding:7px 13px;border-radius:5px;border:2px solid var(--blue,#5dc8f0);' +
      'background:var(--blue,#5dc8f0);color:#06101e">🔑 Přihlásit přes Google</button>';
    return b;
  }
  function paint() {
    const wrap = document.getElementById('cloud-bar');
    const status = document.getElementById('cloud-status');
    const btn = document.getElementById('cloud-btn');
    if (!wrap || !status || !btn) return;
    if (!configured()) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'flex';
    if (user) {
      status.textContent = '☁️ ' + (user.email || '') + ' — postava se ukládá do cloudu';
      btn.textContent = 'Odhlásit';
      btn.onclick = logout;
    } else {
      status.textContent = 'Hraješ lokálně. Přihlas se a měj postavu na všech zařízeních.';
      btn.textContent = '🔑 Přihlásit přes Google';
      btn.onclick = login;
    }
  }

  /* sandbox localStorage pro jeden klíč → v náhledu se nic neuloží na disk */
  const memStore = {};
  function sandboxStorage(key) {
    const real = {
      get: localStorage.getItem.bind(localStorage),
      set: localStorage.setItem.bind(localStorage),
      del: localStorage.removeItem.bind(localStorage)
    };
    localStorage.getItem    = (k) => k === key ? (k in memStore ? memStore[k] : null) : real.get(k);
    localStorage.setItem    = (k, v) => { if (k === key) memStore[k] = String(v); else real.set(k, v); };
    localStorage.removeItem = (k) => { if (k === key) delete memStore[k]; else real.del(k); };
    return memStore;
  }
  function previewBanner(text, color) {
    const b = document.createElement('div');
    b.id = 'preview-banner';
    b.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:9999;text-align:center;' +
      'font-family:var(--px,monospace);font-weight:700;font-size:13px;letter-spacing:1px;' +
      'padding:8px 12px;color:#06101e;background:' + (color || '#f4d03f') + ';box-shadow:0 2px 10px #0008';
    b.textContent = text;
    document.body.appendChild(b);
    document.body.style.paddingTop = '38px';
  }

  /* napojení pro jednotlivou hru: lišta + stažení postavy po přihlášení.
     Učitelský náhled přes URL: ?preview=1 (hraní nanečisto) nebo
     ?su=<user_id>&game=<KEY> (read-only pohled na postavu žáka). */
  function attachGame(saveKey, onLoaded) {
    const params  = new URLSearchParams(location.search);
    const preview = params.get('preview') === '1';
    const suId    = params.get('su');

    if (preview || suId) { previewActive = true; sandboxStorage(saveKey); }

    document.addEventListener('DOMContentLoaded', async () => {
      // ── Učitelský pohled na postavu žáka (read-only) ──
      if (suId) {
        const okStaff = await requireStaff();
        if (!okStaff) return;
        const data = await pullSaveFor(suId, saveKey);
        if (data) memStore[saveKey] = JSON.stringify(data);
        previewBanner('👁 NÁHLED POSTAVY ŽÁKA — jen ke čtení, nic se neukládá. ✕ zavřít kartou.', '#19e6e6');
        const jump = () => {
          if (typeof window.loadS === 'function' && typeof window.go === 'function') {
            if (data) { window.loadS(); window.go('map'); }
          }
        };
        if (document.readyState === 'complete') jump();
        else window.addEventListener('load', jump);
        return;
      }
      // ── Náhled hry (učitel si hraje nanečisto) ──
      if (preview) {
        previewBanner('🎬 NÁHLED HRY — hraješ nanečisto, nic se neukládá.', '#f4d03f');
        return;
      }
      // ── Normální režim ──
      const wrap = document.querySelector('#s-intro .wrap');
      if (wrap) wrap.insertBefore(makeBar(), wrap.firstChild);
      onChange(async (u) => {
        paint();
        if (u) {
          const cloud = await pull(saveKey);
          let local = null;
          try { local = JSON.parse(localStorage.getItem(saveKey)); } catch {}
          const localDone = local && local.done ? Object.keys(local.done).length : 0;
          const cloudDone = cloud && cloud.done ? Object.keys(cloud.done).length : 0;
          if (cloud && cloudDone >= localDone) {
            // cloud je stejně pokročilý nebo lepší → přepiš lokál
            localStorage.setItem(saveKey, JSON.stringify(cloud));
            const cp = document.getElementById('continue-panel');
            if (cp) cp.style.display = 'block';
            if (typeof onLoaded === 'function') onLoaded(cloud);
          } else if (local && localDone > 0) {
            // lokál je pokročilejší → nahraj ho do cloudu
            push(saveKey, local);
            const cp = document.getElementById('continue-panel');
            if (cp) cp.style.display = 'block';
          }
        }
      });
      init().then(paint);
    });
  }

  /* napojení pro hub: lišta + stažení všech postav a překreslení */
  function attachHub(games, rerender, mountSel) {
    document.addEventListener('DOMContentLoaded', () => {
      const host = (mountSel && document.querySelector(mountSel)) || document.body;
      const after = document.getElementById('cloud-mount');
      const bar = makeBar('max-width:100%');
      if (after) after.appendChild(bar); else host.insertBefore(bar, host.firstChild);
      onChange(async (u) => {
        paint();
        if (u) {
          for (const g of games) {
            const cloud = await pull(g);
            if (cloud) localStorage.setItem(g, JSON.stringify(cloud));
          }
          if (typeof rerender === 'function') rerender();
        }
      });
      init().then(paint);
    });
  }

  return { CONFIG, configured, init, login, logout, currentUser,
           pull, push, onChange, attachGame, attachHub,
           // Fáze 2 — role a učitelská konzole
           getRole, isStaff, isAdmin, fetchRole, requireStaff,
           listAllSaves, pullSaveFor, updateSaveFor, deleteSaveFor,
           listRoles, upsertRole, deleteRole };
})();
