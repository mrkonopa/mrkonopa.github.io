/* ══════════════════════════════════════════════════════════════════════
   Přijímačky: odpověď se dopočítá ze ZADÁNÍ, ne z kontrolních hodnot.

   PROČ. `prijimacky-gen.test.cjs` už nezávislý přepočet dělá — ale
   z `_check`, tedy z týchž surových čísel, ze kterých se zadání skládá.
   Hlavička generátoru to říká rovnou: „ans se počítá ze STEJNÝCH čísel
   jako zadání → konzistentní z konstrukce". Jenže přesně tahle
   konzistence je KRUH: mise 8/7-2 v RPG byla neřešitelná ve 100 %
   generování a její matematika byla se sebou taky konzistentní — jen
   neodpovídala tomu, co zadání TVRDÍ.

   Tenhle test proto čte JEN `prompt` (a `ans`), `_check` ignoruje.
   Je to druhý, nezávislý soud nad týmiž úlohami.

   NÁLEZ při zavedení: žádný. Všech 74 generátorů jsem navíc přepočítal
   ručně a sedí — tohle je pojistka do budoucna, ne oprava.

   Spusť: node tests/prijimacky-zadani.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = {};
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
eval(fs.readFileSync(path.join(ROOT, 'projects/prijimacky-matematika/prijimacky-gen.js'), 'utf8'));
const GEN = global.window.PZ_GEN;

let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };

const N = '(-?\\d+(?:[.,]\\d+)?)';
const č = x => parseFloat(String(x).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'));
const R = (p, re) => { const m = p.match(new RegExp(re, 'i')); return m ? m.slice(1).map(č) : null; };

/* Každý vzor čte POUZE text zadání. Pořadí rozhoduje — specifičtější dřív. */
const VZORY = [
  // ── mocniny a odmocniny ──
  [p => R(p, 'Vypočtěte '+N+'² − '+N+' · '+N),           m => m[0]*m[0] - m[1]*m[2]],
  [p => R(p, 'hodnotu výrazu '+N+'² − '+N+'²'),          m => m[0]*m[0] - m[1]*m[1]],
  [p => R(p, 'Vypočtěte \\('+N+' \\+ '+N+'\\)²'),        m => Math.pow(m[0]+m[1], 2)],
  [p => R(p, 'Vypočtěte √\\('+N+' · '+N+'\\)'),          m => Math.sqrt(m[0]*m[1])],
  [p => R(p, 'Vypočítejte: '+N+'² \\+ '+N+' · '+N+' − √'+N), m => m[0]*m[0] + m[1]*m[2] - Math.sqrt(m[3])],
  [p => R(p, 'Vypočtěte √'+N),                           m => Math.sqrt(m[0])],
  [p => R(p, 'Vypočtěte '+N+'\\^?(\\d)?²'),              m => m[0]*m[0]],
  
  /* Mocniny se píšou horním indexem (², ³, ⁴), ne stříškou. */
  [p => { const m = p.match(/Vypočtěte (-?\d+)([²³⁴⁵⁶⁷⁸⁹])\./);
          const E = { '²':2, '³':3, '⁴':4, '⁵':5, '⁶':6, '⁷':7, '⁸':8, '⁹':9 };
          return m ? [č(m[1]), E[m[2]]] : null; },
         m => Math.pow(m[0], m[1])],
  // ── zlomky ──
  [p => R(p, 'Kolik je '+N+'/'+N+' z čísla '+N),         m => m[2]/m[1]*m[0]],
  [p => R(p, 'Ze '+N+' žáků chodí '+N+'/'+N+' na kroužek'), m => m[0] - m[0]/m[2]*m[1]],
  [p => R(p, 'Kolik zlomků '+N+'/'+N+' se vejde do '+N+' celk'), m => m[2]/(m[0]/m[1])],
  [p => R(p, 'Kolik zlomků '+N+'/'+N+' je celkem v '+N+' celcích a '+N+'/'+N), m => (m[2]+m[3]/m[4])/(m[0]/m[1])],
  [p => R(p, 'Doplňte čitatele: '+N+'/'+N+' = \\?/'+N),  m => m[0]/m[1]*m[2]],
  [p => R(p, 'Zlomek '+N+'/'+N+' třídy je '+N+' žáků'),  m => m[2]/(m[0]/m[1])],
  [p => R(p, 'Ve skladu je '+N+' kusů. Zmetky tvoří '+N+'/'+N+' z tohoto počtu. Z nich lze opravit '+N+'/'+N),
         m => m[0]*(m[1]/m[2])*(m[3]/m[4])],
  [p => R(p, 'bylo '+N+' litrů vody. Nejprve odčerpali '+N+'/'+N+' obsahu, poté '+N+'/'+N+' zbytku'),
         m => { const zb = m[0]*(1-m[1]/m[2]); return zb*(1-m[3]/m[4]); }],
  // ── výrazy s proměnnou ──
  [p => R(p, 'výrazu '+N+'x \\+ '+N+' pro x = '+N),      m => m[0]*m[2] + m[1]],
  [p => R(p, 'výrazu x² \\+ '+N+'x pro x = '+N),         m => m[1]*m[1] + m[0]*m[1]],
  [p => R(p, 'výrazu '+N+'·\\(x \\+ '+N+'\\) − '+N+' pro x = '+N), m => m[0]*(m[3]+m[1]) - m[2]],
  [p => R(p, 'výrazu '+N+'x \\+ '+N+'y pro x = '+N+' a y = '+N), m => m[0]*m[2] + m[1]*m[3]],
  [p => R(p, 'Číslo x zvětšíme o '+N+' a součet vynásobíme '+N+'.*?x = '+N), m => (m[2]+m[0])*m[1]],
  [p => R(p, 'výrazu \\('+N+'x \\+ '+N+'\\) : '+N+' pro x = '+N), m => (m[0]*m[3]+m[1])/m[2]],
  [p => R(p, 'stranu x cm a druhou o '+N+' cm delší.*?x = '+N), m => 2*(m[1] + m[1]+m[0])],
  // ── rovnice ──
  [p => R(p, 'kořen x: '+N+'x \\+ '+N+' = '+N+'x \\+ '+N), m => (m[3]-m[1])/(m[0]-m[2])],
  [p => R(p, 'kořen x: '+N+'x \\+ '+N+' = '+N),          m => (m[2]-m[1])/m[0]],
  [p => R(p, 'kořen x: x : '+N+' \\+ '+N+' = '+N),       m => (m[2]-m[1])*m[0]],
  [p => R(p, 'kořen x: '+N+'·\\(x \\+ '+N+'\\) = '+N),   m => m[2]/m[0] - m[1]],
  [p => R(p, 'rovnici '+N+'\\(x \\+ '+N+'\\) = '+N+'\\(x \\+ '+N+'\\)'), m => (m[2]*m[3]-m[0]*m[1])/(m[0]-m[2])],
  [p => R(p, 'rovnici \\(x \\+ '+N+'\\) : '+N+' = '+N),  m => m[1]*m[2] - m[0]],
  [p => R(p, 'vynásobím '+N+' a k výsledku přičtu '+N+', dostanu '+N), m => (m[2]-m[1])/m[0]],
  // ── procenta ──
  [p => R(p, 'Kolik je '+N+' % z '+N),                   m => m[0]*m[1]/100],
  [p => R(p, 'Číslo '+N+' je '+N+' % z nějakého celku'), m => m[0]/m[1]*100],
  [p => R(p, 'Kolik procent je '+N+' z '+N),             m => m[0]/m[1]*100],
  [p => R(p, 'stálo '+N+' Kč. Sleva je '+N+' %'),        m => m[0]*(1-m[1]/100)],
  [p => R(p, 'stálo '+N+' Kč a zdražilo o '+N+' %'),     m => m[0]*(1+m[1]/100)],
  [p => R(p, 'Uložíme '+N+' Kč s ročním úrokem '+N+' %'), m => m[0]*m[1]/100],
  [p => R(p, 'za '+N+' Kč bylo zlevněno o '+N+' %.*?ještě o '+N+' %'), m => m[0]*(1-m[1]/100)*(1-m[2]/100)],
  [p => R(p, 'bez DPH je '+N+' Kč. Sazba DPH je '+N+' %'), m => m[0]*(1+m[1]/100)],
  // ── slovní ──
  [p => R(p, 'Součet dvou čísel je '+N+', jejich rozdíl je '+N), m => (m[0]+m[1])/2],
  [p => R(p, 'Koupili jsme '+N+' kusy? po '+N+' Kč a '+N+' kusy? po '+N+' Kč'), m => m[0]*m[1]+m[2]*m[3]],
  [p => R(p, 'rychlostí '+N+' km/h. Jakou dráhu ujede za '+N+' hodin'), m => m[0]*m[1]],
  [p => R(p, 'Objednali jsme '+N+' kusy? po '+N+' Kč a k tomu dopravu '+N+' Kč'), m => m[0]*m[1]+m[2]],
  [p => R(p, 'Měli jsme '+N+' Kč. Koupili jsme '+N+' kusy? po '+N+' Kč'), m => m[0]-m[1]*m[2]],
  [p => R(p, 'Otci je '+N+' let, synovi '+N+' let'),     m => m[0]-2*m[1]],
  [p => R(p, 'Smícháme '+N+' kg zboží po '+N+' Kč/kg a '+N+' kg zboží po '+N+' Kč/kg'), m => (m[0]*m[1]+m[2]*m[3])/(m[0]+m[2])],
  // ── poměr ──
  [p => R(p, 'částku '+N+' Kč v poměru '+N+' : '+N),     m => m[0]/(m[1]+m[2])*Math.max(m[1],m[2])],
  [p => R(p, 'Částku '+N+' Kč rozdělte v poměru '+N+' : '+N+' : '+N), m => m[0]/(m[1]+m[2]+m[3])*Math.max(m[1],m[2],m[3])],
  [p => R(p, '^'+N+' stejných výrobků stojí '+N+' Kč. Kolik Kč stojí '+N), m => m[1]/m[0]*m[2]],
  [p => R(p, '^'+N+' dělníků vykope příkop za '+N+' dní.*?'+N+' dělníků'), m => m[0]*m[1]/m[2]],
  [p => R(p, 'měřítku 1 : '+N+' je úsečka dlouhá '+N+' cm'), m => m[0]*m[1]/100],
  [p => R(p, 'úměry: '+N+' : '+N+' = '+N+' : \\?'),      m => m[1]/m[0]*m[2]],
  [p => R(p, 'Na '+N+' porc\\S* je potřeba '+N+' g mouky. Na kolik porcí vystačí '+N+' g'), m => m[2]/(m[1]/m[0])],
  // ── data ──
  [p => R(p, 'Průměr '+N+' čísel je '+N+'. Čtyři z nich jsou '+N+', '+N+', '+N+', '+N), m => m[0]*m[1]-(m[2]+m[3]+m[4]+m[5])],
  [p => R(p, 'Průměr '+N+' naměřených hodnot je '+N),    m => m[0]*m[1]],
  [p => { const m = p.match(/aritmetický průměr čísel ([\d,\s]+)\./i);
          if (!m) return null; const v = m[1].split(',').map(č); return v.length >= 2 ? v : null; },
         v => v.reduce((a, b) => a + b, 0) / v.length],
  [p => { const m = p.match(/medián[^:]*:\s*([\d,\s]+)\./i);
          if (!m) return null; const v = m[1].split(',').map(č).sort((a, b) => a - b); return v.length ? v : null; },
         v => v[(v.length - 1) >> 1]],
  [p => { const m = p.match(/rozpětí[^:]*:\s*([\d,\s]+)\./i);
          if (!m) return null; const v = m[1].split(',').map(č); return v.length ? v : null; },
         v => Math.max(...v) - Math.min(...v)],
  [p => R(p, 'průměr '+N+' čísel je '+N+'. Přidáme číslo '+N),
         m => (m[0]*m[1]+m[2])/(m[0]+1)],
  [p => { const m = p.match(/modus[^:]*:\s*([\d,\s]+)\./i);
          if (!m) return null; const v = m[1].split(',').map(č); return v.length ? v : null; },
         v => { const c = new Map(); v.forEach(x => c.set(x, (c.get(x)||0)+1));
                return [...c.entries()].sort((a,b) => b[1]-a[1])[0][0]; }],
  // ── geometrie ──
  [p => R(p, 'Obdélník má strany '+N+' cm a '+N+' cm. Jaký je jeho obvod'), m => 2*(m[0]+m[1])],
  [p => R(p, 'Obdélník má strany '+N+' cm a '+N+' cm. Jaký je jeho obsah'), m => m[0]*m[1]],
  [p => R(p, 'Čtverec má stranu '+N+' cm. Jaký je jeho obvod'), m => 4*m[0]],
  [p => R(p, 'Čtverec má stranu '+N+' cm. Jaký je jeho obsah'), m => m[0]*m[0]],
  [p => R(p, 'Trojúhelník má stranu '+N+' cm a výšku k této straně '+N), m => m[0]*m[1]/2],
  [p => R(p, 'vedlejšího úhlu k úhlu '+N),               m => 180-m[0]],
  [p => R(p, 'odvěsny '+N+' cm a '+N+' cm. Jak dlouhá je přepona'), m => Math.sqrt(m[0]*m[0]+m[1]*m[1])],
  [p => R(p, 'Lichoběžník má základny '+N+' cm a '+N+' cm a výšku '+N), m => (m[0]+m[1])*m[2]/2],
  [p => R(p, 'α = '+N+'° a β = '+N+'°'),                 m => 180-m[0]-m[1]],
  // ── tělesa ──
  [p => R(p, 'Kvádr má hrany '+N+' cm, '+N+' cm a '+N+' cm. Jaký je jeho objem'), m => m[0]*m[1]*m[2]],
  [p => R(p, 'Kvádr má hrany '+N+' cm, '+N+' cm a '+N+' cm. Jaký je jeho povrch'), m => 2*(m[0]*m[1]+m[0]*m[2]+m[1]*m[2])],
  [p => R(p, 'Krychle má hranu '+N+' cm. Jaký je její povrch'), m => 6*m[0]*m[0]],
  [p => R(p, 'Kvádr má hrany '+N+' cm, '+N+' cm a '+N+' cm. Jaký je součet délek všech jeho hran'), m => 4*(m[0]+m[1]+m[2])],
  [p => R(p, 'rozměry '+N+' cm × '+N+' cm × '+N+' cm. Kolik litrů'), m => m[0]*m[1]*m[2]/1000],
  [p => R(p, 'podstavu trojúhelníku se stranou '+N+' cm a příslušnou výškou '+N+' cm. Výška hranolu je '+N), m => m[0]*m[1]/2*m[2]],
  [p => R(p, 'Krychle má hranu '+N+' cm. Jaký je její objem'), m => Math.pow(m[0], 3)],
  [p => R(p, 'Krychle má objem '+N+' cm³'),              m => Math.cbrt(m[0])],
];

