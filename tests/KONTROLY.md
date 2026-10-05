# Kontrolní seznam — co testovat (paměť)

Vznikl 4. 10. 2026 na Vojtův pokyn: *„Pokaždé, když řeknu pokračuj, najdeš něco nového.
Najdi všechny problémy v jednom průchodu, pak je oprav — a příště budeš vědět, co testovat.“*

**Jak ho používat**

1. **Před každou novou prací** najdi níže sloupec (místo), kterého se změna týká, a projdi
   VŠECHNY řádky (druhy vad). Kde je test, spusť ho; kde je „—“, kontrolu dopiš dřív, než
   prohlásíš hotovo.
2. **Nové místo** (nová obrazovka, generátor, kresba, interaktivní prvek) = nový sloupec.
   Projdi všechny řádky a do tabulky ho zapiš.
3. **Nový druh vady** = nový řádek: pravidlo, odkud se vzal (konkrétní nález s čísly),
   který test ho hlídá a na kterých místech. Zapiš ho HNED, ne až „na konci“.
4. Každá nová kontrola se ověří **sabotáží** (a `grep -c`, že se sabotáž opravdu aplikovala)
   a musí **počítat, kolik toho viděla** (žádné „0 nálezů“ z prázdného běhu).

## Místa (sloupce matice)

| kód | místo | soubory |
|---|---|---|
| **Rb** | RPG banky úloh 3.–9. (šablony v `AREAS` + `rpg-tasks-N.js`) | obsah úloh, nápovědy, `svg`, MC volby |
| **Rh** | RPG boj / trénink / věž (obrazovky) | `rpg-mat-N.html` |
| **Rt** | RPG teorie + „Najdi chybu“ (`mistakes`) | `rpg-learn-N.js`, `rpg-learn-svg.js` |
| **Rs** | RPG živý souboj (banky otázek) | `rpg-battle-N.js`, `rpg-battle-ui.js` |
| **Rm** | RPG minihry (spojovačka, řazení) | `rpg-tasktypes.js` |
| **Pb** | přijímačky — banka testu nanečisto (16 pozic) | `rpg-cermat-9.js` |
| **Pg** | přijímačky — „základ“ (`PZ_GEN`) | `prijimacky-gen.js` |
| **Pn** | přijímačky — nápovědy (`PZ.hintsFor`) | `prijimacky-core.js` |
| **Pt** | přijímačky — obrazovky testu, procvičování, diagnostiky, statistik | `test.html`, `procvicovani.html`, `diagnostika.html`, `statistiky.html` |
| **Pk** | přijímačky — konstrukce (úlohy, okno, rozbor) | `konstrukce*.js`, `konstrukce.html` |
| **Pd** | přijímačky — doplňky k řešením (SVG, GeoGebra) | `doplnky.html` |

## Druhy vad (řádky matice)

Zkratky testů jsou názvy souborů v `tests/` bez přípony. „—“ = nehlídá nic (mezera),
„n/a“ = na tom místě nedává smysl (s důvodem).

### A. Matematická správnost

