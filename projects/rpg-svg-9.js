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
// 🔴 Délka ramen se DOPOČÍTÁVÁ. Pevných 170 px se vešlo jen do úhlu ~50°;
// nad ním rameno vyjelo z viewBoxu a prohlížeč ho uříznul TIŠE (stránka
// nepřeteče, jen kus obrázku chybí). Naměřeno: u 90° chybělo 40 px, u 140°
// 70 px vlevo — a generátory v 6. ročníku losují až ri(100,160).
// Vrchol se přitom posouvá, aby byl obrázek v plátně vycentrovaný.
function svgAngle(deg,opt={}){
 const W=250,H=160,PAD=14,r=38;
 const rad=deg*Math.PI/180, co=Math.cos(rad), si=Math.sin(rad);
 // rameno směrem vpravo má délku len, druhé taky — musí se vejít obě
 const len=Math.min(170,(W-2*PAD)/(1-Math.min(0,co)),(H-2*PAD-16)/Math.max(si,0.001));
 // šířka/výška kresby v místní soustavě s vrcholem v počátku
 const minX=Math.min(0,len*co), maxX=len, maxY=0, minY=-len*si;
 const cx=+((W-(maxX-minX))/2-minX).toFixed(1), cy=+((H-(maxY-minY))/2-minY).toFixed(1);
 const x2=(cx+len*co).toFixed(1), y2=(cy-len*si).toFixed(1);
 const ax2=(cx+r*co).toFixed(1), ay2=(cy-r*si).toFixed(1);
 const lblx=(cx+(r+20)*Math.cos(rad/2)).toFixed(1), lbly=(cy-(r+20)*Math.sin(rad/2)+6).toFixed(1);
 return `<svg viewBox="0 0 ${W} ${H}"><line x1="${cx}" y1="${cy}" x2="${(cx+len).toFixed(1)}" y2="${cy}" stroke="#19e6e6" stroke-width="3.5"/><line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#19e6e6" stroke-width="3.5"/><path d="M ${(cx+r).toFixed(1)} ${cy} A ${r} ${r} 0 0 0 ${ax2} ${ay2}" fill="none" stroke="#ff3d7f" stroke-width="2.5"/>${opt.label?`<text x="${lblx}" y="${lbly}" fill="#ff3d7f" font-size="17" font-family="monospace" text-anchor="middle">${opt.label}</text>`:''}<circle cx="${cx}" cy="${cy}" r="3.5" fill="#fff"/></svg>`;
}
// Dvě protínající se přímky (vedlejší / vrcholové úhly). Vyznačí jeden úhel α.
// Šikmá přímka se stejně jako u svgAngle zkracuje, aby se vešla (nad 45° trčela ven).
function svgCross(deg,opt={}){
 const W=250,H=160,PAD=10,cx=125,cy=80,r=30;
 const rad=deg*Math.PI/180, co=Math.cos(rad), si=Math.sin(rad);
 const len=Math.min(115,(W/2-PAD)/Math.max(Math.abs(co),0.001),(H/2-PAD)/Math.max(si,0.001));
 const dx=len*co,dy=len*si;
 const ax2=(cx+r*co).toFixed(1), ay2=(cy-r*si).toFixed(1);
 const lblx=(cx+(r+16)*Math.cos(rad/2)).toFixed(1), lbly=(cy-(r+16)*Math.sin(rad/2)+5).toFixed(1);
 return `<svg viewBox="0 0 ${W} ${H}"><line x1="${cx-115}" y1="${cy}" x2="${cx+115}" y2="${cy}" stroke="#19e6e6" stroke-width="3"/><line x1="${(cx-dx).toFixed(1)}" y1="${(cy+dy).toFixed(1)}" x2="${(cx+dx).toFixed(1)}" y2="${(cy-dy).toFixed(1)}" stroke="#19e6e6" stroke-width="3"/><path d="M ${cx+r} ${cy} A ${r} ${r} 0 0 0 ${ax2} ${ay2}" fill="none" stroke="#ff3d7f" stroke-width="2.5"/><text x="${lblx}" y="${lbly}" fill="#ff3d7f" font-size="16" font-family="monospace" text-anchor="middle">${opt.label||'α'}</text><circle cx="${cx}" cy="${cy}" r="3.5" fill="#fff"/></svg>`;
}
// Kvádr / krychle v kosé projekci. Popisky a,b,c (šířka, výška, HLOUBKA).
// 🔴 Hloubka c patří k USTUPUJÍCÍ hraně, ne ke svislé. Dřív seděla u svislé
// hrany vpravo — tedy u téže hrany, kterou vyznačuje výška b — takže obrázek
// tvrdil, že kvádr má dvě výšky a žádnou hloubku.
// Těleso stojí od x=60, aby se vlevo vešel i šestiznakový popisek výšky
// („250 cm"): banka i hry dnes posílají nejvýš pět znaků, tohle je jeden
// znak rezervy. Při x=54 přetékal popisek o 4,5 px doleva a uřízl se.
function svgCuboid(a,b,c){
 // Popisky jdou na hrany podle VELIKOSTI: největší číslo k nejdelší nakreslené
 // hraně (šířka), prostřední k výšce, nejmenší k ustupující hloubce. Dřív šly
 // v pořadí argumentů, takže v 45 % kvádrů stálo „2“ u nejdelší hrany a „9“
 // u nejkratší. Není-li některý popisek číslo („?“) nebo mají popisky různé
 // jednotky („2 m“ proti „80 cm“), pořadí určuje volající.
 const cis=[a,b,c].map(v=>parseFloat(String(v).replace(',','.')));
 const jedn=[a,b,c].map(v=>String(v).replace(/^[\s\d.,−-]+/,''));
 if(cis.every(Number.isFinite)&&jedn.every(u=>u===jedn[0]))[a,b,c]=[a,b,c].map((v,i)=>[v,cis[i]]).sort((p,q)=>q[1]-p[1]).map(p=>p[0]);
 const x=60,y=118,w=104,h=72,d=30,dd=24;
 const f=`${x},${y} ${x+w},${y} ${x+w},${y-h} ${x},${y-h}`;
 // popisek c: kolmo ven od STŘEDU ustupující hrany (x+w,y) → (x+w+d,y-dd).
 // Musí stát u PROSTŘEDKU té hrany, ne za jejím koncem — jinak je stejně
 // daleko od svislé hrany jako od ní a nepozná se, co vlastně popisuje.
 // Vodicí čára se schválně NEKRESLÍ: v kosé projekci znamená čárkovaná čára
 // SKRYTOU HRANU (tak ji kreslí i CERMAT), takže by se četla jako další hrana.
 const cxL=(x+w+d/2+12).toFixed(1), cyL=(y-dd/2+21).toFixed(1);
 return `<svg viewBox="0 0 250 160"><polygon points="${x},${y-h} ${x+d},${y-h-dd} ${x+w+d},${y-h-dd} ${x+w},${y-h}" fill="#16203a" stroke="#19e6e6" stroke-width="2"/><polygon points="${x+w},${y} ${x+w+d},${y-dd} ${x+w+d},${y-h-dd} ${x+w},${y-h}" fill="#101a30" stroke="#19e6e6" stroke-width="2"/><polygon points="${f}" fill="#1b2742" stroke="#19e6e6" stroke-width="2.5"/><text x="${x+w/2}" y="${y+18}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="middle">${a}</text><text x="${x-8}" y="${y-h/2+5}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="end">${b}</text><text x="${cxL}" y="${cyL}" fill="#39ff9e" font-size="14" font-family="monospace" text-anchor="middle">${c}</text></svg>`;
}
// Trojúhelník daného typu s popisky úhlů/stran. kind: 'rovnostr'|'rovnoram'|'pravo'|'obecny'
// 🔴 Popisky vrcholů se odvozují z GEOMETRIE (ven od těžiště), ne z pořadí
// v poli. Pevná tabulka odsazení platila jen pro tvary „vrchol nahoře, dva
// dole"; u pravoúhlého trojúhelníku je ale první bod vlevo DOLE, takže popisek
// skončil uvnitř obrazce, přímo na značce pravého úhlu.
function svgTriangle(kind,opt={}){
 let p;
 if(kind==='rovnostr') p=[[125,30],[55,135],[195,135]];
 else if(kind==='rovnoram') p=[[125,28],[70,135],[180,135]];
 else if(kind==='pravo') p=[[55,135],[55,35],[195,135]];
 else p=[[60,40],[40,135],[205,120]];
 const pts=p.map(q=>q.join(',')).join(' ');
 const vlabels=(opt.v||['A','B','C']);
 const tx=(p[0][0]+p[1][0]+p[2][0])/3, ty=(p[0][1]+p[1][1]+p[2][1])/3;
 let txt='';
 p.forEach((q,i)=>{
  const dx=q[0]-tx, dy=q[1]-ty, dl=Math.hypot(dx,dy)||1;
  const lx=(q[0]+dx/dl*14).toFixed(1), ly=(q[1]+dy/dl*14+5).toFixed(1);
  txt+=`<text x="${lx}" y="${ly}" fill="#fff" font-size="14" font-family="monospace" text-anchor="middle">${vlabels[i]}</text>`;
 });
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
function svgParallelogram(a,v,b){
 /* Strany a, b bez výšky (úloha na obvod): v MĚŘÍTKU se sklonem 60°, ať se u kosočtverce
    strany i shodují. Dřív se druhé číslo vždy psalo jako výška „v = …", i když šlo o stranu. */
 if(v==null&&b!=null){
  const k=Math.min(140/(a+b*0.5),88/(b*0.866)),A=a*k,dx=b*0.5*k,dy=b*0.866*k,x0=(250-A-dx)/2,y0=125;
  const P=[[x0,y0],[x0+A,y0],[x0+A+dx,y0-dy],[x0+dx,y0-dy]].map(q=>q.map(n=>n.toFixed(1)).join(',')).join(' ');
  return `<svg viewBox="0 0 250 160"><polygon points="${P}" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/><text x="${(x0+A/2).toFixed(1)}" y="142" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="middle">a = ${a}</text><text x="${(x0+dx/2-8).toFixed(1)}" y="${(y0-dy/2+5).toFixed(1)}" fill="#ff3d7f" font-size="13" font-family="monospace" text-anchor="end">b = ${b}</text></svg>`;
 }
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
// Popisek r leží NAD horní podstavou. Dřív seděl na jejím obrysu (y=topY-5,
// tedy uvnitř elipsy vysoké 2·ry) a byl přes čáru špatně čitelný.
function svgCylinder(r,v){
 const cx=125,topY=35,h=85,rx=46,ry=14;
 const botY=topY+h;
 return `<svg viewBox="0 0 250 160"><path d="M ${cx-rx} ${topY} L ${cx-rx} ${botY} A ${rx} ${ry} 0 0 0 ${cx+rx} ${botY} L ${cx+rx} ${topY}" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/><ellipse cx="${cx}" cy="${botY}" rx="${rx}" ry="${ry}" fill="none" stroke="#19e6e6" stroke-width="2.5" stroke-dasharray="5 4"/><ellipse cx="${cx}" cy="${topY}" rx="${rx}" ry="${ry}" fill="#1b2742" stroke="#19e6e6" stroke-width="2.5"/><line x1="${cx}" y1="${topY}" x2="${cx+rx}" y2="${topY}" stroke="#ff3d7f" stroke-width="2"/><text x="${cx+rx/2}" y="${topY-ry-6}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="middle">r=${r}</text><text x="${cx+rx+8}" y="${topY+h/2}" fill="#ff3d7f" font-size="14" font-family="monospace">v=${v}</text></svg>`;
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

/* ── Kresby pro úlohy „základu" v přijímačkách a pro RPG (září 2026) ──────
   Stejné kresby jako v testu nanečisto, aby žák viděl tentýž obrázek
   v procvičování, diagnostice i ve hře. Rovinné útvary se kreslí VE
   SKUTEČNÉM POMĚRU stran — obrázek, který tvrdí něco jiného než čísla,
   mate (poučení z kvádru, kde stálo „2" u nejdelší hrany). Úhlové oblouky
   mají střed ve vrcholu a `sweep` se POČÍTÁ (viz CLAUDE.md). */
const _txt = (x, y, t, barva, kotva, vel) => `<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" fill="${barva || '#ff3d7f'}" font-size="${vel || 14}" font-family="monospace" text-anchor="${kotva || 'middle'}">${t}</text>`;
const _sirka = (t, vel) => String(t).length * (vel || 14) * 0.6;
// Oblouk úhlu u vrcholu V mezi směry na body P a Q (poloměr r).
function _oblouk(V, P, Q, r, barva) {
  const u = (A) => { const dx = A[0] - V[0], dy = A[1] - V[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
  const a = u(P), b = u(Q), sweep = (a[0] * b[1] - a[1] * b[0]) > 0 ? 1 : 0;
  const x1 = V[0] + r * a[0], y1 = V[1] + r * a[1], x2 = V[0] + r * b[0], y2 = V[1] + r * b[1];
  return `<path data-vrchol="${V[0].toFixed(1)} ${V[1].toFixed(1)}" data-r="${r}" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${barva || '#ff3d7f'}" stroke-width="2"/>`;
}
// Obdélník a × b (a vodorovně). Popisek la pod dolní hranou, lb vpravo;
// u čtverce stačí la. Nejkratší strana má aspoň 26 px.
function svgObdelnik(a, b, la, lb) {
  const W = 250, vpravo = lb ? _sirka(lb) + 10 : 0;
  const s = Math.min(Math.min(170, W - vpravo - 30) / Math.max(a, 1), 96 / Math.max(b, 1));
  const w = Math.max(26, a * s), h = Math.max(26, b * s), H = Math.round(h + 44);
  const x = (W - vpravo - w) / 2, y = 12;
  return `<svg viewBox="0 0 ${W} ${H}"><rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/>`
    + (la ? _txt(x + w / 2, y + h + 20, la) : '') + (lb ? _txt(x + w + 8, y + h / 2 + 5, lb, null, 'start') : '') + `</svg>`;
}
// Trojúhelník se základnou z a výškou v k ní (ve skutečném poměru). Pata
// výšky leží uvnitř základny, výška je čárkovaná se značkou pravého úhlu.
// Popisek výšky stojí vedle ní, a když se tam nevejde, vpravo od obrazce.
function svgTrojVyska(z, v, lz, lv) {
  const W = 250, sirV = lv ? _sirka(lv) : 0;
  let s = Math.min(170 / Math.max(z, 1), 100 / Math.max(v, 1));
  let w = Math.max(40, z * s), h = Math.max(30, v * s);
  const px = 0.3 * w, yb = h + 14;
  // Popisek výšky vedle čárkované čáry: zkusí se 62 % a 80 % výšky (dole je
  // obrazec širší), ale nesmí sjet na značku pravého úhlu u paty.
  let yl = null;
  for (const k of [0.62, 0.8]) {
    const y = 14 + k * h, misto = k * (w - px) - 8;
    if (sirV <= misto && y + 4 < yb - 12) { yl = y; break; }
  }
  const venku = yl === null;
  if (venku) {                                     // vpravo od obrazce, když se nevejde dovnitř
    w = Math.min(w, W - 34 - sirV); yl = 14 + 0.5 * h;
  }
  const H = Math.round(yb + 26), x0 = (W - w - (venku ? sirV + 12 : 0)) / 2;
  const A = [x0, yb], B = [x0 + w, yb], C = [x0 + 0.3 * w, 14];
  const pt = p => p.map(n => (+n).toFixed(1)).join(',');
  return `<svg viewBox="0 0 ${W} ${H}"><polygon points="${pt(A)} ${pt(B)} ${pt(C)}" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/>`
    + `<line x1="${C[0].toFixed(1)}" y1="${C[1]}" x2="${C[0].toFixed(1)}" y2="${yb}" stroke="#ff3d7f" stroke-width="2" stroke-dasharray="5 4"/>`
    + `<rect x="${C[0].toFixed(1)}" y="${yb - 10}" width="10" height="10" fill="none" stroke="#ff3d7f" stroke-width="1.5"/>`
    + (lz ? _txt(x0 + w / 2, yb + 20, lz) : '')
    + (lv ? _txt(venku ? x0 + w + 12 : C[0] + 7, yl, lv, null, 'start') : '') + `</svg>`;
}
// Vedlejší úhly: přímka a polopřímka z vrcholu. Zadaný úhel x° vpravo
// (popisek lx), vedlejší 180° − x vlevo (popisek ly, obvykle „?").
function svgVedlejsi(x, lx, ly) {
  const W = 250, H = 124, V = [125, 104], rad = x * Math.PI / 180;
  const L = Math.min(112, 92 / Math.max(Math.sin(rad), 0.001));
  const K = [V[0] + L * Math.cos(rad), V[1] - L * Math.sin(rad)], P = [V[0] + 112, V[1]], Q = [V[0] - 112, V[1]];
  const pol = (uhel, r) => [V[0] + r * Math.cos(uhel * Math.PI / 180), V[1] - r * Math.sin(uhel * Math.PI / 180) + 5];
  // Popisek musí mít od obou ramen aspoň půl výšky písma, i svým koncem
  // blíž k vrcholu: d · sin(θ/2) ≥ 9 pro d zmenšené o půl šířky popisku.
  const vzdal = (uhel, r, t) => Math.min(L - 8, Math.max(r + 20, 9 / Math.sin(uhel * Math.PI / 360) + _sirka(t) / 2 + 2));
  const p1 = pol(x / 2, vzdal(x, 24, lx)), p2 = pol((180 + x) / 2, vzdal(180 - x, 32, ly));
  return `<svg viewBox="0 0 ${W} ${H}"><line x1="${Q[0]}" y1="${V[1]}" x2="${P[0]}" y2="${V[1]}" stroke="#19e6e6" stroke-width="3"/>`
    + `<line x1="${V[0]}" y1="${V[1]}" x2="${K[0].toFixed(1)}" y2="${K[1].toFixed(1)}" stroke="#19e6e6" stroke-width="3"/>`
    + _oblouk(V, P, K, 24) + _oblouk(V, K, Q, 32, '#39ff9e')
    + _txt(p1[0], p1[1], lx) + _txt(p2[0], p2[1], ly, '#39ff9e') + `<circle cx="${V[0]}" cy="${V[1]}" r="3.5" fill="#fff"/></svg>`;
}
// Trojúhelník ABC sestrojený z úhlů α (u A), β (u B); γ se dopočítá.
// Popisky úhlů stojí vně vrcholů (v úzkém úhlu by uvnitř nebylo místo).
function svgTrojUhly(al, be, la, lb, lc) {
  const ra = al * Math.PI / 180, rb = be * Math.PI / 180, rg = Math.PI - ra - rb;
  const b = Math.sin(rb) / Math.sin(rg);                       // |AC| při |AB| = 1
  const cx = b * Math.cos(ra), cy = b * Math.sin(ra);
  const minX = Math.min(0, cx), maxX = Math.max(1, cx);
  const s = Math.min(150 / (maxX - minX), 92 / Math.max(cy, 0.01));
  const W = 250, x0 = (W - (maxX - minX) * s) / 2 - minX * s, yb = 22 + cy * s;
  const A = [x0, yb], B = [x0 + s, yb], C = [x0 + cx * s, yb - cy * s], H = Math.round(yb + 24);
  const r = Math.max(10, Math.min(20, 0.3 * s * Math.min(1, b)));
  return `<svg viewBox="0 0 ${W} ${H}"><polygon points="${[A, B, C].map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="#16203a" stroke="#19e6e6" stroke-width="2.5"/>`
    + _oblouk(A, B, C, r) + _oblouk(B, C, A, r) + _oblouk(C, A, B, r, '#39ff9e')
    + _txt(A[0] + 4, A[1] + 18, la, null, 'end') + _txt(B[0] - 4, B[1] + 18, lb, null, 'start')
    + _txt(C[0], C[1] - 8, lc, '#39ff9e') + `</svg>`;
}
/* Trojúhelník V MĚŘÍTKU ze tří stran („Trojúhelník má strany 7, 8, 9 cm").
   strany = [[délka, popisek], …]; dolů jde strana s indexem zakl (u rovnoramenného
   ZÁKLADNA — jinak by dole leželo rameno a dítě by ho vzalo za základnu), bez
   zakl nejdelší, aby trojúhelník „stál". Popisek leží vně, u středu své strany.
   Totéž rozložení má svgTroj v 1. stupni (rpg-mat-3.html). */
function svgTrojStrany(strany, zakl) {
  const S = strany.map(q => ({ d: q[0], t: q[1] }));
  const Z = zakl != null ? S[zakl] : S.reduce((m, q) => (q.d > m.d ? q : m));
  const [L, P] = S.filter(q => q !== Z).sort((p, q) => q.d - p.d);
  const x = (Z.d * Z.d + L.d * L.d - P.d * P.d) / (2 * Z.d), y = Math.sqrt(Math.max(0, L.d * L.d - x * x));
  const x0 = Math.min(0, x), x1 = Math.max(Z.d, x), k = Math.min(140 / (x1 - x0), 84 / Math.max(y, 1e-9));
  const ox = 125 - (x0 + x1) / 2 * k, oy = 124;
  const A = [ox, oy], B = [ox + Z.d * k, oy], C = [ox + x * k, oy - y * k];
  const T = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  let t = '';
  const pop = (U, V, txt) => {
    if (!txt) return;
    const mx = (U[0] + V[0]) / 2, my = (U[1] + V[1]) / 2;
    let nx = V[1] - U[1], ny = U[0] - V[0];
    const dl = Math.hypot(nx, ny) || 1; nx /= dl; ny /= dl;
    if ((mx - T[0]) * nx + (my - T[1]) * ny < 0) { nx = -nx; ny = -ny; }   // normála ven od těžiště
    const kotva = nx > 0.15 ? 'start' : nx < -0.15 ? 'end' : 'middle';
    t += _txt(mx + nx * 10, kotva !== 'middle' ? my + ny * 10 + 5 : (ny > 0 ? my + 19 : my - 8), txt, null, kotva);
  };
  pop(A, B, Z.t); pop(A, C, L.t); pop(B, C, P.t);
  return `<svg viewBox="0 0 250 160"><polygon data-kresba="strany" points="${[A, B, C].map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="#16203a" stroke="#19e6e6" stroke-width="2.5" stroke-linejoin="round"/>` + t + `</svg>`;
}
// Krychle: tři viditelné stěny, popisek u přední dolní hrany. Ustupující
// hrana je v kosém promítání poloviční (30 × 24 px ≈ 39 px k 78 px), takže
// obrázek je opravdu krychle — ne plochý kvádr jako svgCuboid(a, a, a).
function svgKrychle(t) {
  const x = 44, y = 128, s = 78, d = 30, dd = 24;
  return `<svg viewBox="0 0 196 152"><polygon points="${x},${y - s} ${x + d},${y - s - dd} ${x + s + d},${y - s - dd} ${x + s},${y - s}" fill="#16203a" stroke="#19e6e6" stroke-width="2"/><polygon points="${x + s},${y} ${x + s + d},${y - dd} ${x + s + d},${y - s - dd} ${x + s},${y - s}" fill="#101a30" stroke="#19e6e6" stroke-width="2"/><rect x="${x}" y="${y - s}" width="${s}" height="${s}" fill="#1b2742" stroke="#19e6e6" stroke-width="2.5"/><text x="${x + s / 2}" y="${y + 18}" fill="#ff3d7f" font-size="14" font-family="monospace" text-anchor="middle">${t}</text></svg>`;
}
// Kolmý trojboký hranol položený na boční stěně, stejně jako „Trojboký
// hranol" v testu nanečisto (svgLeziciHranol v rpg-cermat-9.js): vpředu
// trojúhelníková podstava se stranou a a výškou va k ní, hloubka v jde
// STRMĚ vzhůru (70°) — při sklonu 35° byla levá stěna jen proužek a těleso
// se nedalo přečíst. Kreslí se ve skutečném poměru a, va i v.
// Popisek výšky podstavy stojí u její paty, a když se tam nevejde (úzký
// trojúhelník), vlevo od obrazce.
function svgHranol3(a, va, v, la, lva, lv) {
  const k = Math.min(170 / Math.max(a, 1), 88 / Math.max(va, 1), 120 / Math.max(va + 0.5 * v, 1));
  const Z = a * k, V = va * k, g = Math.max(22, 0.5 * v * k), dx = g * 0.36, dy = g;
  const W = 300, x0 = Math.max(70, (W - Z - dx - 50) / 2), y0 = V + dy + 20, H = Math.round(y0 + 26);
  const P1 = [x0, y0], P2 = [x0 + Z, y0], P3 = [x0 + Z / 2, y0 - V], M = [x0 + Z / 2, y0];
  const sh = Q => [Q[0] + dx, Q[1] - dy];
  const pts = (...p) => p.map(q => q.map(n => n.toFixed(1)).join(',')).join(' ');
  const sirV = lva ? _sirka(lva) : 0, uvnitr = sirV <= 0.4 * Z - 12;
  return `<svg viewBox="0 0 ${W} ${H}"><polygon points="${pts(P1, P3, sh(P3), sh(P1))}" fill="#1b2742" stroke="#19e6e6" stroke-width="2"/>`
    + `<polygon points="${pts(P2, P3, sh(P3), sh(P2))}" fill="#101a30" stroke="#19e6e6" stroke-width="2"/>`
    + `<polygon points="${pts(P1, P2, P3)}" fill="#1b2742" stroke="#19e6e6" stroke-width="2.5"/>`
    + `<line x1="${P3[0].toFixed(1)}" y1="${P3[1].toFixed(1)}" x2="${M[0].toFixed(1)}" y2="${M[1].toFixed(1)}" stroke="#ff3d7f" stroke-width="2" stroke-dasharray="5 4"/>`
    + `<rect x="${M[0].toFixed(1)}" y="${(y0 - 9).toFixed(1)}" width="9" height="9" fill="none" stroke="#ff3d7f" stroke-width="1.5"/>`
    + (la ? _txt(x0 + Z / 2, y0 + 20, la) : '')
    + (lva ? (uvnitr ? _txt(M[0] + 12, y0 - 0.2 * V + 4, lva, null, 'start') : _txt(x0 + Z / 4 - 8, y0 - V / 2 + 5, lva, null, 'end')) : '')
    + (lv ? _txt((P2[0] + sh(P2)[0]) / 2 + 10, (P2[1] + sh(P2)[1]) / 2 + 6, lv, '#39ff9e', 'start') : '') + `</svg>`;
}
