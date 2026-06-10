/* ══════════════════════════════════════════════════════════════════
   RPG Matematika — SDÍLENÉ FUNKCE (jediný zdroj pravdy pro všechny 4 hry)

   Sem patří funkce, které byly dřív zkopírované v rpg-mat-6/7/8/9.html
   a hrozil jejich drift (oprava v jedné hře, zapomenutá ve třech).
   Načítá se na konci <body> — všechna volání jsou event-driven (boj,
   trénink), takže v době volání už funkce existují.
   ══════════════════════════════════════════════════════════════════ */

/* Kontrola odpovědi žáka proti správnému výsledku.
   Normalizace: bez diakritiky/mezer, "," → ".", Unicode minus (−)
   i en-dash (–) → "-". Zlomky "a/b" se vyhodnotí číselně.
   Tolerance 0.016 ≈ 1/60: pokryje zaokrouhlení na 2 desetinná místa
   i periodické zlomky (1/3, 1/6…). */
function checkAns(raw, correct){
 const norm = s => String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'').replace(/,/g,'.').replace(/[−–]/g,'-');
 const u = norm(raw), c = norm(correct);
 if(u===c) return true;
 const evalS = s => {
 if(/^-?\d+\/-?\d+$/.test(s)){const[a,b]=s.split('/');return parseFloat(a)/parseFloat(b);}
 return parseFloat(s);
 };
 const un=evalS(u), cn=evalS(c);
 if(!isNaN(un)&&!isNaN(cn)) return Math.abs(un-cn)<0.016;
 return false;
}

/* ANO/NE úlohy: místo psaní rovnou dvě tlačítka (boj i trénink).
   submitAnswer/trSubmit jsou definované ve hře — volají se až po kliku. */
function isYN(t){return !!t&&/^(ano|ne)$/i.test(String(t.ans||'').trim());}
function answerYN(v){const i=document.getElementById('bt-ans');if(i.disabled)return;i.value=v;submitAnswer();}
function trAnswerYN(v){const i=document.getElementById('tr-ans');if(i.disabled)return;i.value=v;trSubmit();}