| # | pravidlo | odkud (nález) | Rb | Rt | Rs | Rm | Pb | Pg | Pn | Pk | Pd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | odpověď = nezávislý dopočet ze ZNĚNÍ zadání | obvod obdélníku 8/7-2 špatně ve 100 %; „větší z čísel“ 9. roč.; úměry v živém souboji g8; „Zkrať zlomek“ 7. roč., „5x + 3 = 5x + 3“ 8. roč. | rpg-content-quality, rpg-aritmetika | n/a (zamítnuto: text nejde parsovat, 7 planých poplachů) | rpg-battle-questions + souboj-dopocet (99–100 % otázek) | — | prijimacky-dopocet, prijimacky-zadani | prijimacky-gen | n/a | konstrukce-ulohy | prijimacky-doplnky (geometrie SVG) |
| A2 | každá rovnost v nápovědě / postupu platí | 67 700 rovností v RPG; „Záhon“ 60 vs 61 rostlin | rpg-content-quality | n/a (zamítnuto) | — | — | prijimacky-dopocet | prijimacky-postupy | — | n/a | — |
| A3 | poslední krok / L3 nápověda dá `ans` | goniometrie „≈ 15“ místo 14 | rpg-content-quality (úzká varianta) | n/a | n/a | n/a | prijimacky-dopocet | prijimacky-postupy | prijimacky-hints? | n/a | n/a |
| A4 | trojúhelník jde sestrojit | 5 generátorů ve 3., 6., 7. roč.; souboj 3. roč. 37 % | rpg-content-quality (`trojuhelniky.cjs`) | — | rpg-battle-questions | n/a | prijimacky-cermat-audit | — | n/a | konstrukce-ulohy | n/a |
| A5 | MC: právě jedna správná volba, „Jiný…“ nikdy správně, uzavřený výběr jen ze dvou; minihra: hodnota jen jednou a řazení podle hodnoty | „503, nebo 744?“ se 4 volbami; řazení zlomků podle čitatele | rpg-distractors, rpg-mc-volby | n/a | rpg-battle-questions | rpg-minihry | prijimacky-dopocet A4 | prijimacky-gen | n/a | n/a | n/a |
| A6 | generátor nezamrzne (každý `while` přelosuje vše, co čte) | gen14f 1 : 38 416 | audity (timeout) | n/a | — | — | prijimacky-dopocet (počet losů) | — | n/a | konstrukce-ulohy | n/a |
| A7 | kontrola odpovědi uzná všechny správné zápisy | záloha `checkAns` přísnější; výrazy „4/3 p“ | rpg-answer-parity | n/a | — | — | prijimacky-kontrola | prijimacky-kontrola | n/a | n/a | n/a |

### B. Zápis a jazyk

| # | pravidlo | odkud (nález) | Rb | Rt | Rs | Rm | Pb | Pg | Pn | Pk | Pd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B1 | desetinná ČÁRKA v zadání, volbách, nápovědě, výsledku | g8 bez `cz()`; volby „3.4“ v živém souboji; spojovačka „4.8“ | rpg-content-quality | — | rpg-battle-questions | rpg-minihry | prijimacky-cermat-audit | prijimacky-postupy | — | — | prijimacky-doplnky |
| B2 | diskrétní jednotky `ceil`, periodické `≈`, žádné `5,1000000000000005` | kohoutí úlohy g7 72 %; distraktory `3.1999999999999997` | rpg-content-quality | — | rpg-battle-questions | — | prijimacky-cermat-audit | prijimacky-gen | — | — | — |
| B3 | skloňování (1 / 2–4 / 5+ OBOUSMĚRNĚ, předložky, shoda podmětu s přísudkem, `\b` za č. písmeny) | „3 otoček“, „4 dělníků vykope“, 9 ze 13 slepých tvarů | rpg-declension-all, rpg-content-quality | rpg-declension-all | rpg-declension | — | prijimacky-cermat-audit | prijimacky-gen | — | — | — |
| B4 | záporná čísla: v závorce za operátorem, znak „−“ (při zobrazení), ve 3.–6. roč. vůbec (kromě 6/5-2); mocnina horním indexem | „zaplatíš dvoustovkou“ → −15 Kč; souboj 6. roč. celé téma; „2^5“ | rpg-content-quality, rpg-zapis | — | rpg-battle-questions | rpg-minihry | prijimacky-dopocet | prijimacky-postupy | — | n/a | — |
| B5 | žádné `NaN` / `undefined` / `[object Object]` / prázdná či duplicitní nápověda | `_fc()` 56 % „[object Object]“ | rpg-content-quality, rpg-tasks-N.audit | rpg-learn | rpg-battle-questions | rpg-battle-minigame? | prijimacky-cermat-audit | prijimacky-postupy | prijimacky-hints | konstrukce-ulohy | — |

### C. Obrázky (SVG, interaktivní kresby)

