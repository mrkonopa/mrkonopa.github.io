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
window.RPG_TASK_EXTRA_9 = {

 // ───────── OBLAST 1 — VSTUPNÍ TERMINÁL ─────────
 '1-1': () => [
  (()=>{const a=ri(120,460),b=ri(120,460),c=ri(50,200);return{text:`Vypočítej:\n${a} + ${b} + ${c} =`,ans:String(a+b+c),hints:[`Sčítej postupně.`,`${a+b} + ${c}`],skill:'calc'};})(),
  (()=>{const a=ri(11,30),b=ri(3,9);return{text:`Vypočítej:\n${a} × ${b} =`,ans:String(a*b),hints:[`Rozlož na desítky a jednotky.`,``],skill:'calc'};})(),
  (()=>{const b=ri(6,12),q=ri(4,12),a=b*q;return{text:`Vypočítej:\n${a} ÷ ${b} =`,ans:String(q),hints:[`${b} × ? = ${a}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(11,29);return{text:`Vypočítej:\n${a}² =`,ans:String(a*a),hints:[`${a} × ${a}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,9),b=ri(2,9),c=ri(2,9);return{text:`Vypočítej (závorka první):\n(${a} + ${b}) × ${c} =`,ans:String((a+b)*c),hints:[`${a+b} × ${c}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(1000,9000);const r=Math.round(a/1000)*1000;return{text:`Zaokrouhli na tisíce:\n${a} ≈`,ans:String(r),hints:[`Rozhoduje číslice stovek (${Math.floor(a/100)%10}).`,``],skill:'calc'};})()
 ],
 '1-2': () => [
  (()=>{const z=ri(2,9)*200,p=[5,10,20,50][ri(0,3)];return{text:`Vypočítej:\n${p} % z ${z} =`,ans:String(z*p/100),hints:[`1 % = ${z/100}.`,`${z/100} × ${p}`],skill:'anal'};})(),
  (()=>{const z=ri(2,9)*100,p=[10,20,25][ri(0,2)];return{text:`Cena ${z} Kč klesne o ${p} %.\nNová cena? (Kč)`,ans:String(z-z*p/100),hints:[`Sleva ${z*p/100} Kč.`,``],skill:'anal'};})(),
  (()=>{const cel=ri(4,10)*25,cast=cel*[20,40,60][ri(0,2)]/100;return{text:`Kolik % je ${cast} z ${cel}?`,ans:String(Math.round(cast/cel*100)),hints:[`${cast} ÷ ${cel} × 100.`,``],skill:'anal'};})(),
  (()=>{const y=ri(2,9)*1000,pm=[2,4,5,8][ri(0,3)];return{text:`Vypočítej:\n${pm} ‰ z ${y} =`,ans:String(y*pm/1000),hints:[`1 ‰ = ${y/1000}.`,``],skill:'anal'};})(),
  (()=>{const p=[10,20,25,50][ri(0,3)],cel=ri(3,9)*40,cast=cel*p/100;return{text:`${cast} je ${p} % z nějakého čísla.\nJaké to je?`,ans:String(cel),hints:[`Celek = ${cast} ÷ ${p} × 100.`,``],skill:'anal'};})(),
  (()=>{const z=ri(3,9)*100,p=[10,20,50][ri(0,2)];return{text:`Plat ${z} Kč vzroste o ${p} %.\nNový plat? (Kč)`,ans:String(z+z*p/100),hints:[`+ ${z*p/100} Kč.`,``],skill:'anal'};})()
 ],
 '1-3': () => [
  (()=>{const a=ri(5,20),b=ri(3,15);return{text:`Vypočítej:\n${a} + (-${b}) =`,ans:String(a-b),hints:[`Plus a minus dává minus.`,`${a} − ${b}`],skill:'calc'};})(),
  (()=>{const a=ri(4,15),b=ri(4,15);return{text:`Vypočítej:\n(-${a}) − (-${b}) =`,ans:String(-a+b),hints:[`− (−${b}) = + ${b}.`,`−${a} + ${b}`],skill:'calc'};})(),
  (()=>{const a=ri(2,9),b=ri(2,9);return{text:`Vypočítej:\n(-${a}) × (-${b}) =`,ans:String(a*b),hints:[`− × − = +.`,``],skill:'calc'};})(),
  (()=>{const b=ri(2,6),q=ri(2,9),a=b*q;return{text:`Vypočítej:\n(-${a}) ÷ (-${b}) =`,ans:String(q),hints:[`− ÷ − = +.`,``],skill:'calc'};})(),
  (()=>{const a=ri(3,9);return{text:`Vypočítej:\n−${a}² =`,ans:String(-a*a),hints:[`Umocní se jen ${a}, mínus zůstává: −(${a*a}).`,``],skill:'calc'};})(),
  (()=>{const a=ri(3,10),b=ri(3,10),c=ri(2,8);return{text:`Vypočítej:\n(-${a}) + ${b} − ${c} =`,ans:String(-a+b-c),hints:[`Postupuj zleva doprava.`,``],skill:'calc'};})()
 ],

 // ───────── OBLAST 2 — MOCNINOVÝ REAKTOR ─────────
 '2-1': () => [
  (()=>{const a=ri(11,20);return{text:`Vypočítej:\n${a}² =`,ans:String(a*a),hints:[`${a} × ${a}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,5);return{text:`Vypočítej:\n${a}⁴ =`,ans:String(a**4),hints:[`${a}² = ${a*a}, pak na druhou.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,12);return{text:`Vypočítej:\n√${a*a} =`,ans:String(a),hints:[`Které číslo na druhou dá ${a*a}?`,``],skill:'calc'};})(),
  (()=>{const n=ri(3,6);return{text:`Vypočítej:\n3^${n} =`,ans:String(3**n),hints:[`Násob trojku ${n}×.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,4);return{text:`Vypočítej:\n∛${a**3} =`,ans:String(a),hints:[`Které číslo na třetí dá ${a**3}?`,``],skill:'calc'};})(),
  (()=>{const n=ri(5,9);return{text:`Vypočítej:\n2^${n} =`,ans:String(2**n),hints:[`Dvojka ${n}×.`,``],skill:'calc'};})()
 ],
 '2-2': () => [
  (()=>{const z=ri(2,3),m=ri(2,4),n=ri(2,3);return{text:`Zapiš číslem:\n${z}^${m} · ${z}^${n} =`,ans:String(z**(m+n)),hints:[`Exponenty se sčítají: ${z}^${m+n}.`,``],skill:'anal'};})(),
  (()=>{const z=ri(2,4),m=ri(5,6),n=ri(2,4);return{text:`Zapiš číslem:\n${z}^${m} : ${z}^${n} =`,ans:String(z**(m-n)),hints:[`Exponenty se odčítají: ${z}^${m-n}.`,``],skill:'anal'};})(),
  (()=>{const a=ri(2,15);return{text:`Vypočítej:\n${a}^1 =`,ans:String(a),hints:[`Na prvou = samo číslo.`,``],skill:'anal'};})(),
  (()=>{const a=ri(2,5),b=ri(2,3);return{text:`Zapiš číslem:\n(${a}^${b})² =`,ans:String(a**(b*2)),hints:[`Exponenty se násobí: ${a}^${b*2}.`,``],skill:'anal'};})(),
  (()=>{const a=ri(2,4);return{text:`Vypočítej:\n(-${a})⁴ =`,ans:String(a**4),hints:[`Sudý exponent → výsledek kladný.`,``],skill:'anal'};})(),
  (()=>{const a=ri(2,4),b=ri(2,3);return{text:`Zapiš číslem:\n(${a} · ${b})² =`,ans:String((a*b)**2),hints:[`(${a*b})².`,``],skill:'anal'};})()
 ],
 '2-3': () => [
  (()=>{const a=ri(2,9),n=ri(2,4),v=a*(10**n);return{text:`Vyjádři jako běžné číslo:\n${a}·10^${n} =`,ans:String(v),hints:[`Posuň čárku o ${n} míst doprava.`,``],skill:'anal'};})(),
  (()=>{const a=ri(2,9),n=ri(3,6),v=a*(10**n);return{text:`${v.toLocaleString('cs-CZ')} = ${a}·10ⁿ.\nJaké je n?`,ans:String(n),hints:[`Počet posunů čárky.`,``],skill:'anal'};})(),
  (()=>{const t=[[3,4,5],[6,8,10],[5,12,13],[9,12,15],[8,15,17]][ri(0,4)];return{svg:svgTriangle('pravo',{v:['C','A','B']}),text:`Pravoúhlý trojúhelník, odvěsny ${t[0]} a ${t[1]} cm.\nPřepona c? (cm)`,ans:String(t[2]),hints:[`c² = ${t[0]*t[0]} + ${t[1]*t[1]}.`,`c = √${t[2]*t[2]}`],skill:'geo'};})(),
  (()=>{const t=[[3,4,5],[6,8,10],[5,12,13],[8,15,17]][ri(0,3)];return{svg:svgTriangle('pravo',{v:['C','A','B']}),text:`Pravoúhlý trojúhelník: přepona ${t[2]} cm, odvěsna ${t[1]} cm.\nDruhá odvěsna? (cm)`,ans:String(t[0]),hints:[`a² = ${t[2]*t[2]} − ${t[1]*t[1]}.`,``],skill:'geo'};})(),
  (()=>{const a=ri(2,9);return{text:`Vypočítej:\n√(${a}²·10⁶) =`,ans:String(a*1000),hints:[`√10⁶ = 1000, √(${a}²) = ${a}.`,``],skill:'anal'};})(),
  (()=>{const a=ri(2,9),n=ri(2,4);return{text:`Číslo 0,${'0'.repeat(n-1)}${a} zapiš jako ${a}·10ⁿ.\nn = ? (záporné)`,ans:String(-n),hints:[`Malá čísla → záporný exponent.`,``],skill:'anal'};})()
 ],

 // ───────── OBLAST 3 — ROVNICOVÝ PROCESOR ─────────
 '3-1': () => [
  (()=>{const x=ri(2,20),a=ri(2,20);return{text:`Vyřeš rovnici:\nx + ${a} = ${x+a}`,ans:String(x),hints:[`x = ${x+a} − ${a}.`,``],skill:'calc'};})(),
  (()=>{const x=ri(5,25),a=ri(2,15);return{text:`Vyřeš rovnici:\nx − ${a} = ${x-a}`,ans:String(x),hints:[`x = ${x-a} + ${a}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,9),x=ri(2,12);return{text:`Vyřeš rovnici:\n${a}x = ${a*x}`,ans:String(x),hints:[`x = ${a*x} ÷ ${a}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,7),v=ri(2,9);return{text:`Vyřeš rovnici:\nx / ${a} = ${v}`,ans:String(v*a),hints:[`x = ${v} × ${a}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,8),x=ri(2,12),b=ri(2,15);return{text:`Vyřeš rovnici:\n${a}x + ${b} = ${a*x+b}`,ans:String(x),hints:[`Odečti ${b}, vyděl ${a}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,8),x=ri(3,14),b=ri(2,15);return{text:`Vyřeš rovnici:\n${a}x − ${b} = ${a*x-b}`,ans:String(x),hints:[`Přičti ${b}, vyděl ${a}.`,``],skill:'calc'};})()
 ],
 '3-2': () => [
  (()=>{const a=ri(2,6),x=ri(2,9),b=ri(1,8);return{text:`Vyřeš rovnici:\n${a}(x + ${b}) = ${a*(x+b)}`,ans:String(x),hints:[`Roznásob: ${a}x + ${a*b}.`,``],skill:'anal'};})(),
  (()=>{const a=ri(2,5),x=ri(2,9),b=ri(1,6);return{text:`Vyřeš rovnici:\n${a}(x − ${b}) = ${a*(x-b)}`,ans:String(x),hints:[`Roznásob: ${a}x − ${a*b}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,9),a=ri(3,6),d=ri(1,2),b=ri(2,8),cR=(a-d)*x;return{text:`Vyřeš rovnici:\n${a}x + ${b} = ${d}x + ${cR+b}`,ans:String(x),hints:[`x doleva: ${a-d}x = ${cR}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,8),a=ri(2,7);return{text:`Vyřeš rovnici:\n2(x + ${a}) = ${2*(x+a)}`,ans:String(x),hints:[`x + ${a} = ${x+a}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,6),a=ri(2,4),bb=ri(2,3),e=ri(1,5);return{text:`Vyřeš rovnici:\n${a}(${bb}x − ${e}) = ${a*(bb*x-e)}`,ans:String(x),hints:[`${a*bb}x − ${a*e}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(3,9),a=ri(2,5);return{text:`Vyřeš rovnici:\n5x − ${a} = 3x + ${2*x-a}`,ans:String(x),hints:[`2x = ${2*x}.`,``],skill:'anal'};})()
 ],
 '3-3': () => [
  (()=>{const a=ri(3,12),b=ri(3,12);return{text:`o = 2(a+b).\no = ${2*(a+b)} cm, b = ${b} cm. Urči a. (cm)`,ans:String(a),hints:[`a = o/2 − b = ${(a+b)} − ${b}.`,``],skill:'anal'};})(),
  (()=>{const a=ri(3,12),v=ri(3,12);return{text:`S = a · v.\nS = ${a*v} cm², v = ${v} cm. Urči a. (cm)`,ans:String(a),hints:[`a = S / v = ${a*v} ÷ ${v}.`,``],skill:'anal'};})(),
  (()=>{const vv=ri(40,90),t=ri(2,5);return{text:`s = v · t.\ns = ${vv*t} km, v = ${vv} km/h. Urči t. (h)`,ans:String(t),hints:[`t = s / v.`,``],skill:'anal'};})(),
  (()=>{const x=ri(10,40),a=ri(5,25);return{text:`Slovní úloha:\nČíslo zmenšené o ${a} je ${x-a}. Jaké je?`,ans:String(x),hints:[`x − ${a} = ${x-a}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(3,12);return{text:`Slovní úloha:\nDvojnásobek čísla zvětšený o 5 je ${2*x+5}. Číslo?`,ans:String(x),hints:[`2x + 5 = ${2*x+5}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(4,15);return{text:`Slovní úloha:\nPětinásobek čísla je ${5*x}. Číslo?`,ans:String(x),hints:[`5x = ${5*x}.`,``],skill:'anal'};})()
 ],

 // ───────── OBLAST 4 — SEKTOR LOMENÉHO KÓDU ─────────
 '4-1': () => [
  (()=>{const a=ri(2,9);return{text:`Pro jaké x není 8/(x − ${a}) definováno?\nx ≠`,ans:String(a),hints:[`x − ${a} = 0.`,``],skill:'anal'};})(),
  (()=>{const a=ri(2,9);return{text:`Pro jaké x není 5/(x + ${a}) definováno?\nx ≠`,ans:String(-a),hints:[`x + ${a} = 0.`,``],skill:'anal'};})(),
  (()=>{const k=ri(1,6),a=2*k;return{text:`Pro jaké x není 6/(2x − ${a}) definováno?\nx ≠`,ans:String(k),hints:[`2x = ${a}.`,``],skill:'anal'};})(),
  (()=>{const k=ri(1,5),a=5*k;return{text:`Pro jaké x není 2/(5x − ${a}) definováno?\nx ≠`,ans:String(k),hints:[`5x = ${a}.`,``],skill:'anal'};})(),
  (()=>{const a=ri(2,8);return{text:`Pro jaké x není (x−3)/(x − ${a}) definováno?\nx ≠`,ans:String(a),hints:[`Rozhoduje jmenovatel.`,``],skill:'anal'};})(),
  (()=>{return{text:`Pro jaké x není 10/x definováno?\nx ≠`,ans:'0',hints:[`Jmenovatel je x.`,``],skill:'anal'};})()
 ],
 '4-2': () => [
  (()=>{const x=ri(2,6),a=x*ri(1,4);return{text:`Vypočítej hodnotu (3x + ${a}) / x\npro x = ${x}.`,ans:String(3+a/x),hints:[`(${3*x} + ${a}) ÷ ${x}.`,``],skill:'anal'};})(),
  (()=>{const d=ri(2,9),n=d*ri(2,6),g=gcd(n,d);return{text:`Zkrať na základní tvar:\n${n}/${d} =`,ans:(d/g===1?String(n/g):`${n/g}/${d/g}`),hints:[`Vyděl čitatele i jmenovatele ${g}.`,``],skill:'calc'};})(),
  (()=>{const x=ri(3,9),a=ri(1,3);return{text:`Vypočítej hodnotu (x − ${a})(x + ${a})\npro x = ${x}.`,ans:String(x*x-a*a),hints:[`x² − ${a*a} = ${x*x} − ${a*a}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,6),a=x*ri(1,5);return{text:`Vypočítej hodnotu (x² + ${a}) / x\npro x = ${x}.`,ans:String(x+a/x),hints:[`(${x*x} + ${a}) ÷ ${x}.`,``],skill:'anal'};})(),
  (()=>{const x=[2,4,5,10][ri(0,3)],k=x*ri(2,6),b=ri(1,9);return{text:`Vypočítej hodnotu ${k}/x + ${b}\npro x = ${x}.`,ans:String(k/x+b),hints:[`${k} ÷ ${x} = ${k/x}, + ${b}.`,``],skill:'anal'};})(),
  (()=>{const b=ri(2,6),x=b*ri(2,6),a=ri(1,9);return{text:`Vypočítej hodnotu (x + ${a})/${b}\npro x = ${x-a}.`,ans:String(x/b),hints:[`(${x-a} + ${a}) ÷ ${b}.`,``],skill:'anal'};})()
 ],
 '4-3': () => [
  (()=>{const x=ri(2,9),b=ri(2,6),a=b*x;return{text:`Vyřeš rovnici:\n${a} / x = ${b}`,ans:String(x),hints:[`${a} = ${b}x.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,8),q=ri(3,6),a=x*q,b=ri(1,q-1);return{text:`Vyřeš rovnici:\n${a} / x − ${b} = ${q-b}`,ans:String(x),hints:[`${a}/x = ${q}.`,``],skill:'anal'};})(),
  (()=>{const x=[2,3,4,5,6,7][ri(0,5)];return{text:`Vyřeš rovnici (kladné x):\n${x*x} / x = x`,ans:String(x),hints:[`${x*x} = x².`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,8),r=ri(2,5),c=r*x;return{text:`Vyřeš rovnici:\n${c} / x = ${r}`,ans:String(x),hints:[`${c} = ${r}x.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,6),s=x*ri(2,5),a=ri(1,s-1),b=s-a;return{text:`Vyřeš rovnici:\n${a}/x + ${b}/x = ${s/x}`,ans:String(x),hints:[`${s}/x = ${s/x}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,8),a=ri(2,6),c=a*x;return{text:`Vyřeš rovnici:\nx = ${c} / ${a}`,ans:String(x),hints:[`${c} ÷ ${a}.`,``],skill:'anal'};})()
 ],

 // ───────── OBLAST 5 — SÍŤOVÝ UZEL ─────────
 '5-1': () => [
  (()=>{const x=ri(2,12),y=ri(2,12);return{text:`Vyřeš soustavu, urči x:\nx + y = ${x+y}\nx − y = ${x-y}`,ans:String(x),hints:[`Sečti rovnice: 2x = ${2*x}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,12),y=ri(2,12);return{text:`Vyřeš soustavu, urči y:\nx + y = ${x+y}\nx − y = ${x-y}`,ans:String(y),hints:[`Odečti rovnice: 2y = ${2*y}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,8),y=2*x;return{text:`Vyřeš soustavu, urči x:\ny = 2x\nx + y = ${3*x}`,ans:String(x),hints:[`3x = ${3*x}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,9),y=ri(2,9);return{text:`Vyřeš soustavu, urči x:\nx + y = ${x+y}\n2x + y = ${2*x+y}`,ans:String(x),hints:[`Odečti rovnice: x = ${x}.`,``],skill:'anal'};})(),
  (()=>{const a=ri(6,14),b=ri(2,a-2);return{text:`Součet dvou čísel je ${a+b}, rozdíl ${a-b}.\nVětší z čísel?`,ans:String(a),hints:[`(součet + rozdíl) / 2.`,``],skill:'anal'};})(),
  (()=>{const x=ri(3,9),y=ri(2,8);return{text:`Vyřeš soustavu, urči y:\nx = ${x}\n2x + 3y = ${2*x+3*y}`,ans:String(y),hints:[`3y = ${3*y}.`,``],skill:'anal'};})()
 ],
 '5-2': () => [
  (()=>{const m=ri(2,8)*50,p=[10,20,25,50][ri(0,3)];return{text:`Roztok ${m} g obsahuje ${p} % soli.\nKolik g soli?`,ans:String(m*p/100),hints:[`${p} % z ${m}.`,``],skill:'anal'};})(),
  (()=>{const s=ri(2,9)*10,m=s*ri(4,8);return{text:`Roztok ${m} g, v něm ${s} g soli.\nKolik %?`,ans:String(Math.round(s/m*100)),hints:[`${s} ÷ ${m} × 100.`,``],skill:'anal'};})(),
  (()=>{const t=ri(4,10);return{text:`Práci zvládne dělník za ${t} h.\nKolik % udělá za 1 h?`,ans:String(Math.round(100/t)),hints:[`100 ÷ ${t}.`,``],skill:'anal'};})(),
  (()=>{const a=ri(2,5),pa=ri(8,15)*10,b=ri(2,5),pb=ri(2,7)*10;const tot=Math.round((a*pa+b*pb)/(a+b));return{text:`${a} kg po ${pa} Kč a ${b} kg po ${pb} Kč.\nCena 1 kg směsi? (Kč)`,ans:String(tot),hints:[`(${a*pa} + ${b*pb}) ÷ ${a+b}.`,``],skill:'anal'};})(),
  (()=>{const t=ri(2,5)*2,h=t/2;return{text:`Zakázka za ${t} h.\nKolik % hotovo za ${h} h?`,ans:String(Math.round(h/t*100)),hints:[`${h} ÷ ${t} × 100.`,``],skill:'anal'};})(),
  (()=>{const n=ri(2,6),one=ri(3,8);return{text:`Jeden dělník udělá ${one} dílů za hodinu.\nKolik dílů ${n} dělníků za hodinu?`,ans:String(n*one),hints:[`${n} × ${one}.`,``],skill:'anal'};})()
 ],
 '5-3': () => [
  (()=>{const v=ri(5,12)*10,t=ri(2,5);return{text:`Rychlost ${v} km/h, čas ${t} h.\nDráha? (km)`,ans:String(v*t),hints:[`s = v · t.`,``],skill:'anal'};})(),
  (()=>{const v=ri(6,12)*10,t=ri(2,5);return{text:`Dráha ${v*t} km, rychlost ${v} km/h.\nČas? (h)`,ans:String(t),hints:[`t = s / v.`,``],skill:'anal'};})(),
  (()=>{const v=ri(6,15)*10,t=ri(2,5);return{text:`Ujel ${v*t} km za ${t} h.\nPrůměrná rychlost? (km/h)`,ans:String(v),hints:[`v = s / t.`,``],skill:'anal'};})(),
  (()=>{const v1=ri(4,7)*10,v2=ri(4,7)*10,t=ri(2,5);return{text:`Proti sobě ${v1} a ${v2} km/h, vzdálenost ${(v1+v2)*t} km.\nZa kolik h se potkají?`,ans:String(t),hints:[`Sbližují se ${v1+v2} km/h.`,``],skill:'anal'};})(),
  (()=>{const v1=ri(3,5)*10,v2=v1+ri(2,4)*10,t=ri(2,4);return{text:`${v1} a ${v2} km/h stejným směrem.\nNáskok rychlejšího po ${t} h? (km)`,ans:String((v2-v1)*t),hints:[`(${v2}−${v1}) · ${t}.`,``],skill:'anal'};})(),
  (()=>{const v=ri(8,12)*10,t=[1.5,2.5][ri(0,1)];return{text:`Rychlost ${v} km/h.\nDráha za ${cz(t)} h? (km)`,ans:String(v*t),hints:[`${v} · ${cz(t)}.`,``],skill:'anal'};})()
 ],

 // ───────── OBLAST 6 — GRAFOVÝ MONITOR ─────────
 '6-1': () => [
  (()=>{const k=ri(2,5),q=ri(1,6),x=ri(2,5);return{svg:svgLineGraph(k,q),text:`y = ${k}x + ${q}\nVypočítej f(${x}).`,ans:String(k*x+q),hints:[`${k}·${x} + ${q}.`,``],skill:'geo'};})(),
  (()=>{const k=ri(2,5),q=ri(2,8);return{svg:svgLineGraph(k,q),text:`y = ${k}x + ${q}\nKde protíná osu y? (y)`,ans:String(q),hints:[`x = 0 → y = q.`,``],skill:'geo'};})(),
  (()=>{const k=ri(2,4),x0=ri(1,5),q=-k*x0;return{text:`y = ${k}x ${q<0?'− '+(-q):'+ '+q}\nPro jaké x je y = 0?`,ans:String(x0),hints:[`x = ${-q} ÷ ${k}.`,``],skill:'geo'};})(),
  (()=>{const k=ri(2,6);return{text:`y = ${k}x\nVypočítej f(2).`,ans:String(2*k),hints:[`${k} · 2.`,``],skill:'geo'};})(),
  (()=>{const k=ri(2,4);return{text:`Přímka prochází body [0, 0] a [1, ${k}].\nSměrnice k?`,ans:String(k),hints:[`Změna y na 1 krok x.`,``],skill:'geo'};})(),
  (()=>{const k=ri(2,5),q=ri(1,7),x=ri(2,6);return{text:`y = ${k}x + ${q}\nVypočítej f(${x}).`,ans:String(k*x+q),hints:[`${k}·${x} + ${q}.`,``],skill:'geo'};})()
 ],
 '6-2': () => [
  (()=>{const k=ri(2,6);return{text:`Je funkce y = ${k}x rostoucí?\nANO / NE`,ans:'ANO',hints:[`Rostoucí ⇔ k > 0.`,``],skill:'anal'};})(),
  (()=>{const k=ri(2,6);return{text:`Je funkce y = −${k}x + 3 rostoucí?\nANO / NE`,ans:'NE',hints:[`k = −${k} < 0 → klesající.`,``],skill:'anal'};})(),
  (()=>{const q=ri(2,8);return{text:`Je funkce y = ${q} (konstantní) rostoucí?\nANO / NE`,ans:'NE',hints:[`k = 0.`,``],skill:'anal'};})(),
  (()=>{const k=ri(2,5),q=ri(2,8);return{text:`y = ${k}x + ${q}\nPrůsečík s osou y? (jen y)`,ans:String(q),hints:[`x = 0.`,``],skill:'anal'};})(),
  (()=>{const k=ri(2,4),x0=ri(2,5),q=-k*x0;return{text:`y = ${k}x ${q<0?'− '+(-q):'+ '+q}\nPrůsečík s osou x? (jen x)`,ans:String(x0),hints:[`y = 0.`,``],skill:'anal'};})(),
  (()=>{const k=ri(2,4),q=ri(1,5),x=ri(2,5);return{text:`Prochází y = ${k}x + ${q} bodem [${x}, ${k*x+q}]?\nANO / NE`,ans:'ANO',hints:[`Dosaď x = ${x}.`,``],skill:'anal'};})()
 ],
 '6-3': () => [
  (()=>{const x=[2,3,4,6][ri(0,3)],k=x*ri(2,8);return{text:`y = ${k}/x\nVypočítej f(${x}).`,ans:String(k/x),hints:[`${k} ÷ ${x}.`,``],skill:'geo'};})(),
  (()=>{const y=[2,3,4,5][ri(0,3)],k=y*ri(2,8);return{text:`y = ${k}/x\nPro jaké x je y = ${y}?`,ans:String(k/y),hints:[`x = ${k} ÷ ${y}.`,``],skill:'geo'};})(),
  (()=>{const x=ri(2,6),y=ri(2,8);return{text:`y = k/x prochází bodem [${x}, ${y}].\nUrči k.`,ans:String(x*y),hints:[`k = x · y.`,``],skill:'geo'};})(),
  (()=>{return{text:`Pro jaké x není y = 20/x definována?\nx ≠`,ans:'0',hints:[`Jmenovatel nesmí být 0.`,``],skill:'geo'};})(),
  (()=>{const k=[12,24,36,48][ri(0,3)],x=[2,3,4,6][ri(0,3)];return{text:`y = ${k}/x\nPro x = ${x} je y = ?`,ans:String(k/x),hints:[`${k} ÷ ${x}.`,``],skill:'geo'};})(),
  (()=>{const x=[2,4,5,10][ri(0,3)],k=x*ri(3,9);return{text:`y = ${k}/x\nVypočítej f(${x}).`,ans:String(k/x),hints:[`${k} ÷ ${x}.`,``],skill:'geo'};})()
 ],

 // ───────── OBLAST 7 — JÁDRO SYSTÉMU ─────────
 '7-1': () => [
  (()=>{const a=ri(3,9),k=ri(2,4);return{svg:svgSimilar(k),text:`Podobné trojúhelníky, k = ${k}.\nStraně ${a} cm odpovídá? (cm)`,ans:String(a*k),hints:[`${a} · ${k}.`,``],skill:'geo'};})(),
  (()=>{const k=ri(2,4),orig=ri(4,9)*k;return{text:`Zmenšení k = 1/${k}.\nStrana ${orig} cm → ? (cm)`,ans:String(orig/k),hints:[`${orig} ÷ ${k}.`,``],skill:'geo'};})(),
  (()=>{const a=ri(2,6),k=ri(2,4);return{text:`Originál ${a} cm, obraz ${a*k} cm.\nKoeficient k?`,ans:String(k),hints:[`${a*k} ÷ ${a}.`,``],skill:'geo'};})(),
  (()=>{const onmap=ri(2,9),mer=500;return{text:`Mapa 1 : ${mer}. Úsek na mapě ${onmap} cm.\nKolik m ve skutečnosti?`,ans:String(onmap*mer/100),hints:[`${onmap} × ${mer} cm → m.`,``],skill:'geo'};})(),
  (()=>{const o=ri(3,8)*3,k=ri(2,4);return{text:`Podobné, k = ${k}. Obvod originálu ${o} cm.\nObvod obrazu? (cm)`,ans:String(o*k),hints:[`× ${k}.`,``],skill:'geo'};})(),
  (()=>{const onmap=ri(2,8),mer=2000;return{text:`Mapa 1 : ${mer}. Na mapě ${onmap} cm.\nKolik m ve skutečnosti?`,ans:String(onmap*mer/100),hints:[`${onmap} × ${mer} cm → m.`,``],skill:'geo'};})()
 ],
 '7-2': () => [
  (()=>{const r=ri(2,6),v=ri(5,12);return{svg:svgCylinder(r,v),text:`Válec: r = ${r} cm, v = ${v} cm.\nObjem? (cm³, π = 3,14)`,ans:String(Math.round(3.14*r*r*v)),hints:[`π·r²·v.`,``],skill:'geo'};})(),
  (()=>{const r=ri(2,6),v=ri(4,10);return{svg:svgCylinder(r,v),text:`Válec: r = ${r} cm, v = ${v} cm.\nPovrch? (cm², π = 3,14)`,ans:String(Math.round(2*3.14*r*(r+v))),hints:[`2πr(r+v).`,``],skill:'geo'};})(),
  (()=>{const r=ri(2,5);return{svg:svgSphere(r),text:`Koule r = ${r} cm.\nObjem? (cm³, π = 3,14)`,ans:String(Math.round(4/3*3.14*r*r*r)),hints:[`4/3·π·r³.`,``],skill:'geo'};})(),
  (()=>{const r=ri(2,6);return{svg:svgSphere(r),text:`Koule r = ${r} cm.\nPovrch? (cm², π = 3,14)`,ans:String(Math.round(4*3.14*r*r)),hints:[`4πr².`,``],skill:'geo'};})(),
  (()=>{const r=ri(2,6),v=ri(4,9);return{svg:svgCone(r,v),text:`Kužel: r = ${r} cm, v = ${v} cm.\nObjem? (cm³, π = 3,14)`,ans:String(Math.round(1/3*3.14*r*r*v)),hints:[`1/3·π·r²·v.`,``],skill:'geo'};})(),
  (()=>{const a=ri(3,8),b=ri(3,8),c=ri(3,8);return{svg:svgCuboid(a,b,c),text:`Kvádr ${a} × ${b} × ${c} cm.\nObjem? (cm³)`,ans:String(a*b*c),hints:[`a · b · c.`,``],skill:'geo'};})()
 ],
 '7-3': () => [
  (()=>{const a=ri(6,13);return{text:`Vypočítej:\n${a}² =`,ans:String(a*a),hints:[`${a} × ${a}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,8),x=ri(2,12),b=ri(2,15);return{text:`Vyřeš rovnici:\n${a}x + ${b} = ${a*x+b}`,ans:String(x),hints:[`Odečti ${b}, vyděl ${a}.`,``],skill:'anal'};})(),
  (()=>{const z=ri(2,8)*100,p=[10,20,25,50][ri(0,3)];return{text:`Vypočítej:\n${p} % z ${z} =`,ans:String(z*p/100),hints:[`1 % = ${z/100}.`,``],skill:'anal'};})(),
  (()=>{const t=[[3,4,5],[6,8,10],[5,12,13]][ri(0,2)];return{svg:svgTriangle('pravo',{v:['C','A','B']}),text:`Pravoúhlý trojúhelník, odvěsny ${t[0]} a ${t[1]} cm.\nPřepona? (cm)`,ans:String(t[2]),hints:[`c² = ${t[0]*t[0]} + ${t[1]*t[1]}.`,``],skill:'geo'};})(),
  (()=>{const r=ri(2,5),v=ri(5,10);return{svg:svgCylinder(r,v),text:`Válec r = ${r} cm, v = ${v} cm.\nObjem? (cm³, π = 3,14)`,ans:String(Math.round(3.14*r*r*v)),hints:[`3,14 · ${r*r} · ${v}.`,``],skill:'geo'};})(),
  (()=>{const x=ri(2,10),y=ri(2,10);return{text:`Vyřeš soustavu, urči x:\nx + y = ${x+y}\nx − y = ${x-y}`,ans:String(x),hints:[`2x = ${2*x}.`,``],skill:'anal'};})()
 ]

};
