#!/usr/bin/env python3
"""Vytěží úlohy z ostrých testů CERMAT stažených nástrojem stahni.py.

Pro každý test (stupeň, rok, termín) rozdělí zadání na úlohy a podúlohy,
připojí body a správné řešení z klíče, odhadne typ úlohy (otevřená, výběr,
ano/ne, přiřazování, konstrukce), okruh a zda má nákres.

VÝSTUP ZŮSTÁVÁ V MEZIPAMĚTI (mimo git): ulohy.json a ulohy.csv obsahují
doslovné znění úloh — slouží k výuce a k přípravě vlastních úloh, ne ke
zveřejnění. Do repozitáře jde jen souhrn bez textů (rozbor.py).

Hranice úloh se hledají podle čísel úloh v levém okraji (tučné „7", obyčejné
„7.1"), a to jen v pořadí, které odpovídá klíči — číslo stránky ani výsledek
„18" v klíči se tak za úlohu nevydávají.

Spuštění:  python3 tools/cermat-archiv/vytez.py [adresář mezipaměti]
"""
import csv, json, re, sys
from collections import defaultdict
from pathlib import Path

import pymupdf

TU = Path(__file__).parent
CACHE = Path(next((a for a in sys.argv[1:] if not a.startswith('-')), TU / '.cache'))
CISLO = re.compile(r'\d{1,2}(\.\d)?')
BODY = re.compile(r'(?:max\.\s*)?(\d+)\s*(?:b\.|bod[yů]?)', re.I)


TESSDATA = next((str(p) for p in Path('/usr/share/tesseract-ocr').glob('*/tessdata') if (p / 'ces.traineddata').exists()), None)
OCR_STRANY = defaultdict(set)  # soubor → čísla stran přečtených přes OCR


def _radky_ze_slovniku(slovnik, vyska):
    vysl = []
    for blok in slovnik['blocks']:
        for r in blok.get('lines', []):
            text = ''.join(s['text'] for s in r['spans']).strip()
            x0, y0 = r['bbox'][0], r['bbox'][1]
            if not text or y0 > vyska - 35 or y0 < 20:  # prázdné, záhlaví, čísla stran
                continue
            vel = max(s['size'] for s in r['spans'])
            tucne = any(s['flags'] & 16 or 'Bold' in s['font'] for s in r['spans'])
            vysl.append((x0, y0, vel, tucne, text))
    return vysl


def radky_strany(strana):
    """Řádky jedné strany. Řádné testy 2024 mají text vložený jako obrázky, takže v nich
    není co přečíst — ty se čtou přes OCR (tesseract, čeština), je-li k dispozici.
    Výsledek OCR se ukládá do mezipaměti, protože trvá několik sekund na stranu."""
    vyska = strana.rect.height
    pismen = sum(c.isalpha() for c in strana.get_text())
    if not (pismen < 150 and TESSDATA and (len(strana.get_images()) >= 5 or len(strana.get_drawings()) > 200)):
        return _radky_ze_slovniku(strana.get_text('dict'), vyska)
    OCR_STRANY[strana.parent.name].add(strana.number)
    ulozeno = CACHE / 'ocr' / f'{Path(strana.parent.name).name}.{strana.number}.json'
    if ulozeno.exists():
        return [tuple(r) for r in json.loads(ulozeno.read_text(encoding='utf-8'))]
    tp = strana.get_textpage_ocr(language='ces', dpi=300, full=True, tessdata=TESSDATA)
    vysl = _radky_ze_slovniku(strana.get_text('dict', textpage=tp), vyska)
    ulozeno.parent.mkdir(exist_ok=True)
    ulozeno.write_text(json.dumps(vysl, ensure_ascii=False), encoding='utf-8')
    return vysl


def radky(pdf):
    """Řádky textu s polohou: (strana, x0, y0, velikost, tučně, text)."""
    return [(si,) + r for si, strana in enumerate(pdf) for r in radky_strany(strana)]


def dalsi_mozna(posledni):
    """Která čísla smí následovat po `posledni` („3" → 3.1 nebo 4; „3.2" → 3.3 nebo 4)."""
    if posledni is None:
        return {'1'}
    if '.' in posledni:
        u, p = map(int, posledni.split('.'))
        return {f'{u}.{p + 1}', str(u + 1)}
    u = int(posledni)
    return {f'{u}.1', str(u + 1)}


