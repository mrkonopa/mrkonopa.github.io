/* ─────────────────────────────────────────────────────────────────────────
   PŘIJÍMAČKY — přepínač světlého / tmavého vzhledu.

   Načítá se SYNCHRONNĚ v <head> (před stylem stránky), aby se atribut
   `data-motiv` nastavil dřív, než prohlížeč cokoli vykreslí — jinak by tmavá
   volba při každém načtení na okamžik zablikala světle.

   · výchozí je SVĚTLÝ; systémové nastavení tmavého vzhledu se NEsleduje
     (světlý je odladěný a změřený, tmavý je volba žáka),
   · volba je nastavení ZAŘÍZENÍ (klíč PZ_MOTIV): odhlášení ji nemaže, na rozdíl
     od výsledků žáka — viz `jeOsobni` v rpg-cloud.js a test prijimacky-klice,
   · bez úložiště (soukromé okno, zablokovaná data) vše funguje, jen se volba
     nezapamatuje,
   · tlačítko se vkládá do horní lišty `.top-bar` (má ji všech sedm stránek),
   · změna rozešle událost `pz-motiv` (obrázky úloh se podle ní překreslí,
     viz themeSvg v prijimacky-core.js) a propíše se i do ostatních otevřených karet.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var KLIC = 'PZ_MOTIV', root = document.documentElement;

  function cti() { try { return localStorage.getItem(KLIC) === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; } }
  function uloz(m) { try { localStorage.setItem(KLIC, m); } catch (e) { /* nezapamatuje se, ale funguje */ } }

  var aktualni = cti();
  root.setAttribute('data-motiv', aktualni);
  var tlacitka = [];

  function vykresli(b) {
    b.setAttribute('aria-checked', aktualni === 'dark' ? 'true' : 'false');
    b.setAttribute('title', aktualni === 'dark' ? 'Přepnout na světlý vzhled' : 'Přepnout na tmavý vzhled');
  }
  function nastav(m, ulozit) {
    m = m === 'dark' ? 'dark' : 'light';
    var zmena = m !== aktualni;
    aktualni = m;
    root.setAttribute('data-motiv', m);
    if (ulozit !== false) uloz(m);
    tlacitka.forEach(vykresli);
    if (zmena) { try { document.dispatchEvent(new CustomEvent('pz-motiv', { detail: { motiv: m } })); } catch (e) { /* starý prohlížeč */ } }
  }

  window.PZ_MOTIV = {
    KLIC: KLIC,
    get: function () { return aktualni; },
    jeTmavy: function () { return aktualni === 'dark'; },
    nastav: function (m) { nastav(m, true); },
    prepni: function () { nastav(aktualni === 'dark' ? 'light' : 'dark', true); }
  };

  // druhá otevřená karta téže stránky: přepnutí se propíše hned
  window.addEventListener('storage', function (e) { if (e.key === KLIC) nastav(cti(), false); });

  function vloz() {
    var bar = document.querySelector('.top-bar');
    if (!bar || bar.querySelector('.pz-motiv')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pz-motiv'; b.setAttribute('role', 'switch');
    var t = document.createElement('span'); t.textContent = 'Tmavý vzhled';
    var p = document.createElement('span'); p.className = 'pz-motiv-prep'; p.setAttribute('aria-hidden', 'true');
    b.appendChild(t); b.appendChild(p);
    b.addEventListener('click', function () { window.PZ_MOTIV.prepni(); });
    tlacitka.push(b); vykresli(b);
    bar.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vloz); else vloz();
})();
