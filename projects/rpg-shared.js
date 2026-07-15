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
