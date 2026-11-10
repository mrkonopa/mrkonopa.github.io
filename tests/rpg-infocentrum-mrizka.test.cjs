/* ═════════════════════════════════════════════════════════════════════════════
   Infocentrum — rozložení panelů, čistá logika (`projects/rpg-infocentrum-mrizka.js`), autor Vojtěch Konopa.

   Ověřuje se (Node, bez prohlížeče):
     1. registr: čtyři panely ve výchozí poloze, v mřížce 12 sloupců, bez překryvu, výchozí rozložení je stabilní
     2. gravitace: skrytý panel (Týmy) uvolní místo, ostatní „spadnou“ nahoru; skrytému zůstane uložená poloha
     3. přesun: na místo se mezi ostatními, mimo mřížku se ořízne, nesmyslná čísla se ignorují, ostatní ustoupí
     4. velikost: pod nejmenší velikost nejde, přes šířku mřížky ne, při zvětšení se panel posune do mřížky
     5. klávesnice: šipky přesouvají, Shift + šipky mění velikost, svislý pohyb přeskočí souseda (výměna), na kraji nic
     6. náhodné operace (3 000 kroků, pevné semínko): vždy bez překryvu, v mřížce, bez děr nad panelem, opakování nic nemění
     7. ukládání: oběh uložit → načíst, nepřátelský obsah úložiště (cokoli) dá vždy platné rozložení, strop počtu klíčů
     4b. výška podle obsahu: řádky mřížky pro obsah, přizpůsobení jen panelům řízeným obsahem, připnutí změnou výšky, uložení (0 = podle obsahu)
     8. věta pro čtečku obrazovky
   Sabotáže (11): připnutý panel se přizpůsobuje obsahu, výška podle obsahu se ukládá jako číslo, překryv povolen, bez gravitace, bez nejmenší velikosti, čtení zděděných vlastností, svislý pohyb
   jen o řádek, uložené bez kontroly verze, bez stropu klíčů, bez přednosti taženého panelu, výchozí rozložení s překryvem.
   Spusť: node tests/rpg-infocentrum-mrizka.test.cjs
   ═════════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ZDROJ = fs.readFileSync(path.join(ROOT, 'projects', 'rpg-infocentrum-mrizka.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + m + (d ? ' — ' + d : '')); } };
const nacti = src => { const m = { exports: {} }; new Function('module', 'exports', src)(m, m.exports); return m.exports; };
const pol = l => l.map(p => p.id + ':' + p.x + ',' + p.y + ',' + p.w + ',' + p.h).join(' ');
const najdi = (l, id) => l.find(p => p.id === id);

/* nezávislé kontroly platnosti (nepoužívají nic z kontrolovaného modulu kromě registru) */
function vady(G, l, vid) {
  const v = [], viditelne = l.filter(p => vid.has(p.id));
  for (const p of l) {
    const m = G.PANELY.find(q => q.id === p.id);
    if (!m) { v.push('neznámý panel ' + p.id); continue; }
    if (![p.x, p.y, p.w, p.h].every(Number.isInteger)) v.push('neceločíselné ' + p.id);
    if (p.x < 0 || p.y < 0 || p.x + p.w > G.SLOUPCU) v.push('mimo mřížku ' + p.id);
    if (p.w < m.minW || p.h < m.minH) v.push('pod nejmenší velikostí ' + p.id);
  }
  for (let i = 0; i < viditelne.length; i++) for (let j = i + 1; j < viditelne.length; j++) {
    const a = viditelne[i], b = viditelne[j];
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) v.push('překryv ' + a.id + '/' + b.id);
  }
  for (const p of viditelne) {
    if (p.y === 0) continue;
    const podepren = viditelne.some(q => q !== p && q.x < p.x + p.w && p.x < q.x + q.w && q.y + q.h === p.y);
    if (!podepren) v.push('díra nad ' + p.id);
  }
  return v;
}
const VSE = G => new Set(G.ID);

function bez(G, id) { const s = VSE(G); s.delete(id); return s; }

