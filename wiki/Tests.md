# Testy

Všechno běží přes jednu bránu, `tests/run-ci.cjs`. Ta si testy najde sama
(`*.test.cjs`, `*.audit.cjs` a hloubkový harness), takže žádný ruční seznam nezastará.

```bash
node tests/run-ci.cjs               # celá brána (lokálně všechno)
node tests/run-ci.cjs --only=node   # jen testy bez prohlížeče (asi 1,5 min)
node tests/run-ci.cjs --list        # co brána spustí
node tests/<soubor>.cjs             # jeden test
```

- **CI** (`.github/workflows/tests.yml`) běží na každém PR ve čtyřech jobech: rychlé testy bez
  prohlížeče a tři díly s Playwrightem. Kromě toho běží CodeQL.
- **Úplnost brány hlídá test:** `tests/brana-uplnost.test.cjs` shodí bránu, když v `tests/` leží
  test, který v ní není. `tests/stranky-uplnost.test.cjs` totéž dělá pro seznam stránek,
  které procházejí plošné audity.
- **SQL testy** potřebují PostgreSQL 16. Lokálně se bez něj přeskočí, na CI se přeskočení počítá
  jako chyba.
- **Týdenní kontroly:** `update-cermat.yml` (termín přijímaček, pondělí) a `videa.yml`
  (videa na YouTube, středa). Mrtvé video založí issue „Mrtvá videa na YouTube".

Pravidla psaní testů (sabotáž, práh z měření, žádný tichý `catch`, druhý zdroj pravdy) jsou
v [CLAUDE.md](https://github.com/mrkonopa/mrkonopa.github.io/blob/main/CLAUDE.md).
