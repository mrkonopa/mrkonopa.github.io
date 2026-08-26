/* ══════════════════════════════════════════════════════════════════════
   Cesta peněz — audit kvality zadání.

   PROČ tenhle test vznikl. Cesta peněz je osmikapitolová hra s 50 scénami
   a náhodně generovanými čísly, a do teď na ni NEEXISTOVAL jediný test.
   Hry `rpg-*` mají `rpg-content-quality.cjs`, který hlídá čárku, ≈,
   skloňování a prázdné nápovědy nad ~175 tisíci úlohami; Cesta peněz
   neměla nic, přestože má tytéž vlastnosti — generátory, nápovědy,
   české číslovky.

   Hned první běh našel systematickou vadu: 3. akt (inflace a spoření)
   psal koeficient růstu jako „75 000 × 1.05" s DESETINNOU TEČKOU.
   V ČR je oddělovač čárka a dítě to má přímo v zadání i v nápovědě.
   Vzniklo to z `toFixed(2)`, které vrací JS zápis čísla.

   Co se hlídá (na 400 náhodných průchodech všemi scénami):

   • žádná desetinná tečka mezi číslicemi v ČESKÉM textu,
   • žádné `undefined`, `NaN` ani `[object Object]`,
   • žádné artefakty plovoucí čárky (6+ desetinných míst),
   • každá početní úloha má tři nápovědy, žádnou prázdnou,
   • poslední nápověda uvádí výsledek — jinak z ní žák nic nemá,
   • odpověď je konečné číslo.

   Anglická verze se schválně nekontroluje na oddělovač: tam tečka patří.

   Spusť: node tests/cesta-penez-audit.test.cjs
   ══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),PORT=19031;
const srv=http.createServer((q,p)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';
 const fp=path.normalize(path.join(ROOT,u));if(!fp.startsWith(ROOT)){p.writeHead(403);return p.end();}
 let b=null;try{b=fs.readFileSync(fp);}catch(e){}if(b===null){p.writeHead(404);return p.end();}
 p.writeHead(200,{'Content-Type':u.endsWith('.js')?'application/javascript':'text/html'});p.end(b);});
(async()=>{await new Promise(r=>srv.listen(PORT,r));
 const br=await chromium.launch({headless:true,executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const c=await br.newContext({viewport:{width:1100,height:900}});
 await c.route('**/*',r=>r.request().url().startsWith('http://localhost:'+PORT)?r.continue():r.abort());
 const pg=await c.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(`http://localhost:${PORT}/projects/cesta_penez.html`,{waitUntil:'domcontentloaded'});
 await pg.waitForTimeout(900);
 const r=await pg.evaluate(()=>{
  const out={aktu:0,uloh:0,nalezy:[],cisla:new Set()};
  if(typeof ACTS==='undefined') return {chyba:'ACTS není v globálním rozsahu'};
  for(let opak=0;opak<400;opak++){
    ACTS.forEach((akt,ai)=>{
      let ctx={};
      try{ ctx = akt.setup? akt.setup() : {}; }catch(e){ out.nalezy.push(`akt ${ai+1}: setup spadl — ${e}`); return; }
      (akt.scenes||[]).forEach((sc,si)=>{
        let s;
        try{ s = sc.build? sc.build(ctx) : sc; }catch(e){ out.nalezy.push(`akt ${ai+1}/scéna ${si}: build spadl — ${e}`); return; }
        if(opak===0) out.uloh++;
        const texty=[s.q,s.explain,s.text,...(s.hints||[])].filter(x=>typeof x==='string');
        texty.forEach(t=>{
          if(/undefined|NaN|\[object Object\]/.test(t))
            out.nalezy.push(`akt ${ai+1}/scéna ${si}: artefakt v textu — ${t.slice(0,90)}`);
          // desetinná TEČKA mezi číslicemi (v ČR se píše čárka)
          const tecka=t.replace(/<[^>]*>/g,'').match(/\d+\.\d+/g);
          if(tecka) out.nalezy.push(`akt ${ai+1}/scéna ${si}: desetinná tečka „${tecka[0]}" — ${t.slice(0,70)}`);
          // artefakty plovoucí čárky
          const fp=t.match(/\d+[.,]\d{6,}/g);
          if(fp) out.nalezy.push(`akt ${ai+1}/scéna ${si}: plovoucí čárka „${fp[0]}"`);
        });
        if(s.type==='math'||typeof s.answer==='number'){
          if(typeof s.answer!=='number'||!isFinite(s.answer))
            out.nalezy.push(`akt ${ai+1}/scéna ${si}: odpověď není číslo (${s.answer})`);
          if(!s.hints||s.hints.length<3)
            out.nalezy.push(`akt ${ai+1}/scéna ${si}: má jen ${(s.hints||[]).length} nápovědy (čekány 3)`);
          (s.hints||[]).forEach((h,hi)=>{ if(!h||!String(h).trim())
            out.nalezy.push(`akt ${ai+1}/scéna ${si}: nápověda ${hi+1} je prázdná`); });
          // 3. nápověda musí obsahovat výsledek
          const posl=(s.hints||[])[ (s.hints||[]).length-1 ]||'';
          const cis=String(s.answer);
          const fmtd=Number(s.answer).toLocaleString('cs-CZ');
          if(!posl.includes(cis)&&!posl.includes(fmtd))
            out.nalezy.push(`akt ${ai+1}/scéna ${si}: 3. nápověda neuvádí výsledek ${cis} — „${posl.replace(/<[^>]*>/g,'').slice(0,70)}"`);
          /* …jenže „uvádí výsledek" je SLABÁ kontrola: projde i tehdy,
             když je špatně zároveň nápověda i `answer`. Přesně tak
             vypadala vada v `goniometrie.html` — nápověda tvrdila
             „c = 7 / sin 30° ≈ 15" (což je 14) a `ans` bylo taky 15,
             takže shoda seděla a chyba prošla. Nápovědě se proto
             DOPOČÍTÁ: „8 × 150 = 1 200" se vyhodnotí a musí dát
             `answer`.
             Pozor na pasti (obě mě stály falešný poplach jinde):
             `fmt()` odděluje tisíce ÚZKOU mezerou (U+202F/U+00A0),
             minus bývá U+2212, a tečka na konci předchozí VĚTY se
             plete s desetinnou — proto se věta uřízne dřív, než se
             smažou mezery. */
          const holy=posl.replace(/<[^>]*>/g,'');
          const useky=holy.split('=');
          if(useky.length>=2){
            let e=useky[useky.length-2].split(/\.\s+/).pop()
              .replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−–—]/g,'-')
              .replace(/[\s\u00a0\u202f]/g,'')
              .replace(/,(\d)/g,'.$1')
              .replace(/^[^0-9(+-]*/,'').replace(/^\.+/,'');
            if(/^[\d+\-*/().]+$/.test(e)&&/[+\-*/]/.test(e)){
              let v=null; try{v=Function('"use strict";return('+e+')')();}catch(err){}
              if(v!==null&&isFinite(v)){
                out.dopocteno=(out.dopocteno||0)+1;
                if(Math.abs(v-Number(s.answer))>0.005)
                  out.nalezy.push(`akt ${ai+1}/scéna ${si}: nápověda se dopočítá na ${v}, ale odpověď je ${s.answer} — „${holy.slice(0,70)}"`);
              } else out.bezVyrazu=(out.bezVyrazu||0)+1;
            } else out.bezVyrazu=(out.bezVyrazu||0)+1;
          } else out.bezVyrazu=(out.bezVyrazu||0)+1;
        }
      });
    });
    out.aktu=ACTS.length;
  }
  out.nalezy=[...new Set(out.nalezy)];
  return out;
 });
 if(r.chyba){console.log('CHYBA:',r.chyba);}
 else{
  console.log(`aktů ${r.aktu} · scén ${r.uloh} · 400 opakování`);
  console.log(`nápovědy: dopočítáno ${r.dopocteno||0}, bez uzavřeného výrazu ${r.bezVyrazu||0}`);
  const druhy={};
  r.nalezy.forEach(x=>{
    const d = /desetinná tečka/.test(x)?'desetinná tečka':
              /artefakt v textu/.test(x)?'artefakt (undefined/NaN)':
              /plovoucí čárka/.test(x)?'plovoucí čárka':
              /neuvádí výsledek/.test(x)?'3. nápověda bez výsledku':
              /nápověda .* prázdná/.test(x)?'prázdná nápověda':
              /jen \d nápovědy/.test(x)?'málo nápověd':
              /odpověď není číslo/.test(x)?'odpověď není číslo':'jiné';
    (druhy[d]=druhy[d]||[]).push(x);
  });
  console.log(`NÁLEZŮ CELKEM: ${r.nalezy.length}`);
  Object.entries(druhy).sort((a,b)=>b[1].length-a[1].length).forEach(([d,v])=>{
    console.log(`\n── ${d}: ${v.length} ──`);
    const mista=[...new Set(v.map(x=>x.split(':')[0]))];
    console.log('   místa:', mista.join(', '));
    v.slice(0,2).forEach(x=>console.log('   •',x.slice(0,120)));
  });
 }
 const skut=errs.filter(e=>!/ERR_|CERT_|net::/i.test(e));
 console.log('JS chyby:',skut.join(' | ')||'žádné');

 /* Pojistka proti planému běhu. Bez ní by audit hlásil „0 nálezů" i tehdy,
    když se `ACTS` vůbec nenačte nebo se nevygeneruje jediná scéna — a to je
    ten nejhorší možný stav: zelený test, který nic nezkontroloval. */
 const dost = !!r && r.aktu === 8 && r.uloh >= 40;
 if(!dost) console.log(`  ❌ audit šel naprázdno — aktů ${r&&r.aktu}, scén ${r&&r.uloh}`);

 const nalezu = (r && r.nalezy) ? r.nalezy.length : 0;
 const fail = !!(r&&r.chyba) || !dost || nalezu > 0 || skut.length > 0;
 console.log(`\n  Cesta peněz: ${fail ? nalezu+' nálezů ❌' : 'v pořádku ✅'}\n`);
 await br.close(); srv.close();
 process.exit(fail ? 1 : 0);})();
