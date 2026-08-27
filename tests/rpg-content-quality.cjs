/**
 * Audit KVALITY ZADÁNÍ napříč všemi hrami (3.–9. ročník).
 *
 * Proč: existující audity hlídají MATEMATIKU (NaN, správnost výsledku). Jenže
 * v přijímačkové bance byly úlohy matematicky správně a zadání přesto drhla —
 * „Na 2 porcí", nezkrácené zlomky „2/4", nesmyslné dvojice („po 50 Kč a po
 * 50 Kč"). Takové vady projdou strojovým testem a odhalí je až žák v hodině.
 * Tenhle audit je hledá strojově napříč základním poolem i rozšiřující bankou.
 *
 * Kontroluje:
 *   1) nezkrácené zlomky v zadání (mimo úlohy, které KRÁTIT přímo zadávají),
 *   2) skloňování počitatelných jmen (2–4 dny vs 5 dní),
 *   3) prázdné nebo duplicitní nápovědy (známá opakovaná vada, viz CLAUDE.md),
 *   4) NaN/undefined v textu i nápovědách,
 *   5) dvojité mezery a mezera před interpunkcí (typografie).
 *
 * Spusť: node tests/rpg-content-quality.cjs
 */
const fs = require('fs');
const path = require('path');

const P = f => path.join(__dirname, '..', 'projects', f);
const GRADES = [3, 4, 5, 6, 7, 8, 9];
const ITER = Number(process.env.ITER || 260);

// ── stuby herních helperů ──
global.ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
global.gcd = function g(a, b) { return b ? g(b, a % b) : Math.abs(a); };
global.cz = n => String(n).replace('.', ',');
global.skl = (n, one, few, many) => n === 1 ? one : (n >= 2 && n <= 4 ? few : many);
global.shuffleArr = a => a;
global.countDiv = () => 1;
// všechny svg* helpery, které se v souborech vyskytnou, stubneme automaticky
(function stubSvg() {
  let src = '';
  for (const g of GRADES) {
    for (const f of ['rpg-mat-' + g + '.html', 'rpg-tasks-' + g + '.js', 'rpg-sprites-' + g + '.js']) {
      if (fs.existsSync(P(f))) src += fs.readFileSync(P(f), 'utf8');
    }
  }
  [...new Set(src.match(/\bsvg[A-Z]\w*/g) || [])].forEach(k => { global[k] = () => '<svg></svg>'; });
})();

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { console.log('  ✅ ' + n); pass++; } else { console.log('  ❌ ' + n + (d ? ' — ' + d : '')); fail++; } };

/* ── pravidla ─────────────────────────────────────────────────────── */

// zlomek musí být v základním tvaru; VÝJIMKA: úlohy, které krácení/rozšiřování
// samy zadávají (tam je nezkrácený zlomek smyslem úlohy)
const KRATI = /krať|krácen|krátit|základní(m)? tvar|rozšiř|rozšíře|doplň(te)? čitatele|stejnou hodnotu/i;
// jména jmenovatelů — když se na ně úloha ptá, jmenovatel MUSÍ zůstat
const JMENOVATELE = /polovin|třetin|čtvrtin|pětin|šestin|sedmin|osmin|devítin|desetin|dvanáctin|dvacetin/i;
function unreducedFractions(text) {
  const t = String(text);
  if (KRATI.test(t) || JMENOVATELE.test(t)) return [];
  const fr = [...t.matchAll(/(?<![\d,.])(\d{1,3})\/(\d{1,3})(?![\d,.])/g)]
    .map(m => ({ raw: m[0], a: +m[1], b: +m[2] }))
    .filter(f => f.a > 0 && f.b > 1 && f.a < f.b);
  // porovnávání/sčítání zlomků se STEJNÝM jmenovatelem je smysl úlohy —
  // krátit by ji zničilo, takže takové zadání nehlásíme
  const denoms = fr.map(f => f.b);
  if (denoms.some((d, i) => denoms.indexOf(d) !== i)) return [];
  return fr.filter(f => global.gcd(f.a, f.b) !== 1).map(f => f.raw);
}

