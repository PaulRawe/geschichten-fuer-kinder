#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lernolotl - Nicht mehr vorhandene Etsy-Produkte von der Website entfernen
=========================================================================

Wofuer
------
Wenn im Etsy-Shop aufgeraeumt wird (Listings geloescht oder deaktiviert),
zeigen die Geschichten, die Bibliothek und die Ratgeber-Boxen sonst weiter
auf Seiten, die es nicht mehr gibt. Dieses Skript gleicht ab und raeumt auf.

Wie es erkennt, was weg ist
---------------------------
Der Etsy-Export (CSV) enthaelt KEINE Listing-Nummern, nur Titel und Bilder.
Deshalb gibt es  bibliothek/etsy-zuordnung.json : Listing-Nummer <-> Titel
und Bildnummern. Ein Listing gilt als noch vorhanden, wenn in der neuen CSV
  - eine Zeile mit gleichem Titel steht (Gross-/Kleinschreibung, Umlaute und
    Sonderzeichen egal), ODER
  - eine Zeile dasselbe Hauptbild bzw. mindestens zwei gleiche Bilder hat
    (so ueberlebt auch ein Listing, dessen Titel du geaendert hast).
Alles andere aus der Zuordnung gilt als entfernt.

Was dann passiert
-----------------
1. bibliothek/produkte.json   PDF-Produkte fliegen raus, bei Buechern wird
                              nur der Etsy-Link geleert
2. bilder/produkte/<id>.jpg    Bild des entfernten Produkts wird geloescht
3. lernolotl/ratgeber.js       Eintrag des Ratgebers wird geloescht
4. alle .html / .js-Dateien    Links (<a ...>...</a>) auf das Listing werden
                              entfernt. Ist danach ein ganzer Kasten leer
                              (Materialien, Bundle, Sticky-Leiste, Ratgeber-
                              Box, Vorlesekarten-Tipp), faellt er mit raus.
5. bibliothek/etsy-zuordnung.json wird auf den neuen Stand gebracht
6. _werkstatt/etsy-abgleich-bericht.md  Bericht, was entfernt wurde

Sicherheitsbremse: Wuerden mehr als 40 % aller bekannten Listings entfernt,
bricht das Skript ab (dann ist meist die falsche oder eine halbe CSV
hochgeladen). Mit --erzwingen geht es trotzdem.

Aufruf
------
    python3 scripts/etsy_aufraeumen.py                 # aufraeumen
    python3 scripts/etsy_aufraeumen.py --nur-pruefen   # nur Bericht, nichts aendern
    python3 scripts/etsy_aufraeumen.py --csv pfad.csv  # andere CSV verwenden
