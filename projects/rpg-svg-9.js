/* ─────────────────────────────────────────────────────────────────────────
   Sdílené g9 helpery — jediný zdroj pravdy pro rpg-mat-9.html (hra) i
   přijímačkový hub (prijimacky-matematika/). Dřív byly inline v rpg-mat-9.html
   a generátor (rpg-cermat-9.js) na nich spoléhal → v hubu chyběly.
   Obsah: malé matematické helpery + knihovna SVG diagramů (v měřítku).
   Načítat PŘED hlavním skriptem hry i před rpg-cermat-9.js/rpg-tasks-9.js.
   ───────────────────────────────────────────────────────────────────────── */

// ── Matematické helpery ──
const ri = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
// náhodné zamíchání kopie pole (Fisher–Yates)
function shuffleArr(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}
function countDiv(n){let c=0;for(let i=1;i<=n;i++)if(n%i===0)c++;return c;}
// české skloňování podle počtu: skl(n,'kamarád','kamarádi','kamarádů')
const skl = (n,one,few,many) => n===1?one : (n>=2&&n<=4?few:many);
const cz = n => String(n).replace('.',',');

// ── SVG diagramy (v měřítku, self-describing data-atributy pro testy) ──
function svgAngle(deg,opt={}){
 const cx=60,cy=130,len=170,r=38;
 const rad=deg*Math.PI/180;
 const x2=(cx+len*Math.cos(rad)).toFixed(1), y2=(cy-len*Math.sin(rad)).toFixed(1);
 const ax2=(cx+r*Math.cos(rad)).toFixed(1), ay2=(cy-r*Math.sin(rad)).toFixed(1);
 const lblx=(cx+(r+20)*Math.cos(rad/2)).toFixed(1), lbly=(cy-(r+20)*Math.sin(rad/2)+6).toFixed(1);
 return `<svg viewBox="0 0 250 160"><line x1="${cx}" y1="${cy}" x2="${cx+len}" y2="${cy}" stroke="#19e6e6" stroke-width="3.5"/><line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#19e6e6" stroke-width="3.5"/><path d="M ${cx+r} ${cy} A ${r} ${r} 0 0 0 ${ax2} ${ay2}" fill="none" stroke="#ff3d7f" stroke-width="2.5"/>${opt.label?`<text x="${lblx}" y="${lbly}" fill="#ff3d7f" font-size="17" font-family="monospace" text-anchor="middle">${opt.label}</text>`:''}<circle cx="${cx}" cy="${cy}" r="3.5" fill="#fff"/></svg>`;
}
// Dvě protínající se přímky (vedlejší / vrcholové úhly). Vyznačí jeden úhel α.
function svgCross(deg,opt={}){
 const cx=125,cy=80,len=115;
 const rad=deg*Math.PI/180,r=30;
 const dx=len*Math.cos(rad),dy=len*Math.sin(rad);
 const ax2=(cx+r*Math.cos(rad)).toFixed(1), ay2=(cy-r*Math.sin(rad)).toFixed(1);
 const lblx=(cx+(r+16)*Math.cos(rad/2)).toFixed(1), lbly=(cy-(r+16)*Math.sin(rad/2)+5).toFixed(1);
 return `<svg viewBox="0 0 250 160"><line x1="${cx-len}" y1="${cy}" x2="${cx+len}" y2="${cy}" stroke="#19e6e6" stroke-width="3"/><line x1="${(cx-dx).toFixed(1)}" y1="${(cy+dy).toFixed(1)}" x2="${(cx+dx).toFixed(1)}" y2="${(cy-dy).toFixed(1)}" stroke="#19e6e6" stroke-width="3"/><path d="M ${cx+r} ${cy} A ${r} ${r} 0 0 0 ${ax2} ${ay2}" fill="none" stroke="#ff3d7f" stroke-width="2.5"/><text x="${lblx}" y="${lbly}" fill="#ff3d7f" font-size="16" font-family="monospace" text-anchor="middle">${opt.label||'α'}</text><circle cx="${cx}" cy="${cy}" r="3.5" fill="#fff"/></svg>`;
}
// Kvádr / krychle v kosé projekci. Popisky a,b,c (šířka, výška, hloubka).
function svgCuboid(a,b,c){
 const x=54,y=118,w=104,h=72,d=30,dd=24;
 const f=`${x},${y} ${x+w},${y} ${x+w},${y-h} ${x},${y-h}`;
 return `<svg viewBox="0 0 250 160"><polygon points="${x},${y-h} ${x+d},${y-h-dd} ${x+w+d},${y-h-dd} ${x+w},${y-h}" fill="#16203a" stroke="#19e6e6" stroke-width="2"/><polygon points="${x+w},${y} ${x+w+d},${y-dd} ${x+w+d},${y-h-dd} ${x+w},${y-h}" fill="#101a30" stroke="#19e6e6" stroke-width="2"/><polygon points="${f}" fill="#1b2742" stroke="#19e6e6" stroke-width="2.5"/><text x="${x+w/2}" y="${y+18}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="middle">${a}</text><text x="${x-8}" y="${y-h/2+5}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="end">${b}</text><text x="${x+w+d+5}" y="${y-h/2+5}" fill="#39ff9e" font-size="14" font-family="monospace" text-anchor="start">${c}</text></svg>`;
}
// Trojúhelník daného typu s popisky úhlů/stran. kind: 'rovnostr'|'rovnoram'|'pravo'|'obecny'
function svgTriangle(kind,opt={}){
 let p;
 if(kind==='rovnostr') p=[[125,30],[55,135],[195,135]];
 else if(kind==='rovnoram') p=[[125,28],[70,135],[180,135]];
 else if(kind==='pravo') p=[[55,135],[55,35],[195,135]];
 else p=[[60,40],[40,135],[205,120]];
 const pts=p.map(q=>q.join(',')).join(' ');
 const vlabels=(opt.v||['A','B','C']);
 const off=[[0,-10],[-12,14],[12,14]];
 let txt='';
 p.forEach((q,i)=>{txt+=`<text x="${q[0]+off[i][0]}" y="${q[1]+off[i][1]}" fill="#fff" font-size="14" font-family="monospace" text-anchor="middle">${vlabels[i]}</text>`;});
 let extra=opt.extra||'';
 return `<svg viewBox="0 0 250 165"><polygon points="${pts}" fill="#16203a" stroke="#19e6e6" stroke-width="3"/>${kind==='pravo'?`<rect x="55" y="120" width="15" height="15" fill="none" stroke="#ff3d7f" stroke-width="2"/>`:''}${txt}${extra}</svg>`;
}
// Pravoúhlý trojúhelník V MĚŘÍTKU (pro slovní úlohy s Pythagorem).
// Pravý úhel u C (dole vlevo, γ). Vodorovná odvěsna C→B = strana a, svislá C→A = strana b, přepona A→B = c.
// aLen/bLen = skutečné délky odvěsen (kreslí se proporčně). Popisky přes opt.la/lb/lc (řetězce; '' = skrýt).
function svgRightTri(aLen,bLen,opt={}){
 const Cx=58,Cy=140,mx=aLen>=bLen; // uniformní měřítko: obě odvěsny se vejdou
 const s=Math.min(150/Math.max(aLen,1),100/Math.max(bLen,1));
 const Bx=+(Cx+aLen*s).toFixed(1), By=Cy;
 const Ax=Cx, Ay=+(Cy-bLen*s).toFixed(1);
 const msz=13;
 const la=opt.la!==undefined?opt.la:'a', lb=opt.lb!==undefined?opt.lb:'b', lc=opt.lc!==undefined?opt.lc:'c';
 const vl=opt.v||['A','B','C']; // A(nahoře vlevo), B(dole vpravo), C(dole vlevo=pravý úhel)
 let t='';
 // strana a — dolní hrana C→B (pod ní)
 if(la) t+=`<text x="${((Cx+Bx)/2).toFixed(1)}" y="${Cy+18}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="middle">${la}</text>`;
 // strana b — levá hrana C→A (vlevo od ní)
 if(lb) t+=`<text x="${Cx-9}" y="${((Cy+Ay)/2+5).toFixed(1)}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="end">${lb}</text>`;
 // strana c — přepona A→B (vpravo nahoře od středu)
 if(lc) t+=`<text x="${((Ax+Bx)/2+8).toFixed(1)}" y="${((Ay+By)/2-4).toFixed(1)}" fill="#39ff9e" font-size="14" font-family="monospace" text-anchor="start">${lc}</text>`;
 // vrcholy
 t+=`<text x="${Ax-11}" y="${Ay+4}" fill="#fff" font-size="13" font-family="monospace" text-anchor="middle">${vl[0]}</text>`;
 t+=`<text x="${Bx+11}" y="${By+14}" fill="#fff" font-size="13" font-family="monospace" text-anchor="middle">${vl[1]}</text>`;
 t+=`<text x="${Cx-11}" y="${Cy+14}" fill="#fff" font-size="13" font-family="monospace" text-anchor="middle">${vl[2]}</text>`;
 return `<svg viewBox="0 0 250 165"><polygon points="${Cx},${Cy} ${Bx},${By} ${Ax},${Ay}" fill="#16203a" stroke="#19e6e6" stroke-width="3"/><rect x="${Cx}" y="${Cy-msz}" width="${msz}" height="${msz}" fill="none" stroke="#ff3d7f" stroke-width="2"/>${t}</svg>`;
}
// Útvar s osou souměrnosti (svislá čárkovaná osa). Pro osovou souměrnost.
function svgMirror(shape){
 const axis=`<line x1="125" y1="15" x2="125" y2="150" stroke="#ff3d7f" stroke-width="2" stroke-dasharray="6 5"/>`;
 let body='';
 if(shape==='L') body=`<polygon points="60,40 95,40 95,110 130,110 130,135 60,135" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/>`;
 else if(shape==='flag') body=`<polygon points="70,40 110,55 70,70" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/><line x1="70" y1="40" x2="70" y2="135" stroke="#19e6e6" stroke-width="2.5"/>`;
 else body=`<circle cx="85" cy="85" r="30" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/>`;
 return `<svg viewBox="0 0 250 160">${axis}${body}</svg>`;
}
// Bod a jeho obraz ve středové souměrnosti (střed S uprostřed).
function svgPointSym(){
 return `<svg viewBox="0 0 250 160"><line x1="20" y1="80" x2="230" y2="80" stroke="#2a3a5e" stroke-width="1.5"/><line x1="125" y1="15" x2="125" y2="145" stroke="#2a3a5e" stroke-width="1.5"/><circle cx="125" cy="80" r="4" fill="#ff3d7f"/><text x="131" y="76" fill="#ff3d7f" font-size="13" font-family="monospace">S</text><circle cx="80" cy="52" r="5" fill="#19e6e6"/><text x="62" y="50" fill="#19e6e6" font-size="13" font-family="monospace">A</text><circle cx="170" cy="108" r="5" fill="#19e6e6" opacity=".5"/><text x="178" y="112" fill="#19e6e6" font-size="13" font-family="monospace">A'</text><line x1="80" y1="52" x2="170" y2="108" stroke="#39ff9e" stroke-width="1.5" stroke-dasharray="4 4"/></svg>`;
}
// Rovnoběžník se stranou a (dole) a výškou v.
function svgParallelogram(a,v){
 return `<svg viewBox="0 0 250 160"><polygon points="55,125 185,125 215,45 85,45" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/><line x1="115" y1="125" x2="115" y2="45" stroke="#ff3d7f" stroke-width="2" stroke-dasharray="5 4"/><rect x="115" y="113" width="12" height="12" fill="none" stroke="#ff3d7f" stroke-width="1.5"/><text x="120" y="142" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="middle">a = ${a}</text><text x="121" y="90" fill="#ff3d7f" font-size="13" font-family="monospace" text-anchor="start">v = ${v}</text></svg>`;
}
// Lichoběžník: a (dolní základna), c (horní základna), v (výška).
function svgTrapezoid(a,c,v){
 return `<svg viewBox="0 0 250 160"><polygon points="40,125 210,125 165,45 85,45" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/><line x1="110" y1="125" x2="110" y2="45" stroke="#ff3d7f" stroke-width="2" stroke-dasharray="5 4"/><rect x="110" y="113" width="12" height="12" fill="none" stroke="#ff3d7f" stroke-width="1.5"/><text x="125" y="142" fill="#ff3d7f" font-size="13" font-family="monospace" text-anchor="middle">a = ${a}</text><text x="125" y="38" fill="#39ff9e" font-size="13" font-family="monospace" text-anchor="middle">c = ${c}</text><text x="116" y="90" fill="#ff3d7f" font-size="13" font-family="monospace" text-anchor="start">v = ${v}</text></svg>`;
}