function bezi(G, popisek, hlasit) {
  const f = (c, m, d) => { if (hlasit) ok(c, popisek + ': ' + m, d); else if (!c) bezi.nalez++; };
  bezi.nalez = 0;
  const all = VSE(G), vych = G.vychozi();

  /* 1 — registr */
  f(vych.length === 4 && G.ID.join() === 'tymy,kdo,trida,deje', 'čtyři panely v pořadí Týmy, Kdo hraje, Třída dohromady, Děje se', G.ID.join());
  f(vady(G, vych, all).length === 0, 'výchozí rozložení je platné (v mřížce, bez překryvu, bez děr)', vady(G, vych, all).join('; '));
  f(pol(G.kompaktuj(vych, all)) === pol(vych), 'výchozí rozložení je stabilní (gravitace ho nemění)', pol(G.kompaktuj(vych, all)));
  const kopieVych = JSON.stringify(vych); G.kompaktuj(vych, all); G.presun(vych, 'kdo', 3, 3, all); G.zmenVelikost(vych, 'kdo', 5, 5, all);
  f(JSON.stringify(vych) === kopieVych, 'operace nemění vstupní pole');

  /* 2 — gravitace a skryté panely */
  const sT = bez(G, 'tymy'), bezT = G.kompaktuj(vych, sT);
  f(najdi(bezT, 'kdo').y === 0 && najdi(bezT, 'trida').y === 0 && najdi(bezT, 'deje').y === 8, 'bez Týmů ostatní spadnou nahoru (0, 0, 8)', pol(bezT));
  f(najdi(bezT, 'tymy').y === 0 && najdi(bezT, 'tymy').h === 12, 'skrytému panelu zůstane jeho uložená poloha', pol(bezT));
  f(vady(G, bezT, sT).length === 0, 'bez Týmů je rozložení platné', vady(G, bezT, sT).join('; '));
  const znovu = G.kompaktuj(bezT, all);
  f(najdi(znovu, 'tymy').y === 0 && najdi(znovu, 'kdo').y === 12, 'po návratu Týmů ustoupí ostatní pod ně', pol(znovu));
  const jenKdo = G.kompaktuj(vych, new Set(['kdo']));
  f(najdi(jenKdo, 'kdo').y === 0, 'jediný viditelný panel je nahoře', pol(jenKdo));

  /* 3 — přesun */
  const a = G.presun(vych, 'deje', 0, 0, all);
  f(najdi(a, 'deje').x === 0 && najdi(a, 'deje').y === 0, 'panel přetažený na (0, 0) tam skutečně stojí a ostatní ustoupí', pol(a));
  f(vady(G, a, all).length === 0, 'po přesunu je rozložení platné', vady(G, a, all).join('; '));
  const b = G.presun(vych, 'trida', 99, 99, all);
  f(najdi(b, 'trida').x === G.SLOUPCU - najdi(b, 'trida').w, 'vodorovně mimo mřížku se panel přisune k okraji', pol(b));
  f(vady(G, b, all).length === 0, 'po přesunu mimo mřížku je rozložení platné', vady(G, b, all).join('; '));
  const c = G.presun(vych, 'kdo', -5, -5, all);
  f(najdi(c, 'kdo').x === 0 && najdi(c, 'kdo').y >= 0, 'záporná poloha se ořízne na 0', pol(c));
  for (const zle of [NaN, Infinity, 'x', null, undefined, {}, [1]]) {
    const d = G.presun(vych, 'kdo', zle, zle, all);
    f(vady(G, d, all).length === 0 && najdi(d, 'kdo').x === 0, 'nesmyslná čísla (' + String(zle) + ') nic nerozbijí', pol(d));
  }
  f(pol(G.presun(vych, 'neexistuje', 2, 2, all)) === pol(vych), 'neznámý panel se ignoruje');
  const prednost = G.presun(vych, 'deje', 0, 12, all);
  f(najdi(prednost, 'deje').x === 0 && najdi(prednost, 'deje').y === 12 && najdi(prednost, 'kdo').y > 12, 'tažený panel má přednost před tím, kdo tam stál', pol(prednost));

  /* 4 — velikost */
  const m1 = G.zmenVelikost(vych, 'kdo', 1, 1, all);
  f(najdi(m1, 'kdo').w === 4 && najdi(m1, 'kdo').h === 5, 'pod nejmenší velikost (4 × 5) nejde', pol(m1));
  const m2 = G.zmenVelikost(vych, 'kdo', 99, 999, all);
  f(najdi(m2, 'kdo').w === 12 && najdi(m2, 'kdo').h <= G.MAX_VYSKA, 'přes šířku mřížky ani strop výšky nejde', pol(m2));
  const m3 = G.zmenVelikost(vych, 'trida', 6, 8, all);
  f(najdi(m3, 'trida').x + najdi(m3, 'trida').w <= 12 && vady(G, m3, all).length === 0, 'zvětšení u pravého okraje posune panel do mřížky', pol(m3) + ' ' + vady(G, m3, all).join('; '));
  f(najdi(G.zmenVelikost(vych, 'tymy', 2, 2, all), 'tymy').w === 6, 'Týmy nejdou užší než 6 sloupců (dva týmy vedle sebe)');
  f(najdi(G.zmenVelikost(vych, 'trida', NaN, undefined, all), 'trida').w === 4, 'nesmyslná velikost se ignoruje');

  /* 4b — výška podle obsahu */
  f(G.radkuPro(36, 36, 12) === 1 && G.radkuPro(37, 36, 12) === 2 && G.radkuPro(84, 36, 12) === 2 && G.radkuPro(85, 36, 12) === 3, 'řádky mřížky pro obsah: 36 px = 1 řádek, 84 px = 2, 85 px = 3 (h řádků = h·36 + (h − 1)·12)');
  f(G.radkuPro(0, 36, 12) === 1 && G.radkuPro(NaN, 36, 12) === 1 && G.radkuPro(-5, 36, 12) === 1, 'prázdný nebo nesmyslný obsah = 1 řádek');
  f(vych.every(q => q.a === true), 've výchozím rozložení se všechny panely řídí obsahem');
  const mer = G.prizpusob(vych, { kdo: 25, trida: 2, deje: 999, tymy: NaN });
  f(najdi(mer, 'kdo').h === 25 && najdi(mer, 'trida').h === 7 && najdi(mer, 'deje').h === G.MAX_VYSKA && najdi(mer, 'tymy').h === 12, 'výška podle obsahu: změřené řádky, nejméně nejmenší výška, nejvýš strop, nesmysl se ignoruje', pol(mer));
  const pripnute = G.zmenVelikost(vych, 'kdo', 8, 10, all);
  f(najdi(pripnute, 'kdo').a === false && najdi(pripnute, 'kdo').h === 10, 'změna výšky panel připne (už se neřídí obsahem)', pol(pripnute));
  f(najdi(G.prizpusob(pripnute, { kdo: 30 }), 'kdo').h === 10, 'připnutý panel se podle obsahu nemění');
  f(najdi(G.zmenVelikost(vych, 'kdo', 9, 17, all), 'kdo').a === true && najdi(G.klavesa(vych, 'kdo', 'ArrowRight', true, all), 'kdo').a === true, 'změna jen šířky panel nepřipne');
  f(najdi(G.klavesa(vych, 'kdo', 'ArrowDown', true, all), 'kdo').a === false, 'Shift + šipka dolů (výška) panel připne');
  f(najdi(G.prizpusob(vych, Object.create({ kdo: 40 })), 'kdo').h === 17, 'zděděné vlastnosti měření se ignorují');
  const vstupP = JSON.stringify(vych); G.prizpusob(vych, { kdo: 30 });
  f(JSON.stringify(vych) === vstupP, 'přizpůsobení nemění vstupní pole');
  const uloz2 = G.serializuj(pripnute);
  f(uloz2.kdo[3] === 10 && uloz2.trida[3] === 0 && uloz2.deje[3] === 0, 'do úložiště jde výška jen u připnutého panelu (ostatní 0 = podle obsahu)', JSON.stringify(uloz2));
  const zp = G.ocisti(uloz2);
  f(najdi(zp, 'kdo').a === false && najdi(zp, 'kdo').h === 10 && najdi(zp, 'trida').a === true, 'po načtení zůstane připnutý panel připnutý a ostatní podle obsahu', JSON.stringify(zp));
  const hostileH = G.ocisti({ kdo: [0, 0, 4, 0], trida: [8, 0, 4, -3], deje: [8, 9, 4, '0'], tymy: [0, 0, 12, 1e9] });
  f(najdi(hostileH, 'kdo').a === true && najdi(hostileH, 'trida').a === false && najdi(hostileH, 'trida').h === 7 && najdi(hostileH, 'deje').a === true && najdi(hostileH, 'tymy').a === false && najdi(hostileH, 'tymy').h === G.MAX_VYSKA, 'výška 0 = podle obsahu, záporná a obří se ořízne, text se nebere', pol(hostileH) + ' ' + hostileH.map(q => q.a).join());

  /* 5 — klávesnice */
  const kp = G.klavesa(vych, 'trida', 'ArrowLeft', false, all);
  f(najdi(kp, 'trida').x < 8 && vady(G, kp, all).length === 0, 'šipka vlevo posune panel o sloupec (a nic se nepřekryje)', pol(kp));
  const kd = G.klavesa(vych, 'trida', 'ArrowDown', false, all);
  f(najdi(kd, 'trida').y > najdi(vych, 'trida').y && najdi(kd, 'deje').y < najdi(kd, 'trida').y && vady(G, kd, all).length === 0, 'šipka dolů přeskočí souseda (Třída a Děje se vymění)', pol(kd));
  const kn = G.klavesa(vych, 'trida', 'ArrowUp', false, all);
  f(pol(kn) === pol(vych) || najdi(kn, 'trida').y < 12, 'šipka nahoru nad Týmy se neztratí', pol(kn));
  const ks = G.klavesa(vych, 'kdo', 'ArrowRight', true, all);
  f(najdi(ks, 'kdo').w === 9 && najdi(ks, 'kdo').x === 0, 'Shift + šipka vpravo zvětší šířku o 1', pol(ks));
  const kz = G.klavesa(vych, 'kdo', 'ArrowLeft', true, all);
  f(najdi(kz, 'kdo').w === 7, 'Shift + šipka vlevo zmenší šířku o 1', pol(kz));
  const kh = G.klavesa(vych, 'kdo', 'ArrowDown', true, all);
  f(najdi(kh, 'kdo').h === 18, 'Shift + šipka dolů zvětší výšku o 1', pol(kh));
  let min = vych;
  for (let i = 0; i < 30; i++) min = G.klavesa(min, 'kdo', 'ArrowLeft', true, all);
  f(najdi(min, 'kdo').w === 4, 'opakované zmenšování se zastaví na nejmenší šířce', pol(min));
  const kk = G.klavesa(vych, 'tymy', 'ArrowUp', false, all);
  f(pol(kk) === pol(vych), 'nahoru z nejhořejší polohy se nic nestane');
  f(pol(G.klavesa(vych, 'kdo', 'Enter', false, all)) === pol(vych), 'jiná klávesa nic nedělá');

  /* 6 — náhodné operace */
  let sem = 20261110;
  const rnd = () => { sem = (sem + 0x6D2B79F5) | 0; let t = Math.imul(sem ^ (sem >>> 15), 1 | sem); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  let l = G.vychozi(), vid = VSE(G), chyb = 0, prvni = '', klaves = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  for (let i = 0; i < 3000; i++) {
    const op = Math.floor(rnd() * 5), id = pick(G.ID);
    if (op === 0) l = G.presun(l, id, Math.floor(rnd() * 16) - 2, Math.floor(rnd() * 40) - 2, vid);
    else if (op === 1) l = G.zmenVelikost(l, id, Math.floor(rnd() * 16) - 2, Math.floor(rnd() * 30) - 2, vid);
    else if (op === 2) l = G.klavesa(l, id, pick(klaves), rnd() < 0.5, vid);
    else if (op === 3) { vid = new Set(G.ID.filter(() => rnd() < 0.7)); if (!vid.size) vid.add('kdo'); l = G.kompaktuj(l, vid); }
    else l = G.kompaktuj(l, vid);
    const v = vady(G, l, vid);
    if (v.length) { chyb++; if (!prvni) prvni = 'krok ' + i + ' (op ' + op + '): ' + v.join('; ') + ' | ' + pol(l); }
    const opak = G.kompaktuj(l, vid);
    if (pol(opak) !== pol(l)) { chyb++; if (!prvni) prvni = 'neidempotentní v kroku ' + i; }
  }
  f(chyb === 0, 'náhodné operace (3 000 kroků) drží všechny podmínky', prvni);

  /* 7 — ukládání */
  const mnoho = G.presun(G.zmenVelikost(vych, 'kdo', 6, 12, all), 'deje', 1, 1, all);
  const zpet = G.ocisti(G.serializuj(mnoho));
  f(pol(zpet) === pol(G.kompaktuj(mnoho, all)), 'uložit → načíst vrátí totéž rozložení', pol(zpet) + ' ≠ ' + pol(mnoho));
  const text = G.ulozDoTextu(null, G.klicUloziste('c1', 'hodina'), mnoho);
  f(pol(G.nactiUlozene(text, 'c1|hodina')) === pol(zpet), 'z textu v úložišti se rozložení vrátí');
  f(G.nactiUlozene(text, 'c2|hodina') === null, 'jiná třída uložené rozložení nedostane');
  f(G.nactiUlozene(text, 'constructor') === null && G.nactiUlozene(text, '__proto__') === null && G.nactiUlozene(text, 'toString') === null, 'klíče zděděné z Object.prototype se neberou za uložené');
  const text2 = G.ulozDoTextu(text, 'c2|hodina', vych);
  f(G.nactiUlozene(text2, 'c1|hodina') && G.nactiUlozene(text2, 'c2|hodina'), 'uložení druhé třídy nesmaže první');
  const jenC2 = G.smazDoTextu(text2, 'c1|hodina');
  f(G.nactiUlozene(jenC2, 'c1|hodina') === null && G.nactiUlozene(jenC2, 'c2|hodina') !== null, 'obnova výchozího smaže jen svůj klíč');
  let t = null;
  for (let i = 0; i < G.MAX_ULOZENO + 25; i++) t = G.ulozDoTextu(t, 'c' + i + '|hodina', vych);
  const klicu = Object.keys(JSON.parse(t).r);
  f(klicu.length === G.MAX_ULOZENO && klicu.includes('c' + (G.MAX_ULOZENO + 24) + '|hodina') && !klicu.includes('c0|hodina'), 'úložiště drží nejvýš ' + G.MAX_ULOZENO + ' nejnovějších klíčů', String(klicu.length));
  const NEPRATELE = [
    'nejde o JSON', '', '[]', '{}', 'null', '42', '"x"', '{"v":2,"r":{"c1|hodina":{}}}', '{"v":1}', '{"v":1,"r":null}', '{"v":1,"r":[]}',
    '{"v":1,"r":{"c1|hodina":null}}', '{"v":1,"r":{"c1|hodina":"x"}}', '{"v":1,"r":{"c1|hodina":[]}}',
    '{"v":1,"r":{"c1|hodina":{"kdo":"x","trida":[1],"deje":[1,2,3,4,5],"tymy":null}}}',
    '{"v":1,"r":{"c1|hodina":{"kdo":[1e99,-1e99,1e99,1e99],"trida":[0.4,0.6,4.5,7.5],"deje":[null,null,null,null],"tymy":["a","b","c","d"]}}}',
    '{"v":1,"r":{"c1|hodina":{"__proto__":[0,0,1,1],"constructor":[0,0,1,1],"kdo":[-3,-3,-3,-3]}}}',
    '{"v":1,"r":{"c1|hodina":{"kdo":[0,0,12,60],"trida":[0,0,12,60],"deje":[0,0,12,60],"tymy":[0,0,12,60]}}}',
  ];
  let nepratelskeVady = '';
  NEPRATELE.forEach(txt => {
    let r; try { r = G.nactiUlozene(txt, 'c1|hodina'); } catch (e) { nepratelskeVady += ' výjimka:' + txt.slice(0, 30); return; }
    if (r && vady(G, r, all).length) nepratelskeVady += ' vada:' + txt.slice(0, 40) + ' → ' + vady(G, r, all).join(',');
  });
  f(!nepratelskeVady, 'nepřátelský obsah úložiště (' + NEPRATELE.length + ' variant) nikdy nespadne a dá platné rozložení', nepratelskeVady);
  f(G.nactiUlozene(JSON.stringify({ v: 2, r: { 'c1|hodina': G.serializuj(mnoho) } }), 'c1|hodina') === null && G.nactiUlozene(JSON.stringify({ r: { 'c1|hodina': G.serializuj(mnoho) } }), 'c1|hodina') === null, 'jiná nebo chybějící verze formátu se nebere');
  const dedene = Object.create({ kdo: [0, 0, 5, 5] });
  f(pol(G.ocisti(dedene)) === pol(vych), 'zděděné vlastnosti se při čtení ignorují', pol(G.ocisti(dedene)));
  const ocistiProto = G.ocisti(JSON.parse('{"__proto__":[9,9,9,9],"kdo":[0,0,8,17]}'));
  f(({}).x === undefined && vady(G, ocistiProto, all).length === 0, 'podvržený __proto__ nic neznečistí');

  /* 8 — věta pro čtečku */
  const veta = G.popis({ id: 'kdo', x: 0, y: 14, w: 8, h: 17 });
  f(/Kdo hraje/.test(veta) && /sloupec 1 z 12/.test(veta) && /řádek 15/.test(veta) && /šířka 8/.test(veta) && /výška 17/.test(veta), 'věta pro čtečku nese jméno, sloupec, řádek a velikost', veta);

  return bezi.nalez;
}

(function () {
  const G = nacti(ZDROJ);
  bezi(G, 'skutečný', true);
  const ziva = pass + fail;
  ok(ziva >= 63, 'změřeno aspoň 63 kontrol (naměřeno 63)', String(ziva));

  /* sabotáže: každá musí aspoň jednu kontrolu shodit */
  const SAB = [
    ['překryv je povolen', s => s.replace("const prekryv = (a, b) => a.x < b.x + b.w", "const prekryv = (a, b) => false && a.x < b.x + b.w")],
    ['bez gravitace (panel zůstane tam, kam byl pushnutý)', s => s.replace("y = nad.length ? Math.max(...nad) : 0;", "")],
    ['připnutý panel se přizpůsobuje obsahu', s => s.replace("if (p.a === false || !meta(p.id) || !Object.prototype.hasOwnProperty.call(radky || {}, p.id)", "if (!meta(p.id) || !Object.prototype.hasOwnProperty.call(radky || {}, p.id)")],
    ['výška podle obsahu se ukládá jako číslo', s => s.replace("p.a === false ? p.h : 0]; });", "p.h]; });")],
    ['bez nejmenší velikosti', s => s.replace("const w = Math.min(SLOUPCU, Math.max(m.minW, p.w));\n    const h = Math.min(MAX_VYSKA, Math.max(m.minH, p.h));", "const w = Math.min(SLOUPCU, Math.max(1, p.w));\n    const h = Math.min(MAX_VYSKA, Math.max(1, p.h));")],
    ['čtení zděděných vlastností', s => s.replace("(o && typeof o === 'object' && !Array.isArray(o) && Object.prototype.hasOwnProperty.call(o, id)) ? o[id] : undefined", "(o && typeof o === 'object' && !Array.isArray(o)) ? o[id] : undefined")],
    ['svislá šipka jen o řádek', s => s.replace("for (let y = aktualni.y + dy; dy > 0 ? y <= MAX_RADKU : y >= 0; y += dy) {", "for (let y = aktualni.y + dy; dy > 0 ? y <= aktualni.y + 1 : y >= aktualni.y - 1; y += dy) {")],
    ['uložené bez kontroly verze', s => s.replace("if (!o || typeof o !== 'object' || o.v !== 1 || !o.r || typeof o.r !== 'object') return null;", "if (!o || typeof o !== 'object' || !o.r || typeof o.r !== 'object') return null;")],
    ['bez stropu počtu klíčů', s => s.replace(".slice(-(MAX_ULOZENO - 1))", "")],
    ['tažený panel nemá přednost', s => s.replace("((b.p.id === prednost) - (a.p.id === prednost)) || ", "")],
    ['výchozí rozložení s překryvem', s => s.replace("{ id: 'kdo',   nazev: 'Kdo hraje',       x: 0, y: 12, w: 8,  h: 17,", "{ id: 'kdo',   nazev: 'Kdo hraje',       x: 0, y: 12, w: 9,  h: 17,")],
  ];
  let chycenoCelkem = 0;
  for (const [nazev, uprav] of SAB) {
    const novy = uprav(ZDROJ);
    if (novy === ZDROJ) { ok(false, 'sabotáž „' + nazev + '“ se neaplikovala'); continue; }
    let nalez = 0;
    try { bezi(nacti(novy), 'sab', false); nalez = bezi.nalez; } catch (e) { nalez = 1; }
    if (nalez) chycenoCelkem++;
    ok(nalez > 0, 'sabotáž „' + nazev + '“ je chycena', 'nalezeno ' + nalez);
  }
  ok(chycenoCelkem === SAB.length, 'všech ' + SAB.length + ' sabotáží chyceno', String(chycenoCelkem));
  console.log((fail ? '❌ ' : '✅ ') + 'rpg-infocentrum-mrizka: ' + pass + ' ok, ' + fail + ' chyb');
  process.exit(fail ? 1 : 0);
})();
