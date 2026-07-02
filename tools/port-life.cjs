/* Port „dávky 1–3 + životní úspěchy (GACH)" do všech 7 her.
   Rodina A = 6/7/8/9 (2. stupeň), rodina B = 3/4/5 (1. stupeň, jiný engine).
   Každý vzor má očekávaný počet výskytů — při neshodě HLASITĚ selže.
   Spuštění: node tools/port-life.cjs */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'projects');

const HELPERS = `
/* ── Peněženka: pomocníci pro perky a životní countery (graceful bez modulu) ── */
function wPerk(p){return typeof RPGWallet!=='undefined'&&RPGWallet.hasPerk&&RPGWallet.hasPerk(p);}
function wBump(k,n){if(typeof RPGWallet!=='undefined'&&RPGWallet.bumpLife)RPGWallet.bumpLife(k,n).forEach(achToast);}
function wMax(k,v){if(typeof RPGWallet!=='undefined'&&RPGWallet.setLifeMax)RPGWallet.setLifeMax(k,v).forEach(achToast);}
function wCritBonus(){return wPerk('critcredit')?2:0;}
function wCatalog(){return(typeof RPGWallet!=='undefined'&&RPGWallet.itemsAll)?RPGWallet.itemsAll():SHOP_ITEMS;}
function trGuard(){TR.guardJust=false;if(TR.streak>0&&!TR.guardUsed&&typeof RPGWallet!=='undefined'&&RPGWallet.hasPowerup&&RPGWallet.hasPowerup('pu-study-guide')){TR.guardUsed=true;TR.guardJust=true;return true;}return false;}`;

const SHIELD = `
 // Štít nováčka: první chyba v boji nezraní (chyba se ale počítá do diagnostiky)
 if(!BT.shieldUsed&&typeof RPGWallet!=='undefined'&&RPGWallet.hasPowerup&&RPGWallet.hasPowerup('pu-novice-shield')){
  BT.shieldUsed=true;
  floatText('⛨ Štít nováčka!',window.innerWidth/2-80,window.innerHeight*0.38,'#7fd8ff');
  return;
 }
 BT.tookDamage=true;`;

function P(name, from, to, expect) { return { name, from, to, expect }; }

const COMMON = [
  P('helpers', `function _activeCosmetics(){return(typeof RPGWallet!=='undefined')?RPGWallet.get().cosmetics:S.cosmetics;}`,
    `function _activeCosmetics(){return(typeof RPGWallet!=='undefined')?RPGWallet.get().cosmetics:S.cosmetics;}${HELPERS}`, 1),
  P('shop-items-src', `const items=SHOP_ITEMS.filter(i=>i.cat===_shopCat);`,
    `const items=((typeof RPGWallet!=='undefined'&&RPGWallet.items)?RPGWallet.items():SHOP_ITEMS).filter(i=>i.cat===_shopCat);`, 1),
  P('victory-vc', /(b\.className='victory-banner';b\.textContent='[^']*';)/,
    `$1\n {const v=wCatalog().find(i=>i.id===_activeCosmetics()?.active?.victory&&i.cat==='victory');if(v&&v.cssKey)b.classList.add(v.cssKey);}`, 1),
  P('titlepet', `if(spMod&&typeof spMod.setSkin==='function')spMod.setSkin(cos.active?.skin||null);`,
    `if(spMod&&typeof spMod.setSkin==='function')spMod.setSkin(cos.active?.skin||null);\n if(typeof RPGWallet!=='undefined'&&RPGWallet.renderTitlePet)RPGWallet.renderTitlePet({nameEl:document.getElementById('pr-name'),mapNameEl:document.getElementById('map-name'),avatarEl:document.getElementById('pr-avatar')});`, 1),
  P('streak', `S.streak.last=today;saveS();evalAch({});\n const sc=S.streak.count;earnCredits(`,
    `S.streak.last=today;saveS();evalAch({});\n wMax('streakMax',S.streak.count);\n const sc=S.streak.count;earnCredits(`, 1),
  P('flawless', `evalAch({flawlessMission:!BT.missionHinted,wonAtOneHp:BT.hp===1});`,
    `evalAch({flawlessMission:!BT.missionHinted,wonAtOneHp:BT.hp===1});\n if(!BT.tookDamage)wBump('flawless');`, 1),
  P('gach-panel', `<div class="ach-grid" id="pr-ach"></div>\n </div>`,
    `<div class="ach-grid" id="pr-ach"></div>\n </div>\n <div class="panel">\n <div style="font-family:var(--px);font-weight:700;font-size:12px;color:var(--muted);letter-spacing:1px;margin-bottom:10px">— ŽIVOTNÍ ÚSPĚCHY (všechny ročníky) —</div>\n <div id="pr-gach"></div>\n </div>`, 1),
];

