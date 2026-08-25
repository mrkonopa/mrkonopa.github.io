# Měření výkonu arény na školním Chromebooku

Tohle je jediné měření, které se nedá udělat odjinud. Všechna dosavadní čísla
jsou z vývojových strojů, kde hra stíhá se ztrátou 0,0 % snímků — takže se
z nich nedá poznat, jestli se na školním zařízení něco seká.

Zabere to asi deset minut. Není k tomu potřeba nic instalovat.

---

## Co se měří a proč zrovna to

Sonda tiskne pět údajů, ale **rozhoduje jediný: `ZAHOZENO`** — kolik procent
snímků prohlížeč nestihl vykreslit. To je to, co dítě vidí jako sekání.

Milisekundy práce samy o sobě nestačí: na výkonném stroji vyjde 0 % i při
dvojnásobné zátěži. A odstup snímků je zamčený na obnovovací frekvenci, takže
o zátěži neříká nic — na to doplatila obě dosavadní měření.

---

## Postup

Na **školním Chromebooku**, v Chrome:

1. Otevři hru — postupně **6. ročník**, **3. ročník** a **9. ročník**.
   (Nejdražší, druhý nejdražší a nejlevnější. Víc her netřeba.)
2. Založ postavu, vejdi do **první oblasti** a nech rozjetý boj.
3. Otevři konzoli: **Ctrl + Shift + J**.
4. Otevři `tools/probe-plocha.js` z repa, **zkopíruj celý obsah** a vlož ho do
   konzole. Potvrď Enterem. Vypíše `[RPGProbe] připraveno`.
5. Napiš `RPGProbe.start()` a **nech to 5 sekund běžet**.
   ⚠ Záložka musí zůstat **aktivní** — na pozadí prohlížeč kreslení uspí
   a naměřilo by se nesmyslných nula snímků.
6. Napiš `RPGProbe.report()`.
7. Vyfoť nebo zkopíruj výstup.

**A pak to celé zopakuj podruhé s vypnutými efekty** — v profilu zaškrtni
„Vypnout vizuální efekty". Ukáže to, kolik z té zátěže dělá mihotání pozadí.

---

## Co mi poslat

Pro každou ze tří her, v obou režimech, stačí tyhle čtyři řádky:

```
  VÝPLNÍ        1689
  PRÁCE        0.800 ms  ⌀ 0.848 · max 1.700
  SNÍMKY          60 Hz   odstup ⌒ 16.7 ms · max 16.8
  ZAHOZENO     0.0 %     (0 z 240)
```

Kdyby `SNÍMKY` ukázaly jiné číslo než 60 Hz, je to v pořádku — Chromebooky
běžně jedou na 48 nebo 50 Hz a sonda s tím počítá (referenci si bere z mediánu
naměřených odstupů, ne z pevných 16,66 ms).

---

## Co se stane potom

Rozhodovací pravidlo je dohodnuté dopředu, aby se to nemuselo řešit znovu:

| ZAHOZENO | co se udělá |
| --- | --- |
| **pod 2 %** | **nic.** Hra stíhá a optimalizace by byla práce bez dopadu. |
| **2–10 %** | zlevní se **6. a 3. ročník**, tedy dva nejdražší světy. |
| **nad 10 %** | zlevní se napříč, počínaje mihotáním pozadí. |

Pro srovnání, naměřeno v sandboxu (výkonný stroj, 60 Hz):

| | výplní / snímek | zahozeno |
| --- | --- | --- |
| 6. ročník | 1 689 | 0,0 % |
| 3. ročník | 1 590 | 0,0 % |
| 9. ročník | 694 | 0,0 % |

**Pořadí se bere podle výplní, ne podle milisekund.** Počet výplní je mezi
běhy stabilní na jednotku přesně; naměřený čas kolísá podle toho, čím je
stroj zrovna zaneprázdněný, a v sandboxu se mezi dvěma běhy lišil skoro
dvojnásobně. Cenu přitom nese právě počet volání — ověřeno: při stejném počtu
volání je čtyřnásobná plocha zadarmo (0,99 ×), kdežto čtyřnásobek volání při
stejné ploše stojí přesně 4,00 ×.
