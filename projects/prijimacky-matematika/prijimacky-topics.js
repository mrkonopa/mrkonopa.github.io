/* ─────────────────────────────────────────────────────────────────────────
   PŘIJÍMAČKY HUB — okruhy procvičování + zdroj úloh.
   Zdroj = neutrální akademické generátory z rpg-cermat-9.js (věrné reálnému
   testu M9A — stejné pozice, znění i tón). Každý okruh mapuje na jednu či víc
   z 16 pozic testu (SLOTS). Zde se NEUPRAVUJE znění úloh — jen se vybere
   jedna položka k zodpovězení (typografie = správnost, Vojtovo pravidlo).
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // Okruh → 0-indexované pozice testu (SLOTS). Pozice 1 = index 0.
  // (Mapování odpovídá oficiální CERMAT Části C1; ověřeno na reálném M9A 2025.)
  const TOPICS = [
    { id: 'vyrazy-mocniny', name: 'Číselné výrazy, mocniny a odmocniny', oblast: 'Číslo a proměnná', slots: [0] },
    // Pozice 1 střídá čísla s krátkými slovními úlohami (stuha, poměr, jízda s pauzou),
    // stejně jako ostré testy 2023–26; okruh nese každá její úloha (topicsForTask).
    { id: 'zlomky', name: 'Zlomky a desetinná čísla', oblast: 'Číslo a proměnná', slots: [1, 0] },
    { id: 'procenta', name: 'Procenta a finanční matematika', oblast: 'Číslo a proměnná', slots: [14, 12] },
    // Pozice 13 střídá procenta, slovní úlohy a poměr (kytice podle nanečisto 2025).
    // Který okruh úloha opravdu cvičí, říká její `okruh` (topicsForTask); procvičování
    // okruhu z pozice bere jen úlohy, které do něj patří.
    { id: 'pomer', name: 'Poměr a úměrnost', oblast: 'Závislosti a data', slots: [12, 4, 0] },
    { id: 'vyrazy-promenna', name: 'Výrazy s proměnnou', oblast: 'Číslo a proměnná', slots: [2] },
    { id: 'rovnice', name: 'Rovnice a soustavy', oblast: 'Číslo a proměnná', slots: [3] },
    // Pozice 12 (index 11) sem už nepatří: všechny její varianty jsou tělesa (okruh 'telesa'),
    // takže by procvičování slovních úloh z ní nikdy nic nevylosovalo.
    { id: 'slovni', name: 'Slovní úlohy', oblast: 'Nestandardní úlohy', slots: [12, 4, 5, 0] },
    // Pozice 16 (index 15) sem patří taky: na 300 běhů losuje jen Rámeček, Obraz v rámu
    // a Chodník kolem bazénu — všechno obvod a obsah obdélníku s lemem. Dřív nepatřila
    // ŽÁDNÉMU okruhu, takže se neobjevovala v procvičování ani v diagnostice.
    // Pozice 6 (index 5) přidává „Bílý a šedý obdélník“, pozice 7 (index 6) „Krychli a hranol“ —
    // jako v ostrých testech 2026, kde se geometrie v rovině i tělesa na pozicích 6–8 střídají.
    { id: 'geometrie', name: 'Geometrie v rovině', oblast: 'Geometrie', slots: [4, 5, 6, 7, 8, 9, 15] },
    { id: 'telesa', name: 'Tělesa (objem a povrch)', oblast: 'Geometrie', slots: [5, 6, 10, 11] },
    { id: 'data', name: 'Tabulky, data a statistika', oblast: 'Závislosti a data', slots: [13] },
  ];

  /* Okruh → výklad a video. Ročník NENÍ vždy devátý: test nanečisto zkouší látku
     6.–9. třídy, takže výklad má přijít z ročníku, kde se to probírá. Poslat žáka
     od „kolik je 3/8 z 240" na lomené výrazy 9. ročníku by ho jen zmátlo.
     Mise vybrané MĚŘENÍM (četnost klíčových slov v rpg-learn-6/7/8/9.js), ne odhadem;
     počet shod je uveden u každé. Video je to, které k misi patří v rpg-learn.
     Odkaz vede přes ?preview=1, takže hra běží v izolovaném úložišti a žákovi
     NEPŘEPÍŠE uložený postup.
     POZOR: `video` je KOPIE id z rpg-learn-N.js (přijímačkové stránky ty moduly
     nenačítají — jsou to ~240 KB navíc jen kvůli jednomu odkazu). Kopie se může
     rozejít s originálem a nikde by to nespadlo, proto ji znak po znaku hlídá
     tests/prijimacky-vyklad.test.cjs — stejný vzor jako rpg-hero-portraits.js. */
  const VYKLAD = {
    'vyrazy-mocniny':  { hra: 8, mise: '2-1', nazev: 'Druhá mocnina a odmocnina', video: 'DVQl6pLx8qI'  },      // 15 shod
    'zlomky':          { hra: 7, mise: '2-1', nazev: 'Krácení zlomků', video: 'A05HhHZwfoQ'  },                  // 29 shod
    'procenta':        { hra: 7, mise: '5-1', nazev: 'Výpočet procentové části', video: 'GFkEBrieSuA'  },        // 11 shod
    'pomer':           { hra: 7, mise: '4-1', nazev: 'Poměr — slovní úlohy', video: 'YeptEbvYohc'  },            // 21 shod
    'vyrazy-promenna': { hra: 8, mise: '4-1', nazev: 'Algebraické vzorce', video: 'TwzbrIEIwn0'  },              // 13 shod
    'rovnice':         { hra: 8, mise: '3-1', nazev: 'Rovnice', video: 'q2saJQdkF34'  },                         // 13 shod
    'slovni':          { hra: 9, mise: '3-3', nazev: 'Slovní úlohy — rovnice', video: '9KL_tx0SYJk'  },
    'geometrie':       { hra: 7, mise: '1-3', nazev: 'Obvod a obsah čtverce a obdélníku', video: 'GcR_xKAu5kQ'  },// 31 shod
    'telesa':          { hra: 7, mise: '7-2', nazev: 'Objem a povrch hranolu', video: 'LUgKaMWPels'  },          // 39 shod
    'data':            { hra: 6, mise: '2-3', nazev: 'Aritmetický průměr', video: '4_MuthDfVJQ'  },              // 12 shod
  };
  /* Některé pozice mají v rámci okruhu vlastní téma a obecný odkaz by mířil vedle:
     okruh „geometrie" pokrývá pozice 5–10, ale pozice 7 je o úhlech, 9 o Pythagorově
     větě a 10 o podobnosti — poslat žáka na obvod a obsah by mu nepomohlo.
     Klíč je 0-indexovaná pozice testu. Mise opět vybrané měřením, počet shod uveden. */
  const VYKLAD_POZICE = {
    6: { hra: 6, mise: '4-2', nazev: 'Vedlejší a vrcholové úhly', video: 'a0OCeHpRcOI' },  // 48 shod
    8: { hra: 8, mise: '2-2', nazev: 'Pythagorova věta',          video: 'ssvz3u8imgk' },  // 29 shod
    9: { hra: 9, mise: '7-1', nazev: 'Podobnost trojúhelníků',    video: 'XFIg5VJ2Ujc' },  // 10 shod
  };
  // Výklad pro pozici testu (0-indexovanou). Nejdřív výjimka pro konkrétní pozici,
  // teprve pak okruh; topicsForSlot zůstává jediným zdrojem mapování pozice → okruh.
  function vykladProSlot(idx) {
    if (VYKLAD_POZICE[idx]) return Object.assign({ okruh: 'pozice-' + idx }, VYKLAD_POZICE[idx]);
    for (const id of topicsForSlot(idx)) if (VYKLAD[id]) return Object.assign({ okruh: id }, VYKLAD[id]);
    return null;
  }
  // Výklad pro konkrétní úlohu z rozboru: vlastní okruh úlohy má přednost před pozicí.
  function vykladProUlohu(r) {
    const id = r && r.okruh;
    if (typeof id === 'string' && VYKLAD[id] && TOPICS.some(x => x.id === id)) return Object.assign({ okruh: id }, VYKLAD[id]);
    return vykladProSlot(Number(r && r.no) - 1);
  }
  function vykladProOkruh(id) { return VYKLAD[id] ? Object.assign({ okruh: id }, VYKLAD[id]) : null; }
  // Adresa výkladu ve hře. ?preview=1 → izolované úložiště (žákův postup zůstane netknutý).
  function vykladUrl(v) { return '../rpg-mat-' + v.hra + '.html?preview=1&learn=' + encodeURIComponent(v.mise); }
  function videoUrl(v) { return v.video ? 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.video) : null; }

  // Převod testové úlohy (z RPG_CERMAT_9.genSlot) na JEDNU procvičovací položku.
  // Zachovává přesné znění (prompt/options/ans/sol). Typy: text | mc | yn.
  function taskToItem(t) {
    const intro = t.intro || '';
    const svg = t.svg || '';
    const kind = t.kind || 'open';
    if (kind === 'mc') {
      return { intro, svg, prompt: t.prompt, type: 'mc', options: (t.options || []).slice(), ans: t.ans, sol: t.sol || '' };
    }
    if (kind === 'tfgrid') {
      const s = t.statements[Math.floor(Math.random() * t.statements.length)];
      return { intro, svg, prompt: s.text, type: 'yn', ans: s.ans, sol: s.sol || '' };
    }
    if (kind === 'match') {
      const i = Math.floor(Math.random() * t.prompts.length);
      return { intro, svg, prompt: t.prompts[i], type: 'mc', options: (t.options || []).slice(), ans: t.ans[i], sol: (t.sol && t.sol[i]) || '' };
    }
    // open — vyber jednu podúlohu (generátor je dělá samostatné, viz reálný M9A)
    const parts = t.parts || [];
    const p = parts.length ? parts[Math.floor(Math.random() * parts.length)] : { prompt: t.prompt || '', ans: '', sol: '' };
    // `klavesnice`: rovnice mají vždy textovou klávesnici — číselná by prozradila, že odpověď
    // není „nemá řešení" (viz inputMode v prijimacky-core.js).
    return { intro, svg, prompt: p.prompt, type: 'text', ans: String(p.ans), sol: p.sol || '', ...(p.klavesnice ? { klavesnice: p.klavesnice } : {}) };
  }

  // Vygeneruj procvičovací položku pro daný okruh. Zdroj = pozice testu (SLOTS)
  // NEBO doplňkové neutrální generátory z prijimacky-gen.js (window.PZ_GEN),
  // sloučené do jednoho losovacího poolu → víc variety u řídkých okruhů.
  function practiceItem(topicId) {
    const topic = TOPICS.find(x => x.id === topicId);
    if (!topic) return null;
    const gens = (window.PZ_GEN && window.PZ_GEN[topicId]) || [];
    const slots = (typeof window.RPG_CERMAT_9 !== 'undefined') ? (topic.slots || []) : [];
    const total = gens.length + slots.length;
    if (!total) return null;
    const k = Math.floor(Math.random() * total);
    if (k < gens.length) { try { return gens[k](); } catch (e) { return null; } }
    const idx = slots[k - gens.length];
    try {
      /* Pozice může střídat úlohy různých okruhů (pozice 11: tělesa, diagramy,
         mapa, mnohoúhelníky). Losuje se proto znovu, dokud úloha do okruhu
         nepatří — jinak by „Tělesa" nabídla kruhový diagram. Kytice (poměr) je
         jedna z 9 variant pozice 13, takže 40 pokusů selhalo v 0,9 % a test
         procvičování by občas chytil prázdnou položku; 200 pokusů = 6 · 10⁻¹¹. */
      for (let i = 0; i < 200; i++) {
        const t = window.RPG_CERMAT_9.genSlot(idx);
        if (topicsForTask(t).indexOf(topicId) !== -1) return taskToItem(t);
      }
      return null;
    } catch (e) { return null; }
  }

  // Reverzní mapa: pozice testu (0-indexovaná) → okruhy, které ji pokrývají.
  // Pozor: jedna pozice může patřit VÍC okruhům (např. slot 12 = procenta i slovní
  // úlohy) — úloha skutečně cvičí obojí, takže se chyba přičte oběma.
  function topicsForSlot(idx) {
    const i = Number(idx);
    if (!Number.isFinite(i)) return [];
    return TOPICS.filter(t => (t.slots || []).indexOf(i) !== -1).map(t => t.id);
  }

  /* Okruhy úlohy (nebo položky rozboru {no, okruh}). Úloha smí nést vlastní
     `okruh`: pozice 11 ostrého testu střídá tělesa, kruhové diagramy, mapu
     i mnohoúhelníky a mapování jen podle pozice by chybu v diagramu připsalo
     tělesům. Neznámý okruh se ignoruje (rozbor může přijít i ze starší verze). */
  function topicsForTask(t) {
    const id = t && t.okruh;
    if (typeof id === 'string' && TOPICS.some(x => x.id === id)) return [id];
    return topicsForSlot(Number(t && t.no) - 1);
  }

  window.PZ_TOPICS = { list: TOPICS, item: practiceItem, topicsForSlot, topicsForTask, vykladProSlot, vykladProUlohu, vykladProOkruh, vykladUrl, videoUrl };
})();
