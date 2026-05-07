# PDF archive — Přijímačky na SŠ z matematiky

Jednotné přijímací testy z matematiky (CERMAT) pro **4leté obory SŠ**. Soubory jsou
organizované do podsložek po ročnících a termínech.

## Folder structure

```
pdfs/
├── 2026/
│   ├── 1_radny/   M9A_2026_*.pdf
│   └── 2_radny/   M9B_2026_*.pdf
├── 2025/
│   ├── 1_radny/    M9A_2025_*.pdf
│   ├── 2_radny/    M9B_2025_*.pdf
│   ├── 3_nahradni/ M9C_2025_*.pdf
│   ├── 4_nahradni/ M9D_2025_*.pdf
│   └── 5_nanecisto/ nanecisto_2025_*.pdf
└── README.md
```

## CERMAT codes

| Kód | Význam |
|---|---|
| **M9A** | Termín 1 · řádný |
| **M9B** | Termín 2 · řádný |
| **M9C** | Termín 1 · náhradní |
| **M9D** | Termín 2 · náhradní |

## File types

| Suffix | Czech | What it is |
|---|---|---|
| `_TS` | Testový sešit | The actual test (questions) |
| `_VZA` | Vzorový záznamový arch | Filled-in answer sheet (solutions) |
| `_ZA` | Záznamový arch | Blank answer sheet for the student |
| `_klic` | Rozšířený klíč | Extended key with explanations |

## Adding new tests — workflow

1. **Drop the PDFs** into the right `pdfs/<year>/<termin>/` folder.
2. **Compress them** before commit. Scanned CERMAT tests are typically 10–15 MB
   each but compress to 1–3 MB with no visible quality loss:
   ```bash
   cd ~/mrkonopa.github.io
   ./tools/compress-pdfs.sh
   ```
   The script needs Ghostscript (`gs`). Install once with `choco install ghostscript`
   on Windows (Git Bash), `brew install ghostscript` on macOS, or
   `sudo apt install ghostscript` on Linux. The script auto-skips files <1 MB
   and only replaces an original if compression saves >10%.
3. **Update `../index.html`**: find the right `<section class="year">` block and
   either copy a `<li class="row">` block or edit one of the existing ones.
   Update the label (Termín X), the M9X code, and the three `href` attributes
   to point at your files. If a row has no file (e.g. you don't have a
   `záznamový arch`), just delete that `<a>` element.
4. **Commit and push** as usual.
