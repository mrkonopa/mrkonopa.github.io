# Živý souboj

Souboj celé třídy na stejné otázce naráz (styl Kahoot). Ve hře tlačítko **⚔️ ŽIVÝ SOUBOJ**
na mapě, souhrn odehraných místností v konzoli v záložce **⚔️ SOUBOJE**. Funguje jen
s přihlášením do cloudu.

| Co | Kde |
|---|---|
| rozhraní a průběh (lobby, otázky, žebříček, týmy, odveta) | `projects/rpg-battle-ui.js` (`window.RPGBattle`) |
| otázky pro ročník N | `projects/rpg-battle-N.js` (N = 3 … 9), generují se ze společného seedu, takže všichni vidí totéž |
| server | SQL fáze 7 (místnosti a hráči), 9 (utažení práv), 13 (trvalá historie), 14 (týmy a odveta) |
| testy | `tests/rpg-battle-questions.test.cjs` (dopočítává odpovědi všech sedmi bank), `tests/sql-phase7.test.cjs` |

Známé a vědomě přijaté riziko: správnost odpovědi hlásí klient (server nemá klíč, otázky vznikají
u žáka ze seedu). Body jsou omezené na otázku a souboj je pod dohledem učitele.
Podrobnosti jsou v CLAUDE.md v sekci Bezpečnost.
