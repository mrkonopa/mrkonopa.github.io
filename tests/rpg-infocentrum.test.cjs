/* ══════════════════════════════════════════════════════════════════════
   Infocentrum hodiny — čistá logika (`projects/rpg-infocentrum.js`), autor Vojtěch Konopa.

   Ověřuje se (Node, bez prohlížeče):
     1. jména na plátně: „Anna Nováková“ → „Anna N.“, bez řídicích znaků, prázdné → „Hráč“
     2. postava z uložených dat: úkoly, mise (6 úkolů), oblasti (3 mise), nepřátelský JSON (žák píše `data` sám)
     3. pokrok v hodině: nikdy záporný, žák příchozí později začíná od svého prvního stavu
     4. řazení: úkoly v hodině → mise → abecedně česky; vstup se nemění
     5. události: mise, oblast (nahradí událost své poslední mise), úroveň, odznak; první spatření a reset postavy je neprodukují;
        věty neobsahují sloveso v minulém čase (z jména nepoznáme rod)
     6. automatický cíl hodiny: 10 úkolů na hráče (nejméně 20), po splnění další stupeň, víc stupňů naráz
     7. týmy ze živého souboje (`battle_state`): skóre, jména obou týmů, bez týmového režimu null
     8. ČÍTÁNÍ CHYB: modul nikdy nečte `errs` ani `errsSnap` a výstup žádné chyby nenese
     9. odznaky: každé id z `const ACH=[…]` všech sedmi her má neutrální název v modulu
    10. rychlost: 100 000 nepřátelských klíčů v `done` se zpracuje bez zpomalení (strop klíčů)
   Sabotáže (8): řazení jen abecedně, záporný přírůstek, událost při prvním spatření, oblast bez nahrazení,
   cíl bez minima, čtení chyb, slovesa v minulém čase, strop klíčů pryč.
   Spusť: node tests/rpg-infocentrum.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ZDROJ = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-infocentrum.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
const nacti = src => { const m = { exports: {} }; new Function('module', 'exports', src)(m, m.exports); return m.exports; };

const done = (...misee) => { const o = {}; for (const [mid, n] of misee) for (let i = 0; i < n; i++) o[mid + '-' + i] = true; return o; };
const radek = (uid, jm, d, extra) => Object.assign({ user_id: uid, game: 'RPG_MAT_9', full_name: jm, data: d, updated_at: '2026-11-01T10:00:00Z' }, extra || {});

function kontroly(I, prefix) {
  const p = prefix ? prefix + ': ' : '';
  /* 1 — jména */
  ok(I.kratke('Anna Nováková') === 'Anna N.', p + 'jméno „Anna Nováková“ → „Anna N.“', I.kratke('Anna Nováková'));
  ok(I.kratke('Jan') === 'Jan' && I.kratke('   ') === 'Hráč' && I.kratke(null) === 'Hráč', p + 'jedno slovo zůstane, prázdné je „Hráč“');
  ok(I.kratke('Eva\u0000‮ Černá') === 'Eva Č.', p + 'řídicí znaky a přepínače směru pryč', JSON.stringify(I.kratke('Eva\u0000‮ Černá')));
  ok(Array.from(I.kratke('Bartolomějovskýmegajmeno Novák')).length <= 17, p + 'dlouhé křestní jméno se ořízne');
  ok(I.jmeno({ data: { name: 'NullByte42' } }) === 'NullByte42' && I.jmeno({ full_name: 'Petr Svoboda', data: { name: 'x' } }) === 'Petr S.', p + 'skutečné jméno má přednost před jménem hrdiny');

  /* 2 — postava */
  const s = I.stav(radek('u1', 'Anna Nováková', { xp: 900, level: 12, done: Object.assign(done(['1-1', 6], ['1-2', 6], ['1-3', 6], ['2-1', 4]), { 'x-y-z': true, '9-9-9': true, '1-1-9': true }), ach: { boot: 1, 'ŠPATNĚ!': 1 } }));
  ok(s.ukoly === 22 && s.mise.join() === '1-1,1-2,1-3' && s.oblasti.join() === '1' && s.xp === 900 && s.level === 12, p + 'úkoly, mise, oblasti ze správných klíčů', JSON.stringify(s));
  ok(s.ach.join() === 'boot', p + 'odznak s nepřípustným id se zahodí', s.ach.join());
  ok(I.stav(radek('u2', 'B', { done: done(['3-1', 5]) })).mise.length === 0, p + 'mise s 5 úkoly z 6 není hotová');
  ok(I.stav(radek('u3', 'C', { done: done(['3-1', 6], ['3-2', 6]) })).oblasti.length === 0, p + 'oblast se dvěma misemi ze tří není hotová');
  const zlo = [null, undefined, 5, 'x', [], { done: 'ano' }, { done: [1, 2] }, { xp: 'NaN', level: -5, done: { '1-1-1': 0 } }, { xp: Infinity, level: 1e99, done: null }, { xp: {}, ach: [1, 2] }];
  let pad = null;
  for (const d of zlo) { try { const x = I.stav({ user_id: 'z', game: 'g', data: d }); if (!(x.xp >= 0 && x.level >= 1 && x.ukoly >= 0)) pad = 'hodnoty ' + JSON.stringify(x); } catch (e) { pad = e.message; } }
  ok(pad === null, p + 'nepřátelská data nespadnou a dají rozumná čísla', pad);
  ok(I.stav(radek('x', 'X', { xp: 1e15, level: 1e15 })).xp === 1e6 && I.stav(radek('x', 'X', { xp: 1e15, level: 1e15 })).level === 9999, p + 'xp a úroveň mají strop');

  /* 3 — pokrok v hodině */
  const a0 = I.stav(radek('a', 'Anna Nováková', { xp: 100, done: done(['1-1', 6]) })), a1 = I.stav(radek('a', 'Anna Nováková', { xp: 160, done: done(['1-1', 6], ['1-2', 3]) }));
  const z = I.zaklad([a0]);
  const pr = I.prirustek(a1, z);
  ok(pr.ukoly === 3 && pr.mise === 0 && pr.xp === 60, p + 'přírůstek = nynější − výchozí', JSON.stringify(pr));
  const smazan = I.prirustek(I.stav(radek('a', 'Anna Nováková', { xp: 10, done: {} })), z);
  ok(smazan.ukoly === 0 && smazan.mise === 0 && smazan.xp === 0 && smazan.ach === 0, p + 'smazaná postava nedá záporný přírůstek', JSON.stringify(smazan));
  const nova = I.stav(radek('n', 'Nový Žák', { xp: 500, done: done(['1-1', 6], ['1-2', 6]) }));
  ok(I.prirustek(nova, I.doplnZaklad(I.zaklad([a0]), [nova])).ukoly === 0, p + 'žák příchozí později začíná od svého prvního stavu');
  const zz = I.zaklad([a0]); I.doplnZaklad(zz, [a1]);
  ok(JSON.stringify(zz) === JSON.stringify(I.zaklad([a0])), p + 'doplnění výchozího stavu nepřepíše existující záznam');

  /* 4 — řazení */
  const mk = (jm, uk, mi, uid) => ({ jmeno: jm, uid: uid || jm, prir: { ukoly: uk, mise: mi, oblasti: 0, xp: 0, ach: 0 } });
  const vstup = [mk('Dana', 5, 0), mk('Čeněk', 5, 0), mk('Eva', 9, 1), mk('Adam', 5, 2), mk('Zuzana', 0, 0)];
  const kopie = JSON.stringify(vstup);
  const ser = I.seradit(vstup).map(h => h.jmeno).join();
  ok(ser === 'Eva,Adam,Čeněk,Dana,Zuzana', p + 'řazení: úkoly → mise → abecedně česky (Č před D)', ser);
  ok(JSON.stringify(vstup) === kopie, p + 'řazení nemění vstup');

  /* 5 — události */
  const prv = I.stav(radek('e', 'Eva Malá', { level: 4, done: done(['2-1', 6], ['2-2', 6], ['2-3', 5]), ach: { boot: 1 } }));
  const pam = I.pamet([prv]);
  const po = I.stav(radek('e', 'Eva Malá', { level: 5, done: done(['2-1', 6], ['2-2', 6], ['2-3', 6]), ach: { boot: 1, crit: 1 } }));
  const ev = I.udalosti(pam, [po]);
  ok(ev.map(e => e.typ).join() === 'oblast,uroven,odznak', p + 'dokončená oblast nahradí událost své poslední mise; úroveň a odznak se přidají', ev.map(e => e.typ).join());
  const po2 = I.stav(radek('e', 'Eva Malá', { level: 4, done: done(['2-1', 6], ['2-2', 6], ['2-3', 5], ['3-1', 6]), ach: { boot: 1 } }));
  ok(I.udalosti(pam, [po2]).map(e => e.typ + ':' + e.mise).join() === 'mise:3-1', p + 'splněná mise bez dokončené oblasti je obyčejná událost');
  ok(I.udalosti({}, [po]).length === 0, p + 'první spatření žáka nedá žádnou událost');
  const reset = I.stav(radek('e', 'Eva Malá', { level: 1, done: {} }));
  ok(I.udalosti(pam, [reset]).length === 0, p + 'resetovaná postava (méně než dřív) nedá událost');
  const vety = ev.concat(I.udalosti(pam, [po2])).map(e => I.text(e, { '3-1': 'Prvočísla' }));
  ok(vety.every(v => /^Eva M\. — /.test(v)), p + 'věty začínají zkráceným jménem', vety.join(' | '));
  ok(!vety.some(v => /\b\w+(l|la|lo|li)\b —/.test(v)) && !/(dokonči|získa|splni|dosáhl)l/i.test(vety.join(' ')), p + 'věty nemají sloveso v minulém čase (rod ze jména neznáme)', vety.join(' | '));
  ok(I.text({ typ: 'odznak', jmeno: 'A', odznak: 'neexistuje' }) === 'A — odznak „nový odznak“', p + 'neznámý odznak má obecný název');
  ok(I.ukolu(1) === '1 úkol' && I.ukolu(3) === '3 úkoly' && I.ukolu(5) === '5 úkolů' && I.misi(2) === '2 mise' && I.misi(7) === '7 misí', p + 'skloňování úkolů a misí');

  /* 6 — cíl hodiny */
  const c0 = I.novyCil(11);
  ok(c0.krok === 110 && c0.stupen === 1, p + 'cíl = 10 úkolů na hráče ve hře', JSON.stringify(c0));
  ok(I.novyCil(0).krok === 20 && I.novyCil(1).krok === 20 && I.novyCil(3).krok === 30, p + 'cíl má minimum 20 úkolů');
  const r1 = I.posun(c0, 77, 11);
  ok(!r1.postoupila && r1.vStupni === 77 && r1.cil.stupen === 1, p + 'před splněním stupeň zůstane', JSON.stringify(r1));
  const r2 = I.posun(c0, 112, 9);
  ok(r2.postoupila && r2.cil.stupen === 2 && r2.cil.zaklad === 110 && r2.cil.krok === 90 && r2.vStupni === 2, p + 'po splnění další stupeň a cíl se přepočte podle hráčů', JSON.stringify(r2));
  const r3 = I.posun(c0, 400, 11);
  ok(r3.cil.stupen >= 4 && r3.vStupni <= r3.cil.krok, p + 'víc stupňů naráz se projde, ale smyčka je omezená', JSON.stringify(r3));
  ok(I.posun(c0, -50, 11).vStupni === 0 && I.posun(c0, NaN, 11).cil.stupen === 1, p + 'záporný nebo neplatný součet cíl neposune');

  /* 7 — týmy */
  const st = { battle: { team_mode: true }, teams: { 0: 5120, 1: 4380 }, players: [{ team: 0, display_name: 'Anna Nováková' }, { team: 1, display_name: 'Adam H' }, { team: 0, display_name: 'Tomáš Bílý' }, { team: null, display_name: 'Host' }, null] };
  const t = I.tymy(st);
  ok(t && t.skore.join() === '5120,4380' && t.modry.join() === 'Anna N.,Tomáš B.' && t.cerveny.join() === 'Adam H.', p + 'týmy: skóre a jména obou týmů', JSON.stringify(t));
  ok(I.tymy({ battle: { team_mode: false }, teams: null, players: [] }) === null && I.tymy(null) === null && I.tymy({}) === null, p + 'bez týmového režimu je null');
  ok(I.tymy({ battle: { team_mode: true }, teams: { 0: 'x', 1: -3 } }).skore.join() === '0,0', p + 'nesmyslné skóre týmu je 0');
}