// skloňování: 2–4 → tvar množný (dny), 5+ → genitiv (dní)
const NOUNS = [
  { few: 'dny', many: 'dní' }, { few: 'hodiny', many: 'hodin' },
  { few: 'minuty', many: 'minut' }, { few: 'kusy', many: 'kusů' },
  { few: 'žáci', many: 'žáků' }, { few: 'litry', many: 'litrů' },
  { few: 'metry', many: 'metrů' }, { few: 'koruny', many: 'korun' },
  { few: 'porce', many: 'porcí' }, { few: 'body', many: 'bodů' },
  { few: 'roky', many: 'let' }, { few: 'stránky', many: 'stránek' },
  { few: 'otočky', many: 'otoček' },
];

/* Slova, po kterých je 2. pád správně i u počtu 2–4, takže „3 otoček" tam
   chybou NENÍ. Jsou to předložky vážící genitiv („do 3 hnízd", „ze 4 beden")
   a číselné výrazy („každá ze 3 komnat"). Bez tohoto seznamu by opačný směr
   hlásil hlavně korektní češtinu — přesně to byl důvod, proč se dřív
   nekontroloval vůbec. */
const GENITIV_PRED = /\b(do|z|ze|od|ode|u|bez|beze|během|kolem|okolo|podle|vedle|místo|kromě|dobu|každ\w+)\s*$/i;

function badDeclension(text) {
  // Směr 1 — jednoznačný: „5+ s tvarem pro 2–4" („5 hodiny").
  const out = [];
  const t = String(text);
  for (const { few, many } of NOUNS) {
    const r = new RegExp('(?<![\\d])(\\d*[05-9])\\s+' + few + '\\b', 'g');
    for (const m of t.matchAll(r)) out.push(m[0] + ' → ' + m[1] + ' ' + many);
  }
  /* Směr 2 — „2–4 s tvarem pro 5+" („3 otoček" místo „3 otočky").
     Hlásí se jen u HOLÝCH 2/3/4 (ne 22/23/24, kde je genitiv taky přípustný)
     a jen tam, kde před číslovkou NESTOJÍ slovo vážící genitiv. Tenhle směr
     tu dřív nebyl vůbec, a proto v 5. ročníku roky přežilo
     „Kolik metrů urazí 3 otoček?". */
  for (const { few, many } of NOUNS) {
    const r = new RegExp('(?<![\\d])([234])(?![\\d])\\s+' + many + '\\b', 'g');
    for (const m of t.matchAll(r)) {
      if (GENITIV_PRED.test(t.slice(0, m.index))) continue;
      out.push(m[0] + ' → ' + m[1] + ' ' + few);
    }
  }
  return out;
}

// Artefakt plovoucí čárky: „5,1000000000000005". 6+ desetinných míst je jistota
// (učivo ZŠ má max 3; „0,0008" u mocnin deseti je legitimní, proto ne 4).
function floatNoise(text) {
  return [...String(text).matchAll(/\d+[.,]\d{6,}/g)].map(m => m[0]);
}
// Stejná normalizace, jakou hra dělá při zobrazení nápovědy (czTxt).
const czTxt = t => String(t).replace(/(\d)\.(\d)/g, '$1,$2');

// Nezaokrouhlený periodický rozvoj v nápovědě: 1/3 = 0,3333… Žák má vidět
// zaokrouhlenou hodnotu se znaménkem ≈, ne useknuté cifry (Vojtovo pravidlo).
function periodicDecimal(text) {
  return [...String(text).matchAll(/\d+[.,]\d{3,}/g)].map(m => m[0]);
}
// Desetinná TEČKA v textu pro žáka — česky se píše čárka.
function decimalDot(text) {
  const t = String(text);
  if (t.includes('<')) return [];           // SVG/HTML atributy (stroke-width="3.5")
  return [...t.matchAll(/\d\.\d/g)].map(m => m[0]);
}

function typography(text) {
  const out = [];
  // dvojitá mezera se v HTML stejně slévá do jedné → není to vada zadání
  // „?" bývá ZÁSTUPNÝ ZNAK („518 = 500 + 10 + ?"), ne interpunkce → nehlásíme
  if (/\s+[,;!](?!\d)/.test(text) || /\s+\.(?!\d)/.test(text)) out.push('mezera před interpunkcí');
  return out;
}

