#!/usr/bin/env python3
"""
Náhledy fotek v mřížkách cestovatelských zápisků (travels/*.html).

Proč: mřížka ukazuje fotku v buňce široké ~170–430 px, ale stahovala se plná fotka (⌀ 323 kB).
Při proscrollování stránky to dělalo Itálii 111 MB a Španělsko 89 MB. Náhled 640 px široký má ⌀ ~50 kB.

Jak: každá fotka v mřížce dostane `srcset` se dvěma kandidáty (náhled a plná fotka, oba s PRAVOU šířkou souboru
v descriptoru `w`) a `sizes`, podle kterých prohlížeč vybere. `src` zůstává plná fotka, takže lightbox
(`img.src`, `getAttribute('src')`) i obsluha kliknutí na stránkách se NEMĚNÍ a zvětšená fotka je pořád plná.

  python3 tools/nahledy-fotek.py            # vytvoří chybějící náhledy a doplní srcset (idempotentní)
  python3 tools/nahledy-fotek.py --kontrola # nic nezapíše; vypíše, co by se změnilo, a skončí kódem 1, když je co měnit

Náhled = `travels/images/<cesta>/n640/<stejné jméno>`, šířka 640 px (výška podle poměru stran), JPEG q75, progresivní,
bez EXIF. Fotka užší než 640 px se nezmenšuje (náhled by nebyl menší) a srcset se jí nedoplní.

Druhá velikost 960 px (`n960/`) je jen u zápisků, které mají do 900 px DVA velké sloupce (ukraine, cr-bh): buňka 410 px × DPR 2 = 820 px
je víc než 640, takže tam prohlížeč bral plnou fotku (⌀ 311 kB). Srcset má pak tři kandidáty (640w, 960w, plná); fotka užší než 960 px
druhý náhled nedostane. Nástroj je idempotentní i při doplnění druhé velikosti do už hotových stránek (přepíše srcset na požadovaný tvar).
"""
import os
import re
import sys
from urllib.parse import unquote
from PIL import Image

KOREN = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
TRAVELS = os.path.join(KOREN, 'travels')
SIRKA = 640
KVALITA = 75
PODSLOZKA = 'n640'
# zápisky s dvěma velkými sloupci na iPadu na výšku: druhá velikost náhledu (šířka v px)
DRUHA = {'ukraine-2017.html': 960, 'cr-bh-2018.html': 960}

# sizes podle skutečného rozvržení mřížky (viz CSS stránek); pod ně se prohlížeč rozhoduje mezi náhledem a plnou fotkou
SIZES_MRIZKA = '(max-width: 768px) 50vw, min(25vw, 300px)'                    # .gallery-grid / romania .gallery (auto-fill 200–220 px)
SIZES_TRI = '(max-width: 900px) 50vw, min(33vw, 427px)'                        # ukraine, cr-bh: 3 sloupce, do 900 px 2 sloupce
SIZES_SIROKY = '(max-width: 900px) 100vw, min(67vw, 853px)'                    # figure.shot.wide / .full (přes 2–3 sloupce)

IMG = re.compile(r'<img\b[^>]*>')
SRC = re.compile(r'\bsrc="(\./images/([a-z0-9_]+)/([^"/]+))"')


def srcset_url(url):
    """V srcset dělí kandidáty mezera a čárka, takže je v adrese nesmí být (baltic má v názvu souboru mezeru:
    `T_PHOTO-2023-07-04-20-26-40 2_web.jpg`; v src= to prohlížeč snese, v srcset by adresu useknul)."""
    return url.replace(' ', '%20').replace(',', '%2C')


def sirky_souboru(cesta):
    with Image.open(cesta) as im:
        return im.size


def udelej_nahled(plny, nahled, sirka=SIRKA):
    with Image.open(plny) as im:
        im = im.convert('RGB')
        w, h = im.size
        if w <= sirka:
            return False
        v = round(h * sirka / w)
        im = im.resize((sirka, v), Image.LANCZOS)
        os.makedirs(os.path.dirname(nahled), exist_ok=True)
        im.save(nahled, 'JPEG', quality=KVALITA, optimize=True, progressive=True)
    return True


