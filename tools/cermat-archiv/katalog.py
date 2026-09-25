#!/usr/bin/env python3
"""Katalog ostrých testů CERMAT z matematiky (zdroj: prijimacky.cermat.cz).

Projde stránku „Testová zadání v PDF" a její podstránky pro matematiku
(čtyřleté, šestileté a osmileté obory + přijímačky nanečisto) a zapíše
katalog odkazů do katalog.json: stupeň, rok, termín, jazyk, typ, adresa.
Katalog obsahuje jen adresy a zařazení, žádný obsah testů.

Pravidla CZVV pro testovou dokumentaci výslovně povolují využití ve výuce
na školách zapsaných v rejstříku MŠMT; odkazy na weby Centra jsou volné.

Spuštění:  python3 tools/cermat-archiv/katalog.py
"""
import json, re, sys, time, urllib.parse, urllib.request
from html.parser import HTMLParser
from pathlib import Path

ZAKLAD = 'https://prijimacky.cermat.cz'
ROZCESTNIK = ZAKLAD + '/menu/testova-zadani-k-procvicovani/testova-zadani-v-pdf.html'
STRANKY = {  # stupeň -> kus adresy podstránky
    'M9': 'ctyrlete-obory-matematika',
    'M7': 'sestilete-obory-matematika',
    'M5': 'osmilete-obory-matematika',
    'nanecisto': 'prijimacky-nanecisto-zadani-testu',
}
UA = 'mrkonopa-cermat-archiv/1.0 (skolni vyuka; github.com/mrkonopa)'
VYSTUP = Path(__file__).with_name('katalog.json')


def stahni_text(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        if r.status != 200:
            raise RuntimeError(f'HTTP {r.status} pro {url}')
        return r.read().decode('utf-8', 'replace')


class Odkazy(HTMLParser):
    """Sbírá (poslední nadpis, text odkazu, href). Nadpisem je h1–h4 i tučný text."""
    NADPIS = ('h1', 'h2', 'h3', 'h4', 'strong', 'b')

    def __init__(self):
        super().__init__()
        self.polozky, self.nadpis, self._h, self._a, self._t = [], '', None, None, ''

    def handle_starttag(self, tag, attrs):
        if tag in self.NADPIS:
            self._h = ''
        if tag == 'a':
            self._a, self._t = dict(attrs).get('href', ''), ''

    def handle_endtag(self, tag):
        if tag in self.NADPIS and self._h is not None:
            h = ' '.join(self._h.split())
            if h:
                self.nadpis = h
            self._h = None
        if tag == 'a' and self._a is not None:
            self.polozky.append((self.nadpis, ' '.join(self._t.split()), self._a))
            self._a = None

    def handle_data(self, data):
        if self._h is not None:
            self._h += data
        if self._a is not None:
            self._t += data


def typ_dokumentu(text, soubor):
    t, s = text.lower(), soubor.lower()
    if 'vyplněný' in t:
        return 'vyplneny_arch'
    if 'záznamový' in t:  # CERMAT má i překlep „Záznamový arc"
        return 'arch'
    if 'validační' in t:
        return 'validace'
    if 'klíč' in t or 'klic' in s or 'ключ' in t:  # i ukrajinský „Ключ до правильних відповідей"
        return 'klic'
    if 'řešení' in t or 'reseni' in s or 'řešení' in s:
        return 'reseni'
    if 'test' in t or 'zadání' in t:
        return 'test'
    return 'jine'


def jazyk(nadpis, soubor):
    n, s = nadpis.lower(), soubor.lower()
    if 'ukrajin' in n or re.search(r'(^|[_-])(uk|ukr)([_.-]|$)', s):
        return 'uk'
    if 'polštin' in n or re.search(r'(^|[_-])pl([_.-]|$)', s):
        return 'pl'
    return 'cs'


def termin_z_textu(text):
    m = re.search(r'(\d)\.\s*(řádný|náhradní)', text, re.I)
    return f'{m.group(1)}. {m.group(2).lower()}' if m else None


def katalog_stranky(stupen, url):
    p = Odkazy()
    p.feed(stahni_text(url))
    vysledek, posledni, poradi = [], {}, {}
    for nadpis, text, href in p.polozky:
        if not href.lower().endswith('.pdf'):
            continue
        if stupen == 'nanecisto' and 'matematika' not in nadpis.lower():
            continue  # stránka nanečisto má i češtinu a angličtinu
        adresa = urllib.parse.urljoin(ZAKLAD + '/', href)
        soubor = urllib.parse.unquote(adresa.rsplit('/', 1)[-1])
        rok = re.search(r'(20\d\d)', nadpis) or re.search(r'(20\d\d)', soubor)
        typ = typ_dokumentu(text, soubor)
        # Termín: přímo z textu testu; ostatní dokumenty dědí termín posledního
        # testu pod týmž nadpisem. Test bez termínu v textu dostane pořadí.
        termin = termin_z_textu(text)
        if typ == 'test':
            if not termin:
                if 'ilustrační' in nadpis.lower():
                    termin = 'ilustrační'
                elif stupen == 'nanecisto':
                    termin = 'nanečisto'
                else:
                    poradi[nadpis] = poradi.get(nadpis, 0) + 1
                    druh = 'náhradní' if 'náhradní' in nadpis.lower() else 'řádný'
                    termin = f'{poradi[nadpis]}. {druh}'
            posledni[nadpis] = termin
        else:
            termin = termin or posledni.get(nadpis) or (
                'ilustrační' if 'ilustrační' in nadpis.lower() else None)
        # Záloha z kódu testu CERMAT („M7PAD24C0K01" = 2024, A = 1. řádný termín),
        # když nadpis rok neuvádí a pod nadpisem nestojí žádný test.
        kod = re.search(r'M\dP([A-D])D(\d\d)', soubor)
        if kod and not termin:
            termin = {'A': '1. řádný', 'B': '2. řádný', 'C': '1. náhradní', 'D': '2. náhradní'}[kod.group(1)]
        if kod and not rok:
            rok = re.search(r'(\d\d)', kod.group(2))
            rok = int('20' + rok.group(1))
        elif rok:
            rok = int(rok.group(1))
        vysledek.append({
            'stupen': stupen, 'rok': rok,
            'termin': termin, 'jazyk': jazyk(nadpis, soubor), 'typ': typ,
            'nadpis': nadpis, 'text': text, 'soubor': soubor, 'url': adresa,
        })
    return vysledek


def main():
    rozcestnik = stahni_text(ROZCESTNIK)
    polozky = []
    for stupen, kus in STRANKY.items():
        if kus not in rozcestnik:
            sys.exit(f'Rozcestník už neodkazuje na {kus} — CERMAT změnil strukturu webu.')
        url = f'{ZAKLAD}/menu/testova-zadani-k-procvicovani/testova-zadani-v-pdf/{kus}.html'
        polozky += katalog_stranky(stupen, url)
        time.sleep(1)
    if len(polozky) < 100:
        sys.exit(f'Katalog má jen {len(polozky)} položek — parser nejspíš nic nenašel.')
    VYSTUP.write_text(json.dumps(polozky, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{len(polozky)} položek → {VYSTUP}')


if __name__ == '__main__':
    main()
