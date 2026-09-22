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
   - alle Bilder werden vollstaendig eingepasst, nichts wird abgeschnitten
   - die Lernolotl-Geschichten bekommen das Bild ihrer Kategorie und
     darunter eine Zeile, aus welcher Kategorie die Geschichte stammt
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

BREITE, HOEHE = 400, 400
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
# Die Lernolotl-Geschichten
# ----------------------------------------------------------------------------
# Diese 72 Geschichten haben keine eigenen Szenenbilder, sondern nur
# wiederkehrende Figuren - eine bunte Mischung aus Maskottchen-Posen und
# Nebenfiguren, die auf einer Themenseite unruhig wirkt. Sie bekommen
# deshalb das Bild ihrer Kategorie und darunter eine erklaerende Zeile.
# ============================================================================
KATEGORIEN = {
    "kita":      ("Kita",        "lernolotl/kita.jpg"),
    "schule":    ("Schule",      "lernolotl/schule.jpg"),
    "sport":     ("Sport",       "lernolotl/sport.jpg"),
    "freunde":   ("Freunde",     "lernolotl/freunde.jpg"),
    "zuhause":   ("Zuhause",     "lernolotl/zuhause.jpg"),
    "ichbinich": ("Ich bin ich", "lernolotl/ichbinich.jpg"),
}
BILDUNTER = "Eine Geschichte aus der Kategorie %s"


def kategorie_bestimmen(pfad):
    """Leitet aus dem Dateinamen die Lernolotl-Kategorie ab.

    /lernolotl/kita-geschichte-1-morgenkreis.html -> Kita
    /lernolotl/lernolotls-welt-schule.html        -> Schule
    """
    name = os.path.basename(pfad).lower()
    m = re.match(r"lernolotls-welt-([a-z]+)", name) or re.match(r"([a-z]+)[-_]geschichte", name)
    if not m:
        return None
    return KATEGORIEN.get(m.group(1))


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def motiv_finden(html_pfad):
    """Sucht in einer Geschichtenseite das erste echte Inhaltsbild."""
    try:
        text = open(html_pfad, encoding="utf-8", errors="replace").read()
    except OSError:
        return None
    for quelle in re.findall(r'<img[^>]+src="([^"]+\.(?:webp|jpg|jpeg|png))"', text, re.I):
        if any(w in quelle.lower() for w in KEINE_MOTIVE):
            continue
        datei = os.path.normpath(os.path.join(os.path.dirname(html_pfad), quelle))
        if os.path.exists(datei):
            return datei
    return None


def format_passt(pfad):
    """Prueft, ob eine vorhandene Datei schon das aktuelle Kartenformat hat.

    Wird das Format im Skript geaendert, sollen die alten Bilder von selbst
    erneuert werden - ohne dass jemand daran denken muss."""
    try:
        from PIL import Image
        with Image.open(pfad) as im:
            return im.size == (BREITE, HOEHE)
    except Exception:
        return False


def hat_transparenz(bild):
    """Erkennt freigestellte Figuren - die duerfen nicht zugeschnitten werden."""
    if bild.mode not in ("RGBA", "LA", "P"):
        return False
    if bild.mode == "P":
        return "transparency" in bild.info
    alpha = bild.getchannel("A")
    return alpha.getextrema()[0] < 250


