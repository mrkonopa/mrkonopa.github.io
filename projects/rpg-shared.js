/* ══════════════════════════════════════════════════════════════════
   RPG Matematika — SDÍLENÉ FUNKCE (jediný zdroj pravdy pro všechny 4 hry)

   Sem patří funkce, které byly dřív zkopírované v rpg-mat-6/7/8/9.html
   a hrozil jejich drift (oprava v jedné hře, zapomenutá ve třech).
   Načítá se na konci <body> — všechna volání jsou event-driven (boj,
   trénink), takže v době volání už funkce existují.
   ══════════════════════════════════════════════════════════════════ */

/* Kontrola odpovědi žáka proti správnému výsledku.
   Normalizace: bez diakritiky/mezer, "," → ".", Unicode minus (−)
   i en-dash (–) → "-". Zlomky "a/b" se vyhodnotí číselně.
   Tolerance 0.016 ≈ 1/60: pokryje zaokrouhlení na 2 desetinná místa
   i periodické zlomky (1/3, 1/6…). */
function checkAns(raw, correct){
 const norm = s => String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'').replace(/,/g,'.').replace(/[−–]/g,'-');
 const u = norm(raw), c = norm(correct);
 if(u===c) return true;
 const evalS = s => {
 if(/^-?\d+\/-?\d+$/.test(s)){const[a,b]=s.split('/');return parseFloat(a)/parseFloat(b);}
 return parseFloat(s);
 };
 const un=evalS(u), cn=evalS(c);
 if(!isNaN(un)&&!isNaN(cn)) return Math.abs(un-cn)<0.016;
 return false;
}

/* ANO/NE úlohy: místo psaní rovnou dvě tlačítka (boj i trénink).
   submitAnswer/trSubmit jsou definované ve hře — volají se až po kliku. */
function isYN(t){return !!t&&/^(ano|ne)$/i.test(String(t.ans||'').trim());}
function answerYN(v){const i=document.getElementById('bt-ans');if(i.disabled)return;i.value=v;submitAnswer();}
function trAnswerYN(v){const i=document.getElementById('tr-ans');if(i.disabled)return;i.value=v;trSubmit();}

/* ══════════════════════════════════════════════════════════════════
   RPGSound — syntetizované zvuky (WebAudio, žádné soubory).
   • Default VYPNUTO (stav v RPGWallet.settings.soundOn — globální napříč
     hrami, jako reducedMotion). Bez walletu = ticho (graceful).
   • AudioContext se vytvoří AŽ při prvním play() — respektuje autoplay
     policy (kontext smí vzniknout jen po gestu uživatele; play() se volá
     z kliků/odpovědí, takže gesto vždy proběhlo). Na load nic nevzniká.
   • Nezávislé na reduced-motion (zvuk ≠ pohyb).
   ══════════════════════════════════════════════════════════════════ */
const RPGSound = (function () {
  let ctx = null, master = null;
  function enabled() {
    try { return typeof RPGWallet !== 'undefined' && RPGWallet.getSoundOn(); }
    catch (e) { return false; }
  }
  function ac() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.25;              // decentní hlasitost (třída)
    master.connect(ctx.destination);
    return ctx;
  }
  /* Jeden tón: typ, frekvence (Hz nebo [od,do] sweep), délka (s),
     posun začátku (s), špičková hlasitost. Lineární AD envelope. */
  function tone(type, freq, dur, at, vol) {
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + (at || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    if (Array.isArray(freq)) {
      o.frequency.setValueAtTime(freq[0], t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(1, freq[1]), t0 + dur);
    } else o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.6 : vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  const RECIPES = {
    ok:    () => { tone('sine', 660, 0.12, 0, 0.5); tone('sine', 880, 0.10, 0.06, 0.35); },
    bad:   () => { tone('sawtooth', 150, 0.20, 0, 0.4); tone('sawtooth', 110, 0.22, 0.02, 0.4); },
    crit:  () => { tone('square', 700, 0.09, 0, 0.4); tone('square', 1046, 0.12, 0.07, 0.45); tone('square', 1568, 0.12, 0.15, 0.4); },
    coin:  () => { tone('square', 1318, 0.06, 0, 0.35); tone('square', 1760, 0.10, 0.05, 0.4); },
    level: () => { [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, 0.16, i * 0.11, 0.5)); },
    click: () => { tone('square', 420, 0.03, 0, 0.25); },
    boss:  () => { tone('sawtooth', [660, 70], 0.7, 0, 0.5); tone('square', [440, 55], 0.7, 0.05, 0.3); }
  };
  function play(name) {
    if (!enabled()) return;
    const r = RECIPES[name]; if (!r) return;
    try { const c = ac(); if (c && c.state === 'suspended') c.resume(); r(); } catch (e) {}
  }
  return { play, _enabled: enabled };
})();