| # | pravidlo | odkud (nález) | Rb | Rt | Pb | Pg | Pk | Pd |
|---|---|---|---|---|---|---|---|---|
| C1 | kresba odpovídá zadání (poměr stran, obdélník ≠ čtverec, kvádr: výška ze zadání u svislé hrany, rovnoramenný se základnou dole) | „Akvárium“ výška na dně; rovnoběžník s výškou místo strany | rpg-diagramy-geometrie §8, rpg-obrazky | — | rpg-diagramy-geometrie (Akvárium), prijimacky-cermat-audit | prijimacky-obrazky | konstrukce-ulohy | prijimacky-doplnky |
| C2 | obrázek NEPROZRADÍ výsledek (výjimka: zadání říká „vyznačeny v obrázku“) | kvádr 7/7-2 65–78 %, šipka na ose 9/1-3; pozice 16 při k = 2 | rpg-obrazky | n/a | prijimacky-obrazky | prijimacky-obrazky | n/a | n/a |
| C3 | popisky: nepřekrývají se, NEKŘÍŽÍ čáru, nejsou uříznuté, nejsou daleko od svého oblouku — měřidlo `tests/popisky-mer.cjs` | 222 popisků přes čáru; radar 12 × 12,7 px; výklad 31; konstrukce 711; doplňky 7; hranol „15 cm“ za plátnem | rpg-diagramy-geometrie §6b §8 §9 (+ ořez) | rpg-learn-diagramy 1e–1e3 (3.–9.) | rpg-diagramy-geometrie §9 | rpg-diagramy-geometrie §9 | konstrukce (≤ 2 %, obtažení), prijimacky-test (popisek 1× na bod) | rpg-diagramy-geometrie §9 |
| C4 | oblouk úhlu na správné straně (sweep se počítá) | 48 oblouků mimo kružnici | rpg-diagramy-geometrie | — | rpg-diagramy-geometrie (pozice 7) | — | n/a | — |
| C5 | barvy světlého motivu: každá barva v mapě, popisek ≥ 4,5 : 1 | `#cfe8ff` popisky 1,3 : 1 | n/a | n/a | rpg-diagramy-geometrie | rpg-diagramy-geometrie | n/a | — |
| C6 | kopie kreseb (6.–8. roč.) shodné s jádrem | 35 kopií | rpg-diagramy-geometrie | n/a | n/a | n/a | n/a | n/a |
| C7 | obrázek je VIDĚT všude, kde se úloha ukazuje (boj, trénink, věž, rozbor) | trénink 3.–7. bez obrázku | rpg-obrazky-zobrazeni | — | prijimacky-test | prijimacky-diagnostika | konstrukce | n/a |
| C8 | pokrytí obrázkem nad podlahou (ztráta při přemapování klíčů) | `tasks.push({text,ans…})` bez `svg` | rpg-obrazky (po ročnících) | rpg-learn-diagramy | prijimacky-cermat-audit | prijimacky-obrazky | n/a | n/a |
| C9 | interaktivní kresba: tvary viditelné (barvy), měřítko os 1 : 1, obnovení stavu | GeoGebra: `SetColor(…,26,115,200)` = bílá, ⟳ smaže konstrukci | n/a | n/a | n/a | n/a | konstrukce (okno) | prijimacky-doplnky + `tools/ggb-overeni.cjs` |

### D. Rozvržení a ovládání (Rh, Pt, Pk + ostatní stránky)

