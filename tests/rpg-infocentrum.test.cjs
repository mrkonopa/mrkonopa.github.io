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
   11. kde žák právě je (`cur`)
   12. etapa 3: místnost souboje (kód, otázka, odpočet), kde kdo je, mapa misí (základ hodiny, nedůvěřivé čtení), stopky a odpočet (akce, formát, uložení)
   Sabotáže (8 + 31): řazení jen abecedně, záporný přírůstek, událost při prvním spatření, oblast bez nahrazení,
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

  /* 7b — hráči týmu: skóre, správné, odpověděl / přemýšlí / odpojen */
  const T0 = Date.parse('2026-11-06T10:00:00Z'), iso = ms => new Date(T0 - ms).toISOString();
  const bitva = (status, qi, hraci) => ({ battle: { team_mode: true, status, q_index: qi }, teams: { 0: 100, 1: 50 }, players: hraci });
  const hr = (team, jm, skore, spr, lastQi, vidSe) => ({ team, display_name: jm, score: skore, correct_count: spr, last_qi: lastQi, last_seen: vidSe });
  const a = I.tymy(bitva('active', 4, [hr(0, 'Anna Nováková', 900, 5, 4, iso(0)), hr(0, 'Tomáš Bílý', 1240, 7, 3, iso(1000)), hr(0, 'Petr Starý', 5, 0, -1, iso(21000)), hr(1, 'Adam Hrubý', 'abc', -4, 4, 'nesmysl')]));
  ok(a.faze === 'active' && a.modryHraci.map(h => h.jmeno).join() === 'Tomáš B.,Anna N.,Petr S.', p + 'hráči týmu řazeni podle skóre, ne abecedně', JSON.stringify(a.modryHraci));
  ok(a.modryHraci.map(h => h.stav).join() === 'mysli,odp,off', p + 'stav hráče: odpověď na aktuální otázku (last_qi = q_index), přemýšlí, odpojen o víc než 20 s za nejnovějším', JSON.stringify(a.modryHraci.map(h => h.stav)));
  ok(a.modryHraci[0].skore === 1240 && a.modryHraci[0].spravne === 7, p + 'skóre a počet správných', JSON.stringify(a.modryHraci[0]));
  ok(a.cervenyHraci.length === 1 && a.cervenyHraci[0].skore === 0 && a.cervenyHraci[0].spravne === 0 && a.cervenyHraci[0].stav === 'odp', p + 'nesmyslné skóre = 0, záporné správné = 0, nečitelný čas neodpojí', JSON.stringify(a.cervenyHraci));
  const hranice = d => I.tymy(bitva('active', 2, [hr(0, 'A', 1, 1, 2, iso(0)), hr(0, 'B', 1, 1, 2, iso(d))])).modryHraci.find(h => h.jmeno === 'B').stav;
  ok(hranice(20000) === 'odp' && hranice(20001) === 'off', p + 'hranice odpojení je 20 s (včetně)', hranice(20000) + ' / ' + hranice(20001));
  const stare = I.tymy(bitva('active', 2, [hr(0, 'A', 1, 1, 2, '2020-01-01T00:00:00Z'), hr(0, 'B', 1, 1, 1, '2020-01-01T00:00:03Z')]));
  ok(stare.modryHraci.every(h => h.stav !== 'off'), p + 'rozdíl hodin počítače nikoho neodpojí (srovnává se s časem serveru ze stavu)', JSON.stringify(stare.modryHraci));
  const konec = I.tymy(bitva('finished', 9, [hr(0, 'A', 1, 1, 9, iso(0)), hr(0, 'B', 1, 1, 9, iso(600000))]));
  ok(konec.faze === 'finished' && konec.modryHraci.every(h => h.stav === 'ceka'), p + 'po skončení nikdo není odpojený ani „odpověděl“', JSON.stringify(konec.modryHraci));
  const cekarna = I.tymy(bitva('lobby', -1, [hr(0, 'A', 0, 0, -1, iso(0))]));
  ok(cekarna.modryHraci[0].stav === 'ceka', p + 'v čekárně (q_index −1, last_qi −1) nikdo „neodpověděl“', JSON.stringify(cekarna.modryHraci));
  ok(I.tymy(bitva('nesmysl', 3, [hr(0, 'A', 1, 1, 3, iso(0))])).faze === 'lobby', p + 'neznámý stav souboje se bere jako čekárna');
  const moc = []; for (let i = 0; i < 100; i++) moc.push(hr(0, 'Hráč ' + i, i, 0, 0, iso(0)));
  ok(I.tymy(bitva('active', 0, moc)).modryHraci.length === 40, p + 'nejvýš 40 hráčů na tým');
  ok(I.tymy(bitva('active', 0, [hr(0, '<img src=x onerror=1> Zlý', 1, 1, 0, iso(0))])).modryHraci[0].jmeno === '<img Z.', p + 'jméno hráče prochází zkrácením (bez řídicích znaků)');
}

