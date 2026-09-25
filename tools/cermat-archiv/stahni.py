#!/usr/bin/env python3
"""Stáhne české zadání, klíče a vzorová řešení z katalog.json do mezipaměti.

Mezipaměť je mimo verzování (.gitignore), protože PDF by repozitář nafoukla
o stovky MB; kdykoli se dá stáhnout znovu. Stahuje se ohleduplně: jeden
soubor za sekundu, už stažené se přeskočí.

Spuštění:  python3 tools/cermat-archiv/stahni.py [adresář]
           (výchozí: tools/cermat-archiv/.cache)
"""
import hashlib, json, sys, time, urllib.request
from pathlib import Path

TU = Path(__file__).parent
CIL = Path(sys.argv[1]) if len(sys.argv) > 1 else TU / '.cache'
TYPY = ('test', 'klic', 'reseni')
UA = 'mrkonopa-cermat-archiv/1.0 (skolni vyuka; github.com/mrkonopa)'


def main():
    katalog = json.loads((TU / 'katalog.json').read_text(encoding='utf-8'))
    vyber = [x for x in katalog if x['jazyk'] == 'cs' and x['typ'] in TYPY]
    manifest_cesta = CIL / 'stazeno.json'
    manifest = json.loads(manifest_cesta.read_text()) if manifest_cesta.exists() else {}
    chyby = []
    for i, x in enumerate(vyber, 1):
        cesta = CIL / 'pdf' / x['stupen'] / str(x['rok']) / x['soubor']
        if cesta.exists() and x['url'] in manifest:
            continue
        cesta.parent.mkdir(parents=True, exist_ok=True)
        try:
            req = urllib.request.Request(x['url'], headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            if not data.startswith(b'%PDF'):
                raise RuntimeError('odpověď není PDF')
            cesta.write_bytes(data)
            manifest[x['url']] = {'cesta': str(cesta.relative_to(CIL)), 'bajty': len(data),
                                  'sha256': hashlib.sha256(data).hexdigest()}
            print(f'[{i}/{len(vyber)}] {x["stupen"]} {x["rok"]} {x["typ"]:6} {x["soubor"]}', flush=True)
        except Exception as e:  # zapamatovat a pokračovat, na konci spadnout nahlas
            chyby.append(f'{x["url"]}: {e}')
            print(f'[{i}/{len(vyber)}] CHYBA {x["soubor"]}: {e}', flush=True)
        manifest_cesta.write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
        time.sleep(1)
    print(f'Hotovo: {len(manifest)} souborů, {sum(v["bajty"] for v in manifest.values()) / 1e6:.0f} MB, chyb {len(chyby)}')
    if chyby:
        sys.exit('Nestažené soubory:\n' + '\n'.join(chyby))


if __name__ == '__main__':
    main()
