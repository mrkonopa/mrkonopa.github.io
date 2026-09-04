/* ══════════════════════════════════════════════════════════════════
   VĚŽ LEGEND — společné jádro pro 6.–9. ročník

   Věž je jen na 2. stupni (1. stupeň ji schválně nemá), proto samostatný
   modul místo `rpg-shared.js`, který načítá všech sedm her — jinak by
   třeťákům do jmenného prostoru spadlo `twHoliday()` a spol.

   Tyhle funkce vznikly portem z 9. ročníku (tools/port-tower.cjs) a byly
   ve všech čtyřech hrách byte po bytu totožné. Co se mezi ročníky LIŠÍ,
   zůstává ve hře: `renderTowerGate`, `twEndRun`, `twEsc`, `twRM` (tematické
   barvy a texty) a konstanty `TW`, `TWA`, `TW_FH`, `TW_CLEANER*`.

   Modul se načítá s `defer`, tedy až po inline skriptu hry. Funkce sahají
   na herní globály až při VOLÁNÍ, takže na pořadí nezáleží — nesmí sem ale
   přibýt nic, co by se volalo při parsování stránky.
   ══════════════════════════════════════════════════════════════════ */
function twAnimStart(){if(TWA.on)return;TWA.on=true;TWA.last=performance.now();requestAnimationFrame(twLoop);}
function twAnimStop(){TWA.on=false;}
function twAnswerYN(v){
 if(!TW.on)return;
 twStopTimer();
 if(checkAns(v,TW.task.ans))twCorrect();else twWrong(v,false);
}
function twClimbAnim(){if(twRM())TWA.scroll+=TW_FH;else TWA.climbT=800;}
function twCorrect(){
 const fb=document.getElementById('tw-fb');
 fb.className='feedback ok';fb.textContent='⬆ SPRÁVNĚ! Stoupáš do '+(TW.floor+1)+'. patra…';
 TW.floor++;
 wBump('tasks');wMax('towerFloor',TW.floor);
 twClimbAnim();
 twStats();
 setTimeout(()=>{if(TW.on)twDrawTask();},twRM()?250:900);
}
function twDrawCleaner(x,px,py,sc,frame){
 const g=TW_CLEANER[frame?1:0],s=Math.ceil(sc);
 for(let r=0;r<g.length;r++)for(let c=0;c<g[r].length;c++){const ch=g[r][c];if(ch==='.')continue;x.fillStyle=TW_CLEANER_PAL[ch]||'#f0f';x.fillRect(Math.round(px+c*sc),Math.round(py+r*sc),s,s);}
}
function twExit(){twStopRun();go('map');}
function twGiveUp(){if(TW.on)twEndRun();}
function twHoliday(){
 const d=window.__TW_TESTNOW?new Date(window.__TW_TESTNOW):new Date();
 const m=d.getMonth();
 return {on:(m===6||m===7)};
}
function twLimit(){return Math.max(12,40-Math.floor((TW.floor-1)*1.2));}
function twLoop(now){
 if(!TWA.on)return;
 const dt=Math.min(50,now-TWA.last);TWA.last=now;
 if(!twRM()){
  TWA.rot+=dt*0.00022*(TWA.climbT>0?7:1);          // věž se pomalu točí, při výstupu rychleji
  if(TWA.climbT>0){TWA.scroll+=dt/800*TW_FH;TWA.climbT=Math.max(0,TWA.climbT-dt);}
  TWA.tick+=dt;
  TWA.snowT=(TWA.snowT||0)+dt;
  if(TWA.tick>(TWA.climbT>0?130:520)){TWA.tick=0;TWA.frame^=1;}
 }
 twDrawCanvas();
 requestAnimationFrame(twLoop);
}
function twMids(){return AREAS.flatMap(a=>a.missions.map(m=>m.id));}
function twMissionFor(floor){
 const mids=twMids();
 // patro 1–21 = mise vzestupně; výš už náhodně z posledních dvou oblastí
 const idx=floor<=mids.length?floor-1:mids.length-6+Math.floor(Math.random()*6);
 const mid=mids[idx];
 const ar=AREAS.find(a=>a.missions.some(m=>m.id===mid));
 return ar.missions.find(m=>m.id===mid);
}
function twNext(){if(TW.on)twDrawTask();}
function twPickMC(opt,btn){
 if(!TW.on)return;
 twStopTimer();
 document.querySelectorAll('#tw-mc .mc-btn').forEach(b=>b.disabled=true);
 if(checkAns(opt,TW.task.ans)){btn.classList.add('right');twCorrect();}
 else{btn.classList.add('wrong');twWrong(opt,false);}
}
function twRenderMC(t){
 const grid=document.getElementById('tw-mc');
 grid.style.display='grid';
 const correct=czMC(t.ans),cn=parseFloat(String(correct).replace(',','.'));
 const opts=new Set([correct]);
 if(Array.isArray(t.distractors))t.distractors.forEach(d=>{const s=czMC(d);if(s!==correct&&opts.size<4)opts.add(s);});
 if(!isNaN(cn)&&cn!==0){const opp=czMC(-cn);if(opp!==String(correct))opts.add(opp);}
 let tries=0;
 while(opts.size<4&&tries<30){tries++;let alt;
  if(!isNaN(cn)){const delta=ri(-5,5)||ri(1,3);let v=Math.round((cn+delta)*100)/100;if(Number.isInteger(cn)&&Math.abs(cn)<200)v=cn+delta;alt=czMC(v);}
  else alt=correct==='ANO'?'NE':'ANO';
  if(alt!==correct)opts.add(alt);
 }
 const arr=[...opts].sort(()=>Math.random()-.5);
 grid.innerHTML='';
 arr.forEach((opt,i)=>{const b=document.createElement('button');b.className='mc-btn c'+i;b.innerHTML='<span class="mc-key">'+'ABCD'[i]+'</span>'+twEsc(opt);b.onclick=()=>twPickMC(opt,b);grid.appendChild(b);});
}
function twRenderTask(){
 const t=TW.task;
 const probEl=document.getElementById('tw-prob');
 if(t.svg){probEl.innerHTML='<div class="prob-svg">'+t.svg+'</div><div class="prob-txt"></div>';probEl.querySelector('.prob-txt').textContent=t.text;}
 else probEl.textContent=t.text;
 probEl.classList.remove('pop');void probEl.offsetWidth;probEl.classList.add('pop');
 const fb=document.getElementById('tw-fb');fb.className='feedback';fb.textContent='';
 document.getElementById('tw-next-btn').style.display='none';
 if(TW.m.mc){
  document.getElementById('tw-input-row').style.display='none';
  document.getElementById('tw-yn-row').style.display='none';
  twRenderMC(t);
 }else{
  const yn=isYN(t);
  document.getElementById('tw-input-row').style.display=yn?'none':'flex';
  document.getElementById('tw-yn-row').style.display=yn?'flex':'none';
  document.getElementById('tw-mc').style.display='none';
  const inp=document.getElementById('tw-ans');inp.value='';inp.disabled=false;if(!yn)inp.focus();inp.inputMode=/^\d+$/.test(String(TW.task.ans))?'numeric':/^\d+[.,]\d+$/.test(String(TW.task.ans))?'decimal':'text';
 }
}
function twStart(){
 if(twHoliday().on){renderTowerGate();return;}   // o prázdninách nelze vstoupit
 if(!S.tower)S.tower={best:0};
 TW.on=true;TW.floor=1;TW.lives=3;
 TWA.scroll=0;
 document.getElementById('tw-gate').style.display='none';
 document.getElementById('tw-end').style.display='none';
 document.getElementById('tw-play').style.display='block';
 twAnimStart();
 twStats();
 twDrawTask();
}
function twStartTimer(){
 twStopTimer();
 TW.t0=Date.now();
 const lim=twLimit();
 document.getElementById('tw-timer-v').textContent=lim;
 document.getElementById('tw-timer-bar').style.width='100%';
 TW.timer=setInterval(()=>{
  const left=lim-(Date.now()-TW.t0)/1000;
  document.getElementById('tw-timer-v').textContent=Math.max(0,Math.ceil(left));
  document.getElementById('tw-timer-bar').style.width=Math.max(0,left/lim*100)+'%';
  if(left<=0){twStopTimer();twWrong(null,true);}
 },100);
}
function twStats(){
 document.getElementById('tw-floor').textContent=TW.floor;
 document.getElementById('tw-best').textContent=(S.tower&&S.tower.best)|0;
 document.getElementById('tw-lives').textContent='❤️'.repeat(TW.lives)+'🖤'.repeat(3-TW.lives);
}
function twStopRun(){TW.on=false;twStopTimer();}
function twStopTimer(){if(TW.timer){clearInterval(TW.timer);TW.timer=null;}}
function twSubmit(){
 if(!TW.on)return;
 const inp=document.getElementById('tw-ans');const v=inp.value;
 if(!v.trim())return;
 twStopTimer();inp.disabled=true;
 if(checkAns(v,TW.task.ans))twCorrect();else twWrong(v,false);
}
function twWinter(){
 const d=window.__TW_TESTNOW?new Date(window.__TW_TESTNOW):new Date();
 const m=d.getMonth();
 return {on:(m===11||m===0)};
}
function twWrong(given,timeout){
 TW.lives--;
 if(!S.errs)S.errs={};if(TW.m){S.errs[TW.m.id]=(S.errs[TW.m.id]||0)+1;saveS();}
 const fb=document.getElementById('tw-fb');
 fb.className='feedback err';
 fb.textContent=(timeout?'⏱ ČAS VYPRŠEL!':'✗ Špatně.')+' Správně: '+TW.task.ans+(TW.lives>0?' — ztrácíš ❤':'');
 const inp=document.getElementById('tw-ans');inp.disabled=true;
 twStats();
 if(TW.lives<=0){setTimeout(twEndRun,900);return;}
 const nb=document.getElementById('tw-next-btn');nb.style.display='inline-block';nb.focus();
}
