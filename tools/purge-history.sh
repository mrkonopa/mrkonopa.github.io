#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
# Vyhodí z git historie MRTVÉ bloby — obsah, který v repu už nikde není:
# staré nekomprimované verze vyplněných PDF a originální fotky z cest,
# které se později nahradily zmenšenými (mezi nimi jedno 74,8MB panorama).
#
# Co se NEMĚNÍ: aktuální obsah (stromy vyjdou bit v bit stejné), počet
# commitů, jejich zprávy, autoři ani pořadí.
# Co se MĚNÍ: hashe commitů (proto force-push a nový klon).
#
# Ověřeno v sandboxu: .git 825 MB → 501 MB, 184 commitů v main zůstalo
# 184, stromy main i větve IDENTICKÉ.
#
# POUŽITÍ (spusť MIMO svůj pracovní klon, ať si ho nerozbiješ):
#     bash tools/purge-history.sh
# Skript pracuje nad čerstvým zrcadlovým klonem v /tmp a na konci ti
# vypíše, čím ho nahrát na GitHub. Nic nepushuje sám.
#
# POTŘEBUJE: git-filter-repo  (pip install git-filter-repo)
# ══════════════════════════════════════════════════════════════════════
set -euo pipefail

REMOTE="${1:-https://github.com/mrkonopa/mrkonopa.github.io.git}"
WORK="${TMPDIR:-/tmp}/purge-history-$$"
MIRROR="$WORK/repo.git"

# git-filter-repo se dá volat dvěma cestami. Na Windows `pip install` uloží
# modul, ale spustitelný soubor se často nedostane do PATH, takže `git
# filter-repo` hlásí, že příkaz neexistuje — přitom `python -m git_filter_repo`
# funguje. Zkoušíme obě, ať se krok 0 netváří hotově, když hotový není.
FR=""
if command -v git-filter-repo >/dev/null 2>&1; then
  FR="git filter-repo"
else
  for PY in python3 python py; do
    command -v "$PY" >/dev/null 2>&1 || continue
    if "$PY" -m git_filter_repo --version >/dev/null 2>&1; then FR="$PY -m git_filter_repo"; break; fi
  done
fi
[ -n "$FR" ] || {
  cat <<'EOM'
CHYBÍ git-filter-repo.

  python -m pip install --user git-filter-repo

Pak ověř, že to jde spustit (stačí, když projde JEDEN z těch dvou):

  git filter-repo --version
  python -m git_filter_repo --version
EOM
  exit 1; }
echo "── použiju: $FR ──"

echo "── zrcadlový klon $REMOTE ──"
mkdir -p "$WORK"
git clone --quiet --mirror "$REMOTE" "$MIRROR"
PRED=$(du -sm "$MIRROR" | cut -f1)

echo "── hledám mrtvé bloby (v historii, ale v žádné větvi na jejím konci) ──"
# ŽIVÉ = obsah na špičkách všech větví a tagů. Cokoli jiného v historii je
# stará verze nebo smazaný soubor.
: > "$WORK/live.txt"
git -C "$MIRROR" for-each-ref --format='%(refname)' refs/heads refs/tags | while read -r r; do
  git -C "$MIRROR" ls-tree -r --format='%(objectname)' "$r"
done | sort -u > "$WORK/live.txt"

git -C "$MIRROR" rev-list --objects --all \
  | git -C "$MIRROR" cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob" && $4!=""' > "$WORK/all.txt"

awk 'NR==FNR{l[$1];next} !($2 in l){print $2}' "$WORK/live.txt" "$WORK/all.txt" \
  | sort -u > "$WORK/dead.txt"
awk 'NR==FNR{l[$1];next} !($2 in l){n++; s+=$3} END{printf "   %d blobů, %.0f MB syrových dat\n", n, s/1e6}' \
  "$WORK/live.txt" "$WORK/all.txt"

# Otisky stromů PŘED přepsáním — po něm se musí shodovat do posledního bitu.
git -C "$MIRROR" for-each-ref --format='%(refname) %(objectname)' refs/heads > "$WORK/refs-pred.txt"
while read -r r _; do
  echo "$r $(git -C "$MIRROR" rev-parse "$r^{tree}") $(git -C "$MIRROR" rev-list --count "$r")"
done < "$WORK/refs-pred.txt" > "$WORK/stromy-pred.txt"

echo "── přepisuji historii (--prune-empty never = commity zůstanou všechny) ──"
( cd "$MIRROR" && $FR --strip-blobs-with-ids "$WORK/dead.txt" --prune-empty never --force )

echo "── kontrola, že se obsah nezměnil ──"
CHYBA=0
while read -r r strom_pred pocet_pred; do
  strom_po=$(git -C "$MIRROR" rev-parse "$r^{tree}" 2>/dev/null || echo "-")
  pocet_po=$(git -C "$MIRROR" rev-list --count "$r" 2>/dev/null || echo "-")
  if [ "$strom_pred" = "$strom_po" ] && [ "$pocet_pred" = "$pocet_po" ]; then
    printf "   ✅ %-46s strom sedí, %s commitů\n" "$r" "$pocet_po"
  else
    printf "   ❌ %-46s strom %s→%s, commitů %s→%s\n" "$r" "$strom_pred" "$strom_po" "$pocet_pred" "$pocet_po"
    CHYBA=1
  fi
done < "$WORK/stromy-pred.txt"
[ "$CHYBA" = "0" ] || { echo; echo "NĚCO NESEDÍ — NIC NEPUSHUJ a smaž $WORK"; exit 1; }

PO=$(du -sm "$MIRROR" | cut -f1)
echo
echo "══════════════════════════════════════════════════════════════════"
echo "  .git: ${PRED} MB → ${PO} MB   (úspora $((PRED-PO)) MB)"
echo "══════════════════════════════════════════════════════════════════"
cat <<EOF

Obsah je ověřeně identický. Nahrání na GitHub (přepíše historii — dělej
až po mergnutí otevřených PR, jinak se rozsypou):

    git -C "$MIRROR" push --force --mirror "$REMOTE"

Pak si SVŮJ pracovní klon zahoď a natáhni znovu (staré hashe už nesedí):

    cd ~ && rm -rf mrkonopa.github.io
    git clone "$REMOTE"

Pozor: GitHub si nedosažitelné objekty chvíli drží, takže velikost repa
ve webovém rozhraní klesne se zpožděním. Nové klony jsou malé hned.
EOF