/* ── načtení úloh ze hry ───────────────────────────────────────────── */
function loadGrade(g) {
  const items = [];
  const htmlPath = P('rpg-mat-' + g + '.html');
  if (!fs.existsSync(htmlPath)) return items;
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/const AREAS\s*=\s*(\[[\s\S]*?\n\s*\];)/);
  if (!m) return items;
  let AREAS;
  try { AREAS = new Function('return ' + m[1].replace(/;\s*$/, ''))(); } catch (e) { return items; }

  global.window = {};
  const bankPath = P('rpg-tasks-' + g + '.js');
  let EX = {};
  if (fs.existsSync(bankPath)) {
    /* Dřív tu bylo `catch (e) {}`. Když se banka nenačetla (stačí překlep
       v modulu), chyba se spolkla, EX zůstalo prázdné a audit doběhl
       ZELENĚ — jen o desítky tisíc úloh chudší, čehož si nikdo nevšimne.
       Ověřeno naostro: rozbitá banka 5. ročníku ubrala 57 460 úloh a
       výsledek pořád hlásil 11 ✅ / 0 ❌. Rozbitá banka teď shodí audit. */
    try {
      new Function(fs.readFileSync(bankPath, 'utf8'))();
      EX = global.window['RPG_TASK_EXTRA_' + g] || {};
    } catch (e) {
      console.error(`\n  ❌ banka ${g}. ročníku se nenačetla: ${e.message}\n`);
      process.exit(1);
    }
    if (!Object.keys(EX).length) {
      console.error(`\n  ❌ banka ${g}. ročníku je prázdná — audit by běžel naprázdno\n`);
      process.exit(1);
    }
  }
  AREAS.forEach(ar => (ar.missions || []).forEach(mi => {
    items.push({ mid: mi.id, name: mi.name, gen: mi.tasks, src: 'base' });
    if (EX[mi.id]) items.push({ mid: mi.id, name: mi.name, gen: EX[mi.id], src: 'banka' });
  }));
  return items;
}

/* ── běh ──────────────────────────────────────────────────────────── */
console.log('\n── Audit kvality zadání (3.–9. ročník) ──\n');
const found = { objekt: [], frac: [], decl: [], hintEmpty: [], hintDup: [], nan: [], typo: [], float: [], dotText: [], dotHint: [], periodic: [], hintMath: [], geoInv: [], geoNezn: [] };
let hintDop = 0;   // kolik nápověd se podařilo dopočítat (pojistka proti planému běhu)
let geoDop = 0;    // kolik inverzních geometrických úloh se dopočítalo
let generated = 0;

