# Měření po úpravě (specifikace CERMAT 2026/2027)

Srovnání s `mereni-pred.md`. Počty jsou funkce v `SLOTS` (varianty), generátory v `PZ_GEN` a typy v `PZ_KONSTRUKCE`.

## 1. Banka testu nanečisto podle pozic

| Poz. | Před | Po | Co se změnilo |
|---|---|---|---|
| 1 | 11 | 11 | — |
| 2 | 6 | 6 | — |
| 3 | 6 | 6 | 3.3 ve třech variantách (gen3, gen3d, gen3f): rozklad podle vzorce → rozklad vytýkáním; gen3f přejmenována „Součin, umocnění a vytýkání“ |
| 4 | 5 | 5 | gen4e, gen4g: z řešení soustavy zmizelo „dosazovací/sčítací metodou“, nově „lze řešit kteroukoli metodou; ukážeme jednu“ |
| 5 | 8 | 8 | — |
| 6 | 8 | 8 | − Těžítko (válec ve válci) → + Těžítko s dutinou (hranol bez krychle) |
| 7 | 6 | 6 | — |
| 8 | 8 | 8 | — |
| 9 | 5 | 5 | — |
| 10 | 5 | 5 | — |
| 11 | 9 | 9 | — |
| 12 | 8 | 8 | − Dort ze dvou forem (válce) → + Dort z hranolových forem |
| 13 | 13 | 13 | − Povrch válce → + Povrch hranolu (stejná stavba, plášť k-krát podstava) |
| 14 | 6 | 6 | — |
| 15 | 7 | 7 | — |
| 16 | 11 | 11 | — |
| **Σ** | **122** | **122** | |

## 2. Úroveň „základ“ podle okruhů

| Okruh | Před | Po | Co se změnilo |
|---|---|---|---|
| vyrazy-mocniny | 8 | 8 | − odmocninaSoucin (pravidlo √(xy) = √x·√y jako postup) → + odmocninaDesetinna (√900 = 30, √0,49 = 0,7) |
| zlomky | 8 | 8 | — |
| vyrazy-promenna | 7 | 7 | — |
| rovnice | 7 | 7 | — |
| procenta | 8 | 8 | — |
| slovni | 7 | 7 | — |
| pomer | 7 | 7 | — |
| data | 7 | 7 | — |
| geometrie | 10 | 10 | — |
| telesa | 7 | 7 | — |
| **Σ** | **76** | **76** | |

## 3. Konstrukce

| | Před | Po |
|---|---|---|
| Typů celkem | 85 | 85 |
| Pozice 9 (test nanečisto) | 42 | 42 |
| Pozice 10 (test nanečisto) | 38 | 38 |

Vypuštěno (5): `thales`, `dveThalet`, `thalesQ` (Thaletova kružnice / věta při konstrukci pravoúhlého trojúhelníku), `opsana`, `ctverecVepsany` (kružnice opsaná trojúhelníku).

Přidáno (5, jen osa úsečky, kružnice, rovnoběžky v dané vzdálenosti a kolmice): `rovnoramennyRameno`, `osaKruznice`, `rovnobezkaKruznice` (4 řešení) na pozici 9; `kolmiceVzdalenost`, `osaRovnobezka` na pozici 10.

Tři řádky archivní tabulky `tools/cermat-archiv/konstrukce-m9.json` (74, 50, 20) pokrývaly vypuštěné typy: jsou teď „ne“ s příznakem `vypusteno2027` a podlaha `PODLAHA_ANO` v `tests/konstrukce-pokryti.test.cjs` klesla ze 73 na 70.

## 4. Sporné úlohy, které zůstaly

Jmenovitě v `tests/prijimacky-spec-2027.test.cjs` (SPORNE_BANKA, SPORNE_KONSTRUKCE); výjimka, která už nic nechytá, test shodí.
