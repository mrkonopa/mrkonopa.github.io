/* ══════════════════════════════════════════════════════════════════════
   Ceny v obchodu a celoživotní mety musí odpovídat tomu, co dítě
   SKUTEČNĚ vydělá.

   ZMĚŘENÝ ROZPOČET jednoho dítěte v jednom ročníku (sazby ze hry):
       126 úkolů bezchybně  × 7 kr        =  882
       21 splněných misí    × 15 kr       =  315
       trénink do mistrovství
         (21 × 15 odpovědí + 21 × 30 kr)  =  945
       ──────────────────────────────────────────
       jednorázově                           2 142
       denní série 20 kr, realisticky
         ~60 % z 180 školních dní            2 160
       ══════════════════════════════════════════
       ROČNÍ ROZPOČET                      ≈ 4 302 kr

   Strop je skutečný: opakování mise platí 0 (kredity jsou v
   `if(firstTime)`) a trénink po dosažení mistrovství platí 0. Grind
   neexistuje, takže se ceny nedají „dohrát".

   PŘED OPRAVOU bylo 12 z 51 položek nad ROČNÍ rozpočet — všech pět
   mazlíčků (nejlevnější 5 000 = 116 %), tři skiny a tři tituly.
   Na jednorožce za 25 000 by dítě po dokončení celé hry potřebovalo
   ~1 140 školních dní denní série, tedy šest let. A celoživotní meta
   `mastered 147` chtěla všech 21 misí ve VŠECH SEDMI ročnících,
   přestože dítě hraje jeden — a viděla se mu v profilu jako „0 / 147".

   Čísla jsou NÁVRH, ne zákon. Když je Vojta posune, tenhle test řekne,
   jestli pořád drží vztah k rozpočtu.

   Spusť: node tests/rpg-ekonomika.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const src = fs.readFileSync(path.join(ROOT, 'projects/rpg-wallet.js'), 'utf8');
const ITEMS = new Function(src.match(/SHOP_ITEMS\s*=\s*\[[\s\S]*?\n\s*\];/)[0] + 'return SHOP_ITEMS;')();
const GACH  = new Function(src.match(/GACH\s*=\s*\[[\s\S]*?\n\s*\];/)[0] + 'return GACH;')();

/* Sazby čteme ZE ZDROJE, ne z hlavy — kdyby je někdo změnil, přepočítá se
   rozpočet a prahy níže se posunou s ním. Sazba za denní sérii sedí ve
   sdíleném `rpg-shared.js` (touchStreak je společná všem ročníkům), zbytek
   je pořád v samotné hře — proto se čtou dva soubory. */
const hra = fs.readFileSync(path.join(ROOT, 'projects/rpg-mat-9.html'), 'utf8')
          + fs.readFileSync(path.join(ROOT, 'projects/rpg-shared.js'), 'utf8');