/* Screen-shake bojové obrazovky (juice). DOM-only — CSS třídu `.shaking`
   univerzálně vypíná `.reduced-motion *{animation:none}` v každé hře, takže
   se o reduced-motion nemusíme starat tady. */
function shakeBattle() {
  const el = document.getElementById('s-battle');
  if (!el) return;
  el.classList.remove('shaking'); void el.offsetWidth; el.classList.add('shaking');
  setTimeout(() => el.classList.remove('shaking'), 200);
}

/* ══════════════════════════════════════════════════════════════════
   RPGFindError — „Najdi chybu" (erroneous examples).
   Výzkumně silný efekt: žák POROVNÁ správný a chybný postup a určí, který
   je správně, pak si přečte PROČ je ten druhý špatně. Data bereme z už
   načtené teorie (RPG_LEARN_X[mid].mistakes = [{wrong,right,why}]) — nic
   se nevymýšlí, žádná změna save formátu. Centrálně pro všech 7 her; hry
   volají jen RPGFindError.open(window.RPG_LEARN_X) z tlačítka na mapě.
   Overlay používá existující .btn třídy a CSS proměnné každé hry.
   ══════════════════════════════════════════════════════════════════ */
const RPGFindError = (function () {
  let pool = [], idx = 0, okCnt = 0, total = 0, earned = 0, root = null, answered = false, curCorrect = 'a';
  const EARN_CAP = 10;                       // strop kreditů za sezení (anti-farming)
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function build(L) {
    const p = [];
    if (L && typeof L === 'object') for (const mid in L) {
      const ms = L[mid] && L[mid].mistakes;
      if (Array.isArray(ms)) ms.forEach(m => { if (m && m.wrong && m.right) p.push({ wrong: String(m.wrong), right: String(m.right), why: String(m.why || '') }); });
    }
    return shuffle(p);
  }
  function ensureRoot() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'find-error-overlay';
    root.style.cssText = 'position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.82);padding:16px;overflow-auto';
    root.innerHTML =
      '<div style="max-width:560px;width:100%;background:var(--panel,#0f1626);border:2px solid var(--muted,#5d6e94);border-radius:10px;padding:20px 18px;box-shadow:0 10px 40px #000a">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
      '<span style="font-family:var(--px);font-weight:700;font-size:15px;color:var(--gold,#ffcc55)">🔍 NAJDI CHYBU</span>' +
      '<span id="fe-score" style="font-family:var(--px);font-weight:700;font-size:12px;color:var(--muted,#889)"></span></div>' +
      '<div style="font-family:var(--read),sans-serif;font-size:13px;color:var(--muted,#889);margin-bottom:14px">Který zápis je <b>správně</b>? Porovnej oba postupy.</div>' +
      '<div id="fe-opts" style="display:flex;flex-direction:column;gap:10px"></div>' +
      '<div id="fe-reveal" style="display:none;margin-top:14px"></div>' +
      '<div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">' +
      '<button class="btn b" id="fe-next" style="flex:1;display:none">DALŠÍ →</button>' +
      '<button class="btn sm" id="fe-close">KONEC</button></div></div>';
    document.body.appendChild(root);
    root.addEventListener('click', e => { if (e.target === root) close(); });
    root.querySelector('#fe-close').addEventListener('click', close);
    root.querySelector('#fe-next').addEventListener('click', next);
    document.addEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (!root || root.style.display === 'none') return;
    if (e.key === 'Escape') { close(); return; }
    if (!answered && (e.key === '1' || e.key === '2')) { pick(e.key === '1' ? 'a' : 'b'); }
    else if (answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); }
  }
  function card() {
    answered = false;
    const it = pool[idx % pool.length];
    // náhodně přiřaď správný/chybný zápis do A/B (bez formátového tellu)
    const rightIsA = Math.random() < 0.5;
    curCorrect = rightIsA ? 'a' : 'b';
    const a = rightIsA ? it.right : it.wrong, b = rightIsA ? it.wrong : it.right;
    const opts = root.querySelector('#fe-opts');
    opts.innerHTML =
      btn('a', '1', a) + btn('b', '2', b);
    opts.querySelectorAll('button').forEach(x => x.addEventListener('click', () => pick(x.dataset.k)));
    root.querySelector('#fe-reveal').style.display = 'none';
    root.querySelector('#fe-next').style.display = 'none';
    root.querySelector('#fe-score').textContent = 'Správně ' + okCnt + ' / ' + total;
    root._cur = it;
  }
  function btn(k, n, txt) {
    return '<button class="btn" data-k="' + k + '" style="text-align:left;justify-content:flex-start;white-space:normal;line-height:1.4;padding:12px 14px">' +
      '<span style="opacity:.6;font-family:var(--px);margin-right:8px">' + n + '</span>' + esc(txt) + '</button>';
  }
  function pick(k) {
    if (answered) return;
    answered = true; total++;
    const it = root._cur, good = k === curCorrect;
    const opts = root.querySelectorAll('#fe-opts button');
    opts.forEach(x => {
      x.disabled = true;
      if (x.dataset.k === curCorrect) x.style.cssText += ';border-color:var(--green,#39ff9e)!important;color:var(--green,#39ff9e)!important';
      else if (x.dataset.k === k) x.style.cssText += ';border-color:var(--red,#ff3d7f)!important;color:var(--red,#ff3d7f)!important';
    });
    if (good) {
      okCnt++;
      if (typeof RPGSound !== 'undefined') RPGSound.play('ok');
      if (earned < EARN_CAP && typeof RPGWallet !== 'undefined') { RPGWallet.earn(1); earned++; }
    } else if (typeof RPGSound !== 'undefined') RPGSound.play('bad');
    const rev = root.querySelector('#fe-reveal');
    rev.innerHTML =
      '<div class="feedback ' + (good ? 'ok' : 'err') + '" style="margin-bottom:10px">' + (good ? '✓ Správně!' : '✗ Chyba — správně je zvýrazněný zápis.') + '</div>' +
      '<div style="font-family:var(--read),sans-serif;font-size:13.5px;line-height:1.5;color:var(--text,#dde);background:var(--bg,#0b0f18);border:1px solid var(--muted,#5d6e94);border-radius:8px;padding:12px 14px">' +
      '<div style="color:var(--red,#ff3d7f)">❌ ' + esc(it.wrong) + '</div>' +
      '<div style="color:var(--green,#39ff9e);margin:4px 0">✅ ' + esc(it.right) + '</div>' +
      (it.why ? '<div style="color:var(--muted,#889);margin-top:8px">💡 ' + esc(it.why) + '</div>' : '') + '</div>';
    rev.style.display = 'block';
    root.querySelector('#fe-score').textContent = 'Správně ' + okCnt + ' / ' + total;
    root.querySelector('#fe-next').style.display = 'inline-block';
  }
  function next() { idx++; card(); }
  function close() {
    if (root) root.style.display = 'none';
    if (typeof window.renderMap === 'function') { try { window.renderMap(); } catch (e) {} }
  }
  function open(L) {
    pool = build(L);
    if (!pool.length) return;
    idx = 0; okCnt = 0; total = 0;   // POZOR: `earned` se NEresetuje — strop platí
    // per načtení stránky, jinak by šel obejít zavřením+znovuotevřením (anti-farming)
    ensureRoot();
    root.style.display = 'flex';
    card();
  }
  return { open, _build: build };
})();

