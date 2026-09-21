#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Vyrobí data mapy trasy pro cestovatelský zápisek (kreslí `travels/mapa.js`).

PODKLAD SE SEM NEUKLÁDÁ — stáhne se z npm, je to 756 kB vstupních dat:

    curl -sS -o world.tgz https://registry.npmjs.org/world-atlas/-/world-atlas-2.0.2.tgz
    tar xzf world.tgz package/countries-50m.json -O > tools/mapy/countries-50m.json

POSTUP (a proč takhle):
  1. Stará mapa v HTML je LINEÁRNÍ projekcí skutečných souřadnic. Ověřeno
     kotvami — Itálie sedí na 0–5 km, Balt na 0,6 px proti KMZ z plánování.
     Jde ji tedy invertovat a dostat trasu zpátky na zeměpisné souřadnice.
  2. Staré mapy měly nezávislou škálu pro šířku a délku a nezapočítaly
     cos(šířky), takže byly ZPLOŠTĚLÉ (Itálie 3,54×, Balt 1,82×). Nová
     projekce to dělá správně.
  3. Podklad se ořízne na výřez (Sutherland–Hodgman) — bez toho se nese
     celý obrys státu, i když je vidět jen jeho roh, a soubor je 95 kB
     místo 20.
  4. Trasa i podklad se zjednoduší (Douglas–Peucker).

