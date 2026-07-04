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
  const T=[
    ()=>{const a=ri(120,890),b=ri(110,540);return{text:`Vypočítej: ${a} + ${b} = ?`,ans:a+b,h1:'Sčítej po řádech (jednotky, desítky, stovky).',h2:`${a}+${b} = ${a+b}`};},
    ()=>{const c=ri(400,990),d=ri(110,c-50);return{text:`Vypočítej: ${c} − ${d} = ?`,ans:c-d,h1:'Odečítej po řádech, hlídej výpůjčku.',h2:`${c}−${d} = ${c-d}`};},
    ()=>{const e=ri(12,40),f=ri(11,30);return{text:`Vypočítej: ${e} × ${f} = ?`,ans:e*f,h1:`Rozlož ${f} na desítky a jednotky.`,h2:`${e}×${f} = ${e*f}`};},
    ()=>{const g=ri(3,9),h=g*ri(10,30);return{text:`Vypočítej: ${h} : ${g} = ?`,ans:h/g,h1:`Kolikrát se ${g} vejde do ${h}?`,h2:`${h}:${g} = ${h/g}`};},
    ()=>{const i=ri(150,899);return{text:`Zaokrouhli ${i} na stovky.`,ans:Math.round(i/100)*100,h1:'Rozhoduje číslice desítek.',h2:`≈ ${Math.round(i/100)*100}`};},
    ()=>{const i=ri(115,985);return{text:`Zaokrouhli ${i} na desítky.`,ans:Math.round(i/10)*10,h1:'Rozhoduje číslice jednotek.',h2:`≈ ${Math.round(i/10)*10}`};},
    ()=>{const j=ri(3,9),k=ri(3,9),l=ri(5,40);return{text:`Vypočítej: ${j} × ${k} + ${l} = ?`,ans:j*k+l,h1:'Nejdřív násobení, pak sčítání.',h2:`${j*k}+${l} = ${j*k+l}`};},
    ()=>{const a=ri(3,9),b=ri(3,9),c=ri(2,12);return{text:`Vypočítej: ${a} × ${b} − ${c} = ?`,ans:a*b-c,h1:'Nejdřív násobení, pak odčítání.',h2:`${a*b}−${c} = ${a*b-c}`};},
    ()=>{const a=ri(300,900),b=ri(50,250),c=ri(20,90);return{text:`Vypočítej: ${a} − ${b} − ${c} = ?`,ans:a-b-c,h1:'Odečítej postupně zleva doprava.',h2:`${a}−${b} = ${a-b}, pak −${c} = ${a-b-c}`};},
    ()=>{const a=ri(120,600),b=ri(80,380);return{text:`Doplň: ${a} + ? = ${a+b}`,ans:b,h1:`Odečti: ${a+b} − ${a}.`,h2:`= ${b}`};},
    ()=>{const b=ri(3,9),q=ri(11,40);return{text:`Doplň: ? × ${b} = ${b*q}`,ans:q,h1:`Vyděl: ${b*q} : ${b}.`,h2:`= ${q}`};},
    ()=>{const s=new Set();while(s.size<3)s.add(ri(120,980));const arr=[...s];return{text:`Které z čísel ${arr[0]}, ${arr[1]}, ${arr[2]} je největší?`,ans:Math.max(...arr),h1:'Porovnej stovky, pak nižší řády.',h2:`= ${Math.max(...arr)}`};},
    ()=>{const a=ri(200,800);return{text:`Jaký je dvojnásobek čísla ${a}?`,ans:a*2,h1:`2 × ${a}`,h2:`= ${a*2}`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
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

// 2-1 Desetinná čísla (MC — jen numerické nebo ANO/NE)
function gen_2_1(){
  const T=[
    ()=>{const a=ri(11,98)/10;return{text:`Zaokrouhli ${cz(a)} na celé číslo.`,ans:Math.round(a),h1:'Rozhoduje číslice desetin (5 a víc nahoru).',h2:`≈ ${Math.round(a)}`};},
    ()=>{const a=ri(11,98)/10;return{text:`Kolik celých jednotek je v čísle ${cz(a)}?`,ans:Math.floor(a),h1:'Celá část je číslo před desetinnou čárkou.',h2:`= ${Math.floor(a)}`};},
    ()=>{const a=ri(11,98)/10;const d=Math.round((a-Math.floor(a))*10);return{text:`Kolik desetin je za čárkou v čísle ${cz(a)}?`,ans:d,h1:'Desetiny jsou první číslice hned za čárkou.',h2:`= ${d}`};},
    ()=>{const a=ri(11,98)/10;return{text:`Vynásob číslo ${cz(a)} deseti. Kolik to je?`,ans:Math.round(a*10),h1:'Násobení deseti posune čárku o jedno místo doprava.',h2:`= ${Math.round(a*10)}`};},
    ()=>{const n=ri(11,98);return{text:`Vyděl číslo ${n*10} deseti (${n*10} : 10). Kolik to je?`,ans:n,h1:'Dělení deseti posune čárku o jedno místo doleva.',h2:`= ${n}`};},
    ()=>{const a=ri(11,98)/10;const b=ri(0,1)?Math.floor(a):Math.ceil(a)+ri(0,2);const ok=a>b;return{text:`Je číslo ${cz(a)} větší než ${b}?`,ans:ok?'ANO':'NE',h1:'Porovnej nejdřív celou část, pak desetiny.',h2:ok?'ANO':'NE'};},
    ()=>{const a=Math.round(ri(101,989))/100;return{text:`Kolik setin je za čárkou v čísle ${cz(a)}? (obě číslice za čárkou jako počet setin)`,ans:Math.round((a-Math.floor(a))*100),h1:'Setiny jsou dvě číslice za čárkou čtené jako celek.',h2:`= ${Math.round((a-Math.floor(a))*100)}`};},
    ()=>{const a=ri(11,98)/10;return{text:`Na které celé číslo zaokrouhlíš ${cz(a)}?`,ans:Math.round(a),h1:'Podívej se na desetiny.',h2:`≈ ${Math.round(a)}`};},
    ()=>{const w=ri(1,8);const a=w+0.5;return{text:`Zaokrouhlí se číslo ${cz(a)} na celé číslo ${w+1}? (polovina nahoru)`,ans:'ANO',h1:'Číslo končící ,5 se zaokrouhluje nahoru.',h2:'ANO'};},
    ()=>{const a=ri(11,98)/10;const same=ri(0,1)===0;const b=same?a:Math.round((a+(ri(0,1)?0.1:-0.1))*10)/10;const ok=Math.abs(a-b)<1e-9;return{text:`Mají čísla ${cz(a)} a ${cz(b)} stejnou hodnotu?`,ans:ok?'ANO':'NE',h1:'Porovnej celé části i desetiny.',h2:ok?'ANO':'NE'};},
    ()=>{const a=ri(2,9);return{text:`Vynásob číslo ${cz(a+0.5)} deseti. Kolik to je?`,ans:a*10+5,h1:'Posuň čárku o jedno místo doprava.',h2:`= ${a*10+5}`};},
    ()=>{const n=ri(120,980);return{text:`Vyděl číslo ${n} stem (${n} : 100) — kolik CELÝCH jednotek vyjde?`,ans:Math.floor(n/100),h1:'Celá část podílu — čárku posuň o dvě místa doleva.',h2:`= ${Math.floor(n/100)}`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// 2-2 Počítání s desetinnými (+ − × :)
function gen_2_2(){
  const T=[
    ()=>{const a=ri(100,500)/10,b=ri(50,300)/10;return{text:`Sečti: ${cz(a)} + ${cz(b)} = ?`,ans:r1(a+b),h1:'Napiš čísla pod sebe, desetinnou čárku pod čárku.',h2:`= ${r1(a+b)}`};},
    ()=>{const c=ri(300,600)/10,d=ri(50,250)/10;return{text:`Odečti: ${cz(c)} − ${cz(d)} = ?`,ans:r1(c-d),h1:'Zarovnej desetinné čárky pod sebe a odečítej.',h2:`= ${r1(c-d)}`};},
    ()=>{const e=ri(11,49)/10,f=ri(2,6);return{text:`Vynásob: ${cz(e)} × ${f} = ?`,ans:r1(e*f),h1:'Násob jako celá čísla, pak doplň čárku (jedno místo).',h2:`= ${r1(e*f)}`};},
    ()=>{const g=ri(2,5),h=ri(10,40)/10;return{text:`Vyděl: ${cz(r1(h*g))} : ${g} = ?`,ans:r1(h),h1:'Děl jako celá čísla a čárku napiš nad čárku dělence.',h2:`= ${r1(h)}`};},
    ()=>{const i=ri(11,29)/10,j=ri(11,29)/10;return{text:`Vynásob dvě desetinná: ${cz(i)} × ${cz(j)} = ?`,ans:r2(i*j),h1:`Spočítej ${Math.round(i*10)}×${Math.round(j*10)} a vyděl 100 (dvě desetinná místa).`,h2:`= ${r2(i*j)}`};},
    ()=>{const k=ri(20,80)/10,l=ri(20,80)/10;return{text:`Kolik zaplatíš za dvě položky ${cz(k)} Kč a ${cz(l)} Kč?`,ans:r1(k+l),h1:'Sečti obě ceny.',h2:`= ${r1(k+l)} Kč`};},
    ()=>{const a=ri(50,95)/10,b=ri(11,40)/10;const v=r1(a-b);return{text:`O kolik je ${cz(a)} větší než ${cz(b)}?`,ans:v,h1:'Rozdíl zjistíš odčítáním.',h2:`= ${v}`};},
    ()=>{const a=ri(20,80)/10,b=ri(11,40)/10;return{text:`Doplň chybějící sčítanec: ${cz(a)} + ? = ${cz(r1(a+b))}`,ans:r1(b),h1:'Odečti známý sčítanec od součtu.',h2:`= ${r1(b)}`};},
    ()=>{const a=ri(11,49)/10;return{text:`Kolik je trojnásobek čísla ${cz(a)}?`,ans:r1(a*3),h1:'Vynásob třemi.',h2:`= ${r1(a*3)}`};},
    ()=>{const a=ri(21,60)/10;const half=r1(a/2);return{text:`Jaká je polovina čísla ${cz(a)}?`,ans:half,h1:'Vyděl dvěma.',h2:`= ${half}`};},
    ()=>{const a=ri(20,50)/10,b=ri(10,30)/10,c=ri(10,30)/10;return{text:`Sečti tři čísla: ${cz(a)} + ${cz(b)} + ${cz(c)} = ?`,ans:r1(a+b+c),h1:'Sčítej postupně, čárky pod sebe.',h2:`= ${r1(a+b+c)}`};},
    ()=>{const a=ri(30,90)/10;const ok=ri(0,1)===0;const tvrz=ok?r1(a*2):r1(a*2+0.1);const spravne=tvrz===r1(a*2);return{text:`Je dvojnásobek čísla ${cz(a)} roven ${tvrz}?`,ans:spravne?'ANO':'NE',h1:'Spočítej 2 × dané číslo.',h2:spravne?'ANO':'NE'};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// 2-3 Zlomky a průměr
function gen_2_3(){
  const T=[
    ()=>{const d=ri(4,9),a=ri(1,d-2),b=ri(1,d-a-1)||1;const num=a+b,g=gcd(num,d);return{text:`Sečti zlomky se stejným jmenovatelem: ${a}/${d} + ${b}/${d} = ?`,ans:g===d?String(num/g):`${num/g}/${d/g}`,h1:'Jmenovatel opiš, sčítej jen čitatele.',h2:`${a}+${b} = ${num}, tedy ${num}/${d}`};},
    ()=>{const e=ri(5,9),c=ri(2,e-1),f=ri(1,c-1)||1;const numD=c-f,gD=gcd(numD,e);return{text:`Odečti zlomky: ${c}/${e} − ${f}/${e} = ?`,ans:numD===0?'0':(gD===e?String(numD/gD):`${numD/gD}/${e/gD}`),h1:'Jmenovatel opiš, odečti čitatele.',h2:`${c}−${f} = ${numD}, tedy ${numD}/${e}`};},
    ()=>{const x=ri(2,9)*2,y=ri(2,9)*2;return{text:`Jaký je aritmetický průměr čísel ${x} a ${y}?`,ans:(x+y)/2,h1:'Sečti obě čísla a vyděl dvěma.',h2:`(${x}+${y}) : 2 = ${(x+y)/2}`};},
    ()=>{const p=ri(2,9),q=ri(2,9),rr=3*ri(3,9)-p-q;return{text:`Jaký je průměr tří čísel ${p}, ${q} a ${rr}?`,ans:(p+q+rr)/3,h1:'Sečti všechna tři a vyděl třemi.',h2:`(${p}+${q}+${rr}) : 3 = ${(p+q+rr)/3}`};},
    ()=>{const dd=ri(2,5),nn=dd*ri(3,8);return{text:`Kolik je 1/${dd} z čísla ${nn}?`,ans:nn/dd,h1:`Vyděl číslo jmenovatelem: ${nn} : ${dd}.`,h2:`= ${nn/dd}`};},
    ()=>{const dd=ri(3,6),nn=dd*ri(3,8),k=ri(2,dd-1);return{text:`Kolik je ${k}/${dd} z čísla ${nn}?`,ans:nn/dd*k,h1:`Nejdřív ${nn} : ${dd} = ${nn/dd}, pak × ${k}.`,h2:`= ${nn/dd*k}`};},
    ()=>{const z1=ri(1,3),z2=ri(1,3),z3=ri(1,4),z4=ri(1,4);return{text:`Žák má známky ${z1}, ${z2}, ${z3}, ${z4}. Jaký je jejich průměr? (na 2 desetinná místa)`,ans:r2((z1+z2+z3+z4)/4),h1:'Sečti všechny čtyři známky a vyděl čtyřmi.',h2:`= ${r2((z1+z2+z3+z4)/4)}`};},
    ()=>{const d=ri(4,9),a=ri(1,d-1);return{text:`Kolik ${d}tin chybí zlomku ${a}/${d} do celku ${d}/${d}? (napiš jen čitatel)`,ans:d-a,h1:`Celek je ${d}/${d}, odečti ${a}.`,h2:`= ${d-a}`};},
    ()=>{const avg=ri(4,12),x=avg-ri(1,3),y=2*avg-x;return{text:`Průměr dvou čísel je ${avg}, první je ${x}. Jaké je druhé číslo?`,ans:y,h1:`Součet obou = ${avg} × 2 = ${avg*2}, odečti první.`,h2:`= ${y}`};},
    ()=>{const d=ri(4,9),a=ri(1,d-1),b=ri(1,d-1);const va=a,vb=b;return{text:`Který zlomek je větší: ${a}/${d}, nebo ${b}/${d}? Napiš jeho čitatel.${a===b?' (jsou stejné — napiš '+a+')':''}`,ans:Math.max(a,b),h1:'Při stejném jmenovateli rozhoduje čitatel.',h2:`= ${Math.max(a,b)}`};},
    ()=>{const parts=ri(3,5),cel=parts*ri(4,9),cast=cel/parts*(parts-1);return{text:`Pizza má ${parts} stejných dílů, snědli ${parts-1} z nich. Kolik ${parts}tin zbylo? (napiš jen čitatel)`,ans:1,h1:`Z ${parts} dílů zbývá ${parts}−${parts-1}.`,h2:`= 1`};},
    ()=>{const d=ri(4,8),a=ri(1,d-2),b=ri(1,d-a-1)||1;const num=a+b;const ok=num===d;return{text:`Dají zlomky ${a}/${d} + ${b}/${d} dohromady přesně jeden celek?`,ans:ok?'ANO':'NE',h1:`Celek je ${d}/${d}. Je ${a}+${b} rovno ${d}?`,h2:ok?'ANO':'NE'};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:i%3===2?'anal':'calc'});}
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 3 — POLE DĚLITELNOSTI
// ══════════════════════════════════════════════════════════

// 3-1 Znaky dělitelnosti (2,3,4,5,9,10) — šablony se liší SLOVY, ne dělitelem
function gen_3_1(){
  const cs = n => String(n).split('').reduce((x,y)=>x+ +y,0);
  const T=[
    ()=>{const d=[2,3,4,5,6,9,10][ri(0,6)];const yes=ri(0,1)===0;let a;if(yes)a=ri(11,90)*d;else{a=ri(120,890);while(a%d===0)a++;}const ok=a%d===0;return{text:`Je číslo ${a} dělitelné ${d}?`,ans:ok?'ANO':'NE',h1:'Použij znak dělitelnosti (poslední číslice / ciferný součet).',h2:ok?'ANO':'NE'};},
    ()=>{const a=ri(50,899);const ok=a%2===0;return{text:`Je číslo ${a} sudé?`,ans:ok?'ANO':'NE',h1:'Sudé číslo končí 0, 2, 4, 6 nebo 8.',h2:ok?'ANO':'NE'};},
    ()=>{const a=ri(50,899);const ok=a%2===1;return{text:`Je číslo ${a} liché?`,ans:ok?'ANO':'NE',h1:'Liché číslo končí 1, 3, 5, 7 nebo 9.',h2:ok?'ANO':'NE'};},
    ()=>{const b=ri(3,9),q=ri(11,40),ok=ri(0,1)===0;const a=ok?b*q:b*q+ri(1,b-1);return{text:`Je číslo ${a} násobkem čísla ${b}?`,ans:a%b===0?'ANO':'NE',h1:`Vejde se ${b} do ${a} beze zbytku?`,h2:a%b===0?'ANO':'NE'};},
    ()=>{const a=ri(100,899);return{text:`Jaký je ciferný součet čísla ${a}?`,ans:cs(a),h1:'Sečti všechny číslice.',h2:`${String(a).split('').join('+')} = ${cs(a)}`};},
    ()=>{const a=ri(100,899);const near=Math.round(a/10)*10;return{text:`Jaký je nejbližší násobek deseti k číslu ${a}?`,ans:near,h1:'Zaokrouhli na desítky.',h2:`= ${near}`};},
    ()=>{const b=[3,4,6,7,8,9][ri(0,5)],q=ri(11,40),r=ri(1,b-1);const a=b*q+r;return{text:`Jaký zbytek dává číslo ${a} po dělení ${b}?`,ans:r,h1:`Největší násobek ${b} pod ${a} je ${b*q}.`,h2:`zbytek = ${r}`};},
    ()=>{const d=[3,4,6][ri(0,2)];const q=ri(20,90);const a=d*q;const next=d*(q+1);return{text:`Jaké je nejbližší VĚTŠÍ číslo než ${a-1}, které je dělitelné ${d}?`,ans:a,h1:`Hledej první násobek ${d} od ${a-1} nahoru.`,h2:`= ${a}`};},
    ()=>{const a=ri(100,899);const okBoth=a%2===0&&a%3===0;return{text:`Je číslo ${a} dělitelné zároveň dvěma i třemi?`,ans:okBoth?'ANO':'NE',h1:'Musí být sudé A zároveň mít ciferný součet dělitelný 3 (tj. dělitelné 6).',h2:okBoth?'ANO':'NE'};},
    ()=>{const q=ri(12,40);const a=q*5;return{text:`Kolik pětek je obsaženo v čísle ${a}? (${a} : 5)`,ans:q,h1:`Vyděl ${a} : 5.`,h2:`= ${q}`};},
    ()=>{const a=ri(100,890);const isPrimeLike=false;const div=[2,3,5][ri(0,2)];const ok=a%div===0;return{text:`Vydělí číslo ${div} beze zbytku číslo ${a}?`,ans:ok?'ANO':'NE',h1:`Použij znak dělitelnosti ${div===2?'dvěma (sudé)':div===3?'třemi (ciferný součet)':'pěti (končí 0/5)'}.`,h2:ok?'ANO':'NE'};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'anal'});}
  return tasks;
}

// 3-2 Prvočísla a dělitelé (MC — numerické nebo ANO/NE)
function gen_3_2(){
  const primes=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
  const isP=n=>{if(n<2)return false;for(let i=2;i*i<=n;i++)if(n%i===0)return false;return true;};
  const divc=n=>{let c=0;for(let i=1;i<=n;i++)if(n%i===0)c++;return c;};
  const T=[
    ()=>{const p=primes[ri(0,9)];return{text:`Je číslo ${p} prvočíslo?`,ans:'ANO',h1:'Prvočíslo má právě dva dělitele: 1 a samo sebe.',h2:'ANO'};},
    ()=>{const c=ri(2,9)*ri(2,9);const ok=isP(c);return{text:`Je číslo ${c} prvočíslo?`,ans:ok?'ANO':'NE',h1:'Má víc než dva dělitele → není prvočíslo.',h2:ok?'ANO':'NE — je složené'};},
    ()=>{const n=ri(6,30);return{text:`Kolik dělitelů má číslo ${n}?`,ans:divc(n),h1:`Vypiš všechna čísla, kterými ${n} vydělíš beze zbytku.`,h2:`${n} má ${divc(n)} dělitelů`};},
    ()=>{const m=ri(2,6)*ri(2,6);let sf=2;while(m%sf!==0)sf++;return{text:`Jaký je nejmenší prvočíselný dělitel čísla ${m}?`,ans:sf,h1:'Zkoušej postupně 2, 3, 5, 7…',h2:`= ${sf}`};},
    ()=>{const b=ri(3,9),mult=b*ri(2,6);return{text:`Je číslo ${b} dělitelem čísla ${mult}?`,ans:mult%b===0?'ANO':'NE',h1:`Vejde se ${b} do ${mult} beze zbytku?`,h2:'ANO'};},
    ()=>{const c=ri(2,9)*ri(2,9);const ok=!isP(c);return{text:`Je číslo ${c} složené (má víc než dva dělitele)?`,ans:ok?'ANO':'NE',h1:'Složené číslo lze rozložit na součin menších činitelů.',h2:ok?'ANO':'NE'};},
    ()=>{const a=ri(4,12);return{text:`Je číslo ${a*a} druhou mocninou nějakého čísla?`,ans:'ANO',h1:`Existuje číslo, které umocněné na druhou dá ${a*a}?`,h2:`ANO (${a}² = ${a*a})`};},
    ()=>{const lim=[10,20,30,50][ri(0,3)];const cnt=primes.filter(x=>x<lim).length;return{text:`Kolik prvočísel je menších než ${lim}?`,ans:cnt,h1:'Vyjmenuj prvočísla od 2 nahoru a počítej.',h2:`= ${cnt}`};},
    ()=>{const m=[12,18,20,24,30,36,45][ri(0,6)];let big=1;for(const p of primes)if(m%p===0)big=p;return{text:`Jaký je NEJVĚTŠÍ prvočíselný dělitel čísla ${m}?`,ans:big,h1:'Rozlož číslo na prvočinitele a vezmi největší.',h2:`= ${big}`};},
    ()=>{const p=primes[ri(2,9)];let np=p+1;while(!isP(np))np++;return{text:`Které nejmenší prvočíslo je větší než ${p}?`,ans:np,h1:'Hledej první prvočíslo nad daným číslem.',h2:`= ${np}`};},
    ()=>{const b=ri(3,9),q=ri(2,6);const ok=ri(0,1)===0;const a=ok?b*q:b*q+ri(1,b-1);return{text:`Je číslo ${a} násobkem čísla ${b}?`,ans:a%b===0?'ANO':'NE',h1:`Je ${a} v řadě násobků čísla ${b}?`,h2:a%b===0?'ANO':'NE'};},
    ()=>{const n=[6,8,10,12,15][ri(0,4)];return{text:`Kolik dělitelů má číslo ${n} KROMĚ 1 a sebe sama?`,ans:divc(n)-2,h1:'Spočítej všechny dělitele a dva odečti.',h2:`= ${divc(n)-2}`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'anal'});}
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
  const druh=a=>a<90?'ostrý':a===90?'pravý':a<180?'tupý':a===180?'přímý':'plný';
  const T=[
    ()=>{const a=ri(10,80);return{text:`Úhel má velikost ${a}°. Je to ostrý úhel? (ostrý < 90°)`,ans:'ANO',h1:'Ostrý úhel je menší než 90°.',h2:'ANO'};},
    ()=>{const a=ri(95,170);return{text:`Úhel má velikost ${a}°. Je to tupý úhel? (tupý 90°–180°)`,ans:'ANO',h1:'Tupý úhel je mezi 90° a 180°.',h2:'ANO'};},
    ()=>{const a=ri(10,80);return{text:`Je úhel ${a}° tupý?`,ans:'NE',h1:`${a}° je menší než 90°, je tedy ostrý.`,h2:'NE — je ostrý'};},
    ()=>{return{text:`Kolik stupňů má pravý úhel?`,ans:90,h1:'Pravý úhel je čtvrtina otáčky.',h2:'90°'};},
    ()=>{return{text:`Kolik stupňů má přímý úhel?`,ans:180,h1:'Přímý úhel je polovina otáčky.',h2:'180°'};},
    ()=>{const c=ri(10,80);return{text:`Kolik stupňů chybí úhlu ${c}° do pravého úhlu?`,ans:90-c,h1:'Pravý úhel má 90°.',h2:`90 − ${c} = ${90-c}°`};},
    ()=>{const a=ri(10,150);return{text:`Kolik stupňů chybí úhlu ${a}° do přímého úhlu (180°)?`,ans:180-a,h1:'Přímý úhel má 180°.',h2:`180 − ${a} = ${180-a}°`};},
    ()=>{return{text:`Kolik stupňů má plný úhel (celá otáčka)?`,ans:360,h1:'Celá otáčka kolem bodu.',h2:'360°'};},
    ()=>{const a=ri(10,80);const ok=a===90;return{text:`Je úhel ${a}° pravý (přesně 90°)?`,ans:ok?'ANO':'NE',h1:'Pravý úhel má přesně 90°.',h2:ok?'ANO':'NE'};},
    ()=>{const a=[ri(10,80),90,ri(95,175),180][ri(0,3)];return{text:`Úhel má ${a}°. Napiš jeho druh číslem: 1=ostrý, 2=pravý, 3=tupý, 4=přímý.`,ans:a<90?1:a===90?2:a<180?3:4,h1:'Porovnej velikost s 90° a 180°.',h2:`${druh(a)} → ${a<90?1:a===90?2:a<180?3:4}`};},
    ()=>{const a=ri(100,170);return{text:`O kolik stupňů je úhel ${a}° větší než pravý úhel?`,ans:a-90,h1:'Odečti 90°.',h2:`${a} − 90 = ${a-90}°`};},
    ()=>{const a=ri(10,80);const b=ri(10,80);return{text:`Dva ostré úhly ${a}° a ${b}° dej dohromady. Je jejich součet stále ostrý (< 90°)?`,ans:(a+b)<90?'ANO':'NE',h1:`Sečti: ${a} + ${b} = ${a+b}. Je to méně než 90?`,h2:(a+b)<90?'ANO':'NE'};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'geo'});}
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
  const T=[
    ()=>{const a=ri(10,40),b=ri(10,25),c=ri(10,40),d=ri(10,25);let mm=b+d;if(mm>=60)mm-=60;return{text:`Sečti úhly ${a}°${b}′ + ${c}°${d}′. Kolik MINUT bude ve výsledku?`,ans:mm,h1:'Sečti minuty; nad 60 přenes jeden stupeň.',h2:`minuty = ${mm}′`};},
    ()=>{const e=ri(40,80),f=ri(30,55),g=ri(10,30),h=ri(10,f-5);return{text:`Odečti úhly ${e}°${f}′ − ${g}°${h}′. Kolik STUPŇŮ bude ve výsledku?`,ans:e-g,h1:'Odečti stupně a minuty zvlášť.',h2:`stupně = ${e-g}°`};},
    ()=>{const deg=ri(2,6);return{text:`Kolik minut má ${deg}°? (1° = 60′)`,ans:deg*60,h1:'Jeden stupeň má 60 minut.',h2:`${deg} · 60 = ${deg*60}′`};},
    ()=>{const m=ri(2,9)*60;return{text:`Kolik celých stupňů je ${m}′? (60′ = 1°)`,ans:m/60,h1:'Vyděl počet minut šedesáti.',h2:`${m} : 60 = ${m/60}°`};},
    ()=>{const i=ri(20,70);return{text:`Kolik stupňů chybí úhlu ${i}° do 90°?`,ans:90-i,h1:'Odečti od pravého úhlu.',h2:`90 − ${i} = ${90-i}°`};},
    ()=>{const j=ri(100,160);return{text:`Kolik stupňů chybí úhlu ${j}° do 180°?`,ans:180-j,h1:'Odečti od přímého úhlu.',h2:`180 − ${j} = ${180-j}°`};},
    ()=>{const deg=ri(1,3),min=ri(10,50);return{text:`Kolik minut celkem je ${deg}°${min}′? (1° = 60′)`,ans:deg*60+min,h1:`Převeď stupně na minuty (${deg}·60) a přičti ${min}.`,h2:`= ${deg*60+min}′`};},
    ()=>{const half=ri(2,5)*2;return{text:`Kolik minut je polovina úhlu ${half}°? (výsledek v minutách)`,ans:half/2*60,h1:`Polovina je ${half/2}°, to je ${half/2}·60 minut.`,h2:`= ${half/2*60}′`};},
    ()=>{const a=ri(20,40),b=ri(30,55),c=ri(20,40),d=ri(30,55);const totM=b+d;const carry=totM>=60?1:0;const outM=totM-carry*60;return{text:`Sečti ${a}°${b}′ + ${c}°${d}′. Kolik STUPŇŮ bude ve výsledku? (pozor na přenos z minut)`,ans:a+c+carry,h1:`Minuty: ${b}+${d}=${totM}${carry?' → přenos 1° do stupňů':''}.`,h2:`= ${a+c+carry}°`};},
    ()=>{const m=ri(70,290);return{text:`${m}′ je kolik celých stupňů? (60′ = 1°, napiš jen celé stupně)`,ans:Math.floor(m/60),h1:'Kolikrát se 60 vejde do počtu minut?',h2:`= ${Math.floor(m/60)}°`};},
    ()=>{const a=ri(10,80);const ok=(90-a)>0;return{text:`Existuje k úhlu ${a}° doplněk do 90° (kladný)?`,ans:a<90?'ANO':'NE',h1:'Doplněk do 90° existuje jen pro ostré úhly.',h2:a<90?'ANO':'NE'};},
    ()=>{const deg=ri(2,5);return{text:`Kolik SEKUND má ${deg}′? (1′ = 60″)`,ans:deg*60,h1:'Jedna minuta má 60 vteřin.',h2:`${deg} · 60 = ${deg*60}″`};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'calc'});}
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 5 — ZRCADLOVÝ MĚSÍC
// ══════════════════════════════════════════════════════════

// 5-1 Osová souměrnost (počet os) — variace ÚTVAREM a formulací
function gen_5_1(){
  // [název, počet os]
  const UTV=[['čtverec',4],['obdélník (ne čtverec)',2],['rovnostranný trojúhelník',3],['rovnoramenný trojúhelník (ne rovnostranný)',1],['kosočtverec',2],['pravidelný pětiúhelník',5],['pravidelný šestiúhelník',6],['kruh (napiš 0, pokud jich má nekonečně mnoho)',0]];
  const PISM=[['A',1],['H',2],['X',2],['O',2],['T',1],['M',1],['E',1],['N',0],['S',0],['Z',0],['I',2],['B',1]];
  const T=[
    ()=>{const u=UTV[ri(0,6)];return{text:`Kolik os souměrnosti má ${u[0]}?`,ans:u[1],h1:'Osa přeloží útvar přesně sám na sebe.',h2:`${u[1]} ${u[1]===1?'osa':(u[1]>=2&&u[1]<=4?'osy':'os')}`};},
    ()=>{const p=PISM[ri(0,PISM.length-1)];return{text:`Kolik os souměrnosti má tiskací písmeno „${p[0]}"?`,ans:p[1],h1:'Zkus písmeno přeložit svisle i vodorovně.',h2:`${p[1]}`};},
    ()=>{const u=[['čtverec',4],['obdélník',2],['rovnostranný trojúhelník',3]][ri(0,2)];const claim=[2,3,4][ri(0,2)];const ok=claim===u[1];return{text:`Má ${u[0]} přesně ${claim} osy souměrnosti?`,ans:ok?'ANO':'NE',h1:'Spočítej osy útvaru a porovnej.',h2:ok?'ANO':'NE'};},
    ()=>{const n=ri(5,10);return{text:`Kolik os souměrnosti má pravidelný ${n}úhelník?`,ans:n,h1:'Pravidelný n-úhelník má právě n os.',h2:`${n} os`};},
    ()=>{return{text:`Má kruh konečný počet os souměrnosti? (ANO/NE)`,ans:'NE',h1:'Každá přímka procházející středem je osou.',h2:'NE — nekonečně mnoho'};},
    ()=>{const u=[['rovnoběžník (ne kosočtverec/obdélník)',0],['různostranný trojúhelník',0]][ri(0,1)];return{text:`Kolik os souměrnosti má ${u[0]}?`,ans:0,h1:'Nemá žádnou osu, kterou by se přeložil sám na sebe.',h2:'0 os'};},
    ()=>{const u=[['čtverec',4],['pravidelný šestiúhelník',6],['pravidelný pětiúhelník',5]][ri(0,2)];return{text:`Osy souměrnosti útvaru ${u[0]} — je jich víc než 3?`,ans:u[1]>3?'ANO':'NE',h1:'Spočítej všechny osy.',h2:u[1]>3?'ANO':'NE'};},
    ()=>{return{text:`Má úsečka střed souměrnosti i osu souměrnosti? Kolik OS souměrnosti má úsečka?`,ans:2,h1:'Osa procházející středem kolmo + osa v přímce úsečky.',h2:'2 osy'};},
    ()=>{const u=[['rovnostranný trojúhelník',3],['čtverec',4]][ri(0,1)];return{text:`Je počet os souměrnosti útvaru ${u[0]} stejný jako počet jeho vrcholů?`,ans:'ANO',h1:'Porovnej počet os a počet vrcholů.',h2:'ANO'};},
    ()=>{const u=[['obdélník (ne čtverec)',2],['kosočtverec',2]][ri(0,1)];return{text:`Kolik os souměrnosti má ${u[0]}? (má je vedené jinak než čtverec)`,ans:2,h1:'Obdélník přes středy stran, kosočtverec po úhlopříčkách.',h2:'2 osy'};},
  ];
  const tasks=[];
  for(let i=0;i<13;i++){const t=T[i%T.length]();tasks.push({text:t.text,ans:t.ans,hints:[t.h1,t.h2],skill:'geo'});}
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
  tasks.push({text:`Kolik stěn má krychle?`,ans:6,hints:['Vezmi si kostku a počítej stěny po dvojicích — protilehlé.','Krychle má 6 stěn.'],skill:'geo'});
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
  tasks.push({text:`Kolik čtverců má síť krychle?`,ans:6,hints:['Síť má tolik čtverců, kolik má krychle stěn — spočítej je na kostce.','Síť krychle má 6 čtverců.'],skill:'geo'});
  const d=ri(2,8)*1000;
  tasks.push({text:`Kolik m³ je ${d} litrů? (1000 l = 1 m³)`,ans:d/1000,hints:['Děl 1000.',`= ${d/1000} m³`],skill:'calc'});
  tasks.push({text:`Kolik hran má krychle?`,ans:12,hints:['Počítej hrany po skupinách: dolní podstava, horní podstava, svislé.','4 + 4 + 4 = 12 hran.'],skill:'geo'});
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