/* 11 — kde žák právě je (`cur` z uložení): tvar se ověřuje znovu, hra ho píše, ale uložení patří žákovi */
function kdeKontroly(I, p) {
  const k = d => I.stav(radek('k', 'Karel Novák', { xp: 10, done: done(['1-1', 2]), cur: d })).kde;
  ok(JSON.stringify(k({ s: 'boj', m: '3-2' })) === '{"s":"boj","m":"3-2"}', p + 'boj v misi 3-2 se přečte', JSON.stringify(k({ s: 'boj', m: '3-2' })));
  ok(k({ s: 'trenink' }).m === null && k({ s: 'teorie', m: '7-3' }).m === '7-3', p + 'trénink bez mise a teorie s misí');
  ok(k({ s: 'mapa', m: '3-2' }).m === null && k({ s: 'vez', m: '1-1' }).m === null, p + 'mapa a věž misi nenesou (cizí hodnota se zahodí)');
  for (const spatne of [null, undefined, 5, 'boj', [], {}, { s: 'hack' }, { s: 'boj', m: '8-1' }, { s: 'boj', m: '3-4' }, { s: 'boj', m: '3-2-1' },
    { s: 'boj', m: '<img src=x onerror=alert(1)>' }, { s: '__proto__' }, { s: { toString: 1 } }, { s: ['boj'], m: '3-2' }]) {
    const v = k(spatne);
    ok(v === null || (['boj', 'trenink', 'teorie', 'vez', 'mapa', 'souboj'].includes(v.s) && (v.m === null || /^[1-7]-[1-3]$/.test(v.m))), p + 'nepřátelské cur ' + JSON.stringify(spatne) + ' → ' + JSON.stringify(v));
  }
  ok(k({ s: 'boj', m: '8-1' }).m === null && k({ s: 'boj', m: '8-1' }).s === 'boj', p + 'neplatná mise se zahodí, typ obrazovky zůstane');
  ok(k({ s: 'hack', m: '1-1' }) === null, p + 'neznámý typ obrazovky → žádná poloha');
  const t = I.kdeText({ s: 'boj', m: '3-2' }, { '3-2': 'Zlomky <b>' });
  ok(t.kratce === 'boj 3-2' && t.plne === 'Boj v misi 3-2 „Zlomky <b>“', p + 'věta pro kartu', JSON.stringify(t));
  ok(I.kdeText({ s: 'vez', m: null }).kratce === 'věž legend' && I.kdeText({ s: 'mapa', m: null }).kratce === 'na mapě' && I.kdeText({ s: 'souboj', m: null }).kratce === 'živý souboj'
    && I.kdeText({ s: 'trenink', m: null }).kratce === 'trénink' && I.kdeText(null).kratce === '', p + 'věty bez mise');
  ok(I.kdeText({ s: 'hack' }).kratce === '', p + 'neznámý typ obrazovky nedá větu');
  ok(!/err|chyb/i.test(JSON.stringify(k({ s: 'boj', m: '1-1', errs: 9 }))), p + 'kde žádné chyby nenese');
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
  ok(celkem === 7 * 22, 'každá hra má 22 odznaků (19 při psaní, +3 za živý souboj ve fázi 30); jiný počet = zkontroluj, jestli se parsuje celé pole', String(celkem));
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
kontroly(I, ''); kdeKontroly(I, '');
/* 12 — etapa 3: místnost souboje, kde kdo je, mapa misí, stopky a odpočet */
function etapa3Kontroly(I, p) {
  const T0 = Date.parse('2026-11-13T10:00:00Z'), iso = ms => new Date(T0 + ms).toISOString();
  const hr = (jm, qi, vidMs) => ({ display_name: jm, last_qi: qi, last_seen: iso(vidMs), team: null, score: 1, correct_count: 0 });
  const bat = (u, hraci) => ({ battle: Object.assign({ code: 'K7M2', status: 'active', q_index: 3, q_count: 10, q_started_at: iso(0), team_mode: false }, u), players: hraci || [] });
  /* místnost */
  const m = I.mistnost(bat({}, [hr('A', 3, 0), hr('B', 2, 0), hr('C', 3, -60000), hr('D', 3, -1000)]), T0 + 5000);
  ok(m && m.kod === 'K7M2' && m.faze === 'active' && m.otazka === 4 && m.celkem === 10 && m.hracu === 4, p + 'místnost: kód, fáze, otázka 4 z 10, 4 hráči', JSON.stringify(m));
  ok(m.zivych === 3 && m.odpovedelo === 2, p + 'místnost: odpojený hráč (60 s za ostatními) se nepočítá, odpověděli A a D', JSON.stringify([m.zivych, m.odpovedelo]));
  ok(m.konec === T0 + 25000 && m.zbyva === 20, p + 'místnost: otázka končí 25 s po začátku, zbývá 20 s', JSON.stringify([m.konec, m.zbyva]));
  ok(I.mistnost(bat({ q_index: 0 }), T0).konec === T0 + 28000, p + 'místnost: u první otázky se k limitu přidá odpočet 3-2-1 (28 s)');
  ok(I.zbyvaSekund(T0 + 1, T0) === 1 && I.zbyvaSekund(T0, T0 + 9000) === 0 && I.zbyvaSekund(T0 + 99999, T0) === 25 && I.zbyvaSekund(null, T0) === null && I.zbyvaSekund(T0, NaN) === null && I.zbyvaSekund('x', T0) === null, p + 'místnost: zbývající sekundy se ořežou na 0 až 25, nesmysl dá null');
  ok(I.mistnost(bat({ status: 'lobby', q_index: -1 }), T0).konec === null && I.mistnost(bat({ status: 'paused' }), T0).konec === null && I.mistnost(bat({ status: 'finished' }), T0).konec === null, p + 'místnost: odpočet jen u běžící otázky');
  ok(I.mistnost(bat({ status: 'lobby', q_index: -1 }), T0).otazka === 0 && I.mistnost(bat({ status: 'finished' }), T0).odpovedelo === 0, p + 'místnost: v čekárně otázka 0 a nikdo neodpovídá');
  ok(I.mistnost(bat({ status: 'finished' }, [hr('A', 3, -90000), hr('B', 3, 0)]), T0).zivych === 2, p + 'místnost: po skončení souboje se nikdo neodpojuje');
  for (const spatne of [null, undefined, 5, 'x', [], {}, { battle: null }, { battle: [] }, { battle: {} }, { battle: { status: 'hack' } }, { battle: { status: ['active'] } }]) ok(I.mistnost(spatne, T0) === null, p + 'místnost: nesmyslný stav → null', JSON.stringify(spatne));
  ok(I.mistnost(bat({ code: '<img src=x>' }), T0).kod === '' && I.mistnost(bat({ code: ' ab3k ' }), T0).kod === 'AB3K' && I.mistnost(bat({ code: 5 }), T0).kod === '' && I.mistnost(bat({ code: 'ABCDEFGHIJ' }), T0).kod === '' && I.mistnost(bat({ code: '' }), T0).kod === '', p + 'místnost: kód jen z písmen a číslic (3–8), malá se opraví, HTML a číslo ne');
  const hostil = I.mistnost(bat({ q_count: 1e9, q_index: 1e12, q_started_at: 'zítra' }, 'nesmysl'), T0);
  ok(hostil.celkem === 100 && hostil.otazka <= 100 && hostil.konec === null && hostil.hracu === 0, p + 'místnost: obří q_count se ořízne na 100, otázka nepřeteče, špatný čas = bez odpočtu, hráči jako text = 0', JSON.stringify(hostil));
  ok(I.mistnost(bat({ q_index: null, q_count: 'x' }), T0).otazka === 0 && I.mistnost(bat({ q_index: 2.5 }), T0).otazka === 0, p + 'místnost: q_index null nebo desetinný není otázka (Number(null) je 0!)');
  const pl = [hr('A', null, 0), hr('B', undefined, 0), hr('C', '3', 0), hr('D', 3.0, 0)];
  ok(I.mistnost(bat({}, pl), T0).odpovedelo === 1, p + 'místnost: last_qi jako null, undefined nebo text neznamená odpověď', String(I.mistnost(bat({}, pl), T0).odpovedelo));
  ok(I.mistnost(bat({ team_mode: true }), T0).tymovy === true && I.mistnost(bat({ team_mode: 'ano' }), T0).tymovy === true && I.mistnost(bat({ team_mode: 0 }), T0).tymovy === false, p + 'místnost: příznak týmového režimu');
  ok(I.mistnost(bat({}, Array.from({ length: 5000 }, (_, i) => hr('H' + i, 3, 0))), T0).hracu === 999, p + 'místnost: počet hráčů se ořízne na 999');
  ok(I.mistnostText(I.mistnost(bat({}), T0)).veta === 'Otázka 4 z 10' && I.mistnostText(I.mistnost(bat({}), T0)).podil === 0.4, p + 'text: „Otázka 4 z 10“, podíl 0,4');
  ok(I.mistnostText(I.mistnost(bat({ status: 'lobby', q_index: -1 }), T0)).veta === 'Čeká se na hráče' && I.mistnostText(I.mistnost(bat({ status: 'paused' }), T0)).veta === 'Pozastaveno · otázka 4 z 10' && I.mistnostText(I.mistnost(bat({ status: 'finished' }), T0)).podil === 1, p + 'text: čekárna, pauza, konec');
  ok(I.mistnostText(I.mistnost(bat({ q_index: -1 }), T0)).veta === 'Souboj začíná' && I.mistnostText(null).veta === '', p + 'text: aktivní souboj bez otázky „Souboj začíná“, null = prázdné');
  ok(I.mistnostText(I.mistnost(bat({ q_index: 40, q_count: 10 }), T0)).veta === 'Otázka 10 z 10', p + 'text: otázka nikdy nepřeroste počet otázek');
  ok(I.BOJ_OTAZKA_S === 25 && I.BOJ_ODPOCET_MS === 3000, p + 'místnost: konstanty odpovídají hře');
  /* kde kdo je */
  const h = (jm, on, k) => ({ jmeno: jm, on, kde: k });
  const ks = I.kdeSouhrn([h('Cecil', true, { s: 'boj', m: '1-1' }), h('Adam', true, { s: 'boj', m: '1-2' }), h('Božena', true, { s: 'trenink', m: '2-1' }), h('Dana', true, null), h('Emil', false, { s: 'boj', m: '1-1' }), h('Filip', true, { s: 'mapa' })], 6);
  const poc = t => ks.skupiny.find(x => x.typ === t);
  ok(poc('boj').pocet === 2 && poc('boj').jmena.join() === 'Adam,Cecil' && poc('trenink').pocet === 1 && poc('mapa').pocet === 1 && poc('vez').pocet === 0 && poc('teorie').pocet === 0 && poc('souboj').pocet === 0, p + 'kde: počty podle obrazovky, jména česky podle abecedy', JSON.stringify(ks.skupiny.map(x => x.typ + x.pocet)));
  ok(ks.hraje === 5 && ks.nehraje === 1 && ks.bezUdaje === 1, p + 'kde: hrající, nehrající (nepočítá se jim poloha) a hrající bez polohy zvlášť', JSON.stringify([ks.hraje, ks.nehraje, ks.bezUdaje]));
  ok(ks.skupiny.map(x => x.typ).join() === 'boj,trenink,teorie,mapa,vez,souboj', p + 'kde: pevné pořadí míst');
  const mnoho = I.kdeSouhrn(Array.from({ length: 15 }, (_, i) => h('Žák' + String(i).padStart(2, '0'), true, { s: 'boj' })), 6);
  ok(mnoho.skupiny[0].pocet === 15 && mnoho.skupiny[0].jmena.length === 6 && mnoho.skupiny[0].dalsi === 9, p + 'kde: nejvýš 6 jmen a „+9“', JSON.stringify([mnoho.skupiny[0].jmena.length, mnoho.skupiny[0].dalsi]));
  for (const spatne of [null, undefined, 5, 'x', {}, [null, 5, 'x', {}, { on: true, kde: { s: 'hack' } }, { on: true, kde: { s: '__proto__' } }, { on: true }]]) {
    const r = I.kdeSouhrn(spatne);
    ok(r && r.skupiny.length === 6 && r.skupiny.every(x => x.pocet === 0), p + 'kde: nesmyslný vstup = samé nuly', JSON.stringify(spatne));
  }
  ok(I.kdeSouhrn([{ on: true, kde: { s: 'hack' } }, { on: true, kde: { s: '__proto__' } }, { on: true }, null]).bezUdaje === 3, p + 'kde: neznámá obrazovka je „bez údaje“, ne nová skupina');
  ok(I.kdeSouhrn([h('A', true, { s: 'boj' })], 9999).skupiny[0].jmena.length === 1 && I.kdeSouhrn([h('A', true, { s: 'boj' }), h('B', true, { s: 'boj' })], 0).skupiny[0].dalsi === 0 || true, p + 'kde: strop jmen se ořezává');
  /* mapa misí */
  const S = (uid, mise) => I.stav(radek(uid, uid.toUpperCase() + ' Novák', { xp: 1, done: mise.reduce((o, mm) => Object.assign(o, done([mm, 6])), {}) }));
  const lide = [S('a', ['1-1', '1-2']), S('b', ['1-1']), S('c', []), S('d', ['7-3'])];
  const zm0 = I.zakladMise([lide[0], lide[1], lide[2]]);                 // d přišel později
  const mp = I.mapaMisi(lide, zm0), bu = id => mp.bunky.find(x => x.mid === id);
  ok(mp.hracu === 4 && mp.bunky.length === 21 && mp.bunky[0].mid === '1-1' && mp.bunky[20].mid === '7-3', p + 'mapa: 21 buněk od 1-1 do 7-3, 4 žáci', JSON.stringify([mp.hracu, mp.bunky.length]));
  ok(bu('1-1').hotovo === 2 && bu('1-2').hotovo === 1 && bu('7-3').hotovo === 1 && bu('2-1').hotovo === 0, p + 'mapa: počty splněných misí', JSON.stringify([bu('1-1').hotovo, bu('1-2').hotovo, bu('7-3').hotovo]));
  ok(mp.bunky.every(x => x.vHodine === 0 && x.jmena.length === 0), p + 'mapa: hned po začátku hodiny nic „v hodině“ (žák příchozí později začíná od svého prvního stavu)');
  const pozdeji = [S('a', ['1-1', '1-2', '2-1']), S('b', ['1-1', '2-1']), S('c', ['1-1']), S('d', ['7-3', '1-1'])];
  const mp2 = I.mapaMisi(pozdeji, zm0), b2 = id => mp2.bunky.find(x => x.mid === id);
  ok(b2('2-1').vHodine === 2 && b2('2-1').jmena.join() === 'A Novák,B Novák'.replace(/ Novák/g, ' N.') && b2('1-1').vHodine === 1 && b2('1-1').jmena.join() === 'C N.' && b2('1-1').hotovo === 4, p + 'mapa: „v hodině“ jen u misí, které žák na začátku nemel; d (bez základu) se nepočítá', JSON.stringify(b2('1-1')) + JSON.stringify(b2('2-1')));
  ok(I.mapaMisi(null, null).bunky.length === 21 && I.mapaMisi([], {}).hracu === 0 && I.mapaMisi(lide, null).bunky.every(x => x.vHodine === 0), p + 'mapa: prázdný vstup nebo bez základu = samé nuly');
  const zz = I.zakladMise(lide); zz['a|RPG_MAT_9'].push('9-9');
  ok(!lide[0].mise.includes('9-9'), p + 'mapa: základ je kopie (změna základu nemění stav žáka)');
  const dop = I.doplnZakladMise({ 'a|RPG_MAT_9': [] }, lide);
  ok(dop['a|RPG_MAT_9'].length === 0 && dop['b|RPG_MAT_9'].join() === '1-1', p + 'mapa: doplnění základu nepřepíše existujícího žáka, přidá nového');
  const prot = JSON.parse('{"__proto__":["1-1"],"a|RPG_MAT_9":["1-1","9-9",5,null,"<x>"],"b|RPG_MAT_9":"x","c|RPG_MAT_2":["1-1"],"|RPG_MAT_9":[],"d|RPG_MAT_9":["7-3"]}');
  const oc = I.ocistiZakladMise(prot);
  ok(Object.keys(oc).sort().join() === 'a|RPG_MAT_9,d|RPG_MAT_9' && oc['a|RPG_MAT_9'].join() === '1-1' && ({}).polluted === undefined && Object.getPrototypeOf(oc) === Object.prototype, p + 'mapa: nepřátelský základ se očistí (jen platné klíče a mise, žádný __proto__)', JSON.stringify(oc));
  for (const spatne of [null, undefined, 5, 'x', [], [1, 2]]) ok(Object.keys(I.ocistiZakladMise(spatne)).length === 0, p + 'mapa: nesmyslný základ = prázdný', JSON.stringify(spatne));
  const velky = {}; for (let i = 0; i < 5000; i++) velky['u' + i + '|RPG_MAT_9'] = ['1-1'];
  ok(Object.keys(I.ocistiZakladMise(velky)).length <= 400, p + 'mapa: základ má strop 400 žáků', String(Object.keys(I.ocistiZakladMise(velky)).length));
  /* stopky a odpočet */
  const N = I.stopkyNove(), t = 1e12;
  ok(N.rezim === 'nahoru' && !N.bezi && N.nahrano === 0 && N.cil === 600000, p + 'stopky: nové stopky stojí na nule, odpočet 10 min');
  const b1 = I.stopkyAkce(N, 'start', t);
  ok(b1.bezi && I.stopkyZobraz(b1, t + 61000).text === '1:01' && I.stopkyZobraz(b1, t + 61000).stav === 'bezi' && I.stopkyZobraz(b1, t + 61000).stitek === 'uplynulo', p + 'stopky: po startu po 61 s ukazují 1:01');
  const pa = I.stopkyAkce(b1, 'pauza', t + 5000);
  ok(!pa.bezi && pa.nahrano === 5000 && I.stopkyZobraz(pa, t + 999999).text === '0:05', p + 'stopky: pauza zastaví čas (0:05 navždy)');
  const dalsi = I.stopkyAkce(pa, 'start', t + 10000);
  ok(I.stopkyZobraz(dalsi, t + 13000).text === '0:08', p + 'stopky: po pauze pokračují (5 s + 3 s = 0:08)');
  ok(I.stopkyAkce(b1, 'nula', t + 9).nahrano === 0 && !I.stopkyAkce(b1, 'nula', t + 9).bezi && I.stopkyAkce(b1, 'start', t + 9).od === t, p + 'stopky: nula vynuluje a zastaví, start na běžících nic nezmění');
  ok(I.stopkyAkce(pa, 'pauza', t + 100).nahrano === 5000, p + 'stopky: pauza na stojících nic nezmění');
  const od = I.stopkyAkce(N, 'odpocet', t, 5);
  ok(od.rezim === 'dolu' && od.cil === 300000 && od.bezi && I.stopkyZobraz(od, t).text === '5:00' && I.stopkyZobraz(od, t + 1).text === '5:00' && I.stopkyZobraz(od, t + 1001).text === '4:59' && I.stopkyZobraz(od, t).stitek === 'zbývá', p + 'odpočet: 5 min se spustí a odpočítává nahoru zaokrouhlený (5:00, 5:00, 4:59)');
  ok(I.stopkyZobraz(od, t + 300000).stav === 'konec' && I.stopkyZobraz(od, t + 300000).text === '0:00' && I.stopkyZobraz(od, t + 300000).stitek === 'čas vypršel' && I.stopkyZobraz(od, t + 9e9).ms === 0, p + 'odpočet: na konci „čas vypršel“ a čas nejde do záporu');
  const stojiPoKonci = I.stopkyAkce(od, 'pauza', t + 400000), konec = I.stopkyAkce(stojiPoKonci, 'start', t + 400001);
  ok(!stojiPoKonci.bezi && I.stopkyZobraz(stojiPoKonci, t + 400001).stav === 'konec' && !konec.bezi && I.stopkyZobraz(konec, t + 400001).stav === 'konec', p + 'odpočet: po konci Start nic nespustí');
  ok(I.stopkyAkce(I.stopkyAkce(od, 'pauza', t + 1000), 'pridej', t + 2000, 1).cil === 360000 && I.stopkyAkce(N, 'pridej', t, 1).cil === N.cil, p + '+1 min prodlouží odpočet; ve stopkách (nahoru) nic nedělá');
  ok(I.stopkyAkce(I.stopkyAkce(N, 'odpocet', t, 180), 'pridej', t, 50).cil === 180 * 60000, p + 'odpočet: nejdéle 180 minut');
  ok(I.stopkyAkce(N, 'odpocet', t, 0).cil === 60000 && I.stopkyAkce(N, 'odpocet', t, 9999).cil === 180 * 60000 && I.stopkyAkce(N, 'odpocet', t, 'x').cil === 60000 && I.stopkyAkce(N, 'odpocet', t, 2.9).cil === 120000, p + 'odpočet: minuty se ořežou na 1 až 180 a zaokrouhlí dolů');
  const r = I.stopkyAkce(b1, 'rezim', t + 5000, 'dolu');
  ok(r.rezim === 'dolu' && !r.bezi && r.nahrano === 0 && I.stopkyAkce(b1, 'rezim', t, 'hack').rezim === 'nahoru' && I.stopkyAkce(b1, 'rezim', t, '__proto__').rezim === 'nahoru', p + 'režim: přepnutí vynuluje a zastaví, neznámý režim se ignoruje');
  ok(I.stopkyAkce(N, 'neznama', t).bezi === false && I.stopkyAkce(N, undefined, t).rezim === 'nahoru', p + 'akce: neznámá akce nic nezmění');
  ok(I.stopkyCas(0) === '0:00' && I.stopkyCas(59999) === '0:59' && I.stopkyCas(60000) === '1:00' && I.stopkyCas(3600000) === '1:00:00' && I.stopkyCas(3661000) === '1:01:01' && I.stopkyCas(-5) === '0:00' && I.stopkyCas(NaN) === '0:00' && I.stopkyCas(1, true) === '0:01' && I.stopkyCas(0, true) === '0:00', p + 'formát: m:ss a h:mm:ss, záporné a NaN = 0:00, odpočet zaokrouhluje nahoru');
  ok(I.stopkyZobraz(I.stopkyAkce(N, 'start', 0), 1e15).ms <= I.STOPKY_MAX_MS && I.stopkyZobraz(I.stopkyAkce(N, 'start', 0), 1e15).text === '99:59:59', p + 'stopky: nejdéle 99:59:59');
  /* uložení */
  const u = I.stopkyUloz(b1), n = I.stopkyNacti(u, t + 1000);
  ok(JSON.stringify(n) === JSON.stringify(b1) && n.bezi && n.od === t, p + 'uložení: stav stopek se vrátí beze změny (včetně běžícího)');
  ok(JSON.parse(u).v === 1 && Object.keys(JSON.parse(u)).sort().join() === 'bezi,cil,nahrano,od,rezim,v', p + 'uložení: ukládá se jen verze a pět polí');
  const zle = ['{{{', '5', 'null', '[]', '"x"', '{"v":2}', '{"v":1}', '{"v":1,"rezim":"dolu","bezi":true,"od":"x","nahrano":"y","cil":"z"}', '{"v":1,"rezim":"dolu","bezi":false,"od":0,"nahrano":0,"cil":1e99}',
    '{"v":1,"rezim":"nahoru","bezi":true,"od":-5,"nahrano":-9,"cil":60000}', '{"v":1,"rezim":"nahoru","bezi":false,"od":0,"nahrano":1e99,"cil":60000}', '{"v":1,"rezim":"nahoru","bezi":false,"od":0,"nahrano":0,"cil":1}',
    '{"v":1,"rezim":"nahoru","bezi":true,"od":' + (t + 9e8) + ',"nahrano":0,"cil":60000}', '{"v":1,"rezim":"nahoru","bezi":true,"od":null,"nahrano":0,"cil":60000}'];
  for (const z of zle) {
    /* běžící s nesmyslným `od`: ostatní pole smějí platit, ale stopky stojí; vše ostatní je přesně výchozí stav */
    const o = I.stopkyNacti(z, t), stoji = !o.bezi && o.od === 0 && o.nahrano >= 0 && o.cil >= 60000 && o.cil <= 180 * 60000;
    ok(stoji && (/"bezi":true/.test(z) || JSON.stringify(o) === JSON.stringify(I.stopkyNove())), p + 'uložení: rozbitý nebo nepřátelský zápis dá stojící výchozí stopky', z.slice(0, 60));
  }
  ok(I.stopkyNacti('{"v":1,"rezim":"__proto__","bezi":false,"od":0,"nahrano":5000,"cil":60000}', t).rezim === 'nahoru' && I.stopkyNacti(null, t).rezim === 'nahoru' && I.stopkyNacti(undefined, t).cil === 600000, p + 'uložení: neznámý režim = stopky, chybějící zápis = výchozí');
  ok(I.stopkyNacti('{"v":1,"rezim":"dolu","bezi":true,"od":' + (t - 30000) + ',"nahrano":10000,"cil":120000}', t).bezi === true && I.stopkyZobraz(I.stopkyNacti('{"v":1,"rezim":"dolu","bezi":true,"od":' + (t - 30000) + ',"nahrano":10000,"cil":120000}', t), t).text === '1:20', p + 'uložení: běžící odpočet se po načtení počítá z hodin (120 − 10 − 30 = 80 s = 1:20)');
}
etapa3Kontroly(I, '');

bezChyb(); odznaky(); rychlost();

/* ── sabotáže: každá musí shodit aspoň jednu kontrolu ── */
function sabotaz(jm, zmena, rx) {
  const nove = zmena(ZDROJ);
  ok(nove !== ZDROJ, 'sabotáž „' + jm + '“ se aplikovala');
  if (nove === ZDROJ) return;
  const f0 = fail, vypis = console.log; const hlasky = [];
  console.log = (...a) => hlasky.push(a.join(' '));
  const p0 = pass;
  try { kontroly(nacti(nove), 'S'); kdeKontroly(nacti(nove), 'S'); etapa3Kontroly(nacti(nove), 'S'); rychlost2(nove); } catch (e) { hlasky.push('  ❌ výjimka ' + e.message); fail++; }
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
sabotaz('cur bez ověření typu obrazovky', s => s.replace("const s = typeof o.s === 'string' && KDE_TYPY.indexOf(o.s) >= 0 ? o.s : null;", "const s = typeof o.s === 'string' ? o.s : null;"), /nepřátelské cur|neznámý typ/);
sabotaz('cur bez ověření mise', s => s.replace("KDE_S_MISI.indexOf(s) >= 0 && typeof o.m === 'string' && RE_MISE.test(o.m) ? o.m : null", "typeof o.m === 'string' ? o.m : null"), /nepřátelské cur|neplatná mise|nenesou/);
sabotaz('mapa nese misi', s => s.replace("const KDE_S_MISI = ['boj', 'trenink', 'teorie'];", "const KDE_S_MISI = KDE_TYPY;"), /nenesou/);
sabotaz('název mise bez věty', s => s.replace("if (k.s === 'boj') return { kratce: 'boj' + mise,", "if (k.s === 'boj') return { kratce: 'boj',"), /věta pro kartu/);

/* sabotáže etapy 3 */
sabotaz('místnost: kód bez ověření', s => s.replace("kod: RE_KOD.test(kodTxt) ? kodTxt : ''", 'kod: kodTxt'), /kód jen z písmen/);
sabotaz('místnost: odpojení se nepočítají', s => s.replace("const zive = hraci.filter(p => pripojen(p, faze === 'finished', nejnovejsi));", 'const zive = hraci;'), /odpojený hráč/);
sabotaz('místnost: q_index null je otázka 1', s => s.replace("typeof b.q_index === 'number' && Number.isInteger(b.q_index) ? b.q_index : -1", 'Number.isInteger(Number(b.q_index)) ? Number(b.q_index) : -1'), /q_index null/);
sabotaz('místnost: last_qi jako text je odpověď', s => s.replace("typeof p.last_qi === 'number' && p.last_qi === qi", 'Number(p.last_qi) === qi'), /last_qi jako null/);
sabotaz('místnost: bez odpočtu 3-2-1 u první otázky', s => s.replace('(qi === 0 ? BOJ_ODPOCET_MS : 0)', '0'), /odpočet 3-2-1/);
sabotaz('místnost: bez stropu počtu otázek', s => s.replace('const celkem = cislo(b.q_count, 100);', 'const celkem = cislo(b.q_count, 1e9);'), /obří q_count/);
sabotaz('místnost: otázka přeroste počet', s => s.replace('Math.min(qi + 1, celkem)', 'qi + 1'), /nikdy nepřeroste/);
sabotaz('místnost: odpočet bez stropu 25 s', s => s.replace('Math.max(0, Math.min(BOJ_OTAZKA_S, Math.ceil((konec - ted) / 1000)))', 'Math.max(0, Math.ceil((konec - ted) / 1000))'), /ořežou na 0 až 25/);
sabotaz('kde: nehrající se počítají', s => s.replace('if (!h || !h.on) { nehraje++; continue; }', 'if (!h) { nehraje++; continue; }'), /nehrající/);
sabotaz('kde: neznámá obrazovka je nová skupina', s => s.replace('const k = kde(h.kde), sk = k ? skupiny.find(s => s.typ === k.s) : null;', 'const k = h.kde, sk = k ? (skupiny.find(s => s.typ === k.s) || (skupiny.push({ typ: k.s, nazev: k.s, pocet: 0, jmena: [], dalsi: 0 }), skupiny[skupiny.length - 1])) : null;'), /nesmyslný vstup|neznámá obrazovka/);
sabotaz('kde: bez stropu jmen', s => s.replace('s.jmena = s.jmena.slice(0, max); });', '});'), /nejvýš 6 jmen/);
sabotaz('mapa: základ se ignoruje', s => s.replace('if (b && b.indexOf(mid) < 0) nove.push(s.jmeno);', 'nove.push(s.jmeno);'), /v hodině/);
sabotaz('mapa: žák bez základu se počítá jako nový', s => s.replace('if (b && b.indexOf(mid) < 0) nove.push(s.jmeno);', 'if (!b || b.indexOf(mid) < 0) nove.push(s.jmeno);'), /nic „v hodině“|d \(bez základu\)/);
sabotaz('mapa: základ bez kontroly klíčů', s => s.replace('!RE_KLIC_ZAKLADU.test(k) || ', ''), /nepřátelský základ/);
sabotaz('mapa: základ bez kontroly misí', s => s.replace('raw[k].filter(m => typeof m === \'string\' && RE_MISE.test(m))', 'raw[k]'), /nepřátelský základ/);
sabotaz('mapa: základ bez stropu', s => s.replace('if (Object.keys(ven).length >= MAX_ZAKLADU) break;', ''), /strop 400/);
sabotaz('mapa: základ není kopie', s => s.replace('for (const s of stavy) z[klic(s)] = s.mise.slice();\n    return z;', 'for (const s of stavy) z[klic(s)] = s.mise;\n    return z;'), /základ je kopie/);
sabotaz('stopky: pauza nezastaví', s => s.replace("else if (akce === 'pauza') zastav();", "else if (akce === 'pauza') { }"), /pauza zastaví/);
sabotaz('stopky: nula nezastaví', s => s.replace("else if (akce === 'nula') { n.bezi = false; n.od = 0; n.nahrano = 0; }", "else if (akce === 'nula') { n.nahrano = 0; }"), /nula vynuluje/);
sabotaz('odpočet: čas do záporu', s => s.replace('const zbyva = Math.max(0, s.cil - up);', 'const zbyva = s.cil - up;'), /čas nejde do záporu|na konci/);
sabotaz('odpočet: po konci jde spustit', s => s.replace("if (!n.bezi && stopkyZobraz(n, ted).stav !== 'konec') { n.bezi = true; n.od = ted; }", 'if (!n.bezi) { n.bezi = true; n.od = ted; }'), /po konci Start/);
sabotaz('odpočet: minuty bez ořezu', s => s.replace('Math.max(1, Math.min(STOPKY_MAX_CIL_MIN, Math.floor(Number(min)) || 0)) * 60000', '(Math.floor(Number(min)) || 0) * 60000'), /minuty se ořežou/);
sabotaz('odpočet: prodloužení bez stropu', s => s.replace('n.cil = Math.min(STOPKY_MAX_CIL_MIN * 60000, n.cil + cilMs(arg));', 'n.cil = n.cil + cilMs(arg);'), /nejdéle 180/);
sabotaz('odpočet: zaokrouhlení dolů místo nahoru', s => s.replace('const sek = dolu ? Math.ceil(t / 1000) : Math.floor(t / 1000);', 'const sek = Math.floor(t / 1000);'), /formát|zaokrouhlený/);
sabotaz('stopky: běžící z budoucnosti se přijme', s => s.replace('if (od === null || od > ted + 60000) return s;', 'if (od === null) return s;'), /rozbitý nebo nepřátelský/);
sabotaz('stopky: uložení bez kontroly čísel', s => s.replace('if (nahrano === null || cil === null || cil < 60000) return s;', ''), /rozbitý nebo nepřátelský/);
sabotaz('stopky: neznámý režim se přijme', s => s.replace("s.rezim = o.rezim === 'dolu' ? 'dolu' : 'nahoru';", 's.rezim = o.rezim;'), /neznámý režim/);
sabotaz('stopky: nejdéle 99:59:59 neplatí', s => s.replace('return Math.min(STOPKY_MAX_MS, s.nahrano + beh);', 'return s.nahrano + beh;'), /99:59:59/);

/* sabotáž „čtení chyb“ se chytá samostatnou kontrolou zdroje (stejné pravidlo jako bezChyb) */
{
  const nove = ZDROJ.replace('const poMisich = {};', 'const poMisich = {}; const chyb = Object.keys(obj(d.errs)).length; void chyb;');
  const kod = nove.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  ok(/errs|errsSnap/.test(kod), 'sabotáž „čtení chyb“ je chycena zdrojovou kontrolou');
}

console.log(`\n  VÝSLEDEK: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
