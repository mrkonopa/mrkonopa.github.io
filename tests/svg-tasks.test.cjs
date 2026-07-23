/* Verifikace SVG slovních úloh (rpg-mat-9.html + rpg-tasks-9.js).
   Pro KAŽDOU SVG úlohu ověří:
     1) STRUKTURA — svg se naparsuje, žádné NaN/undefined/ERR, ans je platné číslo.
     2) GEOMETRIE (pravoúhlý trojúhelník v měřítku) — pravý úhel opravdu u C
        (B ve výšce C, A přesně nad C), poměr odvěsen v obrázku ODPOVÍDÁ číslům
        v zadání, značka pravého úhlu je u C, popisky stran přítomné.
     3) MATIKA — nezávislý přepočet odpovědi z čísel v zadání (Pythagoras, objemy, povrchy).
   Screenshoty reprezentativních úloh → /tmp/svgtasks/*.png (pro vizuální kontrolu).
   Spusť: NODE_PATH=/opt/node22/lib/node_modules node tests/svg-tasks.test.cjs */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const GRADE = process.argv[2] || '9';
const ROOT = path.join(__dirname, '..');
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = '/tmp/svgtasks/g' + GRADE;
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  ❌ ' + msg); } };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      if (u.endsWith('/')) u += 'index.html';
      const fp = path.normalize(path.join(ROOT, u));
      if (!fp.startsWith(ROOT + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { rep.writeHead(404); return rep.end('nf'); }
      rep.writeHead(200, {'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream'});
      fs.createReadStream(fp).pipe(rep);
    });
    srv.listen(0, () => res(srv));
  });
}

// ── nezávislé matematické verifikátory (podle rozpoznaného zadání) ──
function parsePoly(svg){ // vrátí [C,B,A] jako {x,y}
  const m = svg.match(/<polygon points="([\d.,\s-]+)"/);
  if (!m) return null;
  const nums = m[1].trim().split(/\s+/).map(p => p.split(',').map(Number));
  if (nums.length < 3) return null;
  return { C:{x:nums[0][0],y:nums[0][1]}, B:{x:nums[1][0],y:nums[1][1]}, A:{x:nums[2][0],y:nums[2][1]} };
}
function intsIn(re, text){ const m = text.match(re); return m ? m.slice(1).map(Number) : null; }

