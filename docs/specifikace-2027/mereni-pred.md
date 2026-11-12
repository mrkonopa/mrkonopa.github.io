# Měření před úpravou (specifikace CERMAT 2026/2027)

Změřeno z kódu větve `spec-2027` před první úpravou: `projects/rpg-cermat-9.js` (SLOTS), `prijimacky-gen.js` (PZ_GEN) a `konstrukce-ulohy.js` (PZ_KONSTRUKCE). Varianty jsou počítány ze skutečného pole `SLOTS`, ne ze zdrojového textu, a každá vygenerována 400× (0 výjimek).

Bod: a) rozklad podle vzorců · b) pravidla odmocňování zlomku a součinu · c) NSN/NSD tří čísel · d) tečna / kružnice opsaná trojúhelníku / Thaletova kružnice v konstrukci · e) objem a povrch válce · f) koule · g) „dosazovací/sčítací metodou“ · h) přehled vzorců.

## 1. Banka testu nanečisto (`rpg-cermat-9.js`) podle pozic

| Poz. | Variant | Okruhy „základu“ (`prijimacky-topics.js`) | Pod body a–h |
|---|---|---|---|
| 1 | 11 | vyrazy-mocniny, zlomky, pomer, slovni | gen1 (b? SPORNÉ) |
| 2 | 6 | zlomky | — |
| 3 | 6 | vyrazy-promenna | gen3 (a UPRAVIT); gen3d (a UPRAVIT); gen3f (a UPRAVIT) |
| 4 | 5 | rovnice | gen4e (g UPRAVIT); gen4g (g UPRAVIT) |
| 5 | 8 | pomer, slovni, geometrie | — |
| 6 | 8 | slovni, geometrie, telesa | gen6 (e? SPORNÉ); gen6d (e VYPUSTIT); gen6f (e? SPORNÉ) |
| 7 | 6 | geometrie, telesa, data | gen7e (d? SPORNÉ) |
| 8 | 8 | geometrie | — |
| 9 | 5 (+ konstrukce, viz 3) | geometrie | gen9g (d? SPORNÉ) |
| 10 | 5 (+ konstrukce, viz 3) | pomer, geometrie | gen10g (d? SPORNÉ) |
| 11 | 9 | pomer, geometrie, telesa, data | — |
| 12 | 8 | pomer, geometrie, telesa | gen12j (e VYPUSTIT) |
| 13 | 13 | procenta, pomer, slovni, geometrie, telesa | gen12e (e VYPUSTIT) |
| 14 | 6 | rovnice, data | — |
| 15 | 7 | procenta | — |
| 16 | 11 | slovni, geometrie | — |
| **Σ** | **122** | | |

### Všechny varianty testu

