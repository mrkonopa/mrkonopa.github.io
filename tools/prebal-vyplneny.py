#!/usr/bin/env python3
"""Bezeztrátově přebalí PDF z iPadu (Vojtova vyplněná řešení) a výsledek PŘED uložením ověří.

Proč: vyplněné testy z iPadu mají nezabalené datové proudy (16–19 MB na 10 stran), ale rukopis je v nich
VEKTOR a anotace typu Stamp. Přebal přes Ghostscript (tools/compress-pdfs.sh) už jednou rukopis zahodil,
proto se tu jen komprimují proudy a obsah stránek se NEPŘEPISUJE.

  - `clean=True` se NEpoužívá: přepíše obsah stránek (naměřeno 26. 10. 2026: u 4 z 5 souborů změnilo počty
    operátorů cest), úspora je přitom stejná (33,16 vs 33,14 MB na pěti testech).
  - Uloží se jen to, co projde ověřením. Při jakékoli odchylce skončí kódem 1 a cílový soubor nevznikne.

Ověření (vše proti původnímu souboru):
  1. stejný počet stran,
  2. každý datový proud, na který se z dokumentu dá dojít (od kořene přes odkazy), je v přebalu se stejným
     dekódovaným obsahem. Zahozeno smí být jen to, na co nic neodkazuje: zbytky starších verzí z iPadu
     (u 2022 A: 2 skryté obrázky s formuláři), kontejnery objektů a tabulka odkazů, které se při uložení
     staví znovu. Porovnává se s ČERSTVĚ otevřeným originálem — dokument, ze kterého se ukládalo, už jednou
     prošel úklidem a porovnání s ním by bylo kruhové (první verze téhle kontroly na tom spoléhala),
  3. obsah každé stránky je bajt po bajtu stejný,
  4. každá anotace má shodný slovník klíčů (čísla odkazů se po úklidu objektů mění, proto se maskují),
  5. každá stránka se při 150 dpi vykreslí pixel po pixelu stejně, s anotacemi i bez nich.

Použití:  python3 tools/prebal-vyplneny.py zdroj.pdf cil.pdf
Vyžaduje PyMuPDF (`pip install pymupdf`); CI ho nemá, takže nástroj v bráně není a hlídá se sám.
"""
import hashlib
import os
import re
import sys
import tempfile

import pymupdf


def hash_proudu(d, x):
    b = d.xref_stream(x)
    if b is None:  # filtr, který MuPDF nerozbalí (např. JPEG): porovná se tak, jak je uložený
        b = d.xref_stream_raw(x)
    return hashlib.sha256(b).hexdigest()


def dosazitelne(d):
    """Čísla objektů, na které vede cesta od trailer (Root, Info…) přes odkazy `N 0 R`."""
    odkazy = lambda s: [int(m) for m in re.findall(r"(\d+) 0 R", s)]
    videno, zasobnik = set(), odkazy(d.pdf_trailer())
    while zasobnik:
        x = zasobnik.pop()
        if x in videno or not 0 < x < d.xref_length():
            continue
        videno.add(x)
        try:
            zasobnik += odkazy(d.xref_object(x, compressed=False))
        except Exception:  # volný objekt
            pass
    return videno


def proudy(d, jen_dosazitelne=False):
    """Množina hashů dekódovaných datových proudů (všech, nebo jen dosažitelných)."""
    cisla = dosazitelne(d) if jen_dosazitelne else range(1, d.xref_length())
    return {hash_proudu(d, x) for x in cisla if 0 < x < d.xref_length() and d.xref_is_stream(x)}


def slovnik(d, x):
    return {k: re.sub(r"\s+", " ", re.sub(r"\b\d+ 0 R\b", "R", d.xref_get_key(x, k)[1])).strip()
            for k in d.xref_get_keys(x)}


def anotace(d):
    out = []
    for i in range(len(d)):
        p = d[i]  # stránku je třeba držet, jinak anotace ztratí vazbu
        out.append([slovnik(d, a.xref) for a in (p.annots() or [])])
    return out


def obsah(d, i):
    return b"".join(d.xref_stream(x) or b"" for x in d[i].get_contents())


def hash_pixelu(p, **kw):
    return hashlib.sha256(p.get_pixmap(dpi=150, **kw).samples).digest()


def over(zdroj, cil):
    """Vrátí seznam zjištěných odchylek (prázdný = přebal je věrný)."""
    d, n = pymupdf.open(zdroj), pymupdf.open(cil)
    vady = []
    if len(d) != len(n):
        return [f"počet stran {len(d)} → {len(n)}"]
    pd, pn = proudy(d, jen_dosazitelne=True), proudy(n)
    if pd - pn:
        vady.append(f"{len(pd - pn)} dosažitelných datových proudů z originálu v přebalu chybí nebo se změnilo")
    if proudy(n) - proudy(d):
        vady.append(f"{len(proudy(n) - proudy(d))} datových proudů v přebalu přibylo (nic nového se přidávat nemá)")
    ad, an = anotace(d), anotace(n)
    for i in range(len(d)):
        if obsah(d, i) != obsah(n, i):
            vady.append(f"strana {i + 1}: obsah stránky se liší")
        if ad[i] != an[i]:
            vady.append(f"strana {i + 1}: anotace se liší ({len(ad[i])} → {len(an[i])})")
        for kw in ({}, {"annots": False}):
            if hash_pixelu(d[i], **kw) != hash_pixelu(n[i], **kw):
                vady.append(f"strana {i + 1}: vykreslení se liší" + (" (bez anotací)" if kw else ""))
    return vady


def prebal(zdroj, cil):
    d = pymupdf.open(zdroj)
    fd, tmp = tempfile.mkstemp(suffix=".pdf", dir=os.path.dirname(os.path.abspath(cil)))
    os.close(fd)
    try:
        d.save(tmp, garbage=4, deflate=True, deflate_images=True, deflate_fonts=True)
        vady = over(zdroj, tmp)
        if vady:
            return vady, 0
        os.replace(tmp, cil)
        tmp = None
        return [], os.path.getsize(cil)
    finally:
        if tmp and os.path.exists(tmp):
            os.unlink(tmp)


def main(argv):
    if len(argv) != 3:
        print(__doc__)
        return 2
    zdroj, cil = argv[1], argv[2]
    vady, velikost = prebal(zdroj, cil)
    if vady:
        print(f"✗ {zdroj}: přebal NEPROŠEL ověřením, {cil} nevznikl")
        for v in vady[:10]:
            print("   -", v)
        return 1
    a = os.path.getsize(zdroj)
    print(f"✓ {cil}: {a} → {velikost} B ({100 * velikost / a:.0f} %), ověřeno {len(pymupdf.open(cil))} stran")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