def vorschau_bauen(quelle, ziel, einpassen=None):
    """Erzeugt eine Vorschau in einheitlicher Groesse.

    Zwei Faelle, bewusst unterschiedlich behandelt:

    - Bilder mit Schrift (Buchcover als Kategoriebild) und freigestellte
      Figuren werden vollstaendig eingepasst. Hier darf nichts wegfallen.
    - Szenenbilder der Geschichten werden formatfuellend zugeschnitten.
      Sie enthalten keine Schrift, und eingepasst wirkte die Karte leer.
    """
    from PIL import Image

    bild = Image.open(quelle)
    frei = hat_transparenz(bild)
    if einpassen is None:
        einpassen = frei
    bild = bild.convert("RGBA") if bild.mode in ("RGBA", "LA", "P") else bild.convert("RGB")

    if einpassen:
        flaeche = Image.new("RGB", (BREITE, HOEHE), HINTERGRUND)
        rand = 12 if frei else 4
        bild.thumbnail((BREITE - 2 * rand, HOEHE - 2 * rand), Image.LANCZOS)
        versatz = ((BREITE - bild.width) // 2, (HOEHE - bild.height) // 2)
        flaeche.paste(bild, versatz, bild if bild.mode == "RGBA" else None)
        fertig = flaeche
    else:
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
        fertig = bild.convert("RGB").resize((BREITE, HOEHE), Image.LANCZOS)

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
    brauchbar = [g for g in geschichten
                 if g.get("bild") and os.path.exists(g["bild"].lstrip("/"))]
    nach_titel = {esc(g["titel"]): g for g in brauchbar}
    # Zwei Geschichten koennen denselben Titel tragen (Tom und Alex haben beide
    # eine "Episode 5: Das Geheimnis unter dem Apfelbaum"). Ueber den Titel
    # bekaeme eine davon das Bild der anderen -- der Pfad ist eindeutig.
    nach_pfad = {g["pfad"]: g for g in brauchbar}
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
                # Nur Karten kostenloser Geschichten. Acht Titel gibt es auch
                # als Buch -- die gehoeren dem Produktskript.
                if 'class="tag frei"' not in karte:
                    return karte
                titel = re.search(r"<h4>(.*?)</h4>", karte, re.S)
                if not titel:
                    return karte
                link = re.search(r'class="btn lesen" href="([^"]+)"', karte)
                g = nach_pfad.get(link.group(1)) if link else None
                if not g:
                    g = nach_titel.get(titel.group(1).strip())
                if not g:
                    return karte
                unter = ('<p class="bildunter">%s</p>' % esc(g["bildunter"])
                         if g.get("bildunter") else "")
                img = ('%s<img class="pbild" src="%s" alt="" width="%d" height="%d" '
                       'loading="lazy" decoding="async">%s%s\n'
                       % (MARK_A, g["bild"], BREITE, HOEHE, unter, MARK_E))
                if MARK_A in karte:
                    # aelteren Block ersetzen -- Bildmasse und Beschriftung
                    # koennen sich geaendert haben
                    neu_karte = re.sub(re.escape(MARK_A) + r".*?" + re.escape(MARK_E) + r"\n?",
                                       img, karte, count=1, flags=re.S)
                    if neu_karte != karte:
                        eingesetzt += 1
                    return neu_karte
                eingesetzt += 1
                return re.sub(r'(<article class="produkt"[^>]*>)',
                              lambda m: m.group(1) + '\n' + img, karte, count=1)

            text = re.sub(r'<article class="produkt"[^>]*>.*?</article>', ersetze, text, flags=re.S)
            if text != original:
                open(pfad, "w", encoding="utf-8").write(text)
                geaendert += 1
    return geaendert, eingesetzt


def css_ergaenzen():
    """Setzt die Regeln fuer die Kartenbilder - und ersetzt eine aeltere Fassung."""
    if not os.path.exists(CSS_PFAD):
        return False
    block = ("/* produktbilder */\n"
             ".produkt .pbild{width:100%;aspect-ratio:1/1;object-fit:contain;border-radius:12px;\n"
             "  display:block;margin-bottom:8px;background:#f8fbfc;}\n"
             ".produkt .bildunter{font-size:.78em;color:#7b8b95;margin:-2px 0 10px;text-align:center;}\n"
             "/* /produktbilder */")
    inhalt = open(CSS_PFAD, encoding="utf-8").read()
    if block in inhalt:
        return False
    if "/* produktbilder */" in inhalt:
        # aeltere Fassung ersetzen (mit oder ohne Endmarker)
        inhalt = re.sub(r"/\* produktbilder \*/.*?(?:/\* /produktbilder \*/|(?=\n\s*\n)|$)",
                        block, inhalt, count=1, flags=re.S)
        open(CSS_PFAD, "w", encoding="utf-8").write(inhalt)
        return True
    open(CSS_PFAD, "a", encoding="utf-8").write("\n" + block + "\n")
    return True


def js_ergaenzen():
    """Gibt den Geschichten in der Suche ebenfalls Bild und Beschriftung mit."""
    if not os.path.exists(JS_PFAD):
        return False
    text = open(JS_PFAD, encoding="utf-8").read()
    original = text

    # Datensatz der Geschichten um Bild und Beschriftung erweitern
    if "bild:s.bild" not in text:
        text = re.sub(r"(link\s*:\s*s\.pfad)", r"\1,bild:s.bild,bildunter:s.bildunter",
                      text, count=1)
    elif "bildunter:s.bildunter" not in text:
        text = text.replace("bild:s.bild", "bild:s.bild,bildunter:s.bildunter", 1)

    # Ausgabe in der Karte: Bild, darunter bei Bedarf die Zeile
    bild_js = ("var b = e.bild ? '<img class=\"pbild\" src=\"'+esc(e.bild)+"
               "'\" alt=\"\" width=\"%d\" height=\"%d\" loading=\"lazy\" decoding=\"async\">'"
               "+(e.bildunter?'<p class=\"bildunter\">'+esc(e.bildunter)+'</p>':'') : '';\n    "
               % (BREITE, HOEHE))

    if "e.bildunter" not in text:
        # eine vorhandene Bildzeile ersetzen, sonst neu einsetzen
        vorhanden = re.compile(r"[ \t]*var b = e\.bild \?.*?: '';\n[ \t]*", re.S)
        if vorhanden.search(text):
            text = vorhanden.sub(bild_js, text, count=1)
        else:
            muster = re.compile(r"""(return\s*')(<article class="produkt">)(<div class="kopf">')""")
            if muster.search(text):
                text = muster.sub(
                    lambda m: bild_js + m.group(1) + m.group(2) + "'+b+'" + m.group(3),
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
    groessen, freisteller, kategorie_bilder = [], 0, 0

    # Die sechs Kategoriebilder der Lernolotl-Reihe -- einmal erzeugt,
    # dann von allen Geschichten der jeweiligen Kategorie benutzt
    for schluessel, (label, quelle) in KATEGORIEN.items():
        ziel = os.path.join(THUMB_DIR, "kat-%s.jpg" % schluessel)
        if os.path.exists(ziel) and format_passt(ziel) and not args.neu_bauen:
            continue
        if not os.path.exists(quelle):
            print("   ? Kategoriebild fehlt:", quelle)
            continue
        try:
            groesse, _ = vorschau_bauen(quelle, ziel, einpassen=True)
            groessen.append(groesse)
            kategorie_bilder += 1
        except Exception as e:
            print("   ! Kategoriebild %s: %s" % (schluessel, str(e)[:70]))

    for g in geschichten:
        seite = g["pfad"].lstrip("/")

        # Lernolotl-Geschichte? Dann Kategoriebild und Beschriftung.
        kategorie = kategorie_bestimmen(seite) if seite.startswith("lernolotl/") else None
        if kategorie:
            label, _ = kategorie
            schluessel = [k for k, v in KATEGORIEN.items() if v[0] == label][0]
            ziel = os.path.join(THUMB_DIR, "kat-%s.jpg" % schluessel)
            if os.path.exists(ziel):
                g["bild"] = "%s/kat-%s.jpg" % (THUMB_WEB, schluessel)
                g["bildunter"] = BILDUNTER % label
                vorhanden += 1
                continue

        g.pop("bildunter", None)
        ziel = os.path.join(THUMB_DIR, "%s.jpg" % g["id"])

        if os.path.exists(ziel) and format_passt(ziel) and not args.neu_bauen:
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

    if kategorie_bilder:
        print("Kategoriebilder der Lernolotl-Reihe erzeugt: %d" % kategorie_bilder)
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

    # Verwaiste Vorschauen entfernen: Geschichten, die inzwischen ein
    # Kategoriebild benutzen, brauchen ihre alte Einzeldatei nicht mehr.
    benutzt = {os.path.basename(g["bild"]) for g in geschichten if g.get("bild")}
    entfernt = 0
    if os.path.isdir(THUMB_DIR):
        for name in os.listdir(THUMB_DIR):
            if name.endswith(".jpg") and name not in benutzt:
                os.remove(os.path.join(THUMB_DIR, name))
                entfernt += 1
    if entfernt:
        print("Nicht mehr benutzte Vorschauen entfernt: %d" % entfernt)

    seiten, karten = themenseiten_bebildern(geschichten)
    print("Themenseiten: %d Dateien, %d Geschichten-Karten bebildert" % (seiten, karten))
    if css_ergaenzen():
        print("CSS-Regel ergaenzt")
    if js_ergaenzen():
        print("bibliothek.js ergaenzt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
