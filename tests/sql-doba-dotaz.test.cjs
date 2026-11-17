/* ════════════════════════════════════════════════════════════════════════
   Dotaz `tools/sql-doba-v-misich.sql` proti SKUTEČNÉMU PostgreSQL (17. 11. 2026).

   Dotaz čte `data.cas` z postav, které píše ŽÁK — musí tedy přežít cokoli: číslo místo objektu, řetězec místo čísla, záporná čísla,
   cizí klíče (`__proto__`), pole, text místo celé postavy. Jedna poškozená postava nesmí shodit dotaz učiteli za celou třídu
   (stejné poučení jako fáze 19 a 24). Učitelské účty z tabulky `roles` se nepočítají.

   SKIP (exit 0), když v prostředí není PostgreSQL server.
   ════════════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const H = require('./sql-harness.cjs');

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

const why = H.unavailable();
if (why) { console.log('⏭️ SKIP: ' + why); process.exit(0); }

const DOTAZ = fs.readFileSync(path.join(__dirname, '..', 'tools', 'sql-doba-v-misich.sql'), 'utf8');

(async () => {
  console.log('\n── Dotaz na dobu hraní po misích ──\n');
  H.start('pgtestdoba');
  try {
    H.exec(`
      create table public.roles (email text primary key);
      create table public.saves (game text, user_id uuid, email text, data jsonb);
      insert into public.roles values ('ucitel@skola.cz');
      -- p1: splnil dva úkoly v 1-2, odpovídal 10× po 10 s
      insert into public.saves values ('RPG_MAT_9', '00000000-0000-0000-0000-000000000001', 'p1@skola.cz',
        '{"cas":{"1-2":{"s":100,"n":10,"o":2,"d":261117}},"done":{"1-2-0":true,"1-2-1":true}}');
      -- p2: zaseknutý — 4 odpovědi, 3 spuštění, žádný splněný úkol
      insert into public.saves values ('RPG_MAT_9', '00000000-0000-0000-0000-000000000002', 'p2@skola.cz',
        '{"cas":{"1-2":{"s":120.5,"n":4,"o":3,"d":261116}},"done":{}}');
      -- p3: podvržená postava (číslo místo objektu, cizí klíč, řetězec/záporné/null/NaN-like, pole)
      insert into public.saves values ('RPG_MAT_9', '00000000-0000-0000-0000-000000000003', 'p3@skola.cz',
        '{"cas":{"1-2":5,"__proto__":{"s":1,"n":1,"o":1,"d":261117},"1-3":{"s":"x","n":-1,"o":null,"d":"abc"},"2-1":[1,2],"9-9":{"s":99999999999,"n":1.5,"o":"7","d":26111}},"done":"nic"}');
      -- p4: učitel (z tabulky roles) — nesmí se počítat
      insert into public.saves values ('RPG_MAT_9', '00000000-0000-0000-0000-000000000004', 'ucitel@skola.cz',
        '{"cas":{"1-2":{"s":5000,"n":500,"o":50,"d":261117}}}');
      -- p5: cas je řetězec; p6: cela postava je řetězec; p7: cas chybí; p8: jiná hra
      insert into public.saves values ('RPG_MAT_9', '00000000-0000-0000-0000-000000000005', 'p5@skola.cz', '{"cas":"ahoj","done":{"1-2-0":true}}');
      insert into public.saves values ('RPG_MAT_9', '00000000-0000-0000-0000-000000000006', 'p6@skola.cz', '"jen řetězec"');
      insert into public.saves values ('RPG_MAT_9', '00000000-0000-0000-0000-000000000007', 'p7@skola.cz', '{"done":{"1-1-0":true}}');
      insert into public.saves values ('RPG_MAT_8', '00000000-0000-0000-0000-000000000008', 'p8@skola.cz',
        '{"cas":{"1-2":{"s":777,"n":77,"o":7,"d":261117}}}');
    `);

    let chyba = null, radky = [];
    try { radky = H.rows(DOTAZ); } catch (e) { chyba = String(e.message || e).slice(0, 300); }
    ok('dotaz nespadne na poškozených postavách (číslo, řetězec, pole, cizí klíč, text místo postavy)', chyba === null, chyba || '');

    const m12 = radky.find(r => r[0] === '1-2'), m13 = radky.find(r => r[0] === '1-3');
    // sloupce: mise, hracu, spusteni, odpovedi, s_na_odpoved, spusteni_na_hrace, zaseknutych, s_na_odpoved_zaseknutych, posledni_dny
    ok('mise 1-2 je ve výsledku', !!m12, JSON.stringify(radky));
    if (m12) {
      ok('hráčů v 1-2: 3 (p1, p2 a poškozený p3; učitel a jiná hra se nepočítají)', m12[1] === '3', m12[1]);
      ok('spuštění 5 a odpovědí 14 (poškozená čísla se berou jako 0)', m12[2] === '5' && m12[3] === '14', `${m12[2]} / ${m12[3]}`);
      ok('sekund na odpověď = 220,5 / 14 = 15,8', m12[4] === '15.8', m12[4]);
      ok('zaseknutý je jen p2 (p3 bez aktivity se nepočítá, p1 úkoly splnil)', m12[6] === '1', m12[6]);
      ok('sekund na odpověď u zaseknutých = 120,5 / 4 = 30,1', m12[7] === '30.1', m12[7]);
      ok('poslední dny od nejnovějšího', m12[8] === '17.11.×1  16.11.×1', JSON.stringify(m12[8]));
    }
    ok('mise 1-3 (samé nesmysly) = 1 hráč s nulami, ne chyba', !!m13 && m13[1] === '1' && m13[2] === '0' && m13[3] === '0', JSON.stringify(m13));
    const m21 = radky.find(r => r[0] === '2-1'), m99 = radky.find(r => r[0] === '9-9');
    ok('cizí klíč __proto__ mezi misemi není', !radky.some(r => /proto/.test(r[0])), JSON.stringify(radky.map(r => r[0])));
    ok('pole místo záznamu mise = nuly (ne chyba)', !!m21 && m21[2] === '0' && m21[3] === '0', JSON.stringify(m21));
    ok('desetinné n a příliš velké s se odmítnou (odpovědí 0, bez průměru)', !!m99 && m99[3] === '0' && m99[4] === '', JSON.stringify(m99));
    ok('klíče misí mají tvar oblast-mise', radky.every(r => /^[1-9]-[1-9]$/.test(r[0])));
  } finally {
    H.stop();
  }
  console.log(`\n  Dotaz na dobu v misích: ${pass} ✅ / ${fail} ❌\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { H.stop(); } catch (x) {} process.exit(1); });
