#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lernolotl - Bilder der Geschichten in die Bibliothek holen
===========================================================

Zu jeder Geschichte liegt im Repo schon ein Bild. Dieses Skript sucht es,
legt eine kleine Vorschau davon an und setzt sie in die Bibliothek ein.

Ablauf:

1. Liest  bibliothek/produkte.json  und oeffnet jede Geschichte
2. Holt aus der Seite das erste Inhaltsbild (Symbole werden uebergangen)
3. Legt eine Vorschau unter  bilder/thumbs/<id>.jpg  an, hoechstens 70 KB:
   - breite Szenenbilder werden auf 4:3 zugeschnitten
   - freigestellte Figuren (mit durchsichtigem Hintergrund) werden
     vollstaendig eingepasst, damit nichts abgeschnitten wird
4. Traegt den Pfad als Feld "bild" bei der Geschichte ein
5. Setzt die Vorschau in die Themenseiten unter bibliothek/
6. Ergaenzt bibliothek.js, damit auch die Suche die Bilder zeigt

Die Originalbilder bleiben unangetastet - die Geschichtenseiten benutzen
sie weiterhin in voller Groesse.

Alles ist wiederholbar: Vorhandene Vorschauen werden nicht neu erzeugt.
"""

import argparse
import io
import json
import os
import re
import sys
from urllib.parse import quote

BREITE, HOEHE = 400, 300
MAX_BYTES     = 70 * 1024
START_QUALI   = 74
MIN_QUALI     = 40
HINTERGRUND   = (248, 251, 252)     # entspricht der Kartenfarbe #f8fbfc

JSON_PFAD  = "bibliothek/produkte.json"
JS_PFAD    = "bibliothek/bibliothek.js"
CSS_PFAD   = "bibliothek/bibliothek.css"
THUMB_DIR  = "bilder/thumbs"
THUMB_WEB  = "/bilder/thumbs"
THEMEN_DIR = "bibliothek"

MARK_A, MARK_E = "<!-- pbild -->", "<!-- /pbild -->"

# Diese Dateinamen sind Symbole und Schmuck, keine Szenenbilder
KEINE_MOTIVE = ("icon", "favicon", "apple-touch", "logo", "sprite", "pixel")

# ============================================================================
# Welches Bild bekommen die Lernolotl-Geschichten?
# ----------------------------------------------------------------------------
# Diese 72 Geschichten haben keine eigenen Szenenbilder, sondern nur
# wiederkehrende Figuren. Zur Auswahl:
#
#   "figuren"     Charakterbild der Geschichte (Mama, Finn, Frau Brandt, ...)
#                 -> 20 verschiedene Motive, die meiste Abwechslung
#   "maskottchen" die Lernolotl-Pose, die in der Geschichte steht
#                 -> nur 8 Motive, eines davon 20-mal
#   "kategorie"   das Reihenbild (kita.jpg, schule.jpg, ...)
#                 -> nur 7 Motive, und es sind dieselben Bilder wie die
#                    Buchcover auf derselben Seite
# ============================================================================
LERNOLOTL_STRATEGIE = "figuren"

MASKOTTCHEN = re.compile(r"lernolotl-[a-z]+\.(png|webp|jpg)$", re.I)
KATEGORIE   = re.compile(r"^(kita|schule|sport|freunde|zuhause|ichbinich)\.jpg$", re.I)


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def motiv_finden(html_pfad):
    """Sucht in einer Geschichtenseite das passendste Inhaltsbild."""
    try:
        text = open(html_pfad, encoding="utf-8", errors="replace").read()
    except OSError:
        return None

    kandidaten = []
    for quelle in re.findall(r'<img[^>]+src="([^"]+\.(?:webp|jpg|jpeg|png))"', text, re.I):
        if any(w in quelle.lower() for w in KEINE_MOTIVE):
            continue
        datei = os.path.normpath(os.path.join(os.path.dirname(html_pfad), quelle))
        if os.path.exists(datei):
            kandidaten.append(datei)
    if not kandidaten:
        return None

    # Geschichten mit eigenem Szenenbild: immer das erste nehmen.
    # Nur die Lernolotl-Reihe hat keine und braucht die Auswahlregel.
    if not html_pfad.replace("\\", "/").startswith("lernolotl/"):
        return kandidaten[0]

    def erstes(pruefung):
        for k in kandidaten:
            if pruefung(os.path.basename(k)):
                return k
        return None

    if LERNOLOTL_STRATEGIE == "kategorie":
        return erstes(KATEGORIE.match) or kandidaten[0]
    if LERNOLOTL_STRATEGIE == "figuren":
        # weder Maskottchen noch Reihenbild -> das ist ein Charakterbild
        treffer = erstes(lambda n: not MASKOTTCHEN.match(n) and not KATEGORIE.match(n))
        return treffer or kandidaten[0]
    return kandidaten[0]          # "maskottchen"


def hat_transparenz(bild):
    """Erkennt freigestellte Figuren - die duerfen nicht zugeschnitten werden."""
    if bild.mode not in ("RGBA", "LA", "P"):
        return False
    if bild.mode == "P":
        return "transparency" in bild.info
    alpha = bild.getchannel("A")
    return alpha.getextrema()[0] < 250


def vorschau_bauen(quelle, ziel):
    """Erzeugt eine Vorschau in einheitlicher Groesse. Rueckgabe: Bytes."""
    from PIL import Image

    bild = Image.open(quelle)
    frei = hat_transparenz(bild)

    if frei:
        # Figur vollstaendig einpassen, Rest mit der Kartenfarbe fuellen
        bild = bild.convert("RGBA")
        flaeche = Image.new("RGB", (BREITE, HOEHE), HINTERGRUND)
        rand = 12
        bild.thumbnail((BREITE - 2 * rand, HOEHE - 2 * rand), Image.LANCZOS)
        flaeche.paste(bild, ((BREITE - bild.width) // 2, (HOEHE - bild.height) // 2), bild)
        fertig = flaeche
    else:
        # Szenenbild mittig auf 4:3 zuschneiden
        bild = bild.convert("RGB")
        soll = BREITE / HOEHE
        b, h = bild.size
        ist = b / h
        if ist > soll:
            neu_b = int(h * soll)
            links = (b - neu_b) // 2
            bild = bild.crop((links, 0, links + neu_b, h))
        elif ist < soll:
            neu_h = int(b / soll)
            oben = (h - neu_h) // 2
            bild = bild.crop((0, oben, b, oben + neu_h))
        fertig = bild.resize((BREITE, HOEHE), Image.LANCZOS)

    for quali in range(START_QUALI, MIN_QUALI - 1, -6):
        puffer = io.BytesIO()
        fertig.save(puffer, "JPEG", quality=quali, optimize=True, progressive=True)
        if puffer.tell() <= MAX_BYTES or quali == MIN_QUALI:
            os.makedirs(os.path.dirname(ziel), exist_ok=True)
            with open(ziel, "wb") as f:
                f.write(puffer.getvalue())
            return puffer.tell(), frei
    return 0, frei


def themenseiten_bebildern(geschichten):
    """Setzt die Vorschauen in die statischen Karten der Themenseiten."""
    nach_titel = {esc(g["titel"]): g for g in geschichten
                  if g.get("bild") and os.path.exists(g["bild"].lstrip("/"))}
    geaendert = eingesetzt = 0

    for wurzel, _, dateien in os.walk(THEMEN_DIR):
        for name in dateien:
            if not name.endswith(".html"):
                continue
            pfad = os.path.join(wurzel, name)
            text = open(pfad, encoding="utf-8").read()
            original = text

            def ersetze(treffer):
                nonlocal eingesetzt
                karte = treffer.group(0)
                if MARK_A in karte:
                    return karte
                titel = re.search(r"<h4>(.*?)</h4>", karte, re.S)
                if not titel:
                    return karte
                g = nach_titel.get(titel.group(1).strip())
                if not g:
                    return karte
                img = ('%s<img class="pbild" src="%s" alt="" width="%d" height="%d" '
                       'loading="lazy" decoding="async">%s\n'
                       % (MARK_A, g["bild"], BREITE, HOEHE, MARK_E))
                eingesetzt += 1
                return karte.replace('<article class="produkt">',
                                     '<article class="produkt">\n' + img, 1)

            text = re.sub(r'<article class="produkt">.*?</article>', ersetze, text, flags=re.S)
            if text != original:
                open(pfad, "w", encoding="utf-8").write(text)
                geaendert += 1
    return geaendert, eingesetzt


def css_ergaenzen():
    """Falls das Etsy-Skript noch nicht gelaufen ist, fehlt die Regel."""
    regel = """