def cti_klic(pdf):
    """Klíč: [{cislo, odpoved, body}] + počty úloh z hlavičky. Číslo se bere jen
    tehdy, když předchozí položka už má body a číslo je v pořadí možné."""
    polozky, akt, cast = [], None, 'hlavicka'
    hlav = {}
    text = [r[5] for r in radky(pdf)]
    m = re.search(r'Počet úloh\s+(\d+)\s+(\d+)\s+(\d+)', ' '.join(text))
    if m:
        hlav = {'celkem': int(m.group(1)), 'uzavrenych': int(m.group(2)), 'otevrenych': int(m.group(3))}
    for t in text:
        if cast == 'hlavicka':
            if t.startswith('Body') or t.startswith('Úloha'):
                cast = 'telo'
            continue
        # Podúlohy ano/ne a přiřazování nemají body každá zvlášť (body má celá úloha),
        # takže u podúlohy stačí, že už má odpověď.
        hotova = akt is None or akt['body'] or (akt['odpoved'] and '.' in akt['cislo'])
        if CISLO.fullmatch(t) and hotova and t in dalsi_mozna(akt and akt['cislo']):
            akt = {'cislo': t, 'odpoved': '', 'body': None}
            polozky.append(akt)
            continue
        if akt is None:
            continue
        if akt['body'] is None:
            b = BODY.fullmatch(t)
            if b:
                akt['body'] = int(b.group(1))
            else:
                akt['odpoved'] = (akt['odpoved'] + ' ' + t).strip()
    return polozky, hlav


def okruh(text):
    t = text.lower()
    pravidla = [
        ('konstrukce', r'sestroj|narýsuj|konstrukc'),
        ('telesa', r'kvádr|krychl|válc|válec|hranol|jehlan|kužel|koul[ei]|těles'),
        ('data', r'graf|diagram|tabulk|průměr|medián|modus'),
        ('procenta', r'procent|%|zdraž|zlevn|sleva|úrok'),
        ('pomer', r'poměr|měřítk|úměr'),
        ('rovnice', r'rovnic'),
        ('vyrazy', r'výraz|upravte|rozložte|vytkněte|mnohočlen'),
        ('zlomky', r'zlomk|zlomek'),
        # rostoucí obrazce (poslední úloha testu) dřív než geometrie — skládají se ze čtverců,
        # ale „obrazec" sám nestačí, to je i složený útvar v geometrii
        ('obrazce', r'posloupnost|v pořadí|\d+\.\s*obrazc|(?:další|následující)\w*\s+obrazc|podle (?:následujících )?pravidel|obdobným způsobem|n-t[ýé]|mozaik|pípnutí'),
        ('geometrie', r'trojúhelník|obdélník|čtver|kruh|kružnic|úhel|úhl|obvod|obsah|lichoběžník|kosočtver|rovnoběžník|souměrn|úsečk|přímk'),
    ]
    for jmeno, vzor in pravidla:
        if re.search(vzor, t):
            return jmeno
    return 'cisla-slovni'


def typ(text, radky_ulohy):
    if re.search(r'[Pp]řiřaďte', text):  # dřív než výběr: přiřazování má taky volby A)–F)
        return 'prirazovani'
    if sum(1 for t in radky_ulohy if re.match(r'^[A-F]\)', t)) >= 3:
        return 'vyber'
    if re.search(r'pravdiv\w*\s*\(A\)|zda je pravdiv', text):
        return 'ano-ne'
    if re.search(r'Sestrojte|Narýsujte|sestrojte|narýsujte', text):
        return 'konstrukce'
    return 'otevrena'


def ma_nakres(pdf, useky):
    """Kresba v prostoru úlohy: obrázek, nebo aspoň 3 tahy s křivkou či šikmou čárou.
    Rámečky na odpověď, tabulky a podtržení jsou jen vodorovné a svislé, ty se nepočítají.
    U stran čtených přes OCR je text sám obrázkem, tam se nákres určit nedá (None)."""
    if any(si in OCR_STRANY[pdf.name] for si, _, _ in useky):
        return None
    tahy = obr = 0
    for si, y_od, y_do in useky:
        strana = pdf[si]
        for d in strana.get_drawings():
            if not (y_od <= d['rect'].y0 <= y_do):
                continue
            for it in d['items']:
                if it[0] == 'c' or (it[0] == 'l' and abs(it[1].x - it[2].x) > 2 and abs(it[1].y - it[2].y) > 2):
                    tahy += 1
                    break
        for info in strana.get_images(full=True):
            obr += sum(1 for bb in strana.get_image_rects(info[0]) if y_od <= bb.y0 <= y_do and bb.width > 30)
    return obr > 0 or tahy >= 3


