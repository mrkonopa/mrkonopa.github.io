/* ════════════════════════════════════════════════════════════════════
   RPG Matematika 9 (NULL_BYTE) — ROZŠIŘUJÍCÍ BANKA ÚLOH
   ────────────────────────────────────────────────────────────────────
   Ke každé misi přidává další parametrické generátory. Engine sloučí
   základní pool z hry s touto bankou a náhodně vylosuje `tc` úloh →
   každé hraní i opakování dá jiné příklady (řádově stovky variant/krok).

   Generátory běží proti GLOBÁLNÍM helperům definovaným ve hře
   (ri, gcd, cz, svgTriangle, svgLineGraph, svgCylinder, svgCone,
    svgSphere, svgSimilar, svgCuboid) — sdílený globální scope.

   PRAVIDLA:
   • Úloha = {text, ans:String, hints:[…], skill:'calc'|'geo'|'anal', svg?}
   • Mise s výběrem ze 4 (mc) smí mít JEN numerické nebo ANO/NE odpovědi:
     mc mise = '1-1','2-1','3-1','4-1','5-1','6-1'.
   • Bez cloudu/modulu hra běží dál na základním poolu (graceful).
   ════════════════════════════════════════════════════════════════════ */
// FRAMING-POOLY: náhodné uvození drilu (nemění odpověď). Přes window, aby
// nekolidovaly s globálním lexikálním scope hlavního skriptu hry i v Node auditu.
window._fc = () => { const a = ['Vypočítej', 'Spočítej', 'Urči', 'Vyčísli',
  /* Zásoba mise byla na hraně (138 unikátních úloh) — všechny otázky se
     ptaly na tutéž věc jednou větou. Přibyly typy s jinou strukturou
     jmenovatele, takže zásoba roste s čísly i s tvarem výrazu. */
  (()=>{const a=ri(2,9),b=ri(2,12);return{text:`Pro jaké x nemá výraz\n(x + ${b}) / (${a}x + ${a*b}) smysl?\nx ≠`,ans:-b,hints:[`Vytkni ${a}: jmenovatel je ${a}(x + ${b}).`,`x + ${b} = 0 ⇒ x = −${b}`],skill:'anal'};})(),
  (()=>{const a=ri(2,9);return{text:`Pro jaké x není definován výraz\n7 / (x² − ${a*a})?\n(napiš kladný kořen)`,ans:a,hints:[`x² − ${a*a} = (x − ${a})(x + ${a}).`,`Kladný kořen je ${a}`],skill:'anal'};})(),
  (()=>{const a=ri(2,12),b=ri(1,9);return{text:`Kolik hodnot x musíš vyloučit\nu výrazu 4 / ((x − ${a})(x + ${b}))?`,ans:2,hints:['Každá závorka ve jmenovateli dává jednu vyloučenou hodnotu.','Dvě různé hodnoty ⇒ 2'],skill:'anal'};})(),
  (()=>{const a=ri(2,9),b=ri(2,9);return{text:`Jmenovatel výrazu je ${a}x − ${a*b}.\nPro jaké x je roven nule?\nx =`,ans:b,hints:[`${a}x = ${a*b}`,`x = ${a*b} : ${a} = ${b}`],skill:'anal'};})(),
  (()=>{const a=ri(2,9);return{text:`Má výraz ${a} / (x² + ${a}) nějakou\nvyloučenou hodnotu? (ANO/NE)`,ans:'NE',hints:['x² je vždy nezáporné, takže jmenovatel je vždy kladný.','NE — jmenovatel se nikdy nerovná nule'],skill:'anal'};})()]; return a[ri(0, a.length - 1)]; };
