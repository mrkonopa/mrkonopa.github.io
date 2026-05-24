#!/usr/bin/env python3
"""
Resize curated keepers to web-sized _web.jpg versions.

Usage:
    python tools/resize-keepers.py travels/images/italy_2022/ [curation-keepers.txt]

If keepers list is not provided, defaults to curation-keepers.txt in repo root.
Outputs: <original_stem>_web.jpg  next to each original.
Skips files that already have a _web.jpg.
"""
import sys, os
from pathlib import Path
from PIL import Image

LONG_EDGE = 1600
QUALITY = 82

folder = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path('.')
keepers_file = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else Path('curation-keepers.txt').resolve()

if not folder.is_dir():
    print(f"Not a directory: {folder}"); sys.exit(1)
if not keepers_file.exists():
    print(f"Keepers list not found: {keepers_file}"); sys.exit(1)

keepers = [line.strip() for line in keepers_file.read_text(encoding='utf-8').splitlines() if line.strip()]
print(f"Keepers list: {len(keepers)} files")
print(f"Folder: {folder}")

done = skipped = errors = 0
for i, name in enumerate(keepers):
    src = folder / name
    stem = src.stem
    dst = folder / (stem + '_web.jpg')
    if dst.exists():
        skipped += 1
        continue
    if not src.exists():
        print(f"  MISSING: {name}")
        errors += 1
        continue
    try:
        with Image.open(src) as im:
            im = im.convert('RGB')
            w, h = im.size
            if max(w, h) > LONG_EDGE:
                scale = LONG_EDGE / max(w, h)
                im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
            im.save(dst, 'JPEG', quality=QUALITY, optimize=True)
        done += 1
        if (i + 1) % 25 == 0:
            print(f"  {i+1}/{len(keepers)} done", flush=True)
    except Exception as e:
        print(f"  ERROR {name}: {e}")
        errors += 1

print(f"\nDone: {done} resized, {skipped} already existed, {errors} errors")
print(f"Output: *_web.jpg files in {folder}")
