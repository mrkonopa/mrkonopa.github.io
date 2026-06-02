// Rozšiřující banka úloh pro rpg-mat-7.html — Ztracený chrám ⛏️
// window.RPG_TASK_EXTRA_7 = { '<mid>': () => [task, ...], ... }
(function(){
'use strict';
const ri = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}
const cz = n => String(n).replace('.',',');
const r1 = n => cz(Math.round(n*10)/10);
const r2 = n => cz(Math.round(n*100)/100);

// ══════════════════════════════════════════════════════════
// OBLAST 1 — VSTUPNÍ BRÁNA
// ══════════════════════════════════════════════════════════

// 1-1 Počítání zpaměti (MC — jen numerické)
function gen_1_1(){
  const tasks=[];
  // sčítání
  const a=ri(12,49),b=ri(11,38);
  tasks.push({text:`Vypočítej zpaměti: ${a} + ${b} = ?`,ans:a+b,hints:[`Zaokrouhlej ${a} na desítky a uprav.`,`${a} + ${b} = ${a+b}`],skill:'calc'});
  // odčítání
  const c=ri(40,90),d=ri(11,c-5);
  tasks.push({text:`Vypočítej zpaměti: ${c} − ${d} = ?`,ans:c-d,hints:[`Odečti po částech.`,`${c} − ${d} = ${c-d}`],skill:'calc'});
  // násobení
  const e=ri(4,9),f=ri(6,12);
  tasks.push({text:`Vypočítej zpaměti: ${e} × ${f} = ?`,ans:e*f,hints:[`Rozlož ${f} = ${Math.floor(f/2)} + ${f-Math.floor(f/2)}.`,`${e} × ${f} = ${e*f}`],skill:'calc'});
  // dělení
  const g=ri(3,9),h=g*ri(4,12);
  tasks.push({text:`Vypočítej zpaměti: ${h} ÷ ${g} = ?`,ans:h/g,hints:[`Kolikrát se vejde ${g} do ${h}?`,`${h} ÷ ${g} = ${h/g}`],skill:'calc'});
  // mix
  const i=ri(5,15),j=ri(3,8);
  tasks.push({text:`Vypočítej zpaměti: ${i} × ${j} − ${j} = ?`,ans:i*j-j,hints:[`Vytknout ${j}: ${j}·(${i}−1).`,`${j}·${i-1} = ${i*j-j}`],skill:'calc'});
  const k=ri(20,50),l=ri(5,10);
  tasks.push({text:`Vypočítej zpaměti: ${k} + ${l} × ${l} = ?`,ans:k+l*l,hints:[`Nejdřív ${l}×${l} = ${l*l}, pak přičti.`,`${k} + ${l*l} = ${k+l*l}`],skill:'calc'});
  return tasks;
}

// 1-2 Desetinná čísla (+−×÷)
function gen_1_2(){
  const tasks=[];
  const a=ri(10,50)/10, b=ri(5,30)/10;
  tasks.push({text:`${cz(a)} + ${cz(b)} = ?`,ans:r1(a+b),hints:['Zarovnej desetinné čárky pod sebe.','Sečti jako celá čísla, přidej čárku.'],skill:'calc'});
  const c=ri(30,80)/10, d=ri(5,c*10-5)/10;
  tasks.push({text:`${cz(c)} − ${cz(d)} = ?`,ans:r1(c-d),hints:['Zarovnej desetinné čárky pod sebe.','Odečti jako celá čísla.'],skill:'calc'});
  const e=ri(2,9), f=ri(11,49)/10;
  tasks.push({text:`${e} × ${cz(f)} = ?`,ans:r2(e*f),hints:[`Přepočti: ${e} × ${Math.round(f*10)} desetin.`,`Výsledek = ${r2(e*f)}`],skill:'calc'});
  const g=ri(11,49)/10, h=ri(2,5);
  tasks.push({text:`${cz(g)} ÷ ${h} = ?`,ans:r2(g/h),hints:[`Dělíme ${Math.round(g*10)} desetin číslem ${h}.`,`Výsledek = ${r2(g/h)}`],skill:'calc'});
  const i=ri(10,30)/10, j=ri(10,30)/10;
  tasks.push({text:`${cz(i)} × ${cz(j)} = ?`,ans:r2(i*j),hints:[`Počítej: ${Math.round(i*10)} × ${Math.round(j*10)} = ${Math.round(i*10)*Math.round(j*10)}, poděl 100.`,`Výsledek = ${r2(i*j)}`],skill:'calc'});
  const k=ri(15,60)/10, l=ri(10,30)/10;
  const res56=r1(k+l);
  tasks.push({text:`Nakoupil jsem 2 věci za ${cz(k)} Kč a ${cz(l)} Kč. Kolik jsem zaplatil celkem?`,ans:res56,hints:['Sečti obě ceny.','Výsledek = '+res56+' Kč'],skill:'calc'});
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
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 2 — SÍŇ ZLOMKŮ
// ══════════════════════════════════════════════════════════

// 2-1 Krácení a rozšiřování (MC — numerické)
function gen_2_1(){
  const tasks=[];
  // krácení — výsledek jako celé číslo
  const a=ri(2,6),b=ri(2,8);
  tasks.push({text:`Zkrať zlomek na základní tvar: ${a*b}/${b*ri(2,4)} = ?/1\nJaké je čitatel? (Zapište jen číslo čitatele výsledku.)`,ans:a,hints:['Vyděl čitatele i jmenovatele jejich NSD.','NSD('+a*b+','+b*ri(2,4)+')…'],skill:'calc'});
  // krácení na číselný výsledek
  const p=ri(2,5),q=ri(3,7);
  const top=p*q, bot=p*(q+ri(1,3));
  const g2=gcd(top,bot);
  tasks.push({text:`Zkrať na základní tvar: ${top}/${bot}. Jaký je čitatel?`,ans:top/g2,hints:['Vyděl čitatele i jmenovatele NSD('+top+','+bot+').','NSD = '+g2+', výsledek: '+(top/g2)+'/'+(bot/g2)],skill:'calc'});
  // rozšiřování
  const c=ri(2,7),d=ri(2,6),k=ri(2,5);
  tasks.push({text:`Rozšiř zlomek na jmenovatele ${d*k}: ${c}/${d} = ${c*k}/${d*k}\nJaké je nové číslo v čitateli?`,ans:c*k,hints:['Čitatel × rozšiřující číslo.',''+c+' × '+k+' = '+c*k],skill:'calc'});
  // porovnání — ANO/NE
  const e=ri(2,5),f=ri(3,8);
  tasks.push({text:`Je zlomek ${e*2}/${f*2} rovno ${e}/${f}?`,ans:'ANO',hints:['Zkrať levý zlomek.','${e*2}/${f*2} zkráceno = ${e}/${f} → ANO'],skill:'calc'});
  // numerická MC
  const h=ri(2,9),i=ri(3,12);
  const g3=gcd(h,i);
  tasks.push({text:`Výsledek krácení ${h}/${i} na základní tvar: čitatel?`,ans:h/g3,hints:['NSD('+h+','+i+') = '+g3,''+h/g3+'/'+i/g3],skill:'calc'});
  const m=ri(3,8),n=ri(3,8);
  tasks.push({text:`Rozšiř ${m}/${n} číslem 3. Nový čitatel?`,ans:m*3,hints:['Čitatel × 3.',''+m+' × 3 = '+m*3],skill:'calc'});
  return tasks;
}

// 2-2 Sčítání a odčítání zlomků (různé jmenovatele)
function gen_2_2(){
  const tasks=[];
  function lcm(a,b){return a/gcd(a,b)*b;}
  // různé jmenovatele — výsledek celé číslo nebo zlomek
  const a=ri(2,5),b=ri(2,6);const L=lcm(a,b);const p=ri(1,a-1)||1,q=ri(1,b-1)||1;
  const numSum=p*Math.round(L/a)+q*Math.round(L/b);const gSum=gcd(numSum,L);
  const ansSum=gSum===L?String(numSum/gSum):`${numSum/gSum}/${L/gSum}`;
  tasks.push({text:`${p}/${a} + ${q}/${b} = ?`,ans:ansSum,hints:['Převeď na společného jmenovatele '+L+'.',''+p+'·'+(L/a)+'/'+L+' + '+q+'·'+(L/b)+'/'+L+' = '+numSum+'/'+L],skill:'calc'});
  // odčítání
  const c=ri(3,8),d=ri(2,c-1);const L2=lcm(c,d);const r=ri(2,c-1),s=ri(1,d-1)||1;
  const numDif=r*Math.round(L2/c)-s*Math.round(L2/d);const gDif=gcd(Math.abs(numDif),L2);
  const ansDif=gDif===L2?String(numDif/gDif):`${numDif/gDif}/${L2/gDif}`;
  tasks.push({text:`${r}/${c} − ${s}/${d} = ?`,ans:ansDif,hints:['Společný jmenovatel je '+L2+'.',''+r+'/'+c+' = '+(r*Math.round(L2/c))+'/'+L2],skill:'calc'});
  // sčítání s celým číslem
  const w=ri(1,4),v=ri(2,7),u=ri(1,v-1);
  const numW=w*v+u;const gW=gcd(numW,v);
  const ansW=gW===v?String(numW/gW):`${numW/gW}/${v/gW}`;
  tasks.push({text:`${w} + ${u}/${v} = ?`,ans:ansW,hints:[`Přepočti ${w} jako ${w*v}/${v}.`,''+w*v+'/'+v+' + '+u+'/'+v+' = '+numW+'/'+v],skill:'calc'});
  // odčítání od celého čísla
  const x=ri(2,5),y=ri(3,8),z=ri(1,y-1);
  const numX=x*y-z;const gX=gcd(numX,y);
  const ansX=gX===y?String(numX/gX):`${numX/gX}/${y/gX}`;
  tasks.push({text:`${x} − ${z}/${y} = ?`,ans:ansX,hints:[`Přepočti ${x} jako ${x*y}/${y}.`,''+x*y+'/'+y+' − '+z+'/'+y+' = '+numX+'/'+y],skill:'calc'});
  // smíšené číslo součet
  const m=ri(2,5),n=ri(3,7),o=ri(2,n-1);
  const topMix=1*n+o;const gMix=gcd(topMix,n);
  const ansMix=gMix===n?String(topMix/gMix):`${topMix/gMix}/${n/gMix}`;
  tasks.push({text:`1${String.fromCharCode(160)}${o}/${n} (smíšené číslo) přepočítáno jako zlomek: čitatel?`,ans:topMix/gMix,hints:['Celá část × jmenovatel + čitatel.',`1·${n}+${o} = ${topMix}, pak zkrať.`],skill:'calc'});
  // porovnání zlomků
  const f1n=ri(2,5),f1d=ri(3,8),f2n=ri(2,5),f2d=ri(3,8);
  const isGt=f1n/f1d>f2n/f2d;
  tasks.push({text:`Je ${f1n}/${f1d} > ${f2n}/${f2d}?`,ans:isGt?'ANO':'NE',hints:['Přepočti na stejného jmenovatele nebo porovnej desetinnými hodnotami.',''+f1n+'/'+f1d+' ≈ '+r2(f1n/f1d)+', '+f2n+'/'+f2d+' ≈ '+r2(f2n/f2d)],skill:'calc'});
  return tasks;
}

// 2-3 Násobení a dělení zlomků
function gen_2_3(){
  const tasks=[];
  // násobení dvou zlomků
  const a=ri(2,5),b=ri(3,8),c=ri(2,5),d=ri(3,8);
  const topN=a*c,botN=b*d,gN=gcd(topN,botN);
  const ansN=gN===botN?String(topN/gN):`${topN/gN}/${botN/gN}`;
  tasks.push({text:`${a}/${b} × ${c}/${d} = ?`,ans:ansN,hints:['Čitatele × čitatele, jmenovatele × jmenovatele.',`${a*c}/${b*d} zkrať.`],skill:'calc'});
  // násobení zlomku celým číslem
  const e=ri(2,6),f=ri(3,9),w=ri(2,5);
  const topEF=e*w,gEF=gcd(topEF,f);
  const ansEF=gEF===f?String(topEF/gEF):`${topEF/gEF}/${f/gEF}`;
  tasks.push({text:`${e}/${f} × ${w} = ?`,ans:ansEF,hints:['Čitatel × celé číslo, jmenovatel zůstane.',`${e*w}/${f} → zkrať.`],skill:'calc'});
  // dělení zlomkem — převrácení
  const g=ri(2,5),h=ri(3,8),i=ri(2,5),j=ri(3,8);
  const topD=g*j,botD=h*i,gD=gcd(topD,botD);
  const ansD=gD===botD?String(topD/gD):`${topD/gD}/${botD/gD}`;
  tasks.push({text:`${g}/${h} ÷ ${i}/${j} = ?`,ans:ansD,hints:['Dělení zlomkem = násobení převráceným zlomkem.',`${g}/${h} × ${j}/${i} = ${topD}/${botD} → zkrať.`],skill:'calc'});
  // zlomek z čísla
  const k=ri(2,5),l=ri(3,8),m=ri(2,6)*l;
  const topK=k*m,gK=gcd(topK,l);
  tasks.push({text:`Kolik je ${k}/${l} z čísla ${m}?`,ans:topK/gK,hints:['${k}/${l} z ${m} = (${k}·${m})/${l}.',`${k*m}/${l} = ${topK/gK}`],skill:'calc'});
  // slovní úloha
  const p=ri(3,8),q=ri(2,p-1);
  tasks.push({text:`Ze šnůry délky ${p} m odříznu ${q}/${p} části. Jak dlouhá je odříznutá část? (v metrech)`,ans:q,hints:['${q}/${p} z ${p} = ${q}·${p}/${p}.','= '+q+' m'],skill:'calc'});
  // smíšené číslo × celé číslo
  const r=ri(2,4),s=ri(2,6),t=ri(2,5);
  const topR=(r*s+1)*t,gR=gcd(topR,s);
  const ansR=gR===s?String(topR/gR):`${topR/gR}/${s/gR}`;
  tasks.push({text:`${r} celých ${1}/${s} × ${t} = ? (smíšené číslo: výsledek jako čitatel po zkrácení)`,ans:topR/gR,hints:['Přepočti smíšené na zlomek: '+r+'·'+s+'+1 = '+(r*s+1)+'/'+s,'('+topR+'/'+gR+')/'+s/gR],skill:'calc'});
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 3 — PODZEMNÍ MRAZÍRNA
// ══════════════════════════════════════════════════════════

// 3-1 Sčítání a odčítání celých čísel (MC — numerické)
function gen_3_1(){
  const tasks=[];
  const a=ri(3,15),b=ri(3,12);
  tasks.push({text:`(−${a}) + (−${b}) = ?`,ans:-(a+b),hints:['Záporné + záporné = záporné součtu.','= −'+(a+b)],skill:'calc'});
  const c=ri(5,20),d=ri(3,c-2);
  tasks.push({text:`${c} − ${d} = ?`,ans:c-d,hints:['Klasické odčítání.',`${c}−${d} = ${c-d}`],skill:'calc'});
  const e=ri(5,20),f=ri(3,12);
  tasks.push({text:`(−${e}) + ${f} = ?`,ans:f-e,hints:['Záporné + kladné: odečti menší od většího, znaménko většího.',`${f}−${e} = ${f-e}`],skill:'calc'});
  const g=ri(5,20),h=ri(3,12);
  tasks.push({text:`${g} − (−${h}) = ?`,ans:g+h,hints:['Odečíst záporné = přičíst kladné.',`${g}+${h} = ${g+h}`],skill:'calc'});
  const i=ri(3,10),j=ri(3,15);
  tasks.push({text:`(−${i}) − ${j} = ?`,ans:-(i+j),hints:['Záporné − kladné = záporné jejich součtu.','= −'+(i+j)],skill:'calc'});
  const k=ri(3,15),l=ri(k+1,k+10);
  tasks.push({text:`(−${l}) + ${k} = ?`,ans:k-l,hints:['Absolutní hodnota záporného je větší.',`${k}−${l} = ${k-l}`],skill:'calc'});
  return tasks;
}

// 3-2 Násobení a dělení celých čísel (pravidla znamének)
function gen_3_2(){
  const tasks=[];
  const a=ri(2,9),b=ri(2,9);
  tasks.push({text:`(−${a}) × ${b} = ?`,ans:-(a*b),hints:['Záporné × kladné = záporné.','= −'+(a*b)],skill:'calc'});
  const c=ri(2,9),d=ri(2,9);
  tasks.push({text:`(−${c}) × (−${d}) = ?`,ans:c*d,hints:['Záporné × záporné = kladné.','= '+(c*d)],skill:'calc'});
  const e=ri(2,9),f=ri(2,9);
  tasks.push({text:`${e} × (−${f}) = ?`,ans:-(e*f),hints:['Kladné × záporné = záporné.','= −'+(e*f)],skill:'calc'});
  const g=ri(2,8),h=g*ri(2,9);
  tasks.push({text:`(−${h}) ÷ ${g} = ?`,ans:-(h/g),hints:['Záporné ÷ kladné = záporné.','= −'+(h/g)],skill:'calc'});
  const i=ri(2,8),j=i*ri(2,9);
  tasks.push({text:`(−${j}) ÷ (−${i}) = ?`,ans:j/i,hints:['Záporné ÷ záporné = kladné.','= '+(j/i)],skill:'calc'});
  const k=ri(2,6),l=ri(2,6),m=ri(2,6);
  tasks.push({text:`(−${k}) × ${l} × (−${m}) = ?`,ans:k*l*m,hints:['Dvě záporná čísla → výsledek kladný.','= '+(k*l*m)],skill:'calc'});
  return tasks;
}

// 3-3 Racionální čísla (záporné zlomky a desetinná)
function gen_3_3(){
  const tasks=[];
  const a=ri(2,5),b=ri(3,8);
  tasks.push({text:`Převeď na desetinné číslo: −${a}/${b} ≈ ? (na 2 desetinná místa)`,ans:r2(-a/b),hints:['Vyděl '+a+' / '+b+' a přidej znaménko.',r2(-a/b)],skill:'calc'});
  const c=ri(1,4),d=ri(3,8),e=ri(1,3);
  tasks.push({text:`(−${c}/${d}) + ${e}/${d} = ?`,ans:(e-c)===0?'0':(e>c?`${e-c}/${d}`:`-${c-e}/${d}`),hints:['Stejný jmenovatel: přičti čitatele.','('+e+'−'+c+')/'+d+' = '+(e-c)+'/'+d],skill:'calc'});
  const f=ri(2,5),g=ri(3,8);
  tasks.push({text:`Kolik je |−${f}/${g}|? (absolutní hodnota, výsledek jako zlomek)`,ans:`${f}/${g}`,hints:['Absolutní hodnota = vzdálenost od nuly = vždy kladná.','|−'+f+'/'+g+'| = '+f+'/'+g],skill:'calc'});
  const h=ri(10,30)/10, i=ri(5,15)/10;
  tasks.push({text:`(−${cz(h)}) + ${cz(i)} = ?`,ans:r1(i-h),hints:['Záporné + kladné: odečti menší od většího.','= '+r1(i-h)],skill:'calc'});
  const j=ri(2,6), k=ri(3,9);
  const jk=j*k;
  tasks.push({text:`(−${jk}) ÷ (−${j}) = ?`,ans:k,hints:['Záporné ÷ záporné = kladné.','= '+k],skill:'calc'});
  const m=ri(1,5),n=ri(3,8),o=ri(1,m-1)||1;
  tasks.push({text:`−${m}/${n} − (−${o}/${n}) = ?`,ans:(o-m)===0?'0':`${o-m}/${n}`,hints:['Odečíst záporné = přičíst kladné.','−'+m+'/'+n+' + '+o+'/'+n+' = '+(o-m)+'/'+n],skill:'calc'});
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
  const sum=ri(20,50),m=ri(2,5),n=ri(2,5);
  const part=Math.round(sum*m/(m+n));
  tasks.push({text:`Rozděl ${sum} v poměru ${m} : ${n}. Kolik je první díl?`,ans:part,hints:['1 díl = celek / (m+n).','1 díl = '+sum+'/'+(m+n)+' = '+r2(sum/(m+n))+' → '+part],skill:'anal'});
  // poměr délek
  const x=ri(6,20),y=ri(3,x-2);const g=gcd(x,y);
  tasks.push({text:`Úsečky mají délky ${x} cm a ${y} cm. Jaký je první člen jejich poměru v základním tvaru?`,ans:x/g,hints:['Vyděl oběma NSD('+x+','+y+') = '+g+'.',x+'/'+g+' : '+y+'/'+g+' → '+(x/g)+':'+(y/g)],skill:'anal'});
  // poměr z dílů
  const c=ri(3,8),d=ri(3,8),total2=ri(20,60);
  const cpart=Math.round(total2*c/(c+d));
  tasks.push({text:`Dva dělitelé se dělí v poměru ${c} : ${d}. Větší dostane ${cpart>Math.round(total2*d/(c+d))?c:d} dílů z celku ${total2}. Kolik dostane první?`,ans:cpart,hints:['Hodnota prvního dílu = celek · c/(c+d).',String(cpart)],skill:'anal'});
  // z reálné situace
  const e=ri(4,10),f=ri(3,8),g2=gcd(e,f);
  tasks.push({text:`Počet hochů ku počtu dívek je ${e} : ${f}. Ve třídě je ${(e+f)*ri(2,3)} dětí. Kolik je hochů?`,ans:(e+f)*ri(2,3)/(e+f)*e,hints:['Záleží na počtu celkem; 1 díl = celkem/('+e+'+'+f+').',String((e+f)*2/(e+f)*e)],skill:'anal'});
  const h=ri(2,7),i=ri(2,7),r=ri(2,4);
  tasks.push({text:`Poměr ${h*r} : ${i*r} v základním tvaru? Druhý člen?`,ans:i,hints:['Vyděl NSD('+h*r+','+i*r+') = '+r+'.',h+':'+i+' → druhý člen = '+i],skill:'anal'});
  return tasks;
}

// 4-2 Trojčlenka (přímá a nepřímá úměrnost)
function gen_4_2(){
  const tasks=[];
  // přímá úměrnost
  const a=ri(3,8),b=ri(4,12),c=ri(2,6);
  tasks.push({text:`${a} kg cukru stojí ${a*b} Kč. Kolik stojí ${c} kg?`,ans:c*b,hints:['Přímá úměrnost: cena roste s množstvím.','1 kg = '+b+' Kč → '+c+' kg = '+(c*b)+' Kč'],skill:'anal'});
  // nepřímá úměrnost
  const d=ri(2,5),e=ri(10,40),f=ri(2,8);
  tasks.push({text:`${d} dělníci postaví plot za ${e} dní. Za kolik dní to zvládne ${f} dělníků? (nepřímá úměrnost)`,ans:d*e/f,hints:['Nepřímá: méně lidí → více dní. Součin = konstantní.',''+d+'·'+e+' = '+f+'·x → x = '+(d*e/f)],skill:'anal'});
  // přímá — vzdálenost/čas
  const g=ri(3,8),h=ri(5,15)*10,i=ri(2,5);
  tasks.push({text:`Jezdec ujede ${g} hodin rychlostí ${h} km/h. Jakou vzdálenost ujede za ${i} hodin stejnou rychlostí?`,ans:i*h,hints:['Vzdálenost = rychlost × čas.',''+i+'·'+h+' = '+(i*h)+' km'],skill:'anal'});
  // z tabulky
  const j=ri(4,10),k=ri(2,5),l=ri(3,8);
  tasks.push({text:`Přímá úměrnost: za ${j} minut zpracuji ${k} stran. Za ${l*j} minut zpracuji ? stran.`,ans:l*k,hints:['Přímá: kolikrát více čas → kolikrát více stran.',''+l+'× více času → '+(l*k)+' stran'],skill:'anal'});
  // trojčlenka — recept
  const m=ri(2,4),n=ri(100,300),o=ri(m+1,m*3);
  tasks.push({text:`Na ${m} bochníky chleba potřebuji ${n} g mouky. Kolik gramů mouky potřebuji na ${o} bochníků?`,ans:Math.round(n/m*o),hints:['Přímá: 1 bochník = '+n+'/'+m+' g.',''+o+'·'+Math.round(n/m)+' = '+Math.round(n/m*o)+' g'],skill:'anal'});
  // nepřímá — rychlost/čas
  const p=ri(3,6),q=ri(40,80),r2=ri(2,4);
  tasks.push({text:`Cesta trvá ${p} hodiny rychlostí ${q} km/h. Jak dlouho trvá stejná cesta rychlostí ${q*r2} km/h?`,ans:p/r2,hints:['Nepřímá: ${r2}× vyšší rychlost → ${r2}× kratší čas.',String(p/r2)],skill:'anal'});
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
  const g=ri(3,9),h=ri(3,9),ng=50;
  tasks.push({text:`Políčko je ${g} m × ${h} m. V měřítku 1 : ${ng*100} jaké jsou rozměry na plánu (cm × cm)? Zadej součin obou rozměrů (cm²).`,ans:r2(g*100/(ng*100)*100)*r2(h*100/(ng*100)*100),hints:['Každý rozměr ÷ měřítko v cm.',String(r2(g*100/(ng*100)*100))+' × '+String(r2(h*100/(ng*100)*100))],skill:'anal'});
  return tasks;
}

// ══════════════════════════════════════════════════════════
// OBLAST 5 — ZLATÁ POKLADNICE
// ══════════════════════════════════════════════════════════

// 5-1 Procentová část (MC — numerické)
function gen_5_1(){
  const tasks=[];
  const a=[10,20,25,50][ri(0,3)],b=ri(2,9)*100;
  tasks.push({text:`${a} % z ${b} = ?`,ans:Math.round(a/100*b),hints:['Procentová část = základ × p/100.',''+a+'/100·'+b+' = '+Math.round(a/100*b)],skill:'calc'});
  const c=ri(1,9)*10,d=ri(1,9)*100;
  tasks.push({text:`Kolik je ${c} % z ${d}?`,ans:Math.round(c/100*d),hints:['= '+d+' × '+c+'/100','= '+Math.round(c/100*d)],skill:'calc'});
  const e=ri(5,40),f=ri(4,20)*50;
  tasks.push({text:`${e} % z ${f} Kč = ? Kč`,ans:Math.round(e/100*f),hints:['= '+f+' × '+e+'/100','= '+Math.round(e/100*f)+' Kč'],skill:'calc'});
  const g=ri(10,40),h=ri(3,8)*100;
  tasks.push({text:`Cena zboží je ${h} Kč, sleva ${g} %. O kolik Kč zlevní?`,ans:Math.round(g/100*h),hints:['Sleva = základ × p/100.',''+g+'/100·'+h+' = '+Math.round(g/100*h)+' Kč'],skill:'calc'});
  const i=ri(5,30),j=ri(4,12)*100;
  tasks.push({text:`Žák má ${j} bodů z maxima, ve škole je to ${i} %. Kolik bodů je ${i} % z ${j}?`,ans:Math.round(i/100*j),hints:['Část = základ × p/100.',''+Math.round(i/100*j)],skill:'calc'});
  const k=ri(1,4)*25,l=ri(3,8)*40;
  tasks.push({text:`${k} % z ${l} = ?`,ans:Math.round(k/100*l),hints:['= '+l+' × '+k+'/100','= '+Math.round(k/100*l)],skill:'calc'});
  return tasks;
}

// 5-2 Počet procent a základ
function gen_5_2(){
  const tasks=[];
  // kolik procent
  const a=ri(2,8)*10,b=ri(3,9)*100;
  tasks.push({text:`${a} je kolik procent z ${b}? (výsledek v %)`,ans:Math.round(a/b*100),hints:['p = část/základ × 100.',''+a+'/'+b+' × 100 = '+Math.round(a/b*100)+'%'],skill:'calc'});
  const c=ri(2,6)*5,d=ri(4,12)*25;
  tasks.push({text:`${c} kg tvoří kolik procent z ${d} kg?`,ans:Math.round(c/d*100),hints:['p = '+c+'/'+d+' × 100','= '+Math.round(c/d*100)+'%'],skill:'calc'});
  // základ z části a procent
  const e=ri(1,4)*25,f=ri(2,8)*10;
  tasks.push({text:`${f} tvoří ${e} % z jakého čísla? (základ)`,ans:Math.round(f/e*100),hints:['základ = část / (p/100) = část × 100/p.',''+f+' × 100/'+e+' = '+Math.round(f/e*100)],skill:'calc'});
  const g=ri(10,30),h=ri(2,8)*100;
  tasks.push({text:`${h} Kč je ${g} % ceny. Jaká je plná cena?`,ans:Math.round(h/g*100),hints:['základ = '+h+' × 100/'+g,String(Math.round(h/g*100))+' Kč'],skill:'calc'});
  // zdražení
  const i=ri(2,5)*10,j=ri(3,10)*100;
  tasks.push({text:`Cena ${j} Kč se zdraží o ${i} %. Jaká bude nová cena?`,ans:Math.round(j*(1+i/100)),hints:['Nová cena = základ × (1 + p/100).',''+j+' × '+(1+i/100)+' = '+Math.round(j*(1+i/100))+' Kč'],skill:'calc'});
  // sleva — finální cena
  const k=ri(1,4)*10,l=ri(3,10)*200;
  tasks.push({text:`Zboží za ${l} Kč je v akci se slevou ${k} %. Jaká bude cena po slevě?`,ans:Math.round(l*(1-k/100)),hints:['Po slevě = základ × (1 − p/100).',''+l+' × '+(1-k/100)+' = '+Math.round(l*(1-k/100))+' Kč'],skill:'calc'});
  return tasks;
}

// 5-3 Slovní úlohy s procenty
function gen_5_3(){
  const tasks=[];
  const a=ri(2,5)*10,b=ri(3,9)*100,pA=ri(2,5)*5;
  tasks.push({text:`Obchod zdraží zboží o ${pA} %. Původní cena byla ${b} Kč. Nová cena?`,ans:Math.round(b*(1+pA/100)),hints:['Nová cena = ${b} × (1+${pA}/100).','= '+Math.round(b*(1+pA/100))+' Kč'],skill:'anal'});
  const c=ri(2,5)*5,d=ri(4,10)*200;
  tasks.push({text:`Cena se snížila o ${c} % a nyní je ${Math.round(d*(1-c/100))} Kč. Jaká byla původní cena?`,ans:d,hints:['Současná cena = základ × (1−'+c+'/100).','základ = '+Math.round(d*(1-c/100))+'/('+1-c/100+') = '+d+' Kč'],skill:'anal'});
  const e=ri(2,6)*5,f=ri(3,9)*100;
  tasks.push({text:`Třída má ${f} žáků, ${e} % jsou dívky. Kolik je dívek?`,ans:Math.round(f*e/100),hints:['Počet dívek = ${f}×${e}/100.',String(Math.round(f*e/100))],skill:'anal'});
  const g=ri(15,35)*4,h=ri(2,4)*5;
  tasks.push({text:`Ze zásoby ${g} litrů vody bylo použito ${h} %. Kolik litrů zbývá?`,ans:Math.round(g*(1-h/100)),hints:['Zbývá = základ × (1−p/100).',String(Math.round(g*(1-h/100)))+' l'],skill:'anal'});
  const i=ri(30,60),j=ri(30,60);
  tasks.push({text:`Trikot stál ${i} Kč, rifle ${j} Kč. O kolik procent je trikot levnější než rifle? (zaokrouhli na celé %)`,ans:Math.round((j-i)/j*100),hints:['p = rozdíl / základ × 100.',''+Math.round((j-i)/j*100)+'%'],skill:'anal'});
  const k=ri(3,9)*100,l=ri(110,140)/100;
  tasks.push({text:`Cena narostla o ${Math.round((l-1)*100)} % na ${Math.round(k*l)} Kč. Jaká byla původní cena?`,ans:k,hints:['Původní = nová / (1+p/100).',String(k)+' Kč'],skill:'anal'});
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
  return tasks;
}

// 6-2 Středová souměrnost
function gen_6_2(){
  const tasks=[];
  tasks.push({text:'Má čtverec středovou souměrnost?',ans:'ANO',hints:['Střed symetrie = průsečík úhlopříček.','ANO.'],skill:'geo'});
  tasks.push({text:'Má obecný trojúhelník středovou souměrnost?',ans:'NE',hints:['Trojúhelník středovou souměrností disponuje jen v degenero-vaném případě.','NE — trojúhelník ji nemá.'],skill:'geo'});
  const a=ri(2,8),b=ri(2,8);
  tasks.push({text:`Bod A [${a}, ${b}] je obrazem středové souměrnosti podle středu S [0, 0]. Jaká je x-souřadnice vzoru?`,ans:-a,hints:['Souřadnice vzoru jsou opačné k obrazu.','x-souřadnice vzoru = −'+a+' = '+(-a)],skill:'geo'});
  const c=ri(-5,5),d=ri(-5,5),sx=ri(-3,3),sy=ri(-3,3);
  tasks.push({text:`Střed souměrnosti je S [${sx}, ${sy}], vzor A [${c}, ${d}]. Jaká je x-souřadnice obrazu A'?`,ans:2*sx-c,hints:["Obraz: x' = 2·sx − x vzoru.",'= 2·'+sx+'−'+c+' = '+(2*sx-c)],skill:'geo'});
  tasks.push({text:'Má obdélník středovou souměrnost?',ans:'ANO',hints:['Střed souměrnosti = průsečík úhlopříček.','ANO.'],skill:'geo'});
  tasks.push({text:'Má pravidelný šestiúhelník středovou souměrnost?',ans:'ANO',hints:['Střed = průsečík os.','ANO.'],skill:'geo'});
  return tasks;
}

// 6-3 Shodnost trojúhelníků (věty sss, sus, usu)
function gen_6_3(){
  const tasks=[];
  tasks.push({text:'Trojúhelníky mají strany 3, 4, 5 a 3, 4, 5 cm. Jsou shodné?',ans:'ANO',hints:['Věta sss: všechny tři strany jsou stejné.','ANO.'],skill:'geo'});
  tasks.push({text:'Trojúhelníky mají strany 3, 4, 5 a 3, 4, 6 cm. Jsou shodné?',ans:'NE',hints:['Věta sss: třetí strany se liší.','NE.'],skill:'geo'});
  tasks.push({text:'Věta SUS: která dvě data stačí spolu s ohraničující stranou?',ans:'ANO',hints:['Dvě strany a sevřený úhel (sus = strana-úhel-strana).','ANO — věta sus platí.'],skill:'geo'});
  tasks.push({text:'Jsou trojúhelníky, které mají stejné tři úhly (uuu), nutně shodné?',ans:'NE',hints:['Stejné úhly garantují podobnost, nikoliv shodnost.','NE — mohou být jen podobné.'],skill:'geo'});
  const a=ri(3,8),b=ri(40,70),c=180-b-ri(30,b-10);
  tasks.push({text:`Trojúhelník ABC: a = ${a} cm, úhel β = ${b}°, úhel γ = ${c}°. Použij větu usu — jsou takto určeny dva trojúhelníky shodné?`,ans:'ANO',hints:['Věta usu: úhel-strana-úhel určuje trojúhelník jednoznačně.','ANO.'],skill:'geo'});
  tasks.push({text:'Věta SSS říká, že dva trojúhelníky jsou shodné, mají-li …?',ans:'ANO',hints:['… shodné délky všech tří stran.','ANO.'],skill:'geo'});
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
  return tasks;
}

// 7-3 Finální duel — mix všech témat
function gen_7_3(){
  const tasks=[];
  // zlomky + celá čísla
  const a=ri(2,6),b=ri(3,8);const g=gcd(a,b);
  tasks.push({text:`Výsledek: ${a}/${b} + ${b-a}/${b} = ?`,ans:`${b/b===1?1:b}/${b}`,hints:['Stejný jmenovatel, přičti.',''+a+'/'+ b+' + '+(b-a)+'/'+b+' = '+b+'/'+b+' = 1'],skill:'calc'});
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
