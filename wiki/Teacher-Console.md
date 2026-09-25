# Učitelská konzole

<https://mrkonopa.github.io/projects/rpg-ucitel.html> · soubor `projects/rpg-ucitel.html`

**Návod je v konzoli:** tlačítko **?** vpravo dole (nápověda k otevřené záložce), malé **?** u méně
samozřejmých prvků a **↻ Úvod**. Tady je jen mapa, ať víš, kam kliknout.

## Role

| Role | Kdo | Co smí |
|---|---|---|
| `student` | každý přihlášený žák | hrát, ukládat, číst vlastní data |
| `teacher` | e-maily v tabulce `roles` | číst vše, náhledy, export, diagnostika, úkoly |
| `superadmin` | Vojta | navíc úpravy a mazání postav, odměny, správa učitelů, aktivita |

Učitele přidává superadmin v záložce **SPRÁVA UČITELŮ**.

## Záložky

| Záložka | Pro koho | K čemu |
|---|---|---|
| PŘEHLED ŽÁKŮ | učitel | tabulka žáků, online stav, export CSV, detail žáka, zaškrtávátko **Skrýt učitele** |
| TŘÍDY | učitel | třídy s ročníkovou kohortou (po 1. 9. se posunou samy), hromadné vzkazy |
| 📋 ÚKOLY | učitel | „procvič misi X do data", žák to vidí ve hře |
| DIAGNOSTIKA | učitel | kde třída tápe: chybovost po misích a trend |
| 📝 PŘIJÍMAČKY | 9. ročník | připravenost žáků a slabé okruhy celé třídy |
| 🏆 ŽEBŘÍČKY | učitel | pořadí žáků ročníku podle XP (žák ve hře vidí jen spolužáky) |
| VĚŽ LEGEND | jen 6.–9. | žebříček sezóny, síň slávy, uzavření sezóny |
| ⚔️ SOUBOJE | učitel | souhrn odehraných živých soubojů i s pořadím |
| VYSVĚTLENÍ | učitel | jak žáci popsali svůj postup |
| ZPĚTNÁ VAZBA | učitel | nápady a hlášení od žáků |
| NÁHLED HER | učitel | hra nanečisto (`?preview=1`, nic se neukládá) |
| SPRÁVA UČITELŮ | jen superadmin | přidání a odebrání učitelů |
| 📜 AKTIVITA | jen superadmin | záznam zásahů učitelů do postav žáků |

Čtení postavy žáka bez možnosti změny: odkaz 👁 v detailu žáka (`?su=<id>`).