"""

import argparse
import csv
import datetime
import json
import os
import re
import sys
import unicodedata

CSV_PFAD       = "bibliothek/etsy-listings.csv"
ZUORDNUNG_PFAD = "bibliothek/etsy-zuordnung.json"
JSON_PFAD      = "bibliothek/produkte.json"
RATGEBER_JS    = "lernolotl/ratgeber.js"
BILD_DIR       = "bilder/produkte"
BERICHT_PFAD   = "_werkstatt/etsy-abgleich-bericht.md"

MAX_ANTEIL = 0.40          # Sicherheitsbremse
MIN_ZEILEN = 10

UEBERSPRINGEN = {".git", "node_modules", "_werkstatt", ".github"}

LISTING_RE = re.compile(r"etsy\.com/(?:[a-z]{2}(?:-[a-z]{2})?/)?listing/(\d+)", re.I)
BILD_RE    = re.compile(r"il_[0-9a-z]+\.(\d+)", re.I)

# Kaesten, die komplett verschwinden, wenn kein Etsy-Link mehr drin ist.
# (Merkmal im oeffnenden Tag, Tagname)
KAESTEN = [
    (r'class="[^"]*\blernmaterial-section\b', "div"),
    (r'id="bundle-auswahl"',                  "div"),
    (r'class="[^"]*\bsticky-bundle-bar\b(?!-)', "div"),
    (r'class="[^"]*\bratgeber-box\b(?!__)',   "div"),
    (r'id="vorlesekarten-cta"',               "div"),
]


# --------------------------------------------------------------------------- Hilfen
def norm(s):
    s = (s or "").lower().replace("ß", "ss")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def bild_ids(zeile):
    ids = []
    for k in range(1, 11):
        for m in BILD_RE.findall(zeile.get("BILD%d" % k) or ""):
            if m not in ids:
                ids.append(m)
    return ids


def lade_csv(pfad):
    with open(pfad, encoding="utf-8-sig", newline="") as f:
        return [z for z in csv.DictReader(f) if (z.get("TITEL") or "").strip()]


def listing_id(url):
    m = LISTING_RE.search(url or "")
    return m.group(1) if m else None


def lesen(pfad):
    with open(pfad, encoding="utf-8") as f:
        return f.read()


def schreiben(pfad, text):
    with open(pfad, "w", encoding="utf-8", newline="") as f:
        f.write(text)


# --------------------------------------------------------------------------- Abgleich
def abgleichen(zuordnung, zeilen):
    """Rueckgabe: (aktiv {listing_id: csv-zeile}, entfernt [eintraege])."""
    nach_titel = {}
    for z in zeilen:
        nach_titel.setdefault(norm(z["TITEL"]), z)
    zeilen_bilder = [(z, bild_ids(z)) for z in zeilen]

    aktiv, entfernt = {}, []
    for e in zuordnung:
        treffer = nach_titel.get(norm(e["titel"]))
        if treffer is None:
            bekannte = set(e.get("bild_ids") or [])
            for z, ids in zeilen_bilder:
                if not ids:
                    continue
                gemeinsam = bekannte & set(ids)
                if ids[0] in bekannte or len(gemeinsam) >= 2:
                    treffer = z
                    break
        if treffer is None:
            entfernt.append(e)
        else:
            aktiv[e["listing_id"]] = treffer
    return aktiv, entfernt


# --------------------------------------------------------------------------- HTML
A_TAG = re.compile(r"""<a\b(?:[^>"']|"[^"]*"|'[^']*')*>""", re.I)


def element_ende(text, start, tag):
    """Ende des Elements, das bei start mit <tag ...> beginnt (verschachtelt gezaehlt)."""
    muster = re.compile(r"<(/?)%s\b[^>]*>" % tag, re.I)
    tiefe = 0
    for m in muster.finditer(text, start):
        tiefe += -1 if m.group(1) else 1
        if tiefe == 0:
            return m.end()
    return -1


def zeile_mitnehmen(text, a, b):
    """Bereich auf ganze Zeilen erweitern, wenn davor/dahinter nur Leerraum steht."""
    zs = text.rfind("\n", 0, a) + 1
    if text[zs:a].strip() == "":
        a = zs
    ze = text.find("\n", b)
    ze = len(text) if ze == -1 else ze
    if text[b:ze].strip() == "":
        b = min(len(text), ze + 1)
    return a, b


def kommentar_davor(text, a):
    """Steht direkt davor eine Kommentarzeile wie <!-- CTA #1 -->, mit entfernen."""
    davor = text[:a]
    m = re.search(r"[ \t]*<!--(?:(?!-->).){0,200}-->[ \t]*\n$", davor, re.S)
    return m.start() if m else a


def kaesten_finden(text):
    gefunden = []
    for merkmal, tag in KAESTEN:
        for m in re.finditer(r"<%s\b[^>]*%s[^>]*>" % (tag, merkmal), text, re.I):
            ende = element_ende(text, m.start(), tag)
            if ende > 0:
                gefunden.append((m.start(), ende))
    return gefunden


def links_entfernen(text, weg_ids):
    """Entfernt <a>-Elemente auf entfernte Listings. Rueckgabe: (text, anzahl)."""
    if not LISTING_RE.search(text):
        return text, 0

    vorher_kaesten = [(a, b, bool(LISTING_RE.search(text[a:b]))) for a, b in kaesten_finden(text)]

    bereiche = []
    for m in A_TAG.finditer(text):
        lid = listing_id(m.group(0))
        if lid not in weg_ids:
            continue
        ende = text.find("</a>", m.end())
        if ende == -1:
            continue
        a, b = m.start(), ende + 4
        a = kommentar_davor(text, zeile_mitnehmen(text, a, b)[0])
        a, b = zeile_mitnehmen(text, a, b)
        bereiche.append((a, b))

    if not bereiche:
        return text, 0

    # Kaesten, die vorher Etsy-Links hatten und danach keine mehr haetten
    for ka, kb, hatte in vorher_kaesten:
        if not hatte:
            continue
        rest = text[ka:kb]
        for a, b in sorted(bereiche, reverse=True):
            if ka <= a and b <= kb:
                rest = rest[:a - ka] + rest[b - ka:]
        if not LISTING_RE.search(rest):
            ka2 = kommentar_davor(text, zeile_mitnehmen(text, ka, kb)[0])
            ka2, kb2 = zeile_mitnehmen(text, ka2, kb)
            bereiche.append((ka2, kb2))

    # ueberlappende Bereiche zusammenfassen und von hinten entfernen
    bereiche.sort()
    zusammen = []
    for a, b in bereiche:
        if zusammen and a <= zusammen[-1][1]:
            zusammen[-1] = (zusammen[-1][0], max(b, zusammen[-1][1]))
        else:
            zusammen.append((a, b))
    for a, b in reversed(zusammen):
        text = text[:a] + text[b:]
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text, len([1 for _ in bereiche])


# --------------------------------------------------------------------------- ratgeber.js
def ratgeber_bereinigen(text, weg_ids):
    """Entfernt Objekte { ... etsy: ".../listing/ID/..." ... } aus dem RATGEBER-Array."""
    entfernt = []
    for m in reversed(list(re.finditer(r'etsy\s*:\s*["\']([^"\']*)["\']', text))):
        lid = listing_id(m.group(1))
        if lid not in weg_ids:
            continue
        a = text.rfind("{", 0, m.start())
        b = text.find("}", m.end())
        if a == -1 or b == -1 or "{" in text[a + 1:m.start()] or "}" in text[a:m.start()]:
            continue
        titel = re.search(r'titel\s*:\s*"([^"]*)"', text[a:b])
        entfernt.append(titel.group(1) if titel else lid)
        b += 1
        komma = re.match(r"\s*,", text[b:])
        if komma:
            b += komma.end()
        a, b = zeile_mitnehmen(text, a, b)
        text = text[:a] + text[b:]
    # Komma vor schliessender Klammer ist in JS erlaubt, aber sauber halten
    return text, list(reversed(entfernt))


# --------------------------------------------------------------------------- Hauptteil
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default=CSV_PFAD)
    ap.add_argument("--nur-pruefen", action="store_true")
    ap.add_argument("--erzwingen", action="store_true")
    args = ap.parse_args()

    if not os.path.exists(args.csv) or not os.path.exists(ZUORDNUNG_PFAD):
        print("CSV oder Zuordnung fehlt - nichts zu tun.")
        return 0

    zeilen = lade_csv(args.csv)
    z_daten = json.load(open(ZUORDNUNG_PFAD, encoding="utf-8"))
    zuordnung = z_daten["listings"]
    daten = json.load(open(JSON_PFAD, encoding="utf-8"))

    # Produkte mit Etsy-Link, die (noch) nicht in der Zuordnung stehen: ueber den
    # kurzen Produkttitel nachtragen, damit auch sie kuenftig erkannt werden.
    bekannt = {e["listing_id"] for e in zuordnung}
    for p in daten["produkte"]:
        lid = listing_id(p.get("etsy"))
        if not lid or lid in bekannt:
            continue
        n = norm(p.get("titel"))
        passend = [z for z in zeilen if n and (norm(z["TITEL"]).startswith(n) or n in norm(z["TITEL"]))]
        if passend:
            z = min(passend, key=lambda z: len(z["TITEL"]))
            zuordnung.append({"listing_id": lid, "titel": z["TITEL"].strip(),
                              "bild_ids": bild_ids(z), "produkt_id": p["id"],
                              "link": p["etsy"]})
            bekannt.add(lid)
            print("Zuordnung ergaenzt:", p["id"], p["titel"])

    print("CSV-Zeilen: %d | bekannte Listings: %d" % (len(zeilen), len(zuordnung)))
    if len(zeilen) < MIN_ZEILEN:
        print("ABBRUCH: Die CSV hat nur %d Zeilen - das sieht nicht nach dem ganzen Shop aus." % len(zeilen))
        return 1

    aktiv, entfernt = abgleichen(zuordnung, zeilen)
    weg_ids = {e["listing_id"] for e in entfernt}
    print("Noch vorhanden: %d | Nicht mehr im Shop: %d" % (len(aktiv), len(entfernt)))
    for e in entfernt:
        print("   -", e["listing_id"], e["titel"][:90])

    anteil = len(entfernt) / max(1, len(zuordnung))
    if anteil > MAX_ANTEIL and not args.erzwingen:
        print("ABBRUCH: %.0f %% der Listings wuerden entfernt (Grenze %.0f %%). "
              "Falsche CSV? Mit --erzwingen trotzdem ausfuehren." % (anteil * 100, MAX_ANTEIL * 100))
        return 1

    bericht = ["# Etsy-Abgleich vom %s" % datetime.date.today().isoformat(), "",
               "- CSV-Zeilen: **%d**" % len(zeilen),
               "- Bekannte Listings: **%d**" % len(zuordnung),
               "- Nicht mehr im Shop: **%d**" % len(entfernt), ""]
    if entfernt:
        bericht += ["## Entfernte Listings", ""]
        bericht += ["- `%s` %s" % (e["listing_id"], e["titel"]) for e in entfernt]
        bericht.append("")

    # CSV-Zeilen ohne bekanntes Listing (neue Produkte) nur melden
    zugeordnet = {id(z) for z in aktiv.values()}
    neu = [z["TITEL"].strip() for z in zeilen if id(z) not in zugeordnet]

    if args.nur_pruefen:
        print("\n--nur-pruefen: es wurde nichts geaendert.")
        return 0

    # 1+2: produkte.json und Bilder
    raus_produkte, buch_geleert, bilder_weg = [], [], []
    bleiben = []
    for p in daten["produkte"]:
        lid = listing_id(p.get("etsy"))
        if lid in weg_ids:
            if p.get("typ") == "pdf":
                raus_produkte.append(p)
                if p.get("bild"):
                    datei = p["bild"].lstrip("/")
                    if os.path.exists(datei):
                        os.remove(datei)
                        bilder_weg.append(datei)
                continue
            p["etsy"] = None
            buch_geleert.append(p)
        bleiben.append(p)
    if raus_produkte or buch_geleert:
        daten["produkte"] = bleiben
        daten["stand"] = datetime.date.today().isoformat()
        schreiben(JSON_PFAD, json.dumps(daten, ensure_ascii=False, indent=1) + "\n")

    # 3: ratgeber.js
    ratgeber_weg = []
    if os.path.exists(RATGEBER_JS):
        t = lesen(RATGEBER_JS)
        t2, ratgeber_weg = ratgeber_bereinigen(t, weg_ids)
        if t2 != t:
            schreiben(RATGEBER_JS, t2)

    # 4: alle HTML- und JS-Dateien
    geaendert = []
    for wurzel, ordner, dateien in os.walk("."):
        ordner[:] = [o for o in ordner if o not in UEBERSPRINGEN]
        for name in dateien:
            if not name.endswith((".html", ".htm", ".js")):
                continue
            pfad = os.path.join(wurzel, name)
            t = lesen(pfad)
            t2, n = links_entfernen(t, weg_ids)
            if n:
                schreiben(pfad, t2)
                geaendert.append((pfad[2:], n))

    # Reste melden: Listing-Nummern, die noch irgendwo stehen
    reste = []
    for wurzel, ordner, dateien in os.walk("."):
        ordner[:] = [o for o in ordner if o not in UEBERSPRINGEN]
        for name in dateien:
            if name.endswith((".html", ".htm", ".js", ".json")) and name != os.path.basename(ZUORDNUNG_PFAD):
                pfad = os.path.join(wurzel, name)
                for lid in set(LISTING_RE.findall(lesen(pfad))) & weg_ids:
                    reste.append((pfad[2:], lid))

    # 5: Zuordnung aktualisieren (Titel/Bilder auf neuen Stand, entfernte raus)
    neu_zuordnung = []
    for e in zuordnung:
        if e["listing_id"] in weg_ids:
            continue
        z = aktiv[e["listing_id"]]
        e["titel"] = z["TITEL"].strip()
        e["bild_ids"] = sorted(set(e.get("bild_ids") or []) | set(bild_ids(z)))
        neu_zuordnung.append(e)
    z_daten["listings"] = sorted(neu_zuordnung, key=lambda e: e["listing_id"])
    z_daten["stand"] = datetime.date.today().isoformat()
    schreiben(ZUORDNUNG_PFAD, json.dumps(z_daten, ensure_ascii=False, indent=1) + "\n")

    # 6: Bericht
    if raus_produkte:
        bericht += ["## Aus der Bibliothek entfernt (%d)" % len(raus_produkte), ""]
        bericht += ["- %s %s" % (p["id"], p["titel"]) for p in raus_produkte] + [""]
    if buch_geleert:
        bericht += ["## Buecher: nur Etsy-Link entfernt", ""]
        bericht += ["- %s %s" % (p["id"], p["titel"]) for p in buch_geleert] + [""]
    if ratgeber_weg:
        bericht += ["## Ratgeber-Boxen entfernt (lernolotl/ratgeber.js)", ""]
        bericht += ["- %s" % t for t in ratgeber_weg] + [""]
    if geaendert:
        bericht += ["## Links aus Seiten entfernt", ""]
        bericht += ["- %s (%d Stellen)" % (p, n) for p, n in sorted(geaendert)] + [""]
    if bilder_weg:
        bericht += ["## Geloeschte Produktbilder: %d" % len(bilder_weg), ""]
    if reste:
        bericht += ["## ACHTUNG: Hier steht noch ein entfernter Link (bitte von Hand pruefen)", ""]
        bericht += ["- %s -> Listing %s" % r for r in sorted(set(reste))] + [""]
    if neu:
        bericht += ["## Neu in der CSV, aber (noch) ohne Etsy-Adresse auf der Website", ""]
        bericht += ["- %s" % t for t in neu] + [""]

    os.makedirs(os.path.dirname(BERICHT_PFAD), exist_ok=True)
    schreiben(BERICHT_PFAD, "\n".join(bericht) + "\n")
    print("\n".join(bericht))
    return 0


if __name__ == "__main__":
    sys.exit(main())
