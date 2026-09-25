#!/usr/bin/env python3
"""
Lernolotls Teich – Bilder zuschneiden und als WebP speichern
=============================================================

Nimmt die Bilder aus ChatGPT (PNG) und macht daraus die fertigen
WebP-Dateien für das Spiel.

- Sammelbilder (mehrere Dinge auf einem Bild) werden automatisch in
  einzelne Dinge zerlegt, zugeschnitten und richtig benannt.
- Einzelbilder (Hintergründe, Kacheln) werden verkleinert und als
  WebP gespeichert.

Voraussetzung (einmalig):   pip install pillow

So geht's:
  1. ChatGPT-Bild als PNG in den Ordner  _werkstatt/teich/rohbilder/
     legen und genau so benennen wie der Satz in bilder-liste.json,
     z. B.  muster-dinge.png  oder  hg-teich.png
  2. In diesem Ordner ausführen:
        python sprites_schneiden.py
     -> verarbeitet alle passenden Bilder in rohbilder/
  Einzelnes Bild:
        python sprites_schneiden.py rohbilder/muster-dinge.png
  Anderer Satzname als der Dateiname:
        python sprites_schneiden.py mein-bild.png --satz muster-dinge
  Weißen/einfarbigen Hintergrund entfernen (wenn ChatGPT keinen
  transparenten Hintergrund geliefert hat):
        python sprites_schneiden.py rohbilder/muster-dinge.png --hintergrund-weg
"""

import argparse
import json
import sys
from collections import deque
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("Pillow fehlt. Bitte einmal ausführen:  pip install pillow")

HIER = Path(__file__).resolve().parent
LISTE = HIER / "bilder-liste.json"


def lade_liste():
    with open(LISTE, encoding="utf-8") as f:
        return json.load(f)


def hat_transparenz(im):
    if im.mode != "RGBA":
        return False
    a = im.getchannel("A")
    lo, _ = a.getextrema()
    return lo < 250


def hintergrund_entfernen(im, toleranz):
    """Füllt vom Rand aus die zusammenhängende Hintergrundfarbe transparent."""
    im = im.convert("RGBA")
    w, h = im.size
    schritt = max(4, min(w, h) // 80)
    punkte = [(x, 0) for x in range(0, w, schritt)] + [(x, h - 1) for x in range(0, w, schritt)] + \
             [(0, y) for y in range(0, h, schritt)] + [(w - 1, y) for y in range(0, h, schritt)]
    for p in punkte:
        if im.getpixel(p)[3] == 0:
            continue
        ImageDraw.floodfill(im, p, (0, 0, 0, 0), thresh=toleranz)
    return im


def finde_objekte(im, erwartet):
    """Sucht zusammenhängende, nicht transparente Bereiche (verkleinert, schnell)."""
    w, h = im.size
    faktor = 320 / max(w, h)
    kw, kh = max(1, int(w * faktor)), max(1, int(h * faktor))
    alpha = im.getchannel("A").resize((kw, kh), Image.BOX)
    maske = alpha.point(lambda v: 255 if v > 24 else 0).filter(ImageFilter.MaxFilter(5))
    px = maske.load()
    gesehen = [[False] * kw for _ in range(kh)]
    boxen = []
    for y in range(kh):
        for x in range(kw):
            if px[x, y] == 0 or gesehen[y][x]:
                continue
            q = deque([(x, y)])
            gesehen[y][x] = True
            x0 = x1 = x
            y0 = y1 = y
            n = 0
            while q:
                cx, cy = q.popleft()
                n += 1
                x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < kw and 0 <= ny < kh and not gesehen[ny][nx] and px[nx, ny]:
                        gesehen[ny][nx] = True
                        q.append((nx, ny))
            if n >= kw * kh * 0.002:
                boxen.append([x0, y0, x1 + 1, y1 + 1, n])
    # kleine Splitter (Glitzer, Tropfen) dem nächsten großen Objekt zuordnen
    boxen.sort(key=lambda b: -b[4])
    gross = boxen[:erwartet] if len(boxen) >= erwartet else boxen
    for b in boxen[len(gross):]:
        cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
        ziel = min(gross, key=lambda g: ((g[0] + g[2]) / 2 - cx) ** 2 + ((g[1] + g[3]) / 2 - cy) ** 2)
        ziel[0], ziel[1] = min(ziel[0], b[0]), min(ziel[1], b[1])
        ziel[2], ziel[3] = max(ziel[2], b[2]), max(ziel[3], b[3])
    # Reihen bilden (oben nach unten), dann links nach rechts
    gross.sort(key=lambda b: b[1])
    reihen = []
    for b in gross:
        mitte = (b[1] + b[3]) / 2
        if reihen and mitte < max(r[3] for r in reihen[-1]):
            reihen[-1].append(b)
        else:
            reihen.append([b])
    sortiert = [b for r in reihen for b in sorted(r, key=lambda b: b[0])]
    return [(int(b[0] / faktor), int(b[1] / faktor), int(b[2] / faktor) + 1, int(b[3] / faktor) + 1) for b in sortiert]


def raster_boxen(im, spalten, zeilen):
    w, h = im.size
    cw, ch = w / spalten, h / zeilen
    return [(int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch)) for r in range(zeilen) for c in range(spalten)]