for (const g of GRADES) {
  const items = loadGrade(g);
  if (!items.length) { console.log('  ⚠️  ' + g + '. ročník: nepodařilo se načíst úlohy'); continue; }
  for (const it of items) {
    for (let i = 0; i < ITER; i++) {
      let arr;
      try { arr = it.gen() || []; } catch (e) { continue; }
      if (!Array.isArray(arr)) continue;
      for (const t of arr) {
        generated++;
        const text = String((t && t.text) || '');
        const hints = Array.isArray(t && t.hints) ? t.hints : [];
        const where = g + '/' + it.mid + ' (' + it.src + ')';
        const all = text + ' ' + hints.join(' ');

        if (/NaN|undefined/.test(all)) push('nan', where, text.slice(0, 70));
        /* ── Inverzní geometrie: dopočítat rozměr ze ZADANÉ veličiny ──────
             Mise 8/7-2 („Obvod obdélníku je X, jedna strana Y, jaká je
             druhá?") dosazovala za obvod jeho polovinu a byla neřešitelná
             ve 100 % generování. Žádný audit to nechytil, protože
             matematika byla konzistentní sama se sebou — jen neodpovídala
             tomu, co zadání TVRDÍ. Tohle pravidlo zadání skutečně
             dopočítá: z „Obvod obdélníku je 40, jedna strana 20" vyjde
             druhá strana 0, kdežto `ans` říká 20.
             Vzorů je 20 a pokrývají VŠECHNY inverzní geometrické úlohy
             v bankách (0 nerozpoznaných z 8 320 nalezených). */
        (function(){
          const txt=text.replace(/\s+/g,' ').replace(/(\d),(\d)/g,'$1.$2');
          const zadana=/(Obvod|Obsah|Objem|Povrch)[^.?!]{0,40}?\d/i.test(txt);
          /* Mezi „Jaká je" a jménem rozměru bývá přívlastek („Jaká je DRUHÁ
             strana?"). První verze ho nepřipouštěla, takže mise 8/7-2 —
             přesně ta, kvůli které pravidlo vzniklo — filtrem NEPROŠLA
             a sabotáž „nic nenašla". Proto se povoluje až 25 znaků mezi. */
          const ptaSe=/(Jak dlouh|Kolik měří|Jak vysok|délka hrany|Jaká je[^?]{0,25}?(délka|strana|výška|šířka)|Jaký je[^?]{0,25}?(poloměr|průměr))/i.test(txt);
          if(!(zadana&&ptaSe))return;
          const cil=parseFloat(String(t&&t.ans).replace(',','.'));
          const N='(-?\\d+(?:\\.\\d+)?)';
          const R=(re)=>{const m=txt.match(new RegExp(re,'i'));return m?m.slice(1).map(Number):null;};
          const PI=3.14;
          let ocek=null,vzor=null; let m;
          if((m=R('čtverec[^.?!]*obvod '+N)))            {ocek=m[0]/4; vzor='čtverec z obvodu';}
          else if((m=R('čtvercov[^.?!]*obvod '+N)))      {ocek=m[0]/4; vzor='čtverec z obvodu';}
          else if((m=R('čtverec[^.?!]*obsah '+N)))       {ocek=Math.sqrt(m[0]); vzor='čtverec z obsahu';}
          else if((m=R('shodné čtverce[\\s\\S]*?obvod prvního je '+N))) {ocek=m[0]/4; vzor='shodné čtverce';}
          else if((m=R('rovnostranný[^.?!]*obvod '+N)))  {ocek=m[0]/3; vzor='rovnostranný z obvodu';}
          else if((m=R('obvod trojúhelníku je '+N+'[\\s\\S]*?strany měří '+N+' cm a '+N))) {ocek=m[0]-m[1]-m[2]; vzor='trojúhelník třetí strana';}
          // Tvar „Obvod obdélníku je N … jedna strana je N" — právě tímhle
          // zněla mise 8/7-2, která byla neřešitelná ve 100 % generování.
          else if((m=R('obvod obdélníku je '+N+'[\\s\\S]*?stran[ay] (?:je )?'+N))) {ocek=m[0]/2-m[1]; vzor='obdélník z obvodu (obrácený slovosled)';}
          else if((m=R('obdélník má obvod '+N+'[^.?!]*dvě strany měří po '+N))) {ocek=(m[0]-2*m[1])/2; vzor='obdélník obvod (dvě po)';}
          else if((m=R('obdélník má obvod '+N+'[^.?!]*stranu '+N))) {ocek=m[0]/2-m[1]; vzor='obdélník z obvodu';}
          else if((m=R('obdélník má obsah '+N+'[^.?!]*stran[uae] (?:a = )?'+N))) {ocek=m[0]/m[1]; vzor='obdélník z obsahu';}
          else if((m=R('krychle má objem '+N)))          {ocek=Math.cbrt(m[0]); vzor='krychle z objemu';}
          else if((m=R('krychle má povrch '+N)))         {ocek=Math.sqrt(m[0]/6); vzor='krychle z povrchu';}
          else if((m=R('kvádr má objem '+N+'[^.?!]*podstav[uae][^.?!]*?'+N+'[^.?!]*?[×x] ?'+N))) {ocek=m[0]/(m[1]*m[2]); vzor='kvádr z objemu';}
          else if((m=R('kvádr má objem '+N+'[^.?!]*a = '+N+'[^.?!]*b = '+N))) {ocek=m[0]/(m[1]*m[2]); vzor='kvádr z objemu (a,b)';}
          else if((m=R('rovnoběžník má obsah '+N+'[^.?!]*základnu '+N))) {ocek=m[0]/m[1]; vzor='rovnoběžník výška';}
          else if((m=R('obsah kruhu = '+N)))             {ocek=Math.sqrt(m[0]/PI); vzor='kruh poloměr z obsahu';}
          else if((m=R('obvod (?:kružnice|kolečka) je '+N))) {ocek=m[0]/(2*PI); vzor='kružnice poloměr z obvodu';}
          // POZOR: trojúhelník má obsah ½·z·v, takže výška je 2S/z —
          // NE S/z jako u rovnoběžníku. Snadno se to splete.
          else if((m=R('trojúhelník má obsah '+N+'[\\s\\S]*?základnu '+N))) {ocek=2*m[0]/m[1]; vzor='trojúhelník výška';}
          else if((m=R('obdélník\\S*[\\s\\S]*?má obvod '+N+'[\\s\\S]*?stranu '+N))) {ocek=m[0]/2-m[1]; vzor='obdélník z obvodu (slovní)';}
          if(ocek===null||!isFinite(ocek)||!isFinite(cil)){
            /* Neznámý tvar se NESMÍ ztratit — jinak by stačilo přeformulovat
               zadání a pravidlo by pro něj tiše přestalo platit. */
            push('geoNezn', where, txt.slice(0, 80));
            return;
          }
          geoDop++;
          const des=(String(t.ans).split(/[.,]/)[1]||'').length;
          const zaokr=Math.round(ocek*Math.pow(10,des))/Math.pow(10,des);
          if(Math.abs(zaokr-cil)>1e-9){
            push('geoInv', where, vzor + ': „' + txt.slice(0, 70) + '" → vychází ' + ocek + ', ans ' + t.ans);
          }
        })();

        /* ── Poslední nápověda se DOPOČÍTÁ a musí dát `ans`. ──────────
           Kontrola „nápověda obsahuje výsledek" je slabá: projde
           i tehdy, když je špatně zároveň nápověda i odpověď. Takhle
           vypadala vada v `goniometrie.html` — a takhle vypadala
           i úloha 8/7-2 („Obvod obdélníku je X, jedna strana Y, jaká
           je druhá?"), kde se za obvod dosazovala jeho POLOVINA:
           nesedělo to ve 100 % generování, žák dostal „špatně" i když
           počítal správně, a nápověda ho vedla ke stejnému číslu.

           TVAR JE ZÁMĚRNĚ ÚZKÝ. Nápověda smí mít prozaický popisek
           před prvním „=" („Druhá strana = 18 − 12 = ?"), ale všechno
           za ním musí být čistá aritmetika. Volnější tvar (vzít
           poslední výraz odkudkoli) jsem změřil taky: dopočítá
           70 567 nápověd, ALE dá 21 planých poplachů — RPG nápovědy
           běžně popisují MEZIKROK („10 : 5 = 2, pak + 6.", „1 díl =
           72 : 8 = 9, pak × 4 → 36") a odpovědi bývají zlomky jako
           řetězec („1/6"). Úzký tvar dopočítá 4 940 nápověd a dá
           0 planých poplachů — a tu skutečnou vadu chytí. */
        (function () {
          if (t == null || t.ans == null) return;
          const cil = parseFloat(String(t.ans).replace(',', '.'));
          if (!isFinite(cil)) return;
          /* Značky se tu ZÁMĚRNĚ nestahují. Naměřeno na 574 080 úlohách:
             stahování značek nezměnilo ANI JEDNU nápovědu — v RPG bankách
             žádné HTML není. Bylo by to tedy mrtvé, a navíc nebezpečné:
             `<` se v nápovědách používá jako MENŠÍ NEŽ („k = −3 < 0"),
             takže by zápis typu „a < b > c" regulární výraz snědl. */
          const posl = hints.length ? String(hints[hints.length - 1]) : '';
          const cista = posl.replace(/^[\s💡📘⚠️]*/, '').trim();
          const kde = cista.indexOf('=');
          if (kde < 0) return;
          if (!/^[-\d\s+*/().,:×·÷−–—]+=\s*\??$/.test(cista.slice(kde + 1))) return;
          const us = cista.split('=');
          if (us.length < 2) return;
          /* Tečka na konci předchozí VĚTY se plete s desetinnou,
             minus bývá U+2212 a tisíce oddělují ÚZKÉ mezery. */
          let e = us[us.length - 2].split(/\.\s+/).pop()
            .replace(/[×·]/g, '*').replace(/÷|:/g, '/').replace(/[−–—]/g, '-')
            .replace(/[\s\u00a0\u202f]/g, '').replace(/,(\d)/g, '.$1')
            .replace(/^[^0-9(+-]*/, '').replace(/^\.+/, '');
          if (!/^[\d+\-*/().]+$/.test(e) || !/[+\-*/]/.test(e)) return;
          let v = null; try { v = Function('"use strict";return(' + e + ')')(); } catch (err) {}
          if (v === null || !isFinite(v)) return;
          hintDop++;
          /* Nápověda výsledek zaokrouhluje („r = 28 : 6,28 = ?" dá
             4,4586, ale odpověď je 4,5), proto se porovnává na tolik
             desetinných míst, kolik jich má `ans`. */
          const des = (String(t.ans).split(/[.,]/)[1] || '').length;
          const zaokr = Math.round(v * Math.pow(10, des)) / Math.pow(10, des);
          if (Math.abs(zaokr - cil) > 1e-9)
            push('hintMath', where, '„' + posl.slice(0, 60) + '" → ' + v + ', ans ' + t.ans);
        })();
        // 1. stupeň (3.–5.): nezkrácený zlomek je záměr („kolik je 6/8 z 64" se
        // počítá po osminách), proto pravidlo platí až od 6. ročníku
        // Kontrolu základního tvaru zlomku tu ZÁMĚRNĚ neděláme: na 218 tis. úlohách
        // dala jen falešné poplachy. Ve zlomkových misích je nezkrácený tvar SMYSLEM
        // úlohy („6 a 6/8 = ?/8", porovnání se stejným jmenovatelem, „kolik je 6/8
        // z 64"). Pravidlo má smysl u přijímaček (prijimacky-gen.test.cjs), kde se
        // základní tvar očekává; tady by bylo škodlivé.
        floatNoise(all).forEach(f => push('float', where, f + '  «' + text.replace(/\n/g, ' ').slice(0, 55) + '»'));
        decimalDot(text).forEach(() => push('dotText', where, text.replace(/\n/g, ' ').slice(0, 70)));
        // nápovědy hodnotíme PO normalizaci, protože hra ji dělá při zobrazení
        hints.forEach(h => decimalDot(czTxt(h)).forEach(() => push('dotHint', where, String(h).slice(0, 70))));
        hints.forEach(h => periodicDecimal(czTxt(h)).forEach(v => {
          if (!String(h).includes('≈')) push('periodic', where, v + '  «' + String(h).slice(0, 60) + '»');
        }));
        /* „[object Object]" v zadání. Vzniká, když se do řetězce dostane
           objekt místo textu — a stalo se to: pole framing-poolu window._fc
           v 9. ročníku se nikdy neuzavřelo, vlomilo se do něj pět generátorů
           úloh a _fc() pak losovalo objekt místo slovesa. Žák viděl
           „[object Object]: 30 × 3 =" zhruba u poloviny těch zadání. */
        if (/\[object /.test(text)) push('objekt', where, text.slice(0, 60));
        badDeclension(text).forEach(d => push('decl', where, d + '  «' + text.slice(0, 60) + '»'));
        typography(text).forEach(x => push('typo', where, x + '  «' + text.slice(0, 60) + '»'));
        if (hints.length && hints.some(h => !String(h || '').trim())) push('hintEmpty', where, text.slice(0, 60));
        if (hints.length >= 2 && String(hints[0]).trim() === String(hints[1]).trim()) push('hintDup', where, text.slice(0, 60));
      }
    }
  }
}
function push(kind, where, detail) {
  const bucket = found[kind];
  if (!bucket.some(x => x.where === where && x.detail === detail) && bucket.length < 400) bucket.push({ where, detail });
}

console.log('  vygenerováno a zkontrolováno ' + generated.toLocaleString('cs-CZ') + ' úloh\n');
const report = (kind, label) => {
  const b = found[kind];
  ok(label + ' (' + b.length + ')', b.length === 0);
  b.slice(0, 8).forEach(x => console.log('        • ' + x.where + ': ' + x.detail));
  if (b.length > 8) console.log('        … a dalších ' + (b.length - 8));
};
if (process.env.LIST) {
  for (const k of ['frac','dotText','dotHint']) {
    const uniq = [...new Set(found[k].map(x => x.where))];
    console.log('  ['+k+'] '+uniq.length+' generátorů: '+uniq.join(', '));
    uniq.slice(0,4).forEach(w => console.log('      '+w+': '+(found[k].find(x=>x.where===w)||{}).detail));
  }
}
report('nan', 'žádné NaN/undefined');
report('hintMath', 'poslední nápověda se dopočítá na uvedenou odpověď');
report('geoInv', 'inverzní geometrie: rozměr se dopočítá ze zadané veličiny');
report('geoNezn', 'inverzní geometrie: každý tvar zadání je rozpoznaný');
/* Kanárek na TICHÝ pokles pokrytí. Pravidlo pozná jen zadání, která
   projdou filtrem (obsahují slovo Obvod/Obsah/Objem/Povrch a ptají se
   na rozměr) — kdyby někdo úlohu přeformuloval („Perimetr obdélníku
   činí…"), vypadne z filtru DŘÍV, než se dostane k rozpoznávání vzorů,
   a `geoNezn` o ní mlčí. Ověřeno: takové přeformulování srazí počet
   z 8 320 na 8 060.
   Počet je mezi běhy PŘESNĚ stabilní (šablony × iterace, nic se
   nelosuje), takže se sem dá dát skoro těsná hodnota: přírůstek
   projde, pokles ne. Když sem legitimně přibude nebo ubude geometrická
   úloha, přeměř a číslo uprav — ta hláška je právě od toho. */
ok('inverzní geometrie se vůbec měřila (' + geoDop + ' dopočítaných)', geoDop >= 8300,
   'dopočítáno jen ' + geoDop + ' (čekáno ≥8300) — ubylo pokrytí, nebo se změnil tvar zadání');
/* Pojistka proti planému běhu: kdyby se tvar nápověd změnil, filtr by
   nepustil nic a pravidlo by MLČELO. Naměřeno 4 940 dopočítaných. */
ok('aritmetika nápověd se vůbec měřila (' + hintDop + ' dopočítaných)', hintDop > 3000, 'dopočítáno jen ' + hintDop);
report('objekt', 'žádné „[object Object]" v zadání');
report('decl', 'skloňování počitatelných jmen');
report('hintEmpty', 'žádná prázdná nápověda');
report('hintDup', 'nápovědy L1 a L2 se liší');
report('float', 'žádné artefakty plovoucí čárky (5,1000000000000005)');
report('dotText', 'v ZADÁNÍ je desetinná čárka, ne tečka');

report('dotHint', 'v NÁPOVĚDÁCH je desetinná čárka, ne tečka');
report('periodic', 'zaokrouhlená hodnota v nápovědě má znaménko ≈, ne useknuté cifry');

// pojistka, že normalizaci opravdu dělá KAŽDÁ hra (ne jen náhodou v datech)
const bezCz = GRADES.filter(g => !fs.readFileSync(P('rpg-mat-' + g + '.html'), 'utf8').includes('czTxt('));
ok('všechny hry normalizují desetinnou čárku v nápovědách', bezCz.length === 0, 'chybí v: ' + bezCz.join(', '));

/* Trénink má progresivní nápovědu (1/2 → 2/2), boj naopak JEDINOU bez výsledku.
   V 6.–9. ročníku se druhá nápověda dřív vůbec nezobrazovala, přestože ji má
   napsanou 83 % úloh — tenhle test hlídá, aby se ta regrese nevrátila. */
const bezDvou = GRADES.filter(g => !fs.readFileSync(P('rpg-mat-' + g + '.html'), 'utf8').includes('Nápověda 2/2'));
ok('trénink nabízí druhou úroveň nápovědy ve všech ročnících', bezDvou.length === 0, 'chybí v: ' + bezDvou.join(', '));
const bojProzrazuje = GRADES.filter(g => {
  const src = fs.readFileSync(P('rpg-mat-' + g + '.html'), 'utf8');
  const m = src.match(/function showHint\(\)\{[\s\S]*?\n\}/);
  return m && /hints\[1\]/.test(m[0]);      // boj se nesmí dostat k výsledkové nápovědě
});
ok('boj zůstává jednoúrovňový (nikdy neprozradí výsledek)', bojProzrazuje.length === 0, 'prozrazuje v: ' + bojProzrazuje.join(', '));

console.log('\n══════════════════════════════════════════');
console.log('  VÝSLEDEK: ' + pass + ' ✅ / ' + fail + ' ❌');
console.log('══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