| Poz. | Funkce | Název úlohy | Bod | Stav | Poznámka |
|---|---|---|---|---|---|
| 1 | gen1 | Číselný výraz | b? | SPORNÉ | druhá odmocnina ze součinu čísel – počítá se po vynásobení, ne pravidlem √a·√b |
| 1 | gen1b | Číselný výraz |  | — |  |
| 1 | gen1c | Číselný výraz |  | — |  |
| 1 | gen1d | Číselný výraz |  | — |  |
| 1 | gen1e | Číselný výraz |  | — |  |
| 1 | gen1f | Číselný výraz |  | — |  |
| 1 | gen1g | Číselný výraz |  | — |  |
| 1 | gen1h | Číselný výraz |  | — |  |
| 1 | gen1i | Číselný výraz |  | — |  |
| 1 | gen1j | Číselný výraz |  | — |  |
| 1 | gen1k | Číselný výraz |  | — |  |
| 2 | gen2 | Výrazy se zlomky |  | — |  |
| 2 | gen2b | Výrazy se zlomky |  | — |  |
| 2 | gen2c | Výrazy se zlomky |  | — |  |
| 2 | gen2d | Výrazy se zlomky |  | — |  |
| 2 | gen2e | Výrazy se zlomky |  | — |  |
| 2 | gen2f | Výrazy se zlomky |  | — |  |
| 3 | gen3 | Algebraické výrazy | a | UPRAVIT | část 3.3 = rozklad podle vzorce (x − ?)² → rozklad vytýkáním |
| 3 | gen3b | Algebraické výrazy |  | — |  |
| 3 | gen3c | Algebraické výrazy |  | — |  |
| 3 | gen3d | Vzorce a vytýkání | a | UPRAVIT | část 3.3 = rozklad podle vzorce a² − b² → rozklad vytýkáním |
| 3 | gen3e | Úpravy výrazů |  | — |  |
| 3 | gen3f | Rozklad podle vzorce | a | UPRAVIT | část 3.3 = rozklad podle vzorce, název „Rozklad podle vzorce“ |
| 4 | gen4 | Rovnice |  | — |  |
| 4 | gen4d | Rovnice se zlomky |  | — |  |
| 4 | gen4e | Rovnice a soustava | g | UPRAVIT | v řešení „dosazovací metodou“ |
| 4 | gen4f | Rovnice |  | — |  |
| 4 | gen4g | Rovnice a soustava | g | UPRAVIT | v řešení „sčítací metodou“ |
| 5 | gen5 | Pozemek |  | — |  |
| 5 | gen5b | Zahrada |  | — |  |
| 5 | gen5d | Salát podle receptu |  | — |  |
| 5 | gen5e | Dva běžci |  | — |  |
| 5 | gen5f | Sázení stromů |  | — |  |
| 5 | gen5g | Zásoby expedice |  | — |  |
| 5 | gen5h | Fitcentrum |  | — |  |
| 5 | gen5i | Čaj a punč |  | — |  |
| 6 | gen6 | Sud | e? | SPORNÉ | válec: V = S_dna · h bez π (Sud) – aplikační úloha, nebo výpočet objemu? |
| 6 | gen6b | Akvárium |  | — |  |
| 6 | gen6c | Nádrže |  | — |  |
| 6 | gen6d | Těžítko | e | VYPUSTIT | objem válce ve válci (Těžítko) |
| 6 | gen6e | Sud, kbelík a konvička |  | — |  |
| 6 | gen6f | Přelévání vody | e? | SPORNÉ | válec: poměr objemů dvou nádob (Přelévání vody) |
| 6 | gen6g | Dva sudy |  | — |  |
| 6 | gen6h | Bílý a šedý obdélník |  | — |  |
| 7 | gen7d | Přímky jedním bodem a kolmice |  | — |  |
| 7 | gen7e | Kružnice opsaná a osa úhlu | d? | SPORNÉ | kružnice opsaná a Thaletova věta jako ÚDAJ/postup ve výpočtu úhlu, ne konstrukce |
| 7 | gen7f | Trojúhelník z přímek |  | — |  |
| 7 | gen7g | Kruh z výsečí |  | — |  |
| 7 | gen7h | Krychle a hranol |  | — |  |
| 7 | gen7i | Soutěž ve vědomostech |  | — |  |
| 8 | gen8 | Záhon |  | — |  |
| 8 | gen8b | Plot kolem pozemku |  | — |  |
| 8 | gen8d | Odstřižené rohy |  | — |  |
| 8 | gen8e | Strana trojúhelníku |  | — |  |
| 8 | gen8f | Dva pozemky |  | — |  |
| 8 | gen8g | Dlaždice |  | — |  |
| 8 | gen8h | Útvary ve čtvercové síti |  | — |  |
| 8 | gen8i | Útvary v trojúhelníkové síti |  | — |  |
| 9 | gen9c | Drak na provázku |  | — |  |
| 9 | gen9d | Rovnoramenný trojúhelník |  | — |  |
| 9 | gen9e | Pravoúhlý lichoběžník |  | — |  |
| 9 | gen9f | Kosočtverec |  | — |  |
| 9 | gen9g | Obdélník v kružnici | d? | SPORNÉ | obdélník v kružnici (kružnice opsaná jako údaj) |
| 10 | gen10b | Měřítko mapy |  | — |  |
| 10 | gen10d | Mapa a trasa |  | — |  |
| 10 | gen10e | Plocha podle měřítka |  | — |  |
| 10 | gen10f | Obsah podobných trojúhelníků |  | — |  |
| 10 | gen10g | Body C na přímce | d? | SPORNÉ | počet bodů C, aby ABC byl pravoúhlý – v řešení Thaletova kružnice |
| 11 | gen11 | Kvádry |  | — |  |
| 11 | gen11b | Krychle |  | — |  |
| 11 | gen11d | Turistická mapa |  | — |  |
| 11 | gen11e | Kruhový diagram zahrady |  | — |  |
| 11 | gen11f | Náklad lodi |  | — |  |
| 11 | gen11g | Pravidelný mnohoúhelník |  | — |  |
| 11 | gen11h | Obdélník a kosočtverec |  | — |  |
| 11 | gen11i | Natírání plotu |  | — |  |
| 11 | gen11j | Osová souměrnost útvarů |  | — |  |
| 12 | gen12 | Bazén |  | — |  |
| 12 | gen12c | Kostky v krabici |  | — |  |
| 12 | gen12f | Lomená čára v hale |  | — |  |
| 12 | gen12h | Dvě krychle |  | — |  |
| 12 | gen12i | Dva hranoly |  | — |  |
| 12 | gen12j | Dort ze dvou forem | e | VYPUSTIT | objem obou válcových forem (Dort ze dvou forem) |
| 12 | gen12l | Obdélník ze dvou čtverců |  | — |  |
| 12 | gen12m | Nahrávání videa |  | — |  |
| 13 | gen12e | Povrch válce | e | VYPUSTIT | povrch válce (M9A/2023 ú. 13) |
| 13 | gen12g | Polepená krychle |  | — |  |
| 13 | gen12k | Trojboký hranol |  | — |  |
| 13 | gen14h | Rovnoramenný trojúhelník |  | — |  |
| 13 | gen13 | Letní tábory |  | — |  |
| 13 | gen13b | Cena zboží |  | — |  |
| 13 | gen13d | Úspora v procentech |  | — |  |
| 13 | gen13e | Parkoviště |  | — |  |
| 13 | gen13f | Pomlázky |  | — |  |
| 13 | gen13g | Kanystr |  | — |  |
| 13 | gen13h | Vlaky na kolejích |  | — |  |
| 13 | gen13i | Kytice |  | — |  |
| 13 | gen13j | Úklid haly |  | — |  |
| 14 | gen14 | Testové známky |  | — |  |
| 14 | gen14b | Průměr měření |  | — |  |
| 14 | gen14e | Kroužky |  | — |  |
| 14 | gen14i | Ze které rovnice |  | — |  |
| 14 | gen14f | Návštěvnost |  | — |  |
| 14 | gen14g | Ptačí hodinka |  | — |  |
| 15 | gen15d | Procenta — změny |  | — |  |
| 15 | gen15e | Kolik procent |  | — |  |
| 15 | gen15f | Objem nádoby |  | — |  |
| 15 | gen15g | Věk |  | — |  |
| 15 | gen15h | Sklenice |  | — |  |
| 15 | gen15i | Prvňáci |  | — |  |
| 15 | gen15j | Zedníci |  | — |  |
| 16 | gen16d | Trojúhelníkové obrazce |  | — |  |
| 16 | gen16e | Roboti a míčky |  | — |  |
| 16 | gen16f | Vkládané čtverce |  | — |  |
| 16 | gen16g | Šestiúhelníkové obrazce |  | — |  |
| 16 | gen16h | Vybarvování sítě |  | — |  |
| 16 | gen16i | Mirek a Zuzka |  | — |  |
| 16 | gen16j | Obrazce z obdélníčků |  | — |  |
| 16 | gen16k | Mozaika |  | — |  |
| 16 | gen16l | Patra |  | — |  |
| 16 | gen16m | Čtverce z obdélníků |  | — |  |
| 16 | gen16n | Hra se žetony |  | — |  |