let celkem = 0, dopocteno = 0;
const nalezy = [], nezname = new Map();
const ITER = 300;

for (const [tema, gens] of Object.entries(GEN)) {
  for (const g of gens) {
    for (let i = 0; i < ITER; i++) {
      let it; try { it = g(); } catch (e) { continue; }
      if (!it || !it.prompt) continue;
      celkem++;
      const p = String(it.prompt).replace(/\s+/g, ' ');
      let hotovo = false;
      for (const [najdi, spocti] of VZORY) {
        let m; try { m = najdi(p); } catch (e) { continue; }
        if (!m) continue;
        let v; try { v = spocti(m); } catch (e) { break; }
        if (!isFinite(v)) break;
        dopocteno++; hotovo = true;
        const a = č(it.ans);
        if (isFinite(a) && Math.abs(v - a) > 0.005 && nalezy.length < 10)
          nalezy.push(`${tema}/${(it._check || {}).kind}: „${p.slice(0, 80)}" → ze zadání ${v}, ans ${it.ans}`);
        break;
      }
      if (!hotovo) {
        const k = tema + '/' + ((it._check || {}).kind || '?');
        if (!nezname.has(k)) nezname.set(k, p.slice(0, 70));
      }
    }
  }
}

console.log(`\n  vygenerováno ${celkem} úloh · dopočítáno ze zadání ${dopocteno} (${(100*dopocteno/celkem).toFixed(0)} %)`);
if (nezname.size) {
  console.log(`  tvar nerozpoznán u ${nezname.size} generátorů:`);
  [...nezname.entries()].slice(0, 10).forEach(([k, v]) => console.log(`     ○ ${k}: ${v}`));
}
ok(nalezy.length === 0, 'odpověď vychází ze zadání', nalezy.join(' | '));
/* Pojistka proti planému běhu: kdyby se tvary zadání změnily, vzory by
   nerozpoznaly nic a pravidlo by MLČELO. Naměřeno ~86 % pokrytí. */
ok(dopocteno > celkem * 0.7, `dopočet pokrývá aspoň 70 % úloh (${(100*dopocteno/celkem).toFixed(0)} %)`);
ok(celkem > 15000, `vygenerováno dost úloh (${celkem})`);

console.log(`\n  Přijímačky — dopočet ze zadání: ${pass} ✅ / ${fail} ❌\n`);
process.exit(fail ? 1 : 0);