window._fe = () => { const a = ['Vyřeš rovnici', 'Urči neznámou x', 'Najdi x z rovnice', 'Dořeš rovnici']; return a[ri(0, a.length - 1)]; };
window.RPG_TASK_EXTRA_9 = {

 // ───────── OBLAST 1 — VSTUPNÍ TERMINÁL ─────────
 '1-1': () => [
  (()=>{const a=ri(120,460),b=ri(120,460),c=ri(50,200);return{text:`${window._fc()}:\n${a} + ${b} + ${c} =`,ans:String(a+b+c),hints:[`Sčítej postupně.`,`${a+b} + ${c}`],skill:'calc'};})(),
  (()=>{const a=ri(11,30),b=ri(3,9);return{text:`${window._fc()}:\n${a} × ${b} =`,ans:String(a*b),hints:[`Rozlož na desítky a jednotky.`],skill:'calc'};})(),
  (()=>{const b=ri(6,12),q=ri(4,12),a=b*q;return{text:`${window._fc()}:\n${a} : ${b} =`,ans:String(q),hints:[`${b} × ? = ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(11,29);return{text:`${window._fc()}:\n${a}² =`,ans:String(a*a),hints:[`${a} × ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,9),b=ri(2,9),c=ri(2,9);return{text:`Vypočítej (závorka první):\n(${a} + ${b}) × ${c} =`,ans:String((a+b)*c),hints:[`${a+b} × ${c}.`],skill:'calc'};})(),
  (()=>{const a=ri(1000,9000);const r=Math.round(a/1000)*1000;return{text:`Zaokrouhli na tisíce:\n${a} ≈`,ans:String(r),hints:[`Rozhoduje číslice stovek (${Math.floor(a/100)%10}).`],skill:'calc'};})(),
  (()=>{const a=ri(5,20),b=ri(5,20),c=ri(2,6);return{text:`${window._fc()}:\n(${a} + ${b}) × ${c} =`,ans:String((a+b)*c),hints:[`${a+b} × ${c}.`],skill:'calc'};})(),
  (()=>{const a=ri(3,9);return{text:`${window._fc()}:\n(-${a})² =`,ans:String(a*a),hints:[`Sudá mocnina záporného → kladné.`],skill:'calc'};})(),
  (()=>{const a=ri(2,4),b=ri(2,5);return{text:`${window._fc()}:\n${a}³ − ${b}² =`,ans:String(a**3-b**2),hints:[`${a**3} − ${b**2}.`],skill:'calc'};})(),
  (()=>{const a=ri(110,890);const r=Math.round(a/100)*100;return{text:`Zaokrouhli na stovky:\n${a} ≈`,ans:String(r),hints:[`Rozhoduje číslice desítek (${Math.floor(a/10)%10}).`],skill:'calc'};})(),
  (()=>{const a=ri(3,9),b=ri(2,8);return{text:`Uzel přijal ${a} ${skl(a,'paket','pakety','paketů')} a poté ještě ${b} ${skl(b,'paket','pakety','paketů')}.\nKolik paketů zpracoval celkem?`,ans:String(a+b),hints:[`Sečti obě dávky: ${a} + ${b}.`,`Výsledek: ${a+b}`],skill:'calc'};})(),
  (()=>{const s=ri(3,8),c=ri(4,9);return{text:`Datacentrum má ${s} ${skl(s,'server','servery','serverů')} a každý zvládne ${c} ${skl(c,'proces','procesy','procesů')} naráz.\nKolik procesů zvládnou dohromady?`,ans:String(s*c),hints:[`Násob počet serverů a procesů: ${s} × ${c}.`,`Výsledek: ${s*c}`],skill:'calc'};})()
 ],
 '1-2': () => [
  (()=>{const z=ri(2,9)*200,p=[5,10,20,50][ri(0,3)];return{text:`${window._fc()}:\n${p} % z ${z} =`,ans:String(z*p/100),hints:[`1 % = ${z/100}.`,`${z/100} × ${p}`],skill:'anal'};})(),
  (()=>{const z=ri(2,9)*100,p=[10,20,25][ri(0,2)];return{text:`Cena ${z} Kč klesne o ${p} %.\nNová cena? (Kč)`,ans:String(z-z*p/100),hints:[`Sleva ${z*p/100} Kč.`],skill:'anal'};})(),
  (()=>{const cel=ri(4,10)*25,cast=cel*[20,40,60][ri(0,2)]/100;return{text:`Kolik % je ${cast} z ${cel}?`,ans:String(Math.round(cast/cel*100)),hints:[`${cast} : ${cel} × 100.`],skill:'anal'};})(),
  (()=>{const y=ri(2,9)*1000,pm=[2,4,5,8][ri(0,3)];return{text:`${window._fc()}:\n${pm} ‰ z ${y} =`,ans:String(y*pm/1000),hints:[`1 ‰ = ${y/1000}.`],skill:'anal'};})(),
  (()=>{const p=[10,20,25,50][ri(0,3)],cel=ri(3,9)*40,cast=cel*p/100;return{text:`${cast} je ${p} % z nějakého čísla.\nJaké to je?`,ans:String(cel),hints:[`Celek = ${cast} : ${p} × 100.`],skill:'anal'};})(),
  (()=>{const z=ri(3,9)*100,p=[10,20,50][ri(0,2)];return{text:`Plat ${z} Kč vzroste o ${p} %.\nNový plat? (Kč)`,ans:String(z+z*p/100),hints:[`+ ${z*p/100} Kč.`],skill:'anal'};})(),
  (()=>{const z=ri(2,8)*100,dph=21;return{text:`Cena bez DPH: ${z} Kč.\nCena s DPH 21 %? (Kč, zaokrouhli)`,ans:String(Math.round(z*1.21)),hints:[`${z} × 1,21.`],skill:'anal'};})(),
  (()=>{const z=ri(3,8)*100,p=[10,20,50][ri(0,2)];return{text:`Cena po ${p}% slevě z ${z} Kč? (Kč)`,ans:String(z-z*p/100),hints:[`Sleva = ${z*p/100} Kč.`],skill:'anal'};})(),
  (()=>{const a=ri(2,5)*10,b=ri(2,5)*10;return{text:`Kolik % je ${a} z ${a+b}? (zaokrouhli na celá %)`,ans:String(Math.round(a/(a+b)*100)),hints:[`${a} : ${a+b} × 100.`],skill:'anal'};})(),
  (()=>{const z=ri(2,8)*100,p=[10,25,50][ri(0,2)];const after=Math.round(z*(1+p/100));return{text:`Po zdražení o ${p} % stojí zboží ${after} Kč.\nPůvodní cena? (Kč)`,ans:String(z),hints:[`${after} : ${cz(1+p/100)}.`],skill:'anal'};})(),
  (()=>{const z=ri(3,9)*100,p=[10,20,25][ri(0,2)];return{text:`O kolik korun se změní cena ${z} Kč při slevě ${p} %?`,ans:String(z*p/100),hints:[`Změna = ${z} × ${p} : 100.`],skill:'anal'};})(),
  (()=>{const cel=ri(4,9)*20,cast=cel/4;return{text:`Kolik procent celku tvoří jeho čtvrtina (${cast} z ${cel})?`,ans:'25',hints:[`Čtvrtina je vždy 25 %.`],skill:'anal'};})(),
  (()=>{const z=ri(2,9)*100,p=[10,20,25][ri(0,2)];return{text:`Botnet ovládl ${p} % z ${z} dronů v síti.\nKolik dronů to je?`,ans:String(z*p/100),hints:[`${p} % z ${z} = ${z}/100 × ${p}.`,`Výsledek: ${z*p/100}`],skill:'anal'};})(),
  (()=>{const cel=ri(4,10)*25,cast=cel*[20,40,60][ri(0,2)]/100;return{text:`Firewall zablokoval ${cast} z ${cel} paketů.\nKolik je to procent? (%)`,ans:String(Math.round(cast/cel*100)),hints:[`${cast} : ${cel} × 100.`,`Výsledek: ${Math.round(cast/cel*100)}`],skill:'anal'};})()
 ],
 '1-3': () => [
  (()=>{const a=ri(5,20),b=ri(3,15);return{text:`${window._fc()}:\n${a} + (-${b}) =`,ans:String(a-b),hints:[`Přičíst záporné číslo znamená odečíst ho.`,`${a} − ${b}`],skill:'calc'};})(),
  (()=>{const a=ri(4,15),b=ri(4,15);return{text:`${window._fc()}:\n(-${a}) − (-${b}) =`,ans:String(-a+b),hints:[`− (−${b}) = + ${b}.`,`−${a} + ${b}`],skill:'calc'};})(),
  (()=>{const a=ri(2,9),b=ri(2,9);return{text:`${window._fc()}:\n(-${a}) × (-${b}) =`,ans:String(a*b),hints:[`− × − = +.`],skill:'calc'};})(),
  (()=>{const b=ri(2,6),q=ri(2,9),a=b*q;return{text:`${window._fc()}:\n(-${a}) : (-${b}) =`,ans:String(q),hints:[`− : − = +.`],skill:'calc'};})(),
  (()=>{const a=ri(3,9);return{text:`${window._fc()}:\n−${a}² =`,ans:String(-a*a),hints:[`Umocní se jen ${a}, mínus zůstává: −(${a*a}).`],skill:'calc'};})(),
  (()=>{const a=ri(3,10),b=ri(3,10),c=ri(2,8);return{text:`${window._fc()}:\n(-${a}) + ${b} − ${c} =`,ans:String(-a+b-c),hints:[`Postupuj zleva doprava.`],skill:'calc'};})(),
  (()=>{const a=ri(2,4);return{text:`${window._fc()}:\n(-${a})³ =`,ans:String(-(a**3)),hints:[`Lichá mocnina záporného → záporné.`],skill:'calc'};})(),
  (()=>{const a=ri(3,15);return{text:`${window._fc()}:\n|−${a}| =`,ans:String(a),hints:[`Absolutní hodnota → kladné číslo.`],skill:'calc'};})(),
  (()=>{const a=ri(2,5),b=ri(2,5),c=ri(2,5);return{text:`${window._fc()}:\n(-${a}) × (-${b}) × (-${c}) =`,ans:String(-a*b*c),hints:[`Tři záporná → záporné.`],skill:'calc'};})(),
  (()=>{const a=ri(2,6),b=ri(2,6),c=ri(2,8);return{text:`${window._fc()}:\n(-${a}) × ${b} + ${c} =`,ans:String(-a*b+c),hints:[`-${a*b} + ${c}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,9),b=ri(4,14);return{text:`Napětí na jádru bylo ${a} V a kleslo o ${b} V.\nJaké je teď? (může vyjít i záporné)`,ans:String(a-b),hints:[`${a} − ${b}.`,`Výsledek: ${a-b}`],skill:'calc'};})(),
  (()=>{const a=ri(2,9),b=ri(4,14),res=-a+b,lo=Math.min(-a,res,0)-1,hi=Math.max(-a,res,0)+1;return{svg:svgNumLine(lo,hi,{point:-a,arrow:{from:-a,to:res},arrowLabel:`+${b}`}),text:`Teploměr ráno ukazoval −${a} °C.\nPřes den se oteplilo o ${b} °C.\nKolik °C ukazuje teď?`,ans:String(res),hints:[`Od −${a} postup o ${b} doprava (k plusu).`,`−${a} + ${b} = ${res}`],skill:'calc'};})(),
  (()=>{const a=ri(4,12),b=ri(2,a),res=-a+b,lo=Math.min(-a,0)-1,hi=Math.max(res,0)+1;return{svg:svgNumLine(lo,hi,{point:-a,arrow:{from:-a,to:res},arrowLabel:`+${b}`}),text:`Ponorka byla v hloubce ${a} m (tj. −${a} m).\nVynořila se o ${b} m.\nJaká je teď její hloubka? (m, záporné = pod hladinou)`,ans:String(res),hints:[`Od −${a} postup o ${b} k hladině.`,`−${a} + ${b} = ${res}`],skill:'calc'};})()
 ],

 // ───────── OBLAST 2 — MOCNINOVÝ REAKTOR ─────────
 '2-1': () => [
  (()=>{const a=ri(11,20);return{text:`Vypočítej druhou mocninu:\n${a}² =`,ans:String(a*a),hints:[`${a} × ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,5);return{text:`Kolik je ${a} umocněno na čtvrtou (${a}⁴)?`,ans:String(a**4),hints:[`${a}² = ${a*a}, pak výsledek na druhou.`],skill:'calc'};})(),
  (()=>{const a=ri(2,12);return{text:`Urči druhou odmocninu:\n√${a*a} =`,ans:String(a),hints:[`Které číslo umocněné na druhou dá ${a*a}?`],skill:'calc'};})(),
  (()=>{const n=ri(3,6);return{text:`Kolik je mocnina trojky 3^${n}?`,ans:String(3**n),hints:[`Vynásob trojku ${n}krát za sebou.`],skill:'calc'};})(),
  (()=>{const a=ri(2,4);return{text:`Vypočítej třetí odmocninu:\n∛${a**3} =`,ans:String(a),hints:[`Které číslo na třetí dá ${a**3}?`],skill:'calc'};})(),
  (()=>{const n=ri(5,9);return{text:`Kolik je mocnina dvojky 2^${n}?`,ans:String(2**n),hints:[`Dvojka vynásobená ${n}krát.`],skill:'calc'};})(),
  (()=>{const a=ri(2,4);return{text:`Urči hodnotu mocniny se záporným základem:\n(-${a})³ =`,ans:String(-(a**3)),hints:[`Lichý exponent zachová záporné znaménko.`],skill:'calc'};})(),
  (()=>{const a=ri(2,9);return{text:`Čemu se rovná ${a} na nultou (${a}^0)?`,ans:'1',hints:[`Každé nenulové číslo na nultou je 1.`],skill:'calc'};})(),
  (()=>{const a=ri(3,6);return{text:`Vypočítej třetí mocninu (krychli) čísla ${a}:\n${a}³ =`,ans:String(a**3),hints:[`${a} × ${a} × ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,5);return{text:`Umocni záporné číslo na sudý exponent:\n(-${a})⁴ =`,ans:String(a**4),hints:[`Sudý exponent → výsledek kladný.`],skill:'calc'};})(),
  (()=>{const a=ri(2,4),b=ri(2,4);return{text:`Vypočítej součin mocnin:\n${a}² · ${b}² =`,ans:String(a*a*b*b),hints:[`${a*a} × ${b*b}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,10);return{text:`Které přirozené číslo má druhou mocninu rovnou ${a*a}?`,ans:String(a),hints:[`Odmocni ${a*a}.`],skill:'calc'};})(),
  (()=>{const n=ri(5,9);return{text:`Šifrovací klíč má délku ${n} bitů. Kolik různých hodnot 2^${n} dokáže zakódovat?`,ans:String(2**n),hints:[`Vynásob dvojku ${n}× za sebou.`,`Výsledek: ${2**n}`],skill:'calc'};})()
 ],
 '2-2': () => [
  (()=>{const z=ri(2,3),m=ri(2,4),n=ri(2,3);return{text:`Zapiš číslem:\n${z}^${m} · ${z}^${n} =`,ans:String(z**(m+n)),hints:[`Exponenty se sčítají: ${z}^${m+n}.`],skill:'anal'};})(),
  (()=>{const z=ri(2,4),m=ri(5,6),n=ri(2,4);return{text:`Zapiš číslem:\n${z}^${m} : ${z}^${n} =`,ans:String(z**(m-n)),hints:[`Exponenty se odčítají: ${z}^${m-n}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,15);return{text:`${window._fc()}:\n${a}^1 =`,ans:String(a),hints:[`Na prvou = samo číslo.`],skill:'anal'};})(),
  (()=>{const a=ri(2,5),b=ri(2,3);return{text:`Zapiš číslem:\n(${a}^${b})² =`,ans:String(a**(b*2)),hints:[`Exponenty se násobí: ${a}^${b*2}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,4);return{text:`${window._fc()}:\n(-${a})⁴ =`,ans:String(a**4),hints:[`Sudý exponent → výsledek kladný.`],skill:'anal'};})(),
  (()=>{const a=ri(2,4),b=ri(2,3);return{text:`Zapiš číslem:\n(${a} · ${b})² =`,ans:String((a*b)**2),hints:[`(${a*b})².`],skill:'anal'};})(),
  (()=>{const a=ri(2,4),m=ri(2,3),n=ri(2,3);return{text:`Zapiš číslem:\n(${a}^${m})^${n} =`,ans:String(a**(m*n)),hints:[`Exponenty se násobí: ${a}^${m*n}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,4),b=ri(2,4);return{text:`Zapiš číslem:\n${a}² · ${b}² =`,ans:String(a**2*b**2),hints:[`a² · b² = (a·b)² — umocni součin ${a}·${b}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,4);return{text:`Zapiš číslem:\n${a}^3 · ${a}^0 =`,ans:String(a**3),hints:[`${a}^0 = 1, takže ${a}^3.`],skill:'anal'};})(),
  (()=>{const a=ri(2,4),n=ri(2,3);return{text:`Zapiš číslem:\n(-${a})^${n*2} =`,ans:String(a**(n*2)),hints:[`Sudý exponent → kladné: ${a}^${n*2}.`],skill:'anal'};})(),
  (()=>{const z=ri(2,4),m=ri(3,5),n=ri(1,2);return{text:`Zjednoduš na jednu mocninu a vyčísli:\n${z}^${m} : ${z}^${n} =`,ans:String(z**(m-n)),hints:[`Při dělení mocnin se stejným základem exponenty odečteš: ${z}^${m-n}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,3);return{text:`Kolik je převrácená hodnota, tedy ${a}^(−1)? Zapiš jako zlomek 1/${a}.`,ans:`1/${a}`,hints:[`Záporný exponent −1 dává převrácenou hodnotu.`],skill:'anal'};})(),
  (()=>{const z=ri(2,3),m=ri(2,3),n=ri(2,3);return{text:`Server škáluje výkon jako ${z}^${m} · ${z}^${n}. Zapiš to jako jednu mocninu čísla ${z} a vyčísli.`,ans:String(z**(m+n)),hints:[`Exponenty se sčítají: ${z}^${m+n}.`,`Výsledek: ${z**(m+n)}`],skill:'anal'};})()
 ],
 '2-3': () => [
  (()=>{const a=ri(2,9),n=ri(2,4),v=a*(10**n);return{text:`Vyjádři jako běžné číslo:\n${a}·10^${n} =`,ans:String(v),hints:[`Posuň čárku o ${n} ${skl(n,'místo','místa','míst')} doprava.`],skill:'anal'};})(),
  (()=>{const a=ri(2,9),n=ri(3,6),v=a*(10**n);return{text:`${v.toLocaleString('cs-CZ')} = ${a}·10ⁿ.\nJaké je n?`,ans:String(n),hints:[`Počet posunů čárky.`],skill:'anal'};})(),
  (()=>{const t=[[3,4,5],[6,8,10],[5,12,13],[9,12,15],[8,15,17]][ri(0,4)];return{svg:svgTriangle('pravo',{v:['C','A','B']}),text:`Pravoúhlý trojúhelník, odvěsny ${t[0]} a ${t[1]} cm.\nPřepona c? (cm)`,ans:String(t[2]),hints:[`c² = ${t[0]*t[0]} + ${t[1]*t[1]}.`,`c = √${t[2]*t[2]}`],skill:'geo'};})(),
  (()=>{const t=[[3,4,5],[6,8,10],[5,12,13],[8,15,17]][ri(0,3)];return{svg:svgTriangle('pravo',{v:['C','A','B']}),text:`Pravoúhlý trojúhelník: přepona ${t[2]} cm, odvěsna ${t[1]} cm.\nDruhá odvěsna? (cm)`,ans:String(t[0]),hints:[`a² = ${t[2]*t[2]} − ${t[1]*t[1]}.`],skill:'geo'};})(),
  (()=>{const a=ri(2,9);return{text:`${window._fc()}:\n√(${a}²·10⁶) =`,ans:String(a*1000),hints:[`√10⁶ = 1000, √(${a}²) = ${a}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,9),n=ri(2,4);return{text:`Číslo 0,${'0'.repeat(n-1)}${a} zapiš jako ${a}·10ⁿ.\nn = ? (záporné)`,ans:String(-n),hints:[`Malá čísla → záporný exponent.`],skill:'anal'};})(),
  (()=>{const t=[[3,4,5],[5,12,13],[8,15,17]][ri(0,2)],k=ri(2,3);return{svg:svgTriangle('pravo',{v:['C','A','B']}),text:`Pravoúhlý trojúhelník, odvěsny ${t[0]*k} a ${t[1]*k} cm.\nPřepona? (cm)`,ans:String(t[2]*k),hints:[`c² = ${(t[0]*k)**2} + ${(t[1]*k)**2}.`,`c = ${t[2]*k}`],skill:'geo'};})(),
  (()=>{const T=[[3,4,5],[6,8,10],[5,12,13],[9,12,15]][ri(0,3)],dist=T[0],vys=T[1],zeb=T[2];return{svg:svgRightTri(dist,vys,{la:`${dist} m`,lb:'? m',lc:`žebřík ${zeb} m`,v:['A','B','C']}),text:`Žebřík dlouhý ${zeb} m je opřený o zeď.\nJeho pata je ${dist} m od zdi.\nDo jaké výšky dosáhne? (m)`,ans:String(vys),hints:[`Přepona² − odvěsna²: ${zeb}² − ${dist}² = ${zeb*zeb-dist*dist}.`,`v = √${zeb*zeb-dist*dist} = ${vys}`],skill:'geo'};})(),
  (()=>{const T=[[3,4,5],[6,8,10],[5,12,13],[8,15,17]][ri(0,3)],sir=T[0],vys=T[1],uhl=T[2];return{svg:svgRightTri(sir,vys,{la:`${sir} dm`,lb:`${vys} dm`,lc:'? dm',v:['A','B','C']}),text:`Monitor má šířku ${sir} dm a výšku ${vys} dm.\nJak dlouhá je jeho úhlopříčka? (dm)`,ans:String(uhl),hints:[`u² = ${sir}² + ${vys}² = ${sir*sir+vys*vys}.`,`u = √${sir*sir+vys*vys} = ${uhl}`],skill:'geo'};})(),
  (()=>{const T=[[3,4,5],[6,8,10],[9,12,15]][ri(0,2)],a=T[0],b=T[1],c=T[2],obv=a+b+c;return{svg:svgRightTri(a,b,{la:`${a} m`,lb:`${b} m`,lc:'c = ?',v:['A','B','C']}),text:`Pozemek tvaru pravoúhlého trojúhelníku má odvěsny ${a} m a ${b} m.\nKolik metrů pletiva je potřeba na celý obvod? (m)`,ans:String(obv),hints:[`Nejdřív přepona: c = √(${a}² + ${b}²) = ${c}.`,`Obvod = ${a} + ${b} + ${c} = ${obv} m.`],skill:'geo'};})(),
  (()=>{const a=ri(1,9),n=ri(2,4);return{text:`Zapiš číslem:\n${a} · 10^${n} =`,ans:String(a*10**n),hints:[`Posuň čárku o ${n} ${skl(n,'místo','místa','míst')} doprava.`],skill:'anal'};})(),
  (()=>{const a=ri(1,9),n=ri(3,5);return{text:`${a*10**n} = ${a} · 10^n.\nJaké je n?`,ans:String(n),hints:[`Počet nul za číslem ${a}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,9),n=ri(1,3);return{text:`Zapiš číslem:\n${a} · 10^${n}`,ans:String(a*10**n),hints:[`Posuň čárku o ${n} ${skl(n,'místo','místa','míst')} doprava.`],skill:'anal'};})(),
  (()=>{const a=ri(2,9),n=ri(2,4),v=a*10**n;return{text:`Páteřní linka přenese ${a}·10^${n} paketů za sekundu.\nZapiš tento počet běžným číslem.`,ans:String(v),hints:[`Posuň čárku o ${n} ${skl(n,'místo','místa','míst')} doprava.`,`Výsledek: ${v}`],skill:'anal'};})()
 ],

 // ───────── OBLAST 3 — ROVNICOVÝ PROCESOR ─────────
 '3-1': () => [
  (()=>{const x=ri(2,20),a=ri(2,20);return{text:`${window._fe()}:\nx + ${a} = ${x+a}`,ans:String(x),hints:[`x = ${x+a} − ${a}.`],skill:'calc'};})(),
  (()=>{const x=ri(5,25),a=ri(2,15);return{text:`${window._fe()}:\nx − ${a} = ${x-a}`,ans:String(x),hints:[`x = ${x-a} + ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,9),x=ri(2,12);return{text:`${window._fe()}:\n${a}x = ${a*x}`,ans:String(x),hints:[`x = ${a*x} : ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,7),v=ri(2,9);return{text:`${window._fe()}:\nx / ${a} = ${v}`,ans:String(v*a),hints:[`x = ${v} × ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,8),x=ri(2,12),b=ri(2,15);return{text:`${window._fe()}:\n${a}x + ${b} = ${a*x+b}`,ans:String(x),hints:[`Odečti ${b}, vyděl ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,8),x=ri(3,14),b=ri(2,15);return{text:`${window._fe()}:\n${a}x − ${b} = ${a*x-b}`,ans:String(x),hints:[`Přičti ${b}, vyděl ${a}.`],skill:'calc'};})(),
  (()=>{const x=ri(2,10);return{text:`${window._fe()}:\n3x + 2 = ${3*x+2}`,ans:String(x),hints:[`3x = ${3*x}.`],skill:'calc'};})(),
  (()=>{const x=ri(2,9);return{text:`${window._fe()}:\n4x − 5 = ${4*x-5}`,ans:String(x),hints:[`4x = ${4*x}.`],skill:'calc'};})(),
  (()=>{const v=ri(3,12),a=ri(3,7);return{text:`${window._fe()}:\nx / ${a} = ${v}`,ans:String(v*a),hints:[`x = ${v} × ${a}.`],skill:'calc'};})(),
  (()=>{const x=ri(5,20);return{text:`${window._fe()}:\nx − 7 = ${x-7}`,ans:String(x),hints:[`x = ${x-7} + 7.`],skill:'calc'};})(),
  (()=>{const a=ri(2,9),x=ri(2,12);return{text:`Jaké číslo x splňuje podmínku, že jeho ${a}násobek je ${a*x}?`,ans:String(x),hints:[`${a}x = ${a*x} → x = ${a*x} : ${a}.`],skill:'calc'};})(),
  (()=>{const x=ri(3,15),a=ri(2,10);return{text:`Mysli si číslo. Když k němu přičteš ${a}, dostaneš ${x+a}. Které číslo to je?`,ans:String(x),hints:[`x + ${a} = ${x+a}, tedy x = ${x+a} − ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,8),q=ri(3,9),x=a*q;return{text:`Rozdělíš x paketů rovnoměrně do ${a} uzlů, na každý uzel ${skl(q,'připadne','připadnou','připadne')} ${q} ${skl(q,'paket','pakety','paketů')}.\nKolik je x?`,ans:String(x),hints:[`x = ${a} × ${q}.`,`Výsledek: ${x}`],skill:'calc'};})()
 ],
 '3-2': () => [
  (()=>{const a=ri(2,6),x=ri(2,9),b=ri(1,8);return{text:`${window._fe()}:\n${a}(x + ${b}) = ${a*(x+b)}`,ans:String(x),hints:[`Roznásob: ${a}x + ${a*b}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,5),x=ri(2,9),b=ri(1,6);return{text:`${window._fe()}:\n${a}(x − ${b}) = ${a*(x-b)}`,ans:String(x),hints:[`Roznásob: ${a}x − ${a*b}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,9),a=ri(3,6),d=ri(1,2),b=ri(2,8),cR=(a-d)*x;return{text:`${window._fe()}:\n${a}x + ${b} = ${d===1?'':d}x + ${cR+b}`,ans:String(x),hints:[`x doleva: ${a-d===1?'':a-d}x = ${cR}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8),a=ri(2,7);return{text:`${window._fe()}:\n2(x + ${a}) = ${2*(x+a)}`,ans:String(x),hints:[`x + ${a} = ${x+a}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),a=ri(2,4),bb=ri(2,3),e=ri(1,5);return{text:`${window._fe()}:\n${a}(${bb}x − ${e}) = ${a*(bb*x-e)}`,ans:String(x),hints:[`${a*bb}x − ${a*e}.`],skill:'anal'};})(),
  (()=>{const x=ri(3,9),a=ri(2,5);return{text:`${window._fe()}:\n5x − ${a} = 3x + ${2*x-a}`,ans:String(x),hints:[`2x = ${2*x}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,5),q=ri(3,8),x=a*q;return{text:`${window._fe()}:\nx / ${a} = ${q}`,ans:String(x),hints:[`x = ${q} × ${a}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,5),q=ri(2,6),c=ri(1,4),x=a*q;return{text:`${window._fe()}:\nx / ${a} + ${c} = ${q+c}`,ans:String(x),hints:[`Nejdřív odečti ${c} z obou stran, pak vynásob ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(3,9),b=ri(2,4),a=b+ri(1,2);return{text:`${window._fe()}:\n${a}x − ${b}x = ${(a-b)*x}`,ans:String(x),hints:[`${a-b}x = ${(a-b)*x}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,7),a=ri(2,5),b=ri(1,4);return{text:`${window._fe()}:\n2(x + ${a}) + ${b} = ${2*(x+a)+b}`,ans:String(x),hints:[`2x + ${2*a+b} = ${2*(x+a)+b}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8),a=ri(2,7);return{text:`V logu je x chyb. Po zdvojnásobení a přičtení ${a} vznikne rovnice 2x + ${a} = ${2*x+a}.\nKolik chyb x bylo původně?`,ans:String(x),hints:[`2x = ${2*x+a} − ${a} = ${2*x}.`,`Výsledek: ${x}`],skill:'anal'};})()
 ],
 '3-3': () => [
  (()=>{const a=ri(3,12),b=ri(3,12);return{text:`o = 2(a+b).\no = ${2*(a+b)} cm, b = ${b} cm. Urči a. (cm)`,ans:String(a),hints:[`a = o/2 − b = ${(a+b)} − ${b}.`],skill:'anal'};})(),
  (()=>{const a=ri(3,12),v=ri(3,12);return{text:`S = a · v.\nS = ${a*v} cm², v = ${v} cm. Urči a. (cm)`,ans:String(a),hints:[`a = S / v = ${a*v} : ${v}.`],skill:'anal'};})(),
  (()=>{const vv=ri(40,90),t=ri(2,5);return{text:`s = v · t.\ns = ${vv*t} km, v = ${vv} km/h. Urči t. (h)`,ans:String(t),hints:[`t = s / v.`],skill:'anal'};})(),
  (()=>{const x=ri(10,40),a=ri(5,25);return{text:`Slovní úloha:\nČíslo zmenšené o ${a} je ${x-a}. Jaké je?`,ans:String(x),hints:[`x − ${a} = ${x-a}.`],skill:'anal'};})(),
  (()=>{const x=ri(3,12);return{text:`Slovní úloha:\nDvojnásobek čísla zvětšený o 5 je ${2*x+5}. Číslo?`,ans:String(x),hints:[`2x + 5 = ${2*x+5}.`],skill:'anal'};})(),
  (()=>{const x=ri(4,15);return{text:`Slovní úloha:\nPětinásobek čísla je ${5*x}. Číslo?`,ans:String(x),hints:[`5x = ${5*x}.`],skill:'anal'};})(),
  (()=>{const x=ri(5,20),y=x+ri(2,8);return{text:`Dvě čísla, větší o ${y-x}. Součet ${x+y}.\nMenší číslo?`,ans:String(x),hints:[`x + (x + ${y-x}) = ${x+y}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,6),b=ri(3,9);return{text:`Trojnásobek čísla zvýšený o ${b} je ${3*a+b}.\nJaké číslo?`,ans:String(a),hints:[`3x + ${b} = ${3*a+b}.`],skill:'anal'};})(),
  (()=>{const v=ri(50,120),t=ri(2,4);return{text:`Auto jede ${v} km/h.\nZa ${t} hodiny ujede kolik km?`,ans:String(v*t),hints:[`s = v · t = ${v} · ${t}.`],skill:'anal'};})(),
  (()=>{const x=ri(5,15)*2;return{text:`Polovina čísla je ${x/2}.\nJaké číslo?`,ans:String(x),hints:[`Polovina vznikla dělením dvěma — vrať to násobením dvěma.`],skill:'anal'};})(),
  (()=>{const one=ri(3,8),n=ri(2,6);return{text:`Jeden server zpracuje ${one} ${skl(one,'paket','pakety','paketů')} za sekundu.\nKolik paketů zpracuje ${n} ${skl(n,'server','servery','serverů')} za sekundu?`,ans:String(one*n),hints:[`${n} × ${one}.`,`Výsledek: ${one*n}`],skill:'anal'};})()
 ],

 // ───────── OBLAST 4 — SEKTOR LOMENÉHO KÓDU ─────────
 '4-1': () => [
  (()=>{const a=ri(2,9);return{text:`Pro jaké x není zlomek 8/(x − ${a}) definován?\nx ≠`,ans:String(a),hints:[`Jmenovatel nesmí být nula: x − ${a} = 0.`],skill:'anal'};})(),
  (()=>{const a=ri(2,9);return{text:`Jakou hodnotu x musíš vyloučit z definičního oboru výrazu 5/(x + ${a})?\nx ≠`,ans:String(-a),hints:[`Polož jmenovatel roven nule: x + ${a} = 0.`],skill:'anal'};})(),
  (()=>{const k=ri(1,6),a=2*k;return{text:`Pro kterou hodnotu x je jmenovatel výrazu 6/(2x − ${a}) roven nule?\nx =`,ans:String(k),hints:[`Vyřeš 2x − ${a} = 0.`],skill:'anal'};})(),
  (()=>{const k=ri(1,5),a=5*k;return{text:`Doplň podmínku smyslu výrazu 2/(5x − ${a}):\nx ≠`,ans:String(k),hints:[`5x = ${a}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,8);return{text:`Který kořen jmenovatele je nutné vyloučit u výrazu (x−3)/(x − ${a})?\nx ≠`,ans:String(a),hints:[`Rozhoduje pouze jmenovatel x − ${a}.`],skill:'anal'};})(),
  (()=>{return{text:`Pro jaké x nemá výraz 10/x smysl?\nx ≠`,ans:'0',hints:[`Nulou nelze dělit; jmenovatel je x.`],skill:'anal'};})(),
  (()=>{const b=ri(2,8);return{text:`Kdy je výraz (3x)/(x + ${b}) nedefinovaný?\nx ≠`,ans:String(-b),hints:[`Jmenovatel x + ${b} = 0.`],skill:'anal'};})(),
  (()=>{const c=ri(2,6);return{text:`Urči hodnotu x, pro kterou nelze počítat ${c}/(${c}x):\nx ≠`,ans:'0',hints:[`${c}x = 0 nastane pro x = 0.`],skill:'anal'};})(),
  (()=>{const k=ri(2,5),a=k*ri(2,4);return{text:`Najdi vyloučenou hodnotu proměnné ve výrazu 3/(${k}x − ${a}):\nx ≠`,ans:String(a/k),hints:[`Řeš ${k}x = ${a}.`],skill:'anal'};})(),
  (()=>{const a=ri(1,6),b=ri(1,6);return{text:`Zlomek (x+${a})/(x−${b}) — pro kterou hodnotu x ztrácí smysl?\nx ≠`,ans:String(b),hints:[`Jmenovatel x − ${b} = 0.`],skill:'anal'};})(),
  (()=>{const a=ri(2,7);return{text:`Kolik čísel je nutné vyloučit z definičního oboru výrazu 4/(x − ${a})?`,ans:'1',hints:[`Jmenovatel má právě jeden kořen.`],skill:'anal'};})(),
  (()=>{const b=ri(2,8);return{text:`Zátěž uzlu popisuje výraz 5/(x − ${b}). Pro kterou hodnotu x výraz ztrácí smysl?\nx =`,ans:String(b),hints:[`Jmenovatel nesmí být nula: x − ${b} = 0.`,`Výsledek: ${b}`],skill:'anal'};})()
 ],
 '4-2': () => [
  (()=>{const x=ri(2,6),a=x*ri(1,4);return{text:`Dosaď x = ${x} do výrazu (3x + ${a}) / x a vypočítej.`,ans:String(3+a/x),hints:[`(${3*x} + ${a}) : ${x}.`],skill:'anal'};})(),
  (()=>{const d=ri(2,9),n=d*ri(2,6),g=gcd(n,d);return{text:`Zkrať lomený výraz na základní tvar:\n${n}/${d} =`,ans:(d/g===1?String(n/g):`${n/g}/${d/g}`),hints:[`Vyděl čitatele i jmenovatele číslem ${g}.`],skill:'calc'};})(),
  (()=>{const x=ri(3,9),a=ri(1,3);return{text:`Roznásob a vyčísli (x − ${a})(x + ${a}) pro x = ${x}.`,ans:String(x*x-a*a),hints:[`Použij vzorec a² − b²: ${x*x} − ${a*a}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),a=x*ri(1,5);return{text:`Jakou hodnotu má výraz (x² + ${a}) / x při x = ${x}?`,ans:String(x+a/x),hints:[`(${x*x} + ${a}) : ${x}.`],skill:'anal'};})(),
  (()=>{const x=[2,4,5,10][ri(0,3)],k=x*ri(2,6),b=ri(1,9);return{text:`Kolik vyjde ${k}/x + ${b}, když je x = ${x}?`,ans:String(k/x+b),hints:[`${k} : ${x} = ${k/x}, pak + ${b}.`],skill:'anal'};})(),
  (()=>{const b=ri(2,6),x=b*ri(2,6),a=ri(1,9);return{text:`Urči hodnotu zlomku (x + ${a})/${b} pro x = ${x-a}.`,ans:String(x/b),hints:[`(${x-a} + ${a}) : ${b}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),a=ri(2,5),c=ri(1,4)*x;return{text:`Zkrať lomený výraz (${a}x + ${c}) / x a dosaď x = ${x}.`,ans:String(a+c/x),hints:[`Vyjde ${a} + ${c}/x = ${a} + ${c/x}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),k=ri(2,8)*x;return{text:`Vyčísli ${k}/x pro x = ${x}.`,ans:String(k/x),hints:[`${k} : ${x}.`],skill:'anal'};})(),
  (()=>{const x=ri(3,8),n=ri(1,x-1);return{text:`Zkrať a vyčísli (x² − ${n===1?'':n}x) / x pro x = ${x}. Výsledek?`,ans:String(x-n),hints:[`Vytkni x: x·(x − ${n}) / x = x − ${n} = ${x} − ${n}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8),a=ri(2,6);return{text:`Kolik je ${a}/x + 1, dosadíš-li x = ${a}?`,ans:'2',hints:[`${a}/${a} = 1, tedy 1 + 1.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),a=ri(2,5);const val=a*x;return{text:`Sečti dva stejné zlomky: ${a}·x / x pro x = ${x}. Jaká je hodnota?`,ans:String(a),hints:[`${a}·x / x = ${a} (x se zkrátí).`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),k=ri(2,8)*x;return{text:`Propustnost uzlu je ${k}/x paketů za tik. Kolik to je při x = ${x}?`,ans:String(k/x),hints:[`${k} : ${x}.`,`Výsledek: ${k/x}`],skill:'anal'};})()
 ],
 '4-3': () => [
  (()=>{const x=ri(2,9),b=ri(2,6),a=b*x;return{text:`Vyřeš rovnici s neznámou ve jmenovateli:\n${a} / x = ${b}`,ans:String(x),hints:[`Vynásob obě strany x: ${a} = ${b}x.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8),q=ri(3,6),a=x*q,b=ri(1,q-1);return{text:`Najdi neznámou x:\n${a} / x − ${b} = ${q-b}`,ans:String(x),hints:[`Nejdřív osamostatni zlomek: ${a}/x = ${q}.`],skill:'anal'};})(),
  (()=>{const x=[2,3,4,5,6,7][ri(0,5)];return{text:`Urči kladné x z rovnice:\n${x*x} / x = x`,ans:String(x),hints:[`${x*x} = x², hledáš odmocninu.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8),r=ri(2,5),c=r*x;return{text:`Kolik je x, platí-li ${c} / x = ${r}?`,ans:String(x),hints:[`${c} = ${r}·x, vyděl.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),s=x*ri(2,5),a=ri(1,s-1),b=s-a;return{text:`Sečti zlomky a dořeš rovnici:\n${a}/x + ${b}/x = ${s/x}`,ans:String(x),hints:[`Vlevo je ${s}/x = ${s/x}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8),a=ri(2,6),c=a*x;return{text:`Vypočítej x přímo:\nx = ${c} / ${a}`,ans:String(x),hints:[`${c} : ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),a=x*ri(2,5),b=ri(2,6);return{text:`Osamostatni zlomek a najdi x:\n${a}/x + ${b} = ${a/x+b}`,ans:String(x),hints:[`${a}/x = ${a/x}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),a=x*ri(2,4),b=ri(1,4);return{text:`${window._fe()}:\n${a}/x − ${b} = ${a/x-b}`,ans:String(x),hints:[`Přičti ${b}: ${a}/x = ${a/x}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),a=x*ri(1,4),b=x*ri(1,4);return{text:`Zkrať součet zlomků a urči x:\n${a}/x + ${b}/x = ${(a+b)/x}`,ans:String(x),hints:[`${a+b}/x = ${(a+b)/x}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),a=x*ri(2,4);return{text:`Zbav se dvojnásobku a dořeš:\n2 · (${a}/x) = ${2*a/x}`,ans:String(x),hints:[`${a}/x = ${a/x}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,7),a=x*ri(2,4);return{text:`Jednu vyloučenou hodnotu má rovnice ${a}/x = ${a/x}. Jaké je řešení x?`,ans:String(x),hints:[`${a} : ${a/x} = x.`],skill:'anal'};})(),
  (()=>{const x=ri(2,9),b=ri(2,6),a=b*x;return{text:`Latenci sítě popisuje rovnice ${a}/x = ${b}, kde x je počet uzlů.\nKolik uzlů x?`,ans:String(x),hints:[`Vynásob obě strany x: ${a} = ${b}x.`,`Výsledek: ${x}`],skill:'anal'};})()
 ],

 // ───────── OBLAST 5 — SÍŤOVÝ UZEL ─────────
 '5-1': () => [
  (()=>{const x=ri(2,12),y=ri(2,12);return{text:`Vyřeš soustavu, urči x:\nx + y = ${x+y}\nx − y = ${x-y}`,ans:String(x),hints:[`Sečti rovnice: 2x = ${2*x}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,12),y=ri(2,12);return{text:`Vyřeš soustavu, urči y:\nx + y = ${x+y}\nx − y = ${x-y}`,ans:String(y),hints:[`Odečti rovnice: 2y = ${2*y}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8),y=2*x;return{text:`Vyřeš soustavu, urči x:\ny = 2x\nx + y = ${3*x}`,ans:String(x),hints:[`3x = ${3*x}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,9),y=ri(2,9);return{text:`Vyřeš soustavu, urči x:\nx + y = ${x+y}\n2x + y = ${2*x+y}`,ans:String(x),hints:[`Odečti první rovnici od druhé — y se vyruší.`],skill:'anal'};})(),
  (()=>{const a=ri(6,14),b=ri(2,a-2);return{text:`Součet dvou čísel je ${a+b}, rozdíl ${a-b}.\nVětší z čísel?`,ans:String(a),hints:[`(součet + rozdíl) / 2.`],skill:'anal'};})(),
  (()=>{const x=ri(3,9),y=ri(2,8);return{text:`Vyřeš soustavu, urči y:\nx = ${x}\n2x + 3y = ${2*x+3*y}`,ans:String(y),hints:[`3y = ${3*y}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8),y=ri(2,8),a=ri(2,4);return{text:`Vyřeš soustavu, urči y:\n${a}x + y = ${a*x+y}\nx = ${x}`,ans:String(y),hints:[`${a*x} + y = ${a*x+y}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8),y=ri(2,8);return{text:`Vyřeš soustavu, urči x:\n2x + 3y = ${2*x+3*y}\ny = ${y}`,ans:String(x),hints:[`2x = ${2*x+3*y} − ${3*y}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,6),y=ri(2,6);return{text:`Vyřeš soustavu, urči x + y:\nx − y = ${x-y}\nx + y = ${x+y}`,ans:String(x+y),hints:[`Součet obou rovnic.`],skill:'anal'};})(),
  (()=>{const s=ri(5,14)*2,d=ri(1,s/2-1)*2;const x=(s+d)/2,y=(s-d)/2;return{text:`Dvě čísla: součet ${s}, rozdíl ${d}.\nMenší číslo?`,ans:String(y),hints:[`(${s} − ${d}) : 2.`],skill:'anal'};})(),
  (()=>{const y=ri(2,8),x=y+ri(1,6);return{text:`Síť má x dronů a y serverů, celkem ${x+y} zařízení. Dronů je o ${x-y} víc než serverů.\nKolik je dronů?`,ans:String(x),hints:[`(součet + rozdíl) : 2 = (${x+y} + ${x-y}) : 2.`,`Výsledek: ${x}`],skill:'anal'};})()
 ],
 '5-2': () => [
  (()=>{const m=ri(2,8)*50,p=[10,20,25,50][ri(0,3)];return{text:`Roztok ${m} g obsahuje ${p} % soli.\nKolik g soli?`,ans:String(m*p/100),hints:[`${p} % z ${m}.`],skill:'anal'};})(),
  (()=>{const s=ri(2,9)*10,m=s*ri(4,8);return{text:`Roztok ${m} g, v něm ${s} g soli.\nKolik %? (zaokrouhli na celá %)`,ans:String(Math.round(s/m*100)),hints:[`${s} : ${m} × 100.`],skill:'anal'};})(),
  (()=>{const t=ri(4,10);return{text:`Práci zvládne dělník za ${t} h.\nKolik % udělá za 1 h? (zaokrouhli na celá %)`,ans:String(Math.round(100/t)),hints:[`100 : ${t}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,5),pa=ri(8,15)*10,b=ri(2,5),pb=ri(2,7)*10;const tot=Math.round((a*pa+b*pb)/(a+b));return{text:`${a} kg po ${pa} Kč a ${b} kg po ${pb} Kč.\nCena 1 kg směsi? (Kč)`,ans:String(tot),hints:[`(${a*pa} + ${b*pb}) : ${a+b}.`],skill:'anal'};})(),
  (()=>{const t=ri(2,5)*2,h=t/2;return{text:`Zakázka za ${t} h.\nKolik % hotovo za ${h} h?`,ans:String(Math.round(h/t*100)),hints:[`${h} : ${t} × 100.`],skill:'anal'};})(),
  (()=>{const n=ri(2,6),one=ri(3,8);return{text:`Jeden dělník udělá ${one} ${skl(one,'díl','díly','dílů')} za hodinu.\nKolik dílů ${n} ${skl(n,'dělník','dělníci','dělníků')} za hodinu?`,ans:String(n*one),hints:[`${n} × ${one}.`],skill:'anal'};})(),
  (()=>{const m=ri(2,8)*100,p=[10,20,30][ri(0,2)];return{text:`Roztok ${m} g obsahuje ${p} % cukru.\nKolik g vody?`,ans:String(m-m*p/100),hints:[`Voda = ${100-p} % z ${m}.`],skill:'anal'};})(),
  (()=>{const n=ri(3,6),t=ri(4,8);return{text:`${n} ${skl(n,'dělník udělá','dělníci udělají','dělníků udělá')} práci za ${t} ${skl(t,'den','dny','dní')}.\nKolik dní 1 dělník?`,ans:String(n*t),hints:[`${n} × ${t}.`],skill:'anal'};})(),
  (()=>{const m=ri(3,8)*50,p=[10,20,50][ri(0,2)];return{text:`Zdraží o ${p} %. Původní cena ${m} Kč.\nNová cena? (Kč)`,ans:String(Math.round(m*(1+p/100))),hints:[`${m} + ${m*p/100} Kč.`],skill:'anal'};})(),
  (()=>{const s1=ri(2,4)*100,p1=20,s2=ri(2,4)*100,p2=40;const pOut=Math.round((s1*p1+s2*p2)/(s1+s2));return{text:`Smíchám ${s1} g (${p1}% soli) a ${s2} g (${p2}% soli).\nVýsledná koncentrace? (%, zaokrouhli na celá)`,ans:String(pOut),hints:[`(${s1*p1/100}+${s2*p2/100}) : ${s1+s2} × 100.`],skill:'anal'};})(),
  (()=>{const n=ri(2,6),one=ri(3,8);return{text:`Jeden uzel přepošle ${one} ${skl(one,'paket','pakety','paketů')} za tik.\nKolik paketů přepošle ${n} ${skl(n,'uzel','uzly','uzlů')} za tik?`,ans:String(n*one),hints:[`${n} × ${one}.`,`Výsledek: ${n*one}`],skill:'anal'};})()
 ],
 '5-3': () => [
  (()=>{const v=ri(5,12)*10,t=ri(2,5);return{text:`Rychlost ${v} km/h, čas ${t} h.\nDráha? (km)`,ans:String(v*t),hints:[`s = v · t.`],skill:'anal'};})(),
  (()=>{const v=ri(6,12)*10,t=ri(2,5);return{text:`Dráha ${v*t} km, rychlost ${v} km/h.\nČas? (h)`,ans:String(t),hints:[`t = s / v.`],skill:'anal'};})(),
  (()=>{const v=ri(6,15)*10,t=ri(2,5);return{text:`Ujel ${v*t} km za ${t} h.\nPrůměrná rychlost? (km/h)`,ans:String(v),hints:[`v = s / t.`],skill:'anal'};})(),
  (()=>{const v1=ri(4,7)*10,v2=ri(4,7)*10,t=ri(2,5);return{text:`Proti sobě ${v1} a ${v2} km/h, vzdálenost ${(v1+v2)*t} km.\nZa kolik h se potkají?`,ans:String(t),hints:[`Sbližují se ${v1+v2} km/h.`],skill:'anal'};})(),
  (()=>{const v1=ri(3,5)*10,v2=v1+ri(2,4)*10,t=ri(2,4);return{text:`${v1} a ${v2} km/h stejným směrem.\nNáskok rychlejšího po ${t} h? (km)`,ans:String((v2-v1)*t),hints:[`(${v2}−${v1}) · ${t}.`],skill:'anal'};})(),
  (()=>{const v=ri(8,12)*10,t=[1.5,2.5][ri(0,1)];return{text:`Rychlost ${v} km/h.\nDráha za ${cz(t)} h? (km)`,ans:String(v*t),hints:[`${v} · ${cz(t)}.`],skill:'anal'};})(),
  (()=>{const v1=ri(4,8)*10,v2=ri(4,8)*10,t=ri(1,3);return{text:`Dva vlaky jedou vstříc, ${v1} a ${v2} km/h.\nZa ${t} h ujedou dohromady? (km)`,ans:String((v1+v2)*t),hints:[`${v1+v2} km/h × ${t} h.`],skill:'anal'};})(),
  (()=>{const v=ri(6,12)*10,d=ri(2,6)*v;return{text:`Dráha ${d} km, rychlost ${v} km/h.\nČas? (h)`,ans:String(d/v),hints:[`t = ${d} : ${v}.`],skill:'anal'};})(),
  (()=>{const v=ri(6,12)*10,t=ri(2,5);return{text:`Ujel ${v*t} km za ${t} h.\nPrůměrná rychlost? (km/h)`,ans:String(v),hints:[`v = ${v*t} : ${t}.`],skill:'anal'};})(),
  (()=>{const v1=ri(4,8)*10,v2=v1+ri(2,4)*10,t=ri(1,3);return{text:`Začnou zároveň, rychlosti ${v1} a ${v2} km/h.\nO kolik km je jeden před druhým po ${t} h?`,ans:String((v2-v1)*t),hints:[`(${v2} − ${v1}) × ${t}.`],skill:'anal'};})(),
  (()=>{const v=ri(6,12)*10,t=ri(2,4);return{text:`Cyklista jede stálou rychlostí ${v} km/h. Za jak dlouho ujede ${v*t} km? (h)`,ans:String(t),hints:[`Čas = dráha : rychlost = ${v*t} : ${v}.`],skill:'anal'};})(),
  (()=>{const v=ri(5,10)*10,t=ri(2,5),navic=v*ri(1,2);return{text:`Auto ujede za ${t} h ${v*t} km. O kolik km víc by ujelo, kdyby jelo o ${navic} km/h rychleji?`,ans:String(navic*t),hints:[`Vyšší rychlost o ${navic} km/h × ${t} h.`],skill:'anal'};})(),
  (()=>{const v=ri(6,12)*10,t=ri(2,5);return{text:`Datový tok je ${v} MB/s a trvá ${t} ${skl(t,'sekundu','sekundy','sekund')}.\nKolik MB se přenese?`,ans:String(v*t),hints:[`Přenos = tok × čas = ${v} × ${t}.`,`Výsledek: ${v*t}`],skill:'anal'};})()
 ],

 // ───────── OBLAST 6 — GRAFOVÝ MONITOR ─────────
 '6-1': () => [
  (()=>{const k=ri(2,5),q=ri(1,6),x=ri(2,5);return{svg:svgLineGraph(k,q),text:`Funkce y = ${k}x + ${q}. Vypočítej funkční hodnotu f(${x}).`,ans:String(k*x+q),hints:[`Dosaď x = ${x}: ${k}·${x} + ${q}.`],skill:'geo'};})(),
  (()=>{const k=ri(2,5),q=ri(2,8);return{svg:svgLineGraph(k,q),text:`V jakém bodě protíná přímka y = ${k}x + ${q} osu y? (napiš y-ovou souřadnici)`,ans:String(q),hints:[`Průsečík s osou y nastává pro x = 0.`],skill:'geo'};})(),
  (()=>{const k=ri(2,4),x0=ri(1,5),q=-k*x0;return{svg:svgLineGraph(k,q),text:`Ve kterém bodě protíná přímka y = ${k}x ${q<0?'− '+(-q):'+ '+q} osu x? (napiš x)`,ans:String(x0),hints:[`Polož y = 0 a vyřeš pro x.`],skill:'geo'};})(),
  (()=>{const k=ri(2,6);return{svg:svgLineGraph(k,0),text:`Přímá úměrnost y = ${k}x. Jaká je hodnota y pro x = 2?`,ans:String(2*k),hints:[`${k} · 2.`],skill:'geo'};})(),
  (()=>{const k=ri(2,4);return{svg:svgLineGraph(k,0),text:`Přímka prochází počátkem [0, 0] a bodem [1, ${k}]. Jaká je její směrnice k?`,ans:String(k),hints:[`Směrnice = přírůstek y na jeden krok x.`],skill:'geo'};})(),
  (()=>{const k=ri(2,5),q=ri(1,7),x=ri(2,6);return{svg:svgLineGraph(k,q),text:`Jakou hodnotu má lineární funkce y = ${k}x + ${q} v bodě x = ${x}?`,ans:String(k*x+q),hints:[`${k}·${x} + ${q}.`],skill:'geo'};})(),
  (()=>{const k=ri(2,5),q=ri(2,10),x=ri(2,5);return{svg:svgLineGraph(-k,q),text:`Klesající přímka y = −${k}x + ${q}. Urči f(${x}).`,ans:String(-k*x+q),hints:[`−${k}·${x} + ${q}.`],skill:'geo'};})(),
  (()=>{const k=ri(2,5),q=ri(2,10);return{svg:svgLineGraph(k,-q),text:`Jaká je y-ová souřadnice průsečíku přímky y = ${k}x − ${q} s osou y?`,ans:String(-q),hints:[`Dosaď x = 0.`],skill:'geo'};})(),
  (()=>{const k=ri(2,6),x=ri(2,5);return{svg:svgLineGraph(k,0),text:`Kolik je y, když y = ${k}x a x = ${x}?`,ans:String(k*x),hints:[`${k} × ${x}.`],skill:'geo'};})(),
  (()=>{const k=ri(2,4),x0=ri(2,5);return{svg:svgLineGraph(k,-k*x0),text:`Urči nulový bod (kde y = 0) funkce y = ${k}x − ${k*x0}.`,ans:String(x0),hints:[`${k}x = ${k*x0} → x = ${x0}.`],skill:'geo'};})(),
  (()=>{const k=ri(2,4),x1=ri(1,4),x2=x1+1;const dy=k;return{svg:svgLineGraph(k,0),text:`O kolik vzroste y funkce y = ${k}x, když se x zvětší o 1?`,ans:String(dy),hints:[`Přírůstek y je roven směrnici k = ${k}.`],skill:'geo'};})(),
  (()=>{const k=ri(2,6),x=ri(2,5);return{svg:svgLineGraph(k,0),text:`Zátěž serveru roste podle y = ${k}x, kde x je počet připojených uzlů.\nJaká je zátěž y pro x = ${x}?`,ans:String(k*x),hints:[`Dosaď x = ${x}: ${k} × ${x}.`,`Výsledek: ${k*x}`],skill:'geo'};})()
 ],
 '6-2': () => [
  (()=>{const k=ri(2,6);return{text:`Je lineární funkce y = ${k}x rostoucí?\nANO / NE`,ans:'ANO',hints:[`Funkce je rostoucí právě když je směrnice k kladná.`],skill:'anal'};})(),
  (()=>{const k=ri(2,6);return{text:`Klesá funkce y = −${k}x + 3 se zvětšujícím se x?\nANO / NE`,ans:'ANO',hints:[`Záporná směrnice (k = −${k}) → klesající.`],skill:'anal'};})(),
  (()=>{const q=ri(2,8);return{text:`Mění konstantní funkce y = ${q} svou hodnotu? Je rostoucí?\nANO / NE`,ans:'NE',hints:[`Směrnice k = 0, hodnota je stále stejná.`],skill:'anal'};})(),
  (()=>{const k=ri(2,5),q=ri(2,8);return{text:`Urči y-ovou souřadnici průsečíku grafu y = ${k}x + ${q} s osou y.`,ans:String(q),hints:[`Dosaď x = 0.`],skill:'anal'};})(),
  (()=>{const k=ri(2,4),x0=ri(2,5),q=-k*x0;return{text:`V jakém bodě x protíná graf y = ${k}x ${q<0?'− '+(-q):'+ '+q} osu x?`,ans:String(x0),hints:[`Polož y = 0.`],skill:'anal'};})(),
  (()=>{const k=ri(2,4),q=ri(1,5),x=ri(2,5);return{text:`Leží bod [${x}, ${k*x+q}] na přímce y = ${k}x + ${q}?\nANO / NE`,ans:'ANO',hints:[`Dosaď x = ${x} a porovnej y.`],skill:'anal'};})(),
  (()=>{const k=ri(2,5);return{text:`Je funkce y = ${k}x − 3 klesající?\nANO / NE`,ans:'NE',hints:[`Kladná směrnice k = ${k} → funkce roste.`],skill:'anal'};})(),
  (()=>{const k=ri(2,5),q=ri(2,9);return{text:`Určuje záporná směrnice u y = −${k}x + ${q} klesající funkci?\nANO / NE`,ans:'ANO',hints:[`k = −${k} < 0.`],skill:'anal'};})(),
  (()=>{const k=ri(2,5),q=ri(2,8),x=ri(2,6);return{text:`Prochází graf y = ${k}x + ${q} bodem [${x}, ${k*x+q+1}]?\nANO / NE`,ans:'NE',hints:[`f(${x}) = ${k*x+q}, ne ${k*x+q+1}.`],skill:'anal'};})(),
  (()=>{const k=ri(2,4),x0=ri(2,5),q=-k*x0;return{text:`Je x = ${x0} nulový bod funkce y = ${k}x ${q<0?'− '+(-q):'+ '+q}?\nANO / NE`,ans:'ANO',hints:[`Dosaď x = ${x0} a ověř, že y = 0.`],skill:'anal'};})(),
  (()=>{const k=ri(2,5),q=ri(2,8);return{text:`Kolik má lineární funkce y = ${k}x + ${q} průsečíků s osou x?`,ans:'1',hints:[`Nekonstantní přímka protíná osu x právě jednou.`],skill:'anal'};})(),
  (()=>{const k=ri(2,6);return{text:`Datový provoz roste podle y = ${k}x. Je tato funkce rostoucí?\nANO / NE`,ans:'ANO',hints:[`Kladná směrnice k = ${k} → funkce roste.`],skill:'anal'};})()
 ],
 '6-3': () => [
  (()=>{const x=[2,3,4,6][ri(0,3)],k=x*ri(2,8);return{text:`Nepřímá úměrnost y = ${k}/x. Vypočítej funkční hodnotu f(${x}).`,ans:String(k/x),hints:[`Dosaď: ${k} : ${x}.`],skill:'geo'};})(),
  (()=>{const y=[2,3,4,5][ri(0,3)],k=y*ri(2,8);return{text:`Pro kterou hodnotu x nabývá funkce y = ${k}/x hodnoty ${y}?`,ans:String(k/y),hints:[`Z rovnice ${y} = ${k}/x plyne x = ${k} : ${y}.`],skill:'geo'};})(),
  (()=>{const x=ri(2,6),y=ri(2,8);return{text:`Graf funkce y = k/x prochází bodem [${x}, ${y}]. Urči konstantu k.`,ans:String(x*y),hints:[`Konstanta k = x · y.`],skill:'geo'};})(),
  (()=>{return{text:`Pro jakou hodnotu x není funkce y = 20/x definovaná?\nx ≠`,ans:'0',hints:[`Jmenovatel x nesmí být nula.`],skill:'geo'};})(),
  (()=>{const k=[12,24,36,48][ri(0,3)],x=[2,3,4,6][ri(0,3)];return{text:`Jakou hodnotu y přiřadí funkce y = ${k}/x číslu x = ${x}?`,ans:String(k/x),hints:[`${k} : ${x}.`],skill:'geo'};})(),
  (()=>{const x=[2,4,5,10][ri(0,3)],k=x*ri(3,9);return{text:`Kolik je f(${x}) u funkce y = ${k}/x?`,ans:String(k/x),hints:[`${k} : ${x}.`],skill:'geo'};})(),
  (()=>{const k=ri(2,8)*6,x=[2,3,6][ri(0,2)];return{text:`Urči y pro x = ${x}, je-li y = ${k}/x.`,ans:String(k/x),hints:[`${k} : ${x}.`],skill:'geo'};})(),
  (()=>{const y=ri(2,8),x=ri(2,6);return{text:`Hyperbola y = k/x prochází bodem [${x}, ${y}]. Jaká je hodnota konstanty k?`,ans:String(x*y),hints:[`k = x · y = ${x} · ${y}.`],skill:'geo'};})(),
  (()=>{const k=ri(2,6)*4,x=[2,4][ri(0,1)];return{text:`Dosaď x = ${x} do funkce y = ${k}/x a urči y.`,ans:String(k/x),hints:[`${k} : ${x}.`],skill:'geo'};})(),
  (()=>{return{text:`Klesá hyperbola y = 12/x na intervalu x > 0?\nANO / NE`,ans:'ANO',hints:[`Pro rostoucí kladné x hodnota y klesá.`],skill:'geo'};})(),
  (()=>{const k=[12,18,24][ri(0,2)],x1=2,x2=[3,4,6][ri(0,2)];return{text:`U funkce y = ${k}/x: je funkční hodnota v bodě x = ${x2} menší než v bodě x = ${x1}?\nANO / NE`,ans:'ANO',hints:[`Větší x → menší y (nepřímá úměrnost).`],skill:'geo'};})(),
  (()=>{const x=[2,3,4,6][ri(0,3)],k=x*ri(2,8);return{text:`Odezva serveru klesá podle y = ${k}/x, kde x je počet uzlů.\nJaká je odezva y pro x = ${x}?`,ans:String(k/x),hints:[`${k} : ${x}.`,`Výsledek: ${k/x}`],skill:'geo'};})()
 ],

 // ───────── OBLAST 7 — JÁDRO SYSTÉMU ─────────
 '7-1': () => [
  (()=>{const a=ri(3,9),k=ri(2,4);return{svg:svgSimilar(k),text:`Podobné trojúhelníky, k = ${k}.\nStraně ${a} cm odpovídá? (cm)`,ans:String(a*k),hints:[`${a} · ${k}.`],skill:'geo'};})(),
  (()=>{const k=ri(2,4),orig=ri(4,9)*k;return{text:`Zmenšení k = 1/${k}.\nStrana ${orig} cm → ? (cm)`,ans:String(orig/k),hints:[`${orig} : ${k}.`],skill:'geo'};})(),
  (()=>{const a=ri(2,6),k=ri(2,4);return{text:`Originál ${a} cm, obraz ${a*k} cm.\nKoeficient k?`,ans:String(k),hints:[`${a*k} : ${a}.`],skill:'geo'};})(),
  (()=>{const onmap=ri(2,9),mer=500;return{text:`Mapa 1 : ${mer}. Úsek na mapě ${onmap} cm.\nKolik m ve skutečnosti?`,ans:String(onmap*mer/100),hints:[`${onmap} × ${mer} cm → m.`],skill:'geo'};})(),
  (()=>{const o=ri(3,8)*3,k=ri(2,4);return{text:`Podobné, k = ${k}. Obvod originálu ${o} cm.\nObvod obrazu? (cm)`,ans:String(o*k),hints:[`× ${k}.`],skill:'geo'};})(),
  (()=>{const onmap=ri(2,8),mer=2000;return{text:`Mapa 1 : ${mer}. Na mapě ${onmap} cm.\nKolik m ve skutečnosti?`,ans:String(onmap*mer/100),hints:[`${onmap} × ${mer} cm → m.`],skill:'geo'};})(),
  (()=>{const a=ri(5,20),k=ri(2,4);return{text:`Podobné tvary, k = ${k}.\nObvod originálu ${a} cm → obvod obrazu? (cm)`,ans:String(a*k),hints:[`Obvod × k.`],skill:'geo'};})(),
  (()=>{const onmap=ri(3,9),mer=[200,500,1000][ri(0,2)];return{text:`Mapa 1 : ${mer}. Na mapě ${onmap} cm.\nSkutečná vzdálenost? (m)`,ans:String(onmap*mer/100),hints:[`${onmap} × ${mer} : 100.`],skill:'geo'};})(),
  (()=>{const orig=ri(4,12),k=ri(2,4);return{text:`Originál ${orig} cm, obraz ${orig*k} cm.\nJe to zvětšení k = ${k}?\nANO / NE`,ans:'ANO',hints:[`${orig*k} : ${orig} = ${k}.`],skill:'geo'};})(),
  (()=>{const k=ri(2,3),a=ri(3,10),b=ri(3,10);return{text:`Obdélník ${a} × ${b} cm zvětšen k = ${k}.\nObsah obrazu? (cm²)`,ans:String(a*k*b*k),hints:[`(${a*k}) × (${b*k}).`],skill:'geo'};})(),
  (()=>{const a=ri(3,9),k=ri(2,4);return{text:`Schéma čipu zvětšíš v poměru k = ${k}. Vodič dlouhý ${a} mm bude na zvětšenině jak dlouhý? (mm)`,ans:String(a*k),hints:[`${a} × ${k}.`,`Výsledek: ${a*k}`],skill:'geo'};})()
 ],
 '7-2': () => [
  (()=>{const r=ri(2,6),v=ri(5,12);return{svg:svgCylinder(r,v),text:`Válec: r = ${r} cm, v = ${v} cm.\nObjem? (cm³, π = 3,14)`,ans:String(Math.round(3.14*r*r*v)),hints:[`π·r²·v.`],skill:'geo'};})(),
  (()=>{const r=ri(2,6),v=ri(4,10);return{svg:svgCylinder(r,v),text:`Válec: r = ${r} cm, v = ${v} cm.\nPovrch? (cm², π = 3,14)`,ans:String(Math.round(2*3.14*r*(r+v))),hints:[`2πr(r+v).`],skill:'geo'};})(),
  (()=>{const r=ri(2,5);return{svg:svgSphere(r),text:`Koule r = ${r} cm.\nObjem? (cm³, π = 3,14)`,ans:String(Math.round(4/3*3.14*r*r*r)),hints:[`4/3·π·r³.`],skill:'geo'};})(),
  (()=>{const r=ri(2,6);return{svg:svgSphere(r),text:`Koule r = ${r} cm.\nPovrch? (cm², π = 3,14)`,ans:String(Math.round(4*3.14*r*r)),hints:[`4πr².`],skill:'geo'};})(),
  (()=>{const r=ri(2,6),v=ri(4,9);return{svg:svgCone(r,v),text:`Kužel: r = ${r} cm, v = ${v} cm.\nObjem? (cm³, π = 3,14)`,ans:String(Math.round(1/3*3.14*r*r*v)),hints:[`1/3·π·r²·v.`],skill:'geo'};})(),
  (()=>{const a=ri(3,8),b=ri(3,8),c=ri(3,8);return{svg:svgCuboid(a,b,c),text:`Kvádr ${a} × ${b} × ${c} cm.\nObjem? (cm³)`,ans:String(a*b*c),hints:[`a · b · c.`],skill:'geo'};})(),
  (()=>{const r=ri(2,5),v=ri(3,8);return{svg:svgCylinder(r,v),text:`Válec: r = ${r} dm, v = ${v} dm.\nObjem v litrech? (1 dm³ = 1 l)`,ans:String(Math.round(3.14*r*r*v)),hints:[`V = π·r²·v = 3,14·${r*r}·${v}.`],skill:'geo'};})(),
  (()=>{const r=ri(2,5);return{svg:svgSphere(r),text:`Koule r = ${r} cm.\nJe povrch ${Math.round(4*3.14*r*r)} cm²?\nANO / NE`,ans:'ANO',hints:[`S = 4πr² = 4·3,14·${r*r}.`],skill:'geo'};})(),
  (()=>{const a=ri(2,6),b=ri(2,6),c=ri(2,6);return{svg:svgCuboid(a,b,c),text:`Kvádr ${a}×${b}×${c} cm.\nPovrch? (cm²)`,ans:String(2*(a*b+b*c+a*c)),hints:[`2(ab+bc+ac).`],skill:'geo'};})(),
  (()=>{const r=ri(2,5),v=ri(3,8);return{svg:svgCone(r,v),text:`Kužel: r = ${r} cm, v = ${v} cm.\nObjem? (cm³, π = 3,14)`,ans:String(Math.round(1/3*3.14*r*r*v)),hints:[`V = 1/3·π·r²·v.`],skill:'geo'};})(),
  (()=>{const a=ri(3,8);return{svg:svgCuboid(a,a,a),text:`Krychle s hranou ${a} cm.\nObjem? (cm³)`,ans:String(a*a*a),hints:[`V = a³ = ${a}³.`],skill:'geo'};})(),
  (()=>{const r=ri(2,6);return{svg:svgCylinder(r,r),text:`Podstava válce má poloměr ${r} cm.\nJaký je obsah kruhové podstavy? (cm², π = 3,14)`,ans:String(Math.round(3.14*r*r)),hints:[`S = π·r² = 3,14 · ${r*r}.`],skill:'geo'};})(),
  (()=>{const a=ri(3,8);return{svg:svgCuboid(a,a,a),text:`Datová krychle má hranu ${a} jednotek.\nKolik datových buněk (objem) obsahuje? (jednotek³)`,ans:String(a*a*a),hints:[`V = a³ = ${a}³.`,`Výsledek: ${a*a*a}`],skill:'geo'};})(),
  (()=>{const a=ri(3,6),b=ri(2,5),c=ri(2,4),V=a*b*c;return{svg:svgCuboid(`${a} dm`,`${b} dm`,`${c} dm`),text:`Akvárium tvaru kvádru má rozměry ${a} × ${b} × ${c} dm.\nKolik litrů vody se do něj vejde? (1 dm³ = 1 l)`,ans:String(V),hints:[`V = a · b · c = ${a} · ${b} · ${c}.`,`Výsledek: ${V} l`],skill:'geo'};})(),
  (()=>{const r=ri(2,5),v=ri(6,12),S=Math.round(2*3.14*r*(r+v));return{svg:svgCylinder(r,v),text:`Plechovka tvaru válce má poloměr ${r} cm a výšku ${v} cm.\nKolik cm² plechu je na ni potřeba (celý povrch)? (π = 3,14)`,ans:String(S),hints:[`S = 2πr(r+v) = 2 · 3,14 · ${r} · ${r+v}.`,`Výsledek: ${S} cm²`],skill:'geo'};})(),
  (()=>{const r=ri(2,5),v=ri(4,9),V=Math.round(3.14*r*r*v);return{svg:svgCylinder(r,v),text:`Zásobník tvaru válce má poloměr podstavy ${r} dm a výšku ${v} dm.\nKolik litrů pojme? (π = 3,14; 1 dm³ = 1 l)`,ans:String(V),hints:[`V = π · r² · v = 3,14 · ${r*r} · ${v}.`,`Výsledek: ${V} l`],skill:'geo'};})()
 ],
 '7-3': () => [
  (()=>{const a=ri(6,13);return{text:`${window._fc()}:\n${a}² =`,ans:String(a*a),hints:[`${a} × ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,8),x=ri(2,12),b=ri(2,15);return{text:`${window._fe()}:\n${a}x + ${b} = ${a*x+b}`,ans:String(x),hints:[`Odečti ${b}, vyděl ${a}.`],skill:'anal'};})(),
  (()=>{const z=ri(2,8)*100,p=[10,20,25,50][ri(0,3)];return{text:`${window._fc()}:\n${p} % z ${z} =`,ans:String(z*p/100),hints:[`1 % = ${z/100}.`],skill:'anal'};})(),
  (()=>{const t=[[3,4,5],[6,8,10],[5,12,13]][ri(0,2)];return{svg:svgTriangle('pravo',{v:['C','A','B']}),text:`Pravoúhlý trojúhelník, odvěsny ${t[0]} a ${t[1]} cm.\nPřepona? (cm)`,ans:String(t[2]),hints:[`c² = ${t[0]*t[0]} + ${t[1]*t[1]}.`],skill:'geo'};})(),
  (()=>{const r=ri(2,5),v=ri(5,10);return{svg:svgCylinder(r,v),text:`Válec r = ${r} cm, v = ${v} cm.\nObjem? (cm³, π = 3,14)`,ans:String(Math.round(3.14*r*r*v)),hints:[`3,14 · ${r*r} · ${v}.`],skill:'geo'};})(),
  (()=>{const x=ri(2,10),y=ri(2,10);return{text:`Vyřeš soustavu, urči x:\nx + y = ${x+y}\nx − y = ${x-y}`,ans:String(x),hints:[`2x = ${2*x}.`],skill:'anal'};})(),
  (()=>{const a=ri(2,8),x=ri(2,9),b=ri(2,8);return{text:`${window._fe()}:\n${a}x + ${b} = ${a*x+b}`,ans:String(x),hints:[`${a}x = ${a*x}.`],skill:'anal'};})(),
  (()=>{const k=ri(2,3),a=ri(3,10);return{text:`Podobné: k = ${k}, strana originálu ${a} cm.\nObraz? (cm)`,ans:String(a*k),hints:[`${a} × ${k}.`],skill:'geo'};})(),
  (()=>{const a=ri(2,5)*10,p=[10,20,25][ri(0,2)];return{text:`${p} % z ${a*10} Kč?`,ans:String(a*10*p/100),hints:[`1 % = ${a/10} Kč.`],skill:'anal'};})(),
  (()=>{const x=ri(2,10),y=ri(2,10);return{text:`Soustava rovnic:\nx + y = ${x+y}\n2x − y = ${2*x-y}\nUrči x.`,ans:String(x),hints:[`Sečti rovnice: 3x = ${3*x}.`],skill:'anal'};})(),
  (()=>{const z=ri(2,8)*100,p=[10,20,25][ri(0,2)];return{text:`Firewall zablokoval ${p} % z ${z} paketů.\nKolik paketů zablokoval?`,ans:String(z*p/100),hints:[`${p} % z ${z} = ${z}/100 × ${p}.`,`Výsledek: ${z*p/100}`],skill:'anal'};})()
 ]

};