def sizes_pro(html, zacatek, soubor):
    if soubor.startswith('ukraine-') or soubor.startswith('cr-bh-'):
        # figure.shot.wide / .full leží těsně před <img>
        okoli = html[max(0, zacatek - 220):zacatek]
        m = list(re.finditer(r'<figure class="([^"]*)"', okoli))
        if m and re.search(r'\b(wide|full)\b', m[-1].group(1)):
            return SIZES_SIROKY
        return SIZES_TRI
    return SIZES_MRIZKA


def zpracuj(soubor, kontrola):
    cesta = os.path.join(TRAVELS, soubor)
    with open(cesta, encoding='utf-8') as f:
        html = f.read()
    zmen = {'nahledu': 0, 'srcset': 0, 'preskoceno_uzke': 0, 'hotovo': 0}
    vystup = []
    for m in IMG.finditer(html):
        tag = m.group(0)
        s = SRC.search(tag)
        if not s or s.group(2) == 'nahledy':
            continue
        url, adresar, jmeno = s.group(1), s.group(2), s.group(3)
        if 'srcset=' in tag and soubor not in DRUHA:
            zmen['hotovo'] += 1
            continue
        plny = os.path.join(TRAVELS, 'images', adresar, unquote(jmeno))
        if not os.path.exists(plny):
            raise SystemExit(f'{soubor}: soubor {plny} neexistuje (src {url})')
        w, h = sirky_souboru(plny)
        if w <= SIRKA:
            zmen['preskoceno_uzke'] += 1
            continue
        nahled = os.path.join(TRAVELS, 'images', adresar, PODSLOZKA, unquote(jmeno))
        if not os.path.exists(nahled):
            zmen['nahledu'] += 1
            if not kontrola:
                udelej_nahled(plny, nahled)
        kandidati = [f'{srcset_url(f"./images/{adresar}/{PODSLOZKA}/{jmeno}")} {SIRKA}w']
        druha = DRUHA.get(soubor)
        if druha and w > druha:
            nahled2 = os.path.join(TRAVELS, 'images', adresar, f'n{druha}', unquote(jmeno))
            if not os.path.exists(nahled2):
                zmen['nahledu'] += 1
                if not kontrola:
                    udelej_nahled(plny, nahled2, druha)
            kandidati.append(f'{srcset_url(f"./images/{adresar}/n{druha}/{jmeno}")} {druha}w')
        kandidati.append(f'{srcset_url(url)} {w}w')
        srcset = ', '.join(kandidati)
        if 'srcset=' in tag:
            nyni = re.search(r'\bsrcset="([^"]*)"', tag).group(1)
            if nyni == srcset:
                zmen['hotovo'] += 1
                continue
            novy = tag.replace(f'srcset="{nyni}"', f'srcset="{srcset}"', 1)
        else:
            sizes = sizes_pro(html, m.start(), soubor)
            novy = tag[:-1].rstrip('/').rstrip() if tag.endswith('/>') else tag[:-1]
            koncovka = ' />' if tag.endswith('/>') else '>'
            novy = f'{novy} srcset="{srcset}" sizes="{sizes}"{koncovka}'
        zmen['srcset'] += 1
        vystup.append((m.start(), m.end(), novy))
    if vystup and not kontrola:
        out, pred = [], 0
        for a, b, novy in vystup:
            out.append(html[pred:a]); out.append(novy); pred = b
        out.append(html[pred:])
        with open(cesta, 'w', encoding='utf-8', newline='') as f:
            f.write(''.join(out))
    return zmen


def main():
    kontrola = '--kontrola' in sys.argv
    celkem = {'nahledu': 0, 'srcset': 0, 'preskoceno_uzke': 0, 'hotovo': 0}
    for soubor in sorted(os.listdir(TRAVELS)):
        if not soubor.endswith('.html') or soubor in ('index.html', '_template.html'):
            continue
        z = zpracuj(soubor, kontrola)
        print(f'{soubor:24s} nových náhledů {z["nahledu"]:4d}, srcset doplněn {z["srcset"]:4d}, už hotovo {z["hotovo"]:4d}, užší než {SIRKA} px {z["preskoceno_uzke"]}')
        for k in celkem:
            celkem[k] += z[k]
    print(f'CELKEM nových náhledů {celkem["nahledu"]}, srcset doplněn {celkem["srcset"]}, už hotovo {celkem["hotovo"]}, užší {celkem["preskoceno_uzke"]}')
    if kontrola and (celkem['nahledu'] or celkem['srcset']):
        sys.exit(1)


if __name__ == '__main__':
    main()
