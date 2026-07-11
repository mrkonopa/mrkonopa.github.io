# Obsahový audit teorie (rpg-learn 3–9) — nálezy a opravy (2026-07)

Audit statického učebního obsahu (`projects/rpg-learn-N.js`): intro, sekce,
vzorce, řešené příklady, dvojice „častá chyba" (✗ špatně → ✓ správně).
Nástroj: `tools/learn-audit-dump.cjs`. 1 agent na ročník + ruční ověření.

## Matematické chyby (kritické/major)
- **7. tř., mise 1-2 (critical):** „9,6 : 0,4 = 96 : 4 = **30**" → **24** (protiřečilo vlastnímu řešenému příkladu, kde je správně 24).
- **8. tř., mise 5-3 (major):** obsah mezikruží „π(52²−50²) = π·**4**·102 = 408π" použil faktor 4 místo (R−r)=2 → **π·2·102 = 204π ≈ 641 m²**.
- **7. tř., mise 1-1 (major):** „častá chyba" nesprávně označila platnou metodu (360 : 4 : 2) za chybnou → „proč" přepsáno tak, že metoda je správná, chyba je jen v aritmetice.

## Terminologie / konvence (major)
- **7. tř. + 6. tř.:** anglické zkratky vět o shodnosti (SSS/SAS/ASA, „included angle") → české **sss / sus / usu / Ssu**; odstraněno chybné ztotožnění „SSU / AAS".

## Čeština, konzistence, úroveň (minor)
- **9. tř.:** překlep „znamínkových" → „znaménkových"; nepřesnost „znaménko většího" → „znaménko čísla s **větší absolutní hodnotou**"; důsledné tykání („Vyděl"); „jisté body".
- **8. tř.:** překlepy „použij / písek / zkoušku"; nereálný údaj „40 úloh / 70 min" → ~16 úloh (CERMAT).
- **6. tř.:** matoucí dvojice u rozšíření zlomku; „se středem".
- **5. tř.:** zmatená věta o převodu jednotek přepsána srozumitelně.
- **4. tř.:** intro mise 5-3 nesedělo s obsahem (osy souměrnosti) → doplněno; mocninový zápis `10³ × 10³` (neučí se ve 4. tř.) → `1 000 × 1 000`.
- **3. tř.:** „7 × 8 znamená **osmkrát sedm**" → „sedmkrát osm" (česká konvence a↔a-krát); dvojice chyba, kde ✗ ukazovala správný součet, přepsána na skutečnou chybu (zarovnání zleva).

## False positives (zamítnuto)
- 3. tř. „znaky <, > =" — zdroj je správný (`<, >, =`), agent viděl osekaný text z dump nástroje (stripování „<…>").
- 7. tř. „= 106 cm³" — zdroj má `10<sup>6</sup>`; „106" byl artefakt stripování `<sup>`.

## Ověření
- `node --check` všech 7 souborů; `tools/verify-learn.cjs 3–9` — OK.
- `tests/rpg-learn.test.cjs` — 56 ✅ / 0 ❌.
- Nástroj `learn-audit-dump.cjs` opraven kvůli CodeQL („incomplete multi-character
  sanitization"): stripování HTML značek teď opakuje do ustálení.
