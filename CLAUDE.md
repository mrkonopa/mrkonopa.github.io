# About Vojta & mrkonopa.github.io

## Who you are working with
- **Vojta Konopa** (vojtech.konopa@gmail.com, GitHub: mrkonopa) — Czech math teacher (ZŠ Husova). Builds educational tools for his students (8.–9. grade primarily, sometimes 6th grade).
- **Languages:** Czech is the default for school content. English is fine for tool-internal stuff, comments, commit messages.
- **OS:** Windows. Uses Git Bash (MINGW64). Sometimes WSL-like commands work; sometimes not. The mounted Windows folder in your sandbox has weird permission quirks (see below).

## How Vojta operates
- **Iterative.** He says "do this", reviews result, gives feedback, iterates. Don't try to build huge things in one shot.
- **Token-conscious.** He's experienced you eating a 5-hour limit fast. Be efficient: small targeted Edits over big Writes, no verbose commentary, no re-reading files you've already touched in this session.
- **Visual quality matters.** He notices font issues, animations, layouts. If a page "feels off" he'll say so.
- **Czech school context.** Real Czech values (CERMAT exam rates, 2025 tax sazby, real bank/service names like ČSOB, Česká pošta, Alza). Authenticity > generic.
- **Asks you to ask.** If he writes "ptej se", use `AskUserQuestion` for 2–4 focused choices before committing to a direction.

## Recurring user preferences (apply by default)
- **Progressive hints (3 levels):** L1 nasměrování → L2 vzorec → L3 výsledek. Tlačítko ukazuje "Nápověda X/3". Level 3 vizuálně odlišený (oranžová, ne žlutá). This pattern is in cesta_penez, procenta_priklady, both únikovky. Apply to all new educational projects.
- **Randomized numbers per session.** Each student should get different numbers. Use `setup: () => ctx` + `build: ctx => content` pattern (see cesta_penez Acts 1–3).
- **Progress codes (heslový systém).** For multi-chapter learning content: each chapter completion gives a "kód" the student writes down; entering it on intro/hub unlocks all previous chapters. Lets them resume on a different computer. (See cesta_penez `ACT_CODES`.)
- **Bilingual project descriptions.** On `/projects/index.html`, each project has EN + CS description in separate paragraphs, small font (12px), with "EN" / "CS" prefix labels in muted color. **No language mixing in one paragraph.**
- **Visual styles per area:**
  - Personal homepage (`/index.html`) — retro terminal, dark, JetBrains Mono, CRT scanlines. Static (no typewriter animation — user removed it because distracting).
  - 404 page — same terminal aesthetic.
  - `/projects/index.html` — terminal aesthetic.
  - Educational projects (únikovky, cesta_penez, procenta_priklady) — Lexend font, light theme, colorful per-category accents.
  - `/travels/` — industrial / urbex aesthetic, dark, Archivo Black for headlines.
  - `/projects/prijimacky-matematika/` — Lexend, cleaner academic look.
- **Fonts:** **Avoid Fredoka** (broken Czech diacritics for some users). Use Lexend (full Latin Extended-A support). Never use `cursive` as fallback. Safe stack: `'Lexend', 'Inter', 'Segoe UI', system-ui, -apple-system, Arial, sans-serif`.

## Site structure (current)
```
/                              # personal landing (terminal retro)
/404.html                      # custom 404 (terminal)
/projects/                     # projects index
/prijimacky-matematika/        # CERMAT entrance-exam PDF archive
  /pdfs/{2023,2024,2025,2026}/{1_radny,2_radny,3_nahradni,4_nahradni,5_nanecisto}/
/unikovka_procenta.html        # escape-room about percenta (10 zámků)
/unikovka_telesa.html          # escape-room about cubes/cuboids (10 zámků)
/procenta_priklady.html        # random practice (3 difficulty levels, 8 problem types)
/cesta_penez.html              # financial literacy adventure (8 acts)
/travels/
  /index.html                  # journal grid
  /_template.html              # per-location template
  /ukraine-2017.html           # first urbex post (text placeholders, photos in)
  /images/ua_2017/*.jpg        # web-sized photos only (originals gitignored)
  /images/cr_bh_2018/          # second urbex page material (page not built yet)
/tools/compress-pdfs.sh        # Ghostscript wrapper, runs locally
```

