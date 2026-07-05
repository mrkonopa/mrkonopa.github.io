// Kontrola rpg-learn-N.js: 21 misí, každá mistakes >=2 {wrong,right}, examples >=2, video klíč existuje, žádné ÷
const fs=require('fs');
const G=process.argv[2];
global.window={};
new Function(fs.readFileSync(`${__dirname}/../projects/rpg-learn-${G}.js`,'utf8'))();
const L=global.window['RPG_LEARN_'+G];
if(!L){console.log('❌ modul nenalezen');process.exit(2);}
const mids=Object.keys(L);
let bad=[];
if(mids.length!==21)bad.push(`misí ${mids.length}, čekáno 21`);
for(const mid of mids){
  const m=L[mid];
  if(!m.intro||!String(m.intro).trim())bad.push(`${mid}: chybí intro`);
  if(!Array.isArray(m.sections)||m.sections.length<1)bad.push(`${mid}: chybí sections`);
  if(!Array.isArray(m.examples)||m.examples.length<2)bad.push(`${mid}: examples <2 (${(m.examples||[]).length})`);
  if(!Array.isArray(m.mistakes)||m.mistakes.length<2)bad.push(`${mid}: mistakes <2 (${(m.mistakes||[]).length})`);
  (m.mistakes||[]).forEach((mi,i)=>{
    if(!mi.wrong||!String(mi.wrong).trim())bad.push(`${mid}.mistakes[${i}]: chybí wrong`);
    if(!mi.right||!String(mi.right).trim())bad.push(`${mid}.mistakes[${i}]: chybí right`);
  });
  if(!('video' in m))bad.push(`${mid}: chybí klíč video`);
}
const src=fs.readFileSync(`${__dirname}/../projects/rpg-learn-${G}.js`,'utf8');
if(src.includes('÷'))bad.push('obsahuje ÷ — použij ":"');
console.log(bad.length?('❌ '+bad.slice(0,12).join('\n❌ ')):`✅ g${G}: 21 misí, mistakes+examples OK`);
process.exit(bad.length?1:0);
