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


if __name__ == '__main__':
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
    print(f"plátno {d['sirka']} × {d['vyska']}   (dřív zploštělé {d['zplosteniPredtim']}×, "
          f"odchylka kotev {d['odchylkaKotev']} px)")
    print(f"podklad {len(d['podklad'])} obrysů, trasa {sum(t.count(',') for t in d['trasy'])} bodů "
          f"ve {len(d['trasy'])} úsecích, "
          f"soubor {len(json.dumps(d))//1024} kB")
    bez = [z for z in d['zastavky'] if not z['hlavni']]
    print(f"zastávek {len(d['zastavky'])}, bez popisku {len(bez)}, spojů (trajekt) {len(d['spoje'])}")
    for z in d['zastavky']: print(f"   {z['hlavni'][:26]:28} {z['druhy'][:24]}")
