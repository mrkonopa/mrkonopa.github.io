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
    { id: 'zlomky', name: 'Zlomky a desetinná čísla', oblast: 'Číslo a proměnná', slots: [1] },
    { id: 'procenta', name: 'Procenta a finanční matematika', oblast: 'Číslo a proměnná', slots: [14, 12] },
    { id: 'pomer', name: 'Poměr a úměrnost', oblast: 'Závislosti a data', slots: [] },
    { id: 'vyrazy-promenna', name: 'Výrazy s proměnnou', oblast: 'Číslo a proměnná', slots: [2] },
    { id: 'rovnice', name: 'Rovnice a soustavy', oblast: 'Číslo a proměnná', slots: [3] },
    { id: 'slovni', name: 'Slovní úlohy', oblast: 'Nestandardní úlohy', slots: [12, 11] },
    { id: 'geometrie', name: 'Geometrie v rovině', oblast: 'Geometrie', slots: [4, 6, 7, 8, 9] },
    { id: 'telesa', name: 'Tělesa (objem a povrch)', oblast: 'Geometrie', slots: [5, 10, 11] },
    { id: 'data', name: 'Tabulky, data a statistika', oblast: 'Závislosti a data', slots: [13] },
  ];

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
    return { intro, svg, prompt: p.prompt, type: 'text', ans: String(p.ans), sol: p.sol || '' };
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
    try { return taskToItem(window.RPG_CERMAT_9.genSlot(idx)); } catch (e) { return null; }
  }

  // Reverzní mapa: pozice testu (0-indexovaná) → okruhy, které ji pokrývají.
  // Pozor: jedna pozice může patřit VÍC okruhům (např. slot 12 = procenta i slovní
  // úlohy) — úloha skutečně cvičí obojí, takže se chyba přičte oběma.
  function topicsForSlot(idx) {
    const i = Number(idx);
    if (!Number.isFinite(i)) return [];
    return TOPICS.filter(t => (t.slots || []).indexOf(i) !== -1).map(t => t.id);
  }

  window.PZ_TOPICS = { list: TOPICS, item: practiceItem, topicsForSlot };
})();