## 2. Úroveň „základ“ (`prijimacky-gen.js`, PZ_GEN) podle okruhů

| Okruh | Pozice testu | Generátorů |
|---|---|---|
| vyrazy-mocniny | 1 | 8 (odmocninaSoucin = b, VYPUSTIT) |
| zlomky | 1, 2 | 8 |
| vyrazy-promenna | 3 | 7 |
| rovnice | 4, 14 | 7 |
| procenta | 13, 15 | 8 |
| slovni | 1, 5, 6, 13, 16 | 7 |
| pomer | 1, 5, 10, 11, 12, 13 | 7 |
| data | 7, 11, 14 | 7 |
| geometrie | 5, 6, 7, 8, 9, 10, 11, 12, 13, 16 | 10 |
| telesa | 6, 7, 11, 12, 13 | 7 |
| **Σ** | | **76** |

Generátory „základu“ jsou vedené po okruzích, ne po pozicích (okruh může sdílet víc pozic). Válec, koule, NSN/NSD, soustavy ani rozklad podle vzorců „základ“ neobsahuje; pod body a–h spadá jediný generátor: `odmocninaSoucin` (b).

## 3. Konstrukce (`konstrukce-ulohy.js`)

Typů celkem: **85**. Test nanečisto: pozice 9 losuje z **42** typů, pozice 10 z **38** typů.

