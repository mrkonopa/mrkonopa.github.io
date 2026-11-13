# Měření výkonu arény na školním tabletu

Tohle je jediné měření, které se nedá udělat odjinud. Všechna dosavadní čísla
jsou z vývojových strojů, kde hra stíhá se ztrátou 0,0 % snímků — z toho se
nepozná, jestli se na školním zařízení něco seká.

Zabere to pár minut a nic se neinstaluje.

---

## Nejdřív dobrá zpráva: dvě obavy odpadly

Obojí je změřené, ne odhadnuté:

**Retina displej nic nestojí.** Plátno arény se kreslí v CSS pixelech a
prohlížeč ho zvětší (`image-rendering: pixelated`, takže zůstane ostré).
Poměr pixelů displeje se do ceny nepromítne vůbec.

**Šířka okna taky ne.** Plátno má pevný rozměr — naměřeno 638 px u 2. stupně
a 572 px u 1. stupně, a to shodně při šířce okna 800, 820, 900 i 1180 px.
Na výšku i na šířku, iPad i Android.

Zbývá tedy jediná neznámá: **jak rychlý je ten konkrétní tablet.**

---

## Postup — jedno klepnutí

Na tabletu se konzole neotevře (iPad Safari ji bez Macu nemá vůbec, Android
Chrome jen přes USB ladění), takže se to dělá záložkou.

### Jednorázová příprava

Vytvoř si v prohlížeči záložku a jako **adresu** jí dej tohle:

```
javascript:(function(){var s=document.createElement('script');s.src='/tools/probe-plocha.js';s.onload=function(){RPGProbe.run(5)};document.body.appendChild(s)})()
```

Pojmenuj ji třeba **MĚŘENÍ**.

> Na iPadu: přidej libovolnou stránku do záložek, pak ji edituj a adresu
> přepiš tímhle. Safari neumí `javascript:` vložit rovnou při zakládání.

### Vlastní měření

Pro **6. ročník**, **3. ročník** a **9. ročník** (nejdražší, druhý nejdražší,
nejlevnější — víc her netřeba):

1. otevři hru, založ postavu, vejdi do **první oblasti** a nech rozjetý boj,
2. klepni na záložku **MĚŘENÍ**,
3. počkej 5 sekund — pak se přes obrazovku vysype panel s výsledkem,
4. vyfoť ho; klepnutím na panel ho zavřeš.

**A pak to celé zopakuj s vypnutými efekty** — v profilu zaškrtni „Vypnout
vizuální efekty". Ukáže to, kolik z té zátěže dělá mihotání pozadí.

---

## Co mi poslat

Stačí fotky panelů. Podstatné jsou dva řádky:

```
  VÝPLNÍ        1689
  ZAHOZENO     0.0 %     (0 z 236)
```

**Rozhoduje `ZAHOZENO`** — kolik procent snímků prohlížeč nestihl. To je to,
co dítě vidí jako sekání. Milisekundy práce samy o sobě nestačí: na výkonném
stroji vyjde 0 % i při dvojnásobné zátěži.

Kdyby `SNÍMKY` ukázaly jiné číslo než 60 Hz, je to v pořádku — tablety běžně
jedou na 48, 50 nebo naopak 120 Hz a sonda s tím počítá (referenci si bere
z mediánu naměřených odstupů, ne z pevných 16,66 ms).

---

## Co se stane potom

Rozhodovací pravidlo je dohodnuté dopředu, aby se to nemuselo řešit znovu:

| ZAHOZENO na tabletu | co se udělá |
| --- | --- |
| **pod 2 %** | **nic.** Hra stíhá a optimalizace by byla práce bez dopadu. |
| **2–10 %** | zlevní se **6. a 3. ročník**, tedy dva nejdražší světy. |
| **nad 10 %** | zlevní se napříč, počínaje mihotáním pozadí. |

Pro srovnání, naměřeno v sandboxu při rozměrech tabletu (820 × 1180, DPR 2):

| | výplní / snímek | zahozeno |
| --- | --- | --- |
| 6. ročník | 1 689 | 0,0 % |
| 3. ročník | 1 590 | 0,0 % |
| 9. ročník | 694 | 0,0 % |

**Pořadí ročníků se bere podle výplní, ne podle milisekund.** Počet výplní je
mezi běhy stabilní na jednotku přesně; naměřený čas kolísá podle zatížení
stroje a v sandboxu se mezi dvěma běhy lišil skoro dvojnásobně. Cenu přitom
nese právě počet volání — ověřeno: při stejném počtu volání je čtyřnásobná
plocha zadarmo (0,99 ×), kdežto čtyřnásobek volání při stejné ploše stojí
přesně 4,00 ×.

---

# Sonda „kam se poděla DÁLE“ (`tools/sonda-dale.js`, 13. 11. 2026)

Druhé měření, které se dá udělat jen na skutečném tabletu. Hlášení z hodiny
(iPad na šířku): po správné odpovědi — do pole i po A–D nebo ANO/NE — dítě tlačítko
DÁLE nenašlo. Automatické měření ho nenašlo ani na 5 912 krocích náhodného průchodu
(3., 4. a 5. ročník, iPad na šířku i na výšku, 10 semínek) ani ve WebKitu na velikosti
iPadu; chybí v nich dotyková klávesnice a iPadOS.

Sonda **nic ve hře nemění**, jen pozoruje `#next-btn` (boj) a `#tr-next-btn` (trénink)
a zapisuje, jestli je tlačítko opravdu k zastižení:

| značka | co znamená |
| --- | --- |
| **MIMO** | střed tlačítka leží mimo viditelnou část obrazovky (`visualViewport`), třeba pod klávesnicí |
| **ZAKRYTÉ** | v jeho středu je při dotyku jiný prvek (toast, lišta, panel, plovoucí tlačítko); sonda ho jmenuje |
| **BLEDÉ** | tlačítko je vypnuté déle než 0,8 s (vypadá jako zmizelé); prvních 0,4 s po zobrazení je vypnuté schválně |

Záložka (stejný postup jako MĚŘENÍ výše):

```
javascript:(function(){var s=document.createElement('script');s.src='/tools/sonda-dale.js';s.onload=function(){RPGDale.start()};document.body.appendChild(s)})()
```

Otevři hru, klepni na záložku a hraj. V pravém horním rohu je malý panel (nechytá
dotyk, jen ✕ ho vypne): kolikrát se DÁLE ukázalo a kolikrát mělo potíž. **Když DÁLE
zmizí, vyfoť obrazovku s panelem** — poslední záznam má polohu tlačítka, velikost
okna, výšku klávesnice a prvek, který leží v jeho středu.

Ověřeno v Chromiu na 1080 × 810: zdravý stav 0 potíží; tři sabotáže (překryv přes
DÁLE, DÁLE mimo obrazovku, DÁLE natrvalo vypnuté) všechny zachyceny. První verze
sondy zamrzla stránku (pozorovatel reagoval na vlastní zápis do panelu).
