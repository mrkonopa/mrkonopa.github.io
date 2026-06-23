/* ════════════════════════════════════════════════════════════════════
   RPG Matematika — ŽIVÝ SOUBOJ: UI (Kahoot-style overlay)

   Self-contained překryvné okno. Žádné per-game edity kromě:
     1) <script src="./rpg-battle-9.js"></script>   (banka otázek)
     2) <script src="./rpg-battle-ui.js"></script>  (toto)
     3) tlačítko volající RPGBattle.open({game, name})

   Závisí na: RPGCloud (Fáze 7 RPC wrappery) + RPG_BATTLE_9 (banka otázek).
   Graceful: bez přihlášení/cloudu/banky ukáže hlášku a nic nerozbije.

   Tok:
     HOST   → vytvoří místnost (kód) → lobby → ▶️ spustí → otázky → výsledky
     HRÁČ   → zadá kód → lobby → čeká → odpovídá → výsledky
   Host i hráč hrají; host navíc řídí posun otázek. Učitel (god mode) vidí
   všechny běžící souboje a může je ukončit.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var QSEC = 25;                 // sekund na otázku
  var COUNTDOWN_MS = 3000;       // délka odpočtu 3-2-1 (sdílená kotva startu)
  var NAME = 'HRDINA', GAME = 'RPG_MAT_9', BANK = null;
  var B = null;                  // aktuální stav souboje
  var root = null, timer = null;
  var onResult = null;           // callback z open() — module-level, ne uzávěr

  function cloud() { return (typeof RPGCloud !== 'undefined') ? RPGCloud : null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function reducedMotion() {
    try { if (typeof RPGWallet !== 'undefined' && RPGWallet.getReducedMotion) return !!RPGWallet.getReducedMotion(); } catch (e) {}
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  var SHAPES = ['▲', '◆', '●', '■'];

  // 3-2-1 odpočet zarovnaný na sdílený čas startu (target = wall-clock ms).
  // Všichni klienti skončí odpočet ve stejný okamžik → časomíra pak startuje na plných QSEC.
  function countdownTo(target, done) {
    var ov = document.createElement('div'); ov.id = 'rpgb-cd';
    var b = document.createElement('b'); ov.appendChild(b);
    document.body.appendChild(ov);
    var shown = null;
    (function tick() {
      var left = target - Date.now();
      if (left <= 0) { ov.remove(); done(); return; }
      var n = Math.ceil(left / 1000);
      if (n !== shown) {
        shown = n; b.textContent = n;
        if (!reducedMotion()) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
      }
      setTimeout(tick, 90);
    })();
  }

  // konfety pro výsledkovou obrazovku
  function confetti() {
    if (reducedMotion()) return;
    var old = document.getElementById('rpgb-conf'); if (old) old.remove();
    var box = document.createElement('div'); box.id = 'rpgb-conf';
    var cols = ['#e8475f', '#3b82f6', '#eab308', '#22c55e', '#19e6e6'];
    var html = '';
    for (var i = 0; i < 70; i++) {
      html += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] +
        ';animation-duration:' + (2 + Math.random() * 1.8).toFixed(2) + 's;animation-delay:' + (Math.random() * 0.6).toFixed(2) + 's"></i>';
    }
    box.innerHTML = html; document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 4200);
  }

  // ── jednorázové vložení stylů ──
  function injectCss() {
    if (document.getElementById('rpgb-css')) return;
    var css = document.createElement('style');
    css.id = 'rpgb-css';
    css.textContent =
      '#rpgb-ovl{position:fixed;inset:0;z-index:9999;background:rgba(5,8,16,.97);' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-family:var(--px,"Roboto Mono",monospace);padding:16px;overflow:auto}' +
      '#rpgb-card{background:var(--bg,#0a0e1a);border:2px solid var(--blue,#5dc8f0);' +
      'border-radius:14px;max-width:560px;width:100%;padding:22px;box-shadow:0 0 40px rgba(93,200,240,.25);' +
      'max-height:94vh;overflow:auto;color:var(--text,#e8eaf6)}' +
      '.rpgb-h{font-weight:700;font-size:18px;color:var(--gold,#19e6e6);letter-spacing:1px;' +
      'text-align:center;margin-bottom:6px}' +
      '.rpgb-sub{text-align:center;color:var(--muted,#8895b5);font-size:13px;margin-bottom:16px}' +
      '.rpgb-btn{display:block;width:100%;padding:13px;margin:8px 0;border-radius:9px;cursor:pointer;' +
      'font-family:inherit;font-weight:700;font-size:15px;border:2px solid var(--blue,#5dc8f0);' +
      'background:transparent;color:var(--blue,#5dc8f0);transition:.15s}' +
      '.rpgb-btn:hover{background:var(--blue,#5dc8f0);color:#06121a}' +
      '.rpgb-btn.go{border-color:var(--gold,#19e6e6);color:var(--gold,#19e6e6)}' +
      '.rpgb-btn.go:hover{background:var(--gold,#19e6e6);color:#06121a}' +
      '.rpgb-btn.sm{padding:8px 12px;font-size:13px;width:auto;display:inline-block;margin:4px}' +
      '.rpgb-btn.red{border-color:#ff6b6b;color:#ff6b6b}.rpgb-btn.red:hover{background:#ff6b6b;color:#fff}' +
      '.rpgb-code{font-size:42px;font-weight:700;letter-spacing:10px;text-align:center;' +
      'color:var(--gold,#19e6e6);background:rgba(25,230,230,.08);border-radius:10px;padding:14px;margin:10px 0}' +
      '.rpgb-in{width:100%;padding:12px;border-radius:9px;border:2px solid var(--line,#2a3450);' +
      'background:rgba(255,255,255,.04);color:var(--text,#e8eaf6);font-family:inherit;font-size:22px;' +
      'text-align:center;letter-spacing:8px;text-transform:uppercase;box-sizing:border-box}' +
      '.rpgb-ply{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;' +
      'background:rgba(255,255,255,.04);margin:4px 0;font-size:14px}' +
      '.rpgb-ply.me{border:1px solid var(--gold,#19e6e6);background:rgba(25,230,230,.12)}' +
      '.rpgb-q{font-size:20px;font-weight:700;line-height:1.4;text-align:center;margin:8px 0 16px;color:#fff}' +
      '.rpgb-ch{display:block;width:100%;padding:14px;margin:8px 0;border-radius:10px;cursor:pointer;' +
      'font-family:inherit;font-weight:700;font-size:17px;border:2px solid var(--line,#2a3450);' +
      'background:rgba(255,255,255,.04);color:var(--text,#e8eaf6);text-align:left;transition:.12s}' +
      '.rpgb-ch:hover:not(:disabled){border-color:var(--blue,#5dc8f0)}' +
      '.rpgb-ch:disabled{cursor:default;opacity:.85}' +
      '.rpgb-ch.ok{border-color:#4ade80;background:rgba(74,222,128,.18);color:#4ade80}' +
      '.rpgb-ch.bad{border-color:#ff6b6b;background:rgba(255,107,107,.18);color:#ff6b6b}' +
      '.rpgb-bar{height:8px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden;margin:6px 0 14px}' +
      '.rpgb-bar>i{display:block;height:100%;background:var(--gold,#19e6e6);' +
      'transform-origin:left center;transform:scaleX(1);transition:transform .25s linear}' +
      '.rpgb-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--muted,#8895b5);margin-bottom:8px}' +
      '.rpgb-hdr{display:flex;justify-content:flex-end;margin:0 -4px 4px}' +
      '.rpgb-x{font-size:22px;color:var(--muted,#8895b5);cursor:pointer;background:none;border:none;padding:2px 6px;line-height:1}' +
      // ── Kahoot dlaždice: 4 barvy + tvary ──
      '.rpgb-ch{display:flex;align-items:center;gap:10px}' +
      '.rpgb-sh{font-size:18px;line-height:1;flex:0 0 auto;opacity:.9}' +
      '.rpgb-ch.k0{border-color:#e8475f;background:rgba(232,71,95,.14)}.rpgb-ch.k0:hover:not(:disabled){border-color:#ff6b81;background:rgba(232,71,95,.24)}' +
      '.rpgb-ch.k1{border-color:#3b82f6;background:rgba(59,130,246,.14)}.rpgb-ch.k1:hover:not(:disabled){border-color:#60a5fa;background:rgba(59,130,246,.24)}' +
      '.rpgb-ch.k2{border-color:#eab308;background:rgba(234,179,8,.14)}.rpgb-ch.k2:hover:not(:disabled){border-color:#facc15;background:rgba(234,179,8,.24)}' +
      '.rpgb-ch.k3{border-color:#22c55e;background:rgba(34,197,94,.14)}.rpgb-ch.k3:hover:not(:disabled){border-color:#4ade80;background:rgba(34,197,94,.24)}' +
      // ok/bad přebijí barvu dlaždice
      '.rpgb-ch.ok{border-color:#4ade80!important;background:rgba(74,222,128,.22)!important;color:#4ade80}' +
      '.rpgb-ch.bad{border-color:#ff6b6b!important;background:rgba(255,107,107,.22)!important;color:#ff6b6b}' +
      // ── mezikolo: žebříček ──
      '.rpgb-stand{margin:10px 0 4px}' +
      '.rpgb-st{display:flex;align-items:center;gap:9px;padding:7px 11px;border-radius:8px;background:rgba(255,255,255,.04);' +
      'margin:5px 0;font-size:14px;transition:transform .35s ease,background .25s;border:1px solid transparent}' +
      '.rpgb-st.me{border-color:var(--gold,#19e6e6);background:rgba(25,230,230,.12)}' +
      '.rpgb-st .rk{min-width:26px;text-align:center;font-weight:700}' +
      '.rpgb-st .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}' +
      '.rpgb-st .sc{color:var(--gold,#19e6e6);min-width:62px;text-align:right;font-weight:700}' +
      '.rpgb-st .dl{font-size:12px;min-width:34px;text-align:right}' +
      // ── odpočet 3-2-1 ──
      '#rpgb-cd{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(5,8,16,.92)}' +
      '#rpgb-cd b{font-family:var(--px,"Roboto Mono",monospace);font-size:120px;font-weight:700;color:var(--gold,#19e6e6);' +
      'text-shadow:0 0 30px rgba(25,230,230,.6);animation:rpgb-pop .9s ease}' +
      '@keyframes rpgb-pop{0%{transform:scale(.3);opacity:0}40%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:.85}}' +
      // ── konfety ──
      '#rpgb-conf{position:fixed;inset:0;z-index:10001;pointer-events:none;overflow:hidden}' +
      '#rpgb-conf i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:rpgb-fall linear forwards}' +
      '@keyframes rpgb-fall{to{transform:translateY(105vh) rotate(720deg);opacity:.4}}' +
      // ── lobby hráč: jemný nástup ──
      '.rpgb-ply{animation:rpgb-in .25s ease}@keyframes rpgb-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}' +
      // ── pozvánky ──
      '.rpgb-invbox{border:1px dashed var(--gold,#19e6e6);border-radius:10px;padding:10px;margin:0 0 14px;background:rgba(25,230,230,.06)}' +
      '.rpgb-invh{font-size:12px;color:var(--gold,#19e6e6);text-align:center;margin-bottom:4px;letter-spacing:.5px}' +
      '.rpgb-btn.invite{width:100%;display:block;margin:6px 0 0;text-align:center}' +
      '.rpgb-invrow{display:flex;gap:8px;margin-top:10px}' +
      '.rpgb-in.sm{font-size:13px;letter-spacing:0;text-transform:none;text-align:left;padding:10px;flex:1;width:auto}' +
      '.rpgb-invmsg{font-size:12px;text-align:center;min-height:16px;margin-top:6px;color:var(--muted,#8895b5)}';
    document.head.appendChild(css);
  }

  function shell(inner) {
    root.innerHTML = '<div id="rpgb-card">' +
      '<div class="rpgb-hdr"><button class="rpgb-x" onclick="RPGBattle.close()" title="zavřít">✕</button></div>' +
      inner + '</div>';
  }

  // ════════════ VSTUP ════════════
  function open(opts) {
    opts = opts || {};
    NAME = opts.name || NAME;
    onResult = opts.onResult || null;
    GAME = opts.game || GAME;
    BANK = opts.bank || window['RPG_BATTLE_' + (GAME.replace('RPG_MAT_', ''))] || null;
    injectCss();
    if (!root) { root = document.createElement('div'); root.id = 'rpgb-ovl'; document.body.appendChild(root); }
    root.style.display = 'flex';
    var c = cloud();
    if (!c || !c.currentUser || !c.currentUser()) {
      shell('<div class="rpgb-h">⚔️ ŽIVÝ SOUBOJ</div>' +
        '<div class="rpgb-sub">Pro živý souboj se musíš přihlásit školním účtem.</div>' +
        '<button class="rpgb-btn go" onclick="RPGBattle.close();var b=document.getElementById(\'cloud-btn\');if(b)b.click();">🔑 Přihlásit se</button>');
      return;
    }
    if (Array.isArray(BANK)) BANK = mergeBank(BANK);
    if (!BANK || typeof BANK.build !== 'function') {
      shell('<div class="rpgb-h">⚔️ ŽIVÝ SOUBOJ</div>' +
        '<div class="rpgb-sub">Banka otázek se nenačetla. Zkus obnovit stránku.</div>');
      return;
    }
    if (opts.autoAction === 'host') { hostUI(); return; }
    if (opts.autoAction === 'join') { joinUI(); return; }
    renderMenu();
  }

  function mulberry32(a) {
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function mergeBank(banks) {
    return {
      build: function (seed, count) {
        var pool = [];
        banks.forEach(function (b, i) {
          if (b && typeof b.build === 'function') {
            var qs = b.build(seed ^ (i * 0x1F3D7), Math.min(40, count * 4));
            if (qs) pool = pool.concat(qs);
          }
        });
        var rng = mulberry32(seed);
        for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
        return pool.slice(0, Math.min(count, pool.length));
      }
    };
  }

  function renderMenu() {
    stopPoll();
    var c = cloud();
    var teacher = c && c.isStaff && c.isStaff();
    var inner = '<div class="rpgb-h">⚔️ ŽIVÝ SOUBOJ</div>' +
      '<div class="rpgb-sub">Rychlé matematické klání ve třídě — kdo nasbírá nejvíc bodů?</div>' +
      '<div id="rpgb-invites"></div>' +
      '<button class="rpgb-btn go" onclick="RPGBattle._host()">🎮 Založit souboj</button>' +
      '<button class="rpgb-btn" onclick="RPGBattle._joinUI()">🔑 Připojit se kódem</button>';
    if (teacher) inner += '<button class="rpgb-btn sm" style="display:block;width:100%;margin-top:14px" onclick="RPGBattle._active()">👁️ Běžící souboje (učitel)</button>';
    shell(inner);
    loadInvites();
  }

  // Načte pozvánky přihlášeného žáka a vloží je nad tlačítka (graceful, async).
  function loadInvites() {
    var c = cloud(); if (!c || !c.myBattleInvites) return;
    c.myBattleInvites().then(function (list) {
      var box = document.getElementById('rpgb-invites'); if (!box) return;
      var mine = (list || []).filter(function (iv) { return iv.game === GAME && iv.status === 'lobby'; });
      if (!mine.length) { box.innerHTML = ''; return; }
      box.innerHTML = '<div class="rpgb-invbox"><div class="rpgb-invh">📨 Máš pozvánku do souboje</div>' +
        mine.map(function (iv) {
          return '<button class="rpgb-btn sm invite" onclick="RPGBattle._joinCode(\'' + esc(iv.code) + '\')">' +
            '▶️ ' + esc(iv.host_name || 'Spolužák') + ' · kód ' + esc(iv.code) + '</button>';
        }).join('') + '</div>';
    }).catch(function () {});
  }

  // Připojení přímo daným kódem (z pozvánky), bez ručního zadávání.
  function joinCode(code) {
    var c = cloud(); if (!c) return;
    shell('<div class="rpgb-sub">Připojuji…</div>');
    c.joinBattle(code, NAME).then(function (b) {
      if (!b || !b.id) { renderMenu(); return; }
      B = { id: b.id, code: b.code, role: 'player', teamMode: !!(b.team_mode), questions: null, lastQi: -2, picked: -1, locked: false };
      startPoll();
    }).catch(function () { renderMenu(); });
  }

  // ════════════ HOST: režim + výběr počtu otázek ════════════
  var HTEAM = false;                 // zvolený režim hosta: false = sólo, true = týmy
  function setMode(team) { HTEAM = !!team; hostUI(); }
  function hostUI() {
    shell('<div class="rpgb-h">🎮 Nový souboj</div>' +
      '<div class="rpgb-sub">Režim klání:</div>' +
      '<div style="display:flex;gap:8px;margin:6px 0 14px">' +
      '<button class="rpgb-btn sm' + (HTEAM ? '' : ' go') + '" style="flex:1;margin:0" onclick="RPGBattle._mode(0)">🙋 Každý sám</button>' +
      '<button class="rpgb-btn sm' + (HTEAM ? ' go' : '') + '" style="flex:1;margin:0" onclick="RPGBattle._mode(1)">🛡️ Týmy (modří vs. červení)</button>' +
      '</div>' +
      '<div class="rpgb-sub">Kolik otázek? Všichni dostanou stejné.</div>' +
      '<div style="text-align:center;margin:10px 0">' +
      [5, 10, 15, 20].map(function (n) {
        return '<button class="rpgb-btn sm" onclick="RPGBattle._create(' + n + ')">' + n + ' otázek</button>';
      }).join('') + '</div>' +
      '<button class="rpgb-btn sm" style="display:block;width:100%;margin-top:10px" onclick="RPGBattle._menu()">← zpět</button>');
  }

  function createRoom(count) {
    var c = cloud(); if (!c) return;
    shell('<div class="rpgb-sub">Zakládám místnost…</div>');
    c.createBattle(GAME, count, NAME, HTEAM).then(function (b) {
      if (!b || !b.id) {
        var errMsg = (b && b.error) ? esc(b.error) : 'Zkus to znovu nebo obnov stránku.';
        shell('<div class="rpgb-h">❌ Chyba</div>' +
          '<div class="rpgb-sub">Nepodařilo se založit souboj.<br><small style="color:#ff6b6b">' + errMsg + '</small></div>' +
          '<button class="rpgb-btn sm" style="display:block;width:100%" onclick="RPGBattle._menu()">← zpět</button>');
        return;
      }
      B = { id: b.id, code: b.code, role: 'host', questions: null, lastQi: -2, picked: -1, locked: false, teamMode: !!b.team_mode };
      startPoll();
    }).catch(function (err) {
      shell('<div class="rpgb-h">❌ Chyba</div>' +
        '<div class="rpgb-sub"><small style="color:#ff6b6b">' + esc(String(err)) + '</small></div>' +
        '<button class="rpgb-btn sm" style="display:block;width:100%" onclick="RPGBattle._menu()">← zpět</button>');
    });
  }

  // ════════════ JOIN ════════════
  function joinUI() {
    shell('<div class="rpgb-h">🔑 Připojit se</div>' +
      '<div class="rpgb-sub">Zadej 4-místný kód od učitele/spolužáka.</div>' +
      '<input class="rpgb-in" id="rpgb-codein" maxlength="4" autocomplete="off" placeholder="••••">' +
      '<button class="rpgb-btn go" style="margin-top:14px" onclick="RPGBattle._join()">Připojit</button>' +
      '<button class="rpgb-btn sm" style="display:block;width:100%" onclick="RPGBattle._menu()">← zpět</button>');
    var i = document.getElementById('rpgb-codein'); if (i) { i.focus(); i.addEventListener('keydown', function (e) { if (e.key === 'Enter') joinRoom(); }); }
  }
  function joinRoom() {
    var c = cloud(); if (!c) return;
    var el = document.getElementById('rpgb-codein');
    var code = (el && el.value || '').trim().toUpperCase();
    if (code.length < 3) { if (el) el.style.borderColor = '#ff6b6b'; return; }
    shell('<div class="rpgb-sub">Připojuji…</div>');
    c.joinBattle(code, NAME).then(function (b) {
      if (!b || !b.id) { joinUI(); var e2 = document.getElementById('rpgb-codein'); if (e2) { e2.value = code; e2.style.borderColor = '#ff6b6b'; } return; }
      B = { id: b.id, code: b.code, role: 'player', questions: null, lastQi: -2, picked: -1, locked: false };
      startPoll();
    });
  }

  // ════════════ POLLING ════════════
  function startPoll() {
    stopPoll();
    var c = cloud(); if (!c) return;
    B.stop = c.pollBattle(B.id, onState, 1200);
  }
  function stopPoll() {
    if (B && B.stop) { B.stop(); B.stop = null; }
    if (timer) { clearInterval(timer); timer = null; }
  }

  function onState(st) {
    if (!B || !st || !st.battle) return;
    B.state = st;
    var bt = st.battle;
    if (typeof bt.team_mode !== 'undefined') B.teamMode = !!bt.team_mode;
    // odveta: místnost se vrátila do lobby → vyrob novou sadu otázek a vynuluj klientské příznaky kola
    if (bt.status === 'lobby' && B.lastQi !== -2) {
      B.questions = null; B.lastQi = -2; B.didCountdown = false;
      B.recorded = false; B.celebrated = false; B.resultSent = false; B.rankPrev = null; B.lastLobbyKey = null;
    }
    if (!B.questions && bt.q_seed != null) B.questions = BANK.build(Number(bt.q_seed), bt.q_count);
    if (bt.status === 'lobby') renderLobby(st);
    else if (bt.status === 'finished') renderResults(st);
    else {
      // start souboje: 3-2-1 odpočet zarovnaný na q_started_at (synchronní napříč hráči)
      if (bt.q_index === 0 && !B.didCountdown) {
        B.didCountdown = true;
        snapCorrect(st);                       // výchozí snímek pro přehled odpovědí
        var t0 = (bt.q_started_at ? new Date(bt.q_started_at).getTime() : Date.now()) + COUNTDOWN_MS;
        countdownTo(t0, function () { if (B && B.state) renderQuestion(B.state); });
        return;
      }
      renderQuestion(st);   // active / paused
    }
  }

  // snímek dosažených správných odpovědí na začátku otázky (host přehled)
  function snapCorrect(st) {
    B.snap = {};
    (st.players || []).forEach(function (p) { B.snap[p.user_id] = p.correct_count || 0; });
  }

  // ════════════ LOBBY ════════════
  function renderLobby(st) {
    var players = st.players || [];
    // Klíč = seznam jmen; změna = přibyl/odebral hráč → plný re-render
    var pKey = players.map(function (p) { return p.user_id; }).sort().join(',');
    if (B.lastLobbyKey === pKey && document.getElementById('rpgb-plycount')) {
      // pouze aktualizuj počet a stav tlačítka, bez DOM bourání
      var cnt = document.getElementById('rpgb-plycount');
      if (cnt) cnt.textContent = players.length;
      var btn = document.getElementById('rpgb-startbtn');
      if (btn) btn.disabled = players.length < 1;
      return;
    }
    B.lastLobbyKey = pKey;
    var plyHtml;
    if (B.teamMode) {
      // dvě kolonky: modří (0) vs. červení (1)
      var t0 = players.filter(function (p) { return p.team === 0; });
      var t1 = players.filter(function (p) { return p.team === 1; });
      var col = function (arr, color, name) {
        return '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px;color:' + color + ';margin-bottom:4px">' + name + ' (' + arr.length + ')</div>' +
          arr.map(function (p) {
            return '<div class="rpgb-ply' + (p.user_id === st.me ? ' me' : '') + '" style="border-left:3px solid ' + color + '">' + esc(p.display_name) + (p.user_id === st.me ? ' (ty)' : '') + '</div>';
          }).join('') + '</div>';
      };
      plyHtml = '<div class="rpgb-row"><span>HRÁČI</span><span id="rpgb-plycount">' + players.length + '</span></div>' +
        '<div style="display:flex;gap:10px">' + col(t0, '#3b82f6', '🔵 Modří') + col(t1, '#e8475f', '🔴 Červení') + '</div>';
    } else {
      plyHtml = '<div class="rpgb-row"><span>HRÁČI</span><span id="rpgb-plycount">' + players.length + '</span></div>' +
        players.map(function (p) {
          return '<div class="rpgb-ply' + (p.user_id === st.me ? ' me' : '') + '">👤 ' + esc(p.display_name) + (p.user_id === st.me ? ' (ty)' : '') + '</div>';
        }).join('');
    }
    var inner = '<div class="rpgb-h">⏳ Čekárna</div>' +
      '<div class="rpgb-sub">' + (B.role === 'host' ? 'Nadiktuj kód spolužákům. Až se sejdou, spusť.' : 'Čekej, až host spustí souboj.') +
      (B.teamMode ? ' <b style="color:var(--gold,#19e6e6)">Týmový režim</b> — nováčci se přidají do menšího týmu.' : '') + '</div>' +
      '<div class="rpgb-code">' + esc(B.code) + '</div>' + plyHtml;
    if (B.role === 'host') {
      inner += '<button id="rpgb-startbtn" class="rpgb-btn go" style="margin-top:16px"' + (players.length < 1 ? ' disabled' : '') +
        ' onclick="RPGBattle._start()">▶️ Spustit souboj</button>' +
        '<div class="rpgb-invrow">' +
        '<input class="rpgb-in sm" id="rpgb-invmail" type="email" autocomplete="off" spellcheck="false" placeholder="spolužák@husovaliberec.cz" oninput="RPGBattle._invDraft(this.value)">' +
        '<button class="rpgb-btn sm" onclick="RPGBattle._invite()">📨 Pozvat</button></div>' +
        '<div id="rpgb-invmsg" class="rpgb-invmsg"></div>';
    }
    inner += '<button class="rpgb-btn sm red" style="display:block;width:100%" onclick="RPGBattle._leave()">' +
      (B.role === 'host' ? '✕ Zrušit místnost' : '← Odejít') + '</button>';
    shell(inner);
    if (B.role === 'host') {
      var im = document.getElementById('rpgb-invmail');
      if (im && B._invDraft) im.value = B._invDraft;   // přežij re-render při příchodu hráče
    }
  }

  function invDraft(v) { if (B) B._invDraft = v; }

  // Host pozve spolužáka e-mailem (backend RPC invite_battle_email).
  function invite() {
    var c = cloud(); if (!c || !B || !c.inviteBattleEmail) return;
    var el = document.getElementById('rpgb-invmail');
    var msg = document.getElementById('rpgb-invmsg');
    var email = (el && el.value || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { if (el) el.style.borderColor = '#ff6b6b'; return; }
    if (el) el.style.borderColor = '';
    if (msg) { msg.textContent = 'Posílám…'; msg.style.color = ''; }
    c.inviteBattleEmail(B.id, email).then(function (ok) {
      if (msg) { msg.textContent = ok ? '✓ Pozvánka odeslána: ' + email : '✗ Pozvánku se nepodařilo odeslat'; msg.style.color = ok ? '#4ade80' : '#ff6b6b'; }
      if (ok && el) { el.value = ''; B._invDraft = ''; }
    });
  }

  function startBattle() {
    var c = cloud(); if (!c || !B) return;
    c.advanceBattle(B.id, 0);   // q_index=0 + status=active
  }

  // ════════════ OTÁZKA ════════════
  function renderQuestion(st) {
    var bt = st.battle, qi = bt.q_index;
    if (qi < 0 || !B.questions || qi >= B.questions.length) {
      shell('<div class="rpgb-sub">Připravuji otázku…</div>'); return;
    }
    // plný re-render jen při změně otázky (jinak by se ztratil výběr)
    if (qi !== B.lastQi) {
      if (qi !== 0) snapCorrect(st);    // nová otázka → nový snímek pro přehled (q0 už máme z odpočtu)
      B.lastQi = qi; B.picked = -1; B.locked = (bt.status === 'paused');
      var q = B.questions[qi];
      var inner = '<div class="rpgb-row"><span>OTÁZKA ' + (qi + 1) + ' / ' + bt.q_count + '</span>' +
        '<span id="rpgb-ans">·</span></div>' +
        '<div class="rpgb-bar"><i id="rpgb-time" style="transform:scaleX(1)"></i></div>' +
        '<div class="rpgb-q">' + esc(q.text) + '</div>' +
        '<div id="rpgb-choices">' +
        q.choices.map(function (ch, i) {
          return '<button class="rpgb-ch k' + (i % 4) + '" id="rpgb-c' + i + '" onclick="RPGBattle._pick(' + i + ')">' +
            '<span class="rpgb-sh">' + SHAPES[i % 4] + '</span><span>' + esc(ch) + '</span></button>';
        }).join('') + '</div>' +
        '<div id="rpgb-fb" style="text-align:center;font-weight:700;min-height:22px;margin-top:6px"></div>' +
        '<div id="rpgb-stand" class="rpgb-stand"></div>';
      if (B.role === 'host') {
        inner += '<div style="display:flex;gap:8px;margin-top:12px">' +
          '<button class="rpgb-btn go sm" style="flex:1" onclick="RPGBattle._next()">' +
          (qi + 1 >= bt.q_count ? '🏁 Ukončit' : '▶️ Další otázka') + '</button>' +
          '<button class="rpgb-btn sm red" onclick="RPGBattle._leave()">■</button></div>';
      }
      shell(inner);
      B.deadline = (bt.q_started_at ? new Date(bt.q_started_at).getTime() : Date.now()) + (qi === 0 ? COUNTDOWN_MS : 0) + QSEC * 1000;
      tickStart();
    }
    // lehká aktualizace přehledu odpovědí (host vidí správně/špatně živě)
    var pls = st.players || [];
    var answered = pls.filter(function (p) { return p.last_qi >= qi; });
    var ansEl = document.getElementById('rpgb-ans');
    if (ansEl) {
      if (B.role === 'host' && B.snap) {
        var corr = answered.filter(function (p) { return (p.correct_count || 0) > (B.snap[p.user_id] || 0); }).length;
        ansEl.innerHTML = '<span style="color:#4ade80">✓' + corr + '</span> ' +
          '<span style="color:#ff6b6b">✗' + (answered.length - corr) + '</span> · ' + answered.length + '/' + pls.length;
      } else {
        ansEl.textContent = '✓ ' + answered.length + '/' + pls.length;
      }
    }
    // mezikolo: jakmile jsem odpověděl/vypršel čas, ukaž živý žebříček
    if (B.locked) renderStandings(st);
  }

  // týmové skóre (jen v týmovém režimu) — modří vs. červení s poměrovým pruhem
  function teamScoreBar(st) {
    if (!B.teamMode || !st.teams) return '';
    var s0 = Number(st.teams['0'] || 0), s1 = Number(st.teams['1'] || 0), sum = s0 + s1;
    var p0 = sum ? Math.round(100 * s0 / sum) : 50;
    return '<div style="margin:2px 0 10px">' +
      '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:3px">' +
      '<span style="color:#3b82f6">🔵 ' + s0 + '</span><span style="color:#e8475f">' + s1 + ' 🔴</span></div>' +
      '<div style="height:10px;border-radius:5px;overflow:hidden;display:flex;background:#e8475f">' +
      '<i style="display:block;height:100%;width:' + p0 + '%;background:#3b82f6"></i></div></div>';
  }

  // průběžný žebříček (top 5 + já), animovaný posun pořadí přes CSS transition
  function renderStandings(st) {
    var el = document.getElementById('rpgb-stand'); if (!el) return;
    var ranked = (st.players || []).slice().sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    var meIdx = ranked.findIndex(function (p) { return p.user_id === st.me; });
    var show = ranked.slice(0, 5);
    if (meIdx >= 5) show.push(ranked[meIdx]);   // přilep „mě", když jsem mimo top 5
    var medal = function (i) { return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'; };
    el.innerHTML = teamScoreBar(st) + '<div class="rpgb-row" style="margin-bottom:2px"><span>PRŮBĚŽNÉ POŘADÍ</span><span></span></div>' +
      show.map(function (p) {
        var i = ranked.indexOf(p);
        var up = B.rankPrev && B.rankPrev[p.user_id] != null && B.rankPrev[p.user_id] > i;
        var dn = B.rankPrev && B.rankPrev[p.user_id] != null && B.rankPrev[p.user_id] < i;
        return '<div class="rpgb-st' + (p.user_id === st.me ? ' me' : '') + '">' +
          '<span class="rk">' + medal(i) + '</span>' +
          '<span class="nm">' + esc(p.display_name) + (p.user_id === st.me ? ' (ty)' : '') + '</span>' +
          '<span class="dl">' + (up ? '<span style="color:#4ade80">▲</span>' : dn ? '<span style="color:#ff6b6b">▼</span>' : '') + '</span>' +
          '<span class="sc">' + (p.score || 0) + '</span></div>';
      }).join('');
    // zapamatuj pořadí pro příští šipky
    B.rankPrev = {}; ranked.forEach(function (p, i) { B.rankPrev[p.user_id] = i; });
  }

  function tickStart() {
    if (timer) clearInterval(timer);
    timer = setInterval(function () {
      var left = Math.max(0, B.deadline - Date.now());
      var bar = document.getElementById('rpgb-time');
      if (bar) bar.style.transform = 'scaleX(' + (left / (QSEC * 1000)).toFixed(3) + ')';
      if (left <= 0) {
        clearInterval(timer); timer = null;
        if (!B.locked) lockChoices(false);   // čas vypršel bez odpovědi
      }
    }, 200);
  }

  function pick(idx) {
    if (!B || B.locked) return;
    var qi = B.lastQi, q = B.questions[qi];
    var correct = (idx === q.correct);
    var left = Math.max(0, B.deadline - Date.now());
    var pts = correct ? Math.round(500 + 1000 * (left / (QSEC * 1000))) : 0;
    B.picked = idx; B.locked = true;
    if (timer) { clearInterval(timer); timer = null; }
    var c = cloud(); if (c) c.submitBattleAnswer(B.id, qi, correct, pts);
    lockChoices(true);
    var fb = document.getElementById('rpgb-fb');
    if (fb) { fb.textContent = correct ? '✓ Správně! +' + pts : '✗ Špatně'; fb.style.color = correct ? '#4ade80' : '#ff6b6b'; }
    if (B.state) renderStandings(B.state);
  }

  // odhalí správnou (zeleně) a případně chybný výběr (červeně)
  function lockChoices(revealPick) {
    B.locked = true;
    var qi = B.lastQi, q = B.questions[qi];
    for (var i = 0; i < q.choices.length; i++) {
      var el = document.getElementById('rpgb-c' + i); if (!el) continue;
      el.disabled = true;
      if (i === q.correct) el.classList.add('ok');
      else if (revealPick && i === B.picked) el.classList.add('bad');
    }
  }

  function nextQuestion() {
    var c = cloud(); if (!c || !B || !B.state) return;
    c.advanceBattle(B.id, B.state.battle.q_index + 1);
  }

  // ════════════ VÝSLEDKY ════════════
  function renderResults(st) {
    // Pozn.: polling NEzastavujeme — host může spustit odvetu a ostatní
    // klienti tak sami spadnou zpět do lobby (rematch_battle resetuje místnost).
    // Trvalá historie (Fáze 13): každý hráč zapíše vlastní výsledek (jednou).
    var c0 = cloud();
    if (c0 && c0.recordBattleResult && B && B.id && !B.recorded) {
      B.recorded = true;
      try { c0.recordBattleResult(B.id); } catch (e) {}
    }
    var players = (st.players || []).slice().sort(function (a, b) { return b.score - a.score; });
    var medal = function (i) { return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'; };
    // týmový vítěz (banner nahoře)
    var teamBanner = '';
    if (B.teamMode && st.teams) {
      var s0 = Number(st.teams['0'] || 0), s1 = Number(st.teams['1'] || 0);
      var win = s0 === s1 ? 'remíza' : (s0 > s1 ? '🔵 Vyhráli modří!' : '🔴 Vyhráli červení!');
      teamBanner = '<div style="text-align:center;font-weight:700;font-size:17px;margin:4px 0 8px;color:' +
        (s0 === s1 ? 'var(--gold,#19e6e6)' : (s0 > s1 ? '#3b82f6' : '#e8475f')) + '">' + win +
        ' <span style="color:var(--muted,#8895b5);font-size:13px">(' + s0 + ' : ' + s1 + ')</span></div>';
    }
    var inner = '<div class="rpgb-h">🏁 Konec souboje</div>' +
      '<div class="rpgb-sub">Výsledková listina</div>' + teamBanner +
      players.map(function (p, i) {
        var tc = p.team === 0 ? '#3b82f6' : p.team === 1 ? '#e8475f' : '';
        return '<div class="rpgb-ply' + (p.user_id === st.me ? ' me' : '') + '"' + (tc ? ' style="border-left:3px solid ' + tc + '"' : '') + '>' +
          '<span style="min-width:30px">' + medal(i) + '</span>' +
          '<span style="flex:1;font-weight:700">' + esc(p.display_name) + (p.user_id === st.me ? ' (ty)' : '') + '</span>' +
          '<span style="color:var(--muted,#8895b5);font-size:12px">' + (p.correct_count || 0) + '✓</span>' +
          '<span style="color:var(--gold,#19e6e6);min-width:64px;text-align:right">' + (p.score || 0) + '</span></div>';
      }).join('');
    if (B.role === 'host') {
      inner += '<button class="rpgb-btn go" style="margin-top:16px" onclick="RPGBattle._rematch()">🔁 Odveta (stejní hráči)</button>' +
        '<button class="rpgb-btn sm" style="display:block;width:100%" onclick="RPGBattle._menu()">⚔️ Nový souboj</button>';
    } else {
      inner += '<div class="rpgb-sub" style="margin-top:14px">Host může spustit odvetu — počkej, nebo se vrať do menu.</div>' +
        '<button class="rpgb-btn sm" style="display:block;width:100%" onclick="RPGBattle._menu()">⚔️ Nový souboj</button>';
    }
    inner += '<button class="rpgb-btn sm" style="display:block;width:100%" onclick="RPGBattle.close()">Zavřít</button>';
    shell(inner);
    // konfety, když jsem skončil na bedně (1.–3.) — jen jednou
    var myRank = players.findIndex(function (p) { return p.user_id === st.me; });
    if (!B.celebrated && myRank >= 0 && myRank < 3) { B.celebrated = true; confetti(); }
    // Odměny: zavolej hru zpět s výsledky (jednou; XP/kredity/odznaky řeší hra)
    if (B && !B.resultSent && typeof onResult === 'function') {
      B.resultSent = true;
      var me = st.me;
      var myRow = (st.players || []).find(function (p) { return p.user_id === me; });
      var rank = players.findIndex(function (p) { return p.user_id === me; }) + 1;
      try {
        onResult({
          rank: rank || players.length,       // 1 = vítěz
          total: players.length,
          correct: myRow ? (myRow.correct_count || 0) : 0,
          score:   myRow ? (myRow.score || 0) : 0,
          q_count: (st.battle && st.battle.q_count) || 10
        });
      } catch (e) {}
    }
  }

  // ════════════ UČITEL: běžící souboje ════════════
  function activeUI() {
    var c = cloud(); if (!c) return;
    shell('<div class="rpgb-sub">Načítám běžící souboje…</div>');
    c.listActiveBattles().then(function (list) {
      var inner = '<div class="rpgb-h">👁️ Běžící souboje</div>';
      if (!list || !list.length) inner += '<div class="rpgb-sub">Žádný běžící souboj.</div>';
      else inner += '<div class="rpgb-sub">Můžeš kterýkoli ukončit.</div>' + list.map(function (b) {
        return '<div class="rpgb-ply"><span style="flex:1"><b style="color:var(--gold,#19e6e6)">' + esc(b.code) + '</b> · ' +
          esc(b.host_name || '?') + ' · ' + b.players + ' hr. · ' + esc(b.status) + '</span>' +
          '<button class="rpgb-btn sm red" onclick="RPGBattle._kill(\'' + esc(b.id) + '\')">ukončit</button></div>';
      }).join('');
      inner += '<button class="rpgb-btn sm" style="display:block;width:100%;margin-top:12px" onclick="RPGBattle._menu()">← zpět</button>';
      shell(inner);
    });
  }
  function kill(id) {
    var c = cloud(); if (!c) return;
    c.setBattleStatus(id, 'finished').then(function () { activeUI(); });
  }

  // ════════════ ODVETA (host) ════════════
  function rematch() {
    var c = cloud(); if (!c || !B || !c.rematchBattle) return;
    // reset klientského stavu — poll pak ukáže lobby (i ostatním hráčům)
    B.recorded = false; B.didCountdown = false; B.lastQi = -2;
    B.celebrated = false; B.resultSent = false; B.rankPrev = null;
    B.lastLobbyKey = null; B.questions = null;
    if (!B.stop) startPoll();       // pojistka, kdyby polling neběžel
    c.rematchBattle(B.id);
  }

  function leave() {
    var c = cloud();
    if (B && B.role === 'host' && c) c.setBattleStatus(B.id, 'finished');
    stopPoll(); B = null; renderMenu();
  }

  function close() {
    stopPoll();
    if (B && B.role === 'host') { var c = cloud(); if (c) c.setBattleStatus(B.id, 'finished'); }
    B = null;
    if (root) root.style.display = 'none';
  }

  window.RPGBattle = {
    open: open, close: close,
    _menu: renderMenu, _host: hostUI, _mode: setMode, _create: createRoom,
    _joinUI: joinUI, _join: joinRoom, _start: startBattle,
    _pick: pick, _next: nextQuestion, _leave: leave,
    _active: activeUI, _kill: kill, _rematch: rematch,
    _joinCode: joinCode, _invite: invite, _invDraft: invDraft
  };
})();
