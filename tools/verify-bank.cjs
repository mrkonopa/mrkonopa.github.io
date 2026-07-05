const fs=require('fs');
const G=process.argv[2]||'3';
global.ri=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;global.gcd=function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);};global.cz=n=>String(n).replace(".",",");global.skl=(n,one,few,many)=>n===1?one:(n>=2&&n<=4?few:many);global.pick=a=>a[Math.floor(Math.random()*a.length)];["svgTriangle","svgLineGraph","svgCylinder","svgCone","svgSphere","svgSimilar","svgCuboid","svgAngle","svgCircle","svgPrism","svgGrid","svgBox"].forEach(f=>global[f]=()=>"<svg></svg>");
global.window={};
new Function(fs.readFileSync(`/home/user/mrkonopa.github.io/projects/rpg-tasks-${G}.js`,'utf8'))();
const bank=global.window['RPG_TASK_EXTRA_'+G];
if(!bank){console.log('bank nenalezena');process.exit(2);}
let bad=[],total=0;const variety={};
for(const mid of Object.keys(bank)){
  const tpl=new Set();
  for(let i=0;i<800;i++){
    let tasks;try{tasks=bank[mid]();}catch(e){bad.push(`${mid}: hází ${e.message}`);break;}
    for(const t of tasks){
      total++;
      if(!t||typeof t.text!=='string'||!t.text.trim())bad.push(`${mid}: chybí text`);
      if(t.ans===undefined||t.ans===null||String(t.ans)==='NaN'||String(t.ans)==='undefined')bad.push(`${mid}: vadná odpověď v "${String(t&&t.text).slice(0,50)}"`);
      if(!Array.isArray(t.hints)||!t.hints[0]||!String(t.hints[0]).trim())bad.push(`${mid}: chybí hints[0]`);
      if(t.hints&&t.hints.length>1&&!String(t.hints[1]||'').trim())bad.push(`${mid}: prázdný hints[1]`);
      if(i<100)tpl.add(String(t.text).replace(/\d+([.,]\d+)?/g,'N').replace(/[a-z]\s*=\s*N/g,'V=N').slice(0,120));
    }
    if(bad.length>15)break;
  }
  variety[mid]=tpl.size;
}
const counts=Object.values(variety);
console.log(`g${G}: pestrost min ${Math.min(...counts)}, avg ${Math.round(counts.reduce((a,b)=>a+b,0)/counts.length*10)/10}, misí ${counts.length}`);
console.log(JSON.stringify(variety));
console.log(bad.length?('❌ '+[...new Set(bad)].slice(0,8).join('\n❌ ')):'✅ 0 problémů');
