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

  // Když je Supabase projekt pozastavený / nedostupný, await se nikdy nevrátí
  // a stránka se točí donekonečna. Tahle obálka po `ms` vyhodí chybu, takže
  // se ukáže smysluplná hláška místo nekonečného „Ověřuji přístup…".
  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, rej) => setTimeout(
        () => rej(new Error('timeout:' + (label || '') + ' (' + ms + 'ms)')), ms))
    ]);
  }
  let lastError = null;
  const getError = () => lastError;

  async function init() {
    if (!configured()) { emit(); return false; }
    try {
      client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      const { data: { session } } = await withTimeout(
        client.auth.getSession(), 8000, 'getSession');
      user = session ? session.user : null;
      if (user && !emailOK(user)) {
        await client.auth.signOut();
        user = null;
        alert('Přihlas se prosím školním účtem @' + CONFIG.ALLOWED_DOMAIN + '.');
      }
      role = null;
      if (user) { await fetchRole(); syncWallet(); }
      client.auth.onAuthStateChange(async (_event, s) => {
        const nu = s ? s.user : null;
        if (nu && !emailOK(nu)) { client.auth.signOut(); return; }
        const wasOut = !user;
        user = nu;
        if (user) { await fetchRole(); if (wasOut) syncWallet(); } else role = null;
        emit();
      });
      emit();
      return true;
    } catch (e) { lastError = e; console.warn('[RPGCloud] init selhal:', e); emit(); return false; }
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

  /* Sdílená peněženka přes Google účet: stáhni vzdálenou (game='_wallet'),
     slij ji s lokální (mergeRemote nikdy neztratí kredity/kosmetiku) a pošli
     sloučený stav zpět. Graceful: bez RPGWallet/přihlášení nic nedělá. */
  async function syncWallet() {
    if (!client || !user || previewActive || !window.RPGWallet) return;
    try {
      const remote = await pull('_wallet');
      if (remote) window.RPGWallet.mergeRemote(remote);
      window.RPGWallet.pushCloud();
    } catch (e) { console.warn('[RPGCloud] syncWallet selhal:', e); }
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
      const { data } = await withTimeout(client.from('roles')
        .select('role').eq('email', (user.email || '').toLowerCase()).maybeSingle(),
        8000, 'fetchRole');
      role = data ? data.role : 'student';
    } catch (e) { lastError = e; console.warn('[RPGCloud] fetchRole selhal:', e); role = 'student'; }
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

  // ── Fáze 3: třídy ──────────────────────────────────────────────────────
  async function listClasses() {
    if (!client || !isStaff()) return [];
    try {
      const { data, error } = await client.from('classes')
        .select('id,name,section,cohort_start_year,created_by,created_at').order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] listClasses selhal:', e); return []; }
  }
  async function createClass(name, meta) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    name = String(name || '').trim();
    if (!name) return { ok: false, error: 'Zadej název třídy.' };
    meta = meta || {};
    const row = { name, created_by: user.email || '' };
    if (meta.section != null) row.section = String(meta.section || '').trim();
    if (meta.cohort_start_year != null && meta.cohort_start_year !== '')
      row.cohort_start_year = parseInt(meta.cohort_start_year, 10) || null;
    try {
      const { data, error } = await client.from('classes')
        .insert(row).select('id').single();
      if (error) throw error;
      return { ok: true, id: data.id };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  // úprava kohortních metadat třídy (název / section / cohort_start_year)
  async function updateClassMeta(id, meta) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    meta = meta || {};
    const patch = {};
    if (meta.name != null) {
      const n = String(meta.name).trim();
      if (!n) return { ok: false, error: 'Zadej název třídy.' };
      patch.name = n;
    }
    if (meta.section != null) patch.section = String(meta.section || '').trim();
    if (meta.cohort_start_year !== undefined)
      patch.cohort_start_year = (meta.cohort_start_year === '' || meta.cohort_start_year == null)
        ? null : (parseInt(meta.cohort_start_year, 10) || null);
    if (!Object.keys(patch).length) return { ok: true };
    try {
      const { error } = await client.from('classes').update(patch).eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  async function renameClass(id, name) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    name = String(name || '').trim();
    if (!name) return { ok: false, error: 'Zadej název třídy.' };
    try {
      const { error } = await client.from('classes').update({ name }).eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  async function deleteClass(id) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    try {
      const { error } = await client.from('classes').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  // všechna členství (sbor) — konzole si je seskupí podle class_id
  async function listMemberships() {
    if (!client || !isStaff()) return [];
    try {
      const { data, error } = await client.from('class_members')
        .select('class_id,user_id,added_at');
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] listMemberships selhal:', e); return []; }
  }
  async function addToClass(classId, userId) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    try {
      const { error } = await client.from('class_members')
        .upsert({ class_id: classId, user_id: userId, added_by: user.email || '' },
                { onConflict: 'class_id,user_id' });
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  async function removeFromClass(classId, userId) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    try {
      const { error } = await client.from('class_members')
        .delete().eq('class_id', classId).eq('user_id', userId);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  // ── Fáze 3: poznámky k žákům ───────────────────────────────────────────
  async function listNotesFor(studentId) {
    if (!client || !isStaff()) return [];
    try {
      const { data, error } = await client.from('notes')
        .select('id,student_id,author_email,author_name,body,created_at,read_at,deleted_at,batch_id')
        .eq('student_id', studentId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] listNotesFor selhal:', e); return []; }
  }
  async function addNote(studentId, body, batchId) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    body = String(body || '').trim();
    if (!body) return { ok: false, error: 'Napiš text poznámky.' };
    try {
      const row = {
        student_id: studentId, body,
        author_email: user.email || '',
        author_name: (user.user_metadata && user.user_metadata.full_name) || user.email || ''
      };
      if (batchId) row.batch_id = batchId;
      const { error } = await client.from('notes').insert(row);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  async function deleteNote(noteId) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    try {
      const { error } = await client.from('notes').delete().eq('id', noteId);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  // „stáhnout zpět" celý hromadný vzkaz — smaže všechny řádky dané dávky.
  // RLS pustí jen řádky, jejichž je přihlášený autorem (nebo superadmin).
  async function deleteBroadcast(batchId) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    if (!batchId) return { ok: false, error: 'Chybí identifikátor vzkazu.' };
    try {
      const { error } = await client.from('notes').delete().eq('batch_id', batchId);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  // přehled odeslaných vzkazů seskupený do dávek (broadcast = 1 batch → N žáků).
  // Vrací [{batch_id, body, author_name, created_at, total, read, deleted}], nejnovější první.
  async function listMyBroadcasts() {
    if (!client || !isStaff()) return [];
    try {
      const { data, error } = await client.from('notes')
        .select('batch_id,body,author_name,author_email,created_at,read_at,deleted_at')
        .eq('author_email', (user.email || '').toLowerCase())
        .order('created_at', { ascending: false }).limit(600);
      if (error) throw error;
      const map = new Map();
      (data || []).forEach(n => {
        const k = n.batch_id || n.created_at;
        let g = map.get(k);
        if (!g) { g = { batch_id: k, body: n.body, author_name: n.author_name, created_at: n.created_at, total: 0, read: 0, deleted: 0 }; map.set(k, g); }
        g.total++; if (n.read_at) g.read++; if (n.deleted_at) g.deleted++;
        if (n.created_at < g.created_at) g.created_at = n.created_at;
      });
      return [...map.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    } catch (e) { console.warn('[RPGCloud] listMyBroadcasts selhal:', e); return []; }
  }
  // poznámky pro přihlášeného žáka (in-game „vzkazy") — RLS pustí jen vlastní.
  // Vrací jen nesmazané.
  async function pullMyNotes() {
    if (!client || !user) return [];
    try {
      const { data, error } = await client.from('notes')
        .select('id,author_name,body,created_at,read_at')
        .eq('student_id', user.id).is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] pullMyNotes selhal:', e); return []; }
  }
  // žák si otevřel panel → označ všechny nepřečtené jako přečtené
  async function markMyNotesRead() {
    if (!client || !user) return;
    try { await client.rpc('mark_my_notes_read'); }
    catch (e) { console.warn('[RPGCloud] markMyNotesRead selhal:', e); }
  }
  // žák smaže svůj vzkaz (soft-delete; učiteli zůstane viditelný se stavem „smazáno")
  async function deleteMyNote(noteId) {
    if (!client || !user) return { ok: false };
    try { const { error } = await client.rpc('soft_delete_my_note', { p_id: noteId });
      if (error) throw error; return { ok: true }; }
    catch (e) { console.warn('[RPGCloud] deleteMyNote selhal:', e); return { ok: false, error: e.message }; }
  }

  // ── FÁZE 4: žebříček třídy ──
  // vrací pořadí spolužáků v daném ročníku (jen jméno/level/xp; viz SQL leaderboard())
  async function leaderboard(game) {
    if (!client || !user) return [];
    try {
      const { data, error } = await client.rpc('leaderboard', { p_game: game });
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] leaderboard selhal:', e); return []; }
  }

  /* ════════ VYSVĚTLENÍ POSTUPU — Fáze 6 ════════ */
  async function saveExplanation(game, mid, taskIdx, taskText, answer, explanation) {
    if (!client || !user || previewActive) return false;
    const text = String(explanation || '').trim();
    if (!text) return false;
    try {
      const { error } = await client.from('explanations').insert({
        user_id: user.id,
        display_name: (user.user_metadata && user.user_metadata.full_name) || user.email || '',
        game: String(game),
        mid: String(mid),
        task_idx: Number(taskIdx) || 0,
        task_text: String(taskText || '').slice(0, 500),
        answer: String(answer || '').slice(0, 100),
        explanation: text.slice(0, 1000)
      });
      if (error) throw error;
      return true;
    } catch (e) { console.warn('[RPGCloud] saveExplanation selhal:', e); return false; }
  }

  async function listExplanations({ game, mid, limit = 50, offset = 0, classId } = {}) {
    if (!client || !isStaff()) return [];
    try {
      let q = client.from('explanations')
        .select('id,created_at,display_name,game,mid,task_text,answer,explanation')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (game) q = q.eq('game', game);
      if (mid)  q = q.eq('mid', mid);
      if (classId) {
        const { data: members } = await client.from('class_members')
          .select('user_id').eq('class_id', classId);
        if (members && members.length) {
          q = q.in('user_id', members.map(m => m.user_id));
        } else {
          return [];
        }
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] listExplanations selhal:', e); return []; }
  }

  async function deleteExplanation(id) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    try {
      const { error } = await client.from('explanations').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  // ── Fáze 6b — týdenní snímky chybovosti (snap_events) ───────────────
  // Vrací true jen když upload reálně proběhl — hra podle toho nastavuje
  // S.snapsMigrated (nepřihlášený žák nesmí o historické snímky přijít).
  async function pushErrsSnap(game, snaps) {
    if (!client || !user) return false;
    if (!Array.isArray(snaps) || snaps.length === 0) return false;
    const rows = snaps
      .filter(s => s && s.t && typeof s.errs === 'object')
      .map(s => ({ user_id: user.id, game, snapped_at: s.t, errs: s.errs || {} }));
    if (!rows.length) return false;
    const { error } = await client.from('snap_events')
      .upsert(rows, { onConflict: 'user_id,game,snapped_at', ignoreDuplicates: true });
    if (error) { console.warn('[RPGCloud] pushErrsSnap:', error.message); return false; }
    return true;
  }

  async function getErrsSnaps(game) {
    if (!client || !isStaff()) return [];
    const { data, error } = await client.from('snap_events')
      .select('user_id,snapped_at,errs')
      .eq('game', game)
      .order('snapped_at', { ascending: true });
    if (error) { console.warn('[RPGCloud] getErrsSnaps:', error.message); return []; }
    return data || [];
  }

  // ── Fáze 10 — zpětná vazba od hráčů ────────────────────────────────
  async function saveFeedback(body) {
    if (!client || !user) return { ok: false, error: 'Nejsi přihlášen.' };
    const text = String(body || '').trim();
    if (!text) return { ok: false, error: 'Zpráva je prázdná.' };
    try {
      const { error } = await client.from('feedback').insert({
        user_id: user.id,
        display_name: (user.user_metadata && user.user_metadata.full_name) || user.email || '',
        body: text.slice(0, 2000)
      });
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  async function listFeedback({ limit = 100 } = {}) {
    if (!client || !isStaff()) return [];
    try {
      const { data, error } = await client.from('feedback')
        .select('id,created_at,display_name,body')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] listFeedback:', e); return []; }
  }

  async function deleteFeedback(id) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    try {
      const { error } = await client.from('feedback').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  // ════════════ Fáze 7 — živý souboj (Kahoot-style) ════════════
  // Tenké wrappery nad SECURITY DEFINER RPC funkcemi (viz phase7.sql).
  // Vše graceful: bez clienta/přihlášení vrací null/[]/false.
  async function createBattle(game, qcount, hostName) {
    if (!client || !user) return { error: 'Nejsi přihlášen.' };
    try {
      const { data, error } = await client.rpc('create_battle',
        { p_game: game, p_qcount: qcount, p_host_name: hostName });
      if (error) return { error: error.message || String(error) };
      return data;
    } catch (e) { console.warn('[RPGCloud] createBattle:', e); return { error: String(e) }; }
  }
  async function joinBattle(code, name) {
    if (!client || !user) return { error: 'Nejsi přihlášen.' };
    try {
      const { data, error } = await client.rpc('join_battle', { p_code: code, p_name: name });
      if (error) return { error: error.message || String(error) };
      return data;
    } catch (e) { console.warn('[RPGCloud] joinBattle:', e); return { error: String(e) }; }
  }
  async function battleState(battleId) {
    if (!client || !user) return null;
    try {
      const { data, error } = await client.rpc('battle_state', { p_battle: battleId });
      if (error) throw error; return data;
    } catch (e) { return null; }
  }
  async function submitBattleAnswer(battleId, qi, correct, points) {
    if (!client || !user) return false;
    try {
      const { error } = await client.rpc('submit_battle_answer',
        { p_battle: battleId, p_qi: qi, p_correct: !!correct, p_points: Math.round(points) || 0 });
      return !error;
    } catch (e) { return false; }
  }
  async function advanceBattle(battleId, qi) {
    if (!client || !user) return null;
    try {
      const { data, error } = await client.rpc('advance_battle', { p_battle: battleId, p_qi: qi });
      if (error) throw error; return data;
    } catch (e) { console.warn('[RPGCloud] advanceBattle:', e); return null; }
  }
  async function setBattleStatus(battleId, status) {
    if (!client || !user) return null;
    try {
      const { data, error } = await client.rpc('set_battle_status', { p_battle: battleId, p_status: status });
      if (error) throw error; return data;
    } catch (e) { console.warn('[RPGCloud] setBattleStatus:', e); return null; }
  }
  async function listActiveBattles() {
    if (!client || !user) return [];
    try {
      const { data, error } = await client.rpc('list_active_battles');
      if (error) throw error; return data || [];
    } catch (e) { return []; }
  }
  async function inviteBattleEmail(battleId, email) {
    if (!client || !user) return false;
    try {
      const { error } = await client.rpc('invite_battle_email', { p_battle: battleId, p_email: email });
      return !error;
    } catch (e) { return false; }
  }
  async function myBattleInvites() {
    if (!client || !user) return [];
    try {
      const { data, error } = await client.rpc('my_battle_invites');
      if (error) throw error; return data || [];
    } catch (e) { return []; }
  }
  /* Fáze 13: trvalá historie soubojů. Hráč po skončení zapíše svůj výsledek
     (server si čísla dopočítá z battle_players → nelze podvrhnout). */
  async function recordBattleResult(battleId) {
    if (!client || !user) return false;
    try {
      const { error } = await client.rpc('record_battle_result', { p_battle: battleId });
      return !error;
    } catch (e) { return false; }
  }
  /* Učitel: agregace soubojových statistik per žák (volitelně 1 ročník). */
  async function battleStatsAll(game) {
    if (!client || !user) return [];
    try {
      const { data, error } = await client.rpc('battle_stats_all', { p_game: game || null });
      if (error) throw error; return data || [];
    } catch (e) { return []; }
  }
  /* Žák: vlastní soubojový souhrn. */
  async function battleStatsMe(game) {
    if (!client || !user) return null;
    try {
      const { data, error } = await client.rpc('battle_stats_me', { p_game: game || null });
      if (error) throw error; return (data && data[0]) || null;
    } catch (e) { return null; }
  }
  /* Polling: zavolá cb(state) hned a pak každých intervalMs (default 1200).
     Vrací stop() funkci. Klient tím drží živý stav bez websocketů. */
  function pollBattle(battleId, cb, intervalMs) {
    let stopped = false, timer = null;
    async function tick() {
      if (stopped) return;
      const st = await battleState(battleId);
      if (!stopped && st && typeof cb === 'function') { try { cb(st); } catch (e) {} }
      if (!stopped) timer = setTimeout(tick, intervalMs || 1200);
    }
    tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }

  // ════════════ Fáze 11 — věž legend ════════════
  // Soutěžní výstup věží. Vstup hlídá SERVER (tower_eligible podle kohorty
  // třídy z Fáze 5). Vše graceful: bez clienta/přihlášení null/[]/false.
  async function towerEligible(game) {
    if (!client || !user) return false;
    try {
      const { data, error } = await client.rpc('tower_eligible', { p_game: game });
      if (error) throw error;
      return data === true;
    } catch (e) { console.warn('[RPGCloud] towerEligible:', e); return false; }
  }
  // odešle výsledek pokusu; vrací {ok, best} (best = nejlepší patro sezóny)
  async function towerSubmit(game, floor) {
    if (!client || !user || previewActive) return { ok: false };
    try {
      const { data, error } = await client.rpc('tower_submit',
        { p_game: game, p_floor: Math.max(0, Math.round(floor) || 0) });
      if (error) return { ok: false, error: error.message };
      return { ok: true, best: data };
    } catch (e) { return { ok: false, error: String(e) }; }
  }
  async function towerBoard(game) {
    if (!client || !user) return [];
    try {
      const { data, error } = await client.rpc('tower_board', { p_game: game });
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] towerBoard:', e); return []; }
  }
  async function towerHall(game) {
    if (!client || !user) return [];
    try {
      const { data, error } = await client.rpc('tower_hall_of_fame', { p_game: game });
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] towerHall:', e); return []; }
  }
  // konec školního roku: zapíše top 10 do síně slávy (jen učitel/superadmin)
  async function towerCloseSeason(game) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    try {
      const { data, error } = await client.rpc('tower_close_season', { p_game: game });
      if (error) return { ok: false, error: error.message };
      return { ok: true, count: data };
    } catch (e) { return { ok: false, error: String(e) }; }
  }
  // Fáze 12 — žebříček sezóny pro učitele (vč. user_id pro mazání). Jen STAFF.
  async function towerBoardAdmin(game) {
    if (!client || !isStaff()) return [];
    try {
      const { data, error } = await client.rpc('tower_board_admin', { p_game: game });
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[RPGCloud] towerBoardAdmin:', e); return []; }
  }
  // Fáze 12 — smazání žáka z žebříčku věže (aktuální sezóna). Jen STAFF.
  async function towerDeleteRun(userId, game) {
    if (!client || !isStaff()) return { ok: false, error: 'Nemáš oprávnění.' };
    try {
      const { data, error } = await client.rpc('tower_delete_run', { p_user_id: userId, p_game: game });
      if (error) return { ok: false, error: error.message };
      return { ok: true, count: data };
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  // centrální vykreslení žebříčku do prvku v mapě (žádné per-game edity).
  // Bez cloudu/preview → skryje. Bez přihlášení → teaser. Přihlášen → reálná data.
  async function renderLeaderboardInto(elId, game) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!client || previewActive) { el.style.display = 'none'; return; }
    const px = 'font-family:var(--px,monospace)';
    const header = '<div style="' + px + ';font-weight:700;font-size:12px;color:var(--gold,#19e6e6);margin-bottom:8px;letter-spacing:1px">— 🏆 ŽEBŘÍČEK TŘÍDY —</div>';
    if (!user) {
      const ghost = ['🥇 ████████  LV ?  ??? XP', '🥈 ██████  LV ?  ??? XP', '🥉 ███████  LV ?  ??? XP'];
      el.style.display = 'block';
      el.innerHTML = header +
        ghost.map(t => '<div style="' + px + ';font-size:13px;padding:5px 8px;border-radius:5px;background:rgba(255,255,255,.03);margin:3px 0;filter:blur(3.5px);user-select:none;color:var(--muted,#8895b5)">' + t + '</div>').join('') +
        '<div style="text-align:center;margin-top:10px;' + px + ';font-size:11px;color:var(--muted,#8895b5)">Přihlas se a zjisti pořadí ve třídě<br>' +
        '<button onclick="var b=document.getElementById(\'cloud-btn\');if(b)b.click();" style="margin-top:6px;cursor:pointer;' + px + ';font-weight:700;font-size:11px;padding:5px 10px;border-radius:4px;border:1px solid var(--blue,#5dc8f0);background:transparent;color:var(--blue,#5dc8f0)">🔑 Přihlásit</button></div>';
      return;
    }
    let rows = [];
    try { rows = await leaderboard(game); } catch (e) { el.style.display = 'none'; return; }
    // sám hráč bez spolužáků = jen 1 řádek (on sám) → nemá smysl ukazovat
    if (!rows || rows.length < 2) { el.style.display = 'none'; return; }
    const medal = i => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.');
    el.innerHTML = header +
      rows.map((r, i) =>
        '<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:5px;' +
        px + ';font-size:13px;margin:3px 0;' +
        (r.is_me ? 'background:rgba(25,230,230,.14);border:1px solid var(--gold,#19e6e6)' : 'background:rgba(255,255,255,.03)') + '">' +
        '<span style="min-width:26px;text-align:center">' + medal(i) + '</span>' +
        '<span style="flex:1;color:' + (r.is_me ? 'var(--gold,#19e6e6)' : 'var(--text,#e8eaf6)') + ';font-weight:700;' +
        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.display_name) + (r.is_me ? ' (ty)' : '') + '</span>' +
        '<span style="color:var(--muted,#8895b5);font-size:11px">LV ' + ((r.lvl || 1) | 0) + '</span>' +
        '<span style="color:var(--blue,#5dc8f0);min-width:62px;text-align:right">' + ((r.xp || 0) | 0) + ' XP</span>' +
        '</div>'
      ).join('');
    el.style.display = 'block';
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
      'background:var(--blue,#5dc8f0);color:#06101e">🔑 Přihlásit přes Google</button>' +
      '<span style="flex-basis:100%;height:0"></span>' +
      '<span style="font-size:11px;color:var(--muted,#8895b5)">Přihlášením souhlasíš se ' +
      '<a href="soukromi.html" target="_blank" style="color:var(--blue,#5dc8f0)">zásadami soukromí</a> a ' +
      '<a href="podminky.html" target="_blank" style="color:var(--blue,#5dc8f0)">podmínkami</a>.</span>';
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

  /* plovoucí widget „Vzkazy" — poznámky učitele pro přihlášeného žáka.
     Funguje ve všech hrách bez per-game úprav (volá se z attachGame). */
  function esc(s){return String(s==null?'':s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));}
  async function refreshNotesWidget() {
    if (previewActive || !user) return;
    let notes = [];
    try { notes = await pullMyNotes(); } catch (e) { return; }
    let btn = document.getElementById('rpg-notes-btn');
    if (!notes.length) { if (btn) btn.remove(); const p=document.getElementById('rpg-notes-panel'); if(p)p.remove(); return; }
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'rpg-notes-btn';
      btn.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9998;background:#19e6e6;color:#06101e;border:none;border-radius:22px;padding:10px 16px;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.4)';
      btn.onclick = () => {
        const p = document.getElementById('rpg-notes-panel');
        if (!p) return;
        const opening = (p.style.display === 'none');
        p.style.display = opening ? 'block' : 'none';
        if (opening) {                      // otevření panelu = přečteno
          markMyNotesRead().then(() => {
            const b = document.getElementById('rpg-notes-btn');
            if (b) b.style.background = '#19e6e6';   // shodit „nepřečteno" zvýraznění
            const dot = document.getElementById('rpg-notes-dot');
            if (dot) dot.remove();
          });
        }
      };
      document.body.appendChild(btn);
    }
    const unread = notes.filter(n => !n.read_at).length;
    btn.textContent = '📨 Vzkazy (' + notes.length + ')';
    btn.style.background = unread ? '#ffb020' : '#19e6e6';   // oranžová = něco nepřečteno
    let panel = document.getElementById('rpg-notes-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'rpg-notes-panel';
      panel.style.cssText = 'position:fixed;right:14px;bottom:62px;z-index:9998;width:min(340px,90vw);max-height:60vh;overflow:auto;background:#161b2e;color:#e8eaf6;border:1px solid #2b3350;border-radius:12px;padding:12px 14px;box-shadow:0 8px 28px rgba(0,0,0,.5);display:none;font-family:inherit';
      document.body.appendChild(panel);
    }
    panel.innerHTML = '<div style="font-weight:700;color:#19e6e6;margin-bottom:8px;font-size:14px">📨 Vzkazy od učitele</div>' +
      notes.map(n =>
        '<div data-note="' + esc(n.id) + '" style="background:#1f2740;border-radius:8px;padding:8px 10px;margin:6px 0' +
        (n.read_at ? '' : ';border-left:3px solid #ffb020') + '">' +
        '<div style="font-size:14px;line-height:1.5">' + esc(n.body) + '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:5px">' +
        '<span style="font-size:11px;color:#8896a6">' + esc(n.author_name || 'učitel') + ' · ' +
        esc(new Date(n.created_at).toLocaleDateString('cs-CZ')) + '</span>' +
        '<button class="rpg-note-del" data-del="' + esc(n.id) + '" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-size:13px;padding:2px 4px" title="smazat vzkaz">🗑</button>' +
        '</div></div>'
      ).join('');
    panel.querySelectorAll('.rpg-note-del').forEach(b => {
      b.onclick = async () => {
        const id = b.getAttribute('data-del');
        b.disabled = true;
        const r = await deleteMyNote(id);
        if (r.ok) refreshNotesWidget(); else b.disabled = false;
      };
    });
  }

  /* napojení pro jednotlivou hru: lišta + stažení postavy po přihlášení.
     Učitelský náhled přes URL: ?preview=1 (hraní nanečisto) nebo
     ?su=<user_id>&game=<KEY> (read-only pohled na postavu žáka). */
  // Spustí callback hned, když už DOM proběhl, jinak počká na DOMContentLoaded.
  // Nutné, protože hry teď volají attachGame z 'load' listeneru (defer) =>
  // DOMContentLoaded už mezitím proběhl a klasický listener by se nespustil.
  function onDomReady(cb) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cb);
    else cb();
  }

  function attachGame(saveKey, onLoaded) {
    const params  = new URLSearchParams(location.search);
    const preview = params.get('preview') === '1';
    const suId    = params.get('su');

    if (preview || suId) { previewActive = true; sandboxStorage(saveKey); }

    onDomReady(async () => {
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
          refreshNotesWidget();
          // žebříček na mapě (pokud hra má prvek #map-leaderboard a renderMap)
          if (typeof window.renderMap === 'function') { try { window.renderMap(); } catch (e) {} }
          const cloud = await pull(saveKey);
          let local = null;
          try { local = JSON.parse(localStorage.getItem(saveKey)); } catch {}
          const localDone = local && local.done ? Object.keys(local.done).length : 0;
          const cloudDone = cloud && cloud.done ? Object.keys(cloud.done).length : 0;

          // Vždy sluč teacherUnlocked z cloudu i lokálu — unlock nesmí být nikdy ztracen
          const tuSet = new Set([
            ...(Array.isArray(cloud && cloud.teacherUnlocked) ? cloud.teacherUnlocked : []),
            ...(Array.isArray(local && local.teacherUnlocked) ? local.teacherUnlocked : [])
          ]);
          const mergedTU = [...tuSet];

          let chosen = null;
          if (cloud && cloudDone >= localDone) {
            // cloud je stejně pokročilý nebo lepší → přepiš lokál
            if (mergedTU.length) cloud.teacherUnlocked = mergedTU;
            localStorage.setItem(saveKey, JSON.stringify(cloud));
            chosen = cloud;
            if (typeof onLoaded === 'function') onLoaded(cloud);
          } else if (local && localDone > 0) {
            // lokál je pokročilejší → nahraj ho do cloudu (s mergnutými unlocks)
            if (mergedTU.length) local.teacherUnlocked = mergedTU;
            localStorage.setItem(saveKey, JSON.stringify(local));
            push(saveKey, local);
            chosen = local;
          }

          // Předvyplnit #ni jménem z libovolného existujícího save (cross-game)
          const ni = document.getElementById('ni');
          if (ni && !ni.value) {
            const existingName = chosen && chosen.name ? chosen.name
              : ['RPG_MAT_6','RPG_MAT_7','RPG_MAT_8','RPG_MAT_9']
                  .map(k=>{ try{ const s=JSON.parse(localStorage.getItem(k)); return s&&s.name?s.name:null; }catch{return null;} })
                  .find(n=>n && n!=='HRDINA');
            if (existingName) ni.value = existingName;
          }

          // Doménový žák (@husovaliberec.cz): přeskočit intro obrazovku → rovnou do hry
          const isDomain = (u.email || '').toLowerCase().endsWith('@husovaliberec.cz');
          // Zjistit, zda hráč už hraje (není na intro obrazovce) — pokud ano, nepřerušovat
          const introVisible = (()=>{ const s=document.getElementById('s-intro'); return s&&s.classList.contains('active'); })();
          if (isDomain) {
            // Předvyplnit z Google jména, pokud ještě nic není
            if (ni && !ni.value) {
              const gFirst = ((u.user_metadata && u.user_metadata.full_name) || '').split(' ')[0];
              if (gFirst) ni.value = gFirst.toUpperCase().slice(0, 14);
            }
            if (!introVisible) {
              // Hráč je ve hře — pouze slouč teacherUnlocked, nerušit in-memory stav
              if (chosen && mergedTU.length && typeof window.S !== 'undefined') {
                window.S.teacherUnlocked = mergedTU;
                if (typeof window.saveS === 'function') window.saveS();
                if (typeof window.renderMap === 'function') { try { window.renderMap(); } catch (e) {} }
              }
            } else if (chosen && typeof window.continueGame === 'function') {
              window.continueGame();
            } else if (!chosen && typeof window.startGame === 'function') {
              // První přihlášení bez jakéhokoliv save — automaticky spustit
              window.startGame();
            }
          } else {
            // Nespravovaný účet: ukázat tlačítko Pokračovat
            if (chosen) {
              const cp = document.getElementById('continue-panel');
              if (cp) {
                cp.style.display = 'block';
                // Přihlášení přes Google = save v cloudu → nelze začít znovu bez ztráty dat
                const rb = document.getElementById('go-fresh-btn');
                if (rb) rb.style.display = 'none';
              }
            }
          }
        }
      });
      // Heartbeat: udržuje updated_at čerstvé + kontroluje teacherUnlocked ze serveru
      setInterval(async () => {
        try {
          if (!client || !currentUser()) return;
          const s = JSON.parse(localStorage.getItem(saveKey));
          if (!s) return;
          push(saveKey, s);
          // Stáhni aktuální save ze serveru a sluč teacherUnlocked
          const cloud = await pull(saveKey);
          if (!cloud) return;
          const localNow = (() => { try { return JSON.parse(localStorage.getItem(saveKey)); } catch { return null; } })();
          const tuSet = new Set([
            ...(Array.isArray(cloud.teacherUnlocked) ? cloud.teacherUnlocked : []),
            ...(Array.isArray(localNow && localNow.teacherUnlocked) ? localNow.teacherUnlocked : [])
          ]);
          if (tuSet.size === (Array.isArray(localNow && localNow.teacherUnlocked) ? localNow.teacherUnlocked.length : 0)) return;
          // Nové učitelské odemčení → aktualizuj in-memory stav + localStorage + překresli mapu
          const merged = [...tuSet];
          if (localNow) {
            localNow.teacherUnlocked = merged;
            localStorage.setItem(saveKey, JSON.stringify(localNow));
            // Aktualizuj i globální S (in-memory) aby mapa ihned reagovala
            if (typeof window.S !== 'undefined' && window.S) {
              window.S.teacherUnlocked = merged;
              if (typeof window.saveS === 'function') window.saveS();
            }
            if (typeof window.renderMap === 'function') { try { window.renderMap(); } catch (e) {} }
          }
        } catch {}
      }, 120000);
      init().then(paint);
    });
  }

  /* napojení pro hub: lišta + stažení všech postav a překreslení */
  function attachHub(games, rerender, mountSel) {
    onDomReady(() => {
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

  return { CONFIG, configured, init, login, logout, currentUser, getError,
           pull, push, syncWallet, onChange, attachGame, attachHub,
           // Fáze 2 — role a učitelská konzole
           getRole, isStaff, isAdmin, fetchRole, requireStaff,
           listAllSaves, pullSaveFor, updateSaveFor, deleteSaveFor,
           listRoles, upsertRole, deleteRole,
           // Fáze 3 — třídy a poznámky
           listClasses, createClass, renameClass, deleteClass, updateClassMeta,
           listMemberships, addToClass, removeFromClass,
           listNotesFor, addNote, deleteNote, deleteBroadcast, pullMyNotes,
           listMyBroadcasts, markMyNotesRead, deleteMyNote,
           // Fáze 4 — žebříček třídy
           leaderboard, renderLeaderboardInto,
           // Fáze 6 — vysvětlení postupu
           saveExplanation, listExplanations, deleteExplanation,
           // Fáze 6b — snímky chybovosti
           pushErrsSnap, getErrsSnaps,
           // Fáze 10 — zpětná vazba
           saveFeedback, listFeedback, deleteFeedback,
           // Fáze 7 — živý souboj
           createBattle, joinBattle, battleState, submitBattleAnswer,
           advanceBattle, setBattleStatus, listActiveBattles,
           inviteBattleEmail, myBattleInvites, pollBattle,
           // Fáze 13 — trvalá historie soubojů
           recordBattleResult, battleStatsAll, battleStatsMe,
           // Fáze 11 — věž legend
           towerEligible, towerSubmit, towerBoard, towerHall, towerCloseSeason,
           // Fáze 12 — věž legend: nástroje pro učitele
           towerBoardAdmin, towerDeleteRun };
})();