// Graf lineární funkce y = kx + q (osy + přímka).
function svgLineGraph(k,q){
 const ox=125,oy=80,u=11;
 const Y=x=>oy-(k*x+q)*u;
 const cl=v=>Math.max(8,Math.min(152,v));
 let x1=-9,x2=9,X1=ox+x1*u,X2=ox+x2*u,Y1=Y(x1),Y2=Y(x2);
 return `<svg viewBox="0 0 250 160" data-lgk="${k}"><line x1="10" y1="${oy}" x2="240" y2="${oy}" stroke="#2a3a5e" stroke-width="1.5"/><line x1="${ox}" y1="6" x2="${ox}" y2="154" stroke="#2a3a5e" stroke-width="1.5"/><line data-lgline="1" x1="${X1.toFixed(1)}" y1="${cl(Y1).toFixed(1)}" x2="${X2.toFixed(1)}" y2="${cl(Y2).toFixed(1)}" stroke="#19e6e6" stroke-width="3"/><circle cx="${ox}" cy="${cl(Y(0)).toFixed(1)}" r="3.5" fill="#ff3d7f"/><text x="232" y="${oy-6}" fill="#5d6e94" font-size="12" font-family="monospace">x</text><text x="${ox+5}" y="14" fill="#5d6e94" font-size="12" font-family="monospace">y</text></svg>`;
}
// Válec: r poloměr podstavy, v výška.
function svgCylinder(r,v){
 const cx=125,topY=35,h=85,rx=46,ry=14;
 const botY=topY+h;
 return `<svg viewBox="0 0 250 160"><path d="M ${cx-rx} ${topY} L ${cx-rx} ${botY} A ${rx} ${ry} 0 0 0 ${cx+rx} ${botY} L ${cx+rx} ${topY}" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/><ellipse cx="${cx}" cy="${botY}" rx="${rx}" ry="${ry}" fill="none" stroke="#19e6e6" stroke-width="2.5" stroke-dasharray="5 4"/><ellipse cx="${cx}" cy="${topY}" rx="${rx}" ry="${ry}" fill="#1b2742" stroke="#19e6e6" stroke-width="2.5"/><line x1="${cx}" y1="${topY}" x2="${cx+rx}" y2="${topY}" stroke="#ff3d7f" stroke-width="2"/><text x="${cx+rx/2}" y="${topY-5}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="middle">r=${r}</text><text x="${cx+rx+8}" y="${topY+h/2}" fill="#ff3d7f" font-size="14" font-family="monospace">v=${v}</text></svg>`;
}
// Kužel: r poloměr podstavy, v výška.
function svgCone(r,v){
 const cx=125,apexY=20,h=100,rx=46,ry=13;
 const baseY=apexY+h;
 return `<svg viewBox="0 0 250 160"><path d="M ${cx} ${apexY} L ${cx-rx} ${baseY} A ${rx} ${ry} 0 0 0 ${cx+rx} ${baseY} Z" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/><ellipse cx="${cx}" cy="${baseY}" rx="${rx}" ry="${ry}" fill="none" stroke="#19e6e6" stroke-width="2.5" stroke-dasharray="5 4"/><line x1="${cx}" y1="${apexY}" x2="${cx}" y2="${baseY}" stroke="#39ff9e" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${cx+10}" y="${apexY+h/2}" fill="#39ff9e" font-size="13" font-family="monospace">v=${v}</text><text x="${cx+rx/2}" y="${baseY+ry+12}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="middle">r=${r}</text></svg>`;
}
// Koule s poloměrem r.
function svgSphere(r){
 const cx=125,cy=80,R=52;
 return `<svg viewBox="0 0 250 160"><circle cx="${cx}" cy="${cy}" r="${R}" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/><ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="16" fill="none" stroke="#19e6e6" stroke-width="1.8" stroke-dasharray="5 4"/><line x1="${cx}" y1="${cy}" x2="${cx+R}" y2="${cy}" stroke="#ff3d7f" stroke-width="2"/><text x="${cx+R/2}" y="${cy-6}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="middle">r=${r}</text><circle cx="${cx}" cy="${cy}" r="3" fill="#ff3d7f"/></svg>`;
}
// Dva podobné trojúhelníky (malý + velký) s koeficientem k.
function svgSimilar(k){
 return `<svg viewBox="0 0 250 160"><polygon points="30,120 90,120 30,75" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/><polygon points="130,135 240,135 130,55" fill="#16203a" stroke="#39ff9e" stroke-width="2.5"/><text x="60" y="138" fill="#5d6e94" font-size="12" font-family="monospace" text-anchor="middle">orig.</text><text x="185" y="152" fill="#5d6e94" font-size="12" font-family="monospace" text-anchor="middle">obraz</text><text x="125" y="22" fill="#ff3d7f" font-size="15" font-family="monospace" text-anchor="middle">k = ${k}</text></svg>`;
}
// Číselná osa (min..max) s ticky. opt.point = zvýrazněný bod, opt.arrow={from,to} = pohyb, opt.arrowLabel.
// Self-describing (data-nl*) pro test pozicní věrnosti: tick = data-nltick, bod = data-nlval.
function svgNumLine(min,max,opt={}){
 const x0=25,x1=225,ay=52,rng=(max-min)||1;
 const px=v=>+(x0+(v-min)/rng*(x1-x0)).toFixed(1);
 const step=rng<=12?1:(rng<=24?2:5);
 let ticks='';
 for(let v=Math.ceil(min/step)*step; v<=max; v+=step){
  const X=px(v),zero=v===0;
  ticks+=`<line x1="${X}" y1="${ay-4}" x2="${X}" y2="${ay+4}" stroke="${zero?'#fff':'#5d6e94'}" stroke-width="${zero?2.5:1.5}"/><text data-nltick="${v}" x="${X}" y="${ay+18}" fill="${zero?'#fff':'#8a9bc4'}" font-size="12" font-family="monospace" text-anchor="middle">${v}</text>`;
 }
 let extra='';
 if(opt.arrow){const A=px(opt.arrow.from),B=px(opt.arrow.to),mid=((A+B)/2).toFixed(1);
  extra+=`<path d="M ${A} ${ay-6} Q ${mid} ${ay-26} ${B} ${ay-6}" fill="none" stroke="#39ff9e" stroke-width="2"/><polygon points="${B},${ay-2} ${(B-5).toFixed(1)},${ay-11} ${(B+5).toFixed(1)},${ay-11}" fill="#39ff9e"/>`;
  if(opt.arrowLabel) extra+=`<text x="${mid}" y="${ay-29}" fill="#39ff9e" font-size="13" font-family="monospace" text-anchor="middle">${opt.arrowLabel}</text>`;
 }
 let pt='';
 if(opt.point!==undefined){const X=px(opt.point);pt+=`<circle cx="${X}" cy="${ay}" r="5" fill="#ff3d7f" data-nlval="${opt.point}"/>`;}
 return `<svg viewBox="0 0 250 92" data-nlmin="${min}" data-nlmax="${max}" data-nlx0="${x0}" data-nlx1="${x1}"><line x1="${x0-4}" y1="${ay}" x2="${x1+4}" y2="${ay}" stroke="#5d6e94" stroke-width="2"/>${ticks}${extra}${pt}</svg>`;
}