## Recurring technical pitfalls (avoid these)
- **CRLF noise on `projects/unikovka_procenta.html`.** Every `git status` shows it as modified because of Windows line-ending churn. Always tell user to `git checkout -- projects/unikovka_procenta.html` before staging.
- **Git index corruption.** Bash sandbox can't atomically rewrite `.git/index` on Windows mount. If user sees many false `D ` (deleted) entries in `git status`, recover with: `rm -f .git/index.lock .git/index && git reset`.
- **Write tool truncates large files (~47 KB threshold).** For files larger than that, prefer small targeted Edits. If Write does truncate, you may get orphan content after `</html>` — delete the duplicate tail with an Edit.
- **Bash can't unlink files on the Windows mount.** `cp` works (creating new files). `rm` doesn't. `mv` doesn't. **Tell the user to delete files locally** if cleanup is needed. Same for `rmdir` on empty folders.
- **Bash `tail`/`grep` may show stale content** while Read tool shows fresh content. Read tool is the source of truth for file state.
- **Czech math convention — triangle naming.** Dvojí pravidlo:
  - **Strana** se značí **malým písmenem protilehlého vrcholu** (a naproti A, b naproti B, c naproti C).
  - **Úhel** se značí podle vrcholu, u kterého je (α u A, β u B, γ u C).
  - **NEPOUŽÍVAT** americkou SOHCAHTOA konvenci kde a/b/c jsou definovány vůči úhlu (a = opposite, b = adjacent) bez ohledu na vrcholy — to je v Česku špatně.
  - Pro pravoúhlý trojúhelník s α u A a pravým úhlem γ u C tedy platí: **a = protilehlá k α** (naproti A), **b = přilehlá k α** (naproti B), **c = přepona** (naproti pravému úhlu). Vzorce: sin α = a/c, cos α = b/c, tan α = a/b.
  - Kontrola: jestli α je v diagramu u vrcholu označeného A. Pokud ne, špatně.
- **SVG angle arcs** musí mít střed přesně ve vrcholu úhlu a oba konce na ramenech ve stejné vzdálenosti (radius). Použij `M x1,y1 A r,r 0 0,0 x2,y2` (sweep=0 pro arc bowing dovnitř úhlu). Spočítej koncové body přesně přes unit vector ramene × radius.
- **Navigation "zpět na projekty" href rule:**
  - Files directly in `/projects/` (e.g. `unikovka_procenta.html`, `cesta_penez.html`) → use `href="./"` → resolves to `/projects/`
  - Files in a subfolder of `/projects/` (e.g. `prijimacky-matematika/index.html`) → use `href="../"` → resolves to `/projects/`
  - `href="../"` from a `/projects/` file goes to `/` (home), NOT to projects. This is a common mistake — double-check whenever adding nav to a projects page.
- **Some allowlisted domains:** `github.com`, `npmjs.org`, `pypi.org`, `cdn.playwright.dev`, `*.anthropic.com`, `*.claude.com`. NOT allowlisted: `*.github.io`, most `*.gov.cz`. Czech educational sites work selectively (umimematiku.cz, fgdoskol.cz are usually OK; financnigramotnost.gov.cz blocked).

