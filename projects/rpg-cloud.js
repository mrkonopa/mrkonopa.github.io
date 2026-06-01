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

  let client = null, user = null;
  const listeners = [];
  const pushTimers = {};

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
      client.auth.onAuthStateChange((_event, s) => {
        const nu = s ? s.user : null;
        if (nu && !emailOK(nu)) { client.auth.signOut(); return; }
        user = nu; emit();
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
    if (!client || !user) return;          // bez přihlášení = jen localStorage
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

  /* napojení pro jednotlivou hru: lišta + stažení postavy po přihlášení */
  function attachGame(saveKey, onLoaded) {
    document.addEventListener('DOMContentLoaded', () => {
      const wrap = document.querySelector('#s-intro .wrap');
      if (wrap) wrap.insertBefore(makeBar(), wrap.firstChild);
      onChange(async (u) => {
        paint();
        if (u) {
          const cloud = await pull(saveKey);
          if (cloud) {
            localStorage.setItem(saveKey, JSON.stringify(cloud));
            const cp = document.getElementById('continue-panel');
            if (cp) cp.style.display = 'block';
            if (typeof onLoaded === 'function') onLoaded(cloud);
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
           pull, push, onChange, attachGame, attachHub };
})();
