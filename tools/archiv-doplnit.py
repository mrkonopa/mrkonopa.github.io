#!/usr/bin/env python3
"""Doplní archiv přijímaček (projects/prijimacky-matematika/pdfs) o materiály CERMATu.

Zdroj seznamu je tools/cermat-archiv/katalog.json (M9, česky, od roku 2020, bez ilustračních testů).
Pro každý termín stáhne to, co v archivu chybí: zadání, klíč, záznamový arch, vzorové řešení CERMATu
a (jen 2026) vzorový vyplněný arch. Vojtova ručně vyplněná řešení (`*_vyplneno.pdf`) se sem NEstahují,
ty se do složek vkládají zvlášť.

Pojmenování: <kód>_<rok>_{zadani,klic,ZA,reseni,VZA}.pdf. Rok 2026 má od začátku původní jména CERMATu
(TS, VZA, ZA), proto tam zůstávají (klíč KSR).

Použití:  python3 tools/archiv-doplnit.py            (jen vypíše, co chybí)
          python3 tools/archiv-doplnit.py --stahni   (stáhne a ověří)
Po stažení každý soubor projde kontrolou: začíná %PDF, jde otevřít a první stránka obsahuje slovo
„matematik“ (záznamové archy: aspoň 2 stránky a případný text „záznamov…“) — jinak by se do archivu
dostala jiná stránka než PDF, např. chybová.
"""
import json, os, re, subprocess, sys, tempfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PDFS = os.path.join(ROOT, 'projects', 'prijimacky-matematika', 'pdfs')
SLOZKY = {'1. řádný': ('1_radny', 'A'), '2. řádný': ('2_radny', 'B'),
          '1. náhradní': ('3_nahradni', 'C'), '2. náhradní': ('4_nahradni', 'D')}
KONCOVKA = {'test': 'zadani', 'klic': 'klic', 'arch': 'ZA', 'reseni': 'vzorove_reseni', 'vyplneny_arch': 'VZA'}
KONCOVKA_2026 = {'test': 'TS', 'klic': 'KSR', 'arch': 'ZA', 'vyplneny_arch': 'VZA'}


def cil(e):
    slozka, pismeno = SLOZKY[e['termin']]
    kon = (KONCOVKA_2026 if e['rok'] == 2026 else KONCOVKA).get(e['typ'], KONCOVKA[e['typ']])
    return os.path.join(PDFS, str(e['rok']), slozka, f"M9{pismeno}_{e['rok']}_{kon}.pdf")


def hotovo(e):
    """Soubor je v archivu, nebo je tam pod jiným (starším) jménem téhož druhu."""
    c = cil(e)
    if os.path.exists(c):
        return True
    d = os.path.dirname(c)
    if not os.path.isdir(d):
        return False
    vzor = {'test': r'(zadani|_TS)', 'klic': r'(klic|KSR)', 'arch': r'_ZA\.', 'reseni': r'vzorove_reseni', 'vyplneny_arch': r'VZA'}[e['typ']]
    return any(re.search(vzor, f) and 'vyplneno' not in f for f in os.listdir(d))


def over(cesta, typ):
    import pymupdf
    with open(cesta, 'rb') as f:
        if f.read(4) != b'%PDF':
            return 'nezačíná %PDF'
    try:
        dok = pymupdf.open(cesta)
        text = re.sub(r'\s+', ' ', dok[0].get_text()).lower()
        if typ in ('arch', 'vyplneny_arch'):
            # záznamové archy bývají obrázky bez textu (0 znaků); má-li první stránka text, musí být o záznamovém archu
            if text and 'záznamov' not in text:
                return 'první stránka není záznamový arch'
            return None if len(dok) >= 2 else 'záznamový arch má méně než 2 stránky'
        if 'matematik' not in text:
            return 'první stránka neobsahuje „matematik“'
        return None
    except Exception as ex:  # noqa: BLE001 - chceme jakoukoli vadu souboru jako text
        return f'nejde otevřít: {ex}'


def main():
    stahni = '--stahni' in sys.argv
    kat = json.load(open(os.path.join(ROOT, 'tools', 'cermat-archiv', 'katalog.json'), encoding='utf8'))
    chce = [e for e in kat if e['stupen'] == 'M9' and e['rok'] >= 2020 and e['jazyk'] == 'cs'
            and e['termin'] in SLOZKY and e['typ'] in KONCOVKA]
    chybi = [e for e in chce if not hotovo(e)]
    print(f'katalog: {len(chce)} souborů od 2020, v archivu chybí {len(chybi)}')
    if not stahni:
        for e in sorted(chybi, key=lambda e: (e['rok'], e['termin'], e['typ'])):
            print(' ', os.path.relpath(cil(e), PDFS))
        return 0
    vady = []
    for e in sorted(chybi, key=lambda e: (e['rok'], e['termin'], e['typ'])):
        c = cil(e)
        os.makedirs(os.path.dirname(c), exist_ok=True)
        tmp = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        tmp.close()
        r = subprocess.run(['curl', '-sSL', '--fail', '--max-time', '120', '-o', tmp.name, e['url']],
                           capture_output=True, text=True)
        if r.returncode != 0:
            vady.append((os.path.relpath(c, PDFS), f'stažení selhalo: {r.stderr.strip()[:80]}'))
            os.unlink(tmp.name)
            continue
        v = over(tmp.name, e['typ'])
        if v:
            vady.append((os.path.relpath(c, PDFS), v))
            os.unlink(tmp.name)
            continue
        os.replace(tmp.name, c)
        print(f'  + {os.path.relpath(c, PDFS)}  ({os.path.getsize(c) // 1024} kB)')
    for f, v in vady:
        print(f'  ! {f}: {v}')
    return 1 if vady else 0


if __name__ == '__main__':
    sys.exit(main())
