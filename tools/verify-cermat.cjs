global.ri=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
global.gcd=function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);};
global.cz=n=>String(n).replace('.',',');


global.skl=(n,one,few,many)=>n===1?one:(n>=2&&n<=4?few:many);
['svgTriangle','svgLineGraph','svgCylinder','svgCone','svgSphere','svgSimilar','svgCuboid'].forEach(f=>global[f]=()=>'<svg></svg>');
global.window={};
require('/home/user/mrkonopa.github.io/projects/rpg-cermat-9.js');
const C = global.window.RPG_CERMAT_9;
let bad=[];
for(let run=0; run<500; run++){
  const tasks = C.generate();
  if(tasks.length!==16) bad.push(`run${run}: ${tasks.length} úloh, čekáno 16`);
  let sum=0;
  for(const t of tasks){
    if(t.kind==='tfgrid'){
      sum += t.points;
      for(const s of t.statements){
        if(!s.text||!/^[AN]$/.test(s.ans)) bad.push(`t${t.no} tfgrid bad statement: ${JSON.stringify(s)}`);
      }
      if(t.statements.length*1 !== t.points) bad.push(`t${t.no} tfgrid points mismatch: ${t.points} vs ${t.statements.length} statements`);
    } else if(t.kind==='mc'){
      sum += t.points;
      if(!t.prompt) bad.push(`t${t.no} mc missing prompt`);
      if(!Array.isArray(t.options)||t.options.length<4) bad.push(`t${t.no} mc bad options: ${JSON.stringify(t.options)}`);
      if(!/^[A-E]$/.test(t.ans)) bad.push(`t${t.no} mc bad ans letter: ${t.ans}`);
      const letterExists = t.options.some(o=>o.startsWith(t.ans+')'));
      if(!letterExists) bad.push(`t${t.no} mc ans letter ${t.ans} not in options: ${JSON.stringify(t.options)}`);
    } else if(t.kind==='match'){
      sum += t.points;
      if(!Array.isArray(t.prompts)||t.prompts.length<2) bad.push(`t${t.no} match bad prompts`);
      if(!Array.isArray(t.options)||t.options.length<4) bad.push(`t${t.no} match bad options`);
      if(!Array.isArray(t.ans)||t.ans.length!==t.prompts.length) bad.push(`t${t.no} match ans length mismatch`);
      for(const a of t.ans){ if(!t.options.some(o=>o.startsWith(a+')'))) bad.push(`t${t.no} match ans letter ${a} not in options`); }
    } else {
      // parts-based
      if(!Array.isArray(t.parts)) { bad.push(`t${t.no} missing parts/kind`); continue; }
      let partsSum=0;
      for(const p of t.parts){
        partsSum += p.points;
        if(!p.prompt || typeof p.prompt!=='string' || !p.prompt.trim()) bad.push(`t${t.no}${p.key}: missing prompt`);
        if(p.ans===undefined||p.ans===null||String(p.ans)==='NaN'||String(p.ans)==='undefined') bad.push(`t${t.no}${p.key}: bad ans "${p.ans}" in "${p.prompt&&p.prompt.slice(0,60)}"`);
      }
      if(partsSum !== t.points) bad.push(`t${t.no} points mismatch: task.points=${t.points} but parts sum=${partsSum}`);
      sum += t.points;
    }
  }
  if(sum!==50) bad.push(`run${run}: total points ${sum}, expected 50`);
  if(bad.length>30) break;
}
console.log(bad.length? '❌ '+[...new Set(bad)].slice(0,40).join('\n❌ ') : '✅ 500 běhů OK, vždy 16 úloh / 50 bodů, žádné NaN/undefined');
process.exit(bad.length?1:0);