## RPG Matematika série (6.–9. ročník)
- Single-file pixel-art RPG engine, sdílený mezi `projects/rpg-mat-6/7/8/9.html`. Každá hra: 7 oblastí × 3 mise × 6 úkolů = 126, save `{name,xp,level,attrs:{calc,geo,anal,craft},done,inv}` v localStorage pod `RPG_MAT_X`.
- Témata: 6 = Vesmírná expedice 🚀, 7 = Ztracený chrám ⛏️, 8 = Matematická akademie 🎓, 9 = NULL_BYTE 💻 (cyberpunk). Úvodní obrazovky mají konzistentní strukturu, ale tématickou výzvu+tlačítko.
- Fonts: Roboto Mono + VT323 (`--px`/`--vt`). MC mise (`mc:true`) smí mít **jen numerické nebo ANO/NE odpovědi** (jinak se rozbije generátor distraktorů). Audit: extrahuj AREAS přes `new Function()`, vygeneruj tisíce úloh, hlídej NaN/undefined a MC bezpečnost.
- **Hub** `projects/rpg-matematika.html` — rozcestník, čte všechny `RPG_MAT_*` saves z localStorage (stejný origin) a ukazuje postavu+pokrok.
- **Cloud (Fáze 1)** `projects/rpg-cloud.js` — Supabase Auth (Google, omezeno na `@husovaliberec.cz`) + ukládání postav. **Graceful degradation:** prázdný CONFIG nebo nenačtené CDN ⇒ vše běží lokálně jako dřív, login lišta skrytá. Setup: `RPG-CLOUD-SETUP.md` + `rpg-cloud-setup.sql`. Vojta je admin Workspace domény. Fáze 2 = učitelský přehled třídy.

## Workflow with the user
1. **User uploads files / asks for a project.** Often via D:\SynologyShare\ZŠ_HUSOVA paths (his school folder, mounted in sandbox).
2. **You edit files in the repo** (`C:\Users\vojte\mrkonopa.github.io\`).
3. **You give a push sequence.** User runs it from Git Bash. Standard pattern:
```bash
cd ~/mrkonopa.github.io
git checkout -- projects/unikovka_procenta.html
git add <files>
git status
git commit -m "..."
git push
```
4. **For PDF projects (přijímačky):** compress big PDFs before commit using `bash tools/compress-pdfs.sh`. Big scanned tests go from ~15 MB to ~2 MB. The script needs Ghostscript installed (`choco install ghostscript`).
5. **For travel photos:** resize via Python+Pillow in sandbox to ~1600px wide, JPEG q82, strip EXIF (GPS!). Original PNGs/RAWs go in folder's `.gitignore`.

## What's still pending (Nov 2025 state)
- **`travels/cr-bh-2018.html`** (second urbex page) — photos are resized and in place, but the page itself isn't built. User said he'll provide text and more pictures.
- **2024 přijímačky zadání blanks** — user needs to download 6 PDFs from `prijimacky.cermat.cz` and drop them in the right folders. The HTML already references the expected paths.
- **Únikovka tělesa / procenta — verify hints work for all 10 zámků.** They use a CODE_HINTS map keyed by zámek ID. If any zámek had its `code` value changed without updating the map, hints could be misleading.

## Cesta peněz — finished structure (reference)
- 8 chapters (Akty), narrative: brigáda → plat → inflace → půjčka → hypotéka → lichva → kyberpodvody → certifikát
- Each chapter randomizes numbers per playthrough (`setup` returns `ctx`, scenes reference `ctx`)
- Progressive 3-level hints on every math problem
- Progress codes after each chapter (in `ACT_CODES`) lets students resume on another computer
- localStorage persists `STATE` (unlocked chapters, scores, student name on cert)
- Final cert has live-editable name field

## Tone & writing style for Czech content
- Second-person ("ty", "tvoje"), informal but respectful — talking to a 14-year-old
- Light humor OK, but not at student's expense
- "Bohužel" / "Skvěle" / "Pojď to zkusit znovu" — typical feedback phrasing
- Fact boxes (📘) for educational definitions
- Warning boxes (⚠️) for red flags
- Money formatting via `Number(n).toLocaleString('cs-CZ')` — gives "1 234 Kč" style spacing
