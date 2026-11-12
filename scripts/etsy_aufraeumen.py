#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lernolotl / NeuroTeacherTools - Nicht mehr vorhandene Etsy-Produkte entfernen
=============================================================================

Dasselbe Skript liegt in allen drei Website-Repos:
  geschichten-fuer-kinder          (lernolotl.de)
  autismus-adhs-erfahrungswissen   (autismus-adhs-alltag.de)
  autism-adhd-family               (autismfamilyguide.com)
Was es in welchem Repo tun soll, steht in  etsy-abgleich.json  im Repo-Hauptordner.

Wie es erkennt, was weg ist
---------------------------
Der Etsy-Export (CSV) enthaelt KEINE Listing-Nummern, nur Titel und Bilder.
Deshalb gibt es eine Zuordnungsdatei: Listing-Nummer <-> Titel + Bildnummern.
Ein Listing gilt als noch vorhanden, wenn in der neuen CSV
  - eine Zeile mit gleichem Titel steht (Umlaute/Sonderzeichen egal), ODER
  - eine Zeile dasselbe Hauptbild bzw. mindestens zwei gleiche Bilder hat
    (so ueberlebt auch ein Listing, dessen Titel geaendert wurde).
Alles andere aus der Zuordnung gilt als entfernt. Listing-Nummern, die gar
nicht in der Zuordnung stehen, werden NIE angefasst, nur gemeldet.

Was dann passiert
-----------------
1. Produktseiten (z.B. Leseproben/Previews) eines entfernten Produkts werden
   geloescht - und alle Links darauf von den anderen Seiten entfernt,
   ebenso die Eintraege in sitemap.xml und URL-Listen (.txt).
2. Produktkarten (ganze Kaesten mit Bild, Text, Preis, Gumroad- und
   Etsy-Knopf) eines entfernten Produkts werden komplett entfernt.
3. Uebrige Links auf entfernte Listings fliegen raus. Ist danach ein Kasten
   leer (Bundle-Leiste, Lernmaterialien, Ratgeber-Box, ...), faellt er mit.
4. Nur lernolotl.de: produkte.json (+ Produktbild) und ratgeber.js.
5. Zuordnung wird auf den neuen Stand gebracht, Bericht wird geschrieben.

Sicherheitsbremse: Wuerden mehr als 50 % aller bekannten Listings entfernt,
bricht das Skript ab (meist falsche oder halbe CSV). --erzwingen hebt sie auf.

Aufruf
------
    python3 scripts/etsy_aufraeumen.py                 # aufraeumen
    python3 scripts/etsy_aufraeumen.py --nur-pruefen   # nur Bericht, nichts aendern
    python3 scripts/etsy_aufraeumen.py --csv datei.csv # andere CSV verwenden