def rozdel_test(pdf, poradi):
    """Rozdělí test na úseky podle čísel úloh. `poradi` je pořadí čísel z klíče
    (nebo None). Vrací {cislo: {radky, useky[(strana, y_od, y_do)], body}}."""
    rr = radky(pdf)
    start = 1 if len(pdf) > 4 and re.search(r'ZÁKLADNÍ INFORMACE|Základní informace|POKYNY|Pokyny', pdf[0].get_text()) else 0
    rr = [r for r in rr if r[0] >= start]
    znacky, posledni, cekajici_body, ukazatel = [], None, None, 0
    for i, (si, x0, y0, vel, tucne, t) in enumerate(rr):
        b = BODY.fullmatch(t)
        if b and x0 > 300:
            cekajici_body = int(b.group(1))
            continue
        zbytek = ''
        if si in OCR_STRANY[pdf.name]:
            m = re.match(r'(\d{1,2}(?:\.\d)?)\.?(?:\s*\|\s*|\s+(?=\S)|$)(.*)', t)
            if not m or x0 >= 110:
                continue
            t, zbytek = m.group(1), m.group(2).strip()
        elif not (CISLO.fullmatch(t) and x0 < 110 and vel >= 10):
            continue
        if poradi:
            # tolerance: OCR občas číslo úlohy nepřečte — dovolí přeskočit dvě
            dalsi = poradi[ukazatel:ukazatel + 3]
            if t not in dalsi:
                continue
            ukazatel = poradi.index(t, ukazatel) + 1
        elif t not in dalsi_mozna(posledni):
            continue
        znacky.append((i, t, cekajici_body if '.' not in t else None, zbytek))
        posledni, cekajici_body = t, None
    ulohy, prenos = {}, []
    # „VÝCHOZÍ TEXT (A OBRÁZEK) K ÚLOZE N" stojí PŘED číslem úlohy N, takže ho čtení
    # po řádcích přilepí k úloze předchozí. Odřízne se a přenese k další úloze.
    prvni = next((n for n, r in enumerate(rr) if znacky and n < znacky[0][0] and r[5].startswith('VÝCHOZÍ')), None)
    if prvni is not None:
        prenos = rr[prvni:znacky[0][0]]
    for k, (i, cislo, body, zbytek) in enumerate(znacky):
        j = znacky[k + 1][0] if k + 1 < len(znacky) else len(rr)
        cast = ([rr[i][:5] + (zbytek,)] if zbytek else []) + [r for r in rr[i + 1:j] if not (BODY.fullmatch(r[5]) and r[1] > 300)]
        rez = next((n for n, r in enumerate(cast) if r[5].startswith('VÝCHOZÍ')), None)
        cast, dalsi_uvod = (cast[:rez], cast[rez:]) if rez is not None else (cast, [])
        uvod = []
        if '.' not in cislo:
            uvod, prenos = prenos, []
        prenos = prenos + dalsi_uvod
        useky = defaultdict(lambda: [1e9, -1e9])
        for si, x0, y0, *_ in uvod + [rr[i]] + cast:
            useky[si][0] = min(useky[si][0], y0)
            useky[si][1] = max(useky[si][1], y0)
        if k + 1 < len(znacky) and rr[j][0] in useky and not dalsi_uvod:  # úloha končí až u další značky
            useky[rr[j][0]][1] = rr[j][2]
        ulohy[cislo] = {'uvod': [r[5] for r in uvod], 'radky': [r[5] for r in cast], 'useky': [(s, a, b) for s, (a, b) in sorted(useky.items())],
                        'body': body, 'strany': sorted({s + 1 for s in useky})}
    return ulohy


