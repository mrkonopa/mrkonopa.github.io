#!/usr/bin/env python3
"""Náhledy titulních fotek na rozcestníku cest (travels/index.html).

Karta má `.cover` s `background-size: cover` v poměru 4 : 3 a zdrojovou fotku v plné velikosti (⌀ 350 kB, 1600 px),
ačkoli se zobrazí v ~400 px. Tenhle nástroj pro každý odkaz `url('./images/<složka>/<fotka>')` v `.cover`
vyřízne výřez 4 : 3 (jako to dělá CSS podle `background-position`, výchozí střed), zmenší na 800 × 600 (JPEG q78, progresivní, bez EXIF) a uloží do
`travels/images/nahledy/<fotka>`; odkaz v index.html přepíše na náhled. Spouští se jen při změně titulní fotky.

Použití (z kořene repa; potřebuje Pillow): python3 tools/nahledy-titulni.py
"""
import os, re, sys, urllib.parse
from PIL import Image

KOREN = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
INDEX = os.path.join(KOREN, 'travels', 'index.html')
SIRKA, VYSKA, KVALITA = 800, 600, 78

html = open(INDEX, encoding='utf8').read()
vzor = re.compile(r"(<div class=\"cover\" style=\"background-image:url\(')\./images/(?!nahledy/)([^']+)('\);)([^\"]*\")")
nove, pocet = [], 0

def zpracuj(m):
    global pocet
    rel = m.group(2)
    zdroj = os.path.join(KOREN, 'travels', 'images', urllib.parse.unquote(rel))
    jmeno = os.path.basename(urllib.parse.unquote(rel))
    cil_dir = os.path.join(KOREN, 'travels', 'images', 'nahledy'); os.makedirs(cil_dir, exist_ok=True)
    im = Image.open(zdroj); im.load(); im = im.convert('RGB')
    w, h = im.size; cil = SIRKA / VYSKA
    poz = re.search(r'background-position:\s*([a-z]+)(?:\s+([a-z]+))?', m.group(4))
    vodorovne, svisle = (poz.group(1), poz.group(2) or 'center') if poz else ('center', 'center')
    if w / h > cil:                       # širší než 4:3 → ořez do stran
        nw = round(h * cil); x = {'left': 0, 'right': w - nw}.get(vodorovne, (w - nw) // 2); im = im.crop((x, 0, x + nw, h))
    else:                                 # užší → ořez nahoře a dole
        nh = round(w / cil); y = {'top': 0, 'bottom': h - nh}.get(svisle if svisle != 'center' else vodorovne, (h - nh) // 2); im = im.crop((0, y, w, y + nh))
    im = im.resize((SIRKA, VYSKA), Image.LANCZOS)
    vystup = os.path.join(cil_dir, jmeno)
    im.save(vystup, 'JPEG', quality=KVALITA, optimize=True, progressive=True)
    print('%-70s %5d kB → %4d kB' % (jmeno[:70], os.path.getsize(zdroj) // 1000, os.path.getsize(vystup) // 1000))
    pocet += 1
    return m.group(1) + './images/nahledy/' + urllib.parse.quote(jmeno) + m.group(3) + m.group(4)

vysledek = vzor.sub(zpracuj, html)
if vysledek != html:
    open(INDEX, 'w', encoding='utf8').write(vysledek)
print('přepsáno titulních fotek:', pocet)
