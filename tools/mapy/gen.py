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


def popisky(telo, puvodni):
    """Spáruje <text> se stopou podle nejbližšího bodu ve starých souřadnicích.
    Rozlišuje hlavní a doplňkový řádek podle velikosti písma — v původních
    mapách je doplněk vždy menší (9–9,5 proti 10,5–11)."""
    vsechny = []
    for m in re.finditer(r'<text\b([^>]*)>(.*?)</text>', telo, re.S):
        atr, text = m.group(1), re.sub(r'<[^>]+>', '', m.group(2)).strip()
        if not text: continue
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

def vyrob(zapisek, kotvy, sirka=300, okraj=10, tol_trasa=0.35, tol_podklad=0.45,
          bez_druheho=()):
    s = open(f'/home/user/mrkonopa.github.io/travels/{zapisek}.html', encoding='utf-8').read()
    telo = re.search(r'<svg[^>]*viewBox="[^"]+"[^>]*>(.*?)</svg>', s, re.S).group(1)

    puvodni = [(float(m.group(1)), float(m.group(2)), m.group(3).strip()) for m in
               re.finditer(r'<circle[^>]*?cx="([\d.]+)"[^>]*?cy="([\d.]+)"[^>]*?/>\s*<!--\s*(.*?)\s*-->', telo, re.S)]
    par = []
    for x, y, popis in puvodni:
        for klic, (la, lo) in kotvy.items():
            if klic.lower() in popis.lower(): par.append((x, y, la, lo, klic)); break
    if len(par) < 3: sys.exit(f'{zapisek}: málo kotev ({len(par)})')
    ax, bx = regrese([p[0] for p in par], [p[3] for p in par])
    ay, by = regrese([p[1] for p in par], [p[2] for p in par])
    odch = max(max(abs(p[0] - (ax * p[3] + bx)), abs(p[1] - (ay * p[2] + by))) for p in par)
    strlat = sum(p[2] for p in par) / len(par)
    zplost = (abs(ax) / math.cos(math.radians(strlat))) / abs(ay)
    inv = lambda x, y: ((y - by) / ay, (x - bx) / ax)

    trasa_geo = [inv(*map(float, p.split(','))) for p in
                 re.search(r'<polyline[^>]*?points="([^"]+)"', telo, re.S).group(1).split()]
    zast_geo = [(*inv(x, y), popis) for x, y, popis in puvodni]

    lats = [t[0] for t in trasa_geo]; lons = [t[1] for t in trasa_geo]
    rez = 0.45
    bbox = (min(lons) - rez, min(lats) - rez * 0.7, max(lons) + rez, max(lats) + rez * 0.7)
    k = math.cos(math.radians((bbox[1] + bbox[3]) / 2))
    sc = (sirka - 2 * okraj) / ((bbox[2] - bbox[0]) * k)
    vyska = (bbox[3] - bbox[1]) * sc + 2 * okraj
    P = lambda lo, la: (okraj + (lo - bbox[0]) * k * sc, okraj + (bbox[3] - la) * sc)

    trasa = rdp([P(lo, la) for la, lo in trasa_geo], tol_trasa)
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
    pop, mimo = popisky(telo, [(x, y) for x, y, _ in puvodni])
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
        'zplosteniPredtim': round(zplost, 2), 'odchylkaKotev': round(odch, 2),
        'podklad': zeme,
        'trasy': [' '.join(f'{x:.1f},{y:.1f}' for x, y in t) for t in trasy],
        'zastavky': [{'x': round(P(lo, la)[0], 1), 'y': round(P(lo, la)[1], 1),
                      'hlavni': pop.get(i, {}).get('hlavni', ''),
                      'druhy': ('' if pop.get(i, {}).get('hlavni', '') in bez_druheho
                                else pop.get(i, {}).get('druhy', '')),
                      'zacatek': 'start' in p.lower()}
                     for i, (la, lo, p) in enumerate(zast_geo)],
    }

if __name__ == '__main__':
    KOTVY_IT = {'CZ start/end': (50.767, 15.056), 'Craco': (40.377, 16.440), 'Etna': (37.751, 14.993),
                'Agrigento': (37.311, 13.577), 'Palermo': (38.116, 13.361), 'Salerno / Vietri': (40.673, 14.727),
                'Rome': (41.903, 12.496), "Lago d'Iseo": (45.717, 10.062)}
    d = vyrob('italy-2022', KOTVY_IT, bez_druheho=("IT · LAGO D'ISEO",))
    json.dump(d, open(ZDE / 'italy2.json', 'w'), ensure_ascii=False)
    print(f"plátno {d['sirka']} × {d['vyska']}   (dřív zploštělé {d['zplosteniPredtim']}×, "
          f"odchylka kotev {d['odchylkaKotev']} px)")
    print(f"podklad {len(d['podklad'])} obrysů, trasa {sum(t.count(',') for t in d['trasy'])} bodů "
          f"ve {len(d['trasy'])} úsecích, "
          f"soubor {len(json.dumps(d))//1024} kB")
    bez = [z for z in d['zastavky'] if not z['hlavni']]
    print(f"zastávek {len(d['zastavky'])}, bez popisku {len(bez)}, spojů (trajekt) {len(d['spoje'])}")
    for z in d['zastavky']: print(f"   {z['hlavni'][:26]:28} {z['druhy'][:24]}")
