#!/usr/bin/env python3
"""Souhrn vytěžených testů CERMAT → ROZBOR.md (jen počty, žádné znění úloh).

Čte ulohy.json z mezipaměti (vytez.py) a spočítá, jak často se na které pozici
testu objevuje který typ úlohy, okruh a nákres. Znění úloh do souhrnu nejde —
ten se commituje, zatímco doslovné texty zůstávají v mezipaměti mimo git.

Okruh je ODHAD podle klíčových slov (vytez.py → okruh()), ne ruční zařazení.

Spuštění:  python3 tools/cermat-archiv/rozbor.py [adresář mezipaměti]
"""
import json, sys
from collections import Counter, defaultdict
from pathlib import Path

TU = Path(__file__).parent
CACHE = Path(sys.argv[1]) if len(sys.argv) > 1 else TU / '.cache'
STUPNE = {'M9': 'čtyřleté obory (9. ročník)', 'M7': 'šestiletá gymnázia (7. ročník)', 'M5': 'osmiletá gymnázia (5. ročník)'}
TYPY = {'otevrena': 'otevřená', 'vyber': 'výběr', 'ano-ne': 'ano/ne', 'prirazovani': 'přiřazování', 'konstrukce': 'konstrukce'}


def pct(n, z):
    return f'{round(100 * n / z)} %' if z else '–'


def main():
    testy = json.loads((CACHE / 'ulohy.json').read_text(encoding='utf-8'))
    out = ['# Rozbor ostrých testů CERMAT z matematiky', '',
           'Vygenerováno nástrojem `tools/cermat-archiv/rozbor.py` z testů, které stáhne `stahni.py`',
           'a rozdělí na úlohy `vytez.py`. Jen počty, žádné znění úloh. **Okruh je odhad podle klíčových',
           'slov**, takže slouží k orientaci, ne jako ruční zařazení.', '']
    out += ['## Pokrytí', '', '| stupeň | testů | roky | úloh | počet úloh sedí s klíčem | úloh se správným řešením z klíče | stran přes OCR |',
            '|---|---|---|---|---|---|---|']
    for st in ['M9', 'M7', 'M5', 'nanecisto']:
        tt = [t for t in testy if t['stupen'] == st]
        if not tt:
            continue
        uu = [u for t in tt for u in t['ulohy']]
        sedi = sum(1 for t in tt if t['pocet_podle_klice'].get('celkem') in (None, t['nalezeno_uloh']))
        s_odp = sum(1 for u in uu if u['odpoved'] or any(p['odpoved'] for p in u['podulohy']))
        roky = f"{min(t['rok'] for t in tt)}–{max(t['rok'] for t in tt)}"
        out.append(f"| {STUPNE.get(st, 'přijímačky nanečisto')} | {len(tt)} | {roky} | {len(uu)} | {sedi} z {len(tt)} | "
                   f"{s_odp} ({pct(s_odp, len(uu))}) | {sum(t.get('ocr_stran', 0) for t in tt)} |")
    out.append('')

    for st, nazev in STUPNE.items():
        tt = [t for t in testy if t['stupen'] == st]
        podle_pozice = defaultdict(list)
        for t in tt:
            for u in t['ulohy']:
                podle_pozice[u['cislo']].append(u)
        out += [f'## {nazev}', '', f'{len(tt)} testů. Na každé pozici: kolik testů ji má, nejčastější typy a okruhy, podíl úloh s nákresem.', '',
                '| pozice | testů | typ | okruh (odhad) | nákres | body (nejčastěji) |', '|---|---|---|---|---|---|']
        for poz in sorted(podle_pozice):
            uu = podle_pozice[poz]
            if len(uu) < 5:
                continue
            typy = ', '.join(f'{TYPY[k]} {pct(v, len(uu))}' for k, v in Counter(u['typ'] for u in uu).most_common(2))
            okruhy = ', '.join(f'{k} {pct(v, len(uu))}' for k, v in Counter(u['okruh'] for u in uu).most_common(3))
            znamy = [u for u in uu if u['nakres'] is not None]
            nak = pct(sum(1 for u in znamy if u['nakres']), len(znamy))
            body = Counter(u['body'] for u in uu if u['body']).most_common(1)
            out.append(f"| {poz} | {len(uu)} | {typy} | {okruhy} | {nak} | {body[0][0] if body else '–'} |")
        uu = [u for t in tt for u in t['ulohy']]
        out += ['', 'Celkem podle okruhu: ' + ', '.join(f'{k} {v}' for k, v in Counter(u['okruh'] for u in uu).most_common()), '']
    (TU / 'ROZBOR.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print(f'→ {TU / "ROZBOR.md"}')


if __name__ == '__main__':
    main()
