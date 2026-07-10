# Obsahový audit CERMAT testu — nálezy a opravy (2026-07)

Pilotní audit (vzorek + adversariální ověření) nad `projects/rpg-cermat-9.js`.
Vzorek: 8–10 generací každé z 16 pozic; 3 LLM agenti (pozice 1–6 / 7–11 / 12–16)
+ ruční dopočet. Automatické linty (÷, zbytky šablon, NaN, dvojité mezery): 0 nálezů.

## Kritické (špatný / nesmyslný výsledek) — OPRAVENO

| Pozice | Problém | Oprava |
|---|---|---|
| 4 (Rovnice 4.2) | Zaokrouhlení `n4` udělalo z rovnice identitu `0·y = 0` (~⅓ případů) → kořen nejednoznačný, klíč špatně | Koeficient u y odvozen z `diff = ri(2,3)/10` (vždy nenulový), všechny hodnoty 1-desetinné ⇒ jednoznačný kořen |
| 8 (Záhon) | Liché násobky 3 (9/15/21 m) nedělitelné rozestupem 40 cm → neceločíselný počet rostlin + nepravdivý mezivýpočet v řešení (např. „70 − 53 = 18") | `aStr = ri(2,4)*6` (12/18/24) ⇒ vše v cm dělitelné 40; skupinka je dělitel počtu rostlin ⇒ přesné dělení |
| 14 (Známky) | Průměr 2,1/2,2 je pro známky 1–2 nemožný → záporný počet žáků (−4) | `prumer = ri(15,19)/10` (1,5–1,9) ⇒ počet jedniček 2–10 |

## Major (matoucí / nereálné) — OPRAVENO

| Pozice | Problém | Oprava |
|---|---|---|
| 4 (4.2) | Znaménko „= 0,5y + -4" (plus a hned minus) | Konstanta vykreslena se správným znaménkem (`− 4`) |
| 6 (Sud 6.2) | „přibyly 5 litry vody" (špatný pád pro 5/6) | Jednotka „l": „přibylo … 5 l vody" |
| 9 (Žebřík) | Nereálné rozměry (žebřík 30–60 m) | Bez umělého násobení `k` → přepona 5–17 m |
| 13 (Cena) | Float artefakt „770.0000000000001 Kč" + desetinné tečky v řešení | `Math.round` pro mezicenu; `cz()` → čárky |
| 16 (Rámečky) | „Počet destiček v rámu" byl umělý vzorec bez geometrického smyslu; 16.2 vždy = 4 | Přepracováno na obsah rámu `(w+2·2)² − w²` — plně odvoditelné bez obrázku |
| 12, 15 | Desetinné tečky místo čárek v řešení | `cz()` |

## Minor (kvalita/formulace) — OPRAVENO

| Pozice | Problém | Oprava |
|---|---|---|
| 1 (Číselný výraz) | Iracionální odmocnina + dělení bez kalkulačky za 1 bod | Přepracováno na √ součinu, kde součin je druhá mocnina ⇒ celočíselný výsledek |
| 2 (2.1) | „Zkrať NSD (1)" když je zlomek už v základním tvaru | Podmíněný text: „už je v základním tvaru" |
| 2 (2.2) | `(d²−e²):f` mohlo vyjít nekonečné des. číslo | `f` = dělitel `num2` ⇒ celé číslo |
| 3 (3.3) | „čemu se rovná (x − ?)" (nepřesné — odpověď je číslo) | „napište číslo, které patří místo otazníku" |
| 5 (Pozemek) | „pětina" byla zaokrouhlená, řešení psalo `=` místo `≈` | `c = 20/30/40 m` ⇒ c²/5 přesně celé |
| 11 (Kvádry 11.3) | Poslední tvrzení bylo vždy PRAVDA (A) — predikovatelné | Náhodně obrácený směr tvrzení (A/N) |

## Zbývá (přijatelné / na zvážení)
- **7 (Úhly, SVG):** oblouk zadaného úhlu je kreslen pod pevným sklonem příčky
  (schéma, ne měřítko). Popisek s čílem je správný. Necháno jako schematické.
- Drobná typografická nejednotnost: dopočtené záporné hodnoty používají ASCII `-`,
  zbytek `−` (U+2212). Kosmetické.

## Ověření
- `tools/verify-cermat.cjs` — 500 běhů, 16 úloh / 50 bodů, žádné NaN/undefined ✅
- `tests/rpg-cermat.test.cjs` — 19/19 ✅
- `tools/cermat-audit-dump.cjs` — přegenerováno, linty 0, ruční kontrola oprav ✅
