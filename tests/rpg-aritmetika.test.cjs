/* ══════════════════════════════════════════════════════════════════════
   RPG banky — DOPOČÍTÁNÍ ARITMETICKÝCH ZADÁNÍ (3.–9. ročník).

   PROČ. `rpg-content-quality.cjs` dopočítává geometrii a poslední nápovědu,
   ale samotné aritmetické zadání („Vypočítej: 755 − 169 =") nikdo neověřoval
   proti deklarované odpovědi. Test tedy NEČTE `ans` jako pravdu: vezme text
   zadání, vyhodnotí výraz a porovná — druhý, nezávislý zdroj pravdy.

   POZOR NA VLASTNÍ VZOR. Než tahle verze začala dávat smysl, hlásila
   postupně 241, 120 a 12 „nálezů" a VŠECHNY byly chybou měření, ne banky:
     · regulární výraz bral jen poslední dva členy („296 + 150 + 242"
       počítal jako 150 + 242, „5 × 4 + 20" ignoroval přednost),
     · dvojtečka je v češtině DĚLENÍ i konec popisku („Kolik je: (-27) : (-3)"),
     · odpověď bývá ZLOMEK („3/4"), ne desetinné číslo,
     · „4 : 5/4" je pro naivní převod nejednoznačné (4 ÷ 5/4 = 16/5, ne 4/5/4)
       — takové výrazy se schválně PŘESKAKUJÍ a počítají zvlášť.

   Ověřeno sabotáží: `ans: a + b` → `a + b + 1` v jednom generátoru 3. ročníku
   test okamžitě odhalí.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 19031;
let pass = 0, fail = 0;
const ok = (c, m, d = '') => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
(async()=>{
  const srv=http.createServer((q,r)=>{const p=path.normalize(path.join(ROOT,q.url.split('?')[0]));
    try{r.end(fs.readFileSync(p));}catch{r.statusCode=404;r.end();}}).listen(PORT);
  const exe='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const br=await chromium.launch({executablePath: fs.existsSync(exe)?exe:undefined});
  let celkemVse=0, celkemAri=0, celkemNesed=0; const ukazky=[];
  for (const g of [3,4,5,6,7,8,9]) {
    const pg=await br.newPage();
    await pg.goto(`http://127.0.0.1:${PORT}/projects/rpg-mat-${g}.html`,{waitUntil:'domcontentloaded'});
    await pg.waitForFunction(()=>typeof startGame==='function');
    await pg.evaluate(()=>{localStorage.clear();document.getElementById('ni').value='T';startGame();});
    const r=await pg.evaluate((gg)=>{
      const bank=window['RPG_TASK_EXTRA_'+gg]||{};
      /* Odpověď může být ZLOMEK („3/4") — stejně to čte `checkAns` ve hře.
         Bez toho by „3/4" vyšlo jako 3 a hlásilo by se to jako neshoda. */
      const cislo=s=>{
        const t=String(s).replace(/\s/g,'').replace(',','.');
        if (/^-?\d+\/-?\d+$/.test(t)) { const [a,b]=t.split('/'); return parseFloat(a)/parseFloat(b); }
        return parseFloat(t);
      };
      let vse=0, ari=0, nesed=0, nejedn=0; const vz=[];
      for (const ar of AREAS) for (const m of ar.missions) {
        for (let rep=0; rep<12; rep++) {
          let ts; try{ ts=m.tasks(); if(typeof bank[m.id]==='function') ts=ts.concat(bank[m.id]()); }catch(e){ continue; }
          for (const t of ts) {
            vse++;
            const txt=String(t.text||'').replace(/\s+/g,' ').trim();
            /* Nejdřív odřízni POPISEK („Vypočítej:", „Kolik je:"), teprve pak
               ber zbytek jako výraz — v češtině je dvojtečka i DĚLENÍ, takže
               „Kolik je: (-27) : (-3) =" má dvě různé dvojtečky. */
            const bezPopisku = txt.replace(/^[^:0-9(-]{0,40}:\s*/, '');
            const mm = bezPopisku.match(/^([-\d\s.,+−\-×·*:\/()]+?)\s*=\s*\??$/);
            if (!mm) continue;
            if (/kolik procent|zaokrouhl|odhad|přibližn|zbytek/i.test(txt)) continue;
            const vyraz = mm[1].replace(/\s/g,'').replace(/[×·]/g,'*').replace(/−/g,'-')
                               .replace(/:/g,'/').replace(/(\d),(\d)/g,'$1.$2');
            if (!/^[-\d.+*\/()]+$/.test(vyraz) || !/[+\-*\/]/.test(vyraz)) continue;
            /* „4 : 5/4" je pro naivní převod nejednoznačné — dvojtečka i lomítko
               znamenají dělení, ale zlomek se má číst jako JEDEN člen (4 ÷ 5/4
               = 16/5, ne 4/5/4). Takové výrazy radši přeskoč, než je špatně
               spočítat a hlásit vadu, která tam není. */
            if (/:/.test(mm[1]) && /\d\/\d/.test(mm[1])) { nejedn++; continue; }
            ari++;
            let v; try { v = Function('"use strict";return ('+vyraz+')')(); } catch(e){ continue; }
            if (!Number.isFinite(v)) continue;
            const dekl=cislo(t.ans);
            if (Number.isFinite(dekl) && Math.abs(v-dekl) > 1e-9) {
              nesed++; if(vz.length<3) vz.push({mid:m.id, txt:txt.slice(0,70), dekl:t.ans, dopocteno:v});
            }
          }
        }
      }
      return {vse, ari, nesed, nejedn, vz};
    }, g);
    celkemVse+=r.vse; celkemAri+=r.ari; celkemNesed+=r.nesed; r.vz.forEach(v=>ukazky.push({g,...v}));
    console.log(`g${g}  úloh=${String(r.vse).padStart(5)}  aritmetických=${String(r.ari).padStart(5)}  nejednoznačných=${String(r.nejedn).padStart(3)}  NESEDÍ=${r.nesed}`);
    await pg.close();
  }
  console.log(`\nCELKEM: ${celkemVse} úloh, ${celkemAri} aritmetických, ${celkemNesed} neshod`);
  ukazky.forEach(u=>console.log(' ', JSON.stringify(u)));
  ok(celkemAri > 1200, `dopočítáno dost aritmetických zadání (${celkemAri}) — pokles = vzor přestal sedět`);
  ok(celkemNesed === 0, `odpověď odpovídá zadání (neshod ${celkemNesed})`);
  await br.close(); srv.close();
  console.log(`\n  Aritmetika v bankách: ${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
