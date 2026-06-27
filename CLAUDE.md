# About Vojta & mrkonopa.github.io

## Who you are working with
- **Vojta Konopa** (vojtech.konopa@gmail.com, GitHub: mrkonopa) — Czech math teacher (ZŠ Husova). Builds educational tools for his students (8.–9. grade primarily, sometimes 6th grade).
- **Languages:** Czech is the default for school content. English is fine for tool-internal stuff, comments, commit messages.
- **OS:** Windows. Uses Git Bash (MINGW64). Sometimes WSL-like commands work; sometimes not. The mounted Windows folder in your sandbox has weird permission quirks (see below).

## How Vojta operates
- **Iterative.** He says "do this", reviews result, gives feedback, iterates. Don't try to build huge things in one shot.
- **Token-conscious.** He's experienced you eating a 5-hour limit fast. Be efficient: small targeted Edits over big Writes, no verbose commentary, no re-reading files you've already touched in this session.
- **NO background Agent tasks.** Never spawn Agent tasks with `run_in_background:true`. Never auto-parallelize into multiple background agents. Work sequentially in the main conversation. Vojta finds the background task panel distracting and the tasks often duplicate already-completed work.
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
  /index.html                  # journal grid (cards + JS nav map)
  /_template.html              # per-location template
  /ukraine-2017.html           # 01 — first urbex post
  /cr-bh-2018.html             # 02 — Croatia & Bosnia (built, 68 photos)
  /romania-2019.html           # 03
  /yugoslavia-2020.html        # 04
  /spain-france-2021.html      # 05
  /italy-2022.html             # 06
  /baltic-2023.html            # 07
  /images/<trip>/*.jpg         # web-sized photos only (originals gitignored)
/tools/compress-pdfs.sh        # Ghostscript wrapper, runs locally
```

## Recurring technical pitfalls (avoid these)
- **RPG regrese, které se vracejí při změnách kódu** — po KAŽDÉM zásahu do her/sprite enginů spusť `node tests/vstudents-deep.harness.cjs` (žáci vyhrávají i prohrávají, HP bar, srdíčka, nápovědy, reduced-motion, trénink, odkazy). Konkrétní opakované chyby:
  - **`rm()` guard u nových kreslicích volání.** Každé `[tick % 2]` přepínání snímků (hrdina/parťák/boss) i particle spawn v render() MUSÍ být `rm() ? 0 : tick % 2` / `!rm() && …`. Už 2× se stalo, že VFX toggle zastavil bosse, ale hrdina/parťák se hýbali dál.
  - **Prázdné druhé hinty `hints:[\`…\`,\`\`]`.** Generátory úloh občas vzniknou s prázdným L2 hintem. `showHint`/`trHint` mají fallback `'Výsledek: '+t.ans`, ale obsah má být explicitní. Audit: `grep -c ',\`\`\]' projects/rpg-mat-*.html` musí být 0.
  - **Nedefinované znaky palety → magenta `#f0f` pixely.** Každý znak v sprite gridu musí existovat v příslušné paletě (PAL_HERO/PAL_COM/BOSS_PALS+COMMON).
  - **`_doneSoFar`/`_doneBattle` pořadí** — počítat až PO `BT.tasks=…` přiřazení.
  - **Navigační odkazy z `/projects/` souborů** — `../prijimacky-matematika/` je ŠPATNĚ (vede na root), správně `prijimacky-matematika/`. Viz href pravidlo níže.
  - **Tmavé boss/hero palety** — sprite na tmavém pozadí arény musí mít M-odstín ≥ ~#4a3a78 jasu; kontrola screenshotem (`tests/sprite-screenshots.cjs`).
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
- **Cloud (Fáze 1)** `projects/rpg-cloud.js` — Supabase Auth (Google, omezeno na `@husovaliberec.cz`) + ukládání postav. **Graceful degradation:** prázdný CONFIG nebo nenačtené CDN ⇒ vše běží lokálně jako dřív, login lišta skrytá. Setup: `RPG-CLOUD-SETUP.md` + `rpg-cloud-setup.sql`. Vojta je admin Workspace domény. CONFIG už je vyplněný (projekt `ovajoalbyofenjbbyhcy`), tabulka `saves` živá.
- **Učitelská konzole (Fáze 2)** `projects/rpg-ucitel.html` — přehled celé třídy, detail žáka (atributy/úkoly/artefakty), export CSV, náhledy her, správa učitelů. Role v tabulce `roles` (allowlist e-mailů → `teacher`/`superadmin`), SECURITY DEFINER funkce `my_role()` + RLS politiky. Setup SQL: `rpg-cloud-setup-phase2.sql`. **Role:** student (default) < teacher (čte vše, náhledy, export) < superadmin (maže/upravuje postavy, odměny, spravuje učitele). `rpg-cloud.js` exportuje `getRole/isStaff/isAdmin/listAllSaves/pullSaveFor/updateSaveFor/deleteSaveFor/listRoles/upsertRole/deleteRole/requireStaff`.
- **Náhledový režim her** (řeší `attachGame` v rpg-cloud.js, žádné per-game edity): `?preview=1` = hra nanečisto (sandbox localStorage, nic se neukládá); `?su=<user_id>` = učitelský read-only pohled na postavu žáka (stáhne save, skočí na mapu, banner). Sandbox přepisuje `localStorage.get/set/removeItem` jen pro daný SAVE_KEY do `memStore`.
- **Škálování úloh (rozšiřující banka)** `projects/rpg-tasks-9.js` — pilot na 9. ročníku. Modul nastaví `window.RPG_TASK_EXTRA_9 = { '<mid>': ()=>[task,…], … }` (21 misí). Engine v `launchBattle` sloučí základní `m.tasks()` s bankou a `shuffleArr(pool).slice(0,m.tc)` vylosuje `tc` úloh ⇒ každé hraní/opakování jiné příklady. **Graceful:** bez modulu hra běží na základním poolu. Žádná změna save formátu (done stále `mid-i` do `tc`). MC mise (`1-1,2-1,3-1,4-1,5-1,6-1`) smí mít jen numerické/ANO-NE odpovědi. Audit: `tests/rpg-tasks-9.audit.cjs` (stub helperů, 378k generací, NaN/MC). Rozšiřovat: přidat generátory do banky, je-li potřeba i do ostatních her (`rpg-tasks-6/7/8.js`) stejným vzorem.
- **Trénink + mastery (9. ročník)** — samostatná obrazovka `s-train` (nezasahuje do bojového enginu). Tlačítko na mapě → výběr tématu (21 misí s ukazatelem pokroku) → nekonečné procvičování z téhož sloučeného poolu (base+banka), bez HP/časomíry/boje, s nápovědami a počítadlem (správně/celkem/série). **Mastery:** `S.mastery[mid]={score,mastered}`, mistrovství při `MASTERY_GOAL=15` správných; badge 🏅 v tréninku i v seznamu misí oblasti. Save migrace: `if(!S.mastery)S.mastery={}` v loadS/import. Funkce: `renderTrainPicker/startTrain/trDraw/trRender/trRenderMC/trPickMC/trSubmit/trCorrect/trWrong/trHint/trNext/trEnd/masteryOf`. Test: `tests/rpg-train.test.cjs` (12) + `tests/rpg-train-6/7/8.test.cjs`. ✅ **HOTOVO i pro 6./7./8.** — banka+trénink+mastery běží ve všech 4 ročnících; mastery je v učitelské konzoli (`buildMasteryHtml`).
- **Doporučené procvičování (mapa, všechny 4 ročníky)** — panel `#map-recommend` na mapě navrhne žákovi misi s nejvíc chybami (`S.errs`), kterou ještě nezvládl (vyloučí `masteryOf(mid).mastered` a mise s <2 chybami). Tlačítko „🎯 Procvičit" → `goPractice(mid)` = `go('train')`+`startTrain(mid)`. Funkce `recommendedMission/goPractice/renderRecommend` (volá se z `renderMap`). Graceful: bez chyb panel skrytý. Test: `tests/rpg-recommend.test.cjs` (36 = 9×4).
- **Učitelská konzole — Fáze 3 (hotovo)** — **hromadné akce** (superadmin: checkboxy v přehledu → bulk +XP / bulk unlock; cross-grade guard), **třídy** (`classes` + `class_members`, učitel přiřazuje ručně, klidně napříč ročníky; záložka „TŘÍDY", filtr přehledu podle třídy) a **poznámky k žákům** (`notes`, vidí je učitel i sám žák). Setup SQL: `rpg-cloud-setup-phase3.sql`. `rpg-cloud.js` přidává `listClasses/createClass/renameClass/deleteClass/listMemberships/addToClass/removeFromClass/listNotesFor/addNote/deleteNote/pullMyNotes`. **In-game vzkazy:** plovoucí widget „📨 Vzkazy (N)" řeší centrálně `attachGame`/`refreshNotesWidget` v rpg-cloud.js (žádné per-game edity) — po přihlášení žáka stáhne `pullMyNotes()` a ukáže panel; bez přihlášení/cloudu skrytý.
- **Learning content (Teorie, hotovo)** — moduly `projects/rpg-learn-6/7/8/9.js` nastaví `window.RPG_LEARN_X = { '<mid>': { intro, sections[], formulas[], examples[], video } }` (21 misí/ročník). Obrazovka `s-learn` + tlačítko „📖 Teorie" u každé mise v každé hře (graceful: bez modulu se tlačítko nezobrazí). Videa z kanálu `@matematikajednoduse` (Lucie Straková), `video:null` kde kanál nemá ekvivalent. Funkce ve hře: `startLearn/renderLearn/launchLearnBattle/esc2`.
- **Odznaky + denní série (pilot 9. ročník)** — gamifikace motivace, čistě klientská (žádné SQL). `ACH` pole 15 odznaků (boot/crit/combo5/flawless/flash/survivor/area1/half/root/lv5/lv10/master1/train50/streak3/streak7). Stav: `S.ach{id→datum}`, `S.stats{crits,trainCorrect,bestCombo}`, `S.streak{count,last}`. Centrální `evalAch(ev)` volaný z `awardXp`/správných větví boje/`checkMissionComplete`/`trCorrect`; odemčení → fronta toastů `achToast`. `touchStreak()` (po sobě jdoucí dny) z `startGame`/`continueGame`, čip 🔥 na mapě. Profil má mřížku `#pr-ach`. Save migrace v `loadS`/import. Test: `tests/rpg-ach.test.cjs` (11, Playwright). ✅ **HOTOVO** — odznaky+streak jsou ve všech 4 ročnících; žebříček třídy hotový (Fáze 4, viz níže).
- **Žebříček třídy (Fáze 4)** — student-facing motivace. SQL `rpg-cloud-setup-phase4.sql`: funkce `leaderboard(p_game)` SECURITY DEFINER, vrací jen `display_name/xp/lvl/is_me` SPOLUŽÁKŮ (sdílí aspoň jednu třídu přes `class_members`) v daném ročníku — žádné e-maily/celé savy (soukromí). `rpg-cloud.js`: `leaderboard(game)` (RPC) + `renderLeaderboardInto(elId,game)` (centrální render, žádné per-game edity); volá se z `attachGame` onChange přes `window.renderMap`. Ve hře panel `#map-leaderboard` na mapě + hook v `renderMap` (graceful: bez cloudu/přihlášení/spolužáků skrytý, <2 řádky skrytý). Test: `tests/rpg-leaderboard.test.cjs` (9). **Nasazení:** spustit phase4.sql po fázích 1–3.
- **Diagnostika chybovosti (učitel)** — heatmapa „kde žáci tápou". Ve hře `S.errs{mid→počet}` se inkrementuje v `damagePlayer()` (špatná odpověď i timeout) + `saveS()`; migrace v loadS/import/init. Konzole `rpg-ucitel.html` má záložku **DIAGNOSTIKA**: výběr ročníku + **filtr třídy** (`#diag-class`, přes `membersOfClass`) → `renderDiag()` agreguje napříč savy per mise (dokončilo X/Y, ⌀ chyb na žáka), barví buňky `hsl` zeleně→červeně (⌀0→⌀~4). Používá `MISSIONS_BY_GAME` (jména misí už v konzoli jsou). `S.errs` se plní z boje i tréninku. **Trend v čase (klientsky, bez SQL):** `snapErrs()` ve hrách při `continueGame` zapíše max 1× týdně snímek `{t,errs}` do pole `S.errsSnap` (cap 12 ≈ 3 měsíce, migrace v loadS/import). Konzole v každé buňce ukáže „nově +X chyb (minule +Y)" — delta posledních dvou týdenních snímků agregovaná přes třídu, 🔽 zlepšení / 🔺 zhoršení. Naplní se po pár týdnech. Test: `tests/rpg-diag-console.test.cjs` (11, Playwright). **TODO (fáze 6+):** přemigrovat `S.errsSnap` do nové SQL tabulky (error_events nebo snap_events) — až budou hotové hlavní priority.
- **Ročníkové kohorty tříd + hromadné akce (Fáze 5)** — SQL `rpg-cloud-setup-phase5.sql` přidá do `classes` sloupce `cohort_start_year int` (kalendářní rok září, kdy kohorta nastoupila do 6. tř.) a `section text`. **Aktuální ročník se POČÍTÁ z data** (`gradeOfCohort` v `rpg-ucitel.html`), takže se třída po **1. září** sama posune (6.B→7.B→…) bez cron jobu. `rpg-cloud.js`: `createClass(name,meta)` + `updateClassMeta(id,{name,section,cohort_start_year})`, `listClasses` vrací nové sloupce. Konzole: formulář tvorby (označení + „ročník teď" → dopočítá `cohort_start_year`), badge `📈 25/26–28/29`, `editCohortUI`; **hromadné akce nad celou třídou** `classAwardXp/classUnlock/classDeleteChars` (unlock jen pro mise daného ročníku kohorty), `rowsOfClass(cid)`; **bulk smazání vybraných postav** `bulkDelete()` (superadmin, vedle bulk +XP/unlock). Helpery `schoolYearStart/gradeOfCohort/syLabel/cohortRangeLabel/classLabel/cohortStatus`. Test: `tests/rpg-cohort.test.cjs` (16, čistý Node, hlídá posun 1.9.). **Nasazení:** spustit phase5.sql po fázi 3.
- **Online přítomnost + hromadné poznámky (Fáze 5.1)** — **Heartbeat:** `attachGame` v `rpg-cloud.js` každých 120 s udělá push saveKey → udržuje `updated_at` čerstvé. **Indikátor online:** `onlineDot(updated_at)` v konzoli: 🟢 <3 min, 🟡 <20 min, prázdné jinak. Přehled se auto-refreshuje každých 60 s (`setInterval(renderTable, 60000)`). **Hromadné poznámky třídě:** každá třída v záložce TŘÍDY má textové pole + tlačítko „Odeslat" → `classNote(cid)` zavolá `RPGCloud.addNote(uid, body)` pro každého žáka třídy.
- **VFX přístupnostní přepínač** — `S.settings.reducedMotion` (bool, migruje se v `loadS`). `applyMotionPref()` přepíná CSS třídu `reduced-motion` na `<html>`. `toggleReducedMotion(on)` uloží + aplikuje. CSS `.reduced-motion` skrývá/deaktivuje: `.float-txt`, `#hit-vignette`, `#levelup` animace, `.victory-banner`, `.gold-drop`/`.particle`, `.hit-flash`/`.player-hit`/`.charge`. Checkbox `#pr-rm` v profilu (panel „NASTAVENÍ ⚙️") ve všech 4 hrách. `applyMotionPref()` se volá i z `startGame`/`continueGame`.
- **CERMAT odpočet (9. roč.)** — chip na mapě `rpg-mat-9.html` `#map-cermat` (klikací odkaz na `prijimacky-matematika/`), `updateCermatChip()` + `setInterval 60s`, datum v konstantě `CERMAT_DATE` (placeholder `2027-04-13`), modrý/červený (`<14 dní`), po termínu skrytý.
- **Font teorie** — sekce `s-learn` ve všech 4 hrách používají `--read` (Lexend) místo VT323 pro tělo/příklady/intro (čitelnější); nadpisy/vzorce zůstávají pixelové.
- **Věž legend (Fáze 11, VŠECHNY 4 ročníky)** — soutěžní výstup věží: patro = 1 příklad, obtížnost roste (patro 1–21 = mise vzestupně, výš náhodně z posledních 2 oblastí), časový limit se zkracuje (`twLimit`: 40 s → min 12 s), 3 ❤ na pokus, **bez nápověd**. Obrazovka `s-tower` v `rpg-mat-6/7/8/9.html` (stav `TW`, funkce `renderTowerGate/twStart/twDrawTask/twSubmit/twCorrect/twWrong/twEndRun/twExit`), canvas animace rotující točité věže s okny (barva oken tématická per ročník: 6=cyan, 7=jantar, 8=fialová, 9=neonová cyan) + hrdina na římse (smyčka `TWA`, export `RPGSpritesN.drawHeroOn`; respektuje reduced-motion). Port z 9. do 6./7./8. proběhl přes `tools/port-tower.cjs`. **Vstup hlídá SERVER:** RPC `tower_eligible` porovná ročník hry s kohortou třídy žáka (Fáze 5) — bez přihlášení login prompt, špatný ročník zamčeno, bez cloudu practice režim (jen lokální rekord `S.tower.best`). SQL `rpg-cloud-setup-phase11.sql`: tabulky `tower_runs` (best per user/game/sezóna) + `tower_hall` (síň slávy, bez FK — přežije smazání účtu), RPC `tower_eligible/tower_submit/tower_board/tower_hall_of_fame/tower_close_season` (SECURITY DEFINER, anon revoked dle Fáze 9). `rpg-cloud.js` exportuje `towerEligible/towerSubmit/towerBoard/towerHall/towerCloseSeason`. Konec roku: učitel v konzoli (záložka **VĚŽ LEGEND**: žebříček sezóny + síň slávy + tlačítko Uzavřít sezónu, funkce `renderTower/closeSeasonUI/towerGameSel`) zapíše top 10 sezóny natrvalo do síně slávy. Odměna +2 XP/patro (cap 40), žádné kredity (anti-farming). Testy: `tests/rpg-tower.test.cjs` (24, Node mock) + `tests/rpg-tower-game.test.cjs` (**108 = 27×4 ročníky**, Playwright vč. XSS jmen a reduced-motion) + `tests/rpg-tower-console.test.cjs` (12, konzole).
- **Testy:** `tests/rpg-cloud.test.cjs` (Fáze 1, 24) + `tests/rpg-teacher.test.cjs` (Fáze 2, 50) + `tests/rpg-classes.test.cjs` (Fáze 3 cloud, 28, čistý Node mock) + `tests/rpg-classes-console.test.cjs` (Fáze 3 konzole, Playwright, 11) + `tests/rpg-learn.test.cjs` (teorie 4 ročníky, 56) + `tests/rpg-tasks-9.audit.cjs` (banka, 378k) + `tests/rpg-leaderboard.test.cjs` (Fáze 4 žebříček, 9) + `tests/rpg-diag-console.test.cjs` (diagnostika heatmapa, 9, Playwright) + `tests/rpg-cohort.test.cjs` (ročníkové kohorty, 16, čistý Node) + `tests/rpg-ach.test.cjs` (odznaky, 11) + `tests/rpg-tasks-integration.test.cjs` (8) + `tests/vstudents.harness.cjs` (30 virtuálních žáků projde hry — boje/teorie/trénink, hlídá JS chyby). Playwright headless s mock Supabase klientem (jsdelivr CDN je v sandboxu blokované 403 ⇒ injectovat mock přes `addInitScript`; síťový šum `ERR_CERT_AUTHORITY_INVALID` z blokovaného CDN ignorovat). Chromium binárka: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

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

## Sdílená peněženka + Globální profil (varianta 2, hotovo)
- **`projects/rpg-wallet.js`** — `window.RPGWallet` IIFE, jediný zdroj pravdy pro GLOBÁLNÍ věci sdílené napříč všemi hrami i HUBem přes localStorage `RPG_HUB_WALLET` (stejný origin). Drží: `credits` (univerzální měna), `cosmetics` (koupíš jednou, nosíš všude), `settings.reducedMotion` (globální VFX). Per-game saves `RPG_MAT_X` si dál drží POSTUP/atributy/achievementy/mastery/chyby. Katalog `SHOP_ITEMS` (15 položek: border/badge/theme/victory) je tady — hry i HUB ho čtou přes `items()`. Anti-cheat `_sanitize()`: kredity nezáporné celé, aktivní kosmetika musí být vlastněná/zdarma, neznámá ID zahozena. **Graceful:** bez modulu hra spadne zpět na per-game chování (`typeof RPGWallet !== 'undefined'`). API: `get/getCredits/earn/buy/activate/owns/activeId/isActive/cssFor/getReducedMotion/setReducedMotion/items/itemById/migrateFrom/absorbGame/onChange`.
- **`migrateFrom(gameKey, legacyS)`** — jednorázová migrace per-game kreditů/kosmetiky do peněženky (sleduje `w.migrated`). **`absorbGame(gameKey, legacyS)`** — net-new delta absorb pro HUB: při každé návštěvě stáhne nově vydělané per-game kredity bez dvojího započítání (sleduje `w.absorbed[gameKey]`). Pokles per-game zůstatku (utratil ve hře) jen posune značku dolů, nerefunduje.
- **Globální profil v HUBu** (`projects/rpg-matematika.html`): widget `#gprofile` — avatar s kosmetickým rámem, jméno s badge barvou, sdílená peněženka s kredity, atributy AGREGOVANÉ přes všechny hry, odznaky SLOUČENÉ přes všechny hry; `#shop` sdílený obchod (4 kategorie, kupování/aktivování); globální VFX toggle. `render()` volá `RPGWallet.absorbGame(g.key,S)` pro každou rozehranou hru ⇒ HUB drží kredity synchronní. `RPGWallet.onChange` re-renderuje profil i obchod.
- Kredity v hrách: 5/7 kr za správnou odpověď (crit), 2 kr opakování, 15 kr za splnění mise (jednou, `S.creditsClaimed`), 1/30 kr trénink (mastery), 5/10/20 kr denní série. Per-game obchod (`renderShop/buyItem/activateItem/sanitizeCosmetics/applyCosmetics`) ve všech 4 hrách.
- Testy: `tests/rpg-wallet.test.cjs` (27), `tests/rpg-shop-hostile.cjs` (60 nepřátelských žáků, 16 invariantů).

## Vysvětli postup (self-explanation, Snorkl-style, hotovo)
- Po správné odpovědi v boji (jen text input, **ne MC**) se ukáže volitelné pole „Jak jsi na to přišel?" (`#bt-explain` + `#bt-explain-txt`). `nextTask()` ho přečte a pošle přes `RPGCloud.saveExplanation('RPG_MAT_X', mid, text)` do Supabase. Učitel čte v konzoli v záložce **VYSVĚTLENÍ**. Ve všech 4 hrách. Setup SQL: `rpg-cloud-setup-phase6.sql` (tabulka `explanations` + RLS). Testy: `tests/rpg-explain.test.cjs` (10).

## Bezpečnost (audit + opravy, hotovo)
- **`esc()` ve všech HTML/JS, které vkládají user-controlled data do innerHTML, MUSÍ escapovat i jednoduché uvozovky** (`'`→`&#39;`) kvůli `onclick='...'` kontextům. Opraveno v `rpg-ucitel.html` a `rpg-cloud.js`.
- **Stored XSS (kdysi kritická):** v učitelské konzoli se VŠECHNA pole ze save žáka (které žák ovládá) MUSÍ obalit `esc()` před vložením do innerHTML. Konkrétně byl děravý `d.teacherUnlocked.join(', ')` → opraveno. Pravidlo: žák může do svého save zapsat cokoli (Supabase RLS chrání server, ne render v cizím prohlížeči), takže konzole je nepřátelské prostředí.
- Wallet je localStorage-only ⇒ kredity/kosmetika jsou client-trusted (přijatelné, čistě kosmetické, žádný dopad na obtížnost/postup). XP/level/postup taky client-trusted (přijatelné pro učební nástroj).
- **Hack test:** `tests/rpg-hack.test.cjs` (71 kontrol) — wallet sanitize tamper, credits edge cases, absorbGame abuse, cosmetic bypass, 6 XSS payloadů × hub/inv/wallet/game, save flooding. Vše odoláno. **Stres:** `tests/vstudents-stress.harness.cjs` (120 žáků, 30/hra) + hub render test.

## What's still pending (Jun 2026 state)
- ~~Port trénink+mastery+odznaky na 6./7./8.~~ ✅ — **VŠE HOTOVO.** Všechny 4 hry mají `s-train`+mastery, `ACH`+streak, rozšiřující banku (`rpg-tasks-6/7/8/9.js`, 21 misí každá) i teorii (`rpg-learn-6/7/8/9.js`). Audity + train/ach/learn testy zelené.
- ~~Mastery badge v detailu žáka~~ ✅ — `buildMasteryHtml` v konzoli hotovo (PR #65).
- ~~Sdílená peněženka + globální profil~~ ✅ — viz sekce výše (PR #69).
- ~~Věž legend pro 6./7./8.~~ ✅ — **HOTOVO ve všech 4 ročnících** (port z 9., `tools/port-tower.cjs`, `RPGSpritesN.drawHeroOn`, tematická barva oken). Test `rpg-tower-game.test.cjs` běží 108× (27×4).
- ~~Živý souboj (Quizizz/Kahoot-style)~~ ✅ — **HOTOVO** (`rpg-battle-ui.js` = `RPGBattle`, banky `rpg-battle-6/7/8/9.js`, SQL `rpg-cloud-setup-phase7.sql`: `battles`/`battle_players`/`battle_invites`). Tlačítko „⚔️ ŽIVÝ SOUBOJ" na mapě ve všech hrách (`openBattle()`).
- ~~`errsSnap` → SQL migrace~~ ✅ — **HOTOVO (fáze 6b):** tabulka `snap_events` (`rpg-cloud-setup-phase6b.sql`), `RPGCloud.pushErrsSnap/listErrsSnaps`, hry pushují při `snapErrs()` + jednorázová migrace přes `S.snapsMigrated`, konzole preferuje SQL snímky (`SNAP_DATA`) s fallbackem na save JSON. Test: `tests/rpg-snap.test.cjs` (13).
- **Wallet cross-device sync** — kredity slučovány `max()` (kid-friendly, nikdy neztratí vlastněnou kosmetiku); okrajový případ „obě zařízení offline vydělají" ztratí pár kreditů — přijatelné pro čistě kosmetickou měnu.
- ~~Přijímačky PDF~~ ✅ — všech 45 PDF existuje, žádný chybějící odkaz.
- ~~Únikovky hinty~~ ✅ — všech 20 L3 hintů sedí přesně na kódy zámků (procenta i tělesa).
- **1. stupeň (3./4./5. ročník)** — nové hry `rpg-mat-3/4/5.html` (Kouzelný les 🌳 / Pirátská plavba 🏴‍☠️ / Dračí říše 🐉), každá s `rpg-sprites/tasks/learn/battle-N.js`. HUB má přepínač 1./2. stupeň (`RPG_HUB_STUPEN`). BEZ Věže legend. Časový limit úloh delší než u 2. stupně: `TIME_PER_TASK` = 60/55/50 s (3/4/5) vs 40 s u 6.–9. (menší děti). Deep harness pokrývá [3,4,5,6,7,8,9] = 113 testů. Vše v PR #139 (větev `claude/rpg-grade4-pilot`).
- **TODO — videa Matýskova matematika (1. stupeň):** v `rpg-learn-3/4/5.js` má každá z 63 misí `video:{url,title}` mířící zatím jen na úroveň **dílu/sekce** webu (geometrie → `/geometrie-N/`, ostatní → `/N-rocnik-1-dil/` nebo `/2-dil/`, 3. roč. → `/vyukova-videa/`). **Vojta na začátku příštího školního roku (~září 2026) dodá přesné přiřazení mise → strana učebnice** → potom přepsat `url` na konkrétní stránkové video `…/N-rocnik-M-dil/video/str-XX/`. **Připomenout Vojtovi.**

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