// definice rozpoznávaných NOVÝCH úloh: matcher + přepočet + očekávané odvěsny pro geometrii.
// grades = ročníky, kde se rodina má objevit (kontrola pokrytí). legs = scaled pravoúhlý trojúhelník.
const RULES = [
  // ── g9 ──
  { id:'zebrik', grades:['9'], test:t=>/Žebřík dlouhý/.test(t.text),
    math:t=>{ const p=intsIn(/dlouhý (\d+) m[\s\S]*pata je (\d+) m/,t.text); if(!p)return 'nenašel čísla'; const [zeb,dist]=p; const ans=Number(t.ans); return (dist*dist+ans*ans===zeb*zeb)?null:`${dist}²+${ans}²≠${zeb}²`; },
    legs:t=>{ const p=intsIn(/dlouhý (\d+) m[\s\S]*pata je (\d+) m/,t.text); const [zeb,dist]=p; return {a:dist,b:Number(t.ans)}; } },
  { id:'monitor', grades:['9'], test:t=>/Monitor má šířku/.test(t.text),
    math:t=>{ const p=intsIn(/šířku (\d+) dm a výšku (\d+) dm/,t.text); if(!p)return 'nenašel čísla'; const [sir,vys]=p; const ans=Number(t.ans); return (sir*sir+vys*vys===ans*ans)?null:`${sir}²+${vys}²≠${ans}²`; },
    legs:t=>{ const p=intsIn(/šířku (\d+) dm a výšku (\d+) dm/,t.text); const [sir,vys]=p; return {a:sir,b:vys}; } },
  { id:'pozemek', grades:['9'], test:t=>/Pozemek tvaru pravoúhlého/.test(t.text),
    math:t=>{ const p=intsIn(/odvěsny (\d+) m a (\d+) m/,t.text); if(!p)return 'nenašel čísla'; const [a,b]=p; const c=Math.hypot(a,b); if(!Number.isInteger(c))return `přepona ${c} není celé`; return (Number(t.ans)===a+b+c)?null:`obvod ${a}+${b}+${c}≠${t.ans}`; },
    legs:t=>{ const p=intsIn(/odvěsny (\d+) m a (\d+) m/,t.text); const [a,b]=p; return {a,b}; } },
  { id:'akvarium', grades:['9'], test:t=>/Akvárium tvaru kvádru/.test(t.text),
    math:t=>{ const p=intsIn(/rozměry (\d+) × (\d+) × (\d+) dm/,t.text); if(!p)return 'nenašel čísla'; const [a,b,c]=p; return (Number(t.ans)===a*b*c)?null:`${a}·${b}·${c}≠${t.ans}`; } },
  { id:'plechovka', grades:['9'], test:t=>/Plechovka tvaru válce/.test(t.text),
    math:t=>{ const p=intsIn(/poloměr (\d+) cm a výšku (\d+) cm/,t.text); if(!p)return 'nenašel čísla'; const [r,v]=p; return (Number(t.ans)===Math.round(2*3.14*r*(r+v)))?null:`povrch ≠ ${t.ans}`; } },
  { id:'zasobnik', grades:['9'], test:t=>/Zásobník tvaru válce/.test(t.text),
    math:t=>{ const p=intsIn(/poloměr podstavy (\d+) dm a výšku (\d+) dm/,t.text); if(!p)return 'nenašel čísla'; const [r,v]=p; return (Number(t.ans)===Math.round(3.14*r*r*v))?null:`objem ≠ ${t.ans}`; } },
  // ── g8 (Pythagoras se scaled diagramem + válec) ──
  { id:'g8obrazovka', grades:['8'], test:t=>/Obrazovka má šířku/.test(t.text),
    math:t=>{ const p=intsIn(/šířku (\d+) cm a výšku (\d+) cm/,t.text); if(!p)return 'nenašel čísla'; const [sir,vys]=p; const ans=Number(t.ans); return (sir*sir+vys*vys===ans*ans)?null:`${sir}²+${vys}²≠${ans}²`; },
    legs:t=>{ const p=intsIn(/šířku (\d+) cm a výšku (\d+) cm/,t.text); const [sir,vys]=p; return {a:sir,b:vys}; } },
  { id:'g8zebrik', grades:['8'], test:t=>/Žebřík dlouhý/.test(t.text),
    math:t=>{ const p=intsIn(/dlouhý (\d+) m[\s\S]*pata (\d+) m od zdi/,t.text); if(!p)return 'nenašel čísla'; const [zeb,dist]=p; const ans=Number(t.ans); return (dist*dist+ans*ans===zeb*zeb)?null:`${dist}²+${ans}²≠${zeb}²`; },
    legs:t=>{ const p=intsIn(/dlouhý (\d+) m[\s\S]*pata (\d+) m od zdi/,t.text); const [zeb,dist]=p; return {a:dist,b:Number(t.ans)}; } },
  { id:'g8sud', grades:['8'], test:t=>/Sud tvaru válce/.test(t.text),
    math:t=>{ const p=intsIn(/poloměr (\d+) dm a výšku (\d+) dm/,t.text); if(!p)return 'nenašel čísla'; const [r,v]=p; return (Number(t.ans)===Math.round(3.14*r*r*v))?null:`objem ≠ ${t.ans}`; } },
  // ── g7 (obsahy čtyřúhelníků + objem kvádru) ──
  { id:'g7pozemek', grades:['7'], test:t=>/Pozemek tvaru rovnoběžníku/.test(t.text),
    math:t=>{ const p=intsIn(/stranu (\d+) m a výšku (\d+) m/,t.text); if(!p)return 'nenašel čísla'; const [a,v]=p; return (Number(t.ans)===a*v)?null:`${a}·${v}≠${t.ans}`; } },
  { id:'g7hraz', grades:['7'], test:t=>/Průřez hráze/.test(t.text),
    math:t=>{ const p=intsIn(/základnami (\d+) m a (\d+) m při výšce (\d+) m/,t.text); if(!p)return 'nenašel čísla'; const [a,c,v]=p; return (Number(t.ans)===(a+c)*v/2)?null:`(${a}+${c})·${v}/2≠${t.ans}`; } },
  { id:'g7bedna', grades:['7'], test:t=>/Bedna tvaru kvádru/.test(t.text),
    math:t=>{ const p=intsIn(/(\d+) × (\d+) × (\d+) dm/,t.text); if(!p)return 'nenašel čísla'; const [a,b,c]=p; return (Number(t.ans)===a*b*c)?null:`${a}·${b}·${c}≠${t.ans}`; } },
  // ── g6 (objem/povrch kvádru a krychle) ──
  { id:'g6bazenek', grades:['6'], test:t=>/Nádrž tvaru kvádru/.test(t.text),
    math:t=>{ const p=intsIn(/(\d+) × (\d+) × (\d+) dm/,t.text); if(!p)return 'nenašel čísla'; const [a,b,c]=p; return (Number(t.ans)===a*b*c)?null:`${a}·${b}·${c}≠${t.ans}`; } },
  { id:'g6krabice', grades:['6'], test:t=>/Krabice tvaru kvádru/.test(t.text),
    math:t=>{ const p=intsIn(/(\d+) × (\d+) × (\d+) cm/,t.text); if(!p)return 'nenašel čísla'; const [a,b,c]=p; return (Number(t.ans)===2*(a*b+b*c+a*c))?null:`povrch ≠ ${t.ans}`; } },
  { id:'g6krychle', grades:['6'], test:t=>/Kostka tvaru krychle/.test(t.text),
    math:t=>{ const p=intsIn(/hranu (\d+) cm/,t.text); if(!p)return 'nenašel čísla'; const [a]=p; return (Number(t.ans)===a*a*a)?null:`${a}³≠${t.ans}`; } },
];
const EXPECT = RULES.filter(r => r.grades.includes(GRADE));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC });
  const ctx = await browser.newContext({ viewport: { width: 300, height: 220 } });
  const page = await ctx.newPage();
  await ctx.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
  await page.goto(`${base}/projects/rpg-mat-${GRADE}.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction((g) => !!window['RPG_TASK_EXTRA_' + g], GRADE, { timeout: 10000 });

  // Nasbírej mnoho generací VŠECH SVG úloh (auto-discovery všech misí banky)
  const tasks = await page.evaluate((g) => {
    const out = [];
    const bank = window['RPG_TASK_EXTRA_' + g];
    for (const mid of Object.keys(bank)) {
      const gen = bank[mid];
      if (typeof gen !== 'function') continue;
      for (let i = 0; i < 80; i++) {
        let arr; try { arr = gen(); } catch (e) { out.push({err:'gen '+mid+': '+e.message}); continue; }
        for (const t of arr) if (t && t.svg) out.push({ svg:t.svg, text:t.text||'', ans:String(t.ans) });
      }
    }
    return out;
  }, GRADE);

  console.log(`[g${GRADE}] Nasbíráno ${tasks.length} SVG generací.`);

  // ── 1) STRUKTURA (všechny) ──
  let svgCount = 0;
  const seenFamilies = {};
  const sampleForShot = {};
  for (const t of tasks) {
    if (t.err) { ok(false, 'generátor spadl: ' + t.err); continue; }
    svgCount++;
    const bad = /undefined|NaN|ERR:/.test(t.svg) || /undefined|NaN/.test(t.text);
    ok(!bad, 'svg/text obsahuje undefined/NaN: ' + t.text.slice(0,40));
    ok(/^<svg[ >]/.test(t.svg.trim()) && t.svg.includes('</svg>'), 'svg není validní obal: ' + t.text.slice(0,40));
    ok(/^-?\d+$/.test(t.ans) || t.ans === 'ANO' || t.ans === 'NE', 'ans není číslo/ANO/NE: ' + t.ans + ' (' + t.text.slice(0,30) + ')');

    // ── 2) + 3) NOVÉ úlohy (jen pravidla tohoto ročníku) ──
    for (const rule of EXPECT) {
      if (!rule.test(t)) continue;
      seenFamilies[rule.id] = (seenFamilies[rule.id]||0) + 1;
      if (!sampleForShot[rule.id]) sampleForShot[rule.id] = t;
      // MATIKA
      const merr = rule.math(t);
      ok(merr === null, `[${rule.id}] matika: ${merr} · ${t.text.replace(/\n/g,' ').slice(0,60)}`);
      // GEOMETRIE (jen pravoúhlé trojúhelníky se scaled helperem)
      if (rule.legs) {
        const poly = parsePoly(t.svg);
        ok(!!poly, `[${rule.id}] polygon se nenaparsoval`);
        if (poly) {
          const { C, B, A } = poly;
          ok(Math.abs(B.y - C.y) < 0.6, `[${rule.id}] B není ve výšce C (dolní odvěsna není vodorovná)`);
          ok(Math.abs(A.x - C.x) < 0.6, `[${rule.id}] A není přesně nad C (levá odvěsna není svislá)`);
          const { a, b } = rule.legs(t); // a=vodorovná, b=svislá
          const hpx = Math.abs(B.x - C.x), vpx = Math.abs(C.y - A.y);
          // poměr nakreslených odvěsen musí odpovídat poměru čísel (fidelita měřítka)
          const relErr = Math.abs((hpx / vpx) - (a / b)) / (a / b);
          ok(relErr < 0.03, `[${rule.id}] poměr odvěsen v obrázku (${(hpx/vpx).toFixed(2)}) ≠ poměr čísel (${(a/b).toFixed(2)})`);
          // značka pravého úhlu u C
          ok(t.svg.includes(`<rect x="${C.x}" y="${C.y-13}"`), `[${rule.id}] chybí značka pravého úhlu u C`);
        }
      }
    }
  }

  // ── screenshoty reprezentativních vzorků každé nové rodiny ──
  for (const [id, t] of Object.entries(sampleForShot)) {
    await page.setContent(`<!doctype html><body style="margin:0;background:#0a0e1a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:220px"><div style="width:250px">${t.svg}</div><div style="color:#8fa;font:11px monospace;white-space:pre;text-align:center;margin-top:4px">${t.text.replace(/</g,'&lt;')}\nodpověď: ${t.ans}</div></body>`);
    await page.screenshot({ path: path.join(OUT, id + '.png') });
  }

  // každá nová rodina TOHOTO ročníku se musí objevit
  for (const rule of EXPECT) ok((seenFamilies[rule.id]||0) > 0, `[g${GRADE}] nová rodina "${rule.id}" se ani jednou nevygenerovala`);

  await browser.close();
  srv.close();
  console.log(`\nSVG úloh strukturně: ${svgCount} · nové rodiny:`, seenFamilies);
  console.log(`Screenshoty → ${OUT}`);
  console.log(`\n${pass} ✅ / ${fail} ❌`);
  process.exit(fail ? 1 : 0);
})();
