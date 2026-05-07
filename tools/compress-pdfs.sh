#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  compress-pdfs.sh — shrink scanned PDFs in-place using Ghostscript
#
#  WHY
#    The site hosts PDFs of přijímačky tests. CERMAT scans are 10–15 MB each
#    and bloat the git repo. Compressing with Ghostscript /ebook (150 dpi)
#    typically drops them to 1–3 MB with no visible quality loss for screen
#    reading or printing.
#
#  USAGE
#    Run before each commit that adds new big PDFs:
#      ./tools/compress-pdfs.sh
#
#    To target a specific folder or file:
#      ./tools/compress-pdfs.sh projects/prijimacky-matematika/pdfs/2026
#      ./tools/compress-pdfs.sh path/to/single.pdf
#
#    To pick a different quality preset:
#      PRESET=/screen  ./tools/compress-pdfs.sh   # smaller, lower quality (~72 dpi)
#      PRESET=/ebook   ./tools/compress-pdfs.sh   # default (~150 dpi)
#      PRESET=/printer ./tools/compress-pdfs.sh   # higher quality (~300 dpi)
#
#  REQUIREMENTS
#    Ghostscript (gs):
#      Windows (Git Bash):  choco install ghostscript     (or scoop install ghostscript)
#      macOS:               brew install ghostscript
#      Linux:               sudo apt install ghostscript  (or your package manager)
#
#  NOTES
#    • Files smaller than 1 MB are skipped (already efficient).
#    • Originals are replaced in-place ONLY if compression saves >10%.
#    • Failed runs leave a *.tmp.pdf you can safely delete.
# ─────────────────────────────────────────────────────────────────────────────

set -e

# Ghostscript check
if ! command -v gs >/dev/null 2>&1; then
  cat <<'MSG' >&2
ERROR: Ghostscript (gs) is not installed.

Install it and re-run:
  Windows (Git Bash):  choco install ghostscript     (admin)
                       scoop install ghostscript     (no admin)
  macOS:               brew install ghostscript
  Linux:               sudo apt install ghostscript

After install, close and re-open your terminal, then re-run this script.
MSG
  exit 1
fi

# Quality preset (override with PRESET env var)
PRESET="${PRESET:-/ebook}"

# Default target: pdfs folder under prijimacky-matematika.
# Caller can override with an arg.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_TARGET="$REPO_ROOT/projects/prijimacky-matematika/pdfs"

TARGET="${1:-$DEFAULT_TARGET}"

# Build list of PDFs to process (>1MB only)
if [ -f "$TARGET" ]; then
  files=("$TARGET")
elif [ -d "$TARGET" ]; then
  mapfile -t files < <(find "$TARGET" -type f -name '*.pdf' -size +1M ! -name '*.tmp.pdf')
else
  echo "ERROR: '$TARGET' is neither a file nor a directory." >&2
  exit 1
fi

if [ "${#files[@]}" -eq 0 ]; then
  echo "Nothing to compress in $TARGET (no PDFs >1 MB)."
  exit 0
fi

echo "Compressing ${#files[@]} PDF(s) with preset $PRESET ..."
echo ""

# Cross-platform file size in bytes
fsize() { wc -c < "$1" | tr -d ' '; }

total_orig=0
total_new=0
saved=0
kept=0

for f in "${files[@]}"; do
  orig=$(fsize "$f")
  total_orig=$((total_orig + orig))
  tmp="${f%.pdf}.tmp.pdf"

  gs -sDEVICE=pdfwrite \
     -dCompatibilityLevel=1.4 \
     -dPDFSETTINGS="$PRESET" \
     -dNOPAUSE -dQUIET -dBATCH \
     -sOutputFile="$tmp" \
     "$f" 2>/dev/null

  if [ ! -f "$tmp" ]; then
    printf "  ✗ %s (gs failed)\n" "$(basename "$f")"
    total_new=$((total_new + orig))
    kept=$((kept + 1))
    continue
  fi

  new=$(fsize "$tmp")
  pct=$((100 * new / orig))

  # Replace only if savings are meaningful (>10%)
  if [ "$pct" -lt 90 ]; then
    mv "$tmp" "$f"
    total_new=$((total_new + new))
    saved=$((saved + 1))
    printf "  ✓ %-50s %6d KB → %6d KB  (%d%%)\n" \
      "${f#$REPO_ROOT/}" "$((orig/1024))" "$((new/1024))" "$pct"
  else
    rm "$tmp"
    total_new=$((total_new + orig))
    kept=$((kept + 1))
    printf "  - %-50s already efficient (%d%% — kept original)\n" \
      "${f#$REPO_ROOT/}" "$pct"
  fi
done

echo ""
printf "Done. Compressed %d, kept %d. Total: %d KB → %d KB (%d%% of original).\n" \
  "$saved" "$kept" "$((total_orig/1024))" "$((total_new/1024))" \
  "$((100 * total_new / total_orig))"
