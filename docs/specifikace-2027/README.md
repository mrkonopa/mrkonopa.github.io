# Specifikace požadavků CERMAT pro školní rok 2026/2027 — matematika (čtyřleté obory, M9)

Platí od jarního termínu 2027. Rozhoduje Část C1 (str. 10–12): škrtnutý text = vypuštěno, červený = nové.

## Co v adresáři je

| Soubor | Co to je |
|---|---|
| `SPECIFIKACE-POZADAVKU_MAT_2026-2027_v-revizich-zmen.pdf` | Specifikace požadavků s revizemi (C1 na str. 10–12, C2 s textem testového sešitu na str. 12) — **zdroj pravdy** |
| `Specifikace-ve-vazbe-na-nova-RVP-ZV_2026-2027-shrnuti-zmen.pdf` | Shrnutí změn (čtyřleté obory na str. 3) |
| `Metodika_prijimaci-rizeni_2026-2027.pdf` | Metodika MŠMT k přijímacímu řízení (harmonogram na str. 17: čtyřleté obory 12. a 13. 4. 2027, náhradní termín 29. a 30. 4.) |
| `mereni-pred.md`, `mereni-po.md` | Měření před a po úpravě: pozice → počet variant v obou bankách, konstrukce |

## Co specifikace skutečně říká (ověřeno proti PDF 12. 11. 2026)

| Bod | Vypuštěno / změněno (doslova) | Důsledek v přijímačkách |
|---|---|---|
| a | „rozklad dvojčlenu na součin pomocí vzorců (a + b)², (a − b)², a² − b²“; **umocnění dvojčlenu zůstává** | rozklad jen vytýkáním; „umocni podle vzorce“ a násobení (A − B)(A + B) zůstávají |
| b | „pravidla pro **odmocňování** zlomku a součinu“; umocňování zlomku a součinu zůstává | `odmocninaDesetinna` místo `odmocninaSoucin` |
| c | NSN a NSD jen pro **dvě** čísla; NSN při určování společného jmenovatele zlomků zůstává (9. ročník) | v bankách tři čísla nebyla |
| d | konstrukce tečny ke kružnici v jejím bodě, **kružnice opsané trojúhelníku**, **využití Thaletovy kružnice při konstrukci pravoúhlého trojúhelníku** | pět typů konstrukcí vyměněno; vztah kružnice a přímky (tečna, sečna, vnější přímka) jako pojem zůstává |
| e | „odhad a výpočet **objemu a povrchu válce**“; rozpoznání válce a síť válce zůstávají | Těžítko, Dort, Povrch válce → hranol |
| f | „aplikační slovní úlohy s využitím znalostí o **kouli**“; **aplikační slovní úlohy o válci zůstávají** | koule v bankách nebyla; Sud a Přelévání vody zůstávají |
| g | soustava dvou rovnic zůstává, vypuštěna „metoda dosazovací nebo sčítací“ | v postupu „kteroukoli metodou“ |
| h | C2: „Součástí testového sešitu bude následující text“ — čtverce 11²–20², π ≐ 3,14, π ≈ 22/7, obvod a obsah kruhu | v bance ani na stránce testu takový blok není (viz otázky v PR) |

Hlídá to `tests/prijimacky-spec-2027.test.cjs`; sporné úlohy, které zůstaly, jsou v něm jmenovitě vypsané.
Archiv PDF (`projects/prijimacky-matematika/pdfs/`, archiv na úvodní stránce, `doplnky.html`) zůstává beze změny.
