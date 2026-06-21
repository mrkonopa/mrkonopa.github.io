# Živý souboj — multiplayer Kahoot-styl

Soubor UI: `projects/rpg-battle-ui.js` (exportuje `window.RPGBattle`)

## Spuštění

Ve hře na mapě: tlačítko **⚔️ ŽIVÝ SOUBOJ** → `openBattle()`.

Vyžaduje:
- Přihlášení (`RPGCloud.currentUser()`)
- Načtený modul `rpg-battle-ui.js`
- Banka otázek `rpg-battle-X.js` (`window.RPG_BATTLE_X`)

## Průběh hry

```
Lobby (čekárna, kód WXYZ)
  ↓ host spustí
Otázka 1/N (odpočet 3-2-1, přeskočí při reduced-motion)
  ↓ všichni odpoví / vyprší čas
Mezikolo (průběžný žebříček s 🥇🥈🥉)
  ↓ host posune
Otázka 2/N ...
  ↓
Výsledky (žebříček, winner banner)
  ↓ host klikne "Odveta"
Lobby (stejná místnost, nové otázky)
```

## Herní módy

### Každý sám (výchozí)
- Individuální skóre, výsledkový žebříček po konci

### Týmový mód (🔵 vs 🔴)
- Host přepne tlačítkem „Týmy" před spuštěním místnosti
- Hráči jsou automaticky rozděleni do dvou týmů (balancing)
- Lobby zobrazí dva sloupce: Modří / Červení
- Průběžný žebříček + výsledky ukazují celkové skóre týmů
- Banner: „Vyhráli modří! 🎉" / „Vyhráli červení! 🎉" / remíza

## Odveta (Rematch)

Host po skončení klikne **⚔️ Odveta** → `rematch_battle` RPC:
- Resetuje `status='lobby'`, `q_index=-1`, nové náhodné `q_seed`
- Nulovuje skóre všech hráčů
- Všichni klienti se vrátí do lobby (polling detekuje reset)
- Nové otázky vygenerovány z nového seeda

## Banka otázek

Soubory: `projects/rpg-battle-6/7/8/9.js`

Nastaví `window.RPG_BATTLE_X = { build(seed, count) }`:

```javascript
window.RPG_BATTLE_9 = {
  build: function(seed, count) {
    // deterministický generátor (seed → stejné otázky pro všechny)
    return [
      {
        text: 'Kolik je 15 % z 200?',
        choices: ['30', '40', '20', '50'],
        correct: 0  // index správné odpovědi
      },
      ...
    ];
  }
};
```

**Pravidlo:** všechny 4 choices musí být různé, správná na indexu `correct`.

## SQL (Fáze 7 + 14)

Tabulky:
- `battles` — místnost (id, game, code, status, q_seed, q_count, q_index, team_mode)
- `battle_players` — hráči (battle_id, user_id, display_name, score, team)
- `battle_invites` — e-mailové pozvánky

Klíčové RPC:
- `create_battle_tm(game, qcount, host_name, team_mode)` — vytvoří místnost
- `join_battle(code, display_name)` — připojení (auto-balancing týmů)
- `battle_state(battle_id)` — polling stav (status, hráči, skóre, týmy)
- `submit_battle_answer(battle_id, q_index, choice, time_ms)` — odeslání odpovědi
- `advance_battle(battle_id)` — posun na další otázku (host only)
- `rematch_battle(battle_id)` — reset do lobby

## Klientský objekt RPGBattle

```javascript
RPGBattle.open({ game: 'RPG_MAT_9', name: 'Jméno', autoAction: 'host'|'join' })
RPGBattle._create(5)     // vytvoří místnost s 5 otázkami
RPGBattle._mode(1)       // 0=každý sám, 1=týmy
RPGBattle._rematch()     // spustí odvetu
```

## Statistiky soubojů

Tabulka `battle_results` (Fáze 13): uchovává historii každého souboje.
`RPGCloud.battleStatsMe()` — statistiky přihlášeného žáka (celkem soubojů, výher, přesnost).
`RPGCloud.battleStatsAll()` — statistiky všech pro učitelský přehled.

Zobrazen v profilu žáka (záložka SOUBOJE) jako widget s asynchronním načtením.