Kotvy musí být místa, jejichž polohu známe spolehlivě; skript tiskne
odchylku, takže se špatná kotva pozná (dobrý fit dává jednotky pixelů).
"""

import json, math, re, sys
from pathlib import Path
ZDE = Path(__file__).parent

# ── zjednodušení lomené čáry ─────────────────────────────────────────────
def rdp(body, tol):
    if len(body) < 3: return body
    def vzdal(p, a, b):
        (x, y), (x1, y1), (x2, y2) = p, a, b
        dx, dy = x2 - x1, y2 - y1
        if dx == dy == 0: return math.hypot(x - x1, y - y1)
        t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
        return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
    nej, idx = 0, 0
    for i in range(1, len(body) - 1):
        d = vzdal(body[i], body[0], body[-1])
        if d > nej: nej, idx = d, i
    if nej <= tol: return [body[0], body[-1]]
    return rdp(body[:idx + 1], tol)[:-1] + rdp(body[idx:], tol)

def nacti_topo(cesta):
    t = json.load(open(cesta))
    sx, sy = t['transform']['scale']; tx, ty = t['transform']['translate']
    obl = []
    for a in t['arcs']:
        x = y = 0; b = []
        for dx, dy in a:
            x += dx; y += dy; b.append((x * sx + tx, y * sy + ty))
        obl.append(b)
    z = lambda i: obl[i] if i >= 0 else obl[~i][::-1]
    def prsteny(g):
        polys = [g['arcs']] if g['type'] == 'Polygon' else g['arcs'] if g['type'] == 'MultiPolygon' else []
        ven = []
        for poly in polys:
            for pr in poly:
                b = []
                for i in pr:
                    c = z(i); b.extend(c if not b else c[1:])
                ven.append(b)
        return ven
    return [(g['properties']['name'], prsteny(g)) for g in t['objects']['countries']['geometries']]


def orez_obdelnikem(body, bbox):
    """Sutherland–Hodgman: ořízne prstenec na výřez. Bez toho se nese celý
    obrys státu, i když je vidět jen jeho roh — u Itálie to dělalo 88 z 95 kB."""
    lo0, la0, lo1, la1 = bbox
    def strana(b, i, hodnota):
        ven = []
        uvnitr = (lambda p: p[0] >= hodnota, lambda p: p[0] <= hodnota,
                  lambda p: p[1] >= hodnota, lambda p: p[1] <= hodnota)[i]
        for j in range(len(b)):
            a, c = b[j - 1], b[j]
            ua, uc = uvnitr(a), uvnitr(c)
            if ua != uc:
                if i < 2: t = (hodnota - a[0]) / (c[0] - a[0]); prus = (hodnota, a[1] + t * (c[1] - a[1]))
                else:     t = (hodnota - a[1]) / (c[1] - a[1]); prus = (a[0] + t * (c[0] - a[0]), hodnota)
                ven.append(prus)
            if uc: ven.append(c)
        return ven
    for i, h in enumerate((lo0, lo1, la0, la1)):
        if not body: return []
        body = strana(body, i, h)
    return body


# Názvy států NEJSOU popisky zastávek. Bez tohohle seznamu se spárovaly
# s nejbližším bodem a na mapě pak stálo „ESTONIA / Rummu" nebo
# „LITHUANIA / Wolf's Lair" — přičemž Vlčí doupě je v Polsku. Nové mapy
# kreslí obrysy států, takže se jejich názvy nevykreslují vůbec.
NAZVY_ZEMI = {'POLAND', 'LITHUANIA', 'LATVIA', 'ESTONIA', 'GERMANY', 'CZECHIA',
              'SLOVAKIA', 'AUSTRIA', 'ITALY', 'CROATIA', 'SLOVENIA', 'HUNGARY',
              'SERBIA', 'ROMANIA', 'BULGARIA', 'GREECE', 'ALBANIA', 'KOSOVO',
              'MONTENEGRO', 'BOSNIA', 'NORTH MACEDONIA', 'FRANCE', 'SPAIN',
              'UKRAINE', 'BELARUS', 'RUSSIA', 'SWEDEN', 'FINLAND', 'DENMARK'}


def popisky(telo, puvodni):
    """Spáruje <text> se stopou podle nejbližšího bodu ve starých souřadnicích.
    Rozlišuje hlavní a doplňkový řádek podle velikosti písma — v původních
    mapách je doplněk vždy menší (9–9,5 proti 10,5–11)."""
    vsechny = []
    for m in re.finditer(r'<text\b([^>]*)>(.*?)</text>', telo, re.S):
        atr, text = m.group(1), re.sub(r'<[^>]+>', '', m.group(2)).strip()
        if not text or text.strip().upper() in NAZVY_ZEMI: continue
        sx = re.search(r'\sx="([-\d.]+)"', atr); sy = re.search(r'\sy="([-\d.]+)"', atr)
        if not (sx and sy): continue
        fs = re.search(r'font-size="([\d.]+)"', atr)
        vsechny.append({'x': float(sx.group(1)), 'y': float(sy.group(1)), 't': text,
                        'fs': float(fs.group(1)) if fs else 10.5,
                        'ferry': 'FERRY' in text.upper()})
    sparovane = {i: [] for i in range(len(puvodni))}
    volne = []
    for t in vsechny:
        if t['ferry']: volne.append(t); continue
        i = min(range(len(puvodni)),
                key=lambda k: (puvodni[k][0] - t['x'])**2 + (puvodni[k][1] - t['y'])**2)
        d = math.hypot(puvodni[i][0] - t['x'], puvodni[i][1] - t['y'])
        (sparovane[i] if d < 90 else volne).append(t)
    ven = {}
    for i, ts in sparovane.items():
        if not ts: continue
        ts.sort(key=lambda t: (-t['fs'], t['y']))
        ven[i] = {'hlavni': ts[0]['t'], 'druhy': ts[1]['t'] if len(ts) > 1 else ''}
    return ven, [t['t'] for t in volne]

def regrese(v, s):
    n = len(v); sv = sum(v); ss = sum(s)
    a = (n * sum(x * y for x, y in zip(v, s)) - sv * ss) / (n * sum(x * x for x in s) - ss * ss)
    return a, (sv - a * ss) / n

def stara_mapa(zapisek):
    """Vrátí tělo PŮVODNÍ vložené mapy.

    Jakmile se stránka převede na sdílený modul, vložená mapa v ní není —
    a právě ona je zdrojem souřadnic. Proto se v takovém případě vytáhne
    z historie gitu. Ať to na ní nevisí navždy, výsledek se ukládá do
    `tools/mapy/zdroj/<zápisek>.svg`, který je v repozitáři.
    """
    zaloha = ZDE / 'zdroj' / f'{zapisek}.svg'
    if zaloha.exists():
        return zaloha.read_text(encoding='utf-8')
    import subprocess
    s = open(f'/home/user/mrkonopa.github.io/travels/{zapisek}.html', encoding='utf-8').read()
    m = re.search(r'<svg[^>]*viewBox="[^"]+"[^>]*>(.*?)</svg>', s, re.S)
    if not m:
        for rev in ('HEAD', 'HEAD~1', 'HEAD~2', 'HEAD~3', 'HEAD~4', 'HEAD~5', 'HEAD~6'):
            try:
                st = subprocess.run(['git', 'show', f'{rev}:travels/{zapisek}.html'],
                                    cwd='/home/user/mrkonopa.github.io',
                                    capture_output=True, text=True, check=True).stdout
            except subprocess.CalledProcessError:
                continue
            m = re.search(r'<svg[^>]*viewBox="[^"]+"[^>]*>(.*?)</svg>', st, re.S)
            if m: break
    if not m:
        raise SystemExit(f'{zapisek}: původní mapa se nenašla ani v historii')
    zaloha.parent.mkdir(parents=True, exist_ok=True)
    zaloha.write_text(m.group(1), encoding='utf-8')
    return m.group(1)


def rdp_iter(body, tol):
    """Douglas–Peucker bez rekurze.

    Ten rekurzivní výš stačí na obrysy států a na trasy vytažené ze staré
    mapy (stovky bodů). Surový GPX má ale 111 126 bodů, a tam by rekurze
    sáhla hluboko pod `sys.setrecursionlimit`. Výsledek je totožný.
    """
    if len(body) < 3: return body
    drzet = [False] * len(body); drzet[0] = drzet[-1] = True
    zasob = [(0, len(body) - 1)]
    while zasob:
        a, b = zasob.pop()
        if b <= a + 1: continue
        (x1, y1), (x2, y2) = body[a], body[b]
        dx, dy = x2 - x1, y2 - y1
        nej, idx = 0.0, a
        for i in range(a + 1, b):
            x, y = body[i]
            if dx == dy == 0: d = math.hypot(x - x1, y - y1)
            else:
                t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
                d = math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
            if d > nej: nej, idx = d, i
        if nej > tol:
            drzet[idx] = True
            zasob.append((a, idx)); zasob.append((idx, b))
    return [p for p, k in zip(body, drzet) if k]


def trasa_z_gpx(zapisek, gpx=None, tol_stupne=0.002):
    """Skutečný GPS záznam trasy → `zdroj/<zápisek>.trasa.json` (lat, lon).

    Surový export má 8,9 MB, což do repozitáře nepatří (a `.git` tu má i
    bez toho přes 700 MB). Uloží se proto ZJEDNODUŠENÁ trasa: Douglas–
    Peucker s tolerancí ~0,002° ≈ 220 m. Mapa je 300 jednotek široká na
    zhruba 1 400 km, takže 1 jednotka ≈ 4,7 km — 220 m je o víc než řád
    pod tím, co se dá na mapě rozeznat.
    """
    ulozene = ZDE / 'zdroj' / f'{zapisek}.trasa.json'
    if ulozene.exists():
        return [tuple(p) for p in json.load(open(ulozene, encoding='utf-8'))]
    if not gpx: raise SystemExit(f'{zapisek}: chybí GPX i uložená trasa')
    import xml.etree.ElementTree as ET
    ko = ET.parse(gpx).getroot(); ns = ko.tag.split('}')[0][1:]
    syrove = [(float(p.get('lat')), float(p.get('lon'))) for p in ko.iter('{%s}trkpt' % ns)]
    # předředění po ~250 m: ve městech je bodů hustě a RDP by je procházel
    # zbytečně; 250 m je hluboko pod tolerancí, takže se tvar nemění
    hust = [syrove[0]]
    for b in syrove[1:]:
        if (b[0] - hust[-1][0]) ** 2 + ((b[1] - hust[-1][1]) * 0.7) ** 2 >= 0.00225 ** 2:
            hust.append(b)
    if hust[-1] != syrove[-1]: hust.append(syrove[-1])
    lehka = rdp_iter(hust, tol_stupne)
    ulozene.parent.mkdir(parents=True, exist_ok=True)
    json.dump([[round(a, 5), round(b, 5)] for a, b in lehka], open(ulozene, 'w', encoding='utf-8'))
    print(f'  GPX {zapisek}: {len(syrove)} → {len(hust)} → {len(lehka)} bodů '
          f'({ulozene.stat().st_size / 1024:.0f} kB)')
    return lehka


def vyrob(zapisek, kotvy, sirka=300, okraj=10, tol_trasa=0.35, tol_podklad=0.45,
          bez_druheho=(), bez_zastavek=(), gpx=None):
    telo = stara_mapa(zapisek)

    puvodni = [(float(m.group(1)), float(m.group(2)), m.group(3).strip()) for m in
               re.finditer(r'<circle[^>]*?cx="([\d.]+)"[^>]*?cy="([\d.]+)"[^>]*?/>\s*<!--\s*(.*?)\s*-->', telo, re.S)]
    if not puvodni:   # Balt má komentář PŘED kolečkem
        puvodni = [(float(m.group(2)), float(m.group(3)), m.group(1).strip()) for m in
                   re.finditer(r'<!--\s*([^<>]{2,60}?)\s*-->\s*<circle[^>]*?cx="([\d.]+)"[^>]*?cy="([\d.]+)"', telo, re.S)]
    if not puvodni:   # spain-france nemá u koleček komentáře vůbec
        puvodni = [(float(m.group(1)), float(m.group(2)), '')
                   for m in re.finditer(r'<circle[^>]*?cx="([\d.]+)"[^>]*?cy="([\d.]+)"[^>]*?r="([\d.]+)"', telo, re.S)
                   if 2.5 <= float(m.group(3)) <= 7]
    pop, mimo = popisky(telo, [(x, y, _) and (x, y) for x, y, _ in puvodni])
    # Některé mapy nemají u koleček komentáře (spain-france) — tam se kotva
    # páruje podle vykresleného POPISKU zastávky.
    puvodni = [(x, y, popis or pop.get(i, {}).get('hlavni', ''))
               for i, (x, y, popis) in enumerate(puvodni)]

    par = []
    for x, y, popis in puvodni:
        for klic, (la, lo) in kotvy.items():
            # kód musí být na ZAČÁTKU komentáře, jinak „ES" sedne na „ES5 …"
            if popis.lower().startswith(klic.lower()) or klic.lower() in popis.lower().split():
                par.append((x, y, la, lo, klic)); break
    if len(par) < 3: sys.exit(f'{zapisek}: málo kotev ({len(par)})')
    ax, bx = regrese([p[0] for p in par], [p[3] for p in par])
    ay, by = regrese([p[1] for p in par], [p[2] for p in par])
    odch = max(max(abs(p[0] - (ax * p[3] + bx)), abs(p[1] - (ay * p[2] + by))) for p in par)
    strlat = sum(p[2] for p in par) / len(par)
    zplost = (abs(ax) / math.cos(math.radians(strlat))) / abs(ay)
    inv = lambda x, y: ((y - by) / ay, (x - bx) / ax)

    zast_geo = [(*inv(x, y), popis) for x, y, popis in puvodni]

    # Trasa: buď SKUTEČNÝ GPS záznam (lepší — vede po silnicích), nebo, když
    # ho pro cestu nemáme, čára ze staré mapy vrácená zpět na souřadnice.
    # Zastávky se berou ze staré mapy VŽDY: v GPX nejsou pojmenované.
    trasa_geo = (trasa_z_gpx(zapisek, gpx) if (gpx or (ZDE / 'zdroj' / f'{zapisek}.trasa.json').exists())
                 else [inv(*map(float, p.split(','))) for p in
                       re.search(r'<polyline[^>]*?points="([^"]+)"', telo, re.S).group(1).split()])
    zapis = trasa_geo is not None and (gpx or (ZDE / 'zdroj' / f'{zapisek}.trasa.json').exists())

    lats = [t[0] for t in trasa_geo]; lons = [t[1] for t in trasa_geo]
    if zapis:
        # Se záznamem musí výřez pokrýt i zastávky — leží na trase jen
        # přibližně (rekonstrukce ze staré mapy má odchylku v jednotkách
        # pixelů) a zastávka mimo plátno by se tiše oříznula.
        lats += [z[0] for z in zast_geo]; lons += [z[1] for z in zast_geo]
    rez = 0.45
    bbox = (min(lons) - rez, min(lats) - rez * 0.7, max(lons) + rez, max(lats) + rez * 0.7)
    k = math.cos(math.radians((bbox[1] + bbox[3]) / 2))
    sc = (sirka - 2 * okraj) / ((bbox[2] - bbox[0]) * k)
    vyska = (bbox[3] - bbox[1]) * sc + 2 * okraj
    P = lambda lo, la: (okraj + (lo - bbox[0]) * k * sc, okraj + (bbox[3] - la) * sc)

    trasa = rdp_iter([P(lo, la) for la, lo in trasa_geo], tol_trasa)
    zeme = []
    for jmeno, prsteny in nacti_topo(ZDE / 'countries-50m.json'):
        for pr in prsteny:
            xs = [b[0] for b in pr]; ys = [b[1] for b in pr]
            if max(xs) < bbox[0] - 2 or min(xs) > bbox[2] + 2 or max(ys) < bbox[1] - 2 or min(ys) > bbox[3] + 2:
                continue
            pr = orez_obdelnikem(pr, bbox)
            if len(pr) < 4: continue
            body = rdp([P(lo, la) for lo, la in pr], tol_podklad)
            if len(body) < 4: continue
            plocha = abs(sum(body[i][0] * body[(i+1) % len(body)][1] - body[(i+1) % len(body)][0] * body[i][1]
                             for i in range(len(body)))) / 2
            if plocha < 3: continue
            zeme.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in body) + 'Z')
    spoje = []
    for m in re.finditer(r'<line\b([^>]*stroke-dasharray[^>]*)/?>', telo, re.S):
        atr = m.group(1)
        c = {k: float(re.search(rf'{k}="([-\d.]+)"', atr).group(1)) for k in ('x1', 'y1', 'x2', 'y2')}
        najdi = lambda x, y: min(range(len(puvodni)),
                                 key=lambda k: (puvodni[k][0] - x)**2 + (puvodni[k][1] - y)**2)
        spoje.append({'z': najdi(c['x1'], c['y1']), 'do': najdi(c['x2'], c['y2']),
                      'popis': mimo[0] if mimo else ''})


    # ── řez trasy tam, kde se PLULO ────────────────────────────────────
    # Export z mapy.cz je dopočítaná cesta, ne surový GPS záznam: mezi
    # Palermem a Salernem protáhl plánovač silnici přes Messinu a Kalábrii,
    # takže mapa tvrdila, že se ze Sicílie jelo zpátky autem. Úsek mezi
    # zastávkami trajektu se proto z trasy VYŘÍZNE a zobrazí ho čárkovaná
    # čára spoje. Ověřeno měřením: trasa jinde vede po moři jen dvakrát
    # po třech bodech, a to je Messinská úžina.
    zast_body = [P(lo, la) for la, lo, _ in zast_geo]
    def nejbliz(i):
        zx, zy = zast_body[i]
        return min(range(len(trasa)), key=lambda k: (trasa[k][0]-zx)**2 + (trasa[k][1]-zy)**2)
    rezy = sorted((min(nejbliz(s['z']), nejbliz(s['do'])),
                   max(nejbliz(s['z']), nejbliz(s['do']))) for s in spoje)
    trasy, zac = [], 0
    for a, b in rezy:
        if a > zac: trasy.append(trasa[zac:a + 1])
        zac = b
    trasy.append(trasa[zac:])
    trasy = [t for t in trasy if len(t) > 1]

    return {
        'sirka': round(sirka), 'vyska': round(vyska, 1), 'spoje': spoje,
        # Odkud je ČÁRA TRASY. `gps` = skutečný záznam (vede po silnicích),
        # `stara-mapa` = čára z ručně kreslené mapy vrácená na souřadnice.
        # Zastávky jsou ze staré mapy v obou případech, proto `odchylkaKotev`
        # platí dál — jen se u `gps` týká JEN zastávek, ne trasy.
        'zdrojTrasy': 'gps' if zapis else 'stara-mapa',
        'zplosteniPredtim': round(zplost, 2), 'odchylkaKotev': round(odch, 2),
        'podklad': zeme,
        'trasy': [' '.join(f'{x:.1f},{y:.1f}' for x, y in t) for t in trasy],
        # `bez_zastavek`: místa, kam se nakonec nejelo. Zůstat tam nesmí —
        # mapa by tvrdila něco jiného než článek (Sporto rūmai ve Vilniusu).
        'zastavky': [{'x': round(P(lo, la)[0], 1), 'y': round(P(lo, la)[1], 1),
                      'hlavni': pop.get(i, {}).get('hlavni', ''),
                      'druhy': ('' if pop.get(i, {}).get('hlavni', '') in bez_druheho
                                else pop.get(i, {}).get('druhy', '')),
                      'zacatek': 'start' in p.lower()}
                     for i, (la, lo, p) in enumerate(zast_geo)
                     if pop.get(i, {}).get('hlavni', '') not in bez_zastavek],
    }

def kotvy_z_kmz(cesta):
    """Kotvy z Vojtova KMZ: klíč je kód (P7, ES5…), který je i v komentáři mapy."""
    mapa = json.load(open(cesta))
    ven = {}
    for x in mapa:
        jm = re.sub(r'<!\[CDATA\[|\]\]>', '', x['nazev']).strip()
        # Jen kódy tvaru P7 / ES5 / LI1. Dřív se bralo cokoli před pomlčkou,
        # takže z „ES-1_Zatopené vězení" vyšel klíč „ES" — a ten se pak
        # napasoval na první komentář, ve kterém se „es" vyskytlo. Fit tím
        # vyšel na 25 px místo 0,6.
        m = re.match(r'([A-Z]{1,3}\d+)\b', jm)
        if m: ven[m.group(1)] = (x['lat'], x['lon'])
    return ven


def vyrob_nove(zapisek, gpx, zastavky, sirka=300, okraj=10,
               tol_trasa=0.35, tol_podklad=0.45, opravy=(), rez=0.45):
    """Mapa pro cestu, která STAROU ručně kreslenou mapu nemá.

    Tady se nic neinvertuje: trasa je skutečný záznam a zastávky mají
    souřadnice z Vojtova plánu, takže odpadá celé párování kotev.

    `opravy` = úseky, kde se vyexportovaná trasa liší od SKUTEČNĚ jeté.
    Každá je `{'od': (lat,lon), 'do': (lat,lon), 'pres': [(lat,lon), …],
    'proc': '…'}`: kus mezi nejbližšími body k `od` a `do` se vyřízne a
    nahradí čarou přes `pres`. Vzniklo to proto, že export z mapy.cz
    protáhl cestu od solných plání po POBŘEŽÍ přes Bar, jenže se jelo
    horskou R15 nad Skadarským jezerem — naměřeno, že trasa míjí
    vyhlídku o 4,8 km a Barem prochází na 60 m.
    """
    syrove = trasa_z_gpx(zapisek, gpx)

    def nejbliz(body, cil):
        return min(range(len(body)), key=lambda i:
                   (body[i][0] - cil[0]) ** 2 +
                   ((body[i][1] - cil[1]) * math.cos(math.radians(cil[0]))) ** 2)

    nahrazeno = []
    for o in opravy:
        a, b = nejbliz(syrove, o['od']), nejbliz(syrove, o['do'])
        if a > b: a, b = b, a
        nahrazeno.append({'proc': o['proc'], 'bodu_pryc': b - a,
                          'bodu_misto': len(o['pres']) + 2})
        syrove = syrove[:a + 1] + list(o['pres']) + syrove[b:]

    lats = [t[0] for t in syrove] + [z['lat'] for z in zastavky]
    lons = [t[1] for t in syrove] + [z['lon'] for z in zastavky]
    # `rez` = volné pole kolem trasy. Nejjižnější zastávka potřebuje místo
    # POD sebou, jinak jí popisek nezbude než nahoru a srazí se se sousedem
    # (Ohrid × Mavrovo, 77 km od sebe, a přesto na sobě).
    bbox = (min(lons) - rez, min(lats) - rez * 0.7, max(lons) + rez, max(lats) + rez * 0.7)
    k = math.cos(math.radians((bbox[1] + bbox[3]) / 2))
    sc = (sirka - 2 * okraj) / ((bbox[2] - bbox[0]) * k)
    vyska = (bbox[3] - bbox[1]) * sc + 2 * okraj
    P = lambda lo, la: (okraj + (lo - bbox[0]) * k * sc, okraj + (bbox[3] - la) * sc)

    trasa = rdp_iter([P(lo, la) for la, lo in syrove], tol_trasa)

    zeme = []
    for _, prsteny in nacti_topo(ZDE / 'countries-50m.json'):
        for pr in prsteny:
            xs = [b[0] for b in pr]; ys = [b[1] for b in pr]
            if max(xs) < bbox[0] - 2 or min(xs) > bbox[2] + 2 or max(ys) < bbox[1] - 2 or min(ys) > bbox[3] + 2:
                continue
            pr = orez_obdelnikem(pr, bbox)
            if len(pr) < 4: continue
            body = rdp_iter([P(lo, la) for lo, la in pr], tol_podklad)
            if len(body) < 4: continue
            plocha = abs(sum(body[i][0] * body[(i + 1) % len(body)][1] -
                             body[(i + 1) % len(body)][0] * body[i][1]
                             for i in range(len(body)))) / 2
            if plocha < 3: continue
            zeme.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in body) + 'Z')

    return {
        'sirka': round(sirka), 'vyska': round(vyska, 1), 'spoje': [],
        'zdrojTrasy': 'gps', 'opravy': nahrazeno,
        'podklad': zeme,
        'trasy': [' '.join(f'{x:.1f},{y:.1f}' for x, y in trasa)],
        'zastavky': [{'x': round(P(z['lon'], z['lat'])[0], 1),
                      'y': round(P(z['lon'], z['lat'])[1], 1),
                      'hlavni': z['hlavni'], 'druhy': z.get('druhy', ''),
                      'zacatek': z.get('zacatek', False)} for z in zastavky],
    }


def vyrob_body(zapisek, zastavky, sirka=300, okraj=10, tol_podklad=0.45, rez=0.45):
    """Mapa pro cestu, u které NENÍ ZÁZNAM TRASY — jen pojmenované zastávky.

    Tohle je třetí případ vedle `vyrob` (stará kreslená mapa se invertuje)
    a `vyrob_nove` (je GPX). Ukrajina 2017, Chorvatsko s Bosnou 2018
    a Jugoslávie 2020 neměly ANI JEDNO: jejich vložené mapy byly ruční
    náčrty se čtyřmi až devíti body a přímými čárami mezi nimi, BEZ
    JEDINÉHO OBRYSU PEVNINY. Vojta to nahlásil z obrazovky: „rád bych,
    aby to bylo dokreslené až do kraje… přidat konturu států, které tam
    jsou."

    Invertovat se ty náčrty nedají: `vyrob` staví na tom, že stará mapa
    je LINEÁRNÍ PROJEKCÍ skutečných souřadnic (ověřeno u Itálie na 0–5 km
    a u Baltu na 0,6 px), ale u čtyř ručně rozmístěných bodů by regrese
    měla jen dva stupně volnosti a malá odchylka by nic nedokazovala.
    Zastávky proto mají souřadnice rovnou — jména míst napsal na mapu
    Vojta, dohledat k nim polohu je otázka faktu, ne odhadu.

    Trasa zůstává PŘERUŠOVANÁ čára mezi zastávkami, jako byla dosud:
    kudy se přesně jelo, nevíme, a plná čára by to tvrdila. Až záznam
    přijde, zápisek se převede přes `vyrob_nove`.
    """
    lats = [z['lat'] for z in zastavky]
    lons = [z['lon'] for z in zastavky]
    bbox = (min(lons) - rez, min(lats) - rez * 0.7, max(lons) + rez, max(lats) + rez * 0.7)
    k = math.cos(math.radians((bbox[1] + bbox[3]) / 2))

    # MEZ NA POMĚR STRAN. Bez ní vyšlo Chorvatsko 300 × 926, tedy 3,09 —
    # Liberec–Dubrovník je 8,1° na výšku, ale jen 2,1 šířkové jednotky, a
    # z mapy by byla nudle 1 500 px vysoká. Dopočítá se proto chybějící
    # okraj na UŽŠÍ ose: mapa tím ukáže víc okolní pevniny, což je přesně
    # to, oč tady jde. Meze jsou naměřené z hotových map: nejvyšší je
    # Itálie 2,51 (ta je v pořádku), nejplošší Španělsko 0,99; strop 2,2
    # a podlaha 0,45 tedy leží uvnitř toho, co už na webu je.
    POMER_MAX, POMER_MIN = 2.2, 0.45
    sir = (bbox[2] - bbox[0]) * k
    vys = bbox[3] - bbox[1]
    if vys / sir > POMER_MAX:                      # moc vysoká ⇒ rozšířit
        chybi = (vys / POMER_MAX - sir) / 2 / k
        bbox = (bbox[0] - chybi, bbox[1], bbox[2] + chybi, bbox[3])
    elif vys / sir < POMER_MIN:                    # moc plochá ⇒ zvýšit
        chybi = (sir * POMER_MIN - vys) / 2
        bbox = (bbox[0], bbox[1] - chybi, bbox[2], bbox[3] + chybi)
    k = math.cos(math.radians((bbox[1] + bbox[3]) / 2))
    sc = (sirka - 2 * okraj) / ((bbox[2] - bbox[0]) * k)
    vyska = (bbox[3] - bbox[1]) * sc + 2 * okraj
    P = lambda lo, la: (okraj + (lo - bbox[0]) * k * sc, okraj + (bbox[3] - la) * sc)

    zeme = []
    for _, prsteny in nacti_topo(ZDE / 'countries-50m.json'):
        for pr in prsteny:
            xs = [b[0] for b in pr]; ys = [b[1] for b in pr]
            if max(xs) < bbox[0] - 2 or min(xs) > bbox[2] + 2 or max(ys) < bbox[1] - 2 or min(ys) > bbox[3] + 2:
                continue
            pr = orez_obdelnikem(pr, bbox)
            if len(pr) < 4: continue
            body = rdp_iter([P(lo, la) for lo, la in pr], tol_podklad)
            if len(body) < 4: continue
            plocha = abs(sum(body[i][0] * body[(i + 1) % len(body)][1] -
                             body[(i + 1) % len(body)][0] * body[i][1]
                             for i in range(len(body)))) / 2
            if plocha < 3: continue
            zeme.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in body) + 'Z')

    # Spoje = přerušované úsečky v pořadí, jak se jelo. Poslední zpátky na
    # začátek jen u okruhu (`okruh: True` na poslední zastávce).
    spoje = [{'z': i, 'do': i + 1} for i in range(len(zastavky) - 1)]
    if zastavky[-1].get('okruh'):
        spoje.append({'z': len(zastavky) - 1, 'do': 0})

    return {
        'sirka': round(sirka), 'vyska': round(vyska, 1),
        'zdrojTrasy': 'jen-zastavky', 'podklad': zeme,
        'trasy': [], 'spoje': spoje,
        'zastavky': [{'x': round(P(z['lon'], z['lat'])[0], 1),
                      'y': round(P(z['lon'], z['lat'])[1], 1),
                      'hlavni': z['hlavni'], 'druhy': z.get('druhy', ''),
                      'zacatek': z.get('zacatek', False)} for z in zastavky],
    }


# ══════════════════════════════════════════════════════════════════════
#  Tři zápisky bez záznamu trasy (viz `vyrob_body`). Spouští se zvlášť:
#      python3 tools/mapy/gen.py body
#  Souřadnice odpovídají jménům, která Vojta napsal na původní mapu.
#  Dvě jsou OBLASTI, ne body — u nich je vzatý přirozený střed té části
#  pobřeží, kam původní náčrt zastávku kreslil, a je to tu napsané, aby
#  se z toho nedělala přesnost, která tam není.
# ══════════════════════════════════════════════════════════════════════
BODY_CEST = {
    'ukraine-2017': (
        'Mapa trasy: Liberec, Kyjev, Černobyl a Karpaty',
        [
            {'hlavni': 'CZ · LIBEREC', 'lat': 50.7663, 'lon': 15.0543, 'zacatek': True},
            {'hlavni': 'UA · KYIV', 'druhy': 'capital · base', 'lat': 50.4501, 'lon': 30.5234},
            {'hlavni': 'CHERNOBYL', 'druhy': 'exclusion zone', 'lat': 51.2763, 'lon': 30.2219},
            # Ukrajinské Karpaty; původní náčrt kreslí „SW mountains" do
            # jihozápadního cípu země — nejvyšší část je okolí Hoverly.
            {'hlavni': 'CARPATHIANS', 'druhy': 'SW mountains',
             'lat': 48.1600, 'lon': 24.5003, 'okruh': True},
        ]),
    'cr-bh-2018': (
        'Mapa trasy: Chorvatsko a Bosna — Kumrovec, Una, Dalmácie, Mostar',
        [
            {'hlavni': 'CZ · LIBEREC', 'lat': 50.7663, 'lon': 15.0543, 'zacatek': True},
            {'hlavni': 'HR · KUMROVEC', 'druhy': 'tito birthplace', 'lat': 46.0575, 'lon': 15.6783},
            {'hlavni': 'ŠTRBAČKI BUK', 'druhy': 'waterfall · una river', 'lat': 44.6656, 'lon': 16.1528},
            # OBLAST, ne bod: Dalmácie. Střed té části pobřeží = Split.
            {'hlavni': 'HR · DALMATIA', 'druhy': 'adriatic coast', 'lat': 43.5081, 'lon': 16.4402},
            {'hlavni': 'HR · DUBROVNIK', 'druhy': 'south coast', 'lat': 42.6507, 'lon': 18.0944},
            {'hlavni': 'BiH · MOSTAR', 'druhy': 'herzegovina · bridge',
             'lat': 43.3373, 'lon': 17.8150, 'okruh': True},
        ]),
    'yugoslavia-2020': (
        'Mapa trasy: Maďarsko, Srbsko, Bulharsko, Řecko, Albánie a Dalmácie',
        [
            {'hlavni': 'CZ · LIBEREC', 'lat': 50.7663, 'lon': 15.0543, 'zacatek': True},
            {'hlavni': 'HU · OROSZLÁNY', 'druhy': 'coal plant', 'lat': 47.4833, 'lon': 18.3167},
            {'hlavni': 'RS · BELGRADE', 'druhy': 'capital', 'lat': 44.7866, 'lon': 20.4489},
            {'hlavni': 'BG · BUZLUDZHA', 'druhy': 'monument', 'lat': 42.7358, 'lon': 25.3936},
            {'hlavni': 'BG · SOFIA', 'druhy': 'city', 'lat': 42.6977, 'lon': 23.3219},
            {'hlavni': 'GR · THESSALONIKI', 'druhy': 'train graveyard', 'lat': 40.6401, 'lon': 22.9444},
            {'hlavni': 'GR · ATHENS', 'druhy': 'ellinikon · ace high', 'lat': 37.9838, 'lon': 23.7275},
            {'hlavni': 'AL · POLIÇAN', 'druhy': 'ammo factory', 'lat': 40.6167, 'lon': 20.1000},
            # OBLAST, ne bod: jižní Dalmácie. Střed = Split.
            {'hlavni': 'HR · DALMATIA', 'druhy': 'south coast',
             'lat': 43.5081, 'lon': 16.4402, 'okruh': True},
        ]),
}


def udelej_body():
    ven = Path('/home/user/mrkonopa.github.io/travels/mapy')
    ven.mkdir(parents=True, exist_ok=True)
    for zapisek, (popis, zast) in BODY_CEST.items():
        d = vyrob_body(zapisek, zast)
        d['popis'] = popis
        (ven / f'{zapisek}.js').write_text(
            '/* Data mapy trasy — vyrobil tools/mapy/gen.py, needituj ručně. */\n'
            'window.MAPA_TRASY = ' + json.dumps(d, ensure_ascii=False) + ';\n', encoding='utf-8')
        print(f"→ travels/mapy/{zapisek}.js   plátno {d['sirka']}×{d['vyska']}, "
              f"podklad {len(d['podklad'])} obrysů, zastávek {len(d['zastavky'])}, "
              f"spojů {len(d['spoje'])}, {len(json.dumps(d))//1024} kB")


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'body':
        udelej_body(); sys.exit(0)

    KOTVY_IT = {'CZ start/end': (50.767, 15.056), 'Craco': (40.377, 16.440), 'Etna': (37.751, 14.993),
                'Agrigento': (37.311, 13.577), 'Palermo': (38.116, 13.361), 'Salerno / Vietri': (40.673, 14.727),
                'Rome': (41.903, 12.496), "Lago d'Iseo": (45.717, 10.062)}
    d = vyrob('italy-2022', KOTVY_IT, bez_druheho=("IT · LAGO D'ISEO",))
    d['popis'] = 'Mapa trasy: Liberec, Dolomity, Řím, Sicílie a zpět trajektem'
    ven = Path('/home/user/mrkonopa.github.io/travels/mapy'); ven.mkdir(parents=True, exist_ok=True)
    (ven / 'italy-2022.js').write_text(
        '/* Data mapy trasy — vyrobil tools/mapy/gen.py, needituj ručně. */\n'
        'window.MAPA_TRASY = ' + json.dumps(d, ensure_ascii=False) + ';\n', encoding='utf-8')
    print('→ travels/mapy/italy-2022.js')

    # ── Francie a Španělsko: kotvy podle POPISKŮ měst (u koleček nejsou
    #    komentáře). Odchylka 0,66 px potvrzuje, že i tahle mapa je
    #    lineární projekcí skutečných souřadnic.
    KOTVY_ES = {
        'Liberec': (50.767, 15.056), 'Paris': (48.857, 2.352), 'Madrid': (40.417, -3.704),
        'Barcelona': (41.385, 2.173), 'Marseille': (43.296, 5.370), 'Toulon': (43.125, 5.930),
        'Benidorm': (38.538, -0.131), 'Pointe du Hoc': (49.396, -0.989),
    }
    GPX_ES = '/root/.claude/uploads/bb6c9958-601f-50e9-b037-8b2b3a7ac6a9/095aee60-export7.gpx'
    d = vyrob('spain-france-2021', KOTVY_ES,
              gpx=GPX_ES if Path(GPX_ES).exists() else None)
    d['popis'] = 'Mapa trasy: Francie, Španělsko a zpět přes Itálii'
    (ven / 'spain-france-2021.js').write_text(
        '/* Data mapy trasy — vyrobil tools/mapy/gen.py, needituj ručně. */\n'
        'window.MAPA_TRASY = ' + json.dumps(d, ensure_ascii=False) + ';\n', encoding='utf-8')
    print(f"→ travels/mapy/spain-france-2021.js   plátno {d['sirka']}×{d['vyska']}, "
          f"dřív zploštělé {d['zplosteniPredtim']}×, odchylka kotev {d['odchylkaKotev']} px, "
          f"zastávek {len(d['zastavky'])}")

    # ── Balt: kotvy přímo z KMZ, se kterým se mapa kreslila ───────────
    KMZ = '/tmp/claude-0/-home-user-mrkonopa-github-io/bb6c9958-601f-50e9-b037-8b2b3a7ac6a9/scratchpad/baltic/mapa.json'
    if Path(KMZ).exists():
        d = vyrob('baltic-2023', kotvy_z_kmz(KMZ), bez_zastavek=('Vilnius',))
        d['popis'] = 'Mapa trasy: Polsko, Litva, Lotyšsko a Estonsko'
        (ven / 'baltic-2023.js').write_text(
            '/* Data mapy trasy — vyrobil tools/mapy/gen.py, needituj ručně. */\n'
            'window.MAPA_TRASY = ' + json.dumps(d, ensure_ascii=False) + ';\n', encoding='utf-8')
        print(f"→ travels/mapy/baltic-2023.js   plátno {d['sirka']}×{d['vyska']}, "
              f"dřív zploštělé {d['zplosteniPredtim']}×, odchylka kotev {d['odchylkaKotev']} px, "
              f"zastávek {len(d['zastavky'])}")

    # ── Kosovo 2024: první cesta, která má SKUTEČNÝ záznam i pojmenovaná
    #    místa se souřadnicemi, takže se nic neinvertuje ze staré mapy ──
    GPX_KOS = '/root/.claude/uploads/bb6c9958-601f-50e9-b037-8b2b3a7ac6a9/5972aaaf-export8.gpx'
    if Path(GPX_KOS).exists() or (ZDE / 'zdroj' / 'kosovo-2024.trasa.json').exists():
        # Zastávky: jen ta místa, která POTVRZUJÍ FOTKY. Do mapy se nedává,
        # co bylo jen v plánu — Balt na tom pohořel s Vilniusem.
        ZAST = [
            {'hlavni': 'Liberec',      'lat': 50.7702, 'lon': 15.0586, 'zacatek': True},
            {'hlavni': 'Budapešť',     'lat': 47.5487, 'lon': 19.1041, 'druhy': 'hrob vláčků'},
            {'hlavni': 'Novi Sad',     'lat': 45.2490, 'lon': 19.8105, 'druhy': 'Jugoalat'},
            {'hlavni': 'Trepča',       'lat': 42.9103, 'lon': 20.8483, 'druhy': 'důl a slévárna'},
            {'hlavni': 'Priština',     'lat': 42.6671, 'lon': 21.1669},
            {'hlavni': 'Prekaz',       'lat': 42.7541, 'lon': 20.8056, 'druhy': 'Adem Jashari'},
            {'hlavni': 'Mavrovo',      'lat': 41.6601, 'lon': 20.7355},
            {'hlavni': 'Ohrid',        'lat': 40.9795, 'lon': 20.9150},
            {'hlavni': 'Ulcinj',       'lat': 41.9175, 'lon': 19.2520, 'druhy': 'solné pláně'},
            {'hlavni': 'Skadar',       'lat': 42.0645, 'lon': 19.3741, 'druhy': 'vyhlídka na R15'},
            {'hlavni': 'Grmožur',      'lat': 42.2447, 'lon': 19.0925},
        ]
        # Export z mapy.cz protáhl cestu od solných plání po POBŘEŽÍ přes Bar.
        # Ve skutečnosti se jelo horskou R15 nad Skadarským jezerem — naměřeno,
        # že vyexportovaná trasa míjí vyhlídku o 4,8 km a Barem prochází na 60 m.
        OPRAVY = [{
            'od': (41.9175, 19.2520), 'do': (42.2447, 19.0925),
            'pres': [(42.0645, 19.3741), (42.1000, 19.3300), (42.1400, 19.2600),
                     (42.1700, 19.2000), (42.2000, 19.1300)],
            'proc': 'export vedl po pobřeží přes Bar, jelo se horskou R15 nad jezerem',
        }]
        d = vyrob_nove('kosovo-2024', GPX_KOS if Path(GPX_KOS).exists() else None, ZAST, opravy=OPRAVY, rez=0.75)
        d['popis'] = 'Mapa trasy: Maďarsko, Srbsko, Kosovo, Severní Makedonie a Černá Hora'
        (ven / 'kosovo-2024.js').write_text(
            '/* Data mapy trasy — vyrobil tools/mapy/gen.py, needituj ručně. */\n'
            'window.MAPA_TRASY = ' + json.dumps(d, ensure_ascii=False) + ';\n', encoding='utf-8')
        print(f"→ travels/mapy/kosovo-2024.js   plátno {d['sirka']}×{d['vyska']}, "
              f"zastávek {len(d['zastavky'])}, trasa {sum(t.count(',') for t in d['trasy'])} bodů, "
              f"oprav {len(d['opravy'])}")
        for o in d['opravy']:
            print(f"    oprava: {o['proc']} ({o['bodu_pryc']} bodů pryč, {o['bodu_misto']} místo nich)")

    print(f"plátno {d['sirka']} × {d['vyska']}   (dřív zploštělé {d['zplosteniPredtim']}×, "
          f"odchylka kotev {d['odchylkaKotev']} px)")
    print(f"podklad {len(d['podklad'])} obrysů, trasa {sum(t.count(',') for t in d['trasy'])} bodů "
          f"ve {len(d['trasy'])} úsecích, "
          f"soubor {len(json.dumps(d))//1024} kB")
    bez = [z for z in d['zastavky'] if not z['hlavni']]
    print(f"zastávek {len(d['zastavky'])}, bez popisku {len(bez)}, spojů (trajekt) {len(d['spoje'])}")
    for z in d['zastavky']: print(f"   {z['hlavni'][:26]:28} {z['druhy'][:24]}")
