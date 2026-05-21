#!/usr/bin/env python3
"""
Resize photos for travels journal.
- Input:  any folder with full-res JPEG/PNG/HEIC
- Output: <same folder> with _web.jpg suffix, max 1600px wide, quality 82, no EXIF (no GPS leak)
- Originals are left untouched (gitignore blocks them anyway)

Usage:
    python tools/resize-photos.py travels/images/cr_bh_2018
    python tools/resize-photos.py travels/images/cr_bh_2018 --max 1800 --quality 85

Requires: pip install Pillow
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Install Pillow first:  pip install Pillow")

SRC_EXT = {'.jpg', '.jpeg', '.png', '.heic', '.tif', '.tiff', '.bmp'}

def is_already_web(p: Path) -> bool:
    return p.stem.endswith('_web') or p.stem.endswith('_LQ')

def process(folder: Path, max_width: int, quality: int):
    if not folder.is_dir():
        sys.exit(f"Not a directory: {folder}")

    candidates = [p for p in folder.iterdir()
                  if p.is_file()
                  and p.suffix.lower() in SRC_EXT
                  and not is_already_web(p)]

    if not candidates:
        print(f"No source images to process in {folder}")
        return

    total_in, total_out = 0, 0
    print(f"Processing {len(candidates)} files in {folder} (max {max_width}px, q={quality})\n")

    for src in sorted(candidates):
        dst = src.with_name(f"{src.stem}_web.jpg")
        if dst.exists():
            print(f"  skip (exists)  {dst.name}")
            continue
        try:
            with Image.open(src) as im:
                if im.mode in ('RGBA', 'P', 'LA'):
                    im = im.convert('RGB')
                w, h = im.size
                if w > max_width:
                    new_h = round(h * max_width / w)
                    im = im.resize((max_width, new_h), Image.LANCZOS)
                # Save without EXIF (strips GPS, camera, etc.)
                im.save(dst, 'JPEG', quality=quality, optimize=True, progressive=True)
            in_kb  = src.stat().st_size // 1024
            out_kb = dst.stat().st_size // 1024
            total_in  += in_kb
            total_out += out_kb
            print(f"  {src.name}  →  {dst.name}   ({in_kb} KB → {out_kb} KB)")
        except Exception as e:
            print(f"  FAILED  {src.name}: {e}")

    print(f"\nDone.  {total_in/1024:.1f} MB → {total_out/1024:.1f} MB.  EXIF stripped.")

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('folder', help='folder containing source photos')
    ap.add_argument('--max', type=int, default=1600, help='max width in px (default 1600)')
    ap.add_argument('--quality', type=int, default=82, help='JPEG quality 1-95 (default 82)')
    args = ap.parse_args()
    process(Path(args.folder), args.max, args.quality)
