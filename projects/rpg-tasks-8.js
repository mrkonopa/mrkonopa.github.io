/* ════════════════════════════════════════════════════════════════════
   RPG Matematika 8 (Matematická akademie) — ROZŠIŘUJÍCÍ BANKA ÚLOH
   ────────────────────────────────────────────────────────────────────
   Ke každé misi přidává další parametrické generátory. Engine sloučí
   základní pool z hry s touto bankou a náhodně vylosuje `tc` úloh →
   každé hraní i opakování dá jiné příklady (řádově stovky variant/krok).

   Generátory běží proti GLOBÁLNÍM helperům definovaným ve hře
   (ri, gcd) + lokálnímu cz (desetinná čárka).

   PRAVIDLA:
   • Úloha = {text, ans:String, hints:[…], skill:'calc'|'geo'|'anal'}
   • Mise s výběrem ze 4 (mc) smí mít JEN numerické nebo ANO/NE odpovědi:
     mc mise = '1-1','2-1','3-1','4-1','5-1','6-1','7-3'.
   • Bez modulu hra běží dál na základním poolu (graceful).
   ════════════════════════════════════════════════════════════════════ */
(function(){
const cz = n => String(n).replace('.',',');
const r2 = n => cz(Math.round(n*100)/100);
const r1 = n => cz(Math.round(n*10)/10);
const PI = 3.14;
const PYT = [[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[7,24,25],[20,21,29],[9,40,41],[12,16,20]];

window.RPG_TASK_EXTRA_8 = {

 // ───────── OBLAST 1 — ÚDOLÍ OPAKOVÁNÍ ─────────
 '1-1': () => [   // Celá čísla (MC, jen numerické/ANO-NE)
  (()=>{const a=ri(8,40),b=ri(8,40);return{text:`Vypočítej:\n(-${a}) + (-${b}) =`,ans:String(-a-b),hints:[`Obě čísla záporná → sečti a dej minus.`,`-(${a}+${b})`],skill:'calc'};})(),
  (()=>{const a=ri(10,40),b=ri(10,40);return{text:`Vypočítej:\n(-${a}) - (-${b}) =`,ans:String(-a+b),hints:[`- (-${b}) = + ${b}.`,`-${a} + ${b}`],skill:'calc'};})(),
  (()=>{const a=ri(3,12),b=ri(3,9);return{text:`Vypočítej:\n(-${a}) × ${b} =`,ans:String(-a*b),hints:[`Mínus × plus = mínus.`,``],skill:'calc'};})(),
  (()=>{const b=ri(3,9),q=ri(3,9),a=b*q;return{text:`Vypočítej:\n(-${a}) ÷ (-${b}) =`,ans:String(q),hints:[`Mínus ÷ mínus = plus.`,`${a} ÷ ${b}`],skill:'calc'};})(),
  (()=>{const a=ri(5,20);return{text:`Vypočítej absolutní hodnotu:\n|-${a}| =`,ans:String(a),hints:[`Absolutní hodnota je vždy nezáporná.`,``],skill:'calc'};})(),
  (()=>{const a=ri(10,30),b=ri(31,60);return{text:`Vypočítej:\n${a} - ${b} =`,ans:String(a-b),hints:[`Menší minus větší → výsledek záporný.`,`-(${b}-${a})`],skill:'calc'};})()
 ],
 '1-2': () => [   // Zlomky a desetinná čísla
  (()=>{const b=ri(2,7),d=ri(2,7);const num=b+d,den=b*d,g=gcd(num,den);const ans=den/g===1?String(num/g):`${num/g}/${den/g}`;return{text:`Vypočítej (zjednodušený zlomek):\n1/${b} + 1/${d} =`,ans,hints:[`Společný jmenovatel = ${den}.`,`(${d}+${b})/${den}, pak zkrať.`],skill:'calc'};})(),
  (()=>{const den=ri(4,12),a=ri(2,den-1),c=ri(1,a-0)||1;const num=a-c,g=gcd(Math.abs(num)||1,den);const ans=num===0?'0':(den/g===1?String(num/g):`${num/g}/${den/g}`);return{text:`Vypočítej (zjednodušený zlomek):\n${a}/${den} - ${c}/${den} =`,ans,hints:[`Stejný jmenovatel → odečti čitatele.`,`(${a}-${c})/${den}`],skill:'calc'};})(),
  (()=>{const a=ri(2,6),b=ri(3,7),c=ri(2,6),d=ri(3,7);const num=a*c,den=b*d,g=gcd(num,den);const ans=den/g===1?String(num/g):`${num/g}/${den/g}`;return{text:`Vypočítej (zjednodušený zlomek):\n${a}/${b} × ${c}/${d} =`,ans,hints:[`Čitatel×čitatel, jmenovatel×jmenovatel.`,`${num}/${den}, pak zkrať.`],skill:'calc'};})(),
  (()=>{const a=ri(1,9);return{text:`Převeď na desetinné číslo:\n${a}/10 =`,ans:r1(a/10),hints:[`Dělení 10 = čárka o místo doleva.`,``],skill:'calc'};})(),
  (()=>{const a=ri(1,9);return{text:`Převeď na desetinné číslo:\n${a}/4 =`,ans:r2(a/4),hints:[`1/4 = 0,25.`,`${a} × 0,25`],skill:'calc'};})(),
  (()=>{const a=ri(2,8),k=ri(1,9);return{text:`Vypočítej:\n${a} + 0,${k} =`,ans:r1(a+k/10),hints:[`Zarovnej desetinné čárky.`,``],skill:'calc'};})()
 ],
 '1-3': () => [   // Procenta
  (()=>{const z=ri(2,12)*10,p=ri(2,9)*5;return{text:`Kolik je ${p} % z ${z}?`,ans:String(Math.round(z*p/100)),hints:[`${p} % = ${p}/100.`,`${z} × ${p} ÷ 100`],skill:'anal'};})(),
  (()=>{const c=ri(4,20)*10,v=ri(1,c/10)*10;return{text:`Kolika procenty je ${v} z ${c}?\n(celé číslo)`,ans:String(Math.round(v/c*100)),hints:[`Část ÷ celek × 100.`,`${v} ÷ ${c} × 100`],skill:'anal'};})(),
  (()=>{const z=ri(10,40)*10,p=ri(1,4)*10;const ans=z-Math.round(z*p/100);return{text:`Zboží stojí ${z} Kč, sleva ${p} %.\nNová cena? (Kč)`,ans:String(ans),hints:[`Sleva = ${p} % z ${z}.`,`${z} - ${Math.round(z*p/100)}`],skill:'anal'};})(),
  (()=>{const z=ri(10,30)*10,p=ri(1,5)*5;const ans=z+Math.round(z*p/100);return{text:`Cena ${z} Kč vzrostla o ${p} %.\nNová cena? (Kč)`,ans:String(ans),hints:[`Přírůstek = ${p} % z ${z}.`,``],skill:'anal'};})(),
  (()=>{const z=ri(8,30)*100,p=ri(1,4)*2;return{text:`Vklad ${z} Kč, úrok ${p} % ročně.\nÚrok za rok? (Kč)`,ans:String(Math.round(z*p/100)),hints:[`Úrok = ${p} % z vkladu.`,``],skill:'anal'};})(),
  (()=>{const p=[10,20,25,50][ri(0,3)],cel=ri(3,9)*20,cast=Math.round(cel*p/100);return{text:`${cast} je ${p} % celku.\nJaký je celek?`,ans:String(cel),hints:[`Celek = část ÷ ${p} × 100.`,``],skill:'anal'};})()
 ],

 // ───────── OBLAST 2 — PYTHAGORAS ─────────
 '2-1': () => [   // Mocniny a odmocniny (MC)
  (()=>{const a=ri(11,25);return{text:`Vypočítej:\n${a}² =`,ans:String(a*a),hints:[`${a} × ${a}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,9);return{text:`Vypočítej:\n${a}³ =`,ans:String(a**3),hints:[`${a} × ${a} × ${a}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(4,15);return{text:`Vypočítej:\n√${a*a} =`,ans:String(a),hints:[`Hledej číslo, které na druhou dá ${a*a}.`,``],skill:'calc'};})(),
  (()=>{const n=ri(3,8);return{text:`Vypočítej:\n2^${n} =`,ans:String(2**n),hints:[`Násob dvojku ${n}×.`,``],skill:'calc'};})(),
  (()=>{const a=ri(3,8),b=ri(2,5);return{text:`Vypočítej:\n${a}² + ${b}² =`,ans:String(a*a+b*b),hints:[`${a*a} + ${b*b}.`,``],skill:'calc'};})(),
  (()=>{const a=ri(10,20);return{text:`Vypočítej:\n√${a*a} + ${a} =`,ans:String(2*a),hints:[`√${a*a} = ${a}.`,``],skill:'calc'};})()
 ],
 '2-2': () => [   // Pythagoras — přepona
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Pravoúhlý trojúhelník: a = ${t[0]}, b = ${t[1]}.\nPřepona c? (celé číslo)`,ans:String(t[2]),hints:[`c² = a² + b².`,`${t[0]}² + ${t[1]}² = ${t[2]*t[2]}, odmocni.`],skill:'geo'};})(),
  (()=>{const a=ri(3,9),b=ri(3,12);const c=Math.sqrt(a*a+b*b);return{text:`Pravoúhlý trojúhelník: a = ${a}, b = ${b}.\nPřepona c? (2 des. místa)`,ans:r2(c),hints:[`c² = ${a*a} + ${b*b} = ${a*a+b*b}.`,`Odmocni ${a*a+b*b}.`],skill:'geo'};})(),
  (()=>{const a=ri(4,10),b=ri(3,8);const c=Math.sqrt(a*a+b*b);return{text:`Žebřík: pata ${b} m od zdi, dosáhne do výšky ${a} m.\nDélka žebříku? (2 des. místa)`,ans:r2(c),hints:[`Žebřík = přepona.`,`√(${a}² + ${b}²)`],skill:'geo'};})(),
  (()=>{const a=ri(6,12),b=ri(4,10);const c=Math.sqrt(a*a+b*b);return{text:`Obdélník ${a} × ${b} cm.\nÚhlopříčka? (2 des. místa)`,ans:r2(c),hints:[`Úhlopříčka = přepona trojúhelníku.`,`√(${a}² + ${b}²)`],skill:'geo'};})(),
  (()=>{const a=ri(40,90),b=ri(30,70);const c=Math.sqrt(a*a+b*b);return{text:`Monitor ${a} × ${b} cm.\nÚhlopříčka? (1 des. místo, cm)`,ans:r1(c),hints:[`√(šířka² + výška²).`,``],skill:'geo'};})(),
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Odvěsny ${t[0]} a ${t[1]}.\nJak dlouhá je přepona?`,ans:String(t[2]),hints:[`Pythagorejská trojice.`,`${t[0]},${t[1]},${t[2]}`],skill:'geo'};})()
 ],
 '2-3': () => [   // Pythagoras — odvěsna
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Přepona c = ${t[2]}, odvěsna a = ${t[0]}.\nDruhá odvěsna b? (celé číslo)`,ans:String(t[1]),hints:[`b² = c² - a².`,`${t[2]*t[2]} - ${t[0]*t[0]} = ${t[1]*t[1]}`],skill:'geo'};})(),
  (()=>{const c=ri(10,20),a=ri(4,c-3);const b=Math.sqrt(c*c-a*a);return{text:`Přepona c = ${c}, odvěsna a = ${a}.\nDruhá odvěsna b? (2 des. místa)`,ans:r2(b),hints:[`b² = c² - a² = ${c*c-a*a}.`,`Odmocni ${c*c-a*a}.`],skill:'geo'};})(),
  (()=>{const c=ri(8,13),a=ri(3,c-2);const b=Math.sqrt(c*c-a*a);return{text:`Žebřík ${c} m opřený o zeď, pata ${a} m od zdi.\nDo jaké výšky dosáhne? (2 des. místa)`,ans:r2(b),hints:[`Výška² = žebřík² - odstup².`,`√(${c}² - ${a}²)`],skill:'geo'};})(),
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Přepona ${t[2]}, jedna odvěsna ${t[1]}.\nDruhá odvěsna?`,ans:String(t[0]),hints:[`Pythagorejská trojice.`,``],skill:'geo'};})(),
  (()=>{const c=ri(13,25),a=ri(5,c-4);const b=Math.sqrt(c*c-a*a);return{text:`Stožár jištěný lanem ${c} m, ukotveno ${a} m od paty.\nVýška úchytu? (2 des. místa)`,ans:r2(b),hints:[`√(lano² - odstup²).`,``],skill:'geo'};})(),
  (()=>{const c=ri(10,18),a=ri(6,c-2);const b=Math.sqrt(c*c-a*a);return{text:`Rampa: délka ${c} m, vodorovný průmět ${a} m.\nVýška rampy? (2 des. místa)`,ans:r2(b),hints:[`√(délka² - průmět²).`,``],skill:'geo'};})()
 ],

 // ───────── OBLAST 3 — ROVNICE ─────────
 '3-1': () => [   // Jednoduché rovnice (MC)
  (()=>{const x=ri(2,20),a=ri(2,15);return{text:`Vyřeš:\nx + ${a} = ${x+a}\nx = ?`,ans:String(x),hints:[`Odečti ${a}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(5,25),a=ri(2,15);return{text:`Vyřeš:\nx - ${a} = ${x-a}\nx = ?`,ans:String(x),hints:[`Přičti ${a}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,12),a=ri(2,9);return{text:`Vyřeš:\n${a}·x = ${a*x}\nx = ?`,ans:String(x),hints:[`Vyděl ${a}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,12),a=ri(2,8);return{text:`Vyřeš:\nx / ${a} = ${x}\nx = ?`,ans:String(x*a),hints:[`Vynásob ${a}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,15),a=ri(16,30);return{text:`Vyřeš:\n${a} - x = ${a-x}\nx = ?`,ans:String(x),hints:[`x = ${a} - ${a-x}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(2,10),a=ri(2,6),b=ri(1,9);return{text:`Vyřeš:\n${a}·x + ${b} = ${a*x+b}\nx = ?`,ans:String(x),hints:[`Odečti ${b}, pak vyděl ${a}.`,``],skill:'anal'};})()
 ],
 '3-2': () => [   // Dvojkrokové rovnice
  (()=>{const x=ri(2,12),a=ri(2,8),b=ri(2,15);return{text:`Vyřeš:\n${a}·x + ${b} = ${a*x+b}\nx = ?`,ans:String(x),hints:[`Odečti ${b}: ${a}x = ${a*x}.`,`Vyděl ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(3,12),a=ri(2,8),b=ri(2,15);return{text:`Vyřeš:\n${a}·x - ${b} = ${a*x-b}\nx = ?`,ans:String(x),hints:[`Přičti ${b}: ${a}x = ${a*x}.`,`Vyděl ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,9),a=ri(2,5),b=ri(2,9);return{text:`Vyřeš:\n${a}·(x + ${b}) = ${a*(x+b)}\nx = ?`,ans:String(x),hints:[`Vyděl ${a}: x + ${b} = ${x+b}.`,`Odečti ${b}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,10),a=ri(2,6),c=ri(1,5);const L=a+c;return{text:`Vyřeš:\n${a}·x + ${c}·x = ${L*x}\nx = ?`,ans:String(x),hints:[`Sečti x: ${L}x = ${L*x}.`,`Vyděl ${L}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,9),a=ri(4,7),c=ri(2,a-1),b=ri(1,9);const d=(a-c)*x+b;return{text:`Vyřeš:\n${a}·x + ${b} = ${c}·x + ${d}\nx = ?`,ans:String(x),hints:[`Dej x vlevo, čísla vpravo: ${a-c}x = ${d-b}.`,`Vyděl ${a-c}.`],skill:'anal'};})(),
  (()=>{const x=ri(4,16),b=ri(2,8);return{text:`Vyřeš:\nx/2 + ${b} = ${x/2+b}\nx = ?`,ans:String(x),hints:[`Odečti ${b}: x/2 = ${x/2}.`,`Vynásob 2.`],skill:'anal'};})()
 ],
 '3-3': () => [   // Slovní úlohy
  (()=>{const x=ri(3,15),a=ri(2,5),b=ri(2,12);return{text:`Myslím si číslo. Když ho vynásobím ${a} a přičtu ${b},\ndostanu ${a*x+b}. Jaké je číslo?`,ans:String(x),hints:[`Rovnice: ${a}x + ${b} = ${a*x+b}.`,``],skill:'anal'};})(),
  (()=>{const syn=ri(8,14),roz=ri(20,30);return{text:`Otci je o ${roz} let více než synovi (${syn} let).\nKolik let je otci?`,ans:String(syn+roz),hints:[`${syn} + ${roz}.`,``],skill:'anal'};})(),
  (()=>{const cena=ri(3,9)*10,ks=ri(3,8);return{text:`${ks} stejných sešitů stálo ${cena*ks} Kč.\nKolik stál jeden? (Kč)`,ans:String(cena),hints:[`Celek ÷ počet.`,`${cena*ks} ÷ ${ks}`],skill:'anal'};})(),
  (()=>{const cel=ri(4,9)*10,prvni=ri(10,cel-10);return{text:`Lano ${cel} m rozdělíme na dva kusy.\nJeden má ${prvni} m. Druhý? (m)`,ans:String(cel-prvni),hints:[`${cel} - ${prvni}.`,``],skill:'anal'};})(),
  (()=>{const x=ri(5,20);return{text:`Číslo zvětšené o svou polovinu je ${x*1.5}.\nJaké je číslo?`,ans:String(x),hints:[`x + x/2 = 1,5x.`,`1,5x = ${x*1.5}`],skill:'anal'};})(),
  (()=>{const aut=ri(8,15),kol=aut+ri(3,9);return{text:`Na parkovišti je ${aut} aut a ${kol} kol.\nO kolik víc je kol než aut?`,ans:String(kol-aut),hints:[`${kol} - ${aut}.`,``],skill:'anal'};})()
 ],

 // ───────── OBLAST 4 — VÝRAZY ─────────
 '4-1': () => [   // Dosazování (MC)
  (()=>{const x=ri(2,9),a=ri(2,6),b=ri(1,9);return{text:`Dosaď x = ${x}:\n${a}x + ${b} =`,ans:String(a*x+b),hints:[`${a}·${x} + ${b}.`,``],skill:'calc'};})(),
  (()=>{const x=ri(2,8);return{text:`Dosaď x = ${x}:\nx² - x =`,ans:String(x*x-x),hints:[`${x*x} - ${x}.`,``],skill:'calc'};})(),
  (()=>{const x=ri(3,9),a=ri(2,5);return{text:`Dosaď x = ${x}:\n${a}(x - 2) =`,ans:String(a*(x-2)),hints:[`${a}·(${x}-2).`,``],skill:'calc'};})(),
  (()=>{const x=ri(2,6),y=ri(2,6),a=ri(2,4),b=ri(2,4);return{text:`Dosaď x = ${x}, y = ${y}:\n${a}x + ${b}y =`,ans:String(a*x+b*y),hints:[`${a}·${x} + ${b}·${y}.`,``],skill:'calc'};})(),
  (()=>{const x=ri(2,5),y=ri(2,5);return{text:`Dosaď x = ${x}, y = ${y}:\nx² + y² =`,ans:String(x*x+y*y),hints:[`${x*x} + ${y*y}.`,``],skill:'calc'};})(),
  (()=>{const x=ri(3,8),a=ri(2,5);return{text:`Dosaď x = ${x}:\nx² - ${a}x =`,ans:String(x*x-a*x),hints:[`${x*x} - ${a}·${x}.`,``],skill:'calc'};})()
 ],
 '4-2': () => [   // Závorky a vzorce
  (()=>{const a=ri(2,9),b=ri(2,9);return{text:`Vypočítej pomocí vzorce (a+b)²:\n(${a} + ${b})² =`,ans:String((a+b)**2),hints:[`a² + 2ab + b².`,`${a*a} + ${2*a*b} + ${b*b}`],skill:'calc'};})(),
  (()=>{const a=ri(5,12),b=ri(2,a-1);return{text:`Vypočítej pomocí vzorce (a-b)²:\n(${a} - ${b})² =`,ans:String((a-b)**2),hints:[`a² - 2ab + b².`,`${a*a} - ${2*a*b} + ${b*b}`],skill:'calc'};})(),
  (()=>{const a=ri(5,12),b=ri(2,a-1);return{text:`Vypočítej pomocí vzorce (a+b)(a-b):\n(${a} + ${b})(${a} - ${b}) =`,ans:String(a*a-b*b),hints:[`a² - b².`,`${a*a} - ${b*b}`],skill:'calc'};})(),
  (()=>{const a=ri(2,7),b=ri(2,7);return{text:`Vypočítej:\n(${a} + ${b})² - (${a} - ${b})² =`,ans:String((a+b)**2-(a-b)**2),hints:[`Rozdíl čtverců = 4ab.`,`4·${a}·${b}`],skill:'calc'};})(),
  (()=>{const a=ri(11,20);return{text:`Pomocí (a+b)² spočítej:\n${a}² =`,ans:String(a*a),hints:[`Rozlož: (${10}+${a-10})².`,`100 + ${20*(a-10)} + ${(a-10)**2}`],skill:'calc'};})(),
  (()=>{const a=ri(2,8),b=ri(2,8);return{text:`Vynásob závorky:\n(x + ${a})(x + ${b}) má absolutní člen =`,ans:String(a*b),hints:[`Absolutní člen = ${a}·${b}.`,``],skill:'calc'};})()
 ],
 '4-3': () => [   // Vytýkání (NSD)
  (()=>{const g=ri(2,8),a=g*ri(2,5),b=g*ri(2,5);const gg=gcd(a,b);return{text:`Vytkni největší společné číslo z:\n${a}x + ${b}\nJaké číslo vytkneš?`,ans:String(gg),hints:[`Hledej NSD čísel ${a} a ${b}.`,`NSD = ${gg}`],skill:'calc'};})(),
  (()=>{const a=ri(2,9)*ri(2,4),b=ri(2,9)*ri(2,4);const gg=gcd(a,b);return{text:`Najdi největší společný dělitel:\nNSD(${a}, ${b}) =`,ans:String(gg),hints:[`Rozlož na prvočísla.`,``],skill:'calc'};})(),
  (()=>{const k=ri(2,6),a=ri(2,5),b=ri(2,5);return{text:`Vytkni ${k}:\n${k*a}x + ${k*b} = ${k}(__ x + ${b})\nDoplň první číslo:`,ans:String(a),hints:[`${k*a} ÷ ${k}.`,``],skill:'calc'};})(),
  (()=>{const k=ri(2,7),a=ri(3,8);return{text:`Vytkni společné x:\n${a}x² + ${k}x = x(__ x + ${k})\nDoplň první číslo:`,ans:String(a),hints:[`${a}x² ÷ x = ${a}x.`,``],skill:'calc'};})(),
  (()=>{const g=ri(3,9),a=g*ri(2,6),b=g*ri(2,6),c=g*ri(2,6);return{text:`Společné číslo k vytknutí z:\n${a}x + ${b}y + ${c}\nNSD koeficientů =`,ans:String(gcd(gcd(a,b),c)),hints:[`NSD všech tří čísel.`,``],skill:'calc'};})(),
  (()=>{const a=ri(2,6);return{text:`Vytkni z výrazu ${a}a + ${a}b společné číslo.\nJaké číslo vytkneš?`,ans:String(a),hints:[`Obě části mají činitel ${a}.`,``],skill:'calc'};})()
 ],

 // ───────── OBLAST 5 — KRUH A VÁLEC ─────────
 '5-1': () => [   // Obvod a obsah kruhu (MC, π=3,14)
  (()=>{const r=ri(2,10);return{text:`Kruh o poloměru r = ${r}.\nObvod? (π = 3,14)`,ans:r2(2*PI*r),hints:[`o = 2πr.`,`2 × 3,14 × ${r}`],skill:'geo'};})(),
  (()=>{const r=ri(2,9);return{text:`Kruh o poloměru r = ${r}.\nObsah? (π = 3,14)`,ans:r2(PI*r*r),hints:[`S = πr².`,`3,14 × ${r}²`],skill:'geo'};})(),
  (()=>{const d=ri(4,16);return{text:`Kruh o průměru d = ${d}.\nObvod? (π = 3,14)`,ans:r2(PI*d),hints:[`o = πd.`,`3,14 × ${d}`],skill:'geo'};})(),
  (()=>{const d=ri(4,12);const r=d/2;return{text:`Kruh o průměru d = ${d}.\nObsah? (π = 3,14)`,ans:r2(PI*r*r),hints:[`r = ${r}, S = πr².`,`3,14 × ${r}²`],skill:'geo'};})(),
  (()=>{const r=ri(3,8);return{text:`Polovina kruhu o poloměru ${r}.\nObsah půlkruhu? (π = 3,14)`,ans:r2(PI*r*r/2),hints:[`Půlka z πr².`,``],skill:'geo'};})(),
  (()=>{const r=ri(2,7);return{text:`Kruh o poloměru ${r}.\nObvod ÷ 2 = (π = 3,14)`,ans:r2(PI*r),hints:[`2πr ÷ 2 = πr.`,``],skill:'geo'};})()
 ],
 '5-2': () => [   // Válec
  (()=>{const r=ri(2,7),h=ri(3,12);return{text:`Válec: poloměr ${r}, výška ${h}.\nObjem? (π = 3,14)`,ans:r2(PI*r*r*h),hints:[`V = πr²h.`,`3,14 × ${r}² × ${h}`],skill:'geo'};})(),
  (()=>{const r=ri(2,6),h=ri(3,10);return{text:`Válec: poloměr ${r}, výška ${h}.\nObsah pláště? (π = 3,14)`,ans:r2(2*PI*r*h),hints:[`Plášť = 2πr·h.`,`2 × 3,14 × ${r} × ${h}`],skill:'geo'};})(),
  (()=>{const r=ri(2,6),h=ri(3,10);return{text:`Válec: poloměr ${r}, výška ${h}.\nCelý povrch? (π = 3,14)`,ans:r2(2*PI*r*(r+h)),hints:[`S = 2πr(r+h).`,`2 × 3,14 × ${r} × ${r+h}`],skill:'geo'};})(),
  (()=>{const r=ri(2,8);return{text:`Válec: poloměr ${r}, výška ${r}.\nObjem? (π = 3,14)`,ans:r2(PI*r*r*r),hints:[`V = πr²·r = πr³.`,``],skill:'geo'};})(),
  (()=>{const d=ri(4,12),h=ri(5,15);const r=d/2;return{text:`Válec: průměr ${d}, výška ${h}.\nObjem? (π = 3,14)`,ans:r2(PI*r*r*h),hints:[`r = ${r}, V = πr²h.`,``],skill:'geo'};})(),
  (()=>{const r=ri(2,6),h=ri(4,10);return{text:`Obsah jedné podstavy válce (r = ${r}).\nS = (π = 3,14)`,ans:r2(PI*r*r),hints:[`Podstava = kruh, πr².`,``],skill:'geo'};})()
 ],
 '5-3': () => [   // Kružnice — slovní úlohy
  (()=>{const r=ri(20,40);const o=2*PI*r;return{text:`Kolo o poloměru ${r} cm se otočí jednou.\nUjetá dráha? (cm, π = 3,14)`,ans:r2(o),hints:[`Dráha = obvod = 2πr.`,``],skill:'geo'};})(),
  (()=>{const r=ri(3,8);return{text:`Kruhový bazén o poloměru ${r} m.\nPlocha hladiny? (m², π = 3,14)`,ans:r2(PI*r*r),hints:[`S = πr².`,``],skill:'geo'};})(),
  (()=>{const d=ri(6,14);return{text:`Kruhový záhon o průměru ${d} m chceme oplotit.\nDélka plotu? (m, π = 3,14)`,ans:r2(PI*d),hints:[`Plot = obvod = πd.`,``],skill:'geo'};})(),
  (()=>{const r=ri(10,25),n=ri(2,5);const o=2*PI*r*n;return{text:`Kolo o poloměru ${r} cm se otočí ${n}×.\nUjetá dráha? (cm, π = 3,14)`,ans:r2(o),hints:[`${n} × obvod.`,``],skill:'geo'};})(),
  (()=>{const r=ri(2,6),h=ri(8,20);return{text:`Plechovka (válec): poloměr ${r} cm, výška ${h} cm.\nKolik cm³ se vejde? (π = 3,14)`,ans:r2(PI*r*r*h),hints:[`Objem = πr²h.`,``],skill:'geo'};})(),
  (()=>{const r=ri(4,10);return{text:`Kruhový ubrus o poloměru ${r} dm chceme olemovat.\nDélka lemu? (dm, π = 3,14)`,ans:r2(2*PI*r),hints:[`Lem = obvod = 2πr.`,``],skill:'geo'};})()
 ],

 // ───────── OBLAST 6 — KONSTRUKCE ─────────
 '6-1': () => [   // Množiny bodů (MC, ANO/NE + numerické)
  (()=>{return{text:`Množina bodů stejně vzdálených od dvou bodů\nje osa úsečky. Platí to?\n(ANO/NE)`,ans:'ANO',hints:[`Osa úsečky = množina bodů ve stejné vzdálenosti.`,``],skill:'geo'};})(),
  (()=>{const r=ri(3,9);return{text:`Bod je vzdálen ${r} cm od středu.\nLeží na kružnici s poloměrem ${r} cm?\n(ANO/NE)`,ans:'ANO',hints:[`Kružnice = body v dané vzdálenosti od středu.`,``],skill:'geo'};})(),
  (()=>{const r=ri(3,8),d=r+ri(1,4);return{text:`Kružnice má poloměr ${r}. Bod je ${d} cm od středu.\nLeží na kružnici?\n(ANO/NE)`,ans:'NE',hints:[`${d} ≠ ${r}, tedy mimo kružnici.`,``],skill:'geo'};})(),
  (()=>{return{text:`Množina bodů dané vzdálenosti od přímky\njsou dvě rovnoběžky. Kolik rovnoběžek?`,ans:'2',hints:[`Na každé straně přímky jedna.`,``],skill:'geo'};})(),
  (()=>{return{text:`Osa úhlu rozděluje úhel na kolik stejných částí?`,ans:'2',hints:[`Osa = symetrála úhlu.`,``],skill:'geo'};})(),
  (()=>{const r=ri(2,6);return{text:`Kružnice o poloměru ${r}.\nJaký je její průměr?`,ans:String(2*r),hints:[`d = 2r.`,``],skill:'geo'};})()
 ],
 '6-2': () => [   // Thaletova kružnice
  (()=>{return{text:`Úhel nad průměrem (Thaletova kružnice)\nmá vždy kolik stupňů?`,ans:'90',hints:[`Thaletova věta → pravý úhel.`,``],skill:'geo'};})(),
  (()=>{const c=ri(6,16);return{text:`Přepona pravoúhlého trojúhelníku = ${c}.\nPoloměr Thaletovy kružnice?`,ans:r1(c/2),hints:[`Poloměr = polovina přepony.`,`${c} ÷ 2`],skill:'geo'};})(),
  (()=>{return{text:`Vrchol pravého úhlu trojúhelníku leží\nna Thaletově kružnici. Platí?\n(ANO/NE)`,ans:'ANO',hints:[`To je podstata Thaletovy věty.`,``],skill:'geo'};})(),
  (()=>{const r=ri(3,9);return{text:`Thaletova kružnice má poloměr ${r}.\nDélka přepony (= průměr)?`,ans:String(2*r),hints:[`Přepona = průměr = 2r.`,``],skill:'geo'};})(),
  (()=>{return{text:`Je úhel nad průměrem tupý?\n(ANO/NE)`,ans:'NE',hints:[`Je přesně pravý (90°), ne tupý.`,``],skill:'geo'};})(),
  (()=>{const c=ri(10,20);return{text:`Průměr Thaletovy kružnice je ${c}.\nKolik měří poloměr?`,ans:r1(c/2),hints:[`r = d/2.`,``],skill:'geo'};})()
 ],
 '6-3': () => [   // Osy a souměrnosti
  (()=>{return{text:`Kolik os souměrnosti má čtverec?`,ans:'4',hints:[`2 úhlopříčky + 2 střední.`,``],skill:'geo'};})(),
  (()=>{return{text:`Kolik os souměrnosti má obdélník\n(který není čtverec)?`,ans:'2',hints:[`Dvě střední osy.`,``],skill:'geo'};})(),
  (()=>{return{text:`Kolik os souměrnosti má rovnostranný\ntrojúhelník?`,ans:'3',hints:[`Z každého vrcholu jedna.`,``],skill:'geo'};})(),
  (()=>{return{text:`Má rovnoběžník (kosodélník) osu\nsouměrnosti?\n(ANO/NE)`,ans:'NE',hints:[`Má jen středovou souměrnost.`,``],skill:'geo'};})(),
  (()=>{return{text:`Kolik os souměrnosti má pravidelný\npětiúhelník?`,ans:'5',hints:[`Pravidelný n-úhelník má n os.`,``],skill:'geo'};})(),
  (()=>{return{text:`Je střed úsečky jejím středem\nsouměrnosti?\n(ANO/NE)`,ans:'ANO',hints:[`Úsečka je středově souměrná podle svého středu.`,``],skill:'geo'};})()
 ],

 // ───────── OBLAST 7 — FINÁLE ─────────
 '7-1': () => [   // Zkouška ohněm (mix)
  (()=>{const z=ri(2,8)*100,p=ri(1,4)*5;return{text:`${p} % z ${z} =`,ans:String(Math.round(z*p/100)),hints:[`${z} × ${p} ÷ 100.`,``],skill:'anal'};})(),
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Odvěsny ${t[0]} a ${t[1]}, přepona?`,ans:String(t[2]),hints:[`Pythagoras.`,``],skill:'geo'};})(),
  (()=>{const x=ri(3,12),a=ri(2,6),b=ri(2,12);return{text:`${a}x + ${b} = ${a*x+b}, x = ?`,ans:String(x),hints:[`Odečti ${b}, vyděl ${a}.`,``],skill:'anal'};})(),
  (()=>{const r=ri(2,7);return{text:`Obsah kruhu o poloměru ${r}? (π = 3,14)`,ans:r2(PI*r*r),hints:[`πr².`,``],skill:'geo'};})(),
  (()=>{const a=ri(3,9),b=ri(2,a-1);return{text:`(${a} + ${b})(${a} - ${b}) =`,ans:String(a*a-b*b),hints:[`a² - b².`,``],skill:'calc'};})(),
  (()=>{const a=ri(11,20);return{text:`${a}² =`,ans:String(a*a),hints:[`${a} × ${a}.`,``],skill:'calc'};})()
 ],
 '7-2': () => [   // Přijímačkový trénink (CERMAT-style)
  (()=>{const cena=ri(3,9)*100,p=ri(2,4)*10;const sl=Math.round(cena*p/100);return{text:`Kolo stálo ${cena} Kč, zlevnili o ${p} %.\nO kolik Kč se snížila cena?`,ans:String(sl),hints:[`${p} % z ${cena}.`,``],skill:'anal'};})(),
  (()=>{const r=ri(10,30);const o=2*PI*r;return{text:`Kolo o poloměru ${r} cm.\nKolik cm ujede za 1 otáčku? (π = 3,14)`,ans:r2(o),hints:[`Obvod = 2πr.`,``],skill:'geo'};})(),
  (()=>{const a=ri(30,60),b=ri(20,50);const c=Math.sqrt(a*a+b*b);return{text:`Obdélníkové hřiště ${a} × ${b} m.\nDélka úhlopříčky? (2 des. místa)`,ans:r2(c),hints:[`√(${a}² + ${b}²).`,``],skill:'geo'};})(),
  (()=>{const lidi=ri(4,9)*5,p=ri(2,8)*5;return{text:`Ve třídě je ${lidi} žáků, ${p} % jsou dívky.\nKolik je dívek?`,ans:String(Math.round(lidi*p/100)),hints:[`${p} % z ${lidi}.`,``],skill:'anal'};})(),
  (()=>{const km=ri(60,120),h=ri(2,4);return{text:`Auto ujelo ${km*h} km za ${h} h.\nPrůměrná rychlost? (km/h)`,ans:String(km),hints:[`Dráha ÷ čas.`,`${km*h} ÷ ${h}`],skill:'anal'};})(),
  (()=>{const cel=ri(4,9)*3,t=cel/3;return{text:`Třetina žáků (${t}) odešla.\nKolik žáků bylo původně, je-li to třetina?`,ans:String(cel),hints:[`Třetina = ${t}, celek = 3×.`,``],skill:'anal'};})()
 ],
 '7-3': () => [   // Finální duel (MC, jen numerické)
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Přepona ${t[2]}, odvěsna ${t[0]}.\nDruhá odvěsna?`,ans:String(t[1]),hints:[`b² = c² - a².`,``],skill:'geo'};})(),
  (()=>{const r=ri(2,8);return{text:`Objem válce r = ${r}, výška ${r}? (π = 3,14)`,ans:r2(PI*r*r*r),hints:[`πr²·r.`,``],skill:'geo'};})(),
  (()=>{const x=ri(3,10),a=ri(2,5),b=ri(2,5);return{text:`${a}(x + ${b}) = ${a*(x+b)}, x = ?`,ans:String(x),hints:[`Vyděl ${a}, odečti ${b}.`,``],skill:'anal'};})(),
  (()=>{const a=ri(6,12),b=ri(2,a-1);return{text:`(${a} - ${b})² =`,ans:String((a-b)**2),hints:[`a² - 2ab + b².`,``],skill:'calc'};})(),
  (()=>{const z=ri(3,9)*100,p=ri(2,5)*10;return{text:`Cena ${z} Kč vzrostla o ${p} %. Nová cena? (Kč)`,ans:String(z+Math.round(z*p/100)),hints:[`+ ${p} % z ${z}.`,``],skill:'anal'};})(),
  (()=>{const a=ri(13,20);return{text:`√${a*a} =`,ans:String(a),hints:[`Odmocnina z ${a*a}.`,``],skill:'calc'};})()
 ]
};
})();
