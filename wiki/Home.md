# RPG Matematika — Wiki

Vzdělávací platforma pro žáky 6.–9. ročníku ZŠ Husova Liberec. Pixel-art RPG hry
s matematickými úlohami, cloudovým uložením postav, živými souboji a učitelskou konzolí.

## Přehled her

| Hra | Třída | Téma | Soubor |
|-----|-------|------|--------|
| RPG Matematika 6 | 6. ročník | 🚀 Vesmírná expedice | `projects/rpg-mat-6.html` |
| RPG Matematika 7 | 7. ročník | ⛏️ Ztracený chrám | `projects/rpg-mat-7.html` |
| RPG Matematika 8 | 8. ročník | 🎓 Matematická akademie | `projects/rpg-mat-8.html` |
| RPG Matematika 9 | 9. ročník | 💻 NULL_BYTE (cyberpunk) | `projects/rpg-mat-9.html` |

Každá hra: **7 oblastí × 3 mise × 6 úkolů = 126 úkolů**.

## Klíčové funkce

- 🎮 **Bojový engine** — pixel-art sprite animace, HP, combo, krit zásahy, boss
- 📚 **Teorie** — tlačítko „📖 Teorie" u každé mise; videa z @matematikajednoduse
- 🎯 **Trénink** — nekonečné procvičování bez HP/časomíry, mastery systém
- 🏅 **Odznaky** — 15 achievementů + denní série 🔥
- ⚔️ **Živý souboj** — multiplayer Kahoot-styl, týmový režim, odveta
- 🗼 **Věž legend** — soutěžní výzva, síň slávy, uzavírání sezóny
- 💰 **Sdílená peněženka** — kredity + kosmetika (rámy, témata, powerupy)
- 🏫 **Učitelská konzole** — přehled třídy, diagnostika, odznaky, live přítomnost
- ☁️ **Cloud sync** — Google přihlášení (`@husovaliberec.cz`), uložení přes zařízení

## Struktura repozitáře

```
projects/
  rpg-mat-6/7/8/9.html     # hry
  rpg-cloud.js             # Supabase Auth + cloud funkce
  rpg-wallet.js            # sdílená peněženka
  rpg-battle-ui.js         # live souboj UI
  rpg-battle-6/7/8/9.js   # banky otázek pro souboj
  rpg-tasks-6/7/8/9.js    # rozšiřující banky úloh
  rpg-learn-6/7/8/9.js    # obsah teorie (21 misí/ročník)
  rpg-ucitel.html          # učitelská konzole
  rpg-matematika.html      # hub (globální profil, obchod)
  rpg-cloud-setup*.sql     # SQL skripty pro Supabase
rpg-cloud-setup-security.sql  # bezpečnostní trigger
tests/                     # testovací suite (Node + Playwright)
```

## Stránky wiki

- [[Cloud Setup]] — pořadí SQL skriptů, Supabase konfigurace
- [[Teacher Console]] — role, třídy, diagnostika, hromadné akce
- [[Game Engine]] — save formát, XP, kredity, oblasti, mise
- [[Live Battle]] — souboj, týmový režim, banky otázek
- [[Tests]] — jak spouštět testy, co co testuje
- [[Adding Content]] — přidávání úloh, teorie, misí
