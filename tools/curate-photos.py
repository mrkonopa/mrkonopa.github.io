#!/usr/bin/env python3
"""
Curate a photo folder: group near-duplicates / bursts, pick the best per group.

Usage:
    python tools/curate-photos.py travels/images/italy_2022/

Output:
    - curation-report.txt    : human-readable groups with KEEP / DROP marks
    - curation-keepers.txt   : filenames to keep (one per line)
    - curation-rejects.txt   : filenames marked for removal (one per line)

How it works:
    1. Compute perceptual hash (pHash 8x8) for each photo
    2. Group photos taken within 60s of each other AND with hash distance <= 12
    3. Within each group, keep the sharpest (Laplacian variance)
    4. Singletons (no near-neighbors) are auto-kept

Nothing is deleted. The user reviews the report and runs the cleanup separately.
"""
import sys, os, re
from pathlib import Path
from datetime import datetime
from PIL import Image
import numpy as np

if len(sys.argv) < 2:
    print("Usage: curate-photos.py <folder>")
    sys.exit(1)

folder = Path(sys.argv[1]).resolve()
if not folder.is_dir():
    print(f"Not a directory: {folder}")
    sys.exit(1)

# only originals — skip already-resized _web variants
files = sorted([p for p in folder.iterdir()
                if p.is_file()
                and p.suffix.lower() in {'.jpg', '.jpeg'}
                and '_web' not in p.stem.lower()
                and '_lq' not in p.stem.lower()])

print(f"Found {len(files)} candidate photos in {folder.name}/")

# --- helpers ----------------------------------------------------------------

def exif_time(p):
    try:
        with Image.open(p) as im:
            exif = im._getexif() or {}
            # 36867 = DateTimeOriginal
            for tag in (36867, 36868, 306):
                if tag in exif:
                    s = exif[tag]
                    return datetime.strptime(s, '%Y:%m:%d %H:%M:%S')
    except Exception:
        pass
    # fallback: parse date from filename (DD.MM.YYYY)
    m = re.search(r'(\d{2})\.(\d{2})\.(\d{4})', p.name)
    if m:
        d, mo, y = m.groups()
        return datetime(int(y), int(mo), int(d), 12, 0, 0)
    return datetime.fromtimestamp(p.stat().st_mtime)

def phash(p):
    """8x8 DCT-less perceptual hash. Returns int (64 bits)."""
    with Image.open(p) as im:
        im = im.convert('L').resize((32, 32), Image.Resampling.LANCZOS)
        a = np.asarray(im, dtype=np.float32)
    # 8x8 average pool
    a = a.reshape(8, 4, 8, 4).mean(axis=(1, 3))
    mean = a.mean()
    bits = (a > mean).flatten()
    h = 0
    for b in bits:
        h = (h << 1) | int(b)
    return h

def hdist(a, b):
    return bin(a ^ b).count('1')

def sharpness(p):
    """Laplacian variance — higher = sharper."""
    with Image.open(p) as im:
        im = im.convert('L').resize((512, 512), Image.Resampling.LANCZOS)
        a = np.asarray(im, dtype=np.float32)
    # 3x3 Laplacian
    k = np.array([[0,1,0],[1,-4,1],[0,1,0]], dtype=np.float32)
    from numpy.lib.stride_tricks import sliding_window_view
    w = sliding_window_view(a, (3, 3))
    lap = (w * k).sum(axis=(-1, -2))
    return float(lap.var())

# --- pass 1: compute features ----------------------------------------------

print("Pass 1/2: computing pHash + EXIF time + sharpness ...")
data = []  # list of (path, time, phash, sharp)
for i, p in enumerate(files):
    if i % 25 == 0:
        print(f"  {i}/{len(files)}", end='\r', flush=True)
    try:
        data.append((p, exif_time(p), phash(p), sharpness(p)))
    except Exception as e:
        print(f"\n  skip {p.name}: {e}")
print(f"  done ({len(data)} processed)")

# --- pass 2: cluster --------------------------------------------------------

print("Pass 2/2: clustering near-duplicates ...")
TIME_WINDOW = 90      # seconds
HASH_THRESHOLD = 12   # bits; 0 = identical, 64 = opposite

# sort by time so neighbors are adjacent
data.sort(key=lambda x: x[1])

groups = []
used = [False] * len(data)
for i in range(len(data)):
    if used[i]:
        continue
    group = [i]
    used[i] = True
    pi, ti, hi, _ = data[i]
    for j in range(i + 1, len(data)):
        if used[j]:
            continue
        pj, tj, hj, _ = data[j]
        if (tj - ti).total_seconds() > TIME_WINDOW * 4:
            break  # too far in time, no point scanning further
        if abs((tj - ti).total_seconds()) <= TIME_WINDOW and hdist(hi, hj) <= HASH_THRESHOLD:
            group.append(j)
            used[j] = True
    groups.append(group)

# --- choose keepers ---------------------------------------------------------

keepers = []
rejects = []
report_lines = []
multi_groups = 0
for g in groups:
    if len(g) == 1:
        keepers.append(data[g[0]][0])
        continue
    multi_groups += 1
    # pick the sharpest; tiebreak by larger file size
    best = max(g, key=lambda idx: (data[idx][3], data[idx][0].stat().st_size))
    keepers.append(data[best][0])
    report_lines.append(f"\n# Group of {len(g)} — {data[g[0]][1].strftime('%Y-%m-%d %H:%M:%S')}")
    for idx in g:
        p, t, h, s = data[idx]
        tag = 'KEEP' if idx == best else 'DROP'
        report_lines.append(f"  [{tag}] {p.name}  sharp={s:.0f}  t={t.strftime('%H:%M:%S')}")
        if idx != best:
            rejects.append(p)

# --- write outputs ----------------------------------------------------------

out_report = folder.parent.parent / 'curation-report.txt'
out_keepers = folder.parent.parent / 'curation-keepers.txt'
out_rejects = folder.parent.parent / 'curation-rejects.txt'

with open(out_report, 'w', encoding='utf-8') as f:
    f.write(f"Curation report for {folder}\n")
    f.write(f"Total photos: {len(data)}\n")
    f.write(f"Groups with duplicates: {multi_groups}\n")
    f.write(f"Keepers: {len(keepers)}\n")
    f.write(f"Rejects: {len(rejects)}\n")
    f.write("=" * 60 + "\n")
    f.write("\n".join(report_lines))

with open(out_keepers, 'w', encoding='utf-8') as f:
    for p in keepers:
        f.write(p.name + "\n")

with open(out_rejects, 'w', encoding='utf-8') as f:
    for p in rejects:
        f.write(p.name + "\n")

print(f"\n=== Summary ===")
print(f"  Total:    {len(data)}")
print(f"  Groups:   {multi_groups} with near-duplicates")
print(f"  Keepers:  {len(keepers)}")
print(f"  Rejects:  {len(rejects)}")
print(f"\nReports written to repo root:")
print(f"  {out_report.name}")
print(f"  {out_keepers.name}")
print(f"  {out_rejects.name}")
print(f"\nReview {out_report.name} — if happy, the cleanup step is separate.")