const zaUkol   = Number((hra.match(/earnCredits\(mistakes===0\?(\d+)/) || [])[1]);
const zaMisi   = Number((hra.match(/S\.creditsClaimed\[BT\.mid\]=true;earnCredits\((\d+)\)/) || [])[1]);
const zaMistr  = Number((hra.match(/earnCredits\((\d+)\);fb\.textContent='🏅/) || [])[1]);
const serie7   = Number((hra.match(/earnCredits\(sc>=7\?(\d+)/) || [])[1]);
const mastGoal = Number((hra.match(/const MASTERY_GOAL=(\d+)/) || [])[1]);

ok([zaUkol, zaMisi, zaMistr, serie7, mastGoal].every(Number.isFinite),
  'sazby se povedlo přečíst ze hry',
  `úkol=${zaUkol} mise=${zaMisi} mistrovství=${zaMistr} série=${serie7} cíl=${mastGoal}`);

const UKOLU = 126, MISI = 21, SKOLNICH_DNI = 180, DOCHAZKA = 0.6;
const jednorazove = UKOLU * zaUkol + MISI * zaMisi + MISI * mastGoal * 1 + MISI * zaMistr;
const zeSerie = Math.round(DOCHAZKA * SKOLNICH_DNI * serie7);
const ROZPOCET = jednorazove + zeSerie;

console.log(`\n  Rozpočet dítěte: ${jednorazove} jednorázově + ${zeSerie} ze série = ${ROZPOCET} kr / školní rok`);

const kup = ITEMS.filter(i => !i.ach && i.price > 0);
ok(kup.length > 30, `obchod má co nabídnout (${kup.length} položek ke koupi)`);

/* 1) Nic ke koupi nesmí být nad ROČNÍ rozpočet. Jinak to dítě vidí
      v obchodu, ale za celý rok si na to nevydělá. */
const nad = kup.filter(i => i.price > ROZPOCET);
ok(nad.length === 0, 'žádná položka není nad roční rozpočet',
  nad.map(i => `${i.id} ${i.price} kr`).join(', '));

/* 2) Nejdražší má být skutečný cíl na konec roku, ne formalita. */
const nejdrazsi = Math.max(...kup.map(i => i.price));
ok(nejdrazsi > ROZPOCET * 0.4 && nejdrazsi <= ROZPOCET * 0.8,
  `nejdražší položka je cíl na konec roku (${nejdrazsi} kr = ${Math.round(100*nejdrazsi/ROZPOCET)} % rozpočtu)`,
  'čekáno 40–80 % rozpočtu');

/* 3) V každé kategorii má být něco levného — dítě musí mít co koupit
      hned v prvních týdnech, ne až v pololetí. */
const kategorie = {};
kup.forEach(i => { (kategorie[i.cat] = kategorie[i.cat] || []).push(i.price); });
for (const [cat, ceny] of Object.entries(kategorie)) {
  const nej = Math.min(...ceny);
  ok(nej <= ROZPOCET * 0.35,
    `kategorie „${cat}" má i něco dostupného (nejlevnější ${nej} kr)`,
    `${Math.round(100*nej/ROZPOCET)} % rozpočtu`);
}

/* 4) Celoživotní mety. Ukazují se dítěti v profilu i s postupem
      („máš 3 / 100"), takže nedosažitelná meta ho jen odrazuje. */
const G = Object.fromEntries(GACH.map(g => [g.id, g]));
ok((G['gach-master-147'] || G['gach-master-42'] || {}).goal <= MISI * 2,
  'meta na mistrovství nechce víc než dva ročníky misí',
  'je ' + ((G['gach-master-147'] || G['gach-master-42'] || {}).goal));
const earned = GACH.find(g => g.stat === 'earned');
ok(earned && earned.goal <= ROZPOCET * 3,
  `meta na vydělané kredity je do tří let (${earned && earned.goal} kr)`,
  `rozpočet ${ROZPOCET}/rok`);
/* 5) Odměny za mety byly kalibrované na STARÝ obchod (mazlíček za
      25 000 kr), takže jedna meta dávala 10 000 kr = 232 % ročního
      rozpočtu. Po přecenění zboží by to rozvahu převážilo na druhou
      stranu — dítě by si za jednu metu koupilo třetinu obchodu.
      Odměna má být „pár položek", ne půl obchodu. */
const odmeny = GACH.reduce((a, g) => a + ((g.reward && g.reward.credits) || 0), 0);
ok(odmeny <= ROZPOCET * 2.5,
  `odměny za mety dohromady nepřeváží rozpočet (${odmeny} kr = ${(odmeny/ROZPOCET).toFixed(1)}× rok)`);
const nejvetsiOdmena = Math.max(...GACH.map(g => (g.reward && g.reward.credits) || 0));
ok(nejvetsiOdmena <= ROZPOCET * 0.5,
  `žádná jednotlivá meta nedá víc než půl ročního rozpočtu (${nejvetsiOdmena} kr)`);

const streak = GACH.find(g => g.stat === 'streakMax');
/* Série se počítá po ŠKOLNÍCH dnech (viz rpg-streak-skolni-dny.test.cjs),
   takže 100 je ~půl školního roku denní docházky — náročné, ale možné.
   Kdyby se počítání vrátilo ke kalendářním dnům, tohle by bylo mimo. */
ok(streak && streak.goal <= SKOLNICH_DNI,
  `meta na sérii se vejde do školního roku (${streak && streak.goal} dní)`);

console.log(`\n  Ekonomika: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