/* ══════════════════════════════════════════════════════════════════
   RPGKeys — ovládání klávesnicí pro výběrové úlohy (centrálně, 0 per-game).
   • MC: klávesy 1–4 nebo A–D vyberou volbu (popisky A–D už jsou vidět).
   • ANO/NE: A/Y = ANO, N = NE (i 1/2).
   Bezpečné: když je fokus v <input>/<textarea> (žák píše číselnou odpověď),
   handler nic nedělá — psaní číslic zůstává psaním. Reaguje jen na VIDITELNOU
   mc-mřížku / ANO-NE řádek v AKTIVNÍ obrazovce (boj/trénink/věž mají stejné
   id konvence). Enter (odeslat/další) řeší dál per-game handler.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  function firstVisible(list) { for (const el of list) if (el && el.offsetParent !== null) return el; return null; }
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
    const active = document.querySelector('.screen.active');
    if (!active) return;
    const k = e.key, lk = k.toLowerCase();
    // ── výběr z možností (MC) ──
    const grid = firstVisible(active.querySelectorAll('.mc-grid'));
    if (grid) {
      const btns = [...grid.querySelectorAll('.mc-btn')].filter(b => !b.disabled);
      let i = -1;
      if (/^[1-4]$/.test(k)) i = (+k) - 1;
      else if (/^[a-d]$/.test(lk)) i = 'abcd'.indexOf(lk);
      if (i >= 0 && i < btns.length) { e.preventDefault(); btns[i].click(); return; }
    }
    // ── ANO / NE ──
    const yn = firstVisible(active.querySelectorAll('[id$="yn-row"]'));
    if (yn) {
      const btns = [...yn.querySelectorAll('button')].filter(b => !b.disabled);
      let i = -1;
      if (lk === 'a' || lk === 'y' || k === '1') i = 0;       // ANO = první
      else if (lk === 'n' || k === '2') i = 1;                // NE = druhé
      if (i >= 0 && i < btns.length) { e.preventDefault(); btns[i].click(); return; }
    }
  });
})();

/* ══════════════════════════════════════════════════════════════════
   RPGTutorial — jednorázový mini-tutoriál při PRVNÍM boji (onboarding).
   Centrálně; hra volá RPGTutorial.maybe(S, saveFn, pauseFn, resumeFn) na
   konci launchBattle. Zobrazí se jen novému žákovi (žádný splněný úkol) a
   jen jednou (S.tutorialDone). Vysvětlí ❤️ životy / časomíru+nápovědu /
   combo-crit / kredity. Přeskočitelný, ovládá se i klávesnicí.
   ══════════════════════════════════════════════════════════════════ */
