# Game Engine

Každá hra je jeden HTML soubor (`projects/rpg-mat-3.html` … `rpg-mat-9.html`) a k němu moduly
se stejným číslem ročníku. Společné věci jsou ve sdílených modulech, ne v kopiích.
Kde přesně co je, najdeš ve zdrojáku podle názvu funkce. Proč je to tak, je v CLAUDE.md.

## Soubory jedné hry (N = 3 … 9)

| Soubor | Obsah |
|---|---|
| `rpg-mat-N.html` | engine hry: mapa, boj, trénink, profil, obchod |
| `rpg-tasks-N.js` | rozšiřující banka úloh (losuje se spolu se základními úlohami mise) |
| `rpg-learn-N.js` | teorie ke všem 21 misím, video u mise |
| `rpg-sprites-N.js` | svět, hrdina, parťák a bossové (kreslí sdílené jádro) |
| `rpg-battle-N.js` | banka otázek živého souboje |

## Sdílené moduly

| Soubor | Co drží |
|---|---|
| `rpg-shared.js` | vyhodnocení odpovědí (`checkAns`), společné pomocné funkce všech her |
| `rpg-2stupen.js` | jen 2. stupeň: Věž legend a to, co mají společné hry 6.–9. |
| `rpg-sprite-core.js` | kreslení postav a arén pro všech sedm ročníků |
| `rpg-hero-portraits.js` | portréty na kartách hubu (kopie arénových mřížek, hlídá test) |
| `rpg-icons.js` | pixelové ikony rozhraní |
| `rpg-learn-svg.js` | obrázky do teorie 1. stupně (`window.RPGDia`) |
| `rpg-svg-9.js` | kresby 9. ročníku, sdílené s přijímačkami |
| `rpg-tasktypes.js` | další typy úloh do tréninku (spojovačka, řazení) |
| `rpg-wallet.js` | peněženka a kosmetika sdílená všemi hrami a hubem |
| `rpg-cloud.js` | přihlášení, ukládání do Supabase, náhledy pro učitele, vzkazy |
| `rpg-badwords.js` | filtr nevhodných jmen (generuje `tools/build-badwords.cjs`) |

## Uložení

Postup je v `localStorage` pod `RPG_MAT_N` (a v cloudu, když je žák přihlášený). Peněženka je
společná pod `RPG_HUB_WALLET`. Při čtení se starší uložení doplní o chybějící části, takže nové
pole v uložení vždy potřebuje migraci v `loadS`.

Hlavní pravidla, na která se už doplatilo, jsou v CLAUDE.md v sekci „RPG Matematika série"
a „Recurring technical pitfalls". Patří k nim mise s volbami jen s číselnou nebo ANO/NE
odpovědí, `rm()` u animací a čárka místo tečky v zadáních.
