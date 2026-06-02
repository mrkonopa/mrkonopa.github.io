/**
 * Audit rozšiřující banky úloh rpg-tasks-7.js
 * Spusť: node tests/rpg-tasks-7.audit.cjs
 * Generuje každý generátor mnohokrát a hlídá NaN/undefined + MC-bezpečnost.
 */
const fs = require('fs');
const path = require('path');

// stub globální helpery (stejné chování jako ve hře)
global.ri = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
global.gcd = function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);};
global.window = {};

const code = fs.readFileSync(path.join(__dirname,'..','projects','rpg-tasks-7.js'),'utf8');
new Function(code)();   // naplní window.RPG_TASK_EXTRA_7
const EX = global.window.RPG_TASK_EXTRA_7;

const MC = new Set(['1-1','2-1','3-1','4-1','5-1','6-1']);
const ITER = 3000;
let total=0, problems=0;
const errs=[];

function report(id,i,msg,t){
 problems++;
 if(errs.length<40) errs.push(`  ❌ [${id}] úloha #${i}: ${msg}\n     text="${(t&&t.text||'').replace(/\n/g,' ')}" ans="${t&&t.ans}"`);
}

for(const id of Object.keys(EX)){
 for(let it=0; it<ITER; it++){
  let arr;
  try{ arr = EX[id](); }
  catch(e){ report(id,-1,'generátor hodil výjimku: '+e.message,null); continue; }
  if(!Array.isArray(arr)){ report(id,-1,'nevrátil pole',null); continue; }
  arr.forEach((t,i)=>{
   total++;
   if(!t || typeof t!=='object'){ report(id,i,'úloha není objekt',t); return; }
   if(typeof t.text!=='string' || !t.text.length){ report(id,i,'chybí text',t); return; }
   if(typeof t.ans==='undefined' || t.ans===null){ report(id,i,'chybí ans',t); return; }
   const ans=String(t.ans);
   if(/undefined|NaN/.test(t.text+'|'+ans)){ report(id,i,'obsahuje NaN/undefined',t); return; }
   if(!Array.isArray(t.hints)){ report(id,i,'chybí hints[]',t); return; }
   if(!['calc','geo','anal'].includes(t.skill)){ report(id,i,'neplatný skill: '+t.skill,t); return; }
   // MC bezpečnost: jen numerické nebo ANO/NE
   if(MC.has(id)){
    if(ans==='ANO'||ans==='NE'){ /* ok */ }
    else {
     const n=parseFloat(ans.replace(',','.'));
     if(!isFinite(n) || /\//.test(ans)){ report(id,i,'MC mise s nenumerickou odpovědí: "'+ans+'"',t); return; }
    }
   } else {
    // mimo MC: ANO/NE nebo numerické nebo zlomek "a/b" nebo záporný zlomek "-a/b"
    if(ans==='ANO'||ans==='NE'){ /* ok */ }
    else {
     const numOK = isFinite(parseFloat(ans.replace(',','.')));
     const fracOK = /^-?\d+\/\d+$/.test(ans);
     if(!numOK && !fracOK){ report(id,i,'podivná odpověď: "'+ans+'"',t); return; }
    }
   }
  });
 }
}

console.log('\n══════════════════════════════════════════');
console.log('  Audit rpg-tasks-7.js — rozšiřující banka');
console.log('══════════════════════════════════════════');
console.log(`  Misí: ${Object.keys(EX).length}  ·  generátorů celkem: ${total.toLocaleString('cs-CZ')}`);
if(problems){
 console.log(`\n  NALEZENO ${problems} problémů:\n`);
 console.log(errs.join('\n'));
 console.log(`\n  VÝSLEDEK: ❌ ${problems} problémů`);
 process.exit(1);
}else{
 console.log(`\n  VÝSLEDEK: ✅ 0 problémů (vše definované, MC bezpečné)`);
}