// applyCosmetics rodiny A (6-9) má holé SHOP_ITEMS.find + hardcoded nm- seznam
const APPLY_A = [
  P('nm-strip', `['nm-cyan','nm-gold','nm-green','nm-purple'].forEach(c=>{nm&&nm.classList.remove(c);mnm&&mnm.classList.remove(c);});`,
    `[nm,mnm].forEach(el=>{if(!el)return;[...el.classList].filter(c=>c.startsWith('nm-')).forEach(c=>el.classList.remove(c));});`, 1),
  P('cat-border', `const b=SHOP_ITEMS.find(i=>i.id===cos.active?.border&&i.cat==='border');`,
    `const b=wCatalog().find(i=>i.id===cos.active?.border&&i.cat==='border');`, 1),
  P('cat-badge', `const bg=SHOP_ITEMS.find(i=>i.id===cos.active?.badge&&i.cat==='badge');`,
    `const bg=wCatalog().find(i=>i.id===cos.active?.badge&&i.cat==='badge');`, 1),
  P('cat-theme', `const th=SHOP_ITEMS.find(i=>i.id===cos.active?.theme&&i.cat==='theme');`,
    `const th=wCatalog().find(i=>i.id===cos.active?.theme&&i.cat==='theme');`, 1),
];

const FAMILY_A = [   // 6/7/8/9 — 2. stupeň
  ...APPLY_A,
  P('credits-crit', `earnCredits(isCrit?7:5);tryDropItem();}`, `earnCredits(isCrit?7+wCritBonus():5);tryDropItem();}`, 2),
  P('credits-mini', `earnCredits(mistakes===0?7:5);tryDropItem();}`, `earnCredits(mistakes===0?7+(isCrit?wCritBonus():0):5);tryDropItem();}`, 1),
  P('bump-battle', ` evalAch({correct:true,combo:BT.combo,timeLeft:BT.timeLeft});\n checkMissionComplete();`,
    ` evalAch({correct:true,combo:BT.combo,timeLeft:BT.timeLeft});\n wBump('tasks');if(isCrit)wBump('crits');\n checkMissionComplete();`, 2),
  P('bump-mini', ` evalAch({correct:true,combo:BT.combo});\n document.getElementById('next-btn').style.display='inline-block';`,
    ` evalAch({correct:true,combo:BT.combo});\n wBump('tasks');if(isCrit)wBump('crits');\n document.getElementById('next-btn').style.display='inline-block';`, 1),
  P('shield', `function damagePlayer(){\n if(!S.errs)S.errs={};if(BT&&BT.mid){S.errs[BT.mid]=(S.errs[BT.mid]||0)+1;saveS();}\n if(BT.hp<=0)return;\n hitVignette();`,
    `function damagePlayer(){\n if(!S.errs)S.errs={};if(BT&&BT.mid){S.errs[BT.mid]=(S.errs[BT.mid]||0)+1;saveS();}\n if(BT.hp<=0)return;${SHIELD}\n hitVignette();`, 1),
  P('timer-start', `BT.curLimit=TIME_PER_TASK+_tExtra;}\n BT.timeLeft=BT.curLimit;BT.timeMax=BT.curLimit;\n document.getElementById('timer-wrap').style.display='block';\n updateTimerUi();\n BT.timer=setInterval(()=>{`,
    `BT.curLimit=TIME_PER_TASK+_tExtra;}\n if(typeof RPGWallet!=='undefined'&&RPGWallet.hasPowerup&&RPGWallet.hasPowerup('pu-calm-mind'))BT.curLimit=Math.round(BT.curLimit*1.2);\n BT.timeLeft=BT.curLimit;BT.timeMax=BT.curLimit;\n document.getElementById('timer-wrap').style.display='block';\n // Pán času (životní úspěch): čas se v normálním boji neodpočítává.\n // Věž legend má vlastní časomíru (twStartTimer) — té se perk netýká.\n BT.noTimer=wPerk('notimer');\n updateTimerUi();\n if(BT.noTimer)return;\n BT.timer=setInterval(()=>{`, 1),
  P('timer-ui', `function updateTimerUi(){\n document.getElementById('timer-v').textContent=BT.timeLeft;\n const pct=Math.max(0,BT.timeLeft/BT.timeMax*100);\n const bar=document.getElementById('timer-bar');\n bar.style.width=pct+'%';\n bar.classList.toggle('warn',BT.timeLeft<=10&&BT.timeLeft>5);\n bar.classList.toggle('danger',BT.timeLeft<=5);\n}`,
    `function updateTimerUi(){\n const bar=document.getElementById('timer-bar');\n if(BT.noTimer){\n  document.getElementById('timer-v').textContent='∞';\n  bar.style.width='100%';bar.classList.remove('warn','danger');\n  return;\n }\n document.getElementById('timer-v').textContent=BT.timeLeft;\n const pct=Math.max(0,BT.timeLeft/BT.timeMax*100);\n bar.style.width=pct+'%';\n bar.classList.toggle('warn',BT.timeLeft<=10&&BT.timeLeft>5);\n bar.classList.toggle('danger',BT.timeLeft<=5);\n}`, 1),
  P('tower', `TW.floor++;\n twClimbAnim();\n twStats();`, `TW.floor++;\n wBump('tasks');wMax('towerFloor',TW.floor);\n twClimbAnim();\n twStats();`, 1),
  P('mastery', ` m.score=(m.score||0)+1;\n if(m.score>=MASTERY_GOAL)m.mastered=true;`,
    ` m.score=(m.score||0)+1;\n if(m.score>=MASTERY_GOAL)m.mastered=true;\n wBump('tasks');if(!wasMastered&&m.mastered)wBump('mastered');`, 1),
  P('trwrong', `function trWrong(given){\n TR.total++;TR.streak=0;\n if(!S.errs)S.errs={};if(TR.mid){S.errs[TR.mid]=(S.errs[TR.mid]||0)+1;saveS();}\n const fb=document.getElementById('tr-fb');\n fb.className='feedback err';\n fb.textContent='✗ Není to ono. Správně: '+TR.task.ans;`,
    `function trWrong(given){\n TR.total++;\n if(!S.errs)S.errs={};if(TR.mid){S.errs[TR.mid]=(S.errs[TR.mid]||0)+1;saveS();}\n const fb=document.getElementById('tr-fb');\n fb.className='feedback err';\n // Studijní rádce: jedna chyba za trénink nezlomí sérii (chyba se počítá)\n if(trGuard()){\n  fb.textContent='🔁 Studijní rádce tě podržel — série zůstává! Správně: '+TR.task.ans;\n }else{\n  TR.streak=0;\n  fb.textContent='✗ Není to ono. Správně: '+TR.task.ans;\n }`, 1),
  P('trwrong-mc', ` TR.total++;TR.streak=0;trStats();`, ` TR.total++;if(!trGuard())TR.streak=0;trStats();`, 1),
  P('gach-render', ` const rm=document.getElementById('pr-rm');if(rm)rm.checked=rmActive();`,
    ` const rm=document.getElementById('pr-rm');if(rm)rm.checked=rmActive();\n if(typeof RPGWallet!=='undefined'&&RPGWallet.renderGachInto)RPGWallet.renderGachInto(document.getElementById('pr-gach'));`, 1),
];