| Typ | Pozice | Bod | Stav | Poznámka |
|---|---|---|---|---|
| thales | 9 | d | VYPUSTIT | Thaletova kružnice – celá úloha |
| dveThalet | 9 | d | VYPUSTIT | dvě Thaletovy kružnice, pravoúhlé trojúhelníky |
| thalesQ | 9 | d | VYPUSTIT | Thaletova věta, pravoúhlý trojúhelník |
| opsana | 10 | d | VYPUSTIT | kružnice opsaná trojúhelníku – celá úloha |
| ctverecVepsany | 10 | d | VYPUSTIT | střed kružnice opsané trojúhelníku ABC je první krok |
| obdelnikUhl | 9 | d? | SPORNÉ | obdélník: vrchol C na Thaletově kružnici nad úhlopříčkou |
| obdelnikStrana | 9 | d? | SPORNÉ | obdélník: vrchol D na Thaletově kružnici nad AS |
| teziste | 9 | d? | SPORNÉ | pravoúhlý rovnoramenný: v postupu zmínka o Thaletově kružnici |
| pravouhlyRovnoramenny | 9 | d? | SPORNÉ | pravoúhlý rovnoramenný: C na Thaletově kružnici nad BD |
| pravouhlyStrana | 9 | d? | SPORNÉ | pravoúhlý trojúhelník: A na Thaletově kružnici nad BC |
| pravouhlyLichKruz | 9 | d? | SPORNÉ | lichoběžník: Thaletova věta v postupu |
| obdelnikOpsana | 10 | d? | SPORNÉ | obdélník, kružnice opsaná obdélníku (ne trojúhelníku) |
| obdelnikOpsanaM | 10 | d? | SPORNÉ | obdélník, bod na kružnici opsané obdélníku |

Tečna ke kružnici v jejím bodě (d) není v žádném z 85 typů — nic k vypuštění. Koule (f) a NSN/NSD tří čísel (c) nejsou v žádné bance — nic k vypuštění; NSN dvou čísel (Dlaždice, `gen8g`) a společný jmenovatel zůstávají.

## 4. Přehled vzorců (h)

V repozitáři žádný „Přehled vzorců“ na poslední straně testu nanečisto není: `test.html` ani žádná šablona tisku takový blok (ani „Rozklad na součin“) neobsahují (prohledáno `grep` v celém repu mimo PDF archivu). Bod h proto nemá co upravovat – viz otázky v závěrečné zprávě.