"""

import argparse
import csv
import datetime
import json
import os
import re
import sys
import unicodedata
from urllib.parse import unquote, urlparse

KONFIG_PFAD = "etsy-abgleich.json"
STANDARD = {
    "csv": "bibliothek/etsy-listings.csv",
    "zuordnung": "bibliothek/etsy-zuordnung.json",
    "bericht": "_werkstatt/etsy-abgleich-bericht.md",
    "produkte_json": None,          # nur lernolotl.de
    "produktbilder": None,          # Ordner der Produktbilder zu produkte.json
    "ratgeber_js": None,            # nur lernolotl.de
    "produktseiten_ordner": [],     # Ordner mit Seiten je Produkt (Leseproben ...)
    "zusaetzlich_loeschen": [],     # Produktseiten ohne Etsy-Link, die weg sollen
    "karten_klassen": [],           # Klassen ganzer Produktkarten
    "leere_kaesten": [],            # weitere Kaesten, die leer verschwinden
    "abschnitt_ueberschriften": [], # Klassen von Zwischenueberschriften (z.B. category-header)
    "raster_klassen": [],           # Klassen der Kartenraster (z.B. products-grid)
    "ueberspringen": [".git", "node_modules", ".github"],
    "eigene_domains": [],           # absolute Bild-URLs dieser Domains zaehlen als eigene
    "max_anteil": 0.50,
}

MIN_ZEILEN = 10

LISTING_RE = re.compile(r"etsy\.com/(?:[a-z]{2}(?:-[a-z]{2})?/)?listing/(\d+)", re.I)
BILD_RE    = re.compile(r"il_[0-9a-z]+\.(\d+)", re.I)
A_TAG      = re.compile(r"""<a\b(?:[^>"']|"[^"]*"|'[^']*')*>""", re.I)
HREF_RE    = re.compile(r"""\bhref\s*=\s*(["'])(.*?)\1""", re.I | re.S)

# Kaesten, die verschwinden, sobald kein Etsy-Link mehr drin ist (alle Repos)
KAESTEN = [
    'class="[^"]*\\blernmaterial-section\\b',
    'id="bundle-auswahl"',
    'class="[^"]*\\bsticky-bundle-bar\\b(?!-)',
    'class="[^"]*\\bratgeber-box\\b(?!__)',
    'id="vorlesekarten-cta"',
]

# Faellt ein Kasten (links) weg, gehen diese Begleit-Elemente (rechts) mit,
# z.B. der Trenner "oder noch besser" unter den weggefallenen Einzelprodukten.
MIT_ENTFERNEN = {
    'class="[^"]*\\blernmaterial-section\\b': ['class="[^"]*\\bbundle-divider\\b'],
}


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
    with open(pfad, encoding="utf-8", errors="surrogateescape") as f:
        return f.read()


def schreiben(pfad, text):
    with open(pfad, "w", encoding="utf-8", errors="surrogateescape", newline="") as f:
        f.write(text)


def dateien(cfg, endungen):
    for wurzel, ordner, namen in os.walk("."):
        ordner[:] = sorted(o for o in ordner if o not in cfg["ueberspringen"])
        for name in sorted(namen):
            if name.lower().endswith(endungen):
                yield os.path.normpath(os.path.join(wurzel, name))


# --------------------------------------------------------------------------- Abgleich
def abgleichen(zuordnung, zeilen):
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
                if ids and (ids[0] in bekannte or len(bekannte & set(ids)) >= 2):
                    treffer = z
                    break
        if treffer is None:
            entfernt.append(e)
        else:
            aktiv[e["listing_id"]] = treffer
    return aktiv, entfernt


# --------------------------------------------------------------------------- HTML-Bausteine
def element_ende(text, start, tag):
    muster = re.compile(r"<(/?)%s\b[^>]*>" % tag, re.I)
    tiefe = 0
    for m in muster.finditer(text, start):
        tiefe += -1 if m.group(1) else 1
        if tiefe == 0:
            return m.end()
    return -1


def zeile_mitnehmen(text, a, b):
    zs = text.rfind("\n", 0, a) + 1
    if text[zs:a].strip() == "":
        a = zs
    ze = text.find("\n", b)
    ze = len(text) if ze == -1 else ze
    if text[b:ze].strip() == "":
        b = min(len(text), ze + 1)
    return a, b


def kommentar_davor(text, a):
    m = re.search(r"[ \t]*<!--(?:(?!-->).){0,200}-->[ \t]*\n(?:[ \t]*\n)*$", text[:a], re.S)
    return m.start() if m else a


def bereich(text, a, b):
    """Elementbereich inkl. eigener Zeile und Kommentarzeile darueber."""
    a, b = zeile_mitnehmen(text, a, b)
    return zeile_mitnehmen(text, kommentar_davor(text, a), b)


def elemente(text, merkmal):
    """Alle (start, ende) von Elementen, deren oeffnender Tag das Merkmal hat."""
    gefunden = []
    for m in re.finditer(r"<(div|article|section|li|aside)\b[^>]*%s[^>]*>" % merkmal, text, re.I):
        ende = element_ende(text, m.start(), m.group(1))
        if ende > 0:
            gefunden.append((m.start(), ende))
    return gefunden


def entfernen(text, bereiche):
    bereiche = sorted(bereiche)
    zusammen = []
    for a, b in bereiche:
        if zusammen and a <= zusammen[-1][1]:
            zusammen[-1] = (zusammen[-1][0], max(b, zusammen[-1][1]))
        else:
            zusammen.append((a, b))
    for a, b in reversed(zusammen):
        text = text[:a] + text[b:]
    return re.sub(r"\n[ \t]*\n([ \t]*\n)+", "\n\n", text)


# --------------------------------------------------------------------------- Seiten-Links
class Ziele:
    """Erkennt Links auf geloeschte Produktseiten (relativ, absolut, %20 ...)."""

    def __init__(self, seiten):
        self.seiten = [s.replace(os.sep, "/") for s in seiten]

    def trifft(self, href, aus_datei):
        if not self.seiten or not href:
            return False
        h = unquote(href.strip())
        if h.startswith(("mailto:", "tel:", "#", "javascript:")):
            return False
        pfad = urlparse(h).path if "://" in h or h.startswith("//") else h.split("#")[0].split("?")[0]
        if not pfad.lower().endswith((".html", ".htm")):
            return False
        if pfad.startswith("/") or "://" in h or h.startswith("//"):
            ziel = pfad.lstrip("/")
        else:
            ziel = os.path.normpath(os.path.join(os.path.dirname(aus_datei), pfad)).replace(os.sep, "/")
        return ziel in self.seiten


def link_ziel(tag):
    m = HREF_RE.search(tag)
    return m.group(2) if m else ""


# --------------------------------------------------------------------------- eine Datei
def datei_bereinigen(pfad, text, weg_ids, aktiv_ids, ziele, cfg):
    """Rueckgabe: (neuer Text, Anzahl entfernter Stellen)."""
    hat_etsy = bool(LISTING_RE.search(text))
    if not hat_etsy and not ziele.seiten:
        return text, 0

    def ist_weg_link(tag):
        lid = listing_id(link_ziel(tag))
        if lid:
            return lid in weg_ids
        return ziele.trifft(link_ziel(tag), pfad)

    # Alle betroffenen <a>-Elemente
    anker = []
    for m in A_TAG.finditer(text):
        if not ist_weg_link(m.group(0)):
            continue
        ende = text.find("</a>", m.end())
        if ende != -1:
            anker.append((m.start(), ende + 4))
    if not anker:
        return text, 0

    bereiche = []

    # 1) ganze Produktkarten
    karten = []
    for klasse in cfg["karten_klassen"]:
        karten += elemente(text, r'class="(?:[^"]*\s)?%s(?:\s[^"]*)?"' % re.escape(klasse))
    karten = sorted(set(karten))
    innerste = [k for k in karten if not any(o != k and k[0] <= o[0] and o[1] <= k[1] for o in karten)]
    for ka, kb in innerste:
        inhalt = text[ka:kb]
        betroffen = any(ka <= a and b <= kb for a, b in anker)
        noch_aktiv = any(i in aktiv_ids for i in LISTING_RE.findall(inhalt))
        etsy_im_kasten = LISTING_RE.findall(inhalt)
        # Karte faellt, wenn sie auf ein entferntes Listing zeigt und auf kein
        # aktives - oder (ohne Etsy-Link) nur auf eine geloeschte Produktseite.
        if betroffen and not noch_aktiv and (any(i in weg_ids for i in etsy_im_kasten) or not etsy_im_kasten):
            bereiche.append(bereich(text, ka, kb))

    # 2) einzelne Links
    for a, b in anker:
        if not any(x <= a and b <= y for x, y in bereiche):
            bereiche.append(bereich(text, a, b))

    # 3) Kaesten, die vorher Etsy-Links hatten und danach keine mehr haetten
    merkmale = KAESTEN + list(cfg["leere_kaesten"])
    for merkmal in merkmale:
        for ka, kb in elemente(text, merkmal):
            if not LISTING_RE.search(text[ka:kb]):
                continue
            rest = text[ka:kb]
            for a, b in sorted(bereiche, reverse=True):
                if ka <= a and b <= kb:
                    rest = rest[:a - ka] + rest[b - ka:]
            if not LISTING_RE.search(rest):
                bereiche.append(bereich(text, ka, kb))
                for begleit in MIT_ENTFERNEN.get(merkmal, []):
                    for ba, bb in elemente(text, begleit):
                        bereiche.append(bereich(text, ba, bb))

    neu = entfernen(text, bereiche)
    neu = abschnitte_aufraeumen(text, neu, cfg)
    return neu, len(bereiche)


def klassen_muster(klasse):
    return r'class="(?:[^"]*\s)?%s(?:\s[^"]*)?"' % re.escape(klasse)


def karten_zahl(text, a, b, cfg):
    stueck = text[a:b]
    return sum(len(re.findall(r"<(?:div|article|section|li)\b[^>]*%s" % klassen_muster(k), stueck))
               for k in cfg["karten_klassen"])


def abschnitte_aufraeumen(alt, neu, cfg):
    """Zwischenueberschriften, unter denen vorher Karten standen und jetzt keine
    mehr, verschwinden samt leerem Kartenraster. Sprunglinks (href="#...") auf
    dadurch verschwundene Anker werden ebenfalls entfernt."""
    if not cfg["abschnitt_ueberschriften"] or alt == neu:
        return neu

    def kopfe(text):
        k = []
        for klasse in cfg["abschnitt_ueberschriften"]:
            k += elemente(text, klassen_muster(klasse))
        return sorted(k)

    k_alt, k_neu = kopfe(alt), kopfe(neu)
    if len(k_alt) != len(k_neu):
        return neu
    bereiche = []
    for i, ((aa, ae), (na, ne)) in enumerate(zip(k_alt, k_neu)):
        alt_ende = k_alt[i + 1][0] if i + 1 < len(k_alt) else len(alt)
        neu_ende = k_neu[i + 1][0] if i + 1 < len(k_neu) else len(neu)
        if karten_zahl(alt, ae, alt_ende, cfg) and not karten_zahl(neu, ne, neu_ende, cfg):
            bereiche.append(bereich(neu, na, ne))
            for klasse in cfg["raster_klassen"]:
                for ra, rb in elemente(neu[:neu_ende], klassen_muster(klasse)):
                    if ra >= ne and not re.sub(r"<!--.*?-->|<[^>]+>|\s", "", neu[ra:rb], flags=re.S):
                        bereiche.append(bereich(neu, ra, rb))
    if not bereiche:
        return neu
    neu = entfernen(neu, bereiche)

    ids_alt = set(re.findall(r'\bid="([^"]+)"', alt))
    ids_neu = set(re.findall(r'\bid="([^"]+)"', neu))
    weg_anker = ids_alt - ids_neu
    if weg_anker:
        raus = []
        for m in A_TAG.finditer(neu):
            ziel = link_ziel(m.group(0))
            if ziel.startswith("#") and ziel[1:] in weg_anker:
                ende = neu.find("</a>", m.end())
                if ende != -1:
                    raus.append(zeile_mitnehmen(neu, m.start(), ende + 4))
        neu = entfernen(neu, raus)
    return neu


def ratgeber_bereinigen(text, weg_ids):
    entfernt = []
    for m in reversed(list(re.finditer(r'etsy\s*:\s*["\']([^"\']*)["\']', text))):
        lid = listing_id(m.group(1))
        if lid not in weg_ids:
            continue
        a = text.rfind("{", 0, m.start())
        b = text.find("}", m.end())
        if a == -1 or b == -1 or "}" in text[a:m.start()]:
            continue
        titel = re.search(r'titel\s*:\s*"([^"]*)"', text[a:b])
        entfernt.append(titel.group(1) if titel else lid)
        b += 1
        komma = re.match(r"\s*,", text[b:])
        if komma:
            b += komma.end()
        a, b = zeile_mitnehmen(text, a, b)
        text = text[:a] + text[b:]
    return text, list(reversed(entfernt))


def sitemap_bereinigen(text, urls_weg):
    def raus(m):
        return "" if any(u in unquote(m.group(0)) for u in urls_weg) else m.group(0)
    return re.sub(r"[ \t]*<url>.*?</url>[ \t]*\n?", raus, text, flags=re.S)


# --------------------------------------------------------------------------- Hauptteil
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv")
    ap.add_argument("--nur-pruefen", action="store_true")
    ap.add_argument("--erzwingen", action="store_true")
    args = ap.parse_args()

    cfg = dict(STANDARD)
    if os.path.exists(KONFIG_PFAD):
        cfg.update(json.load(open(KONFIG_PFAD, encoding="utf-8")))
    csv_pfad = args.csv or cfg["csv"]

    if not os.path.exists(csv_pfad) or not os.path.exists(cfg["zuordnung"]):
        print("CSV (%s) oder Zuordnung (%s) fehlt - nichts zu tun." % (csv_pfad, cfg["zuordnung"]))
        return 0

    zeilen = lade_csv(csv_pfad)
    z_daten = json.load(open(cfg["zuordnung"], encoding="utf-8"))
    zuordnung = z_daten["listings"]
    daten = None
    if cfg["produkte_json"] and os.path.exists(cfg["produkte_json"]):
        daten = json.load(open(cfg["produkte_json"], encoding="utf-8"))

    # Produkte mit Etsy-Link, die noch nicht in der Zuordnung stehen, nachtragen
    if daten:
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
    aktiv_ids = set(aktiv)
    print("Noch vorhanden: %d | Nicht mehr im Shop: %d" % (len(aktiv), len(entfernt)))

    anteil = len(entfernt) / max(1, len(zuordnung))
    if anteil > cfg["max_anteil"] and not args.erzwingen:
        print("ABBRUCH: %.0f %% der Listings wuerden entfernt (Grenze %.0f %%). "
              "Falsche CSV? Mit --erzwingen trotzdem ausfuehren." % (anteil * 100, cfg["max_anteil"] * 100))
        return 1

    # --- Produktseiten bestimmen
    seiten_weg = []
    for ordner in cfg["produktseiten_ordner"]:
        if not os.path.isdir(ordner):
            continue
        for pfad in dateien(dict(cfg, ueberspringen=cfg["ueberspringen"]), (".html", ".htm")):
            if not pfad.replace(os.sep, "/").startswith(ordner.rstrip("/") + "/"):
                continue
            ids = set(LISTING_RE.findall(lesen(pfad)))
            if ids & weg_ids and not ids & aktiv_ids:
                seiten_weg.append(pfad)
    for pfad in cfg["zusaetzlich_loeschen"]:
        if os.path.exists(pfad) and os.path.normpath(pfad) not in seiten_weg:
            seiten_weg.append(os.path.normpath(pfad))
    seiten_weg.sort()
    ziele = Ziele(seiten_weg)

    bericht = ["# Etsy-Abgleich vom %s" % datetime.date.today().isoformat(), "",
               "- CSV-Zeilen: **%d**" % len(zeilen),
               "- Bekannte Listings: **%d**" % len(zuordnung),
               "- Nicht mehr im Shop: **%d**" % len(entfernt),
               "- Produktseiten, die geloescht werden: **%d**" % len(seiten_weg), ""]
    if entfernt:
        bericht += ["## Nicht mehr im Shop", ""]
        bericht += ["- `%s` %s" % (e["listing_id"], e["titel"]) for e in entfernt] + [""]
    if seiten_weg:
        bericht += ["## Geloeschte Produktseiten", ""]
        bericht += ["- %s" % s for s in seiten_weg] + [""]

    if args.nur_pruefen:
        print("\n".join(bericht))
        print("\n--nur-pruefen: es wurde nichts geaendert.")
        return 0

    # Bildverweise merken, um danach verwaiste Bilder zu finden
    alte_bilder = set()

    def bilder_merken(text):
        for m in re.finditer(r'''(?:src|href|srcset|content)\s*=\s*["']([^"']+\.(?:png|jpe?g|webp|gif|svg))''', text, re.I):
            alte_bilder.add(m.group(1))

    # --- 1: Produktseiten loeschen
    for s in seiten_weg:
        bilder_merken(lesen(s))
        os.remove(s)

    # --- 4: produkte.json und Bilder (lernolotl.de)
    raus_produkte, buch_geleert, bilder_weg = [], [], []
    if daten:
        bleiben = []
        for p in daten["produkte"]:
            lid = listing_id(p.get("etsy"))
            if lid in weg_ids:
                if p.get("typ") == "pdf":
                    raus_produkte.append(p)
                    datei = (p.get("bild") or "").lstrip("/")
                    if datei and os.path.exists(datei):
                        os.remove(datei)
                        bilder_weg.append(datei)
                    continue
                p["etsy"] = None
                buch_geleert.append(p)
            bleiben.append(p)
        if raus_produkte or buch_geleert:
            daten["produkte"] = bleiben
            daten["stand"] = datetime.date.today().isoformat()
            schreiben(cfg["produkte_json"], json.dumps(daten, ensure_ascii=False, indent=1) + "\n")

    ratgeber_weg = []
    if cfg["ratgeber_js"] and os.path.exists(cfg["ratgeber_js"]):
        t = lesen(cfg["ratgeber_js"])
        t2, ratgeber_weg = ratgeber_bereinigen(t, weg_ids)
        if t2 != t:
            schreiben(cfg["ratgeber_js"], t2)

    # --- 2+3: Karten, Links, leere Kaesten in allen Seiten
    geaendert = []
    for pfad in dateien(cfg, (".html", ".htm", ".js")):
        t = lesen(pfad)
        t2, n = datei_bereinigen(pfad, t, weg_ids, aktiv_ids, ziele, cfg)
        if t2 != t:
            bilder_merken(t)
            schreiben(pfad, t2)
            geaendert.append((pfad, n))

    # --- Sitemaps und URL-Listen
    urls_weg = ["/" + s.replace(os.sep, "/") for s in seiten_weg]
    if urls_weg:
        for pfad in dateien(cfg, (".xml", ".txt")):
            t = lesen(pfad)
            if pfad.endswith(".xml"):
                t2 = sitemap_bereinigen(t, urls_weg)
            else:
                t2 = "".join(z for z in t.splitlines(True) if not any(u in unquote(z) for u in urls_weg))
            if t2 != t:
                schreiben(pfad, t2)
                geaendert.append((pfad, 0))

    # --- Bilder, auf die jetzt nichts mehr verweist, loeschen
    if alte_bilder:
        alles = "\n".join(unquote(lesen(p).replace("&amp;", "&"))
                          for p in dateien(cfg, (".html", ".htm", ".js", ".css", ".json", ".xml", ".md", ".txt")))
        for ref in sorted(alte_bilder):
            if "://" in ref and not any(ref.split("://", 1)[1].startswith(d) for d in cfg.get("eigene_domains", [])):
                continue
            name = os.path.basename(unquote(urlparse(ref).path).replace("&amp;", "&"))
            if not name or name in alles:
                continue
            treffer = [p for p in dateien(cfg, (os.path.splitext(name)[1].lower(),))
                       if os.path.basename(p) == name]
            for p in treffer:
                os.remove(p)
                bilder_weg.append(p)

    # --- Reste melden
    reste = []
    for pfad in dateien(cfg, (".html", ".htm", ".js", ".json", ".xml")):
        if os.path.normpath(pfad) == os.path.normpath(cfg["zuordnung"]):
            continue
        t = lesen(pfad)
        for lid in set(LISTING_RE.findall(t)) & weg_ids:
            reste.append((pfad, "Listing " + lid))
        for m in HREF_RE.finditer(t):
            if ziele.trifft(m.group(2), pfad):
                reste.append((pfad, "Link auf " + m.group(2)))

    unbekannt = set()
    for pfad in dateien(cfg, (".html", ".htm", ".js")):
        unbekannt |= set(LISTING_RE.findall(lesen(pfad)))
    unbekannt -= aktiv_ids | weg_ids

    # --- 5: Zuordnung aktualisieren
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
    schreiben(cfg["zuordnung"], json.dumps(z_daten, ensure_ascii=False, indent=1) + "\n")

    # --- Bericht
    if raus_produkte:
        bericht += ["## Aus der Bibliothek entfernt (%d)" % len(raus_produkte), ""]
        bericht += ["- %s %s" % (p["id"], p["titel"]) for p in raus_produkte] + [""]
    if buch_geleert:
        bericht += ["## Buecher: nur Etsy-Link entfernt", ""]
        bericht += ["- %s %s" % (p["id"], p["titel"]) for p in buch_geleert] + [""]
    if ratgeber_weg:
        bericht += ["## Ratgeber-Boxen entfernt", ""]
        bericht += ["- %s" % t for t in ratgeber_weg] + [""]
    if geaendert:
        bericht += ["## Bereinigte Dateien", ""]
        bericht += ["- %s%s" % (p, " (%d Stellen)" % n if n else "") for p, n in sorted(geaendert)] + [""]
    if bilder_weg:
        bericht += ["## Geloeschte Bilder (nirgends mehr verwendet): %d" % len(bilder_weg), ""]
        bericht += ["- %s" % b for b in sorted(bilder_weg) if not b.startswith("bilder/produkte/")] + [""]
    if reste:
        bericht += ["## ACHTUNG: Hier steht noch etwas Entferntes (bitte von Hand pruefen)", ""]
        bericht += ["- %s -> %s" % r for r in sorted(set(reste))] + [""]
    if unbekannt:
        bericht += ["## Etsy-Links, die keinem bekannten Listing zugeordnet sind (nicht angefasst)", ""]
        bericht += ["- %s" % i for i in sorted(unbekannt)] + [""]

    os.makedirs(os.path.dirname(cfg["bericht"]) or ".", exist_ok=True)
    schreiben(cfg["bericht"], "\n".join(bericht) + "\n")
    print("\n".join(bericht))
    return 0


if __name__ == "__main__":
    sys.exit(main())