| # | pravidlo | odkud (nález) | hlídá |
|---|---|---|---|
| D1 | nic nepřetéká ani se neořízne na 360–380 px, na VŠECH obrazovkách (průchody, ne jen úvod) | konec diagnostiky +34 px; `flex:1` bez `min-width:0` | layout-overflow (průchody unikovka, gonio, cesta, pz-diag, pz-stat, pz-test, pz-konstr, RPG obrazovky) |
| D2 | tablet na šířku: vstup vidět, není za lištou, začátek úlohy vidět — **i po „Další“ z místa, kde žák klikl** | vstup za lištou 136×; začátek nad okrajem až 568 px; trénink 5–15 px | tablet-landscape (RPG od horního okraje I realisticky: trénink, boj, věž), prijimacky-tablet (přijímačky, realisticky) |
| D3 | dotykové plochy, popisky polí, `<h1>`, kontrast textu ≥ 4,5 : 1 | 429 míst pod prahem; 7 z 8 únikovek; vnitřní obrazovky 24 skupin + 25 polí | kontrast.audit a a11y.audit (úvodní + 69 vnitřních obrazovek, `vnitrni-obrazovky.cjs`), mobile.audit (úvodní) |
| D4 | reduced-motion zastaví VŠECHNY animace (hrdina, parťák, boss, částice) | VFX toggle zastavil jen bosse | vstudents-deep, rpg-sprite-golden |
| D5 | fokus bez centrování (`preventScroll`), ovládání klávesnicí; **posun nesmí záviset na tom, jestli prvek fokus už měl** (druhé `focus()` nic neposune) | trénink na iPadu −13 px; boj 29 px za lištou 1 běh z 5 (#34) | tablet-landscape, rpg-keys |
| D6 | seznam stránek = skutečné soubory; testy v bráně; testy s ročníkem v `PARAM` | 4× rozejitý seznam; 7 testů mimo bránu; 2 hostile testy jen pro 9. roč. | stranky-uplnost, brana-uplnost (§6 PARAM) |

### E. Bezpečnost a cloud

| # | pravidlo | hlídá |
|---|---|---|
| E1 | vše od žáka přes `esc()` (i `'`), DOM místo `onclick`-řetězců, čísla ze save `|0` | rpg-hack, rpg-1stupen-hostile, prijimacky-hostile, csv-injection |
| E2 | SQL: žádný slepý cast žákovského JSONu, `my_role()` nikdy NULL, RLS funkce s právem `authenticated` | sql-* (PostgreSQL naostro) |

## Velký průchod — deník (od 4. 10. 2026)

Postup: (1) brána bez prohlížeče, (2) prohlížečová brána, (3) sondy na každou „—“ v matici,
(4) všechny nálezy sem, BEZ průběžného opravování, (5) opravy po příčinách + test do každé
mezery, (6) brána znovu.

### Plán oprav (po příčinách, ne po nálezech)

| skupina | nálezy | oprava | hlídání |
|---|---|---|---|
| A — banky živého souboje | 6, 10, 11, 15, 16, 17, 18, 19 | generátory: vedlejší úhel místo záporných čísel (6. roč.), trojúhelník ze sestrojitelných stran, obdélník a ≠ b, „ptáci“, „:“, „2 − 3“, „4x − 1“, horní index | `rpg-battle-questions`: pravidla obsahu z RPG (A4, C1-obdélník, B4, spojovník, ÷, ^, slovník) + dopočet VŠECH tvarů zadání |
| B — jeden formátovač zobrazení RPG | 7, 19 | `czTxt`/`czMC` v `rpg-shared.js` převedou i spojovník na minus a `a^b` na horní index; použít všude, kde text úlohy jde do DOM (boj, trénink, věž, MC, nápovědy, hláška, minihry) | test vykreslí úlohy se spojovníkem a stříškou a čte DOM |
| C — minihry | 4, 5 | parser hodnoty (zlomky, smíšená čísla, mezery v tisících), páry jedinečné podle HODNOTY, zobrazení přes formátovač | nový `rpg-minihry.test.cjs` nad bankami všech 7 ročníků |
| D — přijímačky | 8, 9, 12 | pozice 16 bez k = 2; nápověda L2 = první krok postupu (když neprozradí výsledek); jedno `PZ.odpovedText` (ANO/NE, celé znění volby) pro procvičování, nápovědy i diagnostiku | `prijimacky-cermat-audit` (C2 s výjimkou „vyznačeny v obrázku“), `prijimacky-hints`, `prijimacky-procvicovani` |
| E — brána | 14 | `PARAM` pro oba hostile testy (ověřit na ročníku z každého stupně) | `brana-uplnost`: „bere ročník argumentem ⇒ je v PARAM“ |
| F — rozvržení vnitřních obrazovek | 3, 13 + sondy | podle výsledků prohlížečových sond | realistické `tablet-landscape`, audity na vnitřních obrazovkách |
| G — banka 3. roč. | 16 | „Strom má 4 větve, na každé sedí 3 ptáci.“ (bez „z 4“ a „3 ptáků“) | slovník skloňování |
| H — trénink RPG | 3, 23 | sdílená `ukazUlohu(začátek, cíl)` v `rpg-shared.js` (týž algoritmus jako `PZ.ukaz`) místo `scrollIntoView({block:'nearest'})` ve všech 7 hrách | `tablet-landscape`: průchod tréninkem realisticky (DALŠÍ ÚKOL z místa, kde žák je) |
| I — popisky v kresbách | 24, 25, 26, 27 | teorie a doplňky ručně (posun do volného místa); konstrukce: popisek bodu do největšího volného směru (jako `volnyUhel` v testu nanečisto) | měřidlo čáry přes popisek ze `rpg-diagramy-geometrie` §9 → sdílený modul; teorie 3.–9., doplňky, snímky konstrukcí |
| J — přístupnost vnitřních obrazovek | 13, 28, 29, 30 | tokeny barev (1. stupeň `--red-t` v hláškách, odkaz videa, „Časté chyby“, věž v 8. roč., profil/obchod), `aria-label` u polí, odkaz 14 px | `kontrast.audit` a `a11y.audit` s průchody vnitřními obrazovkami (jako `layout-overflow`) |

### Nálezy

| # | místo | nález | stav |
|---|---|---|---|
| 1 | Pd | GeoGebra: tvary a Thaletova kružnice bílé (`SetColor` 0–255 místo 0–1), osy s různým měřítkem (elipsa), ⟳ maže konstrukci, panel algebry přes třetinu šířky | ✅ opraveno (31477d0), test + `tools/ggb-overeni.cjs` |
| 2 | Pt Pk | po „Další“ začátek nové úlohy nad okrajem (procvičování až 568 px, diagnostika, konstrukce 49–126 px), hláška po vyhodnocení konstrukce pod okrajem | ✅ opraveno (008ca77), prijimacky-tablet |
| 3 | Rh | totéž v RPG? `tablet-landscape` měří trénink, věž i boj vždy od horního okraje (`scrollTo(0,0)`), ne z místa, kde žák kliká na DÁLE | ✅ změřeno (#23), opraveno, `tablet-landscape` realisticky: trénink, boj i věž |
| 4 | Rm | **řazení v minihrách řadí zlomky podle čitatele**: `parseFloat("1/3")` = 1, `parseFloat("1 500")` = 1 — 561 z 20 276 způsobilých úloh (6/2-3 „1/6 + 1/6 =“ → hra 1, správně 0,33); dítě, které počítá správně, dostane „špatně“ | ✅ `hodnota()` v `rpg-tasktypes.js`, `rpg-minihry` |
| 5 | Rm | spojovačka: výsledek s desetinnou TEČKOU (1 021 z 44 753), spojovník místo minus (1 824), a tatáž hodnota dvojím zápisem v jedné hře („3.2“ × „3,2“, 445) — párování pak rozhoduje zápis, ne výpočet | ✅ jedinečnost podle hodnoty, zápis přes `czMC`, `rpg-minihry` |
| 6 | Rs | živý souboj 6. ročníku má celé téma „záporná čísla“ („Které číslo je větší? -5 nebo 2“, 253 zadání, 482 záporných voleb) — celá čísla se učí až v 7. ročníku, pravidlo B4 | ✅ téma nahrazeno vedlejšími úhly, `rpg-battle-questions` (B4) |
| 7 | Rb Rs | spojovník „-“ místo minus „−“: zadání bank 6.–9. roč. 60 / 627 / 615 / 531, nápovědy 400 / 731 / 631 / 158, odpovědi „-n“ 140 / 883 / 239 / 410, živý souboj stovky; `czMC` ho nepřevádí | ✅ `zapis()` při zobrazení (`rpg-shared.js`, banky souboje), `rpg-zapis` |
| 8 | Pb | „Čtverce z obdélníků“ (pozice 16): obrázek vždy popisuje stranu 2. čtverce a 16.1 se při k = 2 ptá právě na ni (~14 % losů varianty) | ✅ k ≠ 2, `prijimacky-obrazky` (C2 nad bankou testu) |
| 9 | Pn | nápovědy v procvičování přijímaček jsou obecné (L1/L2 podle okruhu nebo typu úlohy, žádný generátor nedává vlastní) — v RPG jsou k úloze | ✅ L2 = první krok postupu (98,7 % úloh), `prijimacky-hints` |
| 10 | Rs | živý souboj 3. ročníku: „Obvod trojúhelníku se stranami 2, 7, 3 cm?“ — 84 z 225 trojúhelníků (37 %) nejde sestrojit; strany se losují nezávisle (A4 tu nikdo nehlídal) | ✅ třetí strana z nerovnosti, `rpg-battle-questions` (A4) |
| 11 | Rs | živý souboj 3.–6. ročníku: „obdélník“ se stejnými stranami („Obvod obdélníku 5 cm a 5 cm?“, „Obdélník: a = 8 cm, b = 8 cm“) — 24/268, 39/505, 31/531, 35/533 | ✅ a ≠ b, `rpg-battle-questions` |
| 12 | Pn Pt | procvičování: u úloh ANO/NE (28 z 3 000 losů) ukazuje nápověda L3 „Výsledek: N“ a hláška „Správná odpověď: N“, přestože tlačítka jsou ANO/NE; u výběru jen písmeno („D“) bez znění volby | ✅ `PZ.odpovedText` (procvičování, nápovědy, diagnostika), `prijimacky-hints` |
| 13 | D3 | kontrast, přístupná jména a dotykové plochy se měří **jen na úvodní obrazovce** stránek — boj, trénink, věž, teorie, profil, obchod, běžící test a rozbor, konec diagnostiky nikdo neměřil | ✅ `kontrast.audit` a `a11y.audit` procházejí 69 vnitřních obrazovek (`tests/vnitrni-obrazovky.cjs`) |
| 14 | D6 | `rpg-newfeatures-hostile` a `rpg-sponka-hostile` berou ročník argumentem (výchozí 9), ale nejsou v `PARAM` → brána je pouští jen pro 9. ročník; sponka, „Najdi chybu“, klávesy a tutoriál přitom běží ve všech 3.–9. A kontrola „argument ročníku ⇒ v PARAM“ není v `brana-uplnost` | ✅ v `PARAM`, `brana-uplnost` §6 |
| 15 | Rs | dopočet odpovědí živého souboje ze ZNĚNÍ kryje jen 3 vzory úměry; obecný dopočet výrazu zvládne 6–32 % otázek ročníku (všechny sedí), zbytek (slovní úlohy, jednotky, obvody, procenta, rovnice, funkce, posloupnosti…) nikdo nepřepočítal — přitom právě tady se schovala úměra v 8. roč. | ✅ `tests/souboj-dopocet.cjs`, pokrytí 99–100 % ročníku |
| 16 | Rs | „Na každé z 6 větví sedí 2 ptáků“ (3. roč., 54 z 7 200) — `rpg-declension` slovo „pták“ nezná | ✅ souboj i banka 3. roč., slovník `rpg-declension-all` (+ pojistka načtení zdrojů) |
| 17 | Rs | dělení „135 ÷ 5“ místo české dvojtečky „135 : 5“ (6. roč., 361 otázek; jinde se ÷ nevyskytuje) | ✅ `rpg-battle-questions` |
| 18 | Rs | „Kolik je: (2) − 3“ — kladné číslo v závorce (7. roč., 132); „4x + -1“ — záporné číslo za operátorem bez závorky (8. roč.) | ✅ `rpg-battle-questions` |
| 19 | Rs Rb | mocnina se stříškou „3^5 · 3^2 = 3^?“, „10^3“, „Vypočítej: 2^3 =“ — živý souboj 8./9. roč. ~360× každý, banky RPG 8. roč. 30×, 9. roč. 405×; ve škole se píše 2³ | ✅ horní index při zobrazení (souboj i RPG), `rpg-zapis` |
| 20 | Rs | **7. roč. „Zkrať zlomek: 18/36. Napiš výsledný ČITATEL.“ čeká 3, správně 1** — losuje se a/b, který sám nemusí být v základním tvaru (2/4 × 3 = 6/12 → hra 2, správně 1); 71 z 4 800. Kdo zkrátí úplně, má „špatně“. Našel to až dopočet všech tvarů (#15) | ✅ a, b nesoudělná + „na základní tvar“ |
| 21 | Rs | **8. roč. „Vyřeš: 5x + 3 = 5x + 3“ čeká 8** — rovnici splní každé x; komentář říká „a > b“, kód to nevynucuje: a = b dá identitu (67 z 4 800), a < b dá „4x + -1“ | ✅ a > b |
| 22 | Rs | **3. roč. „Které číslo je větší? 337 nebo 337“ čeká 338** (při a = b se počítá a + 1); a uzavřený výběr „926, nebo 850?“ nabízí čtyři volby s cizími čísly 840 a 1 026 (627×) — v RPG se tohle opravilo přes `mc_opts`, souboj vykreslí libovolný počet voleb | ✅ „Které z těchto čísel je největší/nejmenší?“ — volby jsou ta čísla |
| 23 | Rh | realisticky po „DALŠÍ ÚKOL“ (žák klikne tam, kde je): trénink na iPadu 10,2" s klávesnicí — začátek úlohy 5–15 px nad okrajem (3. roč. 4/5, 6. a 8. roč. 2/5); boj a věž na tabletech 0 z 324; telefon na šířku mimo cíl (`_sonda-rpg-dale`). Odpovídá #3 | ✅ `ukazUlohu` v `rpg-shared.js`, sabotáž chycena (11 px) |
| 24 | Rt | teorie 3.–9. roč.: čára přes popisek ve 31 popiscích 17 kreseb (ručička přes „12“/„3“ na ciferníku, „B[5; 2]“ na mřížce, „8“ na čáře průměru, „× 100“ na oblouku, číslice na hraně pásu, „přímý“ přes oblouk, „α + β + γ = 180°“ přes stranu, „tětiva“ přes kružnici, „2πr“ na hraně, „y = 2x + 1“ přes přímku, „s“ na plášti kužele…); `rpg-learn-diagramy` měří jen překryv popisků 3.–5. roč. | ✅ 0 ve všech 7 ročnících, `rpg-learn-diagramy` 1e3 (sdílené měřidlo `tests/popisky-mer.cjs`) |
| 25 | Rt | 8/2-3 „Žebřík opřený o zeď“: popisek „(zeď)“ stojí u paty žebříku na ZEMI, zeď je svislá čára vlevo | ✅ „(zeď)“ u zdi |
| 26 | Pk | snímky konstrukcí (rozbor testu, vzorové řešení): popisek bodu přes čáru 711× ve 240 snímcích, všech 40 typů; 5× popisek přes popisek („p“ × „q“, „T“ × „M“, „k“ × „K“, „p“ × „C“) — popisky se kladou pevným posunem, ne do volného místa | ✅ rozmístění popisků (711 → 6–11, 0,4–0,7 %) + bílé obtažení, `konstrukce` (≤ 2 %) |
| 27 | Pd | doplňky: 7 popisků přes čáru („S“ na úhlopříčce, „X“, „P“ na přímce, „A“, „C“, „D₁“, „B₂“) | ✅ 0, `rpg-diagramy-geometrie` §9 (zdroj „doplnky“) |
| 28 | D3 | kontrast pod 4,5 : 1 na VNITŘNÍCH obrazovkách (24 skupin): odkaz na video v teorii 1. stupně 2,79–3,35; hláška „✗ ŠPATNĚ“ v boji/tréninku 1. stupně 3,49–3,71; „⚠️ Časté chyby“ a chybné řádky 3,82–4,3 (3., 4., 6. roč.); „VĚŽ LEGEND“ v 8. roč. 3,28; profil/obchod 4,43–4,46 (3., 6. roč.); nápověda 3/3 v konstrukcích 4,47 | ✅ tokeny (`--red-t`, `--purple-t`, `--muted`), 0 na 44 stránkách + 69 obrazovkách |
| 29 | D3 | pole odpovědí bez přístupného názvu: test nanečisto (`cm-p-*`, 21 polí, `cm-match-*`), diagnostika `#dg-input`, procvičování `#pr-input` — a11y audit vidí jen úvodní obrazovku | ✅ `aria-label`, `a11y.audit` na vnitřních obrazovkách |
| 30 | D3 | dotykové plochy na vnitřních obrazovkách RPG 26–33 px (lišta HUB/PROFIL/ÚTĚK/NÁPOVĚDA, záložky obchodu, „📖 Teorie“), odkaz na HUB v profilu 14 px — WCAG 2.2 AA (24 px) splněno kromě odkazu 14 px; repo práh 40 px platí pro telefon | 🟡 odkaz na HUB 14 → 40 px (všech 7 her); lišta 31–33 px ponechána — rozhodnutí pro Vojtu |
| 31 | Pg | hranol v „základu“ (`svgHranol3`): popisek výšky „15 cm“ za pravým okrajem plátna — našlo až sdílené měřidlo (ořez), §9 ořez dřív neměřil | ✅ plátno podle popisku, §9 hlídá ořez |
| 32 | Rt | tři kresby výkladu tvrdily jinou geometrii, než kreslily: 6/4-2 oblouky vrcholových úhlů vedly z vodorovného do svislého směru PŘES přímku (ne od ramene k rameni); 8/5-1 „tětiva“ končila uvnitř kruhu; 8/? Thaletova kružnice měla značku pravého úhlu otočenou o −30° mimo ramena | ✅ překresleno (oblouk od ramene k rameni, sweep spočítán) — strojově hlídané jen popisky, ne tvar (viz C1) |
| 33 | Pt | štítky nápověd v procvičování: L3 „Výsledek“ oranžová na světle oranžové **2,39 : 1**, L2 4,49 — audit je neviděl, protože krok „po chybě + nápověda“ nejdřív odpověděl a `prHint()` po odpovědi nic neukáže | ✅ barvy; krok audit rozdělen (nápovědy PŘED odpovědí) |
| 34 | Rh | boj na iPadu s klávesnicí (7. roč., 6-3): vstup 29 px ZA lištou, ale jen asi 1 běh z 5 — `focus()` na vstup, který fokus už má, sloupcem nepohne, a zda ho měl, záleželo na losu první úlohy boje | ✅ `fokusVstup` v `rpg-shared.js` (fokus bez rolování + nejmenší posun řádku), test vždy prochází cestou „fokus už má“ — sabotáž spadne pokaždé |
| — | Rh | věž a boj na tabletech po „DÁLE“: 0 nálezů z 324 měření | ✅ |
| — | Pd | rovnosti v textu doplňků (7) platí | ✅ |
| — | Rb | skeny z CLAUDE.md: funkce mezi ročníky (rozdíly jen kresby a 1./2. stupeň), pomocníci `gcd`/`shuffleArr`/`countDiv` významově shodní, neuzavřená pole 0, `\b` za č. písmenem 0; mrtvý kód jen `countDiv` (3., 4., 5., 7.) a kopie `svgAngle` (7.) — neškodí | ✅ / úklid volitelný |
| — | Pg | „základ“ nemá trojúhelník zadaný třemi stranami (jen odvěsny, úhly, podstava hranolu) → A4 n/a; generátory nejvýš 191 losů na úlohu → nezamrzá | ✅ |
| — | Pb | pozice 7 „Přímky jedním bodem“: α = zadaný úhel 25° ze 100 % — NENÍ vada, úhly jsou zadané obrázkem („vyznačeny v obrázku“) a rovnost je smyslem úlohy | ✅ planý poplach, pravidlo C2 musí brát popisky jako zadání, když to intro říká |
| — | Rt Pd | „√5 = 2,2360679…“, „0,0000045“, čísla úloh „6.2“ v doplňcích, výklad číselných oborů „−3 ∈ Z“ v 6/1-1 | ✅ plané poplachy (záměr) |
