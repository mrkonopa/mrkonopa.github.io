#!/bin/bash
# Podpis commitů Vojtovým klíčem v cloudových sessionách Claude Code.
#
# Prostředí podepisuje každý commit vlastním klíčem (globální /root/.gitconfig,
# gpg.ssh.program = /tmp/code-sign), který GitHub u Vojtova účtu nezná, takže
# commity svítí „Unverified" (API: verification.reason "unknown_key").
# Tady se místo něj nastaví Vojtův podpisový klíč z proměnné prostředí
# GIT_PODPIS_KLIC: soukromá část OpenSSH klíče jako base64 na jeden řádek.
# Veřejná část je na GitHubu jako „Signing Key".
#
# Když cokoli chybí (proměnná, ssh-keygen, platný klíč bez hesla), podpis se
# nemění a commity se podepisují dál klíčem prostředí. Commit nesmí spadnout
# jen kvůli podpisu, proto hook vždycky končí nulou.
# Hlídá tests/podpis-commitu.test.cjs.
set -u

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
REPO="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Autor commitů je vždy Vojta (CLAUDE.md, „Autorství commitů"). Na tomhle
# e-mailu GitHub podpis ověřuje, takže patří k podpisu.
git -C "$REPO" config user.name "Vojtěch Konopa"
git -C "$REPO" config user.email "vojtech.konopa@gmail.com"

if [ -z "${GIT_PODPIS_KLIC:-}" ]; then
  echo "Podpis commitů: proměnná GIT_PODPIS_KLIC není nastavená, zůstává podpis prostředí."
  exit 0
fi

# V obrazu prostředí ssh-keygen není; balík je v repozitářích Ubuntu a stav
# kontejneru se po doběhnutí hooku ukládá, takže se instaluje jen jednou.
if ! command -v ssh-keygen >/dev/null 2>&1; then
  { apt-get install -y -qq openssh-client ||
    { apt-get update -qq && apt-get install -y -qq openssh-client; }; } >/dev/null 2>&1
fi
if ! command -v ssh-keygen >/dev/null 2>&1; then
  echo "Podpis commitů: ssh-keygen se nepodařilo nainstalovat, zůstává podpis prostředí."
  exit 0
fi

KLIC="$HOME/.ssh/podpis_commitu"
mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"
# Schránka ve Windows umí přidat konec řádku, proto se bílé znaky zahazují.
( umask 077; printf '%s' "$GIT_PODPIS_KLIC" | tr -d ' \t\r\n' | base64 -d > "$KLIC" 2>/dev/null )
# -P "": klíč s heslem by se jinak ptal na heslo a session by visela.
if ! ssh-keygen -y -P "" -f "$KLIC" >/dev/null 2>&1; then
  rm -f "$KLIC"
  echo "Podpis commitů: GIT_PODPIS_KLIC není platný soukromý klíč bez hesla, zůstává podpis prostředí."
  exit 0
fi

# Repo-lokální nastavení má přednost před globálním /root/.gitconfig.
git -C "$REPO" config gpg.format ssh
git -C "$REPO" config gpg.ssh.program ssh-keygen
git -C "$REPO" config user.signingkey "$KLIC"
git -C "$REPO" config commit.gpgsign true
echo "Podpis commitů: Vojtův klíč $(ssh-keygen -lf "$KLIC" | awk '{print $2}')."
exit 0
