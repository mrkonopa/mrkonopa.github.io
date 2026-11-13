/* ═══════════════════════════════════════════════════════════════════════
   sonda-dale.js — sonda „kam se poděla DÁLE“ pro školní tablet (autor Vojtěch Konopa)
   ───────────────────────────────────────────────────────────────────────
   NEPATŘÍ do produkce a nic ve hře nemění: jen pozoruje tlačítka DÁLE (boj `#next-btn`,
   trénink `#tr-next-btn`) a zapisuje, jestli jsou v tu chvíli opravdu k zastižení:

     MIMO     tlačítko leží mimo VIDITELNOU část obrazovky (`visualViewport`) — typicky
              pod klávesnicí nebo pod okrajem, kam se nedá dosáhnout bez rolování
     ZAKRYTÉ  v jeho středu je při dotyku jiný prvek (toast, lišta, panel, plovoucí tlačítko)
     BLEDÉ    tlačítko je vypnuté (disabled) déle než 0,8 s — vypadá jako „zmizelo“ (průhlednost 0,35);
              první 0,4 s po zobrazení je vypnuté schválně (pojistka proti dvojímu ťuknutí) a nepočítá se

   Proč: automatické měření (náhodný průchod, WebKit na velikosti iPadu) 9. 11. 2026 nenašlo
   nic, ale dítě na iPadu na šířku DÁLE po správné odpovědi nenašlo. Chybí v něm to, co jde
   změřit jen na skutečném zařízení: dotyková klávesnice a iPadOS. Tahle sonda to změří tam.

   Jak ji pustit na iPadu (stejně jako MĚŘENÍ z `tools/MERENI-TABLET.md`): záložka s adresou

     javascript:(function(){var s=document.createElement('script');s.src='/tools/sonda-dale.js';s.onload=function(){RPGDale.start()};document.body.appendChild(s)})()

   Otevři hru, klepni na záložku a hraj normálně. V pravém horním rohu je malý panel:
   kolikrát se DÁLE ukázalo a kolikrát bylo MIMO / ZAKRYTÉ / BLEDÉ. Když DÁLE zmizí, VYFOŤ
   OBRAZOVKU s panelem — poslední záznam říká, kde tlačítko bylo a co leželo v jeho středu.
   Panel nechytá dotyk (kromě ✕, kterým se sonda vypne).

   RPGDale.start() | RPGDale.stop() | RPGDale.stav()  (poslední má čistá data pro konzoli)
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.RPGDale && window.RPGDale.bezi) return;

  const IDY = ['next-btn', 'tr-next-btn'];
  const MAX_ZAZNAMU = 6;
  const S = {
    bezi: false, ukazano: 0, mimo: 0, zakryte: 0, blede: 0, zavad: 0,
    nejdelsiVadaMs: 0, zaznamy: [], zacatekVady: null, vidiTed: {}, bledeOd: {}, resize: 0, otoceni: 0,
  };
  let timer = null, obs = null, panel = null, radek = null, onResize = null, onOrient = null;

  const popis = el => el ? (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) : 'nic';
  const kl = () => { const vv = window.visualViewport; return vv ? Math.round(window.innerHeight - vv.height - vv.offsetTop) : 0; };

  /* Jedno měření jednoho tlačítka. Vrací null, když není vidět vůbec (display:none = to není zavinění dotyku). */
  function zmer(el) {
    if (!el || !el.isConnected) return null;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const vv = window.visualViewport;
    const top = vv ? vv.offsetTop : 0, left = vv ? vv.offsetLeft : 0;
    const vyska = vv ? vv.height : window.innerHeight, sirka = vv ? vv.width : window.innerWidth;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    /* střed musí ležet ve viditelné části; stačí střed, ne celý rámeček (dotyk míří doprostřed) */
    const mimo = cy < top || cy > top + vyska || cx < left || cx > left + sirka;
    let nad = null;
    if (!mimo) { const h = document.elementFromPoint(cx, cy); nad = h && (h === el || el.contains(h)) ? null : h; }
    return {
      mimo, zakryte: !!nad, blede: !!el.disabled || parseFloat(cs.opacity) < 0.6,
      kdo: nad ? popis(nad) : null,
      x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      vvY: Math.round(top), vvH: Math.round(vyska), klavesnice: kl(), okno: window.innerWidth + '×' + window.innerHeight,
    };
  }

  function zapis(id, m) {
    const cas = new Date();
    const z = (m.mimo ? 'MIMO ' : '') + (m.zakryte ? 'ZAKRYTÉ ' : '') + (m.blede ? 'BLEDÉ ' : '');
    S.zaznamy.unshift(('0' + cas.getMinutes()).slice(-2) + ':' + ('0' + cas.getSeconds()).slice(-2) + ' ' + id + ' ' + z.trim()
      + ' [' + m.x + ',' + m.y + ' ' + m.w + '×' + m.h + '] okno ' + m.okno + ' viditelné od ' + m.vvY + ' výška ' + m.vvH + ', klávesnice ' + m.klavesnice + ' px'
      + (m.kdo ? ' — v místě je ' + m.kdo : ''));
    S.zaznamy.length = Math.min(S.zaznamy.length, MAX_ZAZNAMU);
  }

  function krok() {
    const ted = Date.now();
    let nejakaVada = false;
    for (const id of IDY) {
      const m = zmer(document.getElementById(id));
      if (!m) { S.vidiTed[id] = false; continue; }
      if (!S.vidiTed[id]) { S.vidiTed[id] = true; S.ukazano++; }
      if (!m.blede) S.bledeOd[id] = null; else if (!S.bledeOd[id]) S.bledeOd[id] = ted;
      m.blede = !!(m.blede && ted - S.bledeOd[id] > 800);
      const vada = m.mimo || m.zakryte || m.blede;
      if (m.blede) S.blede++;
      if (m.mimo) S.mimo++;
      if (m.zakryte) S.zakryte++;
      if (vada) {
        nejakaVada = true;
        if (S.zacatekVady === null) { S.zacatekVady = ted; S.zavad++; zapis(id, m); }
      }
    }
    if (!nejakaVada && S.zacatekVady !== null) { S.nejdelsiVadaMs = Math.max(S.nejdelsiVadaMs, ted - S.zacatekVady); S.zacatekVady = null; }
    else if (nejakaVada) S.nejdelsiVadaMs = Math.max(S.nejdelsiVadaMs, ted - S.zacatekVady);
    kresli();
  }

  function kresli() {
    if (!panel) return;
    const t = [
      'DÁLE se ukázalo: ' + S.ukazano + '×  ·  s potížemi: ' + S.zavad + '×  (nejdéle ' + Math.round(S.nejdelsiVadaMs / 100) / 10 + ' s)',
      'měřicích tiků mimo/zakryté/bledé: ' + S.mimo + ' / ' + S.zakryte + ' / ' + S.blede + '  ·  změn okna ' + S.resize + ', otočení ' + S.otoceni,
      'teď: okno ' + window.innerWidth + '×' + window.innerHeight + ', klávesnice ' + kl() + ' px',
    ].concat(S.zaznamy);
    const novy = t.join('\n'); if (radek.textContent !== novy) radek.textContent = novy;
  }

  function start() {
    if (S.bezi) return;
    S.bezi = true;
    panel = document.createElement('div');
    panel.setAttribute('data-sonda-dale', '1');
    panel.style.cssText = 'position:fixed;top:4px;right:4px;z-index:2147483647;max-width:min(92vw,520px);background:rgba(0,0,0,.88);color:#9ff;border:1px solid #9ff;border-radius:6px;padding:6px 30px 6px 8px;font:12px/1.35 monospace;pointer-events:none;white-space:pre-wrap;word-break:break-word';
    radek = document.createElement('div'); panel.appendChild(radek);
    const x = document.createElement('button');
    x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'Vypnout sondu');
    x.style.cssText = 'position:absolute;top:2px;right:2px;width:26px;height:26px;pointer-events:auto;background:#222;color:#fff;border:1px solid #888;border-radius:4px;font:14px monospace;padding:0';
    x.onclick = stop; panel.appendChild(x);
    document.body.appendChild(panel);
    /* měří se po každé změně stránky i pravidelně (zmizení bez změny DOM by jinak zůstalo bez záznamu) */
    /* Pozorovatel nesmí reagovat na vlastní panel: zápis textu do panelu je změna stránky, takže by se
       měřilo donekonečna a stránka by zamrzla (zjištěno při ověřování sondy). */
    obs = new MutationObserver(zmeny => { if (zmeny.some(z => !(panel && panel.contains(z.target)))) krok(); });
    obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class', 'disabled'] });
    timer = setInterval(krok, 250);
    onResize = () => { S.resize++; krok(); };
    onOrient = () => { S.otoceni++; krok(); };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrient);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
    krok();
  }

  function stop() {
    S.bezi = false;
    if (timer) clearInterval(timer); timer = null;
    if (obs) obs.disconnect(); obs = null;
    if (onResize) { window.removeEventListener('resize', onResize); if (window.visualViewport) window.visualViewport.removeEventListener('resize', onResize); }
    if (onOrient) window.removeEventListener('orientationchange', onOrient);
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null; radek = null;
  }

  window.RPGDale = { start, stop, stav: () => JSON.parse(JSON.stringify(S)), get bezi() { return S.bezi; } };
})();
