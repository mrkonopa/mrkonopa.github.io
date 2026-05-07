# PDF archive — Přijímačky na SŠ z matematiky

Drop PDF files into this folder, then update `../index.html` to link to them.

## Suggested naming convention

```
prijimacky-YYYY-{4l|6l|8l}-{rt|nt}-{t1|t2}.pdf
```

| Segment | Meaning | Values |
|---|---|---|
| `YYYY` | rok zkoušky | 2024, 2025, … |
| `4l` / `6l` / `8l` | typ studia | 4letý / 6letý / 8letý |
| `rt` / `nt` | termín | řádný / náhradní |
| `t1` / `t2` | varianta | termín 1 / termín 2 |

Example: `prijimacky-2024-4l-rt-t1.pdf` = 4letý gymnázium, řádný termín, termín 1, rok 2024.

## How to add a new test

1. Drop the PDF here following the naming above (or any name you prefer).
2. Open `../index.html` and find the right `<section class="year">` block.
3. Copy a `<a class="row">` block, update fields, remove the `placeholder` class so the link goes live.
4. Bump the `<span class="count">` text on the year header.

If you're adding a brand-new year not yet in the page, copy the whole commented `<section>` template at the bottom of `../index.html`.
