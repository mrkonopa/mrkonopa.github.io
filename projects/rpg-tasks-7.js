// Rozšiřující banka úloh pro rpg-mat-7.html — Ztracený chrám ⛏️
// window.RPG_TASK_EXTRA_7 = { '<mid>': () => [task, ...], ... }
(function(){
'use strict';
const ri = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}
const skl = (n,one,few,many)=>n===1?one:(n>=2&&n<=4?few:many);
const cz = n => String(n).replace('.',',');
const r1 = n => cz(Math.round(n*10)/10);
const r2 = n => cz(Math.round(n*100)/100);
const pick = a => a[Math.floor(Math.random()*a.length)];
// FRAMING POOL — mění jen sloveso výzvy, ne odpověď (bezpečné i pro MC)
const askCalc = e => pick([`Vypočítej ${e} = ?`,`Spočítej ${e} = ?`,`Urči hodnotu výrazu ${e}.`,`Kolik je ${e}?`]);
const fq = e => pick(['Vypočítej','Spočítej','Urči hodnotu'])+`: ${e}`;
const mem = e => pick([`Vypočítej zpaměti: ${e} = ?`,`Spočítej z hlavy: ${e} = ?`,`Urči zpaměti hodnotu ${e}.`,`Kolik je ${e}?`]);
// PHRASING POOL pro slovní úlohy (jen NE-MC) — mění návětí, ne čísla
const ask = q => pick([q,`Vyřeš: ${q}`,`Chrámová hádanka: ${q}`,`Zamysli se: ${q}`]);

// ══════════════════════════════════════════════════════════
// OBLAST 1 — VSTUPNÍ BRÁNA
// ══════════════════════════════════════════════════════════

// 1-1 Počítání zpaměti (MC — jen numerické)
function gen_1_1(){
  const tasks=[];
  // sčítání
  const a=ri(12,49),b=ri(11,38);
  tasks.push({text:mem(`${a} + ${b}`),ans:a+b,hints:[`Zaokrouhlej ${a} na desítky a uprav.`,`${a} + ${b} = ${a+b}`],skill:'calc'});
  // odčítání
  const c=ri(40,90),d=ri(11,c-5);
  tasks.push({text:mem(`${c} − ${d}`),ans:c-d,hints:[`Odečti po částech.`,`${c} − ${d} = ${c-d}`],skill:'calc'});
  // násobení
  const e=ri(4,9),f=ri(6,12);
  tasks.push({text:mem(`${e} × ${f}`),ans:e*f,hints:[`Rozlož ${f} = ${Math.floor(f/2)} + ${f-Math.floor(f/2)}.`,`${e} × ${f} = ${e*f}`],skill:'calc'});
  // dělení
  const g=ri(3,9),h=g*ri(4,12);
  tasks.push({text:mem(`${h} : ${g}`),ans:h/g,hints:[`Kolikrát se vejde ${g} do ${h}?`,`${h} : ${g} = ${h/g}`],skill:'calc'});
  // mix
  const i=ri(5,15),j=ri(3,8);
  tasks.push({text:mem(`${i} × ${j} − ${j}`),ans:i*j-j,hints:[`Vytknout ${j}: ${j}·(${i}−1).`,`${j}·${i-1} = ${i*j-j}`],skill:'calc'});
  const k=ri(20,50),l=ri(5,10);
  tasks.push({text:mem(`${k} + ${l} × ${l}`),ans:k+l*l,hints:[`Nejdřív ${l}×${l} = ${l*l}, pak přičti.`,`${k} + ${l*l} = ${k+l*l}`],skill:'calc'});
  { const a=ri(120,480),b=ri(110,360); tasks.push({text:askCalc(`${a} + ${b}`),ans:a+b,hints:['Sčítej po řádech (jednotky, desítky, stovky).',`${a}+${b} = ${a+b}`],skill:'calc'}); }
  { const a=ri(13,29),b=ri(13,29); tasks.push({text:askCalc(`${a} × ${b}`),ans:a*b,hints:[`Rozlož ${b} na desítky a jednotky.`,`${a}×${b} = ${a*b}`],skill:'calc'}); }
  { const g=ri(4,9),h=g*ri(11,30); tasks.push({text:askCalc(`${h} : ${g}`),ans:h/g,hints:[`Kolikrát se ${g} vejde do ${h}?`,`${h}:${g} = ${h/g}`],skill:'calc'}); }
  { const a=ri(2,9),b=ri(2,9),c=ri(2,9); tasks.push({text:askCalc(`${a} × ${b} + ${c}`),ans:a*b+c,hints:['Nejdřív násobení, pak sčítání.',`${a*b}+${c} = ${a*b+c}`],skill:'calc'}); }
  // thematické (numerické — MC-safe)
  { const s=ri(6,18),v=ri(3,12); tasks.push({text:`Ve vstupní síni chrámu hoří ${s} ${skl(s,'pochodeň','pochodně','pochodní')}, průzkumník zapálí dalších ${v}. Kolik ${skl(s+v,'pochodeň','pochodně','pochodní')} teď svítí?`,ans:s+v,hints:['Sečti oba počty.',`${s} + ${v} = ${s+v}`],skill:'calc'}); }
  { const rows=ri(3,8),perRow=ri(3,7); tasks.push({text:`Síň sloupů má ${rows} ${skl(rows,'řadu','řady','řad')}, v každé ${perRow} ${skl(perRow,'sloup','sloupy','sloupů')}. Kolik ${skl(rows*perRow,'sloup','sloupy','sloupů')} tu stojí celkem?`,ans:rows*perRow,hints:['Počet řad × počet ve řadě.',`${rows} × ${perRow} = ${rows*perRow}`],skill:'calc'}); }
  return tasks;
}

// 1-2 Desetinná čísla (+−×:)
function gen_1_2(){
  const T=[
    ()=>{const a=ri(11,50)/10,b=ri(5,30)/10;return{text:`Sečti desetinná čísla ${cz(a)} + ${cz(b)} = ?`,ans:r1(a+b),h1:'Napiš čísla pod sebe, desetinnou čárku pod čárku.',h2:`= ${r1(a+b)}`};},
    ()=>{const c=ri(30,80)/10,d=ri(5,25)/10;return{text:`Odečti desetinná čísla ${cz(c)} − ${cz(d)} = ?`,ans:r1(c-d),h1:'Zarovnej desetinné čárky pod sebe a odečítej.',h2:`= ${r1(c-d)}`};},
    ()=>{const e=ri(2,9),f=ri(11,49)/10;return{text:`Vynásob ${e} × ${cz(f)} = ?`,ans:r2(e*f),h1:`Násob jako celá čísla (${e} × ${Math.round(f*10)}), pak doplň jedno desetinné místo.`,h2:`= ${r2(e*f)}`};},
    ()=>{const h=ri(2,5),g=Math.round(ri(11,49)/10*h*10)/10;return{text:`Vyděl ${cz(g)} : ${h} = ?`,ans:r2(g/h),h1:'Děl jako celá čísla a čárku napiš nad čárku dělence.',h2:`= ${r2(g/h)}`};},
    ()=>{const i=ri(11,30)/10,j=ri(11,30)/10;return{text:`Vynásob dvě desetinná čísla ${cz(i)} × ${cz(j)} = ?`,ans:r2(i*j),h1:`Spočítej ${Math.round(i*10)} × ${Math.round(j*10)} a vyděl 100 (dvě desetinná místa).`,h2:`= ${r2(i*j)}`};},
    ()=>{const k=ri(15,60)/10,l=ri(10,30)/10;return{text:`Nakoupil jsi dvě věci za ${cz(k)} Kč a ${cz(l)} Kč. Kolik jsi zaplatil celkem?`,ans:r1(k+l),h1:'Sečti obě ceny.',h2:`= ${r1(k+l)} Kč`};},
    ()=>{const a=ri(10,99)/100;return{text:`Zaokrouhli číslo ${cz(a)} na desetiny.`,ans:r1(a),h1:'Rozhoduje číslice setin (druhá za čárkou).',h2:`≈ ${r1(a)}`};},
    ()=>{const a=ri(50,90)/10,b=ri(11,40)/10;return{text:`O kolik je číslo ${cz(a)} větší než ${cz(b)}?`,ans:r1(a-b),h1:'Rozdíl zjistíš odčítáním.',h2:`= ${r1(a-b)}`};},
    ()=>{const a=ri(21,60)/10;return{text:`Jaká je polovina čísla ${cz(a)}?`,ans:r2(a/2),h1:'Vyděl dvěma.',h2:`= ${r2(a/2)}`};},
    ()=>{const a=ri(11,49)/10;return{text:`Vynásob číslo ${cz(a)} deseti.`,ans:r1(a*10),h1:'Posuň desetinnou čárku o jedno místo doprava.',h2:`= ${r1(a*10)}`};},
    ()=>{const a=ri(20,50)/10,b=ri(10,25)/10,c=ri(10,25)/10;return{text:`Sečti tři desetinná čísla ${cz(a)} + ${cz(b)} + ${cz(c)} = ?`,ans:r1(a+b+c),h1:'Sčítej postupně, čárky pod sebe.',h2:`= ${r1(a+b+c)}`};},
    ()=>{const a=ri(30,90)/10;const ok=ri(0,1)===0;const tvrz=ok?r1(a*2):r1(a*2+0.1);const spravne=tvrz===r1(a*2);return{text:`Je dvojnásobek čísla ${cz(a)} roven ${cz(tvrz)}?`,ans:spravne?'ANO':'NE',h1:'Spočítej 2 × dané číslo.',h2:spravne?'ANO':'NE'};},
    ()=>{const a=ri(15,45)/10,b=ri(15,45)/10;return{text:ask(`Dvě kamenné ${skl(2,'truhlice','truhlice','truhlic')} váží ${cz(a)} kg a ${cz(b)} kg. Kolik váží dohromady?`),ans:r1(a+b),h1:'Sečti obě hmotnosti.',h2:`= ${r1(a+b)} kg`};},
    ()=>{const cel=ri(40,90)/10,ub=ri(11,30)/10;return{text:ask(`Svitek byl dlouhý ${cz(cel)} m, ${cz(ub)} m se ukroutilo. Kolik metrů zbylo?`),ans:r1(cel-ub),h1:'Odečti ukroucenou část.',h2:`= ${r1(cel-ub)} m`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// 1-3 Obvod a obsah (obdélník, čtverec, trojúhelník)
function gen_1_3(){
  const tasks=[];
  // obvod obdélníku
  const a=ri(4,15), b=ri(2,a-1);
  tasks.push({text:`Obdélník má strany ${a} cm a ${b} cm. Jaký je jeho obvod?`,ans:2*(a+b),hints:['Obvod = 2·(a + b).',`2·(${a}+${b}) = ${2*(a+b)} cm`],skill:'geo'});
  // obsah obdélníku
  const c=ri(3,14), d=ri(3,12);
  tasks.push({text:`Obdélník má strany ${c} cm a ${d} cm. Jaký je jeho obsah?`,ans:c*d,hints:['S = a · b',`S = ${c}·${d} = ${c*d} cm²`],skill:'geo'});
  // obvod čtverce
  const e=ri(3,12);
  tasks.push({text:`Čtverec má stranu ${e} cm. Jaký je jeho obvod?`,ans:4*e,hints:['Obvod čtverce = 4·a.',`4·${e} = ${4*e} cm`],skill:'geo'});
  // obsah čtverce
  const f=ri(3,12);
  tasks.push({text:`Čtverec má stranu ${f} cm. Jaký je jeho obsah?`,ans:f*f,hints:['S = a²',`S = ${f}² = ${f*f} cm²`],skill:'geo'});
  // obsah pravoúhlého trojúhelníku
  const g=ri(4,12), h=ri(3,10);
  tasks.push({text:`Pravoúhlý trojúhelník má odvěsny ${g} cm a ${h} cm. Jaký je jeho obsah?`,ans:r1(g*h/2),hints:['S = (a·v)/2, kde a a v jsou odvěsny (kolmice).','S = '+g+'·'+h+'/2 = '+r1(g*h/2)+' cm²'],skill:'geo'});
  // obvod trojúhelníku
  const i=ri(5,12),j=ri(4,11),k=ri(3,i+j-1);
  tasks.push({text:`Trojúhelník má strany ${i} cm, ${j} cm a ${k} cm. Jaký je jeho obvod?`,ans:i+j+k,hints:['Obvod trojúhelníku = součet všech tří stran.',`${i}+${j}+${k} = ${i+j+k} cm`],skill:'geo'});
  { const a=ri(4,14),b=ri(2,a-1); tasks.push({text:`Obdélník ${a} × ${b} cm. Jaký je obvod?`,ans:2*(a+b),hints:['o = 2·(a+b).',`= ${2*(a+b)} cm`],skill:'geo'}); }
  { const a=ri(3,12); tasks.push({text:`Čtverec se stranou ${a} cm. Jaký je obsah?`,ans:a*a,hints:['S = a².',`= ${a*a} cm²`],skill:'geo'}); }
  { const a=ri(4,12),h=ri(3,10); tasks.push({text:`Pravoúhlý trojúhelník s odvěsnami ${a} a ${h} cm. Obsah?`,ans:r1(a*h/2),hints:['S = (a·v)/2.',`= ${r1(a*h/2)} cm²`],skill:'geo'}); }
  { const a=ri(5,12),b=ri(4,11),c=ri(3,a+b-1); tasks.push({text:`Trojúhelník ${a}, ${b}, ${c} cm. Obvod?`,ans:a+b+c,hints:['Součet všech tří stran.',`= ${a+b+c} cm`],skill:'geo'}); }
  // thematické
  { const a=ri(4,12),b=ri(3,a); tasks.push({text:`Obětní oltář má obdélníkovou desku ${a} m × ${b} m. Kolik metrů zdobené šňůry potřebuješ na její obvod?`,ans:2*(a+b),hints:['o = 2·(a + b).',`2·(${a}+${b}) = ${2*(a+b)} m`],skill:'geo'}); }
  { const a=ri(3,10); tasks.push({text:`Podlaha svatyně je čtverec o straně ${a} m. Kolik ${skl(a*a,'dlaždice','dlaždice','dlaždic')} o rozměru 1 m² ji pokryje?`,ans:a*a,hints:['S = a² a jedna dlaždice = 1 m².',`${a}² = ${a*a} dlaždic`],skill:'geo'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 2 — SÍŇ ZLOMKŮ
// ══════════════════════════════════════════════════════════

// 2-1 Krácení a rozšiřování (MC — numerické)
function gen_2_1(){
  const T=[
    ()=>{const a=ri(2,6),x=ri(2,4),b=ri(2,5);const top=a*x,bot=b*x;const g=gcd(top,bot);return{text:`Zkrať zlomek ${top}/${bot} na základní tvar. Jaký je jeho ČITATEL?`,ans:top/g,h1:`Vyděl čitatele i jmenovatele jejich největším společným dělitelem (NSD = ${g}).`,h2:`= ${top/g}`};},
    ()=>{const a=ri(2,6),x=ri(2,4),b=ri(2,5);const top=a*x,bot=b*x;const g=gcd(top,bot);return{text:`Zkrať zlomek ${top}/${bot} na základní tvar. Jaký je jeho JMENOVATEL?`,ans:bot/g,h1:`Vyděl oba členy jejich NSD (${g}).`,h2:`= ${bot/g}`};},
    ()=>{const a=ri(2,6),k=ri(2,5);return{text:`Zkrať zlomek ${a*k}/${k} na celé číslo.`,ans:a,h1:`Jmenovatel ${k} se ve zlomku zkrátí.`,h2:`= ${a}`};},
    ()=>{const c=ri(2,7),d=ri(2,6),k=ri(2,5);return{text:`Rozšiř zlomek ${c}/${d} číslem ${k}. Jaký bude nový ČITATEL?`,ans:c*k,h1:'Rozšíření = násobit čitatele i jmenovatele stejným číslem.',h2:`${c} × ${k} = ${c*k}`};},
    ()=>{const c=ri(2,7),d=ri(2,6),k=ri(2,5);return{text:`Rozšiř zlomek ${c}/${d} číslem ${k}. Jaký bude nový JMENOVATEL?`,ans:d*k,h1:'Jmenovatel vynásob rozšiřujícím číslem.',h2:`${d} × ${k} = ${d*k}`};},
    ()=>{const e=ri(2,5),f=ri(3,8);return{text:`Je zlomek ${e*2}/${f*2} roven zlomku ${e}/${f}?`,ans:'ANO',h1:`Zkrať levý zlomek dvěma.`,h2:'ANO'};},
    ()=>{const e=ri(2,5),f=ri(3,8);const k=ri(2,4);return{text:`Je zlomek ${e*k}/${f*k} roven zlomku ${e+1}/${f}?`,ans:'NE',h1:`Zkrácený levý zlomek je ${e}/${f}, ne ${e+1}/${f}.`,h2:'NE'};},
    ()=>{const d=ri(2,6),k=ri(2,5);return{text:`Na jaké číslo musíš rozšířit jmenovatel zlomku s jmenovatelem ${d}, aby byl ${d*k}?`,ans:k,h1:`Kolikrát se ${d} vejde do ${d*k}?`,h2:`= ${k}`};},
    ()=>{const a=ri(2,5),k=ri(2,4);const top=a*k;return{text:`Zlomek ${top}/${a*k*2} zkrať na základní tvar. Jaký je čitatel? (obě čísla dělitelná ${a*k})`,ans:1,h1:`Vyděl oba členy NSD.`,h2:`= 1`};},
    ()=>{const base=ri(2,5),d=ri(3,7);const zaklad=`${base}/${d}`;return{text:`Je zlomek ${base}/${d} v základním (nezkrátitelném) tvaru? (NSD čitatele a jmenovatele = 1)`,ans:gcd(base,d)===1?'ANO':'NE',h1:`Zjisti NSD(${base}, ${d}).`,h2:gcd(base,d)===1?'ANO':'NE'};},
    ()=>{const a=ri(2,4),b=ri(2,4),k=ri(2,5);return{text:`Zlomek ${a}/${b} rozšiř tak, aby čitatel byl ${a*k}. Jaký bude jmenovatel?`,ans:b*k,h1:`Čitatel se násobil ${k}× (${a}→${a*k}), stejně násob jmenovatel.`,h2:`${b} × ${k} = ${b*k}`};},
    ()=>{const base=ri(2,5),x=ri(2,4),d=ri(2,5);const top=base*x,bot=d*x;const g=gcd(top,bot);return{text:`Na svitku je ${top} run z ${bot} políček. Zkrať poměr ${top}/${bot} na základní tvar — jaký je ČITATEL?`,ans:top/g,h1:`Vyděl oba členy jejich NSD (${g}).`,h2:`= ${top/g}`};},
    ()=>{const a=ri(2,6),k=ri(2,5);return{text:`${a*k} ${skl(a*k,'schod','schody','schodů')} rozdělíš do ${k} stejných úseků. Kolik schodů má jeden úsek?`,ans:a,h1:`Vyděl počet schodů počtem úseků.`,h2:`${a*k} : ${k} = ${a}`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// 2-2 Sčítání a odčítání zlomků (různé jmenovatele)
function gen_2_2(){
  const lcm=(a,b)=>a/gcd(a,b)*b;
  const asFrac=(num,den)=>{const g=gcd(Math.abs(num),den);return num===0?'0':(g===den?String(num/g):`${num/g}/${den/g}`);};
  const T=[
    ()=>{const a=ri(2,5),b=ri(2,6);const L=lcm(a,b);const p=ri(1,a-1)||1,q=ri(1,b-1)||1;const num=p*(L/a)+q*(L/b);return{text:`Sečti zlomky ${p}/${a} + ${q}/${b} = ?`,ans:asFrac(num,L),h1:`Převeď na společného jmenovatele ${L}.`,h2:`${p*(L/a)}/${L} + ${q*(L/b)}/${L} = ${num}/${L}`};},
    ()=>{const c=ri(3,8),d=ri(2,c-1);const L=lcm(c,d);const r=ri(2,c-1),s=ri(1,d-1)||1;const num=r*(L/c)-s*(L/d);return{text:`Odečti zlomky ${r}/${c} − ${s}/${d} = ?`,ans:asFrac(num,L),h1:`Společný jmenovatel je ${L}.`,h2:`${r*(L/c)}/${L} − ${s*(L/d)}/${L} = ${num}/${L}`};},
    ()=>{const w=ri(1,4),v=ri(2,7),u=ri(1,v-1);const num=w*v+u;return{text:`Sečti celé číslo se zlomkem: ${w} + ${u}/${v} = ?`,ans:asFrac(num,v),h1:`Přepočti ${w} jako ${w*v}/${v}.`,h2:`${w*v}/${v} + ${u}/${v} = ${num}/${v}`};},
    ()=>{const x=ri(2,5),y=ri(3,8),z=ri(1,y-1);const num=x*y-z;return{text:`Odečti zlomek od celého čísla: ${x} − ${z}/${y} = ?`,ans:asFrac(num,y),h1:`Přepočti ${x} jako ${x*y}/${y}.`,h2:`${x*y}/${y} − ${z}/${y} = ${num}/${y}`};},
    ()=>{const n=ri(3,7),o=ri(2,n-1);const num=1*n+o;return{text:`Přepočti smíšené číslo 1 ${o}/${n} na zlomek. Jaký je jeho ČITATEL?`,ans:num,h1:'Celá část × jmenovatel + čitatel.',h2:`1·${n} + ${o} = ${num}`};},
    ()=>{const f1n=ri(2,5),f1d=ri(3,8),f2n=ri(2,5),f2d=ri(3,8);const gt=f1n/f1d>f2n/f2d;return{text:`Je zlomek ${f1n}/${f1d} větší než ${f2n}/${f2d}?`,ans:gt?'ANO':'NE',h1:'Převeď na společného jmenovatele nebo porovnej desetinnou hodnotu.',h2:gt?'ANO':'NE'};},
    ()=>{const a=ri(2,5),b=ri(3,7);const L=lcm(a,b);const num=(L/a)+(L/b);return{text:`Kolik je 1/${a} + 1/${b}? (zapiš jako zlomek)`,ans:asFrac(num,L),h1:`Společný jmenovatel = ${L}.`,h2:`${L/a}/${L} + ${L/b}/${L} = ${num}/${L}`};},
    ()=>{const d=ri(3,8),a=ri(1,d-1);const num=d-a;return{text:`Kolik chybí zlomku ${a}/${d} do celku (1)? Zapiš jako zlomek.`,ans:asFrac(num,d),h1:`Celek je ${d}/${d}. Odečti ${a}/${d}.`,h2:`${num}/${d}`};},
    ()=>{const a=ri(2,4),b=2*a;const num=(b/a)+1;return{text:`Sečti zlomky s násobným jmenovatelem: 1/${a} + 1/${b} = ? (${b} je násobek ${a})`,ans:asFrac(num,b),h1:`Stačí rozšířit první zlomek na jmenovatele ${b}.`,h2:`${b/a}/${b} + 1/${b} = ${num}/${b}`};},
    ()=>{const c=ri(3,7),num1=ri(1,c-1),num2=ri(1,c-num1);const s=num1+num2;const isWhole=s===c;return{text:`Dají zlomky ${num1}/${c} + ${num2}/${c} dohromady jeden celek?`,ans:isWhole?'ANO':'NE',h1:`Celek je ${c}/${c}. Je ${num1}+${num2} rovno ${c}?`,h2:isWhole?'ANO':'NE'};},
    ()=>{const a=ri(3,6),b=ri(2,a-1);const L=lcm(a,b);const num=(L/b)-(L/a);return{text:`O kolik je zlomek 1/${b} větší než 1/${a}? (zapiš jako zlomek)`,ans:asFrac(num,L),h1:`Společný jmenovatel ${L}; menší jmenovatel = větší zlomek.`,h2:`${L/b}/${L} − ${L/a}/${L} = ${num}/${L}`};},
    ()=>{const a=ri(2,5),b=ri(2,6);const L=lcm(a,b);const p=ri(1,a-1)||1,q=ri(1,b-1)||1;const num=p*(L/a)+q*(L/b);return{text:`Průzkumník prošel ${p}/${a} temné chodby a pak ještě ${q}/${b}. Jakou část chodby má za sebou? (zlomek)`,ans:asFrac(num,L),h1:`Převeď na společného jmenovatele ${L} a sečti.`,h2:`${num}/${L}`};},
    ()=>{const d=ri(3,8),a=ri(1,d-1);const num=d-a;return{text:`Z truhlice bylo ${a}/${d} zlata vybráno. Jaká část zlata v truhlici zbyla? (zlomek)`,ans:asFrac(num,d),h1:`Celek je ${d}/${d}, odečti ${a}/${d}.`,h2:`${num}/${d}`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// 2-3 Násobení a dělení zlomků
function gen_2_3(){
  const asFrac=(num,den)=>{const g=gcd(Math.abs(num),den);return num===0?'0':(g===den?String(num/g):`${num/g}/${den/g}`);};
  const T=[
    ()=>{const a=ri(2,5),b=ri(3,8),c=ri(2,5),d=ri(3,8);return{text:`Vynásob zlomky ${a}/${b} × ${c}/${d} = ?`,ans:asFrac(a*c,b*d),h1:'Čitatel krát čitatel, jmenovatel krát jmenovatel.',h2:`${a*c}/${b*d}, pak zkrať`};},
    ()=>{const e=ri(2,6),f=ri(3,9),w=ri(2,5);return{text:`Vynásob zlomek celým číslem: ${e}/${f} × ${w} = ?`,ans:asFrac(e*w,f),h1:'Celým číslem násob jen čitatele, jmenovatel opiš.',h2:`${e*w}/${f}, pak zkrať`};},
    ()=>{const g=ri(2,5),h=ri(3,8),i=ri(2,5),j=ri(3,8);return{text:`Vyděl zlomky ${g}/${h} : ${i}/${j} = ?`,ans:asFrac(g*j,h*i),h1:'Dělení zlomkem = násobení jeho převrácenou hodnotou.',h2:`${g}/${h} × ${j}/${i} = ${g*j}/${h*i}, pak zkrať`};},
    ()=>{const l=ri(2,5),m=ri(2,6)*l,k=ri(2,l-1)||1;return{text:`Kolik je ${k}/${l} z čísla ${m}?`,ans:(k*m)/l,h1:`Nejdřív ${m} : ${l}, pak výsledek × ${k}.`,h2:`= ${(k*m)/l}`};},
    ()=>{const p=ri(3,8),q=ri(2,p-1);return{text:`Ze šňůry dlouhé ${p} m odříznu ${q}/${p} její délky. Kolik metrů jsem odřízl?`,ans:q,h1:`${q}/${p} z ${p} m: vyděl ${p} jmenovatelem a vynásob ${q}.`,h2:`= ${q} m`};},
    ()=>{const a=ri(2,5),b=ri(3,8);return{text:`Vynásob zlomek jeho převrácenou hodnotou: ${a}/${b} × ${b}/${a} = ?`,ans:'1',h1:'Číslo krát jeho převrácená hodnota dává vždy jednu.',h2:'= 1'};},
    ()=>{const a=ri(2,6),b=ri(3,8),k=ri(2,4);return{text:`Vyděl celé číslo zlomkem: ${k} : ${b}/${a} = ?`,ans:asFrac(k*a,b),h1:'Vynásob číslo převrácenou hodnotou zlomku.',h2:`${k} × ${a}/${b} = ${k*a}/${b}, pak zkrať`};},
    ()=>{const a=ri(2,5),b=ri(2,a);return{text:`Jaká je převrácená hodnota zlomku ${a}/${b}? (zapiš jako zlomek)`,ans:`${b}/${a}`,h1:'Prohoď čitatele a jmenovatele.',h2:`${b}/${a}`};},
    ()=>{const a=ri(2,5),b=ri(3,8);return{text:`Umocni zlomek na druhou: (${a}/${b})² = ? (zapiš jako zlomek)`,ans:asFrac(a*a,b*b),h1:'Umocni zvlášť čitatele a zvlášť jmenovatele.',h2:`${a*a}/${b*b}`};},
    ()=>{const half=ri(2,6),num=ri(1,half-1);const c=ri(2,4);return{text:`Kolikrát je zlomek ${num}/${half} menší po vydělení číslem ${c}? Jaký zlomek vyjde z ${num}/${half} : ${c}?`,ans:asFrac(num,half*c),h1:'Dělení celým číslem = násob jmenovatel tímto číslem.',h2:`${num}/${half*c}`};},
    ()=>{const a=ri(2,4),b=ri(3,7);const whole=a*b;return{text:`Kolik ${b}tin je v čísle ${a}? (${a} : (1/${b}))`,ans:whole,h1:`Dělení jednou ${b}tinou = násobit ${b}.`,h2:`${a} × ${b} = ${whole}`};},
    ()=>{const l=ri(2,5),m=ri(2,6)*l,k=ri(1,l-1)||1;return{text:`Pokladnice ukrývá ${m} ${skl(m,'minci','mince','mincí')}. Strážce si vezme ${k}/${l} z nich. Kolik mincí si vzal?`,ans:(k*m)/l,h1:`Nejdřív ${m} : ${l}, pak × ${k}.`,h2:`= ${(k*m)/l}`};},
    ()=>{const a=ri(2,4),b=ri(3,7);const whole=a*b;return{text:`Svitek dělíš na proužky široké 1/${b} m. Kolik proužků nařežeš ze ${a} m svitku?`,ans:whole,h1:`Dělení hodnotou 1/${b} = násobit ${b}.`,h2:`${a} × ${b} = ${whole}`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 3 — PODZEMNÍ MRAZÍRNA
// ══════════════════════════════════════════════════════════

// 3-1 Sčítání a odčítání celých čísel (MC — numerické)
function gen_3_1(){
  const T=[
    ()=>{const a=ri(3,15),b=ri(3,12);return{text:askCalc(`(−${a}) + (−${b})`),ans:-(a+b),h1:'Dvě záporná čísla: sečti jejich velikosti a výsledek je záporný.',h2:`= −${a+b}`};},
    ()=>{const e=ri(5,20),f=ri(3,12);return{text:askCalc(`(−${e}) + ${f}`),ans:f-e,h1:'Různá znaménka: odečti menší velikost od větší, znaménko podle většího.',h2:`${f} − ${e} = ${f-e}`};},
    ()=>{const g=ri(5,20),h=ri(3,12);return{text:askCalc(`${g} − (−${h})`),ans:g+h,h1:'Odečíst záporné číslo znamená přičíst kladné.',h2:`${g} + ${h} = ${g+h}`};},
    ()=>{const i=ri(3,10),j=ri(3,15);return{text:askCalc(`(−${i}) − ${j}`),ans:-(i+j),h1:'Od záporného ještě odčítáš → jdeš dál do záporu.',h2:`= −${i+j}`};},
    ()=>{const a=ri(3,10),b=ri(3,10);return{text:askCalc(`(−${a}) − (−${b})`),ans:b-a,h1:'Odečíst záporné = přičíst kladné: −a + b.',h2:`−${a} + ${b} = ${b-a}`};},
    ()=>{const a=ri(-15,-3),b=ri(-15,-3);const cel=a+b;return{text:`Vypočítej ${a} + (${b}) = ?`,ans:cel,h1:'Dvě záporná čísla se sčítají do většího záporu.',h2:`= ${cel}`};},
    ()=>{const start=ri(-8,-2),step=ri(3,12);return{text:`Teploměr ukazuje ${start} °C a oteplí se o ${step} °C. Kolik °C ukáže?`,ans:start+step,h1:'Oteplení = přičti ke stávající teplotě.',h2:`${start} + ${step} = ${start+step} °C`};},
    ()=>{const start=ri(2,8),drop=ri(5,15);return{text:`Teploměr ukazuje ${start} °C a ochladí se o ${drop} °C. Kolik °C ukáže?`,ans:start-drop,h1:'Ochlazení = odečti od stávající teploty (může jít pod nulu).',h2:`${start} − ${drop} = ${start-drop} °C`};},
    ()=>{const a=ri(3,12),b=ri(3,12);return{text:`Jaká je absolutní hodnota výrazu |−${a} − ${b}|?`,ans:a+b,h1:'Nejdřív spočítej vnitřek (−a − b), pak vezmi jeho vzdálenost od nuly.',h2:`|−${a+b}| = ${a+b}`};},
    ()=>{const a=ri(4,15),b=ri(4,15),c=ri(4,15);return{text:`(−${a}) + ${b} − ${c} = ?`,ans:-a+b-c,h1:'Počítej postupně zleva doprava.',h2:`= ${-a+b-c}`};},
    ()=>{const a=ri(3,12);return{text:`Jaké číslo musíš přičíst k −${a}, abys dostal nulu?`,ans:a,h1:'Hledáš opačné číslo (stejná velikost, opačné znaménko).',h2:`= ${a}`};},
    ()=>{const a=ri(-12,-3);return{text:`Jaké je číslo opačné k číslu ${a}?`,ans:-a,h1:'Opačné číslo má stejnou velikost, ale opačné znaménko.',h2:`= ${-a}`};},
    ()=>{const d=ri(3,12),u=ri(3,15);return{text:`Průzkumník sestoupí ${d} m pod práh chrámu (−${d} m) a pak vystoupá o ${u} m. V jaké výšce (v m) se nachází?`,ans:-d+u,h1:'K záporné hloubce přičti výstup.',h2:`−${d} + ${u} = ${-d+u} m`};},
    ()=>{const a=ri(4,12),b=ri(4,12);return{text:`Jaká je absolutní hodnota výrazu |${a} − ${b}|?`,ans:Math.abs(a-b),h1:'Nejdřív spočítej vnitřek, pak jeho vzdálenost od nuly.',h2:`= ${Math.abs(a-b)}`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// 3-2 Násobení a dělení celých čísel (pravidla znamének)
function gen_3_2(){
  const T=[
    ()=>{const a=ri(2,9),b=ri(2,9);return{text:askCalc(`(−${a}) × ${b}`),ans:-(a*b),h1:'Záporné krát kladné dává záporné.',h2:`= −${a*b}`};},
    ()=>{const c=ri(2,9),d=ri(2,9);return{text:askCalc(`(−${c}) × (−${d})`),ans:c*d,h1:'Záporné krát záporné dává kladné.',h2:`= ${c*d}`};},
    ()=>{const e=ri(2,9),f=ri(2,9);return{text:askCalc(`${e} × (−${f})`),ans:-(e*f),h1:'Kladné krát záporné dává záporné.',h2:`= −${e*f}`};},
    ()=>{const g=ri(2,8),h=g*ri(2,9);return{text:askCalc(`(−${h}) : ${g}`),ans:-(h/g),h1:'Záporné děleno kladným dává záporné.',h2:`= −${h/g}`};},
    ()=>{const i=ri(2,8),j=i*ri(2,9);return{text:askCalc(`(−${j}) : (−${i})`),ans:j/i,h1:'Záporné děleno záporným dává kladné.',h2:`= ${j/i}`};},
    ()=>{const k=ri(2,6),l=ri(2,6),m=ri(2,6);return{text:`(−${k}) × ${l} × (−${m}) = ?`,ans:k*l*m,h1:'Sudý počet záporných činitelů (2) → výsledek kladný.',h2:`= ${k*l*m}`};},
    ()=>{const a=ri(2,6),b=ri(2,6),c=ri(2,6);return{text:`(−${a}) × (−${b}) × (−${c}) = ?`,ans:-(a*b*c),h1:'Lichý počet záporných činitelů (3) → výsledek záporný.',h2:`= −${a*b*c}`};},
    ()=>{const a=ri(2,9),b=ri(2,9);const neg=ri(0,1)===0;const res=neg?-(a*b):a*b;return{text:`Bude součin ${neg?'(−'+a+')':a} × ${b} kladný?`,ans:res>0?'ANO':'NE',h1:'Rozhodni podle počtu záporných činitelů.',h2:res>0?'ANO':'NE'};},
    ()=>{const a=ri(2,8),n=a*ri(2,6);return{text:`Doplň chybějící činitel: (−${a}) × ? = −${n}`,ans:n/a,h1:'Aby vyšlo záporné z jednoho záporného, druhý musí být kladný.',h2:`= ${n/a}`};},
    ()=>{const base=ri(2,7);return{text:`Vypočítej druhou mocninu záporného čísla: (−${base})² = ?`,ans:base*base,h1:'Umocnění na druhou = číslo krát samo sebe; záporné × záporné = kladné.',h2:`= ${base*base}`};},
    ()=>{const a=ri(2,6),b=ri(2,6);return{text:`Kolik je −${a} × 0 × ${b}?`,ans:0,h1:'Jakýkoli součin obsahující nulu je nula.',h2:'= 0'};},
    ()=>{const q=ri(2,9),d=ri(2,8);return{text:`Podíl (−${q*d}) : (−${d}) — je jeho výsledek kladný?`,ans:'ANO',h1:'Záporné děleno záporným dává kladné.',h2:'ANO'};},
    ()=>{const step=ri(2,6),n=ri(3,6);return{text:`Každý ze ${n} ${skl(n,'schodu','schodů','schodů')} klesá o ${step} m. O kolik metrů celkem klesneš po ${n} schodech? (zapiš jako záporné číslo)`,ans:-(step*n),h1:'Klesání = záporné; vynásob počtem schodů.',h2:`= −${step*n} m`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// 3-3 Racionální čísla (záporné zlomky a desetinná)
function gen_3_3(){
  const asFrac=(num,den)=>{const g=gcd(Math.abs(num),den);if(num===0)return '0';const s=num<0?'-':'';return g===den?String(num/g):`${s}${Math.abs(num)/g}/${den/g}`;};
  const T=[
    ()=>{const a=ri(2,5),b=ri(3,8);return{text:`Převeď záporný zlomek na desetinné číslo: −${a}/${b} ≈ ? (na 2 desetinná místa)`,ans:r2(-a/b),h1:`Vyděl ${a} : ${b} a doplň záporné znaménko.`,h2:`≈ ${r2(-a/b)}`};},
    ()=>{const d=ri(3,8),c=ri(1,d-1),e=ri(1,d-1);const num=e-c;return{text:`Sečti zlomky se stejným jmenovatelem: (−${c}/${d}) + ${e}/${d} = ?`,ans:asFrac(num,d),h1:'Jmenovatel opiš, sečti čitatele (pozor na znaménka).',h2:`(${e} − ${c})/${d} = ${asFrac(num,d)}`};},
    ()=>{const f=ri(2,5),g=ri(3,8);return{text:`Kolik je absolutní hodnota |−${f}/${g}|? (zapiš jako zlomek)`,ans:`${f}/${g}`,h1:'Absolutní hodnota je vzdálenost od nuly — vždy kladná.',h2:`${f}/${g}`};},
    ()=>{const h=ri(15,35)/10,i=ri(5,14)/10;return{text:`Sečti desetinná čísla: (−${cz(h)}) + ${cz(i)} = ?`,ans:r1(i-h),h1:'Různá znaménka: odečti menší velikost od větší.',h2:`= ${r1(i-h)}`};},
    ()=>{const j=ri(2,6),k=ri(3,9);return{text:`(−${j*k}) : (−${j}) = ?`,ans:k,h1:'Záporné děleno záporným dává kladné.',h2:`= ${k}`};},
    ()=>{const n=ri(3,8),m=ri(1,n-1),o=ri(1,n-1);const num=o-m;return{text:`Odečti záporný zlomek: −${m}/${n} − (−${o}/${n}) = ?`,ans:asFrac(num,n),h1:'Odečíst záporné = přičíst kladné: −m/n + o/n.',h2:`(${o} − ${m})/${n} = ${asFrac(num,n)}`};},
    ()=>{const a=ri(2,5),b=ri(3,9),c=ri(2,5);return{text:`Vynásob záporný zlomek celým číslem: (−${a}/${b}) × ${c} = ?`,ans:asFrac(-a*c,b),h1:'Záporný zlomek krát kladné číslo = záporné; násob jen čitatel.',h2:`−${a*c}/${b}, pak zkrať`};},
    ()=>{const a=ri(3,8),b=ri(3,8);const gt=(-a/b)<(-b/a);return{text:`Je −${a}/${b} menší než −${b}/${a}? (menší = více vlevo na číselné ose)`,ans:gt?'ANO':'NE',h1:'U záporných čísel je menší to, které je „zápornější".',h2:gt?'ANO':'NE'};},
    ()=>{const cel=ri(-5,-1);return{text:`Které racionální číslo leží přesně uprostřed mezi ${cel} a ${cel+1}? (desetinné)`,ans:r1(cel+0.5),h1:'Střed = průměr obou čísel.',h2:`= ${cz(cel+0.5)}`};},
    ()=>{const a=ri(2,6)/10;const b=ri(2,6)/10;const bigger=Math.max(a,b);return{text:`Které číslo je větší: −${cz(a)}, nebo −${cz(b)}?${a===b?' (jsou stejná — napiš −'+cz(a)+')':''}`,ans:-Math.min(a,b),h1:'Ze dvou záporných je větší to blíž nule (menší velikost).',h2:`= ${cz(-Math.min(a,b))}`};},
    ()=>{const a=ri(2,5),b=ri(3,8);return{text:`Jaké číslo je opačné k −${a}/${b}? (zapiš jako zlomek)`,ans:`${a}/${b}`,h1:'Opačné číslo má opačné znaménko.',h2:`${a}/${b}`};},
    ()=>{const t0=ri(15,40)/10,dn=ri(20,55)/10;return{text:`V hrobce byla teplota −${cz(t0)} °C, přes noc klesla o dalších ${cz(dn)} °C. Jaká je teď? (°C)`,ans:r1(-t0-dn),h1:'Klesnutí = odečti od záporné teploty (jdeš hlouběji do záporu).',h2:`−${cz(t0)} − ${cz(dn)} = ${r1(-t0-dn)} °C`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 4 — VÁŽNICE POMĚRŮ
// ══════════════════════════════════════════════════════════

// 4-1 Poměr (MC — numerické)
function gen_4_1(){
  const tasks=[];
  // základní tvar poměru
  const a=ri(2,5),b=ri(2,5),k=ri(2,4);
  tasks.push({text:`Zjednodušti poměr ${a*k} : ${b*k}. Jaký je první člen základního tvaru?`,ans:a,hints:['Vyděl oba členy NSD.','NSD('+a*k+','+b*k+') = '+k+' → '+a+':'+b],skill:'anal'});
  // rozdělení
  const m=ri(2,5),n=ri(2,5),kDil=ri(4,10),sum=(m+n)*kDil;
  const part=m*kDil;
  tasks.push({text:`Rozděl ${sum} v poměru ${m} : ${n}. Kolik je první díl?`,ans:part,hints:['1 díl = celek : (m+n).','1 díl = '+sum+' : '+(m+n)+' = '+kDil+', pak × '+m+' → '+part],skill:'anal'});
  // poměr délek
  const x=ri(6,20),y=ri(3,x-2);const g=gcd(x,y);
  tasks.push({text:`Úsečky mají délky ${x} cm a ${y} cm. Jaký je první člen jejich poměru v základním tvaru?`,ans:x/g,hints:['Najdi NSD obou délek a vyděl jím oba členy.',x+'/'+g+' : '+y+'/'+g+' → '+(x/g)+':'+(y/g)],skill:'anal'});
  // poměr z dílů
  const c=ri(3,8),d=ri(3,8),kc=ri(3,6),total2=(c+d)*kc;
  const cpart=c*kc;
  const big=c>d?c:d;
  tasks.push({text:`Dva podíly se dělí v poměru ${c} : ${d}. Větší je ${big} ${skl(big,'díl','díly','dílů')}, celek je ${total2}. Kolik je první podíl?`,ans:cpart,hints:['Hodnota prvního dílu = celek : (c+d) × c.',total2+' : '+(c+d)+' = '+kc+', pak × '+c+' → '+cpart],skill:'anal'});
  // z reálné situace
  const e=ri(4,10),f=ri(3,8),multHF=ri(2,3),celkHF=(e+f)*multHF;
  tasks.push({text:`Počet hochů ku počtu dívek je ${e} : ${f}. Ve třídě je ${celkHF} dětí. Kolik je hochů?`,ans:e*multHF,hints:['1 díl = celkem : ('+e+'+'+f+') = '+multHF+'.','hoši = '+multHF+' × '+e+' = '+(e*multHF)],skill:'anal'});
  const h=ri(2,7),i=ri(2,7),r=ri(2,4);
  tasks.push({text:`Poměr ${h*r} : ${i*r} v základním tvaru? Druhý člen?`,ans:i,hints:['Vyděl NSD('+h*r+','+i*r+') = '+r+'.',h+':'+i+' → druhý člen = '+i],skill:'anal'});
  { const a=ri(2,5),b=ri(2,5),k=ri(2,4); tasks.push({text:`Zjednodušti poměr ${a*k} : ${b*k}. Druhý člen?`,ans:b,hints:['Vyděl oba členy NSD.',`${a}:${b} → druhý člen = ${b}`],skill:'anal'}); }
  { const m=ri(2,4),n=ri(2,4),kk=ri(3,8),s=(m+n)*kk;const d=n*kk;tasks.push({text:`Rozděl ${s} v poměru ${m} : ${n}. Druhý díl?`,ans:d,hints:['1 díl = '+s+' : '+(m+n)+' = '+kk+', pak × '+n,''+d],skill:'anal'}); }
  { const x=ri(6,20),y=ri(2,x-1);const g=gcd(x,y);tasks.push({text:`Poměr ${x} : ${y} ve základním tvaru — první člen?`,ans:x/g,hints:['Vyděl NSD('+x+','+y+') = '+g+'.',`${x/g}:${y/g}`],skill:'anal'}); }
  { const a=ri(2,4),b=ri(2,4),tot=ri(10,25)*(a+b);const p=tot*a/(a+b);tasks.push({text:`Celek ${tot} v poměru ${a} : ${b}. První díl?`,ans:p,hints:['1 díl = '+tot+'/'+(a+b)+'='+tot/(a+b)+', × '+a,''+p],skill:'anal'}); }
  // thematické (numerické — MC-safe)
  { const m=ri(2,5),n=ri(2,5),d=ri(3,7),soch=(m+n)*d;tasks.push({text:`Sochy a sloupy v síni jsou v poměru ${m} : ${n}. Dohromady je jich ${soch}. Kolik je soch?`,ans:m*d,hints:['1 díl = celek : ('+m+'+'+n+') = '+d+'.','sochy = '+d+' × '+m+' = '+(m*d)],skill:'anal'}); }
  { const a=ri(6,18),b=ri(3,a-1);const gg=gcd(a,b);tasks.push({text:`Dvě pochodně dohořely na délky ${a} cm a ${b} cm. Jaký je první člen jejich poměru v základním tvaru?`,ans:a/gg,hints:['Vyděl obě délky jejich NSD ('+gg+').',`${a/gg} : ${b/gg}`],skill:'anal'}); }
  return tasks;
}

// 4-2 Trojčlenka (přímá a nepřímá úměrnost)
function gen_4_2(){
  const tasks=[];
  // přímá úměrnost
  const a=ri(3,8),b=ri(4,12),c=ri(2,6);
  tasks.push({text:`${a} kg cukru stojí ${a*b} Kč. Kolik stojí ${c} kg?`,ans:c*b,hints:['Přímá úměrnost: cena roste s množstvím.','1 kg = '+b+' Kč → '+c+' kg = '+(c*b)+' Kč'],skill:'anal'});
  // nepřímá úměrnost — d·eDni = f·xDni ⇒ oba časy celé (eDni=f·k, xDni=d·k)
  const d=ri(2,5),f=ri(2,6),kNep=ri(2,6),eDni=f*kNep,xDni=d*kNep;
  tasks.push({text:`${d} ${skl(d,'dělník','dělníci','dělníků')} postaví plot za ${eDni} ${skl(eDni,'den','dny','dní')}. Za kolik dní to zvládne ${f} ${skl(f,'dělník','dělníci','dělníků')}? (nepřímá úměrnost)`,ans:xDni,hints:['Nepřímá: součin dělníci × dny je stálý.',d+'·'+eDni+' = '+f+'·x → x = '+xDni+' '+skl(xDni,'den','dny','dní')],skill:'anal'});
  // přímá — vzdálenost/čas
  const g=ri(3,8),h=ri(5,15)*10,i=ri(2,5);
  tasks.push({text:`Jezdec jede ${g} ${skl(g,'hodinu','hodiny','hodin')} rychlostí ${h} km/h. Jakou vzdálenost ujede za ${i} ${skl(i,'hodinu','hodiny','hodin')} stejnou rychlostí?`,ans:i*h,hints:['Vzdálenost = rychlost × čas.',''+i+'·'+h+' = '+(i*h)+' km'],skill:'anal'});
  // z tabulky
  const j=ri(4,10),k=ri(2,5),l=ri(3,8);
  tasks.push({text:`Přímá úměrnost: za ${j} ${skl(j,'minutu','minuty','minut')} zpracuji ${k} ${skl(k,'stranu','strany','stran')}. Za ${l*j} ${skl(l*j,'minutu','minuty','minut')} zpracuji ? stran.`,ans:l*k,hints:['Přímá: kolikrát více čas → kolikrát více stran.',''+l+'× více času → '+(l*k)+' stran'],skill:'anal'});
  // trojčlenka — recept (n = m·per ⇒ 1 bochník je celé číslo gramů)
  const m=ri(2,4),perB=ri(50,120),n=m*perB,o=ri(m+1,m*3);
  tasks.push({text:`Na ${m} ${skl(m,'bochník','bochníky','bochníků')} chleba potřebuji ${n} g mouky. Kolik gramů mouky potřebuji na ${o} ${skl(o,'bochník','bochníky','bochníků')}?`,ans:perB*o,hints:['Přímá: 1 bochník = '+n+' : '+m+' = '+perB+' g.',''+o+'·'+perB+' = '+(perB*o)+' g'],skill:'anal'});
  // nepřímá — rychlost/čas (p = násobek nasm ⇒ výsledný čas celé číslo)
  const nasm=ri(2,4),p=nasm*ri(1,3),q=ri(40,80);
  tasks.push({text:`Cesta trvá ${p} ${skl(p,'hodinu','hodiny','hodin')} rychlostí ${q} km/h. Jak dlouho trvá stejná cesta rychlostí ${q*nasm} km/h?`,ans:p/nasm,hints:[`Nepřímá: ${nasm}× vyšší rychlost → ${nasm}× kratší čas.`,p+' : '+nasm+' = '+(p/nasm)+' h'],skill:'anal'});
  { const a=ri(2,5),per=ri(3,8),b=a*per;let c=ri(2,8);if(c===a)c=c%8+2; tasks.push({text:`${a} ${skl(a,'litr','litry','litrů')} barvy ${skl(a,'vymaluje','vymalují','vymaluje')} ${b} m². Kolik m² ${skl(c,'vymaluje','vymalují','vymaluje')} ${c} ${skl(c,'litr','litry','litrů')}?`,ans:c*per,hints:['Přímá úměrnost: více barvy → více plochy.','1 l = '+per+' m², '+c+' l = '+(c*per)+' m²'],skill:'anal'}); }
  { const d=ri(3,6),e=ri(20,60),f=ri(d+1,d*2); tasks.push({text:`${d} ${skl(d,'kohout','kohouti','kohoutů')} sezobe obilí za ${e} dní. Za kolik dní ${f} ${skl(f,'kohout','kohouti','kohoutů')}? (nepřímá úměrnost)`,ans:Math.round(d*e/f),hints:['Nepřímá: d·e = f·x → x = '+d+'·'+e+'/'+f,'= '+Math.round(d*e/f)+' dní'],skill:'anal'}); }
  { const g=ri(4,10),h=ri(3,8),i=ri(2,5); tasks.push({text:`Auto ujede za ${g} h vzdálenost ${g*h} km. Za ${i} h ujede?`,ans:i*h,hints:['Přímá: v = '+(g*h/g)+' km/h.',''+i+'×'+h+' = '+i*h+' km'],skill:'anal'}); }
  { const m=ri(3,7),n=ri(10,30),o=m*ri(2,4); tasks.push({text:`Na ${m} ${skl(m,'čtverec','čtverce','čtverců')} spotřebuju ${n} g lepidla. Na ${o} ${skl(o,'čtverec','čtverce','čtverců')}?`,ans:Math.round(n*o/m),hints:['Přímá: 1 čtverec = '+(n/m).toFixed(1)+' g.',''+o+'×'+n/m+' = '+Math.round(n*o/m)+' g'],skill:'anal'}); }
  { const a=ri(2,5),per=ri(3,8),b=a*per;let c=ri(2,8);if(c===a)c=c%8+2; tasks.push({text:`${a} ${skl(a,'pochodeň','pochodně','pochodní')} osvětlí ${b} m chodby. Kolik metrů osvětlí ${c} ${skl(c,'pochodeň','pochodně','pochodní')}?`,ans:c*per,hints:['Přímá úměrnost: 1 pochodeň = '+per+' m.',c+' × '+per+' = '+(c*per)+' m'],skill:'anal'}); }
  { const d=ri(2,5),f=ri(2,6),k=ri(2,6),eDni=f*k,xDni=d*k; tasks.push({text:`${d} ${skl(d,'dělník','dělníci','dělníků')} přenese kamenné bloky za ${eDni} ${skl(eDni,'den','dny','dní')}. Za kolik dní to zvládne ${f} ${skl(f,'dělník','dělníci','dělníků')}? (nepřímá úměrnost)`,ans:xDni,hints:['Nepřímá: dělníci × dny je stálý součin.',d+'·'+eDni+' = '+f+'·x → x = '+xDni+' '+skl(xDni,'den','dny','dní')],skill:'anal'}); }
  return tasks;
}

// 4-3 Měřítko mapy
function gen_4_3(){
  const tasks=[];
  // měřítko → skutečnost
  const a=ri(2,9),ma=ri(1,5)*100000;
  tasks.push({text:`Na mapě v měřítku 1 : ${ma.toLocaleString('cs-CZ')} měří vzdálenost ${a} cm. Jaká je skutečná vzdálenost v km?`,ans:r1(a*ma/100000),hints:['Skutečnost = mapa × jmenovatel.',''+a+' cm × '+ma+' = '+a*ma+' cm = '+r1(a*ma/100000)+' km'],skill:'anal'});
  // skutečnost → mapa
  const b=ri(5,30)*10,mb=ri(1,5)*10000;
  tasks.push({text:`Skutečná vzdálenost je ${b} m. V měřítku 1 : ${mb.toLocaleString('cs-CZ')} jak dlouhý úsek nakreslíme na mapě? (v cm)`,ans:r2(b*100/mb),hints:['Mapa = skutečnost / jmenovatel (v cm).',''+b*100+' cm / '+mb+' = '+r2(b*100/mb)+' cm'],skill:'anal'});
  // plán budovy
  const c=ri(3,12),nc=ri(1,4)*100;
  tasks.push({text:`Plán v měřítku 1 : ${nc}. Úsečka na plánu měří ${c} cm. Jak dlouhá je skutečná stěna v metrech?`,ans:r2(c*nc/100),hints:['Skutečnost = plán × jmenovatel.',''+c+'×'+nc+' cm = '+c*nc+' cm = '+r2(c*nc/100)+' m'],skill:'anal'});
  // opačně — skutečnost → plán
  const d=ri(10,50),nd=ri(1,5)*500;
  tasks.push({text:`Skutečná délka ulice je ${d} m. Měřítko mapy je 1 : ${nd.toLocaleString('cs-CZ')}. Jaká délka odpovídá na mapě? (v cm)`,ans:r2(d*100/nd),hints:['Mapa = skutečnost(cm) / měřítko.',String(r2(d*100/nd))],skill:'anal'});
  // výpočet z plochy
  const e=ri(2,8),f=ri(2,8),ne=200;
  tasks.push({text:`Místnost je na plánu (1 : ${ne}) ${e} cm × ${f} cm. Jaký je skutečný obsah v m²?`,ans:r2(e*f*ne*ne/10000),hints:['Skutečné strany: '+e+'×'+ne+' cm a '+f+'×'+ne+' cm.',r2(e*ne/100)+'×'+r2(f*ne/100)+' = '+r2(e*f*ne*ne/10000)+' m²'],skill:'geo'});
  // zpět na mapu z plochy
  const g=ri(3,9),h=ri(3,9);
  tasks.push({text:`Políčko je ${g} m × ${h} m. V měřítku 1 : 100 jaké má rozměry na plánu? Zadej součin obou rozměrů v cm².`,ans:g*h,hints:['V měřítku 1:100 je 1 m = 1 cm na plánu.',g+' cm × '+h+' cm = '+(g*h)+' cm²'],skill:'anal'});
  { const a=ri(3,9),ma=ri(2,4)*50000; tasks.push({text:`Na mapě (1:${ma.toLocaleString('cs-CZ')}) měří úsek ${a} cm. Skutečná vzdálenost v km?`,ans:r1(a*ma/100000),hints:['Skutečnost = mapa × měřítko.',r1(a*ma/100000)+' km'],skill:'anal'}); }
  { const b=ri(2,8),mb=200; tasks.push({text:`Plán (1:${mb}), stěna ${b} cm na plánu. Skutečná délka v metrech?`,ans:r2(b*mb/100),hints:['Skutečnost = plán × měřítko.',`${b}×${mb} cm = ${b*mb} cm = ${r2(b*mb/100)} m`],skill:'anal'}); }
  { const c=ri(50,200),nc=25000; tasks.push({text:`Skutečná vzdálenost ${c} m, měřítko 1:${nc.toLocaleString('cs-CZ')}. Na mapě? (v cm)`,ans:r2(c*100/nc),hints:['Mapa = skutečnost(cm) / měřítko.',r2(c*100/nc)+' cm'],skill:'anal'}); }
  { const d=ri(1,6),nd=ri(1,4)*100000; tasks.push({text:`Úsečka na mapě (1:${nd.toLocaleString('cs-CZ')}) měří ${d} cm. Skutečně? (km)`,ans:r1(d*nd/100000),hints:['Skutečnost = '+d+'×'+nd+' cm.',r1(d*nd/100000)+' km'],skill:'anal'}); }
  // thematické
  { const c=ri(3,12),nc=ri(1,4)*100; tasks.push({text:`Na plánu chrámu (1 : ${nc}) měří obětní chodba ${c} cm. Jak dlouhá je ve skutečnosti? (v metrech)`,ans:r2(c*nc/100),hints:['Skutečnost = plán × jmenovatel.',`${c}×${nc} cm = ${c*nc} cm = ${r2(c*nc/100)} m`],skill:'anal'}); }
  { const s=ri(4,9),ms=ri(1,3)*50; tasks.push({text:`Socha je vysoká ${s} m. Na plánu v měřítku 1 : ${ms} jak vysoká bude? (v cm)`,ans:r2(s*100/ms),hints:['Plán = skutečnost(cm) / měřítko.',`${s*100} cm / ${ms} = ${r2(s*100/ms)} cm`],skill:'anal'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 5 — ZLATÁ POKLADNICE
// ══════════════════════════════════════════════════════════

// 5-1 Procentová část (MC — numerické)
function gen_5_1(){
  const T=[
    ()=>{const a=[10,20,25,50][ri(0,3)],b=ri(2,9)*100;return{text:`Kolik je ${a} % z čísla ${b}?`,ans:Math.round(a/100*b),h1:'Procentová část = základ × počet procent : 100.',h2:`${b} · ${a} : 100 = ${Math.round(a/100*b)}`};},
    ()=>{const e=[5,10,20,25][ri(0,3)],f=ri(4,20)*50;return{text:`Zboží stojí ${f} Kč. Kolik Kč je ${e} % z této ceny?`,ans:Math.round(e/100*f),h1:'Vynásob cenu procenty a vyděl stem.',h2:`= ${Math.round(e/100*f)} Kč`};},
    ()=>{const g=[10,20,25,40,50][ri(0,4)],h=ri(3,8)*100;return{text:`Cena ${h} Kč se sníží o slevu ${g} %. O kolik Kč se cena sníží?`,ans:Math.round(g/100*h),h1:'Sleva v korunách = základ × procenta : 100.',h2:`= ${Math.round(g/100*h)} Kč`};},
    ()=>{const g=[10,20,25][ri(0,2)],h=ri(3,8)*100;return{text:`Cena ${h} Kč se sníží o ${g} %. Kolik Kč bude NOVÁ cena?`,ans:Math.round(h*(1-g/100)),h1:'Nová cena = základ − sleva.',h2:`= ${Math.round(h*(1-g/100))} Kč`};},
    ()=>{const p=[10,20,50][ri(0,2)],z=ri(3,9)*100;return{text:`O ${p} % se zvýší mzda ${z} Kč. Kolik Kč činí zvýšení?`,ans:Math.round(p/100*z),h1:'Zvýšení = základ × procenta : 100.',h2:`= ${Math.round(p/100*z)} Kč`};},
    ()=>{const b=ri(2,9)*100;return{text:`Kolik je polovina (50 %) z čísla ${b}?`,ans:b/2,h1:'50 % znamená polovinu.',h2:`= ${b/2}`};},
    ()=>{const b=ri(2,9)*100;return{text:`Kolik je čtvrtina (25 %) z čísla ${b}?`,ans:b/4,h1:'25 % znamená jednu čtvrtinu — vyděl čtyřmi.',h2:`= ${b/4}`};},
    ()=>{const b=ri(2,9)*100;return{text:`Kolik je desetina (10 %) z čísla ${b}?`,ans:b/10,h1:'10 % získáš vydělením deseti.',h2:`= ${b/10}`};},
    ()=>{const i=[20,40,60,80][ri(0,3)],j=ri(4,12)*50;return{text:`Test má ${j} bodů. Kolik bodů je ${i} % z maxima?`,ans:Math.round(i/100*j),h1:'Body = maximum × procenta : 100.',h2:`= ${Math.round(i/100*j)}`};},
    ()=>{const p=[10,20,25][ri(0,2)],cel=ri(3,8)*40;const ok=ri(0,1)===0;const tvrz=ok?Math.round(p/100*cel):Math.round(p/100*cel)+cel/10;const spravne=tvrz===Math.round(p/100*cel);return{text:`Je ${p} % z čísla ${cel} rovno ${tvrz}?`,ans:spravne?'ANO':'NE',h1:'Spočítej procentovou část a porovnej.',h2:spravne?'ANO':'NE'};},
    ()=>{const cel=ri(2,9)*100;return{text:`Kolik jsou tři čtvrtiny (75 %) z čísla ${cel}?`,ans:cel/4*3,h1:'75 % = tři čtvrtiny; spočítej čtvrtinu a vynásob třemi.',h2:`= ${cel/4*3}`};},
    ()=>{const a=[10,20,25,50][ri(0,3)],b=ri(2,9)*20;return{text:`V truhlici je ${b} zlatých ${skl(b,'minci','mince','mincí')}, ${a} % z nich je falešných. Kolik mincí je falešných?`,ans:Math.round(a/100*b),h1:'Falešné = základ × procenta : 100.',h2:`= ${Math.round(a/100*b)}`};},
    ()=>{const p=[10,20,25,50][ri(0,3)],z=ri(3,9)*40;return{text:`Poklad má hodnotu ${z} zlaťáků. Past ti sebrala ${p} %. O kolik zlaťáků jsi přišel?`,ans:Math.round(p/100*z),h1:'Ztráta = základ × procenta : 100.',h2:`= ${Math.round(p/100*z)}`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// 5-2 Počet procent a základ
function gen_5_2(){
  const tasks=[];
  // kolik procent
  const a=ri(2,8)*10,b=ri(3,9)*100;
  tasks.push({text:`${a} je kolik procent z ${b}? (zaokrouhli na celá %)`,ans:Math.round(a/b*100),hints:['p = část/základ × 100.',''+a+'/'+b+' × 100 = '+Math.round(a/b*100)+'%'],skill:'calc'});
  const c=ri(2,6)*5,d=ri(4,12)*25;
  tasks.push({text:`${c} kg tvoří kolik procent z ${d} kg? (zaokrouhli na celá %)`,ans:Math.round(c/d*100),hints:['p = '+c+'/'+d+' × 100','= '+Math.round(c/d*100)+'%'],skill:'calc'});
  // základ z části a procent
  const e=ri(1,4)*25,f=ri(2,8)*10;
  tasks.push({text:`${f} tvoří ${e} % z jakého čísla? (základ, zaokrouhli na celé)`,ans:Math.round(f/e*100),hints:['základ = část / (p/100) = část × 100/p.',''+f+' × 100/'+e+' = '+Math.round(f/e*100)],skill:'calc'});
  const g=ri(10,30),h=ri(2,8)*100;
  tasks.push({text:`${h} Kč je ${g} % ceny. Jaká je plná cena? (zaokrouhli na celé Kč)`,ans:Math.round(h/g*100),hints:['základ = '+h+' × 100/'+g,String(Math.round(h/g*100))+' Kč'],skill:'calc'});
  // zdražení
  const i=ri(2,5)*10,j=ri(3,10)*100;
  tasks.push({text:`Cena ${j} Kč se zdraží o ${i} %. Jaká bude nová cena?`,ans:Math.round(j*(1+i/100)),hints:['Nová cena = základ × (1 + p/100).',''+j+' × '+(1+i/100)+' = '+Math.round(j*(1+i/100))+' Kč'],skill:'calc'});
  // sleva — finální cena
  const k=ri(1,4)*10,l=ri(3,10)*200;
  tasks.push({text:`Zboží za ${l} Kč je v akci se slevou ${k} %. Jaká bude cena po slevě?`,ans:Math.round(l*(1-k/100)),hints:['Po slevě = základ × (1 − p/100).',''+l+' × '+(1-k/100)+' = '+Math.round(l*(1-k/100))+' Kč'],skill:'calc'});
  { const a=ri(2,8)*10,b=ri(3,9)*100; tasks.push({text:`${a} je kolik procent z ${b}? (zaokrouhli na celá %)`,ans:Math.round(a/b*100),hints:['p = část/základ × 100.','= '+Math.round(a/b*100)+' %'],skill:'calc'}); }
  { const e=ri(1,4)*25,f=ri(2,8)*10; tasks.push({text:`${f} tvoří ${e} % z jakého čísla? (zaokrouhli na celé)`,ans:Math.round(f/e*100),hints:['základ = část × 100/p.','= '+Math.round(f/e*100)],skill:'calc'}); }
  { const g=ri(10,25),h=ri(2,9)*100; tasks.push({text:`${h} Kč je ${g} % ceny. Plná cena? (zaokrouhli na celé Kč)`,ans:Math.round(h/g*100),hints:['základ = '+h+' × 100/'+g,'= '+Math.round(h/g*100)+' Kč'],skill:'calc'}); }
  { const i=ri(2,5)*10,j=ri(3,9)*100; tasks.push({text:`Cena ${j} Kč zdražila o ${i} %. Nová cena?`,ans:Math.round(j*(1+i/100)),hints:['Nová = základ × (1+p/100).','= '+Math.round(j*(1+i/100))+' Kč'],skill:'calc'}); }
  // thematické
  { const cel=ri(5,12)*20,done=ri(1,cel/20-1)*20; tasks.push({text:`Chrámové schodiště má ${cel} ${skl(cel,'schod','schody','schodů')}, zdolal jsi ${done}. Kolik procent máš za sebou? (zaokrouhli na celé %)`,ans:Math.round(done/cel*100),hints:['p = zdolané / celkem × 100.',`${done}/${cel} × 100 = ${Math.round(done/cel*100)} %`],skill:'calc'}); }
  { const p=ri(2,5)*5,cast=ri(2,8)*10; tasks.push({text:`Z pokladu jsi našel ${cast} zlaťáků, což je ${p} % celého pokladu. Jaká je celková hodnota pokladu? (zaokrouhli na celé)`,ans:Math.round(cast/p*100),hints:['základ = část × 100 / p.',`${cast} × 100 / ${p} = ${Math.round(cast/p*100)}`],skill:'calc'}); }
  return tasks;
}

// 5-3 Slovní úlohy s procenty
function gen_5_3(){
  const tasks=[];
  const a=ri(2,5)*10,b=ri(3,9)*100,pA=ri(2,5)*5;
  tasks.push({text:`Obchod zdraží zboží o ${pA} %. Původní cena byla ${b} Kč. Nová cena?`,ans:Math.round(b*(1+pA/100)),hints:[`Nová cena = základ × (1 + ${pA}/100).`,'= '+Math.round(b*(1+pA/100))+' Kč'],skill:'anal'});
  const c=ri(2,5)*5,d=ri(4,10)*200;
  tasks.push({text:`Cena se snížila o ${c} % a nyní je ${Math.round(d*(1-c/100))} Kč. Jaká byla původní cena?`,ans:d,hints:['Současná cena = základ × (1−'+c+'/100).','základ = '+Math.round(d*(1-c/100))+' : '+cz(1-c/100)+' = '+d+' Kč'],skill:'anal'});
  const e=ri(2,6)*5,f=ri(3,9)*100;
  tasks.push({text:`Třída má ${f} žáků, ${e} % jsou dívky. Kolik je dívek?`,ans:Math.round(f*e/100),hints:['Počet dívek = '+f+' × '+e+' : 100.',String(Math.round(f*e/100))],skill:'anal'});
  const g=ri(15,35)*4,h=ri(2,4)*5;
  tasks.push({text:`Ze zásoby ${g} litrů vody bylo použito ${h} %. Kolik litrů zbývá?`,ans:Math.round(g*(1-h/100)),hints:['Zbývá = základ × (1−p/100).',String(Math.round(g*(1-h/100)))+' l'],skill:'anal'});
  const j=ri(45,60),i=ri(30,j-5);   // trikot (i) je levnější než rifle (j)
  tasks.push({text:`Trikot stál ${i} Kč, rifle ${j} Kč. O kolik procent je trikot levnější než rifle? (zaokrouhli na celé %)`,ans:Math.round((j-i)/j*100),hints:['p = rozdíl : základ × 100 (základ = dražší, rifle).',''+Math.round((j-i)/j*100)+' %'],skill:'anal'});
  const k=ri(3,9)*100,l=ri(110,140)/100;
  tasks.push({text:`Cena narostla o ${Math.round((l-1)*100)} % na ${Math.round(k*l)} Kč. Jaká byla původní cena?`,ans:k,hints:['Původní = nová / (1+p/100).',String(k)+' Kč'],skill:'anal'});
  { const a=ri(2,5)*10,b=ri(3,9)*100;tasks.push({text:`Obchod zdraží o ${a} %. Původní cena ${b} Kč. Nová cena?`,ans:Math.round(b*(1+a/100)),hints:['Nová = základ × (1+p/100).','= '+Math.round(b*(1+a/100))+' Kč'],skill:'anal'}); }
  { const c=ri(1,4)*5,d=ri(4,10)*200;tasks.push({text:`Cena klesla o ${c} %. Nyní ${Math.round(d*(1-c/100))} Kč. Původní cena?`,ans:d,hints:['Původní = nyní / (1−p/100).',String(d)+' Kč'],skill:'anal'}); }
  { const e=ri(20,40),f=ri(3,9)*100;tasks.push({text:`Ze zásoby ${f} l bylo použito ${e} %. Zbývá?`,ans:Math.round(f*(1-e/100)),hints:['Zbývá = základ × (1−p/100).','= '+Math.round(f*(1-e/100))+' l'],skill:'anal'}); }
  { const g=ri(20,40),h=ri(3,7)*10;tasks.push({text:`Tenisky stály ${g*10} Kč, nyní ${g*10-h} Kč. Sleva v %?`,ans:Math.round(h/(g*10)*100),hints:['Sleva % = (rozdíl/původní) × 100.','= '+Math.round(h/(g*10)*100)+' %'],skill:'anal'}); }
  // thematické
  { const e=ri(2,4)*10,f=ri(3,9)*10;tasks.push({text:`Výpravu tvořilo ${f} ${skl(f,'dělník','dělníci','dělníků')}, ${e} % se ztratilo v pastech. Kolik dělníků došlo k pokladu?`,ans:Math.round(f*(1-e/100)),hints:['Zbývá = základ × (1 − p/100).','= '+Math.round(f*(1-e/100))],skill:'anal'}); }
  { const p=ri(2,5)*5,orig=ri(3,9)*100;tasks.push({text:`Váha zlata v truhlici vzrostla o ${p} % na ${Math.round(orig*(1+p/100))} g. Jaká byla původní váha? (g)`,ans:orig,hints:['Původní = nová / (1 + p/100).',orig+' g'],skill:'anal'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 6 — ZRCADLOVÁ SVATYNĚ
// ══════════════════════════════════════════════════════════

// 6-1 Osová souměrnost (MC — ANO/NE nebo numerické)
function gen_6_1(){
  const tasks=[];
  tasks.push({text:'Má čtverec osovou souměrnost?',ans:'ANO',hints:['Zkus překložit přes osu.','Má 4 osy souměrnosti.'],skill:'geo'});
  tasks.push({text:'Má obecný trojúhelník (různé strany) osovou souměrnost?',ans:'NE',hints:['Osová souměrnost vyžaduje, aby polovina byla zrcadlovým obrazem druhé.','Obecný trojúhelník ji nemá.'],skill:'geo'});
  tasks.push({text:'Má rovnoramenný trojúhelník osovou souměrnost?',ans:'ANO',hints:['Osa prochází vrcholem a středem základny.','ANO — 1 osa souměrnosti.'],skill:'geo'});
  tasks.push({text:'Kolik os souměrnosti má obdélník (ne čtverec)?',ans:2,hints:['Osy spojují středy protilehlých stran.','2 osy.'],skill:'geo'});
  tasks.push({text:'Kolik os souměrnosti má rovnostranný trojúhelník?',ans:3,hints:['Každá osa prochází vrcholem a středem protilehlé strany.','3 osy.'],skill:'geo'});
  tasks.push({text:'Má kružnice osovou souměrnost?',ans:'ANO',hints:['Kružnice má nekonečně mnoho os (každý průměr).','ANO.'],skill:'geo'});
  tasks.push({text:'Kolik os souměrnosti má čtverec?',ans:4,hints:['2 osy přes strany + 2 osy přes rohy.','4 osy.'],skill:'geo'});
  tasks.push({text:'Má kosočtverec (rhombus) osovou souměrnost?',ans:'ANO',hints:['Dvě osy: obě úhlopříčky.','ANO — 2 osy.'],skill:'geo'});
  tasks.push({text:'Má písmeno „A" osovou souměrnost?',ans:'ANO',hints:['Svislá osa souměrnosti rozdělí A na dvě zrcadlové části.','ANO.'],skill:'geo'});
  tasks.push({text:'Kolik os souměrnosti má pravidelný šestiúhelník?',ans:6,hints:['3 osy přes vrcholy + 3 osy přes středy stran.','6 os.'],skill:'geo'});
  // thematické (MC-safe — ANO/NE nebo číslo)
  { const shapes=[['rovnostranný trojúhelníkový štít','ANO'],['obdélníkový vlys (ne čtverec)','ANO'],['obecný trojúhelníkový úlomek','NE']]; const s=pick(shapes); tasks.push({text:`Má ${s[0]} nad branou chrámu osovou souměrnost?`,ans:s[1],hints:['Zkus jej v duchu překlopit přes osu.',s[1]],skill:'geo'}); }
  { const n=[4,6][ri(0,1)]; tasks.push({text:`Podlahu svatyně zdobí pravidelný ${n}úhelník. Kolik má os souměrnosti?`,ans:n,hints:[`Pravidelný ${n}úhelník má ${n} os souměrnosti.`,`${n} ${skl(n,'osa','osy','os')}`],skill:'geo'}); }
  return tasks;
}

// 6-2 Středová souměrnost
function gen_6_2(){
  const tasks=[];
  tasks.push({text:'Má čtverec středovou souměrnost?',ans:'ANO',hints:['Střed symetrie = průsečík úhlopříček.','ANO.'],skill:'geo'});
  tasks.push({text:'Má obecný trojúhelník středovou souměrnost?',ans:'NE',hints:['Střed souměrnosti mají útvary jako rovnoběžník nebo kruh, trojúhelník ne.','NE — trojúhelník nikdy nemá střed souměrnosti.'],skill:'geo'});
  const a=ri(2,8),b=ri(2,8);
  tasks.push({text:`Bod A [${a}, ${b}] je obrazem středové souměrnosti podle středu S [0, 0]. Jaká je x-souřadnice vzoru?`,ans:-a,hints:['Souřadnice vzoru jsou opačné k obrazu.','x-souřadnice vzoru = −'+a+' = '+(-a)],skill:'geo'});
  const c=ri(-5,5),d=ri(-5,5),sx=ri(-3,3),sy=ri(-3,3);
  tasks.push({text:`Střed souměrnosti je S [${sx}, ${sy}], vzor A [${c}, ${d}]. Jaká je x-souřadnice obrazu A'?`,ans:2*sx-c,hints:["Obraz: x' = 2·sx − x vzoru.",'= 2·'+sx+'−'+c+' = '+(2*sx-c)],skill:'geo'});
  tasks.push({text:'Má obdélník středovou souměrnost?',ans:'ANO',hints:['Střed souměrnosti = průsečík úhlopříček.','ANO.'],skill:'geo'});
  tasks.push({text:'Má pravidelný šestiúhelník středovou souměrnost?',ans:'ANO',hints:['Střed = průsečík os.','ANO.'],skill:'geo'});
  { const a=ri(2,8),b=ri(2,8),sx=ri(-3,3),sy=ri(-3,3);tasks.push({text:`Střed S [${sx}, ${sy}], vzor A [${a}, ${b}]. y-souřadnice obrazu A'?`,ans:2*sy-b,hints:["Obraz: y' = 2·sy − y vzoru.",'= 2·'+sy+'−'+b+' = '+(2*sy-b)],skill:'geo'}); }
  tasks.push({text:'Má rovnoramenný trojúhelník středovou souměrnost?',ans:'NE',hints:['Trojúhelník nikdy nemá středovou souměrnost.','NE.'],skill:'geo'});
  tasks.push({text:'Má kosočtverec středovou souměrnost?',ans:'ANO',hints:['Střed souměrnosti = průsečík úhlopříček.','ANO.'],skill:'geo'});
  { const c=ri(-6,6),d=ri(-6,6); tasks.push({text:`Obraz bodu [${c}, ${d}] při středové souměrnosti podle O [0,0]. y-souřadnice?`,ans:-d,hints:["y' = −y.",'= '+(-d)],skill:'geo'}); }
  // thematické
  { const a=ri(2,8),b=ri(2,8); tasks.push({text:`Socha stojí v bodě [${a}, ${b}]. Její zrcadlový obraz podle oltáře v počátku S [0, 0] má jakou x-souřadnici?`,ans:-a,hints:["Střed v počátku: x' = −x.",`= ${-a}`],skill:'geo'}); }
  { const sx=ri(-3,3),sy=ri(-3,3),c=ri(-5,5),d=ri(-5,5); tasks.push({text:`Oltář je střed souměrnosti S [${sx}, ${sy}]. Kamenný sloup stojí ve vzoru A [${c}, ${d}]. Jaká je y-souřadnice jeho obrazu A'?`,ans:2*sy-d,hints:["y' = 2·sy − y.",`= 2·${sy} − ${d} = ${2*sy-d}`],skill:'geo'}); }
  return tasks;
}

// 6-3 Shodnost trojúhelníků (věty sss, sus, usu)
function gen_6_3(){
  const troj=()=>{const s=new Set();while(s.size<3)s.add(ri(3,12));return [...s].sort((x,y)=>x-y);};
  const T=[
    ()=>{const s=troj();return{text:`Dva trojúhelníky mají strany ${s[0]}, ${s[1]}, ${s[2]} cm a ${s[0]}, ${s[1]}, ${s[2]} cm. Jsou shodné?`,ans:'ANO',h1:'Věta sss: shodují se ve všech třech stranách.',h2:'ANO'};},
    ()=>{const s=troj();return{text:`První trojúhelník má strany ${s[0]}, ${s[1]}, ${s[2]} cm, druhý ${s[0]}, ${s[1]}, ${s[2]+1} cm. Jsou shodné?`,ans:'NE',h1:'Věta sss selhává — jedna strana se liší.',h2:'NE'};},
    ()=>{return{text:`Stačí ke shodnosti dvou trojúhelníků shoda ve dvou stranách a úhlu, který svírají (věta sus)?`,ans:'ANO',h1:'Věta sus (strana-úhel-strana) shodnost zaručuje.',h2:'ANO'};},
    ()=>{return{text:`Jsou dva trojúhelníky se shodnými třemi úhly (uuu) nutně shodné?`,ans:'NE',h1:'Stejné úhly dávají jen podobnost, ne shodnost (mohou mít různou velikost).',h2:'NE — jsou jen podobné'};},
    ()=>{const a=ri(3,8),b=ri(40,70),c=ri(30,180-b-10);return{text:`Trojúhelník má stranu a = ${a} cm a k ní přiléhající úhly β = ${b}° a γ = ${c}°. Je tím určen jednoznačně (věta usu)?`,ans:'ANO',h1:'Věta usu (úhel-strana-úhel) určuje trojúhelník jednoznačně.',h2:'ANO'};},
    ()=>{return{text:`Jsou všechny rovnostranné trojúhelníky navzájem shodné?`,ans:'NE',h1:'Mají stejné úhly (60°), ale mohou mít různě dlouhé strany.',h2:'NE'};},
    ()=>{return{text:`Kolik shodných stran potřebuje věta sss ke shodnosti trojúhelníků?`,ans:3,h1:'sss = strana-strana-strana.',h2:'3'};},
    ()=>{return{text:`Jsou dva pravoúhlé trojúhelníky s přeponou 10 cm a jednou odvěsnou 6 cm nutně shodné?`,ans:'ANO',h1:'Druhá odvěsna dopočtena Pythagorem (8 cm) → jsou určeny jednoznačně.',h2:'ANO'};},
    ()=>{const s=troj();const shodne=ri(0,1)===0;const s2=shodne?[...s]:[s[0],s[1],s[2]+ri(1,3)];return{text:`Trojúhelník T1 má strany ${s[0]}, ${s[1]}, ${s[2]} cm, T2 má ${s2[0]}, ${s2[1]}, ${s2[2]} cm. Jsou shodné?`,ans:shodne?'ANO':'NE',h1:'Porovnej všechny tři odpovídající strany.',h2:shodne?'ANO':'NE'};},
    ()=>{return{text:`Zachovává shodné zobrazení (např. osová souměrnost) tvar i velikost trojúhelníku?`,ans:'ANO',h1:'Shodné zobrazení nemění délky ani úhly.',h2:'ANO'};},
    ()=>{const b=ri(40,80),c=ri(40,80);const a=180-b-c;return{text:`Trojúhelník má úhly ${b}° a ${c}°. Jaký je jeho třetí úhel? (potřebný pro větu usu)`,ans:a,h1:'Součet úhlů v trojúhelníku je 180°.',h2:`180 − ${b} − ${c} = ${a}°`};},
    ()=>{return{text:`Určuje shoda jen ve dvou stranách (bez úhlu) shodnost trojúhelníků?`,ans:'NE',h1:'Dvě strany bez úhlu mezi nimi trojúhelník jednoznačně neurčí.',h2:'NE'};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'geo'});}
  // thematické
  { const s=(()=>{const set=new Set();while(set.size<3)set.add(ri(3,12));return[...set].sort((x,y)=>x-y);})(); tasks.push({text:`Dvě kamenné desky ve tvaru trojúhelníku mají strany ${s[0]}, ${s[1]}, ${s[2]} cm a ${s[0]}, ${s[1]}, ${s[2]} cm. Jsou shodné (věta sss)?`,ans:'ANO',hints:['Shodují se ve všech třech stranách.','ANO'],skill:'geo'}); }
  { const b=ri(40,80),c=ri(40,80),a=180-b-c; tasks.push({text:`Trojúhelníkový vlys nad branou chrámu má dva úhly ${b}° a ${c}°. Jaký je jeho třetí úhel (potřebný pro větu usu)?`,ans:a,hints:['Součet úhlů v trojúhelníku = 180°.',`180 − ${b} − ${c} = ${a}°`],skill:'geo'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 7 — VELKÁ PYRAMIDA
// ══════════════════════════════════════════════════════════

// 7-1 Obsah čtyřúhelníků (rovnoběžník a lichoběžník)
function gen_7_1(){
  const tasks=[];
  // obsah rovnoběžníku
  const a=ri(5,15),ha=ri(3,10);
  tasks.push({text:`Rovnoběžník má základnu ${a} cm a výšku ${ha} cm. Jaký je jeho obsah?`,ans:a*ha,hints:['S = a · h',`S = ${a}·${ha} = ${a*ha} cm²`],skill:'geo'});
  // obsah lichoběžníku
  const c=ri(5,12),d=ri(3,c-1),ht=ri(3,10);
  tasks.push({text:`Lichoběžník má základny ${c} cm a ${d} cm, výšku ${ht} cm. Jaký je jeho obsah?`,ans:(c+d)*ht/2,hints:['S = (a+c)/2 · h',`(${c}+${d})/2·${ht} = ${(c+d)*ht/2} cm²`],skill:'geo'});
  // druhý příklad rovnoběžníku
  const e=ri(6,18),he=ri(4,12);
  tasks.push({text:`Obsah rovnoběžníku se základnou ${e} cm a výškou ${he} cm?`,ans:e*he,hints:['S = základna × výška.',`${e}×${he} = ${e*he} cm²`],skill:'geo'});
  // z obsahu a základny → výška
  const f=ri(4,12),hf=ri(3,10),sf=f*hf;
  tasks.push({text:`Rovnoběžník má obsah ${sf} cm² a základnu ${f} cm. Jaká je výška?`,ans:hf,hints:['h = S/a',`h = ${sf}/${f} = ${hf} cm`],skill:'geo'});
  // lichoběžník z obsahu
  const g=ri(4,10),h2=ri(2,g-1),hg=ri(4,8),sg=(g+h2)*hg/2;
  tasks.push({text:`Lichoběžník s výškou ${hg} cm má obsah ${sg} cm². Součet základen?`,ans:g+h2,hints:['a+c = 2S/h',`2·${sg}/${hg} = ${g+h2} cm`],skill:'geo'});
  // slovní úloha — dlaždice
  const i=ri(20,40),j=ri(15,30);
  tasks.push({text:`Rovnoběžníková dlaždice má základnu ${i} cm a výšku ${j} cm. Kolik dlaždic se vejde na ${i*j*10} cm² podlahy?`,ans:10,hints:['Počet = plocha podlahy / plocha dlaždice.',`${i*j*10}/${i*j} = 10 dlaždic`],skill:'geo'});
  { const a=ri(6,16),h=ri(4,12); tasks.push({text:`Rovnoběžník, základna ${a} cm, výška ${h} cm. Obsah?`,ans:a*h,hints:['S = a·h.',`${a}×${h} = ${a*h} cm²`],skill:'geo'}); }
  { const c=ri(6,14),d=ri(3,c-2),ht=ri(4,10); tasks.push({text:`Lichoběžník, základny ${c} a ${d} cm, výška ${ht} cm. Obsah?`,ans:(c+d)*ht/2,hints:['S = (a+c)/2·h.',`(${c}+${d})/2·${ht} = ${(c+d)*ht/2} cm²`],skill:'geo'}); }
  { const e=ri(4,12),he=ri(3,9); tasks.push({text:`Rovnoběžník, obsah ${e*he} cm², výška ${he} cm. Základna?`,ans:e,hints:['a = S/h.',`${e*he}/${he} = ${e} cm`],skill:'geo'}); }
  { const f=ri(5,12),hf=ri(4,10);const sf=(f+f+2)*hf/2; tasks.push({text:`Lichoběžník s rovnoběžnými stranami ${f} a ${f+2} cm, výška ${hf} cm. Obsah?`,ans:sf,hints:['S = (a+c)/2·h.',`${sf} cm²`],skill:'geo'}); }
  // thematické
  { const a=ri(6,16),h=ri(4,10); tasks.push({text:`Oltářní deska má tvar rovnoběžníku se základnou ${a} cm a výškou ${h} cm. Jaký je její obsah?`,ans:a*h,hints:['S = a · h.',`${a}·${h} = ${a*h} cm²`],skill:'geo'}); }
  { const c=ri(6,14),d=ri(3,c-2),ht=ri(4,9); tasks.push({text:`Kamenný lichoběžníkový schod má rovnoběžné hrany ${c} cm a ${d} cm a výšku ${ht} cm. Jaký je jeho obsah?`,ans:(c+d)*ht/2,hints:['S = (a+c)/2 · h.',`(${c}+${d})/2·${ht} = ${(c+d)*ht/2} cm²`],skill:'geo'}); }
  return tasks;
}

// 7-2 Hranoly — povrch a objem (kvádr a krychle)
function gen_7_2(){
  const tasks=[];
  // objem kvádru
  const a=ri(3,10),b=ri(2,8),c=ri(2,6);
  tasks.push({text:`Kvádr má rozměry ${a} cm × ${b} cm × ${c} cm. Jaký je jeho objem?`,ans:a*b*c,hints:['V = a·b·c',`${a}·${b}·${c} = ${a*b*c} cm³`],skill:'geo'});
  // povrch kvádru
  const d=ri(3,8),e=ri(2,7),f=ri(2,6);
  tasks.push({text:`Kvádr ${d} × ${e} × ${f} cm. Jaký je jeho povrch?`,ans:2*(d*e+e*f+d*f),hints:['S = 2·(ab+bc+ac)',`2·(${d*e}+${e*f}+${d*f}) = ${2*(d*e+e*f+d*f)} cm²`],skill:'geo'});
  // objem krychle
  const g=ri(3,8);
  tasks.push({text:`Krychle má hranu ${g} cm. Jaký je její objem?`,ans:g*g*g,hints:['V = a³',`${g}³ = ${g*g*g} cm³`],skill:'geo'});
  // povrch krychle
  const h=ri(2,7);
  tasks.push({text:`Krychle má hranu ${h} cm. Jaký je její povrch?`,ans:6*h*h,hints:['S = 6·a²',`6·${h}² = ${6*h*h} cm²`],skill:'geo'});
  // ze zadaného objemu → hrana krychle
  const i=ri(2,6),vi=i*i*i;
  tasks.push({text:`Krychle má objem ${vi} cm³. Jaká je délka hrany?`,ans:i,hints:['a = ∛V',`∛${vi} = ${i} cm`],skill:'geo'});
  // z povrchu → hrana
  const j=ri(2,6),sj=6*j*j;
  tasks.push({text:`Krychle má povrch ${sj} cm². Jaká je délka hrany?`,ans:j,hints:['S = 6a² → a = √(S/6)',`√(${sj}/6) = ${j} cm`],skill:'geo'});
  { const a=ri(3,9),b=ri(2,7),c=ri(2,6); tasks.push({text:`Kvádr ${a}×${b}×${c} cm. Objem?`,ans:a*b*c,hints:['V = a·b·c.',`${a*b*c} cm³`],skill:'geo'}); }
  { const d=ri(3,8),e=ri(2,6),f=ri(2,5); tasks.push({text:`Kvádr ${d}×${e}×${f} cm. Povrch?`,ans:2*(d*e+e*f+d*f),hints:['S = 2(ab+bc+ac).',`${2*(d*e+e*f+d*f)} cm²`],skill:'geo'}); }
  { const g=ri(2,7); tasks.push({text:`Krychle se stranou ${g} cm. Objem?`,ans:g*g*g,hints:['V = a³.',`${g*g*g} cm³`],skill:'geo'}); }
  { const h=ri(3,9),vv=ri(4,12),sv=h*h*vv; tasks.push({text:`Hranol s čtvercovou základnou strany ${h} cm a výškou ${vv} cm. Objem?`,ans:sv,hints:['V = základna × výška.',`${h}²×${vv} = ${sv} cm³`],skill:'geo'}); }
  // thematické
  { const a=ri(3,9),b=ri(2,7),c=ri(2,6); tasks.push({text:`Truhlice má tvar kvádru ${a} × ${b} × ${c} dm. Jaký je její objem v dm³?`,ans:a*b*c,hints:['V = a·b·c.',`${a}·${b}·${c} = ${a*b*c} dm³`],skill:'geo'}); }
  { const g=ri(2,6); tasks.push({text:`Obětní oltář je kamenná krychle o hraně ${g} dm. Kolik dm² má jeho povrch?`,ans:6*g*g,hints:['S = 6·a².',`6·${g}² = ${6*g*g} dm²`],skill:'geo'}); }
  return tasks;
}

// 7-3 Finální duel — mix všech témat
function gen_7_3(){
  const tasks=[];
  // zlomky + celá čísla
  const a=ri(2,6),b=ri(3,8);const g=gcd(a,b);
  tasks.push({text:`Výsledek: ${a}/${b} + ${b-a}/${b} = ?`,ans:'1',hints:['Stejný jmenovatel, přičti čitatele.',''+a+'/'+ b+' + '+(b-a)+'/'+b+' = '+b+'/'+b+' = 1'],skill:'calc'});
  // procenta
  const c=ri(10,30)*10,p=ri(10,30);
  tasks.push({text:`${p} % z ${c} = ?`,ans:Math.round(p/100*c),hints:['Část = základ × p/100.',''+Math.round(p/100*c)],skill:'calc'});
  // obvod + obsah čtverce
  const d=ri(4,10);
  tasks.push({text:`Čtverec se stranou ${d} cm. Jaký je jeho obvod?`,ans:4*d,hints:['O = 4a','4·'+d+' = '+4*d],skill:'geo'});
  // celá čísla — součin záporných
  const e=ri(2,9),f=ri(2,9);
  tasks.push({text:`(−${e}) × (−${f}) = ?`,ans:e*f,hints:['Záporné × záporné = kladné.','= '+(e*f)],skill:'calc'});
  // objem kvádru
  const g2=ri(3,7),h=ri(2,5),i=ri(2,5);
  tasks.push({text:`Kvádr ${g2} × ${h} × ${i} cm. Objem?`,ans:g2*h*i,hints:['V = a·b·c',`${g2*h*i} cm³`],skill:'geo'});
  // poměr
  const j=ri(2,5),k=ri(2,5),tot=ri(10,30)*(j+k);
  tasks.push({text:`Rozděl ${tot} v poměru ${j} : ${k}. První díl?`,ans:Math.round(tot*j/(j+k)),hints:['1 díl = '+(tot/(j+k))+', pak × '+j,''+Math.round(tot*j/(j+k))],skill:'anal'});
  { const a=ri(5,20),b=ri(3,12); tasks.push({text:`(−${a}) + ${b} = ?`,ans:b-a,hints:['Záporné + kladné: odečti menší od většího.',`${b}−${a} = ${b-a}`],skill:'calc'}); }
  { const c=ri(1,4)*10,d=ri(3,8)*100; tasks.push({text:`${c} % z ${d} = ?`,ans:Math.round(c/100*d),hints:['část = základ × p/100.','= '+Math.round(c/100*d)],skill:'calc'}); }
  { const e=ri(4,12),f=ri(3,10),ht=ri(3,8); tasks.push({text:`Lichoběžník, základny ${e} a ${f} cm, výška ${ht} cm. Obsah?`,ans:(e+f)*ht/2,hints:['S = (a+c)/2·h.',`${(e+f)*ht/2} cm²`],skill:'geo'}); }
  { const g=ri(3,7),h2=ri(2,5);const top=1*g+ri(1,g-1);const g2=gcd(top,g);const ans=g2===g?String(top/g2):`${top/g2}/${g/g2}`;tasks.push({text:`${h2}/${g} + ${g-h2}/${g} = ?`,ans:'1',hints:['Jmenovatelé stejní, sečti čitatele.',`${h2}+(${g-h2}) = ${g}, tj. ${g}/${g} = 1`],skill:'calc'}); }
  // framing pool na bare drily
  { const e=ri(2,9),f=ri(2,9); tasks.push({text:askCalc(`(−${e}) × (−${f})`),ans:e*f,hints:['Záporné × záporné = kladné.',`= ${e*f}`],skill:'calc'}); }
  { const p=ri(10,30),c=ri(10,30)*10; tasks.push({text:askCalc(`${p} % z ${c}`),ans:Math.round(p/100*c),hints:['část = základ × p/100.',`= ${Math.round(p/100*c)}`],skill:'calc'}); }
  // thematické
  { const kn=ri(3,9)*20,p=[10,25,50][ri(0,2)]; tasks.push({text:`V truhlici je ${kn} zlatých ${skl(kn,'minci','mince','mincí')}, ${p} % z nich je pravých. Kolik pravých mincí truhlice ukrývá?`,ans:Math.round(p/100*kn),hints:['část = základ × p/100.',`= ${Math.round(p/100*kn)}`],skill:'calc'}); }
  { const a=ri(3,7),b=ri(2,5),c=ri(2,5); tasks.push({text:`Kamenná truhlice tvaru kvádru měří ${a} × ${b} × ${c} dm. Jaký je její objem?`,ans:a*b*c,hints:['V = a·b·c.',`${a*b*c} dm³`],skill:'geo'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
window.RPG_TASK_EXTRA_7 = {
  '1-1':gen_1_1,'1-2':gen_1_2,'1-3':gen_1_3,
  '2-1':gen_2_1,'2-2':gen_2_2,'2-3':gen_2_3,
  '3-1':gen_3_1,'3-2':gen_3_2,'3-3':gen_3_3,
  '4-1':gen_4_1,'4-2':gen_4_2,'4-3':gen_4_3,
  '5-1':gen_5_1,'5-2':gen_5_2,'5-3':gen_5_3,
  '6-1':gen_6_1,'6-2':gen_6_2,'6-3':gen_6_3,
  '7-1':gen_7_1,'7-2':gen_7_2,'7-3':gen_7_3
};
})();
