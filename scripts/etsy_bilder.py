#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lernolotl - Produktbilder aus dem Etsy-CSV-Export in die Bibliothek holen
=========================================================================

Was das Skript macht:

1. Liest  bibliothek/etsy-listings.csv  (der Etsy-Export, unveraendert)
2. Ordnet jede CSV-Zeile einem Produkt in  bibliothek/produkte.json  zu
3. Laedt fehlende Produktbilder herunter und bringt sie auf 400x400,
   ohne etwas abzuschneiden, und speichert sie als JPG unter
   bilder/produkte/<produkt-id>.jpg  -- Zielgroesse hoechstens 70 KB
4. Traegt den Bildpfad als Feld "bild" in produkte.json ein
5. Legt Produkte an, die in der CSV stehen, aber noch nicht in produkte.json
   (nur wenn in NEUE_PRODUKTE eine Etsy-URL hinterlegt ist)
6. Setzt die Bilder in die statischen Themenseiten unter bibliothek/
7. Ergaenzt CSS und bibliothek.js, damit die Bilder angezeigt werden

Alles ist wiederholbar: Was schon erledigt ist, wird uebersprungen.
Bereits vorhandene Bilder werden nicht neu geladen (--neu-laden erzwingt es).
"""

import argparse
import csv
import io
import json
import os
import re
import sys
import unicodedata

# ============================================================================
# HIER EINTRAGEN: neue Etsy-Produkte, die noch nicht in produkte.json stehen
# ----------------------------------------------------------------------------
# Das Skript findet neue Produkte selbst, kann aber die Etsy-Adresse nicht
# erraten -- die steht nicht im CSV-Export. Deshalb hier pro Produkt die
# Adresse aus dem Etsy-Shop-Manager einfuegen (Listing oeffnen, URL kopieren).
#
# Schluessel = Anfang des CSV-Titels (es reichen die ersten Woerter)
# ============================================================================
NEUE_PRODUKTE = {
    "Kommunikationsbuch Deutsch zum Ausdrucken": dict(
        titel="Kommunikationsbuch Deutsch",
        kurz="Zeigetafeln A4 für Patienten, die nicht sprechen können — für Klinik, "
             "Pflegeheim und die Pflege zu Hause",
        etsy="",          # <-- Etsy-Adresse hier einfügen
        hauptthema="pflege-organisation",
        themen=["pflege-organisation"],
    ),
    "Kommunikationsbuch Türkisch": dict(
        titel="Kommunikationsbuch Türkisch–Deutsch",
        kurz="Zweisprachige Zeigetafeln A4 für Patienten mit Sprachbarriere — "
             "Klinik, Pflegeheim und Pflege zu Hause",
        etsy="",
        hauptthema="pflege-organisation",
        themen=["pflege-organisation"],
    ),
    "Kommunikationsbuch Russisch": dict(
        titel="Kommunikationsbuch Russisch–Deutsch",
        kurz="Zweisprachige Zeigetafeln A4 für Patienten mit Sprachbarriere — "
             "Klinik, Pflegeheim und Pflege zu Hause",
        etsy="",
        hauptthema="pflege-organisation",
        themen=["pflege-organisation"],
    ),
    "Kommunikationsbuch Deutsch - Polnisch": dict(
        titel="Kommunikationsbuch Polnisch–Deutsch",
        kurz="Zweisprachige Zeigetafeln A4 für Patienten mit Sprachbarriere — "
             "Klinik, Pflegeheim und Pflege zu Hause",
        etsy="",
        hauptthema="pflege-organisation",
        themen=["pflege-organisation"],
    ),
    "Kommunikationsbuch Ukrainisch": dict(
        titel="Kommunikationsbuch Ukrainisch–Deutsch",
        kurz="Zweisprachige Zeigetafeln A4 für Patienten mit Sprachbarriere — "
             "Klinik, Pflegeheim und Pflege zu Hause",
        etsy="",
        hauptthema="pflege-organisation",
        themen=["pflege-organisation"],
    ),
    "Kommunikationsbuch Arabisch": dict(
        titel="Kommunikationsbuch Arabisch–Deutsch",
        kurz="Zweisprachige Zeigetafeln A4 für Patienten mit Sprachbarriere — "
             "Klinik, Pflegeheim und Pflege zu Hause",
        etsy="",
        hauptthema="pflege-organisation",
        themen=["pflege-organisation"],
    ),
}

# Buecher haben kein Etsy-Bild. Wer schon ein Cover im Repo hat, bekommt es hier.
BUCH_BILDER = {
    "Lernolotl in der Kita":        "/lernolotl/kita.jpg",
    "Lernolotl in der Schule":      "/lernolotl/schule.jpg",
    "Lernolotl Sport":              "/lernolotl/sport.jpg",
    "Lernolotl Freunde":            "/lernolotl/freunde.jpg",
    "Lernolotl Zuhause":            "/lernolotl/zuhause.jpg",
    "Lernolotl Ich bin ich":        "/lernolotl/ichbinich.jpg",
    "Der Familienakku":             "/bilder/buecher/der-familienakku/cover.jpg",
    "Guck mich an!":                "/bilder/buecher/guck-mich-an/cover.jpg",
    "Der Sorgenrucksack":           "/bilder/buecher/der-sorgenrucksack/cover.jpg",
    "Der Kümmerer-Funke":           "/bilder/buecher/der-kuemmerer-funke/cover.jpg",
    "Der Lernolotl ist besonders":  "/bilder/buecher/der-lernolotl-ist-besonders/cover.jpg",
    "Der Ruhe-Same":                "/bilder/buecher/der-ruhe-same/cover.jpg",
}
BUCH_BILDER["Ist mein Kind bereit für die Schule? – Das große Lernolotl Schulstarter-Heft"] = \
    "/lernolotl/schulstarterheft.jpg"

# ---------------------------------------------------------------------------
BREITE, HOEHE = 400, 400          # Kartenbilder sind quadratisch wie die Etsy-Fotos
MAX_BYTES     = 70 * 1024         # harte Obergrenze pro Bild
START_QUALI   = 72
MIN_QUALI     = 40
HINTERGRUND   = (248, 251, 252)   # Kartenfarbe, falls doch Raender noetig sind

CSV_PFAD   = "bibliothek/etsy-listings.csv"
JSON_PFAD  = "bibliothek/produkte.json"
JS_PFAD    = "bibliothek/bibliothek.js"
CSS_PFAD   = "bibliothek/bibliothek.css"
BILD_DIR   = "bilder/produkte"
BILD_WEB   = "/bilder/produkte"
THEMEN_DIR = "bibliothek"

MARK_A, MARK_E = "<!-- pbild -->", "<!-- /pbild -->"


# --------------------------------------------------------------------------- Hilfen
def norm(s):
    """Titel vergleichbar machen: Kleinschreibung, ohne Umlaute und Sonderzeichen."""
    s = (s or "").lower().replace("ß", "ss")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def lade_csv(pfad):
    with open(pfad, encoding="utf-8-sig", newline="") as f:
        return [z for z in csv.DictReader(f) if (z.get("TITEL") or "").strip()]


# --------------------------------------------------------------------------- Bild
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


def einpassen(bild, ziel, rand=0):
    """Bringt ein Bild auf Kartengroesse, OHNE etwas abzuschneiden.

    Frueher wurde mittig zugeschnitten - dabei fiel auf den Etsy-Fotos oben
    und unten der Text weg. Jetzt wird das ganze Bild eingepasst. Da die
    Karten quadratisch sind und die Etsy-Fotos ebenfalls, entstehen dabei
    in aller Regel nicht einmal Raender.
    """
    from PIL import Image

    bild = bild.convert("RGBA") if bild.mode in ("RGBA", "LA", "P") else bild.convert("RGB")
    flaeche = Image.new("RGB", (BREITE, HOEHE), HINTERGRUND)
    bild.thumbnail((BREITE - 2 * rand, HOEHE - 2 * rand), Image.LANCZOS)
    versatz = ((BREITE - bild.width) // 2, (HOEHE - bild.height) // 2)
    flaeche.paste(bild, versatz, bild if bild.mode == "RGBA" else None)

    for quali in range(START_QUALI, MIN_QUALI - 1, -6):
        puffer = io.BytesIO()
        flaeche.save(puffer, "JPEG", quality=quali, optimize=True, progressive=True)
        if puffer.tell() <= MAX_BYTES or quali == MIN_QUALI:
            os.makedirs(os.path.dirname(ziel), exist_ok=True)
            with open(ziel, "wb") as f:
                f.write(puffer.getvalue())
            return puffer.tell()
    return 0


def cover_verkleinern(quelle, ziel):
    """Buchcover aus dem Repo auf Kartengroesse bringen."""
    from PIL import Image
    return einpassen(Image.open(quelle), ziel, rand=6)


def bild_holen(url, ziel, sitzung):
    """Laedt ein Etsy-Foto und bringt es auf Kartengroesse."""
    from PIL import Image

    antwort = sitzung.get(url, timeout=45)
    antwort.raise_for_status()
    groesse = einpassen(Image.open(io.BytesIO(antwort.content)), ziel)
    return groesse, 0


# --------------------------------------------------------------------------- Zuordnung
def zuordnen(produkte, zeilen):
    """Ordnet CSV-Zeilen den Produkten zu. Rueckgabe: (Paare, uebrige CSV-Zeilen).

    Zwei Vorkehrungen gegen Verwechslungen:
    - Produkte mit dem laengsten Titel kommen zuerst dran. Sonst koennte
      "Kommunikationsbuch Deutsch" sich die Zeile von
      "Kommunikationsbuch Deutsch - Polnisch" greifen.
    - Passen mehrere Zeilen, gewinnt die kuerzeste: sie enthaelt die
      wenigsten Zusaetze und ist damit die engste Uebereinstimmung.
    """
    offen = [(norm(z["TITEL"]), z) for z in zeilen]
    vergeben, paare = set(), []

    kandidaten = [p for p in produkte if p.get("typ") == "pdf" and norm(p["titel"])]
    kandidaten.sort(key=lambda p: len(norm(p["titel"])), reverse=True)

    for p in kandidaten:
        n = norm(p["titel"])
        treffer = [i for i, (cn, _) in enumerate(offen)
                   if i not in vergeben and (cn.startswith(n) or n in cn)]
        if not treffer:
            continue
        beste = min(treffer, key=lambda i: len(offen[i][0]))
        vergeben.add(beste)
        paare.append((p, offen[beste][1]))

    uebrig = [z for i, (cn, z) in enumerate(offen) if i not in vergeben]
    return paare, uebrig


def neue_anlegen(daten, uebrig):
    """Legt Produkte an, die in der CSV stehen, aber noch nicht in der JSON."""
    vorhandene = {p["id"] for p in daten["produkte"]}
    nummer = max([int(re.sub(r"\D", "", i)) for i in vorhandene if i.startswith("etsy")] or [0])
    angelegt, ohne_url = [], []

    # Laengster Schluessel zuerst, sonst faengt "Kommunikationsbuch Deutsch"
    # die Zeile von "Kommunikationsbuch Deutsch - Polnisch" ab.
    schluessel_sortiert = sorted(NEUE_PRODUKTE.items(),
                                 key=lambda kv: len(norm(kv[0])), reverse=True)

    for zeile in uebrig:
        titel_csv = zeile["TITEL"]
        vorlage = None
        for schluessel, werte in schluessel_sortiert:
            if norm(titel_csv).startswith(norm(schluessel)):
                vorlage = werte
                break
        if vorlage is None:
            ohne_url.append(titel_csv)
            continue
        if any(norm(p["titel"]) == norm(vorlage["titel"]) for p in daten["produkte"]):
            continue          # steht schon in der Bibliothek
        if not (vorlage.get("etsy") or "").strip():
            ohne_url.append(titel_csv)
            continue

        nummer += 1
        produkt = {
            "id": "etsy-%03d" % nummer,
            "typ": "pdf",
            "titel": vorlage["titel"],
            "kurz": vorlage["kurz"],
            "alter": vorlage.get("alter", ""),
            "reihe": vorlage.get("reihe", ""),
            "band": "",
            "hauptthema": vorlage["hauptthema"],
            "themen": list(vorlage["themen"]),
            "amazon": None,
            "asin": "",
            "etsy": vorlage["etsy"].strip(),
        }
        daten["produkte"].append(produkt)
        angelegt.append((produkt, zeile))
    return angelegt, ohne_url


# --------------------------------------------------------------------------- Seiten
def themenseiten_bebildern(produkte):
    """Setzt <img> in die statischen Produktkarten unter bibliothek/.
    Nur Bilder, die wirklich auf der Platte liegen -- sonst entstuenden tote Pfade."""
    nach_titel = {esc(p["titel"]): p for p in produkte
                  if p.get("bild") and os.path.exists(p["bild"].lstrip("/"))}
    geaendert = eingesetzt = 0

    for wurzel, ordner, dateien in os.walk(THEMEN_DIR):
        for name in dateien:
            if not name.endswith(".html"):
                continue
            pfad = os.path.join(wurzel, name)
            text = open(pfad, encoding="utf-8").read()
            original = text

            def ersetze(treffer):
                nonlocal eingesetzt
                karte = treffer.group(0)
                # Nur Produktkarten. Acht Titel gibt es sowohl als Buch wie
                # als Geschichte -- ohne diese Pruefung wuerden sich die
                # beiden Skripte gegenseitig ueberschreiben.
                if 'class="tag frei"' in karte:
                    return karte
                titel = re.search(r"<h4>(.*?)</h4>", karte, re.S)
                if not titel:
                    return karte
                produkt = nach_titel.get(titel.group(1).strip())
                if not produkt:
                    return karte
                img = ('%s<img class="pbild" src="%s" alt="" width="%d" height="%d" '
                       'loading="lazy" decoding="async">%s\n'
                       % (MARK_A, produkt["bild"], BREITE, HOEHE, MARK_E))
                if MARK_A in karte:
                    # aelteren Block ersetzen -- die Bildmasse koennen sich
                    # geaendert haben, sonst springt das Layout beim Laden
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
    """Sorgt dafuer, dass auch die dynamischen Karten der Bibliothek das Bild zeigen."""
    if not os.path.exists(JS_PFAD):
        return False
    text = open(JS_PFAD, encoding="utf-8").read()
    if "e.bild" in text:
        return False
    original = text

    # 1. Das Feld "bild" aus produkte.json in den Karten-Datensatz uebernehmen
    if "bild:p.bild" not in text:
        text = re.sub(r"(band\s*:\s*p\.band)", r"\1,bild:p.bild", text, count=1)

    # 2. Das Bild vor dem Kopf der Karte ausgeben
    muster = re.compile(r"""(return\s*')(<article class="produkt">)(<div class="kopf">')""")
    bild_js = ("var b = e.bild ? '<img class=\"pbild\" src=\"'+esc(e.bild)+"
               "'\" alt=\"\" width=\"%d\" height=\"%d\" loading=\"lazy\" decoding=\"async\">' : '';\n    "
               % (BREITE, HOEHE))
    if muster.search(text):
        text = muster.sub(lambda m: bild_js + m.group(1) + m.group(2) + "'+b+'" + m.group(3),
                          text, count=1)
    else:
        return False

    if text == original:
        return False
    open(JS_PFAD, "w", encoding="utf-8").write(text)
    return True


# --------------------------------------------------------------------------- Ablauf
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--neu-laden", action="store_true",
                   help="vorhandene Bilder noch einmal herunterladen")
    p.add_argument("--ohne-download", action="store_true",
                   help="nur Zuordnung und Seiten, nichts herunterladen (zum Testen)")
    args = p.parse_args()

    if not os.path.exists(CSV_PFAD):
        print("Keine CSV unter %s - nichts zu tun." % CSV_PFAD)
        return 0

    zeilen = lade_csv(CSV_PFAD)
    daten = json.load(open(JSON_PFAD, encoding="utf-8"))
    print("CSV-Zeilen: %d | Produkte in der Bibliothek: %d"
          % (len(zeilen), len(daten["produkte"])))

    paare, uebrig = zuordnen(daten["produkte"], zeilen)
    print("CSV-Zeilen einem Produkt zugeordnet: %d" % len(paare))

    angelegt, ohne_url = neue_anlegen(daten, uebrig)
    if angelegt:
        print("Neu in die Bibliothek aufgenommen: %d" % len(angelegt))
        for produkt, _ in angelegt:
            print("   +", produkt["id"], produkt["titel"])
    if ohne_url:
        print("NICHT aufgenommen, weil in NEUE_PRODUKTE die Etsy-Adresse fehlt: %d"
              % len(ohne_url))
        for t in ohne_url:
            print("   -", t[:95])

    # --- Bilder ---
    sitzung = None
    if not args.ohne_download:
        import requests
        sitzung = requests.Session()
        sitzung.headers["User-Agent"] = "Mozilla/5.0 (Lernolotl Bilder-Import)"

    geladen = uebersprungen = fehler = 0
    groessen = []
    for produkt, zeile in paare + angelegt:
        url = (zeile.get("BILD1") or "").strip()
        if not url:
            continue
        datei = os.path.join(BILD_DIR, "%s.jpg" % produkt["id"])
        produkt["bild"] = "%s/%s.jpg" % (BILD_WEB, produkt["id"])

        if os.path.exists(datei) and format_passt(datei) and not args.neu_laden:
            uebersprungen += 1
            groessen.append(os.path.getsize(datei))
            continue
        if args.ohne_download:
            continue
        try:
            groesse, quali = bild_holen(url, datei, sitzung)
            groessen.append(groesse)
            geladen += 1
            if geladen % 25 == 0:
                print("   ... %d Bilder geladen" % geladen)
        except Exception as e:
            fehler += 1
            produkt.pop("bild", None)
            print("   ! %s: %s" % (produkt["id"], str(e)[:90]))

    # Buchcover, die schon im Repo liegen. Sie werden nicht direkt verlinkt,
    # sondern auf Kartengroesse gebracht - ein Druckcover kann sonst ueber
    # ein Megabyte gross sein und bremst die Bibliothek aus.
    buecher = 0
    for produkt in daten["produkte"]:
        quelle = BUCH_BILDER.get(produkt["titel"])
        # Entdecker-Baende: Cover werden automatisch gefunden, sobald sie
        # unter bilder/buecher/entdecker/band-01.jpg ... liegen
        if not quelle and produkt.get("reihe") == "Die kleinen Entdecker" and produkt.get("band"):
            quelle = "/bilder/buecher/entdecker/band-%02d.jpg" % int(produkt["band"])
        if not quelle or not os.path.exists(quelle.lstrip("/")):
            continue

        datei = os.path.join(BILD_DIR, "%s.jpg" % produkt["id"])
        web = "%s/%s.jpg" % (BILD_WEB, produkt["id"])
        if not os.path.exists(datei) or not format_passt(datei) or args.neu_laden:
            try:
                groesse = cover_verkleinern(quelle.lstrip("/"), datei)
                groessen.append(groesse)
            except Exception as e:
                print("   ! Cover %s: %s" % (produkt["id"], str(e)[:80]))
                continue
        if produkt.get("bild") != web:
            produkt["bild"] = web
        buecher += 1

    print("Bilder: %d geladen, %d schon vorhanden, %d Buchcover verknuepft, %d Fehler"
          % (geladen, uebersprungen, buecher, fehler))
    if groessen:
        print("Groesse: Durchschnitt %d KB, groesstes %d KB"
              % (sum(groessen) / len(groessen) / 1024, max(groessen) / 1024))

    # --- speichern und Seiten anpassen ---
    with open(JSON_PFAD, "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, indent=1)
        f.write("\n")

    seiten, karten = themenseiten_bebildern(daten["produkte"])
    print("Themenseiten: %d Dateien, %d Karten bebildert" % (seiten, karten))
    if css_ergaenzen():
        print("CSS-Regel ergaenzt")
    if js_ergaenzen():
        print("bibliothek.js ergaenzt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