// taby obchodu: 6/7/8 mají setShopCat(cat,this); g9 má shopCat(cat)+label mapu
const TABS_678 = [
  P('tabs', /(<button class="shop-tab" onclick="setShopCat\('powerup',this\)">[^<]*<\/button>)/,
    `$1\n  <button class="shop-tab" onclick="setShopCat('title',this)">📜 Tituly</button>\n  <button class="shop-tab" onclick="setShopCat('pet',this)">🐾 Mazlíčci</button>`, 1),
];
const TABS_9 = [
  P('tabs', `<button class="btn sm shop-tab" onclick="shopCat('powerup')">⚡ Powerupy</button>`,
    `<button class="btn sm shop-tab" onclick="shopCat('powerup')">⚡ Powerupy</button>\n  <button class="btn sm shop-tab" onclick="shopCat('title')">📜 Tituly</button>\n  <button class="btn sm shop-tab" onclick="shopCat('pet')">🐾 Mazlíčci</button>`, 1),
  P('tab-labels', `powerup:'Powerupy'}`, `powerup:'Powerupy',title:'Tituly',pet:'Mazlíč'}`, 1),
];

const FAMILY_B = [   // 3/4/5 — 1. stupeň (jiný engine)
  P('apply-border', `const b=typeof SHOP_ITEMS!=='undefined'?SHOP_ITEMS.find(i=>i.id===cos.active?.border&&i.cat==='border'):null;`,
    `const b=wCatalog().find(i=>i.id===cos.active?.border&&i.cat==='border');`, 1),
  P('apply-badge', `const bg=typeof SHOP_ITEMS!=='undefined'?SHOP_ITEMS.find(i=>i.id===cos.active?.badge&&i.cat==='badge'):null;`,
    `const bg=wCatalog().find(i=>i.id===cos.active?.badge&&i.cat==='badge');`, 1),
  P('apply-theme', `const th=typeof SHOP_ITEMS!=='undefined'?SHOP_ITEMS.find(i=>i.id===cos.active?.theme&&i.cat==='theme'):null;`,
    `const th=wCatalog().find(i=>i.id===cos.active?.theme&&i.cat==='theme');`, 1),
  P('profile-av', /if\(typeof SHOP_ITEMS!=='undefined'\)\{const b=SHOP_ITEMS\.find\(i=>i\.id===cos\.active\?\.border&&i\.cat==='border'\);if\(b\)av\.className=b\.cssKey;\}/,
    `{const b=wCatalog().find(i=>i.id===cos.active?.border&&i.cat==='border');av.className=(b&&b.cssKey)||'';}`, 1),
  P('tabs', /(<button class="shop-tab" onclick="setShopCat\('powerup',this\)">[^<]*<\/button>)/,
    `$1\n  <button class="shop-tab" onclick="setShopCat('title',this)">📜 Tituly</button>\n  <button class="shop-tab" onclick="setShopCat('pet',this)">🐾 Mazlíčci</button>`, 1),
  P('credits-crit', `RPGWallet.earn(isCrit?7:5,SAVE_KEY);`, `RPGWallet.earn(isCrit?7+wCritBonus():5,SAVE_KEY);`, 4),
  P('bump-battle', `evalAch({correct:true,combo:BT.combo,timeLeft:BT.timeLeft});checkMissionComplete();`,
    `evalAch({correct:true,combo:BT.combo,timeLeft:BT.timeLeft});wBump('tasks');if(isCrit)wBump('crits');checkMissionComplete();`, 3),
  P('bump-mini', `evalAch({correct:true,combo:BT.combo,timeLeft:0});checkMissionComplete();`,
    `evalAch({correct:true,combo:BT.combo,timeLeft:0});wBump('tasks');if(isCrit)wBump('crits');checkMissionComplete();`, 1),
  P('bump-train', `earnCredits(ms.mastered?30:1);evalAch({correct:true,combo:TR.streak});saveS();`,
    `earnCredits(ms.mastered?30:1);wBump('tasks');evalAch({correct:true,combo:TR.streak});saveS();`, 1),
  P('mastery', `if(ms.score>=MASTERY_GOAL&&!ms.mastered){ms.mastered=true;`,
    `if(ms.score>=MASTERY_GOAL&&!ms.mastered){ms.mastered=true;wBump('mastered');`, 1),
  P('shield', `function damagePlayer(){\n if(!S.errs)S.errs={};if(BT&&BT.mid){S.errs[BT.mid]=(S.errs[BT.mid]||0)+1;saveS();}\n if(BT.hp<=0)return;\n hitVignette();flashHeart(BT.hp-1);BT.hp--;`,
    `function damagePlayer(){\n if(!S.errs)S.errs={};if(BT&&BT.mid){S.errs[BT.mid]=(S.errs[BT.mid]||0)+1;saveS();}\n if(BT.hp<=0)return;${SHIELD}\n hitVignette();flashHeart(BT.hp-1);BT.hp--;`, 1),
  P('timer-start', `BT.curLimit=TIME_PER_TASK+_tEx;}\n BT.timeLeft=BT.curLimit;BT.timeMax=BT.curLimit;\n document.getElementById('timer-wrap').style.display='block';updateTimerUi();\n BT.timer=setInterval(`,
    `BT.curLimit=TIME_PER_TASK+_tEx;}\n if(typeof RPGWallet!=='undefined'&&RPGWallet.hasPowerup&&RPGWallet.hasPowerup('pu-calm-mind'))BT.curLimit=Math.round(BT.curLimit*1.2);\n BT.timeLeft=BT.curLimit;BT.timeMax=BT.curLimit;\n document.getElementById('timer-wrap').style.display='block';BT.noTimer=wPerk('notimer');updateTimerUi();\n if(BT.noTimer)return;\n BT.timer=setInterval(`, 1),
  P('timer-ui', `function updateTimerUi(){\n document.getElementById('timer-v').textContent=BT.timeLeft;\n const pct=Math.max(0,BT.timeLeft/BT.timeMax*100);\n const bar=document.getElementById('timer-bar');bar.style.width=pct+'%';\n bar.classList.toggle('warn',BT.timeLeft<=10&&BT.timeLeft>5);bar.classList.toggle('danger',BT.timeLeft<=5);\n}`,
    `function updateTimerUi(){\n const bar=document.getElementById('timer-bar');\n if(BT.noTimer){document.getElementById('timer-v').textContent='∞';bar.style.width='100%';bar.classList.remove('warn','danger');return;}\n document.getElementById('timer-v').textContent=BT.timeLeft;\n const pct=Math.max(0,BT.timeLeft/BT.timeMax*100);\n bar.style.width=pct+'%';\n bar.classList.toggle('warn',BT.timeLeft<=10&&BT.timeLeft>5);bar.classList.toggle('danger',BT.timeLeft<=5);\n}`, 1),
  P('trwrong', `function trWrong(){\n TR.total++;TR.streak=0;\n const ms=masteryOf(TR.mid);`,
    `function trWrong(){\n TR.total++;if(!trGuard())TR.streak=0;\n const ms=masteryOf(TR.mid);`, 1),
  P('trwrong-fb', 'fb.textContent=`✗ Správně: ${t.ans}`;fb.className=\'feedback err\';',
    `fb.textContent=(TR.guardJust?'🔁 Studijní rádce tě podržel — série zůstává! ':'✗ ')+'Správně: '+t.ans;fb.className='feedback err';`, 1),
  P('gach-render', ` const rmEl=document.getElementById('pr-rm');if(rmEl)rmEl.checked=rmActive();`,
    ` const rmEl=document.getElementById('pr-rm');if(rmEl)rmEl.checked=rmActive();\n if(typeof RPGWallet!=='undefined'&&RPGWallet.renderGachInto)RPGWallet.renderGachInto(document.getElementById('pr-gach'));`, 1),
];