def zuschneiden(teil, max_px):
    bbox = teil.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    if bbox:
        teil = teil.crop(bbox)
    rand = max(2, int(max(teil.size) * 0.03))
    leinwand = Image.new("RGBA", (teil.width + 2 * rand, teil.height + 2 * rand), (0, 0, 0, 0))
    leinwand.paste(teil, (rand, rand))
    leinwand.thumbnail((max_px, max_px), Image.LANCZOS)
    return leinwand


def verarbeite(pfad, satzname, liste, hg_weg, toleranz, ziel_basis):
    satz = liste["saetze"].get(satzname)
    if not satz:
        print(f"  ! Unbekannter Satz '{satzname}'. Möglich: {', '.join(liste['saetze'])}")
        return False
    ordner = ziel_basis / satz["ordner"]
    ordner.mkdir(parents=True, exist_ok=True)
    im = Image.open(pfad)
    print(f"- {pfad.name}  ({im.width}×{im.height})  ->  Satz '{satzname}'")

    if satz["art"] == "einzeln":
        im = im.convert("RGB")
        im.thumbnail((satz.get("max_px", 1600), satz.get("max_px", 1600)), Image.LANCZOS)
        ziel = ordner / f"{satz['name']}.webp"
        im.save(ziel, "WEBP", quality=satz.get("qualitaet", 82), method=6)
        print(f"    gespeichert: {ziel.relative_to(ziel_basis.parent)}  ({ziel.stat().st_size // 1024} KB)")
        return True

    im = im.convert("RGBA")
    if hg_weg or not hat_transparenz(im):
        if not hg_weg:
            print("    Kein transparenter Hintergrund gefunden – entferne Hintergrund vom Rand aus.")
        im = hintergrund_entfernen(im, toleranz)

    namen = satz["namen"]
    boxen = finde_objekte(im, len(namen))
    if len(boxen) != len(namen):
        print(f"    Automatisch {len(boxen)} statt {len(namen)} Dinge erkannt – schneide nach Raster "
              f"{satz['spalten']}×{satz['zeilen']}.")
        boxen = raster_boxen(im, satz["spalten"], satz["zeilen"])
    for name, box in zip(namen, boxen):
        teil = zuschneiden(im.crop(box), satz.get("max_px", 320))
        ziel = ordner / f"{name}.webp"
        ziel.parent.mkdir(parents=True, exist_ok=True)
        teil.save(ziel, "WEBP", quality=satz.get("qualitaet", 85), method=6)
        print(f"    {name:<12} -> {ziel.relative_to(ziel_basis.parent)}  ({teil.width}×{teil.height}, {ziel.stat().st_size // 1024} KB)")
    return True


def main():
    ap = argparse.ArgumentParser(description="ChatGPT-Bilder für Lernolotls Teich zuschneiden.")
    ap.add_argument("bilder", nargs="*", help="PNG-Dateien (leer = alle in rohbilder/)")
    ap.add_argument("--satz", help="Satzname aus bilder-liste.json (Standard: Dateiname)")
    ap.add_argument("--hintergrund-weg", action="store_true", help="einfarbigen Hintergrund entfernen")
    ap.add_argument("--toleranz", type=int, default=40, help="Farbtoleranz beim Entfernen (Standard 40, bei Karomuster 70)")
    args = ap.parse_args()

    liste = lade_liste()
    ziel_basis = (HIER / liste["ziel_ordner"]).resolve()
    dateien = [Path(b) for b in args.bilder] or sorted(p for p in (HIER / "rohbilder").glob("*") if p.suffix.lower() in (".png", ".webp", ".jpg", ".jpeg"))
    if not dateien:
        print("Keine Bilder gefunden. Lege die PNGs in  _werkstatt/teich/rohbilder/  (Dateiname = Satzname).")
        return
    print(f"Ziel: {ziel_basis}")
    ok = 0
    for d in dateien:
        if not d.exists():
            print(f"  ! Datei nicht gefunden: {d}")
            continue
        satzname = args.satz or d.stem
        if satzname not in liste["saetze"]:
            print(f"- {d.name}: übersprungen (kein Satz namens '{satzname}')")
            continue
        ok += verarbeite(d, satzname, liste, args.hintergrund_weg, args.toleranz, ziel_basis)
    print(f"Fertig: {ok} Bild(er) verarbeitet. Seite im Browser neu laden (Strg+F5).")


if __name__ == "__main__":
    main()
