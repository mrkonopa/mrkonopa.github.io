#!/usr/bin/env bash
# Systémové knihovny pro Chromium (apt) s pojistkou proti pomalému zrcadlu.
#
# Proč: na CI (běh 39813340771, 22. 10. 2026) stahoval apt balíčky z azure.archive.ubuntu.com
# rychlostí 37 kB/s ("Fetched 18.5 MB in 8min 20s") a krok instalace Chromia trval 8,6 min místo
# obvyklých 13-40 s; zbylých 5,6 MB došlo z archive.ubuntu.com za 3 s. Pomalé, ale ne zaseknuté
# spojení časový limit apt (po nečinnosti) nechytí, proto se limit dává na celý pokus a po
# nezdaru se zrcadlo azure vyřadí ze seznamu zrcadel, ať apt jede přes ostatní.
#
# `timeout` zabije jen npx a jeho skupinu; `sudo apt-get` pod ním běží dál a drží zámek dpkg
# (první CI běh téhle pojistky, 22. 10. 2026: všechny tři pokusy skončily kódem 100 na
# "dpkg frontend lock ... held by process (apt-get)"). Před dalším pokusem se proto apt-get
# zastaví samostatně: nejdřív SIGTERM (uvolní zámek čistě), po 10 s SIGKILL.
#
# Prostředí (jen pro test, na CI se nenastavuje): POKUSU, LIMIT_S, ZRCADLA, SUDO, OPRAVA, NPX, APT.
set -u
POKUSU="${POKUSU:-3}"
LIMIT="${LIMIT_S:-150}"
ZRCADLA="${ZRCADLA:-/etc/apt/apt-mirrors.txt}"
SUDO="${SUDO-sudo}"
OPRAVA="${OPRAVA-sudo dpkg --configure -a}"
NPX="${NPX:-npx}"
APT="${APT:-apt-get}"

zije() { ps -C "$APT" -o stat= 2>/dev/null | grep -qv '^Z'; }
zastav_apt() {
  $SUDO pkill -TERM -x "$APT" 2>/dev/null || return 0
  for _ in 1 2 3 4 5 6 7 8 9 10; do zije || return 0; sleep 1; done
  $SUDO pkill -KILL -x "$APT" 2>/dev/null
  sleep 1
}

for ((i = 1; i <= POKUSU; i++)); do
  if timeout -k 10 "$LIMIT" "$NPX" playwright install-deps chromium; then
    exit 0
  fi
  echo "::warning::install-deps: pokus $i/$POKUSU nedoběhl (limit ${LIMIT} s nebo chyba), vyřazuji zrcadlo azure.archive.ubuntu.com a zkouším znovu"
  zastav_apt
  # Přerušený dpkg nechá nedokončenou konfiguraci; oprava je levná a bezpečná.
  [ -n "$OPRAVA" ] && $OPRAVA || true
  [ -f "$ZRCADLA" ] && $SUDO sed -i '/azure\.archive\.ubuntu\.com/d' "$ZRCADLA"
done
echo "::error::install-deps selhal $POKUSU×"
exit 1