def main():
    katalog = json.loads((TU / 'katalog.json').read_text(encoding='utf-8'))
    manifest = json.loads((CACHE / 'stazeno.json').read_text(encoding='utf-8'))
    skupiny = defaultdict(lambda: defaultdict(list))
    for x in katalog:
        if x['jazyk'] == 'cs' and x['url'] in manifest:
            skupiny[(x['stupen'], x['rok'], x['termin'])][x['typ']].append(x)
    testy, csv_radky = [], []
    souhrn = defaultdict(int)
    for (stupen, rok, termin), docs in sorted(skupiny.items(), key=lambda kv: (kv[0][0], kv[0][1], str(kv[0][2]))):
        if not docs.get('test'):
            continue
        test = docs['test'][0]
        pdf = pymupdf.open(CACHE / manifest[test['url']]['cesta'])
        klic, hlav = [], {}
        for k in docs.get('klic', []):
            klic, hlav = cti_klic(pymupdf.open(CACHE / manifest[k['url']]['cesta']))
            if klic:
                break
        # Klíč, jehož počet úloh nesedí s jeho vlastní hlavičkou, se špatně přečetl
        # (starší rozvržení) — pak se zadání dělí bez něj, jen podle pořadí čísel.
        klic_ok = hlav.get('celkem') == sum('.' not in p['cislo'] for p in klic)
        poradi = [p['cislo'] for p in klic] if klic_ok else None
        useky = rozdel_test(pdf, poradi)
        if poradi and len(useky) < len(poradi):  # klíč nesedí na zadání: zkusit bez něj
            bez = rozdel_test(pdf, None)
            if len(bez) > len(useky):
                useky = bez
        odpovedi = {p['cislo']: p for p in klic}
        # Vzorová řešení (u části testů): stejné dělení podle čísel úloh jako zadání.
        reseni = {}
        for r in docs.get('reseni', [])[:1]:
            reseni = rozdel_test(pymupdf.open(CACHE / manifest[r['url']]['cesta']), poradi)
        ulohy = []
        for cislo, u in useky.items():
            if '.' in cislo:
                continue
            pod = [c for c in useky if c.startswith(cislo + '.')]
            vse = u['uvod'] + u['radky'] + [r for c in pod for r in [c] + useky[c]['radky']]
            text = ' '.join(vse)
            obrazek_v_nadpisu = any(re.match(r'VÝCHOZÍ.*(OBRÁZ|GRAF|DIAGRAM|TABULK)', r) for r in u['uvod'])
            k = odpovedi.get(cislo, {})
            uloha = {
                'cislo': int(cislo), 'body': u['body'] or k.get('body'), 'typ': typ(text, vse), 'okruh': okruh(text),
                'nakres': True if obrazek_v_nadpisu else ma_nakres(pdf, [x for c in [cislo] + pod for x in useky[c]['useky']]),
                'strany': sorted({s for c in [cislo] + pod for s in useky[c]['strany']}),
                'uvod': ' '.join(u['uvod']),
                'text': ' '.join(u['radky']),
                'odpoved': k.get('odpoved', ''),
                'reseni': ' '.join(r for c in [cislo] + pod if c in reseni
                                   for r in ([c] if '.' in c else []) + reseni[c]['uvod'] + reseni[c]['radky']),
                'podulohy': [{'cislo': c, 'text': ' '.join(useky[c]['radky']),
                              'odpoved': odpovedi.get(c, {}).get('odpoved', ''),
                              'body': odpovedi.get(c, {}).get('body')} for c in pod],
            }
            ulohy.append(uloha)
            souhrn['uloh'] += 1
            souhrn['s_odpovedi'] += bool(uloha['odpoved'] or any(p['odpoved'] for p in uloha['podulohy']))
            souhrn['s_resenim'] += bool(uloha['reseni'])
            csv_radky.append([stupen, rok, termin, uloha['cislo'], uloha['typ'], uloha['okruh'], {True: 'ano', False: '', None: '?'}[uloha['nakres']],
                              uloha['body'] or '', ','.join(map(str, uloha['strany'])), text[:1500],
                              ' | '.join(filter(None, [uloha['odpoved']] + [f"{p['cislo']}: {p['odpoved']}" for p in uloha['podulohy']]))[:300],
                              uloha['reseni'][:3000]])
        ocek = hlav.get('celkem')
        sedi = ocek is None or ocek == len(ulohy)
        souhrn['testu'] += 1
        souhrn['sedi_pocet'] += sedi
        testy.append({'stupen': stupen, 'rok': rok, 'termin': termin, 'test': test['url'],
                      'klic': [k['url'] for k in docs.get('klic', [])], 'reseni': [r['url'] for r in docs.get('reseni', [])],
                      'pocet_podle_klice': hlav, 'nalezeno_uloh': len(ulohy), 'ocr_stran': len(OCR_STRANY[pdf.name]), 'ulohy': ulohy})
        if not sedi and '-v' in sys.argv:
            print(f'  ! {stupen} {rok} {termin}: klíč {ocek} úloh ({len(klic)} položek), nalezeno {len(ulohy)}')
    (CACHE / 'ulohy.json').write_text(json.dumps(testy, ensure_ascii=False, indent=1), encoding='utf-8')
    with open(CACHE / 'ulohy.csv', 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, delimiter=';')
        w.writerow(['stupeň', 'rok', 'termín', 'úloha', 'typ', 'okruh (odhad)', 'nákres', 'body', 'strany', 'zadání', 'správné řešení (klíč)', 'vzorový postup CERMAT'])
        w.writerows(csv_radky)
    print(f"Testů {souhrn['testu']}, počet úloh sedí s klíčem u {souhrn['sedi_pocet']}; "
          f"úloh {souhrn['uloh']}, s řešením z klíče {souhrn['s_odpovedi']}, se vzorovým postupem {souhrn['s_resenim']}")
    print(f'→ {CACHE / "ulohy.json"}, {CACHE / "ulohy.csv"}')


if __name__ == '__main__':
    main()