let fail = 0;
function apply(file, patterns) {
  let src = fs.readFileSync(file, 'utf8');
  const report = [];
  for (const p of patterns) {
    let count;
    if (p.from instanceof RegExp) {
      const re = new RegExp(p.from.source, 'g');
      count = (src.match(re) || []).length;
      if (count !== p.expect) { report.push(`❌ ${p.name}: ${count}× (čekáno ${p.expect})`); fail++; continue; }
      src = src.replace(re, p.to);
    } else {
      count = src.split(p.from).length - 1;
      if (count !== p.expect) { report.push(`❌ ${p.name}: ${count}× (čekáno ${p.expect})`); fail++; continue; }
      src = src.split(p.from).join(p.to);
    }
    report.push(`✅ ${p.name} (${count}×)`);
  }
  fs.writeFileSync(file, src);
  return report;
}

for (const g of [6, 7, 8]) {
  console.log(`── g${g} ──`);
  console.log(apply(path.join(ROOT, `rpg-mat-${g}.html`), [...COMMON, ...FAMILY_A, ...TABS_678]).join('\n'));
}
console.log('── g9 ──');
console.log(apply(path.join(ROOT, 'rpg-mat-9.html'), [...COMMON, ...FAMILY_A, ...TABS_9]).join('\n'));
for (const g of [3, 4, 5]) {
  console.log(`── g${g} ──`);
  console.log(apply(path.join(ROOT, `rpg-mat-${g}.html`), [...COMMON, ...FAMILY_B]).join('\n'));
}
console.log(fail ? `\n❌ ${fail} vzorů nesedlo — ZKONTROLUJ` : '\n✅ Vše sedlo.');
process.exit(fail ? 1 : 0);
