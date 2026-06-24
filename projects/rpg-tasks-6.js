// Rozšiřující banka úloh pro rpg-mat-6.html — Vesmírná expedice 🚀
// window.RPG_TASK_EXTRA_6 = { '<mid>': () => [task, ...], ... }
(function(){
'use strict';
const ri = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}
const skl = (n,one,few,many)=>n===1?one:(n>=2&&n<=4?few:many);
const cz = n => String(n).replace('.',',');
const r1 = n => cz(Math.round(n*10)/10);
const r2 = n => cz(Math.round(n*100)/100);

// ══════════════════════════════════════════════════════════
// OBLAST 1 — ODLETOVÁ STANICE
// ══════════════════════════════════════════════════════════

// 1-1 Přirozená čísla (MC — jen numerické)
function gen_1_1(){
  const tasks=[];
  const a=ri(120,890),b=ri(110,540);
  tasks.push({text:`Vypočítej: ${a} + ${b} = ?`,ans:a+b,hints:['Sčítej po řádech (jednotky, desítky, stovky).',`${a}+${b} = ${a+b}`],skill:'calc'});
  const c=ri(400,990),d=ri(110,c-50);
  tasks.push({text:`Vypočítej: ${c} − ${d} = ?`,ans:c-d,hints:['Odečítej po řádech, hlídej výpůjčku.',`${c}−${d} = ${c-d}`],skill:'calc'});
  const e=ri(12,40),f=ri(11,30);
  tasks.push({text:`Vypočítej: ${e} × ${f} = ?`,ans:e*f,hints:[`Rozlož ${f} na desítky a jednotky.`,`${e}×${f} = ${e*f}`],skill:'calc'});
  const g=ri(3,9),h=g*ri(10,30);
  tasks.push({text:`Vypočítej: ${h} : ${g} = ?`,ans:h/g,hints:['Kolikrát se '+g+' vejde do '+h+'?',`${h}:${g} = ${h/g}`],skill:'calc'});
  const i=ri(100,900);
  tasks.push({text:`Zaokrouhli ${i} na stovky.`,ans:Math.round(i/100)*100,hints:['Podívej se na číslici desítek.',`≈ ${Math.round(i/100)*100}`],skill:'calc'});
  const j=ri(2,9),k=ri(2,9),l=ri(2,9);
  tasks.push({text:`Vypočítej: ${j} × ${k} + ${l} = ?`,ans:j*k+l,hints:['Nejdřív násobení, pak sčítání.',`${j*k}+${l} = ${j*k+l}`],skill:'calc'});
  { const a=ri(300,900),b=ri(50,250),c=ri(20,90); tasks.push({text:`Vypočítej: ${a} − ${b} − ${c} = ?`,ans:a-b-c,hints:['Odečítej postupně zleva doprava.',`${a}−${b} = ${a-b}, pak −${c}`],skill:'calc'}); }
  { const a=ri(13,29),b=ri(13,29); tasks.push({text:`Vypočítej: ${a} × ${b} = ?`,ans:a*b,hints:[`Rozlož ${b} na desítky a jednotky.`,`${a}×${b} = ${a*b}`],skill:'calc'}); }
  { const g=ri(4,9),h=g*ri(12,40); tasks.push({text:`Vypočítej: ${h} : ${g} = ?`,ans:h/g,hints:[`Kolikrát se ${g} vejde do ${h}?`,`${h}:${g} = ${h/g}`],skill:'calc'}); }
  { const a=ri(2,9),b=ri(2,9),c=ri(2,12); tasks.push({text:`Vypočítej: ${a} × ${b} − ${c} = ?`,ans:a*b-c,hints:['Nejdřív násobení, pak odčítání.',`${a*b}−${c} = ${a*b-c}`],skill:'calc'}); }
  return tasks;
}

// 1-2 Obvod a obsah (obdélník a čtverec)
function gen_1_2(){
  const tasks=[];
  const a=ri(4,15),b=ri(2,a-1);
  tasks.push({text:`Obdélník má strany ${a} cm a ${b} cm. Jaký je jeho obvod?`,ans:2*(a+b),hints:['Obvod = 2·(a+b).',`2·(${a}+${b}) = ${2*(a+b)} cm`],skill:'geo'});
  const c=ri(3,14),d=ri(3,12);
  tasks.push({text:`Obdélník má strany ${c} cm a ${d} cm. Jaký je jeho obsah?`,ans:c*d,hints:['S = a·b.',`${c}·${d} = ${c*d} cm²`],skill:'geo'});
  const e=ri(3,15);
  tasks.push({text:`Čtverec má stranu ${e} cm. Jaký je jeho obvod?`,ans:4*e,hints:['Obvod čtverce = 4·a.',`4·${e} = ${4*e} cm`],skill:'geo'});
  const f=ri(3,15);
  tasks.push({text:`Čtverec má stranu ${f} cm. Jaký je jeho obsah?`,ans:f*f,hints:['S = a².',`${f}² = ${f*f} cm²`],skill:'geo'});
  const g=ri(5,12),h=g*ri(2,4);
  tasks.push({text:`Obdélník má obvod ${2*(g+h)} cm a jednu stranu ${g} cm. Jak dlouhá je druhá strana?`,ans:h,hints:['Obvod/2 − známá strana.',`${(g+h)}−${g} = ${h} cm`],skill:'geo'});
  const i=ri(3,12),sq=i*i;
  tasks.push({text:`Čtverec má obsah ${sq} cm². Jak dlouhá je jeho strana?`,ans:i,hints:['a = √S.',`√${sq} = ${i} cm`],skill:'geo'});
  { const a=ri(4,12),b=ri(3,10); tasks.push({text:`Obdélník ${a} × ${b} cm. Kolik cm² je jeho obsah?`,ans:a*b,hints:['S = a·b.',`${a}·${b} = ${a*b} cm²`],skill:'geo'}); }
  { const a=ri(4,12); tasks.push({text:`Čtverec se stranou ${a} cm. Jaký je jeho obvod?`,ans:4*a,hints:['o = 4·a.',`4·${a} = ${4*a} cm`],skill:'geo'}); }
  { const a=ri(6,14),o=4*a; tasks.push({text:`Čtverec má obvod ${o} cm. Jak dlouhá je strana?`,ans:a,hints:['a = o/4.',`${o}/4 = ${a} cm`],skill:'geo'}); }
  { const a=ri(3,10),b=ri(2,8); tasks.push({text:`Kolik dlaždic 1 × 1 cm pokryje podlahu ${a} × ${b} cm?`,ans:a*b,hints:['Počet dlaždic = obsah podlahy.',`${a}·${b} = ${a*b}`],skill:'geo'}); }
  return tasks;
}

// 1-3 Logika a slovní úlohy
function gen_1_3(){
  const tasks=[];
  const a=ri(3,9),b=ri(10,30);
  tasks.push({text:`V krabici je ${a} ${skl(a,'sáček','sáčky','sáčků')}, v každém ${b} bonbónů. Kolik bonbónů je celkem?`,ans:a*b,hints:['Počet sáčků × bonbonů v sáčku.',`${a}·${b} = ${a*b}`],skill:'anal'});
  const c=ri(50,200),d=ri(3,9);
  const rem=c%d;
  tasks.push({text:`Rozdělíme ${c} kuliček mezi ${d} ${skl(d,'dítě','děti','dětí')} rovnoměrně. Kolik kuliček zbude?`,ans:rem,hints:['Spočítej zbytek po dělení '+c+' : '+d+'.',`zbytek = ${rem}`],skill:'anal'});
  const e=ri(2,6),f=ri(20,60);
  tasks.push({text:`Auto ujede za hodinu ${f} km. Kolik km ujede za ${e} ${skl(e,'hodinu','hodiny','hodin')}?`,ans:e*f,hints:['Vzdálenost = rychlost × čas.',`${e}·${f} = ${e*f} km`],skill:'anal'});
  const g=ri(100,500),h=ri(20,80);
  tasks.push({text:`Máš ${g} Kč a utratíš ${h} Kč. Kolik ti zbude?`,ans:g-h,hints:['Odečti utracenou částku.',`${g}−${h} = ${g-h} Kč`],skill:'anal'});
  const k=ri(2,5),l=ri(3,8);
  tasks.push({text:`Pavouk má 8 nohou. Kolik nohou má ${k*l} pavouků?`,ans:8*k*l,hints:['Počet pavouků × 8.',`${k*l}·8 = ${8*k*l}`],skill:'anal'});
  const m=ri(5,12);
  tasks.push({text:`Číslo zvětšíme o 7 a dostaneme ${m+7}. Jaké bylo původní číslo?`,ans:m,hints:['Odečti 7.',`${m+7}−7 = ${m}`],skill:'anal'});
  { const a=ri(3,8),b=ri(12,40); tasks.push({text:`${a} ${skl(a,'bedna obsahuje','bedny obsahují','beden obsahuje')} ${b} kusů. Kolik kusů je celkem?`,ans:a*b,hints:['Počet beden × kusů v bedně.',`${a}·${b} = ${a*b}`],skill:'anal'}); }
  { const c=ri(50,200),d=ri(3,8); tasks.push({text:`Rozdělíme ${c*d} Kč mezi ${d} ${skl(d,'kamaráda','kamarády','kamarádů')} rovným dílem. Kolik dostane každý? (Kč)`,ans:c,hints:['Děl celkovou částku počtem lidí.',`${c*d}/${d} = ${c} Kč`],skill:'anal'}); }
  { const e=ri(3,9),f=ri(15,40); tasks.push({text:`Loď pluje ${f} km/h. Kolik km uplave za ${e} ${skl(e,'hodinu','hodiny','hodin')}?`,ans:e*f,hints:['Dráha = rychlost × čas.',`${e}·${f} = ${e*f} km`],skill:'anal'}); }
  { const g=ri(8,20); tasks.push({text:`Číslo zmenšíme o 9 a dostaneme ${g}. Jaké bylo původní číslo?`,ans:g+9,hints:['Přičti 9 zpět.',`${g}+9 = ${g+9}`],skill:'anal'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 2 — PLANETA DESETIN
// ══════════════════════════════════════════════════════════

// 2-1 Desetinná čísla (MC — numerické)
function gen_2_1(){
  const tasks=[];
  const a=ri(10,90)/10;
  tasks.push({text:`Zaokrouhli ${cz(a)} na celé číslo.`,ans:Math.round(a),hints:['Podívej se na desetiny.',`≈ ${Math.round(a)}`],skill:'calc'});
  const b=ri(100,990)/100;
  tasks.push({text:`Zaokrouhli ${cz(b)} na desetiny.`,ans:r1(b),hints:['Podívej se na setiny.',`≈ ${r1(b)}`],skill:'calc'});
  const c=ri(10,50)/10,d=ri(10,40)/10;
  tasks.push({text:`${cz(c)} + ${cz(d)} = ?`,ans:r1(c+d),hints:['Zarovnej desetinné čárky.',`= ${r1(c+d)}`],skill:'calc'});
  const e=ri(2,9),f=ri(11,29)/10;
  tasks.push({text:`${e} × ${cz(f)} = ?`,ans:r1(e*f),hints:['Násob jako celá čísla a doplň čárku.',`= ${r1(e*f)}`],skill:'calc'});
  const g=ri(50,90)/10,h=ri(10,40)/10;
  tasks.push({text:`${cz(g)} − ${cz(h)} = ?`,ans:r1(g-h),hints:['Zarovnej desetinné čárky.',`= ${r1(g-h)}`],skill:'calc'});
  const i=ri(10,50);
  tasks.push({text:`Kolik je ${i} desetin jako desetinné číslo?`,ans:r1(i/10),hints:['Děl 10.',`${i}/10 = ${r1(i/10)}`],skill:'calc'});
  { const a=ri(20,90)/10; tasks.push({text:`Zaokrouhli ${cz(a)} na celé číslo.`,ans:Math.round(a),hints:['Rozhodují desetiny.',`≈ ${Math.round(a)}`],skill:'calc'}); }
  { const a=ri(20,80)/10,b=ri(10,40)/10; tasks.push({text:`${cz(a)} + ${cz(b)} = ?`,ans:r1(a+b),hints:['Zarovnej desetinné čárky pod sebe.',`= ${r1(a+b)}`],skill:'calc'}); }
  { const a=ri(2,9),b=ri(11,29)/10; tasks.push({text:`${a} × ${cz(b)} = ?`,ans:r1(a*b),hints:['Násob jako celá čísla a doplň čárku.',`= ${r1(a*b)}`],skill:'calc'}); }
  { const a=ri(50,99)/10,b=ri(10,40)/10; tasks.push({text:`${cz(a)} − ${cz(b)} = ?`,ans:r1(a-b),hints:['Zarovnej desetinné čárky pod sebe.',`= ${r1(a-b)}`],skill:'calc'}); }
  return tasks;
}

// 2-2 Počítání s desetinnými (+ − × :)
function gen_2_2(){
  const tasks=[];
  const a=ri(100,500)/10,b=ri(50,300)/10;
  tasks.push({text:`${cz(a)} + ${cz(b)} = ?`,ans:r1(a+b),hints:['Zarovnej čárky pod sebe.',`= ${r1(a+b)}`],skill:'calc'});
  const c=ri(200,600)/10,d=ri(50,c*10-50)/10;
  tasks.push({text:`${cz(c)} − ${cz(d)} = ?`,ans:r1(c-d),hints:['Zarovnej čárky pod sebe.',`= ${r1(c-d)}`],skill:'calc'});
  const e=ri(11,49)/10,f=ri(2,6);
  tasks.push({text:`${cz(e)} × ${f} = ?`,ans:r1(e*f),hints:['Násob jako celá, pak doplň čárku.',`= ${r1(e*f)}`],skill:'calc'});
  const g=ri(2,5),h=ri(10,40)/10;
  tasks.push({text:`${cz(h*g)} : ${g} = ?`,ans:r1(h),hints:['Děl jako celá čísla, hlídej čárku.',`= ${r1(h)}`],skill:'calc'});
  const i=ri(10,30)/10,j=ri(10,30)/10;
  tasks.push({text:`${cz(i)} × ${cz(j)} = ?`,ans:r2(i*j),hints:['Spočítej '+Math.round(i*10)+'×'+Math.round(j*10)+' a poděl 100.',`= ${r2(i*j)}`],skill:'calc'});
  const k=ri(20,80)/10,l=ri(20,80)/10;
  tasks.push({text:`Kolik zaplatím za 2 položky: ${cz(k)} Kč a ${cz(l)} Kč?`,ans:r1(k+l),hints:['Sečti obě ceny.',`= ${r1(k+l)} Kč`],skill:'calc'});
  { const a=ri(100,500)/10,b=ri(50,250)/10; tasks.push({text:`${cz(a)} + ${cz(b)} = ?`,ans:r1(a+b),hints:['Zarovnej čárky pod sebe.',`= ${r1(a+b)}`],skill:'calc'}); }
  { const a=ri(30,49)/10,b=ri(2,6); tasks.push({text:`${cz(a)} × ${b} = ?`,ans:r1(a*b),hints:['Násob jako celá čísla, pak doplň čárku.',`= ${r1(a*b)}`],skill:'calc'}); }
  { const b=ri(2,5),h=ri(10,40)/10; tasks.push({text:`${r1(h*b)} : ${b} = ?`,ans:r1(h),hints:['Děl jako celá čísla, hlídej čárku.',`= ${r1(h)}`],skill:'calc'}); }
  { const a=ri(100,990)/100; tasks.push({text:`Zaokrouhli ${cz(a)} na desetiny.`,ans:r1(a),hints:['Rozhodují setiny.',`≈ ${r1(a)}`],skill:'calc'}); }
  return tasks;
}

// 2-3 Zlomky a průměr
function gen_2_3(){
  const tasks=[];
  const d=ri(4,9),a=ri(1,d-2),b=ri(1,d-a-1)||1;
  const num=a+b,g=gcd(num,d);
  const ans1=g===d?String(num/g):`${num/g}/${d/g}`;
  tasks.push({text:`${a}/${d} + ${b}/${d} = ?`,ans:ans1,hints:['Stejný jmenovatel: sčítej čitatele.',`${a}+${b} = ${num}, tedy ${num}/${d}`],skill:'calc'});
  const e=ri(5,9),c=ri(2,e-1),f=ri(1,c-1)||1;
  const numD=c-f,gD=gcd(numD,e);
  const ans2=numD===0?'0':(gD===e?String(numD/gD):`${numD/gD}/${e/gD}`);
  tasks.push({text:`${c}/${e} − ${f}/${e} = ?`,ans:ans2,hints:['Stejný jmenovatel: odečti čitatele.',`${c}−${f} = ${numD}, tedy ${numD}/${e}`],skill:'calc'});
  // průměr dvou čísel
  const x=ri(2,9)*2,y=ri(2,9)*2;
  tasks.push({text:`Jaký je aritmetický průměr čísel ${x} a ${y}?`,ans:(x+y)/2,hints:['Součet / počet.',`(${x}+${y})/2 = ${(x+y)/2}`],skill:'anal'});
  // průměr tří čísel
  const p=ri(2,9),q=ri(2,9),rr=3*ri(3,9)-p-q;
  tasks.push({text:`Jaký je průměr čísel ${p}, ${q} a ${rr}?`,ans:(p+q+rr)/3,hints:['Součet všech / 3.',`(${p}+${q}+${rr})/3 = ${(p+q+rr)/3}`],skill:'anal'});
  // zlomek z čísla
  const dd=ri(2,5),nn=dd*ri(3,8);
  tasks.push({text:`Kolik je ${1}/${dd} z čísla ${nn}?`,ans:nn/dd,hints:['Děl číslo jmenovatelem.',`${nn}/${dd} = ${nn/dd}`],skill:'calc'});
  // průměr známek
  const z1=ri(1,3),z2=ri(1,3),z3=ri(1,3),z4=ri(1,3);
  tasks.push({text:`Žák má známky ${z1}, ${z2}, ${z3}, ${z4}. Jaký je jejich průměr? (na 2 desetinná místa)`,ans:r2((z1+z2+z3+z4)/4),hints:['Součet / 4.',`= ${r2((z1+z2+z3+z4)/4)}`],skill:'anal'});
  { const d=ri(4,9),a=ri(1,d-1),b=ri(1,d-1),num=a+b,g=gcd(num,d); tasks.push({text:`${a}/${d} + ${b}/${d} = ?`,ans:(d/g===1?String(num/g):`${num/g}/${d/g}`),hints:['Stejný jmenovatel: sčítej čitatele.',`${a}+${b} = ${num}, tedy ${num}/${d}`],skill:'calc'}); }
  { const x=ri(2,9)*2,y=ri(2,9)*2; tasks.push({text:`Jaký je aritmetický průměr čísel ${x} a ${y}?`,ans:(x+y)/2,hints:['Součet / 2.',`(${x}+${y})/2 = ${(x+y)/2}`],skill:'anal'}); }
  { const p=ri(2,9),q=ri(2,9); let rr=ri(2,9); while((p+q+rr)%3!==0)rr++; tasks.push({text:`Jaký je průměr čísel ${p}, ${q} a ${rr}?`,ans:(p+q+rr)/3,hints:['Součet všech / 3.',`(${p}+${q}+${rr})/3 = ${(p+q+rr)/3}`],skill:'anal'}); }
  { const dd=ri(2,5),nn=dd*ri(3,8); tasks.push({text:`Kolik je 1/${dd} z čísla ${nn}?`,ans:nn/dd,hints:['Děl číslo jmenovatelem.',`${nn}/${dd} = ${nn/dd}`],skill:'calc'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 3 — POLE DĚLITELNOSTI
// ══════════════════════════════════════════════════════════

// 3-1 Znaky dělitelnosti (2,3,4,5,9,10)
function gen_3_1(){
  const tasks=[];
  const a=ri(10,99)*2;
  tasks.push({text:`Je číslo ${a} dělitelné 2?`,ans:'ANO',hints:['Sudé číslo končí 0,2,4,6,8.','ANO'],skill:'anal'});
  const b=ri(10,99)*2+1;
  tasks.push({text:`Je číslo ${b} dělitelné 2?`,ans:'NE',hints:['Liché číslo není dělitelné 2.','NE'],skill:'anal'});
  const c=ri(10,99)*5;
  tasks.push({text:`Je číslo ${c} dělitelné 5?`,ans:'ANO',hints:['Dělitelné 5 končí 0 nebo 5.','ANO'],skill:'anal'});
  const d=ri(10,33)*3;
  tasks.push({text:`Je číslo ${d} dělitelné 3?`,ans:'ANO',hints:['Sečti číslice; je-li součet dělitelný 3, je i číslo.','ANO'],skill:'anal'});
  const e=ri(10,99)*10;
  tasks.push({text:`Je číslo ${e} dělitelné 10?`,ans:'ANO',hints:['Dělitelné 10 končí na 0.','ANO'],skill:'anal'});
  const fbase=ri(11,40),f=fbase*9;
  tasks.push({text:`Je číslo ${f} dělitelné 9?`,ans:'ANO',hints:['Ciferný součet dělitelný 9 → číslo dělitelné 9.','ANO'],skill:'anal'});
  { const a=ri(10,99)*4; tasks.push({text:`Je číslo ${a} dělitelné 4?`,ans:'ANO',hints:['Dělitelné 4: poslední dvojčíslí dělitelné 4.','ANO'],skill:'anal'}); }
  { const a=ri(10,99)*2+1; tasks.push({text:`Je číslo ${a} dělitelné 5?`,ans:(a%5===0?'ANO':'NE'),hints:['Dělitelné 5 končí na 0 nebo 5.',(a%5===0?'ANO':'NE')],skill:'anal'}); }
  { const a=ri(10,30)*3; tasks.push({text:`Je číslo ${a} dělitelné 3?`,ans:'ANO',hints:['Sečti číslice; součet dělitelný 3 → číslo dělitelné 3.','ANO'],skill:'anal'}); }
  { const a=ri(11,40)*6; tasks.push({text:`Je číslo ${a} dělitelné 6?`,ans:'ANO',hints:['Dělitelné 6 = dělitelné 2 i 3 zároveň.','ANO'],skill:'anal'}); }
  return tasks;
}

// 3-2 Prvočísla a dělitelé (MC — numerické nebo ANO/NE)
function gen_3_2(){
  const tasks=[];
  const primes=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
  const p=primes[ri(0,primes.length-1)];
  tasks.push({text:`Je číslo ${p} prvočíslo?`,ans:'ANO',hints:['Prvočíslo má právě 2 dělitele: 1 a sebe.','ANO'],skill:'anal'});
  const comp=ri(2,9)*ri(2,9);
  const isPrime=primes.includes(comp);
  tasks.push({text:`Je číslo ${comp} prvočíslo?`,ans:isPrime?'ANO':'NE',hints:['Má více než 2 dělitele?',isPrime?'ANO':'NE — je složené'],skill:'anal'});
  // počet dělitelů malého čísla
  const n=ri(6,24);
  let cnt=0;for(let i=1;i<=n;i++)if(n%i===0)cnt++;
  tasks.push({text:`Kolik dělitelů má číslo ${n}?`,ans:cnt,hints:['Vypiš všechna čísla, kterými ${n} beze zbytku dělíš.',`${n} má ${cnt} dělitelů`],skill:'anal'});
  // nejmenší prvočinitel
  const m=ri(2,6)*ri(2,6);
  let sf=2;while(m%sf!==0)sf++;
  tasks.push({text:`Jaký je nejmenší prvočíselný dělitel čísla ${m}?`,ans:sf,hints:['Zkus postupně 2, 3, 5, …',`= ${sf}`],skill:'anal'});
  // je dělitelem?
  const big=ri(3,9),mult=big*ri(2,6);
  tasks.push({text:`Je číslo ${big} dělitelem čísla ${mult}?`,ans:'ANO',hints:['Vydělí ${big} číslo ${mult} beze zbytku?','ANO'],skill:'anal'});
  // další prvočíslo
  const q=primes[ri(0,9)];
  tasks.push({text:`Je číslo ${q+1} prvočíslo?`,ans:primes.includes(q+1)?'ANO':'NE',hints:['Zkontroluj dělitele.',primes.includes(q+1)?'ANO':'NE'],skill:'anal'});
  { const pr=[2,3,5,7,11,13,17,19,23]; const p2=pr[ri(0,pr.length-1)]; tasks.push({text:`Je číslo ${p2} prvočíslo?`,ans:'ANO',hints:['Prvočíslo má právě 2 dělitele: 1 a sebe.','ANO'],skill:'anal'}); }
  { const n=ri(8,30); let cnt=0; for(let i2=1;i2<=n;i2++)if(n%i2===0)cnt++; tasks.push({text:`Kolik dělitelů má číslo ${n}?`,ans:cnt,hints:['Vypiš všechna čísla, kterými ho beze zbytku vydělíš.',`${n} má ${cnt} dělitelů`],skill:'anal'}); }
  { const m=ri(2,6)*ri(2,6); let sf=2; while(m%sf!==0)sf++; tasks.push({text:`Jaký je nejmenší prvočíselný dělitel čísla ${m}?`,ans:sf,hints:['Zkus postupně 2, 3, 5, …',`= ${sf}`],skill:'anal'}); }
  { const a=ri(4,12); tasks.push({text:`Je číslo ${a*a} druhá mocnina nějakého čísla? (ANO/NE)`,ans:'ANO',hints:[`${a}² = ${a*a}.`,'ANO'],skill:'anal'}); }
  return tasks;
}

// 3-3 NSD a NSN
function gen_3_3(){
  const tasks=[];
  function lcm(a,b){return a/gcd(a,b)*b;}
  const a=ri(2,6)*ri(2,5),b=ri(2,6)*ri(2,5);
  tasks.push({text:`Najdi největší společný dělitel NSD(${a}, ${b}).`,ans:gcd(a,b),hints:['Rozlož na prvočinitele a vyber společné.',`NSD = ${gcd(a,b)}`],skill:'anal'});
  const c=ri(2,8),d=ri(2,8);
  tasks.push({text:`Najdi nejmenší společný násobek NSN(${c}, ${d}).`,ans:lcm(c,d),hints:['NSN = a·b / NSD.',`NSN = ${lcm(c,d)}`],skill:'anal'});
  const e=ri(3,9),f=e*ri(2,4);
  tasks.push({text:`NSD(${e}, ${f}) = ? (${f} je násobek ${e})`,ans:e,hints:['Když jedno dělí druhé, NSD = menší.',`= ${e}`],skill:'anal'});
  const g=ri(2,7),h=ri(2,7);
  tasks.push({text:`NSN(${g}, ${h}) = ?`,ans:lcm(g,h),hints:['NSN = '+g+'·'+h+'/NSD.',`= ${lcm(g,h)}`],skill:'anal'});
  // koprimní
  const primesS=[2,3,5,7,11];const x=primesS[ri(0,4)],y=primesS[ri(0,4)];
  if(x!==y){tasks.push({text:`NSD(${x}, ${y}) dvou různých prvočísel = ?`,ans:1,hints:['Různá prvočísla nemají společný dělitel kromě 1.','= 1'],skill:'anal'});}
  else{tasks.push({text:`NSD(${x}, ${x*2}) = ?`,ans:x,hints:['Menší dělí větší.',`= ${x}`],skill:'anal'});}
  const i=ri(2,5),j=ri(2,5);
  tasks.push({text:`NSN(${i}, ${j}) když jsou nesoudělné: jen vynásob. Výsledek?`,ans:gcd(i,j)===1?i*j:lcm(i,j),hints:['Nesoudělná čísla: NSN = součin.',`= ${gcd(i,j)===1?i*j:lcm(i,j)}`],skill:'anal'});
  { const a=ri(2,6)*ri(2,5),b=ri(2,6)*ri(2,5); tasks.push({text:`Najdi NSD(${a}, ${b}).`,ans:gcd(a,b),hints:['Rozlož na prvočinitele a vyber společné.',`NSD = ${gcd(a,b)}`],skill:'anal'}); }
  { const a=ri(2,8),b=ri(2,8),L=a/gcd(a,b)*b; tasks.push({text:`Najdi NSN(${a}, ${b}).`,ans:L,hints:['NSN = a·b / NSD.',`NSN = ${L}`],skill:'anal'}); }
  { const e2=ri(3,9),f2=e2*ri(2,4); tasks.push({text:`NSD(${e2}, ${f2}) = ? (${f2} je násobek ${e2})`,ans:e2,hints:['Když menší dělí větší, NSD = menší.',`= ${e2}`],skill:'anal'}); }
  { const p=[2,3,5,7][ri(0,3)],q=[11,13,17][ri(0,2)]; tasks.push({text:`NSN dvou nesoudělných čísel ${p} a ${q}?`,ans:p*q,hints:['Nesoudělná čísla: NSN = jejich součin.',`${p}·${q} = ${p*q}`],skill:'anal'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 4 — MLHOVINA ÚHLŮ
// ══════════════════════════════════════════════════════════

// 4-1 Druhy a velikosti úhlů (ostrý/pravý/tupý) — non-MC, ANO/NE + numerické
function gen_4_1(){
  const tasks=[];
  const a=ri(10,80);
  tasks.push({text:`Úhel má velikost ${a}°. Je to ostrý úhel? (ostrý < 90°)`,ans:'ANO',hints:['Ostrý úhel je menší než 90°.','ANO'],skill:'geo'});
  const b=ri(100,170);
  tasks.push({text:`Úhel má velikost ${b}°. Je to tupý úhel? (tupý 90°–180°)`,ans:'ANO',hints:['Tupý úhel je mezi 90° a 180°.','ANO'],skill:'geo'});
  tasks.push({text:`Kolik stupňů má pravý úhel?`,ans:90,hints:['Čtvrtina otáčky.','90°'],skill:'geo'});
  tasks.push({text:`Kolik stupňů má přímý úhel?`,ans:180,hints:['Polovina otáčky.','180°'],skill:'geo'});
  const c=ri(10,80);
  tasks.push({text:`Úhel ${c}° doplň do pravého úhlu. Kolik stupňů chybí?`,ans:90-c,hints:['Pravý úhel = 90°.',`90−${c} = ${90-c}°`],skill:'geo'});
  const d=ri(95,150);
  tasks.push({text:`Je úhel ${d}° ostrý? (ostrý < 90°)`,ans:'NE',hints:['${d}° je větší než 90°.','NE — je tupý'],skill:'geo'});
  { const a=ri(10,80); tasks.push({text:`Je úhel ${a}° ostrý? (ostrý < 90°)`,ans:'ANO',hints:['Ostrý úhel je menší než 90°.','ANO'],skill:'geo'}); }
  { const a=ri(100,170); tasks.push({text:`Je úhel ${a}° tupý? (tupý 90°–180°)`,ans:'ANO',hints:['Tupý úhel je mezi 90° a 180°.','ANO'],skill:'geo'}); }
  { const a=ri(10,80); tasks.push({text:`Doplň úhel ${a}° do přímého úhlu (180°). Kolik stupňů chybí?`,ans:180-a,hints:['180 − daný úhel.',`= ${180-a}°`],skill:'geo'}); }
  { tasks.push({text:`Kolik stupňů má plný úhel (celá otáčka)?`,ans:360,hints:['Celá otáčka kolem bodu.','360°'],skill:'geo'}); }
  return tasks;
}

// 4-2 Vedlejší a vrcholové úhly
function gen_4_2(){
  const tasks=[];
  const a=ri(20,160);
  tasks.push({text:`Vedlejší úhel k úhlu ${a}° má kolik stupňů? (vedlejší úhly dají dohromady 180°)`,ans:180-a,hints:['Vedlejší úhly: součet = 180°.',`180−${a} = ${180-a}°`],skill:'geo'});
  const b=ri(20,160);
  tasks.push({text:`Vrcholový úhel k úhlu ${b}° má kolik stupňů?`,ans:b,hints:['Vrcholové úhly jsou shodné.',`= ${b}°`],skill:'geo'});
  const c=ri(30,80);
  tasks.push({text:`Dva vedlejší úhly. Jeden má ${c}°. Druhý?`,ans:180-c,hints:['Součet vedlejších = 180°.',`= ${180-c}°`],skill:'geo'});
  const d=ri(40,140);
  tasks.push({text:`Je vrcholový úhel k úhlu ${d}° také ${d}°?`,ans:'ANO',hints:['Vrcholové úhly jsou vždy shodné.','ANO'],skill:'geo'});
  const e=ri(30,90);
  tasks.push({text:`Součet úhlu a jeho vedlejšího úhlu je vždy kolik stupňů?`,ans:180,hints:['To je definice vedlejších úhlů.','180°'],skill:'geo'});
  const f=ri(50,130);
  tasks.push({text:`Úhel je ${f}°. Kolik stupňů má jeho vedlejší úhel?`,ans:180-f,hints:['180 − daný úhel.',`= ${180-f}°`],skill:'geo'});
  { const a=ri(20,160); tasks.push({text:`Vedlejší úhel k úhlu ${a}°? (součet = 180°)`,ans:180-a,hints:['180 − daný úhel.',`= ${180-a}°`],skill:'geo'}); }
  { const a=ri(20,160); tasks.push({text:`Vrcholový úhel k úhlu ${a}°?`,ans:a,hints:['Vrcholové úhly jsou shodné.',`= ${a}°`],skill:'geo'}); }
  { const a=ri(30,80); tasks.push({text:`Jeden ze dvou vedlejších úhlů je ${a}°. Druhý?`,ans:180-a,hints:['Součet vedlejších = 180°.',`= ${180-a}°`],skill:'geo'}); }
  { const a=ri(40,140); tasks.push({text:`Jsou vrcholové úhly vždy shodné? (ANO/NE)`,ans:'ANO',hints:['Ano, mají stejnou velikost.','ANO'],skill:'geo'}); }
  return tasks;
}

// 4-3 Úhly ve stupních a minutách
function gen_4_3(){
  const tasks=[];
  const a=ri(10,40),b=ri(10,29),c=ri(10,40),d=ri(10,29);
  let mm=b+d,carry=0;if(mm>=60){mm-=60;carry=1;}
  tasks.push({text:`Sečti úhly: ${a}°${b}' + ${c}°${d}'. Kolik minut bude ve výsledku?`,ans:mm,hints:['Sečti minuty; nad 60 přenes do stupňů.',`minuty výsledku = ${mm}'`],skill:'calc'});
  const e=ri(40,80),f=ri(30,59),g=ri(10,30),h=ri(10,f-5);
  tasks.push({text:`Odečti: ${e}°${f}' − ${g}°${h}'. Kolik stupňů bude ve výsledku?`,ans:e-g,hints:['Odečti stupně a minuty zvlášť.',`stupně = ${e-g}°`],skill:'calc'});
  const deg=ri(2,5);
  tasks.push({text:`Kolik minut má ${deg}°? (1° = 60')`,ans:deg*60,hints:['1° = 60 minut.',`${deg}·60 = ${deg*60}'`],skill:'calc'});
  const mins=ri(2,9)*60;
  tasks.push({text:`Kolik celých stupňů je ${mins}'? (60' = 1°)`,ans:mins/60,hints:['Děl 60.',`${mins}/60 = ${mins/60}°`],skill:'calc'});
  const i=ri(20,70);
  tasks.push({text:`Doplněk úhlu ${i}° do 90°? (kolik chybí)`,ans:90-i,hints:['90 − daný úhel.',`= ${90-i}°`],skill:'calc'});
  const j=ri(100,160);
  tasks.push({text:`Doplněk úhlu ${j}° do 180°?`,ans:180-j,hints:['180 − daný úhel.',`= ${180-j}°`],skill:'calc'});
  { const d2=ri(2,6); tasks.push({text:`Kolik minut má ${d2}°? (1° = 60′)`,ans:d2*60,hints:['1° = 60 minut.',`${d2}·60 = ${d2*60}′`],skill:'calc'}); }
  { const m=ri(2,9)*60; tasks.push({text:`Kolik celých stupňů je ${m}′? (60′ = 1°)`,ans:m/60,hints:['Děl 60.',`${m}/60 = ${m/60}°`],skill:'calc'}); }
  { const a=ri(20,70); tasks.push({text:`Doplněk úhlu ${a}° do 90°? (kolik chybí)`,ans:90-a,hints:['90 − daný úhel.',`= ${90-a}°`],skill:'calc'}); }
  { const a=ri(10,40),b=ri(10,29),c=ri(10,40),e2=ri(10,29); let mm=b+e2; if(mm>=60)mm-=60; tasks.push({text:`Sečti úhly: ${a}°${b}′ + ${c}°${e2}′. Kolik minut bude ve výsledku?`,ans:mm,hints:['Sečti minuty; nad 60 přenes do stupňů.',`minuty = ${mm}′`],skill:'calc'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 5 — ZRCADLOVÝ MĚSÍC
// ══════════════════════════════════════════════════════════

// 5-1 Osová souměrnost (počet os)
function gen_5_1(){
  const tasks=[];
  tasks.push({text:`Kolik os souměrnosti má čtverec?`,ans:4,hints:['2 přes středy stran + 2 úhlopříčky.','4 osy'],skill:'geo'});
  tasks.push({text:`Kolik os souměrnosti má obdélník (ne čtverec)?`,ans:2,hints:['Osy přes středy protilehlých stran.','2 osy'],skill:'geo'});
  tasks.push({text:`Kolik os souměrnosti má rovnostranný trojúhelník?`,ans:3,hints:['Každá osa: vrchol → střed protilehlé strany.','3 osy'],skill:'geo'});
  tasks.push({text:`Kolik os souměrnosti má rovnoramenný trojúhelník (ne rovnostranný)?`,ans:1,hints:['Jen jedna osa přes vrchol a střed základny.','1 osa'],skill:'geo'});
  tasks.push({text:`Má kosočtverec osovou souměrnost? (ANO/NE)`,ans:'ANO',hints:['Osy = úhlopříčky kosočtverce.','ANO — 2 osy'],skill:'geo'});
  tasks.push({text:`Kolik os souměrnosti má pravidelný pětiúhelník?`,ans:5,hints:['Pravidelný n-úhelník má n os.','5 os'],skill:'geo'});
  { tasks.push({text:`Kolik os souměrnosti má čtverec?`,ans:4,hints:['2 přes středy stran + 2 úhlopříčky.','4 osy'],skill:'geo'}); }
  { tasks.push({text:`Kolik os souměrnosti má obdélník (ne čtverec)?`,ans:2,hints:['Přes středy protilehlých stran.','2 osy'],skill:'geo'}); }
  { tasks.push({text:`Má rovnostranný trojúhelník 3 osy souměrnosti? (ANO/NE)`,ans:'ANO',hints:['Z každého vrcholu jedna osa.','ANO'],skill:'geo'}); }
  { const n=[6,7,8][ri(0,2)]; tasks.push({text:`Kolik os souměrnosti má pravidelný ${n}úhelník?`,ans:n,hints:['Pravidelný n-úhelník má n os.',`${n} os`],skill:'geo'}); }
  return tasks;
}

// 5-2 Zobrazení v osové souměrnosti (souřadnice obrazu)
function gen_5_2(){
  const tasks=[];
  // osa = osa y → x se mění na -x
  const x=ri(1,8),y=ri(1,8);
  tasks.push({text:`Bod A [${x}, ${y}] zobraz v osové souměrnosti podle osy y. Jaká je x-souřadnice obrazu?`,ans:-x,hints:['Podle osy y se mění znaménko x.',`x' = −${x} = ${-x}`],skill:'geo'});
  // osa = osa x → y se mění na -y
  const x2=ri(1,8),y2=ri(1,8);
  tasks.push({text:`Bod B [${x2}, ${y2}] zobraz podle osy x. Jaká je y-souřadnice obrazu?`,ans:-y2,hints:['Podle osy x se mění znaménko y.',`y' = −${y2} = ${-y2}`],skill:'geo'});
  // vzdálenost od osy se zachová
  const d=ri(2,9);
  tasks.push({text:`Bod je ${d} cm od osy souměrnosti. Jak daleko je jeho obraz od osy?`,ans:d,hints:['Obraz je ve stejné vzdálenosti jako vzor.',`= ${d} cm`],skill:'geo'});
  // x na ose
  const y3=ri(1,8);
  tasks.push({text:`Bod [0, ${y3}] leží na ose y. Jaká je x-souřadnice jeho obrazu podle osy y?`,ans:0,hints:['Bod na ose se zobrazí sám na sebe.','x = 0'],skill:'geo'});
  // souřadnice obrazu podle osy y - y se nemění
  const x4=ri(1,8),y4=ri(1,8);
  tasks.push({text:`Bod [${x4}, ${y4}] podle osy y. Jaká je y-souřadnice obrazu?`,ans:y4,hints:['Podle osy y se y nemění.',`y' = ${y4}`],skill:'geo'});
  // počet samodružných
  tasks.push({text:`Bod ležící přímo na ose souměrnosti se zobrazí kam? Jaká je vzdálenost obrazu od původního bodu? (cm)`,ans:0,hints:['Samodružný bod: obraz = vzor.','0 cm'],skill:'geo'});
  { const x=ri(1,8); tasks.push({text:`Bod [${x}, 0] zobraz podle osy y. Jaká je x-souřadnice obrazu?`,ans:-x,hints:['Podle osy y se mění znaménko x.',`x' = ${-x}`],skill:'geo'}); }
  { const y=ri(1,8); tasks.push({text:`Bod [0, ${y}] zobraz podle osy x. Jaká je y-souřadnice obrazu?`,ans:-y,hints:['Podle osy x se mění znaménko y.',`y' = ${-y}`],skill:'geo'}); }
  { const x=ri(1,8),y=ri(1,8); tasks.push({text:`Bod [${x}, ${y}] zobraz podle osy x. Jaká je x-souřadnice obrazu?`,ans:x,hints:['Podle osy x se x nemění.',`x' = ${x}`],skill:'geo'}); }
  { const d=ri(2,9); tasks.push({text:`Vzor je ${d} cm od osy souměrnosti. Jak daleko je obraz od osy? (cm)`,ans:d,hints:['Obraz je ve stejné vzdálenosti jako vzor.',`= ${d} cm`],skill:'geo'}); }
  return tasks;
}

// 5-3 Shodnost útvarů
function gen_5_3(){
  const tasks=[];
  tasks.push({text:`Dva čtverce mají stranu 5 cm. Jsou shodné? (ANO/NE)`,ans:'ANO',hints:['Stejný tvar i rozměry → shodné.','ANO'],skill:'geo'});
  tasks.push({text:`Čtverec se stranou 4 cm a čtverec se stranou 6 cm. Jsou shodné?`,ans:'NE',hints:['Mají různé rozměry.','NE'],skill:'geo'});
  const a=ri(3,9);
  tasks.push({text:`Útvar má obvod ${a*4} cm a je shodný s jiným. Jaký obvod má ten druhý útvar?`,ans:a*4,hints:['Shodné útvary mají stejný obvod.',`= ${a*4} cm`],skill:'geo'});
  const b=ri(3,8);
  tasks.push({text:`Shodné obdélníky. První má obsah ${b*5} cm². Jaký obsah má druhý?`,ans:b*5,hints:['Shodné útvary mají stejný obsah.',`= ${b*5} cm²`],skill:'geo'});
  tasks.push({text:`Zachovává osová souměrnost rozměry útvaru? (ANO/NE)`,ans:'ANO',hints:['Souměrnost je shodné zobrazení.','ANO'],skill:'geo'});
  tasks.push({text:`Dva trojúhelníky mají strany 3, 4, 5 cm. Jsou shodné? (ANO/NE)`,ans:'ANO',hints:['Stejné tři strany (věta sss).','ANO'],skill:'geo'});
  { const a=ri(3,9); tasks.push({text:`Dva čtverce mají stranu ${a} cm. Jsou shodné? (ANO/NE)`,ans:'ANO',hints:['Stejný tvar i rozměry → shodné.','ANO'],skill:'geo'}); }
  { const a=ri(3,6),b=a+ri(1,4); tasks.push({text:`Čtverec se stranou ${a} cm a čtverec se stranou ${b} cm. Jsou shodné? (ANO/NE)`,ans:'NE',hints:['Mají různé rozměry.','NE'],skill:'geo'}); }
  { const a=ri(3,9); tasks.push({text:`Útvar je shodný s jiným o obvodu ${a*4} cm. Jaký obvod má ten první? (cm)`,ans:a*4,hints:['Shodné útvary mají stejný obvod.',`= ${a*4} cm`],skill:'geo'}); }
  { tasks.push({text:`Zachovává shodné zobrazení (souměrnost) obsah útvaru? (ANO/NE)`,ans:'ANO',hints:['Ano, rozměry se nemění.','ANO'],skill:'geo'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 6 — KRYCHLOVÁ STANICE
// ══════════════════════════════════════════════════════════

// 6-1 Objem krychle a kvádru
function gen_6_1(){
  const tasks=[];
  const a=ri(3,10),b=ri(2,8),c=ri(2,6);
  tasks.push({text:`Kvádr ${a} × ${b} × ${c} cm. Jaký je jeho objem?`,ans:a*b*c,hints:['V = a·b·c.',`= ${a*b*c} cm³`],skill:'geo'});
  const d=ri(2,9);
  tasks.push({text:`Krychle má hranu ${d} cm. Jaký je její objem?`,ans:d*d*d,hints:['V = a³.',`${d}³ = ${d*d*d} cm³`],skill:'geo'});
  const e=ri(2,5),vi=e*e*e;
  tasks.push({text:`Krychle má objem ${vi} cm³. Jaká je délka hrany?`,ans:e,hints:['a = ∛V.',`∛${vi} = ${e} cm`],skill:'geo'});
  const f=ri(2,8),g=ri(2,8),vol=f*g*ri(2,5);
  const h=vol/(f*g);
  tasks.push({text:`Kvádr má objem ${vol} cm³, podstava ${f} × ${g} cm. Jaká je výška?`,ans:h,hints:['v = V/(a·b).',`= ${h} cm`],skill:'geo'});
  const i=ri(3,8);
  tasks.push({text:`Bazén tvaru krychle má hranu ${i} m. Kolik m³ vody se vejde?`,ans:i*i*i,hints:['V = a³.',`= ${i*i*i} m³`],skill:'geo'});
  const j=ri(2,6),k=ri(2,6),l=ri(2,6);
  tasks.push({text:`Krabice ${j} × ${k} × ${l} cm. Objem?`,ans:j*k*l,hints:['V = a·b·c.',`= ${j*k*l} cm³`],skill:'geo'});
  { const a=ri(3,10),b=ri(2,8),c=ri(2,6); tasks.push({text:`Kvádr ${a} × ${b} × ${c} cm. Jaký je objem?`,ans:a*b*c,hints:['V = a·b·c.',`= ${a*b*c} cm³`],skill:'geo'}); }
  { const a=ri(2,9); tasks.push({text:`Krychle má hranu ${a} cm. Jaký je objem?`,ans:a*a*a,hints:['V = a³.',`${a}³ = ${a*a*a} cm³`],skill:'geo'}); }
  { const a=ri(2,5); tasks.push({text:`Krychle má objem ${a*a*a} cm³. Jak dlouhá je hrana? (cm)`,ans:a,hints:['a = ∛V.',`∛${a*a*a} = ${a} cm`],skill:'geo'}); }
  { const a=ri(2,8),b=ri(2,8),h=ri(2,5); tasks.push({text:`Kvádr: podstava ${a} × ${b} cm, výška ${h} cm. Objem?`,ans:a*b*h,hints:['V = S·v = a·b·v.',`= ${a*b*h} cm³`],skill:'geo'}); }
  return tasks;
}

// 6-2 Povrch krychle a kvádru
function gen_6_2(){
  const tasks=[];
  const a=ri(2,7);
  tasks.push({text:`Krychle má hranu ${a} cm. Jaký je její povrch?`,ans:6*a*a,hints:['S = 6·a².',`6·${a}² = ${6*a*a} cm²`],skill:'geo'});
  const b=ri(3,8),c=ri(2,7),d=ri(2,6);
  tasks.push({text:`Kvádr ${b} × ${c} × ${d} cm. Jaký je jeho povrch?`,ans:2*(b*c+c*d+b*d),hints:['S = 2·(ab+bc+ac).',`= ${2*(b*c+c*d+b*d)} cm²`],skill:'geo'});
  const e=ri(2,6),se=6*e*e;
  tasks.push({text:`Krychle má povrch ${se} cm². Jaká je délka hrany?`,ans:e,hints:['a = √(S/6).',`= ${e} cm`],skill:'geo'});
  const f=ri(2,7);
  tasks.push({text:`Kolik stěn má krychle?`,ans:6,hints:['Vezmi si kostku a počítej stěny po dvojicích — protilehlé.',''],skill:'geo'});
  const g=ri(2,6);
  tasks.push({text:`Obsah jedné stěny krychle s hranou ${g} cm?`,ans:g*g,hints:['Stěna je čtverec a².',`= ${g*g} cm²`],skill:'geo'});
  const h=ri(3,7),i=ri(2,6);
  tasks.push({text:`Kvádr má podstavu ${h} × ${i} cm. Jaký je obsah jedné podstavy?`,ans:h*i,hints:['Podstava = a·b.',`= ${h*i} cm²`],skill:'geo'});
  { const a=ri(2,7); tasks.push({text:`Krychle má hranu ${a} cm. Jaký je povrch?`,ans:6*a*a,hints:['S = 6·a².',`6·${a}² = ${6*a*a} cm²`],skill:'geo'}); }
  { const a=ri(3,8),b=ri(2,7),c=ri(2,6); tasks.push({text:`Kvádr ${a} × ${b} × ${c} cm. Jaký je povrch?`,ans:2*(a*b+b*c+a*c),hints:['S = 2(ab+bc+ac).',`= ${2*(a*b+b*c+a*c)} cm²`],skill:'geo'}); }
  { const a=ri(2,6); tasks.push({text:`Obsah jedné stěny krychle s hranou ${a} cm? (cm²)`,ans:a*a,hints:['Stěna je čtverec a².',`= ${a*a} cm²`],skill:'geo'}); }
  { tasks.push({text:`Kolik stěn má kvádr?`,ans:6,hints:['Stejně jako krychle — protilehlé po dvojicích.','6'],skill:'geo'}); }
  return tasks;
}

// 6-3 Jednotky objemu a sítě
function gen_6_3(){
  const tasks=[];
  const a=ri(2,9);
  tasks.push({text:`Kolik litrů je ${a} m³? (1 m³ = 1000 l)`,ans:a*1000,hints:['1 m³ = 1000 litrů.',`= ${a*1000} l`],skill:'calc'});
  const b=ri(2,9);
  tasks.push({text:`Kolik ml je ${b} ${skl(b,'litr','litry','litrů')}? (1 l = 1000 ml)`,ans:b*1000,hints:['1 l = 1000 ml.',`= ${b*1000} ml`],skill:'calc'});
  const c=ri(2,9);
  tasks.push({text:`Kolik cm³ je ${c} ${skl(c,'litr','litry','litrů')}? (1 l = 1000 cm³)`,ans:c*1000,hints:['1 l = 1000 cm³.',`= ${c*1000} cm³`],skill:'calc'});
  tasks.push({text:`Kolik stěn má síť krychle?`,ans:6,hints:['Síť má tolik čtverců, kolik má krychle stěn — spočítej je na kostce.',''],skill:'geo'});
  const d=ri(2,8)*1000;
  tasks.push({text:`Kolik m³ je ${d} litrů? (1000 l = 1 m³)`,ans:d/1000,hints:['Děl 1000.',`= ${d/1000} m³`],skill:'calc'});
  tasks.push({text:`Kolik hran má krychle?`,ans:12,hints:['Počítej hrany po skupinách: dolní podstava, horní podstava, svislé.',''],skill:'geo'});
  { const a=ri(2,9); tasks.push({text:`Kolik litrů je ${a} m³? (1 m³ = 1000 l)`,ans:a*1000,hints:['1 m³ = 1000 litrů.',`= ${a*1000} l`],skill:'calc'}); }
  { const a=ri(2,9); tasks.push({text:`Kolik cm³ je ${a} l? (1 l = 1000 cm³)`,ans:a*1000,hints:['1 l = 1000 cm³.',`= ${a*1000} cm³`],skill:'calc'}); }
  { const a=ri(2,8)*1000; tasks.push({text:`Kolik m³ je ${a} l? (1000 l = 1 m³)`,ans:a/1000,hints:['Děl 1000.',`= ${a/1000} m³`],skill:'calc'}); }
  { tasks.push({text:`Kolik vrcholů má krychle?`,ans:8,hints:['4 dole + 4 nahoře.','8'],skill:'geo'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 7 — TROJÚHELNÍKOVÁ GALAXIE
// ══════════════════════════════════════════════════════════

// 7-1 Úhly v trojúhelníku (součet 180°)
function gen_7_1(){
  const tasks=[];
  const a=ri(30,80),b=ri(30,80);
  tasks.push({text:`Trojúhelník má úhly ${a}° a ${b}°. Jaký je třetí úhel?`,ans:180-a-b,hints:['Součet úhlů v trojúhelníku = 180°.',`180−${a}−${b} = ${180-a-b}°`],skill:'geo'});
  const c=ri(40,70);
  tasks.push({text:`V rovnoramenném trojúhelníku jsou úhly při základně ${c}°. Jaký je vrcholový úhel?`,ans:180-2*c,hints:['180 − 2·úhel při základně.',`= ${180-2*c}°`],skill:'geo'});
  tasks.push({text:`Kolik stupňů má každý úhel v rovnostranném trojúhelníku?`,ans:60,hints:['180 / 3.','60°'],skill:'geo'});
  const d=ri(30,80);
  tasks.push({text:`Pravoúhlý trojúhelník má jeden ostrý úhel ${d}°. Jaký je druhý ostrý úhel?`,ans:90-d,hints:['Dva ostré úhly dají 90°.',`90−${d} = ${90-d}°`],skill:'geo'});
  const e=ri(50,120);
  tasks.push({text:`Dva úhly trojúhelníku dají dohromady ${e}°. Jaký je třetí úhel?`,ans:180-e,hints:['180 − součet dvou.',`= ${180-e}°`],skill:'geo'});
  const f=ri(20,60);
  tasks.push({text:`Vnější úhel trojúhelníku k vnitřnímu úhlu ${f}°? (vnější = 180 − vnitřní)`,ans:180-f,hints:['Vnější a vnitřní úhel jsou vedlejší.',`= ${180-f}°`],skill:'geo'});
  { const a=ri(30,80),b=ri(30,80); tasks.push({text:`Trojúhelník má úhly ${a}° a ${b}°. Jaký je třetí úhel?`,ans:180-a-b,hints:['Součet úhlů v trojúhelníku = 180°.',`180−${a}−${b} = ${180-a-b}°`],skill:'geo'}); }
  { const c=ri(40,70); tasks.push({text:`Rovnoramenný trojúhelník: úhly při základně ${c}°. Vrcholový úhel?`,ans:180-2*c,hints:['180 − 2·úhel při základně.',`= ${180-2*c}°`],skill:'geo'}); }
  { const d=ri(30,80); tasks.push({text:`Pravoúhlý trojúhelník, jeden ostrý úhel ${d}°. Druhý ostrý úhel?`,ans:90-d,hints:['Dva ostré úhly dají dohromady 90°.',`90−${d} = ${90-d}°`],skill:'geo'}); }
  { tasks.push({text:`Kolik stupňů má každý úhel rovnostranného trojúhelníku?`,ans:60,hints:['180 / 3.','60°'],skill:'geo'}); }
  return tasks;
}

// 7-2 Vlastnosti trojúhelníku
function gen_7_2(){
  const tasks=[];
  const a=ri(5,12),b=ri(4,11),c=ri(3,a+b-1);
  tasks.push({text:`Trojúhelník má strany ${a}, ${b}, ${c} cm. Jaký je jeho obvod?`,ans:a+b+c,hints:['Obvod = součet stran.',`= ${a+b+c} cm`],skill:'geo'});
  const d=ri(4,12),h=ri(3,10);
  tasks.push({text:`Trojúhelník má základnu ${d} cm a výšku ${h} cm. Jaký je jeho obsah?`,ans:r1(d*h/2),hints:['S = (a·v)/2.',`= ${r1(d*h/2)} cm²`],skill:'geo'});
  tasks.push({text:`Kolik výšek má trojúhelník?`,ans:3,hints:['Z každého vrcholu jedna.','3'],skill:'geo'});
  // trojúhelníková nerovnost
  const e=ri(3,6),f=ri(3,6),g=e+f+ri(1,3);
  tasks.push({text:`Mohou strany ${e}, ${f}, ${g} cm tvořit trojúhelník? (součet dvou kratších > nejdelší)`,ans:'NE',hints:['${e}+${f} musí být > ${g}.',`${e}+${f}=${e+f} ≤ ${g} → NE`],skill:'geo'});
  const h2=ri(4,7),i2=ri(4,7),j2=ri(2,h2+i2-1);
  tasks.push({text:`Mohou strany ${h2}, ${i2}, ${j2} cm tvořit trojúhelník?`,ans:(h2+i2>j2&&h2+j2>i2&&i2+j2>h2)?'ANO':'NE',hints:['Součet libovolných dvou > třetí.',(h2+i2>j2&&h2+j2>i2&&i2+j2>h2)?'ANO':'NE'],skill:'geo'});
  tasks.push({text:`Kolik vrcholů má trojúhelník?`,ans:3,hints:['Troj = tři.','3'],skill:'geo'});
  { const a=ri(5,12),b=ri(4,11),c=ri(3,a+b-1); tasks.push({text:`Trojúhelník se stranami ${a}, ${b}, ${c} cm. Jaký je obvod?`,ans:a+b+c,hints:['Obvod = součet stran.',`= ${a+b+c} cm`],skill:'geo'}); }
  { const d=ri(4,12),h=ri(2,10); tasks.push({text:`Trojúhelník: základna ${d} cm, výška ${h} cm. Obsah?`,ans:r1(d*h/2),hints:['S = (a·v)/2.',`= ${r1(d*h/2)} cm²`],skill:'geo'}); }
  { const e=ri(3,6),f=ri(3,6),g=e+f+ri(1,3); tasks.push({text:`Mohou strany ${e}, ${f}, ${g} cm tvořit trojúhelník?`,ans:'NE',hints:[`${e}+${f} = ${e+f} ≤ ${g}.`,'NE'],skill:'geo'}); }
  { const a=ri(3,7),b=ri(3,7),c=ri(Math.max(2,Math.abs(a-b)+1),a+b-1); tasks.push({text:`Mohou strany ${a}, ${b}, ${c} cm tvořit trojúhelník?`,ans:'ANO',hints:['Součet libovolných dvou > třetí.','ANO'],skill:'geo'}); }
  return tasks;
}

// 7-3 Finální duel — mix všech témat
function gen_7_3(){
  const tasks=[];
  const a=ri(30,80),b=ri(30,80);
  tasks.push({text:`Trojúhelník: úhly ${a}° a ${b}°. Třetí úhel?`,ans:180-a-b,hints:['Součet = 180°.',`= ${180-a-b}°`],skill:'geo'});
  const c=ri(2,8),d=ri(2,8),e=ri(2,6);
  tasks.push({text:`Kvádr ${c} × ${d} × ${e} cm. Objem?`,ans:c*d*e,hints:['V = a·b·c.',`= ${c*d*e} cm³`],skill:'geo'});
  const f=ri(10,50)/10,g=ri(10,40)/10;
  tasks.push({text:`${cz(f)} + ${cz(g)} = ?`,ans:r1(f+g),hints:['Zarovnej čárky.',`= ${r1(f+g)}`],skill:'calc'});
  const h=ri(2,6)*ri(2,5),i=ri(2,6)*ri(2,5);
  tasks.push({text:`NSD(${h}, ${i}) = ?`,ans:gcd(h,i),hints:['Společní prvočinitelé.',`= ${gcd(h,i)}`],skill:'anal'});
  const j=ri(20,160);
  tasks.push({text:`Vedlejší úhel k ${j}°?`,ans:180-j,hints:['180 − úhel.',`= ${180-j}°`],skill:'geo'});
  const k=ri(3,10);
  tasks.push({text:`Čtverec se stranou ${k} cm. Obsah?`,ans:k*k,hints:['S = a².',`= ${k*k} cm²`],skill:'geo'});
  { const a=ri(30,80),b=ri(30,80); tasks.push({text:`Trojúhelník: úhly ${a}° a ${b}°. Třetí úhel?`,ans:180-a-b,hints:['Součet = 180°.',`= ${180-a-b}°`],skill:'geo'}); }
  { const a=ri(2,8),b=ri(2,8),c=ri(2,6); tasks.push({text:`Kvádr ${a} × ${b} × ${c} cm. Objem?`,ans:a*b*c,hints:['V = a·b·c.',`= ${a*b*c} cm³`],skill:'geo'}); }
  { const a=ri(2,6)*ri(2,5),b=ri(2,6)*ri(2,5); tasks.push({text:`NSD(${a}, ${b}) = ?`,ans:gcd(a,b),hints:['Společní prvočinitelé.',`= ${gcd(a,b)}`],skill:'anal'}); }
  { const a=ri(20,160); tasks.push({text:`Vedlejší úhel k ${a}°?`,ans:180-a,hints:['180 − úhel.',`= ${180-a}°`],skill:'geo'}); }
  return tasks;
}

// ══════════════════════════════════════════════════════════
window.RPG_TASK_EXTRA_6 = {
  '1-1':gen_1_1,'1-2':gen_1_2,'1-3':gen_1_3,
  '2-1':gen_2_1,'2-2':gen_2_2,'2-3':gen_2_3,
  '3-1':gen_3_1,'3-2':gen_3_2,'3-3':gen_3_3,
  '4-1':gen_4_1,'4-2':gen_4_2,'4-3':gen_4_3,
  '5-1':gen_5_1,'5-2':gen_5_2,'5-3':gen_5_3,
  '6-1':gen_6_1,'6-2':gen_6_2,'6-3':gen_6_3,
  '7-1':gen_7_1,'7-2':gen_7_2,'7-3':gen_7_3
};
})();