const RPGTutorial = (function () {
  const STEPS = [
    { ic: '❤️', t: 'Tvoje životy', b: 'Tohle jsou tvoje životy. Za špatnou odpověď o jeden přijdeš — když dojdou, mise se prostě zopakuje. Žádný stres.' },
    { ic: '⏱️', t: 'Časomíra a nápověda', b: 'Nahoře běží čas. Nespěchej zbytečně — v klidu spočítej. Když si nevíš rady, klikni na 💡 nápovědu.' },
    { ic: '🔥', t: 'Kritický zásah', b: 'Odpověz 3× správně po sobě (bez nápovědy) a další zásah bude KRITICKÝ — dvojnásobek XP!' },
    { ic: '🛍️', t: 'Kredity a obchod', b: 'Za správné odpovědi sbíráš kredity. V obchodě si za ně koupíš vychytávky a vzhledy postavy. Hodně štěstí!' }
  ];
  let root = null, idx = 0, done = null;
  function ensure() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'tutorial-overlay';
    root.style.cssText = 'position:fixed;inset:0;z-index:9500;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.85);padding:16px';
    root.innerHTML =
      '<div style="max-width:440px;width:100%;background:var(--panel,#0f1626);border:2px solid var(--gold,#ffcc55);border-radius:12px;padding:22px 20px;box-shadow:0 12px 48px #000b;text-align:center">' +
      '<div id="tut-ic" style="font-size:44px;line-height:1;margin-bottom:10px"></div>' +
      '<div id="tut-t" style="font-family:var(--px);font-weight:700;font-size:16px;color:var(--gold,#ffcc55);margin-bottom:10px"></div>' +
      '<div id="tut-b" style="font-family:var(--read),sans-serif;font-size:14.5px;line-height:1.55;color:var(--text,#dde);margin-bottom:8px"></div>' +
      '<div id="tut-dots" style="margin:12px 0;letter-spacing:4px;color:var(--muted,#889)"></div>' +
      '<div style="display:flex;gap:10px;justify-content:center">' +
      '<button class="btn sm" id="tut-skip">Přeskočit</button>' +
      '<button class="btn b" id="tut-next" style="flex:1">DÁL →</button></div></div>';
    document.body.appendChild(root);
    root.querySelector('#tut-skip').addEventListener('click', finish);
    root.querySelector('#tut-next').addEventListener('click', next);
    document.addEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (!root || root.style.display === 'none') return;
    if (e.key === 'Escape') { e.preventDefault(); finish(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
  }
  function draw() {
    const s = STEPS[idx];
    root.querySelector('#tut-ic').textContent = s.ic;
    root.querySelector('#tut-t').textContent = s.t;
    root.querySelector('#tut-b').textContent = s.b;
    root.querySelector('#tut-dots').textContent = STEPS.map((_, i) => i === idx ? '●' : '○').join(' ');
    root.querySelector('#tut-next').textContent = idx === STEPS.length - 1 ? 'ZAČÍT! ⚔️' : 'DÁL →';
  }
  function next() { if (idx < STEPS.length - 1) { idx++; draw(); } else finish(); }
  function finish() {
    if (root) root.style.display = 'none';
    const cb = done; done = null;
    if (typeof cb === 'function') cb();
  }
  function show(onDone) { ensure(); idx = 0; done = onDone; root.style.display = 'flex'; draw(); }
  function maybe(S, saveFn, pauseFn, resumeFn) {
    if (!S || S.tutorialDone) return;
    // veterán (už má splněný nějaký úkol) → tutoriál nezobrazovat, jen označit
    if (S.done && Object.keys(S.done).length > 0) { S.tutorialDone = true; if (typeof saveFn === 'function') saveFn(); return; }
    if (typeof pauseFn === 'function') pauseFn();
    show(function () { S.tutorialDone = true; if (typeof saveFn === 'function') saveFn(); if (typeof resumeFn === 'function') resumeFn(); });
  }
  return { maybe, show, _steps: STEPS };
})();

/* Dotykové cíle ≥44 px (WCAG) pro bojové ovládání — jen na dotykových
   zařízeních (pointer:coarse), takže desktop layout zůstává beze změny.
   Injektováno centrálně, žádné per-game CSS edity. */
(function () {
  const st = document.createElement('style');
  st.textContent = '@media(pointer:coarse){.mc-btn,.bt-row .btn,.bt-row .bt-input,[id$="yn-row"] .btn,[id$="yn-row"] button{min-height:44px}}';
  (document.head || document.documentElement).appendChild(st);
})();