/* 8 — chyby se nikdy nečtou */
function bezChyb() {
  const kod = ZDROJ.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  ok(!/errs|errsSnap/.test(kod), 'modul nikdy nečte počty chyb (errs, errsSnap)', (kod.match(/errs\w*/g) || []).join());
  const I = nacti(ZDROJ), s = I.stav(radek('u', 'A B', { errs: { '1-1': 9 }, errsSnap: [{ t: 1, errs: { '1-1': 9 } }], done: done(['1-1', 6]) }));
  ok(!JSON.stringify(s).includes('errs') && !Object.keys(s).some(k => /err|chyb/i.test(k)), 'výstup postavy žádné chyby nenese', Object.keys(s).join());
  ok(!JSON.stringify(I.prirustek(s, I.zaklad([s]))).match(/err|chyb/i), 'přírůstek žádné chyby nenese');
}

/* 9 — odznaky ze všech sedmi her */
function odznaky() {
  const I = nacti(ZDROJ);
  let celkem = 0, chybi = [];
  for (const g of [3, 4, 5, 6, 7, 8, 9]) {
    const html = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-mat-' + g + '.html'), 'utf8');
    const blok = /const ACH=\[([\s\S]*?)\n\];/.exec(html);
    const ids = blok ? (blok[1].match(/\{id:'([a-z0-9_-]+)'/g) || []).map(x => x.slice(5, -1)) : [];
    celkem += ids.length;
    for (const id of ids) if (!I.ODZNAKY[id]) chybi.push('g' + g + ':' + id);
  }
  ok(celkem >= 7 * 15, 'našlo se aspoň 105 odznaků ve sedmi hrách (naměřeno při psaní: ' + celkem + ')', String(celkem));
  ok(celkem === 7 * 19, 'každá hra má 19 odznaků (naměřeno při psaní); jiný počet = zkontroluj, jestli se parsuje celé pole', String(celkem));
  ok(chybi.length === 0, 'každý odznak ze hry má neutrální název v modulu', chybi.slice(0, 6).join(' '));
}

/* 10 — rychlost a strop: 100 000 cizích klíčů a ZA nimi platné klíče */
function hostilni(I) {
  const velke = {};
  for (let i = 0; i < 100000; i++) velke['cizi-' + i] = true;
  for (let i = 0; i < 6; i++) velke['1-1-' + i] = true;
  const t0 = process.hrtime.bigint();
  const s = I.stav(radek('v', 'V', { done: velke }));
  return { ukoly: s.ukoly, ms: Number(process.hrtime.bigint() - t0) / 1e6 };
}
function rychlost() {
  const I = nacti(ZDROJ);
  const s = hostilni(I);
  ok(s.ms < 50, '100 000 nepřátelských klíčů se zpracuje do 50 ms', s.ms.toFixed(1) + ' ms');
  ok(s.ukoly === 0, 'uložení s tisíci cizími klíči se nepočítá (platných klíčů je nejvýš 126; platné klíče až ZA strop se ignorují)', String(s.ukoly));
  ok(I.stav(radek('v', 'V', { done: done(['1-1', 6], ['7-3', 6]) })).ukoly === 12, 'běžné uložení pod stropem se počítá celé');
}

console.log('\n── Infocentrum hodiny: logika ──\n');
const I = nacti(ZDROJ);
kontroly(I, '');
bezChyb(); odznaky(); rychlost();

/* ── sabotáže: každá musí shodit aspoň jednu kontrolu ── */
function sabotaz(jm, zmena, rx) {
  const nove = zmena(ZDROJ);
  ok(nove !== ZDROJ, 'sabotáž „' + jm + '“ se aplikovala');
  if (nove === ZDROJ) return;
  const f0 = fail, vypis = console.log; const hlasky = [];
  console.log = (...a) => hlasky.push(a.join(' '));
  const p0 = pass;
  try { kontroly(nacti(nove), 'S'); rychlost2(nove); } catch (e) { hlasky.push('  ❌ výjimka ' + e.message); fail++; }
  console.log = vypis;
  const chyceno = fail > f0;
  const zachyceno = hlasky.some(h => rx.test(h)) || (chyceno && !rx);
  fail = f0; pass = p0;                                             // sabotovaný běh se do výsledku nepočítá
  ok(chyceno && zachyceno, 'sabotáž „' + jm + '“ je chycena', hlasky[0] || 'prošla bez nálezu');
}
function rychlost2(src) {
  const s = hostilni(nacti(src));
  ok(s.ukoly === 0, 'S: uložení s tisíci cizími klíči se nepočítá (strop)', String(s.ukoly));
}
sabotaz('řazení jen abecedně', s => s.replace('(b.prir.ukoly - a.prir.ukoly) || (b.prir.mise - a.prir.mise) || CS.compare(a.jmeno, b.jmeno)', 'CS.compare(a.jmeno, b.jmeno)'), /řazení/);
sabotaz('záporný přírůstek', s => s.replace('Math.max(0, a - (Number(c) || 0))', 'a - (Number(c) || 0)'), /záporný přírůstek/);
sabotaz('událost při prvním spatření', s => s.replace('if (!p) continue;', 'if (!p) { ven.push({ typ: \'uroven\', uid: s.uid, jmeno: s.jmeno, level: s.level }); continue; }'), /první spatření/);
sabotaz('oblast bez nahrazení', s => s.replace('if (noveOblasti.indexOf(Number(m.split(\'-\')[0])) >= 0) continue;', ''), /nahradí událost/);
sabotaz('cíl bez minima', s => s.replace('Math.max(MIN_KROK, UKOLU_NA_HRACE', 'Math.max(0, UKOLU_NA_HRACE'), /minimum 20/);
sabotaz('slovesa v minulém čase', s => s.replace("' splněna'", "' dokončila'"), /minulém čase/);
sabotaz('strop klíčů pryč', s => s.replace('if (++n > MAX_KLICU) break;', ''), /strop/);

/* sabotáž „čtení chyb“ se chytá samostatnou kontrolou zdroje (stejné pravidlo jako bezChyb) */
{
  const nove = ZDROJ.replace('const poMisich = {};', 'const poMisich = {}; const chyb = Object.keys(obj(d.errs)).length; void chyb;');
  const kod = nove.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  ok(/errs|errsSnap/.test(kod), 'sabotáž „čtení chyb“ je chycena zdrojovou kontrolou');
}

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
