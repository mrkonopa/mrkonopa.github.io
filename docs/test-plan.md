# Plán obsahové revize (math + čeština + konzistence)

> Cíl: ověřit, že každý příklad **dává smysl matematicky i česky**, nejsou v něm
> překlepy, a sedí **zadání ↔ odpověď ↔ nápověda ↔ řešení ↔ teorie**.
> Tohle NENÍ o funkčních bugech (ty hlídají stávající testy — NaN, součty bodů,
> MC bezpečnost, JS chyby). Je to obsahový audit.

## Co testujeme (nové z posledních týdnů)

| Oblast | Soubory |
|---|---|
| CERMAT test | `projects/rpg-cermat-9.js` (16 úloh + varianty, `sol`, SVG) |
| Sponka | `projects/rpg-wallet.js` (hlášky společníka, triggery) |
| Banky příkladů (pestrost) | `projects/rpg-tasks-3.js … rpg-tasks-9.js` |
| Teorie (časté chyby + řešené příklady) | `projects/rpg-learn-3.js … rpg-learn-9.js` |
| (volitelně) živý souboj | `projects/rpg-battle-6…9.js` |

## Tři roviny kontroly

- **M — matematika:** výpočet sedí, odpověď odpovídá zadání, nápověda/`sol` vede
  správně, obtížnost pasuje na ročník, česká konvence (trojúhelníky = strana malým
  písmenem protilehlého vrcholu; `:` ne `÷`).
- **Č — čeština:** pravopis, překlepy, diakritika, terminologie, gramatika, tón pro žáka.
- **K — konzistence:** zadání ↔ odpověď ↔ hinty ↔ `sol` ↔ teorie spolu sedí;
  MC distraktory dávají smysl; popisky v SVG sedí na zadání.

## Metoda (2 vrstvy)

### 1) Automaticky (deterministicky)
Rozšířit stávající verifikátory (`tools/verify-cermat.cjs`, `verify-bank.cjs`,
`verify-learn.cjs`) o obsahové linty nad stovkami generací:
- zákaz `÷` (má být `:`), dvojité mezery, prázdné řetězce
- žádné zbytky šablon v textu (`${`, `undefined`, `NaN`)
- slovník častých českých překlepů + kontrola americké konvence trojúhelníků
- kde jde, nezávisle znovu-dopočítat odpověď

### 2) LLM obsahový audit (vzorek + ověření) — zvolená hloubka
- Vygenerovat vzorek (~40× na šablonu) do čitelného textového dumpu (zadání ·
  odpověď · hinty · `sol` · popis SVG).
- **1 agent na oblast/skupinu** projde vzorek a vrátí strukturovaný seznam nálezů:
  `soubor · typ (M/Č/K) · závažnost · návrh opravy`.
- **Adversariální ověření:** každý nález dostane druhý agent, který ho zkusí
  vyvrátit (přepočítá matiku, překontroluje češtinu) → projdou jen potvrzené.
- Sesbírat → deduplikovat → jeden žebříček nálezů.

### 3) Opravy + re-verify
Opravit potvrzené nálezy → znovu automatické verifikátory + `rpg-cermat.test.cjs`
+ `vstudents-deep.harness.cjs` → PR.

## Pořadí (pilot → rozjezd)

1. **PILOT: CERMAT test** — ověří postup (nejnovější, nejvíc namíchaný obsah).
2. **Sponka** — hlášky společníka (čeština, tón).
3. **Banky** `rpg-tasks-3…9.js` (1 agent na ročník).
4. **Teorie** `rpg-learn-3…9.js` (1 agent na ročník).

## Zvolená nastavení (2026-07-09)
- Hloubka: **vzorek + adversariální ověření**.
- Pilot: **CERMAT test**.

## Stav
- [x] Pilot CERMAT — automatická vrstva (`tools/cermat-audit-dump.cjs`, linty 0)
- [x] Pilot CERMAT — LLM audit + ověření (3 agenti + ruční dopočet)
- [x] Pilot CERMAT — opravy + re-verify (viz `docs/audit-cermat-2026-07.md`: 3 kritické, 6 major, 6 minor opraveno; verify-cermat 500 OK, test 19/19)
- [x] Sponka — hlášky zkontrolovány, bez oprav (gramaticky správné, genderově ošetřené, vhodný tón)
- [ ] Banky 3–9
- [ ] Teorie 3–9
