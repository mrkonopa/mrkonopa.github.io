#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Převede originály cestovatelských fotek na webovou velikost.

PROČ TO BĚŽÍ U VOJTY A NE V SANDBOXU
  Originály z jedné cesty dělají kolem 7 GB. Google Disk je z vývojového
  sandboxu blokovaný (`drive.google.com` i `googleusercontent.com`
  nedostupné) a konektor Disku vrací obsah souboru jako base64 přímo do
  kontextu modelu, takže 30MB JPEG je neprůchodný. GitHub průchozí je,
  ale 7 GB tudy taky neprotlačíš.

  Tenhle skript proto udělá JEDINOU věc: zmenší originály na webovou
  velikost (556 fotek ≈ 7 GB → ≈ 160 MB). Nic nevybírá a nic nemaže —
  VÝBĚR, řazení, vyhazování duplicit i sestavení galerie dělám až já nad
  zmenšenými kopiemi, protože na to jsou 1600 px plně dostačující.

  Na originály nesahá, jen je čte.

CO DĚLÁ S KAŽDOU FOTKOU
  · srovná ji podle EXIF orientace (jinak by po smazání metadat ležela)
  · zmenší na 1600 px delší strana (zavedený formát tohohle webu)
  · uloží JPEG q82, progresivní
  · SMAŽE VŠECHNA METADATA — včetně GPS souřadnic domova i noclehů
  · zapíše `manifest.csv`: původní jméno, datum z EXIF, rozměry

POUŽITÍ (Git Bash)
  pip install pillow
  python tools/fotky-na-web.py "D:/cesta/k/originalum" vystup
"""
import argparse, csv, re, sys
from datetime import datetime
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Chybí Pillow.  Spusť:  pip install pillow")

PRIPONY = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}
DELSI_STRANA = 1600
KVALITA = 82


def exif_cas(img):
    """Čas pořízení z EXIF."""
    try:
        ex = img.getexif()
        for tag in (36867, 36868, 306):   # DateTimeOriginal, Digitized, DateTime
            v = ex.get(tag)
            if v:
                return datetime.strptime(str(v)[:19], "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    return None


def datum_z_nazvu(p: Path):
    """Záloha, když EXIF chybí: `balt_0556_11.07.2023.jpg`."""
    m = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", p.name)
    if m:
        try:
            return datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except ValueError:
            pass
    return None


def main():
    ap = argparse.ArgumentParser(description="Zmenší originály na webovou velikost.")
    ap.add_argument("zdroj", help="složka s originály (jen se čte)")
    ap.add_argument("cil", nargs="?", default="vystup", help="kam uložit zmenšené")
    ap.add_argument("--sirka", type=int, default=DELSI_STRANA, help="delší strana v px")
    a = ap.parse_args()

    zdroj, cil = Path(a.zdroj), Path(a.cil)
    if not zdroj.is_dir():
        sys.exit(f"Složka {zdroj} neexistuje.")
    soubory = sorted([p for p in zdroj.rglob("*") if p.suffix.lower() in PRIPONY])
    if not soubory:
        sys.exit(f"Ve složce {zdroj} nejsou žádné obrázky.")
    cil.mkdir(parents=True, exist_ok=True)

    print(f"{len(soubory)} souborů → {cil}")
    radky, chyby, bajtu_z, bajtu_do = [], 0, 0, 0

    for i, p in enumerate(soubory, 1):
        try:
            velikost_z = p.stat().st_size
            with Image.open(p) as im:
                cas = exif_cas(im) or datum_z_nazvu(p)
                im = ImageOps.exif_transpose(im).convert("RGB")
                puv = f"{im.width}×{im.height}"
                im = ImageOps.contain(im, (a.sirka, a.sirka), Image.Resampling.LANCZOS)
                ven = cil / (p.stem + "_web.jpg")
                # bez parametru `exif=` se metadata NEPŘENESOU — tím padá i GPS
                im.save(ven, "JPEG", quality=KVALITA, optimize=True, progressive=True)
            velikost_do = ven.stat().st_size
            bajtu_z += velikost_z; bajtu_do += velikost_do
            radky.append([p.name, ven.name,
                          cas.strftime("%Y-%m-%d %H:%M:%S") if cas else "",
                          puv, f"{im.width}×{im.height}",
                          round(velikost_z / 1048576, 2), round(velikost_do / 1024)])
        except Exception as e:
            chyby += 1
            print(f"\n  ! {p.name}: {e}")
        if i % 10 == 0 or i == len(soubory):
            print(f"  {i}/{len(soubory)}   {bajtu_do/1048576:6.1f} MB hotovo", end="\r", flush=True)

    print()
    with open(cil / "manifest.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["originál", "web", "čas pořízení", "původní rozměr",
                    "webový rozměr", "originál MB", "web kB"])
        w.writerows(radky)

    print(f"\nhotovo: {len(radky)} fotek"
          f"   {bajtu_z/1073741824:.2f} GB → {bajtu_do/1048576:.0f} MB"
          f"   (⌀ {bajtu_do/max(1,len(radky))/1024:.0f} kB)")
    if chyby:
        print(f"chyb: {chyby}")
    print(f"manifest: {cil/'manifest.csv'}")


if __name__ == "__main__":
    main()