/* produktbilder */
.produkt .pbild{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;
  display:block;margin-bottom:12px;background:#eef3f6;}
"""
    if not os.path.exists(CSS_PFAD):
        return False
    inhalt = open(CSS_PFAD, encoding="utf-8").read()
    if "produktbilder" in inhalt:
        return False
    open(CSS_PFAD, "a", encoding="utf-8").write("\n" + regel.strip() + "\n")
    return True


def js_ergaenzen():
    """Gibt den Geschichten in der Suche ebenfalls ihr Bild mit."""
    if not os.path.exists(JS_PFAD):
        return False
    text = open(JS_PFAD, encoding="utf-8").read()
    if "bild:s.bild" in text:
        return False
    original = text

    # Datensatz der Geschichten um das Bild erweitern
    text = re.sub(r"(link\s*:\s*s\.pfad)", r"\1,bild:s.bild", text, count=1)

    # Falls das Etsy-Skript noch nicht lief, fehlt die Ausgabe in karte()
    if "e.bild" not in text:
        muster = re.compile(r"""(return\s*')(<article class="produkt">)(<div class="kopf">')""")
        bild_js = ("var b = e.bild ? '<img class=\"pbild\" src=\"'+esc(e.bild)+"
                   "'\" alt=\"\" width=\"%d\" height=\"%d\" loading=\"lazy\" decoding=\"async\">' : '';\n    "
                   % (BREITE, HOEHE))
        if muster.search(text):
            text = muster.sub(lambda m: bild_js + m.group(1) + m.group(2) + "'+b+'" + m.group(3),
                              text, count=1)

    if text == original:
        return False
    open(JS_PFAD, "w", encoding="utf-8").write(text)
    return True


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--neu-bauen", action="store_true",
                   help="vorhandene Vorschauen noch einmal erzeugen")
    args = p.parse_args()

    daten = json.load(open(JSON_PFAD, encoding="utf-8"))
    geschichten = daten.get("geschichten", [])
    print("Geschichten in der Bibliothek: %d" % len(geschichten))

    gebaut = vorhanden = ohne_motiv = 0
    groessen, freisteller = [], 0

    for g in geschichten:
        seite = g["pfad"].lstrip("/")
        ziel = os.path.join(THUMB_DIR, "%s.jpg" % g["id"])

        if os.path.exists(ziel) and not args.neu_bauen:
            g["bild"] = "%s/%s.jpg" % (THUMB_WEB, g["id"])
            groessen.append(os.path.getsize(ziel))
            vorhanden += 1
            continue

        quelle = motiv_finden(seite)
        if not quelle:
            ohne_motiv += 1
            print("   ? kein Bild gefunden:", g["titel"][:70])
            continue
        try:
            groesse, frei = vorschau_bauen(quelle, ziel)
            g["bild"] = "%s/%s.jpg" % (THUMB_WEB, g["id"])
            groessen.append(groesse)
            gebaut += 1
            if frei:
                freisteller += 1
        except Exception as e:
            ohne_motiv += 1
            print("   ! %s: %s" % (g["id"], str(e)[:80]))

    print("Vorschauen: %d neu erzeugt (davon %d freigestellte Figuren), "
          "%d schon vorhanden, %d ohne Bild"
          % (gebaut, freisteller, vorhanden, ohne_motiv))
    if groessen:
        print("Groesse: Durchschnitt %d KB, groesstes %d KB, zusammen %.1f MB"
              % (sum(groessen) / len(groessen) / 1024, max(groessen) / 1024,
                 sum(groessen) / 1048576))

    with open(JSON_PFAD, "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, indent=1)
        f.write("\n")

    seiten, karten = themenseiten_bebildern(geschichten)
    print("Themenseiten: %d Dateien, %d Geschichten-Karten bebildert" % (seiten, karten))
    if css_ergaenzen():
        print("CSS-Regel ergaenzt")
    if js_ergaenzen():
        print("bibliothek.js ergaenzt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
