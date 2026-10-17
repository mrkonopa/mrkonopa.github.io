/* ══════════════════════════════════════════════════════════════════════
   Průchody obrazovkami PŘIJÍMAČEK (diagnostika, statistiky s daty, běžící test
   a rozbor, konstrukce). Jedno místo pro všechna měřidla, která stránkami
   procházejí: `layout-overflow` (přetečení) a `prijimacky-motiv` (kontrast
   v tmavém režimu) — dřív to byla kopie uvnitř prvního z nich.

   Každý průchod má `pripravit` (jednou po načtení), `seznam` (popisky obrazovek)
   a `prepnout(popisek)` (vrací '' při úspěchu, jinak důvod). Funkce běží
   V PROHLÍŽEČI (Playwright je serializuje), takže tu nesmí být nic z Node.
   ══════════════════════════════════════════════════════════════════════ */
module.exports = {
  /* Diagnostika přijímaček: úlohy jedna po druhé a nakonec výsledek. Liché
     téma odpoví „Nevím", takže přijdou úlohy z obou úrovní a konec má mapu,
     plán i rozbor chyb. Právě ten konec na 360 px přetékal o 34 px (řádky
     plánu) a úvodní snímek, který se dřív jediný měřil, to vidět nemohl. */
  'pz-diag': {
    pripravit: () => { dgStart(); },
    seznam: () => Array.from({ length: DG.okruhy.length * 2 }, (_, i) => 'úloha ' + (i + 1)).concat(['konec']),
    prepnout: k => {
      try {
        const odpovez = () => {
          const it = DG.it;
          if (DG.k % 2) { dgNevim(); return; }
          if (it.type === 'mc') { const r = document.querySelector('input[name="dg-mc"][value="' + it.ans + '"]'); if (r) r.checked = true; dgSubmit(); }
          else if (it.type === 'yn') dgSubmitYN(it.ans);
          else { document.getElementById('dg-input').value = String(it.ans); dgSubmit(); }
        };
        const cil = k === 'konec' ? Infinity : +k.replace('úloha ', '') - 1;
        let g = 0;
        while (DG.k < DG.okruhy.length && DG.k * 2 + DG.krok < cil && g++ < 100) odpovez();
        return (k === 'konec') === (DG.k >= DG.okruhy.length) ? '' : 'průchod se nedostal na ' + k;
      } catch (e) { return 'výjimka: ' + String(e && e.message || e).slice(0, 60); }
    },
  },
  /* Statistiky S DATY — bez nich se měřil jen prázdný stav. Šest pokusů
     s body po úlohách ukáže trend i sekci „Kde ztrácíš body". */
  'pz-stat': {
    pripravit: () => {
      const MAX = [1, 2, 4, 4, 4, 4, 3, 3, 3, 3, 4, 2, 2, 2, 6, 3];
      const att = [30, 34, 38, 41, 36, 44].map((s, i) => ({ date: '2026-0' + (i + 3) + '-10', t: i + 1, score: s, max: 50, cas: 3300,
        ulohy: MAX.map((m, j) => [j === 14 ? 2 : j === 10 ? 3 : m, m, j === 14 ? 'procenta' : j === 10 ? 'geometrie' : null]) }));
      localStorage.setItem('PZ_CERMAT_ATTEMPTS', JSON.stringify(att));
      localStorage.setItem('PZ_PRACTICE_PROGRESS', JSON.stringify({ zlomky: { ok: 2, total: 8 }, geometrie: { ok: 5, total: 9 } }));
      localStorage.setItem('PZ_DIAG_LAST', JSON.stringify({ date: '2026-09-01', ver: 2, ok: 11, n: 20,
        topics: PZ_TOPICS.list.map((t, i) => ({ id: t.id, level: i % 4, correct: i % 4 >= 2 })) }));
    },
    seznam: () => ['s daty'],
    prepnout: () => { try { render(); return ''; } catch (e) { return 'výjimka: ' + String(e && e.message || e).slice(0, 60); } },
  },
  /* Test nanečisto: dřív se měřila jen brána. Běžící test má 16 úloh včetně
     dvou kreslicích oken (konstrukce 9 a 10), pak okno přes celou obrazovku
     s časem a nakonec rozbor se snímky konstrukcí a otevřenými postupy. */
  'pz-test': {
    pripravit: () => { cmStart(); },
    seznam: () => ['běžící test', 'konstrukce přes celou obrazovku', 'rozbor'],
    prepnout: k => {
      try {
        if (k === 'běžící test') return CM.on && document.querySelectorAll('#cm-tasks .kn-svg').length === 2 ? '' : 'test neběží se dvěma kreslicími okny';
        if (k === 'konstrukce přes celou obrazovku') { CM.okna[9].plna(true); updateTimerUI(); return CM.okna[9].jePlna() ? '' : 'celá obrazovka se neotevřela'; }
        CM.okna[9].plna(false);
        // kresba kousek vedle vrcholů: snímek pak má kresbu žáka i vzorové řešení
        CM.tasks.forEach(t => { if (t.kind === 'konstrukce') Object.values(t.u.reseni[0]).forEach(p => CM.okna[t.no].tvary.push({ typ: 'bod', p: PZ_GEO.bod(p.x + 14, p.y) })); });
        cmSubmit(false);
        document.querySelectorAll('#cm-end-detail details').forEach(d => { d.open = true; });
        return document.querySelectorAll('#cm-end-detail .kn-snimek').length === 2 ? '' : 'rozbor bez snímků konstrukcí';
      } catch (e) { return 'výjimka: ' + String(e && e.message || e).slice(0, 60); }
    },
  },
  /* Konstrukce: každý typ ve stavu, kdy je na stránce nejvíc textu — tři
     nápovědy, výsledek a poslední krok postupu — a nakonec okno přes celou
     obrazovku (na úzkém displeji se lišta nástrojů musí zalomit). */
  'pz-konstr': {
    pripravit: () => {},
    seznam: () => PZ_KONSTRUKCE.TYPY.concat(['celá obrazovka']),
    prepnout: k => {
      try {
        if (k === 'celá obrazovka') { knFull(true); return KN.full ? '' : 'celá obrazovka se neotevřela'; }
        knFull(false);
        document.getElementById('kn-typ').value = k; knNova();
        knNapoveda(); knNapoveda(); knNapoveda(); knVyhodnot();
        KN.krok = KN.u.postup.length - 1; knPostup();
        return KN.u.typ === k ? '' : 'průchod se nedostal na ' + k;
      } catch (e) { return 'výjimka: ' + String(e && e.message || e).slice(0, 60); }
    },
  },
  /* Data žáka bez závislosti na stránce (hlavní stránka nenačítá PZ_TOPICS): šest testů, procvičování
     a diagnostika. Není to průchod (nemá `seznam`), jen jedno místo pro naplnění úložiště — používá ho
     `prijimacky-motiv` i `shot-motiv`. */
  'pz-data': {
    pripravit: () => {
      const MAX = [1, 2, 4, 4, 4, 4, 3, 3, 3, 3, 4, 2, 2, 2, 6, 3];
      const att = [30, 34, 38, 41, 36, 44].map((s, i) => ({ date: '2026-0' + (i + 3) + '-10', t: i + 1, score: s, max: 50, cas: 3300,
        ulohy: MAX.map((m, j) => [j === 14 ? 2 : j === 10 ? 3 : m, m, j === 14 ? 'procenta' : j === 10 ? 'geometrie' : null]) }));
      localStorage.setItem('PZ_CERMAT_ATTEMPTS', JSON.stringify(att));
      localStorage.setItem('PZ_PRACTICE_PROGRESS', JSON.stringify({ zlomky: { ok: 2, total: 8 }, geometrie: { ok: 5, total: 9 } }));
      localStorage.setItem('PZ_DIAG_LAST', JSON.stringify({ date: '2026-09-01', ver: 2, ok: 11, n: 20,
        topics: [['zlomky', 3], ['procenta', 1], ['geometrie', 2], ['rovnice', 0]].map(([id, level]) => ({ id, level, correct: level >= 2 })) }));
    },
  },
};
