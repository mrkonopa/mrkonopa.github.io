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

// ── FRAMING / PHRASING POOLY (rozmanitost zadání beze změny odpovědi) ──
const rp = a => a[ri(0,a.length-1)];          // náhodný prvek pole
const FC = ['Vypočítej','Spočítej','Urči','Vyčísli'];        // početní dril „… =“
const FE = ['Vyřeš','Vypočítej','Urči neznámou'];            // rovnice „… x = ?“
const FR = ['Kolik je','Spočítej, kolik je','Urči hodnotu'];  // otázka „Kolik je …?“

window.RPG_TASK_EXTRA_8 = {

 // ───────── OBLAST 1 — ÚDOLÍ OPAKOVÁNÍ ─────────
 '1-1': () => [   // Celá čísla (MC, jen numerické/ANO-NE)
  (()=>{const a=ri(8,40),b=ri(8,40);return{text:`${rp(FC)}:\n(-${a}) + (-${b}) =`,ans:String(-a-b),distractors:[String(-a+b)],hints:[`Obě čísla záporná → sečti a dej minus.`,`-(${a}+${b})`],skill:'calc'};})(),
  (()=>{const a=ri(10,40),b=ri(10,40);return{text:`${rp(FC)}:\n(-${a}) - (-${b}) =`,ans:String(-a+b),distractors:[String(-a-b)],hints:[`- (-${b}) = + ${b}.`,`-${a} + ${b}`],skill:'calc'};})(),
  (()=>{const a=ri(3,12),b=ri(3,9);return{text:`${rp(FC)}:\n(-${a}) × ${b} =`,ans:String(-a*b),distractors:[String(a*b)],hints:[`Mínus × plus = mínus.`],skill:'calc'};})(),
  (()=>{const b=ri(3,9),q=ri(3,9),a=b*q;return{text:`${rp(FC)}:\n(-${a}) : (-${b}) =`,ans:String(q),distractors:[String(-q)],hints:[`Mínus : mínus = plus.`,`${a} : ${b}`],skill:'calc'};})(),
  (()=>{const a=ri(5,20);return{text:`Vypočítej absolutní hodnotu:\n|-${a}| =`,ans:String(a),distractors:[String(-a)],hints:[`Absolutní hodnota je vždy nezáporná.`],skill:'calc'};})(),
  (()=>{const a=ri(10,30),b=ri(31,60);return{text:`${rp(FC)}:\n${a} - ${b} =`,ans:String(a-b),distractors:[String(b-a)],hints:[`Menší minus větší → výsledek záporný.`,`-(${b}-${a})`],skill:'calc'};})(),
  (()=>{const a=ri(2,8);return{text:`${rp(FC)}:\n(-${a})² =`,ans:String(a*a),distractors:[String(-a*a)],hints:[`Záporné číslo na sudou mocninu → kladné: ${a}×${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,7),b=ri(2,6),c=ri(2,9);return{text:`${rp(FC)}:\n${a} × (-${b}) + ${c} =`,ans:String(-a*b+c),distractors:[String(a*b+c)],hints:[`Nejdřív součin, pak přičti ${c}.`,`-${a*b} + ${c}`],skill:'calc'};})(),
  (()=>{const a=ri(5,25),b=ri(30,60);return{text:`${rp(FC)}:\n(-${a}) + ${b} =`,ans:String(-a+b),distractors:[String(-(a+b))],hints:[`Kladné číslo je větší, odečti: ${b} − ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,9),b=ri(2,6);return{text:`${rp(FC)}:\n(-${a})³ =`,ans:String(-(a**3)),distractors:[String(a**3)],hints:[`Záporné číslo na liché mocninu → záporné: -(${a**3}).`],skill:'calc'};})()
 ],
 '1-2': () => [   // Zlomky a desetinná čísla
  (()=>{const b=ri(2,7),d=ri(2,7);const num=b+d,den=b*d,g=gcd(num,den);const ans=den/g===1?String(num/g):`${num/g}/${den/g}`;return{text:`${rp(FC)} (zjednodušený zlomek):\n1/${b} + 1/${d} =`,ans,hints:[`Vynásob jmenovatele: ${b}·${d} = ${den}.`,g===1?`Sečti čitatele: (${d}+${b})/${den}.`:`(${d}+${b})/${den}, pak zkrať.`],skill:'calc'};})(),
  (()=>{const den=ri(4,12),a=ri(2,den-1),c=ri(1,a-0)||1;const num=a-c,g=gcd(Math.abs(num)||1,den);const ans=num===0?'0':(den/g===1?String(num/g):`${num/g}/${den/g}`);return{text:`${rp(FC)} (zjednodušený zlomek):\n${a}/${den} - ${c}/${den} =`,ans,hints:[`Stejný jmenovatel → odečti čitatele.`,`(${a}-${c})/${den}`],skill:'calc'};})(),
  (()=>{const a=ri(2,6),b=ri(3,7),c=ri(2,6),d=ri(3,7);const num=a*c,den=b*d,g=gcd(num,den);const ans=den/g===1?String(num/g):`${num/g}/${den/g}`;return{text:`${rp(FC)} (zjednodušený zlomek):\n${a}/${b} × ${c}/${d} =`,ans,hints:[`Čitatel×čitatel, jmenovatel×jmenovatel.`,`${num}/${den}, pak zkrať.`],skill:'calc'};})(),
  (()=>{const den=ri(3,6)*2,a=ri(1,den-1);const g=gcd(a,den);const ans=den/g===1?String(a/g):`${a/g}/${den/g}`;return{text:`Kniha z akademické knihovny má ${den} kapitol.\nStudent přečetl ${a} ${skl(a,'kapitolu','kapitoly','kapitol')}. Jaký zlomek knihy přečetl? (zkrácený)`,ans,hints:[`Přečtené : všechny = ${a}/${den}.`,g===1?`${a}/${den} už nejde zkrátit.`:`Zkrať ${g}× → ${ans}.`],skill:'anal'};})(),
  (()=>{const a=ri(1,9);return{text:`Převeď na desetinné číslo:\n${a}/10 =`,ans:r1(a/10),hints:[`Dělení 10 = čárka o místo doleva.`],skill:'calc'};})(),
  (()=>{const a=ri(1,9);return{text:`Převeď na desetinné číslo:\n${a}/4 =`,ans:r2(a/4),hints:[`1/4 = 0,25.`,`${a} × 0,25`],skill:'calc'};})(),
  (()=>{const a=ri(2,8),k=ri(1,9);return{text:`Vypočítej:\n${a} + 0,${k} =`,ans:r1(a+k/10),hints:[`Zarovnej desetinné čárky.`],skill:'calc'};})(),
  (()=>{const a=ri(2,5),b=ri(2,5);const num=a+b,g=gcd(num,6);const ans=6/g===1?String(num/g):`${num/g}/${6/g}`;return{text:`Vypočítej:\n${a}/6 + ${b}/6 =`,ans,hints:[`Stejný jmenovatel.`,`${num}/6 → zkrať.`],skill:'calc'};})(),
  (()=>{const a=ri(2,5),b=ri(3,8);const c=a*b;return{text:`Smíšené číslo: ${a} ${Math.floor(1/2)+1}/${b} — převeď na zlomek.\n(${a}·${b}+1)/${b} = ?`,ans:`${a*b+1}/${b}`,hints:[`Celý díl × jmenovatel + čitatel.`,`${a*b+1}/${b}`],skill:'calc'};})(),
  (()=>{const a=ri(2,6),b=ri(2,4);const div=a*b;const g=gcd(a,div);const ans=div/g===1?String(a/g):`${a/g}/${div/g}`;return{text:`Vypočítej:\n${a} : ${b} =`,ans:String(a/b%1===0?a/b:`${a}/${b}`),hints:[`Dělení = násobení převráceným číslem.`,`${a} × 1/${b}`],skill:'calc'};})(),
  (()=>{const a=ri(1,4),b=ri(5,9);return{text:`Je ${a}/${b} větší než 1/2?\n(ANO/NE)`,ans:2*a>b?'ANO':'NE',hints:[`Porovnej 2·${a} s ${b}.`,`2·${a}=${2*a}, ${2*a>b?'>':'≤'} ${b}`],skill:'calc'};})()
 ],
 '1-3': () => [   // Procenta
  (()=>{const z=ri(1,6)*20,p=[10,20,25,50][ri(0,3)];return{text:`${rp(FR)} ${p} % z ${z}?`,ans:String(z*p/100),hints:[`${p} % = ${p}/100.`,`${z} × ${p} : 100`],skill:'anal'};})(),
  (()=>{const c=ri(4,20)*10,v=ri(1,c/10)*10;return{text:`Kolika procenty je ${v} z ${c}?\n(celé číslo)`,ans:String(Math.round(v/c*100)),hints:[`Část : celek × 100.`,`${v} : ${c} × 100`],skill:'anal'};})(),
  (()=>{const z=ri(10,40)*10,p=ri(1,4)*10;const ans=z-Math.round(z*p/100);return{text:`Zboží stojí ${z} Kč, sleva ${p} %.\nNová cena? (Kč)`,ans:String(ans),hints:[`Sleva = ${p} % z ${z}.`,`${z} - ${Math.round(z*p/100)}`],skill:'anal'};})(),
  (()=>{const z=ri(10,30)*10,p=ri(1,5)*5;const ans=z+Math.round(z*p/100);return{text:`Cena ${z} Kč vzrostla o ${p} %.\nNová cena? (Kč)`,ans:String(ans),hints:[`Přírůstek = ${p} % z ${z}.`],skill:'anal'};})(),
  (()=>{const z=ri(8,30)*100,p=ri(1,4)*2;return{text:`Vklad ${z} Kč, úrok ${p} % ročně.\nÚrok za rok? (Kč)`,ans:String(Math.round(z*p/100)),hints:[`Úrok = ${p} % z vkladu.`],skill:'anal'};})(),
  (()=>{const p=[10,20,25,50][ri(0,3)],cel=ri(3,9)*20,cast=Math.round(cel*p/100);return{text:`${cast} je ${p} % celku.\nJaký je celek?`,ans:String(cel),hints:[`Celek = část : ${p} × 100.`],skill:'anal'};})(),
  (()=>{const cena=ri(10,40)*10,dph=21;const s_dph=Math.round(cena*(1+dph/100));return{text:`Cena bez DPH: ${cena} Kč.\nCena s DPH ${dph} %? (Kč)`,ans:String(s_dph),hints:[`${dph} % z ${cena} = ${Math.round(cena*dph/100)}.`,`${cena} + ${Math.round(cena*dph/100)}`],skill:'anal'};})(),
  (()=>{const orig=ri(4,16)*50,nov=ri(1,4)*50;const pct=Math.round((nov/orig)*100);return{text:`Plat vzrostl z ${orig} Kč o ${nov} Kč.\nO kolik procent? (zaokrouhli na celá %)`,ans:String(pct),hints:[`${nov} : ${orig} × 100.`],skill:'anal'};})(),
  (()=>{const z=ri(2,6)*100,p=ri(5,9)*10;const cast=z*p/100;return{text:`${p} % ze čtvrtletního výdělku ${z} Kč jde na nájem.\nKolik Kč? (Kč)`,ans:String(cast),hints:[`${p} : 100 × ${z}.`],skill:'anal'};})(),
  (()=>{const nov=ri(5,15)*10,orig=nov+ri(1,5)*10;return{text:`Cena klesla z ${orig} Kč na ${nov} Kč.\nO kolik procent? (celé číslo)`,ans:String(Math.round((orig-nov)/orig*100)),hints:[`Pokles : původní × 100.`,`${orig-nov} : ${orig} × 100`],skill:'anal'};})(),
  (()=>{const st=ri(4,6)*5,p=[20,40,60,80][ri(0,3)];const c=st*p/100;return{text:`V učebně sedí ${st} ${skl(st,'student','studenti','studentů')}, ${p} % z nich řeší bonusový úkol.\nKolik studentů to je?`,ans:String(c),hints:[`${p} % z ${st}.`,`${st} × ${p} : 100`],skill:'anal'};})()
 ],

 // ───────── OBLAST 2 — PYTHAGORAS ─────────
 '2-1': () => [   // Mocniny a odmocniny (MC)
  (()=>{const a=ri(11,25);return{text:`${rp(FC)}:\n${a}² =`,ans:String(a*a),distractors:[String(a*2)],hints:[`${a} × ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,9);return{text:`${rp(FC)}:\n${a}³ =`,ans:String(a**3),distractors:[String(a*3)],hints:[`${a} × ${a} × ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(4,15);return{text:`${rp(FC)}:\n√${a*a} =`,ans:String(a),distractors:[String(a*a)],hints:[`Hledej číslo, které na druhou dá ${a*a}.`],skill:'calc'};})(),
  (()=>{const n=ri(3,8);return{text:`${rp(FC)}:\n2^${n} =`,ans:String(2**n),distractors:[String(2*n)],hints:[`Násob dvojku ${n}×.`],skill:'calc'};})(),
  (()=>{const a=ri(3,8),b=ri(2,5);return{text:`${rp(FC)}:\n${a}² + ${b}² =`,ans:String(a*a+b*b),distractors:[String((a+b)**2)],hints:[`${a*a} + ${b*b}.`],skill:'calc'};})(),
  (()=>{const a=ri(10,20);return{text:`${rp(FC)}:\n√${a*a} + ${a} =`,ans:String(2*a),distractors:[String(a*a+a)],hints:[`√${a*a} = ${a}.`],skill:'calc'};})(),
  (()=>{const n=ri(2,6);return{text:`${rp(FC)}:\n10^${n} =`,ans:String(10**n),distractors:[String(10*n)],hints:[`1 s ${n} nulami.`],skill:'calc'};})(),
  (()=>{const a=ri(3,9);return{text:`${rp(FC)}:\n(-${a})² =`,ans:String(a*a),distractors:[String(-a*a)],hints:[`Záporné na druhou → kladné.`],skill:'calc'};})(),
  (()=>{const a=ri(5,12);return{text:`${rp(FC)}:\n${a}² - ${a} =`,ans:String(a*a-a),distractors:[String(a)],hints:[`${a*a} - ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,6);return{text:`${rp(FC)}:\n√${a*a*4} =`,ans:String(2*a),distractors:[String(a)],hints:[`√(4·${a*a}) = 2·${a}.`],skill:'calc'};})()
 ],
 '2-2': () => [   // Pythagoras — přepona
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Pravoúhlý trojúhelník: a = ${t[0]}, b = ${t[1]}.\nPřepona c? (celé číslo)`,ans:String(t[2]),hints:[`c² = a² + b².`,`${t[0]}² + ${t[1]}² = ${t[2]*t[2]}, odmocni.`],skill:'geo'};})(),
  (()=>{const a=ri(3,9),b=ri(3,12);const c=Math.sqrt(a*a+b*b);return{text:`Pravoúhlý trojúhelník: a = ${a}, b = ${b}.\nPřepona c? (2 des. místa)`,ans:r2(c),hints:[`c² = ${a*a} + ${b*b} = ${a*a+b*b}.`,`Odmocni ${a*a+b*b}.`],skill:'geo'};})(),
  (()=>{const a=ri(4,10),b=ri(3,8);const c=Math.sqrt(a*a+b*b);return{text:`Žebřík: pata ${b} m od zdi, dosáhne do výšky ${a} m.\nDélka žebříku? (2 des. místa)`,ans:r2(c),hints:[`Žebřík = přepona.`,`√(${a}² + ${b}²)`],skill:'geo'};})(),
  (()=>{const a=ri(6,12),b=ri(4,10);const c=Math.sqrt(a*a+b*b);return{text:`Obdélník ${a} × ${b} cm.\nÚhlopříčka? (2 des. místa)`,ans:r2(c),hints:[`Úhlopříčka = přepona trojúhelníku.`,`√(${a}² + ${b}²)`],skill:'geo'};})(),
  (()=>{const a=ri(40,90),b=ri(30,70);const c=Math.sqrt(a*a+b*b);return{text:`Monitor ${a} × ${b} cm.\nÚhlopříčka? (1 des. místo, cm)`,ans:r1(c),hints:[`√(šířka² + výška²).`],skill:'geo'};})(),
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Odvěsny ${t[0]} a ${t[1]}.\nJak dlouhá je přepona?`,ans:String(t[2]),hints:[`Pythagorejská trojice.`,`${t[0]},${t[1]},${t[2]}`],skill:'geo'};})(),
  (()=>{const a=ri(5,12);const c=Math.sqrt(a*a+a*a);return{text:`Čtverec ${a} × ${a} cm, jdeme přes úhlopříčku.\nÚhlopříčka? (2 des. místa)`,ans:r2(c),hints:[`Obě odvěsny stejné: √(${a}² + ${a}²).`],skill:'geo'};})(),
  (()=>{const a=ri(3,8),b=ri(3,8);const c=Math.sqrt(a*a+b*b);return{text:`Záchranář plave ${a} m na sever a ${b} m na východ.\nJak daleko je od startu? (2 des. místa)`,ans:r2(c),hints:[`Vzdálenost = přepona.`,`√(${a}²+${b}²)`],skill:'geo'};})(),
  (()=>{const t=PYT[ri(0,PYT.length-1)],k=ri(2,3);return{text:`Odvěsny ${t[0]*k} a ${t[1]*k}.\nPřepona? (celé číslo)`,ans:String(t[2]*k),hints:[`Pythagorejská trojice × ${k}.`],skill:'geo'};})(),
  (()=>{const a=ri(4,8),b=ri(3,7);const c=Math.sqrt(a*a+b*b);return{text:`Střecha: sklon ${a} m výšky, délka ${b} m.\nDélka krokve? (2 des. místa)`,ans:r2(c),hints:[`Krokev = přepona.`,`√(${a}²+${b}²)`],skill:'geo'};})(),
  (()=>{const uc=ri(2,6),a=ri(5,9),b=ri(4,8);const c=Math.sqrt(a*a+b*b);return{text:`V patře akademie ${skl(uc,'je','jsou','je')} ${uc} ${skl(uc,'učebna','učebny','učeben')}, každá obdélníková ${a} × ${b} m.\nJak dlouhá je úhlopříčka jedné učebny? (2 des. místa)`,ans:r2(c),hints:[`Úhlopříčka = přepona pravoúhlého trojúhelníku.`,`√(${a}² + ${b}²)`],skill:'geo'};})()
 ],
 '2-3': () => [   // Pythagoras — odvěsna
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Přepona c = ${t[2]}, odvěsna a = ${t[0]}.\nDruhá odvěsna b? (celé číslo)`,ans:String(t[1]),hints:[`b² = c² - a².`,`${t[2]*t[2]} - ${t[0]*t[0]} = ${t[1]*t[1]}`],skill:'geo'};})(),
  (()=>{const c=ri(10,20),a=ri(4,c-3);const b=Math.sqrt(c*c-a*a);return{text:`Přepona c = ${c}, odvěsna a = ${a}.\nDruhá odvěsna b? (2 des. místa)`,ans:r2(b),hints:[`b² = c² - a² = ${c*c-a*a}.`,`Odmocni ${c*c-a*a}.`],skill:'geo'};})(),
  (()=>{const c=ri(8,13),a=ri(3,c-2);const b=Math.sqrt(c*c-a*a);return{text:`Žebřík ${c} m opřený o zeď, pata ${a} m od zdi.\nDo jaké výšky dosáhne? (2 des. místa)`,ans:r2(b),hints:[`Výška² = žebřík² - odstup².`,`√(${c}² - ${a}²)`],skill:'geo'};})(),
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Přepona ${t[2]}, jedna odvěsna ${t[1]}.\nDruhá odvěsna?`,ans:String(t[0]),hints:[`Pythagorejská trojice.`],skill:'geo'};})(),
  (()=>{const c=ri(13,25),a=ri(5,c-4);const b=Math.sqrt(c*c-a*a);return{text:`Stožár jištěný lanem ${c} m, ukotveno ${a} m od paty.\nVýška úchytu? (2 des. místa)`,ans:r2(b),hints:[`√(lano² - odstup²).`],skill:'geo'};})(),
  (()=>{const c=ri(10,18),a=ri(6,c-2);const b=Math.sqrt(c*c-a*a);return{text:`Rampa: délka ${c} m, vodorovný průmět ${a} m.\nVýška rampy? (2 des. místa)`,ans:r2(b),hints:[`√(délka² - průmět²).`],skill:'geo'};})(),
  (()=>{const t=PYT[ri(0,PYT.length-1)],k=ri(2,3);return{text:`Přepona ${t[2]*k}, odvěsna ${t[0]*k}.\nDruhá odvěsna? (celé číslo)`,ans:String(t[1]*k),hints:[`Pythagorejská trojice × ${k}.`],skill:'geo'};})(),
  (()=>{const d=ri(20,30),x=ri(8,d-5);const h=Math.sqrt(d*d-x*x);return{text:`Letadlo letí ${d} km, vodorovně ${x} km.\nVýška? (2 des. místa, km)`,ans:r2(h),hints:[`výška² = ${d}² - ${x}².`],skill:'geo'};})(),
  (()=>{const c=ri(10,15),b=ri(6,c-2);const a=Math.sqrt(c*c-b*b);return{text:`Obdélník: úhlopříčka ${c} cm, jedna strana ${b} cm.\nDruhá strana? (2 des. místa)`,ans:r2(a),hints:[`a² = ${c}² - ${b}².`],skill:'geo'};})(),
  (()=>{const c=ri(8,14),a=ri(3,c-3);const b=Math.sqrt(c*c-a*a);return{text:`Trojúhelník s přeponou ${c} a odvěsnou ${a}.\nDruhá odvěsna? (2 des. místa)`,ans:r2(b),hints:[`b = √(${c*c}-${a*a}).`],skill:'geo'};})(),
  (()=>{const zb=ri(2,6),c=ri(8,13),a=ri(3,c-2);const b=Math.sqrt(c*c-a*a);return{text:`Ve skladu akademie stojí ${zb} ${skl(zb,'žebřík','žebříky','žebříků')}. Nejdelší (${c} m) opřeme o zeď, pata ${a} m od zdi.\nDo jaké výšky dosáhne? (2 des. místa)`,ans:r2(b),hints:[`Výška² = žebřík² − odstup².`,`√(${c}² − ${a}²)`],skill:'geo'};})()
 ],

 // ───────── OBLAST 3 — ROVNICE ─────────
 '3-1': () => [   // Jednoduché rovnice (MC)
  (()=>{const x=ri(2,20),a=ri(2,15);return{text:`${rp(FE)}:\nx + ${a} = ${x+a}\nx = ?`,ans:String(x),distractors:[String(x+2*a)],hints:[`Odečti ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(5,25),a=ri(2,15);return{text:`${rp(FE)}:\nx - ${a} = ${x-a}\nx = ?`,ans:String(x),distractors:[String(x-2*a)],hints:[`Přičti ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,12),a=ri(2,9);return{text:`${rp(FE)}:\n${a}·x = ${a*x}\nx = ?`,ans:String(x),distractors:(a*x-a!==x?[String(a*x-a)]:[]),hints:[`Vyděl ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,12),a=ri(2,8);return{text:`${rp(FE)}:\nx / ${a} = ${x}\nx = ?`,ans:String(x*a),distractors:[String(x)],hints:[`Vynásob ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,15),a=ri(16,30);return{text:`${rp(FE)}:\n${a} - x = ${a-x}\nx = ?`,ans:String(x),distractors:(a-x!==x?[String(a-x)]:[]),hints:[`x = ${a} - ${a-x}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,10),a=ri(2,6),b=ri(1,9);return{text:`${rp(FE)}:\n${a}·x + ${b} = ${a*x+b}\nx = ?`,ans:String(x),distractors:[String(a*x)],hints:[`Odečti ${b}, pak vyděl ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(3,15),a=ri(2,5);return{text:`${rp(FE)}:\n${a}·x - ${a} = ${a*x-a}\nx = ?`,ans:String(x),distractors:[String(a*x)],hints:[`Přičti ${a}: ${a}x = ${a*x}.`,`Vyděl ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(10,30),a=ri(3,8);return{text:`${rp(FE)}:\n${x} = ${a}·x - ${a*x-x}\nx = ?`,ans:String(x),distractors:[String(a*x-x)],hints:[`Dej ${a}x na stranu s x.`],skill:'anal'};})(),
  (()=>{const x=ri(2,10),k=ri(2,5);return{text:`${rp(FE)}:\nx² = ${x*x}\nx = ? (kladná hodnota)`,ans:String(x),distractors:[String(x*x)],hints:[`x = √${x*x}.`],skill:'anal'};})(),
  (()=>{const d=ri(2,4),x=d*ri(2,8);return{text:`${rp(FE)}:\nx / ${d} = ${x/d}\nx = ?`,ans:String(x),distractors:[String(x/d)],hints:[`x = ${x/d} × ${d}.`],skill:'anal'};})()
 ],
 '3-2': () => [   // Dvojkrokové rovnice
  (()=>{const x=ri(2,12),a=ri(2,8),b=ri(2,15);return{text:`${rp(FE)}:\n${a}·x + ${b} = ${a*x+b}\nx = ?`,ans:String(x),hints:[`Odečti ${b}: ${a}x = ${a*x}.`,`Vyděl ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(3,12),a=ri(2,8),b=ri(2,15);return{text:`${rp(FE)}:\n${a}·x - ${b} = ${a*x-b}\nx = ?`,ans:String(x),hints:[`Přičti ${b}: ${a}x = ${a*x}.`,`Vyděl ${a}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,9),a=ri(2,5),b=ri(2,9);return{text:`${rp(FE)}:\n${a}·(x + ${b}) = ${a*(x+b)}\nx = ?`,ans:String(x),hints:[`Vyděl ${a}: x + ${b} = ${x+b}.`,`Odečti ${b}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,10),a=ri(2,6),c=ri(1,5);const L=a+c;return{text:`${rp(FE)}:\n${a}·x + ${c}·x = ${L*x}\nx = ?`,ans:String(x),hints:[`Sečti x: ${L}x = ${L*x}.`,`Vyděl ${L}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,9),a=ri(4,7),c=ri(2,a-1),b=ri(1,9);const d=(a-c)*x+b;return{text:`${rp(FE)}:\n${a}·x + ${b} = ${c}·x + ${d}\nx = ?`,ans:String(x),hints:[`Dej x vlevo, čísla vpravo: ${a-c}x = ${d-b}.`,`Vyděl ${a-c}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8)*2,b=ri(2,8);return{text:`${rp(FE)}:\nx/2 + ${b} = ${x/2+b}\nx = ?`,ans:String(x),hints:[`Odečti ${b}: x/2 = ${x/2}.`,`Vynásob 2.`],skill:'anal'};})(),
  (()=>{const x=ri(3,12),a=ri(2,5),b=ri(2,8);return{text:`${rp(FE)}:\n${a}(x - ${b}) = ${a*(x-b)}\nx = ?`,ans:String(x),hints:[`Vyděl ${a}: x - ${b} = ${x-b}.`,`Přičti ${b}.`],skill:'anal'};})(),
  (()=>{const x=ri(2,8),a=ri(2,4),b=ri(1,5);return{text:`${rp(FE)}:\n${a}x + ${b} = ${a*x+b+2*x} - 2x\nx = ?`,ans:String(x),hints:[`Dej x na levou: ${a+2}x + ${b} = ${a*x+b+2*x}.`],skill:'anal'};})(),
  (()=>{const x=ri(3,10),a=ri(2,4),b=a*(x+ri(1,5));return{text:`${rp(FE)}:\n${a}x = ${b} - ${b-a*x}\nx = ?`,ans:String(x),hints:[`Zjednodušit pravou stranu.`,`${a}x = ${a*x}, x = ${x}.`],skill:'anal'};})(),
  (()=>{const c=ri(3,6),x=c*ri(2,6),b=ri(1,8);return{text:`${rp(FE)}:\nx/${c} + ${b} = ${x/c+b}\nx = ?`,ans:String(x),hints:[`Odečti ${b}: x/${c} = ${x/c}.`,`Vynásob ${c}.`],skill:'anal'};})(),
  (()=>{const n=ri(2,6),x=ri(3,12),a=ri(2,6),b=ri(2,12);return{text:`${skl(n,'Na tabuli je','Na tabuli jsou','Na tabuli je')} ${n} ${skl(n,'rovnice','rovnice','rovnic')}. Tu první vyřeš:\n${a}·x + ${b} = ${a*x+b}\nx = ?`,ans:String(x),hints:[`Odečti ${b}: ${a}x = ${a*x}.`,`Vyděl ${a}.`],skill:'anal'};})()
 ],
 '3-3': () => [   // Slovní úlohy
  (()=>{const x=ri(3,15),a=ri(2,5),b=ri(2,12);const P=[`Myslím si číslo. Když ho vynásobím ${a} a přičtu ${b}, dostanu ${a*x+b}.`,`Student akademie si myslí číslo, ${a}× ho zvětší a přidá ${b} — vyjde ${a*x+b}.`,`Zadané číslo vynásobíme ${a} a zvětšíme o ${b}; výsledek je ${a*x+b}.`];return{text:`${P[ri(0,P.length-1)]}\nJaké je to číslo?`,ans:String(x),hints:[`Rovnice: ${a}x + ${b} = ${a*x+b}.`],skill:'anal'};})(),
  (()=>{const syn=ri(8,14),roz=ri(20,30);return{text:`Otci je o ${roz} let více než synovi (${syn} let).\nKolik let je otci?`,ans:String(syn+roz),hints:[`${syn} + ${roz}.`],skill:'anal'};})(),
  (()=>{const cena=ri(3,9)*10,ks=ri(3,8);return{text:`${ks} ${skl(ks,'stejný sešit','stejné sešity','stejných sešitů')} ${skl(ks,'stál','stály','stálo')} ${cena*ks} Kč.\nKolik stál jeden? (Kč)`,ans:String(cena),hints:[`Celek : počet.`,`${cena*ks} : ${ks}`],skill:'anal'};})(),
  (()=>{const cel=ri(4,9)*10,prvni=ri(10,cel-10);return{text:`Lano ${cel} m rozdělíme na dva kusy.\nJeden má ${prvni} m. Druhý? (m)`,ans:String(cel-prvni),hints:[`${cel} - ${prvni}.`],skill:'anal'};})(),
  (()=>{const x=ri(3,10)*2;return{text:`Číslo zvětšené o svou polovinu je ${x*3/2}.\nJaké je číslo?`,ans:String(x),hints:[`x + x/2 = 1,5x.`,`1,5x = ${x*3/2}`],skill:'anal'};})(),
  (()=>{const aut=ri(8,15),kol=aut+ri(3,9);return{text:`Na parkovišti je ${aut} aut a ${kol} kol.\nO kolik víc je kol než aut?`,ans:String(kol-aut),hints:[`${kol} - ${aut}.`],skill:'anal'};})(),
  (()=>{const a=ri(5,12),b=ri(3,10);return{text:`Obvod obdélníku je ${2*(a+b)} cm, jedna strana ${a} cm.\nDruhá strana? (cm)`,ans:String(b),hints:[`o = 2(a+b), b = o/2 − a.`,`${a+b} − ${a}`],skill:'anal'};})(),
  (()=>{const v=ri(6,12)*5,t=ri(2,4);return{text:`Auto ujelo ${v*t} km za ${t} h.\nPrůměrná rychlost? (km/h)`,ans:String(v),hints:[`v = dráha : čas.`,`${v*t} : ${t}`],skill:'anal'};})(),
  (()=>{const x=ri(4,12),n=ri(3,5);return{text:`Součet ${n} po sobě jdoucích čísel je ${n*x+(n*(n-1)/2)}.\nNejmenší číslo?`,ans:String(x),hints:[`${n} čísel: x, x+1, …, x+${n-1}.`,`${n}x + ${n*(n-1)/2} = ${n*x+(n*(n-1)/2)}`],skill:'anal'};})(),
  (()=>{const ks=ri(4,9),a=ri(10,30)*2,more=ks+ri(1,4);return{text:`${ks} ${skl(ks,'jablko stálo','jablka stála','jablek stálo')} ${ks*a} Kč.\nKolik stojí ${more} ${skl(more,'jablko','jablka','jablek')}?`,ans:String(more*a),hints:[`Cena za 1 jablko = ${ks*a} : ${ks}.`],skill:'anal'};})(),
  (()=>{const t=ri(2,6),per=ri(2,5),st=t*per;return{text:`Na projektový den se ${st} ${skl(st,'student rozdělil','studenti rozdělili','studentů rozdělilo')} do ${t} týmů rovným dílem.\nKolik studentů je v jednom týmu?`,ans:String(per),hints:[`${st} : ${t}.`,`Počet studentů děl počtem týmů.`],skill:'anal'};})(),
  (()=>{const a=ri(2,9)*10,n=ri(2,6);return{text:`V knihovně akademie stojí každá kniha ${a} Kč.\nKolik zaplatíš za ${n} ${skl(n,'knihu','knihy','knih')}?`,ans:String(a*n),hints:[`${a} × ${n}.`],skill:'anal'};})()
 ],

 // ───────── OBLAST 4 — VÝRAZY ─────────
 '4-1': () => [   // Dosazování (MC)
  (()=>{const x=ri(2,9),a=ri(2,6),b=ri(1,9);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}:\n${a}x + ${b} =`,ans:String(a*x+b),distractors:[String(a*(x+b))],hints:[`${a}·${x} + ${b}.`],skill:'calc'};})(),
  (()=>{const x=ri(2,8);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}:\nx² - x =`,ans:String(x*x-x),distractors:(x*x-x!==x?[String(x)]:[]),hints:[`${x*x} - ${x}.`],skill:'calc'};})(),
  (()=>{const x=ri(3,9),a=ri(2,5);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}:\n${a}(x - 2) =`,ans:String(a*(x-2)),distractors:[String(a*x-2)],hints:[`${a}·(${x}-2).`],skill:'calc'};})(),
  (()=>{const x=ri(2,6),y=ri(2,6),a=ri(2,4),b=ri(2,4);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}, y = ${y}:\n${a}x + ${b}y =`,ans:String(a*x+b*y),distractors:(a*y+b*x!==a*x+b*y?[String(a*y+b*x)]:[]),hints:[`${a}·${x} + ${b}·${y}.`],skill:'calc'};})(),
  (()=>{const x=ri(2,5),y=ri(2,5);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}, y = ${y}:\nx² + y² =`,ans:String(x*x+y*y),distractors:[String((x+y)**2)],hints:[`${x*x} + ${y*y}.`],skill:'calc'};})(),
  (()=>{const x=ri(3,8),a=ri(2,5);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}:\nx² - ${a}x =`,ans:String(x*x-a*x),distractors:[String(x*x+a*x)],hints:[`${x*x} - ${a}·${x}.`],skill:'calc'};})(),
  (()=>{const x=ri(2,7),a=ri(2,5),b=ri(1,6);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}:\n(${a}x + ${b})² =`,ans:String((a*x+b)**2),distractors:[String((a*x)**2+b*b)],hints:[`${a*x+b} na druhou.`,`${a*x+b}² = ${(a*x+b)**2}`],skill:'calc'};})(),
  (()=>{const x=ri(2,8),y=ri(2,6);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}, y = ${y}:\n(x + y)² =`,ans:String((x+y)**2),distractors:[String(x*x+y*y)],hints:[`${x+y} na druhou.`],skill:'calc'};})(),
  (()=>{const a=ri(2,6),b=ri(2,6),x=ri(1,5);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}:\n${a}x² + ${b} =`,ans:String(a*x*x+b),distractors:(( a*x)**2+b!==a*x*x+b?[String((a*x)**2+b)]:[]),hints:[`${a}·${x*x} + ${b}.`],skill:'calc'};})(),
  (()=>{const x=ri(3,7);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}:\n(x - 1)(x + 1) =`,ans:String(x*x-1),distractors:[String(x*x+1)],hints:[`a² - b² = x² - 1.`],skill:'calc'};})()
 ],
 '4-2': () => [   // Závorky a vzorce
  (()=>{const a=ri(2,9),b=ri(2,9);return{text:`${rp(FC)} pomocí vzorce (a+b)²:\n(${a} + ${b})² =`,ans:String((a+b)**2),hints:[`a² + 2ab + b².`,`${a*a} + ${2*a*b} + ${b*b}`],skill:'calc'};})(),
  (()=>{const a=ri(5,12),b=ri(2,a-1);return{text:`Vypočítej pomocí vzorce (a-b)²:\n(${a} - ${b})² =`,ans:String((a-b)**2),hints:[`a² - 2ab + b².`,`${a*a} - ${2*a*b} + ${b*b}`],skill:'calc'};})(),
  (()=>{const a=ri(5,12),b=ri(2,a-1);return{text:`Vypočítej pomocí vzorce (a+b)(a-b):\n(${a} + ${b})(${a} - ${b}) =`,ans:String(a*a-b*b),hints:[`a² - b².`,`${a*a} - ${b*b}`],skill:'calc'};})(),
  (()=>{const a=ri(2,7),b=ri(2,7);return{text:`${rp(FC)}:\n(${a} + ${b})² - (${a} - ${b})² =`,ans:String((a+b)**2-(a-b)**2),hints:[`Rozdíl čtverců = 4ab.`,`4·${a}·${b}`],skill:'calc'};})(),
  (()=>{const a=ri(11,20);return{text:`Pomocí (a+b)² spočítej:\n${a}² =`,ans:String(a*a),hints:[`Rozlož: (${10}+${a-10})².`,`100 + ${20*(a-10)} + ${(a-10)**2}`],skill:'calc'};})(),
  (()=>{const a=ri(2,8),b=ri(2,8);return{text:`Vynásob závorky:\n(x + ${a})(x + ${b}) má absolutní člen =`,ans:String(a*b),hints:[`Absolutní člen = ${a}·${b}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,6),b=ri(2,6);return{text:`Vynásob závorky a nalezni koeficient u x:\n(x + ${a})(x + ${b}), koeficient u x =`,ans:String(a+b),hints:[`${a} + ${b}.`],skill:'calc'};})(),
  (()=>{const a=ri(10,15);return{text:`Využi (a-b)² pro výpočet:\n${a}² =\n(Nápověda: ${a} = ${a+1} - 1)`,ans:String(a*a),hints:[`(${a+1}-1)² = ${(a+1)**2} - ${2*(a+1)} + 1.`],skill:'calc'};})(),
  (()=>{const a=ri(3,8),b=ri(3,8);return{text:`Vyjádři jako rozdíl čtverců:\n${a*a} - ${b*b} = (a+b)(a-b)\na + b = ${a+b}, a - b = ?`,ans:String(a-b),hints:[`a - b = ${a} - ${b}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,5),b=ri(2,5),c=ri(1,4);return{text:`Roznásob závorku:\n${a}(${b}x + ${c}) = ${a*b}x + ?`,ans:String(a*c),hints:[`${a} × ${c}.`],skill:'calc'};})()
 ],
 '4-3': () => [   // Vytýkání (NSD)
  (()=>{const g=ri(2,8),a=g*ri(2,5),b=g*ri(2,5);const gg=gcd(a,b);return{text:`Vytkni největší společné číslo z:\n${a}x + ${b}\nJaké číslo vytkneš?`,ans:String(gg),hints:[`Hledej NSD čísel ${a} a ${b}.`,`NSD = ${gg}`],skill:'calc'};})(),
  (()=>{const a=ri(2,9)*ri(2,4),b=ri(2,9)*ri(2,4);const gg=gcd(a,b);return{text:`${rp(['Najdi','Urči','Spočítej'])} největší společný dělitel:\nNSD(${a}, ${b}) =`,ans:String(gg),hints:[`Rozlož na prvočísla.`],skill:'calc'};})(),
  (()=>{const k=ri(2,6),a=ri(2,5),b=ri(2,5);return{text:`Vytkni ${k}:\n${k*a}x + ${k*b} = ${k}(__ x + ${b})\nDoplň první číslo:`,ans:String(a),hints:[`${k*a} : ${k}.`],skill:'calc'};})(),
  (()=>{const k=ri(2,7),a=ri(3,8);return{text:`Vytkni společné x:\n${a}x² + ${k}x = x(__ x + ${k})\nDoplň první číslo:`,ans:String(a),hints:[`${a}x² : x = ${a}x.`],skill:'calc'};})(),
  (()=>{const g=ri(3,9),a=g*ri(2,6),b=g*ri(2,6),c=g*ri(2,6);return{text:`Společné číslo k vytknutí z:\n${a}x + ${b}y + ${c}\nNSD koeficientů =`,ans:String(gcd(gcd(a,b),c)),hints:[`NSD všech tří čísel.`],skill:'calc'};})(),
  (()=>{const a=ri(2,6);return{text:`Vytkni z výrazu ${a}a + ${a}b společné číslo.\nJaké číslo vytkneš?`,ans:String(a),hints:[`Obě části mají činitel ${a}.`],skill:'calc'};})(),
  (()=>{const k=ri(2,5),a=ri(2,4),b=ri(2,4);return{text:`Vytkni x:\n${k}x² − ${a}x = x(${k}x − ?)`,ans:String(a),hints:[`Druhý člen: ${a}x : x = ${a}.`],skill:'calc'};})(),
  (()=>{const g=ri(2,4),a=g*ri(2,4),b=g*ri(3,6);return{text:`Vytkni ${g}a z:\n${a}a² + ${b}a = ${g}a(? + ${b/g})\nDoplň ?:`,ans:String(a/g)+'a',hints:[`${a}a² : (${g}a) = ${a/g}a.`],skill:'calc'};})(),
  (()=>{const a=ri(4,8),b=ri(3,6);const g=gcd(a,b);return{text:`Vytkni co největší číslo ze všech členů výrazu:\n${a}x + ${b}y − ${g}\nJaké číslo vytkneš?`,ans:String(g),hints:[`NSD čísel ${a}, ${b} a ${g} = ${g}.`],skill:'calc'};})(),
  (()=>{const k=ri(2,5),a=ri(2,4),b=ri(2,4);return{text:`Je ${k} NSD z ${k*a} a ${k*b}?\n(ANO/NE)`,ans:gcd(k*a,k*b)===k?'ANO':'NE',hints:[`NSD(${k*a},${k*b}) = ${gcd(k*a,k*b)}.`],skill:'calc'};})()
 ],

 // ───────── OBLAST 5 — KRUH A VÁLEC ─────────
 '5-1': () => [   // Obvod a obsah kruhu (MC, π=3,14)
  (()=>{const r=ri(2,10);return{text:`Kruh o poloměru r = ${r}.\nObvod? (π = 3,14)`,ans:r2(2*PI*r),distractors:(r!==2?[r2(PI*r*r)]:[]),hints:[`o = 2πr.`,`2 × 3,14 × ${r}`],skill:'geo'};})(),
  (()=>{const r=ri(2,9);return{text:`Kruh o poloměru r = ${r}.\nObsah? (π = 3,14)`,ans:r2(PI*r*r),distractors:(r!==2?[r2(2*PI*r)]:[]),hints:[`S = πr².`,`3,14 × ${r}²`],skill:'geo'};})(),
  (()=>{const d=ri(4,16);return{text:`Kruh o průměru d = ${d}.\nObvod? (π = 3,14)`,ans:r2(PI*d),distractors:[r2(2*PI*d)],hints:[`o = πd.`,`3,14 × ${d}`],skill:'geo'};})(),
  (()=>{const d=ri(4,12);const r=d/2;return{text:`Kruh o průměru d = ${d}.\nObsah? (π = 3,14)`,ans:r2(PI*r*r),distractors:[r2(PI*d*d)],hints:[`r = ${r}, S = πr².`,`3,14 × ${r}²`],skill:'geo'};})(),
  (()=>{const r=ri(3,8);return{text:`Polovina kruhu o poloměru ${r}.\nObsah půlkruhu? (π = 3,14)`,ans:r2(PI*r*r/2),distractors:[r2(PI*r*r)],hints:[`Půlka z πr².`],skill:'geo'};})(),
  (()=>{const r=ri(2,7);return{text:`Kruh o poloměru ${r}.\nObvod : 2 = (π = 3,14)`,ans:r2(PI*r),distractors:[r2(2*PI*r)],hints:[`2πr : 2 = πr.`],skill:'geo'};})(),
  (()=>{const r=ri(3,8);return{text:`Čtvrtina kruhu o poloměru ${r}.\nObsah čtvrtiny? (π = 3,14)`,ans:r2(PI*r*r/4),distractors:[r2(PI*r*r)],hints:[`¼ z πr².`,`3,14 × ${r*r} : 4`],skill:'geo'};})(),
  (()=>{const d=ri(6,14);return{text:`Průměr kola d = ${d} cm.\nObvod (π = 3,14)?`,ans:r2(PI*d),distractors:[r2(2*PI*d)],hints:[`o = πd.`,`3,14 × ${d}`],skill:'geo'};})(),
  (()=>{const r=ri(2,6);return{text:`Obsah kruhu = ${r2(PI*r*r)} cm².\nJaký je poloměr? (π = 3,14)`,ans:String(r),distractors:[String(2*r)],hints:[`S = πr², r = √(S/π).`,`r = √(${r2(PI*r*r)} : 3,14) = ${r}`],skill:'geo'};})(),
  (()=>{const r=ri(3,7);return{text:`Tři čtvrtiny kruhu o poloměru ${r}.\nObsah? (π = 3,14)`,ans:r2(3*PI*r*r/4),distractors:[r2(PI*r*r)],hints:[`¾ × πr².`,`3 × ${r2(PI*r*r/4)}`],skill:'geo'};})()
 ],
 '5-2': () => [   // Válec
  (()=>{const r=ri(2,7),h=ri(3,12);const P=[`Válec: poloměr ${r}, výška ${h}.`,`Válcová nádoba má poloměr ${r} a výšku ${h}.`,`Rotační válec: r = ${r}, v = ${h}.`];return{text:`${P[ri(0,P.length-1)]}\nObjem? (π = 3,14)`,ans:r2(PI*r*r*h),hints:[`V = πr²h.`,`3,14 × ${r}² × ${h}`],skill:'geo'};})(),
  (()=>{const r=ri(2,6),h=ri(3,10);return{text:`Válec: poloměr ${r}, výška ${h}.\nObsah pláště? (π = 3,14)`,ans:r2(2*PI*r*h),hints:[`Plášť = 2πr·h.`,`2 × 3,14 × ${r} × ${h}`],skill:'geo'};})(),
  (()=>{const r=ri(2,6),h=ri(3,10);return{text:`Válec: poloměr ${r}, výška ${h}.\nCelý povrch? (π = 3,14)`,ans:r2(2*PI*r*(r+h)),hints:[`S = 2πr(r+h).`,`2 × 3,14 × ${r} × ${r+h}`],skill:'geo'};})(),
  (()=>{const r=ri(2,8);return{text:`Válec: poloměr ${r}, výška ${r}.\nObjem? (π = 3,14)`,ans:r2(PI*r*r*r),hints:[`V = πr²·r = πr³.`],skill:'geo'};})(),
  (()=>{const d=ri(4,12),h=ri(5,15);const r=d/2;return{text:`Válec: průměr ${d}, výška ${h}.\nObjem? (π = 3,14)`,ans:r2(PI*r*r*h),hints:[`r = ${r}, V = πr²h.`],skill:'geo'};})(),
  (()=>{const r=ri(2,6),h=ri(4,10);return{text:`Obsah jedné podstavy válce (r = ${r}).\nS = (π = 3,14)`,ans:r2(PI*r*r),hints:[`Podstava = kruh, πr².`],skill:'geo'};})(),
  (()=>{const r=ri(2,5),h=ri(5,12);return{text:`Konzerva: poloměr dna ${r} cm, výška ${h} cm.\nObjem? (cm³, π = 3,14)`,ans:r2(PI*r*r*h),hints:[`V = πr²h.`],skill:'geo'};})(),
  (()=>{const r=ri(2,5),h=ri(4,8),n=ri(2,4);return{text:`${n} ${skl(n,'válcová nádoba','válcové nádoby','válcových nádob')}: r = ${r} cm, v = ${h} cm.\nCelkový objem? (cm³, π = 3,14)`,ans:r2(n*PI*r*r*h),hints:[`${n} × πr²h.`],skill:'geo'};})(),
  (()=>{const r=ri(2,5),h=ri(6,12);return{text:`Válec: r = ${r} dm, výška ${h} dm.\nObjem v litrech? (1 dm³ = 1 l, π = 3,14)`,ans:r2(PI*r*r*h),hints:[`V = πr²h dm³ = l.`],skill:'geo'};})(),
  (()=>{const r=ri(3,7),h=ri(5,10);return{text:`Válcová nádrž: průměr ${2*r} m, hloubka ${h} m.\nObjem vody? (m³, π = 3,14)`,ans:r2(PI*r*r*h),hints:[`r = ${r}, V = πr²h.`],skill:'geo'};})()
 ],
 '5-3': () => [   // Kružnice — slovní úlohy
  (()=>{const r=ri(20,40);const o=2*PI*r;const P=[`Kolo o poloměru ${r} cm se otočí jednou.`,`Cyklista popojede o jednu otáčku kola (poloměr ${r} cm).`,`Kolo s poloměrem ${r} cm udělá jednu otáčku.`];return{text:`${P[ri(0,P.length-1)]}\nUjetá dráha? (cm, π = 3,14)`,ans:r2(o),hints:[`Dráha = obvod = 2πr.`],skill:'geo'};})(),
  (()=>{const r=ri(3,8);return{text:`Kruhový bazén o poloměru ${r} m.\nPlocha hladiny? (m², π = 3,14)`,ans:r2(PI*r*r),hints:[`S = πr².`],skill:'geo'};})(),
  (()=>{const d=ri(6,14);return{text:`Kruhový záhon o průměru ${d} m chceme oplotit.\nDélka plotu? (m, π = 3,14)`,ans:r2(PI*d),hints:[`Plot = obvod = πd.`],skill:'geo'};})(),
  (()=>{const r=ri(10,25),n=ri(2,5);const o=2*PI*r*n;return{text:`Kolo o poloměru ${r} cm se otočí ${n}×.\nUjetá dráha? (cm, π = 3,14)`,ans:r2(o),hints:[`${n} × obvod.`],skill:'geo'};})(),
  (()=>{const r=ri(2,6),h=ri(8,20);return{text:`Plechovka (válec): poloměr ${r} cm, výška ${h} cm.\nKolik cm³ se vejde? (π = 3,14)`,ans:r2(PI*r*r*h),hints:[`Objem = πr²h.`],skill:'geo'};})(),
  (()=>{const r=ri(4,10);return{text:`Kruhový ubrus o poloměru ${r} dm chceme olemovat.\nDélka lemu? (dm, π = 3,14)`,ans:r2(2*PI*r),hints:[`Lem = obvod = 2πr.`],skill:'geo'};})(),
  (()=>{const r=ri(5,15);return{text:`Kruhové jezírko r = ${r} m. Chceme ho oplotit.\nDélka plotu? (m, π = 3,14)`,ans:r2(2*PI*r),hints:[`Obvod kruhu = 2πr.`],skill:'geo'};})(),
  (()=>{const r=ri(2,5),h=ri(10,20);return{text:`Silo (válec): r = ${r} m, výška ${h} m.\nObjem obilí? (m³, π = 3,14)`,ans:r2(PI*r*r*h),hints:[`V = πr²h.`],skill:'geo'};})(),
  (()=>{const r=ri(10,20),n=ri(5,12);return{text:`Kolo: r = ${r} cm, ujede ${n} otáček.\nDráha v metrech? (π = 3,14)`,ans:r2(n*2*PI*r/100),hints:[`${n} × 2πr cm → m.`],skill:'geo'};})(),
  (()=>{const r=ri(3,7);return{text:`Fontána: kruhová plocha r = ${r} m, hloubka 1 m.\nObjem vody v litrech? (1 m³ = 1000 l, π = 3,14)`,ans:r2(PI*r*r*1000),hints:[`V = πr² × 1 m³ × 1000.`],skill:'geo'};})(),
  (()=>{const r=ri(2,6);return{text:`Do kruhové učebny pořídili kulatý koberec o poloměru ${r} m.\nKolik m² koberce to je? (π = 3,14)`,ans:r2(PI*r*r),hints:[`S = πr².`,`3,14 × ${r}²`],skill:'geo'};})()
 ],

 // ───────── OBLAST 6 — KONSTRUKCE ─────────
 '6-1': () => [   // Množiny bodů (MC, ANO/NE + numerické)
  (()=>{return{text:`Množina bodů stejně vzdálených od dvou bodů\nje osa úsečky. Platí to?\n(ANO/NE)`,ans:'ANO',hints:[`Osa úsečky = množina bodů ve stejné vzdálenosti.`],skill:'geo'};})(),
  (()=>{const r=ri(3,9);return{text:`Bod je vzdálen ${r} cm od středu.\nLeží na kružnici s poloměrem ${r} cm?\n(ANO/NE)`,ans:'ANO',hints:[`Kružnice = body v dané vzdálenosti od středu.`],skill:'geo'};})(),
  (()=>{const r=ri(3,8),d=r+ri(1,4);return{text:`Kružnice má poloměr ${r}. Bod je ${d} cm od středu.\nLeží na kružnici?\n(ANO/NE)`,ans:'NE',hints:[`${d} ≠ ${r}, tedy mimo kružnici.`],skill:'geo'};})(),
  (()=>{return{text:`Množina bodů dané vzdálenosti od přímky\njsou dvě rovnoběžky. Kolik rovnoběžek?`,ans:'2',distractors:['1'],hints:[`Na každé straně přímky jedna.`],skill:'geo'};})(),
  (()=>{return{text:`Osa úhlu rozděluje úhel na kolik stejných částí?`,ans:'2',distractors:['4'],hints:[`Osa = symetrála úhlu.`],skill:'geo'};})(),
  (()=>{const r=ri(2,6);return{text:`Kružnice o poloměru ${r}.\nJaký je její průměr?`,ans:String(2*r),distractors:[String(r)],hints:[`d = 2r.`],skill:'geo'};})(),
  (()=>{return{text:`Osa úsečky AB prochází středem AB.\nPlatí to?\n(ANO/NE)`,ans:'ANO',hints:[`Osa úsečky prochází středem a je na ni kolmá.`],skill:'geo'};})(),
  (()=>{return{text:`Kružnice opisná trojúhelníku prochází\nvšemi vrcholy. Platí to?\n(ANO/NE)`,ans:'ANO',hints:[`Kružnice opisná = ta, která prochází všemi třemi vrcholy.`],skill:'geo'};})(),
  (()=>{return{text:`Kolik bodů má osa úsečky AB společných\ns úsečkou AB?`,ans:'1',distractors:['2'],hints:[`Rozmysli si, kudy přesně osa úsečky prochází.`],skill:'geo'};})(),
  (()=>{const r=ri(3,8);return{text:`Bod leží uvnitř kružnice o poloměru ${r},\nje jeho vzdálenost od středu větší než ${r}?\n(ANO/NE)`,ans:'NE',hints:[`Uvnitř = vzdálenost < poloměr.`],skill:'geo'};})()
 ],
 '6-2': () => [   // Thaletova kružnice
  (()=>{return{text:`Úhel nad průměrem (Thaletova kružnice)\nmá vždy kolik stupňů?`,ans:'90',hints:[`Thaletova věta → pravý úhel.`],skill:'geo'};})(),
  (()=>{const c=ri(6,16);const P=[`Přepona pravoúhlého trojúhelníku = ${c}.`,`Pravoúhlý trojúhelník má přeponu ${c}.`,`Nad přeponou délky ${c} sestrojíme Thaletovu kružnici.`];return{text:`${P[ri(0,P.length-1)]}\nPoloměr Thaletovy kružnice?`,ans:r1(c/2),hints:[`Poloměr = polovina přepony.`,`${c} : 2`],skill:'geo'};})(),
  (()=>{return{text:`Vrchol pravého úhlu trojúhelníku leží\nna Thaletově kružnici. Platí?\n(ANO/NE)`,ans:'ANO',hints:[`To je podstata Thaletovy věty.`],skill:'geo'};})(),
  (()=>{const r=ri(3,9);return{text:`Thaletova kružnice má poloměr ${r}.\nDélka přepony (= průměr)?`,ans:String(2*r),hints:[`Přepona = průměr = 2r.`],skill:'geo'};})(),
  (()=>{return{text:`Je úhel nad průměrem tupý?\n(ANO/NE)`,ans:'NE',hints:[`Je přesně pravý (90°), ne tupý.`],skill:'geo'};})(),
  (()=>{const c=ri(10,20);return{text:`Průměr Thaletovy kružnice je ${c}.\nKolik měří poloměr?`,ans:cz(r1(c/2)),hints:[`r = d/2.`],skill:'geo'};})(),
  (()=>{return{text:`Pokud je úhel v trojúhelníku nad průměrem\nostrý, leží jeho vrchol na Thaletově kružnici?\n(ANO/NE)`,ans:'NE',hints:[`Vrchol musí ležet PŘÍMO NA kružnici → úhel = 90°.`],skill:'geo'};})(),
  (()=>{const d=ri(8,18);return{text:`Střed Thaletovy kružnice je uprostřed průměru ${d} cm.\nVzdálenost středu od vrcholu pravého úhlu?`,ans:cz(d/2),hints:[`Poloměr = d/2.`],skill:'geo'};})(),
  (()=>{return{text:`Leží střed Thaletovy kružnice vždy uvnitř\ntrojúhelníku?\n(ANO/NE)`,ans:'NE',hints:[`Střed leží NA přeponě (na straně trojúhelníku), ne uvnitř.`],skill:'geo'};})(),
  (()=>{const c=ri(6,14);return{text:`Přepona = ${c} cm. Jak daleko je vrchol pravého\núhlu od středu Thaletovy kružnice? (cm)`,ans:cz(c/2),hints:[`Vzdálenost = poloměr = přepona : 2.`],skill:'geo'};})()
 ],
 '6-3': () => [   // Osy a souměrnosti
  (()=>{return{text:`Kolik os souměrnosti má čtverec?`,ans:'4',hints:[`2 úhlopříčky + 2 střední.`],skill:'geo'};})(),
  (()=>{return{text:`Kolik os souměrnosti má obdélník\n(který není čtverec)?`,ans:'2',hints:[`Dvě střední osy.`],skill:'geo'};})(),
  (()=>{return{text:`Kolik os souměrnosti má rovnostranný\ntrojúhelník?`,ans:'3',hints:[`Z každého vrcholu jedna.`],skill:'geo'};})(),
  (()=>{return{text:`Má rovnoběžník (kosodélník) osu\nsouměrnosti?\n(ANO/NE)`,ans:'NE',hints:[`Má jen středovou souměrnost.`],skill:'geo'};})(),
  (()=>{return{text:`Kolik os souměrnosti má pravidelný\npětiúhelník?`,ans:'5',hints:[`Pravidelný n-úhelník má n os.`],skill:'geo'};})(),
  (()=>{return{text:`Je střed úsečky jejím středem\nsouměrnosti?\n(ANO/NE)`,ans:'ANO',hints:[`Úsečka je středově souměrná podle svého středu.`],skill:'geo'};})(),
  (()=>{const sh=[['čtverec',4],['obdélník (není čtverec)',2],['rovnostranný trojúhelník',3],['kosočtverec',2],['pravidelný pětiúhelník',5],['pravidelný šestiúhelník',6]][ri(0,5)];return{text:`Kolik os souměrnosti má ${sh[0]}?`,ans:String(sh[1]),hints:[`Osa souměrnosti rozdělí útvar na dvě zrcadlové poloviny.`],skill:'geo'};})(),
  (()=>{return{text:`Má trojúhelník s různě dlouhými stranami\nosu souměrnosti?\n(ANO/NE)`,ans:'NE',hints:[`Skalény trojúhelník nemá osu souměrnosti.`],skill:'geo'};})(),
  (()=>{return{text:`Kolik os souměrnosti má pravidelný\nšestiúhelník?`,ans:'6',hints:[`Pravidelný n-úhelník má n os.`],skill:'geo'};})(),
  (()=>{return{text:`Obraz bodu při osové souměrnosti leží\nna přímce kolmé k ose v téže vzdálenosti.\nPlatí to?\n(ANO/NE)`,ans:'ANO',hints:[`To je definice osové souměrnosti.`],skill:'geo'};})()
 ],

 // ───────── OBLAST 7 — FINÁLE ─────────
 '7-1': () => [   // Zkouška ohněm (mix)
  (()=>{const z=ri(2,8)*100,p=ri(1,4)*5;return{text:`${p} % z ${z} =`,ans:String(Math.round(z*p/100)),hints:[`${z} × ${p} : 100.`],skill:'anal'};})(),
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Odvěsny ${t[0]} a ${t[1]}, přepona?`,ans:String(t[2]),hints:[`Pythagoras.`],skill:'geo'};})(),
  (()=>{const x=ri(3,12),a=ri(2,6),b=ri(2,12);return{text:`${a}x + ${b} = ${a*x+b}, x = ?`,ans:String(x),hints:[`Odečti ${b}, vyděl ${a}.`],skill:'anal'};})(),
  (()=>{const r=ri(2,7);return{text:`Obsah kruhu o poloměru ${r}? (π = 3,14)`,ans:r2(PI*r*r),hints:[`πr².`],skill:'geo'};})(),
  (()=>{const a=ri(3,9),b=ri(2,a-1);return{text:`(${a} + ${b})(${a} - ${b}) =`,ans:String(a*a-b*b),hints:[`a² - b².`],skill:'calc'};})(),
  (()=>{const a=ri(11,20);return{text:`${a}² =`,ans:String(a*a),hints:[`${a} × ${a}.`],skill:'calc'};})(),
  (()=>{const r=ri(2,6),h=ri(4,10);return{text:`Objem válce r = ${r}, h = ${h}? (π = 3,14)`,ans:r2(PI*r*r*h),hints:[`πr²h.`],skill:'geo'};})(),
  (()=>{const a=ri(2,6),b=ri(2,6);return{text:`NSD(${a*2},${b*3},${Math.min(a,b)*6})?`,ans:String(gcd(gcd(a*2,b*3),Math.min(a,b)*6)),hints:[`Rozlož každé číslo na prvočísla.`],skill:'calc'};})(),
  (()=>{const x=ri(2,8),a=ri(3,7);return{text:`Dosaď x = ${x} do ${a}x²:`,ans:String(a*x*x),hints:[`${a} × ${x*x}.`],skill:'calc'};})(),
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Přepona ${t[2]}, jedna odvěsna ${t[0]}.\nDruhá odvěsna?`,ans:String(t[1]),hints:[`b² = c² - a².`],skill:'geo'};})(),
  (()=>{const b=ri(3,9),c=ri(3,9);return{text:`Student získal na akademii ${b} ${skl(b,'bod','body','bodů')} za teorii a ${c} ${skl(c,'bod','body','bodů')} za praxi.\nKolik bodů má celkem?`,ans:String(b+c),hints:[`${b} + ${c}.`],skill:'anal'};})(),
  (()=>{const per=ri(2,4),t=ri(2,5),tot=per*t;return{text:`Na akademii ${skl(t,'pracuje','pracují','pracuje')} ${t} ${skl(t,'tým','týmy','týmů')}, každý odevzdá ${per} ${skl(per,'projekt','projekty','projektů')}.\nKolik projektů se sejde celkem?`,ans:String(tot),hints:[`${t} × ${per}.`],skill:'anal'};})()
 ],
 '7-2': () => [   // Přijímačkový trénink (CERMAT-style)
  (()=>{const cena=ri(3,9)*100,p=ri(2,4)*10;const sl=Math.round(cena*p/100);return{text:`Kolo stálo ${cena} Kč, zlevnili o ${p} %.\nO kolik Kč se snížila cena?`,ans:String(sl),hints:[`${p} % z ${cena}.`],skill:'anal'};})(),
  (()=>{const r=ri(10,30);const o=2*PI*r;return{text:`Kolo o poloměru ${r} cm.\nKolik cm ujede za 1 otáčku? (π = 3,14)`,ans:r2(o),hints:[`Obvod = 2πr.`],skill:'geo'};})(),
  (()=>{const a=ri(30,60),b=ri(20,50);const c=Math.sqrt(a*a+b*b);return{text:`Obdélníkové hřiště ${a} × ${b} m.\nDélka úhlopříčky? (2 des. místa)`,ans:r2(c),hints:[`√(${a}² + ${b}²).`],skill:'geo'};})(),
  (()=>{const lidi=ri(4,9)*5,p=ri(2,8)*5;return{text:`Ve třídě je ${lidi} žáků, ${p} % jsou dívky.\nKolik je dívek?`,ans:String(Math.round(lidi*p/100)),hints:[`${p} % z ${lidi}.`],skill:'anal'};})(),
  (()=>{const km=ri(60,120),h=ri(2,4);return{text:`Auto ujelo ${km*h} km za ${h} h.\nPrůměrná rychlost? (km/h)`,ans:String(km),hints:[`Dráha : čas.`,`${km*h} : ${h}`],skill:'anal'};})(),
  (()=>{const cel=ri(4,9)*3,t=cel/3;return{text:`Třetina žáků (${t}) odešla.\nKolik žáků bylo původně, je-li to třetina?`,ans:String(cel),hints:[`Třetina = ${t}, celek = 3×.`],skill:'anal'};})(),
  (()=>{const x=ri(3,10),a=ri(2,5),b=ri(2,8);return{text:`Rovnice: ${a}(x + ${b}) = ${a*(x+b)}\nx = ?`,ans:String(x),hints:[`Vyděl ${a}: x + ${b} = ${x+b}.`],skill:'anal'};})(),
  (()=>{const r=ri(2,5),h=ri(5,12);return{text:`Válec: r = ${r} cm, výška ${h} cm.\nObjem? (cm³, π = 3,14)`,ans:r2(PI*r*r*h),hints:[`V = πr²h.`],skill:'geo'};})(),
  (()=>{const a=ri(5,12),b=ri(3,a-1);return{text:`Přepona ${a}, jedna odvěsna ${b}.\nDruhá odvěsna? (2 des. místa)`,ans:r2(Math.sqrt(a*a-b*b)),hints:[`√(${a*a}-${b*b}).`],skill:'geo'};})(),
  (()=>{const z=ri(2,10)*100,p=ri(1,4)*5;const nov=z+z*p/100;return{text:`Vklad ${z} Kč, úroková sazba ${p} %.\nZůstatek po roce? (Kč)`,ans:String(nov),hints:[`Úrok = ${z*p/100} Kč.`],skill:'anal'};})(),
  (()=>{const n=ri(3,6),m=ri(2,9)*10;return{text:`Na akademickém dni ${skl(n,'proběhne','proběhnou','proběhne')} ${n} ${skl(n,'přednáška','přednášky','přednášek')}, každá trvá ${m} minut.\nKolik minut trvají dohromady?`,ans:String(n*m),hints:[`${n} × ${m}.`],skill:'anal'};})(),
  (()=>{const st=ri(3,8),c=ri(3,9)*10;return{text:`Na kurz ${skl(st,'se přihlásil','se přihlásili','se přihlásilo')} ${st} ${skl(st,'student','studenti','studentů')}, každý zaplatil ${c} Kč.\nKolik Kč se vybralo?`,ans:String(st*c),hints:[`${st} × ${c}.`],skill:'anal'};})()
 ],
 '7-3': () => [   // Finální duel (MC, jen numerické)
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Přepona ${t[2]}, odvěsna ${t[0]}.\nDruhá odvěsna?`,ans:String(t[1]),distractors:[String(t[2]-t[0])],hints:[`b² = c² - a².`],skill:'geo'};})(),
  (()=>{const r=ri(2,8);return{text:`Objem válce r = ${r}, výška ${r}? (π = 3,14)`,ans:r2(PI*r*r*r),distractors:[r2(PI*r*r)],hints:[`πr²·r.`],skill:'geo'};})(),
  (()=>{const x=ri(3,10),a=ri(2,5),b=ri(2,5);return{text:`${a}(x + ${b}) = ${a*(x+b)}, x = ?`,ans:String(x),distractors:[String(x+b)],hints:[`Vyděl ${a}, odečti ${b}.`],skill:'anal'};})(),
  (()=>{const a=ri(6,12),b=ri(2,a-1);return{text:`${rp(FC)}:\n(${a} - ${b})² =`,ans:String((a-b)**2),distractors:[String(a*a-b*b)],hints:[`a² - 2ab + b².`],skill:'calc'};})(),
  (()=>{const z=ri(3,9)*100,p=ri(2,5)*10;return{text:`Cena ${z} Kč vzrostla o ${p} %. Nová cena? (Kč)`,ans:String(z+Math.round(z*p/100)),distractors:[String(Math.round(z*p/100))],hints:[`+ ${p} % z ${z}.`],skill:'anal'};})(),
  (()=>{const a=ri(13,20);return{text:`${rp(FC)}:\n√${a*a} =`,ans:String(a),distractors:[String(a*a)],hints:[`Odmocnina z ${a*a}.`],skill:'calc'};})(),
  (()=>{const r=ri(3,7);return{text:`Obsah kruhu r = ${r}? (π = 3,14)`,ans:r2(PI*r*r),distractors:[r2(2*PI*r)],hints:[`πr² = 3,14 × ${r*r}.`],skill:'geo'};})(),
  (()=>{const x=ri(2,10),a=ri(2,5);return{text:`${rp(['Dosaď','Vyčísli pro'])} x = ${x}: ${a}x + ${a} =`,ans:String(a*x+a),distractors:[String(a*x)],hints:[`${a}·${x} + ${a}.`],skill:'calc'};})(),
  (()=>{const a=ri(2,8);return{text:`${rp(FC)}:\n${a}² + ${a} =`,ans:String(a*a+a),distractors:(a*a+a!==3*a?[String(3*a)]:[]),hints:[`${a*a} + ${a}.`],skill:'calc'};})(),
  (()=>{const t=PYT[ri(0,PYT.length-1)];return{text:`Odvěsny ${t[0]} a ${t[1]}. Přepona?`,ans:String(t[2]),distractors:[String(t[0]+t[1])],hints:[`c² = ${t[0]*t[0]} + ${t[1]*t[1]}.`],skill:'geo'};})()
 ]
};
})();
