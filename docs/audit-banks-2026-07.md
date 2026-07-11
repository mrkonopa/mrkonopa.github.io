# Obsahový audit bank příkladů — nálezy a opravy (2026-07)

Audit rozšiřujících bank `projects/rpg-tasks-N.js` (vzorek + LLM agent na ročník
+ ruční ověření). Nástroj: `tools/bank-audit-dump.cjs`. Pozn.: `checkAns`
normalizuje čárku↔tečku a má toleranci 0,016 — desetinná tečka v odpovědi je
proto jen kosmetika, ale **tiché zaokrouhlení** (odpověď 13 místo 12,5) skutečně
označí správného žáka za chybu.

## Ročník 7 (rpg-tasks-7.js)
**Kritické:**
- Mise 5-3: precedence bug `'/('+1-c/100+')'` → hint „NaN) = 1400 Kč"; a single-quote řetězec `'${f}×${e}/100'` unikal doslovně žákovi. (chytily linty)
- Mise 7-3: `ans:\`${b/b===1?1:b}/${b}\`` — `b/b` je vždy 1, odpověď „1/b" místo správné **1**.
- Mise 4-1: `ri(2,3)` volané zvlášť v textu a v odpovědi → počet dětí a počet hochů si neodpovídaly (24 dětí → odpověď 21 místo 14).

**Major:**
- Mise 5-3: „trikot levnější než rifle" s náhodnými cenami → záporné % → zajištěno i<j.
- Mise 4-3: měřítko zobrazeno 1:5000, ale odpověď počítána jako 1:50 (přebytečné ×100) → přepracováno na čisté 1:100.
- Mise 4-2: nepřímá úměrnost vracela nezaokrouhlené floaty (19,333…) → konstrukce s celočíselným výsledkem.
- Mise 4-1: dělení v poměru s nedělitelným celkem (rozdělit 29 na 14,5) → celek = násobek (m+n).

**Minor:** bochníky/cesta s neceločíselnou jednotkou (hint „3·113=338"), litры (`c≠a` + shoda „vymalují"), rozbité slovo „degenero-vaném", tiché zaokrouhlení % v misi 5-2 (doplněno „(zaokrouhli)").

## Ročník 8 (rpg-tasks-8.js)
**Kritické:**
- Mise 2-2: úhlopříčka čtverce počítaná jako √(a²+b²) s cizím `b` → špatná odpověď (čtverec 6×6 → 10 místo 8,49) → √(a²+a²).
- Mise 3-1: `x/d = ${x/d}` s nedělitelným x → zobrazí „5.333333…" → x = násobek d.
- Mise 6-2: „Leží střed Thaletovy kružnice vždy uvnitř trojúhelníku? ANO" — leží NA přeponě → **NE** (hint to i říkal).

**Major:**
- Mise 1-1: „kladný/záporný?" ale odpověď číslo a výsledek vždy kladný → „Vypočítej".
- Mise 1-3: 25 % z 50 = 13 (má být 12,5) → čísla s celočíselným výsledkem.
- Mise 4-3: „Vytkni NSD" vytýkal menší než skutečný gcd → „Vytkni ${g}a"; „které číslo NELZE vytknout" nejednoznačné → „vytkni co největší číslo".

**Minor:** desetinné tečky v zobrazeném textu (x/2=14.5, „16.5", zůstatek 592,8) → celočíselné/čárka; LCD hint (součin místo LCM) + „zkrať" u nekrátitelného.

## Ročník 9 (rpg-tasks-9.js)
**Kritické:** mise 1-2 float „770,0000000001 Kč" v zadání i hintu → `Math.round`.
**Major:** mise 2-3 číslovka „o 3 míst" → `skl(n,'místo','místa','míst')`.
**Minor:** „1x" místo „x" v rovnici; hint „Vytkni x" u (x²−5)/x zavádějící → zobrazit `n·x`; tiché zaokrouhlení % (mise 1-2, 5-2) → „(zaokrouhli)". Float ans na řádku 205 → `Math.round`.
**False positive:** „cyklista 100 km/h" — v misi 5-3 žádný cyklista není (aktér je „Auto/Rychlost", 100 km/h reálné). Zamítnuto.

## Ročník 6 (rpg-tasks-6.js)
**Kritické:** mise 3-3 „NSN(2,2), když jsou nesoudělná" — 2 a 2 nesoudělná nejsou a „jen vynásob" dá 4, ale odpověď 2 → protiřečí si. Nahrazeno pevnou tabulkou nesoudělných dvojic.
**Major:** mise 2-3 „3/8 + 1/8" odpověď 1/2, ale hint „4/8" → hint teď ukáže i zkrácení.
**Minor:** skloňování „N dělitelů" → skl; zdvojené znaménko „x' = −4 = -4"; degenerovaný „2/6 nebo 2/6" (zajištěno a≠b).
**Poznámka (neopraveno, jen diagnostika):** nekonzistentní skill-tagy (průměr [anal] vs [calc]; aritmetika označená [geo] v boss-misi 7-3) — ovlivní jen učitelskou heatmapu, ne správnost.

## Ročník 5 (rpg-tasks-5.js) — 0 matematických chyb
**Major:** mise 4-1 „Drak spí **pětinau** dne" (nominativ+u) → akuzativ „pětinu".
**Minor:** „N dukátů" u 2–4 → skl; „6 dukátu" u celého čísla → „dukátů"; čitelnost seznamu desetinných „2,3, 3,3, 6,7" → oddělovač „;" a „a"; degenerovaný „4/5 nebo 4/5" (a≠b).

## Ročník 4 (rpg-tasks-4.js) — 0 matematických chyb
**Major:** shoda číslovky+slovesa: „3 salv" → „3 salvy"; „se vejde 4 pirátů" → „vejdou se 4 piráti"; „3 ryb" → „vejdou se 3 ryby".

## Ročník 3 (rpg-tasks-3.js)
**Major (M):** trojúhelníkové generátory losovaly strany nezávisle → vznikaly neexistující trojúhelníky (3+8=11, 7+2<12). Přidán pomocník `triSides()` (trojúhelníková nerovnost) a použit v obvodových úlohách; rovnoramenný má základnu < 2·rameno; „dvakrát delší" má třetí stranu v platném rozsahu.
**Major (Č):** shoda slovesa „má 2 pavouci" → „mají"; „mají 9 žab" → „má".
**Minor:** hint „N stovek/desítek" → skl; „Co je delší?" doplněno „Napiš délku té delší v cm".

## Ověření
- `node --check` všech 7 souborů OK.
- `tools/bank-audit-dump.cjs` — linty 0, žádné floaty/tečky v zobrazeném textu.
- `tools/verify-bank.cjs 3–9` — 0 problémů.
- `tests/vstudents-deep.harness.cjs` — všech 7 ročníků bez regresí.

## Zbývá (nižší priorita)
- Čistě stylistické formulace (7/2-3 „kolikrát menší", 7/1-2 popisek „desetinná čísla"); nekonzistentní skill-tagy v 6. ročníku (diagnostika, ne správnost); pestrost mise 8/2-1 = 8 (pre-existující).
- **Teorie** `rpg-learn-3…9.js` — audit ještě neproběhl (další fáze).
