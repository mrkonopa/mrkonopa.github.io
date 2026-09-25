# Archiv ostrých testů CERMAT z matematiky

Nástroje, které z webu CERMATu (stránka „Testová zadání v PDF") stáhnou všechny ostré testy
z matematiky 2015–2026 a rozdělí je na jednotlivé úlohy: čtyřleté obory (M9), šestiletá (M7)
a osmiletá gymnázia (M5) a přijímačky nanečisto. Slouží jako podklad pro vlastní úlohy
v testu nanečisto, v procvičování a v RPG hrách.

```bash
python3 tools/cermat-archiv/katalog.py   # katalog odkazů → katalog.json (commitovaný)
python3 tools/cermat-archiv/stahni.py    # zadání, klíče, vzorová řešení → .cache/ (asi 105 MB, 5 min)
python3 tools/cermat-archiv/vytez.py     # úlohy → .cache/ulohy.json a .cache/ulohy.csv
python3 tools/cermat-archiv/rozbor.py    # souhrn bez znění úloh → ROZBOR.md (commitovaný)
```

- **Doslovné znění úloh zůstává v `.cache/`, mimo git.** Pravidla CZVV povolují využití
  testové dokumentace ve výuce na školách, ale ne další zveřejňování. Do repozitáře proto jde
  jen katalog adres a souhrn počtů. Hlídá to `tests/cermat-archiv.test.cjs`.
- **Řádné testy 2024 mají text vložený jako obrázky.** `vytez.py` je čte přes OCR, když je
  nainstalovaný tesseract s češtinou (`apt-get install tesseract-ocr tesseract-ocr-ces`).
  Výsledek OCR se ukládá do `.cache/ocr/`. Nákres se na takových stranách neurčuje (`null`).
- **Testy 2015–2016 mají vzorce ve starých fontech**, takže matematické zápisy v textu bývají
  rozsypané. U každé úlohy je proto číslo strany v PDF, kde si ji přečteš celou.
- Úlohy se dělí podle čísel v levém okraji, a to jen v pořadí, které odpovídá klíči.
  „Výchozí text k úloze N" stojí před číslem N, proto se přenáší k následující úloze.
- Okruh úlohy je jen odhad podle klíčových slov. Typ (otevřená, výběr, ano/ne, přiřazování,
  konstrukce), body a správné řešení z klíče jsou spolehlivé.
