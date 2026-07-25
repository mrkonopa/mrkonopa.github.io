# RPG Matematika — runbook na začátek školního roku

Krok-za-krokem, co udělat v **září**, aby všechno šláplo hned první hodinu.
Vše se dělá v učitelské konzoli **`projects/rpg-ucitel.html`** (přihlaš se školním
Google účtem `@husovaliberec.cz`). Role `teacher`/`superadmin` se řídí tabulkou
`roles` v Supabase.

> **Kohorty se posouvají samy.** Třídy mají „rok nástupu do 6. třídy"
> (`cohort_start_year`), a **aktuální ročník se dopočítává z data**. Po **1. září**
> se `6.B` sama zobrazuje jako `7.B` atd. — **nepřejmenovávej je ručně.**
> (Ověřeno: `tests/rpg-cohort.test.cjs`, 16/0, hlídá posun k 1. 9.)

---

## 0) Jednorázově — ověř, že cloud běží (2 min)
Tohle stačí jednou za rok / po velké změně. Otevři konzoli, `F12 → Console`, vlož:

```js
(async () => {
  const C = window.RPGCloud, L=(...a)=>console.log('%c[CHECK]','color:#0a0;font-weight:bold',...a);
  L('přihlášen:', C.currentUser()?.email, '| role:', await C.getRole?.());
  L('tříd:', (await C.listClasses()).length);
  L('úkolů:', (await C.listAssignments()).length);
})();
```
Když vidíš svůj e-mail, roli `teacher`/`superadmin` a počty (bez `permission denied`),
je backend v pořádku. (SQL fáze 19 + 20 jsou nasazené a ověřené.)

---

## 1) Založ třídy pro nové šesťáky (záložka **TŘÍDY**)
Vracející se třídy **nezakládej znovu** — posunuly se samy. Zakládáš jen **nové 6. ročníky**.

1. Záložka **TŘÍDY → `+ Založit třídu`**.
2. Vyplň **označení** (např. `6.A`) a **„ročník teď" = 6**. Konzole z toho dopočítá
   `cohort_start_year` (letos = 2026) a ukáže badge `📈 26/27–29/30`.
3. Opakuj pro každou třídu (`6.A`, `6.B`, …).

## 2) Přiřaď žáky do tříd (záložka **TŘÍDY** / **PŘEHLED**)
Žáci se objeví, **až se aspoň jednou přihlásí a zahrají** (tím se jim vytvoří profil
v cloudu).

1. Řekni třídě: otevřít hru pro svůj ročník (`projects/rpg-matematika.html` → dlaždice),
   přihlásit se **školním Google účtem** a chvíli hrát.
2. V konzoli **PŘEHLED ŽÁKŮ** je uvidíš (🟢 = právě online).
3. V **TŘÍDY** u dané třídy přiřaď žáky (`+ Přidat`). Klidně napříč ročníky.

## 3) Zadej první úkoly (záložka **📋 ÚKOLY**)
1. **ÚKOLY → `+ Zadat úkol`**.
2. Vyber **třídu**, **hru/ročník**, **misi** a **termín (due date)**.
3. Žáci úkol uvidí ve hře jako plovoucí widget „📨 Vzkazy / úkoly"; ty sleduješ plnění
   ve sloupci pokroku (`X/Y splnilo`) — počítá RPC `assignment_progress`.

## 4) Průběžné sledování (během roku)
- **PŘEHLED ŽÁKŮ** — kdo je online, XP/level, atributy; auto-refresh 60 s.
- **DIAGNOSTIKA** — heatmapa „kde třída tápe" (⌀ chyb/mise), filtr podle třídy,
  trend v čase (naplní se po pár týdnech).
- **🏆 ŽEBŘÍČKY** — motivace; řazeno serverově (bezpečné proti podvodu, fáze 19).
- **VĚŽ LEGEND** — soutěžní žebříček; na konci roku archivuj top 10 do síně slávy
  (tlačítko *Uzavřít sezónu*). Přes prázdniny je věž zavřená sama.
- **VYSVĚTLENÍ / ZPĚTNÁ VAZBA** — co žáci píší „jak na to přišli".

---

## Časté otázky
- **„Žák se nemůže přihlásit."** Musí použít účet `@husovaliberec.cz` (jiné domény
  konzole odmítne). 2FA není potřeba.
- **„Nevidím žáka v přehledu."** Ještě se nepřihlásil / nezahrál — profil vzniká
  až prvním přihlášením + hraním.
- **„Musím po prázdninách přejmenovat třídy?"** Ne. Posun ročníku je automatický k 1. 9.
- **„Kde se dělá záloha?"** Postup žáků žije v Supabase (tabulka `saves`); kosmetika
  a kredity jsou v prohlížeči žáka (localStorage) — čistě kosmetické, neztratí postup.

## Co je připravené (stav pro školní rok 2026/27)
- 7 her (3.–9. ročník), teorie, trénink+mastery, věž legend (6.–9.), živé souboje.
- Sdílená peněženka + globální profil (HUB), odznaky + denní série.
- Učitelská konzole: přehled, třídy+kohorty, úkoly s termínem, diagnostika,
  žebříčky, věž, souboje, vysvětlení, správa učitelů, audit log.
- Testová brána běží automaticky na každém PR (GitHub Actions).
- Na mobilu/tabletu vyskakuje u číselných odpovědí numerická klávesnice.
