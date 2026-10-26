/* Pevná mezera mezi číslem a jednotkou na vzdělávacích stránkách (únikovky, Cesta peněz, procenta, goniometrie).
   „12 cm“ ani „25 %“ se na konci řádku nesmí rozdělit — číslo zůstalo na jednom řádku a jednotka na druhém.
   Texty těchto stránek jsou psané rukou a skládané z JS, takže se mezera dělá PO VYKRESLENÍ nad textovými uzly
   (regulární výraz nad HTML by sáhl do atributů a dat křivek SVG; „<“ je v matematice „menší než“).
   Pravidlo je tatáž věta jako `zapis()` v rpg-shared.js a `PZ.typo` v přijímačkách; „s“ v seznamu není (předložka:
   „2 s kamarádem“); stejně tak tisícové skupiny „12 000“. Funkce je idempotentní, takže pozorovatel vlastní zápis znovu nezpracovává donekonečna. */
(function () {
  'use strict';
  var RE = /(\d) (cm|dm|mm|km|kg|dkg|mg|ml|dl|hl|Kč|min|hod|[mglht]|%)(?![\p{L}\d])/gu;
  var VYNECH = 'svg,script,style,textarea,input,[data-bez-typo]';
  /* tisícové skupiny („12 000“) — bez lookbehindu, Safari před 16.4 by kvůli němu nenačetlo celý skript */
  var RE_TISICE = /(^|[^\d,.])(\d{1,3}(?: \d{3})+)(?!\d)/g;
  function text(s) {
    return String(s).replace(RE, '$1\u00A0$2').replace(RE_TISICE, function (_, pred, skupina) { return pred + skupina.replace(/ /g, '\u00A0'); });
  }
  function uzel(u) {
    if (!u.data || u.data.indexOf(' ') < 0) return;
    if (u.parentElement && u.parentElement.closest(VYNECH)) return;
    var t = text(u.data);
    if (t !== u.data) u.data = t;
  }
  function dom(koren) {
    if (!koren) return;
    if (koren.nodeType === 3) { uzel(koren); return; }
    if (koren.nodeType !== 1) return;
    var w = document.createTreeWalker(koren, NodeFilter.SHOW_TEXT), n, uzly = [];
    while ((n = w.nextNode())) uzly.push(n);
    uzly.forEach(uzel);
  }
  window.PevneMezery = { text: text, dom: dom };
  if (typeof MutationObserver === 'undefined') return;
  function start() {
    dom(document.body);
    new MutationObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (z.type === 'characterData') uzel(z.target);
        else z.addedNodes.forEach(dom);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
